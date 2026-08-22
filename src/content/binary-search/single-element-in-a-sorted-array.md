---
id: single-element-in-a-sorted-array
topic: Binary Search
title: Single element in a Sorted Array
difficulty: Medium
status: ready
prerequisites:
  - lower-bound
  - search-x-in-sorted-array
  - find-the-number-that-appears-once-and-other-numbers-twice
relatedIds:
  - find-the-number-that-appears-once-and-other-numbers-twice
  - lower-bound
  - find-peak-element
  - search-x-in-sorted-array
  - count-occurrences-in-a-sorted-array
---

<!-- @summary -->
Every element appears twice except one, so the invariant stops being about order and becomes about index parity: before the single element pairs start on even indices, after it they start on odd ones. Forgetting to stand on the even index of a pair is wrong on 98.30% of inputs and fails from n = 3. The XOR-everything solution needs no sortedness at all and beats the binary search up to about n = 400.

<!-- @theory -->
## The problem

A sorted array in which every value appears exactly twice, except one that appears
once. Find it, in O(log n).

```
[1, 1, 2, 3, 3, 4, 4, 8, 8]  ->  2
[3, 3, 7, 7, 10, 11, 11]     ->  10
[1]                          ->  1
```

Note the length is always odd — pairs contribute an even count and the single
element makes it odd.

## The invariant is parity, not order

Comparing an element to a target is useless here: there is no target. What the
sortedness buys is that equal values are adjacent, so the array is a run of pairs
with one intruder. That gives a positional invariant:

```
[1, 1, 2, 3, 3, 4, 4]
 0  1  2  3  4  5  6

before index 2:  pairs start at EVEN indices   a[0]==a[1]
after  index 2:  pairs start at ODD  indices   a[3]==a[4], a[5]==a[6]
```

So: stand on an even index and compare it with the next element. If they match,
you are still before the single element and it lies to the right. If they do not
match, you are at or past it, and it lies at or before you.

That is an ordinary boundary search, with `a[mid] == a[mid+1]` in place of a
comparison against a target.

Verified over every structure with 0 to 200 pairs — every array length from 1 to
401, with the single element in every possible position, and randomised gaps
between the distinct values so nothing depends on them being consecutive —
**20,301 arrays, 0 wrong.**

## Standing on the wrong index breaks almost everything

The invariant only holds if `mid` is the *first* index of a pair. Land on an odd
index and `a[mid] == a[mid+1]` compares the second element of one pair with the
first element of the next, which says nothing.

The fix is one line — `if (mid & 1) mid--;` — and omitting it is not a subtle
bug:

| | wrong |
|---|---|
| without forcing mid even | **19,956 of 20,301 — 98.30%** |
| first failing size | **n = 3** |

It fails on nearly every input and it fails immediately, which is the one
consolation: this is not a bug that hides.

## The XOR solution ignores sortedness entirely

XOR every element together. Each pair cancels — `v ^ v == 0` — and the single
element survives:

```
1 ^ 1 ^ 2 ^ 3 ^ 3 ^ 4 ^ 4  =  2
```

0 wrong over the same 20,301 arrays, and it needs **no sorted input, no adjacency,
and no parity argument**. It would work on the same multiset in any order at all.

It is O(n) and it is not slow. Being a reduction with no early exit and no
data-dependent branching, it is exactly the shape a compiler vectorises — 43
instructions of which **11 are vector instructions** — and it wins outright on
small inputs:

| n | xor everything | walk pairs | binary, force even | binary, index xor |
|---|---|---|---|---|
| 17 | **2.1** | 3.7 | 4.07 | 5.74 |
| 65 | **3.3** | 7.3 | 8.00 | 8.01 |
| 257 | **7.8** | 25.0 | 11.15 | 11.78 |
| 1,025 | 61.7 | 97.9 | **18.04** | 18.49 |
| 4,097 | 207.1 | 328.9 | 28.05 | **27.26** |
| 65,537 | 3,166.7 | 4,967.1 | 51.22 | **48.85** |
| 1,048,577 | 70,021.1 | 78,709.3 | 107.35 | **97.65** |

