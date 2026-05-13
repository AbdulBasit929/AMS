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
    profile_image LONGTEXT NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_employees_cnic (cnic),
    UNIQUE KEY uq_employees_code (employee_code)
);

CREATE TABLE IF NOT EXISTS attendance (
    id INT NOT NULL AUTO_INCREMENT,
    employee_id INT NOT NULL,
    shift_id INT NULL,
    policy_id INT NULL,
    holiday_id INT NULL,
    leave_request_id INT NULL,
    date DATE NOT NULL,
    scheduled_start DATETIME NULL,
    scheduled_end DATETIME NULL,
    grace_minutes INT NOT NULL DEFAULT 0,
    check_in DATETIME NULL,
    check_out DATETIME NULL,
    check_in_method ENUM('fingerprint', 'face', 'manual') NULL,
    check_out_method ENUM('fingerprint', 'face', 'manual') NULL,
    check_in_device VARCHAR(100) NULL,
    check_out_device VARCHAR(100) NULL,
    status ENUM('present', 'late', 'half_day', 'absent', 'on_leave', 'holiday', 'holiday_present', 'leave_override', 'pending_review', 'missed_punch') NOT NULL DEFAULT 'present',
    minutes_late INT NOT NULL DEFAULT 0,
    work_minutes INT NOT NULL DEFAULT 0,
    overtime_minutes INT NOT NULL DEFAULT 0,
    requires_approval TINYINT(1) NOT NULL DEFAULT 0,
    review_reason VARCHAR(255) NULL,
    notes TEXT NULL,
    verification_score DECIMAL(10, 4) NULL,
    created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_attendance_employee_date (employee_id, date),
    CONSTRAINT fk_attendance_employee
        FOREIGN KEY (employee_id) REFERENCES employees (id)
        ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS attendance_shifts (
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
);

CREATE TABLE IF NOT EXISTS attendance_policies (
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
);

CREATE TABLE IF NOT EXISTS attendance_device_policies (
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
);

CREATE TABLE IF NOT EXISTS employee_shift_assignments (
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
);

CREATE TABLE IF NOT EXISTS holiday_calendar (
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
);

CREATE TABLE IF NOT EXISTS leave_requests (
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
);

CREATE TABLE IF NOT EXISTS attendance_approval_requests (
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
);

CREATE TABLE IF NOT EXISTS attendance_events (
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
