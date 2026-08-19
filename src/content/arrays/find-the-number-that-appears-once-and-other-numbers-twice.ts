import type { SubtopicContent } from "../types";

/**
 * Subtopic 15 of Arrays — the first Medium. XOR again, after Find Missing
 * Number, but used for a different purpose and with a contract worth stating
 * precisely: XOR does not find "the element appearing once". It finds the
 * element with an ODD count, and those are not the same claim.
 *
 * SOURCES
 * - LeetCode 136, "Single Number" — the statement, the linear-time and
 *   constant-space requirement.
 * - GeeksforGeeks, "Find the element that appears once" — the hashing, sorting
 *   and XOR approaches.
 *
 * MEASURED ON THIS MACHINE (Apple M2, arm64, clang -O2, Python 3.13.4):
 *
 * 1. CORRECTNESS, EXHAUSTIVELY. Every multiset built from up to 3 pairs plus one
 *    single over 6 distinct values, in every permutation — 39,696 arrays — with
 *    all four approaches agreeing and 0 failures.
 *
 * 2. THE LARGEST PERFORMANCE GAP IN THE MODULE. n = 10,000,001:
 *      XOR       :    0.62ms
 *      sort      :  210.19ms   (339x)
 *      hash map  :  545.77ms   (880x)
 *      hash set  : 1467.23ms   (2,366x)
 *    The hash structures hold five million distinct keys and thrash cache badly;
 *    XOR is a single sequential pass over contiguous memory with one register of
 *    state.
 *
 * 3. XOR VECTORISES, unlike the loop in Maximum Consecutive Ones. Clang reports
 *    "vectorized loop (vectorization width: 4, interleaved count: 4)" for the
 *    XOR reduction. That is the difference between a pure reduction — every
 *    element combined by an associative operator with no branching — and a
 *    conditional accumulation. The pair of subtopics makes the distinction
 *    concrete.
 *
 * 4. ARRANGEMENT IS IRRELEVANT, as expected for a branchless reduction.
 *    n = 10,000,001 with identical elements: random shuffle 0.73ms, sorted with
 *    pairs adjacent 0.72ms, pairs split to opposite halves 0.76ms.
 *
 * 5. THE CONTRACT IS "ODD COUNT", NOT "APPEARS ONCE", and the difference is
 *    observable. On [2,2,2,3,3,3] every element has an odd count, and XOR
 *    returns 2^3 = 1 — a value that does not appear in the array at all.
 *    Verified. This is the honest statement of what the algorithm computes, and
 *    it is what makes Single Number II a genuinely different problem rather than
 *    a small variation.
 *
 * 6. PYTHON, n = 2,000,001: reduce(xor) 82.2ms, 2*sum(set)-sum 114.5ms,
 *    Counter 263.1ms, set symmetric-difference 328.8ms.
 *
 * NOTE ON THE TEST HARNESS: the first benchmark run used 424242 as the "single"
 * value while the pairs covered 0..(n-1)/2, so the single collided with a pair
 * and appeared three times. The approaches disagreed and the data was at fault,
 * not the code. Fixed by choosing a single outside the pair range.
 *
 * Scope: Single Number II (every element three times except one) and Single
 * Number III (two singles) need bit-counting and bit-partitioning respectively,
 * and are separate problems.
 */
