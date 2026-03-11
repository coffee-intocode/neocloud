"""Application configuration."""

import json
from functools import lru_cache
from typing import Literal

from pydantic import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Application settings."""

    model_config = SettingsConfigDict(
        env_file='.env', env_file_encoding='utf-8', case_sensitive=False
    )

    app_name: str = 'Neocloud API'
    app_version: str = '0.1.0'
    environment: Literal['development', 'staging', 'production'] = 'development'
    debug: bool = True
    api_v1_prefix: str = '/api/v1'
    cors_origins: list[str] = ['*']
    supabase_url: str | None = None
    supabase_database_url: str | None = None
    alembic_db_url: str | None = None
    brokkr_api_key: str | None = None
    brokkr_base_url: str = 'https://brokkr.hydrahost.com/api/v1'
    brokkr_timeout_seconds: float = 15.0
    anthropic_api_key: str | None = None
    openai_api_key: str | None = None
    google_api_key: str | None = None

    @field_validator('cors_origins', mode='before')
    @classmethod
    def parse_cors_origins(cls, value: str | list[str]) -> list[str]:
        if isinstance(value, str):
            return json.loads(value)
        return value


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance."""

    return Settings()
