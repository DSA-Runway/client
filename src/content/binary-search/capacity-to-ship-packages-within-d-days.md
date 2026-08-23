---
id: capacity-to-ship-packages-within-d-days
topic: Binary Search
title: Capacity to Ship Packages Within D Days
difficulty: Medium
status: ready
prerequisites:
  - koko-eating-bananas
  - find-the-smallest-divisor
  - minimum-days-to-make-m-bouquets
relatedIds:
  - koko-eating-bananas
  - find-the-smallest-divisor
  - minimum-days-to-make-m-bouquets
  - split-array-largest-sum
  - aggressive-cows
---

<!-- @summary -->
The first predicate that makes a decision rather than evaluating a formula — it greedily packs days and counts them, and that greedy is provably optimal here. The new failure mode is that the predicate has a domain: a capacity below the heaviest package cannot ship anything, and a search that starts at 1 without noticing is wrong on 24.00% of inputs, returning a ship too small to hold a single parcel.

<!-- @theory -->
## The problem

Packages ship **in order**. Each day the ship carries a prefix of what is left,
up to its capacity. Find the smallest capacity that clears everything within D
days.

```
weights = [1,2,3,4,5,6,7,8,9,10], D = 5   ->  15
weights = [3,2,2,4,1,4],          D = 3   ->  6
weights = [1,2,3,1,1],            D = 4   ->  3
```

A bigger ship never needs more days, so the predicate is monotone and the answer
is a lower bound over it.

## The predicate now decides, not just counts

Koko's predicate summed a per-element formula. This one has to *pack*: walk the
weights, keep a running load, and start a new day when the next package would not
fit.

```
days = 1, load = 0
for w in weights:
    if load + w > C:  days += 1; load = w
    else:             load += w
```

That is a greedy choice — always fill the current day as far as possible — and it
needs justifying rather than assuming. It is optimal, and the reason is that
packages ship in order: filling today maximally leaves tomorrow a **suffix** of
what any other choice would leave, so it can never need more days.

Checked rather than argued: against a dynamic program computing the true minimum
number of contiguous segments, over every array of length 1 to 8 with weights 1
to 5 and every capacity from the maximum weight to twenty above it — **10,253,880
(array, capacity) pairs, 0 disagreements.**

## Order is data here

The previous container could group equal values, because the smallest-divisor
predicate summed independent per-element terms. This one cannot. Sorting the
weights changes the answer on **188,969 of 878,850** measured cases — **21.5%** —
because adjacency determines which packages share a day.

Anything that reorders the array is not an optimisation here; it is a different
problem.

## The predicate has a domain, and the search must respect it

Here is what genuinely separates this problem from Koko and Find the Smallest
Divisor. There, *every* candidate was meaningful: any eating speed finishes
eventually, any divisor produces some quotient sum. Here a capacity below the
heaviest package cannot ship that package **at all** — not slowly, not ever.

Write the search from `lo = 1` with the packing loop above and it silently lies.
The loop happily sets `load = w` for a package heavier than C and carries on
counting days, so it reports a day count for an arrangement that cannot exist.

Measured over 112,305 exhaustive cases:

| | wrong |
|---|---|
| `lo = 1`, packing loop as written | **26,952 — 24.00%** |
| `lo = 1`, predicate rejects an oversized package | 0 |
| `lo = max(weight)`, packing loop as written | 0 |

The smallest failure is as small as it gets:

```
weights = [1, 2],  D = 2   ->  returns 1, correct answer 2
```

A ship of capacity 1, carrying a package of weight 2.

Two fixes, and you need exactly one of them:

- **Put the constraint in the bound.** Start at `max(weight)`, so no impossible
  capacity is ever tested.
- **Put the constraint in the predicate.** Keep `lo = 1` and return "infeasible"
  the moment a package exceeds C.

Both measured 0 wrong. The bug is having neither.

## The check is slightly faster than the bound

The instinct is that the bound must be cheaper — it removes a per-element test
from every probe. Measured, the opposite:

