"use client";

import { use } from "react";
import { redirect } from "next/navigation";

interface ClassroomPageProps {
  params: Promise<{ id: string }>;
}

export default function ClassroomPage({ params }: ClassroomPageProps) {
  const resolvedParams = use(params);
  // Redirect to stream tab as default
  redirect(`/classrooms/${resolvedParams.id}/stream`);
}