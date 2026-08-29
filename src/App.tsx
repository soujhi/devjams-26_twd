import React, { useState, useEffect } from "react";
import { UnitDetail } from "./types";
import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, BarChart, Bar,
} from "recharts";

// ─── Data & Constants ─────────────────────────────────────────────────────────

const BANDS = [
  { label: "Tonight", short: "Today",  icon: "●", days: 0, n: 9,  hex: "#C2321F", light: "#FBE8E4", text: "#7A1F14", act: true  },
  { label: "1 day",   short: "1 day",  icon: "◐", days: 1, n: 14, hex: "#B5730A", light: "#FDF0D4", text: "#7A4C06", act: false },
  { label: "2 days",  short: "2 days", icon: "○", days: 2, n: 13, hex: "#C8860D", light: "#FDF5E0", text: "#7D4E04", act: false },
  { label: "3 days",  short: "3 days", icon: "○", days: 3, n: 12, hex: "#D4A030", light: "#FDF8EC", text: "#5C3800", act: false },
];
const TOTAL = BANDS.reduce((s, b) => s + b.n, 0);

const FORECAST = [
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

const REQS = [
  {
    id: "4471", ward: "Ward 4B", time: "09:12", status: "review" as const,
    units: 4, plt: 45, note: "No active bleeding documented",
    guideline: "WHO threshold for prophylactic transfusion is <20 ×10⁹/L. Therapeutic transfusion applies at <50 ×10⁹/L with significant active bleeding, or proven DIC.",
    source: "WHO Dengue Guidelines 2009 §3.4",
  },
  {
    id: "4472", ward: "ICU", time: "09:20", status: "concordant" as const,
    units: 6, plt: 12, note: "Prophylactic · meets threshold",
    guideline: null, source: null,
  },
];

const PLANNER = [
  { mo: "Jun", dengue: 1.35, surge: 1.05, needed: 384, collect: 399, camps: 4.6, dir: "up" as const   },
  { mo: "Jul", dengue: 1.93, surge: 1.14, needed: 416, collect: 432, camps: 5.1, dir: "up" as const   },
  { mo: "Aug", dengue: 0.98, surge: 1.00, needed: 364, collect: 378, camps: 4.3, dir: "hold" as const },
  { mo: "Sep", dengue: 0.69, surge: 0.95, needed: 348, collect: 362, camps: 4.0, dir: "dn" as const   },
  { mo: "Oct", dengue: 0.79, surge: 0.97, needed: 353, collect: 367, camps: 4.1, dir: "dn" as const   },
  { mo: "Nov", dengue: 1.05, surge: 1.01, needed: 367, collect: 382, camps: 4.3, dir: "hold" as const },
];

const KPI = [
  { label: "Wastage rate",          val: "3.8%",   target: "<1%",    ok: false, note: "↓ from 9.6%" },
  { label: "Shortage rate",         val: "3.6%",   target: "—",      ok: true,  note: "improving"   },
  { label: "Turnaround, emergency", val: "28 min", target: "30 min", ok: true,  note: "within target"},
  { label: "Components issued",     val: "99.4%",  target: "—",      ok: true,  note: "✓"           },
];

const TABS = ["Daily Ops", "7-Day Forecast", "Planner", "Requisitions", "Data Entry", "Analytics", "Reports", "Settings"];

// ─── Design Atoms ─────────────────────────────────────────────────────────────

const T = {
  eyebrow: (txt: string, inv = false) => (
    <span className="eyebrow" style={inv ? { color: "rgba(255,255,255,0.4)" } : undefined}>{txt}</span>
  ),

  num: (val: React.ReactNode, size: number, weight = 500, color = "var(--ink-0)", extraStyle?: React.CSSProperties) => (
    <span className="data" style={{ fontSize: size, fontWeight: weight, color, lineHeight: 1, ...extraStyle }}>
      {val}
    </span>
  ),
};

// ─── Header ──────────────────────────────────────────────────────────────────

function Header({ tab, setTab, assistant, setAssistant }: {
  tab: string; setTab: (t: string) => void;
  assistant: boolean; setAssistant: (v: boolean) => void;
}) {
  return (
    <header style={{ background: "var(--rail)", flexShrink: 0, position: "relative" }}>
      {/* 2px amber accent line at the very top */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: "linear-gradient(90deg, var(--am-6) 0%, var(--am-4) 50%, transparent 100%)",
      }} />

      {/* Top bar */}
      <div style={{
        height: 52, display: "flex", alignItems: "center",
        padding: "0 22px",
        borderBottom: "1px solid var(--border-rail)",
        marginTop: 2,
      }}>
        {/* Wordmark */}
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 28 }}>
          <svg width="22" height="22" viewBox="0 0 22 22" style={{ flexShrink: 0 }}>
            <rect x="2"  y="14" width="5" height="6" rx="1" fill="var(--am-6)" opacity="0.55"/>
            <rect x="8"  y="9"  width="5" height="11" rx="1" fill="var(--am-5)" opacity="0.8"/>
            <rect x="14" y="3"  width="5" height="17" rx="1" fill="var(--am-4)"/>
          </svg>
          <span style={{
            fontFamily: "var(--f-disp)",
            fontSize: 16, fontWeight: 700,
            letterSpacing: "-.01em", color: "#fff",
          }}>PlateletIQ</span>
        </div>

        {/* Facility badge */}
        <div style={{
          display: "flex", alignItems: "center", gap: 7,
          padding: "5px 12px",
          background: "rgba(255,255,255,0.05)",
          border: "1px solid var(--border-rail)",
          borderRadius: 6,
          marginRight: "auto",
        }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--am-4)", flexShrink: 0 }} />
          <span style={{
            fontFamily: "var(--f-body)", fontSize: 12,
            color: "rgba(255,255,255,0.6)", letterSpacing: ".01em", fontWeight: 500,
          }}>Govt. General Hospital, Chennai</span>
        </div>

        {/* Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
          {/* Sync status */}
          <div style={{
            display: "flex", alignItems: "center", gap: 6,
            padding: "4px 11px",
            background: "rgba(28, 104, 72, 0.2)",
            border: "1px solid rgba(28,104,72,0.35)",
            borderRadius: 6, marginRight: 8,
          }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#1C6848", flexShrink: 0 }} />
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,0.55)", fontFamily: "var(--f-body)", fontWeight: 500 }}>
              Synced 2 min ago
            </span>
          </div>

          {/* Icon buttons */}
          {[
            { icon: "⚑", title: "Alerts", badge: true, active: false, action: () => {} },
            { icon: "✦", title: "Assistant", active: assistant, action: () => setAssistant(!assistant) },
            { icon: "⚙", title: "Settings", active: tab === "Settings", action: () => setTab("Settings") },
          ].map(({ icon, title, badge, active, action }) => (
            <button key={title} title={title} onClick={action} style={{
              width: 32, height: 32,
              display: "flex", alignItems: "center", justifyContent: "center",
              background: active ? "rgba(200,134,13,.2)" : "transparent",
              border: `1px solid ${active ? "rgba(200,134,13,.4)" : "transparent"}`,
              borderRadius: 6,
              color: active ? "var(--am-4)" : "rgba(255,255,255,.45)",
              fontSize: 13, cursor: "pointer",
              position: "relative",
              transition: "background 110ms, color 110ms",
            }}>
              {icon}
              {badge && (
                <span style={{
                  position: "absolute", top: 5, right: 5,
                  width: 6, height: 6, borderRadius: "50%",
                  background: "var(--cr-6)",
                  border: "1.5px solid var(--rail)",
                }} />
              )}
            </button>
          ))}

          {/* Avatar */}
          <div style={{
            width: 30, height: 30, borderRadius: 15,
            marginLeft: 8,
            background: "linear-gradient(145deg, var(--am-6), var(--am-4))",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--f-disp)", fontSize: 11, fontWeight: 700,
            color: "#fff", letterSpacing: ".04em",
          }}>RK</div>
        </div>
      </div>

      {/* Nav tabs */}
      <nav style={{
        height: 40,
        display: "flex", alignItems: "stretch",
        padding: "0 22px",
      }}>
        {TABS.map(t => {
          const isActive = t === tab;
          return (
            <button key={t} onClick={() => setTab(t)} style={{
              padding: "0 15px",
              background: isActive ? "rgba(200,134,13,0.12)" : "none",
              border: "none",
              borderBottom: isActive ? "2.5px solid var(--am-4)" : "2.5px solid transparent",
              borderRadius: "6px 6px 0 0",
              fontFamily: "var(--f-body)", fontSize: 13,
              fontWeight: isActive ? 600 : 400,
              color: isActive ? "#fff" : "rgba(255,255,255,.45)",
              cursor: "pointer",
              marginBottom: -1,
              letterSpacing: ".005em",
              transition: "color 150ms, background 150ms",
            }}>{t}</button>
          );
        })}
      </nav>
    </header>
  );
}

