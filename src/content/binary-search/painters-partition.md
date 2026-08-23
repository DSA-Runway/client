---
id: painters-partition
topic: Binary Search
title: Painter's Partition
difficulty: Medium
status: ready
prerequisites:
  - capacity-to-ship-packages-within-d-days
  - koko-eating-bananas
  - integer-overflow-and-precision-errors
relatedIds:
  - capacity-to-ship-packages-within-d-days
  - split-array-largest-sum
  - book-allocation-problem
  - aggressive-cows
  - integer-overflow-and-precision-errors
---

<!-- @summary -->
The same problem as Capacity to Ship Packages, stated from the opposite end — the shipping container's own solver answers it correctly on every case tested. Two things are genuinely new: the sum of the input now exceeds a 32-bit int, so the overflow lands in the search bound rather than the accumulator and produces a negative painting time; and because this is phrased as a partition problem it invites a dynamic program, which measures 694x slower at n = 2,000 and is unusable at the real limits.

<!-- @theory -->
## The problem

Boards of given lengths are painted by k painters. Each painter takes a
**contiguous** block, all work at once, and painting a board costs its length.
Minimise the time until everything is painted — which is the largest total any one
painter is given.

```
boards = [10, 20, 30, 40],      k = 2   ->  60      [10,20,30] and [40]
boards = [5, 10, 30, 20, 15],   k = 3   ->  35      [5,10] [30] [20,15]
boards = [1, 1, 1, 1],          k = 4   ->  1
```

A larger time limit never needs more painters, so the predicate is monotone and
the answer is a lower bound over it.

## It is the shipping problem

Put the two statements next to each other:

```
ship  : minimise a capacity C such that the array splits into
        at most D contiguous runs, each summing to at most C

paint : minimise the largest segment sum over
        k contiguous segments
```

The same optimisation, read from opposite ends — one names the limit and counts
the runs, the other names the runs and minimises the limit. Checked rather than
asserted: the **shipped** `ship_within_days` from that container was run unchanged
on Painter's Partition inputs, against a reference that exhaustively partitions by
dynamic programming, over 605 randomised cases — **0 disagreements.**

## "At most k" and "exactly k" are the same question

Painter's Partition is often stated with *exactly* k painters, which sounds
stricter than the shipping problem's *at most* D days. It is not, and the reason
is that splitting further can only lower the maximum, never raise it — so any
solution using fewer than k segments can be split until it uses exactly k without
getting worse.

Verified against a dynamic program that forces exactly k segments, over every
array of length 1 to 7 with values 1 to 4: **145,636 pairs with k ≤ n, plus 65,532
with k > n — 0 disagreements.** When k exceeds the number of boards the answer is
simply the longest board; the surplus painters idle.

## The overflow moved into the bound

This is the fourth container built on this skeleton, and the fourth different
answer to "does a 32-bit accumulator work". The way to settle it is not to
remember the previous verdict but to compute the largest value involved.

| | values up to | n up to | worst-case sum |
|---|---|---|---|
| Capacity to Ship | 500 | 5 × 10⁴ | 2.5 × 10⁷ — comfortable |
| **Painter's Partition** | **10⁵** | **10⁵** | **10¹⁰ — far past INT_MAX** |

Only **21,475** boards of 100,000 are needed to pass 2,147,483,647. And the
failure is different in kind from the earlier ones, because the quantity that
overflows is `hi = sum(boards)` — the *search bound itself*, not the accumulator
inside the predicate:

```
30,000 boards of 100,000

exact sum       :  3,000,000,000
as a 32-bit int : -1,294,967,296     negative

lo = max(board) = 100,000
hi = -1,294,967,296

lo > hi, so the loop never executes and the function
returns hi:  -1,294,967,296
```

A negative painting time. Compare the three earlier verdicts on the identical
skeleton:

- **Koko** — the accumulator wrapped, read as "within budget", and the answer
  silently collapsed to 1.
- **Minimum Days for M Bouquets** — the guard wrapped on 99.97% of inputs and
  changed no answers, because the code beneath it was independently correct.
