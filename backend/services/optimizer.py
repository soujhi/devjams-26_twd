import math
from typing import List
from ..models.schemas import CollectionPlanRow

def calculate_critical_fractile(underage_cost: float = 2.0, overage_cost: float = 1.0) -> float:
    """
    Computes newsvendor critical fractile tau* = Cu / (Cu + Co)
    With emergency purchase costing ~2x planned unit, tau* = 2 / (2 + 1) = 0.67
    """
    return round(underage_cost / (underage_cost + overage_cost), 2)

def generate_collection_plan(bridge_f: float = 0.15) -> List[CollectionPlanRow]:
    """
    Horizon B 3-6 month collection schedule adjusted by bridge coefficient f:
    surge_multiplier(t) = 1 + f * (dengue_index(t) - 1)
    """
    months_raw = [
        ("Jun", 1.35, 384, 4.6, "up", "Jun 10 – Jun 18", "Moderate Dengue Surge (+5% demand)"),
        ("Jul", 1.93, 416, 5.1, "up", "Jul 12 – Jul 21", "Peak Dengue Season (+14% demand)"),
        ("Aug", 0.98, 364, 4.3, "hold", "Aug 14 – Aug 20", "Normal Baseline Operations"),
        ("Sep", 0.69, 348, 4.0, "dn", "Sep 15 – Sep 20", "Low Season (Reduce Camp Frequency)"),
        ("Oct", 0.79, 353, 4.1, "dn", "Oct 12 – Oct 18", "Post-Monsoon Baseline"),
        ("Nov", 1.05, 367, 4.3, "hold", "Nov 10 – Nov 16", "Normal Baseline Operations"),
    ]
    rows = []
    for mo, dengue, base_needed, camps, dir_val, window, expl in months_raw:
        surge = round(1.0 + bridge_f * (dengue - 1.0), 2)
        collect = int(round(base_needed * surge))
        rows.append(CollectionPlanRow(
            mo=mo, dengue=dengue, surge=surge,
            needed=base_needed, collect=collect,
            camps=camps, dir=dir_val,
            camp_window=window, explanation=expl
        ))
    return rows
