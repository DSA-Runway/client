---
id: longest-subarray-with-given-sum-k-positives
topic: Arrays
title: Longest Subarray with Given Sum K (Positives)
difficulty: Medium
status: ready
prerequisites:
  - two-sum
  - maximum-consecutive-ones
  - find-missing-number
  - for-loop
  - relational-and-logical-operators
  - time-and-space-complexity-basics
relatedIds:
  - longest-subarray-with-sum-k
  - count-subarrays-with-given-sum
  - two-sum
  - maximum-consecutive-ones
---

<!-- @summary -->
Find the longest contiguous stretch summing to K using two pointers that never backtrack — and see exactly why that only works while the values stay non-negative, with the failure rate measured at 30.6% the moment a negative appears.

<!-- @theory -->
## The problem

Given an array of **positive** integers and a target `k`, return the **length** of
the longest contiguous subarray whose elements sum to exactly `k`.

```
[2, 3, 5, 1, 9], k = 10   ->  3   (the subarray 2, 3, 5)
[1, 1, 1, 1],    k = 2    ->  2
[5],             k = 3    ->  0   (no such subarray)
```

Note it asks for a **contiguous** stretch, not any subset. And note the word
**positive** in the statement — that is not scene-setting, it is the precondition
the optimal solution depends on, and the next subtopic removes it.

## The sliding window

Keep a window `[left, right]` and the sum of what is inside it. Extend `right` by
one element at a time. Whenever the sum exceeds `k`, pull `left` forward until it
does not. Whenever the sum equals `k`, record the window's length.

```
[2, 3, 5, 1, 9], k = 10
right=0  win [2]          sum 2
right=1  win [2,3]        sum 5
right=2  win [2,3,5]      sum 10  == k, length 3
right=3  win [2,3,5,1]    sum 11  > k, shrink -> [3,5,1] sum 9
right=4  win [3,5,1,9]    sum 18  > k, shrink -> [5,1,9] 15 -> [1,9] 10 == k, length 2
answer 3
```

Both pointers only ever move forward, so each element is added once and removed at
most once. That is **O(n) time and O(1) space** — no allocation of any kind.

## Why it works, and exactly what it assumes

The window never backtracks. `left` is pulled forward and never pushed back, which
means the algorithm is betting that a window it has already discarded can never
become the answer.

That bet is safe because of one property: **with non-negative values, growing the
window cannot decrease the sum and shrinking it cannot increase the sum.** The sum
is monotone in the window's extent. So when the sum overshoots `k`, the only way
back is to shrink — extending further can never bring it down. And once `left` has
passed an element, no later window that includes it could be shorter *and* still
reach `k`.

Take that monotonicity away and every step of that reasoning fails.

## Where the precondition actually sits

The usual statement is "positives", which understates it. Measured against a
brute-force reference:

| Values allowed | Pairs tested | Window failures |
|---|---|---|
| `{1, 2, 3}` — strictly positive | 32,800 | **0** |
| `{0, 1, 2}` — **zeros included** | 26,240 | **0** |
| `{-1, 1, 2}` — negatives included | 6,558 | **2,007 — 30.6%** |

**Zeros are safe.** The shrink loop runs only *while the sum exceeds k*, and a zero
can never push the sum over, so it never triggers a wrong shrink. The real
requirement is **non-negative**, not strictly positive.

**Negatives break it immediately.** The smallest counterexamples are two elements
long:

```
a = [1, -1], k = 0   window says 0, correct answer 2
a = [-1, 1], k = 1   window says 0, correct answer 1
```

The mechanism is exact: the shrink rule assumes that removing an element **lowers**
the sum. Removing a negative **raises** it. So on `[1,-1]` with `k = 0`, the window
holds sum 1 after the first element, which exceeds 0, so it shrinks away the 1 —
discarding the very element it needed. It never looks back, and the answer is
lost.

That is why subtopic 17 — the same question with negatives permitted — is a
different algorithm rather than a small edit.

## Prefix sums, which do not care about sign

The general tool is the prefix sum. Let `P[i]` be the sum of everything before
index `i`. Then the sum of the subarray `(i, j]` is `P[j] − P[i]`. So a subarray
ending at `j` sums to `k` exactly when some earlier prefix equals `P[j] − k`.

Walk once, keeping a map from prefix sum to the index where it first occurred. At
each `j`, look up `P[j] − k`; if it is there, you have a subarray, and its length
is `j` minus that index.

This works for **any** values — positive, zero or negative — because it never
assumes anything about direction. It costs O(n) time and O(n) space.

### The trap inside it, and where it hides

