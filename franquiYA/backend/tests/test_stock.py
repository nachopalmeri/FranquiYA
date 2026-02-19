import pytest

def test_list_products(client, auth_headers, db_session, test_franchise):
    from models.product import Product
    
    product = Product(
        name="Test Ice Cream",
        category="sabor_7.8kg",
        unit="7.8kg",
        current_stock=10,
        min_stock=5,
        unit_price=24000,
        franchise_id=test_franchise.id,
        is_active=True
    )
    db_session.add(product)
    db_session.commit()
    
    response = client.get("/api/stock", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Test Ice Cream"

def test_list_products_by_category(client, auth_headers, db_session, test_franchise):
    from models.product import Product
    
    product1 = Product(
        name="Chocolate",
        category="sabor_7.8kg",
        unit="7.8kg",
        current_stock=10,
        min_stock=5,
        unit_price=24000,
        franchise_id=test_franchise.id,
        is_active=True
    )
    product2 = Product(
        name="Bombon",
        category="bombones",
        unit="caja",
        current_stock=5,
        min_stock=2,
        unit_price=0,
        franchise_id=test_franchise.id,
        is_active=True
    )
    db_session.add_all([product1, product2])
    db_session.commit()
    
    response = client.get("/api/stock?category=sabor_7.8kg", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["category"] == "sabor_7.8kg"

def test_get_product(client, auth_headers, db_session, test_franchise):
    from models.product import Product
    
    product = Product(
        name="DDL",
        category="sabor_7.8kg",
        unit="7.8kg",
        current_stock=15,
        min_stock=5,
        unit_price=24000,
        franchise_id=test_franchise.id,
        is_active=True
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    
    response = client.get(f"/api/stock/{product.id}", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "DDL"
    assert data["current_stock"] == 15

def test_get_product_not_found(client, auth_headers):
    response = client.get("/api/stock/99999", headers=auth_headers)
    assert response.status_code == 404

def test_update_product(client, auth_headers, db_session, test_franchise):
    from models.product import Product
    
    product = Product(
        name="ToUpdate",
        category="sabor_7.8kg",
        unit="7.8kg",
        current_stock=10,
        min_stock=5,
        unit_price=24000,
        franchise_id=test_franchise.id,
        is_active=True
    )
    db_session.add(product)
    db_session.commit()
    db_session.refresh(product)
    
    response = client.put(
        f"/api/stock/{product.id}",
        headers=auth_headers,
        json={"current_stock": 25, "min_stock": 10}
    )
    assert response.status_code == 200
    data = response.json()
    assert data["current_stock"] == 25
    assert data["min_stock"] == 10

def test_stock_alerts(client, auth_headers, db_session, test_franchise):
    from models.product import Product
    
    critical = Product(
        name="Critical Stock",
        category="sabor_7.8kg",
        unit="7.8kg",
        current_stock=0,
        min_stock=5,
        unit_price=24000,
        franchise_id=test_franchise.id,
        is_active=True
    )
    low = Product(
        name="Low Stock",
        category="sabor_7.8kg",
        unit="7.8kg",
        current_stock=3,
        min_stock=5,
        unit_price=24000,
        franchise_id=test_franchise.id,
        is_active=True
    )
    ok = Product(
        name="OK Stock",
        category="sabor_7.8kg",
        unit="7.8kg",
        current_stock=20,
        min_stock=5,
        unit_price=24000,
        franchise_id=test_franchise.id,
        is_active=True
    )
    db_session.add_all([critical, low, ok])
    db_session.commit()
    
    response = client.get("/api/stock/alerts", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 2
    
    statuses = [a["status"] for a in data]
    assert "critical" in statuses
    assert "low" in statuses

def test_stock_alerts_empty(client, auth_headers, db_session, test_franchise):
    from models.product import Product
    
    product = Product(
        name="OK Product",
        category="sabor_7.8kg",
        unit="7.8kg",
        current_stock=50,
        min_stock=5,
        unit_price=24000,
        franchise_id=test_franchise.id,
        is_active=True
    )
    db_session.add(product)
    db_session.commit()
    
    response = client.get("/api/stock/alerts", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 0
