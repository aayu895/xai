from fastapi import APIRouter, Depends, HTTPException, status, Request, BackgroundTasks
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from sqlalchemy.orm import selectinload
from typing import List, Optional
from datetime import datetime

from app.db.session import get_db
from app.models.models import Decision, Explanation, AuditLog, Notification, Appeal, User, DecisionStatus, AppealStatus
from app.schemas.schemas import DecisionCreate, DecisionOut, OfficerReview, AppealCreate, AppealOut
from app.core.dependencies import get_current_user, require_officer
from app.ml.engine import get_model

router = APIRouter()


async def create_audit_log(db, user_id, decision_id, action, entity_type, ip=None, old_val=None, new_val=None):
    log = AuditLog(
        user_id=user_id,
        decision_id=decision_id,
        action=action,
        entity_type=entity_type,
        entity_id=decision_id,
        old_value=old_val,
        new_value=new_val,
        ip_address=ip,
    )
    db.add(log)


@router.post("/", response_model=DecisionOut, status_code=201)
async def submit_application(
    data: DecisionCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    features = {
        "income": data.income,
        "family_size": data.family_size,
        "education_level": data.education_level,
        "health_status": data.health_status,
        "region_code": data.region_code,
        "employment_status": data.employment_status,
        "age": data.age,
        "disability_status": data.disability_status,
    }

    model = get_model(data.application_type.value)
    result = model.predict(features)

    decision = Decision(
        citizen_id=current_user.id,
        application_type=data.application_type,
        status=DecisionStatus.PENDING,
        income=data.income,
        family_size=data.family_size,
        education_level=data.education_level,
        health_status=data.health_status,
        region_code=data.region_code,
        employment_status=data.employment_status,
        age=data.age,
        disability_status=data.disability_status,
        ai_decision=result["prediction"],
        confidence_score=result["confidence"],
        fairness_score=result["fairness_score"],
        bias_detected=result["bias_detected"],
        application_notes=data.application_notes,
    )
    db.add(decision)
    await db.flush()

    explanation = Explanation(
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
    db.add(explanation)

    notif = Notification(
        user_id=current_user.id,
        title="Application Submitted",
        message=f"Your {data.application_type.value} application has been submitted and AI analysis is complete.",
        notification_type="decision",
        related_decision_id=decision.id,
    )
    db.add(notif)

    await create_audit_log(db, current_user.id, decision.id, "decision_created", "decision",
                           ip=request.client.host if request.client else None,
                           new_val={"application_type": data.application_type.value, "ai_decision": result["prediction"]})
    await db.commit()

    result_q = await db.execute(
        select(Decision).options(selectinload(Decision.explanation), selectinload(Decision.citizen)).where(Decision.id == decision.id)
    )
    return result_q.scalar_one()


@router.get("/my", response_model=List[DecisionOut])
async def get_my_decisions(
    skip: int = 0, limit: int = 20,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Decision)
        .options(selectinload(Decision.explanation), selectinload(Decision.citizen))
        .where(Decision.citizen_id == current_user.id)
        .order_by(Decision.created_at.desc())
        .offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/all", response_model=List[DecisionOut])
async def get_all_decisions(
    skip: int = 0, limit: int = 50,
    status_filter: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_officer),
):
    query = select(Decision).options(selectinload(Decision.explanation), selectinload(Decision.citizen))
    if status_filter:
        query = query.where(Decision.status == status_filter)
    query = query.order_by(Decision.created_at.desc()).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()


@router.get("/{decision_id}", response_model=DecisionOut)
async def get_decision(
    decision_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Decision)
        .options(selectinload(Decision.explanation), selectinload(Decision.citizen))
        .where(Decision.id == decision_id)
    )
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    if current_user.role.value == "citizen" and decision.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    return decision


@router.post("/{decision_id}/review", response_model=DecisionOut)
async def officer_review(
    decision_id: int,
    review: OfficerReview,
    request: Request,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_officer),
):
    result = await db.execute(select(Decision).where(Decision.id == decision_id))
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")

    old_status = decision.status.value
    decision.officer_id = current_user.id
    decision.officer_decision = review.decision
    decision.officer_notes = review.notes
    decision.is_overridden = review.decision != decision.ai_decision
    decision.reviewed_at = datetime.utcnow()
    decision.status = DecisionStatus.APPROVED if review.decision else DecisionStatus.REJECTED

    notif = Notification(
        user_id=decision.citizen_id,
        title=f"Application {'Approved' if review.decision else 'Rejected'}",
        message=f"Your application has been reviewed by an officer. Decision: {'Approved' if review.decision else 'Rejected'}.",
        notification_type="review",
        related_decision_id=decision.id,
    )
    db.add(notif)

    await create_audit_log(db, current_user.id, decision.id, "officer_review", "decision",
                           ip=request.client.host if request.client else None,
                           old_val={"status": old_status},
                           new_val={"status": decision.status.value, "officer_decision": review.decision, "overridden": decision.is_overridden})
    await db.commit()

    res = await db.execute(
        select(Decision).options(selectinload(Decision.explanation), selectinload(Decision.citizen)).where(Decision.id == decision_id)
    )
    return res.scalar_one()


@router.post("/{decision_id}/appeal", response_model=AppealOut, status_code=201)
async def submit_appeal(
    decision_id: int,
    appeal_data: AppealCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Decision).where(Decision.id == decision_id))
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=404, detail="Decision not found")
    if decision.citizen_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your decision")

    appeal = Appeal(
        decision_id=decision_id,
        citizen_id=current_user.id,
        reason=appeal_data.reason,
        supporting_documents=appeal_data.supporting_documents,
        status=AppealStatus.SUBMITTED,
    )
    db.add(appeal)
    decision.status = DecisionStatus.APPEALED
    await db.commit()
    await db.refresh(appeal)
    return appeal
