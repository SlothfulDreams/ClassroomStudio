import * as React from "react";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Classroom {
  _id: string;
  name: string;
  description?: string;
  subject?: string;
  joinCode: string;
  userRole: "instructor" | "ta" | "student";
  memberCount: number;
}

interface ClassroomBannerProps {
  classroom: Classroom;
  className?: string;
}

export function ClassroomBanner({ classroom, className }: ClassroomBannerProps) {
  const [copied, setCopied] = React.useState(false);

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(classroom.joinCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
    }
  };

  const isTeacher = classroom.userRole === "instructor" || classroom.userRole === "ta";

  // Generate geometric pattern based on classroom name
  const getPattern = (name: string) => {
    const patterns = [
      // Dots pattern
      "radial-gradient(circle at 20% 50%, var(--main) 2px, transparent 2px), radial-gradient(circle at 80% 50%, var(--main) 2px, transparent 2px)",
      // Lines pattern
      "linear-gradient(45deg, transparent 40%, var(--main) 40%, var(--main) 60%, transparent 60%)",
      // Grid pattern
      "linear-gradient(var(--main) 1px, transparent 1px), linear-gradient(90deg, var(--main) 1px, transparent 1px)"
    ];

    const hash = name.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);

    return patterns[Math.abs(hash) % patterns.length];
  };

  return (
    <Card className={cn("relative overflow-hidden", className)}>
      {/* Background Pattern */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          background: getPattern(classroom.name),
          backgroundSize: "20px 20px"
        }}
      />

      <CardContent className="relative p-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-heading text-foreground mb-2">
              {classroom.name}
            </h2>
            {classroom.subject && (
              <p className="text-base font-base text-foreground opacity-80">
                {classroom.subject}
              </p>
            )}
          </div>

          {isTeacher && (
            <div className="text-right">
              <p className="text-sm font-base text-foreground opacity-60 mb-2">
                Class Code
              </p>
              <div className="flex items-center gap-2">
                <code className="text-lg font-mono text-foreground bg-secondary-background px-3 py-2 rounded-base border-2 border-border">
                  {classroom.joinCode}
                </code>
                <Button
                  variant="neutral"
                  size="sm"
                  onClick={handleCopyCode}
                  className="min-w-[100px]"
                >
                  {copied ? (
                    <>
                      <Check size={16} />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} />
                      Copy
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}