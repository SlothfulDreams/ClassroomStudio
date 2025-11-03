import httpx


class PDFService:
    """Handle PDF download from URLs"""

    async def download_pdf(self, url: str) -> bytes:
        """Download PDF from URL (Convex signed URL or direct)"""
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.get(url)
            response.raise_for_status()
            return response.content


# Singleton instance
pdf_service = PDFService()
