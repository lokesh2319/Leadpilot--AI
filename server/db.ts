import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export interface StoredLead {
  id: string;
  workspaceId: string;
  customer_name: string;
  phone: string;
  email: string;
  lead_source: string;
  product_service: string;
  budget: string;
  message: string;
  lead_score: number;
  classification: 'Hot' | 'Warm' | 'Cold';
  purchase_intent: 'High' | 'Medium' | 'Low';
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  summary: string;
  recommended_action: string;
  suggested_response: string;
  reasoning: string[];
  created_at: string;
}

export type NewLeadInput = Omit<StoredLead, 'id' | 'created_at' | 'workspaceId'> & {
  id?: string;
  workspaceId?: string;
  created_at?: string;
};

export const defaultAdminApp =
  getApps().find((a) => a.name === '[DEFAULT]') ||
  (getApps().length === 0
    ? initializeApp({ projectId: process.env.GOOGLE_CLOUD_PROJECT || 'webhook-507618' })
    : getApps()[0]);

export const db = getFirestore(defaultAdminApp, 'webhook');

/**
 * Returns collection reference for a workspace's leads:
 * /companies/{workspaceId}/leads
 */
export function getLeadsCollection(workspaceId?: string) {
  if (workspaceId) {
    return db.collection('companies').doc(workspaceId).collection('leads');
  }
  return db.collection('leads');
}

/**
 * Returns all saved leads for a specific workspace in newest-first order.
 */
export async function getAllLeads(workspaceId?: string): Promise<StoredLead[]> {
  const collection = getLeadsCollection(workspaceId);
  const snapshot = await collection.orderBy('created_at', 'desc').get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as StoredLead),
    id: doc.id,
    workspaceId: workspaceId || (doc.data() as any).workspaceId || 'legacy',
  }));
}

/**
 * Returns one lead by ID within a workspace.
 */
export async function getLeadById(workspaceId: string | undefined, id: string): Promise<StoredLead | null> {
  const doc = await getLeadsCollection(workspaceId).doc(id).get();
  if (!doc.exists) {
    return null;
  }
  return {
    ...(doc.data() as StoredLead),
    id: doc.id,
    workspaceId: workspaceId || (doc.data() as any).workspaceId || 'legacy',
  };
}

/**
 * Persists a new qualified lead to Firestore under /companies/{workspaceId}/leads/{leadId}.
 */
export async function saveLead(
  workspaceIdOrData: string | NewLeadInput,
  maybeData?: NewLeadInput
): Promise<StoredLead> {
  let workspaceId = 'default';
  let data: NewLeadInput;

  if (typeof workspaceIdOrData === 'string') {
    workspaceId = workspaceIdOrData;
    data = maybeData || ({} as NewLeadInput);
  } else {
    data = workspaceIdOrData;
    workspaceId = data.workspaceId || 'default';
  }

  const id =
    data.id ||
    `lead-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;

  const created_at = data.created_at || new Date().toISOString();

  const newLead: StoredLead = {
    id,
    workspaceId,
    customer_name: data.customer_name || 'Anonymous Lead',
    phone: data.phone || '',
    email: data.email || '',
    lead_source: data.lead_source || 'Website',
    product_service: data.product_service || 'CRM Automation',
    budget: data.budget || 'Unspecified',
    message: data.message || '',
    lead_score: typeof data.lead_score === 'number' ? data.lead_score : 50,
    classification: data.classification || 'Warm',
    purchase_intent: data.purchase_intent || 'Medium',
    priority: data.priority || 'Medium',
    summary: data.summary || '',
    recommended_action: data.recommended_action || '',
    suggested_response: data.suggested_response || '',
    reasoning: Array.isArray(data.reasoning) ? data.reasoning : [],
    created_at,
  };

  await getLeadsCollection(workspaceId).doc(id).set(newLead);
  return newLead;
}

/**
 * Deletes a lead by ID from a workspace.
 */
export async function deleteLead(workspaceId: string | undefined, id: string): Promise<boolean> {
  const ref = getLeadsCollection(workspaceId).doc(id);
  const doc = await ref.get();
  if (!doc.exists) {
    return false;
  }
  await ref.delete();
  return true;
}
