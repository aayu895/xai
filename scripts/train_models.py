#!/usr/bin/env python3
"""
XAI-Gov Model Training Script
Run: python scripts/train_models.py
Trains XGBoost models for all application types and saves them.
"""
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from loguru import logger
from app.ml.engine import XAIModel, generate_synthetic_dataset
import pandas as pd

APP_TYPES = ["welfare", "scholarship", "healthcare", "subsidy"]

def train_all():
    logger.info("Starting XAI-Gov model training pipeline...")

    for app_type in APP_TYPES:
        logger.info(f"\n{'='*50}")
        logger.info(f"Training model: {app_type.upper()}")

        # Try loading real CSV data first
        csv_path = f"data/sample_dataset.csv"
        if os.path.exists(csv_path):
            df = pd.read_csv(csv_path)
            logger.info(f"  Loaded {len(df)} rows from {csv_path}")
        else:
            df = generate_synthetic_dataset(5000, app_type)
            logger.info(f"  Generated {len(df)} synthetic rows")

        model = XAIModel(application_type=app_type)
        metrics = model.train(df)

        logger.info(f"  ✅ Accuracy:   {metrics['accuracy']:.4f}")
        logger.info(f"  ✅ Precision:  {metrics['precision']:.4f}")
        logger.info(f"  ✅ Recall:     {metrics['recall']:.4f}")
        logger.info(f"  ✅ F1-Score:   {metrics['f1_score']:.4f}")
        logger.info(f"  ✅ AUC-ROC:    {metrics['auc_roc']:.4f}")
        logger.info(f"  ✅ Train size: {metrics['training_samples']}")

        # Quick sanity predict
        test_features = {
            "income": 180000, "family_size": 4, "education_level": 2,
            "health_status": 3, "region_code": 1, "employment_status": 0,
            "age": 38, "disability_status": 1,
        }
        result = model.predict(test_features)
        logger.info(f"  🔍 Sample prediction: {'APPROVED' if result['prediction'] else 'REJECTED'} "
                    f"({result['confidence']*100:.1f}% confidence)")

    logger.info(f"\n{'='*50}")
    logger.info("✅ All models trained and saved successfully!")
    logger.info(f"   Models saved to: app/ml/models/")

if __name__ == "__main__":
    train_all()
