import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export function SignIn() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"signUp" | "signIn">("signIn");

  return (
    <div className="w-full max-w-md bg-white border-4 border-black rounded-lg p-8">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-black mb-2">
          Classroom<span className="text-blue-500">STUDIO</span>
        </h2>
        <h3 className="text-xl font-semibold text-black mb-2">
          Login to your account
        </h3>
        <p className="text-gray-600 text-sm">
          Enter your email below to login to your account
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
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <div>
          <div className="flex justify-between items-center mb-1">
            <label className="block text-sm font-medium text-black">
              Password
            </label>
            <a href="#" className="text-sm text-blue-600 hover:underline">
              Forgot your password?
            </a>
          </div>
          <input
            name="password"
            placeholder="Enter a password..."
            type="password"
            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none focus:border-blue-500"
            required
          />
        </div>

        <input name="flow" type="hidden" value={step} />

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-3 rounded-md font-semibold hover:bg-blue-600 transition-colors"
        >
          Login
        </button>

        <button
          type="button"
          className="w-full bg-white border-2 border-gray-300 text-black py-3 rounded-md font-semibold hover:bg-gray-50 transition-colors"
        >
          Login with Google
        </button>

        <div className="text-center mt-6">
          <span className="text-gray-600 text-sm">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setStep(step === "signIn" ? "signUp" : "signIn");
              }}
              className="text-blue-600 hover:underline font-semibold"
            >
              Sign up
            </button>
          </span>
        </div>
      </form>
    </div>
  );
}
