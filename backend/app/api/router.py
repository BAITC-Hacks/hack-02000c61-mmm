from fastapi import APIRouter

from app.models.health import HealthResponse


api_router = APIRouter()


@api_router.get("/health", response_model=HealthResponse, tags=["system"])
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="career-quest-api")