| n | probes, `lo = 1` | probes, `lo = max` | ns, check in predicate | ns, constraint in bound | |
|---|---|---|---|---|---|
| 100 | 14.8 | 14.4 | **2,282** | 2,654 | 0.86x |
| 5,000 | 20.3 | 20.2 | **160,910** | 176,972 | 0.91x |
| 25,000 | 22.7 | 22.2 | **927,258** | 1,026,383 | 0.90x |

The probe counts are nearly identical, because `hi = sum(weights)` dominates the
range either way. The difference is what an *infeasible* probe costs: with the
check, `if (w[i] > C) break;` abandons the pass immediately, so probes below the
heaviest package cost O(1) instead of O(n). The check pays for itself by doubling
as an early exit.

It is a 10–14% effect, so the choice is really about clarity. The bound states the
constraint once, where a reader can see it; the check states it n times per probe
and happens to be marginally faster.

## The bounds and the early exit, briefly

`hi = sum(weights)` is correct — one day carries everything — and no tighter upper
bound is obvious. The lower bound can be tightened to `max(max(weight),
ceil(sum / D))`, since D days of capacity C must cover the total. It is correct
(0 wrong over 40,000 cases) and it bites in exactly one place:

| D | probes with `lo = max(w)` | with the tighter `lo` |
|---|---|---|
| 1 | 23 | **1** |
| 10 | 23 | 22 |
| 1,000 | 23 | 23 |
| 25,000 | 22 | 22 |

At D = 1 the answer *is* the sum, so the tighter bound lands on it without
searching. Everywhere else it does nothing, and the extra pass to compute the sum
costs slightly more than it saves.

The predicate's early exit — stop counting once the day count passes D — behaves
exactly as it did in the last three containers: **1.26x faster at n = 100 and 1.29x
slower at n = 25,000.**

<!-- @intuition -->
Three containers have now shared a skeleton, and each has moved the difficulty somewhere new: Koko put it in the accumulator, the bouquets problem put it in the scan's state, and this one puts it in the predicate's *domain*. That last idea is the one worth keeping, because it is easy to miss — a monotone predicate is not automatically a predicate that means something everywhere. Asking "is there a candidate for which my predicate is not merely false but meaningless?" would have caught this bug before writing a line, and it is the same question that catches division by zero, empty-range averages, and capacities smaller than the thing being carried. When the answer is yes, you get to choose whether the bound or the predicate enforces it, and the interesting measured result here is that the choice barely matters for speed and matters quite a lot for whether a reader can see the constraint.

<!-- @approach -->
### Try Every Capacity

<!-- @idea -->
Test capacities upward from the heaviest package and return the first that finishes in time.

<!-- @steps -->
1. Start at the heaviest package, since nothing smaller can ship it.
2. For each capacity, walk the weights packing greedily and count the days.
3. Return the first capacity whose day count fits within D.
4. The sum of all weights always works, since it ships everything in one day.
5. Nothing between the heaviest package and the sum is skipped.

<!-- @complexity -->
- time: O(sum(weights) · n)
- space: O(1)
- note: Correct and unusable — the capacity can reach 5 × 10⁸ at the problem's limits. Measured 57,193ns at n = 100 against 2,880ns for the binary search. Its packing loop is exactly the predicate the binary search reuses.

<!-- @code cpp -->
```cpp
#include <vector>
#include <numeric>
#include <algorithm>
using namespace std;

static int daysNeeded(const vector<int>& w, long long cap) {
    int days = 1;
    long long load = 0;
    for (int x : w) {
        if (load + x > cap) { days++; load = x; }
        else                  load += x;
    }
    return days;
}

int shipWithinDays(const vector<int>& weights, int D) {
    long long lo = *max_element(weights.begin(), weights.end());
    long long hi = accumulate(weights.begin(), weights.end(), 0LL);
    for (long long cap = lo; cap <= hi; cap++)
        if (daysNeeded(weights, cap) <= D) return (int)cap;
    return (int)hi;
}
```

