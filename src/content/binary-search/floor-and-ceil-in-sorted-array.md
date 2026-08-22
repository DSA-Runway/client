---
id: floor-and-ceil-in-sorted-array
topic: Binary Search
title: Floor and Ceil in Sorted Array
difficulty: Easy
status: ready
prerequisites:
  - lower-bound
  - upper-bound
  - search-insert-position
  - integer-overflow-and-precision-errors
relatedIds:
  - lower-bound
  - upper-bound
  - search-insert-position
  - first-and-last-occurrence
  - count-occurrences-in-a-sorted-array
---

<!-- @summary -->
Floor is the largest element at most x, ceil is the smallest element at least x — which is upper bound minus one and lower bound exactly, with one guard each that fires on 22.74% of inputs. The measured surprise is the shortcut: getting both from a single descent has fewer branches than doing two descents and runs 2.28x slower on mixed data, because the one branch it adds is "is x present" — the only genuinely unpredictable question in the problem.

<!-- @theory -->
## The problem

Given a sorted array and a value x:

- **floor(x)** is the largest element that is at most x
- **ceil(x)** is the smallest element that is at least x

Either can fail to exist. Both are values, not indices.

```
a = [3, 4, 4, 7, 8, 10]

x = 5   ->  floor 4,  ceil 7
x = 4   ->  floor 4,  ceil 4      x is present, so both are x
x = 2   ->  no floor, ceil 3      nothing is <= 2
x = 12  ->  floor 10, no ceil     nothing is >= 12
```

## Both are bounds you already have

Ceil is lower bound, read as a value instead of a position. Lower bound returns
the first index with `a[i] >= x`, and the smallest element that is at least x is
the element sitting at that index:

```
ceil  = a[lowerBound(x)]        when lowerBound(x) < n
```

Floor is upper bound minus one. Upper bound returns the first index with
`a[i] > x`, so the position just before it holds the last element that is *not*
greater than x — which is the largest element at most x:

```
floor = a[upperBound(x) - 1]    when upperBound(x) > 0
```

Verified against a brute-force reference over every sorted array of length 0 to
10 drawn from `{0,1,2,3}` with every probe from -1 to 4 — **6,006 cases, 0
wrong.**

## Floor is upper bound minus one, not lower bound minus one

This is the single most tempting substitution here, and it is wrong in an
extremely clean way. `a[lowerBound(x) - 1]` is the last element strictly *less*
than x, which is a different thing from the last element *at most* x — and the
two differ exactly when x is present.

Measured over the same 6,006 cases, `a[lowerBound(x) - 1]` as floor is wrong on
**2,860 — 47.62%.** Every single one of those 2,860 failures is a case where x is
present, and it fails on **100% of the 2,860 present cases**. The smallest
example is `a = [0]` with x = 0: lower bound is 0, so `lower - 1` is -1 and the
guard reports no floor at all, when the floor is plainly 0.

Symmetrically, using upper bound for ceil gives the first element strictly
greater than x, which skips x itself. The pairing is not arbitrary: **ceil keeps
equal elements, so it uses the bound that keeps them; floor keeps equal elements
too, so it uses the bound that pushes past them and steps back one.**

## The guards are most of the work

Both formulas have a precondition, and neither is rare. Over the 6,006 exhaustive
cases:

| | how often |
|---|---|
| no floor exists — x is below everything | 1,366 — **22.74%** |
| no ceil exists — x is above everything | 1,366 — **22.74%** |
| floor equals ceil — x is present | 2,860 — 47.62% |

Nearly a quarter of inputs make one of the two answers not exist. A version that
handles only the general case is wrong on a fifth of its inputs, not on an
exotic edge.

What happens when you omit a guard depends on the language, and the two failures
are opposites.

**Omitting the ceil guard** means evaluating `a[l]` when `l == n`. In Python that
raises `IndexError` — measured on **1,366 of 1,366** such cases, 100.00%. It is
impossible to miss.

**Omitting the floor guard** means evaluating `a[u - 1]` when `u == 0`, which is
`a[-1]`. Python does not raise: negative indices wrap, so it returns the **last
element of the array**. Measured, it silently returned a value on **1,360 of
1,366** such cases — 99.56%. The six exceptions are the empty array, where `a[-1]`
does raise.

```
a = [0], x = -1     no floor exists
                    unguarded a[-1] returns 0

a = [1], x = 0      no floor exists
                    unguarded a[-1] returns 1
```

Look at what that returns: a "floor" of -1 reported as 0 — a number *larger* than
x. The answer is not merely wrong, it violates the definition, and it is a real
value drawn from the array, so it survives eyeballing and it survives most tests.

