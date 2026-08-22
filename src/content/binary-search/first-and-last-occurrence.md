---
id: first-and-last-occurrence
topic: Binary Search
title: First and Last Occurrence
difficulty: Easy
status: ready
prerequisites:
  - lower-bound
  - upper-bound
  - floor-and-ceil-in-sorted-array
  - integer-overflow-and-precision-errors
relatedIds:
  - lower-bound
  - upper-bound
  - count-occurrences-in-a-sorted-array
  - search-x-in-sorted-array
  - floor-and-ceil-in-sorted-array
---

<!-- @summary -->
The first and last index of x are lower bound and upper bound minus one, with a single equality test standing in for the whole "not found" case. The measured lesson is about the approach most people write instead — find any occurrence, then walk outward — which is faster than the correct answer on the arrays you would test it with and 2,312x slower on the one the problem exists to test.

<!-- @theory -->
## The problem

Given a sorted array and a value x, return the first and last index at which x
appears, or `[-1, -1]` if it does not appear at all.

```
a = [5, 7, 7, 8, 8, 10]

x = 8   ->  [3, 4]
x = 7   ->  [1, 2]
x = 6   ->  [-1, -1]
x = 5   ->  [0, 0]      a single occurrence is still a range
```

## Both indices are bounds you already have

Lower bound is the first index with `a[i] >= x`. If x is present at all, nothing
equal to x sits before that index and `a[lo]` is x — so **lower bound is the
first occurrence**.

Upper bound is the first index with `a[i] > x`, which is one past the last copy
of x — so **upper bound minus one is the last occurrence**.

```
first = lowerBound(x)
last  = upperBound(x) - 1
```

## Absence is one comparison, not a separate search

The natural worry is that both formulas assume x is present. It turns out the two
bounds answer that question themselves: if x does not appear, there is nothing
between "first index at least x" and "first index greater than x", so the two
bounds land on the same position.

```
lowerBound(x) == upperBound(x)   if and only if   x is absent
```

Measured over every sorted array of length 0 to 10 drawn from `{0,1,2,3}` with
every probe from -1 to 4 — **6,006 cases, and the rule agrees on all 6,006.**
There is no separate membership test to write and no extra descent to pay for.
Of those cases 2,860 have x present and 3,146 do not, so this is not a rare path.

That single comparison also removes the trap in the formulas: `upperBound(x) - 1`
would be -1 when x is below everything, but that branch is unreachable once
`lo == hi` has already returned.

## The approach everyone writes instead

Binary search for *any* occurrence of x, then walk left while the previous
element still equals x and right while the next one does. It is correct — 0 wrong
over the same 6,006 exhaustive cases — and it is what a majority of solutions look
like.

Its complexity is O(log n + d), where d is the number of copies of x. That looks
harmless. It is not, because d is the thing this problem is about.

Measured at n = 1,048,576, with every element equal to the same value:

| | ns per query |
|---|---|
| find one, then expand | 362,689.2 |
| two bounds | 156.9 |
| | **2,312x** |

362 microseconds against 157 nanoseconds. And the reason this survives review is
the other half of the measurement — on an array where each value appears twice,
which is what a hand-written test looks like, the expanding version is
**faster**:

| n | linear scan | find one, then expand | two bounds |
|---|---|---|---|
| 16 | 19.20 | 18.50 | 12.52 |
| 64 | 90.76 | 23.82 | 19.31 |
| 256 | 388.14 | 32.04 | 28.96 |
| 1,024 | 1,577.51 | 40.54 | 39.48 |
| 65,536 | - | **93.48** | 100.23 |
| 1,048,576 | - | **151.47** | 170.97 |

At n = 1,048,576 with two copies per value it beats the correct answer by 1.13x,
because its early exit stops the descent short. So the wrong-complexity solution
wins on the input you would test it with and loses by three orders of magnitude
on the input the problem was written to test. That is a much more dangerous
failure than being slower everywhere.

## Does fusing the two descents ever pay?

