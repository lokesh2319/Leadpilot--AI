import React, { useState } from 'react';
import { 
  Search, 
  Plus, 
  Trash2, 
  Sparkles, 
  Clock, 
  X, 
  Copy, 
  Check, 
  Phone, 
  Mail, 
  RotateCw, 
  ChevronRight, 
  ArrowUpRight, 
  Building2, 
  Tag, 
  DollarSign, 
  MessageSquare,
  AlertCircle
} from 'lucide-react';
import { StoredLead, NavTab, LeadRecord } from '../types';

interface LeadsViewProps {
  leads: StoredLead[];
  isLoading?: boolean;
  onRefresh: () => void;
  onNavigate: (tab: NavTab) => void;
  onSelectLeadForWorkspace?: (lead: StoredLead) => void;
  onDeleteLead?: (id: string) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  isLoading = false,
  onRefresh,
  onNavigate,
  onSelectLeadForWorkspace,
  onDeleteLead,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterClass, setFilterClass] = useState<'All' | 'Hot' | 'Warm' | 'Cold'>('All');
  const [selectedLead, setSelectedLead] = useState<StoredLead | null>(null);
  const [copiedResponse, setCopiedResponse] = useState(false);

  // Filter leads based on search term and classification
  const filteredLeads = leads.filter((lead) => {
    const term = searchTerm.toLowerCase();
    const matchesSearch =
      (lead.customer_name || '').toLowerCase().includes(term) ||
      (lead.email || '').toLowerCase().includes(term) ||
      (lead.product_service || '').toLowerCase().includes(term) ||
      (lead.lead_source || '').toLowerCase().includes(term) ||
      (lead.message || '').toLowerCase().includes(term);

    const matchesClass =
      filterClass === 'All' || lead.classification === filterClass;

    return matchesSearch && matchesClass;
  });

  const handleCopyResponse = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedResponse(true);
    setTimeout(() => setCopiedResponse(false), 2000);
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
      return isoString || 'Recently';
    }
  };

  return (
    <div className="space-y-4">
      {/* Top Controls & Metrics Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex flex-1 flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-leads-search"
              placeholder="Search leads by customer, email, source, product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Classification Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg self-start sm:self-auto">
            {(['All', 'Hot', 'Warm', 'Cold'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                id={`btn-filter-${filter.toLowerCase()}`}
                onClick={() => setFilterClass(filter)}
                className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  filterClass === filter
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 self-end md:self-auto">
          <button
            type="button"
            id="btn-refresh-leads"
            onClick={onRefresh}
            disabled={isLoading}
            title="Refresh leads from database"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-60"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>

          <button
            type="button"
            id="btn-leads-view-new-qualify"
            onClick={() => onNavigate('analysis')}
            className="inline-flex items-center justify-center gap-1.5 px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Qualify New Lead</span>
          </button>
        </div>
      </div>

      {/* CRM Leads Table Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Saved Lead Pipeline</span>
            <span className="text-[11px] bg-slate-200/80 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {filteredLeads.length} {filteredLeads.length === 1 ? 'Lead' : 'Leads'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400">Click any row to open the full AI analysis</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Lead Source</th>
                <th className="py-3 px-4">Product/Service</th>
                <th className="py-3 px-4 text-center">Score</th>
                <th className="py-3 px-4 text-center">Classification</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-right">Created At</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLeads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-500">No leads found</p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        No leads match your current search or filter. Qualify a new lead or send sample JSON to POST /api/leads/analyze.
                      </p>
                      <button
                        type="button"
                        onClick={() => onNavigate('analysis')}
                        className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline cursor-pointer"
                      >
                        Qualify a lead now &rarr;
                      </button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredLeads.map((lead) => (
                  <tr
                    key={lead.id}
                    id={`lead-row-${lead.id}`}
                    onClick={() => setSelectedLead(lead)}
                    className="hover:bg-blue-50/40 cursor-pointer transition-colors group select-none"
                  >
                    {/* Customer */}
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                        {lead.customer_name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                        <span className="truncate max-w-[140px]">{lead.email}</span>
                        {lead.phone && (
                          <>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-slate-400">{lead.phone}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Lead Source */}
                    <td className="py-3.5 px-4">
                      <span className="inline-block text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/60">
                        {lead.lead_source || 'Website'}
                      </span>
                    </td>

                    {/* Product/Service */}
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-800 max-w-[180px] truncate">
                        {lead.product_service || 'General'}
                      </div>
                      {lead.budget && (
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">
                          Budget: {lead.budget}
                        </div>
                      )}
                    </td>

                    {/* Score */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block font-mono font-bold text-xs px-2.5 py-0.5 rounded ${
                          lead.lead_score >= 80
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : lead.lead_score >= 55
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {lead.lead_score}
                      </span>
                    </td>

                    {/* Classification */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          lead.classification === 'Hot'
                            ? 'bg-emerald-100 text-emerald-800'
                            : lead.classification === 'Warm'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {lead.classification}
                      </span>
                    </td>

                    {/* Priority */}
                    <td className="py-3.5 px-4 text-center">
                      <span
                        className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                          lead.priority === 'Urgent'
                            ? 'bg-rose-50 text-rose-700 border border-rose-200/60'
                            : lead.priority === 'High'
                            ? 'bg-orange-50 text-orange-700 border border-orange-200/60'
                            : 'bg-slate-100 text-slate-600 border border-slate-200/60'
                        }`}
                      >
                        {lead.priority}
                      </span>
                    </td>

                    {/* Created At */}
                    <td className="py-3.5 px-4 text-right text-slate-500 whitespace-nowrap text-[11px] font-mono">
                      <div className="flex items-center justify-end gap-1.5">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{formatDate(lead.created_at)}</span>
                        <ChevronRight className="w-3.5 h-3.5 text-slate-300 group-hover:text-blue-500 transition-transform group-hover:translate-x-0.5 ml-1" />
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Full AI Analysis Modal / Slide-Over */}
      {selectedLead && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in duration-150"
          onClick={() => setSelectedLead(null)}
        >
          <div
            className="bg-white rounded-xl border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden text-slate-900 text-xs"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900">
                    {selectedLead.customer_name}
                  </h3>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      selectedLead.classification === 'Hot'
                        ? 'bg-emerald-100 text-emerald-800'
                        : selectedLead.classification === 'Warm'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 text-slate-700'
                    }`}
                  >
                    {selectedLead.classification}
                  </span>
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-800">
                    Score: {selectedLead.lead_score}/100
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1.5">
                  <span className="flex items-center gap-1">
                    <Mail className="w-3 h-3 text-slate-400" />
                    {selectedLead.email}
                  </span>
                  {selectedLead.phone && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3 h-3 text-slate-400" />
                      {selectedLead.phone}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3 text-slate-400" />
                    {formatDate(selectedLead.created_at)}
                  </span>
                </div>
              </div>

              <button
                type="button"
                id="btn-close-lead-analysis-modal"
                onClick={() => setSelectedLead(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Lead Metrics Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Lead Score</span>
                  <span className="text-lg font-bold font-mono text-slate-900 block mt-0.5">{selectedLead.lead_score} / 100</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Classification</span>
                  <span className="text-lg font-bold text-slate-900 block mt-0.5">{selectedLead.classification}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Purchase Intent</span>
                  <span className="text-lg font-bold text-slate-900 block mt-0.5">{selectedLead.purchase_intent}</span>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">Priority</span>
                  <span className="text-lg font-bold text-slate-900 block mt-0.5">{selectedLead.priority}</span>
                </div>
              </div>

              {/* Inquiry Metadata */}
              <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50 space-y-2">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Product Interest</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedLead.product_service}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Lead Source</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedLead.lead_source}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-semibold text-slate-400 uppercase">Allocated Budget</span>
                    <p className="font-semibold text-slate-800 mt-0.5">{selectedLead.budget || 'Not specified'}</p>
                  </div>
                </div>

                {selectedLead.message && (
                  <div className="pt-2 border-t border-slate-200/70">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase block mb-1">Customer Enquiry:</span>
                    <p className="text-xs text-slate-700 italic bg-white p-2.5 rounded border border-slate-200">
                      "{selectedLead.message}"
                    </p>
                  </div>
                )}
              </div>

              {/* Lead Summary */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>AI Lead Summary</span>
                </h4>
                <p className="text-slate-700 bg-blue-50/40 p-3 rounded-lg border border-blue-100/80 leading-relaxed">
                  {selectedLead.summary || 'Summary pending.'}
                </p>
              </div>

              {/* Recommended Next Action */}
              <div>
                <h4 className="font-bold text-slate-900 mb-1.5 flex items-center gap-1.5">
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Recommended Next Action for Sales</span>
                </h4>
                <p className="text-slate-700 bg-emerald-50/40 p-3 rounded-lg border border-emerald-100/80 leading-relaxed font-medium">
                  {selectedLead.recommended_action || 'Action pending.'}
                </p>
              </div>

              {/* Suggested Customer Response */}
              {selectedLead.suggested_response && (
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <h4 className="font-bold text-slate-900 flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Suggested Customer Response</span>
                    </h4>
                    <button
                      type="button"
                      id="btn-modal-copy-response"
                      onClick={() => handleCopyResponse(selectedLead.suggested_response)}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 hover:text-blue-600 cursor-pointer"
                    >
                      {copiedResponse ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-600" />
                          <span className="text-emerald-600">Copied to Clipboard!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Response</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="p-3 rounded-lg bg-slate-900 text-slate-100 font-sans text-xs leading-relaxed whitespace-pre-line border border-slate-800">
                    {selectedLead.suggested_response}
                  </div>
                </div>
              )}

              {/* Reasoning Points */}
              {selectedLead.reasoning && selectedLead.reasoning.length > 0 && (
                <div>
                  <h4 className="font-bold text-slate-900 mb-1.5">Key Qualification Drivers</h4>
                  <ul className="space-y-1.5">
                    {selectedLead.reasoning.map((reason, i) => (
                      <li key={i} className="flex items-start gap-2 text-slate-600">
                        <span className="text-blue-600 font-bold mt-0.5">&bull;</span>
                        <span>{reason}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              {onDeleteLead ? (
                <button
                  type="button"
                  onClick={() => {
                    if (confirm(`Delete lead record for ${selectedLead.customer_name}?`)) {
                      onDeleteLead(selectedLead.id);
                      setSelectedLead(null);
                    }
                  }}
                  className="inline-flex items-center gap-1 text-slate-500 hover:text-rose-600 text-xs font-semibold px-2 py-1.5 rounded hover:bg-rose-50 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Lead</span>
                </button>
              ) : <div />}

              <div className="flex items-center gap-2">
                {onSelectLeadForWorkspace && (
                  <button
                    type="button"
                    onClick={() => {
                      onSelectLeadForWorkspace(selectedLead);
                      setSelectedLead(null);
                      onNavigate('analysis');
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                  >
                    <span>Open in AI Workspace</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setSelectedLead(null)}
                  className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
