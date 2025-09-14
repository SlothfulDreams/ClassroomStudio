import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Calendar,
  Clock,
  FileText,
  Users,
  CheckCircle2,
  AlertCircle,
  Eye,
  Edit
} from "lucide-react";
import { formatDistanceToNow, isAfter } from "date-fns";

interface Assignment {
  id: string;
  title: string;
  description: string;
  dueDate: number;
  points: number;
  category: string;
  status: "assigned" | "graded" | "draft";
  submissionCount: number;
  totalStudents: number;
}

interface AssignmentCardProps {
  assignment: Assignment;
  userRole: "instructor" | "ta" | "student";
  onEdit?: (assignmentId: string) => void;
  onView?: (assignmentId: string) => void;
}

export function AssignmentCard({ assignment, userRole, onEdit, onView }: AssignmentCardProps) {
  const isTeacher = userRole === "instructor" || userRole === "ta";
  const hasValidDueDate = assignment.dueDate && assignment.dueDate !== 0; // Any valid timestamp
  const isOverdue = hasValidDueDate ? isAfter(new Date(), new Date(assignment.dueDate)) : false;
  const isDraft = assignment.status === "draft";

  const getStatusInfo = () => {
    if (isDraft) {
      return {
        icon: Edit,
        text: "Draft",
        color: "text-foreground/60"
      };
    }

    if (isTeacher) {
      const submissionRate = (assignment.submissionCount / assignment.totalStudents) * 100;
      if (assignment.status === "graded") {
        return {
          icon: CheckCircle2,
          text: "Graded",
          color: "text-main"
        };
      } else if (isOverdue) {
        return {
          icon: AlertCircle,
          text: `${Math.round(submissionRate)}% submitted`,
          color: "text-foreground"
        };
      } else {
        return {
          icon: Users,
          text: `${assignment.submissionCount}/${assignment.totalStudents} submitted`,
          color: "text-foreground"
        };
      }
    } else {
      // Student view
      if (assignment.status === "graded") {
        return {
          icon: CheckCircle2,
          text: "Graded",
          color: "text-main"
        };
      } else if (isOverdue) {
        return {
          icon: AlertCircle,
          text: "Overdue",
          color: "text-red-600"
        };
      } else {
        return {
          icon: Clock,
          text: "Assigned",
          color: "text-foreground"
        };
      }
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <div className={cn(
      "bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow cursor-pointer",
      isDraft && "border-dashed border-gray-300"
    )}>
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="w-12 h-12 rounded-lg bg-teal-500 flex items-center justify-center">
            <FileText size={24} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg font-heading text-gray-900">
                {assignment.title}
              </h3>
            </div>
            <p className="text-sm font-base text-gray-600 mb-1">
              {assignment.category} • {assignment.points} points
            </p>
            <p className="text-sm font-base text-gray-500 line-clamp-1">
              {assignment.description}
            </p>

            <div className="flex items-center gap-4 text-sm mt-2">
              {hasValidDueDate && (
                <span className={cn(
                  "font-base",
                  isOverdue ? "text-red-600" : "text-gray-600"
                )}>
                  Due in {formatDistanceToNow(new Date(assignment.dueDate))}
                </span>
              )}

              <div className={cn("flex items-center gap-1")}>
                <span className={cn(
                  "px-2 py-1 rounded-full text-xs font-base",
                  assignment.status === "graded" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"
                )}>
                  {statusInfo.text}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 ml-4">
          {isTeacher ? (
            <>
              <button
                className="text-gray-600 hover:text-gray-900 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                onClick={() => onView?.(assignment.id)}
                title="View"
              >
                <Eye size={16} />
                <span className="sr-only">View</span>
              </button>
              <button
                className="text-teal-600 hover:text-teal-700 p-2 rounded-lg hover:bg-teal-50 transition-colors"
                onClick={() => onEdit?.(assignment.id)}
                title="Edit"
              >
                <Edit size={16} />
                <span className="sr-only">Edit</span>
              </button>
            </>
          ) : (
            <button
              className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg text-sm font-base transition-colors"
              onClick={() => onView?.(assignment.id)}
            >
              {assignment.status === "graded" ? "View Results" : "Open"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}