The Upper Bound container measured that computing both bounds from one shared
descent — the shape `std::equal_range` has — was 1.24x to 2.20x *slower* than two
independent descents, and left one objection open: those tests had at most 16
copies of each value, and maybe sharing pays when duplicates are dense.

This is the problem where that question belongs, so here is the answer. At
n = 1,048,576 with half the probes present, sweeping the number of copies d of
each value:

| d | two bounds | shared descent | shared / two | comparisons, two | comparisons, shared | work saved |
|---|---|---|---|---|---|---|
| 1 | 181.73 | 227.37 | 1.25x | 40.00 | 20.50 | **48.8%** |
| 4 | 173.03 | 222.72 | 1.29x | 40.00 | 21.50 | 46.3% |
| 16 | 171.25 | 212.22 | 1.24x | 40.00 | 22.50 | 43.8% |
| 64 | 171.73 | 202.22 | 1.18x | 40.00 | 23.51 | 41.2% |
| 256 | 175.09 | 190.59 | 1.09x | 40.00 | 24.50 | 38.7% |
| 4,096 | 192.75 | 163.78 | **0.85x** | 40.00 | 26.45 | 33.9% |
| 65,536 | 182.67 | 119.92 | 0.66x | 40.03 | 28.38 | 29.1% |
| 1,048,576 | 182.76 | 105.82 | **0.58x** | 40.50 | 29.95 | **26.1%** |

So yes — it pays, from somewhere between 256 and 4,096 copies per value, reaching
1.72x faster when every element is identical.

Now read the last two columns against the first two. **The shared descent saves
the most work exactly where it is slowest, and the least work exactly where it is
fastest.** At d = 1 it does 48.8% fewer comparisons and runs 1.25x slower. At
d = n it does only 26.1% fewer comparisons and runs 1.72x faster. The two
quantities move in opposite directions across the whole sweep.

The explanation is in how deep the three-way loop goes before it lands on x,
because every level it descends is one unpredictable three-way branch:

| d | mean depth before hitting x | std dev | max |
|---|---|---|---|
| 1 | 19.00 | 1.41 | 20 |
| 16 | 15.00 | 1.41 | 17 |
| 256 | 11.00 | 1.40 | 13 |
| 4,096 | 7.05 | 1.32 | 9 |
| 65,536 | 3.38 | 0.99 | 5 |
| 1,048,576 | **1.00** | **0.00** | 1 |

When every element is the same value, the very first probe hits `==` on every
single call — depth 1, zero variance, a branch the predictor gets right every
time. When values are distinct, the loop makes nineteen three-way decisions
before it lands, none of them predictable.

The comparisons saved are counted in fractions of a nanosecond. The
mispredictions are counted in tens. That is why the column that looks like the
benefit is the one that tracks the cost.

<!-- @intuition -->
The instinct is that finding both ends means finding x first and then figuring out how far it extends — which is why the expanding version is what most people reach for. The reframing that fixes it is to stop thinking about x as a thing to find and start thinking about the two places the array changes: the position where values stop being smaller than x, and the position where they start being larger. Those two boundaries exist whether or not x is in the array, they are exactly lower bound and upper bound, and the gap between them *is* the run of x. Absence is then not a case to handle but a gap of width zero. Once the answer is a boundary pair rather than a search target, the number of duplicates stops mattering — you never touch them, you only locate their edges.

<!-- @approach -->
### Linear Scan

<!-- @idea -->
Walk the whole array, remembering the first index where x appeared and overwriting the last one each time it appears again.

