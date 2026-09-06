import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";
import {
  verifyFirebaseToken,
  requireRole,
  AuthenticatedRequest,
} from "./server/auth.js";
import {
  getAllLeads,
  getLeadById,
  saveLead,
  deleteLead,
} from "./server/db.js";
import {
  normalizeLeadPayload,
  validateNormalizedLead,
} from "./server/normalizer.js";
import {
  generateRequestId,
  logIntakeTrace,
  enqueueIntakeLead,
  getIntakeLogs,
} from "./server/intakeQueue.js";
import {
  verifyAndResolveWebhookSecret,
  getWorkspaceIntegration,
  createOrRotateIntegrationSecret,
} from "./server/integrations.js";
import { checkAndUpdateUsage } from "./server/workspaces.js";
import { analyzeLeadWithGemini } from "./server/geminiService.js";
import { executeLeadProcessing } from "./server/cloudTasks.js";
import { logAuditTrace } from "./server/audit.js";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Security Headers: Helmet with relaxed CSP for local/embedded preview iframe
app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);

// CORS: allow current origin and common preview environments
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

// Request body limit
app.use(express.json({ limit: "2mb" }));

// Rate Limiters
const generalApiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please slow down.",
  },
});

const webhookIntakeLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 180,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    accepted: false,
    error: "Rate limit exceeded for inbound webhooks.",
  },
});

const secretRotationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many secret rotation requests. Please try again later.",
  },
});

app.use("/api/", generalApiLimiter);

/**
 * Health Check: GET /api/health
 */
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

/**
 * Current User & Workspace Profile: GET /api/me
 * Returns authenticated user info and server-resolved workspace details
 */
app.get("/api/me", verifyFirebaseToken, (req: AuthenticatedRequest, res) => {
  if (!req.workspace || !req.user) {
    return res.status(401).json({
      success: false,
      error: "No active workspace context.",
    });
  }

  return res.json({
    success: true,
    uid: req.user.uid,
    email: req.user.email,
    workspace: {
      id: req.workspace.id,
      name: req.workspace.company.name,
      role: req.workspace.role,
      plan: req.workspace.company.plan,
      monthlyLeadLimit: req.workspace.company.monthlyLeadLimit,
      status: req.workspace.company.status,
    },
  });
});

/**
 * Workspace Zoho Integration Info: GET /api/workspace/integration/zoho
 */
app.get(
  "/api/workspace/integration/zoho",
  verifyFirebaseToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const workspaceId = req.workspace!.id;
      const integration = await getWorkspaceIntegration(workspaceId, "zoho");

      return res.json({
        success: true,
        integration: integration
          ? {
              provider: integration.provider,
              status: integration.status,
              secretPrefix: integration.secretPrefix,
              createdAt: integration.createdAt,
              updatedAt: integration.updatedAt,
              lastUsedAt: integration.lastUsedAt || null,
            }
          : null,
      });
    } catch (error: any) {
      console.error("Error in GET /api/workspace/integration/zoho:", error?.message || error);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve integration settings.",
      });
    }
  }
);

/**
 * Rotate Webhook Secret: POST /api/workspace/integration/zoho/rotate
 * Generates a new random token, updates Firestore SHA-256 hash, and displays raw token once
 */
app.post(
  "/api/workspace/integration/zoho/rotate",
  secretRotationLimiter,
  verifyFirebaseToken,
  requireRole(["owner", "admin"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const workspaceId = req.workspace!.id;
      const { rawSecret, prefix } = await createOrRotateIntegrationSecret(workspaceId, "zoho");

      await logAuditTrace(
        workspaceId,
        generateRequestId(),
        "secret_rotated",
        `Webhook secret for Zoho CRM rotated by ${req.user?.email || "owner"}`,
        req.user?.uid || "user"
      );

      return res.json({
        success: true,
        secret: rawSecret,
        secretPrefix: prefix,
        message:
          "New webhook secret generated. Please copy and store it safely in your Zoho CRM Webhook configuration. It will not be shown again.",
      });
    } catch (error: any) {
      console.error("Error rotating webhook secret:", error?.message || error);
      return res.status(500).json({
        success: false,
        error: "Failed to rotate integration secret.",
      });
    }
  }
);

