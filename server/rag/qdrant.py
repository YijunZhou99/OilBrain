from qdrant_client import QdrantClient
from qdrant_client.models import Distance, VectorParams, PayloadSchemaType

from config import settings

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
    if settings.COLLECTION_NAME not in existing:
        client.create_collection(
            collection_name=settings.COLLECTION_NAME,
            vectors_config=VectorParams(size=settings.VECTOR_SIZE, distance=Distance.COSINE),
        )

    client.create_payload_index(
        collection_name=settings.COLLECTION_NAME,
        field_name="doc_id",
        field_schema=PayloadSchemaType.KEYWORD,
    )

def delete_document_vectors(doc_id: str, client: QdrantClient) -> None:
    from qdrant_client.models import FieldCondition, Filter, FilterSelector, MatchValue

    client.delete(
        collection_name=settings.COLLECTION_NAME,
        points_selector=FilterSelector(
            filter=Filter(
                must=[FieldCondition(key="doc_id", match=MatchValue(value=doc_id))]
            )
        ),
    )
