from google import genai
from google.genai import types
from app.config import settings
from typing import Any


class GeminiService:
    client: genai.Client
    model_name: str

    def __init__(self) -> None:
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY not found in environment")

        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = "gemini-2.0-flash-exp"

    async def check_connection(self) -> dict[str, Any]:
        """Test Gemini API connection"""
        try:
            # Simple test: list available models
            _ = self.client.models.list()
            return {"status": "connected", "model": self.model_name, "available": True}
        except Exception as e:
            return {"status": "error", "error": str(e), "available": False}

    async def test_generate(self, prompt: str) -> str:
        """Test text generation"""
        try:
            response = self.client.models.generate_content(
                model=self.model_name, contents=prompt
            )
            return response.text or ""
        except Exception as e:
            raise Exception(f"Gemini generation failed: {str(e)}")


# Singleton instance
gemini_service = GeminiService()