In C++ both `a[-1]` and `a[n]` are undefined behaviour, and undefined behaviour is
not a guarantee of a crash. Observed on this build: reading `p[-1]` on a heap
vector returned a value on **2,000 of 2,000** trials without ever faulting, and on
`[2,4,6,8]` both `p[-1]` and `p[4]` read as 0. None of the 2,000 values satisfied
`<= x`, so this particular garbage would fail a sanity check — but nothing in the
code performs one. (An AddressSanitizer build timed out on this machine, so there
is no sanitizer evidence here either way.)

So: the loud failure is the one you will find, and the silent failure is the one
that ships.

## The one-descent shortcut, and why it is not free

Since `floor == ceil == x` whenever x is present, one lower bound seems to be
enough for both answers:

```
l = lowerBound(x)
ceil  = a[l]                     if l < n
floor = a[l]                     if l < n and a[l] == x
        a[l - 1]                 otherwise, if l > 0
```

It is correct — 0 wrong over the same 6,006 exhaustive cases — and it does half
the searching. Measured against the two-bound version, in nanoseconds per call:

| n | two bounds | one descent | one / two |
|---|---|---|---|
| 16 | 14.28 | 9.76 | **0.68x** |
| 1,024 | 40.99 | 25.28 | **0.62x** |
| 1,048,576 | 172.41 | 113.09 | **0.66x** |

A 1.5x win. Except that table was measured with **no probe present in the array**.
Here is the same comparison with half the probes present:

| n | two bounds | one descent | one / two |
|---|---|---|---|
| 16 | 14.38 | 23.13 | **1.61x** |
| 1,024 | 39.88 | 44.69 | **1.12x** |
| 1,048,576 | 177.59 | 147.02 | 0.83x |

The shortcut went from 1.5x faster to 1.6x slower, and the two-bound version did
not move at all — 14.28, 14.38, 14.48 at n = 16 across zero, half, and all probes
present.

The cause is not the amount of work. To confirm that, hold the *queries* fixed
and change only their **order** — the same multiset, grouped by presence versus
shuffled:

| n | one descent, grouped | shuffled | | two bounds, grouped | shuffled | |
|---|---|---|---|---|---|---|
| 16 | 10.18 | 23.18 | **2.28x** | 14.38 | 14.39 | 1.00x |
| 256 | 17.92 | 37.74 | 2.11x | 29.11 | 29.18 | 1.00x |
| 1,024 | 23.72 | 44.69 | 1.88x | 39.82 | 40.25 | 1.01x |

Identical work, identical results, 2.28x apart. That is branch prediction and
nothing else.

The generated ARM64 makes the mechanism plain, and it is not the one you would
guess:

| | instructions | conditional selects | conditional branches |
|---|---|---|---|
| two bounds | 42 | 4 | 5 |
| one descent | 32 | 6 | **4** |

The shortcut has *fewer* instructions and *fewer* branches, and loses. What
matters is not how many branches there are but whether they can be predicted. The
two-bound version's branches are loop back-edges and the two boundary guards —
all overwhelmingly one-sided. The shortcut adds `a[l] == x`, which asks **"is x
present?"** — precisely the question the workload was designed to make a coin
flip.

At large n the shortcut wins again even on mixed data (0.83x at n = 1,048,576),
because by then the saved descent costs more than one mispredict. The crossover
sits near n = 65,536.

The practical reading: the two-bound version's cost does not depend on your data,
and the shortcut's does. Reach for the shortcut when you know your workload is
skewed, and default to two bounds when you do not.

<!-- @intuition -->
The pull here is to treat floor and ceil as two searches for two things, and they are not — they are two readings of one boundary. Every x, present or not, splits a sorted array at exactly one place: everything at or before the split is at most x, everything after is greater. Floor is the value immediately left of that split and ceil is the value immediately right of it. That is why the guards exist and why they are not edge cases: the split can sit at either end of the array, and when it does, one side of it is empty. Seeing it as one split rather than two searches also explains the pairing that trips people up — floor and ceil both want to *include* elements equal to x, so floor has to use the boundary that already stepped past them and walk back one, while ceil uses the boundary that stopped in front of them.

<!-- @approach -->
### Linear Scan

<!-- @idea -->
Walk forward keeping the last element that was at most x, and stop at the first element that is at least x.

<!-- @steps -->
1. Start with no floor and no ceil recorded.
2. Walk the array from the front.
3. Every element at most x overwrites the floor.
4. The first element at least x is the ceil — record it and stop.
5. Both tests run on every element, because an element equal to x satisfies both and is the answer to both.
6. Whatever was never recorded does not exist.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The definitions written out directly, and never competitive — measured 16.06ns against 14.28ns at n = 16 and 287.65ns against 40.99ns at n = 1,024. It is worth writing once because the loop makes obvious what the binary versions hide: the two answers straddle a single split point.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

