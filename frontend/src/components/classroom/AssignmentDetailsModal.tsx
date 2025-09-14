"use client";

import * as React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Loading } from "@/components/ui/loading";
import { FileDisplay } from "@/components/ui/file-display";
import {
  Calendar,
  Clock,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  Edit,
  Trophy,
  BookOpen,
  Target,
  Download
} from "lucide-react";
import { formatDistanceToNow, format, isAfter } from "date-fns";
import { cn } from "@/lib/utils";

interface AssignmentDetailsModalProps {
  assignmentId: Id<"assignments">;
  classroomId: Id<"classrooms">;
  userRole: "instructor" | "ta" | "student";
  isOpen: boolean;
  onClose: () => void;
  onEdit?: () => void;
}

export function AssignmentDetailsModal({
  assignmentId,
  classroomId,
  userRole,
  isOpen,
  onClose,
  onEdit
}: AssignmentDetailsModalProps) {
  const assignment = useQuery(
    api.assignments.getAssignment,
    isOpen ? { assignmentId } : "skip"
  );

  const memberStats = useQuery(
    api.members.getMemberStats,
    isOpen ? { classroomId } : "skip"
  );

  const solutionFile = useQuery(
    api.files.getFileMetadata,
    isOpen && assignment?.solutionFileId
      ? { fileId: assignment.solutionFileId }
      : "skip"
  );

  if (!assignment) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <Loading message="Loading assignment..." size="lg" />
        </DialogContent>
      </Dialog>
    );
  }

  const isTeacher = userRole === "instructor" || userRole === "ta";
  const isOverdue = isAfter(new Date(), new Date(assignment.dueDate || 0));
  const isDraft = !assignment.isPublished;
  const totalStudents = memberStats?.students || 0;
  const submissionRate = totalStudents > 0 ? (assignment.totalSubmissions || 0) / totalStudents : 0;

  const getStatusInfo = () => {
    if (isDraft) {
      return {
        icon: Edit,
        text: "Draft",
        color: "text-foreground/60",
        bgColor: "bg-secondary-background"
      };
    }

    if (assignment.totalSubmissions === totalStudents && totalStudents > 0) {
      return {
        icon: CheckCircle2,
        text: "All Submitted",
        color: "text-main",
        bgColor: "bg-main/10"
      };
    } else if (isOverdue) {
      return {
        icon: AlertCircle,
        text: "Overdue",
        color: "text-red-600",
        bgColor: "bg-red-50"
      };
    } else {
      return {
        icon: Clock,
        text: "Active",
        color: "text-foreground",
        bgColor: "bg-secondary-background"
      };
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <DialogTitle className="text-2xl font-heading text-foreground mb-2">
                {assignment.title}
              </DialogTitle>
              <DialogDescription className="text-base text-foreground/80">
                {assignment.category || "Uncategorized"} • {assignment.totalPoints} points
              </DialogDescription>
            </div>

            <div className="flex items-center gap-3">
              <Badge
                variant="outline"
                className={cn("px-3 py-1", statusInfo.bgColor, statusInfo.color)}
              >
                <StatusIcon size={14} className="mr-1" />
                {statusInfo.text}
              </Badge>

              {isTeacher && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onEdit}
                >
                  <Edit size={16} />
                  Edit
                </Button>
              )}
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Overview */}
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Due Date */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-base bg-main/10 border-2 border-main/20 flex items-center justify-center">
                    <Calendar size={20} className="text-main" />
                  </div>
                  <div>
                    <p className="text-sm font-base text-foreground/70">Due Date</p>
                    <p className={cn(
                      "text-base font-heading",
                      isOverdue ? "text-red-600" : "text-foreground"
                    )}>
                      {assignment.dueDate
                        ? format(new Date(assignment.dueDate), "MMM d, yyyy 'at' h:mm a")
                        : "No due date"
                      }
                    </p>
                    {assignment.dueDate && (
                      <p className="text-xs text-foreground/60">
                        {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}
                      </p>
                    )}
                  </div>
                </div>

                {/* Points */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-base bg-main/10 border-2 border-main/20 flex items-center justify-center">
                    <Trophy size={20} className="text-main" />
                  </div>
                  <div>
                    <p className="text-sm font-base text-foreground/70">Total Points</p>
                    <p className="text-base font-heading text-foreground">
                      {assignment.totalPoints}
                    </p>
                  </div>
                </div>

                {/* Submissions (for teachers) */}
                {isTeacher && (
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-base bg-main/10 border-2 border-main/20 flex items-center justify-center">
                      <Users size={20} className="text-main" />
                    </div>
                    <div>
                      <p className="text-sm font-base text-foreground/70">Submissions</p>
                      <p className="text-base font-heading text-foreground">
                        {assignment.totalSubmissions || 0} / {totalStudents}
                      </p>
                      <p className="text-xs text-foreground/60">
                        {Math.round(submissionRate * 100)}% submitted
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Description */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen size={20} className="text-foreground/60" />
                <h3 className="text-lg font-heading text-foreground">Description</h3>
              </div>
              <p className="text-base text-foreground whitespace-pre-wrap">
                {assignment.description}
              </p>
            </CardContent>
          </Card>

          {/* Instructions */}
          {assignment.instructions && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText size={20} className="text-foreground/60" />
                  <h3 className="text-lg font-heading text-foreground">Instructions</h3>
                </div>
                <p className="text-base text-foreground whitespace-pre-wrap">
                  {assignment.instructions}
                </p>
              </CardContent>
            </Card>
          )}

          {/* Solution File (for teachers only) */}
          {isTeacher && solutionFile && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <Target size={20} className="text-foreground/60" />
                  <h3 className="text-lg font-heading text-foreground">Solution File</h3>
                </div>
                <FileDisplay
                  file={{
                    id: solutionFile._id,
                    name: solutionFile.fileName,
                    size: solutionFile.sizeBytes,
                    type: solutionFile.mimeType,
                    uploadedAt: solutionFile.uploadedAt
                  }}
                  showActions={true}
                />
              </CardContent>
            </Card>
          )}

          {/* Rubric */}
          {assignment.rubric && assignment.rubric.criteria.length > 0 && (
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center gap-2 mb-4">
                  <CheckCircle2 size={20} className="text-foreground/60" />
                  <h3 className="text-lg font-heading text-foreground">Grading Rubric</h3>
                </div>
                <div className="space-y-3">
                  {assignment.rubric.criteria.map((criterion, index) => (
                    <div key={index} className="border border-border rounded-base p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-base text-foreground font-medium">
                          {criterion.name}
                        </h4>
                        <Badge variant="outline" className="font-mono">
                          {criterion.points} pts
                        </Badge>
                      </div>
                      <p className="text-sm text-foreground/80">
                        {criterion.description}
                      </p>
                    </div>
                  ))}
                </div>
                <Separator className="my-4" />
                <div className="flex justify-between items-center text-sm font-medium">
                  <span className="text-foreground/70">Total Points:</span>
                  <span className="text-foreground">{assignment.totalPoints} pts</span>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-4">
            <Button variant="neutral" onClick={onClose}>
              Close
            </Button>
            {isTeacher && (
              <Button onClick={onEdit}>
                <Edit size={16} />
                Edit Assignment
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}