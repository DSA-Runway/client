---
id: maximum-rectangles
topic: Stacks
title: Maximum Rectangles
difficulty: Hard
status: ready
prerequisites:
  - largest-rectangle-in-a-histogram
  - next-smaller-element
  - sum-of-subarray-minimums
  - trapping-rainwater
relatedIds:
  - largest-rectangle-in-a-histogram
  - trapping-rainwater
  - next-smaller-element
  - sum-of-subarray-minimums
  - implement-min-stack
---

<!-- @summary -->
The previous subtopic applied row by row: every row of a binary matrix becomes a histogram, and the answer is the best rectangle over all of them. Two measured results complicate the obvious story. Rebuilding each row's heights instead of updating them incrementally looks almost free on random data — 1.5x to 2.4x — and then costs **63.7x** on an all-ones matrix, because the quadratic term only appears when runs of 1s are long. And the stack, which is the whole reason this problem is here, is beaten by a stackless left/right DP at **every density except a narrow band around 50%**, where it wins by 4%. At 95% ones the DP is **0.30x** the stack's time.

<!-- @theory -->
## The problem

Given a matrix of 0s and 1s, find the area of the largest rectangle made
entirely of 1s.

```
1 0 1 0 0
1 0 1 1 1        ->  6
1 1 1 1 1
1 0 0 1 0
```

The 6 is the 2x3 block in rows 2-3, columns 3-5.

## The reduction

Fix a bottom row `r`. Any rectangle whose bottom edge lies on row `r` is
determined by how far up each column of 1s extends from that row. Define

```
height[c] = number of consecutive 1s ending at row r in column c
```

Then the rectangles with their bottom edge on row `r` are exactly the rectangles
that fit inside the histogram given by `height`. That is the previous subtopic,
unchanged.

Every rectangle has *some* bottom row, so running the histogram solution once
per row and taking the maximum covers every candidate. The whole problem is that
sentence.

```
row 1:  1 0 1 0 0     heights  1 0 1 0 0     best 1
row 2:  1 0 1 1 1     heights  2 0 2 1 1     best 3
row 3:  1 1 1 1 1     heights  3 1 3 2 2     best 6     <- 2 x 3
row 4:  1 0 0 1 0     heights  4 0 0 3 0     best 4
```

## Maintaining the heights

There are two ways to produce `height` for each row, and the difference is the
first thing worth measuring.

**Rebuild.** For each cell, walk upward counting 1s until a 0 stops you. Simple,
obviously correct, and O(R) per cell in the worst case.

**Update.** Carry the array from the previous row:

```
height[c] = matrix[r][c] ? height[c] + 1 : 0
```

O(1) per cell, and the reset on a 0 is the entire content of the line.

The asymptotic difference is a factor of `R`, so the update should be
enormously better. Measured at 600x600, it mostly is not:

```
density   rebuild        incremental     ratio
 25%       3,546,834 ns    2,420,792 ns    1.5x
 50%       7,460,709 ns    3,438,000 ns    2.2x
 75%       5,985,666 ns    3,290,459 ns    1.8x
 90%       7,302,416 ns    3,047,667 ns    2.4x
 99%      23,559,000 ns    1,606,583 ns   14.7x
100%      67,323,750 ns    1,056,583 ns   63.7x
```

The reason is that the upward walk stops at the first 0. At 50% density the
expected run of 1s above a cell is about 1, so the "quadratic" rebuild does
roughly constant work per cell and the two are within a small factor. The
quadratic term only materialises when runs are long — and it arrives suddenly,
going from 2.4x at 90% density to 14.7x at 99% and 63.7x at 100%.

That is worth internalising as a general shape. An algorithm whose worst case
is triggered by a property of the *data* rather than by its size will look fine
on random tests and fail on the structured input someone actually has. Dense
matrices are not exotic here; they are precisely the inputs where the answer is
large and interesting.

## Where the time actually goes

Splitting the incremental version's runtime at 1000x1000:

```
density   height maintenance      histogram pass
  5%        998,596 ns (37.7%)    1,650,677 ns (62.3%)
 25%      1,870,298 ns (38.1%)    3,044,337 ns (61.9%)
 50%      3,296,261 ns (39.9%)    4,975,121 ns (60.1%)
 75%      1,842,523 ns (24.1%)    5,808,732 ns (75.9%)
 95%        745,740 ns (11.5%)    5,758,711 ns (88.5%)
```

The height maintenance is never dominant, but look at its absolute numbers:
998,596 ns at 5% density, rising to 3,296,261 ns at 50%, then falling to
745,740 ns at 95%. A single line of straight-line code, doing exactly `R x C`
operations regardless of density, varying by **4.4x**.

That is the ternary's branch. At 5% and 95% ones the outcome is nearly always
the same and the predictor is right; at 50% it is a coin flip. Rewriting it
branchlessly confirms the diagnosis:

```
height[c] = (height[c] + 1) * matrix[r][c]
```

```
density   branchy        branchless     ratio
  5%      3,294,959 ns   2,849,583 ns   0.86x
 25%      5,854,000 ns   4,366,958 ns   0.75x
 50%      8,974,875 ns   6,093,875 ns   0.68x
 75%      8,633,083 ns   7,238,209 ns   0.84x
 95%      7,617,667 ns   6,855,875 ns   0.90x
```

Faster at every density, and most so at 50% where the branch is least
predictable — exactly the signature a misprediction cost should have. It is a
genuine improvement and a small one, and worth knowing mostly because it
explains an otherwise baffling density curve.

## The stack is not the best tool here either

There is a second O(R x C) method that never builds a stack. Alongside
`height`, carry two more arrays across rows:

```
left[c]   leftmost column the rectangle of height height[c] can reach
right[c]  one past the rightmost column it can reach
```

Both are maintained in one pass each per row:

```
scanning left to right:   if matrix[r][c] == 1: left[c] = max(left[c], boundary)
                          else:                 left[c] = 0; boundary = c + 1
scanning right to left:   if matrix[r][c] == 1: right[c] = min(right[c], boundary)
                          else:                 right[c] = C; boundary = c
area[c] = (right[c] - left[c]) * height[c]
```

The `max` and `min` are what make it work: as a column's run of 1s grows taller,
the horizontal span it can occupy can only narrow, so carrying the previous
row's bound and tightening it is exactly right. When a 0 appears the column
resets and the bounds are released.

This is not merely the stack version with the container removed. The stack
recomputes both boundaries from scratch for every row; this carries them
forward, which is a genuinely different use of the row-to-row structure.

Measured at 1000x1000, best of eleven runs, with each density measured in both
orders to rule out ordering effects:

