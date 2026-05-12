import { Router } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/db.js";
import { requireAuth } from "../middleware/authMiddleware.js";
import { verifyPassword } from "../services/passwordService.js";

const router = Router();

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: "email and password are required" });
  }

  const [rows] = await pool.query(
    `SELECT id, name, email, password_hash, role
     FROM admin_users
     WHERE email = ?
     LIMIT 1`,
    [email]
  );

  if (rows.length === 0 || !verifyPassword(password, rows[0].password_hash)) {
    return res.status(401).json({ message: "invalid email or password" });
  }

  const user = rows[0];
  const token = jwt.sign(
    {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || "replace-with-a-strong-secret",
    { expiresIn: "12h" }
  );

  res.json({
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
});

router.get("/me", requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, name, email, role, created_at
     FROM admin_users
     WHERE id = ?
     LIMIT 1`,
    [req.user.id]
  );

  if (rows.length === 0) {
    return res.status(404).json({ message: "user not found" });
  }

  res.json(rows[0]);
});

export default router;
