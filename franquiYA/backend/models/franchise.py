from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime
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

    users = relationship("User", back_populates="franchise")
    products = relationship("Product", back_populates="franchise")
    invoices = relationship("Invoice", back_populates="franchise")
