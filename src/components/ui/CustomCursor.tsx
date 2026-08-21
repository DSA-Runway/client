"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const INTERACTIVE = "a, button, [role='button'], input, textarea, select, label, summary";

function subscribeFinePointer(callback: () => void) {
  const query = window.matchMedia("(pointer: fine)");
  query.addEventListener("change", callback);
  return () => query.removeEventListener("change", callback);
}

/**
 * Site-wide arrow cursor that glides on a spring — solid ink in light mode,
 * white in dark mode (each with a contrasting outline so it never vanishes).
 * Interactive elements scale it up and tint it crimson. Only mounts for
 * precise pointers — touch devices never see it.
 */
export default function CustomCursor() {
  const enabled = useSyncExternalStore(
    subscribeFinePointer,
    () => window.matchMedia("(pointer: fine)").matches,
    () => false,
  );
  const [visible, setVisible] = useState(false);
  const [hovering, setHovering] = useState(false);
  const [pressed, setPressed] = useState(false);

  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const sx = useSpring(x, { stiffness: 1000, damping: 60, mass: 0.35 });
  const sy = useSpring(y, { stiffness: 1000, damping: 60, mass: 0.35 });

  useEffect(() => {
    if (!enabled) return;

    const onMove = (e: MouseEvent) => {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      setHovering(!!(e.target as Element | null)?.closest?.(INTERACTIVE));
    };
    const onLeave = () => setVisible(false);
    const onDown = () => setPressed(true);
    const onUp = () => setPressed(false);

    window.addEventListener("mousemove", onMove, { passive: true });
    document.documentElement.addEventListener("mouseleave", onLeave);
    window.addEventListener("mousedown", onDown);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      window.removeEventListener("mousedown", onDown);
      window.removeEventListener("mouseup", onUp);
    };
  }, [enabled, x, y]);

  if (!enabled) return null;

  return (
    <motion.div
      aria-hidden
      style={{ x: sx, y: sy }}
      className="pointer-events-none fixed left-0 top-0 z-[9999]"
    >
      <motion.svg
        width="26"
        height="26"
        viewBox="0 0 24 24"
        animate={{
          scale: pressed ? 0.82 : hovering ? 1.25 : 1,
          opacity: visible ? 1 : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="-ml-[3px] -mt-[2px] origin-top-left drop-shadow-[0_2px_5px_rgba(0,0,0,0.3)]"
      >
        {/* Classic solid arrow — ink on light, white on dark, crimson on interactive */}
        <path
          d="M4.037 4.688a.495.495 0 0 1 .651-.651l16 6.5a.5.5 0 0 1-.063.947l-6.124 1.58a2 2 0 0 0-1.438 1.435l-1.579 6.126a.5.5 0 0 1-.947.063z"
          className={[
            "transition-colors duration-200",
            hovering
              ? "fill-crimson-500 stroke-white dark:stroke-ink-950"
              : "fill-slate-900 stroke-white dark:fill-white dark:stroke-ink-950",
          ].join(" ")}
          strokeWidth="1.4"
          strokeLinejoin="round"
        />
      </motion.svg>
    </motion.div>
  );
}
