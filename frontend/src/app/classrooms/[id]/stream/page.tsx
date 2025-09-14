"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { ClassroomBanner } from "@/components/classroom/ClassroomBanner";
import { StreamPost } from "@/components/classroom/StreamPost";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Calendar, BookOpen, Copy } from "lucide-react";
import { CreateAnnouncementModal } from "@/components/classroom/CreateAnnouncementModal";

interface StreamPageProps {
  params: Promise<{ id: string }>;
}

export default function StreamPage({ params }: StreamPageProps) {
  const { isAuthenticated } = useConvexAuth();
  const resolvedParams = use(params);
  const [isOpen, setIsOpen] = useState(false);

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
        {/* Classroom Info Card */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-heading text-gray-900 mb-1">
                {classroom.name}
              </h2>
              <p className="text-sm text-gray-600">
                {classroom.subject}
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500 mb-1">Class Code</p>
              <button
                onClick={async () => {
                  try {
                    await navigator.clipboard.writeText(classroom.joinCode);
                    // Could add a toast notification here
                  } catch (error) {
                    console.error("Failed to copy:", error);
                  }
                }}
                className="flex items-center gap-2 text-sm font-mono text-gray-900 bg-gray-100 px-3 py-2 rounded border hover:bg-gray-200 transition-colors cursor-pointer"
                title="Click to copy"
              >
                {classroom.joinCode}
                <Copy size={14} className="text-gray-500" />
              </button>
            </div>
          </div>
        </div>

        {/* Create Post (Teachers only) */}
        {isTeacher && (
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-teal-500 flex items-center justify-center">
                <Plus size={20} className="text-white" />
              </div>
              <input
                type="text"
                placeholder="Share something with your class"
                className="flex-1 p-3 bg-gray-50 border border-gray-200 rounded-lg text-gray-600 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                onClick={() => setIsOpen(true)}
                readOnly
              />
            </div>
          </div>
        )}

        {/* Stream Posts */}
        <div className="space-y-4">
          {!announcements ? (
            <Loading message="Loading announcements..." size="md" />
          ) : announcements.length === 0 ? (
            <div className="bg-white rounded-lg border border-gray-200 p-12 text-center">
              <h3 className="text-lg font-heading text-gray-900 mb-2">
                No announcements yet
              </h3>
              <p className="text-base font-base text-gray-600">
                {isTeacher
                  ? "Share updates and announcements with your class."
                  : "Your teacher will post announcements here."
                }
              </p>
            </div>
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
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-teal-500" />
            <h3 className="text-lg font-heading text-gray-900">
              Upcoming
            </h3>
          </div>

          {upcomingAssignments.length === 0 ? (
            <p className="text-sm font-base text-gray-500">
              No upcoming assignments
            </p>
          ) : (
            <div className="space-y-3">
              {upcomingAssignments.map((assignment) => (
                <div key={assignment._id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-teal-500 flex items-center justify-center flex-shrink-0">
                    <BookOpen size={16} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-base text-gray-900 line-clamp-2">
                      {assignment.title}
                    </p>
                    <p className="text-xs font-base text-gray-500 mt-1">
                      Due {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : "No due date"}
                      {assignment.totalPoints && ` • ${assignment.totalPoints} points`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Class Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <h3 className="text-lg font-heading text-gray-900 mb-4">
            Class Details
          </h3>
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-gray-500">Subject</p>
              <p className="font-base text-gray-900">{classroom.subject || "Not specified"}</p>
            </div>
            <div>
              <p className="text-gray-500">Class Code</p>
              <p className="font-mono text-gray-900 bg-gray-100 px-2 py-1 rounded border border-gray-200">
                {classroom.joinCode}
              </p>
            </div>
            <div>
              <p className="text-gray-500">Members</p>
              <p className="font-base text-gray-900">{classroom.memberCount} members</p>
            </div>
          </div>
        </div>
      </div>

      {/* Hidden Modal for Create Announcement */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <CreateAnnouncementModal classroomId={resolvedParams.id as Id<"classrooms">} />
              <button
                onClick={() => setIsOpen(false)}
                className="mt-4 text-gray-500 hover:text-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}