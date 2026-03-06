from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON
from sqlalchemy.orm import relationship
from database import Base

class Franchise(Base):
    __tablename__ = "franchises"

    id = Column(Integer, primary_key=True, index=True)
    code = Column(String, unique=True, index=True)
    name = Column(String)
    owner = Column(String)
    cuit = Column(String)
    address = Column(String)
    city = Column(String, default="Lanús")
    province = Column(String, default="Buenos Aires")
    weather_city = Column(String, default="Lanus,AR")
    supplier = Column(String, default="Helacor S.A.")
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Settings JSON for theming and modules
    settings = Column(JSON, default={
        "theme": "modern",
        "business_type": "heladeria",
        "modules": ["stock", "invoices", "employees", "tasks", "calendar", "chat"]
    })

    users = relationship("User", back_populates="franchise")
    products = relationship("Product", back_populates="franchise")
    invoices = relationship("Invoice", back_populates="franchise")
    suppliers = relationship("Supplier", back_populates="franchise")
    roles = relationship("Role", back_populates="franchise")
    employees = relationship("Employee", back_populates="franchise")
    shifts = relationship("Shift", back_populates="franchise")
    holidays = relationship("Holiday", back_populates="franchise")
    external_events = relationship("ExternalEvent", back_populates="franchise")
    tasks = relationship("Task", back_populates="franchise")
    attendances = relationship("Attendance", back_populates="franchise")
