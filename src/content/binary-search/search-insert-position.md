---
id: search-insert-position
topic: Binary Search
title: Search Insert Position
difficulty: Easy
status: ready
prerequisites:
  - lower-bound
  - search-x-in-sorted-array
  - while-loop
  - integer-overflow-and-precision-errors
relatedIds:
  - lower-bound
  - upper-bound
  - search-x-in-sorted-array
  - floor-and-ceil-in-sorted-array
  - first-and-last-occurrence
---

<!-- @summary -->
Return where x is, or where it would go — which turns out to be lower bound with a different problem statement wrapped around it. The interesting part is the version people write instead: Search X's loop with an early exit, which the distinctness guarantee makes genuinely correct, and which measures 1.14x to 2.44x slower while being wrong on 67.50% of duplicated inputs the moment that guarantee is dropped.

<!-- @theory -->
## The problem

Given a sorted array of **distinct** integers and a target x, return the index of
x if it is present, and otherwise the index where it would be inserted to keep
the array sorted.

```
a = [1, 3, 5, 6]

x = 5  ->  2     present, so its index
x = 2  ->  1     absent; 2 belongs between 1 and 3
x = 7  ->  4     larger than everything, so past the end
x = 0  ->  0
```

The two clauses look like two cases, and the whole point of this subtopic is that
they are one.

## It is lower bound

Lower bound returns the first index i with `a[i] >= x`. Read that against the two
clauses above:

- **If x is present**, the first index with `a[i] >= x` is the index holding x —
  because the values are distinct, nothing equal to x sits before it.
- **If x is absent**, the first index with `a[i] >= x` is the first element that
  is too big, which is exactly where x belongs.

One function, both clauses, no branch between them. Verified against
`std::lower_bound` over all 256 distinct sorted subsets of `{0..7}` with every
probe from -1 to 8 — **2,560 cases, 0 wrong.**

It has to be lower bound and not upper bound. Upper bound returns the first index
with `a[i] > x`, so when x is present it returns one *past* it: on `a = [0]` with
x = 0 it gives 1 where the answer is 0. Measured, upper bound is wrong on 1,024
of the 2,560 cases — precisely the 1,024 where x is present, and none of the
1,536 where it is absent.

## The other loop, and which variable to return

Most people arrive here from Search X and reuse its loop, which stops on equality
and narrows with `hi = mid - 1`. That loop already computes the insert position;
the only question is which variable holds it when the loop ends.

Measured over the same 2,560 exhaustive cases:

| what you return after the loop | wrong | |
|---|---|---|
| `lo` | 0 | 0.00% |
| `hi + 1` | 0 | 0.00% |
| `mid` | 685 | 26.76% |
| `mid + 1` | 861 | 33.63% |
| `hi` | 1,536 | **60.00%** |

`hi` is wrong on 1,536 of 2,560 — which is every single case where x is absent,
and none where it is present. That is not a coincidence. When the loop ends
without finding x, the two pointers have crossed by exactly one: **`hi == lo - 1`
on 1,536 of 1,536 failed searches, with zero exceptions.** So `hi` is off by one
every time and `hi + 1` is exactly right.

`mid` fails differently — it is whatever the last probe happened to be, which
carries no meaning once the loop has ended. On `a = [0]` with x = 1 it returns 0
where the answer is 1; on `a = [0]` with x = 2 it also returns 0.

## The early exit is legal here, and still costs

In Lower Bound the early exit was a correctness bug: stopping on an equal element
returns an arbitrary occurrence rather than the leftmost. Here the values are
**distinct**, so there is only one occurrence and stopping on it is right. The
early exit becomes a pure performance question — which makes this the cleanest
place in the module to answer it.

Nanoseconds per call, best of nine alternating runs, results fed to a volatile
sink. `iters` is the measured average number of loop iterations:

**None of the probes are present:**

| n | linear scan | Search X loop + early exit | lower bound | iters SX | iters LB |
|---|---|---|---|---|---|
| 16 | 8.66 | 5.79 | 4.02 | 4.13 | 4.06 |
| 1,024 | 164.85 | 13.90 | 10.57 | 10.00 | 10.00 |
| 1,048,576 | - | 70.18 | 61.73 | 20.00 | 20.00 |

**All of the probes are present:**

