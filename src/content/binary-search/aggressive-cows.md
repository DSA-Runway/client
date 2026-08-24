---
id: aggressive-cows
topic: Binary Search
title: Aggressive Cows
difficulty: Hard
status: ready
prerequisites:
  - painters-partition
  - minimum-days-to-make-m-bouquets
  - lower-bound
relatedIds:
  - painters-partition
  - book-allocation-problem
  - split-array-largest-sum
  - minimum-days-to-make-m-bouquets
  - koko-eating-bananas
---

<!-- @summary -->
The mirror image of Painter's Partition: this one maximises a minimum rather than minimising a maximum, so the feasible side of the predicate flips and the search template has to flip with it. Porting the Painter's template verbatim is wrong on 99.27% of inputs, and writing the compact loop form with `mid` rounded the usual way does not return a wrong answer — it hangs, on 70.51%.

<!-- @theory -->
## The problem

`stalls` holds positions along a line, and `k` aggressive cows must be placed in
distinct stalls. Cows injure each other, so the placement should make the
**smallest** distance between any two cows as **large** as possible. Return that
distance.

```
stalls = [0, 3, 4, 7, 10, 9], k = 4   ->  3
sorted:  [0, 3, 4, 7,  9, 10]
         place at 0, 3, 7, 10 — closest pair is 3 apart
```

## Which side is feasible

Define `canPlace(d)` = "k cows fit with every pair at least `d` apart". This is
monotone, as every binary-search-on-answer problem must be, but note the
direction:

```
d:          0     1     2     3     4     5     6  ...
canPlace:  yes   yes   yes   yes    no    no    no
                                ^
                                the answer is the LAST yes
```

Small distances are easy and large ones are impossible, so the feasible region
is a **prefix** and the answer is the last `true`. Painter's Partition runs the
other way — small budgets are impossible, large ones are easy, feasible is a
**suffix**, and the answer is the first `true`.

| | Painter's Partition | Aggressive Cows |
|---|---|---|
| goal | minimise the maximum | maximise the minimum |
| feasible region | suffix (`no no no yes yes`) | prefix (`yes yes yes no no`) |
| answer is | the **first** `true` | the **last** `true` |
| on feasible | `hi = mid - 1` | `lo = mid + 1` |

That table is the whole subtopic. Everything else is the same machinery.

## Porting the template is wrong 99.27% of the time

Taking the Painter's loop and swapping in this `canPlace` gives a first-feasible
search. Measured over every stall multiset of size 2 to 6 drawn from `{0..5}`
with every `k` from 2 to n — **268,740 cases** — that is wrong on **266,790, or
99.27%**. It nearly always returns 0, because `d = 0` is trivially feasible and
0 is therefore the first `true`. The smallest failure is `stalls = [0,1], k = 2`,
where the answer is 1 and the ported template says 0.

Correctness of the intended version over the same 268,740 cases, checked against
an exhaustive search over all C(n,k) subsets: **0 wrong.**

## The compact form hangs rather than failing

The `lo <= hi` loop with a tracked `ans` is safe. The compact `lo < hi` form is
where last-feasible searches bite, because the usual `mid = lo + (hi - lo) / 2`
rounds **down**:

```
lo < hi,  canPlace(mid) true  ->  lo = mid

With lo = 3, hi = 4:  mid = 3, feasible, so lo = 3.  Nothing moved.
```

Measured, that loops forever on **189,486 of 268,740 cases — 70.51%**. Rounding
up with `mid = lo + (hi - lo + 1) / 2` fixes it: **0 wrong** over the same space.
The rule is that the side which assigns `lo = mid` is the side that must round
up, and it is worth internalising because the failure is a hang, not a wrong
answer — no test tells you which line is at fault.

## Sorting is not optional

`canPlace` walks the array once and assumes position order. Skip the sort and
it is wrong on **136,277 of 268,740 — 50.71%**, a coin flip. The smallest failure
is `stalls = [1,0], k = 2`, answer 1, reported 0.

## The linear scan and where it stops losing

Trying `d = 0, 1, 2, ...` until the first failure is O(answer · n). Measured at
n = 1,000 with coordinates spread over a million:

