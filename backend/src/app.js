import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";

import healthRoutes from "./routes/healthRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import biometricRoutes from "./routes/biometricRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import dashboardRoutes from "./routes/dashboardRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import auditRoutes from "./routes/auditRoutes.js";
import workforceRoutes from "./routes/workforceRoutes.js";

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(morgan("dev"));

app.get("/", (_req, res) => {
  res.json({
    name: "attendance-backend",
    version: "1.0.0"
  });
});

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/employees", employeeRoutes);
app.use("/api/attendance", attendanceRoutes);
app.use("/api/workforce", workforceRoutes);
app.use("/api/biometrics", biometricRoutes);
app.use("/api/audit-logs", auditRoutes);

app.use((error, _req, res, _next) => {
  res.status(500).json({
    message: error.message || "internal server error"
  });
});

export default app;
