import { getApps, initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

export interface StoredLead {
  id: string;
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

export type NewLeadInput = Omit<StoredLead, 'id' | 'created_at'> & {
  id?: string;
  created_at?: string;
};

const app = getApps().length === 0
  ? initializeApp()
  : getApps()[0];
const db = getFirestore(app, 'webhook');
const leadsCollection = db.collection('leads');

/**
 * Returns all saved leads in newest-first order.
 */
export async function getAllLeads(): Promise<StoredLead[]> {
  const snapshot = await leadsCollection
    .orderBy('created_at', 'desc')
    .get();

  return snapshot.docs.map((doc) => ({
    ...(doc.data() as StoredLead),
    id: doc.id,
  }));
}

/**
 * Returns one lead by ID.
 */
export async function getLeadById(id: string): Promise<StoredLead | null> {
  const doc = await leadsCollection.doc(id).get();

  if (!doc.exists) {
    return null;
  }

  return {
    ...(doc.data() as StoredLead),
    id: doc.id,
  };
}

/**
 * Persists a new qualified lead to Firestore.
 */
export async function saveLead(data: NewLeadInput): Promise<StoredLead> {
  const id =
    data.id ||
    `lead-${Date.now().toString(36)}-${Math.random()
      .toString(36)
      .substring(2, 6)}`;

  const created_at = data.created_at || new Date().toISOString();

  const newLead: StoredLead = {
    id,
    customer_name: data.customer_name || 'Anonymous Lead',
    phone: data.phone || '',
    email: data.email || '',
    lead_source: data.lead_source || 'Website',
    product_service: data.product_service || 'CRM Automation',
    budget: data.budget || 'Unspecified',
    message: data.message || '',
    lead_score:
      typeof data.lead_score === 'number' ? data.lead_score : 50,
    classification: data.classification || 'Warm',
    purchase_intent: data.purchase_intent || 'Medium',
    priority: data.priority || 'Medium',
    summary: data.summary || '',
    recommended_action: data.recommended_action || '',
    suggested_response: data.suggested_response || '',
    reasoning: Array.isArray(data.reasoning) ? data.reasoning : [],
    created_at,
  };

  await leadsCollection.doc(id).set(newLead);

  return newLead;
}

/**
 * Deletes a lead by ID.
 */
export async function deleteLead(id: string): Promise<boolean> {
  const ref = leadsCollection.doc(id);
  const doc = await ref.get();

  if (!doc.exists) {
    return false;
  }

  await ref.delete();

  return true;
}
