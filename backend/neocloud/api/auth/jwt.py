"""JWT verification for Supabase access tokens."""

import jwt
from jwt import PyJWKClient

from .exceptions import InvalidTokenError, TokenExpiredError

SUPPORTED_ALGORITHMS = ['ES256', 'RS256']


class JWTVerifier:
    """Verify Supabase JWTs using the project JWKS endpoint."""

    def __init__(self, supabase_url: str):
        self.supabase_url = supabase_url.rstrip('/')
        self.jwks_url = f'{self.supabase_url}/auth/v1/.well-known/jwks.json'
        self._jwks_client = PyJWKClient(self.jwks_url, cache_keys=True, lifespan=300)

    async def verify_token(self, token: str) -> dict:
        try:
            signing_key = self._jwks_client.get_signing_key_from_jwt(token)
            return jwt.decode(
                token,
                signing_key.key,
                algorithms=SUPPORTED_ALGORITHMS,
                audience='authenticated',
                issuer=f'{self.supabase_url}/auth/v1',
            )
        except jwt.ExpiredSignatureError as error:
            raise TokenExpiredError() from error
        except jwt.InvalidAudienceError as error:
            raise InvalidTokenError('Invalid audience') from error
        except jwt.InvalidIssuerError as error:
            raise InvalidTokenError('Invalid issuer') from error
        except jwt.InvalidTokenError as error:
            raise InvalidTokenError(str(error)) from error
        except Exception as error:
            raise InvalidTokenError('Token verification failed') from error


_verifier: JWTVerifier | None = None


def get_jwt_verifier(supabase_url: str) -> JWTVerifier:
    global _verifier
    if _verifier is None:
        _verifier = JWTVerifier(supabase_url)
    return _verifier
