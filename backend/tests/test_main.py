"""
XAI-Gov Backend Tests
Run: pytest tests/ -v
"""
import pytest
from httpx import AsyncClient, ASGITransport
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture
async def client():
    from main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as c:
        yield c


@pytest.mark.anyio
async def test_health(client):
    res = await client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"


@pytest.mark.anyio
async def test_register_and_login(client):
    # Register
    reg = await client.post("/api/v1/auth/register", json={
        "email": "test_pytest@example.com",
        "full_name": "Test User",
        "password": "TestPass@123",
        "role": "citizen",
    })
    assert reg.status_code in (200, 201, 400)  # 400 if already exists

    # Login
    login = await client.post("/api/v1/auth/login", json={
        "email": "test_pytest@example.com",
        "password": "TestPass@123",
    })
    if login.status_code == 200:
        data = login.json()
        assert "access_token" in data
        assert "user" in data
        assert data["user"]["role"] == "citizen"


@pytest.mark.anyio
async def test_ml_engine():
    from app.ml.engine import get_model
    model = get_model("welfare")
    result = model.predict({
        "income": 150000, "family_size": 4,
        "education_level": 2, "health_status": 3,
        "region_code": 2, "employment_status": 1,
        "age": 35, "disability_status": 0,
    })
    assert "prediction" in result
    assert "confidence" in result
    assert "shap_values" in result
    assert "plain_english_explanation" in result
    assert 0 <= result["confidence"] <= 1
    assert 0 <= result["fairness_score"] <= 1
    assert isinstance(result["prediction"], bool)
    assert len(result["shap_values"]) == 8


@pytest.mark.anyio
async def test_all_model_types():
    from app.ml.engine import get_model
    for app_type in ["welfare", "scholarship", "healthcare", "subsidy"]:
        model = get_model(app_type)
        result = model.predict({
            "income": 200000, "family_size": 3,
            "education_level": 3, "health_status": 4,
            "region_code": 3, "employment_status": 2,
            "age": 30, "disability_status": 0,
        })
        assert result["model_version"] == "1.0.0"
        assert result["shap_values"] is not None
        assert result["lime_explanation"] is not None
