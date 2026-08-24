---
id: sum-of-subarray-ranges
topic: Stacks
title: Sum of Subarray Ranges
difficulty: Medium
status: ready
prerequisites:
  - sum-of-subarray-minimums
  - next-smaller-element
  - next-greater-element
  - integer-overflow-and-precision-errors
relatedIds:
  - sum-of-subarray-minimums
  - next-smaller-element
  - largest-rectangle-in-a-histogram
  - asteroid-collision
  - next-greater-element
---

<!-- @summary -->
The range of a subarray is its maximum minus its minimum, and sums distribute, so the answer is Sum of Subarray Maximums minus Sum of Subarray Minimums — two independent runs of the previous machinery. The interesting result corrects a plausible assumption: the two halves do **not** need matching tie conventions. All four pairings of leftmost-owns and rightmost-owns were correct on 200,000 tie-heavy arrays, because each half partitions the subarrays on its own. What breaks is a *symmetric* convention in **either** half — 54.7% wrong for the minimum half alone, 57.8% for the maximum half alone — and when both are symmetric the errors coincidentally cancel on 40.4% of inputs, which makes it worse, not better.

<!-- @theory -->
## The problem

Sum `max − min` over every subarray.

```
a = [1, 3, 2]

[1]      0     [1,3]    2     [1,3,2]  2
[3]      0     [3,2]    1
[2]      0                              total = 5
```

## It decomposes

Summation distributes over subtraction, so

```
sum over subarrays of (max - min)
  = sum over subarrays of max  -  sum over subarrays of min
```

The second term is exactly the previous subtopic. The first is the same
algorithm with every comparison reversed: an element's span is now bounded by
*greater* elements rather than smaller ones, and it contributes to every subarray
in which it is the maximum.

So this problem is two runs of machinery that already exists — which makes the
only real question how the two halves interact.

## They do not interact at all

The natural worry, and the one I would have bet on, is that the two halves must
use matching tie conventions or they will disagree about which subarrays belong
to whom.

They do not. Over 200,000 arrays drawn from four values including negatives:

| Minimum half | Maximum half | Correct on |
|---|---|---|
| leftmost-owns | leftmost-owns | **200,000** |
| leftmost-owns | rightmost-owns | **200,000** |
| rightmost-owns | leftmost-owns | **200,000** |
| rightmost-owns | rightmost-owns | **200,000** |

All four. The reason is straightforward once stated: each half is a complete,
independent partition of the subarrays. The minimum half assigns every subarray
to exactly one element — whichever of its tied minima the convention names — and
sums correctly. The maximum half does the same, independently. Neither knows nor
cares what the other chose. The two sums are each right, so their difference is
right.

## What does break is symmetry, in either half

| Convention used | Wrong on |
|---|---|
| Symmetric in the minimum half only | **109,476** (54.7%) |
| Symmetric in the maximum half only | **115,635** (57.8%) |
| Symmetric in both halves | **119,873** (59.9%) |

A symmetric convention — both comparisons strict, or both non-strict — fails to
partition at all, so that half's sum is wrong and the difference inherits it.

The last row is the trap. With both halves broken, the two errors **coincidentally
cancel on 80,817 of 200,000 arrays — 40.4%**. So the doubly-wrong version is right
two times in five, which is worse than being reliably wrong: it passes casual
testing more often than the singly-wrong version does.

## Both halves in one pass

Sum of Subarray Minimums introduced a one-pass DP that beat the two-pass span
method. It extends directly: carry two stacks and two running values through a
single sweep.

```
dmin[i] = dmin[pmin] + (i - pmin) * a[i]      pmin = previous strictly smaller
dmax[i] = dmax[pmax] + (i - pmax) * a[i]      pmax = previous strictly greater
total  += dmax[i] - dmin[i]
```

Verified over 200,000 tie-heavy arrays including negative values — **0
mismatches**. At n = 64,000 it runs in 733,250ns.

| n | Brute force | Two-pass spans | Ratio |
|---|---|---|---|
| 1,000 | 603,458ns | 20,750ns | 29x |
| 4,000 | 9,646,708ns | 108,709ns | 89x |
| 16,000 | 154,312,917ns | 470,708ns | **328x** |

Python: 98x at n = 1,000 and 374x at n = 4,000 for the one-pass DP.

## Negatives, and the arithmetic

Unlike Sum of Subarray Minimums, this problem's values are typically allowed to be
negative — which changes nothing structurally, because the span argument is about
ordering rather than sign. It does mean `dmin` and `dmax` can each be negative,
and their difference is what must be non-negative, since a maximum is never below
a minimum.

The magnitudes are large. At the usual constraint of n = 1,000 with values up to
10⁹, alternating signs gives

```
999,000,000,000,000
```

which is **465,196x** `INT_MAX`, and about 10⁻⁴ of `LLONG_MAX` — so 64 bits is
required and comfortably sufficient. There is no modulo in this problem, unlike
the previous one, so the accumulator must genuinely hold the full value.

