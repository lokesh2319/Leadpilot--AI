import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import { analyzeLeadWithGemini } from "./server/geminiService.js";
import {
  getAllLeads,
  getLeadById,
  saveLead,
  deleteLead,
} from "./server/db.js";
import { normalizeLeadPayload, validateNormalizedLead } from "./server/normalizer.js";
import {
  generateRequestId,
  logIntakeTrace,
  enqueueIntakeLead,
  getIntakeLogs,
} from "./server/intakeQueue.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;;

app.use(express.json({ limit: "5mb" }));

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * GET /api/leads
 * Returns all saved leads in newest-first order
 */
app.get("/api/leads", (_req, res) => {
  try {
    const leads = getAllLeads();
    return res.json({
      success: true,
      data: leads,
      total: leads.length,
    });
  } catch (error: any) {
    console.error("Error in GET /api/leads:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve saved leads.",
    });
  }
});

/**
 * GET /api/leads/:id
 * Returns a single saved lead by ID
 */
app.get("/api/leads/:id", (req, res) => {
  try {
    const { id } = req.params;
    const lead = getLeadById(id);
    if (!lead) {
      return res.status(404).json({
        success: false,
        error: `Lead with ID '${id}' was not found.`,
      });
    }
    return res.json({
      success: true,
      data: lead,
    });
  } catch (error: any) {
    console.error("Error in GET /api/leads/:id:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: "Failed to retrieve lead details.",
    });
  }
});

/**
 * DELETE /api/leads/:id
 * Removes a lead from persistent storage
 */
app.delete("/api/leads/:id", (req, res) => {
  try {
    const { id } = req.params;
    const success = deleteLead(id);
    if (!success) {
      return res.status(404).json({
        success: false,
        error: `Lead with ID '${id}' was not found.`,
      });
    }
    return res.json({
      success: true,
      message: `Lead '${id}' deleted successfully.`,
    });
  } catch (error: any) {
    console.error("Error in DELETE /api/leads/:id:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: "Failed to delete lead.",
    });
  }
});

/**
 * Fast Webhook Intake Endpoint: POST /api/leads/intake
 * Specifically designed for external CRM systems (such as Zoho CRM, HubSpot, Salesforce).
 *
 * 1. Normalizes and validates incoming payload immediately.
 * 2. Returns HTTP 200 immediately without blocking on Gemini AI.
 * 3. Asynchronously enqueues lead for background AI qualification and storage.
 * 4. Logs full lifecycle traces with a generated request_id:
 *    - webhook_received
 *    - validation_passed
 *    - ai_processing_started
 *    - ai_processing_completed
 *    - lead_saved
 *    - processing_failed
 */
app.post("/api/leads/intake", (req, res) => {
  const requestId = generateRequestId();

  try {
    // Stage: webhook_received
    logIntakeTrace(requestId, "webhook_received", "Inbound CRM webhook payload received at /api/leads/intake");

    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      logIntakeTrace(requestId, "processing_failed", "Invalid payload: Expected a JSON object.");
      return res.status(400).json({
        success: false,
        accepted: false,
        error: "Invalid request payload. Expected a JSON object.",
        request_id: requestId,
      });
    }

    // 1. Normalize payload across LeadPilot-native and generic CRM schemas
    const normalized = normalizeLeadPayload(body);

    // 2. Validate normalized fields
    const validation = validateNormalizedLead(normalized);
    if (!validation.valid) {
      logIntakeTrace(requestId, "processing_failed", `Validation failed: ${validation.error}`);
      return res.status(400).json({
        success: false,
        accepted: false,
        error: validation.error,
        request_id: requestId,
      });
    }

    // Stage: validation_passed
    logIntakeTrace(requestId, "validation_passed", `Validation passed for prospect '${normalized.customer_name}' (${normalized.email})`);

    // 3. Dispatch to reliable background queue (does not block HTTP response)
    enqueueIntakeLead(requestId, normalized);

    // 4. Immediately return HTTP 200 JSON to external CRM
    return res.status(200).json({
      success: true,
      accepted: true,
      message: "Lead accepted for processing",
      request_id: requestId,
    });
  } catch (error: any) {
    const safeError = error?.message ? String(error.message).replace(/(api[-_]?key|secret|token)=[^\s&]+/gi, "$1=REDACTED") : "Intake reception error";
    logIntakeTrace(requestId, "processing_failed", safeError);
    return res.status(500).json({
      success: false,
      accepted: false,
      error: "Failed to ingest lead webhook.",
      request_id: requestId,
    });
  }
});

/**
 * Developer Tracing Endpoint: GET /api/leads/intake/logs
 * Returns recent intake trace events for observability and audit
 */
app.get("/api/leads/intake/logs", (_req, res) => {
  return res.json({
    success: true,
    logs: getIntakeLogs(50),
  });
});

/**
 * External Webhook / API Endpoint: POST /api/leads/analyze
 * Supports both LeadPilot-native payloads and generic CRM-style payloads
 * (e.g. Zoho CRM, Salesforce, HubSpot).
 *
 * Mappings:
 * Full_Name      -> customer_name
 * Phone          -> phone
 * Email          -> email
 * Lead_Source    -> lead_source
 * Product        -> product_service
 * Annual_Revenue -> budget
 * Description    -> message
 */
