---
id: koko-eating-bananas
topic: Binary Search
title: Koko eating bananas
difficulty: Medium
status: ready
prerequisites:
  - find-square-root-of-a-number
  - lower-bound
  - integer-overflow-and-precision-errors
relatedIds:
  - find-the-smallest-divisor
  - minimum-days-to-make-m-bouquets
  - capacity-to-ship-packages-within-d-days
  - find-square-root-of-a-number
  - lower-bound
---

<!-- @summary -->
The first predicate that simulates rather than computes: it walks every pile and asks whether the total time fits. That makes each probe O(n) instead of O(1), and it moves the overflow from the candidate into the accumulator — three piles of a billion already exceed a 32-bit hour count, and the wrapped negative reads as "comfortably in budget", collapsing the answer to 1.

<!-- @theory -->
## The problem

Koko has piles of bananas and h hours. At speed k she eats k bananas an hour from
one pile, and a pile smaller than k still costs the whole hour. Find the smallest
k that clears every pile within h hours.

```
piles = [3, 6, 7, 11], h = 8    ->  4
piles = [30, 11, 23, 4, 20], h = 5  ->  30
piles = [30, 11, 23, 4, 20], h = 6  ->  23
```

Hours at speed k are `sum(ceil(pile / k))`, and that sum only decreases as k
grows — so the predicate "does speed k fit in h hours" is monotone, and the answer
is a lower bound over it.

## The predicate is now a loop

The two root subtopics had predicates that were arithmetic: `mid² ≤ n` is one
multiply. Here the predicate walks the whole array, which changes two things.

**Each probe costs O(n)**, so the total is O(n log max(pile)) rather than
O(log n). The binary search is now the cheap part.

**The overflow moves.** In the root problems the danger was the *candidate* —
`mid * mid` growing past the type. Here the candidate is fine; it is the
*accumulator* that grows, because it sums n terms each as large as a pile.

## Three piles are enough to overflow

At k = 1 the hours are just the sum of the piles:

| piles | hours at k = 1 | in a 32-bit int |
|---|---|---|
| 2 × 1,000,000,000 | 2,000,000,000 | fits |
| **3 × 1,000,000,000** | **3,000,000,000** | **overflows** |
| 10,000 × 1,000,000,000 | 10,000,000,000,000 | overflows |

Three piles. The problem's own constraints — `piles[i] ≤ 10⁹`, `h ≤ 10⁹` — put
that within reach of a hand-written test.

And the failure is not a small error. A concrete case found by search:

```
piles = [443242656, 825977906, 966758018],  h = 758245386

hours at k = 1 : 2,235,978,580 exact
                -2,058,988,716 as a 32-bit int   (wrapped)

-2,058,988,716 <= h  ->  "speed 1 fits comfortably"
returns 1 ; the correct answer is 3
```

The wrap makes an impossible speed look like the easiest one, so the search
collapses to the bottom of its range.

## Where it fails is not where you would look

Measured over 20,000 random cases per size, with piles and h both drawn across
their full legal ranges:

| n | 32-bit hour sum wrong |
|---|---|
| 3 | **340 of 20,000 — 1.70%** |
| 10 | 8 of 2,000 — 0.4% |
| 100 | 0 |
| 1,000 | 0 |

The failure rate **falls** as the array grows, which is the opposite of the
instinct that bigger inputs break sooner. The reason is that the bug needs the
search to actually probe a small k. With many piles the answer is large, so the
search never descends far enough for the sum to be dangerous. With three big
piles the sum at k = 1 only just exceeds INT_MAX, and h can be large enough that
the search goes looking down there.

So a test suite built from large arrays will not find this, and one built from
three-element arrays will.

## Two fixes, and only one of them is free

**Accumulate in 64 bits.** `long long hours = 0` and the problem disappears at no
cost — the sum is bounded by 10⁴ × 10⁹ = 10¹³, comfortably inside.

**Stop counting once the budget is blown.** Return false the moment the running
total passes h. Measured, this is **0 wrong even with a 32-bit accumulator**,
because the total can never exceed `h + max(pile)` = 2 × 10⁹, which is below
INT_MAX = 2,147,483,647.

That second one deserves a caveat: the margin is 7%. It holds for these
constraints and not for constraints slightly larger. Prefer the 64-bit
accumulator, which needs no argument at all.

## The early exit does not save the work you think

