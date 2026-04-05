import json
from pathlib import Path

from schemas import UserSettings

SETTINGS_PATH = Path("data/settings.json")


def load_settings() -> UserSettings:
    """Load user settings from disk, returning defaults if the file is absent."""
    if not SETTINGS_PATH.exists():
        return UserSettings()
    return UserSettings(**json.loads(SETTINGS_PATH.read_text()))


def save_settings(s: UserSettings) -> UserSettings:
    """Persist user settings to disk and return the saved model."""
    SETTINGS_PATH.parent.mkdir(parents=True, exist_ok=True)
    SETTINGS_PATH.write_text(s.model_dump_json(indent=2))
    return s
