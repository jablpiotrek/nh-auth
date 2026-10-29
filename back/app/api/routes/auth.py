from fastapi import APIRouter, HTTPException, Request, Response, status
from sqlalchemy import delete, func, select

from app.api.cookies import (
    REFRESH_COOKIE_NAME,
    clear_refresh_cookie,
    set_refresh_cookie,
)
from app.api.deps import CurrentUser, DbSession
from app.core.security import (
    create_access_token,
    generate_refresh_token,
    hash_password,
    hash_refresh_token,
    refresh_token_expiry,
    verify_password,
)
from app.models.refresh_token import RefreshToken
from app.models.user import User
from app.schemas.auth import AccessTokenResponse, LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["auth"])


async def _issue_tokens(
    db: DbSession, response: Response, user: User
) -> AccessTokenResponse:
    raw_refresh_token = generate_refresh_token()
    db.add(
        RefreshToken(
            user_id=user.id,
            token_hash=hash_refresh_token(raw_refresh_token),
            expires_at=refresh_token_expiry(),
        )
    )
    await db.commit()
    set_refresh_cookie(response, raw_refresh_token)
    return AccessTokenResponse(access_token=create_access_token(user.id))


@router.post(
    "/register", response_model=AccessTokenResponse, status_code=status.HTTP_201_CREATED
)
async def register(body: RegisterRequest, response: Response, db: DbSession):
    email = body.email.lower()

    existing = await db.scalar(select(User).where(User.email == email))
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT, detail="Email already registered"
        )

    user = User(email=email, password_hash=hash_password(body.password))
    db.add(user)
    await db.flush()

    return await _issue_tokens(db, response, user)


@router.post("/login", response_model=AccessTokenResponse)
async def login(body: LoginRequest, response: Response, db: DbSession):
    email = body.email.lower()
    user = await db.scalar(select(User).where(User.email == email))

    if user is None or not verify_password(body.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    return await _issue_tokens(db, response, user)


@router.post("/refresh", response_model=AccessTokenResponse)
async def refresh(request: Request, response: Response, db: DbSession):
    raw_refresh_token = request.cookies.get(REFRESH_COOKIE_NAME)
    if raw_refresh_token is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Missing refresh token"
        )

    token_hash = hash_refresh_token(raw_refresh_token)
    token_row = await db.scalar(
        select(RefreshToken).where(
            RefreshToken.token_hash == token_hash,
            RefreshToken.expires_at > func.now(),
        )
    )

    if token_row is None:
        clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token",
        )

    user = await db.get(User, token_row.user_id)
    if user is None:
        clear_refresh_cookie(response)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid refresh token"
        )

    await db.delete(token_row)
    await db.flush()

    return await _issue_tokens(db, response, user)


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(current_user: CurrentUser, response: Response, db: DbSession):
    await db.execute(
        delete(RefreshToken).where(RefreshToken.user_id == current_user.id)
    )
    await db.commit()
    clear_refresh_cookie(response)
