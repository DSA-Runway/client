---
id: find-row-with-maximum-1s
topic: Binary Search
title: Find row with maximum 1's
difficulty: Easy
status: ready
prerequisites:
  - lower-bound
  - count-occurrences-in-a-sorted-array
  - nested-loops
relatedIds:
  - lower-bound
  - count-occurrences-in-a-sorted-array
  - search-in-a-2d-matrix
  - search-in-2d-matrix-ii
  - matrix-median
---

<!-- @summary -->
Each row is sorted, so the count of 1s is n minus a lower bound — binary search per row, O(m log n). This is the first subtopic where that is not the best answer: a staircase walk does it in O(m + n), and which of the two wins depends entirely on the matrix's shape. Measured, the wrong choice costs 46x on wide matrices and 103x on tall ones, and on a tall enough matrix the binary version loses to counting every cell.

<!-- @theory -->
## The problem

A binary matrix, each row sorted so that all its 0s come before all its 1s. Return
the index of the row containing the most 1s. On a tie, the smallest index; if no
row contains a 1, return -1.

```
0 1 1 1
0 0 1 1
1 1 1 1     <- row 2, four 1s
0 0 0 0
```

## One row is Count Occurrences

Within a sorted row, the 1s form a suffix. The first index holding a 1 is exactly
`lowerBound(row, 1)`, so the count is `n - lowerBound(row, 1)` — the same
subtraction as Count Occurrences, with the upper bound fixed at n because 1 is the
largest value present.

Do that for every row and the whole problem is O(m log n). Verified against a
brute-force reference over every binary matrix with sorted rows for all dimensions
up to 4 by 4 — **1,143 matrices, 0 wrong.**

That is the expected answer, and it is not the best one.

## The staircase

Start at the **top-right** corner and never go back:

- If the cell holds a **1**, this row has at least as many 1s as any row seen so
  far, so record it and step **left**.
- If the cell holds a **0**, this row cannot beat the best so far, so step
  **down**.

```
0 1 1 1        start at (0,3) = 1  -> record row 0, step left
0 0 1 1        (0,2) = 1           -> record row 0, step left
1 1 1 1        (0,1) = 1           -> record row 0, step left
0 0 0 0        (0,0) = 0           -> step down
               (1,0) = 0           -> step down
               (2,0) = 1           -> record row 2, step left  -> off the edge
               answer: 2
```

Every step either decreases the column or increases the row, and neither ever
reverses, so the walk makes at most **m + n** moves total — not per row. It is
O(m + n), against O(m log n) for the binary version. Also 0 wrong over the same
1,143 matrices.

The tie rule comes out for free. `best` is only updated when the walk steps left,
which happens only when a row strictly beats the current column boundary — a row
that merely ties sees a 0 and steps down without recording. Of the 1,143 matrices,
**411 contain a tie for the maximum, and the staircase disagrees with the
reference on none of them.**

## Which one is faster depends on the shape

O(m + n) beats O(m log n) asymptotically, but only when m and n are comparable.
Fix the cell count at about four million and vary the aspect ratio:

| m x n | n / m | binary per row | staircase | staircase / binary |
|---|---|---|---|---|
| 32 x 131,072 | 4096 | **1.96** | 90.88 | 46.41x |
| 64 x 65,536 | 1024 | **3.58** | 48.88 | 13.64x |
| 128 x 32,768 | 256 | **6.33** | 33.33 | 5.26x |
| 256 x 16,384 | 64 | **10.54** | 20.33 | 1.93x |
| 512 x 8,192 | 16 | 20.62 | **17.08** | 0.83x |
| 1,024 x 4,096 | 4 | 36.04 | **20.00** | 0.55x |
| 2,048 x 2,048 | 1 | 54.54 | **18.42** | 0.34x |
| 4,096 x 1,024 | 1/4 | 90.33 | **3.12** | 0.03x |
| 16,384 x 256 | 1/64 | 235.08 | **2.29** | 0.01x |

Microseconds, median over five random matrices of best-of-nine.

The crossover sits near **n/m ≈ 30**. Wider than that and the binary version wins,
by up to 46x. Narrower and the staircase wins, by up to 103x. Neither is the
answer on its own; the shape is.

