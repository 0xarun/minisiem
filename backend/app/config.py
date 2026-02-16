from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "MiniSIEM API"
    debug: bool = False
    database_url: str = "postgresql+asyncpg://minisiem:minisiem@db:5432/minisiem"
    cors_origins: list[str] = ["http://localhost:3000"]
    upload_zip_file_limit: int = 5

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")


settings = Settings()
