from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class SupplierBase(BaseModel):
    name: str
    code: Optional[str] = None  # SAP code or similar
    contact_name: Optional[str] = None
    contact_email: Optional[EmailStr] = None
    contact_phone: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    cuit: Optional[str] = None
    notes: Optional[str] = None

class SupplierCreate(SupplierBase):
    franchise_id: Optional[int] = None

class SupplierUpdate(SupplierBase):
    is_active: Optional[bool] = None
    franchise_id: Optional[int] = None

class Supplier(SupplierBase):
    id: int
    is_active: bool
    franchise_id: Optional[int] = None
    created_at: datetime

    class Config:
        from_attributes = True
