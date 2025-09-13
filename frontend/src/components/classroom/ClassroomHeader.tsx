import * as React from "react";
import { cn } from "@/lib/utils";
import { GraduationCap, Settings, Users } from "lucide-react";
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

  // Generate a pattern based on classroom name for visual variety
  const getHeaderPattern = (name: string) => {
    const patterns = [
      "bg-gradient-to-r from-main/10 to-main/5",
      "bg-gradient-to-br from-main/10 via-secondary-background to-main/5",
      "bg-gradient-to-r from-secondary-background to-main/10"
    ];

    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return patterns[Math.abs(hash) % patterns.length];
  };

  return (
    <header className={cn(
      "border-b-2 border-border",
      getHeaderPattern(classroom.name),
      className
    )}>
      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-base bg-main border-2 border-border shadow-shadow flex items-center justify-center">
                <GraduationCap size={24} className="text-main-foreground" />
              </div>
              <div>
                <h1 className="text-3xl font-heading text-foreground">
                  {classroom.name}
                </h1>
                {classroom.subject && (
                  <p className="text-base font-base text-foreground opacity-80">
                    {classroom.subject}
                  </p>
                )}
              </div>
            </div>

            {classroom.description && (
              <p className="text-sm font-base text-foreground opacity-70 max-w-2xl">
                {classroom.description}
              </p>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isTeacher && (
              <Button variant="neutral" size="sm">
                <Settings size={16} />
                Settings
              </Button>
            )}
            <Button variant="neutral" size="sm">
              <Users size={16} />
              {classroom.memberCount} members
            </Button>
          </div>
        </div>

        {/* Role badge */}
        <div className="mt-4">
          <span className={cn(
            "inline-flex items-center px-3 py-1 text-sm font-base rounded-base border-2",
            classroom.userRole === "instructor"
              ? "bg-main text-main-foreground border-border"
              : classroom.userRole === "ta"
              ? "bg-secondary-background text-foreground border-border"
              : "bg-background text-foreground border-border"
          )}>
            {classroom.userRole === "instructor" ? "Instructor"
             : classroom.userRole === "ta" ? "Teaching Assistant"
             : "Student"}
          </span>
        </div>
      </div>
    </header>
  );
}