struct FloorCeil { bool hasFloor, hasCeil; int floorVal, ceilVal; };

FloorCeil floorCeil(const vector<int>& a, int x) {
    FloorCeil r{false, false, 0, 0};
    for (int v : a) {
        if (v <= x) { r.hasFloor = true; r.floorVal = v; }
        if (v >= x) { r.hasCeil  = true; r.ceilVal  = v; break; }
    }
    return r;
}
```

<!-- @annotations -->
- 4: Returning presence flags rather than a -1 sentinel. If the array can contain -1, a sentinel cannot distinguish "the floor is -1" from "there is no floor".
- 9: Overwriting rather than keeping the first match — the floor is the *last* element at most x, so every qualifying element replaces the previous one.
- 10: `if`, not `else`. An element equal to x satisfies both tests and is the answer to both, so making this an else drops the ceil on every present x — measured wrong on 143 of 482 test cases. The break is also load-bearing: the first element at least x is the ceil, and nothing after it can be smaller.

<!-- @code java -->
```java
static OptionalInt[] floorCeil(int[] a, int x) {
    OptionalInt f = OptionalInt.empty(), c = OptionalInt.empty();
    for (int v : a) {
        if (v <= x) f = OptionalInt.of(v);
        if (v >= x) { c = OptionalInt.of(v); break; }
    }
    return new OptionalInt[] { f, c };
}
```

<!-- @annotations -->
- 2: OptionalInt rather than a magic number, for the same reason: absence and a legitimate value must not share an encoding.
- 5: Two independent ifs, not if/else — a present x is both the floor and the ceil.

<!-- @code python -->
```python
def floor_ceil(a, x):
    floor_val = ceil_val = None
    for v in a:
        if v <= x:
            floor_val = v
        if v >= x:
            ceil_val = v
            break
    return floor_val, ceil_val
```

<!-- @annotations -->
- 2: None rather than -1. Python makes the right choice cheap here, and -1 is a real array value in many inputs.
- 6: A separate if rather than an else. When v equals x both branches must fire, because x is simultaneously its own floor and its own ceil.

<!-- @approach -->
### Track the Best Candidate

<!-- @idea -->
Run two binary searches, each remembering the best qualifying element it has seen and continuing to look for a better one.

<!-- @steps -->
1. For the floor, search for an element at most x. Whenever the midpoint qualifies, record it and move right to look for a larger one.
2. When the midpoint is too big, move left.
3. For the ceil, mirror it: whenever the midpoint is at least x, record it and move left to look for a smaller one.
4. When the midpoint is too small, move right.
5. Anything never recorded does not exist — the recording itself is the guard.

<!-- @complexity -->
- time: O(log n), two descents
- space: O(1)
- note: Correct on all 6,006 exhaustive cases and the version most courses teach, because it needs no separate guard. Measured 1.11x to 1.23x slower than the two-bound form at every size and every workload — the extra cost is the conditional write inside each loop.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

struct FloorCeil { bool hasFloor, hasCeil; int floorVal, ceilVal; };

FloorCeil floorCeil(const vector<int>& a, int x) {
    FloorCeil r{false, false, 0, 0};
    int n = (int)a.size();

    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] <= x) { r.hasFloor = true; r.floorVal = a[mid]; lo = mid + 1; }
        else hi = mid - 1;
    }

    lo = 0; hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= x) { r.hasCeil = true; r.ceilVal = a[mid]; hi = mid - 1; }
        else lo = mid + 1;
    }
    return r;
}
```

<!-- @annotations -->
- 10: hi is n - 1 here, the Search X convention, paired with lo <= hi and mid - 1. This form needs that pairing because it never returns an index.
- 13: Recording *and* moving right. Recording without advancing loops forever; advancing without recording loses the answer.
- 14: No record on this branch, which is what makes "never recorded" mean "does not exist" — the guard is built into the control flow rather than written afterwards.
- 20: The mirror image: qualify, record, then move left because a smaller qualifying element may still exist.

<!-- @code java -->
```java
static OptionalInt[] floorCeil(int[] a, int x) {
    OptionalInt f = OptionalInt.empty(), c = OptionalInt.empty();
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] <= x) { f = OptionalInt.of(a[mid]); lo = mid + 1; }
        else hi = mid - 1;
    }
    lo = 0; hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= x) { c = OptionalInt.of(a[mid]); hi = mid - 1; }
        else lo = mid + 1;
    }
    return new OptionalInt[] { f, c };
}
```

