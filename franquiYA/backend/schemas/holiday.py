from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class HolidayBase(BaseModel):
    employee_id: int
    start_date: str
    end_date: str
    days_count: int
    notes: Optional[str] = None

class HolidayCreate(HolidayBase):
    status: str = "planned"

class HolidayUpdate(BaseModel):
    status: Optional[str] = None
    approved_by: Optional[int] = None

class Holiday(HolidayBase):
    id: int
    franchise_id: int
    status: str
    created_at: datetime
    approved_by: Optional[int] = None
    approved_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class HolidayWithEmployee(Holiday):
    employee: Optional["EmployeeWithRole"] = None
