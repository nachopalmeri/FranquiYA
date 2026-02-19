from pydantic import BaseModel
from typing import Optional

class FranchiseBase(BaseModel):
    code: str
    name: str
    owner: str
    cuit: str
    address: str
    city: str
    province: str
    weather_city: str
    supplier: str

class Franchise(FranchiseBase):
    id: int

    class Config:
        from_attributes = True
