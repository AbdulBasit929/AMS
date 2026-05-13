import pool from "../config/db.js";
import { hashPassword } from "./passwordService.js";

async function columnExists(tableName, columnName) {
  const [rows] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?`,
    [tableName, columnName]
  );

  return rows.length > 0;
}

async function addColumnIfMissing(tableName, columnName, definition) {
  if (await columnExists(tableName, columnName)) {
    return;
  }

  await pool.query(
    `ALTER TABLE ${tableName}
     ADD COLUMN ${columnName} ${definition}`
  );
}

export async function ensureFingerprintStorage() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS employee_fingerprints (
       id INT NOT NULL AUTO_INCREMENT,
       employee_id INT NOT NULL,
       finger_code VARCHAR(50) NOT NULL,
       is_preferred TINYINT(1) NOT NULL DEFAULT 0,
       template_format VARCHAR(50) NOT NULL DEFAULT 'DPFP_NET',
       template LONGBLOB NOT NULL,
       quality_score DECIMAL(10, 4) NULL,
       source VARCHAR(50) NULL,
       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       UNIQUE KEY uq_employee_fingerprints_employee_finger (employee_id, finger_code),
       KEY idx_employee_fingerprints_employee (employee_id),
       CONSTRAINT fk_employee_fingerprints_employee
         FOREIGN KEY (employee_id) REFERENCES employees (id)
         ON DELETE CASCADE
     )`
  );

  const [columns] = await pool.query(
    `SELECT COLUMN_NAME
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'employee_fingerprints'
       AND COLUMN_NAME = 'is_preferred'`
  );

  if (columns.length === 0) {
    await pool.query(
      `ALTER TABLE employee_fingerprints
       ADD COLUMN is_preferred TINYINT(1) NOT NULL DEFAULT 0 AFTER finger_code`
    );
  }

  await pool.query(
    `INSERT INTO employee_fingerprints
        (employee_id, finger_code, template_format, template, source)
     SELECT
        e.id,
        'legacy_primary',
        'LEGACY_IMPORTED',
        e.fingerprint,
        'legacy_migration'
     FROM employees e
     WHERE e.fingerprint IS NOT NULL
       AND NOT EXISTS (
         SELECT 1
         FROM employee_fingerprints ef
         WHERE ef.employee_id = e.id
       )`
  );

  await pool.query(
    `UPDATE employee_fingerprints ef
     INNER JOIN (
       SELECT employee_id, MIN(id) AS preferred_id
       FROM employee_fingerprints
       GROUP BY employee_id
     ) chosen ON chosen.preferred_id = ef.id
     SET ef.is_preferred = 1
     WHERE ef.is_preferred = 0`
  );

  await pool.query(
    `UPDATE employee_fingerprints
     SET is_preferred = 0
     WHERE finger_code = 'legacy_primary'
       AND is_preferred = 1
       AND EXISTS (
         SELECT 1
         FROM (
           SELECT employee_id
           FROM employee_fingerprints
           WHERE finger_code <> 'legacy_primary'
           GROUP BY employee_id
         ) modern
         WHERE modern.employee_id = employee_fingerprints.employee_id
       )`
  );

  await pool.query(
    `UPDATE employee_fingerprints ef
     INNER JOIN (
       SELECT employee_id, MAX(id) AS preferred_id
       FROM employee_fingerprints
       WHERE finger_code <> 'legacy_primary'
       GROUP BY employee_id
     ) modern ON modern.preferred_id = ef.id
     SET ef.is_preferred = 1
     WHERE ef.is_preferred = 0`
  );
}

