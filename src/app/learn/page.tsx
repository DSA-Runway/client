"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  Send, Mic, ImageIcon, FileText, Bot, User,
  Brain, Target, BarChart3, BookOpen, Zap,
  Volume2, ChevronRight, ChevronDown,
  RefreshCw, ThumbsUp, ThumbsDown, Copy,
  Folder, FolderOpen, FileCode, Settings, Search,
  LayoutDashboard, Home, Lightbulb, Paperclip, X, Plus,
} from "lucide-react";

// ─── CONSTANTS ──────────────────────────────────────────────────────────────

const TOPICS_SIDEBAR = [
  { category: "Fundamentals", items: ["Arrays", "Strings", "Recursion", "Bit Manipulation"] },
  { category: "Linear Structures", items: ["Linked Lists", "Stacks", "Queues", "Deque"] },
  { category: "Trees", items: ["Binary Trees", "BST", "AVL Trees", "Heaps", "Tries"] },
  { category: "Graphs", items: ["BFS / DFS", "Shortest Path", "Topological Sort", "MST"] },
  { category: "Algorithms", items: ["Sorting", "Searching", "Divide & Conquer", "Greedy"] },
  { category: "Advanced", items: ["Dynamic Programming", "Backtracking", "Segment Trees"] },
];

const AGENTS = [
  { id: "teacher",    label: "Teacher",  icon: BookOpen, color: "#8b5cf6", desc: "Explain concepts" },
  { id: "assessment", label: "Assess",   icon: Target,   color: "#06b6d4", desc: "Quiz & evaluate"  },
  { id: "feedback",   label: "Feedback", icon: BarChart3, color: "#10b981", desc: "Review mistakes"  },
  { id: "hint",       label: "Hint",     icon: Lightbulb,color: "#f59e0b", desc: "Guided nudge"     },
];

type Msg = {
  id: number;
  role: "user" | "ai";
  content: string;
  agent?: string;
  agentColor?: string;
  timestamp: string;
  codeBlock?: string;
};

const INITIAL_MESSAGES: Msg[] = [
  {
    id: 1,
    role: "ai",
    content:
      "Hello! I'm your DSA Tutor AI. I use a Socratic approach — I'll guide you with questions rather than giving direct answers, helping you build genuine understanding.\n\nWhat topic would you like to explore today? You can also upload a document, image of your handwritten solution, or speak to me!",
    agent: "Orchestrator",
    agentColor: "#f59e0b",
    timestamp: "Just now",
  },
];

const QUICK_PROMPTS = [
  "Explain Linked Lists with an example",
  "How does BFS differ from DFS?",
  "I'm stuck on a DP problem — help?",
  "Quiz me on Binary Trees",
  "What's the time complexity of merge sort?",
];

const AI_RESPONSES: Record<string, { content: string; codeBlock?: string }> = {
  teacher: {
    content:
      "Great question! Let me guide you through this.\n\nBefore I explain, let me ask you — when you think about a **Linked List**, what mental model comes to mind? How is it different from how you think about an array?\n\nTake a moment to reason through it. Think about:\n1. How data is stored in memory\n2. How you access elements\n3. What operations might be faster or slower\n\nWhat's your initial intuition?",
  },
  assessment: {
    content:
      "Quiz time! Let's test your understanding.\n\n**Question:** Given a singly linked list: 1 → 2 → 3 → 4 → 5\n\nWhat is the time complexity to access the 3rd element?\n\n- A) O(1)\n- B) O(log n)\n- C) O(n)\n- D) O(n²)\n\nThink carefully before answering — consider how a linked list stores data vs an array.",
  },
  feedback: {
    content:
      "Good attempt! Let me break down where your reasoning was strong and where we can improve.\n\n**What you got right:** Understanding that traversal requires following pointers is correct!\n\n**Where to refine:** Remember — in a linked list, we don't have random access like arrays. Each node only knows about the **next** node, so to reach position k, we must traverse all k-1 nodes before it.\n\nThis is why access is O(n) but insertion at the head is O(1). Does that distinction make sense?",
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
    content:
      "Here's a gentle nudge\n\nThink about this: when you call `head.next`, what are you doing?\n\nYou're asking a node to tell you *who its neighbor is*. Now — if I ask you to find the 5th person in a chain where each person only knows the next person... how many \"asks\" would you need?\n\nThat's your answer.",
  },
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────

function CodeBlock({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="mt-3 rounded overflow-hidden" style={{ border: "1px solid #3c3c3c" }}>
      <div className="flex items-center justify-between px-3 py-1.5" style={{ background: "#1a1a2e", borderBottom: "1px solid #3c3c3c" }}>
        <span className="text-[11px] text-gray-500 font-mono">python</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
          className="flex items-center gap-1 text-[11px] text-gray-500 hover:text-gray-200 transition-colors"
        >
          <Copy className="w-3 h-3" />{copied ? "Copied!" : "Copy"}
        </button>
      </div>
      <pre className="p-4 text-xs font-mono text-gray-300 overflow-x-auto leading-relaxed" style={{ background: "#0d0d1a" }}>{code}</pre>
    </div>
  );
}

function TypingIndicator({ agentColor }: { agentColor: string }) {
  return (
    <div className="flex items-center gap-3 px-4">
      <div className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0" style={{ background: `${agentColor}20`, border: `1px solid ${agentColor}40` }}>
        <Bot className="w-3.5 h-3.5" style={{ color: agentColor }} />
      </div>
      <div className="flex gap-1.5 items-center px-3 py-2 rounded" style={{ background: "#0d1628", border: "1px solid rgba(6,182,212,0.15)" }}>
        <div className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] typing-dot" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] typing-dot" />
        <div className="w-1.5 h-1.5 rounded-full bg-[#06b6d4] typing-dot" />
        <span className="text-[11px] text-gray-500 ml-1 font-mono">thinking...</span>
      </div>
    </div>
  );
}

