---
id: count-occurrences-in-a-sorted-array
topic: Binary Search
title: Count Occurrences in a Sorted Array
difficulty: Easy
status: ready
prerequisites:
  - lower-bound
  - upper-bound
  - first-and-last-occurrence
relatedIds:
  - first-and-last-occurrence
  - lower-bound
  - upper-bound
  - search-x-in-sorted-array
  - floor-and-ceil-in-sorted-array
---

<!-- @summary -->
The count is the gap between the two bounds and needs no new algorithm — the whole subtopic is the idea that you can compute a number of size d without ever touching d elements. Two measured surprises come with it: the linear scan wins up to about n = 500 here because counting vectorises and searching does not, and once you have thousands of queries the right answer stops being binary search altogether.

<!-- @theory -->
## The problem

Given a sorted array and a value x, return how many times x appears.

```
a = [5, 7, 7, 8, 8, 10]

x = 8   ->  2
x = 7   ->  2
x = 5   ->  1
x = 6   ->  0
```

## The count is the gap

The previous subtopic established that lower bound and upper bound are the two
edges of the run of x. The number of elements between two positions is their
difference, so:

```
count = upperBound(x) - lowerBound(x)
```

Verified over every sorted array of length 0 to 10 drawn from `{0,1,2,3}` with
every probe from -1 to 4 — **6,006 cases, 0 wrong.** That includes the 3,146
cases where x is absent, which is **52.38%** of them: an absent value gives two
equal bounds and a difference of zero, so there is no membership test to write
and no zero case to special-case.

## Where the "+1" belongs

The most common bug here is writing `upper - lower + 1`, and it is worth
understanding rather than memorising, because the instinct behind it is correct
in a neighbouring context.

An **inclusive index range** does need the plus one. The previous subtopic
returned `first` and `last` as actual indices, and the number of elements from
`first` to `last` inclusive is `last - first + 1`. Measured: that form equals the
count on **2,860 of 2,860** cases where x is present.

A **half-open bound pair** does not. `lowerBound` is the first index of the run
and `upperBound` is one *past* the last, so the difference is already the width.
Measured: `upper - lower` equals the count on **6,006 of 6,006** cases, absent
values included.

Both are right about the same array. They differ because `last` is an element and
`upperBound` is a boundary, and only one of those is inside the run. Substituting
one convention's arithmetic into the other's variables is wrong on 100.00% of
cases in either direction.

Note also which form survives absence: `last - first + 1` is meaningless when
`first` is -1, while `upper - lower` simply gives zero.

## Counting without enumerating

The interesting property of this problem is easy to miss because the answer looks
so small. The output is a number that can be as large as n, and computing it
costs O(log n) — you produce a count of a million while reading twenty elements.

That is exactly what the popular alternative gives up. Find any occurrence, then
walk outward counting: correct on all 6,006 exhaustive cases, and O(log n + d)
where d is the answer itself. Here the instinct that you must look at all d copies
to know there are d of them feels almost reasonable, and it is wrong — the
boundaries carry the count without the interior being touched.

Measured at n = 1,048,576 with every element equal:

| | ns per query |
|---|---|
| expand and count | 359,744.0 |
| upper - lower | 171.7 |
| | **2,096x** |

And, as in the previous subtopic, the trap hides on light data. With two copies of
each value the expanding version is *faster* at large n, because its early exit
cuts the descent short:

| n | linear scan | expand and count | upper - lower |
|---|---|---|---|
| 16 | **3.06** | 18.51 | 11.60 |
| 64 | **6.18** | 23.15 | 17.98 |
| 256 | **18.01** | 30.46 | 26.40 |
| 1,024 | 66.83 | 38.81 | **37.16** |
| 65,536 | - | **91.61** | 96.92 |
| 1,048,576 | - | **149.81** | 166.11 |

## The linear scan wins for longer here than anywhere else

Look at the first column again. In every earlier subtopic the linear scan lost at
every size — Lower Bound measured it three times slower already at n = 64. Here it
is the **fastest of the three up to n = 256**, and only loses at n = 1,024.

The reason is in the generated code. Counting has no early exit, no dependent
loads, and no data-dependent control flow — every element is compared and the
results are summed — which is precisely the shape a compiler can vectorise. The
binary search cannot be vectorised at all, because each probe's address depends
on the previous probe's result.

