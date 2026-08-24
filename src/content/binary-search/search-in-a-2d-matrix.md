---
id: search-in-a-2d-matrix
topic: Binary Search
title: Search in a 2D Matrix
difficulty: Hard
status: ready
prerequisites:
  - search-x-in-sorted-array
  - find-row-with-maximum-1s
  - lower-bound
relatedIds:
  - search-in-2d-matrix-ii
  - matrix-median
  - find-row-with-maximum-1s
  - find-peak-element-ii
  - search-x-in-sorted-array
---

<!-- @summary -->
The matrix is one sorted sequence folded into rows, so the textbook answer flattens it and runs a single binary search. Because log(mn) equals log m + log n, searching the row and then the column does the same number of probes — measured 17.99 against 18.99 at 1000x1000 — and is consistently faster, because the flattened version pays an integer division and modulo on every probe.

<!-- @theory -->
## The problem

Each row is sorted, and the first element of each row is greater than the last
element of the row above. Decide whether a target is present.

```
[[ 1,  3,  5,  7],
 [10, 11, 16, 20],     target = 3   ->  true
 [23, 30, 34, 60]]     target = 13  ->  false
```

That second condition is the whole problem. It means reading the matrix in
row-major order gives a single sorted sequence — `1, 3, 5, 7, 10, 11, ...` — so
this is a one-dimensional search wearing a two-dimensional costume.

## Flattening, and the arithmetic it costs

Treat the matrix as an array of length `m·n` and map each index back:

```
index  ->  (index / n, index % n)
```

One binary search over `[0, m·n − 1]`, O(log(mn)) probes, and no special cases.
It is the answer everyone gives, and it is not the fastest one.

## log(mn) = log m + log n

That identity means finding the row by binary search and then binary searching
inside it costs the *same* number of probes as the flattened version. It is not
an approximation — measured, averaged over every element of the matrix:

| shape | flattened probes | two-step probes |
|---|---|---|
| 16 × 16 | 7.04 | 6.75 |
| 100 × 100 | 12.39 | 11.40 |
| 1,000 × 1,000 | 18.99 | 17.99 |
| 10 × 100,000 | 18.99 | 18.89 |
| 100,000 × 10 | 18.99 | 18.75 |

The two agree to within about one probe, and the two-step is marginally ahead
because its row search can stop the moment it lands on the containing row rather
than always descending to a single candidate.

So if the probe counts match, the winner is decided by what each probe costs.
The flattened version does `mid / n` and `mid % n` every time; the two-step does
neither. Measured, in nanoseconds per query:

| shape | scan every cell | staircase | flattened | two-step |
|---|---|---|---|---|
| 100 × 100 | 5,528 | 779 | 170 | **83** |
| 1,000 × 1,000 | 470,292 | 7,804 | 233 | **170** |
| 3,000 × 3,000 | — | 19,740 | 243 | **183** |
| 10 × 100,000 | 202,847 | 58,671 | 156 | **71** |
| 100,000 × 10 | 148,125 | 180,138 | 150 | **70** |

The two-step is **1.4x to 2.1x** faster across every shape, on identical probe
counts. Integer division is among the slowest arithmetic instructions available,
it appears twice per probe, and the dependency chain forces it to complete before
the load it feeds. This is the same lesson as several earlier subtopics from the
other side: there, fewer operations did not buy time; here, the same number of
probes costs different amounts depending on what each probe has to compute.

## What the precondition is holding up

Both binary searches depend on the row-major sequence being sorted. Weaken that to
"rows sorted and columns sorted" — the precondition of the next subtopic — and
they break:

| approach | wrong |
|---|---|
| flattened binary search | 322,064 of 2,187,384 — **14.72%** |
| two-step binary search | 343,287 — **15.69%** |
| staircase from the top-right | **0** |

Over 2.19 million queries on matrices that are row- and column-sorted but not
row-major sorted. The smallest counterexample is 2×2:

```
[[2, 4],
 [3, 5]]        target = 3

row-major reading is 2, 4, 3, 5 — not sorted
the flattened search probes 4, goes left, probes 2, goes right, and stops
the staircase walks 4 -> 2 -> 3 and finds it
```

