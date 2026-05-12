import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const { eventType = "", targetType = "", limit = "50" } = req.query;
  const filters = [];
  const params = [];

  if (eventType) {
    filters.push("a.event_type = ?");
    params.push(eventType);
  }

  if (targetType) {
    filters.push("a.target_type = ?");
    params.push(targetType);
  }

  const safeLimit = Math.min(Math.max(Number(limit) || 50, 1), 200);
  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.actor_user_id,
       u.name AS actor_name,
       u.email AS actor_email,
       a.event_type,
       a.target_type,
       a.target_id,
       a.summary,
       a.metadata,
       a.created_at
     FROM audit_logs a
     LEFT JOIN admin_users u ON u.id = a.actor_user_id
     ${whereClause}
     ORDER BY a.id DESC
     LIMIT ${safeLimit}`,
    params
  );

  res.json(rows);
});

export default router;
