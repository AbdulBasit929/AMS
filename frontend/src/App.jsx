import { useEffect, useMemo, useRef, useState } from "react";

const apiBaseUrl = "http://127.0.0.1:4000";
const defaultCredentials = {
  email: "admin@attendance.local",
  password: "Admin@12345"
};

function formatFingerLabel(fingerCode) {
  return (fingerCode || "")
    .split("_")
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildStationEvent(auditRow) {
  if (!auditRow) {
    return null;
  }

  const tone =
    auditRow.event_type === "attendance.check_in"
      ? "success"
      : auditRow.event_type === "attendance.check_out"
        ? "warning"
        : auditRow.event_type === "attendance.already_closed"
          ? "danger"
          : "info";

  const label =
    auditRow.event_type === "attendance.check_in"
      ? "Check-In Recorded"
      : auditRow.event_type === "attendance.check_out"
        ? "Check-Out Recorded"
        : auditRow.event_type === "attendance.already_closed"
          ? "Attendance Closed"
          : "Attendance Event";

  return {
    tone,
    label,
    summary: auditRow.summary,
    when: auditRow.created_at
  };
}

async function callApi(path, options = {}, token) {
  const response = await fetch(`${apiBaseUrl}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    },
    ...options
  });

  const contentType = response.headers.get("content-type") || "";
  const data = contentType.includes("application/json")
    ? await response.json()
    : { message: await response.text() };

  return { ok: response.ok, status: response.status, data };
}

function MetricCard({ label, value, tone = "neutral", helper }) {
  return (
    <article className={`metric-card metric-card--${tone}`}>
      <p className="metric-card__label">{label}</p>
      <strong className="metric-card__value">{value}</strong>
      {helper ? <p className="metric-card__helper">{helper}</p> : null}
    </article>
  );
}

function ServicePill({ label, status, message }) {
  const tone =
    status === "ok"
      ? "success"
      : status === "warning" || status === "todo" || status === "loading"
        ? "warning"
        : "danger";
  return (
    <article className={`service-pill service-pill--${tone}`}>
      <div>
        <p className="service-pill__label">{label}</p>
        <strong className="service-pill__status">{status}</strong>
      </div>
      <p className="service-pill__message">{message}</p>
    </article>
  );
}

function App() {
  const [token, setToken] = useState(() => localStorage.getItem("attendance_token") || "");
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [authForm, setAuthForm] = useState(defaultCredentials);
  const [authError, setAuthError] = useState("");
  const [loadingAuth, setLoadingAuth] = useState(false);

  const [overview, setOverview] = useState(null);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [auditRows, setAuditRows] = useState([]);
  const [latestStationEvent, setLatestStationEvent] = useState(null);
  const [fingerprintConflicts, setFingerprintConflicts] = useState({ exactDuplicates: [], recentConflicts: [] });
  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [employeeHistory, setEmployeeHistory] = useState([]);
  const [employeeFingerprints, setEmployeeFingerprints] = useState([]);
  const [fingerprintPlan, setFingerprintPlan] = useState(null);
  const [selectedEmployeeConflicts, setSelectedEmployeeConflicts] = useState({ exactDuplicates: [], recentConflicts: [] });
  const [reportsFilter, setReportsFilter] = useState({
    dateFrom: "",
    dateTo: "",
    method: "",
    status: ""
  });
  const [stationStatus, setStationStatus] = useState({
    fingerprint: { status: "loading", message: "Checking fingerprint desktop verifier..." },
    face: { status: "loading", message: "Checking face service..." }
  });
  const [stationMessage, setStationMessage] = useState("");
  const [employeeForm, setEmployeeForm] = useState({
    id: null,
    employeeCode: "",
    name: "",
    cnic: "",
    department: "",
    designation: "",
    status: "active",
    profileImage: ""
  });

  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [faceActionMessage, setFaceActionMessage] = useState("");
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const navigation = useMemo(() => {
    const tabs = [
      { id: "dashboard", label: "Dashboard" },
      { id: "station", label: "Attendance Station" },
      { id: "reports", label: "Reports" }
    ];

    if (user?.role === "admin" || user?.role === "operator") {
      tabs.splice(2, 0, { id: "employees", label: "Employees" });
    }

    return tabs;
  }, [user]);

  useEffect(() => {
    if (!token) {
      setUser(null);
      return;
    }

    let cancelled = false;

    async function loadMe() {
      const result = await callApi("/api/auth/me", {}, token);
      if (cancelled) {
        return;
      }

      if (!result.ok) {
        localStorage.removeItem("attendance_token");
        setToken("");
        setUser(null);
        setAuthError("Session expired. Please log in again.");
        return;
      }

      setUser(result.data);
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (!user) {
      return;
    }

    refreshOverview();
    refreshEmployees();
    refreshAttendanceReports();
    refreshStationStatus();
    refreshFingerprintConflicts();
  }, [user]);

  useEffect(() => {
    setLatestStationEvent(buildStationEvent(auditRows.find((row) => row.event_type?.startsWith("attendance."))));
  }, [auditRows]);

  useEffect(() => {
    if (!user || activeView !== "station") {
      return undefined;
    }

    const interval = window.setInterval(() => {
      refreshOverview();
      refreshAttendanceReports();
      refreshStationStatus();
      refreshFingerprintConflicts();
    }, 4000);

    return () => window.clearInterval(interval);
  }, [activeView, user, token]);

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  async function handleLogin(event) {
    event.preventDefault();
    setLoadingAuth(true);
    setAuthError("");

    const result = await callApi("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(authForm)
    });

    setLoadingAuth(false);

    if (!result.ok) {
      setAuthError(result.data.message || "Login failed.");
      return;
    }

    localStorage.setItem("attendance_token", result.data.token);
    setToken(result.data.token);
    setUser(result.data.user);
    setActiveView("dashboard");
  }

  function handleLogout() {
    stopCamera();
    localStorage.removeItem("attendance_token");
    setToken("");
    setUser(null);
    setOverview(null);
    setEmployees([]);
    setAttendanceRows([]);
    setSelectedEmployee(null);
    setEmployeeFingerprints([]);
    setFingerprintPlan(null);
  }

  async function refreshOverview() {
    const result = await callApi("/api/dashboard/overview", {}, token);
    if (result.ok) {
      setOverview(result.data);
      setAuditRows(result.data.recentAuditLogs || []);
    }
  }

  async function refreshEmployees() {
    const result = await callApi("/api/employees", {}, token);
    if (result.ok) {
      setEmployees(result.data);
    }
  }

  async function refreshFingerprintConflicts(employeeId = null) {
    const query = new URLSearchParams();
    if (employeeId) {
      query.set("employeeId", String(employeeId));
    }

    const result = await callApi(`/api/biometrics/fingerprint/conflicts${query.toString() ? `?${query}` : ""}`, {}, token);
    if (!result.ok) {
      return;
    }

    if (employeeId) {
      setSelectedEmployeeConflicts(result.data);
    } else {
      setFingerprintConflicts(result.data);
    }
  }

  async function refreshAttendanceReports() {
    const query = new URLSearchParams();
    Object.entries(reportsFilter).forEach(([key, value]) => {
      if (value) {
        query.set(key, value);
      }
    });

    const result = await callApi(`/api/attendance${query.toString() ? `?${query}` : ""}`, {}, token);
    if (result.ok) {
      setAttendanceRows(result.data);
    }
  }

  async function exportAttendanceCsv() {
    const query = new URLSearchParams();
    Object.entries(reportsFilter).forEach(([key, value]) => {
      if (value) {
        query.set(key, value);
      }
    });

    const response = await fetch(`${apiBaseUrl}/api/attendance/export.csv${query.toString() ? `?${query}` : ""}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });

    if (!response.ok) {
      alert("Could not export attendance CSV.");
      return;
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `attendance-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  }

  async function refreshStationStatus() {
    const [fingerprint, face] = await Promise.all([
      callApi("/api/biometrics/fingerprint/status", {}, token),
      callApi("/api/biometrics/face/status", {}, token)
    ]);

    setStationStatus({
      fingerprint: fingerprint.data,
      face: face.data
    });
  }

  async function loadEmployeeHistory(employeeId) {
    const result = await callApi(`/api/employees/${employeeId}/attendance`, {}, token);
    if (result.ok) {
      setEmployeeHistory(result.data);
    }
  }

  async function loadEmployeeFingerprints(employeeId) {
    const result = await callApi(`/api/employees/${employeeId}/fingerprints`, {}, token);
    if (result.ok) {
      setEmployeeFingerprints(result.data);
    }
  }

  async function loadFingerprintPlan(employeeId) {
    const result = await callApi(`/api/employees/${employeeId}/fingerprint-plan`, {}, token);
    if (result.ok) {
      setFingerprintPlan(result.data);
    }
  }

  async function refreshSelectedEmployeeDetails(employeeId) {
    await Promise.all([
      loadEmployeeHistory(employeeId),
      loadEmployeeFingerprints(employeeId),
      loadFingerprintPlan(employeeId),
      refreshFingerprintConflicts(employeeId),
      refreshEmployees()
    ]);
  }

  function startCreateEmployee() {
    setSelectedEmployee(null);
    setEmployeeHistory([]);
    setEmployeeFingerprints([]);
    setFingerprintPlan(null);
    setSelectedEmployeeConflicts({ exactDuplicates: [], recentConflicts: [] });
    setEmployeeForm({
      id: null,
      employeeCode: "",
      name: "",
      cnic: "",
      department: "",
      designation: "",
      status: "active",
      profileImage: ""
    });
  }

  function startEditEmployee(employee) {
    setSelectedEmployee(employee);
    setEmployeeForm({
      id: employee.id,
      employeeCode: employee.employee_code || "",
      name: employee.name || "",
      cnic: employee.cnic || "",
      department: employee.department || "",
      designation: employee.designation || "",
      status: employee.status || "active",
      profileImage: employee.profile_image || ""
    });
    refreshSelectedEmployeeDetails(employee.id);
  }

  async function saveEmployee(event) {
    event.preventDefault();

    const payload = {
      employeeCode: employeeForm.employeeCode,
      name: employeeForm.name,
      cnic: employeeForm.cnic,
      department: employeeForm.department,
      designation: employeeForm.designation,
      status: employeeForm.status,
      profileImage: employeeForm.profileImage
    };

    const path = employeeForm.id ? `/api/employees/${employeeForm.id}` : "/api/employees";
    const method = employeeForm.id ? "PUT" : "POST";

    const result = await callApi(path, {
      method,
      body: JSON.stringify(payload)
    }, token);

    if (!result.ok) {
      alert(result.data.message || "Could not save employee.");
      return;
    }

    await refreshEmployees();
    if (employeeForm.id) {
      const refreshed = await callApi(`/api/employees/${employeeForm.id}`, {}, token);
      if (refreshed.ok) {
        startEditEmployee(refreshed.data);
      }
    } else {
      startCreateEmployee();
    }
  }

  async function markManualAttendance(employeeId) {
    const result = await callApi("/api/attendance/manual-mark", {
      method: "POST",
      body: JSON.stringify({ employeeId })
    }, token);

    if (!result.ok) {
      alert(result.data.message || "Could not mark attendance.");
      return;
    }

    setStationMessage(`Manual attendance ${result.data.attendance.action} for employee #${employeeId}.`);
    await refreshOverview();
    await refreshAttendanceReports();
  }

  async function launchFingerprintVerification(employeeId = null) {
    const result = await callApi("/api/biometrics/fingerprint/launch-verify", {
      method: "POST",
      body: JSON.stringify(employeeId ? { employeeId } : {})
    }, token);

    setStationMessage(result.data.message || result.data.status || "Fingerprint verifier launch requested.");
    await refreshStationStatus();
    await refreshOverview();
  }

  async function launchFingerprintEnrollment(employeeId, fingerCode) {
    const result = await callApi("/api/biometrics/fingerprint/launch-enroll", {
      method: "POST",
      body: JSON.stringify({ employeeId, fingerCode })
    }, token);

    setStationMessage(result.data.message || result.data.status || "Fingerprint enrollment launch requested.");
    await refreshStationStatus();
    await refreshOverview();
  }

  async function setPreferredFinger(employeeId, fingerprintId) {
    const result = await callApi(`/api/employees/${employeeId}/fingerprints/${fingerprintId}/prefer`, {
      method: "POST"
    }, token);

    if (!result.ok) {
      alert(result.data.message || "Could not set preferred finger.");
      return;
    }

    await refreshSelectedEmployeeDetails(employeeId);
    await refreshOverview();
    await refreshFingerprintConflicts();
  }

  async function deleteFingerSlot(employeeId, fingerprintId) {
    const confirmed = window.confirm("Delete this fingerprint slot? This action cannot be undone.");
    if (!confirmed) {
      return;
    }

    const result = await callApi(`/api/employees/${employeeId}/fingerprints/${fingerprintId}`, {
      method: "DELETE"
    }, token);

    if (!result.ok) {
      alert(result.data.message || "Could not delete fingerprint slot.");
      return;
    }

    await refreshSelectedEmployeeDetails(employeeId);
    await refreshOverview();
    await refreshFingerprintConflicts();
  }

  const globalFingerprintConflictCount =
    (fingerprintConflicts.exactDuplicates?.length || 0) +
    (fingerprintConflicts.recentConflicts?.length || 0);

  const selectedEmployeeConflictCount =
    (selectedEmployeeConflicts.exactDuplicates?.length || 0) +
    (selectedEmployeeConflicts.recentConflicts?.length || 0);

  async function startCamera() {
    setCameraError("");

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setCameraActive(true);
    } catch (error) {
      setCameraError(error.message);
    }
  }

  function stopCamera() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
  }

  function captureFrame() {
    if (!videoRef.current) {
      return null;
    }

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 1280;
    canvas.height = video.videoHeight || 720;
    const context = canvas.getContext("2d");
    context.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL("image/jpeg", 0.92);
  }

  async function enrollFaceForSelectedEmployee() {
    if (!selectedEmployee?.id) {
      setFaceActionMessage("Select an employee first.");
      return;
    }

    const imageBase64 = captureFrame();
    if (!imageBase64) {
      setFaceActionMessage("Start the webcam first.");
      return;
    }

    const result = await callApi("/api/biometrics/face/enroll", {
      method: "POST",
      body: JSON.stringify({
        employeeId: selectedEmployee.id,
        imageBase64,
        profileImage: imageBase64
      })
    }, token);

    setFaceActionMessage(result.data.message || result.data.status || "Face enroll request completed.");

    if (result.ok) {
      await refreshEmployees();
    }
  }

  async function verifyFaceAttendance() {
    const imageBase64 = captureFrame();
    if (!imageBase64) {
      setFaceActionMessage("Start the webcam first.");
      return;
    }

    const result = await callApi("/api/biometrics/face/verify", {
      method: "POST",
      body: JSON.stringify({ imageBase64 })
    }, token);

    setFaceActionMessage(result.data.message || result.data.status || "Face verification completed.");

    if (result.ok) {
      await refreshOverview();
      await refreshAttendanceReports();
    }
  }

  if (!user) {
    return (
      <main className="auth-shell">
        <section className="auth-panel">
          <p className="eyebrow">Attendance Management System</p>
          <h1>Biometric Workforce Station</h1>
          <p className="auth-copy">
            Sign in as an administrator or operator to manage employees, monitor attendance,
            and run biometric workflows.
          </p>

          <form className="auth-form" onSubmit={handleLogin}>
            <label>
              <span>Email</span>
              <input
                type="email"
                value={authForm.email}
                onChange={(event) => setAuthForm((current) => ({ ...current, email: event.target.value }))}
              />
            </label>

            <label>
              <span>Password</span>
              <input
                type="password"
                value={authForm.password}
                onChange={(event) => setAuthForm((current) => ({ ...current, password: event.target.value }))}
              />
            </label>

            <button type="submit" disabled={loadingAuth}>
              {loadingAuth ? "Signing In..." : "Sign In"}
            </button>
          </form>

          {authError ? <p className="auth-error">{authError}</p> : null}

          <div className="auth-tip">
            <strong>Bootstrap admin</strong>
            <p>{defaultCredentials.email}</p>
            <p>{defaultCredentials.password}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <p className="eyebrow">Attendance OS</p>
          <h2>BioTime Station</h2>
          <p className="brand__copy">Fingerprint-first attendance with face-readiness and live reporting.</p>
        </div>

        <nav className="nav">
          {navigation.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`nav__item ${activeView === item.id ? "nav__item--active" : ""}`}
              onClick={() => setActiveView(item.id)}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="user-card">
          <p className="user-card__name">{user.name}</p>
          <p className="user-card__meta">{user.email}</p>
          <span className="user-card__role">{user.role}</span>
          <button type="button" className="ghost-button" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </aside>

      <section className="workspace">
        {activeView === "dashboard" && (
          <section className="view">
            <header className="view__header">
              <div>
                <p className="eyebrow">Live Operations</p>
                <h1>Dashboard</h1>
              </div>
              <button type="button" onClick={refreshOverview}>Refresh</button>
            </header>

            <div className="metrics-grid">
              <MetricCard label="Total Employees" value={overview?.employeeStats?.totalEmployees ?? 0} />
              <MetricCard label="Active Employees" value={overview?.employeeStats?.activeEmployees ?? 0} tone="success" />
              <MetricCard label="Fingerprint Enrolled" value={overview?.employeeStats?.fingerprintEnrolled ?? 0} />
              <MetricCard label="Stored Finger Slots" value={overview?.employeeStats?.fingerprintTemplates ?? 0} tone="success" helper="Multiple fingers can be enrolled per employee." />
              <MetricCard label="Face Enrolled" value={overview?.employeeStats?.faceEnrolled ?? 0} tone="warning" helper="Face service depends on Python CV libraries." />
              <MetricCard label="Today Check-ins" value={overview?.todayStats?.checkIns ?? 0} />
              <MetricCard label="Open Sessions" value={overview?.todayStats?.openSessions ?? 0} tone="danger" />
            </div>

            <section className="panel">
              <div className="panel__header">
                <h2>Recent Attendance</h2>
                <p>Latest biometric and manual entries.</p>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Methods</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(overview?.recentAttendance || []).map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.name}</strong>
                          <span>{row.employee_code || "No code"}</span>
                        </td>
                        <td>{row.date}</td>
                        <td>{row.check_in ? new Date(row.check_in).toLocaleString() : "-"}</td>
                        <td>{row.check_out ? new Date(row.check_out).toLocaleString() : "-"}</td>
                        <td>{row.check_in_method || "-"} / {row.check_out_method || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <div className="panel__header">
                <h2>Audit Trail</h2>
                <p>Recent security and operational events.</p>
              </div>
              {globalFingerprintConflictCount > 0 ? (
                <p className="banner banner--danger">
                  {globalFingerprintConflictCount} fingerprint conflict signal{globalFingerprintConflictCount > 1 ? "s are" : " is"} active. Review the remediation panel before relying on global attendance verification.
                </p>
              ) : null}
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Event</th>
                      <th>Target</th>
                      <th>Actor</th>
                      <th>When</th>
                    </tr>
                  </thead>
                  <tbody>
                    {auditRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.summary}</strong>
                          <span>{row.event_type}</span>
                        </td>
                        <td>{row.target_type} #{row.target_id || "-"}</td>
                        <td>{row.actor_name || "System / Device"}</td>
                        <td>{new Date(row.created_at).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        )}

        {activeView === "station" && (
          <section className="view">
            <header className="view__header">
              <div>
                <p className="eyebrow">Operator Console</p>
                <h1>Attendance Station</h1>
              </div>
              <button type="button" onClick={refreshStationStatus}>Refresh Services</button>
            </header>

            <div className="service-grid">
              <ServicePill label="Fingerprint Verifier" status={stationStatus.fingerprint.status || "unknown"} message={stationStatus.fingerprint.message || "No message"} />
              <ServicePill label="Biometric Agent" status={stationStatus.fingerprint.mode === "local-agent" ? "ok" : "warning"} message={stationStatus.fingerprint.mode === "local-agent" ? "Browser-triggered fingerprint workflows are available through the local agent." : "Start the local biometric agent to trigger fingerprint workflows from the browser."} />
              <ServicePill label="Face Service" status={stationStatus.face.status || "unknown"} message={stationStatus.face.message || "No message"} />
            </div>

            <div className="station-grid">
              <section className="panel panel--accent">
                <div className="panel__header">
                  <h2>Fingerprint Workflow</h2>
                  <p>Fingerprint scanning runs through the Windows desktop verifier because the HID reader uses native SDK controls.</p>
                </div>
                <div className="instruction-list">
                  <p>1. Keep backend running on port `4000`.</p>
                  <p>2. Start the local biometric agent, then use `Launch Fingerprint Verification` below.</p>
                  <p>3. Touch the enrolled finger and let the desktop verifier mark attendance automatically.</p>
                  <p>4. Use the employee panel or lifecycle cards to launch enrollment for missing backup fingers.</p>
                  <p>5. Refresh this station to confirm the latest attendance entry and helper status.</p>
                </div>
                {globalFingerprintConflictCount > 0 ? (
                  <p className="banner banner--danger">
                    Global fingerprint verification is in guarded mode because conflict signals exist. Resolve duplicate ownership issues before using the station broadly.
                  </p>
                ) : null}
                {latestStationEvent ? (
                  <div className={`station-event station-event--${latestStationEvent.tone}`}>
                    <p className="station-event__label">{latestStationEvent.label}</p>
                    <strong className="station-event__summary">{latestStationEvent.summary}</strong>
                    <span className="station-event__time">{new Date(latestStationEvent.when).toLocaleString()}</span>
                  </div>
                ) : null}
                {stationMessage ? <p className="banner banner--info">{stationMessage}</p> : null}
                <p className="banner banner--info">
                  The browser UI triggers native fingerprint workflows through the local Windows biometric agent, which launches the HID helper apps professionally on this workstation.
                </p>
                <div className="actions">
                  <button type="button" onClick={() => launchFingerprintVerification()}>Launch Fingerprint Verification</button>
                  <button type="button" onClick={refreshOverview}>Refresh Attendance Feed</button>
                  <button type="button" onClick={refreshStationStatus}>Refresh Fingerprint Status</button>
                </div>
              </section>

              <section className="panel">
                <div className="panel__header">
                  <h2>Face Recognition Workflow</h2>
                  <p>Designed for the Logitech HD 1080p webcam through browser capture.</p>
                </div>
                <div className="camera-card">
                  <video ref={videoRef} autoPlay muted playsInline className="camera-preview" />
                  {cameraError ? <p className="banner banner--danger">{cameraError}</p> : null}
                  {faceActionMessage ? <p className="banner banner--info">{faceActionMessage}</p> : null}
                  <div className="actions">
                    {!cameraActive ? (
                      <button type="button" onClick={startCamera}>Start Logitech Camera</button>
                    ) : (
                      <button type="button" className="ghost-button" onClick={stopCamera}>Stop Camera</button>
                    )}
                    <button type="button" onClick={verifyFaceAttendance}>Verify Face Attendance</button>
                  </div>
                </div>
              </section>
            </div>
          </section>
        )}

        {activeView === "employees" && (
          <section className="view">
            <header className="view__header">
              <div>
                <p className="eyebrow">Workforce Registry</p>
                <h1>Employee Management</h1>
              </div>
              <button type="button" onClick={startCreateEmployee}>New Employee</button>
            </header>

            <div className="employees-layout">
              <section className="panel">
                <div className="panel__header">
                  <h2>Employees</h2>
                  <p>Biometric status, departments, and quick operator actions.</p>
                </div>
                <div className="employee-list">
                  {employees.map((employee) => (
                    <button
                      key={employee.id}
                      type="button"
                      className={`employee-card ${selectedEmployee?.id === employee.id ? "employee-card--active" : ""}`}
                      onClick={() => startEditEmployee(employee)}
                    >
                      <div>
                        <strong>{employee.name}</strong>
                        <p>{employee.employee_code || "No code"} | {employee.cnic}</p>
                      </div>
                      <div className="chip-row">
                        <span className={`chip ${employee.has_fingerprint ? "chip--success" : "chip--muted"}`}>
                          {employee.has_fingerprint ? `${employee.fingerprint_count || 1} Finger${(employee.fingerprint_count || 1) > 1 ? "s" : ""}` : "No Fingerprint"}
                        </span>
                        <span className={`chip ${employee.has_face ? "chip--warning" : "chip--muted"}`}>
                          {employee.has_face ? "Face" : "No Face"}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </section>

              <section className="panel">
                <div className="panel__header">
                  <h2>{employeeForm.id ? "Edit Employee" : "Create Employee"}</h2>
                  <p>Role-friendly registration with biometric status visibility.</p>
                </div>
                <form className="employee-form" onSubmit={saveEmployee}>
                  <label>
                    <span>Employee Code</span>
                    <input value={employeeForm.employeeCode} onChange={(event) => setEmployeeForm((current) => ({ ...current, employeeCode: event.target.value }))} />
                  </label>
                  <label>
                    <span>Name</span>
                    <input value={employeeForm.name} onChange={(event) => setEmployeeForm((current) => ({ ...current, name: event.target.value }))} required />
                  </label>
                  <label>
                    <span>CNIC</span>
                    <input value={employeeForm.cnic} onChange={(event) => setEmployeeForm((current) => ({ ...current, cnic: event.target.value }))} required />
                  </label>
                  <label>
                    <span>Department</span>
                    <input value={employeeForm.department} onChange={(event) => setEmployeeForm((current) => ({ ...current, department: event.target.value }))} />
                  </label>
                  <label>
                    <span>Designation</span>
                    <input value={employeeForm.designation} onChange={(event) => setEmployeeForm((current) => ({ ...current, designation: event.target.value }))} />
                  </label>
                  <label>
                    <span>Status</span>
                    <select value={employeeForm.status} onChange={(event) => setEmployeeForm((current) => ({ ...current, status: event.target.value }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </label>
                  <label className="field-span">
                    <span>Profile Image (base64 or URL)</span>
                    <textarea value={employeeForm.profileImage} onChange={(event) => setEmployeeForm((current) => ({ ...current, profileImage: event.target.value }))} rows={3} />
                  </label>
                  <div className="actions">
                    <button type="submit">{employeeForm.id ? "Save Changes" : "Create Employee"}</button>
                    <button type="button" className="ghost-button" onClick={startCreateEmployee}>Reset Form</button>
                  </div>
                </form>

                <div className="biometric-tools">
                  <h3>Biometric Productivity Tools</h3>
                  <p>Fingerprint enrollment and verification run through the local Windows helper apps because HID access is native-device based.</p>
                  <div className="instruction-list">
                    <p>Preferred browser-triggered flow: start the local biometric agent, then use the launch buttons below.</p>
                    <p>Direct helper fallback: run `attendance-system\fingerprint-enroll-ui\run.ps1` or `attendance-system\fingerprint-identify-ui\run.ps1`.</p>
                    <p>Selected employee ID: {selectedEmployee?.id || employeeForm.id || "Choose an employee"}</p>
                    <p>
                      Enrolled finger slots: {employeeFingerprints.length > 0
                        ? employeeFingerprints.map((item) => formatFingerLabel(item.finger_code)).join(", ")
                        : "None loaded yet"}
                    </p>
                  </div>
                  <div className="actions">
                    <button
                      type="button"
                      onClick={() => (selectedEmployee?.id || employeeForm.id) && launchFingerprintEnrollment(selectedEmployee?.id || employeeForm.id, fingerprintPlan?.missingRecommended?.[0]?.fingerCode || "right_index")}
                    >
                      Launch Fingerprint Enrollment
                    </button>
                    <button type="button" onClick={() => selectedEmployee?.id && launchFingerprintVerification(selectedEmployee.id)}>Verify Selected Employee Fingerprint</button>
                    <button type="button" onClick={enrollFaceForSelectedEmployee}>Enroll Face For Selected Employee</button>
                    <button type="button" onClick={() => selectedEmployee?.id && markManualAttendance(selectedEmployee.id)}>Manual Attendance For Selected Employee</button>
                  </div>
                </div>

                {selectedEmployee ? (
                  <div className="history-card">
                    <h3>Enrolled Fingerprints</h3>
                    <ul className="history-list">
                      {employeeFingerprints.length > 0 ? employeeFingerprints.map((fingerprint) => (
                        <li key={fingerprint.id}>
                          <strong>{formatFingerLabel(fingerprint.finger_code)}{fingerprint.is_preferred ? " (Preferred)" : ""}</strong>
                          <span>{fingerprint.template_format} | {fingerprint.source || "Unknown source"}</span>
                          <div className="actions">
                            {!fingerprint.is_preferred ? (
                              <button type="button" className="ghost-button" onClick={() => setPreferredFinger(selectedEmployee.id, fingerprint.id)}>Set Preferred</button>
                            ) : null}
                            <button type="button" className="ghost-button" onClick={() => launchFingerprintEnrollment(selectedEmployee.id, fingerprint.finger_code)}>Replace Slot</button>
                            <button type="button" className="ghost-button" onClick={() => deleteFingerSlot(selectedEmployee.id, fingerprint.id)}>Delete Slot</button>
                          </div>
                        </li>
                      )) : (
                        <li>
                          <strong>No enrolled fingers yet</strong>
                          <span>Use the enrollment helper app to add one or more fingers.</span>
                        </li>
                      )}
                    </ul>
                  </div>
                ) : null}

                {selectedEmployee ? (
                  <div className="history-card">
                    <h3>Fingerprint Conflict Remediation</h3>
                    {selectedEmployeeConflictCount > 0 ? (
                      <>
                        <p className="banner banner--danger">
                          This employee has fingerprint conflict signals. Remove or replace the affected slot before using global attendance verification.
                        </p>
                        <ul className="history-list">
                          {selectedEmployeeConflicts.exactDuplicates?.map((conflict) => (
                            <li key={`exact-${conflict.templateHash}`}>
                              <strong>Exact duplicate template detected</strong>
                              <span>{conflict.summary}</span>
                              <span>{conflict.remediation}</span>
                            </li>
                          ))}
                          {selectedEmployeeConflicts.recentConflicts?.map((conflict) => (
                            <li key={`event-${conflict.id}`}>
                              <strong>{conflict.summary}</strong>
                              <span>{new Date(conflict.createdAt).toLocaleString()}</span>
                              <span>{conflict.metadata?.stage ? `Stage: ${conflict.metadata.stage}` : "Conflict event logged."}</span>
                            </li>
                          ))}
                        </ul>
                      </>
                    ) : (
                      <p className="banner banner--info">
                        No fingerprint conflict signals are currently recorded for this employee.
                      </p>
                    )}
                  </div>
                ) : null}

                {selectedEmployee && fingerprintPlan ? (
                  <div className="history-card">
                    <h3>Recommended Backup Fingers</h3>
                    <ul className="history-list">
                      {fingerprintPlan.recommended.map((item) => (
                        <li key={item.fingerCode}>
                          <strong>{item.label}{item.isPreferred ? " (Preferred)" : ""}</strong>
                          <span>{item.enrolled ? "Already enrolled" : "Recommended backup slot"}</span>
                          {!item.enrolled ? (
                            <div className="actions">
                              <button type="button" onClick={() => launchFingerprintEnrollment(selectedEmployee.id, item.fingerCode)}>Enroll {item.label}</button>
                            </div>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                {selectedEmployee ? (
                  <div className="history-card">
                    <h3>Recent Attendance For {selectedEmployee.name}</h3>
                    <ul className="history-list">
                      {employeeHistory.map((row) => (
                        <li key={row.id}>
                          <strong>{row.date}</strong>
                          <span>{row.check_in ? new Date(row.check_in).toLocaleString() : "-"} / {row.check_out ? new Date(row.check_out).toLocaleString() : "-"}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </section>
            </div>
          </section>
        )}

        {activeView === "reports" && (
          <section className="view">
            <header className="view__header">
              <div>
                <p className="eyebrow">Insights</p>
                <h1>Attendance Reports</h1>
              </div>
              <div className="actions">
                <button type="button" className="ghost-button" onClick={exportAttendanceCsv}>Export CSV</button>
                <button type="button" onClick={refreshAttendanceReports}>Refresh Reports</button>
              </div>
            </header>

            <section className="panel">
              <div className="report-filters">
                <label>
                  <span>Date From</span>
                  <input type="date" value={reportsFilter.dateFrom} onChange={(event) => setReportsFilter((current) => ({ ...current, dateFrom: event.target.value }))} />
                </label>
                <label>
                  <span>Date To</span>
                  <input type="date" value={reportsFilter.dateTo} onChange={(event) => setReportsFilter((current) => ({ ...current, dateTo: event.target.value }))} />
                </label>
                <label>
                  <span>Method</span>
                  <select value={reportsFilter.method} onChange={(event) => setReportsFilter((current) => ({ ...current, method: event.target.value }))}>
                    <option value="">All</option>
                    <option value="fingerprint">Fingerprint</option>
                    <option value="face">Face</option>
                    <option value="manual">Manual</option>
                  </select>
                </label>
                <label>
                  <span>Status</span>
                  <select value={reportsFilter.status} onChange={(event) => setReportsFilter((current) => ({ ...current, status: event.target.value }))}>
                    <option value="">All</option>
                    <option value="open">Open Sessions</option>
                    <option value="closed">Closed Sessions</option>
                  </select>
                </label>
                <button type="button" onClick={refreshAttendanceReports}>Apply Filters</button>
              </div>

              <div className="table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>Employee</th>
                      <th>Date</th>
                      <th>Check In</th>
                      <th>Check Out</th>
                      <th>Devices</th>
                      <th>Methods</th>
                    </tr>
                  </thead>
                  <tbody>
                    {attendanceRows.map((row) => (
                      <tr key={row.id}>
                        <td>
                          <strong>{row.name}</strong>
                          <span>{row.department || "No department"}</span>
                        </td>
                        <td>{row.date}</td>
                        <td>{row.check_in ? new Date(row.check_in).toLocaleString() : "-"}</td>
                        <td>{row.check_out ? new Date(row.check_out).toLocaleString() : "-"}</td>
                        <td>{row.check_in_device || "-"} / {row.check_out_device || "-"}</td>
                        <td>{row.check_in_method || "-"} / {row.check_out_method || "-"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </section>
        )}
      </section>
    </main>
  );
}

export default App;
