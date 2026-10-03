from typing import List, Optional
from domain.inventory import InventoryProduct


class DemoInventoryRepository:
    """Stable, fictional inventory for presentation; writes are intentionally unsupported."""
    def __init__(self):
        self._products = [
            InventoryProduct(1, "Chocolate", "sabor_7.8kg", "7.8kg", 0, 5, 24000, franchise_id=0),
            InventoryProduct(2, "Dulce de leche", "sabor_7.8kg", "7.8kg", 3, 5, 24000, franchise_id=0),
            InventoryProduct(3, "Frutilla", "sabor_7.8kg", "7.8kg", 12, 5, 24000, franchise_id=0),
            InventoryProduct(4, "Bombón", "bombones", "caja", 2, 4, 18000, franchise_id=0),
            InventoryProduct(5, "Palito frutal", "palitos", "pack", 18, 6, 8500, franchise_id=0),
            InventoryProduct(6, "Torta helada", "tortas", "unidad", 0, 2, 16000, franchise_id=0),
        ]

    def list_products(self, franchise_id: Optional[int], category: Optional[str] = None) -> List[InventoryProduct]:
        return [p for p in self._products if p.is_active and (not category or p.category == category)]

    def get_product(self, product_id: int, franchise_id: Optional[int]) -> Optional[InventoryProduct]:
        return next((p for p in self._products if p.id == product_id), None)

    def update_product(self, product_id: int, franchise_id: Optional[int], changes: dict) -> Optional[InventoryProduct]:
        raise PermissionError("Sample inventory is read-only")
