"use client";

import { useState, useRef, useEffect } from "react";
import { User, Settings, LogOut, ChevronDown } from "lucide-react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

interface NavbarProps {
  className?: string;
}

export function Navbar({ className }: NavbarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { signOut } = useAuthActions();
  const router = useRouter();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setIsDropdownOpen(false);
  };

  const handleSettings = () => {
    router.push("/settings");
    setIsDropdownOpen(false);
  };

  return (
    <nav className={cn(
      "w-full bg-secondary-background border-b-2 border-border shadow-[0_4px_0px_0px] shadow-border",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => router.push("/classrooms")}
              className="text-2xl font-heading text-foreground hover:text-teal-500 transition-colors"
            >
              Classroom<span className="text-teal-500">Studio</span>
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <Button
              variant="neutral"
              size="icon"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                "relative",
                isDropdownOpen && "translate-x-boxShadowX translate-y-boxShadowY shadow-none"
              )}
            >
              <User className="h-5 w-5" />
              <ChevronDown className={cn(
                "h-3 w-3 absolute -bottom-1 -right-1 transition-transform",
                isDropdownOpen && "rotate-180"
              )} />
            </Button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-secondary-background border-2 border-border shadow-shadow rounded-base z-50">
                <div className="py-2">
                  <button
                    onClick={handleSettings}
                    className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-background transition-colors gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <hr className="border-border my-1" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-foreground hover:bg-background transition-colors gap-2"
                  >
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}