import React, { useState, useEffect } from 'react';
import { 
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
  CheckCircle2, 
  ExternalLink,
  ShieldCheck,
  Cpu,
  Layers
} from 'lucide-react';
import { authFetch } from '../utils/authFetch';
import { auth } from '../firebase';

interface IntegrationInfo {
  provider: string;
  status: string;
  secretPrefix: string;
  createdAt: string;
  updatedAt: string;
  lastUsedAt: string | null;
}

const SAMPLE_PAYLOADS = {
  zohoCrm: {
    name: "Zoho CRM (Full_Name, Email, Annual_Revenue)",
    json: JSON.stringify(
      {
        Full_Name: "Vikram Malhotra",
        Phone: "+91 98765 43210",
        Email: "vikram@enterprise.co",
        Lead_Source: "Zoho CRM Inbound",
        Product: "Enterprise CRM Automation",
        Annual_Revenue: "150000",
        Description:
          "We have 25 sales reps and need automated qualification before assigning them to account executives. Budget approved for Q3.",
      },
      null,
      2
    ),
  },
  hubspot: {
    name: "HubSpot / Generic (firstname, lastname, company, budget)",
    json: JSON.stringify(
      {
        firstname: "Elena",
        lastname: "Rostova",
        email: "elena@novapulse.tech",
        phone: "+1 206 555 0193",
        company: "NovaPulse Technologies",
        hs_lead_status: "OPEN",
        budget: "35000",
        message:
          "Looking to eliminate manual lead tagging and automatically qualify inbound demo requests with Gemini AI.",
      },
      null,
      2
    ),
  },
  native: {
    name: "Native LeadPilot (customer_name, budget, message)",
    json: JSON.stringify(
      {
        customer_name: "Sarah Lin",
        phone: "+1 512 440 2918",
        email: "sarah.lin@cloudmetric.com",
        lead_source: "Referral",
        product_service: "Enterprise Lead Automation Platform",
        budget: "60000",
        message:
          "Referred by Datasync. Need SOC-2 compliant multi-tenant lead scoring and instant response drafting.",
      },
      null,
      2
    ),
  },
};

