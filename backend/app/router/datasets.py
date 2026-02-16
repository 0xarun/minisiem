from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import desc, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.dataset import Dataset
from app.models.log import LogEntry
from app.schemas.dataset import DatasetRead
from app.schemas.log import FieldStats, FieldValueCount

router = APIRouter(prefix="/datasets", tags=["datasets"])


@router.get("", response_model=list[DatasetRead])
async def list_datasets(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Dataset).order_by(desc(Dataset.created_at)))
    return result.scalars().all()


@router.get("/{dataset_id}/fields", response_model=list[FieldStats])
async def dataset_fields(dataset_id: str, db: AsyncSession = Depends(get_db)):
    exists = await db.scalar(select(func.count()).select_from(Dataset).where(Dataset.id == dataset_id))
    if not exists:
        raise HTTPException(status_code=404, detail="Dataset not found")

    keys_result = await db.execute(
        select(func.distinct(func.jsonb_object_keys(LogEntry.parsed_fields))).where(LogEntry.dataset_id == dataset_id)
    )
    keys = [row[0] for row in keys_result.all() if row[0]]

    response: list[FieldStats] = []
    for key in keys:
        value_result = await db.execute(
            select(LogEntry.parsed_fields[key].astext, func.count())
            .where(LogEntry.dataset_id == dataset_id)
            .group_by(LogEntry.parsed_fields[key].astext)
            .order_by(func.count().desc())
            .limit(10)
        )
        values = [FieldValueCount(value=str(v), count=c) for v, c in value_result.all() if v is not None]
        response.append(FieldStats(field=key, values=values))

    return sorted(response, key=lambda item: item.field)
