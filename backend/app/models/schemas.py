from __future__ import annotations

from typing import Any

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8)
    full_name: str | None = None
    organization: str | None = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class DatasetProfile(BaseModel):
    columns: list[str]
    dtypes: dict[str, str]
    null_counts: dict[str, int]
    unique_counts: dict[str, int]
    row_count: int
    file_size: int
    sample_rows: list[dict[str, Any]]


class AnalysisStartRequest(BaseModel):
    dataset_id: str
    sensitive_columns: list[str]
    target_column: str
    analysis_name: str | None = None


class MetricResult(BaseModel):
    metric_name: str
    value: float
    threshold_min: float
    threshold_max: float
    is_fair: bool
    severity: str
    plain_english_explanation: str


class APIMessage(BaseModel):
    message: str
