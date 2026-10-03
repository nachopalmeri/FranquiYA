from dataclasses import dataclass
from typing import Optional


@dataclass(frozen=True)
class InventoryProduct:
    id: int
    name: str
    category: str
    unit: str
    current_stock: float
    min_stock: float
    unit_price: float
    is_active: bool = True
    franchise_id: Optional[int] = None
    previous_price: Optional[float] = None
    price_change_pct: Optional[float] = None
    image_url: Optional[str] = None

    @property
    def stock_status(self) -> str:
        if self.current_stock <= 0:
            return "critical"
        if self.current_stock <= self.min_stock:
            return "low"
        return "ok"


def stock_alert_message(product: InventoryProduct) -> str:
    if product.stock_status == "critical":
        return "Sin stock - Reponer urgente"
    return f"Stock bajo - Mínimo: {product.min_stock}"
