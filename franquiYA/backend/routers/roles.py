from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.user import User
from models.role import Role
from schemas import Role, RoleCreate
from auth import get_current_active_user

router = APIRouter(prefix="/roles", tags=["roles"])

@router.get("", response_model=list[Role])
def get_roles(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    roles = db.query(Role).filter(
        Role.franchise_id == current_user.franchise_id,
        Role.is_active == True
    ).all()
    return roles

@router.post("", response_model=Role)
def create_role(
    role: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_role = Role(
        name=role.name,
        color=role.color,
        permissions=role.permissions,
        franchise_id=current_user.franchise_id
    )
    db.add(db_role)
    db.commit()
    db.refresh(db_role)
    return db_role

@router.put("/{role_id}", response_model=Role)
def update_role(
    role_id: int,
    role: RoleCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_role = db.query(Role).filter(
        Role.id == role_id,
        Role.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    db_role.name = role.name
    db_role.color = role.color
    db_role.permissions = role.permissions
    
    db.commit()
    db.refresh(db_role)
    return db_role

@router.delete("/{role_id}")
def delete_role(
    role_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    db_role = db.query(Role).filter(
        Role.id == role_id,
        Role.franchise_id == current_user.franchise_id
    ).first()
    
    if not db_role:
        raise HTTPException(status_code=404, detail="Rol no encontrado")
    
    db_role.is_active = False
    db.commit()
    
    return {"message": "Rol eliminado"}
