"use client";

import { useConvexAuth } from "convex/react";
import { Navbar } from "./navbar";
import { ReactNode } from "react";

interface AuthNavbarWrapperProps {
  children: ReactNode;
}

export function AuthNavbarWrapper({ children }: AuthNavbarWrapperProps) {
  const { isAuthenticated, isLoading } = useConvexAuth();

  return (
    <>
      {isAuthenticated && !isLoading && <Navbar />}
      {children}
    </>
  );
}