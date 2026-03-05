from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class Supplier(Base):
    __tablename__ = "suppliers"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, index=True)
    code = Column(String, nullable=True)  # SAP code or similar
    contact_name = Column(String, nullable=True)
    contact_email = Column(String, nullable=True)
    contact_phone = Column(String, nullable=True)
    address = Column(String, nullable=True)
    city = Column(String, nullable=True)
    province = Column(String, nullable=True)
    cuit = Column(String, nullable=True)  # Argentine tax ID
    notes = Column(Text, nullable=True)
    is_active = Column(Boolean, default=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    franchise = relationship("Franchise", back_populates="suppliers")
    products = relationship("Product", back_populates="supplier")
    invoices = relationship("Invoice", back_populates="supplier")
