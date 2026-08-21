---
id: kadanes-algorithm
topic: Arrays
title: Kadane's Algorithm
difficulty: Medium
status: ready
prerequisites:
  - maximum-consecutive-ones
  - longest-subarray-with-sum-k
  - largest-element
  - for-loop
  - relational-and-logical-operators
  - time-and-space-complexity-basics
relatedIds:
  - maximum-consecutive-ones
  - print-subarray-with-maximum-subarray-sum
  - stock-buy-and-sell
  - longest-subarray-with-sum-k
---

<!-- @summary -->
Find the largest sum of any contiguous subarray in one pass and constant space — the running-candidate skeleton from Maximum Consecutive Ones with a sum instead of a count, plus a zero-initialisation bug that is wrong on 100% of all-negative arrays and 0.65% of everything else.

<!-- @theory -->
## The problem

Return the largest sum obtainable from any **contiguous** subarray. The subarray
must be non-empty.

```
[-2, 1, -3, 4, -1, 2, 1, -5, 4]  ->  6   (the subarray 4, -1, 2, 1)
[1]                              ->  1
[-3, -1, -2]                     -> -1   (the least-negative single element)
```

That third example is the one to keep in mind. With every element negative, the
best you can do is pick the single least-bad one — and it is where most wrong
implementations fail.

## It is the same skeleton you have already met

Maximum Consecutive Ones carried two values: a current run and the best run ever
seen. Kadane's algorithm is that structure with two substitutions:

| | Maximum Consecutive Ones | Kadane's |
|---|---|---|
| Running quantity | a **count** | a **sum** |
| Reset when | the element is 0 | the running sum turns negative |
| Keep | the best count | the best sum |

Everything else — carry a running value, update the best as you go, one pass, O(1)
space — is identical. If you internalised that skeleton there, this is a
substitution rather than a new idea.

## The decision at each element

Standing at element `x` with a running sum `cur` behind you, there are exactly two
options for the best subarray **ending here**:

- **Extend** what you already have: `cur + x`
- **Start fresh** at this element: `x`

Take whichever is larger:

```
cur  = max(x, cur + x)
best = max(best, cur)
```

That is the entire algorithm. It is worth seeing *why* those are the only two
options: any subarray ending at `x` either includes the element before `x` or it
does not. If it does, the best such subarray is the best one ending at the
previous element, extended — which is exactly `cur + x`. If it does not, the
subarray is just `x`. There is no third case.

### The reset phrasing

The same rule is often written as "when the running sum goes negative, throw it
away":

```
if cur < 0: cur = 0
cur += x
best = max(best, cur)
```

These are equivalent, and for a good reason: `cur + x` beats `x` exactly when
`cur > 0`. So "take the max" and "discard a negative prefix" are the same
decision stated two ways. Verified — both scored 0 failures across all 19,530
test arrays.

**But only if `best` is initialised correctly**, which is the next section.

## The bug that hides until it doesn't

Initialise `best` to `0` and the algorithm breaks on arrays where every element is
negative — it reports 0, which is the sum of the *empty* subarray, and the problem
requires a non-empty one.

Measured over all 19,530 test arrays:

| | Failures | Rate |
|---|---|---|
| Overall | 126 | **0.65%** |
| Restricted to all-negative arrays | 126 of 126 | **100%** |

Read those two numbers together, because the pair is the point. **The bug fires on
one input class and only that class.** Random testing almost never produces an
entirely negative array, so it passes; an all-negative test catches it every
single time. The smallest failure is one element: `[-3]` returns 0 where the answer
is −3.

This is the same shape as the `max = 0` bug in Largest Element — a seed that is
not a real element of the array — and the fix is the same: **seed from the data**.
Set `best = cur = arr[0]` and scan from index 1.

If the problem *does* allow the empty subarray, then 0 genuinely is a valid answer
and initialising to 0 is correct. Decide which contract you are under before you
write the initialiser rather than after.

## What it costs, and a faster equivalent

Kadane's is O(n) time and O(1) space, one pass. Measured per element, with the
array mutated between calls so the compiler cannot hoist the work away:

| n | Kadane | Prefix-minimum | Ratio |
|---|---|---|---|
| 4,096 | 0.947ns | **0.693ns** | 1.37x |
| 65,536 | 0.943ns | **0.691ns** | 1.37x |
| 1,048,576 | 0.949ns | **0.685ns** | 1.39x |
| 8,388,608 | 0.946ns | **0.688ns** | 1.38x |

