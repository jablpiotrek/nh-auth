import hashlib
import secrets
from datetime import UTC, datetime, timedelta
from uuid import UUID

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError

from app.core.config import settings

_password_hasher = PasswordHasher()

# A valid hash with no corresponding user, verified against on an unknown
# email at login so that case takes the same Argon2 time as a wrong
# password for a real user - otherwise the early-return for "no such
# user" is measurably faster and reopens the user-enumeration channel the
# identical error message is meant to close.
DUMMY_PASSWORD_HASH = PasswordHasher().hash(secrets.token_urlsafe(32))


def hash_password(password: str) -> str:
    return _password_hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _password_hasher.verify(password_hash, password)
    except VerifyMismatchError:
        return False


def create_access_token(user_id: UUID) -> str:
    now = datetime.now(UTC)
    payload = {
        "sub": str(user_id),
        "iat": now,
        "exp": now + timedelta(minutes=settings.access_token_expire_minutes),
    }
    return jwt.encode(
        payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm
    )


def decode_access_token(token: str) -> UUID:
    payload = jwt.decode(
        token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm]
    )
    return UUID(payload["sub"])


def generate_refresh_token() -> str:
    return secrets.token_urlsafe(32)


def hash_refresh_token(token: str) -> str:
    return hashlib.sha256(token.encode()).hexdigest()


def refresh_token_expiry() -> datetime:
    return datetime.now(UTC) + timedelta(days=settings.refresh_token_expire_days)
