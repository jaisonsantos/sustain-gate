from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from sqlalchemy import text
from jose import jwt, JWTError
from typing import Optional
import uuid

from .config import settings
from .db import get_db
from .models import AppUser, Tenant

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> AppUser:
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token, settings.JWT_SECRET, algorithms=[settings.JWT_ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    user = db.query(AppUser).filter(AppUser.id == uuid.UUID(user_id)).first()
    if user is None:
        raise credentials_exception

    db.execute(text("SELECT set_current_tenant(:tenant_id)"), {"tenant_id": str(user.tenant_id)})

    return user

def get_current_tenant(current_user: AppUser = Depends(get_current_user), db: Session = Depends(get_db)) -> Tenant:
    """Get current user's tenant"""
    tenant = db.query(Tenant).filter(Tenant.id == current_user.tenant_id).first()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    return tenant