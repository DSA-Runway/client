---
id: search-in-rotated-sorted-array-ii
topic: Binary Search
title: Search in rotated sorted array-II
difficulty: Medium
status: ready
prerequisites:
  - search-in-rotated-sorted-array-i
  - find-minimum-in-rotated-sorted-array
  - search-x-in-sorted-array
relatedIds:
  - search-in-rotated-sorted-array-i
  - find-minimum-in-rotated-sorted-array
  - count-occurrences-in-a-sorted-array
  - search-x-in-sorted-array
  - single-element-in-a-sorted-array
---

<!-- @summary -->
Duplicates do not break a comparison here — they break the question "which half is sorted", which stops having an answer when the two ends and the midpoint all hold the same value. The repair costs the logarithmic guarantee, and the two common ways of writing it differ by 2x in the worst case and by 30x on densely duplicated data. In that worst case a plain linear scan beats both.

<!-- @theory -->
## The problem

The same as part I — a rotated sorted array and a target — except values may
repeat. Return whether x is present.

```
a = [2, 5, 6, 0, 0, 1, 2]

x = 0  ->  true
x = 3  ->  false
```

Only presence is asked for, and that is not an arbitrary simplification: with
duplicates there may be several indices holding x, so no single index is *the*
answer.

## What duplicates actually break

Part I rested on one fact: at least one half around the midpoint is fully sorted,
and `a[lo] <= a[mid]` identifies which. With duplicates that test stops being
informative. When `a[lo]`, `a[mid]` and `a[hi]` all hold the same value, the
comparison is true — and it is true whether the left half is sorted or the wrap
is buried inside a run of identical values.

```
a = [1, 0, 1, 1, 1]      lo=0  mid=2  hi=4      a[lo] = a[mid] = a[hi] = 1
```

The test says "left half is sorted". The left half is `[1, 0, 1]`, which is not
sorted, and the 0 that the search is looking for is inside it. Part I's algorithm
discards it and returns false.

Measured over every rotation of every sorted multiset drawn from `{0,1,2}` up to
length 9, against every probe from -1 to 3 — 7,425 cases — part I's algorithm is
wrong on **120, or 1.62%**. The smallest failing input is exactly the one above:
`[1, 0, 1, 1, 1]` searching for 0.

Note what kind of failure that is. Part I is not returning the wrong index; it is
reporting a value absent that is present, which no amount of range-checking the
result will catch.

## The repair, and what it costs

When the three positions agree, there is no information to act on, so the only
safe move is to give up one position and try again:

```
if a[lo] == a[mid] == a[hi]:
    lo += 1
    hi -= 1
```

This is safe because `a[mid] != x` has already been established by the equality
check above it, so `a[lo]` and `a[hi]` are also not x and discarding them loses
nothing. It is **0 wrong** over the same 7,425 cases.

It also gives up the logarithmic bound, and that is not an artefact of this
particular repair. To distinguish `[1,1,...,1]` from `[1,...,1,0,1,...,1]` any
algorithm must find the single 0, and nothing about the array narrows down where
it is — so Ω(n) probes are required in the worst case. Measured with one 0 hidden
at a uniformly random position:

| n | mean iterations | max |
|---|---|---|
| 1,001 | 253.7 | 501 |
| 10,001 | 2,511.6 | 4,944 |
| 100,001 | 27,422.7 | 49,803 |

Linear in n, with the maximum sitting at n/2 — one shrink from each end per step.

## Two ways to write the repair, 30x apart

The other common form checks only the left end:

```
if a[lo] == a[mid]:
    lo += 1
```

It is also **0 wrong** over the 7,425 exhaustive cases, and it is much worse. Two
measurements say why.

**In the worst case it does twice the work.** On an array of all equal values it
advances one position per iteration where the two-ended form advances two:

| n | shrink left only | shrink both ends | |
|---|---|---|---|
| 1,000 | 1,000 | 500 | **2.00x** |
| 10,000 | 10,000 | 5,000 | 2.00x |
| 100,000 | 100,000 | 50,000 | 2.00x |

**On ordinary duplicated data it is far worse than 2x**, because it fires when it
does not need to. Mean iterations at n = 100,000, with values drawn from a pool of
D distinct values and then rotated:

