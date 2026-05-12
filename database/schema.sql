CREATE DATABASE IF NOT EXISTS attendance_db;
USE attendance_db;

CREATE TABLE IF NOT EXISTS employees (
    id INT NOT NULL AUTO_INCREMENT,
    employee_code VARCHAR(50) NULL,
    name VARCHAR(100) NOT NULL,
    cnic VARCHAR(20) NOT NULL,
    department VARCHAR(100) NULL,
    designation VARCHAR(100) NULL,
    status ENUM('active', 'inactive') NOT NULL DEFAULT 'active',
    fingerprint LONGBLOB NULL,
    face_encoding LONGTEXT NULL,
    profile_image VARCHAR(255) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_employees_cnic (cnic),
    UNIQUE KEY uq_employees_code (employee_code)
);

CREATE TABLE IF NOT EXISTS attendance (
    id INT NOT NULL AUTO_INCREMENT,
    employee_id INT NOT NULL,
    date DATE NOT NULL,
    check_in DATETIME NULL,
    check_out DATETIME NULL,
    check_in_method ENUM('fingerprint', 'face', 'manual') NULL,
    check_out_method ENUM('fingerprint', 'face', 'manual') NULL,
    check_in_device VARCHAR(100) NULL,
    check_out_device VARCHAR(100) NULL,
    verification_score DECIMAL(10, 4) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_attendance_employee_date (employee_id, date),
    CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id) REFERENCES employees (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS admin_users (
    id INT NOT NULL AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(150) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'operator', 'viewer') NOT NULL DEFAULT 'operator',
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_admin_users_email (email)
);

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

CREATE TABLE IF NOT EXISTS audit_logs (
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
);
