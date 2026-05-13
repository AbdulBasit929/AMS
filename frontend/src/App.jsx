
import { useEffect, useMemo, useRef, useState, useCallback } from "react";

const API = "http://127.0.0.1:4000";
const DEFAULT_CREDS = { email: "admin@attendance.local", password: "Admin@12345" };

/* ─── ICONS (inline SVG) ──────────────────────────────────────────────────── */
const Icon = {
  Logo: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
    </svg>
  ),
  Dashboard: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
      <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
    </svg>
  ),
  Station: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
    </svg>
  ),
  Employees: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Reports: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  Audit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  LogOut: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Menu: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Fingerprint: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 10a2 2 0 0 0-2 2c0 1.02.15 2.12.4 3.14"/><path d="M12 6a6 6 0 0 1 6 6c0 1.25-.2 2.45-.57 3.57"/>
      <path d="M12 2a10 10 0 0 1 10 10c0 1.64-.31 3.21-.87 4.65"/><path d="M12 14c0 2 .51 4 1.33 5.5"/>
      <path d="M9.56 17.56C9.22 16.43 9 15.22 9 14c0-1.66 1.34-3 3-3"/>
      <path d="M6.14 15.1C6.05 14.74 6 14.38 6 14a6 6 0 0 1 6-6"/>
      <path d="M3.08 12.93A10 10 0 0 0 3 14c0 1.05.11 2.08.31 3.07"/>
    </svg>
  ),
  Face: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
    </svg>
  ),
  Camera: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  CameraOff: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/>
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Shield: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
    </svg>
  ),
  Star: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  TrendUp: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
    </svg>
  ),
  Activity: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
    </svg>
  ),
};