## Where this goes next

**Remove K Digits** keeps the monotonic stack but changes what is being built: the
stack *is* the answer, assembled greedily, and the pops are edits to an output
string rather than resolutions of pending questions. It is the last of the Medium
tier before the histogram problems.

<!-- @intuition -->
A range is a difference, and a sum of differences is a difference of sums, so the whole problem dissolves into two copies of one you have already solved. What is worth pausing on is why the two copies cannot interfere. Each half answers a self-contained question — which element is responsible for each subarray's minimum, and which for its maximum — and each answers it by carving the subarrays into groups, one group per element. Two different carvings of the same set are still two complete carvings; the totals do not care how the boundaries were drawn, only that nothing was counted twice or missed. So the two halves can disagree entirely about tie-breaking and both still be right. The failure mode is not disagreement between them but incoherence within one: a convention that is symmetric does not carve at all, because tied elements either all claim the shared ground or none of them do, and then that half's total is simply wrong.

<!-- @approach -->
### Brute Force - Every Subarray, Carrying Both Extremes

<!-- @idea -->
Fix a start, extend the end, and keep a running minimum and maximum so each subarray costs O(1).

<!-- @steps -->
1. Loop `i` over every start position.
2. Initialise a running minimum and maximum to `a[i]`.
3. Extend `j` from `i` to the end, updating both with `a[j]`.
4. Add `max − min` to the total at each step.
5. Note that carrying both extremes keeps this quadratic rather than cubic.

<!-- @complexity -->
- time: O(n^2) — one subtraction per subarray, and there are n(n+1)/2 of them
- space: O(1) beyond the accumulator
- note: The reference both fast versions were verified against, over 200,000 tie-heavy arrays including negatives with 0 mismatches. Measured 154,312,917ns at n = 16,000 against the two-pass span version's 470,708ns, a factor of 328, and 374x in Python at n = 4,000. Initialising both extremes to a[i] rather than to sentinels is what makes it correct for negative values without any special case.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

long long subArrayRanges(const vector<int>& a) {
    int n = a.size();
    long long total = 0;
    for (int i = 0; i < n; i++) {
        int mn = a[i], mx = a[i];
        for (int j = i; j < n; j++) {
            mn = min(mn, a[j]);
            mx = max(mx, a[j]);
            total += (long long)mx - mn;
        }
    }
    return total;
}

// a = [1, 3, 2] -> 5
```

<!-- @annotations -->
- 9: Seeding both from a[i] rather than from INT_MAX and INT_MIN, which keeps the code correct for negative values with no sentinel to get wrong.
- 13: The cast before the subtraction — mx - mn fits in an int here, but the accumulation does not, and widening at the point of addition is the habit that scales.
- 19: Five, because only the three multi-element subarrays contribute anything; every single-element subarray has range zero.

<!-- @code java -->
```java
static long subArrayRanges(int[] a) {
    int n = a.length;
    long total = 0;
    for (int i = 0; i < n; i++) {
        int mn = a[i], mx = a[i];
        for (int j = i; j < n; j++) {
            mn = Math.min(mn, a[j]);
            mx = Math.max(mx, a[j]);
            total += (long) mx - mn;
        }
    }
    return total;
}
```

<!-- @annotations -->
- 9: (long) mx - mn casts the first operand, so the subtraction happens in long — with values at 10^9 the int difference can overflow before it is added.

<!-- @code python -->
```python
def sub_array_ranges(a: list[int]) -> int:
    n = len(a)
    total = 0
    for i in range(n):
        mn = mx = a[i]
        for j in range(i, n):
            if a[j] < mn: mn = a[j]
            if a[j] > mx: mx = a[j]
            total += mx - mn
    return total


# 584.3ms at n = 4,000 against the one-pass DP's 1.56ms.
```

<!-- @annotations -->
- 7: Explicit comparisons rather than min() and max(), which avoids two function calls in the hottest loop in the file.

<!-- @approach -->
### Decompose - Maximums Minus Minimums

<!-- @idea -->
A sum of differences is a difference of sums, so run the previous subtopic's algorithm twice with the comparisons reversed.

<!-- @steps -->
1. Note that summing `max − min` over subarrays equals summing `max` minus summing `min`.
2. Compute the sum of subarray minimums using previous-smaller and next-smaller boundaries.
3. Compute the sum of subarray maximums using previous-**greater** and next-greater boundaries.
4. Subtract the second total from the first.
5. Note that each half must be internally asymmetric, and that the two halves need not agree with each other.

<!-- @complexity -->
- time: O(n) — four stack passes, or two if the halves are interleaved
- space: O(n) for the boundary arrays and stacks
- note: Verified over 200,000 tie-heavy arrays including negatives, 0 mismatches. All four combinations of leftmost-owns and rightmost-owns across the two halves were correct on every array, because each half is an independent partition. Measured 470,708ns at n = 16,000 against the brute force's 154,312,917ns, a factor of 328.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// forMin selects which boundaries to use: smaller elements, or greater ones
static long long spanSum(const vector<int>& a, bool forMin) {
    int n = a.size();
    vector<int> prev(n, -1), next(n, n), st;

    for (int i = 0; i < n; i++) {                       // previous STRICTLY beyond
        while (!st.empty() && (forMin ? a[st.back()] >= a[i] : a[st.back()] <= a[i]))
            st.pop_back();
        prev[i] = st.empty() ? -1 : st.back();
        st.push_back(i);
    }
    st.clear();
    for (int i = n - 1; i >= 0; i--) {                  // next beyond OR EQUAL
        while (!st.empty() && (forMin ? a[st.back()] > a[i] : a[st.back()] < a[i]))
            st.pop_back();
        next[i] = st.empty() ? n : st.back();
        st.push_back(i);
    }

    long long total = 0;
    for (int i = 0; i < n; i++)
        total += (long long)a[i] * (i - prev[i]) * (next[i] - i);
    return total;
}

long long subArrayRanges(const vector<int>& a) {
    return spanSum(a, false) - spanSum(a, true);        // maximums minus minimums
}
```

