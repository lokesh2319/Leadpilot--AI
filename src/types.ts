export type NavTab = 'dashboard' | 'leads' | 'analysis' | 'settings';

export type LeadSource = 
  | 'Website Inbound'
  | 'Product Demo Request'
  | 'Referral'
  | 'LinkedIn Outreach'
  | 'Google Search / Ads'
  | 'Webinar / Event'
  | 'Cold Email'
  | 'Partner Channel';

export interface LeadFormData {
  customerName: string;
  phoneNumber: string;
  email: string;
  leadSource: string;
  productInterest: string;
  budget: string;
  customerMessage: string;
}

export interface GeminiLeadResponse {
  lead_score: number;
  classification: 'Hot' | 'Warm' | 'Cold';
  purchase_intent: 'High' | 'Medium' | 'Low';
  priority: 'High' | 'Medium' | 'Low';
  summary: string;
  recommended_action: string;
  suggested_response: string;
  reasoning: string[];
}

export interface LeadAnalysisResult {
  leadScore: number; // out of 100
  classification: 'Hot' | 'Warm' | 'Cold';
  purchaseIntent: 'High' | 'Medium' | 'Low' | string;
  priority: 'High' | 'Medium' | 'Low' | 'Urgent';
  shortSummary: string;
  recommendedNextAction: string;
  suggestedResponse: string;
  reasoning?: string[];
  timestamp: string;
  calculatedMetrics?: {
    budgetScore: number;
    intentScore: number;
    fitScore: number;
  };
}

export interface LeadRecord extends LeadFormData {
  id: string;
  createdAt: string;
  analysis?: LeadAnalysisResult;
}

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