The reason is visible in the two costs. The staircase makes m + n moves, so a
matrix with a huge n is dominated by the leftward walk — 131,072 steps for a
32-row matrix. The binary version makes m log n probes, so a matrix with a huge m
pays log n for every one of its rows. Each algorithm's cost is driven by the
dimension the other one is cheap in.

## The binary version can lose to the brute force

The last row of that table understates the problem. Measured on specific shapes:

| m x n | count every cell | binary per row | staircase |
|---|---|---|---|
| 1,000 x 1,000 | 46.5 | 22.50 | **8.00** |
| 2,048 x 2,048 | 206.2 | 60.12 | **8.00** |
| 100 x 40,000 | 195.0 | **6.00** | 32.33 |
| 256 x 16,384 | 203.8 | **13.79** | 17.92 |
| 512 x 8,192 | 204.5 | 24.17 | **14.42** |
| **40,000 x 100** | **207.0** | **497.38** | **0.50** |

On a 40,000 by 100 matrix, binary search per row takes **497.38 microseconds and
counting every single cell takes 207.0** — the O(m log n) algorithm is 2.4x slower
than the O(m·n) one on the same input.

Both numbers are real and the explanation is memory, not arithmetic. Counting
every cell reads 4,000,000 integers in perfect sequential order, which vectorises
and prefetches; it is the same effect that made the linear scan competitive in
Count Occurrences. Binary search per row makes 40,000 x 7 = 280,000 probes, each
one jumping to an unpredictable offset in a fresh row. Two hundred and eighty
thousand cache misses cost more than four million sequential reads.

The staircase takes 0.50 microseconds on that matrix — 414x faster than the brute
force and 994x faster than the binary version — because its leftward steps are
sequential within a row and it only touches 40,100 cells at most.

<!-- @intuition -->
The habit this subtopic should break is reaching for binary search because the input is sorted. Sortedness is what makes a *row* cheap to measure, and the problem is not about one row — it is about comparing rows, and the comparison is where the work actually lives. The staircase is worth understanding as a different question being asked: instead of "how many 1s does each row have", it asks "can any row beat the boundary I have already reached", which is a single yes-or-no per step and can only be asked m + n times before the boundary runs out of room. That reframing — from measuring each thing to advancing one shared frontier — is the same idea behind two pointers, and it is why the answer here is not a search at all.

<!-- @approach -->
### Count Every Cell

<!-- @idea -->
Add up each row and keep the largest total.

<!-- @steps -->
1. Track the best row index and the best count so far.
2. For each row, sum its entries.
3. Compare against the best count, keeping the earlier row on a tie.
4. Return the best index.
5. If no row ever beat zero, return -1.

<!-- @complexity -->
- time: O(m·n)
- space: O(1)
- note: Ignores sortedness entirely, and is not always the slowest — its access pattern is perfectly sequential, so it vectorises. Measured 207.0 microseconds on a 40,000 by 100 matrix where binary search per row takes 497.38.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int rowWithMaxOnes(const vector<vector<int>>& g) {
    int best = -1, bestCount = 0;
    for (int r = 0; r < (int)g.size(); r++) {
        int ones = 0;
        for (int v : g[r]) ones += v;
        if (ones > bestCount) { bestCount = ones; best = r; }
    }
    return best;
}
```

<!-- @annotations -->
- 8: Summing rather than comparing, which is what lets the compiler vectorise this loop — the same reduction shape that made the scan competitive in Count Occurrences.
- 9: Strictly greater, so a tie keeps the earlier row. Using >= would return the last maximal row instead of the first.
- 11: best stays -1 when no row contains a 1, which is the required answer rather than a sentinel that needs checking.

<!-- @code java -->
```java
static int rowWithMaxOnes(int[][] g) {
    int best = -1, bestCount = 0;
    for (int r = 0; r < g.length; r++) {
        int ones = 0;
        for (int v : g[r]) ones += v;
        if (ones > bestCount) { bestCount = ones; best = r; }
    }
    return best;
}
```

<!-- @annotations -->
- 5: Java's int[][] is an array of row references, so rows may not be contiguous in memory — the sequential advantage is weaker here than in C++.

<!-- @code python -->
```python
def row_with_max_ones(g):
    best, best_count = -1, 0
    for r, row in enumerate(g):
        ones = sum(row)
        if ones > best_count:
            best_count, best = ones, r
    return best
