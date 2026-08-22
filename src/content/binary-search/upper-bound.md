---
id: upper-bound
topic: Binary Search
title: Upper Bound
difficulty: Easy
status: ready
prerequisites:
  - lower-bound
  - search-x-in-sorted-array
  - while-loop
  - integer-overflow-and-precision-errors
relatedIds:
  - lower-bound
  - search-x-in-sorted-array
  - first-and-last-occurrence
  - count-occurrences-in-a-sorted-array
  - search-insert-position
---

<!-- @summary -->
Find the first index where a[i] > x — one character different from lower bound, and measurably free — but the two obvious ways to exploit the relationship both fail: reusing lower bound on x + 1 breaks at INT_MAX, and fusing both descents into one is 1.24x to 1.89x slower than simply running them separately.

<!-- @theory -->
## The problem

Return the first index at which x could be inserted while keeping the array
sorted and landing *after* every copy of x already there — equivalently, the
first index i with `a[i] > x`.

```
a = [1, 3, 3, 5, 8]

x = 3   ->  3     one past the LAST 3
x = 4   ->  3     no 4 present; same answer as above
x = 9   ->  5     larger than everything
x = 0   ->  0
```

Everything structural about lower bound carries over unchanged. The answer is a
position in `0..n` inclusive, not an index. `n` is an ordinary answer meaning
"past the end". There is no early exit, so every call does the full descent.

## One character

Here is the canonical loop beside lower bound's:

```
Lower Bound                       Upper Bound
lo = 0, hi = n                    lo = 0, hi = n
while lo < hi:                    while lo < hi:
    mid = ...                         mid = ...
    if a[mid] <  x: lo = mid + 1      if a[mid] <= x: lo = mid + 1
    else:           hi = mid          else:           hi = mid
return lo                         return lo
```

One `=`. That is the whole difference, and it is worth being precise about *why*
it lands where it does rather than memorising it.

The loop is narrowing a range of candidate positions, and the comparison answers
one question: **does mid still have a claim to being the answer?** Lower bound
wants the first position whose element is not smaller than x, so an element equal
to x keeps its claim — `hi = mid` retains it. Upper bound wants the first position
whose element is strictly greater, so an element equal to x *loses* its claim and
the range collapses past it — `lo = mid + 1` discards it.

Equal elements are the only ones that change sides. Everything smaller was always
discarded; everything larger was always kept. That is why exactly one character
moves.

Tested against `std::upper_bound` over every sorted array of length 0 to 11 drawn
from four values, with every probe from -1 to 4 — **8,190 cases, 0 wrong.**

## The change is free

There is no reason to expect `<=` to cost more than `<` on any machine, and it
does not. Measured side by side, in nanoseconds per call:

| n | lower bound | upper bound |
|---|---|---|
| 64 | 5.25 | 4.94 |
| 1,024 | 11.38 | 11.10 |
| 65,536 | 33.19 | 33.54 |
| 1,048,576 | 60.02 | 59.80 |

The two are the same function with a different constant folded into one compare.
The gaps above are run-to-run noise in both directions, which is what "free"
looks like when measured rather than asserted.

The step count is likewise identical: **ceil(log2(n + 1))** worst case, no early
exit, averaging 10.00 at n = 1,024 and 20.00 at n = 1,048,576 — exactly what
lower bound measured.

## The two bounds together

Lower bound and upper bound are more useful as a pair than either is alone, and
three relationships hold. All three were checked exhaustively over the same 8,190
cases.

**`upper - lower` is the count of x.** 8,190 of 8,190. If x is absent the
difference is zero, and if x appears four times it is four. This is how you count
occurrences without a third algorithm.

**They are equal exactly when x is absent.** Of the 4,186 cases where x does not
appear, all 4,186 have `lower == upper`. Of the 4,004 where it does, all 4,004
have `lower != upper`. So the pair also answers "is x present?" — which is what
Search X did, without Search X.

**`upper(x) - 1` is the floor: the last index with `a[i] <= x`.** It can be -1,
which is the correct answer for an x below everything:

```
a = [2, 4, 6]

x = 1  ->  upper = 0,  floor = -1    nothing is <= 1
x = 2  ->  upper = 1,  floor =  0
x = 5  ->  upper = 2,  floor =  1
x = 7  ->  upper = 3,  floor =  2
```

## The shortcut that almost works

For integers, `upper(x)` and `lower(x + 1)` are the same thing: the first index
above every copy of x is the first index at or above x + 1, because nothing sits
strictly between them. That is true, and it verifies — **8,190 of 8,190 exhaustive
cases agree.**

It is still not worth writing.

The first reason is that `x + 1` is not always x + 1. With
`a = [INT_MAX - 1, INT_MAX]` and `x = INT_MAX`, the correct upper bound is 2.
The shortcut computes `lower(INT_MAX + 1)`, which wraps to -2,147,483,648 and
returns **0**. Not off by one — off by the whole array. Clang warns about the
expression at compile time, which is a useful signal that the shortcut has a
precondition the code never states.

The second reason is that it does not generalise. There is no "+1" for a `double`,
a `string`, or a struct ordered by a comparator, so the moment the array holds
anything but integers the shortcut has to be unwritten and replaced by the
one-character change it was avoiding.

## Fusing the two descents makes it slower

If you need both bounds, the obvious optimisation is to descend once until you
land on x, then run two short descents from there — one for each side. That is
the shape `std::equal_range` has, and it looks like it must beat running two
independent full descents, which visit the same prefix twice.

It loses. Measured, in nanoseconds per call for both bounds:

| n | two independent descents | one shared descent | shared / two |
|---|---|---|---|
| 64 | 10.53 | 23.21 | 2.20x |
| 1,024 | 22.35 | 44.27 | 1.98x |
| 65,536 | 56.99 | 89.01 | 1.56x |
| 1,048,576 | 98.04 | 129.78 | 1.32x |

Both were verified against `std::equal_range` first — 0 wrong over 6,006 cases —
so this is two correct implementations, one of which is up to 2.2x slower while
doing strictly less work.

The generated ARM64 says why:

| | instructions | conditional selects | conditional branches |
|---|---|---|---|
| `lowerBound` | 16 | 2 | 2 |
| `upperBound` | 16 | 2 | 2 |
| two descents | 19 | 0 | 0 |
| shared descent | 49 | 4 | **8** |

The fused version needs a three-way test — less than, greater than, equal — and a
three-way test cannot be flattened into conditional selects. It becomes eight real
branches on data the predictor cannot learn, which is exactly the failure Search X
measured when its early-exit equality test cost it 2.4x to 7.3x. The saved
comparisons are cheap; the mispredictions are not.

The natural objection is that the test data did not have enough duplicates for
sharing to pay. Measured across duplicate densities:

| n | copies of each value | two descents | shared descent | ratio |
|---|---|---|---|---|
| 1,024 | 1 | 23.24 | 43.85 | 1.89x |
| 1,024 | 2 | 22.09 | 41.08 | 1.86x |
| 1,024 | 16 | 22.28 | 28.40 | 1.27x |
| 1,048,576 | 1 | 97.93 | 131.42 | 1.34x |
| 1,048,576 | 2 | 98.13 | 131.36 | 1.34x |
| 1,048,576 | 16 | 97.45 | 120.45 | 1.24x |

More duplicates narrow the gap — the shared prefix gets longer, so there is more
to save — but across a 16x change in duplicate density it never closes. Call both
functions.

<!-- @intuition -->
Do not learn this as "lower bound but with `<=`". Learn it as the second answer to
one question the loop asks at every step: *does the element at mid still have a
claim to being the answer?* Elements smaller than x never do and elements larger
than x always do, so those two cases are fixed. Only equality is a genuine choice,
and the two ways of resolving it are the two functions. Once that is the shape in
your head, `<` and `<=` stop being a thing to memorise and become the only place
where a decision was ever available — which is also why nothing else in the loop
moves, and why the change costs nothing to run.

