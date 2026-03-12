import logging

from fastapi import Request
from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.responses import error_response

logger = logging.getLogger(__name__)


async def http_exception_handler(request: Request, exc: StarletteHTTPException):
    logger.warning("HTTP error %s: %s", exc.status_code, exc.detail)
    return error_response(str(exc.detail), exc.status_code)


async def validation_exception_handler(request: Request, exc: RequestValidationError):
    logger.warning("Validation error: %s", exc.errors())
    return error_response("Invalid request payload", 422)


async def sqlalchemy_exception_handler(request: Request, exc: SQLAlchemyError):
    logger.exception("Database error")
    return error_response("Database error", 500)


async def generic_exception_handler(request: Request, exc: Exception):
    logger.exception("Unhandled application error")
    return error_response("Internal server error", 500)