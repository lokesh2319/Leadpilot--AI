import { db } from './db.js';
import crypto from 'crypto';
import {
  createLocalIntegrationSecret,
  getLocalIntegration,
  resolveLocalWebhookSecret,
} from './localStore.js';

export interface IntegrationDoc {
  id: string; // e.g. 'zoho'
  workspaceId: string;
  provider: 'zoho' | 'hubspot' | 'generic';
  secretHash: string; // SHA-256 hash
  secretPrefix: string; // e.g. 'lp_zoho_1a2b...'
  status: 'active' | 'revoked';
  createdAt: string;
  updatedAt: string;
  lastUsedAt?: string;
}

export function hashSecret(secret: string): string {
  return crypto.createHash('sha256').update(secret.trim()).digest('hex');
}

function isFirestorePermissionError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err);
  return (
    err.code === 7 ||
    err.code === 'PERMISSION_DENIED' ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('Missing or insufficient permissions') ||
    msg.includes('NOT_FOUND') ||
    err.code === 5
  );
}

/**
 * Rotates or generates a new integration secret for a workspace.
 * Returns the raw token ONCE so it can be shown to the user.
 */
export async function createOrRotateIntegrationSecret(
  workspaceId: string,
  provider: 'zoho' | 'hubspot' | 'generic' = 'zoho'
): Promise<{ rawSecret: string; prefix: string }> {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawSecret = `lp_${provider}_${randomBytes}`;
  const secretHash = hashSecret(rawSecret);
  const prefix = `${rawSecret.substring(0, 14)}...`;

  try {
    const integrationRef = db
      .collection('companies')
      .doc(workspaceId)
      .collection('integrations')
      .doc(provider);

    // If previous integration exists, clean up old hash lookup
    const prevSnap = await integrationRef.get();
    if (prevSnap.exists) {
      const prevData = prevSnap.data() as IntegrationDoc;
      if (prevData?.secretHash) {
        await db.collection('integrationSecrets').doc(prevData.secretHash).delete().catch(() => {});
      }
    }

    const now = new Date().toISOString();
    const integrationData: IntegrationDoc = {
      id: provider,
      workspaceId,
      provider,
      secretHash,
      secretPrefix: prefix,
      status: 'active',
      createdAt: prevSnap.exists ? prevSnap.data()?.createdAt || now : now,
      updatedAt: now,
    };

    await integrationRef.set(integrationData);

    // Top-level fast O(1) hash lookup table: /integrationSecrets/{secretHash}
    await db.collection('integrationSecrets').doc(secretHash).set({
      workspaceId,
      provider,
      status: 'active',
      createdAt: now,
    });
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      return createLocalIntegrationSecret(workspaceId, provider);
    }
    console.error('Failed to create integration secret in Firestore, using local store:', err?.message || err);
    return createLocalIntegrationSecret(workspaceId, provider);
  }

  // Also sync locally
  try {
    createLocalIntegrationSecret(workspaceId, provider);
  } catch {}

  return { rawSecret, prefix };
}

/**
 * Verifies incoming webhook token and resolves the associated workspaceId.
 * Supports:
 * 1. Multi-tenant workspace token lookup via SHA-256 hash.
 * 2. Temporary backward-compatible fallback to process.env.WEBHOOK_SECRET
 *    (resolving to the primary active company or default workspace).
 */
export async function verifyAndResolveWebhookSecret(
  providedSecret: string
): Promise<{ workspaceId: string; provider: string; isLegacy?: boolean } | null> {
  if (!providedSecret || typeof providedSecret !== 'string') {
    return null;
  }

  const trimmed = providedSecret.trim();
  if (!trimmed) {
    return null;
  }

  const secretHash = hashSecret(trimmed);

  // 1. Check workspace-specific token from top-level hash index
  try {
    const secretDoc = await db.collection('integrationSecrets').doc(secretHash).get();
    if (secretDoc.exists) {
      const data = secretDoc.data()!;
      if (data.status === 'active' && data.workspaceId) {
        // Update lastUsedAt asynchronously in background
        db.collection('companies')
          .doc(data.workspaceId)
          .collection('integrations')
          .doc(data.provider || 'zoho')
          .update({ lastUsedAt: new Date().toISOString() })
          .catch(() => {});

        return {
          workspaceId: data.workspaceId,
          provider: data.provider || 'zoho',
        };
      }
    }
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      const localResolved = resolveLocalWebhookSecret(secretHash);
      if (localResolved) {
        return {
          workspaceId: localResolved.workspaceId,
          provider: localResolved.provider,
        };
      }
    }
  }

  // Check local store as well
  const localMatch = resolveLocalWebhookSecret(secretHash);
  if (localMatch) {
    return {
      workspaceId: localMatch.workspaceId,
      provider: localMatch.provider,
    };
  }

  // 2. Legacy fallback for existing WEBHOOK_SECRET
  const legacySecret = process.env.WEBHOOK_SECRET;
  if (legacySecret && legacySecret.length > 0 && trimmed === legacySecret) {
    // Look up first active company or fallback to default workspace
    try {
      const firstCompany = await db.collection('companies').limit(1).get();
      if (!firstCompany.empty) {
        return {
          workspaceId: firstCompany.docs[0].id,
          provider: 'zoho',
          isLegacy: true,
        };
      }
    } catch {
      // Fallback
    }

    return {
      workspaceId: 'default',
      provider: 'zoho',
      isLegacy: true,
    };
  }

  return null;
}

/**
 * Returns integration metadata for a workspace (without exposing secretHash).
 */
export async function getWorkspaceIntegration(
  workspaceId: string,
  provider: 'zoho' | 'hubspot' | 'generic' = 'zoho'
): Promise<Omit<IntegrationDoc, 'secretHash'> | null> {
  try {
    const snap = await db
      .collection('companies')
      .doc(workspaceId)
      .collection('integrations')
      .doc(provider)
      .get();

    if (!snap.exists) {
      const local = getLocalIntegration(workspaceId, provider);
      if (local) {
        const { secretHash, ...safe } = local;
        return safe;
      }
      return null;
    }

    const data = snap.data() as IntegrationDoc;
    const { secretHash, ...safe } = data;
    return safe;
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      const local = getLocalIntegration(workspaceId, provider);
      if (local) {
        const { secretHash, ...safe } = local;
        return safe;
      }
      return null;
    }
    const local = getLocalIntegration(workspaceId, provider);
    if (local) {
      const { secretHash, ...safe } = local;
      return safe;
    }
    return null;
  }
}

/**
 * Revokes an integration secret for a workspace.
 */
export async function revokeIntegrationSecret(
  workspaceId: string,
  provider: 'zoho' | 'hubspot' | 'generic' = 'zoho'
): Promise<boolean> {
  try {
    const integrationRef = db
      .collection('companies')
      .doc(workspaceId)
      .collection('integrations')
      .doc(provider);

    const snap = await integrationRef.get();
    if (!snap.exists) {
      return false;
    }

    const data = snap.data() as IntegrationDoc;
    if (data.secretHash) {
      await db.collection('integrationSecrets').doc(data.secretHash).delete().catch(() => {});
    }

    await integrationRef.update({
      status: 'revoked',
      updatedAt: new Date().toISOString(),
    });

    return true;
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      return true;
    }
    console.error('Error revoking integration secret:', err?.message || err);
    return false;
  }
}
