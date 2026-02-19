from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from database import get_db
from models.user import User
from models.product import Product
from schemas import Product as ProductSchema, StockAlert, DashboardStats
from auth import get_current_active_user

router = APIRouter(prefix="/stock", tags=["stock"])

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    current_stock: Optional[float] = None
    min_stock: Optional[float] = None
    unit_price: Optional[float] = None
    is_active: Optional[bool] = None

@router.get("", response_model=List[ProductSchema])
def list_products(
    category: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    query = db.query(Product).filter(Product.franchise_id == current_user.franchise_id)
    if category:
        query = query.filter(Product.category == category)
    return query.all()

@router.get("/alerts", response_model=List[StockAlert])
def get_stock_alerts(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    products = db.query(Product).filter(
        Product.franchise_id == current_user.franchise_id,
        Product.is_active == True
    ).all()
    
    alerts = []
    for product in products:
        if product.current_stock <= 0:
            alerts.append(StockAlert(
                product=ProductSchema.model_validate(product),
                status="critical",
                message="Sin stock - Reponer urgente"
            ))
        elif product.current_stock <= product.min_stock:
            alerts.append(StockAlert(
                product=ProductSchema.model_validate(product),
                status="low",
                message=f"Stock bajo - Mínimo: {product.min_stock}"
            ))
    
    return alerts

@router.get("/{product_id}", response_model=ProductSchema)
def get_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.franchise_id == current_user.franchise_id
    ).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return ProductSchema.model_validate(product)

@router.put("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    product = db.query(Product).filter(
        Product.id == product_id,
        Product.franchise_id == current_user.franchise_id
    ).first()
    
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return ProductSchema.model_validate(product)
