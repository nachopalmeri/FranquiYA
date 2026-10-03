import os
from fastapi import Depends
from sqlalchemy.orm import Session
from application.inventory_service import InventoryService
from adapters.outbound.demo_inventory_repository import DemoInventoryRepository
from adapters.outbound.sqlalchemy_product_repository import SqlAlchemyProductRepository
from database import get_db
from auth import get_current_active_user

_demo_repository = DemoInventoryRepository()


def get_inventory_service(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_active_user),
) -> InventoryService:
    if getattr(current_user, "id", None) == 0 and os.getenv("DEMO_MODE_ENABLED", "false").lower() == "true":
        return InventoryService(_demo_repository)
    return InventoryService(SqlAlchemyProductRepository(db))
