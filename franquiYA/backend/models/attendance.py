from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Attendance(Base):
    __tablename__ = "attendances"

    id = Column(Integer, primary_key=True, index=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"))
    employee_id = Column(Integer, ForeignKey("employees.id"))
    date = Column(String)  # "2024-06-15"
    clock_in = Column(String, nullable=True)  # "08:00"
    clock_out = Column(String, nullable=True)  # "16:00"
    status = Column(String, default="present")  # present | absent | late | excused
    notes = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    franchise = relationship("Franchise", back_populates="attendances")
    employee = relationship("Employee", back_populates="attendances")
