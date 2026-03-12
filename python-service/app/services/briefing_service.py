from uuid import UUID

from sqlalchemy.orm import Session
from datetime import datetime, timezone

from app.models.briefing import Briefing
from app.models.briefing_point import BriefingPoint, PointType
from app.models.briefing_metric import BriefingMetric

from app.services.report_formatter import ReportFormatter
from app.utils.report_view_builder import build_report_view_data

formatter = ReportFormatter()

class BriefingService:

    def create_briefing(self, db: Session, payload):

        briefing = Briefing(
            company_name=payload.companyName,
            ticker=payload.ticker,
            sector=payload.sector,
            analyst_name=payload.analystName,
            summary=payload.summary,
            recommendation=payload.recommendation,
        )

        db.add(briefing)
        db.flush()

        for i, p in enumerate(payload.keyPoints):
            db.add(
                BriefingPoint(
                    briefing_id=briefing.id,
                    content=p,
                    type=PointType.KEY_POINT,
                    position=i,
                )
            )

        for i, r in enumerate(payload.risks):
            db.add(
                BriefingPoint(
                    briefing_id=briefing.id,
                    content=r,
                    type=PointType.RISK,
                    position=i,
                )
            )

        for m in payload.metrics:
            db.add(
                BriefingMetric(
                    briefing_id=briefing.id,
                    name=m.name,
                    value=m.value,
                )
            )

        db.commit()
        db.refresh(briefing)

        return briefing

    def get_briefing(self, db: Session, briefing_id):

        return db.query(Briefing).filter(
            Briefing.id == briefing_id
        ).first()

    def generate_report(self, db: Session, briefing_id: UUID):

        briefing = self.get_briefing(db, briefing_id)

        if not briefing:
            raise ValueError("Briefing not found")

        view_dict = build_report_view_data(briefing)

        html = formatter.render_base(view_dict)

        briefing.generated_html = html
        briefing.generated_at = datetime.now(timezone.utc)
        db.commit()
        db.refresh(briefing)

        return html