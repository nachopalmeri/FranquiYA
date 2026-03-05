from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.product import Product
from schemas.product import ProductCreate, Product as ProductSchema
from auth import get_admin_user, get_current_active_user

router = APIRouter(
    prefix="/products",
    tags=["products"],
)

@router.post("/", response_model=ProductSchema)
def create_product(
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    user=Depends(get_admin_user)
):
    # Admin can only create for their own franchise
    franchise_id = product_in.dict().get("franchise_id") or getattr(user, "franchise_id", None)
    if user.role == "admin":
        franchise_id = user.franchise_id
    elif user.role == "superadmin":
        if not franchise_id:
            raise HTTPException(status_code=400, detail="franchise_id required for superadmin")
    if not franchise_id:
        raise HTTPException(status_code=400, detail="franchise_id is required")

    # Prevent duplicate product name within the same franchise
    existing = db.query(Product).filter(
        Product.franchise_id == franchise_id,
        Product.name == product_in.name
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Product name already exists for this franchise")

    db_product = Product(**product_in.dict(), franchise_id=franchise_id)
    db.add(db_product)
    db.commit()
    db.refresh(db_product)
    return db_product

@router.get("/", response_model=List[ProductSchema])
def list_products(db: Session = Depends(get_db), user = Depends(get_current_active_user)):
    query = db.query(Product)
    # Superadmin sees all, others see only their franchise
    if user.role != "superadmin":
        query = query.filter(Product.franchise_id == user.franchise_id)
    return query.all()

@router.get("/{product_id}", response_model=ProductSchema)
def get_product(product_id: int, db: Session = Depends(get_db), user = Depends(get_current_active_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if user.role != "superadmin" and product.franchise_id != user.franchise_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    return product

@router.put("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: int,
    product_in: ProductCreate,
    db: Session = Depends(get_db),
    user = Depends(get_admin_user)
):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if user.role != "superadmin" and product.franchise_id != user.franchise_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    # Enforce duplicate check (except self)
    franchise_id = product.franchise_id
    duplicate = db.query(Product).filter(
        Product.franchise_id == franchise_id,
        Product.name == product_in.name,
        Product.id != product.id
    ).first()
    if duplicate:
        raise HTTPException(status_code=409, detail="Product name already exists for this franchise")
    # Update fields
    for field, value in product_in.dict().items():
        setattr(product, field, value)
    db.commit()
    db.refresh(product)
    return product

@router.delete("/{product_id}", status_code=204)
def delete_product(product_id: int, db: Session = Depends(get_db), user = Depends(get_admin_user)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if user.role != "superadmin" and product.franchise_id != user.franchise_id:
        raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(product)
    db.commit()
    return None
