"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { type LucideIcon } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
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
            className="w-20 bg-[#13131f] border border-[#1e1e3a] focus:border-[#f59e0b]/40 rounded-lg px-3 py-2 text-sm text-white outline-none"
          />
          <motion.button onClick={addNode} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="flex items-center gap-1.5 px-3 py-2 bg-[#f59e0b]/10 border border-[#f59e0b]/30 text-[#f59e0b] rounded-lg text-sm font-medium hover:bg-[#f59e0b]/20 transition-colors">
            <Plus className="w-4 h-4"/>Add Node
          </motion.button>
        </div>
        <motion.button onClick={traverse} disabled={isAnimating} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="flex items-center gap-1.5 px-3 py-2 bg-[#8b5cf6]/10 border border-[#8b5cf6]/30 text-[#8b5cf6] rounded-lg text-sm font-medium hover:bg-[#8b5cf6]/20 transition-colors disabled:opacity-50">
          <Play className="w-4 h-4"/>Traverse
        </motion.button>
        <motion.button onClick={() => setNodes([{ id:1,value:12 },{ id:2,value:8 },{ id:3,value:23 },{ id:4,value:5 },{ id:5,value:17 }])} whileHover={{ scale:1.05 }} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
          <RotateCcw className="w-4 h-4"/>
        </motion.button>
        {operation && <span className="text-xs text-[#f59e0b] px-2 py-1 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/20">{operation}</span>}
      </div>

      {/* Visualization */}
      <div className="relative overflow-x-auto pb-4">
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
                    className={`w-16 h-16 rounded-xl flex flex-col items-center justify-center border-2 transition-all duration-300 cursor-pointer ${animStep === i ? "border-[#f59e0b] bg-[#f59e0b]/20" : node.highlighted ? "border-[#10b981] bg-[#10b981]/15" : "border-[#2a2a4a] bg-[#13131f] hover:border-[#f59e0b]/50"}`}
                    style={animStep === i ? { boxShadow:"0 0 20px rgba(245,158,11,0.5)" } : {}}
                  >
                    <div className="text-xs text-gray-500 font-mono">val</div>
                    <div className={`text-lg font-black font-mono ${animStep===i?"text-[#f59e0b]":node.highlighted?"text-[#10b981]":"text-white"}`}>{node.value}</div>
                    <div className="text-[9px] text-gray-600 font-mono">next→</div>
                  </div>
                  {/* Delete button */}
                  <button onClick={() => removeNode(node.id)} className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-[#ef4444] text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs">
                    <Trash2 className="w-2.5 h-2.5"/>
                  </button>
                  {/* Index label */}
                  <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-600 font-mono">[{i}]</div>
                </motion.div>

                {/* Arrow */}
                {i < nodes.length - 1 && (
                  <motion.div
                    className="flex items-center mx-1 flex-shrink-0"
                    animate={animStep === i ? { opacity:[0.5,1,0.5] } : { opacity:0.5 }}
                    transition={animStep === i ? { duration:0.4,repeat:0 } : {}}
                  >
                    <div className={`h-px w-8 ${animStep===i?"bg-[#f59e0b]":"bg-[#2a2a4a]"} transition-colors duration-300`}/>
                    <div className={`w-0 h-0 border-t-[5px] border-b-[5px] border-l-[8px] border-t-transparent border-b-transparent ${animStep===i?"border-l-[#f59e0b]":"border-l-[#2a2a4a]"} transition-colors duration-300`}/>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Null */}
          <div className="flex items-center ml-1 flex-shrink-0">
            <div className="h-px w-6 bg-[#2a2a4a]"/>
            <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[8px] border-t-transparent border-b-transparent border-l-[#2a2a4a]"/>
            <span className="ml-2 text-sm font-mono text-gray-600 font-bold">null</span>
          </div>
        </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-[#f59e0b] bg-[#f59e0b]/20"/><span className="text-[#f59e0b]">Active</span></span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-[#10b981] bg-[#10b981]/20"/><span>Newly added</span></span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded border-2 border-[#2a2a4a] bg-[#13131f]"/><span>Normal</span></span>
      </div>
    </div>
  );
}

// ─── GRAPH VISUALIZATION ─────────────────────────────────────────────────────

interface GraphNode { id: string; x: number; y: number; visited?: boolean; inQueue?: boolean; distance?: number }
interface GraphEdge { from: string; to: string; highlighted?: boolean; weight?: number }

function GraphViz() {
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
          <button key={m} onClick={() => { setMode(m); resetViz(); }} className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${mode===m?"bg-[#8b5cf6]/15 text-[#8b5cf6] border border-[#8b5cf6]/30":"text-gray-400 border border-transparent hover:text-white hover:bg-white/5"}`}>
            {m.toUpperCase()}
          </button>
        ))}
        <motion.button onClick={() => { resetViz(); if (mode==="bfs") runBFS(); else runDFS(); }} disabled={isRunning} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black rounded-lg text-sm font-bold disabled:opacity-50">
          <Play className="w-4 h-4"/>Run {mode.toUpperCase()}
        </motion.button>
        <motion.button onClick={resetViz} whileHover={{ scale:1.05 }} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
          <RotateCcw className="w-4 h-4"/>
        </motion.button>
        {queue.length > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-400 bg-[#8b5cf6]/10 px-3 py-1.5 rounded-full border border-[#8b5cf6]/20">
            <span className="text-[#8b5cf6] font-semibold">{mode==="bfs"?"Queue":"Stack"}:</span>
            {queue.map(n => <span key={n} className="font-mono text-white">{n}</span>)}
          </div>
        )}
      </div>

      {/* SVG Canvas */}
      <div className="relative overflow-hidden rounded-xl dsa-canvas border border-[#1e1e3a]" style={{ height:"380px" }}>
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
                stroke={isActive ? "#f59e0b" : "#2a2a4a"}
                strokeWidth={isActive ? 2.5 : 1.5}
                animate={{ stroke: isActive ? "#f59e0b" : "#2a2a4a", strokeWidth: isActive ? 2.5 : 1.5 }}
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
                  fill={isCurrent ? "rgba(245,158,11,0.3)" : isVisited ? "rgba(16,185,129,0.2)" : isInQueue ? "rgba(139,92,246,0.2)" : "rgba(19,19,31,0.9)"}
                  stroke={isCurrent ? "#f59e0b" : isVisited ? "#10b981" : isInQueue ? "#8b5cf6" : "#2a2a4a"}
                  strokeWidth={isCurrent ? 2.5 : 2}
                  animate={{
                    fill: isCurrent ? "rgba(245,158,11,0.3)" : isVisited ? "rgba(16,185,129,0.2)" : "rgba(19,19,31,0.9)",
                    stroke: isCurrent ? "#f59e0b" : isVisited ? "#10b981" : "#2a2a4a",
                  }}
                  transition={{ duration:0.3 }}
                  style={isCurrent ? { filter:"drop-shadow(0 0 8px rgba(245,158,11,0.7))" } : isVisited ? { filter:"drop-shadow(0 0 5px rgba(16,185,129,0.4))" } : {}}
                />
                <text x={node.x} y={node.y+1} textAnchor="middle" dominantBaseline="middle" fill={isCurrent?"#f59e0b":isVisited?"#10b981":"white"} fontSize="13" fontWeight="bold" fontFamily="monospace">
                  {node.id}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend overlay */}
        <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-[#0e0e1a]/80 backdrop-blur-sm rounded-lg p-2.5 border border-white/5">
          {[
            { color:"#f59e0b", label:"Current" },
            { color:"#10b981", label:"Visited" },
            { color:"#8b5cf6", label:"In Queue" },
          ].map(l => (
            <div key={l.label} className="flex items-center gap-2 text-xs text-gray-400">
              <div className="w-3 h-3 rounded-full" style={{ background:l.color, boxShadow:`0 0 6px ${l.color}` }}/>
              {l.label}
            </div>
          ))}
        </div>
      </div>

      {/* Traversal order */}
      {order.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Visit order:</span>
          {order.map((node,i) => (
            <motion.div key={`${node}-${i}`} initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} className="flex items-center gap-1">
              <span className="w-7 h-7 rounded-full bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-xs font-bold text-[#10b981] font-mono">{node}</span>
              {i < order.length-1 && <ChevronRight className="w-3 h-3 text-gray-600"/>}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── SORTING VISUALIZATION ───────────────────────────────────────────────────

function SortingViz() {
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
          <button key={alg} onClick={() => setAlgorithm(alg)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${algorithm===alg?"bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/30":"text-gray-400 border border-transparent hover:text-white hover:bg-white/5"}`}>
            {alg} Sort
          </button>
        ))}
        <motion.button onClick={runSort} disabled={isRunning} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black rounded-lg text-sm font-bold disabled:opacity-50">
          <Play className="w-4 h-4"/>Sort
        </motion.button>
        <motion.button onClick={randomize} disabled={isRunning} whileHover={{ scale:1.05 }} className="flex items-center gap-1.5 px-3 py-2 border border-[#1e1e3a] text-gray-400 hover:text-white rounded-lg text-sm hover:bg-white/5 transition-colors disabled:opacity-50">
          <Zap className="w-4 h-4"/>Randomize
        </motion.button>
        {stepCount > 0 && <span className="text-xs text-gray-500">Comparisons: <span className="text-[#f59e0b] font-bold">{stepCount}</span></span>}
      </div>

      {/* Bars */}
      <div className="relative h-56 flex items-end justify-center gap-3 px-4 dsa-canvas rounded-xl border border-[#1e1e3a] py-4">
        {arr.map((val, i) => {
          const isComparing = comparing.includes(i);
          const isSorted = sorted.includes(i);
          const height = `${(val / maxVal) * 85}%`;
          return (
            <motion.div key={`${i}-${val}`} layout className="flex flex-col items-center gap-1 flex-1 max-w-[56px]" style={{ height:"100%", justifyContent:"flex-end" }}>
              <span className="text-xs text-gray-500 font-mono">{val}</span>
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
      <div className="flex gap-4 text-xs text-gray-500">
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background:"linear-gradient(180deg,#f59e0b,#d97706)" }}/><span className="text-[#f59e0b]">Comparing</span></span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background:"linear-gradient(180deg,#10b981,#059669)" }}/><span className="text-[#10b981]">Sorted</span></span>
        <span className="flex items-center gap-1.5"><div className="w-3 h-3 rounded" style={{ background:"linear-gradient(180deg,#3a3a6a,#252545)" }}/><span>Unsorted</span></span>
        <div className="ml-auto text-gray-600">
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
          <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-lg text-sm font-medium capitalize transition-all duration-200 ${mode===m?"bg-[#06b6d4]/15 text-[#06b6d4] border border-[#06b6d4]/30":"text-gray-400 border border-transparent hover:text-white hover:bg-white/5"}`}>
            {m}
          </button>
        ))}
        <motion.button onClick={runTraversal} disabled={isRunning} whileHover={{ scale:1.05 }} whileTap={{ scale:0.95 }} className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black rounded-lg text-sm font-bold disabled:opacity-50">
          <Play className="w-4 h-4"/>Traverse
        </motion.button>
        <motion.button onClick={() => { setTraversalOrder([]); setHighlighted(null); }} whileHover={{ scale:1.05 }} className="p-2 text-gray-500 hover:text-white rounded-lg hover:bg-white/5 transition-colors">
          <RotateCcw className="w-4 h-4"/>
        </motion.button>
      </div>

      <div className="relative overflow-hidden rounded-xl dsa-canvas border border-[#1e1e3a]" style={{ height:"340px" }}>
        <svg width="100%" height="100%" viewBox="0 0 640 320">
          {EDGES.map(([from,to],i) => {
            const f = NODE_POSITIONS[from];
            const t = NODE_POSITIONS[to];
            return (
              <motion.line key={i} x1={f.x} y1={f.y} x2={t.x} y2={t.y}
                stroke={highlighted===from||highlighted===to?"#f59e0b":"#2a2a4a"}
                strokeWidth={highlighted===from||highlighted===to?2:1.5}
                animate={{ stroke:highlighted===from||highlighted===to?"#f59e0b":"#2a2a4a" }}
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
                  fill={isHL?"rgba(245,158,11,0.25)":isDone?"rgba(16,185,129,0.15)":"rgba(13,13,26,0.9)"}
                  stroke={isHL?"#f59e0b":isDone?"#10b981":"#2a2a4a"}
                  strokeWidth={isHL?2.5:isDone?2:1.5}
                  animate={{ fill:isHL?"rgba(245,158,11,0.25)":isDone?"rgba(16,185,129,0.15)":"rgba(13,13,26,0.9)" }}
                  transition={{ duration:0.3 }}
                  style={isHL?{filter:"drop-shadow(0 0 8px rgba(245,158,11,0.7))"}:isDone?{filter:"drop-shadow(0 0 5px rgba(16,185,129,0.4))"}:{}}
                />
                <text x={pos.x} y={pos.y+1} textAnchor="middle" dominantBaseline="middle"
                  fill={isHL?"#f59e0b":isDone?"#10b981":"white"} fontSize="12" fontWeight="bold" fontFamily="monospace">
                  {val}
                </text>
              </g>
            );
          })}
        </svg>

        {/* Traversal info overlay */}
        <div className="absolute top-3 left-3 bg-[#0e0e1a]/80 backdrop-blur-sm rounded-lg p-3 border border-white/5">
          <div className="text-xs text-gray-500 mb-1 uppercase tracking-wider">{mode}</div>
          <div className="text-xs text-gray-400 font-mono">
            {mode==="inorder"&&"Left → Root → Right"}
            {mode==="preorder"&&"Root → Left → Right"}
            {mode==="postorder"&&"Left → Right → Root"}
          </div>
        </div>
      </div>

      {traversalOrder.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-gray-500 uppercase tracking-wider">Order:</span>
          {traversalOrder.map((val,i) => (
            <motion.div key={`${val}-${i}`} initial={{ scale:0.5,opacity:0 }} animate={{ scale:1,opacity:1 }} className="flex items-center gap-1">
              <span className="w-8 h-8 rounded-full bg-[#10b981]/15 border border-[#10b981]/40 flex items-center justify-center text-xs font-bold text-[#10b981] font-mono">{val}</span>
              {i<traversalOrder.length-1 && <ChevronRight className="w-3 h-3 text-gray-600"/>}
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

  useEffect(() => {
    gsap.fromTo(headerRef.current, { y:-20,opacity:0 }, { y:0,opacity:1,duration:0.6,ease:"power3.out" });
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <Navbar/>
      <div className="h-16" />
      <div className="pb-16 w-full px-4 sm:px-8 lg:px-12 pt-8 max-w-[1600px] mx-auto">

        {/* Header */}
        <div ref={headerRef} className="mb-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-[#f59e0b]/10 border border-[#f59e0b]/20 flex items-center justify-center">
              <Zap className="w-5 h-5 text-[#f59e0b]"/>
            </div>
            <div>
              <h1 className="text-2xl font-black text-white">DSA Visualizer</h1>
              <p className="text-sm text-gray-400">Watch algorithms run step-by-step</p>
            </div>
          </div>
        </div>

        {/* Tab selector */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
          {VIZ_TABS.map(tab => (
            <motion.button
              key={tab.id}
              onClick={() => setActiveViz(tab.id)}
              whileHover={{ y:-2 }}
              whileTap={{ scale:0.97 }}
              className={`p-4 rounded-xl border text-left transition-all duration-200 ${activeViz===tab.id?"border-opacity-60":"border-white/6 bg-white/3 hover:border-white/10"}`}
              style={activeViz===tab.id ? { background:`${tab.color}0d`,borderColor:`${tab.color}40`,boxShadow:`0 0 20px ${tab.color}15` } : {}}
            >
              <tab.icon className="w-5 h-5 mb-2" style={{ color:activeViz===tab.id?tab.color:"#6b7280" }}/>
              <div className="font-semibold text-sm" style={{ color:activeViz===tab.id?tab.color:"white" }}>{tab.label}</div>
              <div className="text-[11px] text-gray-500 mt-0.5">{tab.desc}</div>
            </motion.button>
          ))}
        </div>

        {/* Visualization area */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeViz}
            initial={{ opacity:0, y:20 }}
            animate={{ opacity:1, y:0 }}
            exit={{ opacity:0, y:-20 }}
            transition={{ duration:0.3 }}
            className="p-6 rounded-2xl bg-white/3 backdrop-blur-xl border border-white/6"
          >
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/6">
              {(() => { const t = VIZ_TABS.find(t=>t.id===activeViz)!; return (
                <>
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:`${t.color}15`,border:`1px solid ${t.color}30` }}>
                    <t.icon className="w-4 h-4" style={{ color:t.color }}/>
                  </div>
                  <div>
                    <h2 className="font-bold text-white">{t.label}</h2>
                    <p className="text-xs text-gray-500">{t.desc}</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1.5 text-xs text-[#10b981] bg-[#10b981]/10 px-2 py-1 rounded-full border border-[#10b981]/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"/>Interactive
                  </div>
                </>
              ); })()}
            </div>

            {activeViz === "linkedlist" && <LinkedListViz/>}
            {activeViz === "graph" && <GraphViz/>}
            {activeViz === "tree" && <TreeViz/>}
            {activeViz === "sorting" && <SortingViz/>}
          </motion.div>
        </AnimatePresence>

        {/* Algorithm info cards */}
        <div className="mt-6 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label:"Linked List", ops:["Insert Head: O(1)","Insert Tail: O(n)","Delete: O(n)","Access: O(n)"], color:"#f59e0b" },
            { label:"Graph (BFS)", ops:["Time: O(V + E)","Space: O(V)","Uses: Queue","Finds: Shortest path"], color:"#8b5cf6" },
            { label:"Binary Tree", ops:["Insert: O(log n)","Search: O(log n)","Inorder = sorted","Height: O(log n)"], color:"#06b6d4" },
            { label:"Bubble Sort", ops:["Best: O(n)","Avg: O(n²)","Worst: O(n²)","Space: O(1) in-place"], color:"#10b981" },
          ].map((card,i) => (
            <motion.div key={i} initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:i*0.1 }} className="p-4 rounded-xl bg-white/3 border border-white/6 hover:border-opacity-50 transition-all duration-200" style={{ borderColor:`${card.color}15` }}>
              <div className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color:card.color }}>{card.label}</div>
              <div className="flex flex-col gap-1.5">
                {card.ops.map((op,j) => (
                  <div key={j} className="flex items-center gap-2 text-xs text-gray-400">
                    <div className="w-1 h-1 rounded-full flex-shrink-0" style={{ background:card.color }}/>
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
