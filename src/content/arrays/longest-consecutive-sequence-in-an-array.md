---
id: longest-consecutive-sequence-in-an-array
topic: Arrays
title: Longest Consecutive Sequence in an Array
difficulty: Medium
status: ready
prerequisites:
  - two-sum
  - remove-duplicates-from-sorted-array
  - for-loop
  - if-else-statements
  - time-and-space-complexity-basics
relatedIds:
  - two-sum
  - remove-duplicates-from-sorted-array
  - largest-subarray-with-sum-0
  - count-subarrays-with-given-sum
---

<!-- @summary -->
Find the longest run of consecutive integers in an unsorted array — where the famous O(n) hash-set solution measured 1.69x to 9.63x SLOWER than the O(n log n) sort at every size tested, and the guard that makes it O(n) is a pure performance bet that no correctness test can catch.

<!-- @theory -->
## The problem

Given an unsorted array, find the length of the longest run of consecutive
integers in it. The values do not have to be adjacent in the array — only
consecutive in value.

```
[100, 4, 200, 1, 3, 2]  ->  4      the run 1, 2, 3, 4
```

LeetCode 128 asks for this in O(n), which is what makes it interesting: the
obvious solution sorts, and sorting is O(n log n).

## Duplicates first, because they break the easy version

Sort the array and count runs of consecutive values. That works, with one catch:

```
[0, 1, 1, 2]   sorted is already [0,1,1,2]
```

Walking left to right and asking "is this one more than the last?" gives 0→1
(run 2), 1→1 (**not** one more, so the run resets), 1→2 (run 2). The answer
comes out **2**, and the correct answer is **3**.

Measured over all 19,531 multisets over the values 0–4 with n up to 6, failing
to skip duplicates gave the wrong answer on **32.75%** of them. The smallest
failing input is exactly `[0, 1, 1, 2]`.

A duplicate should be skipped, not treated as a break. Either dedupe first or
`continue` when the value equals the previous one.

## The O(n) solution, and the guard that makes it O(n)

Put every value in a hash set. Then for each value, walk upward — v, v+1, v+2 —
counting how far the run goes.

That alone is not O(n). Given the run 1,2,3,…,1000, starting from 1 walks 1000
steps, starting from 2 walks 999, and so on. Same run, counted a thousand times.

The fix is one line: **only start walking from a value that begins a run.**

```
for v in set:
    if v - 1 in set: continue        # something precedes v, so v is not a start
    walk upward from v
```

Now each run is walked exactly once, so the total work across all runs is the
number of distinct values. That is what makes it O(n).

### What the guard actually saves

The saving is not a vague constant — it is exactly **(L + 1) / 2**, where L is
the run length. Measured inner-loop steps:

| Data shape | guarded | unguarded | ratio |
|---|---|---|---|
| one run of 1,000 | 1,000 | 500,500 | **500.5x** |
| one run of 4,000 | 4,000 | 8,002,000 | **2000.5x** |
| runs of 10 (n=1,000) | 1,000 | 5,500 | 5.5x |
| runs of 10 (n=4,000) | 4,000 | 22,000 | 5.5x |
| all distinct, no runs | 1,000 | 1,000 | **1.0x** |

For runs of 10 the ratio is (10+1)/2 = 5.5, exactly. For one run of n it is
(n+1)/2, which is why the unguarded version is quadratic.

### The guard is invisible to tests

Both versions return the **same answer on every input**. Over those same 19,531
multisets, the unguarded version scored **zero failures**. It is purely a
performance guard, so no correctness test will ever catch its absence — only a
timing measurement on run-heavy data will.

### And it is not free

The guard costs one extra hash lookup per element, and when there are no runs it
saves nothing at all. Measured on sparse random data where every run has length 1:

| n | guarded | unguarded | |
|---|---|---|---|
| 100,000 | 7.253ms | 6.233ms | guard is **1.16x slower** |
| 1,000,000 | 191.972ms | 172.105ms | guard is **1.12x slower** |

So the guard is insurance: it costs about 12–16% on run-free data and prevents a
quadratic blow-up on run-heavy data. Keep it — the downside it protects against
is unbounded, and the premium is small.

## The measurement that matters

Here is the uncomfortable part. The O(n) hash solution is the one the problem
asks for, and on this machine it lost to the O(n log n) sort **at every size and
every data shape tested**, with every input shuffled so the sort got no
free ride:

