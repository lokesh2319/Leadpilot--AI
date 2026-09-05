import React from 'react';
import { 
  Sparkles, 
  RotateCcw, 
  FileSpreadsheet, 
  HelpCircle, 
  Layers
} from 'lucide-react';
import { NavTab } from '../types';
import { SAMPLE_PRESETS } from '../data/sampleLeads';

interface HeaderProps {
  activeTab: NavTab;
  onSelectPreset: (index: number) => void;
  onClearForm: () => void;
  onOpenHelp: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectPreset,
  onClearForm,
  onOpenHelp,
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
    settings: {
      title: 'CRM Engine Settings',
      subtitle: 'Manage scoring thresholds, qualification rules, and rep notifications.',
    },
  };

  const current = titles[activeTab];

  return (
    <header 
      id="crm-header" 
      className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 lg:px-8 shrink-0 sticky top-0 z-10"
    >
      <div className="flex items-center gap-3">
        <h1 className="text-lg font-semibold text-slate-800 tracking-tight">{current.title}</h1>
        <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-700 border border-blue-200/80">
          <Sparkles className="w-3 h-3 text-blue-600" /> Gemini AI Connected
        </span>
      </div>

      <div className="flex items-center gap-3">
        {activeTab === 'analysis' && (
          <>
            {/* Quick Fill Preset Dropdown */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs font-medium text-slate-500 hidden md:inline-flex items-center gap-1">
                <Layers className="w-3.5 h-3.5" /> Sample:
              </span>
              <div className="relative inline-block text-left">
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
                  className="text-xs font-medium bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-md px-2.5 py-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                >
                  <option value="" disabled>Load Test Preset...</option>
                  {SAMPLE_PRESETS.map((preset, idx) => (
                    <option key={idx} value={idx}>
                      {preset.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Clear Form */}
            <button
              type="button"
              id="btn-clear-lead-form"
              onClick={onClearForm}
              title="Clear current input fields"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md border border-slate-200 transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
              <span>Reset</span>
            </button>
          </>
        )}

        <span className="hidden xl:inline-flex text-xs font-medium text-slate-500 bg-slate-100 px-2.5 py-1 rounded border border-slate-200/60">
          Quota: 84% Met
        </span>

        {/* Phase 1 Specs Help modal trigger */}
        <button
          type="button"
          id="btn-open-phase-info"
          onClick={onOpenHelp}
          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors border border-slate-200/80 cursor-pointer"
        >
          <HelpCircle className="w-3.5 h-3.5 text-slate-500" />
          <span className="hidden sm:inline">About Phase 1</span>
        </button>
      </div>
    </header>
  );
};
