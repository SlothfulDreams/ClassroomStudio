import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";

// Get all classrooms for the current user
export const getUserClassroom = query({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get user's classroom memberships
    const memberships = await ctx.db
      .query("classroomMembers")
      .withIndex("userClassrooms", (q) =>
        q.eq("userId", userId).eq("status", "active"),
      )
      .collect();

    // Get classroom details for each membership
    const classrooms = await Promise.all(
      memberships.map(async (membership) => {
        const classroom = await ctx.db.get(membership.classroomId);
        if (!classroom) return null;

        // Count total members
        const memberCount = await ctx.db
          .query("classroomMembers")
          .withIndex("classroomUser", (q) => q.eq("classroomId", classroom._id))
          .filter((q) => q.eq(q.field("status"), "active"))
          .collect();

        return {
          ...classroom,
          userRole: membership.role,
          memberCount: memberCount.length,
          joinedAt: membership.joinedAt,
        };
      }),
    );

    return classrooms.filter(Boolean);
  },
});

// Create a new classroom
export const createClassroom = mutation({
  args: {
    name: v.string(),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Generate unique join code
    const generateJoinCode = () => {
      const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"; // Excluding O and 0
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let joinCode = generateJoinCode();

    // Ensure join code is unique
    while (
      await ctx.db
        .query("classrooms")
        .withIndex("joinCode", (q) => q.eq("joinCode", joinCode))
        .first()
    ) {
      joinCode = generateJoinCode();
    }

    const now = Date.now();

    // Create classroom
    const classroomId = await ctx.db.insert("classrooms", {
      name: args.name,
      description: args.description,
      subject: args.subject,
      creatorId: userId,
      joinCode,
      isActive: true,
      settings: {
        allowLateSubmissions: true,
        autoReleaseGrades: false,
        requireApprovalToJoin: false,
      },
      createdAt: now,
      updatedAt: now,
    });

    // Add creator as instructor
    await ctx.db.insert("classroomMembers", {
      classroomId,
      userId,
      role: "instructor",
      status: "active",
      joinedAt: now,
      addedBy: userId,
      lastActivityAt: now,
    });

    return classroomId;
  },
});

// Join a classroom using join code
export const joinClassroom = mutation({
  args: {
    joinCode: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Find classroom by join code
    const classroom = await ctx.db
      .query("classrooms")
      .withIndex("joinCode", (q) =>
        q.eq("joinCode", args.joinCode.toUpperCase()),
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    if (!classroom) {
      throw new Error("Invalid join code or classroom not found");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("classroomMembers")
      .withIndex("classroomUser", (q) =>
        q.eq("classroomId", classroom._id).eq("userId", userId),
      )
      .first();

    if (existingMembership) {
      if (existingMembership.status === "active") {
        throw new Error("You are already a member of this classroom");
      } else if (
        existingMembership.status === "removed" ||
        existingMembership.status === "blocked"
      ) {
        throw new Error("You cannot rejoin this classroom");
      }
    }

    const now = Date.now();

    // Add user as student
    await ctx.db.insert("classroomMembers", {
      classroomId: classroom._id,
      userId,
      role: "student",
      status: classroom.settings?.requireApprovalToJoin ? "pending" : "active",
      joinedAt: now,
      addedBy: userId, // Self-joined
      lastActivityAt: now,
    });

    return {
      classroomId: classroom._id,
      status: classroom.settings?.requireApprovalToJoin ? "pending" : "active",
    };
  },
});

// Get classroom details by ID
export const getClassroom = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) {
      throw new Error("Classroom not found");
    }

    // Check if user is a member
    const membership = await ctx.db
      .query("classroomMembers")
      .withIndex("classroomUser", (q) =>
        q.eq("classroomId", args.classroomId).eq("userId", userId),
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (!membership) {
      throw new Error("Not authorized to view this classroom");
    }

    // Get all members
    const members = await ctx.db
      .query("classroomMembers")
      .withIndex("classroomUser", (q) => q.eq("classroomId", args.classroomId))
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get creator details
    const creator = await ctx.db.get(classroom.creatorId);

    return {
      ...classroom,
      userRole: membership.role,
      memberCount: members.length,
      members,
      creator: creator ? {
        _id: creator._id,
        name: creator.name,
      } : null,
    };
  },
});

// Update classroom settings
export const updateClassroomSettings = mutation({
  args: {
    classroomId: v.id("classrooms"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    settings: v.optional(v.object({
      allowLateSubmissions: v.boolean(),
      autoReleaseGrades: v.boolean(),
      requireApprovalToJoin: v.boolean(),
    })),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Only instructors can update classroom settings
    const { requireInstructor } = await import("./permissions");
    await requireInstructor(ctx, args.classroomId, userId);

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.name !== undefined) updates.name = args.name;
    if (args.description !== undefined) updates.description = args.description;
    if (args.subject !== undefined) updates.subject = args.subject;
    if (args.settings !== undefined) updates.settings = args.settings;

    await ctx.db.patch(args.classroomId, updates);
  },
});

