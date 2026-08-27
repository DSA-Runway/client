import type {
  Approach,
  CodeLanguage,
  CodeSample,
  Complexity,
  Doubt,
  SubtopicContent,
  VisualizationKind,
  WorkedExample,
} from "./types";
import type { SubtopicDifficulty } from "@/lib/subtopics";

/**
 * Parses an authored subtopic from Markdown.
 *
 * The content lives in .md files so it can be read and edited as documents
 * rather than as TypeScript literals. This module is the only thing that knows
 * the file format; everything downstream still receives a SubtopicContent, so
 * the registry, the grounding builder and the API route are unchanged.
 *
 * FORMAT
 *
 *   ---
 *   id / topic / title / difficulty / status   (scalars)
 *   prerequisites / relatedIds                 (dash lists, omitted when empty)
 *   ---
 *
 *   <!-- @summary -->        free text until the next marker
 *   <!-- @theory -->         markdown, may itself contain ## headings and ``` fences
 *   <!-- @intuition -->
 *   <!-- @approach -->       name given as a ### heading
 *     <!-- @idea -->
 *     <!-- @steps -->        ordered list
 *     <!-- @complexity -->   omitted entirely for conceptual subtopics
 *     <!-- @code cpp -->     one fenced block
 *     <!-- @annotations -->  "- 12: text", keyed by 1-indexed line number
 *   <!-- @example -->
 *     <!-- @input --> <!-- @output --> <!-- @why -->
 *     <!-- @walkthrough -->   ordered list, or a fenced trace split on blank lines
 *   <!-- @visualization array -->
 *     <!-- @description --> <!-- @sampleInput --> <!-- @highlights -->
 *   <!-- @edgeCases --> <!-- @pitfalls -->
 *   <!-- @doubt -->          question as a ### heading, then <!-- @answer -->
 *
 * HTML-comment markers rather than headings, because `theory` contains its own
 * headings and fenced code — a heading-delimited format cannot tell a section
 * boundary from a line of the lesson. Markers are invisible when the file is
 * rendered, so the document still reads as prose.
 */

type Block = { marker: string; arg: string; body: string };

const MARKER = /^<!--\s*@([a-zA-Z]+)(?:\s+([^>]*?))?\s*-->\s*$/;

/** Split the body into marker-delimited blocks, in order. */
function splitBlocks(body: string): Block[] {
  const lines = body.split("\n");
  const blocks: Block[] = [];
  let current: Block | null = null;
  let buf: string[] = [];

  for (const line of lines) {
    const m = line.match(MARKER);
    if (m) {
      if (current) blocks.push({ ...current, body: buf.join("\n").trim() });
      current = { marker: m[1], arg: (m[2] ?? "").trim(), body: "" };
      buf = [];
    } else if (current) {
      buf.push(line);
    }
  }
  if (current) blocks.push({ ...current, body: buf.join("\n").trim() });
  return blocks;
}

/** Minimal frontmatter reader: scalars and `- ` lists. No YAML dependency. */
function parseFrontmatter(text: string): { fm: Record<string, string | string[]>; body: string } {
  if (!text.startsWith("---\n")) throw new Error("missing frontmatter");
  const end = text.indexOf("\n---\n", 4);
  if (end === -1) throw new Error("unterminated frontmatter");

  const fm: Record<string, string | string[]> = {};
  let key = "";
  for (const raw of text.slice(4, end).split("\n")) {
    if (!raw.trim()) continue;
    const item = raw.match(/^\s*-\s+(.*)$/);
    if (item && key) {
      (fm[key] as string[]).push(item[1].trim());
      continue;
    }
    const kv = raw.match(/^([a-zA-Z]+):\s*(.*)$/);
    if (!kv) continue;
    key = kv[1];
    fm[key] = kv[2].trim() === "" ? [] : kv[2].trim();
  }
  return { fm, body: text.slice(end + 5) };
}

const str = (v: string | string[] | undefined, field: string): string => {
  if (typeof v !== "string") throw new Error(`frontmatter '${field}' must be a scalar`);
  return v;
};
const list = (v: string | string[] | undefined): string[] | undefined =>
  Array.isArray(v) && v.length ? v : undefined;

/** "- item" lines, or "1. item" lines, to an array of strings. */
function bullets(body: string): string[] {
  const out: string[] = [];
  for (const line of body.split("\n")) {
    const m = line.match(/^\s*(?:[-*]|\d+\.)\s+(.*)$/);
    if (m) out.push(m[1].trim());
  }
  return out;
}

/** The first fenced block's contents, fence markers removed. */
function fenced(body: string): string {
  const lines = body.split("\n");
  const start = lines.findIndex(l => /^\s*```/.test(l));
  if (start === -1) return body.trim();
  const rest = lines.slice(start + 1);
  const end = rest.findIndex(l => /^\s*```\s*$/.test(l));
  return (end === -1 ? rest : rest.slice(0, end)).join("\n");
}