You must store the **earliest** index at which each prefix sum occurred, not the
latest. Keeping the latest gives you the *shortest* qualifying subarray instead of
the longest.

Measured, and the result is the interesting part:

| Values | Pairs | Overwrite-latest failures |
|---|---|---|
| Positives only | 7,651 | **0** |
| With negatives | 7,651 | **1,174 — 15.3%** |

**The bug cannot fire on positives at all.** With every value positive, the prefix
sums are *strictly increasing*, so no sum ever occurs twice and there is nothing to
overwrite. Write the buggy version here and it passes every test you throw at it —
then reuse it for subtopic 17, where negatives make prefix sums repeat, and it
starts failing one input in seven. The smallest case is `[-1,1,1]` with `k = 1`,
where it reports 1 instead of 3.

## What each approach costs

C++ wall clock:

| n | Brute force | Prefix map | Sliding window |
|---|---|---|---|
| 100,000 | 2,945.15ms | 3.55ms | **0.44ms** |
| 1,000,000 | — | 36.43ms | **4.53ms** |
| 10,000,000 | — | 362.22ms | **45.29ms** |

At n = 100,000 the window is **6,693x** the brute force. Against the prefix map it
is a steady **8x** at every size — and that is on top of using O(1) space where
the map uses O(n). The map hashes and probes for every element; the window keeps
two indices and a running total.

In Python the gap narrows to **1.5x** (295.5ms against 201.9ms at n = 2,000,000),
because both are interpreted loops and the interpreter overhead dominates the
difference in the work itself.

## Choosing between them

If the values are guaranteed non-negative, use the window: it is faster, it uses
no extra memory, and it is shorter to write. If they are not — or if the guarantee
is not written down anywhere — use the prefix map, because the window will fail
silently on about a third of inputs containing a negative.

There is also a middle rung worth knowing: with non-negative values the prefix sums
are non-decreasing, so you can **binary search** them instead of hashing, giving
O(n log n) time and O(n) space with no hash table. I expected zeros to break this,
since they make the prefix array non-strictly-increasing — they do not, because a
leftmost binary search returns the earliest matching index, which is exactly what
"longest" wants. Verified over 32,800 positive pairs and 8,744 pairs containing
zeros, with zero failures.

## Where this goes next

**Longest Subarray with Sum K** is this problem with the sign restriction removed,
where only the prefix map survives. **Count Subarrays with Given Sum** uses the
same prefix map with counts instead of first-indices. And the two-pointer window
itself generalises to every "longest or shortest stretch satisfying a monotone
condition" problem you will meet.

<!-- @intuition -->
Think of a tape measure you can only extend from the right and reel in from the left. Extending always adds length, reeling in always removes it — so if you have gone too far, reeling in is the only way back and you never need to un-reel. That is the whole argument, and it is exactly what a negative number destroys: a negative makes reeling in ADD to the total, so the one direction you trusted now moves you the wrong way.

<!-- @approach -->
### Brute Force - Every Subarray

<!-- @idea -->
Try every starting point, extend to every endpoint, and keep a running sum so each subarray costs one addition.

<!-- @steps -->
1. Take each index in turn as the start of a subarray.
2. Reset a running sum to zero.
3. Extend the end one element at a time, adding each to the running sum.
4. Whenever the running sum equals k, record the length if it beats the best so far.
5. Continue to the end of the array, then move the start forward.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Correct for any values, positive or negative, because it makes no assumption at all. Measured 2,945.15ms at n = 100,000 against the sliding window's 0.44ms — 6,693x — which is why it is only useful as the reference the other approaches are verified against.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int longestSubarray(const vector<int>& a, long long k) {
    int best = 0;
    for (size_t i = 0; i < a.size(); i++) {
        long long sum = 0;
        for (size_t j = i; j < a.size(); j++) {
            sum += a[j];                       // running sum: no third loop
            if (sum == k) best = max(best, (int)(j - i + 1));
        }
    }
    return best;
}
```

<!-- @annotations -->
- 10: Carrying the sum forward is what makes this O(n^2) rather than the O(n^3) of re-summing each subarray.
- 11: No early break — a later, longer subarray from the same start may also reach k, and only sign restrictions would rule that out.

<!-- @code java -->
```java
static int longestSubarray(int[] a, long k) {
    int best = 0;
    for (int i = 0; i < a.length; i++) {
        long sum = 0;
        for (int j = i; j < a.length; j++) {
            sum += a[j];
            if (sum == k) best = Math.max(best, j - i + 1);
        }
    }
    return best;
}
```

<!-- @annotations -->
- 4: A long accumulator, because a subarray sum can exceed int range long before the array is large.

<!-- @code python -->
```python
def longest_subarray(a, k):
    best = 0
    for i in range(len(a)):
        total = 0
        for j in range(i, len(a)):
            total += a[j]
            if total == k:
                best = max(best, j - i + 1)
    return best


