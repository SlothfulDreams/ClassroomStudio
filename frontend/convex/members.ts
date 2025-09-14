import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";
import { getAuthenticatedMember, requireTeacher, requireInstructor } from "./permissions";

// Get all members of a classroom
export const getClassroomMembers = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    await getAuthenticatedMember(ctx, args.classroomId);

    const memberships = await ctx.db
      .query("classroomMembers")
      .withIndex("classroomUser", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;

        const addedByUser = await ctx.db.get(membership.addedBy);

        return {
          ...membership,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
          addedBy: addedByUser ? {
            _id: addedByUser._id,
            name: addedByUser.name,
          } : null,
        };
      })
    );

    // Filter out null values and sort by role (instructors, TAs, students) then by name
    return membersWithDetails
      .filter(Boolean)
      .sort((a, b) => {
        const roleOrder = { instructor: 0, ta: 1, student: 2 };
        const roleComparison = roleOrder[a!.role] - roleOrder[b!.role];
        if (roleComparison !== 0) return roleComparison;
        return (a!.user?.name || "").localeCompare(b!.user?.name || "");
      });
  },
});

// Get members by role
export const getMembersByRole = query({
  args: {
    classroomId: v.id("classrooms"),
    role: v.union(v.literal("instructor"), v.literal("ta"), v.literal("student")),
  },
  handler: async (ctx, args) => {
    await getAuthenticatedMember(ctx, args.classroomId);

    const memberships = await ctx.db
      .query("classroomMembers")
      .withIndex("classroomRole", (q) =>
        q.eq("classroomId", args.classroomId).eq("role", args.role)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .collect();

    // Get user details for each member
    const membersWithDetails = await Promise.all(
      memberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;

        return {
          ...membership,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
        };
      })
    );

    return membersWithDetails
      .filter(Boolean)
      .sort((a, b) => (a!.user?.name || "").localeCompare(b!.user?.name || ""));
  },
});

// Get pending members (awaiting approval)
export const getPendingMembers = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, args.classroomId, userId);

    const pendingMemberships = await ctx.db
      .query("classroomMembers")
      .withIndex("userClassrooms", (q) =>
        q.eq("userId", userId).eq("status", "pending")
      )
      .filter((q) => q.eq(q.field("classroomId"), args.classroomId))
      .collect();

    // Get user details for each pending member
    const pendingWithDetails = await Promise.all(
      pendingMemberships.map(async (membership) => {
        const user = await ctx.db.get(membership.userId);
        if (!user) return null;

        return {
          ...membership,
          user: {
            _id: user._id,
            name: user.name,
            email: user.email,
          },
        };
      })
    );

    return pendingWithDetails
      .filter(Boolean)
      .sort((a, b) => b!.joinedAt - a!.joinedAt);
  },
});

// Approve pending member
export const approveMember = mutation({
  args: { membershipId: v.id("classroomMembers") },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, membership.classroomId, userId);

    if (membership.status !== "pending") {
      throw new Error("Member is not pending approval");
    }

    await ctx.db.patch(args.membershipId, {
      status: "active",
      lastActivityAt: Date.now(),
    });
  },
});

// Reject pending member
export const rejectMember = mutation({
  args: { membershipId: v.id("classroomMembers") },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, membership.classroomId, userId);

    if (membership.status !== "pending") {
      throw new Error("Member is not pending approval");
    }

    // Remove the membership entirely
    await ctx.db.delete(args.membershipId);
  },
});

