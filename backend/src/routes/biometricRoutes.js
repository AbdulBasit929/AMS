import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { markAttendance } from "../services/attendanceService.js";
import { logAudit } from "../services/auditService.js";
import { listPotentialFingerprintConflicts, upsertFingerprintTemplate } from "../services/fingerprintService.js";

const router = Router();
const bridgeBaseUrl = process.env.FINGERPRINT_BRIDGE_URL || "http://127.0.0.1:8082";
const agentBaseUrl = process.env.BIOMETRIC_AGENT_URL || "http://127.0.0.1:8091";

router.get("/fingerprint/status", async (_req, res) => {
  try {
    const response = await fetch(`${agentBaseUrl}/health`);
    const data = await response.json();
    const exactDuplicates = await listPotentialFingerprintConflicts();
    res.status(response.status).json({
      ...data,
      conflictCount: exactDuplicates.length,
      message:
        exactDuplicates.length > 0
          ? "Local biometric agent is ready, but fingerprint ownership conflicts require remediation before broad station use."
          : data.message
    });
  } catch (error) {
    res.json({
      status: "warning",
      mode: "desktop-helper",
      message: "Local biometric agent is not running yet. Start it to launch fingerprint workflows from the browser.",
      detail: error.message
    });
  }
});

router.get("/agent/status", async (_req, res) => {
  try {
    const response = await fetch(`${agentBaseUrl}/health`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({
      status: "warning",
      mode: "agent-offline",
      message: "Biometric agent is offline.",
      detail: error.message
    });
  }
});

router.get("/fingerprint/conflicts", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  try {
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : null;
    const limit = Math.min(Math.max(Number(req.query.limit) || 25, 1), 100);

    const exactDuplicates = await listPotentialFingerprintConflicts(employeeId);

    const [auditRows] = await pool.query(
      `SELECT
         id,
         event_type,
         target_id,
         summary,
         metadata,
         created_at
       FROM audit_logs
       WHERE event_type = 'fingerprint.conflict'
         AND (? IS NULL OR target_id = ?)
       ORDER BY id DESC
       LIMIT ${limit}`,
      [employeeId, employeeId === null ? null : String(employeeId)]
    );

    const recentConflicts = auditRows.map((row) => ({
      id: row.id,
      eventType: row.event_type,
      targetId: row.target_id === null ? null : Number(row.target_id),
      summary: row.summary,
      metadata: row.metadata ? JSON.parse(row.metadata) : null,
      createdAt: row.created_at
    }));

    res.json({
      status: "ok",
      exactDuplicates,
      recentConflicts
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/fingerprint/launch-enroll", async (req, res) => {
  const { employeeId, fingerCode = "right_index" } = req.body;

  if (!employeeId) {
    return res.status(400).json({ message: "employeeId is required" });
  }

  try {
    const response = await fetch(`${agentBaseUrl}/fingerprint/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        employeeId,
        fingerCode,
        backendUrl: process.env.PUBLIC_BACKEND_URL || "http://127.0.0.1:4000"
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ message: error.message });
  }
});

router.post("/fingerprint/launch-verify", async (req, res) => {
  const { employeeId = null } = req.body || {};
  try {
    if (!employeeId) {
      const exactDuplicates = await listPotentialFingerprintConflicts();
      if (exactDuplicates.length > 0) {
        return res.status(409).json({
          status: "blocked",
          message: "Global fingerprint verification is blocked until duplicate ownership conflicts are remediated.",
          conflictCount: exactDuplicates.length
        });
      }
    }

    const response = await fetch(`${agentBaseUrl}/fingerprint/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        backendUrl: process.env.PUBLIC_BACKEND_URL || "http://127.0.0.1:4000",
        employeeId
      })
    });

    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.status(503).json({ message: error.message });
  }
});

router.post("/fingerprint/report-conflict", async (req, res) => {
  const {
    employeeId = null,
    fingerCode = null,
    matchedEmployees = [],
    stage = "verification",
    summary = null
  } = req.body || {};

  await logAudit({
    actorUserId: req.user?.id || null,
    eventType: "fingerprint.conflict",
    targetType: "employee",
    targetId: employeeId,
    summary:
      summary ||
      `Fingerprint ownership conflict detected during ${stage}${employeeId ? ` for employee #${employeeId}` : ""}.`,
    metadata: {
      employeeId,
      fingerCode,
      stage,
      matchedEmployees
    }
  });

  res.json({ status: "logged" });
});

