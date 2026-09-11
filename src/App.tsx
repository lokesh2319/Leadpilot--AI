import React, { useState, useRef, useEffect } from 'react';
import { signOut } from 'firebase/auth';
import { auth } from './firebase';
import { authFetch } from './utils/authFetch';
import { NavTab, LeadFormData, LeadAnalysisResult, LeadRecord, GeminiLeadResponse, StoredLead } from './types';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { LeadForm } from './components/LeadForm';
import { AnalysisResults } from './components/AnalysisResults';
import { DashboardView } from './components/DashboardView';
import { LeadsView } from './components/LeadsView';
import { IntegrationsView } from './components/IntegrationsView';
import { SettingsView } from './components/SettingsView';
import { HelpModal } from './components/HelpModal';
import { LeadDetailDrawer } from './components/LeadDetailDrawer';
import { qualifyLead } from './utils/qualifyLead';
import { SAMPLE_PRESETS, PORTFOLIO_DEMO_LEADS } from './data/sampleLeads';
import { Menu, X } from 'lucide-react';

const EMPTY_FORM: LeadFormData = {
  customerName: '',
  phoneNumber: '',
  email: '',
  leadSource: 'Website Inbound',
  productInterest: 'Enterprise Lead Automation Platform',
  budget: '',
  customerMessage: '',
};

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');
  const [formData, setFormData] = useState<LeadFormData>(SAMPLE_PRESETS[0].data);
  const [analysisResult, setAnalysisResult] = useState<LeadAnalysisResult | null>(() => {
    return qualifyLead(SAMPLE_PRESETS[0].data);
  });
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<Partial<Record<keyof LeadFormData, string>>>({});
  const [isSaved, setIsSaved] = useState(false);
  const [leads, setLeads] = useState<StoredLead[]>([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState<boolean>(true);
  const [isHelpOpen, setIsHelpOpen] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(false);
  const [activeDetailLead, setActiveDetailLead] = useState<StoredLead | null>(null);

  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch persistent leads from backend database
  const fetchLeads = async () => {
    if (!auth.currentUser) return;
    try {
      setIsLoadingLeads(true);
      const res = await authFetch('/api/leads');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setLeads(json.data);
          // If no leads exist yet, default to demo mode so dashboard looks full and impressive for portfolio demo
          if (json.data.length === 0) {
            setIsDemoMode(true);
          }
        }
      }
    } catch (err: any) {
      if (err?.message !== 'User is not authenticated') {
        console.warn('Could not load persistent leads from /api/leads:', err?.message || err);
      }
    } finally {
      setIsLoadingLeads(false);
    }
  };

  useEffect(() => {
    fetchLeads();
  }, []);

  // Form field validation
  const validateForm = (data: LeadFormData): boolean => {
    const errors: Partial<Record<keyof LeadFormData, string>> = {};

    if (!data.customerName.trim()) {
      errors.customerName = 'Customer name is required';
    }

    if (!data.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email.trim())) {
      errors.email = 'Please enter a valid email address';
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleFieldChange = (field: keyof LeadFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
    if (validationErrors[field]) {
      setValidationErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  // Analyze lead with Gemini backend (with rule fallback)
  const handleAnalyzeLead = async (dataToAnalyze: LeadFormData = formData) => {
    if (!validateForm(dataToAnalyze)) {
      return;
    }

    setIsAnalyzing(true);
    setAnalysisError(null);
    setIsSaved(false);

    try {
      const response = await authFetch('/api/leads/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dataToAnalyze),
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error || `Server returned ${response.status}`);
      }

      const result = await response.json();
      if (!result.success || !result.data) {
        throw new Error(result.error || 'Invalid response from qualification server');
      }

      const geminiData: GeminiLeadResponse = result.data;

      setAnalysisResult({
        classification: geminiData.classification,
        leadScore: geminiData.lead_score,
        purchaseIntent: geminiData.purchase_intent,
        priority: geminiData.priority,
        shortSummary: geminiData.summary,
        reasoning: geminiData.reasoning,
        recommendedNextAction: geminiData.recommended_action,
        suggestedResponse: geminiData.suggested_response,
        timestamp: new Date().toISOString(),
      });
    } catch (err: any) {
      console.warn('Gemini qualification unavailable, using deterministic rule engine fallback:', err?.message);
      const fallbackResult = qualifyLead(dataToAnalyze);
      setAnalysisResult(fallbackResult);
      setAnalysisError(
        'Gemini API request failed; deterministic rule engine was used instead.'
      );
    } finally {
      setIsAnalyzing(false);
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  const handleSelectPreset = (index: number) => {
    const preset = SAMPLE_PRESETS[index];
    if (!preset) return;
    setFormData(preset.data);
    setValidationErrors({});
    setIsSaved(false);
    handleAnalyzeLead(preset.data);
  };

  const handleClearForm = () => {
    setFormData(EMPTY_FORM);
    setAnalysisResult(null);
    setValidationErrors({});
    setAnalysisError(null);
    setIsSaved(false);
  };

  // Save qualified lead to backend persistent pipeline
  const handleSaveToPipeline = async () => {
    if (!analysisResult) return;

    try {
      const payload: Omit<StoredLead, 'id' | 'created_at'> = {
        customer_name: formData.customerName,
        phone: formData.phoneNumber,
        email: formData.email,
        lead_source: formData.leadSource,
        product_service: formData.productInterest,
        budget: formData.budget,
        message: formData.customerMessage,
        classification: analysisResult.classification,
        lead_score: analysisResult.leadScore,
        purchase_intent: (analysisResult.purchaseIntent as 'High' | 'Medium' | 'Low') || 'Medium',
        priority: analysisResult.priority,
        summary: analysisResult.shortSummary,
        reasoning: analysisResult.reasoning || [],
        recommended_action: analysisResult.recommendedNextAction,
        suggested_response: analysisResult.suggestedResponse,
      };

      const res = await authFetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        setIsSaved(true);
        // Refresh leads list
        await fetchLeads();
      } else {
        const json = await res.json().catch(() => ({}));
        alert(`Failed to save lead: ${json.error || 'Server error'}`);
      }
    } catch (err: any) {
      console.error('Error saving lead:', err);
      alert('Error saving lead to database');
    }
  };

  // Pre-load a stored lead into the AI Analysis form
  const handleSelectLeadForWorkspace = (storedLead: StoredLead) => {
    setFormData({
      customerName: storedLead.customer_name || '',
      phoneNumber: storedLead.phone || '',
      email: storedLead.email || '',
      leadSource: storedLead.lead_source || 'Website Inbound',
      productInterest: storedLead.product_service || 'Enterprise Lead Automation Platform',
      budget: storedLead.budget || '',
      customerMessage: storedLead.message || '',
    });

    setAnalysisResult({
      classification: storedLead.classification,
      leadScore: storedLead.lead_score,
      purchaseIntent: storedLead.purchase_intent,
      priority: storedLead.priority,
      shortSummary: storedLead.summary,
      reasoning: storedLead.reasoning || [],
      recommendedNextAction: storedLead.recommended_action,
      suggestedResponse: storedLead.suggested_response,
      timestamp: new Date().toISOString(),
    });

    setIsSaved(true);
    setActiveTab('analysis');
  };

  const handleDeleteLead = async (id: string) => {
    try {
      const res = await authFetch(`/api/leads/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setLeads((prev) => prev.filter((l) => l.id !== id));
      }
    } catch (err) {
      console.error('Failed to delete lead:', err);
    }
  };

  // Active leads passed to components: if demo mode is enabled, display demo leads; else display actual Firestore leads
  const activeLeads = isDemoMode ? PORTFOLIO_DEMO_LEADS : leads;

  return (
    <div className="flex h-screen bg-slate-100 font-sans antialiased overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      {isMobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 z-30 md:hidden"
          onClick={() => setIsMobileSidebarOpen(false)}
        />
      )}

      {/* Mobile Top Header */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-slate-900 text-white z-20 flex items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-blue-500 rounded flex items-center justify-center font-bold text-xs">
            LP
          </div>
          <span className="font-semibold text-sm">LeadPilot AI</span>
        </div>
        <button
          type="button"
          onClick={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
          className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
        >
          {isMobileSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Desktop & Mobile Drawer Sidebar */}
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} md:block shrink-0 h-full`}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          leadsCount={activeLeads.length}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden pt-14 md:pt-0">
        <Header
          activeTab={activeTab}
          onSelectPreset={handleSelectPreset}
          onClearForm={handleClearForm}
          onOpenHelp={() => setIsHelpOpen(true)}
          isDemoMode={isDemoMode}
          onToggleDemoMode={setIsDemoMode}
          userEmail={auth.currentUser?.email}
        />

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              leads={activeLeads}
              onNavigate={setActiveTab}
              onSelectLead={handleSelectLeadForWorkspace}
              isDemoMode={isDemoMode}
              onToggleDemoMode={setIsDemoMode}
              onViewLeadDetails={setActiveDetailLead}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView
              leads={activeLeads}
              isLoading={isLoadingLeads}
              onRefresh={fetchLeads}
              onNavigate={setActiveTab}
              onSelectLeadForWorkspace={handleSelectLeadForWorkspace}
              onDeleteLead={handleDeleteLead}
              isDemoMode={isDemoMode}
              onToggleDemoMode={setIsDemoMode}
            />
          )}

          {activeTab === 'analysis' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Intake Form (5 cols on lg) */}
              <div className="lg:col-span-5">
                <LeadForm
                  formData={formData}
                  onChange={handleFieldChange}
                  onSubmit={handleAnalyzeLead}
                  isAnalyzing={isAnalyzing}
                  validationErrors={validationErrors}
                  errorMessage={analysisError}
                />
              </div>

              {/* Right Column: Qualification Results (7 cols on lg) */}
              <div ref={resultsRef} className="lg:col-span-7">
                <AnalysisResults
                  result={analysisResult}
                  formData={formData}
                  onSaveToPipeline={handleSaveToPipeline}
                  isSaved={isSaved}
                  isAnalyzing={isAnalyzing}
                  error={analysisError}
                  onRetry={() => handleAnalyzeLead()}
                />
              </div>
            </div>
          )}

          {activeTab === 'integrations' && (
            <IntegrationsView />
          )}

          {activeTab === 'settings' && (
            <SettingsView leads={leads} />
          )}
        </main>
      </div>

      {/* Slide-over Lead Detail Experience (accessible from anywhere) */}
      {activeDetailLead && (
        <LeadDetailDrawer
          lead={activeDetailLead}
          onClose={() => setActiveDetailLead(null)}
          onNavigate={setActiveTab}
          onSelectLeadForWorkspace={handleSelectLeadForWorkspace}
          onDeleteLead={handleDeleteLead}
        />
      )}

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}
