import React, { useState, useEffect } from 'react';
import { 
  Sliders, 
  Clock, 
  ShieldCheck, 
  Download, 
  Sparkles, 
  Info,
  CheckCircle2,
  Webhook,
  Send,
  Copy,
  Check,
  Terminal,
  AlertCircle,
  Code,
  Zap,
  Activity,
  RefreshCw
} from 'lucide-react';
import { LeadRecord, StoredLead } from '../types';

interface SettingsViewProps {
  leads: (StoredLead | LeadRecord)[];
}

const SAMPLE_PAYLOADS = {
  rahul: {
    name: "Native LeadPilot (customer_name, budget, message)",
    json: JSON.stringify(
      {
        customer_name: "Rahul Sharma",
        phone: "9876543210",
        email: "rahul@example.com",
        lead_source: "Website",
        product_service: "CRM Automation",
        budget: "100000",
        message:
          "We have 20 salespeople and want to implement a CRM within 30 days. Our budget is approved.",
      },
      null,
      2
    ),
  },
  genericCrm: {
    name: "Generic CRM Payload (Full_Name, Annual_Revenue, Description)",
    json: JSON.stringify(
      {
        Full_Name: "Vikram Malhotra",
        Phone: "9876543210",
        Email: "vikram@enterprise.co",
        Lead_Source: "Website",
        Product: "CRM Automation",
        Annual_Revenue: "100000",
        Description:
          "We have 20 salespeople and want to implement a CRM within 30 days. Our budget is approved.",
      },
      null,
      2
    ),
  },
  starter: {
    name: "Early Research (Cold / No Budget)",
    json: JSON.stringify(
      {
        customer_name: "Sarah Jenkins",
        phone: "+1 415 555 0192",
        email: "sarah@independentdesign.co",
        lead_source: "Google Search",
        product_service: "CRM Automation",
        budget: "Under 5000",
        message:
          "Just looking around at options for next year. No budget allocated yet.",
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
        message: "Testing validation response.",
      },
      null,
      2
    ),
  },
};

export const SettingsView: React.FC<SettingsViewProps> = ({ leads }) => {
  const [selectedEndpoint, setSelectedEndpoint] = useState<'/api/leads/intake' | '/api/leads/analyze'>('/api/leads/intake');
  const [testPayload, setTestPayload] = useState<string>(SAMPLE_PAYLOADS.genericCrm.json);
  const [isSending, setIsSending] = useState<boolean>(false);
  const [responseStatus, setResponseStatus] = useState<number | null>(null);
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [responseTime, setResponseTime] = useState<number | null>(null);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [copiedResponse, setCopiedResponse] = useState<boolean>(false);
  
  // Intake Traces State
  const [intakeLogs, setIntakeLogs] = useState<any[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState<boolean>(false);

  const fetchIntakeLogs = async () => {
    try {
      setIsLoadingLogs(true);
      const res = await fetch('/api/leads/intake/logs');
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
    fetchIntakeLogs();
  }, []);

  const exportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(leads, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `leadpilot-leads-${new Date().toISOString().slice(0,10)}.json`);
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

      const res = await fetch(selectedEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(parsedBody),
      });

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
    const curlCommand = `curl -X POST "${window.location.origin}${selectedEndpoint}" \\
  -H "Content-Type: application/json" \\
  -d '${testPayload.replace(/'/g, "'\\''")}'`;

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
    <div className="space-y-6 max-w-4xl">
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
              Zoho / HubSpot / Zapier
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
                  Live Audit Trail
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
                No webhook intake events recorded yet. Send a test webhook to /api/leads/intake to see live lifecycle traces.
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

          {/* Contract Documentation */}
          <div className="bg-slate-50 rounded-lg p-4 border border-slate-200/80 text-xs space-y-2">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5">
              <Info className="w-3.5 h-3.5 text-blue-600" />
              <span>CRM Intake API Specifications</span>
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1 text-[11px] text-slate-600">
              <div>
                <span className="font-semibold text-slate-800 block mb-1">CRM Mappings & Normalization:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  <li><code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-slate-800">Full_Name</code> → customer_name</li>
                  <li><code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-slate-800">Email</code> → email (validated format)</li>
                  <li><code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-slate-800">Description</code> → message</li>
                  <li><code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-slate-800">Phone</code> → phone</li>
                  <li><code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-slate-800">Annual_Revenue</code> → budget</li>
                </ul>
              </div>
              <div>
                <span className="font-semibold text-slate-800 block mb-1">Intake Execution Lifecycle:</span>
                <ul className="list-disc list-inside space-y-0.5">
                  <li><strong>HTTP 200 immediate</strong> acknowledgment response</li>
                  <li>Non-blocking background queue for Gemini qualification</li>
                  <li>Full trace logging with unique <code className="bg-slate-200/70 px-1 py-0.5 rounded font-mono text-slate-800">request_id</code></li>
                  <li>Persistent storage in SQLite database</li>
                </ul>
              </div>
            </div>
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
            All lead scores are computed server-side via Google Gemini models without exposing credentials. Export your local session pipeline at any time.
          </p>
        </div>

        <button
          type="button"
          id="btn-export-json"
          onClick={exportData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all cursor-pointer shrink-0"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export Session Leads (JSON)</span>
        </button>
      </div>
    </div>
  );
};

