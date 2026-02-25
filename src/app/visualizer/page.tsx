"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { type LucideIcon } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import { useTheme } from "@/context/ThemeContext";
import {
  Play, RotateCcw, ChevronRight,
  Plus, Trash2, Zap, GitBranch, Network, Layers, BarChart2, ArrowRight
} from "lucide-react";


type VizType = "linkedlist" | "graph" | "tree" | "sorting";

// ─── LINKED LIST ────────────────────────────────────────────────────────────

interface LLNode { id: number; value: number; highlighted?: boolean; active?: boolean }

function LinkedListViz() {
  const [nodes, setNodes] = useState<LLNode[]>([
    { id:1, value:12 }, { id:2, value:8 }, { id:3, value:23 }, { id:4, value:5 }, { id:5, value:17 }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [animStep, setAnimStep] = useState(-1);
  const [isAnimating, setIsAnimating] = useState(false);
  const [operation, setOperation] = useState<string | null>(null);

  const { isDark } = useTheme();
  const nodeBg      = isDark ? "#13131f"  : "#eef2ff";
  const nodeBord    = isDark ? "#2a2a4a"  : "#c5cfe8";
  const arrowCol    = isDark ? "#2a2a4a"  : "#c5cfe8";
  const dimText     = isDark ? "#6b7280"  : "#94a3b8";
  const dimText2    = isDark ? "#4b5563"  : "#b0b8cc";
  const inputBg     = isDark ? "#13131f"  : "#f1f5f9";
  const inputBorder = isDark ? "#1e1e3a"  : "#cbd5e1";

  const addNode = () => {
    const val = parseInt(inputVal);
    if (isNaN(val)) return;
    const newNode: LLNode = { id: Date.now(), value: val, highlighted: true };
    setNodes(prev => [...prev, newNode]);
    setInputVal("");
    setTimeout(() => setNodes(prev => prev.map(n => n.id === newNode.id ? { ...n, highlighted: false } : n)), 1200);
  };

  const removeNode = (id: number) => {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, active: true } : n));
    setTimeout(() => setNodes(prev => prev.filter(n => n.id !== id)), 400);
  };

  const traverse = async () => {
    setIsAnimating(true);
    setOperation("Traversing — O(n)");
    for (let i = 0; i < nodes.length; i++) {
      setAnimStep(i);
      await new Promise(r => setTimeout(r, 500));
    }
    setAnimStep(-1);
    setIsAnimating(false);
    setOperation(null);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <input
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addNode()}
            placeholder="Value"
            className="w-20 rounded-lg px-3 py-2 text-sm outline-none"
            style={{ background: inputBg, border: `1px solid ${inputBorder}`, color: isDark ? "#fff" : "#0f172a" }}
          />
          <motion.button onClick={addNode} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="flex items-center gap-1.5 px-3 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] rounded-lg text-sm font-medium hover:bg-[#f59e0b]/20 transition-colors">
            <Plus className="w-4 h-4"/>Add Node
          </motion.button>
        </div>
        <motion.button onClick={traverse} disabled={isAnimating} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="flex items-center gap-1.5 px-3 py-2 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#8b5cf6] rounded-lg text-sm font-medium hover:bg-[#8b5cf6]/20 transition-colors disabled:opacity-50">
          <Play className="w-4 h-4"/>Traverse
        </motion.button>
        <motion.button onClick={() => setNodes([{ id:1,value:12 },{ id:2,value:8 },{ id:3,value:23 },{ id:4,value:5 },{ id:5,value:17 }])} whileHover={{ scale:1.05 }} className="p-2 rounded-lg transition-colors" style={{ color: dimText }}>
          <RotateCcw className="w-4 h-4"/>
        </motion.button>
        {operation && <span className="text-xs text-[#f59e0b] px-2 py-1 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20">{operation}</span>}
      </div>

      {/* Visualization */}
      <div className="relative overflow-x-auto pb-8">
        <div className="flex items-center justify-center min-h-[180px] min-w-max mx-auto px-4">
        <div className="flex items-center gap-0">
          {/* Head pointer */}
          <div className="flex flex-col items-center mr-4 flex-shrink-0">
            <span className="text-[#f59e0b] text-xs font-bold font-mono mb-1">HEAD</span>
            <div className="w-px h-8 bg-[#f59e0b]/50"/>
            <ArrowRight className="w-4 h-4 text-[#f59e0b] -mt-1"/>
          </div>

          <AnimatePresence mode="popLayout">
            {nodes.map((node, i) => (
              <motion.div
                key={node.id}
                initial={{ opacity:0, scale:0.3, x:-20 }}
                animate={{ opacity: node.active ? 0 : 1, scale: node.active ? 0.3 : 1, x:0 }}
                exit={{ opacity:0, scale:0.3, x:20 }}
                transition={{ type:"spring", stiffness:300, damping:25 }}
                className="flex items-center"
              >
                {/* Node */}
                <motion.div
                  animate={animStep === i ? { scale:[1,1.2,1], boxShadow:["0 0 0px transparent","0 0 25px rgba(245,158,11,0.8)","0 0 10px rgba(245,158,11,0.4)"] } : {}}
                  transition={{ duration:0.4 }}
                  className="relative group flex-shrink-0"
                >
                  <div
                    className="w-16 h-16 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-300 cursor-pointer"
                    style={animStep === i
                      ? { borderColor:"#f59e0b", background:"rgba(245,158,11,0.2)", boxShadow:"0 0 20px rgba(245,158,11,0.5)" }
                      : node.highlighted
                      ? { borderColor:"#10b981", background:"rgba(16,185,129,0.15)" }
                      : { borderColor: nodeBord, background: nodeBg }}
                  >
                    <div className="text-xs font-mono" style={{ color: dimText }}>val</div>
                    <div className="text-lg font-black font-mono" style={{ color: animStep===i?"#f59e0b":node.highlighted?"#10b981":isDark?"#ffffff":"#0f172a" }}>{node.value}</div>
                    <div className="text-[9px] font-mono" style={{ color: dimText2 }}>next→</div>
                  </div>
                  {/* Delete button */}
                  <button onClick={() => removeNode(node.id)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#ef4444] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                    <Trash2 className="w-2.5 h-2.5"/>
                  </button>
                  {/* Index label */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-mono" style={{ color: dimText2 }}>[{i}]</div>
                </motion.div>

                {/* Arrow */}
                {i < nodes.length - 1 && (
                  <motion.div
                    className="flex items-center mx-1 flex-shrink-0"
                    animate={animStep === i ? { opacity:[0.5,1,0.5] } : { opacity:0.5 }}
                    transition={animStep === i ? { duration:0.4,repeat:0 } : {}}
                  >
                    <div style={{ height:"1px", width:"32px", background: animStep===i?"#f59e0b":arrowCol, transition:"background 0.3s" }}/>
                    <div style={{ width:0, height:0, borderTop:"5px solid transparent", borderBottom:"5px solid transparent", borderLeft:`8px solid ${animStep===i?"#f59e0b":arrowCol}`, transition:"border-left-color 0.3s" }}/>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Null */}
          <div className="flex items-center ml-1 flex-shrink-0">
            <div style={{ height:"1px", width:"24px", background: arrowCol }}/>
            <div style={{ width:0, height:0, borderTop:"5px solid transparent", borderBottom:"5px solid transparent", borderLeft:`8px solid ${arrowCol}` }}/>
            <span className="ml-2 text-sm font-mono font-bold" style={{ color: dimText2 }}>null</span>
          </div>
        </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs" style={{ color: dimText }}>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-[#f59e0b] bg-[#f59e0b]/20"/><span className="text-[#f59e0b]">Active</span></span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-[#10b981] bg-[#10b981]/20"/><span>Newly added</span></span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ borderWidth:"2px", borderStyle:"solid", borderColor: nodeBord, background: nodeBg }}/><span>Normal</span></span>
      </div>
    </div>
  );
}

// ─── GRAPH VISUALIZATION ─────────────────────────────────────────────────────

interface GraphNode { id: string; x: number; y: number; visited?: boolean; inQueue?: boolean; distance?: number }
interface GraphEdge { from: string; to: string; highlighted?: boolean; weight?: number }

function GraphViz() {
  const { isDark } = useTheme();
  const CANVAS    = isDark ? "rgba(7,13,27,0.9)"     : "rgba(240,244,250,0.9)";
  const CBORD     = isDark ? "rgba(30,30,58,0.8)"    : "rgba(15,23,42,0.12)";
  const TEXT1     = isDark ? "#ffffff"               : "#0f172a";
  const TEXT2     = isDark ? "#6b7280"               : "#64748b";
  const nodeFill  = isDark ? "rgba(19,19,31,0.9)"   : "rgba(220,228,240,0.9)";
  const edgeCol   = isDark ? "#2a2a4a"               : "#b8c4d8";
  const overlayBg = isDark ? "rgba(14,14,26,0.85)"  : "rgba(255,255,255,0.88)";
  const [nodes] = useState<GraphNode[]>([
    { id:"A", x:300, y:80 },
    { id:"B", x:150, y:200 },
    { id:"C", x:450, y:200 },
    { id:"D", x:80, y:320 },
    { id:"E", x:250, y:320 },
    { id:"F", x:420, y:320 },
    { id:"G", x:570, y:200 },
  ]);
  const [edges] = useState<GraphEdge[]>([
    { from:"A", to:"B" },{ from:"A", to:"C" },{ from:"B", to:"D" },
    { from:"B", to:"E" },{ from:"C", to:"F" },{ from:"C", to:"G" },{ from:"D", to:"E" },
  ]);
  const [visited, setVisited] = useState<Set<string>>(new Set());
  const [queue, setQueue] = useState<string[]>([]);
  const [activeEdges, setActiveEdges] = useState<Set<string>>(new Set());
  const [currentNode, setCurrentNode] = useState<string | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"bfs"|"dfs">("bfs");
  const [order, setOrder] = useState<string[]>([]);

  const resetViz = () => { setVisited(new Set()); setQueue([]); setActiveEdges(new Set()); setCurrentNode(null); setOrder([]); };

  const runBFS = async () => {
    setIsRunning(true);
    const vis = new Set<string>();
    const q = ["A"];
    const orderArr: string[] = [];
    setQueue([...q]);

    while (q.length > 0) {
      const node = q.shift()!;
      if (vis.has(node)) continue;
      vis.add(node);
      orderArr.push(node);
      setVisited(new Set(vis));
      setCurrentNode(node);
      setOrder([...orderArr]);
      await new Promise(r => setTimeout(r, 700));

      const neighbors = edges.filter(e => e.from === node || e.to === node)
        .map(e => e.from === node ? e.to : e.from)
        .filter(n => !vis.has(n));

      for (const nb of neighbors) {
        const edgeKey = [node, nb].sort().join("-");
        setActiveEdges(prev => new Set([...prev, edgeKey]));
        if (!vis.has(nb) && !q.includes(nb)) q.push(nb);
      }
      setQueue([...q]);
      await new Promise(r => setTimeout(r, 300));
    }
    setCurrentNode(null);
    setIsRunning(false);
  };

  const runDFS = async () => {
    setIsRunning(true);
    const vis = new Set<string>();
    const orderArr: string[] = [];

    const dfs = async (node: string) => {
      if (vis.has(node)) return;
      vis.add(node);
      orderArr.push(node);
      setVisited(new Set(vis));
      setCurrentNode(node);
      setOrder([...orderArr]);
      await new Promise(r => setTimeout(r, 600));

      const neighbors = edges.filter(e => e.from === node || e.to === node)
        .map(e => e.from === node ? e.to : e.from)
        .filter(n => !vis.has(n));

      for (const nb of neighbors) {
        const edgeKey = [node, nb].sort().join("-");
        setActiveEdges(prev => new Set([...prev, edgeKey]));
        await dfs(nb);
      }
    };

    await dfs("A");
    setCurrentNode(null);
    setIsRunning(false);
  };

  const getNode = (id: string) => nodes.find(n => n.id === id)!;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {(["bfs","dfs"] as const).map(m => (
          <button key={m} onClick={() => { setMode(m); resetViz(); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode===m?"bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/30":"border border-transparent"}`} style={mode!==m?{color:TEXT2}:{}}>
            {m.toUpperCase()}
          </button>
        ))}
        <motion.button onClick={() => { resetViz(); if (mode==="bfs") runBFS(); else runDFS(); }} disabled={isRunning} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black rounded-lg text-sm font-bold disabled:opacity-50">
          <Play className="w-4 h-4"/>Run {mode.toUpperCase()}
        </motion.button>
        <motion.button onClick={resetViz} whileHover={{ scale:1.05 }} className="p-2 rounded-lg transition-colors" style={{ color:TEXT2 }}>
          <RotateCcw className="w-4 h-4"/>
        </motion.button>
        {queue.length > 0 && (
          <div className="flex items-center gap-2 text-xs bg-[#8b5cf6]/10 px-3 py-1.5 rounded-full border border-[#8b5cf6]/20" style={{ color:TEXT2 }}>
            <span className="text-[#8b5cf6] font-semibold">{mode==="bfs"?"Queue":"Stack"}:</span>
            {queue.map(n => <span key={n} className="font-mono" style={{ color:TEXT1 }}>{n}</span>)}
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-hidden rounded-xl" style={{ height:"380px", background:CANVAS, border:`1px solid ${CBORD}` }}>
        <svg width="100%" height="100%" viewBox="0 0 660 400">
          {/* Edges */}
          {edges.map((edge,i) => {
            const from = getNode(edge.from);
            const to = getNode(edge.to);
            const edgeKey = [edge.from, edge.to].sort().join("-");
            const isActive = activeEdges.has(edgeKey);
            return (
              <motion.line
                key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y}
                stroke={isActive ? "#f59e0b" : edgeCol}
                strokeWidth={isActive ? 2.5 : 1.5}
                animate={{ stroke: isActive ? "#f59e0b" : edgeCol, strokeWidth: isActive ? 2.5 : 1.5 }}
                transition={{ duration:0.3 }}
                style={isActive ? { filter:"drop-shadow(0 0 4px rgba(245,158,11,0.6))" } : {}}
              />
            );
          })}

          {/* Nodes */}
          {nodes.map(node => {
            const isVisited = visited.has(node.id);
            const isCurrent = currentNode === node.id;
            const isInQueue = queue.includes(node.id) && !isVisited;
            return (
              <g key={node.id}>
                {isCurrent && (
                  <motion.circle cx={node.x} cy={node.y} r="28"
                    fill="rgba(245,158,11,0.15)"
                    animate={{ r:[24,32,24], opacity:[0.4,0.8,0.4] }}
                    transition={{ duration:0.8, repeat:Infinity }}
                  />
                )}
                <motion.circle
                  cx={node.x} cy={node.y} r="22"
                  fill={isCurrent ? "rgba(245,158,11,0.3)" : isVisited ? "rgba(16,185,129,0.2)" : isInQueue ? "rgba(139,92,246,0.2)" : nodeFill}
                  stroke={isCurrent ? "#f59e0b" : isVisited ? "#10b981" : isInQueue ? "#8b5cf6" : edgeCol}
                  strokeWidth={isCurrent ? 2.5 : 2}
                  animate={{
                    fill: isCurrent ? "rgba(245,158,11,0.3)" : isVisited ? "rgba(16,185,129,0.2)" : nodeFill,
                    stroke: isCurrent ? "#f59e0b" : isVisited ? "#10b981" : edgeCol,
                  }}
                  transition={{ duration:0.3 }}
                  style={isCurrent ? { filter:"drop-shadow(0 0 8px rgba(245,158,11,0.7))" } : isVisited ? { filter:"drop-shadow(0 0 5px rgba(16,185,129,0.4))" } : {}}
                />
                <text x={node.x} y={node.y+1} textAnchor="middle" dominantBaseline="middle" fill={isCurrent?"#f59e0b":isVisited?"#10b981":TEXT1} fontSize="13" fontWeight="bold" fontFamily="monospace">
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 backdrop-blur-sm rounded-lg p-2.5" style={{ background: overlayBg, border:`1px solid ${isDark?"rgba(255,255,255,0.05)":"rgba(15,23,42,0.1)"}` }}>
          {[
            { color:"#f59e0b", label:"Current" },
            { color:"#10b981", label:"Visited" },
            { color:"#8b5cf6", label:"In Queue" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2 text-xs" style={{ color:TEXT2 }}>
              <div className="w-3 h-3 rounded-full" style={{ background:l.color, boxShadow:`0 0 6px ${l.color}` }}/>
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Traversal order */}
      {order.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-wider" style={{ color:TEXT2 }}>Visit order:</span>
          {order.map((node,i) => (
            <motion.div key={`${node}-${i}`} initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} className="flex items-center gap-1">
              <span className="w-7 h-7 rounded-full bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-xs font-bold text-[#10b981] font-mono">{node}</span>
              {i < order.length-1 && <ChevronRight className="w-3 h-3" style={{ color:TEXT2 }}/>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SORTING VISUALIZATION ───────────────────────────────────────────────────

function SortingViz() {
  const { isDark } = useTheme();
  const CANVAS = isDark ? "rgba(7,13,27,0.9)"  : "rgba(240,244,250,0.9)";
  const CBORD  = isDark ? "rgba(30,30,58,0.8)" : "rgba(15,23,42,0.12)";
  const TEXT2  = isDark ? "#6b7280"             : "#64748b";
  const [arr, setArr] = useState([64, 34, 25, 12, 22, 11, 90, 45]);
  const [comparing, setComparing] = useState<number[]>([]);
  const [sorted, setSorted] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [algorithm, setAlgorithm] = useState<"bubble"|"selection"|"insertion">("bubble");
  const [stepCount, setStepCount] = useState(0);

  const resetArr = () => {
    setArr([64,34,25,12,22,11,90,45]);
    setComparing([]); setSorted([]); setStepCount(0);
  };

  const randomize = () => {
    setArr(Array.from({ length: 8 }, () => Math.floor(Math.random()*90)+10));
    setComparing([]); setSorted([]); setStepCount(0);
  };

  const bubbleSort = async () => {
    setIsRunning(true);
    const a = [...arr];
    let steps = 0;
    for (let i = 0; i < a.length-1; i++) {
      for (let j = 0; j < a.length-1-i; j++) {
        setComparing([j, j+1]);
        steps++;
        setStepCount(steps);
        await new Promise(r => setTimeout(r, 300));
        if (a[j] > a[j+1]) { [a[j], a[j+1]] = [a[j+1], a[j]]; setArr([...a]); }
      }
      setSorted(prev => [...prev, a.length-1-i]);
    }
    setSorted(a.map((_,i) => i));
    setComparing([]);
    setIsRunning(false);
  };

  const selectionSort = async () => {
    setIsRunning(true);
    const a = [...arr];
    let steps = 0;
    for (let i = 0; i < a.length; i++) {
      let minIdx = i;
      for (let j = i+1; j < a.length; j++) {
        setComparing([minIdx, j]);
        steps++;
        setStepCount(steps);
        await new Promise(r => setTimeout(r, 250));
        if (a[j] < a[minIdx]) minIdx = j;
      }
      if (minIdx !== i) { [a[i], a[minIdx]] = [a[minIdx], a[i]]; setArr([...a]); }
      setSorted(prev => [...prev, i]);
    }
    setComparing([]);
    setIsRunning(false);
  };

  const insertionSort = async () => {
    setIsRunning(true);
    const a = [...arr];
    let steps = 0;
    for (let i = 1; i < a.length; i++) {
      const key = a[i];
      let j = i-1;
      while (j >= 0 && a[j] > key) {
        setComparing([j, j+1]);
        steps++;
        setStepCount(steps);
        a[j+1] = a[j];
        setArr([...a]);
        await new Promise(r => setTimeout(r, 300));
        j--;
      }
      a[j+1] = key;
      setArr([...a]);
      setSorted(prev => [...prev, i]);
    }
    setSorted(a.map((_,i) => i));
    setComparing([]);
    setIsRunning(false);
  };

  const maxVal = Math.max(...arr);

  const runSort = () => {
    resetArr();
    setTimeout(() => {
      if (algorithm === "bubble") bubbleSort();
      else if (algorithm === "selection") selectionSort();
      else insertionSort();
    }, 50);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {(["bubble","selection","insertion"] as const).map(alg => (
          <button key={alg} onClick={() => setAlgorithm(alg)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${algorithm===alg?"bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30":"border border-transparent"}`} style={algorithm!==alg?{color:TEXT2}:{}}>
            {alg} Sort
          </button>
        ))}
        <motion.button onClick={runSort} disabled={isRunning} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black rounded-lg text-sm font-bold disabled:opacity-50">
          <Play className="w-4 h-4"/>Sort
        </motion.button>
        <motion.button onClick={randomize} disabled={isRunning} whileHover={{ scale:1.05 }} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm transition-colors disabled:opacity-50" style={{ border:`1px solid ${isDark?"#1e1e3a":"#e2e8f0"}`, color:TEXT2 }}>
          <Zap className="w-4 h-4"/>Randomize
        </motion.button>
        {stepCount > 0 && <span className="text-xs" style={{ color:TEXT2 }}>Comparisons: <span className="text-[#f59e0b] font-bold">{stepCount}</span></span>}
      </div>

      {/* Bars */}
      <div className="relative h-56 flex items-end justify-center gap-3 px-4 rounded-xl py-4" style={{ background:CANVAS, border:`1px solid ${CBORD}` }}>
        {arr.map((val, i) => {
          const isComparing = comparing.includes(i);
          const isSorted = sorted.includes(i);
          const height = `${(val / maxVal) * 85}%`;
          return (
            <motion.div key={`${i}-${val}`} layout className="flex flex-col items-center gap-1 flex-1 max-w-[56px]" style={{ height:"100%", justifyContent:"flex-end" }}>
              <span className="text-xs font-mono" style={{ color:TEXT2 }}>{val}</span>
              <motion.div
                className="w-full rounded-t-lg relative overflow-hidden"
                style={{
                  height,
                  background: isComparing
                    ? "linear-gradient(180deg,#f59e0b,#d97706)"
                    : isSorted
                    ? "linear-gradient(180deg,#10b981,#059669)"
                    : "linear-gradient(180deg,#3a3a6a,#252545)",
                  boxShadow: isComparing ? "0 0 15px rgba(245,158,11,0.6)" : isSorted ? "0 0 10px rgba(16,185,129,0.4)" : "none",
                  border: isComparing ? "1px solid rgba(245,158,11,0.5)" : isSorted ? "1px solid rgba(16,185,129,0.4)" : "1px solid rgba(42,42,74,0.5)",
                }}
                animate={{ height }}
                transition={{ type:"spring", stiffness:300, damping:30 }}
              >
                {/* Shimmer for comparing */}
                {isComparing && (
                  <motion.div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent" animate={{ x:["-100%","200%"] }} transition={{ duration:0.6,repeat:Infinity }}/>
                )}
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs" style={{ color:TEXT2 }}>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background:"linear-gradient(180deg,#f59e0b,#d97706)" }}/><span className="text-[#f59e0b]">Comparing</span></span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background:"linear-gradient(180deg,#10b981,#059669)" }}/><span className="text-[#10b981]">Sorted</span></span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background:isDark?"linear-gradient(180deg,#3a3a6a,#252545)":"linear-gradient(180deg,#94a3b8,#7b90a8)" }}/><span>Unsorted</span></span>
        <div className="ml-auto" style={{ color:TEXT2 }}>
          {algorithm==="bubble"&&"O(n²) time · O(1) space"}
          {algorithm==="selection"&&"O(n²) time · O(1) space"}
          {algorithm==="insertion"&&"O(n²) worst · O(n) best"}
        </div>
      </div>
    </div>
  );
}

// ─── BINARY TREE ─────────────────────────────────────────────────────────────

function TreeViz() {
  const { isDark } = useTheme();
  const CANVAS    = isDark ? "rgba(7,13,27,0.9)"     : "rgba(240,244,250,0.9)";
  const CBORD     = isDark ? "rgba(30,30,58,0.8)"    : "rgba(15,23,42,0.12)";
  const TEXT1     = isDark ? "#ffffff"               : "#0f172a";
  const TEXT2     = isDark ? "#6b7280"               : "#64748b";
  const nodeFill  = isDark ? "rgba(13,13,26,0.9)"   : "rgba(220,228,240,0.9)";
  const edgeCol   = isDark ? "#2a2a4a"               : "#b8c4d8";
  const overlayBg = isDark ? "rgba(14,14,26,0.85)"  : "rgba(255,255,255,0.88)";
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [traversalOrder, setTraversalOrder] = useState<number[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [mode, setMode] = useState<"inorder"|"preorder"|"postorder">("inorder");

  const tree = {
    val:50, left:{ val:30, left:{ val:20, left:null, right:null }, right:{ val:40, left:null, right:null } },
    right:{ val:70, left:{ val:60, left:null, right:null }, right:{ val:80, left:null, right:null } }
  };

  type TreeNode = { val:number; left:TreeNode|null; right:TreeNode|null };

  const getTraversal = (node: TreeNode | null, order: string): number[] => {
    if (!node) return [];
    if (order==="inorder") return [...getTraversal(node.left,order),node.val,...getTraversal(node.right,order)];
    if (order==="preorder") return [node.val,...getTraversal(node.left,order),...getTraversal(node.right,order)];
    return [...getTraversal(node.left,order),...getTraversal(node.right,order),node.val];
  };

  const runTraversal = async () => {
    setIsRunning(true);
    setTraversalOrder([]);
    const order = getTraversal(tree, mode);
    for (const val of order) {
      setHighlighted(val);
      setTraversalOrder(prev => [...prev, val]);
      await new Promise(r => setTimeout(r, 600));
    }
    setHighlighted(null);
    setIsRunning(false);
  };

  // Draw nodes
  const NODE_POSITIONS: Record<number,{x:number,y:number}> = {
    50:{x:320,y:60}, 30:{x:180,y:160}, 70:{x:460,y:160},
    20:{x:100,y:260}, 40:{x:260,y:260}, 60:{x:380,y:260}, 80:{x:540,y:260}
  };
  const EDGES: [number,number][] = [[50,30],[50,70],[30,20],[30,40],[70,60],[70,80]];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center gap-3">
        {(["inorder","preorder","postorder"] as const).map(m => (
          <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${mode===m?"bg-[#06b6d4]/15 text-[#06b6d4] border border-[#06b6d4]/30":"border border-transparent"}`} style={mode!==m?{color:TEXT2}:{}}>
            {m}
          </button>
        ))}
        <motion.button onClick={runTraversal} disabled={isRunning} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black rounded-lg text-sm font-bold disabled:opacity-50">
          <Play className="w-4 h-4"/>Traverse
        </motion.button>
        <motion.button onClick={() => { setTraversalOrder([]); setHighlighted(null); }} whileHover={{ scale:1.05 }} className="p-2 rounded-lg transition-colors" style={{ color:TEXT2 }}>
          <RotateCcw className="w-4 h-4"/>
        </motion.button>
      </div>

      <div className="relative overflow-hidden rounded-xl" style={{ height:"340px", background:CANVAS, border:`1px solid ${CBORD}` }}>
        <svg width="100%" height="100%" viewBox="0 0 640 320">
          {EDGES.map(([from,to],i) => {
            const f = NODE_POSITIONS[from];
            const t = NODE_POSITIONS[to];
            return (
              <motion.line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                stroke={highlighted===from||highlighted===to?"#f59e0b":edgeCol}
                strokeWidth={highlighted===from||highlighted===to?2:1.5}
                animate={{ stroke:highlighted===from||highlighted===to?"#f59e0b":edgeCol }}
                transition={{ duration:0.2 }}
              />
            );
          })}
          {Object.entries(NODE_POSITIONS).map(([val,pos]) => {
            const numVal = parseInt(val);
            const isHL = highlighted === numVal;
            const isDone = traversalOrder.includes(numVal) && !isHL;
            return (
              <g key={val}>
                {isHL && (
                  <motion.circle cx={pos.x} cy={pos.y} r="26"
                    fill="rgba(245,158,11,0.15)"
                    animate={{ r:[22,30,22],opacity:[0.4,0.8,0.4] }}
                    transition={{ duration:0.6,repeat:Infinity }}
                  />
                )}
                <motion.circle cx={pos.x} cy={pos.y} r="22"
                  fill={isHL?"rgba(245,158,11,0.25)":isDone?"rgba(16,185,129,0.15)":nodeFill}
                  stroke={isHL?"#f59e0b":isDone?"#10b981":edgeCol}
                  strokeWidth={isHL?2.5:isDone?2:1.5}
                  animate={{ fill:isHL?"rgba(245,158,11,0.25)":isDone?"rgba(16,185,129,0.15)":nodeFill }}
                  transition={{ duration:0.3 }}
                  style={isHL?{filter:"drop-shadow(0 0 8px rgba(245,158,11,0.7))"}:isDone?{filter:"drop-shadow(0 0 5px rgba(16,185,129,0.4))"}:{}}
                />
                <text x={pos.x} y={pos.y+1} textAnchor="middle" dominantBaseline="middle"
                  fill={isHL?"#f59e0b":isDone?"#10b981":TEXT1} fontSize="12" fontWeight="bold" fontFamily="monospace">
                  {val}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Traversal info overlay */}
        <div className="absolute top-3 left-3 backdrop-blur-sm rounded-lg p-3" style={{ background: overlayBg, border:`1px solid ${isDark?"rgba(255,255,255,0.05)":"rgba(15,23,42,0.1)"}` }}>
          <div className="text-xs mb-1 uppercase tracking-wider font-bold" style={{ color:TEXT2 }}>{mode}</div>
          <div className="text-xs font-mono" style={{ color:isDark?"#9ca3af":"#64748b" }}>
            {mode==="inorder"&&"Left → Root → Right"}
            {mode==="preorder"&&"Root → Left → Right"}
            {mode==="postorder"&&"Left → Right → Root"}
          </div>
        </div>
      </div>

      {traversalOrder.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs uppercase tracking-wider" style={{ color:TEXT2 }}>Order:</span>
          {traversalOrder.map((val,i) => (
            <motion.div key={`${val}-${i}`} initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} className="flex items-center gap-1">
              <span className="w-8 h-8 rounded-full bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-xs font-bold text-[#10b981] font-mono">{val}</span>
              {i<traversalOrder.length-1 && <ChevronRight className="w-3 h-3" style={{ color:TEXT2 }}/>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── MAIN PAGE ───────────────────────────────────────────────────────────────

const VIZ_TABS: { id: VizType; label: string; icon: LucideIcon; color: string; desc: string }[] = [
  { id:"linkedlist", label:"Linked List", icon:Layers, color:"#f59e0b", desc:"Node traversal & pointer manipulation" },
  { id:"graph", label:"Graph", icon:Network, color:"#8b5cf6", desc:"BFS / DFS traversal" },
  { id:"tree", label:"Binary Tree", icon:GitBranch, color:"#06b6d4", desc:"Inorder / Preorder / Postorder" },
  { id:"sorting", label:"Sorting", icon:BarChart2, color:"#10b981", desc:"Bubble / Selection / Insertion" },
];

export default function VisualizerPage() {
  const [activeViz, setActiveViz] = useState<VizType>("linkedlist");
  const headerRef = useRef<HTMLDivElement>(null);
  const { isDark } = useTheme();

  const BG     = isDark ? "#070d1b"                : "#f4f6f9";
  const CARD   = isDark ? "rgba(11,19,38,0.95)"   : "rgba(255,255,255,0.97)";
  const BORDER = isDark ? "rgba(255,255,255,0.07)" : "rgba(15,23,42,0.09)";
  const TEXT1  = isDark ? "#ffffff"               : "#0f172a";
  const TEXT2  = isDark ? "#6b7280"               : "#64748b";

  useEffect(() => {
    gsap.fromTo(headerRef.current, { y:-20, opacity:0 }, { y:0, opacity:1, duration:0.6, ease:"power3.out" });
  }, []);

  const activeTab = VIZ_TABS.find(t => t.id === activeViz)!;

  return (
    <div style={{ minHeight: "100vh", background: BG, color: TEXT1 }}>
      <Navbar />
      <div style={{ height: "74px" }} />

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "32px 28px 64px" }}>

        {/* ── Header ── */}
        <div ref={headerRef} style={{ marginBottom: "28px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            <div style={{
              width: "44px", height: "44px", borderRadius: "12px", flexShrink: 0,
              background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap style={{ width: "20px", height: "20px", color: "#f59e0b" }} />
            </div>
            <div>
              <h1 style={{ fontSize: "22px", fontWeight: 900, margin: 0, color: TEXT1 }}>DSA Visualizer</h1>
              <p style={{ fontSize: "13px", color: TEXT2, margin: 0 }}>Watch algorithms run step-by-step</p>
            </div>
          </div>
        </div>

        {/* ── Tab selector ── */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "24px",
        }}>
          {VIZ_TABS.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveViz(tab.id)}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.97 }}
              style={{
                padding: "16px",
                borderRadius: "12px",
                textAlign: "left",
                cursor: "pointer",
                transition: "all 0.2s",
                ...(activeViz === tab.id
                  ? { background: `${tab.color}0d`, border: `1px solid ${tab.color}40`, boxShadow: `0 0 20px ${tab.color}15` }
                  : { background: CARD, border: `1px solid ${BORDER}` }),
              }}
            >
              <tab.icon style={{ width: "18px", height: "18px", marginBottom: "8px", color: activeViz === tab.id ? tab.color : TEXT2 }} />
              <div style={{ fontSize: "13px", fontWeight: 600, color: activeViz === tab.id ? tab.color : TEXT1 }}>{tab.label}</div>
              <div style={{ fontSize: "11px", marginTop: "3px", color: TEXT2 }}>{tab.desc}</div>
            </motion.button>
          ))}
        </div>

        {/* ── Visualization area ── */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeViz}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            transition={{ duration: 0.25 }}
            style={{ padding: "24px", borderRadius: "16px", background: CARD, border: `1px solid ${BORDER}`, marginBottom: "20px" }}
          >
            {/* Card header */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px", paddingBottom: "16px", borderBottom: `1px solid ${BORDER}` }}>
              <div style={{ width: "32px", height: "32px", borderRadius: "8px", flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "center", background: `${activeTab.color}15`, border: `1px solid ${activeTab.color}30` }}>
                <activeTab.icon style={{ width: "15px", height: "15px", color: activeTab.color }} />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: TEXT1 }}>{activeTab.label}</div>
                <div style={{ fontSize: "11px", color: TEXT2 }}>{activeTab.desc}</div>
              </div>
              <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#10b981", background: "rgba(16,185,129,0.1)", padding: "4px 10px", borderRadius: "999px", border: "1px solid rgba(16,185,129,0.2)" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "999px", background: "#10b981", display: "inline-block" }} />
                Interactive
              </div>
            </div>

            {activeViz === "linkedlist" && <LinkedListViz />}
            {activeViz === "graph"      && <GraphViz />}
            {activeViz === "tree"       && <TreeViz />}
            {activeViz === "sorting"    && <SortingViz />}
          </motion.div>
        </AnimatePresence>

        {/* ── Algorithm info cards ── */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
          {[
            { label: "Linked List", ops: ["Insert Head: O(1)", "Insert Tail: O(n)", "Delete: O(n)", "Access: O(n)"],       color: "#f59e0b" },
            { label: "Graph (BFS)", ops: ["Time: O(V + E)",    "Space: O(V)",        "Uses: Queue",    "Finds: Shortest path"], color: "#8b5cf6" },
            { label: "Binary Tree", ops: ["Insert: O(log n)",  "Search: O(log n)",   "Inorder = sorted","Height: O(log n)"],   color: "#06b6d4" },
            { label: "Bubble Sort", ops: ["Best: O(n)",         "Avg: O(n²)",          "Worst: O(n²)",   "Space: O(1) in-place"], color: "#10b981" },
          ].map((card, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }} transition={{ delay: i * 0.08 }}
              style={{ padding: "16px", borderRadius: "12px", background: CARD, border: `1px solid ${card.color}25` }}
            >
              <div style={{ fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.09em", color: card.color, marginBottom: "12px" }}>
                {card.label}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "7px" }}>
                {card.ops.map((op, j) => (
                  <div key={j} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: TEXT2 }}>
                    <div style={{ width: "4px", height: "4px", borderRadius: "999px", flexShrink: 0, background: card.color }} />
                    {op}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </div>
  );
}