| distinct values D | shrink both ends | shrink left only |
|---|---|---|
| 2 | 2.6 | **2,410.4** |
| 10 | 3.0 | 183.7 |
| 100 | 5.9 | 5.9 |
| 1,000 | 8.9 | 9.0 |
| 100,000 | 15.9 | 16.0 |

The difference is *when* each version concludes it has no information.
`a[lo] == a[mid]` is true whenever the left end happens to match the midpoint,
which with two distinct values is about half the time — and in most of those cases
the sortedness test would have worked perfectly well. The three-way condition
fires only when all three positions agree, which is the situation where the
information genuinely is absent. One is a test for ambiguity; the other is a test
for a coincidence that is usually harmless.

In time, at n = 100,000 with half the probes present:

| distinct values | linear scan | shrink left only | shrink both ends | |
|---|---|---|---|---|
| 2 | 18,836 | 11,923.8 | **398.1** | 29.9x |
| 10 | 20,749 | 2,307.9 | **229.0** | 10.1x |
| 100 | 24,074 | 716.0 | **233.9** | 3.1x |
| 1,000 | 23,834 | 620.1 | **319.2** | 1.9x |
| 100,000 | 29,747 | 842.8 | **373.8** | 2.3x |

Nanoseconds per query.

## In the worst case, use the linear scan

The repair makes the algorithm O(n) on adversarial input, and once that guarantee
is gone the binary search has nothing left to offer. Measured on 100,000 identical
elements with an absent target, each query using a different target so nothing can
be cached:

| | microseconds per query |
|---|---|
| linear scan | **28.90** |
| shrink both ends | 41.25 |
| shrink left only | 73.82 |

The linear scan is **1.4x faster** than the better binary version. Both are O(n)
there, but the scan's O(n) is a single sequential sweep the compiler can vectorise,
while the binary version's O(n) is 50,000 iterations each computing a midpoint and
taking an unpredictable branch. When two algorithms share a complexity class, the
one with the simpler inner loop wins.

That does not make the scan the right default — at D = 100,000 it is 29,747
nanoseconds against 373.8, a factor of 80. It makes the point that this problem's
worst case is genuinely linear, and on that input the elaborate version is the
slow way to be linear.

<!-- @intuition -->
It is tempting to read the repair as a patch — a special case bolted on to rescue a search that nearly worked. It is better understood as the algorithm admitting it has run out of input. Binary search does not need sortedness for its own sake; it needs each probe to *eliminate* something, and a probe eliminates something only when comparing it to the target says which side to keep. Three equal values at the ends and the middle is precisely the state in which a probe says nothing at all, and no cleverness recovers information that the data does not contain. Seen that way the O(n) worst case stops being a defect of the repair and becomes a property of the problem: an array that hides one distinct value among a million identical ones simply has to be searched.

<!-- @approach -->
### Linear Scan

<!-- @idea -->
Walk the array and report whether x appears.

