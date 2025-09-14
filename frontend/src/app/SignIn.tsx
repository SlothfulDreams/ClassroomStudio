"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function SignIn() {
  const { signIn } = useAuthActions();
  const [flow, setFlow] = useState<"signUp" | "signIn">("signIn");

  return (
    <div className="w-full max-w-md bg-white border-4 border-black rounded-lg p-8" style={{ boxShadow: '4px 4px 0px 0px black' }}>
      {/* Header */}
      <div className="text-center mb-4">
        <h2 className="text-4xl font-bold text-black mb-4">
          Classroom<span className="text-teal-500">Studio</span>
        </h2>
        <h3 className="text-2xl font-bold text-black mb-2">
          {flow === "signIn" ? "Login to your account" : "Create your account"}
        </h3>
        <p className="text-gray-600 text-sm">
          {flow === "signIn"
            ? "Enter your email below to login to your account"
            : "Enter your details below to create your account"}
        </p>
      </div>

      {/* Form */}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          const formData = new FormData(event.currentTarget);
          void signIn("password", formData);
        }}
        className="space-y-4"
      >
        <div>
          <label className="block text-sm font-medium text-black mb-1">
            Email
          </label>
          <input
            name="email"
            placeholder="Enter an email..."
            type="email"
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-teal-500"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-black">
              Password
            </label>
            <a href="#" className="text-sm text-teal-600 hover:underline">
              Forgot your password?
            </a>
          </div>
          <input
            name="password"
            placeholder="Enter a password..."
            type="password"
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-teal-500"
            required
          />
        </div>

        <input name="flow" type="hidden" value={flow} />

        <button
          type="submit"
          className="w-full bg-teal-500 text-white py-3 rounded-md font-semibold hover:bg-teal-600 transition-colors"
          style={{ boxShadow: '4px 4px 0px 0px black' }}
        >
          {flow === "signIn" ? "Login" : "Sign Up"}
        </button>

        <div className="text-center mt-6">
          <span className="text-gray-600 text-sm">
            {flow === "signIn" ? "Don't have an account? " : "Already have an account? "}
            <button
              type="button"
              onClick={() => {
                setFlow(flow === "signIn" ? "signUp" : "signIn");
              }}
              className="text-teal-600 hover:underline font-semibold"
            >
              {flow === "signIn" ? "Sign up" : "Sign in"}
            </button>
          </span>
        </div>
      </form>
    </div>
  );
}