<!-- @steps -->
1. Start with both answers set to -1.
2. Walk every index from the front.
3. On the first match, record it as the first occurrence.
4. On every match, overwrite the last occurrence.
5. If nothing ever matched, both answers are still -1, which is the required output.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The definitions written out directly. Measured 19.20ns at n = 16 and 1,577.51ns at n = 1,024 against 12.52ns and 39.48ns for the two-bound version — already 40x behind at n = 1,024. Worth writing once because it makes the shape of the answer obvious: one contiguous run, so only its two edges matter.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> searchRange(const vector<int>& a, int x) {
    int first = -1, last = -1;
    for (int i = 0; i < (int)a.size(); i++) {
        if (a[i] == x) { if (first < 0) first = i; last = i; }
    }
    return {first, last};
}
```

<!-- @annotations -->
- 5: Both start at -1, so the "not found" answer needs no separate branch — it is what remains when nothing is written.
- 7: First is written once and last is overwritten on every match. Writing first unconditionally would give the last occurrence twice.
- 9: The array is sorted, so the matches form one contiguous run — which is the fact every faster approach exploits.

<!-- @code java -->
```java
static int[] searchRange(int[] a, int x) {
    int first = -1, last = -1;
    for (int i = 0; i < a.length; i++) {
        if (a[i] == x) { if (first < 0) first = i; last = i; }
    }
    return new int[] { first, last };
}
```

<!-- @annotations -->
- 4: No early exit is possible in this form, because the last occurrence is not known until the run ends.

<!-- @code python -->
```python
def search_range(a, x):
    first = last = -1
    for i, v in enumerate(a):
        if v == x:
            if first < 0:
                first = i
            last = i
    return [first, last]


# Sortedness is never used here, which is exactly why this
# is O(n) and everything below is not.
```

<!-- @annotations -->
- 2: -1 is safe as a sentinel here because the answers are indices, which are never negative. That is not true of the value-returning problems.

<!-- @approach -->
### Find One, Then Expand

<!-- @idea -->
Binary search for any occurrence of x, then walk outward in both directions while the neighbouring elements still equal x.

<!-- @steps -->
1. Run an ordinary Search X to find any index holding x.
2. If nothing was found, return [-1, -1].
3. From that index, walk left while the previous element equals x.
4. From that index, walk right while the next element equals x.
5. Return the two endpoints reached.

<!-- @complexity -->
- time: O(log n + d), where d is the number of copies of x — the walk is linear in the answer's own width
- space: O(1)
- note: Correct on all 6,006 exhaustive cases, and the trap of this subtopic. With two copies per value it is *faster* than the correct answer at large n — 151.47ns against 170.97ns at n = 1,048,576 — because it exits the descent early. On an array where every element is equal it measures 362,689.2ns against 156.9ns: **2,312x slower**.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// Correct, but the walk is linear in the number of duplicates.
vector<int> searchRange(const vector<int>& a, int x) {
    int n = (int)a.size();
    int lo = 0, hi = n - 1, at = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) { at = mid; break; }
        if (a[mid] < x) lo = mid + 1;
        else            hi = mid - 1;
    }
    if (at < 0) return {-1, -1};

    int i = at; while (i > 0     && a[i - 1] == x) i--;
    int j = at; while (j + 1 < n && a[j + 1] == x) j++;
    return {i, j};
}
```

<!-- @annotations -->
- 4: The comment is the whole review note. Nothing here is incorrect; the complexity is wrong in a way that only shows up on inputs with many duplicates.
- 10: The early exit lands on an arbitrary occurrence, which is why the walk is needed at all. Lower bound has no early exit and therefore needs no walk.
- 14: Returning before either walk, so a missing x costs only the descent.
- 16: The bounds test comes first, so the walk never reads a[-1]. Swapping the two halves reads before the array.
- 17: The mirror walk. Together these two lines are O(d) — on an array of a million equal elements they touch a million elements to report two numbers.

<!-- @code java -->
```java
// Correct, but the walk is linear in the number of duplicates.
static int[] searchRange(int[] a, int x) {
    int n = a.length, lo = 0, hi = n - 1, at = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) { at = mid; break; }
        if (a[mid] < x) lo = mid + 1;
        else            hi = mid - 1;
    }
    if (at < 0) return new int[] { -1, -1 };
    int i = at; while (i > 0     && a[i - 1] == x) i--;
    int j = at; while (j + 1 < n && a[j + 1] == x) j++;
    return new int[] { i, j };
}
```