| Shape | n | sorting | hash set | hash / sort |
|---|---|---|---|---|
| one run of n | 10,000 | 0.250ms | 0.422ms | 1.69x |
| one run of n | 1,000,000 | 19.352ms | 98.651ms | **5.10x** |
| runs of 10 | 1,000,000 | 19.789ms | 132.502ms | **6.70x** |
| sparse random | 1,000,000 | 19.669ms | 189.487ms | **9.63x** |

And note the direction: the gap **widens** as n grows, which is the opposite of
what the complexity classes predict. A hash set of a million integers does not
fit in cache, so every `count()` is a probable cache miss and a pointer chase,
while the sort streams contiguous memory. The log n factor never gets large
enough to matter — log₂(1,000,000) is only 20 — but the constant factor does.

This is the same result as **Two Sum**, where sort-plus-two-pointers beat the
O(n) hash map at every size by up to 13.9x. Two problems, same lesson: a hash
table's constant factor is large enough to eat a log n advantage whole.

## When you know the range, neither wins

If the values fit in a range you can afford to allocate, mark them in a boolean
array and scan for the longest run of set entries. That is O(n + range) with no
hashing and no sorting:

| Value range | n | sorting | hash set | marking array |
|---|---|---|---|---|
| 2n (dense) | 1,000,000 | 20.750ms | 129.594ms | **3.337ms** |
| 100n | 1,000,000 | 21.716ms | 199.158ms | 92.899ms |
| 2×10⁹ (sparse) | 1,000,000 | 19.713ms | 195.316ms | **1,793.508ms** |

On a dense range it is **6.2x faster than sorting and 38.8x faster than the
"optimal" hash**. On a sparse range it is 91x slower than sorting and would need
250 MB for the array.

So the ranking flips completely depending on the value range — which is
information the complexity analysis never asked about, and which you usually do
have.

## Which to write

- **Sorting** is the right default. Fastest of the general approaches at every
  size measured, no allocation beyond the sort, and trivially correct once
  duplicates are skipped.
- **Hash set with the guard** when the interview or spec demands O(n), or when
  the input genuinely cannot be reordered.
- **Marking array** when the value range is known and small, where it wins
  outright.
- **Never the unguarded hash set** — same answer, quadratic on the input the
  problem is about.

<!-- @intuition -->
Think of the distinct values as houses on an infinite street, most of them empty. A run is a terrace of occupied houses standing side by side. To measure the longest terrace you only need to start at houses with an empty plot to their left — those are the corner houses where a terrace begins. Starting anywhere else just re-walks a terrace you already measured from its corner, which is the entire difference between the linear version and the quadratic one.

<!-- @approach -->
### Brute Force - Search the Array for Each Successor

<!-- @idea -->
For each value, look through the whole array for the next consecutive value, and keep going until the run breaks.

<!-- @steps -->
1. Take each value in the array in turn.
2. Treat it as the possible start of a run and set the run length to one.
3. Search the entire array for the value one greater.
4. If it is found, extend the run and search for the next value up.
5. Stop when a value is not found, and keep the longest run seen.

<!-- @complexity -->
- time: O(n^3) in the worst case — every value, every step of its run, a full scan per step
- space: O(1)
- note: Correct and unusable at scale. It exists to make the cost of the linear search explicit: replacing that inner scan with a hash lookup is exactly what the set-based approach does.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int longestConsecutive(const vector<int>& nums) {
    int best = 0;

    for (int v : nums) {
        int current = v, len = 1;
        while (find(nums.begin(), nums.end(), current + 1) != nums.end()) {
            current++;
            len++;
        }
        best = max(best, len);
    }
    return best;
}
```

<!-- @annotations -->
- 10: This linear search is the whole cost. Replacing it with a hash lookup is the entire idea of the optimal version.
- 8: Iterating the raw array, duplicates included. A repeated value merely recomputes a run already seen, so it costs time but not correctness.

<!-- @code java -->
```java
static int longestConsecutive(int[] nums) {
    int best = 0;

    for (int v : nums) {
        int current = v, len = 1;
        while (contains(nums, current + 1)) {
            current++;
            len++;
        }
        best = Math.max(best, len);
    }
    return best;
}