| n | linear scan | Search X loop + early exit | lower bound | iters SX | iters LB |
|---|---|---|---|---|---|
| 16 | 8.40 | 8.46 | 5.10 | 3.37 | 4.13 |
| 1,024 | 164.96 | 21.67 | 10.66 | 9.01 | 10.00 |
| 1,048,576 | - | 85.10 | 63.01 | 19.00 | 20.00 |

Read the two tables against each other at n = 1,048,576. Going from "never
present" to "always present" lets the early exit fire on every call and removes a
full iteration — 20.00 down to 19.00. The time goes **up**, from 70.18ns to
85.10ns.

Fewer iterations, more time. The saved comparison is worth a fraction of a
nanosecond; the branch it introduced costs fifteen.

And the worst case is neither extreme:

| n | 0% present | 50% present | 100% present |
|---|---|---|---|
| 16 | 5.79 | 11.17 | 8.46 |
| 1,024 | 13.90 | 24.19 | 21.67 |
| 1,048,576 | 70.18 | 85.48 | 85.10 |

A 50/50 mix is where a branch predictor has least to work with, and it is 1.93x
worse than the 0% case at n = 16. Against lower bound the early-exit loop measures
**1.14x to 2.44x slower**, worst at n = 16 with half the probes present.

One consequence worth stating plainly: at n = 16 with half the probes present, the
**linear scan beats the branchy binary search** — 8.67ns against 11.17ns. Adding
a branch to skip work made a logarithmic algorithm lose to a linear one.

## Where the early exit stops being legal

The whole argument above rests on the problem statement's word *distinct*. Drop
it and the early-exit version does not get slower — it gets wrong.

Tested exhaustively over sorted arrays of length 0 to 9 drawn from `{0, 1, 2}`,
so duplicates are everywhere, with probes from -1 to 3:

| | wrong |
|---|---|
| Search X loop + early exit, returning `lo` | 243 of 1,100 — **22.09%** |
| lower bound, no early exit | 0 of 1,100 |

Restricted to the cases where x actually appears more than once, the early-exit
version is wrong on **243 of 360 — 67.50%**. The smallest example is
`a = [0, 0, 0]` with x = 0: it returns 1, and the answer is 0.

So the choice is between one function that is correct on both inputs and faster,
and another that is correct on one input, slower on both, and fails silently when
the precondition it depends on quietly goes away. The precondition is in the
problem statement, not in the code, and nothing checks it.

<!-- @intuition -->
The problem statement describes two outcomes — found, or not found — and that framing is what sends people to Search X. It is worth noticing that the two outcomes were never really two. "The index of x" and "where x belongs" are the same sentence when the array has distinct values, because the place x belongs *is* the place x is. Lower bound was built to answer that single question and has no notion of failure at all, which is why it needs no branch to join the cases and no sentinel to signal the second one. Read this way, Search Insert Position is not a new problem with a clever solution; it is lower bound with a problem statement that hides what it is asking for.

<!-- @approach -->
### Linear Scan

<!-- @idea -->
Walk forward until an element is not smaller than x, and return where you stopped.

<!-- @steps -->
1. Start at index zero.
2. While the index is inside the array and the element there is smaller than x, advance.
3. Stop at the first element that is not smaller than x — which is x itself if x is present.
4. Return the index where the walk stopped.
5. Running off the end returns n, the correct answer for an x larger than everything.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Not competitive at any size — measured 8.66ns against 4.02ns at n = 16 and 164.85ns against 10.57ns at n = 1,024. Worth one look because the stopping condition is the problem statement, and because it beats the branchy binary search at n = 16 when half the probes are present, 8.67ns against 11.17ns.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int searchInsert(const vector<int>& a, int x) {
    int i = 0;
    while (i < (int)a.size() && a[i] < x) i++;
    return i;
}
```

<!-- @annotations -->
- 6: The bounds test comes first, so running off the end never reads a[n]. The comparison is strictly less than, so the walk stops *on* x when x is present — which is exactly the "return its index" clause.
- 7: One return for both clauses of the problem. There is no separate found case.

<!-- @code java -->
```java
static int searchInsert(int[] a, int x) {
    int i = 0;
    while (i < a.length && a[i] < x) i++;
    return i;
}
```

<!-- @annotations -->
- 3: Using <= here would step past x and return one too many for every present target.

<!-- @code python -->
```python
def search_insert(a, x):
    i = 0
    while i < len(a) and a[i] < x:
        i += 1
    return i


