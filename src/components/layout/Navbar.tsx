"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Menu, X, Sun, Moon } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";

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
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();

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
            <Link href="/" style={{ display: "flex", alignItems: "center", gap: "8px", textDecoration: "none", flexShrink: 0 }}>
              <div style={{ position: "relative", width: "26px", height: "26px" }}>
                <div style={{ position: "absolute", inset: 0, background: "#f59e0b", borderRadius: "7px", opacity: 0.2, filter: "blur(4px)" }} />
                <div style={{ position: "relative", width: "26px", height: "26px", background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: "7px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Brain style={{ width: "14px", height: "14px", color: "#000" }} />
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "baseline" }}>
                <span style={{ fontWeight: 800, fontSize: "14px", color: C.logoText, letterSpacing: "-0.4px", transition: "color 0.25s" }}>DSA</span>
                <span style={{ fontWeight: 800, fontSize: "14px", color: C.logoAccent, letterSpacing: "-0.4px", transition: "color 0.25s" }}> Tutor</span>
                <span style={{ marginLeft: "5px", fontSize: "8px", fontWeight: 700, color: C.logoAccent, background: isDark ? "rgba(245,158,11,0.12)" : "rgba(217,119,6,0.10)", border: `1px solid ${isDark ? "rgba(245,158,11,0.3)" : "rgba(217,119,6,0.28)"}`, padding: "1px 5px", borderRadius: "999px", letterSpacing: "0.04em", transition: "all 0.25s" }}>AI</span>
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

                {/* Log In */}
                <Link href="/learn" style={{ textDecoration: "none" }}>
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