// Generate new join code
export const regenerateJoinCode = mutation({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Only instructors can regenerate join codes
    const { requireInstructor } = await import("./permissions");
    await requireInstructor(ctx, args.classroomId, userId);

    // Generate unique join code
    const generateJoinCode = () => {
      const chars = "ABCDEFGHIJKLMNPQRSTUVWXYZ123456789"; // Excluding O and 0
      let code = "";
      for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      return code;
    };

    let joinCode = generateJoinCode();

    // Ensure join code is unique
    while (
      await ctx.db
        .query("classrooms")
        .withIndex("joinCode", (q) => q.eq("joinCode", joinCode))
        .first()
    ) {
      joinCode = generateJoinCode();
    }

    await ctx.db.patch(args.classroomId, {
      joinCode,
      updatedAt: Date.now(),
    });

    return joinCode;
  },
});

// Archive classroom
export const archiveClassroom = mutation({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Only instructors can archive classrooms
    const { requireInstructor } = await import("./permissions");
    await requireInstructor(ctx, args.classroomId, userId);

    await ctx.db.patch(args.classroomId, {
      isActive: false,
      updatedAt: Date.now(),
    });
  },
});

// Delete classroom (permanent)
export const deleteClassroom = mutation({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const classroom = await ctx.db.get(args.classroomId);
    if (!classroom) {
      throw new Error("Classroom not found");
    }

    // Only the creator can delete the classroom
    if (classroom.creatorId !== userId) {
      throw new Error("Only the classroom creator can delete the classroom");
    }

    // Get all related data to delete
    const assignments = await ctx.db
      .query("assignments")
      .withIndex("classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    const submissions = await ctx.db
      .query("submissions")
      .withIndex("classroomSubmissions", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    const announcements = await ctx.db
      .query("announcements")
      .withIndex("classroom", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    const members = await ctx.db
      .query("classroomMembers")
      .withIndex("classroomUser", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    // Delete all AI analyses for submissions
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

    // Delete all announcement comments
    await Promise.all(
      announcements.map(async (announcement) => {
        const comments = await ctx.db
          .query("announcementComments")
          .withIndex("announcement", (q) => q.eq("announcementId", announcement._id))
          .collect();

        return Promise.all(
          comments.map(comment => ctx.db.delete(comment._id))
        );
      })
    );

    // Delete all file metadata and files
    const files = await ctx.db
      .query("fileMetadata")
      .filter((q) => q.eq(q.field("classroomId"), args.classroomId))
      .collect();

    await Promise.all(
      files.map(async (file) => {
        await ctx.storage.delete(file.storageId);
        await ctx.db.delete(file._id);
      })
    );

    // Delete all submissions
    await Promise.all(submissions.map(submission => ctx.db.delete(submission._id)));

    // Delete all assignments
    await Promise.all(assignments.map(assignment => ctx.db.delete(assignment._id)));

    // Delete all announcements
    await Promise.all(announcements.map(announcement => ctx.db.delete(announcement._id)));

    // Delete all memberships
    await Promise.all(members.map(member => ctx.db.delete(member._id)));

    // Finally, delete the classroom
    await ctx.db.delete(args.classroomId);
  },
});

// Get classroom statistics (for teachers)
export const getClassroomStats = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const { requireTeacher } = await import("./permissions");
    await requireTeacher(ctx, args.classroomId, userId);

    // Get counts for various entities
    const [assignments, submissions, announcements, members] = await Promise.all([
      ctx.db
        .query("assignments")
        .withIndex("classroom", (q) => q.eq("classroomId", args.classroomId))
        .collect(),
      ctx.db
        .query("submissions")
        .withIndex("classroomSubmissions", (q) => q.eq("classroomId", args.classroomId))
        .collect(),
      ctx.db
        .query("announcements")
        .withIndex("classroom", (q) => q.eq("classroomId", args.classroomId))
        .collect(),
      ctx.db
        .query("classroomMembers")
        .withIndex("classroomUser", (q) => q.eq("classroomId", args.classroomId))
        .filter((q) => q.eq(q.field("status"), "active"))
        .collect(),
    ]);

    // Calculate additional statistics
    const publishedAssignments = assignments.filter(a => a.isPublished);
    const gradedSubmissions = submissions.filter(s => s.status === "graded" || s.status === "returned");
    const students = members.filter(m => m.role === "student");

    const stats = {
      totalAssignments: assignments.length,
      publishedAssignments: publishedAssignments.length,
      totalSubmissions: submissions.length,
      gradedSubmissions: gradedSubmissions.length,
      totalAnnouncements: announcements.length,
      totalMembers: members.length,
      studentCount: students.length,
      teacherCount: members.filter(m => m.role === "instructor" || m.role === "ta").length,
      averageGrade: gradedSubmissions.length > 0
        ? gradedSubmissions.reduce((sum, s) => sum + (s.pointsEarned || 0), 0) / gradedSubmissions.length
        : 0,
      submissionRate: publishedAssignments.length > 0 && students.length > 0
        ? (submissions.length / (publishedAssignments.length * students.length)) * 100
        : 0,
    };

    return stats;
  },
});
