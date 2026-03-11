"""Database scaffolding for a Supabase-hosted Postgres instance."""

from typing import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase

from .config import get_settings

settings = get_settings()

async_engine = None
AsyncSessionLocal: async_sessionmaker[AsyncSession] | None = None

if settings.supabase_database_url:
    async_engine = create_async_engine(
        settings.supabase_database_url,
        echo=settings.debug and settings.environment != 'production',
        pool_pre_ping=True,
        pool_recycle=300,
    )
    AsyncSessionLocal = async_sessionmaker(
        async_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )


class Base(DeclarativeBase):
    """Base class for future SQLAlchemy models."""


async def get_db_session() -> AsyncGenerator[AsyncSession, None]:
    if AsyncSessionLocal is None:
        raise RuntimeError('Database not configured. Please set SUPABASE_DATABASE_URL.')

    async with AsyncSessionLocal() as session:
        yield session