app.post("/api/leads/analyze", async (req, res) => {
  try {
    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      return res.status(400).json({
        success: false,
        error: "Invalid request payload. Expected a JSON object.",
      });
    }

    // 1. Normalize payload across LeadPilot-native and generic CRM schemas
    const normalized = normalizeLeadPayload(body);

    // 2. Validate normalized fields - rejected requests are NOT saved
    if (!normalized.customer_name) {
      return res.status(400).json({
        success: false,
        error: "Field 'customer_name' (or 'Full_Name') is required and must not be empty.",
      });
    }

    if (!normalized.email) {
      return res.status(400).json({
        success: false,
        error: "Field 'email' (or 'Email') is required.",
      });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalized.email)) {
      return res.status(400).json({
        success: false,
        error: "Field 'email' must be a valid email address.",
      });
    }

    if (!normalized.message) {
      return res.status(400).json({
        success: false,
        error: "Field 'message' (or 'Description') is required and must describe the customer requirement.",
      });
    }

    // 3. Run analysis through the shared Gemini engine
    const analysisData = await analyzeLeadWithGemini({
      customerName: normalized.customer_name,
      phoneNumber: normalized.phone,
      email: normalized.email,
      leadSource: normalized.lead_source,
      productInterest: normalized.product_service,
      budget: normalized.budget,
      customerMessage: normalized.message,
    });

    // 4. Save lead to persistent storage upon successful analysis
    const savedLead = saveLead({
      customer_name: normalized.customer_name,
      phone: normalized.phone,
      email: normalized.email,
      lead_source: normalized.lead_source,
      product_service: normalized.product_service,
      budget: normalized.budget,
      message: normalized.message,
      lead_score: analysisData.lead_score,
      classification: analysisData.classification,
      purchase_intent: analysisData.purchase_intent,
      priority: analysisData.priority,
      summary: analysisData.summary,
      recommended_action: analysisData.recommended_action,
      suggested_response: analysisData.suggested_response,
      reasoning: analysisData.reasoning,
    });

    // 5. Return success contract with normalized_input and analysis data
    return res.status(200).json({
      success: true,
      normalized_input: {
        customer_name: normalized.customer_name,
        phone: normalized.phone,
        email: normalized.email,
        lead_source: normalized.lead_source,
        product_service: normalized.product_service,
        budget: normalized.budget,
        message: normalized.message,
      },
      data: {
        id: savedLead.id,
        lead_score: analysisData.lead_score,
        classification: analysisData.classification,
        purchase_intent: analysisData.purchase_intent,
        priority: analysisData.priority,
        summary: analysisData.summary,
        recommended_action: analysisData.recommended_action,
        suggested_response: analysisData.suggested_response,
        reasoning: analysisData.reasoning,
      },
    });
  } catch (error: any) {
    // Log server-side for diagnostics without leaking credentials or prompts
    console.error("Error in POST /api/leads/analyze:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: "Internal server error occurred while analyzing lead with Gemini AI. Please try again.",
    });
  }
});

/**
 * Web Interface Endpoint: POST /api/analyze-lead
 * Uses the same Gemini analysis service for UI form submissions and persists lead.
 */
app.post("/api/analyze-lead", async (req, res) => {
  try {
    const normalized = normalizeLeadPayload(req.body);

    if (!normalized.customer_name) {
      return res.status(400).json({
        success: false,
        error: "Customer name is required.",
      });
    }
    if (!normalized.email || !normalized.email.includes("@")) {
      return res.status(400).json({
        success: false,
        error: "Valid email address is required.",
      });
    }
    if (!normalized.message) {
      return res.status(400).json({
        success: false,
        error: "Customer message or enquiry is required.",
      });
    }

    const result = await analyzeLeadWithGemini({
      customerName: normalized.customer_name,
      phoneNumber: normalized.phone,
      email: normalized.email,
      leadSource: normalized.lead_source,
      productInterest: normalized.product_service,
      budget: normalized.budget,
      customerMessage: normalized.message,
    });

    // Save lead to persistent storage upon successful analysis
    const savedLead = saveLead({
      customer_name: normalized.customer_name,
      phone: normalized.phone,
      email: normalized.email,
      lead_source: normalized.lead_source,
      product_service: normalized.product_service,
      budget: normalized.budget,
      message: normalized.message,
      lead_score: result.lead_score,
      classification: result.classification,
      purchase_intent: result.purchase_intent,
      priority: result.priority,
      summary: result.summary,
      recommended_action: result.recommended_action,
      suggested_response: result.suggested_response,
      reasoning: result.reasoning,
    });

    return res.json({
      success: true,
      data: result,
      lead: savedLead,
      ...result,
    });
  } catch (error: any) {
    console.error("Error in POST /api/analyze-lead:", error?.message || error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while evaluating lead with Gemini AI. Please try again.",
    });
  }
});

// Vite dev middleware / static production serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
