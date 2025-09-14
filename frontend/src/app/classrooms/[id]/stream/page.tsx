"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { ClassroomBanner } from "@/components/classroom/ClassroomBanner";
import { StreamPost } from "@/components/classroom/StreamPost";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, BookOpen } from "lucide-react";
import { CreateAnnouncementModal } from "@/components/classroom/CreateAnnouncementModal";

interface StreamPageProps {
  params: Promise<{ id: string }>;
}

export default function StreamPage({ params }: StreamPageProps) {
  const { isAuthenticated } = useConvexAuth();
  const resolvedParams = use(params);

  const classroom = useQuery(
    api.classrooms.getClassroom,
    !isAuthenticated ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  const announcements = useQuery(
    api.announcements.getAnnouncements,
    !isAuthenticated || !classroom ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  const assignments = useQuery(
    api.assignments.getAssignments,
    !isAuthenticated || !classroom ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  // Filter upcoming assignments (due in the future) and limit to 5
  const upcomingAssignments = assignments?.filter(a =>
    a.isPublished &&
    a.dueDate &&
    a.dueDate > Date.now()
  ).slice(0, 5) || [];

  if (!classroom) {
    return <Loading message="Loading stream..." size="lg" showCard />;
  }

  const isTeacher = classroom.userRole === "instructor" || classroom.userRole === "ta";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Main Stream */}
      <div className="lg:col-span-2 space-y-6">
        {/* Classroom Banner */}
        <ClassroomBanner classroom={classroom} />

        {/* Create Post (Teachers only) */}
        {isTeacher && <CreateAnnouncementModal classroomId={resolvedParams.id as Id<"classrooms">} />}

        {/* Stream Posts */}
        <div className="space-y-4">
          {!announcements ? (
            <Loading message="Loading announcements..." size="md" />
          ) : announcements.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <h3 className="text-lg font-heading text-foreground mb-2">
                  No announcements yet
                </h3>
                <p className="text-base font-base text-foreground opacity-80">
                  {isTeacher
                    ? "Share updates and announcements with your class."
                    : "Your teacher will post announcements here."
                  }
                </p>
              </CardContent>
            </Card>
          ) : (
            announcements.map(announcement => (
              <StreamPost
                key={announcement._id}
                post={{
                  id: announcement._id,
                  authorName: announcement.author.name || "Unknown",
                  authorRole: "instructor", // We'll need to get this from the author data
                  content: announcement.content,
                  createdAt: announcement.createdAt,
                  attachmentIds: announcement.attachmentIds,
                  commentCount: announcement.commentCount || 0,
                  isPinned: announcement.isPinned
                }}
                classroomId={resolvedParams.id as Id<"classrooms">}
                currentUserRole={classroom.userRole}
                canEdit={isTeacher} // For now, only teachers can edit
              />
            ))
          )}
        </div>
      </div>

      {/* Sidebar */}
      <div className="space-y-6">
        {/* Upcoming Assignments */}
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Calendar size={20} className="text-foreground" />
              <h3 className="text-lg font-heading text-foreground">
                Upcoming
              </h3>
            </div>

            {upcomingAssignments.length === 0 ? (
              <p className="text-sm font-base text-foreground opacity-60">
                No upcoming assignments
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingAssignments.map((assignment) => (
                  <div key={assignment._id} className="flex items-start gap-3 p-3 rounded-base border border-border hover:bg-secondary-background transition-colors">
                    <BookOpen size={16} className="text-foreground opacity-60 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-base text-foreground line-clamp-2">
                        {assignment.title}
                      </p>
                      <p className="text-xs font-base text-foreground opacity-60 mt-1">
                        Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}
                        {assignment.totalPoints && ` • ${assignment.totalPoints} points`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Class Information */}
        <Card>
          <CardContent className="p-6">
            <h3 className="text-lg font-heading text-foreground mb-4">
              Class Details
            </h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-foreground opacity-60">Subject</p>
                <p className="font-base text-foreground">{classroom.subject || "Not specified"}</p>
              </div>
              <div>
                <p className="text-foreground opacity-60">Class Code</p>
                <p className="font-mono text-foreground bg-secondary-background px-2 py-1 rounded-base border border-border">
                  {classroom.joinCode}
                </p>
              </div>
              <div>
                <p className="text-foreground opacity-60">Members</p>
                <p className="font-base text-foreground">{classroom.memberCount} members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}