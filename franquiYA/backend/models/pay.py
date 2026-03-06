from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Text, Boolean
from sqlalchemy.orm import relationship
from database import Base

class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, index=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"), nullable=False, index=True)
    name = Column(String(200), nullable=False)
    phone = Column(String(50))
    email = Column(String(200))
    credit_limit = Column(Float, default=0)
    balance = Column(Float, default=0)  # Current debt
    notes = Column(Text)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    franchise = relationship("Franchise", back_populates="customers")
    sales = relationship("Sale", back_populates="customer")


class CashRegister(Base):
    __tablename__ = "cash_registers"

    id = Column(Integer, primary_key=True, index=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"), nullable=False, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"))
    
    opening_amount = Column(Float, nullable=False)
    closing_amount = Column(Float)
    expected_amount = Column(Float)
    difference = Column(Float)
    
    opened_at = Column(DateTime, default=datetime.utcnow)
    closed_at = Column(DateTime)
    status = Column(String(20), default="open")  # open, closed
    
    notes = Column(Text)
    
    franchise = relationship("Franchise")
    employee = relationship("Employee")
    movements = relationship("CashMovement", back_populates="cash_register")
    sales = relationship("Sale", back_populates="cash_register")


class CashMovement(Base):
    __tablename__ = "cash_movements"

    id = Column(Integer, primary_key=True, index=True)
    cash_register_id = Column(Integer, ForeignKey("cash_registers.id"), nullable=False, index=True)
    
    type = Column(String(20), nullable=False)  # income, expense, withdrawal
    amount = Column(Float, nullable=False)
    concept = Column(String(200))
    payment_method = Column(String(20))  # cash, card, transfer
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    cash_register = relationship("CashRegister", back_populates="movements")


class Sale(Base):
    __tablename__ = "sales"

    id = Column(Integer, primary_key=True, index=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"), nullable=False, index=True)
    
    customer_id = Column(Integer, ForeignKey("customers.id"), nullable=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=True)
    cash_register_id = Column(Integer, ForeignKey("cash_registers.id"), nullable=True)
    
    subtotal = Column(Float, nullable=False)
    tax = Column(Float, default=0)
    discount = Column(Float, default=0)
    total = Column(Float, nullable=False)
    
    payment_method = Column(String(20), nullable=False)  # cash, card, transfer, mercadopago
    payment_reference = Column(String(200))  # Reference for card/transfer
    
    status = Column(String(20), default="completed")  # completed, cancelled, refunded
    notes = Column(Text)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    franchise = relationship("Franchise")
    customer = relationship("Customer", back_populates="sales")
    employee = relationship("Employee")
    cash_register = relationship("CashRegister", back_populates="sales")
    items = relationship("SaleItem", back_populates="sale")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id = Column(Integer, primary_key=True, index=True)
    sale_id = Column(Integer, ForeignKey("sales.id"), nullable=False, index=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    
    product_name = Column(String(200), nullable=False)
    quantity = Column(Float, nullable=False)
    unit_price = Column(Float, nullable=False)
    total = Column(Float, nullable=False)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    sale = relationship("Sale", back_populates="items")
    product = relationship("Product")