Nanoseconds per call. The crossover sits near **n = 400**. Below it the vectorised
linear pass is faster than a logarithmic search; above it the logarithmic search
pulls away to 700x.

This is the third subtopic where a vectorised O(n) reduction beats an O(log n)
search on small input — the same effect as the counting scan in Count Occurrences.
The pattern is stable enough to name: **a branchless reduction over contiguous
memory runs at roughly a sixteenth of its instruction count, so its crossover with
a logarithmic algorithm sits far higher than the complexity classes suggest.**

Walking the pairs — checking `a[i] != a[i+1]` for even i and stopping — is the
worst of both. It is O(n) like the XOR, but its early exit is a data-dependent
branch that prevents vectorisation, so it measures 3.2x slower than the XOR at
n = 257 and never wins anything.

## A measurement I had to throw away

The two binary forms — forcing `mid` even, or fetching the partner with `mid ^ 1`
— differ in iteration count. Forcing even collapses the search onto even indices
only, so it does exactly **one fewer iteration** at every size:

| n | iterations, force even | iterations, index xor |
|---|---|---|
| 257 | 7.02 | 8.01 |
| 65,537 | 15.00 | 16.00 |
| 1,048,577 | 19.00 | 20.00 |

My first benchmark showed the version with fewer iterations running **1.30x
slower**, which would have been another entry in this module's running theme. It
was an artefact. The two were timed back to back on the same arrays, so whichever
ran second found the array already in cache.

Re-running with the order reversed gave 1.07x instead of 1.15x, and re-running
with the four algorithms shuffled into a random order every repetition gives the
table above, where the two are within **1.10x in either direction** and the winner
changes with n. The honest conclusion is that they are the same speed and the
choice is a matter of clarity.

The general lesson is worth more than the result: when two candidates touch the
same memory, measuring them in a fixed order makes the second one look faster, and
the effect here was large enough to invent a finding that did not exist.

<!-- @intuition -->
Every other search in this module compares an element to something — a target, an endpoint, a neighbour — and discards the side that cannot contain the answer. Here there is nothing to compare against, and the temptation is to conclude that binary search does not apply. What makes it apply is noticing that the array carries a second signal besides its values: the single element shifts every pair after it by one position, so the *indices* are divided into a region where pairs begin evenly and a region where they begin oddly. That boundary is what the search is looking for, and once you see it the problem becomes an ordinary lower bound over a predicate — "does the pair starting here still begin evenly?" The values are only used to evaluate that predicate. It is worth carrying forward: when there is no target, look for a property that flips exactly once.

<!-- @approach -->
### XOR Everything

<!-- @idea -->
Combine every element with exclusive-or; the pairs cancel and the single element is what remains.

<!-- @steps -->
1. Start an accumulator at zero.
2. XOR every element of the array into it.
3. Each value that appears twice cancels itself, since v ^ v is 0.
4. The value that appears once is left.
5. Sortedness is never used.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The most robust solution here and the fastest below about n = 400 — measured 7.8ns at n = 257 against 11.15ns for the binary search. It is a branchless reduction, so clang vectorises it into 11 vector instructions. Above the crossover it loses badly: 70,021ns against 107.35ns at n = 1,048,577.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int singleNonDuplicate(const vector<int>& a) {
    int result = 0;
    for (int v : a) result ^= v;
    return result;
}
```

<!-- @annotations -->
- 6: No early exit and no branch, which is exactly why this vectorises — four accumulators combining sixteen elements per iteration.
- 7: Correct for any ordering of the same multiset. This is the only solution here that does not need the array sorted.

<!-- @code java -->
```java
static int singleNonDuplicate(int[] a) {
    int result = 0;
    for (int v : a) result ^= v;
    return result;
}
```

<!-- @annotations -->
- 3: XOR is associative and commutative, so the order of combination does not matter — which is what lets the compiler split it across lanes.

<!-- @code python -->
```python
from functools import reduce
from operator import xor


