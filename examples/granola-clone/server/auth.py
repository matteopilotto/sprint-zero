"""Local auth: bcrypt password hashes plus a self-issued HS256 JWT (7-day expiry)."""
import os
import uuid
import warnings
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
import jwt
from fastapi import APIRouter, Header
from pydantic import BaseModel

from db import connect, now_iso
from errors import ApiError, invalid_input, unauthorized

JWT_SECRET = os.environ.get("JWT_SECRET", "sprint-zero-dev-secret")
TOKEN_DAYS = 7

# The baked-in dev secret is shorter than PyJWT recommends; that is fine for a local demo.
warnings.filterwarnings("ignore", category=jwt.warnings.InsecureKeyLengthWarning)

router = APIRouter()


# ---- helpers -------------------------------------------------------------

def hash_password(password):
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def check_password(password, password_hash):
    return bcrypt.checkpw(password.encode("utf-8"), password_hash.encode("utf-8"))


def make_token(user_id):
    expires = datetime.now(timezone.utc) + timedelta(days=TOKEN_DAYS)
    return jwt.encode({"sub": user_id, "exp": expires}, JWT_SECRET, algorithm="HS256")


def public_user(row):
    return {"id": row["id"], "email": row["email"], "name": row["name"], "created_at": row["created_at"]}


def current_user_id(authorization: Optional[str] = Header(default=None)):
    """FastAPI dependency: verifies the Bearer token and returns the user id, or raises 401."""
    if not authorization or not authorization.startswith("Bearer "):
        raise unauthorized()
    token = authorization[len("Bearer "):].strip()
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=["HS256"])
    except jwt.PyJWTError:
        raise unauthorized()
    user_id = payload.get("sub")
    with connect() as conn:
        row = conn.execute("SELECT id FROM users WHERE id = ?", (user_id,)).fetchone()
    if not row:
        raise unauthorized()
    return user_id


# ---- routes --------------------------------------------------------------

class SignupBody(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    password: Optional[str] = None


class LoginBody(BaseModel):
    email: Optional[str] = None
    password: Optional[str] = None


@router.post("/auth/signup", status_code=201)
def signup(body: SignupBody):
    email = (body.email or "").strip().lower()
    password = body.password or ""
    if not email or "@" not in email:
        raise invalid_input("A valid email is required")
    if len(password) < 8:
        raise invalid_input("Password must be at least 8 characters")
    name = (body.name or "").strip() or email.split("@")[0]

    with connect() as conn:
        if conn.execute("SELECT 1 FROM users WHERE email = ?", (email,)).fetchone():
            raise ApiError(409, "email_taken", "An account with this email already exists")
        user_id = str(uuid.uuid4())
        conn.execute(
            "INSERT INTO users (id, email, name, password_hash, created_at) VALUES (?, ?, ?, ?, ?)",
            (user_id, email, name, hash_password(password), now_iso()),
        )
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return {"access_token": make_token(user_id), "user": public_user(row)}


@router.post("/auth/login")
def login(body: LoginBody):
    email = (body.email or "").strip().lower()
    with connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    if not row or not check_password(body.password or "", row["password_hash"]):
        raise ApiError(401, "invalid_credentials", "Invalid email or password")
    return {"access_token": make_token(row["id"]), "user": public_user(row)}


@router.get("/auth/me")
def me(authorization: Optional[str] = Header(default=None)):
    user_id = current_user_id(authorization)
    with connect() as conn:
        row = conn.execute("SELECT * FROM users WHERE id = ?", (user_id,)).fetchone()
    return {"user": public_user(row)}
