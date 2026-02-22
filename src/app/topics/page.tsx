"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import {
  Search, BookOpen, Code2, Zap, Brain, Target, ChevronRight,
  Play, Lock, CheckCircle2, Star, Clock, BarChart3, Filter,
  Layers, GitBranch, Network, TrendingUp, ArrowUpRight
} from "lucide-react";

const CURRICULUM = [
  {
    category: "Fundamentals",
    icon: Layers,
    color: "#f59e0b",
    glow: "rgba(245,158,11,0.15)",
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
    glow: "rgba(139,92,246,0.15)",
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
    glow: "rgba(6,182,212,0.15)",
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
    glow: "rgba(16,185,129,0.15)",
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
    glow: "rgba(236,72,153,0.15)",
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
    glow: "rgba(245,158,11,0.15)",
    topics: [
      { name:"Dynamic Programming", difficulty:"Hard", time:"120 min", done:false, score:0, problems:["0/1 Knapsack","LCS","Edit Distance"] },
      { name:"Backtracking", difficulty:"Hard", time:"90 min", done:false, score:0, problems:["N-Queens","Sudoku","Subset Sum"] },
      { name:"Segment Trees", difficulty:"Hard", time:"80 min", done:false, score:0, problems:["Range Query","Lazy Propagation","Point Update"] },
    ],
  },
];

const DIFFICULTY_COLOR: Record<string,string> = { Easy:"#10b981", Medium:"#f59e0b", Hard:"#ef4444" };
const DIFFICULTY_BG: Record<string,string> = { Easy:"rgba(16,185,129,0.1)", Medium:"rgba(245,158,11,0.1)", Hard:"rgba(239,68,68,0.1)" };

