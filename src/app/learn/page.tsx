"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useTheme } from "@/context/ThemeContext";
import {
  Send, Mic, ImageIcon, FileText, Bot, User,
  Brain, Target, BarChart3, BookOpen, Zap,
  Volume2, ChevronRight, ChevronDown,
  RefreshCw, ThumbsUp, ThumbsDown, Copy,
  Folder, FolderOpen, FileCode, Settings, Search,
  LayoutDashboard, Home, Lightbulb, Paperclip, X, Plus,
} from "lucide-react";

// ─── Data ────────────────────────────────────────────────────────────────────

const TOPICS_SIDEBAR = [
  { category: "Fundamentals",      color: "#f59e0b", items: ["Arrays", "Strings", "Recursion", "Bit Manipulation"] },
  { category: "Linear Structures", color: "#06b6d4", items: ["Linked Lists", "Stacks", "Queues", "Deque"] },
  { category: "Trees",             color: "#10b981", items: ["Binary Trees", "BST", "AVL Trees", "Heaps", "Tries"] },
  { category: "Graphs",            color: "#8b5cf6", items: ["BFS / DFS", "Shortest Path", "Topological Sort", "MST"] },
  { category: "Algorithms",        color: "#f59e0b", items: ["Sorting", "Searching", "Divide & Conquer", "Greedy"] },
  { category: "Advanced",          color: "#ec4899", items: ["Dynamic Programming", "Backtracking", "Segment Trees"] },
];

const AGENTS = [
  { id: "teacher",    label: "Teacher",  icon: BookOpen,  color: "#8b5cf6", desc: "Explain concepts" },
  { id: "assessment", label: "Assess",   icon: Target,    color: "#06b6d4", desc: "Quiz & evaluate"  },
  { id: "feedback",   label: "Feedback", icon: BarChart3, color: "#10b981", desc: "Review mistakes"  },
  { id: "hint",       label: "Hint",     icon: Lightbulb, color: "#f59e0b", desc: "Guided nudge"     },
];

type Msg = { id: number; role: "user" | "ai"; content: string; agent?: string; agentColor?: string; timestamp: string; codeBlock?: string; };

const INITIAL_MESSAGES: Msg[] = [{
  id: 1, role: "ai",
  content: "Hello! I'm your DSA Tutor AI. I use a Socratic approach — I'll guide you with questions rather than giving direct answers, helping you build genuine understanding.\n\nWhat topic would you like to explore today? You can also upload a document, image of your handwritten solution, or speak to me!",
  agent: "Orchestrator", agentColor: "#f59e0b", timestamp: "Just now",
}];

const QUICK_PROMPTS = [
  "Explain Linked Lists with an example",
  "How does BFS differ from DFS?",
  "I'm stuck on a DP problem — help?",
  "Quiz me on Binary Trees",
  "What's the time complexity of merge sort?",
];

const AI_RESPONSES: Record<string, { content: string; codeBlock?: string }> = {
  teacher: {
    content: "Great question! Let me guide you through this.\n\nBefore I explain, let me ask you — when you think about a **Linked List**, what mental model comes to mind? How is it different from how you think about an array?\n\nTake a moment to reason through it. Think about:\n1. How data is stored in memory\n2. How you access elements\n3. What operations might be faster or slower\n\nWhat's your initial intuition?",
  },
  assessment: {
    content: "Quiz time! Let's test your understanding.\n\n**Question:** Given a singly linked list: 1 → 2 → 3 → 4 → 5\n\nWhat is the time complexity to access the 3rd element?\n\n- A) O(1)\n- B) O(log n)\n- C) O(n)\n- D) O(n²)\n\nThink carefully before answering — consider how a linked list stores data vs an array.",
  },
  feedback: {
    content: "Good attempt! Let me break down where your reasoning was strong and where we can improve.\n\n**What you got right:** Understanding that traversal requires following pointers is correct!\n\n**Where to refine:** Remember — in a linked list, we don't have random access like arrays. Each node only knows about the **next** node, so to reach position k, we must traverse all k-1 nodes before it.\n\nThis is why access is O(n) but insertion at the head is O(1). Does that distinction make sense?",
    codeBlock: `# Linked List traversal - O(n)
class Node:
    def __init__(self, data):
        self.data = data
        self.next = None

def get_element(head, position):
    current = head
    count = 0
    while current:
        if count == position:
            return current.data  # Found!
        current = current.next
        count += 1
    return -1  # Not found`,
  },
  hint: {
    content: "Here's a gentle nudge\n\nThink about this: when you call `head.next`, what are you doing?\n\nYou're asking a node to tell you *who its neighbor is*. Now — if I ask you to find the 5th person in a chain where each person only knows the next person... how many \"asks\" would you need?\n\nThat's your answer.",
  },
};