<!-- @steps -->
1. Start at index zero.
2. Compare each element against x.
3. Return true on a match.
4. Return false after the walk ends.
5. Neither sortedness nor rotation is used, so duplicates change nothing.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The only version here whose cost does not depend on the data, and the fastest of the three on the problem's worst case — measured 28.90 microseconds against 41.25 on 100,000 identical elements, because its linear pass vectorises where the binary version's linear pass does not. It is 80x slower on ordinary data.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool search(const vector<int>& a, int x) {
    for (int v : a) {
        if (v == x) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 6: Returning a bool, not an index. With duplicates several positions may hold x, so no single index is the answer — which is why this problem asks a different question from part I.
- 8: No assumption about order, which is why this is the one version duplicates cannot break.

<!-- @code java -->
```java
static boolean search(int[] a, int x) {
    for (int v : a) {
        if (v == x) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 3: The early exit prevents vectorisation, but on the all-equal worst case it never fires and the loop runs at full speed.

<!-- @code python -->
```python
def search(a, x):
    return x in a


# `in` scans linearly in C. On the worst case for the binary
# version — every element identical — this is the fastest
# option available.
```

<!-- @annotations -->
- 2: `in` on a list is O(n) and ignores order entirely.

<!-- @approach -->
### Shrink the Left End When It Matches the Midpoint

<!-- @idea -->
Whenever the left end and the midpoint hold the same value, the sortedness test cannot be trusted, so drop the left end and retry.

<!-- @steps -->
1. Return true if the midpoint holds x.
2. If the left end equals the midpoint, advance the left end by one and start the next iteration.
3. Otherwise the two are strictly ordered, so the usual test applies.
4. If the left end is below the midpoint, the left half is sorted; keep it only if x lies in its range.
5. Otherwise the right half is sorted; keep it only if x lies in its range.

<!-- @complexity -->
- time: O(log n) typical, O(n) worst case
- space: O(1)
- note: Correct — 0 wrong over 7,425 exhaustive cases — and the worse of the two repairs. It advances one position per ambiguous step rather than two, and it fires on a mere coincidence rather than on genuine ambiguity: at n = 100,000 with two distinct values it averages **2,410.4 iterations against 2.6**.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool search(const vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return true;
        if (a[lo] == a[mid]) { lo++; continue; }   // fires far too often
        if (a[lo] < a[mid]) {
            if (a[lo] <= x && x < a[mid]) hi = mid - 1;
            else                          lo = mid + 1;
        } else {
            if (a[mid] < x && x <= a[hi]) lo = mid + 1;
            else                          hi = mid - 1;
        }
    }
    return false;
}
```

<!-- @annotations -->
- 9: Safe, because a[mid] != x was established one line above, so the discarded a[lo] cannot be x either. Safe is not the same as cheap — this fires whenever the two happen to match, which is usually not a case where information is missing.
- 10: a[lo] < a[mid] can be strict here, because the equal case was consumed by the line above. In part I the same comparison had to be <=.
- 18: false, not -1. Presence is all that can be asked once duplicates make the index ambiguous.

<!-- @code java -->
```java
static boolean search(int[] a, int x) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return true;
        if (a[lo] == a[mid]) { lo++; continue; }
        if (a[lo] < a[mid]) {
            if (a[lo] <= x && x < a[mid]) hi = mid - 1;
            else                          lo = mid + 1;
        } else {
            if (a[mid] < x && x <= a[hi]) lo = mid + 1;
            else                          hi = mid - 1;
        }
    }
    return false;
}
```

<!-- @annotations -->
- 4: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int from n = 1,073,741,825.

<!-- @code python -->
```python
def search(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x:
            return True
        if a[lo] == a[mid]:
            lo += 1
            continue
        if a[lo] < a[mid]:
            if a[lo] <= x < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if a[mid] < x <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return False
```

<!-- @annotations -->
- 7: One position per iteration. The version below gives up two, and only when both are genuinely uninformative.

<!-- @approach -->
### Shrink Both Ends Only When All Three Agree

<!-- @idea -->
Give up a position only when the two ends and the midpoint all hold the same value, which is exactly the state in which no probe can tell the halves apart — and then give up one from each end.

<!-- @steps -->
1. Return true if the midpoint holds x.
2. If the left end, the midpoint and the right end all hold the same value, no half can be identified — drop one position from each end and retry.
3. Otherwise at least one of the two ends differs from the midpoint, so the sortedness test is meaningful.
4. If the left end is at most the midpoint, the left half is sorted; keep it only if x lies in its range.
5. Otherwise the right half is sorted; keep it only if x lies in its range.

<!-- @complexity -->
- time: O(log n) typical, O(n) worst case — measured at most n/2 iterations, against n for the one-ended repair
- space: O(1)
- note: The answer. 0 wrong over 7,425 exhaustive cases, exactly **2.00x** fewer worst-case iterations than the one-ended form at every size tested, and up to **29.9x** faster in time on densely duplicated data because it only fires when information is genuinely absent.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool search(const vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return true;
        if (a[lo] == a[mid] && a[mid] == a[hi]) {   // no half can be identified
            lo++;
            hi--;
        } else if (a[lo] <= a[mid]) {               // left half is sorted
            if (a[lo] <= x && x < a[mid]) hi = mid - 1;
            else                          lo = mid + 1;
        } else {                                    // right half is sorted
            if (a[mid] < x && x <= a[hi]) lo = mid + 1;
            else                          hi = mid - 1;
        }
    }
    return false;
}
```

<!-- @annotations -->
- 8: This must come first. It establishes a[mid] != x, which is what makes discarding a[lo] and a[hi] on the next line safe.
- 9: All three positions equal is the only state where neither half can be identified. Testing just a[lo] == a[mid] fires far more often for no benefit.
- 10: Two positions per ambiguous step rather than one, which is the whole of the 2.00x in the worst case.
- 12: a[lo] <= a[mid] keeps the <= from part I. The equal case still reaches here whenever a[hi] differs, and then the left half genuinely is sorted.
- 20: false after the window empties. Every discarded region was proven not to contain x.

<!-- @code java -->
```java
static boolean search(int[] a, int x) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return true;
        if (a[lo] == a[mid] && a[mid] == a[hi]) {
            lo++;
            hi--;
        } else if (a[lo] <= a[mid]) {
            if (a[lo] <= x && x < a[mid]) hi = mid - 1;
            else                          lo = mid + 1;
        } else {
            if (a[mid] < x && x <= a[hi]) lo = mid + 1;
            else                          hi = mid - 1;
        }
    }
    return false;
}
```

<!-- @annotations -->
- 9: The two shrinks bracket the window from both sides, so the loop still terminates even though it is no longer halving.

<!-- @code python -->
```python
def search(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x:
            return True
        if a[lo] == a[mid] == a[hi]:
            lo += 1
            hi -= 1
        elif a[lo] <= a[mid]:
            if a[lo] <= x < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if a[mid] < x <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return False
```

<!-- @annotations -->
- 7: Python's chained equality says exactly what the condition means — all three positions indistinguishable.

<!-- @example -->

<!-- @input -->
```
a = [2, 5, 6, 0, 0, 1, 2], x = 0
```

<!-- @output -->
```
true
```

<!-- @why -->
Duplicates are present but the ends and midpoint differ, so every step behaves exactly as it did in part I. The repair never fires.

<!-- @walkthrough -->
```
lo=0 hi=6  mid=3  a[3]=0 == 0   ->  true

The first probe lands on it. Note that a[0]=2 and a[6]=2
are equal to each other but not to a[3], so the three-way
condition is false and no shrinking happens.
```

<!-- @example -->

<!-- @input -->
```
a = [1, 0, 1, 1, 1], x = 0
```

<!-- @output -->
```
true
```

<!-- @why -->
The smallest input where part I's algorithm fails. All three of `a[lo]`, `a[mid]` and `a[hi]` hold 1, so the sortedness test reports "left half sorted" about a left half that is not.

<!-- @walkthrough -->
```
Part I, unchanged:
  lo=0 hi=4  mid=2  a[2]=1 != 0
             a[0]=1 <= a[2]=1  ->  "left half is sorted"
             is 1 <= 0 < 1 ?   no  ->  lo = 3
  lo=3 hi=4  mid=3  a[3]=1 != 0
             a[3] <= a[3]      ->  "left half is sorted"
             is 1 <= 0 < 1 ?   no  ->  lo = 4
  lo=4 hi=4  mid=4  a[4]=1 != 0  ->  lo = 5
  -> false                                    WRONG

With the three-way repair:
  lo=0 hi=4  mid=2  a[0]=a[2]=a[4]=1  ->  lo=1, hi=3
  lo=1 hi=3  mid=2  a[2]=1 != 0
             a[1]=0 <= a[2]=1  ->  left half [0,1] sorted
             is 0 <= 0 < 1 ?   yes ->  hi = 1
  lo=1 hi=1  mid=1  a[1]=0 == 0  ->  true      correct
```

<!-- @example -->

<!-- @input -->
```
a = [1, 1, 1, 1, 1], x = 0
```

<!-- @output -->
```
false
```

<!-- @why -->
The worst case. Every probe is uninformative, so the window can only be shrunk one position from each end, and the search degrades to examining half the array.

<!-- @walkthrough -->
```
lo=0 hi=4  all three are 1  ->  lo=1, hi=3
lo=1 hi=3  all three are 1  ->  lo=2, hi=2
lo=2 hi=2  a[2]=1 != 0, all three are 1  ->  lo=3, hi=1
lo > hi -> false

Three iterations for n = 5; n/2 in general. At n = 100,000
that is 50,000 iterations and 41.25 microseconds, where a
plain linear scan takes 28.90.
```

<!-- @example -->

<!-- @input -->
```
a = [1, 1, 1, 0, 1], x = 0
```

<!-- @output -->
```
true
```

<!-- @why -->
The adversarial shape: one distinct value hidden in a run of identical ones. No probe can point at it, which is why Ω(n) is a property of the problem rather than of any particular algorithm.

<!-- @walkthrough -->
```
lo=0 hi=4  mid=2  a[0]=a[2]=a[4]=1  ->  lo=1, hi=3
lo=1 hi=3  mid=2  a[2]=1 != 0
           a[1]=1 <= a[2]=1  ->  left half sorted
           is 1 <= 0 < 1 ?   no  ->  lo = 3
lo=3 hi=3  mid=3  a[3]=0 == 0  ->  true

Scaled up, with one 0 at a uniformly random position among
100,000 ones, this shape measures 27,422.7 iterations on
average and 49,803 at worst.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the state where the sortedness test stops carrying information, the repair that gives up one position from each end, and the measured gap between the two common ways of writing it — including the case where a linear scan beats both.

<!-- @sampleInput -->
```json
{"primary":{"array":[1,0,1,1,1],"x":0,"answer":true,"whatBreaks":{"lo":0,"mid":2,"hi":4,"values":[1,1,1],"test":"a[lo] <= a[mid]","testResult":true,"claim":"left half is sorted","leftHalf":[1,0,1],"actuallySorted":false,"consequence":"part I discards the half containing the answer and returns false"},"partITrace":[{"lo":0,"hi":4,"mid":2,"value":1,"action":"left 'sorted', 0 not in [1,1) -> lo = 3"},{"lo":3,"hi":4,"mid":3,"value":1,"action":"left 'sorted', 0 not in [1,1) -> lo = 4"},{"lo":4,"hi":4,"mid":4,"value":1,"action":"lo = 5"}],"partIResult":false,"repairedTrace":[{"lo":0,"hi":4,"mid":2,"allThreeEqual":true,"action":"lo = 1, hi = 3"},{"lo":1,"hi":3,"mid":2,"value":1,"action":"left half [0,1] sorted, 0 in [0,1) -> hi = 1"},{"lo":1,"hi":1,"mid":1,"value":0,"action":"return true"}]},"partIFailureRate":{"space":"every rotation of every sorted multiset over {0,1,2}, length 1..9, probes -1..3","cases":7425,"wrong":120,"pct":1.62,"smallest":{"array":[1,0,1,1,1],"x":0,"got":false,"want":true},"failureKind":"reports a present value absent, which no range-check on the result can catch"},"whyBoolNotIndex":"with duplicates several positions may hold x, so no single index is the answer","repair":{"condition":"a[lo] == a[mid] == a[hi]","action":"lo += 1; hi -= 1","safety":"a[mid] != x was established first, so neither discarded end can be x","verified":{"cases":7425,"wrong":0}},"lowerBound":{"claim":"Omega(n) is a property of the problem, not the repair","argument":"distinguishing [1,1,...,1] from [1,...,1,0,1,...,1] requires locating a single 0 that nothing narrows down","measured":[{"n":1001,"meanIterations":253.7,"max":501},{"n":10001,"meanIterations":2511.6,"max":4944},{"n":100001,"meanIterations":27422.7,"max":49803}],"maxIsAboutHalfN":true},"twoRepairsCompared":{"worstCaseIterations":[{"n":1000,"shrinkLeft":1000,"shrinkBoth":500,"ratio":2.00},{"n":10000,"shrinkLeft":10000,"shrinkBoth":5000,"ratio":2.00},{"n":100000,"shrinkLeft":100000,"shrinkBoth":50000,"ratio":2.00}],"meanIterationsByDensity":{"n":100000,"rows":[{"distinct":2,"shrinkBoth":2.6,"shrinkLeft":2410.4},{"distinct":10,"shrinkBoth":3.0,"shrinkLeft":183.7},{"distinct":100,"shrinkBoth":5.9,"shrinkLeft":5.9},{"distinct":1000,"shrinkBoth":8.9,"shrinkLeft":9.0},{"distinct":100000,"shrinkBoth":15.9,"shrinkLeft":16.0}]},"whyTheGap":"a[lo] == a[mid] is a coincidence that is usually harmless; all three equal is genuine ambiguity","timeNs":{"n":100000,"halfPresent":true,"rows":[{"distinct":2,"linear":18836,"shrinkLeft":11923.8,"shrinkBoth":398.1,"ratio":29.9},{"distinct":10,"linear":20749,"shrinkLeft":2307.9,"shrinkBoth":229.0,"ratio":10.1},{"distinct":100,"linear":24074,"shrinkLeft":716.0,"shrinkBoth":233.9,"ratio":3.1},{"distinct":1000,"linear":23834,"shrinkLeft":620.1,"shrinkBoth":319.2,"ratio":1.9},{"distinct":100000,"linear":29747,"shrinkLeft":842.8,"shrinkBoth":373.8,"ratio":2.3}]}},"linearWinsTheWorstCase":{"setup":"100,000 identical elements, a different absent target per query so nothing can be cached","microseconds":[{"approach":"linear scan","value":28.90},{"approach":"shrink both ends","value":41.25},{"approach":"shrink left only","value":73.82}],"reading":"1.4x in favour of the scan","cause":"both are O(n) there, but the scan's O(n) is one vectorisable sequential sweep and the binary version's is 50,000 iterations with a midpoint and an unpredictable branch","caveat":"on ordinary data the scan is 80x slower — 29,747ns against 373.8"},"assertions":["a[mid] != x is established before either end is discarded","the window shrinks on every iteration, so the loop terminates","all three positions equal is the only uninformative state","the answer is a boolean because the index is not unique","the worst case is linear for any correct algorithm"]}
```

<!-- @highlights -->
- Duplicates break the question "which half is sorted", not any single comparison.
- Part I's algorithm reports a present value absent on 1.62% of duplicated inputs — smallest `[1,0,1,1,1]` searching for 0.
- The repair is safe because `a[mid] != x` is established first, so neither discarded end can be x.
- Ω(n) belongs to the problem: finding one 0 among a million 1s cannot be narrowed down, measured at 27,422.7 iterations on average at n = 100,001.
- Shrinking both ends is exactly 2.00x better in the worst case and up to 29.9x better in time on dense duplicates.
- On the worst case a plain linear scan beats both binary versions — 28.90 microseconds against 41.25.

<!-- @edgeCases -->
- All elements equal — the worst case, where the window shrinks by two per step and the search examines n/2 positions.
- All elements equal to x — found on the first probe, so the worst case needs the target to be absent.
- One distinct value hidden in a run of identical ones — the adversarial shape, measured at up to 49,803 iterations for n = 100,001.
- x present at several indices — the reason this problem returns a boolean rather than an index.
- An unrotated array with duplicates — still handled, since the sortedness test only needs one end to differ from the midpoint.
- `a[lo] == a[hi]` but both differing from `a[mid]` — not ambiguous, and the three-way condition correctly does not fire.
- A single-element array — lo, mid and hi coincide, the three-way condition is true, and the window empties in one step.
- An empty array — `hi` starts at -1 and the loop never runs.
- Rotation by zero with every element equal — indistinguishable from any other rotation, and irrelevant to the answer.
- n above 1,073,741,824 — where `(lo + hi) / 2` overflows an int, exactly as in Lower Bound.

<!-- @pitfalls -->
- Reusing part I's algorithm unchanged. It reports a present value absent on 1.62% of duplicated inputs.
- Shrinking on `a[lo] == a[mid]` alone. Correct, but it fires on a harmless coincidence — 2,410.4 iterations against 2.6 at n = 100,000 with two distinct values.
- Shrinking before testing `a[mid] == x`. The safety of discarding both ends depends on already knowing the midpoint is not the target.
- Shrinking only one end when all three agree. It halves nothing and doubles the worst case, exactly 2.00x at every size measured.
- Expecting a logarithmic guarantee. The worst case is linear for any correct algorithm, not just for this one.
- Returning an index. With duplicates several positions may hold x, which is why the problem asks only for presence.
- Writing `a[lo] < a[mid]` in the three-way version. The equal case still needs to reach the sortedness test whenever `a[hi]` differs.
- Reaching for the binary version on data that is mostly one value. At two distinct values the scan is competitive and at all-equal it wins outright.
- Assuming the repair is a rare path. At ten distinct values in 100,000 elements it still fires often enough to matter.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825.

<!-- @doubt -->
### What exactly do duplicates break?

<!-- @answer -->
The question "which half is sorted", which part I answered with `a[lo] <= a[mid]`. That test is a proxy: it assumes that if the left end is not greater than the midpoint, the wrap cannot be between them. With duplicates the wrap can be buried inside a run of identical values, so the test returns true while the left half is not sorted at all. On `[1,0,1,1,1]` the left end, midpoint and right end all hold 1; the test says the left half `[1,0,1]` is sorted, the range check rules 0 out of it, and the algorithm discards the half containing the answer. Measured over 7,425 exhaustive cases, part I's algorithm is wrong on **120 — 1.62%** — and always in the direction of reporting a present value absent, which is the failure mode no sanity check on the result will catch.

<!-- @doubt -->
### Why is it safe to throw away both ends?

<!-- @answer -->
Because the equality check has already run. The line `if (a[mid] == x) return true;` executes before the three-way condition, so by the time you reach it you know `a[mid] != x`. The condition then tells you `a[lo] == a[mid]` and `a[hi] == a[mid]`, so neither end can be x either, and discarding both loses nothing. That ordering is load-bearing: move the shrink above the equality test and you can discard the answer. It is also why the shrink is one position from each end rather than a jump — those are the only two cells you have proved anything about.

<!-- @doubt -->
### Is the O(n) worst case avoidable with a cleverer algorithm?

<!-- @answer -->
No, and the argument is short. Consider an array of n copies of 1, and the n arrays formed by changing exactly one position to 0. All n + 1 of these are valid rotated sorted arrays with duplicates, and any algorithm searching for 0 must distinguish the all-ones array from every other one. Nothing about the values seen so far narrows down where the 0 could be, so an adversary can answer "1" to any probe until only one position remains unexamined. That forces Ω(n) probes. Measured with the 0 at a uniformly random position: 27,422.7 iterations on average at n = 100,001, with a maximum of 49,803 — half the array, which is what shrinking two positions per step predicts. The repair is not what costs the guarantee; the problem is.

<!-- @doubt -->
### Both repairs are correct. Does it matter which I write?

<!-- @answer -->
Substantially. On the worst case the one-ended form does exactly twice the work — 100,000 iterations against 50,000 at n = 100,000, and exactly 2.00x at every size tested — because it gives up one position per ambiguous step instead of two. But the bigger difference shows up on ordinary duplicated data, where the two conditions fire at completely different rates. `a[lo] == a[mid]` is true whenever the left end happens to match the midpoint, which with two distinct values is roughly half the time, and in almost all of those cases the sortedness test would have worked fine. The three-way condition fires only when all three positions agree, which is the state where information genuinely is absent. Measured at n = 100,000 with two distinct values: **2,410.4 mean iterations against 2.6**, and 11,923.8 nanoseconds against 398.1 — a factor of 29.9. One version tests for ambiguity; the other tests for a coincidence.

<!-- @doubt -->
### Why does this problem return a boolean when part I returned an index?

<!-- @answer -->
Because with duplicates the index is not unique. On `[2,5,6,0,0,1,2]` searching for 0, indices 3 and 4 both qualify and neither is more correct than the other; searching for 2 gives indices 0 and 6, which are in different runs of the rotation. Part I could return an index because distinct values guarantee at most one. This is the same distinction that separated Find Minimum from Find Out How Many Times The Array Is Rotated: asking for a *value* or a *yes/no* survives duplicates, and asking for a *position* does not. If you genuinely need every position, the honest answer is that the problem is Ω(n) anyway, so scan.

<!-- @doubt -->
### Should I just use a linear scan?

<!-- @answer -->
On the worst case, yes — and that is worth knowing rather than embarrassing. With 100,000 identical elements and an absent target, the scan measures **28.90 microseconds against 41.25** for the better binary version and 73.82 for the worse one. Both are O(n) on that input, but the scan's linear pass is one sequential sweep the compiler vectorises, while the binary version's linear pass is 50,000 iterations each computing a midpoint and taking a branch it cannot predict. When two algorithms land in the same complexity class, the simpler inner loop wins. That is not a general recommendation: on 100,000 elements drawn from 100,000 distinct values the scan is 29,747 nanoseconds against 373.8, a factor of 80. The useful reading is that this problem has no good worst case, and on inputs that hit it the elaborate version is merely a slow way of being linear.
