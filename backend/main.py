from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional

from .models.schemas import (
    BankConfig, ShelfLifeBand, ForecastQuantiles,
    RecommendationResponse, ConfirmRequest, AdjustRequest,
    RequisitionItem, CollectionPlanRow, NABHReport
)
from .services.inventory import get_current_stock_bands, compute_inventory_kpis
from .services.forecast import generate_7day_forecast, generate_recommendation
from .services.optimizer import generate_collection_plan
from .services.requisition import get_requisitions

from .pipeline.data_loader import load_research_dataset
from .pipeline.lasso_model import evaluate_predictions, get_forecast_horizon_data
from .pipeline.inventory_simulator import run_inventory_simulation

app = FastAPI(
    title="PlateletIQ API",
    description="Predictive Platelet Inventory Management Decision Support API backed by validated LASSO ML Pipeline",
    version="1.0.0"
)

# Enable CORS for frontend Vite dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global in-memory config state
config_db = BankConfig()
audit_log_db = []

@app.get("/")
def root():
    return {
        "message": "PlateletIQ Predictive Inventory Management API is running",
        "docs": "http://localhost:8000/docs",
        "health": "http://localhost:8000/api/health",
        "shelf_life_stock": "http://localhost:8000/api/banks/ggh-chennai/stock/shelf-life",
        "recommendation": "http://localhost:8000/api/banks/ggh-chennai/recommendation",
        "forecast": "http://localhost:8000/api/banks/ggh-chennai/forecast?days=7",
        "requisitions": "http://localhost:8000/api/banks/ggh-chennai/requisitions",
        "collection_plan": "http://localhost:8000/api/banks/ggh-chennai/plan?f=0.15"
    }

@app.post("/auth/login")
def login():
    return {
        "token": "mock-jwt-token-eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9",
        "token_type": "bearer",
        "user": {
            "id": "RK",
            "name": "R. Kumar",
            "role": "technician",
            "bank_id": "ggh-chennai"
        }
    }

@app.get("/api/health")
def health_check():
    return {"status": "ok", "product": "PlateletIQ", "version": "1.0.0"}

@app.get("/api/pipeline/benchmark")
def get_pipeline_benchmark():
    """
    Returns the exact research simulation benchmark table:
    - 7-day MA (current practice): waste 6.33%, shortage 7.40%
    - Production point forecast: waste 3.25%, shortage 3.04%
    - Conformal q67: waste 4.66%, shortage 4.68%
    """
    return run_inventory_simulation()

@app.get("/api/pipeline/metrics")
def get_pipeline_metrics():
    """
    Returns validated model metrics (MAPE, MASE, Quantile coverage).
    """
    df = load_research_dataset()
    return evaluate_predictions(df)

@app.get("/api/pipeline/predictions")
def get_pipeline_predictions(limit: int = Query(30, ge=1, le=1000)):
    """
    Returns out-of-sample prediction trajectories from the research dataset.
    """
    df = load_research_dataset()
    recent = df.tail(limit).copy()
    recent['date'] = recent['date'].dt.strftime('%Y-%m-%d')
    return recent.to_dict(orient='records')

@app.get("/api/banks/{bank_id}/config", response_model=BankConfig)
def get_bank_config(bank_id: str):
    return config_db

@app.patch("/api/banks/{bank_id}/config", response_model=BankConfig)
def update_bank_config(bank_id: str, alpha: Optional[float] = None, bridge_f: Optional[float] = None):
    if alpha is not None:
        config_db.alpha_safety_stock = alpha
    if bridge_f is not None:
        config_db.bridge_f = bridge_f
    audit_log_db.append({"action": "UPDATE_CONFIG", "bank_id": bank_id, "alpha": alpha, "bridge_f": bridge_f})
    return config_db

@app.get("/api/banks/{bank_id}/stock/shelf-life", response_model=List[ShelfLifeBand])
def get_stock_shelf_life(bank_id: str):
    return get_current_stock_bands(bank_id)

@app.get("/api/banks/{bank_id}/forecast", response_model=List[ForecastQuantiles])
def get_forecast(bank_id: str, days: int = Query(7, ge=1, le=14)):
    return generate_7day_forecast(bank_id)

@app.get("/api/banks/{bank_id}/recommendation", response_model=RecommendationResponse)
def get_recommendation(bank_id: str):
    return generate_recommendation(bank_id)

@app.post("/api/banks/{bank_id}/recommendation/confirm")
def confirm_rec(bank_id: str, req: ConfirmRequest):
    audit_log_db.append({"action": "CONFIRM_RECOMMENDATION", "verb": req.verb, "quantity": req.quantity, "user": req.confirmed_by})
    return {"status": "success", "message": f"Confirmed {req.verb} {req.quantity} by {req.confirmed_by}"}

@app.post("/api/banks/{bank_id}/recommendation/adjust")
def adjust_rec(bank_id: str, req: AdjustRequest):
    audit_log_db.append({"action": "ADJUST_RECOMMENDATION", "verb": req.verb, "quantity": req.quantity, "reason": req.adjust_reason, "user": req.adjusted_by})
    return {"status": "success", "message": f"Adjusted to {req.quantity} units"}

@app.get("/api/banks/{bank_id}/requisitions", response_model=List[RequisitionItem])
def get_bank_requisitions(bank_id: str):
    return get_requisitions(bank_id)

@app.post("/api/banks/{bank_id}/requisitions/{req_id}/issue")
def issue_requisition(bank_id: str, req_id: str, reason: Optional[str] = "Issued by technician"):
    audit_log_db.append({"action": "ISSUE_REQUISITION", "bank_id": bank_id, "req_id": req_id, "reason": reason})
    return {"status": "success", "message": f"Requisition #{req_id} issued cleanly.", "req_id": req_id}

@app.post("/api/banks/{bank_id}/assistant")
def query_assistant(bank_id: str, payload: dict):
    question = payload.get("question", "")
    q_lower = question.lower()
    
    if "expire" in q_lower or "o+" in q_lower:
        ans = "4 O-positive units expire tomorrow, 13 Sep.\n\nBag IDs: P-4471, P-4482, P-4489, P-4501\n\nForecast demand for O+ tomorrow is 5 units, so these should be used."
    elif "why collect" in q_lower or "16" in q_lower:
        ans = "Recommended order quantity is 16 units based on Newsvendor critical fractile tau* = 0.67 (67th percentile of forecast demand). The 7-day moving average is up 18% and Wednesday is a peak demand day."
    elif "wastage" in q_lower:
        ans = "Current 30-day wastage rate is 3.8%, down from 9.6% baseline. Waste peaks on Monday (4.38/day) and Wednesday (3.25/day) because units collected before weekends outdate when demand drops."
    else:
        ans = f"Analyzing blood bank database for '{question}'... Current stock is 48 units (9 expiring today). Baseline 7-day demand is 108 units."
        
    return {"answer": ans, "question": question}

@app.get("/api/banks/{bank_id}/plan", response_model=List[CollectionPlanRow])
def get_collection_plan(bank_id: str, f: float = Query(0.15, ge=0.05, le=0.30)):
    return generate_collection_plan(bridge_f=f)

@app.get("/api/banks/{bank_id}/reports/nabh", response_model=NABHReport)
def get_nabh_reports(bank_id: str):
    return NABHReport()

@app.get("/api/banks/{bank_id}/audit")
def get_audit_logs(bank_id: str):
    return {"logs": audit_log_db}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
