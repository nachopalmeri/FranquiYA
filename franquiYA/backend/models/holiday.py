from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Holiday(Base):
    __tablename__ = "holidays"

    id = Column(Integer, primary_key=True, index=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    start_date = Column(String)  # "2024-12-20"
    end_date = Column(String)    # "2024-12-31"
    days_count = Column(Integer)  # Calculated days
    status = Column(String, default="planned")  # planned | approved | taken
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    approved_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    approved_at = Column(DateTime, nullable=True)

    franchise = relationship("Franchise", back_populates="holidays")
    employee = relationship("Employee", back_populates="holidays")
    approver = relationship("User")
