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
  Play, Terminal, Trash2, Loader2, Palette, Timer, Gauge,
} from "lucide-react";
import { awardDaily } from "@/lib/dsr";

// ─── Data ────────────────────────────────────────────────────────────────────

const TOPICS_SIDEBAR = [
  { category: "Fundamentals",      color: "#f59e0b", items: ["Arrays", "Strings", "Basic Recursion", "Advanced Recursion", "Bit Manipulation"] },
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

// ─── Compiler playground ──────────────────────────────────────────────────────
type TermLine = { type: "cmd" | "out" | "err" | "sys"; text: string };
type PlayFile = { id: string; name: string; lang: string; content: string };

const TERM_THEMES = [
  { id: "midnight", label: "Midnight", bg: "#0d1117", border: "#21262d", inputBg: "#161b22", cmd: "#f2cc60", out: "#e6edf3", err: "#ff7b72", sys: "#8b949e", ok: "#3fb950" },
  { id: "dracula",  label: "Dracula",  bg: "#282a36", border: "#44475a", inputBg: "#1e1f29", cmd: "#ffb86c", out: "#f8f8f2", err: "#ff5555", sys: "#6272a4", ok: "#50fa7b" },
  { id: "paper",    label: "Paper",    bg: "#fffdf5", border: "#e8e4d5", inputBg: "#f5f2e8", cmd: "#b45309", out: "#1f2937", err: "#dc2626", sys: "#6b7280", ok: "#047857" },
  { id: "matrix",   label: "Matrix",   bg: "#010b01", border: "#0c2b0c", inputBg: "#041704", cmd: "#facc15", out: "#22c55e", err: "#f87171", sys: "#15803d", ok: "#4ade80" },
];

const LANGS = [
  {
    id: "cpp", file: "main.cpp", label: "C++", wb: "C++", fallback: "gcc-13.2.0", exts: [".cpp", ".cc", ".cxx"], color: "#659ad2",
    runCmd: (f: string) => `g++ ${f} -o main && ./main`,
    code: `#include <bits/stdc++.h>
using namespace std;

// DSARunway — Binary Search playground
int binarySearch(vector<int>& a, int target) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == target) return mid;
        if (a[mid] < target) lo = mid + 1;
        else hi = mid - 1;
    }
    return -1;
}

int main() {
    vector<int> arr = {2, 5, 8, 12, 16, 23, 38, 56, 72, 91};
    cout << "Index of 23 -> " << binarySearch(arr, 23) << endl;
    return 0;
}`,
  },
  {
    id: "python", file: "main.py", label: "Python", wb: "Python", fallback: "cpython-3.14.0", exts: [".py"], color: "#ffd343",
    runCmd: (f: string) => `python3 ${f}`,
    code: `# DSARunway — Linked List playground
class Node:
    def __init__(self, data):
        self.data, self.next = data, None

def traverse(head):
    out = []
    while head:
        out.append(str(head.data))
        head = head.next
    return " -> ".join(out) + " -> None"

head = Node(12)
head.next = Node(8)
head.next.next = Node(23)
print(traverse(head))`,
  },
  {
    id: "java", file: "Main.java", label: "Java", wb: "Java", fallback: "openjdk-jdk-22+36", exts: [".java"], color: "#f89820",
    runCmd: (f: string) => `javac ${f} && java Main`,
    code: `// DSARunway — Stack playground
import java.util.*;

public class Main {
    public static void main(String[] args) {
        Deque<Integer> stack = new ArrayDeque<>();
        for (int x : new int[]{1, 2, 3, 4, 5}) stack.push(x);
        System.out.print("Popping: ");
        while (!stack.isEmpty()) System.out.print(stack.pop() + " ");
        System.out.println();
    }
}`,
  },
  {
    id: "javascript", file: "main.js", label: "JavaScript", wb: "JavaScript", fallback: "nodejs-20.17.0", exts: [".js", ".mjs"], color: "#f7df1e",
    runCmd: (f: string) => `node ${f}`,
    code: `// DSARunway — Two Sum playground
function twoSum(nums, target) {
  const seen = new Map();
  for (let i = 0; i < nums.length; i++) {
    const need = target - nums[i];
    if (seen.has(need)) return [seen.get(need), i];
    seen.set(nums[i], i);
  }
  return [];
}

console.log("twoSum([2,7,11,15], 9) ->", twoSum([2, 7, 11, 15], 9));`,
  },
];

const DEFAULT_FILES: PlayFile[] = LANGS.map(l => ({ id: `seed-${l.id}`, name: l.file, lang: l.id, content: l.code }));

const langForFilename = (name: string) => LANGS.find(l => l.exts.some(e => name.toLowerCase().endsWith(e)));

// Persistence layer — localStorage today; swap these two for the S3-backed API later.
const PLAYGROUND_KEY = "dsr-playground-v1";
function loadPlayground(): { files: PlayFile[]; openIds: string[]; activeId: string } | null {
  try {
    const raw = localStorage.getItem(PLAYGROUND_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw);
    if (!Array.isArray(d.files) || d.files.length === 0) return null;
    return d;
  } catch { return null; }
}
function savePlayground(data: { files: PlayFile[]; openIds: string[]; activeId: string }) {
  try { localStorage.setItem(PLAYGROUND_KEY, JSON.stringify(data)); } catch {}
}

// ─── Syntax highlighting (VS Code-style palette, zero deps) ───────────────────
const HL_PALETTE = {
  dark:  { kw: "#c586c0", type: "#569cd6", str: "#ce9178", com: "#6a9955", num: "#b5cea8", fn: "#dcdcaa", cls: "#4ec9b0", def: "#d4d4d4" },
  light: { kw: "#af00db", type: "#0000ff", str: "#a31515", com: "#008000", num: "#098658", fn: "#795e26", cls: "#267f99", def: "#1f2328" },
};

const HL_LANGS: Record<string, { pattern: string; flags: string; kw: Set<string>; type: Set<string> }> = {
  cpp: {
    pattern: String.raw`(?<com>\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?<pre>#\w+)|(?<str>"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(?<num>\b\d[\w.]*\b)|(?<id>[A-Za-z_]\w*)`,
    flags: "g",
    kw: new Set(["if", "else", "for", "while", "do", "return", "break", "continue", "switch", "case", "default", "new", "delete", "try", "catch", "throw", "using", "namespace", "template", "typename", "class", "struct", "public", "private", "protected", "const", "static", "constexpr", "inline", "virtual", "override", "operator", "sizeof", "this", "enum", "typedef", "friend", "union", "goto"]),
    type: new Set(["int", "long", "short", "char", "bool", "float", "double", "void", "unsigned", "signed", "auto", "size_t", "true", "false", "nullptr", "vector", "string", "map", "set", "pair", "queue", "stack", "deque", "unordered_map", "unordered_set", "endl", "cout", "cin", "std"]),
  },
  python: {
    pattern: String.raw`(?<com>#[^\n]*)|(?<str>"""[\s\S]*?"""|'''[\s\S]*?'''|"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(?<num>\b\d[\w.]*\b)|(?<id>[A-Za-z_]\w*)`,
    flags: "g",
    kw: new Set(["def", "return", "if", "elif", "else", "for", "while", "break", "continue", "import", "from", "as", "class", "try", "except", "finally", "raise", "with", "lambda", "pass", "yield", "global", "nonlocal", "assert", "del", "in", "not", "and", "or", "is", "async", "await"]),
    type: new Set(["True", "False", "None", "self", "int", "str", "float", "list", "dict", "set", "tuple", "bool", "print", "len", "range", "enumerate", "zip", "map", "filter", "sorted", "input", "join", "append"]),
  },
  java: {
    pattern: String.raw`(?<com>\/\/[^\n]*|\/\*[\s\S]*?\*\/)|(?<str>"(?:[^"\\\n]|\\.)*"|'(?:[^'\\\n]|\\.)*')|(?<num>\b\d[\w.]*\b)|(?<id>[A-Za-z_]\w*)`,
    flags: "g",
    kw: new Set(["public", "private", "protected", "class", "interface", "extends", "implements", "static", "final", "void", "new", "return", "if", "else", "for", "while", "do", "break", "continue", "switch", "case", "default", "try", "catch", "finally", "throw", "throws", "import", "package", "this", "super", "abstract", "synchronized", "instanceof", "enum"]),
    type: new Set(["int", "long", "short", "char", "boolean", "float", "double", "byte", "String", "true", "false", "null", "var"]),
  },
  javascript: {
    pattern: "(?<com>\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)|(?<str>`(?:[^`\\\\]|\\\\.)*`|\"(?:[^\"\\\\\\n]|\\\\.)*\"|'(?:[^'\\\\\\n]|\\\\.)*')|(?<num>\\b\\d[\\w.]*\\b)|(?<id>[A-Za-z_$][\\w$]*)",
    flags: "g",
    kw: new Set(["const", "let", "var", "function", "return", "if", "else", "for", "while", "do", "break", "continue", "switch", "case", "default", "new", "delete", "try", "catch", "finally", "throw", "class", "extends", "super", "import", "export", "from", "this", "typeof", "instanceof", "in", "of", "async", "await", "yield", "static", "get", "set"]),
    type: new Set(["true", "false", "null", "undefined", "console", "Math", "JSON", "Map", "Set", "Array", "Object", "String", "Number", "Boolean", "Promise", "window", "document"]),
  },
};

function highlightCode(code: string, langId: string, isDark: boolean): React.ReactNode[] {
  const P = isDark ? HL_PALETTE.dark : HL_PALETTE.light;
  const cfg = HL_LANGS[langId] ?? HL_LANGS.javascript;
  const rx = new RegExp(cfg.pattern, cfg.flags);
  const out: React.ReactNode[] = [];
  let last = 0, key = 0;
  let m: RegExpExecArray | null;
  while ((m = rx.exec(code))) {
    if (m.index > last) out.push(<span key={key++}>{code.slice(last, m.index)}</span>);
    const tok = m[0];
    const g = m.groups ?? {};
    let color = P.def;
    if (g.com !== undefined) color = P.com;
    else if (g.pre !== undefined) color = P.kw;
    else if (g.str !== undefined) color = P.str;
    else if (g.num !== undefined) color = P.num;
    else if (g.id !== undefined) {
      if (cfg.kw.has(tok)) color = P.kw;
      else if (cfg.type.has(tok)) color = P.type;
      else {
        let j = rx.lastIndex;
        while (j < code.length && code[j] === " ") j++;
        if (code[j] === "(") color = P.fn;
        else if (/^[A-Z]/.test(tok)) color = P.cls;
      }
    }
    out.push(<span key={key++} style={{ color }}>{tok}</span>);
    last = rx.lastIndex;
  }
  if (last < code.length) out.push(<span key={key++}>{code.slice(last)}</span>);
  return out;
}

// ─── Static complexity estimator (LeetCode-style hints, heuristic) ────────────
function estimateComplexity(code: string): { time: string; space: string; hints: string[] } {
  const src = code.replace(/\/\/[^\n]*|#[^\n]*|\/\*[\s\S]*?\*\//g, "").replace(/"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'/g, '""');
  const hints: string[] = [];

  // max loop nesting via indentation (works for formatted C-like + Python)
  const stack: number[] = [];
  let nesting = 0;
  for (const raw of src.split("\n")) {
    const line = raw.replace(/\t/g, "    ");
    const t = line.trim();
    if (!t) continue;
    const indent = line.length - line.trimStart().length;
    while (stack.length && indent <= stack[stack.length - 1]) stack.pop();
    if (/(^|[^\w])(for|while)\s*[({ :]/.test(t)) {
      stack.push(indent);
      nesting = Math.max(nesting, stack.length);
    }
  }

  // recursion: a function calling itself *within its own body*
  let recursion = false;
  // Python — body = indented block under def
  const lines = src.split("\n");
  for (let i = 0; i < lines.length && !recursion; i++) {
    const m = lines[i].match(/^(\s*)def\s+([A-Za-z_]\w*)/);
    if (!m) continue;
    const indent = m[1].replace(/\t/g, "    ").length;
    const callRe = new RegExp(`\\b${m[2]}\\s*\\(`);
    for (let j = i + 1; j < lines.length; j++) {
      const l = lines[j].replace(/\t/g, "    ");
      if (l.trim() && l.search(/\S/) <= indent) break;
      if (callRe.test(l)) { recursion = true; break; }
    }
  }
  // C-like / Java / JS — body = brace-matched block after the signature
  if (!recursion) {
    const defRe = /(?:int|long|void|bool|double|float|auto|static|public|private|function)[\w<>,\s*&]*?\s([A-Za-z_]\w*)\s*\([^;{}]*\)\s*\{/g;
    let dm: RegExpExecArray | null;
    while (!recursion && (dm = defRe.exec(src))) {
      const name = dm[1];
      if (name === "main") continue;
      let depth = 1, k = defRe.lastIndex;
      while (k < src.length && depth > 0) {
        if (src[k] === "{") depth++;
        else if (src[k] === "}") depth--;
        k++;
      }
      if (new RegExp(`\\b${name}\\s*\\(`).test(src.slice(defRe.lastIndex, k))) recursion = true;
    }
  }

  const usesSort = /\bsort\s*\(|\bsorted\s*\(|\.sort\s*\(/.test(src);
  const halving = /\/=?\s*2\b|>>=?\s*1\b|\/\/\s*2\b/.test(src);
  const allocatesLinear = /\bvector\s*<|\bnew\s+\w+\[|\blist\(|\bdict\(|\bset\(|= \[\]|= \{\}|new Array|ArrayDeque|ArrayList|HashMap|new Map|new Set/.test(src);

  let time: string;
  if (recursion) { time = "O(2ⁿ) worst-case"; hints.push("Recursion detected — actual bound depends on the recurrence"); }
  else if (nesting >= 3) time = "O(n³)";
  else if (nesting === 2) time = "O(n²)";
  else if (usesSort) { time = "O(n log n)"; hints.push("Sorting call dominates"); }
  else if (nesting === 1 && halving) { time = "O(log n)"; hints.push("Halving loop — logarithmic search"); }
  else if (nesting === 1) time = "O(n)";
  else time = "O(1)";
  if (nesting >= 2) hints.push(`${nesting} nested loops`);

  let space = "O(1)";
  if (allocatesLinear) { space = "O(n)"; hints.push("Linear auxiliary storage allocated"); }
  if (recursion) { space = space === "O(n)" ? "O(n)" : "O(n) stack"; hints.push("Recursive call stack"); }

  return { time, space, hints };
}

type LastRun = { fileName: string; langId: string; ms: number; exitCode: number; ok: boolean; stdout: string; errText: string };

// Language badge — crisp inline SVG monogram (svgrepo-style, zero network)
function LangIcon({ langId, size = 15 }: { langId: string; size?: number }) {
  const spec: Record<string, { bg: string; fg: string; text: string }> = {
    cpp:        { bg: "#00599C", fg: "#ffffff", text: "C++" },
    python:     { bg: "#3776AB", fg: "#FFD43B", text: "Py" },
    java:       { bg: "#E76F00", fg: "#ffffff", text: "Jv" },
    javascript: { bg: "#F7DF1E", fg: "#111111", text: "JS" },
  };
  const s = spec[langId] ?? { bg: "#64748b", fg: "#fff", text: "?" };
  return (
    <svg width={size} height={size} viewBox="0 0 16 16" style={{ flexShrink: 0, borderRadius: "3.5px" }} aria-hidden="true">
      <rect width="16" height="16" rx="3.5" fill={s.bg} />
      <text x="8" y="11.6" textAnchor="middle" fontSize={s.text.length > 2 ? 6.4 : 7.6} fontWeight="800" fill={s.fg} fontFamily="Inter, 'Segoe UI', sans-serif">{s.text}</text>
    </svg>
  );
}

const INITIAL_MESSAGES: Msg[] = [{
  id: 1, role: "ai",
  content: "Hello! I'm your DSARunway tutor. I use a Socratic approach — I'll guide you with questions rather than giving direct answers, helping you build genuine understanding.\n\nWhat topic would you like to explore today? You can also upload a document, image of your handwritten solution, or speak to me!",
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
  const [activeView, setActiveView] = useState("agents");

  // ── Compiler state — files persist to localStorage (S3-backed API later) ──
  const [files, setFiles] = useState<PlayFile[]>(DEFAULT_FILES);
  const [openIds, setOpenIds] = useState<string[]>(DEFAULT_FILES.map(f => f.id));
  const [activeId, setActiveId] = useState(DEFAULT_FILES[0].id);
  const [hydrated, setHydrated] = useState(false);
  const [newFileDraft, setNewFileDraft] = useState<string | null>(null);
  const [newFileError, setNewFileError] = useState(false);
  const [stdinValue, setStdinValue] = useState("");
  const [termLines, setTermLines] = useState<TermLine[]>([
    { type: "sys", text: "DSARunway Terminal — type 'help' for commands · Ctrl+⏎ runs the open file" },
  ]);
  const [running, setRunning] = useState(false);
  const [termThemeId, setTermThemeId] = useState("midnight");
  const [termInput, setTermInput] = useState("");
  const [termTab, setTermTab] = useState<"terminal" | "output" | "problems">("terminal");
  const [termHeight, setTermHeight] = useState(230);
  const [lastRun, setLastRun] = useState<LastRun | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const wbCompilersRef = useRef<Record<string, string> | null>(null);
  const termHistRef = useRef<string[]>([]);
  const termHistIdx = useRef(0);
  const termInputRef = useRef<HTMLInputElement>(null);
  const termEndRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const currentAgent = AGENTS.find(a => a.id === selectedAgent)!;
  const activeFile = files.find(f => f.id === activeId) ?? null;
  const currentLang = activeFile ? LANGS.find(l => l.id === activeFile.lang)! : LANGS[0];
  const termTheme = TERM_THEMES.find(t => t.id === termThemeId) ?? TERM_THEMES[0];
  const mode: "code" | "chat" = activeView === "code" ? "code" : "chat";
  const activeCategory = TOPICS_SIDEBAR.find(c => c.items.includes(activeTopic))?.category ?? "Topics";
  const activeCategoryColor = TOPICS_SIDEBAR.find(c => c.items.includes(activeTopic))?.color ?? "#f59e0b";

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);
  useEffect(() => { termEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [termLines, running]);

  // hydrate playground + terminal theme from localStorage
  useEffect(() => {
    const saved = loadPlayground();
    if (saved) {
      setFiles(saved.files);
      setOpenIds(saved.openIds?.filter(id => saved.files.some(f => f.id === id)) ?? []);
      setActiveId(saved.files.some(f => f.id === saved.activeId) ? saved.activeId : (saved.files[0]?.id ?? ""));
    }
    try { const t = localStorage.getItem("dsr-term-theme"); if (t && TERM_THEMES.some(x => x.id === t)) setTermThemeId(t); } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => { if (hydrated) savePlayground({ files, openIds, activeId }); }, [files, openIds, activeId, hydrated]);
  useEffect(() => { if (hydrated) try { localStorage.setItem("dsr-term-theme", termThemeId); } catch {} }, [termThemeId, hydrated]);

  // ── File ops ──
  const openFile = (id: string) => { setOpenIds(prev => prev.includes(id) ? prev : [...prev, id]); setActiveId(id); };
  const closeTab = (id: string) => {
    setOpenIds(prev => {
      const idx = prev.indexOf(id);
      const next = prev.filter(x => x !== id);
      if (activeId === id) setActiveId(next[Math.min(idx, next.length - 1)] ?? "");
      return next;
    });
  };
  const deleteFile = (id: string) => { setFiles(prev => prev.filter(f => f.id !== id)); closeTab(id); };
  const createFile = (rawName: string) => {
    const name = rawName.trim();
    const lang = name ? langForFilename(name) : undefined;
    if (!lang || files.some(f => f.name.toLowerCase() === name.toLowerCase())) { setNewFileError(true); return; }
    const comment = lang.id === "python" ? "#" : "//";
    const file: PlayFile = { id: `f-${Date.now()}`, name, lang: lang.id, content: `${comment} ${name} — DSARunway playground\n` };
    setFiles(prev => [...prev, file]);
    setNewFileDraft(null); setNewFileError(false);
    openFile(file.id);
  };

  const cycleTermTheme = () => {
    const i = TERM_THEMES.findIndex(t => t.id === termThemeId);
    setTermThemeId(TERM_THEMES[(i + 1) % TERM_THEMES.length].id);
  };

  // drag the panel's top edge to resize, like VS Code
  const startTermResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY, startH = termHeight;
    const move = (ev: MouseEvent) => setTermHeight(Math.min(560, Math.max(120, startH + (startY - ev.clientY))));
    const up = () => {
      document.removeEventListener("mousemove", move);
      document.removeEventListener("mouseup", up);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };
    document.addEventListener("mousemove", move);
    document.addEventListener("mouseup", up);
    document.body.style.cursor = "ns-resize";
    document.body.style.userSelect = "none";
  };

  // ── Interactive shell ──
  const runTermCommand = (raw: string) => {
    const line = raw.trim();
    setTermLines(prev => [...prev, { type: "cmd", text: `dsr@runway:~/playground$ ${raw}` }]);
    if (!line) return;
    termHistRef.current.push(raw);
    termHistIdx.current = termHistRef.current.length;
    const cmd = line.split(/\s+/)[0];
    const arg = line.slice(cmd.length).trim();
    const say = (type: TermLine["type"], text: string) => setTermLines(prev => [...prev, { type, text }]);
    switch (cmd) {
      case "help":
        say("out", [
          "run [file]        compile & run (defaults to the open file)",
          "g++ / gcc <file>  compile & run a C++ file",
          "python3 <file>    run a Python file        node <file>   run JavaScript",
          "javac <file>      compile & run Java       ./main        re-run open file",
          "ls · dir          list playground files    cat <file>    print a file",
          "touch <file>      create a new file        rm <file>     delete a file",
          "open <file>       open a file in the editor",
          "stdin [text]      set program input (\\n = newline) · stdin clear",
          "theme [name]      terminal theme (midnight, dracula, paper, matrix)",
          "clear · cls       clear the terminal       echo · pwd · whoami · date",
        ].join("\n"));
        break;
      case "clear":
      case "cls":
        setTermLines([]);
        break;
      case "ls":
      case "dir":
        say("out", files.map(f => f.name).join("   ") || "(empty)");
        break;
      case "g++":
      case "gcc":
      case "python":
      case "python3":
      case "py":
      case "java":
      case "javac":
      case "node": {
        const fname = arg.split(/\s+/).find(a => langForFilename(a));
        const f = fname ? files.find(x => x.name.toLowerCase() === fname.toLowerCase()) : (activeFile ?? undefined);
        if (!f) { say("err", `${cmd}: no input file — try '${cmd} ${files[0]?.name ?? "main.cpp"}'`); break; }
        openFile(f.id);
        runCode(f);
        break;
      }
      case "./main":
      case "./a.out": {
        if (activeFile) runCode(); else say("err", `bash: ${cmd}: no file open to run`);
        break;
      }
      case "touch": {
        if (!arg) { say("err", "touch: missing file name — e.g. touch two-sum.py"); break; }
        if (files.some(f => f.name.toLowerCase() === arg.toLowerCase())) { say("sys", `${arg} already exists`); break; }
        const lang = langForFilename(arg);
        if (!lang) { say("err", `touch: ${arg}: use a .cpp / .py / .java / .js extension`); break; }
        createFile(arg);
        say("sys", `created ${arg} and opened it in the editor`);
        break;
      }
      case "rm": {
        const f = files.find(x => x.name === arg);
        if (f) { deleteFile(f.id); say("sys", `removed ${f.name}`); }
        else say("err", `rm: ${arg || "<file>"}: No such file`);
        break;
      }
      case "cat": {
        const f = files.find(x => x.name === arg);
        if (f) say("out", f.content); else say("err", `cat: ${arg || "<file>"}: No such file`);
        break;
      }
      case "open": {
        const f = files.find(x => x.name === arg);
        if (f) { openFile(f.id); say("sys", `opened ${f.name} in the editor`); }
        else say("err", `open: ${arg || "<file>"}: No such file`);
        break;
      }
      case "run": {
        if (!arg) { runCode(); break; }
        const f = files.find(x => x.name === arg);
        if (f) { openFile(f.id); runCode(f); } else say("err", `run: ${arg}: No such file`);
        break;
      }
      case "stdin": {
        if (!arg) say("sys", stdinValue ? `stdin = ${JSON.stringify(stdinValue)}` : "stdin is empty — usage: stdin <text>  (\\n for newline)");
        else if (arg === "clear") { setStdinValue(""); say("sys", "stdin cleared"); }
        else { const v = arg.replace(/\\n/g, "\n"); setStdinValue(v); say("sys", `stdin set — ${v.split("\n").length} line(s) will be piped to your program on run`); }
        break;
      }
      case "theme": {
        if (!arg) { cycleTermTheme(); break; }
        const t = TERM_THEMES.find(x => x.id === arg.toLowerCase() || x.label.toLowerCase() === arg.toLowerCase());
        if (t) { setTermThemeId(t.id); say("sys", `theme → ${t.label}`); }
        else say("err", `theme: ${arg}: not found — try ${TERM_THEMES.map(x => x.id).join(", ")}`);
        break;
      }
      case "echo":
        say("out", arg);
        break;
      case "pwd":
        say("out", "/home/dsr/playground");
        break;
      case "whoami":
        say("out", "dsr-learner");
        break;
      case "date":
        say("out", new Date().toString());
        break;
      default:
        say("err", `${cmd}: command not found — type 'help'`);
    }
  };

  // ── VS Code-style editing: auto-close pairs, type-over, smart indent, smart backspace ──
  const handleEditorKey = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!activeFile) return;
    const PAIRS: Record<string, string> = { "(": ")", "[": "]", "{": "}", '"': '"', "'": "'", "`": "`" };
    const CLOSERS = new Set([")", "]", "}"]);
    const t = e.currentTarget;
    const s = t.selectionStart, en = t.selectionEnd;
    const val = t.value;
    const apply = (v: string, caretStart: number, caretEnd?: number) => {
      setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: v } : f));
      requestAnimationFrame(() => { t.selectionStart = caretStart; t.selectionEnd = caretEnd ?? caretStart; });
    };

    if (e.key === "Tab") {
      e.preventDefault();
      if (e.shiftKey) {
        // outdent the current line by one level
        const lineStart = val.lastIndexOf("\n", s - 1) + 1;
        const m = val.slice(lineStart).match(/^ {1,4}/);
        if (m) apply(val.slice(0, lineStart) + val.slice(lineStart + m[0].length), Math.max(lineStart, s - m[0].length));
        return;
      }
      apply(val.slice(0, s) + "    " + val.slice(en), s + 4);
      return;
    }

    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") { e.preventDefault(); runCode(); return; }

    if (e.key === "Enter") {
      // auto-indent: carry the current line's indentation; indent deeper after { ( [ :
      e.preventDefault();
      const before = val.slice(0, s), after = val.slice(en);
      const line = before.slice(before.lastIndexOf("\n") + 1);
      const baseIndent = (line.match(/^[ \t]*/) ?? [""])[0];
      const opensBlock = /[{([]\s*$|:\s*$/.test(line);
      let insert = "\n" + baseIndent + (opensBlock ? "    " : "");
      let caret = s + insert.length;
      // Enter between an open bracket and its closer → closer drops to its own line
      if (/[{([]\s*$/.test(line) && /^[})\]]/.test(after)) {
        insert = "\n" + baseIndent + "    \n" + baseIndent;
        caret = s + 1 + baseIndent.length + 4;
      }
      apply(before + insert + after, caret);
      return;
    }

    if (e.key === "Backspace" && s === en && s > 0 && !e.ctrlKey && !e.metaKey) {
      const prev = val[s - 1];
      // deleting an opener with its empty closer right after → remove both
      if (PAIRS[prev] && val[s] === PAIRS[prev]) {
        e.preventDefault();
        apply(val.slice(0, s - 1) + val.slice(s + 1), s - 1);
        return;
      }
      // cursor in leading whitespace → remove a whole indent level at once
      const lineStart = val.lastIndexOf("\n", s - 1) + 1;
      const before = val.slice(lineStart, s);
      if (/^ +$/.test(before)) {
        e.preventDefault();
        const remove = before.length % 4 || 4;
        apply(val.slice(0, s - remove) + val.slice(s), s - remove);
        return;
      }
      return;
    }

    if (e.ctrlKey || e.metaKey || e.altKey) return;

    // typing a closer that's already next → just step over it
    if (CLOSERS.has(e.key) && s === en && val[s] === e.key) {
      e.preventDefault();
      apply(val, s + 1);
      return;
    }

    // auto-close pairs; wraps the selection if there is one
    if (PAIRS[e.key]) {
      const close = PAIRS[e.key];
      // symmetric quotes: step over instead of doubling
      if (s === en && close === e.key && val[s] === e.key) { e.preventDefault(); apply(val, s + 1); return; }
      e.preventDefault();
      const sel = val.slice(s, en);
      apply(val.slice(0, s) + e.key + sel + close + val.slice(en), s + 1, s + 1 + sel.length);
      return;
    }
  };

  const runCode = async (fileOverride?: PlayFile) => {
    const file = fileOverride ?? activeFile;
    if (running || !file) return;
    const lang = LANGS.find(l => l.id === file.lang)!;
    setRunning(true);
    setTermLines(prev => [...prev, { type: "cmd", text: `$ ${lang.runCmd(file.name)}` }]);
    try {
      // resolve compiler ids once from Wandbox, then cache
      if (!wbCompilersRef.current) {
        try {
          const res = await fetch("https://wandbox.org/api/list.json");
          const list: { name: string; language: string }[] = await res.json();
          const map: Record<string, string> = {};
          for (const l of LANGS) {
            const c = list.find(r => r.language === l.wb && !r.name.includes("head") && !r.name.includes("2.7"));
            map[l.id] = c?.name ?? l.fallback;
          }
          wbCompilersRef.current = map;
        } catch {
          wbCompilersRef.current = Object.fromEntries(LANGS.map(l => [l.id, l.fallback]));
        }
      }
      const compiler = wbCompilersRef.current[lang.id] ?? lang.fallback;
      // Wandbox stores the source as prog.<ext>, so a `public` top-level class can't match its filename
      const source = lang.id === "java" ? file.content.replace(/public\s+(final\s+)?class/, "$1class") : file.content;
      const t0 = performance.now();
      const res = await fetch("https://wandbox.org/api/compile.json", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compiler, code: source, stdin: stdinValue }),
      });
      if (!res.ok) throw new Error(`runner responded ${res.status}`);
      const data = await res.json();
      const ms = Math.round(performance.now() - t0);
      const out: TermLine[] = [];
      if (data.compiler_error) out.push(...String(data.compiler_error).trimEnd().split("\n").map((t: string) => ({ type: "err" as const, text: t })));
      if (data.program_output) out.push(...String(data.program_output).trimEnd().split("\n").map((t: string) => ({ type: "out" as const, text: t })));
      if (data.program_error) out.push(...String(data.program_error).trimEnd().split("\n").map((t: string) => ({ type: "err" as const, text: t })));
      if (data.signal) out.push({ type: "err", text: `terminated by signal: ${data.signal}` });
      const exitCode = Number(data.status || "0");
      const success = exitCode === 0 && !data.signal;
      out.push({ type: "sys", text: success ? `✓ finished in ${ms}ms · exit code 0` : `✗ exited with code ${data.status || "?"} · ${ms}ms` });
      setLastRun({
        fileName: file.name,
        langId: lang.id,
        ms,
        exitCode,
        ok: success,
        stdout: String(data.program_output ?? ""),
        errText: [data.compiler_error, data.program_error, data.signal ? `signal: ${data.signal}` : ""].filter(Boolean).join("\n"),
      });
      if (success) {
        const { awarded } = awardDaily("run", 10, "Daily coding — ran a program");
        if (awarded) out.push({ type: "sys", text: "+10 DSR earned — daily coding complete" });
      }
      setTermLines(prev => [...prev, ...out]);
    } catch (err) {
      setTermLines(prev => [...prev, { type: "err", text: `network error: ${err instanceof Error ? err.message : "could not reach the runner"} — check your connection and retry` }]);
    } finally {
      setRunning(false);
    }
  };

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
          {mode === "code" ? (
            <>
              <span style={{ color: currentLang.color, fontWeight: 600 }}>{activeFile ? activeFile.name : "playground"}</span>
              <span style={{ color: T.text3 }}>—</span>
              <span style={{ color: T.text2 }}>Compiler</span>
            </>
          ) : (
            <>
              <span style={{ color: activeCategoryColor, fontWeight: 600 }}>{toSlug(activeTopic)}.dsa</span>
              <span style={{ color: T.text3 }}>—</span>
              <span style={{ color: T.text2 }}>{currentAgent.label} Agent</span>
            </>
          )}
          <span style={{ color: T.text3 }}>—</span>
          <span style={{ color: T.text3 }}>DSARunway</span>
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
            { id: "code",   icon: FileCode, title: "Compiler" },
            { id: "agents", icon: Bot,      title: "Agents"   },
            { id: "search", icon: Search,   title: "Search"   },
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
                  {activeView === "code" ? "Compiler" : activeView === "agents" ? "Agents" : "Search"}
                </span>
                <button onClick={() => setSidebarOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", color: T.text3, padding: "2px", borderRadius: "3px" }}
                  onMouseEnter={e => (e.currentTarget.style.color = T.text1)}
                  onMouseLeave={e => (e.currentTarget.style.color = T.text3)}>
                  <X style={{ width: "13px", height: "13px" }} />
                </button>
              </div>

              {/* ── COMPILER (playground files) ── */}
              {activeView === "code" && (
                <div style={{ flex: 1, overflowY: "auto", paddingTop: "4px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "4px", padding: "3px 10px 4px", cursor: "default", userSelect: "none" }}>
                    <ChevronDown style={{ width: "12px", height: "12px", color: T.text3, flexShrink: 0 }} />
                    <FolderOpen style={{ width: "14px", height: "14px", color: "#dcb67a", flexShrink: 0 }} />
                    <span style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: T.text1 }}>playground</span>
                    <button title="New file" onClick={() => { setNewFileDraft(""); setNewFileError(false); }}
                      style={{ marginLeft: "auto", display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: T.text3, padding: "2px", borderRadius: "3px" }}
                      onMouseEnter={e => (e.currentTarget.style.color = T.text1)}
                      onMouseLeave={e => (e.currentTarget.style.color = T.text3)}>
                      <Plus style={{ width: "13px", height: "13px" }} />
                    </button>
                  </div>

                  {files.map(f => {
                    const isActive = activeId === f.id && openIds.includes(f.id);
                    return (
                      <div key={f.id}
                        onClick={() => openFile(f.id)}
                        style={{ width: "100%", display: "flex", alignItems: "center", gap: "7px", paddingLeft: "26px", paddingRight: "8px", paddingTop: "3px", paddingBottom: "3px", background: isActive ? T.hlBg : "none", cursor: "pointer", color: isActive ? "#ffffff" : T.text3 }}
                        onMouseEnter={e => {
                          if (!isActive) e.currentTarget.style.background = T.hoverBg;
                          const d = e.currentTarget.querySelector<HTMLElement>("[data-del]"); if (d) d.style.opacity = "1";
                        }}
                        onMouseLeave={e => {
                          if (!isActive) e.currentTarget.style.background = "none";
                          const d = e.currentTarget.querySelector<HTMLElement>("[data-del]"); if (d) d.style.opacity = "0";
                        }}
                      >
                        <LangIcon langId={f.lang} size={14} />
                        <span style={{ fontSize: "12px", textAlign: "left", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{f.name}</span>
                        <button data-del title={`Delete ${f.name}`}
                          onClick={e => { e.stopPropagation(); deleteFile(f.id); }}
                          style={{ opacity: 0, display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: T.text3, padding: "1px", transition: "opacity 0.12s" }}
                          onMouseEnter={e => (e.currentTarget.style.color = "#f87171")}
                          onMouseLeave={e => (e.currentTarget.style.color = T.text3)}>
                          <Trash2 style={{ width: "11px", height: "11px" }} />
                        </button>
                      </div>
                    );
                  })}

                  {/* New file input */}
                  {newFileDraft !== null && (
                    <div style={{ display: "flex", alignItems: "center", gap: "7px", padding: "3px 8px 3px 26px" }}>
                      <FileCode style={{ width: "13px", height: "13px", color: T.text3, flexShrink: 0 }} />
                      <input
                        autoFocus
                        value={newFileDraft}
                        onChange={e => { setNewFileDraft(e.target.value); setNewFileError(false); }}
                        onKeyDown={e => {
                          if (e.key === "Enter") createFile(newFileDraft);
                          if (e.key === "Escape") { setNewFileDraft(null); setNewFileError(false); }
                        }}
                        onBlur={() => { if (!newFileDraft.trim()) { setNewFileDraft(null); setNewFileError(false); } }}
                        placeholder="two-sum.py"
                        style={{ flex: 1, minWidth: 0, background: T.inputBg, border: `1px solid ${newFileError ? "#f87171" : T.border2}`, borderRadius: "3px", padding: "2px 7px", fontSize: "12px", color: T.text1, fontFamily: T.mono, outline: "none" }}
                      />
                    </div>
                  )}
                  {newFileError && (
                    <p style={{ fontSize: "10px", color: "#f87171", padding: "2px 12px 0 26px", margin: 0 }}>
                      Use a unique name ending in .cpp / .py / .java / .js
                    </p>
                  )}

                  {/* ── Analysis: last run + complexity estimate ── */}
                  <div style={{ margin: "12px 10px 0", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ padding: "10px 12px", borderRadius: "6px", background: lastRun ? (lastRun.ok ? "rgba(16,185,129,0.07)" : "rgba(239,68,68,0.07)") : T.inputBg, border: `1px solid ${lastRun ? (lastRun.ok ? "rgba(16,185,129,0.28)" : "rgba(239,68,68,0.28)") : T.border2}`, fontSize: "11px", color: T.text2 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
                        <Timer style={{ width: "11px", height: "11px", color: lastRun ? (lastRun.ok ? "#10b981" : "#f87171") : T.text3 }} />
                        <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#9095b0" }}>LAST RUN</span>
                        {lastRun && (
                          <span style={{ marginLeft: "auto", fontWeight: 700, color: lastRun.ok ? "#10b981" : "#f87171" }}>
                            {lastRun.ok ? "✓ Success" : `✗ Exit ${lastRun.exitCode}`}
                          </span>
                        )}
                      </div>
                      {lastRun ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Runtime</span>
                            <span style={{ fontFamily: T.mono, fontWeight: 600, color: T.text1 }}>{lastRun.ms} ms</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>File</span>
                            <span style={{ fontFamily: T.mono, color: T.text1 }}>{lastRun.fileName}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>Runner</span>
                            <span style={{ fontFamily: T.mono }}>wandbox vm</span>
                          </div>
                        </div>
                      ) : (
                        <span style={{ fontSize: "10px", lineHeight: 1.6 }}>Run a file to see runtime and exit status here.</span>
                      )}
                    </div>

                    {activeFile && (() => {
                      const cx = estimateComplexity(activeFile.content);
                      return (
                        <div style={{ padding: "10px 12px", borderRadius: "6px", background: "rgba(245,158,11,0.05)", border: "1px solid rgba(245,158,11,0.18)", fontSize: "11px", color: T.text2 }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", marginBottom: "6px" }}>
                            <Gauge style={{ width: "11px", height: "11px", color: "#f59e0b" }} />
                            <span style={{ fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", color: "#9095b0" }}>COMPLEXITY</span>
                            <span style={{ marginLeft: "auto", fontSize: "9px", color: T.text3 }}>static estimate</span>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Time</span>
                              <span style={{ fontFamily: T.mono, fontWeight: 700, color: "#f59e0b" }}>{cx.time}</span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Space</span>
                              <span style={{ fontFamily: T.mono, fontWeight: 700, color: "#8b5cf6" }}>{cx.space}</span>
                            </div>
                          </div>
                          {cx.hints.length > 0 && (
                            <div style={{ marginTop: "6px", paddingTop: "6px", borderTop: `1px solid ${T.border}`, display: "flex", flexDirection: "column", gap: "2px" }}>
                              {cx.hints.map((h, i) => (
                                <span key={i} style={{ fontSize: "10px", color: T.text3 }}>· {h}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>
                </div>
              )}

              {/* ── AGENTS + CURRICULUM ── */}
              {activeView === "agents" && (
                <div style={{ flex: 1, overflowY: "auto", paddingTop: "4px" }}>
                  <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", padding: "6px 12px 6px", color: T.text3, fontWeight: 700 }}>Active Agents</div>
                  <div style={{ padding: "0 8px" }}>
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

                  <div style={{ margin: "8px 0", borderTop: `1px solid ${T.border}` }} />

                  {/* Curriculum tree */}
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

              {/* ── SEARCH ── */}
              {activeView === "search" && (() => {
                const q = searchQuery.trim().toLowerCase();
                const topicHits = q ? TOPICS_SIDEBAR.flatMap(cat => cat.items.filter(i => i.toLowerCase().includes(q)).map(i => ({ cat, item: i }))) : [];
                const fileHits = q ? files.filter(f => f.name.toLowerCase().includes(q) || f.content.toLowerCase().includes(q)) : [];
                return (
                  <div style={{ flex: 1, padding: "12px", overflowY: "auto" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "6px 10px", borderRadius: "4px", background: T.inputBg, border: `1px solid ${T.border2}` }}>
                      <Search style={{ width: "13px", height: "13px", color: T.text3 }} />
                      <input autoFocus placeholder="Search topics & files..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                        style={{ flex: 1, minWidth: 0, background: "none", border: "none", outline: "none", fontSize: "12px", color: T.text1, fontFamily: T.mono }} />
                      {searchQuery && (
                        <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", cursor: "pointer", color: T.text3, padding: 0, display: "flex" }}>
                          <X style={{ width: "12px", height: "12px" }} />
                        </button>
                      )}
                    </div>

                    {!q && <p style={{ fontSize: "11px", textAlign: "center", marginTop: "16px", color: T.text3 }}>Search across DSA topics and playground files</p>}

                    {q && topicHits.length > 0 && (
                      <>
                        <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", padding: "14px 2px 6px", color: T.text3, fontWeight: 700 }}>Topics · {topicHits.length}</div>
                        {topicHits.map(({ cat, item }) => (
                          <button key={item} onClick={() => { setActiveTopic(item); setExpandedCategory(cat.category); setActiveView("agents"); }}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: "7px", padding: "5px 8px", borderRadius: "5px", background: "none", border: "none", cursor: "pointer", color: T.text2, textAlign: "left" }}
                            onMouseEnter={e => (e.currentTarget.style.background = T.hoverBg)}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                            <FileIcon color={cat.color} active={false} />
                            <span style={{ fontSize: "12px", flex: 1 }}>{toSlug(item)}.dsa</span>
                            <span style={{ fontSize: "9px", color: T.text3 }}>{cat.category}</span>
                          </button>
                        ))}
                      </>
                    )}

                    {q && fileHits.length > 0 && (
                      <>
                        <div style={{ fontSize: "10px", textTransform: "uppercase", letterSpacing: "0.1em", padding: "14px 2px 6px", color: T.text3, fontWeight: 700 }}>Playground · {fileHits.length}</div>
                        {fileHits.map(f => (
                          <button key={f.id} onClick={() => { openFile(f.id); setActiveView("code"); }}
                            style={{ width: "100%", display: "flex", alignItems: "center", gap: "7px", padding: "5px 8px", borderRadius: "5px", background: "none", border: "none", cursor: "pointer", color: T.text2, textAlign: "left" }}
                            onMouseEnter={e => (e.currentTarget.style.background = T.hoverBg)}
                            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
                            <LangIcon langId={f.lang} size={13} />
                            <span style={{ fontSize: "12px", flex: 1 }}>{f.name}</span>
                          </button>
                        ))}
                      </>
                    )}

                    {q && topicHits.length === 0 && fileHits.length === 0 && (
                      <p style={{ fontSize: "11px", textAlign: "center", marginTop: "16px", color: T.text3 }}>No matches for &quot;{searchQuery}&quot;</p>
                    )}
                  </div>
                );
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── EDITOR AREA ── */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0 }}>

          {/* TAB BAR */}
          <div style={{ height: "36px", display: "flex", alignItems: "flex-end", overflow: "hidden", flexShrink: 0, background: T.tabBar, borderBottom: `1px solid ${T.border}` }}>
            {mode === "code" && openIds.map(id => {
              const f = files.find(x => x.id === id);
              if (!f) return null;
              const lang = LANGS.find(l => l.id === f.lang)!;
              const isActive = activeId === id;
              return (
                <button key={id} onClick={() => setActiveId(id)}
                  style={{ height: "100%", display: "flex", alignItems: "center", gap: "6px", padding: "0 12px", fontSize: "12px", whiteSpace: "nowrap", flexShrink: 0, position: "relative", background: isActive ? T.bg : "none", color: isActive ? T.text1 : T.text3, border: "none", borderRight: `1px solid ${T.border}`, cursor: "pointer" }}
                  onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = T.text2; }}
                  onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = T.text3; }}
                >
                  {isActive && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: "1.5px", background: lang.color }} />}
                  <LangIcon langId={f.lang} size={13} />
                  <span>{f.name}</span>
                  <span
                    role="button" aria-label={`Close ${f.name}`}
                    onClick={e => { e.stopPropagation(); closeTab(id); }}
                    style={{ fontSize: "13px", lineHeight: 1, color: T.text3, marginLeft: "2px", padding: "1px 3px", borderRadius: "3px" }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.text1; e.currentTarget.style.background = T.hoverBg; }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = "none"; }}
                  >×</span>
                </button>
              );
            })}
            {mode === "chat" && AGENTS.map(agent => {
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
            <button title={mode === "code" ? "New file" : "New tab"}
              onClick={() => { if (mode === "code") { setSidebarOpen(true); setActiveView("code"); setNewFileDraft(""); setNewFileError(false); } }}
              style={{ height: "100%", padding: "0 12px", flexShrink: 0, background: "none", border: "none", cursor: "pointer", color: T.text3 }}
              onMouseEnter={e => { e.currentTarget.style.color = T.text2; e.currentTarget.style.background = T.hoverBg; }}
              onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.background = "none"; }}>
              <Plus style={{ width: "13px", height: "13px" }} />
            </button>
          </div>

          {/* BREADCRUMB / TOOLBAR */}
          <div style={{ height: mode === "code" ? "38px" : "26px", display: "flex", alignItems: "center", padding: "0 16px", fontSize: "12px", flexShrink: 0, background: T.bg, borderBottom: `1px solid ${T.border}`, color: T.text3, userSelect: "none", gap: "4px" }}>
            {mode === "code" ? (
              <>
                <FileCode style={{ width: "12px", height: "12px" }} />
                <span>Playground</span>
                <ChevronRight style={{ width: "11px", height: "11px", color: T.text3 }} />
                <span style={{ color: currentLang.color }}>{activeFile ? activeFile.name : "—"}</span>
                <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "8px" }}>
                  <button title="Reset to starter code" disabled={!activeFile}
                    onClick={() => { if (activeFile) setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: LANGS.find(l => l.id === f.lang)!.code } : f)); }}
                    style={{ display: "flex", alignItems: "center", gap: "5px", padding: "4px 10px", borderRadius: "5px", fontSize: "11px", background: "none", border: `1px solid ${T.border2}`, color: T.text3, cursor: "pointer", fontFamily: T.mono }}
                    onMouseEnter={e => { e.currentTarget.style.color = T.text1; e.currentTarget.style.borderColor = T.text3; }}
                    onMouseLeave={e => { e.currentTarget.style.color = T.text3; e.currentTarget.style.borderColor = T.border2; }}
                  >
                    <RefreshCw style={{ width: "11px", height: "11px" }} />Reset
                  </button>
                  <motion.button onClick={() => runCode()} disabled={running || !activeFile}
                    whileHover={!running && activeFile ? { scale: 1.04 } : {}}
                    whileTap={!running && activeFile ? { scale: 0.95 } : {}}
                    style={{ display: "flex", alignItems: "center", gap: "6px", padding: "4px 16px", borderRadius: "5px", fontSize: "12px", fontWeight: 700, border: "none", cursor: running ? "wait" : activeFile ? "pointer" : "not-allowed", background: running ? "#1c4532" : activeFile ? "linear-gradient(135deg, #10b981, #059669)" : T.hoverBg, color: running ? "#6ee7b7" : activeFile ? "#04120c" : T.text3, fontFamily: T.mono }}
                  >
                    {running
                      ? <Loader2 className="animate-spin" style={{ width: "13px", height: "13px" }} />
                      : <Play style={{ width: "12px", height: "12px", fill: "currentColor" }} />}
                    {running ? "Running..." : "Run"}
                  </motion.button>
                </div>
              </>
            ) : (
              <>
                <BookOpen style={{ width: "12px", height: "12px" }} />
                <span>DSA</span>
                <ChevronRight style={{ width: "11px", height: "11px", color: T.text3 }} />
                <span style={{ color: activeCategoryColor + "cc" }}>{activeCategory}</span>
                <ChevronRight style={{ width: "11px", height: "11px", color: T.text3 }} />
                <FileIcon color={activeCategoryColor} active={false} />
                <span style={{ color: activeCategoryColor }}>{toSlug(activeTopic)}.dsa</span>
              </>
            )}
          </div>

          {/* ── CODE MODE: EDITOR + TERMINAL ── */}
          {mode === "code" && (
            <>
              {activeFile ? (
                <div style={{ flex: 1, overflow: "auto", display: "flex", background: isDark ? "#0b0c18" : "#fbfbfc" }}>
                  {/* Line numbers */}
                  <div style={{ padding: "14px 0", textAlign: "right", userSelect: "none", minWidth: "46px", flexShrink: 0, borderRight: `1px solid ${T.border}`, background: isDark ? "#0a0b16" : "#f4f4f6" }}>
                    {activeFile.content.split("\n").map((_, i) => (
                      <div key={i} style={{ fontSize: "11px", lineHeight: "21px", padding: "0 10px", color: T.text3, fontFamily: T.mono }}>{i + 1}</div>
                    ))}
                  </div>
                  {/* Editor — syntax-highlighted <pre> underlay + transparent textarea on top */}
                  <div style={{ position: "relative", flex: 1, minWidth: 0 }}>
                    <pre aria-hidden="true" style={{ margin: 0, padding: "14px 16px", fontFamily: T.mono, fontSize: "13px", lineHeight: "21px", whiteSpace: "pre", minHeight: "100%", minWidth: "max-content", color: isDark ? HL_PALETTE.dark.def : HL_PALETTE.light.def, pointerEvents: "none" }}>
                      {highlightCode(activeFile.content, activeFile.lang, isDark)}
                      {"\n\n"}
                    </pre>
                    <textarea
                      value={activeFile.content}
                      onChange={e => { const v = e.target.value; setFiles(prev => prev.map(f => f.id === activeFile.id ? { ...f, content: v } : f)); }}
                      onKeyDown={handleEditorKey}
                      spellCheck={false}
                      wrap="off"
                      aria-label={`Code editor — ${activeFile.name}`}
                      style={{ position: "absolute", inset: 0, width: "100%", height: "100%", border: "none", outline: "none", resize: "none", background: "transparent", color: "transparent", WebkitTextFillColor: "transparent", fontFamily: T.mono, fontSize: "13px", lineHeight: "21px", padding: "14px 16px", whiteSpace: "pre", overflow: "hidden", caretColor: isDark ? "#f59e0b" : "#d97706" }}
                    />
                  </div>
                </div>
              ) : (
                <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "10px", background: isDark ? "#0b0c18" : "#fbfbfc", color: T.text3 }}>
                  <FileCode style={{ width: "36px", height: "36px", opacity: 0.4 }} />
                  <p style={{ fontSize: "13px", fontFamily: T.sans, margin: 0 }}>No file open</p>
                  <p style={{ fontSize: "11px", fontFamily: T.sans, margin: 0 }}>Pick a file from the sidebar, or create your own with <span style={{ color: "#f59e0b" }}>+</span></p>
                </div>
              )}

              {/* Terminal panel — VS Code style: resizable, tabbed */}
              <div style={{ height: `${termHeight}px`, flexShrink: 0, display: "flex", flexDirection: "column", background: termTheme.bg, borderTop: `1px solid ${termTheme.border}`, transition: "background 0.25s", position: "relative" }}>
                {/* Resize handle */}
                <div
                  onMouseDown={startTermResize}
                  onDoubleClick={() => setTermHeight(230)}
                  title="Drag to resize · double-click to reset"
                  style={{ position: "absolute", top: "-3px", left: 0, right: 0, height: "6px", cursor: "ns-resize", zIndex: 5 }}
                />
                {/* Panel tab bar */}
                <div style={{ height: "34px", display: "flex", alignItems: "stretch", gap: "2px", padding: "0 10px", flexShrink: 0, borderBottom: `1px solid ${termTheme.border}`, userSelect: "none" }}>
                  {([
                    { id: "problems", label: "PROBLEMS", badge: lastRun?.errText ? lastRun.errText.split("\n").filter(Boolean).length : 0 },
                    { id: "output", label: "OUTPUT", badge: 0 },
                    { id: "terminal", label: "TERMINAL", badge: 0 },
                  ] as const).map(tab => {
                    const isActive = termTab === tab.id;
                    return (
                      <button key={tab.id} onClick={() => { setTermTab(tab.id); if (tab.id === "terminal") setTimeout(() => termInputRef.current?.focus(), 0); }}
                        style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 10px", background: "none", border: "none", borderBottom: `1.5px solid ${isActive ? termTheme.ok : "transparent"}`, cursor: "pointer", color: isActive ? termTheme.out : termTheme.sys, fontSize: "10px", fontWeight: 700, letterSpacing: "0.1em", fontFamily: T.mono }}
                        onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = termTheme.out; }}
                        onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = termTheme.sys; }}
                      >
                        {tab.label}
                        {tab.badge > 0 && (
                          <span style={{ minWidth: "15px", height: "15px", borderRadius: "999px", background: termTheme.err, color: termTheme.bg, fontSize: "9px", fontWeight: 800, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "0 4px" }}>
                            {tab.badge}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  <span style={{ alignSelf: "center", fontSize: "10px", color: termTheme.sys, opacity: 0.55, fontFamily: T.mono, marginLeft: "6px" }}>wandbox cloud · type &apos;help&apos;</span>
                  <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px" }}>
                    <button title={`Terminal theme: ${termTheme.label} — click to switch`} onClick={cycleTermTheme}
                      style={{ display: "flex", alignItems: "center", gap: "5px", background: "none", border: `1px solid ${termTheme.border}`, borderRadius: "4px", padding: "2px 8px", cursor: "pointer", color: termTheme.sys, fontSize: "10px", fontFamily: T.mono }}
                      onMouseEnter={e => (e.currentTarget.style.color = termTheme.out)}
                      onMouseLeave={e => (e.currentTarget.style.color = termTheme.sys)}>
                      <Palette style={{ width: "11px", height: "11px" }} />
                      {termTheme.label}
                    </button>
                    <button title="Clear terminal" onClick={() => setTermLines([])}
                      style={{ display: "flex", alignItems: "center", background: "none", border: "none", cursor: "pointer", color: termTheme.sys, padding: "3px" }}
                      onMouseEnter={e => (e.currentTarget.style.color = termTheme.err)}
                      onMouseLeave={e => (e.currentTarget.style.color = termTheme.sys)}>
                      <Trash2 style={{ width: "12px", height: "12px" }} />
                    </button>
                  </div>
                </div>

                {/* PROBLEMS pane */}
                {termTab === "problems" && (
                  <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", fontFamily: T.mono, fontSize: "12px", lineHeight: 1.75 }}>
                    {lastRun?.errText ? (
                      <>
                        <div style={{ color: termTheme.sys, marginBottom: "4px" }}>{lastRun.fileName} — last run</div>
                        {lastRun.errText.split("\n").filter(Boolean).map((l, i) => (
                          <div key={i} style={{ color: termTheme.err, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>⚠ {l}</div>
                        ))}
                      </>
                    ) : (
                      <span style={{ color: termTheme.sys }}>No problems have been detected in the playground.</span>
                    )}
                  </div>
                )}

                {/* OUTPUT pane */}
                {termTab === "output" && (
                  <div style={{ flex: 1, overflowY: "auto", padding: "10px 14px", fontFamily: T.mono, fontSize: "12.5px", lineHeight: 1.75 }}>
                    {lastRun ? (
                      <>
                        <div style={{ color: termTheme.sys, marginBottom: "4px" }}>{`> ${lastRun.fileName} · ${lastRun.ms}ms · exit ${lastRun.exitCode}`}</div>
                        <div style={{ color: termTheme.out, whiteSpace: "pre-wrap", wordBreak: "break-word" }}>{lastRun.stdout || "(no output)"}</div>
                      </>
                    ) : (
                      <span style={{ color: termTheme.sys }}>Run a file to see its program output here.</span>
                    )}
                  </div>
                )}

                {/* TERMINAL pane */}
                {termTab === "terminal" && (
                <div
                  onClick={() => termInputRef.current?.focus()}
                  style={{ flex: 1, overflowY: "auto", padding: "10px 14px", fontFamily: T.mono, fontSize: "12.5px", lineHeight: 1.75, cursor: "text" }}
                >
                  {termLines.map((line, i) => (
                    <div key={i} style={{ whiteSpace: "pre-wrap", wordBreak: "break-word", color: line.type === "cmd" ? termTheme.cmd : line.type === "err" ? termTheme.err : line.type === "sys" ? (line.text.startsWith("✓") || line.text.startsWith("+10") ? termTheme.ok : termTheme.sys) : termTheme.out }}>
                      {line.text}
                    </div>
                  ))}
                  {running && (
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: termTheme.sys }}>
                      <Loader2 className="animate-spin" style={{ width: "11px", height: "11px" }} />
                      compiling &amp; running in the cloud...
                    </div>
                  )}
                  {/* Shell prompt */}
                  <div style={{ display: "flex", alignItems: "baseline" }}>
                    <span style={{ color: termTheme.ok, flexShrink: 0, fontWeight: 600 }}>dsr@runway</span>
                    <span style={{ color: termTheme.sys, flexShrink: 0 }}>:</span>
                    <span style={{ color: termTheme.cmd, flexShrink: 0 }}>~/playground</span>
                    <span style={{ color: termTheme.out, flexShrink: 0 }}>$&nbsp;</span>
                    <input
                      ref={termInputRef}
                      value={termInput}
                      onChange={e => setTermInput(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === "Enter") { runTermCommand(termInput); setTermInput(""); }
                        else if (e.key === "ArrowUp") {
                          e.preventDefault();
                          const h = termHistRef.current;
                          if (!h.length) return;
                          termHistIdx.current = Math.max(0, termHistIdx.current - 1);
                          setTermInput(h[termHistIdx.current] ?? "");
                        } else if (e.key === "ArrowDown") {
                          e.preventDefault();
                          const h = termHistRef.current;
                          termHistIdx.current = Math.min(h.length, termHistIdx.current + 1);
                          setTermInput(h[termHistIdx.current] ?? "");
                        }
                      }}
                      aria-label="Terminal command input"
                      autoComplete="off"
                      spellCheck={false}
                      style={{ flex: 1, minWidth: "60px", background: "transparent", border: "none", outline: "none", color: termTheme.out, fontFamily: T.mono, fontSize: "12.5px", padding: 0, caretColor: termTheme.ok }}
                    />
                  </div>
                  <div ref={termEndRef} />
                </div>
                )}
              </div>
            </>
          )}

          {/* MESSAGES */}
          {mode === "chat" && (
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
                  {"// Quick Start"}
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
          )}

          {/* INPUT BAR */}
          {mode === "chat" && (
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
          )}
        </div>

        {/* ── RIGHT PANEL ── */}
        {mode === "chat" && (
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
        )}
      </div>

      {/* ── STATUS BAR ── */}
      <div style={{ height: "24px", display: "flex", alignItems: "center", fontSize: "11px", flexShrink: 0, overflow: "hidden", userSelect: "none", background: T.statusBar, borderTop: `1px solid ${T.border}`, color: T.text2 }}>
        {/* Left */}
        <div style={{ display: "flex", alignItems: "center", height: "100%" }}>
          {mode === "code" ? (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0 12px", height: "100%", background: `${currentLang.color}20`, color: currentLang.color, cursor: "default" }}>
              <FileCode style={{ width: "11px", height: "11px" }} />
              <span>{activeFile ? `${currentLang.label} Playground` : "Playground"}</span>
            </div>
          ) : (
            <div style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0 12px", height: "100%", background: `${currentAgent.color}20`, color: currentAgent.color, cursor: "pointer" }}
              onMouseEnter={e => (e.currentTarget.style.background = `${currentAgent.color}32`)}
              onMouseLeave={e => (e.currentTarget.style.background = `${currentAgent.color}20`)}>
              <currentAgent.icon style={{ width: "11px", height: "11px" }} />
              <span>{currentAgent.label} Agent</span>
            </div>
          )}
          <button style={{ display: "flex", alignItems: "center", gap: "5px", padding: "0 12px", height: "100%", background: "none", border: "none", cursor: "pointer", color: T.text2 }}
            onMouseEnter={e => (e.currentTarget.style.background = T.hoverBg)}
            onMouseLeave={e => (e.currentTarget.style.background = "none")}>
            <Zap style={{ width: "11px", height: "11px" }} />
            {mode === "code" ? (running ? "Running..." : "Ready") : activeTopic}
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
          {[mode === "code" ? currentLang.label : "Python", "UTF-8", "DSARunway"].map(label => (
            <button key={label} style={{ padding: "0 12px", height: "100%", background: "none", border: "none", cursor: "pointer", color: label === "DSARunway" ? "#f59e0b90" : T.text2 }}
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
