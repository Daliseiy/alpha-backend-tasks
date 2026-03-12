from uuid import uuid4
from datetime import datetime,timezone

from sqlalchemy import String, Text, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class Briefing(Base):
    __tablename__ = "briefings"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    company_name: Mapped[str] = mapped_column(String(255), nullable=False)
    ticker: Mapped[str] = mapped_column(String(10), nullable=False, index=True)

    sector: Mapped[str | None] = mapped_column(String(255))
    analyst_name: Mapped[str | None] = mapped_column(String(255))

    summary: Mapped[str] = mapped_column(Text, nullable=False)
    recommendation: Mapped[str] = mapped_column(Text, nullable=False)

    generated_html: Mapped[str | None] = mapped_column(Text)
    generated_at: Mapped[datetime | None] = mapped_column(DateTime)

    created_at: Mapped[datetime] = mapped_column(
        DateTime,
        default=datetime.now(timezone.utc),
        nullable=False,
    )

    points: Mapped[list["BriefingPoint"]] = relationship(
        back_populates="briefing",
        cascade="all, delete-orphan",
        order_by="BriefingPoint.position",
    )

    metrics: Mapped[list["BriefingMetric"]] = relationship(
        back_populates="briefing",
        cascade="all, delete-orphan",
    )