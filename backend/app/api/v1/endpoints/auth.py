from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.db.session import get_db
from app.models.models import User, UserRole, AuditLog
from app.schemas.schemas import UserCreate, UserLogin, Token, UserOut
from app.core.security import verify_password, get_password_hash, create_access_token, create_refresh_token
from app.core.dependencies import get_current_user
import uuid
from datetime import datetime

router = APIRouter()


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_data.email))
    if result.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Email already registered")

    hashed_pw   = get_password_hash(user_data.password)
    citizen_id  = f"CIT-{uuid.uuid4().hex[:8].upper()}" if user_data.role == UserRole.CITIZEN else None

    user = User(
        email=user_data.email,
        full_name=user_data.full_name,
        hashed_password=hashed_pw,
        role=user_data.role,
        phone=user_data.phone,
        address=user_data.address,
        citizen_id=citizen_id,
        is_verified=True,
    )
    db.add(user)
    await db.flush()

    log = AuditLog(
        user_id=user.id,
        action="user_registered",
        entity_type="user",
        entity_id=user.id,
        new_value={"email": user.email, "role": user.role.value},
        ip_address=request.client.host if request.client else "unknown",
    )
    db.add(log)
    await db.commit()
    await db.refresh(user)
    return user


@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, request: Request, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email))
    user   = result.scalar_one_or_none()

    if not user or not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect email or password")
    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account is disabled")

    access_token  = create_access_token({"sub": str(user.id), "role": user.role.value})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    log = AuditLog(
        user_id=user.id,
        action="user_login",
        entity_type="user",
        entity_id=user.id,
        ip_address=request.client.host if request.client else "unknown",
        user_agent=request.headers.get("user-agent"),
    )
    db.add(log)
    await db.commit()
    await db.refresh(user)

    return Token(
        access_token=access_token,
        refresh_token=refresh_token,
        user=UserOut.model_validate(user),
    )


@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user
