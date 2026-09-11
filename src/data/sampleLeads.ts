import type { LeadFormData, StoredLead } from '../types';

export interface SamplePreset {
  label: string;
  name: string;
  data: LeadFormData;
}

export const SAMPLE_PRESETS: SamplePreset[] = [
  {
    name: 'Hot Lead',
    label: 'Hot Lead - Rahul Sharma (High Intent)',
    data: {
      customerName: 'Rahul Sharma',
      phoneNumber: '+91 9876543210',
      email: 'rahul@example.com',
      leadSource: 'Website Inbound',
      productInterest: 'CRM Automation',
      budget: '₹1,00,000 - ₹2,00,000',
      customerMessage:
        'We are actively looking for a CRM automation solution for our sales team and want to implement it this month.',
    },
  },
  {
    name: 'Warm Lead',
    label: 'Warm Lead - Priya Mehta (Comparing Options)',
    data: {
      customerName: 'Priya Mehta',
      phoneNumber: '+91 9123456780',
      email: 'priya@example.com',
      leadSource: 'LinkedIn Outreach',
      productInterest: 'Lead Management',
      budget: '₹50,000 - ₹1,00,000',
      customerMessage:
        'We are comparing CRM options and would like to understand pricing and features.',
    },
  },
  {
    name: 'Cold Lead',
    label: 'Cold Lead - Amit Verma (Exploring)',
    data: {
      customerName: 'Amit Verma',
      phoneNumber: '+91 9000000000',
      email: 'amit@example.com',
      leadSource: 'Referral',
      productInterest: 'CRM',
      budget: 'Not decided',
      customerMessage:
        'Just exploring CRM tools for future use. No immediate requirement.',
    },
  },
];

