"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, Settings, LogOut, User } from "lucide-react";
import { LogoRolodex, LogoItem } from "@/components/animated-logo-rolodex";
import { useTheme } from "@/context/ThemeContext";
import { useSession, signOut } from "next-auth/react";
import { useProfileName } from "@/lib/useProfileName";

const navItems = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/learn", label: "Learn" },
  { href: "/visualizer", label: "Visualizer" },
  { href: "/topics", label: "Topics" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { name: profileName } = useProfileName();
  const isLoggedIn = status === "authenticated";
  const displayName = profileName || session?.user?.name || session?.user?.email?.split("@")[0] || "User";
  const initials = displayName.split(" ").map((w: string) => w[0]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("scroll", handleScroll);
    window.addEventListener("resize", checkMobile);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", checkMobile);
    };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) {
        setAvatarOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Dark: TUF-inspired — more transparent, prominent clean border outline ──
  const D = {
    navBg:              scrolled ? "rgba(4,9,22,0.90)"         : "rgba(4,9,22,0.68)",
    navBorder:          scrolled ? "rgba(255,255,255,0.14)"    : "rgba(255,255,255,0.11)",
    navShadow:          scrolled ? "0 8px 40px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.05)" : "0 4px 24px rgba(0,0,0,0.3)",
    text:               "#8b99b5",
    textHover:          "#e2e8f0",
    textActive:         "#f59e0b",
    pillActive:         "rgba(245,158,11,0.12)",
    pillActiveBorder:   "rgba(245,158,11,0.25)",
    pillHover:          "rgba(255,255,255,0.07)",
    pillHoverBorder:    "rgba(255,255,255,0.10)",
    loginColor:         "#8b99b5",
    loginBorder:        "rgba(255,255,255,0.10)",
    logoText:           "#fff",
    logoAccent:         "#f59e0b",
    toggleBg:           "rgba(255,255,255,0.07)",
    toggleBorder:       "rgba(255,255,255,0.11)",
    toggleColor:        "#94a3b8",
    mobileBg:           "rgba(3,7,18,0.98)",
    mobileBorder:       "rgba(255,255,255,0.08)",
    mobileItemActive:   "#f59e0b",
    mobileItemActiveBg: "rgba(245,158,11,0.08)",
    mobileItemActiveBr: "rgba(245,158,11,0.2)",
    mobileItemColor:    "#94a3b8",
    mobileDivider:      "rgba(255,255,255,0.06)",
  };

  // ── Light: etail.me-inspired — clean white, subtle shadow, dark text ──
  const L = {
    navBg:              scrolled ? "rgba(255,255,255,0.97)"    : "rgba(255,255,255,0.88)",
    navBorder:          scrolled ? "rgba(15,23,42,0.11)"       : "rgba(15,23,42,0.08)",
    navShadow:          scrolled ? "0 4px 28px rgba(0,0,0,0.09), inset 0 -1px 0 rgba(0,0,0,0.04)" : "0 2px 16px rgba(0,0,0,0.06)",
    text:               "#64748b",
    textHover:          "#0f172a",
    textActive:         "#d97706",
    pillActive:         "rgba(217,119,6,0.09)",
    pillActiveBorder:   "rgba(217,119,6,0.28)",
    pillHover:          "rgba(15,23,42,0.05)",
    pillHoverBorder:    "rgba(15,23,42,0.08)",
    loginColor:         "#475569",
    loginBorder:        "rgba(15,23,42,0.13)",
    logoText:           "#0f172a",
    logoAccent:         "#d97706",
    toggleBg:           "rgba(15,23,42,0.05)",
    toggleBorder:       "rgba(15,23,42,0.11)",
    toggleColor:        "#475569",
    mobileBg:           "rgba(255,255,255,0.99)",
    mobileBorder:       "rgba(15,23,42,0.09)",
    mobileItemActive:   "#d97706",
    mobileItemActiveBg: "rgba(217,119,6,0.07)",
    mobileItemActiveBr: "rgba(217,119,6,0.25)",
    mobileItemColor:    "#64748b",
    mobileDivider:      "rgba(15,23,42,0.07)",
  };

  const C = isDark ? D : L;

  return (
    <>
      {/* ── Outer wrapper ── */}
      <div style={{
        position:  "fixed",
        top:       "14px",
        left:      "50%",
        transform: "translateX(-50%)",
        width:     "calc(100% - 48px)",
        maxWidth:  "1200px",
        zIndex:    50,
      }}>
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            borderRadius:       "999px",
            background:         C.navBg,
            backdropFilter:     "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border:             `1px solid ${C.navBorder}`,
            boxShadow:          C.navShadow,
            transition:         "background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease",
          }}
        >
          <div style={{ height: "46px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 6px 0 16px" }}>

            {/* ── Logo ── */}
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "9px", textDecoration: "none", flexShrink: 0 }}>
              {/* Animated rolodex logo */}
              <div style={{ width: "53px", height: "39px", overflow: "hidden", flexShrink: 0, borderRadius: "10px" }}>
                <div style={{ transform: "scale(0.22)", transformOrigin: "top left" }}>
                  <LogoRolodex
                    items={[
                      <LogoItem key="D" className="bg-indigo-500 text-white">D</LogoItem>,
                      <LogoItem key="S" className="bg-violet-500 text-white">S</LogoItem>,
                      <LogoItem key="A" className="bg-fuchsia-500 text-white">A</LogoItem>,
                    ]}
                  />
                </div>
              </div>
              {/* Brand name */}
              <div style={{ display: "flex", alignItems: "baseline", gap: "0px" }}>
                <span style={{
                  fontWeight: 800,
                  fontSize: "14.5px",
                  letterSpacing: "-0.5px",
                  background: isDark
                    ? "linear-gradient(90deg, #e2e8f0 0%, #a78bfa 60%, #818cf8 100%)"
                    : "linear-gradient(90deg, #1e1b4b 0%, #4f46e5 60%, #7c3aed 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  transition: "opacity 0.25s",
                }}>DSA</span>
                <span style={{
                  fontWeight: 800,
                  fontSize: "14.5px",
                  letterSpacing: "-0.5px",
                  background: isDark
                    ? "linear-gradient(90deg, #a78bfa 0%, #f472b6 100%)"
                    : "linear-gradient(90deg, #7c3aed 0%, #db2777 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                  transition: "opacity 0.25s",
                }}>&nbsp;Runway</span>
              </div>
            </Link>

            {/* ── Desktop nav items — sliding pill ── */}
            {!isMobile && (
              <div
                style={{ display: "flex", alignItems: "center", gap: "2px" }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {navItems.map((item) => {
                  const isActive  = pathname === item.href;
                  const isHovered = hoveredItem === item.href;
                  const showPill  = isHovered || (!hoveredItem && isActive);
                  return (
                    <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                      <div
                        onMouseEnter={() => setHoveredItem(item.href)}
                        style={{ position: "relative", padding: "5px 13px", borderRadius: "999px", cursor: "pointer" }}
                      >
                        {showPill && (
                          <motion.div
                            layoutId="nav-pill"
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: "999px",
                              background: isActive ? C.pillActive : C.pillHover,
                              border:     isActive ? `1px solid ${C.pillActiveBorder}` : `1px solid ${C.pillHoverBorder}`,
                            }}
                            transition={{ type: "spring", stiffness: 500, damping: 38 }}
                          />
                        )}
                        <span style={{
                          position:   "relative",
                          zIndex:     1,
                          fontSize:   "13px",
                          fontWeight: isActive ? 600 : 500,
                          color:      isActive ? C.textActive : isHovered ? C.textHover : C.text,
                          whiteSpace: "nowrap",
                          transition: "color 0.15s",
                          display:    "block",
                        }}>
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ── Right side: theme toggle + CTA ── */}
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>

                {/* Theme toggle */}
                <motion.button
                  onClick={toggleTheme}
                  whileHover={{ scale: 1.08 }}
                  whileTap={{ scale: 0.92 }}
                  style={{
                    width:          "32px",
                    height:         "32px",
                    borderRadius:   "999px",
                    background:     C.toggleBg,
                    border:         `1px solid ${C.toggleBorder}`,
                    cursor:         "pointer",
                    display:        "flex",
                    alignItems:     "center",
                    justifyContent: "center",
                    color:          C.toggleColor,
                    transition:     "background 0.25s, border 0.25s",
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isDark ? (
                      <motion.span key="sun" initial={{ opacity: 0, rotate: -90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: 90, scale: 0.5 }} transition={{ duration: 0.2 }} style={{ display: "flex" }}>
                        <Sun style={{ width: "14px", height: "14px" }} />
                      </motion.span>
                    ) : (
                      <motion.span key="moon" initial={{ opacity: 0, rotate: 90, scale: 0.5 }} animate={{ opacity: 1, rotate: 0, scale: 1 }} exit={{ opacity: 0, rotate: -90, scale: 0.5 }} transition={{ duration: 0.2 }} style={{ display: "flex" }}>
                        <Moon style={{ width: "14px", height: "14px" }} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>

                {isLoggedIn ? (
                  /* ── User Avatar + Dropdown ── */
                  <div ref={avatarRef} style={{ position: "relative" }}>
                    <motion.button
                      onClick={() => setAvatarOpen(!avatarOpen)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      style={{
                        width: "34px", height: "34px", borderRadius: "999px",
                        background: "linear-gradient(135deg, #f59e0b, #d97706)",
                        border: "2px solid rgba(245,158,11,0.4)",
                        cursor: "pointer", display: "flex", alignItems: "center",
                        justifyContent: "center", fontSize: "12px", fontWeight: 800,
                        color: "#000", letterSpacing: "-0.5px",
                      }}
                    >
                      {initials}
                    </motion.button>

                    <AnimatePresence>
                      {avatarOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: -8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          style={{
                            position: "absolute", top: "calc(100% + 10px)", right: 0,
                            minWidth: "200px", borderRadius: "14px",
                            background: isDark ? "rgba(4,9,22,0.97)" : "rgba(255,255,255,0.99)",
                            border: `1px solid ${C.navBorder}`,
                            boxShadow: isDark ? "0 20px 50px rgba(0,0,0,0.6)" : "0 12px 40px rgba(0,0,0,0.13)",
                            overflow: "hidden", zIndex: 100,
                            backdropFilter: "blur(20px)",
                          }}
                        >
                          {/* User info header */}
                          <div style={{ padding: "14px 16px 12px", borderBottom: `1px solid ${C.navBorder}` }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ width: "36px", height: "36px", borderRadius: "999px", background: "linear-gradient(135deg, #f59e0b, #d97706)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "13px", fontWeight: 800, color: "#000", flexShrink: 0 }}>
                                {initials}
                              </div>
                              <div style={{ minWidth: 0 }}>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: isDark ? "#f0f4ff" : "#0f172a", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {displayName}
                                </div>
                                <div style={{ fontSize: "11px", color: C.text, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {session?.user?.email}
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Menu items */}
                          <div style={{ padding: "6px" }}>
                            <Link href="/profile" style={{ textDecoration: "none" }} onClick={() => setAvatarOpen(false)}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "9px", cursor: "pointer", color: C.text, fontSize: "13px", fontWeight: 500, transition: "background 0.15s" }}
                                onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                              >
                                <User style={{ width: "14px", height: "14px", flexShrink: 0 }} />
                                Profile Settings
                              </div>
                            </Link>
                            <Link href="/dashboard" style={{ textDecoration: "none" }} onClick={() => setAvatarOpen(false)}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "9px", cursor: "pointer", color: C.text, fontSize: "13px", fontWeight: 500, transition: "background 0.15s" }}
                                onMouseEnter={e => (e.currentTarget.style.background = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.06)")}
                                onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                              >
                                <Settings style={{ width: "14px", height: "14px", flexShrink: 0 }} />
                                Dashboard
                              </div>
                            </Link>
                            <div style={{ margin: "4px 0", borderTop: `1px solid ${C.navBorder}` }} />
                            <button
                              onClick={() => { setAvatarOpen(false); signOut({ callbackUrl: "/login" }); }}
                              style={{ display: "flex", alignItems: "center", gap: "10px", padding: "9px 10px", borderRadius: "9px", cursor: "pointer", color: "#ef4444", fontSize: "13px", fontWeight: 500, background: "transparent", border: "none", width: "100%", transition: "background 0.15s" }}
                              onMouseEnter={e => (e.currentTarget.style.background = "rgba(239,68,68,0.08)")}
                              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                            >
                              <LogOut style={{ width: "14px", height: "14px", flexShrink: 0 }} />
                              Sign Out
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                ) : (
                  <>
                    {/* Log In */}
                    <Link href="/login" style={{ textDecoration: "none" }}>
                      <motion.button
                        whileHover={{ scale: 1.03 }}
                        whileTap={{ scale: 0.96 }}
                        style={{ padding: "6px 16px", fontSize: "12px", fontWeight: 500, color: C.loginColor, background: "transparent", border: `1px solid ${C.loginBorder}`, borderRadius: "999px", cursor: "pointer", transition: "color 0.2s, border-color 0.2s" }}
                      >
                        Log In
                      </motion.button>
                    </Link>

                    {/* Start Learning */}
                    <Link href="/learn" style={{ textDecoration: "none" }}>
                      <motion.button
                        whileHover={{ scale: 1.04, boxShadow: "0 0 18px rgba(245,158,11,0.4)" }}
                        whileTap={{ scale: 0.96 }}
                        style={{ padding: "6px 16px", fontSize: "12px", fontWeight: 700, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", borderRadius: "999px", border: "none", cursor: "pointer" }}
                      >
                        Start Learning
                      </motion.button>
                    </Link>
                  </>
                )}
              </div>
            )}

            {/* ── Mobile: theme toggle + hamburger ── */}
            {isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <motion.button
                  onClick={toggleTheme}
                  whileTap={{ scale: 0.9 }}
                  style={{ width: "32px", height: "32px", borderRadius: "999px", background: C.toggleBg, border: `1px solid ${C.toggleBorder}`, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: C.toggleColor }}
                >
                  <AnimatePresence mode="wait">
                    {isDark ? (
                      <motion.span key="sun" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }} style={{ display: "flex" }}>
                        <Sun style={{ width: "13px", height: "13px" }} />
                      </motion.span>
                    ) : (
                      <motion.span key="moon" initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }} transition={{ duration: 0.15 }} style={{ display: "flex" }}>
                        <Moon style={{ width: "13px", height: "13px" }} />
                      </motion.span>
                    )}
                  </AnimatePresence>
                </motion.button>
                <button
                  onClick={() => setMobileOpen(!mobileOpen)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", background: C.toggleBg, border: `1px solid ${C.toggleBorder}`, borderRadius: "999px", cursor: "pointer", color: C.toggleColor }}
                >
                  {mobileOpen ? <X style={{ width: "15px", height: "15px" }} /> : <Menu style={{ width: "15px", height: "15px" }} />}
                </button>
              </div>
            )}
          </div>
        </motion.nav>
      </div>

      {/* ── Mobile menu ── */}
      <AnimatePresence>
        {mobileOpen && isMobile && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            style={{
              position:           "fixed",
              top:                "74px",
              left:               "24px",
              right:              "24px",
              zIndex:             49,
              background:         C.mobileBg,
              backdropFilter:     "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRadius:       "22px",
              border:             `1px solid ${C.mobileBorder}`,
              overflow:           "hidden",
              boxShadow:          isDark ? "0 20px 60px rgba(0,0,0,0.5)" : "0 12px 40px rgba(0,0,0,0.12)",
            }}
          >
            <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "3px" }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} style={{ textDecoration: "none" }}>
                    <div style={{
                      padding:    "10px 14px",
                      borderRadius: "12px",
                      fontSize:   "14px",
                      fontWeight: isActive ? 600 : 500,
                      color:      isActive ? C.mobileItemActive : C.mobileItemColor,
                      background: isActive ? C.mobileItemActiveBg : "transparent",
                      border:     isActive ? `1px solid ${C.mobileItemActiveBr}` : "1px solid transparent",
                      cursor:     "pointer",
                    }}>
                      {item.label}
                    </div>
                  </Link>
                );
              })}
              <div style={{ paddingTop: "8px", marginTop: "3px", borderTop: `1px solid ${C.mobileDivider}` }}>
                <Link href="/learn" onClick={() => setMobileOpen(false)} style={{ textDecoration: "none" }}>
                  <button style={{ width: "100%", padding: "11px", fontSize: "14px", fontWeight: 700, background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", borderRadius: "12px", border: "none", cursor: "pointer" }}>
                    Start Learning
                  </button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