| k | answer | linear | binary |
|---|---|---|---|
| 999 | 0 | **8,055** | 52,958 |
| 900 | 121 | 208,375 | **51,597** |
| 500 | 995 | 885,361 | **43,083** |
| 100 | 8,982 | 3,848,597 | **16,264** |
| 20 | 51,622 | 15,433,542 | **10,167** |
| 10 | 110,062 | 28,761,458 | **9,375** |

Nanoseconds per call. Linear wins in exactly one row — where the answer is 0 and
it stops immediately — and loses by **3,068x** by the bottom. Its cost tracks the
answer, which is the one quantity the problem does not bound.

Notice the binary column: it gets **faster as k falls**, 52,958 down to 9,375.
That is `canPlace` returning early once it has seated `k` cows — with few cows it
exits after a short prefix of the array. The search does the same number of
probes either way; each probe just costs less.

## The candidate-set "optimisation" is a trap

Since the answer is always a difference of two stall positions, the search can be
restricted to that set instead of the whole range. It is correct — **0 wrong**
over the exhaustive space — and much slower, because building the set is O(n²):

| n | binary over the range | binary over the differences |
|---|---|---|
| 200 | 4,292 | 360,486 (**84x**) |
| 1,000 | 22,125 | 11,117,986 (**503x**) |
| 4,000 | 102,583 | 179,911,097 (**1,754x**) |

The gap widens with n, which is the signature of having traded a log factor for a
linear one. Searching the value range costs `log(range)` probes — about 30 for
32-bit coordinates, a constant in practice — and needs no candidates built at all.

## Where the time actually goes

The sort is real but not dominant, and the split differs sharply by language:

| n | C++ sort share | Python sort share |
|---|---|---|
| 1,000 | 19.9% | 5.1% |
| 10,000 | 22.0% | 7.0% |
| 100,000 | 26.7% | 9.1% |
| 1,000,000 | 31.8% | — |

Same algorithm, and the sort is a third of the work in C++ but under a tenth in
Python — because `sorted` is a C-level Timsort while the `canPlace` loop is
interpreted. The optimisation worth reaching for is therefore language-specific:
in C++ there is little left to win, and in Python the feasibility check is where
the time is.

<!-- @intuition -->
Painter's Partition and this problem look like different questions and are the same question read in a mirror, which is worth more than either one alone. Both binary search a value that is not in the array; both need a greedy feasibility check that is provably optimal; both are monotone. The only thing that differs is which end of the monotone region holds the answer — and that single bit decides whether `mid` moves `lo` or `hi`, and therefore whether the compact loop form must round up or down. Once you see the pair as one template with a parameter rather than two templates to memorise, "maximise the minimum" stops being a phrase to pattern-match and becomes a thing you can derive: write out `yes yes yes no no`, point at the boundary, and the code follows.

<!-- @approach -->
### Try Every Subset

<!-- @idea -->
Choose k stalls in every possible way, score each choice by its closest pair, and keep the best.

<!-- @steps -->
1. Sort the stalls, so "closest pair" is a gap between consecutive chosen stalls.
2. Enumerate every subset of exactly k stalls.
3. For each, take the minimum gap between consecutive chosen positions.
4. Return the maximum of those minima.

<!-- @complexity -->
- time: O(C(n,k) · n)
- space: O(1)
- note: The definition transcribed, and the reference the other two were verified against over **268,740 cases**. Unusable past about n = 25 — C(25,12) is already 5.2 million subsets.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

