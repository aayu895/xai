#!/usr/bin/env python3
"""
Seed script: populates XAI-Gov database with demo users and decisions.
Run: python scripts/seed.py
"""
import asyncio
import sys
import os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from app.core.config import settings
from app.core.security import get_password_hash
from app.models.models import User, Decision, Explanation, AuditLog, Notification, AIModel, UserRole, DecisionStatus, ApplicationType
from app.db.base import Base
from app.ml.engine import get_model
import random
from datetime import datetime, timedelta
from loguru import logger

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = async_sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

CITIZENS = [
    {"email": "ravi.kumar@example.com",    "full_name": "Ravi Kumar",    "phone": "+91-9876543210"},
    {"email": "priya.sharma@example.com",  "full_name": "Priya Sharma",  "phone": "+91-9876543211"},
    {"email": "amit.patel@example.com",    "full_name": "Amit Patel",    "phone": "+91-9876543212"},
    {"email": "sunita.devi@example.com",   "full_name": "Sunita Devi",   "phone": "+91-9876543213"},
    {"email": "mohan.das@example.com",     "full_name": "Mohan Das",     "phone": "+91-9876543214"},
]

OFFICERS = [
    {"email": "officer.sharma@gov.in",   "full_name": "R. Sharma (Officer)",   "phone": "+91-9000000001"},
    {"email": "officer.gupta@gov.in",    "full_name": "A. Gupta (Officer)",    "phone": "+91-9000000002"},
]

ADMIN = {"email": "admin@xaigov.in", "full_name": "System Administrator", "phone": "+91-9000000000"}

APP_TYPES = [ApplicationType.WELFARE, ApplicationType.SCHOLARSHIP, ApplicationType.HEALTHCARE, ApplicationType.SUBSIDY]

SAMPLE_FEATURES = [
    {"income": 120000, "family_size": 5, "education_level": 2, "health_status": 3, "region_code": 1, "employment_status": 0, "age": 35, "disability_status": 0},
    {"income": 450000, "family_size": 3, "education_level": 4, "health_status": 4, "region_code": 3, "employment_status": 2, "age": 28, "disability_status": 0},
    {"income": 80000,  "family_size": 7, "education_level": 1, "health_status": 2, "region_code": 1, "employment_status": 0, "age": 50, "disability_status": 1},
    {"income": 200000, "family_size": 4, "education_level": 3, "health_status": 3, "region_code": 2, "employment_status": 1, "age": 42, "disability_status": 0},
    {"income": 600000, "family_size": 2, "education_level": 5, "health_status": 5, "region_code": 4, "employment_status": 2, "age": 33, "disability_status": 0},
]


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Tables created")

    async with AsyncSessionLocal() as db:
        # Create admin
        admin = User(
            email=ADMIN["email"], full_name=ADMIN["full_name"],
            hashed_password=get_password_hash("Admin@123"),
            role=UserRole.ADMIN, is_active=True, is_verified=True,
            phone=ADMIN["phone"], citizen_id=None,
        )
        db.add(admin)

        # Create officers
        officer_users = []
        for o in OFFICERS:
            u = User(
                email=o["email"], full_name=o["full_name"],
                hashed_password=get_password_hash("Officer@123"),
                role=UserRole.OFFICER, is_active=True, is_verified=True, phone=o["phone"],
            )
            db.add(u)
            officer_users.append(u)

        # Create citizens
        citizen_users = []
        for i, c in enumerate(CITIZENS):
            u = User(
                email=c["email"], full_name=c["full_name"],
                hashed_password=get_password_hash("Citizen@123"),
                role=UserRole.CITIZEN, is_active=True, is_verified=True,
                phone=c["phone"], citizen_id=f"CIT-{10001 + i}",
            )
            db.add(u)
            citizen_users.append(u)

        await db.flush()
        logger.info(f"Created {len(citizen_users)} citizens, {len(officer_users)} officers, 1 admin")

        # Create AI model records
        for app_type in ["welfare", "scholarship", "healthcare", "subsidy"]:
            m = get_model(app_type)
            ai_model = AIModel(
                name=f"XGBoost-{app_type.capitalize()}",
                model_type="XGBoost",
                application_type=app_type,
                version="1.0.0",
                accuracy=m.metrics.get("accuracy", 0.92),
                precision=m.metrics.get("precision", 0.89),
                recall=m.metrics.get("recall", 0.91),
                f1_score=m.metrics.get("f1_score", 0.90),
                auc_roc=m.metrics.get("auc_roc", 0.95),
                is_active=True,
                training_samples=m.metrics.get("training_samples", 4000),
                feature_names={"features": m.feature_names},
                hyperparameters={"n_estimators": 200, "max_depth": 6, "learning_rate": 0.1},
            )
            db.add(ai_model)

        # Create decisions
        decisions_created = []
        for i, citizen in enumerate(citizen_users):
            for j in range(3):
                app_type = APP_TYPES[(i + j) % len(APP_TYPES)]
                feats = SAMPLE_FEATURES[(i + j) % len(SAMPLE_FEATURES)]
                model = get_model(app_type.value)
                result = model.predict(feats)

                decision = Decision(
                    citizen_id=citizen.id,
                    application_type=app_type,
                    status=DecisionStatus.PENDING,
                    **feats,
                    ai_decision=result["prediction"],
                    confidence_score=result["confidence"],
                    fairness_score=result["fairness_score"],
                    bias_detected=result["bias_detected"],
                    application_notes=f"Application {i*3+j+1} submitted via citizen portal.",
                    created_at=datetime.utcnow() - timedelta(days=random.randint(1, 30)),
                )
                db.add(decision)
                await db.flush()

                exp = Explanation(
                    decision_id=decision.id,
                    shap_values=result["shap_values"],
                    shap_base_value=result["shap_base_value"],
                    feature_importance=result["feature_importance"],
                    lime_explanation=result["lime_explanation"],
                    plain_english_explanation=result["plain_english_explanation"],
                    top_positive_factors=result["top_positive_factors"],
                    top_negative_factors=result["top_negative_factors"],
                    model_accuracy=result["model_accuracy"],
                    model_version=result["model_version"],
                )
                db.add(exp)

                # Some decisions reviewed by officer
                if random.random() > 0.4:
                    officer = random.choice(officer_users)
                    decision.officer_id = officer.id
                    decision.officer_decision = result["prediction"]
                    decision.is_overridden = False
                    decision.reviewed_at = decision.created_at + timedelta(hours=random.randint(2, 48))
                    decision.status = DecisionStatus.APPROVED if result["prediction"] else DecisionStatus.REJECTED
                    decision.officer_notes = "Reviewed and confirmed AI decision based on submitted documents."

                notif = Notification(
                    user_id=citizen.id,
                    title="Application Update",
                    message=f"Your {app_type.value} application status has been updated.",
                    notification_type="decision",
                    related_decision_id=decision.id,
                )
                db.add(notif)
                decisions_created.append(decision)

        await db.commit()
        logger.info(f"Created {len(decisions_created)} decisions with explanations")
        logger.info("✅ Seed complete!")
        logger.info("\n--- Demo Credentials ---")
        logger.info(f"Admin:   admin@xaigov.in / Admin@123")
        logger.info(f"Officer: officer.sharma@gov.in / Officer@123")
        logger.info(f"Citizen: ravi.kumar@example.com / Citizen@123")


if __name__ == "__main__":
    asyncio.run(seed())
