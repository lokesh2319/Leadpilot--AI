import { db } from './db.js';
import crypto from 'crypto';
import { createOrRotateIntegrationSecret } from './integrations.js';
import {
  getLocalUserWorkspace,
  createLocalUserWorkspace,
} from './localStore.js';

export interface UserDoc {
  uid: string;
  workspaceId: string;
  role: 'owner' | 'admin' | 'manager' | 'agent';
  email: string;
  createdAt: string;
}

export interface CompanyDoc {
  id: string;
  name: string;
  ownerUid: string;
  createdAt: string;
  plan: 'free' | 'starter' | 'professional' | 'business';
  status: 'active' | 'suspended';
  monthlyLeadLimit: number;
  billingCustomerId: string | null;
}

export const PLAN_LIMITS: Record<string, number> = {
  free: 100,
  starter: 1000,
  professional: 5000,
  business: 25000,
};

let hasLoggedFirestoreFallback = false;

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

function logFirestoreFallbackOnce(context: string) {
  if (!hasLoggedFirestoreFallback) {
    hasLoggedFirestoreFallback = true;
    console.info(
      `[Multi-Tenant Storage] Firestore access in project webhook-507618 returned PERMISSION_DENIED (${context}). Operating with resilient multi-tenant local store.`
    );
  }
}

/**
 * Resolves a Firebase UID to their user record and company document.
 */
export async function getUserWorkspace(uid: string): Promise<{
  user: UserDoc;
  company: CompanyDoc;
} | null> {
  try {
    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) {
      return getLocalUserWorkspace(uid);
    }

    const user = userSnap.data() as UserDoc;
    const companySnap = await db.collection('companies').doc(user.workspaceId).get();
    if (!companySnap.exists) {
      return getLocalUserWorkspace(uid);
    }

    const company = companySnap.data() as CompanyDoc;
    return { user, company };
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      logFirestoreFallbackOnce('getUserWorkspace');
      return getLocalUserWorkspace(uid);
    }
    console.error('Error in getUserWorkspace:', err?.message || err);
    return getLocalUserWorkspace(uid);
  }
}

/**
 * Atomically onboards a user if they don't already have a workspace.
 * Creates /companies/{workspaceId}, /users/{uid}, and initializes default Zoho credentials.
 */
export async function getOrCreateUserWorkspace(
  uid: string,
  email: string
): Promise<{ user: UserDoc; company: CompanyDoc }> {
  const existing = await getUserWorkspace(uid);
  if (existing) {
    return existing;
  }

  try {
    const userRef = db.collection('users').doc(uid);

    const result = await db.runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (userDoc.exists) {
        const user = userDoc.data() as UserDoc;
        const companyDoc = await transaction.get(db.collection('companies').doc(user.workspaceId));
        return {
          user,
          company: companyDoc.data() as CompanyDoc,
        };
      }

      const workspaceId = `company_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
      const companyRef = db.collection('companies').doc(workspaceId);

      const emailName = email.split('@')[0] || 'My';
      const capitalized = emailName.charAt(0).toUpperCase() + emailName.slice(1);

      const newCompany: CompanyDoc = {
        id: workspaceId,
        name: `${capitalized}'s Organization`,
        ownerUid: uid,
        createdAt: new Date().toISOString(),
        plan: 'free',
        status: 'active',
        monthlyLeadLimit: PLAN_LIMITS.free,
        billingCustomerId: null,
      };

      const newUser: UserDoc = {
        uid,
        workspaceId,
        role: 'owner',
        email,
        createdAt: new Date().toISOString(),
      };

      transaction.set(companyRef, newCompany);
      transaction.set(userRef, newUser);

      return { user: newUser, company: newCompany };
    });

    // Ensure default Zoho integration is generated for this workspace
    try {
      await createOrRotateIntegrationSecret(result.company.id, 'zoho');
    } catch (err) {
      console.error('Failed to initialize default Zoho integration for company:', err);
    }

    return result;
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      logFirestoreFallbackOnce('getOrCreateUserWorkspace');
      return createLocalUserWorkspace(uid, email);
    }
    console.error('Failed in getOrCreateUserWorkspace, using resilient store:', err?.message || err);
    return createLocalUserWorkspace(uid, email);
  }
}

/**
 * Checks whether a workspace has exceeded its monthly quota limit.
 */
export async function checkMonthlyLeadQuota(workspaceId: string): Promise<{
  allowed: boolean;
  limit: number;
  currentCount: number;
}> {
  try {
    const companySnap = await db.collection('companies').doc(workspaceId).get();
    if (!companySnap.exists) {
      return { allowed: true, limit: PLAN_LIMITS.free, currentCount: 0 };
    }

    const company = companySnap.data() as CompanyDoc;
    const limit = company.monthlyLeadLimit || PLAN_LIMITS.free;

    // Count leads created this month
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const countSnap = await db
      .collection('companies')
      .doc(workspaceId)
      .collection('leads')
      .where('created_at', '>=', startOfMonth.toISOString())
      .count()
      .get();

    const currentCount = countSnap.data().count;
    return {
      allowed: currentCount < limit,
      limit,
      currentCount,
    };
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      return { allowed: true, limit: PLAN_LIMITS.free, currentCount: 0 };
    }
    console.error('Error checking monthly lead quota:', err?.message || err);
    return { allowed: true, limit: PLAN_LIMITS.free, currentCount: 0 };
  }
}

/**
 * Tracks and increments resource usage for a workspace (e.g. leadsProcessed, aiRequests).
 */
export async function checkAndUpdateUsage(
  workspaceId: string,
  metric: 'leadsProcessed' | 'aiRequests'
): Promise<boolean> {
  if (!workspaceId || workspaceId === 'default') return true;

  try {
    const today = new Date().toISOString().slice(0, 7); // YYYY-MM
    const usageRef = db
      .collection('companies')
      .doc(workspaceId)
      .collection('usage')
      .doc(today);

    await db.runTransaction(async (transaction) => {
      const doc = await transaction.get(usageRef);
      const current = doc.exists ? (doc.data()?.[metric] || 0) : 0;
      transaction.set(usageRef, { [metric]: current + 1 }, { merge: true });
    });
    return true;
  } catch {
    // Graceful fallback
    return true;
  }
}

