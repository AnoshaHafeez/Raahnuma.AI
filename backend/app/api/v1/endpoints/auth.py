"""Auth endpoints — register, login, JWT token, profile management."""

from fastapi import APIRouter, Depends, HTTPException, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.api.deps import get_current_user
from app.core.config import settings
from app.core.rate_limit import auth_rate_limit
from app.core.security import create_access_token, verify_password
from app.crud.emergency_contact import create_contact
from app.crud.user import (
    create_user,
    get_user_by_email,
    update_user,
    update_user_password,
)
from app.db.session import get_db
from app.models.user import User
from app.schemas.user import (
    PasswordChange,
    TokenResponse,
    UserLogin,
    UserOut,
    UserRegister,
    UserUpdate,
)

router = APIRouter()


def _issue_token(user: User) -> TokenResponse:
    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return TokenResponse(
        access_token=token,
        expires_in=settings.access_token_expire_minutes * 60,
    )


@router.post(
    "/register",
    response_model=UserOut,
    status_code=status.HTTP_201_CREATED,
    dependencies=[Depends(auth_rate_limit)],
)
async def register(body: UserRegister, db: AsyncSession = Depends(get_db)):
    # Normalise the email so "A@x.com" and "a@x.com" cannot become two accounts.
    email = body.email.strip().lower()

    existing = await get_user_by_email(db, email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered.",
        )

    user = await create_user(
        db,
        email=email,
        password=body.password,
        full_name=body.full_name,
        phone=body.phone,
        preferred_language=body.preferred_language,
        experience_level=body.experience_level,
    )

    # The signup form collects one emergency contact — persist it up front so the
    # SOS screen is usable immediately after registration.
    if body.emergency_contact_name and body.emergency_contact_phone:
        await create_contact(
            db,
            user_id=user.id,
            name=body.emergency_contact_name,
            phone_number=body.emergency_contact_phone,
        )

    return user


@router.post(
    "/login",
    response_model=TokenResponse,
    dependencies=[Depends(auth_rate_limit)],
)
async def login(body: UserLogin, db: AsyncSession = Depends(get_db)):
    email = body.email.strip().lower()
    user = await get_user_by_email(db, email)

    # Identical error for "unknown email" and "wrong password" so the endpoint
    # cannot be used to enumerate registered accounts.
    if not user or not verify_password(body.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return _issue_token(user)


@router.get("/me", response_model=UserOut)
async def read_current_user(current_user: User = Depends(get_current_user)):
    """Resolve the caller's profile from their token — used by the client to rehydrate."""
    return current_user


@router.patch("/me", response_model=UserOut)
async def update_current_user(
    body: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    # exclude_unset keeps PATCH semantics: only fields the client actually sent.
    return await update_user(db, current_user, body.model_dump(exclude_unset=True))


@router.post("/change-password", status_code=status.HTTP_204_NO_CONTENT)
async def change_password(
    body: PasswordChange,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect.",
        )
    if body.current_password == body.new_password:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="New password must be different from the current one.",
        )

    await update_user_password(db, current_user, body.new_password)

    # Note: previously issued tokens stay valid until they expire. Revoking them
    # would need a token blacklist or a per-user token version claim.
    return Response(status_code=status.HTTP_204_NO_CONTENT)