<!-- @approach -->
### Linear Scan

<!-- @idea -->
Walk forward while elements are less than or equal to x, and return where you stopped.

<!-- @steps -->
1. Start at index zero.
2. While the index is inside the array and the element there is not greater than x, advance.
3. Stop at the first element strictly greater than x.
4. Return the index where the walk stopped.
5. Running off the end returns n, the correct answer for an x at or above everything.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Worth writing once because the stopping condition is the definition of upper bound stated directly. It is not competitive: measured 16.34ns against 5.36ns at n = 64, and 164.16ns against 10.62ns at n = 1,024.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int upperBound(const vector<int>& a, int x) {
    int i = 0;
    while (i < (int)a.size() && a[i] <= x) i++;
    return i;
}
```

<!-- @annotations -->
- 6: Two things at once. The bounds test comes first, so running off the end never reads a[n] — swapping the halves makes this read out of bounds. And the comparison is <=, so the walk steps over every copy of x; using < stops at the first copy and gives the lower bound instead.
- 7: Returning i, not -1. Stopping past the last element gives n, meaning x belongs at the end.

<!-- @code java -->
```java
static int upperBound(int[] a, int x) {
    int i = 0;
    while (i < a.length && a[i] <= x) i++;
    return i;
}
```

<!-- @annotations -->
- 3: The <= is what separates this from lower bound — it keeps walking while elements equal x.

<!-- @code python -->
```python
def upper_bound(a, x):
    i = 0
    while i < len(a) and a[i] <= x:
        i += 1
    return i


# The stopping rule is the definition: the first position whose
# element is strictly greater than x.
```

<!-- @annotations -->
- 3: Python stops at the first false half, so the index check protects the lookup.

<!-- @approach -->
### Narrow the Range of Positions

<!-- @idea -->
Halve a range of candidate positions, letting mid keep its claim only when it is strictly greater than x.

<!-- @steps -->
1. Set lo to 0 and hi to n — one past the last index, because n is a valid answer.
2. While the range holds more than one position, take mid.
3. If the element at mid is not greater than x, no position at or before mid can be the answer, so move lo past it.
4. Otherwise mid is still a candidate, so bring hi down to mid without excluding it.
5. When lo and hi meet, that position is the answer.

<!-- @complexity -->
- time: O(log n) — ceil(log2(n + 1)) iterations worst case, with no early exit
- space: O(1)
- note: The canonical form, and already branchless — the generated ARM64 uses two conditional selects and branches only to repeat the loop. Measured within noise of lower bound at every size: 4.94ns against 5.25ns at n = 64, 59.80ns against 60.02ns at n = 1,048,576.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int upperBound(const vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] <= x) lo = mid + 1;
        else             hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 5: hi starts at n, not n - 1, because n is a legitimate answer meaning "past the end".
- 6: Strictly less than. Pairing lo <= hi with hi = mid hangs, because mid stays inside a range that never shrinks.
- 7: Subtracting before halving, so lo + hi never overflows. Writing (lo + hi) / 2 breaks from n = 1,073,741,825.
- 8: The one character that separates this from lower bound. An element equal to x loses its claim to being the answer, so the range collapses past it.
- 9: hi = mid, not mid - 1. mid is still a candidate here and discarding it is wrong.
- 11: Returning lo, a position in 0..n — never -1, because an absent value is not a failure.

<!-- @code java -->
```java
static int upperBound(int[] a, int x) {
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] <= x) lo = mid + 1;
        else             hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 4: Java has >>> for the unsigned shift, but lo + (hi - lo) / 2 is safe here and reads the same in all three languages.
- 5: The <= is the whole difference from lower bound.

<!-- @code python -->
```python
def upper_bound(a, x):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] <= x:
            lo = mid + 1
        else:
            hi = mid
    return lo


# The standard library spells this bisect.bisect_right, and
# bisect.bisect_left is the lower bound.
```

