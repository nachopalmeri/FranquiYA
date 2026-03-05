from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str = "operator"
    user_type: str = "empleado"  # franquiciado | empleado
    franchise_id: Optional[int] = None

class User(UserBase):
    id: int
    role: str
    user_type: str = "empleado"
    franchise_id: Optional[int] = None
    franchise_name: Optional[str] = None
    is_active: bool
    requires_setup: bool = False
    completed_tour: bool = False

    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class SetupData(BaseModel):
    name: str
    franchise_code: str
    address: str
    city: str
    province: str
    cuit: Optional[str] = None
    supplier: str = "Helacor S.A."

class LoadProductsRequest(BaseModel):
    load_base_products: bool


class PublicRegisterRequest(BaseModel):
    """Request for public registration - creates user + franchise"""
    email: str
    password: str
    name: str
    franchise_data: dict  # name, owner, city, address
