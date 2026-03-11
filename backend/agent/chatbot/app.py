"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from .config import get_settings
from .routers import ai_chat_router

load_dotenv()

settings = get_settings()


def _configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s %(levelname)s %(name)s %(message)s',
        force=True,
    )
    logging.getLogger('chatbot').setLevel(logging.INFO)


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next) -> Response:
        response = await call_next(request)
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-XSS-Protection'] = '1; mode=block'
        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
        if settings.environment == 'production':
            response.headers['Strict-Transport-Security'] = (
                'max-age=31536000; includeSubDomains'
            )
        return response


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


def create_app() -> FastAPI:
    _configure_logging()

    app = FastAPI(
        title=settings.app_name,
        version=settings.app_version,
        debug=settings.debug,
        lifespan=lifespan,
        docs_url=f'{settings.api_v1_prefix}/docs',
        redoc_url=f'{settings.api_v1_prefix}/redoc',
        openapi_url=f'{settings.api_v1_prefix}/openapi.json',
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=['*'],
        allow_headers=['*'],
    )
    app.add_middleware(SecurityHeadersMiddleware)
    app.include_router(ai_chat_router, prefix=settings.api_v1_prefix)

    @app.get('/health', tags=['health'])
    async def health_check():
        return {
            'status': 'healthy',
            'app_name': settings.app_name,
            'version': settings.app_version,
            'environment': settings.environment,
            'persistence': 'disabled',
        }

    return app


app = create_app()
