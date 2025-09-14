"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "./button";
import { Card, CardContent } from "./card";
import {
  FileIcon,
  Download,
  Trash2,
  FileText,
  Image as ImageIcon,
  Archive,
  Video,
  Music
} from "lucide-react";
import { cn } from "@/lib/utils";

interface FileDisplayProps {
  fileMetadataId: Id<"fileMetadata">;
  showDownload?: boolean;
  showDelete?: boolean;
  onDelete?: () => void;
  className?: string;
  compact?: boolean;
}

export function FileDisplay({
  fileMetadataId,
  showDownload = true,
  showDelete = false,
  onDelete,
  className,
  compact = false
}: FileDisplayProps) {
  const fileMetadata = useQuery(api.files.getFileMetadata, { fileMetadataId });
  const fileUrl = useQuery(
    api.files.getFileUrl,
    showDownload ? { fileMetadataId } : "skip"
  );

  if (!fileMetadata) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardContent className={compact ? "p-3" : "p-4"}>
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-secondary-background rounded" />
            <div className="flex-1">
              <div className="h-4 bg-secondary-background rounded mb-1" />
              <div className="h-3 bg-secondary-background rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getFileIcon = (mimeType: string, fileName: string) => {
    if (mimeType.startsWith('image/')) {
      return ImageIcon;
    } else if (mimeType.startsWith('video/')) {
      return Video;
    } else if (mimeType.startsWith('audio/')) {
      return Music;
    } else if (mimeType.includes('pdf')) {
      return FileText;
    } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('7z')) {
      return Archive;
    } else if (mimeType.includes('word') || mimeType.includes('document')) {
      return FileText;
    } else {
      return FileIcon;
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const formatDate = (timestamp: number): string => {
    return new Date(timestamp).toLocaleDateString();
  };

  const handleDownload = async () => {
    if (fileUrl?.url) {
      const link = document.createElement('a');
      link.href = fileUrl.url;
      link.download = fileMetadata.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  const IconComponent = getFileIcon(fileMetadata.mimeType, fileMetadata.fileName);

  return (
    <Card className={cn("transition-colors hover:bg-secondary-background", className)}>
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-center gap-3">
          {/* File Icon */}
          <div className={cn(
            "rounded-base bg-main border-2 border-border shadow-shadow flex items-center justify-center text-main-foreground",
            compact ? "w-8 h-8" : "w-10 h-10"
          )}>
            <IconComponent size={compact ? 16 : 20} />
          </div>

          {/* File Details */}
          <div className="flex-1 min-w-0">
            <h4 className={cn(
              "font-base text-foreground truncate",
              compact ? "text-sm" : "text-base"
            )}>
              {fileMetadata.fileName}
            </h4>
            <div className="flex items-center gap-2 text-xs font-base text-foreground opacity-60">
              <span>{formatFileSize(fileMetadata.sizeBytes)}</span>
              {!compact && (
                <>
                  <span>•</span>
                  <span>Uploaded {formatDate(fileMetadata.uploadedAt)}</span>
                  {fileMetadata.uploader && (
                    <>
                      <span>•</span>
                      <span>by {fileMetadata.uploader.name}</span>
                    </>
                  )}
                </>
              )}
            </div>

            {/* Processing Status */}
            {fileMetadata.processingStatus === "processing" && (
              <div className="text-xs font-base text-main mt-1">
                Processing...
              </div>
            )}
            {fileMetadata.processingStatus === "failed" && (
              <div className="text-xs font-base text-red-600 mt-1">
                Processing failed
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2">
            {showDownload && fileUrl?.url && (
              <Button
                variant="neutral"
                size={compact ? "sm" : "sm"}
                onClick={handleDownload}
                title="Download file"
              >
                <Download size={compact ? 14 : 16} />
              </Button>
            )}

            {showDelete && (
              <Button
                variant="neutral"
                size={compact ? "sm" : "sm"}
                onClick={onDelete}
                title="Delete file"
                className="text-red-600 hover:text-red-700"
              >
                <Trash2 size={compact ? 14 : 16} />
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface FileListProps {
  fileMetadataIds: Id<"fileMetadata">[];
  showDownload?: boolean;
  showDelete?: boolean;
  onDelete?: (fileId: Id<"fileMetadata">) => void;
  compact?: boolean;
  className?: string;
}

export function FileList({
  fileMetadataIds,
  showDownload = true,
  showDelete = false,
  onDelete,
  compact = false,
  className
}: FileListProps) {
  if (fileMetadataIds.length === 0) {
    return (
      <div className={cn("text-center py-8", className)}>
        <FileIcon size={48} className="mx-auto text-foreground opacity-20 mb-4" />
        <p className="text-base font-base text-foreground opacity-60">
          No files uploaded yet
        </p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-2", className)}>
      {fileMetadataIds.map((fileId) => (
        <FileDisplay
          key={fileId}
          fileMetadataId={fileId}
          showDownload={showDownload}
          showDelete={showDelete}
          onDelete={() => onDelete?.(fileId)}
          compact={compact}
        />
      ))}
    </div>
  );
}