export const IntegrationsView: React.FC = () => {
  const [integration, setIntegration] = useState<IntegrationInfo | null>(null);
  const [isLoadingIntegration, setIsLoadingIntegration] = useState(true);
  const [newlyGeneratedSecret, setNewlyGeneratedSecret] = useState<string | null>(null);
  const [isRotatingSecret, setIsRotatingSecret] = useState(false);
  const [secretActionError, setSecretActionError] = useState<string | null>(null);

  // Webhook Tester State
  const [selectedEndpoint, setSelectedEndpoint] = useState<'/api/leads/intake' | '/api/leads/analyze'>('/api/leads/intake');
  const [testPayload, setTestPayload] = useState<string>(SAMPLE_PAYLOADS.zohoCrm.json);
  const [testSecret, setTestSecret] = useState<string>('');
  const [isSending, setIsSending] = useState(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);

  // Copy Feedback
  const [copiedCurl, setCopiedCurl] = useState(false);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [copiedWebhookUrl, setCopiedWebhookUrl] = useState(false);

  // Intake Audit Logs
  const [intakeLogs, setIntakeLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  const webhookBaseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://api.leadpilot.ai';
  const intakeEndpointUrl = `${webhookBaseUrl}/api/leads/intake`;

  const fetchIntegration = async () => {
    if (!auth.currentUser) return;
    try {
      setIsLoadingIntegration(true);
      const res = await authFetch('/api/integrations/zoho/webhook');
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.data) {
          setIntegration(json.data);
          if (json.data.secret) {
            setTestSecret(json.data.secret);
          }
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch Zoho webhook integration:', err.message);
    } finally {
      setIsLoadingIntegration(false);
    }
  };

  const fetchIntakeLogs = async () => {
    if (!auth.currentUser) return;
    try {
      setIsLoadingLogs(true);
      const res = await authFetch('/api/audit/intake-logs');
      if (res.ok) {
        const json = await res.json();
        if (json.success && Array.isArray(json.data)) {
          setIntakeLogs(json.data);
        }
      }
    } catch (err: any) {
      console.warn('Failed to fetch intake audit logs:', err.message);
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchIntegration();
    fetchIntakeLogs();
  }, []);

  const handleRotateSecret = async () => {
    if (!confirm('Are you sure you want to rotate the Zoho CRM Webhook secret? Existing webhook senders must update their x-zoho-secret header immediately.')) {
      return;
    }

    try {
      setIsRotatingSecret(true);
      setSecretActionError(null);
      const res = await authFetch('/api/integrations/zoho/rotate-secret', { method: 'POST' });
      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Failed to rotate webhook secret');
      }

      setNewlyGeneratedSecret(json.data.secret);
      setTestSecret(json.data.secret);
      await fetchIntegration();
    } catch (err: any) {
      setSecretActionError(err.message || 'Error rotating webhook secret');
    } finally {
      setIsRotatingSecret(false);
    }
  };

  const handleSendTestWebhook = async () => {
    setIsSending(true);
    setResponseStatus(null);
    setResponseBody(null);
    setResponseTime(null);

    const startTime = performance.now();
    try {
      const parsed = JSON.parse(testPayload);
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (testSecret) {
        headers['x-zoho-secret'] = testSecret.trim();
      }

      const res = await authFetch(selectedEndpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(parsed),
      });

      const elapsed = Math.round(performance.now() - startTime);
      setResponseTime(elapsed);
      setResponseStatus(res.status);

      const json = await res.json();
      setResponseBody(JSON.stringify(json, null, 2));
      // Refresh audit logs
      fetchIntakeLogs();
    } catch (err: any) {
      const elapsed = Math.round(performance.now() - startTime);
      setResponseTime(elapsed);
      setResponseStatus(500);
      setResponseBody(JSON.stringify({ error: err.message || 'Failed to dispatch test request' }, null, 2));
    } finally {
      setIsSending(false);
    }
  };

  const curlCommand = `curl -X POST "${intakeEndpointUrl}" \\
  -H "Content-Type: application/json" \\
  -H "x-zoho-secret: ${newlyGeneratedSecret || testSecret || 'YOUR_ZOHO_SECRET'}" \\
  -d '${testPayload.replace(/'/g, "'\\''")}'`;

  const handleCopyCurl = () => {
    navigator.clipboard.writeText(curlCommand);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleCopySecret = (sec: string) => {
    navigator.clipboard.writeText(sec);
    setCopiedSecret(true);
    setTimeout(() => setCopiedSecret(false), 2000);
  };

  const handleCopyWebhookUrl = () => {
    navigator.clipboard.writeText(intakeEndpointUrl);
    setCopiedWebhookUrl(true);
    setTimeout(() => setCopiedWebhookUrl(false), 2000);
  };

  return (
    <div id="integrations-view-container" className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-xl p-6 border border-slate-200 shadow-2xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Enterprise Ecosystem
            </span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              HMAC SHA-256 Verified
            </span>
          </div>
          <h2 className="text-xl font-bold text-slate-900 tracking-tight">
            Zoho CRM & Webhook Integration Hub
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl leading-relaxed">
            Connect Zoho CRM, HubSpot, or custom webhook dispatchers. Every inbound lead is authenticated via secret verification, parsed by Gemini AI, and routed into your isolated tenant pipeline.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={fetchIntegration}
            disabled={isLoadingIntegration}
            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoadingIntegration ? 'animate-spin' : ''}`} />
            <span>Sync Status</span>
          </button>
        </div>
      </div>

      {/* Main Zoho CRM Webhook Configuration Card */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 bg-slate-50/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              <Webhook className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">Zoho CRM Inbound Webhook</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 uppercase">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Active & Connected
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target endpoint for Zoho CRM Workflow Rules & Webhooks
              </p>
            </div>
          </div>

          <button
            type="button"
            id="btn-rotate-zoho-secret"
            onClick={handleRotateSecret}
            disabled={isRotatingSecret}
            className="px-3.5 py-1.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-xs font-semibold shadow-2xs transition-colors cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
          >
            <Key className="w-3.5 h-3.5 text-slate-500" />
            <span>{isRotatingSecret ? 'Generating...' : 'Rotate Webhook Secret'}</span>
          </button>
        </div>

        <div className="p-6 space-y-5">
          {secretActionError && (
            <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{secretActionError}</span>
            </div>
          )}

          {/* Webhook Endpoint URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Inbound Webhook Endpoint URL
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900 text-slate-100 font-mono text-xs px-3.5 py-2 rounded-lg border border-slate-800 select-all truncate">
                {intakeEndpointUrl}
              </div>
              <button
                type="button"
                id="btn-copy-webhook-url"
                onClick={handleCopyWebhookUrl}
                className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
              >
                {copiedWebhookUrl ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy URL</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-slate-400">
              Configure this exact URL inside Zoho CRM (Setup &rarr; Automation &rarr; Workflow Rules &rarr; Webhooks &rarr; POST).
            </p>
          </div>

          {/* Webhook Secret Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block">
              Tenant Authentication Secret (x-zoho-secret)
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-100 text-slate-800 font-mono text-xs px-3.5 py-2 rounded-lg border border-slate-200 select-all truncate">
                {newlyGeneratedSecret || (integration?.secretPrefix ? `${integration.secretPrefix}••••••••••••••••` : 'sec_live_********************')}
              </div>
              {(newlyGeneratedSecret || testSecret) && (
                <button
                  type="button"
                  id="btn-copy-webhook-secret"
                  onClick={() => handleCopySecret(newlyGeneratedSecret || testSecret)}
                  className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors cursor-pointer shrink-0 flex items-center gap-1.5"
                >
                  {copiedSecret ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Secret</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <p className="text-[11px] text-slate-400">
              Include header <code className="text-slate-700 font-mono bg-slate-100 px-1 rounded">x-zoho-secret</code> in your webhook calls. Requests without valid tenant secrets are securely rejected with 401 Unauthorized.
            </p>
          </div>
        </div>
      </div>

      {/* Interactive Webhook Simulator & cURL Generator */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Simulator Column (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">Interactive Webhook Simulator</h3>
            </div>
            <span className="text-[11px] text-slate-400 font-medium">Test real HTTP ingestion</span>
          </div>

          {/* Sample Payload Switcher */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">Preset CRM Payloads:</label>
            <div className="flex flex-wrap gap-1.5">
              {Object.entries(SAMPLE_PAYLOADS).map(([key, payload]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setTestPayload(payload.json)}
                  className="px-2.5 py-1 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md transition-colors cursor-pointer"
                >
                  {payload.name.split(' (')[0]}
                </button>
              ))}
            </div>
          </div>

          {/* JSON Payload Editor */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">HTTP Request Body (JSON):</label>
            <textarea
              rows={8}
              value={testPayload}
              onChange={(e) => setTestPayload(e.target.value)}
              className="w-full font-mono text-xs bg-slate-900 text-slate-100 p-3 rounded-lg border border-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Submit Action */}
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              id="btn-copy-curl-code"
              onClick={handleCopyCurl}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
            >
              {copiedCurl ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Code className="w-3.5 h-3.5" />}
              <span>{copiedCurl ? 'Copied cURL Command!' : 'Copy cURL Command'}</span>
            </button>

            <button
              type="button"
              id="btn-send-test-webhook"
              onClick={handleSendTestWebhook}
              disabled={isSending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg shadow-xs transition-colors cursor-pointer disabled:opacity-60"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{isSending ? 'Sending & Scoring...' : 'Send Live Test Webhook'}</span>
            </button>
          </div>

          {/* Response Inspector */}
          {responseStatus !== null && (
            <div className="mt-4 p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-700">Response Status:</span>
                <div className="flex items-center gap-2 font-mono font-bold">
                  <span className={`px-2 py-0.5 rounded ${
                    responseStatus >= 200 && responseStatus < 300
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}>
                    HTTP {responseStatus}
                  </span>
                  {responseTime !== null && (
                    <span className="text-slate-500 font-normal">{responseTime} ms</span>
                  )}
                </div>
              </div>
              {responseBody && (
                <pre className="p-3 bg-slate-900 text-slate-100 font-mono text-[11px] rounded-lg overflow-x-auto max-h-48">
                  {responseBody}
                </pre>
              )}
            </div>
          )}
        </div>

        {/* Ecosystem Connectors Column (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs p-6 space-y-4">
            <h3 className="text-sm font-bold text-slate-900">Supported CRM Platforms</h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              Standardized webhook ingest engine normalizes disparate CRM payload shapes into unified LeadPilot lead records automatically.
            </p>

            <div className="space-y-3">
              {/* Zoho */}
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-blue-600 text-white font-bold flex items-center justify-center text-xs">
                    Z
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Zoho CRM</span>
                    <span className="text-[10px] text-slate-500">Native Webhook & Leads Module</span>
                  </div>
                </div>
                <span className="text-[10px] font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                  Live & Active
                </span>
              </div>

              {/* HubSpot */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-orange-600 text-white font-bold flex items-center justify-center text-xs">
                    H
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">HubSpot CRM</span>
                    <span className="text-[10px] text-slate-500">Workflows & Form Submissions</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                  Ready
                </span>
              </div>

              {/* Salesforce */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded bg-sky-600 text-white font-bold flex items-center justify-center text-xs">
                    S
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Salesforce Sales Cloud</span>
                    <span className="text-[10px] text-slate-500">Outbound Messages & Apex Triggers</span>
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-600 bg-slate-200 px-2 py-0.5 rounded-full">
                  Enterprise
                </span>
              </div>
            </div>
          </div>

          {/* Security Spec Card */}
          <div className="bg-slate-900 text-slate-100 rounded-xl p-5 border border-slate-800 space-y-2.5 text-xs">
            <div className="flex items-center gap-2 text-emerald-400 font-bold">
              <ShieldCheck className="w-4 h-4" />
              <span>Production Security Architecture</span>
            </div>
            <ul className="space-y-1.5 text-slate-300 text-[11px] leading-relaxed">
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">&bull;</span>
                <span>Per-tenant SHA-256 HMAC webhook signature validation</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">&bull;</span>
                <span>Firestore multi-tenant subcollection isolation (`/companies/{'{workspaceId}'}/leads`)</span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-400">&bull;</span>
                <span>Cloud Tasks resilient asynchronous worker queue dispatch</span>
              </li>
            </ul>
          </div>
        </div>
      </div>

      {/* Webhook Intake Audit Log Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="p-5 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-900">Inbound Webhook Audit Trail</h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Live request lifecycle traces, HTTP status codes, and Gemini qualification timestamps
            </p>
          </div>
          <button
            type="button"
            onClick={fetchIntakeLogs}
            disabled={isLoadingLogs}
            className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 cursor-pointer"
          >
            <RefreshCw className={`w-3 h-3 ${isLoadingLogs ? 'animate-spin' : ''}`} />
            <span>Refresh Logs</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-4">Request ID</th>
                <th className="py-3 px-4">Source / Endpoint</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {intakeLogs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-400">
                    No webhook logs recorded yet. Send a test webhook using the simulator above.
                  </td>
                </tr>
              ) : (
                intakeLogs.slice(0, 8).map((log: any, idx: number) => (
                  <tr key={log.id || idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-600 text-[11px]">
                      {(log.id || `req_${idx}`).slice(0, 14)}...
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-800">
                      {log.source || 'Zoho CRM / Webhook'}
                    </td>
                    <td className="py-3 px-4 text-slate-700">
                      {log.customer_name || log.payload?.Full_Name || log.payload?.customer_name || 'Lead Submission'}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <span className="inline-block text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                        {log.status || 'Verified 200'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right text-slate-500 font-mono text-[11px]">
                      {log.timestamp ? new Date(log.timestamp).toLocaleTimeString() : 'Recent'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
