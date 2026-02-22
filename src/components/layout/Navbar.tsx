"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BookOpen, LayoutDashboard, Code2, Brain, Menu, X, Zap } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: BookOpen },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/learn", label: "Learn", icon: Brain },
  { href: "/visualizer", label: "Visualizer", icon: Code2 },
  { href: "/topics", label: "Topics", icon: Zap },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <motion.nav
        initial={{ y: -80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-[#080810]/95 backdrop-blur-xl border-b border-[#1e1e3a] shadow-lg"
            : "bg-[#080810]/80 backdrop-blur-md border-b border-[#1e1e3a]/50"
        }`}
      >
        <div className="h-16 flex items-center justify-between" style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 32px" }}>
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative w-9 h-9">
              <div className="absolute inset-0 bg-[#f59e0b] rounded-lg opacity-20 group-hover:opacity-40 transition-opacity blur-sm" />
              <div className="relative w-9 h-9 bg-gradient-to-br from-[#f59e0b] to-[#d97706] rounded-lg flex items-center justify-center">
                <Brain className="w-5 h-5 text-black" />
              </div>
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">DSA</span>
              <span className="font-bold text-lg gold-text tracking-tight"> Tutor</span>
              <span className="ml-2 text-[10px] font-semibold bg-[#f59e0b]/10 text-[#f59e0b] px-1.5 py-0.5 rounded-full border border-[#f59e0b]/30">
                AI
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                      isActive
                        ? "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30"
                        : "text-gray-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </motion.div>
                </Link>
              );
            })}
          </div>

          {/* CTA buttons */}
          <div className="hidden md:flex items-center gap-3">
            <Link href="/learn">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-sm font-medium text-gray-300 hover:text-white border border-[#1e1e3a] hover:border-[#2a2a4a] rounded-lg transition-all duration-200"
              >
                Log In
              </motion.button>
            </Link>
            <Link href="/learn">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(245,158,11,0.4)" }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black rounded-lg transition-all duration-200"
              >
                Start Learning
              </motion.button>
            </Link>
          </div>

          {/* Mobile toggle */}
          <button
            className="md:hidden text-gray-400 hover:text-white p-2"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </motion.nav>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed top-16 left-0 right-0 z-40 bg-[#0e0e1a]/95 backdrop-blur-xl border-b border-[#1e1e3a] md:hidden"
          >
            <div className="px-4 py-4 flex flex-col gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)}>
                    <div
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        isActive
                          ? "bg-[#f59e0b]/10 text-[#f59e0b] border border-[#f59e0b]/30"
                          : "text-gray-400 hover:text-white hover:bg-white/5"
                      }`}
                    >
                      <item.icon className="w-4 h-4" />
                      {item.label}
                    </div>
                  </Link>
                );
              })}
              <div className="pt-2 flex gap-2">
                <Link href="/learn" className="flex-1" onClick={() => setMobileOpen(false)}>
                  <button className="w-full px-4 py-2 text-sm font-semibold bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black rounded-lg">
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
