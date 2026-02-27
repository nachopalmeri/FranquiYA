from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Time
from sqlalchemy.orm import relationship
from database import Base

class Shift(Base):
    __tablename__ = "shifts"

    id = Column(Integer, primary_key=True, index=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    role_id = Column(Integer, ForeignKey("roles.id"))  # Role being worked
    day_of_week = Column(Integer)  # 0=Monday, 6=Sunday
    start_time = Column(String)  # "08:00"
    end_time = Column(String)  # "16:00"
    is_active = Column(Boolean, default=True)
    is_recurring = Column(Boolean, default=True)  # Weekly pattern
    created_at = Column(DateTime, default=datetime.utcnow)

    franchise = relationship("Franchise", back_populates="shifts")
    employee = relationship("Employee", back_populates="shifts")
    role = relationship("Role", back_populates="shifts")
