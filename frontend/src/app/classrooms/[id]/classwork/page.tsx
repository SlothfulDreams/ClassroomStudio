"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { AssignmentCard } from "@/components/classroom/AssignmentCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BookOpen, FolderOpen } from "lucide-react";

interface ClassworkPageProps {
  params: Promise<{ id: string }>;
}

export default function ClassworkPage({ params }: ClassworkPageProps) {
  const { isAuthenticated } = useConvexAuth();
  const resolvedParams = use(params);

  const classroom = useQuery(
    api.classrooms.getClassroom,
    !isAuthenticated ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  // Mock assignments data - will replace with real queries
  const assignments = [
    {
      id: "1",
      title: "Lab Report #1: Chemical Bonding",
      description: "Complete the lab report on ionic and covalent bonding. Include all sections as outlined in the rubric.",
      dueDate: Date.now() + 259200000, // 3 days from now
      points: 100,
      category: "Lab Reports",
      status: "assigned" as const,
      submissionCount: 0,
      totalStudents: 24
    },
    {
      id: "2",
      title: "Chapter 5 Problem Set",
      description: "Complete problems 1-15 from Chapter 5: Thermodynamics",
      dueDate: Date.now() + 604800000, // 1 week from now
      points: 50,
      category: "Homework",
      status: "assigned" as const,
      submissionCount: 0,
      totalStudents: 24
    },
    {
      id: "3",
      title: "Midterm Review",
      description: "Review materials and practice problems for the upcoming midterm exam.",
      dueDate: Date.now() - 86400000, // 1 day ago (overdue)
      points: 25,
      category: "Review",
      status: "graded" as const,
      submissionCount: 22,
      totalStudents: 24
    }
  ];

  const categories = [
    { name: "All", count: assignments.length },
    { name: "Lab Reports", count: assignments.filter(a => a.category === "Lab Reports").length },
    { name: "Homework", count: assignments.filter(a => a.category === "Homework").length },
    { name: "Review", count: assignments.filter(a => a.category === "Review").length }
  ];

  if (!classroom) {
    return <Loading message="Loading classwork..." size="lg" showCard />;
  }

  const isTeacher = classroom.userRole === "instructor" || classroom.userRole === "ta";

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-foreground mb-1">
            Classwork
          </h1>
          <p className="text-base font-base text-foreground opacity-80">
            {isTeacher ? "Manage assignments and track student progress" : "View and submit your assignments"}
          </p>
        </div>

        {isTeacher && (
          <Button size="lg">
            <Plus size={20} />
            Create Assignment
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Categories Sidebar */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              <h3 className="text-lg font-heading text-foreground mb-4">
                Categories
              </h3>
              <div className="space-y-2">
                {categories.map((category) => (
                  <button
                    key={category.name}
                    className="w-full flex items-center justify-between p-3 text-left rounded-base border-2 border-transparent hover:border-border hover:bg-secondary-background transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <FolderOpen size={16} className="text-foreground opacity-60" />
                      <span className="text-sm font-base text-foreground">
                        {category.name}
                      </span>
                    </div>
                    <span className="text-xs font-base text-foreground opacity-60 bg-secondary-background px-2 py-1 rounded-base border border-border">
                      {category.count}
                    </span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Assignments List */}
        <div className="lg:col-span-3">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen size={48} className="text-foreground opacity-40 mx-auto mb-4" />
                <h3 className="text-xl font-heading text-foreground mb-2">
                  No assignments yet
                </h3>
                <p className="text-base font-base text-foreground opacity-80 mb-6">
                  {isTeacher
                    ? "Create your first assignment to get started."
                    : "Your teacher will post assignments here."
                  }
                </p>
                {isTeacher && (
                  <Button>
                    <Plus size={20} />
                    Create Assignment
                  </Button>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {assignments.map((assignment) => (
                <AssignmentCard
                  key={assignment.id}
                  assignment={assignment}
                  userRole={classroom.userRole}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}