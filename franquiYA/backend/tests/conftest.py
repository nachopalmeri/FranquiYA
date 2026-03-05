import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from database import Base, get_db
from main import app
from models.user import User
from models.franchise import Franchise
from auth import get_password_hash

SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
    
    app.dependency_overrides[get_db] = override_get_db
    yield TestClient(app)
    app.dependency_overrides.clear()

@pytest.fixture(scope="function")
def test_franchise(db_session):
    franchise = Franchise(
        code="TEST001",
        name="Test Franchise",
        owner="Test Owner",
        cuit="20-12345678-9",
        address="Test Address",
        city="Test City",
        province="Test Province",
        weather_city="Test City,AR",
        supplier="Test Supplier"
    )
    db_session.add(franchise)
    db_session.commit()
    db_session.refresh(franchise)
    return franchise

@pytest.fixture(scope="function")
def test_user(db_session, test_franchise):
    user = User(
        email="test@test.com",
        name="Test User",
        hashed_password=get_password_hash("test123"),
        role="admin",
        franchise_id=test_franchise.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def auth_headers(client, test_user):
    response = client.post("/api/auth/login", json={
        "email": "test@test.com",
        "password": "test123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

# --- NUEVAS FIXTURES PARA TESTS CRUD AVANZADOS ---

@pytest.fixture(scope="function")
def another_franchise(db_session):
    franchise = Franchise(
        code="TEST002",
        name="Another Franchise",
        owner="Otra Persona",
        cuit="23-88888888-1",
        address="Other Address",
        city="Other City",
        province="Other Province",
        weather_city="Other City,AR",
        supplier="Other Supplier"
    )
    db_session.add(franchise)
    db_session.commit()
    db_session.refresh(franchise)
    return franchise

@pytest.fixture(scope="function")
def other_admin_user(db_session, another_franchise):
    user = User(
        email="otheradmin@test.com",
        name="Other Admin",
        hashed_password=get_password_hash("other123"),
        role="admin",
        franchise_id=another_franchise.id,
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def other_admin_headers(client, other_admin_user):
    response = client.post("/api/auth/login", json={
        "email": "otheradmin@test.com",
        "password": "other123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}

@pytest.fixture(scope="function")
def superadmin_user(db_session):
    user = User(
        email="super@test.com",
        name="Super Admin",
        hashed_password=get_password_hash("super123"),
        role="superadmin",
        # superadmin no necesita franchise_id
        is_active=True
    )
    db_session.add(user)
    db_session.commit()
    db_session.refresh(user)
    return user

@pytest.fixture(scope="function")
def superadmin_headers(client, superadmin_user):
    response = client.post("/api/auth/login", json={
        "email": "super@test.com",
        "password": "super123"
    })
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
