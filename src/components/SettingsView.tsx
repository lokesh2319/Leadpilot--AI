import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Clock, 
  ShieldCheck, 
  Download, 
  Sparkles, 
  Info,
  Webhook,
  Send,
  Copy,
  Check,
  Terminal,
  AlertCircle,
  Code,
  Zap,
  Activity,
  RefreshCw,
  Key,
  Building2,
  Lock,
  CheckCircle2
} from 'lucide-react';
import { LeadRecord, StoredLead } from '../types';
import { authFetch } from '../utils/authFetch';

interface SettingsViewProps {
  leads: (StoredLead | LeadRecord)[];
}

interface WorkspaceInfo {
  id: string;
  name: string;
  role: string;
  plan: string;
  monthlyLeadLimit: number;
  status: string;
}

interface IntegrationInfo {
  provider: string;
  status: string;
  secretPrefix: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
}

const SAMPLE_PAYLOADS = {
  genericCrm: {
    name: "Generic CRM (Zoho / HubSpot: Full_Name, Annual_Revenue)",
    json: JSON.stringify(
      {
        Full_Name: "Vikram Malhotra",
        Phone: "9876543210",
        Email: "vikram@enterprise.co",
        Lead_Source: "Zoho CRM Inbound",
        Product: "Enterprise CRM Automation",
        Annual_Revenue: "150000",
        Description:
          "We have 25 sales reps and need automated qualification before assigning them to account executives.",
      },
      null,
      2
    ),
  },
  native: {
    name: "Native LeadPilot (customer_name, budget, message)",
    json: JSON.stringify(
      {
        customer_name: "Sarah Connor",
        phone: "+1 415 555 0192",
        email: "sarah@skynet-resistance.org",
        lead_source: "Partner Referral",
        product_service: "Security Automation",
        budget: "85000",
        message:
          "Immediate requirement for AI lead scoring pipeline. Budget approved for Q3 rollout.",
      },
      null,
      2
    ),
  },
  cold: {
    name: "Early Research (Cold / Low Budget)",
    json: JSON.stringify(
      {
        customer_name: "David Kim",
        phone: "+1 415 555 9922",
        email: "david@smallagency.io",
        lead_source: "Google Search",
        product_service: "Basic CRM",
        budget: "Under 5000",
        message: "Just researching options for next year. No budget allocated yet.",
      },
      null,
      2
    ),
  },
  invalid: {
    name: "Validation Test (Missing Name & Invalid Email)",
    json: JSON.stringify(
      {
        customer_name: "",
        phone: "123456",
        email: "invalid-email-string",
        lead_source: "Website",
        product_service: "CRM Automation",
        budget: "50000",
        message: "Testing validation error response.",
      },
      null,
      2
    ),
  },
};

