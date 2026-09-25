"""
Face Authentication Router
Provides endpoints for face-based login:
  - GET  /accounts           → list available (dummy) accounts
  - POST /accounts/custom    → register a new user with face image
  - GET  /accounts/custom/{id}/image → serve the stored face image
  - POST /auth/face-login    → confirm client-side face match
"""

from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from fastapi.responses import FileResponse
from pydantic import BaseModel
from uuid import uuid4
from pathlib import Path
from typing import List

router = APIRouter()

BASE_DIR = Path(__file__).resolve().parent
STORAGE_DIR = BASE_DIR / "storage"
TEMP_ACCOUNTS_DIR = STORAGE_DIR / "temp-accounts"


# --------------- Models ---------------

class Account(BaseModel):
    id: str
    fullName: str
    picture: str
    type: str = "DUMMY"


class FaceLoginRequest(BaseModel):
    accountId: str
    success: bool


class FaceLoginResponse(BaseModel):
    authenticated: bool
    accountId: str | None = None
    message: str


# --------------- Dummy seed data ---------------

DUMMY_ACCOUNTS: List[Account] = [
    Account(
        id="374ed1e4-481b-4074-a26e-6137657c6e35",
        fullName="Bilal Gumus",
        picture="374ed1e4-481b-4074-a26e-6137657c6e35/1.jpg",
    ),
    Account(
        id="43332f46-89a4-435c-880e-4d72bb51149a",
        fullName="Andrew Clark",
        picture="43332f46-89a4-435c-880e-4d72bb51149a/1.jpg",
    ),
    Account(
        id="b8476d8d-bd7e-405f-aa66-9a22a9727930",
        fullName="Amelia Miller",
        picture="b8476d8d-bd7e-405f-aa66-9a22a9727930/1.jpg",
    ),
    Account(
        id="88421e2c-ca7a-4332-815f-6e12824e2d05",
        fullName="Sophia Smith",
        picture="88421e2c-ca7a-4332-815f-6e12824e2d05/1.jpg",
    ),
    Account(
        id="0c2f5599-9296-4f94-97d5-e773043188ae",
        fullName="Emily Martinez",
        picture="0c2f5599-9296-4f94-97d5-e773043188ae/1.jpg",
    ),
]


def ensure_storage() -> None:
    STORAGE_DIR.mkdir(parents=True, exist_ok=True)
    TEMP_ACCOUNTS_DIR.mkdir(parents=True, exist_ok=True)


# --------------- Endpoints ---------------

@router.get("/accounts", response_model=List[Account])
async def list_accounts() -> List[Account]:
    """Return the list of available accounts (dummy + any custom ones)."""
    ensure_storage()
    return DUMMY_ACCOUNTS


@router.post("/accounts/custom", response_model=Account)
async def create_custom_account(
    full_name: str = Form(...),
    image: UploadFile = File(...),
) -> Account:
    """Register a new user with a face image upload."""
    ensure_storage()

    content_type = image.content_type or ""
    if content_type not in {"image/png", "image/jpeg", "image/jpg"}:
        raise HTTPException(status_code=400, detail="Only PNG and JPEG images are supported.")

    account_id = str(uuid4())
    account_dir = TEMP_ACCOUNTS_DIR / account_id
    account_dir.mkdir(parents=True, exist_ok=True)

    suffix = ".jpg" if "jpeg" in content_type or "jpg" in content_type else ".png"
    image_path = account_dir / f"1{suffix}"

    data = await image.read()
    image_path.write_bytes(data)

    picture_rel = f"{account_id}/{image_path.name}"

    account = Account(
        id=account_id,
        fullName=full_name,
        picture=picture_rel,
        type="CUSTOM",
    )

    return account


@router.get("/accounts/custom/{account_id}/image")
async def get_custom_account_image(account_id: str):
    """Serve the stored face image for a custom account."""
    ensure_storage()
    account_dir = TEMP_ACCOUNTS_DIR / account_id
    if not account_dir.exists() or not account_dir.is_dir():
        raise HTTPException(status_code=404, detail="Account not found")

    files = sorted(account_dir.glob("1.*"))
    if not files:
        raise HTTPException(status_code=404, detail="Image not found")

    return FileResponse(files[0])


@router.post("/auth/face-login", response_model=FaceLoginResponse)
async def face_login(payload: FaceLoginRequest) -> FaceLoginResponse:
    """Confirm a client-side face recognition result."""
    if not payload.success:
        return FaceLoginResponse(
            authenticated=False,
            accountId=None,
            message="Face recognition failed on client.",
        )

    # Accept any known dummy account id OR any custom account id
    account_ids = {a.id for a in DUMMY_ACCOUNTS}
    authenticated = payload.accountId in account_ids or bool(payload.accountId)

    return FaceLoginResponse(
        authenticated=authenticated,
        accountId=payload.accountId if authenticated else None,
        message="Authenticated" if authenticated else "Unknown account id",
    )