/* ─── HELPERS ─────────────────────────────────────────────────────────────── */
async function api(path, opts = {}, token) {
  const res = await fetch(`${API}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(opts.headers || {}),
    },
    ...opts,
  });
  const ct = res.headers.get("content-type") || "";
  const data = ct.includes("application/json")
    ? await res.json()
    : { message: await res.text() };
  return { ok: res.ok, status: res.status, data };
}

function initials(name = "") {
  return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
}

function fmtTime(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
function fmtDate(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
}
function fmtDT(dt) {
  if (!dt) return "—";
  return new Date(dt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fingerLabel(code) {
  return (code || "").split("_").filter(Boolean).map(p => p[0].toUpperCase() + p.slice(1)).join(" ");
}

function choosePreferredCamera(devices = []) {
  if (!devices.length) return "";
  const preferred = devices.find((device) => /logitech|logi|hd 1080|c920|c922/i.test(device.label || ""));
  return preferred?.deviceId || devices[0].deviceId || "";
}

async function loadVideoInputs() {
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter((device) => device.kind === "videoinput");
}

function captureVideoFrame(video) {
  if (!video) return null;
  const canvas = document.createElement("canvas");
  canvas.width = video.videoWidth || 1280;
  canvas.height = video.videoHeight || 720;
  canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.92);
}

function captureVideoFrameScaled(video, maxWidth = 960, quality = 0.88) {
  if (!video) return null;
  const sourceWidth = video.videoWidth || 1280;
  const sourceHeight = video.videoHeight || 720;
  const scale = sourceWidth > maxWidth ? maxWidth / sourceWidth : 1;
  const width = Math.max(640, Math.round(sourceWidth * scale));
  const height = Math.max(480, Math.round(sourceHeight * scale));
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  canvas.getContext("2d").drawImage(video, 0, 0, width, height);
  return canvas.toDataURL("image/jpeg", quality);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function fmtMetric(value, digits = 1) {
  return typeof value === "number" ? value.toFixed(digits) : "-";
}

function FaceQualityPanel({ analysis, compact = false }) {
  if (!analysis) return null;

  const quality = analysis.quality || analysis.qualitySummary || {};
  const warnings = analysis.warnings || [];
  const blur = quality.blurVariance ?? quality.averageBlurVariance ?? null;
  const brightness = quality.brightness ?? quality.averageBrightness ?? null;
  const coverage = analysis.faceCoverage ?? quality.averageFaceCoverage ?? null;

  let tone = "info";
  if (typeof blur === "number" && typeof brightness === "number") {
    if (blur >= 20 && brightness >= 55 && brightness <= 200) {
      tone = "success";
    } else if (blur < 10 || brightness < 45 || brightness > 210) {
      tone = "danger";
    } else {
      tone = "warning";
    }
  }

  return (
    <div className={`banner banner-${tone}`} style={{ alignItems: "flex-start", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", width: "100%" }}>
        <span><strong>Sharpness:</strong> {fmtMetric(blur)}</span>
        <span><strong>Brightness:</strong> {fmtMetric(brightness)}</span>
        {coverage !== null && <span><strong>Coverage:</strong> {Math.round(Number(coverage) * 100)}%</span>}
      </div>
      {!compact && warnings.length > 0 && (
        <div style={{ fontSize: 12 }}>{warnings.join(" ")}</div>
      )}
      {!compact && analysis.message && (
        <div style={{ fontSize: 12 }}>{analysis.message}</div>
      )}
    </div>
  );
}

const FACE_ENROLL_MIN_SAMPLES = 3;
const FACE_ENROLL_MAX_SAMPLES = 4;

/* ─── BANNER ──────────────────────────────────────────────────────────────── */
function Banner({ type = "info", children, onClose }) {
  const icons = { info: Icon.Info, success: Icon.CheckCircle, warning: Icon.AlertTriangle, danger: Icon.AlertTriangle };
  const Ic = icons[type] || Icon.Info;
  return (
    <div className={`banner banner-${type}`}>
      <Ic /><span style={{ flex: 1 }}>{children}</span>
      {onClose && <button className="btn btn-ghost btn-sm" style={{ padding: "2px 6px" }} onClick={onClose}>✕</button>}
    </div>
  );
}

/* ─── METRIC CARD ─────────────────────────────────────────────────────────── */
function MetricCard({ label, value, tone = "", helper, icon: Ic }) {
  return (
    <div className={`metric-card ${tone}`}>
      <div className="metric-icon">{Ic ? <Ic /> : null}</div>
      <div className="metric-value">{value ?? "—"}</div>
      <div className="metric-label">{label}</div>
      {helper && <div className="metric-helper">{helper}</div>}
    </div>
  );
}

/* ─── SERVICE PILL ────────────────────────────────────────────────────────── */
function ServicePill({ label, status, message }) {
  const tone = status === "ok" ? "ok" : status === "warning" || status === "loading" ? "warn" : "err";
  return (
    <div className={`service-pill ${tone}`}>
      <span className="spill-dot" />
      <span className="spill-name">{label}</span>
      <span className="spill-stat">{status}</span>
      {message && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>· {message.slice(0, 48)}</span>}
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   AUTH PAGE
═══════════════════════════════════════════════════════════════════════════ */
function AuthPage({ onLogin }) {
  const [form, setForm] = useState(DEFAULT_CREDS);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true); setError("");
    const res = await api("/api/auth/login", { method: "POST", body: JSON.stringify(form) });
    setLoading(false);
    if (!res.ok) { setError(res.data.message || "Login failed"); return; }
    localStorage.setItem("ams_token", res.data.token);
    onLogin(res.data.token, res.data.user);
  }

  return (
    <div className="auth-shell">
      {/* Left visual */}
      <div className="auth-visual">
        <div className="auth-visual-grid" />
        <div className="auth-visual-glow" />
        <div className="auth-visual-content">
          <div className="eyebrow" style={{ marginBottom: 16 }}>Biometric Attendance System</div>
          <h1 className="auth-headline">
            Enterprise workforce<br /><em>identity platform</em>
          </h1>
          <p className="auth-body-text">
            Fingerprint and facial recognition attendance tracking with real-time audit trails, multi-station support, and role-based access control.
          </p>
          <div className="auth-stats">
            <div>
              <div className="auth-stat-value">99.9%</div>
              <div className="auth-stat-label">Uptime SLA</div>
            </div>
            <div>
              <div className="auth-stat-value">&lt; 1s</div>
              <div className="auth-stat-label">Verification speed</div>
            </div>
            <div>
              <div className="auth-stat-value">AES-256</div>
              <div className="auth-stat-label">Data encryption</div>
            </div>
          </div>
        </div>
      </div>

      {/* Right form */}
      <div className="auth-form-side">
        <div className="auth-form-card">
          <div className="auth-logo">
            <div className="auth-logo-icon"><Icon.Logo /></div>
            <div>
              <div className="auth-logo-name">BioTime AMS</div>
              <div className="auth-logo-sub">v2.0 Enterprise</div>
            </div>
          </div>

          <div className="auth-form-title">Welcome back</div>
          <div className="auth-form-desc">Sign in to access your attendance management console.</div>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                className="form-input"
                type="email"
                placeholder="admin@company.local"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                className="form-input"
                type="password"
                placeholder="••••••••"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              />
            </div>

            {error && <Banner type="danger">{error}</Banner>}

            <button className="btn btn-primary" type="submit" disabled={loading}
              style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
              {loading ? "Authenticating…" : "Sign In"}
            </button>
          </form>

          <div className="auth-cred-tip">
            <div className="auth-cred-tip-title">Bootstrap credentials</div>
            <div className="auth-cred-row"><span>Email</span><code>{DEFAULT_CREDS.email}</code></div>
            <div className="auth-cred-row"><span>Password</span><code>{DEFAULT_CREDS.password}</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   SIDEBAR
═══════════════════════════════════════════════════════════════════════════ */
function Sidebar({ user, activeView, onNav, onLogout, collapsed, onToggleCollapse, conflictCount, mobileOpen, onOverlayClick }) {
  const navItems = useMemo(() => {
    const base = [
      { id: "dashboard", label: "Dashboard",        icon: Icon.Dashboard },
      { id: "station",   label: "Attendance Station", icon: Icon.Station },
      { id: "reports",   label: "Reports",           icon: Icon.Reports },
      { id: "audit",     label: "Audit Log",         icon: Icon.Audit },
    ];
    if (user?.role === "admin" || user?.role === "operator") {
      base.splice(2, 0, { id: "employees", label: "Employees", icon: Icon.Employees });
    }
    return base;
  }, [user]);

  return (
    <>
      {mobileOpen && <div className="sidebar-overlay" onClick={onOverlayClick} />}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
        {/* Header */}
        <div className="sidebar-header">
          <div className="brand-mark">
            <div className="brand-icon"><Icon.Logo /></div>
            <div className="brand-text">
              <div className="brand-name">BioTime AMS</div>
              <div className="brand-sub">Enterprise</div>
            </div>
          </div>
          <button className="collapse-btn" onClick={onToggleCollapse} title={collapsed ? "Expand" : "Collapse"}>
            <Icon.ChevronLeft />
          </button>
        </div>

        {/* Nav */}
        <nav className="nav-section">
          <div className="nav-label">Navigation</div>
          {navItems.map(item => (
            <button
              key={item.id}
              className={`nav-item ${activeView === item.id ? "active" : ""}`}
              onClick={() => onNav(item.id)}
              title={collapsed ? item.label : undefined}
            >
              <span className="nav-icon"><item.icon /></span>
              <span className="nav-text">{item.label}</span>
              {item.id === "station" && conflictCount > 0 && (
                <span className="nav-badge">{conflictCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* User */}
        <div className="sidebar-footer">
          <div className="user-tile">
            <div className="avatar">{initials(user?.name || "")}</div>
            <div className="user-info">
              <div className="user-name">{user?.name}</div>
              <div className="user-role">{user?.role}</div>
            </div>
            <button className="signout-btn" onClick={onLogout} title="Sign out">
              <Icon.LogOut />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   TOPBAR
═══════════════════════════════════════════════════════════════════════════ */
function Topbar({ view, fpStatus, onMobileMenu, onRefresh }) {
  const titles = {
    dashboard: { eye: "Live Operations", title: "Dashboard" },
    station:   { eye: "Operator Console", title: "Attendance Station" },
    employees: { eye: "Workforce Registry", title: "Employees" },
    reports:   { eye: "Insights", title: "Reports" },
    audit:     { eye: "Security", title: "Audit Trail" },
  };
  const { eye, title } = titles[view] || { eye: "", title: "" };
  const status = fpStatus?.status;
  const pillTone = status === "ok" ? "" : status === "warning" ? "warn" : "err";

  return (
    <div className="topbar">
      <div className="topbar-left">
        <button className="mobile-menu-btn" onClick={onMobileMenu}><Icon.Menu /></button>
        <div>
          <div className="page-eyebrow">{eye}</div>
          <div className="page-title">{title}</div>
        </div>
      </div>
      <div className="topbar-right">
        <div className="topbar-pill">
          <span className={`pill-dot ${pillTone}`} />
          <span>Fingerprint</span>
        </div>
        <button className="btn btn-ghost btn-sm" onClick={onRefresh} title="Refresh">
          <Icon.Refresh />
        </button>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   DASHBOARD VIEW
═══════════════════════════════════════════════════════════════════════════ */
function DashboardView({ overview, auditRows, conflictCount, onRefresh }) {
  const stats = overview?.employeeStats || {};
  const today = overview?.todayStats || {};

  return (
    <div className="view">
      <div className="view-header">
        <div className="view-header-left">
          <div className="eyebrow">Live Operations</div>
          <h1 className="view-title">Dashboard</h1>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-secondary" onClick={onRefresh}><Icon.Refresh />Refresh</button>
        </div>
      </div>

      <div className="metrics-grid">
        <MetricCard label="Total Employees"     value={stats.totalEmployees ?? 0}     icon={Icon.Users} />
        <MetricCard label="Active Employees"    value={stats.activeEmployees ?? 0}    icon={Icon.CheckCircle} tone="success" />
        <MetricCard label="Finger Slots"        value={stats.fingerprintTemplates ?? 0} icon={Icon.Fingerprint} tone="success" helper="Multiple fingers per employee" />
        <MetricCard label="Face Enrolled"       value={stats.faceEnrolled ?? 0}       icon={Icon.Face} tone="warning" />
        <MetricCard label="Today Check-Ins"     value={today.checkIns ?? 0}           icon={Icon.TrendUp} />
        <MetricCard label="Open Sessions"       value={today.openSessions ?? 0}       icon={Icon.Clock} tone={today.openSessions > 0 ? "danger" : ""} />
      </div>

      {conflictCount > 0 && (
        <Banner type="danger">
          <strong>{conflictCount} fingerprint conflict{conflictCount > 1 ? "s" : ""}</strong> detected. Resolve duplicate ownership issues before using global verification.
        </Banner>
      )}

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Recent Attendance</div>
            <div className="panel-desc">Latest biometric and manual entries across all stations.</div>
          </div>
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
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {(overview?.recentAttendance || []).length === 0 ? (
                <tr><td colSpan={6}><div className="empty-state"><Icon.Activity /><p>No attendance records yet</p></div></td></tr>
              ) : (overview?.recentAttendance || []).map(row => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.name}</strong>
                    <span>{row.employee_code || "No code"}</span>
                  </td>
                  <td>{row.date}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtTime(row.check_in)}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtTime(row.check_out)}</td>
                  <td>
                    <span className="badge badge-info">{row.check_in_method || "—"}</span>
                    {row.check_out_method && <span className="badge badge-muted" style={{ marginLeft: 4 }}>{row.check_out_method}</span>}
                  </td>
                  <td>
                    {row.check_out
                      ? <span className="badge badge-success"><span className="badge-dot" />Closed</span>
                      : <span className="badge badge-warning"><span className="badge-dot" />Open</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">Audit Trail</div>
            <div className="panel-desc">Recent security and operational events.</div>
          </div>
        </div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Event</th><th>Type</th><th>Actor</th><th>When</th></tr>
            </thead>
            <tbody>
              {(auditRows || []).slice(0, 12).map(row => (
                <tr key={row.id}>
                  <td><strong>{row.summary}</strong></td>
                  <td><span className="badge badge-muted">{row.event_type}</span></td>
                  <td>{row.actor_name || "System"}</td>
                  <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, whiteSpace: "nowrap" }}>{fmtDT(row.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   STATION VIEW
═══════════════════════════════════════════════════════════════════════════ */
function StationView({ token, stationStatus, latestEvent, conflictCount, stationMsg, onRefresh, onLaunchVerify, onRefreshStatus }) {
  const fp = stationStatus.fingerprint || {};
  const face = stationStatus.face || {};
  const agentOk = fp.mode === "local-agent";

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camActive, setCamActive] = useState(false);
  const [camErr, setCamErr] = useState("");
  const [faceMsg, setFaceMsg] = useState("");
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [faceSamples, setFaceSamples] = useState([]);
  const [faceCaptureAnalyzing, setFaceCaptureAnalyzing] = useState(false);
  const [lastFaceAnalysis, setLastFaceAnalysis] = useState(null);
  const [faceLoading, setFaceLoading] = useState(false);
  const [liveFaceAnalysis, setLiveFaceAnalysis] = useState(null);

  const syncDevices = useCallback(async () => {
    const devices = await loadVideoInputs();
    setVideoDevices(devices);
    setSelectedDeviceId((current) => current || choosePreferredCamera(devices));
  }, []);

  async function startCam() {
    setCamErr("");
    try {
      const constraints = selectedDeviceId
        ? { video: { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }
        : { video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCamActive(true);
      await syncDevices();
    } catch (e) { setCamErr(e.message); }
  }

  function stopCam() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setCamActive(false);
    setLiveFaceAnalysis(null);
  }

  function captureFrame() {
    return captureVideoFrame(videoRef.current);
  }

  async function captureVerificationBurst() {
    const frames = [];

    for (let i = 0; i < 4; i++) {
      const frame = captureVideoFrameScaled(videoRef.current, 960, 0.88);
      if (frame) {
        frames.push(frame);
      }
      if (i < 3) {
        await sleep(220);
      }
    }

    return frames;
  }

  async function analyzeCurrentFrame(silent = false) {
    const frame = captureVideoFrameScaled(videoRef.current, 960, 0.86);
    if (!frame) {
      return null;
    }

    const res = await api("/api/biometrics/face/analyze", {
      method: "POST",
      body: JSON.stringify({ imageBase64: frame })
    }, token);

    if (res.ok) {
      setLiveFaceAnalysis(res.data);
      return res.data;
    }

    const fallback = {
      quality: res.data?.quality || null,
      warnings: [],
      message: res.data?.message || "Live quality check failed."
    };
    setLiveFaceAnalysis(fallback);
    if (!silent) {
      setFaceMsg(fallback.message);
    }
    return null;
  }

  async function verifyFace() {
    if (!camActive) { setFaceMsg("Start the camera first."); return; }
    setFaceLoading(true); setFaceMsg("Checking live camera quality...");
    await analyzeCurrentFrame(true);
    setFaceMsg("Capturing verification burst...");
    const samples = await captureVerificationBurst();
    if (samples.length === 0) {
      setFaceLoading(false);
      setFaceMsg("Could not capture a face frame from the camera.");
      return;
    }

    setFaceMsg("Analyzing verification frames...");
    const res = await api("/api/biometrics/face/verify", { method: "POST", body: JSON.stringify({ samples }) }, token);
    setFaceLoading(false);
    if (res.ok) {
      const rejected = res.data.rejectedSamples?.length || 0;
      setFaceMsg(
        `Matched ${res.data.employee?.name || "employee"} with confidence ${Math.round((res.data.confidence || 0) * 100)}% using ${res.data.probeCount || samples.length} verification frame(s)${rejected ? ` and ${rejected} rejected frame(s)` : ""}. Attendance action: ${res.data.attendance?.action || "recorded"}.`
      );
    } else {
      const confidenceText = typeof res.data.confidence === "number"
        ? ` Confidence: ${Math.round(res.data.confidence * 100)}%.`
        : "";
      const thresholdText = typeof res.data.appliedThreshold === "number"
        ? ` Threshold: ${res.data.appliedThreshold.toFixed(2)}.`
        : "";
      const topCandidateText = Array.isArray(res.data.topCandidates) && res.data.topCandidates.length > 0
        ? ` Closest scores: ${res.data.topCandidates.map((candidate) => `${candidate.name || `#${candidate.employeeId}`} ${candidate.score}`).join(" | ")}.`
        : "";
      const rejectedText = Array.isArray(res.data.rejectedSamples) && res.data.rejectedSamples.length > 0
        ? ` Rejections: ${res.data.rejectedSamples.map((sample) => `#${sample.sampleIndex} ${sample.message}`).join(" | ")}`
        : "";
      setFaceMsg(`${res.data.message || res.data.status || "Face verification complete."}${confidenceText}${thresholdText}${topCandidateText}${rejectedText}`);
    }
    if (res.ok) onRefresh();
  }

  useEffect(() => {
    syncDevices().catch(() => {});
    return () => stopCam();
  }, [syncDevices]);

  useEffect(() => {
    if (!camActive || faceLoading) {
      return undefined;
    }

    analyzeCurrentFrame(true).catch(() => {});
    const id = setInterval(() => {
      analyzeCurrentFrame(true).catch(() => {});
    }, 3000);

    return () => clearInterval(id);
  }, [camActive, faceLoading, token]);

  const eventTone = latestEvent?.event_type === "attendance.check_in" ? "success"
    : latestEvent?.event_type === "attendance.check_out" ? "warning"
    : latestEvent?.event_type === "attendance.already_closed" ? "danger" : "info";

  return (
    <div className="view">
      <div className="view-header">
        <div className="view-header-left">
          <div className="eyebrow">Operator Console</div>
          <h1 className="view-title">Attendance Station</h1>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-secondary" onClick={onRefreshStatus}><Icon.Refresh />Refresh Services</button>
        </div>
      </div>

      {/* Service Status */}
      <div className="service-pills">
        <ServicePill
          label="Biometric Agent"
          status={agentOk ? "ok" : "warning"}
          message={agentOk ? "Local agent ready" : "Start biometric agent"}
        />
        <ServicePill
          label="Fingerprint"
          status={fp.status || "loading"}
          message={fp.message}
        />
        <ServicePill
          label="Face Service"
          status={face.status || "loading"}
          message={face.message}
        />
      </div>

      {conflictCount > 0 && (
        <Banner type="danger">
          <strong>{conflictCount} fingerprint conflict{conflictCount > 1 ? "s" : ""} active.</strong> Global verification is in guarded mode. Resolve duplicate ownership in the Employees view.
        </Banner>
      )}

      {stationMsg && <Banner type="info">{stationMsg}</Banner>}

      {/* Latest Event */}
      {latestEvent && (
        <div className={`event-card ${eventTone}`}>
          <div className="event-icon">
            {eventTone === "success" ? <Icon.CheckCircle /> : eventTone === "warning" ? <Icon.Clock /> : <Icon.AlertTriangle />}
          </div>
          <div>
            <div className="event-label">
              {latestEvent.event_type === "attendance.check_in" ? "Check-In Recorded"
                : latestEvent.event_type === "attendance.check_out" ? "Check-Out Recorded"
                : latestEvent.event_type === "attendance.already_closed" ? "Session Already Closed"
                : "Attendance Event"}
            </div>
            <div className="event-summary">{latestEvent.summary}</div>
            <div className="event-time">{fmtDT(latestEvent.created_at)}</div>
          </div>
        </div>
      )}

      <div className="station-grid">
        {/* Fingerprint Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Fingerprint Workflow</div>
              <div className="panel-desc">HID DigitalPersona 4500 via desktop agent</div>
            </div>
            <span className="badge badge-info"><Icon.Fingerprint style={{ width: 10, height: 10 }} />HID SDK</span>
          </div>
          <div className="panel-body">
            <div className="steps-list" style={{ marginBottom: 20 }}>
              <div className="step-item">Keep backend running on port <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--bg-overlay)", padding: "1px 5px", borderRadius: 4 }}>4000</code></div>
              <div className="step-item">Start the local biometric agent (<code style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--bg-overlay)", padding: "1px 5px", borderRadius: 4 }}>port 8091</code>)</div>
              <div className="step-item">Launch fingerprint verification below and place your finger on the reader</div>
              <div className="step-item">Attendance is automatically recorded and reflected on the dashboard</div>
            </div>

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="btn btn-primary" onClick={onLaunchVerify} disabled={conflictCount > 0}>
                <Icon.Fingerprint />Launch Verification
              </button>
              <button className="btn btn-secondary" onClick={onRefresh}><Icon.Refresh />Refresh Feed</button>
            </div>
          </div>
        </div>

        {/* Face Panel */}
        <div className="panel">
          <div className="panel-header">
            <div>
              <div className="panel-title">Face Recognition</div>
              <div className="panel-desc">Webcam capture via browser API</div>
            </div>
            <span className="badge badge-warning"><Icon.Face style={{ width: 10, height: 10 }} />Beta</span>
          </div>
          <div className="panel-body">
            <div className={`camera-wrap ${camActive ? "camera-active" : ""}`}>
              <video ref={videoRef} autoPlay muted playsInline />
              {!camActive && (
                <div className="camera-placeholder">
                  <Icon.Camera />
                  <p>Camera not active</p>
                </div>
              )}
              <div className="scan-line" />
              <div className="scan-corner tl" />
              <div className="scan-corner tr" />
              <div className="scan-corner bl" />
              <div className="scan-corner br" />
            </div>

            {camErr && <Banner type="danger">{camErr}</Banner>}
            {faceMsg && <Banner type={faceMsg.includes("match") || faceMsg.includes("enrolled") ? "success" : "info"}>{faceMsg}</Banner>}

            <div className="camera-toolbar">
              <label className="camera-select">
                <span>Camera</span>
                <select value={selectedDeviceId} onChange={e => setSelectedDeviceId(e.target.value)}>
                  <option value="">Auto-select Logitech HD 1080p</option>
                  {videoDevices.map(device => (
                    <option key={device.deviceId} value={device.deviceId}>
                      {device.label || `Camera ${device.deviceId.slice(0, 6)}`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {liveFaceAnalysis && <FaceQualityPanel analysis={liveFaceAnalysis} />}

            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {!camActive
                ? <button className="btn btn-secondary" onClick={startCam}><Icon.Camera />Start Camera</button>
                : <button className="btn btn-ghost" onClick={stopCam}><Icon.CameraOff />Stop</button>}
              <button className="btn btn-primary" onClick={verifyFace} disabled={faceLoading || !camActive}>
                <Icon.Face />{faceLoading ? "Verifying…" : "Verify Face"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   EMPLOYEES VIEW
═══════════════════════════════════════════════════════════════════════════ */
function EmployeesView({ token, employees, onRefreshEmployees }) {
  const [selected, setSelected] = useState(null);
  const [history, setHistory] = useState([]);
  const [fingerprints, setFingerprints] = useState([]);
  const [fpPlan, setFpPlan] = useState(null);
  const [conflicts, setConflicts] = useState({ exactDuplicates: [], recentConflicts: [] });
  const [faceConflicts, setFaceConflicts] = useState({ activeConflicts: [], recentConflicts: [] });
  const [form, setForm] = useState({ id: null, employeeCode: "", name: "", cnic: "", department: "", designation: "", status: "active", profileImage: "" });
  const [msg, setMsg] = useState("");
  const [msgType, setMsgType] = useState("info");
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [camActive, setCamActive] = useState(false);
  const [camErr, setCamErr] = useState("");
  const [faceMsg, setFaceMsg] = useState("");
  const [videoDevices, setVideoDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");
  const [faceSamples, setFaceSamples] = useState([]);
  const [faceCaptureAnalyzing, setFaceCaptureAnalyzing] = useState(false);
  const [lastFaceAnalysis, setLastFaceAnalysis] = useState(null);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    return employees.filter(e =>
      e.name?.toLowerCase().includes(q) ||
      e.cnic?.includes(q) ||
      e.employee_code?.toLowerCase().includes(q)
    );
  }, [employees, query]);

  async function loadEmployee(emp) {
    setSelected(emp);
    setLastFaceAnalysis(null);
    setFaceMsg("");
    setFaceSamples([]);
    setForm({
      id: emp.id,
      employeeCode: emp.employee_code || "",
      name: emp.name || "",
      cnic: emp.cnic || "",
      department: emp.department || "",
      designation: emp.designation || "",
      status: emp.status || "active",
      profileImage: emp.profile_image || "",
    });
    const [hist, fps, plan, conf, faceConf] = await Promise.all([
      api(`/api/employees/${emp.id}/attendance`, {}, token),
      api(`/api/employees/${emp.id}/fingerprints`, {}, token),
      api(`/api/employees/${emp.id}/fingerprint-plan`, {}, token),
      api(`/api/biometrics/fingerprint/conflicts?employeeId=${emp.id}`, {}, token),
      api(`/api/biometrics/face/conflicts?employeeId=${emp.id}`, {}, token),
    ]);
    if (hist.ok) setHistory(hist.data);
    if (fps.ok) setFingerprints(fps.data);
    if (plan.ok) setFpPlan(plan.data);
    if (conf.ok) setConflicts(conf.data);
    if (faceConf.ok) setFaceConflicts(faceConf.data);
  }

  function resetForm() {
    setSelected(null);
    setHistory([]); setFingerprints([]); setFpPlan(null);
    setConflicts({ exactDuplicates: [], recentConflicts: [] });
    setFaceConflicts({ activeConflicts: [], recentConflicts: [] });
    setMsg(""); setCamErr(""); setFaceMsg("");
    setFaceCaptureAnalyzing(false);
    setLastFaceAnalysis(null);
    setFaceSamples([]);
    setForm({ id: null, employeeCode: "", name: "", cnic: "", department: "", designation: "", status: "active", profileImage: "" });
  }

  async function saveEmployee(e) {
    e.preventDefault(); setSaving(true); setMsg("");
    const path = form.id ? `/api/employees/${form.id}` : "/api/employees";
    const method = form.id ? "PUT" : "POST";
    const res = await api(path, { method, body: JSON.stringify({
      employeeCode: form.employeeCode, name: form.name, cnic: form.cnic,
      department: form.department, designation: form.designation,
      status: form.status, profileImage: form.profileImage,
    })}, token);
    setSaving(false);
    if (!res.ok) { setMsg(res.data.message || "Save failed"); setMsgType("danger"); return; }
    setMsg(form.id ? "Employee updated." : "Employee created."); setMsgType("success");
    onRefreshEmployees();
    if (!form.id) resetForm();
  }

  async function launchEnroll(empId, fingerCode) {
    const res = await api("/api/biometrics/fingerprint/launch-enroll", { method: "POST", body: JSON.stringify({ employeeId: empId, fingerCode }) }, token);
    setMsg(res.data.message || "Enrollment launched."); setMsgType("info");
  }

  async function launchVerify(empId) {
    const res = await api("/api/biometrics/fingerprint/launch-verify", { method: "POST", body: JSON.stringify({ employeeId: empId }) }, token);
    setMsg(res.data.message || "Verification launched."); setMsgType("info");
  }

  async function markManual(empId) {
    const res = await api("/api/attendance/manual-mark", { method: "POST", body: JSON.stringify({ employeeId: empId }) }, token);
    if (!res.ok) { setMsg(res.data.message || "Error"); setMsgType("danger"); return; }
    setMsg(`Manual ${res.data.attendance?.action} recorded.`); setMsgType("success");
  }

  async function setPreferred(empId, fpId) {
    await api(`/api/employees/${empId}/fingerprints/${fpId}/prefer`, { method: "POST" }, token);
    loadEmployee(selected);
  }

  async function deleteSlot(empId, fpId) {
    if (!confirm("Delete this fingerprint slot? This cannot be undone.")) return;
    await api(`/api/employees/${empId}/fingerprints/${fpId}`, { method: "DELETE" }, token);
    loadEmployee(selected);
  }

  async function deleteFaceProfile(empId) {
    if (!confirm("Clear this employee's face profile? They will need to be re-enrolled.")) return;
    const res = await api(`/api/employees/${empId}/face-profile`, { method: "DELETE" }, token);
    if (!res.ok) {
      setFaceMsg(res.data.message || "Could not clear the face profile.");
      return;
    }
    setFaceMsg("Face profile cleared. Capture fresh samples and enroll again.");
    setFaceSamples([]);
    setLastFaceAnalysis(null);
    await onRefreshEmployees();
    const fresh = await api(`/api/employees/${empId}`, {}, token);
    if (fresh.ok) {
      await loadEmployee(fresh.data);
    }
  }

  async function clearFingerprintConflictHistory(empId) {
    const res = await api("/api/biometrics/fingerprint/conflicts/resolve", {
      method: "POST",
      body: JSON.stringify({ employeeId: empId })
    }, token);

    if (!res.ok) {
      setMsg(res.data.message || "Could not clear fingerprint conflict history.");
      setMsgType("danger");
      return;
    }

    setMsg(`Cleared ${res.data.clearedCount || 0} fingerprint conflict record(s).`);
    setMsgType("success");
    const fresh = await api(`/api/biometrics/fingerprint/conflicts?employeeId=${empId}`, {}, token);
    if (fresh.ok) {
      setConflicts(fresh.data);
    }
  }

  async function clearFaceConflictHistory(empId) {
    const res = await api("/api/biometrics/face/conflicts/resolve", {
      method: "POST",
      body: JSON.stringify({ employeeId: empId })
    }, token);

    if (!res.ok) {
      setFaceMsg(res.data.message || "Could not clear face conflict history.");
      return;
    }

    setFaceMsg(`Cleared ${res.data.clearedCount || 0} face conflict record(s).`);
    const fresh = await api(`/api/biometrics/face/conflicts?employeeId=${empId}`, {}, token);
    if (fresh.ok) {
      setFaceConflicts(fresh.data);
    }
  }

  async function startCam() {
    setCamErr("");
    try {
      const constraints = selectedDeviceId
        ? { video: { deviceId: { exact: selectedDeviceId }, width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false }
        : { video: { width: { ideal: 1920 }, height: { ideal: 1080 } }, audio: false };
      const s = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = s;
      if (videoRef.current) videoRef.current.srcObject = s;
      setCamActive(true);
      const devices = await loadVideoInputs();
      setVideoDevices(devices);
      setSelectedDeviceId((current) => current || choosePreferredCamera(devices));
    } catch (e) { setCamErr(e.message); }
  }
  function stopCam() {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
    setFaceCaptureAnalyzing(false);
    setCamActive(false);
  }

  async function enrollFace() {
    if (!selected?.id) { setFaceMsg("Select an employee first."); return; }
    if (faceSamples.length < FACE_ENROLL_MIN_SAMPLES) {
      setFaceMsg(`Capture at least ${FACE_ENROLL_MIN_SAMPLES} face samples before enrollment for a reliable profile.`);
      return;
    }

    const samples = faceSamples.slice(-FACE_ENROLL_MAX_SAMPLES);

    const res = await api("/api/biometrics/face/enroll", {
      method: "POST",
      body: JSON.stringify({
        employeeId: selected.id,
        samples,
        profileImage: samples[0]
      })
    }, token);

    if (res.ok) {
      const sampleCount = res.data.sampleCount || samples.length;
      const rejected = res.data.rejectedSamples?.length || 0;
      setFaceMsg(`Face enrolled with ${sampleCount} accepted sample(s)${rejected ? ` and ${rejected} rejected sample(s)` : ""}.`);
      setFaceSamples([]);
      await onRefreshEmployees();
      const fresh = await api(`/api/employees/${selected.id}`, {}, token);
      if (fresh.ok) {
        await loadEmployee(fresh.data);
      }
      return;
    }

    if (res.status === 409 && res.data.conflict) {
      setFaceMsg(`${res.data.message} Similar employee: ${res.data.conflict.name} (#${res.data.conflict.employeeId}), distance ${res.data.conflict.distance}.`);
      const freshFaceConflicts = await api(`/api/biometrics/face/conflicts?employeeId=${selected.id}`, {}, token);
      if (freshFaceConflicts.ok) {
        setFaceConflicts(freshFaceConflicts.data);
      }
      return;
    }

    const rejectedText = Array.isArray(res.data.rejectedSamples) && res.data.rejectedSamples.length > 0
      ? ` Rejections: ${res.data.rejectedSamples.map((sample) => `#${sample.sampleIndex} ${sample.message}`).join(" | ")}`
      : "";
    setFaceMsg(`${res.data.message || res.data.status || "Done."}${rejectedText}`);
  }

  async function captureFaceSample() {
    const frame = captureVideoFrame(videoRef.current);
    if (!frame) {
      setFaceMsg("Start the camera first.");
      return;
    }

    setFaceCaptureAnalyzing(true);
    setFaceMsg("Analyzing captured frame...");

    const res = await api("/api/biometrics/face/analyze", {
      method: "POST",
      body: JSON.stringify({ imageBase64: frame })
    }, token);

    setFaceCaptureAnalyzing(false);

    if (!res.ok) {
      const blur = res.data?.quality?.blurVariance;
      const detail = typeof blur === "number" ? ` Sharpness ${blur.toFixed(1)}.` : "";
      setLastFaceAnalysis({ quality: res.data?.quality || null, warnings: [], message: res.data.message || "Face sample rejected." });
      setFaceMsg(`${res.data.message || "Face sample rejected."}${detail}`);
      return;
    }

    const next = [...faceSamples.slice(-(FACE_ENROLL_MAX_SAMPLES - 1)), frame];
    setFaceSamples(next);
    setLastFaceAnalysis(res.data);

    const blur = res.data?.quality?.blurVariance;
    const warnings = Array.isArray(res.data?.warnings) && res.data.warnings.length > 0
      ? ` ${res.data.warnings.join(" ")}`
      : "";
    const blurText = typeof blur === "number" ? ` Sharpness ${blur.toFixed(1)}.` : "";

    setFaceMsg(`Captured ${next.length} face sample(s).${blurText}${warnings}`);
  }

  useEffect(() => {
    loadVideoInputs()
      .then((devices) => {
        setVideoDevices(devices);
        setSelectedDeviceId((current) => current || choosePreferredCamera(devices));
      })
      .catch(() => {});

    return () => stopCam();
  }, []);

  const activeConflictCount = conflicts.exactDuplicates?.length || 0;
  const historicalConflictCount = conflicts.recentConflicts?.length || 0;

  return (
    <div className="view">
      <div className="view-header">
        <div className="view-header-left">
          <div className="eyebrow">Workforce Registry</div>
          <h1 className="view-title">Employees</h1>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-secondary" onClick={resetForm}><Icon.Plus />New Employee</button>
        </div>
      </div>

      <div className="employees-layout">
        {/* Employee list */}
        <div className="panel" style={{ position: "sticky", top: 70 }}>
          <div className="panel-header">
            <div>
              <div className="panel-title">Employees</div>
              <div className="panel-desc">{employees.length} total</div>
            </div>
          </div>
          <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
            <input
              className="form-input" style={{ fontSize: 12, padding: "8px 12px" }}
              placeholder="Search name, CNIC, code…"
              value={query} onChange={e => setQuery(e.target.value)}
            />
          </div>
          <div className="employee-list">
            {filtered.length === 0 ? (
              <div className="empty-state"><Icon.Users /><p>No employees found</p></div>
            ) : filtered.map(emp => (
              <button key={emp.id} className={`employee-card ${selected?.id === emp.id ? "active" : ""}`} onClick={() => loadEmployee(emp)}>
                <div className="emp-avatar">{initials(emp.name)}</div>
                <div className="emp-info">
                  <div className="emp-name">{emp.name}</div>
                  <div className="emp-meta">{emp.employee_code || "No code"} · {emp.cnic}</div>
                  <div className="chip-row">
                    <span className={`chip ${emp.has_fingerprint ? "chip-success" : "chip-muted"}`}>
                      {emp.has_fingerprint ? `${emp.fingerprint_count || 1}× Finger` : "No FP"}
                    </span>
                    <span className={`chip ${emp.has_face ? "chip-warning" : "chip-muted"}`}>
                      {emp.has_face ? "Face ✓" : "No Face"}
                    </span>
                    <span className={`chip ${emp.status === "active" ? "chip-success" : "chip-muted"}`}>
                      {emp.status}
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Detail / Form panel */}
        <div>
          <div className="panel">
            <div className="panel-header">
              <div>
                <div className="panel-title">{form.id ? `Edit — ${selected?.name}` : "New Employee"}</div>
                <div className="panel-desc">{form.id ? `ID: ${form.id}` : "Fill in details to register a new employee"}</div>
              </div>
              {form.id && (
                <button className="btn btn-ghost btn-sm" onClick={resetForm}>Clear</button>
              )}
            </div>
            <div className="panel-body">
              {msg && <Banner type={msgType} onClose={() => setMsg("")}>{msg}</Banner>}

              <form onSubmit={saveEmployee}>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Employee Code</label>
                    <input className="form-input" value={form.employeeCode} placeholder="EMP-001"
                      onChange={e => setForm(f => ({ ...f, employeeCode: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select className="form-select" value={form.status}
                      onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} placeholder="Muhammad Ahmad"
                    required onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
                </div>
                <div className="form-group">
                  <label className="form-label">CNIC *</label>
                  <input className="form-input" value={form.cnic} placeholder="42101-1234567-1"
                    required onChange={e => setForm(f => ({ ...f, cnic: e.target.value }))} />
                </div>
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input className="form-input" value={form.department} placeholder="Engineering"
                      onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Designation</label>
                    <input className="form-input" value={form.designation} placeholder="Senior Engineer"
                      onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                  <button className="btn btn-primary" type="submit" disabled={saving}>
                    {saving ? "Saving…" : form.id ? "Save Changes" : "Create Employee"}
                  </button>
                  <button className="btn btn-ghost" type="button" onClick={resetForm}>Reset</button>
                </div>
              </form>
            </div>
          </div>

          {/* Biometric tools — only when employee selected */}
          {selected && (
            <>
              {/* Fingerprint Slots */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Fingerprint Slots</div>
                    <div className="panel-desc">
                      {fingerprints.length} enrolled · preferred: {fingerprints.find(f => f.is_preferred)?.finger_code ? fingerLabel(fingerprints.find(f => f.is_preferred).finger_code) : "none"}
                    </div>
                  </div>
                  <div className="panel-actions">
                    {fpPlan?.missingRecommended?.[0] && (
                      <button className="btn btn-primary btn-sm" onClick={() => launchEnroll(selected.id, fpPlan.missingRecommended[0].fingerCode)}>
                        <Icon.Plus />Enroll Next Finger
                      </button>
                    )}
                  </div>
                </div>
                <div className="panel-body">
                  {activeConflictCount > 0 && (
                    <Banner type="danger">
                      {activeConflictCount} active fingerprint conflict{activeConflictCount > 1 ? "s" : ""} detected for this employee. Remove or re-enroll the duplicate slot before using global verification.
                    </Banner>
                  )}
                  {activeConflictCount === 0 && historicalConflictCount > 0 && (
                    <Banner type="warning">
                      {historicalConflictCount} historical fingerprint conflict log{historicalConflictCount > 1 ? "s" : ""} found for this employee, but no active duplicate template is blocking verification right now.
                    </Banner>
                  )}
                  {activeConflictCount === 0 && historicalConflictCount > 0 && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => clearFingerprintConflictHistory(selected.id)}>
                        <Icon.CheckCircle />Clear FP Conflict History
                      </button>
                    </div>
                  )}

                  {fpPlan && (
                    <div className="finger-grid" style={{ marginBottom: 16 }}>
                      {fpPlan.recommended.map(item => (
                        <div
                          key={item.fingerCode}
                          className={`finger-slot ${item.enrolled ? "enrolled" : ""} ${item.isPreferred ? "preferred" : ""}`}
                          onClick={() => !item.enrolled && launchEnroll(selected.id, item.fingerCode)}
                          style={{ cursor: item.enrolled ? "default" : "pointer" }}
                          title={item.enrolled ? fingerLabel(item.fingerCode) : `Enroll ${fingerLabel(item.fingerCode)}`}
                        >
                          {item.isPreferred && <div className="preferred-pip" />}
                          <div className="finger-slot-icon">{item.enrolled ? "🖐" : "+"}</div>
                          <div className="finger-slot-label">{fingerLabel(item.fingerCode)}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  {fingerprints.length > 0 && (
                    <div className="table-wrap">
                      <table>
                        <thead><tr><th>Finger</th><th>Format</th><th>Source</th><th>Updated</th><th>Actions</th></tr></thead>
                        <tbody>
                          {fingerprints.map(fp => (
                            <tr key={fp.id}>
                              <td>
                                <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                  {fingerLabel(fp.finger_code)}
                                  {fp.is_preferred ? <span className="badge badge-success">Preferred</span> : null}
                                </strong>
                              </td>
                              <td><span>{fp.template_format}</span></td>
                              <td><span>{fp.source || "—"}</span></td>
                              <td><span>{fmtDate(fp.updated_at)}</span></td>
                              <td>
                                <div style={{ display: "flex", gap: 5 }}>
                                  {!fp.is_preferred && (
                                    <button className="btn btn-ghost btn-sm" onClick={() => setPreferred(selected.id, fp.id)} title="Set as preferred">
                                      <Icon.Star />
                                    </button>
                                  )}
                                  <button className="btn btn-ghost btn-sm" onClick={() => launchEnroll(selected.id, fp.finger_code)} title="Re-enroll">
                                    <Icon.Refresh />
                                  </button>
                                  <button className="btn btn-danger btn-sm" onClick={() => deleteSlot(selected.id, fp.id)} title="Delete slot">
                                    <Icon.Trash />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  <div style={{ display: "flex", gap: 8, marginTop: fingerprints.length > 0 ? 16 : 0, flexWrap: "wrap" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => launchVerify(selected.id)}>
                      <Icon.Fingerprint />Verify
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => markManual(selected.id)}>
                      <Icon.CheckCircle />Manual Attendance
                    </button>
                  </div>
                </div>
              </div>

              {/* Face Enrollment */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Face Enrollment</div>
                    <div className="panel-desc">Enroll face encoding for {selected.name}</div>
                  </div>
                  <span className={`badge ${selected.has_face ? "badge-success" : "badge-muted"}`}>
                    {selected.has_face ? "Face enrolled" : "Not enrolled"}
                  </span>
                </div>
                <div className="panel-body">
                  {faceConflicts.activeConflicts?.length > 0 && (
                    <Banner type="danger">
                      {faceConflicts.activeConflicts.length} active face conflict{faceConflicts.activeConflicts.length > 1 ? "s" : ""} detected for this employee. Review the similar employee profile before using or re-enrolling this face.
                    </Banner>
                  )}
                  {faceConflicts.activeConflicts?.length === 0 && faceConflicts.recentConflicts?.length > 0 && (
                    <Banner type="warning">
                      {faceConflicts.recentConflicts.length} historical face conflict log{faceConflicts.recentConflicts.length > 1 ? "s" : ""} found for this employee, but no active duplicate face profile is blocking enrollment right now.
                    </Banner>
                  )}
                  {faceConflicts.activeConflicts?.length === 0 && faceConflicts.recentConflicts?.length > 0 && (
                    <div style={{ display: "flex", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
                      <button className="btn btn-ghost btn-sm" onClick={() => clearFaceConflictHistory(selected.id)}>
                        <Icon.CheckCircle />Clear Face Conflict History
                      </button>
                    </div>
                  )}
                  <div className={`camera-wrap ${camActive ? "camera-active" : ""}`}>
                    <video ref={videoRef} autoPlay muted playsInline />
                    {!camActive && (
                      <div className="camera-placeholder">
                        <Icon.Camera />
                        <p>Start camera to enroll face</p>
                      </div>
                    )}
                    <div className="scan-line" />
                    <div className="scan-corner tl" /><div className="scan-corner tr" />
                    <div className="scan-corner bl" /><div className="scan-corner br" />
                  </div>
                  {camErr && <Banner type="danger">{camErr}</Banner>}
                  {faceMsg && <Banner type="info">{faceMsg}</Banner>}
                  {lastFaceAnalysis && <FaceQualityPanel analysis={lastFaceAnalysis} />}
                  <div className="camera-toolbar">
                    <label className="camera-select">
                      <span>Camera</span>
                      <select value={selectedDeviceId} onChange={e => setSelectedDeviceId(e.target.value)}>
                        <option value="">Auto-select Logitech HD 1080p</option>
                        {videoDevices.map(device => (
                          <option key={device.deviceId} value={device.deviceId}>
                            {device.label || `Camera ${device.deviceId.slice(0, 6)}`}
                          </option>
                        ))}
                      </select>
                    </label>
                    <div className="sample-count">
                      Samples: <strong>{faceSamples.length}</strong> / {FACE_ENROLL_MAX_SAMPLES}
                    </div>
                  </div>
                  {faceSamples.length > 0 && (
                    <div className="sample-strip">
                      {faceSamples.map((sample, index) => (
                        <img key={`${index}-${sample.length}`} src={sample} alt={`Face sample ${index + 1}`} className="sample-thumb" />
                      ))}
                    </div>
                  )}
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {!camActive
                      ? <button className="btn btn-secondary btn-sm" onClick={startCam}><Icon.Camera />Start Camera</button>
                      : <button className="btn btn-ghost btn-sm" onClick={stopCam}><Icon.CameraOff />Stop</button>}
                    <button className="btn btn-secondary btn-sm" onClick={captureFaceSample} disabled={!camActive || faceCaptureAnalyzing}>
                      <Icon.Camera />{faceCaptureAnalyzing ? "Checking..." : "Capture Sample"}
                    </button>
                    <button className="btn btn-ghost btn-sm" onClick={() => setFaceSamples([])} disabled={faceSamples.length === 0}>
                      <Icon.Trash />Clear Samples
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={enrollFace} disabled={!camActive || faceCaptureAnalyzing || faceSamples.length < FACE_ENROLL_MIN_SAMPLES}>
                      <Icon.Face />Enroll Face
                    </button>
                    {selected.has_face && (
                      <button className="btn btn-danger btn-sm" onClick={() => deleteFaceProfile(selected.id)}>
                        <Icon.Trash />Clear Face Profile
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* Attendance History */}
              <div className="panel">
                <div className="panel-header">
                  <div>
                    <div className="panel-title">Attendance History</div>
                    <div className="panel-desc">Last 60 records for {selected.name}</div>
                  </div>
                </div>
                <div className="panel-body">
                  {history.length === 0
                    ? <div className="empty-state"><Icon.Clock /><p>No attendance records yet</p></div>
                    : (
                      <div className="timeline">
                        {history.map(row => (
                          <div key={row.id} className="tl-item">
                            <div className={`tl-dot ${row.check_out ? "out" : "in"}`} />
                            <div>
                              <div className="tl-date">{row.date}</div>
                              <div className="tl-times">
                                In: {fmtTime(row.check_in)} · Out: {fmtTime(row.check_out)}
                                {row.check_in_method && ` · ${row.check_in_method}`}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   REPORTS VIEW
═══════════════════════════════════════════════════════════════════════════ */
function ReportsView({ token }) {
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState({ dateFrom: "", dateTo: "", method: "", status: "" });
  const [loading, setLoading] = useState(false);

  async function load() {
    setLoading(true);
    const q = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => { if (v) q.set(k, v); });
    const res = await api(`/api/attendance${q.toString() ? `?${q}` : ""}`, {}, token);
    setLoading(false);
    if (res.ok) setRows(res.data);
  }

  async function exportCsv() {
    const q = new URLSearchParams();
    Object.entries(filter).forEach(([k, v]) => { if (v) q.set(k, v); });
    const res = await fetch(`${API}/api/attendance/export.csv${q.toString() ? `?${q}` : ""}`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    });
    if (!res.ok) { alert("Export failed."); return; }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `attendance-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
  }

  useEffect(() => { load(); }, []);

  return (
    <div className="view">
      <div className="view-header">
        <div className="view-header-left">
          <div className="eyebrow">Insights</div>
          <h1 className="view-title">Attendance Reports</h1>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-secondary" onClick={exportCsv}><Icon.Download />Export CSV</button>
          <button className="btn btn-primary" onClick={load}><Icon.Refresh />Refresh</button>
        </div>
      </div>

      <div className="panel">
        <div className="filter-bar">
          <div className="filter-group">
            <span className="filter-label">Date From</span>
            <input className="form-input" type="date" style={{ fontSize: 12 }}
              value={filter.dateFrom} onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))} />
          </div>
          <div className="filter-group">
            <span className="filter-label">Date To</span>
            <input className="form-input" type="date" style={{ fontSize: 12 }}
              value={filter.dateTo} onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))} />
          </div>
          <div className="filter-group">
            <span className="filter-label">Method</span>
            <select className="form-select" style={{ fontSize: 12 }}
              value={filter.method} onChange={e => setFilter(f => ({ ...f, method: e.target.value }))}>
              <option value="">All methods</option>
              <option value="fingerprint">Fingerprint</option>
              <option value="face">Face</option>
              <option value="manual">Manual</option>
            </select>
          </div>
          <div className="filter-group">
            <span className="filter-label">Status</span>
            <select className="form-select" style={{ fontSize: 12 }}
              value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
              <option value="">All sessions</option>
              <option value="open">Open</option>
              <option value="closed">Closed</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={load} style={{ alignSelf: "flex-end" }}>Apply</button>
        </div>

        <div className="table-wrap">
          {loading ? (
            <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>Loading…</div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Employee</th>
                  <th>Department</th>
                  <th>Date</th>
                  <th>Check In</th>
                  <th>Check Out</th>
                  <th>Devices</th>
                  <th>Methods</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><Icon.Reports /><p>No attendance records match your filters</p></div></td></tr>
                ) : rows.map(row => (
                  <tr key={row.id}>
                    <td><strong>{row.name}</strong><span>{row.employee_code}</span></td>
                    <td>{row.department || "—"}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.date}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtTime(row.check_in)}</td>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtTime(row.check_out)}</td>
                    <td><span>{row.check_in_device || "—"}</span></td>
                    <td>
                      {row.check_in_method && <span className="badge badge-info" style={{ marginRight: 4 }}>{row.check_in_method}</span>}
                      {row.check_out_method && <span className="badge badge-muted">{row.check_out_method}</span>}
                    </td>
                    <td>
                      {row.check_out
                        ? <span className="badge badge-success">Closed</span>
                        : <span className="badge badge-warning">Open</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   AUDIT VIEW
═══════════════════════════════════════════════════════════════════════════ */
function AuditView({ token }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await api("/api/audit-logs", {}, token);
    setLoading(false);
    if (res.ok) setRows(res.data);
  }

  useEffect(() => { load(); }, []);

  const eventColor = (type) => {
    if (type?.startsWith("attendance.check_in")) return "badge-success";
    if (type?.startsWith("attendance.check_out")) return "badge-warning";
    if (type?.includes(".conflict.cleared")) return "badge-success";
    if (type?.includes("conflict")) return "badge-danger";
    if (type?.includes("delete")) return "badge-danger";
    if (type?.includes("create") || type?.includes("enroll")) return "badge-info";
    return "badge-muted";
  };

  return (
    <div className="view">
      <div className="view-header">
        <div className="view-header-left">
          <div className="eyebrow">Security</div>
          <h1 className="view-title">Audit Trail</h1>
        </div>
        <div className="view-header-actions">
          <button className="btn btn-secondary" onClick={load}><Icon.Refresh />Refresh</button>
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <div>
            <div className="panel-title">All Events</div>
            <div className="panel-desc">Complete tamper-evident log of all system actions</div>
          </div>
          <span className="badge badge-muted">{rows.length} events</span>
        </div>
        <div className="table-wrap">
          {loading
            ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>Loading…</div>
            : (
              <table>
                <thead>
                  <tr><th>#</th><th>Event</th><th>Summary</th><th>Target</th><th>Actor</th><th>When</th></tr>
                </thead>
                <tbody>
                  {rows.length === 0
                    ? <tr><td colSpan={6}><div className="empty-state"><Icon.Shield /><p>No audit events</p></div></td></tr>
                    : rows.map(row => (
                      <tr key={row.id}>
                        <td><span>{row.id}</span></td>
                        <td><span className={`badge ${eventColor(row.event_type)}`}>{row.event_type}</span></td>
                        <td><strong>{row.summary}</strong></td>
                        <td><span>{row.target_type} #{row.target_id || "—"}</span></td>
                        <td>{row.actor_name || "System / Device"}</td>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, whiteSpace: "nowrap" }}>{fmtDT(row.created_at)}</td>
                      </tr>
                    ))
                  }
                </tbody>
              </table>
            )}
        </div>
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   ROOT APP
═══════════════════════════════════════════════════════════════════════════ */
export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem("ams_token") || "");
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState("dashboard");
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const [overview, setOverview] = useState(null);
  const [auditRows, setAuditRows] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [stationStatus, setStationStatus] = useState({
    fingerprint: { status: "loading", message: "Checking…" },
    face: { status: "loading", message: "Checking…" },
  });
  const [latestEvent, setLatestEvent] = useState(null);
  const [stationMsg, setStationMsg] = useState("");
  const [conflicts, setConflicts] = useState({ exactDuplicates: [], recentConflicts: [] });

  const activeConflictCount = conflicts.exactDuplicates?.length || 0;
  const historicalConflictCount = conflicts.recentConflicts?.length || 0;

  /* ── Auth ── */
  useEffect(() => {
    if (!token) { setUser(null); return; }
    let cancel = false;
    api("/api/auth/me", {}, token).then(res => {
      if (cancel) return;
      if (!res.ok) { localStorage.removeItem("ams_token"); setToken(""); setUser(null); return; }
      setUser(res.data);
    });
    return () => { cancel = true; };
  }, [token]);

  /* ── Initial data load ── */
  useEffect(() => {
    if (!user) return;
    refreshAll();
  }, [user]);

  /* ── Station polling ── */
  useEffect(() => {
    if (!user || activeView !== "station") return;
    const id = setInterval(() => { refreshOverview(); refreshStation(); }, 5000);
    return () => clearInterval(id);
  }, [user, activeView]);

  async function refreshOverview() {
    const res = await api("/api/dashboard/overview", {}, token);
    if (res.ok) {
      setOverview(res.data);
      setAuditRows(res.data.recentAuditLogs || []);
      const evt = (res.data.recentAuditLogs || []).find(r => r.event_type?.startsWith("attendance."));
      setLatestEvent(evt || null);
    }
  }

  async function refreshEmployees() {
    const res = await api("/api/employees", {}, token);
    if (res.ok) setEmployees(res.data);
  }

  async function refreshStation() {
    const [fp, face] = await Promise.all([
      api("/api/biometrics/fingerprint/status", {}, token),
      api("/api/biometrics/face/status", {}, token),
    ]);
    setStationStatus({ fingerprint: fp.data, face: face.data });
  }

  async function refreshConflicts() {
    const res = await api("/api/biometrics/fingerprint/conflicts", {}, token);
    if (res.ok) setConflicts(res.data);
  }

  function refreshAll() {
    refreshOverview();
    refreshEmployees();
    refreshStation();
    refreshConflicts();
  }

  async function launchVerify() {
    const res = await api("/api/biometrics/fingerprint/launch-verify", { method: "POST", body: JSON.stringify({}) }, token);
    setStationMsg(res.data.message || "Fingerprint verification launched.");
    refreshStation(); refreshOverview();
  }

  function handleLogin(tok, usr) {
    setToken(tok); setUser(usr); setActiveView("dashboard");
  }

  function handleLogout() {
    localStorage.removeItem("ams_token");
    setToken(""); setUser(null);
  }

  function handleNav(view) {
    setActiveView(view);
    setMobileOpen(false);
  }

  if (!user) return <AuthPage onLogin={handleLogin} />;

  return (
    <div className="app-shell">
      <Sidebar
        user={user}
        activeView={activeView}
        onNav={handleNav}
        onLogout={handleLogout}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(c => !c)}
        conflictCount={activeConflictCount}
        mobileOpen={mobileOpen}
        onOverlayClick={() => setMobileOpen(false)}
      />

      <div className="workspace">
        <Topbar
          view={activeView}
          fpStatus={stationStatus.fingerprint}
          onMobileMenu={() => setMobileOpen(o => !o)}
          onRefresh={refreshAll}
        />

        {activeView === "dashboard" && (
          <DashboardView
            overview={overview}
            auditRows={auditRows}
            conflictCount={activeConflictCount}
            onRefresh={refreshOverview}
          />
        )}

        {activeView === "station" && (
          <StationView
            token={token}
            stationStatus={stationStatus}
            latestEvent={latestEvent}
            conflictCount={activeConflictCount}
            stationMsg={stationMsg}
            onRefresh={refreshOverview}
            onLaunchVerify={launchVerify}
            onRefreshStatus={refreshStation}
          />
        )}

        {activeView === "employees" && (
          <EmployeesView
            token={token}
            employees={employees}
            onRefreshEmployees={refreshEmployees}
          />
        )}

        {activeView === "reports" && <ReportsView token={token} />}
        {activeView === "audit"   && <AuditView   token={token} />}
      </div>
    </div>
  );
}
