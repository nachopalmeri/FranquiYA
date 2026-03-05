import pytest

from models.product import Product


def product_payload(franchise_id):
    return {
        "name": "Test Product",
        "category": "general",
        "unit": "7.8kg",
        "current_stock": 100.0,
        "min_stock": 10.0,
        "unit_price": 25000.0,
        "franchise_id": franchise_id
    }


def test_create_product_admin(client, auth_headers, test_user, test_franchise, db_session):
    payload = product_payload(test_franchise.id)
    response = client.post("/api/products/", json=payload, headers=auth_headers)
    assert response.status_code == 200, response.json()
    data = response.json()
    assert data["name"] == payload["name"]
    assert data["franchise_id"] == test_franchise.id
    
    # Check in DB
    product = db_session.query(Product).filter_by(name=payload["name"], franchise_id=test_franchise.id).first()
    assert product is not None
    assert product.current_stock == payload["current_stock"]


def test_create_duplicate_product(client, auth_headers, test_user, test_franchise, db_session):
    payload = product_payload(test_franchise.id)
    # First creation
    client.post("/api/products/", json=payload, headers=auth_headers)
    # Duplicate creation
    resp = client.post("/api/products/", json=payload, headers=auth_headers)
    assert resp.status_code == 409
    assert "already exists" in resp.json()["detail"].lower()


def test_create_product_unauthenticated(client, test_franchise):
    payload = product_payload(test_franchise.id)
    resp = client.post("/api/products/", json=payload)
    assert resp.status_code == 401 or resp.status_code == 403

# Optionally: Test franchise scoping, superadmin ability, minimal required fields (per schema)

# --- NUEVOS TESTS ---

def test_list_products_only_own_franchise(client, auth_headers, db_session, test_franchise, another_franchise):
    # Crear productos en dos franquicias
    p1 = Product(name="ProdA", category="a", unit="kg", current_stock=1, min_stock=0, unit_price=1, franchise_id=test_franchise.id)
    p2 = Product(name="ProdB", category="a", unit="kg", current_stock=1, min_stock=0, unit_price=1, franchise_id=another_franchise.id)
    db_session.add_all([p1, p2])
    db_session.commit()
    # Solo debe ver su franquicia
    resp = client.get("/api/products/", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert any(prod["name"] == "ProdA" for prod in data)
    assert all(prod["franchise_id"] == test_franchise.id for prod in data)


def test_list_products_superadmin_sees_all(client, superadmin_headers, db_session, test_franchise, another_franchise):
    # Agregar productos en ambas franquicias
    p1 = Product(name="X1", category="x", unit="g", current_stock=1, min_stock=0, unit_price=10, franchise_id=test_franchise.id)
    p2 = Product(name="Y2", category="y", unit="g", current_stock=3, min_stock=0, unit_price=20, franchise_id=another_franchise.id)
    db_session.add_all([p1, p2])
    db_session.commit()
    resp = client.get("/api/products/", headers=superadmin_headers)
    assert resp.status_code == 200
    data = resp.json()
    all_names = [p["name"] for p in data]
    assert "X1" in all_names and "Y2" in all_names


def test_list_products_forbidden_for_unauth(client):
    resp = client.get("/api/products/")
    assert resp.status_code in (401, 403)


def test_get_product_own_franchise(client, auth_headers, db_session, test_franchise):
    p = Product(name="ShowMe", category="a", unit="kg", current_stock=2, min_stock=0, unit_price=3, franchise_id=test_franchise.id)
    db_session.add(p)
    db_session.commit()
    resp = client.get(f"/api/products/{p.id}", headers=auth_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["name"] == "ShowMe" and data["franchise_id"] == test_franchise.id


def test_get_product_cross_franchise_forbidden(client, other_admin_headers, db_session, test_franchise):
    p = Product(name="Foox", category="b", unit="g", current_stock=8, min_stock=0, unit_price=19, franchise_id=test_franchise.id)
    db_session.add(p)
    db_session.commit()
    resp = client.get(f"/api/products/{p.id}", headers=other_admin_headers)
    assert resp.status_code == 403


def test_get_product_not_found(client, auth_headers):
    resp = client.get("/api/products/99999", headers=auth_headers)
    assert resp.status_code == 404