int aggressiveCows(vector<int> stalls, int k) {
    sort(stalls.begin(), stalls.end());
    int n = (int)stalls.size(), best = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        if (__builtin_popcount(mask) != k) continue;
        int prev = -1, worst = INT_MAX;
        for (int i = 0; i < n; i++) {
            if (!(mask >> i & 1)) continue;
            if (prev >= 0) worst = min(worst, stalls[i] - prev);
            prev = stalls[i];
        }
        best = max(best, worst);
    }
    return best;
}
```

<!-- @annotations -->
- 7: Sorting first is what makes "the closest pair in the subset" equal to "the smallest gap between consecutive chosen stalls" — without it the inner loop measures the wrong thing.
- 10: Exactly k, not at most k. Fewer cows would allow a larger spacing and answer a different question.
- 14: The minimum over the chosen subset — the quantity being maximised.
- 17: The maximum over subsets. Together with line 14 this is "maximise the minimum" written out literally.

<!-- @code java -->
```java
static int aggressiveCows(int[] stalls, int k) {
    Arrays.sort(stalls);
    int n = stalls.length, best = 0;
    for (int mask = 0; mask < (1 << n); mask++) {
        if (Integer.bitCount(mask) != k) continue;
        int prev = -1, worst = Integer.MAX_VALUE;
        for (int i = 0; i < n; i++) {
            if ((mask >> i & 1) == 0) continue;
            if (prev >= 0) worst = Math.min(worst, stalls[i] - prev);
            prev = stalls[i];
        }
        best = Math.max(best, worst);
    }
    return best;
}
```

<!-- @annotations -->
- 5: `Integer.bitCount` is the popcount, and on modern JVMs it compiles to a single instruction rather than a loop.

<!-- @code python -->
```python
from itertools import combinations


def aggressive_cows(stalls, k):
    stalls = sorted(stalls)
    best = 0
    for pick in combinations(stalls, k):
        worst = min(b - a for a, b in zip(pick, pick[1:]))
        best = max(best, worst)
    return best
```

<!-- @annotations -->
- 8: `zip(pick, pick[1:])` pairs each chosen stall with the next, which is where sorting pays off — consecutive in the tuple is consecutive on the line.

<!-- @approach -->
### Linear Scan Over Distances

<!-- @idea -->
Ask "do k cows fit at spacing d?" for d = 0, 1, 2, ... and stop at the first no; the answer is the last yes.

<!-- @steps -->
1. Sort the stalls.
2. Write a greedy check: seat the first cow at the first stall, then seat each next cow at the first stall at least d beyond the last one.
3. Feasible if that seats k cows or more.
4. Try d upward from 0, remembering the last d that worked.
5. Stop at the first d that fails — feasibility is monotone, so nothing beyond it can work.

<!-- @complexity -->
- time: O(n log n + answer · n)
- space: O(1)
- note: Correct — **0 wrong** over 268,740 cases — but its cost tracks the answer, which the problem does not bound. Beats binary search in exactly one measured configuration, where the answer is 0.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

static bool canPlace(const vector<int>& stalls, int k, int d) {
    int cnt = 1, last = stalls[0];
    for (size_t i = 1; i < stalls.size(); i++)
        if (stalls[i] - last >= d) { cnt++; last = stalls[i]; }
    return cnt >= k;
}

int aggressiveCows(vector<int> stalls, int k) {
    sort(stalls.begin(), stalls.end());
    int hi = stalls.back() - stalls.front(), ans = 0;
    for (int d = 0; d <= hi; d++) {
        if (!canPlace(stalls, k, d)) break;
        ans = d;
    }
    return ans;
}
```

<!-- @annotations -->
- 6: The first cow always goes in the first stall. Holding it back can never help, since moving it right only shrinks the room left for the others — and the exhaustive check confirms the greedy is optimal on all 268,740 cases.
- 8: Seat each cow at the *earliest* stall that clears the gap. Taking a later one leaves less space for everyone after it.
- 16: `break`, not `continue`. Monotonicity is what licenses stopping — if d fails, every larger d fails too.
- 17: The answer is the last d that worked, which is why `ans` is written after the check rather than inside it.

<!-- @code java -->
```java
static boolean canPlace(int[] stalls, int k, int d) {
    int cnt = 1, last = stalls[0];
    for (int i = 1; i < stalls.length; i++)
        if (stalls[i] - last >= d) { cnt++; last = stalls[i]; }
    return cnt >= k;
}

static int aggressiveCows(int[] stalls, int k) {
    Arrays.sort(stalls);
    int hi = stalls[stalls.length - 1] - stalls[0], ans = 0;
    for (int d = 0; d <= hi; d++) {
        if (!canPlace(stalls, k, d)) break;
        ans = d;
    }
    return ans;
}
```

<!-- @annotations -->
- 9: `Arrays.sort` mutates the caller's array. Copy first if the caller still needs the original order.

