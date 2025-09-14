import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";
import { getAuthenticatedMember, requireTeacher, requireInstructor } from "./permissions";

// Get assignments for a classroom
export const getAssignments = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const { userId, role } = await getAuthenticatedMember(ctx, args.classroomId);

    let assignments;
    if (role === "student") {
      // Students only see published assignments
      assignments = await ctx.db
        .query("assignments")
        .withIndex("classroom", (q) =>
          q.eq("classroomId", args.classroomId).eq("isPublished", true)
        )
        .collect();
    } else {
      // Teachers see all assignments
      assignments = await ctx.db
        .query("assignments")
        .withIndex("classroom", (q) => q.eq("classroomId", args.classroomId))
        .collect();
    }

    // Get submission counts and student's submission status for each assignment
    const assignmentsWithDetails = await Promise.all(
      assignments.map(async (assignment) => {
        const creator = await ctx.db.get(assignment.createdBy);

        // Get total submissions
        const totalSubmissions = await ctx.db
          .query("submissions")
          .withIndex("assignmentStudent", (q) => q.eq("assignmentId", assignment._id))
          .collect()
          .then(subs => subs.length);

        let studentSubmission = null;
        if (role === "student") {
          // Get student's submission status
          studentSubmission = await ctx.db
            .query("submissions")
            .withIndex("assignmentStudent", (q) =>
              q.eq("assignmentId", assignment._id).eq("studentId", userId)
            )
            .first();
        }

        return {
          ...assignment,
          creator: creator ? {
            _id: creator._id,
            name: creator.name,
          } : null,
          totalSubmissions,
          studentSubmission,
        };
      })
    );

    return assignmentsWithDetails.sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get a specific assignment
export const getAssignment = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const { userId, role } = await getAuthenticatedMember(ctx, assignment.classroomId);

    // Students can only see published assignments
    if (role === "student" && !assignment.isPublished) {
      throw new Error("Assignment not found");
    }

    const creator = await ctx.db.get(assignment.createdBy);

    // Get submission count
    const totalSubmissions = await ctx.db
      .query("submissions")
      .withIndex("assignmentStudent", (q) => q.eq("assignmentId", assignment._id))
      .collect()
      .then(subs => subs.length);

    let studentSubmission = null;
    if (role === "student") {
      // Get student's submission
      studentSubmission = await ctx.db
        .query("submissions")
        .withIndex("assignmentStudent", (q) =>
          q.eq("assignmentId", assignment._id).eq("studentId", userId)
        )
        .first();
    }

    return {
      ...assignment,
      creator: creator ? {
        _id: creator._id,
        name: creator.name,
      } : null,
      totalSubmissions,
      studentSubmission,
    };
  },
});

// Create a new assignment
export const createAssignment = mutation({
  args: {
    classroomId: v.id("classrooms"),
    title: v.string(),
    description: v.string(),
    instructions: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    totalPoints: v.number(),
    category: v.optional(v.string()),
    solutionFileId: v.optional(v.id("fileMetadata")),
    rubric: v.optional(v.object({
      criteria: v.array(v.object({
        name: v.string(),
        description: v.string(),
        points: v.number(),
      })),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, args.classroomId, userId);

    const now = Date.now();

    const assignmentId = await ctx.db.insert("assignments", {
      classroomId: args.classroomId,
      title: args.title,
      description: args.description,
      instructions: args.instructions,
      dueDate: args.dueDate,
      totalPoints: args.totalPoints,
      category: args.category,
      solutionFileId: args.solutionFileId,
      rubric: args.rubric,
      createdBy: userId,
      isPublished: false, // Start as draft
      acceptSubmissions: false,
      createdAt: now,
      updatedAt: now,
    });

    return assignmentId;
  },
});

// Update an existing assignment
export const updateAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    instructions: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    totalPoints: v.optional(v.number()),
    category: v.optional(v.string()),
    solutionFileId: v.optional(v.id("fileMetadata")),
    rubric: v.optional(v.object({
      criteria: v.array(v.object({
        name: v.string(),
        description: v.string(),
        points: v.number(),
      })),
    })),
    isPublished: v.optional(v.boolean()),
    acceptSubmissions: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, assignment.classroomId, userId);

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.instructions !== undefined) updates.instructions = args.instructions;
    if (args.dueDate !== undefined) updates.dueDate = args.dueDate;
    if (args.totalPoints !== undefined) updates.totalPoints = args.totalPoints;
    if (args.category !== undefined) updates.category = args.category;
    if (args.solutionFileId !== undefined) updates.solutionFileId = args.solutionFileId;
    if (args.rubric !== undefined) updates.rubric = args.rubric;
    if (args.isPublished !== undefined) updates.isPublished = args.isPublished;
    if (args.acceptSubmissions !== undefined) updates.acceptSubmissions = args.acceptSubmissions;

    await ctx.db.patch(args.assignmentId, updates);
  },
});

