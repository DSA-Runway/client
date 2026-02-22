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
  BookOpen, Target, TrendingUp, Award, Sparkles, Bot
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
  { icon: Brain, title: "Multi-Agent AI Architecture", desc: "5 specialized agents — Teacher, Assessment, Feedback, Learning Path & Orchestrator — collaborate to deliver structured DSA tutoring.", color: "#f59e0b", glow: "rgba(245,158,11,0.12)" },
  { icon: GitBranch, title: "Live DSA Visualizations", desc: "Watch algorithms execute step-by-step with animated linked lists, trees, graphs, and sorting algorithms.", color: "#8b5cf6", glow: "rgba(139,92,246,0.12)" },
  { icon: Upload, title: "Multimodal Input", desc: "Upload handwritten solutions, diagrams, PDFs. Talk to your tutor via voice. Get instant structured feedback.", color: "#06b6d4", glow: "rgba(6,182,212,0.12)" },
  { icon: Target, title: "RAG-Powered Accuracy", desc: "Retrieval-Augmented Generation ensures every response is grounded in your DSA syllabus — zero hallucinations.", color: "#10b981", glow: "rgba(16,185,129,0.12)" },
  { icon: TrendingUp, title: "Persistent Learner Profile", desc: "Tracks mastery levels, recurring mistakes, and conceptual gaps across sessions for true personalization.", color: "#ec4899", glow: "rgba(236,72,153,0.12)" },
  { icon: Zap, title: "Socratic Teaching Style", desc: "Guides with questions instead of giving answers. Encourages deep reasoning and problem-solving skills.", color: "#f59e0b", glow: "rgba(245,158,11,0.12)" },
];

const TOPICS = ["Arrays","Linked Lists","Stacks","Queues","Trees","Graphs","Heaps","Hashing","Sorting","Searching","Dynamic Programming","Recursion","Backtracking","Greedy","Divide & Conquer","Bit Manipulation"];
const STATS = [
  { value: "5", label: "Specialized AI Agents", icon: Bot },
  { value: "20+", label: "DSA Topics Covered", icon: BookOpen },
  { value: "100%", label: "Curriculum Aligned", icon: Award },
  { value: "∞", label: "Personalized Sessions", icon: Sparkles },
];

const PARTICLE_XS = [5,15,25,35,45,55,65,75,85,95,10,20,30,40,50,60,70,80,90,100];

