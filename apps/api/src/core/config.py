from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "CBSE AI API"
    database_url: str = "postgresql+psycopg://cbse:cbse_dev_password@localhost:5432/cbse_ai"
    jwt_secret: str = "replace_me"
    jwt_refresh_secret: str = "replace_me_too"
    access_token_expire_minutes: int = 30
    refresh_token_expire_days: int = 14


settings = Settings()
