from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import relationship
from database import Base

class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, index=True)
    franchise_id = Column(Integer, ForeignKey("franchises.id"))
    created_by = Column(Integer, ForeignKey("users.id"))
    assigned_to = Column(Integer, ForeignKey("employees.id"), nullable=True)
    title = Column(String)
    description = Column(String, nullable=True)
    priority = Column(String, default="medium")  # low | medium | high | urgent
    status = Column(String, default="pending")  # pending | in_progress | completed
    due_date = Column(String, nullable=True)  # "2024-06-20"
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)

    franchise = relationship("Franchise", back_populates="tasks")
    creator = relationship("User")
    assignee = relationship("Employee")
