from fastapi import APIRouter

from config import settings
from schemas import ServerLimits, SettingsResponse, UserSettings
from settings_store import load_settings, save_settings

router = APIRouter(prefix="/api/settings", tags=["settings"])


@router.get("", response_model=SettingsResponse)
async def get_settings() -> SettingsResponse:
    """Return current user settings plus read-only server limits."""
    user = load_settings()
    return SettingsResponse(
        **user.model_dump(),
        limits=ServerLimits(
            max_pages_per_doc=settings.max_pages_per_doc,
            max_chunks_per_doc=settings.max_chunks_per_doc,
        ),
    )


@router.put("", response_model=UserSettings)
async def update_settings(updated: UserSettings) -> UserSettings:
    """Replace user settings with the provided values and persist them."""
    return save_settings(updated)