export async function ensureAuditStorage() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS audit_logs (
       id INT NOT NULL AUTO_INCREMENT,
       actor_user_id INT NULL,
       event_type VARCHAR(100) NOT NULL,
       target_type VARCHAR(100) NOT NULL,
       target_id VARCHAR(100) NULL,
       summary VARCHAR(255) NOT NULL,
       metadata LONGTEXT NULL,
       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       KEY idx_audit_logs_created (created_at),
       KEY idx_audit_logs_event_type (event_type),
       KEY idx_audit_logs_target (target_type, target_id),
       CONSTRAINT fk_audit_logs_actor
         FOREIGN KEY (actor_user_id) REFERENCES admin_users (id)
         ON DELETE SET NULL
     )`
  );
}

export async function ensureAttendanceDomainStorage() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS attendance_shifts (
       id INT NOT NULL AUTO_INCREMENT,
       shift_code VARCHAR(50) NULL,
       name VARCHAR(100) NOT NULL,
       start_time TIME NOT NULL DEFAULT '09:00:00',
       end_time TIME NOT NULL DEFAULT '17:00:00',
       grace_minutes INT NOT NULL DEFAULT 15,
       check_in_window_before_minutes INT NOT NULL DEFAULT 120,
       check_out_window_after_minutes INT NOT NULL DEFAULT 240,
       overtime_after_minutes INT NOT NULL DEFAULT 0,
       min_full_day_minutes INT NOT NULL DEFAULT 480,
       min_half_day_minutes INT NOT NULL DEFAULT 240,
       cross_midnight TINYINT(1) NOT NULL DEFAULT 0,
       auto_close_hours INT NOT NULL DEFAULT 18,
       is_active TINYINT(1) NOT NULL DEFAULT 1,
       is_default TINYINT(1) NOT NULL DEFAULT 0,
       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       UNIQUE KEY uq_attendance_shifts_code (shift_code)
     )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS attendance_policies (
       id INT NOT NULL AUTO_INCREMENT,
       policy_code VARCHAR(50) NULL,
       name VARCHAR(100) NOT NULL,
       default_shift_id INT NULL,
       late_mark_after_grace TINYINT(1) NOT NULL DEFAULT 1,
       allow_fingerprint TINYINT(1) NOT NULL DEFAULT 1,
       allow_face TINYINT(1) NOT NULL DEFAULT 1,
       allow_manual TINYINT(1) NOT NULL DEFAULT 1,
       manual_requires_approval TINYINT(1) NOT NULL DEFAULT 0,
       allow_overtime TINYINT(1) NOT NULL DEFAULT 1,
       require_shift_assignment TINYINT(1) NOT NULL DEFAULT 0,
       weekend_rule ENUM('working', 'off', 'custom') NOT NULL DEFAULT 'off',
       is_default TINYINT(1) NOT NULL DEFAULT 1,
       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       UNIQUE KEY uq_attendance_policies_code (policy_code),
       CONSTRAINT fk_attendance_policy_default_shift
         FOREIGN KEY (default_shift_id) REFERENCES attendance_shifts (id)
         ON DELETE SET NULL
     )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS attendance_device_policies (
       id INT NOT NULL AUTO_INCREMENT,
       device_code VARCHAR(50) NULL,
       device_name VARCHAR(100) NOT NULL,
       station_name VARCHAR(100) NOT NULL,
       location_label VARCHAR(100) NULL,
       allowed_methods_json LONGTEXT NULL,
       verification_mode ENUM('single', 'either_biometric', 'face_first', 'fingerprint_first', 'manual_only') NOT NULL DEFAULT 'single',
       enforce_liveness TINYINT(1) NOT NULL DEFAULT 0,
       enforce_shift_assignment TINYINT(1) NOT NULL DEFAULT 0,
       status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
       is_default TINYINT(1) NOT NULL DEFAULT 0,
       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       UNIQUE KEY uq_attendance_device_station (station_name)
     )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS employee_shift_assignments (
       id INT NOT NULL AUTO_INCREMENT,
       employee_id INT NOT NULL,
       shift_id INT NOT NULL,
       effective_from DATE NOT NULL,
       effective_to DATE NULL,
       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       KEY idx_shift_assignment_employee_dates (employee_id, effective_from, effective_to),
       CONSTRAINT fk_shift_assignments_employee
         FOREIGN KEY (employee_id) REFERENCES employees (id)
         ON DELETE CASCADE,
       CONSTRAINT fk_shift_assignments_shift
         FOREIGN KEY (shift_id) REFERENCES attendance_shifts (id)
         ON DELETE CASCADE
     )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS holiday_calendar (
       id INT NOT NULL AUTO_INCREMENT,
       holiday_date DATE NOT NULL,
       name VARCHAR(150) NOT NULL,
       holiday_type ENUM('public', 'company', 'regional') NOT NULL DEFAULT 'company',
       is_paid TINYINT(1) NOT NULL DEFAULT 1,
       applies_to_department VARCHAR(100) NULL,
       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       UNIQUE KEY uq_holiday_calendar_date_scope (holiday_date, applies_to_department)
     )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS leave_requests (
       id INT NOT NULL AUTO_INCREMENT,
       employee_id INT NOT NULL,
       leave_type VARCHAR(50) NOT NULL,
       start_date DATE NOT NULL,
       end_date DATE NOT NULL,
       partial_day ENUM('none', 'first_half', 'second_half') NOT NULL DEFAULT 'none',
       reason TEXT NULL,
       status ENUM('pending', 'approved', 'rejected', 'cancelled') NOT NULL DEFAULT 'pending',
       requested_by_user_id INT NULL,
       approved_by_user_id INT NULL,
       approved_at DATETIME NULL,
       decision_notes TEXT NULL,
       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       KEY idx_leave_requests_employee_dates (employee_id, start_date, end_date),
       CONSTRAINT fk_leave_requests_employee
         FOREIGN KEY (employee_id) REFERENCES employees (id)
         ON DELETE CASCADE,
       CONSTRAINT fk_leave_requests_requested_by
         FOREIGN KEY (requested_by_user_id) REFERENCES admin_users (id)
         ON DELETE SET NULL,
       CONSTRAINT fk_leave_requests_approved_by
         FOREIGN KEY (approved_by_user_id) REFERENCES admin_users (id)
         ON DELETE SET NULL
     )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS attendance_approval_requests (
       id INT NOT NULL AUTO_INCREMENT,
       employee_id INT NOT NULL,
       attendance_id INT NULL,
       request_type ENUM('missed_check_in', 'missed_check_out', 'manual_regularization', 'overtime_adjustment', 'leave_override') NOT NULL DEFAULT 'manual_regularization',
       requested_check_in DATETIME NULL,
       requested_check_out DATETIME NULL,
       requested_status VARCHAR(50) NULL,
       reason TEXT NOT NULL,
       status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
       requested_by_user_id INT NULL,
       approved_by_user_id INT NULL,
       approved_at DATETIME NULL,
       approval_notes TEXT NULL,
       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
       updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       KEY idx_attendance_approval_requests_employee (employee_id, status),
       CONSTRAINT fk_attendance_approval_employee
         FOREIGN KEY (employee_id) REFERENCES employees (id)
         ON DELETE CASCADE,
       CONSTRAINT fk_attendance_approval_attendance
         FOREIGN KEY (attendance_id) REFERENCES attendance (id)
         ON DELETE SET NULL,
       CONSTRAINT fk_attendance_approval_requested_by
         FOREIGN KEY (requested_by_user_id) REFERENCES admin_users (id)
         ON DELETE SET NULL,
       CONSTRAINT fk_attendance_approval_approved_by
         FOREIGN KEY (approved_by_user_id) REFERENCES admin_users (id)
         ON DELETE SET NULL
     )`
  );

  await pool.query(
    `CREATE TABLE IF NOT EXISTS attendance_events (
       id INT NOT NULL AUTO_INCREMENT,
       employee_id INT NOT NULL,
       attendance_id INT NULL,
       event_time DATETIME NOT NULL,
       event_date DATE NOT NULL,
       event_type ENUM('check_in', 'check_out', 'missed_punch', 'manual_adjustment') NOT NULL DEFAULT 'check_in',
       method ENUM('fingerprint', 'face', 'manual') NOT NULL DEFAULT 'manual',
       device_name VARCHAR(100) NULL,
       station_name VARCHAR(100) NULL,
       verification_score DECIMAL(10, 4) NULL,
       metadata LONGTEXT NULL,
       created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
       PRIMARY KEY (id),
       KEY idx_attendance_events_employee_date (employee_id, event_date),
       CONSTRAINT fk_attendance_events_employee
         FOREIGN KEY (employee_id) REFERENCES employees (id)
         ON DELETE CASCADE,
       CONSTRAINT fk_attendance_events_attendance
         FOREIGN KEY (attendance_id) REFERENCES attendance (id)
         ON DELETE SET NULL
     )`
  );

  await addColumnIfMissing("attendance", "shift_id", "INT NULL AFTER employee_id");
  await addColumnIfMissing("attendance", "policy_id", "INT NULL AFTER shift_id");
  await addColumnIfMissing("attendance", "holiday_id", "INT NULL AFTER policy_id");
  await addColumnIfMissing("attendance", "leave_request_id", "INT NULL AFTER holiday_id");
  await addColumnIfMissing("attendance", "scheduled_start", "DATETIME NULL AFTER date");
  await addColumnIfMissing("attendance", "scheduled_end", "DATETIME NULL AFTER scheduled_start");
  await addColumnIfMissing("attendance", "grace_minutes", "INT NOT NULL DEFAULT 0 AFTER scheduled_end");
  await addColumnIfMissing("attendance", "status", "ENUM('present', 'late', 'half_day', 'absent', 'on_leave', 'holiday', 'holiday_present', 'leave_override', 'pending_review', 'missed_punch') NOT NULL DEFAULT 'present' AFTER check_out_device");
  await addColumnIfMissing("attendance", "minutes_late", "INT NOT NULL DEFAULT 0 AFTER status");
  await addColumnIfMissing("attendance", "work_minutes", "INT NOT NULL DEFAULT 0 AFTER minutes_late");
  await addColumnIfMissing("attendance", "overtime_minutes", "INT NOT NULL DEFAULT 0 AFTER work_minutes");
  await addColumnIfMissing("attendance", "requires_approval", "TINYINT(1) NOT NULL DEFAULT 0 AFTER overtime_minutes");
  await addColumnIfMissing("attendance", "review_reason", "VARCHAR(255) NULL AFTER requires_approval");
  await addColumnIfMissing("attendance", "notes", "TEXT NULL AFTER review_reason");

  const [[shiftCount]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM attendance_shifts`
  );

  if ((shiftCount?.total ?? 0) === 0) {
    await pool.query(
      `INSERT INTO attendance_shifts
        (shift_code, name, start_time, end_time, grace_minutes, check_in_window_before_minutes, check_out_window_after_minutes, overtime_after_minutes, min_full_day_minutes, min_half_day_minutes, cross_midnight, auto_close_hours, is_active, is_default)
       VALUES
        ('GENERAL', 'General Shift', '09:00:00', '17:00:00', 15, 120, 240, 30, 480, 240, 0, 18, 1, 1)`
    );
  }

  const [[defaultShift]] = await pool.query(
    `SELECT id
     FROM attendance_shifts
     ORDER BY is_default DESC, id ASC
     LIMIT 1`
  );

  const [[policyCount]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM attendance_policies`
  );

  if ((policyCount?.total ?? 0) === 0) {
    await pool.query(
      `INSERT INTO attendance_policies
        (policy_code, name, default_shift_id, late_mark_after_grace, allow_fingerprint, allow_face, allow_manual, manual_requires_approval, allow_overtime, require_shift_assignment, weekend_rule, is_default)
       VALUES
        ('DEFAULT', 'Default Workforce Policy', ?, 1, 1, 1, 1, 0, 1, 0, 'off', 1)`,
      [defaultShift?.id || null]
    );
  } else if (defaultShift?.id) {
    await pool.query(
      `UPDATE attendance_policies
       SET default_shift_id = COALESCE(default_shift_id, ?)
       WHERE default_shift_id IS NULL`,
      [defaultShift.id]
    );
  }

  const [[deviceCount]] = await pool.query(
    `SELECT COUNT(*) AS total
     FROM attendance_device_policies`
  );

  if ((deviceCount?.total ?? 0) === 0) {
    await pool.query(
      `INSERT INTO attendance_device_policies
        (device_code, device_name, station_name, location_label, allowed_methods_json, verification_mode, enforce_liveness, enforce_shift_assignment, status, is_default)
       VALUES
        ('DEFAULT_STATION', 'Default Attendance Station', ?, 'Main attendance station', '["fingerprint","face","manual"]', 'either_biometric', 0, 0, 'active', 1)`,
      [process.env.STATION_NAME || "Unknown Station"]
    );
  }
}

export async function ensureBootstrapAdmin() {
  const [rows] = await pool.query("SELECT COUNT(*) AS total FROM admin_users");
  const total = rows[0]?.total ?? 0;

  if (total > 0) {
    return;
  }

  const name = process.env.BOOTSTRAP_ADMIN_NAME || "System Admin";
  const email = process.env.BOOTSTRAP_ADMIN_EMAIL || "admin@attendance.local";
  const password = process.env.BOOTSTRAP_ADMIN_PASSWORD || "Admin@12345";
  const role = process.env.BOOTSTRAP_ADMIN_ROLE || "admin";

  await pool.query(
    `INSERT INTO admin_users (name, email, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [name, email, hashPassword(password), role]
  );

  console.log(`Bootstrapped default admin user: ${email}`);
}