```
density   stack          DP             DP / stack
 10%      3,795,625 ns   2,820,500 ns     0.74
 20%      5,101,000 ns   4,462,042 ns     0.87
 30%      6,530,500 ns   6,073,000 ns     0.93
 40%      7,975,042 ns   7,970,333 ns     1.00
 50%      9,029,542 ns   9,385,875 ns     1.04
 60%      8,869,916 ns   8,110,292 ns     0.91
 70%      8,552,875 ns   6,164,917 ns     0.72
 80%      8,357,000 ns   4,558,709 ns     0.55
 90%      8,267,083 ns   2,996,292 ns     0.36
 95%      7,318,458 ns   2,212,542 ns     0.30
 99%      4,834,292 ns   1,627,250 ns     0.34
```

The stack's entire advantage is a 4% edge in a band around 50% density. Outside
that band the DP wins, and at high density it wins by more than 3x. Both methods
peak at 50% for the same reason the height line does — that is where every
branch in both algorithms is maximally unpredictable — but the DP recovers much
faster as the density rises, because its three passes are flat loops while the
stack's inner `while` stays data-dependent.

Python agrees, less dramatically: at 300x300 the DP takes 12.8ms against the
stack's 14.5ms at 50% density, and 12.6ms against 16.0ms at 95%.

So this is the second subtopic in a row where the stack is educational rather
than optimal. In Trapping Rainwater it lost to two pointers by 6.8x. Here it
loses to a DP nearly everywhere. The one place it was supreme was the previous
subtopic, Largest Rectangle in a Histogram, where no alternative formulation
exists — and note that this problem's DP works *only* because there are rows to
carry information between. Given a single histogram, there is nothing to carry
and the stack is unbeatable again.

## The one bug that matters

Forgetting the reset — writing `if (matrix[r][c]) height[c]++;` and omitting the
`else height[c] = 0` — is wrong on **46.00%** of random matrices. The smallest
counterexample is 2x2:

```
0 1
1 0     ->  gives 2, correct 1
```

Without the reset, column 1 counts its 1 from row 2 and column 2 counts its 1
from row 1, and the second row's histogram reads `1 1` — describing a 1x2
rectangle of 1s that does not exist. The heights stop meaning "consecutive 1s
ending at this row" and start meaning "1s seen so far", which is not a histogram
of anything.

## Complexity, and what the limits allow

The reduction costs one histogram pass per row, so O(R x C) overall with O(C)
extra space. At the stated limit of 200x200 that is 363,708 ns for the stack and
346,375 ns for the DP at 50% density — both far inside any time limit, which is
worth knowing before optimising. The brute-force alternative, enumerating all
O(R^2 C^2) submatrices with 2D prefix sums to test each in O(1), takes
333,618,417 ns on the same input: a factor of **1,019**, and it grows.

<!-- @intuition -->
Fix a bottom row and every rectangle ending there is a rectangle inside one histogram — the previous subtopic, run once per row. What is worth measuring is everything around that reduction: the height array should be carried forward rather than rebuilt (63.7x on dense input, but only 2x on random input, which is why the naive version survives testing), and the stack that motivated the whole topic is beaten here by a stackless DP that carries its boundaries across rows.

<!-- @approach -->
### Brute force — every submatrix, tested with 2D prefix sums

<!-- @idea -->
Enumerate every choice of top row, bottom row, left column and right column. A 2D prefix-sum table makes the "is this submatrix all ones?" test O(1): the rectangle is full exactly when its sum equals its area. Correct by construction and the reference the other three were verified against.

<!-- @steps -->
```
1. Build a 2D prefix-sum table p where p[i][j] is the sum of the top-left i x j block.
2. For every (top, bottom, left, right), compute area and the inclusion-exclusion sum.
3. If the sum equals the area, every cell is a 1, so the rectangle is valid.
4. Keep the largest valid area.
```

<!-- @complexity -->
- time: O(R^2 * C^2) — four nested loops, O(1) per candidate thanks to the prefix sums
- space: O(R * C) for the prefix table
- note: Measured 153x slower than the row-histogram method at 30x30, 460x at 100x100 and 1,019x at 200x200 (333,618,417ns against 327,416ns), with the gap widening as the square of the size. Used as the reference for 4,000 randomised cross-checks on matrices up to 7x7 at densities of 20, 50, 80 and 95 percent — 0 mismatches against all three linear methods, and 0 mismatches against a separate 3,000-matrix Python check.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

int maximalRectangle(const vector<vector<int>>& m) {
    int R = m.size();
    if (R == 0) return 0;
    int C = m[0].size();

    vector<vector<int>> p(R + 1, vector<int>(C + 1, 0));
    for (int i = 0; i < R; i++)
        for (int j = 0; j < C; j++)
            p[i+1][j+1] = m[i][j] + p[i][j+1] + p[i+1][j] - p[i][j];

    int best = 0;
    for (int t = 0; t < R; t++)
      for (int b = t; b < R; b++)
        for (int l = 0; l < C; l++)
          for (int r = l; r < C; r++) {
              int area = (b - t + 1) * (r - l + 1);
              if (area <= best) continue;                  // prune
              int sum = p[b+1][r+1] - p[t][r+1] - p[b+1][l] + p[t][l];
              if (sum == area) best = area;
          }
    return best;
}
```

<!-- @annotations -->
- 13: The +1 offset on every index is what removes the boundary special cases; p is (R+1) x (C+1) so that p[0][*] and p[*][0] are legitimately zero rather than out of range.
- 21: The prune is not cosmetic — without it this is measurably slower, since most candidates are smaller than the best already found and the prefix lookup can be skipped entirely.
- 22: Inclusion-exclusion: add the big block, subtract the two overhanging strips, add back the corner that was subtracted twice.
- 23: sum == area is the all-ones test. It works only because the entries are exactly 0 and 1; with arbitrary values this comparison means nothing.

<!-- @code java -->
```java
static int maximalRectangle(int[][] m) {
    int R = m.length;
    if (R == 0) return 0;
    int C = m[0].length;

    int[][] p = new int[R + 1][C + 1];
    for (int i = 0; i < R; i++)
        for (int j = 0; j < C; j++)
            p[i+1][j+1] = m[i][j] + p[i][j+1] + p[i+1][j] - p[i][j];

    int best = 0;
    for (int t = 0; t < R; t++)
      for (int b = t; b < R; b++)
        for (int l = 0; l < C; l++)
          for (int r = l; r < C; r++) {
              int area = (b - t + 1) * (r - l + 1);
              if (area <= best) continue;
              int sum = p[b+1][r+1] - p[t][r+1] - p[b+1][l] + p[t][l];
              if (sum == area) best = area;
          }
    return best;
}
```

<!-- @annotations -->
- 6: new int[R+1][C+1] zero-fills, which the prefix construction relies on for its first row and column — an explicitly uninitialised array would need those filled by hand.
- 16: Four nested loops over a 200x200 matrix is 200^4 / 4 candidates in the worst case; the O(1) test per candidate does not rescue that, which is the point of including this approach at all.
- 3: The empty check must come before m[0].length, or a zero-row matrix throws ArrayIndexOutOfBoundsException.

<!-- @code python -->
```python
def maximal_rectangle(m: list[list[int]]) -> int:
    R = len(m)
    if R == 0:
        return 0
    C = len(m[0])

    p = [[0] * (C + 1) for _ in range(R + 1)]
    for i in range(R):
        for j in range(C):
            p[i+1][j+1] = m[i][j] + p[i][j+1] + p[i+1][j] - p[i][j]

    best = 0
    for t in range(R):
        for b in range(t, R):
            for l in range(C):
                for r in range(l, C):
                    area = (b - t + 1) * (r - l + 1)
                    if area <= best:
                        continue
                    if p[b+1][r+1] - p[t][r+1] - p[b+1][l] + p[t][l] == area:
                        best = area
    return best
