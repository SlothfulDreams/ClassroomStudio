"use client";

import { use, useState } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { AssignmentCard } from "@/components/classroom/AssignmentCard";
import { CreateAssignmentModal } from "@/components/classroom/CreateAssignmentModal";
import { EditAssignmentModal } from "@/components/classroom/EditAssignmentModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, BookOpen, FolderOpen } from "lucide-react";
import { useRouter } from "next/navigation";

interface ClassworkPageProps {
  params: Promise<{ id: string }>;
}

export default function ClassworkPage({ params }: ClassworkPageProps) {
  const router = useRouter();
  const { isAuthenticated } = useConvexAuth();
  const resolvedParams = use(params);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [editingAssignmentId, setEditingAssignmentId] = useState<string | null>(null);

  const classroom = useQuery(
    api.classrooms.getClassroom,
    !isAuthenticated ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  const assignments = useQuery(
    api.assignments.getAssignments,
    !isAuthenticated || !classroom ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  const memberStats = useQuery(
    api.members.getMemberStats,
    !isAuthenticated || !classroom ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  // Calculate categories dynamically from assignments
  const allCategories = assignments ? [...new Set(assignments.filter(a => a.category).map(a => a.category))] : [];
  const categories = [
    { name: "All", count: assignments?.length || 0 },
    ...allCategories.map(category => ({
      name: category,
      count: assignments?.filter(a => a.category === category).length || 0
    }))
  ];

  // Filter assignments by selected category
  const filteredAssignments = assignments?.filter(assignment => {
    if (selectedCategory === "All") return true;
    return assignment.category === selectedCategory;
  }) || [];

  if (!classroom) {
    return <Loading message="Loading classwork..." size="lg" showCard />;
  }

  if (!assignments) {
    return <Loading message="Loading assignments..." size="lg" showCard />;
  }

  const isTeacher = classroom.userRole === "instructor" || classroom.userRole === "ta";
  const totalStudents = memberStats?.students || 0;

  const handleEditAssignment = (assignmentId: string) => {
    setEditingAssignmentId(assignmentId);
  };

  const handleViewAssignment = (assignmentId: string) => {
    router.push(`/classrooms/${resolvedParams.id}/assignments/${assignmentId}`);
  };

  const handleCloseEditModal = () => {
    setEditingAssignmentId(null);
  };

  // Get the assignment being edited
  const editingAssignment = assignments?.find(a => a._id === editingAssignmentId);

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

        {isTeacher && <CreateAssignmentModal classroomId={resolvedParams.id as Id<"classrooms">} />}
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
                    onClick={() => setSelectedCategory(category.name)}
                    className={`w-full flex items-center justify-between p-3 text-left rounded-base border-2 transition-colors ${
                      selectedCategory === category.name
                        ? "border-main bg-main/5"
                        : "border-transparent hover:border-border hover:bg-secondary-background"
                    }`}
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
          {filteredAssignments.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <BookOpen size={48} className="text-foreground opacity-40 mx-auto mb-4" />
                <h3 className="text-xl font-heading text-foreground mb-2">
                  {selectedCategory === "All" ? "No assignments yet" : `No ${selectedCategory.toLowerCase()} assignments`}
                </h3>
                <p className="text-base font-base text-foreground opacity-80 mb-6">
                  {isTeacher
                    ? selectedCategory === "All"
                      ? "Create your first assignment to get started."
                      : `No assignments in the ${selectedCategory} category yet.`
                    : "Your teacher will post assignments here."
                  }
                </p>
                {isTeacher && selectedCategory === "All" && (
                  <div className="flex justify-center">
                    <CreateAssignmentModal classroomId={resolvedParams.id as Id<"classrooms">} />
                  </div>
                )}
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <AssignmentCard
                  key={assignment._id}
                  assignment={{
                    id: assignment._id,
                    title: assignment.title,
                    description: assignment.description,
                    dueDate: assignment.dueDate || 0,
                    points: assignment.totalPoints,
                    category: assignment.category || "Uncategorized",
                    status: assignment.isPublished ? (
                      assignment.totalSubmissions === totalStudents ? "graded" as const : "assigned" as const
                    ) : "draft" as const,
                    submissionCount: assignment.totalSubmissions || 0,
                    totalStudents: totalStudents
                  }}
                  userRole={classroom.userRole}
                  onEdit={handleEditAssignment}
                  onView={handleViewAssignment}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Edit Assignment Modal */}
      {editingAssignment && (
        <EditAssignmentModal
          assignmentId={editingAssignment._id as Id<"assignments">}
          classroomId={resolvedParams.id as Id<"classrooms">}
          isOpen={!!editingAssignmentId}
          onClose={handleCloseEditModal}
        />
      )}
    </div>
  );
}