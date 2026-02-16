from datetime import datetime
from typing import Literal
from uuid import UUID

from pydantic import BaseModel, Field


class FilterItem(BaseModel):
    field: str
    value: str
    type: Literal["include", "exclude"]


class LogSearchRequest(BaseModel):
    query: str = ""
    time_from: datetime | None = None
    time_to: datetime | None = None
    filters: list[FilterItem] = Field(default_factory=list)
    page: int = 1
    page_size: int = 100
    sort_field: str | None = None
    sort_order: Literal["asc", "desc"] = "desc"


class LogRead(BaseModel):
    id: UUID
    line_number: int
    timestamp: datetime | None
    raw_message: str
    parsed_fields: dict

    class Config:
        from_attributes = True


class LogSearchResponse(BaseModel):
    total: int
    page: int
    page_size: int
    items: list[LogRead]


class FieldValueCount(BaseModel):
    value: str
    count: int


class FieldStats(BaseModel):
    field: str
    values: list[FieldValueCount]
