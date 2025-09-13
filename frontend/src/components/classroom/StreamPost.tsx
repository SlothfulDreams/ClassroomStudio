import * as React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { formatDistanceToNow } from "date-fns";

interface StreamPostProps {
  post: {
    id: string;
    authorName: string;
    authorRole: "instructor" | "ta" | "student";
    content: string;
    createdAt: number;
    attachments: Array<{
      id: string;
      name: string;
      url: string;
      type: string;
    }>;
  };
}

export function StreamPost({ post }: StreamPostProps) {
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

  return (
    <Card>
      <CardContent className="p-6">
        {/* Post Header */}
        <div className="flex items-center gap-3 mb-4">
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

        {/* Post Content */}
        <div className="mb-4">
          <p className="text-base font-base text-foreground whitespace-pre-wrap">
            {post.content}
          </p>
        </div>

        {/* Attachments */}
        {post.attachments && post.attachments.length > 0 && (
          <div className="space-y-2">
            {post.attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="flex items-center gap-2 p-3 rounded-base border-2 border-border bg-secondary-background"
              >
                <div className="w-8 h-8 rounded bg-main flex items-center justify-center">
                  <span className="text-xs font-base text-main-foreground">
                    {attachment.name.split('.').pop()?.toUpperCase().substring(0, 3)}
                  </span>
                </div>
                <a
                  href={attachment.url}
                  className="flex-1 text-sm font-base text-foreground hover:opacity-80 transition-opacity"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {attachment.name}
                </a>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}