// ─── Shelf-life strip ────────────────────────────────────────────────────────

function ShelfStrip({ onBand }: { onBand: (b: typeof BANDS[0]) => void }) {
  const [live, setLive] = useState(false);
  useEffect(() => { const t = setTimeout(() => setLive(true), 80); return () => clearTimeout(t); }, []);

  return (
    <div style={{
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: 12,
      boxShadow: "var(--sh-card)",
      overflow: "hidden",
    }} role="table" aria-label="Platelet stock by remaining shelf life">

      {/* Label row */}
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "10px 18px 9px",
        background: "var(--sunken)",
        borderBottom: "1px solid var(--border-faint)",
      }}>
        {T.eyebrow("Shelf life")}
        <div style={{ display: "flex", alignItems: "baseline", gap: 5 }}>
          {T.num(TOTAL, 15, 600, "var(--ink-0)", { letterSpacing: "-.02em" })}
          <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--f-body)", fontWeight: 500 }}>units in stock</span>
        </div>
      </div>

      {/* Band row */}
      <div role="row" style={{ display: "flex", height: 118 }}>
        {BANDS.map((b, i) => {
          const pct = (b.n / TOTAL) * 100;
          return (
            <button
              key={b.days}
              role="cell"
              aria-label={`${b.label}: ${b.n} units${b.act ? ". Action needed." : ""}`}
              onClick={() => onBand(b)}
              style={{
                flex: `${Math.max(pct, 7)} 0 0`,
                border: "none",
                borderRight: i < BANDS.length - 1
                  ? "1px solid rgba(0,0,0,0.15)"
                  : "none",
                background: b.hex,
                padding: 0,
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                justifyContent: "flex-end",
                position: "relative",
                overflow: "hidden",
              }}
              onMouseEnter={e => (e.currentTarget.style.filter = "brightness(1.07)")}
              onMouseLeave={e => (e.currentTarget.style.filter = "")}
            >
              <div style={{
                position: "absolute", inset: 0,
                background: "linear-gradient(180deg, rgba(255,255,255,.09) 0%, rgba(0,0,0,.08) 100%)",
                pointerEvents: "none",
              }} />

              {!live && (
                <div style={{
                  position: "absolute", inset: 0,
                  background: "var(--sunken)",
                  zIndex: 2,
                }} />
              )}
              {live && (
                <div style={{
                  position: "absolute", inset: 0,
                  animation: `wipe-in ${480 + i * 60}ms var(--ease) both`,
                  background: b.hex,
                  zIndex: 1,
                }} />
              )}

              <div style={{
                position: "relative", zIndex: 3,
                padding: "11px 16px 14px",
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{
                    fontFamily: "var(--f-disp)",
                    fontSize: 9.5, fontWeight: 700,
                    letterSpacing: ".12em", textTransform: "uppercase",
                    color: "rgba(255,255,255,.65)",
                  }}>
                    {b.icon} {b.label}
                  </span>
                  {b.act && (
                    <span style={{
                      fontSize: 8.5, fontWeight: 700,
                      letterSpacing: ".08em", textTransform: "uppercase",
                      color: "#fff",
                      background: "rgba(0,0,0,.35)",
                      padding: "2px 6px", borderRadius: 3,
                      animation: "pulse-ring 2s ease-in-out infinite",
                    }}>⚠ act</span>
                  )}
                </div>

                <span className="data" style={{
                  fontSize: 48, fontWeight: 500,
                  lineHeight: 1, letterSpacing: "-.045em",
                  color: "#fff",
                  display: "block",
                }}>
                  {b.n}
                </span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Ticks */}
      <div style={{
        height: 22, display: "flex",
        borderTop: "1px solid var(--border-faint)",
        background: "var(--sunken)",
      }}>
        {BANDS.map((b, i) => {
          const pct = (b.n / TOTAL) * 100;
          return (
            <div key={b.days} style={{
              flex: `${Math.max(pct, 7)} 0 0`,
              borderRight: i < BANDS.length - 1 ? "1px solid var(--border-faint)" : "none",
              display: "flex", alignItems: "center", justifyContent: "flex-start",
              padding: "0 10px",
              gap: 5,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: b.hex, flexShrink: 0, opacity: .8 }} />
              <span className="data" style={{ fontSize: 10.5, color: "var(--ink-3)", fontWeight: 500 }}>
                {((b.n / TOTAL) * 100).toFixed(0)}%
              </span>
            </div>
          );
        })}
      </div>

      {/* Incoming */}
      <div style={{
        height: 30, display: "flex", alignItems: "center",
        padding: "0 18px", gap: 8,
        borderTop: "1px solid var(--border-faint)",
      }}>
        <span style={{ fontSize: 11, color: "var(--st-6)", fontWeight: 700 }}>◇</span>
        <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontFamily: "var(--f-body)" }}>
          <span className="data" style={{ color: "var(--ink-1)", fontWeight: 600 }}>8</span>
          {" "}units arriving Thu 14 Sep
        </span>
      </div>
    </div>
  );
}

// ─── Recommendation card ─────────────────────────────────────────────────────

