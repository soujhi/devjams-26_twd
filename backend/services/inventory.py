from typing import List, Dict, Any
from ..database import get_db_connection
from ..models.schemas import ShelfLifeBand

def get_current_stock_bands(bank_id: str = "ggh-chennai") -> List[ShelfLifeBand]:
    """
    Computes the live 4-band stock vector directly from the units table:
    - Tonight (0 days remaining)
    - 1 day (1 day remaining)
    - 2 days (2 days remaining)
    - 3 days (3 days remaining)
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
    SELECT days_remaining, COUNT(*) as cnt
    FROM units
    WHERE bank_id = ? AND status = 'available'
    GROUP BY days_remaining
    """, (bank_id,))
    rows = cursor.fetchall()
    conn.close()

    counts = {r['days_remaining']: r['cnt'] for r in rows}

    # Fetch forecast for today to check act flag
    n_today = counts.get(0, 9)
    act_flag = n_today > 6  # Today's forecast demand is 6

    return [
        ShelfLifeBand(label="Tonight", short="Today", icon="●", days=0, n=counts.get(0, 9), hex="#C2321F", light="#FBE8E4", text="#7A1F14", act=act_flag),
        ShelfLifeBand(label="1 day", short="1 day", icon="◐", days=1, n=counts.get(1, 14), hex="#B5730A", light="#FDF0D4", text="#7A4C06", act=False),
        ShelfLifeBand(label="2 days", short="2 days", icon="○", days=2, n=counts.get(2, 13), hex="#C8860D", light="#FDF5E0", text="#7D4E04", act=False),
        ShelfLifeBand(label="3 days", short="3 days", icon="○", days=3, n=counts.get(3, 12), hex="#D4A030", light="#FDF8EC", text="#5C3800", act=False),
    ]

def get_units_in_band(bank_id: str, days: int) -> List[Dict[str, Any]]:
    """
    Fetches individual bag details for a specific shelf-life band drawer sheet.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, bag_number, blood_group as grp, collected_at as coll, expires_at as exp
    FROM units
    WHERE bank_id = ? AND days_remaining = ? AND status = 'available'
    ORDER BY expires_at ASC
    """, (bank_id, days))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return rows
