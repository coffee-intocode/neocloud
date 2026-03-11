"""Auth helper routes."""

from fastapi import APIRouter

from ..auth.dependencies import CurrentUser
from ..auth.schemas import AuthenticatedUser

router = APIRouter(prefix='/auth', tags=['auth'])


@router.get('/me', response_model=AuthenticatedUser)
async def get_authenticated_user(current_user: CurrentUser) -> AuthenticatedUser:
    return current_user
