from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.responses import JSONResponse
import uvicorn
import os
from typing import Dict, Any

from .config import settings
from .db import engine, get_db
from .deps import get_current_user
from .routers import auth, datapoints, intakes, exports

# Create FastAPI app
app = FastAPI(
    title="SSDR API",
    description="Supplier Sustainability Data Router",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(datapoints.router, prefix="/datapoints", tags=["datapoints"])
app.include_router(intakes.router, prefix="/intakes", tags=["intakes"])
app.include_router(exports.router, prefix="/exports", tags=["exports"])

@app.get("/healthz")
async def health_check() -> Dict[str, str]:
    """Health check endpoint"""
    return {"status": "ok"}

@app.get("/")
async def root():
    return {"message": "SSDR API", "version": "1.0.0"}

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)