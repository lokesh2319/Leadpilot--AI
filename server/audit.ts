import { db } from './db.js';

export type AuditStage =
  | 'webhook_received'
  | 'validation_passed'
  | 'ai_processing_started'
  | 'ai_processing_completed'
  | 'lead_saved'
  | 'processing_failed'
  | 'lead_created'
  | 'lead_deleted'
  | 'secret_rotated';

export interface AuditLogEntry {
  id: string;
  workspaceId: string;
  timestamp: string;
  request_id: string;
  stage: AuditStage;
  message: string;
  actor: 'system' | 'webhook' | 'user' | string;
  metadata?: Record<string, any>;
}

function isFirestorePermissionError(err: any): boolean {
  if (!err) return false;
  const msg = String(err.message || err);
  return (
    err.code === 7 ||
    err.code === 'PERMISSION_DENIED' ||
    msg.includes('PERMISSION_DENIED') ||
    msg.includes('Missing or insufficient permissions') ||
    msg.includes('NOT_FOUND') ||
    err.code === 5
  );
}

// In-memory cache for ultra-fast UI updates per workspace
const MAX_MEM_LOGS = 100;
const memLogsByWorkspace = new Map<string, AuditLogEntry[]>();

/**
 * Logs an audit event scoped strictly to a workspace.
 * Writes to memory buffer, structured console log (Cloud Logging), and Firestore.
 */
export async function logAuditTrace(
  workspaceId: string,
  requestId: string,
  stage: AuditStage,
  message: string,
  actor: string = 'system',
  metadata?: Record<string, any>
): Promise<AuditLogEntry> {
  // Sanitize message: redact any api keys, secrets, or tokens
  const sanitizedMessage = String(message).replace(
    /(api[-_]?key|secret|token|bearer)=[^\s&]+/gi,
    '$1=REDACTED'
  );

  const entry: AuditLogEntry = {
    id: `log_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`,
    workspaceId: workspaceId || 'default',
    timestamp: new Date().toISOString(),
    request_id: requestId,
    stage,
    message: sanitizedMessage,
    actor,
    metadata,
  };

  // 1. Update in-memory workspace cache
  const list = memLogsByWorkspace.get(entry.workspaceId) || [];
  list.unshift(entry);
  if (list.length > MAX_MEM_LOGS) {
    list.pop();
  }
  memLogsByWorkspace.set(entry.workspaceId, list);

  // 2. Structured Cloud Run logging
  const metaStr = metadata ? ` | ${JSON.stringify(metadata)}` : '';
  console.log(`[AUDIT] [ws:${entry.workspaceId}] [${requestId}] [${stage}] ${sanitizedMessage}${metaStr}`);

  // 3. Persist to Firestore: /companies/{workspaceId}/auditLogs/{logId}
  if (workspaceId && workspaceId !== 'default') {
    db.collection('companies')
      .doc(workspaceId)
      .collection('auditLogs')
      .doc(entry.id)
      .set(entry)
      .catch((err) => {
        if (!isFirestorePermissionError(err)) {
          console.error('Failed to persist audit log to Firestore:', err?.message || err);
        }
      });
  }

  return entry;
}

/**
 * Returns audit logs strictly for the given workspaceId.
 */
export async function getWorkspaceAuditLogs(
  workspaceId: string,
  limit = 50
): Promise<AuditLogEntry[]> {
  const wsId = workspaceId || 'default';

  try {
    if (wsId !== 'default') {
      const snap = await db
        .collection('companies')
        .doc(wsId)
        .collection('auditLogs')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();

      if (!snap.empty) {
        const fromDb = snap.docs.map((doc) => doc.data() as AuditLogEntry);
        memLogsByWorkspace.set(wsId, fromDb);
        return fromDb;
      }
    }
  } catch (err: any) {
    if (!isFirestorePermissionError(err)) {
      console.error('Failed to read audit logs from Firestore:', err?.message || err);
    }
  }

  const cached = memLogsByWorkspace.get(wsId) || [];
  return cached.slice(0, limit);
}
