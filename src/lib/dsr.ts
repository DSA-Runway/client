// ─── DSR points engine ────────────────────────────────────────────────────────
// Persistence: localStorage today — swap load/save for the backend API later.
// Earning rules (client-enforced for the demo; server will own these):
//   daily visit ....... +1 DSR
//   daily problem/run .. +10 DSR
//   daily lesson ....... +10 DSR

export type DsrEntry = { ts: number; reason: string; amount: number };
export type DsrState = { points: number; history: DsrEntry[]; daily: Record<string, string> };

const KEY = "dsr-points-v1";

const todayStamp = () => new Date().toISOString().slice(0, 10);

export function loadDsr(): DsrState {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      if (typeof d.points === "number") return { points: d.points, history: d.history ?? [], daily: d.daily ?? {} };
    }
  } catch {}
  return { points: 0, history: [], daily: {} };
}

function save(state: DsrState) {
  try { localStorage.setItem(KEY, JSON.stringify(state)); } catch {}
}

/** Award points for an action that can only score once per day (visit, problem, lesson). */
export function awardDaily(action: string, amount: number, reason: string): { state: DsrState; awarded: boolean } {
  const state = loadDsr();
  const today = todayStamp();
  if (state.daily[action] === today) return { state, awarded: false };
  state.daily[action] = today;
  state.points += amount;
  state.history.unshift({ ts: Date.now(), reason, amount });
  state.history = state.history.slice(0, 50);
  save(state);
  return { state, awarded: true };
}

// icon: key resolved to an SVG icon by the consuming page (keeps this lib React-free)
export const REWARD_TIERS = [
  { at: 100,  icon: "medal",  color: "#cd7f32", title: "Bronze Badge",           desc: "Profile flair + priority hints" },
  { at: 250,  icon: "book",   color: "#8b5cf6", title: "Pattern Playbook",       desc: "Top-15 DSA patterns cheat sheet" },
  { at: 500,  icon: "folder", color: "#f59e0b", title: "Company-wise DSA Sheet", desc: "+ SQL interview sheet unlock" },
  { at: 1000, icon: "mic",    color: "#06b6d4", title: "Mock Interview Pass",    desc: "1:1 AI mock interview session" },
];
