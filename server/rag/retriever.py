import logging

from qdrant_client import QdrantClient
from qdrant_client.models import Document

from config import settings
from rag.qdrant import COLLECTION_NAME, EMBEDDING_MODEL
from rag.web_search import rewrite_query, search_web
from schemas import Citation

logger = logging.getLogger(__name__)


def retrieve_chunks(
    query: str,
    qdrant_client: QdrantClient,
    top_k: int = 5,
) -> list[dict]:
    results = qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=Document(text=query, model=EMBEDDING_MODEL),
        limit=top_k,
        with_payload=True,
    ).points
    return [r.payload for r in results]


def _retrieve_chunks_scored(
    query: str,
    qdrant_client: QdrantClient,
    top_k: int = 5,
) -> tuple[list[dict], float]:
    results = qdrant_client.query_points(
        collection_name=COLLECTION_NAME,
        query=Document(text=query, model=EMBEDDING_MODEL),
        limit=top_k,
        with_payload=True,
    ).points
    if not results:
        return [], 0.0
    chunks = [r.payload for r in results]
    logger.info(
        "Retrieved %d chunks | top score: %.3f",
        len(results),
        results[0].score,
    )
    for i, (r, chunk) in enumerate(zip(results, chunks), 1):
        logger.debug(
            "  [%d] score=%.3f | %s p%s | %r",
            i,
            r.score,
            chunk.get("doc_name", "?"),
            chunk.get("page_number", "?"),
            chunk.get("text", "")[:120],
        )
    return chunks, results[0].score


def retrieve_with_fallback(
    query: str,
    qdrant_client: QdrantClient,
    llm_model: str,
    api_key: str,
    top_k: int = 5,
) -> tuple[list[dict], bool]:
    """Retrieve chunks with automatic web search fallback.
    """
    chunks, top_score = _retrieve_chunks_scored(query, qdrant_client, top_k)

    if len(chunks) == 0: # if no chunk in the db, then ask user to upload first before any fallback
        return chunks, False

    if chunks and top_score >= settings.web_search_score_threshold:
        logger.info("Using RAG results (score %.3f >= threshold %.3f)", top_score, settings.web_search_score_threshold)
        return chunks, False

    logger.info("RAG score %.3f below threshold %.3f — falling back to web search",
                top_score, settings.web_search_score_threshold)
    search_query = rewrite_query(query, llm_model, api_key)
    web_chunks = search_web(search_query, max_results=top_k)
    return web_chunks, True


def chunks_to_citations(chunks: list[dict]) -> list[Citation]:
    """Deduplicate chunks by (doc_id, page_number) and convert to Citation objects.
    """
    seen: set[tuple[str, int | None]] = set()
    citations: list[Citation] = []
    for chunk in chunks:
        key: tuple[str, int | None] = (chunk["doc_id"], chunk.get("page_number"))
        if key not in seen:
            seen.add(key)
            citations.append(
                Citation(
                    doc_id=chunk["doc_id"],
                    doc_name=chunk["doc_name"],
                    page=chunk.get("page_number"),
                    snippet=chunk["text"][:200],
                )
            )
    return citations