<!-- @annotations -->
- 10: `load = x`, not `load = 0`. The package that did not fit starts the new day rather than being dropped — forgetting this loses a package silently.
- 17: Starting at the heaviest package. This is not an optimisation: with `lo = 1` the loop above reports a day count for arrangements that cannot exist, and the answer is wrong on 24.00% of inputs.
- 18: `accumulate(..., 0LL)` with a 64-bit seed. With 50,000 weights of 500 the sum is 2.5 x 10^7 here, but the seed's type is what decides the accumulator's width.

<!-- @code java -->
```java
static int daysNeeded(int[] w, long cap) {
    int days = 1;
    long load = 0;
    for (int x : w) {
        if (load + x > cap) { days++; load = x; }
        else                  load += x;
    }
    return days;
}

static int shipWithinDays(int[] weights, int D) {
    long lo = 0, hi = 0;
    for (int x : weights) { lo = Math.max(lo, x); hi += x; }
    for (long cap = lo; cap <= hi; cap++)
        if (daysNeeded(weights, cap) <= D) return (int) cap;
    return (int) hi;
}
```

<!-- @annotations -->
- 13: One pass computes both bounds, which is worth doing since the maximum is required for correctness and the sum for termination.

<!-- @code python -->
```python
def days_needed(weights, cap):
    days, load = 1, 0
    for x in weights:
        if load + x > cap:
            days += 1
            load = x
        else:
            load += x
    return days


def ship_within_days(weights, d):
    for cap in range(max(weights), sum(weights) + 1):
        if days_needed(weights, cap) <= d:
            return cap
    return sum(weights)
```

<!-- @annotations -->
- 13: `range(max(weights), ...)` rather than `range(1, ...)`. Starting at 1 would return a capacity smaller than a package it is supposed to carry.

<!-- @approach -->
### Bound the Search at the Heaviest Package

<!-- @idea -->
Put the constraint in the range: never test a capacity that could not carry a single package.

<!-- @steps -->
1. The smallest possible answer is the heaviest package, and the largest is the sum.
2. Take the midpoint capacity.
3. Pack greedily and count the days it needs.
4. If that fits within D, record it and search smaller; otherwise search larger.
5. The last recorded capacity is the answer.

<!-- @complexity -->
- time: O(n log(sum − max)) — about 22 probes at n = 25,000
- space: O(1)
- note: 0 wrong over 112,305 exhaustive cases, and the version that states the constraint where a reader can see it. Measured 1,026,383ns at n = 25,000, about 10% behind the variant that checks inside the predicate — a gap that comes from infeasible probes costing a full pass here and O(1) there.

<!-- @code cpp -->
```cpp
#include <vector>
#include <numeric>
#include <algorithm>
using namespace std;

int shipWithinDays(const vector<int>& weights, int D) {
    long long lo = *max_element(weights.begin(), weights.end());
    long long hi = accumulate(weights.begin(), weights.end(), 0LL);
    long long ans = hi;
    while (lo <= hi) {
        long long cap = lo + (hi - lo) / 2;
        int days = 1;
        long long load = 0;
        for (int x : weights) {
            if (load + x > cap) { days++; load = x; }
            else                  load += x;
        }
        if (days <= D) { ans = cap; hi = cap - 1; }
        else            lo = cap + 1;
    }
    return (int)ans;
}
```

<!-- @annotations -->
- 7: The heaviest package, and this line is load-bearing. Writing `lo = 1` makes the packing loop below report day counts for arrangements that cannot exist — wrong on 24.00% of exhaustive cases, smallest failure `[1,2]` with D = 2 returning 1.
- 8: The sum always works, since one day carries everything.
- 11: Subtracting before halving, so lo + hi never overflows.
- 15: `load = x`, not `0`. The package that overflowed the day becomes the first package of the next one.
- 18: Record and search smaller, because the answer is the *smallest* capacity that fits.
- 21: `ans`, not `lo`. This form runs until the pointers cross, so both move past the answer.