- **Find the Smallest Divisor** — provably safe, because the largest sum the
  search can evaluate is bounded by about `2 × threshold + n`.
- **Painter's Partition** — the bound itself wraps, the search range inverts, and
  the answer is negative.

Four problems, one algorithm, four outcomes. The bound is cheap to compute and the
verdict is not portable.

## A partition problem invites the wrong tool

Because this is phrased as "split the array into k parts", the instinct is a
dynamic program: for each prefix and each number of painters, minimise the maximum
segment. That is correct — 0 disagreements against the binary search over 3,000
randomised cases — and it is O(n²k).

Microseconds per call:

| n | k | DP over partitions | binary search | |
|---|---|---|---|---|
| 20 | 3 | 2.41 | **0.584** | 4x |
| 100 | 10 | 197.01 | **5.141** | 38x |
| 400 | 10 | 3,696.72 | **19.885** | 186x |
| 2,000 | 3 | 24,149.03 | **67.969** | 355x |
| 2,000 | 10 | 101,374.82 | **146.050** | **694x** |

At n = 2,000 the DP already takes a tenth of a second. At the problem's stated
limit of n = 10⁵ it would need on the order of 10¹¹ operations and is simply not
runnable.

The lesson is not that dynamic programming is bad, but that the question "how do I
split this optimally?" and the question "is a limit of C achievable?" have very
different costs. The second is a single greedy pass, and searching over C turns
the whole problem into `log(sum)` of those passes.

## Trying every answer, for completeness

The candidate range runs from the longest board to the total, and walking it is
O((sum − max) · n):

| n | try every answer | binary search | | candidate range |
|---|---|---|---|---|
| 20 | 8.18 | **0.310** | 26x | 803 |
| 100 | 311.10 | **1.669** | 186x | 5,601 |
| 400 | 4,764.84 | **7.332** | 650x | 18,990 |

Those runs used board lengths capped at 100 to keep the brute force runnable at
all. At the real limits the candidate range is about **10¹⁰**, so it is not a
contender — it is here because its inner loop is the predicate the binary search
reuses.

<!-- @intuition -->
It is worth noticing what the binary search actually replaces. The dynamic program answers a harder question than the problem asks: it computes, for every prefix and every painter count, the best achievable maximum — a whole table of optimal sub-answers. The problem only wants one number. Binary search gets it by never solving the optimisation at all; it only ever asks the *decision* question, "can k painters finish within this limit?", which a single greedy pass settles. Trading an optimisation problem for a decision problem and then searching over the answer is the move this entire tier is built on, and this container is where the trade is most visible, because the alternative is not a slow scan but a respectable algorithm that is nonetheless 694 times slower.

<!-- @approach -->
### Try Every Answer

<!-- @idea -->
Test every time limit upward from the longest board and return the first that k painters can meet.

<!-- @steps -->
1. The answer is at least the longest board and at most the total length.
2. For each candidate limit, walk the boards assigning them greedily.
3. Count how many painters that needs.
4. Return the first limit that needs at most k.
5. The total always works, since one painter can do everything.

<!-- @complexity -->
- time: O((sum − max) · n)
- space: O(1)
- note: Not a contender at the real limits, where the candidate range is about 10¹⁰. Measured 4,764.84 microseconds against the binary search's 7.332 at n = 400 with short boards — 650x — and it only ran at all because those boards were capped at 100.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

static int paintersNeeded(const vector<int>& boards, long long limit) {
    int painters = 1;
    long long load = 0;
    for (int b : boards) {
        if (load + b > limit) { painters++; load = b; }
        else                    load += b;
    }
    return painters;
}

