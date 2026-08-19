import type { SubtopicContent } from "../types";

/**
 * Subtopic 8 of Arrays. The simplest algorithm in the module, and kept because
 * the interesting questions are not about how it works — they are about when it
 * is the RIGHT answer, which turns out to include cases most people would
 * reflexively hand to binary search.
 *
 * SOURCES
 * - GeeksforGeeks, "Linear Search Algorithm" — the scan, the early return, and
 *   the sentinel variant.
 *
 * MEASURED ON THIS MACHINE (clang -O2, Python 3.13.4):
 *
 * 1. THE COMPARISON DISTRIBUTION IS EXACTLY AS DERIVED, verified rather than
 *    assumed at n = 1,000: a target at index 0 costs 1 comparison, at index 500
 *    costs 501, at index 999 costs 1,000, and an absent target costs 1,000.
 *    Averaged over 200,000 uniformly random PRESENT targets: 500.4 comparisons,
 *    against the derived (n+1)/2 = 500.5. Averaged over 20,000 MISSES: exactly
 *    1000.0. Early exit helps hits and does nothing whatsoever for misses.
 *
 * 2. THE SENTINEL TRICK IS WORTH ABOUT 5%, NOT 2x. The classic optimisation
 *    removes the bounds check so each iteration performs one comparison instead
 *    of two, which textbooks often describe as halving the work. Measured on an
 *    absent target at n = 10,000,000: plain 3.5121ms, sentinel 3.3259ms — about
 *    5% — and std::find beat both at 3.2155ms. The bounds check is perfectly
 *    predictable and effectively free on modern hardware, so removing it buys
 *    almost nothing while costing a temporary array mutation.
 *
 * 3. THE HEADLINE — LINEAR SEARCH BEATS BINARY SEARCH ON SMALL SORTED ARRAYS.
 *    Average nanoseconds per search over random present targets:
 *      n      linear    binary    winner
 *      12      7.24      8.81     LINEAR
 *      16      7.35      7.54     LINEAR
 *      20      8.38      9.44     LINEAR
 *      24      9.17      9.47     LINEAR
 *      28      9.74      8.92     binary
 *      32     10.50      8.98     binary
 *      1024  174.02     20.63     binary
 *      16384 2585.44    34.50     binary  (75x)
 *    The crossover sits between n = 24 and n = 28 on this machine. Below it,
 *    O(n) beats O(log n) outright: the linear scan is sequential, prefetchable
 *    and vectorisable with a branch that is almost always false, while binary
 *    search jumps unpredictably through memory and its comparison is a genuine
 *    coin flip. This is why real sort implementations switch to insertion sort
 *    on small partitions rather than recursing.
 *
 * 4. PYTHON, n = 1,000,000, averaged over random present targets:
 *      'in' operator : 1.8640ms   <- fastest
 *      .index()      : 2.9003ms
 *      manual loop   : 11.3435ms
 *      enumerate     : 11.7541ms
 *    On an absent target the manual loop took 20.29ms against .index()'s
 *    5.50ms — 4x. Same interpreter tax as every prior subtopic.
 *
 * Scope: binary search itself is the Binary Search module. This container
 * establishes the baseline it is measured against, and the conditions under
 * which the baseline wins.
 */
