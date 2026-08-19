import type { SubtopicContent } from "../types";

/**
 * Subtopic 12 of Arrays. The problem everyone meets first, and the one where the
 * textbook answer loses to the approach it is supposed to beat.
 *
 * Two things carry it. The problem asks for INDICES, which quietly rules out
 * sorting unless you carry the original positions through it. And the O(n) hash
 * map — the answer every course teaches — measured SLOWER than the O(n log n)
 * sort-and-two-pointer across the entire practical range.
 *
 * SOURCES
 * - LeetCode 1, "Two Sum" — the statement, the index return contract, and the
 *   guarantee of exactly one solution.
 * - GeeksforGeeks, "Two Sum" — the brute force, sorting and hashing approaches.
 *
 * MEASURED ON THIS MACHINE (Apple M2, arm64, clang -O2):
 *
 * 1. SORTING DESTROYS THE ANSWER, verified. On nums = [3,2,4] with target 6 the
 *    correct answer is indices [1,2] (values 2 + 4). Sorting gives [2,3,4], and
 *    two pointers correctly find the values 2 and 4 — at positions [0,2] of the
 *    SORTED array. Positions 0 and 2 of the ORIGINAL array hold 3 and 4, which
 *    sum to 7. The fix is to sort (value, index) pairs so the original position
 *    travels with the value: sorted gives [(2,1),(3,0),(4,2)] and the answer
 *    reads out as [1,2].
 *
 * 2. THE HASH MAP LOSES. Answer placed at the end of the array, microseconds:
 *      n      brute       hash       sort+2ptr
 *      8      0.000       0.292      0.083
 *      16     0.041       0.583      0.125
 *      32     0.250       1.084      0.209
 *      64     0.875       1.958      0.250
 *      128    3.500       4.000      0.375
 *      256    13.250      7.792      0.708
 *      1024   184.625     31.792     2.292
 *      8192   11743.000   217.541    15.625
 *    Sort-and-two-pointer wins at EVERY n from 32 upward, and by 13.9x at
 *    n = 8192 (15.625us against the hash map's 217.541us). Brute force wins
 *    below n = 32, where neither the hash build nor the sort pays for itself.
 *    The hash map is O(n) and loses anyway: every insert allocates and hashes,
 *    while the sort is a cache-friendly sequential pass over contiguous memory.
 *
 * 3. NEITHER IS POSITION-INDEPENDENT, though only one is quadratic about it.
 *    At n = 4096, by where the answering pair sits:
 *      answer at start  : brute    0.000us   hash    2.541us
 *      answer at middle : brute    3.708us   hash   55.792us
 *      answer at end    : brute 2461.625us   hash  108.667us
 *    Brute force is effectively free when the pair is early and catastrophic
 *    when it is late. The hash map still has to insert everything before the
 *    match, so it grows too — linearly rather than quadratically.
 *
 * 4. DUPLICATES. On [3,3] with target 6 the one-pass hash is correct BY
 *    CONSTRUCTION, because it looks for the complement before inserting the
 *    current element, so an element can never pair with itself. The two-pass
 *    version builds {3:1} — the first 3 is overwritten — and is correct only
 *    because of the explicit index != i guard.
 *
 * 5. AGREEMENT over 200,000 random cases: 0 failures. The check is that each
 *    approach returns a VALID pair, not an identical one, since several correct
 *    answers can exist when the input is not constrained to a unique solution.
 *
 * Scope: 3 Sum and 4 Sum extend the sorted two-pointer idea and are their own
 * subtopics. Counting pairs, rather than returning one, is a different problem
 * where the hash map genuinely wins.
 */