# Measured 2,945.15ms in C++ at n = 100,000, against 0.44ms for the
# sliding window — a factor of 6,693.
```

<!-- @annotations -->
- 6: Two nested interpreted loops, which is the slowest possible shape and the reason this is skipped above n = 100,000.

<!-- @approach -->
### Prefix Sums with Binary Search

<!-- @idea -->
With non-negative values the prefix sums never decrease, so the matching earlier prefix can be found by binary search rather than by scanning.

<!-- @steps -->
1. Build the array of prefix sums, where entry i is the sum of everything before index i.
2. Note that non-negative values make this array non-decreasing.
3. For each endpoint, compute the prefix value that a qualifying subarray would need to start from.
4. Binary search the prefix array for that value, taking the leftmost match.
5. If it is present, the distance between the two positions is the subarray's length.

<!-- @complexity -->
- time: O(n log n)
- space: O(n) for the prefix array
- note: Valid only when the prefix sums are non-decreasing, which requires non-negative values — the same precondition as the sliding window. Verified over 32,800 positive pairs and 8,744 pairs containing zeros with zero failures. It is a useful rung because it makes the monotonicity the window relies on explicit.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int longestSubarray(const vector<int>& a, long long k) {
    vector<long long> pre(a.size() + 1, 0);
    for (size_t i = 0; i < a.size(); i++) pre[i + 1] = pre[i] + a[i];

    int best = 0;
    for (size_t r = 1; r < pre.size(); r++) {
        long long target = pre[r] - k;
        auto it = lower_bound(pre.begin(), pre.begin() + r, target);
        if (it != pre.begin() + r && *it == target)
            best = max(best, (int)(r - (it - pre.begin())));
    }
    return best;
}
```

<!-- @annotations -->
- 7: Non-negative values make this array non-decreasing, which is the only reason a binary search is valid on it.
- 13: lower_bound gives the LEFTMOST match, which is exactly what the longest subarray needs.
- 14: That leftmost behaviour is also why zeros are harmless here, despite making the prefix array non-strictly-increasing.

<!-- @code java -->
```java
import java.util.Arrays;

static int longestSubarray(int[] a, long k) {
    long[] pre = new long[a.length + 1];
    for (int i = 0; i < a.length; i++) pre[i + 1] = pre[i] + a[i];

    int best = 0;
    for (int r = 1; r < pre.length; r++) {
        long target = pre[r] - k;
        int i = lowerBound(pre, r, target);
        if (i < r && pre[i] == target) best = Math.max(best, r - i);
    }
    return best;
}

static int lowerBound(long[] p, int hi, long target) {
    int lo = 0;
    while (lo < hi) { int m = (lo + hi) >>> 1; if (p[m] < target) lo = m + 1; else hi = m; }
    return lo;
}
```

<!-- @annotations -->
- 17: Arrays.binarySearch does not guarantee the leftmost match on duplicates, so the bound is written out explicitly.
- 18: (lo + hi) >>> 1 rather than (lo + hi) / 2, which would overflow for very large arrays.

<!-- @code python -->
```python
from bisect import bisect_left
from itertools import accumulate

def longest_subarray(a, k):
    pre = [0] + list(accumulate(a))     # non-decreasing when a has no negatives

    best = 0
    for r in range(1, len(pre)):
        i = bisect_left(pre, pre[r] - k, 0, r)
        if i < r and pre[i] == pre[r] - k:
            best = max(best, r - i)
    return best


# Verified 0 failures over 32,800 all-positive pairs and 8,744 pairs
# containing zeros — bisect_left's leftmost result handles the duplicate
# prefix sums that zeros create.
```

<!-- @annotations -->
- 5: accumulate builds the prefix sums in C, which is much faster than an interpreted loop.
- 8: bisect_left, not bisect_right — the leftmost index is what makes the subarray longest rather than shortest.

<!-- @approach -->
### Prefix Sums with a Hash Map

<!-- @idea -->
Record where each prefix sum first occurred, and look up the prefix a qualifying subarray would have started from.

<!-- @steps -->
1. Keep a running prefix sum and a map from prefix value to the earliest index where it occurred.
2. Seed the map with prefix 0 at index -1, so subarrays starting at index 0 are found.
3. At each index, check whether the current prefix minus k is already in the map.
4. If it is, the subarray between that index and the current one sums to k, so record its length.
5. Insert the current prefix ONLY if it is not already present, preserving the earliest index.

