"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { FileDisplay } from "@/components/ui/file-display";
import {
  Save,
  X,
  ArrowRight,
  ArrowLeft,
  Calendar,
  FileText,
  Target,
  Trash2,
  Eye,
  EyeOff,
  Send
} from "lucide-react";

interface EditAssignmentModalProps {
  assignmentId: Id<"assignments"> | null;
  isOpen: boolean;
  onClose: () => void;
  onAssignmentUpdated?: () => void;
}

interface RubricCriteria {
  name: string;
  description: string;
  points: number;
}

type Step = "basic" | "details" | "solution" | "rubric";

const ASSIGNMENT_CATEGORIES = [
  "Homework",
  "Lab Report",
  "Quiz",
  "Exam",
  "Project",
  "Essay",
  "Presentation",
  "Discussion",
  "Other"
];

export function EditAssignmentModal({
  assignmentId,
  isOpen,
  onClose,
  onAssignmentUpdated
}: EditAssignmentModalProps) {
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [totalPoints, setTotalPoints] = useState(100);
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [dueTime, setDueTime] = useState<string>("");
  const [isPublished, setIsPublished] = useState(false);
  const [acceptSubmissions, setAcceptSubmissions] = useState(false);
  const [solutionFileId, setSolutionFileId] = useState<Id<"fileMetadata"> | undefined>();
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriteria[]>([]);

  // Fetch assignment data
  const assignment = useQuery(
    api.assignments.getAssignment,
    assignmentId ? { assignmentId } : "skip"
  );

  const updateAssignment = useMutation(api.assignments.updateAssignment);
  const togglePublication = useMutation(api.assignments.toggleAssignmentPublication);
  const deleteAssignment = useMutation(api.assignments.deleteAssignment);

  // Initialize form when assignment data loads
  useEffect(() => {
    if (assignment) {
      setTitle(assignment.title);
      setDescription(assignment.description);
      setCategory(assignment.category || "");
      setTotalPoints(assignment.totalPoints);
      setInstructions(assignment.instructions || "");
      if (assignment.dueDate && assignment.dueDate !== 0) {
        const date = new Date(assignment.dueDate);
        setDueDate(date.toISOString().slice(0, 10)); // YYYY-MM-DD
        setDueTime(date.toTimeString().slice(0, 5)); // HH:MM
      } else {
        // Default to tomorrow at 11:59 PM for existing assignments without due dates
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        setDueDate(tomorrow.toISOString().slice(0, 10));
        setDueTime("23:59");
      }
      setIsPublished(assignment.isPublished);
      setAcceptSubmissions(assignment.acceptSubmissions);
      setSolutionFileId(assignment.solutionFileId);
      setRubricCriteria(assignment.rubric?.criteria || []);
    }
  }, [assignment]);

  const steps: Record<Step, { title: string; description: string; icon: any }> = {
    basic: {
      title: "Basic Information",
      description: "Title, description, and category",
      icon: FileText
    },
    details: {
      title: "Assignment Details",
      description: "Instructions and due date",
      icon: Calendar
    },
    solution: {
      title: "Solution File",
      description: "Upload teacher solution (optional)",
      icon: FileText
    },
    rubric: {
      title: "Grading Rubric",
      description: "Create rubric criteria (optional)",
      icon: Target
    }
  };

  const stepOrder: Step[] = ["basic", "details", "solution", "rubric"];

  const handleSubmit = async () => {
    if (!assignmentId || !title.trim() || totalPoints <= 0 || !dueDate || !dueTime) {
      return;
    }

    setIsSubmitting(true);
    try {
      await updateAssignment({
        assignmentId,
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim() || undefined,
        dueDate: new Date(`${dueDate}T${dueTime}`).getTime(),
        totalPoints,
        category: category || undefined,
        solutionFileId: solutionFileId,
        rubric: rubricCriteria.length > 0 ? { criteria: rubricCriteria } : undefined,
        isPublished,
        acceptSubmissions,
      });

      onAssignmentUpdated?.();
      onClose();
    } catch (error) {
      console.error("Failed to update assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!assignmentId) return;

    setIsSubmitting(true);
    try {
      await togglePublication({
        assignmentId,
        isPublished: !isPublished
      });
      setIsPublished(!isPublished);
      setAcceptSubmissions(!isPublished); // Auto-enable submissions when publishing
      onAssignmentUpdated?.();
    } catch (error) {
      console.error("Failed to toggle publication:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!assignmentId) return;

    setIsSubmitting(true);
    try {
      await deleteAssignment({ assignmentId });
      onAssignmentUpdated?.();
      onClose();
    } catch (error) {
      console.error("Failed to delete assignment:", error);
    } finally {
      setIsSubmitting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleSolutionUpload = (fileId: Id<"fileMetadata">) => {
    setSolutionFileId(fileId);
  };

  const addRubricCriteria = () => {
    setRubricCriteria([...rubricCriteria, { name: "", description: "", points: 0 }]);
  };

  const updateRubricCriteria = (index: number, field: keyof RubricCriteria, value: string | number) => {
    const updated = rubricCriteria.map((criteria, i) =>
      i === index ? { ...criteria, [field]: value } : criteria
    );
    setRubricCriteria(updated);
  };

  const removeRubricCriteria = (index: number) => {
    setRubricCriteria(rubricCriteria.filter((_, i) => i !== index));
  };

  const getCurrentStepIndex = () => stepOrder.indexOf(currentStep);
  const isFirstStep = getCurrentStepIndex() === 0;
  const isLastStep = getCurrentStepIndex() === stepOrder.length - 1;

  const canProceed = () => {
    switch (currentStep) {
      case "basic":
        return title.trim() && description.trim() && totalPoints > 0;
      case "details":
        return true;
      case "solution":
        return true;
      case "rubric":
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (!isLastStep && canProceed()) {
      setCurrentStep(stepOrder[getCurrentStepIndex() + 1]);
    }
  };

  const prevStep = () => {
    if (!isFirstStep) {
      setCurrentStep(stepOrder[getCurrentStepIndex() - 1]);
    }
  };

  if (!isOpen || !assignment) {
    return null;
  }

  if (showDeleteConfirm) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
        <Card className="max-w-md">
          <CardContent className="p-6">
            <h3 className="text-lg font-heading text-foreground mb-4">
              Delete Assignment
            </h3>
            <p className="text-base font-base text-foreground opacity-80 mb-6">
              Are you sure you want to delete "{assignment.title}"? This will also delete all student submissions and cannot be undone.
            </p>
            <div className="flex items-center gap-3 justify-end">
              <Button
                variant="neutral"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                variant="noShadow"
                onClick={handleDelete}
                disabled={isSubmitting}
                className="text-red-600 border-red-600"
              >
                <Trash2 size={16} />
                {isSubmitting ? "Deleting..." : "Delete Assignment"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const StepIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
      <Card className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <CardContent className="p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-base bg-main border-2 border-border shadow-shadow flex items-center justify-center">
                <StepIcon size={24} className="text-main-foreground" />
              </div>
              <div>
                <h3 className="text-xl font-heading text-foreground">
                  Edit Assignment: {assignment.title}
                </h3>
                <p className="text-sm font-base text-foreground opacity-60">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-2 rounded-base hover:bg-secondary-background transition-colors"
            >
              <X size={20} className="text-foreground opacity-60" />
            </button>
          </div>

          {/* Publication Status Banner */}
          <div className={`p-4 rounded-base border-2 mb-6 ${
            isPublished
              ? "bg-main/10 border-main text-main"
              : "bg-secondary-background border-border text-foreground opacity-60"
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isPublished ? <Eye size={16} /> : <EyeOff size={16} />}
                <span className="text-sm font-heading">
                  {isPublished ? "Published" : "Draft"}
                </span>
                <span className="text-xs font-base opacity-80">
                  {isPublished
                    ? "Students can see this assignment"
                    : "Only visible to instructors"
                  }
                </span>
              </div>
              <Button
                variant="neutral"
                size="sm"
                onClick={handlePublishToggle}
                disabled={isSubmitting}
              >
                {isPublished ? <EyeOff size={16} /> : <Eye size={16} />}
                {isPublished ? "Unpublish" : "Publish"}
              </Button>
            </div>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center gap-4 mb-8">
            {stepOrder.map((step, index) => {
              const StepIconComponent = steps[step].icon;
              const isCurrent = step === currentStep;
              const isPast = index < getCurrentStepIndex();

              return (
                <div key={step} className="flex items-center gap-4">
                  <div
                    className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                      isCurrent
                        ? "bg-main border-main text-main-foreground"
                        : isPast
                        ? "bg-main border-main text-main-foreground"
                        : "bg-background border-border text-foreground opacity-40"
                    }`}
                  >
                    <StepIconComponent size={16} />
                  </div>
                  {index < stepOrder.length - 1 && (
                    <div
                      className={`w-12 h-0.5 ${
                        isPast ? "bg-main" : "bg-border"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Step Content */}
          <div className="space-y-6">
            {currentStep === "basic" && (
              <>
                <div>
                  <label className="block text-sm font-heading text-foreground mb-2">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title..."
                    className="w-full p-3 text-base font-base bg-secondary-background border-2 border-border rounded-base focus:outline-none focus:ring-2 focus:ring-black"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-heading text-foreground mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what students need to do..."
                    className="w-full min-h-[100px] p-3 text-base font-base bg-secondary-background border-2 border-border rounded-base focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-heading text-foreground mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3 text-base font-base bg-secondary-background border-2 border-border rounded-base focus:outline-none focus:ring-2 focus:ring-black"
                      disabled={isSubmitting}
                    >
                      <option value="">Select category...</option>
                      {ASSIGNMENT_CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-heading text-foreground mb-2">
                      Total Points *
                    </label>
                    <input
                      type="number"
                      value={totalPoints}
                      onChange={(e) => setTotalPoints(parseInt(e.target.value) || 0)}
                      min="1"
                      max="1000"
                      className="w-full p-3 text-base font-base bg-secondary-background border-2 border-border rounded-base focus:outline-none focus:ring-2 focus:ring-black"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {currentStep === "details" && (
              <>
                <div>
                  <label className="block text-sm font-heading text-foreground mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Detailed instructions for students (optional)..."
                    className="w-full min-h-[150px] p-3 text-base font-base bg-secondary-background border-2 border-border rounded-base focus:outline-none focus:ring-2 focus:ring-black resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-heading text-foreground mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-3 text-base font-base bg-secondary-background border-2 border-border rounded-base focus:outline-none focus:ring-2 focus:ring-black"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-heading text-foreground mb-2">
                      Due Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full p-3 text-base font-base bg-secondary-background border-2 border-border rounded-base focus:outline-none focus:ring-2 focus:ring-black"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={acceptSubmissions}
                      onChange={(e) => setAcceptSubmissions(e.target.checked)}
                      className="sr-only"
                      disabled={isSubmitting}
                    />
                    <div
                      className={`w-5 h-5 rounded-base border-2 border-border flex items-center justify-center transition-colors ${
                        acceptSubmissions ? "bg-main text-main-foreground" : "bg-background"
                      }`}
                    >
                      {acceptSubmissions && <Send size={12} />}
                    </div>
                    <span className="text-sm font-base text-foreground">
                      Accept student submissions
                    </span>
                  </label>
                </div>
              </>
            )}

            {currentStep === "solution" && (
              <div>
                <h4 className="text-lg font-heading text-foreground mb-4">
                  Solution File (Optional)
                </h4>
                <p className="text-sm font-base text-foreground opacity-80 mb-4">
                  Upload a solution file that will be used for AI comparison with student submissions.
                </p>

                {!solutionFileId ? (
                  <FileUpload
                    purpose="solution"
                    classroomId={assignment.classroomId}
                    assignmentId={assignmentId}
                    onUploadComplete={handleSolutionUpload}
                    maxSizeMB={50}
                    disabled={isSubmitting}
                  />
                ) : (
                  <div>
                    <p className="text-sm font-heading text-foreground mb-2">Solution File:</p>
                    <FileDisplay
                      fileMetadataId={solutionFileId}
                      showDownload={true}
                      showDelete={true}
                      onDelete={() => setSolutionFileId(undefined)}
                    />
                  </div>
                )}
              </div>
            )}

            {currentStep === "rubric" && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-heading text-foreground">
                      Grading Rubric (Optional)
                    </h4>
                    <p className="text-sm font-base text-foreground opacity-80">
                      Create detailed criteria for grading this assignment.
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="neutral"
                    size="sm"
                    onClick={addRubricCriteria}
                    disabled={isSubmitting}
                  >
                    <Target size={16} />
                    Add Criteria
                  </Button>
                </div>

                {rubricCriteria.length === 0 ? (
                  <div className="text-center py-8 text-foreground opacity-60">
                    <Target size={48} className="mx-auto mb-4 opacity-40" />
                    <p>No rubric criteria added yet.</p>
                    <p className="text-sm">Add criteria to help with consistent grading.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rubricCriteria.map((criteria, index) => (
                      <Card key={index}>
                        <CardContent className="p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-3">
                              <input
                                type="text"
                                value={criteria.name}
                                onChange={(e) => updateRubricCriteria(index, "name", e.target.value)}
                                placeholder="Criteria name (e.g., 'Content Quality')"
                                className="w-full p-2 text-sm font-base bg-background border border-border rounded-base focus:outline-none focus:ring-1 focus:ring-black"
                              />
                              <textarea
                                value={criteria.description}
                                onChange={(e) => updateRubricCriteria(index, "description", e.target.value)}
                                placeholder="Description of what this criteria evaluates..."
                                className="w-full min-h-[60px] p-2 text-sm font-base bg-background border border-border rounded-base focus:outline-none focus:ring-1 focus:ring-black resize-none"
                              />
                              <input
                                type="number"
                                value={criteria.points}
                                onChange={(e) => updateRubricCriteria(index, "points", parseInt(e.target.value) || 0)}
                                placeholder="Points"
                                min="0"
                                max={totalPoints}
                                className="w-24 p-2 text-sm font-base bg-background border border-border rounded-base focus:outline-none focus:ring-1 focus:ring-black"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="neutral"
                              size="sm"
                              onClick={() => removeRubricCriteria(index)}
                            >
                              <X size={14} />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t-2 border-border">
            <div className="flex items-center gap-3">
              {!isFirstStep && (
                <Button
                  type="button"
                  variant="neutral"
                  onClick={prevStep}
                  disabled={isSubmitting}
                >
                  <ArrowLeft size={16} />
                  Back
                </Button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="neutral"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting}
                className="text-red-600"
              >
                <Trash2 size={16} />
                Delete
              </Button>

              <Button
                type="button"
                variant="neutral"
                onClick={onClose}
                disabled={isSubmitting}
              >
                Cancel
              </Button>

              {!isLastStep ? (
                <Button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed() || isSubmitting}
                >
                  Next
                  <ArrowRight size={16} />
                </Button>
              ) : (
                <Button
                  type="button"
                  onClick={handleSubmit}
                  disabled={!canProceed() || isSubmitting}
                >
                  <Save size={16} />
                  {isSubmitting ? "Saving..." : "Save Changes"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}