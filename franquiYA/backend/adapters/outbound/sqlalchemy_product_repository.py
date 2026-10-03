from typing import List, Optional
from sqlalchemy.orm import Session
from domain.inventory import InventoryProduct
from models.product import Product


class SqlAlchemyProductRepository:
    def __init__(self, session: Session):
        self.session = session

    @staticmethod
    def _to_domain(row: Product) -> InventoryProduct:
        return InventoryProduct(
            id=row.id, name=row.name, category=row.category, unit=row.unit,
            current_stock=row.current_stock, min_stock=row.min_stock,
            unit_price=row.unit_price, is_active=row.is_active,
            franchise_id=row.franchise_id, previous_price=row.previous_price,
            price_change_pct=None, image_url=row.image_url,
        )

    def list_products(self, franchise_id: Optional[int], category: Optional[str] = None) -> List[InventoryProduct]:
        query = self.session.query(Product)
        if franchise_id is not None:
            query = query.filter(Product.franchise_id == franchise_id)
        if category:
            query = query.filter(Product.category == category)
        return [self._to_domain(row) for row in query.all()]

    def get_product(self, product_id: int, franchise_id: Optional[int]) -> Optional[InventoryProduct]:
        query = self.session.query(Product).filter(Product.id == product_id)
        if franchise_id is not None:
            query = query.filter(Product.franchise_id == franchise_id)
        row = query.first()
        return self._to_domain(row) if row else None

    def update_product(self, product_id: int, franchise_id: Optional[int], changes: dict) -> Optional[InventoryProduct]:
        query = self.session.query(Product).filter(Product.id == product_id)
        if franchise_id is not None:
            query = query.filter(Product.franchise_id == franchise_id)
        row = query.first()
        if not row:
            return None
        for key, value in changes.items():
            setattr(row, key, value)
        self.session.commit()
        self.session.refresh(row)
        return self._to_domain(row)
