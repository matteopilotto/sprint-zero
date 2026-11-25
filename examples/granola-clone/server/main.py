"""Granola clone API (FastAPI). Run from server/: uvicorn main:app --port 8000"""
import os

from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(os.path.abspath(__file__)), ".env"))  # reads server/.env if present (e.g. ANTHROPIC_API_KEY); must run before the other imports read os.environ

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

import auth
import notes
import templates
from db import init_schema
from errors import ApiError

app = FastAPI(title="Granola clone API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_methods=["*"],
    allow_headers=["*"],
)

init_schema()  # CREATE TABLE IF NOT EXISTS, so a fresh clone works with no migration step

app.include_router(auth.router)
app.include_router(templates.router)
app.include_router(notes.router)


@app.get("/")
def health():
    return {"status": "ok"}


# ---- every error leaves as { "error": code, "message": text } ------------

def error_response(status, code, message):
    return JSONResponse(status_code=status, content={"error": code, "message": message})


@app.exception_handler(ApiError)
def handle_api_error(request: Request, exc: ApiError):
    return error_response(exc.status, exc.code, exc.message)


@app.exception_handler(RequestValidationError)
def handle_validation_error(request: Request, exc: RequestValidationError):
    first = exc.errors()[0] if exc.errors() else {}
    if first.get("type") == "json_invalid":
        return error_response(400, "invalid_input", "Request body must be valid JSON")
    field = ".".join(str(p) for p in first.get("loc", []) if p != "body" and not isinstance(p, int))
    message = f"Invalid value for {field}" if field else "Invalid request body"
    return error_response(400, "invalid_input", message)


@app.exception_handler(StarletteHTTPException)
def handle_http_error(request: Request, exc: StarletteHTTPException):
    codes = {401: "unauthorized", 404: "not_found", 405: "method_not_allowed"}
    if exc.status_code == 401:
        return error_response(401, "unauthorized", "Missing or invalid token")
    message = exc.detail if isinstance(exc.detail, str) else "Request failed"
    return error_response(exc.status_code, codes.get(exc.status_code, "error"), message)


@app.exception_handler(Exception)
def handle_unexpected(request: Request, exc: Exception):
    return error_response(500, "server_error", "Something went wrong")