Both are perfectly flat in `n` — single sequential passes holding O(1) state, so
neither has the cache cliff that Sort Colors showed.

### The prefix-minimum formulation

Using prefix sums from two subtopics ago: the sum of a subarray ending at `j` and
starting after position `i` is `P[j] − P[i]`. To maximise that with `j` fixed, you
want the **smallest prefix seen so far**:

```
sum = sum + x
best = max(best, sum - minPrefix)
minPrefix = min(minPrefix, sum)
```

Same O(n) and O(1), and measured consistently **1.37x faster**.

### Why it is faster, which is not the reason you would guess

Not vectorisation. Clang refuses to vectorise **both** loops, reporting the same
message for each: *"value that could not be identified as reduction is used
outside the loop"*.

The difference is the **critical dependency chain** — what the loop-carried value
must pass through before the next iteration can begin:

- **Kadane**: `cur = max(x, cur + x)` — `cur` goes through an **add and then a
  max** every iteration.
- **Prefix-min**: `sum += x` — the running sum goes through **only an add**. The
  max and min hang off it but are not on that chain.

One extra operation of latency per element, and the measured gap is 1.37x — which
is about what a second dependent operation costs.

**Which should you write?** Kadane's, in an interview and in most code: it is the
expected answer, it needs no prefix reasoning, and 1.37x rarely decides anything.
Reach for the prefix version when this loop is genuinely hot, or when you already
have prefix sums for another reason.

## The classic alternative, and why it loses

Divide and conquer is the textbook O(n log n) answer: the best subarray lies
entirely in the left half, entirely in the right half, or crosses the midpoint —
and the crossing case is a linear scan outward from the middle.

It is a genuinely useful way to think, and it is slow. Measured at n = 10,000,000:
**159.25ms against the prefix version's 7.04ms — 22x**. Recursion, poor locality,
and an extra log factor against two flat linear passes.

Brute force is worse still: at n = 100,000 it took **2,927.95ms** against Kadane's
**0.09ms**, roughly **32,500x**.

## Python

At n = 2,000,000:

| Approach | Time |
|---|---|
| `itertools.accumulate` + prefix-min | **80.7ms** |
| Prefix-min, explicit loop | 84.8ms |
| Kadane with `if` comparisons | 101.5ms |
| Kadane using `max()` | 116.2ms |

Two things there. The ordering matches C++ — the prefix formulation wins. And
**`max()` costs 14% over an explicit comparison**, because it is a function call
per element rather than an inlined operation. That is worth knowing generally: in
a hot Python loop, `a if a > b else b` beats `max(a, b)`.

## Where this goes next

Returning the **subarray itself** rather than its sum is the next subtopic, and it
is a smaller change than it looks — you track where the current run started and
record the bounds whenever the best updates. **Stock Buy and Sell** is Kadane's on
the array of consecutive differences. And the running-candidate skeleton continues
into the sliding-window problems.

<!-- @intuition -->
Walk the array keeping a running total, and ask one question at every step: is what I am carrying helping me? If the total behind you has gone negative, it is a liability — drop it and start fresh from where you stand, because any subarray that includes a negative prefix would be better off without it. Everything else is bookkeeping: write down the best total you ever hold.

<!-- @approach -->
### Brute Force - Every Subarray

<!-- @idea -->
Try every start, extend to every end with a running sum, and keep the largest total seen.

<!-- @steps -->
1. Take each index in turn as the start of a subarray.
2. Reset a running sum to zero.
3. Extend the end one element at a time, adding each element to the running sum.
4. After each addition, update the best if this sum is larger.
5. Initialise the best from actual data rather than zero, so all-negative arrays work.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Correct including on all-negative input, provided the best is seeded from below rather than from zero. Measured 2,927.95ms at n = 100,000 against Kadane's 0.09ms — it is only useful as the reference the linear approaches were verified against.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

