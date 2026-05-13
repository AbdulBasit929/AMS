USE attendance_db;

SET @db_name = 'attendance_db';

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'employees'
      AND column_name = 'employee_code'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE employees ADD COLUMN employee_code VARCHAR(50) NULL AFTER id',
    'SELECT ''employees.employee_code already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @profile_image_type = (
    SELECT DATA_TYPE
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'employees'
      AND column_name = 'profile_image'
    LIMIT 1
);
SET @sql = IF(@profile_image_type IS NOT NULL AND @profile_image_type NOT IN ('text', 'mediumtext', 'longtext'),
    'ALTER TABLE employees MODIFY COLUMN profile_image LONGTEXT NULL',
    'SELECT ''employees.profile_image already supports base64 image data'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'employees'
      AND column_name = 'designation'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE employees ADD COLUMN designation VARCHAR(100) NULL AFTER department',
    'SELECT ''employees.designation already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'employees'
      AND column_name = 'status'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE employees ADD COLUMN status ENUM(''active'',''inactive'') NOT NULL DEFAULT ''active'' AFTER designation',
    'SELECT ''employees.status already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'employees'
      AND column_name = 'updated_at'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE employees ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
    'SELECT ''employees.updated_at already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'attendance'
      AND column_name = 'check_in_method'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE attendance ADD COLUMN check_in_method ENUM(''fingerprint'',''face'',''manual'') NULL AFTER check_out',
    'SELECT ''attendance.check_in_method already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'attendance'
      AND column_name = 'check_out_method'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE attendance ADD COLUMN check_out_method ENUM(''fingerprint'',''face'',''manual'') NULL AFTER check_in_method',
    'SELECT ''attendance.check_out_method already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'attendance'
      AND column_name = 'check_in_device'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE attendance ADD COLUMN check_in_device VARCHAR(100) NULL AFTER check_out_method',
    'SELECT ''attendance.check_in_device already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'attendance'
      AND column_name = 'check_out_device'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE attendance ADD COLUMN check_out_device VARCHAR(100) NULL AFTER check_in_device',
    'SELECT ''attendance.check_out_device already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'attendance'
      AND column_name = 'verification_score'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE attendance ADD COLUMN verification_score DECIMAL(10,4) NULL AFTER check_out_device',
    'SELECT ''attendance.verification_score already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'attendance'
      AND column_name = 'created_at'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE attendance ADD COLUMN created_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP AFTER verification_score',
    'SELECT ''attendance.created_at already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @exists = (
    SELECT COUNT(*)
    FROM information_schema.columns
    WHERE table_schema = @db_name
      AND table_name = 'attendance'
      AND column_name = 'updated_at'
);
SET @sql = IF(@exists = 0,
    'ALTER TABLE attendance ADD COLUMN updated_at TIMESTAMP NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER created_at',
    'SELECT ''attendance.updated_at already exists'''
);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
