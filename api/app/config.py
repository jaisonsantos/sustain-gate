from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    # Database
    POSTGRES_URI: str = "postgresql+psycopg2://app:pass@db:5432/ssdr"
    
    # Redis
    REDIS_URL: str = "redis://redis:6379"
    
    # S3/MinIO
    S3_ENDPOINT: str = "http://minio:9000"
    S3_ACCESS_KEY: str = "minioadmin"
    S3_SECRET_KEY: str = "minioadmin"
    S3_BUCKET: str = "ssdr-evidences"
    
    # JWT
    JWT_SECRET: str = "change_me"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # CORS
    ALLOWED_ORIGINS: List[str] = ["http://localhost:5173", "http://frontend:5173"]
    
    # Data directories
    DATA_DIR: str = "/data"
    INTAKES_DIR: str = "/data/intakes"
    EXPORTS_DIR: str = "/data/exports"
    
    # Stripe
    STRIPE_API_KEY: str = "sk_test_..."
    STRIPE_WEBHOOK_SECRET: str = "whsec_..."
    STRIPE_PRICE_POC: str = "price_poc_monthly"
    STRIPE_PRICE_PRO_T1: str = "price_pro_t1_monthly"
    STRIPE_PRICE_PRO_T2: str = "price_pro_t2_monthly"
    STRIPE_PRICE_PRO_T3: str = "price_pro_t3_monthly"
    STRIPE_PRICE_SETUP: str = "price_setup_onetime"
    STRIPE_TAX_ENABLED: bool = True
    
    class Config:
        env_file = ".env"

settings = Settings()

# Ensure data directories exist
os.makedirs(settings.INTAKES_DIR, exist_ok=True)
os.makedirs(settings.EXPORTS_DIR, exist_ok=True)