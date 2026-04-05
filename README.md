# OilBrain

A full-stack **Retrieval-Augmented Generation (RAG)** assistant for oil market research. Upload PDF reports, then ask natural-language questions — answers are grounded in your documents with cited page references.

Built as a portfolio project to demonstrate end-to-end RAG system engineering: PDF ingestion, vector search, LLM orchestration, and a React frontend.

![Stack](https://img.shields.io/badge/stack-React%20%7C%20FastAPI%20%7C%20Qdrant%20%7C%20Gemini-blue)
![Python](https://img.shields.io/badge/python-3.11-blue)

---

## Demo Video

https://github.com/user-attachments/assets/282d9a06-7db2-463a-b8c4-7bad4b422595


---


## What it does

- **RAG chat** — ask questions in plain English; answers are generated from relevant document excerpts, not hallucinated
- **Web search fallback** — when no document chunk scores above a similarity threshold, the query is automatically rewritten by the LLM and sent to DuckDuckGo, so you always get a useful response
- **PDF ingestion** — upload any PDF (EIA Short-Term Energy Outlook, OPEC Monthly Oil Market Report, etc.); the pipeline parses, chunks, embeds, and indexes it into Qdrant
- **Cited answers** — every response links back to the source document and page number; web results cite their URL
- **BYOK** — bring your own Gemini, Groq, Mistral, OpenRouter, or local Ollama API key; keys are never persisted server-side
- **Chat history** — multi-turn conversations with context window managed to the last 3 full turns

---

## Technical highlights

### RAG pipeline

```
PDF upload → pdfplumber parse → RecursiveCharacterTextSplitter → Qdrant upsert
                                                                        ↓
Query → Qdrant vector search (all-minilm-l6-v2 cloud inference) → similarity score check
            ↓ score ≥ 0.45                    ↓ score < 0.45
        RAG answer + page citations     LLM query rewrite → DuckDuckGo → web citations
```

- **Embedding** is handled by Qdrant Cloud Inference (`sentence-transformers/all-minilm-l6-v2`, free tier) — no local embedding model needed
- **Chunking** uses `RecursiveCharacterTextSplitter` (1000 chars, 200 overlap) with a minimum chunk filter to drop bare page headers
- **Citation deduplication** — chunks are deduplicated by `(doc_id, page_number)` before being surfaced to the user
- **Web fallback** — when RAG similarity is weak, the LLM rewrites the query into a better search string before hitting DuckDuckGo

### LLM provider flexibility

Uses **litellm** to support any compatible provider without code changes:

```
gemini/gemini-2.0-flash        — Google AI Studio (default, free tier)
groq/llama-3.3-70b-versatile   — Groq (free tier)
openrouter/...                 — OpenRouter (many free models)
mistral/mistral-small-latest   — Mistral (free tier)
ollama/llama3.2                — Local Ollama (no key required)
```

### Backend architecture

```
server/
├── routes/          # FastAPI route handlers
├── rag/
│   ├── ingestor.py    # PDF → chunks → Qdrant vectors
│   ├── retriever.py   # Vector search + scored fallback decision
│   ├── web_search.py  # LLM query rewrite + DuckDuckGo
│   └── chain.py       # Prompt assembly + litellm call
├── schemas.py    # All Pydantic request/response models
└── config.py     # Pydantic BaseSettings from environment
```

### Frontend

React 19 + TypeScript SPA with three views (Chat, Documents, Settings). The chat interface renders both RAG citations (document + page) and web citations (URL + snippet) in a collapsible panel.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS v4, motion/react |
| Backend | Python 3.11, FastAPI, LangChain, litellm |
| Vector DB | Qdrant Cloud (free tier, cloud inference) |
| Embeddings | `sentence-transformers/all-minilm-l6-v2` via Qdrant Cloud Inference (free) |
| LLM | Gemini 2.0 Flash default — any litellm-compatible provider |
| Web search | DuckDuckGo (ddgs), LLM query rewriting |
| PDF parsing | pdfplumber |
| Infrastructure | Docker + Docker Compose |

---

## Getting started

### Prerequisites

- Docker + Docker Compose
- A [Qdrant Cloud](https://cloud.qdrant.io) cluster (free tier)
- A [Google AI Studio](https://aistudio.google.com) API key (free tier)

### Setup

```bash
git clone https://github.com/your-username/oilbrain.git
cd oilbrain

cp server/.env.example server/.env
# Edit server/.env with your keys
```

`server/.env`:
```env
QDRANT_URL=https://your-cluster.qdrant.io
QDRANT_API_KEY=your-qdrant-api-key
DEFAULT_LLM_MODEL=gemini/gemini-2.0-flash
DEFAULT_API_KEY=your-gemini-api-key
```

### Run

```bash
docker compose up
```

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend | http://localhost:8000 |
| API docs | http://localhost:8000/docs |

---

## Local development

```bash
# Backend
cd server && pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd client && npm install && npm run dev

# Tests
cd server && pytest tests/ -v
```

---

## API

```
POST   /api/chat              — RAG query: answer + doc citations + web citations
POST   /api/documents         — Upload PDF (background ingestion task)
GET    /api/documents         — List all indexed documents with status
DELETE /api/documents/{id}    — Remove document + its vectors from Qdrant
GET    /api/settings          — Get user preferences
PUT    /api/settings          — Update model, API key, citations toggle
GET    /health                — Health check
```
---

## Potential improvements

Areas worth exploring if this were taken further:

- **Sentence-window chunking** — embed individual sentences but retrieve ±2 surrounding sentences as LLM context; produces cleaner embeddings than paragraph-level chunks without losing narrative continuity
- **Semantic chunking** — split on embedding similarity drops instead of character counts, so table rows and prose paragraphs don't get merged into the same chunk
- **Re-ranking** — add a cross-encoder re-ranker (e.g. Cohere Rerank) as a second pass after Qdrant retrieval to improve precision before the LLM call
- **Streaming responses** — stream the LLM output token-by-token to the frontend instead of waiting for the full answer
- **Authentication** — add user accounts so multiple analysts can maintain separate document libraries and API key settings
- **Scheduled ingestion** — auto-fetch and ingest new EIA/OPEC reports on a schedule instead of requiring manual PDF upload
- **Evaluation pipeline** — build a small golden Q&A set to benchmark retrieval quality (recall@k, MRR) when swapping chunking strategies or embedding models
