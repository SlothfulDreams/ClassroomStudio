"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { MembersList } from "@/components/classroom/MembersList";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { UserPlus, Mail, Users } from "lucide-react";

interface PeoplePageProps {
  params: Promise<{ id: string }>;
}

export default function PeoplePage({ params }: PeoplePageProps) {
  const { isAuthenticated } = useConvexAuth();
  const resolvedParams = use(params);

  const classroom = useQuery(
    api.classrooms.getClassroom,
    !isAuthenticated ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  // Mock members data - will replace with real queries
  const mockMembers = [
    // Instructors
    {
      id: "1",
      name: "Dr. Sarah Johnson",
      email: "sarah.johnson@university.edu",
      role: "instructor" as const,
      joinedAt: Date.now() - 2592000000, // 30 days ago
      lastActivity: Date.now() - 86400000 // 1 day ago
    },
    // Teaching Assistants
    {
      id: "2",
      name: "Michael Chen",
      email: "m.chen@university.edu",
      role: "ta" as const,
      joinedAt: Date.now() - 2592000000,
      lastActivity: Date.now() - 172800000 // 2 days ago
    },
    // Students
    {
      id: "3",
      name: "Emma Wilson",
      email: "emma.wilson@student.edu",
      role: "student" as const,
      joinedAt: Date.now() - 2419200000, // 28 days ago
      lastActivity: Date.now() - 3600000 // 1 hour ago
    },
    {
      id: "4",
      name: "James Rodriguez",
      email: "james.r@student.edu",
      role: "student" as const,
      joinedAt: Date.now() - 2419200000,
      lastActivity: Date.now() - 7200000 // 2 hours ago
    },
    {
      id: "5",
      name: "Sophia Kim",
      email: "sophia.kim@student.edu",
      role: "student" as const,
      joinedAt: Date.now() - 2332800000, // 27 days ago
      lastActivity: Date.now() - 14400000 // 4 hours ago
    }
  ];

  if (!classroom) {
    return <Loading message="Loading people..." size="lg" showCard />;
  }

  const isTeacher = classroom.userRole === "instructor" || classroom.userRole === "ta";

  const instructors = mockMembers.filter(m => m.role === "instructor");
  const teachingAssistants = mockMembers.filter(m => m.role === "ta");
  const students = mockMembers.filter(m => m.role === "student");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-foreground mb-1">
            People
          </h1>
          <p className="text-base font-base text-foreground opacity-80">
            Manage classroom members and their roles
          </p>
        </div>

        {isTeacher && (
          <div className="flex items-center gap-3">
            <Button variant="neutral" size="lg">
              <Mail size={20} />
              Email All
            </Button>
            <Button size="lg">
              <UserPlus size={20} />
              Invite People
            </Button>
          </div>
        )}
      </div>

      {/* Class Statistics */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-base bg-main border-2 border-border shadow-shadow flex items-center justify-center">
                <Users size={24} className="text-main-foreground" />
              </div>
              <div>
                <p className="text-2xl font-heading text-foreground">
                  {mockMembers.length}
                </p>
                <p className="text-sm font-base text-foreground opacity-80">
                  Total Members
                </p>
              </div>
            </div>

            <div className="h-10 w-px bg-border" />

            <div className="grid grid-cols-3 gap-6 text-center">
              <div>
                <p className="text-lg font-heading text-foreground">
                  {instructors.length}
                </p>
                <p className="text-xs font-base text-foreground opacity-60">
                  Instructors
                </p>
              </div>
              <div>
                <p className="text-lg font-heading text-foreground">
                  {teachingAssistants.length}
                </p>
                <p className="text-xs font-base text-foreground opacity-60">
                  Teaching Assistants
                </p>
              </div>
              <div>
                <p className="text-lg font-heading text-foreground">
                  {students.length}
                </p>
                <p className="text-xs font-base text-foreground opacity-60">
                  Students
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Sections */}
      <div className="space-y-6">
        {/* Instructors */}
        {instructors.length > 0 && (
          <MembersList
            title="Instructors"
            members={instructors}
            canManage={isTeacher && classroom.userRole === "instructor"}
            showEmail={isTeacher}
          />
        )}

        {/* Teaching Assistants */}
        {teachingAssistants.length > 0 && (
          <MembersList
            title="Teaching Assistants"
            members={teachingAssistants}
            canManage={isTeacher && classroom.userRole === "instructor"}
            showEmail={isTeacher}
          />
        )}

        {/* Students */}
        <MembersList
          title="Students"
          members={students}
          canManage={isTeacher}
          showEmail={isTeacher}
        />
      </div>
    </div>
  );
}