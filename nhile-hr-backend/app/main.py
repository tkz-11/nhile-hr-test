from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.auth.router import router as auth_router
from app.members.router import router as members_router
from app.retention.router import router as retention_router
from app.passport.router import router as passport_router
from app.culture.router import router as culture_router
from app.ai.router import router as ai_router

app = FastAPI(
    title="NhiLe HR API",
    version="1.0.0",
    description="Culture OS — NhiLe Team",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router,      prefix="/auth",      tags=["Auth"])
app.include_router(members_router,   prefix="/members",   tags=["Members"])
app.include_router(retention_router, prefix="/retention", tags=["Retention"])
app.include_router(passport_router,  prefix="/passport",  tags=["Passport"])
app.include_router(culture_router,   prefix="/culture",   tags=["Culture"])
app.include_router(ai_router,        prefix="/ai",        tags=["AI"])

@app.get("/")
async def root():
    return {
        "message": "NhiLe HR API is running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health():
    """Health check endpoint cho deployment."""
    return {"status": "ok", "version": "1.0.0"}