| | instructions | vector instructions |
|---|---|---|
| linear count | 47 | **17** |
| upper - lower | 27 | 0 |

Clang emits `cmeq.4s` against four separate accumulators, comparing sixteen
elements per iteration. That is why an O(n) loop beats an O(log n) one up to
several hundred elements: the constant factor is roughly a sixteenth of what the
complexity class suggests. The crossover in this container sits near **n = 500**,
where in the search-based subtopics it sat below n = 16.

This does not change which algorithm to write for large inputs. It does mean the
usual advice — "binary search is always better past a handful of elements" — was
an artefact of the problems it was measured on.

## Many queries change the answer entirely

Everything above assumes one count per array. If you have k of them, the right
structure is not a binary search at all past a certain k.

At n = 1,048,576 with 1,024 distinct values and 1,024 copies of each, total
milliseconds to answer k queries three ways: repeated `upper - lower`; one pass
building a hash map then k O(1) lookups; and one pass compressing the array into a
run table of (value, count) pairs, then binary searching that much smaller table.

| k | k binary searches | one pass + hash | one pass + run table |
|---|---|---|---|
| 2,000 | **0.35** | 4.88 | 0.65 |
| 4,000 | **0.68** | 4.92 | 0.73 |
| 5,000 | 0.95 | 4.94 | **0.77** |
| 8,000 | 1.37 | 4.97 | **0.89** |
| 100,000 | 17.36 | 6.08 | **4.78** |
| 150,000 | 26.61 | **6.65** | 6.86 |
| 300,000 | 56.94 | **8.37** | 13.14 |

Three regimes, with both crossovers measured rather than estimated:

- **below about k = 4,500** — plain binary searches, because any precomputation
  costs more than it saves
- **about 4,500 to 140,000** — the run table, which costs 0.4ms to build and then
  searches 1,024 entries in 8 KB instead of 1,048,576 entries in 4 MB
- **above about 140,000** — the hash map, whose 4.9ms build finally amortises
  against O(1) lookups

The run table is worth noticing because it is the option sortedness makes
available and a hash map does not need: the array is already grouped, so one
sequential pass produces every count at once.

<!-- @intuition -->
The trap in this problem is that the answer's size and the answer's cost feel like they should be related. If x appears a million times, surely finding that out means acknowledging a million things? It does not, and the reason is that a sorted array has already done the work — the copies are contiguous, so the run is fully described by where it starts and where it ends. Counting is then subtraction, and the interior is never read. Holding that idea makes the rest of the module easier: almost every remaining problem is about locating a boundary rather than examining the data on either side of it, and any solution whose cost scales with what it found rather than where it looked has skipped the point.

<!-- @approach -->
### Linear Scan

<!-- @idea -->
Walk the whole array and increment a counter on every element equal to x.

<!-- @steps -->
1. Start a counter at zero.
2. Compare every element against x.
3. Increment on each match.
4. Return the counter.
5. An absent value returns zero with no special handling.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The one place in this module where the scan is genuinely competitive — measured **fastest of the three up to n = 256** (3.06ns at n = 16 against 11.60ns for the bounds) and only losing from about n = 500. The loop has no early exit and no dependent loads, so clang vectorises it into 17 vector instructions comparing sixteen elements per iteration.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int countOccurrences(const vector<int>& a, int x) {
    int c = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        if (a[i] == x) c++;
    }
    return c;
}
```

<!-- @annotations -->
- 6: No break. Stopping early would make this faster on some inputs and unvectorisable on all of them — the absence of control flow is what lets the compiler compare sixteen elements at once.
- 7: This compiles to a vector compare and a masked add, not a branch. That is why an O(n) loop beats the O(log n) one below n = 500.
- 9: Zero falls out for an absent value, so there is no membership test.

<!-- @code java -->
```java
static int countOccurrences(int[] a, int x) {
    int c = 0;
    for (int v : a) {
        if (v == x) c++;
    }
    return c;
}
```

<!-- @annotations -->
- 3: The enhanced for loop compiles to the same indexed loop here, and the JIT vectorises it on the same reasoning as clang.

<!-- @code python -->
```python
def count_occurrences(a, x):
    return a.count(x)


