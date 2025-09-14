import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";

const schema = defineSchema({
  ...authTables,

  // Classroom management
  classrooms: defineTable({
    name: v.string(),
    description: v.optional(v.string()),
    subject: v.optional(v.string()),
    creatorId: v.id("users"), // Who created the classroom
    joinCode: v.string(), // Unique 6-8 character code
    isActive: v.boolean(),
    settings: v.optional(v.object({
      allowLateSubmissions: v.boolean(),
      autoReleaseGrades: v.boolean(),
      requireApprovalToJoin: v.boolean(),
    })),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("creatorId", ["creatorId"])
    .index("joinCode", ["joinCode"]) // For quick join lookups
    .index("isActive", ["isActive"]),

  // Junction table for many-to-many relationship
  classroomMembers: defineTable({
    classroomId: v.id("classrooms"),
    userId: v.id("users"),
    role: v.union(
      v.literal("instructor"),    // Full permissions
      v.literal("ta"),            // Teaching assistant
      v.literal("student")        // Student permissions
    ),
    status: v.union(
      v.literal("active"),
      v.literal("pending"),       // Awaiting approval
      v.literal("removed"),       // Removed from class
      v.literal("blocked")        // Blocked from class
    ),
    joinedAt: v.number(),
    addedBy: v.id("users"),      // Who added this member
    lastActivityAt: v.optional(v.number()),
  })
    .index("classroomUser", ["classroomId", "userId"])
    .index("userClassrooms", ["userId", "status"])
    .index("classroomRole", ["classroomId", "role"]),

  // Assignments
  assignments: defineTable({
    classroomId: v.id("classrooms"),
    title: v.string(),
    description: v.string(),
    instructions: v.optional(v.string()),
    dueDate: v.optional(v.number()),
    totalPoints: v.number(),
    category: v.optional(v.string()), // homework, quiz, exam, etc.

    // Teacher's solution for AI comparison
    solutionFileId: v.optional(v.id("fileMetadata")),
    rubric: v.optional(v.object({
      criteria: v.array(v.object({
        name: v.string(),
        description: v.string(),
        points: v.number(),
      })),
    })),

    createdBy: v.id("users"),
    isPublished: v.boolean(),
    acceptSubmissions: v.boolean(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("classroom", ["classroomId", "isPublished"])
    .index("dueDate", ["dueDate"]),

  // Student submissions
  submissions: defineTable({
    assignmentId: v.id("assignments"),
    studentId: v.id("users"),
    classroomId: v.id("classrooms"), // Denormalized for easier queries

    // File storage
    fileId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),

    // Submission metadata
    submittedAt: v.number(),
    isLate: v.boolean(),
    attemptNumber: v.number(), // Support multiple attempts

    // Processing status
    status: v.union(
      v.literal("draft"),
      v.literal("submitted"),
      v.literal("analyzing"),    // AI processing
      v.literal("analyzed"),      // AI complete
      v.literal("graded"),       // Teacher reviewed
      v.literal("returned")      // Returned to student
    ),

    // Grading
    pointsEarned: v.optional(v.number()),
    teacherFeedback: v.optional(v.string()),
    gradedBy: v.optional(v.id("users")),
    gradedAt: v.optional(v.number()),
  })
    .index("assignmentStudent", ["assignmentId", "studentId"])
    .index("studentSubmissions", ["studentId", "status"])
    .index("classroomSubmissions", ["classroomId", "submittedAt"]),

  // AI analysis results
  aiAnalyses: defineTable({
    submissionId: v.id("submissions"),

    // Analysis results from LangChain
    overallScore: v.optional(v.number()), // 0-100
    confidence: v.number(), // AI confidence level

    // Identified weaknesses
    weaknesses: v.array(v.object({
      category: v.string(), // conceptual, syntax, logic, etc.
      description: v.string(),
      severity: v.union(
        v.literal("minor"),
        v.literal("moderate"),
        v.literal("major"),
        v.literal("critical")
      ),
      location: v.optional(v.string()), // Where in document
      suggestion: v.string(), // How to improve
    })),

    // Identified strengths
    strengths: v.array(v.object({
      category: v.string(),
      description: v.string(),
    })),

    // Generated feedback
    summary: v.string(),
    detailedFeedback: v.string(),

    // Metadata
    modelUsed: v.string(), // Which AI model
    processingTime: v.number(), // milliseconds
    analyzedAt: v.number(),
  })
    .index("submission", ["submissionId"]),

  // Aggregated weakness patterns across classroom
  weaknessPatterns: defineTable({
    classroomId: v.id("classrooms"),
    assignmentId: v.optional(v.id("assignments")), // null for classroom-wide

    timeRange: v.object({
      startDate: v.number(),
      endDate: v.number(),
    }),

    patterns: v.array(v.object({
      weakness: v.string(),
      category: v.string(),
      frequency: v.number(), // How many students
      percentage: v.number(), // % of submissions

      // Example submissions showing this weakness
      exampleSubmissionIds: v.array(v.id("submissions")),

      // Suggested interventions
      suggestedTopics: v.array(v.string()),
    })),

    // Summary statistics
    stats: v.object({
      totalSubmissions: v.number(),
      averageScore: v.number(),
      medianScore: v.number(),
      improvementRate: v.number(), // % improvement over time
    }),

    generatedAt: v.number(),
  })
    .index("classroom", ["classroomId", "generatedAt"])
    .index("assignment", ["assignmentId"]),

  // Classroom announcements/posts
  announcements: defineTable({
    classroomId: v.id("classrooms"),
    authorId: v.id("users"),
    content: v.string(),

    // Optional attachments (file metadata references)
    attachmentIds: v.optional(v.array(v.id("fileMetadata"))),

    // Pinning and priority
    isPinned: v.boolean(),

    // Scheduling
    scheduledFor: v.optional(v.number()), // Future posting

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("classroom", ["classroomId", "createdAt"])
    .index("author", ["authorId", "createdAt"])
    .index("pinned", ["classroomId", "isPinned", "createdAt"]),

  // Comments on announcements
  announcementComments: defineTable({
    announcementId: v.id("announcements"),
    classroomId: v.id("classrooms"), // Denormalized for permissions
    authorId: v.id("users"),
    content: v.string(),

    // Reply threading
    parentCommentId: v.optional(v.id("announcementComments")),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("announcement", ["announcementId", "createdAt"])
    .index("author", ["authorId", "createdAt"])
    .index("replies", ["parentCommentId", "createdAt"]),

  // Analytics and reporting
  analyticsReports: defineTable({
    type: v.union(
      v.literal("student"),      // Individual student report
      v.literal("assignment"),   // Assignment-level report
      v.literal("classroom"),    // Classroom-wide report
      v.literal("comparison")    // Compare multiple sections
    ),

    targetId: v.string(), // ID of student/assignment/classroom
    classroomId: v.id("classrooms"),

    reportData: v.object({
      // Performance metrics
      performance: v.object({
        averageScore: v.number(),
        medianScore: v.number(),
        scoreDistribution: v.array(v.object({
          range: v.string(), // "90-100", "80-89", etc.
          count: v.number(),
          percentage: v.number(),
        })),
      }),

      // Weakness analysis
      commonWeaknesses: v.array(v.object({
        weakness: v.string(),
        affectedCount: v.number(),
        severity: v.string(),
        trend: v.union(
          v.literal("improving"),
          v.literal("stable"),
          v.literal("worsening")
        ),
      })),

      // Student identification
      studentsNeedingHelp: v.array(v.object({
        studentId: v.id("users"),
        weaknessCount: v.number(),
        averageScore: v.number(),
        trend: v.string(),
      })),

      topPerformers: v.array(v.object({
        studentId: v.id("users"),
        averageScore: v.number(),
        consistency: v.number(), // How consistent their performance
      })),
    }),

    generatedBy: v.id("users"),
    generatedAt: v.number(),
    validUntil: v.number(), // When report becomes stale
  })
    .index("classroom", ["classroomId", "type", "generatedAt"])
    .index("target", ["targetId", "type"]),

  // File management
  fileMetadata: defineTable({
    storageId: v.id("_storage"), // Convex storage reference
    fileName: v.string(),
    mimeType: v.string(),
    sizeBytes: v.number(),

    uploadedBy: v.id("users"),
    uploadedAt: v.number(),

    // What this file is for
    purpose: v.union(
      v.literal("solution"),      // Teacher's solution
      v.literal("submission"),    // Student submission
      v.literal("resource"),      // Classroom resource
      v.literal("rubric")        // Assignment rubric
    ),

    // Associated entities
    classroomId: v.optional(v.id("classrooms")),
    assignmentId: v.optional(v.id("assignments")),
    submissionId: v.optional(v.id("submissions")),

    // Processing status for documents
    processingStatus: v.optional(v.union(
      v.literal("pending"),
      v.literal("processing"),
      v.literal("completed"),
      v.literal("failed")
    )),
  })
    .index("uploadedBy", ["uploadedBy", "uploadedAt"])
    .index("purpose", ["purpose", "classroomId"]),
});

export default schema;
