"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import {
  Brain, Flame, Star, TrendingUp, Clock, Target, ChevronRight,
  BookOpen, Code2, Zap, Award, Play, BarChart3, ArrowRight,
  CheckCircle2, Circle, Lock, Sparkles, Bot, MessageSquare
} from "lucide-react";

const TOPIC_PROGRESS = [
  { name: "Arrays", progress: 92, mastery: "Expert", color: "#10b981", topics: 8 },
  { name: "Linked Lists", progress: 78, mastery: "Advanced", color: "#f59e0b", topics: 6 },
  { name: "Stacks & Queues", progress: 65, mastery: "Intermediate", color: "#8b5cf6", topics: 5 },
  { name: "Trees", progress: 45, mastery: "Learning", color: "#06b6d4", topics: 9 },
  { name: "Graphs", progress: 30, mastery: "Beginner", color: "#ec4899", topics: 7 },
  { name: "Dynamic Programming", progress: 12, mastery: "Novice", color: "#f59e0b", topics: 10 },
];

const RECENT_SESSIONS = [
  { topic: "Reverse a Linked List", type: "Problem", score: 95, time: "2h ago", agent: "Teacher", color: "#f59e0b" },
  { topic: "BFS vs DFS", type: "Concept", score: 88, time: "Yesterday", agent: "Assessment", color: "#8b5cf6" },
  { topic: "Stack using Queue", type: "Problem", score: 72, time: "2d ago", agent: "Feedback", color: "#06b6d4" },
  { topic: "Binary Search Tree", type: "Concept", score: 81, time: "3d ago", agent: "Teacher", color: "#10b981" },
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

function CircularProgress({ value, color, size = 80 }: { value: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (value / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1e1e3a" strokeWidth="6"/>
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
        strokeLinecap="round" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: "easeOut", delay: 0.3 }}
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
    </svg>
  );
}

