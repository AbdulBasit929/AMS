import crypto from "crypto";
import jwt from "jsonwebtoken";

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

function verifyJwtToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || "replace-with-a-strong-secret");
}

function matchesTrustedStationKey(providedKey) {
  const configuredKey = process.env.BIOMETRIC_SHARED_KEY?.trim();
  if (!configuredKey || !providedKey) {
    return false;
  }

  const providedBuffer = Buffer.from(String(providedKey));
  const configuredBuffer = Buffer.from(configuredKey);

  if (providedBuffer.length !== configuredBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuffer, configuredBuffer);
}

export function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "authorization token is required" });
  }

  try {
    req.user = verifyJwtToken(token);
    next();
  } catch (_error) {
    return res.status(401).json({ message: "invalid or expired token" });
  }
}

export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "authentication is required" });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "you do not have permission for this action" });
    }

    next();
  };
}

export function requireTrustedStation(req, res, next) {
  const token = getTokenFromRequest(req);
  if (token) {
    try {
      req.user = verifyJwtToken(token);
      return next();
    } catch {
      // Fall through to trusted station key validation.
    }
  }

  const providedKey = req.headers["x-station-key"];
  if (matchesTrustedStationKey(providedKey)) {
    req.station = { trusted: true, mode: "shared-key" };
    return next();
  }

  const configuredKey = process.env.BIOMETRIC_SHARED_KEY?.trim();
  const originHeader = req.headers.origin;

  // Backward-compatible fallback for local desktop helpers that do not send browser Origin headers yet.
  if (!configuredKey && !originHeader) {
    req.station = { trusted: true, mode: "originless-fallback" };
    return next();
  }

  return res.status(401).json({
    message: configuredKey
      ? "trusted station key or valid user token is required"
      : "configure BIOMETRIC_SHARED_KEY or use an authenticated session"
  });
}
