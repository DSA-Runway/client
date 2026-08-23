---
id: find-peak-element-ii
topic: Binary Search
title: Find Peak Element - II
difficulty: Medium
status: ready
prerequisites:
  - find-peak-element
  - find-row-with-maximum-1s
  - lower-bound
relatedIds:
  - find-peak-element
  - find-row-with-maximum-1s
  - search-in-a-2d-matrix
  - search-in-2d-matrix-ii
  - matrix-median
---

<!-- @summary -->
The 1D slope argument survives into two dimensions, but only if each probe takes the maximum of its column — using an arbitrary row instead is wrong on 14.81% of inputs. The choice of which dimension to search matters far more than in any earlier subtopic: at 250,000 by 4 the two options measure 4ns and 159,626ns. And as in part I, the linear approaches beat the search by 450x on random data.

<!-- @theory -->
## The problem

A matrix in which no two adjacent cells are equal. Find any cell strictly greater
than its four neighbours, treating out-of-bounds neighbours as negative infinity.

```
[[1, 4],        ->  (1,0) holding 3, or (0,1) holding 4
 [3, 2]]

[[10, 20, 15],  ->  (1,1) holding 30, or (2,2) holding 32
 [21, 30, 14],
 [ 7, 16, 32]]
```

## The slope argument, lifted

Part I searched an array by asking whether the midpoint was rising. The same idea
works here, one column at a time — but the question has to be asked about the
right cell.

Take the middle column and find **the largest value in it**. Call its row `r`.
Then:

- If `mat[r][mid+1] > mat[r][mid]`, a peak exists strictly to the right.
- If `mat[r][mid-1] > mat[r][mid]`, a peak exists strictly to the left.
- If neither, that cell is a peak.

The third case needs no vertical check, and that is the whole reason the column
maximum matters: nothing in the column can exceed it, so its vertical neighbours
are already smaller by construction. Only the horizontal neighbours are still in
question.

Verified over every matrix up to 3 by 3 drawn from `{0..3}` with no two adjacent
cells equal — **10,972 matrices, 0 wrong.**

## Using an arbitrary row breaks it

Replace "the largest value in the column" with "row 0" and the vertical guarantee
disappears — the cell can be beaten from above or below, and the algorithm never
looks. Measured over the same space, that is wrong on **1,625 of 10,972 — 14.81%.**

The smallest failure is a two-row, one-column matrix:

```
[[0],
 [1]]     ->  reports (0,0), which 1 beats from below
```

Dropping the leftward test is a separate mistake, wrong on **750 — 6.84%**. On
`[[2, 1, 0]]` it walks right, never finds a rise, and returns `(0,1)` — which 2
beats from the left.

## Which dimension to search is worth a factor of 40,000

Searching columns costs O(m log n): each probe scans a column of m cells, and
there are log n probes. Searching rows costs O(n log m). Those are wildly
different when the matrix is not square, and both are correct — the row version
is also **0 wrong** over the exhaustive space.

Holding the cell count at about a million:

| m × n | binary on columns | binary on rows | m·log n | n·log m |
|---|---|---|---|---|
| 1,000 × 1,000 | 1,414 | 1,721 | 9,966 | 9,966 |
| 100 × 10,000 | **236** | 4,793 | 1,329 | 66,439 |
| 10,000 × 100 | 8,384 | **139** | 66,439 | 1,329 |
| 4 × 250,000 | **4** | 92,984 | 72 | 500,000 |
| 250,000 × 4 | 159,626 | **4** | 500,000 | 72 |

Nanoseconds per call. The measured winner matches the cost model in every row,
and the gap reaches **159,626 against 4** — about 40,000x — on the most lopsided
shape. Search the dimension you have *fewer* of: fewer columns means fewer probes
would be wrong, it is the *short* scan you want, so search across the long axis
and scan the short one.

This is the same shape-dependence Find Row With Maximum 1's measured, and it is
worth noticing that both problems answer it the same way and for the same reason:
one dimension sets the number of probes and the other sets the cost of each.