# The stopping rule covers both clauses at once: the first
# position not smaller than x is x's index, or x's home.
```

<!-- @annotations -->
- 3: Python stops at the first false half, so the index check protects the lookup.

<!-- @approach -->
### Search X's Loop, Returning lo

<!-- @idea -->
Reuse the loop from Search X, keep its early exit — which the distinctness guarantee makes correct — and return lo when it falls through.

<!-- @steps -->
1. Set lo to 0 and hi to n - 1, the Search X convention.
2. While lo is not past hi, take mid.
3. If the element at mid equals x, return mid — legal here because the values are distinct, so this is the only occurrence.
4. If it is smaller, move lo past mid; otherwise bring hi below mid.
5. When the loop falls through, the pointers have crossed and lo is the insert position. Return lo, not hi and not mid.

<!-- @complexity -->
- time: O(log n)
- space: O(1)
- note: Correct on all 2,560 exhaustive distinct cases, and measured 1.14x to 2.44x slower than lower bound. It is also the fragile one: over 1,100 exhaustive cases containing duplicates it is wrong on 243, and on 67.50% of the cases where x appears more than once.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// Correct only because the problem guarantees distinct values.
int searchInsert(const vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1;
        else            hi = mid - 1;
    }
    return lo;                    // not hi, and not mid
}
```

<!-- @annotations -->
- 4: The comment is load-bearing. Nothing in the code enforces distinctness, and with duplicates this returns an arbitrary occurrence rather than the leftmost.
- 6: hi is n - 1 here, the Search X convention, which is why the loop test is <= and the update is mid - 1. Mixing these with lower bound's conventions hangs or loses a candidate.
- 9: The early exit. It is legal on distinct values and it is what makes this version slower — measured 85.10ns against 70.18ns at n = 1,048,576 when it fires on every call rather than never.
- 13: lo, not hi. After a failed search hi is lo - 1 on 1,536 of 1,536 measured cases, so returning hi is wrong on every absent target — 60.00% of all cases. Returning mid is wrong on 26.76%.

<!-- @code java -->
```java
// Correct only because the problem guarantees distinct values.
static int searchInsert(int[] a, int x) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1;
        else            hi = mid - 1;
    }
    return lo;
}
```

<!-- @annotations -->
- 6: Arrays.binarySearch has this same early exit and the same restriction — it gives no guarantee about which duplicate it finds.
- 10: Returning lo. Java's Arrays.binarySearch instead returns -(insertion point) - 1 on a miss, which is the same information encoded so that a caller cannot ignore it.

<!-- @code python -->
```python
def search_insert(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x:
            return mid
        if a[mid] < x:
            lo = mid + 1
        else:
            hi = mid - 1
    return lo
```

<!-- @annotations -->
- 4: Python integers do not overflow, so (lo + hi) // 2 is safe here in a way it is not in C++ or Java.
- 5: Legal only on distinct values. With duplicates this is wrong on 67.50% of the cases where x appears more than once.
- 11: lo. Returning hi instead gives an answer that is too small by exactly one on every absent target.

<!-- @approach -->
### Lower Bound

<!-- @idea -->
Ask for the first position whose element is not smaller than x, which answers both clauses of the problem at once.

<!-- @steps -->
1. Set lo to 0 and hi to n — one past the last index, because n is a valid answer.
2. While the range holds more than one position, take mid.
3. If the element at mid is smaller than x, no position at or before mid can be the answer, so move lo past it.
4. Otherwise mid is still a candidate, so bring hi down to mid without excluding it.
5. When lo and hi meet, that position is the answer — x's index if x is present, x's home if not.

<!-- @complexity -->
- time: O(log n) — ceil(log2(n + 1)) iterations, with no early exit
- space: O(1)
- note: The fastest and the most robust at the same time. Measured 4.02ns at n = 16 and 61.73ns at n = 1,048,576, and correct on all 1,100 exhaustive cases containing duplicates where the early-exit version is wrong on 243. Carrying a pointer and a length instead of two indices is worth a further 1.07x to 1.14x.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int searchInsert(const vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < x) lo = mid + 1;
        else            hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 5: hi starts at n, not n - 1, because n is a legitimate answer meaning "past the end" — which is the x = 7 case on [1,3,5,6].