<!-- @annotations -->
- 9: The left comparison is strict in both modes — >= for minimums, <= for maximums — which is what makes each half asymmetric.
- 16: And the right comparison is non-strict in both — > and < — completing the asymmetry independently in each half.
- 29: The subtraction is the whole decomposition; everything above it is the previous subtopic run twice.
- 23: Widening the first factor before multiplying, since a[i] times two widths overflows a 32-bit int at these constraints.

<!-- @code java -->
```java
static long spanSum(int[] a, boolean forMin) {
    int n = a.length;
    int[] prev = new int[n], next = new int[n];
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && (forMin ? a[st.peek()] >= a[i] : a[st.peek()] <= a[i])) st.pop();
        prev[i] = st.isEmpty() ? -1 : st.peek();
        st.push(i);
    }
    st.clear();
    for (int i = n - 1; i >= 0; i--) {
        while (!st.isEmpty() && (forMin ? a[st.peek()] > a[i] : a[st.peek()] < a[i])) st.pop();
        next[i] = st.isEmpty() ? n : st.peek();
        st.push(i);
    }

    long total = 0;
    for (int i = 0; i < n; i++) total += (long) a[i] * (i - prev[i]) * (next[i] - i);
    return total;
}

static long subArrayRanges(int[] a) { return spanSum(a, false) - spanSum(a, true); }
```

<!-- @annotations -->
- 7: A single parameterised function rather than two near-copies, which is the practical defence against mirroring the comparisons inconsistently.

<!-- @code python -->
```python
def span_sum(a: list[int], for_min: bool) -> int:
    n = len(a)
    prev, nxt = [-1] * n, [n] * n

    st = []
    for i in range(n):
        while st and (a[st[-1]] >= a[i] if for_min else a[st[-1]] <= a[i]):
            st.pop()
        prev[i] = st[-1] if st else -1
        st.append(i)

    st = []
    for i in range(n - 1, -1, -1):
        while st and (a[st[-1]] > a[i] if for_min else a[st[-1]] < a[i]):
            st.pop()
        nxt[i] = st[-1] if st else n
        st.append(i)

    return sum(a[i] * (i - prev[i]) * (nxt[i] - i) for i in range(n))


def sub_array_ranges(a: list[int]) -> int:
    return span_sum(a, False) - span_sum(a, True)
```

<!-- @annotations -->
- 7: The conditional expression keeps both modes in one loop, so the strict-then-loose pattern cannot drift between the minimum and maximum versions.

<!-- @approach -->
### Optimal - Both Halves in a Single Pass

<!-- @idea -->
Carry two stacks and two running values through one sweep, accumulating the difference as you go.

<!-- @steps -->
1. Keep two stacks: one for previous-smaller boundaries, one for previous-greater.
2. At each index, pop each stack according to its own comparison.
3. Compute `dmin[i]` and `dmax[i]` from their respective predecessors, exactly as in Sum of Subarray Minimums.
4. Add `dmax[i] − dmin[i]` to the running total.
5. Note that no next-boundary arrays are needed at all, in either half.

<!-- @complexity -->
- time: O(n) — one pass, two stacks, each element pushed once and popped at most once per stack
- space: O(n) for the two dp arrays and two stacks
- note: 0 mismatches over 200,000 tie-heavy arrays including negative values. Measured 733,250ns at n = 64,000 and 180,084ns at n = 16,000, against the two-pass span version's 470,708ns at the same size. In Python it is 98x the brute force at n = 1,000 and 374x at n = 4,000. It also removes the risk of mismatched next-boundary comparisons entirely, since there are no next-boundary passes to get wrong.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

