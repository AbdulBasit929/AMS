// import { useEffect, useMemo, useRef, useState, useCallback } from "react";

// const API = "http://127.0.0.1:4000";
// const DEFAULT_CREDS = { email: "admin@attendance.local", password: "Admin@12345" };

// /* ─── ICONS (inline SVG) ──────────────────────────────────────────────────── */
// const Icon = {
//   Logo: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
//     </svg>
//   ),
//   Dashboard: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/>
//       <rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/>
//     </svg>
//   ),
//   Station: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
//     </svg>
//   ),
//   Employees: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
//       <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
//     </svg>
//   ),
//   Reports: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
//       <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
//     </svg>
//   ),
//   Audit: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
//     </svg>
//   ),
//   ChevronLeft: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
//       <polyline points="15 18 9 12 15 6"/>
//     </svg>
//   ),
//   LogOut: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
//     </svg>
//   ),
//   Menu: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//       <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
//     </svg>
//   ),
//   Refresh: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
//     </svg>
//   ),
//   Download: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
//     </svg>
//   ),
//   Plus: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
//       <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
//     </svg>
//   ),
//   Fingerprint: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M12 10a2 2 0 0 0-2 2c0 1.02.15 2.12.4 3.14"/><path d="M12 6a6 6 0 0 1 6 6c0 1.25-.2 2.45-.57 3.57"/>
//       <path d="M12 2a10 10 0 0 1 10 10c0 1.64-.31 3.21-.87 4.65"/><path d="M12 14c0 2 .51 4 1.33 5.5"/>
//       <path d="M9.56 17.56C9.22 16.43 9 15.22 9 14c0-1.66 1.34-3 3-3"/>
//       <path d="M6.14 15.1C6.05 14.74 6 14.38 6 14a6 6 0 0 1 6-6"/>
//       <path d="M3.08 12.93A10 10 0 0 0 3 14c0 1.05.11 2.08.31 3.07"/>
//     </svg>
//   ),
//   Face: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>
//     </svg>
//   ),
//   Camera: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>
//     </svg>
//   ),
//   CameraOff: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/>
//     </svg>
//   ),
//   Users: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
//       <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
//     </svg>
//   ),
//   Shield: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
//     </svg>
//   ),
//   Clock: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
//     </svg>
//   ),
//   AlertTriangle: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
//     </svg>
//   ),
//   CheckCircle: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
//     </svg>
//   ),
//   Info: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
//     </svg>
//   ),
//   Trash: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
//     </svg>
//   ),
//   Star: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
//     </svg>
//   ),
//   TrendUp: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>
//     </svg>
//   ),
//   Activity: () => (
//     <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
//       <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>
//     </svg>
//   ),
// };

// /* ─── HELPERS ─────────────────────────────────────────────────────────────── */
// async function api(path, opts = {}, token) {
//   const res = await fetch(`${API}${path}`, {
//     headers: {
//       "Content-Type": "application/json",
//       ...(token ? { Authorization: `Bearer ${token}` } : {}),
//       ...(opts.headers || {}),
//     },
//     ...opts,
//   });
//   const ct = res.headers.get("content-type") || "";
//   const data = ct.includes("application/json")
//     ? await res.json()
//     : { message: await res.text() };
//   return { ok: res.ok, status: res.status, data };
// }

// function initials(name = "") {
//   return name.split(" ").slice(0, 2).map(w => w[0]).join("").toUpperCase();
// }

// function fmtTime(dt) {
//   if (!dt) return "—";
//   return new Date(dt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
// }
// function fmtDate(dt) {
//   if (!dt) return "—";
//   return new Date(dt).toLocaleDateString([], { month: "short", day: "numeric", year: "numeric" });
// }
// function fmtDT(dt) {
//   if (!dt) return "—";
//   return new Date(dt).toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
// }

// function fingerLabel(code) {
//   return (code || "").split("_").filter(Boolean).map(p => p[0].toUpperCase() + p.slice(1)).join(" ");
// }

// /* ─── BANNER ──────────────────────────────────────────────────────────────── */
// function Banner({ type = "info", children, onClose }) {
//   const icons = { info: Icon.Info, success: Icon.CheckCircle, warning: Icon.AlertTriangle, danger: Icon.AlertTriangle };
//   const Ic = icons[type] || Icon.Info;
//   return (
//     <div className={`banner banner-${type}`}>
//       <Ic /><span style={{ flex: 1 }}>{children}</span>
//       {onClose && <button className="btn btn-ghost btn-sm" style={{ padding: "2px 6px" }} onClick={onClose}>✕</button>}
//     </div>
//   );
// }

// /* ─── METRIC CARD ─────────────────────────────────────────────────────────── */
// function MetricCard({ label, value, tone = "", helper, icon: Ic }) {
//   return (
//     <div className={`metric-card ${tone}`}>
//       <div className="metric-icon">{Ic ? <Ic /> : null}</div>
//       <div className="metric-value">{value ?? "—"}</div>
//       <div className="metric-label">{label}</div>
//       {helper && <div className="metric-helper">{helper}</div>}
//     </div>
//   );
// }

// /* ─── SERVICE PILL ────────────────────────────────────────────────────────── */
// function ServicePill({ label, status, message }) {
//   const tone = status === "ok" ? "ok" : status === "warning" || status === "loading" ? "warn" : "err";
//   return (
//     <div className={`service-pill ${tone}`}>
//       <span className="spill-dot" />
//       <span className="spill-name">{label}</span>
//       <span className="spill-stat">{status}</span>
//       {message && <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>· {message.slice(0, 48)}</span>}
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════════════════════════════
//    AUTH PAGE
// ═══════════════════════════════════════════════════════════════════════════ */
// function AuthPage({ onLogin }) {
//   const [form, setForm] = useState(DEFAULT_CREDS);
//   const [error, setError] = useState("");
//   const [loading, setLoading] = useState(false);

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setLoading(true); setError("");
//     const res = await api("/api/auth/login", { method: "POST", body: JSON.stringify(form) });
//     setLoading(false);
//     if (!res.ok) { setError(res.data.message || "Login failed"); return; }
//     localStorage.setItem("ams_token", res.data.token);
//     onLogin(res.data.token, res.data.user);
//   }

//   return (
//     <div className="auth-shell">
//       {/* Left visual */}
//       <div className="auth-visual">
//         <div className="auth-visual-grid" />
//         <div className="auth-visual-glow" />
//         <div className="auth-visual-content">
//           <div className="eyebrow" style={{ marginBottom: 16 }}>Biometric Attendance System</div>
//           <h1 className="auth-headline">
//             Enterprise workforce<br /><em>identity platform</em>
//           </h1>
//           <p className="auth-body-text">
//             Fingerprint and facial recognition attendance tracking with real-time audit trails, multi-station support, and role-based access control.
//           </p>
//           <div className="auth-stats">
//             <div>
//               <div className="auth-stat-value">99.9%</div>
//               <div className="auth-stat-label">Uptime SLA</div>
//             </div>
//             <div>
//               <div className="auth-stat-value">&lt; 1s</div>
//               <div className="auth-stat-label">Verification speed</div>
//             </div>
//             <div>
//               <div className="auth-stat-value">AES-256</div>
//               <div className="auth-stat-label">Data encryption</div>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* Right form */}
//       <div className="auth-form-side">
//         <div className="auth-form-card">
//           <div className="auth-logo">
//             <div className="auth-logo-icon"><Icon.Logo /></div>
//             <div>
//               <div className="auth-logo-name">BioTime AMS</div>
//               <div className="auth-logo-sub">v2.0 Enterprise</div>
//             </div>
//           </div>

//           <div className="auth-form-title">Welcome back</div>
//           <div className="auth-form-desc">Sign in to access your attendance management console.</div>

//           <form onSubmit={handleSubmit}>
//             <div className="form-group">
//               <label className="form-label">Email address</label>
//               <input
//                 className="form-input"
//                 type="email"
//                 placeholder="admin@company.local"
//                 value={form.email}
//                 onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
//                 autoFocus
//               />
//             </div>
//             <div className="form-group">
//               <label className="form-label">Password</label>
//               <input
//                 className="form-input"
//                 type="password"
//                 placeholder="••••••••"
//                 value={form.password}
//                 onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
//               />
//             </div>

//             {error && <Banner type="danger">{error}</Banner>}

//             <button className="btn btn-primary" type="submit" disabled={loading}
//               style={{ width: "100%", justifyContent: "center", marginTop: 8 }}>
//               {loading ? "Authenticating…" : "Sign In"}
//             </button>
//           </form>

//           <div className="auth-cred-tip">
//             <div className="auth-cred-tip-title">Bootstrap credentials</div>
//             <div className="auth-cred-row"><span>Email</span><code>{DEFAULT_CREDS.email}</code></div>
//             <div className="auth-cred-row"><span>Password</span><code>{DEFAULT_CREDS.password}</code></div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════════════════════════════
//    SIDEBAR
// ═══════════════════════════════════════════════════════════════════════════ */
// function Sidebar({ user, activeView, onNav, onLogout, collapsed, onToggleCollapse, conflictCount, mobileOpen, onOverlayClick }) {
//   const navItems = useMemo(() => {
//     const base = [
//       { id: "dashboard", label: "Dashboard",        icon: Icon.Dashboard },
//       { id: "station",   label: "Attendance Station", icon: Icon.Station },
//       { id: "reports",   label: "Reports",           icon: Icon.Reports },
//       { id: "audit",     label: "Audit Log",         icon: Icon.Audit },
//     ];
//     if (user?.role === "admin" || user?.role === "operator") {
//       base.splice(2, 0, { id: "employees", label: "Employees", icon: Icon.Employees });
//     }
//     return base;
//   }, [user]);

//   return (
//     <>
//       {mobileOpen && <div className="sidebar-overlay" onClick={onOverlayClick} />}
//       <aside className={`sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
//         {/* Header */}
//         <div className="sidebar-header">
//           <div className="brand-mark">
//             <div className="brand-icon"><Icon.Logo /></div>
//             <div className="brand-text">
//               <div className="brand-name">BioTime AMS</div>
//               <div className="brand-sub">Enterprise</div>
//             </div>
//           </div>
//           <button className="collapse-btn" onClick={onToggleCollapse} title={collapsed ? "Expand" : "Collapse"}>
//             <Icon.ChevronLeft />
//           </button>
//         </div>

//         {/* Nav */}
//         <nav className="nav-section">
//           <div className="nav-label">Navigation</div>
//           {navItems.map(item => (
//             <button
//               key={item.id}
//               className={`nav-item ${activeView === item.id ? "active" : ""}`}
//               onClick={() => onNav(item.id)}
//               title={collapsed ? item.label : undefined}
//             >
//               <span className="nav-icon"><item.icon /></span>
//               <span className="nav-text">{item.label}</span>
//               {item.id === "station" && conflictCount > 0 && (
//                 <span className="nav-badge">{conflictCount}</span>
//               )}
//             </button>
//           ))}
//         </nav>

//         {/* User */}
//         <div className="sidebar-footer">
//           <div className="user-tile">
//             <div className="avatar">{initials(user?.name || "")}</div>
//             <div className="user-info">
//               <div className="user-name">{user?.name}</div>
//               <div className="user-role">{user?.role}</div>
//             </div>
//             <button className="signout-btn" onClick={onLogout} title="Sign out">
//               <Icon.LogOut />
//             </button>
//           </div>
//         </div>
//       </aside>
//     </>
//   );
// }

// /* ════════════════════════════════════════════════════════════════════════════
//    TOPBAR
// ═══════════════════════════════════════════════════════════════════════════ */
// function Topbar({ view, fpStatus, onMobileMenu, onRefresh }) {
//   const titles = {
//     dashboard: { eye: "Live Operations", title: "Dashboard" },
//     station:   { eye: "Operator Console", title: "Attendance Station" },
//     employees: { eye: "Workforce Registry", title: "Employees" },
//     reports:   { eye: "Insights", title: "Reports" },
//     audit:     { eye: "Security", title: "Audit Trail" },
//   };
//   const { eye, title } = titles[view] || { eye: "", title: "" };
//   const status = fpStatus?.status;
//   const pillTone = status === "ok" ? "" : status === "warning" ? "warn" : "err";

//   return (
//     <div className="topbar">
//       <div className="topbar-left">
//         <button className="mobile-menu-btn" onClick={onMobileMenu}><Icon.Menu /></button>
//         <div>
//           <div className="page-eyebrow">{eye}</div>
//           <div className="page-title">{title}</div>
//         </div>
//       </div>
//       <div className="topbar-right">
//         <div className="topbar-pill">
//           <span className={`pill-dot ${pillTone}`} />
//           <span>Fingerprint</span>
//         </div>
//         <button className="btn btn-ghost btn-sm" onClick={onRefresh} title="Refresh">
//           <Icon.Refresh />
//         </button>
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════════════════════════════
//    DASHBOARD VIEW
// ═══════════════════════════════════════════════════════════════════════════ */
// function DashboardView({ overview, auditRows, conflictCount, onRefresh }) {
//   const stats = overview?.employeeStats || {};
//   const today = overview?.todayStats || {};

//   return (
//     <div className="view">
//       <div className="view-header">
//         <div className="view-header-left">
//           <div className="eyebrow">Live Operations</div>
//           <h1 className="view-title">Dashboard</h1>
//         </div>
//         <div className="view-header-actions">
//           <button className="btn btn-secondary" onClick={onRefresh}><Icon.Refresh />Refresh</button>
//         </div>
//       </div>

//       <div className="metrics-grid">
//         <MetricCard label="Total Employees"     value={stats.totalEmployees ?? 0}     icon={Icon.Users} />
//         <MetricCard label="Active Employees"    value={stats.activeEmployees ?? 0}    icon={Icon.CheckCircle} tone="success" />
//         <MetricCard label="Finger Slots"        value={stats.fingerprintTemplates ?? 0} icon={Icon.Fingerprint} tone="success" helper="Multiple fingers per employee" />
//         <MetricCard label="Face Enrolled"       value={stats.faceEnrolled ?? 0}       icon={Icon.Face} tone="warning" />
//         <MetricCard label="Today Check-Ins"     value={today.checkIns ?? 0}           icon={Icon.TrendUp} />
//         <MetricCard label="Open Sessions"       value={today.openSessions ?? 0}       icon={Icon.Clock} tone={today.openSessions > 0 ? "danger" : ""} />
//       </div>

//       {conflictCount > 0 && (
//         <Banner type="danger">
//           <strong>{conflictCount} fingerprint conflict{conflictCount > 1 ? "s" : ""}</strong> detected. Resolve duplicate ownership issues before using global verification.
//         </Banner>
//       )}

//       <div className="panel">
//         <div className="panel-header">
//           <div>
//             <div className="panel-title">Recent Attendance</div>
//             <div className="panel-desc">Latest biometric and manual entries across all stations.</div>
//           </div>
//         </div>
//         <div className="table-wrap">
//           <table>
//             <thead>
//               <tr>
//                 <th>Employee</th>
//                 <th>Date</th>
//                 <th>Check In</th>
//                 <th>Check Out</th>
//                 <th>Methods</th>
//                 <th>Status</th>
//               </tr>
//             </thead>
//             <tbody>
//               {(overview?.recentAttendance || []).length === 0 ? (
//                 <tr><td colSpan={6}><div className="empty-state"><Icon.Activity /><p>No attendance records yet</p></div></td></tr>
//               ) : (overview?.recentAttendance || []).map(row => (
//                 <tr key={row.id}>
//                   <td>
//                     <strong>{row.name}</strong>
//                     <span>{row.employee_code || "No code"}</span>
//                   </td>
//                   <td>{row.date}</td>
//                   <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtTime(row.check_in)}</td>
//                   <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtTime(row.check_out)}</td>
//                   <td>
//                     <span className="badge badge-info">{row.check_in_method || "—"}</span>
//                     {row.check_out_method && <span className="badge badge-muted" style={{ marginLeft: 4 }}>{row.check_out_method}</span>}
//                   </td>
//                   <td>
//                     {row.check_out
//                       ? <span className="badge badge-success"><span className="badge-dot" />Closed</span>
//                       : <span className="badge badge-warning"><span className="badge-dot" />Open</span>}
//                   </td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>

//       <div className="panel">
//         <div className="panel-header">
//           <div>
//             <div className="panel-title">Audit Trail</div>
//             <div className="panel-desc">Recent security and operational events.</div>
//           </div>
//         </div>
//         <div className="table-wrap">
//           <table>
//             <thead>
//               <tr><th>Event</th><th>Type</th><th>Actor</th><th>When</th></tr>
//             </thead>
//             <tbody>
//               {(auditRows || []).slice(0, 12).map(row => (
//                 <tr key={row.id}>
//                   <td><strong>{row.summary}</strong></td>
//                   <td><span className="badge badge-muted">{row.event_type}</span></td>
//                   <td>{row.actor_name || "System"}</td>
//                   <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, whiteSpace: "nowrap" }}>{fmtDT(row.created_at)}</td>
//                 </tr>
//               ))}
//             </tbody>
//           </table>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════════════════════════════
//    STATION VIEW
// ═══════════════════════════════════════════════════════════════════════════ */
// function StationView({ token, stationStatus, latestEvent, conflictCount, stationMsg, onRefresh, onLaunchVerify, onRefreshStatus }) {
//   const fp = stationStatus.fingerprint || {};
//   const face = stationStatus.face || {};
//   const agentOk = fp.mode === "local-agent";

