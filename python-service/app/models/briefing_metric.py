from uuid import uuid4

from sqlalchemy import String, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class BriefingMetric(Base):
    __tablename__ = "briefing_metrics"

    id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid4,
    )

    briefing_id: Mapped[str] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("briefings.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    name: Mapped[str] = mapped_column(String(255), nullable=False)

    value: Mapped[str] = mapped_column(String(255), nullable=False)

    briefing: Mapped["Briefing"] = relationship(
        back_populates="metrics"
    )