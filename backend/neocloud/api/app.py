"""Main FastAPI application."""

import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from .brokkr import ApiErrorResponse, BrokkrApiError
from .config import get_settings
from .database import async_engine
from .routers import ai_chat_router, auth_router, brokkr_router

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
    app.include_router(auth_router, prefix=settings.api_v1_prefix)
    app.include_router(brokkr_router, prefix=settings.api_v1_prefix)

    @app.exception_handler(BrokkrApiError)
    async def handle_brokkr_api_error(_request: Request, exc: BrokkrApiError) -> JSONResponse:
        payload = ApiErrorResponse(code=exc.code, message=exc.message, details=exc.details)
        return JSONResponse(status_code=exc.status_code, content=payload.model_dump(by_alias=True))

    @app.get('/health', tags=['health'])
    async def health_check():
        database_status = 'not_configured'
        if async_engine is not None:
            try:
                async with async_engine.connect() as connection:
                    await connection.execute(text('SELECT 1'))
                database_status = 'connected'
            except Exception:
                database_status = 'error'

        return {
            'status': 'healthy',
            'app_name': settings.app_name,
            'version': settings.app_version,
            'environment': settings.environment,
            'database': database_status,
            'supabase_auth': bool(settings.supabase_url),
            'brokkr_configured': bool(settings.brokkr_api_key),
        }

    return app


app = create_app()