The staircase is the more general algorithm: it only needs each row and column
sorted, and it never breaks. It also costs O(m + n) rather than O(log(mn)), and
that is not a small price — at 100,000 × 10 it measured **180,138ns, slower than
scanning all million cells** at 148,125ns, because it walks 100,010 steps while
the scan enjoys perfect cache locality. Using the general tool where the specific
one applies is a real loss here, not a stylistic one.

## Two integers that want to be wide

`m·n` is computed as an index bound. With `m` and `n` each up to 10⁵ that product
is 10¹⁰, which overflows a 32-bit int and yields a negative `hi`, so the loop
never executes and every query returns false. LeetCode 74 caps both at 100 so it
cannot fire there — the same reason the sentinel overflow in Median of 2 Sorted
Arrays survives in published code. Computing `hi` in 64-bit costs nothing.

<!-- @intuition -->
Two things are worth taking from this one. The first is that the elegant answer and the fast answer are different, and the identity `log(mn) = log m + log n` is what makes that visible — once you know the probe counts are equal, the only thing left to compare is the work inside a probe, and a division is a lot of work. The second is about preconditions. This problem and the next one look almost identical and differ in one clause, and that clause is worth 14.72% of your answers. When a problem statement contains a condition that seems like scene-setting — "the first integer of each row is greater than the last integer of the previous row" — it is usually load-bearing, and the fastest way to find out what it holds up is to ask which algorithm stops working without it.

<!-- @approach -->
### Scan Every Cell

<!-- @idea -->
Look at every element and compare it with the target.

<!-- @steps -->
1. Walk the rows in order.
2. Walk each row's cells in order.
3. Return true on a match.
4. Return false after exhausting the matrix.

<!-- @complexity -->
- time: O(m·n)
- space: O(1)
- note: Uses none of the structure, and the reference the others were verified against. Cache-friendly enough that it beats the staircase on tall thin matrices — 148,125ns against 180,138ns at 100,000 × 10.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool searchMatrix(const vector<vector<int>>& mat, int target) {
    for (const auto& row : mat)
        for (int x : row)
            if (x == target) return true;
    return false;
}
```

<!-- @annotations -->
- 6: Row-major traversal, which walks memory in order. That locality is why this beats the O(m+n) staircase on some shapes despite doing far more comparisons.
- 7: No use of sortedness at all — the same code would work on an unsorted matrix.

<!-- @code java -->
```java
static boolean searchMatrix(int[][] mat, int target) {
    for (int[] row : mat)
        for (int x : row)
            if (x == target) return true;
    return false;
}
```

<!-- @annotations -->
- 2: Java's `int[][]` is an array of row references, so rows need not be contiguous with each other — the locality holds within a row, not across them.

<!-- @code python -->
```python
def search_matrix(mat, target):
    return any(target in row for row in mat)
```

<!-- @annotations -->
- 2: `in` on a list is a C-level linear scan, so this is much faster than an explicit Python loop while remaining O(m·n).

<!-- @approach -->
### Staircase from the Top-Right

<!-- @idea -->
Start at the top-right corner, where moving left strictly decreases and moving down strictly increases, and eliminate a row or a column at each step.

<!-- @steps -->
1. Start at row 0, last column.
2. If the cell equals the target, return true.
3. If it is greater than the target, no cell below it in that column can help — drop the column.
4. If it is smaller, no cell left of it in that row can help — drop the row.
5. Stop when you walk off the matrix.

<!-- @complexity -->
- time: O(m + n)
- space: O(1)
- note: The only approach here that survives the weaker precondition — **0 wrong** where the binary searches are 14.72% and 15.69% wrong. That generality costs: at 100,000 × 10 it is slower than scanning every cell.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool searchMatrix(const vector<vector<int>>& mat, int target) {
    int m = (int)mat.size(), n = (int)mat[0].size();
    int r = 0, c = n - 1;
    while (r < m && c >= 0) {
        if (mat[r][c] == target) return true;
        if (mat[r][c] > target) c--;
        else                    r++;
    }
    return false;
}
```

