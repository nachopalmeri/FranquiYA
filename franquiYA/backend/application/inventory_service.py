from typing import List, Optional
from application.ports import ProductRepository
from domain.inventory import InventoryProduct


class InventoryService:
    def __init__(self, products: ProductRepository):
        self.products = products

    def list_products(self, franchise_id: Optional[int], category: Optional[str] = None) -> List[InventoryProduct]:
        return self.products.list_products(franchise_id, category)

    def get_product(self, product_id: int, franchise_id: Optional[int]) -> Optional[InventoryProduct]:
        return self.products.get_product(product_id, franchise_id)

    def update_product(self, product_id: int, franchise_id: Optional[int], changes: dict) -> Optional[InventoryProduct]:
        return self.products.update_product(product_id, franchise_id, changes)

    def alerts(self, franchise_id: Optional[int]) -> List[InventoryProduct]:
        return [p for p in self.products.list_products(franchise_id) if p.is_active and p.stock_status != "ok"]