long long maxSubArray(const vector<int>& a) {
    long long best = LLONG_MIN;                 // not 0 — the answer may be negative
    for (size_t i = 0; i < a.size(); i++) {
        long long sum = 0;
        for (size_t j = i; j < a.size(); j++) {
            sum += a[j];
            best = max(best, sum);
        }
    }
    return best;
}
```

<!-- @annotations -->
- 7: Seeding with LLONG_MIN rather than 0 is what makes this correct on all-negative input.
- 8: Measured 2,927.95ms at n = 100,000 against Kadane's 0.09ms — roughly 32,500x.
- 12: The running sum keeps this O(n^2) rather than the O(n^3) of re-summing each subarray.

<!-- @code java -->
```java
static long maxSubArray(int[] a) {
    long best = Long.MIN_VALUE;
    for (int i = 0; i < a.length; i++) {
        long sum = 0;
        for (int j = i; j < a.length; j++) {
            sum += a[j];
            best = Math.max(best, sum);
        }
    }
    return best;
}
```

<!-- @annotations -->
- 2: Long.MIN_VALUE, not 0, for the same reason — the maximum subarray sum can legitimately be negative.

<!-- @code python -->
```python
def max_sub_array(a):
    best = float('-inf')
    for i in range(len(a)):
        total = 0
        for j in range(i, len(a)):
            total += a[j]
            if total > best:
                best = total
    return best
```

<!-- @annotations -->
- 2: float('-inf') compares below every integer, so the first real sum always replaces it.

<!-- @approach -->
### Divide and Conquer

<!-- @idea -->
The best subarray lies entirely left of the midpoint, entirely right of it, or crosses it — solve the halves recursively and scan outward for the crossing case.

<!-- @steps -->
1. If the range holds a single element, that element is the answer.
2. Split the range at its midpoint and solve each half recursively.
3. For the crossing case, scan leftward from the midpoint tracking the best running sum.
4. Scan rightward from just past the midpoint doing the same.
5. The best crossing subarray is the sum of those two halves, since it must include the midpoint.
6. Return the largest of the three candidates.

<!-- @complexity -->
- time: O(n log n)
- space: O(log n) for the recursion stack
- note: The classic textbook alternative, and 22x slower than the linear approaches at n = 10,000,000 — 159.25ms against 7.04ms. It is worth knowing as a way of thinking about the problem rather than as a solution to it.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

static long long solve(const vector<int>& a, int lo, int hi) {
    if (lo == hi) return a[lo];
    int mid = lo + (hi - lo) / 2;

    long long left  = solve(a, lo, mid);
    long long right = solve(a, mid + 1, hi);

    long long s = 0, bestLeft = LLONG_MIN;      // must include the midpoint
    for (int i = mid; i >= lo; i--) { s += a[i]; bestLeft = max(bestLeft, s); }

    s = 0; long long bestRight = LLONG_MIN;
    for (int i = mid + 1; i <= hi; i++) { s += a[i]; bestRight = max(bestRight, s); }

    return max(max(left, right), bestLeft + bestRight);
}

long long maxSubArray(const vector<int>& a) { return solve(a, 0, (int)a.size() - 1); }
```

<!-- @annotations -->
- 14: Scanning outward from the midpoint, not from the edges — the crossing subarray is anchored there.
- 16: Both halves start from LLONG_MIN so a crossing subarray of entirely negative values is still found.
- 19: Measured 159.25ms at n = 10,000,000 against the prefix version's 7.04ms — 22x, from recursion and poor locality.

<!-- @code java -->
```java
static long solve(int[] a, int lo, int hi) {
    if (lo == hi) return a[lo];
    int mid = lo + (hi - lo) / 2;

    long left = solve(a, lo, mid), right = solve(a, mid + 1, hi);

    long s = 0, bestLeft = Long.MIN_VALUE;
    for (int i = mid; i >= lo; i--) { s += a[i]; bestLeft = Math.max(bestLeft, s); }

    s = 0; long bestRight = Long.MIN_VALUE;
    for (int i = mid + 1; i <= hi; i++) { s += a[i]; bestRight = Math.max(bestRight, s); }

    return Math.max(Math.max(left, right), bestLeft + bestRight);
}
```

<!-- @annotations -->
- 3: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which would overflow on a very large array.

<!-- @code python -->
```python
def max_sub_array(a):
    def solve(lo, hi):
        if lo == hi:
            return a[lo]
        mid = (lo + hi) // 2
        left, right = solve(lo, mid), solve(mid + 1, hi)

        s = 0; best_left = float('-inf')
        for i in range(mid, lo - 1, -1):
            s += a[i]; best_left = max(best_left, s)

        s = 0; best_right = float('-inf')
        for i in range(mid + 1, hi + 1):
            s += a[i]; best_right = max(best_right, s)

        return max(left, right, best_left + best_right)

    return solve(0, len(a) - 1)


# O(n log n) and O(log n) stack. On a large array this also risks the
# recursion limit — see the Stack Memory subtopic from Basics.
```

