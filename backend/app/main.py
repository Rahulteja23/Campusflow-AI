"""
CampusFlow AI — Backend API
FastAPI application entry point
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.database.connection import init_db
from app.api import auth, requests, ai, documents, workflows, sla, analytics, notifications
from app.config import settings

app = FastAPI(
    title="CampusFlow AI API",
    description="Intelligent Student Service Orchestration Platform",
    version="1.0.0",
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(auth.router)
app.include_router(requests.router)
app.include_router(ai.router)
app.include_router(documents.router)
app.include_router(workflows.router)
app.include_router(sla.router)
app.include_router(analytics.router)
app.include_router(notifications.router)

# Static file serving for uploads
os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=settings.UPLOAD_DIR), name="uploads")


@app.on_event("startup")
def startup():
    import sys
    import io
    # Fix Windows console encoding
    if sys.stdout.encoding != 'utf-8':
        sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8', errors='replace')
    init_db()
    # Auto-seed demo data if DB is empty
    from app.database.connection import SessionLocal
    from app.models.user import User
    db = SessionLocal()
    try:
        if db.query(User).count() == 0:
            from seed import seed_database
            seed_database(db)
    finally:
        db.close()


@app.get("/")
def root():
    return {
        "message": "CampusFlow AI API",
        "version": "1.0.0",
        "docs": "/docs",
        "status": "operational"
    }


@app.get("/health")
def health():
    return {"status": "healthy"}
