import type { SubtopicContent } from "../types";

/**
 * Subtopic 2 of Arrays. Looks like a one-line variation on Largest Element and
 * is not — the word "second" hides a definition choice that splits every
 * approach into a correct and an incorrect version.
 *
 * SOURCES
 * - GeeksforGeeks, "Find second largest element in an array" — the sort-based,
 *   two-traversal and single-traversal approaches, and the convention of
 *   returning -1 when no second distinct element exists.
 *
 * MEASURED ON THIS MACHINE (clang -O2, Python 3.13.4):
 *
 * 1. THE DUPLICATE DISAGREEMENT IS REAL AND SILENT. Verified: on [5, 5, 2] the
 *    naive sorted[n-2] returns 5 — the largest again — while every distinct-aware
 *    approach returns 2. On [10, 10, 10] the naive form returns 10 where the
 *    correct answer is "none". Both wrong answers look completely plausible,
 *    which is what makes this the defining bug of the subtopic.
 *
 * 2. THE "OPTIMAL" SINGLE PASS IS MEASURABLY SLOWER THAN TWO PASSES, in BOTH
 *    languages, for two DIFFERENT reasons. This is the headline result.
 *
 *      C++    n = 1e6 : one pass 2.047ms, two passes 1.612ms -> two-pass is 0.79x
 *             n = 1e7 : one pass 20.535ms, two passes 16.403ms -> 0.80x
 *             Mechanism confirmed by the compiler itself. With
 *             -Rpass=loop-vectorize, clang reports the two-pass max loop
 *             "vectorized loop (vectorization width: 4, interleaved count: 4)"
 *             — 16 ints per iteration — while the single-pass loop is NOT
 *             vectorized, because its if/else-if chain carries a data-dependent
 *             update that cannot be turned into a SIMD reduction.
 *
 *      Python n = 1e6 : one pass 55.36ms, two passes 46.51ms -> 0.84x
 *             Different mechanism entirely: the two-pass version spends its
 *             first pass inside the C implementation of max(), so only one of
 *             its two traversals pays interpreter overhead.
 *
 *    Same Theta(n), and the version that touches memory TWICE wins by ~20% on
 *    both runtimes. The single pass is still the right thing to teach — it is
 *    the pattern that generalises — but "one traversal is faster" is an
 *    assumption this data does not support.
 *
 * 3. SORTING COSTS MUCH MORE THAN EITHER. n = 1e6: 21,944,322 comparisons
 *    against roughly 3n for the scans, and 34.045ms against 2.047ms — 33x.
 *
 * 4. THE INT_MIN SENTINEL IS GENUINELY AMBIGUOUS. Verified on [INT_MIN, INT_MIN]:
 *    with second initialised to INT_MIN there is no way to distinguish "no
 *    second element was found" from "the second element is INT_MIN". Widening
 *    the tracker to long long removes the ambiguity, which is why the samples
 *    here do that rather than using the array's own type.
 *
 * 5. heapq.nlargest DOES NOT DEDUPLICATE. Verified: heapq.nlargest(2, [5,5,2])
 *    returns [5, 5], so the "obvious" Python one-liner answers the wrong
 *    question unless a set() is applied first.
 *
 * Scope: k-th largest in general, and selection algorithms such as nth_element
 * and quickselect, are later material. This container stops at k = 2.
 */
