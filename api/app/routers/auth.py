from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from jose import jwt
from datetime import datetime, timedelta
from typing import Dict
import uuid

from ..config import settings
from ..db import get_db
from ..models import AppUser, Tenant

router = APIRouter()

@router.post("/token")
async def login(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """
    Login endpoint - fake implementation for MVP
    Accept admin@demo.local/admin123
    """
    # Fake authentication for MVP
    if form_data.username != "admin@demo.local" or form_data.password != "admin123":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Create fake user ID for token
    fake_user_id = "550e8400-e29b-41d4-a716-446655440000"
    
    # Create JWT token
    access_token_expires = timedelta(minutes=settings.JWT_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": fake_user_id}, expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token,
        "token_type": "bearer"
    }

def create_access_token(data: dict, expires_delta: timedelta = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.JWT_SECRET, algorithm=settings.JWT_ALGORITHM)
    return encoded_jwt