<!-- @annotations -->
- 5: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int from n = 1,073,741,825.
- 6: Allocating an OptionalInt inside the loop costs more than the comparison it guards. For hot code return a primitive pair and a presence flag instead.

<!-- @code python -->
```python
def floor_ceil(a, x):
    floor_val = ceil_val = None
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] <= x:
            floor_val = a[mid]
            lo = mid + 1
        else:
            hi = mid - 1
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] >= x:
            ceil_val = a[mid]
            hi = mid - 1
        else:
            lo = mid + 1
    return floor_val, ceil_val
```

<!-- @annotations -->
- 5: Python integers do not overflow, so (lo + hi) // 2 is safe here in a way it is not in C++ or Java.
- 7: The record-then-advance pair. Forgetting the advance on this branch hangs the loop.

<!-- @approach -->
### Lower Bound and Upper Bound

<!-- @idea -->
Ceil is the element at the lower bound; floor is the element one before the upper bound. Two calls and two guards.

<!-- @steps -->
1. Compute the upper bound of x — the first index holding something greater than x.
2. If it is greater than zero, the element just before it is the floor. Otherwise there is no floor.
3. Compute the lower bound of x — the first index holding something at least x.
4. If it is less than n, the element there is the ceil. Otherwise there is no ceil.
5. Return both, each with its own presence flag.

<!-- @complexity -->
- time: O(log n), two descents
- space: O(1)
- note: The robust default. Measured 14.28ns at n = 16 and 172.41ns at n = 1,048,576, and — the point — flat across workloads: 14.28, 14.38, 14.48 at n = 16 as the fraction of present probes goes from none to half to all. The one-descent shortcut is faster on skewed data and 1.61x slower on mixed data.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

struct FloorCeil { bool hasFloor, hasCeil; int floorVal, ceilVal; };

FloorCeil floorCeil(const vector<int>& a, int x) {
    FloorCeil r{false, false, 0, 0};
    int n = (int)a.size();

    int u = (int)(upper_bound(a.begin(), a.end(), x) - a.begin());
    if (u > 0) { r.hasFloor = true; r.floorVal = a[u - 1]; }

    int l = (int)(lower_bound(a.begin(), a.end(), x) - a.begin());
    if (l < n) { r.hasCeil = true; r.ceilVal = a[l]; }

    return r;
}
```

<!-- @annotations -->
- 11: upper_bound, not lower_bound. Using lower_bound here is wrong on 100% of the cases where x is present — 2,860 of 6,006 exhaustive cases — because it steps back past x itself.
- 12: The guard is not optional. It fires on 22.74% of inputs, and without it a[u - 1] is a[-1] — undefined behaviour in C++, and in Python the last element of the array.
- 14: lower_bound, not upper_bound. Upper bound skips x itself, so a present x would report the next larger element as its own ceil.
- 15: The mirror guard, firing on the same 22.74% at the other end. Without it this reads a[n].

<!-- @code java -->
```java
static OptionalInt[] floorCeil(int[] a, int x) {
    int n = a.length;
    int u = upperBound(a, x);
    int l = lowerBound(a, x);
    OptionalInt f = (u > 0) ? OptionalInt.of(a[u - 1]) : OptionalInt.empty();
    OptionalInt c = (l < n) ? OptionalInt.of(a[l])     : OptionalInt.empty();
    return new OptionalInt[] { f, c };
}
```

<!-- @annotations -->
- 3: Java has no upperBound in the standard library — Arrays.binarySearch gives no guarantee about which duplicate it finds, so both bounds have to be written by hand.
- 5: Guarding before indexing rather than after. Java would throw ArrayIndexOutOfBoundsException here, which is at least loud; the guard is still what makes the absence an answer rather than an exception.

<!-- @code python -->
```python
from bisect import bisect_left, bisect_right


def floor_ceil(a, x):
    u = bisect_right(a, x)
    l = bisect_left(a, x)
    floor_val = a[u - 1] if u > 0 else None
    ceil_val = a[l] if l < len(a) else None
    return floor_val, ceil_val
