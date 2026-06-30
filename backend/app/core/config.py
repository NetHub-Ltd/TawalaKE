import enum

from pydantic_settings import BaseSettings, SettingsConfigDict


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

    # Management
    admin_route: bool = False

    resource_server: str
    allowed_origins: str

    # Email Configuration
    resend_api_key: str
    email_from_security: str = "NetHub Security <security@nethub.co.ke>"
    email_from_billing: str = "NetHub Billing <billing@nethub.co.ke>"
    email_from_support: str = "NetHub Support <support@nethub.co.ke>"
    email_from_tawala: str = "Tawala System <tawala@nethub.co.ke>"
    email_from_marketing: str = "NetHub Updates <newsletter@nethub.co.ke>"

    redis_url: str

    @property
    def cors_origins(self) -> list:
        if not self.allowed_origins:
            return []
        # Split by comma, strip whitespace, and filter out empty strings or "*"
        return [f.strip() for f in self.allowed_origins.split(",") if f.strip() and f.strip() != "*"]

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