<!-- @code java -->
```java
static int shipWithinDays(int[] weights, int D) {
    long lo = 0, hi = 0;
    for (int x : weights) { lo = Math.max(lo, x); hi += x; }
    long ans = hi;
    while (lo <= hi) {
        long cap = lo + (hi - lo) / 2;
        int days = 1;
        long load = 0;
        for (int x : weights) {
            if (load + x > cap) { days++; load = x; }
            else                  load += x;
        }
        if (days <= D) { ans = cap; hi = cap - 1; }
        else            lo = cap + 1;
    }
    return (int) ans;
}
```

<!-- @annotations -->
- 3: The maximum is required for correctness and the sum for the upper bound, so one pass earns both.

<!-- @code python -->
```python
def ship_within_days(weights, d):
    lo, hi = max(weights), sum(weights)
    ans = hi
    while lo <= hi:
        cap = (lo + hi) // 2
        days, load = 1, 0
        for x in weights:
            if load + x > cap:
                days += 1
                load = x
            else:
                load += x
        if days <= d:
            ans = cap
            hi = cap - 1
        else:
            lo = cap + 1
    return ans
```

<!-- @annotations -->
- 2: `max(weights)` as the lower bound. This is the whole safety argument in one expression, and it is why the loop below needs no per-package check.

<!-- @approach -->
### Check Inside the Predicate

<!-- @idea -->
Keep the range starting at 1 and let the packing loop declare a capacity impossible the moment a package exceeds it.

<!-- @steps -->
1. Search capacities from 1 to the sum of the weights.
2. Walk the weights packing greedily.
3. Abandon the pass immediately if any package is heavier than the capacity.
4. Otherwise count the days and compare against D.
5. Return the smallest capacity that survives both tests.

<!-- @complexity -->
- time: O(n log(sum)) — the same probe count, since the sum dominates the range
- space: O(1)
- note: 0 wrong over the same exhaustive cases, and measured **10–14% faster** than bounding the range: 927,258ns against 1,026,383 at n = 25,000. The reason is that the check doubles as an early exit — an impossible capacity is rejected on its first heavy package rather than after a full pass.

<!-- @code cpp -->
```cpp
#include <vector>
#include <numeric>
using namespace std;

int shipWithinDays(const vector<int>& weights, int D) {
    long long lo = 1;
    long long hi = accumulate(weights.begin(), weights.end(), 0LL);
    long long ans = hi;
    while (lo <= hi) {
        long long cap = lo + (hi - lo) / 2;
        int days = 1;
        long long load = 0;
        bool possible = true;
        for (int x : weights) {
            if (x > cap) { possible = false; break; }
            if (load + x > cap) { days++; load = x; }
            else                  load += x;
        }
        if (possible && days <= D) { ans = cap; hi = cap - 1; }
        else                         lo = cap + 1;
    }
    return (int)ans;
}
```

<!-- @annotations -->
- 15: The line that makes `lo = 1` safe. Without it the loop packs a package into a ship too small for it and reports a day count for an arrangement that cannot exist. The `break` is also why this version is faster than bounding the range — an impossible capacity costs one comparison instead of a full pass.
- 19: `possible &&` must come first. Testing only the day count would accept the impossible arrangements the loop just walked through.

<!-- @code java -->
```java
static int shipWithinDays(int[] weights, int D) {
    long lo = 1, hi = 0;
    for (int x : weights) hi += x;
    long ans = hi;
    while (lo <= hi) {
        long cap = lo + (hi - lo) / 2;
        int days = 1;
        long load = 0;
        boolean possible = true;
        for (int x : weights) {
            if (x > cap) { possible = false; break; }
            if (load + x > cap) { days++; load = x; }
            else                  load += x;
        }
        if (possible && days <= D) { ans = cap; hi = cap - 1; }
        else                         lo = cap + 1;
    }
    return (int) ans;
}
```

<!-- @annotations -->
- 11: The domain check, placed before the packing decision so no impossible state is ever built.

