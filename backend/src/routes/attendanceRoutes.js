import { Router } from "express";
import pool from "../config/db.js";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { markAttendance } from "../services/attendanceService.js";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const {
    dateFrom,
    dateTo,
    employeeId,
    method,
    status
  } = req.query;

  const filters = [];
  const params = [];

  if (dateFrom) {
    filters.push("a.date >= ?");
    params.push(dateFrom);
  }

  if (dateTo) {
    filters.push("a.date <= ?");
    params.push(dateTo);
  }

  if (employeeId) {
    filters.push("a.employee_id = ?");
    params.push(employeeId);
  }

  if (method) {
    filters.push("(a.check_in_method = ? OR a.check_out_method = ?)");
    params.push(method, method);
  }

  if (status === "open") {
    filters.push("a.check_in IS NOT NULL AND a.check_out IS NULL");
  } else if (status === "closed") {
    filters.push("a.check_in IS NOT NULL AND a.check_out IS NOT NULL");
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT
       a.id,
       a.employee_id,
       e.employee_code,
       e.name,
       e.department,
       e.designation,
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
     ${whereClause}
     ORDER BY a.date DESC, a.id DESC`,
    params
  );

  res.json(rows);
});

router.get("/export.csv", requireAuth, async (req, res) => {
  const {
    dateFrom,
    dateTo,
    employeeId,
    method,
    status
  } = req.query;

  const filters = [];
  const params = [];

  if (dateFrom) {
    filters.push("a.date >= ?");
    params.push(dateFrom);
  }

  if (dateTo) {
    filters.push("a.date <= ?");
    params.push(dateTo);
  }

  if (employeeId) {
    filters.push("a.employee_id = ?");
    params.push(employeeId);
  }

  if (method) {
    filters.push("(a.check_in_method = ? OR a.check_out_method = ?)");
    params.push(method, method);
  }

  if (status === "open") {
    filters.push("a.check_in IS NOT NULL AND a.check_out IS NULL");
  } else if (status === "closed") {
    filters.push("a.check_in IS NOT NULL AND a.check_out IS NOT NULL");
  }

  const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";

  const [rows] = await pool.query(
    `SELECT
       a.id,
       e.employee_code,
       e.name,
       e.cnic,
       e.department,
       e.designation,
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
     ${whereClause}
     ORDER BY a.date DESC, a.id DESC`,
    params
  );

  const headers = [
    "Attendance ID",
    "Employee Code",
    "Employee Name",
    "CNIC",
    "Department",
    "Designation",
    "Date",
    "Check In",
    "Check Out",
    "Check In Method",
    "Check Out Method",
    "Check In Device",
    "Check Out Device",
    "Verification Score"
  ];

  const csvRows = [
    headers.join(","),
    ...rows.map((row) => ([
      row.id,
      row.employee_code || "",
      row.name || "",
      row.cnic || "",
      row.department || "",
      row.designation || "",
      row.date || "",
      row.check_in || "",
      row.check_out || "",
      row.check_in_method || "",
      row.check_out_method || "",
      row.check_in_device || "",
      row.check_out_device || "",
      row.verification_score ?? ""
    ].map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")))
  ];

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="attendance-report-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csvRows.join("\n"));
});

router.post("/manual-mark", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const { employeeId } = req.body;

  if (!employeeId) {
    return res.status(400).json({ message: "employeeId is required" });
  }

  const attendance = await markAttendance({
    employeeId,
    method: "manual",
    stationName: process.env.STATION_NAME || "Manual Desk",
    actorUserId: req.user.id,
    metadata: {
      initiatedByRole: req.user.role
    }
  });

  res.json({
    status: "marked",
    attendance
  });
});

export default router;
