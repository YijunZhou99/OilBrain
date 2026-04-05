from pathlib import Path
from typing import Literal
from uuid import uuid4

import pdfplumber
from langchain_text_splitters import RecursiveCharacterTextSplitter
from qdrant_client import QdrantClient
from qdrant_client.models import Document, PointStruct

from rag.document_store import update_document

from config import settings
from rag.qdrant import ensure_collection


def _parse_pdf(pdf_path: Path) -> list[dict]:
    """Open a PDF and return a list of ``{page_number, text}`` dicts.

    Pages with no extractable text are skipped.
    """
    pages: list[dict] = []
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages, start=1):
            text = page.extract_text() or ""
            if text.strip():
                pages.append({"page_number": i, "text": text})
    return pages


_MIN_CHUNK_CHARS = 100  # discard header/footer-only chunks


def _chunk_pages(
    pages: list[dict],
    chunk_size: int = 1000,
    chunk_overlap: int = 200,
) -> list[dict]:
    """Split page texts into chunks, preserving ``page_number`` metadata.
    """
    splitter = RecursiveCharacterTextSplitter(
        chunk_size=chunk_size,
        chunk_overlap=chunk_overlap,
        separators=["\n\n", "\n", " ", ""],
    )
    chunks: list[dict] = []
    for page in pages:
        splits = splitter.split_text(page["text"])
        chunk_index = 0
        for split in splits:
            if len(split.strip()) < _MIN_CHUNK_CHARS:
                continue
            chunks.append(
                {
                    "text": split,
                    "page_number": page["page_number"],
                    "chunk_index": chunk_index,
                }
            )
            chunk_index += 1
    return chunks


def ingest_document(
    pdf_path: Path,
    doc_id: str,
    doc_name: str,
    source_type: Literal["EIA", "OPEC", "Other"],
    qdrant_client: QdrantClient,
) -> int:
    """Parse, chunk, and store a PDF document in Qdrant using cloud inference.
    """
    try:
        ensure_collection(qdrant_client)

        pages = _parse_pdf(pdf_path)
        if not pages:
            update_document(doc_id, status="error")
            return 0

        chunks = _chunk_pages(pages)

        points = [
            PointStruct(
                id=uuid4(),
                vector=Document(text=chunk["text"], model=settings.EMBEDDING_MODEL),
                payload={
                    "doc_id": doc_id,
                    "doc_name": doc_name,
                    "source_type": source_type,
                    "page_number": chunk["page_number"],
                    "chunk_index": chunk["chunk_index"],
                    "text": chunk["text"],
                },
            )
            for chunk in chunks
        ]

        qdrant_client.upsert(collection_name=settings.COLLECTION_NAME, points=points)
        update_document(doc_id, status="ready", chunk_count=len(points))
        return len(points)

    except Exception:
        update_document(doc_id, status="error")
        raise
