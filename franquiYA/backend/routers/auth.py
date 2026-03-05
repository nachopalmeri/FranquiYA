from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from datetime import datetime
from database import get_db
from models.user import User
from models.franchise import Franchise
from models.product import Product
from schemas import User as UserSchema, LoginRequest, Token, SetupData, LoadProductsRequest, PublicRegisterRequest
from auth import (
    verify_password,
    get_password_hash,
    create_access_token,
    get_current_active_user,
    get_admin_user
)
from seed import PRODUCTS_DATA

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=Token)
def login(request: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == request.email).first()
    
    if not user or not verify_password(request.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Email o contraseña incorrectos"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Usuario inactivo"
        )
    
    access_token = create_access_token(data={"sub": user.email})
    
    franchise = db.query(Franchise).filter(Franchise.id == user.franchise_id).first()
    user_dict = UserSchema.model_validate(user).model_dump()
    user_dict['franchise_name'] = franchise.name if franchise else None
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserSchema(**user_dict)
    )

@router.get("/me", response_model=UserSchema)
def get_me(current_user: User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    franchise = db.query(Franchise).filter(Franchise.id == current_user.franchise_id).first()
    user_dict = UserSchema.model_validate(current_user).model_dump()
    user_dict['franchise_name'] = franchise.name if franchise else None
    return user_dict

@router.post("/register", response_model=UserSchema)
def register(
    email: str,
    password: str,
    name: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_admin_user)
):
    if db.query(User).filter(User.email == email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ya registrado"
        )
    
    user = User(
        email=email,
        name=name,
        hashed_password=get_password_hash(password),
        franchise_id=current_user.franchise_id
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    return UserSchema.model_validate(user)

@router.post("/register/public", response_model=Token)
def register_public(
    request: PublicRegisterRequest,
    db: Session = Depends(get_db)
):
    """Public registration - creates user + franchise without authentication"""
    # Check if email already exists
    if db.query(User).filter(User.email == request.email).first():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email ya registrado"
        )
    
    # Extract franchise data
    franchise_data = request.franchise_data or {}
    franchise_name = franchise_data.get('name', 'Nuevo Negocio')
    franchise_city = franchise_data.get('city', 'Buenos Aires')
    
    # Create franchise first
    franchise = Franchise(
        code=f"F{datetime.now().strftime('%Y%m%d%H%M%S')}",
        name=franchise_name,
        owner=request.name,
        city=franchise_city,
        address=franchise_data.get('address', ''),
        province=franchise_data.get('province', 'Buenos Aires'),
        weather_city=f"{franchise_city},AR",
        supplier="Helacor S.A."
    )
    db.add(franchise)
    db.flush()  # Get franchise ID
    
    # Create admin user for the franchise
    user = User(
        email=request.email,
        name=request.name,
        hashed_password=get_password_hash(request.password),
        franchise_id=franchise.id,
        role="admin",
        user_type="franquiciado",
        is_active=True,
        requires_setup=True,
        completed_tour=False
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    # Create access token
    access_token = create_access_token(data={"sub": user.email})
    
    # Build response
    franchise_obj = db.query(Franchise).filter(Franchise.id == user.franchise_id).first()
    user_dict = UserSchema.model_validate(user).model_dump()
    user_dict['franchise_name'] = franchise_obj.name if franchise_obj else None
    
    return Token(
        access_token=access_token,
        token_type="bearer",
        user=UserSchema(**user_dict)
    )

@router.post("/setup")
def complete_setup(
    data: SetupData,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    if not current_user.requires_setup:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Setup ya completado"
        )
    
    current_user.name = data.name
    
    franchise = db.query(Franchise).filter(Franchise.id == current_user.franchise_id).first()
    if franchise:
        franchise.code = data.franchise_code
        franchise.name = f"Grido {data.city}"
        franchise.owner = data.name
        franchise.address = data.address
        franchise.city = data.city
        franchise.province = data.province
        franchise.cuit = data.cuit or ""
        franchise.supplier = data.supplier
        franchise.weather_city = f"{data.city},AR"
    
    db.commit()
    
    return {"message": "Configuración guardada", "next_step": "products"}

@router.post("/setup/products")
def setup_products(
    data: LoadProductsRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    products_loaded = 0
    
    if data.load_base_products:
        for name, category, unit, stock, min_stock, price in PRODUCTS_DATA:
            product = Product(
                name=name,
                category=category,
                unit=unit,
                current_stock=stock,
                min_stock=min_stock,
                unit_price=price,
                franchise_id=current_user.franchise_id,
                is_active=True
            )
            db.add(product)
            products_loaded += 1
    
    current_user.requires_setup = False
    db.commit()
    
    return {
        "message": "Configuración completada",
        "products_loaded": products_loaded,
        "next_step": "welcome"
    }

@router.post("/complete-tour")
def complete_tour(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_user)
):
    current_user.completed_tour = True
    db.commit()
    return {"message": "Tour completado"}