<!-- @code python -->
```python
def can_place(stalls, k, d):
    cnt, last = 1, stalls[0]
    for x in stalls[1:]:
        if x - last >= d:
            cnt += 1
            last = x
    return cnt >= k


def aggressive_cows(stalls, k):
    stalls = sorted(stalls)
    ans = 0
    for d in range(stalls[-1] - stalls[0] + 1):
        if not can_place(stalls, k, d):
            break
        ans = d
    return ans
```

<!-- @annotations -->
- 11: `sorted` returns a new list rather than sorting in place, so the caller's list is left alone.

<!-- @approach -->
### Binary Search on the Answer

<!-- @idea -->
Feasibility is a run of yes followed by a run of no, so binary search the boundary and keep the last yes.

<!-- @steps -->
1. Sort the stalls.
2. Search d over `[0, last - first]` — no spacing outside that range is worth testing.
3. At each mid, run the greedy check.
4. If feasible, record mid and search **right** for something better.
5. If not, search left.
6. Return the last recorded feasible d.

<!-- @complexity -->
- time: O(n log n + n log(range))
- space: O(1)
- note: **0 wrong** over 268,740 exhaustive cases. Up to **3,068x** faster than the linear scan on the measured configurations, and it gets faster as k falls because the greedy check exits early once k cows are seated.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

static bool canPlace(const vector<int>& stalls, int k, int d) {
    int cnt = 1, last = stalls[0];
    for (size_t i = 1; i < stalls.size(); i++)
        if (stalls[i] - last >= d) {
            cnt++; last = stalls[i];
            if (cnt >= k) return true;
        }
    return cnt >= k;
}

