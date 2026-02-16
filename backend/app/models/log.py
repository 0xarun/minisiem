import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, Index, Integer, Text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db import Base


class LogEntry(Base):
    __tablename__ = "logs"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    dataset_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("datasets.id", ondelete="CASCADE"), nullable=False)
    line_number: Mapped[int] = mapped_column(Integer, nullable=False)
    timestamp: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    raw_message: Mapped[str] = mapped_column(Text, nullable=False)
    parsed_fields: Mapped[dict] = mapped_column(JSONB, nullable=False, default=dict)

    dataset = relationship("Dataset", back_populates="logs")


Index("ix_logs_timestamp", LogEntry.timestamp)
Index("ix_logs_parsed_fields_gin", LogEntry.parsed_fields, postgresql_using="gin")
