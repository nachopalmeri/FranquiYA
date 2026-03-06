from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import datetime
import re

class ProductBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    category: str = Field(..., min_length=1, max_length=100)
    unit: str = "7.8kg"
    current_stock: float = Field(default=0, ge=0)
    min_stock: float = Field(default=5, ge=0)
    unit_price: float = Field(default=0, ge=0)

    @field_validator('unit')
    @classmethod
    def validate_unit(cls, v):
        valid_units = ['7.8kg', '1lt', '1kg', '2kg', '3kg', '4kg', '5kg', 'uni', 'pack', 'cm3']
        if v.lower() not in valid_units:
            raise ValueError(f'Unidad inválida. Opciones: {", ".join(valid_units)}')
        return v

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
