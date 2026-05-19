from sqlalchemy import String, Boolean, Integer, Float, Text, ForeignKey, JSON, Enum as SAEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy import DateTime
from datetime import datetime
from typing import Optional, List
import enum
from app.db.base import Base, TimestampMixin


class UserRole(str, enum.Enum):
    CITIZEN = "citizen"
    OFFICER = "officer"
    ADMIN = "admin"


class DecisionStatus(str, enum.Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    UNDER_REVIEW = "under_review"
    APPEALED = "appealed"


class AppealStatus(str, enum.Enum):
    SUBMITTED = "submitted"
    IN_REVIEW = "in_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class ApplicationType(str, enum.Enum):
    WELFARE = "welfare"
    SCHOLARSHIP = "scholarship"
    HEALTHCARE = "healthcare"
    SUBSIDY = "subsidy"
    GRIEVANCE = "grievance"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True, nullable=False)
    full_name: Mapped[str] = mapped_column(String(255), nullable=False)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(SAEnum(UserRole), default=UserRole.CITIZEN)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)
    phone: Mapped[Optional[str]] = mapped_column(String(20))
    address: Mapped[Optional[str]] = mapped_column(Text)
    citizen_id: Mapped[Optional[str]] = mapped_column(String(50), unique=True)

    decisions: Mapped[List["Decision"]] = relationship("Decision", back_populates="citizen", foreign_keys="Decision.citizen_id")
    reviewed_decisions: Mapped[List["Decision"]] = relationship("Decision", back_populates="officer", foreign_keys="Decision.officer_id")
    appeals: Mapped[List["Appeal"]] = relationship(
    "Appeal",
    foreign_keys="Appeal.citizen_id",
    back_populates="citizen"
   )

    resolved_appeals: Mapped[List["Appeal"]] = relationship(
    "Appeal",
    foreign_keys="Appeal.resolved_by",
    back_populates="resolver"
)
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="user")
    notifications: Mapped[List["Notification"]] = relationship("Notification", back_populates="user")


class Decision(Base, TimestampMixin):
    __tablename__ = "decisions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    citizen_id: Mapped[int] = mapped_column(ForeignKey("users.id"), nullable=False)
    officer_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    application_type: Mapped[ApplicationType] = mapped_column(SAEnum(ApplicationType))
    status: Mapped[DecisionStatus] = mapped_column(SAEnum(DecisionStatus), default=DecisionStatus.PENDING)

    # Input features
    income: Mapped[Optional[float]] = mapped_column(Float)
    family_size: Mapped[Optional[int]] = mapped_column(Integer)
    education_level: Mapped[Optional[int]] = mapped_column(Integer)
    health_status: Mapped[Optional[int]] = mapped_column(Integer)
    region_code: Mapped[Optional[int]] = mapped_column(Integer)
    employment_status: Mapped[Optional[int]] = mapped_column(Integer)
    age: Mapped[Optional[int]] = mapped_column(Integer)
    disability_status: Mapped[Optional[int]] = mapped_column(Integer)

    # AI Output
    ai_decision: Mapped[Optional[bool]] = mapped_column(Boolean)
    confidence_score: Mapped[Optional[float]] = mapped_column(Float)
    fairness_score: Mapped[Optional[float]] = mapped_column(Float)
    bias_detected: Mapped[bool] = mapped_column(Boolean, default=False)

    # Officer override
    officer_decision: Mapped[Optional[bool]] = mapped_column(Boolean)
    officer_notes: Mapped[Optional[str]] = mapped_column(Text)
    reviewed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    # Additional info
    application_notes: Mapped[Optional[str]] = mapped_column(Text)
    is_overridden: Mapped[bool] = mapped_column(Boolean, default=False)

    citizen: Mapped["User"] = relationship("User", back_populates="decisions", foreign_keys=[citizen_id])
    officer: Mapped[Optional["User"]] = relationship("User", back_populates="reviewed_decisions", foreign_keys=[officer_id])
    explanation: Mapped[Optional["Explanation"]] = relationship("Explanation", back_populates="decision", uselist=False)
    appeals: Mapped[List["Appeal"]] = relationship("Appeal", back_populates="decision")
    audit_logs: Mapped[List["AuditLog"]] = relationship("AuditLog", back_populates="decision")
    report: Mapped[Optional["Report"]] = relationship("Report", back_populates="decision", uselist=False)


