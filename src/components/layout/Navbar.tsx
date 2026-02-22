"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Menu, X } from "lucide-react";

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

  return (
    <>
      {/* ── Outer wrapper: handles fixed + centering ── */}
      <div style={{
        position: "fixed",
        top: "14px",
        left: "50%",
        transform: "translateX(-50%)",
        width: "calc(100% - 48px)",
        maxWidth: "1200px",
        zIndex: 50,
      }}>
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          style={{
            borderRadius: "999px",
            background: scrolled ? "rgba(2,8,18,0.97)" : "rgba(2,8,18,0.80)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            border: scrolled
              ? "1px solid rgba(255,255,255,0.11)"
              : "1px solid rgba(255,255,255,0.07)",
            boxShadow: scrolled
              ? "0 8px 32px rgba(0,0,0,0.55), inset 0 1px 0 rgba(255,255,255,0.06)"
              : "0 4px 20px rgba(0,0,0,0.3)",
            transition: "background 0.3s ease, border 0.3s ease, box-shadow 0.3s ease",
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
                <span style={{ fontWeight: 800, fontSize: "14px", color: "#fff", letterSpacing: "-0.4px" }}>DSA</span>
                <span style={{ fontWeight: 800, fontSize: "14px", color: "#f59e0b", letterSpacing: "-0.4px" }}> Tutor</span>
                <span style={{ marginLeft: "5px", fontSize: "8px", fontWeight: 700, color: "#f59e0b", background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.3)", padding: "1px 5px", borderRadius: "999px", letterSpacing: "0.04em" }}>AI</span>
              </div>
            </Link>

            {/* ── Desktop nav items — sliding ellipse ── */}
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: "2px" }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                {navItems.map((item) => {
                  const isActive = pathname === item.href;
                  const isHovered = hoveredItem === item.href;
                  const showPill = isHovered || (!hoveredItem && isActive);
                  return (
                    <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
                      <div
                        onMouseEnter={() => setHoveredItem(item.href)}
                        style={{ position: "relative", padding: "5px 13px", borderRadius: "999px", cursor: "pointer" }}
                      >
                        {/* Sliding pill background */}
                        {showPill && (
                          <motion.div
                            layoutId="nav-pill"
                            style={{
                              position: "absolute",
                              inset: 0,
                              borderRadius: "999px",
                              background: isActive
                                ? "rgba(245,158,11,0.12)"
                                : "rgba(255,255,255,0.07)",
                              border: isActive
                                ? "1px solid rgba(245,158,11,0.22)"
                                : "1px solid rgba(255,255,255,0.09)",
                            }}
                            transition={{ type: "spring", stiffness: 500, damping: 38 }}
                          />
                        )}
                        <span style={{
                          position: "relative",
                          zIndex: 1,
                          fontSize: "13px",
                          fontWeight: isActive ? 600 : 500,
                          color: isActive ? "#f59e0b" : isHovered ? "#e2e8f0" : "#8b99b5",
                          whiteSpace: "nowrap",
                          transition: "color 0.15s",
                          display: "block",
                        }}>
                          {item.label}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}

            {/* ── CTA buttons (desktop only) ── */}
            {!isMobile && (
              <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
                <Link href="/learn" style={{ textDecoration: "none" }}>
                  <motion.button
                    whileHover={{ color: "#fff", borderColor: "rgba(255,255,255,0.2)" }}
                    whileTap={{ scale: 0.96 }}
                    style={{ padding: "6px 16px", fontSize: "12px", fontWeight: 500, color: "#8b99b5", background: "transparent", border: "1px solid rgba(255,255,255,0.09)", borderRadius: "999px", cursor: "pointer" }}
                  >
                    Log In
                  </motion.button>
                </Link>
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

            {/* ── Mobile toggle ── */}
            {isMobile && (
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                style={{ display: "flex", alignItems: "center", justifyContent: "center", width: "34px", height: "34px", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "999px", cursor: "pointer", color: "#94a3b8" }}
              >
                {mobileOpen ? <X style={{ width: "15px", height: "15px" }} /> : <Menu style={{ width: "15px", height: "15px" }} />}
              </button>
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
              position: "fixed",
              top: "74px",
              left: "24px",
              right: "24px",
              zIndex: 49,
              background: "rgba(2,8,18,0.98)",
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              borderRadius: "22px",
              border: "1px solid rgba(255,255,255,0.08)",
              overflow: "hidden",
              boxShadow: "0 20px 60px rgba(0,0,0,0.5)",
            }}
          >
            <div style={{ padding: "10px", display: "flex", flexDirection: "column", gap: "3px" }}>
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} style={{ textDecoration: "none" }}>
                    <div style={{
                      padding: "10px 14px",
                      borderRadius: "12px",
                      fontSize: "14px",
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? "#f59e0b" : "#94a3b8",
                      background: isActive ? "rgba(245,158,11,0.08)" : "transparent",
                      border: isActive ? "1px solid rgba(245,158,11,0.2)" : "1px solid transparent",
                      cursor: "pointer",
                    }}>
                      {item.label}
                    </div>
                  </Link>
                );
              })}
              <div style={{ paddingTop: "8px", marginTop: "3px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
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
