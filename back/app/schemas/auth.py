import re

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.schemas.user import UserConfiguration

_UPPERCASE_RE = re.compile(r"[A-Z]")
_LOWERCASE_RE = re.compile(r"[a-z]")
_DIGIT_RE = re.compile(r"\d")
_SPECIAL_RE = re.compile(r"[^A-Za-z0-9]")


class _EmailModel(BaseModel):
    email: EmailStr = Field(max_length=254)

    @field_validator("email", mode="before")
    @classmethod
    def normalize_email(cls, v: object) -> object:
        return v.strip().lower() if isinstance(v, str) else v


class RegisterRequest(_EmailModel):
    password: str = Field(min_length=8, max_length=128)
    configuration: UserConfiguration = Field(default_factory=UserConfiguration)

    @field_validator("password")
    @classmethod
    def validate_password_complexity(cls, v: str) -> str:
        if not _UPPERCASE_RE.search(v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not _LOWERCASE_RE.search(v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not _DIGIT_RE.search(v):
            raise ValueError("Password must contain at least one number")
        if not _SPECIAL_RE.search(v):
            raise ValueError("Password must contain at least one special character")
        return v


class LoginRequest(_EmailModel):
    password: str = Field(min_length=1, max_length=128)


class AccessTokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
