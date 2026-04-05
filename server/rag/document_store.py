import json
import uuid
from datetime import datetime, timezone
from pathlib import Path
from typing import Literal

from schemas import DocumentResponse

STORE_PATH = Path("data/documents.json")


def _load() -> dict:
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    if not STORE_PATH.exists():
        return {}
    return json.loads(STORE_PATH.read_text())


def _save(data: dict) -> None:
    STORE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STORE_PATH.write_text(json.dumps(data, default=str, indent=2))


def create_document(
    name: str,
    source_type: Literal["EIA", "OPEC", "Other"],
    size_bytes: int,
) -> DocumentResponse:
    data = _load()
    doc_id = str(uuid.uuid4())
    doc = {
        "id": doc_id,
        "name": name,
        "source_type": source_type,
        "upload_date": datetime.now(timezone.utc).isoformat(),
        "status": "processing",
        "size_bytes": size_bytes,
        "chunk_count": 0,
    }
    data[doc_id] = doc
    _save(data)
    return DocumentResponse(**doc)


def update_document(doc_id: str, **kwargs) -> DocumentResponse | None:
    data = _load()
    if doc_id not in data:
        return None
    data[doc_id].update(kwargs)
    _save(data)
    return DocumentResponse(**data[doc_id])


def get_document(doc_id: str) -> DocumentResponse | None:
    data = _load()
    if doc_id not in data:
        return None
    return DocumentResponse(**data[doc_id])


def list_documents() -> list[DocumentResponse]:
    data = _load()
    return [DocumentResponse(**v) for v in data.values()]


def delete_document(doc_id: str) -> bool:
    data = _load()
    if doc_id not in data:
        return False
    del data[doc_id]
    _save(data)
    return True
