from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, case
from typing import List
from datetime import datetime, timedelta

from app.db.session import get_db
from app.models.models import Decision, User, AuditLog, Appeal, Notification, AIModel, DecisionStatus, UserRole
from app.schemas.schemas import DashboardStats, AuditLogOut, NotificationOut, UserOut
from app.core.dependencies import get_current_user, require_officer, require_admin
from app.ml.engine import get_model

router = APIRouter()


@router.get("/stats", response_model=DashboardStats)
async def get_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_officer),
):
    total = await db.scalar(select(func.count(Decision.id)))
    approved = await db.scalar(select(func.count(Decision.id)).where(Decision.status == DecisionStatus.APPROVED))
    rejected = await db.scalar(select(func.count(Decision.id)).where(Decision.status == DecisionStatus.REJECTED))
    pending = await db.scalar(select(func.count(Decision.id)).where(Decision.status == DecisionStatus.PENDING))
    biased = await db.scalar(select(func.count(Decision.id)).where(Decision.bias_detected == True))
    overridden = await db.scalar(select(func.count(Decision.id)).where(Decision.is_overridden == True))
    appeals = await db.scalar(select(func.count(Appeal.id)))

    avg_conf = await db.scalar(select(func.avg(Decision.confidence_score)))
    avg_fair = await db.scalar(select(func.avg(Decision.fairness_score)))

    return DashboardStats(
        total_decisions=total or 0,
        approved_count=approved or 0,
        rejected_count=rejected or 0,
        pending_count=pending or 0,
        average_confidence=round(float(avg_conf or 0), 4),
        average_fairness=round(float(avg_fair or 0), 4),
        bias_detected_count=biased or 0,
        overridden_count=overridden or 0,
        appeal_count=appeals or 0,
        approval_rate=round((approved or 0) / max(total or 1, 1), 4),
    )


@router.get("/citizen-stats")
async def get_citizen_stats(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    total = await db.scalar(select(func.count(Decision.id)).where(Decision.citizen_id == current_user.id))
    approved = await db.scalar(select(func.count(Decision.id)).where(Decision.citizen_id == current_user.id, Decision.status == DecisionStatus.APPROVED))
    pending = await db.scalar(select(func.count(Decision.id)).where(Decision.citizen_id == current_user.id, Decision.status == DecisionStatus.PENDING))
    avg_conf = await db.scalar(select(func.avg(Decision.confidence_score)).where(Decision.citizen_id == current_user.id))

    return {
        "total_applications": total or 0,
        "approved": approved or 0,
        "pending": pending or 0,
        "average_confidence": round(float(avg_conf or 0), 4),
    }


@router.get("/audit-logs", response_model=List[AuditLogOut])
async def get_audit_logs(
    skip: int = 0,
    limit: int = 100,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_officer),
):
    result = await db.execute(
        select(AuditLog).order_by(AuditLog.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()


@router.get("/notifications", response_model=List[NotificationOut])
async def get_notifications(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Notification)
        .where(Notification.user_id == current_user.id)
        .order_by(Notification.created_at.desc())
        .limit(20)
    )
    return result.scalars().all()


@router.post("/notifications/{notif_id}/read")
async def mark_read(
    notif_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    result = await db.execute(select(Notification).where(Notification.id == notif_id, Notification.user_id == current_user.id))
    notif = result.scalar_one_or_none()
    if notif:
        notif.is_read = True
        await db.commit()
    return {"status": "ok"}


@router.get("/users", response_model=List[UserOut])
async def list_users(
    skip: int = 0, limit: int = 50,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(select(User).offset(skip).limit(limit))
    return result.scalars().all()


@router.patch("/users/{user_id}/toggle-active")
async def toggle_user_active(
    user_id: int,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.is_active = not user.is_active
    await db.commit()
    return {"user_id": user_id, "is_active": user.is_active}


@router.get("/model-performance")
async def get_model_performance(
    current_user: User = Depends(require_admin),
):
    performance = []
    for app_type in ["welfare", "scholarship", "healthcare", "subsidy"]:
        m = get_model(app_type)
        performance.append({
            "model_name": f"XGBoost-{app_type.capitalize()}",
            "application_type": app_type,
            "version": "1.0.0",
            **m.metrics,
        })
    return performance


@router.get("/trend-data")
async def get_trend_data(
    days: int = 30,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(require_officer),
):
    since = datetime.utcnow() - timedelta(days=days)
    result = await db.execute(
        select(
            func.date_trunc('day', Decision.created_at).label("day"),
            func.count(Decision.id).label("total"),
            func.sum(case((Decision.status == DecisionStatus.APPROVED, 1), else_=0)).label("approved"),
            func.sum(case((Decision.status == DecisionStatus.REJECTED, 1), else_=0)).label("rejected"),
        )
        .where(Decision.created_at >= since)
        .group_by("day")
        .order_by("day")
    )
    rows = result.all()
    return [{"date": str(r.day)[:10], "total": r.total, "approved": r.approved, "rejected": r.rejected} for r in rows]