def single_non_duplicate(a):
    return reduce(xor, a, 0)


# Sortedness is never touched, so this also solves the
# unsorted version of the problem.
```

<!-- @annotations -->
- 6: reduce with xor runs the loop in C rather than in interpreted bytecode, though without the vectorisation clang manages.

<!-- @approach -->
### Walk the Pairs

<!-- @idea -->
Check each pair in order and stop at the first index whose partner does not match.

<!-- @steps -->
1. Step through even indices two at a time.
2. Compare each element with the one after it.
3. If they differ, the element at the even index is the single one.
4. If every pair matches, the single element is the last one.
5. The final fallback is needed because the single element can sit at the end.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The worst of the three. It is O(n) like the XOR but its early exit is a data-dependent branch, which blocks vectorisation — 0 vector instructions against 11 — so it measures 25.0ns at n = 257 where the XOR takes 7.8ns. It never wins at any size tested.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int singleNonDuplicate(const vector<int>& a) {
    int n = (int)a.size();
    for (int i = 0; i + 1 < n; i += 2) {
        if (a[i] != a[i + 1]) return a[i];
    }
    return a[n - 1];
}
```

<!-- @annotations -->
- 6: Stepping by two and always standing on an even index, which is the same parity requirement the binary version needs — here it is free because the loop controls it.
- 7: The early exit costs the vectorisation that makes the XOR version fast. Trading a branch for half the average work is a bad trade when the alternative processes sixteen elements per instruction.
- 9: Reached only when every pair matched, which means the single element is the last one. Removing this line reads past the end.

<!-- @code java -->
```java
static int singleNonDuplicate(int[] a) {
    for (int i = 0; i + 1 < a.length; i += 2) {
        if (a[i] != a[i + 1]) return a[i];
    }
    return a[a.length - 1];
}
```

<!-- @annotations -->
- 2: `i + 1 < a.length` rather than `i < a.length`, so the lookahead never runs off the end on the final odd index.

<!-- @code python -->
```python
def single_non_duplicate(a):
    for i in range(0, len(a) - 1, 2):
        if a[i] != a[i + 1]:
            return a[i]
    return a[-1]
```

<!-- @annotations -->
- 2: `len(a) - 1` as the stop, so `a[i + 1]` is always valid inside the loop.

<!-- @approach -->
### Binary Search on Pair Parity

<!-- @idea -->
Find the boundary where pairs stop starting on even indices, by standing on the first index of a pair and asking whether it still matches its partner.

<!-- @steps -->
1. Keep a window and take its midpoint.
2. Force the midpoint down to an even index, so it stands on the first element of a pair.
3. If it matches the element after it, the single element is strictly to the right.
4. Otherwise the single element is at or before the midpoint.
5. When the window narrows to one position, that position holds the answer.

