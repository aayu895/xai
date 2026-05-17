from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from loguru import logger
import sys

from app.core.config import settings
from app.api.v1.router import api_router
from app.db.base import Base
from app.db.session import engine

# Configure logging
logger.remove()
logger.add(sys.stdout, format="{time:YYYY-MM-DD HH:mm:ss} | {level} | {name}:{function}:{line} | {message}", level="INFO")
logger.add("logs/xai_gov.log", rotation="10 MB", retention="30 days", level="DEBUG")

# Rate limiter
limiter = Limiter(key_func=get_remote_address)

app = FastAPI(
    title="XAI-Gov API",
    description="Transparent AI Framework for Accountable Governance",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    openapi_url="/api/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(api_router, prefix="/api/v1")


@app.on_event("startup")
async def startup_event():
    logger.info("XAI-Gov API starting up...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables created/verified")


@app.on_event("shutdown")
async def shutdown_event():
    logger.info("XAI-Gov API shutting down...")


@app.get("/health")
async def health_check():
    return {"status": "healthy", "service": "XAI-Gov API", "version": "1.0.0"}
