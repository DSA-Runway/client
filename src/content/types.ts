import type { SubtopicDifficulty } from "@/lib/subtopics";

/**
 * The authored content container for a single subtopic.
 *
 * This is the ONLY thing the tutor LLM is allowed to teach from. Everything the
 * model needs — the explanation, the algorithm as discrete steps, the code, the
 * data to animate, and the answers to the doubts students actually raise — lives
 * here, so generation is grounded instead of invented.
 *
 * Shape it like a JSON row, because that is what it becomes once the backend
 * lands: this file's fields map 1:1 onto the API payload.
 */
export type SubtopicContent = {
  /** Must equal the `id` of the matching entry in SUBTOPICS. */
  id: string;
  /** Parent topic name, e.g. "Arrays". */
  topic: string;
  title: string;
  difficulty: SubtopicDifficulty;

  /**
   * "draft" content is visible to authors but must NOT be served to the tutor —
   * a half-written container grounds the model worse than no container at all.
   */
  status: "draft" | "ready";

  /** One or two sentences. Used for cards, search, and prompt headers. */
  summary: string;

  /** Subtopic ids a student should have covered first. Lets the tutor pitch its explanation correctly. */
  prerequisites?: string[];

  /** The main explanation, in markdown. Written by a human, taught by the model. */
  theory: string;

  /** Why the approach works — the part students say "but why" about. */
  intuition?: string;

  /** Ordered from naive to optimal. Showing the progression is the lesson. */
  approaches: Approach[];

  /** Concrete traced examples. Gives the model real numbers instead of invented ones. */
  examples: WorkedExample[];

  /** How this should be drawn and animated. */
  visualization: VisualizationSpec;

  edgeCases?: string[];
  pitfalls?: string[];

  /**
   * Pre-answered questions students actually ask. This is the highest-value
   * field for doubt-solving: it turns the most common doubts into grounded
   * answers rather than freshly generated ones.
   */
  commonDoubts?: Doubt[];

  /** Other subtopic ids worth visiting next. */
  relatedIds?: string[];
};

export type Approach = {
  /** e.g. "Brute Force - Sorting", "Optimal - Single Pass". */
  name: string;
  /** The one-line idea behind it. */
  idea: string;
  /**
   * The algorithm as discrete, ordered steps.
   * Each step is one frame of the visualization — keep them atomic and
   * observable ("compare arr[i] with max"), not compound ("scan and update").
   */
  steps: string[];
  code: CodeSample[];
  /** Omitted for conceptual subtopics — a fake "N/A" reads as a real figure to the model. */
  complexity?: Complexity;
};

/**
 * The three languages a student can commit to. The choice is made at the end of
 * the Basics module — Basics itself teaches every subtopic in all three so the
 * student picks after seeing them, not before.
 */
export const LANGUAGES = ["cpp", "java", "python"] as const;

export type CodeLanguage = (typeof LANGUAGES)[number];

export const LANGUAGE_LABELS: Record<CodeLanguage, string> = {
  cpp: "C++",
  java: "Java",
  python: "Python",
};

export type CodeSample = {
  language: CodeLanguage;
  code: string;
  /** Optional per-line notes, keyed by 1-indexed line number. */
  annotations?: Record<number, string>;
};

export type Complexity = {
  time: string;
  space: string;
  /** Why — e.g. "the sort dominates; the scan is O(n)". */
  note?: string;
};

export type WorkedExample = {
  input: string;
  output: string;
  /** Step-by-step trace against THIS specific input. */
  walkthrough: string[];
  /** Why this example was chosen, e.g. "all negatives — the classic wrong-answer case". */
  why?: string;
};

/** The visual form this subtopic should take. Drives what the model renders. */
export type VisualizationKind =
  | "array"
  | "matrix"
  | "linked-list"
  | "tree"
  | "graph"
  | "stack"
  | "queue"
  | "hash-map"
  | "recursion-tree"
  | "pointer-scan"
  | "code-flow"
  | "memory-model"
  | "custom";

export type VisualizationSpec = {
  kind: VisualizationKind;
  /** What should be on screen and what should move. Written for the renderer, not the student. */
  description: string;
  /** JSON-encoded input the visualizer animates. Small enough to fit on screen. */
  sampleInput: string;
  /** What to emphasise, frame by frame. Should line up with the optimal approach's `steps`. */
  highlights?: string[];
};

export type Doubt = {
  question: string;
  answer: string;
};

/**
 * Pick the code sample for a student's chosen language.
 *
 * Falls back to the first authored sample rather than returning nothing — a
 * lesson in the wrong language still teaches the algorithm, whereas an empty
 * code block teaches nothing. Callers can detect the fallback by comparing
 * `sample.language` against the requested one and labelling it in the UI.
 */
export function codeFor(approach: Approach, language: CodeLanguage): CodeSample | null {
  return approach.code.find(c => c.language === language) ?? approach.code[0] ?? null;
}

/** Which languages a container actually has code for. Drives the Basics language picker. */
export function languagesCovered(content: SubtopicContent): CodeLanguage[] {
  const seen = new Set<CodeLanguage>();
  for (const approach of content.approaches) {
    for (const sample of approach.code) seen.add(sample.language);
  }
  return LANGUAGES.filter(l => seen.has(l));
}

/** A container is servable to the tutor only once it is complete enough to teach from. */
export function isTeachable(content: SubtopicContent): boolean {
  return (
    content.status === "ready" &&
    content.theory.trim().length > 0 &&
    content.approaches.length > 0 &&
    content.examples.length > 0
  );
}
