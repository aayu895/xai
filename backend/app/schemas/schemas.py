from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from app.models.models import UserRole, DecisionStatus, AppealStatus, ApplicationType


# ─── Auth Schemas ───────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=255)
    password: str = Field(..., min_length=8)
    phone: Optional[str] = None
    address: Optional[str] = None
    role: UserRole = UserRole.CITIZEN


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserOut(BaseModel):
    id: int
    email: str
    full_name: str
    role: UserRole
    is_active: bool
    is_verified: bool
    phone: Optional[str]
    citizen_id: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserOut


class TokenData(BaseModel):
    user_id: Optional[int] = None
    role: Optional[str] = None


# ─── Decision Schemas ────────────────────────────────────────────────────────

class DecisionCreate(BaseModel):
    application_type: ApplicationType
    income: float = Field(..., ge=0, le=10000000)
    family_size: int = Field(..., ge=1, le=20)
    education_level: int = Field(..., ge=0, le=5, description="0=None,1=Primary,2=Secondary,3=HighSchool,4=Bachelor,5=PostGrad")
    health_status: int = Field(..., ge=1, le=5, description="1=Critical,2=Poor,3=Fair,4=Good,5=Excellent")
    region_code: int = Field(..., ge=1, le=5, description="1=Rural,2=SemiUrban,3=Urban,4=Metro,5=Capital")
    employment_status: int = Field(..., ge=0, le=3, description="0=Unemployed,1=PartTime,2=FullTime,3=SelfEmployed")
    age: int = Field(..., ge=18, le=100)
    disability_status: int = Field(..., ge=0, le=1)
    application_notes: Optional[str] = None


class ExplanationOut(BaseModel):
    id: int
    decision_id: int
    shap_values: Optional[Dict[str, float]]
    shap_base_value: Optional[float]
    feature_importance: Optional[Dict[str, float]]
    lime_explanation: Optional[Dict[str, Any]]
    plain_english_explanation: Optional[str]
    top_positive_factors: Optional[List[Dict[str, Any]]]
    top_negative_factors: Optional[List[Dict[str, Any]]]
    model_accuracy: Optional[float]
    model_version: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


class DecisionOut(BaseModel):
    id: int
    citizen_id: int
    officer_id: Optional[int]
    application_type: ApplicationType
    status: DecisionStatus
    income: Optional[float]
    family_size: Optional[int]
    education_level: Optional[int]
    health_status: Optional[int]
    region_code: Optional[int]
    employment_status: Optional[int]
    age: Optional[int]
    disability_status: Optional[int]
    ai_decision: Optional[bool]
    confidence_score: Optional[float]
    fairness_score: Optional[float]
    bias_detected: bool
    officer_decision: Optional[bool]
    officer_notes: Optional[str]
    is_overridden: bool
    reviewed_at: Optional[datetime]
    application_notes: Optional[str]
    created_at: datetime
    updated_at: datetime
    explanation: Optional[ExplanationOut]
    citizen: Optional[UserOut]

    class Config:
        from_attributes = True


class OfficerReview(BaseModel):
    decision: bool
    notes: Optional[str] = None


# ─── Appeal Schemas ──────────────────────────────────────────────────────────

class AppealCreate(BaseModel):
    reason: str = Field(..., min_length=20, max_length=2000)
    supporting_documents: Optional[str] = None


class AppealOut(BaseModel):
    id: int
    decision_id: int
    citizen_id: int
    status: AppealStatus
    reason: str
    resolution: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Audit Log Schemas ───────────────────────────────────────────────────────

class AuditLogOut(BaseModel):
    id: int
    user_id: Optional[int]
    decision_id: Optional[int]
    action: str
    entity_type: str
    entity_id: Optional[int]
    old_value: Optional[Dict]
    new_value: Optional[Dict]
    ip_address: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Analytics Schemas ───────────────────────────────────────────────────────

class DashboardStats(BaseModel):
    total_decisions: int
    approved_count: int
    rejected_count: int
    pending_count: int
    average_confidence: float
    average_fairness: float
    bias_detected_count: int
    overridden_count: int
    appeal_count: int
    approval_rate: float


class ModelPerformance(BaseModel):
    model_name: str
    accuracy: float
    precision: float
    recall: float
    f1_score: float
    auc_roc: float
    training_samples: int
    version: str


class NotificationOut(BaseModel):
    id: int
    title: str
    message: str
    notification_type: str
    is_read: bool
    created_at: datetime

    class Config:
        from_attributes = True
