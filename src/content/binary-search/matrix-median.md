---
id: matrix-median
topic: Binary Search
title: Matrix Median
difficulty: Hard
status: ready
prerequisites:
  - search-in-2d-matrix-ii
  - median-of-2-sorted-arrays
  - upper-bound
relatedIds:
  - median-of-2-sorted-arrays
  - search-in-2d-matrix-ii
  - search-in-a-2d-matrix
  - upper-bound
  - koko-eating-bananas
---

<!-- @summary -->
The last search in this topic, and the one that searches values rather than positions: guess a number, count how many elements do not exceed it, and halve. Two one-character choices in that count decide everything — using lower_bound instead of upper_bound is wrong on 98.58% of inputs and testing count < need instead of <= need on 32.43%. The celebrated algorithm is also only conditionally the fastest: on tall matrices a plain quickselect beats it more than fourfold.

<!-- @theory -->
## The problem

Every row is sorted. `m · n` is odd. Return the median of all `m · n` elements —
without building the combined array, ideally.

```
[[1, 3, 5],
 [2, 6, 9],      ->  5      all nine sorted: 1 2 3 3 5 6 6 9 9
 [3, 6, 9]]                 the fifth is 5
```

Note what is *not* assumed: columns need not be sorted, and the row-major reading
need not be sorted. Only the rows.

## Searching values, not positions

Every earlier search in this topic searched an index or a quantity you could point
at. Here there is no position to search — the median's location in the combined
array is known, but that array does not exist. So search the **value** instead:

> The median is the smallest value `v` such that **more than** `(m·n)/2` elements
> are less than or equal to `v`.

Counting elements `≤ v` is one `upper_bound` per row, O(m log n). The count rises
monotonically with `v`, so the condition "count > need" is false then true, and
binary search finds the boundary.

The search runs over the value range, and the answer it converges on is
**guaranteed to be an element of the matrix** — the smallest `v` whose count
crosses the threshold must be a value actually present, because the count only
increases where an element sits. Verified over every row-sorted matrix with `m·n`
odd for `m ≤ 3`, `n ≤ 5` over `{0..5}` — **16,179,154 cases** — the canonical
version is **0 wrong** and returned a value absent from the matrix **0 times**.

## Two characters that decide the answer

The count and its comparison are where all the risk in this problem lives.

**`upper_bound`, not `lower_bound`.** The invariant needs the count of elements
`≤ mid`. `lower_bound` counts elements `< mid`, which is a different function and
undercounts every duplicate of `mid`. Measured over the same 16 million cases:
**15,949,917 wrong — 98.58%.** It is not a corner case; it is almost always wrong.

**`count <= need`, not `count < need`.** With `need = (m·n)/2`, the median is the
first value whose count *exceeds* `need`, so a count equal to `need` means the
guess is still too small and the search must move right. Writing `<` treats an
exact match as "far enough" and stops one value early — **5,246,498 wrong,
32.43%**. The smallest failure is a single row:

```
[[0, 1, 1]]      need = 3/2 = 1,  true median = 1

mid = 0:  count(<= 0) = 1
          `count <= need`  ->  1 <= 1 is true, too small, lo = 1   ->  1   correct
          `count < need`   ->  1 <  1 is false, treat as found, hi = 0  ->  0   wrong
```

## The bounds are free

The search range is `[min over rows of row[0], max over rows of row[n-1]]`.
Because each row is sorted, `row[0]` is that row's minimum and `row[n-1]` its
maximum — so this **is** the global minimum and maximum, computed in O(m) instead
of the O(m·n) a full sweep would cost. Measured, taking the range from all
elements gives an identical answer on all 16,179,154 cases, as it must: it is the
same two numbers found the long way.

The iteration count follows from the range alone, not the matrix size:

| value range | iterations |
|---|---|
| 10² | 6.6 |
| 10⁴ | 13.3 |
| 10⁹ | 29.9 |
| 4 × 10⁹ | 31.9 |

So the total cost is `log2(range) · m log n` — about 30 passes over the rows for
32-bit values.

## The famous algorithm is only conditionally the right one

Four ways to get the median, measured on row-sorted matrices with values drawn
from `[0, 10⁹)`:

