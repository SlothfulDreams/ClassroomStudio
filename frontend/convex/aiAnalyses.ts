import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthenticatedMember, requireTeacher } from "./permissions";

// Create analysis result from backend
export const createAnalysis = mutation({
  args: {
    submissionId: v.id("submissions"),
    overallScore: v.optional(v.number()),
    confidence: v.number(),
    weaknesses: v.array(
      v.object({
        category: v.string(),
        description: v.string(),
        severity: v.union(
          v.literal("minor"),
          v.literal("moderate"),
          v.literal("major"),
          v.literal("critical")
        ),
        location: v.optional(v.string()),
        suggestion: v.string(),
      })
    ),
    strengths: v.array(
      v.object({
        category: v.string(),
        description: v.string(),
      })
    ),
    summary: v.string(),
    detailedFeedback: v.string(),
    modelUsed: v.string(),
    processingTime: v.number(),
    analyzedAt: v.number(),
  },
  handler: async (ctx, args) => {
    // Verify submission exists
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    // Check if analysis already exists
    const existingAnalysis = await ctx.db
      .query("aiAnalyses")
      .withIndex("submission", (q) => q.eq("submissionId", args.submissionId))
      .first();

    if (existingAnalysis) {
      // Update existing analysis
      await ctx.db.patch(existingAnalysis._id, {
        overallScore: args.overallScore,
        confidence: args.confidence,
        weaknesses: args.weaknesses,
        strengths: args.strengths,
        summary: args.summary,
        detailedFeedback: args.detailedFeedback,
        modelUsed: args.modelUsed,
        processingTime: args.processingTime,
        analyzedAt: args.analyzedAt,
      });
      return existingAnalysis._id;
    }

    // Create new analysis
    const analysisId = await ctx.db.insert("aiAnalyses", {
      submissionId: args.submissionId,
      overallScore: args.overallScore,
      confidence: args.confidence,
      weaknesses: args.weaknesses,
      strengths: args.strengths,
      summary: args.summary,
      detailedFeedback: args.detailedFeedback,
      modelUsed: args.modelUsed,
      processingTime: args.processingTime,
      analyzedAt: args.analyzedAt,
    });

    return analysisId;
  },
});

// Get analysis by submission ID
export const getAnalysis = query({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const { userId, role } = await getAuthenticatedMember(
      ctx,
      submission.classroomId
    );

    // Students can only see analysis for their own submissions
    if (role === "student" && submission.studentId !== userId) {
      throw new Error("Not authorized to view this analysis");
    }

    const analysis = await ctx.db
      .query("aiAnalyses")
      .withIndex("submission", (q) => q.eq("submissionId", args.submissionId))
      .first();

    return analysis;
  },
});

// Get all analyses for an assignment (teachers only)
export const getAnalysesByAssignment = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const { userId } = await getAuthenticatedMember(ctx, assignment.classroomId);
    await requireTeacher(ctx, assignment.classroomId, userId);

    // Get all submissions for the assignment
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("assignmentStudent", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();

    // Get analyses for all submissions
    const analyses = await Promise.all(
      submissions.map(async (submission) => {
        const analysis = await ctx.db
          .query("aiAnalyses")
          .withIndex("submission", (q) => q.eq("submissionId", submission._id))
          .first();

        if (!analysis) return null;

        const student = await ctx.db.get(submission.studentId);

        return {
          ...analysis,
          submission: {
            _id: submission._id,
            studentId: submission.studentId,
            studentName: student?.name,
            submittedAt: submission.submittedAt,
            isLate: submission.isLate,
          },
        };
      })
    );

    return analyses.filter((a) => a !== null);
  },
});

// Get all analyses for a classroom (teachers only)
export const getAnalysesByClassroom = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedMember(ctx, args.classroomId);
    await requireTeacher(ctx, args.classroomId, userId);

    // Get all submissions for the classroom
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("classroomSubmissions", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    // Get analyses for all submissions
    const analyses = await Promise.all(
      submissions.map(async (submission) => {
        const analysis = await ctx.db
          .query("aiAnalyses")
          .withIndex("submission", (q) => q.eq("submissionId", submission._id))
          .first();

        if (!analysis) return null;

        const student = await ctx.db.get(submission.studentId);
        const assignment = await ctx.db.get(submission.assignmentId);

        return {
          ...analysis,
          submission: {
            _id: submission._id,
            studentId: submission.studentId,
            studentName: student?.name,
            assignmentId: submission.assignmentId,
            assignmentTitle: assignment?.title,
            submittedAt: submission.submittedAt,
            isLate: submission.isLate,
          },
        };
      })
    );

    return analyses
      .filter((a) => a !== null)
      .sort((a, b) => b!.analyzedAt - a!.analyzedAt);
  },
});
