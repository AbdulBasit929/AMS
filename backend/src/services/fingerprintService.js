import { createHash } from "node:crypto";
import pool from "../config/db.js";

export const RECOMMENDED_FINGER_SEQUENCE = [
  "right_index",
  "right_thumb",
  "left_index",
  "left_thumb",
  "right_middle",
  "left_middle"
];

export function buildFingerprintPlan(fingerprints) {
  const enrolledCodes = new Set((fingerprints || []).map((item) => item.finger_code));
  const preferred = (fingerprints || []).find((item) => Number(item.is_preferred) === 1) || null;

  const recommended = RECOMMENDED_FINGER_SEQUENCE.map((fingerCode, index) => ({
    fingerCode,
    label: fingerCode.split("_").map((part) => part.charAt(0).toUpperCase() + part.slice(1)).join(" "),
    priority: index + 1,
    enrolled: enrolledCodes.has(fingerCode),
    isPreferred: preferred?.finger_code === fingerCode
  }));

  return {
    preferredFingerCode: preferred?.finger_code || null,
    recommended,
    missingRecommended: recommended.filter((item) => !item.enrolled).slice(0, 4)
  };
}

async function syncEmployeePrimaryFingerprint(connection, employeeId) {
  const [rows] = await connection.query(
    `SELECT template
     FROM employee_fingerprints
     WHERE employee_id = ?
     ORDER BY is_preferred DESC, updated_at DESC, id DESC
     LIMIT 1`,
    [employeeId]
  );

  const template = rows[0]?.template || null;

  await connection.query(
    `UPDATE employees
     SET fingerprint = ?
     WHERE id = ?`,
    [template, employeeId]
  );
}

