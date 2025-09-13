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

    return {
      ...classroom,
      userRole: membership.role,
      memberCount: members.length,
      members,
    };
  },
});
