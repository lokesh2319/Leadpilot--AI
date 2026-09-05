import React from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Compass, 
  Package, 
  DollarSign, 
  MessageSquare, 
  Sparkles,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { LeadFormData } from '../types';

interface LeadFormProps {
  formData: LeadFormData;
  onChange: (field: keyof LeadFormData, value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isAnalyzing: boolean;
  validationErrors?: Partial<Record<keyof LeadFormData, string>>;
  errorMessage?: string | null;
}

export const LEAD_SOURCES = [
  'Website Inbound',
  'Product Demo Request',
  'Referral',
  'LinkedIn Outreach',
  'Google Search / Ads',
  'Webinar / Event',
  'Cold Email',
  'Partner Channel',
  'Other',
];

export const PRODUCTS_SERVICES = [
  'Enterprise Lead Automation Platform',
  'CRM Integration & Workflow Sync',
  'Sales AI SDR Assistant Suite',
  'Starter Qualification Package',
  'Consultative Pipeline Audit',
  'Custom Enterprise API Tier',
];

export const BUDGET_TIERS = [
  'Under $5,000',
  '$5,000 - $15,000',
  '$15,000 - $35,000',
  '$35,000 - $75,000',
  '$75,000 - $150,000+',
  'Budget Pending Approval',
];

export const LeadForm: React.FC<LeadFormProps> = ({
  formData,
  onChange,
  onSubmit,
  isAnalyzing,
  validationErrors,
  errorMessage = null,
}) => {
  const errors = validationErrors || {};
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Header bar matching Professional Polish */}
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h2 className="font-semibold text-slate-700 text-sm tracking-tight">
            Customer Entry
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Enter prospect data for qualification analysis
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-500 bg-slate-50 px-2.5 py-1 rounded border border-slate-200">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
          <span className="font-medium text-[11px]">Ready</span>
        </div>
      </div>

