import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  MoreVertical,
  Mail,
  UserMinus,
  Shield,
  User,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Member {
  id: string;
  name: string;
  email: string;
  role: "instructor" | "ta" | "student";
  joinedAt: number;
  lastActivity: number;
}

interface MembersListProps {
  title: string;
  members: Member[];
  canManage: boolean;
  showEmail: boolean;
}

export function MembersList({ title, members, canManage, showEmail }: MembersListProps) {
  const getRoleIcon = (role: string) => {
    switch (role) {
      case "instructor":
        return Shield;
      case "ta":
        return User;
      default:
        return User;
    }
  };

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

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase();
  };

  if (members.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{title} ({members.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 pt-0">
        <div className="space-y-3">
          {members.map((member) => {
            const RoleIcon = getRoleIcon(member.role);

            return (
              <div
                key={member.id}
                className="flex items-center gap-4 p-4 rounded-base border-2 border-border hover:bg-secondary-background transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-main border-2 border-border shadow-shadow flex items-center justify-center">
                  <span className="text-sm font-heading text-main-foreground">
                    {getInitials(member.name)}
                  </span>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-heading text-foreground">
                      {member.name}
                    </h4>
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2 py-0.5 text-xs font-base rounded-base",
                      getRoleColor(member.role)
                    )}>
                      <RoleIcon size={12} />
                      {member.role === "instructor" ? "Instructor"
                       : member.role === "ta" ? "TA"
                       : "Student"}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm">
                    {showEmail && (
                      <span className="text-foreground opacity-80 font-base">
                        {member.email}
                      </span>
                    )}
                    <div className="flex items-center gap-1 text-foreground opacity-60">
                      <Clock size={12} />
                      <span className="font-base">
                        Active {formatDistanceToNow(new Date(member.lastActivity), { addSuffix: true })}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {showEmail && (
                    <Button variant="neutral" size="sm">
                      <Mail size={14} />
                    </Button>
                  )}

                  {canManage && member.role !== "instructor" && (
                    <div className="relative">
                      <Button variant="neutral" size="sm">
                        <MoreVertical size={14} />
                      </Button>
                      {/* Dropdown menu would go here */}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}