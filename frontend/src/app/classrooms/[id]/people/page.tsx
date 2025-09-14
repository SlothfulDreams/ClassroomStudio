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
import { UserPlus, Mail, Users, GraduationCap, Shield, UserCheck } from "lucide-react";

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

  const members = useQuery(
    api.members.getClassroomMembers,
    !isAuthenticated || !classroom ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  const memberStats = useQuery(
    api.members.getMemberStats,
    !isAuthenticated || !classroom ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  if (!classroom) {
    return <Loading message="Loading people..." size="lg" showCard />;
  }

  if (!members) {
    return <Loading message="Loading members..." size="lg" showCard />;
  }

  const isTeacher = classroom.userRole === "instructor" || classroom.userRole === "ta";

  const instructors = members.filter(m => m.role === "instructor");
  const teachingAssistants = members.filter(m => m.role === "ta");
  const students = members.filter(m => m.role === "student");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-gray-900 mb-1">
            People
          </h1>
          <p className="text-base font-base text-gray-600">
            Manage classroom members and their roles
          </p>
        </div>

        {isTeacher && (
          <div className="flex items-center gap-3">
            <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <Mail size={20} />
              Email All
            </button>
            <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
              <UserPlus size={20} />
              Invite People
            </button>
          </div>
        )}
      </div>

      {/* Class Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Members */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-16 h-16 bg-teal-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Users size={32} className="text-white" />
          </div>
          <p className="text-2xl font-heading text-gray-900 mb-1">
            {members.length}
          </p>
          <p className="text-sm font-base text-gray-600">
            Total Members
          </p>
        </div>

        {/* Instructors */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <GraduationCap size={32} className="text-white" />
          </div>
          <p className="text-2xl font-heading text-gray-900 mb-1">
            {instructors.length}
          </p>
          <p className="text-sm font-base text-gray-600">
            Instructors
          </p>
        </div>

        {/* Teaching Assistants */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <Shield size={32} className="text-white" />
          </div>
          <p className="text-2xl font-heading text-gray-900 mb-1">
            {teachingAssistants.length}
          </p>
          <p className="text-sm font-base text-gray-600">
            Teaching Assistants
          </p>
        </div>

        {/* Students */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <div className="w-16 h-16 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
            <UserCheck size={32} className="text-white" />
          </div>
          <p className="text-2xl font-heading text-gray-900 mb-1">
            {students.length}
          </p>
          <p className="text-sm font-base text-gray-600">
            Students
          </p>
        </div>
      </div>

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