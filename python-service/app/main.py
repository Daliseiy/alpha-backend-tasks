from fastapi import FastAPI

from fastapi.exceptions import RequestValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.api.health import router as health_router
from app.api.sample_items import router as sample_items_router
from app.api.briefing_routes import router as briefing_router

from app.core.exceptions import (
    generic_exception_handler,
    http_exception_handler,
    sqlalchemy_exception_handler,
    validation_exception_handler,
)

app = FastAPI(title="InsightOps Starter Service", version="0.1.0")

app.include_router(health_router)
app.include_router(sample_items_router)
app.include_router(briefing_router)

app.add_exception_handler(StarletteHTTPException, http_exception_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, sqlalchemy_exception_handler)
app.add_exception_handler(Exception, generic_exception_handler)


@app.get("/")
def root() -> dict[str, str]:
    return {"service": "InsightOps", "status": "starter-ready"}
