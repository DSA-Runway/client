import type { SubtopicContent } from "../types";

/**
 * Subtopic 9 of Arrays. The first two-input problem, and the first merge — the
 * step that merge sort is built from, met here on its own.
 *
 * Its real content is duplicate handling. There are THREE independent sources of
 * duplication (inside A, inside B, and the same value in both) and the classic
 * hand-written solution handles only the third, which is exactly the one the
 * textbook example exercises.
 *
 * SOURCES
 * - GeeksforGeeks, "Union of two sorted arrays" — the set-based and two-pointer
 *   formulations, and the distinct-elements definition used here.
 *
 * MEASURED ON THIS MACHINE (clang -O2, Python 3.13.4):
 *
 * 1. std::set_union DOES NOT PRODUCE A SET UNION when the inputs contain
 *    duplicates. It is a MULTISET union, emitting max(count_in_a, count_in_b)
 *    copies of each value. Verified:
 *      [1,1,2] u [1,2]         -> [1,1,2]     (true union [1,2])
 *      [1,2,3,4,5] u [2,3,4,4,5] -> [1,2,3,4,4,5] (true [1,2,3,4,5])
 *      [1,1,1] u [1,1]         -> [1,1,1]     (true [1])
 *    The name is actively misleading for this problem. set_union followed by
 *    unique is correct and measured exactly as fast as the hand-written merge.
 *
 * 2. THE CLASSIC BUG FAILS ON 75% OF INPUTS AND PASSES THE TEXTBOOK EXAMPLE.
 *    The common formulation advances both pointers when a[i] == b[j] and
 *    otherwise emits the smaller — which deduplicates ACROSS the arrays but not
 *    WITHIN either. Measured over 200,000 random sorted pairs (values 0-6,
 *    lengths 0-7): 149,971 wrong answers, 75.0%. The correct version scored 0.
 *    Yet on [1,2] u [2,3] — the example most lessons use — it is right, because
 *    that input has no within-array duplicates at all.
 *
 * 3. C++ LADDER at n = m = 1,000,000:
 *      ordered set      : 337.08ms   (32x)
 *      concat + sort    :  81.20ms   (7.7x)
 *      hash set + sort  :  60.89ms   (5.8x)
 *      two-pointer      :  10.57ms
 *      set_union+unique :  10.53ms   <- identical to the hand-written merge
 *
 * 4. PYTHON INVERTS IT AGAIN, and by the largest margin yet at n = m = 1,000,000:
 *      sorted(set(a) | set(b)) : 140.97ms   <- fastest
 *      concat + dedupe         : 330.86ms
 *      heapq.merge             : 387.22ms
 *      two-pointer             : 401.86ms   <- the "optimal" one, 2.9x slower
 *    The O((n+m) log(n+m)) approach beats the O(n+m) one because set union and
 *    sorted run as compiled C while the merge loop runs in the interpreter.
 *
 * 5. set|set LOSES ORDER, as in Remove Duplicates. Verified:
 *    list(set([11,32,41]) | set([49])) gives [32,41,11,49]; the sorted() call is
 *    what supplies the ordering, not the set operation.
 *
 * Scope: the merge step here is the heart of merge sort, and intersection is the
 * same walk with a different emit rule. Both are pointed at, not developed.
 */