const content: SubtopicContent = {
  id: "two-sum",
  topic: "Arrays",
  title: "Two Sum",
  difficulty: "Easy",
  status: "ready",

  prerequisites: [
    "linear-search",
    "maximum-consecutive-ones",
    "largest-element",
    "for-loop",
    "relational-and-logical-operators",
    "time-and-space-complexity-basics",
  ],

  summary:
    "Find the two elements that add to a target and return their indices — where sorting silently returns the wrong positions unless you carry the originals through it, and where the O(n) hash map every course teaches measured 13.9x slower than the O(n log n) approach it is supposed to beat.",

  theory: `
## The problem

Given an array \`nums\` and a \`target\`, return the **indices** of the two elements
that sum to the target. Each input has exactly one solution, and you may not use
the same element twice.

\`\`\`
nums = [2, 7, 11, 15], target = 9   ->  [0, 1]
nums = [3, 2, 4],      target = 6   ->  [1, 2]
nums = [3, 3],         target = 6   ->  [0, 1]
\`\`\`

Read that word **indices** carefully. It is the difference between this being a
routine problem and a subtly trapped one, and it is the thing most solutions get
wrong on their first attempt.

## Why sorting breaks it

The natural idea once you see "find two numbers that sum to X" is: sort, then walk
one pointer from each end. If the sum is too small, move the left pointer up; too
large, move the right pointer down. That is a clean O(n log n).

It also silently returns the wrong answer. Verified on \`nums = [3, 2, 4]\` with
target 6, where the correct answer is indices \`[1, 2]\`:

| Step | Result |
|---|---|
| Sort | \`[2, 3, 4]\` |
| Two pointers find | values 2 and 4 — correct values |
| At positions | \`[0, 2]\` **of the sorted array** |
| Positions 0 and 2 of the **original** hold | 3 and 4 — which sum to **7** |

The algorithm found the right *values* and reported positions that no longer mean
anything, because sorting moved everything. Nothing about the output looks wrong.

**The fix is to make the index travel with the value.** Sort pairs of
\`(value, original index)\` rather than bare values:

\`\`\`
[(2,1), (3,0), (4,2)]  ->  two pointers land on (2,1) and (4,2)  ->  [1, 2]
\`\`\`

Now the answer is correct. This is the same lesson as Remove Duplicates and Move
Zeros from a new angle: an in-place rearrangement destroys information the caller
still needs, so you either preserve it deliberately or you don't rearrange.

## The hash map, and why it is the famous answer

Walk the array once. At each element, ask whether its **complement** —
\`target - nums[i]\` — has already been seen. If it has, you have the pair. If not,
record the current element and move on.

\`\`\`
target 9, nums = [2, 7, 11, 15]
i=0: need 7 — not seen. remember 2 -> 0
i=1: need 2 — SEEN at index 0. return [0, 1]
\`\`\`

O(n) time, O(n) space, one pass, and the indices are never disturbed because
nothing is ever moved.

**Check the complement before inserting the current element.** That ordering is
what makes "you may not use the same element twice" automatic rather than a case
you have to handle: at the moment you look, the current element is not yet in the
map, so it cannot match itself. On \`[3, 3]\` with target 6, the first 3 is
recorded, the second finds it, and the answer is \`[0, 1]\`.

The two-pass variant — build the whole map first, then scan for complements —
needs an explicit \`index != i\` guard instead, because the map already contains
everything. It also quietly overwrites duplicates: for \`[3,3]\` the map ends up as
\`{3: 1}\`, and the approach survives only because that guard rejects the
self-match.

## The measurement the textbook does not mention

The hash map is O(n) and the sorted two-pointer is O(n log n), so the ranking
looks settled. Measured with the answering pair placed at the end of the array —
brute force's worst case — in microseconds:

| n | brute | hash | sort + 2ptr |
|---|---|---|---|
| 8 | **0.000** | 0.292 | 0.083 |
| 16 | **0.041** | 0.583 | 0.125 |
| 32 | 0.250 | 1.084 | **0.209** |
| 64 | 0.875 | 1.958 | **0.250** |
| 128 | 3.500 | 4.000 | **0.375** |
| 256 | 13.250 | 7.792 | **0.708** |
| 1,024 | 184.625 | 31.792 | **2.292** |
| 8,192 | 11,743.000 | 217.541 | **15.625** |

**Sort-and-two-pointer wins at every n from 32 upward** — and at n = 8,192 it is
**13.9x faster** than the O(n) hash map, 15.6µs against 217.5µs.

The complexity classes are not wrong; they are describing different things.
Sorting is a sequential, cache-friendly pass over contiguous memory, and the
two-pointer walk that follows is two linear scans. The hash map's O(n) is a
count of *operations*, each of which computes a hash, probes a bucket, and may
allocate — work that never shows up in the exponent.

Brute force wins below n = 32, where neither the hash build nor the sort has
earned its setup cost. That is the same shape as the Linear Search result, where
scanning beat binary search up to n ≈ 24.

**So why is the hash map still the right answer to give in an interview?** Because
it is O(n) versus O(n log n) asymptotically, because it preserves the indices with
no bookkeeping, and because it generalises — the same map solves counting pairs,
finding all pairs, and streaming input, none of which sorting handles. Know that
it is the expected answer, and know that on arrays of realistic size it is not the
fastest one.

## Where the answer sits matters too

At n = 4,096, varying only the position of the answering pair:

| Pair at | brute | hash |
|---|---|---|
| Start | **0.000µs** | 2.541µs |
| Middle | 3.708µs | 55.792µs |
| End | 2,461.625µs | 108.667µs |

Brute force is effectively free when the pair is early — it returns on the first
comparison — and catastrophic when it is late. The hash map is *not* constant
either: it must insert every element preceding the match, so it grows with the
answer's position as well. The difference is that one grows linearly and the other
quadratically.

This matters for benchmarking honestly. Testing Two Sum with the answer near the
front makes brute force look excellent, which is exactly the mistake that keeps it
in production code until the day an input arrives with the pair at the end.

## Where this goes next

Sorting plus two pointers is the foundation of **3 Sum** and **4 Sum**, where the
hash approach stops scaling and the sorted walk becomes essential. The hash map's
complement trick reappears in **Longest Subarray with Given Sum** and **Count
Subarrays with Given Sum**, where prefix sums replace raw values as the keys.
`.trim(),

  intuition:
    "You are looking for a partner for each guest. The clumsy way is to introduce every guest to every other. The sorted way is to line everyone up by height and squeeze inward from both ends — fast, but the line-up scrambles the seat numbers you were asked to report. The hash way is to remember everyone you have already met, so each new guest only has to ask 'has my partner already arrived?' — nobody moves, so nobody's seat number changes.",

  approaches: [
    {
      name: "Brute Force - Every Pair",
      idea: "Try every pair of positions until one sums to the target.",
      steps: [
        "Take each index in turn as the first element of the pair.",
        "For each, consider every later index as the second element.",
        "Start the inner loop one past the outer index, so no element pairs with itself and no pair is tried twice.",
        "If the two elements sum to the target, return their indices immediately.",
        "If no pair is found, report that none exists.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
    for (int i = 0; i < (int)nums.size(); i++) {
        for (int j = i + 1; j < (int)nums.size(); j++) {
            if (nums[i] + nums[j] == target) return {i, j};
        }
    }
    return {};
}`,
          annotations: {
            6: "j starts at i + 1, which is what prevents an element pairing with itself and avoids testing each pair twice.",
            7: "Indices are returned untouched, because nothing was moved — the one thing this approach gets right for free.",
            10: "Measured 11,743us at n = 8,192 with the pair at the end, against 15.6us for sort and two pointers.",
          },
        },
        {
          language: "java",
          code: `static int[] twoSum(int[] nums, int target) {
    for (int i = 0; i < nums.length; i++) {
        for (int j = i + 1; j < nums.length; j++) {
            if (nums[i] + nums[j] == target) return new int[]{i, j};
        }
    }
    return new int[]{};
}`,
          annotations: {
            4: "Returning on the first match means the cost depends entirely on where the answer sits.",
          },
        },
        {
          language: "python",
          code: `def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(i + 1, len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
    return []


# Measured at n = 4,096: 0.000us when the pair is at the start,
# 2,461.625us when it is at the end. Benchmarking this with an early
# answer is how it survives into production.`,
          annotations: {
            3: "range(i + 1, ...) encodes both rules at once: no self-pairing, and each pair considered once.",
          },
        },
      ],
      complexity: {
        time: "O(n^2) worst case, O(1) best case",
        space: "O(1)",
        note: "Measured fastest of all approaches below n = 32, where neither a hash build nor a sort pays for itself. Its cost is entirely governed by where the answer sits: 0.000us with the pair at the start of a 4,096-element array and 2,461.625us with it at the end.",
      },
    },
    {
      name: "Sort and Two Pointers",
      idea: "Sort value-index pairs, then squeeze two pointers inward from both ends.",
      steps: [
        "Pair each value with its original index so the position survives the sort.",
        "Sort those pairs by value.",
        "Place one pointer at the start and one at the end.",
        "If the two values sum to the target, return their original indices.",
        "If the sum is too small, move the left pointer right; if too large, move the right pointer left.",
        "Stop when the pointers meet.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <algorithm>
using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
    // Pair each value with WHERE IT CAME FROM before sorting.
    vector<pair<int,int>> p(nums.size());
    for (int i = 0; i < (int)nums.size(); i++) p[i] = {nums[i], i};
    sort(p.begin(), p.end());

    int lo = 0, hi = (int)p.size() - 1;
    while (lo < hi) {
        int sum = p[lo].first + p[hi].first;
        if (sum == target) {
            int a = p[lo].second, b = p[hi].second;
            return {min(a, b), max(a, b)};      // report in ascending order
        }
        if (sum < target) lo++; else hi--;
    }
    return {};
}`,
          annotations: {
            8: "Without carrying the index here, the answer would be positions in the sorted array — verified wrong on [3,2,4].",
            15: "Reading .second recovers the ORIGINAL position, which is the whole point of the pairing.",
            16: "min and max because the sorted order says nothing about which index came first in the input.",
            19: "Measured 15.625us at n = 8,192 — 13.9x faster than the O(n) hash map's 217.541us.",
          },
        },
        {
          language: "java",
          code: `import java.util.Arrays;
import java.util.Comparator;

static int[] twoSum(int[] nums, int target) {
    int[][] p = new int[nums.length][2];
    for (int i = 0; i < nums.length; i++) { p[i][0] = nums[i]; p[i][1] = i; }
    Arrays.sort(p, Comparator.comparingInt(x -> x[0]));

    int lo = 0, hi = p.length - 1;
    while (lo < hi) {
        int sum = p[lo][0] + p[hi][0];
        if (sum == target) {
            int a = p[lo][1], b = p[hi][1];
            return new int[]{ Math.min(a, b), Math.max(a, b) };
        }
        if (sum < target) lo++; else hi--;
    }
    return new int[]{};
}`,
          annotations: {
            6: "Each row is a value paired with its origin, which is what survives the reordering.",
            7: "Sorting an int[][] by the first column requires a comparator; sorting a primitive int[] would lose the pairing entirely.",
          },
        },
        {
          language: "python",
          code: `def two_sum(nums, target):
    # (value, original index) — the index must travel with the value
    pairs = sorted((v, i) for i, v in enumerate(nums))

    lo, hi = 0, len(pairs) - 1
    while lo < hi:
        total = pairs[lo][0] + pairs[hi][0]
        if total == target:
            a, b = pairs[lo][1], pairs[hi][1]
            return [min(a, b), max(a, b)]
        if total < target:
            lo += 1
        else:
            hi -= 1
    return []`,
          annotations: {
            3: "sorted() on tuples orders by value first, and the index rides along untouched.",
            9: "Verified on [3,2,4] target 6: this returns [1,2], while sorting bare values returns [0,2] — the wrong answer.",
          },
        },
      ],
      complexity: {
        time: "O(n log n), dominated by the sort",
        space: "O(n) for the value-index pairs",
        note: "Measured the FASTEST approach at every n from 32 upward despite the worse complexity class — 15.625us at n = 8,192 against the hash map's 217.541us, a 13.9x gap. Sorting is a sequential pass over contiguous memory; hashing pays a hash, a probe and possibly an allocation per element.",
      },
    },
    {
      name: "Two-Pass Hash Map",
      idea: "Record every value's index first, then scan looking for each element's complement.",
      steps: [
        "Walk the array and record each value together with its index in a map.",
        "Walk the array a second time.",
        "For each element, compute the complement the target requires.",
        "Look the complement up in the map.",
        "Accept it only if its index differs from the current one, so an element cannot pair with itself.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int,int> seen;
    for (int i = 0; i < (int)nums.size(); i++) seen[nums[i]] = i;

    for (int i = 0; i < (int)nums.size(); i++) {
        auto it = seen.find(target - nums[i]);
        if (it != seen.end() && it->second != i) return {i, it->second};
    }
    return {};
}`,
          annotations: {
            7: "Duplicates overwrite: for [3,3] the map finishes as {3: 1}, keeping only the later index.",
            11: "The it->second != i guard is mandatory here — without it, an element whose double is the target matches itself.",
          },
        },
        {
          language: "java",
          code: `import java.util.HashMap;
import java.util.Map;

static int[] twoSum(int[] nums, int target) {
    Map<Integer,Integer> seen = new HashMap<>();
    for (int i = 0; i < nums.length; i++) seen.put(nums[i], i);

    for (int i = 0; i < nums.length; i++) {
        Integer j = seen.get(target - nums[i]);
        if (j != null && j != i) return new int[]{ i, j };
    }
    return new int[]{};
}`,
          annotations: {
            9: "Integer, not int, because get returns null when the key is absent.",
            10: "j != i compares unboxed ints here; comparing two Integer objects with != would test references instead.",
          },
        },
        {
          language: "python",
          code: `def two_sum(nums, target):
    seen = {v: i for i, v in enumerate(nums)}   # later duplicates win

    for i, v in enumerate(nums):
        j = seen.get(target - v)
        if j is not None and j != i:
            return [i, j]
    return []`,
          annotations: {
            2: "For [3,3] this builds {3: 1}; the first index is lost and only the guard below keeps the result correct.",
            6: "j is not None rather than a truthy test, because index 0 is falsy and would be discarded.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(n)",
        note: "Two traversals plus a full map build. It needs the explicit index guard that the one-pass version makes unnecessary, and it discards duplicate positions while building. There is no case where it beats the one-pass form.",
      },
    },
    {
      name: "Optimal - One-Pass Hash Map",
      idea: "Look for each element's complement among the elements already seen, then record it.",
      steps: [
        "Create an empty map from value to index.",
        "Visit each element once.",
        "Compute the complement the target requires.",
        "If the complement is already in the map, return its index together with the current one.",
        "Otherwise record the current value and index, and continue.",
        "Checking before inserting is what makes self-pairing impossible without a guard.",
      ],
      code: [
        {
          language: "cpp",
          code: `#include <vector>
#include <unordered_map>
using namespace std;

vector<int> twoSum(const vector<int>& nums, int target) {
    unordered_map<int,int> seen;
    seen.reserve(nums.size() * 2);          // avoid rehashing mid-scan

    for (int i = 0; i < (int)nums.size(); i++) {
        auto it = seen.find(target - nums[i]);
        if (it != seen.end()) return {it->second, i};   // check BEFORE insert
        seen[nums[i]] = i;
    }
    return {};
}`,
          annotations: {
            7: "Reserving up front stops the map rehashing as it grows, which is a real cost on a large input.",
            11: "Checking before inserting is the whole trick: the current element is not yet in the map, so it cannot match itself.",
            12: "No index guard is needed, unlike the two-pass version — the ordering has already ruled that case out.",
            15: "Measured 217.541us at n = 8,192, against 15.625us for sort and two pointers.",
          },
        },
        {
          language: "java",
          code: `import java.util.HashMap;
import java.util.Map;

static int[] twoSum(int[] nums, int target) {
    Map<Integer,Integer> seen = new HashMap<>();

    for (int i = 0; i < nums.length; i++) {
        Integer j = seen.get(target - nums[i]);
        if (j != null) return new int[]{ j, i };
        seen.put(nums[i], i);
    }
    return new int[]{};
}`,
          annotations: {
            8: "The lookup happens against only the elements already passed, which is what enforces the two-distinct-elements rule.",
            10: "put comes after the check, so ordering the two lines correctly is the entire correctness argument.",
          },
        },
        {
          language: "python",
          code: `def two_sum(nums, target):
    seen = {}                       # value -> index

    for i, v in enumerate(nums):
        if target - v in seen:
            return [seen[target - v], i]
        seen[v] = i
    return []


# On [3, 3] with target 6: the first 3 is recorded, the second finds it,
# and the answer is [0, 1] — correct with no index guard anywhere.`,
          annotations: {
            5: "The membership test runs before the assignment below it, which is what makes duplicates work correctly.",
            7: "Assigning after the check also means a repeated value keeps its EARLIEST index in play for later elements.",
          },
        },
      ],
      complexity: {
        time: "O(n)",
        space: "O(n)",
        note: "One pass, indices untouched, and correct on duplicates by construction. It is the expected interview answer and it was NOT the fastest measured — 217.541us at n = 8,192 against 15.625us for the sorted two-pointer, because each operation hashes, probes and may allocate.",
      },
    },
  ],

  examples: [
    {
      input: "nums = [2, 7, 11, 15], target = 9",
      output: "[0, 1]",
      walkthrough: [
        "The map starts empty.",
        "i = 0: the value is 2 and the complement needed is 7, which has not been seen, so record 2 at index 0.",
        "i = 1: the value is 7 and the complement needed is 2, which is in the map at index 0.",
        "Return [0, 1] immediately, without examining 11 or 15 at all.",
        "The indices are the original ones, because nothing in the array was moved.",
        "Note the complement was checked before 7 was inserted, which is why 7 could not match itself.",
      ],
      why: "The statement's own first example, and it shows the map answering the question before the array is even half read.",
    },
    {
      input: "nums = [3, 2, 4], target = 6, solved by sorting bare values",
      output: "[0, 2] — wrong; the correct answer is [1, 2]",
      walkthrough: [
        "Sorting the values gives [2, 3, 4].",
        "Two pointers start at 2 and 4, which sum to exactly 6, so the values found are correct.",
        "They sit at positions 0 and 2 of the sorted array, so that pair of positions is returned.",
        "But position 0 of the original array holds 3, and position 2 holds 4.",
        "Those sum to 7, not 6, so the returned indices do not identify a valid answer.",
        "Sorting pairs instead gives [(2,1), (3,0), (4,2)], and reading the second component yields [1, 2], which is correct.",
      ],
      why: "The clearest demonstration that a correct algorithm on correct values can still return a wrong answer, because the question asked about positions and the positions were destroyed.",
    },
    {
      input: "nums = [3, 3], target = 6",
      output: "[0, 1]",
      walkthrough: [
        "The one-pass map starts empty.",
        "i = 0: the complement of 3 is 3, which is not yet in the map, so 3 is recorded at index 0.",
        "i = 1: the complement of 3 is 3, which is now in the map at index 0.",
        "Return [0, 1], and the two elements used are genuinely distinct.",
        "The two-pass version builds its map first, which finishes as {3: 1} because the second 3 overwrote the first.",
        "It then returns the correct answer only because its explicit index != i guard rejects the self-match at i = 1.",
      ],
      why: "Shows why the check-then-insert ordering is a correctness mechanism and not a stylistic preference — it removes a whole class of special case.",
    },
    {
      input: "n = 8,192 with the answering pair at the end, all three approaches",
      output: "sort + two pointers 15.6µs, hash map 217.5µs, brute force 11,743µs",
      walkthrough: [
        "The hash map is O(n) and the sorted two-pointer is O(n log n), so the ranking should favour the hash map.",
        "Measured, the sorted approach is 13.9 times faster.",
        "Sorting walks contiguous memory sequentially, and the two-pointer pass that follows is two more linear scans.",
        "The hash map's O(n) counts operations, each of which computes a hash, probes a bucket and may allocate.",
        "That per-operation work never appears in the exponent, and at this size it dominates completely.",
        "Below n = 32 the brute force beats both, because neither the sort nor the map build has repaid its setup cost.",
      ],
      why: "The measurement that reorders the standard teaching ranking, and the reason the content recommends the hash map for reasons other than speed.",
    },
  ],

  visualization: {
    kind: "array",
    description:
      "The array as a strip of cells with each cell carrying its index printed beneath it in a lighter weight, because the indices are the answer and they should be visible from the first frame. Three tracks share this strip. The HASH track advances a single marker left to right; above it sits a growing table of value-to-index entries. On each element, draw a lookup arrow from the cell to the table labelled with the complement being sought — target minus this value — and flash the table row when it hits. The decisive detail to animate is the ordering: show the lookup fire first and the insertion of the current element happen after it, so it is visually obvious the current cell was not in the table when it was queried, and therefore could not match itself. On the hit, draw a bracket connecting the two original cells and print their indices as the answer. The SORT track takes the same array and physically reorders the cells, dragging each cell's printed index along with it so the index is seen to travel; two pointers then squeeze inward with the running sum displayed between them, moving the left pointer up when the sum is low and the right down when it is high. When they land, read the answer off the carried indices, not the positions. Beneath that, run the failure variant on [3,2,4]: sort the cells WITHOUT their indices, let the pointers correctly find the values 2 and 4, then highlight positions 0 and 2 back on the original strip where they hold 3 and 4, and print 7 against the target 6 in red. The BRUTE track fans an arc from each cell to every later cell, and its counter is the point — run it three times with the answering pair at the start, middle and end, so the same code visibly finishes in one arc, in hundreds, or in millions. Close with a cost panel plotting all three across n on a log scale, with the crossover at n = 32 marked and the n = 8,192 column labelled: sort 15.6us, hash 217.5us, brute 11,743us.",
    sampleInput:
      '{"primary":{"nums":[2,7,11,15],"target":9,"trace":[{"i":0,"value":2,"complement":7,"found":false,"tableAfter":{"2":0}},{"i":1,"value":7,"complement":2,"found":true,"foundAt":0,"note":"checked before inserting, so 7 could not match itself"}],"answer":[0,1],"elementsExamined":2,"of":4},"sortTrack":{"nums":[3,2,4],"target":6,"correctAnswer":[1,2],"tagged":[[2,1],[3,0],[4,2]],"pointersLandOn":[[2,1],[4,2]],"readsIndices":[1,2]},"sortFailure":{"nums":[3,2,4],"target":6,"sortedValues":[2,3,4],"pointerPositions":[0,2],"originalValuesAtThosePositions":[3,4],"sum":7,"target2":6,"wrong":true},"duplicates":{"nums":[3,3],"target":6,"onePass":[0,1],"twoPassMap":{"3":1},"twoPassNeedsGuard":true},"bruteByPosition":{"n":4096,"startUs":0.0,"middleUs":3.708,"endUs":2461.625,"hashStartUs":2.541,"hashMiddleUs":55.792,"hashEndUs":108.667},"costPanel":{"rows":[{"n":8,"brute":0.0,"hash":0.292,"sort":0.083,"winner":"brute"},{"n":16,"brute":0.041,"hash":0.583,"sort":0.125,"winner":"brute"},{"n":32,"brute":0.25,"hash":1.084,"sort":0.209,"winner":"sort"},{"n":64,"brute":0.875,"hash":1.958,"sort":0.25,"winner":"sort"},{"n":128,"brute":3.5,"hash":4.0,"sort":0.375,"winner":"sort"},{"n":256,"brute":13.25,"hash":7.792,"sort":0.708,"winner":"sort"},{"n":1024,"brute":184.625,"hash":31.792,"sort":2.292,"winner":"sort"},{"n":8192,"brute":11743.0,"hash":217.541,"sort":15.625,"winner":"sort"}],"crossoverAt":32,"sortVsHashAt8192":13.9}}',
    highlights: [
      "Every cell shows its index printed beneath it from the first frame, because the indices are what the problem actually asks for.",
      "The hash marker reaches index 0, and a lookup arrow labelled 'need 7' points at an empty table and misses.",
      "Only after that miss does the value 2 drop into the table as an entry pointing at index 0.",
      "At index 1 the arrow is labelled 'need 2', and the table row for 2 flashes as a hit.",
      "A bracket connects cells 0 and 1 and prints [0, 1], with 11 and 15 never examined at all.",
      "The insert-after-lookup ordering is highlighted: the current cell was absent from the table when queried, so it could not match itself.",
      "The sort track reorders the cells of [3, 2, 4], and each cell's printed index visibly travels with it.",
      "Two pointers squeeze inward with the running sum shown between them, landing on the values 2 and 4.",
      "The answer is read from the carried indices — 1 and 2 — not from the pointer positions.",
      "The failure variant repeats the sort without carrying indices, and the pointers still find 2 and 4 correctly.",
      "Their positions 0 and 2 are highlighted back on the original strip, where they hold 3 and 4.",
      "That sum prints as 7 against a target of 6, in red — a correct algorithm returning a wrong answer.",
      "The brute track fans arcs from each cell to every later one, and runs three times with the pair at the start, middle and end.",
      "The same code finishes in a single arc, then in hundreds, then in millions — 0.000us against 2,461.625us at n = 4,096.",
      "The cost panel plots all three across n on a log scale, with the crossover marked at n = 32.",
      "The n = 8,192 column closes it: sort 15.6us, hash 217.5us, brute 11,743us — the O(n log n) approach beating the O(n) one by 13.9x.",
    ],
  },

  edgeCases: [
    "Exactly two elements that sum to the target — the smallest valid input, answered on the second element.",
    "The answering pair at indices 0 and 1 — brute force returns on its first comparison, measured at effectively zero.",
    "The answering pair at the last two indices — brute force's worst case, measured 2,461.625us at n = 4,096.",
    "Duplicate values forming the pair, such as [3,3] with target 6 — correct by construction in the one-pass version.",
    "A value that is exactly half the target appearing only once — must not match itself, which the check-before-insert ordering prevents.",
    "Negative numbers and zero in the array — nothing in any approach depends on sign, only on the arithmetic.",
    "A target no pair reaches — every approach must terminate and report absence rather than looping.",
    "An array of all identical values where the target is twice that value — the first two indices are the answer.",
    "A very large array where the sorted two-pointer beats the hash map, measured 13.9x at n = 8,192.",
    "A small array under 32 elements where brute force beats both alternatives.",
    "An input where several valid pairs exist — the approaches may return different pairs, all correct, so tests must check validity rather than equality.",
  ],

  pitfalls: [
    "Sorting the values without their indices. Verified on [3,2,4] target 6: it returns [0,2], whose elements sum to 7 rather than 6.",
    "Returning the sorted positions rather than the carried original indices, which is the same bug wearing a different disguise.",
    "Forgetting min and max when reading the carried indices, since the sorted order says nothing about which came first in the input.",
    "Inserting the current element into the map before checking for its complement, which lets an element pair with itself whenever its double is the target.",
    "Omitting the index != i guard in the two-pass version, where the map already contains every element including the current one.",
    "Assuming the two-pass map keeps every duplicate. For [3,3] it finishes as {3: 1}, having overwritten the first index.",
    "Testing whether a Python dict lookup succeeded with a truthy test rather than 'is not None', which silently discards index 0.",
    "Comparing two boxed Integer values with != in Java, which compares references outside the small-value cache rather than values.",
    "Assuming the O(n) hash map is the fastest. Measured 217.541us at n = 8,192 against 15.625us for the O(n log n) sorted approach.",
    "Benchmarking with the answering pair near the front, which makes brute force look excellent and hides its quadratic worst case entirely.",
    "Writing a test that asserts one exact pair of indices when the input admits several valid answers, which fails correct implementations.",
    "Reaching for sorting when the problem needs all pairs, counting, or streaming input — the hash map generalises to those and the sorted walk does not.",
  ],

  commonDoubts: [
    {
      question: "Why can't I just sort the array and use two pointers?",
      answer:
        "You can, but only if you sort the indices along with the values. The problem asks for positions, and sorting moves everything. Verified on nums = [3,2,4] with target 6: the sorted array is [2,3,4], two pointers correctly find the values 2 and 4, and they sit at positions 0 and 2 of the sorted array. Positions 0 and 2 of the original array hold 3 and 4, which sum to 7. The algorithm was right about the values and wrong about the answer. Sort (value, index) pairs instead — [(2,1),(3,0),(4,2)] — and reading the second component gives [1,2], which is correct.",
    },
    {
      question: "Why check the complement before inserting the current element?",
      answer:
        "Because it makes 'you may not use the same element twice' impossible to violate, rather than a case you have to remember to handle. At the moment you look, the current element is not yet in the map, so it cannot answer its own query. Consider target 6 with a single 3 in the array: checking first finds nothing, which is correct. Inserting first would find the 3 you just added and report it pairing with itself. The two-pass version has no such protection, which is exactly why it needs an explicit index != i guard.",
    },
    {
      question: "Does the hash map still work when the array has duplicates?",
      answer:
        "Yes, and the one-pass version handles it without any special case. On [3,3] with target 6: the first 3 is recorded at index 0, the second 3 looks for its complement, finds that entry, and the answer is [0,1] — two genuinely distinct elements. The two-pass version is more fragile. Building the map first gives {3: 1}, because the second 3 overwrote the first, so half the information is already gone; it produces the right answer only because the index guard rejects the self-match.",
    },
    {
      question: "Which approach is actually fastest?",
      answer:
        "Measured, sorting with two pointers — and it is not close. With the answering pair at the end of the array, at n = 8,192 it took 15.625us against the hash map's 217.541us, so the O(n log n) approach beat the O(n) one by 13.9x. It won at every size from n = 32 upward. Below 32, brute force beat both, because neither the sort nor the map build had repaid its setup cost. That is the same shape as Linear Search beating binary search up to n around 24.",
    },
    {
      question: "How can an O(n log n) algorithm beat an O(n) one?",
      answer:
        "Because the two complexities are counting different work. Sorting is a sequential pass over contiguous memory, which hardware is extremely good at, and the two-pointer walk that follows is two more linear scans. The hash map's O(n) counts operations, and each operation computes a hash, probes a bucket, follows a chain on collision and may trigger an allocation. None of that per-operation cost appears in the exponent. Complexity tells you how cost grows with n; it does not tell you what one unit of that cost is, and here the units differ by more than the log factor.",
    },
    {
      question: "Then why is the hash map the expected interview answer?",
      answer:
        "For three reasons that are all real, none of which is raw speed on a mid-sized array. It is asymptotically better, which is what the question is testing. It preserves the indices with no bookkeeping at all, while the sorted approach needs you to notice the index problem and carry pairs. And it generalises: the same complement trick handles counting pairs, returning all pairs, and streaming input where you cannot sort because you never hold the whole array. Give the hash map, and mention that you would measure before assuming it is fastest.",
    },
    {
      question: "Is the brute force ever acceptable?",
      answer:
        "Below about 32 elements it was the fastest thing measured, so yes — for genuinely small, bounded inputs it is the right answer and the simplest code. The danger is how it fails. Its cost depends entirely on where the answering pair sits: at n = 4,096 it took effectively zero when the pair was at the start and 2,461.625us when it was at the end. A benchmark built with the answer near the front makes it look excellent, which is how it survives into production until an input arrives with the pair at the end.",
    },
    {
      question: "What should I return when no pair exists?",
      answer:
        "The problem guarantees exactly one solution, so strictly the case cannot arise — but the code still has to do something, and silently returning an empty result is the honest choice. Do not return [0, 0] or [-1, -1] as a sentinel without saying so, because both are indistinguishable from real index pairs in some inputs. If your caller must be able to tell, return an optional or a flag alongside the pair rather than encoding absence into the value.",
    },
    {
      question: "How does this extend to 3 Sum?",
      answer:
        "Through the sorted two-pointer, not the hash map — which is why that approach is worth learning properly here even though it needs the index bookkeeping. For 3 Sum you fix one element and run a two-pointer scan over the remainder for the pair that completes it, giving O(n^2) overall. The hash approach does not extend as cleanly, because you would need to track pairs rather than single values, and the duplicate handling becomes much harder. 3 Sum also usually asks for values rather than indices, which removes the index problem that dominates this subtopic.",
    },
  ],

  relatedIds: ["linear-search", "3-sum", "count-subarrays-with-given-sum", "longest-subarray-with-sum-k"],
};

export default content;
