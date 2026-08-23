---
id: find-the-smallest-divisor
topic: Binary Search
title: Find the smallest divisor
difficulty: Medium
status: ready
prerequisites:
  - koko-eating-bananas
  - find-square-root-of-a-number
  - integer-overflow-and-precision-errors
relatedIds:
  - koko-eating-bananas
  - minimum-days-to-make-m-bouquets
  - capacity-to-ship-packages-within-d-days
  - integer-overflow-and-precision-errors
  - lower-bound
---

<!-- @summary -->
This is Koko Eating Bananas with the nouns changed — the predicate is character-for-character the same, and Koko's shipped solver answers this problem correctly on 4,004 randomised cases. What makes it worth its own container is that the identical code which was catastrophically broken there is provably safe here, and the reason is a constraint that never mentions overflow: the threshold cap.

<!-- @theory -->
## The problem

Given an array and a threshold, find the smallest positive divisor d such that
the sum of `ceil(nums[i] / d)` is at most the threshold.

```
nums = [1, 2, 5, 9],       threshold = 6        ->  5
nums = [44, 22, 33, 11],   threshold = 5        ->  33
nums = [21212, 10101, 12121], threshold = 1000000  ->  1
```

Bigger divisors give smaller quotients, so the predicate is monotone and the
answer is a lower bound over it.

## It is the same problem as Koko

Put the two predicates side by side:

```
Koko              :  sum( ceil(pile / k)  )  <=  h
smallest divisor  :  sum( ceil(num  / d)  )  <=  threshold
```

Not similar — identical. The only differences are which letters are used and what
the constraints say.

That is a claim worth checking rather than asserting, so it was checked: Koko's
**shipped** `min_eating_speed` was run unchanged against a reference for this
problem over 4,004 randomised inputs, and the two agreed on **all of them**.

If you have written one, you have written the other. The rest of this container is
about the one thing that genuinely differs.

## The same code is safe here and was not there

Koko's container made a lot of the accumulator: with `int total`, **three** piles
of a billion overflow, and the wrapped negative reads as "comfortably within
budget", collapsing the answer to 1. The natural expectation is that the same bug
lives here.

It does not, and the difference is larger than it looks:

| | values up to | how many values overflow an `int` sum |
|---|---|---|
| Koko | 10⁹ | **3** |
| smallest divisor | 10⁶ | **2,148** |

But the more interesting fact is that even 2,148 is not reachable. Over 40,000
randomised inputs at this problem's full limits — n up to 50,000, values up to
10⁶, threshold up to 10⁶ — the **largest quotient-sum the search ever evaluated
was 2,006,079**, which leaves 1,070x of headroom below INT_MAX.

The reason is structural rather than statistical. The search only moves to a
*smaller* divisor after a probe whose sum fit inside the threshold, and halving
the divisor at most doubles each ceiling term. So the very next sum it evaluates
is bounded by roughly

```
2 x threshold + n
```

At this problem's limits that is 2 × 10⁶ + 5 × 10⁴ = **2,050,000** — and the
measured maximum, 2,006,079, sits just under it.

Now apply the same bound to Koko: there the threshold is `h`, capped at **10⁹**,
so the bound is about 2 × 10⁹ + 10⁴ ≈ **2,000,010,000** — which is *above*
INT_MAX = 2,147,483,647 only barely, and the pile values themselves reach 10⁹, so
a three-element sum clears it outright.

**The safety difference comes from the threshold cap, not from the value cap.**
That is the part worth carrying away: "use a 64-bit accumulator" is not a rule to
memorise but a consequence you can compute, and the quantity to compute is the
largest value the predicate can be *asked to evaluate*, not the largest value the
input can hold.

Use `long long` anyway. The argument above is a property of these constraints, and
constraints change.

## What else the smaller numbers change

The divisor is at most the largest value, so the search range is 10⁶ rather than
10⁹:

| | range | probes |
|---|---|---|
| Koko | 1 … 10⁹ | 30 |
| smallest divisor | 1 … 10⁶ | **20** |

A third fewer probes, each still costing a full pass.

## The early-exit conclusion transfers, and hardens

Koko measured that abandoning the sum once it passed the budget saved 1–2% of the
work and cost time at scale — faster at n = 10, slower from n = 1,000. Measured
again at these constraints:

