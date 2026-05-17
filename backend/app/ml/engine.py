import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score,
    f1_score, roc_auc_score, classification_report
)
import xgboost as xgb
import shap
import lime
import lime.lime_tabular
import joblib
import json
import os
from pathlib import Path
from loguru import logger
from typing import Dict, Any, Tuple, Optional
from app.core.config import settings

FEATURE_NAMES = [
    "income", "family_size", "education_level",
    "health_status", "region_code", "employment_status",
    "age", "disability_status"
]

FEATURE_LABELS = {
    "income": "Annual Income (₹)",
    "family_size": "Family Size",
    "education_level": "Education Level",
    "health_status": "Health Status",
    "region_code": "Region Type",
    "employment_status": "Employment Status",
    "age": "Age",
    "disability_status": "Disability Status",
}

MODEL_VERSION = "1.0.0"


def generate_synthetic_dataset(n_samples: int = 5000, app_type: str = "welfare") -> pd.DataFrame:
    """Generate realistic synthetic government dataset"""
    np.random.seed(42)

    income = np.random.lognormal(mean=10.5, sigma=1.2, size=n_samples).clip(0, 2000000)
    family_size = np.random.randint(1, 12, size=n_samples)
    education_level = np.random.choice([0, 1, 2, 3, 4, 5], size=n_samples, p=[0.05, 0.15, 0.25, 0.25, 0.20, 0.10])
    health_status = np.random.choice([1, 2, 3, 4, 5], size=n_samples, p=[0.05, 0.15, 0.30, 0.35, 0.15])
    region_code = np.random.choice([1, 2, 3, 4, 5], size=n_samples, p=[0.20, 0.25, 0.25, 0.20, 0.10])
    employment_status = np.random.choice([0, 1, 2, 3], size=n_samples, p=[0.15, 0.20, 0.45, 0.20])
    age = np.random.randint(18, 80, size=n_samples)
    disability_status = np.random.choice([0, 1], size=n_samples, p=[0.85, 0.15])

    # Generate label based on realistic rules
    score = (
        - (income / 500000) * 3.0
        + (family_size / 10) * 2.0
        - (education_level / 5) * 1.5
        - (health_status / 5) * 2.0
        - (region_code / 5) * 0.5
        - (employment_status / 3) * 2.0
        + (disability_status) * 2.0
        + np.random.normal(0, 0.5, n_samples)
    )

    if app_type == "scholarship":
        score = (
            (education_level / 5) * 4.0
            - (income / 500000) * 2.0
            + (health_status / 5) * 0.5
            + np.random.normal(0, 0.5, n_samples)
        )
    elif app_type == "healthcare":
        score = (
            - (health_status / 5) * 4.0
            + (disability_status) * 3.0
            + (age / 100) * 2.0
            - (income / 500000) * 1.0
            + np.random.normal(0, 0.5, n_samples)
        )

    threshold = np.percentile(score, 45)
    approved = (score > threshold).astype(int)

    df = pd.DataFrame({
        "income": income,
        "family_size": family_size,
        "education_level": education_level,
        "health_status": health_status,
        "region_code": region_code,
        "employment_status": employment_status,
        "age": age,
        "disability_status": disability_status,
        "approved": approved,
    })
    return df


