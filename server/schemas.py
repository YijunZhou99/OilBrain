from datetime import datetime
from typing import Literal

from pydantic import BaseModel


# --- Chat ---


class ChatHistoryMessage(BaseModel):
    """A single turn in the conversation history."""

    role: Literal["user", "assistant"]
    content: str


class ChatRequest(BaseModel):
    """Payload for POST /api/chat."""

    message: str
    history: list[ChatHistoryMessage] = []
    api_key: str = ""
    llm_model: str = "groq/llama-3.3-70b-versatile"
    citations_enabled: bool = True


class Citation(BaseModel):
    """A source reference returned alongside an LLM answer."""

    doc_id: str
    doc_name: str
    page: int | None = None
    snippet: str = ""


class WebCitation(BaseModel):
    """A web search result returned alongside an LLM answer."""

    url: str
    title: str
    snippet: str


class ChatResponse(BaseModel):
    """Response for POST /api/chat."""

    answer: str
    citations: list[Citation] = []
    web_citations: list[WebCitation] = []


# --- Documents ---


class DocumentResponse(BaseModel):
    """Metadata for a single indexed document."""

    id: str
    name: str
    source_type: Literal["EIA", "OPEC", "Other"]
    upload_date: datetime
    status: Literal["processing", "ready", "error"]
    size_bytes: int
    chunk_count: int = 0


# --- Settings ---


class UserSettings(BaseModel):
    """Persisted user preferences."""

    llm_model: str = "gemini/gemini-2.0-flash"
    api_key: str = ""
    citations_enabled: bool = True
    embedding_model: str = "models/gemini-embedding-001"


class ServerLimits(BaseModel):
    """Read-only server-side resource limits derived from environment config."""

    max_pages_per_doc: int
    max_chunks_per_doc: int


class SettingsResponse(BaseModel):
    """GET /api/settings response — user preferences plus read-only server limits."""

    llm_model: str
    api_key: str
    citations_enabled: bool
    embedding_model: str
    limits: ServerLimits
