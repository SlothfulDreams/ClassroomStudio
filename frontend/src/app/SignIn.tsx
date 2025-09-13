"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SignIn() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-heading text-foreground mb-2">
            Classroom Studio
          </h1>
          <p className="text-base font-base text-foreground opacity-80">
            {step === "signIn" ? "Welcome back to your learning space" : "Join your classroom community"}
          </p>
        </div>

        {/* Form Container */}
        <Card>
          <CardHeader>
            <CardTitle>
              {step === "signIn" ? "Sign In" : "Create Account"}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form
              onSubmit={(event) => {
                event.preventDefault();
                const formData = new FormData(event.currentTarget);
                void signIn("password", formData);
              }}
              className="space-y-4"
            >
              {/* Email Input */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Email Address
                </Label>
                <Input
                  id="email"
                  name="email"
                  placeholder="you@school.edu"
                  type="email"
                  required
                />
              </div>

              {/* Password Input */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Password
                </Label>
                <Input
                  id="password"
                  name="password"
                  placeholder="Enter your password"
                  type="password"
                  required
                />
              </div>

              <input name="flow" type="hidden" value={step} />

              {/* Submit Button */}
              <Button
                type="submit"
                className="w-full"
                size="lg"
              >
                {step === "signIn" ? "Sign In" : "Create Account"}
              </Button>

              {/* Switch Mode Button */}
              <Button
                type="button"
                variant="outline"
                size="lg"
                onClick={() => {
                  setStep(step === "signIn" ? "signUp" : "signIn");
                }}
                className="w-full"
              >
                {step === "signIn" ? "Need an account?" : "Already have an account?"}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer Message */}
        <div className="mt-6 text-center">
          <p className="text-sm font-base text-foreground opacity-60">
            Empowering education through AI-powered insights
          </p>
        </div>
      </div>
    </div>
  );
}