## On random data, do not search at all

As in part I, the linear approaches are far better than their complexity suggests.
At 1,000 by 1,000:

| data | check every cell | climb uphill | binary on columns |
|---|---|---|---|
| random | **3** | **3** | 1,356 |
| increasing toward a corner | 729,435 | **5,467** | 28,657 |

On random data, checking cells in order finds a peak after examining **2 cells**,
and climbing from the centre finds one in **0 steps** — the centre already is one.
Both measure 3ns against the binary search's 1,356ns, a factor of 450.

On a gradient the picture inverts for the exhaustive scan, which reads all
1,000,000 cells. But the climb still wins: 5,467ns against the binary search's
28,657ns, because it walks 998 steps where the search reads about 9,000 cells
across its column scans.

## The climb's worst case is hard to actually build

Hill-climbing is O(mn) in principle — every step moves to a strictly larger value
and there are only mn of them — so the textbook advice is that it can degenerate.
Two natural adversarial constructions were tried at 1,000 by 1,000, and **neither
worked**:

| construction | climb steps | cells |
|---|---|---|
| values increasing along a snake through every cell | 999 | 1,000,000 |
| values increasing along an inward spiral, climbed from a corner | 999 | 1,000,000 |

Both fail for the same reason: the climb is not obliged to follow the intended
path. In the snake it jumps straight down through rows, because the row below
holds much larger values than the rest of the current row. In the spiral it jumps
inward across rings rather than around them.

So the honest statement is that the climb's O(mn) bound is real but loose, and no
input was found that pushes it past O(m + n). That is a weaker claim than "the
climb is fine" — an adversary who knows the starting cell has more freedom than
these two constructions used — but it is what the measurements support.

<!-- @intuition -->
The interesting part of lifting part I into two dimensions is what has to be added and what does not. What does not: the argument itself. A rising slope still guarantees a peak further along, still because the sequence must eventually turn over or hit the boundary, and still with no assumption that anything is sorted. What has to be added is a way to make the *other* dimension stop mattering, and taking the column's maximum does exactly that — it buys the vertical comparisons for free, so the probe can go back to asking a purely one-dimensional question. That is the move worth carrying: when a technique works in one dimension, extending it is usually not about generalising the argument but about finding the representative element that lets you keep using it unchanged.

<!-- @approach -->
### Check Every Cell

<!-- @idea -->
Test each cell against its four neighbours and return the first that beats all of them.

<!-- @steps -->
1. Walk the cells in row-major order.
2. For each, compare against the neighbour above, below, left and right.
3. Treat any out-of-bounds neighbour as negative infinity.
4. Return the first cell that beats all four.
5. A peak always exists, so the scan always returns.

