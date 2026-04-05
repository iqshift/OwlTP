from pydantic_settings import BaseSettings, SettingsConfigDict
from typing import Optional
import os

class Settings(BaseSettings):
    # App Settings
    ENV: str = "development"
    PROJECT_NAME: str = "OwlTP API Platform"
    
    # Secrets
    JWT_SECRET: str = "supersecretkey" # DEFAULT FOR DEV ONLY!
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 720 # 12 hours
    
    # Database & Redis
    DATABASE_URL: str = "postgresql://admin:password123@db:5432/whatsapp_otp"
    REDIS_URL: str = "redis://redis:6379/0"
    
    # Encryption
    # Generate once: from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())
    SMTP_ENCRYPTION_KEY: Optional[str] = None 
    TOKEN_ENCRYPTION_KEY: str = "KFi2oZBlwEt_-EWnO133LAVG2knaw-GEobiJrKoz1pM=" # Valid Fernet key
    
    # CORS
    CORS_ORIGINS: str = "*" # Comma-separated list for production
    
    # WhatsApp CLI Path
    CLI_PATH: str = "/usr/local/bin/whatsapp-cli"
    SESSIONS_BASE_PATH: str = "/sessions"
    
    # 🛰️ Phase 8: Intelligent Alerting & Active Defense
    TELEGRAM_BOT_TOKEN: str = os.getenv("TELEGRAM_BOT_TOKEN", "")
    TELEGRAM_ADMIN_CHAT_ID: str = os.getenv("TELEGRAM_ADMIN_CHAT_ID", "")
    THREAT_THRESHOLD: int = int(os.getenv("THREAT_THRESHOLD", 5)) # Failed attempts before alert/ban
    BAN_DURATION_SECONDS: int = int(os.getenv("BAN_DURATION_SECONDS", 1800)) # 30 minutes
    
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    def validate_production(self):
        if self.ENV == "production":
            if self.JWT_SECRET == "supersecretkey":
                print("FATAL: JWT_SECRET must be set in production mode!")
                raise SystemExit(1)
            if not self.SMTP_ENCRYPTION_KEY:
                print("FATAL: SMTP_ENCRYPTION_KEY must be set in production mode!")
                raise SystemExit(1)
            if self.TOKEN_ENCRYPTION_KEY == "KFi2oZBlwEt_-EWnO133LAVG2knaw-GEobiJrKoz1pM=":
                # Note: This is now the default "known" key. In real prod, this should be overriden.
                pass 

settings = Settings()
settings.validate_production()