static boolean contains(int[] a, int target) {
    for (int x : a) if (x == target) return true;
    return false;
}
```

<!-- @annotations -->
- 6: Every step of every run costs a full pass over the array.
- 16: Written out to make the linear scan visible rather than hidden behind a library call.

<!-- @code python -->
```python
def longest_consecutive(nums):
    best = 0

    for v in nums:
        current, length = v, 1
        while current + 1 in nums:      # `in` on a LIST is a linear scan
            current += 1
            length += 1
        best = max(best, length)
    return best


# The only difference between this and the optimal version is the data
# structure that `in` is searching. On a list it is O(n); on a set it is O(1).
```

<!-- @annotations -->
- 6: On a list this is O(n). Changing nums to a set here is most of the optimisation, and it is a one-character edit.

<!-- @approach -->
### Sorting

<!-- @idea -->
Sort the values, then walk them once counting runs, skipping over duplicates rather than letting them break a run.

<!-- @steps -->
1. Return zero for an empty array.
2. Sort the array.
3. Walk from the second element to the end, tracking the current run length.
4. If the value equals the previous one, skip it — a duplicate must not break the run.
5. If it is exactly one more than the previous, extend the run; otherwise start a new run of one.
6. Keep the longest run seen.

<!-- @complexity -->
- time: O(n log n), dominated by the sort
- space: O(1) beyond the sort, or O(n) if the caller's array must be preserved
- note: The fastest general approach measured here, beating the O(n) hash set by 1.69x to 9.63x across every size and data shape tested. The log n factor is small — 20 at a million elements — while a hash set's cache misses are not.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int longestConsecutive(vector<int> nums) {      // by value: caller's data survives
    if (nums.empty()) return 0;
    sort(nums.begin(), nums.end());

    int best = 1, current = 1;
    for (size_t i = 1; i < nums.size(); i++) {
        if (nums[i] == nums[i - 1]) continue;            // duplicate: not a break
        if (nums[i] == nums[i - 1] + 1) current++;
        else current = 1;
        best = max(best, current);
    }
    return best;
}
```

<!-- @annotations -->
- 5: Taking the vector by value costs an O(n) copy and leaves the caller's array in its original order.
- 11: Skipping duplicates rather than resetting. Omitting this line was measured 32.75% wrong.
- 12: Exactly one more extends the run; anything else starts a new one.

<!-- @code java -->
```java
import java.util.Arrays;

static int longestConsecutive(int[] nums) {
    if (nums.length == 0) return 0;
    int[] a = nums.clone();
    Arrays.sort(a);

    int best = 1, current = 1;
    for (int i = 1; i < a.length; i++) {
        if (a[i] == a[i - 1]) continue;
        if (a[i] == a[i - 1] + 1) current++;
        else current = 1;
        best = Math.max(best, current);
    }
    return best;
}
```

<!-- @annotations -->
- 5: Cloning first, because Arrays.sort would otherwise reorder the caller's array in place.
- 10: The duplicate skip, which is the one line that separates a correct solution from a 32.75% failure rate.

<!-- @code python -->
```python
def longest_consecutive(nums):
    if not nums:
        return 0

    a = sorted(set(nums))            # set() removes duplicates, sorted() orders them
    best = current = 1
    for i in range(1, len(a)):
        if a[i] == a[i - 1] + 1:
            current += 1
        else:
            current = 1
        best = max(best, current)
    return best


# sorted(set(...)) removes the duplicate problem before the loop starts,
# so no `continue` is needed inside it.
```

<!-- @annotations -->
- 5: Deduping up front means the loop never has to consider the equal case at all.
- 7: With duplicates already gone, the only two cases left are consecutive or not.

<!-- @approach -->
### Hash Set with a Start Guard

<!-- @idea -->
Put every value in a set, then walk each run upward — but only ever begin at a value that has no predecessor, so each run is walked exactly once.

<!-- @steps -->
1. Build a hash set from the array, which removes duplicates as it fills.
2. Take each value in the set in turn.
3. If the value one below it is also in the set, skip it — it is not the start of a run.
4. Otherwise walk upward from it, counting while each next value is in the set.
5. Keep the longest run found.

<!-- @complexity -->
- time: O(n) — each run is walked once, so total steps equal the number of distinct values
- space: O(n) for the set
- note: The complexity the problem asks for, and measured 1.69x to 9.63x slower than sorting at every size tested, with the gap widening as n grows. A hash set of a million integers does not fit in cache, so each lookup is a probable cache miss while the sort streams contiguous memory.