<!-- @annotations -->
- 5: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int from n = 1,073,741,825.
- 11: Java short-circuits && left to right, so the index test protects the array access here exactly as it does in C++.

<!-- @code python -->
```python
def search_range(a, x):
    n = len(a)
    lo, hi, at = 0, n - 1, -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x:
            at = mid
            break
        if a[mid] < x:
            lo = mid + 1
        else:
            hi = mid - 1
    if at < 0:
        return [-1, -1]
    i = at
    while i > 0 and a[i - 1] == x:
        i -= 1
    j = at
    while j + 1 < n and a[j + 1] == x:
        j += 1
    return [i, j]
```

<!-- @annotations -->
- 16: `i > 0` must be tested first. Without it a[-1] wraps to the last element of the array and the walk can run off the front silently.
- 19: In Python the two walks are interpreted loops, so the O(d) term is far more expensive per step than it is in C++ — the same shape, magnified.

<!-- @approach -->
### Lower Bound and Upper Bound

<!-- @idea -->
The first occurrence is the lower bound and the last is the upper bound minus one; the two being equal is exactly the condition for x being absent.

<!-- @steps -->
1. Compute the lower bound of x — the first index holding something at least x.
2. Compute the upper bound of x — the first index holding something greater than x.
3. If the two are equal, x does not appear anywhere; return [-1, -1].
4. Otherwise the lower bound is the first occurrence.
5. The upper bound minus one is the last occurrence.

<!-- @complexity -->
- time: O(log n), two descents, independent of how many copies of x exist
- space: O(1)
- note: The answer. Measured 12.52ns at n = 16 and 170.97ns at n = 1,048,576, and — the point — unchanged by duplicate density: 156.9ns on an array of a million identical elements, where the expanding version takes 362,689.2ns. Fusing the two descents into one is slower until roughly 4,096 copies per value and 1.72x faster when every element is equal.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

vector<int> searchRange(const vector<int>& a, int x) {
    int lo = (int)(lower_bound(a.begin(), a.end(), x) - a.begin());
    int hi = (int)(upper_bound(a.begin(), a.end(), x) - a.begin());
    if (lo == hi) return {-1, -1};
    return {lo, hi - 1};
}
```

<!-- @annotations -->
- 6: lower_bound, not upper_bound. Upper bound would step past every copy of x and give one past the last occurrence instead of the first.
- 7: upper_bound, not lower_bound. This is the mirror mistake, and it would return the first occurrence minus one.
- 8: The whole "not found" case, in one comparison. The two bounds coincide if and only if x is absent — verified on all 6,006 exhaustive cases.
- 9: hi - 1 is safe only because line 8 already returned when the gap is empty. Reached on its own with hi = 0 it would produce -1.

<!-- @code java -->
```java
static int[] searchRange(int[] a, int x) {
    int lo = lowerBound(a, x);
    int hi = upperBound(a, x);
    if (lo == hi) return new int[] { -1, -1 };
    return new int[] { lo, hi - 1 };
}
```

<!-- @annotations -->
- 2: Java has neither bound in the standard library — Arrays.binarySearch gives no guarantee about which duplicate it returns, so both have to be written by hand.
- 4: One comparison replaces the membership test that Arrays.binarySearch would have made you do separately.

<!-- @code python -->
```python
from bisect import bisect_left, bisect_right


def search_range(a, x):
    lo = bisect_left(a, x)
    hi = bisect_right(a, x)
    if lo == hi:
        return [-1, -1]
    return [lo, hi - 1]


