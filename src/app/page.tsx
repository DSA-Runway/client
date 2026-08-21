"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import Navbar from "@/components/layout/Navbar";
import {
  Brain, Zap, ArrowRight, ArrowUpRight, GitBranch, Upload, Target,
  TrendingUp, Sparkles, Bot, Instagram, Twitter, Linkedin, Youtube,
} from "lucide-react";

/* ─────────────────────────────── Data ─────────────────────────────── */

const AGENTS = [
  { name: "Orchestrator", desc: "Routes every query and coordinates the agent team" },
  { name: "Teacher", desc: "Delivers concepts from the curriculum, step by step" },
  { name: "Assessment", desc: "Evaluates understanding with targeted questions" },
  { name: "Feedback", desc: "Explains mistakes and shows the correct reasoning" },
  { name: "Learning Path", desc: "Recommends what to study next, based on your gaps" },
];

const FEATURES = [
  { icon: Brain, title: "Multi-Agent Architecture", desc: "Five specialized agents — Teacher, Assessment, Feedback, Learning Path and Orchestrator — collaborate on every session." },
  { icon: GitBranch, title: "Live Visualizations", desc: "Watch algorithms execute step by step: linked lists, trees, graphs and sorting, animated as you learn." },
  { icon: Upload, title: "Multimodal Input", desc: "Upload handwritten solutions, diagrams or PDFs. Speak to your tutor. Get structured feedback instantly." },
  { icon: Target, title: "Grounded in the Syllabus", desc: "Retrieval-augmented generation keeps every answer anchored to the curriculum — no hallucinated shortcuts." },
  { icon: TrendingUp, title: "A Profile that Remembers", desc: "Mastery levels, recurring mistakes and conceptual gaps tracked across sessions, so teaching adapts to you." },
  { icon: Zap, title: "Socratic by Design", desc: "Questions before answers. The tutor guides your reasoning the way a good professor would." },
];

const TOPICS = [
  "Arrays", "Linked Lists", "Stacks", "Queues", "Trees", "Graphs", "Heaps", "Hashing",
  "Sorting", "Searching", "Dynamic Programming", "Recursion", "Backtracking", "Greedy",
  "Divide & Conquer", "Bit Manipulation",
];

const STATS = [
  { value: "5", label: "AI agents" },
  { value: "20+", label: "DSA topics" },
  { value: "100%", label: "Curriculum aligned" },
  { value: "1:1", label: "Personal tutoring" },
];

const PARTNERS = [
  { src: "/coe/tiet-white.png", alt: "Thapar Institute of Engineering & Technology", width: 193, height: 113, className: "h-12 w-auto" },
  { src: "/coe/coe-white.png", alt: "TIET-UQ Centre of Excellence in Data Science and AI", width: 1945, height: 399, className: "h-9 w-auto" },
  { src: "/coe/uq-white.png", alt: "The University of Queensland", width: 314, height: 69, className: "h-8 w-auto" },
];

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/learn", label: "Learn" },
  { href: "/visualizer", label: "Visualizer" },
  { href: "/topics", label: "Topics" },
];

const SOCIALS = [
  { Icon: Twitter, label: "Twitter" },
  { Icon: Instagram, label: "Instagram" },
  { Icon: Linkedin, label: "LinkedIn" },
  { Icon: Youtube, label: "YouTube" },
];

/* ──────────────────────────── Primitives ──────────────────────────── */

const EASE = [0.16, 1, 0.3, 1] as const;

const CONTAINER = "mx-auto w-full max-w-6xl px-6 md:px-8";

const BTN_PRIMARY =
  "group inline-flex items-center gap-2.5 rounded-full bg-slate-900 px-7 py-3.5 text-[15px] font-semibold text-white " +
  "transition-all duration-300 hover:-translate-y-0.5 hover:bg-crimson-600 hover:shadow-[0_12px_32px_rgba(214,31,69,0.35)] " +
  "active:scale-[0.98] dark:bg-white dark:text-slate-900 dark:hover:bg-crimson-500 dark:hover:text-white " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500";

