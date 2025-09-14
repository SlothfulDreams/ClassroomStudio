import * as React from "react";
import { cn } from "@/lib/utils";
import {
  MoreVertical,
  MessageCircle,
  UserMinus,
  Shield,
  User,
  Clock
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Member {
  _id: string;
  user: {
    _id: string;
    name: string;
    email: string;
  } | null;
  role: "instructor" | "ta" | "student";
  status: "active" | "pending" | "removed" | "blocked";
  joinedAt: number;
  lastActivityAt?: number;
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
        return "bg-teal-500 text-white";
      case "ta":
        return "bg-purple-500 text-white";
      default:
        return "bg-gray-200 text-gray-800";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "instructor":
        return "Principal";
      case "ta":
        return "TA";
      default:
        return "Student";
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
    <div className="bg-white rounded-lg border border-gray-200">
      <div className="p-4 border-b border-gray-200">
        <h3 className="text-lg font-heading text-gray-900">
          {title} ({members.length})
        </h3>
      </div>
      <div className="p-4">
        <div className="space-y-4">
          {members.map((member) => {
            const RoleIcon = getRoleIcon(member.role);

            return (
              <div
                key={member._id}
                className="flex items-center gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors"
              >
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-teal-500 flex items-center justify-center">
                  <span className="text-sm font-heading text-white">
                    {getInitials(member.user?.name || "Unknown")}
                  </span>
                </div>

                {/* Member Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="text-base font-heading text-gray-900">
                      {member.user?.name || "Unknown User"}
                    </h4>
                    <span className={cn(
                      "inline-flex items-center px-2 py-1 text-xs font-base rounded-md",
                      getRoleColor(member.role)
                    )}>
                      {getRoleName(member.role)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    {showEmail && member.user?.email && (
                      <p className="text-sm text-gray-600 font-base">
                        {member.user.email}
                      </p>
                    )}
                    <p className="text-xs text-gray-500 font-base">
                      {member.lastActivityAt
                        ? `Active ${formatDistanceToNow(new Date(member.lastActivityAt), { addSuffix: true })}`
                        : "Never active"
                      }
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  {showEmail && (
                    <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors">
                      <MessageCircle size={16} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}