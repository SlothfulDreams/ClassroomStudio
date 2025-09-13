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
}

export function AssignmentCard({ assignment, userRole }: AssignmentCardProps) {
  const isTeacher = userRole === "instructor" || userRole === "ta";
  const isOverdue = isAfter(new Date(), new Date(assignment.dueDate));
  const isDraft = assignment.status === "draft";

  const getStatusInfo = () => {
    if (isDraft) {
      return {
        icon: Edit,
        text: "Draft",
        color: "text-foreground opacity-60"
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
          color: "text-foreground opacity-80"
        };
      } else {
        return {
          icon: Users,
          text: `${assignment.submissionCount}/${assignment.totalStudents} submitted`,
          color: "text-foreground opacity-80"
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
          color: "text-foreground opacity-80"
        };
      }
    }
  };

  const statusInfo = getStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card className={cn(
      "cursor-pointer hover:translate-x-boxShadowX hover:translate-y-boxShadowY transition-all duration-200",
      isDraft && "opacity-75 border-dashed"
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-base bg-main border-2 border-border shadow-shadow flex items-center justify-center">
                <FileText size={20} className="text-main-foreground" />
              </div>
              <div>
                <h3 className="text-lg font-heading text-foreground">
                  {assignment.title}
                </h3>
                <p className="text-sm font-base text-foreground opacity-60">
                  {assignment.category} • {assignment.points} points
                </p>
              </div>
            </div>

            <p className="text-sm font-base text-foreground opacity-80 line-clamp-2 mb-4">
              {assignment.description}
            </p>

            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Calendar size={14} className="text-foreground opacity-60" />
                <span className={cn(
                  "font-base",
                  isOverdue ? "text-red-600" : "text-foreground opacity-80"
                )}>
                  Due {formatDistanceToNow(new Date(assignment.dueDate), { addSuffix: true })}
                </span>
              </div>

              <div className={cn("flex items-center gap-1", statusInfo.color)}>
                <StatusIcon size={14} />
                <span className="font-base">{statusInfo.text}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {isTeacher ? (
              <>
                <Button variant="neutral" size="sm">
                  <Eye size={16} />
                  View
                </Button>
                <Button variant="noShadow" size="sm">
                  <Edit size={16} />
                  Edit
                </Button>
              </>
            ) : (
              <Button size="sm">
                {assignment.status === "graded" ? "View Results" : "Open"}
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}