from pathlib import Path
from typing import Literal

from fastapi import APIRouter, BackgroundTasks, File, Form, HTTPException, UploadFile
from fastapi.responses import FileResponse
from qdrant_client.models import FieldCondition, Filter, MatchValue

from rag.document_store import create_document, delete_document, get_document, list_documents
from rag.ingestor import ingest_document
from rag.qdrant import COLLECTION_NAME, get_client
from schemas import DocumentResponse

router = APIRouter(prefix="/api/documents", tags=["documents"])

UPLOADS_DIR = Path(__file__).parent.parent / "data" / "uploads"
UPLOADS_DIR.mkdir(parents=True, exist_ok=True)


def _get_upload_path(doc_id: str, ext: str = ".pdf") -> Path:
    """Return the filesystem path for a document file with the given extension."""
    return UPLOADS_DIR / f"{doc_id}{ext}"


def _find_upload_file(doc_id: str) -> Path | None:
    """Return the upload path for a document, checking .pdf then .txt."""
    for ext in (".pdf", ".txt"):
        p = UPLOADS_DIR / f"{doc_id}{ext}"
        if p.exists():
            return p
    return None


def _run_ingestion(
    doc_id: str,
    doc_name: str,
    source_type: Literal["EIA", "OPEC", "Other"],
) -> None:
    """Ingest a previously-saved PDF into Qdrant."""
    ingest_document(
        pdf_path=_get_upload_path(doc_id),
        doc_id=doc_id,
        doc_name=doc_name,
        source_type=source_type,
        qdrant_client=get_client(),
    )


@router.post("", response_model=DocumentResponse, status_code=201)
async def upload_document(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    source_type: Literal["EIA", "OPEC", "Other"] = Form("Other"),
) -> DocumentResponse:
    """Accept a PDF upload, create a metadata record, and enqueue background ingestion."""
    if not file.filename or not file.filename.endswith(".pdf"):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")

    content = await file.read()
    doc = create_document(
        name=file.filename,
        source_type=source_type,
        size_bytes=len(content),
    )

    _get_upload_path(doc.id).write_bytes(content)

    background_tasks.add_task(
        _run_ingestion,
        doc.id,
        file.filename,
        source_type,
    )
    return doc


@router.get("", response_model=list[DocumentResponse])
async def get_documents() -> list[DocumentResponse]:
    """Return all documents currently tracked in the metadata store."""
    return list_documents()


@router.get("/{doc_id}/file")
async def get_document_file(doc_id: str) -> FileResponse:
    """Stream the original PDF for a document so clients can preview it."""
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    upload_path = _find_upload_file(doc_id)
    if not upload_path:
        raise HTTPException(status_code=404, detail="File not available for preview.")

    media_type = "text/plain" if upload_path.suffix == ".txt" else "application/pdf"
    return FileResponse(upload_path, media_type=media_type, content_disposition_type="inline")


@router.delete("/{doc_id}", status_code=204)
async def remove_document(doc_id: str) -> None:
    """Delete a document's metadata, vectors, and uploaded file."""
    doc = get_document(doc_id)
    if not doc:
        raise HTTPException(status_code=404, detail="Document not found.")

    try:
        qdrant = get_client()
        qdrant.delete(
            collection_name=COLLECTION_NAME,
            points_selector=Filter(
                must=[
                    FieldCondition(
                        key="doc_id",
                        match=MatchValue(value=doc_id),
                    )
                ]
            ),
        )
    except Exception:
        pass  # vectors may not exist yet (e.g. ingestion pending or failed)

    delete_document(doc_id)
    upload_path = _find_upload_file(doc_id)
    if upload_path:
        upload_path.unlink(missing_ok=True)
