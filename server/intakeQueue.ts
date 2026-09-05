import { analyzeLeadWithGemini } from './geminiService.js';
import { saveLead } from './db.js';
import { NormalizedLeadInput } from './normalizer.js';

export type IntakeStage =
  | 'webhook_received'
  | 'validation_passed'
  | 'ai_processing_started'
  | 'ai_processing_completed'
  | 'lead_saved'
  | 'processing_failed';

export interface IntakeLogEntry {
  timestamp: string;
  request_id: string;
  stage: IntakeStage;
  message: string;
  metadata?: Record<string, any>;
}

// In-memory ring buffer for recent intake logs (traceable by request_id)
const MAX_LOGS = 100;
const intakeLogs: IntakeLogEntry[] = [];

export function logIntakeTrace(
  requestId: string,
  stage: IntakeStage,
  message: string,
  metadata?: Record<string, any>
): IntakeLogEntry {
  const entry: IntakeLogEntry = {
    timestamp: new Date().toISOString(),
    request_id: requestId,
    stage,
    message,
    metadata,
  };

  intakeLogs.unshift(entry);
  if (intakeLogs.length > MAX_LOGS) {
    intakeLogs.pop();
  }

  // Structured console log for container observability
  const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
  console.log(`[INTAKE] [${requestId}] [${stage}] ${message}${metaStr}`);

  return entry;
}

export function getIntakeLogs(limit = 50): IntakeLogEntry[] {
  return intakeLogs.slice(0, limit);
}

export function generateRequestId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `req_${time}_${rand}`;
}

interface IntakeTask {
  requestId: string;
  normalized: NormalizedLeadInput;
  enqueuedAt: number;
}

// Simple in-memory asynchronous queue runner
const taskQueue: IntakeTask[] = [];
let isProcessing = false;

async function processNextTask() {
  if (isProcessing || taskQueue.length === 0) {
    return;
  }

  isProcessing = true;
  const task = taskQueue.shift();

  if (!task) {
    isProcessing = false;
    return;
  }

  const { requestId, normalized } = task;

  try {
    // Stage: ai_processing_started
    logIntakeTrace(requestId, 'ai_processing_started', 'Beginning Gemini lead qualification', {
      customer_name: normalized.customer_name,
      product: normalized.product_service,
    });

    // Run Gemini analysis using shared qualification logic
    const analysisData = await analyzeLeadWithGemini({
      customerName: normalized.customer_name,
      phoneNumber: normalized.phone,
      email: normalized.email,
      leadSource: normalized.lead_source,
      productInterest: normalized.product_service,
      budget: normalized.budget,
      customerMessage: normalized.message,
    });

    // Stage: ai_processing_completed
    logIntakeTrace(
      requestId,
      'ai_processing_completed',
      `Gemini analysis complete (Score: ${analysisData.lead_score}, Classification: ${analysisData.classification})`,
      {
        score: analysisData.lead_score,
        classification: analysisData.classification,
        priority: analysisData.priority,
      }
    );

    // Save lead to persistent database
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

    // Stage: lead_saved
    logIntakeTrace(requestId, 'lead_saved', `Lead successfully stored in database with ID: ${savedLead.id}`, {
      lead_id: savedLead.id,
      customer_name: savedLead.customer_name,
      score: savedLead.lead_score,
    });
  } catch (error: any) {
    // Stage: processing_failed (sanitized: no secrets or stack traces)
    const sanitizedErrorMessage = error?.message ? String(error.message).replace(/(api[-_]?key|secret|token)=[^\s&]+/gi, '$1=REDACTED') : 'Asynchronous lead processing failed';
    logIntakeTrace(requestId, 'processing_failed', sanitizedErrorMessage);
    console.error(`[INTAKE] [${requestId}] [processing_failed] Error:`, sanitizedErrorMessage);
  } finally {
    isProcessing = false;
    // Process next item in queue if available
    if (taskQueue.length > 0) {
      setImmediate(processNextTask);
    }
  }
}

/**
 * Enqueues a normalized lead for background processing immediately
 * after the HTTP 200 response is dispatched to the external CRM webhook.
 */
export function enqueueIntakeLead(requestId: string, normalized: NormalizedLeadInput): void {
  taskQueue.push({
    requestId,
    normalized,
    enqueuedAt: Date.now(),
  });

  // Trigger processing asynchronously in next event-loop tick
  setImmediate(processNextTask);
}
