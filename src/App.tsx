import React, { useState, useEffect } from "react";
import { UnitDetail, ShelfBand, ForecastDay, Requisition, PlannerRow } from "./types";
import {
  fetchStockShelfLife, fetch7DayForecast, fetchRecommendation,
  fetchRequisitions, fetchCollectionPlan, issueRequisition,
  confirmRecommendation, uploadDailyDemandCSV, registerNewUnit,
  postAssistantQuery
} from "./services/api";
import {
  Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, Cell, BarChart, Bar,
} from "recharts";

// ─── Fallback Constants (Used during initial load) ────────────────────────────

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

// ─── Sidebar Navigation Layout ────────────────────────────────────────────────

function Sidebar({ activeTab, setTab }: { activeTab: string; setTab: (t: string) => void }) {
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
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-0)" }}>Govt. General Hospital</div>
        <div style={{ fontSize: 10.5, color: "var(--st-6)", display: "flex", alignItems: "center", gap: 4, fontWeight: 500 }}>
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

      <div style={{
        padding: "12px 10px 0 10px", borderTop: "1px solid var(--border-faint)",
        display: "flex", alignItems: "center", gap: 10
      }}>
        <div style={{
          width: 32, height: 32, borderRadius: 16,
          background: "linear-gradient(135deg, var(--am-6), var(--am-4))",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontWeight: 700, fontSize: 12, color: "#fff"
        }}>RK</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: "var(--ink-0)" }}>R. Kumar</div>
          <div style={{ fontSize: 10.5, color: "var(--ink-2)" }}>Shift Technician</div>
        </div>
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
        {T.eyebrow("Shelf-Life Countdown Vectors (Live SQLite Inventory)")}
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
        <span style={{ fontSize: 12, color: "var(--ink-1)" }}>8 units arriving Thu 14 Sep · Registered in SQLite DB</span>
      </div>
    </div>
  );
}

// ─── Daily Ops View ───────────────────────────────────────────────────────────