```

<!-- @annotations -->
- 5: bisect_right is upper bound and bisect_left is lower bound. Swapping the two silently returns the wrong answer for every present x rather than raising anything.
- 7: The `if u > 0` is the guard that matters most. Without it Python wraps a[-1] to the last element and silently returns a value on 99.56% of the cases where no floor exists.
- 8: This guard's absence raises IndexError on 100% of the cases where no ceil exists, which is why it is the one people remember to write.

<!-- @example -->

<!-- @input -->
```
a = [3, 4, 4, 7, 8, 10], x = 5
```

<!-- @output -->
```
floor = 4, ceil = 7
```

<!-- @why -->
5 is absent. The largest element at most 5 is the second 4, and the smallest at least 5 is 7. Both guards pass, so this is the case every implementation gets right.

<!-- @walkthrough -->
```
upperBound(5):
  lo=0 hi=6  mid=3  a[3]=7   7 <= 5? no    hi = 3
  lo=0 hi=3  mid=1  a[1]=4   4 <= 5? yes   lo = 2
  lo=2 hi=3  mid=2  a[2]=4   4 <= 5? yes   lo = 3
  u = 3   ->  u > 0, so floor = a[2] = 4

lowerBound(5):
  lo=0 hi=6  mid=3  a[3]=7   7 <  5? no    hi = 3
  lo=0 hi=3  mid=1  a[1]=4   4 <  5? yes   lo = 2
  lo=2 hi=3  mid=2  a[2]=4   4 <  5? yes   lo = 3
  l = 3   ->  l < 6, so ceil = a[3] = 7

The two descents land on the same index 3 because 5 is
absent — that single split has floor on its left and ceil
on its right.
```

<!-- @example -->

<!-- @input -->
```
a = [3, 4, 4, 7, 8, 10], x = 4
```

<!-- @output -->
```
floor = 4, ceil = 4
```

<!-- @why -->
4 is present, so it is simultaneously the largest element at most 4 and the smallest at least 4. This is the case where using lower_bound for the floor breaks.

<!-- @walkthrough -->
```
upperBound(4) = 3   ->  floor = a[2] = 4      correct
lowerBound(4) = 1   ->  ceil  = a[1] = 4      correct

If floor had been written as a[lowerBound(4) - 1]:
  lowerBound(4) = 1  ->  a[0] = 3             WRONG

3 is the largest element strictly BELOW 4, which is a
different question. Measured, that substitution is wrong
on 100% of cases where x is present.
```

<!-- @example -->

<!-- @input -->
```
a = [3, 4, 4, 7, 8, 10], x = 2
```

<!-- @output -->
```
no floor, ceil = 3
```

<!-- @why -->
Nothing in the array is at most 2, so the floor does not exist and the guard has to fire. Roughly a quarter of inputs look like this at one end or the other.

<!-- @walkthrough -->
```
upperBound(2):
  lo=0 hi=6  mid=3  a[3]=7   7 <= 2? no    hi = 3
  lo=0 hi=3  mid=1  a[1]=4   4 <= 2? no    hi = 1
  lo=0 hi=1  mid=0  a[0]=3   3 <= 2? no    hi = 0
  u = 0   ->  u > 0 is false, so there is NO floor

lowerBound(2) = 0   ->  0 < 6, ceil = a[0] = 3

Without the guard, a[u - 1] is a[-1]. In C++ that reads
memory before the array; in Python it returns 10, the last
element — a "floor" of 2 reported as 10.
```

<!-- @example -->

<!-- @input -->
```
a = [], x = 7
```

<!-- @output -->
```
no floor, no ceil
```

<!-- @why -->
The empty array is the one input where both guards fire at once, and the only case where Python's unguarded floor also raises instead of returning a wrong value.

<!-- @walkthrough -->
```
upperBound(7) = 0   ->  no floor
lowerBound(7) = 0   ->  0 < 0 is false, no ceil