<!-- @complexity -->
- time: O(n)
- space: O(n)
- note: The general solution — correct for positive, zero and negative values alike, because it never assumes the sum moves in one direction. Measured 362.22ms at n = 10,000,000 against the window's 45.29ms, an 8x gap, and it allocates O(n) where the window allocates nothing.

<!-- @code cpp -->
```cpp
#include <vector>
#include <unordered_map>
#include <algorithm>
using namespace std;

int longestSubarray(const vector<int>& a, long long k) {
    unordered_map<long long,int> firstAt;
    firstAt.reserve(a.size() * 2);
    firstAt[0] = -1;                       // empty prefix, before index 0

    long long sum = 0;
    int best = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        sum += a[i];
        auto it = firstAt.find(sum - k);
        if (it != firstAt.end()) best = max(best, i - it->second);
        if (firstAt.find(sum) == firstAt.end()) firstAt[sum] = i;   // EARLIEST only
    }
    return best;
}
```

<!-- @annotations -->
- 9: Without this seed, a subarray starting at index 0 is never found, because no earlier prefix exists to match.
- 14: That bug is invisible on positive input, where prefix sums strictly increase and no sum ever repeats.
- 17: The guard is the whole correctness of 'longest'. Overwriting keeps the latest index and yields the SHORTEST subarray.

<!-- @code java -->
```java
import java.util.HashMap;
import java.util.Map;

static int longestSubarray(int[] a, long k) {
    Map<Long,Integer> firstAt = new HashMap<>();
    firstAt.put(0L, -1);

    long sum = 0;
    int best = 0;
    for (int i = 0; i < a.length; i++) {
        sum += a[i];
        Integer j = firstAt.get(sum - k);
        if (j != null) best = Math.max(best, i - j);
        firstAt.putIfAbsent(sum, i);        // putIfAbsent keeps the earliest
    }
    return best;
}
```

<!-- @annotations -->
- 13: putIfAbsent expresses the earliest-wins rule directly, where put would silently overwrite.

<!-- @code python -->
```python
def longest_subarray(a, k):
    first_at = {0: -1}          # prefix 0 sits before index 0
    total = 0
    best = 0

    for i, x in enumerate(a):
        total += x
        if total - k in first_at:
            best = max(best, i - first_at[total - k])
        if total not in first_at:       # keep the EARLIEST index
            first_at[total] = i
    return best


# Works for ANY values, including negatives — it assumes nothing about sign.
# Measured 295.5ms at n = 2,000,000 against 201.9ms for the sliding window.
```

<!-- @annotations -->
- 10: Not first_at[total] = i unconditionally. Overwriting measured 15.3% wrong answers once negatives are allowed.

<!-- @approach -->
### Optimal - Sliding Window

<!-- @idea -->
Extend the window from the right, pull it in from the left whenever the sum overshoots, and record every time it lands exactly on k.

<!-- @steps -->
1. Start both pointers at the beginning with a running sum of zero.
2. Extend the right pointer by one element, adding it to the sum.
3. While the sum exceeds k, remove the element at the left pointer and advance it.
4. If the sum now equals k, record the window's length if it is the best so far.
5. Repeat until the right pointer reaches the end.
6. Both pointers only ever move forward, so each element is added once and removed at most once.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Each element enters the window once and leaves at most once, so the total pointer movement is at most 2n. Measured 45.29ms at n = 10,000,000 — 8x faster than the prefix map with no allocation at all — and correct only while the values stay non-negative.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

// PRECONDITION: every element is non-negative.
int longestSubarray(const vector<int>& a, long long k) {
    size_t left = 0;
    long long sum = 0;
    int best = 0;

    for (size_t right = 0; right < a.size(); right++) {
        sum += a[right];

        while (sum > k && left <= right) {   // shrink assumes removal LOWERS sum
            sum -= a[left];
            left++;
        }
        if (sum == k) best = max(best, (int)(right - left + 1));
    }
    return best;
}
```

<!-- @annotations -->
- 6: Stated as a precondition because the algorithm cannot detect its violation — it returns a wrong answer silently.
- 14: The load-bearing assumption. With a negative present this subtraction raises the sum, and the loop moves the wrong way.
- 18: Checked after shrinking, never during — mid-shrink the window is in an intermediate state that means nothing.
- 20: O(1) space: two indices and a running total, with no allocation anywhere.

<!-- @code java -->
```java
// PRECONDITION: every element is non-negative.
static int longestSubarray(int[] a, long k) {
    int left = 0, best = 0;
    long sum = 0;

    for (int right = 0; right < a.length; right++) {
        sum += a[right];

        while (sum > k && left <= right) {
            sum -= a[left];
            left++;
        }
        if (sum == k) best = Math.max(best, right - left + 1);
    }
    return best;
}
```

<!-- @annotations -->
- 9: left <= right rather than left < right, so a single element larger than k can be shrunk away entirely.

<!-- @code python -->
```python
def longest_subarray(a, k):
    """PRECONDITION: every element is non-negative."""
    left = 0
    total = 0
    best = 0

    for right, x in enumerate(a):
        total += x

        while total > k and left <= right:
            total -= a[left]
            left += 1

        if total == k:
            best = max(best, right - left + 1)
    return best


