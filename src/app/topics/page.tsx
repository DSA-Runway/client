"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import {
  Search, BookOpen, Code2, Zap, Brain, Target,
  Play, CheckCircle2, Clock, Filter,
  Layers, GitBranch, Network, TrendingUp, ArrowUpRight, ChevronRight
} from "lucide-react";

const CURRICULUM = [
  {
    category: "Fundamentals",
    icon: Layers,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.12)",
    topics: [
      { name:"Arrays", difficulty:"Easy", time:"45 min", done:true, score:92, problems:["Two Sum","Maximum Subarray","Rotate Array"] },
      { name:"Strings", difficulty:"Easy", time:"40 min", done:true, score:88, problems:["Reverse String","Valid Palindrome","Anagram Check"] },
      { name:"Recursion", difficulty:"Medium", time:"60 min", done:false, score:0, problems:["Factorial","Fibonacci","Tower of Hanoi"] },
      { name:"Bit Manipulation", difficulty:"Hard", time:"50 min", done:false, score:0, problems:["Count Bits","Single Number","Power of Two"] },
    ],
  },
  {
    category: "Linear Structures",
    icon: Zap,
    color: "#8b5cf6",
    glow: "rgba(139,92,246,0.12)",
    topics: [
      { name:"Linked Lists", difficulty:"Easy", time:"55 min", done:true, score:78, problems:["Reverse LL","Detect Cycle","Merge Sorted Lists"] },
      { name:"Stacks", difficulty:"Medium", time:"45 min", done:true, score:83, problems:["Valid Parentheses","Min Stack","Daily Temperatures"] },
      { name:"Queues", difficulty:"Medium", time:"40 min", done:false, score:0, problems:["Implement Queue","Sliding Window Max","BFS Basics"] },
      { name:"Deque", difficulty:"Hard", time:"35 min", done:false, score:0, problems:["Sliding Window","K-th Largest","Monotonic Deque"] },
    ],
  },
  {
    category: "Trees",
    icon: GitBranch,
    color: "#06b6d4",
    glow: "rgba(6,182,212,0.12)",
    topics: [
      { name:"Binary Trees", difficulty:"Medium", time:"70 min", done:false, score:0, problems:["Inorder Traversal","Level Order","Max Depth"] },
      { name:"Binary Search Tree", difficulty:"Medium", time:"65 min", done:false, score:0, problems:["Search BST","Insert/Delete","Validate BST"] },
      { name:"AVL Trees", difficulty:"Hard", time:"90 min", done:false, score:0, problems:["Rotations","Balance Factor","Self-balancing"] },
      { name:"Heaps", difficulty:"Hard", time:"60 min", done:false, score:0, problems:["K-th Largest","Merge K Lists","Heap Sort"] },
      { name:"Tries", difficulty:"Hard", time:"55 min", done:false, score:0, problems:["Implement Trie","Word Search","Prefix Search"] },
    ],
  },
  {
    category: "Graphs",
    icon: Network,
    color: "#10b981",
    glow: "rgba(16,185,129,0.12)",
    topics: [
      { name:"BFS / DFS", difficulty:"Medium", time:"75 min", done:false, score:0, problems:["Number of Islands","Word Ladder","Connected Components"] },
      { name:"Shortest Path", difficulty:"Hard", time:"80 min", done:false, score:0, problems:["Dijkstra","Bellman-Ford","Floyd-Warshall"] },
      { name:"Topological Sort", difficulty:"Hard", time:"65 min", done:false, score:0, problems:["Course Schedule","Alien Dictionary","Job Scheduling"] },
      { name:"MST", difficulty:"Hard", time:"70 min", done:false, score:0, problems:["Kruskal's","Prim's","Min Cost to Connect"] },
    ],
  },
  {
    category: "Algorithms",
    icon: Code2,
    color: "#ec4899",
    glow: "rgba(236,72,153,0.12)",
    topics: [
      { name:"Sorting", difficulty:"Medium", time:"60 min", done:false, score:0, problems:["Merge Sort","Quick Sort","Counting Sort"] },
      { name:"Binary Search", difficulty:"Medium", time:"50 min", done:false, score:0, problems:["Search in Rotated","Find Peak","Sqrt(x)"] },
      { name:"Divide & Conquer", difficulty:"Hard", time:"70 min", done:false, score:0, problems:["Merge Sort","Karatsuba","Closest Pair"] },
      { name:"Greedy", difficulty:"Hard", time:"65 min", done:false, score:0, problems:["Activity Selection","Huffman Coding","Coin Change"] },
    ],
  },
  {
    category: "Advanced",
    icon: Brain,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.12)",
    topics: [
      { name:"Dynamic Programming", difficulty:"Hard", time:"120 min", done:false, score:0, problems:["0/1 Knapsack","LCS","Edit Distance"] },
      { name:"Backtracking", difficulty:"Hard", time:"90 min", done:false, score:0, problems:["N-Queens","Sudoku","Subset Sum"] },
      { name:"Segment Trees", difficulty:"Hard", time:"80 min", done:false, score:0, problems:["Range Query","Lazy Propagation","Point Update"] },
    ],
  },
];