//   const videoRef = useRef(null);
//   const streamRef = useRef(null);
//   const [camActive, setCamActive] = useState(false);
//   const [camErr, setCamErr] = useState("");
//   const [faceMsg, setFaceMsg] = useState("");
//   const [faceLoading, setFaceLoading] = useState(false);

//   async function startCam() {
//     setCamErr("");
//     try {
//       const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 } }, audio: false });
//       streamRef.current = s;
//       if (videoRef.current) videoRef.current.srcObject = s;
//       setCamActive(true);
//     } catch (e) { setCamErr(e.message); }
//   }

//   function stopCam() {
//     streamRef.current?.getTracks().forEach(t => t.stop());
//     streamRef.current = null;
//     if (videoRef.current) videoRef.current.srcObject = null;
//     setCamActive(false);
//   }

//   function captureFrame() {
//     if (!videoRef.current) return null;
//     const v = videoRef.current;
//     const c = document.createElement("canvas");
//     c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
//     c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
//     return c.toDataURL("image/jpeg", 0.92);
//   }

//   async function verifyFace() {
//     const img = captureFrame();
//     if (!img) { setFaceMsg("Start the camera first."); return; }
//     setFaceLoading(true); setFaceMsg("");
//     const res = await api("/api/biometrics/face/verify", { method: "POST", body: JSON.stringify({ imageBase64: img }) }, token);
//     setFaceLoading(false);
//     setFaceMsg(res.data.message || res.data.status || "Face verification complete.");
//     if (res.ok) onRefresh();
//   }

//   useEffect(() => () => stopCam(), []);

//   const eventTone = latestEvent?.event_type === "attendance.check_in" ? "success"
//     : latestEvent?.event_type === "attendance.check_out" ? "warning"
//     : latestEvent?.event_type === "attendance.already_closed" ? "danger" : "info";

//   return (
//     <div className="view">
//       <div className="view-header">
//         <div className="view-header-left">
//           <div className="eyebrow">Operator Console</div>
//           <h1 className="view-title">Attendance Station</h1>
//         </div>
//         <div className="view-header-actions">
//           <button className="btn btn-secondary" onClick={onRefreshStatus}><Icon.Refresh />Refresh Services</button>
//         </div>
//       </div>

//       {/* Service Status */}
//       <div className="service-pills">
//         <ServicePill
//           label="Biometric Agent"
//           status={agentOk ? "ok" : "warning"}
//           message={agentOk ? "Local agent ready" : "Start biometric agent"}
//         />
//         <ServicePill
//           label="Fingerprint"
//           status={fp.status || "loading"}
//           message={fp.message}
//         />
//         <ServicePill
//           label="Face Service"
//           status={face.status || "loading"}
//           message={face.message}
//         />
//       </div>

//       {conflictCount > 0 && (
//         <Banner type="danger">
//           <strong>{conflictCount} fingerprint conflict{conflictCount > 1 ? "s" : ""} active.</strong> Global verification is in guarded mode. Resolve duplicate ownership in the Employees view.
//         </Banner>
//       )}

//       {stationMsg && <Banner type="info">{stationMsg}</Banner>}

//       {/* Latest Event */}
//       {latestEvent && (
//         <div className={`event-card ${eventTone}`}>
//           <div className="event-icon">
//             {eventTone === "success" ? <Icon.CheckCircle /> : eventTone === "warning" ? <Icon.Clock /> : <Icon.AlertTriangle />}
//           </div>
//           <div>
//             <div className="event-label">
//               {latestEvent.event_type === "attendance.check_in" ? "Check-In Recorded"
//                 : latestEvent.event_type === "attendance.check_out" ? "Check-Out Recorded"
//                 : latestEvent.event_type === "attendance.already_closed" ? "Session Already Closed"
//                 : "Attendance Event"}
//             </div>
//             <div className="event-summary">{latestEvent.summary}</div>
//             <div className="event-time">{fmtDT(latestEvent.created_at)}</div>
//           </div>
//         </div>
//       )}

//       <div className="station-grid">
//         {/* Fingerprint Panel */}
//         <div className="panel">
//           <div className="panel-header">
//             <div>
//               <div className="panel-title">Fingerprint Workflow</div>
//               <div className="panel-desc">HID DigitalPersona 4500 via desktop agent</div>
//             </div>
//             <span className="badge badge-info"><Icon.Fingerprint style={{ width: 10, height: 10 }} />HID SDK</span>
//           </div>
//           <div className="panel-body">
//             <div className="steps-list" style={{ marginBottom: 20 }}>
//               <div className="step-item">Keep backend running on port <code style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--bg-overlay)", padding: "1px 5px", borderRadius: 4 }}>4000</code></div>
//               <div className="step-item">Start the local biometric agent (<code style={{ fontFamily: "var(--font-mono)", fontSize: 11, background: "var(--bg-overlay)", padding: "1px 5px", borderRadius: 4 }}>port 8091</code>)</div>
//               <div className="step-item">Launch fingerprint verification below and place your finger on the reader</div>
//               <div className="step-item">Attendance is automatically recorded and reflected on the dashboard</div>
//             </div>

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//               <button className="btn btn-primary" onClick={onLaunchVerify} disabled={conflictCount > 0}>
//                 <Icon.Fingerprint />Launch Verification
//               </button>
//               <button className="btn btn-secondary" onClick={onRefresh}><Icon.Refresh />Refresh Feed</button>
//             </div>
//           </div>
//         </div>

//         {/* Face Panel */}
//         <div className="panel">
//           <div className="panel-header">
//             <div>
//               <div className="panel-title">Face Recognition</div>
//               <div className="panel-desc">Webcam capture via browser API</div>
//             </div>
//             <span className="badge badge-warning"><Icon.Face style={{ width: 10, height: 10 }} />Beta</span>
//           </div>
//           <div className="panel-body">
//             <div className={`camera-wrap ${camActive ? "camera-active" : ""}`}>
//               <video ref={videoRef} autoPlay muted playsInline />
//               {!camActive && (
//                 <div className="camera-placeholder">
//                   <Icon.Camera />
//                   <p>Camera not active</p>
//                 </div>
//               )}
//               <div className="scan-line" />
//               <div className="scan-corner tl" />
//               <div className="scan-corner tr" />
//               <div className="scan-corner bl" />
//               <div className="scan-corner br" />
//             </div>

//             {camErr && <Banner type="danger">{camErr}</Banner>}
//             {faceMsg && <Banner type={faceMsg.includes("match") || faceMsg.includes("enrolled") ? "success" : "info"}>{faceMsg}</Banner>}

//             <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//               {!camActive
//                 ? <button className="btn btn-secondary" onClick={startCam}><Icon.Camera />Start Camera</button>
//                 : <button className="btn btn-ghost" onClick={stopCam}><Icon.CameraOff />Stop</button>}
//               <button className="btn btn-primary" onClick={verifyFace} disabled={faceLoading || !camActive}>
//                 <Icon.Face />{faceLoading ? "Verifying…" : "Verify Face"}
//               </button>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════════════════════════════
//    EMPLOYEES VIEW
// ═══════════════════════════════════════════════════════════════════════════ */
// function EmployeesView({ token, employees, onRefreshEmployees }) {
//   const [selected, setSelected] = useState(null);
//   const [history, setHistory] = useState([]);
//   const [fingerprints, setFingerprints] = useState([]);
//   const [fpPlan, setFpPlan] = useState(null);
//   const [conflicts, setConflicts] = useState({ exactDuplicates: [], recentConflicts: [] });
//   const [form, setForm] = useState({ id: null, employeeCode: "", name: "", cnic: "", department: "", designation: "", status: "active", profileImage: "" });
//   const [msg, setMsg] = useState("");
//   const [msgType, setMsgType] = useState("info");
//   const [saving, setSaving] = useState(false);
//   const [query, setQuery] = useState("");

//   const videoRef = useRef(null);
//   const streamRef = useRef(null);
//   const [camActive, setCamActive] = useState(false);
//   const [camErr, setCamErr] = useState("");
//   const [faceMsg, setFaceMsg] = useState("");

//   const filtered = useMemo(() => {
//     const q = query.toLowerCase();
//     return employees.filter(e =>
//       e.name?.toLowerCase().includes(q) ||
//       e.cnic?.includes(q) ||
//       e.employee_code?.toLowerCase().includes(q)
//     );
//   }, [employees, query]);

//   async function loadEmployee(emp) {
//     setSelected(emp);
//     setForm({
//       id: emp.id,
//       employeeCode: emp.employee_code || "",
//       name: emp.name || "",
//       cnic: emp.cnic || "",
//       department: emp.department || "",
//       designation: emp.designation || "",
//       status: emp.status || "active",
//       profileImage: emp.profile_image || "",
//     });
//     const [hist, fps, plan, conf] = await Promise.all([
//       api(`/api/employees/${emp.id}/attendance`, {}, token),
//       api(`/api/employees/${emp.id}/fingerprints`, {}, token),
//       api(`/api/employees/${emp.id}/fingerprint-plan`, {}, token),
//       api(`/api/biometrics/fingerprint/conflicts?employeeId=${emp.id}`, {}, token),
//     ]);
//     if (hist.ok) setHistory(hist.data);
//     if (fps.ok) setFingerprints(fps.data);
//     if (plan.ok) setFpPlan(plan.data);
//     if (conf.ok) setConflicts(conf.data);
//   }

//   function resetForm() {
//     setSelected(null);
//     setHistory([]); setFingerprints([]); setFpPlan(null);
//     setConflicts({ exactDuplicates: [], recentConflicts: [] });
//     setMsg(""); setCamErr(""); setFaceMsg("");
//     setForm({ id: null, employeeCode: "", name: "", cnic: "", department: "", designation: "", status: "active", profileImage: "" });
//   }

//   async function saveEmployee(e) {
//     e.preventDefault(); setSaving(true); setMsg("");
//     const path = form.id ? `/api/employees/${form.id}` : "/api/employees";
//     const method = form.id ? "PUT" : "POST";
//     const res = await api(path, { method, body: JSON.stringify({
//       employeeCode: form.employeeCode, name: form.name, cnic: form.cnic,
//       department: form.department, designation: form.designation,
//       status: form.status, profileImage: form.profileImage,
//     })}, token);
//     setSaving(false);
//     if (!res.ok) { setMsg(res.data.message || "Save failed"); setMsgType("danger"); return; }
//     setMsg(form.id ? "Employee updated." : "Employee created."); setMsgType("success");
//     onRefreshEmployees();
//     if (!form.id) resetForm();
//   }

//   async function launchEnroll(empId, fingerCode) {
//     const res = await api("/api/biometrics/fingerprint/launch-enroll", { method: "POST", body: JSON.stringify({ employeeId: empId, fingerCode }) }, token);
//     setMsg(res.data.message || "Enrollment launched."); setMsgType("info");
//   }

//   async function launchVerify(empId) {
//     const res = await api("/api/biometrics/fingerprint/launch-verify", { method: "POST", body: JSON.stringify({ employeeId: empId }) }, token);
//     setMsg(res.data.message || "Verification launched."); setMsgType("info");
//   }

//   async function markManual(empId) {
//     const res = await api("/api/attendance/manual-mark", { method: "POST", body: JSON.stringify({ employeeId: empId }) }, token);
//     if (!res.ok) { setMsg(res.data.message || "Error"); setMsgType("danger"); return; }
//     setMsg(`Manual ${res.data.attendance?.action} recorded.`); setMsgType("success");
//   }

//   async function setPreferred(empId, fpId) {
//     await api(`/api/employees/${empId}/fingerprints/${fpId}/prefer`, { method: "POST" }, token);
//     loadEmployee(selected);
//   }

//   async function deleteSlot(empId, fpId) {
//     if (!confirm("Delete this fingerprint slot? This cannot be undone.")) return;
//     await api(`/api/employees/${empId}/fingerprints/${fpId}`, { method: "DELETE" }, token);
//     loadEmployee(selected);
//   }

//   async function startCam() {
//     setCamErr("");
//     try {
//       const s = await navigator.mediaDevices.getUserMedia({ video: { width: { ideal: 1920 } }, audio: false });
//       streamRef.current = s;
//       if (videoRef.current) videoRef.current.srcObject = s;
//       setCamActive(true);
//     } catch (e) { setCamErr(e.message); }
//   }
//   function stopCam() {
//     streamRef.current?.getTracks().forEach(t => t.stop());
//     streamRef.current = null;
//     if (videoRef.current) videoRef.current.srcObject = null;
//     setCamActive(false);
//   }

//   async function enrollFace() {
//     if (!selected?.id) { setFaceMsg("Select an employee first."); return; }
//     if (!videoRef.current) { setFaceMsg("Start the camera first."); return; }
//     const v = videoRef.current;
//     const c = document.createElement("canvas");
//     c.width = v.videoWidth || 1280; c.height = v.videoHeight || 720;
//     c.getContext("2d").drawImage(v, 0, 0, c.width, c.height);
//     const img = c.toDataURL("image/jpeg", 0.92);
//     const res = await api("/api/biometrics/face/enroll", { method: "POST", body: JSON.stringify({ employeeId: selected.id, imageBase64: img, profileImage: img }) }, token);
//     setFaceMsg(res.data.message || res.data.status || "Done.");
//     if (res.ok) onRefreshEmployees();
//   }

//   useEffect(() => () => stopCam(), []);

//   const conflictCount = (conflicts.exactDuplicates?.length || 0) + (conflicts.recentConflicts?.length || 0);

//   return (
//     <div className="view">
//       <div className="view-header">
//         <div className="view-header-left">
//           <div className="eyebrow">Workforce Registry</div>
//           <h1 className="view-title">Employees</h1>
//         </div>
//         <div className="view-header-actions">
//           <button className="btn btn-secondary" onClick={resetForm}><Icon.Plus />New Employee</button>
//         </div>
//       </div>

//       <div className="employees-layout">
//         {/* Employee list */}
//         <div className="panel" style={{ position: "sticky", top: 70 }}>
//           <div className="panel-header">
//             <div>
//               <div className="panel-title">Employees</div>
//               <div className="panel-desc">{employees.length} total</div>
//             </div>
//           </div>
//           <div style={{ padding: "10px 12px", borderBottom: "1px solid var(--border)" }}>
//             <input
//               className="form-input" style={{ fontSize: 12, padding: "8px 12px" }}
//               placeholder="Search name, CNIC, code…"
//               value={query} onChange={e => setQuery(e.target.value)}
//             />
//           </div>
//           <div className="employee-list">
//             {filtered.length === 0 ? (
//               <div className="empty-state"><Icon.Users /><p>No employees found</p></div>
//             ) : filtered.map(emp => (
//               <button key={emp.id} className={`employee-card ${selected?.id === emp.id ? "active" : ""}`} onClick={() => loadEmployee(emp)}>
//                 <div className="emp-avatar">{initials(emp.name)}</div>
//                 <div className="emp-info">
//                   <div className="emp-name">{emp.name}</div>
//                   <div className="emp-meta">{emp.employee_code || "No code"} · {emp.cnic}</div>
//                   <div className="chip-row">
//                     <span className={`chip ${emp.has_fingerprint ? "chip-success" : "chip-muted"}`}>
//                       {emp.has_fingerprint ? `${emp.fingerprint_count || 1}× Finger` : "No FP"}
//                     </span>
//                     <span className={`chip ${emp.has_face ? "chip-warning" : "chip-muted"}`}>
//                       {emp.has_face ? "Face ✓" : "No Face"}
//                     </span>
//                     <span className={`chip ${emp.status === "active" ? "chip-success" : "chip-muted"}`}>
//                       {emp.status}
//                     </span>
//                   </div>
//                 </div>
//               </button>
//             ))}
//           </div>
//         </div>

//         {/* Detail / Form panel */}
//         <div>
//           <div className="panel">
//             <div className="panel-header">
//               <div>
//                 <div className="panel-title">{form.id ? `Edit — ${selected?.name}` : "New Employee"}</div>
//                 <div className="panel-desc">{form.id ? `ID: ${form.id}` : "Fill in details to register a new employee"}</div>
//               </div>
//               {form.id && (
//                 <button className="btn btn-ghost btn-sm" onClick={resetForm}>Clear</button>
//               )}
//             </div>
//             <div className="panel-body">
//               {msg && <Banner type={msgType} onClose={() => setMsg("")}>{msg}</Banner>}