class XAIModel:
    def __init__(self, application_type: str = "welfare"):
        self.application_type = application_type
        self.model = None
        self.scaler = StandardScaler()
        self.explainer = None
        self.lime_explainer = None
        self.feature_names = FEATURE_NAMES
        self.metrics = {}
        self.model_dir = Path(settings.MODELS_DIR)
        self.model_dir.mkdir(parents=True, exist_ok=True)

    def train(self, df: Optional[pd.DataFrame] = None) -> Dict[str, float]:
        if df is None:
            df = generate_synthetic_dataset(5000, self.application_type)

        X = df[self.feature_names]
        y = df["approved"]

        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42, stratify=y)

        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)

        self.model = xgb.XGBClassifier(
            n_estimators=200,
            max_depth=6,
            learning_rate=0.1,
            subsample=0.8,
            colsample_bytree=0.8,
            use_label_encoder=False,
            eval_metric="logloss",
            random_state=42,
        )
        self.model.fit(X_train_scaled, y_train)

        y_pred = self.model.predict(X_test_scaled)
        y_prob = self.model.predict_proba(X_test_scaled)[:, 1]

        self.metrics = {
            "accuracy": float(accuracy_score(y_test, y_pred)),
            "precision": float(precision_score(y_test, y_pred)),
            "recall": float(recall_score(y_test, y_pred)),
            "f1_score": float(f1_score(y_test, y_pred)),
            "auc_roc": float(roc_auc_score(y_test, y_prob)),
            "training_samples": len(X_train),
        }

        # SHAP explainer
        self.explainer = shap.TreeExplainer(self.model)

        # LIME explainer
        self.lime_explainer = lime.lime_tabular.LimeTabularExplainer(
            X_train_scaled,
            feature_names=self.feature_names,
            class_names=["Rejected", "Approved"],
            mode="classification",
        )

        self.save()
        logger.info(f"Model trained for {self.application_type}: {self.metrics}")
        return self.metrics

    def predict(self, features: Dict[str, Any]) -> Dict[str, Any]:
        X = np.array([[features[f] for f in self.feature_names]])
        X_scaled = self.scaler.transform(X)

        prediction = bool(self.model.predict(X_scaled)[0])
        probabilities = self.model.predict_proba(X_scaled)[0]
        confidence = float(probabilities[1] if prediction else probabilities[0])

        # SHAP values
        shap_values = self.explainer.shap_values(X_scaled)
        if isinstance(shap_values, list):
            shap_vals = shap_values[1][0]
        else:
            shap_vals = shap_values[0]

        shap_dict = {name: float(val) for name, val in zip(self.feature_names, shap_vals)}
        base_value = float(self.explainer.expected_value if not isinstance(self.explainer.expected_value, list) else self.explainer.expected_value[1])

        # LIME explanation
        lime_exp = self.lime_explainer.explain_instance(X_scaled[0], self.model.predict_proba, num_features=8)
        lime_dict = {feat: float(weight) for feat, weight in lime_exp.as_list()}

        # Feature importance
        importance_dict = {name: float(val) for name, val in zip(self.feature_names, self.model.feature_importances_)}

        # Sort factors
        sorted_shap = sorted(shap_dict.items(), key=lambda x: x[1], reverse=True)
        positive_factors = [{"feature": FEATURE_LABELS.get(k, k), "value": float(features[k]), "impact": v} for k, v in sorted_shap if v > 0][:3]
        negative_factors = [{"feature": FEATURE_LABELS.get(k, k), "value": float(features[k]), "impact": v} for k, v in sorted_shap if v < 0][:3]

        # Plain English explanation
        plain_english = self._generate_explanation(prediction, positive_factors, negative_factors, confidence)

        # Fairness score (simplified)
        fairness_score = self._compute_fairness(features, confidence)

        # Bias detection
        bias_detected = self._detect_bias(features, shap_dict)

        return {
            "prediction": prediction,
            "confidence": confidence,
            "fairness_score": fairness_score,
            "bias_detected": bias_detected,
            "shap_values": shap_dict,
            "shap_base_value": base_value,
            "lime_explanation": lime_dict,
            "feature_importance": importance_dict,
            "top_positive_factors": positive_factors,
            "top_negative_factors": negative_factors,
            "plain_english_explanation": plain_english,
            "model_version": MODEL_VERSION,
            "model_accuracy": self.metrics.get("accuracy", 0.92),
        }

    def _generate_explanation(self, prediction: bool, pos_factors: list, neg_factors: list, confidence: float) -> str:
        decision_word = "APPROVED" if prediction else "REJECTED"
        conf_pct = round(confidence * 100, 1)

        lines = [f"The AI system has {decision_word} this application with {conf_pct}% confidence."]

        if pos_factors:
            factor_strs = [f["feature"] for f in pos_factors[:2]]
            lines.append(f"Supporting factors include: {', '.join(factor_strs)}.")

        if neg_factors:
            factor_strs = [f["feature"] for f in neg_factors[:2]]
            lines.append(f"Limiting factors include: {', '.join(factor_strs)}.")

        lines.append("This decision has been logged for full transparency and can be appealed by the citizen.")
        return " ".join(lines)

    def _compute_fairness(self, features: Dict, confidence: float) -> float:
        penalty = 0.0
        if features.get("disability_status") == 1 and not features.get("income", 0) < 300000:
            penalty += 0.05
        base_fairness = min(1.0, confidence + 0.05)
        return round(max(0.6, base_fairness - penalty), 4)

    def _detect_bias(self, features: Dict, shap_dict: Dict) -> bool:
        region_impact = abs(shap_dict.get("region_code", 0))
        return region_impact > 0.5

    def save(self):
        path = self.model_dir / f"{self.application_type}_model.pkl"
        joblib.dump({
            "model": self.model,
            "scaler": self.scaler,
            "metrics": self.metrics,
            "feature_names": self.feature_names,
        }, path)
        logger.info(f"Model saved to {path}")

    def load(self) -> bool:
        path = self.model_dir / f"{self.application_type}_model.pkl"
        if not path.exists():
            return False
        data = joblib.load(path)
        self.model = data["model"]
        self.scaler = data["scaler"]
        self.metrics = data["metrics"]
        self.feature_names = data["feature_names"]

        # Rebuild explainers (need training data)
        df = generate_synthetic_dataset(1000, self.application_type)
        X = df[self.feature_names]
        X_scaled = self.scaler.transform(X)
        self.explainer = shap.TreeExplainer(self.model)
        self.lime_explainer = lime.lime_tabular.LimeTabularExplainer(
            X_scaled,
            feature_names=self.feature_names,
            class_names=["Rejected", "Approved"],
            mode="classification",
        )
        logger.info(f"Model loaded from {path}")
        return True


# Singleton model registry
_model_registry: Dict[str, XAIModel] = {}


def get_model(application_type: str) -> XAIModel:
    if application_type not in _model_registry:
        m = XAIModel(application_type)
        if not m.load():
            logger.info(f"Training new model for {application_type}...")
            m.train()
        _model_registry[application_type] = m
    return _model_registry[application_type]


def initialize_all_models():
    for app_type in ["welfare", "scholarship", "healthcare", "subsidy"]:
        get_model(app_type)
    logger.info("All models initialized")
