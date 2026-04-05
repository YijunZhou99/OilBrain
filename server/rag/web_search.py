import logging

import litellm
from ddgs import DDGS

logger = logging.getLogger(__name__)

_REWRITE_PROMPT = (
    "Convert the following user question into a concise, keyword-focused web search query "
    "optimized for finding current oil market data. Return ONLY the search query string, "
    "nothing else.\n\nQuestion: {question}"
)


def rewrite_query(query: str, llm_model: str, api_key: str) -> str:
    """Rewrite a user query into an optimized web search string.

    Falls back to the original query if the LLM call fails.
    """
    try:
        response = litellm.completion(
            model=llm_model,
            messages=[{"role": "user", "content": _REWRITE_PROMPT.format(question=query)}],
            api_key=api_key or None,
        )
        return response.choices[0].message.content.strip()
    except Exception:
        logger.warning("Query rewrite failed — using original query", exc_info=True)
        return query


def search_web(query: str, max_results: int = 5) -> list[dict]:
    """Search DuckDuckGo and return results as chunk-compatible dicts.
    """
    try:
        results = DDGS().text(query, max_results=max_results)
        return [
            {
                "url": r["href"],
                "doc_name": r["title"],
                "text": r["body"],
                "source_type": "web",
                "page_number": None,
                "doc_id": r["href"],
            }
            for r in results
        ]
    except Exception:
        logger.warning("DuckDuckGo search failed — returning empty results", exc_info=True)
        return []
