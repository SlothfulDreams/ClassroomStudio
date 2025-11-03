from google import genai
from google.genai import types
from app.config import settings
import json
from typing import Optional
import io


class GeminiAnalysisService:
    """PDF analysis using native Gemini document processing"""

    def __init__(self):
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = "gemini-2.0-flash-exp"

    async def analyze_pdf(
        self,
        student_pdf_bytes: bytes,
        student_filename: str,
        solution_pdf_bytes: Optional[bytes] = None,
        solution_filename: Optional[str] = None,
    ) -> dict:
        """
        Analyze PDF using native Gemini document understanding

        Returns dict with strengths, weaknesses, summary
        """

        # Upload student PDF to Gemini
        student_file = self._upload_pdf(student_pdf_bytes, student_filename)

        # Upload solution PDF if provided
        solution_file = None
        if solution_pdf_bytes:
            solution_file = self._upload_pdf(
                solution_pdf_bytes, solution_filename or "solution.pdf"
            )

        # Run analysis with prompt chaining
        if solution_file:
            result = await self._analyze_with_solution(student_file, solution_file)
        else:
            result = await self._analyze_without_solution(student_file)

        return result

    def _upload_pdf(self, pdf_bytes: bytes, filename: str) -> types.File:
        """Upload PDF to Gemini File API"""
        pdf_file = io.BytesIO(pdf_bytes)

        uploaded = self.client.files.upload(
            file=pdf_file,
            config=types.UploadFileConfig(
                display_name=filename, mime_type="application/pdf"
            ),
        )

        return uploaded

    async def _analyze_without_solution(self, student_file: types.File) -> dict:
        """Analyze student PDF without solution comparison"""

        prompt = """Analyze this student submission PDF. Extract weaknesses and strengths.

Output valid JSON only:
{
  "weaknesses": [
    {
      "category": "conceptual|syntax|logic|missing|incomplete|error",
      "description": "2-10 word description",
      "severity": "minor|moderate|major|critical",
      "location": "optional location",
      "suggestion": "5-15 word improvement"
    }
  ],
  "strengths": [
    {
      "category": "category name",
      "description": "2-10 word description"
    }
  ],
  "summary": "1-2 sentence summary. Sacrifice grammar. Use fragments."
}

Be extremely concise. Identify 3-5 weaknesses, 2-3 strengths. Focus on critical issues."""

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_uri(
                            file_uri=student_file.uri, mime_type=student_file.mime_type
                        ),
                        types.Part.from_text(text=prompt),
                    ],
                )
            ],
        )

        return self._parse_response(response.text)

    async def _analyze_with_solution(
        self, student_file: types.File, solution_file: types.File
    ) -> dict:
        """Analyze student PDF comparing against teacher solution"""

        prompt = """Compare student submission vs teacher solution. Identify weaknesses and strengths.

Output valid JSON only:
{
  "weaknesses": [
    {
      "category": "conceptual|syntax|logic|missing|incomplete|error",
      "description": "2-10 word description",
      "severity": "minor|moderate|major|critical",
      "location": "optional location",
      "suggestion": "5-15 word improvement"
    }
  ],
  "strengths": [
    {
      "category": "category name",
      "description": "2-10 word description"
    }
  ],
  "summary": "1-2 sentence summary comparing to solution. Sacrifice grammar. Use fragments."
}

Be extremely concise. Focus on differences from solution. Identify 3-5 weaknesses, 2-3 strengths."""

        response = self.client.models.generate_content(
            model=self.model_name,
            contents=[
                types.Content(
                    role="user",
                    parts=[
                        types.Part.from_text(text="STUDENT SUBMISSION:"),
                        types.Part.from_uri(
                            file_uri=student_file.uri, mime_type=student_file.mime_type
                        ),
                        types.Part.from_text(text="\n\nTEACHER SOLUTION:"),
                        types.Part.from_uri(
                            file_uri=solution_file.uri,
                            mime_type=solution_file.mime_type,
                        ),
                        types.Part.from_text(text=f"\n\n{prompt}"),
                    ],
                )
            ],
        )

        result = self._parse_response(response.text)
        result["comparison_included"] = True
        return result

    def _parse_response(self, response_text: str) -> dict:
        """Parse JSON response from Gemini"""
        try:
            # Try direct JSON parse
            return json.loads(response_text)
        except json.JSONDecodeError:
            # Try extracting from markdown code block
            text = response_text.strip()
            if text.startswith("```json"):
                text = text[7:]
            if text.startswith("```"):
                text = text[3:]
            if text.endswith("```"):
                text = text[:-3]

            try:
                return json.loads(text.strip())
            except json.JSONDecodeError:
                # Fallback: return error structure
                return {
                    "weaknesses": [
                        {
                            "category": "parsing-error",
                            "description": "Failed to parse AI response",
                            "severity": "major",
                            "suggestion": "Check response format",
                        }
                    ],
                    "strengths": [],
                    "summary": "Analysis parsing failed.",
                }


# Singleton instance
gemini_analysis_service = GeminiAnalysisService()
