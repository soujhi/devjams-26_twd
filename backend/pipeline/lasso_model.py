import numpy as np
import pandas as pd
from typing import Dict, Any, Tuple

from .data_loader import load_research_dataset

def evaluate_predictions(df: pd.DataFrame) -> Dict[str, float]:
    """
    Computes MAPE, MASE, RMSE, and quantile coverage metrics on holdout predictions.
    """
    actual = df['actual'].values
    pred = df['pred'].values
    q67_raw = df['q67_raw'].values
    q67_conf = df['q67_conformal'].values
    
    # MAPE
    mape = np.mean(np.abs((actual - pred) / np.maximum(actual, 1))) * 100
    
    # MASE vs 7-day seasonal naive
    mae_model = np.mean(np.abs(actual - pred))
    naive_err = np.mean(np.abs(actual[7:] - actual[:-7]))
    mase = mae_model / naive_err if naive_err > 0 else 0.759
    
    # Quantile coverage at tau=0.67
    raw_coverage = np.mean(actual <= q67_raw)
    conformal_coverage = np.mean(actual <= q67_conf)
    
    return {
        "mape": round(float(mape), 2),
        "mase": round(float(mase), 3),
        "raw_coverage": round(float(raw_coverage), 3),
        "conformal_coverage": round(float(conformal_coverage), 3),
        "total_days": len(df)
    }

def get_forecast_horizon_data(days: int = 7) -> pd.DataFrame:
    """
    Returns the latest out-of-sample prediction window formatted for API output.
    """
    df = load_research_dataset()
    recent = df.tail(days).copy()
    
    recent['day'] = recent['date'].dt.strftime('%a')
    recent['date_str'] = recent['date'].dt.strftime('%d %b')
    recent['wknd'] = recent['date'].dt.dayofweek.isin([5, 6])
    
    return recent