router.get("/face/status", async (_req, res) => {
  try {
    const response = await fetch(`${process.env.FACE_SERVICE_URL || "http://127.0.0.1:5000"}/health`);
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (error) {
    res.json({
      status: "warning",
      message: "Face service is not running yet. Start the Python face-service after installing its dependencies.",
      detail: error.message
    });
  }
});

router.post("/fingerprint/enroll", async (req, res) => {
  const { employeeId, cnic, fingerCode = "right_index" } = req.body;

  if (!employeeId && !cnic) {
    return res.status(400).json({ message: "employeeId or cnic is required" });
  }

  try {
    const [employees] = await pool.query(
      `SELECT id, cnic, name
       FROM employees
       WHERE id = COALESCE(?, id)
         AND cnic = COALESCE(?, cnic)
       LIMIT 1`,
      [employeeId || null, cnic || null]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: "employee not found" });
    }

    const employee = employees[0];

    const response = await fetch(`${bridgeBaseUrl}/capture-template`, {
      method: "POST",
      headers: { "Content-Type": "application/json" }
    });

    const bridgeData = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(bridgeData);
    }

    const templateBase64 = bridgeData.templateBase64 || bridgeData.TemplateBase64;
    const sampleCount = bridgeData.sampleCount ?? bridgeData.SampleCount ?? 0;

    if (!templateBase64) {
      return res.status(500).json({ message: "bridge did not return a fingerprint template" });
    }

    const templateBuffer = Buffer.from(templateBase64, "base64");
    await upsertFingerprintTemplate({
      employeeId: employee.id,
      fingerCode,
      templateFormat: "DPFP_NET",
      templateBuffer,
      source: "bridge_enroll"
    });

    res.json({
      status: "enrolled",
      employee,
      fingerCode,
      sampleCount
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/fingerprint/import-template", async (req, res) => {
  const {
    employeeId,
    cnic,
    templateBase64,
    fingerCode = "right_index",
    templateFormat = "DPFP_NET",
    qualityScore = null,
    source = "desktop_import"
  } = req.body;

  if (!templateBase64) {
    return res.status(400).json({ message: "templateBase64 is required" });
  }

  if (!employeeId && !cnic) {
    return res.status(400).json({ message: "employeeId or cnic is required" });
  }

  try {
    const [employees] = await pool.query(
      `SELECT id, cnic, name
       FROM employees
       WHERE id = COALESCE(?, id)
         AND cnic = COALESCE(?, cnic)
       LIMIT 1`,
      [employeeId || null, cnic || null]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: "employee not found" });
    }

    const employee = employees[0];
    const templateBuffer = Buffer.from(templateBase64, "base64");

    await upsertFingerprintTemplate({
      employeeId: employee.id,
      fingerCode,
      templateFormat,
      templateBuffer,
      qualityScore,
      source,
      makePreferred: req.body.makePreferred === true
    });

    await logAudit({
      eventType: "fingerprint.import",
      targetType: "employee",
      targetId: employee.id,
      summary: `Fingerprint template imported for employee #${employee.id} in slot '${fingerCode}'.`,
      metadata: {
        employeeId: employee.id,
        fingerCode,
        templateFormat,
        source
      }
    });

    res.json({
      status: "imported",
      employee,
      fingerCode
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/fingerprint/export-template", async (req, res) => {
  const { employeeId, cnic, fingerCode } = req.body;

  if (!employeeId && !cnic) {
    return res.status(400).json({ message: "employeeId or cnic is required" });
  }

  try {
    const [employees] = await pool.query(
      `SELECT id, cnic, name, fingerprint
       FROM employees
       WHERE id = COALESCE(?, id)
         AND cnic = COALESCE(?, cnic)
       LIMIT 1`,
      [employeeId || null, cnic || null]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: "employee not found" });
    }

    const employee = employees[0];

    const [fingerprints] = await pool.query(
      `SELECT finger_code, template_format, template, is_preferred
       FROM employee_fingerprints
       WHERE employee_id = ?
         AND (? IS NULL OR finger_code = ?)
       ORDER BY
         CASE WHEN ? IS NOT NULL AND finger_code = ? THEN 0 ELSE 1 END,
         is_preferred DESC,
         updated_at DESC,
         id DESC
       LIMIT 1`,
      [employee.id, fingerCode || null, fingerCode || null, fingerCode || null, fingerCode || null]
    );

    const fingerprintRecord = fingerprints[0] || null;
    const templateBuffer = fingerprintRecord?.template || employee.fingerprint;

    if (!templateBuffer) {
      return res.status(400).json({ message: "employee does not have an enrolled fingerprint yet" });
    }

    res.json({
      status: "exported",
      employee: {
        id: employee.id,
        cnic: employee.cnic,
        name: employee.name
      },
      fingerCode: fingerprintRecord?.finger_code || "legacy_primary",
      templateFormat: fingerprintRecord?.template_format || "LEGACY_IMPORTED",
      templateBase64: Buffer.from(templateBuffer).toString("base64")
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get("/fingerprint/export-templates", async (req, res) => {
  try {
    const employeeId = req.query.employeeId ? Number(req.query.employeeId) : null;
    const excludeEmployeeId = req.query.excludeEmployeeId ? Number(req.query.excludeEmployeeId) : null;
    const excludeFingerCode = req.query.excludeFingerCode ? String(req.query.excludeFingerCode) : null;
    const [fingerprints] = await pool.query(
      `SELECT
         ef.employee_id AS employeeId,
         e.cnic,
         e.name,
         ef.finger_code AS fingerCode,
         ef.template_format AS templateFormat,
         ef.is_preferred AS isPreferred,
         ef.template
       FROM employee_fingerprints ef
       INNER JOIN employees e ON e.id = ef.employee_id
       WHERE e.status = 'active'
         AND (? IS NULL OR ef.employee_id = ?)
         AND (
           ? IS NULL OR ? IS NULL OR NOT (
             ef.employee_id = ? AND ef.finger_code = ?
           )
         )
       ORDER BY e.id ASC, ef.is_preferred DESC, ef.finger_code ASC`,
      [employeeId, employeeId, excludeEmployeeId, excludeFingerCode, excludeEmployeeId, excludeFingerCode]
    );

    let candidates = fingerprints.map((fingerprint) => ({
      employeeId: fingerprint.employeeId,
      cnic: fingerprint.cnic,
      name: fingerprint.name,
      fingerCode: fingerprint.fingerCode,
      isPreferred: Boolean(Number(fingerprint.isPreferred)),
      templateFormat: fingerprint.templateFormat,
      templateBase64: Buffer.from(fingerprint.template).toString("base64")
    }));

      if (candidates.length === 0) {
        const [employees] = await pool.query(
          `SELECT id, cnic, name, fingerprint
           FROM employees
           WHERE fingerprint IS NOT NULL
             AND status = 'active'
             AND (? IS NULL OR id = ?)
             AND (
               ? IS NULL OR ? IS NULL OR NOT (
                 id = ? AND 'legacy_primary' = ?
               )
             )`,
          [employeeId, employeeId, excludeEmployeeId, excludeFingerCode, excludeEmployeeId, excludeFingerCode]
        );

      candidates = employees.map((employee) => ({
        employeeId: employee.id,
        cnic: employee.cnic,
        name: employee.name,
        fingerCode: "legacy_primary",
        templateFormat: "LEGACY_IMPORTED",
        templateBase64: Buffer.from(employee.fingerprint).toString("base64")
      }));
    }

    res.json({
      status: "exported",
      candidates
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/fingerprint/mark-attendance", async (req, res) => {
  const { employeeId, cnic, score } = req.body;

  if (!employeeId && !cnic) {
    return res.status(400).json({ message: "employeeId or cnic is required" });
  }

  try {
    const [employees] = await pool.query(
      `SELECT id, cnic, name, department, designation
       FROM employees
       WHERE id = COALESCE(?, id)
         AND cnic = COALESCE(?, cnic)
       LIMIT 1`,
      [employeeId || null, cnic || null]
    );

    if (employees.length === 0) {
      return res.status(404).json({ message: "employee not found" });
    }

    const employee = employees[0];
    const attendance = await markAttendance({
      employeeId: employee.id,
      method: "fingerprint",
      score: score ?? null,
      stationName: process.env.STATION_NAME || "Unknown Station",
      metadata: {
        cnic: employee.cnic
      }
    });

    res.json({
      status: "marked",
      employee,
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/face/enroll", async (req, res) => {
  const { employeeId, imageBase64, samples = [], profileImage = null } = req.body;

  if (!employeeId || (!imageBase64 && (!Array.isArray(samples) || samples.length === 0))) {
    return res.status(400).json({ message: "employeeId and imageBase64 or samples are required" });
  }

  try {
    const response = await fetch(`${process.env.FACE_SERVICE_URL || "http://127.0.0.1:5000"}/enroll-face`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ employeeId, imageBase64, samples })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const faceProfile = {
      version: "2.0",
      provider: "face_recognition",
      threshold: data.threshold ?? null,
      sampleCount: data.sampleCount ?? 1,
      encodings: data.faceEncodings || (data.faceEncoding ? [data.faceEncoding] : []),
      averagedEncoding: data.faceEncoding || null,
      qualitySummary: data.qualitySummary || null,
      rejectedSamples: data.rejectedSamples || [],
      enrolledAt: new Date().toISOString()
    };

    await pool.query(
      `UPDATE employees
       SET face_encoding = ?, profile_image = COALESCE(?, profile_image)
       WHERE id = ?`,
      [JSON.stringify(faceProfile), profileImage || data.profileImage || null, employeeId]
    );

    await logAudit({
      eventType: "face.enroll",
      targetType: "employee",
      targetId: employeeId,
      summary: `Face encoding enrolled for employee #${employeeId}.`,
      metadata: {
        employeeId,
        sampleCount: faceProfile.sampleCount,
        rejectedSamples: faceProfile.rejectedSamples.length,
        threshold: faceProfile.threshold
      }
    });

    res.json({
      status: "enrolled",
      employeeId,
      sampleCount: faceProfile.sampleCount,
      qualitySummary: faceProfile.qualitySummary,
      rejectedSamples: faceProfile.rejectedSamples
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/face/verify", async (req, res) => {
  const { imageBase64 } = req.body;

  if (!imageBase64) {
    return res.status(400).json({ message: "imageBase64 is required" });
  }

  try {
    const [employees] = await pool.query(
      `SELECT id, name, cnic, face_encoding
       FROM employees
       WHERE face_encoding IS NOT NULL`
    );

    if (employees.length === 0) {
      return res.status(400).json({ message: "no employees have enrolled faces yet" });
    }

    const candidates = employees.map((employee) => {
      const parsed = JSON.parse(employee.face_encoding);
      const faceProfile = Array.isArray(parsed)
        ? {
            averagedEncoding: parsed,
            encodings: [parsed],
            version: "1.0"
          }
        : parsed;

      return {
        employeeId: employee.id,
        name: employee.name,
        cnic: employee.cnic,
        faceEncoding: faceProfile?.averagedEncoding || null,
        faceEncodings: Array.isArray(faceProfile?.encodings) ? faceProfile.encodings : [],
        faceProfile
      };
    });

    const response = await fetch(`${process.env.FACE_SERVICE_URL || "http://127.0.0.1:5000"}/verify-face`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ imageBase64, candidates })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    const [rows] = await pool.query(
      `SELECT id, name, cnic, department, designation
       FROM employees
       WHERE id = ?
       LIMIT 1`,
      [data.employeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "employee not found in main backend" });
    }

    const employee = rows[0];
    const attendance = await markAttendance({
      employeeId: employee.id,
      method: "face",
      score: data.score ?? null,
      stationName: process.env.STATION_NAME || "Unknown Station",
      metadata: {
        cnic: employee.cnic
      }
    });

    res.json({
      status: "matched",
      employee,
      score: data.score ?? null,
      confidence: data.confidence ?? null,
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post("/fingerprint/identify", async (_req, res) => {
  try {
    const [fingerprints] = await pool.query(
      `SELECT
         ef.employee_id AS employeeId,
         e.name,
         e.cnic,
         ef.finger_code AS fingerCode,
         ef.template
       FROM employee_fingerprints ef
       INNER JOIN employees e ON e.id = ef.employee_id
       WHERE e.status = 'active'`
    );

    let candidates = fingerprints.map((fingerprint) => ({
      employeeId: fingerprint.employeeId,
      name: fingerprint.name,
      cnic: fingerprint.cnic,
      fingerCode: fingerprint.fingerCode,
      templateBase64: Buffer.from(fingerprint.template).toString("base64")
    }));

    if (candidates.length === 0) {
      const [employees] = await pool.query(
        `SELECT id, name, cnic, fingerprint
         FROM employees
         WHERE fingerprint IS NOT NULL
           AND status = 'active'`
      );

      candidates = employees.map((employee) => ({
        employeeId: employee.id,
        name: employee.name,
        cnic: employee.cnic,
        fingerCode: "legacy_primary",
        templateBase64: Buffer.from(employee.fingerprint).toString("base64")
      }));
    }

    if (candidates.length === 0) {
      return res.status(400).json({ message: "no employees have enrolled fingerprints yet" });
    }

    const response = await fetch(`${bridgeBaseUrl}/identify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidates })
    });

    const bridgeData = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(bridgeData);
    }

    const bridgeEmployeeId = bridgeData.employeeId ?? bridgeData.EmployeeId;
    const bridgeScore = bridgeData.score ?? bridgeData.Score ?? null;

    const [rows] = await pool.query(
      `SELECT id, name, cnic, department, designation
       FROM employees
       WHERE id = ?
       LIMIT 1`,
      [bridgeEmployeeId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "employee not found in main backend" });
    }

    const employee = rows[0];
    const attendance = await markAttendance({
      employeeId: employee.id,
      method: "fingerprint",
      score: bridgeScore,
      stationName: process.env.STATION_NAME || "Unknown Station"
    });

    res.json({
      status: "matched",
      employee,
      attendance
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
