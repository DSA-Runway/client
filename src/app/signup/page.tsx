"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";

const inputBase: React.CSSProperties = {
  width: "100%",
  padding: "11px 14px",
  background: "#f8f9fb",
  border: "1px solid #e5e7eb",
  borderRadius: "10px",
  fontSize: "0.875rem",
  color: "#111827",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
};
const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "#6366f1";
  e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
};
const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.currentTarget.style.borderColor = "#e5e7eb";
  e.currentTarget.style.boxShadow = "none";
};

export default function SignupPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }

    setIsLoading(true);
    try {
      // TODO: Replace with your actual registration API call
      // const res = await fetch("/api/auth/register", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ fullName, email, password }),
      // });
      // if (!res.ok) { const { message } = await res.json(); throw new Error(message); }

      // Auto sign-in after successful registration
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setSuccess(true); // registration succeeded but auto-login needs setup
      } else {
        router.push("/dashboard");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative w-full min-h-screen flex overflow-hidden">
      {/* ── Card (full-bleed) ── */}
      <div className="w-full min-h-screen flex">
        {/* Left image panel */}
        <AuthLeftPanel
          label="Join The Platform"
          heading={<>Start Your<br />DSA<br />Journey</>}
          quote="Join learners worldwide mastering Data Structures & Algorithms with AI-powered guidance tailored to your pace."
        />

        {/* ── Right form panel ── */}
        <div
          className="w-full lg:w-[48%] flex flex-col items-center justify-between pt-14 pb-9 px-8 sm:px-14"
          style={{ background: "#ffffff" }}
        >
          {/* Logo */}
          <div className="flex items-center gap-2 self-center">
            <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
              <ellipse cx="13" cy="13" rx="11" ry="5.5" stroke="#1a1a2e" strokeWidth="1.6" fill="none" />
              <ellipse cx="13" cy="13" rx="7.5" ry="3.5" stroke="#1a1a2e" strokeWidth="1.6" fill="none" />
              <ellipse cx="13" cy="13" rx="4" ry="1.8" fill="#1a1a2e" />
            </svg>
            <span className="text-gray-900 font-semibold text-[1.1rem] tracking-tight">DSA Tutor AI</span>
          </div>

          {/* Success state */}
          {success ? (
            <div className="w-full max-w-85 flex flex-col items-center text-center gap-4">
              <CheckCircle2 size={52} className="text-green-500" />
              <h2 className="text-gray-900 text-xl font-semibold">Account Created!</h2>
              <p className="text-gray-500 text-sm">
                Your account has been created. You can now sign in and start your DSA journey.
              </p>
              <Link
                href="/login"
                className="w-full py-3 rounded-2xl text-white text-sm font-semibold text-center transition-colors"
                style={{ background: "#111827" }}
              >
                Sign In
              </Link>
            </div>
          ) : (
            /* Form section */
            <div className="w-full max-w-85">
              <h1
                className="text-gray-900 text-center mb-2"
                style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3vw, 2.3rem)", fontWeight: 400 }}
              >
                Create Account
              </h1>
              <p className="text-gray-500 text-sm text-center mb-6 leading-snug">
                Sign up to start learning DSA with your AI tutor
              </p>

              {error && (
                <div className="mb-4 px-4 py-3 text-sm text-center text-red-600 bg-red-50 border border-red-200 rounded-2xl">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Full Name */}
                <div>
                  <label htmlFor="fullName" className="block text-gray-700 text-sm font-medium mb-1.5">Full Name</label>
                  <input
                    id="fullName"
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Enter your full name"
                    required
                    style={inputBase}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1.5">Email</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    required
                    style={inputBase}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-gray-700 text-sm font-medium mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      style={{ ...inputBase, padding: "11px 44px 11px 14px" }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button type="button" onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="block text-gray-700 text-sm font-medium mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <input
                      id="confirmPassword"
                      type={showConfirm ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Repeat your password"
                      required
                      style={{ ...inputBase, padding: "11px 44px 11px 14px" }}
                      onFocus={onFocus}
                      onBlur={onBlur}
                    />
                    <button type="button" onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors" tabIndex={-1}>
                      {showConfirm ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                {/* Sign Up */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-4.5 rounded-2xl text-white text-sm font-semibold tracking-wide transition-colors mt-1"
                  style={{ background: isLoading ? "#555" : "#111827", cursor: isLoading ? "not-allowed" : "pointer" }}
                  onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = "#1f2937"; }}
                  onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = "#111827"; }}
                >
                  {isLoading ? "Creating account…" : "Create Account"}
                </button>
              </form>

              {/* Google */}
              <button
                onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
                className="w-full flex items-center justify-center gap-3 mt-6 py-4.5 rounded-2xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                style={{ cursor: "pointer" }}
              >
                <GoogleIcon />
                Sign Up with Google
              </button>
            </div>
          )}

          {/* Footer */}
          <p className="text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="text-gray-900 font-semibold hover:text-indigo-600 transition-colors">
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.64 9.2045c0-.638-.0573-1.2518-.1636-1.8409H9v3.4818h4.8436c-.2086 1.125-.8427 2.0782-1.7959 2.7164v2.2581h2.9087C16.6582 14.0177 17.64 11.7945 17.64 9.2045z" fill="#4285F4" />
      <path d="M9 18c2.43 0 4.4673-.806 5.9564-2.1805l-2.9087-2.2581c-.8059.54-1.8368.859-3.0477.859-2.3441 0-4.3282-1.5836-5.036-3.7104H.9574v2.3318C2.4382 15.9832 5.4818 18 9 18z" fill="#34A853" />
      <path d="M3.964 10.71c-.18-.54-.2822-1.1168-.2822-1.71s.1023-1.17.2822-1.71V4.9582H.9574C.3477 6.173 0 7.5482 0 9s.3477 2.827.9574 4.0418L3.964 10.71z" fill="#FBBC05" />
      <path d="M9 3.5795c1.3214 0 2.5077.4541 3.4405 1.346l2.5813-2.5814C13.4632.8918 11.4259 0 9 0 5.4818 0 2.4382 2.0168.9574 4.9582L3.964 7.29C4.6718 5.1632 6.6559 3.5795 9 3.5795z" fill="#EA4335" />
    </svg>
  );
}