# a.count runs in C and is far faster than an explicit
# Python loop, but it is still O(n) and still ignores the
# fact that the array is sorted.
```

<!-- @annotations -->
- 2: Written as the built-in because a hand-rolled Python loop is slower by a large constant and teaches nothing extra — the point is the complexity, not the syntax.

<!-- @approach -->
### Find One, Then Expand and Count

<!-- @idea -->
Binary search for any occurrence, then walk outward in both directions counting matches.

<!-- @steps -->
1. Run an ordinary Search X to find any index holding x.
2. If nothing was found, the count is zero.
3. Walk left while the previous element equals x.
4. Walk right while the next element equals x.
5. The count is the distance between the two endpoints, inclusive.

<!-- @complexity -->
- time: O(log n + d), where d is the count being returned — the cost scales with the answer
- space: O(1)
- note: Correct on all 6,006 exhaustive cases, and the trap. On light duplication it is *faster* than the bounds version at large n — 149.81ns against 166.11ns at n = 1,048,576 — because the early exit shortens the descent. On an array where every element is equal it measures 359,744.0ns against 171.7ns: **2,096x slower**.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// Correct, but the walk is linear in the count it returns.
int countOccurrences(const vector<int>& a, int x) {
    int n = (int)a.size();
    int lo = 0, hi = n - 1, at = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) { at = mid; break; }
        if (a[mid] < x) lo = mid + 1;
        else            hi = mid - 1;
    }
    if (at < 0) return 0;

    int i = at; while (i > 0     && a[i - 1] == x) i--;
    int j = at; while (j + 1 < n && a[j + 1] == x) j++;
    return j - i + 1;
}
```

<!-- @annotations -->
- 4: The whole review note. Nothing here is incorrect — the cost simply scales with the answer instead of with the search.
- 10: The early exit lands on an arbitrary copy, which is why the walks are needed. The bounds have no early exit and therefore need no walks.
- 16: The bounds test comes first, so the walk never reads a[-1]. Swapping the two halves reads before the array.
- 18: The plus one is correct *here*, because i and j are inclusive indices. It is the same plus one that is wrong when applied to the two bounds.

<!-- @code java -->
```java
// Correct, but the walk is linear in the count it returns.
static int countOccurrences(int[] a, int x) {
    int n = a.length, lo = 0, hi = n - 1, at = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) { at = mid; break; }
        if (a[mid] < x) lo = mid + 1;
        else            hi = mid - 1;
    }
    if (at < 0) return 0;
    int i = at; while (i > 0     && a[i - 1] == x) i--;
    int j = at; while (j + 1 < n && a[j + 1] == x) j++;
    return j - i + 1;
}
```

<!-- @annotations -->
- 5: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int from n = 1,073,741,825.
- 11: Java short-circuits && left to right, so the index test protects the array access exactly as it does in C++.

<!-- @code python -->
```python
def count_occurrences(a, x):
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
        return 0
    i = at
    while i > 0 and a[i - 1] == x:
        i -= 1
    j = at
    while j + 1 < n and a[j + 1] == x:
        j += 1
    return j - i + 1
```

<!-- @annotations -->
- 16: `i > 0` must be tested first. Without it a[-1] wraps to the last element and the walk runs off the front silently.
- 19: In Python these walks are interpreted loops, so the O(d) term costs far more per step than the same shape does in C++.

<!-- @approach -->
### Upper Bound Minus Lower Bound

<!-- @idea -->
The two bounds are the edges of the run, so their difference is its width — no membership test and no visit to the interior.

<!-- @steps -->
1. Compute the lower bound of x, the first index holding something at least x.
2. Compute the upper bound of x, the first index holding something greater than x.
3. Subtract.
4. An absent value makes the two coincide, so the difference is zero.
5. Nothing between the bounds is ever read.

<!-- @complexity -->
- time: O(log n), independent of how many copies exist
- space: O(1)
- note: Measured 11.60ns at n = 16 and 166.11ns at n = 1,048,576, and 171.7ns on an array of a million identical elements where the expanding version takes 359,744.0ns. It is the slowest of the three below n = 256 and the only one whose cost does not depend on the data.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