# hi - lo is the number of copies of x, which is the next
# subtopic with no new algorithm required.
```

<!-- @annotations -->
- 5: bisect_left is lower bound and bisect_right is upper bound. Swapping them returns a reversed, off-by-one pair rather than raising anything.
- 7: Absence as a gap of width zero rather than a special case discovered by searching.

<!-- @example -->

<!-- @input -->
```
a = [5, 7, 7, 8, 8, 10], x = 8
```

<!-- @output -->
```
[3, 4]
```

<!-- @why -->
The two 8s sit at indices 3 and 4. Lower bound stops in front of them and upper bound stops just past them, so the answer is the pair of edges without ever touching what lies between.

<!-- @walkthrough -->
```
lowerBound(8):
  lo=0 hi=6  mid=3  a[3]=8   8 <  8? no    hi = 3
  lo=0 hi=3  mid=1  a[1]=7   7 <  8? yes   lo = 2
  lo=2 hi=3  mid=2  a[2]=7   7 <  8? yes   lo = 3
  lo == hi -> 3          first occurrence

upperBound(8):
  lo=0 hi=6  mid=3  a[3]=8   8 <= 8? yes   lo = 4
  lo=4 hi=6  mid=5  a[5]=10  10 <= 8? no   hi = 5
  lo=4 hi=5  mid=4  a[4]=8   8 <= 8? yes   lo = 5
  lo == hi -> 5          last occurrence is 5 - 1 = 4

3 != 5, so x is present. Six probes total, and neither
descent ever compared the two 8s against each other.
```

<!-- @example -->

<!-- @input -->
```
a = [5, 7, 7, 8, 8, 10], x = 6
```

<!-- @output -->
```
[-1, -1]
```

<!-- @why -->
6 is absent, so both bounds land on the same position — index 1, where 6 would be inserted. Equality is the entire membership test.

<!-- @walkthrough -->
```
lowerBound(6):
  lo=0 hi=6  mid=3  a[3]=8   8 < 6? no     hi = 3
  lo=0 hi=3  mid=1  a[1]=7   7 < 6? no     hi = 1
  lo=0 hi=1  mid=0  a[0]=5   5 < 6? yes    lo = 1
  -> 1

upperBound(6):  identical path, since no element equals 6
  -> 1

lo == hi == 1, so return [-1, -1].

Note what did NOT happen: no separate search for whether 6
exists, and no risk from hi - 1, because that line is never
reached.
```

<!-- @example -->

<!-- @input -->
```
a = [2, 2, 2, 2, 2], x = 2
```

<!-- @output -->
```
[0, 4]
```

<!-- @why -->
Every element matches. This is the shape that separates the two binary approaches: the bounds still take about log n probes, while the expanding version walks the entire array.

<!-- @walkthrough -->
```
lowerBound(2) = 0        3 probes
upperBound(2) = 5        3 probes
0 != 5  ->  [0, 4]

Find one, then expand, on the same input:
  binary search hits index 2 immediately
  walk left  : 2 -> 1 -> 0        2 steps
  walk right : 2 -> 3 -> 4        2 steps

At n = 5 that is nothing. Scaled to n = 1,048,576 with
every element equal, the walk becomes 1,048,575 steps and
the measured gap is 2,312x.
```

<!-- @example -->

<!-- @input -->
```
a = [], x = 0
```

<!-- @output -->
```
[-1, -1]
```

<!-- @why -->
Both bounds are 0 on an empty array, so the equality test fires and no indexing happens at all. No special case is needed for the empty input.

<!-- @walkthrough -->
```
lowerBound(0) = 0   the loop never runs
upperBound(0) = 0   the loop never runs
lo == hi -> [-1, -1]

This is also the input that shows why the equality test has
to come before hi - 1: with hi = 0, hi - 1 would be -1, and
that is not a valid index anywhere.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the two bounds as the edges of the run of x, with absence as a gap of width zero, then the two measured results: the expanding approach that wins on light duplicates and loses by 2,312x on heavy ones, and the shared descent whose work saved and time saved move in opposite directions.