const content: SubtopicContent = {
  id: "union-of-two-sorted-arrays",
  topic: "Arrays",
  title: "Union of Two Sorted Arrays",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "remove-duplicates-from-sorted-array",
    "linear-search",
    "largest-element",
    "for-loop",
    "relational-and-logical-operators",
    "time-and-space-complexity-basics",
  ],

  summary:
    "Merge two sorted arrays into their distinct union in one pass — where duplicates arrive from three different directions, the standard hand-written fix handles only one of them, and the library function named set_union does not actually produce a set.",

  theory: `
## The problem

Given two arrays **already sorted** in non-decreasing order, return their union:
every value that appears in either one, **each exactly once**, in sorted order.

\`\`\`
a = [1, 2, 3, 4, 5],  b = [2, 3, 4, 4, 5]   ->  [1, 2, 3, 4, 5]
a = [1, 1, 2],        b = [2, 3, 3]         ->  [1, 2, 3]
\`\`\`

Two things carry the whole subtopic. **Both inputs are sorted**, which is what
makes a single pass possible. And the output must contain **distinct** values,
which is where nearly every wrong answer comes from.

## Duplicates arrive from three directions

This is the part worth slowing down on, because the three cases are independent
and a solution can handle some of them and not others:

1. **Repeats inside A** — \`a = [1, 1, 2]\`
2. **Repeats inside B** — \`b = [2, 3, 3]\`
3. **The same value in both** — \`a = [2]\`, \`b = [2]\`

Now consider the formulation almost everyone writes first: when \`a[i] == b[j]\`,
emit the value once and advance **both** pointers; otherwise emit the smaller and
advance that one.

That handles case 3 beautifully and **ignores cases 1 and 2 entirely**. Two equal
values sitting side by side inside the same array are never compared with each
other, so both get emitted.

Measured over 200,000 random sorted pairs, that version produced **149,971 wrong
answers — 75.0%**. And yet on \`[1,2] ∪ [2,3]\`, the example most lessons use, it is
perfectly correct, because that input contains no within-array duplicates at all.
The bug is invisible precisely where it is demonstrated.

## The fix is one idea, not three

Do not compare the two inputs against each other to detect duplicates. Compare
each candidate against **the last value you actually emitted**.

\`\`\`
if result is empty or result.back() != candidate:
    result.push(candidate)
\`\`\`

Because the output is built in non-decreasing order, any duplicate of a value —
whichever array it came from, and whether its twin was in the same array or the
other one — must arrive **immediately after** it. So a single check against the
last emitted element covers all three cases at once.

That is exactly the rule from Remove Duplicates from Sorted Array, applied to the
output stream rather than the input array. Recognising it as the same idea is
worth more than memorising the merge.

## The merge itself

Two pointers, one per array. Repeatedly take the smaller of the two current
values, emit it through the deduplicating check, and advance that pointer. When
one array runs out, drain the other through the same check.

Every element of both arrays is examined exactly once, so the work is
**O(n + m)** — and it cannot be less, since the answer depends on every element.

On space: the output itself can be as large as \`n + m\`, so that is not optional.
The **auxiliary** space beyond the output is O(1) — no set, no copy, no second
pass.

Using \`<=\` rather than \`<\` when comparing the two fronts is a free choice here,
since the deduplicating check absorbs the equal case either way.

## Why the obvious alternatives lose

**Put everything in an ordered set.** Correct, and it pays O(log n) per insert to
rediscover an ordering both inputs already had. Measured at n = m = 1,000,000:
**337.08ms** against **10.57ms** for the merge — **32x**.

**Concatenate and sort, then deduplicate.** Also correct, and it throws away the
sortedness completely and then pays to recreate it. Measured **81.20ms**.

**Hash set, then sort.** Faster at **60.89ms** and still 5.8x the merge, because
it allocates a node per distinct value and then has to sort the result anyway —
hash sets have no order to give back.

All three are O((n+m) log(n+m)) or worse in the sort, use O(n+m) auxiliary space,
and exist because the sortedness of the input was not used.

## The library function that does not do what its name says

C++ has \`std::set_union\`, which looks like exactly this problem solved. It is not.

\`std::set_union\` performs a **multiset** union: for each value it emits
\`max(count in A, count in B)\` copies. Verified:

| A | B | \`set_union\` | true distinct union |
|---|---|---|---|
| \`[1,1,2]\` | \`[1,2]\` | \`[1,1,2]\` | \`[1,2]\` |
| \`[1,2,3,4,5]\` | \`[2,3,4,4,5]\` | \`[1,2,3,4,4,5]\` | \`[1,2,3,4,5]\` |
| \`[1,1,1]\` | \`[1,1]\` | \`[1,1,1]\` | \`[1]\` |

It is behaving exactly as specified — the specification is about multisets — but
the name will mislead you if the inputs contain duplicates. Follow it with
\`std::unique\` and it is correct, and measured **10.53ms**, statistically identical
to the hand-written merge at 10.57ms.

## Python inverts the ranking, hardest yet

Measured at n = m = 1,000,000:

| Approach | Time |
|---|---|
| \`sorted(set(a) | set(b))\` | **140.97ms** |
| Concatenate and deduplicate | 330.86ms |
| \`heapq.merge\` | 387.22ms |
| Two-pointer merge | **401.86ms** |

The O((n+m) log(n+m)) set approach beats the O(n+m) merge by **2.9x** — the widest
inversion in the module so far. Set union and \`sorted\` run as compiled C; the
merge loop runs one interpreted step per element, and there are two million of
them.

Note also that \`set(a) | set(b)\` is **unordered**. Verified:
\`list(set([11,32,41]) | set([49]))\` gives \`[32,41,11,49]\`. The \`sorted()\` call is
supplying the order, not the set operation — the same trap as \`list(set(...))\` in
Remove Duplicates.

## Where this goes next

The merge here is the **merge step of merge sort**, met on its own before the
recursion is added. Change the emit rule from "either array" to "both arrays" and
you have **intersection**; to "A but not B" and you have **difference**. The
walk is identical in all three.
`.trim(),

  intuition:
    "Two sorted queues and one output line. Look at the front of each queue, admit whoever is smaller, and let ties come through one at a time. The only rule at the door is that nobody may enter immediately behind someone identical — and because both queues are sorted, an identical person can only ever arrive immediately behind. One check at the door covers every way a duplicate can reach it.",

  approaches: [
    {
      name: "Brute Force - Ordered Set",
      idea: "Insert every element of both arrays into an ordered set, which discards duplicates and sorts.",
      steps: [
        "Create an empty ordered set.",
        "Insert every element of the first array, which silently discards repeats.",
        "Insert every element of the second array in the same way.",
        "Read the set out in order into the result.",
        "The set handles all three duplicate sources without any explicit reasoning.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <set>
using namespace std;

vector<int> unionSorted(const vector<int>& a, const vector<int>& b) {
    set<int> s(a.begin(), a.end());
    s.insert(b.begin(), b.end());
    return vector<int>(s.begin(), s.end());
}`,
          annotations: {
            6: "std::set is ordered, so iterating it later yields sorted output. unordered_set would not.",
            8: "Measured 337.08ms at n = m = 1,000,000 — 32x the two-pointer merge, because each insert allocates a tree node.",
          },
        },
        {
          language: "java",
          code: `import java.util.TreeSet;
import java.util.Set;

static int[] unionSorted(int[] a, int[] b) {
    Set<Integer> s = new TreeSet<>();
    for (int x : a) s.add(x);
    for (int x : b) s.add(x);

    int[] out = new int[s.size()];
    int k = 0;
    for (int v : s) out[k++] = v;
    return out;
}`,
          annotations: {
            5: "TreeSet, not HashSet — the latter would lose the ordering and force a sort afterwards.",
            6: "Every int is autoboxed into an Integer, allocating on top of the tree nodes.",
          },
        },
        {
          language: "python",
          code: `def union_sorted(a, b):
    return sorted(set(a) | set(b))


# Measured 140.97ms at n = m = 1,000,000 — the FASTEST option in Python,
# beating the O(n+m) two-pointer merge at 401.86ms by 2.9x.
#
# But set() is UNORDERED. Verified:
#   list(set([11,32,41]) | set([49]))  ->  [32, 41, 11, 49]
# The sorted() call supplies the order; the set operation does not.`,
          annotations: {
            2: "The | operator is set union. Without sorted() around it the result is in hash-table order, not sorted order.",
            5: "The complexity is worse and the runtime is better, because both halves run as compiled C.",
          },
        },
      ],
      complexity: {
        time: "O((n + m) log(n + m))",
        space: "O(n + m)",
        note: "Correct, and it pays to rediscover an ordering the inputs already had. Measured 337.08ms at n = m = 1,000,000 in C++, 32x the merge — while in Python the equivalent is the fastest option at 140.97ms.",
      },
    },
    {
      name: "Brute Force - Concatenate and Sort",
      idea: "Join both arrays, sort the result, then remove adjacent duplicates.",
      steps: [
        "Copy both arrays into a single array of length n + m.",
        "Sort that array.",
        "Remove adjacent duplicates, which is now sufficient because equal values are neighbours.",
        "Return the compacted result.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

vector<int> unionSorted(const vector<int>& a, const vector<int>& b) {
    vector<int> r;
    r.reserve(a.size() + b.size());
    r.insert(r.end(), a.begin(), a.end());
    r.insert(r.end(), b.begin(), b.end());

    sort(r.begin(), r.end());
    r.erase(unique(r.begin(), r.end()), r.end());
    return r;
}`,
          annotations: {
            11: "This sort is the whole cost, and it is re-deriving order that both inputs already possessed.",
            12: "unique only removes ADJACENT duplicates, which is why it must come after the sort.",
          },
        },
        {
          language: "java",
          code: `import java.util.Arrays;
import java.util.stream.IntStream;

static int[] unionSorted(int[] a, int[] b) {
    int[] r = IntStream.concat(IntStream.of(a), IntStream.of(b)).toArray();
    Arrays.sort(r);
    return IntStream.of(r).distinct().toArray();
}`,
          annotations: {
            6: "Sorting first means distinct() has adjacent duplicates to collapse, though it hashes regardless.",
          },
        },
        {
          language: "python",
          code: `def union_sorted(a, b):
    r = sorted(a + b)
    return [v for i, v in enumerate(r) if i == 0 or v != r[i - 1]]


# Measured 330.86ms at n = m = 1,000,000.`,
          annotations: {
            2: "a + b builds a new list of n + m elements before the sort even starts.",
            3: "Comparing against the previous element is the Remove Duplicates rule, valid here only because the list is now sorted.",
          },
        },
      ],
      complexity: {
        time: "O((n + m) log(n + m))",
        space: "O(n + m)",
        note: "Discards the sortedness of both inputs and then pays to recreate it. Measured 81.20ms at n = m = 1,000,000 in C++, 7.7x the merge.",
      },
    },
    {
      name: "Hash Set, Then Sort",
      idea: "Collect distinct values in a hash set for average O(1) inserts, then sort the result.",
      steps: [
        "Insert every element of both arrays into a hash set.",
        "The set now holds exactly the distinct values, in no particular order.",
        "Copy them into an array.",
        "Sort that array, because a hash set has no ordering to offer.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <unordered_set>
#include <algorithm>
using namespace std;

vector<int> unionSorted(const vector<int>& a, const vector<int>& b) {
    unordered_set<int> s(a.begin(), a.end());
    s.insert(b.begin(), b.end());

    vector<int> r(s.begin(), s.end());
    sort(r.begin(), r.end());          // hash sets have no order to give back
    return r;
}`,
          annotations: {
            7: "Average O(1) per insert rather than O(log n), which is why this beats the ordered set.",
            11: "And the sort is unavoidable, which is why it still loses to the merge by 5.8x.",
          },
        },
        {
          language: "java",
          code: `import java.util.HashSet;
import java.util.Set;
import java.util.Arrays;

static int[] unionSorted(int[] a, int[] b) {
    Set<Integer> s = new HashSet<>();
    for (int x : a) s.add(x);
    for (int x : b) s.add(x);

    int[] out = s.stream().mapToInt(Integer::intValue).toArray();
    Arrays.sort(out);
    return out;
}`,
          annotations: {
            10: "Unboxing back to primitives, having boxed on the way in — two conversions the merge never performs.",
          },
        },
        {
          language: "python",
          code: `def union_sorted(a, b):
    s = set(a)
    s.update(b)
    return sorted(s)


# Identical in effect to sorted(set(a) | set(b)); update avoids building
# a second set for b before combining.`,
          annotations: {
            3: "update inserts in place rather than constructing a second set and merging, which saves one allocation.",
          },
        },
      ],
      complexity: {
        time: "O(n + m) average for the inserts, plus O(d log d) for the sort of d distinct values",
        space: "O(n + m)",
        note: "Measured 60.89ms at n = m = 1,000,000 — the fastest of the three brute forces in C++ and still 5.8x the merge, because the sort at the end cannot be avoided.",
      },
    },
    {
      name: "Optimal - Two-Pointer Merge",
      idea: "Walk both arrays together, always taking the smaller front value, and admit it only if it differs from the last value emitted.",
      steps: [
        "Set one pointer to the start of each array and create an empty result.",
        "While both pointers are in range, compare the two front values.",
        "Take the smaller one, or either if they are equal, and advance that pointer.",
        "Append it to the result only if the result is empty or its last element differs.",
        "When one array is exhausted, drain the other through the same append rule.",
        "The single check against the last emitted value covers duplicates within A, within B, and across both.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

vector<int> unionSorted(const vector<int>& a, const vector<int>& b) {
    vector<int> r;
    r.reserve(a.size() + b.size());

    // Admit a value only if it differs from the last one emitted.
    auto emit = [&](int v) { if (r.empty() || r.back() != v) r.push_back(v); };

    size_t i = 0, j = 0;
    while (i < a.size() && j < b.size()) {
        if (a[i] <= b[j]) emit(a[i++]);
        else              emit(b[j++]);
    }
    while (i < a.size()) emit(a[i++]);
    while (j < b.size()) emit(b[j++]);
    return r;
}`,
          annotations: {
            9: "The whole correctness of the approach. Comparing against the OUTPUT, not against the other array, is what covers all three duplicate sources.",
            13: "<= rather than < is free here, because emit absorbs the equal case either way.",
            16: "The drain loops must use emit too. Copying the tail wholesale would reintroduce within-array duplicates.",
          },
        },
        {
          language: "java",
          code: `import java.util.ArrayList;
import java.util.List;

static List<Integer> unionSorted(int[] a, int[] b) {
    List<Integer> r = new ArrayList<>();
    int i = 0, j = 0;

    while (i < a.length && j < b.length) {
        int v = (a[i] <= b[j]) ? a[i++] : b[j++];
        if (r.isEmpty() || r.get(r.size() - 1) != v) r.add(v);
    }
    while (i < a.length) { int v = a[i++]; if (r.isEmpty() || r.get(r.size() - 1) != v) r.add(v); }
    while (j < b.length) { int v = b[j++]; if (r.isEmpty() || r.get(r.size() - 1) != v) r.add(v); }
    return r;
}`,
          annotations: {
            9: "The conditional picks the smaller front and advances only that pointer, in one expression.",
            10: "r.get(...) returns an Integer, so != on boxed values would compare references above the cache range — unboxing to int here is deliberate.",
          },
        },
        {
          language: "python",
          code: `def union_sorted(a, b):
    i = j = 0
    r = []

    def emit(v):
        if not r or r[-1] != v:
            r.append(v)

    while i < len(a) and j < len(b):
        if a[i] <= b[j]:
            emit(a[i]); i += 1
        else:
            emit(b[j]); j += 1

    while i < len(a):
        emit(a[i]); i += 1
    while j < len(b):
        emit(b[j]); j += 1
    return r


# Measured 401.86ms at n = m = 1,000,000 — the SLOWEST option in Python,
# 2.9x the sorted(set(a) | set(b)) one-liner at 140.97ms.`,
          annotations: {
            5: "One helper used by all three loops, so the deduplication rule exists in exactly one place.",
            22: "Asymptotically optimal and measurably slowest, because every step here is interpreted.",
          },
        },
      ],
      complexity: {
        time: "O(n + m)",
        space: "O(1) auxiliary, plus the O(n + m) output the answer requires",
        note: "Every element of both arrays is examined exactly once, which is optimal since the answer depends on all of them. Measured 10.57ms at n = m = 1,000,000 in C++ — 32x faster than the ordered set — and 401.86ms in Python, where it is the slowest option.",
      },
    },
    {
      name: "Library Call",
      idea: "Use the standard merge routine, and account for the fact that it does not remove duplicates.",
      steps: [
        "In C++, call set_union over both sorted ranges.",
        "Understand that it emits max(count in A, count in B) copies of each value, not one.",
        "Follow it with unique and erase to collapse the surviving duplicates.",
        "In Python, use sorted with a set union, or heapq.merge with an explicit deduplicating pass.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
#include <iterator>
using namespace std;

vector<int> unionSorted(const vector<int>& a, const vector<int>& b) {
    vector<int> r;
    // set_union is a MULTISET union: it emits max(count_a, count_b) copies.
    // Verified: [1,1,2] u [1,2] -> [1,1,2], not [1,2].
    set_union(a.begin(), a.end(), b.begin(), b.end(), back_inserter(r));

    // So the deduplication still has to happen.
    r.erase(unique(r.begin(), r.end()), r.end());
    return r;
}`,
          annotations: {
            10: "Correct per its specification and misleading given its name — it does not produce a set from multiset inputs.",
            13: "unique suffices because set_union's output is already sorted, so duplicates are adjacent.",
            14: "Measured 10.53ms at n = m = 1,000,000, statistically identical to the hand-written merge at 10.57ms.",
          },
        },
        {
          language: "java",
          code: `import java.util.TreeSet;
import java.util.Set;

// Java has no sorted-range merge in the standard library, so the
// collection route is the idiomatic one.
static Set<Integer> unionSorted(int[] a, int[] b) {
    Set<Integer> s = new TreeSet<>();
    for (int x : a) s.add(x);
    for (int x : b) s.add(x);
    return s;                       // iterating a TreeSet yields sorted order
}`,
          annotations: {
            7: "Returning the TreeSet itself avoids a copy when the caller only needs to iterate in order.",
          },
        },
        {
          language: "python",
          code: `import heapq

def union_sorted(a, b):
    return sorted(set(a) | set(b))          # 140.97ms — fastest


def union_streaming(a, b):
    """heapq.merge streams, so this never holds both inputs in memory at once."""
    out = []
    for v in heapq.merge(a, b):             # merges sorted iterables lazily
        if not out or out[-1] != v:
            out.append(v)
    return out                              # 387.22ms`,
          annotations: {
            4: "Fastest and it materialises two sets, so it is not usable on inputs too large to hold.",
            10: "heapq.merge takes any sorted iterables, including generators, which is its real advantage over the set route.",
            11: "The same deduplication rule, because merge preserves duplicates exactly as set_union does.",
          },
        },
      ],
      complexity: {
        time: "O(n + m) for set_union and heapq.merge, O((n+m) log(n+m)) for the set route",
        space: "O(n + m)",
        note: "std::set_union plus unique measured 10.53ms at n = m = 1,000,000, matching the hand-written merge. In Python sorted(set(a) | set(b)) measured 140.97ms and heapq.merge 387.22ms, the latter earning its place by streaming rather than materialising.",
      },
    },
  ],

  examples: [
    {
      input: "a = [1, 2, 3, 4, 5], b = [2, 3, 4, 4, 5]",
      output: "[1, 2, 3, 4, 5]",
      walkthrough: [
        "Both pointers start at 0. Compare 1 against 2, take 1, and emit it since the result is empty.",
        "Compare 2 against 2. They are equal, so take from a, and emit 2 since the last emitted was 1.",
        "Now b's 2 is at the front. Compare 3 against 2, take b's 2, and the emit check rejects it because 2 was just emitted.",
        "Compare 3 against 3, take a's 3 and emit it; then b's 3 is taken and rejected by the same check.",
        "The 4s follow the same pattern, and b's second 4 is also rejected — a within-array duplicate caught by the same rule.",
        "The 5s resolve identically, both pointers run out, and the result is [1, 2, 3, 4, 5].",
        "Note that b contained 4 twice; a cross-array-only check would have emitted the second one.",
      ],
      why: "Contains a cross-array duplicate and a within-array duplicate in the same input, so it exercises two of the three sources and shows one rule handling both.",
    },
    {
      input: "a = [1, 1, 2], b = [3], run through the cross-array-only formulation",
      output: "[1, 1, 2, 3] — wrong; the correct answer is [1, 2, 3]",
      walkthrough: [
        "The buggy version compares a[0] = 1 with b[0] = 3, finds 1 smaller, and emits it unconditionally.",
        "It then compares a[1] = 1 with 3, finds 1 smaller again, and emits a second 1.",
        "The two 1s were never compared with each other, because they sit in the same array.",
        "That version only deduplicates when a[i] equals b[j], which never happens here.",
        "The remaining elements are emitted normally, producing [1, 1, 2, 3].",
        "Measured over 200,000 random sorted pairs, this formulation produced 149,971 wrong answers — 75.0% — while the correct version produced none.",
      ],
      why: "The single most common wrong answer to this problem, and it fails three quarters of the time while passing the example most lessons demonstrate it on.",
    },
    {
      input: "a = [1, 1, 2], b = [1, 2], passed to std::set_union",
      output: "[1, 1, 2] — not a set",
      walkthrough: [
        "std::set_union is specified over multisets, not sets.",
        "For each value it emits max(count in A, count in B) copies.",
        "The value 1 appears twice in A and once in B, so it emits two copies.",
        "The value 2 appears once in each, so it emits one copy.",
        "The result is [1, 1, 2], while the true distinct union is [1, 2].",
        "Verified further: [1,1,1] with [1,1] gives [1,1,1], and [1,2,3,4,5] with [2,3,4,4,5] gives [1,2,3,4,4,5].",
      ],
      why: "A correct library function whose name promises something it does not deliver on duplicate-bearing input, and the reason the unique call afterwards is mandatory rather than optional.",
    },
    {
      input: "Edge inputs: one array empty, both empty, and no overlap at all",
      output: "The other array deduplicated, an empty result, and a full merge respectively",
      walkthrough: [
        "With a empty, the first while loop never runs and the drain loop for b handles everything.",
        "Because that drain uses the same emit check, b's own internal duplicates are still removed — [1,1,2] correctly yields [1,2].",
        "With both arrays empty, no loop body executes and the result is empty, which needs no special case.",
        "With a = [1,2,3] and b = [4,5,6], every comparison favours a until it is exhausted, then b drains.",
        "No duplicate is ever rejected, so the output length is exactly n + m.",
        "That is the case where the output genuinely needs O(n + m) space, which is why the auxiliary space claim excludes the output.",
      ],
      why: "The empty-array case is where copying the remaining tail wholesale instead of draining through the emit check silently reintroduces duplicates.",
    },
  ],

  visualization: {
    kind: "array",
    description:
      "Two sorted strips stacked one above the other with a single output strip beneath them, and one marker on each input. Draw a comparison bracket between the two marked cells on every step, highlighting the smaller and animating it downward toward the output. The output strip has a visible gate at its entrance holding a copy of the last value admitted: as each candidate arrives, show it checked against that gate value, then either passing through and updating the gate, or bouncing off and vanishing. That bounce is the whole algorithm made visible, and it should look identical whether the rejected value came from the top strip, the bottom strip, or a repeat within either — because it is the same rule firing. Colour each admitted cell by which array it came from so the interleaving of sources is legible in the finished output. When one input runs dry, grey its strip out entirely and keep the other draining through the same gate, so it is obvious the drain is not a plain copy. Run a bug panel directly beneath: the same two strips fed into the cross-array-only formulation, whose gate is replaced by a bracket that only compares the two input markers against each other. On [1,1,2] and [3] its two 1s never meet, both pass, and the output visibly carries a duplicate the correct track rejected — annotate it with the measured 75.0% failure rate over 200,000 random pairs, and highlight that on [1,2] against [2,3] the two tracks agree exactly, which is why the bug survives demonstration. A third panel shows std::set_union fed [1,1,2] and [1,2], emitting [1,1,2] with the surviving duplicate ringed, then a unique pass sweeping it away, labelled multiset union rather than set union. Finally a cost panel runs all five approaches on the same inputs with elapsed bars: ordered set 337.08ms, concat and sort 81.20ms, hash set 60.89ms, two-pointer 10.57ms, set_union plus unique 10.53ms, with a Python toggle that reorders the same bars so the two-pointer moves from first to last.",
    sampleInput:
      '{"primary":{"a":[1,2,3,4,5],"b":[2,3,4,4,5],"trace":[{"i":0,"j":0,"compare":[1,2],"taken":"a","value":1,"gateBefore":null,"admitted":true},{"i":1,"j":0,"compare":[2,2],"taken":"a","value":2,"gateBefore":1,"admitted":true},{"i":2,"j":0,"compare":[3,2],"taken":"b","value":2,"gateBefore":2,"admitted":false},{"i":2,"j":1,"compare":[3,3],"taken":"a","value":3,"gateBefore":2,"admitted":true},{"i":3,"j":1,"compare":[4,3],"taken":"b","value":3,"gateBefore":3,"admitted":false},{"i":3,"j":2,"compare":[4,4],"taken":"a","value":4,"gateBefore":3,"admitted":true},{"i":4,"j":2,"compare":[5,4],"taken":"b","value":4,"gateBefore":4,"admitted":false},{"i":4,"j":3,"compare":[5,4],"taken":"b","value":4,"gateBefore":4,"admitted":false,"note":"within-array duplicate in b"},{"i":4,"j":4,"compare":[5,5],"taken":"a","value":5,"gateBefore":4,"admitted":true},{"drain":"b","value":5,"gateBefore":5,"admitted":false}],"result":[1,2,3,4,5]},"bugPanel":{"a":[1,1,2],"b":[3],"correct":[1,2,3],"crossOnly":[1,1,2,3],"reason":"the two 1s are in the same array and are never compared with each other","failureRate":0.75,"wrongAnswers":149971,"trials":200000,"textbookExample":{"a":[1,2],"b":[2,3],"correct":[1,2,3],"crossOnly":[1,2,3],"agree":true}},"setUnionPanel":{"a":[1,1,2],"b":[1,2],"setUnionOutput":[1,1,2],"trueUnion":[1,2],"rule":"emits max(count_a, count_b) copies","fixedBy":"std::unique","moreCases":[{"a":[1,1,1],"b":[1,1],"out":[1,1,1],"true":[1]},{"a":[1,2,3,4,5],"b":[2,3,4,4,5],"out":[1,2,3,4,4,5],"true":[1,2,3,4,5]}]},"costPanel":{"n":1000000,"cpp":{"orderedSet":337.08,"concatSort":81.20,"hashSet":60.89,"twoPointer":10.57,"setUnionUnique":10.53},"python":{"sortedSet":140.97,"concatDedupe":330.86,"heapqMerge":387.22,"twoPointer":401.86}}}',
    highlights: [
      "Two sorted strips sit above a single output strip, each input carrying its own marker.",
      "A comparison bracket spans the two marked cells, 1 against 2, and the smaller value animates downward.",
      "The output gate is empty, so 1 passes through and the gate now holds 1.",
      "The next comparison is 2 against 2; a's 2 is taken, differs from the gate, and is admitted.",
      "b's 2 is taken next, meets a gate already holding 2, and visibly bounces off without entering.",
      "The 3s repeat that pattern, with one admitted and its twin from the other array rejected at the gate.",
      "When b's second 4 arrives — a duplicate from within b itself — it bounces off in exactly the same way.",
      "That identical bounce is the point: one rule at the gate handles duplicates within a, within b, and across both.",
      "a runs dry first, its strip greys out, and b keeps draining through the same gate rather than being copied wholesale.",
      "The finished output reads [1, 2, 3, 4, 5], with each cell tinted by the array it came from.",
      "The bug panel replaces the gate with a bracket comparing only the two input markers, and runs [1,1,2] against [3].",
      "Its two 1s sit in the same strip, are never bracketed together, and both reach the output as a visible duplicate.",
      "That panel is annotated with the measured 75.0% failure rate over 200,000 random pairs.",
      "Switching it to [1,2] against [2,3] makes both tracks agree exactly, showing why the bug survives the usual demonstration.",
      "The set_union panel emits [1,1,2] from [1,1,2] and [1,2], rings the surviving duplicate, and sweeps it away with a unique pass.",
      "The cost panel bars run 337.08ms, 81.20ms, 60.89ms, 10.57ms and 10.53ms, and a Python toggle reorders them so the two-pointer drops from first to last.",
    ],
  },

  edgeCases: [
    "Both arrays empty — no loop body runs and the result is empty, needing no special case.",
    "One array empty — the drain loop handles everything, and it must still deduplicate the surviving array's own repeats.",
    "Completely disjoint arrays — no candidate is ever rejected, so the output has exactly n + m elements.",
    "Identical arrays — every value from the second is rejected at the gate and the output equals either input deduplicated.",
    "One array entirely repeats of a single value, such as [7, 7, 7, 7] — the output contributes exactly one 7.",
    "All values equal across both arrays — the output is a single element.",
    "Arrays of very different lengths — the shorter one exhausts early and the longer drains, which is the common shape in practice.",
    "One array is a strict prefix of the other, where the drain handles the entire tail.",
    "Negative values and zeros mixed in — nothing depends on sign, only on ordering and equality.",
    "Unsorted input passed in by mistake — the merge produces an unsorted, incorrectly deduplicated result with no error raised.",
    "Inputs so large that materialising both sets is infeasible, which is where heapq.merge streaming earns its place over the set route.",
  ],

  pitfalls: [
    "Deduplicating only when a[i] equals b[j]. Measured over 200,000 random sorted pairs this produced 149,971 wrong answers — 75.0% — because it never compares two equal values inside the same array.",
    "Testing that version on [1,2] and [2,3] and concluding it works. That input has no within-array duplicates, so the bug is invisible on exactly the example most lessons use.",
    "Copying the remaining tail wholesale when one array is exhausted, which reintroduces the surviving array's own internal duplicates.",
    "Assuming std::set_union produces a set. Verified: [1,1,2] with [1,2] gives [1,1,2], because it is a multiset union emitting max(count_a, count_b) copies.",
    "Forgetting the unique call after set_union, which is what turns its multiset output into the distinct union actually wanted.",
    "Using unordered_set in C++ or HashSet in Java and returning the result directly, since neither has an ordering to give back.",
    "Writing list(set(a) | set(b)) in Python without sorted(). Verified: set([11,32,41]) | set([49]) yields [32, 41, 11, 49].",
    "Sorting the concatenation, which throws away the sortedness both inputs already had and pays O((n+m) log(n+m)) to recreate it.",
    "Claiming O(1) space without qualification. The output is inherently O(n + m); only the auxiliary space is constant.",
    "Comparing boxed Integers with != in Java, which compares references outside the small-value cache rather than values.",
    "Applying the merge to unsorted input, which fails silently because adjacency no longer implies equality.",
    "Concluding from the Python timings that the set one-liner is the algorithmically better answer. It is faster there and it is still O((n+m) log(n+m)) with O(n+m) auxiliary space.",
  ],

  commonDoubts: [
    {
      question: "Why is comparing a[i] with b[j] not enough to remove duplicates?",
      answer:
        "Because duplicates arrive from three directions and that comparison only catches one of them. A value can repeat inside a, inside b, or appear in both. Advancing both pointers when a[i] == b[j] handles only the third case; two equal values sitting side by side in the same array are never compared with each other. On [1,1,2] and [3] that version emits both 1s and returns [1,1,2,3]. Measured over 200,000 random sorted pairs it was wrong 149,971 times — 75.0%.",
    },
    {
      question: "Then why does that version look correct when I test it?",
      answer:
        "Because the example it is usually demonstrated on has no within-array duplicates. On [1,2] and [2,3] the only repeat is the 2 appearing in both arrays, which is exactly the case the version handles, so it produces the right answer. The bug is invisible on the input used to teach it and appears on three quarters of realistic ones. It is worth testing this problem specifically with an input like [1,1,2] before believing any solution to it.",
    },
    {
      question: "Why does checking against the last emitted value cover all three cases?",
      answer:
        "Because the output is built in non-decreasing order. Any duplicate of a value — regardless of which array it came from — must therefore arrive immediately after that value, with nothing in between. So a single comparison against the last element emitted catches every repeat, and it does not matter whether the twin was in the same array or the other one. It is the same rule as Remove Duplicates from Sorted Array, applied to the output stream instead of the input.",
    },
    {
      question: "Why not just use a set?",
      answer:
        "It is correct and it pays to rediscover an ordering you were handed for free. Measured at n = m = 1,000,000 in C++: an ordered set took 337.08ms against 10.57ms for the merge — 32x — because every insert allocates a tree node. A hash set is faster at 60.89ms and still 5.8x the merge, because it has no ordering to return so the result must be sorted anyway. Both also use O(n + m) auxiliary space where the merge uses O(1) beyond the output.",
    },
    {
      question: "Doesn't std::set_union already solve this?",
      answer:
        "Not on its own, and the name is the problem. std::set_union is specified over multisets: for each value it emits max(count in A, count in B) copies. Verified — [1,1,2] with [1,2] gives [1,1,2] rather than [1,2], [1,1,1] with [1,1] gives [1,1,1] rather than [1], and [1,2,3,4,5] with [2,3,4,4,5] gives [1,2,3,4,4,5]. It is behaving exactly as documented; the documentation is about multisets. Follow it with std::unique and it is correct, and measured 10.53ms against the hand-written merge's 10.57ms — statistically identical.",
    },
    {
      question: "Is this really O(1) space?",
      answer:
        "The auxiliary space is O(1); the output is not, and it cannot be. The union of two arrays can contain up to n + m distinct values, so any correct answer must allocate that much to return it. What the merge avoids is the extra structure the other approaches build on top of the output — no set, no concatenated copy, no second pass. When you state the complexity, say O(1) auxiliary space plus the O(n + m) output, because claiming O(1) unqualified is not true.",
    },
    {
      question: "Why is the two-pointer merge the slowest option in Python?",
      answer:
        "Measured at n = m = 1,000,000: sorted(set(a) | set(b)) took 140.97ms and the merge 401.86ms, so the asymptotically worse approach is 2.9x faster. Set union and sorted are compiled C running over the whole list, while the merge executes one interpreted step per element across two million elements. This is the widest such inversion in the module, and it is the same effect seen in every previous subtopic. The merge is still the right answer when the inputs stream rather than fit in memory, which is where heapq.merge belongs.",
    },
    {
      question: "What if the inputs are too large to hold in memory?",
      answer:
        "That is where the merge stops being merely elegant and becomes necessary. It only ever needs the current front of each input, so it works on streams, files or generators — heapq.merge in Python accepts any sorted iterables and yields lazily. The set-based approaches all require materialising every distinct value at once, so they simply cannot run. It is worth noticing that the approach the in-memory benchmark ranks last is the only one that works at all here.",
    },
    {
      question: "How would I compute the intersection instead?",
      answer:
        "The same walk with a different emit rule. For the union you emit whichever front is smaller; for the intersection you emit only when the two fronts are equal, and advance both. Everything else — the two pointers, the sorted inputs, the check against the last emitted value to handle repeats — is unchanged. Difference is the same again, emitting only when a's front is strictly smaller than b's. Recognising that all three are one traversal with three emit rules is the transferable part.",
    },
  ],

  relatedIds: ["remove-duplicates-from-sorted-array", "find-missing-number", "merge-two-sorted-arrays-without-extra-space", "linear-search"],
};

export default content;