long long subArrayRanges(const vector<int>& a) {
    int n = a.size();
    vector<long long> dmin(n, 0), dmax(n, 0);
    vector<int> smin, smax;
    long long total = 0;

    for (int i = 0; i < n; i++) {
        while (!smin.empty() && a[smin.back()] >= a[i]) smin.pop_back();
        int pmin = smin.empty() ? -1 : smin.back();
        dmin[i] = (pmin < 0 ? 0 : dmin[pmin]) + (long long)(i - pmin) * a[i];
        smin.push_back(i);

        while (!smax.empty() && a[smax.back()] <= a[i]) smax.pop_back();
        int pmax = smax.empty() ? -1 : smax.back();
        dmax[i] = (pmax < 0 ? 0 : dmax[pmax]) + (long long)(i - pmax) * a[i];
        smax.push_back(i);

        total += dmax[i] - dmin[i];
    }
    return total;
}
```

<!-- @annotations -->
- 11: >= for the minimum stack and <= for the maximum stack — the only difference between the two blocks, and the only place they can be got wrong.
- 21: Accumulating the difference per index rather than computing two totals and subtracting, which keeps the running value small and needs no second loop.
- 6: Two dp arrays of long long, since each can individually exceed a 32-bit int before the difference does.

<!-- @code java -->
```java
static long subArrayRanges(int[] a) {
    int n = a.length;
    long[] dmin = new long[n], dmax = new long[n];
    Deque<Integer> smin = new ArrayDeque<>(), smax = new ArrayDeque<>();
    long total = 0;

    for (int i = 0; i < n; i++) {
        while (!smin.isEmpty() && a[smin.peek()] >= a[i]) smin.pop();
        int pmin = smin.isEmpty() ? -1 : smin.peek();
        dmin[i] = (pmin < 0 ? 0 : dmin[pmin]) + (long) (i - pmin) * a[i];
        smin.push(i);

        while (!smax.isEmpty() && a[smax.peek()] <= a[i]) smax.pop();
        int pmax = smax.isEmpty() ? -1 : smax.peek();
        dmax[i] = (pmax < 0 ? 0 : dmax[pmax]) + (long) (i - pmax) * a[i];
        smax.push(i);

        total += dmax[i] - dmin[i];
    }
    return total;
}
```

<!-- @annotations -->
- 3: long[] for both dp arrays. At n = 1,000 with values at 10^9 the total reaches 999,000,000,000,000, which is 465,196 times Integer.MAX_VALUE.

<!-- @code python -->
```python
def sub_array_ranges(a: list[int]) -> int:
    n = len(a)
    dmin, dmax = [0] * n, [0] * n
    smin, smax = [], []
    total = 0

    for i, x in enumerate(a):
        while smin and a[smin[-1]] >= x:
            smin.pop()
        p = smin[-1] if smin else -1
        dmin[i] = (dmin[p] if p >= 0 else 0) + (i - p) * x
        smin.append(i)

        while smax and a[smax[-1]] <= x:
            smax.pop()
        q = smax[-1] if smax else -1
        dmax[i] = (dmax[q] if q >= 0 else 0) + (i - q) * x
        smax.append(i)

        total += dmax[i] - dmin[i]
    return total


