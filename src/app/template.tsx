"use client";

import { motion } from "framer-motion";

// Re-mounts on every navigation — gives each page a soft fade-in.
// Opacity only: transforms here would break position:fixed children (navbar).
export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.3, ease: "easeOut" }}>
      {children}
    </motion.div>
  );
}
