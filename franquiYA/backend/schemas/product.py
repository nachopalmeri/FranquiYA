from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ProductBase(BaseModel):
    name: str
    category: str
    unit: str = "7.8kg"
    current_stock: float = 0
    min_stock: float = 5
    unit_price: float = 0

class ProductCreate(ProductBase):
    pass

class Product(ProductBase):
    id: int
    previous_price: Optional[float] = None
    price_change_pct: Optional[float] = None
    image_url: Optional[str] = None
    is_active: bool
    franchise_id: int

    class Config:
        from_attributes = True

class StockAlert(BaseModel):
    product: Product
    status: str
    message: str

class DashboardStats(BaseModel):
    total_products: int
    low_stock_count: int
    critical_stock_count: int
    pending_invoices: int
    last_audit_date: Optional[datetime] = None
