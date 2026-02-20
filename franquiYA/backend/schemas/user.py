from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserBase(BaseModel):
    email: str
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str
    role: str = "operator"
    franchise_id: int

class User(UserBase):
    id: int
    role: str
    franchise_id: int
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