long long minTime(const vector<int>& boards, int k) {
    long long lo = 0, hi = 0;
    for (int b : boards) { lo = max(lo, (long long)b); hi += b; }
    for (long long limit = lo; limit <= hi; limit++)
        if (paintersNeeded(boards, limit) <= k) return limit;
    return hi;
}
```

<!-- @annotations -->
- 10: `load = b`, not `load = 0`. The board that did not fit becomes the first board of the next painter — setting it to zero loses that board silently.
- 17: `(long long)b` inside the max, and `hi` accumulating in 64 bits. At this problem's limits the total reaches 10^10, so an `int` here makes the search range negative.
- 18: Starting at the longest board. A limit below it cannot be met by any number of painters, so this is a correctness bound rather than an optimisation — the same domain restriction the shipping container measured.

<!-- @code java -->
```java
static int paintersNeeded(int[] boards, long limit) {
    int painters = 1;
    long load = 0;
    for (int b : boards) {
        if (load + b > limit) { painters++; load = b; }
        else                    load += b;
    }
    return painters;
}

static long minTime(int[] boards, int k) {
    long lo = 0, hi = 0;
    for (int b : boards) { lo = Math.max(lo, b); hi += b; }
    for (long limit = lo; limit <= hi; limit++)
        if (paintersNeeded(boards, limit) <= k) return limit;
    return hi;
}
```

<!-- @annotations -->
- 13: `long lo, hi`. Declaring these as `int` is the bug this container exists for — the sum reaches 10^10.

<!-- @code python -->
```python
def painters_needed(boards, limit):
    painters, load = 1, 0
    for b in boards:
        if load + b > limit:
            painters += 1
            load = b
        else:
            load += b
    return painters


def min_time(boards, k):
    for limit in range(max(boards), sum(boards) + 1):
        if painters_needed(boards, limit) <= k:
            return limit
    return sum(boards)
```

<!-- @annotations -->
- 14: `range(max(boards), ...)`. Python integers cannot overflow, so the only reason this bound matters here is correctness — a limit below the longest board is unachievable.

<!-- @approach -->
### Dynamic Programming over Partitions

<!-- @idea -->
Build a table: for each prefix and each painter count, the smallest achievable maximum segment sum.

<!-- @steps -->
1. Precompute prefix sums so any segment's total is one subtraction.
2. With one painter, the answer for a prefix is the whole prefix.
3. With j painters, try every position where the last painter's block could begin.
4. Take the better of the previous painters' maximum and the last block's total.
5. The answer is the entry for the whole array with k painters.

<!-- @complexity -->
- time: O(n²k)
- space: O(n) with a rolling row
- note: Correct — 0 disagreements against the binary search over 3,000 randomised cases — and the wrong tool. Measured **694x slower at n = 2,000 with k = 10** (101,374.82 microseconds against 146.050), and at the problem's limit of n = 10⁵ it would need on the order of 10¹¹ operations.

<!-- @code cpp -->
```cpp
#include <vector>
#include <climits>
#include <algorithm>
using namespace std;

