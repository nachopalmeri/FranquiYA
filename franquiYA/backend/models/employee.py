from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Employee(Base):
    __tablename__ = "employees"

    id = Column(Integer, primary_key=True, index=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"))
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # Link to User if they have app access
    role_id = Column(Integer, ForeignKey("roles.id"))
    name = Column(String)
    phone = Column(String, nullable=True)
    dni = Column(String, nullable=True)  # Argentine DNI
    emergency_contact = Column(String, nullable=True)
    vacation_days_total = Column(Integer, default=14)  # Total vacation days per year
    hourly_rate = Column(Integer, nullable=True)  # Hourly rate in ARS
    is_active = Column(Boolean, default=True)
    hire_date = Column(DateTime, default=datetime.utcnow)
    created_at = Column(DateTime, default=datetime.utcnow)

    franchise = relationship("Franchise", back_populates="employees")
    user = relationship("User")
    role = relationship("Role", back_populates="employees")
    shifts = relationship("Shift", back_populates="employee")
    holidays = relationship("Holiday", back_populates="employee")
    attendances = relationship("Attendance", back_populates="employee")