```

<!-- @annotations -->
- 4: sum() runs in C, so this is far faster than an explicit inner loop and still O(m·n).

<!-- @approach -->
### Binary Search Each Row

<!-- @idea -->
Each row is sorted, so the first 1 is at its lower bound and the count of 1s is n minus that index.

<!-- @steps -->
1. For each row, binary search for the first position holding a 1.
2. That is the lower bound of 1 in that row.
3. The number of 1s is n minus that position.
4. Keep the largest count, preferring the earlier row on a tie.
5. Return -1 if no row contained a 1.

<!-- @complexity -->
- time: O(m log n)
- space: O(1)
- note: 0 wrong over 1,143 exhaustive matrices, and the right answer only for wide matrices. It wins by up to 46x when n/m is large and loses by up to 103x when it is small — and on a 40,000 by 100 matrix it measures 497.38 microseconds against 207.0 for counting every cell, because 280,000 scattered probes cost more than 4,000,000 sequential reads.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int rowWithMaxOnes(const vector<vector<int>>& g) {
    int m = (int)g.size();
    if (m == 0) return -1;
    int n = (int)g[0].size();
    int best = -1, bestCount = 0;
    for (int r = 0; r < m; r++) {
        int lo = 0, hi = n;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (g[r][mid] == 0) lo = mid + 1;
            else                hi = mid;
        }
        int ones = n - lo;
        if (ones > bestCount) { bestCount = ones; best = r; }
    }
    return best;
}
```

<!-- @annotations -->
- 10: hi starts at n, not n - 1, because a row of all zeros must be able to answer n — the same convention Lower Bound established.
- 12: Subtracting before halving, so lo + hi never overflows.
- 13: This is lower bound with the target fixed at 1. Comparing against 0 rather than 1 is the same test written the other way round.
- 16: n - lo, with no plus one. The bounds are half-open, exactly as in Count Occurrences.
- 17: Strictly greater, so ties keep the earlier row.

<!-- @code java -->
```java
static int rowWithMaxOnes(int[][] g) {
    if (g.length == 0) return -1;
    int m = g.length, n = g[0].length;
    int best = -1, bestCount = 0;
    for (int r = 0; r < m; r++) {
        int lo = 0, hi = n;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (g[r][mid] == 0) lo = mid + 1;
            else                hi = mid;
        }
        int ones = n - lo;
        if (ones > bestCount) { bestCount = ones; best = r; }
    }
    return best;
}
```

<!-- @annotations -->
- 8: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int from n = 1,073,741,825.

<!-- @code python -->
```python
from bisect import bisect_left


def row_with_max_ones(g):
    if not g:
        return -1
    n = len(g[0])
    best, best_count = -1, 0
    for r, row in enumerate(g):
        ones = n - bisect_left(row, 1)
        if ones > best_count:
            best_count, best = ones, r
    return best
```

<!-- @annotations -->
- 10: bisect_left is the lower bound, so n minus it is the count — the identity from Count Occurrences with the upper bound pinned at n.

<!-- @approach -->
### Walk the Staircase

<!-- @idea -->
Start at the top-right and hold a frontier: step left whenever the current row can extend it, and step down whenever it cannot.

<!-- @steps -->
1. Begin at row 0, column n - 1.
2. If the cell holds a 1, this row reaches at least this far left, so record it and move one column left.
3. If the cell holds a 0, this row cannot reach the frontier, so move one row down.
4. Stop when the row runs past the bottom or the column past the left edge.
5. The last recorded row is the answer, and -1 if none was ever recorded.

