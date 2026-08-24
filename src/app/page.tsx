"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useTheme } from "@/context/ThemeContext";
import {
  Brain, Code2, Zap, Users, Star, ArrowRight, ChevronRight,
  GitBranch, Layers, BarChart3, Play, Upload,
  BookOpen, Target, TrendingUp, Award, Sparkles, Bot,
  Instagram, Twitter, Linkedin, Youtube
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const AGENTS = [
  { name: "Orchestrator", color: "#f59e0b", desc: "Routes & coordinates all agents" },
  { name: "Teacher", color: "#8b5cf6", desc: "Delivers DSA content" },
  { name: "Assessment", color: "#06b6d4", desc: "Evaluates understanding" },
  { name: "Feedback", color: "#10b981", desc: "Explains mistakes" },
  { name: "Learning Path", color: "#ec4899", desc: "Recommends next topics" },
];

const FEATURES = [
  { icon: Brain, title: "Multi-Agent AI Architecture", desc: "5 specialized agents — Teacher, Assessment, Feedback, Learning Path & Orchestrator — collaborate to deliver structured DSA tutoring.", color: "#f59e0b" },
  { icon: GitBranch, title: "Live DSA Visualizations", desc: "Watch algorithms execute step-by-step with animated linked lists, trees, graphs, and sorting algorithms.", color: "#8b5cf6" },
  { icon: Upload, title: "Multimodal Input", desc: "Upload handwritten solutions, diagrams, PDFs. Talk to your tutor via voice. Get instant structured feedback.", color: "#06b6d4" },
  { icon: Target, title: "RAG-Powered Accuracy", desc: "Retrieval-Augmented Generation ensures every response is grounded in your DSA syllabus — zero hallucinations.", color: "#10b981" },
  { icon: TrendingUp, title: "Persistent Learner Profile", desc: "Tracks mastery levels, recurring mistakes, and conceptual gaps across sessions for true personalization.", color: "#ec4899" },
  { icon: Zap, title: "Socratic Teaching Style", desc: "Guides with questions instead of giving answers. Encourages deep reasoning and problem-solving skills.", color: "#f59e0b" },
];

const TOPICS = ["Arrays", "Linked Lists", "Stacks", "Queues", "Trees", "Graphs", "Heaps", "Hashing", "Sorting", "Searching", "Dynamic Programming", "Recursion", "Backtracking", "Greedy", "Divide & Conquer", "Bit Manipulation"];

const STATS = [
  { value: "5", label: "AI Agents" },
  { value: "20+", label: "DSA Topics" },
  { value: "100%", label: "Curriculum Aligned" },
  { value: "∞", label: "Personalized" },
];

const STAT_CARDS = [
  { value: "5", label: "Specialized AI Agents", icon: Bot },
  { value: "20+", label: "DSA Topics Covered", icon: BookOpen },
  { value: "100%", label: "Curriculum Aligned", icon: Award },
  { value: "∞", label: "Personalized Sessions", icon: Sparkles },
];

const PARTICLE_XS = [5, 15, 25, 35, 45, 55, 65, 75, 85, 95, 10, 20, 30, 40, 50];

function FloatingParticle({ delay, x }: { delay: number; x: number }) {
  return (
    <motion.div
      style={{ position: "absolute", width: "2px", height: "2px", borderRadius: "50%", background: "#06b6d4", left: `${x}%`, bottom: 0 }}
      animate={{ y: [0, -600], opacity: [0, 0.6, 0], scale: [0, 1.5, 0] }}
      transition={{ duration: 6 + (x % 4), delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

function LinkedListAnimation() {
  const nodes = ["12", "→", "8", "→", "23", "→", "5", "→", "null"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
      {nodes.map((n, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15, duration: 0.4 }}>
          {n === "→" || n === "null" ? (
            <span style={{ color: "#f59e0b", fontSize: "13px", fontFamily: "monospace", fontWeight: 700 }}>{n}</span>
          ) : (
            <div style={{ width: "36px", height: "36px", borderRadius: "50%", border: "2px solid #f59e0b", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: "12px", fontFamily: "monospace", fontWeight: 700, boxShadow: "0 0 10px rgba(245,158,11,0.35)" }}>
              {n}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function GraphAnimation() {
  const nodes = [{ id: "A", x: 50, y: 20 }, { id: "B", x: 20, y: 65 }, { id: "C", x: 80, y: 65 }, { id: "D", x: 50, y: 90 }];
  const edges = [["A", "B"], ["A", "C"], ["B", "D"], ["C", "D"], ["B", "C"]];
  return (
    <svg viewBox="0 0 100 100" style={{ width: "120px", height: "120px" }}>
      {edges.map(([a, b], i) => {
        const from = nodes.find(n => n.id === a)!;
        const to = nodes.find(n => n.id === b)!;
        return <motion.line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }} transition={{ delay: i * 0.2 + 0.5, duration: 0.5 }} />;
      })}
      {nodes.map((node, i) => (
        <motion.g key={node.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}>
          <circle cx={node.x} cy={node.y} r="8" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.5" />
          <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#f59e0b" fontSize="6" fontWeight="bold" fontFamily="monospace">{node.id}</text>
        </motion.g>
      ))}
    </svg>
  );
}

const W = { maxWidth: "1152px", margin: "0 auto", padding: "0 24px" } as const;

export default function LandingPage() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const [activeAgent, setActiveAgent] = useState(0);
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
  const { isDark } = useTheme();

  /* ── Theme tokens ── */
  const PAGE_BG  = isDark ? "#020b18"               : "#f4f6fa";
  const CARD_BG  = isDark ? "rgba(3,14,30,0.95)"    : "rgba(255,255,255,0.97)";
  const BORDER   = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.09)";
  const TEXT1    = isDark ? "#fff"                   : "#0f172a";
  const TEXT2    = isDark ? "#64748b"                : "#475569";
  const TEXT3    = isDark ? "#94a3b8"                : "#64748b";
  const SECT_BG  = isDark ? "rgba(3,14,30,0.6)"     : "rgba(241,245,249,0.8)";
  const DIVIDER  = isDark ? "rgba(6,182,212,0.08)"  : "rgba(6,182,212,0.15)";

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".feature-card", { y: 50, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: featuresRef.current, start: "top 80%" } });
      gsap.fromTo(".stat-card", { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out", scrollTrigger: { trigger: ".stats-section", start: "top 85%" } });
    });
    const iv = setInterval(() => setActiveAgent(p => (p + 1) % AGENTS.length), 2000);
    return () => { ctx.revert(); clearInterval(iv); };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: PAGE_BG, color: TEXT1, overflowX: "hidden", transition: "background 0.3s ease, color 0.3s ease" }}>
      <Navbar />

      {/* ════════════════════════════════════ HERO ════════════════════════════════════ */}
      <motion.section
        style={{ y: yHero, position: "relative", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}
      >
        {/* ── Gradient glow background (NextGen.ai style) ── */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 60% at 0% 70%, rgba(6,182,212,0.14) 0%, transparent 50%), radial-gradient(ellipse 70% 70% at 90% 15%, rgba(139,92,246,0.2) 0%, transparent 55%), radial-gradient(ellipse 60% 60% at 55% 100%, rgba(6,80,160,0.1) 0%, transparent 60%)"
        }}/>
        {/* ── Subtle grid overlay ── */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none",
          backgroundImage: isDark
            ? "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)"
            : "linear-gradient(rgba(0,0,0,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(0,0,0,0.04) 1px,transparent 1px)",
          backgroundSize: "60px 60px"
        }}/>
        {/* ── Rising particles ── */}
        <div style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}>
          {PARTICLE_XS.map((x, i) => <FloatingParticle key={i} delay={i * 0.4} x={x} />)}
        </div>

        {/* ── Content ── */}
        <div style={{ position: "relative", zIndex: 10, textAlign: "center", width: "100%", maxWidth: "960px", margin: "0 auto", padding: "128px 24px 64px" }}>

          {/* Badge — teal pill like NextGen.ai */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "7px 20px", borderRadius: "999px",
              background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.25)", color: "#06b6d4",
              fontSize: "13px", fontWeight: 600, marginBottom: "24px", backdropFilter: "blur(12px)"
            }}>
            <Sparkles style={{ width: "14px", height: "14px" }} />
            AI-Powered DSA Tutoring — Now Live
            <span className="animate-pulse" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
          </motion.div>

          {/* Giant heading — mixed typography like NextGen.ai */}
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.1 }}
            style={{ fontSize: "clamp(46px, 6.5vw, 84px)", fontWeight: 900, lineHeight: 1.02, letterSpacing: "-2.5px", marginBottom: "22px" }}
          >
            Your Smart<br />
            <span className="gold-text-animated">Learning</span><br />
            <em style={{ fontStyle: "italic", fontWeight: 800, opacity: 0.9 }}>Companion</em>
          </motion.h1>

          {/* Subtext */}
          <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.25 }}
            style={{ fontSize: "17px", color: TEXT3, lineHeight: 1.7, maxWidth: "520px", margin: "0 auto 32px" }}
          >
            Practice DSA with an AI tutor that teaches like a mentor — Socratic questioning,
            live visualizations, and personalized learning paths.
          </motion.p>

          {/* CTA buttons — pill-shaped like NextGen.ai */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.35 }}
            style={{ display: "flex", justifyContent: "center", gap: "14px", flexWrap: "wrap", marginBottom: "44px" }}
          >
            <Link href="/learn">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 50px rgba(245,158,11,0.55), 0 0 100px rgba(245,158,11,0.2)" }}
                whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 36px",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", fontWeight: 700,
                  fontSize: "16px", borderRadius: "999px", border: "none", cursor: "pointer",
                  boxShadow: "0 0 30px rgba(245,158,11,0.3)"
                }}
              >
                <Play style={{ width: "18px", height: "18px" }} />
                Start Free Session
                <ArrowRight style={{ width: "18px", height: "18px" }} />
              </motion.button>
            </Link>
            <Link href="/visualizer">
              <motion.button
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 32px",
                  background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.05)", color: TEXT1, fontWeight: 600,
                  fontSize: "16px", borderRadius: "999px", border: `1px solid ${BORDER}`,
                  cursor: "pointer", backdropFilter: "blur(12px)"
                }}
              >
                <Code2 style={{ width: "18px", height: "18px", color: "#06b6d4" }} />
                See Visualizer
              </motion.button>
            </Link>
          </motion.div>

          {/* Mini stats row (like "40,000+ | logos" in NextGen.ai) */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}
            style={{ display: "flex", justifyContent: "center", alignItems: "center", flexWrap: "wrap", marginBottom: "56px" }}
          >
            {STATS.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center" }}>
                {i > 0 && <div style={{ width: "1px", height: "36px", background: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.12)", margin: "0 28px" }} />}
                <div style={{ textAlign: "center" }}>
                  <div className="gold-text" style={{ fontSize: "26px", fontWeight: 900, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontSize: "12px", color: TEXT2, marginTop: "4px", fontWeight: 500 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Preview card — centered, like product screenshot */}
          <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.65 }}
            style={{ position: "relative", maxWidth: "900px", margin: "0 auto" }}
          >
            <div style={{ borderRadius: "20px", overflow: "hidden", background: CARD_BG, border: "1px solid rgba(6,182,212,0.15)", boxShadow: "0 0 100px rgba(6,182,212,0.08), 0 0 60px rgba(245,158,11,0.05), 0 40px 80px rgba(0,0,0,0.6)" }}>
              {/* Titlebar */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: "rgba(2,8,18,0.8)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff5f57" }} />
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#febc2e" }} />
                <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#28c840" }} />
                <span style={{ marginLeft: "12px", fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>dsarunway.app — Agent Session</span>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#10b981" }}>
                  <span className="animate-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />Active
                </div>
              </div>
              {/* Body */}
              <div className="grid grid-cols-2" style={{ minHeight: "280px" }}>
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ borderRadius: "12px", padding: "12px", background: "linear-gradient(135deg,#061828,#0a1e38)", border: "1px solid rgba(6,182,212,0.2)", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Bot style={{ width: "12px", height: "12px", color: "#06b6d4" }} />
                      </div>
                      <p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>Let&apos;s explore <span style={{ color: "#f59e0b", fontWeight: 600 }}>Linked Lists</span>. What&apos;s the key difference vs arrays in memory?</p>
                    </div>
                  </div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }}
                    style={{ borderRadius: "12px", padding: "12px", background: "linear-gradient(135deg,#1a1a3e,#222248)", border: "1px solid rgba(245,158,11,0.2)", fontSize: "13px", marginLeft: "24px" }}>
                    <p style={{ color: "#cbd5e1", margin: 0 }}>Arrays are contiguous in memory, linked lists use pointers?</p>
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }}
                    style={{ borderRadius: "12px", padding: "12px", background: "linear-gradient(135deg,#061828,#0a1e38)", border: "1px solid rgba(16,185,129,0.2)", fontSize: "13px" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                      <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        <Sparkles style={{ width: "12px", height: "12px", color: "#10b981" }} />
                      </div>
                      <p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>Exactly! <span style={{ color: "#10b981", fontWeight: 600 }}>Great reasoning.</span> What does that mean for O(1) insertion?</p>
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }}
                    style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ display: "flex", gap: "4px" }}>
                      {[0, 1, 2].map(j => <div key={j} className="typing-dot" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#06b6d4" }} />)}
                    </div>
                    <span style={{ fontSize: "11px", color: "#475569" }}>AI thinking...</span>
                  </motion.div>
                </div>
                <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", justifyContent: "center" }}>
                  <p style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Live Visualization</p>
                  <LinkedListAnimation />
                  <div style={{ width: "100%", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "14px" }}>
                    <p style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", marginBottom: "8px" }}>Graph Traversal</p>
                    <div style={{ display: "flex", justifyContent: "center" }}><GraphAnimation /></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Floating agent badge */}
            <AnimatePresence mode="wait">
              <motion.div key={activeAgent} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="hidden xl:block"
                style={{ position: "absolute", top: "20px", right: "-16px", borderRadius: "12px", padding: "8px 12px", fontSize: "12px", fontWeight: 500, background: `${AGENTS[activeAgent].color}10`, border: `1px solid ${AGENTS[activeAgent].color}30`, color: AGENTS[activeAgent].color }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span className="animate-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: AGENTS[activeAgent].color, display: "inline-block" }} />
                  {AGENTS[activeAgent].name} Agent
                </div>
                <p style={{ color: "#475569", fontSize: "11px", marginTop: "2px", marginBottom: 0 }}>{AGENTS[activeAgent].desc}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          {/* Scroll cue */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }}
            style={{ marginTop: "48px", display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "#334155", textTransform: "uppercase", letterSpacing: "0.15em" }}>Scroll to explore</span>
            <motion.div animate={{ y: [0, 8, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}
              style={{ width: "1px", height: "32px", background: "linear-gradient(to bottom, rgba(6,182,212,0.5), transparent)" }} />
          </motion.div>
        </div>
      </motion.section>

      {/* ════════════════════════════════════ STATS ════════════════════════════════════ */}
      <section className="stats-section" style={{ padding: "80px 0", borderTop: `1px solid ${DIVIDER}`, borderBottom: `1px solid ${DIVIDER}`, background: SECT_BG }}>
        <div style={W}>
          <motion.div initial={{ opacity: 0, y: 50 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {STAT_CARDS.map((stat, i) => (
                <div key={i} className="stat-card" style={{ textAlign: "center", padding: "32px 20px", background: CARD_BG, border: `1px solid ${BORDER}`, borderRadius: "16px", cursor: "default", boxShadow: isDark ? "none" : "0 2px 16px rgba(0,0,0,0.06)" }}>
                  <div style={{ width: "52px", height: "52px", borderRadius: "14px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                    <stat.icon style={{ width: "24px", height: "24px", color: "#f59e0b" }} />
                  </div>
                  <div className="gold-text" style={{ fontSize: "40px", fontWeight: 900, lineHeight: 1, marginBottom: "8px" }}>{stat.value}</div>
                  <div style={{ fontSize: "13px", color: TEXT2, fontWeight: 500 }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ════════════════════════════════════ FEATURES ════════════════════════════════════ */}
      <section ref={featuresRef} style={{ padding: "100px 0", position: "relative" }}>
        <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", filter: "blur(120px)", background: "#8b5cf6", opacity: 0.06, top: "10%", right: "-100px", pointerEvents: "none" }} />
        <div style={W}>
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}
              style={{ display: "inline-block", color: "#06b6d4", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", padding: "4px 14px", borderRadius: "999px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", marginBottom: "16px" }}>
              Why DSARunway
            </motion.div>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }}
              style={{ fontSize: "clamp(28px, 3.5vw, 50px)", fontWeight: 900, lineHeight: 1.1, marginBottom: "16px" }}>
              Everything you need to <span className="gold-text">master DSA</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }}
              style={{ color: TEXT2, maxWidth: "480px", margin: "0 auto", fontSize: "17px", lineHeight: 1.75 }}>
              Built for engineering students who want more than just answers — a system that teaches you to think.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div key={i} className="feature-card"
                whileHover={{ y: -6, boxShadow: `0 24px 60px ${f.color}18`, borderColor: `${f.color}30` }}
                style={{ padding: "28px", borderRadius: "20px", background: CARD_BG, border: `1px solid ${BORDER}`, cursor: "default", boxShadow: isDark ? "none" : "0 2px 12px rgba(0,0,0,0.05)" }}
              >
                <div style={{ width: "50px", height: "50px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", background: `${f.color}10`, border: `1px solid ${f.color}25` }}>
                  <f.icon style={{ width: "24px", height: "24px", color: f.color }} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "16px", color: TEXT1, marginBottom: "10px" }}>{f.title}</h3>
                <p style={{ color: TEXT2, fontSize: "14px", lineHeight: 1.75, margin: 0 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ ARCHITECTURE ════════════════════════════════════ */}
      <section style={{ padding: "100px 0", borderTop: `1px solid ${DIVIDER}`, background: SECT_BG, position: "relative" }}>
        <div style={{ position: "absolute", width: "700px", height: "700px", borderRadius: "50%", filter: "blur(120px)", background: "#06b6d4", opacity: 0.04, top: "-10%", left: "-150px", pointerEvents: "none" }} />
        <div style={W}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div initial={{ opacity: 0, x: -50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}>
              <div style={{ display: "inline-block", color: "#06b6d4", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", padding: "4px 14px", borderRadius: "999px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", marginBottom: "16px" }}>
                Architecture
              </div>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 50px)", fontWeight: 900, lineHeight: 1.1, marginBottom: "16px" }}>
                5 AI Agents, <span className="gold-text">One Goal</span>
              </h2>
              <p style={{ color: TEXT2, fontSize: "17px", lineHeight: 1.75, marginBottom: "36px" }}>
                Our multi-agent orchestrator routes your queries to specialized agents — each trained with a specific pedagogical role.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {AGENTS.map((agent, i) => (
                  <motion.div key={i} whileHover={{ x: 6 }}
                    style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 16px", borderRadius: "14px", background: CARD_BG, border: `1px solid ${agent.color}20`, cursor: "default", boxShadow: isDark ? "none" : "0 1px 8px rgba(0,0,0,0.05)" }}
                  >
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${agent.color}10`, border: `1px solid ${agent.color}30` }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: agent.color, boxShadow: `0 0 8px ${agent.color}` }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: TEXT1 }}>{agent.name} Agent</div>
                      <div style={{ fontSize: "12px", color: TEXT2, marginTop: "2px" }}>{agent.desc}</div>
                    </div>
                    <ChevronRight style={{ width: "16px", height: "16px", color: isDark ? "#334155" : "#94a3b8", flexShrink: 0 }} />
                  </motion.div>
                ))}
              </div>
            </motion.div>
            {/* Orbital diagram */}
            <motion.div initial={{ opacity: 0, x: 50 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.75, delay: 0.15, ease: [0.16, 1, 0.3, 1] }} style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "relative", width: "340px", height: "340px" }}>
                {/* Orbit ring + connector spokes */}
                <svg width="340" height="340" viewBox="0 0 340 340" style={{ position: "absolute", inset: 0 }} aria-hidden="true">
                  <circle cx="170" cy="170" r="118" fill="none" stroke={isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.10)"} strokeWidth="1" strokeDasharray="4 6" />
                  {AGENTS.slice(1).map((agent, i) => {
                    const angle = (i / 4) * 2 * Math.PI - Math.PI / 2;
                    return (
                      <line key={i}
                        x1={170 + 52 * Math.cos(angle)} y1={170 + 52 * Math.sin(angle)}
                        x2={170 + 84 * Math.cos(angle)} y2={170 + 84 * Math.sin(angle)}
                        stroke={agent.color} strokeWidth="1.5" strokeOpacity="0.45" strokeDasharray="3 4" />
                    );
                  })}
                </svg>
                <motion.div
                  animate={{ boxShadow: ["0 0 20px rgba(245,158,11,0.3)", "0 0 50px rgba(245,158,11,0.6)", "0 0 20px rgba(245,158,11,0.3)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "96px", height: "96px", borderRadius: "50%", border: "2px solid #f59e0b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, background: "radial-gradient(ellipse, rgba(245,158,11,0.2), rgba(217,119,6,0.05))" }}
                >
                  <Brain style={{ width: "32px", height: "32px", color: "#f59e0b" }} />
                  <span style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700, marginTop: "4px" }}>Orchestrator</span>
                </motion.div>
                {AGENTS.slice(1).map((agent, i) => {
                  const angle = (i / 4) * 2 * Math.PI - Math.PI / 2;
                  const x = 170 + 118 * Math.cos(angle);
                  const y = 170 + 118 * Math.sin(angle);
                  return (
                    <motion.div key={i} style={{ position: "absolute", left: `${x}px`, top: `${y}px`, marginLeft: "-34px", marginTop: "-34px" }}
                      animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}>
                      <div style={{ width: "68px", height: "68px", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", background: isDark ? `${agent.color}15` : "#ffffff", border: `1.5px solid ${agent.color}55`, boxShadow: `0 0 15px ${agent.color}25` }}>
                        <span style={{ fontSize: "9.5px", fontWeight: 700, lineHeight: 1.3, padding: "0 6px", color: agent.color }}>{agent.name}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ TOPICS ════════════════════════════════════ */}
      <section style={{ padding: "80px 0 60px", borderTop: `1px solid ${DIVIDER}`, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: SECT_BG, pointerEvents: "none" }} />
        <div style={{ position: "relative", ...W, textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-80px" }} transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}>
            <div style={{ display: "inline-block", color: "#06b6d4", fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.15em", padding: "4px 14px", borderRadius: "999px", background: "rgba(6,182,212,0.08)", border: "1px solid rgba(6,182,212,0.2)", marginBottom: "16px" }}>
              Curriculum
            </div>
            <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 900, lineHeight: 1.1, marginBottom: "52px" }}>
              Full DSA <span className="gold-text">Curriculum</span> Coverage
            </h2>
          </motion.div>
          {/* Inline flex-wrap — guaranteed to wrap regardless of Tailwind */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", maxWidth: "1000px", margin: "0 auto" }}>
            {TOPICS.map((topic, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, scale: 0.85 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.08, borderColor: "rgba(6,182,212,0.4)", color: "#fff" }}
                style={{ padding: "10px 20px", borderRadius: "999px", fontSize: "14px", color: TEXT3, cursor: "default", background: CARD_BG, border: `1px solid ${BORDER}`, fontWeight: 500, boxShadow: isDark ? "none" : "0 1px 6px rgba(0,0,0,0.05)" }}
              >
                {topic}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════════════════════════ CTA — VIDEO BG ════════════════════════════════════ */}
      <section style={{ position: "relative", overflow: "hidden", minHeight: "600px", display: "flex", alignItems: "center", justifyContent: "center" }}>

        {/* ── Video background ── */}
        <video
          autoPlay muted loop playsInline
          style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", filter: isDark ? "blur(3px) brightness(0.28) saturate(0.6)" : "blur(3px) brightness(0.75) saturate(0.3)" }}
        >
          <source src="/typing.mp4" type="video/mp4" />
        </video>

        {/* ── Dark overlay ── */}
        <div style={{ position: "absolute", inset: 0, background: isDark ? "rgba(2,8,18,0.55)" : "rgba(241,245,249,0.65)" }} />

        {/* ── Gradient blend: fade into page bg at top & bottom ── */}
        <div style={{ position: "absolute", inset: 0, background: `linear-gradient(to bottom, ${PAGE_BG} 0%, transparent 18%, transparent 82%, ${PAGE_BG} 100%)`, pointerEvents: "none" }} />

        {/* ── Gold glow behind content ── */}
        <div style={{ position: "absolute", width: "600px", height: "300px", borderRadius: "50%", filter: "blur(100px)", background: "#f59e0b", opacity: 0.07, top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />

        {/* ── Content ── */}
        <motion.div
          initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{ position: "relative", zIndex: 10, textAlign: "center", padding: "80px 32px", maxWidth: "700px", width: "100%", margin: "0 auto" }}
        >
          {/* Label */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 18px", borderRadius: "999px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", fontSize: "13px", fontWeight: 600, marginBottom: "28px", backdropFilter: "blur(10px)" }}>
            <Sparkles style={{ width: "14px", height: "14px" }} />
            Your Journey Starts Here
          </div>

          {/* Heading */}
          <h2 style={{ fontSize: "clamp(36px, 5.5vw, 72px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-2px", marginBottom: "20px" }}>
            Ready to master <span className="gold-text">DSA?</span>
          </h2>

          {/* Subtext */}
          <p style={{ color: isDark ? "#94a3b8" : "#334155", marginBottom: "44px", fontSize: "18px", lineHeight: 1.7, maxWidth: "480px", margin: "0 auto 44px" }}>
            Join thousands of engineers learning DSA the smarter way — with a tutor that adapts to you.
          </p>

          {/* Buttons */}
          <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/learn">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 60px rgba(245,158,11,0.6), 0 0 120px rgba(245,158,11,0.25)" }}
                whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 36px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", fontWeight: 700, fontSize: "16px", borderRadius: "999px", border: "none", cursor: "pointer", boxShadow: "0 0 30px rgba(245,158,11,0.35)" }}
              >
                <Play style={{ width: "18px", height: "18px" }} />
                Start Free Session
                <ArrowRight style={{ width: "18px", height: "18px" }} />
              </motion.button>
            </Link>
            <Link href="/dashboard">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: "10px", padding: "16px 32px", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(255,255,255,0.9)", color: isDark ? "#fff" : "#0f172a", fontWeight: 600, fontSize: "16px", borderRadius: "999px", border: isDark ? "1px solid rgba(255,255,255,0.18)" : "1px solid rgba(15,23,42,0.15)", cursor: "pointer", backdropFilter: "blur(12px)" }}
              >
                <BarChart3 style={{ width: "18px", height: "18px", color: "#f59e0b" }} />
                View Dashboard
              </motion.button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "28px", marginTop: "36px", fontSize: "13px", color: isDark ? "#64748b" : "#475569", flexWrap: "wrap" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Star style={{ width: "13px", height: "13px", color: "#f59e0b" }} />Curriculum-Aligned</span>
            <span style={{ width: "1px", height: "14px", background: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.15)" }} />
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Users style={{ width: "13px", height: "13px", color: "#f59e0b" }} />Multi-Agent AI</span>
            <span style={{ width: "1px", height: "14px", background: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.15)" }} />
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Layers style={{ width: "13px", height: "13px", color: "#f59e0b" }} />RAG-Powered</span>
          </div>
        </motion.div>
      </section>

      {/* ════════════════════════════════════ FOOTER ════════════════════════════════════ */}
      <footer style={{ padding: "72px 0 0", borderTop: `1px solid ${DIVIDER}`, background: isDark ? "rgba(2,8,18,0.95)" : "rgba(241,245,249,0.95)", overflow: "hidden" }}>
        <div style={W}>

          {/* ── Footer card (100xDevs style) ── */}
          <div style={{ borderRadius: "20px", border: `1px solid ${BORDER}`, background: CARD_BG, padding: "44px 48px", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "40px", boxShadow: isDark ? "none" : "0 2px 16px rgba(0,0,0,0.06)" }}>

            {/* Col 1 — Brand */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "20px" }}>
                <div style={{ position: "relative", width: "36px", height: "36px" }}>
                  <div style={{ position: "absolute", inset: 0, background: "#f59e0b", borderRadius: "9px", opacity: 0.25, filter: "blur(6px)" }} />
                  <div style={{ position: "relative", width: "36px", height: "36px", background: "linear-gradient(135deg, #f59e0b, #d97706)", borderRadius: "9px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Brain style={{ width: "19px", height: "19px", color: "#000" }} />
                  </div>
                </div>
                <span style={{ fontWeight: 800, fontSize: "20px", color: TEXT1 }}>DSA<span style={{ color: "#f59e0b" }}>Runway</span></span>
              </div>
              <p style={{ fontSize: "14px", color: TEXT2, lineHeight: 1.8, margin: 0, maxWidth: "280px" }}>
                Learn DSA through Socratic AI tutoring, live visualizations, and
                personalized learning paths — built by the DSARunway team at
                Thapar Institute.
              </p>
            </div>

            {/* Col 2 — Learn links */}
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: TEXT1, marginBottom: "20px" }}>Learn</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { href: "/learn", label: "AI Tutor Session" },
                  { href: "/visualizer", label: "Algorithm Visualizer" },
                  { href: "/topics", label: "DSA Topics" },
                  { href: "/dashboard", label: "Progress Dashboard" },
                ].map(item => (
                  <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
                    <span style={{ fontSize: "14px", color: TEXT2, fontWeight: 500, transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f59e0b"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = isDark ? "#64748b" : "#475569"}
                    >{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Col 3 — DSARunway links */}
            <div>
              <div style={{ fontWeight: 700, fontSize: "15px", color: TEXT1, marginBottom: "20px" }}>DSARunway</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {[
                  { href: "/", label: "Home" },
                  { href: "/login", label: "Learner Login" },
                  { href: "/signup", label: "Create Account" },
                  { href: "/profile", label: "My Profile" },
                ].map(item => (
                  <Link key={item.label} href={item.href} style={{ textDecoration: "none" }}>
                    <span style={{ fontSize: "14px", color: TEXT2, fontWeight: 500, transition: "color 0.2s" }}
                      onMouseEnter={e => (e.currentTarget as HTMLElement).style.color = "#f59e0b"}
                      onMouseLeave={e => (e.currentTarget as HTMLElement).style.color = isDark ? "#64748b" : "#475569"}
                    >{item.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Col 4 — Socials + copyright */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {[
                  { Icon: Youtube, label: "YouTube" },
                  { Icon: Twitter, label: "Twitter" },
                  { Icon: Instagram, label: "Instagram" },
                  { Icon: Linkedin, label: "LinkedIn" },
                ].map(({ Icon, label }) => (
                  <motion.a key={label} href="#" aria-label={label}
                    whileHover={{ scale: 1.1, borderColor: "rgba(245,158,11,0.45)", color: "#f59e0b" }}
                    style={{ width: "44px", height: "44px", borderRadius: "12px", display: "flex", alignItems: "center", justifyContent: "center", background: isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.05)", border: isDark ? "1px solid rgba(255,255,255,0.09)" : "1px solid rgba(15,23,42,0.10)", color: TEXT2, cursor: "pointer" }}
                  >
                    <Icon style={{ width: "18px", height: "18px" }} />
                  </motion.a>
                ))}
              </div>
              <div style={{ fontSize: "13px", color: isDark ? "#475569" : "#64748b", lineHeight: 1.7 }}>
                © 2025–26 DSARunway. All rights reserved.
                <br />
                <span style={{ color: isDark ? "#334155" : "#94a3b8", fontSize: "12px" }}>
                  Sachin Goyal · Raghav Chhabra · Aksh Khurana · Prachi
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Giant brand watermark (100xDevs style) ── */}
        <div style={{ position: "relative", marginTop: "48px", paddingBottom: "0", userSelect: "none", pointerEvents: "none" }}>
          <div
            aria-hidden="true"
            style={{
              fontSize: "clamp(72px, 15.5vw, 250px)",
              fontWeight: 900,
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
              textAlign: "center",
              whiteSpace: "nowrap",
              backgroundImage: isDark
                ? "linear-gradient(to bottom, rgba(245,158,11,0.34) 0%, rgba(139,92,246,0.14) 60%, rgba(2,8,18,0) 100%)"
                : "linear-gradient(to bottom, rgba(15,23,42,0.22) 0%, rgba(139,92,246,0.10) 60%, rgba(241,245,249,0) 100%)",
              WebkitBackgroundClip: "text",
              backgroundClip: "text",
              WebkitTextFillColor: "transparent",
              color: "transparent",
              transform: "translateY(8%)",
            }}
          >
            DSARunway
          </div>
        </div>
      </footer>
    </div>
  );
}