int countOccurrences(const vector<int>& a, int x) {
    int lo = (int)(lower_bound(a.begin(), a.end(), x) - a.begin());
    int hi = (int)(upper_bound(a.begin(), a.end(), x) - a.begin());
    return hi - lo;
}
```

<!-- @annotations -->
- 6: lower_bound gives the first index of the run. Using upper_bound here instead would subtract the two ends in the wrong order and give a negative count.
- 7: upper_bound gives one past the last index of the run, which is what makes the subtraction a width rather than a distance between elements.
- 8: No plus one. These are half-open bounds, not inclusive indices — the plus one belongs to `last - first + 1` and nowhere near this line.

<!-- @code java -->
```java
static int countOccurrences(int[] a, int x) {
    return upperBound(a, x) - lowerBound(a, x);
}
```

<!-- @annotations -->
- 2: Java has neither bound in the standard library, so both are hand-written. Arrays.binarySearch cannot substitute — it gives no guarantee about which duplicate it finds.

<!-- @code python -->
```python
from bisect import bisect_left, bisect_right


def count_occurrences(a, x):
    return bisect_right(a, x) - bisect_left(a, x)


# An absent x makes the two bounds equal, so this returns
# zero without any membership test.
```

<!-- @annotations -->
- 5: bisect_right minus bisect_left, in that order. Reversing them returns the negation, which is silently wrong rather than an error.

<!-- @example -->

<!-- @input -->
```
a = [5, 7, 7, 8, 8, 10], x = 8
```

<!-- @output -->
```
2
```

<!-- @why -->
The 8s occupy indices 3 and 4. Lower bound stops at 3 and upper bound stops at 5, and the difference is the width of the run — neither 8 was ever compared against the other.

<!-- @walkthrough -->
```
lowerBound(8):
  lo=0 hi=6  mid=3  a[3]=8   8 <  8? no    hi = 3
  lo=0 hi=3  mid=1  a[1]=7   7 <  8? yes   lo = 2
  lo=2 hi=3  mid=2  a[2]=7   7 <  8? yes   lo = 3
  -> 3

upperBound(8):
  lo=0 hi=6  mid=3  a[3]=8   8 <= 8? yes   lo = 4
  lo=4 hi=6  mid=5  a[5]=10  10 <= 8? no   hi = 5
  lo=4 hi=5  mid=4  a[4]=8   8 <= 8? yes   lo = 5
  -> 5

count = 5 - 3 = 2
```

<!-- @example -->

<!-- @input -->
```
a = [5, 7, 7, 8, 8, 10], x = 6
```

<!-- @output -->
```
0
```

<!-- @why -->
6 is absent, so both bounds land on index 1 and the difference is zero. Absence needs no branch — it is a run of width zero.

<!-- @walkthrough -->
```
lowerBound(6) = 1
upperBound(6) = 1     identical path, since nothing equals 6

count = 1 - 1 = 0

More than half the exhaustive cases look like this — 3,146
of 6,006, or 52.38% — so the zero path is the common one
rather than an edge case.
```

<!-- @example -->

<!-- @input -->
```
a = [2, 2, 2, 2, 2], x = 2
```

<!-- @output -->
```
5
```

<!-- @why -->
Every element matches, and this is the shape that separates the two binary approaches. The bounds still take three probes each; the expanding version walks the whole array.

<!-- @walkthrough -->
```
lowerBound(2) = 0        3 probes
upperBound(2) = 5        3 probes
count = 5 - 0 = 5        six probes total, five elements

Expand and count on the same input:
  search hits index 2
  walk left  : 2 -> 1 -> 0
  walk right : 2 -> 3 -> 4
  count = 4 - 0 + 1 = 5   nine element reads

At n = 5 that is nothing. Scaled to a million identical
elements the walk becomes 1,048,575 steps and the measured
gap is 2,096x.
```

<!-- @example -->

<!-- @input -->
```
a = [], x = 1
```

<!-- @output -->
```
0
```

<!-- @why -->
Both bounds are 0 on an empty array because their loops never run, so the difference is 0 and nothing is indexed. No guard is required.

<!-- @walkthrough -->
```
lowerBound(1) = 0
upperBound(1) = 0
count = 0

