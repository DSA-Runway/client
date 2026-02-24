"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { User, Save, CheckCircle2, Mail, IdCard } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useTheme } from "@/context/ThemeContext";
import { useProfileName } from "@/lib/useProfileName";

const inputStyle = (isDark: boolean): React.CSSProperties => ({
  width: "100%",
  padding: "11px 14px",
  background: isDark ? "rgba(255,255,255,0.05)" : "#f8f9fb",
  border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb"}`,
  borderRadius: "10px",
  fontSize: "0.875rem",
  color: isDark ? "#f0f4ff" : "#111827",
  outline: "none",
  transition: "border-color 0.2s, box-shadow 0.2s",
  boxSizing: "border-box",
});

export default function ProfilePage() {
  const { isDark } = useTheme();
  const { data: session, status } = useSession();
  const router = useRouter();
  const { name: profileName, updateName } = useProfileName();

  const [displayName, setDisplayName] = useState("");
  const [saved, setSaved] = useState(false);

  const BG    = isDark ? "#070d1b" : "#f4f6f9";
  const CARD  = isDark ? "rgba(11,19,38,0.95)" : "rgba(255,255,255,0.97)";
  const BORDER = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.09)";
  const TEXT1 = isDark ? "#f0f4ff" : "#0f172a";
  const TEXT2 = isDark ? "#7d8ba3" : "#64748b";

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (profileName) setDisplayName(profileName);
    else if (session?.user?.name) setDisplayName(session.user.name);
  }, [profileName, session]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    updateName(displayName.trim());
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const initials = displayName
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase() || "?";

  if (status === "loading") {
    return (
      <div style={{ minHeight: "100vh", background: BG, display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ color: TEXT2, fontSize: "14px" }}>Loading…</div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT1 }}>
      <Navbar />
      <div style={{ height: "74px" }} />

      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "36px 24px 64px" }}>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>

          {/* Page header */}
          <div style={{ marginBottom: "28px" }}>
            <h1 style={{ fontSize: "22px", fontWeight: 900, margin: "0 0 4px", color: TEXT1 }}>Profile Settings</h1>
            <p style={{ fontSize: "14px", color: TEXT2, margin: 0 }}>Manage your display name and account info</p>
          </div>

          {/* Avatar preview card */}
          <div style={{ padding: "24px", borderRadius: "16px", background: CARD, border: `1px solid ${BORDER}`, marginBottom: "20px", display: "flex", alignItems: "center", gap: "18px" }}>
            <div style={{
              width: "68px", height: "68px", borderRadius: "999px", flexShrink: 0,
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "22px", fontWeight: 900, color: "#000",
              border: "3px solid rgba(245,158,11,0.3)",
            }}>
              {initials}
            </div>
            <div>
              <div style={{ fontSize: "17px", fontWeight: 700, color: TEXT1 }}>{displayName || "—"}</div>
              <div style={{ fontSize: "13px", color: TEXT2, marginTop: "2px" }}>{session?.user?.email}</div>
              <div style={{ fontSize: "11px", color: "#f59e0b", marginTop: "4px", display: "flex", alignItems: "center", gap: "4px" }}>
                <User style={{ width: "11px", height: "11px" }} />
                DSA Tutor AI Member
              </div>
            </div>
          </div>

          {/* Edit form */}
          <div style={{ padding: "24px", borderRadius: "16px", background: CARD, border: `1px solid ${BORDER}` }}>
            <h2 style={{ fontSize: "14px", fontWeight: 700, color: TEXT2, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "20px", marginTop: 0 }}>
              Edit Info
            </h2>

            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Display Name */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: TEXT1, marginBottom: "8px" }}>
                  <IdCard style={{ width: "14px", height: "14px", color: "#f59e0b" }} />
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Enter your name"
                  required
                  style={inputStyle(isDark)}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = "#f59e0b";
                    e.currentTarget.style.boxShadow = "0 0 0 3px rgba(245,158,11,0.12)";
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = isDark ? "rgba(255,255,255,0.1)" : "#e5e7eb";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
                <p style={{ fontSize: "11px", color: TEXT2, marginTop: "6px", marginBottom: 0 }}>
                  This name appears on your dashboard and navbar.
                </p>
              </div>

              {/* Email (read-only) */}
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "13px", fontWeight: 600, color: TEXT1, marginBottom: "8px" }}>
                  <Mail style={{ width: "14px", height: "14px", color: "#8b5cf6" }} />
                  Email
                </label>
                <input
                  type="email"
                  value={session?.user?.email || ""}
                  readOnly
                  style={{ ...inputStyle(isDark), opacity: 0.6, cursor: "not-allowed" }}
                />
                <p style={{ fontSize: "11px", color: TEXT2, marginTop: "6px", marginBottom: 0 }}>
                  Email cannot be changed in demo mode.
                </p>
              </div>

              {/* Save button */}
              <motion.button
                type="submit"
                whileHover={{ scale: 1.02, boxShadow: "0 0 20px rgba(245,158,11,0.3)" }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                  padding: "12px 24px", borderRadius: "10px", border: "none", cursor: "pointer",
                  background: saved ? "#10b981" : "linear-gradient(135deg, #f59e0b, #d97706)",
                  color: "#000", fontWeight: 700, fontSize: "14px",
                  transition: "background 0.3s",
                  marginTop: "4px",
                }}
              >
                {saved ? (
                  <>
                    <CheckCircle2 style={{ width: "16px", height: "16px" }} />
                    Saved!
                  </>
                ) : (
                  <>
                    <Save style={{ width: "16px", height: "16px" }} />
                    Save Changes
                  </>
                )}
              </motion.button>
            </form>
          </div>

        </motion.div>
      </div>
    </div>
  );
}