<!-- @annotations -->
- 4: Python integers do not overflow, so (lo + hi) // 2 is safe here in a way it is not in C++ or Java.
- 5: The <= is the whole difference from lower bound.

<!-- @approach -->
### Track a Length Instead of Two Indices

<!-- @idea -->
Carry a pointer and a remaining length rather than two indices, so halving is an unsigned shift instead of a signed division.

<!-- @steps -->
1. Start with the pointer at the front and the length at n.
2. While any length remains, take half of it.
3. If the element at that offset is not greater than x, move the pointer past it and shorten the length accordingly.
4. Otherwise keep the pointer and shorten the length to the half.
5. The pointer's offset from the start is the answer.

<!-- @complexity -->
- time: O(log n), the same descent
- space: O(1)
- note: Measured 1.08x to 1.14x over the canonical form, matching what the same rewrite bought lower bound. The gain is not branch prediction — the canonical form already avoids branches — it is that halving a known non-negative length is one shift where signed division by two takes three instructions.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int upperBound(const vector<int>& a, int x) {
    const int* base = a.data();
    int len = (int)a.size();
    while (len > 0) {
        int half = len / 2;
        if (base[half] <= x) {
            base += half + 1;
            len -= half + 1;
        } else {
            len = half;
        }
    }
    return int(base - a.data());
}
```

<!-- @annotations -->
- 8: len is never negative, so the compiler halves it with a shift rather than the three instructions signed division by two needs.
- 9: Reading at base[half] rather than computing an absolute index — this is the same probe the canonical form makes, addressed differently.
- 10: Skipping half + 1 elements, not half. The probed element is itself excluded, which is what <= decided.
- 13: The else branch keeps the pointer and takes only the front half, mirroring hi = mid.
- 16: Pointer difference gives the position. This is a count of elements, not bytes — the compiler divides by sizeof(int) for you.

<!-- @code java -->
```java
static int upperBound(int[] a, int x) {
    int base = 0, len = a.length;
    while (len > 0) {
        int half = len / 2;
        if (a[base + half] <= x) {
            base += half + 1;
            len -= half + 1;
        } else {
            len = half;
        }
    }
    return base;
}
```

<!-- @annotations -->
- 2: Java has no raw pointers, so base is an index offset. The arithmetic is identical.
- 6: base moves past the probed element because <= excluded it.

<!-- @code python -->
```python
def upper_bound(a, x):
    base, length = 0, len(a)
    while length > 0:
        half = length // 2
        if a[base + half] <= x:
            base += half + 1
            length -= half + 1
        else:
            length = half
    return base


# In real Python code use bisect.bisect_right, which is
# implemented in C and will beat any of this.
```

<!-- @annotations -->
- 4: In CPython this rewrite buys nothing — every operation goes through the interpreter, so the shift-versus-divide distinction never reaches the hardware.

<!-- @example -->

<!-- @input -->
```
a = [1, 3, 3, 5, 8], x = 3
```

<!-- @output -->
```
3
```

<!-- @why -->
Index 3 is the first position holding a value greater than 3. Lower bound on the same input gives 1, and the difference of 2 is the number of 3s.

<!-- @walkthrough -->
```
lo=0 hi=5   mid=2  a[2]=3   3 <= 3   lo = 3      range [3,5)
lo=3 hi=5   mid=4  a[4]=8   8 >  3   hi = 4      range [3,4)
lo=3 hi=4   mid=3  a[3]=5   5 >  3   hi = 3      range [3,3)
lo == hi -> 3

The first probe landed exactly on a 3 and did not stop.
That is the only difference from lower bound, which would
have kept index 2 as a candidate.
```

<!-- @example -->

<!-- @input -->
```
a = [1, 3, 3, 5, 8], x = 4
```

<!-- @output -->
```
3
```

<!-- @why -->
Same answer as x = 3, because nothing between 3 and 5 exists. Here lower bound also returns 3, and the difference of 0 correctly reports that no 4 is present.

<!-- @walkthrough -->
```
lo=0 hi=5   mid=2  a[2]=3   3 <= 4   lo = 3      range [3,5)
lo=3 hi=5   mid=4  a[4]=8   8 >  4   hi = 4      range [3,4)
lo=3 hi=4   mid=3  a[3]=5   5 >  4   hi = 3      range [3,3)
lo == hi -> 3