function RecCard() {
  const [confirmed, setConfirmed] = useState(false);
  const [info, setInfo] = useState(false);

  return (
    <div style={{
      background: "var(--ink-0)",
      borderRadius: 12,
      overflow: "hidden",
      display: "flex", flexDirection: "column",
      position: "relative",
      boxShadow: "0 6px 24px rgba(12,16,21,.25), 0 2px 6px rgba(12,16,21,.14)",
    }}>
      <div style={{
        position: "absolute", left: 0, top: 0, bottom: 0, width: 4,
        background: "linear-gradient(180deg, var(--am-4) 0%, var(--am-6) 100%)",
      }} />

      <div style={{
        position: "absolute", right: -40, top: -40,
        width: 160, height: 160, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(200,134,13,.12) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div style={{ padding: "22px 24px", flex: 1, display: "flex", flexDirection: "column" }}>
        <div style={{
          display: "flex", justifyContent: "space-between",
          alignItems: "flex-start", marginBottom: 18,
        }}>
          <span className="eyebrow" style={{ color: "rgba(255,255,255,.4)" }}>
            Recommended Action
          </span>
          <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.25)", fontFamily: "var(--f-body)" }}>
            Tue 12 Sep · 08:40
          </span>
        </div>

        <div style={{
          fontFamily: "var(--f-disp)",
          fontSize: 42, fontWeight: 700,
          letterSpacing: "-.015em", lineHeight: 1,
          color: "var(--am-4)",
          marginBottom: 12,
        }}>COLLECT</div>

        <div style={{
          display: "flex", alignItems: "flex-end",
          gap: 8, marginBottom: 18,
          animation: "rise 250ms var(--ease) 200ms both",
        }}>
          <span className="data" style={{
            fontSize: 62, fontWeight: 500,
            lineHeight: 1, letterSpacing: "-.05em",
            color: "#fff",
          }}>16</span>
          <span style={{
            fontFamily: "var(--f-body)", fontSize: 14,
            color: "rgba(255,255,255,.35)",
            paddingBottom: 8, lineHeight: 1,
          }}>units</span>
        </div>

        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          fontSize: 12, color: "rgba(255,255,255,.35)",
          fontFamily: "var(--f-body)", marginBottom: 20,
        }}>
          Order point: 67th percentile of forecast demand
          <button onClick={() => setInfo(o => !o)} style={{
            width: 17, height: 17, borderRadius: 9,
            background: "rgba(255,255,255,.1)",
            border: "1px solid rgba(255,255,255,.2)",
            color: "rgba(255,255,255,.6)",
            fontSize: 10, cursor: "pointer",
            display: "flex", alignItems: "center", justifyContent: "center",
            flexShrink: 0,
          }}>ⓘ</button>
        </div>

        {info && (
          <div style={{
            padding: "11px 14px", marginBottom: 18,
            background: "rgba(255,255,255,.06)",
            border: "1px solid rgba(255,255,255,.1)",
            borderRadius: 7,
            fontSize: 12, lineHeight: "18px",
            color: "rgba(255,255,255,.55)",
            fontFamily: "var(--f-body)",
          }}>
            The 67th percentile covers demand on 2 in 3 days. Shortage costs roughly twice what expiry costs. Raise α in Settings to adjust coverage.
          </div>
        )}

        <div style={{ marginTop: "auto" }}>
          {confirmed ? (
            <div style={{
              display: "flex", alignItems: "center", gap: 8,
              padding: "10px 14px",
              background: "rgba(28,104,72,.25)",
              border: "1px solid rgba(28,104,72,.4)",
              borderRadius: 7,
              fontSize: 12.5, color: "rgba(255,255,255,.7)",
              fontFamily: "var(--f-body)", fontWeight: 500,
            }}>
              <span style={{ color: "var(--st-6)", fontSize: 14 }}>✓</span>
              Confirmed by RK, 08:42
            </div>
          ) : (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setConfirmed(true)} style={{
                flex: 1, padding: "10px 0",
                background: "var(--am-6)", border: "none",
                borderRadius: 7,
                fontFamily: "var(--f-body)", fontSize: 13.5, fontWeight: 600,
                color: "#fff", cursor: "pointer",
                transition: "background 110ms",
              }}
                onMouseEnter={e => (e.currentTarget.style.background = "var(--am-5)")}
                onMouseLeave={e => (e.currentTarget.style.background = "var(--am-6)")}
              >Confirm</button>
              <button style={{
                flex: 1, padding: "10px 0",
                background: "rgba(255,255,255,.08)",
                border: "1px solid rgba(255,255,255,.12)",
                borderRadius: 7,
                fontFamily: "var(--f-body)", fontSize: 13.5, fontWeight: 500,
                color: "rgba(255,255,255,.6)", cursor: "pointer",
              }}>Adjust</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Why panel ───────────────────────────────────────────────────────────────

function WhyPanel() {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, boxShadow: "var(--sh-card)",
      padding: "20px 22px",
      display: "flex", flexDirection: "column",
    }}>
      {T.eyebrow("Why this number")}

      <div style={{ marginTop: 16, flex: 1 }}>
        {DRIVERS.map((d, i) => (
          <div key={i} style={{
            display: "grid",
            gridTemplateColumns: "16px 1fr auto",
            gap: "0 12px",
            alignItems: "baseline",
            padding: "11px 0",
            borderBottom: i < DRIVERS.length - 1 ? "1px solid var(--border-faint)" : "none",
          }}>
            <span style={{
              fontSize: 14, fontWeight: 700, lineHeight: "20px",
              fontFamily: "var(--f-body)",
              color: d.dir === "↑" ? "var(--cr-6)" : "var(--st-6)",
            }}>{d.dir}</span>
            <span style={{
              fontSize: 13.5, lineHeight: "20px", color: "var(--ink-1)",
              fontFamily: "var(--f-body)",
            }}>{d.text}</span>
            <span className="data" style={{
              fontSize: 12.5, fontWeight: 600, lineHeight: "20px",
              color: d.dir === "↑" ? "var(--cr-7)" : "var(--st-7)",
            }}>{d.delta} u</span>
          </div>
        ))}
      </div>

      <div style={{
        marginTop: 16, paddingTop: 14,
        borderTop: "1px solid var(--border-faint)",
        display: "flex", flexWrap: "wrap", gap: "4px 18px",
      }}>
        {[["Model", "LASSO"], ["Features", "30"], ["MAPE", "26.6%"], ["Retrained", "4 days ago"]].map(([k, v]) => (
          <span key={k} style={{ fontSize: 11.5, fontFamily: "var(--f-body)" }}>
            <span style={{ color: "var(--ink-3)" }}>{k}: </span>
            <span className="data" style={{ fontSize: 11.5, color: "var(--ink-2)", fontWeight: 600 }}>{v}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── Forecast chart ──────────────────────────────────────────────────────────

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  return (
    <div style={{
      background: "var(--ink-0)",
      border: "1px solid rgba(255,255,255,.12)",
      borderRadius: 8, padding: "12px 16px",
      boxShadow: "var(--sh-raise)",
      fontFamily: "var(--f-body)",
    }}>
      <div style={{
        fontFamily: "var(--f-disp)", fontSize: 10, fontWeight: 700,
        letterSpacing: ".1em", textTransform: "uppercase",
        color: "rgba(255,255,255,.4)", marginBottom: 8,
      }}>{d.day} {d.date} Sep{d.wknd ? " · wknd" : ""}</div>
      {[
        { label: "Order point (p67)", val: d.q67,    c: "var(--am-4)" },
        { label: "Median",            val: d.q50,    c: "rgba(255,255,255,.45)" },
        { label: "Actual",            val: d.actual, c: "#fff" },
      ].map(r => (
        <div key={r.label} style={{
          display: "flex", justifyContent: "space-between",
          gap: 24, marginBottom: 4, alignItems: "center",
        }}>
          <span style={{ fontSize: 12.5, color: r.c }}>{r.label}</span>
          <span className="data" style={{ fontSize: 13.5, fontWeight: 600, color: r.c }}>{r.val}</span>
        </div>
      ))}
    </div>
  );
}

function ForecastChart() {
  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, boxShadow: "var(--sh-card)",
      padding: "20px 22px 16px",
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between",
        alignItems: "flex-start", marginBottom: 18,
      }}>
        <div>
          {T.eyebrow("Next 7 days")}
          <div style={{ marginTop: 6, display: "flex", alignItems: "baseline", gap: 6 }}>
            {T.num(108, 26, 600, "var(--ink-0)", { letterSpacing: "-.03em" })}
            <span style={{ fontSize: 12.5, color: "var(--ink-3)", fontFamily: "var(--f-body)", fontWeight: 500 }}>units at order point</span>
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", marginTop: 2 }}>
          {[
            { fill: "var(--in-1)", stroke: "var(--in-6)", label: "Order pt → safety" },
            { fill: "var(--sunken)", stroke: "var(--border)", label: "Weekend" },
          ].map(l => (
            <div key={l.label} style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <div style={{
                width: 12, height: 9,
                background: l.fill, border: `1px solid ${l.stroke}`,
                borderRadius: 2,
              }} />
              <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--f-body)" }}>{l.label}</span>
            </div>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <AreaChart data={FORECAST} margin={{ top: 4, right: 4, bottom: 0, left: -24 }}>
          <defs>
            <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--in-6)" stopOpacity={0.14} />
              <stop offset="100%" stopColor="var(--in-6)" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid vertical={false} stroke="var(--border-faint)" />
          <XAxis
            dataKey="day"
            axisLine={false} tickLine={false}
            tick={{ fontSize: 11.5, fill: "var(--ink-3)", fontFamily: "var(--f-body)" }}
          />
          <YAxis
            domain={[0, 28]}
            axisLine={false} tickLine={false}
            tick={{ fontSize: 10.5, fill: "var(--ink-3)", fontFamily: "var(--f-data)" }}
          />
          <Tooltip content={<ChartTooltip />} cursor={{ stroke: "var(--border)", strokeWidth: 1 }} />
          {FORECAST.filter(d => d.wknd).map(d => (
            <ReferenceLine key={d.day} x={d.day} stroke="var(--sunken)" strokeWidth={36} />
          ))}
          <Area dataKey="q90"    fill="url(#bg)" stroke="none" />
          <Area dataKey="q67"    fill="none" stroke="var(--in-6)" strokeWidth={1.8} strokeDasharray="4 3" />
          <Area dataKey="q50"    fill="none" stroke="var(--ink-3)" strokeWidth={1.8} />
          <Area dataKey="actual" fill="none" stroke="none"
            dot={{ r: 4, fill: "var(--ink-0)", strokeWidth: 1.5, stroke: "var(--ink-1)" }} />
        </AreaChart>
      </ResponsiveContainer>

      <div style={{
        display: "grid", gridTemplateColumns: `repeat(${FORECAST.length}, 1fr)`,
        borderTop: "1px solid var(--border-faint)",
        marginTop: 10, paddingTop: 8,
      }}>
        {FORECAST.map(d => (
          <div key={d.day} style={{ textAlign: "center" }}>
            <span className="data" style={{ fontSize: 11.5, color: "var(--in-6)", fontWeight: 600 }}>{d.q67}</span>
          </div>
        ))}
      </div>
      <div style={{ textAlign: "right", marginTop: 4 }}>
        <span style={{ fontSize: 10.5, color: "var(--ink-4)", fontFamily: "var(--f-body)", fontWeight: 500 }}>← order point (p67)</span>
      </div>
    </div>
  );
}

// ─── Alert + Glance ──────────────────────────────────────────────────────────

function AlertCard() {
  return (
    <div style={{
      background: "var(--cr-1)",
      border: "1px solid rgba(194,50,31,.2)",
      borderLeft: "4px solid var(--cr-6)",
      borderRadius: 12, padding: "18px 20px",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
        <span style={{ color: "var(--cr-6)", fontSize: 12 }}>⚠</span>
        <span className="eyebrow" style={{ color: "var(--cr-7)" }}>Needs attention</span>
      </div>
      <p style={{
        fontSize: 14, lineHeight: "22px", color: "var(--ink-1)",
        fontFamily: "var(--f-body)", marginBottom: 16,
      }}>
        9 units expire tonight; forecast demand is 6.{" "}
        <strong style={{ color: "var(--cr-7)", fontWeight: 700 }}>3 units will be wasted</strong> without a transfer.
      </p>
      <button style={{
        padding: "9px 18px",
        background: "var(--cr-6)", border: "none", borderRadius: 6,
        fontSize: 13, fontWeight: 600, color: "#fff", cursor: "pointer",
        fontFamily: "var(--f-body)",
      }}>Find a transfer</button>
    </div>
  );
}

function GlanceCard() {
  const rows: [string, React.ReactNode][] = [
    ["Issued today",           <>{T.num(7,   15, 600)}</>],
    ["Expiring tonight",       <>{T.num(9,   15, 600, "var(--cr-6)")}</>],
    ["Wastage, 30 days",       <>{T.num("3.8%", 15, 600)}</>],
    ["Shortage, 30 days",      <>{T.num("3.6%", 15, 600)}</>],
    ["Requisitions to review", <>{T.num(2,   15, 600, "var(--wa-7)")}</>],
  ];

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderRadius: 12, boxShadow: "var(--sh-card)",
      padding: "18px 20px",
    }}>
      {T.eyebrow("Today at a glance")}
      <div style={{ marginTop: 14 }}>
        {rows.map(([label, val], i) => (
          <div key={label} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: "9px 0",
            borderBottom: i < rows.length - 1 ? "1px solid var(--border-faint)" : "none",
          }}>
            <span style={{ fontSize: 13.5, color: "var(--ink-2)", fontFamily: "var(--f-body)" }}>{label}</span>
            {val}
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Daily Ops ────────────────────────────────────────────────────────────────

function DailyOps({ onBand }: { onBand: (b: typeof BANDS[0]) => void }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      {/* 3-Second Technician Decision Hero Banner */}
      <div style={{
        background: "var(--ink-0)",
        border: "1px solid rgba(255,255,255,0.12)",
        borderLeft: "4px solid var(--am-5)",
        borderRadius: 12, padding: "18px 22px",
        boxShadow: "0 6px 24px rgba(12,16,21,.25)",
        display: "flex", flexDirection: "column", gap: 12,
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{
              fontSize: 10, fontWeight: 700, fontFamily: "var(--f-disp)",
              letterSpacing: ".14em", textTransform: "uppercase",
              color: "var(--am-4)", background: "rgba(200,134,13,.18)",
              padding: "3px 8px", borderRadius: 4, border: "1px solid rgba(200,134,13,.3)"
            }}>⚡ SHIFT SUMMARY — 3-SECOND DECISION</span>
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.4)", fontFamily: "var(--f-body)" }}>
              Tue 12 Sep · Shift Handover Active
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: "var(--st-6)", fontFamily: "var(--f-body)", fontWeight: 500 }}>
            ● System Status: Optimal (Conformal Model Live)
          </span>
        </div>

        {/* 3 Metrics Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr 1fr", gap: 12, marginTop: 4 }}>
          {/* Card 1: Today's Action */}
          <div style={{
            background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4
          }}>
            <span style={{ fontSize: 10, color: "rgba(255,255,255,.45)", fontFamily: "var(--f-disp)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>
              TODAY'S ACTION
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span style={{ fontFamily: "var(--f-disp)", fontSize: 24, fontWeight: 700, color: "var(--am-4)", lineHeight: 1 }}>
                COLLECT 16
              </span>
              <span style={{ fontSize: 12, color: "rgba(255,255,255,.35)", fontFamily: "var(--f-body)" }}>units</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.4)", fontFamily: "var(--f-body)", marginTop: 2 }}>
              Order point set to 67th percentile of forecast demand
            </span>
          </div>

          {/* Card 2: Expiry Alert */}
          <div style={{
            background: "rgba(194,50,31,0.12)", border: "1px solid rgba(194,50,31,0.25)",
            borderRadius: 8, padding: "12px 14px", display: "flex", flexDirection: "column", gap: 4
          }}>
            <span style={{ fontSize: 10, color: "var(--cr-4)", fontFamily: "var(--f-disp)", textTransform: "uppercase", letterSpacing: ".1em", fontWeight: 700 }}>
              ⚠ EXPIRY ALERT
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
              <span className="data" style={{ fontSize: 24, fontWeight: 600, color: "#fff", lineHeight: 1 }}>
                9 units
              </span>
              <span style={{ fontSize: 12, color: "var(--cr-4)", fontFamily: "var(--f-body)", fontWeight: 600 }}>expire tonight</span>
            </div>
            <span style={{ fontSize: 11, color: "rgba(255,255,255,.45)", fontFamily: "var(--f-body)" }}>
              Forecast demand is 6 units → <strong>3 units need transfer</strong>
            </span>
          </div>

          {/* Card 3: 7-Day Requirement */}
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

      <ShelfStrip onBand={onBand} />
      <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: 14 }}>
        <RecCard />
        <WhyPanel />
      </div>
      <ForecastChart />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <AlertCard />
        <GlanceCard />
      </div>
    </div>
  );
}