class Explanation(Base, TimestampMixin):
    __tablename__ = "explanations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    decision_id: Mapped[int] = mapped_column(ForeignKey("decisions.id"), unique=True)

    # SHAP values
    shap_values: Mapped[Optional[dict]] = mapped_column(JSON)
    shap_base_value: Mapped[Optional[float]] = mapped_column(Float)
    feature_importance: Mapped[Optional[dict]] = mapped_column(JSON)

    # LIME explanation
    lime_explanation: Mapped[Optional[dict]] = mapped_column(JSON)

    # Human readable
    plain_english_explanation: Mapped[Optional[str]] = mapped_column(Text)
    top_positive_factors: Mapped[Optional[dict]] = mapped_column(JSON)
    top_negative_factors: Mapped[Optional[dict]] = mapped_column(JSON)

    # Global model stats
    model_accuracy: Mapped[Optional[float]] = mapped_column(Float)
    model_version: Mapped[Optional[str]] = mapped_column(String(50))

    decision: Mapped["Decision"] = relationship("Decision", back_populates="explanation")


class Appeal(Base, TimestampMixin):
    __tablename__ = "appeals"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    decision_id: Mapped[int] = mapped_column(ForeignKey("decisions.id"))
    citizen_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    resolved_by: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))

    decision: Mapped["Decision"] = relationship("Decision", back_populates="appeals")

    citizen: Mapped["User"] = relationship(
        "User",
        back_populates="appeals",
        foreign_keys=[citizen_id]
    )

    resolver: Mapped[Optional["User"]] = relationship(
    "User",
    back_populates="resolved_appeals",
    foreign_keys=[resolved_by]
)


class AuditLog(Base, TimestampMixin):
    __tablename__ = "audit_logs"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(ForeignKey("users.id"))
    decision_id: Mapped[Optional[int]] = mapped_column(ForeignKey("decisions.id"))
    action: Mapped[str] = mapped_column(String(100))
    entity_type: Mapped[str] = mapped_column(String(50))
    entity_id: Mapped[Optional[int]] = mapped_column(Integer)
    old_value: Mapped[Optional[dict]] = mapped_column(JSON)
    new_value: Mapped[Optional[dict]] = mapped_column(JSON)
    ip_address: Mapped[Optional[str]] = mapped_column(String(50))
    user_agent: Mapped[Optional[str]] = mapped_column(String(255))
    log_metadata: Mapped[Optional[dict]] = mapped_column(JSON)

    user: Mapped[Optional["User"]] = relationship("User", back_populates="audit_logs")
    decision: Mapped[Optional["Decision"]] = relationship("Decision", back_populates="audit_logs")


class Report(Base, TimestampMixin):
    __tablename__ = "reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    decision_id: Mapped[int] = mapped_column(ForeignKey("decisions.id"), unique=True)
    report_type: Mapped[str] = mapped_column(String(50), default="transparency")
    file_path: Mapped[Optional[str]] = mapped_column(String(500))
    content: Mapped[Optional[dict]] = mapped_column(JSON)
    generated_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True))

    decision: Mapped["Decision"] = relationship("Decision", back_populates="report")


class AIModel(Base, TimestampMixin):
    __tablename__ = "ai_models"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100))
    model_type: Mapped[str] = mapped_column(String(50))
    application_type: Mapped[str] = mapped_column(String(50))
    version: Mapped[str] = mapped_column(String(20))
    accuracy: Mapped[Optional[float]] = mapped_column(Float)
    precision: Mapped[Optional[float]] = mapped_column(Float)
    recall: Mapped[Optional[float]] = mapped_column(Float)
    f1_score: Mapped[Optional[float]] = mapped_column(Float)
    auc_roc: Mapped[Optional[float]] = mapped_column(Float)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    file_path: Mapped[Optional[str]] = mapped_column(String(500))
    training_samples: Mapped[Optional[int]] = mapped_column(Integer)
    feature_names: Mapped[Optional[dict]] = mapped_column(JSON)
    hyperparameters: Mapped[Optional[dict]] = mapped_column(JSON)


class Notification(Base, TimestampMixin):
    __tablename__ = "notifications"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[int] = mapped_column(ForeignKey("users.id"))
    title: Mapped[str] = mapped_column(String(255))
    message: Mapped[str] = mapped_column(Text)
    notification_type: Mapped[str] = mapped_column(String(50))
    is_read: Mapped[bool] = mapped_column(Boolean, default=False)
    related_decision_id: Mapped[Optional[int]] = mapped_column(ForeignKey("decisions.id"))

    user: Mapped["User"] = relationship("User", back_populates="notifications")
