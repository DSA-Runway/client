"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import { useTheme } from "@/context/ThemeContext";
import {
  Brain, Flame, Star, TrendingUp, Clock, Target, ChevronRight,
  BookOpen, Code2, Zap, Award, Play, BarChart3, ArrowRight,
  CheckCircle2, Circle, Lock, Sparkles, Bot, MessageSquare,
  Calendar, Users, Building2, Download, SlidersHorizontal
} from "lucide-react";

/* ─── Data ─── */
const TOPIC_PROGRESS = [
  { name: "Arrays", progress: 92, mastery: "Expert", color: "#10b981", topics: 8 },
  { name: "Linked Lists", progress: 78, mastery: "Advanced", color: "#f59e0b", topics: 6 },
  { name: "Stacks & Queues", progress: 65, mastery: "Intermediate", color: "#8b5cf6", topics: 5 },
  { name: "Trees", progress: 45, mastery: "Learning", color: "#06b6d4", topics: 9 },
  { name: "Graphs", progress: 30, mastery: "Beginner", color: "#ec4899", topics: 7 },
  { name: "Dynamic Programming", progress: 12, mastery: "Novice", color: "#f59e0b", topics: 10 },
];

const RECENT_SESSIONS = [
  { topic: "Reverse a Linked List", type: "Problem", score: 95, time: "2h ago", agent: "Teacher Agent", color: "#f59e0b", date: "Feb 23 · 10:30 AM" },
  { topic: "BFS vs DFS", type: "Concept", score: 88, time: "Yesterday", agent: "Assessment Agent", color: "#8b5cf6", date: "Feb 22 · 3:15 PM" },
  { topic: "Stack using Queue", type: "Problem", score: 72, time: "2d ago", agent: "Feedback Agent", color: "#06b6d4", date: "Feb 21 · 6:00 PM" },
  { topic: "Binary Search Tree", type: "Concept", score: 81, time: "3d ago", agent: "Teacher Agent", color: "#10b981", date: "Feb 20 · 2:45 PM" },
  { topic: "Merge Sort", type: "Problem", score: 90, time: "4d ago", agent: "Assessment Agent", color: "#ec4899", date: "Feb 19 · 11:00 AM" },
  { topic: "Hash Maps", type: "Concept", score: 77, time: "5d ago", agent: "Teacher Agent", color: "#f59e0b", date: "Feb 18 · 9:30 AM" },
];

const RECOMMENDED = [
  { topic: "Merge Sort", difficulty: "Medium", time: "20 min", color: "#f59e0b", icon: Code2, unlocked: true },
  { topic: "Graph BFS", difficulty: "Hard", time: "35 min", color: "#8b5cf6", icon: Brain, unlocked: true },
  { topic: "Dijkstra's Algorithm", difficulty: "Hard", time: "45 min", color: "#06b6d4", icon: Zap, unlocked: false },
  { topic: "DP — Knapsack", difficulty: "Hard", time: "40 min", color: "#ec4899", icon: Target, unlocked: false },
];

const ACHIEVEMENTS = [
  { title: "First Steps", desc: "Complete first session", earned: true, icon: "🎯" },
  { title: "Array Master", desc: "90%+ in Arrays", earned: true, icon: "⚡" },
  { title: "Streak Keeper", desc: "7-day streak", earned: true, icon: "🔥" },
  { title: "Graph Explorer", desc: "Complete all Graph topics", earned: false, icon: "🌐" },
  { title: "DP Warrior", desc: "Solve 10 DP problems", earned: false, icon: "🏆" },
  { title: "Speed Coder", desc: "Solve in under 5 min", earned: false, icon: "⚡" },
];

const WEEKLY_ACTIVITY = [28, 45, 30, 62, 55, 80, 70, 88, 65, 75, 90, 72];

const W = { maxWidth: "1400px", margin: "0 auto", padding: "0 28px" } as const;

