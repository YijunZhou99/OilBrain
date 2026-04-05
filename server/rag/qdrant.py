from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams

from config import settings

COLLECTION_NAME = "oilbrain_docs"
EMBEDDING_MODEL = "sentence-transformers/all-minilm-l6-v2"  
VECTOR_SIZE = 384  # all-minilm-l6-v2 output dimension


def get_client() -> QdrantClient:
    """Return a configured Qdrant client with cloud inference enabled."""
    return QdrantClient(
        url=settings.qdrant_url,
        api_key=settings.qdrant_api_key,
        cloud_inference=True,
    )


def ensure_collection(client: QdrantClient) -> None:
    """Create the oilbrain_docs collection if it does not already exist."""
    existing = {c.name for c in client.get_collections().collections}
    if COLLECTION_NAME not in existing:
        client.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(size=VECTOR_SIZE, distance=Distance.COSINE),
        )