Compare with the first-and-last form, which would have to
return [-1, -1] here and could not use last - first + 1 at
all. Subtracting bounds degrades more gracefully than
subtracting indices.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the count as the width between the two bounds with the interior never read, then the two measured departures from the module's usual advice: the vectorised linear scan winning up to n = 256, and the three-regime crossover once many queries are batched.

<!-- @sampleInput -->
```json
{"primary":{"array":[5,7,7,8,8,10],"probes":[{"x":8,"count":2,"lower":3,"upper":5},{"x":7,"count":2,"lower":1,"upper":3},{"x":5,"count":1,"lower":0,"upper":1},{"x":6,"count":0,"lower":1,"upper":1,"note":"a run of width zero"}],"trace":{"x":8,"lowerBound":[{"lo":0,"hi":6,"mid":3,"value":8,"test":"8 < 8","result":false,"action":"hi = 3"},{"lo":0,"hi":3,"mid":1,"value":7,"test":"7 < 8","result":true,"action":"lo = 2"},{"lo":2,"hi":3,"mid":2,"value":7,"test":"7 < 8","result":true,"action":"lo = 3"}],"lower":3,"upperBound":[{"lo":0,"hi":6,"mid":3,"value":8,"test":"8 <= 8","result":true,"action":"lo = 4"},{"lo":4,"hi":6,"mid":5,"value":10,"test":"10 <= 8","result":false,"action":"hi = 5"},{"lo":4,"hi":5,"mid":4,"value":8,"test":"8 <= 8","result":true,"action":"lo = 5"}],"upper":5,"count":2,"note":"the two 8s were never compared against each other"}},"identity":{"formula":"count = upperBound(x) - lowerBound(x)","verified":{"cases":6006,"wrong":0,"space":"every sorted array of length 0..10 over {0,1,2,3}, probes -1..4"},"absentCases":3146,"absentPct":52.38,"rangeGeneralisation":{"formula":"elements in [L, R] = upperBound(R) - lowerBound(L)","verified":{"cases":21021,"wrong":0}}},"plusOne":{"inclusiveIndexForm":{"formula":"last - first + 1","correct":2860,"of":2860,"scope":"present cases only; meaningless when first is -1"},"halfOpenBoundForm":{"formula":"upper - lower","correct":6006,"of":6006,"scope":"all cases, absent included"},"mixing":"wrong on 100.00% of cases in either direction","reason":"last is an element and upperBound is a boundary; only one of them is inside the run"},"countWithoutEnumerating":{"claim":"the output can be as large as n and costs O(log n) to produce","expandTrap":{"complexity":"O(log n + d), where d is the answer itself","allEqual":{"n":1048576,"expandNs":359744.0,"gapNs":171.7,"ratio":2096},"lightDuplicates":{"copiesPerValue":2,"rows":[{"n":16,"scan":3.06,"expand":18.51,"gap":11.60},{"n":64,"scan":6.18,"expand":23.15,"gap":17.98},{"n":256,"scan":18.01,"expand":30.46,"gap":26.40},{"n":1024,"scan":66.83,"expand":38.81,"gap":37.16},{"n":65536,"expand":91.61,"gap":96.92},{"n":1048576,"expand":149.81,"gap":166.11}],"note":"the trap is FASTER here, which is why it survives review"}}},"scanWinsLonger":{"claim":"the linear scan is fastest of the three up to n = 256 and only loses near n = 500","contrast":"in Lower Bound the scan was already 3x behind at n = 64","assembly":[{"fn":"linear count","instructions":47,"vectorInstructions":17,"note":"cmeq.4s against four accumulators, sixteen elements per iteration"},{"fn":"upper - lower","instructions":27,"vectorInstructions":0,"note":"each probe's address depends on the previous probe's result"}],"reading":"counting has no early exit and no dependent loads, which is exactly the shape a compiler can vectorise"},"manyQueries":{"setup":"n = 1,048,576, 1,024 distinct values, 1,024 copies each; total milliseconds for k queries","rows":[{"k":2000,"binary":0.35,"hash":4.88,"runTable":0.65},{"k":4000,"binary":0.68,"hash":4.92,"runTable":0.73},{"k":5000,"binary":0.95,"hash":4.94,"runTable":0.77},{"k":8000,"binary":1.37,"hash":4.97,"runTable":0.89},{"k":100000,"binary":17.36,"hash":6.08,"runTable":4.78},{"k":150000,"binary":26.61,"hash":6.65,"runTable":6.86},{"k":300000,"binary":56.94,"hash":8.37,"runTable":13.14}],"regimes":[{"range":"below about k = 4,500","winner":"plain binary searches","why":"any precomputation costs more than it saves"},{"range":"about 4,500 to 140,000","winner":"one pass to a run table","why":"0.4ms to build, then 1,024 entries in 8 KB instead of 1,048,576 in 4 MB"},{"range":"above about 140,000","winner":"one pass to a hash map","why":"the 4.9ms build finally amortises against O(1) lookups"}],"crossoversMeasured":true,"memory":{"array":"4,096 KB","runTable":"8 KB"}},"assertions":["the count is never negative","the count is zero exactly when x is absent","the count equals last - first + 1 whenever x is present","the interior of the run is never read","the cost does not depend on the count"]}
```

