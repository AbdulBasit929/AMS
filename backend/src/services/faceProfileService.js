import pool from "../config/db.js";

const FACE_DUPLICATE_CONFLICT_THRESHOLD = Number(process.env.FACE_DUPLICATE_CONFLICT_THRESHOLD || 0.34);

function safeParseFaceProfile(rawValue) {
  if (!rawValue) {
    return null;
  }

  try {
    const parsed = JSON.parse(rawValue);
    if (Array.isArray(parsed)) {
      return {
        version: "1.0",
        averagedEncoding: parsed,
        encodings: [parsed]
      };
    }

    return parsed;
  } catch {
    return null;
  }
}

function getPrimaryEncoding(faceProfile) {
  if (!faceProfile || typeof faceProfile !== "object") {
    return null;
  }

  if (Array.isArray(faceProfile.averagedEncoding) && faceProfile.averagedEncoding.length > 0) {
    return faceProfile.averagedEncoding.map(Number);
  }

  if (Array.isArray(faceProfile.faceEncoding) && faceProfile.faceEncoding.length > 0) {
    return faceProfile.faceEncoding.map(Number);
  }

  if (Array.isArray(faceProfile.encodings) && Array.isArray(faceProfile.encodings[0])) {
    return faceProfile.encodings[0].map(Number);
  }

  return null;
}

function euclideanDistance(a, b) {
  if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length || a.length === 0) {
    return null;
  }

  let total = 0;
  for (let i = 0; i < a.length; i += 1) {
    total += (Number(a[i]) - Number(b[i])) ** 2;
  }

  return Math.sqrt(total);
}

async function listEmployeesWithFaces() {
  const [rows] = await pool.query(
    `SELECT id, name, cnic, face_encoding, status
     FROM employees
     WHERE face_encoding IS NOT NULL`
  );

  return rows
    .map((row) => {
      const faceProfile = safeParseFaceProfile(row.face_encoding);
      const primaryEncoding = getPrimaryEncoding(faceProfile);
      if (!primaryEncoding) {
        return null;
      }

      return {
        employeeId: Number(row.id),
        name: row.name,
        cnic: row.cnic,
        status: row.status,
        faceProfile,
        primaryEncoding
      };
    })
    .filter(Boolean);
}

export async function findDuplicateFaceEnrollment({ employeeId, faceProfile }) {
  const subjectEncoding = getPrimaryEncoding(faceProfile);
  if (!subjectEncoding) {
    return null;
  }

  const employees = await listEmployeesWithFaces();
  let closest = null;

  for (const employee of employees) {
    if (Number(employee.employeeId) === Number(employeeId)) {
      continue;
    }

    const distance = euclideanDistance(subjectEncoding, employee.primaryEncoding);
    if (distance === null) {
      continue;
    }

    if (distance <= FACE_DUPLICATE_CONFLICT_THRESHOLD) {
      if (!closest || distance < closest.distance) {
        closest = {
          employeeId: employee.employeeId,
          name: employee.name,
          cnic: employee.cnic,
          status: employee.status,
          distance: Number(distance.toFixed(4)),
          threshold: FACE_DUPLICATE_CONFLICT_THRESHOLD
        };
      }
    }
  }

  return closest;
}

export async function listPotentialFaceConflicts(employeeId = null) {
  const employees = await listEmployeesWithFaces();
  const conflicts = [];

  for (let i = 0; i < employees.length; i += 1) {
    for (let j = i + 1; j < employees.length; j += 1) {
      const a = employees[i];
      const b = employees[j];
      const distance = euclideanDistance(a.primaryEncoding, b.primaryEncoding);

      if (distance === null || distance > FACE_DUPLICATE_CONFLICT_THRESHOLD) {
        continue;
      }

      if (
        employeeId !== null &&
        Number(a.employeeId) !== Number(employeeId) &&
        Number(b.employeeId) !== Number(employeeId)
      ) {
        continue;
      }

      conflicts.push({
        employeeA: {
          employeeId: a.employeeId,
          name: a.name,
          cnic: a.cnic,
          status: a.status
        },
        employeeB: {
          employeeId: b.employeeId,
          name: b.name,
          cnic: b.cnic,
          status: b.status
        },
        distance: Number(distance.toFixed(4)),
        threshold: FACE_DUPLICATE_CONFLICT_THRESHOLD,
        summary: `Face profiles for ${a.name} (#${a.employeeId}) and ${b.name} (#${b.employeeId}) are too similar and require review.`,
        remediation: "Re-enroll the correct employee with fresh samples and remove the incorrect face profile."
      });
    }
  }

  return conflicts.sort((left, right) => left.distance - right.distance);
}

