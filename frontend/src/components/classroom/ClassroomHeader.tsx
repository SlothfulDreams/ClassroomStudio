import * as React from "react";
import { cn } from "@/lib/utils";
import { BookOpen, Settings, Users } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Classroom {
  _id: string;
  name: string;
  description?: string;
  subject?: string;
  joinCode: string;
  userRole: "instructor" | "ta" | "student";
  memberCount: number;
}

interface ClassroomHeaderProps {
  classroom: Classroom;
  className?: string;
}

export function ClassroomHeader({ classroom, className }: ClassroomHeaderProps) {
  const isTeacher = classroom.userRole === "instructor" || classroom.userRole === "ta";

  return (
    <header className={cn(
      "bg-teal-100",
      className
    )}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-xl bg-teal-500 flex items-center justify-center">
              <BookOpen size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-heading text-gray-900">
                {classroom.name}
              </h1>
              {classroom.subject && (
                <p className="text-base font-base text-gray-700">
                  {classroom.subject}
                </p>
              )}
              {classroom.description && (
                <p className="text-sm font-base text-gray-600">
                  {classroom.description}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isTeacher && (
              <Button variant="outline" size="sm" className="bg-white border-gray-300 hover:bg-gray-50">
                <Settings size={16} />
                Settings
              </Button>
            )}
            <Button variant="outline" size="sm" className="bg-white border-gray-300 hover:bg-gray-50">
              <Users size={16} />
              {classroom.memberCount} members
            </Button>
          </div>
        </div>

        {/* Role badge */}
        <div className="mt-4">
          <span className="inline-flex items-center px-3 py-1 text-sm font-base rounded-md bg-teal-500 text-white">
            {classroom.userRole === "instructor" ? "Instructor"
             : classroom.userRole === "ta" ? "Teaching Assistant"
             : "Student"}
          </span>
        </div>
      </div>
    </header>
  );
}