Both bounds return 0 because there are no positions to
choose between. Of the 1,366 exhaustive cases with no
floor, this is the only shape where the unguarded a[-1]
raises rather than silently returning the last element —
it accounts for the 6 cases out of 1,366 that fail loudly.
```

<!-- @visualization custom -->

<!-- @description -->
Shows floor and ceil as two readings of one split point, then the two measured traps: using lower_bound for the floor, which fails on exactly the present cases, and the one-descent shortcut, which has fewer branches than two descents and loses 2.28x on interleaved data.

<!-- @sampleInput -->
```json
{"primary":{"array":[3,4,4,7,8,10],"probes":[{"x":5,"floor":4,"ceil":7,"note":"absent — floor and ceil straddle the split"},{"x":4,"floor":4,"ceil":4,"note":"present — both answers are x"},{"x":2,"floor":null,"ceil":3,"note":"no floor; the guard fires"},{"x":12,"floor":10,"ceil":null,"note":"no ceil"}],"trace":{"x":5,"upperBound":[{"lo":0,"hi":6,"mid":3,"value":7,"test":"7 <= 5","result":false,"action":"hi = 3"},{"lo":0,"hi":3,"mid":1,"value":4,"test":"4 <= 5","result":true,"action":"lo = 2"},{"lo":2,"hi":3,"mid":2,"value":4,"test":"4 <= 5","result":true,"action":"lo = 3"}],"u":3,"floorFrom":"a[2] = 4","lowerBound":[{"lo":0,"hi":6,"mid":3,"value":7,"test":"7 < 5","result":false,"action":"hi = 3"},{"lo":0,"hi":3,"mid":1,"value":4,"test":"4 < 5","result":true,"action":"lo = 2"},{"lo":2,"hi":3,"mid":2,"value":4,"test":"4 < 5","result":true,"action":"lo = 3"}],"l":3,"ceilFrom":"a[3] = 7"}},"identities":{"ceil":"a[lowerBound(x)] when lowerBound(x) < n","floor":"a[upperBound(x) - 1] when upperBound(x) > 0","verified":{"against":"brute force","cases":6006,"wrong":0,"space":"every sorted array of length 0..10 over {0,1,2,3}, probes -1..4"}},"wrongBoundForFloor":{"substitution":"a[lowerBound(x) - 1]","wrong":2860,"of":6006,"pct":47.62,"pattern":"every failure is a present-x case, and it fails on 100% of the 2,860 present cases","smallest":{"array":[0],"x":0,"gives":"no floor","correct":0},"reason":"lower bound - 1 is the last element strictly less than x, not the last element at most x"},"guards":{"noFloor":{"count":1366,"pct":22.74},"noCeil":{"count":1366,"pct":22.74},"floorEqualsCeil":{"count":2860,"pct":47.62},"omittedFloorGuard":{"python":{"behaviour":"a[-1] wraps to the last element","silentlyReturnedAValue":1360,"of":1366,"pct":99.56,"exceptions":"the 6 empty-array cases, where a[-1] does raise"},"cpp":{"behaviour":"undefined","observed":"p[-1] returned a value on 2,000 of 2,000 trials without faulting; on [2,4,6,8] both p[-1] and p[4] read as 0","satisfiedLeqX":0,"asan":"build timed out on this machine — no sanitizer evidence either way"},"examples":[{"array":[0],"x":-1,"unguardedReturns":0,"note":"a floor of -1 reported as 0, a value larger than x"},{"array":[1],"x":0,"unguardedReturns":1}]},"omittedCeilGuard":{"python":{"behaviour":"IndexError","raised":1366,"of":1366,"pct":100.00}},"reading":"the loud failure is the one you find; the silent failure is the one that ships"},"oneDescentShortcut":{"rule":"l = lowerBound(x); ceil = a[l]; floor = a[l] if a[l] == x else a[l-1]","correct":{"cases":6006,"wrong":0},"byWorkload":[{"pct":0,"rows":[{"n":16,"two":14.28,"one":9.76,"ratio":0.68},{"n":1024,"two":40.99,"one":25.28,"ratio":0.62},{"n":1048576,"two":172.41,"one":113.09,"ratio":0.66}]},{"pct":50,"rows":[{"n":16,"two":14.38,"one":23.13,"ratio":1.61},{"n":1024,"two":39.88,"one":44.69,"ratio":1.12},{"n":1048576,"two":177.59,"one":147.02,"ratio":0.83}]},{"pct":100,"rows":[{"n":16,"two":14.48,"one":10.42,"ratio":0.72},{"n":1024,"two":39.90,"one":22.53,"ratio":0.56},{"n":1048576,"two":171.79,"one":124.30,"ratio":0.72}]}],"twoBoundsIsFlat":[14.28,14.38,14.48],"orderIsolation":{"design":"identical query multiset, 50% present; only the ORDER changes","rows":[{"n":16,"oneGrouped":10.18,"oneShuffled":23.18,"oneRatio":2.28,"twoGrouped":14.38,"twoShuffled":14.39,"twoRatio":1.00},{"n":256,"oneGrouped":17.92,"oneShuffled":37.74,"oneRatio":2.11,"twoGrouped":29.11,"twoShuffled":29.18,"twoRatio":1.00},{"n":1024,"oneGrouped":23.72,"oneShuffled":44.69,"oneRatio":1.88,"twoGrouped":39.82,"twoShuffled":40.25,"twoRatio":1.01}]},"assembly":[{"fn":"two bounds","instructions":42,"condSelects":4,"condBranches":5},{"fn":"one descent","instructions":32,"condSelects":6,"condBranches":4}],"finding":"the shortcut has fewer instructions AND fewer branches and still loses — what matters is that its extra branch asks 'is x present', the one unpredictable question in the problem","crossover":"near n = 65,536, where the saved descent outweighs one mispredict even on mixed data"},"trackedCandidate":{"correct":{"cases":6006,"wrong":0},"vsTwoBounds":"1.11x to 1.23x slower at every size and workload","whyTaught":"the recording doubles as the guard, so absence needs no separate check"},"assertions":["floor <= x <= ceil whenever both exist","floor == ceil exactly when x is present","no floor exactly when x is below every element","no ceil exactly when x is above every element","both absent only for the empty array"]}
```

<!-- @highlights -->
- Floor and ceil are two readings of one split point, not two searches for two things.
- `ceil = a[lowerBound(x)]`, `floor = a[upperBound(x) - 1]` — verified 0 wrong over 6,006 exhaustive cases.
- Using `lowerBound - 1` for the floor is wrong on 100% of the cases where x is present, 2,860 of 6,006.
- A guard fires on 22.74% of inputs at each end — absence is a fifth of the problem, not an edge case.
- The missing ceil guard raises in Python 100% of the time; the missing floor guard silently returns the last element 99.56% of the time.
- The one-descent shortcut has fewer branches than two descents and runs 2.28x slower on interleaved data, because its one extra branch asks "is x present".

<!-- @edgeCases -->
- An empty array — both guards fire, and it is the only shape where Python's unguarded `a[-1]` raises rather than returning a wrong value.
- x below every element — no floor, and `upperBound(x)` is 0.
- x above every element — no ceil, and `lowerBound(x)` is n.
- x present — floor and ceil are both x, which is the case that breaks `a[lowerBound(x) - 1]`.
- x present many times — still one answer each; duplicates change the indices but not the values.
- A single-element array — `a = [0]` with x = 0 is the smallest input where the wrong bound for the floor fails.
- An array of all equal values — floor and ceil are both that value when x equals it, and one of them is absent otherwise.
- An array containing -1 — where a -1 sentinel for "does not exist" becomes ambiguous with a legitimate answer.
- Using the returned value without checking the presence flag — absence is common enough that this fails on roughly a fifth of inputs.
- n above 1,073,741,824 — where `(lo + hi) / 2` overflows an int, exactly as in Lower Bound.
- An unsorted array — every version terminates and every answer is meaningless; nothing checks the precondition.

<!-- @pitfalls -->
- Writing the floor as `a[lowerBound(x) - 1]`. Wrong on 2,860 of 6,006 exhaustive cases — every case where x is present, and 100% of them.
- Writing the ceil as `a[upperBound(x)]`. It skips x itself, so a present x reports the next larger element as its own ceil.
- Omitting the floor guard. In Python `a[-1]` returns the last element and silently produces a "floor" larger than x on 99.56% of the cases where no floor exists.
- Omitting the ceil guard. Loud in Python and Java, silent in C++ where `a[n]` is undefined behaviour that was observed not to fault in 2,000 of 2,000 trials.
- Returning -1 to mean "does not exist". If the array can contain -1 the caller cannot tell the two apart; return a presence flag, an `OptionalInt`, or `None`.
- Treating the guards as edge cases. They fire on 22.74% of inputs each.
- Assuming the one-descent shortcut is strictly better. It is 1.5x faster on skewed workloads and 1.61x slower at n = 16 when half the probes are present.
- Counting branches to predict speed. The shortcut has fewer branches than the two-bound version and loses — what matters is whether a branch is predictable.
- Recording a candidate without advancing the pointer in the tracking version. It never terminates.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825.

<!-- @doubt -->
### Why is the floor `upperBound - 1` rather than `lowerBound - 1`?

<!-- @answer -->
Because `lowerBound(x) - 1` gives the last element **strictly less** than x, and the floor is the last element **at most** x. Those are the same thing only when x is absent. Measured over 6,006 exhaustive cases, `a[lowerBound(x) - 1]` as the floor is wrong on 2,860 — and every single failure is a case where x is present, covering 100% of them. The smallest example is `a = [0]` with x = 0: lower bound is 0, so `lower - 1` is -1 and the guard reports no floor when the floor is obviously 0. Upper bound already steps past every copy of x, so stepping back one lands on the last copy — which is exactly the definition.

<!-- @doubt -->
### Are the guards really necessary, or just defensive?

<!-- @answer -->
Necessary, and not rare. Of 6,006 exhaustive cases, 1,366 have no floor and 1,366 have no ceil — **22.74% each**. A version that assumes both answers exist is wrong on roughly a fifth of its inputs at each end, which is not an edge case in any useful sense. The two failures are also not symmetric. Missing the ceil guard evaluates `a[n]`, which raises `IndexError` in Python on 1,366 of 1,366 such cases — you will find it immediately. Missing the floor guard evaluates `a[-1]`, which in Python wraps to the last element of the array and returned a value on 1,360 of 1,366 — 99.56%. On `a = [0]` with x = -1 it reports the floor as 0, a number larger than x. That answer is a real value from the array, so it looks plausible in a debugger and passes most spot checks.

<!-- @doubt -->
### What actually happens in C++ if I skip a guard?

<!-- @answer -->
Undefined behaviour, which is worse than a crash because it is not reliable. Observed on this build: reading `p[-1]` on a heap-allocated vector returned a value on **2,000 of 2,000 trials without faulting**, and on `[2,4,6,8]` both `p[-1]` and `p[4]` read as 0. None of those 2,000 values happened to satisfy `<= x`, so a sanity check would have caught them — but the code has no sanity check, which is the whole point. Treat these numbers as an observation of one build rather than a rule: the standard permits anything, including a value that looks right, and the behaviour can change with optimisation level or allocator. An AddressSanitizer build timed out on this machine, so there is no sanitizer evidence to report either way.

<!-- @doubt -->
### One lower bound can give both answers. Why not always do that?

<!-- @answer -->
Because it is faster only when your data is skewed, and slower when it is mixed. The shortcut is correct — 0 wrong over the same 6,006 cases — and does half the searching. With no probe present it measures 0.62x to 0.68x of the two-bound version, a 1.5x win. With half the probes present it measures **1.61x slower** at n = 16 and 1.12x slower at n = 1,024, while the two-bound version does not move at all: 14.28ns, 14.38ns, 14.48ns as the present fraction goes none, half, all. At n = 1,048,576 the shortcut wins again even on mixed data (0.83x), because by then the saved descent outweighs one mispredict; the crossover sits near n = 65,536. Use it when you know the workload, default to two bounds when you do not.

<!-- @doubt -->
### The shortcut has fewer branches. How is it slower?

<!-- @answer -->
Because branch *count* is not what costs — branch *unpredictability* is. The generated ARM64: the two-bound version is 42 instructions with 4 conditional selects and 5 conditional branches; the shortcut is 32 instructions with 6 selects and only **4** branches. Fewer of everything, and 2.28x slower on interleaved data. The proof that it is prediction and not work: hold the query multiset fixed and change only the **order**, grouped by presence versus shuffled. At n = 16 the shortcut goes from 10.18ns to 23.18ns — 2.28x — while the two-bound version goes from 14.38ns to 14.39ns, a ratio of 1.00. Identical work, identical answers, and only one of them cares. The two-bound version's branches are loop back-edges and boundary guards, all heavily one-sided; the shortcut adds `a[l] == x`, which is literally "is x present" — the single coin flip in the problem.

<!-- @doubt -->
### Why do so many courses teach the tracking version instead?

<!-- @answer -->
Because it needs no guard, and that is a genuine pedagogical advantage. The candidate starts as "nothing recorded", so absence falls out of the control flow rather than being a separate check you must remember — which sidesteps precisely the `a[-1]` trap above. It is also correct: 0 wrong over 6,006 exhaustive cases. The cost is small and consistent: measured **1.11x to 1.23x slower** than the two-bound form at every size and every workload, because each loop does a conditional write that the bound-based loops do not. If you already have `lowerBound` and `upperBound` written, use them; if you are writing this from nothing and want the guards to be structural, the tracking version is a defensible choice.

<!-- @doubt -->
### Should I return -1 when there is no answer?

<!-- @answer -->
Only if the array cannot contain -1, and it usually can. The problem as commonly posed says "return -1 if it does not exist", which is fine for test data drawn from positive integers and quietly broken otherwise: on `a = [-5, -1, 3]` with x = -1, the floor is -1 and "no floor" is also -1, and the caller has no way to tell them apart. Every version in this container returns a presence flag, an `OptionalInt`, or `None` instead. If an interface forces a sentinel on you, pick one outside the value domain — `INT_MIN` when the data is known to exclude it — and document it, rather than reusing a value the data can legitimately produce.

<!-- @doubt -->
### Is floor always equal to ceil when x is in the array?

<!-- @answer -->
Yes, and it is worth seeing why rather than treating it as a special case. Floor is the largest element at most x and ceil is the smallest element at least x. If x is present then x itself qualifies for both, and nothing can beat it in either direction — no element at most x can exceed x, and none at least x can be below it. Measured, floor equals ceil on 2,860 of 6,006 exhaustive cases, and those 2,860 are exactly the cases where x is present. That identity is what the one-descent shortcut exploits, and it is also what makes `a[lowerBound(x) - 1]` fail: the substitution answers "strictly below x", which is the one reading that excludes x from its own floor.
