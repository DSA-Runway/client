"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sun, Moon, Settings, LogOut, User } from "lucide-react";
import { useTheme } from "@/context/ThemeContext";
import { useSession, signOut } from "@/lib/fakeAuth";
import { useProfileName } from "@/lib/useProfileName";

const NAV_ITEMS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/learn", label: "Learn" },
  { href: "/visualizer", label: "Visualizer" },
  { href: "/topics", label: "Topics" },
];

const MENU_ITEM =
  "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-slate-600 transition-colors hover:bg-slate-900/5 dark:text-slate-300 dark:hover:bg-white/5";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [avatarOpen, setAvatarOpen] = useState(false);
  const avatarRef = useRef<HTMLDivElement>(null);
  const { isDark, toggleTheme } = useTheme();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const { name: profileName } = useProfileName();

  const isLoggedIn = status === "authenticated";
  const displayName = profileName || session?.user?.name || session?.user?.email?.split("@")[0] || "User";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (avatarRef.current && !avatarRef.current.contains(e.target as Node)) setAvatarOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <>
      <div className="fixed inset-x-0 top-3.5 z-50 flex justify-center px-5">
        <motion.nav
          initial={{ y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className={[
            "w-full rounded-full border backdrop-blur-2xl",
            "transition-[max-width,box-shadow,background-color,border-color] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
            scrolled ? "max-w-[880px]" : "max-w-[1100px]",
            "border-slate-900/10 bg-white/85 dark:border-white/10 dark:bg-ink-900/85",
            scrolled
              ? "shadow-[0_10px_40px_rgba(12,14,18,0.14)] dark:shadow-[0_10px_40px_rgba(0,0,0,0.55)]"
              : "shadow-[0_4px_20px_rgba(12,14,18,0.06)] dark:shadow-[0_4px_20px_rgba(0,0,0,0.3)]",
          ].join(" ")}
        >
          <div
            className={[
              "flex items-center justify-between pl-5 pr-2",
              "transition-[height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
              scrolled ? "h-[52px]" : "h-[64px]",
            ].join(" ")}
          >
            {/* Wordmark */}
            <Link href="/" className="flex shrink-0 items-center gap-2.5 no-underline">
              <Image
                src="/coe/coe-logo.jpg"
                alt="TIET-UQ Centre of Excellence in Data Science and AI"
                width={200}
                height={200}
                className={[
                  "rounded-full transition-[width,height] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)]",
                  scrolled ? "h-7 w-7" : "h-9 w-9",
                ].join(" ")}
                priority
              />
              <span className="font-display text-[19px] font-bold tracking-tight text-slate-900 dark:text-white">
                DSA<em className="brand-text font-semibold">Runway</em>
              </span>
            </Link>

            {/* Desktop nav — sliding pill */}
            <div className="hidden items-center gap-0.5 md:flex" onMouseLeave={() => setHovered(null)}>
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                const showPill = hovered === item.href || (!hovered && isActive);
                return (
                  <Link key={item.href} href={item.href} className="no-underline">
                    <div onMouseEnter={() => setHovered(item.href)} className="relative rounded-full px-3.5 py-1.5">
                      {showPill && (
                        <motion.div
                          layoutId="nav-pill"
                          transition={{ type: "spring", stiffness: 500, damping: 38 }}
                          className={[
                            "absolute inset-0 rounded-full border",
                            isActive
                              ? "border-crimson-500/25 bg-crimson-500/10"
                              : "border-slate-900/10 bg-slate-900/5 dark:border-white/10 dark:bg-white/5",
                          ].join(" ")}
                        />
                      )}
                      <span
                        className={[
                          "relative z-[1] block whitespace-nowrap text-[13.5px] transition-colors duration-150",
                          isActive
                            ? "font-bold text-crimson-600 dark:text-crimson-400"
                            : "font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white",
                        ].join(" ")}
                      >
                        {item.label}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Right cluster */}
            <div className="flex shrink-0 items-center gap-1.5">
              {/* Theme toggle */}
              <motion.button
                onClick={toggleTheme}
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/10 bg-slate-900/5 text-slate-500 transition-colors dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                <AnimatePresence mode="wait" initial={false}>
                  <motion.span
                    key={isDark ? "sun" : "moon"}
                    initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
                    animate={{ opacity: 1, rotate: 0, scale: 1 }}
                    exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
                    transition={{ duration: 0.2 }}
                    className="flex"
                  >
                    {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                  </motion.span>
                </AnimatePresence>
              </motion.button>

              {isLoggedIn ? (
                /* Avatar + dropdown */
                <div ref={avatarRef} className="relative">
                  <motion.button
                    onClick={() => setAvatarOpen(!avatarOpen)}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    aria-label="Account menu"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-crimson-500 to-royal-600 text-white ring-2 ring-crimson-500/30"
                  >
                    <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" aria-hidden>
                      <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.05 0-7.5 2.4-7.5 5.4 0 .88.72 1.6 1.6 1.6h11.8c.88 0 1.6-.72 1.6-1.6 0-3-3.45-5.4-7.5-5.4Z" />
                    </svg>
                  </motion.button>

                  <AnimatePresence>
                    {avatarOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -8, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -8, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-[calc(100%+12px)] z-[100] min-w-[210px] overflow-hidden rounded-2xl border border-slate-900/10 bg-white/98 shadow-[0_16px_50px_rgba(12,14,18,0.16)] backdrop-blur-2xl dark:border-white/10 dark:bg-ink-900/98 dark:shadow-[0_20px_50px_rgba(0,0,0,0.6)]"
                      >
                        <div className="border-b border-slate-900/10 px-4 py-3.5 dark:border-white/10">
                          <div className="flex items-center gap-2.5">
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-crimson-500 to-royal-600 text-white">
                              <svg viewBox="0 0 24 24" className="h-[18px] w-[18px] fill-white" aria-hidden>
                                <path d="M12 12a4.5 4.5 0 1 0 0-9 4.5 4.5 0 0 0 0 9Zm0 2c-4.05 0-7.5 2.4-7.5 5.4 0 .88.72 1.6 1.6 1.6h11.8c.88 0 1.6-.72 1.6-1.6 0-3-3.45-5.4-7.5-5.4Z" />
                              </svg>
                            </div>
                            <div className="min-w-0">
                              <div className="truncate text-[13px] font-bold text-slate-900 dark:text-white">{displayName}</div>
                              <div className="truncate text-[11px] text-slate-500 dark:text-slate-400">{session?.user?.email}</div>
                            </div>
                          </div>
                        </div>
                        <div className="p-1.5">
                          <Link href="/profile" className="no-underline" onClick={() => setAvatarOpen(false)}>
                            <span className={MENU_ITEM}>
                              <User className="h-3.5 w-3.5 shrink-0" />
                              Profile Settings
                            </span>
                          </Link>
                          <Link href="/dashboard" className="no-underline" onClick={() => setAvatarOpen(false)}>
                            <span className={MENU_ITEM}>
                              <Settings className="h-3.5 w-3.5 shrink-0" />
                              Dashboard
                            </span>
                          </Link>
                          <div className="my-1 border-t border-slate-900/10 dark:border-white/10" />
                          <button
                            onClick={() => { setAvatarOpen(false); signOut({ callbackUrl: "/login" }); }}
                            className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium text-red-500 transition-colors hover:bg-red-500/10"
                          >
                            <LogOut className="h-3.5 w-3.5 shrink-0" />
                            Sign Out
                          </button>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <div className="hidden items-center gap-1.5 md:flex">
                  <Link
                    href="/login"
                    className="rounded-full border border-slate-900/10 px-4 py-1.5 text-xs font-semibold text-slate-600 no-underline transition-colors hover:border-slate-900/25 hover:text-slate-900 dark:border-white/10 dark:text-slate-300 dark:hover:border-white/25 dark:hover:text-white"
                  >
                    Log In
                  </Link>
                  <Link
                    href="/learn"
                    className="rounded-full bg-slate-900 px-4 py-1.5 text-xs font-bold text-white no-underline transition-all hover:bg-crimson-600 dark:bg-white dark:text-slate-900 dark:hover:bg-crimson-500 dark:hover:text-white"
                  >
                    Start Learning
                  </Link>
                </div>
              )}

              {/* Mobile hamburger */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                aria-label={mobileOpen ? "Close menu" : "Open menu"}
                aria-expanded={mobileOpen}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/10 bg-slate-900/5 text-slate-500 md:hidden dark:border-white/10 dark:bg-white/5 dark:text-slate-300"
              >
                {mobileOpen ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
              </button>
            </div>
          </div>
        </motion.nav>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-x-5 top-[86px] z-[49] overflow-hidden rounded-3xl border border-slate-900/10 bg-white/98 shadow-[0_16px_50px_rgba(12,14,18,0.14)] backdrop-blur-2xl md:hidden dark:border-white/10 dark:bg-ink-900/98 dark:shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="flex flex-col gap-1 p-2.5">
              {NAV_ITEMS.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className="no-underline">
                    <span
                      className={[
                        "block rounded-xl border px-3.5 py-2.5 text-sm",
                        isActive
                          ? "border-crimson-500/25 bg-crimson-500/10 font-bold text-crimson-600 dark:text-crimson-400"
                          : "border-transparent font-medium text-slate-500 dark:text-slate-400",
                      ].join(" ")}
                    >
                      {item.label}
                    </span>
                  </Link>
                );
              })}
              <div className="mt-1 border-t border-slate-900/10 pt-2.5 dark:border-white/10">
                <Link href="/learn" onClick={() => setMobileOpen(false)} className="no-underline">
                  <span className="block rounded-xl bg-slate-900 py-2.5 text-center text-sm font-bold text-white dark:bg-white dark:text-slate-900">
                    Start Learning
                  </span>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
