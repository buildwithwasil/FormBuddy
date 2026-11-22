"""FormBuddy AI — FastAPI application entry point"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pathlib import Path
from dotenv import load_dotenv

load_dotenv()

from app.routers import extract, ask, check, chat, fill, profile

app = FastAPI(
    title="FormBuddy AI API",
    description="AI-powered form completion assistant",
    version="2.0.0",
)

# CORS — allow frontend + extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(extract.router,  prefix="/api")
app.include_router(ask.router,      prefix="/api")
app.include_router(check.router,    prefix="/api")
app.include_router(chat.router,     prefix="/api")
app.include_router(fill.router,     prefix="/api")
app.include_router(profile.router,  prefix="/api")

# Serve the chat frontend as static files
frontend_dir = Path(__file__).parent.parent / "chat-ui"
if frontend_dir.exists():
    app.mount("/", StaticFiles(directory=str(frontend_dir), html=True), name="static")

@app.get("/api/health")
def health():
    return {"status": "ok", "service": "FormBuddy AI", "version": "2.0.0"}
