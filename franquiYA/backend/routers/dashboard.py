from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from database import get_db
from models.user import User
from models.product import Product
from models.invoice import Invoice
from schemas import DashboardStats
from auth import get_current_active_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats", response_model=DashboardStats)
def get_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    products = db.query(Product).filter(
        Product.franchise_id == current_user.franchise_id,
        Product.is_active == True
    ).all()
    
    total_products = len(products)
    critical_count = sum(1 for p in products if p.current_stock <= 0)
    low_count = sum(1 for p in products if 0 < p.current_stock <= p.min_stock)
    
    pending_invoices = db.query(Invoice).filter(
        Invoice.franchise_id == current_user.franchise_id,
        Invoice.status == "pending"
    ).count()
    
    return DashboardStats(
        total_products=total_products,
        low_stock_count=low_count,
        critical_stock_count=critical_count,
        pending_invoices=pending_invoices
    )
