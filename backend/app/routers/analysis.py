from fastapi import APIRouter, HTTPException, status
from app.models.schemas import (
    AnalysisRequest,
    AnalysisResponse,
    AnalysisError,
    Weakness,
    Strength,
)
from app.services.pdf_service import pdf_service
from app.services.gemini_analysis_service import gemini_analysis_service
from app.services.convex_service import convex_service
import time
from typing import Optional

router = APIRouter()


@router.post(
    "/analyze-submission",
    response_model=AnalysisResponse,
    responses={400: {"model": AnalysisError}, 500: {"model": AnalysisError}},
)
async def analyze_submission(request: AnalysisRequest):
    """
    Analyze student PDF submission using LangChain + Gemini

    Flow:
    1. Download student PDF (+ optional solution PDF)
    2. Extract text from PDFs
    3. Run LangChain analysis pipeline (5 chained prompts)
    4. Return structured analysis results
    """
    start_time = time.time()

    try:
        # Update submission status to "analyzing"
        try:
            await convex_service.update_submission_status(
                request.submission_id, "analyzing"
            )
        except Exception as e:
            print(f"Warning: Could not update submission status: {e}")

        # Download student PDF (Convex signed URL or direct URL)
        student_pdf_bytes = await pdf_service.download_pdf(request.student_file_url)

        # Download solution PDF if provided
        solution_pdf_bytes: Optional[bytes] = None
        if request.solution_file_url:
            try:
                solution_pdf_bytes = await pdf_service.download_pdf(
                    request.solution_file_url
                )
            except Exception as e:
                # Don't fail if solution download fails, just skip comparison
                print(f"Warning: Failed to download solution PDF: {e}")
                solution_pdf_bytes = None

        # Run Gemini native PDF analysis
        analysis_result = await gemini_analysis_service.analyze_pdf(
            student_pdf_bytes=student_pdf_bytes,
            student_filename=f"submission_{request.submission_id}.pdf",
            solution_pdf_bytes=solution_pdf_bytes,
            solution_filename="solution.pdf" if solution_pdf_bytes else None,
        )

        # Convert to response models
        strengths = [Strength(**s) for s in analysis_result.get("strengths", [])]

        weaknesses = [Weakness(**w) for w in analysis_result.get("weaknesses", [])]

        # Calculate processing time
        processing_time_ms = int((time.time() - start_time) * 1000)

        response = AnalysisResponse(
            submission_id=request.submission_id,
            strengths=strengths,
            weaknesses=weaknesses,
            summary=analysis_result.get("summary", "Analysis complete."),
            overall_score=None,  # Optional: could calculate from weaknesses
            model_used="gemini-2.0-flash-exp",
            processing_time_ms=processing_time_ms,
            comparison_included=analysis_result.get("comparison_included", False),
        )

        # Store analysis results in Convex (in background, don't block response)
        try:
            await convex_service.store_analysis_results(
                submission_id=request.submission_id,
                analysis_data={
                    "strengths": [s.model_dump() for s in strengths],
                    "weaknesses": [w.model_dump() for w in weaknesses],
                    "summary": response.summary,
                    "overall_score": response.overall_score,
                    "model_used": response.model_used,
                    "processing_time_ms": processing_time_ms,
                    "analyzed_at": int(time.time() * 1000),
                    "confidence": 0.85,
                },
            )

            # Update submission status to "analyzed"
            await convex_service.update_submission_status(
                request.submission_id, "analyzed"
            )
        except Exception as e:
            print(f"Warning: Failed to store analysis in Convex: {e}")
            # Don't fail the request if storage fails

        return response

    except HTTPException:
        raise
    except Exception as e:
        # Try to reset submission status on error
        try:
            await convex_service.update_submission_status(
                request.submission_id, "submitted"
            )
        except:
            pass

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analysis failed: {str(e)}",
        )


@router.post("/test-analysis")
async def test_analysis():
    """
    Test endpoint with hardcoded sample analysis
    For development/testing without real PDF
    """
    return AnalysisResponse(
        submission_id="test-123",
        strengths=[
            Strength(category="implementation", description="Clear code structure"),
            Strength(category="documentation", description="Good inline comments"),
        ],
        weaknesses=[
            Weakness(
                category="error-handling",
                description="Missing try/catch blocks",
                severity="major",
                location="main function",
                suggestion="Add error handling for file operations",
            ),
            Weakness(
                category="logic",
                description="Edge case not handled",
                severity="moderate",
                location="validation section",
                suggestion="Check for empty input arrays",
            ),
        ],
        summary="Good structure. Missing error handling, edge cases.",
        overall_score=72,
        model_used="gemini-2.0-flash-exp",
        processing_time_ms=1234,
        comparison_included=False,
    )