const BTN_GHOST =
  "inline-flex items-center gap-2.5 rounded-full border border-slate-900/15 px-7 py-3.5 text-[15px] font-semibold text-slate-700 " +
  "transition-all duration-300 hover:-translate-y-0.5 hover:border-slate-900/35 " +
  "active:scale-[0.98] dark:border-white/15 dark:text-slate-200 dark:hover:border-white/35 " +
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-crimson-500";

function Reveal({ children, delay = 0, className }: { children: React.ReactNode; delay?: number; className?: string }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
    >
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 flex items-center justify-center gap-3 text-[11px] font-bold uppercase tracking-[0.28em] text-crimson-600 dark:text-crimson-400">
      <span className="h-px w-8 bg-crimson-500/40" />
      {children}
      <span className="h-px w-8 bg-crimson-500/40" />
    </p>
  );
}

function EyebrowLeft({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 flex items-center gap-3 text-[11px] font-bold uppercase tracking-[0.28em] text-crimson-600 dark:text-crimson-400">
      {children}
      <span className="h-px w-10 bg-crimson-500/40" />
    </p>
  );
}

/* White partner logos: rendered dark on paper, white in dark mode. */
function PartnerLogos({ className = "" }: { className?: string }) {
  return (
    <div className={`flex flex-wrap items-center gap-x-10 gap-y-6 ${className}`}>
      {PARTNERS.map((p) => (
        <Image
          key={p.src}
          src={p.src}
          alt={p.alt}
          width={p.width}
          height={p.height}
          className={`${p.className} brightness-0 opacity-60 transition-opacity hover:opacity-90 dark:brightness-100 dark:opacity-80`}
        />
      ))}
    </div>
  );
}

/* ─────────────────────── Hero preview window ─────────────────────── */

