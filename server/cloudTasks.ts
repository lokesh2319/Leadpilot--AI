import { CloudTasksClient } from '@google-cloud/tasks';
import { NormalizedLeadInput } from './normalizer.js';
import { logAuditTrace } from './audit.js';
import { analyzeLeadWithGemini } from './geminiService.js';
import { saveLead } from './db.js';
import { checkAndUpdateUsage } from './workspaces.js';

let tasksClient: CloudTasksClient | null = null;

export interface LeadProcessingTask {
  requestId: string;
  workspaceId: string;
  normalized: NormalizedLeadInput;
  enqueuedAt: number;
}

/**
 * Core asynchronous lead processor.
 * Used by both Cloud Tasks worker and the in-memory queue fallback.
 */
export async function executeLeadProcessing(task: LeadProcessingTask): Promise<void> {
  const { requestId, workspaceId, normalized } = task;

  try {
    // Stage: ai_processing_started
    await logAuditTrace(
      workspaceId,
      requestId,
      'ai_processing_started',
      `Beginning Gemini lead qualification for prospect '${normalized.customer_name}'`,
      'system',
      {
        customer_name: normalized.customer_name,
        product: normalized.product_service,
      }
    );

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
    await logAuditTrace(
      workspaceId,
      requestId,
      'ai_processing_completed',
      `Gemini analysis complete (Score: ${analysisData.lead_score}, Classification: ${analysisData.classification})`,
      'system',
      {
        score: analysisData.lead_score,
        classification: analysisData.classification,
        priority: analysisData.priority,
      }
    );

    // Save lead scoped to the specific workspace in Firestore
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

    // Track workspace monthly usage
    await checkAndUpdateUsage(workspaceId, 'leadsProcessed');
    await checkAndUpdateUsage(workspaceId, 'aiRequests');

    // Stage: lead_saved
    await logAuditTrace(
      workspaceId,
      requestId,
      'lead_saved',
      `Lead successfully stored in workspace '${workspaceId}' with ID: ${savedLead.id}`,
      'system',
      {
        lead_id: savedLead.id,
        customer_name: savedLead.customer_name,
        score: savedLead.lead_score,
      }
    );
  } catch (error: any) {
    const sanitizedError = error?.message
      ? String(error.message).replace(/(api[-_]?key|secret|token)=[^\s&]+/gi, '$1=REDACTED')
      : 'Asynchronous lead processing failed';

    await logAuditTrace(workspaceId, requestId, 'processing_failed', sanitizedError, 'system');
    console.error(`[PROCESSOR] [${requestId}] [processing_failed] Error:`, sanitizedError);
    throw error;
  }
}

/**
 * Enqueues lead processing to Cloud Tasks if configured,
 * or gracefully dispatches to the resilient in-memory runner.
 */
export async function dispatchLeadProcessingTask(task: LeadProcessingTask): Promise<void> {
  const queuePath = process.env.CLOUD_TASKS_QUEUE; // e.g., projects/webhook-507618/locations/asia-southeast1/queues/leadpilot-intake
  const serviceUrl = process.env.SERVICE_URL; // e.g., https://leadpilot-ai-xxx.run.app
  const enableCloudTasks = process.env.ENABLE_CLOUD_TASKS === 'true';

  if (enableCloudTasks && queuePath && serviceUrl) {
    try {
      if (!tasksClient) {
        tasksClient = new CloudTasksClient();
      }

      const internalSecret = process.env.INTERNAL_WORKER_SECRET || 'leadpilot_internal_worker_key';
      const url = `${serviceUrl.replace(/\/$/, '')}/api/internal/process-lead-task`;

      await tasksClient.createTask({
        parent: queuePath,
        task: {
          httpRequest: {
            httpMethod: 'POST',
            url,
            headers: {
              'Content-Type': 'application/json',
              'x-internal-secret': internalSecret,
            },
            body: Buffer.from(JSON.stringify(task)).toString('base64'),
          },
        },
      });

      console.log(`[CLOUD_TASKS] Task ${task.requestId} enqueued to Cloud Tasks queue: ${queuePath}`);
      return;
    } catch (err: any) {
      console.warn(
        `[CLOUD_TASKS] Failed to enqueue to Cloud Tasks (${err?.message || err}). Falling back to in-memory queue.`
      );
    }
  }

  // Resilient in-memory fallback
  setImmediate(() => {
    executeLeadProcessing(task).catch((err) => {
      console.error('[IN_MEMORY_QUEUE] Unhandled execution error:', err?.message || err);
    });
  });
}