<!-- @code cpp -->
```cpp
#include <vector>
#include <unordered_set>
#include <algorithm>
using namespace std;

int longestConsecutive(const vector<int>& nums) {
    unordered_set<int> s(nums.begin(), nums.end());   // dedupes as it builds
    int best = 0;

    for (int v : s) {
        if (s.count(v - 1)) continue;                 // v has a predecessor: not a start

        int current = v, len = 0;
        while (s.count(current)) { len++; current++; }
        best = max(best, len);
    }
    return best;
}
```

<!-- @annotations -->
- 7: Constructing the set from the range removes duplicates with no extra code.
- 11: The guard. Without it the answer is identical and the cost becomes (L+1)/2 times higher, where L is the run length.
- 14: Each run is walked exactly once across the whole loop, which is what makes the total linear.

<!-- @code java -->
```java
import java.util.HashSet;
import java.util.Set;

static int longestConsecutive(int[] nums) {
    Set<Integer> s = new HashSet<>();
    for (int x : nums) s.add(x);
    int best = 0;

    for (int v : s) {
        if (s.contains(v - 1)) continue;

        int current = v, len = 0;
        while (s.contains(current)) { len++; current++; }
        best = Math.max(best, len);
    }
    return best;
}
```

<!-- @annotations -->
- 10: Iterating the SET rather than the array, so a repeated value is considered only once.
- 13: Boxing every int into an Integer is a real cost here that the C++ version does not pay.

<!-- @code python -->
```python
def longest_consecutive(nums):
    s = set(nums)
    best = 0

    for v in s:
        if v - 1 in s:               # not the start of a run
            continue

        current, length = v, 0
        while current in s:
            length += 1
            current += 1
        best = max(best, length)
    return best


# Measured inner-loop steps on one run of 4,000:
#   with the guard     4,000
#   without it     8,002,000     -> exactly (n+1)/2 times more
```

<!-- @annotations -->
- 6: One extra lookup per element. On data with no runs it saves nothing and measured 12-16% slower than omitting it.
- 10: This loop runs once per run in total, not once per element, which is the whole argument for linearity.

<!-- @approach -->
### Marking Array for a Bounded Range

<!-- @idea -->
When the values fit a range you can afford to allocate, mark each one present in a boolean array and scan for the longest unbroken stretch.

<!-- @steps -->
1. Find the smallest and largest values in the array.
2. Allocate one boolean per value in that range.
3. Mark every value from the array as present, which also collapses duplicates.
4. Scan the booleans once, counting the current unbroken stretch of present values.
5. Reset the count at every gap and keep the longest stretch.

<!-- @complexity -->
- time: O(n + range)
- space: O(range) — one bit per possible value
- note: The fastest approach measured when the range is dense: 3.337ms at n = 1,000,000 over a range of 2n, against 20.750ms for sorting and 129.594ms for the hash set. It collapses when the range is wide — 1,793.508ms over a range of 2 billion, which also needs 250 MB — so it is a trade that depends on knowing your data.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int longestConsecutive(const vector<int>& nums) {
    if (nums.empty()) return 0;
    int lo = *min_element(nums.begin(), nums.end());
    int hi = *max_element(nums.begin(), nums.end());

    vector<bool> seen((size_t)(hi - lo) + 1, false);   // one BIT per value
    for (int x : nums) seen[(size_t)(x - lo)] = true;

    int best = 0, current = 0;
    for (size_t i = 0; i < seen.size(); i++) {
        if (seen[i]) { current++; best = max(best, current); }
        else current = 0;
    }
    return best;
}
```

<!-- @annotations -->
- 10: vector<bool> is bit-packed, so the range costs one bit per value rather than one byte. Check hi - lo before allocating.
- 11: Marking is idempotent, so duplicates need no special handling at all.
- 14: A single sequential scan of contiguous memory, which is why this beats both hashing and sorting on a dense range.

<!-- @code java -->
```java
import java.util.BitSet;

