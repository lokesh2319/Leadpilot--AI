import React, { useState, useMemo } from 'react';
import { 
  Users, 
  Flame, 
  Target, 
  Sparkles, 
  ArrowUpRight, 
  TrendingUp, 
  Layers, 
  BarChart3, 
  PieChart, 
  ShieldCheck, 
  Clock, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  Filter,
  Eye,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { StoredLead, NavTab } from '../types';

interface DashboardViewProps {
  leads: StoredLead[];
  onNavigate: (tab: NavTab) => void;
  onSelectLead: (lead: StoredLead) => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: (enabled: boolean) => void;
  onViewLeadDetails?: (lead: StoredLead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  onNavigate,
  onSelectLead,
  isDemoMode = false,
  onToggleDemoMode,
  onViewLeadDetails,
}) => {
  const [recentFilter, setRecentFilter] = useState<'All' | 'Hot' | 'Warm' | 'Cold'>('All');

  // Compute live analytics from active leads array
  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.classification === 'Hot').length;
  const warmLeads = leads.filter((l) => l.classification === 'Warm').length;
  const coldLeads = leads.filter((l) => l.classification === 'Cold').length;
  
  const hotPct = totalLeads > 0 ? Math.round((hotLeads / totalLeads) * 100) : 0;
  const warmPct = totalLeads > 0 ? Math.round((warmLeads / totalLeads) * 100) : 0;
  const coldPct = totalLeads > 0 ? Math.round((coldLeads / totalLeads) * 100) : 0;

  const avgScore = totalLeads > 0
    ? Math.round(leads.reduce((acc, l) => acc + (l.lead_score || 0), 0) / totalLeads)
    : 0;

  // Compute breakdown by Lead Source
  const leadsBySource = useMemo(() => {
    const counts: Record<string, number> = {};
    leads.forEach((lead) => {
      const src = lead.lead_source || 'Website Inbound';
      counts[src] = (counts[src] || 0) + 1;
    });

    return Object.entries(counts)
      .map(([source, count]) => ({
        source,
        count,
        percentage: totalLeads > 0 ? Math.round((count / totalLeads) * 100) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [leads, totalLeads]);

  // Priority distribution
  const urgentCount = leads.filter((l) => l.priority === 'Urgent').length;
  const highCount = leads.filter((l) => l.priority === 'High').length;
  const mediumCount = leads.filter((l) => l.priority === 'Medium').length;
  const lowCount = leads.filter((l) => l.priority === 'Low').length;

  // Filtered recent leads for table preview
  const recentLeads = useMemo(() => {
    const list = recentFilter === 'All'
      ? leads
      : leads.filter((l) => l.classification === recentFilter);
    return list.slice(0, 6);
  }, [leads, recentFilter]);

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return 'Recent';
    }
  };

  return (
    <div id="crm-dashboard-container" className="space-y-6">
      {/* Portfolio Demo Mode Callout Banner */}
      {isDemoMode && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-amber-900">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <p>
              <strong className="font-semibold">Demo Showcase Active:</strong> Viewing sample enterprise portfolio leads for demonstration. Real workspace Firestore data is preserved and not altered.
            </p>
          </div>
          {onToggleDemoMode && (
            <button
              type="button"
              id="btn-switch-to-live-leads"
              onClick={() => onToggleDemoMode(false)}
              className="px-3 py-1 bg-white hover:bg-amber-100 text-amber-900 font-semibold rounded-lg border border-amber-300 transition-colors shrink-0 cursor-pointer"
            >
              Switch to Live Workspace Leads
            </button>
          )}
        </div>
      )}

      {/* Hero Welcome & Quick Action Bar */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Executive Overview
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              Multi-Tenant Isolated
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Lead Qualification Intelligence Center
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Automated inbound scoring, sales intent classification, and CRM webhook pipelines powered by Gemini AI.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          {onToggleDemoMode && (
            <button
              type="button"
              id="btn-toggle-demo-showcase"
              onClick={() => onToggleDemoMode(!isDemoMode)}
              className={`px-3.5 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer flex items-center gap-1.5 ${
                isDemoMode
                  ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                  : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isDemoMode ? 'Showcase Mode (On)' : 'Demo Showcase'}</span>
            </button>
          )}

          <button
            type="button"
            id="btn-dashboard-qualify-lead"
            onClick={() => onNavigate('analysis')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-all cursor-pointer flex items-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Qualify Inbound Lead</span>
          </button>
        </div>
      </div>

      {/* Top 5 KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* 1. Total Leads */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Leads</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-900">{totalLeads}</span>
            <span className="text-[11px] text-slate-400 font-medium">in pipeline</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">
            {isDemoMode ? 'Portfolio showcase leads' : 'Active workspace database'}
          </p>
        </div>

        {/* 2. Hot Leads */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-emerald-800 uppercase tracking-wider">Hot Leads</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-emerald-700">{hotLeads}</span>
            <span className="text-xs text-emerald-700 font-semibold bg-emerald-50 px-1.5 py-0.5 rounded">
              {hotPct}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">High intent &bull; Ready for AE</p>
        </div>

        {/* 3. Warm Leads */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-wider">Warm Leads</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-amber-700">{warmLeads}</span>
            <span className="text-xs text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
              {warmPct}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Qualified nurture track</p>
        </div>

        {/* 4. Cold Leads */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Cold Leads</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-slate-700">{coldLeads}</span>
            <span className="text-xs text-slate-600 font-semibold bg-slate-100 px-1.5 py-0.5 rounded">
              {coldPct}%
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Low intent &bull; Long-term</p>
        </div>

        {/* 5. Average AI Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-indigo-700 uppercase tracking-wider">Average AI Score</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold font-mono text-indigo-600">{avgScore}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          <div className="mt-2 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="h-full bg-indigo-600 rounded-full transition-all"
              style={{ width: `${Math.min(100, Math.max(0, avgScore))}%` }}
            />
          </div>
        </div>
      </div>

      {/* Analytics & Pipeline Distribution Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Pipeline Health & Classification Breakdown (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Lead Pipeline Distribution</h3>
                <p className="text-xs text-slate-500 mt-0.5">Automated AI qualification categorization</p>
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                100% Calibrated
              </span>
            </div>

            {/* Segmented Progress Bar */}
            <div className="space-y-2 mb-5">
              <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                <div 
                  className="bg-emerald-500 h-full transition-all" 
                  style={{ width: `${hotPct}%` }}
                  title={`Hot Leads: ${hotLeads} (${hotPct}%)`}
                />
                <div 
                  className="bg-amber-400 h-full transition-all" 
                  style={{ width: `${warmPct}%` }}
                  title={`Warm Leads: ${warmLeads} (${warmPct}%)`}
                />
                <div 
                  className="bg-slate-300 h-full transition-all" 
                  style={{ width: `${coldPct}%` }}
                  title={`Cold Leads: ${coldLeads} (${coldPct}%)`}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>Hot ({hotPct}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>Warm ({warmPct}%)</span>
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-slate-300" />
                  <span>Cold ({coldPct}%)</span>
                </span>
              </div>
            </div>

            {/* Stage Metrics Cards */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                <span className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider block">Hot Stage</span>
                <span className="text-lg font-bold font-mono text-emerald-900 mt-1 block">{hotLeads}</span>
                <span className="text-[11px] text-emerald-700 mt-0.5 block">Immediate outreach</span>
              </div>

              <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100">
                <span className="text-[10px] font-bold text-amber-800 uppercase tracking-wider block">Warm Stage</span>
                <span className="text-lg font-bold font-mono text-amber-900 mt-1 block">{warmLeads}</span>
                <span className="text-[11px] text-amber-700 mt-0.5 block">Evaluation cadence</span>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">Cold Stage</span>
                <span className="text-lg font-bold font-mono text-slate-800 mt-1 block">{coldLeads}</span>
                <span className="text-[11px] text-slate-500 mt-0.5 block">Automated drip</span>
              </div>
            </div>
          </div>

          {/* Priority Matrix Footer */}
          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Urgent Priority Queue:</span>
            <div className="flex items-center gap-2">
              <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                {urgentCount} Urgent
              </span>
              <span className="font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
                {highCount} High
              </span>
            </div>
          </div>
        </div>

        {/* Right: Inbound Volume by Lead Source (6 cols) */}
        <div className="lg:col-span-6 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Inbound Leads by Source</h3>
                <p className="text-xs text-slate-500 mt-0.5">Channel acquisition performance</p>
              </div>
              <span className="text-xs font-medium text-slate-400">
                {leadsBySource.length} Active Channels
              </span>
            </div>

            {leadsBySource.length === 0 ? (
              <div className="py-10 text-center text-slate-400 text-xs">
                No channel data available yet.
              </div>
            ) : (
              <div className="space-y-3">
                {leadsBySource.slice(0, 5).map((item) => (
                  <div key={item.source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-slate-700 truncate max-w-[240px]">
                        {item.source}
                      </span>
                      <div className="flex items-center gap-2 text-slate-500">
                        <span className="font-mono font-bold text-slate-800">{item.count}</span>
                        <span className="text-[11px] text-slate-400">({item.percentage}%)</span>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                      <div 
                        className="bg-blue-600 h-full rounded-full transition-all"
                        style={{ width: `${Math.min(100, Math.max(4, item.percentage))}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Total qualified across all sources</span>
            <button
              type="button"
              onClick={() => onNavigate('leads')}
              className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
            >
              <span>Explore full repository</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Recent Leads Pipeline Table Preview */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 bg-slate-50/50">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Recent Lead Qualification Log</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live prospect records assessed and scored by Gemini AI
            </p>
          </div>

          {/* Quick Filter Pills */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-lg">
            {(['All', 'Hot', 'Warm', 'Cold'] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                id={`dashboard-filter-${filter.toLowerCase()}`}
                onClick={() => setRecentFilter(filter)}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                  recentFilter === filter
                    ? 'bg-white text-slate-900 shadow-2xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {recentLeads.length === 0 ? (
            <div className="p-12 text-center text-slate-400">
              <div className="flex flex-col items-center justify-center gap-2">
                <AlertCircle className="w-7 h-7 text-slate-300" />
                <p className="text-xs font-semibold text-slate-600">No leads match this view</p>
                <p className="text-[11px] text-slate-400 max-w-sm">
                  {leads.length === 0 
                    ? "Your workspace does not have any saved leads yet. You can qualify your first lead or toggle portfolio showcase mode."
                    : "No leads found in this classification category."}
                </p>
                {onToggleDemoMode && leads.length === 0 && (
                  <button
                    type="button"
                    onClick={() => onToggleDemoMode(true)}
                    className="mt-2 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg shadow-xs transition-colors cursor-pointer"
                  >
                    Load Demo Portfolio Leads
                  </button>
                )}
              </div>
            </div>
          ) : (
            recentLeads.map((lead) => {
              const isLeadHot = lead.classification === 'Hot';
              const isLeadWarm = lead.classification === 'Warm';

              return (
                <div 
                  key={lead.id}
                  id={`dashboard-lead-row-${lead.id}`}
                  onClick={() => {
                    if (onViewLeadDetails) {
                      onViewLeadDetails(lead);
                    } else {
                      onSelectLead(lead);
                    }
                  }}
                  className="p-4 hover:bg-slate-50/90 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4 cursor-pointer group select-none"
                >
                  <div className="flex items-start gap-3.5">
                    {/* Avatar Initials */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 mt-0.5 ${
                      isLeadHot
                        ? 'bg-emerald-600 text-white'
                        : isLeadWarm
                        ? 'bg-amber-500 text-white'
                        : 'bg-slate-700 text-white'
                    }`}>
                      {(lead.customer_name || 'LP').slice(0, 2).toUpperCase()}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                          {lead.customer_name}
                        </h4>

                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          isLeadHot
                            ? 'bg-emerald-100 text-emerald-800'
                            : isLeadWarm
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {lead.classification}
                        </span>

                        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline">
                          {lead.email}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500 mt-1">
                        <span className="font-medium text-slate-700">{lead.product_service}</span>
                        <span className="text-slate-300">&bull;</span>
                        <span>Source: <strong className="text-slate-600 font-normal">{lead.lead_source}</strong></span>
                        {lead.budget && (
                          <>
                            <span className="text-slate-300">&bull;</span>
                            <span className="font-mono text-slate-600">Budget: {lead.budget}</span>
                          </>
                        )}
                      </div>

                      {lead.summary && (
                        <p className="text-[11px] text-slate-400 mt-1 truncate max-w-xl">
                          {lead.summary}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 md:self-center shrink-0 justify-between md:justify-end border-t md:border-t-0 pt-2 md:pt-0 border-slate-100">
                    <div className="text-left md:text-right">
                      <div className="flex items-center gap-1.5 md:justify-end">
                        <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded ${
                          lead.lead_score >= 80
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/60'
                            : lead.lead_score >= 50
                            ? 'bg-amber-50 text-amber-700 border border-amber-200/60'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        }`}>
                          {lead.lead_score}/100
                        </span>
                      </div>
                      <span className="block text-[10px] text-slate-400 mt-0.5">
                        {lead.priority} Priority &bull; {formatDate(lead.created_at)}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onViewLeadDetails) {
                          onViewLeadDetails(lead);
                        } else {
                          onSelectLead(lead);
                        }
                      }}
                      className="px-3 py-1.5 text-xs font-semibold bg-slate-100 group-hover:bg-blue-600 group-hover:text-white text-slate-700 rounded-lg transition-all cursor-pointer flex items-center gap-1 shrink-0"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
          <span className="text-slate-500">
            Showing up to 6 recent records &bull; {totalLeads} total in system
          </span>
          <button
            type="button"
            onClick={() => onNavigate('leads')}
            className="font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>Open Full Leads Table</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
