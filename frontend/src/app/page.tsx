"use client";
import { useConvexAuth } from "convex/react";
import { SignIn } from "./SignIn";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { LoadingPage } from "@/components/ui/loading";

export default function Home() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (isAuthenticated && !isLoading) {
      router.push("/classrooms");
    }
  }, [isAuthenticated, isLoading, router]);

  // Show loading state while checking authentication
  if (isLoading) {
    return <LoadingPage message="Checking authentication..." />;
  }

  // Show sign in if not authenticated
  return (
    <main className="min-h-screen bg-white flex items-center justify-center">
      <div className="flex max-w-6xl w-full mx-auto gap-8 lg:gap-16 px-8">
        {/* Left Side - Brand and Description */}
        <div className="flex-1 flex flex-col justify-center">
          <div className="max-w-lg">
            <h1 className="text-5xl lg:text-6xl font-heading text-foreground mb-8">
              Classroom<span className="text-teal-500">Studio</span>
            </h1>
            <p className="text-xl lg:text-2xl text-foreground leading-relaxed font-base">
              Your all-in-one AI-powered tool for planning, creating, and grading engaging assignments
            </p>
          </div>
        </div>

        {/* Right Side - Login Form */}
        <div className="flex-1 flex items-center justify-center">
          <SignIn />
        </div>
      </div>
    </main>
  );
};