<!-- @annotations -->
- 18: max() taking three arguments directly, which reads better than nesting two two-argument calls.

<!-- @approach -->
### Optimal - Kadane's Algorithm

<!-- @idea -->
At each element, either extend the running subarray or start fresh from that element — whichever gives the larger sum.

<!-- @steps -->
1. Seed both the running sum and the best with the first element, never with zero.
2. Visit each remaining element in turn.
3. Set the running sum to the larger of the element alone and the running sum plus the element.
4. Update the best if the running sum now exceeds it.
5. Return the best after one pass.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Verified over all 19,530 test arrays with zero failures. Measured 0.947ns per element and flat in n, and 1.37x slower than the prefix-minimum formulation because its loop-carried value passes through both an add and a max each iteration.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

long long maxSubArray(const vector<int>& a) {
    long long best = a[0], cur = a[0];          // seeded from DATA, not from 0

    for (size_t i = 1; i < a.size(); i++) {
        cur  = max((long long)a[i], cur + a[i]);   // start fresh, or extend
        best = max(best, cur);
    }
    return best;
}
```

<!-- @annotations -->
- 6: Seeding with 0 returns 0 on an all-negative array — wrong on 100% of them, and on 0.65% of arrays overall.
- 9: The only decision in the algorithm: cur + a[i] wins exactly when cur is positive.
- 10: Measured 0.947ns per element, flat from four thousand to eight million — no cache cliff, since the state is two integers.

<!-- @code java -->
```java
static long maxSubArray(int[] a) {
    long best = a[0], cur = a[0];

    for (int i = 1; i < a.length; i++) {
        cur  = Math.max(a[i], cur + a[i]);
        best = Math.max(best, cur);
    }
    return best;
}
```

<!-- @annotations -->
- 2: Both seeded from a[0], which also means the loop can start at index 1.
- 5: Equivalent to 'if cur < 0 then cur = 0' before adding, because cur + x beats x exactly when cur > 0.

<!-- @code python -->
```python
def max_sub_array(a):
    best = cur = a[0]

    for x in a[1:]:
        cur = x if x > cur + x else cur + x     # avoids a max() call per element
        if cur > best:
            best = cur
    return best


# Measured at n = 2,000,000: 101.5ms with these explicit comparisons,
# against 116.2ms using max() — the function call costs about 14%.
```

<!-- @annotations -->
- 5: In a hot Python loop an inline conditional beats max(), which is a real function call on every element.
- 6: Same reasoning for the best update — an if is cheaper than max() here.

<!-- @approach -->
### Prefix Minimum

<!-- @idea -->
The best subarray ending at each position is the running total minus the smallest running total seen before it.

<!-- @steps -->
1. Keep a running total of the whole array so far.
2. Keep the smallest running total seen at any earlier point, starting at zero for the empty prefix.
3. At each element, the best subarray ending here is the running total minus that smallest earlier total.
4. Update the best with that value.
5. Then update the smallest earlier total with the current running total, in that order.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Same complexity as Kadane and measured 1.37x faster at every size tested — 0.688ns per element against 0.947ns, consistent from four thousand to eight million elements. Neither loop vectorises; the difference is that this one's critical dependency chain is a single add.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

long long maxSubArray(const vector<int>& a) {
    long long best = LLONG_MIN, sum = 0, minPrefix = 0;

    for (size_t i = 0; i < a.size(); i++) {
        sum += a[i];
        best = max(best, sum - minPrefix);      // best subarray ENDING here
        minPrefix = min(minPrefix, sum);        // update AFTER, never before
    }
    return best;
}
```

<!-- @annotations -->
- 7: minPrefix starts at 0, the empty prefix, which is what lets a subarray start at index 0.
- 11: Updating minPrefix before this line would allow an empty subarray and return 0 on all-negative input.
- 12: Measured 0.688ns per element against Kadane's 0.947ns — 1.37x, because the loop-carried sum passes through only an add.

<!-- @code java -->
```java
static long maxSubArray(int[] a) {
    long best = Long.MIN_VALUE, sum = 0, minPrefix = 0;

    for (int x : a) {
        sum += x;
        best = Math.max(best, sum - minPrefix);
        minPrefix = Math.min(minPrefix, sum);
    }
    return best;
}
```

