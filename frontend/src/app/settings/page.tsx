"use client";

import { useConvexAuth } from "convex/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LoadingPage } from "@/components/ui/loading";
import { Settings, User, Bell, Shield, Palette } from "lucide-react";

export default function SettingsPage() {
  const { isAuthenticated, isLoading } = useConvexAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated && !isLoading) {
      router.push("/");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return <LoadingPage title="Settings" message="Loading settings..." />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <Settings className="h-8 w-8 text-foreground" />
            <h1 className="text-4xl font-heading text-foreground">Settings</h1>
          </div>
          <p className="text-base font-base text-foreground opacity-80">
            Manage your account preferences and application settings
          </p>
        </div>

        <div className="grid gap-6">
          {/* Profile Settings */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <User className="h-6 w-6 text-foreground" />
                <h2 className="text-2xl font-heading text-foreground">Profile</h2>
              </div>

              <div className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">First Name</Label>
                    <Input
                      id="firstName"
                      placeholder="John"
                      disabled
                      className="opacity-60"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input
                      id="lastName"
                      placeholder="Doe"
                      disabled
                      className="opacity-60"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="john.doe@example.com"
                    disabled
                    className="opacity-60"
                  />
                </div>
                <Button disabled className="w-fit">
                  Update Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Notification Settings */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Bell className="h-6 w-6 text-foreground" />
                <h2 className="text-2xl font-heading text-foreground">Notifications</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-base text-foreground">Assignment Notifications</h3>
                    <p className="text-sm text-foreground opacity-60">
                      Get notified when new assignments are posted
                    </p>
                  </div>
                  <Button variant="neutral" size="sm" disabled>
                    Enabled
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-base text-foreground">Grade Updates</h3>
                    <p className="text-sm text-foreground opacity-60">
                      Receive notifications when grades are posted
                    </p>
                  </div>
                  <Button variant="neutral" size="sm" disabled>
                    Enabled
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-base text-foreground">Classroom Announcements</h3>
                    <p className="text-sm text-foreground opacity-60">
                      Stay updated with classroom announcements
                    </p>
                  </div>
                  <Button variant="neutral" size="sm" disabled>
                    Enabled
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Appearance Settings */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Palette className="h-6 w-6 text-foreground" />
                <h2 className="text-2xl font-heading text-foreground">Appearance</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-base text-foreground">Theme</h3>
                    <p className="text-sm text-foreground opacity-60">
                      Choose your preferred color scheme
                    </p>
                  </div>
                  <Button variant="neutral" size="sm" disabled>
                    Light Mode
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-base text-foreground">Compact Mode</h3>
                    <p className="text-sm text-foreground opacity-60">
                      Reduce spacing for more content on screen
                    </p>
                  </div>
                  <Button variant="neutral" size="sm" disabled>
                    Disabled
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Privacy & Security */}
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-6">
                <Shield className="h-6 w-6 text-foreground" />
                <h2 className="text-2xl font-heading text-foreground">Privacy & Security</h2>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-base text-foreground">Profile Visibility</h3>
                    <p className="text-sm text-foreground opacity-60">
                      Control who can see your profile information
                    </p>
                  </div>
                  <Button variant="neutral" size="sm" disabled>
                    Classmates Only
                  </Button>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-base text-foreground">Data Export</h3>
                    <p className="text-sm text-foreground opacity-60">
                      Download your personal data and activity
                    </p>
                  </div>
                  <Button size="sm" disabled>
                    Request Export
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Coming Soon Notice */}
        <div className="mt-8">
          <Card className="bg-main/10 border-main border-2">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-heading text-foreground mb-2">
                Settings Configuration Coming Soon!
              </h3>
              <p className="text-base text-foreground opacity-80">
                This is a placeholder settings page. Full functionality will be available in a future update.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}