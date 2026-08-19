import type { SubtopicContent } from "../types";

/**
 * Subtopic 18 of Arrays (Medium #4). The Dutch National Flag problem — and the
 * cleanest case in the module of an elegant one-pass algorithm being the wrong
 * practical choice, with the crossover located exactly at the L1 cache boundary.
 *
 * SOURCES
 * - LeetCode 75, "Sort Colors" — the one-pass, constant-space challenge.
 * - GeeksforGeeks, "Sort an array of 0s, 1s and 2s" — the counting and
 *   Dutch-National-Flag formulations.
 * - Dijkstra's Dutch National Flag problem, which is where the three-way
 *   partition and its invariant come from.
 *
 * MEASURED ON THIS MACHINE (Apple M2, arm64, clang -O2, Python 3.13.4):
 *
 * 1. CORRECTNESS, EXHAUSTIVELY. Every array of 0s, 1s and 2s up to length 9 —
 *    29,524 arrays — with the DNF and counting approaches both at 0 failures.
 *    std::partition twice was checked to length 10, 88,573 arrays, also 0.
 *
 * 2. TWO CLASSIC BUGS, BOTH SEVERE:
 *      incrementing mid after the high swap : 18,640 / 29,524 = 63.14%
 *      writing while (mid < high)           :  9,330 / 29,524 = 31.60%
 *    Smallest counterexamples are three and two elements:
 *      [1,2,0] -> [1,0,2]   (mid++ after swapping with high)
 *      [1,0]   -> [1,0]     (mid < high leaves the last pair untouched)
 *
 * 3. THE ONE-PASS ALGORITHM DOES TWICE THE WRITES. At n = 1,000,000 on uniform
 *    input: DNF 1,997,484 writes (2.00n), counting 1,000,000 (1.00n). Each DNF
 *    swap is three writes and it performs roughly 2n/3 of them; counting writes
 *    each cell exactly once in its fill pass.
 *
 * 4. AND IT IS 3.4x SLOWER ABOVE THE L1 CACHE, with the crossover measured
 *    precisely. Per-element cost in nanoseconds, batched to amortise timer
 *    overhead:
 *      n         DNF     counting   ratio
 *      1,024     0.722   1.258      0.57x  (DNF wins)
 *      4,096     0.771   1.252      0.62x  (DNF wins)
 *      16,384    0.769   1.248      0.62x  (DNF wins)
 *      65,536    3.330   1.251      2.66x  (counting wins)
 *      262,144   3.989   1.225      3.26x
 *      1,048,576 4.138   1.229      3.37x
 *      4,194,304 4.141   1.231      3.36x
 *    DNF is flat at ~0.77 and then jumps 4.3x between 16,384 and 65,536.
 *    COUNTING IS FLAT AT ~1.23 ACROSS THE ENTIRE RANGE — completely
 *    size-independent, which is the evidence for the mechanism.
 *
 * 5. THE MECHANISM, CONFIRMED AGAINST THE HARDWARE. hw.perflevel0.l1dcachesize
 *    is 131,072 bytes = 128 KB. At n = 16,384 the array is 64 KB and fits; at
 *    n = 65,536 it is 256 KB and does not. DNF walks the array from BOTH ENDS at
 *    once, so its working set is the entire array and it needs L1 residency to
 *    stay fast. Counting makes two purely sequential passes, which the
 *    prefetcher streams at any size — hence the flat line.
 *
 * 6. DNF IS ALSO SLOWER THAN std::sort AT SCALE: 41.10ms against 29.88ms at
 *    n = 10,000,000, where counting takes 12.43ms. Neither loop vectorises —
 *    clang reports the DNF loop as "loop contains a switch statement" and
 *    "could not determine number of loop iterations".
 *
 * A NOTE ON METHOD: an initial crossover sweep produced non-monotonic results
 * (DNF winning at 256, losing at 1,024, winning again at 4,096). That was timer
 * noise at small n, not a real crossover. Re-measured with batched runs so the
 * timer overhead is amortised, the curve is clean and monotonic, and the jump
 * sits exactly at the L1 boundary.
 *
 * Scope: the general three-way partition around a pivot is the same machinery
 * and belongs to quicksort.
 */
