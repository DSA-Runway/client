# DSARunway

**Your smart DSA learning companion** — an agentic AI tutoring platform for Data Structures & Algorithms, built as a capstone project at Thapar Institute of Engineering & Technology under the TIET–UQ Centre of Excellence in Data Science and AI.

DSARunway combines Socratic AI tutoring, an in-browser multi-language compiler, step-by-step algorithm visualizations, and a gamified rewards system into a single learning workspace.

## Features

### 🧠 Multi-Agent AI Tutor (`/learn`)
A VS Code-style workspace with a five-agent architecture — **Orchestrator, Teacher, Assessment, Feedback, and Learning Path** — each with a distinct pedagogical role. Includes a full DSA curriculum tree (Fundamentals → Advanced), quick-start prompts, and per-topic outlines with complexity tables.

### ⚡ Compiler Playground (`/learn` → Compiler)
- **Four languages**: C++, Python, Java, JavaScript — executed in a sandboxed cloud VM via the [Wandbox](https://wandbox.org) API (no server of our own required)
- **Multi-file workspace**: create, open, close, and delete files; everything auto-saves to the browser (S3-backed persistence is the planned upgrade path — the storage layer is isolated in `loadPlayground` / `savePlayground`)
- **Syntax highlighting**: zero-dependency VS Code-style highlighter (keywords, strings, comments, numbers, calls) in light and dark palettes
- **Interactive terminal**: a real, typeable shell — `run`, `g++ file.cpp`, `python3 file.py`, `ls`, `cat`, `touch`, `rm`, `stdin`, `theme`, and more, with ↑/↓ history, four color themes, and a resizable VS Code-style panel with **Problems / Output / Terminal** tabs
- **Analysis panel**: LeetCode-style last-run stats (runtime, exit status) plus a static time/space complexity estimate of the open file

### 📊 Dashboard (`/dashboard`)
Topic mastery progress, monthly activity chart, difficulty distribution, recent sessions, achievements, and a **GitHub-style 52-week learning heatmap**.

### 🏅 DSR Rewards
A points system that rewards consistency: **+1 DSR** per daily visit, **+10 DSR** per daily problem solved. Milestones unlock rewards (pattern playbook, company-wise DSA sheet + SQL sheet, mock interview pass). Client logic lives in `src/lib/dsr.ts`; the backend will own the rules in production.

### 🔍 Visualizer & Topics
Interactive linked list / graph / tree / sorting visualizations (`/visualizer`) and a filterable 29-topic curriculum browser (`/topics`).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 · shadcn/ui · custom inline design system |
| Animation | Framer Motion · GSAP (ScrollTrigger) |
| Auth | NextAuth.js v4 (Credentials + Google OAuth) |
| Code execution | Wandbox compile API (sandboxed cloud VMs) |
| Icons | Lucide (SVG) |

## Getting Started

```bash
npm install
```

Copy the environment file and fill in your values:

```bash
cp .env.local.example .env.local
```

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-secret-here

GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

```bash
npm run dev        # start the dev server on http://localhost:3000
npm run build      # production build
npm start          # serve the production build
npx eslint src     # lint
npx tsc --noEmit   # type-check
```

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` · `/signup` · `/forgot-password` | Authentication |
| `/dashboard` | Learning dashboard — progress, heatmap, DSR rewards |
| `/learn` | AI tutor workspace + compiler playground |
| `/topics` | DSA curriculum browser |
| `/visualizer` | Algorithm visualizer |
| `/profile` | Profile settings |

## Architecture Notes

- **Theming** — driven by a `data-theme` attribute on `<html>` via `ThemeContext`; every page styles both light and dark.
- **Client persistence** — playground files (`dsr-playground-v1`), DSR points (`dsr-points-v1`), and terminal theme are stored in `localStorage` today. Each store is wrapped behind small load/save functions so swapping in the backend API / S3 is a drop-in change.
- **AI agents** — the FastAPI multi-agent backend (RAG, orchestration) is developed separately; the frontend ships with a deterministic tutor shim so every flow is demonstrable end-to-end.
- **Auth** — the credentials provider stub is in `src/lib/auth.ts`; replace `authorize` with the production API call. Google OAuth credentials come from [console.cloud.google.com](https://console.cloud.google.com).

## Team

Sachin Goyal · Raghav Chhabra · Aksh Khurana · Prachi
Thapar Institute of Engineering & Technology — TIET-UQ Centre of Excellence in Data Science and AI
