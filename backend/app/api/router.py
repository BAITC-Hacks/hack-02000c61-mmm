from typing import Any

from fastapi import APIRouter, HTTPException

from app.models.api import EmployeeDetail, EmployeeSummary, RecommendationResponse
from app.models.health import HealthResponse
from app.recommendation.engine import CAREER_SCORE_FORMULA, ML_MULTIPLIER_FORMULA
from app.services.career_service import CareerQuestService


api_router = APIRouter()
service = CareerQuestService()


def _not_found(error: KeyError) -> HTTPException:
    return HTTPException(status_code=404, detail=str(error).strip("'"))


@api_router.get("/health", response_model=HealthResponse, tags=["system"])
def health_check() -> HealthResponse:
    return HealthResponse(status="ok", service="career-quest-api")


@api_router.get("/employees", response_model=list[EmployeeSummary], tags=["employees"])
def list_employees() -> list[dict[str, Any]]:
    return service.employees()


@api_router.get("/employees/{employee_id}", response_model=EmployeeDetail, tags=["employees"])
def get_employee(employee_id: str) -> dict[str, Any]:
    try:
        return service.employee(employee_id)
    except KeyError as error:
        raise _not_found(error) from error


@api_router.get("/employees/{employee_id}/career", tags=["career"])
def get_career(employee_id: str) -> dict[str, Any]:
    try:
        return service.career(employee_id)
    except KeyError as error:
        raise _not_found(error) from error


@api_router.get(
    "/employees/{employee_id}/recommendations",
    response_model=RecommendationResponse,
    tags=["career"],
)
def get_recommendations(employee_id: str) -> dict[str, Any]:
    try:
        recommendations = service.recommendations(employee_id)
    except KeyError as error:
        raise _not_found(error) from error
    return {
        "employee_id": employee_id,
        "recommendations": recommendations,
        "career_score_formula": CAREER_SCORE_FORMULA,
        "ml_multiplier_formula": ML_MULTIPLIER_FORMULA,
    }


@api_router.get("/employees/{employee_id}/history", tags=["career"])
def get_history(employee_id: str) -> list[dict[str, Any]]:
    try:
        return service.history(employee_id)
    except KeyError as error:
        raise _not_found(error) from error


@api_router.post("/employees/{employee_id}/simulate/{event_id}", tags=["career"])
def simulate(employee_id: str, event_id: str) -> dict[str, Any]:
    try:
        return service.simulate(employee_id, event_id)
    except KeyError as error:
        raise _not_found(error) from error


@api_router.post("/employees/{employee_id}/complete/{event_id}", tags=["career"])
def complete(employee_id: str, event_id: str) -> dict[str, Any]:
    try:
        return service.complete(employee_id, event_id)
    except KeyError as error:
        raise _not_found(error) from error
    except ValueError as error:
        raise HTTPException(status_code=409, detail=str(error)) from error


@api_router.get("/hr/analytics", tags=["analytics"])
def hr_analytics() -> dict[str, Any]:
    return service.analytics()