```

<!-- @annotations -->
- 7: [[0] * (C+1) for _ in range(R+1)] and not [[0] * (C+1)] * (R+1) — the second form aliases one row R+1 times and every write appears in every row.
- 17: This is the cross-checking reference only. At 200x200 the C++ version already takes a third of a second and Python would take hours.
- 12: best is used inside the prune on line 18, so the loops are not independent and this cannot be trivially parallelised without losing the pruning.

<!-- @approach -->
### Row histograms with the heights rebuilt each row

<!-- @idea -->
Fix each row as the bottom edge. For every cell in that row, walk upward counting consecutive 1s to get the histogram height, then run the histogram solution. Correct and direct, and its cost depends on the data in a way that hides on random tests.

<!-- @steps -->
```
1. For each row r:
2.   For each column c, walk upward from r while cells are 1, counting -> height[c].
3.   Run the largest-rectangle-in-a-histogram routine on height.
4.   Keep the maximum across all rows.
```

<!-- @complexity -->
- time: O(R^2 * C) worst case, but only when runs of 1s are long — the upward walk stops at the first 0
- space: O(C) for the height array plus the histogram stack
- note: The measurement that matters is how *late* the worst case arrives. At 600x600 this is 1.5x to 2.4x the incremental version across densities from 25% to 90%, then 14.7x at 99% and 63.7x on an all-ones matrix. An algorithm whose worst case is triggered by a property of the data rather than its size passes random tests and fails on real input.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

int largestRectangleArea(const vector<int>& h);   // the previous subtopic

int maximalRectangle(const vector<vector<int>>& m) {
    int R = m.size();
    if (R == 0) return 0;
    int C = m[0].size();

    int best = 0;
    vector<int> height(C);
    for (int r = 0; r < R; r++) {
        for (int c = 0; c < C; c++) {
            int k = 0;
            for (int i = r; i >= 0 && m[i][c] == 1; i--) k++;   // walks up, stops at a 0
            height[c] = k;
        }
        best = max(best, largestRectangleArea(height));
    }
    return best;
}
```

<!-- @annotations -->
- 17: The `i >= 0 && m[i][c] == 1` short-circuit is exactly what makes this fast on random data and catastrophic on dense data — at 50% ones the loop runs about twice, at 100% ones it runs r times. It also indexes m[i][c] with c fixed, striding down a column of a row-major matrix, which is a cache-hostile access pattern on top of the extra work and invisible in the complexity.
- 20: The histogram routine is unchanged from the previous subtopic — this approach and the next differ only in how height is produced, which is what makes the comparison clean.

<!-- @code java -->
```java
static int maximalRectangle(int[][] m) {
    int R = m.length;
    if (R == 0) return 0;
    int C = m[0].length;

    int best = 0;
    int[] height = new int[C];
    for (int r = 0; r < R; r++) {
        for (int c = 0; c < C; c++) {
            int k = 0;
            for (int i = r; i >= 0 && m[i][c] == 1; i--) k++;
            height[c] = k;
        }
        best = Math.max(best, largestRectangleArea(height));
    }
    return best;
}
```

<!-- @annotations -->
- 11: Java's int[][] is an array of row references, so m[i][c] with i varying dereferences a different object each step — the column stride is even worse here than in C++, where the rows of a vector<vector<int>> are at least each contiguous.
- 7: height is allocated once outside the row loop and overwritten each row, which is correct here because every entry is unconditionally assigned on line 12.
- 14: Reusing largestRectangleArea unchanged is the whole point of the reduction; if it needed modification, the reduction would not be a reduction.

<!-- @code python -->
```python
def maximal_rectangle(m: list[list[int]]) -> int:
    R = len(m)
    if R == 0:
        return 0
    C = len(m[0])

    best = 0
    height = [0] * C
    for r in range(R):
        for c in range(C):
            k = 0
            i = r
            while i >= 0 and m[i][c] == 1:
                k += 1
                i -= 1
            height[c] = k
        best = max(best, largest_rectangle_area(height))
    return best
```

<!-- @annotations -->
- 13: The while loop is written out rather than using a generator, because the early stop is the whole behaviour being illustrated and a comprehension would obscure it. Note also that m[i][c] is two index operations per step against a list of lists, so the constant here is far worse than the C++ version's already-poor cache behaviour.
- 17: Identical call to the histogram routine as the incremental version below — only the height computation differs.

<!-- @approach -->
### Row histograms with the heights carried forward

<!-- @idea -->
The height array for row `r` is one line away from the array for row `r-1`: add one where the cell is a 1, reset to zero where it is a 0. No walking, no column striding, O(1) per cell. This is the canonical solution to the problem.

<!-- @steps -->
```
1. height starts as all zeros.
2. For each row r: for each column c, height[c] = m[r][c] ? height[c] + 1 : 0.
3. Run the histogram routine on height and keep the maximum.
4. The reset on a 0 is essential; omitting it is wrong on 46% of matrices.
```

<!-- @complexity -->
- time: O(R * C) — each cell touched once for the height and once by the amortised histogram pass
- space: O(C) for the height array and the stack
- note: 363,708ns at the stated 200x200 limit and 3,438,000ns at 600x600 with 50% ones, against the rebuild's 7,460,709ns there and 67,323,750ns on an all-ones matrix. The runtime splits roughly 40/60 between height maintenance and the histogram pass at moderate density, shifting to 11.5/88.5 at 95% ones. The height line alone varies 4.4x with density despite doing a fixed R x C operations, which is the ternary's branch; a branchless `(height[c] + 1) * m[r][c]` is 0.68x at 50% density and faster at every density measured.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

int largestRectangleArea(const vector<int>& h);   // the previous subtopic

