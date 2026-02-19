import pytest
import io

def test_list_invoices_empty(client, auth_headers):
    response = client.get("/api/invoices", headers=auth_headers)
    assert response.status_code == 200
    assert response.json() == []

def test_get_invoice_not_found(client, auth_headers):
    response = client.get("/api/invoices/99999", headers=auth_headers)
    assert response.status_code == 404

def test_upload_invalid_file(client, auth_headers):
    file_content = b"not a pdf content"
    files = {"file": ("test.txt", io.BytesIO(file_content), "text/plain")}
    
    response = client.post(
        "/api/invoices/upload",
        headers=auth_headers,
        files=files
    )
    assert response.status_code == 400
    assert "pdf" in response.json()["detail"].lower()

def test_dashboard_stats(client, auth_headers, db_session, test_franchise):
    from models.product import Product
    
    product1 = Product(
        name="Critical",
        category="sabor_7.8kg",
        unit="7.8kg",
        current_stock=0,
        min_stock=5,
        unit_price=24000,
        franchise_id=test_franchise.id,
        is_active=True
    )
    product2 = Product(
        name="Low",
        category="sabor_7.8kg",
        unit="7.8kg",
        current_stock=3,
        min_stock=5,
        unit_price=24000,
        franchise_id=test_franchise.id,
        is_active=True
    )
    product3 = Product(
        name="OK",
        category="sabor_7.8kg",
        unit="7.8kg",
        current_stock=20,
        min_stock=5,
        unit_price=24000,
        franchise_id=test_franchise.id,
        is_active=True
    )
    db_session.add_all([product1, product2, product3])
    db_session.commit()
    
    response = client.get("/api/dashboard/stats", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total_products"] == 3
    assert data["critical_stock_count"] == 1
    assert data["low_stock_count"] == 1

def test_get_franchise(client, auth_headers, test_franchise):
    response = client.get("/api/franchise", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["code"] == "TEST001"
    assert data["name"] == "Test Franchise"

def test_update_franchise(client, auth_headers, test_franchise):
    response = client.put(
        "/api/franchise",
        headers=auth_headers,
        json={"name": "Updated Franchise Name"}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Updated Franchise Name"
