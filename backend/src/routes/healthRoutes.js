import { Router } from "express";
import pool from "../config/db.js";

const router = Router();

router.get("/", async (_req, res) => {
  try {
    await pool.query("SELECT 1");

    res.json({
      status: "ok",
      database: "connected",
      service: "attendance-backend"
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: error.message
    });
  }
});

export default router;

