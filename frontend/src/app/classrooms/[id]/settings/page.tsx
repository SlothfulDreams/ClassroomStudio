"use client";

import { use } from "react";
import { useQuery } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Id } from "../../../../../convex/_generated/dataModel";
import { Loading } from "@/components/ui/loading";
import { Card, CardContent } from "@/components/ui/card";
import { Save, Archive, Trash2, Info, BookOpen, BarChart3, AlertTriangle } from "lucide-react";

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
        <div className="bg-white rounded-lg border border-gray-200 max-w-md mx-auto p-8">
          <h2 className="text-xl font-heading text-gray-900 mb-4">
            Access Restricted
          </h2>
          <p className="text-base font-base text-gray-600">
            Only instructors and teaching assistants can access classroom settings.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-heading text-gray-900 mb-1">
            Settings
          </h1>
          <p className="text-base font-base text-gray-600">
            Manage classroom settings and preferences
          </p>
        </div>

        <button className="bg-teal-500 hover:bg-teal-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors">
          <Save size={20} />
          Save Changes
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Basic Information */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-teal-500 rounded-xl flex items-center justify-center">
              <Info size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-heading text-gray-900">Basic Information</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-base text-gray-700 mb-1">Classroom Name</label>
              <input
                type="text"
                defaultValue={classroom.name}
                placeholder="Enter classroom name"
                className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-base text-gray-700 mb-1">Subject</label>
              <input
                type="text"
                defaultValue={classroom.subject || ""}
                placeholder="Enter subject"
                className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-base text-gray-700 mb-1">Description</label>
              <textarea
                defaultValue={classroom.description || ""}
                placeholder="Enter classroom description"
                rows={3}
                className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-base text-gray-700 mb-1">Join Code</label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={classroom.joinCode}
                  readOnly
                  className="flex-1 p-3 bg-gray-100 border border-gray-300 rounded-lg font-mono text-gray-900"
                />
                <button className="bg-gray-100 border border-gray-300 hover:bg-gray-200 text-gray-700 px-3 py-3 rounded-lg transition-colors whitespace-nowrap">
                  Generate New
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Students use this code to join your classroom
              </p>
            </div>
          </div>
        </div>

        {/* Classroom Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <BookOpen size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-heading text-gray-900">Classroom Settings</h3>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-base text-gray-900">Allow Late Submissions</h4>
                <p className="text-sm text-gray-600">
                  Students can submit assignments after the due date
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-base text-gray-900">Auto-Release Grades</h4>
                <p className="text-sm text-gray-600">
                  Automatically release grades to students when graded
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-base text-gray-900">Require Join Approval</h4>
                <p className="text-sm text-gray-600">
                  New students need approval before joining
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-base font-base text-gray-900">Email Notifications</h4>
                <p className="text-sm text-gray-600">
                  Send notifications for new submissions and activity
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input type="checkbox" className="sr-only peer" defaultChecked />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Grading Settings */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <BarChart3 size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-heading text-gray-900">Grading</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-base text-gray-700 mb-1">Grading Scale</label>
              <select className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900">
                <option>Standard (A, B, C, D, F)</option>
                <option>Percentage (0-100%)</option>
                <option>Points Based</option>
                <option>Pass/Fail</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-base text-gray-700 mb-1">Late Penalty (%)</label>
              <input
                type="number"
                defaultValue="10"
                min="0"
                max="100"
                className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Percentage deducted per day late
              </p>
            </div>
            <div>
              <label className="block text-sm font-base text-gray-700 mb-1">Default Points</label>
              <input
                type="number"
                defaultValue="100"
                min="1"
                className="w-full p-3 bg-gray-100 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Default points for new assignments
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <AlertTriangle size={24} className="text-white" />
            </div>
            <h3 className="text-lg font-heading text-gray-900">Danger Zone</h3>
          </div>
          <div className="space-y-4">
            <div className="border border-red-200 rounded-lg p-4 bg-red-50">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-base text-red-700">Archive Classroom</h4>
                  <p className="text-sm text-red-600">
                    Hide this classroom from active view
                  </p>
                </div>
                <button className="bg-white border border-red-300 text-red-600 hover:bg-red-50 px-3 py-2 rounded-lg transition-colors">
                  Archive
                </button>
              </div>
            </div>
            <div className="border border-red-300 rounded-lg p-4 bg-red-100">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-base font-base text-red-700">Delete Classroom</h4>
                  <p className="text-sm text-red-600">
                    Permanently delete this classroom and all its data
                  </p>
                </div>
                <button className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg transition-colors">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}