export const SettingsView: React.FC<SettingsViewProps> = ({ leads }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'/api/leads/intake' | '/api/leads/analyze'>('/api/leads/intake');
  const [testPayload, setTestPayload] = useState<string>(SAMPLE_PAYLOADS.genericCrm.json);
  const [testSecret, setTestSecret] = useState<string>('');
  const [isSending, setIsSending] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);
  const [copiedSecret, setCopiedSecret] = useState<boolean>(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState<boolean>(false);

  // Workspace & Integration State
  const [workspace, setWorkspace] = useState<WorkspaceInfo | null>(null);
  const [integration, setIntegration] = useState<IntegrationInfo | null>(null);
  const [newlyGeneratedSecret, setNewlyGeneratedSecret] = useState<string | null>(null);
  const [isRotatingSecret, setIsRotatingSecret] = useState<boolean>(false);
  const [secretActionError, setSecretActionError] = useState<string | null>(null);

  // Intake Traces State
  const [intakeLogs, setIntakeLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  const webhookUrl = `${window.location.origin}/api/leads/intake`;

  const fetchWorkspaceAndIntegration = async () => {
    try {
      const meRes = await authFetch('/api/me');
      if (meRes.ok) {
        const meJson = await meRes.json();
        if (meJson.success && meJson.workspace) {
          setWorkspace(meJson.workspace);
        }
      }

      const intRes = await authFetch('/api/workspace/integration/zoho');
      if (intRes.ok) {
        const intJson = await intRes.json();
        if (intJson.success) {
          setIntegration(intJson.integration);
        }
      }
    } catch (e) {
      console.error('Failed to load workspace or integration info:', e);
    }
  };

  const fetchIntakeLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await authFetch('/api/leads/intake/logs');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.logs)) {
          setIntakeLogs(json.logs);
        }
      }
    } catch (e) {
      console.error('Failed to fetch intake logs', e);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchWorkspaceAndIntegration();
    fetchIntakeLogs();
  }, []);

  const handleRotateSecret = async () => {
    const confirmed = window.confirm(
      'Are you sure you want to generate / rotate your Zoho CRM Webhook Secret? Any previous secret will be immediately revoked.'
    );
    if (!confirmed) return;

    try {
      setIsRotatingSecret(true);
      setSecretActionError(null);
      const res = await authFetch('/api/workspace/integration/zoho/rotate', {
        method: 'POST',
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to rotate secret.');
      }

      setNewlyGeneratedSecret(data.secret);
      setTestSecret(data.secret);
      await fetchWorkspaceAndIntegration();
    } catch (err: any) {
      setSecretActionError(err?.message || 'Error generating webhook secret.');
    } finally {
      setIsRotatingSecret(false);
    }
  };

  const exportData = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `leadpilot-leads-${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSendTestRequest = async () => {
    setIsSending(true);
    setResponseStatus(null);
    setResponseBody(null);
    setResponseTime(null);

    const startTime = performance.now();
    try {
      let parsedBody: any;
      try {
        parsedBody = JSON.parse(testPayload);
      } catch (err: any) {
        setIsSending(false);
        setResponseStatus(400);
        setResponseBody(
          JSON.stringify(
            {
              success: false,
              error: `Invalid JSON syntax in test payload: ${err.message}`,
            },
            null,
            2
          )
        );
        return;
      }

      let res: Response;

      if (selectedEndpoint === '/api/leads/intake') {
        // Direct webhook intake requires x-leadpilot-secret header
        const secretHeader = testSecret || newlyGeneratedSecret || 'paste_your_secret_here';
        res = await fetch('/api/leads/intake', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-leadpilot-secret': secretHeader,
          },
          body: JSON.stringify(parsedBody),
        });
      } else {
        // Interactive analysis uses authenticated session
        res = await authFetch('/api/leads/analyze', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(parsedBody),
        });
      }

      const elapsed = Math.round(performance.now() - startTime);
      setResponseTime(elapsed);
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseBody(JSON.stringify(json, null, 2));

      // Refresh traces if testing the intake endpoint
      if (selectedEndpoint === '/api/leads/intake') {
        fetchIntakeLogs();
        setTimeout(fetchIntakeLogs, 2500);
      }
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setResponseTime(elapsed);
      setResponseStatus(500);
      setResponseBody(
        JSON.stringify(
          {
            success: false,
            error: err?.message || `Network error while connecting to ${selectedEndpoint}`,
          },
          null,
          2
        )
      );
    } finally {
      setIsSending(false);
    }
  };

  const handleCopyCurl = () => {
    const activeSecret = testSecret || newlyGeneratedSecret || '<YOUR_WORKSPACE_SECRET>';
    let curlCommand = '';

    if (selectedEndpoint === '/api/leads/intake') {
      curlCommand = `curl -X POST "${webhookUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-leadpilot-secret: ${activeSecret}" \\
  -d '${testPayload.replace(/'/g, "'\\''")}'`;
    } else {
      curlCommand = `curl -X POST "${window.location.origin}/api/leads/analyze" \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <FIREBASE_ID_TOKEN>" \\
  -d '${testPayload.replace(/'/g, "'\\''")}'`;
    }

    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopyResponse = () => {
    if (responseBody) {
      navigator.clipboard.writeText(responseBody);
      setCopiedResponse(true);
      setTimeout(() => setCopiedResponse(false), 2000);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Workspace Overview & Identity Card */}
      {workspace && (
        <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-800">{workspace.name}</h3>
                <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                  {workspace.plan} Tier
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Workspace ID: <code className="font-mono text-slate-700 bg-slate-100 px-1 py-0.5 rounded">{workspace.id}</code> · Role: <span className="font-medium text-slate-700 capitalize">{workspace.role}</span>
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="text-right">
              <span className="text-slate-500 block">Monthly Quota</span>
              <span className="font-bold text-slate-800 font-mono">{workspace.monthlyLeadLimit.toLocaleString()} leads/mo</span>
            </div>
          </div>
        </div>
      )}

      {/* Zoho CRM Multi-Tenant Webhook Management */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Key className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">Zoho CRM Multi-Tenant Webhook Integration</h3>
              <p className="text-xs text-slate-500">Each organization possesses a unique cryptographically hashed webhook secret.</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {integration?.status === 'active' ? (
              <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active Credentials
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-[11px] bg-amber-50 text-amber-700 font-semibold px-2 py-0.5 rounded border border-amber-200">
                <AlertCircle className="w-3 h-3 text-amber-600" /> No Active Secret
              </span>
            )}
          </div>
        </div>

        <div className="p-6 space-y-4 text-xs">
          {/* Webhook Intake URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Inbound Webhook URL (Zoho CRM Webhook Destination):
            </label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={webhookUrl}
                className="w-full p-2.5 font-mono text-xs bg-slate-50 text-slate-800 rounded-lg border border-slate-200"
              />
              <button
                type="button"
                id="btn-copy-webhook-url"
                onClick={() => {
                  navigator.clipboard.writeText(webhookUrl);
                  setCopiedWebhookUrl(true);
                  setTimeout(() => setCopiedWebhookUrl(false), 2000);
                }}
                className="inline-flex items-center gap-1 px-3 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg font-medium cursor-pointer border border-slate-300 shrink-0"
              >
                {copiedWebhookUrl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedWebhookUrl ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          {/* Newly Generated Secret Alert */}
          {newlyGeneratedSecret && (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-300 text-emerald-950 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-emerald-900">
                  <Lock className="w-4 h-4 text-emerald-600" />
                  <span>New Webhook Secret Generated (Copy Now)</span>
                </div>
                <button
                  type="button"
                  id="btn-copy-generated-secret"
                  onClick={() => {
                    navigator.clipboard.writeText(newlyGeneratedSecret);
                    setCopiedSecret(true);
                    setTimeout(() => setCopiedSecret(false), 2000);
                  }}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded text-xs font-semibold cursor-pointer"
                >
                  {copiedSecret ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedSecret ? 'Copied!' : 'Copy Secret'}</span>
                </button>
              </div>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                This token is shown only once. LeadPilot stores an irreversible SHA-256 hash. Configure your Zoho CRM Webhook header:
                <code className="font-mono font-bold ml-1 bg-emerald-100 px-1 py-0.5 rounded">x-leadpilot-secret</code>
              </p>
              <pre className="p-2.5 bg-white text-slate-900 font-mono text-xs rounded border border-emerald-200 select-all overflow-x-auto">
                {newlyGeneratedSecret}
              </pre>
            </div>
          )}

          {secretActionError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {secretActionError}
            </div>
          )}

          {/* Secret Management Action */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2">
            <div>
              <span className="font-semibold text-slate-800 block">
                Active Secret Prefix: {integration?.secretPrefix ? <code className="font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-800">{integration.secretPrefix}...</code> : 'None'}
              </span>
              <span className="text-[11px] text-slate-500">
                {integration?.updatedAt ? `Last rotated: ${new Date(integration.updatedAt).toLocaleDateString()}` : 'Generate a secret to connect Zoho CRM.'}
              </span>
            </div>

            <button
              type="button"
              id="btn-rotate-secret"
              onClick={handleRotateSecret}
              disabled={isRotatingSecret}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 disabled:bg-slate-400 text-white rounded-lg text-xs font-semibold shadow-2xs transition-all cursor-pointer shrink-0"
            >
              {isRotatingSecret ? (
                <>
                  <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Generating...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-3 h-3" />
                  <span>{integration?.secretPrefix ? 'Rotate Webhook Secret' : 'Generate Webhook Secret'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Developer API & Webhook Test Console */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Webhook className="w-4 h-4 text-blue-600" />
            <div>
              <h3 className="text-sm font-bold text-slate-800">External Webhook & API Console</h3>
              <p className="text-[11px] text-slate-500 font-mono mt-0.5">{selectedEndpoint}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 text-[11px] bg-blue-50 text-blue-700 font-semibold px-2 py-0.5 rounded border border-blue-200">
              <Sparkles className="w-3 h-3 text-blue-600" /> Fast Intake Ready
            </span>
            <span className="inline-flex items-center text-[11px] bg-emerald-50 text-emerald-700 font-semibold px-2 py-0.5 rounded border border-emerald-200">
              Zoho CRM Verified
            </span>
          </div>
        </div>

        <div className="p-6 space-y-5">
          {/* Endpoint Selector Tabs */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200/80">
            <div>
              <span className="text-xs font-bold text-slate-800 block">Target Webhook Endpoint:</span>
              <span className="text-[11px] text-slate-500">
                {selectedEndpoint === '/api/leads/intake'
                  ? 'Immediate HTTP 200 acknowledgment with asynchronous Gemini qualification'
                  : 'Interactive endpoint that awaits Gemini analysis before returning response'}
              </span>
            </div>
            <div className="flex items-center bg-white p-1 rounded-lg border border-slate-200 shadow-2xs">
              <button
                type="button"
                id="btn-select-intake-endpoint"
                onClick={() => setSelectedEndpoint('/api/leads/intake')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  selectedEndpoint === '/api/leads/intake'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Fast Intake (POST /api/leads/intake)</span>
              </button>
              <button
                type="button"
                id="btn-select-analyze-endpoint"
                onClick={() => setSelectedEndpoint('/api/leads/analyze')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold cursor-pointer transition-all ${
                  selectedEndpoint === '/api/leads/analyze'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>Interactive (POST /api/leads/analyze)</span>
              </button>
            </div>
          </div>

          {/* Test Secret Input (Only for Intake endpoint) */}
          {selectedEndpoint === '/api/leads/intake' && (
            <div className="space-y-1.5">
              <label htmlFor="test-webhook-secret" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-slate-500" />
                <span>Test Webhook Secret (<code className="font-mono text-blue-600">x-leadpilot-secret</code>):</span>
              </label>
              <input
                id="test-webhook-secret"
                type="text"
                placeholder={newlyGeneratedSecret || "Enter your workspace webhook secret or click 'Generate Webhook Secret' above"}
                value={testSecret}
                onChange={(e) => setTestSecret(e.target.value)}
                className="w-full p-2.5 font-mono text-xs bg-white text-slate-800 rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Preset Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-slate-700">Sample Payloads:</span>
            {Object.entries(SAMPLE_PAYLOADS).map(([key, item]) => (
              <button
                key={key}
                type="button"
                id={`btn-preset-${key}`}
                onClick={() => setTestPayload(item.json)}
                className="text-xs px-2.5 py-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium transition-colors cursor-pointer border border-slate-200"
              >
                {item.name}
              </button>
            ))}
          </div>

          {/* Request Payload Editor */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="test-json-payload" className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5 text-slate-500" />
                <span>Request JSON Payload:</span>
              </label>
              <button
                type="button"
                id="btn-copy-curl"
                onClick={handleCopyCurl}
                className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 cursor-pointer font-medium"
              >
                {copiedCurl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600">cURL Copied!</span>
                  </>
                ) : (
                  <>
                    <Terminal className="w-3.5 h-3.5" />
                    <span>Copy as cURL</span>
                  </>
                )}
              </button>
            </div>
            <textarea
              id="test-json-payload"
              rows={8}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full p-3 font-mono text-xs bg-slate-900 text-slate-100 rounded-lg border border-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all leading-relaxed"
              spellCheck={false}
            />
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="btn-execute-api-test"
              onClick={handleSendTestRequest}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
            >
              {isSending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Send {selectedEndpoint}</span>
                </>
              )}
            </button>
            <span className="text-[11px] text-slate-500">
              {selectedEndpoint === '/api/leads/intake'
                ? 'Immediate HTTP 200 (< 50ms) + background AI processing.'
                : 'Synchronous response awaiting Gemini qualification.'}
            </span>
          </div>

          {/* Response Display */}
          {responseBody && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-800">Response:</span>
                  {responseStatus && (
                    <span
                      className={`text-[11px] font-mono font-bold px-2 py-0.5 rounded border ${
                        responseStatus >= 200 && responseStatus < 300
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          : responseStatus >= 400 && responseStatus < 500
                          ? 'bg-amber-50 text-amber-700 border-amber-200'
                          : 'bg-rose-50 text-rose-700 border-rose-200'
                      }`}
                    >
                      HTTP {responseStatus}
                    </span>
                  )}
                  {responseTime !== null && (
                    <span className="text-[11px] text-slate-500 font-mono">
                      {responseTime} ms {selectedEndpoint === '/api/leads/intake' ? '(Immediate 200)' : ''}
                    </span>
                  )}
                </div>

                <button
                  type="button"
                  id="btn-copy-response-json"
                  onClick={handleCopyResponse}
                  className="inline-flex items-center gap-1 text-xs text-slate-600 hover:text-blue-600 cursor-pointer font-medium"
                >
                  {copiedResponse ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy JSON</span>
                    </>
                  )}
                </button>
              </div>

              <pre className="p-3 bg-slate-900 text-emerald-400 font-mono text-xs rounded-lg border border-slate-800 overflow-x-auto max-h-80 leading-relaxed">
                {responseBody}
              </pre>
            </div>
          )}

          {/* Live Webhook Trace Logs Panel */}
          <div className="pt-2 border-t border-slate-100 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-indigo-600" />
                <h4 className="text-xs font-bold text-slate-800">Recent Webhook Intake Traces</h4>
                <span className="text-[10px] bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded border border-indigo-200">
                  Workspace Audit Trail
                </span>
              </div>
              <button
                type="button"
                id="btn-refresh-traces"
                onClick={fetchIntakeLogs}
                disabled={isLoadingLogs}
                className="inline-flex items-center gap-1 text-[11px] text-slate-600 hover:text-blue-600 cursor-pointer font-medium"
              >
                <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin text-blue-600' : ''}`} />
                <span>Refresh Traces</span>
              </button>
            </div>

            {intakeLogs.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-50 text-center border border-slate-200 text-slate-500 text-xs">
                No webhook intake events recorded for this workspace yet. Send a test webhook with your secret to see live lifecycle traces.
              </div>
            ) : (
              <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
                {intakeLogs.slice(0, 10).map((log, idx) => {
                  const stageStyles: Record<string, string> = {
                    webhook_received: 'bg-blue-50 text-blue-700 border-blue-200',
                    validation_passed: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    ai_processing_started: 'bg-purple-50 text-purple-700 border-purple-200',
                    ai_processing_completed: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    lead_saved: 'bg-green-50 text-green-700 border-green-200 font-bold',
                    processing_failed: 'bg-rose-50 text-rose-700 border-rose-200 font-bold',
                  };
                  const badgeClass = stageStyles[log.stage] || 'bg-slate-100 text-slate-700 border-slate-200';

                  return (
                    <div
                      key={idx}
                      className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 hover:bg-slate-100/70 transition-colors"
                    >
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${badgeClass}`}>
                          {log.stage}
                        </span>
                        <span className="text-[11px] font-mono text-slate-500 bg-slate-200/60 px-1.5 py-0.2 rounded">
                          {log.request_id}
                        </span>
                        <span className="text-slate-800 font-medium text-[11px]">{log.message}</span>
                      </div>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Qualification Thresholds Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-800">Lead Scoring Weights & Classification</h3>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-semibold px-2 py-0.5 rounded">Scoring Matrix</span>
        </div>

        <div className="p-6 space-y-4 text-xs">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="font-bold text-slate-800 block">Hot Tier Threshold</span>
              <span className="text-xl font-bold font-mono text-emerald-600 mt-1 block">Score ≥ 80</span>
              <p className="text-[11px] text-slate-500 mt-1">High purchase intent, confirmed executive budget, immediate deployment requirement.</p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="font-bold text-slate-800 block">Warm Tier Threshold</span>
              <span className="text-xl font-bold font-mono text-amber-600 mt-1 block">55 ≤ Score &lt; 80</span>
              <p className="text-[11px] text-slate-500 mt-1">Viable budget, evaluating solutions for 30-90 days, discovery call required.</p>
            </div>

            <div className="p-3.5 rounded-lg border border-slate-200 bg-slate-50/50">
              <span className="font-bold text-slate-800 block">Cold Tier Threshold</span>
              <span className="text-xl font-bold font-mono text-slate-600 mt-1 block">Score &lt; 55</span>
              <p className="text-[11px] text-slate-500 mt-1">Early research, low or unspecified budget, self-serve automated nurture.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Response SLA Guidelines */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h3 className="text-sm font-bold text-slate-800">Sales Follow-Up SLA Matrix</h3>
          </div>
        </div>

        <div className="p-6 space-y-3 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div>
              <span className="font-bold text-slate-800">Urgent Priority (Hot Lead)</span>
              <p className="text-[11px] text-slate-500">Fast-track direct outreach via phone & customized response.</p>
            </div>
            <span className="font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded border border-emerald-200">
              &lt; 2 Hours
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div>
              <span className="font-bold text-slate-800">High Priority (Warm Lead)</span>
              <p className="text-[11px] text-slate-500">Send collateral and propose 15-min discovery session.</p>
            </div>
            <span className="font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">
              &lt; 24 Hours
            </span>
          </div>

          <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
            <div>
              <span className="font-bold text-slate-800">Standard / Low Priority (Cold Lead)</span>
              <p className="text-[11px] text-slate-500">Automated marketing workflow & self-service resources.</p>
            </div>
            <span className="font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded border border-slate-200">
              &lt; 48 Hours
            </span>
          </div>
        </div>
      </div>

      {/* Export & Compliance Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Secure Architecture & Export</span>
          </h3>
          <p className="text-xs text-slate-500 mt-1 max-w-lg">
            All lead scores are computed server-side via Google Gemini models without exposing credentials. Export your workspace leads pipeline at any time.
          </p>
        </div>

        <button
          type="button"
          id="btn-export-json"
          onClick={exportData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Workspace Leads (JSON)</span>
        </button>
      </div>
    </div>
  );
};