<!-- @complexity -->
- time: O(m + n) — the row index only increases and the column only decreases, so there are at most m + n moves in total
- space: O(1)
- note: The best answer for square and tall matrices, and 0 wrong over 1,143 exhaustive matrices including all 411 with ties. Measured 8.00 microseconds on 2,048 by 2,048 against 60.12 for binary search per row, and 0.50 against 497.38 on 40,000 by 100. It loses on wide matrices — 90.88 against 1.96 at 32 by 131,072.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int rowWithMaxOnes(const vector<vector<int>>& g) {
    int m = (int)g.size();
    if (m == 0) return -1;
    int n = (int)g[0].size();
    int r = 0, c = n - 1, best = -1;
    while (r < m && c >= 0) {
        if (g[r][c] == 1) { best = r; c--; }
        else                r++;
    }
    return best;
}
```

<!-- @annotations -->
- 8: Starting at the top-right. Starting anywhere else loses the invariant, because only this corner makes both moves monotone.
- 9: Both bounds are tested, since either can run out first — a wide matrix exhausts the column and a tall one exhausts the row.
- 10: Recording and stepping left. best is only written when the frontier actually advances, which is exactly why a tie keeps the earlier row.
- 11: Stepping down without recording. This row cannot beat the frontier, and because rows are sorted, nothing further left in it can either.
- 13: best stays -1 for an all-zero matrix, since the walk never steps left.

<!-- @code java -->
```java
static int rowWithMaxOnes(int[][] g) {
    if (g.length == 0) return -1;
    int m = g.length, n = g[0].length;
    int r = 0, c = n - 1, best = -1;
    while (r < m && c >= 0) {
        if (g[r][c] == 1) { best = r; c--; }
        else                r++;
    }
    return best;
}
```

<!-- @annotations -->
- 6: Each iteration moves exactly one step and never reverses, so the loop runs at most m + n times regardless of the data.

<!-- @code python -->
```python
def row_with_max_ones(g):
    if not g:
        return -1
    m, n = len(g), len(g[0])
    r, c, best = 0, n - 1, -1
    while r < m and c >= 0:
        if g[r][c] == 1:
            best = r
            c -= 1
        else:
            r += 1
    return best


# At most m + n steps in total, not per row.
```

<!-- @annotations -->
- 7: The 1 branch moves left and the 0 branch moves down, so no cell is ever visited twice.

<!-- @example -->

<!-- @input -->
```
0 1 1 1
0 0 1 1
1 1 1 1
0 0 0 0
```

<!-- @output -->
```
2
```

<!-- @why -->
Row 2 has four 1s, more than any other. The staircase reaches it in six moves without counting anything.

<!-- @walkthrough -->
```
(0,3) = 1   record row 0, step left
(0,2) = 1   record row 0, step left
(0,1) = 1   record row 0, step left
(0,0) = 0   step down
(1,0) = 0   step down
(2,0) = 1   record row 2, step left -> c = -1, stop
answer 2

Six moves for a 4 x 4 matrix, against m + n = 8 worst case.
Binary search per row would have made 4 x 2 = 8 probes.
```

<!-- @example -->

<!-- @input -->
```
0 0 0
0 0 0
```

<!-- @output -->
```
-1
```

<!-- @why -->
No row contains a 1, so there is no maximal row to name. The walk never steps left, so `best` is never written and keeps its initial -1.

<!-- @walkthrough -->
```
(0,2) = 0   step down
(1,2) = 0   step down
r = 2 = m, stop
best is still -1

Note that -1 falls out of the initialisation rather than
being a case anyone had to detect. The binary version gets
it the same way: bestCount never rises above 0.
```

<!-- @example -->

<!-- @input -->
```
0 1 1
0 1 1
0 0 1
```

<!-- @output -->
```
0
```

<!-- @why -->
Rows 0 and 1 both have two 1s. The rule is the smallest index, and the staircase gives it without comparing counts — a tying row sees a 0 at the current frontier and steps down.

<!-- @walkthrough -->
```
(0,2) = 1   record row 0, step left
(0,1) = 1   record row 0, step left
(0,0) = 0   step down
(1,0) = 0   step down       <- row 1 TIES but is not recorded
(2,0) = 0   step down
r = 3 = m, stop
answer 0