// Add member by email (invite)
export const inviteMemberByEmail = mutation({
  args: {
    classroomId: v.id("classrooms"),
    email: v.string(),
    role: v.union(v.literal("instructor"), v.literal("ta"), v.literal("student")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, args.classroomId, userId);

    // Only instructors can add other instructors or TAs
    if ((args.role === "instructor" || args.role === "ta")) {
      await requireInstructor(ctx, args.classroomId, userId);
    }

    // Find user by email
    const targetUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("email"), args.email))
      .first();

    if (!targetUser) {
      throw new Error("User with this email not found");
    }

    // Check if user is already a member
    const existingMembership = await ctx.db
      .query("classroomMembers")
      .withIndex("classroomUser", (q) =>
        q.eq("classroomId", args.classroomId).eq("userId", targetUser._id)
      )
      .first();

    if (existingMembership) {
      if (existingMembership.status === "active") {
        throw new Error("User is already a member of this classroom");
      } else if (existingMembership.status === "pending") {
        throw new Error("User already has a pending invitation");
      } else {
        throw new Error("User cannot be re-invited to this classroom");
      }
    }

    const now = Date.now();

    // Add as active member (invited by teacher)
    const membershipId = await ctx.db.insert("classroomMembers", {
      classroomId: args.classroomId,
      userId: targetUser._id,
      role: args.role,
      status: "active",
      joinedAt: now,
      addedBy: userId,
      lastActivityAt: now,
    });

    return membershipId;
  },
});

// Remove member from classroom
export const removeMember = mutation({
  args: { membershipId: v.id("classroomMembers") },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check if user is removing themselves
    if (membership.userId === userId) {
      // Members can remove themselves (leave classroom)
      await getAuthenticatedMember(ctx, membership.classroomId);
    } else {
      // Only teachers can remove others
      await requireTeacher(ctx, membership.classroomId, userId);

      // Only instructors can remove other instructors or TAs
      if (membership.role === "instructor" || membership.role === "ta") {
        await requireInstructor(ctx, membership.classroomId, userId);
      }
    }

    await ctx.db.patch(args.membershipId, {
      status: "removed",
    });
  },
});

// Change member role
export const changeMemberRole = mutation({
  args: {
    membershipId: v.id("classroomMembers"),
    newRole: v.union(v.literal("instructor"), v.literal("ta"), v.literal("student")),
  },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Only instructors can change roles
    await requireInstructor(ctx, membership.classroomId, userId);

    if (membership.status !== "active") {
      throw new Error("Can only change role of active members");
    }

    await ctx.db.patch(args.membershipId, {
      role: args.newRole,
    });
  },
});

// Block member (more severe than remove)
export const blockMember = mutation({
  args: { membershipId: v.id("classroomMembers") },
  handler: async (ctx, args) => {
    const membership = await ctx.db.get(args.membershipId);
    if (!membership) {
      throw new Error("Membership not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Only instructors can block members
    await requireInstructor(ctx, membership.classroomId, userId);

    // Cannot block other instructors
    if (membership.role === "instructor") {
      throw new Error("Cannot block other instructors");
    }

    await ctx.db.patch(args.membershipId, {
      status: "blocked",
    });
  },
});

// Update member's last activity
export const updateLastActivity = mutation({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const membership = await ctx.db
      .query("classroomMembers")
      .withIndex("classroomUser", (q) =>
        q.eq("classroomId", args.classroomId).eq("userId", userId)
      )
      .filter((q) => q.eq(q.field("status"), "active"))
      .first();

    if (membership) {
      await ctx.db.patch(membership._id, {
        lastActivityAt: Date.now(),
      });
    }
  },
});

// Get member statistics
export const getMemberStats = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    await getAuthenticatedMember(ctx, args.classroomId);

    const memberships = await ctx.db
      .query("classroomMembers")
      .withIndex("classroomUser", (q) => q.eq("classroomId", args.classroomId))
      .collect();

    const stats = {
      total: memberships.length,
      active: memberships.filter(m => m.status === "active").length,
      pending: memberships.filter(m => m.status === "pending").length,
      instructors: memberships.filter(m => m.role === "instructor" && m.status === "active").length,
      tas: memberships.filter(m => m.role === "ta" && m.status === "active").length,
      students: memberships.filter(m => m.role === "student" && m.status === "active").length,
    };

    return stats;
  },
});