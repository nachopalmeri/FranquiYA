from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from pydantic import BaseModel
from database import get_db
from models.user import User
from models.franchise import Franchise
from schemas import Franchise as FranchiseSchema
from auth import get_current_active_user

router = APIRouter(prefix="/franchise", tags=["franchise"])

class FranchiseUpdate(BaseModel):
    name: Optional[str] = None
    owner: Optional[str] = None
    cuit: Optional[str] = None
    address: Optional[str] = None
    city: Optional[str] = None
    province: Optional[str] = None
    weather_city: Optional[str] = None
    supplier: Optional[str] = None

@router.get("", response_model=FranchiseSchema)
def get_franchise(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    franchise = db.query(Franchise).filter(Franchise.id == current_user.franchise_id).first()
    if not franchise:
        raise HTTPException(status_code=404, detail="Franquicia no encontrada")
    return FranchiseSchema.model_validate(franchise)

@router.put("", response_model=FranchiseSchema)
def update_franchise(
    data: FranchiseUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    franchise = db.query(Franchise).filter(Franchise.id == current_user.franchise_id).first()
    
    if not franchise:
        raise HTTPException(status_code=404, detail="Franquicia no encontrada")
    
    update_data = data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(franchise, key, value)
    
    db.commit()
    db.refresh(franchise)
    return FranchiseSchema.model_validate(franchise)