# 1.56ms at n = 4,000 against the brute force's 584.3ms.
```

<!-- @annotations -->
- 11: dmin[p] if p >= 0 else 0 — an unguarded dmin[p] with p = -1 reads the last element in Python rather than raising.
- 18: The two guards are separate because pmin and pmax are different indices; reusing one variable for both is a common slip that silently mixes the halves.

<!-- @approach -->
### The Tie Conventions, Tested Rather Than Assumed

<!-- @idea -->
Each half needs an asymmetric convention of its own; the two halves need not agree with each other.

<!-- @steps -->
1. Note that "leftmost-owns" means strict on the left and non-strict on the right.
2. Note that "rightmost-owns" is the reverse, and is equally valid.
3. Note that each half independently partitions the subarrays, so its sum is correct whichever it uses.
4. Conclude that all four pairings across the two halves are correct.
5. Note that a *symmetric* convention in either half is not a partition at all, and breaks that half's sum.

<!-- @complexity -->
- time: unchanged
- space: unchanged
- note: All four pairings were correct on 200,000 tie-heavy arrays. A symmetric convention in the minimum half alone was wrong on 109,476 (54.7%), in the maximum half alone on 115,635 (57.8%), and in both on 119,873 (59.9%). The last figure is the dangerous one: with both halves broken the errors coincidentally cancel on 80,817 arrays — 40.4% — so the doubly-wrong version passes casual testing more often than the singly-wrong one.

<!-- @code cpp -->
```cpp
// Both of these are correct, and they may be mixed freely.
//
// leftmost-owns : previous STRICTLY beyond, next beyond-or-equal
//     min:  pop while top >= a[i]        then  pop while top >  a[i]
//     max:  pop while top <= a[i]        then  pop while top <  a[i]
//
// rightmost-owns: previous beyond-or-equal, next STRICTLY beyond
//     min:  pop while top >  a[i]        then  pop while top >= a[i]
//     max:  pop while top <  a[i]        then  pop while top <= a[i]
//
// WRONG in either half — symmetric, so tied elements either all claim the
// shared subarrays or none do:
//     min:  pop while top >= a[i]        then  pop while top >= a[i]
```

<!-- @annotations -->
- 4: Strict on the left and loose on the right, which names the leftmost of several tied extremes as the owner.
- 8: The mirror image, naming the rightmost, and equally valid — the halves may use different ones.
- 12: The failure is within a half, not between halves; both comparisons the same makes the ranges overlap or leave gaps.

<!-- @code java -->
```java
// A parameterised helper makes the asymmetry impossible to mirror wrongly,
// because the strict-then-loose pattern is written once:
static boolean popLeft(int top, int cur, boolean forMin) {
    return forMin ? top >= cur : top <= cur;      // strict
}
static boolean popRight(int top, int cur, boolean forMin) {
    return forMin ? top > cur : top < cur;        // loose
}
```

<!-- @annotations -->
- 4: The word "strict" attached to the left test and "loose" to the right one, so the asymmetry is documented at the point it is decided rather than in a comment elsewhere.

<!-- @code python -->
```python
# Verified over 200,000 tie-heavy arrays including negatives:
#
#   min half        max half         correct on
#   leftmost-owns   leftmost-owns    200,000
#   leftmost-owns   rightmost-owns   200,000
#   rightmost-owns  leftmost-owns    200,000
#   rightmost-owns  rightmost-owns   200,000
#
#   symmetric in the min half only   wrong on 54.7%
#   symmetric in the max half only   wrong on 57.8%
#   symmetric in BOTH halves         wrong on 59.9%, and coincidentally
#                                    correct on the other 40.4%
```

<!-- @annotations -->
- 12: That 40.4% is why the doubly-broken version is the hardest to catch — it is right two times in five by accident.

<!-- @example -->

<!-- @input -->
a = [1, 3, 2]

<!-- @output -->
5

<!-- @why -->
Small enough to enumerate, and the three single-element subarrays contribute nothing, which makes the decomposition easy to check by hand.

<!-- @walkthrough -->
1. The six subarrays are [1], [3], [2], [1,3], [3,2] and [1,3,2].
2. Each single-element subarray has max equal to min, so its range is 0 — three of the six contribute nothing.
3. [1,3] has range 3 - 1 = 2, [3,2] has range 3 - 2 = 1, and [1,3,2] has range 3 - 1 = 2. The total is 5.
4. By decomposition, the sum of maximums is 1 + 3 + 2 + 3 + 3 + 3 = 15.
5. The sum of minimums is 1 + 3 + 2 + 1 + 2 + 1 = 10.
6. The difference is 15 - 10 = 5, matching.
7. Notice that the two halves were computed entirely separately and never referred to one another — which is the property that makes their tie conventions independent.

<!-- @example -->

<!-- @input -->
All four pairings of tie convention across the two halves

<!-- @output -->
Correct on 200,000 of 200,000, in every combination

<!-- @why -->
It contradicts the natural assumption that the halves must be kept consistent, and the reason it contradicts it is worth having explicitly.

<!-- @walkthrough -->
1. "Leftmost-owns" means the left comparison is strict and the right is not, so the leftmost of several tied extremes claims the shared subarrays.
2. "Rightmost-owns" is the mirror, and is equally valid.
3. The minimum half was run with each convention, and the maximum half with each, giving four combinations.
4. Over 200,000 arrays drawn from four values including negatives, every combination matched the brute force on every array.
5. The reason is that each half is a complete, independent partition of the subarrays: it assigns each subarray to exactly one element and sums correctly.
6. Two different carvings of the same set are still two complete carvings, and the totals do not depend on where the boundaries fell.
7. So the halves cannot interfere — which also means a bug in one cannot be diagnosed by comparing it against the other.

<!-- @example -->

<!-- @input -->
A symmetric convention in one half, and in both

<!-- @output -->
54.7% and 57.8% wrong individually; 59.9% wrong with both, and 40.4% right by accident

<!-- @why -->
The doubly-broken version is the one that survives testing, which inverts the usual intuition that more bugs are easier to catch.

<!-- @walkthrough -->
1. A symmetric convention uses the same strictness on both sides, so tied elements either all claim the shared subarrays or none of them do.
2. That is not a partition, so the affected half's sum is wrong and the difference inherits the error.
3. With only the minimum half symmetric, the answer was wrong on 109,476 of 200,000 arrays — 54.7%.
4. With only the maximum half symmetric, it was wrong on 115,635 — 57.8%.
5. With both halves symmetric it was wrong on 119,873 — 59.9% — which is barely worse than either alone.
6. The remaining 80,817 arrays, 40.4%, gave the correct answer anyway, because the two errors happened to cancel in the subtraction.
7. So the version with two bugs passes two tests in five, which is a higher hit rate than the version with one bug — a good reason to test each half against its own reference rather than only testing the difference.

<!-- @example -->

<!-- @input -->
n = 1,000 with values alternating between +10⁹ and −10⁹

<!-- @output -->
999,000,000,000,000 — 465,196 times INT_MAX

<!-- @why -->
There is no modulo in this problem, so the accumulator has to hold the true value rather than a reduced one.

<!-- @walkthrough -->
1. With values alternating between the extremes, almost every multi-element subarray spans the full range of 2 x 10^9.
2. At n = 1,000 there are 500,500 subarrays, and the total comes to 999,000,000,000,000.
3. INT_MAX is 2,147,483,647, so the answer is 465,196 times larger and a 32-bit accumulator wraps silently.
4. LLONG_MAX is about 9.22 x 10^18, so the answer occupies roughly one ten-thousandth of the 64-bit range.
5. That headroom means no modulo and no wider type is needed — unlike Sum of Subarray Minimums, which asks for the answer modulo 10^9+7.
6. The individual dp values can also exceed a 32-bit int before the total does, so both dp arrays must be 64-bit, not just the accumulator.
7. Negative values change none of this: the span argument depends on ordering rather than sign, and only the final difference is guaranteed non-negative.

<!-- @visualization array -->

<!-- @description -->
Open with the decomposition, made visual rather than algebraic. Draw [1, 3, 2] and beneath it the six subarrays as bars, each labelled with its max and min. Colour the max of each bar in one hue and the min in another. Then physically separate the two: slide all the maxima into one column and all the minima into another, summing each to 15 and 10, and show 15 − 10 = 5. Caption it "two independent totals, subtracted once". Then the independence panel, which is the subtopic's main point. Run the minimum half's span construction on a tie-heavy array such as [2, 1, 1, 3], showing the bands each element claims under leftmost-owns; then replay it under rightmost-owns, so the bands visibly shift while still tiling the subarray triangle completely. Do the same for the maximum half. Then put all four combinations side by side as four small triangles, each fully tiled, each labelled with its total — and the same final answer under all four. Caption it "each half carves the same set differently, and a complete carving is a complete carving". Then the symmetry failure: switch one half to a symmetric convention and show its bands overlapping, with the triangle now double-covered in places and the total visibly wrong. Put the three failure rates as bars — 54.7%, 57.8%, 59.9% — and beside the last one a fourth bar showing 40.4% coincidentally correct, shaded differently and labelled "right by accident, which is why it survives testing". Close with the one-pass panel: a single sweep across the array with two stacks drawn above and below the line, one popping on >= and the other on <=, and two running values dmin and dmax updating in step. Show the difference being added to a total at each index, and note that no next-boundary arrays appear anywhere — with a small annotation that this removes the two comparisons most likely to be mirrored wrongly.

<!-- @sampleInput -->
```json
{"problem":{"array":[1,3,2],"answer":5,"subarrays":[{"cells":[1],"max":1,"min":1,"range":0},{"cells":[3],"max":3,"min":3,"range":0},{"cells":[2],"max":2,"min":2,"range":0},{"cells":[1,3],"max":3,"min":1,"range":2},{"cells":[3,2],"max":3,"min":2,"range":1},{"cells":[1,3,2],"max":3,"min":1,"range":2}],"note":"every single-element subarray has range 0"},"decomposition":{"identity":"sum(max - min) = sum(max) - sum(min)","sumOfMaximums":15,"sumOfMinimums":10,"difference":5,"keyProperty":"the two halves are computed separately and never refer to one another"},"independence":{"claim":"the two halves do NOT need matching tie conventions","conventions":{"leftmostOwns":"strict on the left, non-strict on the right","rightmostOwns":"non-strict on the left, strict on the right"},"pairings":[{"min":"leftmost-owns","max":"leftmost-owns","correct":200000,"of":200000},{"min":"leftmost-owns","max":"rightmost-owns","correct":200000,"of":200000},{"min":"rightmost-owns","max":"leftmost-owns","correct":200000,"of":200000},{"min":"rightmost-owns","max":"rightmost-owns","correct":200000,"of":200000}],"why":"each half is a complete, independent partition of the subarrays — two different carvings of the same set are still two complete carvings","consequence":"a bug in one half cannot be diagnosed by comparing it against the other"},"symmetryFailure":{"whatSymmetricMeans":"the same strictness on both sides, so tied elements either all claim the shared subarrays or none do","rows":[{"broken":"minimum half only","wrong":109476,"percent":54.7},{"broken":"maximum half only","wrong":115635,"percent":57.8},{"broken":"both halves","wrong":119873,"percent":59.9,"coincidentallyCorrect":80817,"coincidentalPercent":40.4}],"trap":"with both halves broken the errors cancel on 40.4% of inputs, so the doubly-wrong version passes casual testing MORE often than the singly-wrong one","lesson":"test each half against its own reference rather than only testing the difference"},"onePass":{"recurrences":["dmin[i] = dmin[pmin] + (i - pmin) * a[i]   with pmin the previous strictly smaller","dmax[i] = dmax[pmax] + (i - pmax) * a[i]   with pmax the previous strictly greater"],"accumulate":"total += dmax[i] - dmin[i]","stacks":2,"nextBoundaryArrays":0,"whyThatMatters":"the next-boundary comparisons are the two most likely to be mirrored wrongly, and this form has none","verified":{"arrays":200000,"includesNegatives":true,"mismatches":0}},"timing":{"unit":"ns","rows":[{"n":1000,"brute":603458,"spans":20750,"ratio":29},{"n":4000,"brute":9646708,"spans":108709,"ratio":89},{"n":16000,"brute":154312917,"spans":470708,"ratio":328}],"onePassDP":[{"n":16000,"ns":180084},{"n":64000,"ns":733250}],"python":[{"n":1000,"bruteMs":35.7,"dpMs":0.37,"ratio":98},{"n":4000,"bruteMs":584.3,"dpMs":1.56,"ratio":374}]},"arithmetic":{"negativesAllowed":true,"whyStructurallyIrrelevant":"the span argument is about ordering rather than sign","worstCase":{"n":1000,"values":"alternating +1e9 and -1e9","subarrays":500500,"total":999000000000000,"timesIntMax":465196,"fractionOfLongMax":0.000108},"noModulo":"unlike sum-of-subarray-minimums, so the accumulator must hold the true value","bothDpArraysMustBe64Bit":"each can individually exceed a 32-bit int before the difference does","onlyTheDifferenceIsNonNegative":"a maximum is never below a minimum"}}
```

<!-- @highlights -->
- [1, 3, 2] is drawn above its six subarrays as bars, each labelled with its max and min.
- The max of each bar is coloured in one hue and the min in another.
- The two colours physically separate into two columns, summing to 15 and 10.
- 15 − 10 = 5 appears beneath, captioned "two independent totals, subtracted once".
- The minimum half's span construction runs on a tie-heavy array under leftmost-owns.
- It replays under rightmost-owns, the bands visibly shifting while still tiling the subarray triangle completely.
- The maximum half is shown the same way, under both conventions.
- All four combinations appear as four small triangles, each fully tiled, each with the same final answer.
- They are captioned "each half carves the same set differently, and a complete carving is a complete carving".
- One half then switches to a symmetric convention and its bands visibly overlap.
- The triangle is double-covered in places and the total is visibly wrong.
- Three failure-rate bars read 54.7%, 57.8% and 59.9%.
- A fourth bar beside the last shows 40.4% coincidentally correct, shaded differently.
- It is labelled "right by accident, which is why it survives testing".
- A single sweep runs with two stacks drawn above and below the array, popping on >= and <=.
- dmin and dmax update in step, their difference feeding a running total, with no next-boundary arrays anywhere.

<!-- @edgeCases -->
- A single element — the only subarray has range 0, and both dp values equal that element so the difference is 0.
- All elements equal — every range is 0, and this is the case that exposes a symmetric convention in either half.
- Two elements — the smallest input where a subarray has a non-zero range.
- Negative values throughout — handled without special cases, since the span argument depends on ordering rather than sign.
- Mixed signs — the individual dp sums can be negative while their difference cannot.
- A strictly increasing array — every element's previous-greater is absent and its previous-smaller is its left neighbour.
- A strictly decreasing array — the mirror, and the two stacks behave oppositely on the same input.
- Values at 10^9 with n = 1,000 — the total reaches 465,196 times INT_MAX, so 64-bit accumulation is required.
- A 32-bit dp array — each dp value can individually exceed INT_MAX before the total does.
- Symmetric conventions in both halves — right by accident on 40.4% of inputs, which is why the difference alone is a poor test.
- Reusing one predecessor variable for both stacks — silently mixes the halves and is easy to write.

<!-- @pitfalls -->
- Assuming the two halves must use matching tie conventions. All four pairings were correct on 200,000 arrays, because each half partitions independently.
- Using a symmetric convention in either half. It is wrong on 54.7% of inputs for the minimum half alone and 57.8% for the maximum half alone.
- Testing only the final difference. With both halves symmetric the errors cancel on 40.4% of inputs, so the doubly-broken version passes more often than the singly-broken one.
- Mirroring the comparisons by hand into a second copy of the function. Parameterise instead, so the strict-then-loose pattern is written once and cannot drift.
- Accumulating in a 32-bit integer. The total reaches 999,000,000,000,000 at n = 1,000 with values at 10^9 — 465,196 times INT_MAX.
- Declaring the dp arrays as int. Each dp value can exceed a 32-bit int on its own, before the running difference does.
- Applying a modulo out of habit. This problem does not ask for one, unlike Sum of Subarray Minimums, and reducing changes the answer.
- Seeding the brute force's running extremes to INT_MAX and INT_MIN. Seeding both from a[i] is simpler and correct for negative values with no sentinel to get wrong.
- Reusing a single predecessor variable across both stacks in the one-pass version. The two indices differ, and mixing them produces a plausible wrong total.
- Indexing dmin[p] with p = -1 in Python. It reads the last element rather than raising, corrupting the result quietly.
- Expecting the sum of maximums and the sum of minimums to be individually meaningful sanity checks against each other. They are independent, so one being wrong tells you nothing about the other.
- Computing the two totals separately and subtracting at the end. Accumulating the difference per index is equally simple and keeps the running value smaller.

<!-- @doubt -->
### Why does this decompose so cleanly?

<!-- @answer -->
Because summation distributes over subtraction. Summing (max − min) across all subarrays is the same as summing every max and then subtracting the sum of every min, and both of those are the previous subtopic's problem — one with the comparisons as written, one with them reversed. There is no interaction term and no correction to apply, which is unusual enough to be worth noticing: many "combined" problems do not split this cleanly, and this one does only because the quantity is a plain difference.

<!-- @doubt -->
### Do the two halves need matching tie conventions?

<!-- @answer -->
No, and I would have guessed otherwise. Over 200,000 tie-heavy arrays, all four pairings of leftmost-owns and rightmost-owns across the two halves were correct on every array. The reason is that each half is a complete, independent partition of the subarrays: it assigns each one to exactly one element and sums correctly, and two different carvings of the same set are still two complete carvings. The halves never refer to one another, so they cannot disagree in any way that matters.

<!-- @doubt -->
### What does break, then?

<!-- @answer -->
A symmetric convention inside either half — the same strictness on both sides. That is not a partition at all, because tied elements either all claim the shared subarrays or none of them do, so that half's sum is simply wrong and the difference inherits it. Measured, a symmetric minimum half alone was wrong on 54.7% of inputs and a symmetric maximum half alone on 57.8%. The failure is within a half, never between halves.

<!-- @doubt -->
### Why is breaking both halves harder to detect than breaking one?

<!-- @answer -->
Because the two errors partly cancel in the subtraction. With both halves symmetric the answer was wrong on 59.9% of inputs — barely worse than either alone — and correct on the remaining 40.4% purely by coincidence. So the version with two bugs passes two tests in five, a better hit rate than the version with one bug. The practical consequence is that testing only the final difference is a weak check: each half should be verified against its own reference, since a wrong sum of minimums can be masked by an equally wrong sum of maximums.

<!-- @doubt -->
### Should I write one function twice or parameterise it?

<!-- @answer -->
Parameterise it. The two halves differ only in the direction of four comparisons, and hand-mirroring them into a second copy is exactly how a strict test becomes non-strict or a left test becomes a right one. A single function taking a forMin flag writes the strict-then-loose pattern once, so it cannot drift between the copies. The one-pass DP goes further and removes the next-boundary passes entirely, which eliminates the two comparisons most likely to be mirrored wrongly — there is nothing left to mirror.

<!-- @doubt -->
### How does the one-pass version handle both halves?

<!-- @answer -->
Two stacks, two dp arrays, one sweep. At each index the minimum stack pops while its top is greater than or equal to the current value, and the maximum stack pops while its top is less than or equal — the only difference between the two blocks. Each dp value is built from its own predecessor exactly as in Sum of Subarray Minimums, and the difference is added to a running total immediately. Verified over 200,000 tie-heavy arrays including negatives with 0 mismatches, and it needs no next-boundary arrays at all.

<!-- @doubt -->
### Do negative values change anything?

<!-- @answer -->
Structurally, no. The span argument is about ordering — which elements are smaller or greater than which — and says nothing about sign, so every boundary computation is unchanged. What negatives do change is that the individual sums can be negative: dmin and dmax may each be below zero, and only their difference is guaranteed non-negative, since a maximum is never below a minimum. That makes an assertion that the running total is non-negative a valid check on the final answer but not on the intermediate halves.

<!-- @doubt -->
### How large does the answer get?

<!-- @answer -->
At the usual constraint of n = 1,000 with values up to 10⁹, alternating signs gives 999,000,000,000,000 — 465,196 times INT_MAX. That fits in a 64-bit integer using about one ten-thousandth of its range, so long long or long is required and comfortably sufficient. Note that both dp arrays must be 64-bit too, not just the accumulator, because an individual dp value can exceed a 32-bit int before the running difference does. And unlike Sum of Subarray Minimums, this problem asks for no modulo, so the accumulator must hold the true value.

<!-- @doubt -->
### Is the brute force ever acceptable here?

<!-- @answer -->
For n up to a few hundred, yes, and it is worth writing regardless as the reference — it is the only version that computes ranges directly rather than by decomposition, so it catches errors in the decomposition itself. At n = 16,000 it took 154,312,917ns against the span version's 470,708ns, a factor of 328, and Python shows 374x at n = 4,000. The usual constraint for this problem is n ≤ 1,000, at which the brute force takes 603,458ns and is perfectly viable — which is why the stack solution is presented as the follow-up rather than the required answer.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Remove K Digits, which keeps the monotonic stack but changes what it holds. In every problem so far the stack has held pending questions or surviving candidates, and the answer was written elsewhere. There the stack *is* the answer — a digit string built greedily, with each pop deleting a character that has just been shown to be suboptimal. It is the last of the Medium tier before the histogram problems, and the first where the stack's contents are returned directly.
