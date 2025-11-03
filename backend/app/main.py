from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.config import settings
from app.services.gemini_service import gemini_service
from app.routers import analysis

app = FastAPI(
    title="ClassroomStudio AI Analysis",
    description="AI-powered PDF submission analysis service",
    version="0.1.0",
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register routers
app.include_router(analysis.router, prefix="/api", tags=["analysis"])


@app.get("/")
async def root():
    return {
        "service": "ClassroomStudio AI Analysis",
        "status": "running",
        "version": "0.1.0",
    }


@app.get("/health")
async def health_check():
    """Health check endpoint with Gemini connection status"""
    gemini_status = await gemini_service.check_connection()

    return {"status": "healthy", "service": "ai-analysis", "gemini": gemini_status}
