import { db } from "@/db";
import { auditLogs } from "@/db/schema";
import { newId } from "./ids";

export type AuditEvent = {
  actorId?: string | null;
  actorRole?: string | null;
  tenantId?: string | null;
  action: string;
  targetType?: string | null;
  targetId?: string | null;
  metadata?: Record<string, unknown>;
  ip?: string | null;
};

/**
 * Append-only audit trail. Never pass secrets, passwords, tokens or document
 * contents in `metadata` — store identifiers only.
 */
export async function audit(event: AuditEvent): Promise<void> {
  try {
    await db.insert(auditLogs).values({
      id: newId("aud"),
      actorId: event.actorId ?? null,
      actorRole: event.actorRole ?? null,
      tenantId: event.tenantId ?? null,
      action: event.action,
      targetType: event.targetType ?? null,
      targetId: event.targetId ?? null,
      metadataJson: JSON.stringify(event.metadata ?? {}),
      ip: event.ip ?? null,
    });
  } catch (err) {
    // Auditing must never break the user-facing operation, but it must be loud.
    console.error("[audit] failed to write event", event.action, err);
  }
}
