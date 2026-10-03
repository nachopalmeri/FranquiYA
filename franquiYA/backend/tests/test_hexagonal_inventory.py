import os
from dataclasses import replace

import pytest

from application.inventory_service import InventoryService
from domain.inventory import InventoryProduct


class FakeProducts:
    def __init__(self):
        self.rows = [
            InventoryProduct(1, "Empty", "a", "kg", 0, 4, 1),
            InventoryProduct(2, "Low", "a", "kg", 2, 4, 1),
            InventoryProduct(3, "Healthy", "b", "kg", 8, 4, 1),
        ]

    def list_products(self, franchise_id, category=None):
        return [p for p in self.rows if category is None or p.category == category]

    def get_product(self, product_id, franchise_id):
        return next((p for p in self.rows if p.id == product_id), None)

    def update_product(self, product_id, franchise_id, changes):
        for index, product in enumerate(self.rows):
            if product.id == product_id:
                self.rows[index] = replace(product, **changes)
                return self.rows[index]
        return None


def test_stock_thresholds_are_domain_rules():
    assert InventoryProduct(1, "Empty", "a", "kg", 0, 4, 1).stock_status == "critical"
    assert InventoryProduct(2, "Low", "a", "kg", 4, 4, 1).stock_status == "low"
    assert InventoryProduct(3, "Healthy", "a", "kg", 4.1, 4, 1).stock_status == "ok"


def test_service_filters_alerts_and_updates_through_port():
    service = InventoryService(FakeProducts())
    assert [p.id for p in service.alerts(1)] == [1, 2]
    assert [p.id for p in service.list_products(1, "b")] == [3]
    assert service.update_product(2, 1, {"current_stock": 10}).stock_status == "ok"


def test_demo_session_is_sample_read_only_and_uses_inventory(client, monkeypatch):
    monkeypatch.setenv("DEMO_MODE_ENABLED", "true")
    login = client.post("/api/auth/demo")
    assert login.status_code == 200
    assert login.json()["user"]["is_demo"] is True
    headers = {"Authorization": f"Bearer {login.json()['access_token']}"}

    stock = client.get("/api/stock", headers=headers)
    assert stock.status_code == 200
    assert len(stock.json()) == 6
    assert client.get("/api/stock/alerts", headers=headers).status_code == 200
    assert client.get("/api/dashboard/stats", headers=headers).json() == {
        "total_products": 6, "low_stock_count": 2, "critical_stock_count": 2,
        "pending_invoices": 0, "last_audit_date": None,
    }
    denied = client.put("/api/stock/1", headers=headers, json={"current_stock": 50})
    assert denied.status_code == 403
    assert denied.json()["detail"] == "Demo mode is read-only"


def test_demo_disabled_by_default(client, monkeypatch):
    monkeypatch.delenv("DEMO_MODE_ENABLED", raising=False)
    assert client.post("/api/auth/demo").status_code == 404


def test_regular_user_keeps_sql_repository_when_demo_is_enabled(client, auth_headers, monkeypatch):
    monkeypatch.setenv("DEMO_MODE_ENABLED", "true")
    response = client.get("/api/stock", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []
