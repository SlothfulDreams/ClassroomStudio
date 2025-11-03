from pydantic import BaseModel, Field
from typing import Optional, Literal


class Weakness(BaseModel):
    """Identified weakness in submission"""

    category: str = Field(..., description="Category: conceptual, syntax, logic, etc.")
    description: str = Field(..., description="Brief description (2-10 words)")
    severity: Literal["minor", "moderate", "major", "critical"]
    location: Optional[str] = Field(None, description="Where in document (optional)")
    suggestion: str = Field(..., description="How to improve (5-15 words max)")


class Strength(BaseModel):
    """Identified strength in submission"""

    category: str = Field(..., description="Category of strength")
    description: str = Field(..., description="Brief description (2-10 words)")


class AnalysisRequest(BaseModel):
    """Request for PDF analysis"""

    submission_id: str = Field(..., description="Submission ID from Convex")
    student_file_url: str = Field(..., description="URL to download student PDF")
    solution_file_url: Optional[str] = Field(
        None, description="URL to teacher solution PDF (optional)"
    )


class AnalysisResponse(BaseModel):
    """Analysis results"""

    submission_id: str

    # Analysis results
    strengths: list[Strength] = Field(
        default_factory=list, description="2-3 identified strengths"
    )
    weaknesses: list[Weakness] = Field(
        default_factory=list, description="3-5 identified weaknesses"
    )
    summary: str = Field(
        ..., description="Extremely concise summary (1-2 sentences, fragments OK)"
    )

    # Metadata
    overall_score: Optional[int] = Field(
        None, ge=0, le=100, description="AI confidence score 0-100"
    )
    model_used: str = Field(default="gemini-2.0-flash-exp")
    processing_time_ms: int = Field(
        ..., description="Analysis duration in milliseconds"
    )
    comparison_included: bool = Field(
        default=False, description="Whether solution comparison was performed"
    )


class AnalysisError(BaseModel):
    """Error response"""

    error: str
    detail: Optional[str] = None
    submission_id: Optional[str] = None
