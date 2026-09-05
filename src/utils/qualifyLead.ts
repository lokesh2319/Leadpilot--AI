import { LeadFormData, LeadAnalysisResult } from '../types';

/**
 * Computes client-side qualification metrics and placeholders
 * based on input fields without external API/AI calls.
 */
export function qualifyLead(formData: LeadFormData): LeadAnalysisResult {
  const name = formData.customerName.trim() || 'Prospect';
  const firstName = name.split(' ')[0] || 'there';
  const message = formData.customerMessage.toLowerCase();
  const budgetRaw = formData.budget.toLowerCase().replace(/[^0-9kK]/g, '');
  const product = formData.productInterest || 'LeadPilot Platform';
  const source = formData.leadSource || 'Inbound';

  // 1. Budget assessment
  let budgetScore = 65;
  let parsedBudget = 0;
  if (budgetRaw.includes('k')) {
    parsedBudget = parseFloat(budgetRaw.replace('k', '')) * 1000;
  } else {
    parsedBudget = parseFloat(budgetRaw) || 0;
  }

  if (formData.budget.toLowerCase().includes('under 5') || (parsedBudget > 0 && parsedBudget < 5000)) {
    budgetScore = 40;
  } else if (parsedBudget >= 50000 || formData.budget.includes('50,000') || formData.budget.includes('100,000')) {
    budgetScore = 95;
  } else if (parsedBudget >= 20000 || formData.budget.includes('20,000') || formData.budget.includes('35,000')) {
    budgetScore = 80;
  } else if (parsedBudget >= 10000 || formData.budget.includes('10,000')) {
    budgetScore = 70;
  }

  // 2. Intent assessment from message keywords
  let intentScore = 60;
  const urgentKeywords = ['this week', 'immediately', 'urgent', 'q3', 'demo', 'vp', 'approved', 'buying', 'hire', 'asap', 'live by'];
  const coldKeywords = ['browsing', 'free', 'pre-revenue', 'student', 'maybe later', 'cheap', 'curious', 'trial only'];

  let urgentMatches = 0;
  let coldMatches = 0;

  urgentKeywords.forEach(kw => {
    if (message.includes(kw)) urgentMatches++;
  });
  coldKeywords.forEach(kw => {
    if (message.includes(kw)) coldMatches++;
  });

  if (urgentMatches >= 2) {
    intentScore = 95;
  } else if (urgentMatches === 1) {
    intentScore = 82;
  } else if (coldMatches >= 1) {
    intentScore = 35;
  }

  // Source modifier
  let sourceMultiplier = 1.0;
  if (source.includes('Referral') || source.includes('Demo')) {
    sourceMultiplier = 1.1;
  } else if (source.includes('Cold') || source.includes('Website')) {
    sourceMultiplier = 0.95;
  }

  // Fit score
  const fitScore = Math.min(98, Math.max(30, Math.round((budgetScore * 0.5 + intentScore * 0.5) * sourceMultiplier)));
  const finalScore = Math.min(99, Math.max(18, Math.round(budgetScore * 0.4 + intentScore * 0.45 + (sourceMultiplier * 15))));

  // Classification & Priority
  let classification: 'Hot' | 'Warm' | 'Cold' = 'Warm';
  let priority: 'Urgent' | 'High' | 'Medium' | 'Low' = 'Medium';
  let purchaseIntent: 'Immediate (< 30 days)' | 'High (1-3 months)' | 'Moderate (3-6 months)' | 'Low / Exploratory' = 'Moderate (3-6 months)';

  if (finalScore >= 80) {
    classification = 'Hot';
    priority = finalScore >= 90 ? 'Urgent' : 'High';
    purchaseIntent = 'Immediate (< 30 days)';
  } else if (finalScore >= 55) {
    classification = 'Warm';
    priority = 'Medium';
    purchaseIntent = 'High (1-3 months)';
  } else {
    classification = 'Cold';
    priority = 'Low';
    purchaseIntent = 'Low / Exploratory';
  }

  // Dynamic summary
  let shortSummary = '';
  if (classification === 'Hot') {
    shortSummary = `High-value prospect interested in ${product}. Clear purchase timeline with established budget (${formData.budget || 'enterprise scale'}). Inbound enquiry indicates executive alignment and rapid deployment intent.`;
  } else if (classification === 'Warm') {
    shortSummary = `Qualified mid-tier opportunity seeking ${product}. Viable budget scope (${formData.budget || 'standard'}). Requires solution mapping and verification of decision-maker timeline.`;
  } else {
    shortSummary = `Early exploratory inquiry regarding ${product}. Budget constraints (${formData.budget || 'unspecified'}) or early-stage evaluation timeline indicate low immediate conversion readiness.`;
  }

  // Recommended next action
  let recommendedNextAction = '';
  if (classification === 'Hot') {
    recommendedNextAction = `Schedule a 25-minute solution architecture discovery call with Senior Account Executive within 2 business hours. Prepare customized enterprise ROI model and collateral for ${product}.`;
  } else if (classification === 'Warm') {
    recommendedNextAction = `Send targeted product overview deck and interactive demo link. Follow up via phone/email within 24 hours to clarify implementation timeline and integration needs.`;
  } else {
    recommendedNextAction = `Enroll in automated nurture email sequence with self-serve product guides and on-demand webinar access. Re-evaluate qualification in 60 days.`;
  }

  // Suggested response
  let suggestedResponse = '';
  if (classification === 'Hot') {
    suggestedResponse = `Hi ${firstName},\n\nThank you for reaching out to LeadPilot AI! Given your timeline and interest in our ${product}, I would love to connect you directly with our solutions team to show you exactly how we accelerate inbound qualification.\n\nAre you available for a brief 20-minute introductory call this week? I have openings tomorrow at 10:00 AM or 2:30 PM.\n\nLooking forward to speaking with you!\n\nBest regards,\nSarah Jenkins\nSenior Account Executive | LeadPilot AI\n${formData.phoneNumber ? `P.S. I can also reach you at ${formData.phoneNumber} if preferred.` : ''}`;
  } else if (classification === 'Warm') {
    suggestedResponse = `Hi ${firstName},\n\nThanks for contacting LeadPilot AI! I reviewed your note regarding ${product}. We have helped many teams streamline their inbound sales workflows and solve similar pipeline challenges.\n\nI have attached an overview of our platform capabilities and standard integration options. Would you have 15 minutes later this week to discuss how this aligns with your goals?\n\nBest regards,\nSarah Jenkins\nAccount Executive | LeadPilot AI`;
  } else {
    suggestedResponse = `Hi ${firstName},\n\nThank you for your interest in LeadPilot AI! It is great to hear about your exploration into ${product}.\n\nTo help you get started, here is a link to our product overview video and our transparent tier breakdown. Please feel free to explore our self-guided tour anytime, and let me know if any specific questions arise as you plan ahead.\n\nWarm regards,\nSarah Jenkins\nSales Team | LeadPilot AI`;
  }

  return {
    leadScore: finalScore,
    classification,
    purchaseIntent,
    priority,
    shortSummary,
    recommendedNextAction,
    suggestedResponse: suggestedResponse.trim(),
    reasoning: [
      `Budget assessment aligned with ${formData.budget || 'specified range'}.`,
      `Intent indicators identified in customer enquiry message.`,
      `Lead channel factor applied for ${source}.`,
    ],
    timestamp: new Date().toISOString(),
    calculatedMetrics: {
      budgetScore,
      intentScore,
      fitScore,
    },
  };
}