<!-- @highlights -->
- `count = upperBound(x) - lowerBound(x)` — 0 wrong over 6,006 exhaustive cases, absent values included.
- Absence is 52.38% of those cases and needs no branch: two equal bounds give zero.
- The `+1` belongs to `last - first + 1`, where indices are inclusive — never to the half-open bounds.
- A count of a million costs twenty probes; the expanding version costs a million reads, measured 2,096x.
- The linear scan is the fastest of the three up to n = 256, because counting vectorises into 17 vector instructions and searching vectorises into none.
- Past about 4,500 queries, stop binary searching — compress to a run table; past about 140,000, use a hash map.

<!-- @edgeCases -->
- An empty array — both bounds are 0, the difference is 0, and nothing is indexed.
- x absent — the bounds coincide, which is more than half of all inputs.
- x absent and below everything — both bounds are 0, and the difference is still correct where `last - first + 1` would be meaningless.
- x absent and above everything — both bounds are n, same result.
- x appearing exactly once — the bounds differ by one.
- Every element equal to x — the count is n, and this is where the expanding approach costs 2,096x.
- A single-element array — 1 when it matches and 0 when it does not.
- Writing `upper - lower + 1` — off by one on every input, including returning 1 for an absent value.
- Writing `lower - upper` — the negation, which is silently wrong rather than an error.
- n above 1,073,741,824 — where `(lo + hi) / 2` overflows an int, exactly as in Lower Bound.
- An unsorted array — every version terminates and every answer is meaningless; nothing checks the precondition.

<!-- @pitfalls -->
- Writing `upper - lower + 1`. The bounds are half-open, so the difference is already the width — the plus one belongs to `last - first + 1`.
- Writing `lower - upper`. It returns the negation, and a negative count will propagate silently.
- Adding a membership test before the subtraction. Absence already gives zero, and it is 52.38% of inputs.
- Walking outward from a found occurrence. The cost then scales with the answer — measured 2,096x on a million equal elements.
- Trusting a benchmark with few duplicates. The expanding version is *faster* there — 149.81ns against 166.11ns at n = 1,048,576 — which is exactly why it ships.
- Assuming binary search always beats a scan past a handful of elements. Here the vectorised scan wins to n = 256 and the crossover is near n = 500.
- Adding an early exit to the linear scan. It would help on some inputs and prevent vectorisation on all of them.
- Running k independent binary searches for large k. Past about 4,500 queries a run table wins, and past about 140,000 a hash map does.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825.
- Reusing this on an unsorted array. It returns a number, and that number means nothing.

<!-- @doubt -->
### Why is there no `+ 1`?

<!-- @answer -->
Because the bounds are half-open and indices are inclusive, and the plus one belongs to the second convention. `lowerBound` is the first index of the run, `upperBound` is one *past* the last, so their difference is already the width — measured correct on 6,006 of 6,006 exhaustive cases. The form that does need the plus one is the previous subtopic's: `last - first + 1`, where both are real indices inside the run, correct on 2,860 of 2,860 present cases. The two are the same number written in two conventions, since `last = upper - 1`. Mixing them is wrong on 100.00% of cases in either direction. A useful tell: `upper - lower` still gives the right answer when x is absent, while `last - first + 1` cannot, because `first` is -1 there.

