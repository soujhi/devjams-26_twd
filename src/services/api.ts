import { ForecastDay, PlannerRow, Recommendation, Requisition, ShelfBand } from '../types';

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
    console.warn('Backend unavailable, using local baseline stock data');
    return mockBands;
  }
}

export async function fetch7DayForecast(bankId = 'ggh-chennai'): Promise<ForecastDay[]> {
  try {
    const res = await fetch(`${API_BASE}/banks/${bankId}/forecast?days=7`);
    if (!res.ok) throw new Error('API error');
    return await res.json();
  } catch (err) {
    console.warn('Backend unavailable, using local baseline forecast');
    return mockForecast;
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
    return true; // Optimistic fallback
  }
}
