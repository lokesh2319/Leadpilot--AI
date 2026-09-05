import { LeadFormData, LeadRecord } from '../types';

export const SAMPLE_PRESETS: { label: string; data: LeadFormData }[] = [
  {
    label: 'High-Intent Enterprise (Hot)',
    data: {
      customerName: 'Marcus Vance',
      phoneNumber: '+1 (415) 892-3401',
      email: 'm.vance@apexlogistics.io',
      leadSource: 'Product Demo Request',
      productInterest: 'Enterprise Lead Automation Platform',
      budget: '$50,000 - $100,000',
      customerMessage: 'We are evaluating new qualification tools for our 45-person SDR team. We need an implementation live by Q3 end. We have signed budget approval from our VP of Sales and want to see a technical architecture demo this week.',
    },
  },
  {
    label: 'Mid-Market SaaS (Warm)',
    data: {
      customerName: 'Elena Rostova',
      phoneNumber: '+1 (206) 555-0193',
      email: 'elena@novapulse.tech',
      leadSource: 'LinkedIn Outreach',
      productInterest: 'CRM Integration & Workflow Sync',
      budget: '$15,000 - $35,000',
      customerMessage: 'Our current CRM data is messy and reps waste 2 hours a day manually tagging inbound leads. Looking to see how LeadPilot connects to our HubSpot stack and what your turnaround time looks like.',
    },
  },
  {
    label: 'Early-Stage Startup (Cold)',
    data: {
      customerName: 'David Chen',
      phoneNumber: '+1 (650) 331-9874',
      email: 'david@solocraft.app',
      leadSource: 'Website Inbound',
      productInterest: 'Starter Package',
      budget: 'Under $5,000',
      customerMessage: 'Just browsing pricing options. We are currently pre-revenue and testing a few tools for later in the year. Do you have a free tier or trial?',
    },
  },
];

export const INITIAL_LEADS: LeadRecord[] = [
  {
    id: 'lead-001',
    customerName: 'Sarah Lin',
    phoneNumber: '+1 (512) 440-2918',
    email: 'sarah.lin@cloudmetric.com',
    leadSource: 'Referral',
    productInterest: 'Enterprise Lead Automation Platform',
    budget: '$60,000',
    customerMessage: 'Referred by Tom at Datasync. Need enterprise compliance and SOC-2 certified lead scoring.',
    createdAt: '2026-09-02T14:30:00Z',
    analysis: {
      leadScore: 92,
      classification: 'Hot',
      purchaseIntent: 'Immediate (< 30 days)',
      priority: 'Urgent',
      shortSummary: 'Executive referral with confirmed enterprise budget and immediate compliance requirement.',
      recommendedNextAction: 'Coordinate executive intro call with Principal Solutions Engineer and share SOC-2 pack.',
      suggestedResponse: 'Hi Sarah,\n\nThank you for reaching out! Tom mentioned you might connect regarding our enterprise compliance tier. I would love to introduce you to our Solutions team and share our security whitepaper. Are you free for a brief 20-minute call this Thursday at 2 PM CT?\n\nBest regards,\nSarah Jenkins | LeadPilot AI',
      timestamp: '2026-09-02T14:32:00Z',
      calculatedMetrics: {
        budgetScore: 95,
        intentScore: 90,
        fitScore: 92,
      },
    },
  },
  {
    id: 'lead-002',
    customerName: 'Robert Vance',
    phoneNumber: '+1 (312) 779-1120',
    email: 'rvance@vancerefrigeration.com',
    leadSource: 'Google Search / Ads',
    productInterest: 'CRM Integration & Workflow Sync',
    budget: '$20,000',
    customerMessage: 'Looking to upgrade our legacy inbound sales tracking and automate email responses.',
    createdAt: '2026-09-03T10:15:00Z',
    analysis: {
      leadScore: 74,
      classification: 'Warm',
      purchaseIntent: 'High (1-3 months)',
      priority: 'High',
      shortSummary: 'Solid mid-market company seeking CRM modernization with verified $20k budget.',
      recommendedNextAction: 'Send CRM integration one-pager and offer tailored 15-minute product walk-through.',
      suggestedResponse: 'Hi Robert,\n\nThanks for contacting LeadPilot AI! Upgrading legacy inbound pipelines is where we deliver the highest ROI. I have attached our CRM Integration Guide. Would you have 15 minutes this Friday morning to explore how this fits into your current workflow?\n\nBest,\nSarah Jenkins | LeadPilot AI',
      timestamp: '2026-09-03T10:17:00Z',
      calculatedMetrics: {
        budgetScore: 75,
        intentScore: 72,
        fitScore: 76,
      },
    },
  },
];
