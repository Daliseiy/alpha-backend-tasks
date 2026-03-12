from enum import Enum
from uuid import uuid4

from sqlalchemy import String, Integer, ForeignKey, Enum as SqlEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID

from app.db.base import Base


class PointType(str, Enum):
    KEY_POINT = "key_point"
    RISK = "risk"


class BriefingPoint(Base):
    __tablename__ = "briefing_points"

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

    content: Mapped[str] = mapped_column(String(1000), nullable=False)

    type: Mapped[PointType] = mapped_column(
        SqlEnum(
            PointType,
            values_callable=lambda enum: [e.value for e in enum],
        ),        nullable=False,
    )

    position: Mapped[int] = mapped_column(Integer, nullable=False)

    briefing: Mapped["Briefing"] = relationship(
        back_populates="points"
    )