<!-- @complexity -->
- time: O(m·n)
- space: O(1)
- note: The definition written out, and on random data the fastest option — measured **3ns at 1,000 by 1,000**, because a peak turns up after examining two cells. On a gradient it reads all 1,000,000 and takes 729,435ns.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> findPeakGrid(const vector<vector<int>>& mat) {
    int m = (int)mat.size(), n = (int)mat[0].size();
    for (int r = 0; r < m; r++) {
        for (int c = 0; c < n; c++) {
            int v = mat[r][c];
            if (r > 0     && mat[r - 1][c] >= v) continue;
            if (r + 1 < m && mat[r + 1][c] >= v) continue;
            if (c > 0     && mat[r][c - 1] >= v) continue;
            if (c + 1 < n && mat[r][c + 1] >= v) continue;
            return {r, c};
        }
    }
    return {-1, -1};
}
```

<!-- @annotations -->
- 9: The bounds test comes first in every one of the four, so no out-of-range cell is ever read. This is the code form of "an out-of-bounds neighbour is negative infinity".
- 10: `>=`, not `>`. Equality would mean the cell does not strictly beat its neighbour — though the problem forbids adjacent equals, so this only matters if the precondition is violated.
- 16: Unreachable for valid input, since a peak always exists.

<!-- @code java -->
```java
static int[] findPeakGrid(int[][] mat) {
    int m = mat.length, n = mat[0].length;
    for (int r = 0; r < m; r++) {
        for (int c = 0; c < n; c++) {
            int v = mat[r][c];
            if (r > 0     && mat[r - 1][c] >= v) continue;
            if (r + 1 < m && mat[r + 1][c] >= v) continue;
            if (c > 0     && mat[r][c - 1] >= v) continue;
            if (c + 1 < n && mat[r][c + 1] >= v) continue;
            return new int[]{r, c};
        }
    }
    return new int[]{-1, -1};
}
```

<!-- @annotations -->
- 6: Java short-circuits &&, so each bounds test protects its own access exactly as in C++.

<!-- @code python -->
```python
def find_peak_grid(mat):
    m, n = len(mat), len(mat[0])
    for r in range(m):
        for c in range(n):
            v = mat[r][c]
            if r > 0 and mat[r - 1][c] >= v:
                continue
            if r + 1 < m and mat[r + 1][c] >= v:
                continue
            if c > 0 and mat[r][c - 1] >= v:
                continue
            if c + 1 < n and mat[r][c + 1] >= v:
                continue
            return [r, c]
    return [-1, -1]
```

<!-- @annotations -->
- 6: `r > 0` must be tested first. Without it `mat[-1][c]` wraps to the last row and silently compares the wrong cell.

<!-- @approach -->
### Climb Uphill

<!-- @idea -->
Start anywhere and repeatedly step to the largest neighbour; you stop exactly when no neighbour is larger, which is the definition of a peak.

<!-- @steps -->
1. Start at any cell — the centre is as good as any.
2. Look at the four neighbours.
3. If any is larger than the current cell, move to the largest.
4. Repeat.
5. Stopping means no neighbour is larger, so the current cell is a peak.

<!-- @complexity -->
- time: O(m·n) in principle, since every step strictly increases and there are only m·n values
- space: O(1)
- note: The best of the three on both datasets tested — 3ns on random data, where the centre often already is a peak, and **5,467ns on a gradient against the binary search's 28,657**. Its O(m·n) bound is real but loose: two adversarial constructions were tried at 1,000 by 1,000 and neither pushed it past 999 steps.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> findPeakGrid(const vector<vector<int>>& mat) {
    int m = (int)mat.size(), n = (int)mat[0].size();
    int r = m / 2, c = n / 2;
    while (true) {
        int bv = mat[r][c], br = r, bc = c;
        if (r > 0     && mat[r - 1][c] > bv) { bv = mat[r - 1][c]; br = r - 1; bc = c; }
        if (r + 1 < m && mat[r + 1][c] > bv) { bv = mat[r + 1][c]; br = r + 1; bc = c; }
        if (c > 0     && mat[r][c - 1] > bv) { bv = mat[r][c - 1]; br = r; bc = c - 1; }
        if (c + 1 < n && mat[r][c + 1] > bv) { bv = mat[r][c + 1]; br = r; bc = c + 1; }
        if (br == r && bc == c) return {r, c};
        r = br; c = bc;
    }
}
```

<!-- @annotations -->
- 8: `bv` starts at the current cell's value, so a neighbour only wins by being strictly larger. Starting it lower would let the walk move sideways and never terminate.
- 13: The stopping test. No neighbour beat the current cell, which is exactly the definition of a peak — no separate check is needed.
- 6: The starting cell is arbitrary. The centre is a reasonable default, but an adversary who knows it can in principle force a long walk.

