from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.user import UserConfiguration, UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: CurrentUser):
    return current_user


@router.patch("/me", response_model=UserResponse)
async def update_current_user(
    body: UserConfiguration, current_user: CurrentUser, db: DbSession
):
    current_user.subscribed = body.subscribed
    await db.commit()
    return current_user
