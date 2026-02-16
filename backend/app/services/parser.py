import io
import json
import re
import zipfile
from datetime import datetime
from pathlib import Path
from typing import Iterable

from dateutil import parser as date_parser
from fastapi import HTTPException, UploadFile

from app.config import settings

TIMESTAMP_FIELDS = ("timestamp", "time", "@timestamp", "date", "datetime", "ts")
KV_REGEX = re.compile(r"([^\s=]+)=([^\s]+)")


def parse_line(line: str) -> tuple[dict, datetime | None]:
    line = line.strip()
    if not line:
        return {}, None

    try:
        data = json.loads(line)
        if isinstance(data, dict):
            return data, extract_timestamp(data)
    except json.JSONDecodeError:
        pass

    kv_matches = KV_REGEX.findall(line)
    if kv_matches:
        data = {k: v.strip('"\'') for k, v in kv_matches}
        return data, extract_timestamp(data) or extract_timestamp_from_raw(line)

    return {}, extract_timestamp_from_raw(line)


def extract_timestamp(data: dict) -> datetime | None:
    for key in TIMESTAMP_FIELDS:
        value = data.get(key)
        if not value:
            continue
        try:
            return date_parser.parse(str(value))
        except (ValueError, TypeError):
            continue
    return None


def extract_timestamp_from_raw(message: str) -> datetime | None:
    candidates = re.findall(r"\d{4}-\d{2}-\d{2}[T\s]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?", message)
    for candidate in candidates:
        try:
            return date_parser.parse(candidate)
        except ValueError:
            continue
    return None


async def extract_upload_files(files: list[UploadFile]) -> list[tuple[str, Iterable[str]]]:
    extracted: list[tuple[str, Iterable[str]]] = []
    zip_internal_files = 0

    for upload in files:
        suffix = Path(upload.filename or "").suffix.lower()
        raw = await upload.read()
        if suffix == ".zip":
            with zipfile.ZipFile(io.BytesIO(raw)) as archive:
                members = [m for m in archive.namelist() if not m.endswith("/")]
                zip_internal_files += len(members)
                if zip_internal_files > settings.upload_zip_file_limit:
                    raise HTTPException(status_code=400, detail=f"Zip file limit exceeded ({settings.upload_zip_file_limit})")
                for member in members:
                    with archive.open(member) as f:
                        content = f.read().decode("utf-8", errors="replace")
                        extracted.append((member, content.splitlines()))
        else:
            content = raw.decode("utf-8", errors="replace")
            extracted.append((upload.filename or "uploaded.log", content.splitlines()))

    return extracted
