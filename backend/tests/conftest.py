import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import os

# Set testing environment variable
os.environ["ENV"] = "testing"

from app.main import app
from app.db.database import Base, get_db
from app.auth.dependencies import get_current_user, require_admin_access, AuthUser

# SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="session", autouse=True)
def setup_database():
    """Create all tables before tests run and drop them after."""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    """Provides a fresh database session for a test."""
    session = TestingSessionLocal()
    try:
        yield session
    finally:
        session.close()

@pytest.fixture
def client(db_session):
    """Provides a FastAPI TestClient with the database dependency overridden."""
    def override_get_db():
        try:
            yield db_session
        finally:
            pass
            
    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()

@pytest.fixture
def mock_user_auth(client):
    """Overrides get_current_user to always return a mock user."""
    mock_user = AuthUser(
        id="test_user_id",
        email="test@example.com",
        full_name="Test User"
    )
    
    def override_verify_user():
        return mock_user
        
    app.dependency_overrides[get_current_user] = override_verify_user
    yield {"id": mock_user.id, "email": mock_user.email, "full_name": mock_user.full_name}
    app.dependency_overrides.pop(get_current_user, None)

@pytest.fixture
def mock_admin_auth(client):
    """Overrides require_admin_access to always return a mock admin user."""
    mock_admin = AuthUser(
        id="admin_user_id",
        email="admin@example.com",
        full_name="Admin User"
    )
    
    def override_require_admin():
        return mock_admin
        
    app.dependency_overrides[require_admin_access] = override_require_admin
    app.dependency_overrides[get_current_user] = override_require_admin
    yield {"id": mock_admin.id, "email": mock_admin.email, "full_name": mock_admin.full_name}
    app.dependency_overrides.pop(require_admin_access, None)
    app.dependency_overrides.pop(get_current_user, None)