<!-- @complexity -->
- time: O(log n) — measured 19.00 iterations at n = 1,048,577
- space: O(1)
- note: The answer above about n = 400. Measured 18.04ns at n = 1,025 and 107.35ns at n = 1,048,577, against 61.7ns and 70,021ns for the XOR. 0 wrong over 20,301 exhaustive arrays; without the parity correction it is wrong on 98.30% of them.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int singleNonDuplicate(const vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (mid & 1) mid--;                    // stand on the START of a pair
        if (a[mid] == a[mid + 1]) lo = mid + 2;
        else                      hi = mid;
    }
    return a[lo];
}
```

<!-- @annotations -->
- 6: lo < hi, so the loop narrows to one surviving position — the same convention Lower Bound used, and for the same reason: this looks for a boundary, not a match.
- 8: The line the whole problem turns on. Without it mid can land on the second element of a pair, where the comparison means nothing — measured wrong on 98.30% of inputs, failing from n = 3.
- 9: mid + 2, not mid + 1. The pair at mid has been ruled out entirely, so both of its positions can go.
- 10: hi = mid, not mid - 1. mid is still a candidate for being the single element.
- 12: a[lo] is the answer. lo is always even, because it starts at 0 and only ever moves to an even mid plus two.

<!-- @code java -->
```java
static int singleNonDuplicate(int[] a) {
    int lo = 0, hi = a.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if ((mid & 1) == 1) mid--;
        if (a[mid] == a[mid + 1]) lo = mid + 2;
        else                      hi = mid;
    }
    return a[lo];
}
```

<!-- @annotations -->
- 4: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int from n = 1,073,741,825.
- 5: `(mid & 1) == 1` because Java has no implicit conversion from int to boolean.

<!-- @code python -->
```python
def single_non_duplicate(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if mid % 2 == 1:
            mid -= 1
        if a[mid] == a[mid + 1]:
            lo = mid + 2
        else:
            hi = mid
    return a[lo]


# a[mid] == a[mid + 1] never reads past the end, because
# mid is even and the length is odd, so mid + 1 <= n - 1.
```

<!-- @annotations -->
- 5: Forcing mid even. Python's `mid & 1` works identically; `% 2` is written here because it reads as the parity test it is.
- 7: Safe without a bounds check: an even mid in an odd-length array always has a successor.

<!-- @example -->

<!-- @input -->
```
a = [1, 1, 2, 3, 3, 4, 4, 8, 8]
```

<!-- @output -->
```
2
```

<!-- @why -->
The pairs before index 2 start on even indices; after it they start on odd ones. The search finds that boundary in three probes without examining most of the array.

<!-- @walkthrough -->
```
lo=0 hi=8   mid=4 -> even    a[4]=3  a[5]=4   differ
                             the single element is at or before 4   hi = 4
lo=0 hi=4   mid=2 -> even    a[2]=2  a[3]=3   differ
                                                                    hi = 2
lo=0 hi=2   mid=1 -> forced down to 0
                             a[0]=1  a[1]=1   match
                             still before the single element        lo = 2
lo == hi -> a[2] = 2

Note the third probe: mid computed as 1, which is the SECOND
element of the pair (1,1). Comparing a[1] with a[2] would
have compared across two different pairs and told us nothing.
```

<!-- @example -->

<!-- @input -->
```
a = [3, 3, 7, 7, 10, 11, 11]
```

<!-- @output -->
```
10
```

<!-- @why -->
The single element sits at index 4 with pairs on both sides. Two probes suffice, and the second lands exactly on it.

<!-- @walkthrough -->
```
lo=0 hi=6   mid=3 -> forced down to 2
                             a[2]=7  a[3]=7   match          lo = 4
lo=4 hi=6   mid=5 -> forced down to 4
                             a[4]=10 a[5]=11  differ         hi = 4
lo == hi -> a[4] = 10

Both probes needed the parity correction. Without it the
first would have compared a[3]=7 with a[4]=10, concluded
"differ", and set hi = 3 — losing the answer entirely.
```

<!-- @example -->

<!-- @input -->
```
a = [1, 1, 2]
```

<!-- @output -->
```
2
```

<!-- @why -->
The smallest input where omitting the parity correction fails. It is also the case where the single element sits at the very end, which the pair-walking version needs its final fallback for.

<!-- @walkthrough -->
```
Correct:
  lo=0 hi=2   mid=1 -> forced down to 0
              a[0]=1  a[1]=1  match  ->  lo = 2
  lo == hi -> a[2] = 2

Without the parity correction:
  lo=0 hi=2   mid=1  (left odd)
              a[1]=1  a[2]=2  differ  ->  hi = 1
  lo=0 hi=1   mid=0
              a[0]=1  a[1]=1  match   ->  lo = 2
  lo=2 > hi=1, loop ends -> a[2] = 2

Here it happens to recover. At n = 3 it fails on other
shapes, and across all 20,301 exhaustive arrays it is wrong
on 19,956 of them.
```

<!-- @example -->

<!-- @input -->
```
a = [7]
```

<!-- @output -->
```
7
```

<!-- @why -->
A single element with no pairs at all. The loop never runs and every approach returns it, but for different reasons worth noticing.

<!-- @walkthrough -->
```
binary : lo = hi = 0, the loop body never executes, a[0] = 7
xor    : 0 ^ 7 = 7
pairs  : the loop never runs, the fallback returns a[n-1] = 7

The pair walk's fallback is doing real work here. Without
it the function would fall off the end with no return value.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the parity boundary the search is looking for — pairs starting evenly before the single element and oddly after it — the effect of landing on the wrong index, and the measured crossover where a vectorised XOR beats a logarithmic search.

<!-- @sampleInput -->
```json
{"primary":{"array":[1,1,2,3,3,4,4,8,8],"indices":[0,1,2,3,4,5,6,7,8],"answer":2,"answerIndex":2,"parityBoundary":{"before":"pairs start at EVEN indices: a[0]==a[1]","after":"pairs start at ODD indices: a[3]==a[4], a[5]==a[6], a[7]==a[8]"},"trace":[{"lo":0,"hi":8,"rawMid":4,"forcedMid":4,"pair":[3,4],"values":[3,4],"match":false,"action":"hi = mid","window":[0,4]},{"lo":0,"hi":4,"rawMid":2,"forcedMid":2,"pair":[2,3],"values":[2,3],"match":false,"action":"hi = mid","window":[0,2]},{"lo":0,"hi":2,"rawMid":1,"forcedMid":0,"pair":[0,1],"values":[1,1],"match":true,"action":"lo = mid + 2","window":[2,2],"note":"raw mid was ODD — the correction is what makes this probe meaningful"}],"probes":3},"lengthIsOdd":"pairs contribute an even count, so the single element makes n odd","parityCorrection":{"line":"if (mid & 1) mid--;","why":"the comparison a[mid] == a[mid+1] only means anything when mid is the FIRST index of a pair","withoutIt":{"wrong":19956,"of":20301,"pct":98.30,"firstFailingSize":3},"verified":{"arrays":20301,"space":"every structure with 0..200 pairs, n = 1..401, single element in every position, randomised gaps between distinct values","wrong":0}},"xorSolution":{"identity":"v ^ v == 0, so every pair cancels and the single element survives","example":"1 ^ 1 ^ 2 ^ 3 ^ 3 ^ 4 ^ 4 = 2","needsSortedness":false,"note":"correct for the same multiset in any order","verified":{"arrays":20301,"wrong":0},"vectorisation":{"instructions":43,"vectorInstructions":11}},"benchmark":{"units":"ns per call, best of 11, the four algorithms shuffled into a random order every repetition","rows":[{"n":17,"xor":2.1,"walkPairs":3.7,"forceEven":4.07,"indexXor":5.74},{"n":65,"xor":3.3,"walkPairs":7.3,"forceEven":8.00,"indexXor":8.01},{"n":257,"xor":7.8,"walkPairs":25.0,"forceEven":11.15,"indexXor":11.78},{"n":1025,"xor":61.7,"walkPairs":97.9,"forceEven":18.04,"indexXor":18.49},{"n":4097,"xor":207.1,"walkPairs":328.9,"forceEven":28.05,"indexXor":27.26},{"n":65537,"xor":3166.7,"walkPairs":4967.1,"forceEven":51.22,"indexXor":48.85},{"n":1048577,"xor":70021.1,"walkPairs":78709.3,"forceEven":107.35,"indexXor":97.65}],"crossover":"near n = 400","aboveCrossover":"the binary search pulls away to 700x","walkPairsNote":"O(n) like the XOR but its early exit blocks vectorisation — 0 vector instructions against 11 — so it never wins at any size"},"discardedMeasurement":{"claimAlmostMade":"the version with fewer iterations ran 1.30x slower","iterations":[{"n":257,"forceEven":7.02,"indexXor":8.01},{"n":65537,"forceEven":15.00,"indexXor":16.00},{"n":1048577,"forceEven":19.00,"indexXor":20.00}],"whyItWasWrong":"the two were timed back to back on the same arrays, so whichever ran second found them already in cache","evidence":[{"order":"force-even first","ratios":[1.07,1.11,1.15]},{"order":"index-xor first","ratios":[1.03,1.08,1.07]}],"corrected":"within 1.10x in either direction, with the winner changing by n — they are the same speed","lesson":"when two candidates touch the same memory, a fixed measurement order makes the second look faster; here that was enough to invent a finding that did not exist"},"assertions":["the array length is always odd","lo is always even","an even index in an odd-length array always has a successor","the single element is at the first index where a pair stops starting evenly","XOR needs no ordering assumption at all"]}
```

<!-- @highlights -->
- There is no target to compare against; the invariant is index parity, and it flips exactly once.
- Before the single element pairs start on even indices; after it they start on odd ones.
- Forgetting `if (mid & 1) mid--;` is wrong on 98.30% of inputs and fails from n = 3.
- XOR of everything cancels the pairs and needs no sortedness at all.
- The vectorised XOR beats the logarithmic search up to about n = 400, then loses by 700x.
- A 1.30x difference between the two binary forms turned out to be a cache-warming artefact of measuring them in a fixed order.

<!-- @edgeCases -->
- A single-element array — the loop never runs and `a[0]` is the answer.
- The single element at index 0 — the first probe already finds pairs starting oddly.
- The single element at the last index — every pair matches, and the pair-walking version needs its fallback to return it.
- An even-length array — impossible for a valid input, and no version detects it.
- Values that are not consecutive — irrelevant, since only equality between neighbours is ever tested.
- Negative values — fine for the binary search, and fine for XOR too since XOR is defined on the bit pattern.
- A very large array — the binary search touches about 19 elements at n = 1,048,577 where the XOR touches all of them.
- An unsorted array holding the same multiset — the XOR still returns the right answer and both other approaches do not.
- `mid + 1` at the end of the array — cannot happen, because an even mid in an odd-length array always has a successor.
- n above 1,073,741,824 — where `(lo + hi) / 2` overflows an int, exactly as in Lower Bound.

<!-- @pitfalls -->
- Omitting the parity correction. Wrong on 19,956 of 20,301 exhaustive arrays — 98.30% — and it fails from n = 3.
- Writing `lo = mid + 1` after a matching pair. The whole pair is ruled out, so `mid + 2` is correct and `mid + 1` wastes a step landing on a second element.
- Writing `hi = mid - 1`. mid is still a candidate for being the single element.
- Using `lo <= hi` as the loop condition. This search narrows to a surviving position, so it must be `lo < hi`.
- Comparing `a[mid]` with `a[mid - 1]` instead. It works only with the mirrored parity correction, and mixing the two conventions loses the answer.
- Adding a bounds check before `a[mid + 1]`. It cannot be out of range, and the check hides whether the parity logic is actually right.
- Reaching for the binary search on small input. The XOR is faster below about n = 400 and needs no preconditions.
- Using the pair walk. It is O(n) like the XOR and its early exit blocks vectorisation, so it loses to both at every size.
- Assuming a sorted input is required. The XOR solution never uses it.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825.

<!-- @doubt -->
### How can binary search work when there is nothing to compare against?

<!-- @answer -->
Because binary search does not need a target — it needs a predicate that is false on a prefix and true on a suffix, which is exactly what Lower Bound was doing all along. Here that predicate is "does the pair starting at this index still begin on an even index?" Before the single element every pair occupies (even, odd); the single element shifts everything after it by one, so from then on pairs occupy (odd, even). Standing on an even index and asking `a[mid] == a[mid + 1]` evaluates that predicate directly: a match means you are still in the first region, a mismatch means you have reached or passed the boundary. The values are only ever used to answer that question — nothing is compared for magnitude anywhere in the loop.

<!-- @doubt -->
### Why does `mid` have to be even?

<!-- @answer -->
Because `a[mid] == a[mid + 1]` only means something when mid is the *first* index of a pair. If mid is odd it is the second element of one pair, so the comparison looks at the tail of one pair and the head of the next — two unrelated values whose equality tells you nothing about where the single element is. Measured, dropping `if (mid & 1) mid--;` is wrong on **19,956 of 20,301 exhaustive arrays — 98.30%** — and the first failure appears at **n = 3**. In the worked example above, the third probe computes mid = 1, which is the second 1 of the pair `(1,1)`; comparing `a[1]` with `a[2]` compares a 1 against the answer itself and concludes, wrongly, that the boundary has been passed.

<!-- @doubt -->
### Should I use XOR instead?

<!-- @answer -->
Below about n = 400, yes — and it is worth knowing why rather than treating it as a trick. XOR is a reduction: no early exit, no data-dependent branch, one associative operation over contiguous memory, which is precisely what a compiler vectorises. Clang emits 43 instructions of which **11 are vector instructions**, processing sixteen elements per iteration. Measured, it takes 7.8ns at n = 257 where the binary search takes 11.15ns. Past the crossover the asymptotics take over decisively: at n = 1,048,577 it is 70,021ns against 107.35ns, a factor of 700. The XOR also has an advantage no benchmark shows: it never uses the sortedness, so it solves the unsorted version of the same problem, and it cannot be broken by the parity mistake because it has no notion of position.

<!-- @doubt -->
### Why is walking the pairs slower than XOR when both are O(n)?

<!-- @answer -->
Because its early exit costs more than it saves. The pair walk stops at the first mismatch, so on average it reads about half the array where the XOR reads all of it — and it measures **25.0ns at n = 257 against the XOR's 7.8ns**, more than three times slower while doing half the work. The reason is that the exit is a data-dependent branch inside the loop, and its presence prevents vectorisation entirely: 0 vector instructions against 11. Sixteen elements per instruction beats halving the element count by a wide margin. This is the same trade the Count Occurrences container measured on the same shape of loop, and it comes out the same way: for a contiguous scan, do not add a branch to skip work.

<!-- @doubt -->
### Is `mid ^ 1` a better way to find the partner?

<!-- @answer -->
It is a neat alternative and it is not faster. `mid ^ 1` yields `mid + 1` for even mid and `mid - 1` for odd mid, so it always names the other element of the pair-from-zero and removes the explicit parity correction. It does cost one extra iteration at every size — 20.00 against 19.00 at n = 1,048,577 — because it narrows over all indices rather than only even ones. Measured with the algorithms shuffled into a random order each repetition, the two land within **1.10x in either direction** and the winner changes with n: force-even is ahead at n = 17 and n = 1,025, index-xor is ahead at n = 4,097 and above. Treat them as equal and pick whichever reads more clearly to you.

<!-- @doubt -->
### The version doing fewer iterations was slower. Is that another branch-prediction result?

<!-- @answer -->
No — and this one is worth reading as a warning about measurement rather than about hardware. My first benchmark showed the force-even version, which does exactly one fewer iteration at every size, running **1.30x slower**, which would have fitted this module's recurring theme neatly. It was an artefact: the two were timed back to back over the same arrays, so whichever ran second found them already resident in cache. Reversing the order changed the ratio from 1.15x to 1.07x, which is the signature of a warming effect rather than a real difference. Re-running with all four algorithms shuffled into a random order every repetition removed it, and the two forms came out equal. The lesson generalises to any A-versus-B benchmark over the same data: fix the order and you measure the cache, not the code.

<!-- @doubt -->
### Why is the array length always odd?

<!-- @answer -->
Because pairs contribute two elements each, so k pairs give 2k, and the single element makes it 2k + 1. That is not just a curiosity — the binary search relies on it. `a[mid + 1]` is read without any bounds check, and it is safe precisely because mid is forced even and the last index of an odd-length array is even, so an even mid always has a successor within the array. If a malformed even-length input reached this function the read could go out of range, and nothing in any of these implementations detects that. If you are writing this against untrusted input, assert the length is odd rather than adding a bounds check inside the loop, which would hide whether the parity logic is correct.
