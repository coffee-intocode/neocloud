"""Authentication schemas for Supabase JWT claims."""

from pydantic import BaseModel, ConfigDict, EmailStr


class JWTClaims(BaseModel):
    """Supabase JWT token claims."""

    model_config = ConfigDict(extra='allow')

    sub: str
    aud: str
    exp: int
    email: EmailStr | None = None
    iat: int | None = None
    role: str | None = None


class AuthenticatedUser(BaseModel):
    """Authenticated Supabase user context."""

    supabase_user_id: str
    email: str | None = None
    role: str | None = None
