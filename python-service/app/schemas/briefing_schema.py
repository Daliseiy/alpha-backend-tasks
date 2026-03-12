from typing import List
from uuid import UUID

from pydantic import BaseModel, ConfigDict, field_validator


class MetricInput(BaseModel):
    name: str
    value: str

class MetricOutput(BaseModel):
    name: str
    value: str

    model_config = ConfigDict(from_attributes=True)


class PointOutput(BaseModel):
    type: str
    content: str

    model_config = ConfigDict(from_attributes=True)


class BriefingCreate(BaseModel):

    companyName: str
    ticker: str
    sector: str | None
    analystName: str | None

    summary: str
    recommendation: str

    keyPoints: List[str]
    risks: List[str]

    metrics: List[MetricInput] = []

    @field_validator("ticker")
    def normalize_ticker(cls, v):
        return v.upper()

    @field_validator("keyPoints")
    def validate_points(cls, v):
        if len(v) < 2:
            raise ValueError("At least 2 key points required")
        return v

    @field_validator("risks")
    def validate_risks(cls, v):
        if len(v) < 1:
            raise ValueError("At least 1 risk required")
        return v
    
class BriefingDetailResponse(BaseModel):
    id: UUID
    company_name: str
    ticker: str
    sector: str
    analyst_name: str
    summary: str
    recommendation: str

    points: list[PointOutput]
    metrics: list[MetricOutput]

    generated_html: str | None

    model_config = ConfigDict(from_attributes=True)

