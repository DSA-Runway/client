---
id: search-in-2d-matrix-ii
topic: Binary Search
title: Search in 2D Matrix - II
difficulty: Hard
status: ready
prerequisites:
  - search-in-a-2d-matrix
  - find-row-with-maximum-1s
  - search-x-in-sorted-array
relatedIds:
  - search-in-a-2d-matrix
  - matrix-median
  - find-row-with-maximum-1s
  - find-peak-element-ii
---

<!-- @summary -->
Dropping one clause from the previous problem — rows and columns are sorted, but the matrix is no longer one sorted sequence — costs the binary searches 15% of their answers and makes the staircase walk the canonical answer. Measured, though, the canonical answer loses: binary searching each surviving row is 2.9x to 158x faster despite doing more work, because the staircase is a serial dependency chain and the row scan pipelines.

<!-- @theory -->
## The problem

Every row is sorted left to right and every column is sorted top to bottom. That
is all — a row's first element may be smaller than the previous row's last.
Decide whether a target is present.

```
[[ 1,  4,  7, 11, 15],
 [ 2,  5,  8, 12, 19],
 [ 3,  6,  9, 16, 22],      target = 5   ->  true
 [10, 13, 14, 17, 24],      target = 20  ->  false
 [18, 21, 23, 26, 30]]
```

Compare with Search in a 2D Matrix, which additionally guaranteed that each row
starts above where the last one ended. That single extra clause made the
row-major reading one sorted sequence. Without it, reading row-major gives
`1, 4, 7, 11, 15, 2, 5, ...` — not sorted, and every binary search over it is
invalid. Measured in the previous subtopic over 2,187,384 queries, the flattened
search is wrong on **14.72%** of them and the two-step on **15.69%**.

## The staircase, and why only two corners work

Start at the **top-right**. From there the two available moves disagree:

```
moving LEFT  strictly decreases    (rows are sorted)
moving DOWN  strictly increases    (columns are sorted)
```

That disagreement is the whole algorithm. If the cell is greater than the target,
nothing below it in that column can help either — drop the **column**. If it is
smaller, nothing to its left in that row can help — drop the **row**. Each
comparison eliminates an entire line, so the walk is O(m + n).

The bottom-left corner works for the same reason, with the roles swapped. The
other two corners cannot work at all:

```
at the TOP-LEFT     moving right INCREASES and moving down INCREASES
at the BOTTOM-RIGHT moving left  DECREASES and moving up   DECREASES
```

With both moves pointing the same way, a comparison eliminates nothing. Concretely,
on

```
[[1, 2, 3],
 [4, 5, 6],      target = 5
 [7, 8, 9]]
```

the top-left cell is 1, which is smaller than 5 — so go right, or go down? The 5
is in neither the first row `[1,2,3]` nor the first column `[1,4,7]`, so either
choice can be wrong and no rule based on that comparison can save you. Measured
over **3,000,000 queries** on random row- and column-sorted matrices:

| start corner | wrong |
|---|---|
| top-right | **0** |
| bottom-left | **0** |
| top-left | 282,271 — **9.41%** |
| bottom-right | 282,139 — **9.40%** |

Choosing the corner is not a stylistic decision. It is the only place the
algorithm's correctness lives.

## The canonical answer is not the fast one

Because each row is sorted, you can also binary search the rows individually,
skipping any row whose first element exceeds the target (and every row after it,
since columns are sorted) or whose last element is below it. That is O(m log n)
worst case against the staircase's O(m + n) — asymptotically worse. Measured on
random row- and column-sorted matrices of about a million cells:

| shape | staircase | binary search each surviving row |
|---|---|---|
| 1,000 × 1,000 | 1,575 | **540** |
| 100 × 10,000 | 4,054 | **190** |
| 10,000 × 100 | 50,710 | **11,323** |
| 10 × 100,000 | 45,554 | **288** |
| 100,000 × 10 | 135,788 | **31,110** |

Nanoseconds per query. The row version wins everywhere, from **2.9x** at
1,000×1,000 to **158x** at 10×100,000.

It also does *more work*. At 1,000×1,000 the staircase takes on the order of
2,000 steps, while the row version scans 1,000 row endpoints and then binary
searches the roughly **500** rows that survive pruning — about 5,000 probes. Three
times the operations, running nearly three times faster.

