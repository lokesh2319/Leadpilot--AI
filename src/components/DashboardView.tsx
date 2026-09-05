import React from 'react';
import { 
  Users, 
  Flame, 
  Target, 
  DollarSign, 
  Sparkles, 
  ArrowUpRight, 
  CheckCircle2,
  Clock
} from 'lucide-react';
import { StoredLead, NavTab } from '../types';

interface DashboardViewProps {
  leads: StoredLead[];
  onNavigate: (tab: NavTab) => void;
  onSelectLead: (lead: StoredLead) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  leads,
  onNavigate,
  onSelectLead,
}) => {
  // Compute analytics
  const totalLeads = leads.length;
  const hotLeads = leads.filter((l) => l.classification === 'Hot').length;
  const warmLeads = leads.filter((l) => l.classification === 'Warm').length;
  const coldLeads = leads.filter((l) => l.classification === 'Cold').length;
  
  const avgScore = totalLeads > 0
    ? Math.round(leads.reduce((acc, l) => acc + (l.lead_score || 0), 0) / totalLeads)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top Banner CTA */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl p-6 text-white shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/15 text-blue-100 mb-2">
            <Sparkles className="w-3.5 h-3.5" /> Phase 5 Persistent Lead Pipeline
          </div>
          <h2 className="text-xl font-bold tracking-tight">LeadPilot AI Intelligence Center</h2>
          <p className="text-xs text-blue-100 max-w-xl mt-1 leading-relaxed">
            Accelerate sales cycle velocity with automated intent qualification, persistent lead tracking, and customized outbound messaging.
          </p>
        </div>
        <button
          type="button"
          id="dashboard-qualify-lead-cta"
          onClick={() => onNavigate('analysis')}
          className="px-4 py-2 bg-white text-blue-700 hover:bg-blue-50 text-xs font-bold rounded-lg shadow-sm transition-all cursor-pointer shrink-0 flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-blue-600" />
          <span>Qualify Inbound Lead</span>
        </button>
      </div>

      {/* KPI Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Leads */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Persistent Leads</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{totalLeads}</span>
            <span className="text-xs text-emerald-600 font-medium flex items-center">
              <ArrowUpRight className="w-3 h-3" /> Live DB
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Stored in database</p>
        </div>

        {/* Hot Leads */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Hot Tier 1 Leads</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{hotLeads}</span>
            <span className="text-xs text-emerald-600 font-medium">
              {totalLeads > 0 ? `${Math.round((hotLeads / totalLeads) * 100)}%` : '0%'} ratio
            </span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Ready for immediate AE booking</p>
        </div>

        {/* Avg Qualification Score */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Average Lead Score</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Target className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">{avgScore}</span>
            <span className="text-xs text-slate-400 font-medium">/ 100</span>
          </div>
          <p className="mt-1 text-[11px] text-slate-400">Weighted intent & budget criteria</p>
        </div>

        {/* Pipeline Distribution */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Pipeline Balance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold">
            <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">{hotLeads} Hot</span>
            <span className="text-amber-700 bg-amber-50 px-2 py-0.5 rounded">{warmLeads} Warm</span>
            <span className="text-slate-600 bg-slate-100 px-2 py-0.5 rounded">{coldLeads} Cold</span>
          </div>
          <p className="mt-1.5 text-[11px] text-slate-400">Categorization distribution</p>
        </div>
      </div>

      {/* Recent Qualified Leads List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-800">Recent Lead Qualification Log</h3>
            <p className="text-xs text-slate-500 mt-0.5">Prospect records assessed and stored in database</p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('leads')}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <span>View All Leads</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="divide-y divide-slate-100">
          {leads.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              No leads saved yet. Click 'Qualify Inbound Lead' above to analyze your first lead.
            </div>
          ) : (
            leads.slice(0, 5).map((lead) => (
              <div 
                key={lead.id} 
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3"
              >
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-700 font-bold flex items-center justify-center text-xs shrink-0 mt-0.5">
                    {(lead.customer_name || 'L').slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-slate-900">{lead.customer_name}</h4>
                      <span className={`text-[10px] font-bold px-2 py-0.2 rounded-full uppercase tracking-wider ${
                        lead.classification === 'Hot'
                          ? 'bg-emerald-100 text-emerald-800'
                          : lead.classification === 'Warm'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-700'
                      }`}>
                        {lead.classification}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      {lead.product_service} • Budget: <span className="font-semibold text-slate-700">{lead.budget || 'N/A'}</span>
                    </p>
                    <p className="text-[11px] text-slate-400 mt-0.5 truncate max-w-md">
                      "{lead.message}"
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 sm:self-center shrink-0">
                  <div className="text-right">
                    <span className="text-xs font-bold text-slate-900 font-mono">
                      {lead.lead_score}/100
                    </span>
                    <span className="block text-[10px] text-slate-400">
                      {lead.priority} Priority
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onSelectLead(lead)}
                    className="px-2.5 py-1.5 text-xs font-medium bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded-lg transition-colors cursor-pointer"
                  >
                    Inspect Analysis
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