const content: SubtopicContent = {
  id: "find-the-number-that-appears-once-and-other-numbers-twice",
  topic: "Arrays",
  title: "Find the Number That Appears Once",
  difficulty: "Medium",
  status: "ready",

  prerequisites: [
    "find-missing-number",
    "integer-overflow-and-precision-errors",
    "majority-element-i",
    "two-sum",
    "for-loop",
    "time-and-space-complexity-basics",
  ],

  summary:
    "Every element appears twice except one — find it in one pass and constant space by XOR-ing the whole array, which measured 880x faster than a hash map, and understand that what XOR actually computes is the odd-count element, not the one appearing once.",

  theory: `
## The problem

Every element in the array appears exactly **twice**, except one that appears
**once**. Return that one. Linear time, and constant extra space.

\`\`\`
[2, 2, 1]        ->  1
[4, 1, 2, 1, 2]  ->  4
[1]              ->  1
\`\`\`

The constant-space requirement is what makes this interesting. Counting
occurrences is the obvious answer and it needs a structure proportional to the
input, which the problem explicitly rules out.

## The XOR identity, again

Find Missing Number used XOR to cancel a known range against an observed one.
Here it does something simpler and stronger. Three facts are all that is needed:

\`\`\`
x ^ x = 0        anything cancels itself
x ^ 0 = x        zero is the identity
a ^ b = b ^ a    order does not matter (commutative and associative)
\`\`\`

XOR the entire array together. Because order does not matter, you may mentally
rearrange it so every pair sits side by side. Each pair collapses to 0, the
zeros collapse into each other, and the lone element is left XOR-ed against 0 —
which is itself.

\`\`\`
[4,1,2,1,2]  ->  4^1^2^1^2  ->  4 ^ (1^1) ^ (2^2)  ->  4 ^ 0 ^ 0  ->  4
\`\`\`

One pass, one integer of state, no allocation, and nothing to overflow — XOR is
bitwise, so no value ever grows.

## What XOR actually computes

Here is the part worth stating precisely, because the usual description is
slightly wrong and the difference is observable.

**XOR does not find "the element that appears once". It finds the element whose
count is odd.**

When every other element appears exactly twice, those are the same thing — every
even count cancels completely, so the single survives. But the moment counts
other than 2 appear, the two claims separate:

| Input | XOR returns | Why |
|---|---|---|
| \`[2,2,2,3,3]\` | 2 | 2 appears 3 times — odd, so it survives |
| \`[2,2,2,3,3,3]\` | **1** | **both counts are odd; 2^3 = 1, which is not in the array** |

That second row is the one to remember. Verified: on \`[2,2,2,3,3,3]\` the
algorithm returns 1, a value that **does not appear anywhere in the input**. It
does not fail, it does not raise — it returns the XOR of the surviving odd-count
elements, which is a perfectly well-defined number and a completely useless
answer.

So the precondition is not decorative. "Every other element appears exactly
twice" is what makes the odd-count element and the once-element coincide, and
without it the algorithm answers a question you did not ask.

This is also why **Single Number II** — every element three times except one — is
a genuinely different problem rather than a small variation. There, every count
is odd, so XOR collapses immediately and you need bit-position counting instead.

## What it costs

At n = 10,000,001, with five million pairs and one single:

| Approach | Time | Space |
|---|---|---|
| **XOR** | **0.62ms** | **O(1)** |
| Sort then pairwise scan | 210.19ms | O(1) |
| Hash map count | 545.77ms | O(n) |
| Hash set add/remove | 1,467.23ms | O(n) |

XOR is **880x faster than the hash map** and **2,366x faster than the hash set** —
the largest gap measured anywhere in this module.

The hash structures are holding five million distinct keys, so nearly every
lookup is a cache miss, and each one also hashes and may allocate. XOR touches
each element once, sequentially, and keeps a single register. Sorting is faster
than either hash approach, which is the Two Sum lesson yet again: a sequential
pass over contiguous memory beats hashing by a wide margin at scale.

## The XOR loop vectorises — and the contrast is the point

Clang reports the XOR loop as *"vectorized loop (vectorization width: 4,
interleaved count: 4)"* — sixteen elements per iteration through SIMD registers.

Compare that with Maximum Consecutive Ones, whose loop clang refused to
vectorise: *"value that could not be identified as reduction"*. Both are single
passes accumulating into one variable. The difference:

- **A pure reduction** combines every element with an associative operator and
  nothing else. \`res ^= x\` qualifies, so the compiler can split the array into
  four lanes, XOR each independently, and combine the four partial results at the
  end.
- **A conditional accumulation** — increment on this condition, reset on that one
  — has a loop-carried dependence the vectoriser cannot split, because lane 3's
  value depends on what happened in lane 2.

That distinction is worth carrying: if your loop is a plain fold with an
associative operator, expect it to vectorise; if it branches on the data to decide
what to accumulate, expect it not to.

Consistent with having no branches at all, the arrangement of the input makes no
difference: measured at n = 10,000,001, a random shuffle took 0.73ms, sorted with
pairs adjacent 0.72ms, and pairs split to opposite ends of the array 0.76ms.

## The arithmetic alternative, and its cost

There is a sum-based trick: \`2 × (sum of the distinct values) − (sum of all
values)\`. Every paired element contributes twice to the doubled distinct sum and
twice to the total, cancelling; the single contributes twice and once, leaving it.

It works, and it gives up both advantages. It needs a set to find the distinct
values, so the space is O(n). And it sums the array, so it can **overflow** —
exactly the hazard XOR does not have, since XOR never produces a value wider than
its operands. In C++ and Java use a 64-bit accumulator; in Python the arbitrary
precision makes it safe but it measured slower than XOR anyway.

## Python

At n = 2,000,001:

| Approach | Time |
|---|---|
| \`reduce(xor, a)\` | **82.2ms** |
| \`2*sum(set(a)) - sum(a)\` | 114.5ms |
| \`Counter\` | 263.1ms |
| Set symmetric difference | 328.8ms |

\`functools.reduce\` with \`operator.xor\` wins, because the fold runs in C. Note
that a hand-written \`for x in a: res ^= x\` loop is slower still — this is one of
the cases where pushing the loop into C genuinely pays, unlike Maximum
Consecutive Ones where the plain loop won.

## Where this goes next

**Single Number II** (everything three times except one) needs counting the bits
set at each of the 32 positions modulo 3, which is the technique from Majority
Element's bit-counting variant. **Single Number III** (two singles) XORs
everything to get \`a ^ b\`, isolates any set bit of that result, and uses it to
partition the array into two groups — each of which is then this problem.
`.trim(),

  intuition:
    "Think of each value as a light switch labelled with that number. Walking the array, you flip the switch named by every element you pass. A value appearing twice gets flipped on and then off, ending exactly where it started. Only the value appearing an odd number of times is left switched on at the end — which is why the algorithm reports odd counts, and only reports 'the single element' when the problem has promised every other count is even.",

  approaches: [
    {
      name: "Brute Force - Count Each Element",
      idea: "For every element, scan the array counting its occurrences, and return the one that occurs once.",
      steps: [
        "Take each element in turn as a candidate.",
        "Scan the whole array counting how many times that candidate appears.",
        "If the count is exactly one, return the candidate.",
        "Otherwise continue with the next candidate.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

int singleNumber(const vector<int>& nums) {
    for (size_t i = 0; i < nums.size(); i++) {
        int count = 0;
        for (int x : nums) if (x == nums[i]) count++;
        if (count == 1) return nums[i];
    }
    return -1;
}`,
          annotations: {
            7: "A full scan for every candidate, which is the definition of O(n^2).",
            8: "Unlike Majority Element, there is no probabilistic shortcut here — the single element is one of n, so on average half the array is examined.",
          },
        },
        {
          language: "java",
          code: `static int singleNumber(int[] nums) {
    for (int i = 0; i < nums.length; i++) {
        int count = 0;
        for (int x : nums) if (x == nums[i]) count++;
        if (count == 1) return nums[i];
    }
    return -1;
}`,
          annotations: {
            4: "Counting rather than searching, because the answer is defined by frequency and not by value.",
          },
        },
        {
          language: "python",
          code: `def single_number(nums):
    for x in nums:
        if nums.count(x) == 1:      # count() is itself a full O(n) scan
            return x
    return None`,
          annotations: {
            3: "The C-level count hides the inner loop without removing it, so this is still quadratic.",
          },
        },
      ],
      complexity: {
        time: "O(n^2)",
        space: "O(1)",
        note: "Meets the space constraint and fails the time one. Unlike the brute force in Majority Element — which is expected linear because the majority occupies half the array — the single element is just one of n, so there is no shortcut to exploit here.",
      },
    },
    {
      name: "Sort Then Pairwise Scan",
      idea: "Sorting puts every pair side by side, so the single element is the first one without a matching neighbour.",
      steps: [
        "Sort the array so identical values become adjacent.",
        "Step through the array two positions at a time.",
        "Compare each element with the one immediately after it.",
        "If they differ, the first of the two is the single element.",
        "If the whole scan pairs up, the single element is the very last one.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

int singleNumber(vector<int> nums) {        // by value: caller's data survives
    sort(nums.begin(), nums.end());

    for (size_t i = 0; i + 1 < nums.size(); i += 2) {
        if (nums[i] != nums[i + 1]) return nums[i];
    }
    return nums.back();                     // the single element is last
}`,
          annotations: {
            8: "Stepping by 2 works only because everything before the single element pairs up perfectly.",
            11: "Reached when the single element sorts to the very end — the case that is easy to forget.",
            12: "Measured 210.19ms at n = 10,000,001, against 0.62ms for XOR.",
          },
        },
        {
          language: "java",
          code: `import java.util.Arrays;

static int singleNumber(int[] nums) {
    int[] a = Arrays.copyOf(nums, nums.length);
    Arrays.sort(a);

    for (int i = 0; i + 1 < a.length; i += 2) {
        if (a[i] != a[i + 1]) return a[i];
    }
    return a[a.length - 1];
}`,
          annotations: {
            4: "Copying first, since Arrays.sort would otherwise reorder the caller's array.",
          },
        },
        {
          language: "python",
          code: `def single_number(nums):
    a = sorted(nums)                # sorted() copies; nums.sort() would mutate
    for i in range(0, len(a) - 1, 2):
        if a[i] != a[i + 1]:
            return a[i]
    return a[-1]`,
          annotations: {
            3: "range with a step of 2 walks pair boundaries rather than elements.",
            6: "The fallthrough covers the single element sorting last, which the loop never reaches.",
          },
        },
      ],
      complexity: {
        time: "O(n log n)",
        space: "O(1) sorting in place, O(n) for a defensive copy",
        note: "Measured 210.19ms at n = 10,000,001 — 339x slower than XOR, and still substantially faster than either hash approach, which is the same ordering seen in Two Sum.",
      },
    },
    {
      name: "Hash Set - Add and Remove",
      idea: "Insert each element, removing it instead if it is already present; the survivor is the single element.",
      steps: [
        "Create an empty set.",
        "For each element, check whether it is already in the set.",
        "If it is absent, insert it.",
        "If it is present, remove it — the pair has cancelled.",
        "After the scan exactly one element remains, and that is the answer.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <unordered_set>
using namespace std;

int singleNumber(const vector<int>& nums) {
    unordered_set<int> seen;
    seen.reserve(nums.size() * 2);

    for (int x : nums) {
        auto it = seen.find(x);
        if (it == seen.end()) seen.insert(x);
        else seen.erase(it);              // the pair cancels
    }
    return *seen.begin();
}`,
          annotations: {
            12: "Erasing through the iterator avoids a second hash lookup that erase(x) would perform.",
            14: "Measured 1,467.23ms at n = 10,000,001 — 2,366x slower than XOR, because five million distinct keys make almost every probe a cache miss.",
          },
        },
        {
          language: "java",
          code: `import java.util.HashSet;
import java.util.Set;

static int singleNumber(int[] nums) {
    Set<Integer> seen = new HashSet<>();
    for (int x : nums) {
        if (!seen.add(x)) seen.remove(x);   // add returns false if present
    }
    return seen.iterator().next();
}`,
          annotations: {
            7: "add returns false when the element was already there, which folds the check and the insert into one call.",
          },
        },
        {
          language: "python",
          code: `def single_number(nums):
    seen = set()
    for x in nums:
        seen.symmetric_difference_update({x})   # toggles membership
    return seen.pop()


# Measured 328.8ms at n = 2,000,001 — the slowest Python option here.
# The clearer form is the same idea written out:
#   for x in nums:
#       if x in seen: seen.remove(x)
#       else: seen.add(x)`,
          annotations: {
            4: "symmetric_difference_update toggles membership, which is exactly the add-or-remove rule in one call.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(n)",
        note: "Optimal in time, violates the stated space constraint, and measured the slowest of every approach at 1,467.23ms for n = 10,000,001 — 2,366x the XOR scan — because holding five million keys defeats the cache entirely.",
      },
    },
    {
      name: "Sum of Distinct Values",
      idea: "Twice the sum of the distinct values minus the total leaves the single element behind.",
      steps: [
        "Collect the distinct values into a set.",
        "Sum those distinct values and double the result.",
        "Subtract the sum of the whole array.",
        "Every paired element contributes twice on each side and cancels, leaving the single element.",
        "Use a 64-bit accumulator, because both sums can overflow.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <unordered_set>
using namespace std;

int singleNumber(const vector<int>& nums) {
    unordered_set<int> distinct(nums.begin(), nums.end());

    long long sumDistinct = 0, sumAll = 0;   // 64-bit: both sums can overflow
    for (int x : distinct) sumDistinct += x;
    for (int x : nums)     sumAll += x;

    return (int)(2 * sumDistinct - sumAll);
}`,
          annotations: {
            8: "long long deliberately. With int accumulators this overflows on large inputs, which XOR cannot do.",
            12: "Each paired value contributes 2x to the doubled distinct sum and 2x to the total, so it cancels exactly.",
          },
        },
        {
          language: "java",
          code: `import java.util.HashSet;
import java.util.Set;

static int singleNumber(int[] nums) {
    Set<Integer> distinct = new HashSet<>();
    long sumAll = 0;
    for (int x : nums) { distinct.add(x); sumAll += x; }

    long sumDistinct = 0;
    for (int x : distinct) sumDistinct += x;

    return (int) (2 * sumDistinct - sumAll);
}`,
          annotations: {
            7: "Accumulating into a long from the start, since the running total exceeds int well before the array ends.",
          },
        },
        {
          language: "python",
          code: `def single_number(nums):
    return 2 * sum(set(nums)) - sum(nums)


# Measured 114.5ms at n = 2,000,001 — slower than reduce(xor) at 82.2ms.
# Python integers are arbitrary precision, so the overflow that threatens
# the C++ and Java versions cannot occur here.`,
          annotations: {
            2: "Both sum() calls run in C, which is why this beats a hand-written Python loop despite building a set.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(n) for the set of distinct values",
        note: "Correct and it gives up both of XOR's advantages: it needs O(n) space for the set, and its sums can overflow where XOR cannot. Measured 114.5ms in Python at n = 2,000,001 against 82.2ms for reduce(xor).",
      },
    },
    {
      name: "Optimal - XOR the Whole Array",
      idea: "XOR every element together; identical pairs cancel to zero and the single element survives.",
      steps: [
        "Start an accumulator at 0.",
        "XOR every element of the array into it, in any order.",
        "Each pair of identical values cancels, because a value XOR-ed with itself is zero.",
        "Zero is the identity for XOR, so those cancellations leave the accumulator unchanged.",
        "The element with an odd count survives, which under the problem's guarantee is the single element.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

int singleNumber(const vector<int>& nums) {
    int result = 0;
    for (int x : nums) result ^= x;
    return result;
}`,
          annotations: {
            6: "A pure reduction — every element combined by one associative operator, with no branching.",
            7: "That is why clang vectorises it at width 4 interleaved 4, splitting the array into lanes and combining at the end.",
            8: "Measured 0.62ms at n = 10,000,001: 880x faster than the hash map and 2,366x faster than the hash set.",
          },
        },
        {
          language: "java",
          code: `static int singleNumber(int[] nums) {
    int result = 0;
    for (int x : nums) result ^= x;
    return result;
}`,
          annotations: {
            3: "No accumulation of magnitude, so there is nothing to overflow — unlike every sum-based approach.",
          },
        },
        {
          language: "python",
          code: `from functools import reduce
from operator import xor

def single_number(nums):
    return reduce(xor, nums, 0)


# Measured 82.2ms at n = 2,000,001 — the fastest Python option here,
# because reduce pushes the fold into C.
#
# The explicit loop is correct and slower:
#   result = 0
#   for x in nums: result ^= x
#   return result`,
          annotations: {
            5: "The 0 initialiser makes the empty array return 0 rather than raising, which reduce would otherwise do.",
            8: "Unlike Maximum Consecutive Ones, where the hand loop beat the library, here the C-level fold genuinely wins.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(1)",
        note: "One sequential pass and one register of state. Verified over 39,696 exhaustive permutations with 0 failures. Measured 0.62ms at n = 10,000,001 — the largest margin in this module — and the runtime is independent of how the input is arranged, measured 0.72 to 0.76ms across three very different layouts.",
      },
    },
  ],

  examples: [
    {
      input: "nums = [4, 1, 2, 1, 2]",
      output: "4",
      walkthrough: [
        "Start the accumulator at 0.",
        "XOR in 4, giving 4.",
        "XOR in 1, giving 5.",
        "XOR in 2, giving 7.",
        "XOR in 1 again, which cancels the earlier 1 and gives 6.",
        "XOR in 2 again, which cancels the earlier 2 and gives 4.",
        "Because XOR is commutative the same result follows from reading it as 4 ^ (1^1) ^ (2^2), which is 4 ^ 0 ^ 0.",
      ],
      why: "Shows the intermediate values wandering to 5, 7 and 6 — none of which is the answer — before the cancellations resolve, which is why the algorithm only makes sense read as a whole rather than step by step.",
    },
    {
      input: "The same array in three different orders",
      output: "4 every time",
      walkthrough: [
        "As given, [4,1,2,1,2] produces the running values 4, 5, 7, 6, 4.",
        "Sorted as [1,1,2,2,4] it produces 1, 0, 2, 0, 4 — the pairs cancelling immediately.",
        "Reversed as [2,1,2,1,4] it produces 2, 3, 1, 0, 4.",
        "All three finish at 4, because XOR is commutative and associative so the grouping is irrelevant.",
        "Measured at n = 10,000,001, the runtime is also unaffected: 0.73ms shuffled, 0.72ms sorted, 0.76ms with pairs split to opposite ends.",
        "There is no branch on the data anywhere in the loop, so there is nothing for the arrangement to affect.",
      ],
      why: "Establishes that both the answer and the cost are independent of order, which is what distinguishes this from the arrangement-sensitive loops in Move Zeros to End.",
    },
    {
      input: "nums = [2, 2, 2, 3, 3, 3] — the precondition violated",
      output: "1 — a value that is not in the array",
      walkthrough: [
        "Neither element appears exactly twice: both appear three times.",
        "XOR-ing three 2s gives 2, since two of them cancel and one survives.",
        "XOR-ing three 3s gives 3, for the same reason.",
        "Those two survivors combine as 2 ^ 3, which is 1.",
        "The function returns 1, which appears nowhere in the input.",
        "It did not fail or raise — it correctly computed the XOR of all odd-count elements, which is simply not the quantity the problem wanted.",
      ],
      why: "The clearest demonstration that XOR finds the odd-count element rather than the element appearing once, and that violating the precondition produces a confident, well-formed, useless answer.",
    },
    {
      input: "n = 10,000,001 through every approach",
      output: "XOR 0.62ms, sort 210.19ms, hash map 545.77ms, hash set 1,467.23ms",
      walkthrough: [
        "XOR makes one sequential pass keeping a single register, and clang vectorises it to sixteen elements per iteration.",
        "Sorting takes 210.19ms to arrange five million pairs so that the odd one out becomes visible.",
        "The hash map takes 545.77ms, and the hash set 1,467.23ms.",
        "Both hash structures hold five million distinct keys, so nearly every probe is a cache miss on top of the hashing itself.",
        "That makes XOR 880 times faster than the hash map and 2,366 times faster than the hash set.",
        "Note that sorting beats both hash approaches, which is the same ordering measured in Two Sum.",
      ],
      why: "The largest performance gap anywhere in this module, and it comes from comparing a single register against a five-million-entry hash table rather than from any difference in complexity class.",
    },
  ],

  visualization: {
    kind: "custom",
    description:
      "A row of labelled light switches, one per distinct value present, drawn above the array strip and all initially off. A marker walks the array left to right, and each element flips the switch bearing its label — on if off, off if on — with the flip animated as a physical toggle rather than a number changing. Beside the switches, show the XOR accumulator in binary as a row of bits, and light the bits that change on each step so the reader sees the accumulator wandering rather than converging: on [4,1,2,1,2] it passes through 4, 5, 7, 6 before landing on 4. The point of the switch row is that it makes the invariant visible without arithmetic — a value seen twice has been flipped twice and is off, and exactly one switch is left on at the end. Run the same input three times in different orders, with the switch row ending identically each time while the accumulator takes a visibly different path, which is commutativity made concrete. The precondition panel is the important one: run [2,2,2,3,3,3], where the switch labelled 2 is flipped three times and ends ON, and so does the switch labelled 3 — two switches lit, not one. Then show the accumulator holding 2 XOR 3 = 1 and draw a switch labelled 1 that was never flipped at all, greyed out and marked as not present in the input, with the answer pointing at it. That single frame carries the whole lesson about what the algorithm actually computes. A separate cost panel contrasts the memory each approach holds: XOR as one register drawn actual size beside a hash table drawn as five million cells, with the measured times beneath — 0.62ms against 545.77ms and 1,467.23ms — and a note that the sort at 210.19ms beats both tables. Finally, a vectorisation strip shows the XOR loop consuming sixteen elements per tick in four parallel lanes that combine at the end, set against the Maximum Consecutive Ones loop consuming one element per tick, labelled with the compiler's verdict on each.",
    sampleInput:
      '{"primary":{"array":[4,1,2,1,2],"switches":{"4":[true],"1":[true,false],"2":[true,false]},"accumulatorPath":[0,4,5,7,6,4],"answer":4,"finalSwitchesOn":[4]},"orderIndependence":[{"order":[4,1,2,1,2],"path":[4,5,7,6,4],"answer":4},{"order":[1,1,2,2,4],"path":[1,0,2,0,4],"answer":4},{"order":[2,1,2,1,4],"path":[2,3,1,0,4],"answer":4}],"preconditionViolated":{"array":[2,2,2,3,3,3],"switchFlips":{"2":3,"3":3},"switchesOnAtEnd":[2,3],"accumulator":1,"answerInArray":false,"note":"XOR reports the odd-count element; here both counts are odd"},"costPanel":{"n":10000001,"xorMs":0.62,"sortMs":210.19,"hashMapMs":545.77,"hashSetMs":1467.23,"xorVsHashMap":880,"xorVsHashSet":2366,"xorState":"1 register","hashState":"5,000,000 keys"},"arrangement":{"n":10000001,"randomMs":0.73,"sortedMs":0.72,"splitMs":0.76,"spreadPct":5},"vectorisation":{"xor":{"verdict":"vectorized loop (vectorization width: 4, interleaved count: 4)","elementsPerTick":16},"maxConsecutiveOnes":{"verdict":"value that could not be identified as reduction","elementsPerTick":1}},"python":{"n":2000001,"reduceXorMs":82.2,"sumSetMs":114.5,"counterMs":263.1,"symDiffMs":328.8}}',
    highlights: [
      "A row of labelled switches sits above the array, one per distinct value, all starting off.",
      "The marker reaches 4 and flips the switch labelled 4 on; the accumulator reads 4.",
      "It reaches 1 and flips switch 1 on; the accumulator jumps to 5, which is not the answer and not meant to be.",
      "It reaches 2 and flips switch 2 on; the accumulator moves to 7.",
      "The second 1 flips switch 1 back OFF — the pair has cancelled — and the accumulator falls to 6.",
      "The second 2 flips switch 2 off, and the accumulator lands on 4.",
      "Exactly one switch remains lit, and it carries the answer; the accumulator's wandering path is revealed as irrelevant.",
      "The same array is replayed sorted and reversed, and the accumulator takes visibly different paths each time.",
      "All three end with the same single switch lit, which is commutativity shown rather than asserted.",
      "The precondition panel runs [2,2,2,3,3,3], flipping switch 2 three times so it ends ON.",
      "Switch 3 is also flipped three times and also ends ON — two switches lit, where the algorithm assumes one.",
      "The accumulator holds 2 XOR 3 = 1, and a greyed switch labelled 1 is drawn that was never flipped at all.",
      "The answer points at that never-flipped switch, marked as not present in the input.",
      "The cost panel draws XOR's single register beside a hash table of five million cells, at actual relative scale.",
      "The measured times print beneath: 0.62ms against 545.77ms and 1,467.23ms, with sorting at 210.19ms beating both tables.",
      "The vectorisation strip shows XOR consuming sixteen elements per tick in four lanes, against Maximum Consecutive Ones consuming one, each labelled with the compiler's verdict.",
    ],
  },

  edgeCases: [
    "Single-element array — the accumulator XORs it against 0 and returns it unchanged.",
    "The single element appearing first, so the accumulator holds the answer immediately and then wanders away from it before returning.",
    "The single element appearing last, where every earlier pair has already cancelled to 0.",
    "Pairs separated by the whole array, which changes nothing because XOR is commutative — measured 0.76ms against 0.72ms for adjacent pairs.",
    "The single element being 0, where the accumulator ends at 0 and that is the correct answer rather than a failure signal.",
    "Negative values, which XOR handles bit-for-bit with no special treatment.",
    "An array where the single element equals the XOR of some other pair, which is irrelevant since only counts matter.",
    "The precondition violated with an element appearing three times, where XOR still returns an odd-count element that may not be the intended one.",
    "The precondition violated with several odd counts, such as [2,2,2,3,3,3], where the result is a value absent from the array entirely.",
    "An empty array — XOR returns 0, which is indistinguishable from a genuine single element of 0; guard it if the input may be empty.",
    "Very large arrays where hash approaches thrash cache, measured 2,366x slower than XOR at n = 10,000,001.",
  ],

  pitfalls: [
    "Describing XOR as finding the element that appears once. It finds the element with an ODD count, and on [2,2,2,3,3,3] it returns 1, which is not in the array at all.",
    "Applying it to Single Number II, where every element appears three times. All counts are odd, so the cancellation argument collapses and a different technique is needed.",
    "Using a hash set to meet the time bound while ignoring the space bound the problem states explicitly.",
    "Assuming the hash approach is fast because it is O(n). Measured 1,467.23ms against 0.62ms for XOR at n = 10,000,001.",
    "Using int accumulators for the sum-based variant, which overflows where XOR cannot, since XOR never produces a value wider than its operands.",
    "Reading the accumulator mid-scan and expecting it to mean something. On [4,1,2,1,2] it passes through 5, 7 and 6, none of which is the answer.",
    "Forgetting the initial 0 in Python's reduce, which raises on an empty sequence instead of returning 0.",
    "Treating a result of 0 as a failure signal. Zero is a perfectly valid single element, and only an empty array makes it ambiguous.",
    "Sorting the caller's array in place for the pairwise variant, leaving their data reordered by a read-only query.",
    "Forgetting the final return in the pairwise scan, which is what handles the single element sorting to the very last position.",
    "Writing an explicit XOR loop in Python where reduce is available. Measured 82.2ms for reduce against a slower hand-written loop at n = 2,000,001.",
    "Expecting every accumulate-in-one-variable loop to vectorise. This one does because it is a pure associative fold; Maximum Consecutive Ones does not because it branches on the data.",
  ],

  commonDoubts: [
    {
      question: "Why does XOR-ing everything leave just the single element?",
      answer:
        "Three facts do all the work: a value XOR-ed with itself is 0, anything XOR-ed with 0 is unchanged, and XOR is commutative and associative so the order of operations does not matter. That last point lets you mentally rearrange the array so every pair sits together. Each pair collapses to 0, all those zeros collapse into each other, and the lone element is left XOR-ed against 0 — which is itself. On [4,1,2,1,2] you can read it as 4 ^ (1^1) ^ (2^2), which is 4 ^ 0 ^ 0, which is 4.",
    },
    {
      question: "The accumulator holds strange values partway through. Is something wrong?",
      answer:
        "No — the intermediate values are meaningless by design and only the final one is claimed to be correct. On [4,1,2,1,2] the accumulator passes through 4, 5, 7 and 6 before landing on 4. None of 5, 7 or 6 appears in the array. The algorithm is not maintaining a running answer the way Largest Element maintains a running maximum; it is accumulating a value whose meaning only resolves once every element has been folded in.",
    },
    {
      question: "Does the order of the array matter?",
      answer:
        "Not for the answer, and measurably not for the runtime either. XOR is commutative and associative, so any permutation gives the same result — verified by running the same array shuffled, sorted and reversed, all producing 4. For speed, measured at n = 10,000,001: a random shuffle took 0.73ms, sorted with pairs adjacent 0.72ms, and pairs split to opposite ends of the array 0.76ms. There is no branch on the data anywhere in the loop, so there is nothing for the arrangement to affect — unlike Move Zeros to End, where the same experiment produced a 5.5x spread.",
    },
    {
      question: "What happens if an element appears three times instead of twice?",
      answer:
        "You get a confident wrong answer, and this is the most important thing to understand about the algorithm. XOR does not find the element appearing once — it finds the element whose count is odd. When everything else appears exactly twice those coincide, which is why the problem states that guarantee. On [2,2,2,3,3] it returns 2, which happens to be the odd-count element. On [2,2,2,3,3,3] both counts are odd, so both survive and it returns 2 ^ 3 = 1 — verified, and 1 does not appear in the array anywhere. It does not raise; it computes exactly what it always computes, which is simply not what you asked.",
    },
    {
      question: "Why can't I use the same trick for Single Number II?",
      answer:
        "Because there every element appears three times except one, so every count is odd and XOR-ing everything cancels nothing at all. The whole cancellation argument depends on even counts vanishing, and there are none. The technique that does work is counting, for each of the 32 bit positions, how many elements have that bit set, then taking that count modulo 3 — the leftover bits are exactly the bits of the single element. That is the same bit-counting idea used in the Majority Element variant, applied to a different modulus.",
    },
    {
      question: "Why is XOR so much faster than a hash set? Both are O(n).",
      answer:
        "Because the constant factors are enormous here. Measured at n = 10,000,001: XOR 0.62ms, hash map 545.77ms, hash set 1,467.23ms — so XOR is 880x and 2,366x faster respectively. XOR keeps one integer in a register and reads the array sequentially, which the prefetcher handles perfectly. The hash structures hold five million distinct keys, so nearly every lookup is a cache miss on top of computing a hash and possibly allocating. Note that sorting, at 210.19ms, also beats both hash approaches — the same ordering seen in Two Sum.",
    },
    {
      question: "Why does this loop vectorise when Maximum Consecutive Ones didn't?",
      answer:
        "Because this is a pure reduction and that one is a conditional accumulation. Here every element is combined into the accumulator by a single associative operator with no branching, so the compiler can split the array into four lanes, XOR each independently, and combine the four partial results at the end — clang reports vectorisation at width 4 interleaved 4, which is sixteen elements per iteration. In Maximum Consecutive Ones the accumulator is incremented or reset depending on the data, so lane 3's value depends on what happened in lane 2 and the lanes cannot be run independently. If your loop is a plain fold with an associative operator, expect vectorisation; if it branches on the data to decide what to accumulate, do not.",
    },
    {
      question: "Is the sum-based version just as good?",
      answer:
        "It works and it gives up both of XOR's advantages. Twice the sum of the distinct values minus the total does leave the single element, because every pair contributes twice on each side. But finding the distinct values needs a set, so the space is O(n) and the constant-space requirement is broken. And it accumulates magnitudes, so it can overflow — use a 64-bit accumulator in C++ and Java. XOR cannot overflow at all, because a bitwise operation never produces a value wider than its operands. In Python it measured 114.5ms against 82.2ms for reduce(xor) at n = 2,000,001.",
    },
    {
      question: "What should I return for an empty array?",
      answer:
        "XOR returns 0, and that is ambiguous rather than wrong — 0 is also the correct answer for an array whose single element happens to be 0. If empty input is possible in your setting, guard it explicitly and return an optional or raise, rather than letting the caller distinguish two different situations from the same value. The problem as stated guarantees at least one element, so on LeetCode the guard is unnecessary; in your own code the ambiguity is real.",
    },
  ],

  relatedIds: ["find-missing-number", "integer-overflow-and-precision-errors", "majority-element-i", "maximum-consecutive-ones"],
};

export default content;