long long minTime(const vector<int>& boards, int k) {
    int n = (int)boards.size();
    k = min(k, n);                       // more painters than boards cannot help
    vector<long long> pre(n + 1, 0);
    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + boards[i];

    vector<long long> prev(n + 1, LLONG_MAX), cur(n + 1, LLONG_MAX);
    prev[0] = 0;
    for (int j = 1; j <= k; j++) {
        fill(cur.begin(), cur.end(), LLONG_MAX);
        for (int i = 1; i <= n; i++)
            for (int e = j - 1; e < i; e++)
                if (prev[e] != LLONG_MAX)
                    cur[i] = min(cur[i], max(prev[e], pre[i] - pre[e]));
        swap(prev, cur);
    }
    return prev[n];
}
```

<!-- @annotations -->
- 10: Prefix sums in 64 bits, so any segment total is one subtraction and nothing overflows on the way.
- 12: Two rows rather than a full table, since row j only depends on row j - 1. That drops the space from O(nk) to O(n) and changes nothing else.
- 19: The recurrence: the cost of a split is the worse of what came before and the last block. Using `+` instead of `max` here solves a different problem — minimising the total rather than the maximum.
- 20: `swap` rather than copying, so the rolling rows cost nothing per painter.
- 22: This table answers far more than was asked — every prefix and every painter count — which is precisely why it is 694x slower than deciding one limit at a time.

<!-- @code java -->
```java
static long minTime(int[] boards, int k) {
    int n = boards.length;
    k = Math.min(k, n);                  // more painters than boards cannot help
    long[] pre = new long[n + 1];
    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + boards[i];

    long[] prev = new long[n + 1], cur = new long[n + 1];
    Arrays.fill(prev, Long.MAX_VALUE);
    prev[0] = 0;
    for (int j = 1; j <= k; j++) {
        Arrays.fill(cur, Long.MAX_VALUE);
        for (int i = 1; i <= n; i++)
            for (int e = j - 1; e < i; e++)
                if (prev[e] != Long.MAX_VALUE)
                    cur[i] = Math.min(cur[i], Math.max(prev[e], pre[i] - pre[e]));
        long[] t = prev; prev = cur; cur = t;
    }
    return prev[n];
}
```

<!-- @annotations -->
- 14: The `prev[e] != Long.MAX_VALUE` guard stops the sentinel being used in arithmetic, which would overflow rather than stay infinite.

<!-- @code python -->
```python
def min_time(boards, k):
    n = len(boards)
    k = min(k, n)                        # more painters than boards cannot help
    pre = [0] * (n + 1)
    for i, b in enumerate(boards):
        pre[i + 1] = pre[i] + b

    prev = [float("inf")] * (n + 1)
    prev[0] = 0
    for _ in range(k):
        cur = [float("inf")] * (n + 1)
        for i in range(1, n + 1):
            for e in range(i):
                if prev[e] < float("inf"):
                    cur[i] = min(cur[i], max(prev[e], pre[i] - pre[e]))
        prev = cur
    return prev[n]
