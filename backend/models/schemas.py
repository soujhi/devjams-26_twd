from pydantic import BaseModel, Field
from typing import List, Optional

class BankConfig(BaseModel):
    id: str = "ggh-chennai"
    name: str = "Govt. General Hospital, Chennai"
    code: str = "GGH-CHE"
    shelf_life_days: int = 5
    lead_time_days: int = 1
    alpha_safety_stock: float = 13.0
    bridge_f: float = 0.15

class ShelfLifeBand(BaseModel):
    label: str
    short: str
    icon: str
    days: int
    n: int
    hex: str
    light: str
    text: str
    act: bool

class ForecastQuantiles(BaseModel):
    day: str
    date: str
    q50: int
    q67: int
    q90: int
    actual: int
    wknd: bool

class DriverContribution(BaseModel):
    dir: str
    text: str
    delta: str

class RecommendationResponse(BaseModel):
    verb: str  # COLLECT | PROCURE | HOLD
    quantity: int
    basis: str
    drivers: List[DriverContribution]
    model_version: str = "LASSO-v1.2"
    mape: str = "26.6%"
    timestamp: str = "08:40"

class ConfirmRequest(BaseModel):
    verb: str
    quantity: int
    confirmed_by: str = "RK"

class AdjustRequest(BaseModel):
    verb: str
    quantity: int
    adjust_reason: str
    adjusted_by: str = "RK"

class RequisitionItem(BaseModel):
    id: str
    ward: str
    time: str
    status: str  # review | concordant
    units: int
    plt: int
    note: str
    guideline: Optional[str] = None
    source: Optional[str] = None

class CollectionPlanRow(BaseModel):
    mo: str
    dengue: float
    surge: float
    needed: int
    collect: int
    camps: float
    dir: str  # up | dn | hold
    camp_window: Optional[str] = None
    explanation: Optional[str] = None

class NABHReport(BaseModel):
    wastage_rate: str = "3.8%"
    shortage_rate: str = "3.6%"
    tat_emergency: str = "28 min"
    issue_rate: str = "99.4%"
