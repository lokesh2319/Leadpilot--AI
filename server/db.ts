import fs from 'fs';
import path from 'path';

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

const DATA_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'leads.json');

// Ensure data directory exists
function ensureStorage(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(DB_FILE)) {
    // Seed initial realistic qualified leads
    const initialLeads: StoredLead[] = [
      {
        id: 'lead-1001',
        customer_name: 'Marcus Vance',
        phone: '+1 (415) 892-3401',
        email: 'm.vance@apexlogistics.io',
        lead_source: 'Product Demo Request',
        product_service: 'Enterprise Lead Automation Platform',
        budget: '$50,000 - $100,000',
        message:
          'We are evaluating new qualification tools for our 45-person SDR team. We need an implementation live by Q3 end. We have signed budget approval from our VP of Sales and want to see a technical architecture demo this week.',
        lead_score: 95,
        classification: 'Hot',
        purchase_intent: 'High',
        priority: 'High',
        summary:
          'Marcus Vance represents a 45-person SDR team with signed executive budget approval seeking an enterprise lead automation rollout before Q3 end.',
        recommended_action:
          'Immediately assign an Enterprise Solutions Engineer to host a live architecture demonstration within 24 hours.',
        suggested_response:
          'Hi Marcus, thank you for reaching out. We would be delighted to host an architecture walkthrough for your SDR team this week. Would Thursday at 2 PM PT work for an introductory session?',
        reasoning: [
          'Confirmed executive budget approval of $50k-$100k.',
          'Clear, urgent deployment deadline before Q3 end.',
          'Large deployment footprint with 45 SDR seats.',
          'Direct inbound product demo request demonstrates active procurement.',
        ],
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(), // 4 hours ago
      },
      {
        id: 'lead-1002',
        customer_name: 'Elena Rostova',
        phone: '+1 (206) 555-0193',
        email: 'elena@novapulse.tech',
        lead_source: 'LinkedIn Outreach',
        product_service: 'CRM Automation',
        budget: '$15,000 - $35,000',
        message:
          'Our current CRM data is messy and reps waste 2 hours a day manually tagging inbound leads. Looking to see how LeadPilot connects to our HubSpot stack and what your turnaround time looks like.',
        lead_score: 72,
        classification: 'Warm',
        purchase_intent: 'Medium',
        priority: 'Medium',
        summary:
          'Mid-market tech company seeking CRM automation to reduce manual rep tagging with HubSpot integration. Defined budget of $15k-$35k.',
        recommended_action:
          'Send HubSpot integration technical overview and schedule a 20-minute discovery call.',
        suggested_response:
          'Hi Elena, thanks for connecting. Our HubSpot sync is completely plug-and-play and eliminates manual lead tagging. Would you be open to a 15-minute demo on Friday to see the integration in action?',
        reasoning: [
          'Identified operational pain point (2 hours/day manual rep effort).',
          'Viable mid-market budget allocated ($15,000 - $35,000).',
          'Specific tech stack named (HubSpot).',
        ],
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
      },
      {
        id: 'lead-1003',
        customer_name: 'David Chen',
        phone: '+1 (650) 331-9874',
        email: 'david@solocraft.app',
        lead_source: 'Website',
        product_service: 'Starter Package',
        budget: 'Under $5,000',
        message:
          'Just browsing pricing options. We are currently pre-revenue and testing a few tools for later in the year. Do you have a free tier or trial?',
        lead_score: 35,
        classification: 'Cold',
        purchase_intent: 'Low',
        priority: 'Low',
        summary:
          'Pre-revenue startup exploring free tier or starter packages with low budget (<$5,000) and no immediate deployment timeline.',
        recommended_action:
          'Enroll into automated self-service email nurture sequence with starter documentation.',
        suggested_response:
          'Hi David, thanks for your interest in LeadPilot AI! We offer self-service access and interactive docs for early-stage teams. Feel free to explore our guide here: https://leadpilot.ai/docs.',
        reasoning: [
          'Pre-revenue stage with minimal budget under $5,000.',
          'Early exploratory research with no active buying timeline.',
          'Request for free tier indicates price sensitivity.',
        ],
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(), // 2 days ago
      },
    ];

    fs.writeFileSync(DB_FILE, JSON.stringify(initialLeads, null, 2), 'utf-8');
  }
}

// In-memory cache for fast read access
let leadsCache: StoredLead[] | null = null;

function loadLeadsFromDisk(): StoredLead[] {
  ensureStorage();
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      leadsCache = parsed;
      return parsed;
    }
    leadsCache = [];
    return [];
  } catch (err) {
    console.error('Failed to read leads database file:', err);
    leadsCache = [];
    return [];
  }
}

function writeLeadsToDisk(leads: StoredLead[]): void {
  ensureStorage();
  try {
    // Write atomically via temp file
    const tempFile = `${DB_FILE}.tmp.${Date.now()}`;
    fs.writeFileSync(tempFile, JSON.stringify(leads, null, 2), 'utf-8');
    fs.renameSync(tempFile, DB_FILE);
    leadsCache = leads;
  } catch (err) {
    console.error('Failed to write leads database file:', err);
    throw err;
  }
}

/**
 * Returns all saved leads sorted in newest-first order (created_at descending)
 */
export function getAllLeads(): StoredLead[] {
  const leads = leadsCache ?? loadLeadsFromDisk();
  // Return sorted copy: newest-first
  return [...leads].sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

/**
 * Returns a single saved lead by ID
 */
export function getLeadById(id: string): StoredLead | null {
  const leads = getAllLeads();
  return leads.find((l) => l.id === id) || null;
}

/**
 * Persists a new qualified lead
 */
export function saveLead(data: NewLeadInput): StoredLead {
  const leads = leadsCache ?? loadLeadsFromDisk();

  const id =
    data.id || `lead-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
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

  // Prepend to array
  const updated = [newLead, ...leads];
  writeLeadsToDisk(updated);

  return newLead;
}

/**
 * Deletes a lead by ID (utility for UI)
 */
export function deleteLead(id: string): boolean {
  const leads = leadsCache ?? loadLeadsFromDisk();
  const filtered = leads.filter((l) => l.id !== id);
  if (filtered.length === leads.length) {
    return false;
  }
  writeLeadsToDisk(filtered);
  return true;
}