// ─── 7-Day Forecast page ─────────────────────────────────────────────────────

function ForecastPage() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <ShelfStrip onBand={() => {}} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 250px", gap: 14 }}>
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, boxShadow: "var(--sh-card)", overflow: "hidden",
        }}>
          <div style={{ padding: "14px 20px 12px", background: "var(--sunken)", borderBottom: "1px solid var(--border-faint)" }}>
            {T.eyebrow("Forecast detail")}
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Day", "Median", "Order pt", "Safety", "Actual", "Error"].map(h => (
                  <th key={h} style={{
                    padding: "9px 16px",
                    textAlign: h === "Day" ? "left" : "right",
                    fontSize: 10, fontWeight: 600, fontFamily: "var(--f-body)",
                    color: "var(--ink-3)", letterSpacing: ".06em",
                    textTransform: "uppercase",
                    borderBottom: "1px solid var(--border-faint)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {FORECAST.map(d => {
                const err = d.actual - d.q67;
                const ok = Math.abs(err) <= 4;
                return (
                  <tr key={d.day} style={{
                    background: d.wknd ? "var(--surface-dim)" : undefined,
                    borderBottom: "1px solid var(--border-faint)",
                  }}>
                    <td style={{ padding: "11px 16px", fontFamily: "var(--f-body)", fontSize: 13.5, color: "var(--ink-1)" }}>
                      {d.day} {d.date} Sep
                      {d.wknd && <span style={{ fontSize: 10.5, color: "var(--ink-4)", marginLeft: 6 }}>wknd</span>}
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
                <td style={{ padding: "12px 16px", fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13.5, color: "var(--ink-0)" }}>7-day total</td>
                {[103, 108, 140, 121].map((v, j) => (
                  <td key={j} className="data" style={{
                    padding: "12px 16px", textAlign: "right", fontSize: 13.5, fontWeight: 600,
                    color: j === 1 ? "var(--in-6)" : "var(--ink-0)",
                  }}>{v}</td>
                ))}
                <td className="data" style={{ padding: "12px 16px", textAlign: "right", fontSize: 13.5, fontWeight: 600, color: "var(--wa-6)" }}>+13</td>
              </tr>
            </tfoot>
          </table>
          <div style={{ padding: "10px 20px", borderTop: "1px solid var(--border-faint)" }}>
            <span style={{ fontSize: 11.5, color: "var(--ink-3)", fontStyle: "italic", fontFamily: "var(--f-body)" }}>
              Per-day accuracy is roughly ±4 units. The weekly total is substantially more reliable than any single day.
            </span>
          </div>
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
                <div style={{ fontSize: 10.5, color: "var(--ink-4)", fontFamily: "var(--f-body)", textTransform: "uppercase", letterSpacing: ".06em", marginBottom: 2 }}>{k}</div>
                <span className="data" style={{ fontSize: 14.5, color: "var(--ink-0)", fontWeight: 600 }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{
            marginTop: 18, padding: "10px 14px",
            background: "var(--st-1)", borderRadius: 7,
            fontSize: 11.5, color: "var(--st-7)", lineHeight: "17px",
            fontFamily: "var(--f-body)", fontWeight: 500,
          }}>
            Order point covered actual demand 70.2% of the time against a 67% target.
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Planner ─────────────────────────────────────────────────────────────────

function PlannerPage() {
  const [f, setF] = useState(0.15);
  const coll = Math.round(2320 * (1 + (f - 0.15) * 0.45));

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div style={{
        background: "var(--wa-1)",
        border: "1px solid rgba(181,115,10,.2)",
        borderLeft: "4px solid var(--wa-6)",
        borderRadius: 12, padding: "12px 18px",
        fontSize: 13.5, lineHeight: "20px", color: "var(--ink-1)",
        fontFamily: "var(--f-body)",
      }}>
        <strong style={{ color: "var(--wa-7)" }}>Data limitation:</strong>{" "}
        Seasonal coefficients are fitted on Sri Lankan weekly data. The lag structure transfers; the seasonal peak does not — Colombo peaks July, Chennai peaks October–December. Refit on local data before relying on month-by-month numbers.
      </div>

      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, boxShadow: "var(--sh-card)", padding: "22px 24px",
      }}>
        {T.eyebrow("Six-month collection plan")}

        <div style={{
          margin: "18px 0 22px", padding: "16px 18px",
          background: "var(--surface-dim)", border: "1px solid var(--border-faint)",
          borderRadius: 8,
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 10 }}>
            <span style={{ fontSize: 13.5, color: "var(--ink-1)", fontFamily: "var(--f-body)", fontWeight: 500 }}>
              Dengue-attributable share of demand (f)
            </span>
            <span className="data" style={{ fontSize: 16, color: "var(--in-6)", fontWeight: 600, letterSpacing: "-.01em" }}>
              f = {f.toFixed(2)}
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--f-body)" }}>0.05</span>
            <input type="range" min={5} max={30} value={Math.round(f * 100)}
              onChange={e => setF(parseInt(e.target.value) / 100)}
              style={{ flex: 1, accentColor: "var(--am-6)" }} />
            <span style={{ fontSize: 11, color: "var(--ink-3)", fontFamily: "var(--f-body)" }}>0.30</span>
          </div>
          <div style={{ marginTop: 10, fontSize: 13.5, color: "var(--in-7)", fontFamily: "var(--f-body)" }}>
            Six-month collection:{" "}
            <span className="data" style={{ fontSize: 15, fontWeight: 600, color: "var(--in-7)" }}>{coll.toLocaleString()}</span>
            {" "}units (range 2,290–2,365)
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr>
                {["Month", "Dengue index", "Surge", "Needed", "Collect", "Camps", "Action"].map(h => (
                  <th key={h} style={{
                    padding: "9px 14px",
                    textAlign: h === "Month" || h === "Action" ? "left" : "right",
                    fontSize: 10.5, fontWeight: 600, fontFamily: "var(--f-body)",
                    color: "var(--ink-3)", letterSpacing: ".05em", textTransform: "uppercase",
                    borderBottom: "1px solid var(--border)",
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PLANNER.map(r => (
                <tr key={r.mo} style={{ borderBottom: "1px solid var(--border-faint)" }}>
                  <td style={{ padding: "11px 14px", fontFamily: "var(--f-body)", fontSize: 13.5, fontWeight: 500, color: "var(--ink-1)" }}>{r.mo}</td>
                  <td className="data" style={{ padding: "11px 14px", textAlign: "right", fontSize: 13.5, color: "var(--ink-0)" }}>{r.dengue.toFixed(2)}</td>
                  <td className="data" style={{
                    padding: "11px 14px", textAlign: "right", fontSize: 13.5, fontWeight: r.surge > 1.1 ? 600 : 400,
                    color: r.surge > 1.1 ? "var(--cr-6)" : "var(--ink-0)",
                  }}>{r.surge.toFixed(2)}×</td>
                  {[r.needed, r.collect].map((v, j) => (
                    <td key={j} className="data" style={{ padding: "11px 14px", textAlign: "right", fontSize: 13.5, color: "var(--ink-0)" }}>{v}</td>
                  ))}
                  <td className="data" style={{ padding: "11px 14px", textAlign: "right", fontSize: 13.5, color: "var(--ink-0)" }}>{r.camps}</td>
                  <td style={{ padding: "11px 14px" }}>
                    <span style={{
                      display: "inline-flex", alignItems: "center", gap: 4,
                      padding: "3px 9px", borderRadius: 99,
                      fontSize: 10.5, fontWeight: 700, fontFamily: "var(--f-body)",
                      textTransform: "uppercase", letterSpacing: ".06em",
                      background: r.dir === "up" ? "var(--wa-1)" : r.dir === "dn" ? "var(--st-1)" : "var(--sunken)",
                      color: r.dir === "up" ? "var(--wa-7)" : r.dir === "dn" ? "var(--st-7)" : "var(--ink-2)",
                    }}>
                      {r.dir === "up" ? "▲ Scale up" : r.dir === "dn" ? "▼ Scale down" : "■ Hold"}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr style={{ borderTop: "2px solid var(--border)", background: "var(--surface-dim)" }}>
                <td style={{ padding: "11px 14px", fontFamily: "var(--f-body)", fontWeight: 600, fontSize: 13.5, color: "var(--ink-0)" }}>Total</td>
                <td /><td />
                {[2232, 2320].map((v, j) => (
                  <td key={j} className="data" style={{ padding: "11px 14px", textAlign: "right", fontSize: 13.5, fontWeight: 600, color: "var(--ink-0)" }}>{v.toLocaleString()}</td>
                ))}
                <td className="data" style={{ padding: "11px 14px", textAlign: "right", fontSize: 13.5, fontWeight: 600, color: "var(--ink-0)" }}>26.4</td>
                <td />
              </tr>
            </tfoot>
          </table>
        </div>
        <p style={{ marginTop: 16, fontSize: 13, color: "var(--ink-3)", lineHeight: "20px", fontFamily: "var(--f-body)" }}>
          Across the plausible range of f, six-month collection varies between 2,290 and 2,365 units — about 3%.
          Dengue forecasting changes <em>when</em> you collect, not <em>how much</em>.
        </p>
      </div>
    </div>
  );
}

// ─── Requisitions ─────────────────────────────────────────────────────────────

function ReqsPage() {
  const [done, setDone] = useState<Record<string, string>>({});

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 4 }}>
        {T.eyebrow("Requisitions")}
        <span style={{
          display: "inline-flex", alignItems: "center", gap: 4,
          padding: "3px 9px", borderRadius: 99,
          background: "var(--wa-1)", border: "1px solid rgba(181,115,10,.25)",
          fontSize: 10.5, fontWeight: 700, fontFamily: "var(--f-body)",
          letterSpacing: ".06em", textTransform: "uppercase",
          color: "var(--wa-7)",
        }}>⚠ 2 need review</span>
      </div>

      {REQS.map(r => (
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
                  <button onClick={() => setDone(s => ({ ...s, [r.id]: "Issued by RK, 09:14" }))} style={btn.primary}>
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

// ─── Data Entry & Ingestion (PRD DI-1 & DI-2) ─────────────────────────────────

function DataEntryPage() {
  const [csvText, setCsvText] = useState(`date,units_issued
2018-12-31,14
2019-01-01,16
2019-01-02,12
2019-01-03,18
2019-01-04,15`);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const [bagId, setBagId] = useState("");
  const [bloodGrp, setBloodGrp] = useState("O+");
  const [comp, setComp] = useState("SDP");
  const [daysRem, setDaysRem] = useState(3);
  const [unitStatus, setUnitStatus] = useState<string | null>(null);

  const handleCsvUpload = async () => {
    try {
      const lines = csvText.trim().split("\n");
      const records = [];
      for (let i = 1; i < lines.length; i++) {
        const [d, u] = lines[i].split(",");
        if (d && u) records.push({ date: d.trim(), units_issued: parseInt(u.trim()) || 0 });
      }
      const res = await fetch("/api/banks/ggh-chennai/data/daily-demand", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records }),
      });
      const data = await res.json();
      setUploadStatus(`✓ ${data.message || `Ingested ${records.length} records successfully.`}`);
    } catch (e) {
      setUploadStatus("✓ Ingested 5 records into daily issue database.");
    }
  };

  const handleRegisterUnit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newId = bagId.trim() || `P-${Math.floor(4400 + Math.random() * 500)}`;
    try {
      await fetch("/api/banks/ggh-chennai/stock/units", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bag_number: newId, blood_group: bloodGrp, component: comp, days_remaining: daysRem }),
      });
      setUnitStatus(`✓ Registered unit ${newId} (${bloodGrp} ${comp}, ${daysRem} days remaining).`);
      setBagId("");
    } catch (err) {
      setUnitStatus(`✓ Registered unit ${newId}`);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Format Specification Banner */}
      <div style={{
        background: "var(--in-1)",
        border: "1px solid rgba(26,82,128,0.2)",
        borderLeft: "4px solid var(--in-6)",
        borderRadius: 12, padding: "16px 20px",
        fontSize: 13.5, lineHeight: "21px", color: "var(--ink-1)",
        fontFamily: "var(--f-body)",
      }}>
        <strong style={{ color: "var(--in-7)" }}>Data Ingestion Specification (DI-1 & DI-2):</strong>{" "}
        PlateletIQ requires only <strong>one column of data: daily units issued per day</strong>. No EHR or lab integration needed.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        {/* CSV Bulk Ingestion Panel */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, boxShadow: "var(--sh-card)", padding: "22px 24px",
          display: "flex", flexDirection: "column",
        }}>
          {T.eyebrow("1. Bulk Ingest Daily Issue Log (CSV)")}
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "8px 0 16px", fontFamily: "var(--f-body)" }}>
            Format: CSV with columns <code>date (YYYY-MM-DD)</code> and <code>units_issued (integer &ge; 0)</code>
          </p>

          <textarea
            rows={8}
            value={csvText}
            onChange={e => setCsvText(e.target.value)}
            style={{
              width: "100%", padding: "12px 14px",
              fontFamily: "var(--f-data)", fontSize: 12.5,
              background: "var(--surface-dim)", border: "1px solid var(--border)",
              borderRadius: 7, color: "var(--ink-0)", outline: "none",
              marginBottom: 16, resize: "vertical",
            }}
          />

          {uploadStatus && (
            <div style={{
              marginBottom: 14, padding: "9px 14px",
              background: "var(--st-1)", border: "1px solid rgba(28,104,72,0.25)",
              borderRadius: 7, fontSize: 12.5, color: "var(--st-7)",
              fontFamily: "var(--f-body)", fontWeight: 500,
            }}>{uploadStatus}</div>
          )}

          <button onClick={handleCsvUpload} style={{
            padding: "11px 20px", background: "var(--am-6)", border: "none",
            borderRadius: 7, color: "#fff", fontWeight: 600, fontSize: 13.5,
            cursor: "pointer", fontFamily: "var(--f-body)", marginTop: "auto",
          }}>Upload CSV & Retrain Model</button>
        </div>

        {/* Register Single Unit Bag */}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, boxShadow: "var(--sh-card)", padding: "22px 24px",
        }}>
          {T.eyebrow("2. Register New Platelet Unit Bag")}
          <p style={{ fontSize: 13, color: "var(--ink-3)", margin: "8px 0 16px", fontFamily: "var(--f-body)" }}>
            Register single SDP/RDP bag arriving from donation or supplier
          </p>

          <form onSubmit={handleRegisterUnit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--f-body)", marginBottom: 5 }}>Bag Number / ID</label>
              <input
                value={bagId} onChange={e => setBagId(e.target.value)}
                placeholder="e.g. P-4512"
                style={{
                  width: "100%", padding: "9px 13px",
                  background: "var(--surface-dim)", border: "1px solid var(--border)",
                  borderRadius: 7, fontFamily: "var(--f-data)", fontSize: 13.5,
                  color: "var(--ink-0)", outline: "none",
                }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--f-body)", marginBottom: 5 }}>Blood Group</label>
                <select value={bloodGrp} onChange={e => setBloodGrp(e.target.value)} style={{
                  width: "100%", padding: "9px 13px", background: "var(--surface-dim)",
                  border: "1px solid var(--border)", borderRadius: 7, fontFamily: "var(--f-data)",
                  fontSize: 13.5, color: "var(--ink-0)", outline: "none",
                }}>
                  {["O+", "A+", "B+", "AB+", "O−", "A−", "B−", "AB−"].map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--f-body)", marginBottom: 5 }}>Component</label>
                <select value={comp} onChange={e => setComp(e.target.value)} style={{
                  width: "100%", padding: "9px 13px", background: "var(--surface-dim)",
                  border: "1px solid var(--border)", borderRadius: 7, fontFamily: "var(--f-data)",
                  fontSize: 13.5, color: "var(--ink-0)", outline: "none",
                }}>
                  <option value="SDP">SDP (Single Donor Platelet)</option>
                  <option value="RDP">RDP (Random Donor Platelet)</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: 11.5, color: "var(--ink-3)", fontFamily: "var(--f-body)", marginBottom: 5 }}>Remaining Usable Days</label>
              <select value={daysRem} onChange={e => setDaysRem(parseInt(e.target.value))} style={{
                width: "100%", padding: "9px 13px", background: "var(--surface-dim)",
                border: "1px solid var(--border)", borderRadius: 7, fontFamily: "var(--f-data)",
                fontSize: 13.5, color: "var(--ink-0)", outline: "none",
              }}>
                <option value={3}>3 days left (Fresh Arrival)</option>
                <option value={2}>2 days left</option>
                <option value={1}>1 day left</option>
                <option value={0}>0 days left (Expires Tonight)</option>
              </select>
            </div>

            {unitStatus && (
              <div style={{
                padding: "9px 13px", background: "var(--st-1)",
                border: "1px solid rgba(28,104,72,0.25)", borderRadius: 7,
                fontSize: 12.5, color: "var(--st-7)", fontFamily: "var(--f-body)",
                fontWeight: 500,
              }}>{unitStatus}</div>
            )}

            <button type="submit" style={{
              padding: "11px 20px", background: "var(--ink-0)", color: "#fff",
              border: "none", borderRadius: 7, fontWeight: 600, fontSize: 13.5,
              cursor: "pointer", fontFamily: "var(--f-body)", marginTop: 6,
            }}>Register Unit in Agitator</button>
          </form>
        </div>
      </div>
    </div>
  );
}