// ─── Theme tokens ─────────────────────────────────────────────────────────────
function getTheme(isDark: boolean) {
  return isDark ? {
    bg:        "#12131f",
    sidebar:   "#0d0e1a",
    actBar:    "#0a0b16",
    tabBar:    "#0c0d18",
    titleBar:  "#0a0b16",
    statusBar: "#0a0b16",
    border:    "#1e2035",
    border2:   "#252640",
    inputBg:   "#0c0d1c",
    hlBg:      "#094771",
    hoverBg:   "#1e2035",
    msgAi:     "#0e1525",
    msgUser:   "#151628",
    text1:     "#d4d4d4",
    text2:     "#8b8fa8",
    text3:     "#555570",
    mono:      "'JetBrains Mono', 'Consolas', monospace",
    sans:      "'Inter', 'Segoe UI', sans-serif",
  } : {
    bg:        "#f8f8f8",  // VS Code Light
    sidebar:   "#f0f0f0",
    actBar:    "#e8e8e8",
    tabBar:    "#ececec",
    titleBar:  "#dddddd",
    statusBar: "#007acc",  // VS Code blue status bar (kept in light too)
    border:    "#dde0e8",
    border2:   "#c8ccd6",
    inputBg:   "#f5f5f5",
    hlBg:      "#dce9f5",
    hoverBg:   "#e8e8ec",
    msgAi:     "#ffffff",
    msgUser:   "#f0f4ff",
    text1:     "#1e1e1e",
    text2:     "#555566",
    text3:     "#999aaa",
    mono:      "'JetBrains Mono', 'Consolas', monospace",
    sans:      "'Inter', 'Segoe UI', sans-serif",
  };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  const { isDark } = useTheme();
  const T = getTheme(isDark);
  const [copied, setCopied] = useState(false);
  return (
    <div style={{ marginTop: "12px", borderRadius: "6px", overflow: "hidden", border: `1px solid ${T.border2}` }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "5px 12px", background: isDark ? "#0a0b18" : "#efefef", borderBottom: `1px solid ${T.border}` }}>
        <span style={{ fontSize: "11px", color: T.text3, fontFamily: T.mono }}>python</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "11px", color: T.text3, background: "none", border: "none", cursor: "pointer", fontFamily: T.mono }}
          onMouseEnter={e => (e.currentTarget.style.color = T.text1)}
          onMouseLeave={e => (e.currentTarget.style.color = T.text3)}
        >
          <Copy style={{ width: "11px", height: "11px" }} />
          {copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre style={{ padding: "14px 16px", fontSize: "12px", fontFamily: T.mono, color: isDark ? "#a8b3c8" : "#333344", overflowX: "auto", lineHeight: 1.65, background: isDark ? "#090a16" : "#f5f5f5", margin: 0 }}>{code}</pre>
    </div>
  );
}

function TypingIndicator({ agentColor }: { agentColor: string }) {
  const { isDark } = useTheme();
  const T = getTheme(isDark);
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "10px", padding: "0 20px" }}>
      <div style={{ width: "26px", height: "26px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, background: `${agentColor}18`, border: `1px solid ${agentColor}35` }}>
        <Bot style={{ width: "13px", height: "13px", color: agentColor }} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "8px 12px", borderRadius: "6px", background: T.msgAi, border: `1px solid rgba(6,182,212,0.12)` }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="typing-dot" style={{ width: "5px", height: "5px", borderRadius: "50%", background: "#06b6d4" }} />
        ))}
        <span style={{ fontSize: "11px", color: T.text3, marginLeft: "4px", fontFamily: T.mono }}>thinking...</span>
      </div>
    </div>
  );
}

function renderContent(content: string, T: ReturnType<typeof getTheme>) {
  return content.split("\n").map((line, li) => {
    if (line.startsWith("**") && line.endsWith("**"))
      return <p key={li} style={{ fontWeight: 700, color: T.text1, marginTop: "8px", marginBottom: "4px", fontFamily: T.sans }}>{line.slice(2, -2)}</p>;
    if (line.startsWith("- "))
      return <p key={li} style={{ color: T.text2, marginLeft: "12px", fontFamily: T.mono, fontSize: "12px" }}>• {line.slice(2)}</p>;
    if (/^\d+\./.test(line))
      return <p key={li} style={{ color: T.text2, marginLeft: "8px", fontFamily: T.sans, fontSize: "13px" }}>{line}</p>;
    if (line.includes("**")) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return <p key={li} style={{ color: T.text2, fontFamily: T.sans, fontSize: "13px" }}>{parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} style={{ color: T.text1, fontWeight: 600 }}>{p}</strong> : p)}</p>;
    }
    if (line.includes("`")) {
      const parts = line.split(/`(.*?)`/g);
      return <p key={li} style={{ color: T.text2, fontFamily: T.sans, fontSize: "13px" }}>{parts.map((p, pi) => pi % 2 === 1 ? <code key={pi} style={{ color: "#f59e0b", background: "rgba(245,158,11,0.1)", padding: "1px 5px", borderRadius: "3px", fontFamily: T.mono, fontSize: "11px" }}>{p}</code> : p)}</p>;
    }
    return line ? <p key={li} style={{ color: T.text2, fontFamily: T.sans, fontSize: "13px", lineHeight: 1.7 }}>{line}</p> : <br key={li} />;
  });
}

