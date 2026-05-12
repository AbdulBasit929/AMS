import pool from "../config/db.js";

export async function logAudit({
  actorUserId = null,
  eventType,
  targetType,
  targetId = null,
  summary,
  metadata = null
}) {
  if (!eventType || !targetType || !summary) {
    return;
  }

  await pool.query(
    `INSERT INTO audit_logs
      (actor_user_id, event_type, target_type, target_id, summary, metadata)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [
      actorUserId,
      eventType,
      targetType,
      targetId === null ? null : String(targetId),
      summary,
      metadata ? JSON.stringify(metadata) : null
    ]
  );
}
