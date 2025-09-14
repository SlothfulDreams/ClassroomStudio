"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  MessageSquare,
  BookOpen,
  Users,
  BarChart3,
  Settings
} from "lucide-react";

interface ClassroomTabsProps {
  classroomId: string;
  userRole: "instructor" | "ta" | "student";
}

export function ClassroomTabs({ classroomId, userRole }: ClassroomTabsProps) {
  const pathname = usePathname();

  const isTeacher = userRole === "instructor" || userRole === "ta";

  const tabs = [
    {
      id: "stream",
      label: "Stream",
      icon: MessageSquare,
      href: `/classrooms/${classroomId}/stream`,
      available: true
    },
    {
      id: "classwork",
      label: "Classwork",
      icon: BookOpen,
      href: `/classrooms/${classroomId}/classwork`,
      available: true
    },
    {
      id: "people",
      label: "People",
      icon: Users,
      href: `/classrooms/${classroomId}/people`,
      available: true
    },
    {
      id: "grades",
      label: "Grades",
      icon: BarChart3,
      href: `/classrooms/${classroomId}/grades`,
      available: isTeacher
    },
    {
      id: "settings",
      label: "Settings",
      icon: Settings,
      href: `/classrooms/${classroomId}/settings`,
      available: isTeacher
    }
  ];

  const availableTabs = tabs.filter(tab => tab.available);

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex space-x-0 overflow-x-auto">
          {availableTabs.map((tab) => {
            const isActive = pathname === tab.href;
            const Icon = tab.icon;

            return (
              <Link
                key={tab.id}
                href={tab.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-3 text-sm font-base whitespace-nowrap transition-colors border-b-2",
                  isActive
                    ? "text-teal-600 border-teal-500 bg-white"
                    : "text-gray-600 border-transparent hover:text-gray-900 hover:border-gray-300"
                )}
              >
                <Icon size={16} />
                {tab.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}