export default function DashboardPage() {
  const streakRef = useRef<HTMLDivElement>(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".dash-card", { y: 30, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.08, duration: 0.6, ease: "power3.out" });
      gsap.fromTo(".topic-row", { x: -20, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.1, duration: 0.5, ease: "power2.out", delay: 0.3 });
    });

    // Animate score counter
    let start = 0;
    const target = 847;
    const step = target / 60;
    const counter = setInterval(() => {
      start += step;
      if (start >= target) { setAnimatedScore(target); clearInterval(counter); }
      else setAnimatedScore(Math.floor(start));
    }, 16);

    return () => { ctx.revert(); clearInterval(counter); };
  }, []);

  return (
    <div className="min-h-screen bg-[#080810] text-white">
      <Navbar />
      <div className="h-16" />
      <div className="pb-16 w-full max-w-[1400px] mx-auto px-4 sm:px-6 pt-8">

        {/* Header */}
        <motion.div initial={{ opacity:0,y:20 }} animate={{ opacity:1,y:0 }} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-white">Welcome back, <span className="gold-text">Sachin</span> 👋</h1>
            <p className="text-gray-400 mt-1">Continue your DSA journey — you&apos;re making great progress!</p>
          </div>
          <Link href="/learn">
            <motion.button whileHover={{ scale:1.05,boxShadow:"0 0 20px rgba(245,158,11,0.4)" }} whileTap={{ scale:0.97 }} className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-black font-bold rounded-xl">
              <Play className="w-4 h-4"/>Resume Learning
            </motion.button>
          </Link>
        </motion.div>

        {/* ─── TOP STAT CARDS ─── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { label: "XP Score", value: animatedScore.toLocaleString(), icon: Star, color: "#f59e0b", sub: "+120 today" },
            { label: "Day Streak", value: "12", icon: Flame, color: "#ef4444", sub: "Personal best!" },
            { label: "Topics Done", value: "8/20", icon: BookOpen, color: "#8b5cf6", sub: "40% complete" },
            { label: "Avg Score", value: "84%", icon: BarChart3, color: "#10b981", sub: "↑ 6% this week" },
          ].map((stat,i) => (
            <motion.div key={i} className="dash-card p-5 rounded-2xl border border-white/6 bg-white/3 backdrop-blur-xl group hover:border-opacity-60 transition-all duration-300" whileHover={{ y:-2 }} style={{ "--hc": stat.color } as React.CSSProperties}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background:`${stat.color}15`,border:`1px solid ${stat.color}25` }}>
                  <stat.icon className="w-5 h-5" style={{ color:stat.color }}/>
                </div>
                <span className="text-xs text-gray-500 bg-white/5 px-2 py-0.5 rounded-full">{stat.sub}</span>
              </div>
              <div className="text-2xl font-black text-white">{stat.value}</div>
              <div className="text-sm text-gray-400 mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ─── LEFT: Topic Progress ─── */}
          <div className="lg:col-span-2 flex flex-col gap-6">

            {/* Topic mastery */}
            <div className="dash-card p-6 rounded-2xl border border-white/6 bg-white/3 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-white flex items-center gap-2"><TrendingUp className="w-5 h-5 text-[#f59e0b]"/>Topic Mastery</h2>
                <Link href="/topics" className="text-xs text-[#f59e0b] hover:underline flex items-center gap-1">View all<ChevronRight className="w-3 h-3"/></Link>
              </div>
              <div className="flex flex-col gap-4">
                {TOPIC_PROGRESS.map((topic,i) => (
                  <div key={i} className="topic-row">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white">{topic.name}</span>
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background:`${topic.color}15`,color:topic.color }}>{topic.mastery}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500">{topic.topics} topics</span>
                        <span className="text-sm font-bold" style={{ color:topic.color }}>{topic.progress}%</span>
                      </div>
                    </div>
                    <div className="h-2 rounded-full bg-[#1e1e3a] overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${topic.progress}%` }}
                        transition={{ duration: 1, delay: i * 0.1 + 0.5, ease: "easeOut" }}
                        style={{ background:`linear-gradient(90deg,${topic.color},${topic.color}aa)`,boxShadow:`0 0 8px ${topic.color}50` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recent sessions */}
            <div className="dash-card p-6 rounded-2xl border border-white/6 bg-white/3 backdrop-blur-xl">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-white flex items-center gap-2"><Clock className="w-5 h-5 text-[#8b5cf6]"/>Recent Sessions</h2>
              </div>
              <div className="flex flex-col gap-3">
                {RECENT_SESSIONS.map((session,i) => (
                  <motion.div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-white/3 border border-white/5 hover:border-[#f59e0b]/20 transition-all duration-200 cursor-default group" whileHover={{ x:2 }}>
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background:`${session.color}15`,border:`1px solid ${session.color}30` }}>
                      <Bot className="w-5 h-5" style={{ color:session.color }}/>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm text-white truncate">{session.topic}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ background:`${session.color}15`,color:session.color }}>{session.type}</span>
                        <span className="text-xs text-gray-500">{session.agent} Agent</span>
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-sm font-bold" style={{ color: session.score >= 85 ? "#10b981" : session.score >= 70 ? "#f59e0b" : "#ef4444" }}>{session.score}%</div>
                      <div className="text-[10px] text-gray-500">{session.time}</div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </div>

          {/* ─── RIGHT SIDEBAR ─── */}
          <div className="flex flex-col gap-6">

            {/* Overall progress ring */}
            <div className="dash-card p-6 rounded-2xl border border-white/6 bg-white/3 backdrop-blur-xl text-center">
              <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Overall Progress</h2>
              <div className="flex justify-center mb-3">
                <div className="relative">
                  <CircularProgress value={54} color="#f59e0b" size={120}/>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black gold-text">54%</span>
                    <span className="text-[10px] text-gray-500">Complete</span>
                  </div>
                </div>
              </div>
              <p className="text-sm text-gray-400">8 of 20 DSA topics mastered</p>
              <div className="mt-4 grid grid-cols-3 gap-2">
                {[{ l:"Easy",v:18,c:"#10b981" },{ l:"Medium",v:22,c:"#f59e0b" },{ l:"Hard",v:10,c:"#ef4444" }].map((d,i) => (
                  <div key={i} className="text-center p-2 rounded-lg bg-white/3">
                    <div className="text-base font-bold" style={{ color:d.c }}>{d.v}</div>
                    <div className="text-[10px] text-gray-500">{d.l}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended next */}
            <div className="dash-card p-5 rounded-2xl border border-white/6 bg-white/3 backdrop-blur-xl">
              <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#f59e0b]"/>AI Recommends</h2>
              <div className="flex flex-col gap-3">
                {RECOMMENDED.map((item,i) => (
                  <div key={i} className={`flex items-center gap-3 p-3 rounded-xl border transition-all duration-200 ${item.unlocked ? "border-white/5 hover:border-[#f59e0b]/20 cursor-pointer" : "border-white/3 opacity-50 cursor-not-allowed"}`}>
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background:`${item.color}15` }}>
                      {item.unlocked ? <item.icon className="w-4 h-4" style={{ color:item.color }}/> : <Lock className="w-4 h-4 text-gray-600"/>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-white truncate">{item.topic}</div>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px]" style={{ color: item.difficulty==="Hard"?"#ef4444":item.difficulty==="Medium"?"#f59e0b":"#10b981" }}>{item.difficulty}</span>
                        <span className="text-[10px] text-gray-600">·</span>
                        <span className="text-[10px] text-gray-500">{item.time}</span>
                      </div>
                    </div>
                    {item.unlocked && <ArrowRight className="w-4 h-4 text-gray-600 flex-shrink-0"/>}
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="dash-card p-5 rounded-2xl border border-white/6 bg-white/3 backdrop-blur-xl">
              <h2 className="font-bold text-sm text-gray-400 uppercase tracking-wider mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label:"Ask Tutor", href:"/learn", icon:MessageSquare, color:"#f59e0b" },
                  { label:"Visualize", href:"/visualizer", icon:Code2, color:"#8b5cf6" },
                  { label:"All Topics", href:"/topics", icon:BookOpen, color:"#06b6d4" },
                  { label:"Progress", href:"/dashboard", icon:BarChart3, color:"#10b981" },
                ].map((a,i) => (
                  <Link key={i} href={a.href}>
                    <motion.div whileHover={{ scale:1.03 }} whileTap={{ scale:0.97 }} className="flex flex-col items-center gap-2 p-3 rounded-xl border border-white/5 hover:border-opacity-50 transition-all duration-200 cursor-pointer text-center" style={{ background:`${a.color}08` }}>
                      <a.icon className="w-5 h-5" style={{ color:a.color }}/>
                      <span className="text-xs font-medium text-gray-300">{a.label}</span>
                    </motion.div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ─── ACHIEVEMENTS ─── */}
        <div className="mt-6 dash-card p-6 rounded-2xl border border-white/6 bg-white/3 backdrop-blur-xl">
          <div className="flex items-center justify-between mb-5">
            <h2 className="font-bold text-lg text-white flex items-center gap-2"><Award className="w-5 h-5 text-[#f59e0b]"/>Achievements</h2>
            <span className="text-xs text-gray-500">3 / 6 earned</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {ACHIEVEMENTS.map((ach,i) => (
              <motion.div key={i} whileHover={{ scale: ach.earned ? 1.05 : 1 }} className={`flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all duration-200 ${ach.earned ? "border-[#f59e0b]/20 bg-[#f59e0b]/5" : "border-white/5 bg-white/2 opacity-40"}`}>
                <div className="text-2xl">{ach.icon}</div>
                <div className="text-xs font-semibold text-white">{ach.title}</div>
                <div className="text-[10px] text-gray-500">{ach.desc}</div>
                {ach.earned ? <CheckCircle2 className="w-4 h-4 text-[#10b981]"/> : <Circle className="w-4 h-4 text-gray-600"/>}
              </motion.div>
            ))}
          </div>
        </div>

        {/* Streak calendar */}
        <div className="mt-6 dash-card p-6 rounded-2xl border border-white/6 bg-white/3 backdrop-blur-xl" ref={streakRef}>
          <div className="flex items-center gap-2 mb-5">
            <Flame className="w-5 h-5 text-[#ef4444]"/>
            <h2 className="font-bold text-lg text-white">Learning Streak</h2>
            <span className="ml-auto text-2xl font-black text-[#ef4444] flex items-center gap-1"><Flame className="w-5 h-5"/>12 days</span>
          </div>
          <div className="flex gap-1.5 flex-wrap">
            {Array.from({ length: 28 }).map((_,i) => {
              const active = i < 12 || [14,16,18,20].includes(i);
              const today = i === 11;
              return (
                <motion.div key={i} initial={{ scale:0,opacity:0 }} animate={{ scale:1,opacity:1 }} transition={{ delay:i*0.02 }} className={`w-8 h-8 rounded-md flex items-center justify-center text-xs font-medium transition-all duration-200 ${today ? "ring-2 ring-[#f59e0b]" : ""} ${active ? "bg-[#f59e0b]/20 text-[#f59e0b] border border-[#f59e0b]/30" : "bg-white/3 text-gray-600 border border-white/5"}`}>
                  {i+1}
                </motion.div>
              );
            })}
          </div>
          <p className="text-xs text-gray-500 mt-3">Keep going! You&apos;re 2 days away from your longest streak.</p>
        </div>
      </div>
    </div>
  );
}
