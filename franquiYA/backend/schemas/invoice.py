from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class InvoiceLineBase(BaseModel):
    raw_name: str
    matched_name: Optional[str] = None
    quantity: float
    unit: str = "7.8kg"
    unit_price: float
    previous_price: Optional[float] = None
    price_change_pct: float = 0
    total: float
    is_matched: bool = False
    approved: bool = False
    product_id: Optional[int] = None

class InvoiceLine(InvoiceLineBase):
    id: int
    invoice_id: int

    class Config:
        from_attributes = True

class InvoiceBase(BaseModel):
    number: str
    date: datetime
    supplier: str = "Helacor S.A."
    total: float

class Invoice(InvoiceBase):
    id: int
    status: str
    raw_text: Optional[str] = None
    franchise_id: int
    created_at: datetime
    lines: List[InvoiceLine] = []

    class Config:
        from_attributes = True

class ApproveLineRequest(BaseModel):
    product_id: Optional[int] = None
