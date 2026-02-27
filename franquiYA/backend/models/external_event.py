from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class ExternalEvent(Base):
    __tablename__ = "external_events"

    id = Column(Integer, primary_key=True, index=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"))
    title = Column(String)  # "Arquitecto - Visita de obra"
    description = Column(String, nullable=True)
    visitor_name = Column(String)
    visitor_contact = Column(String, nullable=True)
    date = Column(String)  # "2024-06-15"
    time_start = Column(String, nullable=True)  # "10:00"
    time_end = Column(String, nullable=True)    # "12:00"
    status = Column(String, default="scheduled")  # scheduled | completed | cancelled
    is_recurring = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    franchise = relationship("Franchise", back_populates="external_events")
