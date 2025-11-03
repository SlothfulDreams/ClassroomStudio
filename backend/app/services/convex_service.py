import httpx
from typing import Optional, Any
from app.config import settings


class ConvexService:
    """
    Service for interacting with Convex backend
    Uses Convex HTTP API to query/mutate data
    """

    def __init__(self):
        self.base_url = settings.convex_url
        self.api_url = f"{self.base_url}/api"

    async def query(self, function_name: str, args: dict = None) -> Any:
        """
        Call a Convex query function via HTTP

        Example: query("submissions:getSubmission", {"submissionId": "..."})
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.api_url}/query",
                json={"path": function_name, "args": args or {}, "format": "json"},
            )
            response.raise_for_status()
            result = response.json()

            # Convex returns {"status": "success", "value": ...} or {"status": "error", ...}
            if result.get("status") == "error":
                raise Exception(f"Convex query error: {result.get('errorMessage')}")

            return result.get("value")

    async def mutation(self, function_name: str, args: dict = None) -> Any:
        """
        Call a Convex mutation function via HTTP

        Example: mutation("aiAnalyses:createAnalysis", {...})
        """
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{self.api_url}/mutation",
                json={"path": function_name, "args": args or {}, "format": "json"},
            )
            response.raise_for_status()
            result = response.json()

            if result.get("status") == "error":
                raise Exception(f"Convex mutation error: {result.get('errorMessage')}")

            return result.get("value")

    async def get_submission_file_url(self, submission_id: str) -> dict:
        """
        Get file download URL for a submission
        Calls submissions:getSubmissionFileUrl query

        Returns: {"url": "https://...", "fileName": "...", "fileType": "..."}
        """
        try:
            result = await self.query(
                "submissions:getSubmissionFileUrl", {"submissionId": submission_id}
            )
            return result
        except Exception as e:
            raise Exception(f"Failed to get submission file URL: {str(e)}")

    async def get_assignment_solution_url(self, assignment_id: str) -> Optional[str]:
        """
        Get solution file URL for an assignment (if exists)

        Returns: URL string or None
        """
        try:
            # Get assignment details
            assignment = await self.query(
                "assignments:getAssignment", {"assignmentId": assignment_id}
            )

            if not assignment or not assignment.get("solutionFileId"):
                return None

            # Get file URL for solution
            file_result = await self.query(
                "files:getFileUrl", {"fileMetadataId": assignment["solutionFileId"]}
            )

            return file_result.get("url") if file_result else None

        except Exception as e:
            print(f"Warning: Failed to get solution URL: {e}")
            return None

    async def store_analysis_results(
        self, submission_id: str, analysis_data: dict
    ) -> str:
        """
        Store AI analysis results in Convex DB
        Creates record in aiAnalyses table

        Returns: ID of created analysis record
        """
        try:
            # Transform analysis data to match Convex schema
            convex_data = {
                "submissionId": submission_id,
                "overallScore": analysis_data.get("overall_score"),
                "confidence": analysis_data.get("confidence", 0.85),
                "weaknesses": [
                    {
                        "category": w["category"],
                        "description": w["description"],
                        "severity": w["severity"],
                        "location": w.get("location", ""),
                        "suggestion": w["suggestion"],
                    }
                    for w in analysis_data.get("weaknesses", [])
                ],
                "strengths": [
                    {"category": s["category"], "description": s["description"]}
                    for s in analysis_data.get("strengths", [])
                ],
                "summary": analysis_data.get("summary", ""),
                "detailedFeedback": analysis_data.get(
                    "summary", ""
                ),  # Use summary as detailed feedback
                "modelUsed": analysis_data.get("model_used", "gemini-2.0-flash-exp"),
                "processingTime": analysis_data.get("processing_time_ms", 0),
                "analyzedAt": int(analysis_data.get("analyzed_at", 0)),
            }

            # Call Convex mutation to create analysis
            # Note: This assumes we'll create this mutation in Phase 4
            # For now, we'll prepare the data structure

            result = await self.mutation("aiAnalyses:createAnalysis", convex_data)

            return result

        except Exception as e:
            raise Exception(f"Failed to store analysis results: {str(e)}")

    async def update_submission_status(self, submission_id: str, status: str) -> None:
        """
        Update submission status (analyzing, analyzed, etc.)
        """
        try:
            if status == "analyzing":
                await self.mutation(
                    "submissions:markAsAnalyzing", {"submissionId": submission_id}
                )
            elif status == "analyzed":
                await self.mutation(
                    "submissions:markAsAnalyzed", {"submissionId": submission_id}
                )
        except Exception as e:
            print(f"Warning: Failed to update submission status: {e}")


# Singleton instance
convex_service = ConvexService()