<!-- @sampleInput -->
```json
{"primary":{"array":[5,7,7,8,8,10],"probes":[{"x":8,"answer":[3,4]},{"x":7,"answer":[1,2]},{"x":6,"answer":[-1,-1],"note":"both bounds land on 1"},{"x":5,"answer":[0,0],"note":"a single occurrence is still a range"}],"trace":{"x":8,"lowerBound":[{"lo":0,"hi":6,"mid":3,"value":8,"test":"8 < 8","result":false,"action":"hi = 3"},{"lo":0,"hi":3,"mid":1,"value":7,"test":"7 < 8","result":true,"action":"lo = 2"},{"lo":2,"hi":3,"mid":2,"value":7,"test":"7 < 8","result":true,"action":"lo = 3"}],"first":3,"upperBound":[{"lo":0,"hi":6,"mid":3,"value":8,"test":"8 <= 8","result":true,"action":"lo = 4"},{"lo":4,"hi":6,"mid":5,"value":10,"test":"10 <= 8","result":false,"action":"hi = 5"},{"lo":4,"hi":5,"mid":4,"value":8,"test":"8 <= 8","result":true,"action":"lo = 5"}],"upper":5,"last":4,"note":"neither descent ever compared the two 8s against each other"}},"identities":{"first":"lowerBound(x)","last":"upperBound(x) - 1","absent":"lowerBound(x) == upperBound(x)","verified":{"cases":6006,"space":"every sorted array of length 0..10 over {0,1,2,3}, probes -1..4","present":2860,"absent":3146,"twoBoundsWrong":0,"expandWrong":0,"sharedWrong":0,"absenceRuleAgrees":6006}},"expandTrap":{"complexity":"O(log n + d), d = number of copies of x","correct":true,"lightDuplicates":{"copiesPerValue":2,"rows":[{"n":16,"scan":19.20,"expand":18.50,"two":12.52},{"n":64,"scan":90.76,"expand":23.82,"two":19.31},{"n":256,"scan":388.14,"expand":32.04,"two":28.96},{"n":1024,"scan":1577.51,"expand":40.54,"two":39.48},{"n":65536,"expand":93.48,"two":100.23},{"n":1048576,"expand":151.47,"two":170.97}],"reading":"at large n it BEATS the correct answer by 1.13x, because the early exit stops the descent short"},"heavyDuplicates":{"n":1048576,"everyElementEqual":true,"expandNs":362689.2,"twoNs":156.9,"ratio":2312},"danger":"wins on the input you would test it with, loses by three orders of magnitude on the input the problem exists to test"},"sharedDescent":{"question":"left open in the Upper Bound container, where 16 copies per value was the densest tested","n":1048576,"halfPresent":true,"sweep":[{"d":1,"two":181.73,"shared":227.37,"ratio":1.25,"cmpTwo":40.00,"cmpShared":20.50,"workSaved":48.8},{"d":4,"two":173.03,"shared":222.72,"ratio":1.29,"cmpTwo":40.00,"cmpShared":21.50,"workSaved":46.3},{"d":16,"two":171.25,"shared":212.22,"ratio":1.24,"cmpTwo":40.00,"cmpShared":22.50,"workSaved":43.8},{"d":64,"two":171.73,"shared":202.22,"ratio":1.18,"cmpTwo":40.00,"cmpShared":23.51,"workSaved":41.2},{"d":256,"two":175.09,"shared":190.59,"ratio":1.09,"cmpTwo":40.00,"cmpShared":24.50,"workSaved":38.7},{"d":4096,"two":192.75,"shared":163.78,"ratio":0.85,"cmpTwo":40.00,"cmpShared":26.45,"workSaved":33.9},{"d":65536,"two":182.67,"shared":119.92,"ratio":0.66,"cmpTwo":40.03,"cmpShared":28.38,"workSaved":29.1},{"d":1048576,"two":182.76,"shared":105.82,"ratio":0.58,"cmpTwo":40.50,"cmpShared":29.95,"workSaved":26.1}],"crossover":"between 256 and 4,096 copies per value","headline":"work saved and time saved move in OPPOSITE directions across the whole sweep","depth":[{"d":1,"mean":19.00,"sd":1.41,"max":20},{"d":16,"mean":15.00,"sd":1.41,"max":17},{"d":256,"mean":11.00,"sd":1.40,"max":13},{"d":4096,"mean":7.05,"sd":1.32,"max":9},{"d":65536,"mean":3.38,"sd":0.99,"max":5},{"d":1048576,"mean":1.00,"sd":0.00,"max":1}],"mechanism":"every level of the three-way loop is one unpredictable branch; at d = n the first probe hits == on every call (depth 1, zero variance) and the predictor is never wrong"},"assertions":["first <= last whenever x is present","a[first] == x and a[last] == x whenever x is present","first - 1 is below x or does not exist","last + 1 is above x or does not exist","last - first + 1 is the number of copies of x","the two bounds coincide exactly when x is absent"]}
```

