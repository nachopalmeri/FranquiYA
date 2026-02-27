from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Role(Base):
    __tablename__ = "roles"

    id = Column(Integer, primary_key=True, index=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"))
    name = Column(String)  # e.g., "Vendedor", "Repostero", "Encargado"
    color = Column(String, default="#22C55E")  # Hex color for UI badges
    permissions = Column(String, default="")  # Comma-separated permissions
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    franchise = relationship("Franchise", back_populates="roles")
    employees = relationship("Employee", back_populates="role")
    shifts = relationship("Shift", back_populates="role")
