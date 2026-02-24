"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, MailCheck } from "lucide-react";
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

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      // TODO: Replace with your actual password reset API call
      // const res = await fetch("/api/auth/forgot-password", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ email }),
      // });
      // if (!res.ok) throw new Error("Failed to send reset email.");

      // Simulate network delay
      await new Promise((r) => setTimeout(r, 800));
      setSent(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to send reset link. Please try again.");
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
          label="Password Reset"
          heading={<>Regain<br />Your<br />Access</>}
          quote="Don't worry — it happens. Enter your email and we'll send a secure link to reset your password."
        />

        {/* ── Right form panel ── */}
        <div
          className="w-full lg:w-[48%] flex flex-col items-center justify-between py-10 px-8 sm:px-14"
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

          {/* Content */}
          <div className="w-full max-w-85">
            {sent ? (
              /* ── Success state ── */
              <div className="flex flex-col items-center text-center gap-5">
                <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center">
                  <MailCheck size={32} className="text-indigo-600" />
                </div>
                <div>
                  <h1
                    className="text-gray-900 mb-2"
                    style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3vw, 2.2rem)", fontWeight: 400 }}
                  >
                    Check Your Email
                  </h1>
                  <p className="text-gray-500 text-sm leading-relaxed">
                    We sent a password reset link to <span className="font-semibold text-gray-700">{email}</span>.
                    Check your inbox and click the link to reset your password.
                  </p>
                </div>
                <p className="text-gray-500 text-sm">
                  Didn&apos;t receive it?{" "}
                  <button
                    onClick={() => setSent(false)}
                    className="text-gray-900 font-semibold hover:text-indigo-600 transition-colors"
                  >
                    Resend
                  </button>
                </p>
              </div>
            ) : (
              /* ── Form state ── */
              <>
                <h1
                  className="text-gray-900 text-center mb-2"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif", fontSize: "clamp(1.8rem, 3vw, 2.3rem)", fontWeight: 400 }}
                >
                  Forgot Password?
                </h1>
                <p className="text-gray-500 text-sm text-center mb-8 leading-snug">
                  Enter your registered email and we&apos;ll send you a reset link
                </p>

                {error && (
                  <div className="mb-4 px-4 py-3 text-sm text-center text-red-600 bg-red-50 border border-red-200 rounded-2xl">
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                  <div>
                    <label htmlFor="email" className="block text-gray-700 text-sm font-medium mb-1.5">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Enter your registered email"
                      required
                      style={inputBase}
                      onFocus={(e) => {
                        e.currentTarget.style.borderColor = "#6366f1";
                        e.currentTarget.style.boxShadow = "0 0 0 3px rgba(99,102,241,0.12)";
                      }}
                      onBlur={(e) => {
                        e.currentTarget.style.borderColor = "#e5e7eb";
                        e.currentTarget.style.boxShadow = "none";
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full py-4.5 rounded-2xl text-white text-sm font-semibold tracking-wide transition-colors"
                    style={{ background: isLoading ? "#555" : "#111827", cursor: isLoading ? "not-allowed" : "pointer" }}
                    onMouseEnter={(e) => { if (!isLoading) e.currentTarget.style.background = "#1f2937"; }}
                    onMouseLeave={(e) => { if (!isLoading) e.currentTarget.style.background = "#111827"; }}
                  >
                    {isLoading ? "Sending…" : "Send Reset Link"}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Footer */}
          <Link
            href="/login"
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition-colors"
          >
            <ArrowLeft size={14} />
            Back to Sign In
          </Link>
        </div>
      </div>
    </div>
  );
}