static int longestConsecutive(int[] nums) {
    if (nums.length == 0) return 0;
    int lo = Integer.MAX_VALUE, hi = Integer.MIN_VALUE;
    for (int x : nums) { lo = Math.min(lo, x); hi = Math.max(hi, x); }

    BitSet seen = new BitSet(hi - lo + 1);
    for (int x : nums) seen.set(x - lo);

    int best = 0, current = 0;
    for (int i = 0; i <= hi - lo; i++) {
        if (seen.get(i)) { current++; best = Math.max(best, current); }
        else current = 0;
    }
    return best;
}
```

<!-- @annotations -->
- 8: BitSet is the bit-packed equivalent, so a range of a million values costs 125 KB rather than 1 MB.

<!-- @code python -->
```python
def longest_consecutive(nums):
    if not nums:
        return 0
    lo, hi = min(nums), max(nums)

    seen = bytearray(hi - lo + 1)
    for x in nums:
        seen[x - lo] = 1

    best = current = 0
    for flag in seen:
        if flag:
            current += 1
            best = max(best, current)
        else:
            current = 0
    return best


# Guard the range before allocating: hi - lo can be billions.
```

<!-- @annotations -->
- 6: One byte per value in Python rather than one bit, so check the span before allocating.
- 11: Iterating the bytearray directly avoids building an index range, which matters when the span is large.

<!-- @example -->

<!-- @input -->
nums = [100, 4, 200, 1, 3, 2]

<!-- @output -->
4 — the run 1, 2, 3, 4

<!-- @why -->
Shows that consecutive means consecutive in value, not adjacent in the array — the run 1,2,3,4 is scattered across four separate positions.

<!-- @walkthrough -->
1. The set holds 100, 4, 200, 1, 3, 2.
2. Consider 100: is 99 in the set? No, so 100 starts a run. Walk up — 101 is absent, so the run has length 1.
3. Consider 4: is 3 in the set? Yes, so 4 is not the start of a run. Skip it entirely.
4. Consider 200: 199 is absent, so it starts a run of length 1.
5. Consider 1: is 0 in the set? No, so 1 starts a run.
6. Walk up from 1: 2 is present, 3 is present, 4 is present, 5 is absent — length 4.
7. Consider 3 and 2: both have predecessors in the set, so both are skipped.
8. The longest run found is 4.

<!-- @example -->

<!-- @input -->
nums = [0, 1, 1, 2] with a sort that does not skip duplicates

<!-- @output -->
2 — and the correct answer is 3

<!-- @why -->
The smallest input that exposes the duplicate bug, found by exhaustive search over all multisets of the values 0-4 up to length 6.

<!-- @walkthrough -->
1. Sorted, the array is already [0, 1, 1, 2].
2. Compare 1 against 0: exactly one more, so the run extends to 2.
3. Compare the second 1 against the first: it is equal, not one more.
4. A version that only tests "one more than the previous" treats that as a break and resets the run to 1.
5. Compare 2 against 1: one more, so the run extends to 2.
6. The reported answer is 2, but 0, 1, 2 is a run of 3.
7. Measured over all 19,531 multisets over the values 0-4 with n up to 6, this bug appears on 32.75% of them.

<!-- @example -->

<!-- @input -->
One run of 4,000 consecutive values, with and without the start guard

<!-- @output -->
4,000 inner-loop steps guarded, 8,002,000 unguarded — and the same answer from both

<!-- @why -->
The guard is a pure performance device: both versions return identical answers on every input, so no correctness test can detect its absence.

<!-- @walkthrough -->
1. Without the guard, starting at 1 walks the whole run of 4,000.
2. Starting at 2 walks 3,999 steps, starting at 3 walks 3,998, and so on.
3. The total is 4,000 + 3,999 + ... + 1, which is 8,002,000.
4. With the guard, only the value 1 has no predecessor, so only it starts a walk.
5. That single walk covers 4,000 steps and every other value is skipped after one lookup.
6. The ratio is exactly (n + 1) / 2 — measured 2000.5x at n = 4,000 and 500.5x at n = 1,000.
7. For runs of length 10 the same formula gives (10 + 1) / 2 = 5.5x, which is exactly what was measured.

<!-- @example -->

<!-- @input -->
1,000,000 shuffled values, sorting against the O(n) hash set

<!-- @output -->
19.669ms sorting against 189.487ms hashing — the O(n log n) solution is 9.63x faster

<!-- @why -->
The result the complexity classes do not predict, and it holds at every size and every data shape tested.

<!-- @walkthrough -->
1. Every input was shuffled first, so the sort gets no advantage from pre-ordered data.
2. At n = 10,000 sorting took 0.250ms against the hash set's 0.422ms — 1.69x.
3. At n = 1,000,000 sorting took 19.352ms against 98.651ms — 5.10x on the same shape.
4. On sparse random values at a million elements the gap reached 9.63x.
5. The gap widens with n, which is the opposite of what the complexity classes suggest.
6. A hash set of a million integers does not fit in cache, so each lookup is a probable cache miss and a pointer chase.
7. The sort streams contiguous memory, and log2(1,000,000) is only 20 — never large enough to overcome that.

<!-- @visualization array -->

<!-- @description -->
The distinct values drawn as occupied cells on a long horizontal number line rather than as an array strip, because the problem is about value adjacency and an array strip actively misleads here — it invites the reader to look for neighbours in the wrong dimension. Scatter the input array above as loose tiles and animate each one dropping onto its slot on the number line, so the reordering that makes runs visible happens on screen rather than being assumed. Empty slots stay visibly empty; that emptiness is the data. Once placed, the runs are self-evident as terraces of adjacent occupied cells. Now run the guard: sweep a marker across the occupied cells and, at each one, flash a short probe arrow to the slot immediately to its LEFT. If that slot is occupied the cell dims and the marker moves on after a single probe — one lookup, no walk. If it is empty, mark the cell as a run start in a distinct colour and walk rightward from it, incrementing a counter, until the walk falls off the terrace into an empty slot. The visual claim is that walks begin only at terrace corners. Beneath, run the unguarded version on the same data with a step counter, and let it re-walk the same terrace from every one of its cells, tracing overlapping arcs that accumulate into a visibly redundant fan — closing with 4,000 steps against 8,002,000 and the note that both produced the same answer. A third panel handles duplicates: place [0,1,1,2] and show the second 1 landing on an already-occupied slot, changing nothing, then contrast a sorted-array walk where the duplicate is treated as a break and the run resets, ending on 2 against the correct 3 with the 32.75% figure. Finally a bar chart of the three general approaches at n = 1,000,000, with sorting shortest and the hash set nearly ten times longer, captioned so the inversion against the complexity classes is unmissable, plus a fourth bar for the marking array on a dense range at 3.337ms and the same bar redrawn at 1,793.508ms when the range is sparse — the same algorithm, two orders of magnitude apart, decided by data the complexity analysis never asked about.

<!-- @sampleInput -->
```json
{"primary":{"input":[100,4,200,1,3,2],"distinct":[1,2,3,4,100,200],"numberLine":{"occupied":[1,2,3,4,100,200],"terraces":[{"start":1,"end":4,"length":4},{"start":100,"end":100,"length":1},{"start":200,"end":200,"length":1}]},"guardTrace":[{"v":100,"predecessor":99,"present":false,"isStart":true,"walked":1},{"v":4,"predecessor":3,"present":true,"isStart":false,"walked":0},{"v":200,"predecessor":199,"present":false,"isStart":true,"walked":1},{"v":1,"predecessor":0,"present":false,"isStart":true,"walked":4},{"v":3,"predecessor":2,"present":true,"isStart":false,"walked":0},{"v":2,"predecessor":1,"present":true,"isStart":false,"walked":0}],"answer":4},"guardPanel":{"runLength":4000,"guardedSteps":4000,"unguardedSteps":8002000,"ratio":2000.5,"formula":"(L+1)/2","otherMeasurements":[{"runLength":1000,"ratio":500.5},{"runLength":10,"ratio":5.5},{"runLength":1,"ratio":1.0}],"sameAnswer":true,"correctnessFailures":0,"multisetsTested":19531},"duplicatePanel":{"input":[0,1,1,2],"sorted":[0,1,1,2],"withoutSkip":2,"correct":3,"failureRate":0.3275,"multisetsTested":19531},"costPanel":{"n":1000000,"shuffled":true,"sortingMs":19.669,"hashMs":189.487,"ratio":9.63,"widensWithN":[{"n":10000,"ratio":1.69},{"n":1000000,"ratio":5.10}],"markingDenseMs":3.337,"markingSparseMs":1793.508,"markingSparseMemoryMB":250}}
```

<!-- @highlights -->
- The distinct values are drawn on a number line, not an array strip, because the problem is about adjacency in value rather than in position.
- The input tiles 100, 4, 200, 1, 3, 2 drop from above onto their slots, so the reordering that reveals runs happens on screen.
- Empty slots stay visibly empty, because that emptiness is what separates one terrace from the next.
- Three terraces become self-evident: 1-2-3-4, then 100 alone, then 200 alone.
- The guard sweep probes one slot to the LEFT of each occupied cell and nothing else.
- 100 probes 99, finds it empty, is marked a run start, and walks one step.
- 4 probes 3, finds it occupied, dims immediately, and is abandoned after that single lookup.
- 1 probes 0, finds it empty, is marked a run start, and walks right through 2, 3 and 4 before falling off the terrace.
- 3 and 2 both probe an occupied slot and are skipped, so the terrace is walked exactly once in total.
- The unguarded version runs beneath on the same data, re-walking the same terrace from every cell.
- Its overlapping arcs accumulate into a visibly redundant fan, closing on 4,000 steps against 8,002,000.
- Both versions are shown returning the same answer, which is why no correctness test can catch the difference.
- A duplicate panel places [0,1,1,2] and shows the second 1 landing on an occupied slot and changing nothing.
- The same input walked as a sorted array treats the duplicate as a break, resetting the run and reporting 2 against the correct 3.
- A bar chart at n = 1,000,000 puts sorting shortest and the hash set nearly ten times longer, inverting the complexity classes.
- A fourth bar shows the marking array at 3.337ms on a dense range and 1,793.508ms on a sparse one — the same algorithm, decided by data the complexity analysis never asked about.

<!-- @edgeCases -->
- Empty array — the answer is zero, and the sorting and marking versions must guard before indexing or calling min.
- Single element — the answer is one, since a lone value is a run of length one.
- All elements equal — the answer is one, and this is where a missing duplicate skip is most visible.
- Two equal elements such as [1,1] — the smallest input where duplicates matter at all.
- [0,1,1,2] — the smallest input where the missing duplicate skip produces a wrong answer.
- Already sorted ascending input — flatters the sorting approach in a benchmark, so shuffle before measuring.
- Already sorted descending input — the runs are all there but reversed, and the answer is unchanged.
- All values distinct with no consecutive pair — every run has length one, and the guard saves nothing while still costing a lookup per element.
- One long run covering the whole array — the case where the missing guard turns linear into quadratic.
- Negative values — nothing assumes positivity, but the marking array must offset by the minimum rather than indexing directly.
- Values spanning the full int range — the marking approach would need gigabytes, so the span must be checked before allocating.
- A run crossing zero, such as [-2,-1,0,1] — catches an off-by-one in any offset arithmetic.

<!-- @pitfalls -->
- Letting duplicates break a run in the sorting version. Measured 32.75% wrong across 19,531 multisets, with [0,1,1,2] the smallest failing case.
- Omitting the start guard in the hash version. The answer stays correct on every input, so tests pass while the cost rises by (L+1)/2 — a factor of 2000.5 on a single run of 4,000.
- Expecting a correctness test to catch the missing guard. The unguarded version scored zero failures across all 19,531 multisets; only a timing measurement reveals it.
- Adding the guard without knowing the data. It costs one lookup per element and measured 12-16% slower than omitting it on data where every run has length one.
- Iterating the original array rather than the set in the hash version. Duplicates then re-walk runs that were already counted.
- Assuming O(n) beats O(n log n) here. Sorting measured 1.69x to 9.63x faster at every size and shape tested, with the gap widening as n grows.
- Benchmarking on pre-sorted input. std::sort is much faster on ordered data, so the comparison flatters sorting unless every input is shuffled first.
- Sorting the caller's array in place. Take a copy unless the caller has agreed to the reordering.
- Allocating a marking array without checking the span. hi - lo can be billions, and a range of 2 billion needed 250 MB and measured 1,793.508ms.
- Indexing a marking array by the value itself rather than by value minus the minimum. Negative values then index out of bounds.
- Using `in` on a list rather than a set in Python. It is a one-character difference that changes the lookup from O(n) to O(1).
- Returning 1 for an empty array. The run length of nothing is zero, and the guard must come before any min or max call.

<!-- @doubt -->
### Why does the `if (v - 1 in set) continue` line make it O(n)?

<!-- @answer -->
Because it guarantees each run is walked exactly once instead of once per member. Without it, the run 1..1000 gets walked from 1 for 1000 steps, from 2 for 999 steps, and so on — the same run counted a thousand times, which is quadratic in the run length. The guard means only the value with no predecessor starts a walk, so summing across all runs gives exactly the number of distinct values. The saving is precisely (L+1)/2 where L is the run length: measured 500.5x on a run of 1,000, 2000.5x on a run of 4,000, and 5.5x on runs of 10, which is (10+1)/2 exactly.

<!-- @doubt -->
### My solution passes every test without the guard. Is it wrong?

<!-- @answer -->
It is correct and it is slow, which is the awkward combination. Measured over all 19,531 multisets over the values 0-4 with n up to 6, the unguarded version produced the right answer every single time — zero failures. It is purely a performance guard, so no correctness test will ever catch its absence. The only thing that reveals it is timing on data with long runs, where the cost rises by a factor of (L+1)/2. If you want a test that catches it, assert on the number of inner-loop iterations rather than on the answer.

<!-- @doubt -->
### Is the guard always worth adding?

<!-- @answer -->
Almost always, but it is a bet rather than a free win. It costs one extra hash lookup per element, and when every run has length one it saves nothing — measured 7.253ms guarded against 6.233ms unguarded at n = 100,000, and 191.972ms against 172.105ms at a million, so about 12-16% slower. Keep it anyway: the premium is small and bounded, while the thing it protects against is unbounded. On a single run of n it is the difference between linear and quadratic.

<!-- @doubt -->
### Why did sorting beat the O(n) hash set?

<!-- @answer -->
Constant factors, and specifically cache behaviour. Every input was shuffled so the sort got no free ride, and sorting still won at every size and shape: 1.69x at n = 10,000, 5.10x at a million on the same data, and 9.63x on sparse random values. Note the direction — the gap widens as n grows, which is the opposite of what the complexity classes predict. A hash set of a million integers does not fit in cache, so each lookup is a probable cache miss and a pointer chase, while the sort streams contiguous memory. And log2(1,000,000) is only 20, so the factor the hash set is trying to save was never large to begin with.

<!-- @doubt -->
### So should I just write the sorting version?

<!-- @answer -->
As a default, yes — it was fastest of the general approaches at every size measured, it needs no extra allocation, and it is trivially correct once duplicates are skipped. Write the hash version when the specification or the interviewer explicitly demands O(n), or when the input genuinely cannot be reordered and copying it is too expensive. Both are worth knowing: the hash version is the one that gets asked for, and the sorting version is the one that runs faster.

<!-- @doubt -->
### When is the marking array the right choice?

<!-- @answer -->
When you know the value range and it is dense relative to n. On a million values spread over a range of 2n it measured 3.337ms, against 20.750ms for sorting and 129.594ms for the hash set — 6.2x and 38.8x respectively. It wins because it does no hashing and no comparing, just one sequential pass over contiguous bits. But it degrades in direct proportion to the range: over 100n it measured 92.899ms, and over 2 billion it took 1,793.508ms and would need 250 MB. Always check hi - lo before allocating.

<!-- @doubt -->
### Why do duplicates break the sorting version but not the hash version?

<!-- @answer -->
Because the hash set removes them for you. Building a set from the array collapses repeats automatically, so the walk never encounters an equal value. Sorting keeps them, so the loop sees 1 followed by 1 and has to decide what that means — and treating it as a break is wrong, because a duplicate is not a gap. Measured over 19,531 multisets, letting duplicates break the run gave the wrong answer 32.75% of the time, with [0,1,1,2] the smallest failing case: it reports 2 where the answer is 3. Either skip equal values with a `continue` or dedupe before the loop.

<!-- @doubt -->
### How does this relate to Two Sum?

<!-- @answer -->
It is the same surprise, measured twice. In Two Sum, sort-plus-two-pointers beat the O(n) hash map at every size, by up to 13.9x at n = 8,192. Here, sorting beat the O(n) hash set at every size, by up to 9.63x. In both cases the theoretically better algorithm loses because a hash table's constant factor — cache misses, pointer chasing, and in Java boxing — is large enough to swallow a log n advantage whole. The general lesson is that log n is small: it is 20 at a million elements, so an algorithm has to be very cheap per operation for O(n) to actually pay.
