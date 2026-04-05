from fastapi import APIRouter
from qdrant_client.http.exceptions import UnexpectedResponse

from config import settings
from rag.chain import answer_query
from rag.qdrant import get_client
from rag.retriever import retrieve_with_fallback
from schemas import ChatRequest, ChatResponse, WebCitation

router = APIRouter(prefix="/api/chat", tags=["chat"])

_NO_DOCS_MESSAGE = (
    "No documents found and web search returned no results. "
    "Please upload a PDF or try a more specific question."
)


@router.post("", response_model=ChatResponse)
async def chat(request: ChatRequest) -> ChatResponse:
    """Run a RAG query with automatic web search fallback.

    Uses Qdrant vector search first. Falls back to DuckDuckGo web search
    when the top similarity score is below settings.web_search_score_threshold.
    """
    effective_api_key = request.api_key or settings.default_api_key

    try:
        chunks, used_web = retrieve_with_fallback(
            query=request.message,
            qdrant_client=get_client(),
            llm_model=request.llm_model,
            api_key=effective_api_key,
            top_k=5,
        )
    except UnexpectedResponse as e:
        if e.status_code == 404:
            return ChatResponse(answer=_NO_DOCS_MESSAGE, citations=[], web_citations=[])
        raise

    if not chunks:
        return ChatResponse(answer=_NO_DOCS_MESSAGE, citations=[], web_citations=[])

    answer, rag_citations = answer_query(
        query=request.message,
        chunks=chunks,
        history=request.history,
        llm_model=request.llm_model,
        api_key=effective_api_key,
    )

    if used_web:
        web_citations = [
            WebCitation(
                url=chunk["url"],
                title=chunk["doc_name"],
                snippet=chunk["text"][:200],
            )
            for chunk in chunks
        ]
        rag_citations = []
    else:
        web_citations = []

    if not request.citations_enabled:
        rag_citations = []
        web_citations = []

    return ChatResponse(answer=answer, citations=rag_citations, web_citations=web_citations)
