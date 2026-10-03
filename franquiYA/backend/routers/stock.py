from fastapi import APIRouter, Depends, HTTPException
from typing import List, Optional
from pydantic import BaseModel
from adapters.inbound.fastapi_dependencies import get_inventory_service
from application.inventory_service import InventoryService
from domain.inventory import InventoryProduct, stock_alert_message
from schemas import Product as ProductSchema, StockAlert, DashboardStats
from auth import get_current_active_user

router = APIRouter(prefix="/stock", tags=["stock"])

class ProductUpdate(BaseModel):
    name: Optional[str] = None
    category: Optional[str] = None
    unit: Optional[str] = None
    current_stock: Optional[float] = None
    min_stock: Optional[float] = None
    unit_price: Optional[float] = None
    is_active: Optional[bool] = None

@router.get("", response_model=List[ProductSchema])
def list_products(
    category: Optional[str] = None,
    current_user = Depends(get_current_active_user),
    inventory: InventoryService = Depends(get_inventory_service),
):
    return inventory.list_products(current_user.franchise_id, category)

@router.get("/alerts", response_model=List[StockAlert])
def get_stock_alerts(
    current_user = Depends(get_current_active_user),
    inventory: InventoryService = Depends(get_inventory_service),
):
    return [StockAlert(product=p, status=p.stock_status, message=stock_alert_message(p)) for p in inventory.alerts(current_user.franchise_id)]

@router.get("/{product_id}", response_model=ProductSchema)
def get_product(
    product_id: int,
    current_user = Depends(get_current_active_user),
    inventory: InventoryService = Depends(get_inventory_service),
):
    product = inventory.get_product(product_id, current_user.franchise_id)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product

@router.put("/{product_id}", response_model=ProductSchema)
def update_product(
    product_id: int,
    data: ProductUpdate,
    current_user = Depends(get_current_active_user),
    inventory: InventoryService = Depends(get_inventory_service),
):
    product = inventory.update_product(product_id, current_user.franchise_id, data.model_dump(exclude_unset=True))
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    
    return product
