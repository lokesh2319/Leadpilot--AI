
export interface NormalizedLeadInput {
  customer_name: string;
  phone: string;
  email: string;
  lead_source: string;
  product_service: string;
  budget: string;
  message: string;
}

/**
 * Normalizes both LeadPilot-native payloads and generic CRM payloads
 * (e.g., Zoho CRM, Salesforce, HubSpot webhooks) into a standard LeadPilot format.
 *
 * Mappings:
 * Full_Name      -> customer_name
 * Phone          -> phone
 * Email          -> email
 * Lead_Source    -> lead_source
 * Product        -> product_service
 * Annual_Revenue -> budget
 * Description    -> message
 */
export function normalizeLeadPayload(raw: any): NormalizedLeadInput {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return {
      customer_name: '',
      phone: '',
      email: '',
      lead_source: 'Website',
      product_service: 'CRM Automation',
      budget: '',
      message: '',
    };
  }

  // Helper to extract first non-empty string or value
  const pick = (...candidates: any[]): string => {
    for (const val of candidates) {
      if (val !== undefined && val !== null) {
        const str = String(val).trim();
        if (str.length > 0) return str;
      }
    }
    return '';
  };

  const customer_name = pick(raw.customer_name, raw.Full_Name, raw.customerName, raw.name);
  const phone = pick(raw.phone, raw.Phone, raw.phoneNumber, raw.Mobile);
  const email = pick(raw.email, raw.Email);
  const lead_source = pick(raw.lead_source, raw.Lead_Source, raw.leadSource) || 'Website';
  const product_service = pick(raw.product_service, raw.Product, raw.productInterest) || 'CRM Automation';
  const budget = pick(raw.budget, raw.Annual_Revenue, raw.annual_revenue, raw.revenue);
  const message = pick(raw.message, raw.Description, raw.customerMessage, raw.Notes);

  return {
    customer_name,
    phone,
    email,
    lead_source,
    product_service,
    budget,
    message,
  };
}

export function validateNormalizedLead(normalized: NormalizedLeadInput): { valid: boolean; error?: string } {
  if (!normalized.customer_name) {
    return { valid: false, error: "Field 'customer_name' (or 'Full_Name') is required and must not be empty." };
  }

  if (!normalized.email) {
    return { valid: false, error: "Field 'email' (or 'Email') is required." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(normalized.email)) {
    return { valid: false, error: "Field 'email' must be a valid email address." };
  }

  if (!normalized.message) {
    return { valid: false, error: "Field 'message' (or 'Description') is required and must describe the customer requirement." };
  }

  return { valid: true };
}