<!-- @doubt -->
### Do I need to check whether x is present first?

<!-- @answer -->
No, and it is worth being deliberate about that because absence is the majority case. Of the 6,006 exhaustive cases, 3,146 — **52.38%** — have x absent. In every one the two bounds land on the same position, so the difference is zero, which is the correct answer. A separate membership test would add a descent to more than half your calls in order to produce information the subtraction already contains. This is the same property that made the previous subtopic's `lower == upper` the entire not-found case.

<!-- @doubt -->
### Surely counting a million copies means touching a million elements?

<!-- @answer -->
No, and this is the idea the subtopic exists for. A sorted array has already grouped the copies, so the run is completely described by where it begins and where it ends — the interior carries no information the boundaries do not. The count is subtraction, and the cost is the two descents. Measured on an array of 1,048,576 identical elements: `upper - lower` takes **171.7ns** and returns 1,048,576, while finding one occurrence and walking outward takes **359,744.0ns** for the same answer — 2,096x. The general form of the lesson: any solution whose cost scales with what it found rather than with where it looked has not used the sortedness.

<!-- @doubt -->
### Why does the linear scan do so much better here than in the earlier subtopics?

<!-- @answer -->
Because counting is a shape a compiler can vectorise and searching is not. The scan has no early exit, no dependent loads, and no data-dependent branches — every element is compared and the matches are summed — so clang emits `cmeq.4s` against four independent accumulators and processes sixteen elements per iteration: 47 instructions of which **17 are vector instructions**. The binary search compiles to 27 instructions and **zero** vector instructions, because each probe's address depends on the previous probe's result and that dependency cannot be broken. Measured, the scan is fastest of the three up to n = 256 — 3.06ns against 11.60ns at n = 16 — and the crossover sits near n = 500. In Lower Bound the same scan was three times behind already at n = 64. The advice "binary search wins past a handful of elements" was true of the problems it was measured on, not of loops in general.

<!-- @doubt -->
### Should I add an early exit to the scan once I have passed all the copies?

<!-- @answer -->
No — it would make the scan slower overall. Since the array is sorted you could stop at the first element greater than x, which sounds strictly better and cuts the average work substantially. But that break is a data-dependent branch inside the loop, and its presence is exactly what stops the compiler from vectorising: the loop can no longer process sixteen elements speculatively, because any one of them might have ended it. You would trade a 16x throughput multiplier for a variable fraction of the iterations. If you want to stop early, do it properly and use the bounds, which stop early by construction rather than by branching.

<!-- @doubt -->
### What if I need counts for many different values?

<!-- @answer -->
Then binary search stops being the answer past a surprisingly small k. Measured at n = 1,048,576 with 1,024 distinct values, total milliseconds for k queries: repeated `upper - lower` takes 0.35ms at k = 2,000 and 56.94ms at k = 300,000; one pass compressing the array into a run table of (value, count) pairs takes 0.65ms and 13.14ms; one pass into a hash map takes 4.88ms and 8.37ms. Both crossovers were measured directly. Below about **k = 4,500**, plain binary searches win because no precomputation pays for itself. Between about 4,500 and **140,000**, the run table wins — it costs 0.4ms to build and then searches 1,024 entries in 8 KB rather than 1,048,576 entries in 4 MB, so it is both a shorter descent and one that stays in cache. Above about 140,000, the hash map's O(1) lookups finally amortise its 4.9ms build. The run table is the option worth remembering, because it is the one sortedness makes available for free.

<!-- @doubt -->
### Can this count elements in a range rather than equal to one value?

<!-- @answer -->
Yes, with the same two calls and no new idea: the number of elements in the inclusive range [L, R] is `upperBound(R) - lowerBound(L)`. Lower bound on L is the first position not below the range and upper bound on R is the first position past it, so the difference is the width of the window between them. Verified exhaustively over 21,021 (array, L, R) combinations — **0 wrong**. Setting L = R = x recovers the single-value count, so the formula in this container is the special case rather than the general one. This is the shape most "how many elements between a and b" problems reduce to, and it is worth recognising as already solved.
