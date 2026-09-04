"""Application configuration.

All settings load from environment variables (or a ``.env`` file for
local development). No secrets are hardcoded. No provider URL is
committed — those arrive with the architect's provider matrix.
"""

from __future__ import annotations

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    """Environment-driven configuration.

    All fields default to safe/inert values so importing this module
    never touches the network or a real database.
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        env_prefix="JONARAI_",
        extra="ignore",
    )

    # --- App identity ---------------------------------------------------
    app_name: str = "jonarai"
    environment: str = Field(default="development", pattern=r"^(development|staging|production)$")

    # --- Database (used only when Phase E ships) ------------------------
    # Empty string = not configured; engines that require the DB must
    # refuse to start (data-integrity failsafe, Master Spec §2.6).
    database_url: str = ""

    # --- Provider registry ---------------------------------------------
    # Populated only after Phase C's provider matrix is confirmed by
    # the architect. Left empty deliberately.
    active_providers: tuple[str, ...] = ()

    # --- Kill switches --------------------------------------------------
    # All default to True — the safe direction. Live-execution flags are
    # never flipped from code; they require a human-confirmed
    # environment variable per Master Spec §2.5 and Phase Z.
    entries_disabled: bool = True
    live_execution_disabled: bool = True


def get_settings() -> Settings:
    """Construct a fresh :class:`Settings` instance.

    Kept as a callable (rather than a module-level singleton) so tests
    can override env vars per test without state leakage.
    """
    return Settings()