| n | plain | with the early exit |
|---|---|---|
| 1,000 | **53,691** | 62,569 |
| 50,000 | **2,490,354** | 3,253,764 |

Here it never wins. It is 1.17x slower at n = 1,000 and 1.31x slower at
n = 50,000. The small-n case where Koko saw a gain does not appear, because this
problem's arrays start larger.

## Grouping equal values, when they repeat

One thing this problem's constraints do enable: with values capped at 10⁶ and n up
to 50,000, arrays often contain repeats. Collapsing the array into (value, count)
pairs lets one ceiling division serve many elements.

Verified correct against the plain version over 20,000 randomised cases — **0
disagreements**. Measured at n = 50,000:

| distinct values | plain | grouped | |
|---|---|---|---|
| 10 | 743,572 | **304,349** | 2.44x |
| 100 | 745,343 | **455,853** | 1.64x |
| 1,000 | 822,033 | **789,837** | 1.04x |
| 50,000 (all distinct) | **977,839** | 2,199,482 | 0.44x |

It is a real win when values repeat heavily and a 2.3x **loss** when they do not,
because the sort it needs costs O(n log n) and buys nothing on an array of unique
values. Worth reaching for only when you know the data repeats.

<!-- @intuition -->
The useful skill this subtopic teaches is not a new algorithm — there isn't one — but recognising that two problems are the same one. The tell is the predicate: strip away the story about bananas or divisors and both reduce to "sum a per-element ceiling and compare against a budget". Once that is visible, everything already established transfers for free, and the only work left is checking which of the *constraint-dependent* conclusions still hold. That check is where the value is, because the constraints are exactly what the earlier container's overflow finding depended on. A conclusion like "you must use a 64-bit accumulator" feels like a property of the algorithm and is actually a property of the numbers, and the way to tell the difference is to compute the bound rather than remember the verdict.

<!-- @approach -->
### Try Every Divisor

<!-- @idea -->
Test divisors upward from 1 and return the first whose quotient-sum fits the threshold.

<!-- @steps -->
1. Start at divisor 1.
2. Sum the ceiling of each value divided by the candidate.
3. If the sum fits the threshold, that divisor is the answer.
4. Otherwise try the next divisor.
5. The largest value always works, since every quotient becomes 1 and the problem guarantees the threshold is at least n.

