from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ShiftBase(BaseModel):
    employee_id: int
    role_id: int
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str
    end_time: str

class ShiftCreate(ShiftBase):
    is_recurring: bool = True

class ShiftUpdate(BaseModel):
    employee_id: Optional[int] = None
    role_id: Optional[int] = None
    day_of_week: Optional[int] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None
    is_active: Optional[bool] = None

class Shift(ShiftBase):
    id: int
    franchise_id: int
    is_active: bool
    is_recurring: bool
    created_at: datetime

    class Config:
        from_attributes = True

class ShiftWithEmployee(Shift):
    employee: Optional["EmployeeWithRole"] = None
    role: Optional["Role"] = None
