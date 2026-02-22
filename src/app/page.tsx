"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import {
  Brain, Code2, Zap, Users, Star, ArrowRight, ChevronRight,
  GitBranch, Layers, BarChart3, Play, Upload,
  BookOpen, Target, TrendingUp, Award, Sparkles, Bot, CheckCircle2
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
  { value: "5", label: "Specialized AI Agents", icon: Bot },
  { value: "20+", label: "DSA Topics Covered", icon: BookOpen },
  { value: "100%", label: "Curriculum Aligned", icon: Award },
  { value: "∞", label: "Personalized Sessions", icon: Sparkles },
];

const TRUST = [
  "Curriculum-aligned with your university syllabus",
  "5 specialized AI agents working in collaboration",
  "RAG-powered — grounded responses, no hallucinations",
];

function LinkedListAnimation() {
  const nodes = ["12", "→", "8", "→", "23", "→", "5", "→", "null"];
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "4px", flexWrap: "wrap", justifyContent: "center" }}>
      {nodes.map((n, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15, duration: 0.4 }}>
          {n === "→" || n === "null" ? (
            <span style={{ color: "#f59e0b", fontSize: "13px", fontFamily: "monospace", fontWeight: 700 }}>{n}</span>
          ) : (
            <div style={{ width: "38px", height: "38px", borderRadius: "50%", border: "2px solid #f59e0b", display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(245,158,11,0.1)", color: "#f59e0b", fontSize: "12px", fontFamily: "monospace", fontWeight: 700, boxShadow: "0 0 10px rgba(245,158,11,0.35)" }}>
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
    <svg viewBox="0 0 100 100" style={{ width: "130px", height: "130px" }}>
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

/* ── Shared styles ── */
const container = { maxWidth: "1400px", margin: "0 auto", padding: "0 32px" } as const;
const sectionBorder = { borderTop: "1px solid #1e1e3a" } as const;
const card = { background: "rgba(14,14,26,1)", border: "1px solid #1e1e3a", borderRadius: "16px" } as const;
const badge = { display: "inline-block" as const, color: "#f59e0b", fontSize: "12px", fontWeight: 700, textTransform: "uppercase" as const, letterSpacing: "0.15em", padding: "4px 14px", borderRadius: "999px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.2)", marginBottom: "16px" };

export default function LandingPage() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const [activeAgent, setActiveAgent] = useState(0);
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 0.3], [0, -60]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".feature-card", { y: 50, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.1, duration: 0.7, ease: "power3.out", scrollTrigger: { trigger: featuresRef.current, start: "top 80%" } });
      gsap.fromTo(".stat-card", { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.5, ease: "power3.out", scrollTrigger: { trigger: ".stats-section", start: "top 85%" } });
    });
    const iv = setInterval(() => setActiveAgent(p => (p + 1) % AGENTS.length), 2000);
    return () => { ctx.revert(); clearInterval(iv); };
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#fff", overflowX: "hidden" }}>
      <Navbar />

      {/* ─── HERO ─── */}
      <motion.section style={{ y: yHero, position: "relative" }}>
        {/* grid bg */}
        <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(245,158,11,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.04) 1px,transparent 1px)", backgroundSize: "60px 60px", pointerEvents: "none" }} />
        {/* orbs */}
        <div style={{ position: "absolute", width: "700px", height: "700px", borderRadius: "50%", filter: "blur(120px)", background: "#f59e0b", opacity: 0.05, top: "-10%", left: "45%", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", filter: "blur(100px)", background: "#8b5cf6", opacity: 0.07, top: "20%", right: "-5%", pointerEvents: "none" }} />

        <div style={{ position: "relative", zIndex: 10, ...container, paddingTop: "120px", paddingBottom: "100px" }}>
          {/* 2-column grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* ── LEFT: Text ── */}
            <div>
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ display: "inline-flex", alignItems: "center", gap: "8px", padding: "6px 16px", borderRadius: "999px", background: "rgba(245,158,11,0.08)", border: "1px solid rgba(245,158,11,0.25)", color: "#f59e0b", fontSize: "13px", fontWeight: 600, marginBottom: "28px" }}>
                <Sparkles style={{ width: "14px", height: "14px" }} />
                Agentic AI Tutor for DSA
                <span className="animate-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />
                Live
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, delay: 0.1 }} style={{ fontSize: "clamp(44px, 5.5vw, 76px)", fontWeight: 900, lineHeight: 1.0, letterSpacing: "-2px", marginBottom: "24px" }}>
                Your Smart<br />
                <span className="gold-text-animated">Learning</span><br />
                Companion
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} style={{ fontSize: "17px", color: "#94a3b8", lineHeight: 1.75, marginBottom: "40px", maxWidth: "460px" }}>
                Practice DSA with an AI tutor that teaches like a mentor —{" "}
                <span style={{ color: "#e2e8f0", fontWeight: 500 }}>Socratic questioning</span>,{" "}
                <span style={{ color: "#e2e8f0", fontWeight: 500 }}>live visualizations</span>, and{" "}
                <span style={{ color: "#e2e8f0", fontWeight: 500 }}>personalized learning paths</span>.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }} style={{ display: "flex", gap: "12px", flexWrap: "wrap", marginBottom: "48px" }}>
                <Link href="/learn">
                  <motion.button whileHover={{ scale: 1.04, boxShadow: "0 0 30px rgba(245,158,11,0.5)" }} whileTap={{ scale: 0.97 }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 28px", background: "linear-gradient(to right, #f59e0b, #d97706)", color: "#000", fontWeight: 700, fontSize: "15px", borderRadius: "12px", border: "none", cursor: "pointer" }}>
                    <Play style={{ width: "18px", height: "18px" }} />Start Free Session
                  </motion.button>
                </Link>
                <Link href="/visualizer">
                  <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 28px", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 600, fontSize: "15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>
                    <Code2 style={{ width: "18px", height: "18px", color: "#f59e0b" }} />See Visualizer
                  </motion.button>
                </Link>
              </motion.div>

              {/* Trust indicators */}
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {TRUST.map((text, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14px", color: "#64748b" }}>
                    <CheckCircle2 style={{ width: "16px", height: "16px", color: "#10b981", flexShrink: 0 }} />
                    {text}
                  </div>
                ))}
              </motion.div>
            </div>

            {/* ── RIGHT: Preview Card ── */}
            <motion.div initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.8, delay: 0.3 }} style={{ position: "relative" }}>
              <div style={{ borderRadius: "20px", overflow: "hidden", background: "rgba(14,14,26,0.98)", border: "1px solid #1e1e3a", boxShadow: "0 0 80px rgba(245,158,11,0.08), 0 40px 80px rgba(0,0,0,0.5)" }}>
                {/* Titlebar */}
                <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "12px 16px", background: "rgba(8,8,16,0.9)", borderBottom: "1px solid #1e1e3a" }}>
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff5f57" }} />
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#febc2e" }} />
                  <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#28c840" }} />
                  <span style={{ marginLeft: "12px", fontSize: "12px", color: "#475569", fontFamily: "monospace" }}>dsa-tutor.ai — Agent Session</span>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#10b981" }}>
                    <span className="animate-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} />Active
                  </div>
                </div>
                {/* Body: 2 cols */}
                <div className="grid grid-cols-2" style={{ minHeight: "300px" }}>
                  {/* Chat */}
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "12px", borderRight: "1px solid #1e1e3a" }}>
                    <div style={{ borderRadius: "12px", padding: "12px", background: "linear-gradient(135deg,#0e1628,#0e1e35)", border: "1px solid rgba(6,182,212,0.2)", fontSize: "13px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(6,182,212,0.15)", border: "1px solid rgba(6,182,212,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Bot style={{ width: "12px", height: "12px", color: "#06b6d4" }} />
                        </div>
                        <p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>Let&apos;s explore <span style={{ color: "#f59e0b", fontWeight: 600 }}>Linked Lists</span>. What&apos;s the key difference vs arrays in memory?</p>
                      </div>
                    </div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} style={{ borderRadius: "12px", padding: "12px", background: "linear-gradient(135deg,#1e1e3a,#252545)", border: "1px solid rgba(245,158,11,0.2)", fontSize: "13px", marginLeft: "24px" }}>
                      <p style={{ color: "#cbd5e1", margin: 0 }}>Arrays are contiguous in memory, linked lists use pointers?</p>
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }} style={{ borderRadius: "12px", padding: "12px", background: "linear-gradient(135deg,#0e1628,#0e1e35)", border: "1px solid rgba(16,185,129,0.2)", fontSize: "13px" }}>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                        <div style={{ width: "22px", height: "22px", borderRadius: "50%", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                          <Sparkles style={{ width: "12px", height: "12px", color: "#10b981" }} />
                        </div>
                        <p style={{ color: "#cbd5e1", lineHeight: 1.6, margin: 0 }}>Exactly! <span style={{ color: "#10b981", fontWeight: 600 }}>Great reasoning.</span> What does that mean for O(1) insertion?</p>
                      </div>
                    </motion.div>
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }} style={{ display: "flex", alignItems: "center", gap: "8px", marginLeft: "8px" }}>
                      <div style={{ display: "flex", gap: "4px" }}>
                        {[0, 1, 2].map(j => <div key={j} className="typing-dot" style={{ width: "7px", height: "7px", borderRadius: "50%", background: "#06b6d4" }} />)}
                      </div>
                      <span style={{ fontSize: "11px", color: "#475569" }}>AI thinking...</span>
                    </motion.div>
                  </div>
                  {/* Viz */}
                  <div style={{ padding: "20px", display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", justifyContent: "center" }}>
                    <p style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>Live Visualization</p>
                    <LinkedListAnimation />
                    <div style={{ width: "100%", borderTop: "1px solid #1e1e3a", paddingTop: "16px" }}>
                      <p style={{ fontSize: "11px", color: "#475569", textTransform: "uppercase", letterSpacing: "0.1em", textAlign: "center", marginBottom: "8px" }}>Graph Traversal</p>
                      <div style={{ display: "flex", justifyContent: "center" }}><GraphAnimation /></div>
                    </div>
                  </div>
                </div>
              </div>
              {/* Floating agent badge */}
              <AnimatePresence mode="wait">
                <motion.div key={activeAgent} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="hidden xl:block" style={{ position: "absolute", top: "24px", right: "-16px", borderRadius: "12px", padding: "8px 12px", fontSize: "12px", fontWeight: 500, background: `${AGENTS[activeAgent].color}12`, border: `1px solid ${AGENTS[activeAgent].color}30`, color: AGENTS[activeAgent].color }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span className="animate-pulse" style={{ width: "6px", height: "6px", borderRadius: "50%", background: AGENTS[activeAgent].color, display: "inline-block" }} />
                    {AGENTS[activeAgent].name} Agent
                  </div>
                  <p style={{ color: "#475569", fontSize: "11px", marginTop: "2px", marginBottom: 0 }}>{AGENTS[activeAgent].desc}</p>
                </motion.div>
              </AnimatePresence>
            </motion.div>
          </div>
        </div>
      </motion.section>

      {/* ─── STATS ─── */}
      <section className="stats-section" style={{ padding: "80px 0", ...sectionBorder, borderBottom: "1px solid #1e1e3a", background: "rgba(14,14,26,0.6)" }}>
        <div style={container}>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat, i) => (
              <div key={i} className="stat-card" style={{ ...card, textAlign: "center", padding: "32px 20px" }}>
                <div style={{ width: "54px", height: "54px", borderRadius: "16px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px" }}>
                  <stat.icon style={{ width: "26px", height: "26px", color: "#f59e0b" }} />
                </div>
                <div className="gold-text" style={{ fontSize: "42px", fontWeight: 900, lineHeight: 1, marginBottom: "8px" }}>{stat.value}</div>
                <div style={{ fontSize: "13px", color: "#64748b", fontWeight: 500 }}>{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section ref={featuresRef} style={{ padding: "100px 0", position: "relative" }}>
        <div style={{ position: "absolute", width: "500px", height: "500px", borderRadius: "50%", filter: "blur(100px)", background: "#8b5cf6", opacity: 0.04, top: "20%", right: 0, pointerEvents: "none" }} />
        <div style={container}>
          <div style={{ textAlign: "center", marginBottom: "72px" }}>
            <motion.span initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} style={badge}>
              Why DSA Tutor AI
            </motion.span>
            <motion.h2 initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 900, lineHeight: 1.1, marginBottom: "16px" }}>
              Everything you need to <span className="gold-text">master DSA</span>
            </motion.h2>
            <motion.p initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} transition={{ delay: 0.2 }} style={{ color: "#64748b", maxWidth: "480px", margin: "0 auto", fontSize: "17px", lineHeight: 1.75 }}>
              Built for engineering students who want more than just answers — a system that teaches you to think.
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={i}
                className="feature-card"
                whileHover={{ y: -6, boxShadow: `0 24px 60px ${f.color}18`, borderColor: `${f.color}30` }}
                style={{ ...card, padding: "28px", borderRadius: "20px", cursor: "default" }}
              >
                <div style={{ width: "52px", height: "52px", borderRadius: "14px", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "20px", background: `${f.color}12`, border: `1px solid ${f.color}30` }}>
                  <f.icon style={{ width: "26px", height: "26px", color: f.color }} />
                </div>
                <h3 style={{ fontWeight: 700, fontSize: "16px", color: "#fff", marginBottom: "10px" }}>{f.title}</h3>
                <p style={{ color: "#64748b", fontSize: "14px", lineHeight: 1.75, margin: 0 }}>{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AGENT ARCHITECTURE ─── */}
      <section style={{ padding: "100px 0", ...sectionBorder, background: "rgba(14,14,26,0.5)", position: "relative" }}>
        <div style={{ position: "absolute", width: "600px", height: "600px", borderRadius: "50%", filter: "blur(120px)", background: "#f59e0b", opacity: 0.03, top: 0, left: "-100px", pointerEvents: "none" }} />
        <div style={container}>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
            {/* Left */}
            <div>
              <span style={badge}>Architecture</span>
              <h2 style={{ fontSize: "clamp(28px, 3.5vw, 48px)", fontWeight: 900, lineHeight: 1.1, marginBottom: "16px" }}>
                5 AI Agents, <span className="gold-text">One Goal</span>
              </h2>
              <p style={{ color: "#64748b", fontSize: "17px", lineHeight: 1.75, marginBottom: "36px" }}>
                Our multi-agent orchestrator routes your queries to specialized agents — each trained with a specific pedagogical role.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {AGENTS.map((agent, i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x: 6 }}
                    style={{ display: "flex", alignItems: "center", gap: "16px", padding: "14px 16px", borderRadius: "14px", background: "rgba(14,14,26,1)", border: `1px solid ${agent.color}20`, cursor: "default" }}
                  >
                    <div style={{ width: "38px", height: "38px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${agent.color}10`, border: `1px solid ${agent.color}30` }}>
                      <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: agent.color, boxShadow: `0 0 8px ${agent.color}` }} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: "14px", color: "#fff" }}>{agent.name} Agent</div>
                      <div style={{ fontSize: "12px", color: "#64748b", marginTop: "2px" }}>{agent.desc}</div>
                    </div>
                    <ChevronRight style={{ width: "16px", height: "16px", color: "#334155", flexShrink: 0 }} />
                  </motion.div>
                ))}
              </div>
            </div>
            {/* Right: Orbital diagram */}
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
              <div style={{ position: "relative", width: "320px", height: "320px" }}>
                <motion.div
                  animate={{ boxShadow: ["0 0 20px rgba(245,158,11,0.3)", "0 0 40px rgba(245,158,11,0.6)", "0 0 20px rgba(245,158,11,0.3)"] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: "96px", height: "96px", borderRadius: "50%", border: "2px solid #f59e0b", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, background: "radial-gradient(ellipse, rgba(245,158,11,0.2), rgba(217,119,6,0.1))" }}
                >
                  <Brain style={{ width: "32px", height: "32px", color: "#f59e0b" }} />
                  <span style={{ fontSize: "10px", color: "#f59e0b", fontWeight: 700, marginTop: "4px" }}>Orchestrator</span>
                </motion.div>
                {AGENTS.slice(1).map((agent, i) => {
                  const angle = (i / 4) * 2 * Math.PI - Math.PI / 2;
                  const r = 120;
                  const x = 50 + (r / 160) * 100 * Math.cos(angle);
                  const y = 50 + (r / 160) * 100 * Math.sin(angle);
                  return (
                    <motion.div key={i} style={{ position: "absolute", left: `${x}%`, top: `${y}%`, transform: "translate(-50%,-50%)" }} animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 2, delay: i * 0.4, repeat: Infinity }}>
                      <div style={{ width: "64px", height: "64px", borderRadius: "50%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center", background: `${agent.color}15`, border: `1px solid ${agent.color}50`, boxShadow: `0 0 15px ${agent.color}30` }}>
                        <span style={{ fontSize: "9px", fontWeight: 700, lineHeight: 1.3, padding: "0 4px", color: agent.color }}>{agent.name}</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TOPICS ─── */}
      <section style={{ padding: "100px 0", ...sectionBorder, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", inset: 0, background: "rgba(14,14,26,0.6)", pointerEvents: "none" }} />
        <div style={{ position: "relative", ...container, textAlign: "center" }}>
          <span style={badge}>Curriculum</span>
          <h2 style={{ fontSize: "clamp(26px, 3.5vw, 44px)", fontWeight: 900, lineHeight: 1.1, marginBottom: "52px" }}>
            Full DSA <span className="gold-text">Curriculum</span> Coverage
          </h2>
          {/* inline flex-wrap to guarantee wrapping regardless of Tailwind parsing */}
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px", maxWidth: "1000px", margin: "0 auto" }}>
            {TOPICS.map((topic, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.85 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ scale: 1.08 }}
                style={{ padding: "10px 20px", borderRadius: "999px", fontSize: "14px", color: "#94a3b8", cursor: "default", background: "rgba(14,14,26,1)", border: "1px solid #1e1e3a", fontWeight: 500 }}
              >
                {topic}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section style={{ padding: "100px 0", ...sectionBorder, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", width: "700px", height: "700px", borderRadius: "50%", filter: "blur(120px)", background: "#f59e0b", opacity: 0.05, top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", maxWidth: "720px", margin: "0 auto", padding: "0 24px", textAlign: "center" }}>
          <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} style={{ borderRadius: "28px", padding: "64px 48px", background: "rgba(14,14,26,1)", border: "1px solid rgba(245,158,11,0.2)", boxShadow: "0 0 80px rgba(245,158,11,0.06)" }}>
            <div style={{ width: "64px", height: "64px", borderRadius: "18px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.3)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 24px" }}>
              <Sparkles style={{ width: "32px", height: "32px", color: "#f59e0b" }} />
            </div>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 48px)", fontWeight: 900, lineHeight: 1.1, marginBottom: "16px" }}>
              Ready to master <span className="gold-text">DSA?</span>
            </h2>
            <p style={{ color: "#64748b", marginBottom: "40px", fontSize: "18px", lineHeight: 1.7 }}>
              Start your personalized AI-powered learning journey today.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap" }}>
              <Link href="/learn">
                <motion.button whileHover={{ scale: 1.05, boxShadow: "0 0 40px rgba(245,158,11,0.5)" }} whileTap={{ scale: 0.97 }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 28px", background: "linear-gradient(to right, #f59e0b, #d97706)", color: "#000", fontWeight: 700, fontSize: "15px", borderRadius: "12px", border: "none", cursor: "pointer" }}>
                  <Play style={{ width: "18px", height: "18px" }} />Start Free Session<ArrowRight style={{ width: "18px", height: "18px" }} />
                </motion.button>
              </Link>
              <Link href="/dashboard">
                <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "14px 28px", background: "rgba(255,255,255,0.05)", color: "#fff", fontWeight: 600, fontSize: "15px", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.15)", cursor: "pointer" }}>
                  <BarChart3 style={{ width: "18px", height: "18px", color: "#f59e0b" }} />View Dashboard
                </motion.button>
              </Link>
            </div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "32px", marginTop: "32px", fontSize: "13px", color: "#475569", flexWrap: "wrap" }}>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Star style={{ width: "14px", height: "14px", color: "#f59e0b" }} />Curriculum-Aligned</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Users style={{ width: "14px", height: "14px", color: "#f59e0b" }} />Multi-Agent AI</span>
              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}><Layers style={{ width: "14px", height: "14px", color: "#f59e0b" }} />RAG-Powered</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer style={{ padding: "32px 0", borderTop: "1px solid #1e1e3a", background: "rgba(8,8,16,0.9)" }}>
        <div style={{ ...container, display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Brain style={{ width: "18px", height: "18px", color: "#f59e0b" }} />
            <span style={{ fontWeight: 700, fontSize: "14px", color: "#fff" }}>DSA Tutor AI</span>
            <span style={{ color: "#334155", fontSize: "12px" }}>— Thapar Institute Capstone 2025–26</span>
          </div>
          <div style={{ fontSize: "12px", color: "#334155" }}>Sachin Goyal · Raghav Chhabra · Aksh Khurana · Prachi</div>
        </div>
      </footer>
    </div>
  );
}