<!-- @highlights -->
- First is `lowerBound(x)`, last is `upperBound(x) - 1` — the two edges of the run, never the run itself.
- Absence is one comparison: the bounds coincide if and only if x is missing, verified on all 6,006 exhaustive cases.
- The expanding approach is correct and O(log n + d) — d is exactly the quantity the problem is about.
- On light duplicates the expanding version is 1.13x *faster* than the right answer; on a million equal elements it is 2,312x slower.
- The shared descent finally wins past roughly 4,096 copies per value, reaching 1.72x.
- Across that whole sweep, the shared descent saves the most comparisons exactly where it runs slowest.

<!-- @edgeCases -->
- An empty array — both bounds are 0, the equality test fires, and no indexing happens.
- x absent — the two bounds coincide, which is the only membership test needed.
- x absent and below everything — both bounds are 0, so `hi - 1` would be -1 if the equality test had not already returned.
- x absent and above everything — both bounds are n, and `lo` would be an invalid index for the same reason.
- x appearing exactly once — first equals last, which is a valid range rather than a special case.
- Every element equal to x — the answer is [0, n-1], and this is where the expanding approach costs 2,312x.
- A single-element array — [0, 0] when it matches and [-1, -1] when it does not.
- Using `upperBound(x)` directly as the last index — it is one past the end of the run, not the end.
- n above 1,073,741,824 — where `(lo + hi) / 2` overflows an int, exactly as in Lower Bound.
- An unsorted array — every version terminates and every answer is meaningless; nothing checks the precondition.

<!-- @pitfalls -->
- Walking outward from a found occurrence. Correct, but O(d) — measured 2,312x slower than two bounds on a million equal elements.
- Trusting a benchmark with few duplicates. The expanding version is *faster* there — 151.47ns against 170.97ns at n = 1,048,576 with two copies per value — which is exactly why the bug ships.
- Using `upperBound(x)` as the last index. It is one past the last occurrence; the answer needs the minus one.
- Using `lowerBound(x) - 1` as the first index. That is the last element below x, not the first copy of x.
- Writing a separate membership search before computing the bounds. The bounds already answer it — they coincide if and only if x is absent.
- Computing `hi - 1` before checking `lo == hi`. On an x below everything that produces -1 as a genuine index rather than as the sentinel.
- Assuming the fused `equal_range`-shaped descent is always slower. It is, until about 4,096 copies per value, and then it is up to 1.72x faster.
- Assuming it is always faster because it does less work. It does 48.8% fewer comparisons at d = 1 and still loses by 1.25x.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825.
- Reaching for a linear scan on small input. It is already 1.5x behind at n = 16 and 40x behind at n = 1,024.

<!-- @doubt -->
### Why is `lowerBound == upperBound` the same as "x is absent"?

<!-- @answer -->
Because the two bounds are the two edges of the run of x, and a run of nothing has no width. Lower bound is the first position where values stop being smaller than x; upper bound is the first position where they start being larger. Everything strictly between those two positions equals x. If x never appears there is nothing between them, so they are the same position — the place x would be inserted. If x appears k times they are exactly k apart. Verified on all 6,006 exhaustive cases, with 2,860 present and 3,146 absent, and the rule agreed on every one. That is also why `hi - lo` is the occurrence count, which is the next subtopic and needs no new algorithm.

