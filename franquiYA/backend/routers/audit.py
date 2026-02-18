from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from pydantic import BaseModel
from database import get_db
from models.user import User
from models.product import Product
from models.audit import StockAudit
from schemas import Product as ProductSchema
from auth import get_current_active_user

router = APIRouter(prefix="/audit", tags=["audit"])

class AuditItem(BaseModel):
    product_id: int
    counted_qty: float

class AuditSubmit(BaseModel):
    items: List[AuditItem]

@router.get("/products", response_model=List[ProductSchema])
def get_audit_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    return db.query(Product).filter(
        Product.franchise_id == current_user.franchise_id,
        Product.is_active == True
    ).order_by(Product.category, Product.name).all()

@router.post("/submit")
def submit_audit(
    data: AuditSubmit,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    audits = []
    for item in data.items:
        product = db.query(Product).filter(
            Product.id == item.product_id,
            Product.franchise_id == current_user.franchise_id
        ).first()
        
        if product:
            audit = StockAudit(
                product_id=item.product_id,
                system_qty=product.current_stock,
                counted_qty=item.counted_qty,
                difference=item.counted_qty - product.current_stock,
                audited_by=current_user.name
            )
            db.add(audit)
            audits.append(audit)
            
            product.current_stock = item.counted_qty
    
    db.commit()
    return {"message": f"Audit submitted with {len(audits)} items"}

@router.get("/history")
def get_audit_history(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    product_ids = [p.id for p in db.query(Product).filter(
        Product.franchise_id == current_user.franchise_id
    ).all()]
    
    return db.query(StockAudit).filter(
        StockAudit.product_id.in_(product_ids)
    ).order_by(StockAudit.audited_at.desc()).limit(50).all()