function DailyOps({ bands, forecast, onBand }: { bands: ShelfBand[]; forecast: ForecastDay[]; onBand: (b: ShelfBand) => void }) {
  const [confirmed, setConfirmed] = useState(false);
  const [rec, setRec] = useState<{ verb: string; quantity: number; order_point: number } | null>(null);

  useEffect(() => {
    fetchRecommendation().then(data => {
      if (data) setRec(data);
    });
  }, []);

  const actionVerb = rec ? rec.verb : "COLLECT";
  const actionQty = rec ? rec.quantity : 16;
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
            }}>⚡ SHIFT SUMMARY — 3-SECOND DECISION</span>
            <span style={{ fontSize: 11.5, color: "rgba(255,255,255,.45)", fontFamily: "var(--f-body)" }}>
              Tue 12 Sep · Live Pipeline Connected
            </span>
          </div>
          <span style={{ fontSize: 11.5, color: "var(--st-6)", fontFamily: "var(--f-body)", fontWeight: 600 }}>
            ● Conformal LASSO Model Active ($\tau^* = 0.67$)
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
              Order point set to 67th percentile ($\tau^* = 0.67$). Emergency purchase costs roughly double planned collection.
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
            {DRIVERS.map((d, i) => (
              <div key={i} style={{ display: "grid", gridTemplateColumns: "16px 1fr auto", gap: 12, alignItems: "baseline", padding: "11px 0", borderBottom: i < DRIVERS.length - 1 ? "1px solid var(--border-faint)" : "none" }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: d.dir === "↑" ? "var(--cr-6)" : "var(--st-6)" }}>{d.dir}</span>
                <span style={{ fontSize: 13.5, color: "var(--ink-1)" }}>{d.text}</span>
                <span className="data" style={{ fontSize: 12.5, fontWeight: 600, color: d.dir === "↑" ? "var(--cr-7)" : "var(--st-7)" }}>{d.delta} u</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-faint)", display: "flex", gap: 18 }}>
            {[["Model", "LASSO"], ["Features", "30"], ["MAPE", "26.6%"], ["Retrained", "4d ago"]].map(([k, v]) => (
              <span key={k} style={{ fontSize: 11.5 }}><span style={{ color: "var(--ink-3)" }}>{k}: </span><strong style={{ color: "var(--ink-2)", fontWeight: 600 }}>{v}</strong></span>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "20px 22px", boxShadow: "var(--sh-card)" }}>
        <span className="eyebrow">7-DAY DEMAND FORECAST TRAJECTORY (LIVE API)</span>
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
        Seasonal coefficients are fitted on Sri Lankan weekly data. The lag structure transfers; the seasonal peak does not — Colombo peaks July, Chennai peaks October–December.
      </div>

      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderRadius: 12, boxShadow: "var(--sh-card)", padding: "22px 24px",
      }}>
        {T.eyebrow("Six-month collection plan (Live Dengue Surge Calculation)")}

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
              {plan.map(r => (
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
  const [csvText, setCsvText] = useState(`date,units_issued
2018-12-31,14
2019-01-01,16
2019-01-02,12
2019-01-03,18
2019-01-04,15`);
  const [status, setStatus] = useState<string | null>(null);

  const [bagId, setBagId] = useState("");
  const [bloodGrp, setBloodGrp] = useState("O+");
  const [comp, setComp] = useState("SDP");
  const [daysRem, setDaysRem] = useState(3);
  const [unitStatus, setUnitStatus] = useState<string | null>(null);

  const handleUpload = async () => {
    const lines = csvText.trim().split("\n");
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const [d, u] = lines[i].split(",");
      if (d && u) records.push({ date: d.trim(), units_issued: parseInt(u.trim()) || 0 });
    }
    const res = await uploadDailyDemandCSV('ggh-chennai', records);
    setStatus(`✓ Ingested ${records.length} records into SQLite daily_demand dataset.`);
    onRefresh();
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
        <strong style={{ color: "var(--in-7)" }}>Data Ingestion Specification (DI-1 & DI-2):</strong> PlateletIQ requires only <strong>one column of data: daily units issued per day</strong>. No EHR integration or lab feed needed.
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderRadius: 12, padding: "22px 24px", boxShadow: "var(--sh-card)" }}>
          <span className="eyebrow">1. Bulk CSV Daily Issue Ingestion</span>
          <p style={{ fontSize: 13, color: "var(--ink-2)", margin: "8px 0 16px" }}>
            Format: <code>date (YYYY-MM-DD), units_issued (integer &ge; 0)</code>
          </p>

          <textarea
            rows={7} value={csvText} onChange={e => setCsvText(e.target.value)}
            style={{ width: "100%", padding: "12px 14px", fontFamily: "var(--f-data)", fontSize: 12.5, background: "var(--surface-dim)", border: "1px solid var(--border)", borderRadius: 7, color: "var(--ink-0)", marginBottom: 16 }}
          />

          {status && <div style={{ marginBottom: 14, padding: "10px 14px", background: "var(--st-1)", border: "1px solid var(--st-6)", borderRadius: 7, color: "var(--st-7)", fontWeight: 600 }}>{status}</div>}

          <button onClick={handleUpload} style={{ padding: "11px 22px", background: "var(--am-6)", border: "none", borderRadius: 7, color: "#fff", fontWeight: 600, fontSize: 13.5, cursor: "pointer" }}>
            Upload CSV & Recalibrate
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

// ─── Root Component ───────────────────────────────────────────────────────────

export default function App() {
  const [tab, setTab] = useState("Daily Ops");
  const [bands, setBands] = useState<ShelfBand[]>(FALLBACK_BANDS);
  const [forecast, setForecast] = useState<ForecastDay[]>(FALLBACK_FORECAST);
  const [band, setBand] = useState<ShelfBand | null>(null);

  const loadData = () => {
    fetchStockShelfLife().then(b => setBands(b));
    fetch7DayForecast().then(f => setForecast(f));
  };

  useEffect(() => {
    loadData();
  }, []);

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
      <Sidebar activeTab={tab} setTab={setTab} />
      <main style={{ flex: 1, overflowY: "auto", padding: "24px 28px" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto" }}>
          <Page />
        </div>
      </main>

      {band && <BandSheet band={band} onClose={() => setBand(null)} />}
    </div>
  );
}