function LinkedListAnimation() {
  const nodes = ["12", "→", "8", "→", "23", "→", "5", "→", "null"];
  return (
    <div className="flex flex-wrap items-center justify-center gap-1">
      {nodes.map((n, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15, duration: 0.4 }}>
          {n === "→" || n === "null" ? (
            <span className="font-mono text-[13px] font-bold text-crimson-500">{n}</span>
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-crimson-500 bg-crimson-500/5 font-mono text-xs font-bold text-crimson-600 dark:text-crimson-400">
              {n}
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}

function GraphAnimation() {
  const nodes = [
    { id: "A", x: 50, y: 20 }, { id: "B", x: 20, y: 65 },
    { id: "C", x: 80, y: 65 }, { id: "D", x: 50, y: 90 },
  ];
  const edges: Array<[string, string]> = [["A", "B"], ["A", "C"], ["B", "D"], ["C", "D"], ["B", "C"]];
  return (
    <svg viewBox="0 0 100 100" className="h-[110px] w-[110px]" role="img" aria-label="Animated graph traversal">
      {edges.map(([a, b], i) => {
        const from = nodes.find((n) => n.id === a)!;
        const to = nodes.find((n) => n.id === b)!;
        return (
          <motion.line
            key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
            stroke="#7c3aed" strokeWidth="1.5" strokeOpacity="0.5"
            initial={{ pathLength: 0, opacity: 0 }} animate={{ pathLength: 1, opacity: 1 }}
            transition={{ delay: i * 0.2 + 0.5, duration: 0.5 }}
          />
        );
      })}
      {nodes.map((node, i) => (
        <motion.g key={node.id} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: i * 0.15, type: "spring", stiffness: 200 }}>
          <circle cx={node.x} cy={node.y} r="8" fill="#7c3aed" fillOpacity="0.12" stroke="#7c3aed" strokeWidth="1.5" />
          <text x={node.x} y={node.y + 1} textAnchor="middle" dominantBaseline="middle" fill="#7c3aed" fontSize="6" fontWeight="bold" fontFamily="monospace">
            {node.id}
          </text>
        </motion.g>
      ))}
    </svg>
  );
}

function HeroPreview({ activeAgent }: { activeAgent: number }) {
  return (
    <div className="relative mx-auto max-w-4xl">
      <div className="overflow-hidden rounded-2xl border border-slate-900/10 bg-white shadow-[0_32px_80px_rgba(12,14,18,0.12)] dark:border-white/10 dark:bg-ink-900 dark:shadow-[0_32px_80px_rgba(0,0,0,0.5)]">
        {/* Titlebar */}
        <div className="flex items-center gap-2 border-b border-slate-900/8 bg-slate-50 px-4 py-3 dark:border-white/5 dark:bg-ink-950/60">
          <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
          <span className="h-3 w-3 rounded-full bg-[#febc2e]" />
          <span className="h-3 w-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 font-mono text-xs text-slate-400 dark:text-slate-500">dsarunway — agent session</span>
          <span className="ml-auto flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-emerald-500" />
            Live
          </span>
        </div>
        {/* Body */}
        <div className="grid min-h-[280px] grid-cols-1 text-left sm:grid-cols-2">
          <div className="flex flex-col gap-3 p-5 sm:border-r sm:border-slate-900/8 dark:sm:border-white/5">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-crimson-500/10">
                <Bot className="h-3.5 w-3.5 text-crimson-600 dark:text-crimson-400" />
              </div>
              <p className="m-0 rounded-2xl rounded-tl-md bg-slate-100 p-3 text-[13px] leading-relaxed text-slate-700 dark:bg-ink-800 dark:text-slate-300">
                Let&apos;s explore <span className="font-semibold text-crimson-600 dark:text-crimson-400">Linked Lists</span>.
                What&apos;s the key difference vs arrays in memory?
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.2 }} className="ml-9">
              <p className="m-0 rounded-2xl rounded-tr-md bg-slate-900 p-3 text-[13px] leading-relaxed text-white dark:bg-white dark:text-slate-900">
                Arrays are contiguous in memory, linked lists use pointers?
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.0 }} className="flex items-start gap-2.5">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-emerald-500/10">
                <Sparkles className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <p className="m-0 rounded-2xl rounded-tl-md bg-slate-100 p-3 text-[13px] leading-relaxed text-slate-700 dark:bg-ink-800 dark:text-slate-300">
                Exactly — <span className="font-semibold text-emerald-600 dark:text-emerald-400">great reasoning.</span> So
                what does that mean for O(1) insertion?
              </p>
            </motion.div>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 2.8 }} className="ml-9 flex items-center gap-2">
              <div className="flex gap-1">
                {[0, 1, 2].map((j) => (
                  <span key={j} className="typing-dot h-1.5 w-1.5 rounded-full bg-slate-400" />
                ))}
              </div>
              <span className="text-[11px] text-slate-400 dark:text-slate-500">thinking…</span>
            </motion.div>
          </div>
          <div className="flex flex-col items-center justify-center gap-3 p-5">
            <p className="m-0 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Live visualization</p>
            <LinkedListAnimation />
            <div className="w-full border-t border-slate-900/8 pt-3.5 dark:border-white/5">
              <p className="mb-2 text-center text-[10px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Graph traversal</p>
              <div className="flex justify-center"><GraphAnimation /></div>
            </div>
          </div>
        </div>
      </div>

      {/* Rotating agent chip */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeAgent}
          initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
          className="absolute -right-5 top-6 hidden rounded-xl border border-slate-900/10 bg-white px-3.5 py-2.5 text-left shadow-[0_12px_32px_rgba(12,14,18,0.12)] xl:block dark:border-white/10 dark:bg-ink-800"
        >
          <span className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-white">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-crimson-500" />
            {AGENTS[activeAgent].name} Agent
          </span>
          <p className="m-0 mt-0.5 max-w-[190px] text-[11px] leading-snug text-slate-500 dark:text-slate-400">{AGENTS[activeAgent].desc}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

/* ─────────────────────────────── Page ─────────────────────────────── */