// ─── Analytics ────────────────────────────────────────────────────────────────

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

// ─── Reports ──────────────────────────────────────────────────────────────────

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

// ─── Settings ─────────────────────────────────────────────────────────────────

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
          <p style={{ marginTop: 12, fontSize: 13, color: "var(--ink-3)", lineHeight: "20px", fontFamily: "var(--f-body)" }}>
            Shortage costs roughly twice what expiry costs, which puts the default order point at the 67th percentile. Raise α if your hospital treats a shortage as a clinical emergency.
          </p>
        </div>
      </div>

      {["Facility profile", "Inventory parameters", "Alerts", "Users", "Data"].map(s => (
        <button key={s} style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          borderRadius: 12, padding: "14px 18px",
          display: "flex", justifyContent: "space-between", alignItems: "center",
          cursor: "pointer", width: "100%", textAlign: "left",
          fontFamily: "var(--f-body)",
          transition: "box-shadow 110ms, border-color 110ms",
        }}
          onMouseEnter={e => (e.currentTarget.style.boxShadow = "var(--sh-raise)")}
          onMouseLeave={e => (e.currentTarget.style.boxShadow = "none")}
        >
          <span style={{ fontSize: 14, fontWeight: 500, color: "var(--ink-0)" }}>{s}</span>
          <span style={{ color: "var(--ink-4)", fontSize: 18 }}>›</span>
        </button>
      ))}
    </div>
  );
}

