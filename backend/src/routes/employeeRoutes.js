import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { logAudit } from "../services/auditService.js";
import {
  buildFingerprintPlan,
  deleteFingerprintSlot,
  listEmployeeFingerprints,
  setPreferredFingerprint
} from "../services/fingerprintService.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const { q = "", status = "", department = "" } = req.query;
  const search = `%${q.trim()}%`;
  const statusFilter = status || null;
  const departmentFilter = department || null;

  const [rows] = await pool.query(
    `SELECT
       e.id,
       e.employee_code,
       e.name,
       e.cnic,
       e.department,
       e.designation,
       e.status,
       e.profile_image,
       e.created_at,
       e.updated_at,
       (COALESCE(fp.fingerprint_count, 0) > 0 OR e.fingerprint IS NOT NULL) AS has_fingerprint,
       COALESCE(fp.fingerprint_count, CASE WHEN e.fingerprint IS NOT NULL THEN 1 ELSE 0 END) AS fingerprint_count,
       COALESCE(fp.enrolled_fingers, CASE WHEN e.fingerprint IS NOT NULL THEN 'legacy_primary' ELSE NULL END) AS enrolled_fingers,
       e.face_encoding IS NOT NULL AS has_face
     FROM employees e
     LEFT JOIN (
       SELECT
         employee_id,
         COUNT(*) AS fingerprint_count,
         GROUP_CONCAT(finger_code ORDER BY finger_code SEPARATOR ', ') AS enrolled_fingers
       FROM employee_fingerprints
       GROUP BY employee_id
     ) fp ON fp.employee_id = e.id
     WHERE (? = '%%' OR e.name LIKE ? OR e.cnic LIKE ? OR e.employee_code LIKE ?)
       AND (? IS NULL OR e.status = ?)
       AND (? IS NULL OR e.department = ?)
     ORDER BY e.id DESC`,
    [search, search, search, search, statusFilter, statusFilter, departmentFilter, departmentFilter]
  );

  res.json(rows);
});

router.get("/:id", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT
       e.id,
       e.employee_code,
       e.name,
       e.cnic,
       e.department,
       e.designation,
       e.status,
       e.profile_image,
       e.created_at,
       e.updated_at,
       (COALESCE(fp.fingerprint_count, 0) > 0 OR e.fingerprint IS NOT NULL) AS has_fingerprint,
       COALESCE(fp.fingerprint_count, CASE WHEN e.fingerprint IS NOT NULL THEN 1 ELSE 0 END) AS fingerprint_count,
       COALESCE(fp.enrolled_fingers, CASE WHEN e.fingerprint IS NOT NULL THEN 'legacy_primary' ELSE NULL END) AS enrolled_fingers,
       e.face_encoding IS NOT NULL AS has_face
     FROM employees e
     LEFT JOIN (
       SELECT
         employee_id,
         COUNT(*) AS fingerprint_count,
         GROUP_CONCAT(finger_code ORDER BY finger_code SEPARATOR ', ') AS enrolled_fingers
       FROM employee_fingerprints
       GROUP BY employee_id
     ) fp ON fp.employee_id = e.id
     WHERE e.id = ?
     LIMIT 1`,
    [req.params.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: "employee not found" });
  }

  res.json(rows[0]);
});

router.get("/:id/fingerprints", requireAuth, async (req, res) => {
  const rows = await listEmployeeFingerprints(req.params.id);
  res.json(rows);
});

router.get("/:id/fingerprint-plan", requireAuth, async (req, res) => {
  const rows = await listEmployeeFingerprints(req.params.id);
  res.json(buildFingerprintPlan(rows));
});

router.post("/:id/fingerprints/:fingerprintId/prefer", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const result = await setPreferredFingerprint({
    employeeId: Number(req.params.id),
    fingerprintId: Number(req.params.fingerprintId)
  });

  await logAudit({
    actorUserId: req.user.id,
    eventType: "fingerprint.preferred",
    targetType: "employee",
    targetId: req.params.id,
    summary: `Preferred fingerprint set to '${result.finger_code}' for employee #${req.params.id}.`,
    metadata: {
      fingerprintId: req.params.fingerprintId,
      fingerCode: result.finger_code
    }
  });

  res.json({
    status: "preferred",
    fingerprintId: Number(req.params.fingerprintId),
    fingerCode: result.finger_code
  });
});

router.delete("/:id/fingerprints/:fingerprintId", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const result = await deleteFingerprintSlot({
    employeeId: Number(req.params.id),
    fingerprintId: Number(req.params.fingerprintId)
  });

  await logAudit({
    actorUserId: req.user.id,
    eventType: "fingerprint.delete",
    targetType: "employee",
    targetId: req.params.id,
    summary: `Fingerprint slot '${result.finger_code}' deleted for employee #${req.params.id}.`,
    metadata: {
      fingerprintId: req.params.fingerprintId,
      fingerCode: result.finger_code,
      wasPreferred: Boolean(Number(result.is_preferred))
    }
  });

  res.json({
    status: "deleted",
    fingerprintId: Number(req.params.fingerprintId),
    fingerCode: result.finger_code
  });
});

router.get("/:id/attendance", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT
       id,
       date,
       check_in,
       check_out,
       check_in_method,
       check_out_method,
       check_in_device,
       check_out_device,
       verification_score
     FROM attendance
     WHERE employee_id = ?
     ORDER BY date DESC, id DESC
     LIMIT 60`,
    [req.params.id]
  );

  res.json(rows);
});

router.post("/", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const { employeeCode, name, cnic, department, designation, profileImage } = req.body;

  if (!name || !cnic) {
    return res.status(400).json({ message: "name and cnic are required" });
  }

  const [result] = await pool.query(
    `INSERT INTO employees
      (employee_code, name, cnic, department, designation, profile_image)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [employeeCode || null, name, cnic, department || null, designation || null, profileImage || null]
  );

  await logAudit({
    actorUserId: req.user.id,
    eventType: "employee.create",
    targetType: "employee",
    targetId: result.insertId,
    summary: `Employee ${name} was created.`,
    metadata: {
      employeeCode: employeeCode || null,
      cnic,
      department: department || null,
      designation: designation || null
    }
  });

  res.status(201).json({
    id: result.insertId,
    message: "employee created"
  });
});

router.put("/:id", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const { employeeCode, name, cnic, department, designation, profileImage, status } = req.body;

  if (!name || !cnic) {
    return res.status(400).json({ message: "name and cnic are required" });
  }

  await pool.query(
    `UPDATE employees
     SET employee_code = ?,
         name = ?,
         cnic = ?,
         department = ?,
         designation = ?,
         profile_image = ?,
         status = ?
     WHERE id = ?`,
    [
      employeeCode || null,
      name,
      cnic,
      department || null,
      designation || null,
      profileImage || null,
      status || "active",
      req.params.id
    ]
  );

  await logAudit({
    actorUserId: req.user.id,
    eventType: "employee.update",
    targetType: "employee",
    targetId: req.params.id,
    summary: `Employee #${req.params.id} was updated.`,
    metadata: {
      employeeCode: employeeCode || null,
      name,
      cnic,
      department: department || null,
      designation: designation || null,
      status: status || "active"
    }
  });

  res.json({ message: "employee updated" });
});

export default router;
