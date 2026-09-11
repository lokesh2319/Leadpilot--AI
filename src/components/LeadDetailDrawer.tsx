import React, { useState, useEffect } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Phone, 
  Mail, 
  Clock, 
  Sparkles, 
  CheckCircle2, 
  MessageSquare, 
  Tag, 
  DollarSign, 
  ArrowUpRight, 
  Trash2, 
  Share2, 
  Building, 
  AlertTriangle,
  Flame,
  Zap,
  ShieldCheck,
  Calendar
} from 'lucide-react';
import { StoredLead, NavTab } from '../types';

interface LeadDetailDrawerProps {
  lead: StoredLead | null;
  onClose: () => void;
  onNavigate?: (tab: NavTab) => void;
  onSelectLeadForWorkspace?: (lead: StoredLead) => void;
  onDeleteLead?: (id: string) => void;
}

export const LeadDetailDrawer: React.FC<LeadDetailDrawerProps> = ({
  lead,
  onClose,
  onNavigate,
  onSelectLeadForWorkspace,
  onDeleteLead,
}) => {
  const [copiedResponse, setCopiedResponse] = useState(false);
  const [copiedAll, setCopiedAll] = useState(false);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!lead) return null;

  const handleCopyResponse = () => {
    if (!lead.suggested_response) return;
    navigator.clipboard.writeText(lead.suggested_response);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2200);
  };

  const handleCopySummaryRecord = () => {
    const text = `Customer: ${lead.customer_name}
Email: ${lead.email}
Phone: ${lead.phone || 'N/A'}
Source: ${lead.lead_source}
Product/Service: ${lead.product_service}
Budget: ${lead.budget || 'N/A'}
AI Score: ${lead.lead_score}/100 (${lead.classification})
Purchase Intent: ${lead.purchase_intent} | Priority: ${lead.priority}
Summary: ${lead.summary}
Recommended Action: ${lead.recommended_action}
`;
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2200);
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString || 'Recent';
    }
  };

  const isHot = lead.classification === 'Hot';
  const isWarm = lead.classification === 'Warm';

  return (
    <div 
      id="lead-detail-backdrop"
      className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        id="lead-detail-drawer"
        className="w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col overflow-hidden text-slate-900 animate-in slide-in-from-right duration-250 border-l border-slate-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-200 bg-slate-50/80 flex items-start justify-between gap-4 shrink-0">
          <div className="flex items-start gap-3.5">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-base shrink-0 shadow-xs ${
              isHot
                ? 'bg-emerald-600 text-white'
                : isWarm
                ? 'bg-amber-500 text-white'
                : 'bg-slate-700 text-white'
            }`}>
              {(lead.customer_name || 'LP').slice(0, 2).toUpperCase()}
            </div>

            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                  {lead.customer_name}
                </h2>
                
                {/* Classification Badge */}
                <span className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                  isHot
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : isWarm
                    ? 'bg-amber-100 text-amber-800 border border-amber-200'
                    : 'bg-slate-100 text-slate-700 border border-slate-200'
                }`}>
                  {isHot && <Flame className="w-3 h-3 text-emerald-600" />}
                  <span>{lead.classification}</span>
                </span>

                {/* Lead Score Badge */}
                <span className="inline-flex items-center gap-1 text-xs font-mono font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Score: {lead.lead_score}/100
                </span>
              </div>

              {/* Contact meta */}
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500 mt-1.5">
                <a 
                  href={`mailto:${lead.email}`}
                  className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span>{lead.email}</span>
                </a>

                {lead.phone && (
                  <a 
                    href={`tel:${lead.phone}`}
                    className="flex items-center gap-1 hover:text-blue-600 transition-colors"
                  >
                    <Phone className="w-3.5 h-3.5 text-slate-400" />
                    <span>{lead.phone}</span>
                  </a>
                )}

                <span className="flex items-center gap-1 text-slate-400">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>{formatDate(lead.created_at)}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              id="btn-copy-lead-summary"
              onClick={handleCopySummaryRecord}
              title="Copy lead record to clipboard"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              {copiedAll ? <Check className="w-4 h-4 text-emerald-600" /> : <Share2 className="w-4 h-4" />}
            </button>
            <button
              type="button"
              id="btn-close-lead-drawer"
              onClick={onClose}
              title="Close lead view (Esc)"
              className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-lg transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs">
          {/* Key Metric Scorecards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* AI Score */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                AI Lead Score
              </span>
              <div className="mt-1 flex items-baseline gap-1.5">
                <span className={`text-xl font-bold font-mono ${
                  lead.lead_score >= 80 ? 'text-emerald-600' : lead.lead_score >= 50 ? 'text-amber-600' : 'text-slate-600'
                }`}>
                  {lead.lead_score}
                </span>
                <span className="text-slate-400 text-xs">/ 100</span>
              </div>
              <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full ${
                    lead.lead_score >= 80 ? 'bg-emerald-500' : lead.lead_score >= 50 ? 'bg-amber-500' : 'bg-slate-400'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(0, lead.lead_score))}%` }}
                />
              </div>
            </div>

            {/* Classification */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Classification
              </span>
              <span className={`inline-block mt-1 text-base font-bold ${
                isHot ? 'text-emerald-700' : isWarm ? 'text-amber-700' : 'text-slate-700'
              }`}>
                {lead.classification} Lead
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                {isHot ? 'High conversion readiness' : isWarm ? 'Qualified interest' : 'Low conversion fit'}
              </p>
            </div>

            {/* Purchase Intent */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Purchase Intent
              </span>
              <span className="inline-block mt-1 text-base font-bold text-slate-900">
                {lead.purchase_intent || 'Medium'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                Evaluation stage
              </p>
            </div>

            {/* Priority */}
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white shadow-2xs">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 block">
                Sales Priority
              </span>
              <span className={`inline-block mt-1 text-base font-bold ${
                lead.priority === 'Urgent' 
                  ? 'text-rose-600' 
                  : lead.priority === 'High' 
                  ? 'text-orange-600' 
                  : 'text-slate-700'
              }`}>
                {lead.priority || 'Medium'}
              </span>
              <p className="text-[11px] text-slate-400 mt-1">
                SDR follow-up speed
              </p>
            </div>
          </div>

          {/* Customer & Inquiry Details */}
          <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-slate-500" />
              <span>Inbound Commercial Details</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Product / Service</span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{lead.product_service || 'Not specified'}</p>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Lead Source</span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5">{lead.lead_source || 'Inbound'}</p>
              </div>

              <div className="p-2.5 bg-white rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block">Reported Budget</span>
                <p className="text-xs font-semibold text-slate-800 mt-0.5 font-mono">{lead.budget || 'Not specified'}</p>
              </div>
            </div>

            {lead.message && (
              <div className="p-3 bg-white rounded-lg border border-slate-200/80">
                <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">
                  Customer Enquiry / Requirement
                </span>
                <p className="text-xs text-slate-700 leading-relaxed italic bg-slate-50 p-2.5 rounded border border-slate-200/60">
                  "{lead.message}"
                </p>
              </div>
            )}
          </div>

          {/* AI Executive Summary */}
          <div className="p-4 rounded-xl border border-blue-200 bg-blue-50/40 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-600" />
              <span>AI Lead Summary & Context</span>
            </h3>
            <p className="text-xs text-slate-700 leading-relaxed">
              {lead.summary || 'AI qualification summary pending generation.'}
            </p>
          </div>

          {/* Key Drivers / Reasoning */}
          {lead.reasoning && lead.reasoning.length > 0 && (
            <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-2.5 shadow-2xs">
              <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-slate-600" />
                <span>Key Qualification Drivers</span>
              </h3>
              <ul className="space-y-1.5">
                {lead.reasoning.map((item, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-slate-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-600 mt-1.5 shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Recommended Sales Action */}
          <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-2">
            <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>Recommended Next Action for Sales Rep</span>
            </h3>
            <p className="text-xs text-slate-800 font-medium leading-relaxed">
              {lead.recommended_action || 'Review inquiry and contact prospect directly.'}
            </p>
          </div>

          {/* Suggested Outreach Response with 1-Click Copy */}
          {lead.suggested_response && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-indigo-600" />
                  <span>AI Suggested Customer Response</span>
                </h3>

                <button
                  type="button"
                  id="btn-drawer-copy-response"
                  onClick={handleCopyResponse}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                    copiedResponse
                      ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                      : 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 border border-indigo-200'
                  }`}
                >
                  {copiedResponse ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copied to Clipboard!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Copy Response</span>
                    </>
                  )}
                </button>
              </div>

              <div className="p-4 rounded-xl bg-slate-900 text-slate-100 text-xs font-sans leading-relaxed whitespace-pre-line border border-slate-800 shadow-inner">
                {lead.suggested_response}
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer Controls */}
        <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
          <div>
            {onDeleteLead && (
              <button
                type="button"
                id="btn-delete-lead-from-drawer"
                onClick={() => {
                  if (window.confirm(`Delete lead record for ${lead.customer_name}?`)) {
                    onDeleteLead(lead.id);
                    onClose();
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete Lead</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            {onSelectLeadForWorkspace && (
              <button
                type="button"
                id="btn-open-lead-in-analysis"
                onClick={() => {
                  onSelectLeadForWorkspace(lead);
                  onClose();
                  if (onNavigate) onNavigate('analysis');
                }}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <span>Open in AI Workspace</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