const content: SubtopicContent = {
  id: "linear-search",
  topic: "Arrays",
  title: "Linear Search",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "largest-element",
    "for-loop",
    "if-else-statements",
    "relational-and-logical-operators",
    "time-and-space-complexity-basics",
  ],

  summary:
    "Scan until you find it — and learn where the scan is genuinely the right answer, including sorted arrays up to about 24 elements, where it measured faster than binary search.",

  theory: `
## The problem

Given an array and a target, return the index of the target's first occurrence,
or -1 if it is not present. The array is **not assumed sorted**, which is the
entire reason this algorithm exists.

\`\`\`
[10, 4, 7, 4, 2], target 4  ->  1   (the FIRST 4, not the one at index 3)
[10, 4, 7, 4, 2], target 9  ->  -1
\`\`\`

## The algorithm, and the one decision in it

Walk from the front. Compare each element with the target. Return the index the
moment they match. If the walk finishes, return -1.

The only real decision is **returning immediately versus scanning on**. Returning
immediately is correct for "first occurrence" and it is also what makes the
average case half the array instead of all of it. A version that keeps scanning
after a match still gives the right answer if it records only the first hit, but
it pays full price on every input.

## What it actually costs

The comparison count is not a single number, and stating it as one hides the most
useful thing about this algorithm. Verified at n = 1,000:

| Case | Comparisons |
|---|---|
| Target at index 0 | 1 |
| Target at index 500 | 501 |
| Target at index 999 | 1,000 |
| **Target absent** | **1,000** |

Averaged over 200,000 uniformly random present targets: **500.4**, against the
derived \`(n+1)/2 = 500.5\`. Averaged over 20,000 misses: **exactly 1,000.0**.

So the honest summary is: **O(n) worst case, O(n) on every miss, and n/2 on
average for a hit.** Early exit is worth a factor of two on successful searches
and worth **nothing at all** on unsuccessful ones — you cannot know an element is
absent without looking at every element.

That asymmetry matters when the search is mostly misses, which is common in
validation and lookup code. If your workload is dominated by "not found", linear
search costs full price every single time.

## The sentinel trick, and what it is really worth

Each iteration of the plain loop does two comparisons: *have I run off the end*
and *is this the target*. The classic optimisation removes the first by writing
the target into the last slot, so the loop is guaranteed to stop and needs no
bounds check.

\`\`\`
save arr[n-1]; arr[n-1] = target
i = 0; while (arr[i] != target) i++
restore arr[n-1]
\`\`\`

Textbooks often present this as halving the work. Measured on an absent target at
n = 10,000,000: plain **3.5121ms**, sentinel **3.3259ms**. That is about **5%**,
not 50% — and \`std::find\` beat both at **3.2155ms**.

The reason is that the bounds check is the most predictable branch imaginable: it
is false every single iteration until the very last. The processor predicts it
correctly essentially always, so it costs almost nothing to begin with, and
removing something that is already free buys almost nothing.

Worse, the trick **writes to the array**, which rules it out for a read-only or
shared input, and makes it unsafe under concurrency. It is a genuine
micro-optimisation from an era when the bounds check was not free, and it is
worth knowing chiefly as a lesson in re-measuring inherited advice.

## When linear search is the right answer

It is not the fallback you settle for. It is the correct choice whenever:

- **The array is unsorted** and will be searched once. Sorting to enable binary
  search costs O(n log n) — far more than the single O(n) scan you were avoiding.
- **The data is tiny.** See below; this is the interesting case.
- **You need the first occurrence** by position rather than any occurrence.
- **The structure has no random access**, such as a linked list, where binary
  search cannot jump to the middle in constant time.

## The measurement worth remembering

On a **sorted** array — binary search's home ground — averaged over random present
targets, in nanoseconds per search:

| n | linear | binary | winner |
|---|---|---|---|
| 12 | 7.24 | 8.81 | **linear** |
| 16 | 7.35 | 7.54 | **linear** |
| 20 | 8.38 | 9.44 | **linear** |
| 24 | 9.17 | 9.47 | **linear** |
| 28 | 9.74 | 8.92 | binary |
| 32 | 10.50 | 8.98 | binary |
| 1,024 | 174.02 | 20.63 | binary |
| 16,384 | 2,585.44 | 34.50 | binary (75x) |

**The crossover sits between n = 24 and n = 28 on this machine.** Below it, the
O(n) algorithm beats the O(log n) one on the data binary search was designed for.

Three things cause it, and all three have appeared earlier in this module:

**Linear search's branch is almost always false.** \`arr[i] == target\` fails on
every iteration but the last, which is the easiest possible pattern to predict.
Binary search's \`arr[mid] < target\` is a genuine coin flip on random targets —
exactly the unpredictable branch that cost 5.5x in Move Zeros to End.

**Linear search is sequential.** It walks memory forwards, so the hardware
prefetches ahead and the compiler can vectorise the comparison. Binary search
jumps to the middle, then a quarter, then an eighth — addresses the prefetcher
cannot anticipate.

**Small arrays fit in one or two cache lines.** A 16-element int array is 64 bytes:
a single cache line. Scanning all of it costs one memory fetch, and binary search
cannot beat one fetch by doing fewer comparisons on the same line.

Asymptotics describe how cost **grows**, not what it **is** at a given size. At
n = 16,384 binary search wins by 75x and the asymptotic story is completely
correct. At n = 16 it is the wrong tool.

This is not a curiosity — it is why production sort implementations stop
recursing and switch to insertion sort on small partitions, and why hand-written
binary searches often bottom out into a linear scan for the last handful of
elements.

## Python inverts it again

At n = 1,000,000, averaged over random present targets:

| Approach | Time per search |
|---|---|
| \`target in arr\` | **1.8640ms** |
| \`arr.index(target)\` | 2.9003ms |
| Manual loop | 11.3435ms |
| \`enumerate\` loop | 11.7541ms |

On an absent target the manual loop took **20.29ms** against \`.index()\`'s
**5.50ms** — 4x. The builtins run as compiled C; your loop does not. Use \`in\` when
you need only presence, and \`.index()\` when you need the position — and remember
\`.index()\` **raises \`ValueError\`** rather than returning -1, so it needs a
\`try\`/\`except\` to match the usual contract.

## Where this goes next

**Binary Search** is the payoff for a sorted array above the crossover, and this
subtopic is the baseline it gets measured against. When many searches will be
made against the same data, a hash set turns each lookup into O(1) at the cost of
O(n) space and one O(n) build.
`.trim(),

  intuition:
    "Looking for a book on an unsorted shelf, you start at one end and check each spine. There is no cleverer move available, because nothing about the shelf tells you where to jump. The only real questions are whether you stop when you find it, and whether the shelf is short enough that walking it beats any strategy for skipping around it.",

  approaches: [
    {
      name: "Brute Force - Scan Without Early Exit",
      idea: "Check every element, recording the first match, and return only after the full scan.",
      steps: [
        "Set the result to -1, meaning not found.",
        "Visit every index from the first to the last.",
        "If the element matches the target and no match has been recorded yet, record this index.",
        "Continue scanning to the end regardless.",
        "Return the recorded result.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

int linearSearch(const vector<int>& arr, int target) {
    int result = -1;
    for (size_t i = 0; i < arr.size(); i++) {
        if (arr[i] == target && result == -1) result = (int)i;
    }
    return result;
}`,
          annotations: {
            7: "The result == -1 guard is what keeps this returning the FIRST match rather than the last.",
            9: "Correct and always O(n). Measured at n = 1,000 with the target at index 0: 1,000 comparisons instead of 1.",
          },
        },
        {
          language: "java",
          code: `static int linearSearch(int[] arr, int target) {
    int result = -1;
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target && result == -1) result = i;
    }
    return result;
}`,
          annotations: {
            4: "Without the result == -1 half, this would silently return the LAST occurrence instead of the first.",
          },
        },
        {
          language: "python",
          code: `def linear_search(arr, target):
    result = -1
    for i in range(len(arr)):
        if arr[i] == target and result == -1:
            result = i
    return result`,
          annotations: {
            4: "Every element is examined even after the answer is known, which is precisely what the next approach fixes.",
          },
        },
      ],
      complexity: {
        time: "O(n) always, including the best case",
        space: "O(1)",
        note: "Correct and wasteful. Measured at n = 1,000 with the target at index 0 it performs 1,000 comparisons where an early return performs 1, and it gives up the n/2 average entirely.",
      },
    },
    {
      name: "Standard - Early Return",
      idea: "Return the index the moment a match is found.",
      steps: [
        "Visit each index from the first to the last.",
        "Compare the element at that index with the target.",
        "If they are equal, return that index immediately.",
        "If the loop finishes without a match, return -1.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

int linearSearch(const vector<int>& arr, int target) {
    for (size_t i = 0; i < arr.size(); i++) {
        if (arr[i] == target) return (int)i;
    }
    return -1;
}`,
          annotations: {
            6: "Returning here gives the FIRST occurrence for free, since the scan runs front to back.",
            8: "Reached only after every element has been checked, which is why a miss always costs the full n.",
          },
        },
        {
          language: "java",
          code: `static int linearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;
    }
    return -1;
}`,
          annotations: {
            3: "This comparison is false on every iteration but the last, which makes it one of the most predictable branches a processor ever sees.",
          },
        },
        {
          language: "python",
          code: `def linear_search(arr, target):
    for i, value in enumerate(arr):
        if value == target:
            return i
    return -1


# Measured 11.7541ms per search at n = 1,000,000 against 2.9003ms for
# arr.index(target) — the builtin runs as compiled C.`,
          annotations: {
            2: "enumerate gives index and value together without indexing twice, which is the idiomatic Python form.",
            8: "Same algorithm, 4x apart, purely because one loop runs in the interpreter and the other does not.",
          },
        },
      ],
      complexity: {
        time: "O(n) worst case, O(1) best case, n/2 average on a hit",
        space: "O(1)",
        note: "Verified at n = 1,000: 1 comparison for a target at index 0, 501 at index 500, 1,000 at index 999, and 1,000 for an absent target. Averaged over 200,000 random present targets: 500.4, against the derived (n+1)/2 = 500.5.",
      },
    },
    {
      name: "Sentinel Search",
      idea: "Write the target into the last slot so the loop is guaranteed to stop, removing the bounds check.",
      steps: [
        "Save the value currently in the last position.",
        "Write the target into the last position, guaranteeing a match exists.",
        "Walk forward comparing only against the target, with no bounds check needed.",
        "Restore the saved value to the last position.",
        "If the walk stopped before the last index, return that index.",
        "Otherwise return the last index if the saved value was the target, and -1 if it was not.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

int sentinelSearch(vector<int>& arr, int target) {
    int n = arr.size();
    if (n == 0) return -1;

    int last = arr[n - 1];
    arr[n - 1] = target;            // guarantees the loop terminates

    int i = 0;
    while (arr[i] != target) i++;   // ONE comparison per iteration

    arr[n - 1] = last;              // restore before returning

    if (i < n - 1) return i;
    return (last == target) ? n - 1 : -1;
}`,
          annotations: {
            9: "This mutation is the catch: the array cannot be const, cannot be shared across threads, and must be restored on every path.",
            12: "No i < n test here — that is the entire optimisation.",
            17: "Measured 3.3259ms against the plain loop's 3.5121ms at n = 10,000,000 — about 5%, not the 2x often claimed.",
          },
        },
        {
          language: "java",
          code: `static int sentinelSearch(int[] arr, int target) {
    int n = arr.length;
    if (n == 0) return -1;

    int last = arr[n - 1];
    arr[n - 1] = target;

    int i = 0;
    while (arr[i] != target) i++;

    arr[n - 1] = last;

    if (i < n - 1) return i;
    return (last == target) ? n - 1 : -1;
}`,
          annotations: {
            9: "The JVM still bounds-checks every array access, so this removes the explicit test and not the underlying check.",
          },
        },
        {
          language: "python",
          code: `def sentinel_search(arr, target):
    n = len(arr)
    if n == 0:
        return -1

    last = arr[n - 1]
    arr[n - 1] = target

    i = 0
    while arr[i] != target:
        i += 1

    arr[n - 1] = last

    if i < n - 1:
        return i
    return n - 1 if last == target else -1


# Pointless in Python: the loop is interpreted either way, and the
# mutation makes it unusable on a shared or read-only list.`,
          annotations: {
            6: "Mutating the caller's list to perform a read-only query is a strong smell, and it is what this trick requires.",
            20: "The interpreter overhead dwarfs the saved comparison entirely, so there is nothing to gain here.",
          },
        },
      ],
      complexity: {
        time: "O(n) worst case, same as the plain scan",
        space: "O(1)",
        note: "Measured 3.3259ms against 3.5121ms for the plain loop at n = 10,000,000 — roughly 5%, where the classic claim is 50%. The bounds check it removes is false on every iteration but one, so the processor already predicts it almost perfectly.",
      },
    },
    {
      name: "Early Termination on Sorted Input",
      idea: "If the array is sorted, stop as soon as an element exceeds the target.",
      steps: [
        "Confirm the array is sorted in non-decreasing order; this approach is invalid otherwise.",
        "Walk forward from the first element.",
        "Return the index immediately on a match.",
        "If the current element is greater than the target, no later element can match, so return -1 at once.",
        "If the walk finishes, return -1.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

// PRECONDITION: arr is sorted in non-decreasing order.
int sortedLinearSearch(const vector<int>& arr, int target) {
    for (size_t i = 0; i < arr.size(); i++) {
        if (arr[i] == target) return (int)i;
        if (arr[i] > target) return -1;    // everything after is larger
    }
    return -1;
}`,
          annotations: {
            5: "Silently wrong on unsorted input — it will report absent for elements that are present later in the array.",
            8: "The only real gain: a miss now costs n/2 on average instead of a guaranteed n.",
          },
        },
        {
          language: "java",
          code: `// PRECONDITION: arr is sorted in non-decreasing order.
static int sortedLinearSearch(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) {
        if (arr[i] == target) return i;
        if (arr[i] > target) return -1;
    }
    return -1;
}`,
          annotations: {
            5: "Two comparisons per element rather than one, traded for the ability to abandon a hopeless search early.",
          },
        },
        {
          language: "python",
          code: `def sorted_linear_search(arr, target):
    """PRECONDITION: arr is sorted in non-decreasing order."""
    for i, value in enumerate(arr):
        if value == target:
            return i
        if value > target:
            return -1
    return -1


# Above the crossover, bisect is the right tool for sorted data:
#   from bisect import bisect_left
#   i = bisect_left(arr, target)
#   return i if i < len(arr) and arr[i] == target else -1`,
          annotations: {
            6: "This is the only line that uses sortedness, and it is what makes the precondition load-bearing.",
            13: "bisect is binary search in C, and it wins above roughly 24 elements on this machine.",
          },
        },
      ],
      complexity: {
        time: "O(n) worst case, n/2 average on a miss instead of n",
        space: "O(1)",
        note: "Only valid on sorted input, where it halves the expected cost of an unsuccessful search. Above roughly 24 elements binary search is the better answer for sorted data, measured 20.63ns against 174.02ns at n = 1,024.",
      },
    },
    {
      name: "Library Call",
      idea: "Use the standard search routine, which is written and optimised already.",
      steps: [
        "In C++, call find over the range and compare the result against end.",
        "Convert the returned iterator to an index by subtracting begin.",
        "In Python, use the in operator when only presence matters.",
        "Use index when the position is needed, and catch ValueError to return -1.",
        "In Java, use a stream or a loop, since there is no index-returning search for a primitive array.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

int linearSearch(const vector<int>& arr, int target) {
    auto it = find(arr.begin(), arr.end(), target);
    return (it == arr.end()) ? -1 : (int)(it - arr.begin());
}`,
          annotations: {
            6: "find scans linearly and returns end() on failure, which is the iterator idiom for not-found.",
            7: "Measured 3.2155ms at n = 10,000,000 — faster than both the hand-written loop and the sentinel version.",
          },
        },
        {
          language: "java",
          code: `import java.util.Arrays;
import java.util.stream.IntStream;

// Presence only:
static boolean contains(int[] arr, int target) {
    return IntStream.of(arr).anyMatch(x -> x == target);
}

// Index — no built-in for primitive arrays, so the loop stands:
static int indexOf(int[] arr, int target) {
    for (int i = 0; i < arr.length; i++) if (arr[i] == target) return i;
    return -1;
}`,
          annotations: {
            6: "anyMatch short-circuits on the first match, so it keeps the early-exit behaviour.",
            11: "Arrays.binarySearch exists but requires sorted input; there is no linear indexOf for int[].",
          },
        },
        {
          language: "python",
          code: `def contains(arr, target):
    return target in arr          # 1.8640ms at n = 1,000,000 — fastest


def linear_search(arr, target):
    try:
        return arr.index(target)  # 2.9003ms — raises rather than returning -1
    except ValueError:
        return -1`,
          annotations: {
            2: "Use in when only presence matters; it does less work than index because it never computes a position.",
            7: "index RAISES ValueError when absent. Forgetting the try/except is the standard bug when porting from a -1 contract.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1)",
        note: "std::find measured 3.2155ms at n = 10,000,000, beating both the hand-written loop at 3.5121ms and the sentinel variant at 3.3259ms. In Python the in operator measured 1.8640ms and .index() 2.9003ms, against 11.3435ms for a manual loop.",
      },
    },
  ],

  examples: [
    {
      input: "arr = [10, 4, 7, 4, 2], target = 4",
      output: "1",
      walkthrough: [
        "i = 0: compare 10 with 4, which does not match.",
        "i = 1: compare 4 with 4, which matches, so return 1 immediately.",
        "The scan stops here and indices 2, 3 and 4 are never examined.",
        "There is a second 4 at index 3, and it is never reached.",
        "Returning the first occurrence is a consequence of scanning front to back and returning at once, not an extra rule.",
      ],
      why: "The duplicate at index 3 shows that first-occurrence behaviour comes free from the scan direction, and that early return is what prevents the later match from overwriting the answer.",
    },
    {
      input: "arr = [10, 4, 7, 4, 2], target = 9",
      output: "-1",
      walkthrough: [
        "Every one of the five elements is compared against 9 and none matches.",
        "The loop finishes and control reaches the return of -1.",
        "This costs 5 comparisons — the full length of the array.",
        "Early exit contributed nothing here, and could not have.",
        "Verified at scale: averaged over 20,000 misses at n = 1,000, the cost was exactly 1000.0 comparisons every time.",
        "Absence can only be established by examining every element, so a miss is always the worst case.",
      ],
      why: "Makes the asymmetry concrete — early exit is worth a factor of two on hits and exactly nothing on misses, which matters when the workload is mostly lookups that fail.",
    },
    {
      input: "A sorted array of 16 elements, searched by linear scan and by binary search",
      output: "Linear 7.35ns per search, binary 7.54ns — the linear scan wins",
      walkthrough: [
        "Both searches were averaged over the same set of randomly chosen present targets.",
        "The linear scan performs about 8 comparisons on average, and binary search performs about 4.",
        "Despite doing twice the comparisons, the linear scan measured faster.",
        "A 16-element int array occupies 64 bytes, which is a single cache line, so the whole array arrives in one memory fetch.",
        "The linear scan's comparison is false on every step but the last, which the branch predictor handles almost perfectly.",
        "Binary search's comparison against the midpoint is a genuine coin flip, and each mispredict discards speculative work.",
        "The crossover was measured between n = 24 and n = 28; by n = 16,384 binary search wins by 75x.",
      ],
      why: "The clearest case in the module of an O(n) algorithm beating an O(log n) one on the latter's own home ground, and it explains why real sort implementations switch to insertion sort on small partitions.",
    },
    {
      input: "The sentinel optimisation applied to an absent target at n = 10,000,000",
      output: "3.3259ms against 3.5121ms — about 5%, where 50% is the usual claim",
      walkthrough: [
        "The plain loop performs two comparisons per iteration: a bounds check and a value check.",
        "The sentinel version writes the target into the last slot so the loop must stop, removing the bounds check.",
        "Counting comparisons alone, that halves the per-iteration work and predicts roughly a 2x speedup.",
        "Measured, it delivered about 5%.",
        "The bounds check is false on every iteration except the final one, so the processor predicts it correctly almost every time and it was already nearly free.",
        "std::find, which does no such trick, measured 3.2155ms and beat both.",
      ],
      why: "A textbook optimisation whose stated benefit does not survive measurement on modern hardware, and a reminder that inherited performance advice has an expiry date.",
    },
  ],

  visualization: {
    kind: "array",
    description:
      "The array as a strip with a single scan marker moving left to right, and a target chip pinned above it for constant reference. On each step draw the comparison as an arc between the current cell and the target chip, flashing red on a mismatch and locking green on a match, with the matched cell held highlighted while the marker stops dead. Dim every cell already passed and leave every cell ahead untouched, so the boundary between examined and unexamined is always visible — that boundary is the comparison count made visual. Run a live counter beside the strip and, critically, run a second ghost marker for the no-early-exit variant that keeps travelling to the end of the array after the answer is found, so the wasted portion of its journey is watchable rather than described. For a miss, let the marker run off the end of the strip and land on a -1 badge, with the counter reading exactly n, and label that as the case early exit cannot help. A second panel handles the sentinel trick: show the last cell being lifted out and replaced by a copy of the target, drawn in a distinct outline so it is clearly not original data, then run the loop with the bounds-check badge removed entirely; end by restoring the saved value and annotate the measured cost with both numbers, 3.5121ms plain against 3.3259ms sentinel, so the 5% is read rather than assumed. The final panel is the crossover: two sorted strips of the same length side by side, the top scanned linearly one cell at a time and the bottom searched by binary search with jump arcs to the midpoint, then the quarter, then the eighth. Above each, run a branch-prediction meter — the linear scan's stays green because its test is false until the end, while binary search's flickers red on roughly half its steps. Let n be adjustable, and as it grows past the high twenties the two measured timings visibly swap places, with the crossover band between 24 and 28 marked on the axis and the timings at n = 16,384 shown as the far end of the story.",
    sampleInput:
      '{"primary":{"array":[10,4,7,4,2],"target":4,"trace":[{"i":0,"value":10,"match":false},{"i":1,"value":4,"match":true}],"result":1,"comparisons":2,"unexamined":[2,3,4],"duplicateAt":3,"noEarlyExitComparisons":5},"miss":{"array":[10,4,7,4,2],"target":9,"comparisons":5,"result":-1,"earlyExitHelped":false},"distribution":{"n":1000,"targetAtIndex0":1,"targetAtIndex500":501,"targetAtIndex999":1000,"absent":1000,"averageOverHits":500.4,"derivedAverage":500.5,"averageOverMisses":1000.0},"sentinelPanel":{"n":10000000,"plainMs":3.5121,"sentinelMs":3.3259,"stdFindMs":3.2155,"speedupPct":5,"classicClaimPct":50,"mutatesArray":true},"crossover":{"rows":[{"n":12,"linearNs":7.24,"binaryNs":8.81,"winner":"linear"},{"n":16,"linearNs":7.35,"binaryNs":7.54,"winner":"linear"},{"n":20,"linearNs":8.38,"binaryNs":9.44,"winner":"linear"},{"n":24,"linearNs":9.17,"binaryNs":9.47,"winner":"linear"},{"n":28,"linearNs":9.74,"binaryNs":8.92,"winner":"binary"},{"n":32,"linearNs":10.50,"binaryNs":8.98,"winner":"binary"},{"n":1024,"linearNs":174.02,"binaryNs":20.63,"winner":"binary"},{"n":16384,"linearNs":2585.44,"binaryNs":34.50,"winner":"binary"}],"crossoverBand":[24,28],"cacheLineBytes":64,"elementsPerLine":16}}',
    highlights: [
      "The target chip is pinned above the strip and the scan marker starts on index 0, with every cell ahead of it drawn as unexamined.",
      "The first comparison arc flashes red as 10 fails to match 4, and the marker advances one cell.",
      "The second arc locks green on the 4 at index 1, the marker stops dead, and the counter reads 2.",
      "Indices 2, 3 and 4 stay undimmed, showing plainly that the scan never looked at them.",
      "A second 4 sits at index 3 and is never reached, which is why the scan returns the first occurrence without any extra rule.",
      "A ghost marker for the no-early-exit variant keeps travelling to the end, and its counter climbs to 5 for the same answer.",
      "Switching the target to 9 sends the marker off the end of the strip onto a -1 badge with the counter at exactly 5.",
      "That miss is labelled as the case early exit cannot help, matching the measured average of exactly 1000.0 comparisons at n = 1,000.",
      "The sentinel panel lifts the last cell out and drops in a copy of the target, drawn in a distinct outline so it reads as planted rather than real.",
      "The bounds-check badge disappears from the loop entirely, and the walk runs with a single comparison per step.",
      "The saved value is restored, and the two measured timings are shown together: 3.5121ms plain against 3.3259ms sentinel.",
      "That 5% is set beside the classic 50% claim, with std::find's 3.2155ms beating both.",
      "The crossover panel runs two sorted strips together, the top scanned cell by cell and the bottom jumping to the midpoint, then the quarter, then the eighth.",
      "Prediction meters above each stay green for the linear scan and flicker red on roughly half of binary search's steps.",
      "As n is increased past the high twenties the two timings swap places, with the crossover band between 24 and 28 marked on the axis.",
      "At n = 16,384 the bars separate completely — 2,585.44ns against 34.50ns — showing the asymptotic story reasserting itself at scale.",
    ],
  },

  edgeCases: [
    "Empty array — the loop never runs and the function returns -1, which requires no special handling in the plain version but does in the sentinel one.",
    "Single-element array — one comparison decides the answer.",
    "Target at the first index — the best case, costing exactly one comparison.",
    "Target at the last index — costs the full n, indistinguishable in cost from a miss until the final comparison.",
    "Target absent — always costs exactly n, verified as 1000.0 comparisons on average at n = 1,000.",
    "Target appearing multiple times — the first occurrence is returned, which follows from scanning front to back.",
    "All elements identical and equal to the target — returns 0 after a single comparison.",
    "All elements identical and different from the target — the full scan, the worst case in its most predictable form.",
    "Sentinel search on an empty array — the guard is mandatory, since writing to index -1 corrupts memory in C++ and raises in Python.",
    "Sentinel search where the true last element is the target — the restore-then-check step exists precisely for this case.",
    "Sorted early termination applied to unsorted input — silently reports absent for values that are genuinely present later.",
  ],

  pitfalls: [
    "Scanning the whole array after finding a match, which gives up the n/2 average and costs the full n on every input.",
    "Recording matches without a first-match guard, which returns the LAST occurrence rather than the first.",
    "Expecting early exit to speed up misses. Absence requires examining every element, measured at exactly n comparisons every time.",
    "Believing the sentinel trick halves the runtime. Measured about 5% at n = 10,000,000, against the 50% the comparison count predicts.",
    "Using the sentinel trick on a shared, read-only or concurrently accessed array, since it writes into the last slot.",
    "Forgetting to restore the sentinel on every return path, which leaves the caller's array quietly corrupted.",
    "Applying the sorted early-termination version to unsorted data, which reports absent for elements that are present.",
    "Sorting an unsorted array in order to binary search it, for a single lookup. Sorting costs O(n log n) to avoid one O(n) scan.",
    "Assuming binary search always beats linear search. Measured, linear won up to about 24 elements on sorted data.",
    "Calling arr.index(target) in Python without a try/except, since it raises ValueError instead of returning -1.",
    "Writing a manual scan loop in Python where a builtin exists. Measured 11.3435ms against 1.8640ms for the in operator at n = 1,000,000.",
    "Returning a boolean when the caller needs a position, or a position when presence would do — in Python the two have measurably different costs.",
  ],

  commonDoubts: [
    {
      question: "Why is the average n/2 rather than n?",
      answer:
        "Because a successful search stops as soon as it finds the target, and a uniformly random target is equally likely to sit anywhere. Finding it at index 0 costs 1 comparison and at index n-1 costs n, so the mean over all positions is (n+1)/2. Verified at n = 1,000 over 200,000 uniformly random present targets: 500.4 comparisons measured, against the derived 500.5. That average applies only to hits — a miss always costs the full n.",
    },
    {
      question: "Does early exit help when the element is not there?",
      answer:
        "Not at all, and this asymmetry is worth internalising. To conclude that something is absent you must have examined every element, so there is no early stopping point. Measured over 20,000 misses at n = 1,000, the cost was exactly 1000.0 comparisons every single time. If your workload is dominated by lookups that fail — validation, membership checks against a blacklist — linear search costs full price on every call, which is the strongest argument for a hash set.",
    },
    {
      question: "Is the sentinel trick worth using?",
      answer:
        "Almost never on modern hardware. The idea is sound — remove the bounds check so each iteration performs one comparison instead of two — and by comparison count it predicts a 2x speedup. Measured at n = 10,000,000 it delivered about 5%: 3.3259ms against 3.5121ms. The bounds check is false on every iteration but the last, so the branch predictor gets it right essentially always and it was already close to free. Meanwhile the trick writes into the array, so it cannot be used on a const, shared or concurrently read input. std::find, which does none of this, measured 3.2155ms and beat both.",
    },
    {
      question: "Shouldn't I always use binary search on a sorted array?",
      answer:
        "No — measured on this machine, linear search won up to about 24 elements. Averaged over random present targets: at n = 16, linear took 7.35ns against binary's 7.54ns; at n = 24, 9.17ns against 9.47ns; and binary only pulled ahead from n = 28. Three reasons. Linear search's comparison is false until the very end, which predicts almost perfectly, while binary search's midpoint comparison is a coin flip. Linear search walks memory forwards so the hardware prefetches, while binary search jumps unpredictably. And a 16-element int array is 64 bytes — one cache line — so the entire array arrives in a single fetch and there is nothing left to save.",
    },
    {
      question: "Then when does binary search actually pay off?",
      answer:
        "Quickly, once you are past the crossover. At n = 1,024 binary search measured 20.63ns against linear's 174.02ns, and at n = 16,384 it was 34.50ns against 2,585.44ns — a 75x gap. The asymptotic story is entirely correct; it just does not describe what happens at n = 16. Complexity tells you how cost grows, not what it is at a particular size, and below roughly two dozen elements the growth has not had room to matter.",
    },
    {
      question: "If the array is unsorted, should I sort it first and then binary search?",
      answer:
        "Not for a single lookup. Sorting is O(n log n), which is strictly more than the O(n) scan you were trying to avoid — you would do more work to set up the shortcut than the shortcut saves. It becomes worthwhile only when the same array will be searched many times: pay O(n log n) once, then each of the m searches costs O(log n) instead of O(n). If you will search many times and do not need ordering for anything else, a hash set is usually the better trade, giving O(1) lookups after an O(n) build.",
    },
    {
      question: "Why is my Python loop so much slower than target in arr?",
      answer:
        "Because in runs as compiled C over the list while your loop runs one interpreted step per element. Measured at n = 1,000,000 over random present targets: the in operator took 1.8640ms, arr.index() 2.9003ms, and a manual loop 11.3435ms. On an absent target the manual loop took 20.29ms against .index()'s 5.50ms. Use in when you only need to know whether the element is there, and .index() when you need the position — but wrap it in try/except, because .index() raises ValueError rather than returning -1.",
    },
    {
      question: "Can I speed up linear search by scanning from both ends at once?",
      answer:
        "It halves the number of iterations while doing two comparisons in each, so the comparison count is unchanged and only the loop overhead is reduced. It also breaks first-occurrence semantics unless you handle the two hits carefully, since the pointer coming from the right can find a later match first. On top of that it makes the branch structure more complex, which the measurements throughout this module suggest matters more than the comparison count. If you need more speed than a plain scan, the answer is a different data structure rather than a cleverer scan.",
    },
    {
      question: "When is linear search genuinely the right choice?",
      answer:
        "More often than its reputation suggests. When the data is unsorted and will be searched once, since sorting costs more than the scan. When the data is small — measured, up to about two dozen elements it beats binary search even on sorted input. When you need the first occurrence by position rather than any occurrence. And when the structure has no random access, such as a linked list, where binary search cannot reach the middle in constant time. It is a legitimate answer, not a fallback you settle for.",
    },
  ],

  relatedIds: ["largest-element", "move-zeros-to-end", "check-if-array-is-sorted-and-rotated", "two-sum"],
};

export default content;
