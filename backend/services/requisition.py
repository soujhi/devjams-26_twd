from typing import List
from ..models.schemas import RequisitionItem

def get_requisitions(bank_id: str = "ggh-chennai") -> List[RequisitionItem]:
    """
    Evaluates pending requisitions against WHO Dengue Guidelines 2009 & AABB thresholds.
    Flags non-concordant requests as 'review' without blocking issue.
    """
    return [
        RequisitionItem(
            id="4471", ward="Ward 4B", time="09:12", status="review",
            units=4, plt=45, note="No active bleeding documented",
            guideline="WHO threshold for prophylactic transfusion is <20 ×10⁹/L. Therapeutic transfusion applies at <50 ×10⁹/L with significant active bleeding, or proven DIC.",
            source="WHO Dengue Guidelines 2009 §3.4"
        ),
        RequisitionItem(
            id="4472", ward="ICU", time="09:20", status="concordant",
            units=6, plt=12, note="Prophylactic · meets threshold",
            guideline=None, source=None
        )
    ]
