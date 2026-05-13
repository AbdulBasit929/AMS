import pool from "../config/db.js";
import { logAudit } from "./auditService.js";
import {
  evaluateAttendanceRecord,
  insertAttendanceEvent,
  resolveAttendanceContext
} from "./workforceService.js";

export async function markAttendance({
  employeeId,
  method,
  score = null,
  stationName = "Unknown Station",
  actorUserId = null,
  metadata = null,
  at = new Date()
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const context = await resolveAttendanceContext(connection, {
      employeeId,
      method,
      stationName,
      at
    });

    const [rows] = await connection.query(
      `SELECT *
       FROM attendance
       WHERE employee_id = ?
         AND date = ?
       LIMIT 1
       FOR UPDATE`,
      [employeeId, context.attendanceDate]
    );

    const existingRecord = rows[0] || null;
    const recordTimestamp = at instanceof Date ? at : new Date(at);
    const allowOvertime = Number(context.policy?.allow_overtime ?? 1) === 1;

    if (!existingRecord) {
      const evaluation = evaluateAttendanceRecord({
        shiftWindow: context.shiftWindow,
        attendanceDate: context.attendanceDate,
        checkIn: recordTimestamp,
        checkOut: null,
        holiday: context.holiday,
        leaveRequest: context.leaveRequest,
        allowOvertime
      });

      const [result] = await connection.query(
        `INSERT INTO attendance
          (employee_id, shift_id, policy_id, holiday_id, leave_request_id, date, scheduled_start, scheduled_end, grace_minutes, check_in, check_in_method, check_in_device, check_out, check_out_method, check_out_device, status, minutes_late, work_minutes, overtime_minutes, requires_approval, review_reason, verification_score)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NULL, NULL, NULL, ?, ?, ?, ?, ?, ?, ?)`,
        [
          employeeId,
          context.shift?.id || null,
          context.policy?.id || null,
          context.holiday?.id || null,
          context.leaveRequest?.id || null,
          evaluation.attendanceDate,
          evaluation.scheduledStart,
          evaluation.scheduledEnd,
          evaluation.graceMinutes,
          recordTimestamp,
          method,
          stationName,
          evaluation.status,
          evaluation.lateMinutes,
          evaluation.workMinutes,
          evaluation.overtimeMinutes,
          evaluation.requiresApproval,
          evaluation.reviewReason,
          score
        ]
      );

      await insertAttendanceEvent(connection, {
        employeeId,
        attendanceId: result.insertId,
        eventTime: recordTimestamp,
        eventType: "check_in",
        method,
        deviceName: stationName,
        stationName,
        verificationScore: score,
        metadata
      });

      await connection.commit();

      await logAudit({
        actorUserId,
        eventType: "attendance.check_in",
        targetType: "attendance",
        targetId: result.insertId,
        summary: `Attendance check-in recorded for employee #${employeeId} via ${method}.`,
        metadata: {
          employeeId,
          method,
          score,
          stationName,
          action: "check_in",
          attendanceDate: evaluation.attendanceDate,
          shiftId: context.shift?.id || null,
          shiftName: context.shift?.name || null,
          status: evaluation.status,
          minutesLate: evaluation.lateMinutes,
          holiday: context.holiday?.name || null,
          leaveType: context.leaveRequest?.leave_type || null,
          requiresApproval: Boolean(evaluation.requiresApproval),
          ...metadata
        }
      });

      return {
        action: "check_in",
        attendanceId: result.insertId,
        attendanceDate: evaluation.attendanceDate,
        status: evaluation.status,
        shiftName: context.shift?.name || null,
        minutesLate: evaluation.lateMinutes,
        overtimeMinutes: 0,
        requiresApproval: Boolean(evaluation.requiresApproval)
      };
    }

    if (!existingRecord.check_out) {
      const evaluation = evaluateAttendanceRecord({
        shiftWindow: context.shiftWindow,
        attendanceDate: existingRecord.date,
        checkIn: existingRecord.check_in,
        checkOut: recordTimestamp,
        holiday: context.holiday,
        leaveRequest: context.leaveRequest,
        allowOvertime
      });

      await connection.query(
        `UPDATE attendance
         SET check_out = ?,
             check_out_method = ?,
             check_out_device = ?,
             shift_id = COALESCE(shift_id, ?),
             policy_id = COALESCE(policy_id, ?),
             holiday_id = COALESCE(holiday_id, ?),
             leave_request_id = COALESCE(leave_request_id, ?),
             scheduled_start = COALESCE(scheduled_start, ?),
             scheduled_end = COALESCE(scheduled_end, ?),
             grace_minutes = ?,
             status = ?,
             minutes_late = ?,
             work_minutes = ?,
             overtime_minutes = ?,
             requires_approval = ?,
             review_reason = ?,
             verification_score = COALESCE(?, verification_score)
         WHERE id = ?`,
        [
          recordTimestamp,
          method,
          stationName,
          context.shift?.id || null,
          context.policy?.id || null,
          context.holiday?.id || null,
          context.leaveRequest?.id || null,
          evaluation.scheduledStart,
          evaluation.scheduledEnd,
          evaluation.graceMinutes,
          evaluation.status,
          evaluation.lateMinutes,
          evaluation.workMinutes,
          evaluation.overtimeMinutes,
          evaluation.requiresApproval,
          evaluation.reviewReason,
          score,
          existingRecord.id
        ]
      );

      await insertAttendanceEvent(connection, {
        employeeId,
        attendanceId: existingRecord.id,
        eventTime: recordTimestamp,
        eventType: "check_out",
        method,
        deviceName: stationName,
        stationName,
        verificationScore: score,
        metadata
      });

      await connection.commit();

      await logAudit({
        actorUserId,
        eventType: "attendance.check_out",
        targetType: "attendance",
        targetId: existingRecord.id,
        summary: `Attendance check-out recorded for employee #${employeeId} via ${method}.`,
        metadata: {
          employeeId,
          method,
          score,
          stationName,
          action: "check_out",
          attendanceDate: existingRecord.date,
          shiftId: context.shift?.id || null,
          shiftName: context.shift?.name || null,
          status: evaluation.status,
          minutesLate: evaluation.lateMinutes,
          workMinutes: evaluation.workMinutes,
          overtimeMinutes: evaluation.overtimeMinutes,
          holiday: context.holiday?.name || null,
          leaveType: context.leaveRequest?.leave_type || null,
          requiresApproval: Boolean(evaluation.requiresApproval),
          ...metadata
        }
      });

      return {
        action: "check_out",
        attendanceId: existingRecord.id,
        attendanceDate: existingRecord.date,
        status: evaluation.status,
        shiftName: context.shift?.name || null,
        minutesLate: evaluation.lateMinutes,
        workMinutes: evaluation.workMinutes,
        overtimeMinutes: evaluation.overtimeMinutes,
        requiresApproval: Boolean(evaluation.requiresApproval)
      };
    }

    await connection.commit();

    await logAudit({
      actorUserId,
      eventType: "attendance.already_closed",
      targetType: "attendance",
      targetId: existingRecord.id,
      summary: `Attendance request ignored because employee #${employeeId} already has a closed session for ${existingRecord.date}.`,
      metadata: {
        employeeId,
        method,
        score,
        stationName,
        action: "already_closed",
        attendanceDate: existingRecord.date,
        ...metadata
      }
    });

    return {
      action: "already_closed",
      attendanceId: existingRecord.id,
      attendanceDate: existingRecord.date,
      status: existingRecord.status,
      requiresApproval: Boolean(existingRecord.requires_approval)
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