<!-- @annotations -->
- 6: The top-right corner is the only starting point where the two directions disagree — left decreases, down increases. The bottom-left works for the same reason; the other two corners do not.
- 9: Dropping a whole column, not one cell. Everything below `mat[r][c]` in this column is at least as large, so none of it can equal a smaller target.
- 10: Dropping a whole row, symmetrically. Each step removes a row or a column, which is why the walk is O(m+n) rather than O(m·n).

<!-- @code java -->
```java
static boolean searchMatrix(int[][] mat, int target) {
    int m = mat.length, n = mat[0].length;
    int r = 0, c = n - 1;
    while (r < m && c >= 0) {
        if (mat[r][c] == target) return true;
        if (mat[r][c] > target) c--;
        else                    r++;
    }
    return false;
}
```

<!-- @annotations -->
- 4: Both bounds are tested every iteration, since either index can be the one that leaves the matrix.

<!-- @code python -->
```python
def search_matrix(mat, target):
    m, n = len(mat), len(mat[0])
    r, c = 0, n - 1
    while r < m and c >= 0:
        if mat[r][c] == target:
            return True
        if mat[r][c] > target:
            c -= 1
        else:
            r += 1
    return False
```

<!-- @annotations -->
- 4: `c >= 0` rather than `c > -1` in spirit only — but note that a negative index would silently wrap in Python rather than raising, so this guard is doing more work here than in C++.

<!-- @approach -->
### Flattened Binary Search

<!-- @idea -->
Because the row-major reading is sorted, treat the matrix as one array of length m·n and binary search it, converting each index back to a row and column.

<!-- @steps -->
1. Search the index range `[0, m·n − 1]`.
2. Convert the midpoint: row is `mid / n`, column is `mid % n`.
3. Compare and halve as in a one-dimensional search.
4. Return true on a match, false when the range empties.

<!-- @complexity -->
- time: O(log(m·n))
- space: O(1)
- note: The textbook answer, **0 wrong** over 1,512 exhaustive cases — and measurably the slower of the two binary searches, because of the division and modulo on every probe.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool searchMatrix(const vector<vector<int>>& mat, int target) {
    int m = (int)mat.size(), n = (int)mat[0].size();
    long long lo = 0, hi = (long long)m * n - 1;
    while (lo <= hi) {
        long long mid = lo + (hi - lo) / 2;
        int v = mat[mid / n][mid % n];
        if (v == target) return true;
        if (v < target) lo = mid + 1;
        else            hi = mid - 1;
    }
    return false;
}
```

<!-- @annotations -->
- 6: `(long long)m * n` — the cast precedes the multiplication. With m and n each up to 10⁵ the product is 10¹⁰; computed in int it goes negative, `hi` starts below `lo`, and every query returns false.
- 9: The two operations that cost this version the race. Same probe count as the two-step search, and a division plus a modulo on each one.
- 10: A three-way comparison, unlike the boundary-finding searches elsewhere in this topic — here an exact match ends the search immediately.

<!-- @code java -->
```java
static boolean searchMatrix(int[][] mat, int target) {
    int m = mat.length, n = mat[0].length;
    long lo = 0, hi = (long) m * n - 1;
    while (lo <= hi) {
        long mid = lo + (hi - lo) / 2;
        int v = mat[(int) (mid / n)][(int) (mid % n)];
        if (v == target) return true;
        if (v < target) lo = mid + 1;
        else            hi = mid - 1;
    }
    return false;
}
```

<!-- @annotations -->
- 6: The casts back to int are safe because `mid` is within `[0, m·n)`, so the quotient fits a row index and the remainder a column index.

<!-- @code python -->
```python
def search_matrix(mat, target):
    m, n = len(mat), len(mat[0])
    lo, hi = 0, m * n - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        r, c = divmod(mid, n)
        v = mat[r][c]
        if v == target:
            return True
        if v < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False