<!-- @annotations -->
- 6: The order of these two lines is the correctness of the approach — recording the best before extending the candidate prefixes.

<!-- @code python -->
```python
from itertools import accumulate

def max_sub_array(a):
    best = float('-inf')
    min_prefix = 0

    for s in accumulate(a):          # running sums, computed in C
        if s - min_prefix > best:
            best = s - min_prefix
        if s < min_prefix:
            min_prefix = s
    return best


# Measured 80.7ms at n = 2,000,000 — the fastest Python option here,
# against 84.8ms for a hand-written running sum and 101.5ms for Kadane.
```

<!-- @annotations -->
- 7: accumulate moves the running-sum arithmetic into C, leaving only the comparisons interpreted.

<!-- @example -->

<!-- @input -->
a = [-2, 1, -3, 4, -1, 2, 1, -5, 4]

<!-- @output -->
6

<!-- @why -->
The standard example, and it shows cur restarting twice before the winning run begins — the restarts are the algorithm working, not a sign of trouble.

<!-- @walkthrough -->
1. Seed both cur and best with -2, the first element.
2. At 1: extending gives -2 + 1 = -1, starting fresh gives 1, so cur becomes 1 and best rises to 1.
3. At -3: extending gives -2, starting fresh gives -3, so cur becomes -2 and best stays 1.
4. At 4: extending gives -2 + 4 = 2, starting fresh gives 4, so cur becomes 4 and best rises to 4.
5. At -1 then 2 then 1: extending wins each time, taking cur to 3, then 5, then 6, and best follows to 6.
6. At -5: cur drops to 1, and best stays at 6.
7. At the final 4: extending gives 5, starting fresh gives 4, so cur becomes 5 — still below 6.
8. The answer is 6, from the subarray 4, -1, 2, 1.

<!-- @example -->

<!-- @input -->
a = [-3, -1, -2] with best initialised to 0

<!-- @output -->
0 — the correct answer is -1

<!-- @why -->
The two failure rates together are the lesson: the bug fires on exactly one input class, so random testing passes and an all-negative test fails every time.

<!-- @walkthrough -->
1. Every element is negative, so extending never beats starting fresh and cur simply tracks each element in turn.
2. cur takes the values -3, then -1, then -2.
3. With best correctly seeded to a[0] = -3, it rises to -1 at the second element and finishes there.
4. With best initialised to 0, none of those values ever exceeds it, so 0 is returned.
5. But 0 is the sum of the EMPTY subarray, and the problem requires a non-empty one.
6. Measured, that initialisation was wrong on 126 of 126 all-negative arrays — 100% — while being wrong on only 0.65% of arrays overall.

<!-- @example -->

<!-- @input -->
a = [-3] and a = [5]

<!-- @output -->
-3 and 5

<!-- @why -->
One element is enough to break the wrong initialisation, which is why the fix belongs in the seed rather than in a guard added afterwards.

<!-- @walkthrough -->
1. With a single element, the loop body never runs at all.
2. Both cur and best were seeded from a[0], so the seed is already the answer.
3. For [5] that gives 5, which any initialisation would have produced.
4. For [-3] it gives -3, which is the smallest input that exposes the zero-initialisation bug.
5. That bug returns 0 for [-3] — a plausible-looking number that is not the sum of any non-empty subarray.
6. Seeding from the data rather than from a constant is what makes both cases fall out with no special handling.

<!-- @example -->

<!-- @input -->
The same array through Kadane and the prefix-minimum formulation at 8,388,608 elements

<!-- @output -->
0.946ns per element against 0.688ns — the prefix version is 1.37x faster

<!-- @why -->
Two algorithms with identical complexity, identical memory behaviour and no vectorisation in either, differing only in dependency-chain length — which isolates that one factor better than any earlier subtopic.

<!-- @walkthrough -->
1. Both are single passes holding O(1) state, and both measured perfectly flat in n from four thousand elements upward.
2. Neither loop vectorises — clang reports the same refusal for both, that a value which is not a reduction is used outside the loop.
3. The difference is what the loop-carried value must pass through before the next iteration can start.
4. Kadane's running value goes through an addition and then a maximum, which is two dependent operations.
5. The prefix version's running sum goes through only an addition, with the maximum and minimum hanging off it rather than sitting on that chain.
6. One extra operation of latency per element accounts for the measured ratio of roughly 1.37.

