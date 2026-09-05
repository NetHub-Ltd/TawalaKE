import enum

from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import EmailStr


# environment enum
class Environment(str, enum.Enum):
    DEVELOPMENT = "development"
    PRODUCTION = "production"

class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=("./.env", "./.env.local"),
        env_file_encoding="utf-8",
        extra="ignore",
    )
    # App Config
    app_name: str
    app_version: str
    environment: Environment

    # Database Settings
    DATABASE_NAME: str
    DATABASE_USER: str
    DATABASE_HOST: str
    DATABASE_PORT: int
    DATABASE_PASSWORD: str

    # security
    secret_key: str
    algorithm: str = "HS256"
    issuer: str
    audience: str
    access_token_expire_minutes: int
    refresh_token_expire_days: int
    pin_token_expire_hours: int

    admin_name: str
    admin_email: EmailStr
    admin_password: str

    # Management
    admin_route: bool = False
    rbac_cache_ttl_sec: int = 120
    audit_enabled: bool = True

    # Soft-delete retention archive pipeline (purge/email off until ready)
    archive_enabled: bool = False
    archive_signed_url_ttl_days: int = 7
    data_retention_fallback_months: int = 6

    resource_server: str
    allowed_origins: str

    # Email Configuration
    resend_api_key: str
    email_from_security: str = "NetHub Security <security@nethub.co.ke>"
    email_from_billing: str = "NetHub Billing <billing@nethub.co.ke>"
    email_from_support: str = "NetHub Support <support@nethub.co.ke>"
    email_from_tawala: str = "Tawala System <tawala@nethub.co.ke>"
    email_from_marketing: str = "NetHub Updates <newsletter@nethub.co.ke>"
    # Public frontend origin used in emails (reset, onboarding setup, trial).
    # Required from env — no hardcoded default. Accept host-only or full URL.
    frontend_url: str

    redis_url: str

    @property
    def cors_origins(self) -> list:
        if not self.allowed_origins:
            return []
        # Split by comma, strip whitespace, and filter out empty strings or "*"
        return [f.strip() for f in self.allowed_origins.split(",") if f.strip() and f.strip() != "*"]

    @property
    def frontend_origin(self) -> str:
        """Absolute frontend origin (scheme + host, no trailing slash).

        Normalizes host-only values from env (e.g. ``tawala.nethub.co.ke``)
        to ``https://…``. Use this for all email action links.
        """
        url = (self.frontend_url or "").strip()
        if not url:
            raise ValueError(
                "FRONTEND_URL is required and must be set in the environment "
                "(e.g. https://tawala.nethub.co.ke)"
            )
        if not url.startswith("http://") and not url.startswith("https://"):
            url = f"https://{url}"
        return url.rstrip("/")

    @property
    def async_db_url(self) -> str:
        return f"postgresql+asyncpg://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"

    @property
    def sync_db_url(self) -> str:
        return f"postgresql://{self.DATABASE_USER}:{self.DATABASE_PASSWORD}@{self.DATABASE_HOST}:{self.DATABASE_PORT}/{self.DATABASE_NAME}"

    @property
    def is_prod(self) -> bool:
        return self.environment == Environment.PRODUCTION


settings = Settings()
