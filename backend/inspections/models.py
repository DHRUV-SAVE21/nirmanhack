from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class AssignInspectorRequest(BaseModel):
    inspector_id: str
    deadline_date: datetime

class InspectionReportSubmit(BaseModel):
    claim_id: str
    visited_at: datetime
    geo_photos: List[str]
    loss_estimate: float
    remarks: str
    inspector_id: str

class GeneratePDFRequest(BaseModel):
    claim_id: str
    official_name: str
    signature_data: Optional[str] = None