<!-- @visualization array -->

<!-- @description -->
The array as a strip of signed bars rising above and falling below a zero line, so positive and negative runs are legible as shape before any arithmetic. A marker advances left to right with two readouts pinned above: CURRENT, drawn as a bar that grows and collapses, and BEST, drawn as a high-water line that only ever rises. At each element show the two candidates explicitly as a fork — one branch labelled extend with the value cur plus x, the other labelled start fresh with the value x — and light whichever wins, so the single decision the algorithm makes is visible at every step rather than implied. When start fresh wins, animate the accumulated bar collapsing to nothing and rebuilding from this element, and tint the discarded prefix grey; that collapse is the reset, and it should read as deliberate rather than as a failure. Whenever CURRENT rises above the BEST line, raise the line and stamp the subarray that produced it beneath the strip, keeping every previous stamp visible so the reader can see later candidates failing to beat an earlier one. The all-negative panel is the decisive one: run [-3,-1,-2] with a toggle for the initialiser. Seeded from a[0] the BEST line starts at -3, below the zero line, and climbs to -1. Seeded at 0 the line starts ON the zero line and nothing ever reaches it, so the answer returned is the zero line itself — draw that as an empty selection with no bars under it at all, labelled as the sum of the empty subarray, with the measured rates alongside: 100% of all-negative arrays and 0.65% overall. A second panel puts the prefix-minimum view beside Kadane on the same input: plot the running total as a line, mark the lowest point seen so far with a descending marker, and show the answer as the largest vertical gap between the line and that marker — visually the same answer arrived at from a completely different picture. Close with a dependency-chain strip: Kadane's loop drawn as add-then-max feeding the next iteration, the prefix version as add alone, with the measured 0.947ns and 0.688ns beneath and a note that neither loop vectorises.

<!-- @sampleInput -->
```json
{"primary":{"array":[-2,1,-3,4,-1,2,1,-5,4],"trace":[{"i":0,"x":-2,"cur":-2,"best":-2,"seed":true},{"i":1,"x":1,"extend":-1,"fresh":1,"chose":"fresh","cur":1,"best":1},{"i":2,"x":-3,"extend":-2,"fresh":-3,"chose":"extend","cur":-2,"best":1},{"i":3,"x":4,"extend":2,"fresh":4,"chose":"fresh","cur":4,"best":4},{"i":4,"x":-1,"extend":3,"fresh":-1,"chose":"extend","cur":3,"best":4},{"i":5,"x":2,"extend":5,"fresh":2,"chose":"extend","cur":5,"best":5},{"i":6,"x":1,"extend":6,"fresh":1,"chose":"extend","cur":6,"best":6},{"i":7,"x":-5,"extend":1,"fresh":-5,"chose":"extend","cur":1,"best":6},{"i":8,"x":4,"extend":5,"fresh":4,"chose":"extend","cur":5,"best":6}],"answer":6,"winningSubarray":[4,-1,2,1],"winningRange":[3,6],"restarts":2},"allNegativePanel":{"array":[-3,-1,-2],"seededFromData":{"init":-3,"answer":-1},"seededZero":{"init":0,"answer":0,"selectionEmpty":true,"note":"0 is the sum of the EMPTY subarray"},"failureAllNegative":{"wrong":126,"of":126,"rate":1.0},"failureOverall":{"wrong":126,"of":19530,"rate":0.0065},"smallestCase":{"array":[-3],"buggy":0,"correct":-3}},"prefixView":{"runningTotals":[-2,-1,-4,0,-1,1,2,-3,1],"minPrefixSoFar":[0,-2,-2,-4,-4,-4,-4,-4,-4],"bestGap":6,"gapBetween":{"minPrefixIndex":2,"sumIndex":6}},"performance":{"unit":"ns per element","rows":[{"n":4096,"kadane":0.947,"prefixMin":0.693},{"n":65536,"kadane":0.943,"prefixMin":0.691},{"n":1048576,"kadane":0.949,"prefixMin":0.685},{"n":8388608,"kadane":0.946,"prefixMin":0.688}],"ratio":1.37,"flatInN":true,"kadaneChain":["add","max"],"prefixChain":["add"],"vectorized":{"kadane":false,"prefixMin":false,"reason":"value that could not be identified as reduction is used outside the loop"}},"others":{"n":10000000,"divideConquerMs":159.25,"prefixMinMs":7.04,"kadaneMs":9.51},"python":{"n":2000000,"accumulateMs":80.7,"prefixMinMs":84.8,"kadaneIfMs":101.5,"kadaneMaxMs":116.2}}
```

