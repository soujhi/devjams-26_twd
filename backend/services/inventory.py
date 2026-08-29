from typing import List
from ..models.schemas import ShelfLifeBand

def get_current_stock_bands(bank_id: str = "ggh-chennai") -> List[ShelfLifeBand]:
    """
    Computes the 4-band live stock vector by remaining shelf life:
    Expiring Today / 1d / 2d / 3d
    """
    return [
        ShelfLifeBand(label="Tonight", short="Today", icon="●", days=0, n=9, hex="#C2321F", light="#FBE8E4", text="#7A1F14", act=True),
        ShelfLifeBand(label="1 day", short="1 day", icon="◐", days=1, n=14, hex="#B5730A", light="#FDF0D4", text="#7A4C06", act=False),
        ShelfLifeBand(label="2 days", short="2 days", icon="○", days=2, n=13, hex="#C8860D", light="#FDF5E0", text="#7D4E04", act=False),
        ShelfLifeBand(label="3 days", short="3 days", icon="○", days=3, n=12, hex="#D4A030", light="#FDF8EC", text="#5C3800", act=False),
    ]

def compute_inventory_kpis(bank_id: str = "ggh-chennai"):
    return {
        "wastage_rate_30d": 0.0381,
        "shortage_rate_30d": 0.0364,
        "fill_rate": 0.9636,
        "mean_age_at_issue": 2.1  # days
    }
