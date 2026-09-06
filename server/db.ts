import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import {
  getLocalLeads,
  saveLocalLead,
  deleteLocalLead,
} from './localStore.js';

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
  const ws = workspaceId || 'default';
  try {
    const collection = getLeadsCollection(workspaceId);
    const snapshot = await collection.orderBy('created_at', 'desc').get();

    return snapshot.docs.map((doc) => ({
      ...(doc.data() as StoredLead),
      id: doc.id,
      workspaceId: ws,
    }));
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      return getLocalLeads(ws);
    }
    console.error('Error fetching leads from Firestore:', err?.message || err);
    return getLocalLeads(ws);
  }
}

/**
 * Returns one lead by ID within a workspace.
 */
export async function getLeadById(workspaceId: string | undefined, id: string): Promise<StoredLead | null> {
  const ws = workspaceId || 'default';
  try {
    const doc = await getLeadsCollection(workspaceId).doc(id).get();
    if (!doc.exists) {
      const local = getLocalLeads(ws).find((l) => l.id === id);
      return local || null;
    }
    return {
      ...(doc.data() as StoredLead),
      id: doc.id,
      workspaceId: ws,
    };
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      const local = getLocalLeads(ws).find((l) => l.id === id);
      return local || null;
    }
    console.error('Error in getLeadById:', err?.message || err);
    const local = getLocalLeads(ws).find((l) => l.id === id);
    return local || null;
  }
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

  try {
    await getLeadsCollection(workspaceId).doc(id).set(newLead);
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      return saveLocalLead(workspaceId, newLead);
    }
    console.error('Error saving lead to Firestore, saving locally:', err?.message || err);
    return saveLocalLead(workspaceId, newLead);
  }

  // Also sync locally as cache
  try {
    saveLocalLead(workspaceId, newLead);
  } catch {}

  return newLead;
}

/**
 * Deletes a lead by ID from a workspace.
 */
export async function deleteLead(workspaceId: string | undefined, id: string): Promise<boolean> {
  const ws = workspaceId || 'default';
  try {
    const ref = getLeadsCollection(workspaceId).doc(id);
    const doc = await ref.get();
    if (!doc.exists) {
      return deleteLocalLead(ws, id);
    }
    await ref.delete();
    deleteLocalLead(ws, id);
    return true;
  } catch (err: any) {
    if (isFirestorePermissionError(err)) {
      return deleteLocalLead(ws, id);
    }
    console.error('Error deleting lead from Firestore, deleting locally:', err?.message || err);
    return deleteLocalLead(ws, id);
  }
}
