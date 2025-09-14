import * as React from "react";
import { useState } from "react";
import { useMutation } from "convex/react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileDisplay } from "@/components/ui/file-display";
import { formatDistanceToNow } from "date-fns";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { MoreHorizontal, Pin, MessageCircle, Edit, Trash2, PinOff } from "lucide-react";

interface StreamPostProps {
  post: {
    id: string;
    authorName: string;
    authorRole: "instructor" | "ta" | "student";
    content: string;
    createdAt: number;
    attachmentIds?: Id<"fileMetadata">[];
    commentCount?: number;
    isPinned?: boolean;
  };
  classroomId: Id<"classrooms">;
  currentUserRole: "instructor" | "ta" | "student";
  canEdit?: boolean;
}

export function StreamPost({ post, classroomId, currentUserRole, canEdit }: StreamPostProps) {
  const [showActions, setShowActions] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const updateAnnouncement = useMutation(api.announcements.updateAnnouncement);
  const deleteAnnouncement = useMutation(api.announcements.deleteAnnouncement);
  const getRoleColor = (role: string) => {
    switch (role) {
      case "instructor":
        return "bg-main text-main-foreground";
      case "ta":
        return "bg-secondary-background text-foreground border-2 border-border";
      default:
        return "bg-background text-foreground border-2 border-border";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "instructor":
        return "Instructor";
      case "ta":
        return "TA";
      default:
        return "Student";
    }
  };

  const handleTogglePin = async () => {
    try {
      await updateAnnouncement({
        announcementId: post.id as Id<"announcements">,
        isPinned: !post.isPinned
      });
    } catch (error) {
      console.error("Failed to toggle pin:", error);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this announcement?")) return;

    setIsDeleting(true);
    try {
      await deleteAnnouncement({
        announcementId: post.id as Id<"announcements">
      });
    } catch (error) {
      console.error("Failed to delete announcement:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <Card className={post.isPinned ? "border-main" : ""}>
      <CardContent className="p-6">
        {post.isPinned && (
          <div className="flex items-center gap-2 mb-4 p-2 bg-main/10 rounded-base border border-main/20">
            <Pin size={16} className="text-main" />
            <span className="text-sm font-heading text-main">Pinned</span>
          </div>
        )}

        {/* Post Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-main border-2 border-border shadow-shadow flex items-center justify-center">
              <span className="text-sm font-heading text-main-foreground">
                {post.authorName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
              </span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="text-base font-heading text-foreground">
                  {post.authorName}
                </h4>
                <span className={`px-2 py-0.5 text-xs font-base rounded-base ${getRoleColor(post.authorRole)}`}>
                  {getRoleName(post.authorRole)}
                </span>
              </div>
              <p className="text-sm font-base text-foreground opacity-60">
                {formatDistanceToNow(new Date(post.createdAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {canEdit && (
            <div className="relative">
              <Button
                variant="neutral"
                size="sm"
                onClick={() => setShowActions(!showActions)}
              >
                <MoreHorizontal size={16} />
              </Button>

              {showActions && (
                <div className="absolute right-0 top-full mt-1 w-48 bg-background border-2 border-border rounded-base shadow-shadow z-10">
                  <div className="p-1">
                    <button
                      onClick={handleTogglePin}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-base text-foreground hover:bg-secondary-background rounded-base transition-colors"
                    >
                      {post.isPinned ? <PinOff size={16} /> : <Pin size={16} />}
                      {post.isPinned ? "Unpin" : "Pin to top"}
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={isDeleting}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm font-base text-red-600 hover:bg-red-50 rounded-base transition-colors"
                    >
                      <Trash2 size={16} />
                      {isDeleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-base font-base text-foreground whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Attachments */}
        {post.attachmentIds && post.attachmentIds.length > 0 && (
          <div className="space-y-2 mb-4">
            {post.attachmentIds.map((fileId) => (
              <FileDisplay
                key={fileId}
                fileMetadataId={fileId}
                showDownload={true}
                showDelete={false}
                compact={false}
              />
            ))}
          </div>
        )}

        {/* Comment Button */}
        {(post.commentCount || 0) > 0 && (
          <div className="pt-4 border-t border-border">
            <Button
              variant="neutral"
              size="sm"
              className="text-foreground opacity-60"
            >
              <MessageCircle size={16} />
              {post.commentCount} {post.commentCount === 1 ? 'comment' : 'comments'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}