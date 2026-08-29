from typing import List, Dict, Any
from ..database import get_db_connection
from ..models.schemas import RequisitionItem

def get_requisitions(bank_id: str = "ggh-chennai") -> List[RequisitionItem]:
    """
    Fetches requisitions directly from SQLite database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    SELECT id, ward, requested_at as time, status, units_requested as units,
           platelet_count as plt, note, guideline, source
    FROM requisitions
    WHERE bank_id = ?
    ORDER BY requested_at ASC
    """, (bank_id,))
    rows = [dict(r) for r in cursor.fetchall()]
    conn.close()
    return [RequisitionItem(**r) for r in rows]

def mark_requisition_issued(bank_id: str, req_id: str, reason: str = "Issued anyway by technician") -> bool:
    """
    Updates requisition status to issued in SQLite database.
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("""
    UPDATE requisitions
    SET status = 'issued', note = ?
    WHERE id = ? AND bank_id = ?
    """, (reason, req_id, bank_id))
    conn.commit()
    conn.close()
    return True
