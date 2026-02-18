from datetime import datetime
from sqlalchemy import Column, Integer, Float, String, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class StockAudit(Base):
    __tablename__ = "stock_audits"

    id = Column(Integer, primary_key=True, index=True)
    product_id = Column(Integer, ForeignKey("products.id"))
    system_qty = Column(Float, default=0)
    counted_qty = Column(Float, default=0)
    difference = Column(Float, default=0)
    audited_by = Column(String)
    audited_at = Column(DateTime, default=datetime.utcnow)

    product = relationship("Product", back_populates="audits")