The cutoff was decisive in the nth-root container, where it removed the overflow
by never forming a large value. Here it looks like it should also save time — why
keep adding once the answer is decided? Measured element visits per call:

| n | no early exit | with early exit | |
|---|---|---|---|
| 10 | 297 | 294 | 0.99x |
| 1,000 | 29,945 | 29,577 | 0.99x |
| 10,000 | 299,150 | 295,122 | 0.99x |

**One to two percent.** The early exit almost never fires, and the reason is
structural: binary search converges on the answer, so most probes are near it,
and near the answer the running total tracks h closely and only passes it in the
final elements. The cutoff is checked n times to trigger in the last handful.

In time it is a loss at scale — nanoseconds per call, consistent across three
runs:

| n | no early exit | with early exit |
|---|---|---|
| 10 | 709 | **413** |
| 100 | 3,679 | 3,817 |
| 1,000 | **33,754** | 39,069 |
| 10,000 | **358,170** | 459,822 |

Since the work is identical to within 1%, neither the win at n = 10 nor the loss
at n = 10,000 is algorithmic — both are code-generation effects, and the 1.28x
loss at n = 10,000 is the one that matters. The useful conclusion is narrow:
**add the cutoff for the overflow safety if you are stuck with a 32-bit
accumulator, not because it saves work — it does not.**

## The bounds barely matter here

Both root containers turned on choosing `hi` well. This one does not, and it is
worth knowing why so the lesson is not over-applied.

`hi = max(pile)` is correct and obvious — at that speed every pile takes exactly
one hour, and the problem guarantees `h ≥ n`. Using `hi = sum(piles)` instead
costs only a few probes:

| n | hi = max(pile) | hi = sum(piles) |
|---|---|---|
| 10 | 30 | 33 |
| 1,000 | 30 | 39 |
| 10,000 | 30 | 43 |

And tightening the *lower* bound to `ceil(sum / h)` — which is a genuine lower
bound on the answer, verified across 40,000 random cases with 0 disagreements —
saves almost nothing: **29.8 probes become 29.0**, and the timings are within
noise. The range here is already small relative to what each probe costs, so
trimming it is not where the time is.

<!-- @intuition -->
The shift worth internalising is that the predicate has become a program. In the root problems it was an expression, and an expression is either right or it overflows in one obvious place. A predicate that loops has an accumulator, and an accumulator has a range that depends on the input size rather than on the candidate — which is why the danger moved from `mid` to `hours`, and why three piles break what a million single values would not. The habit this should build is to ask, of every predicate you write for a search like this, what the largest intermediate value is and which input maximises it. That question has an answer here — the sum of all piles, reached at k = 1 — and asking it takes less time than finding out from a wrong answer.

<!-- @approach -->
### Try Every Speed

<!-- @idea -->
Test speeds upward from 1 and return the first one that finishes in time.

<!-- @steps -->
1. Start at speed 1.
2. Add up the hours needed at that speed, one pile at a time.
3. If the total fits in h, that speed is the answer.
4. Otherwise try the next speed.
5. The maximum pile always works, so the loop terminates.

<!-- @complexity -->
- time: O(max(pile) · n)
- space: O(1)
- note: Correct and unusable at the problem's real scale — the answer can be a billion. Measured 21,052ns at n = 100 against 3,679ns for the binary search, and it is not runnable at all for the large-pile inputs the constraints allow.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int minEatingSpeed(const vector<int>& piles, int h) {
    int hi = *max_element(piles.begin(), piles.end());
    for (int k = 1; k <= hi; k++) {
        long long hours = 0;
        for (int p : piles) hours += (p + k - 1) / k;
        if (hours <= h) return k;
    }
    return hi;
}
```

<!-- @annotations -->
- 6: The largest pile is always a valid speed, because the problem guarantees at least as many hours as piles.
- 8: `long long` for the accumulator, which is what the binary version needs too — the sum reaches 10^13 at the problem's limits.
- 9: `(p + k - 1) / k` is the ceiling of p/k in integers. Writing `p / k + 1` is wrong whenever k divides p exactly.
- 12: Unreachable, since the loop always finds the maximum pile if nothing smaller works.

<!-- @code java -->
```java
static int minEatingSpeed(int[] piles, int h) {
    int hi = 0;
    for (int p : piles) hi = Math.max(hi, p);
    for (int k = 1; k <= hi; k++) {
        long hours = 0;
        for (int p : piles) hours += (p + k - 1) / k;
        if (hours <= h) return k;
    }
    return hi;
}
```

<!-- @annotations -->
- 6: `long`, not `int`. With ten thousand piles of a billion this reaches 10^13.

<!-- @code python -->
```python
import math