export const PORTFOLIO_DEMO_LEADS: StoredLead[] = [
  {
    id: 'demo-lead-001',
    customer_name: 'Rahul Sharma',
    phone: '+91 9876543210',
    email: 'rahul@example.com',
    lead_source: 'Website Inbound',
    product_service: 'CRM Automation',
    budget: '₹1,00,000 - ₹2,00,000',
    message: 'We are actively looking for a CRM automation solution for our sales team and want to implement it this month.',
    lead_score: 95,
    classification: 'Hot',
    purchase_intent: 'High',
    priority: 'Urgent',
    summary: 'High-intent buyer actively seeking immediate CRM automation deployment for their sales team this month with allocated budget.',
    recommended_action: 'Fast-track product demonstration call within 24 hours. Present live CRM automation workflows and implementation timeline.',
    suggested_response: 'Hi Rahul,\n\nThank you for reaching out! Given your urgent deployment timeline for this month, our CRM automation solution can be onboarded seamlessly. I have opened up priority slots for a live demonstration tomorrow. Are you available for a 20-minute call at 11:30 AM IST?\n\nBest regards,\nSales Team | LeadPilot AI',
    reasoning: [
      'Explicit immediate timeframe: want implementation this month',
      'Dedicated budget allocated (₹1,00,000 - ₹2,00,000)',
      'High operational priority for active sales team'
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 25).toISOString(),
  },
  {
    id: 'demo-lead-002',
    customer_name: 'Marcus Vance',
    phone: '+1 (415) 892-3401',
    email: 'm.vance@apexlogistics.io',
    lead_source: 'Product Demo Request',
    product_service: 'Enterprise Lead Automation Platform',
    budget: '$75,000',
    message: 'We are evaluating new qualification tools for our 45-person SDR team. We need an implementation live by Q3 end. We have signed budget approval from our VP of Sales and want to see a technical architecture demo this week.',
    lead_score: 96,
    classification: 'Hot',
    purchase_intent: 'High',
    priority: 'Urgent',
    summary: 'Executive buyer with approved $75k enterprise budget, 45 SDR seats, and strict Q3 deployment deadline. Exceptional fit for Enterprise Tier.',
    recommended_action: 'Fast-track executive demo with Lead Solutions Architect within 24 hours. Send security & SOC-2 compliance package.',
    suggested_response: 'Hi Marcus,\n\nThank you for reaching out! Given your 45-person SDR team and Q3 timeline, our Enterprise Lead Automation Platform is an ideal fit. I have reserved time on our Principal Architect\'s calendar for a tailored architecture walk-through. Are you free tomorrow at 2:00 PM PT?\n\nBest regards,\nAlex Sales | LeadPilot AI',
    reasoning: [
      'Explicit budget of $75k with signed executive approval',
      'Immediate Q3 procurement and go-live requirement',
      'High-volume team (45 SDR seats) matches enterprise expansion criteria',
      'Technical architecture validation requested directly'
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 55).toISOString(),
  },
  {
    id: 'demo-lead-003',
    customer_name: 'Priya Mehta',
    phone: '+91 9123456780',
    email: 'priya@example.com',
    lead_source: 'LinkedIn Outreach',
    product_service: 'Lead Management',
    budget: '₹50,000 - ₹1,00,000',
    message: 'We are comparing CRM options and would like to understand pricing and features.',
    lead_score: 74,
    classification: 'Warm',
    purchase_intent: 'Medium',
    priority: 'High',
    summary: 'Warm prospect actively evaluating CRM alternatives with a moderate budget. Requires feature matrix and comparative value breakdown.',
    recommended_action: 'Share comprehensive feature comparison guide, transparent tier pricing, and invite to an interactive walkthrough.',
    suggested_response: 'Hi Priya,\n\nThanks for connecting! I would be delighted to share our comparative guide showing how LeadPilot streamlines lead management against other market options. Would Thursday afternoon work for a quick 15-minute overview tailored to your requirements?\n\nWarm regards,\nSales Team | LeadPilot AI',
    reasoning: [
      'Active comparative evaluation stage',
      'Clear budget range defined (₹50,000 - ₹1,00,000)',
      'Moderate velocity decision profile'
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
  },
  {
    id: 'demo-lead-004',
    customer_name: 'Sarah Lin',
    phone: '+1 (512) 440-2918',
    email: 'sarah.lin@cloudmetric.com',
    lead_source: 'Referral',
    product_service: 'Enterprise Lead Automation Platform',
    budget: '$60,000',
    message: 'Referred by Tom at Datasync. Need enterprise compliance, multi-tenant isolation, and SOC-2 certified automated lead qualification.',
    lead_score: 92,
    classification: 'Hot',
    purchase_intent: 'High',
    priority: 'Urgent',
    summary: 'Direct executive referral with verified enterprise budget and explicit SOC-2 data isolation requirements. Very high closing probability.',
    recommended_action: 'Acknowledge referral warmly, dispatch custom SOC-2 compliance overview, and propose executive discovery session.',
    suggested_response: 'Hi Sarah,\n\nWonderful to connect! Tom from Datasync spoke very highly of CloudMetric\'s growth. Our enterprise multi-tenant architecture was engineered specifically for strict data privacy standards like yours. Would you have 20 minutes this Thursday to review our security model?\n\nWarm regards,\nAlex Sales | LeadPilot AI',
    reasoning: [
      'Trusted executive referral from existing enterprise partner',
      'Clear compliance criteria that LeadPilot satisfies natively',
      'Strong $60,000 allocated budget'
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 360).toISOString(),
  },
  {
    id: 'demo-lead-005',
    customer_name: 'Elena Rostova',
    phone: '+1 (206) 555-0193',
    email: 'elena@novapulse.tech',
    lead_source: 'Webinar / Event',
    product_service: 'CRM Integration & Workflow Sync',
    budget: '$25,000',
    message: 'Attended your AI Sales Automation webinar yesterday. Our reps waste ~2 hours daily manually tagging inbound leads. What does implementation look like?',
    lead_score: 76,
    classification: 'Warm',
    purchase_intent: 'Medium',
    priority: 'High',
    summary: 'Webinar attendee with verified operational bottleneck ($25k budget). Reps currently losing ~2 hours/day on manual CRM tagging.',
    recommended_action: 'Send recorded webinar highlights with ROI calculator and offer 1-on-1 implementation roadmap consult.',
    suggested_response: 'Hi Elena,\n\nThank you for joining our webinar yesterday! Eliminating that 2-hour daily tagging burden is exactly what LeadPilot delivers out-of-the-box. I have put together a preliminary 2-week rollout roadmap for NovaPulse. Would you be open to a quick review next Tuesday?\n\nBest,\nAlex Sales | LeadPilot AI',
    reasoning: [
      'Engaged event lead with high topic relevance',
      'Specific quantifiable pain: 2 hours/rep/day wasted',
      'Moderate budget allocated ($25,000)'
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
  },
  {
    id: 'demo-lead-006',
    customer_name: 'Amit Verma',
    phone: '+91 9000000000',
    email: 'amit@example.com',
    lead_source: 'Referral',
    product_service: 'CRM',
    budget: 'Not decided',
    message: 'Just exploring CRM tools for future use. No immediate requirement.',
    lead_score: 32,
    classification: 'Cold',
    purchase_intent: 'Low',
    priority: 'Low',
    summary: 'Early exploratory contact without immediate procurement need or approved budget. Suitable for automated nurturing sequence.',
    recommended_action: 'Add to automated product updates newsletter and provide introductory platform documentation.',
    suggested_response: 'Hi Amit,\n\nThanks for exploring LeadPilot AI! I have shared our self-serve product overview and platform capabilities guide for your future reference. Whenever your team is ready to evaluate CRM automation, feel free to reach out!\n\nBest regards,\nLeadPilot AI Team',
    reasoning: [
      'No immediate timeline or project urgency',
      'Budget unallocated or undecided',
      'Exploratory research intent'
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 36).toISOString(),
  },
  {
    id: 'demo-lead-007',
    customer_name: 'David Chen',
    phone: '+1 (650) 331-9874',
    email: 'david@solocraft.app',
    lead_source: 'Website Inbound',
    product_service: 'Starter Package',
    budget: 'Under $5,000',
    message: 'Just browsing pricing options. We are currently pre-revenue and testing a few tools for later in the year. Do you have a free tier or trial?',
    lead_score: 38,
    classification: 'Cold',
    purchase_intent: 'Low',
    priority: 'Low',
    summary: 'Early pre-revenue startup exploring pricing models. Insufficient budget for current enterprise tier, long-term nurture candidate.',
    recommended_action: 'Enroll in automated nurture email cadence and share self-service developer documentation.',
    suggested_response: 'Hi David,\n\nThanks for checking out LeadPilot AI! We love seeing early founders innovate with AI. I have sent you our self-guided documentation and starter guides. Feel free to explore our API docs, and let us know when your team begins scaling inbound volume!\n\nBest,\nAlex Sales | LeadPilot AI',
    reasoning: [
      'Pre-revenue with no allocated implementation budget',
      'Long sales cycle horizon (>6 months)',
      'Self-service nurture profile'
    ],
    created_at: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
  },
];
