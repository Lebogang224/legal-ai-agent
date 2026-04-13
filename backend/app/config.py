from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    # Application
    app_env: str = "development"
    app_port: int = 8000
    app_version: str = "1.0.0"

    # Database
    database_url: str = "sqlite:///./legal_ai.db"

    # JWT
    jwt_secret_key: str = "change-me-to-a-random-secret-key"
    jwt_algorithm: str = "HS256"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 7

    # AWS S3
    aws_access_key_id: str = ""
    aws_secret_access_key: str = ""
    aws_region: str = "af-south-1"
    s3_bucket_name: str = "legal-ai-documents"

    # Redis
    redis_url: str = "redis://localhost:6379/0"

    # LLM (Groq — free tier, runs Llama 3)
    groq_api_key: str = ""
    llm_model: str = "llama-3.3-70b-versatile"
    llm_max_tokens: int = 2048
    llm_temperature: float = 0.1

    # Ingestion
    chunk_size: int = 1000
    chunk_overlap: int = 200
    faiss_index_dir: str = "./data/faiss"

    class Config:
        env_file = ".env"


settings = Settings()
