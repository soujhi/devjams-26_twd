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
        ("Jun", 1.35, 384, 4.6, "up"),
        ("Jul", 1.93, 416, 5.1, "up"),
        ("Aug", 0.98, 364, 4.3, "hold"),
        ("Sep", 0.69, 348, 4.0, "dn"),
        ("Oct", 0.79, 353, 4.1, "dn"),
        ("Nov", 1.05, 367, 4.3, "hold"),
    ]
    rows = []
    for mo, dengue, base_needed, camps, dir_val in months_raw:
        surge = round(1.0 + bridge_f * (dengue - 1.0), 2)
        collect = int(round(base_needed * surge))
        rows.append(CollectionPlanRow(
            mo=mo, dengue=dengue, surge=surge,
            needed=base_needed, collect=collect,
            camps=camps, dir=dir_val
        ))
    return rows

def validate_opt4_release_gate(simulated_waste: float, simulated_shortage: float) -> bool:
    """
    OPT-4 release gate: simulator fed reference publication forecasts at own alpha
    must return within 0.3 percentage points of 4.93% waste / 2.02% shortage.
    """
    target_waste, target_shortage = 4.93, 2.02
    return (abs(simulated_waste - target_waste) <= 0.3 and 
            abs(simulated_shortage - target_shortage) <= 0.3)
