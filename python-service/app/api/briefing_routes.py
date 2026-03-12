import logging

from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session

from app.core.responses import success_response
from app.db.session import get_db
from app.schemas.briefing_schema import BriefingCreate, BriefingDetailResponse
from app.services.briefing_service import BriefingService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/briefings", tags=["briefings"])


def get_briefing_service():
    return BriefingService()


@router.post("", status_code=status.HTTP_201_CREATED)
def create_briefing(
    payload: BriefingCreate,
    session: Session = Depends(get_db),
    service: BriefingService = Depends(get_briefing_service),
):
    briefing = service.create_briefing(session, payload)
    logger.info("Successfully created briefing with ID: %s", briefing.id)
    return success_response({"id": str(briefing.id)}, status_code=status.HTTP_201_CREATED)


@router.get("/{briefing_id}", response_model=None)
def get_briefing(
    briefing_id: UUID,
    session: Session = Depends(get_db),
    service: BriefingService = Depends(get_briefing_service),
):
    briefing = service.get_briefing(session, briefing_id)
    if not briefing:
        logger.warning("Briefing lookup failed for ID: %s", briefing_id)
        raise HTTPException(status_code=404, detail="Briefing not found")

    response_data = BriefingDetailResponse.model_validate(briefing).model_dump(mode="json")
    return success_response(response_data)


@router.post("/{briefing_id}/generate")
def generate_report(
    briefing_id: UUID,
    session: Session = Depends(get_db),
    service: BriefingService = Depends(get_briefing_service),
):
    generated = service.generate_report(session, briefing_id)

    if not generated:
        logger.error("Failed to generate report for briefing %s", briefing_id)
        raise HTTPException(status_code=400, detail="Report generation failed")

    return success_response({"status": "generated"})


@router.get("/{briefing_id}/html", response_class=HTMLResponse)
def get_html(
    briefing_id: UUID,
    session: Session = Depends(get_db),
    service: BriefingService = Depends(get_briefing_service),
):
    briefing = service.get_briefing(session, briefing_id)

    if not briefing:
        raise HTTPException(status_code=404, detail="Briefing not found")

    if not briefing.generated_html:
        logger.info(f"HTML requested but not yet generated for {briefing_id}")
        raise HTTPException(status_code=400, detail="Report not generated yet")

    return HTMLResponse(content=briefing.generated_html,media_type="text/html")