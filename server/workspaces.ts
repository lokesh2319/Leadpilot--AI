import { db } from './db.js';
import crypto from 'crypto';
import { createOrRotateIntegrationSecret } from './integrations.js';

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
      return null;
    }

    const user = userSnap.data() as UserDoc;
    const companySnap = await db.collection('companies').doc(user.workspaceId).get();
    if (!companySnap.exists) {
      return null;
    }

    const company = companySnap.data() as CompanyDoc;
    return { user, company };
  } catch (err) {
    console.error('Error in getUserWorkspace:', err);
    return null;
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
}

/**
 * Usage Tracking: /companies/{workspaceId}/usage/{YYYY-MM}
 */
export async function checkAndUpdateUsage(
  workspaceId: string,
  metric: 'leadsProcessed' | 'aiRequests' | 'webhookRequests'
): Promise<{ allowed: boolean; current: number; limit: number }> {
  if (!workspaceId || workspaceId === 'default') {
    return { allowed: true, current: 0, limit: 1000 };
  }

  const now = new Date();
  const yearMonth = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, '0')}`;
  const usageRef = db
    .collection('companies')
    .doc(workspaceId)
    .collection('usage')
    .doc(yearMonth);

  try {
    const companySnap = await db.collection('companies').doc(workspaceId).get();
    const company = (companySnap.data() as CompanyDoc) || { plan: 'free', monthlyLeadLimit: 100 };
    const limit = company.monthlyLeadLimit || PLAN_LIMITS[company.plan || 'free'] || 100;

    let current = 0;
    let allowed = true;

    await db.runTransaction(async (transaction) => {
      const snap = await transaction.get(usageRef);
      const data = snap.exists ? snap.data()! : { leadsProcessed: 0, aiRequests: 0, webhookRequests: 0 };
      current = (data[metric] || 0) + 1;

      if (metric === 'leadsProcessed' && current > limit) {
        allowed = false;
        return;
      }

      transaction.set(
        usageRef,
        {
          yearMonth,
          [metric]: current,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    });

    return { allowed, current, limit };
  } catch (err) {
    console.error('Error updating usage in Firestore:', err);
    return { allowed: true, current: 1, limit: 100 };
  }
}