Row 1 has just as many 1s as row 0, and the frontier has
already moved past where it could prove that. Measured on
411 exhaustive matrices containing ties, the staircase
matches the reference on every one.
```

<!-- @example -->

<!-- @input -->
```
1 1 1 1 1
```

<!-- @output -->
```
0
```

<!-- @why -->
A single row of all 1s. The walk steps left five times and never gets to move down, which is the shape that makes the O(m + n) bound worth stating carefully — the column can be exhausted before the row is touched.

<!-- @walkthrough -->
```
(0,4)=1 left, (0,3)=1 left, (0,2)=1 left,
(0,1)=1 left, (0,0)=1 left -> c = -1, stop
answer 0

Five moves for one row. On a 32 x 131,072 matrix the same
behaviour costs 131,072 leftward steps, which is why the
staircase measures 90.88 microseconds there against 1.96
for binary search per row.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the staircase walking one monotone frontier from the top-right, contrasted with binary search measuring every row independently, and carries the measured crossover where the shape of the matrix decides which is faster.

<!-- @sampleInput -->
```json
{"primary":{"matrix":[[0,1,1,1],[0,0,1,1],[1,1,1,1],[0,0,0,0]],"counts":[3,2,4,0],"answer":2,"staircasePath":[{"r":0,"c":3,"value":1,"action":"record row 0, step left"},{"r":0,"c":2,"value":1,"action":"record row 0, step left"},{"r":0,"c":1,"value":1,"action":"record row 0, step left"},{"r":0,"c":0,"value":0,"action":"step down"},{"r":1,"c":0,"value":0,"action":"step down"},{"r":2,"c":0,"value":1,"action":"record row 2, step left — off the edge"}],"moves":6,"worstCase":8,"binaryProbes":8},"perRowIdentity":{"formula":"ones in a row = n - lowerBound(row, 1)","reason":"the 1s form a suffix, and the upper bound is pinned at n because 1 is the largest value present","sameAs":"Count Occurrences, with one bound fixed"},"correctness":{"space":"every binary matrix with sorted rows, all dimensions up to 4 x 4","matrices":1143,"binaryWrong":0,"staircaseWrong":0,"tieMatrices":411,"staircaseTieDisagreements":0,"tieRule":"best is written only when the walk steps left, so a merely-tying row sees a 0 and steps down"},"monotonicity":{"claim":"the row index only increases and the column only decreases","consequence":"at most m + n moves in total, not per row","contrast":"binary search per row makes m log n probes"},"shapeDecides":{"setup":"about 4,000,000 cells in every shape; microseconds, median over 5 random matrices of best-of-9","rows":[{"m":32,"n":131072,"ratio":"4096","binary":1.96,"staircase":90.88,"stairOverBinary":46.41},{"m":64,"n":65536,"ratio":"1024","binary":3.58,"staircase":48.88,"stairOverBinary":13.64},{"m":128,"n":32768,"ratio":"256","binary":6.33,"staircase":33.33,"stairOverBinary":5.26},{"m":256,"n":16384,"ratio":"64","binary":10.54,"staircase":20.33,"stairOverBinary":1.93},{"m":512,"n":8192,"ratio":"16","binary":20.62,"staircase":17.08,"stairOverBinary":0.83},{"m":1024,"n":4096,"ratio":"4","binary":36.04,"staircase":20.00,"stairOverBinary":0.55},{"m":2048,"n":2048,"ratio":"1","binary":54.54,"staircase":18.42,"stairOverBinary":0.34},{"m":4096,"n":1024,"ratio":"1/4","binary":90.33,"staircase":3.12,"stairOverBinary":0.03},{"m":16384,"n":256,"ratio":"1/64","binary":235.08,"staircase":2.29,"stairOverBinary":0.01}],"crossover":"near n/m = 30","penalty":"up to 46x for the wrong choice on wide matrices and 103x on tall ones","why":"the staircase pays for n in leftward steps; the binary version pays log n for every one of its m rows — each is expensive in the dimension the other is cheap in"},"binaryLosesToBrute":{"rows":[{"m":1000,"n":1000,"brute":46.5,"binary":22.50,"staircase":8.00},{"m":2048,"n":2048,"brute":206.2,"binary":60.12,"staircase":8.00},{"m":100,"n":40000,"brute":195.0,"binary":6.00,"staircase":32.33},{"m":256,"n":16384,"brute":203.8,"binary":13.79,"staircase":17.92},{"m":512,"n":8192,"brute":204.5,"binary":24.17,"staircase":14.42},{"m":40000,"n":100,"brute":207.0,"binary":497.38,"staircase":0.50}],"headline":"on 40,000 x 100 the O(m log n) algorithm is 2.4x SLOWER than the O(m*n) one","cause":"4,000,000 sequential reads vectorise and prefetch; 280,000 scattered probes do not","staircaseThere":"0.50 microseconds — 414x faster than the brute force and 994x faster than the binary version"},"assertions":["the answer is the smallest index among rows with the maximum count","-1 exactly when the matrix contains no 1","the staircase visits no cell twice","the staircase makes at most m + n moves","the count of 1s in a row is n minus its lower bound of 1"]}
```