<!-- @code python -->
```python
def ship_within_days(weights, d):
    lo, hi = 1, sum(weights)
    ans = hi
    while lo <= hi:
        cap = (lo + hi) // 2
        days, load, possible = 1, 0, True
        for x in weights:
            if x > cap:
                possible = False
                break
            if load + x > cap:
                days += 1
                load = x
            else:
                load += x
        if possible and days <= d:
            ans = cap
            hi = cap - 1
        else:
            lo = cap + 1
    return ans
```

<!-- @annotations -->
- 8: The constraint stated inside the loop rather than in the bound. Both are correct; this one runs n times per probe and the bound runs once.

<!-- @example -->

<!-- @input -->
```
weights = [1,2,3,4,5,6,7,8,9,10], D = 5
```

<!-- @output -->
```
15
```

<!-- @why -->
Capacity 15 splits the packages into exactly five days: 1+2+3+4+5, then 6+7, 8, 9, 10. Capacity 14 needs six.

<!-- @walkthrough -->
```
cap = 15 : [1,2,3,4,5] = 15 | [6,7] = 13 | [8] | [9] | [10]   ->  5 days   fits
cap = 14 : [1,2,3,4] = 10   | [5,6] = 11 | [7]  | [8]  | [9] | [10]  -> 6 days

lo = max = 10, hi = sum = 55
lo=10 hi=55  cap=32  1 day? [1..10]=55>32 -> 2 days   fits, hi=31
lo=10 hi=31  cap=20  4 days                            fits, hi=19
lo=10 hi=19  cap=14  6 days                            lo=15
lo=15 hi=19  cap=17  4 days                            fits, hi=16
lo=15 hi=16  cap=15  5 days                            fits, hi=14
lo=15 > hi=14 -> 15
```

<!-- @example -->

<!-- @input -->
```
weights = [1, 2], D = 2
```

<!-- @output -->
```
2
```

<!-- @why -->
The smallest input where starting the search at 1 goes wrong. Two days for two packages means each ships alone, so the capacity must cover the heavier one.

<!-- @walkthrough -->
```
Correct (lo = max = 2):
  lo=2 hi=3  cap=2  [1] | [2]  ->  2 days  fits, hi=1
  lo=2 > hi=1 -> 2

Starting at lo = 1 with the plain packing loop:
  lo=1 hi=3  cap=2  ->  2 days  fits, hi=1
  lo=1 hi=1  cap=1  load=0, 0+1<=1 so load=1
                    then 1+2>1 -> days=2, load=2
                    reports 2 days  <=  D    "fits"
                    ...but load = 2 on a ship of capacity 1
  -> returns 1                                   WRONG

The loop never asked whether a package fits at all. It only
asked whether it fits alongside what is already loaded.
```

<!-- @example -->

<!-- @input -->
```
weights = [3,2,2,4,1,4], D = 3
```

<!-- @output -->
```
6
```

<!-- @why -->
Order decides the packing: 3+2 fills a day but 2+4 does not fit with them. Sorting these weights would change the answer, which is why the array cannot be reordered.

<!-- @walkthrough -->
```
cap = 6, in the given order:
  [3,2] = 5, next 2 would make 7  ->  day 1
  [2,4] = 6, next 1 would make 7  ->  day 2
  [1,4] = 5                        ->  day 3
  3 days   fits

The same multiset sorted as [1,2,2,3,4,4] at cap = 6:
  [1,2,2] = 5 | [3] then 3+4=7 -> [3] | [4,4] = 8 > 6 -> [4] | [4]
  which is a different partition entirely.

Measured, sorting changes the answer on 21.5% of cases.
```

<!-- @example -->

<!-- @input -->
```
weights = [1,2,3,1,1], D = 4
```

<!-- @output -->
```
3
```

<!-- @why -->
The answer equals the heaviest package, so the lower bound is exactly the answer and the search does no work at all. It is the case where a capacity of 2 is not merely slow but impossible.

