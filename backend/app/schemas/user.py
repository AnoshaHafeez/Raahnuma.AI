from datetime import datetime
from typing import Literal, Optional

from pydantic import BaseModel, EmailStr, Field

Language = Literal["en", "ur"]
ExperienceLevel = Literal["beginner", "intermediate", "expert"]

# Keep in sync with the frontend password rule in components/auth/RegisterForm.tsx.
PASSWORD_MIN_LENGTH = 8
PASSWORD_MAX_LENGTH = 128


class UserRegister(BaseModel):
    """Registration payload.

    Only ``email``/``password`` are required so the contract stays backward
    compatible; every profile field is optional with a safe default.
    """

    email: EmailStr
    password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)
    full_name: Optional[str] = Field(default=None, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=32)
    preferred_language: Language = "en"
    experience_level: ExperienceLevel = "beginner"
    # When supplied, an EmergencyContact row is created alongside the user.
    emergency_contact_name: Optional[str] = Field(default=None, max_length=120)
    emergency_contact_phone: Optional[str] = Field(default=None, max_length=32)


class UserLogin(BaseModel):
    email: EmailStr
    password: str


class UserUpdate(BaseModel):
    """Partial profile update — omitted fields are left untouched."""

    full_name: Optional[str] = Field(default=None, max_length=120)
    phone: Optional[str] = Field(default=None, max_length=32)
    preferred_language: Optional[Language] = None
    experience_level: Optional[ExperienceLevel] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str = Field(min_length=PASSWORD_MIN_LENGTH, max_length=PASSWORD_MAX_LENGTH)


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    # Seconds until the token expires — lets the client schedule a re-login
    # without having to trust its own clock offset too much.
    expires_in: int


class UserOut(BaseModel):
    id: int
    email: EmailStr
    full_name: Optional[str] = None
    phone: Optional[str] = None
    preferred_language: Language = "en"
    experience_level: ExperienceLevel = "beginner"
    is_admin: bool = False
    created_at: datetime

    model_config = {"from_attributes": True}
