import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";
import { getAuthenticatedMember, requireTeacher } from "./permissions";

// Get announcements for a classroom
export const getAnnouncements = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const { userId } = await getAuthenticatedMember(ctx, args.classroomId);

    // Get all announcements, pinned first
    const announcements = await ctx.db
      .query("announcements")
      .withIndex("classroom", (q) => q.eq("classroomId", args.classroomId))
      .filter((q) =>
        q.or(
          q.eq(q.field("scheduledFor"), undefined),
          q.lte(q.field("scheduledFor"), Date.now())
        )
      )
      .collect();

    // Sort by pinned first, then by creation date descending
    const sortedAnnouncements = announcements.sort((a, b) => {
      if (a.isPinned && !b.isPinned) return -1;
      if (!a.isPinned && b.isPinned) return 1;
      return b.createdAt - a.createdAt;
    });

    // Get author details and comment counts for each announcement
    const announcementsWithDetails = await Promise.all(
      sortedAnnouncements.map(async (announcement) => {
        const author = await ctx.db.get(announcement.authorId);
        if (!author) return null;

        // Get comment count
        const commentCount = await ctx.db
          .query("announcementComments")
          .withIndex("announcement", (q) => q.eq("announcementId", announcement._id))
          .collect()
          .then(comments => comments.length);

        return {
          ...announcement,
          author: {
            _id: author._id,
            name: author.name,
            email: author.email,
          },
          commentCount,
        };
      })
    );

    return announcementsWithDetails.filter(Boolean);
  },
});

// Create a new announcement
export const createAnnouncement = mutation({
  args: {
    classroomId: v.id("classrooms"),
    content: v.string(),
    isPinned: v.optional(v.boolean()),
    scheduledFor: v.optional(v.number()),
    attachmentIds: v.optional(v.array(v.id("fileMetadata"))),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, args.classroomId, userId);

    const now = Date.now();

    const announcementId = await ctx.db.insert("announcements", {
      classroomId: args.classroomId,
      authorId: userId,
      content: args.content,
      isPinned: args.isPinned ?? false,
      scheduledFor: args.scheduledFor,
      attachmentIds: args.attachmentIds,
      createdAt: now,
      updatedAt: now,
    });

    return announcementId;
  },
});

// Update an existing announcement
export const updateAnnouncement = mutation({
  args: {
    announcementId: v.id("announcements"),
    content: v.optional(v.string()),
    isPinned: v.optional(v.boolean()),
    scheduledFor: v.optional(v.number()),
    attachmentIds: v.optional(v.array(v.id("fileMetadata"))),
  },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) {
      throw new Error("Announcement not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Only teachers can edit announcements, or the original author
    if (announcement.authorId !== userId) {
      await requireTeacher(ctx, announcement.classroomId, userId);
    }

    const updates: any = {
      updatedAt: Date.now(),
    };

    if (args.content !== undefined) updates.content = args.content;
    if (args.isPinned !== undefined) updates.isPinned = args.isPinned;
    if (args.scheduledFor !== undefined) updates.scheduledFor = args.scheduledFor;
    if (args.attachmentIds !== undefined) updates.attachmentIds = args.attachmentIds;

    await ctx.db.patch(args.announcementId, updates);
  },
});

// Delete an announcement
export const deleteAnnouncement = mutation({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) {
      throw new Error("Announcement not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Only teachers can delete announcements, or the original author
    if (announcement.authorId !== userId) {
      await requireTeacher(ctx, announcement.classroomId, userId);
    }

    // Delete all comments first
    const comments = await ctx.db
      .query("announcementComments")
      .withIndex("announcement", (q) => q.eq("announcementId", args.announcementId))
      .collect();

    await Promise.all(
      comments.map(comment => ctx.db.delete(comment._id))
    );

    // Delete the announcement
    await ctx.db.delete(args.announcementId);
  },
});

// Get comments for an announcement
export const getAnnouncementComments = query({
  args: { announcementId: v.id("announcements") },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) {
      throw new Error("Announcement not found");
    }

    // Verify user has access to the classroom
    await getAuthenticatedMember(ctx, announcement.classroomId);

    const comments = await ctx.db
      .query("announcementComments")
      .withIndex("announcement", (q) => q.eq("announcementId", args.announcementId))
      .collect();

    // Get author details for each comment
    const commentsWithAuthors = await Promise.all(
      comments.map(async (comment) => {
        const author = await ctx.db.get(comment.authorId);
        if (!author) return null;

        return {
          ...comment,
          author: {
            _id: author._id,
            name: author.name,
            email: author.email,
          },
        };
      })
    );

    // Sort by creation date ascending and filter out null values
    return commentsWithAuthors
      .filter(Boolean)
      .sort((a, b) => a!.createdAt - b!.createdAt);
  },
});

// Add a comment to an announcement
export const addComment = mutation({
  args: {
    announcementId: v.id("announcements"),
    content: v.string(),
    parentCommentId: v.optional(v.id("announcementComments")),
  },
  handler: async (ctx, args) => {
    const announcement = await ctx.db.get(args.announcementId);
    if (!announcement) {
      throw new Error("Announcement not found");
    }

    const { userId } = await getAuthenticatedMember(ctx, announcement.classroomId);

    // If replying to a comment, verify the parent comment exists
    if (args.parentCommentId) {
      const parentComment = await ctx.db.get(args.parentCommentId);
      if (!parentComment || parentComment.announcementId !== args.announcementId) {
        throw new Error("Parent comment not found");
      }
    }

    const now = Date.now();

    const commentId = await ctx.db.insert("announcementComments", {
      announcementId: args.announcementId,
      classroomId: announcement.classroomId,
      authorId: userId,
      content: args.content,
      parentCommentId: args.parentCommentId,
      createdAt: now,
      updatedAt: now,
    });

    return commentId;
  },
});

// Update a comment
export const updateComment = mutation({
  args: {
    commentId: v.id("announcementComments"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Only the author can edit their comment
    if (comment.authorId !== userId) {
      throw new Error("Not authorized to edit this comment");
    }

    await ctx.db.patch(args.commentId, {
      content: args.content,
      updatedAt: Date.now(),
    });
  },
});

// Delete a comment
export const deleteComment = mutation({
  args: { commentId: v.id("announcementComments") },
  handler: async (ctx, args) => {
    const comment = await ctx.db.get(args.commentId);
    if (!comment) {
      throw new Error("Comment not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Only the author or teachers can delete comments
    if (comment.authorId !== userId) {
      await requireTeacher(ctx, comment.classroomId, userId);
    }

    // Delete all reply comments first
    const replies = await ctx.db
      .query("announcementComments")
      .withIndex("replies", (q) => q.eq("parentCommentId", args.commentId))
      .collect();

    await Promise.all(
      replies.map(reply => ctx.db.delete(reply._id))
    );

    // Delete the comment
    await ctx.db.delete(args.commentId);
  },
});