import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { auth } from "./auth";
import { getAuthenticatedMember, requireTeacher } from "./permissions";

// Generate upload URL for file
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    return await ctx.storage.generateUploadUrl();
  },
});

// Store file metadata after upload
export const storeFileMetadata = mutation({
  args: {
    storageId: v.id("_storage"),
    fileName: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),
    purpose: v.union(
      v.literal("solution"),
      v.literal("submission"),
      v.literal("resource"),
      v.literal("rubric")
    ),
    classroomId: v.optional(v.id("classrooms")),
    assignmentId: v.optional(v.id("assignments")),
    submissionId: v.optional(v.id("submissions")),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify access to classroom if specified
    if (args.classroomId) {
      await getAuthenticatedMember(ctx, args.classroomId);
    }

    const now = Date.now();

    const fileMetadataId = await ctx.db.insert("fileMetadata", {
      storageId: args.storageId,
      fileName: args.fileName,
      mimeType: args.mimeType,
      sizeBytes: args.sizeBytes,
      uploadedBy: userId,
      uploadedAt: now,
      purpose: args.purpose,
      classroomId: args.classroomId,
      assignmentId: args.assignmentId,
      submissionId: args.submissionId,
      processingStatus: "pending",
    });

    return fileMetadataId;
  },
});