int maximalRectangle(const vector<vector<int>>& m) {
    int R = m.size();
    if (R == 0) return 0;
    int C = m[0].size();

    int best = 0;
    vector<int> height(C, 0);
    for (int r = 0; r < R; r++) {
        for (int c = 0; c < C; c++)
            height[c] = m[r][c] ? height[c] + 1 : 0;     // the reset is the whole line
        best = max(best, largestRectangleArea(height));
    }
    return best;
}
```

<!-- @annotations -->
- 16: The `: 0` is the entire difference between a histogram and a running tally. Writing `if (m[r][c]) height[c]++;` and stopping there is wrong on 46.00% of random matrices, with [[0,1],[1,0]] as the smallest counterexample.
- 13: height is initialised to zeros once and carried across every row — that carrying is what turns an O(R) per-cell rebuild into O(1).
- 15: A row-major sweep with a stride of one, unlike the rebuild's column walk. The access pattern improves at the same time as the operation count, which is why the measured gap exceeds what the complexity alone predicts at high density.
- 17: The histogram routine runs once per row on an array of length C, so the total is R amortised O(C) passes — the reduction adds no asymptotic cost of its own.

<!-- @code java -->
```java
static int maximalRectangle(int[][] m) {
    int R = m.length;
    if (R == 0) return 0;
    int C = m[0].length;

    int best = 0;
    int[] height = new int[C];
    for (int r = 0; r < R; r++) {
        int[] row = m[r];                                // hoist the row reference
        for (int c = 0; c < C; c++)
            height[c] = row[c] != 0 ? height[c] + 1 : 0;
        best = Math.max(best, largestRectangleArea(height));
    }
    return best;
}
```

<!-- @annotations -->
- 9: Hoisting m[r] out of the inner loop removes one array dereference per cell; the JIT often does this anyway, but it costs nothing to write and makes the row-major access explicit.
- 11: row[c] != 0 rather than row[c] == 1, so the code is also correct if the caller passes a matrix using any non-zero value for "filled".
- 7: new int[C] zero-fills, which is exactly the required starting state — no explicit initialisation loop is needed.

<!-- @code python -->
```python
def maximal_rectangle(m: list[list[int]]) -> int:
    R = len(m)
    if R == 0:
        return 0
    C = len(m[0])

    best = 0
    height = [0] * C
    for row in m:
        for c in range(C):
            height[c] = height[c] + 1 if row[c] else 0
        area = largest_rectangle_area(height)
        if area > best:
            best = area
    return best
```

<!-- @annotations -->
- 9: Iterating `for row in m` rather than by index avoids a list index per row and reads closer to the reduction's statement: each row is a bottom edge.
- 11: The conditional expression must have the `else 0` branch; a bare `if row[c]: height[c] += 1` is the 46% bug in Python form.
- 13: Comparing and assigning rather than calling max() saves a function call per row, which is measurable in CPython over hundreds of rows.

<!-- @approach -->
### Left/right/height DP — no stack, and faster nearly everywhere

<!-- @idea -->
Carry three arrays across rows instead of one. Alongside `height`, maintain `left[c]` and `right[c]`, the horizontal span the column's current run of 1s can occupy. As a run grows taller its span can only narrow, so each row tightens the previous bounds with a `max` and a `min` — and a 0 releases them. The area at each column is then a direct multiplication with no boundary search at all.

<!-- @steps -->
```
1. height[c] = m[r][c] ? height[c] + 1 : 0, as before.
2. Left to right with a boundary marker: if the cell is 1, left[c] = max(left[c], boundary);
   otherwise left[c] = 0 and boundary = c + 1.
3. Right to left: if the cell is 1, right[c] = min(right[c], boundary);
   otherwise right[c] = C and boundary = c.
4. Answer is the maximum of (right[c] - left[c]) * height[c].
```

<!-- @complexity -->
- time: O(R * C) — three flat passes per row, no data-dependent inner loop
- space: O(C) for the three arrays
- note: Beats the monotonic stack at every measured density except a band around 40-50%, where the stack wins by 4%. At 1000x1000: 0.74x at 10% ones, 1.04x at 50%, 0.55x at 80%, and 0.30x at 95%. Python agrees at 300x300 — 12.8ms against 14.5ms at 50% density and 12.6ms against 16.0ms at 95%. The advantage is that its three passes are flat loops while the stack's inner while remains data-dependent, which matters most where the histogram is tall and nearly flat.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

int maximalRectangle(const vector<vector<int>>& m) {
    int R = m.size();
    if (R == 0) return 0;
    int C = m[0].size();

    vector<int> height(C, 0), left(C, 0), right(C, C);
    int best = 0;

    for (int r = 0; r < R; r++) {
        for (int c = 0; c < C; c++)
            height[c] = m[r][c] ? height[c] + 1 : 0;

        int boundary = 0;
        for (int c = 0; c < C; c++) {
            if (m[r][c]) left[c] = max(left[c], boundary);
            else { left[c] = 0; boundary = c + 1; }
        }

        boundary = C;
        for (int c = C - 1; c >= 0; c--) {
            if (m[r][c]) right[c] = min(right[c], boundary);
            else { right[c] = C; boundary = c; }
        }

        for (int c = 0; c < C; c++)
            best = max(best, (right[c] - left[c]) * height[c]);
    }
    return best;
}
```

<!-- @annotations -->
- 10: right is initialised to C, not to C-1, because it is an exclusive bound — the width is right[c] - left[c] with no -1 correction, unlike the histogram version's boundaries.
- 19: max, not assignment. The span of a growing run can only narrow, so the previous row's bound is a valid constraint that this row tightens; overwriting it would forget that the run is taller than one row.
- 20: The reset on a 0 releases both the bound and the boundary marker. Without it the next run in this column inherits limits from a run that has already ended.
- 25: min here mirrors the max on line 19, and right[c] = C on the reset mirrors left[c] = 0 — the two passes are exact reflections and it is worth writing them that way so a bug in one is visible against the other.
- 30: No search, no stack, no boundary lookup: three flat passes and a multiply. That is why this beats the monotonic stack at every density except a narrow band near 50%.

<!-- @code java -->
```java
import java.util.Arrays;

static int maximalRectangle(int[][] m) {
    int R = m.length;
    if (R == 0) return 0;
    int C = m[0].length;

    int[] height = new int[C], left = new int[C], right = new int[C];
    Arrays.fill(right, C);
    int best = 0;

    for (int r = 0; r < R; r++) {
        int[] row = m[r];
        for (int c = 0; c < C; c++)
            height[c] = row[c] != 0 ? height[c] + 1 : 0;

        int boundary = 0;
        for (int c = 0; c < C; c++) {
            if (row[c] != 0) left[c] = Math.max(left[c], boundary);
            else { left[c] = 0; boundary = c + 1; }
        }

        boundary = C;
        for (int c = C - 1; c >= 0; c--) {
            if (row[c] != 0) right[c] = Math.min(right[c], boundary);
            else { right[c] = C; boundary = c; }
        }

        for (int c = 0; c < C; c++)
            best = Math.max(best, (right[c] - left[c]) * height[c]);
    }
    return best;
}
```

<!-- @annotations -->
- 9: Arrays.fill(right, C) is required because new int[C] zero-fills, and a right bound of 0 would make every width negative on the first row.
- 13: The same row hoist as the previous approach, and here it saves three dereferences per cell rather than one since all three passes read the same row.
- 30: Four passes over C per row in total, all flat. The operation count is higher than the stack version's but every loop is predictable, which is the trade that wins at high density.