lower(4) = 3 and upper(4) = 3, so upper - lower = 0.
For x = 3 the same pair gave 1 and 3, a difference of 2.
```

<!-- @example -->

<!-- @input -->
```
a = [2, 2, 2, 2], x = 2
```

<!-- @output -->
```
4
```

<!-- @why -->
Every element equals x, so every element loses its claim and the answer is n. Lower bound on the same input returns 0, and the difference of 4 is the count.

<!-- @walkthrough -->
```
lo=0 hi=4   mid=2  a[2]=2   2 <= 2   lo = 3      range [3,4)
lo=3 hi=4   mid=3  a[3]=2   2 <= 2   lo = 4      range [4,4)
lo == hi -> 4

Returning n is correct, not an overflow. Using it as an
index without checking reads past the end of the array.
```

<!-- @example -->

<!-- @input -->
```
a = [], x = 7
```

<!-- @output -->
```
0
```

<!-- @why -->
The loop never runs, and position 0 is simultaneously the first and last place a value can go in an empty array. No special case is needed.

<!-- @walkthrough -->
```
lo=0 hi=0   lo < hi is false, loop body never executes
return lo -> 0

The empty array needs no guard because hi starts at n
rather than n - 1. Starting at n - 1 would give hi = -1
and require a check.
```

<!-- @visualization custom -->

<!-- @description -->
Traces the canonical descent on a = [1,3,3,5,8] for x = 3, showing that the first probe lands on an equal element and does not stop, then lays the two bounds side by side to show what their difference measures. Also carries the two measured negative results: the x + 1 shortcut breaking at INT_MAX, and the fused both-bounds descent losing to two separate ones.

<!-- @sampleInput -->
```json
{"primary":{"array":[1,3,3,5,8],"x":3,"answer":3,"trace":[{"lo":0,"hi":5,"mid":2,"value":3,"compare":"3 <= 3","action":"lo = mid + 1","newRange":[3,5],"note":"equal, and it loses its claim — this is the one character"},{"lo":3,"hi":5,"mid":4,"value":8,"compare":"8 > 3","action":"hi = mid","newRange":[3,4]},{"lo":3,"hi":4,"mid":3,"value":5,"compare":"5 > 3","action":"hi = mid","newRange":[3,3]}],"iterations":3,"noEarlyExit":true,"lowerBoundOnSameInput":1,"difference":2,"otherProbes":[{"x":4,"answer":3},{"x":9,"answer":5},{"x":0,"answer":0}]},"oneCharacter":{"lowerBound":"a[mid] <  x","upperBound":"a[mid] <= x","everythingElse":"identical — hi = n, lo < hi, hi = mid, return lo","reason":"only elements equal to x change sides; smaller ones were always discarded and larger ones always kept","verified":{"against":"std::upper_bound","cases":8190,"wrong":0,"space":"every sorted array of length 0..11 over four values, probes -1..4"},"cost":{"claim":"free","measured":[{"n":64,"lowerNs":5.25,"upperNs":4.94},{"n":1024,"lowerNs":11.38,"upperNs":11.10},{"n":65536,"lowerNs":33.19,"upperNs":33.54},{"n":1048576,"lowerNs":60.02,"upperNs":59.80}],"reading":"gaps run in both directions, which is what free looks like when measured"}},"thePair":{"countOfX":{"formula":"upper - lower","verified":"8,190 of 8,190"},"presence":{"rule":"lower == upper exactly when x is absent","absentCases":4186,"absentAgreeing":4186,"presentCases":4004,"presentDiffering":4004},"floor":{"formula":"upper - 1","meaning":"last index with a[i] <= x","canBeNegativeOne":true,"examples":[{"array":[2,4,6],"x":1,"upper":0,"floor":-1},{"array":[2,4,6],"x":2,"upper":1,"floor":0},{"array":[2,4,6],"x":5,"upper":2,"floor":1},{"array":[2,4,6],"x":7,"upper":3,"floor":2}]}},"xPlusOneShortcut":{"claim":"upper(x) == lower(x + 1) for integers","verified":"8,190 of 8,190","failsAt":{"array":["INT_MAX - 1","INT_MAX"],"x":"INT_MAX","correct":2,"shortcutReturns":0,"cause":"x + 1 wraps to -2147483648","compilerWarns":true},"secondReason":"no +1 exists for double, string, or a comparator-ordered struct"},"fusedDescent":{"intuition":"one shared descent then two short ones should beat two full descents","measured":[{"n":64,"twoNs":10.53,"sharedNs":23.21,"ratio":2.20},{"n":1024,"twoNs":22.35,"sharedNs":44.27,"ratio":1.98},{"n":65536,"twoNs":56.99,"sharedNs":89.01,"ratio":1.56},{"n":1048576,"twoNs":98.04,"sharedNs":129.78,"ratio":1.32}],"bothVerified":{"against":"std::equal_range","cases":6006,"wrong":0},"assembly":[{"fn":"lowerBound","instructions":16,"condSelects":2,"condBranches":2},{"fn":"upperBound","instructions":16,"condSelects":2,"condBranches":2},{"fn":"twoDescents","instructions":19,"condSelects":0,"condBranches":0},{"fn":"sharedDescent","instructions":49,"condSelects":4,"condBranches":8}],"cause":"a three-way test cannot be flattened into conditional selects, so it becomes eight unpredictable branches — the same failure Search X measured at 2.4x to 7.3x","sensitivity":[{"n":1024,"dup":1,"twoNs":23.24,"sharedNs":43.85,"ratio":1.89},{"n":1024,"dup":2,"twoNs":22.09,"sharedNs":41.08,"ratio":1.86},{"n":1024,"dup":16,"twoNs":22.28,"sharedNs":28.40,"ratio":1.27},{"n":1048576,"dup":1,"twoNs":97.93,"sharedNs":131.42,"ratio":1.34},{"n":1048576,"dup":2,"twoNs":98.13,"sharedNs":131.36,"ratio":1.34},{"n":1048576,"dup":16,"twoNs":97.45,"sharedNs":120.45,"ratio":1.24}],"reading":"more duplicates narrow the gap but a 16x change in density never closes it"},"stepCount":{"formula":"ceil(log2(n + 1)) worst case","measured":[{"n":1024,"average":10.00,"worst":11},{"n":65536,"average":16.00,"worst":17},{"n":1048576,"average":20.00,"worst":21}],"identicalToLowerBound":true},"pointerRewrite":{"measured":[{"n":16,"canonicalNs":4.13,"pointerNs":3.84,"ratio":1.08},{"n":64,"canonicalNs":5.36,"pointerNs":4.87,"ratio":1.10},{"n":256,"canonicalNs":7.78,"pointerNs":6.90,"ratio":1.13},{"n":1024,"canonicalNs":10.62,"pointerNs":9.31,"ratio":1.14},{"n":65536,"canonicalNs":32.37,"pointerNs":28.99,"ratio":1.12},{"n":1048576,"canonicalNs":58.53,"pointerNs":53.09,"ratio":1.10}],"cause":"signed division by two costs three instructions; halving a non-negative length is one shift"},"scanCrossover":{"rows":[{"n":16,"linearNs":8.16,"upperNs":4.13},{"n":64,"linearNs":16.34,"upperNs":5.36},{"n":256,"linearNs":50.15,"upperNs":7.78},{"n":1024,"linearNs":164.16,"upperNs":10.62}],"reading":"no size at which the scan wins, same as lower bound"},"assertions":["the result is in 0..n inclusive","every element before the result is at most x","every element from the result onward is strictly greater than x","duplicates resolve to one past the rightmost occurrence","upper - lower is the number of copies of x"]}
```

<!-- @highlights -->
- The first probe lands on a 3 and the loop does not stop — the single behavioural consequence of `<=`.
- Lower bound returns 1 and upper bound returns 3 on the same input; the difference is the count of 3s.
- The answer is a position in 0..n, so `a = [2,2,2,2]` with x = 2 returns 4 and indexing with it reads past the end.
- The `x + 1` shortcut agrees on all 8,190 exhaustive cases and still returns 0 instead of 2 at INT_MAX.
- The fused both-bounds descent is correct and up to 2.2x slower, because a three-way test compiles to eight unpredictable branches.

<!-- @edgeCases -->
- An empty array — the loop never runs and the answer is 0.
- x larger than every element — the answer is n, one past the end, and is not an error.
- x smaller than every element — the answer is 0.
- x equal to every element — the answer is n, where lower bound gives 0 and the difference is the whole array.
- x present many times — the answer is one past the rightmost occurrence, and `result - 1` is that occurrence.
- x equal to the last element — the answer is n, which is the case most likely to be indexed without checking.
- Using the result as an index without checking — it can be n, and a[n] is not yours.
- Using `result - 1` as a floor — it can be -1 when x is below everything.
- x at INT_MAX — fine for this function, but breaks any implementation written as `lowerBound(a, x + 1)`.
- n above 1,073,741,824 — where (lo + hi) / 2 overflows an int, exactly as in lower bound.
- An unsorted array — the loop terminates and its answer means nothing; nothing checks the precondition.

<!-- @pitfalls -->
- Writing `a[mid] < x` instead of `a[mid] <= x`. That is the lower bound — a different function rather than a broken one, which is why it produces plausible answers and hides.
- Changing anything besides the comparison. `hi = n`, `lo < hi`, `hi = mid`, and `return lo` are all required, exactly as they are in lower bound.
- Adding an early exit when a[mid] equals x. There is nothing to exit for; the answer is never the element you landed on.
- Implementing it as `lowerBound(a, x + 1)`. It agrees on 8,190 exhaustive cases and returns 0 instead of 2 for `[INT_MAX - 1, INT_MAX]` with x = INT_MAX.
- Assuming the `x + 1` trick generalises. There is no successor for a double, a string, or a comparator-ordered struct.
- Fusing both bounds into one descent for speed. Measured 1.24x to 2.20x *slower* than calling the two functions separately, across every size and duplicate density tested.
- Treating the result as an index into the array. It ranges over 0 to n, and n means x belongs past the end.
- Expecting -1 for a value that is absent. Absence shows up as `lower == upper`, not as a sentinel.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825.
- Reaching for a linear scan on small input. Measured 8.16ns against 4.13ns at n = 16, and the gap only widens.

<!-- @doubt -->
### Is `<=` really the only change from lower bound?

<!-- @answer -->
Yes, and it is worth seeing why rather than trusting it. The loop asks one question at each step: does the element at mid still have a claim to being the answer? Elements smaller than x never do, and elements larger than x always do — neither case has any freedom. Only equality is a real choice, and the two ways to resolve it are precisely the two functions. So `hi = n`, `lo < hi`, `hi = mid`, and `return lo` are all forced and all shared. Verified against `std::upper_bound` over 8,190 exhaustive cases with 0 wrong.

<!-- @doubt -->
### Does the extra `=` cost anything at runtime?

<!-- @answer -->
No, and that is measured rather than assumed. Side by side in nanoseconds per call: 5.25 against 4.94 at n = 64, 11.38 against 11.10 at n = 1,024, 33.19 against 33.54 at n = 65,536, and 60.02 against 59.80 at n = 1,048,576. Upper bound is faster in two rows and slower in two, which is run-to-run noise rather than a real difference. Both compile to the same 16 instructions with two conditional selects — the comparison changes which condition code is tested, not how much work happens. The step counts are identical too.

<!-- @doubt -->
### Can I just call `lowerBound(a, x + 1)`?

<!-- @answer -->
It works until it does not, and the failure is silent. For integers the identity holds — nothing sits strictly between x and x + 1 — and it verifies on 8,190 of 8,190 exhaustive cases. Then give it `a = [INT_MAX - 1, INT_MAX]` and `x = INT_MAX`: the correct answer is 2, and `x + 1` wraps to -2,147,483,648 so the shortcut returns **0**. That is not an off-by-one, it is the wrong end of the array. Clang warns on the expression, which tells you the shortcut carries a precondition the code never states. It also does not generalise — there is no successor for a double, a string, or a struct ordered by a comparator — so writing it means unwriting it the first time the element type changes. Change the character instead.

<!-- @doubt -->
### If I need both bounds, is one shared descent faster than two separate ones?

<!-- @answer -->
No — it is 1.24x to 2.20x **slower**, which is the opposite of the intuition. Both versions were verified against `std::equal_range` first (0 wrong over 6,006 cases), so this compares two correct implementations. Two independent descents: 10.53ns at n = 64 and 98.04ns at n = 1,048,576. One shared descent: 23.21ns and 129.78ns. The assembly explains it — two plain descents compile to 19 instructions with **zero** conditional branches, while the fused version needs a three-way test (less, greater, equal) that cannot become a conditional select and compiles to 49 instructions with **eight** branches on unpredictable data. It is the same effect Search X measured when its early-exit test cost 2.4x to 7.3x. More duplicates narrow the gap but never close it: at 16 copies of each value it is still 1.27x slower at n = 1,024. Call both functions.

<!-- @doubt -->
### How do I count how many times x appears?

<!-- @answer -->
`upperBound(a, x) - lowerBound(a, x)`. Verified on 8,190 of 8,190 exhaustive cases. On `[1,3,3,5,8]` with x = 3 that is 3 - 1 = 2; with x = 4 it is 3 - 3 = 0, correctly reporting absence. The same difference also answers "is x present?" — of 4,186 exhaustive cases where x is absent, all 4,186 have the two bounds equal, and of 4,004 where it is present, all 4,004 have them differ. Two functions you already have replace three more you would otherwise write, and the cost is two descents — which, per the previous question, is cheaper than trying to be clever about it.

<!-- @doubt -->
### What is `upperBound(a, x) - 1`?

<!-- @answer -->
The floor: the last index whose element is at most x. It is the natural partner to lower bound's "first index at least x", and the pair covers most real queries about where a value sits. On `a = [2,4,6]`: x = 1 gives upper = 0 and floor = **-1**, x = 2 gives 1 and 0, x = 5 gives 2 and 1, x = 7 gives 3 and 2. The -1 is correct, not a bug — nothing in the array is at most 1 — but it means the floor needs a guard where the upper bound itself did not.

<!-- @doubt -->
### Does the loop always take the same number of steps?

<!-- @answer -->
Almost, and the exception is small enough to be a curiosity rather than a concern. The bound is ceil(log2(n + 1)), and there is no early exit to introduce variance from the data. Measured averages are 10.00 at n = 1,024, 16.00 at n = 65,536, and 20.00 at n = 1,048,576 — identical to lower bound, and against Search X's 19.50 at the last size, which could stop early. The count is *exactly* constant only when n is one less than a power of two: at n = 15 every one of the 18 distinct probes takes 4 iterations, while at n = 16 seventeen take 4 and two take 5. The extra step goes to probes whose answer is n.

<!-- @doubt -->
### Which standard library function is this?

<!-- @answer -->
`std::upper_bound` in C++, `bisect.bisect_right` in Python, and in Java there is no direct equivalent — `Arrays.binarySearch` returns an arbitrary matching index and gives no guarantee about which duplicate, so upper bound has to be written by hand. The Python naming is the clearest of the three: `bisect_left` and `bisect_right` say exactly what the pair does, which is insert to the left or the right of any existing copies. That is the same distinction as `<` versus `<=`, phrased from the caller's side.
