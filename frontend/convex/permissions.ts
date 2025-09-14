import { QueryCtx, MutationCtx } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { auth } from "./auth";

// Get user's role in a classroom
export async function getUserRole(
  ctx: QueryCtx | MutationCtx,
  classroomId: Id<"classrooms">,
  userId: Id<"users">
): Promise<"instructor" | "ta" | "student" | null> {
  const membership = await ctx.db
    .query("classroomMembers")
    .withIndex("classroomUser", (q) => q.eq("classroomId", classroomId).eq("userId", userId))
    .filter((q) => q.eq(q.field("status"), "active"))
    .first();

  return membership?.role || null;
}

// Check if user is a member of the classroom
export async function requireMember(
  ctx: QueryCtx | MutationCtx,
  classroomId: Id<"classrooms">,
  userId: Id<"users">
): Promise<"instructor" | "ta" | "student"> {
  const role = await getUserRole(ctx, classroomId, userId);

  if (!role) {
    throw new Error("Not authorized to access this classroom");
  }

  return role;
}

// Check if user is instructor or TA
export async function requireTeacher(
  ctx: QueryCtx | MutationCtx,
  classroomId: Id<"classrooms">,
  userId: Id<"users">
): Promise<"instructor" | "ta"> {
  const role = await requireMember(ctx, classroomId, userId);

  if (role !== "instructor" && role !== "ta") {
    throw new Error("Only instructors and teaching assistants can perform this action");
  }

  return role;
}

// Check if user is instructor
export async function requireInstructor(
  ctx: QueryCtx | MutationCtx,
  classroomId: Id<"classrooms">,
  userId: Id<"users">
): Promise<void> {
  const role = await requireMember(ctx, classroomId, userId);

  if (role !== "instructor") {
    throw new Error("Only instructors can perform this action");
  }
}

// Check if user is student
export async function requireStudent(
  ctx: QueryCtx | MutationCtx,
  classroomId: Id<"classrooms">,
  userId: Id<"users">
): Promise<void> {
  const role = await requireMember(ctx, classroomId, userId);

  if (role !== "student") {
    throw new Error("Only students can perform this action");
  }
}

// Get authenticated user ID and verify classroom membership
export async function getAuthenticatedMember(
  ctx: QueryCtx | MutationCtx,
  classroomId: Id<"classrooms">
): Promise<{ userId: Id<"users">; role: "instructor" | "ta" | "student" }> {
  const userId = await auth.getUserId(ctx);
  if (!userId) {
    throw new Error("Not authenticated");
  }

  const role = await requireMember(ctx, classroomId, userId);

  return { userId, role };
}

// Check if user owns a resource (created it)
export async function requireOwnership<T extends { createdBy?: Id<"users">; authorId?: Id<"users">; studentId?: Id<"users"> }>(
  ctx: QueryCtx | MutationCtx,
  resource: T | null,
  userId: Id<"users">
): Promise<T> {
  if (!resource) {
    throw new Error("Resource not found");
  }

  const ownerId = resource.createdBy || resource.authorId || resource.studentId;
  if (ownerId !== userId) {
    throw new Error("Not authorized to modify this resource");
  }

  return resource;
}