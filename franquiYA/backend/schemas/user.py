from pydantic import BaseModel, EmailStr, Field, field_validator
from typing import Optional
from datetime import datetime
import re

class UserBase(BaseModel):
    email: EmailStr
    name: Optional[str] = None

class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)
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
    email: EmailStr
    password: str = Field(..., min_length=1)

class Token(BaseModel):
    access_token: str
    token_type: str
    user: User

class SetupData(BaseModel):
    name: str = Field(..., min_length=1, max_length=200)
    franchise_code: str = Field(..., min_length=1, max_length=50)
    address: str = Field(..., min_length=1, max_length=300)
    city: str = Field(..., min_length=1, max_length=100)
    province: str = Field(..., min_length=1, max_length=100)
    cuit: Optional[str] = Field(None, max_length=20)
    supplier: str = "Helacor S.A."

    @field_validator('cuit')
    @classmethod
    def validate_cuit(cls, v):
        if v and not re.match(r'^\d{11}$', v.replace('-', '')):
            raise ValueError('CUIT debe tener 11 dígitos')
        return v

class LoadProductsRequest(BaseModel):
    load_base_products: bool


class PublicRegisterRequest(BaseModel):
    """Request for public registration - creates user + franchise"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=100)
    name: str = Field(..., min_length=1, max_length=200)
    franchise_data: dict  # name, owner, city, address

    @field_validator('password')
    @classmethod
    def validate_password_strength(cls, v):
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('La contraseña debe contener al menos una letra')
        if not re.search(r'\d', v):
            raise ValueError('La contraseña debe contener al menos un número')
        return v
