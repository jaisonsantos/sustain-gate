from sqlalchemy import create_engine, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from typing import Generator
import logging

from .config import settings

logger = logging.getLogger(__name__)

# Create engine
engine = create_engine(
    settings.POSTGRES_URI,
    pool_pre_ping=True,
    echo=False
)

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base class for models
Base = declarative_base()

def get_db() -> Generator[Session, None, None]:
    """Database session dependency"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def init_db():
    """Initialize database and enable RLS"""
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        
        # Enable pgcrypto extension
        with engine.connect() as conn:
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS pgcrypto;"))
            conn.execute(text("CREATE EXTENSION IF NOT EXISTS \"uuid-ossp\";"))
            conn.commit()
            
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise