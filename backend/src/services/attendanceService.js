import pool from "../config/db.js";
import { logAudit } from "./auditService.js";

export async function markAttendance({
  employeeId,
  method,
  score = null,
  stationName = "Unknown Station",
  actorUserId = null,
  metadata = null
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[employee]] = await connection.query(
      `SELECT id
       FROM employees
       WHERE id = ?
       LIMIT 1
       FOR UPDATE`,
      [employeeId]
    );

    if (!employee) {
      throw new Error("employee not found");
    }

    const [rows] = await connection.query(
      `SELECT id, check_in, check_out
       FROM attendance
       WHERE employee_id = ? AND date = CURDATE()
       LIMIT 1
       FOR UPDATE`,
      [employeeId]
    );

    if (rows.length === 0) {
      const [result] = await connection.query(
        `INSERT INTO attendance
          (employee_id, date, check_in, check_in_method, check_in_device, verification_score)
         VALUES (?, CURDATE(), NOW(), ?, ?, ?)`,
        [employeeId, method, stationName, score]
      );

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
          ...metadata
        }
      });

      return {
        action: "check_in",
        attendanceId: result.insertId
      };
    }

    const record = rows[0];

    if (!record.check_out) {
      await connection.query(
        `UPDATE attendance
         SET check_out = NOW(),
             check_out_method = ?,
             check_out_device = ?,
             verification_score = COALESCE(?, verification_score)
         WHERE id = ?`,
        [method, stationName, score, record.id]
      );

      await connection.commit();

      await logAudit({
        actorUserId,
        eventType: "attendance.check_out",
        targetType: "attendance",
        targetId: record.id,
        summary: `Attendance check-out recorded for employee #${employeeId} via ${method}.`,
        metadata: {
          employeeId,
          method,
          score,
          stationName,
          action: "check_out",
          ...metadata
        }
      });

      return {
        action: "check_out",
        attendanceId: record.id
      };
    }

    await connection.commit();

    await logAudit({
      actorUserId,
      eventType: "attendance.already_closed",
      targetType: "attendance",
      targetId: record.id,
      summary: `Attendance request ignored because employee #${employeeId} already has a closed session today.`,
      metadata: {
        employeeId,
        method,
        score,
        stationName,
        action: "already_closed",
        ...metadata
      }
    });

    return {
      action: "already_closed",
      attendanceId: record.id
    };
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}
