from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class ExternalEventBase(BaseModel):
    title: str
    description: Optional[str] = None
    visitor_name: str
    visitor_contact: Optional[str] = None
    date: str
    time_start: Optional[str] = None
    time_end: Optional[str] = None

class ExternalEventCreate(ExternalEventBase):
    is_recurring: bool = False

class ExternalEventUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    visitor_name: Optional[str] = None
    visitor_contact: Optional[str] = None
    date: Optional[str] = None
    time_start: Optional[str] = None
    time_end: Optional[str] = None
    status: Optional[str] = None
    is_recurring: Optional[bool] = None

class ExternalEvent(ExternalEventBase):
    id: int
    franchise_id: int
    status: str
    is_recurring: bool
    created_at: datetime

    class Config:
        from_attributes = True