/**
 * Trace steps, from either a list or a fenced block.
 *
 * Most containers write the walkthrough as a numbered list. The Binary Search
 * set writes it as a fenced trace instead, because the alignment of the lo/hi/mid
 * columns is itself part of the explanation and a list would flatten it away.
 * Read both — a fenced walkthrough parsed by `bullets` alone yields nothing, and
 * the tutor is then handed a worked example whose trace is silently empty, which
 * grounds it worse than having no example at all.
 *
 * Stanzas separated by a blank line become separate steps, so a probe table
 * followed by a paragraph of commentary stays two things rather than one.
 */
function traceSteps(body: string): string[] {
  const items = bullets(body);
  if (items.length) return items;

  const block = fenced(body).trim();
  if (!block) return [];
  return block
    .split(/\n[ \t]*\n/)
    .map(stanza => stanza.replace(/\s+$/, ""))
    .filter(stanza => stanza.length > 0);
}

/** Strip a leading "### " heading and return what it said. */
function heading(body: string): string {
  const m = body.match(/^\s*#{1,6}\s+(.*)$/m);
  return m ? m[1].trim() : body.trim();
}

export function parseSubtopicMarkdown(text: string): SubtopicContent {
  const { fm, body } = parseFrontmatter(text.replace(/\r\n/g, "\n"));
  const blocks = splitBlocks(body);

  const content: SubtopicContent = {
    id: str(fm.id, "id"),
    topic: str(fm.topic, "topic"),
    title: str(fm.title, "title"),
    difficulty: str(fm.difficulty, "difficulty") as SubtopicDifficulty,
    status: str(fm.status, "status") as "draft" | "ready",
    summary: "",
    theory: "",
    approaches: [],
    examples: [],
    visualization: { kind: "array", description: "", sampleInput: "" },
  };

  const prereq = list(fm.prerequisites);
  if (prereq) content.prerequisites = prereq;
  const related = list(fm.relatedIds);
  if (related) content.relatedIds = related;

  let approach: Approach | null = null;
  let sample: CodeSample | null = null;
  let example: WorkedExample | null = null;
  let doubt: Doubt | null = null;

  const closeSample = () => {
    if (approach && sample) approach.code.push(sample);
    sample = null;
  };
  const closeApproach = () => {
    closeSample();
    if (approach) content.approaches.push(approach);
    approach = null;
  };
  const closeExample = () => {
    if (example) content.examples.push(example);
    example = null;
  };
  const closeDoubt = () => {
    if (doubt) (content.commonDoubts ??= []).push(doubt);
    doubt = null;
  };

  for (const b of blocks) {
    switch (b.marker) {
      case "summary":
        content.summary = b.body;
        break;
      case "theory":
        content.theory = b.body;
        break;
      case "intuition":
        if (b.body) content.intuition = b.body;
        break;

      case "approach":
        closeApproach();
        closeExample();
        closeDoubt();
        approach = { name: heading(b.body), idea: "", steps: [], code: [] };
        break;
      case "idea":
        if (approach) approach.idea = b.body;
        break;
      case "steps":
        if (approach) approach.steps = bullets(b.body);
        break;
      case "complexity": {
        if (!approach) break;
        const c: Complexity = { time: "", space: "" };
        for (const item of bullets(b.body)) {
          const m = item.match(/^(time|space|note):\s*(.*)$/);
          if (!m) continue;
          if (m[1] === "note") c.note = m[2].trim();
          else c[m[1] as "time" | "space"] = m[2].trim();
        }
        approach.complexity = c;
        break;
      }
      case "code":
        closeSample();
        sample = { language: b.arg as CodeLanguage, code: fenced(b.body) };
        break;
      case "annotations": {
        if (!sample) break;
        const ann: Record<number, string> = {};
        for (const item of bullets(b.body)) {
          const m = item.match(/^(\d+):\s*(.*)$/);
          if (m) ann[Number(m[1])] = m[2].trim();
        }
        if (Object.keys(ann).length) sample.annotations = ann;
        break;
      }

      case "example":
        closeApproach();
        closeExample();
        closeDoubt();
        example = { input: "", output: "", walkthrough: [] };
        break;
      case "input":
        if (example) example.input = b.body;
        break;
      case "output":
        if (example) example.output = b.body;
        break;
      case "why":
        if (example && b.body) example.why = b.body;
        break;
      case "walkthrough":
        if (example) example.walkthrough = traceSteps(b.body);
        break;

      case "visualization":
        closeApproach();
        closeExample();
        closeDoubt();
        content.visualization.kind = b.arg as VisualizationKind;
        break;
      case "description":
        content.visualization.description = b.body;
        break;
      case "sampleInput":
        content.visualization.sampleInput = fenced(b.body);
        break;
      case "highlights": {
        const h = bullets(b.body);
        if (h.length) content.visualization.highlights = h;
        break;
      }

      case "edgeCases": {
        closeApproach();
        closeExample();
        closeDoubt();
        const e = bullets(b.body);
        if (e.length) content.edgeCases = e;
        break;
      }
      case "pitfalls": {
        const p = bullets(b.body);
        if (p.length) content.pitfalls = p;
        break;
      }

      case "doubt":
        closeApproach();
        closeExample();
        closeDoubt();
        doubt = { question: heading(b.body), answer: "" };
        break;
      case "answer":
        if (doubt) doubt.answer = b.body;
        break;
    }
  }
  closeApproach();
  closeExample();
  closeDoubt();

  return content;
}