      <form id="lead-qualification-form" onSubmit={onSubmit} noValidate className="flex-1 flex flex-col justify-between">
        <div className="p-5 space-y-4">
          {/* Customer Name */}
          <div>
            <label htmlFor="customer-name-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Customer Name <span className="text-rose-500">*</span>
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <User className="w-4 h-4" />
              </div>
              <input
                id="customer-name-input"
                type="text"
                placeholder="e.g. Marcus Vance"
                value={formData.customerName}
                onChange={(e) => onChange('customerName', e.target.value)}
                className={`w-full pl-9 pr-3 py-2 border rounded-md bg-white text-sm focus:outline-none transition-all text-slate-900 placeholder:text-slate-400 ${
                  errors.customerName
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/50'
                    : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
            </div>
            {errors.customerName && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {errors.customerName}
              </p>
            )}
          </div>

          {/* Contact Details (Phone & Email) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Phone Number */}
            <div>
              <label htmlFor="customer-phone-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Phone Number
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  id="customer-phone-input"
                  type="tel"
                  placeholder="e.g. +1 (415) 892-3401"
                  value={formData.phoneNumber}
                  onChange={(e) => onChange('phoneNumber', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="customer-email-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Email Address <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Mail className="w-4 h-4" />
                </div>
                <input
                  id="customer-email-input"
                  type="email"
                  placeholder="e.g. marcus@apexlogistics.io"
                  value={formData.email}
                  onChange={(e) => onChange('email', e.target.value)}
                  className={`w-full pl-9 pr-3 py-2 border rounded-md bg-white text-sm focus:outline-none transition-all text-slate-900 placeholder:text-slate-400 ${
                    errors.email
                      ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/50'
                      : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>
          </div>

          {/* Lead Source & Product Interest */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Lead Source */}
            <div>
              <label htmlFor="lead-source-select" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Lead Source
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Compass className="w-4 h-4" />
                </div>
                <select
                  id="lead-source-select"
                  value={formData.leadSource}
                  onChange={(e) => onChange('leadSource', e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 cursor-pointer appearance-none transition-all"
                >
                  {LEAD_SOURCES.map((src) => (
                    <option key={src} value={src}>
                      {src}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>

            {/* Product / Service Interested In */}
            <div>
              <label htmlFor="product-interest-select" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Product / Service
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Package className="w-4 h-4" />
                </div>
                <select
                  id="product-interest-select"
                  value={formData.productInterest}
                  onChange={(e) => onChange('productInterest', e.target.value)}
                  className="w-full pl-9 pr-8 py-2 border border-slate-200 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 cursor-pointer appearance-none transition-all"
                >
                  {PRODUCTS_SERVICES.map((prod) => (
                    <option key={prod} value={prod}>
                      {prod}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center px-2.5 pointer-events-none text-slate-400 text-xs">
                  ▼
                </div>
              </div>
            </div>
          </div>

          {/* Budget */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="lead-budget-input" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Budget
              </label>
              <span className="text-[10px] text-slate-400">Optional tier selection</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div className="sm:col-span-2 relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <DollarSign className="w-4 h-4" />
                </div>
                <input
                  id="lead-budget-input"
                  type="text"
                  placeholder="e.g. $50,000 - $100,000"
                  value={formData.budget}
                  onChange={(e) => onChange('budget', e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 rounded-md bg-white text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-slate-900 placeholder:text-slate-400 transition-all"
                />
              </div>
              <div className="relative">
                <select
                  id="budget-preset-select"
                  aria-label="Preset budget tier selector"
                  value=""
                  onChange={(e) => {
                    if (e.target.value) {
                      onChange('budget', e.target.value);
                    }
                  }}
                  className="w-full px-2.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-md text-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
                >
                  <option value="">Quick tier...</option>
                  {BUDGET_TIERS.map((tier) => (
                    <option key={tier} value={tier}>
                      {tier}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Customer Message or Enquiry */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="customer-message-textarea" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Customer Message or Enquiry <span className="text-rose-500">*</span>
              </label>
            </div>
            <div className="relative">
              <div className="absolute top-2.5 left-3 pointer-events-none text-slate-400">
                <MessageSquare className="w-4 h-4" />
              </div>
              <textarea
                id="customer-message-textarea"
                rows={3}
                placeholder="Paste or write the customer's exact inquiry, requirements, current challenges, or timeline..."
                value={formData.customerMessage}
                onChange={(e) => onChange('customerMessage', e.target.value)}
                className={`w-full pl-9 pr-3 py-2 border rounded-md bg-white text-sm focus:outline-none transition-all resize-y leading-relaxed text-slate-900 placeholder:text-slate-400 ${
                  errors.customerMessage
                    ? 'border-rose-400 focus:ring-2 focus:ring-rose-400/50'
                    : 'border-slate-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
              />
            </div>
            {errors.customerMessage && (
              <p className="text-[11px] text-rose-500 mt-1 flex items-center gap-1 font-medium">
                <AlertCircle className="w-3 h-3" />
                {errors.customerMessage}
              </p>
            )}
          </div>
        </div>

        {/* Action Button Container matching Professional Polish */}
        <div className="p-5 border-t border-slate-100 bg-slate-50/40">
          {errorMessage && (
            <div 
              id="form-error-banner" 
              className="mb-3 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-2.5 text-xs text-rose-700 animate-fadeIn"
            >
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-rose-800">Gemini AI Analysis Error</p>
                <p className="text-rose-600 mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          <button
            type="submit"
            id="btn-analyze-lead"
            disabled={isAnalyzing}
            className={`w-full py-3 rounded-lg font-bold transition-all flex items-center justify-center gap-2 cursor-pointer ${
              isAnalyzing
                ? 'bg-blue-800 text-blue-200 cursor-wait shadow-none'
                : 'bg-blue-600 text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-[0.99]'
            }`}
          >
            {isAnalyzing ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Analyzing Lead with Gemini...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Analyze Lead</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
