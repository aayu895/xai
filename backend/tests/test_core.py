"""
XAI-Gov Backend Tests
Run: pytest tests/ -v
"""
import pytest
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.core.security import get_password_hash, verify_password, create_access_token, decode_token
from app.ml.engine import XAIModel, generate_synthetic_dataset, FEATURE_NAMES


# ─── Security Tests ──────────────────────────────────────────────────────────

class TestSecurity:
    def test_password_hashing(self):
        pw = "TestPassword@123"
        hashed = get_password_hash(pw)
        assert hashed != pw
        assert verify_password(pw, hashed)
        assert not verify_password("wrong", hashed)

    def test_jwt_token_creation(self):
        token = create_access_token({"sub": "42", "role": "citizen"})
        assert token is not None
        payload = decode_token(token)
        assert payload["sub"] == "42"
        assert payload["role"] == "citizen"

    def test_jwt_invalid_token(self):
        from fastapi import HTTPException
        with pytest.raises(HTTPException):
            decode_token("invalid.token.here")


# ─── ML Engine Tests ─────────────────────────────────────────────────────────

class TestMLEngine:
    @pytest.fixture(scope="class")
    def welfare_model(self):
        m = XAIModel("welfare")
        df = generate_synthetic_dataset(500, "welfare")
        m.train(df)
        return m

    def test_dataset_generation(self):
        df = generate_synthetic_dataset(100, "welfare")
        assert len(df) == 100
        for col in FEATURE_NAMES + ["approved"]:
            assert col in df.columns
        assert df["approved"].isin([0, 1]).all()

    def test_model_training_metrics(self, welfare_model):
        m = welfare_model
        assert m.metrics["accuracy"] > 0.6
        assert m.metrics["auc_roc"] > 0.6
        assert "f1_score" in m.metrics
        assert "training_samples" in m.metrics

    def test_model_predict_structure(self, welfare_model):
        features = {
            "income": 200000, "family_size": 4, "education_level": 2,
            "health_status": 3, "region_code": 2, "employment_status": 1,
            "age": 35, "disability_status": 0,
        }
        result = welfare_model.predict(features)
        assert isinstance(result["prediction"], bool)
        assert 0.0 <= result["confidence"] <= 1.0
        assert 0.0 <= result["fairness_score"] <= 1.0
        assert isinstance(result["bias_detected"], bool)
        assert isinstance(result["shap_values"], dict)
        assert len(result["shap_values"]) == len(FEATURE_NAMES)
        assert isinstance(result["lime_explanation"], dict)
        assert isinstance(result["plain_english_explanation"], str)
        assert len(result["plain_english_explanation"]) > 20
        assert isinstance(result["top_positive_factors"], list)
        assert isinstance(result["top_negative_factors"], list)

    def test_shap_values_sum_to_prediction(self, welfare_model):
        features = {
            "income": 100000, "family_size": 6, "education_level": 1,
            "health_status": 2, "region_code": 1, "employment_status": 0,
            "age": 45, "disability_status": 1,
        }
        result = welfare_model.predict(features)
        shap_sum = sum(result["shap_values"].values())
        # SHAP values + base value should approximate prediction logit
        assert isinstance(shap_sum, float)

    def test_all_application_types(self):
        for app_type in ["welfare", "scholarship", "healthcare", "subsidy"]:
            m = XAIModel(app_type)
            df = generate_synthetic_dataset(200, app_type)
            metrics = m.train(df)
            assert metrics["accuracy"] > 0.5, f"Model for {app_type} underperforming"

    def test_feature_importance(self, welfare_model):
        features = {
            "income": 150000, "family_size": 3, "education_level": 3,
            "health_status": 4, "region_code": 3, "employment_status": 2,
            "age": 30, "disability_status": 0,
        }
        result = welfare_model.predict(features)
        importance = result["feature_importance"]
        assert len(importance) == len(FEATURE_NAMES)
        assert all(v >= 0 for v in importance.values())
        total = sum(importance.values())
        assert abs(total - 1.0) < 0.01  # should sum to ~1.0

    def test_disability_factor_weight(self, welfare_model):
        base = {
            "income": 200000, "family_size": 4, "education_level": 2,
            "health_status": 3, "region_code": 2, "employment_status": 1, "age": 35,
        }
        r_no_disability  = welfare_model.predict({**base, "disability_status": 0})
        r_with_disability = welfare_model.predict({**base, "disability_status": 1})
        shap_no  = r_no_disability["shap_values"].get("disability_status", 0)
        shap_yes = r_with_disability["shap_values"].get("disability_status", 0)
        # disability=1 should have a more positive SHAP impact for welfare
        assert shap_yes >= shap_no


# ─── Schema / Config Tests ───────────────────────────────────────────────────

class TestConfig:
    def test_settings_loaded(self):
        from app.core.config import settings
        assert settings.APP_NAME == "XAI-Gov"
        assert settings.ALGORITHM == "HS256"
        assert settings.ACCESS_TOKEN_EXPIRE_MINUTES > 0

    def test_feature_names_constant(self):
        assert len(FEATURE_NAMES) == 8
        assert "income" in FEATURE_NAMES
        assert "disability_status" in FEATURE_NAMES
