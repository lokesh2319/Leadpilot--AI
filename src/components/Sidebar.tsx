import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Sparkles, 
  Webhook,
  Settings, 
  ChevronRight,
  ShieldCheck
} from 'lucide-react';
import { NavTab } from '../types';

interface SidebarProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  leadsCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, leadsCount }) => {
  const navItems: { id: NavTab; label: string; icon: React.ComponentType<{ className?: string }>; badge?: number }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'leads', label: 'Leads', icon: Users, badge: leadsCount },
    { id: 'analysis', label: 'AI Analysis', icon: Sparkles },
    { id: 'integrations', label: 'Integrations', icon: Webhook },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <aside 
      id="crm-sidebar" 
      className="w-64 bg-slate-900 text-slate-300 flex flex-col shrink-0 border-r border-slate-800 select-none min-h-screen"
    >
      {/* Brand Header from Design HTML */}
      <div className="p-6 flex items-center gap-3 border-b border-slate-800/80">
        <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center font-bold text-white text-sm shadow-md shadow-blue-500/30">
          LP
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-white font-semibold text-lg tracking-tight">LeadPilot AI</span>
        </div>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-4 mt-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-btn-${item.id}`}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all text-left cursor-pointer ${
                isActive
                  ? 'bg-blue-600 text-white font-medium shadow-xs'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                <span>{item.label}</span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge !== undefined && item.badge > 0 && (
                  <span className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-400'
                  }`}>
                    {item.badge}
                  </span>
                )}
                {isActive && <ChevronRight className="w-3.5 h-3.5 text-blue-200" />}
              </div>
            </button>
          );
        })}
      </nav>

      {/* Sales Rep Profile from Design HTML */}
      <div className="p-6 border-t border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-semibold text-slate-200">
            AS
          </div>
          <div className="text-xs text-slate-400 overflow-hidden">
            <p className="text-slate-200 font-medium truncate">Alex Sales</p>
            <p className="truncate">Account Manager</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t border-slate-800/60 flex items-center justify-between text-[11px] text-slate-500">
          <span className="inline-flex items-center gap-1 text-slate-400">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> Phase 1 Active
          </span>
          <span className="font-mono text-[10px] text-slate-500">v1.0.0</span>
        </div>
      </div>
    </aside>
  );
};
