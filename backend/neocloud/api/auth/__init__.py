"""Supabase auth scaffolding."""

from .dependencies import CurrentUser, get_current_user
from .exceptions import AuthenticationError, InvalidTokenError, TokenExpiredError
from .schemas import AuthenticatedUser, JWTClaims

__all__ = [
    'AuthenticatedUser',
    'AuthenticationError',
    'CurrentUser',
    'InvalidTokenError',
    'JWTClaims',
    'TokenExpiredError',
    'get_current_user',
]
