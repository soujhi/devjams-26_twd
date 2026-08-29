import os
import pandas as pd
import numpy as np

DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "research_pipeline_data.csv")

def load_research_dataset() -> pd.DataFrame:
    """
    Loads the validated ML research dataset containing out-of-sample predictions,
    actual demand, LASSO point predictions, raw q67, and conformal q67 order points.
    Strictly preserves temporal ordering.
    """
    df = pd.read_csv(DATA_PATH)
    df['date'] = pd.to_datetime(df['date'])
    df = df.sort_values('date').reset_index(drop=True)
    return df

def build_lag_features(df: pd.DataFrame) -> pd.DataFrame:
    """
    Constructs 30 lag and calendar features with strict .shift(1) no-leakage discipline.
    """
    df = df.copy()
    
    # Target lags
    for lag in range(1, 15):
        df[f'actual_lag_{lag}'] = df['actual'].shift(lag)
        
    # Rolling aggregations (computed with .shift(1) to avoid leaking current day)
    shifted_actual = df['actual'].shift(1)
    df['roll_mean_7'] = shifted_actual.rolling(window=7, min_periods=1).mean()
    df['roll_std_7']  = shifted_actual.rolling(window=7, min_periods=1).std().fillna(0)
    df['roll_mean_14'] = shifted_actual.rolling(window=14, min_periods=1).mean()
    df['roll_mean_28'] = shifted_actual.rolling(window=28, min_periods=1).mean()
    
    # Calendar features
    df['dayofweek'] = df['date'].dt.dayofweek
    df['is_weekend'] = df['dayofweek'].isin([5, 6]).astype(int)
    df['month'] = df['date'].dt.month
    
    return df.dropna().reset_index(drop=True)
