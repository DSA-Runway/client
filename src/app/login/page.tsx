"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AuthLeftPanel } from "@/components/auth/AuthLeftPanel";

/* ─── shared input style helpers ─── */
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

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) {
        setError("Invalid email or password. Please try again.");
      } else {
        router.push("/dashboard");
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    /* ── page wrapper with gradient bg matching second screenshot ── */
    <div
      className="relative min-h-screen w-full flex items-center justify-center overflow-hidden py-8 px-4"
      style={{
        background:
          "radial-gradient(ellipse 140% 65% at 50% -5%, rgba(67,56,202,0.42) 0%, rgba(14,12,38,0.55) 38%, transparent 62%), linear-gradient(to bottom, #0c0c20 0%, #060612 50%, #010106 100%)",
      }}
    >
      {/* ── Card ── */}
      <div
        className="relative z-10 w-full flex overflow-hidden"
        style={{
          maxWidth: "1040px",
          minHeight: "640px",
          borderRadius: "22px",
          boxShadow: "0 32px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Left image panel */}
        <AuthLeftPanel
          label="Your DSA Journey"
          heading={<>Master<br />Every<br />Algorithm</>}
          quote="AI-powered tutoring for Data Structures & Algorithms. Visualize, practice, and conquer every topic at your own pace."
        />

        {/* ── Right form panel ── */}
        <div
          className="w-full lg:w-[48%] flex flex-col items-center justify-between pt-14 pb-10 px-8 sm:px-14"
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

          {/* Form section */}
          <div className="w-full max-w-100">
            <h1
              className="text-gray-900 text-center mb-2"
              style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.9rem, 3vw, 2.4rem)", fontWeight: 400 }}
            >
              Welcome Back
            </h1>
            <p className="text-gray-500 text-sm text-center mb-7 leading-snug">
              Sign in to continue your DSA learning journey
            </p>

            {error && (
              <div className="mb-4 px-4 py-3 text-sm text-center text-red-600 bg-red-50 border border-red-200 rounded-2xl">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                    placeholder="Enter your password"
                    required
                    style={{ ...inputBase, padding: "11px 44px 11px 14px" }}
                    onFocus={onFocus}
                    onBlur={onBlur}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              {/* Remember me + Forgot Password */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-3.75 h-3.75 rounded cursor-pointer"
                    style={{ accentColor: "#111827" }}
                  />
                  <span className="text-sm text-gray-600">Remember me</span>
                </label>
                <Link href="/forgot-password" className="text-sm text-gray-700 font-medium hover:text-indigo-600 transition-colors">
                  Forgot Password
                </Link>
              </div>

              {/* Sign In */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-4.5 rounded-2xl text-white text-sm font-semibold tracking-wide transition-colors"
                style={{ background: isLoading ? "#555" : "#111827", cursor: isLoading ? "not-allowed" : "pointer" }}
                onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = "#1f2937"; }}
                onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = "#111827"; }}
              >
                {isLoading ? "Signing in…" : "Sign In"}
              </button>
            </form>

            {/* Google */}
            <button
              onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
              className="w-full flex items-center justify-center gap-3 mt-6 py-4.5 rounded-2xl border border-gray-200 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              style={{ cursor: "pointer" }}
            >
              <GoogleIcon />
              Sign In with Google
            </button>
          </div>

          {/* Footer */}
          <p className="text-sm text-gray-500">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-gray-900 font-semibold hover:text-indigo-600 transition-colors">
              Sign Up
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
