import React, { useState } from 'react';
import { 
  Sparkles, 
  Flame, 
  Sun, 
  Snowflake, 
  TrendingUp, 
  AlertCircle, 
  FileText, 
  ArrowRightCircle, 
  Mail, 
  Copy, 
  Check, 
  BookmarkPlus,
  ShieldCheck,
  Zap,
  Target
} from 'lucide-react';
import { LeadAnalysisResult, LeadFormData } from '../types';

interface AnalysisResultsProps {
  result: LeadAnalysisResult | null;
  formData: LeadFormData;
  onSaveToPipeline?: () => void;
  isSaved?: boolean;
  isAnalyzing?: boolean;
  error?: string | null;
  onRetry?: () => void;
}

export const AnalysisResults: React.FC<AnalysisResultsProps> = ({
  result,
  formData,
  onSaveToPipeline,
  isSaved = false,
  isAnalyzing = false,
  error = null,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyResponse = () => {
    if (!result?.suggestedResponse) return;
    navigator.clipboard.writeText(result.suggestedResponse);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Loading State - Sleek Dark Animated Skeleton matching exact layout
  if (isAnalyzing) {
    return (
      <div 
        id="analysis-loading-state"
        className="bg-slate-900 rounded-xl border border-blue-900/60 text-slate-100 shadow-xl overflow-hidden flex flex-col justify-between min-h-[500px] animate-pulse"
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
            <h2 className="font-semibold text-white text-sm">AI Insights Report</h2>
          </div>
          <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase bg-blue-950 border border-blue-800 px-2 py-0.5 rounded flex items-center gap-1.5">
            <div className="w-2 h-2 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            GEMINI AI ANALYZING
          </span>
        </div>

        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-blue-700/60 text-blue-400 flex items-center justify-center mb-4 shadow-inner">
            <Sparkles className="w-7 h-7 animate-spin text-blue-400" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Consulting Gemini 3.8 Flash
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
            Evaluating prospect message, budget alignment, decision-maker authority, and generating customized sales action playbook...
          </p>

          <div className="mt-8 w-full max-w-md grid grid-cols-3 gap-3">
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/50 text-center animate-pulse">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Score</span>
              <div className="h-6 w-12 bg-slate-700 rounded mx-auto" />
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/50 text-center animate-pulse">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Class</span>
              <div className="h-6 w-16 bg-slate-700 rounded mx-auto" />
            </div>
            <div className="bg-slate-800/60 p-4 rounded-lg border border-slate-700/50 text-center animate-pulse">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Priority</span>
              <div className="h-6 w-14 bg-slate-700 rounded mx-auto" />
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-blue-400/80 text-center">
          Secure Server-Side Gemini API Proxy • Processing Real-Time Sales Intelligence
        </div>
      </div>
    );
  }

  // Error State
  if (error && !result) {
    return (
      <div 
        id="analysis-error-state"
        className="bg-slate-900 rounded-xl border border-rose-900/50 text-slate-100 shadow-xl overflow-hidden flex flex-col justify-between min-h-[500px]"
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <h2 className="font-semibold text-white text-sm">AI Insights Report</h2>
          </div>
          <span className="text-[10px] text-rose-400 font-mono tracking-widest uppercase bg-rose-950/60 border border-rose-800/60 px-2 py-0.5 rounded">
            ERROR
          </span>
        </div>

        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-rose-950/40 border border-rose-800/50 text-rose-400 flex items-center justify-center mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Gemini Analysis Failed
          </h3>
          <p className="text-xs text-rose-300/90 max-w-sm mt-1.5 leading-relaxed bg-rose-950/30 p-3 rounded border border-rose-900/40">
            {error}
          </p>

          {onRetry && (
            <button
              type="button"
              onClick={onRetry}
              className="mt-6 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg transition-colors cursor-pointer"
            >
              Retry Lead Analysis
            </button>
          )}
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500 text-center">
          Verify GEMINI_API_KEY in Settings &gt; Secrets and ensure server connectivity.
        </div>
      </div>
    );
  }

  // If no analysis is performed yet - Professional Polish Dark Card Placeholder
  if (!result) {
    return (
      <div 
        id="analysis-empty-placeholder"
        className="bg-slate-900 rounded-xl border border-slate-800 text-slate-100 shadow-xl overflow-hidden flex flex-col justify-between min-h-[500px]"
      >
        <div className="p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <h2 className="font-semibold text-white text-sm">AI Insights Report</h2>
          </div>
          <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
            STANDBY
          </span>
        </div>

        <div className="p-8 flex-1 flex flex-col items-center justify-center text-center">
          <div className="w-14 h-14 rounded-2xl bg-slate-800/80 border border-slate-700/60 text-blue-400 flex items-center justify-center mb-4 shadow-inner">
            <Sparkles className="w-7 h-7" />
          </div>
          <h3 className="text-base font-semibold text-white tracking-tight">
            Qualification Intelligence Ready
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mt-1.5 leading-relaxed">
            Fill in the customer details on the left and click <span className="font-semibold text-blue-300">"Analyze Lead"</span> to generate scores, classification tiers, next actions, and customer email response drafts using Gemini AI.
          </p>

          <div className="mt-8 w-full max-w-md grid grid-cols-3 gap-3">
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 text-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Score</span>
              <span className="text-xl font-bold text-slate-400 font-mono">--</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 text-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Classification</span>
              <span className="text-xs font-bold text-slate-400 uppercase mt-1">Pending</span>
            </div>
            <div className="bg-slate-800/40 p-3 rounded-lg border border-slate-700/50 text-center">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Priority</span>
              <span className="text-xs font-bold text-slate-400 uppercase mt-1">Standby</span>
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800/80 bg-slate-950/40 text-[11px] text-slate-500 text-center">
          Powered by Gemini 3.8 Flash • Structured CRM Intelligence Engine
        </div>
      </div>
    );
  }

  // Classification colors in Professional Polish palette
  const classColor = {
    Hot: 'text-red-400',
    Warm: 'text-amber-400',
    Cold: 'text-slate-300',
  }[result.classification] || 'text-slate-300';

  // Priority color
  const priorityColor = {
    Urgent: 'text-rose-400',
    High: 'text-orange-400',
    Medium: 'text-amber-300',
    Low: 'text-slate-300',
  }[result.priority] || 'text-slate-300';

  // Purchase intent percentage estimate for progress bar
  const intentProgress = 
    result.purchaseIntent === 'High' ? 88 :
    result.purchaseIntent === 'Medium' ? 60 :
    result.purchaseIntent === 'Low' ? 30 :
    (result.classification === 'Hot' ? 88 : result.classification === 'Warm' ? 62 : 30);

  return (
    <div 
      id="analysis-results-panel" 
      className="bg-slate-900 rounded-xl flex flex-col shadow-xl overflow-hidden text-slate-100 border border-slate-800 transition-all duration-300"
    >
      {/* Top Header from Design HTML */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-pulse" />
          <h2 className="font-semibold text-white text-base tracking-tight">AI Insights Report</h2>
          <span className="text-xs text-slate-400 ml-1">
            • {formData.customerName || 'Customer Prospect'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onSaveToPipeline && (
            <button
              type="button"
              id="btn-save-to-pipeline"
              onClick={onSaveToPipeline}
              disabled={isSaved}
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded transition-colors cursor-pointer ${
                isSaved
                  ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                  : 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700'
              }`}
            >
              {isSaved ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Saved</span>
                </>
              ) : (
                <>
                  <BookmarkPlus className="w-3.5 h-3.5 text-slate-400" />
                  <span>Save to Leads</span>
                </>
              )}
            </button>
          )}

          <span className="text-[10px] text-blue-400 font-mono tracking-widest uppercase bg-blue-950/60 border border-blue-800/60 px-2.5 py-1 rounded-full">
            QUALIFIED
          </span>
        </div>
      </div>

      {/* Main Report Body */}
      <div className="p-6 space-y-6">
        {/* Top 3 Stat Cards from Design HTML */}
        <div className="grid grid-cols-3 gap-4">
          {/* Card 1: Lead Score */}
          <div id="metric-lead-score" className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Lead Score
            </p>
            <p className="text-4xl font-bold text-blue-400 font-mono tracking-tight">
              {result.leadScore}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">out of 100</span>
          </div>

          {/* Card 2: Classification */}
          <div id="metric-classification" className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Classification
            </p>
            <p className={`text-xl font-bold mt-2 uppercase tracking-wide ${classColor}`}>
              {result.classification}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">
              Tier {result.classification === 'Hot' ? '1' : result.classification === 'Warm' ? '2' : '3'}
            </span>
          </div>

          {/* Card 3: Priority */}
          <div id="metric-priority" className="bg-slate-800/50 p-4 rounded-lg border border-slate-700/50 text-center">
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">
              Priority
            </p>
            <p className={`text-xl font-bold mt-2 uppercase tracking-wide ${priorityColor}`}>
              {result.priority}
            </p>
            <span className="text-[10px] text-slate-500 mt-1 block">Attention SLA</span>
          </div>
        </div>

        {/* 2-Column Split: Intent/Summary & Next Actions from Design HTML */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Column: Purchase Intent & Summary */}
          <div className="space-y-4">
            {/* Purchase Intent */}
            <div id="metric-purchase-intent">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                  Purchase Intent
                </span>
                <span className="text-xs font-semibold text-slate-200">
                  {result.purchaseIntent}
                </span>
              </div>
              <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                  style={{ width: `${intentProgress}%` }}
                />
              </div>
              <p className="text-[11px] mt-1 text-slate-400">
                Estimated closing timeframe based on requirements and budget readiness.
              </p>
            </div>

            {/* Short Summary */}
            <div id="section-lead-summary">
              <span className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">
                Short Lead Summary
              </span>
              <p className="text-sm text-slate-300 leading-relaxed italic bg-slate-800/40 p-3.5 rounded-lg border border-slate-700/40">
                "{result.shortSummary}"
              </p>
              <div className="mt-2 flex flex-wrap gap-3 text-[11px] text-slate-400">
                <span>Product: <strong className="text-slate-200">{formData.productInterest}</strong></span>
                <span>Source: <strong className="text-slate-200">{formData.leadSource}</strong></span>
              </div>
            </div>
          </div>

          {/* Right Column: Recommended Next Action from Design HTML */}
          <div id="section-recommended-action" className="bg-blue-500/10 border border-blue-500/30 p-4 rounded-lg flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">
                  Recommended Next Action
                </span>
                <span className="text-[10px] font-semibold text-blue-300 uppercase px-1.5 py-0.5 rounded bg-blue-900/50">
                  Playbook
                </span>
              </div>
              <p className="text-sm text-white leading-relaxed font-medium">
                {result.recommendedNextAction}
              </p>
            </div>
            
            <div className="mt-4 pt-3 border-t border-blue-500/20 flex items-center justify-between text-[11px] text-blue-300/80">
              <span>SLA Target: {result.priority === 'Urgent' ? '< 2 Hours' : result.priority === 'High' ? '< 24 Hours' : 'Standard 48 Hours'}</span>
              <span>Direct Outreach</span>
            </div>
          </div>
        </div>

        {/* AI Score Reasoning from Gemini */}
        {result.reasoning && result.reasoning.length > 0 && (
          <div id="section-lead-reasoning" className="space-y-2 pt-2 border-t border-slate-800/80">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
                Score Reasoning & Signals
              </span>
              <span className="text-[10px] text-blue-400 font-mono bg-blue-950/60 border border-blue-800/60 px-2 py-0.5 rounded">
                Gemini Intelligence
              </span>
            </div>
            <div className="bg-slate-800/60 border border-slate-700/60 p-3.5 rounded-lg space-y-2">
              {result.reasoning.map((reason, idx) => (
                <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
                  <span className="leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Suggested AI Response from Design HTML */}
        <div id="section-suggested-response" className="space-y-2 pt-2 border-t border-slate-800/80">
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">
              Suggested AI Response
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                id="btn-copy-suggested-response"
                onClick={handleCopyResponse}
                className="text-xs px-3 py-1.5 bg-slate-700 text-white rounded hover:bg-slate-600 transition-colors cursor-pointer flex items-center gap-1.5"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-300">Copied</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-slate-300" />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
          </div>
          
          <div className="bg-slate-800 border border-slate-700 p-4 rounded-lg text-sm text-slate-300 leading-relaxed font-sans whitespace-pre-wrap">
            {result.suggestedResponse}
          </div>
          <p className="text-[11px] text-slate-500">
            Tailored email draft incorporating the customer's budget, product interest, and specific inquiry.
          </p>
        </div>
      </div>
    </div>
  );
};