function renderContent(content: string) {
  return content.split("\n").map((line, li) => {
    if (line.startsWith("**") && line.endsWith("**"))
      return <p key={li} className="font-bold text-white mt-2 mb-1" style={{ fontFamily: "Inter, sans-serif" }}>{line.slice(2, -2)}</p>;
    if (line.startsWith("- "))
      return <p key={li} className="text-gray-300 ml-3 font-mono">• {line.slice(2)}</p>;
    if (/^\d+\./.test(line))
      return <p key={li} className="text-gray-300 ml-2">{line}</p>;
    if (line.includes("**")) {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={li} className="text-gray-300">
          {parts.map((p, pi) => pi % 2 === 1 ? <strong key={pi} className="text-white font-semibold">{p}</strong> : p)}
        </p>
      );
    }
    if (line.includes("`")) {
      const parts = line.split(/`(.*?)`/g);
      return (
        <p key={li} className="text-gray-300">
          {parts.map((p, pi) => pi % 2 === 1
            ? <code key={pi} className="text-[#f59e0b] bg-[#f59e0b10] px-1 rounded font-mono text-[12px]">{p}</code>
            : p
          )}
        </p>
      );
    }
    return line ? <p key={li} className="text-gray-300">{line}</p> : <br key={li} />;
  });
}

// ─── MAIN COMPONENT ──────────────────────────────────────────────────────────

