from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.schemas.log import LogSearchRequest, LogSearchResponse
from app.services.query_builder import run_search

router = APIRouter(prefix="/datasets", tags=["logs"])


@router.post("/{dataset_id}/logs/search", response_model=LogSearchResponse)
async def search_logs(dataset_id: str, payload: LogSearchRequest, db: AsyncSession = Depends(get_db)):
    result = await run_search(db, dataset_id, payload)
    return LogSearchResponse(**result)
