"use client";

import React, { useRef, useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import { Upload, X, FileIcon, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  purpose: "solution" | "submission" | "resource" | "rubric";
  classroomId?: Id<"classrooms">;
  assignmentId?: Id<"assignments">;
  submissionId?: Id<"submissions">;
  onUploadComplete?: (fileId: Id<"fileMetadata">) => void;
  onUploadError?: (error: string) => void;
  maxSizeMB?: number;
  acceptedFileTypes?: string[];
  multiple?: boolean;
  disabled?: boolean;
  className?: string;
}

interface UploadingFile {
  file: File;
  progress: number;
  status: "uploading" | "processing" | "completed" | "error";
  fileMetadataId?: Id<"fileMetadata">;
  error?: string;
}

export function FileUpload({
  purpose,
  classroomId,
  assignmentId,
  submissionId,
  onUploadComplete,
  onUploadError,
  maxSizeMB = 10,
  acceptedFileTypes = [
    ".pdf", ".doc", ".docx", ".txt", ".jpg", ".jpeg", ".png", ".zip"
  ],
  multiple = false,
  disabled = false,
  className
}: FileUploadProps) {
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const generateUploadUrl = useMutation(api.files.generateUploadUrl);
  const storeFileMetadata = useMutation(api.files.storeFileMetadata);

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File size must be less than ${maxSizeMB}MB`;
    }

    // Check file type
    const extension = `.${file.name.split('.').pop()?.toLowerCase()}`;
    if (!acceptedFileTypes.some(type =>
      type.toLowerCase() === extension ||
      file.type.includes(type.replace('.', ''))
    )) {
      return `File type not supported. Accepted types: ${acceptedFileTypes.join(', ')}`;
    }

    return null;
  };

  const uploadFile = async (file: File) => {
    const validation = validateFile(file);
    if (validation) {
      const errorFile: UploadingFile = {
        file,
        progress: 0,
        status: "error",
        error: validation
      };
      setUploadingFiles(prev => [...prev, errorFile]);
      onUploadError?.(validation);
      return;
    }

    const uploadingFile: UploadingFile = {
      file,
      progress: 0,
      status: "uploading"
    };

    setUploadingFiles(prev => [...prev, uploadingFile]);

    try {
      // Get upload URL
      const uploadUrl = await generateUploadUrl();

      // Create form data
      const formData = new FormData();
      formData.append("file", file);

      // Upload to Convex storage with progress tracking
      const response = await fetch(uploadUrl, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const { storageId } = await response.json();

      // Update progress to processing
      setUploadingFiles(prev =>
        prev.map(f =>
          f.file === file
            ? { ...f, progress: 100, status: "processing" as const }
            : f
        )
      );

      // Store file metadata
      const fileMetadataId = await storeFileMetadata({
        storageId: storageId as Id<"_storage">,
        fileName: file.name,
        mimeType: file.type,
        sizeBytes: file.size,
        purpose,
        classroomId,
        assignmentId,
        submissionId,
      });

      // Update to completed
      setUploadingFiles(prev =>
        prev.map(f =>
          f.file === file
            ? { ...f, status: "completed" as const, fileMetadataId }
            : f
        )
      );

      onUploadComplete?.(fileMetadataId);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Upload failed";
      setUploadingFiles(prev =>
        prev.map(f =>
          f.file === file
            ? { ...f, status: "error" as const, error: errorMessage }
            : f
        )
      );
      onUploadError?.(errorMessage);
    }
  };

  const handleFiles = (files: FileList) => {
    const fileArray = Array.from(files);

    if (!multiple && fileArray.length > 1) {
      onUploadError?.("Only one file can be uploaded at a time");
      return;
    }

    fileArray.forEach(uploadFile);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFiles(files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFiles(files);
    }
    // Reset input value to allow re-uploading same file
    e.target.value = "";
  };

  const removeUploadingFile = (file: File) => {
    setUploadingFiles(prev => prev.filter(f => f.file !== file));
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const getStatusIcon = (status: UploadingFile["status"]) => {
    switch (status) {
      case "uploading":
      case "processing":
        return <Loader2 size={16} className="animate-spin text-main" />;
      case "completed":
        return <FileIcon size={16} className="text-green-600" />;
      case "error":
        return <X size={16} className="text-red-600" />;
    }
  };

  const getStatusText = (uploadingFile: UploadingFile) => {
    switch (uploadingFile.status) {
      case "uploading":
        return `Uploading... ${uploadingFile.progress}%`;
      case "processing":
        return "Processing...";
      case "completed":
        return "Upload complete";
      case "error":
        return uploadingFile.error || "Upload failed";
    }
  };

  return (
    <div className={cn("space-y-4", className)}>
      <Card
        className={cn(
          "transition-colors cursor-pointer",
          isDragOver && "border-main bg-main/5",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && fileInputRef.current?.click()}
      >
        <CardContent className="p-8">
          <div className="flex flex-col items-center gap-4 text-center">
            <div className={cn(
              "w-12 h-12 rounded-base border-2 border-dashed flex items-center justify-center",
              isDragOver ? "border-main bg-main text-main-foreground" : "border-border"
            )}>
              <Upload size={24} />
            </div>

            <div>
              <h3 className="text-lg font-heading text-foreground mb-2">
                {multiple ? "Upload Files" : "Upload File"}
              </h3>
              <p className="text-sm font-base text-foreground opacity-60 mb-2">
                Drag and drop {multiple ? "files" : "a file"} here, or click to browse
              </p>
              <p className="text-xs font-base text-foreground opacity-40">
                Max {maxSizeMB}MB • {acceptedFileTypes.join(", ")}
              </p>
            </div>

            <Button variant="neutral" disabled={disabled}>
              Choose {multiple ? "Files" : "File"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={acceptedFileTypes.join(",")}
        onChange={handleFileSelect}
        className="hidden"
        disabled={disabled}
      />

      {uploadingFiles.length > 0 && (
        <div className="space-y-2">
          {uploadingFiles.map((uploadingFile, index) => (
            <Card key={index}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getStatusIcon(uploadingFile.status)}

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-base text-foreground truncate">
                        {uploadingFile.file.name}
                      </p>
                      <p className="text-xs font-base text-foreground opacity-60">
                        {formatFileSize(uploadingFile.file.size)} • {getStatusText(uploadingFile)}
                      </p>
                    </div>
                  </div>

                  {uploadingFile.status !== "completed" && (
                    <Button
                      variant="neutral"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeUploadingFile(uploadingFile.file);
                      }}
                    >
                      <X size={14} />
                    </Button>
                  )}
                </div>

                {/* Progress bar for uploading */}
                {uploadingFile.status === "uploading" && (
                  <div className="mt-2 w-full bg-secondary-background rounded-full h-2">
                    <div
                      className="bg-main h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadingFile.progress}%` }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}