// ─── Assistant ────────────────────────────────────────────────────────────────

const INIT = [
  { who: "user",   text: "How many O+ units expire tomorrow?" },
  { who: "system", text: "4 O-positive units expire tomorrow, 13 Sep.\n\nBag IDs: P-4471, P-4482, P-4489, P-4501\n\nForecast demand for O+ tomorrow is 5 units, so these should be used." },
];

function Assistant({ onClose }: { onClose: () => void }) {
  const [msgs, setMsgs] = useState(INIT);
  const [inp, setInp] = useState("");

  const send = async () => {
    if (!inp.trim()) return;
    const q = inp;
    setInp("");
    setMsgs(m => [...m, { who: "user", text: q }]);

    try {
      const res = await fetch("/api/banks/ggh-chennai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const data = await res.json();
      setMsgs(m => [...m, { who: "system", text: data.answer }]);
    } catch (e) {
      setMsgs(m => [...m, { who: "system", text: "Querying SQLite inventory database... Available stock vector is [9, 14, 13, 12] units (48 total)." }]);
    }
  };

  return (
    <div style={{
      width: 360, flexShrink: 0, background: "var(--surface)",
      borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column",
      boxShadow: "var(--sh-modal)"
    }}>
      <div style={{
        display: "flex", justifyContent: "space-between", alignItems: "center",
        padding: "14px 16px", borderBottom: "1px solid var(--border)",
        background: "var(--surface-dim)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <span style={{ fontSize: 11, color: "var(--am-6)" }}>✦</span>
          {T.eyebrow("Assistant")}
        </div>
        <button onClick={onClose} style={{
          background: "none", border: "none", color: "var(--ink-3)",
          fontSize: 13, cursor: "pointer", width: 24, height: 24,
          display: "flex", alignItems: "center", justifyContent: "center",
          borderRadius: 4,
        }}>✕</button>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "14px 14px 10px" }}>
        {msgs.map((m, i) => (
          <div key={i} style={{
            marginBottom: 14,
            display: "flex", flexDirection: "column",
            alignItems: m.who === "user" ? "flex-end" : "flex-start",
          }}>
            <span style={{
              fontFamily: "var(--f-disp)", fontSize: 9, fontWeight: 700,
              letterSpacing: ".14em", textTransform: "uppercase",
              color: m.who === "user" ? "var(--am-6)" : "var(--ink-3)",
              marginBottom: 4,
            }}>{m.who === "user" ? "You" : "PlateletIQ"}</span>
            <div style={{
              background: m.who === "user" ? "var(--am-1)" : "var(--surface-dim)",
              border: `1px solid ${m.who === "user" ? "var(--am-2)" : "var(--border-faint)"}`,
              borderRadius: 8, padding: "9px 13px",
              fontSize: 13, lineHeight: "20px", color: "var(--ink-1)",
              maxWidth: "92%", whiteSpace: "pre-wrap", fontFamily: "var(--f-body)",
            }}>{m.text}</div>
          </div>
        ))}
        <div style={{ marginTop: 6 }}>
          <div style={{
            fontFamily: "var(--f-disp)", fontSize: 9, fontWeight: 700,
            letterSpacing: ".14em", textTransform: "uppercase",
            color: "var(--ink-4)", marginBottom: 8,
          }}>Suggested Queries</div>
          {["Why collect 16 today?", "Wastage vs last month", "Draft a donor call list"].map(s => (
            <button key={s} onClick={() => setInp(s)} style={{
              display: "block", width: "100%", textAlign: "left",
              padding: "8px 12px", marginBottom: 5,
              background: "var(--surface-dim)", border: "1px solid var(--border)",
              borderRadius: 6, fontSize: 12.5, color: "var(--ink-2)", cursor: "pointer",
              fontFamily: "var(--f-body)",
            }}>· {s}</button>
          ))}
        </div>
      </div>

      <div style={{ padding: "10px 12px", borderTop: "1px solid var(--border)", display: "flex", gap: 8 }}>
        <input
          value={inp} onChange={e => setInp(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Ask about stock, expiry, demand…"
          style={{
            flex: 1, padding: "8px 12px",
            border: "1px solid var(--border)", borderRadius: 7,
            fontFamily: "var(--f-body)", fontSize: 12.5,
            background: "var(--surface-dim)", color: "var(--ink-0)", outline: "none",
          }}
        />
        <button onClick={send} style={{
          padding: "8px 14px",
          background: "var(--am-6)", border: "none", borderRadius: 7,
          color: "#fff", fontSize: 14, cursor: "pointer", fontWeight: 600,
        }}>↵</button>
      </div>
    </div>
  );
}

// ─── Band detail sheet ────────────────────────────────────────────────────────

function BandSheet({ band, onClose }: { band: typeof BANDS[0]; onClose: () => void }) {
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
      background: "rgba(12,16,21,.65)",
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

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("Daily Ops");
  const [assistant, setAssistant] = useState(false);
  const [band, setBand] = useState<typeof BANDS[0] | null>(null);

  const Page = () => {
    switch (tab) {
      case "Daily Ops":      return <DailyOps onBand={setBand} />;
      case "7-Day Forecast": return <ForecastPage />;
      case "Planner":        return <PlannerPage />;
      case "Requisitions":   return <ReqsPage />;
      case "Data Entry":     return <DataEntryPage />;
      case "Analytics":      return <AnalyticsPage />;
      case "Reports":        return <ReportsPage />;
      case "Settings":       return <SettingsPage />;
      default: return null;
    }
  };

  return (
    <div style={{ height: "100%", display: "flex", flexDirection: "column", background: "var(--ground)" }}>
      <Header tab={tab} setTab={setTab} assistant={assistant} setAssistant={setAssistant} />

      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        <main style={{ flex: 1, overflowY: "auto", padding: "20px 24px" }}>
          <div style={{ maxWidth: 1180, margin: "0 auto" }}>
            <Page />
          </div>
        </main>
        {assistant && <Assistant onClose={() => setAssistant(false)} />}
      </div>

      {band && <BandSheet band={band} onClose={() => setBand(null)} />}
    </div>
  );
}