```

<!-- @annotations -->
- 8: `float("inf")` works as a sentinel here because it is never added to — only compared and passed through `max`.

<!-- @approach -->
### Binary Search on the Answer

<!-- @idea -->
Search the time limit directly, testing each candidate with one greedy pass that counts painters.

<!-- @steps -->
1. The answer lies between the longest board and the total length.
2. Take the midpoint limit.
3. Walk the boards, giving each to the current painter until the limit would be exceeded, then starting a new one.
4. If that needs at most k painters, record the limit and search lower; otherwise search higher.
5. The last recorded limit is the answer.

<!-- @complexity -->
- time: O(n log(sum − max)) — about 34 probes at this problem's limits
- space: O(1)
- note: The answer, and the same code as the shipping container's with the names changed. Measured 146.050 microseconds at n = 2,000 with k = 10 against the dynamic program's 101,374.82. The 64-bit bounds are not optional here: the total reaches 10¹⁰ and an `int` makes `hi` negative.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

long long minTime(const vector<int>& boards, int k) {
    long long lo = 0, hi = 0;
    for (int b : boards) { lo = max(lo, (long long)b); hi += b; }
    long long ans = hi;
    while (lo <= hi) {
        long long limit = lo + (hi - lo) / 2;
        int painters = 1;
        long long load = 0;
        for (int b : boards) {
            if (load + b > limit) { painters++; load = b; }
            else                    load += b;
        }
        if (painters <= k) { ans = limit; hi = limit - 1; }
        else                 lo = limit + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 7: Both bounds in 64 bits, and this is the whole bug of this container. With `int hi` the sum of 30,000 boards of 100,000 wraps to -1,294,967,296, the range becomes empty, and the function returns that negative number as the painting time. `lo = max(board)` is a correctness bound, not an optimisation — no number of painters can finish a board in less than its own length.
- 10: Subtracting before halving, so `lo + hi` never overflows even though both are already large.
- 14: `load = b`, not `0`. The board that overflowed the current painter becomes the first board of the next.
- 17: `painters <= k`, so "at most k" — which is the same as "exactly k", verified over 211,168 exhaustive pairs, because splitting further can only lower the maximum.
- 20: `ans`, not `lo`. This form runs until the pointers cross, so both move past the answer.

<!-- @code java -->
```java
static long minTime(int[] boards, int k) {
    long lo = 0, hi = 0;
    for (int b : boards) { lo = Math.max(lo, b); hi += b; }
    long ans = hi;
    while (lo <= hi) {
        long limit = lo + (hi - lo) / 2;
        int painters = 1;
        long load = 0;
        for (int b : boards) {
            if (load + b > limit) { painters++; load = b; }
            else                    load += b;
        }
        if (painters <= k) { ans = limit; hi = limit - 1; }
        else                 lo = limit + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 3: `Math.max(lo, b)` promotes `b` to long automatically, and `hi += b` accumulates in long because `hi` is long. Declaring either as `int` reintroduces the bug.

<!-- @code python -->
```python
def min_time(boards, k):
    lo, hi = max(boards), sum(boards)
    ans = hi
    while lo <= hi:
        limit = (lo + hi) // 2
        painters, load = 1, 0
        for b in boards:
            if load + b > limit:
                painters += 1
                load = b
            else:
                load += b
        if painters <= k:
            ans = limit
            hi = limit - 1
        else:
            lo = limit + 1
    return ans


# Character for character the shipping problem's search,
# with capacity/days renamed to limit/painters.
```

<!-- @annotations -->
- 2: Python integers grow as needed, so the overflow that makes the C++ and Java versions return a negative time cannot happen here.

<!-- @example -->

<!-- @input -->
```
boards = [10, 20, 30, 40], k = 2
```

<!-- @output -->
```
60
```

<!-- @why -->
Two painters split the boards as [10,20,30] and [40], giving 60 and 40. Any earlier split leaves one painter with 70.

<!-- @walkthrough -->
```
lo = max = 40, hi = sum = 100

lo=40 hi=100  limit=70  [10,20,30]=60 | [40]      2 painters  fits, hi=69
lo=40 hi=69   limit=54  [10,20]=30 | [30]  | [40]  3 painters  lo=55
lo=55 hi=69   limit=62  [10,20,30]=60 | [40]      2 painters  fits, hi=61
lo=55 hi=61   limit=58  [10,20]=30 | [30] | [40]   3 painters  lo=59
lo=59 hi=61   limit=60  [10,20,30]=60 | [40]      2 painters  fits, hi=59
lo=59 hi=59   limit=59  [10,20]=30 | [30] | [40]   3 painters  lo=60
lo=60 > hi=59 -> 60

The alternative split [10,20] and [30,40] gives 70, which is
why the answer is not simply half the total.
```

<!-- @example -->

<!-- @input -->
```
boards = [5, 10, 30, 20, 15], k = 3
```

<!-- @output -->
```
35
```

<!-- @why -->
Three painters take [5,10], [30] and [20,15] — totals 15, 30 and 35. At a limit of 34 the last pair no longer fits together and a fourth painter is needed.

<!-- @walkthrough -->
```
limit = 35 : 5+10=15, +30 would be 45  -> painter 1 = [5,10]
             30, +20 would be 50       -> painter 2 = [30]
             20+15 = 35                -> painter 3 = [20,15]
             3 painters   fits

limit = 34 : [5,10] | [30] | [20] | [15]   4 painters   too many

The answer sits exactly at a segment total, which is always
true: the limit only matters where it equals some achievable
segment sum.
```

<!-- @example -->

<!-- @input -->
```
boards = [1, 1, 1, 1], k = 4
```

<!-- @output -->
```
1
```

<!-- @why -->
As many painters as boards, so each takes one and the answer is the longest board. This is the case that makes `lo = max(board)` provably tight, and it extends to any k greater than n.

<!-- @walkthrough -->
```
lo = max = 1, hi = sum = 4
lo=1 hi=4   limit=2   [1,1] | [1,1]        2 painters  fits, hi=1
lo=1 hi=1   limit=1   [1]|[1]|[1]|[1]      4 painters  fits, hi=0
lo=1 > hi=0 -> 1

With k = 5 or k = 100 the answer is still 1 — the surplus
painters idle. Verified over 65,532 exhaustive cases with
k > n: the answer is always max(board).
```

<!-- @example -->

<!-- @input -->
```
30,000 boards each of length 100,000, k = 3
```

<!-- @output -->
```
1000000000
```

<!-- @why -->
The case where 32-bit bounds break. The total is 3,000,000,000, which wraps to a negative int, so the search range inverts and the function returns a negative painting time.

<!-- @walkthrough -->
```
exact sum        =  3,000,000,000
as a 32-bit int  = -1,294,967,296

With int bounds:
  lo = max(board) = 100,000
  hi = -1,294,967,296
  lo <= hi is FALSE, so the loop body never runs
  return ans, which was initialised to hi  ->  -1,294,967,296

With 64-bit bounds:
  lo = 100,000, hi = 3,000,000,000
  three painters split 30,000 boards evenly
  -> 10,000 boards each -> 1,000,000,000

Only 21,475 boards of 100,000 are needed to cross INT_MAX.
```

<!-- @visualization custom -->

<!-- @description -->
Shows that this is the shipping problem restated, the overflow that now lands in the search bound rather than the accumulator, and the measured cost of reaching for a partition DP instead of searching the answer.

<!-- @sampleInput -->
```json
{"primary":{"boards":[5,10,30,20,15],"k":3,"answer":35,"split":[[5,10],[30],[20,15]],"totals":[15,30,35],"atLimit34":{"split":[[5,10],[30],[20],[15]],"painters":4,"tooMany":true},"note":"the answer always sits exactly at some achievable segment total"},"sameAsShipping":{"statements":{"ship":"minimise a capacity C such that the array splits into at most D contiguous runs each summing to at most C","paint":"minimise the largest segment sum over k contiguous segments"},"reading":"the same optimisation read from opposite ends — one names the limit and counts runs, the other names the runs and minimises the limit","verification":{"method":"ran the shipping container's SHIPPED ship_within_days unchanged on Painter's inputs","reference":"exhaustive DP over contiguous partitions","cases":605,"disagreements":0}},"atMostEqualsExactly":{"claim":"'exactly k painters' and 'at most k painters' give the same answer","why":"splitting further can only lower the maximum, so any solution using fewer than k segments can be split until it uses exactly k without getting worse","verified":{"kLessOrEqualN":145636,"kGreaterThanN":65532,"disagreements":0},"kGreaterThanN":"the answer is max(board); the surplus painters idle"},"overflowMovedIntoTheBound":{"comparison":[{"problem":"Capacity to Ship","valuesUpTo":500,"nUpTo":50000,"worstSum":25000000,"verdict":"comfortable"},{"problem":"Painter's Partition","valuesUpTo":100000,"nUpTo":100000,"worstSum":10000000000,"verdict":"far past INT_MAX"}],"boardsNeededToOverflow":21475,"demonstration":{"boards":"30,000 of 100,000","exactSum":3000000000,"asInt32":-1294967296,"lo":100000,"hi":-1294967296,"consequence":"lo > hi, the loop never runs, and the function returns hi","returned":-1294967296,"correct":1000000000},"fourVerdictsOneAlgorithm":[{"container":"Koko Eating Bananas","what":"the accumulator wrapped and read as within budget","outcome":"the answer silently collapsed to 1"},{"container":"Minimum Days for M Bouquets","what":"the guard wrapped on 99.97% of inputs","outcome":"changed no answers — masked by correct code beneath"},{"container":"Find the Smallest Divisor","what":"bounded by about 2 x threshold + n","outcome":"provably safe"},{"container":"Painter's Partition","what":"the search bound itself wrapped","outcome":"the range inverted and the answer came back negative"}],"lesson":"the bound is cheap to compute and the verdict is not portable"},"partitionInvitesTheWrongTool":{"dp":{"idea":"for each prefix and painter count, the smallest achievable maximum segment","complexity":"O(n^2 k)","correct":{"cases":3000,"disagreements":0}},"rows":[{"n":20,"k":3,"dpMicros":2.41,"binaryMicros":0.584,"ratio":4},{"n":100,"k":10,"dpMicros":197.01,"binaryMicros":5.141,"ratio":38},{"n":400,"k":10,"dpMicros":3696.72,"binaryMicros":19.885,"ratio":186},{"n":2000,"k":3,"dpMicros":24149.03,"binaryMicros":67.969,"ratio":355},{"n":2000,"k":10,"dpMicros":101374.82,"binaryMicros":146.050,"ratio":694}],"atRealLimits":"n = 1e5 would need on the order of 1e11 operations — not runnable","why":"the DP answers a harder question than was asked: it computes optimal sub-answers for every prefix and painter count, where the problem wants one number"},"tryEveryAnswer":{"rows":[{"n":20,"micros":8.18,"binaryMicros":0.310,"ratio":26,"candidateRange":803},{"n":100,"micros":311.10,"binaryMicros":1.669,"ratio":186,"candidateRange":5601},{"n":400,"micros":4764.84,"binaryMicros":7.332,"ratio":650,"candidateRange":18990}],"caveat":"these runs capped board lengths at 100 to keep it runnable; at the real limits the candidate range is about 1e10"},"assertions":["a larger time limit never needs more painters, so the predicate is monotone","max(board) is the smallest achievable limit","sum(boards) is always achievable with one painter","at most k and exactly k give the same answer","the answer is always equal to some achievable segment total"]}
```

<!-- @highlights -->
- This is Capacity to Ship Packages restated; that container's shipped solver answers it with **0 disagreements** over 605 cases.
- "Exactly k painters" equals "at most k" — verified over **211,168** exhaustive pairs.
- The sum now reaches 10¹⁰, so **21,475 boards** are enough to overflow a 32-bit bound.
- With `int` bounds the range inverts and the function returns a **negative painting time**.
- Four containers on this skeleton, four different overflow verdicts — compute the bound rather than reusing the answer.
- The partition DP is correct and **694× slower at n = 2,000**, and unusable at the stated limit of n = 10⁵.

<!-- @edgeCases -->
- k greater than the number of boards — the answer is the longest board and the surplus painters idle.
- k equal to 1 — the answer is the total, which is also the upper bound.
- k equal to n — each painter takes one board, so the answer is the longest board.
- All boards equal — the answer is that length times `ceil(n / k)`.
- A single board — the answer is its length for any k.
- 21,475 or more boards of 100,000 — where a 32-bit sum first wraps.
- 30,000 boards of 100,000 — where `int` bounds return a negative time rather than a wrong positive one.
- Board lengths that would fit better reordered — irrelevant, since the blocks must be contiguous.
- `load = 0` instead of `load = b` on a new painter — silently drops the board that triggered the split.
- `int` for either bound — the sum reaches 10¹⁰ and the search range inverts.

<!-- @pitfalls -->
- Declaring the bounds as `int`. The sum reaches 10¹⁰, `hi` goes negative, and the answer comes back negative.
- Assuming the shipping container's 32-bit safety carries over. Its values were capped at 500 and these at 10⁵.
- Reaching for a partition DP. It is correct and 694× slower at n = 2,000, and infeasible at the real limit.
- Using `+` instead of `max` in the DP recurrence. That minimises the total rather than the maximum — a different problem.
- Treating "exactly k" as stricter than "at most k". They agree on all 211,168 pairs tested.
- Starting the search below `max(board)`. No number of painters can finish a board faster than its own length.
- Writing `load = 0` when a board does not fit. It drops the board rather than passing it to the next painter.
- Sorting the boards. The blocks must be contiguous, exactly as in the shipping problem.
- Returning `lo` instead of the recorded answer. This form runs until the pointers cross.
- Computing `mid` as `(lo + hi) / 2`. Both bounds are already near 10¹⁰ here.

<!-- @doubt -->
### Is this really the same as Capacity to Ship Packages?

<!-- @answer -->
Yes. Shipping asks for the smallest capacity C such that the array splits into at most D contiguous runs each summing to at most C; painting asks for the smallest achievable maximum over k contiguous segments. Those are one optimisation described from opposite ends — the limit and the segment count are the same two quantities, and each statement fixes one and minimises the other. Checked rather than assumed: the **shipped** `ship_within_days` from that container, run unchanged on Painter's Partition inputs against a reference that exhaustively partitions by dynamic programming, agreed on **605 of 605** cases. Split Array — Largest Sum, later in this topic, is the same problem for the third time.

<!-- @doubt -->
### Does "exactly k painters" change anything?

<!-- @answer -->
No, and it is worth knowing why rather than testing it every time. Splitting an existing solution further can only reduce the largest segment, never increase it — cutting a block in two replaces one total with two smaller ones. So an optimal solution that happens to use fewer than k segments can always be cut down until it uses exactly k, without the maximum getting worse. Verified against a dynamic program that forces exactly k segments, over every array of length 1 to 7 with values 1 to 4: **145,636 pairs with k ≤ n and 0 disagreements**. When k exceeds the number of boards there are not enough blocks to go around, and the answer is simply the longest board — confirmed over a further 65,532 cases.

<!-- @doubt -->
### The shipping container said a 32-bit accumulator was fine. Is it fine here?

<!-- @answer -->
No, and the difference is entirely in the constraints. There the weights were capped at 500 with n up to 5 × 10⁴, so the total could not exceed 2.5 × 10⁷. Here board lengths reach 10⁵ with n up to 10⁵, so the total reaches **10¹⁰** — and only **21,475** boards of 100,000 are needed to pass INT_MAX. What makes this failure different in kind is *where* it lands: the quantity that overflows is `hi = sum(boards)`, the search bound itself. With 30,000 boards of 100,000 the sum wraps to **−1,294,967,296**, so `lo = 100,000` exceeds `hi`, the loop body never executes, and the function returns that negative number as a painting time. It is at least loud, which the bouquets container's overflow was not.

<!-- @doubt -->
### Four containers, four different overflow answers. How do I decide each time?

<!-- @answer -->
Compute the largest value the code can be asked to hold, and compare it to the type. That is a few seconds of arithmetic and it has given a different answer every time on this same skeleton: Koko's accumulator reached 3 × 10⁹ with three piles and wrapped into a silently wrong answer; the bouquets guard reached 10¹¹ and wrapped harmlessly, because the code beneath it was independently correct; the smallest-divisor search was provably safe because the largest sum it can evaluate is bounded by about `2 × threshold + n`; and here the *bound* reaches 10¹⁰ and inverts the search range. Remembering "this family of problems needs `long long`" would have been right three times out of four, and remembering "it was fine last time" would have been right once. The bound is the thing to carry, not the verdict.

<!-- @doubt -->
### Why is the dynamic program so much slower?

<!-- @answer -->
Because it answers a much harder question than the one asked. The DP computes, for every prefix and every painter count, the best achievable maximum — a whole table of optimal sub-solutions — at a cost of O(n²k). The problem wants a single number. Binary search never solves the optimisation at all; it only ever asks the **decision** question, "can k painters finish within this limit?", which one greedy pass settles in O(n), and then searches over the limit for about log(sum) ≈ 34 passes. Measured: at n = 2,000 with k = 10 the DP takes **101,374.82 microseconds against 146.050** — a factor of **694** — and at the stated limit of n = 10⁵ the DP would need on the order of 10¹¹ operations. Trading an optimisation for a decision and searching over the answer is the move the whole Medium tier is built on, and this is where the saving is largest.

<!-- @doubt -->
### Can I sort the boards to balance the painters better?

<!-- @answer -->
No — each painter takes a **contiguous** block, so order is part of the problem, exactly as it was for the shipping packages. Sorting would let you construct assignments that do not correspond to any valid schedule. It also breaks the greedy's optimality argument, which depends on the remaining boards forming a suffix: filling the current painter as much as possible leaves the next painter a suffix of what any other choice would leave, so it can never need more painters. That argument was checked in the shipping container against a DP over 10,253,880 (array, capacity) pairs with 0 disagreements, and it is the same greedy here.
