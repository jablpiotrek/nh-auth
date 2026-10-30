from collections.abc import AsyncGenerator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from app.core.config import settings

# asyncpg doesn't read `sslmode` from the URL (that's a libpq/psycopg
# param) - SSL has to go through connect_args instead. Neon requires it;
# local Docker Postgres doesn't support it, hence the explicit toggle.
connect_args = {"ssl": "require"} if settings.database_ssl else {}
# pool_pre_ping: Neon (serverless Postgres) can close idle connections
# server-side - e.g. on compute auto-suspend - without the pool knowing.
# Without this, the first request after a quiet period hands out a dead
# connection and asyncpg raises "connection is closed".
engine = create_async_engine(
    settings.database_url, connect_args=connect_args, pool_pre_ping=True
)
async_session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db() -> AsyncGenerator[AsyncSession]:
    async with async_session_factory() as session:
        yield session
