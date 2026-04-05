import logging

import litellm

from rag.retriever import chunks_to_citations
from schemas import ChatHistoryMessage, Citation

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are OilBrain, a specialized assistant for oil market research.
You answer questions based ONLY on the provided document excerpts.
If the answer is not in the excerpts, say so clearly.
Always be precise and professional. Use numbers and specifics from the source material."""

_MAX_HISTORY_MESSAGES = 3


def _format_context(chunks: list[dict]) -> str:
    parts: list[str] = []
    for i, chunk in enumerate(chunks, 1):
        page_info = (
            f" (page {chunk['page_number']})" if chunk.get("page_number") else ""
        )
        parts.append(f"[{i}] From {chunk['doc_name']}{page_info}:\n{chunk['text']}")
    return "\n\n".join(parts)


def _build_messages(
    query: str,
    context: str,
    history: list[ChatHistoryMessage],
) -> list[dict]:
    messages: list[dict] = [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "system", "content": f"DOCUMENT EXCERPTS:\n\n{context}"},
    ]

    for msg in history[-_MAX_HISTORY_MESSAGES:]:
        messages.append({"role": msg.role, "content": msg.content})

    messages.append({"role": "user", "content": query})
    return messages


def answer_query(
    query: str,
    chunks: list[dict],
    history: list[ChatHistoryMessage],
    llm_model: str,
    api_key: str,
) -> tuple[str, list[Citation]]:
    """Build a prompt from retrieved chunks + chat history, call the LLM, and return results.
    """
    if not chunks:
        return (
            "I couldn't find relevant information in your document library to answer this question.",
            [],
        )

    context = _format_context(chunks)
    logger.info("Sending %d chunks to LLM (%d context chars)", len(chunks), len(context))
    logger.debug("Full context:\n%s", context)
    messages = _build_messages(query, context, history)

    response = litellm.completion(
        model=llm_model,
        messages=messages,
        api_key=api_key or None,
    )
    answer: str = response.choices[0].message.content

    citations = chunks_to_citations(chunks)
    return answer, citations
