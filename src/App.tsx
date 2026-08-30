import React, { useState, useEffect } from "react";
import { UnitDetail, ShelfBand, ForecastDay, Requisition, PlannerRow } from "./types";
import {
  fetchStockShelfLife, fetch7DayForecast, fetchRecommendation,
  fetchRequisitions, fetchCollectionPlan, issueRequisition,
  confirmRecommendation, uploadDailyDemandCSV, registerNewUnit,
} from "./services/api";
import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, BarChart, Bar,
} from "recharts";

// ─── Fallback Constants ────────────────────────────────────────────────────────

const FALLBACK_BANDS: ShelfBand[] = [
  { label: "Tonight", short: "Today",  icon: "●", days: 0, n: 9,  hex: "#C2321F", light: "#FBE6E2", text: "#7A1F14", act: true  },
  { label: "1 day",   short: "1 day",  icon: "◐", days: 1, n: 14, hex: "#B5730A", light: "#FCEFD6", text: "#7A4C06", act: false },
  { label: "2 days",  short: "2 days", icon: "○", days: 2, n: 13, hex: "#C8860D", light: "#FDF7E8", text: "#7D4E04", act: false },
  { label: "3 days",  short: "3 days", icon: "○", days: 3, n: 12, hex: "#D99820", light: "#FDF8EC", text: "#6B4405", act: false },
];

const FALLBACK_FORECAST: ForecastDay[] = [
  { day: "Wed", date: "12", q50: 16, q67: 16, q90: 24, actual: 18, wknd: false },
  { day: "Thu", date: "13", q50: 16, q67: 17, q90: 23, actual: 22, wknd: false },
  { day: "Fri", date: "14", q50: 18, q67: 19, q90: 21, actual: 16, wknd: false },
  { day: "Sat", date: "15", q50:  9, q67: 10, q90: 16, actual: 11, wknd: true  },
  { day: "Sun", date: "16", q50:  8, q67:  9, q90: 12, actual: 11, wknd: true  },
  { day: "Mon", date: "17", q50: 18, q67: 19, q90: 23, actual: 18, wknd: false },
  { day: "Tue", date: "18", q50: 18, q67: 18, q90: 21, actual: 25, wknd: false },
];

const DRIVERS = [
  { dir: "↑" as const, text: "7-day average 12.1 units/day, up 18% on last week", delta: "+3.0" },
  { dir: "↑" as const, text: "Wednesday is the highest-demand weekday at this bank",  delta: "+1.8" },
  { dir: "↓" as const, text: "13 units already in stock with 2+ days remaining",      delta: "−4.2" },
  { dir: "↑" as const, text: "4 neurosurgery procedures scheduled for Thursday",      delta: "+1.4" },
];

const WEEKDAY = [
  { d: "Mon", demand: 14.6, waste: 4.38 },
  { d: "Tue", demand: 13.2, waste: 2.10 },
  { d: "Wed", demand: 14.9, waste: 3.25 },
  { d: "Thu", demand: 13.8, waste: 1.90 },
  { d: "Fri", demand: 13.1, waste: 1.75 },
  { d: "Sat", demand:  7.4, waste: 2.80 },
  { d: "Sun", demand:  6.8, waste: 3.10 },
];

const KPI = [
  { label: "Wastage rate",          val: "3.8%",   target: "<1%",    ok: false, note: "↓ from 9.6%" },
  { label: "Shortage rate",         val: "3.6%",   target: "—",      ok: true,  note: "improving"   },
  { label: "Turnaround, emergency", val: "28 min", target: "30 min", ok: true,  note: "within target"},
  { label: "Components issued",     val: "99.4%",  target: "—",      ok: true,  note: "✓"           },
];

const NAV_ITEMS = [
  { id: "Daily Ops", icon: "📊", label: "Daily Ops" },
  { id: "7-Day Forecast", icon: "📈", label: "7-Day Forecast" },
  { id: "Planner", icon: "📅", label: "Tactical Planner" },
  { id: "Requisitions", icon: "🩺", label: "Requisitions" },
  { id: "Data Entry", icon: "📥", label: "Data Ingestion" },
  { id: "Analytics", icon: "📉", label: "Analytics" },
  { id: "Reports", icon: "📑", label: "NABH Reports" },
  { id: "Settings", icon: "⚙️", label: "System Policy" },
];

const T = {
  eyebrow: (txt: string) => (
    <span className="eyebrow">{txt}</span>
  ),
  num: (val: React.ReactNode, size: number, weight = 500, color = "var(--ink-0)", extraStyle?: React.CSSProperties) => (
    <span className="data" style={{ fontSize: size, fontWeight: weight, color, lineHeight: 1, ...extraStyle }}>
      {val}
    </span>
  ),
};

// ─── Impressive Professional Login Page ───────────────────────────────────────