//               <form onSubmit={saveEmployee}>
//                 <div className="form-grid">
//                   <div className="form-group">
//                     <label className="form-label">Employee Code</label>
//                     <input className="form-input" value={form.employeeCode} placeholder="EMP-001"
//                       onChange={e => setForm(f => ({ ...f, employeeCode: e.target.value }))} />
//                   </div>
//                   <div className="form-group">
//                     <label className="form-label">Status</label>
//                     <select className="form-select" value={form.status}
//                       onChange={e => setForm(f => ({ ...f, status: e.target.value }))}>
//                       <option value="active">Active</option>
//                       <option value="inactive">Inactive</option>
//                     </select>
//                   </div>
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">Full Name *</label>
//                   <input className="form-input" value={form.name} placeholder="Muhammad Ahmad"
//                     required onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
//                 </div>
//                 <div className="form-group">
//                   <label className="form-label">CNIC *</label>
//                   <input className="form-input" value={form.cnic} placeholder="42101-1234567-1"
//                     required onChange={e => setForm(f => ({ ...f, cnic: e.target.value }))} />
//                 </div>
//                 <div className="form-grid">
//                   <div className="form-group">
//                     <label className="form-label">Department</label>
//                     <input className="form-input" value={form.department} placeholder="Engineering"
//                       onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
//                   </div>
//                   <div className="form-group">
//                     <label className="form-label">Designation</label>
//                     <input className="form-input" value={form.designation} placeholder="Senior Engineer"
//                       onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
//                   </div>
//                 </div>
//                 <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
//                   <button className="btn btn-primary" type="submit" disabled={saving}>
//                     {saving ? "Saving…" : form.id ? "Save Changes" : "Create Employee"}
//                   </button>
//                   <button className="btn btn-ghost" type="button" onClick={resetForm}>Reset</button>
//                 </div>
//               </form>
//             </div>
//           </div>

//           {/* Biometric tools — only when employee selected */}
//           {selected && (
//             <>
//               {/* Fingerprint Slots */}
//               <div className="panel">
//                 <div className="panel-header">
//                   <div>
//                     <div className="panel-title">Fingerprint Slots</div>
//                     <div className="panel-desc">
//                       {fingerprints.length} enrolled · preferred: {fingerprints.find(f => f.is_preferred)?.finger_code ? fingerLabel(fingerprints.find(f => f.is_preferred).finger_code) : "none"}
//                     </div>
//                   </div>
//                   <div className="panel-actions">
//                     {fpPlan?.missingRecommended?.[0] && (
//                       <button className="btn btn-primary btn-sm" onClick={() => launchEnroll(selected.id, fpPlan.missingRecommended[0].fingerCode)}>
//                         <Icon.Plus />Enroll Next Finger
//                       </button>
//                     )}
//                   </div>
//                 </div>
//                 <div className="panel-body">
//                   {conflictCount > 0 && (
//                     <Banner type="danger">
//                       {conflictCount} conflict signal{conflictCount > 1 ? "s" : ""} detected for this employee. Remove duplicate fingerprint slots before using global verification.
//                     </Banner>
//                   )}

//                   {fpPlan && (
//                     <div className="finger-grid" style={{ marginBottom: 16 }}>
//                       {fpPlan.recommended.map(item => (
//                         <div
//                           key={item.fingerCode}
//                           className={`finger-slot ${item.enrolled ? "enrolled" : ""} ${item.isPreferred ? "preferred" : ""}`}
//                           onClick={() => !item.enrolled && launchEnroll(selected.id, item.fingerCode)}
//                           style={{ cursor: item.enrolled ? "default" : "pointer" }}
//                           title={item.enrolled ? fingerLabel(item.fingerCode) : `Enroll ${fingerLabel(item.fingerCode)}`}
//                         >
//                           {item.isPreferred && <div className="preferred-pip" />}
//                           <div className="finger-slot-icon">{item.enrolled ? "🖐" : "+"}</div>
//                           <div className="finger-slot-label">{fingerLabel(item.fingerCode)}</div>
//                         </div>
//                       ))}
//                     </div>
//                   )}

//                   {fingerprints.length > 0 && (
//                     <div className="table-wrap">
//                       <table>
//                         <thead><tr><th>Finger</th><th>Format</th><th>Source</th><th>Updated</th><th>Actions</th></tr></thead>
//                         <tbody>
//                           {fingerprints.map(fp => (
//                             <tr key={fp.id}>
//                               <td>
//                                 <strong style={{ display: "flex", alignItems: "center", gap: 6 }}>
//                                   {fingerLabel(fp.finger_code)}
//                                   {fp.is_preferred ? <span className="badge badge-success">Preferred</span> : null}
//                                 </strong>
//                               </td>
//                               <td><span>{fp.template_format}</span></td>
//                               <td><span>{fp.source || "—"}</span></td>
//                               <td><span>{fmtDate(fp.updated_at)}</span></td>
//                               <td>
//                                 <div style={{ display: "flex", gap: 5 }}>
//                                   {!fp.is_preferred && (
//                                     <button className="btn btn-ghost btn-sm" onClick={() => setPreferred(selected.id, fp.id)} title="Set as preferred">
//                                       <Icon.Star />
//                                     </button>
//                                   )}
//                                   <button className="btn btn-ghost btn-sm" onClick={() => launchEnroll(selected.id, fp.finger_code)} title="Re-enroll">
//                                     <Icon.Refresh />
//                                   </button>
//                                   <button className="btn btn-danger btn-sm" onClick={() => deleteSlot(selected.id, fp.id)} title="Delete slot">
//                                     <Icon.Trash />
//                                   </button>
//                                 </div>
//                               </td>
//                             </tr>
//                           ))}
//                         </tbody>
//                       </table>
//                     </div>
//                   )}

//                   <div style={{ display: "flex", gap: 8, marginTop: fingerprints.length > 0 ? 16 : 0, flexWrap: "wrap" }}>
//                     <button className="btn btn-secondary btn-sm" onClick={() => launchVerify(selected.id)}>
//                       <Icon.Fingerprint />Verify
//                     </button>
//                     <button className="btn btn-ghost btn-sm" onClick={() => markManual(selected.id)}>
//                       <Icon.CheckCircle />Manual Attendance
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* Face Enrollment */}
//               <div className="panel">
//                 <div className="panel-header">
//                   <div>
//                     <div className="panel-title">Face Enrollment</div>
//                     <div className="panel-desc">Enroll face encoding for {selected.name}</div>
//                   </div>
//                   <span className={`badge ${selected.has_face ? "badge-success" : "badge-muted"}`}>
//                     {selected.has_face ? "Face enrolled" : "Not enrolled"}
//                   </span>
//                 </div>
//                 <div className="panel-body">
//                   <div className={`camera-wrap ${camActive ? "camera-active" : ""}`}>
//                     <video ref={videoRef} autoPlay muted playsInline />
//                     {!camActive && (
//                       <div className="camera-placeholder">
//                         <Icon.Camera />
//                         <p>Start camera to enroll face</p>
//                       </div>
//                     )}
//                     <div className="scan-line" />
//                     <div className="scan-corner tl" /><div className="scan-corner tr" />
//                     <div className="scan-corner bl" /><div className="scan-corner br" />
//                   </div>
//                   {camErr && <Banner type="danger">{camErr}</Banner>}
//                   {faceMsg && <Banner type="info">{faceMsg}</Banner>}
//                   <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
//                     {!camActive
//                       ? <button className="btn btn-secondary btn-sm" onClick={startCam}><Icon.Camera />Start Camera</button>
//                       : <button className="btn btn-ghost btn-sm" onClick={stopCam}><Icon.CameraOff />Stop</button>}
//                     <button className="btn btn-primary btn-sm" onClick={enrollFace} disabled={!camActive}>
//                       <Icon.Face />Enroll Face
//                     </button>
//                   </div>
//                 </div>
//               </div>

//               {/* Attendance History */}
//               <div className="panel">
//                 <div className="panel-header">
//                   <div>
//                     <div className="panel-title">Attendance History</div>
//                     <div className="panel-desc">Last 60 records for {selected.name}</div>
//                   </div>
//                 </div>
//                 <div className="panel-body">
//                   {history.length === 0
//                     ? <div className="empty-state"><Icon.Clock /><p>No attendance records yet</p></div>
//                     : (
//                       <div className="timeline">
//                         {history.map(row => (
//                           <div key={row.id} className="tl-item">
//                             <div className={`tl-dot ${row.check_out ? "out" : "in"}`} />
//                             <div>
//                               <div className="tl-date">{row.date}</div>
//                               <div className="tl-times">
//                                 In: {fmtTime(row.check_in)} · Out: {fmtTime(row.check_out)}
//                                 {row.check_in_method && ` · ${row.check_in_method}`}
//                               </div>
//                             </div>
//                           </div>
//                         ))}
//                       </div>
//                     )}
//                 </div>
//               </div>
//             </>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════════════════════════════
//    REPORTS VIEW
// ═══════════════════════════════════════════════════════════════════════════ */
// function ReportsView({ token }) {
//   const [rows, setRows] = useState([]);
//   const [filter, setFilter] = useState({ dateFrom: "", dateTo: "", method: "", status: "" });
//   const [loading, setLoading] = useState(false);

//   async function load() {
//     setLoading(true);
//     const q = new URLSearchParams();
//     Object.entries(filter).forEach(([k, v]) => { if (v) q.set(k, v); });
//     const res = await api(`/api/attendance${q.toString() ? `?${q}` : ""}`, {}, token);
//     setLoading(false);
//     if (res.ok) setRows(res.data);
//   }

//   async function exportCsv() {
//     const q = new URLSearchParams();
//     Object.entries(filter).forEach(([k, v]) => { if (v) q.set(k, v); });
//     const res = await fetch(`${API}/api/attendance/export.csv${q.toString() ? `?${q}` : ""}`, {
//       headers: token ? { Authorization: `Bearer ${token}` } : {}
//     });
//     if (!res.ok) { alert("Export failed."); return; }
//     const blob = await res.blob();
//     const url = URL.createObjectURL(blob);
//     const a = document.createElement("a");
//     a.href = url; a.download = `attendance-${new Date().toISOString().slice(0,10)}.csv`;
//     document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
//   }

//   useEffect(() => { load(); }, []);

//   return (
//     <div className="view">
//       <div className="view-header">
//         <div className="view-header-left">
//           <div className="eyebrow">Insights</div>
//           <h1 className="view-title">Attendance Reports</h1>
//         </div>
//         <div className="view-header-actions">
//           <button className="btn btn-secondary" onClick={exportCsv}><Icon.Download />Export CSV</button>
//           <button className="btn btn-primary" onClick={load}><Icon.Refresh />Refresh</button>
//         </div>
//       </div>

//       <div className="panel">
//         <div className="filter-bar">
//           <div className="filter-group">
//             <span className="filter-label">Date From</span>
//             <input className="form-input" type="date" style={{ fontSize: 12 }}
//               value={filter.dateFrom} onChange={e => setFilter(f => ({ ...f, dateFrom: e.target.value }))} />
//           </div>
//           <div className="filter-group">
//             <span className="filter-label">Date To</span>
//             <input className="form-input" type="date" style={{ fontSize: 12 }}
//               value={filter.dateTo} onChange={e => setFilter(f => ({ ...f, dateTo: e.target.value }))} />
//           </div>
//           <div className="filter-group">
//             <span className="filter-label">Method</span>
//             <select className="form-select" style={{ fontSize: 12 }}
//               value={filter.method} onChange={e => setFilter(f => ({ ...f, method: e.target.value }))}>
//               <option value="">All methods</option>
//               <option value="fingerprint">Fingerprint</option>
//               <option value="face">Face</option>
//               <option value="manual">Manual</option>
//             </select>
//           </div>
//           <div className="filter-group">
//             <span className="filter-label">Status</span>
//             <select className="form-select" style={{ fontSize: 12 }}
//               value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}>
//               <option value="">All sessions</option>
//               <option value="open">Open</option>
//               <option value="closed">Closed</option>
//             </select>
//           </div>
//           <button className="btn btn-primary btn-sm" onClick={load} style={{ alignSelf: "flex-end" }}>Apply</button>
//         </div>

//         <div className="table-wrap">
//           {loading ? (
//             <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>Loading…</div>
//           ) : (
//             <table>
//               <thead>
//                 <tr>
//                   <th>Employee</th>
//                   <th>Department</th>
//                   <th>Date</th>
//                   <th>Check In</th>
//                   <th>Check Out</th>
//                   <th>Devices</th>
//                   <th>Methods</th>
//                   <th>Status</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.length === 0 ? (
//                   <tr><td colSpan={8}><div className="empty-state"><Icon.Reports /><p>No attendance records match your filters</p></div></td></tr>
//                 ) : rows.map(row => (
//                   <tr key={row.id}>
//                     <td><strong>{row.name}</strong><span>{row.employee_code}</span></td>
//                     <td>{row.department || "—"}</td>
//                     <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{row.date}</td>
//                     <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtTime(row.check_in)}</td>
//                     <td style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{fmtTime(row.check_out)}</td>
//                     <td><span>{row.check_in_device || "—"}</span></td>
//                     <td>
//                       {row.check_in_method && <span className="badge badge-info" style={{ marginRight: 4 }}>{row.check_in_method}</span>}
//                       {row.check_out_method && <span className="badge badge-muted">{row.check_out_method}</span>}
//                     </td>
//                     <td>
//                       {row.check_out
//                         ? <span className="badge badge-success">Closed</span>
//                         : <span className="badge badge-warning">Open</span>}
//                     </td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════════════════════════════
//    AUDIT VIEW
// ═══════════════════════════════════════════════════════════════════════════ */
// function AuditView({ token }) {
//   const [rows, setRows] = useState([]);
//   const [loading, setLoading] = useState(true);

//   async function load() {
//     setLoading(true);
//     const res = await api("/api/audit-logs", {}, token);
//     setLoading(false);
//     if (res.ok) setRows(res.data);
//   }

//   useEffect(() => { load(); }, []);

//   const eventColor = (type) => {
//     if (type?.startsWith("attendance.check_in")) return "badge-success";
//     if (type?.startsWith("attendance.check_out")) return "badge-warning";
//     if (type?.includes("conflict")) return "badge-danger";
//     if (type?.includes("delete")) return "badge-danger";
//     if (type?.includes("create") || type?.includes("enroll")) return "badge-info";
//     return "badge-muted";
//   };

//   return (
//     <div className="view">
//       <div className="view-header">
//         <div className="view-header-left">
//           <div className="eyebrow">Security</div>
//           <h1 className="view-title">Audit Trail</h1>
//         </div>
//         <div className="view-header-actions">
//           <button className="btn btn-secondary" onClick={load}><Icon.Refresh />Refresh</button>
//         </div>
//       </div>

//       <div className="panel">
//         <div className="panel-header">
//           <div>
//             <div className="panel-title">All Events</div>
//             <div className="panel-desc">Complete tamper-evident log of all system actions</div>
//           </div>
//           <span className="badge badge-muted">{rows.length} events</span>
//         </div>
//         <div className="table-wrap">
//           {loading
//             ? <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)", fontFamily: "var(--font-mono)", fontSize: 12 }}>Loading…</div>
//             : (
//               <table>
//                 <thead>
//                   <tr><th>#</th><th>Event</th><th>Summary</th><th>Target</th><th>Actor</th><th>When</th></tr>
//                 </thead>
//                 <tbody>
//                   {rows.length === 0
//                     ? <tr><td colSpan={6}><div className="empty-state"><Icon.Shield /><p>No audit events</p></div></td></tr>
//                     : rows.map(row => (
//                       <tr key={row.id}>
//                         <td><span>{row.id}</span></td>
//                         <td><span className={`badge ${eventColor(row.event_type)}`}>{row.event_type}</span></td>
//                         <td><strong>{row.summary}</strong></td>
//                         <td><span>{row.target_type} #{row.target_id || "—"}</span></td>
//                         <td>{row.actor_name || "System / Device"}</td>
//                         <td style={{ fontFamily: "var(--font-mono)", fontSize: 11, whiteSpace: "nowrap" }}>{fmtDT(row.created_at)}</td>
//                       </tr>
//                     ))
//                   }
//                 </tbody>
//               </table>
//             )}
//         </div>
//       </div>
//     </div>
//   );
// }

// /* ════════════════════════════════════════════════════════════════════════════
//    ROOT APP
// ═══════════════════════════════════════════════════════════════════════════ */
// export default function App() {
//   const [token, setToken] = useState(() => localStorage.getItem("ams_token") || "");
//   const [user, setUser] = useState(null);
//   const [activeView, setActiveView] = useState("dashboard");
//   const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
//   const [mobileOpen, setMobileOpen] = useState(false);

//   const [overview, setOverview] = useState(null);
//   const [auditRows, setAuditRows] = useState([]);
//   const [employees, setEmployees] = useState([]);
//   const [stationStatus, setStationStatus] = useState({
//     fingerprint: { status: "loading", message: "Checking…" },
//     face: { status: "loading", message: "Checking…" },
//   });
//   const [latestEvent, setLatestEvent] = useState(null);
//   const [stationMsg, setStationMsg] = useState("");
//   const [conflicts, setConflicts] = useState({ exactDuplicates: [], recentConflicts: [] });

