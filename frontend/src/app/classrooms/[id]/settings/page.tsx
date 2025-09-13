"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Archive, Trash2, Settings } from "lucide-react";

interface SettingsPageProps {
  params: Promise<{ id: string }>;
}

export default function SettingsPage({ params }: SettingsPageProps) {
  const { isAuthenticated } = useConvexAuth();
  const resolvedParams = use(params);

  const classroom = useQuery(
    api.classrooms.getClassroom,
    !isAuthenticated ? "skip" : { classroomId: resolvedParams.id as Id<"classrooms"> }
  );

  if (!classroom) {
    return <Loading message="Loading settings..." size="lg" showCard />;
  }

  const isTeacher = classroom.userRole === "instructor" || classroom.userRole === "ta";

  if (!isTeacher) {
    return (
      <div className="text-center py-12">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-8">
            <h2 className="text-xl font-heading text-foreground mb-4">
              Access Restricted
            </h2>
            <p className="text-base font-base text-foreground opacity-80">
              Only instructors and teaching assistants can access classroom settings.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-foreground mb-1">
            Settings
          </h1>
          <p className="text-base font-base text-foreground opacity-80">
            Manage classroom settings and preferences
          </p>
        </div>

        <Button size="lg">
          <Save size={20} />
          Save Changes
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings size={20} />
              Basic Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="className">Classroom Name</Label>
              <Input
                id="className"
                defaultValue={classroom.name}
                placeholder="Enter classroom name"
              />
            </div>

            <div>
              <Label htmlFor="subject">Subject</Label>
              <Input
                id="subject"
                defaultValue={classroom.subject || ""}
                placeholder="Enter subject"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                defaultValue={classroom.description || ""}
                placeholder="Enter classroom description"
              />
            </div>

            <div>
              <Label htmlFor="joinCode">Join Code</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="joinCode"
                  value={classroom.joinCode}
                  readOnly
                  className="font-mono"
                />
                <Button variant="neutral" size="sm">
                  Generate New
                </Button>
              </div>
              <p className="text-xs font-base text-foreground opacity-60 mt-1">
                Students use this code to join your classroom
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Classroom Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Classroom Settings</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-heading text-foreground">Allow Late Submissions</h4>
                <p className="text-sm font-base text-foreground opacity-80">
                  Students can submit assignments after the due date
                </p>
              </div>
              <Button variant="neutral" size="sm">
                Enabled
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-heading text-foreground">Auto-Release Grades</h4>
                <p className="text-sm font-base text-foreground opacity-80">
                  Automatically release grades to students when graded
                </p>
              </div>
              <Button variant="neutral" size="sm">
                Disabled
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-heading text-foreground">Require Join Approval</h4>
                <p className="text-sm font-base text-foreground opacity-80">
                  New students need approval before joining
                </p>
              </div>
              <Button variant="neutral" size="sm">
                Disabled
              </Button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-heading text-foreground">Email Notifications</h4>
                <p className="text-sm font-base text-foreground opacity-80">
                  Send notifications for new submissions and activity
                </p>
              </div>
              <Button variant="neutral" size="sm">
                Enabled
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Grading Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Grading</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="gradingScale">Grading Scale</Label>
              <select className="w-full h-10 px-3 py-2 text-sm font-base bg-secondary-background border-2 border-border rounded-base focus:outline-none focus:ring-2 focus:ring-black">
                <option>Standard (A, B, C, D, F)</option>
                <option>Percentage (0-100%)</option>
                <option>Points Based</option>
                <option>Pass/Fail</option>
              </select>
            </div>

            <div>
              <Label htmlFor="latePenalty">Late Penalty (%)</Label>
              <Input
                id="latePenalty"
                type="number"
                defaultValue="10"
                min="0"
                max="100"
              />
              <p className="text-xs font-base text-foreground opacity-60 mt-1">
                Percentage deducted per day late
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600">Danger Zone</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border-2 border-red-200 rounded-base bg-red-50">
              <div>
                <h4 className="text-base font-heading text-red-600">Archive Classroom</h4>
                <p className="text-sm font-base text-red-600 opacity-80">
                  Hide this classroom from active view
                </p>
              </div>
              <Button variant="neutral" size="sm" className="border-red-200 text-red-600 hover:bg-red-50">
                <Archive size={16} />
                Archive
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border-2 border-red-300 rounded-base bg-red-100">
              <div>
                <h4 className="text-base font-heading text-red-700">Delete Classroom</h4>
                <p className="text-sm font-base text-red-700 opacity-80">
                  Permanently delete this classroom and all its data
                </p>
              </div>
              <Button variant="neutral" size="sm" className="border-red-300 text-red-700 hover:bg-red-100">
                <Trash2 size={16} />
                Delete
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}