"use client";

import { SignIn } from "./SignIn";

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex">
      {/* Left Side - Brand and Description */}
      <div className="flex-1 flex flex-col justify-center px-12 lg:px-24">
        <div className="max-w-lg">
          <h1 className="text-5xl lg:text-6xl font-bold text-black mb-8">
            Classroom<span className="text-blue-500">STUDIO</span>
          </h1>
          <p className="text-xl lg:text-2xl text-gray-800 leading-relaxed">
            Your all-in-one AI-powered tool for planning, creating, and grading engaging assignments
          </p>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="flex-1 flex items-center justify-center px-12">
        <SignIn />
      </div>
    </main>
  );
}