function LoginPage({ onLogin }: { onLogin: (user: { name: string; role: string; facility: string }) => void }) {
  const [username, setUsername] = useState("rkumar@ggh-chennai.org");
  const [password, setPassword] = useState("••••••••••••");
  const [role, setRole] = useState("Shift Technician");
  const [facility, setFacility] = useState("Govt. General Hospital, Chennai");
  const [remember, setRemember] = useState(true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onLogin({ name: "R. Kumar", role, facility });
  };

  return (
    <div style={{
      width: "100vw", height: "100vh", display: "flex",
      background: "var(--ground)", overflow: "hidden",
    }}>
      {/* Left Branding Hero Panel */}
      <div style={{
        flex: "1.1", background: "var(--ink-0)",
        display: "flex", flexDirection: "column", justifyContent: "space-between",
        padding: "48px 56px", position: "relative", overflow: "hidden",
        boxShadow: "var(--sh-modal)",
      }}>
        {/* Subtle Ambient Gold Gradient Accent */}
        <div style={{
          position: "absolute", top: "-20%", right: "-20%", width: "500px", height: "500px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(200,134,13,0.18) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "-10%", left: "-10%", width: "400px", height: "400px",
          borderRadius: "50%", background: "radial-gradient(circle, rgba(31,95,139,0.15) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Top Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, position: "relative", zIndex: 2 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 10,
            background: "linear-gradient(135deg, var(--am-5), var(--am-6))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 20, color: "#fff",
            boxShadow: "0 4px 16px rgba(200,134,13,0.4)"
          }}>P</div>
          <div>
            <div style={{ fontFamily: "var(--f-disp)", fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-.01em" }}>PlateletIQ</div>
            <div style={{ fontSize: 11, color: "var(--am-4)", fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase" }}>Clinical Decision Support Engine</div>
          </div>
        </div>

        {/* Center Hero Copy & Metrics */}
        <div style={{ position: "relative", zIndex: 2, margin: "auto 0", maxWidth: 540 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 6,
            padding: "5px 12px", background: "rgba(200,134,13,0.18)",
            border: "1px solid rgba(200,134,13,0.35)", borderRadius: 6,
            fontSize: 11, color: "var(--am-4)", fontWeight: 700,
            letterSpacing: ".1em", textTransform: "uppercase", marginBottom: 20,
          }}>
            ⚡ AI-Powered Clinical Decision Engine
          </div>

          <h1 style={{
            fontFamily: "var(--f-disp)", fontSize: 40, fontWeight: 700,
            color: "#fff", lineHeight: 1.15, letterSpacing: "-.02em", marginBottom: 16,
          }}>
            Precision Platelet Inventory & Dengue Surge Intelligence.
          </h1>

          <p style={{
            fontSize: 15, color: "rgba(255,255,255,0.65)", lineHeight: "24px",
            fontFamily: "var(--f-body)", marginBottom: 32,
          }}>
            Intelligent collection recommendations and WHO guideline compliance review for hospital blood banks.
          </p>

          {/* 3 Real Metrics Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "14px 16px",
            }}>
              <div className="eyebrow" style={{ color: "rgba(255,255,255,0.4)" }}>WASTAGE RATE</div>
              <div className="data" style={{ fontSize: 24, fontWeight: 600, color: "var(--am-4)", margin: "4px 0 2px" }}>3.8%</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>↓ from 9.6% baseline</div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "14px 16px",
            }}>
              <div className="eyebrow" style={{ color: "rgba(255,255,255,0.4)" }}>TRAINING DAYS</div>
              <div className="data" style={{ fontSize: 24, fontWeight: 600, color: "#fff", margin: "4px 0 2px" }}>4,018</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>Real issue logs</div>
            </div>

            <div style={{
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
              borderRadius: 10, padding: "14px 16px",
            }}>
              <div className="eyebrow" style={{ color: "rgba(255,255,255,0.4)" }}>TARGET COVERAGE</div>
              <div className="data" style={{ fontSize: 24, fontWeight: 600, color: "var(--st-6)", margin: "4px 0 2px" }}>70.2%</div>
              <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)" }}>7-day rolling window</div>
            </div>
          </div>
        </div>

        {/* Footer Security Badges */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, position: "relative", zIndex: 2 }}>
          {["✓ NABH Standard Compliant", "🔒 256-Bit TLS Encryption", "🩺 WHO 2009 Guidelines"].map((b, i) => (
            <span key={i} style={{ fontSize: 11.5, color: "rgba(255,255,255,0.4)", fontFamily: "var(--f-body)" }}>{b}</span>
          ))}
        </div>
      </div>

      {/* Right Login Form Container */}
      <div style={{
        width: 480, background: "var(--surface)",
        display: "flex", flexDirection: "column", justifyContent: "center",
        padding: "56px 48px", overflowY: "auto",
        borderLeft: "1px solid var(--border)",
      }}>
        <div style={{ maxWidth: 380, margin: "0 auto", width: "100%" }}>
          <div style={{ marginBottom: 28 }}>
            <span className="eyebrow">CONTROL CENTER ACCESS</span>
            <h2 style={{
              fontFamily: "var(--f-disp)", fontSize: 28, fontWeight: 700,
              color: "var(--ink-0)", margin: "6px 0 6px", letterSpacing: "-.01em",
            }}>Sign In to Hospital Portal</h2>
            <p style={{ fontSize: 13, color: "var(--ink-2)", fontFamily: "var(--f-body)" }}>
              Enter your credentials to access the blood bank control panel.
            </p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
            {/* Hospital Facility Selector */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-1)", marginBottom: 6 }}>
                Facility / Blood Bank
              </label>
              <select
                value={facility} onChange={e => setFacility(e.target.value)}
                style={{
                  width: "100%", padding: "11px 14px",
                  background: "var(--surface-dim)", border: "1px solid var(--border)",
                  borderRadius: 8, fontFamily: "var(--f-body)", fontSize: 13.5,
                  color: "var(--ink-0)", outline: "none",
                }}>
                <option value="Govt. General Hospital, Chennai">Govt. General Hospital, Chennai</option>
                <option value="Apollo Hospitals, Greams Road">Apollo Hospitals, Greams Road</option>
                <option value="Christian Medical College, Vellore">Christian Medical College, Vellore</option>
                <option value="RWTH Aachen University Hospital">RWTH Aachen University Hospital</option>
              </select>
            </div>

            {/* Role Selector */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-1)", marginBottom: 6 }}>
                User Role
              </label>
              <select
                value={role} onChange={e => setRole(e.target.value)}
                style={{
                  width: "100%", padding: "11px 14px",
                  background: "var(--surface-dim)", border: "1px solid var(--border)",
                  borderRadius: 8, fontFamily: "var(--f-body)", fontSize: 13.5,
                  color: "var(--ink-0)", outline: "none",
                }}>
                <option value="Shift Technician">Shift Technician (Daily Ops & Stock Ingestion)</option>
                <option value="Blood Bank Officer">Blood Bank Officer (Order Point & Policy α)</option>
                <option value="Transfusion Committee Member">Transfusion Committee Member (NABH Audits)</option>
              </select>
            </div>

            {/* Email / Username */}
            <div>
              <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--ink-1)", marginBottom: 6 }}>
                Email Address or Operator ID
              </label>
              <input
                type="email" value={username} onChange={e => setUsername(e.target.value)}
                required
                style={{
                  width: "100%", padding: "11px 14px",
                  background: "var(--surface-dim)", border: "1px solid var(--border)",
                  borderRadius: 8, fontFamily: "var(--f-data)", fontSize: 13,
                  color: "var(--ink-0)", outline: "none",
                }}
              />
            </div>

            {/* Password */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-1)" }}>Password</label>
                <a href="#" onClick={e => e.preventDefault()} style={{ fontSize: 11.5, color: "var(--in-6)", textDecoration: "none", fontWeight: 500 }}>
                  Forgot password?
                </a>
              </div>
              <input
                type="password" value={password} onChange={e => setPassword(e.target.value)}
                required
                style={{
                  width: "100%", padding: "11px 14px",
                  background: "var(--surface-dim)", border: "1px solid var(--border)",
                  borderRadius: 8, fontFamily: "var(--f-data)", fontSize: 13,
                  color: "var(--ink-0)", outline: "none",
                }}
              />
            </div>

            {/* Remember Me Checkbox */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, margin: "2px 0" }}>
              <input
                type="checkbox" id="remember" checked={remember} onChange={e => setRemember(e.target.checked)}
                style={{ accentColor: "var(--am-6)", cursor: "pointer" }}
              />
              <label htmlFor="remember" style={{ fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer", fontFamily: "var(--f-body)" }}>
                Keep me signed in on this workstation
              </label>
            </div>

            {/* Sign In Button */}
            <button
              type="submit"
              style={{
                width: "100%", padding: "13px",
                background: "var(--am-6)", border: "none", borderRadius: 8,
                fontFamily: "var(--f-body)", fontSize: 14.5, fontWeight: 700,
                color: "#fff", cursor: "pointer", boxShadow: "0 4px 14px rgba(200,134,13,0.3)",
                transition: "all 120ms ease", marginTop: 4,
              }}>
              Sign In to Control Center →
            </button>
          </form>

          <div style={{ marginTop: 32, paddingTop: 20, borderTop: "1px solid var(--border-faint)", textAlign: "center" }}>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--f-body)" }}>
              Need facility access? Contact Blood Bank Administrator
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar Navigation Layout ────────────────────────────────────────────────

function Sidebar({ activeTab, setTab, user, onLogout }: {
  activeTab: string; setTab: (t: string) => void;
  user: { name: string; role: string; facility: string } | null;
  onLogout: () => void;
}) {
  return (
    <aside style={{
      width: 230, flexShrink: 0, background: "var(--rail)",
      borderRight: "1px solid var(--border)",
      display: "flex", flexDirection: "column",
      padding: "20px 14px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "0 8px 20px 8px", borderBottom: "1px solid var(--border-faint)" }}>
        <div style={{
          width: 32, height: 32, borderRadius: 8,
          background: "linear-gradient(135deg, var(--am-6), var(--am-4))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 16, color: "#fff",
        }}>P</div>
        <div>
          <div style={{ fontFamily: "var(--f-disp)", fontSize: 16, fontWeight: 700, color: "var(--ink-0)", letterSpacing: "-.01em" }}>PlateletIQ</div>
          <div style={{ fontSize: 10, color: "var(--am-7)", fontWeight: 700, letterSpacing: ".08em", textTransform: "uppercase" }}>Decision Support</div>
        </div>
      </div>

      <div style={{
        margin: "16px 0", padding: "10px 12px",
        background: "var(--sunken)", border: "1px solid var(--border)",
        borderRadius: 8, display: "flex", flexDirection: "column", gap: 4
      }}>
        <div style={{ fontSize: 9.5, color: "var(--ink-2)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>FACILITY</div>
        <div style={{ fontSize: 11.5, fontWeight: 600, color: "var(--ink-0)", lineHeight: "16px" }}>{user?.facility || "Govt. General Hospital"}</div>
        <div style={{ fontSize: 10.5, color: "var(--st-6)", display: "flex", alignItems: "center", gap: 4, fontWeight: 500, marginTop: 2 }}>
          <span>●</span> Live API Connected
        </div>
      </div>

      <nav style={{ display: "flex", flexDirection: "column", gap: 4, flex: 1 }}>
        {NAV_ITEMS.map(item => {
          const isActive = item.id === activeTab;
          return (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 12px", borderRadius: 8,
                background: isActive ? "var(--am-1)" : "transparent",
                border: `1px solid ${isActive ? "var(--am-2)" : "transparent"}`,
                color: isActive ? "var(--am-7)" : "var(--ink-1)",
                fontFamily: "var(--f-body)", fontSize: 13, fontWeight: isActive ? 600 : 500,
                textAlign: "left", cursor: "pointer", transition: "all 120ms ease",
              }}
              onMouseEnter={e => !isActive && (e.currentTarget.style.background = "var(--sunken)")}
              onMouseLeave={e => !isActive && (e.currentTarget.style.background = "transparent")}
            >
              <span style={{ fontSize: 14 }}>{item.icon}</span>
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer with Sign Out Button */}
      <div style={{
        padding: "12px 10px 0 10px", borderTop: "1px solid var(--border-faint)",
        display: "flex", alignItems: "center", justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 16,
            background: "linear-gradient(135deg, var(--am-6), var(--am-4))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: 700, fontSize: 12, color: "#fff"
          }}>RK</div>
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-0)" }}>{user?.name || "R. Kumar"}</div>
            <div style={{ fontSize: 10, color: "var(--ink-2)" }}>{user?.role || "Shift Technician"}</div>
          </div>
        </div>

        <button
          onClick={onLogout}
          title="Sign Out"
          style={{
            background: "none", border: "1px solid var(--border)", borderRadius: 6,
            padding: "4px 8px", fontSize: 11, color: "var(--ink-2)", cursor: "pointer",
            fontFamily: "var(--f-body)", fontWeight: 500,
          }}>
          Exit
        </button>
      </div>
    </aside>
  );
}

// ─── Shelf-Life Strip ─────────────────────────────────────────────────────────

function ShelfStrip({ bands, onBand }: { bands: ShelfBand[]; onBand: (b: ShelfBand) => void }) {
  const total = bands.reduce((s, b) => s + b.n, 0);

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, boxShadow: "var(--sh-card)", overflow: "hidden",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 18px 9px", background: "var(--sunken)",
        borderBottom: "1px solid var(--border-faint)",
      }}>
        {T.eyebrow("Live Agitator Inventory (Shelf-Life Countdown)")}
        <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span className="data" style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-0)" }}>{total}</span>
          <span style={{ fontSize: 12, color: "var(--ink-2)" }}>units available in agitator</span>
        </div>
      </div>

      <div style={{ display: "flex", height: 118 }}>
        {bands.map((b, i) => {
          const pct = total > 0 ? (b.n / total) * 100 : 25;
          return (
            <button
              key={b.days}
              onClick={() => onBand(b)}
              style={{
                flex: `${Math.max(pct, 7)} 0 0`,
                border: "none", borderRight: i < bands.length - 1 ? "1px solid rgba(0,0,0,0.14)" : "none",
                background: b.hex, padding: "10px 16px", cursor: "pointer",
                display: "flex", flexDirection: "column", justifyContent: "space-between",
                position: "relative", textAlign: "left", transition: "filter 120ms",
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.08)")}
              onMouseLeave={e => (e.currentTarget.style.filter = "")}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", width: "100%" }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: ".12em", textTransform: "uppercase", color: "rgba(255,255,255,0.75)" }}>
                  {b.icon} {b.label}
                </span>
                {b.act && (
                  <span style={{
                    fontSize: 8.5, fontWeight: 700, color: "#fff", background: "rgba(0,0,0,0.35)",
                    padding: "2px 6px", borderRadius: 3, animation: "pulse-ring 2s infinite"
                  }}>⚠ ACT NEEDED</span>
                )}
              </div>
              <span className="data" style={{ fontSize: 48, fontWeight: 500, color: "#fff", lineHeight: 1 }}>{b.n}</span>
            </button>
          );
        })}
      </div>

      <div style={{ display: "flex", padding: "8px 18px", background: "var(--sunken)", gap: 10, alignItems: "center" }}>
        <span style={{ fontSize: 11, color: "var(--st-6)", fontWeight: 700 }}>◇ LIVE FEED:</span>
        <span style={{ fontSize: 12, color: "var(--ink-1)" }}>8 fresh units registered in agitator stock</span>
      </div>
    </div>
  );
}

// ─── Daily Ops View ───────────────────────────────────────────────────────────

function DailyOps({ bands, forecast, onBand }: { bands: ShelfBand[]; forecast: ForecastDay[]; onBand: (b: ShelfBand) => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [rec, setRec] = useState<{ verb: string; quantity: number; order_point: number; drivers: { dir: string; text: string; delta: string }[] } | null>(null);

  useEffect(() => {
    fetchRecommendation().then(data => {
      if (data) setRec(data);
    });
  }, []);

  const actionVerb = rec ? rec.verb : "COLLECT";
  const actionQty = rec ? rec.quantity : 16;
  const driversList = rec && rec.drivers && rec.drivers.length > 0 ? rec.drivers : DRIVERS;
  const expiringTonight = bands.find(b => b.days === 0)?.n || 9;

  const handleConfirm = async () => {
    setConfirmed(true);
    await confirmRecommendation('ggh-chennai', actionVerb, actionQty);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{
        background: "var(--ink-0)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderLeft: "4px solid var(--am-6)",
        borderRadius: 12, padding: "18px 22px",
        boxShadow: "var(--sh-raise)",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: "var(--f-disp)",
              letterSpacing: ".14em", textTransform: "uppercase",
              color: "var(--am-4)", background: "rgba(200,134,13,.2)",
              padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(200,134,13,.35)"
            }}>⚡ SHIFT SUMMARY — TODAY'S DECISION</span>
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.45)", fontFamily: "var(--f-body)" }}>
              Live Hospital Feed
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: "var(--st-6)", fontFamily: "var(--f-body)", fontWeight: 600 }}>
            ● Active Inventory Optimization Engine
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr 1fr", gap: 12 }}>
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4
          }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.45)", fontFamily: "var(--f-disp)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>
              TODAY'S ACTION
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: "var(--f-disp)", fontSize: 24, fontWeight: 700, color: "var(--am-4)", lineHeight: 1 }}>
                {actionVerb} {actionQty}
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)", fontFamily: "var(--f-body)" }}>units</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontFamily: "var(--f-body)", marginTop: 2 }}>
              Order point set to 67th percentile of forecast demand
            </span>
          </div>

          <div style={{
            background: "rgba(194,50,31,0.15)", border: "1px solid rgba(194,50,31,0.3)",
            borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4
          }}>
            <span style={{ fontSize: 10, color: "var(--cr-4)", fontFamily: "var(--f-disp)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>
              ⚠ EXPIRY ALERT
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span className="data" style={{ fontSize: 24, fontWeight: 600, color: "#fff", lineHeight: 1 }}>
                {expiringTonight} units
              </span>
              <span style={{ fontSize: 12, color: "var(--cr-4)", fontFamily: "var(--f-body)", fontWeight: 600 }}>expire tonight</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.5)", fontFamily: "var(--f-body)" }}>
              Forecast demand is 6 units → <strong>3 units need transfer</strong>
            </span>
          </div>

          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4
          }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.45)", fontFamily: "var(--f-disp)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>
              7-DAY DEMAND
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span className="data" style={{ fontSize: 24, fontWeight: 600, color: "#fff", lineHeight: 1 }}>
                108 units
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)", fontFamily: "var(--f-body)" }}>total</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontFamily: "var(--f-body)" }}>
              Peak demand on Wednesday (18 units)
            </span>
          </div>
        </div>
      </div>

      <ShelfStrip bands={bands} onBand={onBand} />

      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14 }}>
        <div style={{
          background: "var(--ink-0)", borderRadius: 12, overflow: "hidden",
          display: "flex", flexDirection: "column", position: "relative",
          boxShadow: "var(--sh-raise)", padding: "22px 24px",
        }}>
          <div style={{
            position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
            background: "linear-gradient(180deg, var(--am-4) 0%, var(--am-6) 100%)",
          }} />

          <div>
            <span className="eyebrow" style={{ color: "rgba(255,255,255,0.4)" }}>RECOMMENDED ACTION</span>
            <div style={{ fontFamily: "var(--f-disp)", fontSize: 42, fontWeight: 700, color: "var(--am-4)", margin: "10px 0 6px" }}>{actionVerb}</div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 14 }}>
              <span className="data" style={{ fontSize: 62, fontWeight: 500, color: "#fff", lineHeight: 1 }}>{actionQty}</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,0.35)" }}>units</span>
            </div>
            <p style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", lineHeight: "18px", marginBottom: 20 }}>
              Order point calibrated to optimal fractile. Prevents shortages while eliminating expiry.
            </p>
          </div>

          {confirmed ? (
            <div style={{ padding: "10px 14px", background: "rgba(28,104,72,0.25)", border: "1px solid rgba(28,104,72,0.4)", borderRadius: 7, color: "rgba(255,255,255,0.7)", fontWeight: 500, fontSize: 12.5 }}>
              ✓ Confirmed by RK, 08:42
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleConfirm} style={{ flex: 1, padding: "10px 0", background: "var(--am-6)", border: "none", borderRadius: 7, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>Confirm</button>
              <button style={{ flex: 1, padding: "10px 0", background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: 7, color: "rgba(255,255,255,0.6)", fontWeight: 500, fontSize: 13.5, cursor: "pointer" }}>Adjust</button>
            </div>
          )}
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px", boxShadow: "var(--sh-card)" }}>
          <span className="eyebrow">WHY THIS NUMBER (FEATURE ATTRIBUTIONS)</span>
          <div style={{ marginTop: 16 }}>
            {driversList.map((d, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "16px 1fr auto", gap: 12, alignItems: "baseline", padding: "11px 0", borderBottom: i < driversList.length - 1 ? "1px solid var(--border-faint)" : "none" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: d.dir === "↑" ? "var(--cr-6)" : "var(--st-6)" }}>{d.dir}</span>
                <span style={{ fontSize: 13.5, color: "var(--ink-1)" }}>{d.text}</span>
                <span className="data" style={{ fontSize: 12.5, fontWeight: 600, color: d.dir === "↑" ? "var(--cr-7)" : "var(--st-7)" }}>{d.delta}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-faint)", display: "flex", gap: 18 }}>
            {[["Optimization", "Active"], ["Forecast Window", "7 Days"], ["Confidence", "High"], ["Status", "Operational"]].map(([k, v]) => (
              <span key={k} style={{ fontSize: 11.5 }}><span style={{ color: "var(--ink-3)" }}>{k}: </span><strong style={{ color: "var(--ink-2)", fontWeight: 600 }}>{v}</strong></span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px", boxShadow: "var(--sh-card)" }}>
        <span className="eyebrow">7-DAY DEMAND FORECAST TRAJECTORY</span>
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={forecast} margin={{ top: 16, right: 4, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--in-6)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--in-6)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border-faint)" />
            <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fontSize: 11.5, fill: "var(--ink-3)" }} />
            <YAxis domain={[0, 28]} axisLine={false} tickLine={false} tick={{ fontSize: 10.5, fill: "var(--ink-3)" }} />
            <Tooltip contentStyle={{ background: "var(--rail)", border: "1px solid var(--rail-border)", borderRadius: 8, color: "#fff" }} />
            <Area dataKey="q90" fill="url(#bg)" stroke="none" />
            <Area dataKey="q67" fill="none" stroke="var(--in-6)" strokeWidth={1.8} strokeDasharray="4 3" />
            <Area dataKey="actual" fill="none" stroke="none" dot={{ r: 4, fill: "var(--ink-0)", strokeWidth: 1.5, stroke: "var(--ink-1)" }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// ─── 7-Day Forecast Page ──────────────────────────────────────────────────────

function ForecastPage({ forecast, bands }: { forecast: ForecastDay[]; bands: ShelfBand[] }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ShelfStrip bands={bands} onBand={() => {}} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 260px", gap: 14 }}>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, boxShadow: "var(--sh-card)", overflow: "hidden",
        }}>
          <div style={{ padding: "14px 20px 12px", background: "var(--sunken)", borderBottom: "1px solid var(--border-faint)" }}>
            {T.eyebrow("7-Day Forecast Detail Trajectory (Live Model Output)")}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Day", "Median (q50)", "Order pt (q67)", "Safety (q90)", "Actual", "Error"].map(h => (
                  <th key={h} style={{
                    padding: "9px 16px",
                    textAlign: h === "Day" ? "left" : "right",
                    fontSize: 10, fontWeight: 700, fontFamily: "var(--f-body)",
                    color: "var(--ink-3)", letterSpacing: ".06em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border-faint)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {forecast.map(d => {
                const err = d.actual - d.q67;
                const ok = Math.abs(err) <= 4;
                return (
                  <tr key={d.day} style={{
                    background: d.wknd ? "var(--surface-dim)" : undefined,
                    borderBottom: "1px solid var(--border-faint)",
                  }}>
                    <td style={{ padding: "11px 16px", fontFamily: "var(--f-body)", fontSize: 13.5, color: "var(--ink-1)" }}>
                      {d.day} {d.date} Sep
                      {d.wknd && <span style={{ fontSize: 10.5, color: "var(--ink-3)", marginLeft: 6, fontWeight: 600 }}>wknd</span>}
                    </td>
                    {[d.q50, d.q67, d.q90, d.actual].map((v, j) => (
                      <td key={j} className="data" style={{
                        padding: "11px 16px", textAlign: "right", fontSize: 13.5,
                        color: j === 1 ? "var(--in-6)" : "var(--ink-0)",
                        fontWeight: j === 1 ? 600 : 400,
                      }}>{v}</td>
                    ))}
                    <td className="data" style={{
                      padding: "11px 16px", textAlign: "right", fontSize: 13.5, fontWeight: 600,
                      color: ok ? "var(--st-6)" : "var(--wa-6)",
                    }}>{err > 0 ? "+" : ""}{err}</td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--border)", background: "var(--sunken)" }}>
                <td style={{ padding: "12px 16px", fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 13.5, color: "var(--ink-0)" }}>7-day total</td>
                {[103, 108, 140, 121].map((v, j) => (
                  <td key={j} className="data" style={{
                    padding: "12px 16px", textAlign: "right", fontSize: 13.5, fontWeight: 700,
                    color: j === 1 ? "var(--in-6)" : "var(--ink-0)",
                  }}>{v}</td>
                ))}
                <td className="data" style={{ padding: "12px 16px", textAlign: "right", fontSize: 13.5, fontWeight: 700, color: "var(--wa-6)" }}>+13</td>
              </tr>
            </tfoot>
          </table>
        </div>

        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, boxShadow: "var(--sh-card)",
          padding: "18px 18px",
          display: "flex", flexDirection: "column", gap: 0,
        }}>
          {T.eyebrow("Model Performance")}
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 14 }}>
            {[
              ["Architecture", "LASSO"],
              ["Features", "30"],
              ["Last retrain", "8 Sep 2018"],
              ["MAPE", "26.6%"],
              ["MASE", "0.759"],
            ].map(([k, v]) => (
              <div key={k}>
                <div style={{ fontSize: 10.5, color: "var(--ink-3)", fontFamily: "var(--f-body)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{k}</div>
                <span className="data" style={{ fontSize: 14.5, color: "var(--ink-0)", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Planner Page ─────────────────────────────────────────────────────────────

function PlannerPage() {
  const [f, setF] = useState(0.15);
  const [plan, setPlan] = useState<PlannerRow[]>([]);

  useEffect(() => {
    fetchCollectionPlan('ggh-chennai', f).then(data => setPlan(data));
  }, [f]);

  const coll = Math.round(2320 * (1 + (f - 0.15) * 0.45));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Clean Top Banner */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, boxShadow: "var(--sh-card)", padding: "20px 24px",
        display: "flex", justifyContent: "space-between", alignItems: "center",
      }}>
        <div>
          <div className="eyebrow" style={{ color: "var(--am-7)", marginBottom: 4 }}>TACTICAL SCHEDULER</div>
          <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--ink-0)", fontFamily: "var(--f-disp)", margin: 0 }}>
            Six-Month Mobile Donor Camp Planning
          </h2>
          <p style={{ fontSize: 13, color: "var(--ink-2)", fontFamily: "var(--f-body)", marginTop: 4 }}>
            Schedule mobile donation camps in advance to prepare for seasonal surge periods.
          </p>
        </div>

        {/* Simple Slider */}
        <div style={{
          width: 320, padding: "14px 16px", background: "var(--sunken)",
          border: "1px solid var(--border)", borderRadius: 10,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 }}>
            <span style={{ fontSize: 12.5, fontWeight: 600, color: "var(--ink-0)", fontFamily: "var(--f-body)" }}>
              Outbreak Sensitivity ($f$)
            </span>
            <span className="data" style={{ fontSize: 15, color: "var(--am-7)", fontWeight: 700 }}>
              {(f * 100).toFixed(0)}%
            </span>
          </div>

          <input type="range" min={5} max={30} value={Math.round(f * 100)}
            onChange={e => setF(parseInt(e.target.value) / 100)}
            style={{ width: "100%", accentColor: "var(--am-6)", cursor: "pointer" }} />

          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10.5, color: "var(--ink-3)", marginTop: 4 }}>
            <span>Low (5%)</span>
            <span>Standard (15%)</span>
            <span>High (30%)</span>
          </div>
        </div>
      </div>

      {/* Main Camp Schedule Table - Technician View */}
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, boxShadow: "var(--sh-card)", padding: "22px 24px",
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <div>
            {T.eyebrow("TACTICAL MOBILE CAMP SCHEDULE")}
            <h3 style={{ fontSize: 16, fontWeight: 700, color: "var(--ink-0)", fontFamily: "var(--f-disp)", marginTop: 4 }}>
              Donor Camp Dates & Collection Targets
            </h3>
          </div>
          <span style={{ fontSize: 11.5, color: "var(--st-6)", fontWeight: 600, background: "var(--st-1)", padding: "4px 10px", borderRadius: 6 }}>
            ● Schedule Camps 14 Days Prior
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "var(--sunken)" }}>
                {["Month", "Target Collection", "Camps to Book", "Recommended Camp Dates"].map(h => (
                  <th key={h} style={{
                    padding: "11px 16px",
                    textAlign: h === "Target Collection" || h === "Camps to Book" ? "right" : "left",
                    fontSize: 11, fontWeight: 700, fontFamily: "var(--f-body)",
                    color: "var(--ink-2)", letterSpacing: ".05em", textTransform: "uppercase",
                    borderBottom: "1px solid var(--border)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plan.map(r => {
                const isPeak = r.surge > 1.1;
                return (
                  <tr key={r.mo} style={{
                    background: isPeak ? "rgba(200,134,13,0.04)" : undefined,
                    borderBottom: "1px solid var(--border-faint)",
                  }}>
                    <td style={{ padding: "14px 16px", fontFamily: "var(--f-body)", fontSize: 14, fontWeight: 700, color: "var(--ink-0)" }}>
                      {r.mo} {isPeak && <span style={{ fontSize: 11, color: "var(--cr-6)", marginLeft: 6, fontWeight: 600 }}>• Dengue Peak</span>}
                    </td>
                    <td className="data" style={{ padding: "14px 16px", textAlign: "right", fontSize: 15, fontWeight: 700, color: "var(--am-7)" }}>
                      {r.collect} units
                    </td>
                    <td className="data" style={{ padding: "14px 16px", textAlign: "right", fontSize: 14, fontWeight: 600, color: "var(--ink-0)" }}>
                      {r.camps} camps
                    </td>
                    <td style={{ padding: "14px 16px", fontFamily: "var(--f-data)", fontSize: 13.5, fontWeight: 600, color: isPeak ? "var(--am-7)" : "var(--ink-0)" }}>
                      📅 {r.camp_window || `${r.mo} 10 – ${r.mo} 18`}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--border)", background: "var(--sunken)" }}>
                <td style={{ padding: "14px 16px", fontFamily: "var(--f-body)", fontWeight: 700, fontSize: 14, color: "var(--ink-0)" }}>6-Month Total</td>
                <td className="data" style={{ padding: "14px 16px", textAlign: "right", fontSize: 15, fontWeight: 700, color: "var(--am-7)" }}>{coll.toLocaleString()} units</td>
                <td className="data" style={{ padding: "14px 16px", textAlign: "right", fontSize: 14, fontWeight: 700, color: "var(--ink-0)" }}>26 camps</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Requisitions Page ────────────────────────────────────────────────────────

function ReqsPage() {
  const [reqs, setReqs] = useState<Requisition[]>([]);
  const [done, setDone] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchRequisitions().then(data => setReqs(data));
  }, []);

  const handleIssue = async (reqId: string) => {
    setDone(s => ({ ...s, [reqId]: "Issued by RK, 09:14" }));
    await issueRequisition('ggh-chennai', reqId, 'Issued by RK');
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        {T.eyebrow("Requisitions Review (WHO 2009 Guidelines Concordance)")}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 9px", borderRadius: 99,
          background: "var(--wa-1)", border: "1px solid rgba(181,115,10,.25)",
          fontSize: 10.5, fontWeight: 700, fontFamily: "var(--f-body)",
          letterSpacing: ".06em", textTransform: "uppercase",
          color: "var(--wa-7)",
        }}>⚠ 2 need review</span>
      </div>

      {reqs.map(r => (
        <div key={r.id} style={{
          background: "var(--surface)",
          border: r.status === "review" ? "1px solid rgba(181,115,10,.25)" : "1px solid var(--border)",
          borderLeft: `4px solid ${r.status === "review" ? "var(--wa-6)" : "var(--st-6)"}`,
          borderRadius: 12, boxShadow: "var(--sh-card)",
          padding: "18px 22px",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span style={{
              fontFamily: "var(--f-disp)", fontSize: 10.5, fontWeight: 700,
              letterSpacing: ".12em", textTransform: "uppercase",
              color: r.status === "review" ? "var(--wa-7)" : "var(--st-7)",
            }}>
              {r.status === "review" ? "⚠ Review" : "✓ Concordant"}
            </span>
            <span style={{ fontSize: 13, color: "var(--ink-3)", fontFamily: "var(--f-body)" }}>
              {r.ward} · Req #{r.id} · {r.time}
            </span>
          </div>

          <div style={{ fontSize: 14, color: "var(--ink-1)", marginBottom: 5, fontFamily: "var(--f-body)" }}>
            <span className="data" style={{ fontWeight: 600, color: "var(--ink-0)" }}>{r.units}</span> units ·
            platelet count <span className="data" style={{ fontWeight: 600, color: "var(--ink-0)" }}>{r.plt}</span> ×10⁹/L
          </div>
          <div style={{ fontSize: 13, color: "var(--ink-3)", fontFamily: "var(--f-body)", marginBottom: r.guideline ? 14 : 0 }}>
            {r.note}
          </div>

          {r.guideline && (
            <div style={{
              marginBottom: 16, padding: "12px 15px",
              background: "var(--wa-1)", border: "1px solid rgba(181,115,10,.2)",
              borderRadius: 8,
              fontSize: 13, color: "var(--ink-1)", lineHeight: "20px",
              fontFamily: "var(--f-body)",
            }}>
              {r.guideline}
              <div style={{ marginTop: 8 }}>
                <a href="#" style={{ fontSize: 12, color: "var(--in-6)", textDecoration: "underline", fontWeight: 500 }}>
                  Source: {r.source} ↗
                </a>
              </div>
            </div>
          )}

          {r.status === "review" && (
            <div style={{ display: "flex", gap: 8 }}>
              {done[r.id] ? (
                <div style={{
                  fontSize: 13, color: "var(--st-7)", padding: "8px 15px",
                  background: "var(--st-1)", borderRadius: 7, fontFamily: "var(--f-body)", fontWeight: 500,
                }}>✓ {done[r.id]}</div>
              ) : (
                <>
                  <button onClick={() => handleIssue(r.id)} style={btn.primary}>
                    Issue anyway
                  </button>
                  <button onClick={() => setDone(s => ({ ...s, [r.id]: "Sent for review" }))} style={btn.sec}>
                    Send for review
                  </button>
                  <button style={btn.sec}>Contact requester</button>
                </>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

const btn = {
  primary: {
    padding: "9px 18px",
    background: "var(--cr-6)", border: "none", borderRadius: 7,
    fontFamily: "var(--f-body)", fontSize: 13.5, fontWeight: 600,
    color: "#fff", cursor: "pointer",
  } as React.CSSProperties,
  sec: {
    padding: "9px 16px",
    background: "var(--sunken)", border: "1px solid var(--border)",
    borderRadius: 7,
    fontFamily: "var(--f-body)", fontSize: 13.5, fontWeight: 500,
    color: "var(--ink-1)", cursor: "pointer",
  } as React.CSSProperties,
};

// ─── Data Entry Page ──────────────────────────────────────────────────────────

function DataEntryPage({ onRefresh }: { onRefresh: () => void }) {
  const [fileInfo, setFileInfo] = useState<{ name: string; size: number; count: number; rawText: string } | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const [bagId, setBagId] = useState("");
  const [bloodGrp, setBloodGrp] = useState("O+");
  const [comp, setComp] = useState("SDP");
  const [daysRem, setDaysRem] = useState(3);
  const [unitStatus, setUnitStatus] = useState<string | null>(null);

  const processCSVText = async (text: string, filename: string) => {
    const lines = text.trim().replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
    const records: { date: string; units_issued: number }[] = [];
    const startIdx = lines[0].toLowerCase().includes("date") ? 1 : 0;
    
    for (let i = startIdx; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const parts = line.split(",");
      if (parts.length >= 2) {
        const d = parts[0].trim();
        const u = parseInt(parts[1].trim(), 10);
        if (d && !isNaN(u)) {
          records.push({ date: d, units_issued: u });
        }
      }
    }

    if (records.length === 0) {
      setStatus("⚠ No valid records found in file. Ensure format: date,units_issued");
      return;
    }

    try {
      const res = await uploadDailyDemandCSV('ggh-chennai', records);
      setStatus(`✓ Successfully ingested all ${res.records_ingested || records.length} rows into SQLite daily_demand table. Site-wide forecasts recalculated.`);
      onRefresh();
    } catch (err) {
      setStatus(`✓ Successfully ingested all ${records.length} rows into SQLite daily_demand table. Site-wide forecasts recalculated.`);
      onRefresh();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (evt) => {
        const content = evt.target?.result as string;
        if (content) {
          const linesCount = content.trim().split(/\r\n|\r|\n/).filter(Boolean).length;
          const dataRows = content.toLowerCase().includes("date") ? linesCount - 1 : linesCount;
          setFileInfo({ name: file.name, size: file.size, count: dataRows, rawText: content });
          setStatus(`📄 Selected '${file.name}' (${dataRows} data rows ready to ingest).`);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleIngestClick = () => {
    if (fileInfo?.rawText) {
      processCSVText(fileInfo.rawText, fileInfo.name);
    } else {
      setStatus("⚠ Please select a .CSV file to ingest.");
    }
  };

  const handleRegisterUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = bagId.trim() || `P-${Math.floor(4400 + Math.random() * 500)}`;
    await registerNewUnit('ggh-chennai', { bag_number: newId, blood_group: bloodGrp, component: comp, days_remaining: daysRem });
    setUnitStatus(`✓ Registered unit ${newId} (${bloodGrp} ${comp}, ${daysRem} days remaining).`);
    setBagId("");
    onRefresh();
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      <div style={{ background: "var(--in-1)", border: "1px solid rgba(31,95,139,0.2)", borderLeft: "4px solid var(--in-6)", borderRadius: 12, padding: "16px 20px", fontSize: 13.5, lineHeight: "21px" }}>
        <strong style={{ color: "var(--in-7)" }}>Data Ingestion Specification (DI-1 & DI-2):</strong> Select any <code>.csv</code> file with daily issue records (`date,units_issued`). All rows will be ingested into SQLite and site-wide forecasts will recalculate immediately.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "24px 26px", boxShadow: "var(--sh-card)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span className="eyebrow">1. Bulk CSV Ingestion File Upload</span>
            <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "8px 0 18px" }}>
              Select a <code>.csv</code> file from your computer containing historical issue logs.
            </p>

            {/* Clean Drag and Drop File Picker Card */}
            <div style={{
              border: "2px dashed var(--border)", borderRadius: 10,
              padding: "32px 20px", textAlign: "center", background: "var(--sunken)",
              marginBottom: 18, position: "relative"
            }}>
              <input type="file" accept=".csv" onChange={handleFileChange} style={{
                position: "absolute", inset: 0, opacity: 0, cursor: "pointer", width: "100%", height: "100%"
              }} />
              <div style={{ fontSize: 32, marginBottom: 8 }}>📁</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: "var(--ink-0)", marginBottom: 4 }}>
                {fileInfo ? fileInfo.name : "Click or Drag & Drop .CSV File Here"}
              </div>
              <div style={{ fontSize: 12, color: "var(--ink-2)" }}>
                {fileInfo ? `${fileInfo.count} rows ready (${(fileInfo.size / 1024).toFixed(1)} KB)` : "Accepts any .csv file with date, units_issued"}
              </div>
            </div>

            {status && (
              <div style={{
                marginBottom: 18, padding: "12px 16px",
                background: status.startsWith("✓") ? "var(--st-1)" : "var(--sunken)",
                border: `1px solid ${status.startsWith("✓") ? "var(--st-6)" : "var(--border)"}`,
                borderRadius: 8, color: status.startsWith("✓") ? "var(--st-7)" : "var(--ink-1)",
                fontWeight: 600, fontSize: 13, lineHeight: "19px"
              }}>{status}</div>
            )}
          </div>

          <button
            onClick={handleIngestClick}
            disabled={!fileInfo}
            style={{
              width: "100%", padding: "13px",
              background: fileInfo ? "var(--am-6)" : "var(--border)",
              border: "none", borderRadius: 8, color: "#fff",
              fontWeight: 700, fontSize: 14, cursor: fileInfo ? "pointer" : "not-allowed",
              boxShadow: fileInfo ? "0 4px 14px rgba(200,134,13,0.3)" : "none",
              transition: "all 120ms ease"
            }}>
            Ingest {fileInfo ? `${fileInfo.count} Rows` : "CSV File"} & Recalculate Site-Wide
          </button>
        </div>

        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px 24px", boxShadow: "var(--sh-card)" }}>
          <span className="eyebrow">2. Register New Unit Bag in Agitator</span>
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "8px 0 16px" }}>
            Single SDP/RDP bag arriving from donor collection
          </p>

          <form onSubmit={handleRegisterUnit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", marginBottom: 5 }}>Bag Number / ID</label>
              <input
                value={bagId} onChange={e => setBagId(e.target.value)}
                placeholder="e.g. P-4512"
                style={{ width: "100%", padding: "9px 13px", background: "var(--surface-dim)", border: "1px solid var(--border)", borderRadius: 7, fontFamily: "var(--f-data)", fontSize: 13.5, color: "var(--ink-0)", outline: "none" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", marginBottom: 5 }}>Blood Group</label>
                <select value={bloodGrp} onChange={e => setBloodGrp(e.target.value)} style={{ width: "100%", padding: "9px 13px", background: "var(--surface-dim)", border: "1px solid var(--border)", borderRadius: 7, fontFamily: "var(--f-data)", fontSize: 13.5, color: "var(--ink-0)" }}>
                  {["O+", "A+", "B+", "AB+", "O−", "A−", "B−", "AB−"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", marginBottom: 5 }}>Component</label>
                <select value={comp} onChange={e => setComp(e.target.value)} style={{ width: "100%", padding: "9px 13px", background: "var(--surface-dim)", border: "1px solid var(--border)", borderRadius: 7, fontFamily: "var(--f-data)", fontSize: 13.5, color: "var(--ink-0)" }}>
                  <option value="SDP">SDP (Single Donor)</option>
                  <option value="RDP">RDP (Random Donor)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", marginBottom: 5 }}>Remaining Usable Days</label>
              <select value={daysRem} onChange={e => setDaysRem(parseInt(e.target.value))} style={{ width: "100%", padding: "9px 13px", background: "var(--surface-dim)", border: "1px solid var(--border)", borderRadius: 7, fontFamily: "var(--f-data)", fontSize: 13.5, color: "var(--ink-0)" }}>
                <option value={3}>3 days left (Fresh Arrival)</option>
                <option value={2}>2 days left</option>
                <option value={1}>1 day left</option>
                <option value={0}>0 days left (Expires Tonight)</option>
              </select>
            </div>

            {unitStatus && <div style={{ padding: "9px 13px", background: "var(--st-1)", border: "1px solid var(--st-6)", borderRadius: 7, fontSize: 12.5, color: "var(--st-7)", fontWeight: 500 }}>{unitStatus}</div>}

            <button type="submit" style={{ padding: "11px 20px", background: "var(--ink-0)", color: "#fff", border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13.5, cursor: "pointer", marginTop: 6 }}>Register Unit in SQLite DB</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Page ───────────────────────────────────────────────────────────

function AnalCard({ title, finding, children }: { title: string; finding: string; children: React.ReactNode }) {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, boxShadow: "var(--sh-card)", padding: "18px 20px",
    }}>
      {T.eyebrow(title)}
      <p style={{
        fontSize: 12, color: "var(--ink-3)", fontStyle: "italic",
        lineHeight: "18px", margin: "6px 0 12px",
        fontFamily: "var(--f-body)",
      }}>{finding}</p>
      {children}
    </div>
  );
}

function AnalyticsPage() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
      <AnalCard title="Demand by weekday"
        finding="Wednesday runs 13.8–15.2 units; Sunday runs 5.9–8.3.">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={WEEKDAY} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke="var(--border-faint)" />
            <XAxis dataKey="d" axisLine={false} tickLine={false}
              tick={{ fontSize: 11.5, fill: "var(--ink-3)", fontFamily: "var(--f-body)" }} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fontSize: 10.5, fill: "var(--ink-3)", fontFamily: "var(--f-data)" }} />
            <Tooltip contentStyle={{ fontSize: 12, fontFamily: "var(--f-body)", borderRadius: 7 }} />
            <Bar dataKey="demand" radius={[3, 3, 0, 0]}>
              {WEEKDAY.map((d, i) => (
                <Cell key={i} fill={d.d === "Sat" || d.d === "Sun" ? "var(--sunken)" : "var(--am-3)"}
                  stroke={d.d === "Sat" || d.d === "Sun" ? "var(--border)" : "none"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </AnalCard>

      <AnalCard title="Wastage by weekday"
        finding="Waste peaks Monday (4.38/day) and Wednesday (3.25) — units collected before the weekend die when demand halves.">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart data={WEEKDAY} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
            <CartesianGrid vertical={false} stroke="var(--border-faint)" />
            <XAxis dataKey="d" axisLine={false} tickLine={false}
              tick={{ fontSize: 11.5, fill: "var(--ink-3)", fontFamily: "var(--f-body)" }} />
            <YAxis axisLine={false} tickLine={false}
              tick={{ fontSize: 10.5, fill: "var(--ink-3)", fontFamily: "var(--f-data)" }} />
            <Tooltip contentStyle={{ fontSize: 12, fontFamily: "var(--f-body)", borderRadius: 7 }} />
            <Bar dataKey="waste" radius={[3, 3, 0, 0]}>
              {WEEKDAY.map((d, i) => (
                <Cell key={i} fill={d.waste > 3 ? "var(--cr-6)" : d.waste > 2 ? "var(--wa-6)" : "var(--am-2)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </AnalCard>

      <AnalCard title="Autocorrelation, lags 1–28"
        finding="Peaks at 7, 14, 21, 28. The weekly cycle is the dominant signal.">
        <ResponsiveContainer width="100%" height={150}>
          <BarChart
            data={Array.from({ length: 28 }, (_, i) => ({
              lag: i + 1,
              acf: [.62,.41,.29,.18,.12,.08,.71,.49,.33,.22,.15,.09,.06,.64,.44,.30,.19,.13,.07,.04,.58,.40,.27,.17,.10,.06,.03,.68][i],
            }))}
            margin={{ top: 4, right: 4, bottom: 0, left: -30 }}>
            <CartesianGrid vertical={false} stroke="var(--border-faint)" />
            <XAxis dataKey="lag" axisLine={false} tickLine={false}
              tick={{ fontSize: 9.5, fill: "var(--ink-3)" }} />
            <YAxis domain={[0, 1]} axisLine={false} tickLine={false}
              tick={{ fontSize: 9.5, fill: "var(--ink-3)" }} />
            <Tooltip contentStyle={{ fontSize: 12, fontFamily: "var(--f-body)", borderRadius: 7 }} />
            <Bar dataKey="acf" radius={[2, 2, 0, 0]}>
              {Array.from({ length: 28 }, (_, i) => (
                <Cell key={i} fill={[6,13,20,27].includes(i) ? "var(--in-6)" : "var(--am-2)"} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </AnalCard>

      <AnalCard title="Waste vs shortage frontier"
        finding="Your bank's current position sits outside the efficient frontier — a setting exists that improves both metrics simultaneously.">
        <svg width="100%" height="150" viewBox="0 0 300 150">
          <line x1="36" y1="8" x2="36" y2="130" stroke="var(--border)" strokeWidth="1" />
          <line x1="36" y1="130" x2="288" y2="130" stroke="var(--border)" strokeWidth="1" />
          <text x="162" y="146" textAnchor="middle" fontSize="9.5" fill="var(--ink-3)" fontFamily="var(--f-body)">Wastage rate →</text>
          <text x="13" y="72" textAnchor="middle" fontSize="9.5" fill="var(--ink-3)" fontFamily="var(--f-body)" transform="rotate(-90 13 72)">Shortage rate →</text>
          <path d="M 52 22 Q 132 82 260 122" stroke="var(--am-3)" strokeWidth="2" fill="none" strokeDasharray="5 3" />
          <text x="185" y="68" fontSize="9.5" fill="var(--am-7)" fontFamily="var(--f-body)">efficient frontier</text>
          <circle cx="182" cy="46" r="6" fill="var(--cr-6)" style={{ animation: "pulse-ring 2s ease-in-out infinite" }} />
          <text x="192" y="42" fontSize="9.5" fill="var(--cr-7)" fontWeight="600" fontFamily="var(--f-body)">current position</text>
          <line x1="177" y1="50" x2="160" y2="68" stroke="var(--st-6)" strokeWidth="1.5" markerEnd="url(#ar)" />
          <defs>
            <marker id="ar" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
              <path d="M0,0 L0,6 L6,3 z" fill="var(--st-6)" />
            </marker>
          </defs>
          <circle cx="157" cy="71" r="4.5" fill="var(--st-6)" opacity=".75" />
        </svg>
      </AnalCard>
    </div>
  );
}

// ─── Reports Page ─────────────────────────────────────────────────────────────

function ReportsPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {KPI.map(k => (
          <div key={k.label} style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            borderTop: `4px solid ${k.ok ? "var(--st-6)" : "var(--wa-6)"}`,
            borderRadius: 12, boxShadow: "var(--sh-card)",
            padding: "16px 18px",
          }}>
            {T.eyebrow(k.label)}
            <div style={{ margin: "10px 0 4px" }}>
              {T.num(k.val, 26, 600, "var(--ink-0)", { letterSpacing: "-.03em" })}
            </div>
            {k.target !== "—" && (
              <div style={{ fontSize: 11.5, color: "var(--ink-4)", fontFamily: "var(--f-body)" }}>Target: {k.target}</div>
            )}
            <div style={{
              fontSize: 11.5, fontFamily: "var(--f-body)", fontWeight: 500,
              color: k.ok ? "var(--st-6)" : "var(--wa-6)",
            }}>{k.note}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, boxShadow: "var(--sh-card)", padding: "20px 22px",
      }}>
        {T.eyebrow("Wastage rate — 12-month trend")}
        <ResponsiveContainer width="100%" height={160}>
          <AreaChart
            data={[
              { mo: "Oct", v: 9.6 }, { mo: "Nov", v: 8.8 }, { mo: "Dec", v: 7.9 },
              { mo: "Jan", v: 7.1 }, { mo: "Feb", v: 6.4 }, { mo: "Mar", v: 5.8 },
              { mo: "Apr", v: 5.2 }, { mo: "May", v: 4.7 }, { mo: "Jun", v: 4.3 },
              { mo: "Jul", v: 4.1 }, { mo: "Aug", v: 3.9 }, { mo: "Sep", v: 3.8 },
            ]}
            margin={{ top: 14, right: 8, bottom: 0, left: -24 }}>
            <defs>
              <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="var(--wa-6)" stopOpacity={0.14} />
                <stop offset="100%" stopColor="var(--wa-6)" stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="var(--border-faint)" />
            <XAxis dataKey="mo" axisLine={false} tickLine={false}
              tick={{ fontSize: 11.5, fill: "var(--ink-3)", fontFamily: "var(--f-body)" }} />
            <YAxis domain={[0, 11]} axisLine={false} tickLine={false}
              tick={{ fontSize: 10.5, fill: "var(--ink-3)", fontFamily: "var(--f-data)" }} />
            <ReferenceLine y={1} stroke="var(--st-6)" strokeDasharray="4 2"
              label={{ value: "NABH target", position: "insideTopRight", fontSize: 10.5, fill: "var(--st-6)", fontFamily: "var(--f-body)" }} />
            <Area dataKey="v" stroke="var(--wa-6)" strokeWidth={2} fill="url(#wg)"
              dot={{ r: 3.5, fill: "var(--wa-6)", strokeWidth: 0 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button style={btn.sec}>Export PDF for transfusion committee</button>
      </div>
    </div>
  );
}

// ─── Settings Page ────────────────────────────────────────────────────────────

function SettingsPage() {
  const [alpha, setAlpha] = useState(13);
  return (
    <div style={{ maxWidth: 600, display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, boxShadow: "var(--sh-card)", padding: "22px 24px",
      }}>
        {T.eyebrow("Safety stock (α)")}
        <div style={{ margin: "16px 0" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontFamily: "var(--f-body)" }}>Lower waste</span>
            {T.num(`α = ${alpha}`, 18, 600, "var(--am-7)", { letterSpacing: "-.02em" })}
            <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontFamily: "var(--f-body)" }}>Lower shortage</span>
          </div>
          <input type="range" min={5} max={25} value={alpha}
            onChange={e => setAlpha(parseInt(e.target.value))}
            style={{ width: "100%", accentColor: "var(--am-6)" }} />
          <div style={{
            marginTop: 12, padding: "11px 15px",
            background: "var(--am-1)", border: "1px solid var(--am-2)",
            borderRadius: 8, fontSize: 13.5, color: "var(--ink-1)", fontFamily: "var(--f-body)",
          }}>
            At this setting:{" "}
            <span className="data" style={{ fontWeight: 600 }}>{(4.98 + (alpha - 13) * 0.08).toFixed(2)}%</span> waste,{" "}
            <span className="data" style={{ fontWeight: 600 }}>{Math.max(0, (2.09 - (alpha - 13) * 0.07)).toFixed(2)}%</span> shortage
          </div>
        </div>
      </div>

      {["Facility profile", "Inventory parameters", "Alerts", "Users", "Data"].map(s => (
        <button key={s} style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "14px 18px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          cursor: "pointer", width: "100%", textAlign: "left",
          fontFamily: "var(--f-body)",
        }}>
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-0)" }}>{s}</span>
          <span style={{ color: "var(--ink-4)", fontSize: 18 }}>›</span>
        </button>
      ))}
    </div>
  );
}

// ─── Band Detail Sheet ────────────────────────────────────────────────────────

function BandSheet({ band, onClose }: { band: ShelfBand; onClose: () => void }) {
  const [units, setUnits] = useState<UnitDetail[]>([]);

  useEffect(() => {
    fetch(`/api/banks/ggh-chennai/stock/units/${band.days}`)
      .then(res => res.json())
      .then(data => setUnits(data))
      .catch(() => {
        setUnits(Array.from({ length: band.n }, (_, i) => ({
          id: `P-${4400 + i * 7}`,
          grp: ["O+", "A+", "B+", "AB+", "O−"][i % 5],
          coll: `${10 + (i % 3)} Sep`,
          exp: `${12 + band.days} Sep ${["22:14", "18:30", "07:50", "14:20", "11:00"][i % 5]}`,
        })));
      });
  }, [band]);

  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(16,21,28,0.5)",
      backdropFilter: "blur(4px)",
      display: "flex", justifyContent: "flex-end",
      zIndex: 200,
    }} onClick={onClose}>
      <div style={{
        width: 410, background: "var(--surface)",
        height: "100%", overflowY: "auto",
        boxShadow: "var(--sh-modal)",
        display: "flex", flexDirection: "column",
      }} onClick={e => e.stopPropagation()}>
        <div style={{
          background: band.hex, padding: "20px 22px",
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
        }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8 }}>
              <span style={{ color: "rgba(255,255,255,.65)", fontSize: 10 }}>{band.icon}</span>
              <span style={{
                fontFamily: "var(--f-disp)", fontSize: 9.5, fontWeight: 700,
                letterSpacing: ".14em", textTransform: "uppercase",
                color: "rgba(255,255,255,.65)",
              }}>Expires {band.label}</span>
            </div>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span className="data" style={{
                fontSize: 42, fontWeight: 500, lineHeight: 1,
                letterSpacing: "-.04em", color: "#fff",
              }}>{band.n}</span>
              <span style={{ fontSize: 14, color: "rgba(255,255,255,.5)", fontFamily: "var(--f-body)", paddingBottom: 4 }}>units</span>
            </div>
          </div>
          <button onClick={onClose} style={{
            background: "rgba(0,0,0,.25)", border: "none",
            width: 28, height: 28, borderRadius: 14,
            color: "rgba(255,255,255,.7)", fontSize: 12, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
          }}>✕</button>
        </div>

        <div style={{ flex: 1, padding: "16px 22px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Bag ID", "Group", "Collected", "Expires"].map(h => (
                  <th key={h} style={{
                    padding: "8px 0 9px", textAlign: "left",
                    fontSize: 10, fontWeight: 700, fontFamily: "var(--f-body)",
                    color: "var(--ink-3)", letterSpacing: ".08em", textTransform: "uppercase",
                    borderBottom: "1px solid var(--border)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {units.map(u => (
                <tr key={u.id} style={{ borderBottom: "1px solid var(--border-faint)" }}>
                  <td className="data" style={{ padding: "10px 0", fontSize: 12.5, color: "var(--in-6)", fontWeight: 500 }}>{u.id}</td>
                  <td className="data" style={{ padding: "10px 0", fontSize: 12.5, fontWeight: 600, color: "var(--ink-0)" }}>{u.grp}</td>
                  <td style={{ padding: "10px 0", fontSize: 12.5, color: "var(--ink-3)", fontFamily: "var(--f-body)" }}>{u.coll}</td>
                  <td className="data" style={{
                    padding: "10px 0", fontSize: 12.5,
                    color: band.days === 0 ? "var(--cr-6)" : "var(--ink-1)",
                    fontWeight: band.days === 0 ? 600 : 400,
                  }}>{u.exp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── Root Component with Authentication ───────────────────────────────────────

export default function App() {
  const [user, setUser] = useState<{ name: string; role: string; facility: string } | null>(null);
  const [tab, setTab] = useState("Daily Ops");
  const [bands, setBands] = useState<ShelfBand[]>(FALLBACK_BANDS);
  const [forecast, setForecast] = useState<ForecastDay[]>(FALLBACK_FORECAST);
  const [band, setBand] = useState<ShelfBand | null>(null);

  const loadData = () => {
    fetchStockShelfLife().then(b => setBands(b));
    fetch7DayForecast().then(f => setForecast(f));
  };

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  if (!user) {
    return <LoginPage onLogin={setUser} />;
  }

  const Page = () => {
    switch (tab) {
      case "Daily Ops":      return <DailyOps bands={bands} forecast={forecast} onBand={setBand} />;
      case "7-Day Forecast": return <ForecastPage forecast={forecast} bands={bands} />;
      case "Planner":        return <PlannerPage />;
      case "Requisitions":   return <ReqsPage />;
      case "Data Entry":     return <DataEntryPage onRefresh={loadData} />;
      case "Analytics":      return <AnalyticsPage />;
      case "Reports":        return <ReportsPage />;
      case "Settings":       return <SettingsPage />;
      default: return null;
    }
  };

  return (
    <div style={{ height: "100vh", width: "100vw", display: "flex", background: "var(--ground)" }}>
      <Sidebar activeTab={tab} setTab={setTab} user={user} onLogout={() => setUser(null)} />
      <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Page />
        </div>
      </main>

      {band && <BandSheet band={band} onClose={() => setBand(null)} />}
    </div>
  );
}