/* ─── Components ─── */
function CircularProgress({ value, size = 120 }: { value: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(127,127,127,0.12)" strokeWidth={stroke} />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="url(#ringGrad)" strokeWidth={stroke}
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.4, ease: "easeOut", delay: 0.3 }}
        style={{ filter: "drop-shadow(0 0 8px rgba(245,158,11,0.5))" }}
      />
      <defs>
        <linearGradient id="ringGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function AreaChart() {
  const { isDark } = useTheme();
  const TEXT2 = isDark ? "#7d8ba3" : "#64748b";
  const data = WEEKLY_ACTIVITY;
  const max = Math.max(...data);
  const W_SVG = 400, H_SVG = 90;
  const pts = data.map((v, i) => [
    (i / (data.length - 1)) * W_SVG,
    H_SVG - (v / max) * (H_SVG - 8)
  ]);
  const line = pts.map(([x, y]) => `${x},${y}`).join(" L ");
  const area = `M${line} L${W_SVG},${H_SVG} L0,${H_SVG} Z`;
  const months = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar"];
  return (
    <div style={{ position: "relative" }}>
      <svg viewBox={`0 0 ${W_SVG} ${H_SVG}`} style={{ width: "100%", height: "80px" }} preserveAspectRatio="none">
        <defs>
          <linearGradient id="areaG" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.01" />
          </linearGradient>
        </defs>
        <path d={area} fill="url(#areaG)" />
        <path d={`M${line}`} fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {pts.map(([x, y], i) => (
          <circle key={i} cx={x} cy={y} r="3" fill="#f59e0b" opacity={i === pts.length - 1 ? 1 : 0} />
        ))}
      </svg>
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
        {months.map(m => (
          <span key={m} style={{ fontSize: "10px", color: TEXT2 }}>{m}</span>
        ))}
      </div>
    </div>
  );
}

function DonutSegment({ value, total, color, offset }: { value: number; total: number; color: string; offset: number }) {
  const r = 52, cx = 64, cy = 64;
  const circ = 2 * Math.PI * r;
  const dash = (value / total) * circ;
  const gap = circ - dash;
  const rotation = (offset / total) * 360 - 90;
  return (
    <circle
      cx={cx} cy={cy} r={r} fill="none"
      stroke={color} strokeWidth="16"
      strokeDasharray={`${dash} ${gap}`}
      strokeDashoffset="0"
      style={{ transform: `rotate(${rotation}deg)`, transformOrigin: `${cx}px ${cy}px` }}
    />
  );
}

