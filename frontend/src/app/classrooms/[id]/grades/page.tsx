"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { BarChart3, Download, Filter, TrendingUp, Users } from "lucide-react";

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
      email: "emma.wilson@student.edu",
      assignments: [
        { name: "Lab Report #1", score: 85, total: 100 },
        { name: "Chapter 5 Problems", score: 42, total: 50 },
        { name: "Midterm Review", score: 23, total: 25 }
      ],
      average: 88.7
    },
    {
      studentName: "James Rodriguez",
      email: "james.rodriguez@student.edu",
      assignments: [
        { name: "Lab Report #1", score: 92, total: 100 },
        { name: "Chapter 5 Problems", score: 47, total: 50 },
        { name: "Midterm Review", score: 24, total: 25 }
      ],
      average: 93.1
    },
    {
      studentName: "Sophia Kim",
      email: "sophia.kim@student.edu",
      assignments: [
        { name: "Lab Report #1", score: 78, total: 100 },
        { name: "Chapter 5 Problems", score: 38, total: 50 },
        { name: "Midterm Review", score: 21, total: 25 }
      ],
      average: 82.3
    }
  ];

  const getPercentageColor = (percentage: number) => {
    if (percentage >= 90) return "text-green-600";
    if (percentage >= 80) return "text-blue-600";
    if (percentage >= 70) return "text-orange-500";
    return "text-red-500";
  };

  if (!classroom) {
    return <Loading message="Loading grades..." size="lg" showCard />;
  }

  const isTeacher = classroom.userRole === "instructor" || classroom.userRole === "ta";

  if (!isTeacher) {
    return (
      <div className="text-center py-12">
        <div className="bg-white rounded-lg border border-gray-200 max-w-md mx-auto p-8">
          <h2 className="text-xl font-heading text-gray-900 mb-4">
            Access Restricted
          </h2>
          <p className="text-base font-base text-gray-600">
            Only instructors and teaching assistants can view the grades page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-gray-900 mb-1">
            Grades
          </h1>
          <p className="text-base font-base text-gray-600">
            View and manage student grades and performance
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Filter size={20} />
            Filter
          </button>
          <button className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
            <Download size={20} />
            Export
          </button>
        </div>
      </div>

      {/* Grade Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Class Average */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-teal-500 rounded-xl flex items-center justify-center mb-3">
              <BarChart3 size={32} className="text-white" />
            </div>
            <p className="text-sm font-base text-gray-600 mb-1">Class Average</p>
            <p className="text-2xl font-heading text-gray-900">87.4%</p>
          </div>
        </div>

        {/* Highest Grade */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-blue-500 rounded-xl flex items-center justify-center mb-3">
              <TrendingUp size={32} className="text-white" />
            </div>
            <p className="text-sm font-base text-gray-600 mb-1">Highest Grade</p>
            <p className="text-2xl font-heading text-gray-900">96.0%</p>
          </div>
        </div>

        {/* Students */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-purple-500 rounded-xl flex items-center justify-center mb-3">
              <Users size={32} className="text-white" />
            </div>
            <p className="text-sm font-base text-gray-600 mb-1">Students</p>
            <p className="text-2xl font-heading text-gray-900">{gradesData.length}</p>
          </div>
        </div>
      </div>

      {/* Grades Table */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="p-4 border-b border-gray-200">
          <h3 className="text-lg font-heading text-gray-900">Student Grades</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left p-4 font-heading text-gray-700">Student</th>
                <th className="text-center p-4 font-heading text-gray-700">Lab Report #1</th>
                <th className="text-center p-4 font-heading text-gray-700">Chapter 5 Problems</th>
                <th className="text-center p-4 font-heading text-gray-700">Midterm Review</th>
                <th className="text-center p-4 font-heading text-gray-700">Average</th>
              </tr>
            </thead>
            <tbody>
              {gradesData.map((student, index) => {
                const getInitials = (name: string) => {
                  const nameParts = name.split(' ');
                  return nameParts.map(n => n[0]).join('').toUpperCase();
                };

                const avatarColors = ['bg-teal-500', 'bg-teal-500', 'bg-teal-500'];

                return (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${avatarColors[index % avatarColors.length]} flex items-center justify-center`}>
                          <span className="text-sm font-heading text-white">
                            {getInitials(student.studentName)}
                          </span>
                        </div>
                        <div>
                          <div className="font-base text-gray-900">{student.studentName}</div>
                          <div className="text-sm text-gray-600">{student.email}</div>
                        </div>
                      </div>
                    </td>
                    {student.assignments.map((assignment, assignmentIndex) => {
                      const percentage = Math.round((assignment.score / assignment.total) * 100);
                      return (
                        <td key={assignmentIndex} className="p-4 text-center">
                          <div className="font-mono text-gray-900 mb-1">
                            {assignment.score}/{assignment.total}
                          </div>
                          <div className={`text-sm font-base ${getPercentageColor(percentage)}`}>
                            {percentage}%
                          </div>
                        </td>
                      );
                    })}
                    <td className="p-4 text-center">
                      <span className={`font-heading text-lg ${getPercentageColor(student.average)}`}>
                        {student.average}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}