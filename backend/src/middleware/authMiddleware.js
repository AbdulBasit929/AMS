import jwt from "jsonwebtoken";

function getTokenFromRequest(req) {
  const authHeader = req.headers.authorization || "";
  if (!authHeader.startsWith("Bearer ")) {
    return null;
  }

  return authHeader.slice("Bearer ".length).trim();
}

export function requireAuth(req, res, next) {
  const token = getTokenFromRequest(req);
  if (!token) {
    return res.status(401).json({ message: "authorization token is required" });
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "replace-with-a-strong-secret");
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