export default function TopicsPage() {
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all"|"done"|"todo"|"Easy"|"Medium"|"Hard">("all");
  const [expandedTopic, setExpandedTopic] = useState<string | null>(null);

  const totalTopics = CURRICULUM.reduce((a,c) => a + c.topics.length, 0);
  const doneTopics = CURRICULUM.reduce((a,c) => a + c.topics.filter(t=>t.done).length, 0);

  const filteredCurriculum = CURRICULUM.map(cat => ({
    ...cat,
    topics: cat.topics.filter(t => {
      const matchSearch = !search || t.name.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter==="all" || (filter==="done"&&t.done) || (filter==="todo"&&!t.done) || filter===t.difficulty;
      return matchSearch && matchFilter;
    })
  })).filter(cat => cat.topics.length > 0);

  useEffect(() => {
    gsap.fromTo(".topic-card", { y:20,opacity:0 }, { y:0,opacity:1,stagger:0.06,duration:0.5,ease:"power3.out" });
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <Navbar/>
      <div className="h-16" />
      <div className="pb-16 w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-8">

        {/* Header */}
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <span className="text-[#f59e0b] text-sm font-semibold uppercase tracking-widest">DSA Curriculum</span>
              <h1 className="text-4xl font-black text-white mt-1">All <span className="gold-text">Topics</span></h1>
              <p className="text-gray-400 mt-1">{doneTopics} of {totalTopics} topics completed</p>
            </div>
            {/* Overall progress */}
            <div className="flex items-center gap-3 p-4 rounded-xl bg-white/3 border border-white/6">
              <div className="relative w-14 h-14">
                <svg viewBox="0 0 48 48" className="-rotate-90 w-full h-full">
                  <circle cx="24" cy="24" r="20" fill="none" stroke="#1e1e3a" strokeWidth="4"/>
                  <motion.circle cx="24" cy="24" r="20" fill="none" stroke="#f59e0b" strokeWidth="4" strokeLinecap="round"
                    initial={{ strokeDasharray:`0 126` }}
                    animate={{ strokeDasharray:`${(doneTopics/totalTopics)*126} 126` }}
                    transition={{ duration:1.5,ease:"easeOut",delay:0.3 }}
                    style={{ filter:"drop-shadow(0 0 4px rgba(245,158,11,0.5))" }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-xs font-black gold-text">{Math.round((doneTopics/totalTopics)*100)}%</span>
                </div>
              </div>
              <div>
                <div className="text-white font-bold">{doneTopics}/{totalTopics}</div>
                <div className="text-xs text-gray-500">Completed</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Search & Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500"/>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search topics..."
              className="w-full bg-white/3 border border-white/6 focus:border-[#f59e0b]/40 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 outline-none transition-all duration-200"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {(["all","done","todo","Easy","Medium","Hard"] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className={`px-3 py-2 rounded-xl text-xs font-semibold capitalize transition-all duration-200 ${filter===f?"text-black":"text-gray-400 bg-white/3 border border-white/6 hover:text-white hover:border-white/10"}`}
                style={filter===f ? { background:f==="Easy"?"#10b981":f==="Medium"?"#f59e0b":f==="Hard"?"#ef4444":f==="done"?"#10b981":"#f59e0b",color:"black" } : {}}
              >
                {f==="all"?<><Filter className="w-3 h-3 inline mr-1"/>All</>:f}
              </button>
            ))}
          </div>
        </div>

        {/* Topic categories */}
        <div className="flex flex-col gap-6">
          {filteredCurriculum.map((cat,ci) => (
            <motion.div key={cat.category} initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ delay:ci*0.07 }}>
              {/* Category header */}
              <div className="flex items-center gap-3 mb-4">
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background:cat.glow,border:`1px solid ${cat.color}30` }}>
                  <cat.icon className="w-4 h-4" style={{ color:cat.color }}/>
                </div>
                <h2 className="text-lg font-bold text-white">{cat.category}</h2>
                <span className="text-xs text-gray-500">{cat.topics.filter(t=>t.done).length}/{cat.topics.length} done</span>
                <div className="flex-1 h-px bg-[#1e1e3a] ml-2"/>
              </div>

              {/* Topic grid */}
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                {cat.topics.map((topic,ti) => (
                  <motion.div
                    key={topic.name}
                    className="topic-card group relative p-4 rounded-xl border transition-all duration-300 cursor-pointer"
                    style={{
                      background: topic.done ? `${cat.color}08` : "rgba(255,255,255,0.02)",
                      borderColor: expandedTopic===topic.name ? `${cat.color}40` : topic.done ? `${cat.color}20` : "rgba(255,255,255,0.06)",
                    }}
                    whileHover={{ y:-2, borderColor:`${cat.color}40`, boxShadow:`0 8px 30px ${cat.glow}` }}
                    onClick={() => setExpandedTopic(expandedTopic===topic.name ? null : topic.name)}
                  >
                    {/* Done indicator */}
                    {topic.done && (
                      <div className="absolute top-3 right-3">
                        <CheckCircle2 className="w-4 h-4 text-[#10b981]"/>
                      </div>
                    )}

                    <div className="mb-3">
                      <div className="font-semibold text-sm text-white mb-1">{topic.name}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background:DIFFICULTY_BG[topic.difficulty],color:DIFFICULTY_COLOR[topic.difficulty] }}>{topic.difficulty}</span>
                        <span className="text-[10px] text-gray-500 flex items-center gap-1"><Clock className="w-2.5 h-2.5"/>{topic.time}</span>
                      </div>
                    </div>

                    {/* Progress bar */}
                    {topic.done ? (
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-500">Score</span>
                          <span style={{ color:cat.color }} className="font-bold">{topic.score}%</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-[#1e1e3a] overflow-hidden">
                          <motion.div className="h-full rounded-full" initial={{ width:0 }} animate={{ width:`${topic.score}%` }} transition={{ duration:1,delay:ti*0.1 }} style={{ background:`linear-gradient(90deg,${cat.color},${cat.color}80)` }}/>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-600 flex items-center gap-1">
                          <BookOpen className="w-3 h-3"/>{topic.problems.length} problems
                        </span>
                        <Link href="/learn" onClick={e => e.stopPropagation()}>
                          <motion.span whileHover={{ scale:1.1 }} className="text-xs font-medium flex items-center gap-1 px-2 py-1 rounded-lg" style={{ color:cat.color,background:`${cat.color}15` }}>
                            <Play className="w-3 h-3"/>Start
                          </motion.span>
                        </Link>
                      </div>
                    )}

                    {/* Expanded problems */}
                    <AnimatePresence>
                      {expandedTopic === topic.name && (
                        <motion.div initial={{ height:0,opacity:0 }} animate={{ height:"auto",opacity:1 }} exit={{ height:0,opacity:0 }} transition={{ duration:0.2 }} className="overflow-hidden mt-3 pt-3 border-t border-white/5">
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-2">Problems</p>
                          {topic.problems.map((prob,pi) => (
                            <Link key={pi} href="/learn">
                              <div className="flex items-center justify-between py-1.5 text-xs text-gray-400 hover:text-white transition-colors group/prob">
                                <span className="flex items-center gap-1.5">
                                  <div className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background:cat.color }}/>
                                  {prob}
                                </span>
                                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover/prob:opacity-100 transition-opacity" style={{ color:cat.color }}/>
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

        {filteredCurriculum.length === 0 && (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-gray-600 mx-auto mb-4"/>
            <p className="text-gray-400">No topics found matching &quot;{search}&quot;</p>
            <button onClick={() => { setSearch(""); setFilter("all"); }} className="mt-4 text-[#f59e0b] text-sm hover:underline">Clear filters</button>
          </div>
        )}

        {/* Bottom CTA */}
        <motion.div initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} className="mt-12 p-6 rounded-2xl border border-[#f59e0b]/20 bg-[#f59e0b]/4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-white text-lg flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#f59e0b]"/>Ready to level up?</h3>
            <p className="text-sm text-gray-400 mt-1">Your AI tutor is waiting. Pick a topic and start learning.</p>
          </div>
          <div className="flex gap-3">
            <Link href="/visualizer">
              <motion.button whileHover={{ scale:1.05 }} className="flex items-center gap-2 px-4 py-2.5 border border-[#f59e0b]/30 text-[#f59e0b] rounded-xl text-sm font-semibold hover:bg-[#f59e0b]/10 transition-all">
                <Code2 className="w-4 h-4"/>Visualize
              </motion.button>
            </Link>
            <Link href="/learn">
              <motion.button whileHover={{ scale:1.05,boxShadow:"0 0 20px rgba(245,158,11,0.4)" }} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black rounded-xl text-sm font-bold">
                <Play className="w-4 h-4"/>Start Learning<ChevronRight className="w-4 h-4"/>
              </motion.button>
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