The reason is what the operations are. The staircase is a **serial dependency
chain**: the next cell to read cannot be computed until the current comparison has
resolved, so the processor cannot run ahead, and every step is an unpredictable
branch. The row scan is a sequence of **independent** iterations over row
endpoints — the addresses are known in advance, the prefetcher covers them, and
several rows are in flight at once. This is the sharpest case in the whole topic
of the recurring result that operation counts are not times.

Pruning is doing real work in the tall shapes but is not the whole story. At
100,000 × 10 only **12.7** rows survive pruning on average — yet the loop still
touches all 100,000 row endpoints, so it remains O(m), and it is still 4.4x ahead
of the O(m+n) staircase.

## What to actually write

The staircase remains the answer worth knowing: it is O(m + n) with O(1) space, it
generalises, and it is the one an interviewer is asking for. The row-wise search
is the one to reach for when the matrix is wide, when queries are frequent enough
for the constant to matter, or when the shape is known to be skewed. Both are
correct here — verified **0 wrong** across 3,000,000 queries — which is the
difference from the previous subtopic, where the choice decided the answer rather
than the runtime.

<!-- @intuition -->
The pairing of this problem with the previous one is the lesson, and it runs in two directions. Losing one clause from the statement invalidates an entire family of algorithms: the binary searches do not get slower, they get *wrong*, on about one query in seven. But the algorithm that replaces them — correct on every input, asymptotically better, the one every write-up names — turns out to be the slow choice on real hardware, because O(m+n) dependent steps cost more than O(m log n) independent ones. So the same problem shows both that asymptotic analysis is what tells you which algorithms are admissible, and that it is not what tells you which admissible algorithm to run. Those are different questions and they want different evidence.

<!-- @approach -->
### Scan Every Cell

<!-- @idea -->
Compare every element with the target.

<!-- @steps -->
1. Walk every row.
2. Walk every cell in the row.
3. Return true on a match, false when the matrix is exhausted.

<!-- @complexity -->
- time: O(m·n)
- space: O(1)
- note: The reference the others were verified against. Uses neither the row nor the column ordering — but its perfect locality means it is not always the slowest option, as the tall-matrix numbers show.

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
- 6: Sequential reads within a row, which the hardware prefetcher handles perfectly. That locality is why this stays competitive with cleverer algorithms on skewed shapes.
- 7: The only comparison, and it uses no ordering assumption at all.

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
- 2: Each `row` is a separate array object, so locality holds inside a row but not necessarily between rows.

<!-- @code python -->
```python
def search_matrix(mat, target):
    return any(target in row for row in mat)
```

<!-- @annotations -->
- 2: `target in row` runs at C speed, so this is far faster than an explicit Python loop while remaining O(m·n).

<!-- @approach -->
### Staircase from the Top-Right

<!-- @idea -->
Stand where moving left decreases and moving down increases, so every comparison eliminates a whole row or a whole column.

<!-- @steps -->
1. Start at row 0, last column.
2. Equal to the target — return true.
3. Greater than the target — the whole column is too large below, so move left.
4. Smaller — the whole row is too small to the left, so move down.
5. Walking off the matrix means absent.

<!-- @complexity -->
- time: O(m + n)
- space: O(1)
- note: **0 wrong** over 3,000,000 queries, and the answer worth knowing. Also the slower of the two correct searches in every measured shape, because each step depends on the previous comparison.

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
- 6: The corner choice is the correctness argument. Here moving left decreases and moving down increases; at the top-left both moves increase, and starting there is wrong on 9.41% of queries.
- 9: Discarding an entire column. Every cell below `mat[r][c]` in this column is at least as large, so if this one already exceeds the target, none of them can equal it.
- 10: Discarding an entire row, symmetrically. One row or column leaves per iteration, which bounds the walk at m + n − 1 steps.
- 8: The equality test must come first — the other two branches both move away from a matching cell.

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
- 4: Both bounds are checked because either index can be the one to leave the matrix — `r` grows and `c` shrinks.

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
- 4: `c >= 0` matters more here than in C++ — a negative index would silently wrap to the end of the row rather than raising, so the walk would read the wrong cells instead of failing loudly.

