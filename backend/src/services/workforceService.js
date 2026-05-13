import pool from "../config/db.js";

function toDateKey(value = new Date()) {
  if (typeof value === "string") {
    return value.slice(0, 10);
  }

  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(dateKey, amount) {
  const date = new Date(`${dateKey}T00:00:00`);
  date.setDate(date.getDate() + amount);
  return toDateKey(date);
}

function toDateTime(dateKey, timeValue = "00:00:00") {
  return new Date(`${dateKey}T${timeValue}`);
}

function diffMinutes(later, earlier) {
  return Math.max(0, Math.round((later.getTime() - earlier.getTime()) / 60000));
}

function safeJsonParse(value, fallback = null) {
  if (!value) {
    return fallback;
  }

  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

function normalizeAllowedMethods(policy) {
  const parsed = safeJsonParse(policy?.allowed_methods_json, null);
  if (Array.isArray(parsed) && parsed.length > 0) {
    return parsed;
  }

  return ["fingerprint", "face", "manual"];
}

function buildShiftWindow(shift, dateKey) {
  if (!shift) {
    return null;
  }

  const scheduledStart = toDateTime(dateKey, shift.start_time || "09:00:00");
  let scheduledEnd = toDateTime(dateKey, shift.end_time || "17:00:00");
  const crossesMidnight =
    Number(shift.cross_midnight) === 1 ||
    scheduledEnd.getTime() <= scheduledStart.getTime();

  if (crossesMidnight) {
    scheduledEnd = new Date(scheduledEnd.getTime() + 24 * 60 * 60 * 1000);
  }

  const checkInWindowBefore = Number(shift.check_in_window_before_minutes ?? 120);
  const checkOutWindowAfter = Number(shift.check_out_window_after_minutes ?? 240);

  return {
    shiftId: shift.id,
    shiftCode: shift.shift_code,
    shiftName: shift.name,
    scheduledStart,
    scheduledEnd,
    graceMinutes: Number(shift.grace_minutes ?? 0),
    overtimeAfterMinutes: Number(shift.overtime_after_minutes ?? 0),
    minFullDayMinutes: Number(shift.min_full_day_minutes ?? 480),
    minHalfDayMinutes: Number(shift.min_half_day_minutes ?? 240),
    checkInWindowStart: new Date(scheduledStart.getTime() - checkInWindowBefore * 60000),
    checkOutWindowEnd: new Date(scheduledEnd.getTime() + checkOutWindowAfter * 60000),
    autoCloseHours: Number(shift.auto_close_hours ?? 18),
    crossesMidnight
  };
}

async function getDefaultShift(connection) {
  const [rows] = await connection.query(
    `SELECT *
     FROM attendance_shifts
     WHERE is_active = 1
     ORDER BY is_default DESC, id ASC
     LIMIT 1`
  );

  return rows[0] || null;
}

async function getDefaultPolicy(connection) {
  const [rows] = await connection.query(
    `SELECT *
     FROM attendance_policies
     ORDER BY is_default DESC, id ASC
     LIMIT 1`
  );

  return rows[0] || null;
}

async function getDevicePolicy(connection, stationName) {
  const [exactMatch] = await connection.query(
    `SELECT *
     FROM attendance_device_policies
     WHERE status = 'active'
       AND station_name = ?
     ORDER BY id ASC
     LIMIT 1`,
    [stationName]
  );

  if (exactMatch[0]) {
    return exactMatch[0];
  }

  const [fallback] = await connection.query(
    `SELECT *
     FROM attendance_device_policies
     WHERE status = 'active'
     ORDER BY is_default DESC, id ASC
     LIMIT 1`
  );

  return fallback[0] || null;
}

async function getShiftForDate(connection, employeeId, dateKey, defaultShiftId = null) {
  const [rows] = await connection.query(
    `SELECT
       sa.id AS assignment_id,
       sa.effective_from,
       sa.effective_to,
       s.*
     FROM employee_shift_assignments sa
     INNER JOIN attendance_shifts s ON s.id = sa.shift_id
     WHERE sa.employee_id = ?
       AND sa.effective_from <= ?
       AND (sa.effective_to IS NULL OR sa.effective_to >= ?)
       AND s.is_active = 1
     ORDER BY sa.effective_from DESC, sa.id DESC
     LIMIT 1`,
    [employeeId, dateKey, dateKey]
  );

  if (rows[0]) {
    return rows[0];
  }

  if (defaultShiftId) {
    const [fallbackRows] = await connection.query(
      `SELECT *
       FROM attendance_shifts
       WHERE id = ?
         AND is_active = 1
       LIMIT 1`,
      [defaultShiftId]
    );

    if (fallbackRows[0]) {
      return fallbackRows[0];
    }
  }

  return getDefaultShift(connection);
}

async function getHolidayForDate(connection, employee, dateKey) {
  const [rows] = await connection.query(
    `SELECT *
     FROM holiday_calendar
     WHERE holiday_date = ?
       AND (applies_to_department IS NULL OR applies_to_department = ?)
     ORDER BY id ASC
     LIMIT 1`,
    [dateKey, employee.department || null]
  );

  return rows[0] || null;
}

async function getApprovedLeaveForDate(connection, employeeId, dateKey) {
  const [rows] = await connection.query(
    `SELECT *
     FROM leave_requests
     WHERE employee_id = ?
       AND status = 'approved'
       AND start_date <= ?
       AND end_date >= ?
     ORDER BY id DESC
     LIMIT 1`,
    [employeeId, dateKey, dateKey]
  );

  return rows[0] || null;
}

function determineStatus({ holiday, leaveRequest, lateMinutes, workMinutes, shiftWindow }) {
  if (holiday) {
    return workMinutes > 0 ? "holiday_present" : "holiday";
  }

  if (leaveRequest) {
    return workMinutes > 0 ? "leave_override" : "on_leave";
  }

  if (workMinutes > 0 && shiftWindow) {
    if (workMinutes < shiftWindow.minHalfDayMinutes) {
      return "pending_review";
    }

    if (workMinutes < shiftWindow.minFullDayMinutes) {
      return "half_day";
    }
  }

  if (lateMinutes > 0) {
    return "late";
  }

  return "present";
}

export function evaluateAttendanceRecord({
  shiftWindow,
  attendanceDate,
  checkIn,
  checkOut,
  holiday = null,
  leaveRequest = null,
  allowOvertime = true
}) {
  const parsedCheckIn = checkIn ? new Date(checkIn) : null;
  const parsedCheckOut = checkOut ? new Date(checkOut) : null;
  const lateMinutes =
    parsedCheckIn && shiftWindow
      ? Math.max(0, diffMinutes(parsedCheckIn, new Date(shiftWindow.scheduledStart.getTime() + shiftWindow.graceMinutes * 60000)))
      : 0;
  const workMinutes =
    parsedCheckIn && parsedCheckOut
      ? Math.max(0, diffMinutes(parsedCheckOut, parsedCheckIn))
      : 0;
  const overtimeThreshold =
    shiftWindow && allowOvertime
      ? new Date(shiftWindow.scheduledEnd.getTime() + shiftWindow.overtimeAfterMinutes * 60000)
      : null;
  const overtimeMinutes =
    parsedCheckOut && overtimeThreshold
      ? Math.max(0, diffMinutes(parsedCheckOut, overtimeThreshold))
      : 0;

  const status = determineStatus({
    holiday,
    leaveRequest,
    lateMinutes,
    workMinutes,
    shiftWindow
  });

  let requiresApproval = 0;
  let reviewReason = null;

  if (status === "pending_review") {
    requiresApproval = 1;
    reviewReason = "Worked less than the minimum half-day threshold or a missed punch requires supervisor review.";
  } else if (!parsedCheckOut && !holiday && !leaveRequest) {
    reviewReason = "Open session";
  }

  return {
    attendanceDate,
    scheduledStart: shiftWindow?.scheduledStart || null,
    scheduledEnd: shiftWindow?.scheduledEnd || null,
    graceMinutes: shiftWindow?.graceMinutes ?? 0,
    lateMinutes,
    workMinutes,
    overtimeMinutes,
    status,
    requiresApproval,
    reviewReason
  };
}

export async function resolveAttendanceContext(connection, { employeeId, method, stationName, at = new Date() }) {
  const [[employee]] = await connection.query(
    `SELECT id, employee_code, name, cnic, department, designation, status
     FROM employees
     WHERE id = ?
     LIMIT 1
     FOR UPDATE`,
    [employeeId]
  );

  if (!employee) {
    throw new Error("employee not found");
  }

  if (employee.status !== "active") {
    throw new Error("inactive employees cannot mark attendance");
  }

  const policy = await getDefaultPolicy(connection);
  const devicePolicy = await getDevicePolicy(connection, stationName);
  const allowedMethods = normalizeAllowedMethods(devicePolicy);

  if (!allowedMethods.includes(method)) {
    throw new Error(`method '${method}' is not allowed for station '${stationName}'`);
  }

  const todayKey = toDateKey(at);
  const yesterdayKey = addDays(todayKey, -1);
  const dateCandidates = [todayKey, yesterdayKey];
  let chosenDate = todayKey;
  let chosenShift = null;
  let chosenWindow = null;

  for (const dateKey of dateCandidates) {
    const shift = await getShiftForDate(connection, employee.id, dateKey, policy?.default_shift_id || null);
    if (!shift) {
      continue;
    }

    const window = buildShiftWindow(shift, dateKey);
    if (!window) {
      continue;
    }

    if (at >= window.checkInWindowStart && at <= window.checkOutWindowEnd) {
      chosenDate = dateKey;
      chosenShift = shift;
      chosenWindow = window;
      break;
    }

    if (!chosenShift) {
      chosenShift = shift;
      chosenWindow = window;
    }
  }

  const holiday = await getHolidayForDate(connection, employee, chosenDate);
  const leaveRequest = await getApprovedLeaveForDate(connection, employee.id, chosenDate);

  return {
    employee,
    policy,
    devicePolicy,
    allowedMethods,
    attendanceDate: chosenDate,
    shift: chosenShift,
    shiftWindow: chosenWindow,
    holiday,
    leaveRequest
  };
}

export async function insertAttendanceEvent(connection, {
  employeeId,
  attendanceId = null,
  eventTime,
  eventType,
  method,
  deviceName = null,
  stationName = null,
  verificationScore = null,
  metadata = null
}) {
  await connection.query(
    `INSERT INTO attendance_events
      (employee_id, attendance_id, event_time, event_date, event_type, method, device_name, station_name, verification_score, metadata)
     VALUES (?, ?, ?, DATE(?), ?, ?, ?, ?, ?, ?)`,
    [
      employeeId,
      attendanceId,
      eventTime,
      eventTime,
      eventType,
      method,
      deviceName,
      stationName,
      verificationScore,
      metadata ? JSON.stringify(metadata) : null
    ]
  );
}

export async function listShifts() {
  const [rows] = await pool.query(
    `SELECT *
     FROM attendance_shifts
     ORDER BY is_default DESC, name ASC`
  );

  return rows;
}

export async function saveShift(input) {
  const payload = {
    shiftCode: input.shiftCode || input.shift_code || null,
    name: input.name,
    startTime: input.startTime || input.start_time || "09:00:00",
    endTime: input.endTime || input.end_time || "17:00:00",
    graceMinutes: Number(input.graceMinutes ?? input.grace_minutes ?? 15),
    checkInWindowBeforeMinutes: Number(input.checkInWindowBeforeMinutes ?? input.check_in_window_before_minutes ?? 120),
    checkOutWindowAfterMinutes: Number(input.checkOutWindowAfterMinutes ?? input.check_out_window_after_minutes ?? 240),
    overtimeAfterMinutes: Number(input.overtimeAfterMinutes ?? input.overtime_after_minutes ?? 0),
    minFullDayMinutes: Number(input.minFullDayMinutes ?? input.min_full_day_minutes ?? 480),
    minHalfDayMinutes: Number(input.minHalfDayMinutes ?? input.min_half_day_minutes ?? 240),
    crossMidnight: Number(input.crossMidnight ?? input.cross_midnight ?? 0) ? 1 : 0,
    autoCloseHours: Number(input.autoCloseHours ?? input.auto_close_hours ?? 18),
    isActive: Number(input.isActive ?? input.is_active ?? 1) ? 1 : 0,
    isDefault: Number(input.isDefault ?? input.is_default ?? 0) ? 1 : 0
  };

  if (!payload.name) {
    throw new Error("shift name is required");
  }

  if (input.id) {
    await pool.query(
      `UPDATE attendance_shifts
       SET shift_code = ?,
           name = ?,
           start_time = ?,
           end_time = ?,
           grace_minutes = ?,
           check_in_window_before_minutes = ?,
           check_out_window_after_minutes = ?,
           overtime_after_minutes = ?,
           min_full_day_minutes = ?,
           min_half_day_minutes = ?,
           cross_midnight = ?,
           auto_close_hours = ?,
           is_active = ?,
           is_default = ?
       WHERE id = ?`,
      [
        payload.shiftCode,
        payload.name,
        payload.startTime,
        payload.endTime,
        payload.graceMinutes,
        payload.checkInWindowBeforeMinutes,
        payload.checkOutWindowAfterMinutes,
        payload.overtimeAfterMinutes,
        payload.minFullDayMinutes,
        payload.minHalfDayMinutes,
        payload.crossMidnight,
        payload.autoCloseHours,
        payload.isActive,
        payload.isDefault,
        input.id
      ]
    );

    if (payload.isDefault) {
      await pool.query(
        `UPDATE attendance_shifts
         SET is_default = CASE WHEN id = ? THEN 1 ELSE 0 END`,
        [input.id]
      );
    }

    return { id: Number(input.id), ...payload };
  }

  const [result] = await pool.query(
    `INSERT INTO attendance_shifts
      (shift_code, name, start_time, end_time, grace_minutes, check_in_window_before_minutes, check_out_window_after_minutes, overtime_after_minutes, min_full_day_minutes, min_half_day_minutes, cross_midnight, auto_close_hours, is_active, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.shiftCode,
      payload.name,
      payload.startTime,
      payload.endTime,
      payload.graceMinutes,
      payload.checkInWindowBeforeMinutes,
      payload.checkOutWindowAfterMinutes,
      payload.overtimeAfterMinutes,
      payload.minFullDayMinutes,
      payload.minHalfDayMinutes,
      payload.crossMidnight,
      payload.autoCloseHours,
      payload.isActive,
      payload.isDefault
    ]
  );

  if (payload.isDefault) {
    await pool.query(
      `UPDATE attendance_shifts
       SET is_default = CASE WHEN id = ? THEN 1 ELSE 0 END`,
      [result.insertId]
    );
  }

  return { id: result.insertId, ...payload };
}

export async function listDevicePolicies() {
  const [rows] = await pool.query(
    `SELECT *
     FROM attendance_device_policies
     ORDER BY is_default DESC, device_name ASC, id ASC`
  );

  return rows.map((row) => ({
    ...row,
    allowedMethods: normalizeAllowedMethods(row)
  }));
}

export async function saveDevicePolicy(input) {
  const allowedMethods = Array.isArray(input.allowedMethods)
    ? input.allowedMethods
    : normalizeAllowedMethods(input);

  const payload = {
    deviceCode: input.deviceCode || input.device_code || null,
    deviceName: input.deviceName || input.device_name || input.stationName || input.station_name || "Attendance Device",
    stationName: input.stationName || input.station_name || input.deviceName || input.device_name || "Unknown Station",
    locationLabel: input.locationLabel || input.location_label || null,
    verificationMode: input.verificationMode || input.verification_mode || "single",
    enforceLiveness: Number(input.enforceLiveness ?? input.enforce_liveness ?? 0) ? 1 : 0,
    enforceShiftAssignment: Number(input.enforceShiftAssignment ?? input.enforce_shift_assignment ?? 0) ? 1 : 0,
    status: input.status || "active",
    isDefault: Number(input.isDefault ?? input.is_default ?? 0) ? 1 : 0,
    allowedMethodsJson: JSON.stringify(allowedMethods)
  };

  if (!payload.stationName) {
    throw new Error("stationName is required");
  }

  if (input.id) {
    await pool.query(
      `UPDATE attendance_device_policies
       SET device_code = ?,
           device_name = ?,
           station_name = ?,
           location_label = ?,
           allowed_methods_json = ?,
           verification_mode = ?,
           enforce_liveness = ?,
           enforce_shift_assignment = ?,
           status = ?,
           is_default = ?
       WHERE id = ?`,
      [
        payload.deviceCode,
        payload.deviceName,
        payload.stationName,
        payload.locationLabel,
        payload.allowedMethodsJson,
        payload.verificationMode,
        payload.enforceLiveness,
        payload.enforceShiftAssignment,
        payload.status,
        payload.isDefault,
        input.id
      ]
    );

    if (payload.isDefault) {
      await pool.query(
        `UPDATE attendance_device_policies
         SET is_default = CASE WHEN id = ? THEN 1 ELSE 0 END`,
        [input.id]
      );
    }

    return { id: Number(input.id), ...payload, allowedMethods };
  }

  const [result] = await pool.query(
    `INSERT INTO attendance_device_policies
      (device_code, device_name, station_name, location_label, allowed_methods_json, verification_mode, enforce_liveness, enforce_shift_assignment, status, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.deviceCode,
      payload.deviceName,
      payload.stationName,
      payload.locationLabel,
      payload.allowedMethodsJson,
      payload.verificationMode,
      payload.enforceLiveness,
      payload.enforceShiftAssignment,
      payload.status,
      payload.isDefault
    ]
  );

  if (payload.isDefault) {
    await pool.query(
      `UPDATE attendance_device_policies
       SET is_default = CASE WHEN id = ? THEN 1 ELSE 0 END`,
      [result.insertId]
    );
  }

  return { id: result.insertId, ...payload, allowedMethods };
}

export async function listShiftAssignments(employeeId = null) {
  const [rows] = await pool.query(
    `SELECT
       sa.id,
       sa.employee_id,
       sa.shift_id,
       sa.effective_from,
       sa.effective_to,
       e.name AS employee_name,
       e.employee_code,
       s.name AS shift_name,
       s.shift_code
     FROM employee_shift_assignments sa
     INNER JOIN employees e ON e.id = sa.employee_id
     INNER JOIN attendance_shifts s ON s.id = sa.shift_id
     WHERE (? IS NULL OR sa.employee_id = ?)
     ORDER BY sa.effective_from DESC, sa.id DESC`,
    [employeeId, employeeId]
  );

  return rows;
}

export async function saveShiftAssignment(input) {
  const employeeId = Number(input.employeeId || input.employee_id);
  const shiftId = Number(input.shiftId || input.shift_id);
  const effectiveFrom = input.effectiveFrom || input.effective_from;
  const effectiveTo = input.effectiveTo || input.effective_to || null;

  if (!employeeId || !shiftId || !effectiveFrom) {
    throw new Error("employeeId, shiftId, and effectiveFrom are required");
  }

  const [result] = await pool.query(
    `INSERT INTO employee_shift_assignments
      (employee_id, shift_id, effective_from, effective_to)
     VALUES (?, ?, ?, ?)`,
    [employeeId, shiftId, effectiveFrom, effectiveTo]
  );

  return {
    id: result.insertId,
    employeeId,
    shiftId,
    effectiveFrom,
    effectiveTo
  };
}

export async function deleteShiftAssignment(id) {
  await pool.query(
    `DELETE FROM employee_shift_assignments
     WHERE id = ?`,
    [id]
  );
}

export async function listHolidays({ from = null, to = null } = {}) {
  const [rows] = await pool.query(
    `SELECT *
     FROM holiday_calendar
     WHERE (? IS NULL OR holiday_date >= ?)
       AND (? IS NULL OR holiday_date <= ?)
     ORDER BY holiday_date ASC, id ASC`,
    [from, from, to, to]
  );

  return rows;
}

export async function saveHoliday(input) {
  const payload = {
    holidayDate: input.holidayDate || input.holiday_date,
    name: input.name,
    holidayType: input.holidayType || input.holiday_type || "company",
    isPaid: Number(input.isPaid ?? input.is_paid ?? 1) ? 1 : 0,
    appliesToDepartment: input.appliesToDepartment || input.applies_to_department || null
  };

  if (!payload.holidayDate || !payload.name) {
    throw new Error("holidayDate and name are required");
  }

  if (input.id) {
    await pool.query(
      `UPDATE holiday_calendar
       SET holiday_date = ?,
           name = ?,
           holiday_type = ?,
           is_paid = ?,
           applies_to_department = ?
       WHERE id = ?`,
      [
        payload.holidayDate,
        payload.name,
        payload.holidayType,
        payload.isPaid,
        payload.appliesToDepartment,
        input.id
      ]
    );

    return { id: Number(input.id), ...payload };
  }

  const [result] = await pool.query(
    `INSERT INTO holiday_calendar
      (holiday_date, name, holiday_type, is_paid, applies_to_department)
     VALUES (?, ?, ?, ?, ?)`,
    [
      payload.holidayDate,
      payload.name,
      payload.holidayType,
      payload.isPaid,
      payload.appliesToDepartment
    ]
  );

  return { id: result.insertId, ...payload };
}

export async function deleteHoliday(id) {
  await pool.query(
    `DELETE FROM holiday_calendar
     WHERE id = ?`,
    [id]
  );
}

export async function listLeaveRequests({ status = null, employeeId = null } = {}) {
  const [rows] = await pool.query(
    `SELECT
       lr.*,
       e.name AS employee_name,
       e.employee_code,
       req.name AS requested_by_name,
       appr.name AS approved_by_name
     FROM leave_requests lr
     INNER JOIN employees e ON e.id = lr.employee_id
     LEFT JOIN admin_users req ON req.id = lr.requested_by_user_id
     LEFT JOIN admin_users appr ON appr.id = lr.approved_by_user_id
     WHERE (? IS NULL OR lr.status = ?)
       AND (? IS NULL OR lr.employee_id = ?)
     ORDER BY lr.start_date DESC, lr.id DESC`,
    [status, status, employeeId, employeeId]
  );

  return rows;
}

export async function createLeaveRequest(input, actorUserId = null) {
  const payload = {
    employeeId: Number(input.employeeId || input.employee_id),
    leaveType: input.leaveType || input.leave_type || "annual",
    startDate: input.startDate || input.start_date,
    endDate: input.endDate || input.end_date,
    partialDay: input.partialDay || input.partial_day || "none",
    reason: input.reason || null,
    status: input.status || "pending"
  };

  if (!payload.employeeId || !payload.startDate || !payload.endDate) {
    throw new Error("employeeId, startDate, and endDate are required");
  }

  const [result] = await pool.query(
    `INSERT INTO leave_requests
      (employee_id, leave_type, start_date, end_date, partial_day, reason, status, requested_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.employeeId,
      payload.leaveType,
      payload.startDate,
      payload.endDate,
      payload.partialDay,
      payload.reason,
      payload.status,
      actorUserId
    ]
  );

  return { id: result.insertId, ...payload };
}

export async function decideLeaveRequest(id, decision, actorUserId = null, notes = null) {
  const normalizedDecision = decision === "approved" ? "approved" : "rejected";

  await pool.query(
    `UPDATE leave_requests
     SET status = ?,
         approved_by_user_id = ?,
         approved_at = NOW(),
         decision_notes = ?
     WHERE id = ?`,
    [normalizedDecision, actorUserId, notes, id]
  );

  return { id: Number(id), status: normalizedDecision };
}

export async function listApprovalRequests({ status = null, employeeId = null } = {}) {
  const [rows] = await pool.query(
    `SELECT
       ar.*,
       e.name AS employee_name,
       e.employee_code,
       req.name AS requested_by_name,
       appr.name AS approved_by_name
     FROM attendance_approval_requests ar
     INNER JOIN employees e ON e.id = ar.employee_id
     LEFT JOIN admin_users req ON req.id = ar.requested_by_user_id
     LEFT JOIN admin_users appr ON appr.id = ar.approved_by_user_id
     WHERE (? IS NULL OR ar.status = ?)
       AND (? IS NULL OR ar.employee_id = ?)
     ORDER BY ar.created_at DESC, ar.id DESC`,
    [status, status, employeeId, employeeId]
  );

  return rows;
}

export async function createApprovalRequest(input, actorUserId = null) {
  const payload = {
    employeeId: Number(input.employeeId || input.employee_id),
    attendanceId: input.attendanceId || input.attendance_id || null,
    requestType: input.requestType || input.request_type || "manual_regularization",
    requestedCheckIn: input.requestedCheckIn || input.requested_check_in || null,
    requestedCheckOut: input.requestedCheckOut || input.requested_check_out || null,
    requestedStatus: input.requestedStatus || input.requested_status || null,
    reason: input.reason || null
  };

  if (!payload.employeeId || !payload.requestType || !payload.reason) {
    throw new Error("employeeId, requestType, and reason are required");
  }

  const [result] = await pool.query(
    `INSERT INTO attendance_approval_requests
      (employee_id, attendance_id, request_type, requested_check_in, requested_check_out, requested_status, reason, requested_by_user_id)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.employeeId,
      payload.attendanceId,
      payload.requestType,
      payload.requestedCheckIn,
      payload.requestedCheckOut,
      payload.requestedStatus,
      payload.reason,
      actorUserId
    ]
  );

  return { id: result.insertId, ...payload };
}

export async function decideApprovalRequest(id, decision, actorUserId = null, notes = null) {
  const normalizedDecision = decision === "approved" ? "approved" : "rejected";
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[request]] = await connection.query(
      `SELECT *
       FROM attendance_approval_requests
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [id]
    );

    if (!request) {
      throw new Error("approval request not found");
    }

    await connection.query(
      `UPDATE attendance_approval_requests
       SET status = ?,
           approved_by_user_id = ?,
           approved_at = NOW(),
           approval_notes = ?
       WHERE id = ?`,
      [normalizedDecision, actorUserId, notes, id]
    );

    if (normalizedDecision === "approved" && request.attendance_id) {
      const [[attendance]] = await connection.query(
        `SELECT *
         FROM attendance
         WHERE id = ?
         LIMIT 1
         FOR UPDATE`,
        [request.attendance_id]
      );

      if (attendance) {
        const checkIn = request.requested_check_in || attendance.check_in;
        const checkOut = request.requested_check_out || attendance.check_out;
        const context = await resolveAttendanceContext(connection, {
          employeeId: request.employee_id,
          method: "manual",
          stationName: attendance.check_in_device || attendance.check_out_device || "Manual Desk",
          at: checkIn ? new Date(checkIn) : new Date()
        });
        const evaluation = evaluateAttendanceRecord({
          shiftWindow: context.shiftWindow,
          attendanceDate: attendance.date,
          checkIn,
          checkOut,
          holiday: context.holiday,
          leaveRequest: context.leaveRequest,
          allowOvertime: Number(context.policy?.allow_overtime ?? 1) === 1
        });

        await connection.query(
          `UPDATE attendance
           SET check_in = ?,
               check_out = ?,
               status = ?,
               minutes_late = ?,
               work_minutes = ?,
               overtime_minutes = ?,
               requires_approval = 0,
               review_reason = ?
           WHERE id = ?`,
          [
            checkIn,
            checkOut,
            request.requested_status || evaluation.status,
            evaluation.lateMinutes,
            evaluation.workMinutes,
            evaluation.overtimeMinutes,
            notes || evaluation.reviewReason,
            attendance.id
          ]
        );
      }
    }

    await connection.commit();
    return { id: Number(id), status: normalizedDecision };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function getWorkforceOverview() {
  const [[summary]] = await pool.query(
    `SELECT
       (SELECT COUNT(*) FROM attendance_shifts WHERE is_active = 1) AS activeShifts,
       (SELECT COUNT(*) FROM employee_shift_assignments) AS shiftAssignments,
       (SELECT COUNT(*) FROM attendance_device_policies WHERE status = 'active') AS activeDevices,
       (SELECT COUNT(*) FROM holiday_calendar WHERE holiday_date >= CURDATE()) AS upcomingHolidays,
       (SELECT COUNT(*) FROM leave_requests WHERE status = 'pending') AS pendingLeaveRequests,
       (SELECT COUNT(*) FROM attendance_approval_requests WHERE status = 'pending') AS pendingApprovals`
  );

  const [upcomingHolidays] = await pool.query(
    `SELECT *
     FROM holiday_calendar
     WHERE holiday_date >= CURDATE()
     ORDER BY holiday_date ASC
     LIMIT 10`
  );

  const [pendingApprovals] = await pool.query(
    `SELECT
       ar.id,
       ar.request_type,
       ar.reason,
       ar.created_at,
       e.name AS employee_name,
       e.employee_code
     FROM attendance_approval_requests ar
     INNER JOIN employees e ON e.id = ar.employee_id
     WHERE ar.status = 'pending'
     ORDER BY ar.created_at DESC
     LIMIT 10`
  );

  const [pendingLeaves] = await pool.query(
    `SELECT
       lr.id,
       lr.leave_type,
       lr.start_date,
       lr.end_date,
       lr.reason,
       e.name AS employee_name,
       e.employee_code
     FROM leave_requests lr
     INNER JOIN employees e ON e.id = lr.employee_id
     WHERE lr.status = 'pending'
     ORDER BY lr.created_at DESC
     LIMIT 10`
  );

  return {
    summary,
    upcomingHolidays,
    pendingApprovals,
    pendingLeaves
  };
}
