from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class TaskBase(BaseModel):
    title: str
    description: Optional[str] = None
    priority: str = "medium"  # low | medium | high | urgent
    due_date: Optional[str] = None

class TaskCreate(TaskBase):
    assigned_to: Optional[int] = None

class TaskUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    assigned_to: Optional[int] = None
    due_date: Optional[str] = None

class Task(TaskBase):
    id: int
    franchise_id: int
    created_by: int
    assigned_to: Optional[int] = None
    status: str
    created_at: datetime
    completed_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class TaskWithDetails(Task):
    creator: Optional[dict] = None
    assignee: Optional[dict] = None