// Delete an assignment
export const deleteAssignment = mutation({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Only instructors can delete assignments (not TAs)
    await requireInstructor(ctx, assignment.classroomId, userId);

    // Get all submissions for this assignment
    const submissions = await ctx.db
      .query("submissions")
      .withIndex("assignmentStudent", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();

    // Delete all AI analyses for these submissions
    await Promise.all(
      submissions.map(async (submission) => {
        const analyses = await ctx.db
          .query("aiAnalyses")
          .withIndex("submission", (q) => q.eq("submissionId", submission._id))
          .collect();

        return Promise.all(
          analyses.map(analysis => ctx.db.delete(analysis._id))
        );
      })
    );

    // Delete all submissions
    await Promise.all(
      submissions.map(submission => ctx.db.delete(submission._id))
    );

    // Delete the assignment
    await ctx.db.delete(args.assignmentId);
  },
});

// Publish/unpublish an assignment
export const toggleAssignmentPublication = mutation({
  args: {
    assignmentId: v.id("assignments"),
    isPublished: v.boolean(),
  },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, assignment.classroomId, userId);

    await ctx.db.patch(args.assignmentId, {
      isPublished: args.isPublished,
      acceptSubmissions: args.isPublished, // Auto-enable submissions when publishing
      updatedAt: Date.now(),
    });
  },
});

// Get assignment submissions (for teachers)
export const getAssignmentSubmissions = query({
  args: { assignmentId: v.id("assignments") },
  handler: async (ctx, args) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, assignment.classroomId, userId);

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("assignmentStudent", (q) => q.eq("assignmentId", args.assignmentId))
      .collect();

    // Get student details and AI analysis for each submission
    const submissionsWithDetails = await Promise.all(
      submissions.map(async (submission) => {
        const student = await ctx.db.get(submission.studentId);

        // Get AI analysis if available
        const aiAnalysis = await ctx.db
          .query("aiAnalyses")
          .withIndex("submission", (q) => q.eq("submissionId", submission._id))
          .first();

        return {
          ...submission,
          student: student ? {
            _id: student._id,
            name: student.name,
            email: student.email,
          } : null,
          aiAnalysis,
        };
      })
    );

    return submissionsWithDetails.sort((a, b) => b.submittedAt - a.submittedAt);
  },
});

// Grade a submission
export const gradeSubmission = mutation({
  args: {
    submissionId: v.id("submissions"),
    pointsEarned: v.number(),
    teacherFeedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const assignment = await ctx.db.get(submission.assignmentId);
    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, submission.classroomId, userId);

    // Validate points are within assignment total
    if (args.pointsEarned > assignment.totalPoints) {
      throw new Error(`Points earned cannot exceed assignment total (${assignment.totalPoints})`);
    }

    await ctx.db.patch(args.submissionId, {
      pointsEarned: args.pointsEarned,
      teacherFeedback: args.teacherFeedback,
      gradedBy: userId,
      gradedAt: Date.now(),
      status: "graded",
    });
  },
});

// Return graded assignment to student
export const returnSubmission = mutation({
  args: { submissionId: v.id("submissions") },
  handler: async (ctx, args) => {
    const submission = await ctx.db.get(args.submissionId);
    if (!submission) {
      throw new Error("Submission not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, submission.classroomId, userId);

    if (submission.status !== "graded") {
      throw new Error("Submission must be graded before returning");
    }

    await ctx.db.patch(args.submissionId, {
      status: "returned",
    });
  },
});