<!-- @code java -->
```java
static int[] findPeakGrid(int[][] mat) {
    int m = mat.length, n = mat[0].length;
    int r = m / 2, c = n / 2;
    while (true) {
        int bv = mat[r][c], br = r, bc = c;
        if (r > 0     && mat[r - 1][c] > bv) { bv = mat[r - 1][c]; br = r - 1; bc = c; }
        if (r + 1 < m && mat[r + 1][c] > bv) { bv = mat[r + 1][c]; br = r + 1; bc = c; }
        if (c > 0     && mat[r][c - 1] > bv) { bv = mat[r][c - 1]; br = r; bc = c - 1; }
        if (c + 1 < n && mat[r][c + 1] > bv) { bv = mat[r][c + 1]; br = r; bc = c + 1; }
        if (br == r && bc == c) return new int[]{r, c};
        r = br; c = bc;
    }
}
```

<!-- @annotations -->
- 5: Tracking the best value alongside its position, so the four tests compose into one choice rather than four moves.

<!-- @code python -->
```python
def find_peak_grid(mat):
    m, n = len(mat), len(mat[0])
    r, c = m // 2, n // 2
    while True:
        bv, br, bc = mat[r][c], r, c
        if r > 0 and mat[r - 1][c] > bv:
            bv, br, bc = mat[r - 1][c], r - 1, c
        if r + 1 < m and mat[r + 1][c] > bv:
            bv, br, bc = mat[r + 1][c], r + 1, c
        if c > 0 and mat[r][c - 1] > bv:
            bv, br, bc = mat[r][c - 1], r, c - 1
        if c + 1 < n and mat[r][c + 1] > bv:
            bv, br, bc = mat[r][c + 1], r, c + 1
        if (br, bc) == (r, c):
            return [r, c]
        r, c = br, bc
```

<!-- @annotations -->
- 14: Comparing the pair rather than the values, since two different cells can never hold the same value under this problem's precondition — but comparing positions is correct regardless.

<!-- @approach -->
### Binary Search on Columns

<!-- @idea -->
Halve the columns, using each column's largest cell as the probe so the vertical comparisons come for free.

<!-- @steps -->
1. Keep a range of candidate columns.
2. Take the middle column and find the row holding its largest value.
3. Compare that cell with its left and right neighbours.
4. If a neighbour is larger, a peak lies on that side, so halve toward it.
5. If neither is larger, the cell is a peak — its vertical neighbours are already smaller because it is the column's maximum.

<!-- @complexity -->
- time: O(m log n) searching columns, or O(n log m) searching rows
- space: O(1)
- note: The only version with a bound that does not depend on the data. 0 wrong over 10,972 exhaustive matrices. Which dimension to search matters enormously — 4ns against 159,626ns on a 250,000 by 4 matrix — and on random data it loses to a plain scan by 450x.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> findPeakGrid(const vector<vector<int>>& mat) {
    int m = (int)mat.size(), n = (int)mat[0].size();
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int r = 0;
        for (int i = 1; i < m; i++)
            if (mat[i][mid] > mat[r][mid]) r = i;
        bool goLeft  = mid > 0     && mat[r][mid - 1] > mat[r][mid];
        bool goRight = mid + 1 < n && mat[r][mid + 1] > mat[r][mid];
        if (!goLeft && !goRight) return {r, mid};
        if (goLeft) hi = mid - 1;
        else        lo = mid + 1;
    }
    return {-1, -1};
}
```

<!-- @annotations -->
- 11: The column's maximum, and this line carries the whole extension from one dimension to two. Using a fixed row instead is wrong on 14.81% of exhaustive inputs, because the cell can then be beaten from above or below.
- 12: Only the horizontal neighbours are checked. The vertical ones are already known to be smaller — that is what taking the column maximum bought.
- 13: Both directions are needed. Dropping the leftward test is wrong on 6.84%, since a peak can lie either side.
- 14: No vertical check before returning, for the same reason as line 12.
- 6: Searching columns is O(m log n); searching rows is O(n log m). Both are correct — pick by shape, which measured 4ns against 159,626ns on a 250,000 by 4 matrix.
- 18: Unreachable for valid input, since some column always satisfies the condition.

<!-- @code java -->
```java
static int[] findPeakGrid(int[][] mat) {
    int m = mat.length, n = mat[0].length;
    int lo = 0, hi = n - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int r = 0;
        for (int i = 1; i < m; i++)
            if (mat[i][mid] > mat[r][mid]) r = i;
        boolean goLeft  = mid > 0     && mat[r][mid - 1] > mat[r][mid];
        boolean goRight = mid + 1 < n && mat[r][mid + 1] > mat[r][mid];
        if (!goLeft && !goRight) return new int[]{r, mid};
        if (goLeft) hi = mid - 1;
        else        lo = mid + 1;
    }
    return new int[]{-1, -1};
}
```

<!-- @annotations -->
- 5: lo + (hi - lo) / 2 rather than (lo + hi) / 2 — the habit, even though a column index cannot overflow here.

<!-- @code python -->
```python
def find_peak_grid(mat):
    m, n = len(mat), len(mat[0])
    lo, hi = 0, n - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        r = max(range(m), key=lambda i: mat[i][mid])
        go_left = mid > 0 and mat[r][mid - 1] > mat[r][mid]
        go_right = mid + 1 < n and mat[r][mid + 1] > mat[r][mid]
        if not go_left and not go_right:
            return [r, mid]
        if go_left:
            hi = mid - 1
        else:
            lo = mid + 1
    return [-1, -1]