<!-- @code python -->
```python
def maximal_rectangle(m: list[list[int]]) -> int:
    R = len(m)
    if R == 0:
        return 0
    C = len(m[0])

    height = [0] * C
    left = [0] * C
    right = [C] * C
    best = 0

    for row in m:
        for c in range(C):
            height[c] = height[c] + 1 if row[c] else 0

        boundary = 0
        for c in range(C):
            if row[c]:
                if boundary > left[c]:
                    left[c] = boundary
            else:
                left[c] = 0
                boundary = c + 1

        boundary = C
        for c in range(C - 1, -1, -1):
            if row[c]:
                if boundary < right[c]:
                    right[c] = boundary
            else:
                right[c] = C
                boundary = c

        for c in range(C):
            area = (right[c] - left[c]) * height[c]
            if area > best:
                best = area
    return best
```

<!-- @annotations -->
- 9: [C] * C, not [0] * C. An exclusive right bound of 0 on the first row gives a negative width for every column.
- 19: Written as an explicit comparison rather than max(), because in CPython a function call per cell over R x C cells is a measurable cost and this loop runs three times per row.
- 26: range(C - 1, -1, -1) with a stop of -1, or column 0 never gets its right bound tightened.
- 38: Measured 12.8ms at 300x300 with 50% ones against the stack version's 14.5ms, and 12.6ms against 16.0ms at 95% — the same ordering as C++, with a smaller margin.

<!-- @example -->

<!-- @input -->
```
1 0 1 0 0
1 0 1 1 1
1 1 1 1 1
1 0 0 1 0
```

<!-- @output -->
```
6
```

<!-- @why -->
The canonical case, and it shows the reduction working: the answer's bottom edge is row 3, and it is found by running the histogram routine on that row's heights. Notice that the best row is not the last one — row 4 has the tallest single column at height 4 — so every row genuinely has to be tried.

<!-- @walkthrough -->
- Row 1 heights [1,0,1,0,0]; the best rectangle inside that histogram has area 1.
- Row 2 heights [2,0,2,1,1]; best 3, from the three columns of height at least 1 spanning columns 3 to 5.
- Row 3 heights [3,1,3,2,2]; best 6, from columns 3 to 5 at height 2 — the 2x3 block in rows 2 and 3.
- Row 4 heights [4,0,0,3,0]; best 4, from the single column of height 4.
- The running maximum is 1, 3, 6, 6 — so the answer is fixed at row 3 and the tallest column in row 4 never beats it.
- Height alone decides nothing here, exactly as in the histogram subtopic: the winning shape is short and wide.

<!-- @example -->

<!-- @input -->
```
0 1
1 0
```

<!-- @output -->
```
1   (omitting the height reset gives 2)
```

<!-- @why -->
The smallest matrix that catches the one bug worth guarding against, found by exhaustive enumeration over every binary matrix up to 3x3. Writing `if (m[r][c]) height[c]++;` without the `else height[c] = 0` is wrong on **46.00%** of random matrices — the heights stop meaning "consecutive 1s ending at this row" and start meaning "1s seen anywhere above", which describes rectangles that do not exist.

<!-- @walkthrough -->
- Row 1 is `0 1`. Correct heights are [0,1]; without the reset they are also [0,1], since nothing needs resetting yet.
- Row 2 is `1 0`. Correct heights are [1,0] — column 1 starts a new run and column 2's run ended.
- Without the reset, column 2 keeps its 1 from row 1 and column 1 adds its own, giving [1,1].
- The histogram [1,1] reports a 1x2 rectangle of area 2. No such rectangle exists: the two 1s are on different rows.
- The correct answer is 1, because no two 1s in this matrix are adjacent.
- The failure needs only a 0 below a 1 with another 1 beside it, which is why it fires on nearly half of random matrices rather than in some corner.

<!-- @example -->

<!-- @input -->
```
a 600x600 matrix, varying the fraction of 1s
```

<!-- @output -->
```
rebuild is 1.5x-2.4x the incremental version up to 90% ones, then 14.7x at 99% and 63.7x at 100%
```

<!-- @why -->
The measurement that decides between the two ways of producing the height array, and the reason the slow one survives testing. Rebuilding walks upward until it meets a 0, so on random data it stops almost immediately and the O(R) per cell never materialises. The quadratic cost is latent, triggered by a property of the data rather than its size, and it arrives abruptly.

<!-- @walkthrough -->
- At 25% ones the expected run of 1s above a cell is well under 1, so the upward walk terminates at once: 3,546,834ns against 2,420,792ns, a ratio of 1.5.
- At 50% and 75% the ratio is 2.2x and 1.8x — noticeable, easily dismissed as a constant factor.
- At 90% it is still only 2.4x, which is the dangerous part: even a fairly dense test does not expose it.
- At 99% the walk finally runs long: 23,559,000ns against 1,606,583ns, a ratio of 14.7.
- On an all-ones matrix every walk runs the full height: 67,323,750ns against 1,056,583ns, a ratio of 63.7.
- Note the incremental version gets *faster* as density rises (3.4ms to 1.1ms), because tall uniform histograms cause fewer stack operations — the two curves move in opposite directions, which is what turns a 2x gap into a 64x gap.

<!-- @example -->

<!-- @input -->
```
a 1000x1000 matrix, comparing the monotonic stack against the left/right DP
```

<!-- @output -->
```
the DP wins at every density except a band near 50%, where the stack wins by 4%
```

<!-- @why -->
The result that decides which solution to actually write, and it goes against the topic. The stack is why this problem is filed under Stacks, but a stackless DP that carries its boundaries across rows is faster nearly everywhere — 0.74x at 10% ones and 0.30x at 95%. Measured best of eleven with each density run in both orders to rule out ordering effects.

<!-- @walkthrough -->
- At 10% ones the histograms are short and full of zeros, so the stack pops constantly: 3,795,625ns against the DP's 2,820,500ns, a ratio of 0.74.
- The gap narrows as density rises, reaching 0.93 at 30% and 1.00 at 40%.
- The stack's only win is the band from about 40% to 55%, peaking at 1.04 — a 4% edge.
- Past that the DP pulls away steadily: 0.72 at 70%, 0.55 at 80%, 0.36 at 90% and 0.30 at 95%.
- Both methods are slowest at 50% density, because that is where every branch in both algorithms is maximally unpredictable; the DP recovers faster because its three passes are flat loops while the stack's inner while stays data-dependent.
- Python shows the same ordering with a smaller margin: at 300x300, 12.8ms against 14.5ms at 50% ones and 12.6ms against 16.0ms at 95%.

<!-- @visualization stack -->

