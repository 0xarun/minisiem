from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.ext.asyncio import AsyncSession

from app.db import get_db
from app.models.dataset import Dataset
from app.models.log import LogEntry
from app.services.parser import extract_upload_files, parse_line

router = APIRouter(prefix="/upload", tags=["upload"])


@router.post("")
async def upload_logs(
    dataset_name: str = Form(...),
    files: list[UploadFile] = File(default_factory=list),
    raw_logs: str | None = Form(default=None),
    db: AsyncSession = Depends(get_db),
):
    if not files and not raw_logs:
        raise HTTPException(status_code=400, detail="Provide files or raw logs")

    dataset = Dataset(name=dataset_name)
    db.add(dataset)
    await db.flush()

    line_number = 1
    if raw_logs:
        for line in raw_logs.splitlines():
            parsed, timestamp = parse_line(line)
            db.add(LogEntry(dataset_id=dataset.id, line_number=line_number, timestamp=timestamp, raw_message=line, parsed_fields=parsed))
            line_number += 1

    if files:
        for _, lines in await extract_upload_files(files):
            for line in lines:
                parsed, timestamp = parse_line(line)
                db.add(LogEntry(dataset_id=dataset.id, line_number=line_number, timestamp=timestamp, raw_message=line, parsed_fields=parsed))
                line_number += 1

    await db.commit()
    return {"dataset_id": str(dataset.id), "ingested_lines": line_number - 1}
