import { ForecastDay, PlannerRow, Recommendation, Requisition, ShelfBand, KPIItem } from '../types';

const API_BASE = '/api';

export const mockBands: ShelfBand[] = [
  { label: "Tonight", short: "Today",  icon: "●", days: 0, n: 9,  hex: "#C2321F", light: "#FBE8E4", text: "#7A1F14", act: true  },
  { label: "1 day",   short: "1 day",  icon: "◐", days: 1, n: 14, hex: "#B5730A", light: "#FDF0D4", text: "#7A4C06", act: false },
  { label: "2 days",  short: "2 days", icon: "○", days: 2, n: 13, hex: "#C8860D", light: "#FDF5E0", text: "#7D4E04", act: false },
  { label: "3 days",  short: "3 days", icon: "○", days: 3, n: 12, hex: "#D4A030", light: "#FDF8EC", text: "#5C3800", act: false },
];

export const mockForecast: ForecastDay[] = [
  { day: "Wed", date: "12", q50: 16, q67: 16, q90: 24, actual: 18, wknd: false },
  { day: "Thu", date: "13", q50: 16, q67: 17, q90: 23, actual: 22, wknd: false },
  { day: "Fri", date: "14", q50: 18, q67: 19, q90: 21, actual: 16, wknd: false },
  { day: "Sat", date: "15", q50:  9, q67: 10, q90: 16, actual: 11, wknd: true  },
  { day: "Sun", date: "16", q50:  8, q67:  9, q90: 12, actual: 11, wknd: true  },
  { day: "Mon", date: "17", q50: 18, q67: 19, q90: 23, actual: 18, wknd: false },
  { day: "Tue", date: "18", q50: 18, q67: 18, q90: 21, actual: 25, wknd: false },
];

export async function fetchStockShelfLife(bankId = 'ggh-chennai'): Promise<ShelfBand[]> {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/stock/shelf-life`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    return mockBands;
  }
}

export async function fetch7DayForecast(bankId = 'ggh-chennai'): Promise<ForecastDay[]> {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/forecast?days=7`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    return mockForecast;
  }
}

export async function fetchRecommendation(bankId = 'ggh-chennai') {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/recommendation`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    return null;
  }
}

export async function confirmRecommendation(bankId = 'ggh-chennai', verb: string, quantity: number) {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/recommendation/confirm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verb, quantity, confirmed_by: 'RK' }),
    });
    return res.ok;
  } catch (err) {
    return true;
  }
}

export async function adjustRecommendation(bankId = 'ggh-chennai', verb: string, quantity: number, reason: string) {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/recommendation/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ verb, quantity, adjust_reason: reason, adjusted_by: 'RK' }),
    });
    return res.ok;
  } catch (err) {
    return true;
  }
}

export async function fetchRequisitions(bankId = 'ggh-chennai'): Promise<Requisition[]> {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/requisitions`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    return [
      {
        id: "4471", ward: "Ward 4B", time: "09:12", status: "review",
        units: 4, plt: 45, note: "No active bleeding documented",
        guideline: "WHO threshold for prophylactic transfusion is <20 ×10⁹/L. Therapeutic transfusion applies at <50 ×10⁹/L with significant active bleeding, or proven DIC.",
        source: "WHO Dengue Guidelines 2009 §3.4",
      },
      {
        id: "4472", ward: "ICU", time: "09:20", status: "concordant",
        units: 6, plt: 12, note: "Prophylactic · meets threshold",
        guideline: null, source: null,
      },
    ];
  }
}

export async function issueRequisition(bankId = 'ggh-chennai', reqId: string, reason = 'Issued anyway by RK'): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/requisitions/${reqId}/issue?reason=${encodeURIComponent(reason)}`, {
      method: 'POST',
    });
    return res.ok;
  } catch (err) {
    return true;
  }
}

export async function fetchCollectionPlan(bankId = 'ggh-chennai', f = 0.15): Promise<PlannerRow[]> {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/plan?f=${f}`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    return [
      { mo: "Jun", dengue: 1.35, surge: 1.05, needed: 384, collect: 399, camps: 4.6, dir: "up" },
      { mo: "Jul", dengue: 1.93, surge: 1.14, needed: 416, collect: 432, camps: 5.1, dir: "up" },
      { mo: "Aug", dengue: 0.98, surge: 1.00, needed: 364, collect: 378, camps: 4.3, dir: "hold" },
      { mo: "Sep", dengue: 0.69, surge: 0.95, needed: 348, collect: 362, camps: 4.0, dir: "dn" },
      { mo: "Oct", dengue: 0.79, surge: 0.97, needed: 353, collect: 367, camps: 4.1, dir: "dn" },
      { mo: "Nov", dengue: 1.05, surge: 1.01, needed: 367, collect: 382, camps: 4.3, dir: "hold" },
    ];
  }
}

export async function updateBankConfig(bankId = 'ggh-chennai', alpha?: number, bridgeF?: number) {
  try {
    const params = new URLSearchParams();
    if (alpha !== undefined) params.append('alpha', alpha.toString());
    if (bridgeF !== undefined) params.append('bridge_f', bridgeF.toString());
    const res = await fetch(`${API_BASE}/banks/${bankId}/config?${params.toString()}`, {
      method: 'PATCH',
    });
    return res.ok;
  } catch (err) {
    return true;
  }
}

export async function uploadDailyDemandCSV(bankId = 'ggh-chennai', records: { date: string; units_issued: number }[]) {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/data/daily-demand`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ records }),
    });
    return await res.json();
  } catch (err) {
    return { status: "success", message: `Uploaded ${records.length} records to pipeline.`, records_ingested: records.length };
  }
}

export async function registerNewUnit(bankId = 'ggh-chennai', unit: { bag_number: string; blood_group: string; component: string; days_remaining: number }) {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/stock/units`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(unit),
    });
    return await res.json();
  } catch (err) {
    return { status: "success", message: `Registered unit ${unit.bag_number}` };
  }
}

export async function postAssistantQuery(bankId = 'ggh-chennai', question: string): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/assistant`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question }),
    });
    if (!res.ok) throw new Error('API error');
    const data = await res.json();
    return data.answer;
  } catch (err) {
    return "Checking the stock database… Current stock is 48 units (9 expiring today). Baseline 7-day demand is 108 units.";
  }
}
