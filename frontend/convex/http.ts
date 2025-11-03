import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { auth } from "./auth";
import { api } from "./_generated/api";

const http = httpRouter();

auth.addHttpRoutes(http);

// Public HTTP route for backend to store AI analysis results
http.route({
  path: "/ai-analysis",
  method: "POST",
  handler: httpAction(async (ctx, request) => {
    try {
      const body = await request.json();

      // Validate required fields
      if (!body.submissionId) {
        return new Response(
          JSON.stringify({ error: "submissionId is required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      // Call internal mutation to store analysis
      const analysisId = await ctx.runMutation(api.aiAnalyses.createAnalysis, {
        submissionId: body.submissionId,
        overallScore: body.overallScore,
        confidence: body.confidence ?? 0.85,
        weaknesses: body.weaknesses ?? [],
        strengths: body.strengths ?? [],
        summary: body.summary ?? "",
        detailedFeedback: body.detailedFeedback ?? "",
        modelUsed: body.modelUsed ?? "gemini-2.0-flash-exp",
        processingTime: body.processingTime ?? 0,
        analyzedAt: body.analyzedAt ?? Date.now(),
      });

      return new Response(
        JSON.stringify({
          status: "success",
          analysisId,
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      );
    } catch (error) {
      console.error("AI analysis storage error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to store analysis",
          detail: error instanceof Error ? error.message : String(error),
        }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  }),
});

export default http;