<!-- @walkthrough -->
```
lo = max = 3, hi = sum = 8
cap = 3 : [1,2] | [3] | [1,1]  ->  3 days  <=  4   fits

Below 3 nothing works, and not because it takes too long —
the package of weight 3 cannot be carried by a ship of
capacity 2 in any number of days. That is the difference
between this predicate and Koko's: there, every speed
eventually finishes.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the greedy packing the predicate performs, the proof that it is optimal, and the domain restriction that makes a capacity below the heaviest package meaningless rather than merely slow.

<!-- @sampleInput -->
```json
{"primary":{"weights":[1,2,3,4,5,6,7,8,9,10],"D":5,"answer":15,"packingAt15":[[1,2,3,4,5],[6,7],[8],[9],[10]],"daysAt15":5,"packingAt14":[[1,2,3,4],[5,6],[7],[8],[9],[10]],"daysAt14":6,"bounds":{"lo":10,"hi":55,"loIs":"max(weight)","hiIs":"sum(weights)"},"trace":[{"lo":10,"hi":55,"cap":32,"days":2,"fits":true,"action":"hi = 31"},{"lo":10,"hi":31,"cap":20,"days":4,"fits":true,"action":"hi = 19"},{"lo":10,"hi":19,"cap":14,"days":6,"fits":false,"action":"lo = 15"},{"lo":15,"hi":19,"cap":17,"days":4,"fits":true,"action":"hi = 16"},{"lo":15,"hi":16,"cap":15,"days":5,"fits":true,"action":"hi = 14"}]},"predicateDecides":{"contrast":"Koko summed a per-element formula; this one packs and counts","greedy":"fill each day as far as possible, then start a new day","whyOptimal":"packages ship in order, so filling today maximally leaves tomorrow a SUFFIX of what any other choice would leave — it can never need more days","verified":{"against":"a DP computing the minimum number of contiguous segments","pairs":10253880,"space":"every array of length 1..8 with weights 1..5, capacities from max(weight) to +20","disagreements":0}},"orderIsData":{"claim":"unlike the smallest-divisor problem, the array cannot be reordered","measured":{"pairs":878850,"unchanged":689881,"changed":188969,"changedPct":21.5},"reason":"adjacency determines which packages share a day"},"domainRestriction":{"keyDifference":"in Koko and Find the Smallest Divisor every candidate is meaningful — any speed finishes eventually. Here a capacity below the heaviest package cannot ship it at all.","whatGoesWrong":"the packing loop sets load = w even when w > cap, so it reports a day count for an arrangement that cannot exist","measured":{"cases":112305,"rows":[{"variant":"lo = 1, plain packing loop","wrong":26952,"pct":24.00},{"variant":"lo = 1, predicate rejects oversized packages","wrong":0},{"variant":"lo = max(weight), plain packing loop","wrong":0}]},"smallestFailure":{"weights":[1,2],"D":2,"returned":1,"correct":2,"note":"a ship of capacity 1 carrying a package of weight 2"},"twoFixes":["put the constraint in the bound: start at max(weight)","put the constraint in the predicate: reject a package heavier than the capacity"],"theBug":"having neither"},"checkVersusBound":{"expectation":"the bound should be cheaper, since it removes a per-element test","measured":[{"n":100,"probesLoIs1":14.8,"probesLoIsMax":14.4,"nsCheck":2282,"nsBound":2654,"ratio":0.86},{"n":5000,"probesLoIs1":20.3,"probesLoIsMax":20.2,"nsCheck":160910,"nsBound":176972,"ratio":0.91},{"n":25000,"probesLoIs1":22.7,"probesLoIsMax":22.2,"nsCheck":927258,"nsBound":1026383,"ratio":0.90}],"why":"the probe counts are nearly identical because hi = sum dominates the range; the difference is that `if (w[i] > cap) break;` makes an infeasible probe cost O(1) instead of O(n)","reading":"a 10-14% effect, so the real choice is clarity — the bound states the constraint once, the check states it n times per probe"},"boundsAndEarlyExit":{"upperBound":"sum(weights), since one day carries everything","tighterLowerBound":{"formula":"max(max(weight), ceil(sum / D))","correct":{"cases":40000,"wrong":0},"probes":[{"D":1,"loIsMax":23,"tighter":1},{"D":10,"loIsMax":23,"tighter":22},{"D":1000,"loIsMax":23,"tighter":23},{"D":25000,"loIsMax":22,"tighter":22}],"reading":"at D = 1 the answer IS the sum, so the tighter bound lands on it without searching; everywhere else it does nothing"},"predicateEarlyExit":{"n100":{"plain":2880,"early":2288,"ratio":"1.26x faster"},"n25000":{"plain":989117,"early":1276806,"ratio":"1.29x slower"},"reading":"the same shape as the previous three containers"}},"assertions":["a bigger ship never needs more days, so the predicate is monotone","the greedy packing is optimal because packages ship in order","max(weight) is the smallest meaningful capacity","sum(weights) always ships in one day","reordering the weights changes the problem"]}
```

<!-- @highlights -->
- The predicate packs greedily rather than evaluating a formula, and that greedy is optimal — 0 disagreements against a DP over 10,253,880 pairs.
- Order is data: sorting the weights changes the answer on **21.5%** of cases.
- A capacity below the heaviest package is *impossible*, not slow — the predicate has a domain.
- Starting at `lo = 1` with the plain packing loop is wrong on **24.00%** of inputs; `[1,2]` with D=2 returns a capacity of 1.
- Two fixes work — constrain the bound or check in the predicate — and the bug is having neither.
- The check measures **10–14% faster** than the bound, because it doubles as an early exit on impossible probes.

<!-- @edgeCases -->
- A capacity below the heaviest package — impossible rather than slow, which is the whole subject of this container.
- `weights = [1, 2]` with D = 2 — the smallest input that exposes an unguarded `lo = 1`.
- D = 1 — the answer is the sum, and the tighter lower bound finds it in a single probe.
- D equal to the number of packages — each ships alone, so the answer is exactly the heaviest package.
- D greater than the number of packages — the same answer; extra days cannot help.
- All weights equal — the answer is that weight times `ceil(n / D)`.
- A single package — the answer is its weight, and the loop never runs.
- Weights that would fit if reordered — irrelevant, since packages ship in order.
- `load = 0` instead of `load = x` on a new day — silently drops the package that triggered the split.
- `accumulate(..., 0)` with a 32-bit seed — the sum of 50,000 weights of 500 is 2.5 × 10⁷, and the seed's type decides the accumulator.

<!-- @pitfalls -->
- Starting the search at 1 without a domain check. Wrong on 24.00% of exhaustive cases, returning ships too small for a single package.
- Assuming a monotone predicate is meaningful everywhere. This one is undefined below the heaviest package, not merely false.
- Writing `load = 0` when a package does not fit. That drops the package instead of carrying it into the new day.
- Sorting the weights. It changes the answer on 21.5% of cases — adjacency is part of the problem.
- Grouping equal weights, as the smallest-divisor container did. The same reasoning does not transfer, for the same reason sorting does not.
- Testing only the day count after a `break`. If the loop bailed out, the day count describes an arrangement that cannot exist.
- Assuming the bound is faster than the check. Measured, the check is 10–14% ahead, because it short-circuits impossible probes.
- Adding the predicate's early exit for speed. It is 1.29× slower at n = 25,000, as in the previous three containers.
- Tightening the lower bound to `ceil(sum / D)` expecting a general win. It saves 22 probes at D = 1 and nothing elsewhere.
- Computing `mid` as `(lo + hi) / 2`. The sum can reach 5 × 10⁸ at the problem's limits.

<!-- @doubt -->
### Why is the greedy packing optimal?

<!-- @answer -->
Because packages ship in order, which turns a scheduling question into a prefix question. Suppose an optimal solution puts fewer packages on the first day than the greedy does. Then whatever it ships on day one is a prefix of what greedy ships, so at the end of day one the greedy has *more* packages already gone — meaning the remaining work is a suffix of the optimal's remaining work. That relationship holds inductively for every day, so the greedy can never fall behind and can never need more days. This is exactly why the argument fails if the packages could be reordered: the "remaining work is a suffix" step depends on order. Checked rather than trusted: against a dynamic program computing the true minimum number of contiguous segments, over **10,253,880** (array, capacity) pairs, there were **0 disagreements**.

<!-- @doubt -->
### What is different about this predicate compared with Koko's?

<!-- @answer -->
It has a **domain**. In Koko every eating speed from 1 upward is meaningful — a slow speed finishes late, but it finishes. Here a capacity below the heaviest package cannot ship that package in any number of days, so the predicate is not false there, it is undefined. The packing loop does not notice: it happily executes `load = w` for a package heavier than the capacity and keeps counting days, producing a number that describes an arrangement which cannot exist. Measured over 112,305 exhaustive cases, a search starting at `lo = 1` with that loop is wrong on **26,952 — 24.00%**. The smallest failure is `weights = [1, 2]` with `D = 2`, where it returns a capacity of 1 for a package of weight 2.

<!-- @doubt -->
### Should the constraint go in the bound or in the predicate?

<!-- @answer -->
Either works — both measured 0 wrong — and the measured speed difference runs opposite to the obvious guess. Bounding the range at `max(weight)` removes a per-element test from every probe, so it ought to be faster; measured, the version that keeps `lo = 1` and checks inside the loop is **10–14% ahead**: 927,258ns against 1,026,383 at n = 25,000. The reason is that the check doubles as an early exit — `if (w[i] > cap) break;` rejects an impossible capacity on its first heavy package, where the bounded version simply never tests those capacities but pays a full pass for every one it does test. Since the gap is small, choose on clarity: the bound states the constraint once, in a place a reader will look; the check states it n times per probe and buys a few percent.

<!-- @doubt -->
### Can I sort the weights first?

<!-- @answer -->
No, and this is a real break from the previous container. Find the Smallest Divisor summed `ceil(num / d)` over independent elements, so the array was effectively a multiset and grouping equal values was a legitimate 2.44× optimisation. Here the packing depends on which weights are *adjacent*, because a day carries a contiguous run. Measured, sorting the weights changes the answer on **188,969 of 878,850 cases — 21.5%**. Anything that reorders the array is solving a different problem, and the greedy's optimality proof stops working too, since it relies on the remaining packages forming a suffix.

<!-- @doubt -->
### Is `sum(weights)` the right upper bound?

<!-- @answer -->
Yes, and it is tight in the sense that D = 1 forces it — one day must carry everything. There is no obviously better upper bound, unlike the lower bound, which can be raised to `max(max(weight), ceil(sum / D))` because D days of capacity C must together cover the total. That refinement is correct (0 wrong over 40,000 randomised cases) and almost never useful: measured at n = 25,000 it cuts the probe count from **23 to 1 at D = 1**, from 23 to 22 at D = 10, and not at all from D = 1,000 upward. At D = 1 it lands directly on the answer because `ceil(sum / 1)` *is* the answer. Everywhere else the extra pass to compute the sum costs slightly more than the probes it saves.

<!-- @doubt -->
### Does the predicate's early exit help here?

<!-- @answer -->
No, and by now the result is predictable. Stopping the count once the day total passes D measures **1.26× faster at n = 100 and 1.29× slower at n = 25,000** — the same crossover Koko, the bouquets problem and the smallest-divisor problem all produced. The cause is the same each time: binary search converges on the boundary, so most probes land where the day count is marginal, and a marginal probe only exceeds D near the end of the array. The exit is checked n times to fire in the last few elements. Worth noting that the *other* early exit in this container — the domain check `if (w[i] > cap) break;` — does pay, because it fires on the very first heavy package rather than at the end.