<!-- @doubt -->
### Is "find one, then expand" actually wrong?

<!-- @answer -->
Not incorrect — it produced the right answer on all 6,006 exhaustive cases — but it has the wrong complexity in the one dimension this problem measures. It is O(log n + d) where d is the number of copies of x, and d is the whole point of asking for a *range*. Measured at n = 1,048,576 with every element equal: 362,689.2ns against 156.9ns, a factor of **2,312**. What makes it genuinely dangerous rather than merely slow is the other measurement: with two copies per value, the density a hand-written test tends to have, it is *faster* than the correct version at large n — 151.47ns against 170.97ns — because its early exit cuts the descent short. It passes the tests you would write and collapses on the input the problem was designed around.

<!-- @doubt -->
### The Upper Bound container said the fused descent always loses. Does it?

<!-- @answer -->
No, and that container said so with an explicit caveat: it had tested at most 16 copies of each value. Sweeping properly at n = 1,048,576, the shared descent is 1.24x to 1.29x slower from 1 to 16 copies, narrows to 1.09x at 256, crosses over between 256 and 4,096, and reaches **0.58x — 1.72x faster** when every element is identical. So the earlier conclusion was right about the range it measured and wrong as a general claim. If your data has thousands of duplicates per distinct value, `std::equal_range` and its shape are the better choice; below a few hundred, two independent descents win.

<!-- @doubt -->
### How can saving more comparisons make it slower?

<!-- @answer -->
Because the two costs are not measured in the same units. Across the sweep the shared descent saves 48.8% of comparisons at d = 1 and only 26.1% at d = n — and it is 1.25x slower at the first and 1.72x faster at the second. The quantity that actually tracks the time is how deep the three-way loop goes before it lands on x, because every one of those levels is a branch on data the predictor cannot learn. Measured: at d = 1 it descends 19.00 levels on average with a standard deviation of 1.41; at d = n it descends **1.00 level with a standard deviation of 0.00** — the first probe hits `==` on every single call, so the branch is right every time. Fewer comparisons at a few tenths of a nanosecond each cannot pay for nineteen mispredictions at tens of nanoseconds each.

<!-- @doubt -->
### Should I just call `std::equal_range`?

<!-- @answer -->
It is the right interface and it returns exactly this pair, so for readability yes. Be aware of what you are choosing on performance: libstdc++ and libc++ implement it as the shared-descent shape measured above, which is the version that loses below a few hundred duplicates per value and wins above a few thousand. If the code is hot and your data has light duplication, `lower_bound` and `upper_bound` called separately measured 1.24x faster at 16 copies per value. If your data is heavily duplicated, `equal_range` is the better call by up to 1.72x. If you do not know, two separate calls are the safer default because their cost does not depend on the data at all.

<!-- @doubt -->
### Why does the last occurrence need the minus one?

<!-- @answer -->
Because upper bound is a boundary, not an element. It returns the first index holding something *greater* than x, which is one position past the final copy — the same convention that made `upperBound(x) - 1` the floor in the previous subtopic. On `[5,7,7,8,8,10]` with x = 8, upper bound is 5, and index 5 holds 10; the last 8 is at index 4. The minus one is safe here only because the `lo == hi` test has already returned for absent values: on an x below everything, upper bound is 0 and `0 - 1` would hand back -1 as a real index rather than as the not-found sentinel.

<!-- @doubt -->
### Do I need to handle the empty array separately?

<!-- @answer -->
No. Both bounds return 0 on an empty array — their loops simply never run — so `lo == hi` fires and the function returns [-1, -1] without indexing anything. That falls out of choosing `hi = n` rather than `hi = n - 1` for the bound loops, which is the same decision that made n a valid answer back in Lower Bound. The expanding approach also handles it, but for a different and more fragile reason: its search fails, so it returns before reaching the walks that would have read out of bounds.