/**
 * GET /api/leads
 * Returns all saved leads strictly belonging to the authenticated user's workspace
 */
app.get("/api/leads", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const workspaceId = req.workspace!.id;
    const leads = await getAllLeads(workspaceId);

    return res.json({
      success: true,
      data: leads,
      total: leads.length,
      workspaceId,
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
 * Returns a single lead by ID, restricted to caller's workspace
 */
app.get("/api/leads/:id", verifyFirebaseToken, async (req: AuthenticatedRequest, res) => {
  try {
    const workspaceId = req.workspace!.id;
    const { id } = req.params;

    const lead = await getLeadById(workspaceId, id);
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
 * Removes a lead from persistent storage within caller's workspace
 */
app.delete(
  "/api/leads/:id",
  verifyFirebaseToken,
  requireRole(["owner", "admin", "manager"]),
  async (req: AuthenticatedRequest, res) => {
    try {
      const workspaceId = req.workspace!.id;
      const { id } = req.params;

      const success = await deleteLead(workspaceId, id);
      if (!success) {
        return res.status(404).json({
          success: false,
          error: `Lead with ID '${id}' was not found.`,
        });
      }

      await logAuditTrace(
        workspaceId,
        generateRequestId(),
        "lead_deleted",
        `Lead '${id}' deleted by ${req.user?.email || "user"}`,
        req.user?.uid || "user"
      );

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
  }
);

/**
 * Multi-Tenant Fast Webhook Intake Endpoint: POST /api/leads/intake
 * 
 * 1. Reads provided credential from 'x-leadpilot-secret'.
 * 2. Authenticates and resolves workspaceId from hashed integration secrets in Firestore.
 * 3. Normalizes and validates incoming payload.
 * 4. Returns HTTP 200 immediately to external CRM without blocking on Gemini.
 * 5. Dispatches task with workspace context to queue / Cloud Tasks.
 * 6. Lead is analyzed and saved strictly into that company's workspace.
 */
app.post("/api/leads/intake", webhookIntakeLimiter, async (req, res) => {
  const providedSecret = req.headers["x-leadpilot-secret"] as string;

  if (!providedSecret) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Missing 'x-leadpilot-secret' header.",
    });
  }

  // Resolve workspace from integration credential
  const resolved = await verifyAndResolveWebhookSecret(providedSecret);
  if (!resolved) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized: Invalid or revoked webhook secret.",
    });
  }

  const { workspaceId, isLegacy } = resolved;
  const requestId = generateRequestId();

  try {
    // Stage: webhook_received
    await logIntakeTrace(
      workspaceId,
      requestId,
      "webhook_received",
      `Inbound CRM webhook payload received at /api/leads/intake${isLegacy ? " (Legacy secret fallback)" : ""}`
    );

    const body = req.body;
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      await logIntakeTrace(
        workspaceId,
        requestId,
        "processing_failed",
        "Invalid payload: Expected a JSON object."
      );
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
      await logIntakeTrace(
        workspaceId,
        requestId,
        "processing_failed",
        `Validation failed: ${validation.error}`
      );
      return res.status(400).json({
        success: false,
        accepted: false,
        error: validation.error,
        request_id: requestId,
      });
    }

    // Stage: validation_passed
    await logIntakeTrace(
      workspaceId,
      requestId,
      "validation_passed",
      `Validation passed for prospect '${normalized.customer_name}' (${normalized.email})`
    );

    // 3. Dispatch to background queue with strict workspace context
    await enqueueIntakeLead(requestId, workspaceId, normalized);

    // 4. Immediately return HTTP 200 JSON to external CRM
    return res.status(200).json({
      success: true,
      accepted: true,
      message: "Lead accepted for processing",
      request_id: requestId,
    });
  } catch (error: any) {
    const safeError = error?.message
      ? String(error.message).replace(/(api[-_]?key|secret|token)=[^\s&]+/gi, "$1=REDACTED")
      : "Intake reception error";

    await logIntakeTrace(workspaceId, requestId, "processing_failed", safeError);
    return res.status(500).json({
      success: false,
      accepted: false,
      error: "Failed to ingest lead webhook.",
      request_id: requestId,
    });
  }
});

/**
 * Developer & Audit Traces: GET /api/leads/intake/logs
 * Scoped strictly to the authenticated user's workspace!
 */