| shape | sort everything | quickselect | heap merge | binary search on value |
|---|---|---|---|---|
| 101 × 101 | 390,958 | **42,167** | 418,666 | 94,625 |
| 1,001 × 1,001 | 19,365,708 | 1,029,334 | 25,408,208 | **597,584** |
| 11 × 90,901 | 18,967,334 | 943,500 | 10,281,500 | **20,541** |
| 3 × 333,333 | 18,401,208 | 965,208 | 5,624,667 | **6,000** |
| 90,901 × 11 | 19,247,208 | **4,480,375** | 45,551,250 | 19,362,541 |

Nanoseconds. The value search is `log2(range) · m log n`: linear in the number of
**rows** and only logarithmic in their length. So it dominates when the matrix is
wide — **161x** faster than quickselect at 3 × 333,333 — and loses when it is
tall, by **4.3x** at 90,901 × 11, where it performs 30 binary searches over 11-element
rows for every one of 90,901 rows.

`nth_element` is the honest competitor. It ignores the sortedness entirely, copies
all `m·n` elements and quickselects them in O(m·n) expected time — and that is the
right choice on tall matrices and on small ones. The heap merge, the approach that
looks most like "use the structure", is the worst option at every size.

The rule that falls out: the value search wins when `log2(range) · m · log n` is
smaller than `m · n`, which for 32-bit values means roughly when `n > 30 log n` —
rows of a few hundred or more.

<!-- @intuition -->
This is the right problem to end the topic on, because it is the furthest from where the topic started. The first subtopic searched for a value at a position in an array. This one searches for a value that has a *property* — "more elements are at or below it than above" — over a range where most candidates are not even in the data. Nothing is being indexed; the array being searched does not exist. What carries across is only the shape of the argument: a predicate that is false then true, a way to evaluate it cheaply, and the discipline to work out which side of the boundary you want. Everything else — the sortedness, the counting, the bounds — is just how you make that predicate cheap. And as several subtopics here have shown, being able to make it cheap is not the same as it being the fastest thing available.

<!-- @approach -->
### Sort Everything

<!-- @idea -->
Copy every element into one array, sort it, and take the middle.

<!-- @steps -->
1. Flatten the matrix into a single array.
2. Sort it.
3. Return the element at index `m·n / 2`.

