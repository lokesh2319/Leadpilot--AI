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
import { SettingsView } from './components/SettingsView';
import { HelpModal } from './components/HelpModal';
import { qualifyLead } from './utils/qualifyLead';
import { SAMPLE_PRESETS } from './data/sampleLeads';
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
  const [activeTab, setActiveTab] = useState<NavTab>('analysis');
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
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        fetchLeads();
      }
    });

    if (auth.currentUser) {
      fetchLeads();
    }

    return () => unsubscribe();
  }, []);

  // Field change handler
  const handleFieldChange = (field: keyof LeadFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setIsSaved(false);
    if (validationErrors[field]) {
      setValidationErrors((prev) => {
        const copy = { ...prev };
        delete copy[field];
        return copy;
      });
    }
  };

  // Submit / "Analyze Lead" click - calls Gemini AI backend and auto-persists to DB
  const handleAnalyzeLead = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    // Client-side field validation
    const errors: Partial<Record<keyof LeadFormData, string>> = {};
    if (!formData.customerName.trim()) {
      errors.customerName = 'Customer name is required.';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!formData.email.includes('@')) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!formData.customerMessage.trim()) {
      errors.customerMessage = 'Please provide customer enquiry or requirement details.';
    }

    if (Object.keys(errors).length > 0) {
      setValidationErrors(errors);
      return;
    }

    setValidationErrors({});
    setIsAnalyzing(true);
    setAnalysisError(null);
    setIsSaved(false);

    // Auto-scroll on mobile devices
    if (window.innerWidth < 1024 && resultsRef.current) {
      resultsRef.current.scrollIntoView({ behavior: 'smooth' });
    }

    try {
      const response = await authFetch('/api/analyze-lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName: formData.customerName,
          phoneNumber: formData.phoneNumber,
          email: formData.email,
          leadSource: formData.leadSource,
          productInterest: formData.productInterest,
          budget: formData.budget,
          customerMessage: formData.customerMessage,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Analysis request failed with status ${response.status}`);
      }

      const ai = (data.data || data) as GeminiLeadResponse;

      const formattedResult: LeadAnalysisResult = {
        leadScore: typeof ai.lead_score === 'number' ? ai.lead_score : 75,
        classification: (['Hot', 'Warm', 'Cold'].includes(ai.classification) ? ai.classification : 'Warm') as 'Hot' | 'Warm' | 'Cold',
        purchaseIntent: ai.purchase_intent || 'Medium',
        priority: (['Urgent', 'High', 'Medium', 'Low'].includes(ai.priority) ? ai.priority : 'Medium') as 'Urgent' | 'High' | 'Medium' | 'Low',
        shortSummary: ai.summary || '',
        recommendedNextAction: ai.recommended_action || '',
        suggestedResponse: ai.suggested_response || '',
        reasoning: Array.isArray(ai.reasoning) ? ai.reasoning : [],
        timestamp: new Date().toISOString(),
      };

      setAnalysisResult(formattedResult);

      // Server automatically saved lead into persistent database
      if (data.lead) {
        setLeads((prev) => [data.lead, ...prev.filter((l) => l.id !== data.lead.id)]);
        setIsSaved(true);
      }
    } catch (err: any) {
      console.error('Error analyzing lead with Gemini AI:', err);
      setAnalysisError(err.message || 'Failed to analyze lead with Gemini AI. Please retry.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Preset selector
  const handleSelectPreset = (index: number) => {
    const preset = SAMPLE_PRESETS[index];
    if (!preset) return;
    setFormData(preset.data);
    setValidationErrors({});
    setAnalysisError(null);
    setIsSaved(false);
    // Instant qualification preview for chosen preset
    const result = qualifyLead(preset.data);
    setAnalysisResult(result);
  };

  // Clear form
  const handleClearForm = () => {
    setFormData(EMPTY_FORM);
    setAnalysisResult(null);
    setValidationErrors({});
    setAnalysisError(null);
    setIsSaved(false);
  };

  // Save qualified lead to pipeline (if user wants to re-save or update)
  const handleSaveToPipeline = async () => {
    if (!analysisResult) return;
    setIsSaved(true);
  };

  // Select lead from dashboard or leads view to view/inspect in AI Analysis
  const handleSelectLeadForWorkspace = (lead: StoredLead) => {
    setFormData({
      customerName: lead.customer_name,
      phoneNumber: lead.phone,
      email: lead.email,
      leadSource: lead.lead_source,
      productInterest: lead.product_service,
      budget: lead.budget,
      customerMessage: lead.message,
    });
    setAnalysisResult({
      leadScore: lead.lead_score,
      classification: lead.classification,
      purchaseIntent: lead.purchase_intent,
      priority: lead.priority,
      shortSummary: lead.summary,
      recommendedNextAction: lead.recommended_action,
      suggestedResponse: lead.suggested_response,
      reasoning: lead.reasoning,
      timestamp: lead.created_at,
    });
    setIsSaved(true);
    setActiveTab('analysis');
  };

  // Delete lead from persistent storage
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

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row text-slate-900 font-sans">
      {/* Mobile Top Navigation Bar */}
      <div className="md:hidden bg-slate-900 text-white px-4 py-3 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-sm">
            LP
          </div>
          <div>
            <span className="font-bold text-sm">LeadPilot AI</span>
            <span className="text-[10px] ml-1 bg-blue-500/30 text-blue-300 px-1 rounded">CRM</span>
          </div>
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
      <div className={`${isMobileSidebarOpen ? 'block' : 'hidden'} md:block shrink-0`}>
        <Sidebar
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setIsMobileSidebarOpen(false);
          }}
          leadsCount={leads.length}
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
         <div className="flex justify-end px-4 pt-4 md:px-6">
    <button
	    type="button"
    onClick={async () => {
      try {
        await signOut(auth);
        console.log('Logged out successfully');
      } catch (error) {
        console.error('Logout error:', error);
      }
    }}
    className="px-4 py-2 rounded-lg bg-slate-900 text-white hover:bg-slate-700"
  >










      Logout
    </button>
  </div>
        <Header
          activeTab={activeTab}
          onSelectPreset={handleSelectPreset}
          onClearForm={handleClearForm}
          onOpenHelp={() => setIsHelpOpen(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 max-w-7xl w-full mx-auto">
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

          {activeTab === 'dashboard' && (
            <DashboardView
              leads={leads}
              onNavigate={setActiveTab}
              onSelectLead={handleSelectLeadForWorkspace}
            />
          )}

          {activeTab === 'leads' && (
            <LeadsView
              leads={leads}
              isLoading={isLoadingLeads}
              onRefresh={fetchLeads}
              onNavigate={setActiveTab}
              onSelectLeadForWorkspace={handleSelectLeadForWorkspace}
              onDeleteLead={handleDeleteLead}
            />
          )}

          {activeTab === 'settings' && (
            <SettingsView leads={leads} />
          )}
        </main>
      </div>

      {/* Help Modal */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </div>
  );
}