<!-- @complexity -->
- time: O(max(nums) · n)
- space: O(1)
- note: Correct and unusable at scale, where the divisor can reach 10⁶. It is worth writing once because the summing loop is exactly the predicate the binary search reuses — the only difference is how many divisors get tested.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int smallestDivisor(const vector<int>& nums, int threshold) {
    int hi = *max_element(nums.begin(), nums.end());
    for (int d = 1; d <= hi; d++) {
        long long total = 0;
        for (int x : nums) total += (x + d - 1) / d;
        if (total <= threshold) return d;
    }
    return hi;
}
```

<!-- @annotations -->
- 8: `long long`, which is the portable choice even though this problem's constraints make a 32-bit sum provably safe — the bound `2 * threshold + n` is 2,050,000 here and about 2 x 10^9 in Koko.
- 9: `(x + d - 1) / d` is integer ceiling division. `x / d + 1` overcounts whenever d divides x exactly, which is common when the values share factors.
- 12: The largest value is always a valid divisor, because every quotient becomes 1 and the threshold is guaranteed to be at least n.

<!-- @code java -->
```java
static int smallestDivisor(int[] nums, int threshold) {
    int hi = 0;
    for (int x : nums) hi = Math.max(hi, x);
    for (int d = 1; d <= hi; d++) {
        long total = 0;
        for (int x : nums) total += (x + d - 1) / d;
        if (total <= threshold) return d;
    }
    return hi;
}
```

<!-- @annotations -->
- 6: `long`, for the same portability reason. The measured maximum sum at this problem's limits is 2,006,079, so an `int` would in fact never overflow here.

<!-- @code python -->
```python
def smallest_divisor(nums, threshold):
    hi = max(nums)
    for d in range(1, hi + 1):
        if sum(-(-x // d) for x in nums) <= threshold:
            return d
    return hi
```

<!-- @annotations -->
- 4: `-(-x // d)` is exact integer ceiling division. `math.ceil(x / d)` uses floats and stops being exact past 2^53, which these inputs never reach but the habit is worth keeping.

<!-- @approach -->
### Group Equal Values First

<!-- @idea -->
Collapse the array into (value, count) pairs so one ceiling division serves every copy of a value.

<!-- @steps -->
1. Sort a copy of the array and collapse runs of equal values into pairs.
2. Binary search the divisor as usual.
3. For each candidate, walk the pairs rather than the elements.
4. Multiply each ceiling by its count instead of adding it repeatedly.
5. Return the smallest divisor whose weighted sum fits.

<!-- @complexity -->
- time: O(n log n) to group, then O(distinct · log max) to search
- space: O(distinct)
- note: 0 disagreements against the plain version over 20,000 randomised cases. Measured **2.44x faster** with ten distinct values and **2.3x slower** when every value is unique, because the sort costs O(n log n) and buys nothing on an array with no repeats.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int smallestDivisor(const vector<int>& nums, int threshold) {
    vector<int> v(nums);
    sort(v.begin(), v.end());
    vector<pair<int,int>> groups;
    for (size_t i = 0; i < v.size(); ) {
        size_t j = i;
        while (j < v.size() && v[j] == v[i]) j++;
        groups.push_back({v[i], (int)(j - i)});
        i = j;
    }

    int lo = 1, hi = v.back(), ans = hi;
    while (lo <= hi) {
        int d = lo + (hi - lo) / 2;
        long long total = 0;
        for (auto& g : groups) total += (long long)((g.first + d - 1) / d) * g.second;
        if (total <= threshold) { ans = d; hi = d - 1; }
        else                     lo = d + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 6: A copy, because sorting the caller's array would be a side effect the signature does not advertise.
- 20: The multiplication is where the saving is — one division serves every copy of a value instead of one per element. Note the `(long long)` sits on the quotient, before multiplying by the count: with 50,000 copies of a value that product can exceed what an int comfortably holds even though the final sum does not.
- 21: The comparison is unchanged from the plain version; only how the total is accumulated differs.

<!-- @code java -->
```java
static int smallestDivisor(int[] nums, int threshold) {
    int[] v = nums.clone();
    Arrays.sort(v);
    int distinct = 0;
    for (int i = 0; i < v.length; i++)
        if (i == 0 || v[i] != v[i - 1]) distinct++;
    int[] val = new int[distinct], cnt = new int[distinct];
    int u = -1;
    for (int i = 0; i < v.length; i++) {
        if (i == 0 || v[i] != v[i - 1]) { u++; val[u] = v[i]; }
        cnt[u]++;
    }
    int lo = 1, hi = v[v.length - 1], ans = hi;
    while (lo <= hi) {
        int d = lo + (hi - lo) / 2;
        long total = 0;
        for (int i = 0; i < distinct; i++) total += (long) ((val[i] + d - 1) / d) * cnt[i];
        if (total <= threshold) { ans = d; hi = d - 1; }
        else                     lo = d + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 2: `clone()`, so the caller's array keeps its order.
- 17: `(long)` on the quotient, not on the product — casting after the multiply would overflow first and widen the wrong value.

<!-- @code python -->
```python
from collections import Counter


def smallest_divisor(nums, threshold):
    groups = list(Counter(nums).items())
    lo, hi, ans = 1, max(nums), max(nums)
    while lo <= hi:
        d = (lo + hi) // 2
        total = sum(-(-v // d) * c for v, c in groups)
        if total <= threshold:
            ans = d
            hi = d - 1
        else:
            lo = d + 1
    return ans
```

<!-- @annotations -->
- 5: `Counter` groups in O(n) with no sort at all, which makes this version's break-even point better than the C++ one's.

<!-- @approach -->
### Binary Search the Divisor

<!-- @idea -->
Halve the range of candidate divisors, deciding each with one pass that sums the ceilings.

<!-- @steps -->
1. The answer lies between 1 and the largest value, since that divisor makes every quotient 1.
2. Take the midpoint divisor.
3. Sum the ceiling of each value divided by it.
4. If the sum fits the threshold, record the divisor and search lower; otherwise search higher.
5. The last recorded divisor is the smallest that works.

<!-- @complexity -->
- time: O(n log max(nums)) — about 20 probes at this problem's limits, against 30 in Koko
- space: O(1)
- note: The answer, and the same code as Koko's solution with the names changed. Measured 53,691ns at n = 1,000 and 2,490,354ns at n = 50,000. The predicate's early exit is 1.17x to 1.31x slower here and never wins.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int smallestDivisor(const vector<int>& nums, int threshold) {
    int lo = 1, hi = *max_element(nums.begin(), nums.end()), ans = hi;
    while (lo <= hi) {
        int d = lo + (hi - lo) / 2;
        long long total = 0;
        for (int x : nums) total += (x + d - 1) / d;
        if (total <= threshold) { ans = d; hi = d - 1; }
        else                     lo = d + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 6: hi is the largest value, which always works — every quotient becomes 1 and the threshold is at least n. The range is 10^6 here against Koko's 10^9, which is 20 probes instead of 30.
- 8: Subtracting before halving, so lo + hi never overflows.
- 9: `long long` on principle rather than necessity. The largest sum this search can be asked to evaluate is bounded by about `2 * threshold + n` = 2,050,000, and the measured maximum over 40,000 randomised inputs was 2,006,079.
- 10: `(x + d - 1) / d`, the integer ceiling. This one line is the whole predicate, and it is identical to Koko's.
- 11: Record and search lower, because the answer is the *smallest* divisor that fits.
- 14: `ans`, not `lo`. This form runs until the pointers cross, so both move past the answer.

<!-- @code java -->
```java
static int smallestDivisor(int[] nums, int threshold) {
    int lo = 1, hi = 0;
    for (int x : nums) hi = Math.max(hi, x);
    int ans = hi;
    while (lo <= hi) {
        int d = lo + (hi - lo) / 2;
        long total = 0;
        for (int x : nums) total += (x + d - 1) / d;
        if (total <= threshold) { ans = d; hi = d - 1; }
        else                     lo = d + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 6: lo + (hi - lo) / 2 rather than (lo + hi) / 2. It cannot overflow at these limits, and the habit is what stops it overflowing at some other problem's limits.

<!-- @code python -->
```python
def smallest_divisor(nums, threshold):
    lo, hi = 1, max(nums)
    ans = hi
    while lo <= hi:
        d = (lo + hi) // 2
        total = sum(-(-x // d) for x in nums)
        if total <= threshold:
            ans = d
            hi = d - 1
        else:
            lo = d + 1
    return ans


# Character for character the same search as Koko Eating
# Bananas, with piles/h renamed to nums/threshold.
```

<!-- @annotations -->
- 6: `-(-x // d)` rather than `math.ceil(x / d)`, so no float is involved and the result is exact for integers of any size.

<!-- @example -->

<!-- @input -->
```
nums = [1, 2, 5, 9], threshold = 6
```

<!-- @output -->
```
5
```

<!-- @why -->
At divisor 5 the quotients are 1, 1, 1 and 2, summing to 5. At divisor 4 they are 1, 1, 2 and 3, summing to 7, which is over budget.

<!-- @walkthrough -->
```
lo=1 hi=9   d=5   ceils 1+1+1+2 = 5  <= 6   ans=5, hi=4
lo=1 hi=4   d=2   ceils 1+1+3+5 = 10 >  6   lo=3
lo=3 hi=4   d=3   ceils 1+1+2+3 = 7  >  6   lo=4
lo=4 hi=4   d=4   ceils 1+1+2+3 = 7  >  6   lo=5
lo=5 > hi=4 -> 5

Four probes, each a full pass. The search is the cheap part.
```

<!-- @example -->

<!-- @input -->
```
nums = [44, 22, 33, 11], threshold = 5
```

<!-- @output -->
```
33
```

<!-- @why -->
The interesting case: divisor 33 gives quotients 2, 1, 1, 1 summing to exactly 5. Any smaller divisor makes `ceil(33 / d)` reach 2 as well, pushing the sum to 6.

<!-- @walkthrough -->
```
d = 22 : ceils 2 + 1 + 2 + 1 = 6   >  5
d = 32 : ceils 2 + 1 + 2 + 1 = 6   >  5
d = 33 : ceils 2 + 1 + 1 + 1 = 5  <=  5   fits
d = 44 : ceils 1 + 1 + 1 + 1 = 4  <=  5   also fits, but larger

The jump happens at 33 because that is where ceil(33/d)
falls from 2 to 1. The answer is always at one of these
divisor boundaries, which is why it has to be searched
rather than computed.
```

<!-- @example -->

<!-- @input -->
```
nums = [21212, 10101, 12121], threshold = 1000000
```

<!-- @output -->
```
1
```

<!-- @why -->
The threshold is enormous relative to the values, so even divisor 1 fits — its quotient-sum is 43,434. This is the shape that would probe the smallest divisors, and therefore the shape that would expose an accumulator overflow if one were reachable.

<!-- @walkthrough -->
```
sum at d = 1 = 21212 + 10101 + 12121 = 43,434  <= 1,000,000

The search descends all the way to 1 and the sum at each
step stays tiny, because the threshold caps how large a
sum the search will ever accept before descending further.

Bound: the next sum after an accepted probe is at most
about 2 * threshold + n = 2,050,000. Measured over 40,000
random inputs at the full limits, the largest sum ever
evaluated was 2,006,079 -- 1,070x below INT_MAX.
```

<!-- @example -->

<!-- @input -->
```
nums = [1000000, 1000000, 1000000], threshold = 3
```

<!-- @output -->
```
1000000
```

<!-- @why -->
Three values and a threshold of three means every quotient must be 1, which forces the divisor to the maximum. It is the case that makes `hi = max(nums)` provably sufficient.

<!-- @walkthrough -->
```
threshold = n = 3, so each quotient must be exactly 1,
which requires d >= every value.

d = 999999 : ceils 2 + 2 + 2 = 6  >  3
d = 1000000: ceils 1 + 1 + 1 = 3 <=  3   fits

The problem guarantees threshold >= n, so the largest value
always works -- which is exactly why the search never needs
to look above it.
```

<!-- @visualization custom -->

<!-- @description -->
Shows that this problem and Koko Eating Bananas share one predicate, then the measured reason the same accumulator is safe here and was not there — a bound that depends on the threshold cap rather than on the value cap.

<!-- @sampleInput -->
```json
{"primary":{"nums":[44,22,33,11],"threshold":5,"answer":33,"probes":[{"d":22,"ceils":[2,1,2,1],"sum":6,"fits":false},{"d":32,"ceils":[2,1,2,1],"sum":6,"fits":false},{"d":33,"ceils":[2,1,1,1],"sum":5,"fits":true},{"d":44,"ceils":[1,1,1,1],"sum":4,"fits":true,"note":"also fits but larger"}],"why":"33 is where ceil(33/d) falls from 2 to 1"},"sameProblemAsKoko":{"predicates":{"koko":"sum(ceil(pile / k)) <= h","smallestDivisor":"sum(ceil(num / d)) <= threshold"},"verification":{"method":"ran Koko's SHIPPED min_eating_speed unchanged against a reference for this problem","cases":4004,"disagreements":0},"reading":"not similar — identical; only the letters and the constraints differ"},"sameCodeDifferentSafety":{"overflowThreshold":[{"problem":"Koko","valuesUpTo":1000000000,"valuesNeededToOverflowAnIntSum":3},{"problem":"smallest divisor","valuesUpTo":1000000,"valuesNeededToOverflowAnIntSum":2148}],"butUnreachable":{"trials":40000,"limits":"n <= 50,000, values <= 1e6, threshold <= 1e6","largestSumEverEvaluated":2006079,"intMax":2147483647,"headroom":"1070x"},"structuralBound":{"formula":"about 2 * threshold + n","reason":"the search only descends after a probe that fit the threshold, and halving the divisor at most doubles each ceiling term","here":2050000,"measuredMax":2006079},"applyingTheBoundToKoko":{"threshold":"h <= 1e9","bound":"about 2e9 + 1e4","intMax":2147483647,"reading":"the bound clears INT_MAX, and the pile values themselves reach 1e9, so three elements suffice"},"conclusion":"the safety difference comes from the THRESHOLD cap, not the value cap","advice":"use long long anyway — the argument is a property of these constraints, and constraints change"},"smallerRange":{"rows":[{"problem":"Koko","range":"1 .. 1e9","probes":30},{"problem":"smallest divisor","range":"1 .. 1e6","probes":20}]},"earlyExitTransfers":{"kokoFinding":"saved 1-2% of the work; faster at n = 10, slower from n = 1,000","hereMeasured":[{"n":1000,"plain":53691,"withEarlyExit":62569,"ratio":"1.17x slower"},{"n":50000,"plain":2490354,"withEarlyExit":3253764,"ratio":"1.31x slower"}],"reading":"it never wins here — the small-n case where Koko saw a gain does not arise, because this problem's arrays start larger"},"groupEqualValues":{"idea":"collapse the array into (value, count) pairs so one division serves every copy","verified":{"cases":20000,"disagreements":0},"n":50000,"rows":[{"distinct":10,"plain":743572,"grouped":304349,"ratio":2.44},{"distinct":100,"plain":745343,"grouped":455853,"ratio":1.64},{"distinct":1000,"plain":822033,"grouped":789837,"ratio":1.04},{"distinct":50000,"plain":977839,"grouped":2199482,"ratio":0.44}],"reading":"a real win when values repeat heavily and a 2.3x loss when they do not, because the sort buys nothing on unique values"},"assertions":["bigger divisors give smaller quotient sums, so the predicate is monotone","max(nums) always fits, because threshold >= n","the answer is always at a divisor boundary of some value","the largest sum the search evaluates is bounded by about 2 * threshold + n","the predicate is identical to Koko Eating Bananas"]}
```

<!-- @highlights -->
- The predicate is character-for-character Koko's; Koko's shipped solver answers this problem correctly on **4,004 of 4,004** cases.
- An `int` accumulator needs **2,148** values to overflow here against Koko's **3**.
- It is not merely rare but unreachable: the largest sum ever evaluated over 40,000 inputs was **2,006,079**, 1,070× below INT_MAX.
- The bound is `2 · threshold + n` — so the safety comes from the **threshold** cap (10⁶ here, 10⁹ in Koko), not the value cap.
- The range is 10⁶ rather than 10⁹, so 20 probes instead of 30.
- Grouping equal values is 2.44× faster with ten distinct values and 2.3× slower when all are distinct.

<!-- @edgeCases -->
- threshold equal to n — every quotient must be 1, forcing the divisor to `max(nums)`.
- A threshold far larger than the sum — the answer is 1, and this is the shape that probes the smallest divisors.
- All values equal — the answer is that value divided by `threshold / n`, and the grouped version collapses the array to one pair.
- A value exactly divisible by the divisor — where `x / d + 1` overcounts and `(x + d - 1) / d` does not.
- A single element — the answer is `ceil(nums[0] / threshold)`.
- All values distinct — where the grouped approach loses 2.3× to the plain one.
- Values near 10⁶ with n near 50,000 — the largest sums this problem can produce, still 1,070× below INT_MAX.
- An `int` accumulator — provably safe at these constraints and unsafe at Koko's, with identical code.
- `math.ceil(x / d)` on large values — exact here, and a habit that breaks past 2⁵³.
- `(lo + hi) / 2` — cannot overflow at these limits, and the habit is what protects the next problem.

<!-- @pitfalls -->
- Treating this as a new problem. It is Koko Eating Bananas with renamed variables, verified over 4,004 cases.
- Concluding that a 32-bit accumulator is fine because it is fine here. The identical code collapses to 1 in Koko with three piles.
- Concluding that it must be 64-bit because Koko said so. Compute the bound — `2 · threshold + n` — rather than porting a verdict.
- Writing `x / d + 1` for the ceiling. It overcounts whenever d divides x exactly, which is frequent when values share factors.
- Using `math.ceil(x / (float)d)`. Exact for these inputs and not for larger ones, and there is no reason to introduce a float.
- Setting `hi` to the sum of the values. `max(nums)` is provably enough, since the threshold is at least n.
- Adding the predicate's early exit. It is 1.17× to 1.31× slower here and never wins.
- Grouping equal values by reflex. It loses 2.3× when every value is distinct.
- Sorting the caller's array in place to group it. The signature does not advertise that side effect.
- Returning `lo` instead of the recorded answer. This form runs until the pointers cross, so both move past it.

<!-- @doubt -->
### Is this really the same problem as Koko Eating Bananas?

<!-- @answer -->
Yes, and it was checked rather than assumed. Both ask for the smallest k such that `sum(ceil(a[i] / k))` is at most a budget — Koko calls the array *piles* and the budget *h*, this one calls them *nums* and *threshold*. To confirm there is no hidden difference, Koko's **shipped** `min_eating_speed` was run unchanged against an independent reference for this problem across 4,004 randomised inputs: **0 disagreements**. So the algorithm, the bounds, the ceiling-division detail and the monotonicity argument all transfer without modification. What does not automatically transfer is anything that depended on the *numbers*, which is the whole subject of this container.

<!-- @doubt -->
### Koko needed a 64-bit accumulator. Do I need one here?

<!-- @answer -->
Not at these constraints — and the interesting part is why. In Koko, three piles of 10⁹ sum to 3 × 10⁹ and overflow an `int`, and the wrapped negative reads as within budget, so the answer collapses to 1. Here the values are capped at 10⁶, so it takes **2,148** of them to reach INT_MAX. But the real reason it is safe goes further: the search only descends to a smaller divisor after a probe whose sum *fit* the threshold, and halving the divisor at most doubles each ceiling term — so the next sum it evaluates is bounded by roughly **2 · threshold + n**. At this problem's limits that is 2,050,000. Measured over 40,000 randomised inputs at the full limits, the largest sum ever evaluated was **2,006,079**, which is 1,070× below INT_MAX. Apply the same bound to Koko and you get about 2 × 10⁹, which clears INT_MAX — so the difference comes from the **threshold** cap, not the value cap. Write `long long` regardless: the argument belongs to these constraints, and constraints change.

<!-- @doubt -->
### So how do I know when a 64-bit accumulator is actually needed?

<!-- @answer -->
Compute the largest value the predicate can be *asked to evaluate*, which is usually not the largest value the input can hold. For a search of this shape the useful question is: what is the biggest sum the search will ever compute before it stops descending? The answer is bounded by about twice the budget, because the search only goes lower after a probe that came in under budget, and a halved divisor at most doubles each term. That gives `2 · threshold + n` — a number you can work out from the constraints in a few seconds, and one that would have predicted both this container's result and Koko's without running anything. It is a better habit than memorising which problems need wide accumulators, because the same code changes verdict when the constraints do.

<!-- @doubt -->
### Does the early-exit finding from Koko still hold?

<!-- @answer -->
It holds and gets stronger. Koko measured that abandoning the sum once it passed the budget saved only 1–2% of the element visits — because binary search converges where the total tracks the budget closely — and that it was faster at n = 10 but 1.28x slower at n = 10,000. Measured again at these constraints: **62,569ns against 53,691 at n = 1,000** and **3,253,764 against 2,490,354 at n = 50,000**, so 1.17x and 1.31x slower. It never wins here at all, because this problem's arrays start at a size where Koko had already stopped benefiting. The conclusion transfers because the *reason* transfers: the exit is only worth having when the predicate usually succeeds early, and a binary search is designed to spend its probes where it does not.

<!-- @doubt -->
### Is grouping equal values worth it?

<!-- @answer -->
Only when you know the values repeat. Collapsing the array into (value, count) pairs means one ceiling division serves every copy, and it is correct — 0 disagreements against the plain version over 20,000 randomised cases. Measured at n = 50,000: **2.44x faster with ten distinct values**, 1.64x with a hundred, 1.04x with a thousand, and **0.44x — a 2.3x loss — when every value is distinct**, because the sort costs O(n log n) and buys nothing. This problem's constraints make repeats plausible (values capped at 10⁶ with n up to 50,000), which is why it is worth mentioning here and was not worth mentioning in Koko, where piles reach 10⁹ and repeats are unlikely. In Python the calculus is a little better, since `Counter` groups in O(n) with no sort at all.

<!-- @doubt -->
### Why is `max(nums)` enough for the upper bound?

<!-- @answer -->
Because at that divisor every quotient is exactly 1, so the sum is n — and the problem guarantees the threshold is at least n. Any larger divisor is therefore unnecessary and the answer can never exceed it. The case that makes this tight is `nums = [10⁶, 10⁶, 10⁶]` with `threshold = 3`: divisor 999,999 gives quotients of 2 and a sum of 6, so nothing below the maximum works. The range being 10⁶ rather than Koko's 10⁹ is also why this search takes about **20 probes instead of 30** — a third fewer passes over the array, from nothing more than a smaller constraint on the input values.