- 6: Strictly less than, paired with hi = mid below. Pairing lo <= hi with hi = mid hangs instead.
- 7: Subtracting before halving, so lo + hi never overflows. Writing (lo + hi) / 2 breaks from n = 1,073,741,825.
- 8: No equality test anywhere. That is the entire difference from the approach above, and it is why this compiles to two conditional selects rather than a data-dependent branch.
- 9: hi = mid, not mid - 1. mid is still a candidate here and discarding it is wrong.
- 11: One return covering both clauses. Present or absent, the answer is the same number computed the same way.

<!-- @code java -->
```java
static int searchInsert(int[] a, int x) {
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < x) lo = mid + 1;
        else            hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 5: No early exit and no sentinel. Java's Arrays.binarySearch cannot be used directly here because its return value for a miss is an encoded negative.

<!-- @code python -->
```python
def search_insert(a, x):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < x:
            lo = mid + 1
        else:
            hi = mid
    return lo


# bisect.bisect_left(a, x) is this function, written in C.
```

<!-- @annotations -->
- 5: The whole loop, with no case analysis. Present and absent targets take the same path and produce the answer the same way.

<!-- @example -->

<!-- @input -->
```
a = [1, 3, 5, 6], x = 5
```

<!-- @output -->
```
2
```

<!-- @why -->
5 is present at index 2, and lower bound returns it without any equality test — the first index with a[i] >= 5 is the one holding 5, because the values are distinct.

<!-- @walkthrough -->
```
lo=0 hi=4   mid=2  a[2]=5   5 >= 5   hi = 2      range [0,2)
lo=0 hi=2   mid=1  a[1]=3   3 <  5   lo = 2      range [2,2)
lo == hi -> 2

The first probe landed exactly on the answer and the loop
did not stop. It still finished in two steps, and it never
needed to know whether 5 was present.
```

<!-- @example -->

<!-- @input -->
```
a = [1, 3, 5, 6], x = 2
```

<!-- @output -->
```
1
```

<!-- @why -->
2 is absent and belongs between 1 and 3, so the answer is index 1. The loop takes the identical path shape as the present case — there is no second code path.

<!-- @walkthrough -->
```
lo=0 hi=4   mid=2  a[2]=5   5 >= 2   hi = 2      range [0,2)
lo=0 hi=2   mid=1  a[1]=3   3 >= 2   hi = 1      range [0,1)
lo=0 hi=1   mid=0  a[0]=1   1 <  2   lo = 1      range [1,1)
lo == hi -> 1

No -1, no sentinel, no "not found" branch. Absence is
reported as a position, which is the answer the problem
asked for.
```

<!-- @example -->

<!-- @input -->
```
a = [0], x = 1
```

<!-- @output -->
```
1
```

<!-- @why -->
The smallest case that separates the correct return value from the popular wrong one: the Search X loop ends here with lo = 1 and hi = 0, so returning hi gives 0 and returning mid also gives 0.

<!-- @walkthrough -->
```
Search X's loop:
  lo=0 hi=0   mid=0  a[0]=0   0 != 1, 0 < 1   lo = 1
  lo > hi, loop ends with lo = 1, hi = 0, mid = 0

  return lo   -> 1   correct
  return hi   -> 0   wrong (hi is lo - 1, always)
  return mid  -> 0   wrong (mid is just the last probe)

Lower bound's loop:
  lo=0 hi=1   mid=0  a[0]=0   0 < 1   lo = 1     range [1,1)
  lo == hi -> 1
```

<!-- @example -->

<!-- @input -->
```
a = [0, 0, 0], x = 0
```

<!-- @output -->
```
0
```

<!-- @why -->
Outside the problem's stated precondition, and the smallest input where the early-exit version breaks. Lower bound returns 0; the Search X loop stops on the middle element and returns 1.

<!-- @walkthrough -->
```
Search X's loop:
  lo=0 hi=2   mid=1  a[1]=0   equal -> return 1     WRONG

Lower bound's loop:
  lo=0 hi=3   mid=1  a[1]=0   0 >= 0   hi = 1       range [0,1)
  lo=0 hi=1   mid=0  a[0]=0   0 >= 0   hi = 0       range [0,0)
  lo == hi -> 0                                     correct

