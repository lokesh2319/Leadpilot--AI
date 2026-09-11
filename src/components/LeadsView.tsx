import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  RotateCw, 
  Sparkles, 
  Clock, 
  Eye, 
  Filter, 
  Building2, 
  ArrowUpDown, 
  Layers, 
  Flame, 
  TrendingUp, 
  AlertCircle,
  Check,
  ChevronRight,
  Download
} from 'lucide-react';
import { StoredLead, NavTab } from '../types';
import { LeadDetailDrawer } from './LeadDetailDrawer';

interface LeadsViewProps {
  leads: StoredLead[];
  isLoading?: boolean;
  onRefresh: () => void;
  onNavigate: (tab: NavTab) => void;
  onSelectLeadForWorkspace?: (lead: StoredLead) => void;
  onDeleteLead?: (id: string) => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: (enabled: boolean) => void;
}

export const LeadsView: React.FC<LeadsViewProps> = ({
  leads,
  isLoading = false,
  onRefresh,
  onNavigate,
  onSelectLeadForWorkspace,
  onDeleteLead,
  isDemoMode = false,
  onToggleDemoMode,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [classificationFilter, setClassificationFilter] = useState<'All' | 'Hot' | 'Warm' | 'Cold'>('All');
  const [priorityFilter, setPriorityFilter] = useState<'All' | 'Urgent' | 'High' | 'Medium' | 'Low'>('All');
  const [sourceFilter, setSourceFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<'newest' | 'score' | 'name'>('newest');
  const [activeLead, setActiveLead] = useState<StoredLead | null>(null);

  // Available sources from current leads list
  const availableSources = useMemo(() => {
    const set = new Set<string>();
    leads.forEach((l) => {
      if (l.lead_source) set.add(l.lead_source);
    });
    return Array.from(set);
  }, [leads]);

  // Filter and sort leads
  const filteredAndSortedLeads = useMemo(() => {
    let result = leads.filter((lead) => {
      const term = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !term ||
        (lead.customer_name || '').toLowerCase().includes(term) ||
        (lead.email || '').toLowerCase().includes(term) ||
        (lead.phone || '').toLowerCase().includes(term) ||
        (lead.product_service || '').toLowerCase().includes(term) ||
        (lead.lead_source || '').toLowerCase().includes(term) ||
        (lead.message || '').toLowerCase().includes(term);

      const matchesClass =
        classificationFilter === 'All' || lead.classification === classificationFilter;

      const matchesPriority =
        priorityFilter === 'All' || lead.priority === priorityFilter;

      const matchesSource =
        sourceFilter === 'All' || lead.lead_source === sourceFilter;

      return matchesSearch && matchesClass && matchesPriority && matchesSource;
    });

    result.sort((a, b) => {
      if (sortBy === 'score') {
        return (b.lead_score || 0) - (a.lead_score || 0);
      }
      if (sortBy === 'name') {
        return (a.customer_name || '').localeCompare(b.customer_name || '');
      }
      // default: newest
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });

    return result;
  }, [leads, searchTerm, classificationFilter, priorityFilter, sourceFilter, sortBy]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  // Export filtered leads to JSON
  const handleExportJson = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(filteredAndSortedLeads, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `leadpilot-leads-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div id="leads-view-container" className="space-y-4">
      {/* Demo Mode Notice */}
      {isDemoMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-amber-500" />
            <span><strong>Showcase Portfolio Mode:</strong> Displaying representative B2B leads. Tenant Firestore data is untouched.</span>
          </div>
          {onToggleDemoMode && (
            <button
              type="button"
              onClick={() => onToggleDemoMode(false)}
              className="px-2.5 py-1 bg-white hover:bg-amber-100 text-amber-900 font-semibold rounded-md border border-amber-300 transition-colors cursor-pointer shrink-0"
            >
              Switch to Live Leads
            </button>
          )}
        </div>
      )}

      {/* Top Controls: Search, Filters & Actions */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              id="input-leads-search"
              placeholder="Search by customer, email, phone, product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
            />
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2 self-start lg:self-auto">
            {onToggleDemoMode && (
              <button
                type="button"
                id="btn-toggle-demo-leads"
                onClick={() => onToggleDemoMode(!isDemoMode)}
                className={`px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors cursor-pointer flex items-center gap-1.5 ${
                  isDemoMode
                    ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                    : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>{isDemoMode ? 'Showcase (On)' : 'Demo Leads'}</span>
              </button>
            )}

            <button
              type="button"
              id="btn-export-leads-json"
              onClick={handleExportJson}
              disabled={filteredAndSortedLeads.length === 0}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>

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

        {/* Filter Badges Strip */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap items-center gap-2">
            {/* Classification Filters */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
              {(['All', 'Hot', 'Warm', 'Cold'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  id={`filter-cat-${cat.toLowerCase()}`}
                  onClick={() => setClassificationFilter(cat)}
                  className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                    classificationFilter === cat
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Priority Filter */}
            <select
              id="select-filter-priority"
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value as any)}
              className="text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="All">All Priorities</option>
              <option value="Urgent">Urgent Priority</option>
              <option value="High">High Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="Low">Low Priority</option>
            </select>

            {/* Source Filter */}
            {availableSources.length > 0 && (
              <select
                id="select-filter-source"
                value={sourceFilter}
                onChange={(e) => setSourceFilter(e.target.value)}
                className="text-xs bg-slate-50 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                <option value="All">All Sources</option>
                {availableSources.map((src) => (
                  <option key={src} value={src}>{src}</option>
                ))}
              </select>
            )}
          </div>

          {/* Sort Control */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            <span className="text-[11px]">Sort:</span>
            <select
              id="select-sort-leads"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="text-xs bg-white text-slate-700 border border-slate-200 rounded-md px-2 py-1 focus:outline-none cursor-pointer"
            >
              <option value="newest">Newest First</option>
              <option value="score">Highest AI Score</option>
              <option value="name">Customer Name</option>
            </select>
          </div>
        </div>
      </div>

      {/* CRM Leads Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-100 bg-slate-50/60 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-800">Lead Pipeline Repository</span>
            <span className="text-[11px] bg-slate-200 text-slate-700 font-semibold px-2 py-0.5 rounded-full">
              {filteredAndSortedLeads.length} {filteredAndSortedLeads.length === 1 ? 'Record' : 'Records'}
            </span>
          </div>
          <span className="text-[11px] text-slate-400 hidden sm:inline">
            Click any row or "View Details" to inspect full AI analysis & copy response
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Customer</th>
                <th className="py-3 px-4">Source</th>
                <th className="py-3 px-4">Product / Service</th>
                <th className="py-3 px-4 text-center">AI Score</th>
                <th className="py-3 px-4 text-center">Classification</th>
                <th className="py-3 px-4 text-center">Purchase Intent</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4">Created Date</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLoading ? (
                // Loading Skeleton Rows
                [1, 2, 3, 4].map((n) => (
                  <tr key={n} className="animate-pulse">
                    <td className="py-4 px-4">
                      <div className="h-3.5 bg-slate-200 rounded w-28 mb-1.5" />
                      <div className="h-2.5 bg-slate-100 rounded w-36" />
                    </td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-20" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-24" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-5 bg-slate-200 rounded w-10 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-5 bg-slate-200 rounded w-14 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto" /></td>
                    <td className="py-4 px-4 text-center"><div className="h-4 bg-slate-200 rounded w-12 mx-auto" /></td>
                    <td className="py-4 px-4"><div className="h-3 bg-slate-200 rounded w-16" /></td>
                    <td className="py-4 px-4 text-right"><div className="h-6 bg-slate-200 rounded w-16 ml-auto" /></td>
                  </tr>
                ))
              ) : filteredAndSortedLeads.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-14 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Building2 className="w-8 h-8 text-slate-300" />
                      <p className="text-xs font-medium text-slate-600">No leads found</p>
                      <p className="text-[11px] text-slate-400 max-w-sm">
                        {leads.length === 0
                          ? "You haven't saved any leads in this workspace yet. Qualify a new inbound lead or toggle showcase demo leads for portfolio presentation."
                          : "No leads match the active search and filter criteria."}
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        {onToggleDemoMode && leads.length === 0 && (
                          <button
                            type="button"
                            onClick={() => onToggleDemoMode(true)}
                            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                          >
                            Load Demo Leads
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => onNavigate('analysis')}
                          className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors cursor-pointer"
                        >
                          Qualify New Lead
                        </button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredAndSortedLeads.map((lead) => {
                  const isHot = lead.classification === 'Hot';
                  const isWarm = lead.classification === 'Warm';

                  return (
                    <tr
                      key={lead.id}
                      id={`lead-table-row-${lead.id}`}
                      onClick={() => setActiveLead(lead)}
                      className="hover:bg-blue-50/40 cursor-pointer transition-colors group select-none"
                    >
                      {/* Customer */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                            isHot
                              ? 'bg-emerald-600 text-white'
                              : isWarm
                              ? 'bg-amber-500 text-white'
                              : 'bg-slate-700 text-white'
                          }`}>
                            {(lead.customer_name || 'LP').slice(0, 2).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                              {lead.customer_name}
                            </div>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-0.5">
                              <span className="truncate max-w-[130px]">{lead.email}</span>
                              {lead.phone && (
                                <>
                                  <span className="text-slate-300">&bull;</span>
                                  <span className="text-slate-400 font-mono text-[10px]">{lead.phone}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Source */}
                      <td className="py-3.5 px-4">
                        <span className="inline-block text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200/70">
                          {lead.lead_source || 'Inbound'}
                        </span>
                      </td>

                      {/* Product / Service */}
                      <td className="py-3.5 px-4">
                        <div className="font-medium text-slate-800 max-w-[160px] truncate">
                          {lead.product_service || 'General Inbound'}
                        </div>
                        {lead.budget && (
                          <div className="text-[10px] text-slate-500 font-mono mt-0.5">
                            Budget: <span className="font-semibold text-slate-700">{lead.budget}</span>
                          </div>
                        )}
                      </td>

                      {/* AI Score */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block font-mono font-bold text-xs px-2.5 py-0.5 rounded ${
                            lead.lead_score >= 80
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : lead.lead_score >= 50
                              ? 'bg-amber-50 text-amber-700 border border-amber-200'
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
                            isHot
                              ? 'bg-emerald-100 text-emerald-800'
                              : isWarm
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {lead.classification}
                        </span>
                      </td>

                      {/* Purchase Intent */}
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                          lead.purchase_intent === 'High'
                            ? 'bg-blue-50 text-blue-700 border border-blue-200'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {lead.purchase_intent || 'Medium'}
                        </span>
                      </td>

                      {/* Priority */}
                      <td className="py-3.5 px-4 text-center">
                        <span
                          className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded ${
                            lead.priority === 'Urgent'
                              ? 'bg-rose-50 text-rose-700 border border-rose-200'
                              : lead.priority === 'High'
                              ? 'bg-orange-50 text-orange-700 border border-orange-200'
                              : 'bg-slate-100 text-slate-600 border border-slate-200/70'
                          }`}
                        >
                          {lead.priority}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="py-3.5 px-4 text-slate-500 whitespace-nowrap text-[11px] font-mono">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{formatDate(lead.created_at)}</span>
                        </div>
                      </td>

                      {/* Action: View Details */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          id={`btn-view-details-${lead.id}`}
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveLead(lead);
                          }}
                          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-blue-600 hover:text-white rounded-lg transition-all cursor-pointer"
                        >
                          <Eye className="w-3 h-3" />
                          <span>Details</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Slide-Over Drawer for Lead Detail Experience */}
      {activeLead && (
        <LeadDetailDrawer
          lead={activeLead}
          onClose={() => setActiveLead(null)}
          onNavigate={onNavigate}
          onSelectLeadForWorkspace={onSelectLeadForWorkspace}
          onDeleteLead={onDeleteLead}
        />
      )}
    </div>
  );
};