app.get(
  "/api/leads/intake/logs",
  verifyFirebaseToken,
  async (req: AuthenticatedRequest, res) => {
    try {
      const workspaceId = req.workspace!.id;
      const logs = await getIntakeLogs(workspaceId, 50);

      return res.json({
        success: true,
        workspaceId,
        logs,
      });
    } catch (error: any) {
      console.error("Error in GET /api/leads/intake/logs:", error?.message || error);
      return res.status(500).json({
        success: false,
        error: "Failed to retrieve intake trace logs.",
      });
    }
  }
);

/**
 * Interactive Lead Analysis Endpoint: POST /api/leads/analyze
 * Used for testing / direct CRM analysis within the authenticated workspace
 */
app.post(
  "/api/leads/analyze",
  verifyFirebaseToken,
  async (req: AuthenticatedRequest, res) => {
    const workspaceId = req.workspace!.id;

    try {
      const body = req.body;
      if (!body || typeof body !== "object" || Array.isArray(body)) {
        return res.status(400).json({
          success: false,
          error: "Invalid request payload. Expected a JSON object.",
        });
      }

      const normalized = normalizeLeadPayload(body);
      const validation = validateNormalizedLead(normalized);
      if (!validation.valid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
        });
      }

      // Run analysis through Gemini
      const analysisData = await analyzeLeadWithGemini({
        customerName: normalized.customer_name,
        phoneNumber: normalized.phone,
        email: normalized.email,
        leadSource: normalized.lead_source,
        productInterest: normalized.product_service,
        budget: normalized.budget,
        customerMessage: normalized.message,
      });

      // Save lead scoped to caller's workspace
      const savedLead = await saveLead(workspaceId, {
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

      // Track usage
      await checkAndUpdateUsage(workspaceId, "leadsProcessed");
      await checkAndUpdateUsage(workspaceId, "aiRequests");

      return res.status(200).json({
        success: true,
        workspaceId,
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
      console.error("Error in POST /api/leads/analyze:", error?.message || error);
      return res.status(500).json({
        success: false,
        error: "Internal server error occurred while analyzing lead with Gemini AI. Please try again.",
      });
    }
  }
);

/**
 * Web Interface Endpoint: POST /api/analyze-lead
 * Evaluates lead via Gemini and saves directly to the authenticated workspace
 */
app.post(
  "/api/analyze-lead",
  verifyFirebaseToken,
  async (req: AuthenticatedRequest, res) => {
    const workspaceId = req.workspace!.id;

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

      // Save lead to workspace
      const savedLead = await saveLead(workspaceId, {
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

      // Track usage
      await checkAndUpdateUsage(workspaceId, "leadsProcessed");
      await checkAndUpdateUsage(workspaceId, "aiRequests");

      return res.json({
        success: true,
        workspaceId,
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
  }
);

/**
 * Internal Cloud Tasks Worker Endpoint: POST /api/internal/process-lead-task
 * Only accepts calls with valid internal secret or authorized Cloud Tasks header
 */
app.post("/api/internal/process-lead-task", async (req, res) => {
  const internalSecret = process.env.INTERNAL_WORKER_SECRET || "leadpilot_internal_worker_key";
  const providedSecret = req.headers["x-internal-secret"];
  const isCloudTasks = Boolean(req.headers["x-cloudtasks-queuename"]);

  if (!isCloudTasks && providedSecret !== internalSecret) {
    return res.status(401).json({
      success: false,
      error: "Unauthorized internal task execution.",
    });
  }

  try {
    const task = req.body;
    if (!task || !task.requestId || !task.workspaceId || !task.normalized) {
      return res.status(400).json({
        success: false,
        error: "Invalid task payload structure.",
      });
    }

    await executeLeadProcessing(task);
    return res.status(200).json({ success: true, message: "Task completed successfully." });
  } catch (err: any) {
    console.error("[INTERNAL_WORKER] Error processing task:", err?.message || err);
    return res.status(500).json({
      success: false,
      error: "Task processing failed.",
    });
  }
});

// Centralized error handler - ensures clean, safe error messages
app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error("Unhandled express error:", err?.message || err);
  res.status(err.status || 500).json({
    success: false,
    error: "An internal server error occurred. Please contact support.",
  });
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
    console.log(`LeadPilot Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