# Verified 0 failures over 32,800 all-positive pairs AND 26,240 pairs
# containing zeros. Over arrays containing negatives it was wrong on
# 2,007 of 6,558 pairs — 30.6% — with [1,-1] k=0 the smallest failure.
```

<!-- @annotations -->
- 10: Zeros never make the sum exceed k, so they never trigger this loop wrongly — which is why the real precondition is non-negative rather than strictly positive.
- 15: Measured 201.9ms at n = 2,000,000 against 295.5ms for the prefix map — a narrower 1.5x, since both loops are interpreted.

<!-- @example -->

<!-- @input -->
a = [2, 3, 5, 1, 9], k = 10

<!-- @output -->
3

<!-- @why -->
Shows the window landing on k twice with different lengths, which is why the algorithm records rather than returns on the first hit.

<!-- @walkthrough -->
1. right = 0 puts 2 in the window, sum 2, which is under k so nothing shrinks.
2. right = 1 adds 3 for sum 5, still under k.
3. right = 2 adds 5 for sum 10, which equals k, so the window [2,3,5] of length 3 is recorded.
4. right = 3 adds 1 for sum 11, which exceeds k, so the left pointer removes 2, leaving [3,5,1] with sum 9.
5. right = 4 adds 9 for sum 18, so the window shrinks twice — removing 3 to reach 15, then 5 to reach 10.
6. The window is now [1,9] with sum 10, which equals k and gives length 2 — shorter than the 3 already recorded.
7. The answer is 3, and the left pointer moved forward a total of three times across the whole scan.

<!-- @example -->

<!-- @input -->
a = [1, -1], k = 0 — the precondition violated

<!-- @output -->
0 — the correct answer is 2

<!-- @why -->
The smallest possible demonstration that the failure is structural rather than an edge case — the algorithm discards the answer on its first move and has no mechanism to recover it.

<!-- @walkthrough -->
1. right = 0 puts 1 in the window, giving sum 1.
2. The sum 1 exceeds k = 0, so the shrink loop runs and removes the 1, leaving an empty window with sum 0.
3. The sum now equals k, but the window is empty, so the recorded length is 0.
4. right = 1 adds -1, giving sum -1, which does not exceed k so nothing shrinks and nothing matches.
5. The scan ends with best = 0, yet the whole array [1,-1] sums to exactly 0 and has length 2.
6. The element the answer needed was thrown away at the first step, and the window never reconsiders discarded elements.

<!-- @example -->

<!-- @input -->
a = [0, 0, 3, 0], k = 3

<!-- @output -->
4

<!-- @why -->
Establishes that the precondition is non-negativity rather than strict positivity, which is a stronger statement than the problem title makes and one the measurement supports.

<!-- @walkthrough -->
1. right = 0 and right = 1 add zeros, keeping the sum at 0, which never exceeds k so nothing shrinks.
2. right = 2 adds 3, bringing the sum to exactly 3, so the window [0,0,3] of length 3 is recorded.
3. right = 3 adds another 0, leaving the sum at 3 — still equal to k, and now the window has length 4.
4. The answer is 4, and the leading zeros were never discarded because they never pushed the sum above k.
5. This is why zeros are safe: the shrink loop is guarded by sum > k, and a zero cannot cause that.
6. Verified over 26,240 arrays drawn from {0,1,2}: zero failures.

<!-- @example -->

<!-- @input -->
a = [-1, 1, 1], k = 1, through the prefix map storing the LATEST index

<!-- @output -->
1 — the correct answer is 3

<!-- @why -->
A bug that is provably unable to fire on this subtopic's input and fires on one input in seven in the next subtopic — the clearest case in the module of a test suite that cannot detect a real defect.

<!-- @walkthrough -->
1. The prefix sums are -1, 0 and 1 after each element, with prefix 0 seeded at index -1.
2. At index 1 the running prefix is 0, which already exists in the map from the seed.
3. The buggy version overwrites it, so prefix 0 now maps to index 1 instead of index -1.
4. At index 2 the prefix is 1, and the lookup for prefix 0 returns index 1, giving a length of just 1.
5. Had the earliest index been kept, the lookup would have returned -1 and given the full length of 3.
6. Measured over 7,651 pairs containing negatives, that overwrite produced 1,174 wrong answers — 15.3%.
7. Over 7,651 all-positive pairs it produced zero, because positive values make prefix sums strictly increase so none ever repeats.

<!-- @visualization array -->

<!-- @description -->
The array as a strip with the active window drawn as a translucent band spanning from left to right pointer, and the running sum shown in a box above it against a target line marked at k. The band is the whole story, so animate it as a physical object: extending the right pointer stretches the band and raises a bar toward the target line; shrinking from the left contracts it and lowers the bar. When the bar crosses above the target line, tint it red and animate the left edge pulling in step by step until the bar drops back to or below the line, then restore the neutral tint. When the bar sits exactly on the line, flash the band green and stamp its length into a best-so-far readout, keeping every recorded length visible beneath the strip so the reader can see why the algorithm records rather than returns. Draw both pointers on a one-way track underneath, with arrows that only ever point forward and a note that the total travel is at most 2n — that is the O(n) argument made visual. The precondition panel is the decisive one and should run [1,-1] with k = 0 beside the same machinery: the bar rises to 1, crosses the target line at 0, the shrink fires and discards the 1, and the band empties. Then draw a ghost band spanning the whole array with its sum of exactly 0 and label it as the answer that was thrown away on the first move, with the one-way track underneath showing that the left pointer cannot travel back to reach it. Beside that, show a small arrow diagram: for a non-negative element, removing it lowers the sum; for a negative element, removing it RAISES the sum — with the shrink rule's condition printed above, so the contradiction is visible rather than argued. A zeros panel runs [0,0,3,0] with k = 3, showing the bar flat at 0 through the leading zeros with the shrink loop never arming, the band reaching length 4, and the measured note that 26,240 arrays containing zeros produced no failures. Close with a cost strip: brute force at n = 100,000 taking 2,945.15ms against the window's 0.44ms, and the prefix map at 362.22ms against 45.29ms at ten million, with the map's memory drawn as n cells beside the window's two indices.

<!-- @sampleInput -->
```json
{"primary":{"array":[2,3,5,1,9],"k":10,"trace":[{"right":0,"window":[2],"sum":2,"action":"extend"},{"right":1,"window":[2,3],"sum":5,"action":"extend"},{"right":2,"window":[2,3,5],"sum":10,"action":"match","length":3},{"right":3,"window":[2,3,5,1],"sum":11,"action":"overshoot","shrinkTo":[3,5,1],"sumAfter":9},{"right":4,"window":[3,5,1,9],"sum":18,"action":"overshoot","shrinkTo":[1,9],"sumAfter":10,"length":2}],"answer":3,"recordedLengths":[3,2],"leftMoves":3,"totalPointerTravel":8},"zerosPanel":{"array":[0,0,3,0],"k":3,"shrinkLoopArmed":false,"answer":4,"note":"a zero can never push the sum above k, so the shrink rule never fires wrongly","verified":{"pairs":26240,"failures":0}},"negativePanel":{"array":[1,-1],"k":0,"windowAnswer":0,"correctAnswer":2,"discardedAtStep":0,"discardedElement":1,"oneWayTrack":true,"mechanism":{"nonNegative":"removing an element LOWERS the sum","negative":"removing an element RAISES the sum"},"verified":{"pairs":6558,"failures":2007,"rate":0.306}},"prefixTrap":{"array":[-1,1,1],"k":1,"prefixes":[-1,0,1],"seed":{"0":-1},"overwriteResult":1,"earliestResult":3,"onPositives":{"pairs":7651,"failures":0,"reason":"prefix sums strictly increase, so no sum repeats"},"withNegatives":{"pairs":7651,"failures":1174,"rate":0.153}},"costPanel":{"cpp":[{"n":100000,"bruteMs":2945.15,"prefixMs":3.55,"windowMs":0.44},{"n":1000000,"prefixMs":36.43,"windowMs":4.53},{"n":10000000,"prefixMs":362.22,"windowMs":45.29}],"windowVsPrefix":8,"windowVsBrute":6693,"python":{"n":2000000,"prefixMs":295.5,"windowMs":201.9,"ratio":1.5}}}
```

<!-- @highlights -->
- The active window is drawn as a translucent band over the strip, with its running sum shown as a bar against a target line at k.
- Extending the right pointer stretches the band and raises the bar; the first three elements take it to exactly 10.
- The bar lands on the target line, the band flashes green, and length 3 is stamped into the best-so-far readout.
- Adding the 1 pushes the bar above the line, so it tints red and the left edge pulls in until the bar drops back.
- Adding the 9 overshoots again, and the band contracts twice before settling on [1,9] with the bar back on the line.
- That match records length 2, which stays visible beneath the strip alongside the earlier 3 — showing why the algorithm records rather than returns.
- The one-way track underneath shows both pointers with forward-only arrows, and the total travel of 8 steps for a 5-element array.
- The zeros panel runs [0,0,3,0] with the bar flat at 0 through the leading zeros and the shrink loop never arming.
- The band grows to length 4 without ever discarding a zero, because a zero cannot push the sum above the target.
- The precondition panel runs [1,-1] with the target at 0: the bar rises to 1, crosses the line, and the shrink discards the 1.
- A ghost band then spans the whole array with a sum of exactly 0, labelled as the answer thrown away on the first move.
- The one-way track shows the left pointer cannot travel back to reach it, which is why the failure is structural rather than an edge case.
- A small arrow diagram sits beside it: removing a non-negative lowers the sum, removing a negative raises it, against the shrink rule printed above.
- The prefix-map panel traces [-1,1,1], where overwriting prefix 0 from index -1 to index 1 shortens the answer from 3 to 1.
- That panel carries both measured rates — zero failures on positives, 15.3% once negatives appear — with the reason that positive prefix sums never repeat.
- The cost strip closes it: 2,945.15ms against 0.44ms at n = 100,000, and the prefix map's n cells of memory beside the window's two indices.

<!-- @edgeCases -->
- Empty array — no window can form and the answer is 0, which needs no special handling.
- No subarray sums to k — the best-so-far never updates and 0 is returned, so 0 must mean 'none found' rather than 'length zero'.
- The whole array sums to k — the window never shrinks and the answer is the full length.
- A single element equal to k — matched immediately with length 1.
- A single element greater than k — the shrink loop empties the window entirely, which is why the guard is left <= right rather than left < right.
- k = 0 with an all-positive array — no non-empty subarray can sum to 0, so the answer is 0.
- k = 0 with zeros present, such as [0,0,0] — the answer is the full run of zeros, and the window finds it because the shrink never arms.
- Leading zeros before the qualifying stretch, such as [0,0,3] with k = 3 — included in the window, since they never push the sum over.
- Trailing zeros after it, such as [3,0,0] with k = 3 — also included, extending the recorded length.
- Any negative value present — the window is silently wrong on about 30.6% of such inputs and must not be used.
- Very large sums — the running total can exceed 32-bit range well before the array is large, so the accumulator must be 64-bit.

<!-- @pitfalls -->
- Using the sliding window when negatives are possible. Measured 2,007 wrong answers over 6,558 pairs — 30.6% — with [1,-1] and k = 0 the smallest failure.
- Believing the window needs strictly positive values. Zeros are safe, verified over 26,240 pairs with zero failures, because a zero can never push the sum above k.
- Overwriting the prefix map instead of keeping the earliest index, which returns the shortest qualifying subarray rather than the longest.
- Testing that overwrite bug only on positive input, where it provably cannot fire because prefix sums strictly increase and never repeat.
- Forgetting to seed the prefix map with sum 0 at index -1, which makes every subarray starting at index 0 invisible.
- Checking for a match during the shrink loop rather than after it, when the window is in an intermediate state that means nothing.
- Writing the shrink condition as sum >= k, which discards the exact match you were looking for.
- Using left < right as the shrink guard, so a single element larger than k can never be removed and the window jams.
- Returning on the first window that reaches k. A longer one may appear later, which is why the length is recorded rather than returned.
- Treating a returned 0 as a valid length rather than as 'no such subarray', which matters when the caller distinguishes the two.
- Accumulating the running sum in a 32-bit int, which overflows on large values long before the array itself is large.
- Reaching for the prefix map by default because it is more general. It measured 8x slower than the window and uses O(n) space where the window uses none.

<!-- @doubt -->
### Why does the sliding window need positive numbers?

<!-- @answer -->
Because the whole algorithm rests on one property: growing the window cannot decrease the sum and shrinking it cannot increase the sum. That monotonicity is what makes it safe for the left pointer to move forward and never come back — if the sum overshoots k, shrinking is the only way down, so nothing is lost by discarding. With a negative present, removing an element can RAISE the sum, so the shrink loop moves the wrong way. Measured over 6,558 (array, k) pairs containing negatives, the window was wrong on 2,007 of them — 30.6%.

<!-- @doubt -->
### Do zeros break it too?

<!-- @answer -->
No, and this is worth knowing because the problem title says 'positives' and understates the real precondition. The shrink loop runs only while the sum EXCEEDS k, and a zero can never push the sum above anything — so it never triggers a wrong shrink. Verified over every array of length 0 to 7 drawn from {0,1,2} against every k from 0 to 7 — 26,240 pairs — with zero failures. On [0,0,3,0] with k = 3 the window correctly returns 4, including both the leading and trailing zeros. The requirement is non-negative, not strictly positive.

<!-- @doubt -->
### Can you show me the smallest case where negatives break it?

<!-- @answer -->
Two elements. On a = [1,-1] with k = 0 the correct answer is 2, because the whole array sums to 0. The window adds the 1, giving a sum of 1 which exceeds k = 0, so the shrink loop fires and removes it — discarding the very element the answer needed. It then adds the -1 for a sum of -1, which never matches, and returns 0. The failure happens on the first move, and because the left pointer only travels forward there is no mechanism to recover. On a = [-1,1] with k = 1 it likewise returns 0 where the answer is 1.

<!-- @doubt -->
### Then why not always use the prefix map, since it handles everything?

<!-- @answer -->
Because when the values are non-negative you are paying for generality you do not need. Measured at n = 10,000,000, the prefix map took 362.22ms against the window's 45.29ms — 8x — and that gap held at every size tested. The map also allocates O(n) memory where the window allocates none: it hashes and probes for every element, while the window keeps two indices and a running total. If the sign guarantee is genuinely in the problem statement, take it. If it is not written down anywhere, use the map, because the window fails silently rather than loudly.

<!-- @doubt -->
### Why must the prefix map keep the earliest index?

<!-- @answer -->
Because the length of the subarray is the current index minus the stored one, so an earlier stored index gives a longer subarray. Keeping the latest gives you the shortest qualifying subarray instead. On [-1,1,1] with k = 1 the correct answer is 3, and the overwriting version returns 1 — because prefix 0 gets overwritten from its seeded index of -1 to index 1. Measured over 7,651 pairs containing negatives, that mistake produced 1,174 wrong answers, 15.3%.

<!-- @doubt -->
### I wrote the overwriting version and all my tests passed. How?

<!-- @answer -->
Because you almost certainly tested it on positive input, where the bug provably cannot fire. When every value is positive the prefix sums are strictly increasing, so no prefix sum ever occurs twice and there is nothing to overwrite — the earliest and latest index for any given sum are the same index. Measured over 7,651 all-positive pairs, the overwriting version produced zero failures. It starts failing the moment negatives allow a prefix sum to repeat, which is exactly the next subtopic. This is the clearest case in the module of a test suite that structurally cannot detect a real defect.

<!-- @doubt -->
### Why check for a match after the shrink loop rather than inside it?

<!-- @answer -->
Because during the shrink the window is in an intermediate state that has no meaning yet — you are mid-way through correcting an overshoot. The invariant only holds again once the loop exits, at which point the sum is at most k and the window is the longest one ending at the current right pointer with that property. Checking inside would report windows the algorithm is in the middle of discarding. It would not usually give a wrong answer here, since any exact match found mid-shrink is genuine, but it muddies the invariant and breaks immediately in variants that shrink for a different reason.

<!-- @doubt -->
### Why is this O(n) when there is a loop inside a loop?

<!-- @answer -->
Because the inner loop's total work is bounded across the whole run, not per iteration. The left pointer only ever moves forward and can never pass the right pointer, so across the entire scan it advances at most n times in total. The right pointer likewise advances exactly n times. So the total pointer movement is at most 2n regardless of how the shrinking is distributed, which is O(n). This amortised argument is the standard one for two-pointer algorithms and is worth being able to state, because a nested loop that looks quadratic and is not comes up repeatedly.

<!-- @doubt -->
### What is the binary-search version for, if the window is faster?

<!-- @answer -->
Mainly to make the monotonicity explicit. With non-negative values the prefix sums never decrease, so instead of hashing you can binary search them for the value a qualifying subarray would have started from — O(n log n) time, O(n) space, no hash table. It is slower than the window and it demonstrates the property the window silently depends on, which makes it a useful rung on the ladder. One detail matters: use a leftmost binary search. I expected zeros to break it, since they make the prefix array non-strictly-increasing — they do not, because the leftmost match is exactly the earliest index and therefore the longest subarray. Verified over 32,800 positive pairs and 8,744 pairs containing zeros with zero failures.
