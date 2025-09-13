"use client";

import { use } from "react";
import type { ReactNode } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import { LoadingPage } from "@/components/ui/loading";
import { ClassroomHeader } from "@/components/classroom/ClassroomHeader";
import { ClassroomTabs } from "@/components/classroom/ClassroomTabs";
import { useRouter } from "next/navigation";

interface ClassroomLayoutProps {
  children: ReactNode;
  params: Promise<{ id: string }>;
}

export default function ClassroomLayout({ children, params }: ClassroomLayoutProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();
  const resolvedParams = use(params);

  const classroom = useQuery(
    api.classrooms.getClassroom,
    !isAuthenticated || isLoading ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  if (isLoading) {
    return <LoadingPage title="Classroom" message="Loading classroom..." />;
  }

  if (!isAuthenticated) {
    router.push("/");
    return null;
  }

  if (classroom === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-heading text-foreground mb-4">
            Classroom Not Found
          </h1>
          <p className="text-base font-base text-foreground opacity-80">
            This classroom doesn't exist or you don't have access to it.
          </p>
        </div>
      </div>
    );
  }

  if (classroom === undefined) {
    return <LoadingPage title="Classroom" message="Loading classroom..." />;
  }

  return (
    <div className="min-h-screen bg-background">
      <ClassroomHeader classroom={classroom} />
      <ClassroomTabs classroomId={resolvedParams.id} userRole={classroom.userRole} />
      <main className="max-w-7xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}