int aggressiveCows(vector<int> stalls, int k) {
    sort(stalls.begin(), stalls.end());
    int lo = 0, hi = stalls.back() - stalls.front(), ans = 0;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (canPlace(stalls, k, mid)) { ans = mid; lo = mid + 1; }
        else                          hi = mid - 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 10: The early exit, and the reason the search speeds up as k falls — 52,958ns at k=999 against 9,375ns at k=10, on the same array. The probe count is unchanged; each probe just stops sooner.
- 16: Sorting is load-bearing, not tidiness. Without it the answer is wrong on 50.71% of the exhaustive space.
- 17: `hi` is the widest spacing any two cows could have, so nothing above it needs testing.
- 19: `(hi - lo) / 2` rounds down, which is correct **here** because the `lo <= hi` form always moves both ends. The compact `lo < hi` form must round up instead, or it hangs on 70.51% of inputs.
- 20: Feasible means record it and go **right**. This is the line that differs from Painter's Partition — porting that template, which goes left here, is wrong on 99.27% of inputs.
- 23: The last feasible d, not the first. `ans` only ever holds a value the check approved.

<!-- @code java -->
```java
static boolean canPlace(int[] stalls, int k, int d) {
    int cnt = 1, last = stalls[0];
    for (int i = 1; i < stalls.length; i++)
        if (stalls[i] - last >= d) {
            cnt++; last = stalls[i];
            if (cnt >= k) return true;
        }
    return cnt >= k;
}

static int aggressiveCows(int[] stalls, int k) {
    Arrays.sort(stalls);
    int lo = 0, hi = stalls[stalls.length - 1] - stalls[0], ans = 0;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (canPlace(stalls, k, mid)) { ans = mid; lo = mid + 1; }
        else                          hi = mid - 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 15: `lo + (hi - lo) / 2` rather than `(lo + hi) / 2` — both are distances rather than indices here, and with coordinates near `Integer.MAX_VALUE` the naive form overflows.

<!-- @code python -->
```python
def can_place(stalls, k, d):
    cnt, last = 1, stalls[0]
    for x in stalls[1:]:
        if x - last >= d:
            cnt += 1
            last = x
            if cnt >= k:
                return True
    return cnt >= k


def aggressive_cows(stalls, k):
    stalls = sorted(stalls)
    lo, hi, ans = 0, stalls[-1] - stalls[0], 0
    while lo <= hi:
        mid = (lo + hi) // 2
        if can_place(stalls, k, mid):
            ans = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return ans
```

<!-- @annotations -->
- 3: `stalls[1:]` copies the tail on every call, which is a real cost inside a binary search. `for i in range(1, len(stalls))` avoids it, and here the feasibility check is 91% of the runtime.
- 19: Record and move right — the same line that separates this from Painter's Partition.

<!-- @example -->

<!-- @input -->
```
stalls = [0, 3, 4, 7, 10, 9], k = 4
```

<!-- @output -->
```
3
```

<!-- @why -->
Sorted the stalls are `[0, 3, 4, 7, 9, 10]`. Placing cows at 0, 3, 7 and 10 leaves a closest pair of 3, and no arrangement of 4 cows does better.

<!-- @walkthrough -->
```
sorted = [0, 3, 4, 7, 9, 10]     lo = 0, hi = 10

mid = 5   seat 0, 7   -> 2 cows   < 4   infeasible   hi = 4
mid = 2   seat 0, 3, 7, 9         = 4   feasible     ans = 2, lo = 3
mid = 3   seat 0, 3, 7, 10        = 4   feasible     ans = 3, lo = 4
mid = 4   seat 0, 4, 9            = 3   infeasible   hi = 3
lo > hi   ->  3

Each feasible probe moves lo RIGHT, looking for something
better. Painter's Partition moves hi left on feasible —
that one line is the whole difference.
```

<!-- @example -->

<!-- @input -->
```
stalls = [4, 2, 1, 3, 6], k = 2
```

<!-- @output -->
```
5
```

<!-- @why -->
With only two cows the best is always the two extremes, here 1 and 6. It is also the smallest case that shows why sorting matters: unsorted, the greedy check walks `4, 2, 1, 3, 6` and sees negative gaps.

<!-- @walkthrough -->
```
sorted = [1, 2, 3, 4, 6]     answer 5, from the two ends

k = 2 is always `last - first`, so this case is a useful
sanity check on any implementation. Two related identities:

  k = 2  ->  answer is stalls[-1] - stalls[0]
  k = n  ->  answer is the smallest adjacent gap
             (every stall is used, so no choice remains)
```

<!-- @example -->

<!-- @input -->
```
stalls = [0, 1], k = 2
```

<!-- @output -->
```
1
```

<!-- @why -->
The smallest input on which porting the Painter's Partition template fails. That template returns the first feasible d, and d = 0 is always feasible, so it answers 0.

<!-- @walkthrough -->
```
canPlace(0) = yes      d = 0 always fits — the cows may share a gap of 0
canPlace(1) = yes      seat at 0 and 1
canPlace(2) = no       only one cow fits

feasible:   yes  yes  no
d:           0    1    2
                  ^ answer is the LAST yes

Last-feasible search   ->  1    correct
First-feasible search  ->  0    wrong, and wrong on 99.27%
                                of the exhaustive space
```

<!-- @example -->

<!-- @input -->
```
stalls = [1, 1, 1], k = 2
```

<!-- @output -->
```
0
```

<!-- @why -->
Duplicate positions are legal — they are distinct stalls that happen to coincide. Two cows fit, and the distance between them is 0, so 0 is the true answer rather than a failure signal.

<!-- @walkthrough -->
```
sorted = [1, 1, 1]     hi = 1 - 1 = 0

lo = 0, hi = 0   mid = 0   canPlace(0) = yes   ans = 0, lo = 1
lo > hi   ->  0

This is why the search starts at d = 0 rather than d = 1.
Starting at 1 would leave `ans` at its initial value and
return the right answer here by luck — but it also makes
the loop range empty whenever all stalls coincide, which
is a different bug waiting for a different input.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the feasible region as a prefix rather than a suffix, why that flips the search template against Painter's Partition, and the measured cost of getting the flip wrong.

<!-- @sampleInput -->
```json
{"primary":{"stalls":[0,3,4,7,10,9],"sorted":[0,3,4,7,9,10],"k":4,"answer":3,"placement":[0,3,7,10],"closestPair":3},"monotonicity":{"predicate":"canPlace(d) = k cows fit with every pair at least d apart","table":[{"d":0,"canPlace":true},{"d":1,"canPlace":true},{"d":2,"canPlace":true},{"d":3,"canPlace":true},{"d":4,"canPlace":false},{"d":5,"canPlace":false},{"d":6,"canPlace":false}],"feasibleRegion":"prefix","answerIs":"the last true","contrast":"Painter's Partition is a suffix, and its answer is the first true"},"mirrorOfPainters":{"rows":[{"aspect":"goal","painters":"minimise the maximum","cows":"maximise the minimum"},{"aspect":"feasible region","painters":"suffix (no no no yes yes)","cows":"prefix (yes yes yes no no)"},{"aspect":"answer is","painters":"the first true","cows":"the last true"},{"aspect":"on feasible","painters":"hi = mid - 1","cows":"lo = mid + 1"}],"reading":"one template with a parameter, not two templates to memorise"},"exhaustive":{"space":"every stall multiset of size 2..6 over {0..5}, every k from 2 to n","cases":268740,"reference":"exhaustive search over all C(n,k) subsets","variants":[{"variant":"try every subset (the reference)","wrong":0},{"variant":"linear scan upward, last feasible","wrong":0},{"variant":"binary search, last feasible (lo <= hi, ans tracked)","wrong":0},{"variant":"binary search over realised differences","wrong":0,"note":"correct but quadratic to build"},{"variant":"lo < hi with mid rounded UP","wrong":0},{"variant":"WITHOUT sorting","wrong":136277,"pct":50.71,"smallestFailure":{"stalls":[1,0],"k":2,"correct":1,"got":0}},{"variant":"Painter's first-feasible template ported verbatim","wrong":266790,"pct":99.27,"smallestFailure":{"stalls":[0,1],"k":2,"correct":1,"got":0},"why":"d = 0 is always feasible, so the first true is 0"},{"variant":"lo < hi with mid rounded DOWN","hangs":189486,"pct":70.51,"note":"an infinite loop, not a wrong answer — lo = mid with mid rounded down never moves"}]},"roundingTrap":{"safeForm":"while (lo <= hi) with a tracked ans","compactForm":"while (lo < hi) with lo = mid on feasible","bug":"mid = lo + (hi - lo) / 2 rounds down, so lo = mid is a no-op when hi = lo + 1","worked":{"lo":3,"hi":4,"mid":3,"feasible":true,"newLo":3,"result":"nothing moved"},"fix":"mid = lo + (hi - lo + 1) / 2","rule":"the side that assigns lo = mid is the side that must round up","whyItMatters":"the symptom is a hang, so no test output points at the faulty line"},"linearVsBinary":{"setup":"n = 1,000 stalls, coordinates spread over 1,000,000, nanoseconds per call","rows":[{"k":999,"answer":0,"linear":8055,"binary":52958,"winner":"linear"},{"k":900,"answer":121,"linear":208375,"binary":51597,"winner":"binary"},{"k":700,"answer":393,"linear":654278,"binary":61250,"winner":"binary"},{"k":500,"answer":995,"linear":885361,"binary":43083,"winner":"binary"},{"k":300,"answer":2300,"linear":1212097,"binary":29792,"winner":"binary"},{"k":200,"answer":4088,"linear":1594180,"binary":22917,"winner":"binary"},{"k":100,"answer":8982,"linear":3848597,"binary":16264,"winner":"binary"},{"k":50,"answer":19289,"linear":7243764,"binary":12583,"winner":"binary"},{"k":20,"answer":51622,"linear":15433542,"binary":10167,"winner":"binary"},{"k":10,"answer":110062,"linear":28761458,"binary":9375,"winner":"binary"}],"reading":"linear wins only where the answer is 0 and it stops immediately; by k=10 it loses by 3,068x","binaryGetsFasterAsKFalls":{"from":52958,"to":9375,"why":"the greedy check returns early once k cows are seated — same probe count, cheaper probes"}},"candidateSetTrap":{"idea":"the answer is always a difference of two stall positions, so search only that set","correct":true,"wrongOverExhaustive":0,"cost":"O(n^2) to build the candidate set","rows":[{"n":200,"overRange":4292,"overDifferences":360486,"ratio":"84x"},{"n":1000,"overRange":22125,"overDifferences":11117986,"ratio":"503x"},{"n":4000,"overRange":102583,"overDifferences":179911097,"ratio":"1754x"}],"reading":"the gap widens with n — the signature of trading a log factor for a linear one","why":"log(range) is about 30 for 32-bit coordinates, a constant in practice, and needs nothing built"},"whereTheTimeGoes":{"unit":"share of total runtime spent sorting","rows":[{"n":1000,"cpp":"19.9%","python":"5.1%"},{"n":10000,"cpp":"22.0%","python":"7.0%"},{"n":100000,"cpp":"26.7%","python":"9.1%"},{"n":1000000,"cpp":"31.8%","python":null}],"reading":"same algorithm, a third of the work in C++ and under a tenth in Python","why":"sorted() is a C-level Timsort while the canPlace loop is interpreted","consequence":"in C++ little is left to win; in Python the feasibility check is where the time is"},"identities":[{"case":"k = 2","answer":"stalls[-1] - stalls[0]"},{"case":"k = n","answer":"the smallest adjacent gap — every stall is used, so no choice remains"},{"case":"all stalls equal","answer":0}],"assertions":["canPlace is monotone: feasible for every d below the answer and infeasible above","the greedy check is optimal — seating each cow at the earliest stall that clears the gap","the answer is the LAST feasible d, not the first","d = 0 is feasible whenever k <= n","the input must be sorted before the greedy check runs"]}
```

<!-- @highlights -->
- The feasible region is a **prefix** here and a **suffix** in Painter's Partition, so the answer is the **last** true rather than the first.
- Porting the Painter's template verbatim is wrong on **99.27%** of 268,740 exhaustive cases — it returns 0, because d = 0 is always feasible.
- The compact `lo < hi` form with `mid` rounded down **hangs on 70.51%**; rounding up fixes it. The symptom is a hang, not a wrong answer.
- Skipping the sort is a **50.71%** coin flip.
- The linear scan wins only when the answer is 0, and loses by **3,068×** by k = 10.
- Restricting the search to realised differences is correct and **84× to 1,754× slower** — it trades a log factor for a linear one.

<!-- @edgeCases -->
- `k = 2` — the answer is always `last - first`, a cheap sanity check on any implementation.
- `k = n` — every stall is used, so the answer is the smallest adjacent gap and no choice remains.
- All stalls at the same position — the answer is 0, a real answer rather than a failure signal.
- Duplicate positions among distinct ones — legal, and they contribute gaps of 0.
- `k > n` — no valid placement exists; the problem normally excludes it, and the greedy check reports infeasible for every d including 0.
- Already-sorted input — the common case in tests, which is exactly why a missing sort survives casual testing.
- Reverse-sorted input — where a missing sort fails immediately.
- Coordinates near `INT_MAX` — `hi` is a difference so it fits, but `(lo + hi) / 2` would overflow.
- n = 2 — one probe, and the loop must still handle `hi = 0`.
- A single stall with k = 1 — degenerate; there is no pair, so no distance to report.

<!-- @pitfalls -->
- Porting the Painter's Partition template. Wrong on 99.27% — the feasible region runs the other way.
- Writing the compact `lo < hi` form with `mid` rounded down. It hangs on 70.51% of inputs rather than answering wrongly.
- Forgetting to sort. A 50.71% coin flip, and it passes every already-sorted test.
- Starting the search at `d = 1`. It hides the all-equal case, where 0 is the correct answer.
- Seating the first cow anywhere but the first stall. Moving it right only shrinks the room for the rest.
- Counting `cnt >= k` as `cnt == k`. More cows fitting than required still means the spacing is feasible.
- Building the candidate set of realised differences. Correct, and 84× to 1,754× slower.
- Using the linear scan because the answer "looks small". Its cost tracks the answer, which the problem does not bound.
- `(lo + hi) / 2` with coordinates near `INT_MAX`.
- Returning `lo` or `mid` after the loop instead of the tracked `ans`. It happens to work for the `lo <= hi` form and stops working the moment the loop shape changes.

<!-- @doubt -->
### Why does this need a different template from Painter's Partition?

<!-- @answer -->
Because the feasible side flips. In Painter's you minimise a maximum: small budgets are impossible and large ones are easy, so feasibility reads `no no no yes yes` and the answer is the **first** yes — on feasible you move `hi` left, hunting for something smaller. Here you maximise a minimum: small spacings are easy and large ones are impossible, so feasibility reads `yes yes yes no no` and the answer is the **last** yes — on feasible you move `lo` right, hunting for something larger. Everything else is identical, which is why porting the template is so tempting and so wrong: measured over 268,740 exhaustive cases it fails on **266,790, or 99.27%**, almost always returning 0, since `d = 0` is trivially feasible and therefore the first yes. The reliable way to get this right is not to memorise two templates but to write out the yes/no row for the predicate you just defined and point at the boundary.

<!-- @doubt -->
### Why does the compact loop form hang instead of answering wrongly?

<!-- @answer -->
Because `mid` rounds toward `lo`, and this problem's feasible branch assigns `lo = mid`. With `lo = 3` and `hi = 4`, `mid = lo + (hi - lo) / 2 = 3`; if `canPlace(3)` is true the loop sets `lo = 3`, which is where it already was, and nothing has changed for the next iteration either. Measured, that spins forever on **189,486 of 268,740 cases — 70.51%**. Writing `mid = lo + (hi - lo + 1) / 2` rounds toward `hi` and fixes it, giving **0 wrong** over the same space. The general rule: whichever branch assigns `lo = mid` is the branch that forces the round-up. This trap does not exist in the `lo <= hi` form with a tracked `ans`, because there both branches use `mid ± 1` and the interval always shrinks — which is a good reason to prefer that form until the compact one is second nature. It is also worth knowing precisely because the failure mode is a hang: there is no wrong output to inspect and no line the debugger points at.

<!-- @doubt -->
### Why is the greedy feasibility check correct?

<!-- @answer -->
Because seating a cow later never helps. Suppose some valid arrangement at spacing `d` seats its first cow beyond the first stall; sliding that cow left to the first stall keeps every gap at least as large, since only the distance to the *next* cow matters and moving left increases it. Repeat the argument for each cow in turn and you get the greedy arrangement, which therefore seats at least as many cows as any other. So if the greedy fails to seat `k`, nothing can. That is an exchange argument rather than a proof by exhaustion, but it was also checked exhaustively — the binary search built on this greedy matched a brute-force search over all C(n,k) subsets on **all 268,740 cases, 0 wrong**.

<!-- @doubt -->
### Should I restrict the search to distances that actually occur?

<!-- @answer -->
No, even though the reasoning behind it is sound. The answer really is always the difference of two stall positions, and searching only that set is correct — **0 wrong** over the exhaustive space. But building it costs O(n²), and measured that is **84x slower at n = 200, 503x at n = 1,000, and 1,754x at n = 4,000**. The widening gap is the tell: a genuine constant-factor win would hold its ratio, while this one degrades because a log factor was traded for a linear one. Searching the raw value range costs `log(hi - lo)` probes — about 30 for 32-bit coordinates, and effectively a constant — and builds nothing at all. The general lesson is that shrinking a search space is only worth it if enumerating the smaller space is cheaper than searching the bigger one, and for value-range searches it almost never is.

<!-- @doubt -->
### Why does the binary search get faster when there are fewer cows?

<!-- @answer -->
Because the feasibility check exits as soon as it has seated `k` cows. Measured on the same 1,000-stall array, the search costs **52,958ns at k = 999 and 9,375ns at k = 10** — the same number of probes in both cases, roughly 20, but each probe walks a much shorter prefix of the array before it can answer yes. It is a useful reminder that the complexity `O(n log(range))` describes the worst case of each probe, not its typical cost, and that an early return inside a predicate can be worth more than anything you do to the search around it. The effect only applies to feasible probes; an infeasible one must walk the whole array to be sure.

<!-- @doubt -->
### Is sorting worth optimising away?

<!-- @answer -->
Not in C++, and there is nothing to optimise in Python either — but for opposite reasons, which is the interesting part. Measured as a share of total runtime, sorting is **19.9% at n = 1,000 rising to 31.8% at n = 1,000,000** in C++, so even eliminating it entirely would buy at most a third. In Python the same measurement gives **5.1% to 9.1%**, because `sorted` is a C-level Timsort while `can_place` is an interpreted loop — the sort is nearly free and the feasibility check is where essentially all the time goes. So the profitable direction differs by language: in C++ the work is already spread thin, while in Python the win is in the predicate, which is why the Python sample avoids re-slicing `stalls[1:]` on every one of the twenty-odd calls.