export async function upsertFingerprintTemplate({
  employeeId,
  fingerCode,
  templateFormat,
  templateBuffer,
  qualityScore = null,
  source = "unknown",
  makePreferred = false
}) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [duplicates] = await connection.query(
      `SELECT employee_id, finger_code
       FROM employee_fingerprints
       WHERE employee_id <> ?
         AND template = ?
       LIMIT 1`,
      [employeeId, templateBuffer]
    );

    if (duplicates.length > 0) {
      throw new Error(
        `This fingerprint template is already enrolled for employee #${duplicates[0].employee_id} in slot '${duplicates[0].finger_code}'.`
      );
    }

    const [[existing]] = await connection.query(
      `SELECT id, is_preferred
       FROM employee_fingerprints
       WHERE employee_id = ? AND finger_code = ?
       LIMIT 1`,
      [employeeId, fingerCode]
    );

    const [[preferredRow]] = await connection.query(
      `SELECT id, finger_code, source
       FROM employee_fingerprints
       WHERE employee_id = ? AND is_preferred = 1
       LIMIT 1`,
      [employeeId]
    );

    const shouldPrefer = Boolean(
      makePreferred ||
      existing?.is_preferred ||
      !preferredRow ||
      (preferredRow.finger_code === "legacy_primary" && fingerCode !== "legacy_primary")
    );

    if (shouldPrefer) {
      await connection.query(
        `UPDATE employee_fingerprints
         SET is_preferred = 0
         WHERE employee_id = ?`,
        [employeeId]
      );
    }

    if (existing) {
      await connection.query(
        `UPDATE employee_fingerprints
         SET template_format = ?,
             template = ?,
             quality_score = ?,
             source = ?,
             is_preferred = ?,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = ?`,
        [templateFormat, templateBuffer, qualityScore, source, shouldPrefer ? 1 : 0, existing.id]
      );
    } else {
      await connection.query(
        `INSERT INTO employee_fingerprints
          (employee_id, finger_code, is_preferred, template_format, template, quality_score, source)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [employeeId, fingerCode, shouldPrefer ? 1 : 0, templateFormat, templateBuffer, qualityScore, source]
      );
    }

    await syncEmployeePrimaryFingerprint(connection, employeeId);
    await connection.commit();

    const [rows] = await pool.query(
      `SELECT id, employee_id, finger_code, is_preferred, template_format, source, quality_score, created_at, updated_at
       FROM employee_fingerprints
       WHERE employee_id = ? AND finger_code = ?
       LIMIT 1`,
      [employeeId, fingerCode]
    );

    return rows[0];
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function setPreferredFingerprint({ employeeId, fingerprintId }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[row]] = await connection.query(
      `SELECT id, finger_code
       FROM employee_fingerprints
       WHERE id = ? AND employee_id = ?
       LIMIT 1`,
      [fingerprintId, employeeId]
    );

    if (!row) {
      throw new Error("fingerprint slot not found");
    }

    await connection.query(
      `UPDATE employee_fingerprints
       SET is_preferred = 0
       WHERE employee_id = ?`,
      [employeeId]
    );

    await connection.query(
      `UPDATE employee_fingerprints
       SET is_preferred = 1,
           updated_at = CURRENT_TIMESTAMP
       WHERE id = ?`,
      [fingerprintId]
    );

    await syncEmployeePrimaryFingerprint(connection, employeeId);
    await connection.commit();

    return row;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function deleteFingerprintSlot({ employeeId, fingerprintId }) {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [[row]] = await connection.query(
      `SELECT id, finger_code, is_preferred
       FROM employee_fingerprints
       WHERE id = ? AND employee_id = ?
       LIMIT 1`,
      [fingerprintId, employeeId]
    );

    if (!row) {
      throw new Error("fingerprint slot not found");
    }

    await connection.query(
      `DELETE FROM employee_fingerprints
       WHERE id = ?`,
      [fingerprintId]
    );

    if (Number(row.is_preferred) === 1) {
      const [[replacement]] = await connection.query(
        `SELECT id
         FROM employee_fingerprints
         WHERE employee_id = ?
         ORDER BY updated_at DESC, id DESC
         LIMIT 1`,
        [employeeId]
      );

      if (replacement) {
        await connection.query(
          `UPDATE employee_fingerprints
           SET is_preferred = 1,
               updated_at = CURRENT_TIMESTAMP
           WHERE id = ?`,
          [replacement.id]
        );
      }
    }

    await syncEmployeePrimaryFingerprint(connection, employeeId);
    await connection.commit();

    return row;
  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
}

export async function listEmployeeFingerprints(employeeId) {
  const [rows] = await pool.query(
    `SELECT
       id,
       employee_id,
       finger_code,
       is_preferred,
       template_format,
       source,
       quality_score,
       created_at,
       updated_at
     FROM employee_fingerprints
     WHERE employee_id = ?
     ORDER BY is_preferred DESC, updated_at DESC, id DESC`,
    [employeeId]
  );

  return rows;
}

export async function listPotentialFingerprintConflicts(employeeId = null) {
  const [rows] = await pool.query(
    `SELECT
       ef.id,
       ef.employee_id,
       ef.finger_code,
       ef.is_preferred,
       ef.template_format,
       ef.source,
       ef.updated_at,
       ef.template,
       e.name,
       e.cnic,
       e.status
     FROM employee_fingerprints ef
     INNER JOIN employees e ON e.id = ef.employee_id
     ORDER BY ef.employee_id ASC, ef.finger_code ASC`
  );

  const grouped = new Map();

  for (const row of rows) {
    const hash = createHash("sha256").update(row.template).digest("hex");
    if (!grouped.has(hash)) {
      grouped.set(hash, []);
    }

    grouped.get(hash).push({
      fingerprintId: row.id,
      employeeId: row.employee_id,
      fingerCode: row.finger_code,
      isPreferred: Boolean(Number(row.is_preferred)),
      templateFormat: row.template_format,
      source: row.source,
      updatedAt: row.updated_at,
      name: row.name,
      cnic: row.cnic,
      status: row.status
    });
  }

  return Array.from(grouped.entries())
    .map(([templateHash, matches]) => ({
      templateHash,
      matches
    }))
    .filter((group) => new Set(group.matches.map((item) => item.employeeId)).size > 1)
    .filter((group) => employeeId === null || group.matches.some((item) => item.employeeId === employeeId))
    .map((group) => ({
      ...group,
      summary: `Exact fingerprint template appears under multiple employees: ${group.matches
        .map((item) => `${item.name} (#${item.employeeId}, ${item.fingerCode})`)
        .join(", ")}.`,
      remediation: "Delete or replace the duplicate slot so one physical finger belongs to only one employee."
    }));
}
