"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download, Filter } from "lucide-react";

interface GradesPageProps {
  params: Promise<{ id: string }>;
}

export default function GradesPage({ params }: GradesPageProps) {
  const { isAuthenticated } = useConvexAuth();
  const resolvedParams = use(params);

  const classroom = useQuery(
    api.classrooms.getClassroom,
    !isAuthenticated ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  // Mock grades data
  const gradesData = [
    {
      studentName: "Emma Wilson",
      assignments: [
        { name: "Lab Report #1", score: 85, total: 100 },
        { name: "Chapter 5 Problems", score: 42, total: 50 },
        { name: "Midterm Review", score: 23, total: 25 }
      ],
      average: 88.7
    },
    {
      studentName: "James Rodriguez",
      assignments: [
        { name: "Lab Report #1", score: 92, total: 100 },
        { name: "Chapter 5 Problems", score: 47, total: 50 },
        { name: "Midterm Review", score: 24, total: 25 }
      ],
      average: 93.1
    },
    {
      studentName: "Sophia Kim",
      assignments: [
        { name: "Lab Report #1", score: 78, total: 100 },
        { name: "Chapter 5 Problems", score: 38, total: 50 },
        { name: "Midterm Review", score: 21, total: 25 }
      ],
      average: 82.3
    }
  ];

  if (!classroom) {
    return <Loading message="Loading grades..." size="lg" showCard />;
  }

  const isTeacher = classroom.userRole === "instructor" || classroom.userRole === "ta";

  if (!isTeacher) {
    return (
      <div className="text-center py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <h2 className="text-xl font-heading text-foreground mb-4">
              Access Restricted
            </h2>
            <p className="text-base font-base text-foreground opacity-80">
              Only instructors and teaching assistants can view the grades page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-foreground mb-1">
            Grades
          </h1>
          <p className="text-base font-base text-foreground opacity-80">
            View and manage student grades and performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="neutral" size="lg">
            <Filter size={20} />
            Filter
          </Button>
          <Button variant="neutral" size="lg">
            <Download size={20} />
            Export
          </Button>
        </div>
      </div>

      {/* Grade Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-base bg-main border-2 border-border shadow-shadow flex items-center justify-center">
                <BarChart3 size={20} className="text-main-foreground" />
              </div>
              <div>
                <p className="text-xl font-heading text-foreground">87.4%</p>
                <p className="text-sm font-base text-foreground opacity-80">Class Average</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-base bg-main border-2 border-border shadow-shadow flex items-center justify-center">
                <span className="text-sm font-heading text-main-foreground">A+</span>
              </div>
              <div>
                <p className="text-xl font-heading text-foreground">95.2%</p>
                <p className="text-sm font-base text-foreground opacity-80">Highest Grade</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-base bg-main border-2 border-border shadow-shadow flex items-center justify-center">
                <span className="text-sm font-heading text-main-foreground">{gradesData.length}</span>
              </div>
              <div>
                <p className="text-xl font-heading text-foreground">{gradesData.length}</p>
                <p className="text-sm font-base text-foreground opacity-80">Students Graded</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grades Table */}
      <Card>
        <CardHeader>
          <CardTitle>Student Grades</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b-2 border-border">
                  <th className="text-left p-4 font-heading text-foreground">Student</th>
                  <th className="text-center p-4 font-heading text-foreground">Lab Report #1</th>
                  <th className="text-center p-4 font-heading text-foreground">Chapter 5 Problems</th>
                  <th className="text-center p-4 font-heading text-foreground">Midterm Review</th>
                  <th className="text-center p-4 font-heading text-foreground">Average</th>
                </tr>
              </thead>
              <tbody>
                {gradesData.map((student, index) => (
                  <tr key={index} className="border-b border-border hover:bg-secondary-background">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-main border-2 border-border flex items-center justify-center">
                          <span className="text-xs font-heading text-main-foreground">
                            {student.studentName.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="font-base text-foreground">{student.studentName}</span>
                      </div>
                    </td>
                    {student.assignments.map((assignment, assignmentIndex) => (
                      <td key={assignmentIndex} className="p-4 text-center">
                        <span className="font-mono text-foreground">
                          {assignment.score}/{assignment.total}
                        </span>
                        <div className="text-xs font-base text-foreground opacity-60 mt-1">
                          {Math.round((assignment.score / assignment.total) * 100)}%
                        </div>
                      </td>
                    ))}
                    <td className="p-4 text-center">
                      <span className="font-heading text-lg text-foreground">
                        {student.average}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}