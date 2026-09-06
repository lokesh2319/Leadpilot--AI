import { db } from './db.js';
import crypto from 'crypto';

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
  } catch (err) {
    console.error('Error querying integrationSecrets in Firestore:', err);
  }

  // 2. Legacy fallback for existing WEBHOOK_SECRET
  const legacySecret = process.env.WEBHOOK_SECRET;
  if (legacySecret && legacySecret.length > 0 && trimmed === legacySecret) {
    console.warn(
      '[LEGACY WEBHOOK] Webhook authenticated using legacy global WEBHOOK_SECRET.'
    );
    try {
      const companiesSnap = await db
        .collection('companies')
        .where('status', '==', 'active')
        .limit(1)
        .get();

      if (!companiesSnap.empty) {
        return {
          workspaceId: companiesSnap.docs[0].id,
          provider: 'zoho_legacy',
          isLegacy: true,
        };
      }
    } catch (err) {
      console.error('Error fetching fallback company for legacy webhook:', err);
    }
    // Fallback default workspace
    return {
      workspaceId: 'default',
      provider: 'zoho_legacy',
      isLegacy: true,
    };
  }

  return null;
}

/**
 * Gets integration info (without raw secret) for a workspace.
 */
export async function getWorkspaceIntegration(
  workspaceId: string,
  provider = 'zoho'
): Promise<IntegrationDoc | null> {
  try {
    const snap = await db
      .collection('companies')
      .doc(workspaceId)
      .collection('integrations')
      .doc(provider)
      .get();

    if (!snap.exists) {
      return null;
    }
    return snap.data() as IntegrationDoc;
  } catch (err) {
    console.error('Error getting workspace integration:', err);
    return null;
  }
}
