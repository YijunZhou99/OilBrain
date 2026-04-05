from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Pydantic settings model — reads from environment and .env file."""

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    qdrant_url: str
    qdrant_api_key: str

    default_llm_model: str 
    default_api_key: str = ""

    environment: str = "development"
    log_level: str = "INFO"

    # Resource limits — useful for testing with large documents
    max_pages_per_doc: int = 10   # 0 = no limit
    max_chunks_per_doc: int = 0  # 0 = no limit

    # Web search fallback — trigger when top Qdrant score is below this value
    web_search_score_threshold: float = 0.45


settings = Settings()
