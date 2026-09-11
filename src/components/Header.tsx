import React from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  HelpCircle, 
  Layers,
  LogOut,
  User,
  ShieldCheck
} from 'lucide-react';
import { NavTab } from '../types';
import { SAMPLE_PRESETS } from '../data/sampleLeads';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

interface HeaderProps {
  activeTab: NavTab;
  onSelectPreset: (index: number) => void;
  onClearForm: () => void;
  onOpenHelp: () => void;
  isDemoMode?: boolean;
  onToggleDemoMode?: (enabled: boolean) => void;
  userEmail?: string | null;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectPreset,
  onClearForm,
  onOpenHelp,
  isDemoMode = false,
  onToggleDemoMode,
  userEmail,
}) => {
  const titles: Record<NavTab, { title: string; subtitle: string }> = {
    analysis: {
      title: 'AI Lead Qualification Engine',
      subtitle: 'Score prospect intent, predict deal velocity, and generate tailored sales follow-ups.',
    },
    leads: {
      title: 'Lead Pipeline Repository',
      subtitle: 'Review categorized inbound records and historical qualification status.',
    },
    dashboard: {
      title: 'Qualification Intelligence Dashboard',
      subtitle: 'Real-time overview of lead health, conversion readiness, and pipeline distribution.',
    },
    integrations: {
      title: 'Zoho CRM & Webhook Integrations',
      subtitle: 'Configure automated inbound lead ingestion, HMAC SHA-256 secrets, and live payload tests.',
    },
    settings: {
      title: 'CRM Engine Settings',
      subtitle: 'Manage scoring thresholds, qualification rules, and rep notifications.',
    },
  };

  const current = titles[activeTab] || titles.dashboard;

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header 
      id="crm-header" 
      className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-20"
    >
      <div className="flex items-center gap-3">
        <h1 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">{current.title}</h1>
        <span className="hidden md:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200">
          <Sparkles className="w-3 h-3 text-blue-600" /> Gemini AI
        </span>
      </div>

      <div className="flex items-center gap-2.5">
        {/* Demo Mode Toggle Button in Header */}
        {onToggleDemoMode && (
          <button
            type="button"
            id="btn-header-toggle-demo"
            onClick={() => onToggleDemoMode(!isDemoMode)}
            title="Toggle showcase demo data vs live Firestore workspace data"
            className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
              isDemoMode
                ? 'bg-amber-100 text-amber-900 border-amber-300 hover:bg-amber-200'
                : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isDemoMode ? 'Demo Mode Active' : 'Demo Showcase'}</span>
          </button>
        )}

        {activeTab === 'analysis' && (
          <>
            {/* Quick Fill Preset Dropdown */}
            <div className="flex items-center gap-1">
              <select
                id="preset-selector-dropdown"
                defaultValue=""
                onChange={(e) => {
                  const idx = parseInt(e.target.value, 10);
                  if (!isNaN(idx)) {
                    onSelectPreset(idx);
                    e.target.value = '';
                  }
                }}
                className="text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
              >
                <option value="" disabled>Load Demo Preset...</option>
                {SAMPLE_PRESETS.map((preset, idx) => (
                  <option key={idx} value={idx}>
                    {preset.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Clear Form */}
            <button
              type="button"
              id="btn-clear-lead-form"
              onClick={onClearForm}
              title="Reset intake form"
              className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset</span>
            </button>
          </>
        )}

        {/* Phase Info Modal Button */}
        <button
          type="button"
          id="btn-open-phase-info"
          onClick={onOpenHelp}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors border border-slate-200 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
          <span>Architecture</span>
        </button>

        {/* User Status / Logout */}
        <div className="flex items-center pl-2 border-l border-slate-200">
          <button
            type="button"
            id="btn-crm-logout"
            onClick={handleLogout}
            title={`Logged in as ${userEmail || 'User'} - Click to Log Out`}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-semibold text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>
    </header>
  );
};
