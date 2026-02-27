from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class EmployeeBase(BaseModel):
    name: str
    role_id: int
    phone: Optional[str] = None
    dni: Optional[str] = None
    emergency_contact: Optional[str] = None
    vacation_days_total: int = 14
    hourly_rate: Optional[int] = None

class EmployeeCreate(EmployeeBase):
    user_id: Optional[int] = None

class EmployeeUpdate(BaseModel):
    name: Optional[str] = None
    role_id: Optional[int] = None
    phone: Optional[str] = None
    dni: Optional[str] = None
    emergency_contact: Optional[str] = None
    vacation_days_total: Optional[int] = None
    hourly_rate: Optional[int] = None
    is_active: Optional[bool] = None

class Employee(EmployeeBase):
    id: int
    franchise_id: int
    user_id: Optional[int] = None
    is_active: bool
    hire_date: datetime
    created_at: datetime

    class Config:
        from_attributes = True

class EmployeeWithRole(Employee):
    role: Optional["Role"] = None
    vacation_taken: int = 0
    vacation_remaining: int = 14
