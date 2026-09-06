import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { UserDoc, CompanyDoc, PLAN_LIMITS } from './workspaces.js';
import { StoredLead, NewLeadInput } from './db.js';
import { IntegrationDoc, hashSecret } from './integrations.js';

const DATA_DIR = path.join(process.cwd(), 'data');
const WORKSPACES_FILE = path.join(DATA_DIR, 'workspaces.json');
const INTEGRATIONS_FILE = path.join(DATA_DIR, 'integrations.json');
const LEADS_DIR = path.join(DATA_DIR, 'tenants');

function ensureDataDirs(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(LEADS_DIR)) {
    fs.mkdirSync(LEADS_DIR, { recursive: true });
  }
}

interface WorkspacesData {
  users: Record<string, UserDoc>;
  companies: Record<string, CompanyDoc>;
}

interface IntegrationsData {
  integrations: Record<string, IntegrationDoc>;
  secrets: Record<string, { workspaceId: string; provider: string; secretPrefix: string }>;
}

function readWorkspaces(): WorkspacesData {
  ensureDataDirs();
  if (!fs.existsSync(WORKSPACES_FILE)) {
    return { users: {}, companies: {} };
  }
  try {
    const raw = fs.readFileSync(WORKSPACES_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { users: {}, companies: {} };
  }
}

function writeWorkspaces(data: WorkspacesData): void {
  ensureDataDirs();
  fs.writeFileSync(WORKSPACES_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

function readIntegrations(): IntegrationsData {
  ensureDataDirs();
  if (!fs.existsSync(INTEGRATIONS_FILE)) {
    return { integrations: {}, secrets: {} };
  }
  try {
    const raw = fs.readFileSync(INTEGRATIONS_FILE, 'utf-8');
    return JSON.parse(raw);
  } catch {
    return { integrations: {}, secrets: {} };
  }
}

function writeIntegrations(data: IntegrationsData): void {
  ensureDataDirs();
  fs.writeFileSync(INTEGRATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

export function getLocalUserWorkspace(uid: string): { user: UserDoc; company: CompanyDoc } | null {
  const data = readWorkspaces();
  const user = data.users[uid];
  if (!user) return null;
  const company = data.companies[user.workspaceId];
  if (!company) return null;
  return { user, company };
}

export function createLocalUserWorkspace(uid: string, email: string): { user: UserDoc; company: CompanyDoc } {
  const data = readWorkspaces();
  if (data.users[uid] && data.companies[data.users[uid].workspaceId]) {
    return {
      user: data.users[uid],
      company: data.companies[data.users[uid].workspaceId],
    };
  }

  const workspaceId = `company_${Date.now().toString(36)}_${crypto.randomBytes(3).toString('hex')}`;
  const emailName = email.split('@')[0] || 'My';
  const capitalized = emailName.charAt(0).toUpperCase() + emailName.slice(1);

  const company: CompanyDoc = {
    id: workspaceId,
    name: `${capitalized}'s Organization`,
    ownerUid: uid,
    createdAt: new Date().toISOString(),
    plan: 'free',
    status: 'active',
    monthlyLeadLimit: PLAN_LIMITS.free,
    billingCustomerId: null,
  };

  const user: UserDoc = {
    uid,
    workspaceId,
    role: 'owner',
    email,
    createdAt: new Date().toISOString(),
  };

  data.companies[workspaceId] = company;
  data.users[uid] = user;
  writeWorkspaces(data);

  // Initialize initial integration secret
  createLocalIntegrationSecret(workspaceId, 'zoho');

  // Seed default demo leads for this tenant
  seedLocalLeadsIfEmpty(workspaceId);

  return { user, company };
}

export function createLocalIntegrationSecret(
  workspaceId: string,
  provider: 'zoho' | 'hubspot' | 'generic' = 'zoho'
): { rawSecret: string; prefix: string } {
  const randomBytes = crypto.randomBytes(24).toString('hex');
  const rawSecret = `lp_${provider}_${randomBytes}`;
  const secretHash = hashSecret(rawSecret);
  const prefix = `${rawSecret.substring(0, 14)}...`;

  const data = readIntegrations();
  const key = `${workspaceId}:${provider}`;
  const prev = data.integrations[key];

  if (prev && prev.secretHash && data.secrets[prev.secretHash]) {
    delete data.secrets[prev.secretHash];
  }

  const now = new Date().toISOString();
  const integration: IntegrationDoc = {
    id: provider,
    workspaceId,
    provider,
    secretHash,
    secretPrefix: prefix,
    status: 'active',
    createdAt: prev ? prev.createdAt : now,
    updatedAt: now,
  };

  data.integrations[key] = integration;
  data.secrets[secretHash] = {
    workspaceId,
    provider,
    secretPrefix: prefix,
  };

  writeIntegrations(data);
  return { rawSecret, prefix };
}

export function getLocalIntegration(
  workspaceId: string,
  provider: 'zoho' | 'hubspot' | 'generic' = 'zoho'
): IntegrationDoc | null {
  const data = readIntegrations();
  return data.integrations[`${workspaceId}:${provider}`] || null;
}

export function resolveLocalWebhookSecret(secretHash: string): {
  workspaceId: string;
  provider: string;
  secretPrefix: string;
} | null {
  const data = readIntegrations();
  return data.secrets[secretHash] || null;
}

function getLeadsFilePath(workspaceId: string): string {
  ensureDataDirs();
  const safeId = workspaceId.replace(/[^a-zA-Z0-9_-]/g, '_');
  return path.join(LEADS_DIR, `${safeId}.json`);
}

function seedLocalLeadsIfEmpty(workspaceId: string): void {
  const filePath = getLeadsFilePath(workspaceId);
  if (!fs.existsSync(filePath)) {
    const initialLeads: StoredLead[] = [
      {
        id: 'lead-1001',
        workspaceId,
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
        created_at: new Date(Date.now() - 3600000 * 4).toISOString(),
      },
      {
        id: 'lead-1002',
        workspaceId,
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
        created_at: new Date(Date.now() - 3600000 * 24).toISOString(),
      },
      {
        id: 'lead-1003',
        workspaceId,
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
        created_at: new Date(Date.now() - 3600000 * 48).toISOString(),
      },
    ];

    fs.writeFileSync(filePath, JSON.stringify(initialLeads, null, 2), 'utf-8');
  }
}

export function getLocalLeads(workspaceId: string = 'default'): StoredLead[] {
  seedLocalLeadsIfEmpty(workspaceId);
  const filePath = getLeadsFilePath(workspaceId);
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const list: StoredLead[] = JSON.parse(raw);
    return list.sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  } catch {
    return [];
  }
}

export function saveLocalLead(workspaceId: string = 'default', input: NewLeadInput): StoredLead {
  seedLocalLeadsIfEmpty(workspaceId);
  const filePath = getLeadsFilePath(workspaceId);
  const leads = getLocalLeads(workspaceId);

  const id =
    input.id ||
    `lead-${Date.now().toString(36)}-${Math.random().toString(36).substring(2, 6)}`;
  const created_at = input.created_at || new Date().toISOString();

  const newLead: StoredLead = {
    ...input,
    id,
    workspaceId,
    created_at,
  };

  const existingIndex = leads.findIndex((l) => l.id === id);
  if (existingIndex >= 0) {
    leads[existingIndex] = newLead;
  } else {
    leads.unshift(newLead);
  }

  fs.writeFileSync(filePath, JSON.stringify(leads, null, 2), 'utf-8');
  return newLead;
}

export function deleteLocalLead(workspaceId: string = 'default', leadId: string): boolean {
  const filePath = getLeadsFilePath(workspaceId);
  const leads = getLocalLeads(workspaceId);
  const filtered = leads.filter((l) => l.id !== leadId);
  if (filtered.length === leads.length) return false;
  fs.writeFileSync(filePath, JSON.stringify(filtered, null, 2), 'utf-8');
  return true;
}