function FloatingParticle({ delay, x }: { delay: number; x: number }) {
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-[#f59e0b]"
      style={{ left: `${x}%`, bottom: 0 }}
      animate={{ y: [0, -600], opacity: [0, 0.8, 0], scale: [0, 1.5, 0] }}
      transition={{ duration: 5 + (x % 4), delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

function LinkedListAnimation() {
  const nodes = ["12", "→", "8", "→", "23", "→", "5", "→", "null"];
  return (
    <div className="flex items-center gap-1 flex-wrap justify-center">
      {nodes.map((n, i) => (
        <motion.div key={i} initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.15, duration: 0.4 }}>
          {n === "→" || n === "null" ? (
            <span className="text-[#f59e0b] text-sm font-mono font-bold">{n}</span>
          ) : (
            <div className="w-10 h-10 rounded-full border-2 border-[#f59e0b] flex items-center justify-center bg-[#f59e0b]/10 text-[#f59e0b] text-sm font-mono font-bold" style={{ boxShadow: "0 0 12px rgba(245,158,11,0.4)" }}>
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
  const edges = [["A","B"],["A","C"],["B","D"],["C","D"],["B","C"]];
  return (
    <svg viewBox="0 0 100 100" className="w-40 h-40">
      {edges.map(([a,b],i) => {
        const from = nodes.find(n=>n.id===a)!;
        const to = nodes.find(n=>n.id===b)!;
        return <motion.line key={i} x1={from.x} y1={from.y} x2={to.x} y2={to.y} stroke="#f59e0b" strokeWidth="1.5" strokeOpacity="0.5" initial={{ pathLength:0,opacity:0 }} animate={{ pathLength:1,opacity:1 }} transition={{ delay:i*0.2+0.5,duration:0.5 }}/>;
      })}
      {nodes.map((node,i) => (
        <motion.g key={node.id} initial={{ scale:0 }} animate={{ scale:1 }} transition={{ delay:i*0.15,type:"spring",stiffness:200 }}>
          <circle cx={node.x} cy={node.y} r="8" fill="#f59e0b" fillOpacity="0.15" stroke="#f59e0b" strokeWidth="1.5"/>
          <text x={node.x} y={node.y+1} textAnchor="middle" dominantBaseline="middle" fill="#f59e0b" fontSize="6" fontWeight="bold" fontFamily="monospace">{node.id}</text>
        </motion.g>
      ))}
    </svg>
  );
}

export default function LandingPage() {
  const featuresRef = useRef<HTMLDivElement>(null);
  const [activeAgent, setActiveAgent] = useState(0);
  const { scrollYProgress } = useScroll();
  const yHero = useTransform(scrollYProgress, [0, 0.3], [0, -80]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".feature-card", { y:60,opacity:0 }, { y:0,opacity:1,stagger:0.12,duration:0.8,ease:"power3.out",scrollTrigger:{ trigger:featuresRef.current,start:"top 80%" } });
      gsap.fromTo(".stat-card", { y:40,opacity:0 }, { y:0,opacity:1,stagger:0.1,duration:0.6,ease:"power3.out",scrollTrigger:{ trigger:".stats-section",start:"top 85%" } });
    });
    const interval = setInterval(() => setActiveAgent(p=>(p+1)%AGENTS.length), 2000);
    return () => { ctx.revert(); clearInterval(interval); };
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] text-white overflow-x-hidden">
      <Navbar />

      {/* ─── HERO ─── */}
      <motion.section style={{ y: yHero, paddingTop: "96px", paddingBottom: "60px" }} className="relative min-h-screen flex items-center justify-center">
        <div className="absolute inset-0" style={{ backgroundImage:"linear-gradient(rgba(245,158,11,0.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,0.04) 1px,transparent 1px)",backgroundSize:"60px 60px" }}/>
        <div className="orb w-[600px] h-[600px] bg-[#f59e0b] opacity-[0.06] top-[10%] left-[15%]"/>
        <div className="orb w-[400px] h-[400px] bg-[#8b5cf6] opacity-[0.08] top-[20%] right-[10%]"/>
        <div className="orb w-[300px] h-[300px] bg-[#06b6d4] opacity-[0.06] bottom-[20%] left-[30%]"/>
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {PARTICLE_XS.map((x,i) => <FloatingParticle key={i} delay={i*0.3} x={x}/>)}
        </div>

        <div className="relative z-10 w-full max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.6 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full border text-[#f59e0b] text-sm font-medium mb-8" style={{ background:"rgba(245,158,11,0.06)",borderColor:"rgba(245,158,11,0.25)" }}>
            <Sparkles className="w-4 h-4"/>
            Agentic AI Tutor for DSA
            <span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"/>
            Live
          </motion.div>

          <motion.h1 initial={{ opacity:0,y:30 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.8,delay:0.1 }} className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tight mb-6">
            Your Smart<br/>
            <span className="gold-text-animated">Learning</span><br/>
            Companion
          </motion.h1>

          <motion.p initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7,delay:0.25 }} className="text-lg sm:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
            Practice DSA with an AI tutor that teaches like a mentor —{" "}
            <span className="text-white font-medium">Socratic questioning</span>,{" "}
            <span className="text-white font-medium">live visualizations</span>, and{" "}
            <span className="text-white font-medium">personalized learning paths</span>.
          </motion.p>

          <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.7,delay:0.35 }} className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
            <Link href="/learn">
              <motion.button whileHover={{ scale:1.05,boxShadow:"0 0 30px rgba(245,158,11,0.5)" }} whileTap={{ scale:0.97 }} className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black font-bold text-base rounded-xl">
                <Play className="w-5 h-5"/>Start Free Session
              </motion.button>
            </Link>
            <Link href="/visualizer">
              <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }} className="flex items-center gap-2 px-8 py-4 text-white font-semibold text-base rounded-xl transition-all duration-200" style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.12)" }}>
                <Code2 className="w-5 h-5 text-[#f59e0b]"/>See Visualizer<ArrowRight className="w-4 h-4"/>
              </motion.button>
            </Link>
          </motion.div>

          {/* Hero preview card */}
          <motion.div initial={{ opacity:0,y:40 }} animate={{ opacity:1,y:0 }} transition={{ duration:0.9,delay:0.5 }} className="relative max-w-5xl mx-auto">
            <div className="backdrop-blur-xl rounded-2xl overflow-hidden" style={{ background:"rgba(14,14,26,0.9)",border:"1px solid rgba(30,30,58,1)",boxShadow:"0 0 80px rgba(245,158,11,0.08)" }}>
              <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom:"1px solid rgba(30,30,58,1)",background:"rgba(8,8,16,0.6)" }}>
                <div className="w-3 h-3 rounded-full bg-[#ff5f57]"/><div className="w-3 h-3 rounded-full bg-[#febc2e]"/><div className="w-3 h-3 rounded-full bg-[#28c840]"/>
                <span className="ml-3 text-xs text-gray-500 font-mono">dsa-tutor.ai — Agent Session</span>
                <div className="ml-auto flex items-center gap-1.5 text-xs text-[#10b981]"><span className="w-1.5 h-1.5 rounded-full bg-[#10b981] animate-pulse"/>Active</div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 min-h-[320px]">
                <div className="p-6 flex flex-col gap-3" style={{ borderRight:"1px solid rgba(30,30,58,1)" }}>
                  <div className="rounded-xl p-3 text-left text-sm" style={{ background:"linear-gradient(135deg,#0e1628,#0e1e35)",border:"1px solid rgba(6,182,212,0.2)" }}>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background:"rgba(6,182,212,0.15)",border:"1px solid rgba(6,182,212,0.4)" }}><Bot className="w-3.5 h-3.5 text-[#06b6d4]"/></div>
                      <p className="text-gray-300 leading-relaxed">Let&apos;s explore <span className="text-[#f59e0b] font-semibold">Linked Lists</span>. Can you tell me — what&apos;s the key difference between an array and a linked list in terms of memory?</p>
                    </div>
                  </div>
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.2 }} className="rounded-xl p-3 text-left text-sm ml-6" style={{ background:"linear-gradient(135deg,#1e1e3a,#252545)",border:"1px solid rgba(245,158,11,0.2)" }}>
                    <p className="text-gray-300">Arrays are contiguous in memory, linked lists use pointers?</p>
                  </motion.div>
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:2 }} className="rounded-xl p-3 text-left text-sm" style={{ background:"linear-gradient(135deg,#0e1628,#0e1e35)",border:"1px solid rgba(6,182,212,0.2)" }}>
                    <div className="flex items-start gap-2">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5" style={{ background:"rgba(16,185,129,0.15)",border:"1px solid rgba(16,185,129,0.4)" }}><Sparkles className="w-3.5 h-3.5 text-[#10b981]"/></div>
                      <p className="text-gray-300">Exactly! <span className="text-[#10b981] font-semibold">Great reasoning.</span> Now — what does that mean for insertion at position 0?</p>
                    </div>
                  </motion.div>
                  <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:2.8 }} className="flex items-center gap-2 ml-2">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full bg-[#06b6d4] typing-dot"/><div className="w-2 h-2 rounded-full bg-[#06b6d4] typing-dot"/><div className="w-2 h-2 rounded-full bg-[#06b6d4] typing-dot"/>
                    </div>
                    <span className="text-xs text-gray-500">AI Tutor thinking...</span>
                  </motion.div>
                </div>
                <div className="p-6 flex flex-col gap-4 items-center justify-center">
                  <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Live Visualization</p>
                  <LinkedListAnimation/>
                  <div className="w-full pt-4" style={{ borderTop:"1px solid rgba(30,30,58,1)" }}>
                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-2 text-center">Graph Traversal</p>
                    <div className="flex justify-center"><GraphAnimation/></div>
                  </div>
                </div>
              </div>
            </div>
            {/* Agent badge */}
            <AnimatePresence mode="wait">
              <motion.div key={activeAgent} initial={{ opacity:0,x:20 }} animate={{ opacity:1,x:0 }} exit={{ opacity:0,x:-20 }} className="absolute -right-4 top-8 rounded-xl px-3 py-2 text-xs font-medium hidden lg:block" style={{ background:`${AGENTS[activeAgent].color}10`,border:`1px solid ${AGENTS[activeAgent].color}30`,color:AGENTS[activeAgent].color }}>
                <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background:AGENTS[activeAgent].color }}/>{AGENTS[activeAgent].name} Agent</div>
                <p className="text-gray-500 text-[10px] mt-0.5">{AGENTS[activeAgent].desc}</p>
              </motion.div>
            </AnimatePresence>
          </motion.div>

          <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:1.5 }} className="mt-16 flex flex-col items-center gap-2">
            <span className="text-xs text-gray-600 uppercase tracking-wider">Scroll to explore</span>
            <motion.div animate={{ y:[0,8,0] }} transition={{ repeat:Infinity,duration:1.5 }} className="w-px h-8 bg-gradient-to-b from-[#f59e0b]/50 to-transparent"/>
          </motion.div>
        </div>
      </motion.section>

      {/* ─── STATS ─── */}
      <section className="stats-section relative py-20" style={{ borderTop:"1px solid #1e1e3a",borderBottom:"1px solid #1e1e3a",background:"linear-gradient(180deg,rgba(14,14,26,0.6) 0%,rgba(8,8,16,0.6) 100%)" }}>
        <div className="absolute inset-0" style={{ background:"linear-gradient(90deg,rgba(245,158,11,0.03) 0%,transparent 40%,transparent 60%,rgba(139,92,246,0.03) 100%)" }}/>
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((stat,i) => (
              <div key={i} className="stat-card text-center p-8 rounded-2xl transition-all duration-300 group cursor-default" style={{ background:"rgba(14,14,26,0.95)",border:"1px solid #1e1e3a" }}>
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-transform duration-200 group-hover:scale-110" style={{ background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.2)" }}>
                  <stat.icon className="w-7 h-7 text-[#f59e0b]"/>
                </div>
                <div className="text-4xl font-black gold-text mb-2">{stat.value}</div>
                <div className="text-sm text-gray-400 font-medium">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── FEATURES ─── */}
      <section ref={featuresRef} className="py-32 relative">
        <div className="orb w-[500px] h-[500px] bg-[#8b5cf6] opacity-[0.04] top-[20%] right-0"/>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-20">
            <motion.span initial={{ opacity:0 }} whileInView={{ opacity:1 }} viewport={{ once:true }} className="inline-block text-[#f59e0b] text-xs font-bold uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full" style={{ background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)" }}>Why DSA Tutor AI</motion.span>
            <motion.h2 initial={{ opacity:0,y:20 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:0.1 }} className="text-4xl md:text-5xl font-black mt-4 mb-5">
              Everything you need to <span className="gold-text">master DSA</span>
            </motion.h2>
            <motion.p initial={{ opacity:0,y:10 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} transition={{ delay:0.2 }} className="text-gray-400 max-w-xl mx-auto text-lg leading-relaxed">
              Built for engineering students who want more than just answers — a system that teaches you to think.
            </motion.p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f,i) => (
              <motion.div
                key={i}
                className="feature-card group p-7 rounded-2xl transition-all duration-300 cursor-default"
                style={{ background:"rgba(14,14,26,0.95)",border:"1px solid #1e1e3a" }}
                whileHover={{ y:-4,boxShadow:`0 20px 60px ${f.glow}`,borderColor:`${f.color}30` }}
              >
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5 transition-transform duration-200 group-hover:scale-110" style={{ background:f.glow,border:`1px solid ${f.color}30` }}>
                  <f.icon className="w-7 h-7" style={{ color:f.color }}/>
                </div>
                <h3 className="font-bold text-lg text-white mb-3">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── AGENT ARCHITECTURE ─── */}
      <section className="py-32 relative" style={{ borderTop:"1px solid #1e1e3a",background:"rgba(14,14,26,0.4)" }}>
        <div className="orb w-[600px] h-[600px] bg-[#f59e0b] opacity-[0.04] top-0 left-[-100px]"/>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-20 items-center">
            <div>
              <span className="inline-block text-[#f59e0b] text-xs font-bold uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full" style={{ background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)" }}>Architecture</span>
              <h2 className="text-4xl md:text-5xl font-black mt-4 mb-6">5 AI Agents, <span className="gold-text">One goal</span></h2>
              <p className="text-gray-400 leading-relaxed mb-10 text-lg">Our multi-agent orchestrator routes your queries to specialized agents — each trained with a specific pedagogical role.</p>
              <div className="flex flex-col gap-3">
                {AGENTS.map((agent,i) => (
                  <motion.div
                    key={i}
                    whileHover={{ x:4 }}
                    className="flex items-center gap-4 p-4 rounded-xl transition-all duration-200 cursor-default"
                    style={{ background:"rgba(14,14,26,0.95)",border:`1px solid ${agent.color}25` }}
                  >
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${agent.color}12`,border:`1px solid ${agent.color}30` }}>
                      <div className="w-3 h-3 rounded-full" style={{ background:agent.color,boxShadow:`0 0 8px ${agent.color}` }}/>
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm text-white">{agent.name} Agent</div>
                      <div className="text-xs text-gray-500 mt-0.5">{agent.desc}</div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-600 flex-shrink-0"/>
                  </motion.div>
                ))}
              </div>
            </div>
            <div className="relative flex items-center justify-center">
              <div className="relative w-80 h-80">
                <motion.div animate={{ boxShadow:["0 0 20px rgba(245,158,11,0.3)","0 0 40px rgba(245,158,11,0.6)","0 0 20px rgba(245,158,11,0.3)"] }} transition={{ duration:2,repeat:Infinity }} className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full border-2 border-[#f59e0b] flex flex-col items-center justify-center z-10" style={{ background:"radial-gradient(ellipse,rgba(245,158,11,0.2),rgba(217,119,6,0.1))" }}>
                  <Brain className="w-8 h-8 text-[#f59e0b]"/>
                  <span className="text-[10px] text-[#f59e0b] font-bold mt-1">Orchestrator</span>
                </motion.div>
                {AGENTS.slice(1).map((agent,i) => {
                  const angle = (i/4)*2*Math.PI - Math.PI/2;
                  const radius = 120;
                  const x = 50 + (radius/160)*100*Math.cos(angle);
                  const y = 50 + (radius/160)*100*Math.sin(angle);
                  return (
                    <motion.div key={i} className="absolute -translate-x-1/2 -translate-y-1/2" style={{ left:`${x}%`,top:`${y}%` }} animate={{ scale:[1,1.05,1] }} transition={{ duration:2,delay:i*0.4,repeat:Infinity }}>
                      <div className="w-16 h-16 rounded-full flex flex-col items-center justify-center text-center border" style={{ background:`${agent.color}15`,borderColor:`${agent.color}50`,boxShadow:`0 0 15px ${agent.color}30` }}>
                        <span className="text-[9px] font-bold leading-tight px-1" style={{ color:agent.color }}>{agent.name}</span>
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
      <section className="py-28 relative overflow-hidden" style={{ borderTop:"1px solid #1e1e3a" }}>
        <div className="absolute inset-0" style={{ background:"rgba(14,14,26,0.5)" }}/>
        <div className="relative max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block text-[#f59e0b] text-xs font-bold uppercase tracking-[0.2em] mb-4 px-3 py-1 rounded-full" style={{ background:"rgba(245,158,11,0.08)",border:"1px solid rgba(245,158,11,0.2)" }}>Curriculum</span>
          <h2 className="text-3xl md:text-4xl font-black mt-4 mb-12">Full DSA <span className="gold-text">Curriculum</span> Coverage</h2>
          <div className="flex flex-wrap justify-center gap-3">
            {TOPICS.map((topic,i) => (
              <motion.div
                key={i}
                initial={{ opacity:0,scale:0.8 }}
                whileInView={{ opacity:1,scale:1 }}
                viewport={{ once:true }}
                transition={{ delay:i*0.04 }}
                whileHover={{ scale:1.08,borderColor:"rgba(245,158,11,0.5)",color:"#fff" }}
                className="px-5 py-2.5 rounded-full text-sm text-gray-300 cursor-default transition-all duration-200 font-medium"
                style={{ background:"rgba(14,14,26,0.95)",border:"1px solid #1e1e3a" }}
              >
                {topic}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="py-32 relative overflow-hidden" style={{ borderTop:"1px solid #1e1e3a" }}>
        <div className="orb w-[700px] h-[700px] bg-[#f59e0b] opacity-[0.05] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"/>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <motion.div initial={{ opacity:0,y:30 }} whileInView={{ opacity:1,y:0 }} viewport={{ once:true }} className="rounded-3xl p-14" style={{ background:"rgba(14,14,26,0.95)",border:"1px solid rgba(245,158,11,0.2)",boxShadow:"0 0 80px rgba(245,158,11,0.06)" }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6" style={{ background:"rgba(245,158,11,0.1)",border:"1px solid rgba(245,158,11,0.3)" }}>
              <Sparkles className="w-8 h-8 text-[#f59e0b]"/>
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">Ready to master <span className="gold-text">DSA?</span></h2>
            <p className="text-gray-400 mb-10 text-lg">Start your personalized AI-powered learning journey today.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/learn">
                <motion.button whileHover={{ scale:1.05,boxShadow:"0 0 40px rgba(245,158,11,0.5)" }} whileTap={{ scale:0.97 }} className="flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black font-bold text-base rounded-xl">
                  <Play className="w-5 h-5"/>Start Free Session<ArrowRight className="w-5 h-5"/>
                </motion.button>
              </Link>
              <Link href="/dashboard">
                <motion.button whileHover={{ scale:1.05 }} whileTap={{ scale:0.97 }} className="flex items-center gap-2 px-8 py-4 text-white font-semibold text-base rounded-xl transition-all duration-200" style={{ background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.12)" }}>
                  <BarChart3 className="w-5 h-5 text-[#f59e0b]"/>View Dashboard
                </motion.button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-8 mt-10 text-xs text-gray-500">
              <span className="flex items-center gap-1.5"><Star className="w-3.5 h-3.5 text-[#f59e0b]"/>Curriculum-Aligned</span>
              <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5 text-[#f59e0b]"/>Multi-Agent AI</span>
              <span className="flex items-center gap-1.5"><Layers className="w-3.5 h-3.5 text-[#f59e0b]"/>RAG-Powered</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="py-8" style={{ borderTop:"1px solid #1e1e3a",background:"rgba(8,8,16,0.8)" }}>
        <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-[#f59e0b]"/>
            <span className="font-bold text-sm text-white">DSA Tutor AI</span>
            <span className="text-gray-600 text-xs">— Thapar Institute Capstone 2025–26</span>
          </div>
          <div className="text-xs text-gray-600">Sachin Goyal · Raghav Chhabra · Aksh Khurana · Prachi</div>
        </div>
      </footer>
    </div>
  );
}
