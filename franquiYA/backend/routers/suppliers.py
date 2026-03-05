from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from database import get_db
from models.supplier import Supplier
from schemas.supplier import SupplierCreate, Supplier, SupplierUpdate
from auth import get_admin_user, get_current_active_user

router = APIRouter(
    prefix="/suppliers",
    tags=["suppliers"],
)


@router.get("/", response_model=List[Supplier])
def list_suppliers(skip: int = 0, limit: int = 50, db: Session = Depends(get_db),
                  user=Depends(get_current_active_user)):
    # Superadmins ven todo, admins sólo franquicia propia
    query = db.query(Supplier)
    if hasattr(user, 'role') and user.role != 'superadmin':
        query = query.filter(Supplier.franchise_id == user.franchise_id)
    return query.offset(skip).limit(limit).all()


@router.get("/{supplier_id}", response_model=Supplier)
def get_supplier(supplier_id: int, db: Session = Depends(get_db),
                user=Depends(get_current_active_user)):
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if hasattr(user, 'role') and user.role != 'superadmin':
        if supplier.franchise_id != user.franchise_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    return supplier


@router.post("/", response_model=Supplier)
def create_supplier(supplier: SupplierCreate, 
                   db: Session = Depends(get_db),
                   user=Depends(get_admin_user)):
    # Solo admin/superadmin
    db_supplier = Supplier(**supplier.dict())
    # For admins, franchise_id is set to their own
    if hasattr(user, 'role') and user.role == 'admin':
        db_supplier.franchise_id = user.franchise_id
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.put("/{supplier_id}", response_model=Supplier)
def update_supplier(supplier_id: int, supplier: SupplierUpdate, 
                   db: Session = Depends(get_db),
                   user=Depends(get_admin_user)):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if hasattr(user, 'role') and user.role != 'superadmin':
        if db_supplier.franchise_id != user.franchise_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    for field, value in supplier.dict(exclude_unset=True).items():
        setattr(db_supplier, field, value)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.delete("/{supplier_id}", status_code=204)
def delete_supplier(supplier_id: int, 
                   db: Session = Depends(get_db),
                   user=Depends(get_admin_user)):
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    if hasattr(user, 'role') and user.role != 'superadmin':
        if db_supplier.franchise_id != user.franchise_id:
            raise HTTPException(status_code=403, detail="Not authorized")
    db.delete(db_supplier)
    db.commit()
    return
