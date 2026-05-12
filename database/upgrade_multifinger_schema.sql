USE attendance_db;

CREATE TABLE IF NOT EXISTS employee_fingerprints (
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
);

INSERT INTO employee_fingerprints
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
  );