const DIFF_COLOR: Record<string, string> = { Easy: "#10b981", Medium: "#f59e0b", Hard: "#ef4444" };
const DIFF_BG: Record<string, string>    = { Easy: "rgba(16,185,129,0.12)", Medium: "rgba(245,158,11,0.12)", Hard: "rgba(239,68,68,0.12)" };
const FILTERS = ["all", "done", "todo", "Easy", "Medium", "Hard"] as const;
type Filter = typeof FILTERS[number];

export default function TopicsPage() {
  const [search, setSearch]           = useState("");
  const [filter, setFilter]           = useState<Filter>("all");
  const [expandedTopic, setExpanded]  = useState<string | null>(null);

  const totalTopics = CURRICULUM.reduce((a, c) => a + c.topics.length, 0);
  const doneTopics  = CURRICULUM.reduce((a, c) => a + c.topics.filter(t => t.done).length, 0);
  const pct         = Math.round((doneTopics / totalTopics) * 100);
  const circ        = 2 * Math.PI * 20; // r=20

  const filtered = CURRICULUM.map(cat => ({
    ...cat,
    topics: cat.topics.filter(t => {
      const s = !search || t.name.toLowerCase().includes(search.toLowerCase());
      const f = filter === "all"
        || (filter === "done" && t.done)
        || (filter === "todo" && !t.done)
        || filter === t.difficulty;
      return s && f;
    }),
  })).filter(cat => cat.topics.length > 0);

  return (
    <div style={{ minHeight: "100vh", background: "#080810", color: "#fff" }}>
      <Navbar />
      <div style={{ height: "74px" }} />

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 28px 64px" }}>

        {/* ── Header ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          style={{ marginBottom: "28px" }}
        >
          {/* Top row: label + progress widget */}
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "16px", marginBottom: "8px" }}>
            {/* Left */}
            <div>
              <span style={{ color: "#f59e0b", fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em" }}>
                DSA Curriculum
              </span>
              <h1 style={{ fontSize: "clamp(28px, 4vw, 38px)", fontWeight: 900, margin: "4px 0 0", lineHeight: 1.1 }}>
                All&nbsp;<span style={{ color: "#f59e0b" }}>Topics</span>
              </h1>
              <p style={{ color: "#6b7280", marginTop: "6px", fontSize: "14px" }}>
                {doneTopics} of {totalTopics} topics completed
              </p>
            </div>

            {/* Right — progress circle */}
            <div style={{
              display: "flex", alignItems: "center", gap: "12px",
              padding: "14px 18px", borderRadius: "14px",
              background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
              flexShrink: 0,
            }}>
              <div style={{ position: "relative", width: "52px", height: "52px" }}>
                <svg viewBox="0 0 48 48" style={{ width: "100%", height: "100%", transform: "rotate(-90deg)" }}>
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#1e1e3a" strokeWidth="4" />
                  <motion.circle
                    cx="24" cy="24" r="20" fill="none" stroke="#f59e0b" strokeWidth="4"
                    strokeLinecap="round"
                    initial={{ strokeDasharray: `0 ${circ}` }}
                    animate={{ strokeDasharray: `${(doneTopics / totalTopics) * circ} ${circ}` }}
                    transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
                    style={{ filter: "drop-shadow(0 0 4px rgba(245,158,11,0.5))" }}
                  />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <span style={{ fontSize: "11px", fontWeight: 900, color: "#f59e0b" }}>{pct}%</span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: "18px", fontWeight: 900, color: "#fff", lineHeight: 1 }}>{doneTopics}/{totalTopics}</div>
                <div style={{ fontSize: "11px", color: "#6b7280", marginTop: "2px" }}>Completed</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Search + Filters ── */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "32px", alignItems: "center" }}>
          {/* Search */}
          <div style={{ position: "relative", flex: "1 1 220px", minWidth: "180px" }}>
            <Search style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", width: "15px", height: "15px", color: "#6b7280" }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search topics..."
              style={{
                width: "100%", boxSizing: "border-box",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "10px",
                padding: "10px 14px 10px 36px",
                fontSize: "13px", color: "#fff",
                outline: "none", transition: "border-color 0.2s",
              }}
              onFocus={e => (e.currentTarget.style.borderColor = "rgba(245,158,11,0.4)")}
              onBlur={e => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.07)")}
            />
          </div>

          {/* Filter pills */}
          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {FILTERS.map(f => {
              const active = filter === f;
              const activeBg = f === "Easy" ? "#10b981" : f === "Medium" ? "#f59e0b" : f === "Hard" ? "#ef4444" : f === "done" ? "#10b981" : "#f59e0b";
              return (
                <button key={f} onClick={() => setFilter(f)}
                  style={{
                    padding: "7px 13px", borderRadius: "8px", fontSize: "12px", fontWeight: 600,
                    cursor: "pointer", border: "none", textTransform: "capitalize",
                    background: active ? activeBg : "rgba(255,255,255,0.05)",
                    color: active ? "#000" : "#9ca3af",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.color = "#fff"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.color = "#9ca3af"; }}
                >
                  {f === "all" ? (
                    <span style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                      <Filter style={{ width: "11px", height: "11px" }} />All
                    </span>
                  ) : f}
                </button>
              );
            })}
          </div>
        </div>

        {/* ── Categories ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {filtered.map((cat, ci) => (
            <motion.div key={cat.category}
              initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: ci * 0.06 }}
            >
              {/* Category header row */}
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                <div style={{
                  width: "30px", height: "30px", borderRadius: "8px", flexShrink: 0,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  background: cat.glow, border: `1px solid ${cat.color}25`,
                }}>
                  <cat.icon style={{ width: "15px", height: "15px", color: cat.color }} />
                </div>
                <h2 style={{ fontSize: "15px", fontWeight: 700, color: "#fff", margin: 0 }}>{cat.category}</h2>
                <span style={{ fontSize: "12px", color: "#6b7280" }}>
                  {cat.topics.filter(t => t.done).length}/{cat.topics.length} done
                </span>
                <div style={{ flex: 1, height: "1px", background: "#1e1e3a", marginLeft: "4px" }} />
              </div>

              {/* Topic grid */}
              <div style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))",
                gap: "12px",
              }}>
                {cat.topics.map((topic, ti) => (
                  <motion.div
                    key={topic.name}
                    onClick={() => setExpanded(expandedTopic === topic.name ? null : topic.name)}
                    whileHover={{ y: -2, boxShadow: `0 8px 30px ${cat.glow}` }}
                    style={{
                      padding: "16px", borderRadius: "12px", cursor: "pointer",
                      background: topic.done ? `${cat.color}08` : "rgba(255,255,255,0.025)",
                      border: `1px solid ${expandedTopic === topic.name ? `${cat.color}40` : topic.done ? `${cat.color}20` : "rgba(255,255,255,0.07)"}`,
                      transition: "border-color 0.2s",
                      display: "flex", flexDirection: "column", gap: "10px",
                    }}
                  >
                    {/* Card top: name + done check */}
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
                      <div>
                        <div style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9", marginBottom: "6px" }}>
                          {topic.name}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span style={{
                            fontSize: "10px", fontWeight: 700,
                            padding: "2px 7px", borderRadius: "999px",
                            background: DIFF_BG[topic.difficulty],
                            color: DIFF_COLOR[topic.difficulty],
                          }}>
                            {topic.difficulty}
                          </span>
                          <span style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: "#6b7280" }}>
                            <Clock style={{ width: "10px", height: "10px" }} />
                            {topic.time}
                          </span>
                        </div>
                      </div>
                      {topic.done && (
                        <CheckCircle2 style={{ width: "16px", height: "16px", color: "#10b981", flexShrink: 0 }} />
                      )}
                    </div>

                    {/* Card bottom: score bar OR problems+start */}
                    {topic.done ? (
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "5px" }}>
                          <span style={{ fontSize: "11px", color: "#6b7280" }}>Score</span>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: cat.color }}>{topic.score}%</span>
                        </div>
                        <div style={{ height: "5px", borderRadius: "999px", background: "#1e1e3a", overflow: "hidden" }}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${topic.score}%` }}
                            transition={{ duration: 0.9, delay: ti * 0.08 }}
                            style={{ height: "100%", borderRadius: "999px", background: `linear-gradient(90deg, ${cat.color}, ${cat.color}80)` }}
                          />
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px", color: "#6b7280" }}>
                          <BookOpen style={{ width: "12px", height: "12px" }} />
                          {topic.problems.length} problems
                        </span>
                        <Link href="/learn" onClick={e => e.stopPropagation()}>
                          <motion.span
                            whileHover={{ scale: 1.08 }}
                            style={{
                              display: "flex", alignItems: "center", gap: "4px",
                              fontSize: "12px", fontWeight: 600,
                              padding: "4px 10px", borderRadius: "7px",
                              color: cat.color, background: `${cat.color}15`,
                              cursor: "pointer",
                            }}
                          >
                            <Play style={{ width: "11px", height: "11px" }} />
                            Start
                          </motion.span>
                        </Link>
                      </div>
                    )}

                    {/* Expanded problems list */}
                    <AnimatePresence>
                      {expandedTopic === topic.name && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          style={{ overflow: "hidden", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px" }}
                        >
                          <p style={{ fontSize: "10px", color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "8px" }}>
                            Problems
                          </p>
                          {topic.problems.map((prob, pi) => (
                            <Link key={pi} href="/learn">
                              <div style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "6px 0", fontSize: "12px", color: "#9ca3af",
                                borderBottom: pi < topic.problems.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                                cursor: "pointer", transition: "color 0.15s",
                              }}
                                onMouseEnter={e => (e.currentTarget.style.color = "#fff")}
                                onMouseLeave={e => (e.currentTarget.style.color = "#9ca3af")}
                              >
                                <span style={{ display: "flex", alignItems: "center", gap: "7px" }}>
                                  <div style={{ width: "5px", height: "5px", borderRadius: "999px", background: cat.color, flexShrink: 0 }} />
                                  {prob}
                                </span>
                                <ArrowUpRight style={{ width: "12px", height: "12px", color: cat.color, flexShrink: 0 }} />
                              </div>
                            </Link>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <Search style={{ width: "44px", height: "44px", color: "#374151", margin: "0 auto 16px" }} />
            <p style={{ color: "#6b7280", fontSize: "15px" }}>No topics found matching &quot;{search}&quot;</p>
            <button
              onClick={() => { setSearch(""); setFilter("all"); }}
              style={{ marginTop: "12px", color: "#f59e0b", fontSize: "13px", background: "none", border: "none", cursor: "pointer", textDecoration: "underline" }}
            >
              Clear filters
            </button>
          </div>
        )}

        {/* ── Bottom CTA ── */}
        <motion.div
          initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
          style={{
            marginTop: "48px", padding: "24px 28px", borderRadius: "16px",
            border: "1px solid rgba(245,158,11,0.2)", background: "rgba(245,158,11,0.04)",
            display: "flex", alignItems: "center", justifyContent: "space-between",
            flexWrap: "wrap", gap: "16px",
          }}
        >
          <div>
            <h3 style={{ fontSize: "17px", fontWeight: 700, color: "#fff", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <TrendingUp style={{ width: "18px", height: "18px", color: "#f59e0b" }} />
              Ready to level up?
            </h3>
            <p style={{ fontSize: "13px", color: "#6b7280", margin: 0 }}>Your AI tutor is waiting. Pick a topic and start learning.</p>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <Link href="/visualizer">
              <motion.button
                whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", borderRadius: "10px", border: "1px solid rgba(245,158,11,0.3)", color: "#f59e0b", background: "transparent", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
              >
                <Code2 style={{ width: "14px", height: "14px" }} />
                Visualize
              </motion.button>
            </Link>
            <Link href="/learn">
              <motion.button
                whileHover={{ scale: 1.04, boxShadow: "0 0 20px rgba(245,158,11,0.4)" }} whileTap={{ scale: 0.97 }}
                style={{ display: "flex", alignItems: "center", gap: "7px", padding: "9px 18px", borderRadius: "10px", background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000", border: "none", fontSize: "13px", fontWeight: 700, cursor: "pointer" }}
              >
                <Play style={{ width: "14px", height: "14px" }} />
                Start Learning
                <ChevronRight style={{ width: "14px", height: "14px" }} />
              </motion.button>
            </Link>
          </div>
        </motion.div>

      </div>
    </div>
  );
}