export default function LearnPage() {
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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg: Msg = { id: Date.now(), role: "user", content: input.trim(), timestamp: "now" };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);
    await new Promise(r => setTimeout(r, 1800));
    const resp = AI_RESPONSES[selectedAgent] ?? AI_RESPONSES.teacher;
    const aiMsg: Msg = {
      id: Date.now() + 1,
      role: "ai",
      content: resp.content,
      agent: currentAgent.label,
      agentColor: currentAgent.color,
      timestamp: "now",
      codeBlock: resp.codeBlock,
    };
    setIsTyping(false);
    setMessages(prev => [...prev, aiMsg]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  return (
    <div
      className="h-screen flex flex-col overflow-hidden"
      style={{ background: "#080810", color: "#cccccc", fontFamily: "'JetBrains Mono', 'Consolas', monospace" }}
    >
      {/* ── TITLE BAR ────────────────────────────────────────────────────── */}
      <div
        className="h-8 flex items-center px-4 flex-shrink-0 select-none"
        style={{ background: "#0d0d1a", borderBottom: "1px solid #1e1e3a" }}
      >
        {/* macOS traffic lights */}
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <Link href="/">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] hover:opacity-75 transition-opacity cursor-pointer" title="Go home" />
          </Link>
          <div className="w-3 h-3 rounded-full bg-[#febc2e] cursor-default" />
          <div className="w-3 h-3 rounded-full bg-[#28c840] cursor-default" />
        </div>

        {/* Center title */}
        <div className="flex-1 flex items-center justify-center gap-2 text-[11px]">
          <span style={{ color: currentAgent.color }}>
            {activeTopic.toLowerCase().replace(/ \//g, "").replace(/ /g, "-")}.dsa
          </span>
          <span className="text-gray-700">—</span>
          <span className="text-gray-400">{currentAgent.label} Agent</span>
          <span className="text-gray-700">—</span>
          <span className="text-gray-600">DSA Tutor AI</span>
        </div>

        {/* Right nav */}
        <div className="flex items-center gap-1 flex-shrink-0">
          <Link href="/dashboard">
            <button className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all">
              <LayoutDashboard className="w-3 h-3" />
              <span className="hidden sm:inline">Dashboard</span>
            </button>
          </Link>
          <Link href="/">
            <button className="flex items-center gap-1 px-2 py-0.5 rounded text-[11px] text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all">
              <Home className="w-3 h-3" />
              <span className="hidden sm:inline">Home</span>
            </button>
          </Link>
        </div>
      </div>

      {/* ── BODY ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── ACTIVITY BAR ───────────────────────────────────────────────── */}
        <div
          className="w-12 flex flex-col items-center py-1 gap-0.5 flex-shrink-0"
          style={{ background: "#0a0a14", borderRight: "1px solid #1e1e3a" }}
        >
          {[
            { id: "explorer", icon: BookOpen, title: "Explorer" },
            { id: "agents",   icon: Bot,      title: "Agents"   },
            { id: "search",   icon: Search,   title: "Search"   },
          ].map(v => {
            const isActive = activeView === v.id && sidebarOpen;
            return (
              <button
                key={v.id}
                onClick={() => {
                  if (activeView === v.id && sidebarOpen) setSidebarOpen(false);
                  else { setActiveView(v.id); setSidebarOpen(true); }
                }}
                title={v.title}
                className="relative w-full h-12 flex items-center justify-center transition-colors group"
                style={{ color: isActive ? "#cccccc" : "#555566" }}
              >
                {isActive && (
                  <div className="absolute left-0 top-3 bottom-3 w-[2px] rounded-r" style={{ background: "#f59e0b" }} />
                )}
                <v.icon className="w-[22px] h-[22px]" />
              </button>
            );
          })}

          <div className="flex-1" />

          <Link href="/dashboard">
            <button title="Dashboard" className="w-full h-12 flex items-center justify-center transition-colors" style={{ color: "#555566" }}
              onMouseEnter={e => (e.currentTarget.style.color = "#aaaaaa")}
              onMouseLeave={e => (e.currentTarget.style.color = "#555566")}
            >
              <LayoutDashboard className="w-[22px] h-[22px]" />
            </button>
          </Link>

          <button title="Settings" className="w-full h-12 flex items-center justify-center transition-colors" style={{ color: "#555566" }}
            onMouseEnter={e => (e.currentTarget.style.color = "#aaaaaa")}
            onMouseLeave={e => (e.currentTarget.style.color = "#555566")}
          >
            <Settings className="w-[22px] h-[22px]" />
          </button>
        </div>

        {/* ── SIDEBAR ────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {sidebarOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 240, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className="flex flex-col flex-shrink-0 overflow-hidden"
              style={{ background: "#0e0e1a", borderRight: "1px solid #1e1e3a", minWidth: 0 }}
            >
              {/* Sidebar title bar */}
              <div
                className="flex items-center justify-between px-3 flex-shrink-0"
                style={{ height: "35px", borderBottom: "1px solid #1e1e3a" }}
              >
                <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#bbbbbb" }}>
                  {activeView === "explorer" ? "Explorer" : activeView === "agents" ? "Agents" : "Search"}
                </span>
                <button
                  onClick={() => setSidebarOpen(false)}
                  className="transition-colors p-0.5"
                  style={{ color: "#555566" }}
                  onMouseEnter={e => (e.currentTarget.style.color = "#cccccc")}
                  onMouseLeave={e => (e.currentTarget.style.color = "#555566")}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* ── EXPLORER ── */}
              {activeView === "explorer" && (
                <div className="flex-1 overflow-y-auto py-1">
                  {/* Root label */}
                  <div className="flex items-center gap-1 px-3 py-1 cursor-default select-none">
                    <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: "#888899" }} />
                    <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#dcb67a" }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wider truncate" style={{ color: "#cccccc" }}>
                      dsa-curriculum
                    </span>
                  </div>

                  {TOPICS_SIDEBAR.map(cat => (
                    <div key={cat.category}>
                      <button
                        onClick={() => setExpandedCategory(expandedCategory === cat.category ? null : cat.category)}
                        className="w-full flex items-center gap-1 pl-4 pr-2 py-[3px] transition-colors select-none"
                        style={{ color: "#9d9daa" }}
                        onMouseEnter={e => (e.currentTarget.style.background = "#2a2d2e")}
                        onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
                      >
                        <ChevronRight
                          className="w-3 h-3 flex-shrink-0 transition-transform duration-100"
                          style={{ transform: expandedCategory === cat.category ? "rotate(90deg)" : "rotate(0deg)" }}
                        />
                        {expandedCategory === cat.category
                          ? <FolderOpen className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#dcb67a" }} />
                          : <Folder className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "#dcb67a" }} />
                        }
                        <span className="text-[11px] truncate">{cat.category}</span>
                      </button>

                      {expandedCategory === cat.category && cat.items.map(item => {
                        const isActive = activeTopic === item;
                        return (
                          <button
                            key={item}
                            onClick={() => setActiveTopic(item)}
                            className="w-full flex items-center gap-2 pl-9 pr-2 py-[3px] text-left transition-colors"
                            style={isActive
                              ? { background: "#094771", color: "#ffffff" }
                              : { color: "#8b8b9d" }
                            }
                            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#2a2d2e"; }}
                            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                          >
                            <FileCode
                              className="w-3.5 h-3.5 flex-shrink-0"
                              style={{ color: isActive ? "#75beff" : "#8b5cf6" }}
                            />
                            <span className="text-[11px] truncate">
                              {item.toLowerCase().replace(/ \//g, "").replace(/ /g, "-")}.dsa
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ))}
                </div>
              )}

              {/* ── AGENTS ── */}
              {activeView === "agents" && (
                <div className="flex-1 overflow-y-auto p-2">
                  <div className="text-[10px] uppercase tracking-widest px-2 py-1 mb-1" style={{ color: "#666677" }}>
                    Active Agents
                  </div>
                  {AGENTS.map(a => {
                    const isActive = selectedAgent === a.id;
                    return (
                      <button
                        key={a.id}
                        onClick={() => setSelectedAgent(a.id)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded text-left transition-all mb-0.5"
                        style={isActive
                          ? { background: `${a.color}18`, border: `1px solid ${a.color}35`, color: a.color }
                          : { color: "#888899", border: "1px solid transparent" }
                        }
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#2a2d2e"; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                      >
                        <a.icon className="w-4 h-4 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-[11px] font-medium">{a.label}</div>
                          <div className="text-[10px] opacity-60 mt-0.5 truncate">{a.desc}</div>
                        </div>
                        {isActive && (
                          <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: a.color }} />
                        )}
                      </button>
                    );
                  })}
                </div>
              )}

              {/* ── SEARCH ── */}
              {activeView === "search" && (
                <div className="flex-1 p-3">
                  <div
                    className="rounded flex items-center gap-2 px-2 py-1.5"
                    style={{ background: "#1a1a2e", border: "1px solid #3c3c3c" }}
                  >
                    <Search className="w-3.5 h-3.5" style={{ color: "#666677" }} />
                    <input
                      className="flex-1 bg-transparent text-[12px] outline-none placeholder-gray-600"
                      placeholder="Search topics..."
                      style={{ color: "#cccccc", fontFamily: "inherit" }}
                    />
                  </div>
                  <p className="text-[10px] text-center mt-4" style={{ color: "#555566" }}>
                    Search across all DSA topics
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── EDITOR AREA ──────────────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* TAB BAR */}
          <div
            className="flex items-end overflow-x-auto flex-shrink-0"
            style={{ height: "35px", background: "#0a0a14", borderBottom: "1px solid #1e1e3a" }}
          >
            {AGENTS.map(agent => {
              const isActive = selectedAgent === agent.id;
              return (
                <button
                  key={agent.id}
                  onClick={() => setSelectedAgent(agent.id)}
                  className="h-full flex items-center gap-2 px-4 text-[12px] whitespace-nowrap flex-shrink-0 relative group transition-colors"
                  style={isActive
                    ? { background: "#080810", color: "#cccccc", borderRight: "1px solid #1e1e3a" }
                    : { background: "#0a0a14", color: "#777788", borderRight: "1px solid #1e1e3a" }
                  }
                >
                  {isActive && (
                    <div
                      className="absolute top-0 left-0 right-0"
                      style={{ height: "1px", background: agent.color }}
                    />
                  )}
                  <agent.icon className="w-3.5 h-3.5" style={{ color: agent.color }} />
                  <span>{agent.label.toLowerCase()}.dsa</span>
                  <span
                    className="ml-1 text-[10px] transition-colors"
                    style={{ color: isActive ? "#666677" : "transparent" }}
                  >
                    ×
                  </span>
                </button>
              );
            })}
            <button
              className="h-full px-3 flex-shrink-0 transition-colors"
              style={{ color: "#555566" }}
              onMouseEnter={e => { e.currentTarget.style.color = "#aaaaaa"; e.currentTarget.style.background = "#ffffff10"; }}
              onMouseLeave={e => { e.currentTarget.style.color = "#555566"; e.currentTarget.style.background = "transparent"; }}
            >
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* BREADCRUMB */}
          <div
            className="h-7 flex items-center px-4 text-[11px] flex-shrink-0 select-none"
            style={{ background: "#080810", borderBottom: "1px solid #1e1e3a", color: "#777788" }}
          >
            <span className="flex items-center gap-1 hover:text-gray-300 cursor-pointer transition-colors">
              <BookOpen className="w-3 h-3" />
              DSA
            </span>
            <ChevronRight className="w-3 h-3 mx-1.5" style={{ color: "#444455" }} />
            <span className="hover:text-gray-300 cursor-pointer transition-colors">{activeCategory}</span>
            <ChevronRight className="w-3 h-3 mx-1.5" style={{ color: "#444455" }} />
            <span className="flex items-center gap-1 cursor-pointer" style={{ color: currentAgent.color }}>
              <FileCode className="w-3 h-3" />
              {activeTopic}
            </span>
          </div>

          {/* MESSAGES */}
          <div
            className="flex-1 overflow-y-auto flex flex-col gap-3 py-4"
            style={{ background: "#080810" }}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); }}
          >
            {dragOver && (
              <div
                className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
                style={{ background: "rgba(8,8,16,0.88)", backdropFilter: "blur(6px)" }}
              >
                <div className="rounded p-8 text-center" style={{ border: "2px dashed #f59e0b" }}>
                  <FileText className="w-12 h-12 mx-auto mb-3" style={{ color: "#f59e0b" }} />
                  <p className="text-base font-semibold text-white" style={{ fontFamily: "Inter, sans-serif" }}>
                    Drop your file here
                  </p>
                  <p className="text-sm text-gray-400 mt-1" style={{ fontFamily: "Inter, sans-serif" }}>
                    PDF, image, or document
                  </p>
                </div>
              </div>
            )}

            {/* Quick prompts (first load) */}
            {messages.length === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="px-4"
              >
                <p className="text-[10px] uppercase tracking-widest mb-2 font-mono" style={{ color: "#555566" }}>
                  // Quick Start
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_PROMPTS.map((p, i) => (
                    <button
                      key={i}
                      onClick={() => { setInput(p); inputRef.current?.focus(); }}
                      className="px-3 py-1 text-[11px] rounded font-mono transition-all"
                      style={{ background: "#0d0d1a", border: "1px solid #1e1e3a", color: "#777788" }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "#f59e0b50";
                        e.currentTarget.style.color = "#cccccc";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "#1e1e3a";
                        e.currentTarget.style.color = "#777788";
                      }}
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Messages */}
            {messages.map(msg => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 px-4 items-start ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
              >
                {/* Avatar */}
                <div className="flex-shrink-0 mt-0.5">
                  {msg.role === "ai" ? (
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center"
                      style={{ background: `${msg.agentColor ?? "#f59e0b"}20`, border: `1px solid ${msg.agentColor ?? "#f59e0b"}40` }}
                    >
                      <Bot className="w-3.5 h-3.5" style={{ color: msg.agentColor ?? "#f59e0b" }} />
                    </div>
                  ) : (
                    <div
                      className="w-7 h-7 rounded flex items-center justify-center"
                      style={{ background: "#1e1e3a", border: "1px solid #f59e0b40" }}
                    >
                      <User className="w-3.5 h-3.5" style={{ color: "#f59e0b" }} />
                    </div>
                  )}
                </div>

                {/* Bubble */}
                <div className={`flex flex-col gap-1 max-w-[80%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                  {msg.role === "ai" && msg.agent && (
                    <span className="text-[10px] font-semibold uppercase tracking-wider font-mono" style={{ color: msg.agentColor }}>
                      {msg.agent} Agent
                    </span>
                  )}
                  <div
                    className="rounded px-3 py-2.5 text-[13px] leading-relaxed select-text"
                    style={{
                      fontFamily: "Inter, sans-serif",
                      ...(msg.role === "ai"
                        ? { background: "#0d1628", border: "1px solid rgba(6,182,212,0.12)" }
                        : { background: "#1a1a2e", border: "1px solid rgba(245,158,11,0.18)" }
                      ),
                    }}
                  >
                    {renderContent(msg.content)}
                    {msg.codeBlock && <CodeBlock code={msg.codeBlock} />}
                  </div>
                  {msg.role === "ai" && (
                    <div className="flex items-center gap-2 px-1">
                      {[ThumbsUp, ThumbsDown, Volume2, RefreshCw].map((Icon, i) => (
                        <button key={i} className="transition-colors" style={{ color: "#444455" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#888899")}
                          onMouseLeave={e => (e.currentTarget.style.color = "#444455")}
                        >
                          <Icon className="w-3 h-3" />
                        </button>
                      ))}
                      <span className="text-[10px] font-mono" style={{ color: "#444455" }}>{msg.timestamp}</span>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}

            {isTyping && <TypingIndicator agentColor={currentAgent.color} />}
            <div ref={chatEndRef} />
          </div>

          {/* INPUT BAR */}
          <div
            className="flex-shrink-0 px-3 py-2"
            style={{ background: "#0e0e1a", borderTop: "1px solid #1e1e3a" }}
          >
            {/* Status hint */}
            <div className="flex items-center gap-2 mb-1.5 text-[11px] font-mono select-none" style={{ color: "#555566" }}>
              <span style={{ color: currentAgent.color }}>▶ {currentAgent.label} Mode</span>
              <span style={{ color: "#333344" }}>·</span>
              <span style={{ color: "#888899" }}>{activeTopic}</span>
              <span style={{ color: "#333344" }}>·</span>
              <span>⏎ send&nbsp;&nbsp;⇧⏎ newline</span>
            </div>

            <div className="flex items-end gap-1.5">
              {/* Attachments */}
              <div className="flex gap-0.5 flex-shrink-0 pb-1">
                {[
                  { Icon: Paperclip, title: "Attach file",  hover: "#f59e0b" },
                  { Icon: ImageIcon, title: "Upload image", hover: "#8b5cf6" },
                  { Icon: FileText,  title: "Upload PDF",   hover: "#06b6d4" },
                ].map(({ Icon, title, hover }, i) => (
                  <button
                    key={i}
                    title={title}
                    className="p-1.5 rounded transition-all"
                    style={{ color: "#555566" }}
                    onMouseEnter={e => { e.currentTarget.style.color = hover; e.currentTarget.style.background = `${hover}18`; }}
                    onMouseLeave={e => { e.currentTarget.style.color = "#555566"; e.currentTarget.style.background = "transparent"; }}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              {/* Textarea */}
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask ${currentAgent.label} Agent about ${activeTopic}...`}
                rows={1}
                className="flex-1 rounded px-3 py-2 text-[13px] outline-none resize-none transition-all"
                style={{
                  background: "#0d0d1a",
                  border: "1px solid #1e1e3a",
                  color: "#cccccc",
                  fontFamily: "'JetBrains Mono', monospace",
                  minHeight: "36px",
                  maxHeight: "120px",
                }}
                onFocus={e => { e.currentTarget.style.borderColor = `${currentAgent.color}50`; }}
                onBlur={e => { e.currentTarget.style.borderColor = "#1e1e3a"; }}
                onInput={e => {
                  const t = e.currentTarget;
                  t.style.height = "auto";
                  t.style.height = Math.min(t.scrollHeight, 120) + "px";
                }}
              />

              {/* Mic */}
              <button
                title="Voice input"
                className="p-2 rounded flex-shrink-0 transition-all"
                style={{ color: "#555566" }}
                onMouseEnter={e => { e.currentTarget.style.color = "#f59e0b"; e.currentTarget.style.background = "#f59e0b12"; }}
                onMouseLeave={e => { e.currentTarget.style.color = "#555566"; e.currentTarget.style.background = "transparent"; }}
              >
                <Mic className="w-4 h-4" />
              </button>

              {/* Send */}
              <motion.button
                onClick={sendMessage}
                disabled={!input.trim() || isTyping}
                whileHover={input.trim() && !isTyping ? { scale: 1.05 } : {}}
                whileTap={input.trim() && !isTyping ? { scale: 0.95 } : {}}
                className="p-2 rounded flex-shrink-0 transition-all"
                style={
                  input.trim() && !isTyping
                    ? { background: "linear-gradient(135deg, #f59e0b, #d97706)", color: "#000000" }
                    : { background: "#13131f", color: "#444455", cursor: "not-allowed" }
                }
              >
                <Send className="w-4 h-4" />
              </motion.button>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL ──────────────────────────────────────────────────── */}
        <div
          className="hidden xl:flex w-60 flex-col flex-shrink-0 overflow-hidden"
          style={{ background: "#0e0e1a", borderLeft: "1px solid #1e1e3a" }}
        >
          {/* Panel header */}
          <div
            className="flex items-center justify-between px-3 flex-shrink-0"
            style={{ height: "35px", borderBottom: "1px solid #1e1e3a" }}
          >
            <span className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: "#888899" }}>
              Outline
            </span>
            <Brain className="w-3.5 h-3.5" style={{ color: "#555566" }} />
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Concept Summary */}
            <div style={{ borderBottom: "1px solid #1e1e3a" }}>
              <div className="flex items-center gap-1 px-3 py-2 select-none cursor-default">
                <ChevronDown className="w-3 h-3" style={{ color: "#555566" }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#888899" }}>
                  Concept Summary
                </span>
              </div>
              <div className="px-4 pb-3 flex flex-col gap-1.5">
                {["Node structure", "Head pointer", "Traversal", "Insertion", "Deletion"].map((c, i) => (
                  <div key={i} className="flex items-center gap-2 text-[11px] transition-colors cursor-pointer" style={{ color: "#888899" }}
                    onMouseEnter={e => (e.currentTarget.style.color = "#cccccc")}
                    onMouseLeave={e => (e.currentTarget.style.color = "#888899")}
                  >
                    <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: currentAgent.color }} />
                    {c}
                  </div>
                ))}
              </div>
            </div>

            {/* Complexity */}
            <div style={{ borderBottom: "1px solid #1e1e3a" }}>
              <div className="flex items-center gap-1 px-3 py-2 select-none cursor-default">
                <ChevronDown className="w-3 h-3" style={{ color: "#555566" }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#888899" }}>
                  Complexity
                </span>
              </div>
              <div className="px-3 pb-3 flex flex-col gap-1">
                {[
                  { op: "Access",       tc: "O(n)", sc: "O(1)" },
                  { op: "Search",       tc: "O(n)", sc: "O(1)" },
                  { op: "Insert (head)", tc: "O(1)", sc: "O(1)" },
                  { op: "Insert (tail)", tc: "O(n)", sc: "O(1)" },
                  { op: "Delete",       tc: "O(n)", sc: "O(1)" },
                ].map((row, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-[10px]" style={{ color: "#666677" }}>{row.op}</span>
                    <div className="flex gap-2">
                      <span className="text-[10px] font-mono" style={{ color: "#f59e0b" }}>{row.tc}</span>
                      <span className="text-[10px] font-mono" style={{ color: "#8b5cf6" }}>{row.sc}</span>
                    </div>
                  </div>
                ))}
                <div className="flex gap-3 mt-1 pt-1" style={{ borderTop: "1px solid #1e1e3a" }}>
                  <span className="text-[9px] flex items-center gap-1" style={{ color: "#555566" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: "#f59e0b", display: "inline-block" }} />
                    Time
                  </span>
                  <span className="text-[9px] flex items-center gap-1" style={{ color: "#555566" }}>
                    <span className="w-2 h-2 rounded-full" style={{ background: "#8b5cf6", display: "inline-block" }} />
                    Space
                  </span>
                </div>
              </div>
            </div>

            {/* Code Skeleton */}
            <div style={{ borderBottom: "1px solid #1e1e3a" }}>
              <div className="flex items-center gap-1 px-3 py-2 select-none cursor-default">
                <ChevronDown className="w-3 h-3" style={{ color: "#555566" }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#888899" }}>
                  Code Skeleton
                </span>
              </div>
              <div className="px-3 pb-3">
                <pre
                  className="text-[10px] font-mono leading-relaxed p-2 rounded overflow-x-auto"
                  style={{ background: "#0d0d1a", border: "1px solid #1e1e3a", color: "#aaaaaa" }}
                >{`class Node:
  def __init__(self, data):
    self.data = data
    self.next = None

class LinkedList:
  def __init__(self):
    self.head = None`}</pre>
              </div>
            </div>

            {/* Pro Tip */}
            <div>
              <div className="flex items-center gap-1 px-3 py-2 select-none cursor-default">
                <ChevronDown className="w-3 h-3" style={{ color: "#555566" }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#888899" }}>
                  Pro Tip
                </span>
              </div>
              <div className="px-3 pb-3">
                <div
                  className="p-2 rounded text-[10px] leading-relaxed"
                  style={{ background: "#f59e0b08", border: "1px solid #f59e0b25", color: "#888899" }}
                >
                  <div className="flex items-center gap-1 mb-1.5">
                    <Lightbulb className="w-3 h-3" style={{ color: "#f59e0b" }} />
                    <span className="font-semibold" style={{ color: "#f59e0b" }}>Tip</span>
                  </div>
                  Draw the linked list on paper while coding. Visualizing pointer changes prevents bugs.
                </div>
              </div>
            </div>

            {/* Active Agents quick-switch */}
            <div>
              <div className="flex items-center gap-1 px-3 py-2 select-none cursor-default">
                <ChevronDown className="w-3 h-3" style={{ color: "#555566" }} />
                <span className="text-[10px] uppercase tracking-widest font-semibold" style={{ color: "#888899" }}>
                  Switch Agent
                </span>
              </div>
              <div className="px-3 pb-3 flex flex-col gap-1">
                {AGENTS.map(a => {
                  const isActive = selectedAgent === a.id;
                  return (
                    <button
                      key={a.id}
                      onClick={() => setSelectedAgent(a.id)}
                      className="flex items-center gap-2 px-2 py-1.5 rounded text-left transition-all text-[11px]"
                      style={isActive
                        ? { background: `${a.color}18`, color: a.color }
                        : { color: "#666677" }
                      }
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "#2a2d2e"; e.currentTarget.style.color = "#aaaaaa"; }}}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#666677"; }}}
                    >
                      <a.icon className="w-3.5 h-3.5 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium">{a.label}</div>
                        <div className="text-[9px] opacity-60 truncate">{a.desc}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATUS BAR ───────────────────────────────────────────────────── */}
      <div
        className="h-6 flex items-center text-[11px] flex-shrink-0 overflow-hidden select-none"
        style={{ background: "#0d0d1a", borderTop: "1px solid #1e1e3a", color: "#888899" }}
      >
        {/* Left */}
        <div className="flex items-center h-full">
          <div
            className="flex items-center gap-1.5 px-3 h-full cursor-pointer transition-colors"
            style={{ background: `${currentAgent.color}22`, color: currentAgent.color }}
            onMouseEnter={e => (e.currentTarget.style.background = `${currentAgent.color}35`)}
            onMouseLeave={e => (e.currentTarget.style.background = `${currentAgent.color}22`)}
          >
            <currentAgent.icon className="w-3 h-3" />
            <span>{currentAgent.label} Agent</span>
          </div>

          <button
            className="flex items-center gap-1.5 px-3 h-full transition-colors"
            style={{ color: "#888899" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#ffffff10")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <Zap className="w-3 h-3" />
            {activeTopic}
          </button>

          <button
            className="flex items-center gap-1.5 px-3 h-full transition-colors"
            style={{ color: "#10b981" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#ffffff10")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse" />
            Online
          </button>
        </div>

        {/* Right */}
        <div className="flex items-center h-full ml-auto">
          {["Python", "UTF-8"].map(label => (
            <button
              key={label}
              className="px-3 h-full flex items-center transition-colors"
              style={{ color: "#888899" }}
              onMouseEnter={e => (e.currentTarget.style.background = "#ffffff10")}
              onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
            >
              {label}
            </button>
          ))}
          <button
            className="px-3 h-full flex items-center transition-colors"
            style={{ color: "#f59e0b90" }}
            onMouseEnter={e => (e.currentTarget.style.background = "#ffffff10")}
            onMouseLeave={e => (e.currentTarget.style.background = "transparent")}
          >
            DSA Tutor AI
          </button>
        </div>
      </div>
    </div>
  );
}
