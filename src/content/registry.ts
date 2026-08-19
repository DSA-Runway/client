import type { CodeLanguage, SubtopicContent } from "./types";
import { LANGUAGES, isTeachable } from "./types";
import { CONTENT_IDS, hasContent, type ContentId } from "./manifest";

/**
 * Server-side content lookup.
 *
 * Import this from route handlers and server components only — never from a
 * "use client" file, or every subtopic's theory gets bundled into the browser.
 * Client code that only needs to know *whether* content exists should import
 * `hasContent` from ./manifest instead.
 *
 * The Record<ContentId, ...> type is deliberate: adding an id to CONTENT_IDS
 * without adding its loader here is a compile error, so the manifest and the
 * files on disk cannot silently drift apart.
 */
const LOADERS: Record<ContentId, () => Promise<{ default: SubtopicContent }>> = {
  "introduction-to-programming": () => import("./basics/introduction-to-programming"),
  "data-types": () => import("./basics/data-types"),
  "variables-and-constants": () => import("./basics/variables-and-constants"),
  "input-and-output": () => import("./basics/input-and-output"),
  "arithmetic-operators": () => import("./basics/arithmetic-operators"),
  "relational-and-logical-operators": () => import("./basics/relational-and-logical-operators"),
  "type-conversion-and-casting": () => import("./basics/type-conversion-and-casting"),
  "if-else-statements": () => import("./basics/if-else-statements"),
  "else-if-ladder": () => import("./basics/else-if-ladder"),
  "switch-case": () => import("./basics/switch-case"),
  "for-loop": () => import("./basics/for-loop"),
  "while-loop": () => import("./basics/while-loop"),
  "do-while-loop": () => import("./basics/do-while-loop"),
  "for-each-loop": () => import("./basics/for-each-loop"),
  "break-and-continue": () => import("./basics/break-and-continue"),
  "functions-declaration-and-calling": () => import("./basics/functions-declaration-and-calling"),
  "nested-loops": () => import("./basics/nested-loops"),
  "function-parameters-and-return-values": () => import("./basics/function-parameters-and-return-values"),
  "pass-by-value-vs-pass-by-reference": () => import("./basics/pass-by-value-vs-pass-by-reference"),
  "variable-scope-and-lifetime": () => import("./basics/variable-scope-and-lifetime"),
  "function-overloading": () => import("./basics/function-overloading"),
  "count-digits": () => import("./basics/count-digits"),
  "reverse-a-number": () => import("./basics/reverse-a-number"),
  "palindrome-number": () => import("./basics/palindrome-number"),
  "gcd-euclidean-algorithm": () => import("./basics/gcd-euclidean-algorithm"),
  "lcm": () => import("./basics/lcm"),
  "prime-check": () => import("./basics/prime-check"),
  "time-and-space-complexity-basics": () => import("./basics/time-and-space-complexity-basics"),
  "stack-memory-and-recursion-depth": () => import("./basics/stack-memory-and-recursion-depth"),
  "integer-overflow-and-precision-errors": () => import("./basics/integer-overflow-and-precision-errors"),
  "largest-element": () => import("./arrays/largest-element"),
  "second-largest-element": () => import("./arrays/second-largest-element"),
  "check-if-array-is-sorted-and-rotated": () => import("./arrays/check-if-array-is-sorted-and-rotated"),
  "remove-duplicates-from-sorted-array": () => import("./arrays/remove-duplicates-from-sorted-array"),
  "left-rotate-array-by-one": () => import("./arrays/left-rotate-array-by-one"),
  "left-rotate-array-by-k-places": () => import("./arrays/left-rotate-array-by-k-places"),
  "move-zeros-to-end": () => import("./arrays/move-zeros-to-end"),
  "linear-search": () => import("./arrays/linear-search"),
  "union-of-two-sorted-arrays": () => import("./arrays/union-of-two-sorted-arrays"),
  "find-missing-number": () => import("./arrays/find-missing-number"),
  "maximum-consecutive-ones": () => import("./arrays/maximum-consecutive-ones"),
  "two-sum": () => import("./arrays/two-sum"),
  "majority-element-i": () => import("./arrays/majority-element-i"),
  "pascals-triangle-i": () => import("./arrays/pascals-triangle-i"),
  "find-the-number-that-appears-once-and-other-numbers-twice": () => import("./arrays/find-the-number-that-appears-once-and-other-numbers-twice"),
  "longest-subarray-with-given-sum-k-positives": () => import("./arrays/longest-subarray-with-given-sum-k-positives"),
  "longest-subarray-with-sum-k": () => import("./arrays/longest-subarray-with-sum-k"),
  "sort-an-array-of-0s-1s-and-2s": () => import("./arrays/sort-an-array-of-0s-1s-and-2s"),
};

/** Load one subtopic's container. Returns null when nothing is authored for that id. */
export async function getSubtopicContent(id: string): Promise<SubtopicContent | null> {
  if (!hasContent(id)) return null;
  const mod = await LOADERS[id]();
  return mod.default;
}

/**
 * Load a container only if it is complete enough to teach from.
 * The tutor should always come through this door — a half-written container
 * grounds the model worse than an honest "no content yet".
 */
export async function getTeachableContent(id: string): Promise<SubtopicContent | null> {
  const content = await getSubtopicContent(id);
  return content && isTeachable(content) ? content : null;
}

/**
 * Find approaches missing a language sample.
 *
 * Basics must carry all three languages in every approach — that module is where
 * the student compares them before committing, so a missing sample removes one of
 * the three options from the comparison. After Basics a single language is fine,
 * since the student has chosen by then.
 */
export async function getLanguageGaps(topic = "Basics") {
  const all = await Promise.all(CONTENT_IDS.map(id => getSubtopicContent(id)));
  const gaps: { id: string; approach: string; missing: CodeLanguage[] }[] = [];

  for (const content of all) {
    if (!content || content.topic !== topic) continue;
    for (const approach of content.approaches) {
      const present = new Set(approach.code.map(c => c.language));
      const missing = LANGUAGES.filter(l => !present.has(l));
      if (missing.length) gaps.push({ id: content.id, approach: approach.name, missing });
    }
  }
  return gaps;
}

/** Authoring progress — how many subtopics have containers, and which are still drafts. */
export async function getContentCoverage() {
  const all = await Promise.all(CONTENT_IDS.map(id => getSubtopicContent(id)));
  const loaded = all.filter((c): c is SubtopicContent => c !== null);
  return {
    total: loaded.length,
    ready: loaded.filter(isTeachable).length,
    draft: loaded.filter(c => !isTeachable(c)).map(c => c.id),
  };
}
