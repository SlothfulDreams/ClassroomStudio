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
      "w-full bg-white border-b border-gray-200",
      className
    )}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <button
              onClick={() => router.push("/classrooms")}
              className="text-2xl font-heading text-gray-900 hover:text-teal-600 transition-colors"
            >
              Classroom<span className="text-teal-500">Studio</span>
            </button>
          </div>

          {/* Profile Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className={cn(
                "relative p-2 rounded-lg hover:bg-gray-100 transition-colors flex items-center gap-1",
                isDropdownOpen && "bg-gray-100"
              )}
            >
              <User className="h-5 w-5 text-gray-700" />
              <ChevronDown className={cn(
                "h-3 w-3 text-gray-500 transition-transform",
                isDropdownOpen && "rotate-180"
              )} />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 shadow-lg rounded-lg z-50">
                <div className="py-2">
                  <button
                    onClick={handleSettings}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors gap-2"
                  >
                    <Settings className="h-4 w-4" />
                    Settings
                  </button>
                  <hr className="border-gray-200 my-1" />
                  <button
                    onClick={handleSignOut}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors gap-2"
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