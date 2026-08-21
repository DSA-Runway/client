/**
 * Which subtopics have an authored container.
 *
 * Client-safe on purpose: this module holds ids only, never content bodies, so
 * the UI can show authoring coverage without pulling megabytes of theory into
 * the browser bundle. The actual content is loaded server-side via registry.ts.
 *
 * Add an id here and a loader in registry.ts — TypeScript fails the build if the
 * two drift apart.
 */
export const CONTENT_IDS = [
  "introduction-to-programming",
  "data-types",
  "variables-and-constants",
  "input-and-output",
  "arithmetic-operators",
  "relational-and-logical-operators",
  "type-conversion-and-casting",
  "if-else-statements",
  "else-if-ladder",
  "switch-case",
  "for-loop",
  "while-loop",
  "do-while-loop",
  "for-each-loop",
  "break-and-continue",
  "functions-declaration-and-calling",
  "nested-loops",
  "function-parameters-and-return-values",
  "pass-by-value-vs-pass-by-reference",
  "variable-scope-and-lifetime",
  "function-overloading",
  "count-digits",
  "reverse-a-number",
  "palindrome-number",
  "gcd-euclidean-algorithm",
  "lcm",
  "prime-check",
  "time-and-space-complexity-basics",
  "stack-memory-and-recursion-depth",
  "integer-overflow-and-precision-errors",
  "largest-element",
  "second-largest-element",
  "check-if-array-is-sorted-and-rotated",
  "remove-duplicates-from-sorted-array",
  "left-rotate-array-by-one",
  "left-rotate-array-by-k-places",
  "move-zeros-to-end",
  "linear-search",
  "union-of-two-sorted-arrays",
  "find-missing-number",
  "maximum-consecutive-ones",
  "two-sum",
  "majority-element-i",
  "pascals-triangle-i",
  "find-the-number-that-appears-once-and-other-numbers-twice",
  "longest-subarray-with-given-sum-k-positives",
  "longest-subarray-with-sum-k",
  "sort-an-array-of-0s-1s-and-2s",
  "kadanes-algorithm",
  "print-subarray-with-maximum-subarray-sum",
  "stock-buy-and-sell",
  "rearrange-array-elements-by-sign",
  "next-permutation",
  "leaders-in-an-array",
  "longest-consecutive-sequence-in-an-array",
  "set-matrix-zeroes",
  "rotate-matrix-by-90-degrees",
  "print-the-matrix-in-spiral-manner",
  "count-subarrays-with-given-sum",
  "3-sum",
  "4-sum",
  "largest-subarray-with-sum-0",
  "merge-overlapping-subintervals",
  "merge-two-sorted-arrays-without-extra-space",
  "majority-element-ii",
  "count-subarrays-with-given-xor-k",
  "find-the-repeating-and-missing-number",
  "count-inversions",
] as const;

export type ContentId = (typeof CONTENT_IDS)[number];

const ID_SET: ReadonlySet<string> = new Set(CONTENT_IDS);

export function hasContent(id: string): id is ContentId {
  return ID_SET.has(id);
}