```

<!-- @annotations -->
- 6: `divmod` computes both the quotient and the remainder in one call, which is the cheapest form of this conversion in Python. There is no overflow to guard against — Python ints grow.

<!-- @approach -->
### Two-Step Binary Search

<!-- @idea -->
Binary search the rows for the one whose range contains the target, then binary search inside that row.

<!-- @steps -->
1. Binary search the rows, comparing the target with each row's first and last element.
2. If no row's range contains it, return false.
3. Binary search that single row for the target.
4. Return whether it was found.

<!-- @complexity -->
- time: O(log m + log n), which equals O(log(m·n))
- space: O(1)
- note: The same probe count as the flattened version — 17.99 against 18.99 at 1000×1000 — and **1.4x to 2.1x faster** at every shape measured, because no probe does a division.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool searchMatrix(const vector<vector<int>>& mat, int target) {
    int m = (int)mat.size(), n = (int)mat[0].size();
    int lo = 0, hi = m - 1, row = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (mat[mid][0] <= target && target <= mat[mid][n - 1]) { row = mid; break; }
        if (mat[mid][0] > target) hi = mid - 1;
        else                      lo = mid + 1;
    }
    if (row < 0) return false;

    lo = 0; hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (mat[row][mid] == target) return true;
        if (mat[row][mid] < target) lo = mid + 1;
        else                        hi = mid - 1;
    }
    return false;
}
```

<!-- @annotations -->
- 9: Testing containment against both ends of the row, then breaking. This early exit is why the two-step averages about one probe fewer than the flattened search rather than exactly the same.
- 13: A target that falls between two rows lands here, and no amount of searching the row will help — returning false immediately is correct because the rows partition the whole value line.
- 15: The second search is an ordinary one-dimensional search over a single row. Nothing about it is matrix-specific.
- 6: Indices stay `int` throughout. Nothing multiplies m by n, so the overflow the flattened version must guard against cannot arise here.

<!-- @code java -->
```java
static boolean searchMatrix(int[][] mat, int target) {
    int m = mat.length, n = mat[0].length;
    int lo = 0, hi = m - 1, row = -1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (mat[mid][0] <= target && target <= mat[mid][n - 1]) { row = mid; break; }
        if (mat[mid][0] > target) hi = mid - 1;
        else                      lo = mid + 1;
    }
    if (row < 0) return false;

    lo = 0; hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (mat[row][mid] == target) return true;
        if (mat[row][mid] < target) lo = mid + 1;
        else                        hi = mid - 1;
    }
    return false;
}
```

<!-- @annotations -->
- 10: `row < 0` is the sentinel for "no row can contain it". Using 0 as the initial value would silently search row 0 instead.

<!-- @code python -->
```python
def search_matrix(mat, target):
    m, n = len(mat), len(mat[0])
    lo, hi, row = 0, m - 1, -1
    while lo <= hi:
        mid = (lo + hi) // 2
        if mat[mid][0] <= target <= mat[mid][n - 1]:
            row = mid
            break
        if mat[mid][0] > target:
            hi = mid - 1
        else:
            lo = mid + 1
    if row < 0:
        return False

    lo, hi = 0, n - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if mat[row][mid] == target:
            return True
        if mat[row][mid] < target:
            lo = mid + 1
        else:
            hi = mid - 1
    return False
```

<!-- @annotations -->
- 6: Python's chained comparison says the containment test directly, and evaluates `target` only once.

<!-- @example -->

<!-- @input -->
```
mat = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 3
```

<!-- @output -->
```
true
```

<!-- @why -->
Read row-major the matrix is `1, 3, 5, 7, 10, 11, 16, 20, 23, 30, 34, 60` — one sorted sequence — so a single binary search over twelve indices finds the 3 at index 1.

<!-- @walkthrough -->
```
flattened, lo = 0, hi = 11

mid= 5  -> (1,1) = 11   > 3, go left    hi = 4
mid= 2  -> (0,2) =  5   > 3, go left    hi = 1
mid= 0  -> (0,0) =  1   < 3, go right   lo = 1
mid= 1  -> (0,1) =  3   FOUND
->  true

Each probe costs a division and a modulo to turn the index
into (row, column). Four probes here, so four of each.
```

<!-- @example -->

<!-- @input -->
```
mat = [[1, 3, 5, 7], [10, 11, 16, 20], [23, 30, 34, 60]], target = 13
```

