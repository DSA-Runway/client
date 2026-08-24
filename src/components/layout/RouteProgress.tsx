"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Slim top loading bar that sweeps across on every route change,
 * plus a brief page-level shimmer so navigation feels intentional.
 */
export default function RouteProgress() {
  const pathname = usePathname();
  const [prevPath, setPrevPath] = useState(pathname);
  const [visible, setVisible] = useState(false);

  // adjust state during render (React-endorsed pattern) — no bar on first load
  if (pathname !== prevPath) {
    setPrevPath(pathname);
    setVisible(true);
  }

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(() => setVisible(false), 650);
    return () => clearTimeout(t);
  }, [visible, pathname]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key={pathname}
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.25 } }}
          style={{ position: "fixed", top: 0, left: 0, right: 0, height: "2.5px", zIndex: 200, pointerEvents: "none", background: "transparent" }}
          aria-hidden="true"
        >
          <motion.div
            initial={{ width: "0%" }}
            animate={{ width: ["0%", "62%", "100%"] }}
            transition={{ duration: 0.55, times: [0, 0.55, 1], ease: "easeOut" }}
            style={{ height: "100%", background: "linear-gradient(90deg, #f59e0b, #fbbf24, #f59e0b)", boxShadow: "0 0 10px rgba(245,158,11,0.6)", borderRadius: "0 2px 2px 0" }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