const content: SubtopicContent = {
  id: "second-largest-element",
  topic: "Arrays",
  title: "Second Largest Element",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "largest-element",
    "for-loop",
    "if-else-statements",
    "relational-and-logical-operators",
    "data-types",
    "integer-overflow-and-precision-errors",
  ],

  summary:
    "Find the second largest distinct value in one pass — and discover that the word 'distinct' silently splits every approach into a right and a wrong version, while the 'optimal' single pass measures 20% slower than two passes in both C++ and Python.",

  theory: `
## The question is ambiguous, and you must resolve it first

Given \`[5, 5, 2]\`, what is the second largest element?

There are two defensible answers. **By position**, the second element of the
sorted array is 5. **By value**, the second largest *distinct* value is 2.

Almost every statement of this problem — and every interviewer asking it — means
the second. "Second largest" is shorthand for "the largest value strictly below
the maximum". Resolve this before writing anything, because the two readings
produce different code and the wrong one fails silently on data that looks fine.

The convention when no such value exists — \`[10, 10, 10]\`, or a single-element
array — is to return **-1**. That convention has its own trap, covered below.

## Why the obvious approach is wrong

Sort the array, return \`arr[n - 2]\`. Two lines, and it is the answer most people
write first.

Verified on this machine:

| Input | \`sorted[n-2]\` | Correct answer |
|---|---|---|
| \`[5, 5, 2]\` | 5 | 2 |
| \`[10, 10, 10]\` | 10 | -1 (none exists) |
| \`[1, 2]\` | 1 | 1 |

On \`[5, 5, 2]\` it returns 5 — **the largest element again**. Not an out-of-range
value, not a crash: a plausible number that happens to be wrong. That is the
worst failure mode there is, because nothing about the output signals a problem.

The fix is not to abandon sorting but to finish the job: sort, then **walk
backwards until you find a value different from the last one**. That is correct,
and it is still O(n log n) for an answer that does not need ordering at all.

## Two passes: find the max, then the best thing below it

Once "distinct" is explicit, a direct approach follows. Find the maximum. Then
scan again for the largest element that is **not equal** to it.

That second condition is the entire algorithm. \`x != max\` skips every copy of the
maximum, however many there are, so duplicates stop mattering.

It costs two traversals and about \`2n\` comparisons, and it is genuinely easy to
get right — which, as the measurements below show, is worth more than it looks.

## One pass: carry two candidates instead of one

This is the pattern the subtopic exists to teach, and it extends the running-best
skeleton from Largest Element by carrying **two** running values.

Hold \`largest\` and \`second\`. For each element:

- If it beats \`largest\`, then the old \`largest\` is now the best value below the new
  one — so **demote before you promote**: \`second = largest\`, then \`largest = x\`.
- Otherwise, if it is **strictly below \`largest\`** but above \`second\`, it becomes
  the new \`second\`.
- Otherwise it is a duplicate of \`largest\`, and it is ignored.

### The two bugs this invites

**Wrong update order.** Writing \`largest = x\` first and \`second = largest\`
afterwards sets \`second\` to the value you just assigned, so both variables end up
holding the same number. The demotion must read the *old* largest, which is why
Python's \`second, largest = largest, x\` is a good habit — the tuple assignment
evaluates the right side first and makes the ordering impossible to get wrong.

**A missing \`x < largest\` guard.** If the second branch tests only \`x > second\`,
then a duplicate of the maximum passes it: on \`[5, 5, 2]\`, the second 5 is not
greater than \`largest\`, but it *is* greater than \`second\`, so \`second\` becomes 5
and you return the maximum again. The guard \`x < largest\` — or equivalently
\`x != largest\` — is what makes the algorithm distinct-aware. It is one comparison,
and leaving it out reproduces exactly the bug the sorted-index version had.

## The sentinel problem

What should \`second\` start as, and what do you return when nothing is found?

Initialising both trackers to the array element type's minimum is the usual
advice, and it has a real hole. Verified on \`[INT_MIN, INT_MIN]\`: with \`second\`
initialised to \`INT_MIN\`, a final value of \`INT_MIN\` is indistinguishable from
"never updated". The sentinel collides with a legitimate input value.

Two clean fixes: **widen the trackers** to \`long long\` / \`long\` /
\`float('-inf')\` so the sentinel lies outside the array's value range, or **carry
an explicit boolean** recording whether \`second\` was ever assigned. The samples
here widen, because it costs nothing and keeps the loop free of extra state.

The same reasoning applies to returning **-1**: it is the standard convention, but
\`-1\` is a perfectly ordinary array value. \`[-1, -5]\` has a genuine second largest
of -5, while \`[-1, -1]\` has none — and both return -1 under the convention. When
the caller must tell those apart, return an optional or a flag instead. Know that
you are accepting an ambiguity rather than inheriting one by accident.

## The measurement that contradicts the textbook

One traversal ought to beat two. Measured on this machine, it does not — in
**either** language:

| | one pass | two passes | ratio |
|---|---|---|---|
| C++, n = 1,000,000 | 2.047ms | 1.612ms | **0.79x** |
| C++, n = 10,000,000 | 20.535ms | 16.403ms | **0.80x** |
| Python, n = 1,000,000 | 55.36ms | 46.51ms | **0.84x** |

The two-pass version is about **20% faster**, and the reasons differ by language.

**In C++ it is vectorisation.** Compiled with \`-Rpass=loop-vectorize\`, clang
reports the two-pass max loop as *"vectorized loop (vectorization width: 4,
interleaved count: 4)"* — sixteen integers per iteration through SIMD registers.
The single-pass loop gets no such remark, because its \`if / else if\` chain updates
two variables in a data-dependent way that cannot be expressed as a parallel
reduction. A simple loop run twice beats a clever loop run once.

**In Python it is the C boundary.** The two-pass version spends its first
traversal inside \`max()\`, which is compiled C, so only one of its two passes pays
per-element interpreter overhead. The single-pass version pays it on every
element of its only pass.

The honest conclusion is not "always write two passes". It is that **asymptotic
complexity does not determine speed** — both are Theta(n), and the constant factor
went the other way on both runtimes. Learn the single pass, because carrying
multiple running candidates is the pattern that generalises to k-th largest,
Kadane's algorithm and the sliding-window problems. Just do not assume it is
faster because it touches memory once.

## What sorting really costs here

At n = 1,000,000: sorting performs 21,944,322 comparisons against roughly 3n for
either scan, and takes 34.045ms against 2.047ms — a **33x** gap, on top of
mutating the caller's array unless you copy it first.

## The Python one-liner that answers the wrong question

\`heapq.nlargest(2, arr)\` looks like exactly the right tool. Verified: on
\`[5, 5, 2]\` it returns \`[5, 5]\`, because it selects the two largest **elements**,
not the two largest **distinct values**. Wrap the input in \`set()\` first and it is
correct — \`sorted(set(arr))[-2]\` is the idiomatic form — at the cost of building
a hash set, measured at 1.49x the single pass at n = 1e6.

## Where this goes next

Carrying two candidates generalises directly to **k-th largest**, where the right
structure becomes a heap rather than a fixed pair of variables. The
"largest strictly below a bound" idea reappears in **leaders in an array**, and
the running-candidate skeleton continues into **maximum consecutive ones** and
**Kadane's algorithm**.
`.trim(),

  intuition:
    "Hold a podium with two places. Each new value either takes first — pushing the old champion down to second — or slots into second if it is better than what is there but not good enough to win. A value equal to the champion is not a new contender, it is the same score again, and a podium does not award the same place twice.",

  approaches: [
    {
      name: "Brute Force - Sort and Step Back",
      idea: "Sort the array, then walk backwards from the end until a value different from the maximum appears.",
      steps: [
        "Sort the array in ascending order, working on a copy if the caller's data must survive.",
        "Take the last element as the maximum.",
        "Walk backwards from index n - 2 towards index 0.",
        "Return the first element encountered that differs from the maximum.",
        "If the walk reaches the start without finding one, every element was equal, so return -1.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <algorithm>
#include <vector>
using namespace std;

int secondLargest(vector<int> arr) {          // by value: caller's data is safe
    if (arr.size() < 2) return -1;
    sort(arr.begin(), arr.end());

    // NOT arr[n-2] — that returns the maximum again when it is duplicated.
    for (int i = (int)arr.size() - 2; i >= 0; i--) {
        if (arr[i] != arr.back()) return arr[i];
    }
    return -1;                                 // every element was identical
}`,
          annotations: {
            5: "By value costs an O(n) copy. Taking vector<int>& instead would leave the caller's array permanently sorted.",
            9: "The whole correction lives here. On [5,5,2] the sorted array is [2,5,5] and index n-2 holds 5, not 2.",
            13: "Reached only when the array is entirely one repeated value, such as [10,10,10].",
          },
        },
        {
          language: "java",
          code: `import java.util.Arrays;

static int secondLargest(int[] arr) {
    if (arr == null || arr.length < 2) return -1;

    int[] a = Arrays.copyOf(arr, arr.length);  // do not reorder the caller's array
    Arrays.sort(a);

    for (int i = a.length - 2; i >= 0; i--) {
        if (a[i] != a[a.length - 1]) return a[i];
    }
    return -1;
}`,
          annotations: {
            6: "Java has no by-value array parameter, so the copy must be explicit or the caller's array gets sorted.",
            10: "Same distinct-aware walk. Returning a[a.length - 2] directly is the bug this loop exists to avoid.",
          },
        },
        {
          language: "python",
          code: `def second_largest(arr):
    if len(arr) < 2:
        return -1

    s = sorted(arr)                 # sorted() copies; arr.sort() would mutate
    largest = s[-1]

    for value in reversed(s[:-1]):
        if value != largest:
            return value
    return -1


# The idiomatic Python form — set() removes the duplicate problem entirely
def second_largest_set(arr):
    unique = sorted(set(arr))
    return unique[-2] if len(unique) >= 2 else -1`,
          annotations: {
            5: "sorted() returns a new list. Using arr.sort() here would reorder the caller's list as a side effect.",
            8: "reversed() walks from the largest downwards, stopping at the first value that differs.",
            17: "Measured 1.49x the single pass at n = 1,000,000 — the set build is not free, but the code is hard to get wrong.",
          },
        },
      ],
      complexity: {
        time: "O(n log n)",
        space: "O(1) sorting in place, O(n) for a defensive copy or a set",
        note: "Measured at n = 1,000,000: 21,944,322 comparisons and 34.045ms, against roughly 3n comparisons and 2.047ms for a single scan — a 33x gap for an answer that never needed the array ordered.",
      },
    },
    {
      name: "Two Passes",
      idea: "Find the maximum, then scan again for the largest element that is not equal to it.",
      steps: [
        "Scan once to find the maximum value.",
        "Set a second tracker to a sentinel below every possible array value.",
        "Scan again, skipping every element equal to the maximum.",
        "Among the remaining elements, keep the largest seen.",
        "If the tracker was never updated, every element equalled the maximum, so return -1.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <algorithm>
#include <vector>
#include <climits>
using namespace std;

int secondLargest(const vector<int>& arr) {
    if (arr.size() < 2) return -1;

    int largest = *max_element(arr.begin(), arr.end());

    long long second = LLONG_MIN;              // wider than int, so no collision
    for (int x : arr) {
        if (x != largest && x > second) second = x;
    }
    return (second == LLONG_MIN) ? -1 : (int)second;
}`,
          annotations: {
            9: "This loop is the one clang vectorises — reported as width 4, interleaved 4, so 16 ints per iteration.",
            11: "long long, not int. With an int sentinel, an array containing INT_MIN cannot be told apart from 'nothing found'.",
            13: "x != largest skips every copy of the maximum, which is what makes the result distinct-aware.",
          },
        },
        {
          language: "java",
          code: `static int secondLargest(int[] arr) {
    if (arr == null || arr.length < 2) return -1;

    int largest = arr[0];
    for (int x : arr) if (x > largest) largest = x;

    long second = Long.MIN_VALUE;
    for (int x : arr) {
        if (x != largest && x > second) second = x;
    }
    return second == Long.MIN_VALUE ? -1 : (int) second;
}`,
          annotations: {
            5: "A plain max scan — simple, predictable, and the easiest possible loop for the JIT to optimise.",
            7: "long rather than int, for the same sentinel-collision reason as the C++ version.",
          },
        },
        {
          language: "python",
          code: `def second_largest(arr):
    if len(arr) < 2:
        return -1

    largest = max(arr)              # this pass runs in C, not in the interpreter
    second = float('-inf')

    for x in arr:
        if x != largest and x > second:
            second = x

    return -1 if second == float('-inf') else second`,
          annotations: {
            5: "The reason two passes beat one in Python: this traversal costs no interpreter overhead at all.",
            6: "float('-inf') is below every finite int, so it cannot collide with a real array value.",
            9: "Measured 46.51ms at n = 1,000,000, against 55.36ms for the single-pass version.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1)",
        note: "Two traversals, about 2n comparisons. Measured FASTER than the single pass on both runtimes: C++ 1.612ms vs 2.047ms and Python 46.51ms vs 55.36ms at n = 1,000,000.",
      },
    },
    {
      name: "Optimal - Single Pass",
      idea: "Carry two running candidates, demoting the champion when a new one arrives.",
      steps: [
        "Set both largest and second to a sentinel below every possible array value.",
        "Visit each element once.",
        "If the element beats largest, first copy largest into second, then set largest to the element.",
        "Otherwise, if the element is strictly below largest and above second, it becomes the new second.",
        "Otherwise the element is a duplicate of largest and is ignored.",
        "After the scan, return -1 if second was never updated, and second otherwise.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <climits>
using namespace std;

int secondLargest(const vector<int>& arr) {
    long long largest = LLONG_MIN, second = LLONG_MIN;

    for (int x : arr) {
        if (x > largest) {
            second  = largest;      // demote BEFORE promoting
            largest = x;
        } else if (x < largest && x > second) {
            second = x;
        }
    }
    return (second == LLONG_MIN) ? -1 : (int)second;
}`,
          annotations: {
            6: "Both start below every int. Using INT_MIN here makes [INT_MIN, INT_MIN] indistinguishable from 'nothing found'.",
            10: "Order is critical. Assigning largest = x first would demote the NEW value and leave both trackers equal.",
            12: "x < largest is the distinct-aware guard. Testing only x > second lets a duplicate maximum become the second largest.",
            16: "This branchy update is precisely what stops clang vectorising the loop, which is why it measures slower than two passes.",
          },
        },
        {
          language: "java",
          code: `static int secondLargest(int[] arr) {
    long largest = Long.MIN_VALUE, second = Long.MIN_VALUE;

    for (int x : arr) {
        if (x > largest) {
            second  = largest;
            largest = x;
        } else if (x < largest && x > second) {
            second = x;
        }
    }
    return second == Long.MIN_VALUE ? -1 : (int) second;
}`,
          annotations: {
            2: "long, so the sentinel sits outside the range of any int the array can hold.",
            6: "Demote first, promote second — the single most common way to get this algorithm wrong.",
            8: "Both halves of the guard matter: x < largest rejects duplicate maxima, x > second rejects everything already beaten.",
          },
        },
        {
          language: "python",
          code: `def second_largest(arr):
    largest = second = float('-inf')

    for x in arr:
        if x > largest:
            second, largest = largest, x     # right side evaluates first
        elif x < largest and x > second:
            second = x

    return -1 if second == float('-inf') else second


# heapq looks right and is NOT — it selects elements, not distinct values.
# heapq.nlargest(2, [5, 5, 2]) -> [5, 5]      wrong
# heapq.nlargest(2, set([5, 5, 2])) -> [5, 2] correct`,
          annotations: {
            6: "Tuple assignment evaluates the whole right side before binding, so the demote-then-promote order cannot be got wrong.",
            7: "Python chains this as `second < x < largest` if you prefer, which reads closer to the intent.",
            14: "Verified: nlargest returns [5, 5] on [5, 5, 2]. The set() is not optional.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1)",
        note: "One traversal, about 3n comparisons in the worst case. Asymptotically identical to the two-pass version and measured roughly 20% SLOWER on both runtimes — C++ 2.047ms vs 1.612ms and Python 55.36ms vs 46.51ms at n = 1,000,000 — because the branchy two-variable update defeats vectorisation in C++ and keeps every element in the interpreter in Python.",
      },
    },
  ],

  examples: [
    {
      input: "arr = [5, 5, 2]",
      output: "2",
      walkthrough: [
        "Start with largest and second both at the sentinel.",
        "x = 5 beats largest, so second takes the old sentinel value and largest becomes 5.",
        "x = 5 again: it does not beat largest, and the guard x < largest is false because 5 is not below 5, so it is ignored.",
        "x = 2: it does not beat largest, but 2 < 5 and 2 is above the sentinel, so second becomes 2.",
        "The scan ends with largest = 5 and second = 2, so the answer is 2.",
        "Compare with the naive sorted[n-2]: the sorted array is [2, 5, 5] and index 1 holds 5 — the maximum returned a second time.",
      ],
      why: "The defining case of the subtopic. It is the smallest input where the duplicate-aware and duplicate-blind approaches return different answers, and neither answer looks wrong on its own.",
    },
    {
      input: "arr = [10, 10, 10]",
      output: "-1",
      walkthrough: [
        "x = 10 beats the sentinel, so largest becomes 10 and second holds the sentinel.",
        "x = 10 again: not greater than largest, and 10 < 10 is false, so nothing happens.",
        "x = 10 a third time: identical, so nothing happens again.",
        "second was never assigned a real value, so no second distinct element exists.",
        "Return -1 by the usual convention.",
        "The naive sorted[n-2] returns 10 here, claiming a second largest that does not exist.",
      ],
      why: "Shows that 'no answer' is a real outcome rather than an error, and that the sentinel is what lets the code detect it.",
    },
    {
      input: "arr = [1, 2]",
      output: "1",
      walkthrough: [
        "x = 1 beats the sentinel, so largest becomes 1.",
        "x = 2 beats largest, so second takes the old largest value of 1 and largest becomes 2.",
        "The scan ends with largest = 2 and second = 1.",
        "The demotion is the only reason second holds anything at all here.",
        "Had the update order been reversed — largest = x before second = largest — both trackers would read 2 and the answer would be wrong.",
      ],
      why: "The smallest input that exercises the demote-before-promote step, which is the most common way the single-pass version is written incorrectly.",
    },
    {
      input: "arr = [INT_MIN, INT_MIN], with second initialised to INT_MIN",
      output: "Ambiguous — cannot distinguish 'not found' from a real INT_MIN",
      walkthrough: [
        "largest and second both start at INT_MIN, the smallest value an int can hold.",
        "x = INT_MIN is not greater than largest, so the first branch does not fire.",
        "The guard x < largest is false because INT_MIN is not below itself, so the second branch does not fire either.",
        "The same happens for the second element, and second finishes holding INT_MIN.",
        "That is exactly the value it started with, so the code cannot tell whether it was ever updated.",
        "Verified on this machine: widening the trackers to long long removes the ambiguity, because LLONG_MIN cannot appear in an int array.",
      ],
      why: "The sentinel collision is invisible on ordinary data and only appears at the extreme value of the type, which is precisely the input least likely to be tested.",
    },
  ],

  visualization: {
    kind: "array",
    description:
      "A two-place podium above an indexed array strip. Draw first and second place as separate badges, both starting empty and labelled with the sentinel rather than a number, so 'nothing found yet' is visibly a state rather than a value. A pointer advances one cell per frame and each step draws two labelled test arcs — one to the first-place badge reading x > largest, and one to the second-place badge reading x < largest AND x > second — colouring each green or red as it resolves. On a first-place win, animate the demotion explicitly and in order: the current champion slides DOWN into the second badge first, and only then does the new value rise into first, with the two movements separated in time so the demote-before-promote ordering is watchable rather than asserted. On a second-place win, the value rises directly into the second badge. Critically, when a duplicate of the maximum arrives, freeze the frame and show the x < largest arc failing in red while the x > second arc would have passed in green, then label that frame as the exact point where a missing guard would corrupt the answer. Beneath the strip run a contrast track that replays the same input through sorted[n-2], landing its own pointer on the duplicated maximum and printing the wrong answer beside the right one. A separate performance panel animates the two-pass version as two full sweeps of the strip against the single pass's one sweep, then displays the measured times that contradict the intuition — 1.612ms for two passes against 2.047ms for one at a million elements — with the C++ vectorised sweep drawn as sixteen cells consumed per tick and the single pass drawn one cell per tick.",
    sampleInput:
      '{"primary":{"array":[5,5,2],"sentinel":"-inf","trace":[{"i":0,"x":5,"beatsLargest":true,"demote":{"from":"largest","value":"-inf","to":"second"},"largest":5,"second":"-inf"},{"i":1,"x":5,"beatsLargest":false,"guardBelowLargest":false,"guardAboveSecond":true,"action":"ignored","note":"the frame where a missing x < largest guard corrupts the answer","largest":5,"second":"-inf"},{"i":2,"x":2,"beatsLargest":false,"guardBelowLargest":true,"guardAboveSecond":true,"action":"second updated","largest":5,"second":2}],"answer":2},"naiveContrast":{"sorted":[2,5,5],"indexUsed":1,"wrongAnswer":5,"correctAnswer":2},"noneCase":{"array":[10,10,10],"secondEverAssigned":false,"answer":-1},"performance":{"n":1000000,"onePassMs":2.047,"twoPassMs":1.612,"ratio":0.79,"sortMs":34.045,"vectorWidth":4,"interleave":4,"cellsPerTickVectorised":16,"cellsPerTickScalar":1}}',
    highlights: [
      "Both podium badges start empty, labelled with the sentinel, so 'no second element yet' is drawn as a state rather than as a number.",
      "The pointer reaches index 0 and the arc x > largest turns green, because any real value beats the sentinel.",
      "The demotion animates first: the empty first-place badge slides down into second place before anything rises.",
      "Only then does 5 rise into first place, making the demote-before-promote ordering visible as two separate movements.",
      "The pointer reaches index 1, the second 5, and the x > largest arc fails in red.",
      "The frame freezes on the decisive comparison: x < largest fails in red because 5 is not below 5.",
      "The x > second arc is drawn in green beside it, showing that a version testing only that condition would promote this duplicate into second place.",
      "That frame is labelled as the exact point where the missing guard turns the answer into the maximum repeated.",
      "The pointer reaches index 2, both guards pass for the value 2, and it rises into the second badge.",
      "The contrast track replays [5, 5, 2] as the sorted [2, 5, 5], lands on index 1, and prints 5 beside the correct 2.",
      "The none-case panel runs [10, 10, 10] and the second badge never fills, so the sentinel survives to the end and the answer is -1.",
      "The performance panel sweeps the strip twice for the two-pass version and once for the single pass.",
      "The vectorised sweep consumes sixteen cells per tick while the single pass consumes one, showing why fewer traversals still lost.",
      "The measured figures close the panel: 1.612ms for two passes against 2.047ms for one, at a million elements.",
    ],
  },

  edgeCases: [
    "Array of exactly two distinct elements — the smallest input with a real answer, and the one that exercises the demotion step.",
    "Array of two identical elements — no second distinct value exists, so the correct result is -1 rather than that value repeated.",
    "Single-element array — no second element is possible and the loop body may never meaningfully run; return -1.",
    "Empty array — decide explicitly, exactly as in Largest Element, since the sentinel path returns -1 rather than failing loudly.",
    "All elements identical — the case that separates 'no answer exists' from 'the answer equals the maximum'.",
    "The maximum appearing many times with one smaller value present, such as [7, 7, 7, 3] — every duplicate must be skipped to reach 3.",
    "Array containing the type's minimum value, where an INT_MIN sentinel collides with real data and the tracker must be widened.",
    "Array whose genuine answer is -1, such as [4, -1], where the correct return value is indistinguishable from the not-found convention.",
    "Strictly increasing input, where the demotion fires on every single element.",
    "Strictly decreasing input, where the demotion fires once and the second branch handles everything afterwards.",
  ],

  pitfalls: [
    "Returning sorted[n-2] without checking for duplicates. Verified: on [5, 5, 2] it returns 5, the maximum a second time, and nothing about the output looks wrong.",
    "Promoting before demoting. Writing largest = x before second = largest leaves both trackers holding the new value and destroys the answer.",
    "Omitting the x < largest guard in the second branch. A duplicate of the maximum then passes x > second and becomes the second largest.",
    "Using the element type's minimum as the sentinel. Verified ambiguous on [INT_MIN, INT_MIN], where 'not found' and a real INT_MIN are the same bit pattern.",
    "Treating the -1 return as unambiguous. -1 is an ordinary array value, so [-1, -5] and [-1, -1] both return -1 for entirely different reasons.",
    "Calling heapq.nlargest(2, arr) in Python. Verified: it returns [5, 5] on [5, 5, 2] because it selects elements rather than distinct values.",
    "Assuming one traversal must beat two. Measured 20% slower on both runtimes, since the branchy update defeats vectorisation in C++ and stays in the interpreter in Python.",
    "Sorting the caller's array in place to find the answer, leaving their data permanently reordered by a read-only-looking query.",
    "Initialising largest to arr[0] but second to the sentinel, then forgetting that a first-element maximum never triggers a demotion.",
    "Skipping the length check before indexing, so a one-element array reads a position that does not exist.",
    "Assuming the array has at least two DISTINCT values because it has at least two elements. [10, 10] has two elements and no second largest.",
  ],

  commonDoubts: [
    {
      question: "For [5, 5, 2], is the answer 5 or 2?",
      answer:
        "2, under the standard reading. 'Second largest' means the largest value strictly below the maximum, so duplicates of the maximum are the same value rather than a separate rank. Returning 5 is answering a different question — 'what is the second element of the sorted array' — and that is the single most common wrong answer to this problem. If a statement genuinely wants the positional reading it will say so explicitly; assume distinct otherwise, and say which one you assumed.",
    },
    {
      question: "Why does the update order matter so much in the single-pass version?",
      answer:
        "Because the demotion has to read the OLD largest. The correct order is second = largest first, then largest = x. If you assign largest = x first, the following second = largest copies the value you just wrote, so both trackers end up holding the new element and the real second largest is lost. On [1, 2] that returns 2 instead of 1. Python's tuple assignment second, largest = largest, x sidesteps this entirely, because the whole right-hand side is evaluated before either name is rebound.",
    },
    {
      question: "Why do we need the x < largest check? Isn't x > second enough?",
      answer:
        "It is not enough, and the failure is exactly the duplicate bug in a different disguise. On [5, 5, 2], the second 5 does not beat largest, so it falls into the else-if branch. There, 5 > second is true because second is still the sentinel, so second becomes 5 and the function returns the maximum again. The x < largest guard rejects it, which is what makes the algorithm distinct-aware. Writing x != largest instead is equivalent and reads more directly.",
    },
    {
      question: "Why not just initialise both trackers to INT_MIN?",
      answer:
        "Because INT_MIN is a value the array can actually contain, so the sentinel collides with real data. Verified on [INT_MIN, INT_MIN]: second finishes holding INT_MIN, which is precisely what it started as, so there is no way to tell whether it was ever updated. Widen the trackers to long long, long or float('-inf') so the sentinel sits outside the array's value range, or carry an explicit boolean flag. Widening costs nothing and keeps the loop simple.",
    },
    {
      question: "Is the single pass actually faster than two passes?",
      answer:
        "Measured on this machine, no — it is about 20% SLOWER in both languages, which is the most surprising result in this subtopic. C++ at n = 1,000,000: 2.047ms for one pass against 1.612ms for two. Python at the same size: 55.36ms against 46.51ms. The reasons differ. In C++, clang vectorises the simple max loop at width 4 interleaved 4 — sixteen ints per iteration — and reports no vectorisation for the single-pass loop, whose two-variable branchy update cannot become a SIMD reduction. In Python, the two-pass version runs its first traversal inside max(), which is compiled C, so only one of its passes pays interpreter overhead. Both are Theta(n); the constant factor simply went the other way.",
    },
    {
      question: "Then why learn the single-pass version at all?",
      answer:
        "Because it is the pattern, not the micro-optimisation. Carrying several running candidates and updating them under guards is what k-th largest, Kadane's algorithm and the sliding-window problems are all built from, and there the single pass is genuinely necessary rather than merely tidy. It also matters when a second traversal is impossible — a stream you can only read once, or an input too large to revisit. Learn it for the generalisation; just do not defend it with a speed claim the measurements do not support.",
    },
    {
      question: "What should I return when there is no second largest?",
      answer:
        "The usual convention is -1, and it is worth knowing what you are accepting. -1 is a perfectly ordinary array value, so [-1, -5] has a genuine second largest of -5 while [-1, -1] has none, and both return -1 under the convention. When the caller must distinguish those, return an optional type, a boolean flag alongside the value, or throw. State your choice rather than letting the sentinel decide silently.",
    },
    {
      question: "Can I just use heapq.nlargest(2, arr) in Python?",
      answer:
        "Not directly — it answers the positional question. Verified: heapq.nlargest(2, [5, 5, 2]) returns [5, 5], because it selects the two largest elements rather than the two largest distinct values. Deduplicate first and it is correct: sorted(set(arr))[-2] is the idiomatic form, measured at 1.49x the single pass at n = 1,000,000. The set build is real work, but the code is very hard to get wrong, which is often the better trade in production.",
    },
    {
      question: "How does this extend to the k-th largest element?",
      answer:
        "Carrying two variables works because two is small. For a general k, the same idea needs a structure rather than named variables: keep a min-heap of size k, push each element, and pop whenever the heap exceeds k, so the heap root is the k-th largest at the end. That is O(n log k) time and O(k) space. If distinctness is required, deduplicate first, exactly as here — the [5, 5, 2] problem does not go away with a bigger k, it just gets easier to overlook.",
    },
  ],

  relatedIds: ["largest-element", "maximum-consecutive-ones", "kadanes-algorithm"],
};

export default content;