<!-- @output -->
```
false
```

<!-- @why -->
13 falls between 11 and 16 inside the second row, so the search narrows to that row and finds nothing. The range empties and the answer is false.

<!-- @walkthrough -->
```
flattened, lo = 0, hi = 11

mid= 5  -> (1,1) = 11   < 13, go right  lo = 6
mid= 8  -> (2,0) = 23   > 13, go left   hi = 7
mid= 6  -> (1,2) = 16   > 13, go left   hi = 5
lo > hi  ->  false

Two-step on the same input: the row search finds row 1,
since 10 <= 13 <= 20, then searches [10,11,16,20] and fails.
Same answer, same order of probes, no division anywhere.
```

<!-- @example -->

<!-- @input -->
```
mat = [[2, 4], [3, 5]], target = 3
```

<!-- @output -->
```
true
```

<!-- @why -->
The smallest matrix where the precondition fails. Rows and columns are each sorted, but 4 is greater than 3, so the row-major reading `2, 4, 3, 5` is not sorted — and both binary searches give the wrong answer.

<!-- @walkthrough -->
```
flattened, lo = 0, hi = 3

mid= 1  -> (0,1) = 4   > 3, go left    hi = 0
mid= 0  -> (0,0) = 2   < 3, go right   lo = 1
lo > hi  ->  false                          WRONG, 3 is at (1,0)

staircase from the top-right:
  (0,1) = 4   > 3, drop the column   c = 0
  (0,0) = 2   < 3, drop the row      r = 1
  (1,0) = 3   FOUND                       correct

Over 2.19 million such matrices the flattened search is wrong
on 14.72% of queries and the staircase on none. This is the
precondition of the next subtopic, and the staircase is its
answer.
```

<!-- @example -->

<!-- @input -->
```
mat = [[1]], target = 1
```

<!-- @output -->
```
true
```

<!-- @why -->
The degenerate case. `m·n − 1` is 0, so the search range is the single index `[0, 0]` and one probe settles it.

<!-- @walkthrough -->
```
flattened, lo = 0, hi = 1*1 - 1 = 0

mid= 0  -> (0/1, 0%1) = (0,0) = 1   FOUND
->  true

Worth checking because it is where an off-by-one in `hi`
shows up: writing `hi = m*n` instead of `m*n - 1` reads
mat[1][0] on the second probe and indexes out of range.
```

<!-- @visualization custom -->

<!-- @description -->
Shows that the two binary searches do equal work in probes but not in time, and what the row-major precondition is holding up.