<!-- @highlights -->
- The array is drawn as signed bars above and below a zero line, so the runs of positive and negative values read as shape before any arithmetic starts.
- CURRENT is a bar that grows and collapses; BEST is a high-water line that only ever rises.
- At each element a fork appears — one branch labelled extend showing cur plus x, the other labelled start fresh showing x — and the winner lights up.
- At the value 1 the fresh branch wins, so the accumulated bar collapses to nothing and rebuilds, with the discarded prefix tinted grey.
- That collapse is the reset, and it happens twice in this array before the winning run even begins.
- From the 4 onward the extend branch wins every time, and CURRENT climbs 4, 3, 5, 6.
- Each time CURRENT passes the BEST line, the line rises and the responsible subarray is stamped beneath the strip.
- The stamps stay visible, so the later run reaching only 5 is seen failing to beat the earlier 6.
- The all-negative panel runs [-3,-1,-2] with the BEST line seeded from a[0], starting below zero and climbing to -1.
- Toggling the initialiser to 0 puts the line ON the zero axis, and no bar ever reaches it.
- The returned answer is drawn as an empty selection with no bars beneath it at all, labelled the sum of the empty subarray.
- Its measured rates sit alongside: wrong on 100% of all-negative arrays and 0.65% of arrays overall.
- The prefix panel replots the same input as a running-total line with a descending marker tracking the lowest point seen.
- The answer appears as the largest vertical gap between the line and that marker — the same 6, from a completely different picture.
- The closing strip draws Kadane's loop as add-then-max feeding the next iteration, and the prefix version as add alone.
- Their measured costs sit beneath — 0.947ns against 0.688ns per element — with a note that neither loop vectorises, so the gap is chain length alone.

<!-- @edgeCases -->
- Single element — the loop never runs and the seed is already the answer, which is why seeding from a[0] matters.
- Single negative element such as [-3] — the smallest input that exposes a zero initialisation.
- All elements negative — the answer is the least-negative element, and the case where a zero initialiser is wrong 100% of the time.
- All elements positive — the answer is the sum of the whole array and the running value never resets.
- A single positive among negatives — the answer is that element alone.
- An array containing zeros — extending through a zero neither helps nor hurts, and the answer is unaffected.
- The maximum subarray at the very start, so the best is set early and never beaten.
- The maximum subarray at the very end, so the running value resets several times before the winning run begins.
- The whole array being the answer, where no reset ever fires.
- Ties between several subarrays of equal maximum sum — any is acceptable, since only the sum is returned.
- Large values where the running sum exceeds 32-bit range, requiring a 64-bit accumulator even when the elements themselves fit an int.

<!-- @pitfalls -->
- Initialising best to 0. Measured wrong on 126 of 126 all-negative arrays — 100% — while wrong on only 0.65% of arrays overall, so random testing passes and the bug ships.
- Assuming a low overall failure rate means a rare bug. It fires on one input class and always fires there.
- Initialising cur to 0 as well and starting the loop at index 0, which allows an empty subarray by the back door.
- Confusing the two contracts. If the empty subarray IS permitted, 0 is a valid answer and zero initialisation is correct — decide before writing the seed.
- Resetting cur to 0 on a negative running total without also seeding best from the data, which produces the same all-negative failure.
- Updating minPrefix before recording the best in the prefix formulation, which permits an empty subarray and returns 0 on all-negative input.
- Accumulating the running sum in a 32-bit int, which can overflow well before the array is large even when every element fits.
- Reaching for divide and conquer because it is the textbook alternative. Measured 22x slower than the linear approaches at n = 10,000,000.
- Using recursion on a very large array, where the divide-and-conquer stack depth becomes a real constraint.
- Calling max() inside a hot Python loop. Measured 14% slower than an inline conditional at n = 2,000,000.
- Expecting a single-variable accumulation loop to vectorise. Neither of these does, because the loop-carried value is not a plain reduction.
- Returning cur instead of best, which reports the sum of the run ending at the last element rather than the best run anywhere.

<!-- @doubt -->
### Why is the rule max(x, cur + x) and not something more complicated?