<!-- @description -->
Open with the reduction itself, because everything follows from it. Draw the 4x5 matrix, then sweep a highlighted band down it one row at a time. As the band lands on each row, grow a histogram beneath the matrix whose bars are the counts of consecutive 1s reaching up from that row — with each bar visibly rooted in the matrix cells it counts, so the correspondence is unmistakable. Run the previous subtopic's histogram animation in miniature on each row's bars and print that row's best beside it: 1, 3, 6, 4. Hold on row 3 and shade the winning 2x3 block back into the matrix in green. Caption: "every rectangle has some bottom row, so trying each row covers all of them". Then the height-maintenance panel, split in two. On the left, the rebuild: for one cell, animate an arrow walking upward and stopping at the first 0, with a step counter. On the right, the incremental update: the same cell's value arrives in one operation from the row above, with the `: 0` reset flashing red whenever the cell is a 0. Beneath them, a ratio chart across densities — 1.5x, 2.2x, 1.8x, 2.4x, 14.7x, 63.7x — drawn so the last two bars break out of the frame, captioned "the quadratic term is latent: triggered by the data, not its size". Then the bug panel: the 2x2 matrix [[0,1],[1,0]] with the reset omitted, showing the second row's heights read as `1 1` and a ghost rectangle of area 2 drawn across two cells that are visibly not both filled, with a red 46.00% beside it. Then the DP reveal: run the stack lane and the DP lane side by side on the same row. The stack lane pushes and pops indices with a visible variable-length inner loop; the DP lane shows three flat left-to-right and right-to-left sweeps tightening `left` and `right` with max and min, and crucially draws the arrays *persisting* into the next row rather than being rebuilt. Close with the density curve as a line chart of DP/stack ratio against density — 0.74, 0.87, 0.93, 1.00, 1.04, 0.91, 0.72, 0.55, 0.36, 0.30, 0.34 — with a horizontal line at 1.0 and the narrow region above it shaded and labelled "the stack's entire advantage: 4%, near 50% density", and both curves' peaks at 50% annotated "maximum branch unpredictability for both".

<!-- @sampleInput -->
```json
{"problem":{"input":[[1,0,1,0,0],[1,0,1,1,1],[1,1,1,1,1],[1,0,0,1,0]],"answer":6,"statement":"largest rectangle of 1s in a binary matrix","winningBlock":"rows 2-3, columns 3-5, a 2x3 block"},"reduction":{"claim":"fix a bottom row and every rectangle ending there is a rectangle inside one histogram","heightDefinition":"height[c] = number of consecutive 1s ending at row r in column c","whyComplete":"every rectangle has some bottom row, so running the histogram solution once per row covers all candidates","perRow":[{"row":1,"cells":[1,0,1,0,0],"heights":[1,0,1,0,0],"best":1},{"row":2,"cells":[1,0,1,1,1],"heights":[2,0,2,1,1],"best":3},{"row":3,"cells":[1,1,1,1,1],"heights":[3,1,3,2,2],"best":6},{"row":4,"cells":[1,0,0,1,0],"heights":[4,0,0,3,0],"best":4}],"note":"the best row is not the last one — row 4 has the tallest single column at height 4 and still loses"},"heightMaintenance":{"rebuild":{"rule":"walk upward from row r counting 1s until a 0 stops you","complexity":"O(R) per cell worst case","whyItHides":"the walk stops at the first 0, so on random data it terminates almost immediately"},"incremental":{"rule":"height[c] = m[r][c] ? height[c] + 1 : 0","complexity":"O(1) per cell"},"measured600x600":[{"density":25,"rebuildNs":3546834,"incrementalNs":2420792,"ratio":1.5},{"density":50,"rebuildNs":7460709,"incrementalNs":3438000,"ratio":2.2},{"density":75,"rebuildNs":5985666,"incrementalNs":3290459,"ratio":1.8},{"density":90,"rebuildNs":7302416,"incrementalNs":3047667,"ratio":2.4},{"density":99,"rebuildNs":23559000,"incrementalNs":1606583,"ratio":14.7},{"density":100,"rebuildNs":67323750,"incrementalNs":1056583,"ratio":63.7}],"lesson":"an algorithm whose worst case is triggered by a property of the data rather than its size passes random tests and fails on structured input"},"costSplit1000x1000":[{"density":5,"heightNs":998596,"heightPct":37.7,"stackNs":1650677,"stackPct":62.3},{"density":25,"heightNs":1870298,"heightPct":38.1,"stackNs":3044337,"stackPct":61.9},{"density":50,"heightNs":3296261,"heightPct":39.9,"stackNs":4975121,"stackPct":60.1},{"density":75,"heightNs":1842523,"heightPct":24.1,"stackNs":5808732,"stackPct":75.9},{"density":95,"heightNs":745740,"heightPct":11.5,"stackNs":5758711,"stackPct":88.5}],"branchCost":{"observation":"the height line does a fixed R x C operations yet varies 4.4x with density, peaking at 50% — the signature of a mispredicted branch","branchlessForm":"height[c] = (height[c] + 1) * m[r][c]","measured1000x1000":[{"density":5,"branchyNs":3294959,"branchlessNs":2849583,"ratio":0.86},{"density":25,"branchyNs":5854000,"branchlessNs":4366958,"ratio":0.75},{"density":50,"branchyNs":8974875,"branchlessNs":6093875,"ratio":0.68},{"density":75,"branchyNs":8633083,"branchlessNs":7238209,"ratio":0.84},{"density":95,"branchyNs":7617667,"branchlessNs":6855875,"ratio":0.9}]},"leftRightDP":{"idea":"carry left[c] and right[c] across rows alongside height[c]; as a run of 1s grows taller its horizontal span can only narrow, so each row tightens the previous bounds with a max and a min","leftRule":"if the cell is 1, left[c] = max(left[c], boundary); else left[c] = 0 and boundary = c + 1","rightRule":"if the cell is 1, right[c] = min(right[c], boundary); else right[c] = C and boundary = c","area":"(right[c] - left[c]) * height[c], with right exclusive so there is no -1 correction","notJustTheStackWithoutAContainer":"the stack recomputes both boundaries from scratch every row; this carries them forward, which is a different use of the row-to-row structure"},"stackVsDP":{"note":"1000x1000, best of 11, each density measured in both orders","rows":[{"density":10,"stackNs":3795625,"dpNs":2820500,"ratio":0.74},{"density":20,"stackNs":5101000,"dpNs":4462042,"ratio":0.87},{"density":30,"stackNs":6530500,"dpNs":6073000,"ratio":0.93},{"density":40,"stackNs":7975042,"dpNs":7970333,"ratio":1.0},{"density":50,"stackNs":9029542,"dpNs":9385875,"ratio":1.04},{"density":60,"stackNs":8869916,"dpNs":8110292,"ratio":0.91},{"density":70,"stackNs":8552875,"dpNs":6164917,"ratio":0.72},{"density":80,"stackNs":8357000,"dpNs":4558709,"ratio":0.55},{"density":90,"stackNs":8267083,"dpNs":2996292,"ratio":0.36},{"density":95,"stackNs":7318458,"dpNs":2212542,"ratio":0.3},{"density":99,"stackNs":4834292,"dpNs":1627250,"ratio":0.34}],"verdict":"the stack's entire advantage is a 4% edge in a band around 50% density","whyBothPeakAt50":"that is where every branch in both algorithms is maximally unpredictable; the DP recovers faster because its three passes are flat loops while the stack's inner while stays data-dependent","python300x300":[{"density":50,"stackMs":14.5,"dpMs":12.8},{"density":95,"stackMs":16.0,"dpMs":12.6}]},"missingResetBug":{"wrongCode":"if (m[r][c]) height[c]++;  with no else","wrongPct":46.0,"smallestCounterexample":{"matrix":[[0,1],[1,0]],"gives":2,"correct":1},"why":"the heights stop meaning consecutive 1s ending at this row and start meaning 1s seen anywhere above, which describes rectangles that do not exist"},"bruteForce":{"approach":"enumerate all O(R^2 C^2) submatrices, testing each in O(1) with 2D prefix sums","measured":[{"size":"30x30","bruteNs":457917,"stackNs":3000,"factor":153},{"size":"60x60","bruteNs":5132541,"stackNs":35417,"factor":145},{"size":"100x100","bruteNs":36455375,"stackNs":79208,"factor":460},{"size":"150x150","bruteNs":114318833,"stackNs":178208,"factor":641},{"size":"200x200","bruteNs":333618417,"stackNs":327416,"factor":1019}]},"atStatedLimits":{"size":"200x200","density50":{"stackNs":363708,"dpNs":346375,"rebuildNs":548000},"density95":{"stackNs":260084,"dpNs":83417,"rebuildNs":812125},"note":"all comfortably inside any time limit, which is worth knowing before optimising"},"topicArc":{"trappingRainwater":"the stack lost to two pointers by 6.8x","largestRectangleInAHistogram":"the stack was supreme — no alternative formulation exists","maximumRectangles":"the stack loses to a stackless DP nearly everywhere","why":"this problem's DP works only because there are rows to carry information between; given a single histogram there is nothing to carry and the stack is unbeatable again"},"verification":{"cpp":{"matrices":4000,"maxSize":"7x7","densities":[20,50,80,95],"reference":"O(R^2 C^2) brute force with 2D prefix sums","mismatches":0},"python":{"matrices":3000,"mismatches":0}}}
```