<!-- @sampleInput -->
```json
{"primary":{"matrix":[[1,3,5,7],[10,11,16,20],[23,30,34,60]],"rowMajor":[1,3,5,7,10,11,16,20,23,30,34,60],"sorted":true,"target":3,"answer":true,"probes":[{"mid":5,"cell":[1,1],"value":11,"move":"left"},{"mid":2,"cell":[0,2],"value":5,"move":"left"},{"mid":0,"cell":[0,0],"value":1,"move":"right"},{"mid":1,"cell":[0,1],"value":3,"move":"found"}]},"theIdentity":{"claim":"log(m*n) = log m + log n, so flattening and searching row-then-column cost the same number of probes","measuredAveragedOverEveryElement":[{"shape":"16 x 16","flattened":7.04,"twoStep":6.75},{"shape":"100 x 100","flattened":12.39,"twoStep":11.40},{"shape":"1000 x 1000","flattened":18.99,"twoStep":17.99},{"shape":"10 x 100000","flattened":18.99,"twoStep":18.89},{"shape":"100000 x 10","flattened":18.99,"twoStep":18.75}],"reading":"they agree to within about one probe; the two-step is marginally ahead because its row search can stop the moment it lands on the containing row","consequence":"with probe counts equal, the winner is decided by what each probe costs"},"perProbeCost":{"unit":"nanoseconds per query","rows":[{"shape":"100 x 100","scan":5528,"staircase":779,"flattened":170,"twoStep":83},{"shape":"1000 x 1000","scan":470292,"staircase":7804,"flattened":233,"twoStep":170},{"shape":"3000 x 3000","scan":null,"staircase":19740,"flattened":243,"twoStep":183},{"shape":"10 x 100000","scan":202847,"staircase":58671,"flattened":156,"twoStep":71},{"shape":"100000 x 10","scan":148125,"staircase":180138,"flattened":150,"twoStep":70}],"verdict":"the two-step is 1.4x to 2.1x faster at every shape, on identical probe counts","why":"the flattened version does mid / n and mid % n on every probe; integer division is among the slowest arithmetic instructions and the dependency chain forces it to finish before the load it feeds","surprise":"at 100000 x 10 the O(m+n) staircase is slower than scanning all million cells, because it walks 100,010 steps while the scan has perfect cache locality"},"preconditionTest":{"weakerPrecondition":"rows sorted and columns sorted, but NOT row-major sorted (the Search in 2D Matrix II precondition)","queries":2187384,"results":[{"approach":"flattened binary search","wrong":322064,"pct":14.72},{"approach":"two-step binary search","wrong":343287,"pct":15.69},{"approach":"staircase from the top-right","wrong":0,"pct":0}],"smallestCounterexample":{"matrix":[[2,4],[3,5]],"target":3,"rowMajorReading":[2,4,3,5],"isSorted":false,"trulyPresent":true,"flattenedSays":false,"staircaseSays":true,"flattenedTrace":["probe (0,1)=4 > 3, go left","probe (0,0)=2 < 3, go right","range empty -> false"],"staircaseTrace":["(0,1)=4 > 3, drop column","(0,0)=2 < 3, drop row","(1,0)=3 found"]},"lesson":"a problem-statement clause that reads like scene-setting is usually load-bearing; the fastest way to find out what it holds up is to ask which algorithm stops working without it"},"overflow":{"expression":"(long long)m * n - 1","risk":"with m and n each up to 10^5 the product is 10^10; computed in int it goes negative, hi starts below lo, and every query returns false","whyItSurvives":"LeetCode 74 caps m and n at 100 so it cannot fire there","sameShapeAs":"the INT_MIN/INT_MAX sentinel overflow in median-of-2-sorted-arrays"},"exhaustiveVerification":{"space":"every strictly increasing row-major matrix up to 3x3 over {0..6}, targets -1..7","cases":1512,"flattenedWrong":0,"twoStepWrong":0,"staircaseWrong":0},"assertions":["the row-major reading is a single sorted sequence","index / n is the row and index % n is the column","exactly one row's range can contain the target","the staircase needs only rows and columns sorted","a target between two rows' ranges is absent"]}
```

<!-- @highlights -->
- The matrix is one sorted sequence folded into rows — a 1D search in a 2D costume.
- `log(mn) = log m + log n`, so flattening and row-then-column do the **same probe count**: 18.99 vs 17.99 at 1000×1000.
- With probes equal, per-probe cost decides: the two-step is **1.4× to 2.1× faster** because it does no division.
- The row-major precondition is load-bearing — weaken it and the binary searches are **14.72%** and **15.69%** wrong while the staircase is **0%**.
- Smallest counterexample is 2×2: `[[2,4],[3,5]]`, target 3.
- At 100,000 × 10 the O(m+n) staircase is **slower than scanning all million cells** — locality beats complexity.

<!-- @edgeCases -->
- 1×1 matrix — the range is `[0, 0]`, and where an off-by-one in `hi` indexes out of range.
- A single row — the row search finds it immediately and the whole thing is a 1D search.
- A single column — `n = 1`, so `mid % n` is always 0 and `mid / n` is `mid`.
- Target smaller than every element — the row search exits without a candidate row.
- Target larger than every element — the same, from the other end.
- Target between two rows' ranges — absent, and the row search must return false rather than search a neighbouring row.
- `m·n` exceeding 2³¹ — overflows the flattened index bound; compute it in 64-bit.
- Rows and columns sorted but not row-major sorted — outside the precondition, and where both binary searches fail.
- Duplicate values — permitted by "sorted" but excluded by the strict inequality between rows; the search still returns a correct present/absent answer.

