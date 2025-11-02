"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUpload } from "@/components/ui/file-upload";
import { Separator } from "@/components/ui/separator";
import {
  Upload,
  FileText,
  Clock,
  CheckCircle2,
  AlertTriangle,
  X,
  Download,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface SubmissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignmentId: Id<"assignments">;
  assignmentTitle: string;
  dueDate?: number;
  acceptSubmissions: boolean;
  totalPoints: number;
}

export function SubmissionModal({
  isOpen,
  onClose,
  assignmentId,
  assignmentTitle,
  dueDate,
  acceptSubmissions,
  totalPoints,
}: SubmissionModalProps) {
  const [uploadedFileMetadataId, setUploadedFileMetadataId] =
    useState<Id<"fileMetadata"> | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mySubmission = useQuery(api.submissions.getMySubmission, {
    assignmentId,
  });
  const submitAssignment = useMutation(api.submissions.submitAssignment);
  const saveDraft = useMutation(api.submissions.saveDraft);
  const withdrawSubmission = useMutation(api.submissions.withdrawSubmission);

  const hasValidDueDate = dueDate && dueDate !== 0;
  const isOverdue = hasValidDueDate ? Date.now() > dueDate : false;
  const hasExistingSubmission = !!mySubmission;
  const isSubmitted = mySubmission?.status === "submitted";
  const isDraft = mySubmission?.status === "draft";
  const isGraded =
    mySubmission?.status === "graded" || mySubmission?.status === "returned";

  useEffect(() => {
    if (!isOpen) {
      setUploadedFileMetadataId(null);
    }
  }, [isOpen]);

  const handleFileUploadComplete = (fileMetadataId: Id<"fileMetadata">) => {
    setUploadedFileMetadataId(fileMetadataId);
  };

  const handleSubmit = async () => {
    if (!uploadedFileMetadataId) {
      alert("Please upload a file first");
      return;
    }

    setIsSubmitting(true);
    try {
      await submitAssignment({
        assignmentId,
        fileMetadataId: uploadedFileMetadataId,
      });
      onClose();
    } catch (error) {
      console.error("Submission failed:", error);
      alert(error instanceof Error ? error.message : "Submission failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSaveDraft = async () => {
    if (!uploadedFileMetadataId) {
      alert("Please upload a file first");
      return;
    }

    try {
      await saveDraft({
        assignmentId,
        fileMetadataId: uploadedFileMetadataId,
      });
      onClose();
    } catch (error) {
      console.error("Save draft failed:", error);
      alert(error instanceof Error ? error.message : "Failed to save draft");
    }
  };

  const handleWithdraw = async () => {
    if (!mySubmission?._id) return;

    if (
      confirm(
        "Are you sure you want to withdraw your submission? This will mark it as a draft.",
      )
    ) {
      try {
        await withdrawSubmission({ submissionId: mySubmission._id });
      } catch (error) {
        console.error("Withdraw failed:", error);
        alert(
          error instanceof Error
            ? error.message
            : "Failed to withdraw submission",
        );
      }
    }
  };

  const getStatusDisplay = () => {
    if (!hasExistingSubmission) {
      return {
        icon: Upload,
        text: "Not submitted",
        color: "text-foreground/60",
        bgColor: "bg-secondary-background",
      };
    }

    if (isGraded) {
      return {
        icon: CheckCircle2,
        text: `Graded: ${mySubmission.pointsEarned}/${totalPoints} points`,
        color: "text-green-600",
        bgColor: "bg-green-50",
      };
    }

    if (isSubmitted) {
      return {
        icon: CheckCircle2,
        text: mySubmission.isLate ? "Submitted (Late)" : "Submitted",
        color: mySubmission.isLate ? "text-orange-600" : "text-main",
        bgColor: mySubmission.isLate ? "bg-orange-50" : "bg-blue-50",
      };
    }

    if (isDraft) {
      return {
        icon: FileText,
        text: "Saved as draft",
        color: "text-foreground/60",
        bgColor: "bg-secondary-background",
      };
    }

    return {
      icon: Clock,
      text: "Unknown status",
      color: "text-foreground/60",
      bgColor: "bg-secondary-background",
    };
  };

  const statusDisplay = getStatusDisplay();
  const StatusIcon = statusDisplay.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-heading">
            {assignmentTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Assignment Info */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-heading text-foreground">
                    Assignment Details
                  </h4>
                  <p className="text-sm font-base text-foreground/70">
                    {totalPoints} points •{" "}
                    {hasValidDueDate && (
                      <span className={cn(isOverdue && "text-red-600")}>
                        Due{" "}
                        {formatDistanceToNow(new Date(dueDate), {
                          addSuffix: true,
                        })}
                      </span>
                    )}
                  </p>
                </div>
                <div
                  className={cn(
                    "px-3 py-1 rounded-base border-2 border-border flex items-center gap-2",
                    statusDisplay.bgColor,
                  )}
                >
                  <StatusIcon size={16} className={statusDisplay.color} />
                  <span
                    className={cn("text-sm font-base", statusDisplay.color)}
                  >
                    {statusDisplay.text}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Submission */}
          {hasExistingSubmission && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">
                  Your Current Submission
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText size={20} className="text-main" />
                    <div>
                      <p className="font-base text-foreground">
                        {mySubmission.fileName}
                      </p>
                      <p className="text-sm font-base text-foreground/60">
                        Submitted{" "}
                        {formatDistanceToNow(
                          new Date(mySubmission.submittedAt),
                          { addSuffix: true },
                        )}
                        {mySubmission.attemptNumber > 1 &&
                          ` • Attempt ${mySubmission.attemptNumber}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="neutral" size="sm">
                      <Download size={16} />
                      View
                    </Button>
                    {isSubmitted && !isGraded && (
                      <Button
                        variant="neutral"
                        size="sm"
                        onClick={handleWithdraw}
                        className="text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Withdraw
                      </Button>
                    )}
                  </div>
                </div>

                {mySubmission.teacherFeedback && (
                  <div className="mt-4 p-4 bg-secondary-background rounded-base border-2 border-border">
                    <h5 className="font-heading text-foreground mb-2">
                      Teacher Feedback
                    </h5>
                    <p className="text-sm font-base text-foreground/80">
                      {mySubmission.teacherFeedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Upload Section */}
          {(!hasExistingSubmission ||
            isDraft ||
            (!acceptSubmissions && !isGraded)) && (
            <>
              <Separator />
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    {hasExistingSubmission
                      ? "Update Submission"
                      : "Submit Assignment"}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!acceptSubmissions && !isOverdue ? (
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 rounded-base border-2 border-yellow-200">
                      <AlertTriangle size={20} className="text-yellow-600" />
                      <div>
                        <p className="font-base text-yellow-800">
                          Assignment not accepting submissions
                        </p>
                        <p className="text-sm font-base text-yellow-700">
                          The teacher has disabled submissions for this
                          assignment.
                        </p>
                      </div>
                    </div>
                  ) : isOverdue ? (
                    <div className="flex items-center gap-3 p-4 bg-red-50 rounded-base border-2 border-red-200">
                      <AlertTriangle size={20} className="text-red-600" />
                      <div>
                        <p className="font-base text-red-800">
                          Assignment is overdue
                        </p>
                        <p className="text-sm font-base text-red-700">
                          Late submissions may not be accepted. Check with your
                          teacher.
                        </p>
                      </div>
                    </div>
                  ) : null}

                  <FileUpload
                    purpose="submission"
                    assignmentId={assignmentId}
                    onUploadComplete={handleFileUploadComplete}
                    onUploadError={(error) => alert(error)}
                    acceptedFileTypes={[".pdf"]}
                    maxSizeMB={25}
                    multiple={false}
                    disabled={!acceptSubmissions && !isOverdue}
                  />

                  <div className="flex items-center justify-between pt-4">
                    <Button
                      variant="neutral"
                      onClick={onClose}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="neutral"
                        onClick={handleSaveDraft}
                        disabled={!uploadedFileMetadataId || isSubmitting}
                      >
                        Save Draft
                      </Button>
                      <Button
                        onClick={handleSubmit}
                        disabled={
                          !uploadedFileMetadataId ||
                          isSubmitting ||
                          (!acceptSubmissions && !isOverdue)
                        }
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <Upload size={16} />
                            {hasExistingSubmission ? "Resubmit" : "Submit"}
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
