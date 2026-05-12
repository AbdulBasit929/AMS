import pool from "../config/db.js";
import { hashPassword } from "./passwordService.js";

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