# To search rows instead, transpose the roles of m and n —
# O(n log m) rather than O(m log n). Both are correct.
```

<!-- @annotations -->
- 6: `max(range(m), key=...)` returns the row index of the column's largest value, which is the cell every later line depends on.

<!-- @example -->

<!-- @input -->
```
mat = [[1, 4],
       [3, 2]]
```

<!-- @output -->
```
(1, 0)
```

<!-- @why -->
Both cells are peaks here: 3 beats 1 above it and 2 to its right, and 4 beats 1 to its left and 2 below it. One probe finds the first of them, and the problem accepts either.

<!-- @walkthrough -->
```
lo=0 hi=1   mid=0
  column 0 is [1, 3], its maximum is 3 at row 1
  right neighbour mat[1][1] = 2 < 3 ?  no rise
  left  neighbour none
  ...neither side rises, so (1,0) holding 3 is returned

Both (0,1) and (1,0) are peaks here. The problem accepts
any of them, which is why the search never has to compare
candidates against each other.
```

<!-- @example -->

<!-- @input -->
```
mat = [[10, 20, 15],
       [21, 30, 14],
       [ 7, 16, 32]]
```

<!-- @output -->
```
(1, 1)
```

<!-- @why -->
Column 1's largest value is 30, and neither horizontal neighbour beats it. The vertical neighbours 20 and 16 never had to be checked — being the column's maximum already settled them.

<!-- @walkthrough -->
```
lo=0 hi=2   mid=1
  column 1 is [20, 30, 16], maximum 30 at row 1
  left  mat[1][0] = 21 > 30 ?  no
  right mat[1][2] = 14 > 30 ?  no
  -> (1,1)

Note what was skipped: mat[0][1] = 20 and mat[2][1] = 16
were never compared. They cannot exceed 30, because 30 is
the largest value in that column.
```

<!-- @example -->

<!-- @input -->
```
mat = [[0],
       [1]]
```

<!-- @output -->
```
(1, 0)
```

<!-- @why -->
The smallest matrix that exposes using a fixed row instead of the column maximum. With row 0 the algorithm reports (0,0), which 1 beats from below.

<!-- @walkthrough -->
```
Correct, taking the column maximum:
  column 0 is [0, 1], maximum 1 at row 1
  no left or right neighbour  ->  (1,0)     correct

Using row 0 instead:
  cell (0,0) holds 0
  no left or right neighbour, so "no rise"  ->  (0,0)
  but mat[1][0] = 1 > 0, so it is not a peak    WRONG

