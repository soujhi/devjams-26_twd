export interface ShelfBand {
  label: string;
  short: string;
  icon: string;
  days: number;
  n: number;
  hex: string;
  light: string;
  text: string;
  act: boolean;
}

export interface ForecastDay {
  day: string;
  date: string;
  q50: number;
  q67: number;
  q90: number;
  actual: number;
  wknd: boolean;
}

export interface Driver {
  dir: '↑' | '↓';
  text: string;
  delta: string;
}

export interface Requisition {
  id: string;
  ward: string;
  time: string;
  status: 'review' | 'concordant';
  units: number;
  plt: number;
  note: string;
  guideline: string | null;
  source: string | null;
}

export interface PlannerRow {
  mo: string;
  dengue: number;
  surge: number;
  needed: number;
  collect: number;
  camps: number;
  dir: 'up' | 'dn' | 'hold';
  camp_window?: string;
  explanation?: string;
}

export interface KPIItem {
  label: string;
  val: string;
  target: string;
  ok: boolean;
  note: string;
}

export interface UnitDetail {
  id: string;
  grp: string;
  coll: string;
  exp: string;
}

export interface Recommendation {
  verb: 'COLLECT' | 'PROCURE' | 'HOLD';
  quantity: number;
  basis: string;
  drivers: Driver[];
  timestamp: string;
  model_version: string;
  mape: string;
  confirmed?: boolean;
  confirmed_by?: string;
}