<!-- @complexity -->
- time: O(m·n log(m·n))
- space: O(m·n)
- note: The definition, and the reference the others were verified against. Discards the row ordering completely — and is beaten by quickselect on the same flattened array at every size.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int matrixMedian(const vector<vector<int>>& mat) {
    vector<int> all;
    all.reserve(mat.size() * mat[0].size());
    for (const auto& row : mat)
        all.insert(all.end(), row.begin(), row.end());
    sort(all.begin(), all.end());
    return all[all.size() / 2];
}
```

<!-- @annotations -->
- 10: Sorting rows that are already sorted. A k-way merge would be O(m·n log m) instead — and measured, that is slower still, because the heap's constant swamps the saving.
- 11: `all.size() / 2` is the exact middle only because `m·n` is guaranteed odd. For an even total the median would be the average of two elements and this returns the upper one.

<!-- @code java -->
```java
static int matrixMedian(int[][] mat) {
    int m = mat.length, n = mat[0].length;
    int[] all = new int[m * n];
    int k = 0;
    for (int[] row : mat)
        for (int x : row) all[k++] = x;
    Arrays.sort(all);
    return all[all.length / 2];
}
```

<!-- @annotations -->
- 3: `m * n` in int. For a matrix large enough to matter this overflows — the same trap as the flattened index in Search in a 2D Matrix.

<!-- @code python -->
```python
def matrix_median(mat):
    all_vals = sorted(x for row in mat for x in row)
    return all_vals[len(all_vals) // 2]
```

<!-- @annotations -->
- 2: Timsort detects the m already-sorted runs and merges them, so this is closer to O(m·n log m) than the worst case suggests.

<!-- @approach -->
### Quickselect the Flattened Array

<!-- @idea -->
Flatten as before, but partition rather than sort — only the middle element's position needs to be correct.

<!-- @steps -->
1. Flatten the matrix.
2. Partially order the array so index `m·n / 2` holds the value it would after a full sort.
3. Return that element.

<!-- @complexity -->
- time: O(m·n) expected
- space: O(m·n)
- note: Ignores the sortedness entirely and is still the fastest option on **tall and small** matrices — 42,167ns at 101×101 against the value search's 94,625, and **4.3x** ahead at 90,901 × 11.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int matrixMedian(const vector<vector<int>>& mat) {
    vector<int> all;
    all.reserve(mat.size() * mat[0].size());
    for (const auto& row : mat)
        all.insert(all.end(), row.begin(), row.end());
    size_t k = all.size() / 2;
    nth_element(all.begin(), all.begin() + k, all.end());
    return all[k];
}
```

<!-- @annotations -->
- 12: `nth_element` places one element correctly and partitions around it, which is all the median needs. Expected O(n) against sort's O(n log n), and measured about 9x faster at 101×101.
- 8: The copy is unavoidable here — `nth_element` reorders its input, so the matrix cannot be used directly. That O(m·n) space is what the value search avoids.

<!-- @code java -->
```java
static int matrixMedian(int[][] mat) {
    int m = mat.length, n = mat[0].length;
    int[] all = new int[m * n];
    int k = 0;
    for (int[] row : mat)
        for (int x : row) all[k++] = x;
    Arrays.sort(all);            // Java has no primitive nth_element
    return all[all.length / 2];
}
```

<!-- @annotations -->
- 7: Java's standard library has no quickselect for primitives, so this falls back to a full sort. Writing the partition by hand is the only way to get the O(n) behaviour here.

<!-- @code python -->
```python
def matrix_median(mat):
    all_vals = [x for row in mat for x in row]
    k = len(all_vals) // 2
    # heapq.nsmallest is O(n log k); a real quickselect is O(n).
    # The standard library has no nth_element, so sorting is the practical choice.
    all_vals.sort()
    return all_vals[k]
```

<!-- @annotations -->
- 6: Python has no quickselect either. `statistics.median` would work but sorts internally, so it offers no asymptotic advantage.

<!-- @approach -->
### Binary Search on the Value

<!-- @idea -->
Guess a value, count how many elements are less than or equal to it with one binary search per row, and halve toward the smallest guess whose count exceeds half.

<!-- @steps -->
1. Take `need = (m·n) / 2`.
2. Bound the search by the smallest first element and the largest last element.
3. For a candidate `mid`, sum `upper_bound(row, mid)` over the rows.
4. If that count is at most `need`, `mid` is too small — search right.
5. Otherwise `mid` may be the answer — keep it and search left.
6. The converged value is the median.

<!-- @complexity -->
- time: O(log(range) · m log n)
- space: O(1)
- note: **0 wrong** over 16,179,154 exhaustive cases, and the only approach using no extra space. Best on wide matrices — **161x** faster than quickselect at 3 × 333,333 — and 4.3x slower on tall ones.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

int matrixMedian(const vector<vector<int>>& mat) {
    int m = (int)mat.size(), n = (int)mat[0].size();
    int need = (m * n) / 2;

    int lo = INT_MAX, hi = INT_MIN;
    for (const auto& row : mat) {
        lo = min(lo, row[0]);
        hi = max(hi, row[n - 1]);
    }

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        int count = 0;
        for (const auto& row : mat)
            count += (int)(upper_bound(row.begin(), row.end(), mid) - row.begin());
        if (count <= need) lo = mid + 1;
        else               hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 11: `row[0]` is the row's minimum and `row[n-1]` its maximum because the row is sorted, so this O(m) loop finds the global range without touching the other m·(n−2) elements.
- 20: `upper_bound` counts elements **≤ mid**; `lower_bound` counts elements **< mid** and undercounts duplicates. Substituting it is wrong on 98.58% of inputs.
- 21: `count <= need`, not `count < need`. A count exactly equal to `need` means the guess is still too small — writing `<` stops one value early and is wrong on 32.43%.
- 16: `lo < hi` with `hi = mid` on the keep branch, so the interval always shrinks and the loop cannot hang — the shape Aggressive Cows needed a rounding fix to achieve.
- 24: `lo` is the smallest value whose count exceeds `need`, which must be an element of the matrix — verified across 16 million cases, never once absent.

<!-- @code java -->
```java
static int matrixMedian(int[][] mat) {
    int m = mat.length, n = mat[0].length;
    int need = (m * n) / 2;

    int lo = Integer.MAX_VALUE, hi = Integer.MIN_VALUE;
    for (int[] row : mat) {
        lo = Math.min(lo, row[0]);
        hi = Math.max(hi, row[n - 1]);
    }

    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        int count = 0;
        for (int[] row : mat) count += upperBound(row, mid);
        if (count <= need) lo = mid + 1;
        else               hi = mid;
    }
    return lo;
}

static int upperBound(int[] row, int v) {
    int lo = 0, hi = row.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (row[mid] <= v) lo = mid + 1;
        else               hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 21: Java's `Arrays.binarySearch` returns an arbitrary index among equal elements, so it cannot be used for counting — an explicit upper bound is required.

<!-- @code python -->
```python
import bisect


def matrix_median(mat):
    m, n = len(mat), len(mat[0])
    need = (m * n) // 2

    lo = min(row[0] for row in mat)
    hi = max(row[-1] for row in mat)

    while lo < hi:
        mid = (lo + hi) // 2
        count = sum(bisect.bisect_right(row, mid) for row in mat)
        if count <= need:
            lo = mid + 1
        else:
            hi = mid
    return lo
```

<!-- @annotations -->
- 14: `bisect_right` is Python's `upper_bound`. `bisect_left` is `lower_bound` and is the 98.58%-wrong substitution.

<!-- @example -->

<!-- @input -->
```
mat = [[1, 3, 5], [2, 6, 9], [3, 6, 9]]
```

<!-- @output -->
```
5
```

<!-- @why -->
All nine elements sorted are `1 2 3 3 5 6 6 9 9`, so the fifth is 5. The search finds it in three probes without building that list.

<!-- @walkthrough -->
```
need = 9/2 = 4      lo = min first col = 1      hi = max last col = 9

mid=5   count(<= 5) = 3 + 1 + 1 = 5    > 4, could be it   hi = 5
mid=3   count(<= 3) = 2 + 1 + 1 = 4   <= 4, too small     lo = 4
mid=4   count(<= 4) = 2 + 1 + 1 = 4   <= 4, too small     lo = 5
lo = hi = 5   ->  5

Note mid=4: it is not in the matrix at all, and the search
probes it anyway. Searching a value range means most
candidates are not data — only the answer has to be.
```

<!-- @example -->

<!-- @input -->
```
mat = [[0, 1, 1]]
```

<!-- @output -->
```
1
```

<!-- @why -->
The smallest case where `count < need` gives a different answer from `count <= need`. A single row of three, so the median is the middle element, 1.

<!-- @walkthrough -->
```
need = 3/2 = 1      lo = 0,  hi = 1

correct, `count <= need`:
  mid=0   count(<= 0) = 1    1 <= 1 is true, too small   lo = 1
  ->  1                                                   correct

wrong, `count < need`:
  mid=0   count(<= 0) = 1    1 <  1 is false, keep it     hi = 0
  ->  0                                                   WRONG

A count equal to `need` means exactly half the elements are
at or below the guess — one short of a median. Measured,
that single character is wrong on 32.43% of inputs.
```

<!-- @example -->

<!-- @input -->
```
mat = [[1, 10, 20], [15, 25, 35], [27, 30, 40]]
```

<!-- @output -->
```
25
```

<!-- @why -->
Rows are sorted but columns are not consecutive across rows — 20 then 15 — which is fine here, since only row ordering is assumed. Sorted, the nine values are `1 10 15 20 25 27 30 35 40` and the fifth is 25.

<!-- @walkthrough -->
```
need = 4     lo = min(1,15,27) = 1     hi = max(20,35,40) = 40

mid=20   count(<= 20) = 3 + 1 + 0 = 4   <= 4, too small   lo = 21
mid=30   count(<= 30) = 3 + 2 + 2 = 7    > 4, could be it hi = 30
mid=25   count(<= 25) = 3 + 2 + 0 = 5    > 4, could be it hi = 25
mid=23   count(<= 23) = 3 + 1 + 0 = 4   <= 4, too small   lo = 24
mid=24   count(<= 24) = 3 + 1 + 0 = 4   <= 4, too small   lo = 25
lo = hi = 25   ->  25

Only the rows are sorted; the columns are not, and nothing
in the algorithm ever assumed they were.
```

<!-- @example -->

<!-- @input -->
```
mat = [[1]]
```

<!-- @output -->
```
1
```

<!-- @why -->
The degenerate case. `need` is 0, and `lo` and `hi` both start at 1, so the loop never runs and the single element is returned.

<!-- @walkthrough -->
```
need = 1/2 = 0      lo = 1,  hi = 1

lo < hi is false immediately  ->  return lo = 1

Worth checking because it is where `while (lo <= hi)` would
loop forever: with lo == hi, mid == lo, count(<= 1) = 1 > 0,
so hi = mid leaves the interval unchanged. The `lo < hi`
form terminates by construction.
```

<!-- @visualization custom -->

<!-- @description -->
Shows how searching a value range differs from searching positions, the two one-character choices that decide the answer, and the shape where the celebrated algorithm is not the fastest.

<!-- @sampleInput -->
```json
{"primary":{"matrix":[[1,3,5],[2,6,9],[3,6,9]],"allSorted":[1,2,3,3,5,6,6,9,9],"median":5,"need":4,"lo":1,"hi":9,"probes":[{"mid":5,"perRow":[3,1,1],"count":5,"verdict":"> need, could be it","move":"hi = 5"},{"mid":3,"perRow":[2,1,1],"count":4,"verdict":"<= need, too small","move":"lo = 4"},{"mid":4,"perRow":[2,1,1],"count":4,"verdict":"<= need, too small","move":"lo = 5"}],"note":"mid = 4 is not in the matrix at all - searching a value range means most candidates are not data"},"whatIsBeingSearched":{"earlierSubtopics":"an index, or a quantity you could point at","here":"a value with a property - the smallest v such that more than (m*n)/2 elements are <= v","whyNotAPosition":"the median's index in the combined array is known, but that array does not exist","assumedStructure":"rows sorted only - columns need not be, and the row-major reading need not be","answerIsAlwaysPresent":{"claim":"the converged value is always an element of the matrix","reason":"the count only increases where an element sits, so the smallest v whose count crosses the threshold must be one","verified":{"cases":16179154,"timesAbsent":0}}},"twoCharactersThatDecide":{"space":"every row-sorted matrix with m*n odd, m <= 3, n <= 5, values {0..5}","cases":16179154,"canonicalWrong":0,"variants":[{"variant":"lower_bound instead of upper_bound","wrong":15949917,"pct":98.58,"why":"lower_bound counts elements < mid, undercounting every duplicate of mid; the invariant needs elements <= mid"},{"variant":"count < need instead of count <= need","wrong":5246498,"pct":32.43,"why":"a count equal to need means exactly half the elements are at or below the guess - one short of a median, so the search must still move right","smallestFailure":{"matrix":[[0,1,1]],"need":1,"truth":1,"trace":["mid=0, count(<=0)=1","`count <= need`: 1 <= 1 true, too small, lo=1 -> answer 1 correct","`count < need`: 1 < 1 false, keep it, hi=0 -> answer 0 wrong"]}},{"variant":"range taken from all elements instead of first and last columns","wrong":0,"why":"identical by construction - row[0] is the row minimum and row[n-1] its maximum, so the O(m) form finds the same two numbers as an O(m*n) sweep"}]},"iterationCount":{"formula":"log2(value range), independent of m and n","rows":[{"range":"10^2","iterations":6.6},{"range":"10^4","iterations":13.3},{"range":"10^9","iterations":29.9},{"range":"4x10^9","iterations":31.9}],"totalCost":"log2(range) * m log n - about 30 passes over the rows for 32-bit values"},"shapeDecidesTheWinner":{"unit":"nanoseconds, values drawn from [0, 10^9)","rows":[{"shape":"101 x 101","sortAll":390958,"quickselect":42167,"heapMerge":418666,"binaryValue":94625,"winner":"quickselect"},{"shape":"1001 x 1001","sortAll":19365708,"quickselect":1029334,"heapMerge":25408208,"binaryValue":597584,"winner":"binary value"},{"shape":"11 x 90901","sortAll":18967334,"quickselect":943500,"heapMerge":10281500,"binaryValue":20541,"winner":"binary value"},{"shape":"3 x 333333","sortAll":18401208,"quickselect":965208,"heapMerge":5624667,"binaryValue":6000,"winner":"binary value"},{"shape":"90901 x 11","sortAll":19247208,"quickselect":4480375,"heapMerge":45551250,"binaryValue":19362541,"winner":"quickselect"}],"reading":"the value search is linear in the number of ROWS and only logarithmic in their length, so it dominates on wide matrices - 161x at 3 x 333,333 - and loses by 4.3x on tall ones","tallCase":"at 90,901 x 11 it performs 30 binary searches over 11-element rows for every one of 90,901 rows","quickselectNote":"it ignores the sortedness entirely and is still the right choice on tall and small matrices","heapMergeNote":"the approach that looks most like using the structure is the worst option at every size","rule":"the value search wins when log2(range) * m * log n is smaller than m * n, which for 32-bit values means roughly rows of a few hundred or more"},"terminationShape":{"form":"while (lo < hi) with hi = mid on the keep branch","whySafe":"the interval always shrinks, so the loop cannot hang","contrast":"Aggressive Cows needed mid rounded up to achieve the same guarantee, because its keep branch assigns lo = mid","degenerate":{"matrix":[[1]],"need":0,"lo":1,"hi":1,"note":"lo < hi is false immediately; a `lo <= hi` form would loop forever here"}},"assertions":["only the rows are sorted - columns and the row-major order need not be","the count of elements <= v is monotone non-decreasing in v","the answer is always an element present in the matrix","m*n is odd, so the median is a single element","row[0] is the row minimum and row[n-1] the row maximum"]}
```

<!-- @highlights -->
- The last search in the topic, and the only one that searches **values** rather than positions — the array being searched does not exist.
- Only **rows** are assumed sorted; columns and the row-major order are unconstrained.
- `lower_bound` instead of `upper_bound` is wrong on **98.58%** of 16.18 million cases.
- `count < need` instead of `count <= need` is wrong on **32.43%**; smallest failure is `[[0,1,1]]`.
- The converged value is always an element of the matrix — verified **0** absences in 16.18 million cases.
- Shape decides the winner: **161×** ahead of quickselect at 3 × 333,333, and **4.3×** behind at 90,901 × 11.

<!-- @edgeCases -->
- `[[1]]` — `need` is 0, `lo == hi` immediately, and the loop never runs.
- A single row — the problem reduces to indexing the middle of a sorted array.
- A single column — every `upper_bound` is over one element, and the value search is at its worst.
- All elements equal — every count is `m·n`, so the first probe sets `hi = mid` and the search converges on that value.
- Many duplicates of the median — exactly the case `lower_bound` gets wrong, by not counting them.
- Columns not sorted — legal, and nothing in the algorithm assumes otherwise.
- Row-major order not sorted — also legal, unlike Search in a 2D Matrix.
- `m·n` even — outside the problem statement; the median would be an average and the count invariant no longer names a single element.
- Values spanning the full int range — the iteration count reaches 32, still independent of the matrix size.
- `m * n` computed in int for a large matrix — overflows, the same trap as the flattened index in Search in a 2D Matrix.

<!-- @pitfalls -->
- `lower_bound` instead of `upper_bound`. Wrong on 98.58% — it counts elements strictly below and misses duplicates of the guess.
- `count < need` instead of `count <= need`. Wrong on 32.43% — an exact match means the guess is still too small.
- Assuming the answer must be probed directly. The search evaluates values that are not in the matrix at all; only the converged one must be.
- Writing `while (lo <= hi)` with `hi = mid`. The interval stops shrinking and the loop hangs on `[[1]]`.
- Sweeping every element to find the range. `row[0]` and `row[n-1]` give the same numbers in O(m).
- Assuming columns are sorted. They need not be, and no step requires it.
- Reaching for the heap merge because it "uses the structure". It is the slowest option at every size measured.
- Reaching for the value search unconditionally. On tall matrices a plain quickselect is 4.3× faster.
- Computing `m * n` in a 32-bit int for a large matrix.

<!-- @doubt -->
### Why `upper_bound` and not `lower_bound`?

<!-- @answer -->
Because the invariant is stated over elements **less than or equal to** the guess, and `lower_bound` counts elements **strictly less than** it. The two differ by exactly the number of copies of `mid` in the row — which is the worst possible place to be wrong, since the search converges on a value that is *in* the matrix, so at the deciding probe `mid` is present and `lower_bound` undercounts it. Measured over **16,179,154** exhaustive cases, substituting `lower_bound` is wrong on **15,949,917 — 98.58%**. This is unusual: most of the substitutions measured across this topic fail on some fraction of inputs, and this one fails on almost all of them, which at least means you will notice. In Python the pair is `bisect_right` (upper) and `bisect_left` (lower); in Java, `Arrays.binarySearch` cannot be used for either, because with duplicates it returns an arbitrary matching index.

<!-- @doubt -->
### Why `count <= need` rather than `count < need`?

<!-- @answer -->
Because `need` is `(m·n)/2`, which for an odd total is the number of elements strictly *before* the median. A guess whose count equals `need` therefore has exactly half the elements at or below it and is still one short — the median is the first value whose count **exceeds** `need`. Writing `<` treats that exact match as sufficient and stops one value early. Measured, **5,246,498 of 16,179,154 — 32.43%** wrong. The smallest case is a single row `[[0,1,1]]` with `need = 1`: at `mid = 0` the count is 1, so `count <= need` correctly says "still too small" and moves right to 1, while `count < need` is false and keeps 0. Worth noting the failure is a *near* miss — it returns a value one step below the median, which is exactly the kind of wrongness that survives casual testing.

<!-- @doubt -->
### Is the answer guaranteed to be an element of the matrix?

<!-- @answer -->
Yes, and the argument is short. The count of elements `≤ v` is a step function of `v`: it only increases at values that actually occur in the matrix. The search returns the smallest `v` whose count exceeds `need`, and a count can only exceed a threshold at a point where it stepped up — so that `v` must be a value present in the data. This matters because the search *probes* values that are not in the matrix all the time: in the worked example it evaluates `mid = 4`, which appears nowhere, and that is fine because the probe only needs a count, not a lookup. Verified across all **16,179,154** exhaustive cases: the canonical version returned a value absent from the matrix **zero** times.

<!-- @doubt -->
### When is this worse than just quickselecting everything?

<!-- @answer -->
On tall matrices and small ones. The value search costs `log2(range) · m log n` — linear in the number of **rows**, logarithmic in their length — so it thrives when rows are long and few and struggles when they are short and many. Measured: at 3 × 333,333 it takes **6,000ns against quickselect's 965,208 — 161x ahead**; at 90,901 × 11 it takes **19,362,541ns against 4,480,375 — 4.3x behind**, because it runs 30 binary searches over 11-element rows for each of 90,901 rows. At 101 × 101 quickselect also wins, 42,167 to 94,625. The crossover is roughly where `log2(range) · m · log n` meets `m · n`, which for 32-bit values means rows of a few hundred or more. It is worth noticing that `nth_element` ignores the sortedness entirely and still wins in those regimes — and that the heap merge, the approach that most *looks* like exploiting the structure, is the slowest option at every size tested.

<!-- @doubt -->
### Why does this loop use `while (lo < hi)` when most others here use `lo <= hi`?

<!-- @answer -->
Because the keep branch assigns `hi = mid` rather than `hi = mid - 1`, so the answer is never discarded and no separate `ans` variable is needed — the interval collapses onto it. That form requires `lo < hi`: with `lo == hi` the loop would compute `mid == lo`, take the keep branch, set `hi = mid`, and change nothing, hanging forever. `[[1]]` is exactly that case, where `lo` and `hi` both start at 1. The form is safe here because the keep branch moves `hi` down to `mid` while the other moves `lo` up to `mid + 1`, so the interval strictly shrinks every iteration regardless of rounding. Contrast Aggressive Cows, where the keep branch assigns `lo = mid` and the same loop shape hangs on 70.51% of inputs unless `mid` is rounded **up**. The rule worth carrying out of this topic: whichever branch assigns `mid` without an offset determines which way `mid` must round.