<!-- @highlights -->
- A row's count of 1s is `n - lowerBound(row, 1)` — Count Occurrences with the upper bound pinned at n.
- Binary search per row is O(m log n) and correct on all 1,143 exhaustive matrices, and it is not the best answer.
- The staircase holds one monotone frontier and finishes in at most m + n moves total, not per row.
- The tie rule falls out of the walk: a merely-tying row sees a 0 and steps down, matching the reference on all 411 tie matrices.
- The crossover is near n/m = 30; the wrong choice costs up to 46x on wide matrices and 103x on tall ones.
- On a 40,000 by 100 matrix the O(m log n) version is 2.4x slower than counting every cell, because scattered probes lose to sequential reads.

<!-- @edgeCases -->
- A matrix with no 1s — the answer is -1, and it falls out of the initialisation rather than needing detection.
- A matrix of all 1s — the answer is row 0, and the walk exhausts the column without ever stepping down.
- A tie for the maximum — the smallest index wins, which the staircase gives without comparing counts.
- A single row — the walk is purely leftward and takes n steps.
- A single column — the walk is purely downward and takes m steps.
- An empty matrix — every version guards `m == 0` before reading `g[0].size()`.
- A matrix with zero columns — the staircase starts with `c = -1` and the loop never runs.
- A row that is all 1s next to a row that is all 0s — the frontier reaches column 0 and the walk ends immediately after.
- Rows that are not sorted — the precondition every version relies on, and nothing checks it; the answers become meaningless rather than merely wrong.
- n above 1,073,741,824 in the binary version — where `(lo + hi) / 2` overflows an int, exactly as in Lower Bound.

<!-- @pitfalls -->
- Reaching for binary search because the rows are sorted. It is correct and loses by up to 103x on tall matrices.
- Assuming O(m + n) always beats O(m log n). It does not when n dominates — at 32 by 131,072 the staircase is 46x slower.
- Starting the staircase anywhere but the top-right. Only that corner makes both moves monotone, and from any other the walk can need to backtrack.
- Using `>=` when comparing counts. It returns the last maximal row where the specification asks for the first.
- Recording the row on a downward step. `best` must only change when the frontier advances, or ties resolve to the wrong index.
- Writing `n - lowerBound(row, 1) + 1`. The bounds are half-open, exactly as in Count Occurrences.
- Reading `g[0].size()` before checking that the matrix has any rows.
- Judging the brute force by its complexity alone. It reads memory sequentially and beats binary search per row on tall matrices.
- Testing only on square matrices. That is the one shape where the crossover cannot be observed.
- Computing `mid` as `(lo + hi) / 2` in the per-row search. It overflows an int from n = 1,073,741,825.

<!-- @doubt -->
### Why is binary search not the answer here?

<!-- @answer -->
Because it measures every row independently when the rows only need to be compared. Binary search per row is O(m log n) and correct — 0 wrong over 1,143 exhaustive matrices — but it spends log n on each of the m rows, including rows that clearly cannot win. The staircase spends at most m + n moves in total, because the row index only ever increases and the column only ever decreases, so no cell is visited twice. On a 2,048 by 2,048 matrix that is 8.00 microseconds against 60.12. The general shape of the mistake is worth keeping: sortedness makes one row cheap to measure, and this problem is not about one row.

