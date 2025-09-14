"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileUpload } from "@/components/ui/file-upload";
import { FileDisplay } from "@/components/ui/file-display";
import { Plus, Send, X, Pin, Paperclip } from "lucide-react";

interface CreateAnnouncementModalProps {
  classroomId: Id<"classrooms">;
}

export function CreateAnnouncementModal({ classroomId }: CreateAnnouncementModalProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState("");
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attachmentIds, setAttachmentIds] = useState<Id<"fileMetadata">[]>([]);
  const [showAttachments, setShowAttachments] = useState(false);

  const createAnnouncement = useMutation(api.announcements.createAnnouncement);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await createAnnouncement({
        classroomId,
        content: content.trim(),
        isPinned,
        attachmentIds: attachmentIds.length > 0 ? attachmentIds : undefined,
      });
      setContent("");
      setIsPinned(false);
      setAttachmentIds([]);
      setShowAttachments(false);
      setIsOpen(false);
    } catch (error) {
      console.error("Failed to create announcement:", error);
      // TODO: Show error toast
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setContent("");
    setIsPinned(false);
    setAttachmentIds([]);
    setShowAttachments(false);
    setIsOpen(false);
  };

  const handleFileUpload = (fileId: Id<"fileMetadata">) => {
    setAttachmentIds(prev => [...prev, fileId]);
  };

  const handleFileRemove = (fileId: Id<"fileMetadata">) => {
    setAttachmentIds(prev => prev.filter(id => id !== fileId));
  };

  if (!isOpen) {
    return (
      <Card>
        <CardContent className="p-6">
          <button
            onClick={() => setIsOpen(true)}
            className="flex items-center gap-3 w-full text-left"
          >
            <div className="w-10 h-10 rounded-full bg-main flex items-center justify-center">
              <Plus size={20} className="text-main-foreground" />
            </div>
            <div className="flex-1 p-3 rounded-base border-2 border-border bg-secondary-background hover:bg-background transition-colors">
              <span className="text-base font-base text-foreground opacity-60">
                Share something with your class
              </span>
            </div>
          </button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-heading text-foreground">
              Create Announcement
            </h3>
            <button
              type="button"
              onClick={handleCancel}
              className="p-1 rounded-base hover:bg-secondary-background transition-colors"
            >
              <X size={20} className="text-foreground opacity-60" />
            </button>
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Share something with your class..."
            className="w-full min-h-[120px] p-3 text-base font-base bg-secondary-background border-2 border-border rounded-base focus:outline-none focus:ring-2 focus:ring-black resize-none"
            disabled={isSubmitting}
            autoFocus
          />

          {/* Attachment Section */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="neutral"
                size="sm"
                onClick={() => setShowAttachments(!showAttachments)}
                disabled={isSubmitting}
              >
                <Paperclip size={16} />
                Attach Files
              </Button>
              {attachmentIds.length > 0 && (
                <span className="text-sm font-base text-foreground opacity-60">
                  {attachmentIds.length} file{attachmentIds.length === 1 ? '' : 's'} attached
                </span>
              )}
            </div>

            {showAttachments && (
              <div className="space-y-3">
                <FileUpload
                  purpose="resource"
                  classroomId={classroomId}
                  onUploadComplete={handleFileUpload}
                  multiple={true}
                  maxSizeMB={10}
                  disabled={isSubmitting}
                />

                {attachmentIds.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="text-sm font-heading text-foreground">Attached Files:</h4>
                    {attachmentIds.map((fileId) => (
                      <FileDisplay
                        key={fileId}
                        fileMetadataId={fileId}
                        showDownload={false}
                        showDelete={true}
                        onDelete={() => handleFileRemove(fileId)}
                        compact={true}
                      />
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isPinned}
                onChange={(e) => setIsPinned(e.target.checked)}
                className="sr-only"
                disabled={isSubmitting}
              />
              <div
                className={`w-5 h-5 rounded-base border-2 border-border flex items-center justify-center transition-colors ${
                  isPinned ? "bg-main text-main-foreground" : "bg-background"
                }`}
              >
                {isPinned && <Pin size={12} />}
              </div>
              <span className="text-sm font-base text-foreground">
                Pin to top of stream
              </span>
            </label>

            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="neutral"
                onClick={handleCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!content.trim() || isSubmitting}
              >
                <Send size={16} />
                {isSubmitting ? "Posting..." : "Post"}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}