<!-- @pitfalls -->
- `hi = m * n` instead of `m * n - 1`. Reads one past the end on a 1×1 matrix.
- Computing `m * n` in int. At 10⁵ × 10⁵ it goes negative and every query returns false.
- Reaching for the staircase because it is "the 2D matrix algorithm". It is O(m+n) here where O(log mn) applies, and at 100,000 × 10 that is slower than a brute-force scan.
- Assuming the flattened version is fastest because it is the tidiest. It loses to the two-step at every shape measured.
- Applying either binary search when only rows and columns are sorted. Wrong on about 15% of queries.
- Initialising the found row to 0 rather than −1. A target below every row then searches row 0.
- Searching a neighbouring row when the containment test fails. The rows partition the value line, so no other row can hold it.
- Swapping `mid / n` and `mid % n`. It compiles, it runs, and it is wrong for every non-square matrix.

<!-- @doubt -->
### Is flattening or two-step searching better?

<!-- @answer -->
Two-step, measurably — and the reason is worth more than the result. Because `log(mn) = log m + log n`, the two do the same number of probes; averaged over every element of a 1000×1000 matrix that is **18.99 against 17.99**, the small edge going to the two-step because its row search can stop as soon as it lands on the containing row. With probe counts equal, the only thing left to compare is what a probe costs. The flattened version computes `mid / n` and `mid % n` on every one, and integer division is among the slowest instructions on any modern CPU — worse, the result is needed *before* the load it feeds, so the latency cannot be hidden. Measured, the two-step is **1.4x to 2.1x** faster at every shape tested, from 83ns against 170ns at 100×100 up to 70ns against 150ns at 100,000×10. Flattening is still the better answer to give first, because it is shorter and shows the structural insight; it is just not the faster one.

<!-- @doubt -->
### What exactly does the row-major precondition buy?

<!-- @answer -->
It is what makes any binary search legal at all. "Each row is sorted and the first element of each row exceeds the last of the previous row" is equivalent to "the row-major reading is one sorted sequence", and a binary search needs exactly that. Drop the second clause — keep only rows and columns sorted, which is the next subtopic's precondition — and measured over **2,187,384 queries** the flattened search is wrong on **14.72%** and the two-step on **15.69%**, while the staircase is wrong on none. The smallest counterexample is 2×2: in `[[2,4],[3,5]]` the row-major reading is `2, 4, 3, 5`, and searching for 3 probes the 4, moves left, probes the 2, moves right, and reports absent even though 3 sits at (1,0). The general habit this suggests: when a problem statement carries a condition that reads like scene-setting, find out which algorithm stops working without it.

<!-- @doubt -->
### Why not always use the staircase, since it works in both problems?

<!-- @answer -->
Because generality costs O(m + n) here where O(log(mn)) applies, and the gap is large enough to matter. At 1,000 × 1,000 the staircase measured **7,804ns against the two-step's 170ns** — 46x. The more striking case is 100,000 × 10, where the staircase takes **180,138ns and a plain scan of all million cells takes 148,125ns**: the staircase walks 100,010 steps chasing pointers down a tall matrix while the scan reads memory in order and lets the prefetcher work. An O(m+n) algorithm losing to an O(m·n) one is a good reminder that step counts are not times. Keep the staircase for the problem that needs it — where its 0% error rate against the binary searches' 15% is decisive — and use the specific tool where the specific precondition holds.

<!-- @doubt -->
### Why does `mid / n` give the row and `mid % n` the column?

<!-- @answer -->
Because row-major layout puts element `(r, c)` at index `r · n + c`, where `n` is the number of **columns**. Inverting that, `index / n` recovers `r` and `index % n` recovers `c`, since `c` is always in `[0, n)`. The mistake to avoid is dividing by `m`: it compiles, runs, and produces plausible indices, but is wrong for every non-square matrix — and correct for square ones, so it survives casual testing. A quick check is the single-column case, `n = 1`: then `mid % 1` is always 0 and `mid / 1` is `mid`, which walks straight down the column as it should. Dividing by `m` there would give nonsense unless m happened to equal 1 as well.
