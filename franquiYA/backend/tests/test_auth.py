import pytest

def test_login_success(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": "test@test.com",
        "password": "test123"
    })
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"
    assert data["user"]["email"] == "test@test.com"

def test_login_wrong_password(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": "test@test.com",
        "password": "wrongpassword"
    })
    assert response.status_code == 401
    assert "incorrectos" in response.json()["detail"].lower()

def test_login_nonexistent_user(client):
    response = client.post("/api/auth/login", json={
        "email": "nonexistent@test.com",
        "password": "test123"
    })
    assert response.status_code == 401

def test_login_inactive_user(client, db_session, test_franchise):
    from auth import get_password_hash
    from models.user import User
    
    inactive_user = User(
        email="inactive@test.com",
        name="Inactive User",
        hashed_password=get_password_hash("test123"),
        role="operator",
        franchise_id=test_franchise.id,
        is_active=False
    )
    db_session.add(inactive_user)
    db_session.commit()
    
    response = client.post("/api/auth/login", json={
        "email": "inactive@test.com",
        "password": "test123"
    })
    assert response.status_code == 400
    assert "inactivo" in response.json()["detail"].lower()

def test_me_endpoint(client, auth_headers):
    response = client.get("/api/auth/me", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "test@test.com"

def test_me_endpoint_no_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401

def test_register_success(client, auth_headers, test_franchise):
    response = client.post(
        "/api/auth/register?email=new@test.com&password=newpass123&name=New%20User",
        headers=auth_headers
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "new@test.com"
    assert data["name"] == "New User"

def test_register_duplicate_email(client, auth_headers, test_user):
    response = client.post(
        "/api/auth/register?email=test@test.com&password=pass123&name=Another%20User",
        headers=auth_headers
    )
    assert response.status_code == 400
    assert "ya registrado" in response.json()["detail"].lower()
