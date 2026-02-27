from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class RoleBase(BaseModel):
    name: str
    color: str = "#22C55E"
    permissions: str = ""

class RoleCreate(RoleBase):
    pass

class Role(RoleBase):
    id: int
    franchise_id: int
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
