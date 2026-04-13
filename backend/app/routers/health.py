from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import text

from app.database import get_db
from app.config import settings

router = APIRouter(tags=["Health"])


@router.get("/api/health")
def health_check(db: Session = Depends(get_db)):
    """Service health check — verifies database connectivity."""
    # Check database
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        db_status = "disconnected"

    # Redis and S3 checks will be added in later bricks
    return {
        "status": "healthy" if db_status == "connected" else "degraded",
        "version": settings.app_version,
        "environment": settings.app_env,
        "services": {
            "database": db_status,
            "redis": "not_configured",
            "s3": "not_configured",
        },
    }
