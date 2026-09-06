import { NormalizedLeadInput } from './normalizer.js';
import { logAuditTrace, getWorkspaceAuditLogs, AuditStage, AuditLogEntry } from './audit.js';
import { dispatchLeadProcessingTask } from './cloudTasks.js';

export type IntakeStage = AuditStage;
export type IntakeLogEntry = AuditLogEntry;

export function generateRequestId(): string {
  const time = Date.now().toString(36);
  const rand = Math.random().toString(36).substring(2, 7);
  return `req_${time}_${rand}`;
}

/**
 * Logs an intake trace scoped to a specific workspace.
 */
export async function logIntakeTrace(
  workspaceId: string,
  requestId: string,
  stage: IntakeStage,
  message: string,
  metadata?: Record<string, any>
): Promise<IntakeLogEntry> {
  return logAuditTrace(workspaceId, requestId, stage, message, 'webhook', metadata);
}

/**
 * Returns intake trace logs for a specific workspace.
 */
export async function getIntakeLogs(workspaceId: string, limit = 50): Promise<IntakeLogEntry[]> {
  return getWorkspaceAuditLogs(workspaceId, limit);
}

/**
 * Enqueues a normalized lead for asynchronous background processing
 * with workspace context guaranteed.
 */
export async function enqueueIntakeLead(
  requestId: string,
  workspaceId: string,
  normalized: NormalizedLeadInput
): Promise<void> {
  await dispatchLeadProcessingTask({
    requestId,
    workspaceId,
    normalized,
    enqueuedAt: Date.now(),
  });
}