//   const conflictCount = (conflicts.exactDuplicates?.length || 0) + (conflicts.recentConflicts?.length || 0);

//   /* ── Auth ── */
//   useEffect(() => {
//     if (!token) { setUser(null); return; }
//     let cancel = false;
//     api("/api/auth/me", {}, token).then(res => {
//       if (cancel) return;
//       if (!res.ok) { localStorage.removeItem("ams_token"); setToken(""); setUser(null); return; }
//       setUser(res.data);
//     });
//     return () => { cancel = true; };
//   }, [token]);

//   /* ── Initial data load ── */
//   useEffect(() => {
//     if (!user) return;
//     refreshAll();
//   }, [user]);

//   /* ── Station polling ── */
//   useEffect(() => {
//     if (!user || activeView !== "station") return;
//     const id = setInterval(() => { refreshOverview(); refreshStation(); }, 5000);
//     return () => clearInterval(id);
//   }, [user, activeView]);

//   async function refreshOverview() {
//     const res = await api("/api/dashboard/overview", {}, token);
//     if (res.ok) {
//       setOverview(res.data);
//       setAuditRows(res.data.recentAuditLogs || []);
//       const evt = (res.data.recentAuditLogs || []).find(r => r.event_type?.startsWith("attendance."));
//       setLatestEvent(evt || null);
//     }
//   }

//   async function refreshEmployees() {
//     const res = await api("/api/employees", {}, token);
//     if (res.ok) setEmployees(res.data);
//   }

//   async function refreshStation() {
//     const [fp, face] = await Promise.all([
//       api("/api/biometrics/fingerprint/status", {}, token),
//       api("/api/biometrics/face/status", {}, token),
//     ]);
//     setStationStatus({ fingerprint: fp.data, face: face.data });
//   }

//   async function refreshConflicts() {
//     const res = await api("/api/biometrics/fingerprint/conflicts", {}, token);
//     if (res.ok) setConflicts(res.data);
//   }

//   function refreshAll() {
//     refreshOverview();
//     refreshEmployees();
//     refreshStation();
//     refreshConflicts();
//   }

//   async function launchVerify() {
//     const res = await api("/api/biometrics/fingerprint/launch-verify", { method: "POST", body: JSON.stringify({}) }, token);
//     setStationMsg(res.data.message || "Fingerprint verification launched.");
//     refreshStation(); refreshOverview();
//   }

//   function handleLogin(tok, usr) {
//     setToken(tok); setUser(usr); setActiveView("dashboard");
//   }

//   function handleLogout() {
//     localStorage.removeItem("ams_token");
//     setToken(""); setUser(null);
//   }

//   function handleNav(view) {
//     setActiveView(view);
//     setMobileOpen(false);
//   }

//   if (!user) return <AuthPage onLogin={handleLogin} />;

//   return (
//     <div className="app-shell">
//       <Sidebar
//         user={user}
//         activeView={activeView}
//         onNav={handleNav}
//         onLogout={handleLogout}
//         collapsed={sidebarCollapsed}
//         onToggleCollapse={() => setSidebarCollapsed(c => !c)}
//         conflictCount={conflictCount}
//         mobileOpen={mobileOpen}
//         onOverlayClick={() => setMobileOpen(false)}
//       />

//       <div className="workspace">
//         <Topbar
//           view={activeView}
//           fpStatus={stationStatus.fingerprint}
//           onMobileMenu={() => setMobileOpen(o => !o)}
//           onRefresh={refreshAll}
//         />

//         {activeView === "dashboard" && (
//           <DashboardView
//             overview={overview}
//             auditRows={auditRows}
//             conflictCount={conflictCount}
//             onRefresh={refreshOverview}
//           />
//         )}

//         {activeView === "station" && (
//           <StationView
//             token={token}
//             stationStatus={stationStatus}
//             latestEvent={latestEvent}
//             conflictCount={conflictCount}
//             stationMsg={stationMsg}
//             onRefresh={refreshOverview}
//             onLaunchVerify={launchVerify}
//             onRefreshStatus={refreshStation}
//           />
//         )}

//         {activeView === "employees" && (
//           <EmployeesView
//             token={token}
//             employees={employees}
//             onRefreshEmployees={refreshEmployees}
//           />
//         )}

//         {activeView === "reports" && <ReportsView token={token} />}
//         {activeView === "audit"   && <AuditView   token={token} />}
//       </div>
//     </div>
//   );
// }
/* ═══════════════════════════════════════════════════════════════════════════
   AMS Enterprise UI v5
   Fixes: text visibility · floating expand FAB · reports overflow
   New: real-time counters · skeleton loading · stagger animations · toasts
═══════════════════════════════════════════════════════════════════════════ */
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

const API = "http://127.0.0.1:4000";
const BOOT = { email: "admin@attendance.local", password: "Admin@12345" };

/* ════════ ICONS ════════════════════════════════════════════════════════════ */
const Svg = (d,vb="0 0 24 24") => (
  <svg viewBox={vb} fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">{d}</svg>
);
const I = {
  Mark:    Svg(<><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></>),
  Grid:    Svg(<><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></>),
  Radio:   Svg(<><circle cx="12" cy="12" r="3"/><path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/></>),
  Users:   Svg(<><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>),
  Chart:   Svg(<><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/></>),
  Shield:  Svg(<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>),
  ChevL:   Svg(<polyline points="15 18 9 12 15 6"/>),
  ChevR:   Svg(<polyline points="9 18 15 12 9 6"/>),
  Out:     Svg(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),
  Menu:    Svg(<><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></>),
  Spin:    Svg(<><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></>),
  DL:      Svg(<><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></>),
  Plus:    Svg(<><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></>),
  FP:      Svg(<><path d="M12 10a2 2 0 0 0-2 2c0 1.02.15 2.12.4 3.14"/><path d="M12 6a6 6 0 0 1 6 6c0 1.25-.2 2.45-.57 3.57"/><path d="M12 2a10 10 0 0 1 10 10c0 1.64-.31 3.21-.87 4.65"/><path d="M12 14c0 2 .51 4 1.33 5.5"/><path d="M9.56 17.56C9.22 16.43 9 15.22 9 14c0-1.66 1.34-3 3-3"/><path d="M6.14 15.1C6.05 14.74 6 14.38 6 14a6 6 0 0 1 6-6"/><path d="M3.08 12.93A10 10 0 0 0 3 14c0 1.05.11 2.08.31 3.07"/></>),
  Face:    Svg(<><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/></>),
  Cam:     Svg(<><path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/></>),
  CamOff:  Svg(<><line x1="1" y1="1" x2="23" y2="23"/><path d="M21 21H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h3m3-3h6l2 3h4a2 2 0 0 1 2 2v9.34m-7.72-2.06a4 4 0 1 1-5.56-5.56"/></>),
  Check:   Svg(<><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></>),
  Warn:    Svg(<><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></>),
  Info:    Svg(<><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></>),
  Clock:   Svg(<><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>),
  Trash:   Svg(<><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>),
  Star:    Svg(<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>),
  Trend:   Svg(<><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></>),
  Act:     Svg(<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>),
  Cal:     Svg(<><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></>),
  Cpu:     Svg(<><rect x="4" y="4" width="16" height="16" rx="2"/><rect x="9" y="9" width="6" height="6"/><line x1="9" y1="1" x2="9" y2="4"/><line x1="15" y1="1" x2="15" y2="4"/><line x1="9" y1="20" x2="9" y2="23"/><line x1="15" y1="20" x2="15" y2="23"/><line x1="20" y1="9" x2="23" y2="9"/><line x1="20" y1="14" x2="23" y2="14"/><line x1="1" y1="9" x2="4" y2="9"/><line x1="1" y1="14" x2="4" y2="14"/></>),
  File:    Svg(<><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></>),
  Arrow:   Svg(<><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></>),
  Bell:    Svg(<><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></>),
  User:    Svg(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  Loader:  Svg(<path d="M21 12a9 9 0 1 1-6.219-8.56" strokeWidth="2"/>),
};

/* ════════ API ══════════════════════════════════════════════════════════════ */
async function req(path, opts = {}, token = "") {
  const r = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}), ...(opts.headers || {}) },
    ...opts,
  });
  const ct = r.headers.get("content-type") || "";
  const data = ct.includes("application/json") ? await r.json() : { message: await r.text() };
  return { ok: r.ok, status: r.status, data };
}

