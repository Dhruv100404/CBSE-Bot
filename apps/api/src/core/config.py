from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "CBSE AI API"
    database_url: str = "postgresql+psycopg://cbse:cbse_dev_password@localhost:5432/cbse_ai"
    jwt_secret: str = "replace_me"
    jwt_refresh_secret: str = "replace_me_too"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14
    tutor_llm_provider: str = "ollama"
    openai_api_key: str = ""
    openai_model: str = "gpt-4.1-mini"
    openai_base_url: str = "https://api.openai.com/v1"
    ollama_base_url: str = "http://host.docker.internal:11434"
    ollama_model: str = "llama3.2:3b"
    huggingface_api_token: str = ""
    huggingface_model: str = "HuggingFaceH4/zephyr-7b-beta"
    tutor_llm_timeout_seconds: int = 25
    pinecone_api_key: str = ""
    pinecone_index_name: str = "cbse-pcmb-content"
    pinecone_api_version: str = "2025-10"
    pinecone_namespace_prefix: str = "cbse"
    embedding_provider: str = "ollama"
    embedding_model: str = "all-minilm"
    embedding_dimension: int = 384


settings = Settings()