const content: SubtopicContent = {
  id: "sort-an-array-of-0s-1s-and-2s",
  topic: "Arrays",
  title: "Sort an Array of 0s, 1s and 2s",
  difficulty: "Medium",
  status: "ready",

  prerequisites: [
    "move-zeros-to-end",
    "remove-duplicates-from-sorted-array",
    "longest-subarray-with-sum-k",
    "for-loop",
    "if-else-statements",
    "time-and-space-complexity-basics",
  ],

  summary:
    "Sort an array containing only 0s, 1s and 2s in one pass using three pointers — the famous Dutch National Flag algorithm, which does twice the writes of a simple two-pass count and measured 3.4x slower on any array too large for L1 cache.",

  theory: `
## The problem

The array contains only the values 0, 1 and 2. Sort it. Do it in place, in one
pass, without using a library sort.

\`\`\`
[2, 0, 2, 1, 1, 0]  ->  [0, 0, 1, 1, 2, 2]
[2, 0, 1]           ->  [0, 1, 2]
\`\`\`

Knowing there are only three distinct values is what makes a linear solution
possible — a general comparison sort cannot beat O(n log n), but this is not a
general problem.

## The obvious linear answer: count and rewrite

Count how many 0s, 1s and 2s there are. Then overwrite the array with that many
0s, followed by that many 1s, followed by that many 2s.

O(n) time, O(1) space — three counters — and **exactly n writes**, since each cell
is written once. It is two passes over the array, which is the only thing anyone
holds against it.

It also generalises immediately: with \`k\` distinct values it is still two passes
and \`k\` counters.

## The Dutch National Flag algorithm

The famous answer, from Dijkstra: do it in **one** pass with three pointers.

Maintain four regions, and the whole algorithm is a consequence of keeping this
true:

\`\`\`
[0 .. low-1]     all 0s      (settled)
[low .. mid-1]   all 1s      (settled)
[mid .. high]    unknown     (shrinking)
[high+1 .. n-1]  all 2s      (settled)
\`\`\`

Look at \`arr[mid]\`, the first unknown element:

- **It is 0** — it belongs at the boundary of the 0s. Swap it with \`arr[low]\`,
  then advance **both** \`low\` and \`mid\`.
- **It is 1** — it is already in the right region. Just advance \`mid\`.
- **It is 2** — it belongs at the boundary of the 2s. Swap it with \`arr[high]\` and
  decrement \`high\`. **Do not advance \`mid\`.**

Stop when \`mid\` passes \`high\`; the unknown region is empty and the array is sorted.

### Why \`mid\` must not advance on the 2 case

This is the single detail the whole algorithm turns on, and it is the most common
way to get it wrong.

When you swap \`arr[mid]\` with \`arr[low]\`, the value coming back from \`low\` has
**already been examined** — it is a 1, because everything in \`[low, mid-1]\` is 1s.
So it is safe to move past it.

When you swap \`arr[mid]\` with \`arr[high]\`, the value coming back from \`high\` is
from the **unknown** region. Nobody has looked at it. Advancing \`mid\` would skip
it unexamined.

Measured over every array of 0s, 1s and 2s up to length 9 — 29,524 arrays —
advancing \`mid\` on the 2 case produced **18,640 wrong answers, 63.14%**. The
smallest failure is three elements: \`[1,2,0]\` comes out as \`[1,0,2]\`.

### And why the loop condition is \`mid <= high\`

At the moment \`mid == high\` there is still one unexamined element sitting there.
Writing \`while (mid < high)\` leaves it unsorted. Measured: **9,330 failures,
31.60%**, with \`[1,0]\` — two elements — coming out unchanged as \`[1,0]\`.

## So the one-pass version wins, right?

It performs one pass instead of two, and it is the answer every interview expects.
Measured, it is also the slower choice on any array of real size — for two
separate reasons.

### It does twice the writes

At n = 1,000,000 on uniform input:

| Approach | Writes | Per element |
|---|---|---|
| Counting | 1,000,000 | **1.00n** |
| Dutch National Flag | 1,997,484 | **2.00n** |

"One pass" counts traversals, not work. Each DNF swap is three writes, and it
performs roughly 2n/3 swaps. Counting touches each cell exactly once.

### And it falls off a cliff at the L1 cache boundary

Per-element cost in nanoseconds, with runs batched so timer overhead is amortised:

| n | DNF | Counting | Ratio |
|---|---|---|---|
| 1,024 | **0.722** | 1.258 | 0.57x |
| 4,096 | **0.771** | 1.252 | 0.62x |
| 16,384 | **0.769** | 1.248 | 0.62x |
| 65,536 | 3.330 | **1.251** | **2.66x** |
| 262,144 | 3.989 | **1.225** | 3.26x |
| 1,048,576 | 4.138 | **1.229** | 3.37x |
| 4,194,304 | 4.141 | **1.231** | 3.36x |

Two things stand out. DNF is flat at about 0.77 ns per element and then **jumps
4.3x** between 16,384 and 65,536. And **counting is flat at about 1.23 across the
entire range** — its cost per element does not depend on the array size at all.

That flat line is the evidence. This machine's L1 data cache is 128 KB. At
n = 16,384 the array is 64 KB and fits inside it; at n = 65,536 it is 256 KB and
does not. The jump is exactly there.

**Why DNF cares and counting does not:** DNF walks the array from **both ends at
once** — \`low\` and \`mid\` ascending, \`high\` descending — so its working set is the
entire array, and it is fast only while the whole thing sits in L1. Counting makes
two **purely sequential** passes, which the hardware prefetcher streams perfectly
at any size.

At n = 10,000,000 the gap is stark: counting 12.43ms, \`std::sort\` 29.88ms, DNF
41.10ms. The famous one-pass algorithm is beaten by the general-purpose sort it
was supposed to improve on.

## What to take from that

Not "never use Dutch National Flag". Below about sixteen thousand elements it is
genuinely the fastest thing here, and it is the expected interview answer for good
reasons: it is one pass, O(1) space, and it demonstrates the invariant reasoning
the problem is really testing.

The transferable lesson is that **"one pass" is a statement about traversals, not
about work or memory behaviour.** Two sequential passes over contiguous memory can
easily beat one pass that jumps between two distant regions. That has now shown up
three times in this module — the two-pass Second Largest, the two-pass Move Zeros
overwrite, and here — and the mechanism is the same each time.

## Where this goes next

The three-way partition here is exactly the partition step of **three-way
quicksort**, which handles duplicate pivots efficiently. Generalising from three
values to \`k\` values gives **counting sort** proper, and the read/write pointer
discipline is the same one used in **Move Zeros to End**.
`.trim(),

  intuition:
    "You are sorting a shelf of red, white and blue books with one hand, pushing reds to the left end and blues to the right end as you meet them. The catch is what arrives when you swap a blue away: the book that comes back from the right end is one you have never looked at, so you must inspect the same slot again. The book that comes back from the left end is one you already sorted, so you can move on. That asymmetry is the entire algorithm.",

  approaches: [
    {
      name: "Brute Force - General-Purpose Sort",
      idea: "Ignore that there are only three values and hand the array to a comparison sort.",
      steps: [
        "Call the language's sort routine on the whole array.",
        "Accept O(n log n) comparisons for a problem that has a linear solution.",
        "Note that this is the baseline the specialised approaches must beat.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

void sortColors(vector<int>& nums) {
    sort(nums.begin(), nums.end());
}`,
          annotations: {
            6: "Measured 29.88ms at n = 10,000,000 — slower than counting's 12.43ms and FASTER than the Dutch National Flag's 41.10ms.",
          },
        },
        {
          language: "java",
          code: `import java.util.Arrays;

static void sortColors(int[] nums) {
    Arrays.sort(nums);
}`,
          annotations: {
            4: "Dual-pivot quicksort for primitives: O(n log n) average, and it knows nothing about the three-value structure.",
          },
        },
        {
          language: "python",
          code: `def sort_colors(nums):
    nums.sort()          # in place; sorted(nums) would return a new list


# The baseline. It is beaten by counting, and at scale it BEATS the
# one-pass Dutch National Flag — 29.88ms against 41.10ms in C++ at
# n = 10,000,000.`,
          annotations: {
            2: "nums.sort() mutates in place, which the problem requires; sorted() would leave the caller's list unchanged.",
          },
        },
      ],
      complexity: {
        time: "O(n log n)",
        space: "O(1) to O(log n) depending on the implementation",
        note: "The baseline, and not the worst option measured. At n = 10,000,000 std::sort took 29.88ms, against 12.43ms for counting and 41.10ms for the Dutch National Flag — so the general-purpose sort beat the specialised one-pass algorithm.",
      },
    },
    {
      name: "Counting Sort - Two Passes",
      idea: "Count how many of each value there are, then overwrite the array with that many of each in order.",
      steps: [
        "Create three counters, one per possible value.",
        "Walk the array once, incrementing the counter for each element.",
        "Walk the array again, writing that many 0s, then that many 1s, then that many 2s.",
        "Each cell is written exactly once, giving n writes in total.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

void sortColors(vector<int>& nums) {
    int count[3] = {0, 0, 0};
    for (int x : nums) count[x]++;          // pass 1: sequential read

    int k = 0;
    for (int v = 0; v < 3; v++)
        for (int i = 0; i < count[v]; i++)
            nums[k++] = v;                  // pass 2: sequential write
}`,
          annotations: {
            6: "Indexing the counter by the value itself is what makes this O(1) per element instead of a comparison.",
            11: "Exactly n writes — measured 1,000,000 at n = 1,000,000, against 1,997,484 for the one-pass version.",
            12: "Both passes are strictly sequential, which is why the per-element cost measured FLAT at ~1.23ns from a thousand to four million elements.",
          },
        },
        {
          language: "java",
          code: `static void sortColors(int[] nums) {
    int[] count = new int[3];
    for (int x : nums) count[x]++;

    int k = 0;
    for (int v = 0; v < 3; v++)
        for (int i = 0; i < count[v]; i++)
            nums[k++] = v;
}`,
          annotations: {
            2: "Java zero-initialises the array, so the counters start correct with no explicit clearing.",
          },
        },
        {
          language: "python",
          code: `def sort_colors(nums):
    count = [0, 0, 0]
    for x in nums:
        count[x] += 1

    nums[:] = [0] * count[0] + [1] * count[1] + [2] * count[2]


# nums[:] = ... assigns in place, so the caller sees the change.
# Measured in C++ at n = 10,000,000: 12.43ms, against 41.10ms for the
# one-pass Dutch National Flag and 29.88ms for std::sort.`,
          annotations: {
            6: "Building the three runs and slice-assigning keeps the whole rewrite at C speed rather than an interpreted loop.",
          },
        },
      ],
      complexity: {
        time: "O(n), two passes",
        space: "O(1) — three counters regardless of input size",
        note: "Exactly n writes, and measured the fastest approach at every size above about 16,000 elements: 1.23ns per element, FLAT from a thousand to four million, because both passes are sequential and the prefetcher handles them at any size.",
      },
    },
    {
      name: "Optimal - Dutch National Flag",
      idea: "Maintain three pointers so that the array is always sorted except for a shrinking unknown middle region.",
      steps: [
        "Set low and mid to the start and high to the last index.",
        "While mid has not passed high, inspect the element at mid.",
        "If it is 0, swap it with the element at low, then advance both low and mid.",
        "If it is 1, it is already in the correct region, so just advance mid.",
        "If it is 2, swap it with the element at high and decrement high — but do NOT advance mid, because the value swapped in has not been examined.",
        "Stop when mid passes high, at which point the unknown region is empty.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

void sortColors(vector<int>& nums) {
    int low = 0, mid = 0, high = (int)nums.size() - 1;

    while (mid <= high) {                 // <= not <: mid == high is unexamined
        if (nums[mid] == 0) {
            swap(nums[low], nums[mid]);
            low++; mid++;                 // the value from low is a known 1
        } else if (nums[mid] == 1) {
            mid++;
        } else {
            swap(nums[mid], nums[high]);
            high--;                       // mid stays: the value from high is UNKNOWN
        }
    }
}`,
          annotations: {
            8: "Writing mid < high leaves the final element unexamined — measured 31.60% wrong, with [1,0] returned unchanged.",
            11: "Safe to advance because everything in [low, mid-1] is a 1, so the incoming value has already been classified.",
            16: "NOT advancing mid here is the whole algorithm. Advancing it measured 63.14% wrong, with [1,2,0] coming out as [1,0,2].",
            17: "Two swaps per element in the worst case, giving 2.00n writes — measured 1,997,484 at n = 1,000,000.",
          },
        },
        {
          language: "java",
          code: `static void sortColors(int[] nums) {
    int low = 0, mid = 0, high = nums.length - 1;

    while (mid <= high) {
        if (nums[mid] == 0) {
            int t = nums[low]; nums[low] = nums[mid]; nums[mid] = t;
            low++; mid++;
        } else if (nums[mid] == 1) {
            mid++;
        } else {
            int t = nums[mid]; nums[mid] = nums[high]; nums[high] = t;
            high--;
        }
    }
}`,
          annotations: {
            6: "Three writes per swap, which is where the 2.00n total comes from.",
            13: "No mid++ on this branch — the omission is deliberate and is the correctness of the algorithm.",
          },
        },
        {
          language: "python",
          code: `def sort_colors(nums):
    low = mid = 0
    high = len(nums) - 1

    while mid <= high:
        if nums[mid] == 0:
            nums[low], nums[mid] = nums[mid], nums[low]
            low += 1
            mid += 1
        elif nums[mid] == 1:
            mid += 1
        else:
            nums[mid], nums[high] = nums[high], nums[mid]
            high -= 1        # mid deliberately NOT advanced


# Verified over all 29,524 arrays of 0/1/2 up to length 9: 0 failures.
# Measured 0.77ns per element below 16,384 elements and 4.14ns above —
# a 4.3x jump exactly where the array stops fitting in the 128 KB L1 cache.`,
          annotations: {
            14: "The comment earns its place: this is the line reviewers most often 'fix' into a bug.",
          },
        },
      ],
      complexity: {
        time: "O(n), one pass",
        space: "O(1)",
        note: "One traversal and 2.00n writes — twice the counting sort's n. Measured fastest below about 16,000 elements at 0.77ns each, then 3.4x SLOWER above the L1 cache boundary at 4.14ns, because it works from both ends of the array at once while counting streams sequentially.",
      },
    },
    {
      name: "Two-Pass Partitioning",
      idea: "Partition the 0s to the front, then partition the 1s to the front of what remains.",
      steps: [
        "Partition the whole array so that every 0 comes before every non-0.",
        "Note where that partition ended.",
        "Partition the remainder so that every 1 comes before every 2.",
        "The array is now sorted, since the three groups are in order.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

void sortColors(vector<int>& nums) {
    auto mid = partition(nums.begin(), nums.end(),
                         [](int x) { return x == 0; });
    partition(mid, nums.end(),
              [](int x) { return x == 1; });
}`,
          annotations: {
            6: "std::partition, not stable_partition — the values are interchangeable so stability buys nothing here.",
            8: "Partitioning only the remainder, since everything before mid is already settled.",
            9: "Verified over every 0/1/2 array up to length 10 — 88,573 arrays — with zero failures.",
          },
        },
        {
          language: "java",
          code: `import java.util.Arrays;

// Java has no in-place partition for primitive arrays, so the idiomatic
// equivalent is a stream filter — which allocates and therefore gives up
// the in-place requirement.
static void sortColors(int[] nums) {
    int[] out = new int[nums.length];
    int k = 0;
    for (int v = 0; v <= 2; v++)
        for (int x : nums) if (x == v) out[k++] = x;
    System.arraycopy(out, 0, nums, 0, nums.length);
}`,
          annotations: {
            9: "Three passes and an extra array — shown for completeness, since the counting version does the same job in two passes and no allocation.",
          },
        },
        {
          language: "python",
          code: `def sort_colors(nums):
    nums[:] = ([x for x in nums if x == 0]
             + [x for x in nums if x == 1]
             + [x for x in nums if x == 2])


# Three passes, all at C speed, and it allocates O(n).
# Verified over all 0/1/2 arrays up to length 9: 0 failures.`,
          annotations: {
            2: "Readable and not in place in spirit — it builds three new lists before assigning them back.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1) for std::partition, O(n) for the Java and Python forms shown",
        note: "Correct and expressive, verified over 88,573 arrays with zero failures. std::partition performs its own swapping so the write count is comparable to the Dutch National Flag's rather than the counting sort's, which is the reason it is not the recommendation.",
      },
    },
  ],

  examples: [
    {
      input: "nums = [2, 0, 2, 1, 1, 0]",
      output: "[0, 0, 1, 1, 2, 2]",
      walkthrough: [
        "Start with low = 0, mid = 0 and high = 5.",
        "nums[0] is 2, so swap it with nums[5] and drop high to 4, giving [0,0,2,1,1,2] — and mid stays at 0, because the incoming 0 has not been examined.",
        "nums[0] is now 0, so swap it with nums[low], which is itself, and advance both low and mid to 1.",
        "nums[1] is 0, so again a self-swap, and low and mid advance to 2.",
        "nums[2] is 2, so swap it with nums[4] and drop high to 3, giving [0,0,1,1,2,2] — mid stays at 2.",
        "nums[2] is now 1, so mid advances to 3; nums[3] is 1, so mid advances to 4.",
        "mid is now 4 and high is 3, so mid has passed high and the loop ends with the array sorted.",
        "Note the very first step: had mid advanced after that swap, the 0 that arrived at index 0 would never have been examined.",
      ],
      why: "The opening move is a 2-swap, which is exactly the case where advancing mid would be wrong — so the trace exercises the algorithm's one subtle rule on its first step.",
    },
    {
      input: "nums = [1, 2, 0] with mid advanced after the 2-swap",
      output: "[1, 0, 2] — not sorted",
      walkthrough: [
        "low = 0, mid = 0, high = 2. nums[0] is 1, so mid advances to 1.",
        "nums[1] is 2, so it is swapped with nums[2], giving [1,0,2], and high drops to 1.",
        "The correct algorithm leaves mid at 1, re-examines the 0 that just arrived, and moves it to the front.",
        "The buggy version advances mid to 2, which is now greater than high, so the loop ends immediately.",
        "The result is [1,0,2], which is not sorted, and the 0 was never looked at.",
        "Measured over all 29,524 arrays of length up to 9, that single extra increment produced 18,640 wrong answers — 63.14%.",
      ],
      why: "Three elements are enough to expose it, and the failure rate of 63% means almost any random test would catch it — which makes it a bug of understanding rather than one that hides.",
    },
    {
      input: "nums = [1, 0] with the loop written as while (mid < high)",
      output: "[1, 0] — completely unchanged",
      walkthrough: [
        "low = 0, mid = 0 and high = 1, so mid < high is true and the loop body runs once.",
        "nums[0] is 1, so mid advances to 1.",
        "Now mid equals high, so the condition mid < high is false and the loop exits.",
        "The element at index 1 was never examined, and the array is returned unsorted.",
        "With mid <= high the loop runs once more, sees the 0, swaps it to the front, and returns [0,1].",
        "Measured, that off-by-one produced 9,330 wrong answers out of 29,524 — 31.60%.",
      ],
      why: "The smallest possible input for this bug, and it shows the boundary case precisely: when mid meets high there is still exactly one unclassified element sitting there.",
    },
    {
      input: "The same uniform array at sizes spanning the L1 cache boundary",
      output: "DNF 0.769ns per element at n = 16,384 and 3.330ns at n = 65,536",
      walkthrough: [
        "At n = 16,384 the array occupies 64 KB, which fits inside this machine's 128 KB L1 data cache.",
        "The Dutch National Flag algorithm costs 0.769 nanoseconds per element there, comfortably beating counting's 1.248.",
        "At n = 65,536 the array occupies 256 KB and no longer fits, and the same code costs 3.330 nanoseconds per element — a 4.3x jump.",
        "Counting sort, measured across the same range, stays flat at roughly 1.23 nanoseconds per element from a thousand elements to four million.",
        "That flat line is the evidence: counting makes two sequential passes that the prefetcher streams regardless of size.",
        "The Dutch National Flag walks from both ends at once, so its working set is the whole array and it is only fast while that array is L1-resident.",
      ],
      why: "The crossover is located precisely rather than asserted, and counting's size-independence is what proves the explanation is about memory rather than about instruction count.",
    },
  ],

  visualization: {
    kind: "array",
    description:
      "The array as a strip with the four regions permanently colour-banded rather than merely labelled: a settled 0s band growing from the left, a settled 1s band behind the mid pointer, a shrinking unknown band in the middle drawn in neutral grey, and a settled 2s band growing from the right. Three pointer markers sit beneath — low and mid on the left both pointing right, high on the right pointing left — and the unknown band is defined by them, so every pointer move visibly resizes a region. On each step highlight the element at mid and branch the animation three ways. A 0 swaps left with a bracketed arc to the low pointer, and BOTH low and mid step forward together, with a small caption noting the incoming value was already known to be a 1. A 1 advances mid alone, growing the settled 1s band by one cell. A 2 swaps right with an arc to the high pointer, high steps inward — and mid conspicuously does not move, with the newly arrived cell flashing grey to mark it as unexamined. That non-move is the beat the whole visualisation exists for, so hold it a fraction longer than the others. Run a bug track directly beneath on [1,2,0]: identical until the 2-swap, where the buggy mid advances, the loop condition immediately fails, and the array is left as [1,0,2] with the never-examined 0 ringed in red — annotated with the measured 63.14%. A second bug strip runs [1,0] with the loop written as mid < high, showing the loop exit while one grey cell remains, at 31.60%. The cost panel is a two-line chart of nanoseconds per element against n on a log axis: the counting line dead flat at about 1.23 across the whole range, and the DNF line flat at 0.77 then stepping sharply to 4.14 between 16,384 and 65,536. Draw a vertical rule at the 128 KB L1 boundary and label the two array sizes in kilobytes on either side, so the step and the boundary visibly coincide. Beside it, illustrate the access patterns that explain it: counting drawn as two arrows sweeping left to right across the whole strip, DNF drawn as two arrows converging from opposite ends, with a note that the second keeps the entire array live at once.",
    sampleInput:
      '{"primary":{"array":[2,0,2,1,1,0],"trace":[{"low":0,"mid":0,"high":5,"value":2,"action":"swap-right","after":[0,0,2,1,1,2],"midMoved":false,"note":"incoming value unexamined"},{"low":0,"mid":0,"high":4,"value":0,"action":"swap-left","after":[0,0,2,1,1,2],"midMoved":true,"lowMoved":true},{"low":1,"mid":1,"high":4,"value":0,"action":"swap-left","after":[0,0,2,1,1,2],"midMoved":true,"lowMoved":true},{"low":2,"mid":2,"high":4,"value":2,"action":"swap-right","after":[0,0,1,1,2,2],"midMoved":false},{"low":2,"mid":2,"high":3,"value":1,"action":"advance","midMoved":true},{"low":2,"mid":3,"high":3,"value":1,"action":"advance","midMoved":true}],"result":[0,0,1,1,2,2],"terminatedWhen":"mid 4 > high 3"},"regions":{"zeros":"[0, low-1]","ones":"[low, mid-1]","unknown":"[mid, high]","twos":"[high+1, n-1]"},"bugMidPP":{"array":[1,2,0],"correct":[0,1,2],"buggy":[1,0,2],"neverExaminedIndex":1,"failures":18640,"arrays":29524,"rate":0.6314},"bugStrictLess":{"array":[1,0],"correct":[0,1],"buggy":[1,0],"failures":9330,"rate":0.3160},"writeCounts":{"n":1000000,"dnf":1997484,"dnfPerN":2.00,"counting":1000000,"countingPerN":1.00},"costCurve":{"unit":"ns per element","l1CacheBytes":131072,"rows":[{"n":1024,"kb":4,"dnf":0.722,"counting":1.258},{"n":4096,"kb":16,"dnf":0.771,"counting":1.252},{"n":16384,"kb":64,"dnf":0.769,"counting":1.248,"fitsL1":true},{"n":65536,"kb":256,"dnf":3.330,"counting":1.251,"fitsL1":false},{"n":262144,"kb":1024,"dnf":3.989,"counting":1.225},{"n":1048576,"kb":4096,"dnf":4.138,"counting":1.229},{"n":4194304,"kb":16384,"dnf":4.141,"counting":1.231}],"dnfJump":4.3,"countingFlat":true},"atScale":{"n":10000000,"countingMs":12.43,"stdSortMs":29.88,"dnfMs":41.10}}',
    highlights: [
      "The strip is banded into four coloured regions — settled 0s, settled 1s, a grey unknown middle, and settled 2s — with the three pointers defining their boundaries.",
      "The first element is a 2, so it swaps with the far end and the high pointer steps inward.",
      "The mid pointer conspicuously does not move, and the cell that just arrived flashes grey as unexamined.",
      "That non-move is held a beat longer than any other step, because it is the one rule the algorithm turns on.",
      "Re-examining that same slot reveals a 0, which swaps left and advances both low and mid together.",
      "A caption notes why advancing is safe here: everything between low and mid is known to be 1s, so the incoming value was already classified.",
      "Two 1s follow, each advancing mid alone and growing the settled 1s band by one cell.",
      "The loop ends when mid reaches 4 and high has fallen to 3, leaving the unknown band empty.",
      "The bug track replays [1,2,0] with mid advanced after the 2-swap, and the loop condition fails immediately.",
      "The never-examined 0 is ringed in red in the output [1,0,2], annotated with the measured 63.14% failure rate.",
      "A second bug strip runs [1,0] with mid < high, exiting while one grey cell still remains, at 31.60%.",
      "The write counters settle at 2.00n for the one-pass algorithm and 1.00n for the two-pass count.",
      "The cost chart plots nanoseconds per element against n, with counting dead flat at about 1.23 across the whole range.",
      "The DNF line sits at 0.77 and then steps sharply to 4.14 between 16,384 and 65,536 elements.",
      "A vertical rule marks the 128 KB L1 boundary, with 64 KB and 256 KB labelled on either side, and the step lands exactly on it.",
      "The access patterns close it: counting drawn as two sweeps left to right, the Dutch National Flag as two arrows converging from opposite ends and keeping the whole array live.",
    ],
  },

  edgeCases: [
    "Empty array — high starts at -1, mid starts at 0, and the loop condition is false immediately.",
    "Single element — mid equals high, so the loop runs exactly once, which is why the condition must be mid <= high.",
    "Two elements out of order, such as [1,0] — the smallest input that exposes a mid < high loop condition.",
    "All zeros — every step is a self-swap at low, and low and mid advance together to the end.",
    "All twos — every step swaps with high and mid never advances, so the array is traversed once from the right.",
    "All ones — mid advances every step with no swaps at all, which is the minimum-work case.",
    "Already sorted input — still performs the full traversal, since the algorithm has no early exit.",
    "Reverse sorted input, such as [2,2,1,0,0] — the maximum number of swaps.",
    "An array with no 1s at all — the settled 1s region stays empty and low tracks mid exactly.",
    "An array of exactly 16,384 elements — 64 KB, the largest size measured where the one-pass algorithm still beats counting.",
    "An array of 65,536 elements or more — beyond L1, where the one-pass algorithm measured 2.66x slower and worsening.",
  ],

  pitfalls: [
    "Advancing mid after swapping with high. The incoming value comes from the unexamined region — measured 18,640 failures out of 29,524 arrays, 63.14%, with [1,2,0] becoming [1,0,2].",
    "Writing the loop as while (mid < high), which leaves the element at mid == high unexamined. Measured 31.60% wrong, with [1,0] returned unchanged.",
    "Forgetting to advance low as well as mid on the 0 case, which lets the settled 0s region fall out of step with the pointer that defines it.",
    "Swapping with high but forgetting to decrement it, which loops forever on any input containing a 2.",
    "Assuming one pass means less work. The Dutch National Flag performs 2.00n writes against the counting sort's 1.00n, measured at a million elements.",
    "Assuming one pass means faster. Measured 3.4x slower than counting above the L1 cache boundary, and slower than std::sort as well.",
    "Reaching for the Dutch National Flag on very large arrays. Below about 16,000 elements it is the fastest option; above that it is the slowest of the three.",
    "Using it when the values are not exactly 0, 1 and 2. The algorithm is a three-way partition and needs a defined ordering of exactly three classes.",
    "Writing the counting version but forgetting that it needs a second pass over the array, then claiming O(1) passes.",
    "Using stable_partition in the two-pass partitioning variant, which costs extra memory to preserve an order that is meaningless among identical values.",
    "Returning a new array rather than sorting in place, which the problem forbids.",
    "Benchmarking only on small arrays, where the one-pass algorithm wins, and concluding it wins everywhere.",
  ],

  commonDoubts: [
    {
      question: "Why doesn't mid advance when the element is a 2?",
      answer:
        "Because the value swapped in from the high end has never been looked at. The regions are defined so that everything in [low, mid-1] is a 1 — so when a 0 swaps with low, the value coming back is a known 1 and mid can safely move past it. The high end is different: [mid, high] is the unknown region, so the value arriving from high is unclassified and must be inspected in the same slot. Measured over every array of 0s, 1s and 2s up to length 9, advancing mid there produced 18,640 wrong answers out of 29,524 — 63.14% — with [1,2,0] coming out as [1,0,2].",
    },
    {
      question: "Why is the loop condition mid <= high and not mid < high?",
      answer:
        "Because when mid and high are equal there is still exactly one unexamined element sitting at that index. The unknown region is [mid, high] inclusive, so it is empty only once mid has passed high. Writing mid < high exits one step early and leaves that element wherever it happened to be. The smallest failure is two elements: [1,0] is returned completely unchanged. Measured, that off-by-one produced 9,330 wrong answers out of 29,524 — 31.60%.",
    },
    {
      question: "How do I remember the three rules?",
      answer:
        "Derive them from the invariant rather than memorising them. The array is always four regions: settled 0s below low, settled 1s from low to mid-1, unknown from mid to high, and settled 2s above high. Then each rule is forced. A 0 belongs at the 0s boundary, so it swaps to low and both pointers advance. A 1 is already in the right region, so only mid advances. A 2 belongs at the 2s boundary, so it swaps to high and high shrinks — and mid stays because the incoming value is from the unknown region. If you can state the four regions, you can reconstruct the algorithm.",
    },
    {
      question: "Isn't one pass always better than two?",
      answer:
        "No, and this problem is the clearest counterexample in the module. 'One pass' counts traversals, not work. The Dutch National Flag performs 2.00n writes — measured 1,997,484 at a million elements — because each swap is three writes and it does roughly 2n/3 of them. The counting sort performs exactly 1.00n writes, since it writes each cell once. On top of that, counting's two passes are strictly sequential and the one pass is not, which matters more than either count.",
    },
    {
      question: "Why does the Dutch National Flag get slower on large arrays?",
      answer:
        "Because it works from both ends of the array at once, so its working set is the entire array rather than a sliding region. Measured per element: 0.769 nanoseconds at n = 16,384 and 3.330 at n = 65,536 — a 4.3x jump. This machine's L1 data cache is 128 KB; at 16,384 ints the array is 64 KB and fits, and at 65,536 ints it is 256 KB and does not. The jump lands exactly on that boundary. Counting sort measured flat at about 1.23 nanoseconds per element across the whole range from a thousand to four million, because two sequential passes are streamed by the prefetcher at any size. That flat line is the evidence the explanation is about memory rather than instruction count.",
    },
    {
      question: "So which one should I actually write?",
      answer:
        "In an interview, the Dutch National Flag — it is what the question is testing, it is one pass and O(1) space, and the invariant reasoning is the point. In production, it depends on size: below roughly sixteen thousand elements it measured fastest at 0.77 nanoseconds each, and above that the counting sort is 2.7x to 3.4x faster and its advantage only grows. At ten million elements the ordering is counting 12.43ms, std::sort 29.88ms, Dutch National Flag 41.10ms — the specialised one-pass algorithm losing to the general-purpose sort it was meant to improve on.",
    },
    {
      question: "Can I use this for more than three values?",
      answer:
        "The Dutch National Flag specifically handles three, because it maintains exactly three boundaries. Extending it to four or more means more pointers and considerably more case analysis, and it stops being clean quickly. The counting approach generalises immediately: k distinct values means k counters and the same two passes, which is counting sort proper. That is one more reason to prefer counting when the problem is really about bucketing rather than about demonstrating the partition.",
    },
    {
      question: "Does the three-way partition show up anywhere else?",
      answer:
        "Yes, and it is the main reason the algorithm is worth knowing beyond this problem. It is exactly the partition step of three-way quicksort, which groups elements into less-than, equal-to and greater-than a pivot. That variant is what makes quicksort efficient on arrays with many duplicate keys, where a standard two-way partition degrades badly. Recognising this problem as that partition with the pivot fixed at 1 is the transferable insight.",
    },
    {
      question: "Why does std::sort beat the Dutch National Flag at scale?",
      answer:
        "Because O(n log n) with excellent memory behaviour beats O(n) with poor memory behaviour once the array is large enough. Measured at ten million elements: std::sort 29.88ms against the Dutch National Flag's 41.10ms. Introsort works on contiguous sub-ranges that fit in cache and its inner loops are highly optimised, while the Dutch National Flag keeps the entire array live and stalls on memory. The log factor is genuinely there and is simply smaller than the constant-factor penalty it is competing against at this size.",
    },
  ],

  relatedIds: ["move-zeros-to-end", "remove-duplicates-from-sorted-array", "sorting", "rearrange-array-elements-by-sign"],
};

export default content;
