from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.orm import relationship
from database import Base

class Invoice(Base):
    __tablename__ = "invoices"

    id = Column(Integer, primary_key=True, index=True)
    number = Column(String, unique=True, index=True)
    date = Column(DateTime)
    supplier = Column(String, default="Helacor S.A.")
    supplier_id = Column(Integer, ForeignKey("suppliers.id"), nullable=True)
    total = Column(Float, default=0)
    status = Column(String, default="pending")
    raw_text = Column(Text, nullable=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"))
    created_at = Column(DateTime, default=datetime.utcnow)

    franchise = relationship("Franchise", back_populates="invoices")
    supplier = relationship("Supplier", back_populates="invoices")
    lines = relationship("InvoiceLine", back_populates="invoice", cascade="all, delete-orphan")

class InvoiceLine(Base):
    __tablename__ = "invoice_lines"

    id = Column(Integer, primary_key=True, index=True)
    invoice_id = Column(Integer, ForeignKey("invoices.id"))
    product_id = Column(Integer, ForeignKey("products.id"), nullable=True)
    raw_name = Column(String)
    matched_name = Column(String, nullable=True)
    quantity = Column(Float, default=0)
    unit = Column(String, default="7.8kg")
    unit_price = Column(Float, default=0)
    previous_price = Column(Float, nullable=True)
    price_change_pct = Column(Float, default=0)
    total = Column(Float, default=0)
    is_matched = Column(Boolean, default=False)
    approved = Column(Boolean, default=False)

    invoice = relationship("Invoice", back_populates="lines")
    product = relationship("Product", back_populates="invoice_lines")