// ─── File icon dot (Bloop-style colored dot per category) ─────────────────────
function FileIcon({ color, active }: { color: string; active: boolean }) {
  return (
    <div style={{ width: "14px", height: "14px", borderRadius: "3px", display: "flex", alignItems: "center", justifyContent: "center", background: active ? `${color}30` : `${color}18`, border: `1px solid ${active ? color + "60" : color + "30"}`, flexShrink: 0 }}>
      <div style={{ width: "5px", height: "5px", borderRadius: "50%", background: active ? color : color + "99" }} />
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function LearnPage() {
  const { isDark } = useTheme();
  const T = getTheme(isDark);
  const [messages, setMessages] = useState<Msg[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState("teacher");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTopic, setActiveTopic] = useState("Linked Lists");
  const [expandedCategory, setExpandedCategory] = useState<string | null>("Linear Structures");
  const [dragOver, setDragOver] = useState(false);
  const [activeView, setActiveView] = useState("explorer");
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentAgent = AGENTS.find(a => a.id === selectedAgent)!;
  const activeCategory = TOPICS_SIDEBAR.find(c => c.items.includes(activeTopic))?.category ?? "Topics";
  const activeCategoryColor = TOPICS_SIDEBAR.find(c => c.items.includes(activeTopic))?.color ?? "#f59e0b";

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Msg = { id: Date.now(), role: "user", content: input.trim(), timestamp: "now" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 1800));
    const resp = AI_RESPONSES[selectedAgent] ?? AI_RESPONSES.teacher;
    const aiMsg: Msg = { id: Date.now() + 1, role: "ai", content: resp.content, agent: currentAgent.label, agentColor: currentAgent.color, timestamp: "now", codeBlock: resp.codeBlock };
    setIsTyping(false);
    setMessages(prev => [...prev, aiMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const toSlug = (s: string) => s.toLowerCase().replace(/ \//g, "").replace(/ /g, "-");

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column", overflow: "hidden", background: T.bg, color: T.text1, fontFamily: T.mono }}>

      {/* ── TITLE BAR ── */}
      <div style={{ height: "32px", display: "flex", alignItems: "center", paddingLeft: "14px", paddingRight: "14px", flexShrink: 0, background: T.titleBar, borderBottom: `1px solid ${T.border}`, userSelect: "none" }}>
        {/* Traffic lights */}
        <div style={{ display: "flex", alignItems: "center", gap: "6px", flexShrink: 0 }}>
          <Link href="/"><div title="Go home" style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#ff5f57", cursor: "pointer" }} /></Link>
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#febc2e" }} />
          <div style={{ width: "12px", height: "12px", borderRadius: "50%", background: "#28c840" }} />
        </div>
        {/* Center */}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "12px" }}>
          <span style={{ color: activeCategoryColor, fontWeight: 600 }}>{toSlug(activeTopic)}.dsa</span>
          <span style={{ color: T.text3 }}>—</span>
          <span style={{ color: T.text2 }}>{currentAgent.label} Agent</span>
          <span style={{ color: T.text3 }}>—</span>
          <span style={{ color: T.text3 }}>DSA Tutor AI</span>
        </div>
        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", gap: "2px", flexShrink: 0 }}>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", color: T.text3, background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text1; e.currentTarget.style.background = T.hoverBg; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = "none"; }}>
              <LayoutDashboard style={{ width: "11px", height: "11px" }} />Dashboard
            </button>
          </Link>
          <Link href="/" style={{ textDecoration: "none" }}>
            <button style={{ display: "flex", alignItems: "center", gap: "4px", padding: "2px 8px", borderRadius: "4px", fontSize: "11px", color: T.text3, background: "none", border: "none", cursor: "pointer" }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text1; e.currentTarget.style.background = T.hoverBg; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = "none"; }}>
              <Home style={{ width: "11px", height: "11px" }} />Home
            </button>
          </Link>
        </div>
      </div>

      {/* ── BODY ── */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>

        {/* ── ACTIVITY BAR ── */}
        <div style={{ width: "48px", display: "flex", flexDirection: "column", alignItems: "center", paddingTop: "4px", gap: "2px", flexShrink: 0, background: T.actBar, borderRight: `1px solid ${T.border}` }}>
          {[
            { id: "explorer", icon: BookOpen, title: "Explorer" },
            { id: "agents",   icon: Bot,      title: "Agents"   },
            { id: "search",   icon: Search,   title: "Search"   },
          ].map(v => {
            const isActive = activeView === v.id && sidebarOpen;
            return (
              <button key={v.id}
                onClick={() => { if (activeView === v.id && sidebarOpen) setSidebarOpen(false); else { setActiveView(v.id); setSidebarOpen(true); } }}
                title={v.title}
                style={{ position: "relative", width: "100%", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: isActive ? T.text1 : T.text3 }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = T.text2; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = T.text3; }}
              >
                {isActive && <div style={{ position: "absolute", left: 0, top: "12px", bottom: "12px", width: "2px", borderRadius: "0 2px 2px 0", background: "#f59e0b" }} />}
                <v.icon style={{ width: "21px", height: "21px" }} />
              </button>
            );
          })}
          <div style={{ flex: 1 }} />
          <Link href="/dashboard">
            <button title="Dashboard" style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: T.text3 }}
              onMouseEnter={e => (e.currentTarget.style.color = T.text2)}
              onMouseLeave={e => (e.currentTarget.style.color = T.text3)}>
              <LayoutDashboard style={{ width: "21px", height: "21px" }} />
            </button>
          </Link>
          <button title="Settings" style={{ width: "48px", height: "48px", display: "flex", alignItems: "center", justifyContent: "center", background: "none", border: "none", cursor: "pointer", color: T.text3 }}
            onMouseEnter={e => (e.currentTarget.style.color = T.text2)}
            onMouseLeave={e => (e.currentTarget.style.color = T.text3)}>
            <Settings style={{ width: "21px", height: "21px" }} />
          </button>
        </div>

        {/* ── SIDEBAR ── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }} animate={{ width: 248, opacity: 1 }} exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              style={{ display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden", background: T.sidebar, borderRight: `1px solid ${T.border}` }}
            >
              {/* Sidebar header */}
              <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", flexShrink: 0, borderBottom: `1px solid ${T.border}` }}>
                <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9095b0" }}>
                  {activeView === "explorer" ? "Explorer" : activeView === "agents" ? "Agents" : "Search"}
                </span>
                <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.text3, padding: "2px", borderRadius: "3px" }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.text1)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.text3)}>
                  <X style={{ width: "13px", height: "13px" }} />
                </button>
              </div>

              {/* ── EXPLORER ── */}
              {activeView === "explorer" && (
                <div style={{ flex: 1, overflowY: "auto", paddingTop: "4px" }}>
                  {/* Root folder */}
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 10px 4px", cursor: "default", userSelect: "none" }}>
                    <ChevronDown style={{ width: "12px", height: "12px", color: T.text3, flexShrink: 0 }} />
                    <FolderOpen style={{ width: "14px", height: "14px", color: "#dcb67a", flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.text1 }}>dsa-curriculum</span>
                  </div>

                  {TOPICS_SIDEBAR.map(cat => (
                    <div key={cat.category}>
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "4px", padding: "2px 10px 2px 16px", background: "none", border: "none", cursor: "pointer", color: T.text2 }}
                        onMouseEnter={e => (e.currentTarget.style.background = T.hoverBg)}
                        onMouseLeave={e => (e.currentTarget.style.background = "none")}
                      >
                        <ChevronRight style={{ width: "12px", height: "12px", flexShrink: 0, transform: expandedCategory === cat.category ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.1s" }} />
                        {expandedCategory === cat.category
                          ? <FolderOpen style={{ width: "14px", height: "14px", color: "#dcb67a", flexShrink: 0 }} />
                          : <Folder style={{ width: "14px", height: "14px", color: "#dcb67a", flexShrink: 0 }} />}
                        <span style={{ fontSize: "12px", textAlign: "left" }}>{cat.category}</span>
                      </button>

                      {expandedCategory === cat.category && cat.items.map(item => {
                        const isActive = activeTopic === item;
                        return (
                          <button key={item} onClick={() => setActiveTopic(item)}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: "6px", paddingLeft: "36px", paddingRight: "8px", paddingTop: "2px", paddingBottom: "2px", background: isActive ? T.hlBg : "none", border: "none", cursor: "pointer", color: isActive ? "#ffffff" : T.text3 }}
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.hoverBg; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}
                          >
                            <FileIcon color={cat.color} active={isActive} />
                            <span style={{ fontSize: "12px", textAlign: "left" }}>{toSlug(item)}.dsa</span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* ── AGENTS ── */}
              {activeView === "agents" && (
                <div style={{ flex: 1, overflowY: "auto", padding: "8px" }}>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", padding: "4px 8px 6px", color: T.text3 }}>Active Agents</div>
                  {AGENTS.map(a => {
                    const isActive = selectedAgent === a.id;
                    return (
                      <button key={a.id} onClick={() => setSelectedAgent(a.id)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", borderRadius: "6px", border: `1px solid ${isActive ? a.color + "35" : "transparent"}`, background: isActive ? `${a.color}12` : "none", color: isActive ? a.color : T.text2, cursor: "pointer", marginBottom: "2px" }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = T.hoverBg; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "none"; }}
                      >
                        <a.icon style={{ width: "15px", height: "15px", flexShrink: 0 }} />
                        <div style={{ flex: 1, textAlign: "left" }}>
                          <div style={{ fontSize: "12px", fontWeight: 500 }}>{a.label}</div>
                          <div style={{ fontSize: "10px", opacity: 0.6, marginTop: "1px" }}>{a.desc}</div>
                        </div>
                        {isActive && <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: a.color, flexShrink: 0 }} />}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── SEARCH ── */}
              {activeView === "search" && (
                <div style={{ flex: 1, padding: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "4px", background: T.inputBg, border: `1px solid ${T.border2}` }}>
                    <Search style={{ width: "13px", height: "13px", color: T.text3 }} />
                    <input placeholder="Search topics..." style={{ flex: 1, background: "none", border: "none", outline: "none", fontSize: "12px", color: T.text1, fontFamily: T.mono }} />
                  </div>
                  <p style={{ fontSize: "11px", textAlign: "center", marginTop: "16px", color: T.text3 }}>Search across all DSA topics</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── EDITOR AREA ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* TAB BAR */}
          <div style={{ height: "36px", display: "flex", alignItems: "flex-end", overflow: "hidden", flexShrink: 0, background: T.tabBar, borderBottom: `1px solid ${T.border}` }}>
            {AGENTS.map(agent => {
              const isActive = selectedAgent === agent.id;
              return (
                <button key={agent.id} onClick={() => setSelectedAgent(agent.id)}
                  style={{ height: "100%", display: "flex", alignItems: "center", gap: "6px", padding: "0 14px", fontSize: "12px", whiteSpace: "nowrap", flexShrink: 0, position: "relative", background: isActive ? T.bg : "none", color: isActive ? T.text1 : T.text3, border: "none", borderRight: `1px solid ${T.border}`, cursor: "pointer" }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = T.text2; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = T.text3; }}
                >
                  {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1.5px", background: agent.color }} />}
                  <agent.icon style={{ width: "13px", height: "13px", color: agent.color, flexShrink: 0 }} />
                  <span>{agent.label.toLowerCase()}.dsa</span>
                  <span style={{ fontSize: "10px", color: isActive ? T.text3 : "transparent", marginLeft: "2px" }}>×</span>
                </button>
              );
            })}
            <button style={{ height: "100%", padding: "0 12px", flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: T.text3 }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text2; e.currentTarget.style.background = T.hoverBg; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = "none"; }}>
              <Plus style={{ width: "13px", height: "13px" }} />
            </button>
          </div>

          {/* BREADCRUMB */}
          <div style={{ height: "26px", display: "flex", alignItems: "center", padding: "0 16px", fontSize: "12px", flexShrink: 0, background: T.bg, borderBottom: `1px solid ${T.border}`, color: T.text3, userSelect: "none", gap: "4px" }}>
            <BookOpen style={{ width: "12px", height: "12px" }} />
            <span>DSA</span>
            <ChevronRight style={{ width: "11px", height: "11px", color: T.text3 }} />
            <span style={{ color: activeCategoryColor + "cc" }}>{activeCategory}</span>
            <ChevronRight style={{ width: "11px", height: "11px", color: T.text3 }} />
            <FileIcon color={activeCategoryColor} active={false} />
            <span style={{ color: activeCategoryColor }}>{toSlug(activeTopic)}.dsa</span>
          </div>

          {/* MESSAGES */}
          <div
            style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px", padding: "16px 0", background: T.bg }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); }}
          >
            {dragOver && (
              <div style={{ position: "fixed", inset: 0, zIndex: 50, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(12,13,28,0.9)", backdropFilter: "blur(6px)" }}>
                <div style={{ borderRadius: "8px", padding: "40px", textAlign: "center", border: "2px dashed #f59e0b" }}>
                  <FileText style={{ width: "48px", height: "48px", margin: "0 auto 12px", color: "#f59e0b" }} />
                  <p style={{ fontSize: "15px", fontWeight: 600, color: T.text1, fontFamily: T.sans }}>Drop your file here</p>
                  <p style={{ fontSize: "13px", color: T.text2, marginTop: "6px", fontFamily: T.sans }}>PDF, image, or document</p>
                </div>
              </div>
            )}

            {/* Quick prompts */}
            {messages.length === 1 && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} style={{ padding: "0 20px" }}>
                <p style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.12em", marginBottom: "8px", color: T.text3 }}>
                  // Quick Start
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {QUICK_PROMPTS.map((p, i) => (
                    <button key={i} onClick={() => { setInput(p); inputRef.current?.focus(); }}
                      style={{ padding: "4px 12px", fontSize: "11px", borderRadius: "4px", background: T.inputBg, border: `1px solid ${T.border2}`, color: T.text3, cursor: "pointer", fontFamily: T.mono }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = "#f59e0b55"; e.currentTarget.style.color = T.text1; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = T.border2; e.currentTarget.style.color = T.text3; }}>
                      {p}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
                style={{ display: "flex", gap: "10px", padding: "0 20px", alignItems: "flex-start", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}
              >
                {/* Avatar */}
                <div style={{ flexShrink: 0, marginTop: "2px" }}>
                  {msg.role === "ai" ? (
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", background: `${msg.agentColor ?? "#f59e0b"}18`, border: `1px solid ${msg.agentColor ?? "#f59e0b"}35` }}>
                      <Bot style={{ width: "14px", height: "14px", color: msg.agentColor ?? "#f59e0b" }} />
                    </div>
                  ) : (
                    <div style={{ width: "28px", height: "28px", borderRadius: "6px", display: "flex", alignItems: "center", justifyContent: "center", background: "#1a1a38", border: "1px solid #f59e0b35" }}>
                      <User style={{ width: "14px", height: "14px", color: "#f59e0b" }} />
                    </div>
                  )}
                </div>

                {/* Content */}
                <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxWidth: "78%", alignItems: msg.role === "user" ? "flex-end" : "flex-start" }}>
                  {msg.role === "ai" && msg.agent && (
                    <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: msg.agentColor, fontFamily: T.mono }}>
                      {msg.agent} Agent
                    </span>
                  )}
                  <div style={{ borderRadius: "6px", padding: "10px 14px", ...(msg.role === "ai" ? { background: T.msgAi, border: "1px solid rgba(6,182,212,0.1)" } : { background: T.msgUser, border: "1px solid rgba(245,158,11,0.14)" }) }}>
                    {renderContent(msg.content, T)}
                    {msg.codeBlock && <CodeBlock code={msg.codeBlock} />}
                  </div>
                  {msg.role === "ai" && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "0 4px" }}>
                      {[ThumbsUp, ThumbsDown, Volume2, RefreshCw].map((Icon, i) => (
                        <button key={i} style={{ background: "none", border: "none", cursor: "pointer", color: T.text3, padding: 0 }}
                          onMouseEnter={e => (e.currentTarget.style.color = T.text2)}
                          onMouseLeave={e => (e.currentTarget.style.color = T.text3)}>
                          <Icon style={{ width: "12px", height: "12px" }} />
                        </button>
                      ))}
                      <span style={{ fontSize: "10px", color: T.text3, fontFamily: T.mono }}>{msg.timestamp}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && <TypingIndicator agentColor={currentAgent.color} />}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT BAR */}
          <div style={{ flexShrink: 0, padding: "10px 14px", background: T.tabBar, borderTop: `1px solid ${T.border}` }}>
            {/* Status hint */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", fontSize: "11px", userSelect: "none", color: T.text3 }}>
              <span style={{ color: currentAgent.color }}>▶ {currentAgent.label} Mode</span>
              <span style={{ color: T.border2 }}>·</span>
              <span style={{ color: T.text2 }}>{activeTopic}</span>
              <span style={{ color: T.border2 }}>·</span>
              <span>⏎ send&nbsp;&nbsp;⇧⏎ newline</span>
            </div>
            <div style={{ display: "flex", alignItems: "flex-end", gap: "6px" }}>
              {/* Attachment buttons */}
              <div style={{ display: "flex", gap: "2px", flexShrink: 0, paddingBottom: "4px" }}>
                {[{ Icon: Paperclip, title: "Attach file", hover: "#f59e0b" }, { Icon: ImageIcon, title: "Upload image", hover: "#8b5cf6" }, { Icon: FileText, title: "Upload PDF", hover: "#06b6d4" }].map(({ Icon, title, hover }, i) => (
                  <button key={i} title={title} style={{ padding: "5px", borderRadius: "4px", background: "none", border: "none", cursor: "pointer", color: T.text3 }}
                    onMouseEnter={e => { e.currentTarget.style.color = hover; e.currentTarget.style.background = `${hover}14`; }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = "none"; }}>
                    <Icon style={{ width: "15px", height: "15px" }} />
                  </button>
                ))}
              </div>
              {/* Textarea */}
              <textarea
                ref={inputRef} value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${currentAgent.label} Agent about ${activeTopic}...`}
                rows={1}
                style={{ flex: 1, borderRadius: "5px", padding: "7px 12px", fontSize: "13px", outline: "none", resize: "none", background: T.inputBg, border: `1px solid ${T.border2}`, color: T.text1, fontFamily: T.mono, minHeight: "34px", maxHeight: "120px" }}
                onFocus={e => { e.currentTarget.style.borderColor = `${currentAgent.color}55`; }}
                onBlur={e => { e.currentTarget.style.borderColor = T.border2; }}
                onInput={e => { const t = e.currentTarget; t.style.height = "auto"; t.style.height = Math.min(t.scrollHeight, 120) + "px"; }}
              />
              {/* Mic */}
              <button title="Voice input" style={{ padding: "7px", borderRadius: "5px", flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: T.text3 }}
                onMouseEnter={e => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.background = "#f59e0b12"; }}
                onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = "none"; }}>
                <Mic style={{ width: "15px", height: "15px" }} />
              </button>
              {/* Send */}
              <motion.button onClick={sendMessage} disabled={!input.trim() || isTyping}
                whileHover={input.trim() && !isTyping ? { scale: 1.05 } : {}}
                whileTap={input.trim() && !isTyping ? { scale: 0.95 } : {}}
                style={{ padding: "7px 8px", borderRadius: "5px", flexShrink: 0, border: "none", cursor: input.trim() && !isTyping ? "pointer" : "not-allowed", ...(input.trim() && !isTyping ? { background: "linear-gradient(135deg,#f59e0b,#d97706)", color: "#000" } : { background: "#131425", color: T.text3 }) }}>
                <Send style={{ width: "15px", height: "15px" }} />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div style={{ width: "232px", display: "flex", flexDirection: "column", flexShrink: 0, overflow: "hidden", background: T.sidebar, borderLeft: `1px solid ${T.border}` }} className="hidden xl:flex">
          {/* Panel header */}
          <div style={{ height: "36px", display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 12px", flexShrink: 0, borderBottom: `1px solid ${T.border}` }}>
            <span style={{ fontSize: "10px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.12em", color: "#9095b0" }}>Outline</span>
            <Brain style={{ width: "13px", height: "13px", color: T.text3 }} />
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>

            {/* Concept Summary */}
            {[
              { title: "Concept Summary", content: (
                <div style={{ display: "flex", flexDirection: "column", gap: "5px", padding: "0 16px 10px" }}>
                  {["Node structure", "Head pointer", "Traversal", "Insertion", "Deletion"].map((c, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: T.text2, cursor: "pointer" }}
                      onMouseEnter={e => (e.currentTarget.style.color = T.text1)}
                      onMouseLeave={e => (e.currentTarget.style.color = T.text2)}>
                      <div style={{ width: "6px", height: "6px", borderRadius: "50%", background: currentAgent.color, flexShrink: 0 }} />
                      {c}
                    </div>
                  ))}
                </div>
              )},
              { title: "Complexity", content: (
                <div style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "0 12px 10px" }}>
                  {[{ op: "Access", tc: "O(n)", sc: "O(1)" }, { op: "Search", tc: "O(n)", sc: "O(1)" }, { op: "Insert (head)", tc: "O(1)", sc: "O(1)" }, { op: "Insert (tail)", tc: "O(n)", sc: "O(1)" }, { op: "Delete", tc: "O(n)", sc: "O(1)" }].map((row, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <span style={{ fontSize: "10px", color: T.text3 }}>{row.op}</span>
                      <div style={{ display: "flex", gap: "8px" }}>
                        <span style={{ fontSize: "10px", fontFamily: T.mono, color: "#f59e0b" }}>{row.tc}</span>
                        <span style={{ fontSize: "10px", fontFamily: T.mono, color: "#8b5cf6" }}>{row.sc}</span>
                      </div>
                    </div>
                  ))}
                  <div style={{ display: "flex", gap: "10px", marginTop: "4px", paddingTop: "4px", borderTop: `1px solid ${T.border}` }}>
                    {[{ c: "#f59e0b", l: "Time" }, { c: "#8b5cf6", l: "Space" }].map(x => (
                      <span key={x.l} style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "9px", color: T.text3 }}>
                        <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: x.c, display: "inline-block" }} />{x.l}
                      </span>
                    ))}
                  </div>
                </div>
              )},
              { title: "Code Skeleton", content: (
                <div style={{ padding: "0 12px 10px" }}>
                  <pre style={{ fontSize: "10px", fontFamily: T.mono, lineHeight: 1.6, padding: "8px 10px", borderRadius: "5px", background: "#090a16", border: `1px solid ${T.border2}`, color: "#9098b8", overflowX: "auto", margin: 0 }}>{`class Node:\n  def __init__(self, data):\n    self.data = data\n    self.next = None\n\nclass LinkedList:\n  def __init__(self):\n    self.head = None`}</pre>
                </div>
              )},
              { title: "Pro Tip", content: (
                <div style={{ padding: "0 12px 10px" }}>
                  <div style={{ padding: "8px 10px", borderRadius: "5px", background: "rgba(245,158,11,0.06)", border: "1px solid rgba(245,158,11,0.2)", fontSize: "10px", color: T.text2, lineHeight: 1.6 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "4px", marginBottom: "5px" }}>
                      <Lightbulb style={{ width: "11px", height: "11px", color: "#f59e0b" }} />
                      <span style={{ fontWeight: 600, color: "#f59e0b" }}>Tip</span>
                    </div>
                    Draw the linked list on paper while coding. Visualizing pointer changes prevents bugs.
                  </div>
                </div>
              )},
              { title: "Switch Agent", content: (
                <div style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "0 8px 10px" }}>
                  {AGENTS.map(a => {
                    const isActive = selectedAgent === a.id;
                    return (
                      <button key={a.id} onClick={() => setSelectedAgent(a.id)}
                        style={{ display: "flex", alignItems: "center", gap: "7px", padding: "6px 8px", borderRadius: "5px", border: "none", background: isActive ? `${a.color}15` : "none", color: isActive ? a.color : T.text3, cursor: "pointer", textAlign: "left" }}
                        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = T.hoverBg; e.currentTarget.style.color = T.text2; } }}
                        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "none"; e.currentTarget.style.color = T.text3; } }}>
                        <a.icon style={{ width: "13px", height: "13px", flexShrink: 0 }} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "11px", fontWeight: 500 }}>{a.label}</div>
                          <div style={{ fontSize: "9px", opacity: 0.55 }}>{a.desc}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )},
            ].map(section => (
              <div key={section.title} style={{ borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "7px 12px", cursor: "default", userSelect: "none" }}>
                  <ChevronDown style={{ width: "11px", height: "11px", color: T.text3 }} />
                  <span style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 700, color: "#9095b0" }}>{section.title}</span>
                </div>
                {section.content}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── STATUS BAR ── */}
      <div style={{ height: "24px", display: "flex", alignItems: "center", fontSize: "11px", flexShrink: 0, overflow: "hidden", userSelect: "none", background: T.statusBar, borderTop: `1px solid ${T.border}`, color: T.text2 }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0 12px", height: "100%", background: `${currentAgent.color}20`, color: currentAgent.color, cursor: "pointer" }}
            onMouseEnter={e => (e.currentTarget.style.background = `${currentAgent.color}32`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${currentAgent.color}20`)}>
            <currentAgent.icon style={{ width: "11px", height: "11px" }} />
            <span>{currentAgent.label} Agent</span>
          </div>
          <button style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0 12px", height: "100%", background: "none", border: "none", cursor: "pointer", color: T.text2 }}
            onMouseEnter={e => (e.currentTarget.style.background = T.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <Zap style={{ width: "11px", height: "11px" }} />
            {activeTopic}
          </button>
          <button style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0 12px", height: "100%", background: "none", border: "none", cursor: "pointer", color: "#10b981" }}
            onMouseEnter={e => (e.currentTarget.style.background = T.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10b981", display: "inline-block" }} className="animate-pulse" />
            Online
          </button>
        </div>
        {/* Right */}
        <div style={{ display: "flex", alignItems: "center", height: "100%", marginLeft: "auto" }}>
          {["Python", "UTF-8", "DSA Tutor AI"].map(label => (
            <button key={label} style={{ padding: "0 12px", height: "100%", background: "none", border: "none", cursor: "pointer", color: label === "DSA Tutor AI" ? "#f59e0b90" : T.text2 }}
              onMouseEnter={e => (e.currentTarget.style.background = T.hoverBg)}
              onMouseLeave={e => (e.currentTarget.style.background = "none")}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
