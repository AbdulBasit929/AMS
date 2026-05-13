import { Router } from "express";
import { requireAuth, requireRole } from "../middleware/authMiddleware.js";
import { logAudit } from "../services/auditService.js";
import {
  createApprovalRequest,
  createLeaveRequest,
  decideApprovalRequest,
  decideLeaveRequest,
  deleteHoliday,
  deleteShiftAssignment,
  getWorkforceOverview,
  listApprovalRequests,
  listDevicePolicies,
  listHolidays,
  listLeaveRequests,
  listShiftAssignments,
  listShifts,
  saveDevicePolicy,
  saveHoliday,
  saveShift,
  saveShiftAssignment
} from "../services/workforceService.js";

const router = Router();

router.get("/overview", requireAuth, async (_req, res) => {
  res.json(await getWorkforceOverview());
});

router.get("/shifts", requireAuth, async (_req, res) => {
  res.json(await listShifts());
});

router.post("/shifts", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const shift = await saveShift(req.body || {});

  await logAudit({
    actorUserId: req.user.id,
    eventType: "shift.save",
    targetType: "shift",
    targetId: shift.id,
    summary: `Shift '${shift.name}' was saved.`,
    metadata: shift
  });

  res.status(201).json(shift);
});

router.put("/shifts/:id", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const shift = await saveShift({ ...(req.body || {}), id: Number(req.params.id) });

  await logAudit({
    actorUserId: req.user.id,
    eventType: "shift.save",
    targetType: "shift",
    targetId: shift.id,
    summary: `Shift '${shift.name}' was updated.`,
    metadata: shift
  });

  res.json(shift);
});

router.get("/assignments", requireAuth, async (req, res) => {
  const employeeId = req.query.employeeId ? Number(req.query.employeeId) : null;
  res.json(await listShiftAssignments(employeeId));
});

router.post("/assignments", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const assignment = await saveShiftAssignment(req.body || {});

  await logAudit({
    actorUserId: req.user.id,
    eventType: "shift.assignment",
    targetType: "employee",
    targetId: assignment.employeeId,
    summary: `Shift assignment created for employee #${assignment.employeeId}.`,
    metadata: assignment
  });

  res.status(201).json(assignment);
});

router.delete("/assignments/:id", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  await deleteShiftAssignment(Number(req.params.id));
  res.json({ status: "deleted", id: Number(req.params.id) });
});

router.get("/device-policies", requireAuth, async (_req, res) => {
  res.json(await listDevicePolicies());
});

router.post("/device-policies", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const policy = await saveDevicePolicy(req.body || {});

  await logAudit({
    actorUserId: req.user.id,
    eventType: "device-policy.save",
    targetType: "device_policy",
    targetId: policy.id,
    summary: `Device policy '${policy.deviceName}' was saved.`,
    metadata: policy
  });

  res.status(201).json(policy);
});

router.put("/device-policies/:id", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const policy = await saveDevicePolicy({ ...(req.body || {}), id: Number(req.params.id) });

  await logAudit({
    actorUserId: req.user.id,
    eventType: "device-policy.save",
    targetType: "device_policy",
    targetId: policy.id,
    summary: `Device policy '${policy.deviceName}' was updated.`,
    metadata: policy
  });

  res.json(policy);
});

router.get("/holidays", requireAuth, async (req, res) => {
  res.json(await listHolidays({
    from: req.query.from || null,
    to: req.query.to || null
  }));
});

router.post("/holidays", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const holiday = await saveHoliday(req.body || {});

  await logAudit({
    actorUserId: req.user.id,
    eventType: "holiday.save",
    targetType: "holiday",
    targetId: holiday.id,
    summary: `Holiday '${holiday.name}' was saved for ${holiday.holidayDate}.`,
    metadata: holiday
  });

  res.status(201).json(holiday);
});

router.delete("/holidays/:id", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  await deleteHoliday(Number(req.params.id));
  res.json({ status: "deleted", id: Number(req.params.id) });
});

router.get("/leave-requests", requireAuth, async (req, res) => {
  res.json(await listLeaveRequests({
    status: req.query.status || null,
    employeeId: req.query.employeeId ? Number(req.query.employeeId) : null
  }));
});

router.post("/leave-requests", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const leaveRequest = await createLeaveRequest(req.body || {}, req.user.id);

  await logAudit({
    actorUserId: req.user.id,
    eventType: "leave.request",
    targetType: "employee",
    targetId: leaveRequest.employeeId,
    summary: `Leave request created for employee #${leaveRequest.employeeId}.`,
    metadata: leaveRequest
  });

  res.status(201).json(leaveRequest);
});

router.post("/leave-requests/:id/decision", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const result = await decideLeaveRequest(
    Number(req.params.id),
    req.body?.decision,
    req.user.id,
    req.body?.notes || null
  );

  await logAudit({
    actorUserId: req.user.id,
    eventType: "leave.decision",
    targetType: "leave_request",
    targetId: result.id,
    summary: `Leave request #${result.id} was ${result.status}.`,
    metadata: {
      decision: result.status,
      notes: req.body?.notes || null
    }
  });

  res.json(result);
});

router.get("/approval-requests", requireAuth, async (req, res) => {
  res.json(await listApprovalRequests({
    status: req.query.status || null,
    employeeId: req.query.employeeId ? Number(req.query.employeeId) : null
  }));
});

router.post("/approval-requests", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const request = await createApprovalRequest(req.body || {}, req.user.id);

  await logAudit({
    actorUserId: req.user.id,
    eventType: "attendance.approval.request",
    targetType: "employee",
    targetId: request.employeeId,
    summary: `Attendance approval request created for employee #${request.employeeId}.`,
    metadata: request
  });

  res.status(201).json(request);
});

router.post("/approval-requests/:id/decision", requireAuth, requireRole("admin", "operator"), async (req, res) => {
  const result = await decideApprovalRequest(
    Number(req.params.id),
    req.body?.decision,
    req.user.id,
    req.body?.notes || null
  );

  await logAudit({
    actorUserId: req.user.id,
    eventType: "attendance.approval.decision",
    targetType: "attendance_approval_request",
    targetId: result.id,
    summary: `Attendance approval request #${result.id} was ${result.status}.`,
    metadata: {
      decision: result.status,
      notes: req.body?.notes || null
    }
  });

  res.json(result);
});

export default router;