// Get file metadata
export const getFileMetadata = query({
  args: { fileMetadataId: v.id("fileMetadata") },
  handler: async (ctx, args) => {
    const fileMetadata = await ctx.db.get(args.fileMetadataId);
    if (!fileMetadata) {
      throw new Error("File metadata not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check access permissions
    if (fileMetadata.classroomId) {
      const { role } = await getAuthenticatedMember(ctx, fileMetadata.classroomId);

      // For submissions, students can only access their own files
      if (fileMetadata.purpose === "submission" && role === "student") {
        if (fileMetadata.uploadedBy !== userId) {
          throw new Error("Not authorized to access this file");
        }
      }
    } else if (fileMetadata.uploadedBy !== userId) {
      // For files without classroom context, only uploader can access
      throw new Error("Not authorized to access this file");
    }

    const uploader = await ctx.db.get(fileMetadata.uploadedBy);

    return {
      ...fileMetadata,
      uploader: uploader ? {
        _id: uploader._id,
        name: uploader.name,
      } : null,
    };
  },
});

// Get file download URL
export const getFileUrl = query({
  args: { fileMetadataId: v.id("fileMetadata") },
  handler: async (ctx, args) => {
    const fileMetadata = await ctx.db.get(args.fileMetadataId);
    if (!fileMetadata) {
      throw new Error("File metadata not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check access permissions
    if (fileMetadata.classroomId) {
      const { role } = await getAuthenticatedMember(ctx, fileMetadata.classroomId);

      // For submissions, students can only access their own files
      if (fileMetadata.purpose === "submission" && role === "student") {
        if (fileMetadata.uploadedBy !== userId) {
          throw new Error("Not authorized to access this file");
        }
      }
    } else if (fileMetadata.uploadedBy !== userId) {
      // For files without classroom context, only uploader can access
      throw new Error("Not authorized to access this file");
    }

    const url = await ctx.storage.getUrl(fileMetadata.storageId);

    return {
      url,
      fileName: fileMetadata.fileName,
      mimeType: fileMetadata.mimeType,
      sizeBytes: fileMetadata.sizeBytes,
    };
  },
});

// Get files by purpose for a classroom
export const getClassroomFiles = query({
  args: {
    classroomId: v.id("classrooms"),
    purpose: v.optional(v.union(
      v.literal("solution"),
      v.literal("submission"),
      v.literal("resource"),
      v.literal("rubric")
    )),
  },
  handler: async (ctx, args) => {
    const { role } = await getAuthenticatedMember(ctx, args.classroomId);

    let files = await ctx.db
      .query("fileMetadata")
      .withIndex("purpose", (q) => q.eq("purpose", args.purpose || "resource"))
      .filter((q) => q.eq(q.field("classroomId"), args.classroomId))
      .collect();

    // Students can only see resource files and their own submissions
    if (role === "student") {
      const userId = await auth.getUserId(ctx);
      files = files.filter(file =>
        file.purpose === "resource" ||
        (file.purpose === "submission" && file.uploadedBy === userId)
      );
    }

    // Get uploader details for each file
    const filesWithDetails = await Promise.all(
      files.map(async (file) => {
        const uploader = await ctx.db.get(file.uploadedBy);

        return {
          ...file,
          uploader: uploader ? {
            _id: uploader._id,
            name: uploader.name,
          } : null,
        };
      })
    );

    return filesWithDetails.sort((a, b) => b.uploadedAt - a.uploadedAt);
  },
});

// Get files uploaded by user
export const getUserFiles = query({
  args: {
    classroomId: v.optional(v.id("classrooms")),
    purpose: v.optional(v.union(
      v.literal("solution"),
      v.literal("submission"),
      v.literal("resource"),
      v.literal("rubric")
    )),
  },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Verify classroom access if specified
    if (args.classroomId) {
      await getAuthenticatedMember(ctx, args.classroomId);
    }

    let files = await ctx.db
      .query("fileMetadata")
      .withIndex("uploadedBy", (q) => q.eq("uploadedBy", userId))
      .collect();

    // Filter by classroom and purpose if specified
    if (args.classroomId) {
      files = files.filter(file => file.classroomId === args.classroomId);
    }

    if (args.purpose) {
      files = files.filter(file => file.purpose === args.purpose);
    }

    return files.sort((a, b) => b.uploadedAt - a.uploadedAt);
  },
});

// Update file processing status
export const updateProcessingStatus = mutation({
  args: {
    fileMetadataId: v.id("fileMetadata"),
    status: v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    ),
  },
  handler: async (ctx, args) => {
    const fileMetadata = await ctx.db.get(args.fileMetadataId);
    if (!fileMetadata) {
      throw new Error("File metadata not found");
    }

    await ctx.db.patch(args.fileMetadataId, {
      processingStatus: args.status,
    });
  },
});

// Delete file and metadata
export const deleteFile = mutation({
  args: { fileMetadataId: v.id("fileMetadata") },
  handler: async (ctx, args) => {
    const fileMetadata = await ctx.db.get(args.fileMetadataId);
    if (!fileMetadata) {
      throw new Error("File metadata not found");
    }

    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Check permissions
    if (fileMetadata.classroomId) {
      const { role } = await getAuthenticatedMember(ctx, fileMetadata.classroomId);

      // Only file uploader or teachers can delete files
      if (fileMetadata.uploadedBy !== userId && role === "student") {
        throw new Error("Not authorized to delete this file");
      }

      // For teacher/solution files, only teachers can delete
      if ((fileMetadata.purpose === "solution" || fileMetadata.purpose === "rubric") && role === "student") {
        throw new Error("Not authorized to delete this file");
      }
    } else if (fileMetadata.uploadedBy !== userId) {
      throw new Error("Not authorized to delete this file");
    }

    // Delete from storage
    await ctx.storage.delete(fileMetadata.storageId);

    // Delete metadata
    await ctx.db.delete(args.fileMetadataId);
  },
});

// Get file statistics for classroom
export const getFileStats = query({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, args.classroomId, userId);

    const files = await ctx.db
      .query("fileMetadata")
      .withIndex("purpose", (q) => q.eq("purpose", "resource"))
      .filter((q) => q.eq(q.field("classroomId"), args.classroomId))
      .collect();

    const stats = {
      totalFiles: files.length,
      totalSize: files.reduce((sum, file) => sum + file.sizeBytes, 0),
      byPurpose: {
        solution: files.filter(f => f.purpose === "solution").length,
        submission: files.filter(f => f.purpose === "submission").length,
        resource: files.filter(f => f.purpose === "resource").length,
        rubric: files.filter(f => f.purpose === "rubric").length,
      },
      byStatus: {
        pending: files.filter(f => f.processingStatus === "pending").length,
        processing: files.filter(f => f.processingStatus === "processing").length,
        completed: files.filter(f => f.processingStatus === "completed").length,
        failed: files.filter(f => f.processingStatus === "failed").length,
      },
    };

    return stats;
  },
});

// Clean up orphaned files (files without associated records)
export const cleanupOrphanedFiles = mutation({
  args: { classroomId: v.id("classrooms") },
  handler: async (ctx, args) => {
    const userId = await auth.getUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await requireTeacher(ctx, args.classroomId, userId);

    const files = await ctx.db
      .query("fileMetadata")
      .filter((q) => q.eq(q.field("classroomId"), args.classroomId))
      .collect();

    let deletedCount = 0;

    for (const file of files) {
      let shouldDelete = false;

      // Check if associated records still exist
      if (file.assignmentId) {
        const assignment = await ctx.db.get(file.assignmentId);
        if (!assignment) shouldDelete = true;
      }

      if (file.submissionId) {
        const submission = await ctx.db.get(file.submissionId);
        if (!submission) shouldDelete = true;
      }

      if (shouldDelete) {
        await ctx.storage.delete(file.storageId);
        await ctx.db.delete(file._id);
        deletedCount++;
      }
    }

    return { deletedCount };
  },
});