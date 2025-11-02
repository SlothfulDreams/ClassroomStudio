"use client";

import { useQuery, useMutation } from "convex/react";
import { useConvexAuth } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Users } from "lucide-react";
import { useRouter } from "next/navigation";
import { LoadingPage, Loading } from "@/components/ui/loading";

type Classroom = {
  _id: string;
  name: string;
  description?: string;
  subject?: string;
  joinCode: string;
  userRole: "instructor" | "ta" | "student";
  memberCount: number;
  joinedAt: number;
  createdAt: number;
};

function ClassroomCard({ classroom }: { classroom: Classroom }) {
  const router = useRouter();

  const getRoleColor = (role: string) => {
    switch (role) {
      case "instructor":
        return "bg-main text-main-foreground";
      case "ta":
        return "bg-secondary text-secondary-foreground";
      case "student":
        return "bg-secondary-background border-2 border-border text-foreground";
      default:
        return "bg-background text-foreground";
    }
  };

  const getRoleName = (role: string) => {
    switch (role) {
      case "instructor":
        return "Instructor";
      case "ta":
        return "TA";
      case "student":
        return "Student";
      default:
        return "Member";
    }
  };

  return (
    <Card
      className="cursor-pointer hover:translate-x-boxShadowX hover:translate-y-boxShadowY transition-all duration-200"
      onClick={() => router.push(`/classrooms/${classroom._id}`)}
    >
      <CardContent className="p-6">
        {/* Role Badge */}
        <div
          className={`inline-flex items-center px-3 py-1 text-sm font-base rounded-base mb-4 ${getRoleColor(classroom.userRole)}`}
        >
          {getRoleName(classroom.userRole)}
        </div>

        {/* Classroom Name */}
        <h3 className="text-xl font-heading text-foreground mb-2">
          {classroom.name}
        </h3>

        {/* Subject */}
        {classroom.subject && (
          <p className="text-base font-base text-foreground opacity-80 mb-3">
            {classroom.subject}
          </p>
        )}

        {/* Description */}
        {classroom.description && (
          <p className="text-sm font-base text-foreground opacity-60 mb-4 line-clamp-2">
            {classroom.description}
          </p>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center pt-4 border-t border-border">
          <div className="flex items-center gap-2 text-foreground opacity-70">
            <Users size={16} />
            <span className="text-sm font-base">
              {classroom.memberCount} members
            </span>
          </div>
          <div className="text-sm font-base text-foreground opacity-50 bg-secondary-background px-2 py-1 rounded-base border border-border">
            {classroom.joinCode}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreateClassroomDialog() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [subject, setSubject] = useState("");
  const [description, setDescription] = useState("");

  const createClassroom = useMutation(api.classrooms.createClassroom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createClassroom({
        name,
        subject: subject || undefined,
        description: description || undefined,
      });
      setOpen(false);
      setName("");
      setSubject("");
      setDescription("");
    } catch (error) {
      console.error("Failed to create classroom:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus className="mr-2" size={20} />
          Create Classroom
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Classroom</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Classroom Name *</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Advanced Chemistry"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Chemistry"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Learn advanced chemical concepts..."
            />
          </div>

          <Button type="submit" className="w-full">
            Create Classroom
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function JoinClassroomDialog() {
  const [open, setOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");

  const joinClassroom = useMutation(api.classrooms.joinClassroom);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await joinClassroom({ joinCode: joinCode.toUpperCase() });
      setOpen(false);
      setJoinCode("");
    } catch (error) {
      console.error("Failed to join classroom:", error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg" variant="neutral">
          <Users className="mr-2" size={20} />
          Join Classroom
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Join Classroom</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="joinCode">Join Code *</Label>
            <Input
              id="joinCode"
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="ABC123"
              required
              className="text-center text-lg tracking-widest"
              maxLength={8}
            />
          </div>

          <Button type="submit" className="w-full">
            Join Classroom
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function ClassroomsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const classrooms = useQuery(
    api.classrooms.getUserClassroom,
    !isAuthenticated ? "skip" : {},
  );

  if (isLoading) {
    return (
      <LoadingPage title="My Classrooms" message="Loading your classrooms..." />
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-heading text-foreground mb-2">
            My Classrooms
          </h1>
          <p className="text-base font-base text-foreground opacity-80">
            Manage your learning spaces and assignments
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
          <CreateClassroomDialog />
          <JoinClassroomDialog />
        </div>
      </div>

      {/* Classrooms Grid */}
      <div className="max-w-7xl mx-auto">
        {classrooms === undefined ? (
          <div className="text-center py-12">
            <Loading message="Loading classrooms..." size="lg" showCard />
          </div>
        ) : classrooms.length === 0 ? (
          <div className="text-center py-12">
            <Card className="p-8 max-w-md mx-auto">
              <CardContent className="text-center">
                <h2 className="text-2xl font-heading text-foreground mb-4">
                  No classrooms yet
                </h2>
                <p className="text-base font-base text-foreground opacity-80 mb-6">
                  Create your first classroom or join one with an invite code to
                  get started!
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                  <CreateClassroomDialog />
                  <JoinClassroomDialog />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {classrooms
              .filter((classroom) => classroom !== null)
              .map((classroom) => (
                <ClassroomCard key={classroom._id} classroom={classroom} />
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