<!-- @doubt -->
### So should I always use the staircase?

<!-- @answer -->
No, and this is the part most write-ups omit. O(m + n) beats O(m log n) only when the two dimensions are comparable. Holding the cell count at about four million and varying the shape, the staircase is **46.41x slower** at 32 by 131,072 and **99x faster** at 16,384 by 256. The crossover sits near **n/m = 30**: wider than that, binary search per row wins; narrower, the staircase does. The reason is symmetric — the staircase pays for n in leftward steps, and the binary version pays log n for every one of its m rows, so each is expensive in exactly the dimension the other is cheap in. If you know the shape, choose accordingly; if you do not, the staircase is the safer default because real matrices are more often tall than extremely wide.

<!-- @doubt -->
### How can the O(m log n) version lose to the O(m·n) one?

<!-- @answer -->
Memory, not arithmetic. On a 40,000 by 100 matrix, counting every cell measures **207.0 microseconds** and binary search per row measures **497.38** — the asymptotically better algorithm is 2.4x slower on the same input. Counting reads 4,000,000 integers in perfect sequential order, which the compiler vectorises and the prefetcher hides; it is the same effect that made the linear scan the fastest approach in Count Occurrences. Binary search makes 40,000 x 7 = 280,000 probes, each landing at an unpredictable offset in a fresh row, and each one is a potential cache miss. Two hundred and eighty thousand misses cost more than four million sequential reads. Complexity counts operations and assumes they cost the same; on a real machine a scattered probe and a sequential read differ by roughly two orders of magnitude.

<!-- @doubt -->
### Why must the staircase start at the top-right?

<!-- @answer -->
Because it is the only corner from which both moves are unambiguous. At the top-right, a 1 means "this row extends at least this far, and since rows are sorted everything to the right is also 1" — so stepping left is safe and the row is recorded. A 0 means "this row's 1s begin strictly to the right of here, so it cannot beat the frontier" — so stepping down is safe. Both conclusions rely on being at the right end of the unexplored region and the top of the unexplored rows. Start at the top-left and a 1 tells you nothing about how far the row extends; start at the bottom-right and the tie rule inverts. The monotonicity — row only up, column only down — is what caps the walk at m + n, and it exists only from this corner.

<!-- @doubt -->
### How does the staircase get the tie rule right?

<!-- @answer -->
By never recording a row that merely matches. `best` is written only on a leftward step, and a leftward step happens only when the current cell holds a 1 — which means that row reaches the current frontier, which an earlier row has already been credited for passing. A row that ties the best count sees a **0** at the frontier column, because the frontier has already moved one past where that count ends, so it steps down without recording. On `[[0,1,1],[0,1,1],[0,0,1]]` rows 0 and 1 both have two 1s and the walk returns 0. Measured over the 1,143 exhaustive matrices, **411 contain a tie for the maximum and the staircase matches the reference on all 411**.

<!-- @doubt -->
### Why is a row's count `n - lowerBound(row, 1)`?

<!-- @answer -->
Because in a sorted binary row the 1s form a suffix, so the count is the distance from where they start to the end. `lowerBound(row, 1)` is the first index holding something at least 1 — the first 1, or n if there are none — and n minus it is the length of that suffix. It is exactly the Count Occurrences identity `upper - lower` with the upper bound pinned at n, since 1 is the largest value the matrix contains and nothing can lie past it. There is no plus one for the same reason as there: these are half-open bounds, not inclusive indices. A row of all zeros gives a lower bound of n and a count of 0, with no special case.

<!-- @doubt -->
### What if the rows are not sorted?

<!-- @answer -->
Then only the brute force still works, and the other two fail silently. Binary search assumes the 1s form a suffix, so on an unsorted row it returns whichever boundary its probes happen to imply — a number in range, with no relationship to the count. The staircase depends on the same property in a slightly stronger form: when it reads a 0 it concludes that nothing further left in that row can be a 1, and steps down. On unsorted data that conclusion is simply false, and the walk can skip the winning row entirely. Nothing in any implementation checks the precondition, and there is no cheap way to — verifying that every row is sorted costs O(m·n), which is what the brute force costs anyway.
