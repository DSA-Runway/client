# DSA Tutor AI

An AI-powered learning platform for Data Structures & Algorithms — featuring personalized tutoring, algorithm visualizations, and adaptive curriculum tracking.

## Tech Stack

- **Framework** — Next.js 16 (App Router)
- **Language** — TypeScript
- **Styling** — Tailwind CSS v4 + shadcn/ui
- **Auth** — NextAuth.js v4 (Credentials + Google OAuth)
- **Animation** — Framer Motion, GSAP

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
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Pages

| Route | Description |
|-------|-------------|
| `/` | Landing page |
| `/login` | Sign in |
| `/signup` | Create account |
| `/forgot-password` | Password reset |
| `/dashboard` | Learning dashboard *(protected)* |
| `/learn` | AI tutor chat *(protected)* |
| `/topics` | DSA topic browser *(protected)* |
| `/visualizer` | Algorithm visualizer *(protected)* |

## Auth Setup

The credentials provider stub is in [`src/lib/auth.ts`](src/lib/auth.ts) — replace the `authorize` function with your actual database/API call. Google OAuth requires credentials from [console.cloud.google.com](https://console.cloud.google.com).