/* ════════ FORMATTERS ═══════════════════════════════════════════════════════ */
const ini  = n => n.trim().split(/\s+/).slice(0,2).map(w=>w?.[0]?.toUpperCase()??"").join("");
const fT   = d => d ? new Date(d).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}) : "—";
const fD   = d => d ? new Date(d).toLocaleDateString([],{month:"short",day:"numeric",year:"numeric"}) : "—";
const fDT  = d => d ? new Date(d).toLocaleString([],{month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"}) : "—";
const fD0  = d => d ? String(d).slice(0,10) : "—";
const fMin = m => m>0 ? `${Math.floor(m/60)}h ${m%60}m` : "—";
const fpN  = c => (c||"").split("_").filter(Boolean).map(p=>p[0].toUpperCase()+p.slice(1)).join(" ");
const fNow = () => new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit",second:"2-digit"});

const attBadge = s => ({
  present:"badge-green", late:"badge-amber", half_day:"badge-orange", absent:"badge-rose",
  on_leave:"badge-sky", holiday:"badge-violet", holiday_present:"badge-violet",
  pending_review:"badge-amber", missed_punch:"badge-rose", leave_override:"badge-sky"
})[s] || "badge-neutral";

/* ════════ TOAST SYSTEM ═════════════════════════════════════════════════════ */
let _toastSetter = null;
function Toast({ toasts }) {
  return (
    <div style={{ position:"fixed", bottom:24, right:24, zIndex:999, display:"flex", flexDirection:"column", gap:8, maxWidth:360, pointerEvents:"none" }}>
      {toasts.map(t => (
        <div key={t.id} style={{
          background: t.type==="success" ? "var(--em-d)" : t.type==="danger" ? "var(--rs-d)" : t.type==="warn" ? "var(--ab-d)" : "var(--s3)",
          border: `1px solid ${t.type==="success" ? "var(--em-b)" : t.type==="danger" ? "var(--rs-b)" : t.type==="warn" ? "var(--ab-b)" : "var(--b2)"}`,
          color: t.type==="success" ? "var(--em)" : t.type==="danger" ? "var(--rs)" : t.type==="warn" ? "var(--ab)" : "var(--t1)",
          borderRadius:"var(--r2)", padding:"12px 16px", fontSize:13, fontWeight:500, lineHeight:1.5,
          backdropFilter:"blur(12px)", pointerEvents:"auto",
          animation:"slide-up 0.3s var(--spring)",
          display:"flex", alignItems:"flex-start", gap:10, boxShadow:"0 8px 32px rgba(0,0,0,0.4)"
        }}>
          {t.type==="success" ? I.Check : t.type==="danger" ? I.Warn : I.Info}
          <span style={{flex:1}}>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}
function useToast() {
  const [toasts, setToasts] = useState([]);
  _toastSetter = setToasts;
  return toasts;
}
function toast(msg, type="info", dur=3200) {
  if (!_toastSetter) return;
  const id = Date.now();
  _toastSetter(t => [...t, {id, msg, type}]);
  setTimeout(() => _toastSetter(t => t.filter(x=>x.id!==id)), dur);
}

/* ════════ SHARED ATOMS ═════════════════════════════════════════════════════ */
function LiveClock() {
  const [t, setT] = useState(fNow);
  useEffect(() => { const id = setInterval(()=>setT(fNow()),1000); return ()=>clearInterval(id); }, []);
  return <span className="hdr-clock">{t}</span>;
}

function Banner({type="info",children,dismiss}) {
  const ico = {info:I.Info,success:I.Check,warn:I.Warn,danger:I.Warn};
  return (
    <div className={`banner banner-${type}`}>
      {ico[type]||I.Info}
      <span style={{flex:1}}>{children}</span>
      {dismiss && <button className="btn btn-ghost btn-xs" onClick={dismiss} style={{padding:"2px 6px",opacity:.6}}>✕</button>}
    </div>
  );
}

function Skeleton({h=20,w="100%",r="var(--r2)",mb=8}) {
  return <div className="skeleton" style={{height:h,width:w,borderRadius:r,marginBottom:mb}} />;
}

function MetricSkeleton() {
  return (
    <div className="metric">
      <Skeleton h={34} w={34} r="var(--r2)" mb={13} />
      <Skeleton h={30} w="55%" mb={5} />
      <Skeleton h={14} w="75%" mb={0} />
    </div>
  );
}

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const target = Number(value) || 0;
    const start = prev.current;
    prev.current = target;
    if (start === target) return;
    const dur = 600;
    const begin = performance.now();
    const step = ts => {
      const p = Math.min((ts - begin) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setDisplay(Math.round(start + (target - start) * eased));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [value]);
  return <>{display}</>;
}

function Metric({ label, val, tone="", sub, icon, delay=0 }) {
  return (
    <div className={`metric ${tone}`} style={{animationDelay:`${delay}ms`}}>
      <div className="metric-ico">{icon}</div>
      <div className="metric-val"><AnimatedNumber value={val ?? 0} /></div>
      <div className="metric-lbl">{label}</div>
      {sub && <div className="metric-sub">{sub}</div>}
    </div>
  );
}

function SvcPill({label,status,msg}) {
  const t = status==="ok"?"ok":status==="warning"||status==="loading"?"warn":"err";
  return (
    <div className={`svc-pill ${t}`}>
      <span className="spip" />
      <span className="svc-name">{label}</span>
      <span className="svc-stat">{status}</span>
      {msg && <span className="svc-msg">· {msg.slice(0,50)}</span>}
    </div>
  );
}

/* ════════ CAMERA HOOK ═══════════════════════════════════════════════════════ */
function useCam(videoRef) {
  const sr = useRef(null);
  const [on,setOn]=useState(false); const [err,setErr]=useState("");
  const start = useCallback(async()=>{
    setErr("");
    try {
      sr.current?.getTracks().forEach(t=>t.stop());
      sr.current = null;
      if(!navigator.mediaDevices?.getUserMedia){
        throw new Error("Camera access is not available in this browser.");
      }
      const devs = await navigator.mediaDevices.enumerateDevices();
      const cams = devs.filter(d=>d.kind==="videoinput");
      if(cams.length===0){
        throw new Error("No camera device was detected.");
      }
      const pref = cams.find(d=>/logitech|logi|hd 1080|c920|c922/i.test(d.label||""));
      const s = await navigator.mediaDevices.getUserMedia({
        video:{deviceId:pref?.deviceId?{exact:pref.deviceId}:undefined,width:{ideal:1920},facingMode:"user"},audio:false
      });
      sr.current=s; if(videoRef.current) videoRef.current.srcObject=s; setOn(true);
    } catch(e){setErr(e.message);}
  },[videoRef]);
  const stop = useCallback(()=>{
    sr.current?.getTracks().forEach(t=>t.stop()); sr.current=null;
    if(videoRef.current) videoRef.current.srcObject=null; setOn(false);
  },[videoRef]);
  const snap = useCallback((mw=960,q=0.88)=>{
    const v=videoRef.current; if(!v) return null;
    const sw=v.videoWidth||1280,sh=v.videoHeight||720;
    const sc=sw>mw?mw/sw:1;
    const c=document.createElement("canvas");
    c.width=Math.max(640,Math.round(sw*sc)); c.height=Math.max(480,Math.round(sh*sc));
    c.getContext("2d").drawImage(v,0,0,c.width,c.height);
    return c.toDataURL("image/jpeg",q);
  },[videoRef]);
  useEffect(()=>stop,[stop]);
  return {on,err,setErr,start,stop,snap};
}

/* ════════ CAMERA PANEL ══════════════════════════════════════════════════════ */
function CamPanel({token,empId=null,mode="verify",onDone}) {
  const vRef=useRef(null);
  const {on,err,setErr,start,stop,snap}=useCam(vRef);
  const [msg,setMsg]=useState(""); const [mt,setMt]=useState("info");
  const [busy,setBusy]=useState(false); const [live,setLive]=useState(null);
  const timer=useRef(null); const smpRef=useRef([]);

  useEffect(()=>{
    if(!on){setLive(null);return;}
    timer.current=setInterval(async()=>{
      if(busy) return;
      const f=snap(480,0.72); if(!f) return;
      try{const r=await req("/api/biometrics/face/analyze",{method:"POST",body:JSON.stringify({imageBase64:f})},token); if(r.ok)setLive(r.data);}catch{}
    },1800);
    return()=>clearInterval(timer.current);
  },[busy,on,snap,token]);

  async function run(){
    if(!on){setMsg("Start the camera before capturing face samples."); setMt("warn"); return;}
    if(mode==="verify" && !live){setMsg("Wait for the live face preview before verifying."); setMt("warn"); return;}
    if(mode==="verify" && !isGood){setMsg("Improve face lighting and alignment before verifying."); setMt("warn"); return;}
    setBusy(true); setMsg(""); smpRef.current=[];
    for(let i=0;i<3;i++){await new Promise(r=>setTimeout(r,350)); const f=snap(960,0.88); if(f)smpRef.current.push(f);}
    if(smpRef.current.length<3){
      setBusy(false);
      setMsg("Face capture did not collect enough clear samples. Keep the face centered and try again.");
      setMt("warn");
      return;
    }
    const endpoint = mode==="enroll"?"/api/biometrics/face/enroll":"/api/biometrics/face/verify";
    const body = mode==="enroll"
      ? {employeeId:empId,samples:smpRef.current,imageBase64:smpRef.current[0],profileImage:smpRef.current[0]}
      : {samples:smpRef.current,imageBase64:smpRef.current[0]};
    const r=await req(endpoint,{method:"POST",body:JSON.stringify(body)},token);
    setBusy(false);
    if(r.ok){
      const msg2=mode==="verify"
        ? `✓ Matched: ${r.data.employee?.name||r.data.name||"Unknown"} · Score: ${r.data.score?.toFixed(3)??"—"}`
        : "Face enrolled successfully (3 samples)";
      setMsg(msg2); setMt("success"); toast(msg2,"success"); if(onDone)onDone();
    } else {
      const msg2=r.data.message||"No match found."; setMsg(msg2); setMt(r.status===404?"warn":"danger"); toast(msg2,r.status===404?"warn":"danger");
    }
  }

  const q=live?.quality||live?.qualitySummary||null;
  const blur=q?.blurVariance??q?.averageBlurVariance??null;
  const bright=q?.brightness??q?.averageBrightness??null;
  const isGood=blur!==null&&blur>=20&&bright>=55&&bright<=200;
  const face=live?.faceCoverage??null;
  const sampleCount=smpRef.current.length;

  return (
    <>
      <div className={`cam ${on?"cam-on":""}`}>
        <video ref={vRef} autoPlay muted playsInline />
        {!on && <div className="cam-idle">{I.Cam}<p>Camera inactive · click Start to begin</p></div>}
        <div className="cam-scanline" />
        <div className="cam-c tl"/><div className="cam-c tr"/>
        <div className="cam-c bl"/><div className="cam-c br"/>
        {on && <div className="cam-badge">LIVE · {mode==="enroll"?"ENROLL":"VERIFY"}</div>}
        {busy && <div style={{position:"absolute",inset:0,background:"rgba(0,0,0,0.6)",display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column",gap:10,color:"var(--ac-hi)",fontFamily:"var(--mono)",fontSize:13}}>
          <div style={{animation:"spin 1s linear infinite",width:26,height:26,color:"var(--ac)"}}>{I.Loader}</div>
          Capturing {sampleCount}/3 samples…
        </div>}
      </div>

      {on&&live&&(
        <div className={`quality-bar ${isGood?"good":"bad"}`}>
          <span>Sharpness</span><strong>{typeof blur==="number"?blur.toFixed(1):"—"}</strong>
          <span style={{marginLeft:10}}>Brightness</span><strong>{typeof bright==="number"?bright.toFixed(1):"—"}</strong>
          {face!=null&&<><span style={{marginLeft:10}}>Coverage</span><strong>{Math.round(face*100)}%</strong></>}
          <span style={{marginLeft:"auto",fontWeight:700}}>{isGood?"✓ Ready":"⚠ Adjust lighting"}</span>
        </div>
      )}

      {err  && <Banner type="danger" dismiss={()=>setErr("")}>{err}</Banner>}
      {msg  && <Banner type={mt} dismiss={()=>setMsg("")}>{msg}</Banner>}

      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        {!on
          ? <button className="btn btn-secondary btn-sm" onClick={start}>{I.Cam} Start Camera</button>
          : <button className="btn btn-ghost btn-sm" onClick={stop}>{I.CamOff} Stop</button>}
        <button className="btn btn-primary btn-sm" onClick={run} disabled={!on||busy}>
          {I.Face} {busy?"Processing…":mode==="enroll"?"Enroll Face":"Verify Face"}
        </button>
      </div>
    </>
  );
}

/* ════════ AUTH PAGE ═════════════════════════════════════════════════════════ */
function AuthPage({onLogin}) {
  const [form,setForm]=useState(BOOT); const [err,setErr]=useState(""); const [busy,setBusy]=useState(false);
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}));
  async function submit(e){
    e.preventDefault(); setBusy(true); setErr("");
    const r=await req("/api/auth/login",{method:"POST",body:JSON.stringify(form)});
    setBusy(false);
    if(!r.ok){setErr(r.data.message||"Authentication failed.");return;}
    localStorage.setItem("ams_tok",r.data.token); onLogin(r.data.token,r.data.user);
  }
  return (
    <div className="auth-shell">
      <div className="auth-vis">
        <div className="auth-grid"/>
        <div className="auth-orb"/>
        <div className="auth-vc">
          <div className="veyebrow" style={{marginBottom:14}}>Biometric Attendance Platform</div>
          <h1 className="auth-h1">Enterprise<br/>workforce <em>identity</em><br/>intelligence</h1>
          <p className="auth-p">Multi-modal biometric verification with real-time dashboards, shift management, leave workflows, and tamper-evident audit trails.</p>
          <div className="auth-stats">
            <div><div className="auth-sv">99.9%</div><div className="auth-sk">Uptime SLA</div></div>
            <div><div className="auth-sv">&lt;800ms</div><div className="auth-sk">Verify speed</div></div>
            <div><div className="auth-sv">3-layer</div><div className="auth-sk">Auth security</div></div>
          </div>
        </div>
      </div>
      <div className="auth-fs">
        <div className="auth-fc" style={{animation:"view-in 0.5s var(--spring)"}}>
          <div className="auth-logo">
            <div className="auth-logo-ic">{I.Mark}</div>
            <div><div className="auth-logo-name">BioTime AMS</div><div className="auth-logo-sub">v5 · Enterprise</div></div>
          </div>
          <div className="auth-h2">Welcome back</div>
          <div className="auth-sub">Sign in to access your attendance management console.</div>
          <form onSubmit={submit}>
            <div className="field"><label className="flabel">Email address</label><input className="finput" type="email" placeholder="admin@company.local" value={form.email} onChange={sf("email")} autoFocus required/></div>
            <div className="field"><label className="flabel">Password</label><input className="finput" type="password" placeholder="••••••••••" value={form.password} onChange={sf("password")} required/></div>
            {err&&<Banner type="danger">{err}</Banner>}
            <button className="btn btn-primary" type="submit" disabled={busy} style={{width:"100%",justifyContent:"center",marginTop:6,padding:"11px 17px"}}>
              {busy?<><span style={{animation:"spin 0.8s linear infinite",display:"flex"}}>{I.Loader}</span> Authenticating…</>:"Sign In →"}
            </button>
          </form>
          <div className="auth-cred">
            <div className="auth-cred-title">Bootstrap credentials</div>
            <div className="auth-cred-row"><span>Email</span><code>{BOOT.email}</code></div>
            <div className="auth-cred-row"><span>Password</span><code>{BOOT.password}</code></div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════ SIDEBAR ═══════════════════════════════════════════════════════════ */
const LABELS = {
  dashboard:{eye:"Live Operations",title:"Dashboard"},
  station:  {eye:"Operator Console",title:"Attendance Station"},
  employees:{eye:"Workforce Registry",title:"Employees"},
  workforce:{eye:"Governance",title:"Workforce Control"},
  reports:  {eye:"Analytics",title:"Reports"},
  audit:    {eye:"Security",title:"Audit Trail"},
};

function Sidebar({user,view,go,onLogout,mini,toggleMini,conflictCount,mobileOpen,closeMobile}) {
  const nav=useMemo(()=>{
    const base=[
      {id:"dashboard",label:"Dashboard",icon:I.Grid},
      {id:"station",label:"Attendance Station",icon:I.Radio,badge:conflictCount>0?conflictCount:null},
      {id:"employees",label:"Employees",icon:I.Users},
      {id:"workforce",label:"Workforce Control",icon:I.Cpu},
      {id:"reports",label:"Reports",icon:I.Chart},
      {id:"audit",label:"Audit Trail",icon:I.Shield},
    ];
    if(user?.role==="viewer") return base.filter(i=>!["workforce","employees"].includes(i.id));
    return base;
  },[user,conflictCount]);
  return (
    <>
      {mobileOpen&&<div className="sb-overlay" onClick={closeMobile}/>}
      <aside className={`sidebar ${mini?"mini":""} ${mobileOpen?"open":""}`}>
        <div className="sb-head">
          <div className="sb-mark">{I.Mark}</div>
          <div className="sb-brand"><div className="sb-name">BioTime AMS</div><div className="sb-ver">Enterprise</div></div>
          <button className="sb-pin" onClick={toggleMini} title={mini?"Expand sidebar":"Collapse sidebar"}>{I.ChevL}</button>
        </div>
        <nav className="sb-nav">
          <div className="sb-gl">Main</div>
          {nav.map(item=>(
            <button key={item.id} className={`sb-link ${view===item.id?"on":""}`}
              onClick={()=>{go(item.id);closeMobile();}} title={mini?item.label:undefined}>
              <span className="sb-ico">{item.icon}</span>
              <span className="sb-lbl">{item.label}</span>
              {item.badge&&<span className="sb-badge">{item.badge}</span>}
            </button>
          ))}
        </nav>
        <div className="sb-foot">
          <div className="sb-user">
            <div className="sb-ava">{ini(user?.name||"")}</div>
            <div className="sb-uinfo"><div className="sb-uname">{user?.name}</div><div className="sb-urole">{user?.role}</div></div>
            <button className="sb-out" onClick={onLogout} title="Sign out">{I.Out}</button>
          </div>
        </div>
      </aside>
    </>
  );
}

/* ════════ FLOATING EXPAND FAB ════════════════════════════════════════════════ */
function ExpandFab({mini,onClick}) {
  if(!mini) return null;
  return (
    <button
      className="sb-expand-fab visible"
      onClick={onClick}
      title="Expand sidebar"
      style={{
        position:"fixed", left:"calc(var(--sb-mini) + 1px)", top:"50%",
        transform:"translateY(-50%) translateX(-50%)",
        width:28, height:28, borderRadius:"50%",
        background:"var(--ac)", color:"#000", border:"2px solid var(--s0)",
        display:"flex", alignItems:"center", justifyContent:"center",
        zIndex:302, cursor:"pointer",
        boxShadow:"0 0 20px var(--ac-30), 0 4px 14px rgba(0,0,0,0.5)",
        transition:"all 0.2s var(--spring)",
      }}
    >
      {I.ChevR}
    </button>
  );
}

/* ════════ HEADER ════════════════════════════════════════════════════════════ */
function Header({view,fpStatus,onMenu,onRefresh,loading}) {
  const {eye,title}=LABELS[view]||{};
  const st=fpStatus?.status;
  const tone=st==="ok"?"ok":st==="warning"?"warn":"err";
  return (
    <header className="hdr">
      <div className="hdr-l">
        <button className="mob-ham" onClick={onMenu}>{I.Menu}</button>
        <div><div className="hdr-eyebrow">{eye}</div><div className="hdr-title">{title}</div></div>
        {loading&&<div style={{width:6,height:6,borderRadius:"50%",background:"var(--ac)",animation:"pulse-ring 1.2s infinite",marginLeft:4}}/>}
      </div>
      <div className="hdr-r">
        <div className={`hdr-pill ${tone}`}>
          <span className={`pip ${tone}`}/>
          <span>FP · {st||"offline"}</span>
        </div>
        <div className="hdr-sep"/>
        <LiveClock/>
        <button className="btn btn-ghost btn-sm" onClick={onRefresh} title="Refresh all data" style={{padding:"6px 10px"}}>
          <span style={loading?{animation:"spin 0.8s linear infinite"}:{}}>{I.Spin}</span>
        </button>
      </div>
    </header>
  );
}

/* ════════ DASHBOARD ═════════════════════════════════════════════════════════ */
function Dashboard({overview,auditRows,conflictCount,refresh,loading}) {
  const es=overview?.employeeStats||{}; const ts=overview?.todayStats||{}; const ws=overview?.workflowStats||{};
  return (
    <div className="view">
      <div className="vhdr">
        <div className="vhdr-l"><div className="veyebrow">Live Operations</div><h1 className="vtitle">Dashboard</h1></div>
        <div className="vactions"><button className="btn btn-secondary" onClick={refresh}><span style={loading?{animation:"spin 0.8s linear infinite"}:{}}>{I.Spin}</span> Refresh</button></div>
      </div>

      {conflictCount>0&&<Banner type="danger" className="stagger-1"><strong>{conflictCount} fingerprint conflict{conflictCount!==1?"s":""} active.</strong> Resolve in the Employees view before running global verification.</Banner>}
      {ws.holidaysToday>0&&<Banner type="info"><strong>Holiday today.</strong> {ws.holidaysToday} holiday record{ws.holidaysToday!==1?"s":""} active.</Banner>}

      <div className="section-label stagger-1">Today · Attendance</div>
      {loading&&!overview
        ? <div className="metrics stagger-1">{Array.from({length:5}).map((_,i)=><MetricSkeleton key={i}/>)}</div>
        : <div className="metrics stagger-1">
          <Metric label="Check-Ins Today"   val={ts.checkIns??0}          tone="teal"   icon={I.Trend}  delay={0}/>
          <Metric label="Open Sessions"     val={ts.openSessions??0}      tone={ts.openSessions>0?"rose":""} icon={I.Clock} delay={50}/>
          <Metric label="Late Arrivals"     val={ts.lateArrivals??0}      tone="amber"  icon={I.Warn}   delay={100}/>
          <Metric label="Overtime Rows"     val={ts.overtimeRows??0}      tone="sky"    icon={I.Arrow}  delay={150}/>
          <Metric label="Pending Review"    val={ts.pendingReviewRows??0} tone={ts.pendingReviewRows>0?"amber":""} icon={I.Info} delay={200}/>
        </div>
      }

      <div className="section-label stagger-2">Workforce · Overview</div>
      {loading&&!overview
        ? <div className="metrics stagger-2">{Array.from({length:8}).map((_,i)=><MetricSkeleton key={i}/>)}</div>
        : <div className="metrics stagger-2">
          <Metric label="Total Employees"   val={es.totalEmployees??0}         tone=""        icon={I.Users}  delay={0}/>
          <Metric label="Active Employees"  val={es.activeEmployees??0}        tone="green"   icon={I.Check}  delay={40}/>
          <Metric label="Finger Slots"      val={es.fingerprintTemplates??0}   tone="teal"    icon={I.FP}    sub="Multi-finger" delay={80}/>
          <Metric label="Face Enrolled"     val={es.faceEnrolled??0}           tone="amber"   icon={I.Face}   delay={120}/>
          <Metric label="Shift Assigned"    val={es.shiftAssignedEmployees??0} tone="sky"     icon={I.Cal}    delay={160}/>
          <Metric label="Pending Leave"     val={ws.pendingLeaveRequests??0}   tone={ws.pendingLeaveRequests>0?"orange":""} icon={I.File} delay={200}/>
          <Metric label="Pending Approvals" val={ws.pendingApprovals??0}       tone={ws.pendingApprovals>0?"rose":""} icon={I.Bell} delay={240}/>
          <Metric label="On Leave Today"    val={ws.employeesOnLeaveToday??0}  tone="violet"  icon={I.Cal}    delay={280}/>
        </div>
      }

      {/* Recent Attendance */}
      <div className="card stagger-3">
        <div className="card-hd">
          <div><div className="card-title">Recent Attendance</div><div className="card-desc">Latest entries with shift analytics · auto-refreshes every 5s on Station view</div></div>
          <span className="badge badge-neutral">{(overview?.recentAttendance||[]).length} rows</span>
        </div>
        <div className="tscroll">
          {loading&&!overview
            ? <div style={{padding:22}}>{Array.from({length:5}).map((_,i)=><Skeleton key={i} h={18} mb={10}/>)}</div>
            : <table>
            <thead><tr><th>Employee</th><th>Date</th><th>In</th><th>Out</th><th>Work</th><th>Late</th><th>OT</th><th>Method</th><th>Score</th><th>Status</th></tr></thead>
            <tbody>
              {!(overview?.recentAttendance?.length)
                ? <tr><td colSpan={10}><div className="empty">{I.Act}<p>No attendance records yet</p></div></td></tr>
                : overview.recentAttendance.map(r=>(
                  <tr key={r.id}>
                    <td><span className="cell-main">{r.name}</span><span className="cell-sub">{r.employee_code||"—"} · {r.department||"—"}</span></td>
                    <td><span className="cell-mono">{r.date}</span></td>
                    <td><span className="cell-mono">{fT(r.check_in)}</span></td>
                    <td><span className="cell-mono">{fT(r.check_out)}</span></td>
                    <td><span className="cell-mono">{r.work_minutes>0?fMin(r.work_minutes):"—"}</span></td>
                    <td><span className="cell-mono" style={{color:r.minutes_late>0?"var(--ab)":"var(--t2)"}}>{r.minutes_late>0?`${r.minutes_late}m`:"—"}</span></td>
                    <td><span className="cell-mono" style={{color:r.overtime_minutes>0?"var(--sk)":"var(--t2)"}}>{r.overtime_minutes>0?fMin(r.overtime_minutes):"—"}</span></td>
                    <td style={{whiteSpace:"nowrap"}}>
                      {r.check_in_method&&<span className="badge badge-teal" style={{fontSize:9,marginRight:4}}>{r.check_in_method}</span>}
                      {r.check_out_method&&<span className="badge badge-neutral" style={{fontSize:9}}>{r.check_out_method}</span>}
                    </td>
                    <td><span className="cell-mono">{r.verification_score?Number(r.verification_score).toFixed(3):"—"}</span></td>
                    <td><span className={`badge ${attBadge(r.status)}`}><span className="bd"/>{r.status||"present"}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>}
        </div>
      </div>

      {/* Audit */}
      <div className="card stagger-4">
        <div className="card-hd"><div><div className="card-title">Recent Audit Trail</div><div className="card-desc">Security and operational events</div></div></div>
        <div className="tscroll">
          <table>
            <thead><tr><th>Summary</th><th>Event</th><th>Target</th><th>Actor</th><th>When</th></tr></thead>
            <tbody>
              {loading&&!auditRows?.length
                ? <tr><td colSpan={5}><div style={{padding:18}}>{Array.from({length:5}).map((_,i)=><Skeleton key={i} h={16} mb={8}/>)}</div></td></tr>
                : (auditRows||[]).slice(0,10).map(r=>(
                  <tr key={r.id}>
                    <td><span className="cell-main" style={{fontSize:12.5}}>{r.summary}</span></td>
                    <td><span className="badge badge-neutral" style={{fontSize:9}}>{r.event_type}</span></td>
                    <td><span className="cell-sub">{r.target_type} #{r.target_id||"—"}</span></td>
                    <td style={{color:"var(--t2)"}}>{r.actor_name||"System"}</td>
                    <td><span className="cell-mono" style={{fontSize:11,whiteSpace:"nowrap"}}>{fDT(r.created_at)}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ════════ STATION ════════════════════════════════════════════════════════════ */
function Station({token,stSt,latEvt,conflictCount,stMsg,setStMsg,refresh,launchVerify,refreshSt}) {
  const fp=stSt.fingerprint||{}; const face=stSt.face||{};
  const agentOk=fp.mode==="local-agent";
  const tone=latEvt?.event_type==="attendance.check_in"?"green":latEvt?.event_type==="attendance.check_out"?"amber":"rose";
  return (
    <div className="view">
      <div className="vhdr">
        <div className="vhdr-l"><div className="veyebrow">Operator Console</div><h1 className="vtitle">Attendance Station</h1></div>
        <div className="vactions"><button className="btn btn-secondary" onClick={refreshSt}>{I.Spin} Refresh Services</button></div>
      </div>

      <div className="svc-row stagger-1">
        <SvcPill label="Biometric Agent" status={agentOk?"ok":"warning"} msg={agentOk?"Ready — local agent running":"Start biometric agent on port 8091"}/>
        <SvcPill label="Fingerprint Bridge" status={fp.status||"loading"} msg={fp.message}/>
        <SvcPill label="Face Service" status={face.status||"loading"} msg={face.message}/>
      </div>

      {conflictCount>0&&<Banner type="danger"><strong>{conflictCount} conflict{conflictCount!==1?"s":""} active.</strong> Global FP verification is blocked only for active duplicate ownership issues. Resolve them in Employees.</Banner>}
      {stMsg&&<Banner type="info" dismiss={()=>setStMsg("")}>{stMsg}</Banner>}

      {latEvt&&(
        <div className={`evt-card ${tone}`}>
          <div className="evt-ico">{tone==="green"?I.Check:tone==="amber"?I.Clock:I.Warn}</div>
          <div>
            <div className="evt-tag">{latEvt.event_type==="attendance.check_in"?"Check-in recorded":latEvt.event_type==="attendance.check_out"?"Check-out recorded":latEvt.event_type==="attendance.already_closed"?"Session already closed":"Attendance event"}</div>
            <div className="evt-msg">{latEvt.summary}</div>
            <div className="evt-ts">{fDT(latEvt.created_at)}</div>
          </div>
        </div>
      )}

      <div className="station-grid stagger-2">
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Fingerprint Workflow</div><div className="card-desc">HID DigitalPersona 4500 via Windows agent</div></div><span className="badge badge-teal">{I.FP} HID SDK</span></div>
          <div className="card-body">
            <div className="steps" style={{marginBottom:22}}>
              <div className="step">Backend must be running on <code style={{fontFamily:"var(--mono)",fontSize:11,background:"var(--s3)",padding:"1px 6px",borderRadius:4}}>port 4000</code></div>
              <div className="step">Start biometric agent (<code style={{fontFamily:"var(--mono)",fontSize:11,background:"var(--s3)",padding:"1px 6px",borderRadius:4}}>port 8091</code>) from the ops folder</div>
              <div className="step">Press Launch and place finger on the HID DigitalPersona 4500 reader</div>
              <div className="step">Attendance, shift analytics, and late-mark are recorded automatically</div>
            </div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
              <button className="btn btn-primary" onClick={launchVerify} disabled={conflictCount>0} title={conflictCount>0?"Resolve active duplicate ownership conflicts first.":undefined}>{I.FP} Launch Fingerprint Verification</button>
              <button className="btn btn-secondary" onClick={refresh}>{I.Spin} Refresh Feed</button>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-hd"><div><div className="card-title">Face Recognition</div><div className="card-desc">3-sample burst capture · live quality preview</div></div><span className="badge badge-amber">{I.Face} Python Flask</span></div>
          <div className="card-body"><CamPanel token={token} mode="verify" onDone={refresh}/></div>
        </div>
      </div>
    </div>
  );
}

/* ════════ EMPLOYEES ══════════════════════════════════════════════════════════ */
function Employees({token,employees,onRefresh}) {
  const [sel,setSel]=useState(null); const [hist,setHist]=useState([]); const [fps,setFps]=useState([]);
  const [plan,setPlan]=useState(null); const [conf,setConf]=useState({exactDuplicates:[],recentConflicts:[]});
  const [msg,setMsg]=useState(""); const [mt,setMt]=useState("info");
  const [busy,setBusy]=useState(false); const [q,setQ]=useState("");

  const blank={id:null,employeeCode:"",name:"",cnic:"",department:"",designation:"",status:"active",profileImage:""};
  const [form,setForm]=useState(blank);
  const sf=k=>e=>setForm(f=>({...f,[k]:e.target.value}));

  const filtered=useMemo(()=>{
    const lo=q.toLowerCase();
    return employees.filter(e=>e.name?.toLowerCase().includes(lo)||e.cnic?.includes(lo)||(e.employee_code||"").toLowerCase().includes(lo));
  },[employees,q]);

  async function pick(emp){
    setSel(emp); setMsg("");
    setForm({id:emp.id,employeeCode:emp.employee_code||"",name:emp.name||"",cnic:emp.cnic||"",department:emp.department||"",designation:emp.designation||"",status:emp.status||"active",profileImage:emp.profile_image||""});
    const [h,f,p,c]=await Promise.all([
      req(`/api/employees/${emp.id}/attendance`,{},token),
      req(`/api/employees/${emp.id}/fingerprints`,{},token),
      req(`/api/employees/${emp.id}/fingerprint-plan`,{},token),
      req(`/api/biometrics/fingerprint/conflicts?employeeId=${emp.id}`,{},token),
    ]);
    if(h.ok)setHist(h.data); if(f.ok)setFps(f.data); if(p.ok)setPlan(p.data); if(c.ok)setConf(c.data);
  }

  function clear(){setSel(null);setHist([]);setFps([]);setPlan(null);setConf({exactDuplicates:[],recentConflicts:[]});setMsg("");setForm(blank);}

  async function save(e){
    e.preventDefault(); setBusy(true); setMsg("");
    const path=form.id?`/api/employees/${form.id}`:"/api/employees";
    const method=form.id?"PUT":"POST";
    const r=await req(path,{method,body:JSON.stringify({employeeCode:form.employeeCode,name:form.name,cnic:form.cnic,department:form.department,designation:form.designation,status:form.status,profileImage:form.profileImage})},token);
    setBusy(false);
    if(!r.ok){setMsg(r.data.message||"Save failed.");setMt("danger");toast(r.data.message||"Save failed","danger");return;}
    const m=form.id?"Employee updated.":"Employee created."; setMsg(m);setMt("success"); toast(m,"success"); onRefresh();
    if(!form.id)clear();
  }

  async function launchEnroll(eid,fc){const r=await req("/api/biometrics/fingerprint/launch-enroll",{method:"POST",body:JSON.stringify({employeeId:eid,fingerCode:fc})},token); const m=r.data.message||"Enrollment window launched."; setMsg(m);setMt("info"); toast(m,"info");}
  async function launchVerify(eid){
    const r=await req("/api/biometrics/fingerprint/launch-verify",{method:"POST",body:JSON.stringify({employeeId:eid})},token);
    const m=r.data.message||"Verification launched.";
    setMsg(m); setMt(r.ok?"info":"danger"); toast(m,r.ok?"info":"danger");
    if(sel?.id===eid) pick(sel);
  }
  async function markManual(eid){
    const r=await req("/api/attendance/manual-mark",{method:"POST",body:JSON.stringify({employeeId:eid})},token);
    if(!r.ok){toast(r.data.message||"Error","danger");return;}
    const m=`Manual ${r.data.attendance?.action} recorded.`; toast(m,"success"); onRefresh();
  }
  async function setPreferred(eid,fid){await req(`/api/employees/${eid}/fingerprints/${fid}/prefer`,{method:"POST"},token); if(sel)pick(sel); onRefresh(); toast("Preferred finger updated","success");}
  async function delSlot(eid,fid){
    if(!confirm("Delete fingerprint slot? Cannot be undone."))return;
    await req(`/api/employees/${eid}/fingerprints/${fid}`,{method:"DELETE"},token);
    if(sel)pick(sel); onRefresh(); toast("Fingerprint slot deleted","warn");
  }

  const activeCc=conf.exactDuplicates?.length||0;
  const recentCc=conf.recentConflicts?.length||0;

  return (
    <div className="view">
      <div className="vhdr">
        <div className="vhdr-l"><div className="veyebrow">Workforce Registry</div><h1 className="vtitle">Employees</h1></div>
        <div className="vactions"><button className="btn btn-secondary" onClick={clear}>{I.Plus} New Employee</button></div>
      </div>
      <div className="emp-layout">
        <div>
          <div className="card" style={{position:"sticky",top:62}}>
            <div className="card-hd"><div><div className="card-title">Employees</div><div className="card-desc">{employees.length} total</div></div></div>
            <div style={{padding:"9px 10px 7px"}}>
              <input className="finput" style={{fontSize:12.5,padding:"8px 12px"}} placeholder="Search name, CNIC, code…" value={q} onChange={e=>setQ(e.target.value)}/>
            </div>
            <div className="emp-list">
              {filtered.length===0
                ? <div className="empty" style={{padding:28}}>{I.Users}<p>No matches</p></div>
                : filtered.map(e=>(
                  <button key={e.id} className={`emp-row ${sel?.id===e.id?"sel":""}`} onClick={()=>pick(e)}>
                    <div className="emp-avi">{ini(e.name)}</div>
                    <div className="emp-inf">
                      <div className="emp-nm">{e.name}</div>
                      <div className="emp-mt">{e.employee_code||"No code"} · {e.cnic}</div>
                      <div className="chip-row">
                        <span className={`chip ${e.has_fingerprint?"chi":"chm"}`}>{e.has_fingerprint?`${e.fingerprint_count||1}× FP`:"No FP"}</span>
                        <span className={`chip ${e.has_face?"cha":"chm"}`}>{e.has_face?"Face ✓":"No Face"}</span>
                        <span className={`chip ${e.status==="active"?"che":"chm"}`}>{e.status}</span>
                      </div>
                    </div>
                  </button>
                ))
              }
            </div>
          </div>
        </div>
        <div>
          <div className="card">
            <div className="card-hd">
              <div><div className="card-title">{form.id?`Editing — ${sel?.name}`:"New Employee"}</div><div className="card-desc">{form.id?`ID: ${form.id}`:""}</div></div>
              {form.id&&<button className="btn btn-ghost btn-sm" onClick={clear}>Clear</button>}
            </div>
            <div className="card-body">
              {msg&&<Banner type={mt} dismiss={()=>setMsg("")}>{msg}</Banner>}
              <form onSubmit={save}>
                <div className="fgrid">
                  <div className="field"><label className="flabel">Employee Code</label><input className="finput" placeholder="EMP-001" value={form.employeeCode} onChange={sf("employeeCode")}/></div>
                  <div className="field"><label className="flabel">Status</label><select className="fselect" value={form.status} onChange={sf("status")}><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
                </div>
                <div className="field"><label className="flabel">Full Name *</label><input className="finput" placeholder="Muhammad Ahmad" value={form.name} onChange={sf("name")} required/></div>
                <div className="field"><label className="flabel">CNIC *</label><input className="finput" placeholder="42101-1234567-1" value={form.cnic} onChange={sf("cnic")} required/></div>
                <div className="fgrid">
                  <div className="field"><label className="flabel">Department</label><input className="finput" placeholder="Engineering" value={form.department} onChange={sf("department")}/></div>
                  <div className="field"><label className="flabel">Designation</label><input className="finput" placeholder="Senior Engineer" value={form.designation} onChange={sf("designation")}/></div>
                </div>
                <div className="frow">
                  <button className="btn btn-primary" type="submit" disabled={busy}>{busy?"Saving…":form.id?"Save Changes":"Create Employee"}</button>
                  <button className="btn btn-ghost" type="button" onClick={clear}>Reset</button>
                </div>
              </form>
            </div>
          </div>

          {sel&&(
            <>
              <div className="card">
                <div className="card-hd"><div><div className="card-title">Biometric Actions</div><div className="card-desc">Operations for {sel.name}</div></div></div>
                <div className="card-body" style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                  <button className="btn btn-primary btn-sm" onClick={()=>launchEnroll(sel.id,plan?.missingRecommended?.[0]?.fingerCode||"right_index")}>{I.FP} Enroll Next Finger</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>launchVerify(sel.id)}>{I.FP} Verify</button>
                  <button className="btn btn-secondary btn-sm" onClick={()=>markManual(sel.id)}>{I.Check} Manual Attendance</button>
                </div>
              </div>

              <div className="card">
                <div className="card-hd">
                  <div><div className="card-title">Fingerprint Slots</div><div className="card-desc">{fps.length} enrolled · Preferred: {fpN(fps.find(f=>f.is_preferred)?.finger_code)||"none"}</div></div>
                </div>
                <div className="card-body">
                  {activeCc>0&&<Banner type="danger">{activeCc} active duplicate fingerprint conflict{activeCc!==1?"s":""} for this employee.</Banner>}
                  {!activeCc&&recentCc>0&&<Banner type="warn">{recentCc} recent fingerprint conflict log{recentCc!==1?"s":""} found for this employee. Verification can still run, but review the audit trail.</Banner>}
                  {plan&&(
                    <div className="fp-grid" style={{marginBottom:18}}>
                      {plan.recommended.map(item=>(
                        <div key={item.fingerCode} className={`fp-slot ${item.enrolled?"ev":""} ${item.isPreferred?"pf":""}`}
                          onClick={()=>!item.enrolled&&launchEnroll(sel.id,item.fingerCode)}
                          title={item.enrolled?fpN(item.fingerCode):`Enroll ${fpN(item.fingerCode)}`}>
                          {item.isPreferred&&<div className="fp-pip"/>}
                          <div className="fp-ico">{item.enrolled?"🖐":"＋"}</div>
                          <div className="fp-lbl">{fpN(item.fingerCode)}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  {fps.length>0&&(
                    <div className="tscroll">
                      <table>
                        <thead><tr><th>Finger</th><th>Format</th><th>Source</th><th>Quality</th><th>Updated</th><th>Actions</th></tr></thead>
                        <tbody>
                          {fps.map(fp=>(
                            <tr key={fp.id}>
                              <td><span className="cell-main" style={{display:"flex",alignItems:"center",gap:6}}>{fpN(fp.finger_code)}{fp.is_preferred?<span className="badge badge-teal" style={{fontSize:8}}>★ Preferred</span>:null}</span></td>
                              <td><span className="cell-sub">{fp.template_format}</span></td>
                              <td><span className="cell-sub">{fp.source||"—"}</span></td>
                              <td><span className="cell-mono">{fp.quality_score?Number(fp.quality_score).toFixed(2):"—"}</span></td>
                              <td><span className="cell-sub">{fD(fp.updated_at)}</span></td>
                              <td><div style={{display:"flex",gap:4}}>
                                {!fp.is_preferred&&<button className="btn btn-ghost btn-xs" title="Set preferred" onClick={()=>setPreferred(sel.id,fp.id)}>{I.Star}</button>}
                                <button className="btn btn-ghost btn-xs" title="Re-enroll" onClick={()=>launchEnroll(sel.id,fp.finger_code)}>{I.Spin}</button>
                                <button className="btn btn-danger btn-xs" title="Delete" onClick={()=>delSlot(sel.id,fp.id)}>{I.Trash}</button>
                              </div></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              <div className="card">
                <div className="card-hd">
                  <div><div className="card-title">Face Enrollment</div><div className="card-desc">3-sample capture for {sel.name}</div></div>
                  <span className={`badge ${sel.has_face?"badge-green":"badge-neutral"}`}>{sel.has_face?"Face Enrolled":"Not Enrolled"}</span>
                </div>
                <div className="card-body">
                  <CamPanel token={token} empId={sel.id} mode="enroll" onDone={()=>{onRefresh();pick(sel);}}/>
                </div>
              </div>

              <div className="card">
                <div className="card-hd"><div><div className="card-title">Attendance History</div><div className="card-desc">Last 60 records for {sel.name}</div></div><span className="badge badge-neutral">{hist.length}</span></div>
                <div className="card-body">
                  {hist.length===0
                    ? <div className="empty" style={{padding:28}}>{I.Clock}<p>No records yet</p></div>
                    : <div className="tl">{hist.map(r=>(
                      <div key={r.id} className="tl-row">
                        <div className={`tl-pip ${r.check_out?"o":"i"}`}/>
                        <div style={{flex:1}}>
                          <div className="tl-d">{r.date}</div>
                          <div className="tl-t">In: {fT(r.check_in)} · Out: {fT(r.check_out)}{r.check_in_method?` · ${r.check_in_method}`:""}{r.work_minutes>0?` · ${fMin(r.work_minutes)}`:""}{r.minutes_late>0?` · +${r.minutes_late}m late`:""}</div>
                        </div>
                        {r.status&&<span className={`badge ${attBadge(r.status)}`} style={{alignSelf:"center",flexShrink:0}}>{r.status}</span>}
                      </div>
                    ))}</div>
                  }
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

/* ════════ WORKFORCE ══════════════════════════════════════════════════════════ */
function Workforce({token,employees}) {
  const [ov,setOv]=useState(null); const [shifts,setShifts]=useState([]); const [devices,setDevices]=useState([]);
  const [holidays,setHol]=useState([]); const [leave,setLeave]=useState([]); const [approvals,setApprv]=useState([]); const [assigns,setAsgn]=useState([]);
  const [loading,setLoad]=useState(true); const [banner,setBanner]=useState({msg:"",type:"info"});

  const bl={shift:{name:"",shiftCode:"",startTime:"09:00:00",endTime:"17:00:00",graceMinutes:15,overtimeAfterMinutes:30}};
  const [sf,setSf]=useState(bl.shift);
  const [df,setDf]=useState({deviceName:"",stationName:"",locationLabel:"",verificationMode:"either_biometric",allowedMethods:["fingerprint","face","manual"]});
  const [hf,setHf]=useState({holidayDate:"",name:"",holidayType:"company"});
  const [lf,setLf]=useState({employeeId:"",leaveType:"annual",startDate:"",endDate:"",partialDay:"none",reason:""});
  const [af,setAf]=useState({employeeId:"",shiftId:"",effectiveFrom:"",effectiveTo:""});
  const [pf,setPf]=useState({employeeId:"",requestType:"manual_regularization",attendanceId:"",requestedCheckIn:"",requestedCheckOut:"",reason:""});

  const sSf=k=>e=>setSf(f=>({...f,[k]:k==="graceMinutes"||k==="overtimeAfterMinutes"?Number(e.target.value):e.target.value}));
  const sDf=k=>e=>setDf(f=>({...f,[k]:e.target.value}));
  const sHf=k=>e=>setHf(f=>({...f,[k]:e.target.value}));
  const sLf=k=>e=>setLf(f=>({...f,[k]:e.target.value}));
  const sAf=k=>e=>setAf(f=>({...f,[k]:e.target.value}));
  const sPf=k=>e=>setPf(f=>({...f,[k]:e.target.value}));

  async function loadAll(){
    setLoad(true);
    const [r0,r1,r2,r3,r4,r5,r6]=await Promise.all([
      req("/api/workforce/overview",{},token), req("/api/workforce/shifts",{},token),
      req("/api/workforce/device-policies",{},token), req("/api/workforce/holidays",{},token),
      req("/api/workforce/leave-requests",{},token), req("/api/workforce/approval-requests",{},token),
      req("/api/workforce/assignments",{},token),
    ]);
    if(r0.ok)setOv(r0.data); if(r1.ok)setShifts(r1.data); if(r2.ok)setDevices(r2.data);
    if(r3.ok)setHol(r3.data); if(r4.ok)setLeave(r4.data); if(r5.ok)setApprv(r5.data); if(r6.ok)setAsgn(r6.data);
    setLoad(false);
  }
  useEffect(()=>{loadAll();},[]);

  const post=(path,data,reset,msg)=>async e=>{
    e.preventDefault();
    const r=await req(path,{method:"POST",body:JSON.stringify(data)},token);
    if(!r.ok){setBanner({msg:r.data.message||"Failed",type:"danger"});toast(r.data.message||"Failed","danger");return;}
    setBanner({msg,type:"success"}); toast(msg,"success"); reset(); loadAll();
  };
  function toggleM(m){setDf(f=>{const n=f.allowedMethods.includes(m)?f.allowedMethods.filter(x=>x!==m):[...f.allowedMethods,m];return{...f,allowedMethods:n.length?n:["manual"]};});}
  async function decLeave(id,d){const r=await req(`/api/workforce/leave-requests/${id}/decision`,{method:"POST",body:JSON.stringify({decision:d})},token); if(!r.ok){toast(r.data.message||"Error","danger");return;} toast(`Leave #${id} ${d}`,"success"); loadAll();}
  async function decApproval(id,d){const r=await req(`/api/workforce/approval-requests/${id}/decision`,{method:"POST",body:JSON.stringify({decision:d})},token); if(!r.ok){toast(r.data.message||"Error","danger");return;} toast(`Approval #${id} ${d}`,"success"); loadAll();}

  const s=ov?.summary||{};
  return (
    <div className="view">
      <div className="vhdr">
        <div className="vhdr-l"><div className="veyebrow">Governance</div><h1 className="vtitle">Workforce Control</h1></div>
        <div className="vactions"><button className="btn btn-secondary" onClick={loadAll}><span style={loading?{animation:"spin 0.8s linear infinite"}:{}}>{I.Spin}</span> Refresh</button></div>
      </div>

      {banner.msg&&<Banner type={banner.type} dismiss={()=>setBanner({msg:"",type:"info"})}>{banner.msg}</Banner>}

      <div className="metrics stagger-1">
        <Metric label="Active Shifts"     val={s.activeShifts??0}           tone="teal"  icon={I.Clock}/>
        <Metric label="Active Devices"    val={s.activeDevices??0}          tone="sky"   icon={I.Cpu}/>
        <Metric label="Pending Leave"     val={s.pendingLeaveRequests??0}   tone="amber" icon={I.Cal}/>
        <Metric label="Pending Approvals" val={s.pendingApprovals??0}       tone={s.pendingApprovals>0?"rose":""} icon={I.Warn}/>
      </div>

      <div className="wf-grid">
        <div className="card stagger-2">
          <div className="card-hd"><div><div className="card-title">Shift Definitions</div><div className="card-desc">Grace, overtime, and workday rules</div></div></div>
          <div className="card-body">
            <form onSubmit={post("/api/workforce/shifts",sf,()=>setSf(bl.shift),`Shift '${sf.name}' saved.`)} style={{display:"flex",flexDirection:"column",gap:0}}>
              <div className="fgrid">
                <div className="field"><label className="flabel">Shift Name *</label><input className="finput" placeholder="Morning Shift" value={sf.name} onChange={sSf("name")} required/></div>
                <div className="field"><label className="flabel">Shift Code</label><input className="finput" placeholder="MS-01" value={sf.shiftCode} onChange={sSf("shiftCode")}/></div>
                <div className="field"><label className="flabel">Start Time</label><input className="finput" type="time" value={sf.startTime} onChange={sSf("startTime")}/></div>
                <div className="field"><label className="flabel">End Time</label><input className="finput" type="time" value={sf.endTime} onChange={sSf("endTime")}/></div>
                <div className="field"><label className="flabel">Grace (min)</label><input className="finput" type="number" min={0} value={sf.graceMinutes} onChange={sSf("graceMinutes")}/></div>
                <div className="field"><label className="flabel">OT after (min)</label><input className="finput" type="number" min={0} value={sf.overtimeAfterMinutes} onChange={sSf("overtimeAfterMinutes")}/></div>
              </div>
              <button className="btn btn-primary btn-sm" type="submit">{I.Plus} Save Shift</button>
            </form>
            <div className="tscroll" style={{marginTop:16}}>
              <table>
                <thead><tr><th>Shift</th><th>Hours</th><th>Grace</th><th>OT After</th></tr></thead>
                <tbody>
                  {loading?<tr><td colSpan={4}><div className="loading-row">{I.Loader}Loading…</div></td></tr>
                    :shifts.length===0?<tr><td colSpan={4}><div className="empty" style={{padding:20}}>{I.Clock}<p>No shifts</p></div></td></tr>
                    :shifts.map(s=><tr key={s.id}><td><span className="cell-main">{s.name}</span><span className="cell-sub">{s.shift_code||"—"}</span></td><td><span className="cell-mono">{s.start_time}–{s.end_time}</span></td><td>{s.grace_minutes}m</td><td>{s.overtime_after_minutes}m</td></tr>)
                  }
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card stagger-2">
          <div className="card-hd"><div><div className="card-title">Device Policies</div><div className="card-desc">Biometric method routing per station</div></div></div>
          <div className="card-body">
            <form onSubmit={post("/api/workforce/device-policies",df,()=>setDf({deviceName:"",stationName:"",locationLabel:"",verificationMode:"either_biometric",allowedMethods:["fingerprint","face","manual"]}),`Policy '${df.deviceName}' saved.`)} style={{display:"flex",flexDirection:"column",gap:0}}>
              <div className="fgrid">
                <div className="field"><label className="flabel">Device Name *</label><input className="finput" placeholder="Station 1" value={df.deviceName} onChange={sDf("deviceName")} required/></div>
                <div className="field"><label className="flabel">Station Name *</label><input className="finput" placeholder="Main Entrance" value={df.stationName} onChange={sDf("stationName")} required/></div>
                <div className="field"><label className="flabel">Location</label><input className="finput" placeholder="Ground Floor" value={df.locationLabel} onChange={sDf("locationLabel")}/></div>
                <div className="field"><label className="flabel">Mode</label>
                  <select className="fselect" value={df.verificationMode} onChange={sDf("verificationMode")}>
                    <option value="either_biometric">Either biometric</option><option value="single">Single</option>
                    <option value="face_first">Face first</option><option value="fingerprint_first">Fingerprint first</option><option value="manual_only">Manual only</option>
                  </select>
                </div>
              </div>
              <div style={{display:"flex",gap:6,marginBottom:12}}>
                <span className="flabel" style={{marginRight:4,paddingTop:6}}>Methods:</span>
                {["fingerprint","face","manual"].map(m=><button key={m} type="button" className={`btn ${df.allowedMethods.includes(m)?"btn-primary":"btn-ghost"} btn-sm`} onClick={()=>toggleM(m)}>{m}</button>)}
              </div>
              <button className="btn btn-primary btn-sm" type="submit">{I.Plus} Save Policy</button>
            </form>
            <div className="tscroll" style={{marginTop:16}}>
              <table>
                <thead><tr><th>Station</th><th>Mode</th><th>Status</th></tr></thead>
                <tbody>
                  {devices.map(d=><tr key={d.id}><td><span className="cell-main">{d.device_name}</span><span className="cell-sub">{d.station_name}</span></td><td><span className="cell-sub">{d.verification_mode}</span></td><td><span className={`badge ${d.status==="active"?"badge-green":"badge-neutral"}`}>{d.status}</span></td></tr>)}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card stagger-3">
          <div className="card-hd"><div><div className="card-title">Leave & Holidays</div><div className="card-desc">Calendar management and leave requests</div></div></div>
          <div className="card-body">
            <form onSubmit={post("/api/workforce/holidays",hf,()=>setHf({holidayDate:"",name:"",holidayType:"company"}),`Holiday '${hf.name}' added.`)} style={{marginBottom:18,display:"flex",flexDirection:"column",gap:0}}>
              <div className="fgrid">
                <div className="field"><label className="flabel">Date *</label><input className="finput" type="date" value={hf.holidayDate} onChange={sHf("holidayDate")} required/></div>
                <div className="field"><label className="flabel">Holiday Name *</label><input className="finput" placeholder="Eid Al-Fitr" value={hf.name} onChange={sHf("name")} required/></div>
              </div>
              <button className="btn btn-secondary btn-sm" type="submit">{I.Plus} Add Holiday</button>
            </form>
            <div className="divider"/>
            <form onSubmit={post("/api/workforce/leave-requests",lf,()=>setLf({employeeId:"",leaveType:"annual",startDate:"",endDate:"",partialDay:"none",reason:""}),`Leave request created.`)} style={{display:"flex",flexDirection:"column",gap:0}}>
              <div className="fgrid">
                <div className="field"><label className="flabel">Employee *</label><select className="fselect" value={lf.employeeId} onChange={sLf("employeeId")} required><option value="">Select…</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                <div className="field"><label className="flabel">Type</label><select className="fselect" value={lf.leaveType} onChange={sLf("leaveType")}><option value="annual">Annual</option><option value="sick">Sick</option><option value="casual">Casual</option><option value="unpaid">Unpaid</option></select></div>
                <div className="field"><label className="flabel">Start *</label><input className="finput" type="date" value={lf.startDate} onChange={sLf("startDate")} required/></div>
                <div className="field"><label className="flabel">End *</label><input className="finput" type="date" value={lf.endDate} onChange={sLf("endDate")} required/></div>
              </div>
              <button className="btn btn-primary btn-sm" type="submit">{I.Plus} Create Leave Request</button>
            </form>
            <div className="tscroll" style={{marginTop:16}}>
              <table>
                <thead><tr><th>Type</th><th>Employee / Name</th><th>Dates</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {holidays.slice(0,4).map(h=><tr key={`h${h.id}`}><td><span className="badge badge-violet">Holiday</span></td><td>{h.name}</td><td><span className="cell-mono">{fD0(h.holiday_date)}</span></td><td>{h.holiday_type}</td><td>—</td></tr>)}
                  {leave.slice(0,8).map(r=>(
                    <tr key={`l${r.id}`}>
                      <td><span className={`badge ${r.leave_type==="sick"?"badge-rose":r.leave_type==="annual"?"badge-sky":"badge-amber"}`}>{r.leave_type}</span></td>
                      <td>{r.employee_name||`#${r.employee_id}`}</td>
                      <td><span className="cell-mono">{fD0(r.start_date)} → {fD0(r.end_date)}</span></td>
                      <td><span className={`badge ${r.status==="approved"?"badge-green":r.status==="rejected"?"badge-rose":"badge-amber"}`}>{r.status}</span></td>
                      <td>{r.status==="pending"&&<div style={{display:"flex",gap:5}}><button className="btn btn-success btn-xs" onClick={()=>decLeave(r.id,"approved")}>Approve</button><button className="btn btn-ghost btn-xs" onClick={()=>decLeave(r.id,"rejected")}>Reject</button></div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="card stagger-3">
          <div className="card-hd"><div><div className="card-title">Assignments & Exceptions</div><div className="card-desc">Shift mapping and missed-punch approvals</div></div></div>
          <div className="card-body">
            <form onSubmit={post("/api/workforce/assignments",af,()=>setAf({employeeId:"",shiftId:"",effectiveFrom:"",effectiveTo:""}),`Shift assigned.`)} style={{marginBottom:18,display:"flex",flexDirection:"column",gap:0}}>
              <div className="fgrid">
                <div className="field"><label className="flabel">Employee *</label><select className="fselect" value={af.employeeId} onChange={sAf("employeeId")} required><option value="">Select…</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                <div className="field"><label className="flabel">Shift *</label><select className="fselect" value={af.shiftId} onChange={sAf("shiftId")} required><option value="">Select…</option>{shifts.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
                <div className="field"><label className="flabel">From *</label><input className="finput" type="date" value={af.effectiveFrom} onChange={sAf("effectiveFrom")} required/></div>
                <div className="field"><label className="flabel">To</label><input className="finput" type="date" value={af.effectiveTo} onChange={sAf("effectiveTo")}/></div>
              </div>
              <button className="btn btn-secondary btn-sm" type="submit">{I.Plus} Assign Shift</button>
            </form>
            <div className="divider"/>
            <form onSubmit={post("/api/workforce/approval-requests",{...pf,employeeId:Number(pf.employeeId),attendanceId:pf.attendanceId?Number(pf.attendanceId):null,requestedCheckIn:pf.requestedCheckIn||null,requestedCheckOut:pf.requestedCheckOut||null},()=>setPf({employeeId:"",requestType:"manual_regularization",attendanceId:"",requestedCheckIn:"",requestedCheckOut:"",reason:""}),`Approval request created.`)} style={{display:"flex",flexDirection:"column",gap:0}}>
              <div className="fgrid">
                <div className="field"><label className="flabel">Employee *</label><select className="fselect" value={pf.employeeId} onChange={sPf("employeeId")} required><option value="">Select…</option>{employees.map(e=><option key={e.id} value={e.id}>{e.name}</option>)}</select></div>
                <div className="field"><label className="flabel">Request Type</label><select className="fselect" value={pf.requestType} onChange={sPf("requestType")}><option value="manual_regularization">Manual regularization</option><option value="missed_check_in">Missed check-in</option><option value="missed_check_out">Missed check-out</option><option value="overtime_adjustment">Overtime adjustment</option></select></div>
                <div className="field"><label className="flabel">Check-In</label><input className="finput" type="datetime-local" value={pf.requestedCheckIn} onChange={sPf("requestedCheckIn")}/></div>
                <div className="field"><label className="flabel">Check-Out</label><input className="finput" type="datetime-local" value={pf.requestedCheckOut} onChange={sPf("requestedCheckOut")}/></div>
                <div className="field" style={{gridColumn:"1/-1"}}><label className="flabel">Reason *</label><input className="finput" placeholder="Reason for request" value={pf.reason} onChange={sPf("reason")} required/></div>
              </div>
              <button className="btn btn-primary btn-sm" type="submit">{I.Plus} Raise Approval Request</button>
            </form>
            <div className="tscroll" style={{marginTop:16}}>
              <table>
                <thead><tr><th>Employee</th><th>Type / Shift</th><th>Period</th><th>Status</th><th>Action</th></tr></thead>
                <tbody>
                  {assigns.slice(0,5).map(r=><tr key={`a${r.id}`}><td>{r.employee_name||`#${r.employee_id}`}</td><td>{r.shift_name}</td><td><span className="cell-mono">{fD0(r.effective_from)} → {r.effective_to?fD0(r.effective_to):"Open"}</span></td><td><span className="badge badge-teal">Assigned</span></td><td>—</td></tr>)}
                  {approvals.slice(0,8).map(r=>(
                    <tr key={`p${r.id}`}>
                      <td>{r.employee_name||`#${r.employee_id}`}</td>
                      <td><span className="cell-sub">{r.request_type}</span></td>
                      <td><span className="cell-mono" style={{fontSize:11}}>{fDT(r.created_at)}</span></td>
                      <td><span className={`badge ${r.status==="approved"?"badge-green":r.status==="rejected"?"badge-rose":"badge-amber"}`}>{r.status}</span></td>
                      <td>{r.status==="pending"&&<div style={{display:"flex",gap:5}}><button className="btn btn-success btn-xs" onClick={()=>decApproval(r.id,"approved")}>Approve</button><button className="btn btn-ghost btn-xs" onClick={()=>decApproval(r.id,"rejected")}>Reject</button></div>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ════════ REPORTS ════════════════════════════════════════════════════════════ */
function Reports({token}) {
  const [rows,setRows]=useState([]); const [busy,setBusy]=useState(false);
  const [filt,setFilt]=useState({dateFrom:"",dateTo:"",method:"",status:""});
  const sf=k=>e=>setFilt(f=>({...f,[k]:e.target.value}));

  async function load(){
    setBusy(true);
    const q=new URLSearchParams(); Object.entries(filt).forEach(([k,v])=>v&&q.set(k,v));
    const r=await req(`/api/attendance${q.size?`?${q}`:""}`,{},token);
    setBusy(false); if(r.ok)setRows(r.data);
  }

  async function exportCsv(){
    const q=new URLSearchParams(); Object.entries(filt).forEach(([k,v])=>v&&q.set(k,v));
    const r=await fetch(`${API}/api/attendance/export.csv${q.size?`?${q}`:""}`,{headers:token?{Authorization:`Bearer ${token}`}:{}});
    if(!r.ok){toast("Export failed","danger");return;}
    const url=URL.createObjectURL(await r.blob());
    const a=Object.assign(document.createElement("a"),{href:url,download:`attendance-${new Date().toISOString().slice(0,10)}.csv`});
    document.body.appendChild(a); a.click(); a.remove(); URL.revokeObjectURL(url);
    toast("CSV exported successfully","success");
  }

  useEffect(()=>{load();},[]);

  return (
    <div className="view">
      <div className="vhdr">
        <div className="vhdr-l"><div className="veyebrow">Analytics</div><h1 className="vtitle">Reports</h1></div>
        <div className="vactions">
          <span className="badge badge-neutral" style={{marginRight:4}}>{rows.length} records</span>
          <button className="btn btn-secondary" onClick={exportCsv}>{I.DL} Export CSV</button>
          <button className="btn btn-primary" onClick={load}><span style={busy?{animation:"spin 0.8s linear infinite"}:{}}>{I.Spin}</span> Refresh</button>
        </div>
      </div>

      {/* Filter bar */}
      <div className="card stagger-1" style={{marginBottom:16}}>
        <div className="filter-bar">
          <div className="fg"><span className="fg-lbl">Date From</span><input className="finput" type="date" style={{fontSize:13}} value={filt.dateFrom} onChange={sf("dateFrom")}/></div>
          <div className="fg"><span className="fg-lbl">Date To</span><input className="finput" type="date" style={{fontSize:13}} value={filt.dateTo} onChange={sf("dateTo")}/></div>
          <div className="fg"><span className="fg-lbl">Method</span>
            <select className="fselect" style={{fontSize:13}} value={filt.method} onChange={sf("method")}>
              <option value="">All methods</option><option value="fingerprint">Fingerprint</option><option value="face">Face</option><option value="manual">Manual</option>
            </select>
          </div>
          <div className="fg"><span className="fg-lbl">Status</span>
            <select className="fselect" style={{fontSize:13}} value={filt.status} onChange={sf("status")}>
              <option value="">All sessions</option><option value="open">Open</option><option value="closed">Closed</option>
            </select>
          </div>
          <button className="btn btn-primary btn-sm" onClick={load} style={{alignSelf:"flex-end"}}>Apply Filters</button>
        </div>
      </div>

      {/* Table in its own card — note: NO overflow:hidden on wrapper, tscroll handles horizontal */}
      <div className="card stagger-2" style={{overflow:"visible"}}>
        <div className="tscroll">
          {busy
            ? <div style={{padding:22}}>{Array.from({length:6}).map((_,i)=><Skeleton key={i} h={18} mb={10}/>)}</div>
            : <table>
            <thead>
              <tr>
                <th style={{minWidth:150}}>Employee</th>
                <th style={{minWidth:90}}>Dept</th>
                <th style={{minWidth:100}}>Date</th>
                <th style={{minWidth:75}}>In</th>
                <th style={{minWidth:75}}>Out</th>
                <th style={{minWidth:80}}>Work</th>
                <th style={{minWidth:70}}>Late</th>
                <th style={{minWidth:70}}>OT</th>
                <th style={{minWidth:120}}>Station</th>
                <th style={{minWidth:140}}>Methods</th>
                <th style={{minWidth:75}}>Score</th>
                <th style={{minWidth:110}}>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length===0
                ? <tr><td colSpan={12}><div className="empty">{I.File}<p>No records match your filters</p></div></td></tr>
                : rows.map(r=>(
                  <tr key={r.id}>
                    <td><span className="cell-main">{r.name}</span><span className="cell-sub">{r.employee_code||"—"}</span></td>
                    <td style={{color:"var(--t2)"}}>{r.department||"—"}</td>
                    <td><span className="cell-mono">{r.date}</span></td>
                    <td><span className="cell-mono">{fT(r.check_in)}</span></td>
                    <td><span className="cell-mono">{fT(r.check_out)}</span></td>
                    <td><span className="cell-mono">{r.work_minutes>0?fMin(r.work_minutes):"—"}</span></td>
                    <td><span className="cell-mono" style={{color:r.minutes_late>0?"var(--ab)":"var(--t2)"}}>{r.minutes_late>0?`${r.minutes_late}m`:"—"}</span></td>
                    <td><span className="cell-mono" style={{color:r.overtime_minutes>0?"var(--sk)":"var(--t2)"}}>{r.overtime_minutes>0?fMin(r.overtime_minutes):"—"}</span></td>
                    <td><span className="cell-sub">{r.check_in_device||"—"}</span></td>
                    <td style={{whiteSpace:"nowrap"}}>
                      {r.check_in_method&&<span className="badge badge-teal" style={{fontSize:9,marginRight:4}}>{r.check_in_method}</span>}
                      {r.check_out_method&&<span className="badge badge-neutral" style={{fontSize:9}}>{r.check_out_method}</span>}
                    </td>
                    <td><span className="cell-mono">{r.verification_score?Number(r.verification_score).toFixed(3):"—"}</span></td>
                    <td><span className={`badge ${attBadge(r.status)}`}>{r.status||"present"}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>}
        </div>
      </div>
    </div>
  );
}

/* ════════ AUDIT ═════════════════════════════════════════════════════════════ */
function Audit({token}) {
  const [rows,setRows]=useState([]); const [busy,setBusy]=useState(true);
  async function load(){setBusy(true); const r=await req("/api/audit-logs?limit=100",{},token); setBusy(false); if(r.ok)setRows(r.data);}
  useEffect(()=>{load();},[]);
  const tone=t=>{
    if(!t)return"badge-neutral";
    if(t.includes("check_in"))return"badge-green"; if(t.includes("check_out"))return"badge-amber";
    if(t.includes("conflict")||t.includes("delete"))return"badge-rose";
    if(t.includes("create")||t.includes("enroll"))return"badge-teal";
    if(t.includes("shift")||t.includes("workforce"))return"badge-violet";
    return"badge-neutral";
  };
  return (
    <div className="view">
      <div className="vhdr">
        <div className="vhdr-l"><div className="veyebrow">Security</div><h1 className="vtitle">Audit Trail</h1></div>
        <div className="vactions"><button className="btn btn-secondary" onClick={load}>{I.Spin} Refresh</button></div>
      </div>
      <div className="card stagger-1">
        <div className="card-hd"><div><div className="card-title">All Events</div><div className="card-desc">Tamper-evident log · last 100 events</div></div><span className="badge badge-neutral">{rows.length}</span></div>
        <div className="tscroll">
          {busy
            ? <div style={{padding:22}}>{Array.from({length:8}).map((_,i)=><Skeleton key={i} h={16} mb={9}/>)}</div>
            : <table>
            <thead><tr><th>#</th><th>Event</th><th>Summary</th><th>Target</th><th>Actor</th><th>When</th></tr></thead>
            <tbody>
              {rows.length===0
                ? <tr><td colSpan={6}><div className="empty">{I.Shield}<p>No audit events</p></div></td></tr>
                : rows.map(r=>(
                  <tr key={r.id}>
                    <td><span className="cell-mono" style={{fontSize:11}}>{r.id}</span></td>
                    <td><span className={`badge ${tone(r.event_type)}`} style={{fontSize:9}}>{r.event_type}</span></td>
                    <td><span className="cell-main" style={{fontSize:12.5}}>{r.summary}</span></td>
                    <td><span className="cell-sub">{r.target_type} #{r.target_id||"—"}</span></td>
                    <td style={{color:"var(--t2)"}}>{r.actor_name||<span style={{color:"var(--t4)"}}>System/Device</span>}</td>
                    <td><span className="cell-mono" style={{fontSize:11,whiteSpace:"nowrap"}}>{fDT(r.created_at)}</span></td>
                  </tr>
                ))
              }
            </tbody>
          </table>}
        </div>
      </div>
    </div>
  );
}

/* ════════ ROOT APP ══════════════════════════════════════════════════════════ */
export default function App() {
  const toasts = useToast();
  const [token,setToken]=useState(()=>localStorage.getItem("ams_tok")||"");
  const [user,setUser]=useState(null);
  const [view,setView]=useState("dashboard");
  const [mini,setMini]=useState(false);
  const [mOpen,setMOpen]=useState(false);
  const [loading,setLoading]=useState(false);

  const [overview,setOv]=useState(null); const [audit,setAudit]=useState([]);
  const [employees,setEmps]=useState([]); const [stSt,setStSt]=useState({fingerprint:{status:"loading"},face:{status:"loading"}});
  const [latEvt,setLatEvt]=useState(null); const [stMsg,setStMsg]=useState("");
  const [conflicts,setConf]=useState({exactDuplicates:[],recentConflicts:[]});

  const cc=conflicts.exactDuplicates?.length||0;

  // Auto-restore token
  useEffect(()=>{
    if(!token){setUser(null);return;}
    let dead=false;
    req("/api/auth/me",{},token).then(r=>{
      if(dead)return;
      if(!r.ok){localStorage.removeItem("ams_tok");setToken("");setUser(null);return;}
      setUser(r.data);
    });
    return()=>{dead=true;};
  },[token]);

  useEffect(()=>{if(user)bootLoad();},[user]);

  // 5s polling on station view
  useEffect(()=>{
    if(!user||view!=="station")return;
    const id=setInterval(()=>{loadOv();loadSt();loadConf();},5000);
    return()=>clearInterval(id);
  },[user,view]);

  async function loadOv(){
    setLoading(true);
    const r=await req("/api/dashboard/overview",{},token);
    setLoading(false);
    if(!r.ok)return;
    setOv(r.data); setAudit(r.data.recentAuditLogs||[]);
    const e=(r.data.recentAuditLogs||[]).find(x=>x.event_type?.startsWith("attendance."));
    setLatEvt(e||null);
  }
  async function loadEmps(){const r=await req("/api/employees",{},token); if(r.ok)setEmps(r.data);}
  async function loadSt(){const [f,fa]=await Promise.all([req("/api/biometrics/fingerprint/status",{},token),req("/api/biometrics/face/status",{},token)]); setStSt({fingerprint:f.data,face:fa.data});}
  async function loadConf(){const r=await req("/api/biometrics/fingerprint/conflicts",{},token); if(r.ok)setConf(r.data);}

  function bootLoad(){loadOv();loadEmps();loadSt();loadConf();}

  async function launchVerify(){
    const r=await req("/api/biometrics/fingerprint/launch-verify",{method:"POST",body:JSON.stringify({})},token);
    const m=r.data.message||"Fingerprint verification launched."; setStMsg(m); toast(m,r.ok?"info":"danger"); loadSt();loadOv();loadConf();
  }

  function doLogin(tok,usr){setToken(tok);setUser(usr);setView("dashboard");}
  function doLogout(){localStorage.removeItem("ams_tok");setToken("");setUser(null); toast("Signed out","info");}

  if(!user) return <AuthPage onLogin={doLogin}/>;

  return (
    <div className="app-shell">
      <Sidebar user={user} view={view} go={v=>setView(v)} onLogout={doLogout}
        mini={mini} toggleMini={()=>setMini(m=>!m)}
        conflictCount={cc}
        mobileOpen={mOpen} closeMobile={()=>setMOpen(false)}/>

      {/* Floating expand FAB — visible only when mini */}
      <ExpandFab mini={mini} onClick={()=>setMini(false)}/>

      <div className="workspace">
        <Header view={view} fpStatus={stSt.fingerprint} onMenu={()=>setMOpen(o=>!o)} onRefresh={bootLoad} loading={loading}/>
        {view==="dashboard" && <Dashboard overview={overview} auditRows={audit} conflictCount={cc} refresh={loadOv} loading={loading}/>}
        {view==="station"   && <Station token={token} stSt={stSt} latEvt={latEvt} conflictCount={cc} stMsg={stMsg} setStMsg={setStMsg} refresh={bootLoad} launchVerify={launchVerify} refreshSt={loadSt}/>}
        {view==="employees" && <Employees token={token} employees={employees} onRefresh={loadEmps}/>}
        {view==="workforce" && <Workforce token={token} employees={employees}/>}
        {view==="reports"   && <Reports token={token}/>}
        {view==="audit"     && <Audit token={token}/>}
      </div>

      <Toast toasts={toasts}/>
    </div>
  );
}
