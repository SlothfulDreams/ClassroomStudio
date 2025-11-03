import os
from pathlib import Path
from dotenv import load_dotenv
from pydantic_settings import BaseSettings

# Load .env from project root
project_root = Path(__file__).parent.parent.parent
env_path = project_root / ".env"
load_dotenv(dotenv_path=env_path)


class Settings(BaseSettings):
    # API Keys
    gemini_api_key: str = os.getenv("GEMINI_API_KEY", "")

    # API Configuration
    backend_host: str = "0.0.0.0"
    backend_port: int = 8000

    # CORS
    allowed_origins: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ]

    # Convex
    convex_url: str = os.getenv("CONVEX_URL", "https://shiny-hornet-999.convex.cloud")

    class Config:
        case_sensitive = False


settings = Settings()