<!-- @approach -->
### Binary Search Each Surviving Row

<!-- @idea -->
Every row is sorted, so binary search each one — skipping rows that cannot contain the target, and stopping entirely once a row starts above it.

<!-- @steps -->
1. Walk the rows top to bottom.
2. If the row's first element exceeds the target, stop — columns are sorted, so every later row starts higher too.
3. If the row's last element is below the target, skip it.
4. Otherwise binary search that row.
5. Return true on a hit, false after the last row.

<!-- @complexity -->
- time: O(m log n) worst case
- space: O(1)
- note: Asymptotically worse than the staircase and **2.9x to 158x faster** at every shape measured, because its iterations are independent and prefetchable rather than a dependency chain.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

bool searchMatrix(const vector<vector<int>>& mat, int target) {
    int n = (int)mat[0].size();
    for (const auto& row : mat) {
        if (row[0] > target) break;
        if (row[n - 1] < target) continue;
        if (binary_search(row.begin(), row.end(), target)) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 8: `break`, not `continue`. Columns are sorted, so once a row starts above the target every later row does too — this is the one place the column ordering is used.
- 9: `continue`, not `break`. A row ending below the target says nothing about later rows, which start lower but may end higher.
- 10: Only rows that could contain the target are searched. At 100,000 × 10 that is about **12.7** rows out of 100,000 — though the loop still touches every row's endpoints, so the scan remains O(m).
- 7: The loop reads two endpoints per row at predictable addresses, so the prefetcher can run ahead. That independence, not the pruning, is why this beats the staircase even where it does more work.

<!-- @code java -->
```java
static boolean searchMatrix(int[][] mat, int target) {
    int n = mat[0].length;
    for (int[] row : mat) {
        if (row[0] > target) break;
        if (row[n - 1] < target) continue;
        if (Arrays.binarySearch(row, target) >= 0) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 6: `Arrays.binarySearch` returns a negative insertion point when absent, so the test is `>= 0` rather than a boolean.

<!-- @code python -->
```python
import bisect


def search_matrix(mat, target):
    n = len(mat[0])
    for row in mat:
        if row[0] > target:
            break
        if row[n - 1] < target:
            continue
        i = bisect.bisect_left(row, target)
        if i < n and row[i] == target:
            return True
    return False
```

<!-- @annotations -->
- 12: `bisect_left` gives the insertion point, so both the range check and the equality test are needed before declaring a hit.

<!-- @example -->

<!-- @input -->
```
mat = [[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]]
target = 5
```

<!-- @output -->
```
true
```

<!-- @why -->
The staircase walks left along the top row while the values exceed 5, then drops one row and lands on it. Five steps for a 25-cell matrix.

<!-- @walkthrough -->
```
start at the top-right (0,4)

(0,4) = 15   > 5, drop column 4   c = 3
(0,3) = 11   > 5, drop column 3   c = 2
(0,2) =  7   > 5, drop column 2   c = 1
(0,1) =  4   < 5, drop row 0      r = 1
(1,1) =  5   FOUND
->  true

Each step deletes a full line — three columns and one row
here — which is why the walk is O(m+n) and not O(mn).
```

<!-- @example -->

<!-- @input -->
```
mat = [[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]]
target = 20
```

<!-- @output -->
```
false
```

<!-- @why -->
20 lies between values present in the matrix but is not one of them. The walk zig-zags down and left until it steps off the bottom edge, taking nine steps — close to the m + n − 1 = 9 bound.

<!-- @walkthrough -->
```
(0,4) = 15   < 20, drop row 0      r = 1
(1,4) = 19   < 20, drop row 1      r = 2
(2,4) = 22   > 20, drop column 4   c = 3
(2,3) = 16   < 20, drop row 2      r = 3
(3,3) = 17   < 20, drop row 3      r = 4
(4,3) = 26   > 20, drop column 3   c = 2
(4,2) = 23   > 20, drop column 2   c = 1
(4,1) = 21   > 20, drop column 1   c = 0
(4,0) = 18   < 20, drop row 4      r = 5
r = 5 is off the matrix  ->  false

Nine steps against the m + n - 1 = 9 worst case: a miss is
what makes the walk take its full length.
```

<!-- @example -->

<!-- @input -->
```
mat = [[1, 2, 3], [4, 5, 6], [7, 8, 9]], target = 5
```

<!-- @output -->
```
true
```

<!-- @why -->
The smallest clear demonstration that the starting corner is a correctness question. The top-right finds 5 in three steps; from the top-left there is no rule that could.

<!-- @walkthrough -->
```
from the TOP-RIGHT:
  (0,2) = 3   < 5, drop row 0      r = 1
  (1,2) = 6   > 5, drop column 2   c = 1
  (1,1) = 5   FOUND

from the TOP-LEFT:
  (0,0) = 1   < 5.  Now go right, or go down?
              5 is not in row 0    [1, 2, 3]
              5 is not in column 0 [1, 4, 7]

Both moves from the top-left increase the value, so "too
small" eliminates nothing and either choice can be wrong.
Measured, starting there is wrong on 9.41% of queries and
the bottom-right on 9.40%.
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
The matrix carried over from the previous subtopic. Rows and columns are sorted, but the row-major reading `2, 4, 3, 5` is not — so this is a legal input here and an illegal one there.

<!-- @walkthrough -->
```
(0,1) = 4   > 3, drop column 1   c = 0
(0,0) = 2   < 3, drop row 0      r = 1
(1,0) = 3   FOUND
->  true

The flattened binary search from Search in a 2D Matrix
returns false on this input. That is not a bug in it — the
input violates its precondition. Losing one clause of the
statement is what moves this matrix from illegal to legal,
and costs the binary searches about one query in seven.
```

<!-- @visualization custom -->

<!-- @description -->
Shows why only two of the four corners admit a decision rule, and why the asymptotically better staircase loses to a row-wise binary search on real hardware.

<!-- @sampleInput -->
```json
{"primary":{"matrix":[[1,4,7,11,15],[2,5,8,12,19],[3,6,9,16,22],[10,13,14,17,24],[18,21,23,26,30]],"target":5,"answer":true,"path":[{"cell":[0,4],"value":15,"move":"drop column 4"},{"cell":[0,3],"value":11,"move":"drop column 3"},{"cell":[0,2],"value":7,"move":"drop column 2"},{"cell":[0,1],"value":4,"move":"drop row 0"},{"cell":[1,1],"value":5,"move":"found"}],"steps":5},"whatChangedFromPartI":{"partIPrecondition":"rows sorted AND each row starts above where the previous ended, so the row-major reading is one sorted sequence","thisPrecondition":"rows sorted and columns sorted - nothing more","consequence":"the row-major reading is no longer sorted, so every binary search over it is invalid","measuredInPartI":{"queries":2187384,"flattenedWrong":"14.72%","twoStepWrong":"15.69%","staircaseWrong":"0%"},"sharedExample":{"matrix":[[2,4],[3,5]],"target":3,"rowMajor":[2,4,3,5],"legalHere":true,"legalInPartI":false}},"cornerChoice":{"rule":"the corner must be one where the two available moves change the value in OPPOSITE directions","topRight":{"left":"decreases","down":"increases","works":true},"bottomLeft":{"right":"increases","up":"decreases","works":true},"topLeft":{"right":"increases","down":"increases","works":false},"bottomRight":{"left":"decreases","up":"decreases","works":false},"measured":{"queries":3000000,"space":"random row+column sorted matrices","rows":[{"corner":"top-right","wrong":0},{"corner":"bottom-left","wrong":0},{"corner":"top-left","wrong":282271,"pct":9.41},{"corner":"bottom-right","wrong":282139,"pct":9.40}]},"illustration":{"matrix":[[1,2,3],[4,5,6],[7,8,9]],"target":5,"atTopLeft":"cell is 1, smaller than 5 - go right or down?","row0":[1,2,3],"column0":[1,4,7],"point":"5 is in neither, so no rule based on that comparison can choose correctly","atTopRight":["(0,2)=3 < 5, drop row 0","(1,2)=6 > 5, drop column 2","(1,1)=5 found"]}},"canonicalIsNotFastest":{"unit":"nanoseconds per query, random row+column sorted matrices of about a million cells","rows":[{"shape":"1000 x 1000","staircase":1575,"perRowBinary":540,"ratio":"2.9x"},{"shape":"100 x 10000","staircase":4054,"perRowBinary":190,"ratio":"21x"},{"shape":"10000 x 100","staircase":50710,"perRowBinary":11323,"ratio":"4.5x"},{"shape":"10 x 100000","staircase":45554,"perRowBinary":288,"ratio":"158x"},{"shape":"100000 x 10","staircase":135788,"perRowBinary":31110,"ratio":"4.4x"}],"complexities":{"staircase":"O(m + n)","perRowBinary":"O(m log n) worst case"},"theInversion":{"at1000x1000":{"staircaseSteps":"about 2000","perRowWork":"1000 row endpoints scanned, then about 500 surviving rows binary searched - roughly 5000 probes","reading":"three times the operations, running nearly three times faster"}},"why":{"staircase":"a serial dependency chain - the next cell cannot be computed until the current comparison resolves, and every step is an unpredictable branch","perRowBinary":"independent iterations over row endpoints at predictable addresses, so the prefetcher runs ahead and several rows are in flight at once"},"pruningIsNotTheWholeStory":{"shape":"100000 x 10","rowsSurvivingPruning":12.7,"ofRows":100000,"note":"the loop still touches all 100,000 row endpoints, so it remains O(m), and it is still 4.4x ahead"}},"whatToWrite":{"staircase":"the answer worth knowing - O(m+n), O(1) space, generalises, and what an interviewer is asking for","perRowBinary":"reach for it when the matrix is wide, when queries are frequent enough for the constant to matter, or when the shape is known to be skewed","keyDifferenceFromPartI":"both are correct here - 0 wrong across 3,000,000 queries - so the choice decides runtime, not the answer"},"assertions":["every row is sorted left to right","every column is sorted top to bottom","the row-major reading need NOT be sorted","one row or column is eliminated per staircase step, bounding the walk at m + n - 1","only the top-right and bottom-left corners admit a decision rule"]}
```

<!-- @highlights -->
- One clause less than the previous problem, and every binary search over the row-major order becomes **~15% wrong**.
- The staircase works because at the top-right the two moves change the value in **opposite directions**; the top-left and bottom-right are **9.41%** and **9.40%** wrong.
- Each step deletes a full row or column, bounding the walk at **m + n − 1**.
- The canonical O(m+n) staircase **loses** to an O(m log n) per-row binary search — **2.9× to 158×**.
- At 1,000 × 1,000 the row version does ~3× the operations and runs ~3× faster: dependent steps versus independent ones.
- Pruning isn't the explanation — at 100,000 × 10 only **12.7** rows survive, but the scan is still O(m) and still 4.4× ahead.

<!-- @edgeCases -->
- 1×1 matrix — one comparison and the walk ends.
- A single row — the staircase walks left along it, degenerating to a linear scan; the row version binary searches it.
- A single column — the staircase walks straight down; the row version checks m endpoints.
- Target smaller than `mat[0][0]` — the staircase steps off the left edge after n moves; the row version breaks on the first row.
- Target larger than `mat[m-1][n-1]` — the staircase walks down the last column and off the bottom.
- Duplicate values — permitted, and the search returns present/absent correctly regardless of which copy it meets.
- A matrix that is also row-major sorted — legal here, and where the previous subtopic's faster searches also apply.
- A matrix that is *not* row-major sorted, like `[[2,4],[3,5]]` — legal here, illegal there.
- Very skewed shapes — where the choice between the two correct algorithms is worth 158×.

<!-- @pitfalls -->
- Starting at the top-left or bottom-right. Both moves change the value the same way, so nothing is eliminated — 9.41% and 9.40% wrong.
- Carrying over the flattened binary search from Search in a 2D Matrix. Its precondition no longer holds; ~15% wrong.
- Writing `continue` where the row search needs `break`. Once a row starts above the target, columns being sorted means every later row does too.
- Writing `break` where it needs `continue`. A row ending below the target says nothing about later rows.
- Testing the two inequalities before testing equality. Both move away from a matching cell.
- Assuming O(m+n) beats O(m log n) because the analysis says so. Measured, it loses at every shape by 2.9× to 158×.
- Forgetting `c >= 0` in Python. A negative index wraps silently rather than raising.
- Binary searching columns instead of rows without transposing. Columns are sorted too, but they are not contiguous in memory, so the constant is far worse.

<!-- @doubt -->
### Why must the walk start at the top-right or bottom-left?

<!-- @answer -->
Because those are the only corners where the two available moves change the value in **opposite** directions, and that opposition is what lets a single comparison eliminate a whole line. At the top-right, moving left strictly decreases (rows are sorted) and moving down strictly increases (columns are sorted): a cell too large means the entire column below it is too large, and a cell too small means the entire row to its left is too small. At the top-left both moves increase, and at the bottom-right both decrease, so a comparison tells you the cell is wrong without telling you which way to go. Concretely, in `[[1,2,3],[4,5,6],[7,8,9]]` searching for 5, the top-left cell 1 is too small — but 5 is in neither the first row `[1,2,3]` nor the first column `[1,4,7]`, so going right and going down are both potentially wrong. Measured over **3,000,000 queries**, the two valid corners are wrong 0 times and the two invalid ones are wrong **9.41%** and **9.40%** of the time.

<!-- @doubt -->
### Why does the O(m+n) staircase lose to an O(m log n) search?

<!-- @answer -->
Because its steps are serially dependent and the row scan's are not. The staircase cannot compute the next cell to read until the current comparison has resolved, so each iteration is a load whose address depends on the previous load, plus a branch the predictor cannot learn — the processor stalls on every step. The row-wise version reads two endpoints per row at addresses known in advance, so the prefetcher runs ahead and many rows are in flight simultaneously. Measured on random row- and column-sorted matrices, the row version wins from **2.9x** at 1,000×1,000 up to **158x** at 10×100,000. The clearest way to see it: at 1,000×1,000 the staircase takes about 2,000 steps while the row version scans 1,000 endpoints and binary searches the ~500 surviving rows, roughly 5,000 probes — about **three times the operations at nearly three times the speed**. Asymptotic analysis correctly tells you both algorithms are admissible; it does not tell you which to run.

<!-- @doubt -->
### Why does the row search `break` on one test and `continue` on the other?

<!-- @answer -->
They rely on different orderings. `row[0] > target` justifies `break` because the **columns** are sorted: if this row starts above the target, every later row starts at least as high, so no later row can contain it either. That is the only place the row-wise approach uses the column ordering at all. `row[n-1] < target` justifies only `continue`, because a row ending below the target says nothing about later rows — they start lower than nothing in particular, and their last elements may well be higher. Swapping the two is a natural mistake: `continue` on the first costs only time, but `break` on the second returns false while the target is still ahead. On the worked matrix, searching for 20 with that swap would stop at row 0 (whose last element 15 is below 20) and report absent immediately.

<!-- @doubt -->
### If both algorithms are correct, which should I write?

<!-- @answer -->
Write the staircase, and know the other one exists. The staircase is O(m + n) with O(1) space, needs no library binary search, generalises to any row- and column-sorted structure, and is what the question is testing. The row-wise search is what you reach for when the matrix is wide (its advantage grows with n while the staircase's cost grows with n too), when the same matrix is queried many times so constants dominate, or when profiling has told you this is hot. The important difference from the previous subtopic is that here the choice is only about speed — both were **0 wrong** across 3,000,000 queries. There, choosing wrongly changed the answer on about one query in seven. Knowing which kind of decision you are making matters more than either answer.

<!-- @doubt -->
### How do I tell this problem from Search in a 2D Matrix?

<!-- @answer -->
By one clause. Both say each row is sorted; the earlier one adds that the first element of each row exceeds the last element of the previous row, which makes the row-major reading a single sorted sequence and licenses a plain binary search over `m·n` indices. This one drops that clause, so a row can start below where the previous row ended. The matrix `[[2,4],[3,5]]` is the smallest thing that separates them: rows and columns are both sorted so it is legal here, but read row-major it is `2, 4, 3, 5`, which is not sorted, so it is illegal there — and the flattened search reports 3 absent. If you are unsure which problem you have, check whether `mat[i][n-1] <= mat[i+1][0]` is guaranteed. If it is, use the earlier subtopic's two-step search, which is faster than anything here. If it is not, you are in this problem.