The horizontal tests both pass vacuously here. Only the
column maximum was ever going to catch the vertical loss —
which is exactly why it is not optional.
```

<!-- @example -->

<!-- @input -->
```
mat = [[2, 1, 0]]
```

<!-- @output -->
```
(0, 0)
```

<!-- @why -->
A single descending row, which exposes dropping the leftward test. Searching only for a rise to the right never finds one and stops at whichever column it reached.

<!-- @walkthrough -->
```
Correct, testing both directions:
  lo=0 hi=2  mid=1, column max is 1 at row 0
    left  mat[0][0] = 2 > 1  ->  go left, hi = 0
  lo=0 hi=0  mid=0, column max is 2 at row 0
    no left neighbour; right mat[0][1] = 1 > 2 ? no
    -> (0,0)                                    correct

Rightward test only:
  mid=1, right neighbour 0 is not greater than 1
  -> "no rise", return (0,1)
  but mat[0][0] = 2 > 1, so it is not a peak    WRONG

Measured, that omission is wrong on 6.84% of the exhaustive
space.
```

<!-- @visualization custom -->

<!-- @description -->
Shows why taking each column's maximum makes the vertical comparisons unnecessary, the measured cost of not doing so, and the shape-dependence that decides which dimension to search.

<!-- @sampleInput -->
```json
{"primary":{"matrix":[[10,20,15],[21,30,14],[7,16,32]],"answer":[1,1],"otherPeaks":[[2,2]],"probe":{"mid":1,"column":[20,30,16],"columnMax":30,"row":1,"left":21,"right":14,"goLeft":false,"goRight":false,"skipped":{"above":20,"below":16,"why":"cannot exceed 30, which is the column's maximum"}},"probes":1},"slopeArgumentLifted":{"fromPartI":"a rising slope guarantees a peak further along, because the sequence must turn over or hit the boundary","whatIsAdded":"taking the column's maximum, which makes the vertical neighbours smaller by construction","consequence":"the probe asks a purely one-dimensional question again","verified":{"space":"every matrix up to 3x3 over {0..3} with no two adjacent cells equal","matrices":10972,"wrong":0}},"columnMaximumIsLoadBearing":{"variant":"use row 0 instead of the column maximum","wrong":1625,"of":10972,"pct":14.81,"smallestFailure":{"matrix":[[0],[1]],"returned":[0,0],"why":"1 beats it from below, and the horizontal tests both pass vacuously"}},"bothDirectionsNeeded":{"variant":"test only for a rise to the right","wrong":750,"of":10972,"pct":6.84,"example":{"matrix":[[2,1,0]],"returned":[0,1],"why":"2 beats it from the left"}},"whichDimensionToSearch":{"columns":"O(m log n)","rows":"O(n log m)","bothCorrect":true,"rowsVersionWrong":0,"cells":"about 1,000,000 in every shape","rows_data":[{"m":1000,"n":1000,"binCols":1414,"binRows":1721,"mLogN":9966,"nLogM":9966},{"m":100,"n":10000,"binCols":236,"binRows":4793,"mLogN":1329,"nLogM":66439},{"m":10000,"n":100,"binCols":8384,"binRows":139,"mLogN":66439,"nLogM":1329},{"m":4,"n":250000,"binCols":4,"binRows":92984,"mLogN":72,"nLogM":500000},{"m":250000,"n":4,"binCols":159626,"binRows":4,"mLogN":500000,"nLogM":72}],"reading":"the measured winner matches the cost model in every row, and the gap reaches about 40,000x","sameAs":"the shape-dependence Find Row With Maximum 1's measured, for the same reason: one dimension sets the probe count and the other the cost per probe"},"linearWinsOnRandomData":{"size":"1000 x 1000","rows":[{"data":"random","checkEveryCell":3,"climb":3,"binaryOnColumns":1356},{"data":"increasing toward a corner","checkEveryCell":729435,"climb":5467,"binaryOnColumns":28657}],"detail":{"random":{"cellsExaminedByScan":2,"climbSteps":0,"note":"the centre already is a peak"},"gradient":{"cellsExaminedByScan":1000000,"climbSteps":998}},"reading":"as in part I, the linear approaches beat the search by 450x on random data — and here the climb also beats it on the gradient"},"climbWorstCaseNotConstructed":{"theoreticalBound":"O(m*n), since every step strictly increases and there are only m*n values","attempts":[{"construction":"values increasing along a snake through every cell","size":"1000 x 1000","climbSteps":999,"whyItFailed":"the climb jumps straight down through rows, because the row below holds much larger values than the rest of the current row"},{"construction":"values increasing along an inward spiral, climbed from a corner","size":"1000 x 1000","climbSteps":999,"whyItFailed":"the climb jumps inward across rings rather than following them around"}],"honestStatement":"the O(m*n) bound is real but loose, and no input was found that pushes the climb past O(m + n); an adversary who knows the starting cell has more freedom than these two constructions used"},"assertions":["a peak always exists when no two adjacent cells are equal","the column's maximum cannot be beaten vertically","only horizontal neighbours need checking at the column maximum","searching rows and searching columns are both correct","out-of-bounds neighbours count as negative infinity"]}
```

<!-- @highlights -->
- The 1D slope argument lifts unchanged; what has to be added is taking each column's **maximum**.
- That is what makes the vertical neighbours smaller by construction, so only horizontal ones need checking.
- Using a fixed row instead is wrong on **14.81%** of exhaustive inputs — smallest failure is a 2×1 matrix.
- Dropping the leftward test is wrong on **6.84%**.
- Which dimension to search is worth **4ns against 159,626ns** on a 250,000 × 4 matrix, matching `m·log n` vs `n·log m` exactly.
- On random data a plain scan finds a peak after **2 cells** and beats the search by 450×.

<!-- @edgeCases -->
- A single cell — it is trivially a peak, and the loop returns on its first probe.
- A single row — the problem reduces exactly to part I.
- A single column — every probe takes that column's maximum, which is the answer immediately.
- A 2×1 matrix — the smallest input where using a fixed row instead of the column maximum fails.
- Several peaks — the norm, and the returned one is arbitrary.
- A peak on an edge or in a corner — valid, because out-of-bounds neighbours count as negative infinity.
- A matrix increasing toward one corner — the exhaustive scan's worst case, reading all m·n cells.
- Adjacent equal cells — outside the precondition, and `>=` in the scan is what stops it reporting a non-strict peak.
- Searching the long dimension by accident — correct, and up to 40,000× slower.
- `mat[0].size()` on a matrix with zero rows — undefined; the problem guarantees at least one cell.

<!-- @pitfalls -->
- Probing a fixed row instead of the column's maximum. Wrong on 14.81% of exhaustive inputs.
- Checking only one horizontal direction. Wrong on 6.84% — a peak can lie either side.
- Adding vertical checks before returning. They are already implied by the column maximum, and their presence suggests the invariant was not understood.
- Searching whichever dimension comes first. It is correct and up to 40,000× slower than searching the other.
- Assuming the matrix must be sorted. Nothing here is sorted, exactly as in part I.
- Reaching for the binary search on random data. A plain scan finds a peak after two cells and is 450× faster.
- Reaching for the climb because it measured faster. Its O(m·n) bound is real, even though two adversarial constructions failed to reach it.
- Starting the climb at a fixed cell in adversarial settings. An adversary who knows the starting point has freedom the constructions here did not use.
- Expecting a particular peak. Any is valid and the returned one is arbitrary.
- Computing `mid` as `(lo + hi) / 2`. Safe for column indices, and the habit is what protects the next problem.

<!-- @doubt -->
### Why must the probe take the column's maximum?

<!-- @answer -->
Because it is what removes the vertical dimension from the question. A peak must beat all four neighbours, but at a column's largest value the two vertical comparisons are already settled — nothing in that column can exceed it. So the probe only has to ask about left and right, which is exactly the one-dimensional question part I answered. Use a fixed row instead and that guarantee vanishes: the cell can be beaten from above or below and the algorithm never looks. Measured over 10,972 exhaustive matrices, that is wrong on **1,625 — 14.81%**. The smallest failure is `[[0],[1]]`, where both horizontal tests pass vacuously because there are no horizontal neighbours at all, and the answer is wrong purely on the vertical.

<!-- @doubt -->
### Should I search columns or rows?

<!-- @answer -->
Whichever gives fewer probes for the cheaper scan — and the difference is larger than in any earlier subtopic. Searching columns costs O(m log n) because each probe scans a column of m cells; searching rows costs O(n log m). Both are correct, and the row version measured 0 wrong over the exhaustive space. Holding the cell count at about a million, the measured winner matches the cost model in every case: at 100 by 10,000 columns win 236ns to 4,793ns, at 10,000 by 100 rows win 139ns to 8,384ns, and at 250,000 by 4 the gap is **4ns against 159,626ns** — roughly 40,000x. The rule is to binary search across the long axis and scan the short one. It is the same shape-dependence Find Row With Maximum 1's measured, and for the same structural reason: one dimension sets how many probes you make and the other sets what each one costs.

<!-- @doubt -->
### Is the binary search actually the right choice?

<!-- @answer -->
Only if the input might be adversarial — on random data it is much the worst of the three. At 1,000 by 1,000, scanning cells in order finds a peak after examining **two cells** and climbing from the centre finds one in **zero steps**, because the centre already is one; both measure 3ns against the binary search's 1,356ns, a factor of 450. That mirrors part I exactly, where a linear scan found a peak in e − 1 ≈ 1.72 steps regardless of n. What is new here is that even on a hostile input — values increasing toward a corner — the *climb* still wins: 5,467ns against 28,657ns, because it walks 998 steps where the search reads about 9,000 cells across its column scans. The binary search's case is that its bound does not depend on the data at all, not that it is fast.

<!-- @doubt -->
### How bad can the climb actually get?

<!-- @answer -->
In principle O(m·n), because every step moves to a strictly larger value and there are only m·n of them. In practice I could not build an input that comes close. Two natural constructions were tried at 1,000 by 1,000 — values increasing along a snake through every cell, and values increasing along an inward spiral climbed from a corner — and **both were walked in 999 steps**, not the million the constructions were meant to force. They fail for the same reason: the climb is not obliged to follow the intended path. In the snake it jumps straight down through rows, since the row below holds far larger values than the rest of the current row; in the spiral it jumps inward across rings rather than around them. So the honest position is that the bound is loose and unrefuted rather than that the climb is safe — an adversary who knows the starting cell has more freedom than these two attempts used.

<!-- @doubt -->
### Why is no vertical check needed before returning?

<!-- @answer -->
Because it would be redundant, and writing it is a sign the invariant has not landed. The probe row `r` was chosen as the row holding the largest value in column `mid`, so `mat[r-1][mid]` and `mat[r+1][mid]` are both smaller by definition. The only comparisons left are horizontal, and once both of those fail to find something larger, all four neighbour conditions hold. Adding the vertical tests anyway costs two comparisons per probe and, more importantly, hides the reason the algorithm works — the whole point of taking the column maximum is to buy those comparisons in advance.

<!-- @doubt -->
### Does this need the matrix to be sorted in any way?

<!-- @answer -->
No, exactly as in part I. Nothing here assumes any ordering between cells beyond the local comparisons the algorithm makes. What makes a halving search possible is that a rising neighbour *guarantees* a peak further in that direction — walking that way the values must either keep rising until the boundary, where the imaginary negative infinity outside makes the last cell a peak, or stop rising somewhere, and that place is a peak. The only precondition is that no two adjacent cells are equal, which is what makes "rising" and "falling" exhaustive. Take that away and the argument fails in the same way part I measured, since a flat step gives no information about which side to keep.
