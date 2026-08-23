import type { CodeLanguage, SubtopicContent } from "./types";
import { LANGUAGES, isTeachable } from "./types";
import { CONTENT_IDS, hasContent, type ContentId } from "./manifest";
import { parseSubtopicMarkdown } from "./md";
import { readFile } from "node:fs/promises";
import path from "node:path";

/**
 * Server-side content lookup.
 *
 * Import this from route handlers and server components only — never from a
 * "use client" file. The content lives in Markdown under src/content; this
 * module reads and parses it, and everything downstream still receives a
 * SubtopicContent. Client code that only needs to know *whether* content
 * exists should import `hasContent` from ./manifest instead.
 *
 * The Record<ContentId, string> type is deliberate: adding an id to
 * CONTENT_IDS without adding its file here is a compile error, so the manifest
 * and the files on disk cannot silently drift apart.
 */
const FILES: Record<ContentId, string> = {
  "introduction-to-programming": "basics/introduction-to-programming.md",
  "data-types": "basics/data-types.md",
  "variables-and-constants": "basics/variables-and-constants.md",
  "input-and-output": "basics/input-and-output.md",
  "arithmetic-operators": "basics/arithmetic-operators.md",
  "relational-and-logical-operators": "basics/relational-and-logical-operators.md",
  "type-conversion-and-casting": "basics/type-conversion-and-casting.md",
  "if-else-statements": "basics/if-else-statements.md",
  "else-if-ladder": "basics/else-if-ladder.md",
  "switch-case": "basics/switch-case.md",
  "for-loop": "basics/for-loop.md",
  "while-loop": "basics/while-loop.md",
  "do-while-loop": "basics/do-while-loop.md",
  "for-each-loop": "basics/for-each-loop.md",
  "break-and-continue": "basics/break-and-continue.md",
  "functions-declaration-and-calling": "basics/functions-declaration-and-calling.md",
  "nested-loops": "basics/nested-loops.md",
  "function-parameters-and-return-values": "basics/function-parameters-and-return-values.md",
  "pass-by-value-vs-pass-by-reference": "basics/pass-by-value-vs-pass-by-reference.md",
  "variable-scope-and-lifetime": "basics/variable-scope-and-lifetime.md",
  "function-overloading": "basics/function-overloading.md",
  "count-digits": "basics/count-digits.md",
  "reverse-a-number": "basics/reverse-a-number.md",
  "palindrome-number": "basics/palindrome-number.md",
  "gcd-euclidean-algorithm": "basics/gcd-euclidean-algorithm.md",
  "lcm": "basics/lcm.md",
  "prime-check": "basics/prime-check.md",
  "time-and-space-complexity-basics": "basics/time-and-space-complexity-basics.md",
  "stack-memory-and-recursion-depth": "basics/stack-memory-and-recursion-depth.md",
  "integer-overflow-and-precision-errors": "basics/integer-overflow-and-precision-errors.md",
  "largest-element": "arrays/largest-element.md",
  "second-largest-element": "arrays/second-largest-element.md",
  "check-if-array-is-sorted-and-rotated": "arrays/check-if-array-is-sorted-and-rotated.md",
  "remove-duplicates-from-sorted-array": "arrays/remove-duplicates-from-sorted-array.md",
  "left-rotate-array-by-one": "arrays/left-rotate-array-by-one.md",
  "left-rotate-array-by-k-places": "arrays/left-rotate-array-by-k-places.md",
  "move-zeros-to-end": "arrays/move-zeros-to-end.md",
  "linear-search": "arrays/linear-search.md",
  "union-of-two-sorted-arrays": "arrays/union-of-two-sorted-arrays.md",
  "find-missing-number": "arrays/find-missing-number.md",
  "maximum-consecutive-ones": "arrays/maximum-consecutive-ones.md",
  "two-sum": "arrays/two-sum.md",
  "majority-element-i": "arrays/majority-element-i.md",
  "pascals-triangle-i": "arrays/pascals-triangle-i.md",
  "find-the-number-that-appears-once-and-other-numbers-twice": "arrays/find-the-number-that-appears-once-and-other-numbers-twice.md",
  "longest-subarray-with-given-sum-k-positives": "arrays/longest-subarray-with-given-sum-k-positives.md",
  "longest-subarray-with-sum-k": "arrays/longest-subarray-with-sum-k.md",
  "sort-an-array-of-0s-1s-and-2s": "arrays/sort-an-array-of-0s-1s-and-2s.md",
  "kadanes-algorithm": "arrays/kadanes-algorithm.md",
  "print-subarray-with-maximum-subarray-sum": "arrays/print-subarray-with-maximum-subarray-sum.md",
  "stock-buy-and-sell": "arrays/stock-buy-and-sell.md",
  "rearrange-array-elements-by-sign": "arrays/rearrange-array-elements-by-sign.md",
  "next-permutation": "arrays/next-permutation.md",
  "leaders-in-an-array": "arrays/leaders-in-an-array.md",
  "longest-consecutive-sequence-in-an-array": "arrays/longest-consecutive-sequence-in-an-array.md",
  "set-matrix-zeroes": "arrays/set-matrix-zeroes.md",
  "rotate-matrix-by-90-degrees": "arrays/rotate-matrix-by-90-degrees.md",
  "print-the-matrix-in-spiral-manner": "arrays/print-the-matrix-in-spiral-manner.md",
  "count-subarrays-with-given-sum": "arrays/count-subarrays-with-given-sum.md",
  "3-sum": "arrays/3-sum.md",
  "4-sum": "arrays/4-sum.md",
  "largest-subarray-with-sum-0": "arrays/largest-subarray-with-sum-0.md",
  "merge-overlapping-subintervals": "arrays/merge-overlapping-subintervals.md",
  "merge-two-sorted-arrays-without-extra-space": "arrays/merge-two-sorted-arrays-without-extra-space.md",
  "majority-element-ii": "arrays/majority-element-ii.md",
  "count-subarrays-with-given-xor-k": "arrays/count-subarrays-with-given-xor-k.md",
  "find-the-repeating-and-missing-number": "arrays/find-the-repeating-and-missing-number.md",
  "count-inversions": "arrays/count-inversions.md",
  "reverse-pairs": "arrays/reverse-pairs.md",
  "maximum-product-subarray-in-an-array": "arrays/maximum-product-subarray-in-an-array.md",
  "pattern-1-rectangular-star-pattern": "pattern-printing/pattern-1-rectangular-star-pattern.md",
  "pattern-2-right-angled-star-triangle": "pattern-printing/pattern-2-right-angled-star-triangle.md",
  "pattern-3-right-angled-number-triangle": "pattern-printing/pattern-3-right-angled-number-triangle.md",
  "pattern-4-right-angled-repeating-number-triangle": "pattern-printing/pattern-4-right-angled-repeating-number-triangle.md",
  "pattern-5-inverted-right-angled-star-triangle": "pattern-printing/pattern-5-inverted-right-angled-star-triangle.md",
  "pattern-6-inverted-right-angled-number-triangle": "pattern-printing/pattern-6-inverted-right-angled-number-triangle.md",
  "pattern-7-star-pyramid": "pattern-printing/pattern-7-star-pyramid.md",
  "pattern-8-inverted-star-pyramid": "pattern-printing/pattern-8-inverted-star-pyramid.md",
  "pattern-9-diamond-star-pattern": "pattern-printing/pattern-9-diamond-star-pattern.md",
  "pattern-10-half-diamond-star-pattern": "pattern-printing/pattern-10-half-diamond-star-pattern.md",
  "pattern-11-binary-number-triangle": "pattern-printing/pattern-11-binary-number-triangle.md",
  "pattern-12-number-crown-pattern": "pattern-printing/pattern-12-number-crown-pattern.md",
  "pattern-13-increasing-number-triangle": "pattern-printing/pattern-13-increasing-number-triangle.md",
  "pattern-14-increasing-letter-triangle": "pattern-printing/pattern-14-increasing-letter-triangle.md",
  "pattern-15-reverse-letter-triangle": "pattern-printing/pattern-15-reverse-letter-triangle.md",
  "pattern-16-alpha-ramp-pattern": "pattern-printing/pattern-16-alpha-ramp-pattern.md",
  "pattern-17-alpha-hill-pattern": "pattern-printing/pattern-17-alpha-hill-pattern.md",
  "pattern-18-alpha-triangle-pattern": "pattern-printing/pattern-18-alpha-triangle-pattern.md",
  "pattern-19-symmetric-void-pattern": "pattern-printing/pattern-19-symmetric-void-pattern.md",
  "pattern-20-symmetric-butterfly-pattern": "pattern-printing/pattern-20-symmetric-butterfly-pattern.md",
  "pattern-21-hollow-rectangle-pattern": "pattern-printing/pattern-21-hollow-rectangle-pattern.md",
  "pattern-22-concentric-number-rectangle": "pattern-printing/pattern-22-concentric-number-rectangle.md",
  "search-x-in-sorted-array": "binary-search/search-x-in-sorted-array.md",
  "lower-bound": "binary-search/lower-bound.md",
  "upper-bound": "binary-search/upper-bound.md",
  "search-insert-position": "binary-search/search-insert-position.md",
  "floor-and-ceil-in-sorted-array": "binary-search/floor-and-ceil-in-sorted-array.md",
  "first-and-last-occurrence": "binary-search/first-and-last-occurrence.md",
  "count-occurrences-in-a-sorted-array": "binary-search/count-occurrences-in-a-sorted-array.md",
  "find-minimum-in-rotated-sorted-array": "binary-search/find-minimum-in-rotated-sorted-array.md",
  "find-out-how-many-times-the-array-is-rotated": "binary-search/find-out-how-many-times-the-array-is-rotated.md",
  "find-row-with-maximum-1s": "binary-search/find-row-with-maximum-1s.md",
  "search-in-rotated-sorted-array-i": "binary-search/search-in-rotated-sorted-array-i.md",
  "search-in-rotated-sorted-array-ii": "binary-search/search-in-rotated-sorted-array-ii.md",
  "single-element-in-a-sorted-array": "binary-search/single-element-in-a-sorted-array.md",
  "find-peak-element": "binary-search/find-peak-element.md",
  "find-square-root-of-a-number": "binary-search/find-square-root-of-a-number.md",
  "find-nth-root-of-a-number": "binary-search/find-nth-root-of-a-number.md",
  "koko-eating-bananas": "binary-search/koko-eating-bananas.md",
  "minimum-days-to-make-m-bouquets": "binary-search/minimum-days-to-make-m-bouquets.md",
  "selection-sort": "basic-sorting-algorithms/selection-sort.md",
  "largest-odd-number-in-a-string": "strings/largest-odd-number-in-a-string.md",
  "longest-common-prefix": "strings/longest-common-prefix.md",
  "isomorphic-string": "strings/isomorphic-string.md",
  "rotate-string": "strings/rotate-string.md",
  "check-if-two-strings-are-anagram-of-each-other": "strings/check-if-two-strings-are-anagram-of-each-other.md",
  "sort-characters-by-frequency": "strings/sort-characters-by-frequency.md",
  "count-number-of-substrings": "strings/count-number-of-substrings.md",
  "remove-outermost-parentheses": "strings/remove-outermost-parentheses.md",
  "reverse-words-in-a-given-string-palindrome-check": "strings/reverse-words-in-a-given-string-palindrome-check.md",
  "maximum-nesting-depth-of-the-parentheses": "strings/maximum-nesting-depth-of-the-parentheses.md",
  "roman-to-integer": "strings/roman-to-integer.md",
  "string-to-integer-atoi": "strings/string-to-integer-atoi.md",
  "longest-palindromic-substring": "strings/longest-palindromic-substring.md",
  "sum-of-beauty-of-all-substrings": "strings/sum-of-beauty-of-all-substrings.md",
  "reverse-every-word-in-a-string": "strings/reverse-every-word-in-a-string.md",
  "introduction-to-singly-linkedlist": "linked-lists/introduction-to-singly-linkedlist.md",
  "insertion-at-the-head-of-linked-list": "linked-lists/insertion-at-the-head-of-linked-list.md",
  "deletion-of-the-head-of-ll": "linked-lists/deletion-of-the-head-of-ll.md",
  "find-the-length-of-the-linked-list": "linked-lists/find-the-length-of-the-linked-list.md",
  "search-in-linked-list": "linked-lists/search-in-linked-list.md",
  "middle-of-a-linkedlist-tortoisehare-method": "linked-lists/middle-of-a-linkedlist-tortoisehare-method.md",
  "reverse-a-linkedlist-iterative": "linked-lists/reverse-a-linkedlist-iterative.md",
  "reverse-a-ll": "linked-lists/reverse-a-ll.md",
  "detect-a-loop-in-ll": "linked-lists/detect-a-loop-in-ll.md",
  "find-the-starting-point-in-ll": "linked-lists/find-the-starting-point-in-ll.md",
  "bubble-sort": "basic-sorting-algorithms/bubble-sort.md",
  "insertion-sorting": "basic-sorting-algorithms/insertion-sorting.md",
  "understand-recursion-by-print-something-n-times": "basic-recursion/understand-recursion-by-print-something-n-times.md",
  "print-name-n-times-using-recursion": "basic-recursion/print-name-n-times-using-recursion.md",
  "print-1-to-n-using-recursion": "basic-recursion/print-1-to-n-using-recursion.md",
  "print-n-to-1-using-recursion": "basic-recursion/print-n-to-1-using-recursion.md",
  "sum-of-first-n-numbers": "basic-recursion/sum-of-first-n-numbers.md",
  "factorial-of-a-given-number": "basic-recursion/factorial-of-a-given-number.md",
  "reverse-an-array": "basic-recursion/reverse-an-array.md",
  "check-if-string-is-palindrome-or-not": "basic-recursion/check-if-string-is-palindrome-or-not.md",
  "fibonacci-number": "basic-recursion/fibonacci-number.md",
  "pow-x-n": "advanced-recursion/pow-x-n.md",
  "learn-all-patterns-of-subsequences-theory": "advanced-recursion/learn-all-patterns-of-subsequences-theory.md",
  "count-all-subsequences-with-sum-k": "advanced-recursion/count-all-subsequences-with-sum-k.md",
  "check-if-there-exists-a-subsequence-with-sum-k": "advanced-recursion/check-if-there-exists-a-subsequence-with-sum-k.md",
  "recursive-implementation-of-atoi": "advanced-recursion/recursive-implementation-of-atoi.md",
  "count-good-numbers": "advanced-recursion/count-good-numbers.md",
  "sort-a-stack-using-recursion": "advanced-recursion/sort-a-stack-using-recursion.md",
  "reverse-a-stack": "advanced-recursion/reverse-a-stack.md",
  "introduction-to-bits-and-tricks": "bit-manipulation/introduction-to-bits-and-tricks.md",
  "check-if-the-i-th-bit-is-set-or-not": "bit-manipulation/check-if-the-i-th-bit-is-set-or-not.md",
  "check-if-a-number-is-odd-or-not": "bit-manipulation/check-if-a-number-is-odd-or-not.md",
  "check-if-a-number-is-power-of-2-or-not": "bit-manipulation/check-if-a-number-is-power-of-2-or-not.md",
  "count-the-number-of-set-bits": "bit-manipulation/count-the-number-of-set-bits.md",
  "set-unset-the-rightmost-unset-bit": "bit-manipulation/set-unset-the-rightmost-unset-bit.md",
  "swap-two-numbers": "bit-manipulation/swap-two-numbers.md",
  "divide-two-numbers-without-multiplication-and-division": "bit-manipulation/divide-two-numbers-without-multiplication-and-division.md",
  "minimum-bit-flips-to-convert-number": "bit-manipulation/minimum-bit-flips-to-convert-number.md",
  "single-number-i": "bit-manipulation/single-number-i.md",
  "power-set-bit-manipulation": "bit-manipulation/power-set-bit-manipulation.md",
  "xor-of-numbers-in-a-given-range": "bit-manipulation/xor-of-numbers-in-a-given-range.md",
  "single-number-iii": "bit-manipulation/single-number-iii.md",
  "generate-binary-strings-without-consecutive-1s": "advanced-recursion/generate-binary-strings-without-consecutive-1s.md",
  "generate-parentheses": "advanced-recursion/generate-parentheses.md",
};

const CONTENT_DIR = path.join(process.cwd(), "src", "content");

/**
 * Parsed containers, cached per process.
 *
 * Only in production, where the files genuinely cannot change while the server
 * is running. Caching in development would serve a stale container after every
 * edit to a .md file, which silently hides authoring changes until a restart.
 */
const cache = new Map<ContentId, SubtopicContent>();
const CACHE_ENABLED = process.env.NODE_ENV === "production";

/** Load one subtopic's container. Returns null when nothing is authored for that id. */
export async function getSubtopicContent(id: string): Promise<SubtopicContent | null> {
  if (!hasContent(id)) return null;

  if (CACHE_ENABLED) {
    const cached = cache.get(id);
    if (cached) return cached;
  }

  const text = await readFile(path.join(CONTENT_DIR, FILES[id]), "utf8");
  const content = parseSubtopicMarkdown(text);
  if (CACHE_ENABLED) cache.set(id, content);
  return content;
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
