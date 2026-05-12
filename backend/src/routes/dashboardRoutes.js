import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/overview", requireAuth, async (_req, res) => {
  const [[employeeStats]] = await pool.query(
    `SELECT
       COUNT(*) AS totalEmployees,
       SUM(e.status = 'active') AS activeEmployees,
       SUM(CASE WHEN COALESCE(fp.fingerprint_count, 0) > 0 OR e.fingerprint IS NOT NULL THEN 1 ELSE 0 END) AS fingerprintEnrolled,
       SUM(COALESCE(fp.fingerprint_count, 0)) AS fingerprintTemplates,
       SUM(e.face_encoding IS NOT NULL) AS faceEnrolled
     FROM employees e
     LEFT JOIN (
       SELECT employee_id, COUNT(*) AS fingerprint_count
       FROM employee_fingerprints
       GROUP BY employee_id
     ) fp ON fp.employee_id = e.id`
  );

  const [[todayStats]] = await pool.query(
    `SELECT
       COUNT(*) AS totalAttendanceRows,
       SUM(check_in IS NOT NULL) AS checkIns,
       SUM(check_out IS NOT NULL) AS checkOuts,
       SUM(check_out IS NULL AND check_in IS NOT NULL) AS openSessions
     FROM attendance
     WHERE date = CURDATE()`
  );

  const [recentAttendance] = await pool.query(
    `SELECT
       a.id,
       a.employee_id,
       e.name,
       e.employee_code,
       e.department,
       a.date,
       a.check_in,
       a.check_out,
       a.check_in_method,
       a.check_out_method,
       a.check_in_device,
       a.check_out_device,
       a.verification_score
     FROM attendance a
     INNER JOIN employees e ON e.id = a.employee_id
     ORDER BY a.id DESC
     LIMIT 10`
  );

  const [recentAuditLogs] = await pool.query(
    `SELECT
       a.id,
       a.event_type,
       a.target_type,
       a.target_id,
       a.summary,
       a.created_at,
       u.name AS actor_name
     FROM audit_logs a
     LEFT JOIN admin_users u ON u.id = a.actor_user_id
     ORDER BY a.id DESC
     LIMIT 8`
  );

  res.json({
    employeeStats,
    todayStats,
    recentAttendance,
    recentAuditLogs
  });
});

export default router;
