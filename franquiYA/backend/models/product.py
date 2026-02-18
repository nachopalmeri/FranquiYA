from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    category = Column(String, index=True)
    unit = Column(String, default="7.8kg")
    current_stock = Column(Float, default=0)
    min_stock = Column(Float, default=5)
    unit_price = Column(Float, default=0)
    previous_price = Column(Float, nullable=True)
    image_url = Column(String, nullable=True)
    is_active = Column(Boolean, default=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    franchise = relationship("Franchise", back_populates="products")
    invoice_lines = relationship("InvoiceLine", back_populates="product")
    audits = relationship("StockAudit", back_populates="product")
