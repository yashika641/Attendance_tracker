import { useEffect, useRef, useState, useCallback } from "react";

const API_BASE = "http://127.0.0.1:8000";

// ─── Helpers ────────────────────────────────────────────────────────────────

function calcDuration(punchIn, punchOut) {
  if (!punchIn || !punchOut) return null;
  const toSec = t => {
    const [h, m, s] = t.trim().split(":").map(Number);
    return h * 3600 + m * 60 + s;
  };
  const diff = toSec(punchOut) - toSec(punchIn);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 3600);
  const m = Math.floor((diff % 3600) / 60);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function formatDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function isToday(dateStr) {
  const today = new Date().toISOString().slice(0, 10);
  return dateStr === today;
}

const AVATAR_COLORS = ["avatar-purple", "avatar-cyan", "avatar-green", "avatar-amber"];
function avatarColor(str) {
  let h = 0;
  for (const c of str) h = (h * 31 + c.charCodeAt(0)) & 0xffff;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

function initials(name) {
  return name
    .split(" ")
    .map(w => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

// ─── Icons (inline SVG) ─────────────────────────────────────────────────────

const Icon = {
  camera: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  admin: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/>
      <rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/>
    </svg>
  ),
  punch: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10"/>
      <polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  chevLeft: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  chevRight: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  check: "✓",
  cross: "✕",
  eye: "👁",
  users: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
      <circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
      <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
};

// ─── Punch View ─────────────────────────────────────────────────────────────

function PunchView() {
  const videoRef = useRef(null);
  const [state, setState] = useState("idle"); // idle | processing | success | error
  const [msg, setMsg] = useState("Ready to scan");
  const [loading, setLoading] = useState(false);
  const [camReady, setCamReady] = useState(false);

  useEffect(() => {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 1280, height: 720 } })
      .then(stream => {
        videoRef.current.srcObject = stream;
        setCamReady(true);
      })
      .catch(() => {
        setState("error");
        setMsg("Camera access denied. Please allow camera permissions.");
      });
    return () => {
      if (videoRef.current?.srcObject) {
        videoRef.current.srcObject.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const captureAndAuthenticate = useCallback(async () => {
    if (!camReady) return;
    setLoading(true);
    setState("processing");
    setMsg("Analyzing face…");

    const video = videoRef.current;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    canvas.getContext("2d").drawImage(video, 0, 0);
    const imageBase64 = canvas.toDataURL("image/jpeg", 0.92);

    try {
      const res = await fetch(`${API_BASE}/authenticate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: imageBase64 }),
      });
      const data = await res.json();

      if (data.status === "success") {
        const actionLabel = {
          punch_in: "Punched In",
          punch_out: "Punched Out",
          already_marked: "Already Marked Today",
        }[data.attendance] || "Marked";
        setState("success");
        setMsg(`${data.user} — ${actionLabel}`);
      } else {
        setState("error");
        setMsg(data.message || "Face not recognized");
      }
    } catch {
      setState("error");
      setMsg("Backend not reachable. Is the server running?");
    }

    setLoading(false);
    setTimeout(() => { setState("idle"); setMsg("Ready to scan"); }, 4000);
  }, [camReady]);

  const statusConfig = {
    idle:       { icon: "○",  label: msg },
    processing: { icon: null, label: msg },
    success:    { icon: "✓",  label: msg },
    error:      { icon: "✕",  label: msg },
  };
  const cfg = statusConfig[state];

  return (
    <div className="punch-view">
      <div className="glass-card punch-card">
        <h1>Face Attendance</h1>
        <p className="subtitle">Look at the camera and click Punch In / Out</p>

        <div className="camera-wrapper">
          <div className={`camera-ring ${state === "processing" ? "scanning" : ""}`} />
          <video ref={videoRef} autoPlay playsInline muted />
          <div className="camera-overlay" />
        </div>

        <button
          className={`punch-btn ${state === "processing" ? "processing" : ""}`}
          onClick={captureAndAuthenticate}
          disabled={loading || !camReady}
        >
          {loading ? (
            <>
              <span className="spinner" />
              Scanning…
            </>
          ) : (
            <>
              {Icon.camera}
              Punch In / Out
            </>
          )}
        </button>

        <div className={`status-box ${state}`} key={msg}>
          {state === "processing" ? (
            <span className="spinner" style={{ width: 14, height: 14 }} />
          ) : (
            <span style={{ fontSize: 16 }}>{cfg.icon}</span>
          )}
          <span>{cfg.label}</span>
        </div>

        <p className="blink-hint">
          <span>{Icon.eye}</span>
          Blink once before clicking for best results
        </p>
      </div>
    </div>
  );
}

// ─── Admin View ──────────────────────────────────────────────────────────────

function AdminView() {
  const [attendanceData, setAttendanceData] = useState({});
  const [availableDates, setAvailableDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    fetch(`${API_BASE}/admin/attendance`)
      .then(r => r.json())
      .then(data => {
        const att = data.attendance || {};
        const dates = Object.keys(att).sort().reverse();
        setAttendanceData(att);
        setAvailableDates(dates);
        setSelectedDate(dates[0] || "");
        setLoading(false);
      })
      .catch(() => {
        setFetchError("Could not load data. Make sure the backend is running.");
        setLoading(false);
      });
  }, []);

  const dateIndex = availableDates.indexOf(selectedDate);
  const goNext = () => setSelectedDate(availableDates[dateIndex - 1]);
  const goPrev = () => setSelectedDate(availableDates[dateIndex + 1]);

  const records = (attendanceData[selectedDate]?.records) || [];
  const total = records.length;
  const punchedOut = records.filter(r => r.punch_out?.trim()).length;
  const stillIn = total - punchedOut;

  if (loading) {
    return (
      <div className="admin-view" style={{ display: "flex", justifyContent: "center", paddingTop: 80 }}>
        <div style={{ textAlign: "center", color: "var(--text-muted)" }}>
          <span className="spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
          <p style={{ marginTop: 16 }}>Loading attendance data…</p>
        </div>
      </div>
    );
  }

  if (fetchError) {
    return (
      <div className="admin-view">
        <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--red)" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>⚠</div>
          <p>{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-view fade-in">
      <div className="admin-header">
        <h1>Attendance Dashboard</h1>
        <p>View and analyze attendance records by date</p>
      </div>

      {/* Stats row */}
      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-label">Total Dates</div>
          <div className="stat-value stat-purple">{availableDates.length}</div>
          <div className="stat-sub">recorded sessions</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Present</div>
          <div className="stat-value stat-cyan">{total}</div>
          <div className="stat-sub">on {selectedDate || "—"}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Punched Out</div>
          <div className="stat-value stat-green">{punchedOut}</div>
          <div className="stat-sub">completed day</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Still In Office</div>
          <div className="stat-value stat-amber">{stillIn}</div>
          <div className="stat-sub">not punched out</div>
        </div>
      </div>

      {/* Date controls */}
      <div className="admin-controls">
        <span className="date-select-label">Select Date:</span>

        <button
          className="date-nav-btn"
          onClick={goPrev}
          disabled={dateIndex >= availableDates.length - 1}
          title="Previous date"
        >
          {Icon.chevLeft} Prev
        </button>

        <select
          className="date-select"
          value={selectedDate}
          onChange={e => setSelectedDate(e.target.value)}
        >
          {availableDates.length === 0 && (
            <option value="">No dates available</option>
          )}
          {availableDates.map(d => (
            <option key={d} value={d}>
              {d}{isToday(d) ? " (Today)" : ""}
            </option>
          ))}
        </select>

        <button
          className="date-nav-btn"
          onClick={goNext}
          disabled={dateIndex <= 0}
          title="Next date"
        >
          Next {Icon.chevRight}
        </button>

        {selectedDate && isToday(selectedDate) && (
          <span className="today-badge">Today</span>
        )}

        {selectedDate && (
          <span style={{ color: "var(--text-muted)", fontSize: 13 }}>
            {formatDate(selectedDate)}
          </span>
        )}
      </div>

      {/* Table */}
      <div className="table-wrapper">
        <div className="table-header-bar">
          <h3>Attendance Records</h3>
          <span>{total} {total === 1 ? "employee" : "employees"}</span>
        </div>

        {records.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">📋</div>
            <p>No records found for this date</p>
          </div>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Punch In</th>
                <th>Punch Out</th>
                <th>Duration</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {records.map((row, i) => {
                const duration = calcDuration(row.punch_in, row.punch_out);
                const hasOut = !!row.punch_out?.trim();
                const color = avatarColor(row.employee_id || row.name || String(i));

                return (
                  <tr key={i}>
                    <td>
                      <div className="employee-cell">
                        <div className={`avatar ${color}`}>
                          {initials(row.name || row.employee_id || "?")}
                        </div>
                        <div>
                          <div className="employee-name">{row.name || "—"}</div>
                          <div className="employee-id">{row.employee_id || "—"}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      {row.punch_in?.trim() ? (
                        <span className="time-chip punch-in">
                          ↑ {row.punch_in.trim()}
                        </span>
                      ) : (
                        <span className="time-chip missing">—</span>
                      )}
                    </td>
                    <td>
                      {hasOut ? (
                        <span className="time-chip punch-out">
                          ↓ {row.punch_out.trim()}
                        </span>
                      ) : (
                        <span className="time-chip missing">—</span>
                      )}
                    </td>
                    <td>
                      {duration ? (
                        <span className="duration-text">{duration}</span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: 13 }}>—</span>
                      )}
                    </td>
                    <td>
                      {hasOut ? (
                        <span className="badge badge-out">
                          <span className="badge-dot" />
                          Completed
                        </span>
                      ) : (
                        <span className="badge badge-in">
                          <span className="badge-dot pulsing" />
                          In Office
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState("punch");

  return (
    <div className="app-bg">
      {/* Navbar */}
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="dot" />
          AttendAI
        </div>

        <div className="nav-tabs">
          <button
            className={`nav-tab ${view === "punch" ? "active" : ""}`}
            onClick={() => setView("punch")}
          >
            {Icon.punch}
            Punch In/Out
          </button>
          <button
            className={`nav-tab ${view === "admin" ? "active" : ""}`}
            onClick={() => setView("admin")}
          >
            {Icon.admin}
            Admin View
          </button>
        </div>

        <div style={{ fontSize: 13, color: "var(--text-muted)" }}>
          {new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
        </div>
      </nav>

      {/* Views */}
      {view === "punch" ? <PunchView /> : <AdminView />}
    </div>
  );
}
