from typing import AsyncGenerator
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import NullPool
from app.config import settings

# Supabase Transaction Pooler (PgBouncer) không hỗ trợ prepared statements
# giữa các connection — phải tắt cache + dùng NullPool vì PgBouncer đã pool sẵn.
engine = create_async_engine(
    settings.database_url,
    echo=(settings.environment == "development"),
    future=True,
    poolclass=NullPool,
    connect_args={
        "statement_cache_size": 0,
        "prepared_statement_cache_size": 0,
    },
)

AsyncSessionLocal = async_sessionmaker(
    bind=engine,
    class_=AsyncSession,
    expire_on_commit=False
)

Base = declarative_base()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Dependency injection cho database session."""
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()