<!-- @highlights -->
- A highlighted band sweeps down the matrix one row at a time, growing a histogram beneath it.
- Each histogram bar is visibly rooted in the matrix cells it counts.
- The previous subtopic's histogram animation runs in miniature per row, printing 1, 3, 6, 4.
- The winning 2x3 block is shaded back into the matrix in green at row 3.
- A rebuild lane animates an arrow walking upward and stopping at the first 0, with a step counter.
- An incremental lane shows the same cell arriving in one operation, with the reset flashing red on a 0.
- A ratio chart across densities reads 1.5x, 2.2x, 1.8x, 2.4x, 14.7x, 63.7x.
- The last two bars break out of the frame, captioned "the quadratic term is latent".
- The bug panel shows [[0,1],[1,0]] with heights misread as 1 1 and a ghost rectangle of area 2.
- The two cells under that ghost rectangle are visibly not both filled, with 46.00% beside it.
- The stack lane and the DP lane run side by side on the same row.
- The stack lane shows a visibly variable-length inner loop of pushes and pops.
- The DP lane shows three flat sweeps tightening left and right with max and min.
- The DP's arrays are drawn persisting into the next row rather than being rebuilt.
- A line chart plots DP/stack against density: 0.74, 0.87, 0.93, 1.00, 1.04, 0.91, 0.72, 0.55, 0.36, 0.30, 0.34.
- The narrow region above the 1.0 line is shaded and labelled "the stack's entire advantage: 4%".

<!-- @edgeCases -->
- **Empty matrix** — zero rows must be checked before reading `m[0].size()`, which would otherwise be an out-of-range access rather than a clean 0.
- **A matrix of all zeros** — every height stays 0 and every histogram is empty, so the answer is 0 with no special handling.
- **A matrix of all ones** — the answer is `R x C`. This is also the rebuild approach's worst case at 63.7x, and simultaneously the incremental version's *best* case at 1,056,583ns for 600x600.
- **A single row** — the problem degenerates to the previous subtopic exactly, with heights equal to the row itself.
- **A single column** — the answer is the longest run of consecutive 1s; the histogram has one bar and the stack does one push and one pop per row.
- **`[[0,1],[1,0]]`** — the smallest matrix where omitting the height reset gives 2 instead of 1.
- **The best rectangle not touching the last row** — the worked example, where row 4 has the tallest single column and still loses to row 3's wide block. Any implementation that stops early or only checks the final row fails here.
- **Very sparse matrices** — heights are mostly 0, so the histogram stack pops on nearly every column. Measured 3,795,625ns at 10% ones, and the DP is 0.74x of it.
- **Very dense matrices** — heights are large and nearly uniform, which is where the DP's advantage peaks at 0.30x.
- **Non-square matrices** — the reduction is unaffected; it processes R histograms of length C. Transposing swaps which dimension pays for the stack passes but not the total work.
- **Input given as characters rather than integers** — the height line must compare against `'1'`, not `1`. A silent all-zeros answer is the usual symptom.

<!-- @pitfalls -->
- **Omitting the height reset on a 0 cell.** Wrong on 46.00% of random matrices, smallest counterexample `[[0,1],[1,0]]`. The heights stop describing consecutive runs and start describing totals.
- **Rebuilding the height array each row.** Looks like a 2x constant factor on random data at any density up to 90%, then costs 14.7x at 99% and 63.7x on all ones. The worst case is triggered by the data, not its size.
- **Concluding from a random-matrix benchmark that the rebuild is fine.** That is precisely the test the latent quadratic survives. Dense input is not exotic — it is where the answer is largest.
- **Reaching for the monotonic stack because the problem is filed under Stacks.** The left/right DP is faster at every density except a 40-55% band, and is 0.30x at 95% ones.
- **Initialising the DP's `right` array to zeros.** It is an exclusive bound and must start at `C`; zeros make every width negative on the first row.
- **Writing `left[c] = boundary` instead of `left[c] = max(left[c], boundary)`.** The carried bound is the whole point — overwriting it forgets that the current run is taller than one row.
- **Forgetting to release `left` and `right` when a cell is 0.** The next run in that column inherits the constraints of a run that has already ended.
- **Comparing against `1` when the input is a character matrix.** `'0'` and `'1'` are both truthy as characters in C++ and non-zero as ints, so the usual symptom is every height incrementing forever.
- **Striding down columns in the rebuild.** `m[i][c]` with `i` varying walks a row-major matrix against its layout, and in Java dereferences a different row object per step.
- **Assuming the answer's bottom edge is the last row.** In the worked example the tallest column is in row 4 and the answer comes from row 3.
- **Using an int for the area without checking.** Here it is safe — at 200x200 the maximum area is 40,000 — but the check is one multiplication and worth doing rather than assuming in either direction.
- **Allocating the height array inside the row loop.** It must persist across rows for the incremental update to mean anything; a fresh array each row silently turns the algorithm into "count the 1s in this row".