export default function LandingPage() {
  const [activeAgent, setActiveAgent] = useState(0);

  useEffect(() => {
    const iv = setInterval(() => setActiveAgent((p) => (p + 1) % AGENTS.length), 2600);
    return () => clearInterval(iv);
  }, []);

  return (
    <div className="min-h-screen overflow-x-hidden text-slate-900 dark:text-white">
      <Navbar />

      {/* ═══════════════════════════ HERO ═══════════════════════════ */}
      <section className="relative">
        {/* Soft brand wash */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 55% 45% at 50% 0%, rgba(214,31,69,0.08) 0%, transparent 62%)," +
              "radial-gradient(ellipse 35% 35% at 88% 18%, rgba(124,58,237,0.07) 0%, transparent 60%)," +
              "radial-gradient(ellipse 35% 35% at 10% 30%, rgba(214,31,69,0.05) 0%, transparent 60%)",
          }}
        />
        <div className={`${CONTAINER} relative pb-24 pt-40 text-center md:pt-44`}>
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, ease: EASE }}>
            <Eyebrow>TIET-UQ Centre of Excellence · Data Science &amp; AI</Eyebrow>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.08, ease: EASE }}
            className="font-display mx-auto mb-7 max-w-4xl text-[clamp(42px,6vw,76px)] font-medium leading-[1.08] tracking-[-0.02em]"
          >
            Your runway to mastering{" "}
            <em className="brand-text">Data Structures &amp; Algorithms.</em>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2, ease: EASE }}
            className="mx-auto mb-10 max-w-[560px] text-[17px] leading-relaxed text-slate-600 dark:text-slate-400"
          >
            An agentic AI tutor built on your curriculum — Socratic questioning, live
            visualizations, and a learning path that adapts to how you think.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3, ease: EASE }}
            className="mb-16 flex flex-wrap items-center justify-center gap-4"
          >
            <Link href="/learn" className={BTN_PRIMARY}>
              Start learning
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </Link>
            <Link href="/visualizer" className={BTN_GHOST}>
              Explore the visualizer
            </Link>
          </motion.div>

          {/* Editorial stats row */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }}
            className="mx-auto mb-20 flex max-w-2xl flex-wrap items-center justify-center"
          >
            {STATS.map((s, i) => (
              <div key={s.label} className="flex items-center">
                {i > 0 && <div className="mx-8 h-10 w-px bg-slate-900/10 dark:bg-white/10" />}
                <div className="text-center">
                  <div className="font-display text-[30px] font-semibold leading-none">{s.value}</div>
                  <div className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-500 dark:text-slate-400">{s.label}</div>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.9, delay: 0.55, ease: EASE }}>
            <HeroPreview activeAgent={activeAgent} />
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════ PARTNER STRIP ══════════════════════ */}
      <section className="border-y border-slate-900/8 bg-white/60 py-12 dark:border-white/5 dark:bg-ink-900/40">
        <div className={`${CONTAINER} flex flex-col items-center gap-6 md:flex-row md:justify-between`}>
          <p className="m-0 text-[11px] font-bold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">
            An initiative of
          </p>
          <PartnerLogos className="justify-center" />
        </div>
      </section>

      {/* ══════════════════════ ABOUT THE CENTRE ══════════════════════ */}
      <section className="py-28">
        <div className={CONTAINER}>
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2 lg:gap-20">
            <Reveal>
              <EyebrowLeft>About the Centre</EyebrowLeft>
              <h2 className="font-display mb-6 text-[clamp(30px,3.4vw,46px)] font-medium leading-[1.12] tracking-[-0.01em]">
                Built where two universities meet —{" "}
                <em className="brand-text">Thapar and Queensland.</em>
              </h2>
              <p className="mb-6 max-w-xl text-base leading-[1.8] text-slate-600 dark:text-slate-400">
                DSARunway is a capstone initiative under the TIET-UQ Centre of Excellence in Data
                Science and Artificial Intelligence — a joint venture between Thapar Institute of
                Engineering &amp; Technology, Patiala and The University of Queensland, Brisbane,
                transforming industries and lives in India and Australia through innovation-led
                Data Science and AI.
              </p>
              <p className="font-display mb-10 text-xl italic text-slate-500 dark:text-slate-400">
                “Innovating Intelligence”
              </p>
              <a
                href="https://dsai.thapar.edu/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 border-b border-slate-900/20 pb-1 text-sm font-semibold text-slate-900 transition-colors hover:border-crimson-500 hover:text-crimson-600 dark:border-white/20 dark:text-white dark:hover:border-crimson-400 dark:hover:text-crimson-400"
              >
                Visit dsai.thapar.edu
                <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </Reveal>

            <Reveal delay={0.15}>
              <div className="relative">
                <div className="overflow-hidden rounded-3xl border border-slate-900/10 shadow-[0_32px_80px_rgba(12,14,18,0.16)] dark:border-white/10">
                  <Image
                    src="/coe/about1.webp"
                    alt="The TIET-UQ Centre of Excellence in Data Science and AI"
                    width={5064}
                    height={2960}
                    sizes="(min-width: 1024px) 45vw, 90vw"
                    className="h-auto w-full object-cover"
                  />
                </div>
                {/* Centre seal */}
                <div className="absolute -bottom-6 -left-6 hidden rounded-full border-4 border-paper bg-white p-1 shadow-[0_12px_32px_rgba(12,14,18,0.18)] md:block dark:border-ink-950">
                  <Image src="/coe/coe-logo.jpg" alt="" aria-hidden width={200} height={200} className="h-20 w-20 rounded-full" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════ FEATURES ═══════════════════════════ */}
      <section className="border-t border-slate-900/8 bg-white/60 py-28 dark:border-white/5 dark:bg-ink-900/40">
        <div className={CONTAINER}>
          <Reveal className="mb-16 text-center">
            <Eyebrow>Why DSARunway</Eyebrow>
            <h2 className="font-display mx-auto mb-5 max-w-2xl text-[clamp(30px,3.4vw,46px)] font-medium leading-[1.12]">
              More than answers — <em className="brand-text">a system that teaches.</em>
            </h2>
            <p className="mx-auto max-w-lg text-base leading-relaxed text-slate-600 dark:text-slate-400">
              Built for engineering students who want to reason, not memorise.
            </p>
          </Reveal>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((f, i) => (
              <Reveal key={f.title} delay={i * 0.05}>
                <div className="group h-full rounded-2xl border border-slate-900/8 bg-white p-7 transition-all duration-300 hover:-translate-y-1.5 hover:border-crimson-500/30 hover:shadow-[0_24px_48px_rgba(12,14,18,0.10)] dark:border-white/8 dark:bg-ink-900 dark:hover:border-crimson-400/30 dark:hover:shadow-[0_24px_48px_rgba(0,0,0,0.4)]">
                  <div className="mb-6 flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 transition-colors duration-300 group-hover:bg-crimson-600 dark:bg-white dark:group-hover:bg-crimson-500">
                    <f.icon className="h-5 w-5 text-white transition-colors duration-300 dark:text-slate-900 dark:group-hover:text-white" />
                  </div>
                  <h3 className="mb-2.5 text-[17px] font-bold tracking-tight">{f.title}</h3>
                  <p className="m-0 text-sm leading-[1.75] text-slate-600 dark:text-slate-400">{f.desc}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ ARCHITECTURE ═══════════════════════ */}
      <section className="py-28">
        <div className={CONTAINER}>
          <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
            <Reveal>
              <EyebrowLeft>Architecture</EyebrowLeft>
              <h2 className="font-display mb-6 text-[clamp(30px,3.4vw,46px)] font-medium leading-[1.12]">
                Five agents. <em className="brand-text">One tutor.</em>
              </h2>
              <p className="mb-10 max-w-xl text-base leading-[1.8] text-slate-600 dark:text-slate-400">
                An orchestrator routes every question to the right specialist — each agent trained
                for a specific pedagogical role.
              </p>
              <ol className="m-0 list-none p-0">
                {AGENTS.map((agent, i) => (
                  <li
                    key={agent.name}
                    className="group flex items-baseline gap-6 border-t border-slate-900/10 py-5 transition-colors last:border-b hover:bg-slate-900/[0.02] dark:border-white/10 dark:hover:bg-white/[0.02]"
                  >
                    <span className="font-display w-9 shrink-0 text-lg italic text-slate-400 transition-colors group-hover:text-crimson-500 dark:text-slate-500">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <span className="block text-[15px] font-bold tracking-tight">{agent.name}</span>
                      <span className="mt-0.5 block text-sm leading-relaxed text-slate-500 dark:text-slate-400">{agent.desc}</span>
                    </div>
                  </li>
                ))}
              </ol>
            </Reveal>

            {/* Orbit — restrained, monochrome + crimson core */}
            <Reveal delay={0.15} className="flex items-center justify-center">
              <div className="relative h-[340px] w-[340px]">
                <div aria-hidden className="absolute inset-[34px] rounded-full border border-dashed border-slate-900/15 dark:border-white/15" />
                {/* Animated connectors — a signal pulses from the orchestrator to each agent */}
                <svg aria-hidden viewBox="0 0 340 340" className="absolute inset-0 h-full w-full">
                  {AGENTS.slice(1).map((agent, i) => {
                    const angle = (i / 4) * 2 * Math.PI - Math.PI / 2;
                    const x2 = 170 + 136 * Math.cos(angle);
                    const y2 = 170 + 136 * Math.sin(angle);
                    return (
                      <g key={agent.name}>
                        <motion.line
                          x1={170} y1={170} x2={x2} y2={y2}
                          strokeWidth="1.5" strokeDasharray="3 7" strokeLinecap="round"
                          className="stroke-slate-900/20 dark:stroke-white/20"
                          animate={{ strokeDashoffset: [0, -20] }}
                          transition={{ duration: 1.4, repeat: Infinity, ease: "linear" }}
                        />
                        <motion.circle
                          r="3.5"
                          className="fill-crimson-500"
                          initial={{ cx: 170, cy: 170, opacity: 0 }}
                          animate={{ cx: [170, x2], cy: [170, y2], opacity: [0, 1, 0] }}
                          transition={{ duration: 1.8, delay: i * 0.45, repeat: Infinity, repeatDelay: 1.8, ease: "easeInOut" }}
                        />
                      </g>
                    );
                  })}
                </svg>
                <motion.div
                  animate={{ scale: [1, 1.04, 1] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute left-1/2 top-1/2 z-10 flex h-28 w-28 -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-full bg-gradient-to-br from-crimson-500 to-royal-600 text-white shadow-[0_16px_40px_rgba(214,31,69,0.35)]"
                >
                  <Brain className="h-8 w-8" />
                  <span className="mt-1 text-[10px] font-bold uppercase tracking-wider">Orchestrator</span>
                </motion.div>
                {AGENTS.slice(1).map((agent, i) => {
                  const angle = (i / 4) * 2 * Math.PI - Math.PI / 2;
                  const x = 50 + 40 * Math.cos(angle);
                  const y = 50 + 40 * Math.sin(angle);
                  return (
                    <div
                      key={agent.name}
                      className="absolute flex h-[74px] w-[74px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-slate-900/12 bg-white text-center shadow-[0_8px_24px_rgba(12,14,18,0.08)] dark:border-white/12 dark:bg-ink-800"
                      style={{ left: `${x}%`, top: `${y}%` }}
                    >
                      <span className="px-1.5 text-[10px] font-bold leading-tight text-slate-700 dark:text-slate-200">{agent.name}</span>
                    </div>
                  );
                })}
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CURRICULUM ═══════════════════════ */}
      <section className="border-t border-slate-900/8 bg-white/60 py-28 text-center dark:border-white/5 dark:bg-ink-900/40">
        <div className={CONTAINER}>
          <Reveal>
            <Eyebrow>Curriculum</Eyebrow>
            <h2 className="font-display mx-auto mb-5 max-w-2xl text-[clamp(28px,3.4vw,44px)] font-medium leading-[1.12]">
              Mapped to <em className="brand-text">your syllabus.</em>
            </h2>
            <p className="mx-auto mb-12 max-w-xl text-base leading-relaxed text-slate-600 dark:text-slate-400">
              From Data Structures (UCS301) through Design &amp; Analysis of Algorithms — every
              topic in the core CSE sequence, taught in order.
            </p>
          </Reveal>
          <div className="mx-auto flex max-w-3xl flex-wrap justify-center gap-2.5">
            {TOPICS.map((topic, i) => (
              <motion.span
                key={topic}
                initial={{ opacity: 0, scale: 0.9 }} whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }} transition={{ delay: i * 0.03 }}
                className="cursor-default rounded-full border border-slate-900/12 bg-white px-4.5 py-2 text-[13.5px] font-medium text-slate-600 transition-all duration-200 hover:-translate-y-0.5 hover:border-crimson-500/50 hover:text-crimson-600 dark:border-white/12 dark:bg-ink-900 dark:text-slate-300 dark:hover:border-crimson-400/50 dark:hover:text-crimson-400"
              >
                {topic}
              </motion.span>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════ CTA ═══════════════════════ */}
      <section className="py-28">
        <div className={CONTAINER}>
          <Reveal>
            <div className="relative overflow-hidden rounded-[36px] bg-ink-950 px-8 pb-24 pt-16 text-center shadow-[0_48px_120px_rgba(12,14,18,0.35)] md:px-16">
              {/* Gradient hairline frame */}
              <div aria-hidden className="pointer-events-none absolute inset-0 rounded-[36px] ring-1 ring-inset ring-white/10" />
              {/* Aurora wash */}
              <motion.div
                aria-hidden
                className="pointer-events-none absolute inset-0"
                animate={{ opacity: [0.75, 1, 0.75] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                style={{
                  background:
                    "radial-gradient(ellipse 55% 70% at 12% 100%, rgba(214,31,69,0.22) 0%, transparent 55%)," +
                    "radial-gradient(ellipse 55% 70% at 88% 0%, rgba(124,58,237,0.20) 0%, transparent 55%)",
                }}
              />

              <div className="relative">
                {/* Centre seal */}
                <div className="mb-8 inline-flex rounded-full bg-white/10 p-1 ring-1 ring-white/15">
                  <Image src="/coe/coe-logo.jpg" alt="" aria-hidden width={200} height={200} className="h-12 w-12 rounded-full" />
                </div>
                <p className="mb-5 text-[11px] font-bold uppercase tracking-[0.3em] text-crimson-400">
                  Cleared for takeoff
                </p>
                <h2 className="font-display mx-auto mb-6 max-w-2xl text-[clamp(34px,4.8vw,64px)] font-medium leading-[1.08] text-white">
                  Ready when{" "}
                  <em className="bg-gradient-to-r from-crimson-400 to-royal-400 bg-clip-text italic text-transparent">you</em>{" "}
                  are.
                </h2>
                <p className="mx-auto mb-10 max-w-md text-base leading-relaxed text-slate-400">
                  One topic, one session, one honest question at a time — your runway is waiting.
                </p>
                <div className="mb-12 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/learn"
                    className="group inline-flex items-center gap-2.5 rounded-full bg-white px-8 py-3.5 text-[15px] font-bold text-slate-900 transition-all duration-300 hover:-translate-y-0.5 hover:bg-crimson-500 hover:text-white hover:shadow-[0_16px_40px_rgba(214,31,69,0.4)] active:scale-[0.98]"
                  >
                    Start learning
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2.5 rounded-full border border-white/20 px-8 py-3.5 text-[15px] font-semibold text-white backdrop-blur transition-all duration-300 hover:-translate-y-0.5 hover:border-white/45 hover:bg-white/5 active:scale-[0.98]"
                  >
                    View dashboard
                  </Link>
                </div>

                {/* Trust row */}
                <div className="flex flex-wrap items-center justify-center gap-x-7 gap-y-2 text-xs font-medium text-slate-500">
                  <span>Curriculum aligned</span>
                  <span aria-hidden className="h-1 w-1 rounded-full bg-slate-600" />
                  <span>Five specialized agents</span>
                  <span aria-hidden className="h-1 w-1 rounded-full bg-slate-600" />
                  <span>Free for TIET students</span>
                </div>
              </div>

              {/* Runway centreline — approach lights */}
              <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-10 flex justify-center">
                <div className="relative h-px w-2/3 max-w-lg overflow-visible bg-white/10">
                  <motion.div
                    className="absolute -top-[3px] h-[7px] w-24 rounded-full bg-gradient-to-r from-transparent via-crimson-400 to-transparent blur-[1px]"
                    animate={{ left: ["-15%", "100%"] }}
                    transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut", repeatDelay: 0.6 }}
                  />
                  <div className="absolute inset-x-0 top-1/2 flex -translate-y-1/2 justify-between">
                    {Array.from({ length: 9 }).map((_, i) => (
                      <motion.span
                        key={i}
                        className="h-[3px] w-[3px] rounded-full bg-white/50"
                        animate={{ opacity: [0.2, 1, 0.2] }}
                        transition={{ duration: 1.8, delay: i * 0.18, repeat: Infinity, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ═══════════════════════ FOOTER ═══════════════════════ */}
      <footer className="border-t border-slate-900/8 bg-white/60 pb-8 pt-16 dark:border-white/5 dark:bg-ink-900/40">
        <div className={CONTAINER}>
          <div className="mb-12 grid grid-cols-1 gap-12 md:grid-cols-[1.4fr_1fr_1.4fr]">
            {/* Brand */}
            <div>
              <Link href="/" className="mb-4 flex items-center gap-2.5 no-underline">
                <Image src="/coe/coe-logo.jpg" alt="" aria-hidden width={200} height={200} className="h-9 w-9 rounded-full" />
                <span className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-white">
                  DSA<em className="brand-text font-semibold">Runway</em>
                </span>
              </Link>
              <p className="m-0 max-w-xs text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                An agentic AI tutor for Data Structures &amp; Algorithms — your personal runway
                from first loop to final interview.
              </p>
              <div className="mt-5 flex items-center gap-2">
                {SOCIALS.map(({ Icon, label }) => (
                  <a
                    key={label} href="#" aria-label={label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-900/10 text-slate-500 transition-all hover:-translate-y-0.5 hover:border-crimson-500/50 hover:text-crimson-600 dark:border-white/10 dark:text-slate-400 dark:hover:border-crimson-400/50 dark:hover:text-crimson-400"
                  >
                    <Icon className="h-4 w-4" />
                  </a>
                ))}
              </div>
            </div>

            {/* Links */}
            <nav aria-label="Footer">
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">Explore</p>
              <ul className="m-0 list-none space-y-2.5 p-0">
                {NAV_LINKS.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="text-sm font-medium text-slate-600 no-underline transition-colors hover:text-crimson-600 dark:text-slate-300 dark:hover:text-crimson-400">
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>

            {/* Institution */}
            <div>
              <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-slate-400 dark:text-slate-500">The Centre</p>
              <p className="m-0 mb-5 text-[13px] leading-relaxed text-slate-500 dark:text-slate-400">
                A capstone project under the{" "}
                <a href="https://dsai.thapar.edu/" target="_blank" rel="noopener noreferrer" className="font-semibold text-slate-700 no-underline hover:text-crimson-600 dark:text-slate-300 dark:hover:text-crimson-400">
                  TIET-UQ Centre of Excellence in Data Science and AI
                </a>
                {" "}— Thapar Institute of Engineering &amp; Technology × The University of Queensland.
              </p>
              <PartnerLogos />
            </div>
          </div>

          <div className="flex flex-col items-center gap-1.5 border-t border-slate-900/10 pt-6 dark:border-white/10">
            <p className="m-0 text-center text-xs text-slate-400 dark:text-slate-500">
              © 2025–26 DSARunway — Capstone Project, Thapar Institute of Engineering &amp; Technology
            </p>
            <p className="m-0 text-xs text-slate-400/80 dark:text-slate-600">
              Sachin Goyal · Raghav Chhabra · Aksh Khurana · Prachi
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
