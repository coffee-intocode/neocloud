"""FastAPI dependencies for Supabase-backed auth."""

from typing import Annotated

from fastapi import Depends
from fastapi.security import OAuth2PasswordBearer

from ..config import get_settings
from .exceptions import AuthenticationError, InvalidTokenError
from .jwt import get_jwt_verifier
from .schemas import AuthenticatedUser, JWTClaims

oauth2_scheme = OAuth2PasswordBearer(tokenUrl='token', auto_error=False)


async def get_current_user(
    token: Annotated[str | None, Depends(oauth2_scheme)],
) -> AuthenticatedUser:
    if token is None:
        raise AuthenticationError('Missing authentication token')

    settings = get_settings()
    if not settings.supabase_url:
        raise AuthenticationError('Supabase URL not configured')

    claims_dict = await get_jwt_verifier(settings.supabase_url).verify_token(token)
    claims = JWTClaims.model_validate(claims_dict)

    if claims.email is None:
        raise InvalidTokenError('Token missing email claim')

    return AuthenticatedUser(
        supabase_user_id=claims.sub,
        email=str(claims.email),
        role=claims.role,
    )


CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
