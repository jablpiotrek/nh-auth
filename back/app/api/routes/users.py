from fastapi import APIRouter, Response, status

from app.api.cookies import clear_refresh_cookie
from app.api.deps import CurrentUser, DbSession
from app.schemas.user import UserResponse

router = APIRouter(prefix="/users", tags=["users"])


@router.get("/me", response_model=UserResponse)
async def read_current_user(current_user: CurrentUser):
    return current_user


@router.delete("/me", status_code=status.HTTP_204_NO_CONTENT)
async def delete_current_user(
    current_user: CurrentUser, db: DbSession, response: Response
):
    await db.delete(current_user)
    await db.commit()
    clear_refresh_cookie(response)