The problem guarantees distinct values, so this input is
not legal. Nothing in the early-exit code says so, and
nothing checks it.
```

<!-- @visualization custom -->

<!-- @description -->
Shows that "return its index" and "return where it belongs" are the same query answered by lower bound, then lays out the two measured failure modes of the alternative: which variable to return after Search X's loop, and what the early exit costs in time and correctness.

<!-- @sampleInput -->
```json
{"primary":{"array":[1,3,5,6],"probes":[{"x":5,"answer":2,"reason":"present — the first index with a[i] >= 5 is the one holding 5"},{"x":2,"answer":1,"reason":"absent — belongs between 1 and 3"},{"x":7,"answer":4,"reason":"past the end, and n is a valid answer"},{"x":0,"answer":0}],"trace":[{"lo":0,"hi":4,"mid":2,"value":5,"compare":"5 >= 5","action":"hi = mid","newRange":[0,2],"note":"landed on the answer and did not stop"},{"lo":0,"hi":2,"mid":1,"value":3,"compare":"3 < 5","action":"lo = mid + 1","newRange":[2,2]}],"claim":"one function answers both clauses; there is no found/not-found branch"},"itIsLowerBound":{"verified":{"against":"std::lower_bound","cases":2560,"wrong":0,"space":"all 256 distinct sorted subsets of {0..7}, probes -1..8","present":1024,"absent":1536}},"notUpperBound":{"wrong":1024,"of":2560,"pattern":"wrong on exactly the 1,024 present cases and none of the 1,536 absent ones","example":{"array":[0],"x":0,"upperBound":1,"answer":0}},"whichVariable":{"loop":"Search X's: lo <= hi, hi = mid - 1, early exit on equality","cases":2560,"rows":[{"ret":"lo","wrong":0,"pct":0.00},{"ret":"hi + 1","wrong":0,"pct":0.00},{"ret":"mid","wrong":685,"pct":26.76},{"ret":"mid + 1","wrong":861,"pct":33.63},{"ret":"hi","wrong":1536,"pct":60.00}],"invariant":{"claim":"after a failed search the pointers cross by exactly one, hi == lo - 1","holds":1536,"of":1536,"exceptions":0},"whyHiFails":"wrong on every absent case and no present one, because hi is lo - 1","whyMidFails":"mid is only the last probe and means nothing once the loop has ended","examples":[{"array":[0],"x":1,"lo":1,"hi":0,"mid":0,"answer":1},{"array":[0],"x":2,"lo":1,"hi":0,"mid":0,"answer":1}]},"earlyExit":{"legalHere":"yes — the values are distinct, so the first equal element found is the only one","contrastWithLowerBound":"there it was a correctness bug, returning an arbitrary occurrence instead of the leftmost","measured":{"units":"ns per call, best of 9, volatile sink","byPresence":[{"pct":0,"rows":[{"n":16,"scan":8.66,"sx":5.79,"lb":4.02,"itersSX":4.13,"itersLB":4.06},{"n":64,"scan":16.42,"sx":7.19,"lb":5.27,"itersSX":6.03,"itersLB":6.02},{"n":256,"scan":47.93,"sx":10.20,"lb":7.49,"itersSX":8.01,"itersLB":8.00},{"n":1024,"scan":164.85,"sx":13.90,"lb":10.57,"itersSX":10.00,"itersLB":10.00},{"n":65536,"sx":40.47,"lb":32.65,"itersSX":16.00,"itersLB":16.00},{"n":1048576,"sx":70.18,"lb":61.73,"itersSX":20.00,"itersLB":20.00}]},{"pct":50,"rows":[{"n":16,"scan":8.67,"sx":11.17,"lb":4.58,"itersSX":3.75,"itersLB":4.09},{"n":1024,"scan":165.31,"sx":24.19,"lb":10.67,"itersSX":9.51,"itersLB":10.00},{"n":1048576,"sx":85.48,"lb":59.86,"itersSX":19.50,"itersLB":20.00}]},{"pct":100,"rows":[{"n":16,"scan":8.40,"sx":8.46,"lb":5.10,"itersSX":3.37,"itersLB":4.13},{"n":1024,"scan":164.96,"sx":21.67,"lb":10.66,"itersSX":9.01,"itersLB":10.00},{"n":1048576,"sx":85.10,"lb":63.01,"itersSX":19.00,"itersLB":20.00}]}]},"headline":"at n = 1,048,576 going from 0% present to 100% present removes a full iteration (20.00 -> 19.00) and adds 15ns (70.18 -> 85.10)","worstAt":"50% present, where the branch predictor has least to work with — 11.17ns at n = 16 against 5.79ns at 0%","range":"1.14x to 2.44x slower than lower bound","scanBeatsIt":{"n":16,"pct":50,"scanNs":8.67,"sxNs":11.17,"note":"adding a branch to skip work made a logarithmic algorithm lose to a linear one"}},"duplicates":{"space":"sorted arrays length 0..9 over {0,1,2}, probes -1..3","cases":1100,"earlyExitWrong":243,"earlyExitPct":22.09,"lowerBoundWrong":0,"restrictedToRepeated":{"cases":360,"wrong":243,"pct":67.50},"smallest":{"array":[0,0,0],"x":0,"got":1,"want":0},"reading":"the precondition lives in the problem statement, not the code, and nothing checks it"},"assertions":["the result is in 0..n inclusive","every element before the result is strictly less than x","if x is present the result is its index","if x is absent the result is where x belongs","present and absent take the same code path"]}
```

<!-- @highlights -->
- "Its index" and "where it belongs" are one query, not two — lower bound answers both with no branch between them.
- It must be lower bound, not upper bound: upper bound is wrong on exactly the 1,024 present cases out of 2,560.
- After Search X's loop the answer is `lo`. Returning `hi` is wrong on 60.00% of cases — every absent target — because `hi` is `lo - 1` on all 1,536 failed searches.
- The early exit is legal here and still costs 1.14x to 2.44x, and it is worst at 50% present where the branch is least predictable.
- At n = 1,048,576 the early exit removes one iteration and adds 15 nanoseconds.
- Drop the distinctness guarantee and the same code is wrong on 67.50% of inputs where x repeats.

<!-- @edgeCases -->
- An empty array — the loop never runs and the answer is 0.
- x larger than every element — the answer is n, one past the end, and is not an error.
- x smaller than every element — the answer is 0.
- x equal to the last element — the answer is n - 1, and the neighbouring case x = last + 1 gives n.
- A single-element array — `a = [0]` with x = 1 is the smallest input that separates returning `lo` from returning `hi` or `mid`.
- Duplicates, which the problem forbids — lower bound still gives the leftmost position, and the early-exit version is wrong on 67.50% of such cases.
- Using the result as an index without checking — it can be n, and a[n] is not yours.
- Expecting -1 for an absent target. There is no such signal; absence is reported as a position.
- n above 1,073,741,824 — where (lo + hi) / 2 overflows an int, exactly as in Search X.
- An unsorted array — the loop terminates and its answer means nothing; nothing checks the precondition.

<!-- @pitfalls -->
- Returning `hi` after Search X's loop. Wrong on 60.00% of exhaustive cases — every absent target — because the pointers cross and `hi` ends at `lo - 1`.
- Returning `mid` after the loop. Wrong on 26.76%; `mid` is only the last probe and carries no meaning once the loop has ended.
- Reaching for upper bound. Wrong on exactly the cases where x is present — 1,024 of 2,560 — returning one past x's index.
- Writing two code paths, one for found and one for not found. They are the same answer, and joining them costs a branch that measures up to 2.44x.
- Keeping the early exit for speed. It removes an iteration and adds time — 70.18ns to 85.10ns at n = 1,048,576 as it goes from never firing to always firing.
- Assuming the early exit is safe because it is correct here. It is correct only because the values are distinct, and that guarantee is in the problem statement rather than the code.
- Reusing this function on an array with duplicates. The lower-bound form is still right; the early-exit form is wrong on 67.50% of cases where x repeats.
- Treating the result as an index. It ranges over 0 to n, and n means x belongs past the end.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825.
- Calling Java's `Arrays.binarySearch` and using its return value directly. On a miss it returns `-(insertion point) - 1`, not the insertion point.

<!-- @doubt -->
### Is this really just lower bound?

<!-- @answer -->
Yes, and the reason is the word *distinct* in the problem statement. Lower bound returns the first index with `a[i] >= x`. If x is present, nothing equal to x sits before it, so that first index is x's own index — the "return its index" clause. If x is absent, that first index is the first element too big to be x, which is where x belongs — the "return the insertion point" clause. One computation, both clauses. Verified against `std::lower_bound` over 2,560 exhaustive cases with 0 wrong. It cannot be upper bound, which returns one past a present x and is wrong on exactly the 1,024 present cases.

<!-- @doubt -->
### I already have Search X's loop. What do I return when it does not find x?

<!-- @answer -->
`lo`, and nothing else. Measured over the same 2,560 exhaustive cases: `lo` is wrong 0 times, `hi + 1` is wrong 0 times, `mid` is wrong 685 times (26.76%), `mid + 1` is wrong 861 times (33.63%), and `hi` is wrong 1,536 times (60.00%). The pattern behind `hi` is exact — it fails on every absent target and no present one, because the loop always ends with the pointers crossed by one: `hi == lo - 1` on 1,536 of 1,536 failed searches, zero exceptions. `mid` fails for a different reason: it is whichever position the last probe happened to hit, which stops meaning anything once the loop has ended. On `a = [0]` with x = 1 the loop ends with lo = 1, hi = 0, mid = 0 — so `lo` gives 1 and both of the others give 0.

<!-- @doubt -->
### The early exit was a bug in Lower Bound. Why is it allowed here?

<!-- @answer -->
Because the arrays are distinct. Lower bound must return the *leftmost* index with `a[i] >= x`, so stopping at the first equal element it happens to probe returns an arbitrary occurrence — on `[1,3,3,5,8]` with x = 3 it can return 2 where the answer is 1. Here the problem guarantees there is at most one occurrence, so "an arbitrary occurrence" and "the leftmost occurrence" are the same index and the early exit is genuinely correct. Verified on all 2,560 distinct exhaustive cases with 0 wrong. That is what makes this the clean place to ask the performance question separately from the correctness one — and the performance answer is still no.

<!-- @doubt -->
### If the early exit is correct, why not keep it?

<!-- @answer -->
Because it removes work and adds time. At n = 1,048,576, going from a workload where no probe is present to one where every probe is present lets the exit fire on every call and drops the average iteration count from 20.00 to 19.00 — and the measured time rises from 70.18ns to 85.10ns. The saved comparison is worth a fraction of a nanosecond; the data-dependent branch it introduces costs fifteen. The worst case is neither extreme but the 50/50 mix, where the predictor has least to work with: 11.17ns at n = 16 against 5.79ns with no present probes. Across every size and mix tested it runs 1.14x to 2.44x slower than lower bound. This is the same effect Search X measured at 2.4x to 7.3x, isolated here with correctness held constant.

<!-- @doubt -->
### What happens if the array has duplicates after all?

<!-- @answer -->
The lower-bound version keeps working and the early-exit version starts failing silently. Tested exhaustively over sorted arrays of length 0 to 9 drawn from `{0,1,2}` with probes from -1 to 3 — 1,100 cases — lower bound is wrong 0 times and the early-exit form is wrong 243 times, 22.09%. Restricted to the 360 cases where x actually appears more than once, it is wrong on 243 of them: **67.50%**. The smallest failing input is `a = [0,0,0]` with x = 0, where it returns 1 and the answer is 0. Nothing about this is loud — no crash, no sentinel, just a plausible index that is off. The guarantee the code depends on is written in the problem statement, and the code never checks it.

<!-- @doubt -->
### Should I use a linear scan for small arrays?

<!-- @answer -->
No, though there is one measured case that makes the question worth asking. Against lower bound the scan loses everywhere: 8.66ns against 4.02ns at n = 16, and 164.85ns against 10.57ns at n = 1,024. But against the *branchy* binary search it wins at n = 16 when half the probes are present — 8.67ns against 11.17ns. That is worth sitting with: adding a branch to skip work made a logarithmic algorithm lose to a linear one at a size where it should have been comfortably ahead. The fix is not to switch to the scan, it is to drop the branch.

<!-- @doubt -->
### Can I call the standard library instead?

<!-- @answer -->
In C++ and Python, yes, and you should. `std::lower_bound(a.begin(), a.end(), x) - a.begin()` and `bisect.bisect_left(a, x)` are exactly this function. Java is the exception: `Arrays.binarySearch` has the early exit, gives no guarantee about which duplicate it returns, and on a miss returns `-(insertion point) - 1` rather than the insertion point — so you would write `int r = Arrays.binarySearch(a, x); return r >= 0 ? r : -r - 1;`. That encoding is arguably better design than returning a bare position, since a caller cannot silently mistake a miss for a hit, but it does mean you cannot use the return value directly.