<!-- @doubt -->
Why is it enough to run the histogram solution once per row?

<!-- @answer -->
Because every rectangle has exactly one bottom row, and when you fix that row the rectangle is completely described by the histogram of upward runs from it. Concretely: a rectangle of 1s occupying rows `t..b` and columns `l..r` requires every column in `l..r` to have at least `b - t + 1` consecutive 1s ending at row `b`. That is exactly the statement "this rectangle fits inside the histogram for row `b`". So the histogram pass for row `b` considers it, and since `b` ranges over every row, every rectangle is considered by exactly one pass. Nothing is missed and nothing needs deduplicating, because the maximum is indifferent to seeing a candidate more than once anyway.

<!-- @doubt -->
Rebuilding the heights is O(R) per cell against O(1). Why is it only 2x slower in the measurements?

<!-- @answer -->
Because the upward walk stops at the first 0, and on random data it hits one almost immediately. At 50% density the expected run of 1s above a cell is about 1, so the "quadratic" version does roughly constant work per cell and the complexity difference never materialises. The gap stays between 1.5x and 2.4x from 25% density all the way to 90%. It arrives suddenly after that: 14.7x at 99% and 63.7x on an all-ones matrix, where every walk finally runs its full length. Part of the 63.7x is also that the incremental version gets *faster* on dense input — tall uniform histograms cause fewer stack operations — so the two curves move apart from both ends.

<!-- @doubt -->
If a random benchmark cannot distinguish them, how would I ever catch this in practice?

<!-- @answer -->
By benchmarking the shape of the input you actually have, not a uniformly random one. Binary matrices in real use are rarely 50% random noise — an occupancy grid, a rasterised region, a table of filled cells all have large contiguous blocks, which is exactly the structure that triggers the walk. The general habit worth taking from this: when an algorithm's complexity depends on a data property rather than the input size, add a test at the extreme of that property. Here that means one all-ones matrix, which takes one line and moves the measured gap from 2.4x to 63.7x. The same reasoning applies to the previous subtopic's sorted-input recursion depth and to quicksort's already-sorted input.

<!-- @doubt -->
Why does a single line doing exactly R x C operations vary by 4.4x with density?

<!-- @answer -->
Because it contains a branch, and its predictability depends on the density. `height[c] = m[r][c] ? height[c] + 1 : 0` measured 998,596ns at 5% ones, 3,296,261ns at 50%, and 745,740ns at 95% on a 1000x1000 matrix — the operation count is identical in all three. At the extremes the branch outcome is nearly always the same and the predictor is right; at 50% it is a coin flip and every misprediction costs a pipeline flush. Rewriting it as `(height[c] + 1) * m[r][c]` removes the branch entirely and is faster at every density measured, most at 50% where it is 0.68x. That is the signature you want before claiming a branch is at fault: the branchless form should win most where the branch is least predictable.

<!-- @doubt -->
The stack is the reason this problem is in the Stacks topic. Why does the file recommend the DP?

<!-- @answer -->
Because the measurements are clear and reproducible. At 1000x1000, best of eleven with each density run in both orders, the DP is 0.74x the stack at 10% ones, 0.55x at 80% and 0.30x at 95%. The stack's entire advantage is a 4% edge in a band from about 40% to 55% density. Python shows the same ordering. That is not close enough to justify choosing the stack for performance. Learn the stack version anyway — it is the reduction from the previous subtopic applied directly, and understanding that reduction is the actual content — but if you are writing this for real, write the DP.

<!-- @doubt -->
Is the left/right DP just the monotonic stack with the container removed?

<!-- @answer -->
No, and the difference is the reason it wins. The stack recomputes both boundaries from scratch for every row: it is handed a fresh histogram and finds each bar's previous-smaller and next-smaller from nothing. The DP carries `left` and `right` forward and *tightens* them. The insight is that as a column's run of 1s grows taller, the horizontal span that run can occupy can only shrink — so the previous row's bound is already a valid constraint and this row only narrows it with a `max` or a `min`. That is information the stack version throws away at every row boundary. Given a single histogram with no rows above it, there is nothing to carry and the DP has no such advantage, which is exactly why the stack is unbeatable in the previous subtopic and beaten here.

<!-- @doubt -->
Why do both methods peak at 50% density, and why does the DP recover faster?

<!-- @answer -->
Both peak there for the same reason the height line does: 50% is where every data-dependent branch in either algorithm is maximally unpredictable. The stack measured 9,029,542ns and the DP 9,385,875ns at that point, which is their closest match and the stack's only win. The difference is what happens as density rises. The DP's remaining work is three flat passes whose branches become predictable as 0s become rare, so it falls to 2,212,542ns at 95%. The stack's inner `while` is not just a branch but a variable-length loop — at high density the histogram is tall, so each pop cascade is long, and the work itself grows even as the branches become more predictable. Predictable branches help both; only the DP also stops doing extra work.

<!-- @doubt -->
Does this need a 64-bit accumulator like Trapping Rainwater did?

<!-- @answer -->
No, and it is worth computing rather than assuming. At the stated limit of 200x200 the largest possible area is 40,000, which is four orders of magnitude inside `INT_MAX`. Even at 1000x1000 it is 1,000,000. Compare Trapping Rainwater, where the maximum total was 1,999,800,000 against `INT_MAX` of 2,147,483,647 — 7.4% of headroom — and Largest Rectangle in a Histogram at 1,000,000,000, or 114.7% of headroom. Three neighbouring problems, three completely different margins. Multiply the worst-case dimensions together; it takes ten seconds and replaces a guess with a fact.

<!-- @doubt -->
Does it matter whether I sweep rows or columns?

<!-- @answer -->
Not for correctness or for the total work. Sweeping rows runs `R` histogram passes of length `C`; sweeping columns runs `C` passes of length `R`. Both touch every cell a constant number of times, so both are O(R x C). It does matter for memory access: the incremental height update sweeps along a row with stride 1 in a row-major matrix, which is the friendly direction. Transposing to sweep columns would stride by the row length on every access. So sweep rows for a row-major layout, and if the matrix arrives column-major, sweep columns. The reduction itself is indifferent; the cache is not.

<!-- @doubt -->
The stack has now lost in two of the last three subtopics. Should I distrust it?

<!-- @answer -->
No — distrust the reflex, not the tool. The pattern across the three is consistent and useful. In Trapping Rainwater the stack lost 6.8x to two pointers, because the problem has extra structure (two ends closing inward) that the stack does not exploit. Here it loses to a DP, because the problem has extra structure (successive rows) that the stack throws away. In Largest Rectangle in a Histogram it is unbeaten, because a bare histogram has no extra structure at all — no ends to close in from, no rows to carry between — and the stack's ability to find both boundaries in one amortised pass is the best anyone can do. The monotonic stack is the right answer when the only structure available is the order of the elements. When the problem offers more, something else usually exploits it better.
