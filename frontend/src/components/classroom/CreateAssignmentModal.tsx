"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { FileDisplay } from "@/components/ui/file-display";
import {
  Plus,
  Send,
  X,
  ArrowRight,
  ArrowLeft,
  Calendar,
  FileText,
  Target,
  Save
} from "lucide-react";

interface CreateAssignmentModalProps {
  classroomId: Id<"classrooms">;
  onClose?: () => void;
  onAssignmentCreated?: (assignmentId: Id<"assignments">) => void;
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

export function CreateAssignmentModal({
  classroomId,
  onClose,
  onAssignmentCreated
}: CreateAssignmentModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState<Step>("basic");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [totalPoints, setTotalPoints] = useState(100);
  const [instructions, setInstructions] = useState("");
  const [dueDate, setDueDate] = useState<string>("");
  const [dueTime, setDueTime] = useState<string>("");
  const [solutionFileId, setSolutionFileId] = useState<Id<"fileMetadata"> | undefined>();
  const [rubricCriteria, setRubricCriteria] = useState<RubricCriteria[]>([]);

  const createAssignment = useMutation(api.assignments.createAssignment);

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

  const handleSubmit = async (asDraft = false) => {
    if (!title.trim() || totalPoints <= 0 || !dueDate || !dueTime) {
      return;
    }

    setIsSubmitting(true);
    try {
      const assignmentId = await createAssignment({
        classroomId,
        title: title.trim(),
        description: description.trim(),
        instructions: instructions.trim() || undefined,
        dueDate: new Date(`${dueDate}T${dueTime}`).getTime(),
        totalPoints,
        category: category || undefined,
        solutionFileId: solutionFileId,
        rubric: rubricCriteria.length > 0 ? { criteria: rubricCriteria } : undefined,
      });

      // Reset form
      setTitle("");
      setDescription("");
      setCategory("");
      setTotalPoints(100);
      setInstructions("");
      setDueDate("");
      setDueTime("");
      setSolutionFileId(undefined);
      setRubricCriteria([]);
      setCurrentStep("basic");
      setIsOpen(false);

      onAssignmentCreated?.(assignmentId);
    } catch (error) {
      console.error("Failed to create assignment:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setTitle("");
    setDescription("");
    setCategory("");
    setTotalPoints(100);
    setInstructions("");
    setDueDate("");
    setDueTime("");
    setSolutionFileId(undefined);
    setRubricCriteria([]);
    setCurrentStep("basic");
    setIsOpen(false);
    onClose?.();
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
        return true; // Instructions and due date are optional
      case "solution":
        return true; // Solution file is optional
      case "rubric":
        return true; // Rubric is optional
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

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
      >
        <Plus size={20} />
        Create a new assignment
      </button>
    );
  }

  const StepIcon = steps[currentStep].icon;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-8">
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-teal-500 flex items-center justify-center">
                <StepIcon size={24} className="text-white" />
              </div>
              <div>
                <h3 className="text-xl font-heading text-gray-900">
                  {steps[currentStep].title}
                </h3>
                <p className="text-sm font-base text-gray-600">
                  {steps[currentStep].description}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleCancel}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <X size={20} className="text-gray-500" />
            </button>
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
                        ? "bg-teal-500 border-teal-500 text-white"
                        : isPast
                        ? "bg-teal-500 border-teal-500 text-white"
                        : "bg-gray-100 border-gray-300 text-gray-400"
                    }`}
                  >
                    <StepIconComponent size={16} />
                  </div>
                  {index < stepOrder.length - 1 && (
                    <div
                      className={`w-12 h-0.5 ${
                        isPast ? "bg-teal-500" : "bg-gray-300"
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
                  <label className="block text-sm font-heading text-gray-900 mb-2">
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Enter assignment title..."
                    className="w-full p-3 text-base font-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                    disabled={isSubmitting}
                    autoFocus
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-heading text-gray-900 mb-2">
                    Description *
                  </label>
                  <textarea
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Describe what students need to do..."
                    className="w-full min-h-[100px] p-3 text-base font-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                    disabled={isSubmitting}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-heading text-gray-900 mb-2">
                      Category
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full p-3 text-base font-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                    <label className="block text-sm font-heading text-gray-900 mb-2">
                      Total Points *
                    </label>
                    <input
                      type="number"
                      value={totalPoints}
                      onChange={(e) => setTotalPoints(parseInt(e.target.value) || 0)}
                      min="1"
                      max="1000"
                      className="w-full p-3 text-base font-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
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
                  <label className="block text-sm font-heading text-gray-900 mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Detailed instructions for students (optional)..."
                    className="w-full min-h-[150px] p-3 text-base font-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
                    disabled={isSubmitting}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-heading text-gray-900 mb-2">
                      Due Date <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="w-full p-3 text-base font-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      disabled={isSubmitting}
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-heading text-gray-900 mb-2">
                      Due Time <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="time"
                      value={dueTime}
                      onChange={(e) => setDueTime(e.target.value)}
                      className="w-full p-3 text-base font-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {currentStep === "solution" && (
              <div>
                <h4 className="text-lg font-heading text-gray-900 mb-4">
                  Solution File (Optional)
                </h4>
                <p className="text-sm font-base text-gray-600 mb-4">
                  Upload a solution file that will be used for AI comparison with student submissions.
                </p>

                {!solutionFileId ? (
                  <FileUpload
                    purpose="solution"
                    classroomId={classroomId}
                    onUploadComplete={handleSolutionUpload}
                    maxSizeMB={50}
                    disabled={isSubmitting}
                  />
                ) : (
                  <div>
                    <p className="text-sm font-heading text-gray-900 mb-2">Solution File:</p>
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
                    <h4 className="text-lg font-heading text-gray-900">
                      Grading Rubric (Optional)
                    </h4>
                    <p className="text-sm font-base text-gray-600">
                      Create detailed criteria for grading this assignment.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={addRubricCriteria}
                    disabled={isSubmitting}
                    className="bg-teal-500 hover:bg-teal-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 text-sm transition-colors"
                  >
                    <Plus size={16} />
                    Add Criteria
                  </button>
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
                      <div key={index} className="bg-gray-50 rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start gap-4">
                            <div className="flex-1 space-y-3">
                              <input
                                type="text"
                                value={criteria.name}
                                onChange={(e) => updateRubricCriteria(index, "name", e.target.value)}
                                placeholder="Criteria name (e.g., 'Content Quality')"
                                className="w-full p-2 text-sm font-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                              />
                              <textarea
                                value={criteria.description}
                                onChange={(e) => updateRubricCriteria(index, "description", e.target.value)}
                                placeholder="Description of what this criteria evaluates..."
                                className="w-full min-h-[60px] p-2 text-sm font-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500 resize-none"
                              />
                              <input
                                type="number"
                                value={criteria.points}
                                onChange={(e) => updateRubricCriteria(index, "points", parseInt(e.target.value) || 0)}
                                placeholder="Points"
                                min="0"
                                max={totalPoints}
                                className="w-24 p-2 text-sm font-base bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-teal-500 focus:border-teal-500"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => removeRubricCriteria(index)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 rounded transition-colors"
                            >
                              <X size={14} />
                            </button>
                          </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-200">
            <div className="flex items-center gap-3">
              {!isFirstStep && (
                <button
                  type="button"
                  onClick={prevStep}
                  disabled={isSubmitting}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>
              )}
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleCancel}
                disabled={isSubmitting}
                className="text-gray-600 hover:text-gray-800 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
              >
                Cancel
              </button>

              {/* Save as Draft option on any step */}
              <button
                type="button"
                onClick={() => handleSubmit(true)}
                disabled={!title.trim() || totalPoints <= 0 || isSubmitting}
                className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save size={16} />
                Save as Draft
              </button>

              {!isLastStep ? (
                <button
                  type="button"
                  onClick={nextStep}
                  disabled={!canProceed() || isSubmitting}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={!canProceed() || isSubmitting}
                  className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send size={16} />
                  {isSubmitting ? "Creating..." : "Create Assignment"}
                </button>
              )}
            </div>
          </div>
          </form>
          </div>
        </div>
      </div>
    </>
  );
}