def min_eating_speed(piles, h):
    hi = max(piles)
    for k in range(1, hi + 1):
        if sum(math.ceil(p / k) for p in piles) <= h:
            return k
    return hi
```

<!-- @annotations -->
- 7: `math.ceil(p / k)` uses float division and is exact only while p is below 2^53. Prefer `-(-p // k)` or `(p + k - 1) // k` for integers of any size.

<!-- @approach -->
### Stop Counting Once the Budget Is Blown

<!-- @idea -->
Binary search the speed, and abandon the hour count the moment it passes h.

<!-- @steps -->
1. Search speeds between 1 and the largest pile.
2. For each candidate, add up hours pile by pile.
3. Abandon the count as soon as the running total exceeds h — the candidate is already ruled out.
4. If the count finishes within budget, record the speed and search lower.
5. Otherwise search higher.

<!-- @complexity -->
- time: O(n log max(pile)), with the same constant as the plain version
- space: O(1)
- note: Its value is safety, not speed. It is **0 wrong even with a 32-bit accumulator**, because the running total cannot exceed h + max(pile) = 2 x 10^9. It saves only 1-2% of element visits and measures 1.16x to 1.28x *slower* at n = 1,000 and above.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int minEatingSpeed(const vector<int>& piles, int h) {
    int lo = 1, hi = *max_element(piles.begin(), piles.end()), ans = hi;
    while (lo <= hi) {
        int k = lo + (hi - lo) / 2;
        long long hours = 0;
        bool fits = true;
        for (int p : piles) {
            hours += (p + k - 1) / k;
            if (hours > h) { fits = false; break; }
        }
        if (fits) { ans = k; hi = k - 1; }
        else       lo = k + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 8: Subtracting before halving, so lo + hi never overflows — the same guard every subtopic in this module has needed.
- 13: The cutoff. It bounds the accumulator at h + max(pile), which is what makes a 32-bit total safe under these constraints — with only 7% of headroom, so prefer the 64-bit type anyway. Measured, it fires so rarely that it saves 1-2% of the element visits: a correctness device, not an optimisation.
- 15: Recording the candidate and searching lower, because the answer is the *smallest* speed that works.

<!-- @code java -->
```java
static int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = 0, ans;
    for (int p : piles) hi = Math.max(hi, p);
    ans = hi;
    while (lo <= hi) {
        int k = lo + (hi - lo) / 2;
        long hours = 0;
        boolean fits = true;
        for (int p : piles) {
            hours += (p + k - 1) / k;
            if (hours > h) { fits = false; break; }
        }
        if (fits) { ans = k; hi = k - 1; }
        else       lo = k + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 11: The break is what keeps the accumulator bounded. Without it, and with an `int` here, three piles of a billion wrap to a negative and read as in-budget.

<!-- @code python -->
```python
def min_eating_speed(piles, h):
    lo, hi = 1, max(piles)
    ans = hi
    while lo <= hi:
        k = (lo + hi) // 2
        hours = 0
        fits = True
        for p in piles:
            hours += -(-p // k)
            if hours > h:
                fits = False
                break
        if fits:
            ans = k
            hi = k - 1
        else:
            lo = k + 1
    return ans
```

<!-- @annotations -->
- 9: `-(-p // k)` is integer ceiling division with no float anywhere, so it is exact for integers of any size.
- 10: In Python the cutoff cannot prevent an overflow, since integers grow — here it is purely a (small) performance choice.

<!-- @approach -->
### Binary Search on the Speed

<!-- @idea -->
Halve the range of possible speeds, deciding each candidate by summing the hours it needs.

<!-- @steps -->
1. The answer lies between 1 and the largest pile, since that speed clears one pile per hour.
2. Take the midpoint speed.
3. Sum the hours it needs, using ceiling division and a 64-bit accumulator.
4. If the total fits in h, record it and search lower; otherwise search higher.
5. The last recorded speed is the smallest that works.

<!-- @complexity -->
- time: O(n log max(pile)) — about 30 probes for the problem's limits, each costing one pass
- space: O(1)
- note: The answer. Measured 3,679ns at n = 100 and 358,170ns at n = 10,000, against 3,817 and 459,822 for the early-exit variant. The 64-bit accumulator removes the overflow at no cost, which the cutoff does only with 7% of headroom.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int minEatingSpeed(const vector<int>& piles, int h) {
    int lo = 1, hi = *max_element(piles.begin(), piles.end()), ans = hi;
    while (lo <= hi) {
        int k = lo + (hi - lo) / 2;
        long long hours = 0;
        for (int p : piles) hours += (p + k - 1) / k;
        if (hours <= h) { ans = k; hi = k - 1; }
        else             lo = k + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 6: hi is the largest pile, which is provably enough — at that speed every pile takes exactly one hour and the problem guarantees h is at least the number of piles.
- 8: Subtracting before halving, so lo + hi never overflows.
- 9: `long long`, and this is the whole bug of this subtopic. With `int` here, three piles of a billion sum to 3,000,000,000, which wraps negative and reads as within budget — returning 1 where the answer is 3.
- 10: `(p + k - 1) / k` is integer ceiling division. `p / k + 1` overcounts by one whenever k divides p exactly, and floating-point `ceil(p / (double)k)` stops being exact past 2^53.
- 11: Record and search lower. This is a lower bound over a predicate, so the answer is the smallest speed that fits rather than the last one tested.
- 14: `ans` rather than `lo`, because this form runs until the pointers cross and both move past the answer.

<!-- @code java -->
```java
static int minEatingSpeed(int[] piles, int h) {
    int lo = 1, hi = 0;
    for (int p : piles) hi = Math.max(hi, p);
    int ans = hi;
    while (lo <= hi) {
        int k = lo + (hi - lo) / 2;
        long hours = 0;
        for (int p : piles) hours += (p + k - 1) / k;
        if (hours <= h) { ans = k; hi = k - 1; }
        else             lo = k + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 8: `long hours`, not `int`. The sum reaches 10^13 at the problem's limits and 3 x 10^9 with only three piles.

<!-- @code python -->
```python
def min_eating_speed(piles, h):
    lo, hi = 1, max(piles)
    ans = hi
    while lo <= hi:
        k = (lo + hi) // 2
        hours = sum(-(-p // k) for p in piles)
        if hours <= h:
            ans = k
            hi = k - 1
        else:
            lo = k + 1
    return ans


# Python integers grow as needed, so the accumulator overflow
# that breaks the C++ and Java versions cannot happen here.
```

<!-- @annotations -->
- 6: `-(-p // k)` rather than `math.ceil(p / k)`. The float route is exact only while p is below 2^53, and this problem's inputs are integers throughout.

<!-- @example -->

<!-- @input -->
```
piles = [3, 6, 7, 11], h = 8
```

<!-- @output -->
```
4
```

<!-- @why -->
At speed 4 the piles take 1, 2, 2 and 3 hours — exactly 8. At speed 3 they take 10, which is over budget, so 4 is the smallest that works.

<!-- @walkthrough -->
```
lo=1 hi=11   k=6   ceil: 1+1+2+2 = 6  <= 8   ans=6, hi=5
lo=1 hi=5    k=3   ceil: 1+2+3+4 = 10 >  8   lo=4
lo=4 hi=5    k=4   ceil: 1+2+2+3 = 8  <= 8   ans=4, hi=3
lo=4 > hi=3 -> 4

Four probes, each a full pass over the array. The search is
the cheap part; the predicate is where the time goes.
```

<!-- @example -->

<!-- @input -->
```
piles = [30, 11, 23, 4, 20], h = 5
```

<!-- @output -->
```
30
```

<!-- @why -->
Five piles and five hours means one hour per pile, which forces the speed up to the largest pile. This is the case that makes `hi = max(pile)` provably sufficient.

<!-- @walkthrough -->
```
n = 5 and h = 5, so every pile must finish in a single hour.
That requires k >= every pile, so k = max = 30.

At k = 29: ceil(30/29) = 2, and the total is 6 > 5.

The problem guarantees h >= n, so a speed of max(pile) always
works — which is exactly why the search never needs to look
above it.
```

<!-- @example -->

<!-- @input -->
```
piles = [30, 11, 23, 4, 20], h = 6
```

<!-- @output -->
```
23
```

<!-- @why -->
One extra hour of budget drops the required speed from 30 to 23, showing that the answer is not a simple function of the piles — it has to be searched.

<!-- @walkthrough -->
```
k = 23 : ceil = 2 + 1 + 1 + 1 + 1 = 6  <= 6   fits
k = 22 : ceil = 2 + 1 + 2 + 1 + 1 = 7  >  6   too slow

The jump at 23 is where ceil(23/k) goes from 1 to 2. The
predicate changes value only at these divisor boundaries,
which is why the answer is always one of them.
```

<!-- @example -->

<!-- @input -->
```
piles = [443242656, 825977906, 966758018], h = 758245386
```

<!-- @output -->
```
3
```

<!-- @why -->
Three piles are enough to overflow a 32-bit hour count. With `int hours` this returns 1 — the wrapped sum is negative, so speed 1 reads as the easiest possible option.

<!-- @walkthrough -->
```
hours at k = 1 = 443242656 + 825977906 + 966758018
               = 2,235,978,580     exact
               = -2,058,988,716    as a 32-bit int

-2,058,988,716 <= 758,245,386  ->  "speed 1 fits"
so the search sets hi = 0 and returns 1.

With a 64-bit accumulator:
  k = 1 : 2,235,978,580 > h   too slow
  k = 2 : 1,117,989,290 > h   too slow
  k = 3 :   745,326,194 <= h  fits   -> 3

Measured over 20,000 random three-pile cases with h across
its full legal range, the 32-bit version is wrong on 1.70%.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the predicate as a simulation rather than an expression, the accumulator overflow that three piles are enough to trigger, and the measured finding that the early exit almost never fires.

<!-- @sampleInput -->
```json
{"primary":{"piles":[3,6,7,11],"h":8,"answer":4,"predicate":"sum(ceil(pile / k)) <= h","monotone":"hours only decrease as k grows","trace":[{"lo":1,"hi":11,"k":6,"perPile":[1,1,2,2],"hours":6,"fits":true,"action":"ans = 6, hi = 5"},{"lo":1,"hi":5,"k":3,"perPile":[1,2,3,4],"hours":10,"fits":false,"action":"lo = 4"},{"lo":4,"hi":5,"k":4,"perPile":[1,2,2,3],"hours":8,"fits":true,"action":"ans = 4, hi = 3"}],"note":"each probe is a full pass over the array — the search is the cheap part"},"predicateIsNowALoop":{"contrast":"the root subtopics had arithmetic predicates; this one simulates","consequences":["each probe costs O(n), so the total is O(n log max(pile))","the overflow moves from the candidate to the accumulator"]},"threePilesOverflow":{"rows":[{"piles":"2 x 1,000,000,000","hoursAtK1":2000000000,"fitsInInt":true},{"piles":"3 x 1,000,000,000","hoursAtK1":3000000000,"fitsInInt":false},{"piles":"10,000 x 1,000,000,000","hoursAtK1":10000000000000,"fitsInInt":false}],"concreteFailure":{"piles":[443242656,825977906,966758018],"h":758245386,"exactHoursAtK1":2235978580,"asInt32":-2058988716,"reads":"negative, so speed 1 looks comfortably in budget","returns":1,"correct":3}},"failureRateInverts":{"rows":[{"n":3,"cases":20000,"wrong":340,"pct":1.70},{"n":10,"cases":2000,"wrong":8,"pct":0.4},{"n":100,"cases":2000,"wrong":0},{"n":1000,"cases":2000,"wrong":0}],"why":"the bug needs the search to probe a small k; with many piles the answer is large and the search never descends that far","testingConsequence":"a suite built from large arrays will not find this; one built from three-element arrays will"},"twoFixes":[{"fix":"accumulate in 64 bits","cost":"none","bound":"10^4 x 10^9 = 10^13, comfortably inside"},{"fix":"stop counting once the total passes h","wrongWith32BitAccumulator":0,"bound":"h + max(pile) = 2 x 10^9","headroom":"7% below INT_MAX = 2,147,483,647","caveat":"holds for these constraints and not for slightly larger ones"}],"earlyExitDoesNotSaveWork":{"elementVisits":[{"n":10,"noEarlyExit":297,"withEarlyExit":294,"ratio":0.99},{"n":1000,"noEarlyExit":29945,"withEarlyExit":29577,"ratio":0.99},{"n":10000,"noEarlyExit":299150,"withEarlyExit":295122,"ratio":0.99}],"why":"binary search converges on the answer, so most probes sit near it, and near the answer the running total tracks h closely and only passes it in the final elements","time":[{"n":10,"noEarlyExit":709,"withEarlyExit":413},{"n":100,"noEarlyExit":3679,"withEarlyExit":3817},{"n":1000,"noEarlyExit":33754,"withEarlyExit":39069},{"n":10000,"noEarlyExit":358170,"withEarlyExit":459822}],"reading":"the work is identical to within 1%, so neither the win at n = 10 nor the 1.28x loss at n = 10,000 is algorithmic — add the cutoff for safety, not for speed"},"boundsBarelyMatter":{"contrast":"both root containers turned on choosing hi well; this one does not","upperBound":[{"n":10,"hiIsMax":30,"hiIsSum":33},{"n":1000,"hiIsMax":30,"hiIsSum":39},{"n":10000,"hiIsMax":30,"hiIsSum":43}],"lowerBound":{"tighter":"ceil(sum / h) is a genuine lower bound","verified":{"cases":40000,"disagreements":0},"probes":{"loIs1":29.8,"loIsCeilSumOverH":29.0},"verdict":"saves almost nothing; the range is already small relative to what each probe costs"}},"assertions":["hours at speed k is sum(ceil(pile/k))","hours are non-increasing in k","max(pile) always fits, because h >= n","the accumulator peaks at k = 1, where it equals the sum of the piles","the answer is always at a divisor boundary of some pile"]}
```

<!-- @highlights -->
- The predicate simulates rather than computes, so each probe costs O(n) and the search becomes the cheap part.
- The overflow moves from the candidate to the accumulator — **three piles of a billion** are enough.
- The wrapped sum is negative, so an impossible speed reads as in-budget and the answer collapses to 1.
- The failure rate *falls* as the array grows: 1.70% at n = 3, zero at n = 100.
- The early exit saves 1–2% of the work, not the large fraction it appears to, and costs 1.28x at n = 10,000.
- Unlike the root subtopics, tightening the bounds here buys almost nothing — 29.8 probes become 29.0.

<!-- @edgeCases -->
- A single pile — the answer is `ceil(pile / h)`, and the search still runs normally.
- h equal to the number of piles — forces the speed to the largest pile, which is the case proving `hi = max(pile)` is enough.
- h enormous relative to the piles — the answer is 1, and this is the case that probes the small speeds where the sum overflows.
- Three piles near 10⁹ — the smallest shape that overflows a 32-bit hour count.
- A pile exactly divisible by k — where `p / k + 1` overcounts and `(p + k - 1) / k` does not.
- All piles equal — the answer is `ceil(pile / floor(h / n))`, and every probe touches every pile.
- Piles beyond 2⁵³ in a language using float ceiling — `math.ceil(p / k)` stops being exact.
- k = 1 — the maximum of the accumulator, and therefore the only place the overflow can first appear.
- An answer of exactly `max(pile)` — the loop must include the upper bound, so `lo <= hi` rather than `lo < hi`.
- `lo + hi` for large bounds — overflows an int, exactly as in Lower Bound.

<!-- @pitfalls -->
- Accumulating hours in a 32-bit int. Three piles of a billion wrap to a negative that reads as in-budget, returning 1 where the answer is 3.
- Testing only with large arrays. The failure rate is 1.70% at three piles and zero at a hundred.
- Writing `p / k + 1` for the ceiling. It overcounts by one whenever k divides p exactly.
- Using `ceil(p / (double)k)`. Exact only while p is below 2⁵³, and the inputs here are integers throughout.
- Adding the early exit expecting it to save work. Measured, it saves 1–2% of element visits and costs 1.28x at n = 10,000.
- Relying on the early exit for overflow safety. It works under these constraints with only 7% of headroom; the 64-bit accumulator needs no argument.
- Setting `hi` to the sum of the piles. Correct but wasteful — 43 probes instead of 30 at n = 10,000.
- Spending effort tightening the lower bound. `ceil(sum / h)` is a valid bound and saves 0.8 probes out of 30.
- Returning `lo` instead of the recorded answer. This form runs until the pointers cross, so both move past the answer.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int for large bounds, exactly as in Lower Bound.

<!-- @doubt -->
### Why does the overflow show up in the accumulator rather than the candidate?

<!-- @answer -->
Because the predicate changed shape. In the square-root and nth-root subtopics the predicate was an expression in the candidate — `mid²` or `midⁿ` — so the candidate growing was what broke it. Here the candidate only ever appears as a divisor, which shrinks things. What grows is the *sum*, and it grows with the number of piles rather than with the candidate. Its maximum is at k = 1, where the hours are exactly the sum of all the piles: with the problem's limits that is 10⁴ × 10⁹ = 10¹³, and it exceeds a 32-bit int with just **three** piles of a billion. The general habit worth taking away is to ask which input maximises the largest intermediate value in your predicate, and here the answer is "the smallest candidate", which is the opposite of the root problems.

<!-- @doubt -->
### How bad is the wrong answer?

<!-- @answer -->
As bad as it can be. The sum wraps to a negative number, and a negative number is comfortably less than h — so the search concludes that the *slowest possible speed* fits in budget, sets `hi = k - 1`, and collapses to 1. On `piles = [443242656, 825977906, 966758018]` with `h = 758245386` the true hours at k = 1 are 2,235,978,580, which as a 32-bit int is **−2,058,988,716**; the function returns **1** where the answer is **3**. It is not an off-by-one, and it is not a crash — it is a confident answer at the bottom of the range.

<!-- @doubt -->
### Why does the failure rate go down as the array gets bigger?

<!-- @answer -->
Because the bug needs the search to actually evaluate the predicate at a small k, and larger arrays push the answer away from there. With a thousand piles the total work is large, so the required speed is large, and the binary search spends its probes in the high range where each `ceil(pile/k)` is small and the sum is harmless. With three big piles the sum at k = 1 only just exceeds INT_MAX, and h can be large enough that the search descends to look. Measured: **1.70% wrong at n = 3, 0.4% at n = 10, and zero at n = 100 and n = 1,000**. The practical consequence is about testing rather than about the algorithm — a suite built from big arrays will pass, and one built from three-element arrays will not.

<!-- @doubt -->
### Should I add the early exit?

<!-- @answer -->
Only for safety, and only if you cannot use a 64-bit accumulator. It does make a 32-bit total safe: with the cutoff the running sum never exceeds `h + max(pile)` = 2 × 10⁹, below INT_MAX, and it measured **0 wrong** where the plain 32-bit version was wrong on 1.70%. But the margin is 7%, so it is an argument that depends on the exact constraints. And it does not do what it looks like it does — measured element visits are **0.99×** with the cutoff at every size, because binary search converges on the answer and near the answer the running total only passes h in the final few elements. In time it costs **1.28× at n = 10,000**. Use `long long` and skip it.

<!-- @doubt -->
### Why is `(p + k - 1) / k` the right way to write the ceiling?

<!-- @answer -->
Because it is exact for integers and has no special case. The two common alternatives both fail. `p / k + 1` overcounts whenever k divides p exactly — with p = 6 and k = 3 it gives 3 hours where 2 are needed, which quietly makes every speed look worse than it is. `ceil(p / (double)k)` is exact only while p fits in a double's mantissa; past 2⁵³ consecutive integers stop being representable and the division can round to the wrong side, which is the same failure the square-root container measured for `sqrt`. Python has a third option worth knowing, `-(-p // k)`, which uses floor division twice and is exact for integers of any size.

<!-- @doubt -->
### Why is `max(pile)` a sufficient upper bound?

<!-- @answer -->
Because at that speed every pile finishes in exactly one hour, so the total is n hours — and the problem guarantees `h ≥ n`. Any larger speed is therefore unnecessary, and the answer can never exceed it. The case that makes this tight is `h = n`, where one hour per pile is all the budget there is and the answer *is* `max(pile)`: on `[30, 11, 23, 4, 20]` with `h = 5`, speed 29 already needs 6 hours. Using `sum(piles)` instead is correct but wasteful, costing 43 probes instead of 30 at n = 10,000 — a small price here only because each probe is expensive relative to the number of them.

<!-- @doubt -->
### The root subtopics said bounds matter a lot. Do they here?

<!-- @answer -->
Much less, and the difference is worth understanding rather than memorising either rule. There, each probe was O(1), so the probe count *was* the cost, and halving it halved the runtime — capping `hi` at 46,341 was worth 2.2×. Here each probe costs a full pass over the array, so 30 probes against 43 is a 30% difference in a term that is already dominated by n. Tightening the *lower* bound to `ceil(sum / h)` — a genuine lower bound, verified with 0 disagreements over 40,000 random cases — moves the probe count from **29.8 to 29.0** and shows no reliable timing difference at all. The rule that generalises is not "always tighten the bounds" but "tighten whichever term dominates", and here that term is the predicate, not the search.