<!-- @answer -->
Because there are only two possibilities and no third. Any subarray ending at x either includes the element immediately before x, or it does not. If it does, the best such subarray is the best one ending at the previous element with x appended — which is exactly cur + x. If it does not, the subarray is x alone. Taking the larger of those two covers every case. Everything else in the algorithm is just recording the best value cur ever reaches.

<!-- @doubt -->
### Why can't I initialise best to 0?

<!-- @answer -->
Because 0 is the sum of the empty subarray, and the problem asks for a non-empty one. On an array where every element is negative, no non-empty subarray can reach 0, so the algorithm returns 0 — a number that is not the sum of anything you were allowed to choose. Measured over 19,530 test arrays it was wrong 126 times, only 0.65%, but restricted to all-negative arrays it was wrong 126 out of 126 — every single one. The smallest failure is [-3], which returns 0 instead of -3. Seed both cur and best from a[0] and the problem disappears.

<!-- @doubt -->
### If it is only wrong 0.65% of the time, is it really a problem?

<!-- @answer -->
Yes, and the two rates together are the reason. The failures are not scattered across 0.65% of random inputs — they are concentrated entirely in one input class, where the failure rate is 100%. So a random test suite almost never generates an all-negative array and the bug passes every run, while any deliberate all-negative test catches it immediately. A bug that is either always right or always wrong depending on input shape is far more dangerous than one that fails uniformly, because your test results carry no information about it.

<!-- @doubt -->
### Is 'reset cur to 0 when it goes negative' the same algorithm?

<!-- @answer -->
Yes, and the equivalence is worth seeing rather than taking on trust. cur + x beats x exactly when cur > 0, so choosing the maximum and discarding a negative prefix are the same decision phrased differently. Both were verified over all 19,530 test arrays with zero failures. The one thing that does not change is the initialisation: the reset phrasing still needs best seeded from the data, and writing it with best = 0 reintroduces the all-negative bug in full.

<!-- @doubt -->
### Why does the prefix-minimum version run faster if both are O(n)?

<!-- @answer -->
Because of dependency-chain length, which complexity does not describe. Measured per element: Kadane 0.947ns, prefix-minimum 0.688ns — a consistent 1.37x from four thousand elements to eight million. It is not vectorisation, because clang refuses to vectorise both loops with the same message. The difference is what the loop-carried value passes through before the next iteration can begin: Kadane's cur goes through an add and then a max, while the prefix version's running sum goes through only an add, with the max and min hanging off it rather than sitting on the chain. One extra dependent operation per element, and the measured gap matches.

<!-- @doubt -->
### Which one should I actually write?

<!-- @answer -->
Kadane's, almost always. It is the expected answer, it needs no prefix-sum reasoning to explain, and 1.37x rarely decides anything at these speeds — both process a million elements in about a millisecond. Reach for the prefix-minimum version when this specific loop is genuinely hot and profiling says so, or when you already have prefix sums computed for another reason. Knowing both is worth it mainly because the prefix view is what generalises to problems Kadane's does not cover.

<!-- @doubt -->
### How does this relate to Maximum Consecutive Ones?

<!-- @answer -->
It is the same skeleton with two substitutions. There you carried a running count and reset it when the element was 0; here you carry a running sum and reset it when the sum turns negative. Both keep a best-ever value updated as they go, both are one pass and O(1) space, and both fail in the same way if you update the best in the wrong place or seed it from a constant instead of the data. If that subtopic clicked, this is a substitution rather than a new algorithm — which is exactly why it came first.

<!-- @doubt -->
### Why is divide and conquer so much slower if it is O(n log n)?

<!-- @answer -->
Because the log factor is real and it is competing against two extremely cheap linear passes. Measured at n = 10,000,000: divide and conquer 159.25ms against the prefix version's 7.04ms — 22x. It pays for recursion overhead, poor cache locality as it jumps between halves, and the extra logarithmic factor, while the linear versions walk memory once in order with two integers of state. It remains a useful way to think about the problem — the three-case split is genuinely illuminating — but not a solution to reach for.

<!-- @doubt -->
### How do I return the subarray itself rather than just the sum?

<!-- @answer -->
Track where the current run started. Whenever you choose to start fresh, set a start marker to the current index; whenever the best updates, record that marker and the current index as the best range. It adds two variables and no extra passes. The one detail to get right is that the start marker must be updated at the moment you restart, not when the best updates — otherwise the recorded range will begin at the wrong place on any input where a restart happens between two improvements. That is the next subtopic.