export default function DashboardPage() {
  const { isDark } = useTheme();
  const BG    = isDark ? "#070d1b"                : "#f4f6f9";
  const CARD  = isDark ? "rgba(11,19,38,0.95)"   : "rgba(255,255,255,0.97)";
  const CARD2 = isDark ? "rgba(14,24,48,0.9)"    : "rgba(248,250,252,0.95)";
  const BORDER = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.09)";
  const TEXT1 = isDark ? "#f0f4ff"               : "#0f172a";
  const TEXT2 = isDark ? "#7d8ba3"               : "#64748b";
  const SHADOW = isDark ? "none"                 : "0 2px 12px rgba(0,0,0,0.06)";

  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    let start = 0;
    const target = 847;
    const step = target / 60;
    const counter = setInterval(() => {
      start += step;
      if (start >= target) { setAnimatedScore(target); clearInterval(counter); }
      else setAnimatedScore(Math.floor(start));
    }, 16);
    return () => clearInterval(counter);
  }, []);

  const diffTotal = 18 + 22 + 10;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT1 }}>
      <Navbar />
      <div style={{ height: "74px" }} />

      <div style={{ ...W, paddingTop: "28px", paddingBottom: "48px" }}>

        {/* ─── HEADER ─── */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
          style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: "16px", marginBottom: "28px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 900, margin: 0 }}>
              Welcome back, <span style={{ color: "#f59e0b" }}>Sachin</span> 👋
            </h1>
            <p style={{ color: TEXT2, marginTop: "4px", fontSize: "14px" }}>
              Continue your DSA journey — you&apos;re making great progress!
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {/* Date chip */}
            <div style={{ padding: "8px 14px", borderRadius: "10px", border: `1px solid ${BORDER}`, background: CARD, fontSize: "13px", color: TEXT2 }}>
              📅 Feb 23, 2026
            </div>
            <Link href="/learn">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 24px rgba(245,158,11,0.35)" }}
                whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: "8px", padding: "9px 20px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", fontWeight: 700, fontSize: "14px", borderRadius: "10px", border: "none", cursor: "pointer" }}
              >
                <Play style={{ width: "14px", height: "14px" }} />
                Resume Learning
              </motion.button>
            </Link>
          </div>
        </motion.div>

        {/* ─── TOP STAT CARDS ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px", marginBottom: "20px" }}>
          {[
            { label: "XP Score", value: animatedScore.toLocaleString(), icon: Star, color: "#f59e0b", sub: "+120 XP today", trend: "up" },
            { label: "Day Streak", value: "12", icon: Flame, color: "#ef4444", sub: "Personal best!", trend: "up" },
            { label: "Topics Done", value: "8/20", icon: BookOpen, color: "#8b5cf6", sub: "40% complete", trend: "neutral" },
            { label: "Avg Score", value: "84%", icon: BarChart3, color: "#10b981", sub: "↑ 6% this week", trend: "up" },
          ].map((stat, i) => (
            <motion.div key={i}
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08, duration: 0.5 }}
              whileHover={{ y: -2, borderColor: `${stat.color}30` }}
              style={{ padding: "20px 22px", borderRadius: "14px", background: CARD, border: `1px solid ${BORDER}`, cursor: "default" }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "10px", display: "flex", alignItems: "center", justifyContent: "center", background: `${stat.color}14`, border: `1px solid ${stat.color}25` }}>
                  <stat.icon style={{ width: "18px", height: "18px", color: stat.color }} />
                </div>
                <span style={{ fontSize: "11px", color: stat.trend === "up" ? "#10b981" : TEXT2, background: stat.trend === "up" ? "rgba(16,185,129,0.1)" : isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)", padding: "3px 8px", borderRadius: "999px", border: stat.trend === "up" ? "1px solid rgba(16,185,129,0.2)" : `1px solid ${BORDER}` }}>
                  {stat.sub}
                </span>
              </div>
              <div style={{ fontSize: "30px", fontWeight: 900, lineHeight: 1, color: TEXT1 }}>{stat.value}</div>
              <div style={{ fontSize: "13px", color: TEXT2, marginTop: "6px" }}>{stat.label}</div>
            </motion.div>
          ))}
        </div>

        {/* ─── DSA PROGRESS (full-width, like Training Progress in ref) ─── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
          style={{ padding: "24px 28px", borderRadius: "14px", background: CARD, border: `1px solid ${BORDER}`, marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "22px" }}>
            <h2 style={{ fontWeight: 700, fontSize: "16px", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <TrendingUp style={{ width: "18px", height: "18px", color: "#f59e0b" }} />
              DSA Progress
            </h2>
            <Link href="/topics" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: "4px", fontSize: "13px", color: "#f59e0b" }}>
              View all <ChevronRight style={{ width: "14px", height: "14px" }} />
            </Link>
          </div>

          {/* Overall progress bar */}
          <div style={{ marginBottom: "22px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "13px", color: TEXT2 }}>Overall Progress</span>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#f59e0b" }}>54%</span>
            </div>
            <div style={{ height: "8px", borderRadius: "999px", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)", overflow: "hidden" }}>
              <motion.div
                initial={{ width: 0 }} animate={{ width: "54%" }}
                transition={{ duration: 1.2, ease: "easeOut" }}
                style={{ height: "100%", borderRadius: "999px", background: "linear-gradient(90deg, #f59e0b, #d97706)", boxShadow: "0 0 10px rgba(245,158,11,0.4)" }}
              />
            </div>
          </div>

          {/* 2-col topic bar grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px 40px" }}>
            {TOPIC_PROGRESS.map((topic, i) => (
              <div key={i}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "13px", fontWeight: 500, color: TEXT1 }}>{topic.name}</span>
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 7px", borderRadius: "999px", background: `${topic.color}14`, color: topic.color }}>
                      {topic.mastery}
                    </span>
                  </div>
                  <span style={{ fontSize: "13px", fontWeight: 700, color: topic.color }}>{topic.progress}%</span>
                </div>
                <div style={{ height: "6px", borderRadius: "999px", background: isDark ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.08)", overflow: "hidden" }}>
                  <motion.div
                    initial={{ width: 0 }} animate={{ width: `${topic.progress}%` }}
                    transition={{ duration: 1, delay: i * 0.1 + 0.4, ease: "easeOut" }}
                    style={{ height: "100%", borderRadius: "999px", background: `linear-gradient(90deg, ${topic.color}, ${topic.color}99)`, boxShadow: `0 0 6px ${topic.color}50` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ─── CHARTS ROW ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>

          {/* Weekly Activity chart */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.42 }}
            style={{ padding: "22px 24px", borderRadius: "14px", background: CARD, border: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontWeight: 700, fontSize: "15px", margin: 0, color: TEXT1 }}>Monthly Learning Activity</h2>
              <span style={{ fontSize: "12px", color: TEXT2, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)", padding: "3px 10px", borderRadius: "999px", border: `1px solid ${BORDER}` }}>
                Last 6 Months ↓
              </span>
            </div>
            <AreaChart />
          </motion.div>

          {/* Topic distribution donut */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.48 }}
            style={{ padding: "22px 24px", borderRadius: "14px", background: CARD, border: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "16px" }}>
              <h2 style={{ fontWeight: 700, fontSize: "15px", margin: 0, color: TEXT1 }}>Topic Distribution</h2>
              <span style={{ fontSize: "12px", color: TEXT2, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)", padding: "3px 10px", borderRadius: "999px", border: `1px solid ${BORDER}` }}>
                By Difficulty ↓
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "28px" }}>
              <div style={{ position: "relative", flexShrink: 0 }}>
                <svg width="128" height="128" viewBox="0 0 128 128">
                  <circle cx="64" cy="64" r="52" fill="none" stroke="rgba(127,127,127,0.10)" strokeWidth="16" />
                  <DonutSegment value={18} total={diffTotal} color="#10b981" offset={0} />
                  <DonutSegment value={22} total={diffTotal} color="#f59e0b" offset={18} />
                  <DonutSegment value={10} total={diffTotal} color="#ef4444" offset={40} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "18px", fontWeight: 900, color: "#f59e0b" }}>50</span>
                  <span style={{ fontSize: "10px", color: TEXT2 }}>problems</span>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { label: "Easy", value: 18, color: "#10b981" },
                  { label: "Medium", value: 22, color: "#f59e0b" },
                  { label: "Hard", value: 10, color: "#ef4444" },
                ].map(d => (
                  <div key={d.label} style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{ width: "10px", height: "10px", borderRadius: "3px", background: d.color, flexShrink: 0 }} />
                    <span style={{ fontSize: "13px", color: TEXT2, minWidth: "52px" }}>{d.label}</span>
                    <span style={{ fontSize: "14px", fontWeight: 700, color: d.color }}>{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* ─── MAIN LOWER GRID ─── */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: "20px", marginBottom: "20px" }}>

          {/* Recent Sessions — styled like reference "upcoming sessions" */}
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
            style={{ padding: "22px 24px", borderRadius: "14px", background: CARD, border: `1px solid ${BORDER}` }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
              <h2 style={{ fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", margin: 0, color: TEXT1 }}>
                <Clock style={{ width: "16px", height: "16px", color: "#8b5cf6" }} />
                Recent Sessions
              </h2>
            </div>

            {/* Table-style header */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 80px", gap: "0 12px", padding: "0 12px 10px", marginBottom: "4px", borderBottom: `1px solid ${BORDER}` }}>
              {["Topic", "Agent", "Date", "Score"].map(h => (
                <span key={h} style={{ fontSize: "11px", fontWeight: 700, color: TEXT2, textTransform: "uppercase", letterSpacing: "0.06em" }}>{h}</span>
              ))}
            </div>

            {/* Table rows */}
            {RECENT_SESSIONS.map((s, i) => (
              <motion.div key={i}
                initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.55 + i * 0.06 }}
                whileHover={{ background: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)" }}
                style={{ display: "grid", gridTemplateColumns: "1fr 100px 100px 80px", gap: "0 12px", padding: "12px", borderRadius: "10px", alignItems: "center", cursor: "default", borderBottom: i < RECENT_SESSIONS.length - 1 ? `1px solid ${isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.06)"}` : "none" }}
              >
                {/* Topic */}
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ width: "36px", height: "36px", borderRadius: "9px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${s.color}14`, border: `1px solid ${s.color}25` }}>
                    <Bot style={{ width: "16px", height: "16px", color: s.color }} />
                  </div>
                  <div>
                    <div style={{ fontSize: "13px", fontWeight: 600, color: TEXT1 }}>{s.topic}</div>
                    <span style={{ fontSize: "10px", fontWeight: 600, padding: "1px 6px", borderRadius: "999px", background: `${s.color}14`, color: s.color }}>{s.type}</span>
                  </div>
                </div>
                {/* Agent */}
                <span style={{ fontSize: "12px", color: TEXT2 }}>{s.agent}</span>
                {/* Date */}
                <span style={{ fontSize: "11px", color: TEXT2 }}>{s.date}</span>
                {/* Score */}
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ fontSize: "14px", fontWeight: 700, color: s.score >= 85 ? "#10b981" : s.score >= 70 ? "#f59e0b" : "#ef4444" }}>
                    {s.score}%
                  </span>
                  <ArrowRight style={{ width: "13px", height: "13px", color: "#374151" }} />
                </div>
              </motion.div>
            ))}
          </motion.div>

          {/* Right sidebar: AI Recommends + Quick Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Overall progress ring */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}
              style={{ padding: "20px 22px", borderRadius: "14px", background: CARD, border: `1px solid ${BORDER}`, textAlign: "center" }}>
              <h2 style={{ fontWeight: 700, fontSize: "11px", color: TEXT2, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px" }}>Overall Progress</h2>
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px", position: "relative" }}>
                <CircularProgress value={54} size={110} />
                <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "22px", fontWeight: 900, color: "#f59e0b" }}>54%</span>
                  <span style={{ fontSize: "10px", color: TEXT2 }}>Complete</span>
                </div>
              </div>
              <p style={{ fontSize: "12px", color: TEXT2, margin: "0 0 14px" }}>8 of 20 DSA topics mastered</p>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px" }}>
                {[{ l: "Easy", v: 18, c: "#10b981" }, { l: "Medium", v: 22, c: "#f59e0b" }, { l: "Hard", v: 10, c: "#ef4444" }].map(d => (
                  <div key={d.l} style={{ textAlign: "center", padding: "8px 4px", borderRadius: "8px", background: isDark ? "rgba(255,255,255,0.03)" : "rgba(15,23,42,0.03)", border: `1px solid ${BORDER}` }}>
                    <div style={{ fontSize: "16px", fontWeight: 800, color: d.c }}>{d.v}</div>
                    <div style={{ fontSize: "10px", color: TEXT2 }}>{d.l}</div>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AI Recommends */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }}
              style={{ padding: "20px 22px", borderRadius: "14px", background: CARD, border: `1px solid ${BORDER}` }}>
              <h2 style={{ fontWeight: 700, fontSize: "11px", color: TEXT2, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Sparkles style={{ width: "13px", height: "13px", color: "#f59e0b" }} />
                AI Recommends
              </h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                {RECOMMENDED.map((item, i) => (
                  <motion.div key={i} whileHover={item.unlocked ? { x: 3 } : {}}
                    style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 12px", borderRadius: "10px", border: `1px solid ${BORDER}`, opacity: item.unlocked ? 1 : 0.45, cursor: item.unlocked ? "pointer" : "not-allowed", background: isDark ? "rgba(255,255,255,0.02)" : "rgba(15,23,42,0.02)" }}>
                    <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${item.color}12` }}>
                      {item.unlocked
                        ? <item.icon style={{ width: "15px", height: "15px", color: item.color }} />
                        : <Lock style={{ width: "13px", height: "13px", color: "#4b5563" }} />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: "13px", fontWeight: 600, color: TEXT1 }}>{item.topic}</div>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <span style={{ fontSize: "11px", color: item.difficulty === "Hard" ? "#ef4444" : item.difficulty === "Medium" ? "#f59e0b" : "#10b981" }}>{item.difficulty}</span>
                        <span style={{ fontSize: "11px", color: "#374151" }}>·</span>
                        <span style={{ fontSize: "11px", color: TEXT2 }}>{item.time}</span>
                      </div>
                    </div>
                    {item.unlocked && <ArrowRight style={{ width: "14px", height: "14px", color: "#374151", flexShrink: 0 }} />}
                  </motion.div>
                ))}
              </div>
            </motion.div>

            {/* Quick Actions */}
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.63 }}
              style={{ padding: "20px 22px", borderRadius: "14px", background: CARD, border: `1px solid ${BORDER}` }}>
              <h2 style={{ fontWeight: 700, fontSize: "11px", color: TEXT2, textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "14px" }}>Quick Actions</h2>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                {[
                  { label: "Ask Tutor", href: "/learn", icon: MessageSquare, color: "#f59e0b" },
                  { label: "Visualize", href: "/visualizer", icon: Code2, color: "#8b5cf6" },
                  { label: "All Topics", href: "/topics", icon: BookOpen, color: "#06b6d4" },
                  { label: "Progress", href: "/dashboard", icon: BarChart3, color: "#10b981" },
                ].map((a, i) => (
                  <Link key={i} href={a.href} style={{ textDecoration: "none" }}>
                    <motion.div whileHover={{ scale: 1.04, borderColor: `${a.color}30` }} whileTap={{ scale: 0.97 }}
                      style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "14px 8px", borderRadius: "10px", border: `1px solid ${BORDER}`, background: `${a.color}07`, cursor: "pointer", textAlign: "center" }}>
                      <a.icon style={{ width: "18px", height: "18px", color: a.color }} />
                      <span style={{ fontSize: "12px", fontWeight: 500, color: TEXT1 }}>{a.label}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </motion.div>
          </div>
        </div>

        {/* ─── ACHIEVEMENTS ─── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}
          style={{ padding: "22px 24px", borderRadius: "14px", background: CARD, border: `1px solid ${BORDER}`, marginBottom: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "18px" }}>
            <h2 style={{ fontWeight: 700, fontSize: "15px", display: "flex", alignItems: "center", gap: "8px", margin: 0, color: TEXT1 }}>
              <Award style={{ width: "16px", height: "16px", color: "#f59e0b" }} />
              Achievements
            </h2>
            <span style={{ fontSize: "12px", color: TEXT2, background: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.05)", padding: "3px 10px", borderRadius: "999px", border: `1px solid ${BORDER}` }}>3 / 6 earned</span>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(6, 1fr)", gap: "12px" }}>
            {ACHIEVEMENTS.map((ach, i) => (
              <motion.div key={i} whileHover={{ scale: ach.earned ? 1.04 : 1 }}
                style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px", padding: "18px 10px", borderRadius: "12px", textAlign: "center", border: `1px solid ${ach.earned ? "rgba(245,158,11,0.2)" : BORDER}`, background: ach.earned ? "rgba(245,158,11,0.05)" : "rgba(255,255,255,0.02)", opacity: ach.earned ? 1 : 0.45, cursor: ach.earned ? "default" : "not-allowed" }}>
                <div style={{ fontSize: "26px" }}>{ach.icon}</div>
                <div style={{ fontSize: "12px", fontWeight: 600, color: TEXT1 }}>{ach.title}</div>
                <div style={{ fontSize: "10px", color: TEXT2 }}>{ach.desc}</div>
                {ach.earned
                  ? <CheckCircle2 style={{ width: "15px", height: "15px", color: "#10b981" }} />
                  : <Circle style={{ width: "15px", height: "15px", color: "#374151" }} />}
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── STREAK CALENDAR ─── */}
        <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.7 }}
          style={{ padding: "22px 24px", borderRadius: "14px", background: CARD, border: `1px solid ${BORDER}` }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
            <Flame style={{ width: "16px", height: "16px", color: "#ef4444" }} />
            <h2 style={{ fontWeight: 700, fontSize: "15px", margin: 0, color: TEXT1 }}>Learning Streak</h2>
            <span style={{ marginLeft: "auto", fontSize: "20px", fontWeight: 900, color: "#ef4444", display: "flex", alignItems: "center", gap: "6px" }}>
              <Flame style={{ width: "16px", height: "16px" }} /> 12 days
            </span>
          </div>
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {Array.from({ length: 28 }).map((_, i) => {
              const active = i < 12 || [14, 16, 18, 20].includes(i);
              const today = i === 11;
              return (
                <motion.div key={i}
                  initial={{ scale: 0, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: i * 0.018 }}
                  style={{ width: "34px", height: "34px", borderRadius: "8px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", fontWeight: 600, cursor: "default", outline: today ? "2px solid #f59e0b" : "none", outlineOffset: "2px", background: active ? "rgba(245,158,11,0.18)" : isDark ? "rgba(255,255,255,0.04)" : "rgba(15,23,42,0.04)", color: active ? "#f59e0b" : TEXT2, border: active ? "1px solid rgba(245,158,11,0.3)" : `1px solid ${BORDER}` }}
                >
                  {i + 1}
                </motion.div>
              );
            })}
          </div>
          <p style={{ fontSize: "12px", color: TEXT2, marginTop: "14px", marginBottom: 0 }}>
            Keep going! You&apos;re 2 days away from your longest streak.
          </p>
        </motion.div>

      </div>
    </div>
  );
}
