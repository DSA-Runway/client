---
id: rotate-matrix-by-90-degrees
topic: Arrays
title: Rotate Matrix by 90 Degrees
difficulty: Medium
status: ready
prerequisites:
  - set-matrix-zeroes
  - nested-loops
  - left-rotate-array-by-k-places
  - for-loop
  - time-and-space-complexity-basics
relatedIds:
  - set-matrix-zeroes
  - print-the-matrix-in-spiral-manner
  - left-rotate-array-by-k-places
  - nested-loops
---

<!-- @summary -->
Rotate a square matrix a quarter turn in place — where swapping the order of the two steps does not break the algorithm but silently rotates the other way, looping over the full square instead of the triangle transposes twice and cancels out, and the four-way cycle is measured 2x faster because it touches each cell exactly once.

<!-- @theory -->
## The problem

Rotate an n × n matrix 90 degrees clockwise, in place.

```
1 2 3        7 4 1
4 5 6   ->   8 5 2
7 8 9        9 6 3
```

Where does a cell go? The value at row r, column c lands at row c, column
n−1−r. Reading it the other way round — what ends up at (r, c)? — gives

```
result[r][c] = matrix[n-1-c][r]
```

That formula is the whole problem. Every approach below is a way of applying it
without needing a second matrix to hold the answer.

## The two-step trick

The rotation factors into two operations that are each easy to do in place:

```
transpose  (reflect across the main diagonal)
then reverse every row
```

```
1 2 3    transpose   1 4 7    reverse rows   7 4 1
4 5 6      ---->     2 5 8       ---->       8 5 2
7 8 9                3 6 9                   9 6 3
```

Both steps are in place. The transpose swaps pairs across the diagonal; the row
reversal is the same two-pointer reversal used in **Left Rotate by K Places**.

### The order is not interchangeable

Doing the reverse first and the transpose second is not a broken clockwise
rotation — it is a **correct anticlockwise rotation**:

```
input               [[1,2,3],[4,5,6],[7,8,9]]
transpose + reverse [[7,4,1],[8,5,2],[9,6,3]]   clockwise
reverse + transpose [[3,6,9],[2,5,8],[1,4,7]]   anticlockwise
```

Verified: `reverse + transpose` equals the anticlockwise rotation on every input
tested. Measured against a clockwise reference it "fails" on **94% of 3×3
matrices** — but it is not producing garbage, it is answering the mirror
question. If you need anticlockwise, this *is* the algorithm; just do not reach
for it by accident.

### The loop bound that quietly does nothing

The transpose must visit only the **upper triangle**:

```
for i in 0..n-1:
    for j in i+1..n-1:        <-- j starts at i+1, not 0
        swap(m[i][j], m[j][i])
```

Loop `j` over the full range and every pair gets swapped twice — once as (i,j)
and once as (j,i) — so the transpose **undoes itself**. The matrix comes back
unchanged, and only the row reversal survives, producing a horizontal mirror
rather than a rotation:

```
full-range transpose then reverse  [[3,2,1],[6,5,4],[9,8,7]]
just reversing the rows            [[3,2,1],[6,5,4],[9,8,7]]     identical
```

Measured wrong on **88% of 3×3 matrices**. It is a nasty bug because the code
looks symmetric and correct, and on a 1×1 matrix it passes.

## The four-way cycle, and why it is faster

The rotation moves cells in cycles of four: a cell goes to where the second was,
the second to where the third was, the third to the fourth, and the fourth back
to the first. Work through the matrix ring by ring, and within each ring move the
four cells at a time with a single temporary.

That is one pass, and it touches every cell exactly once — where transpose plus
reverse touches every cell **twice**, once in each step. Counting actual cell
writes:

| n | transpose + reverse | four-way | writes per cell |
|---|---|---|---|
| 512 | 523,776 | 262,144 | 2.00 vs 1.00 |
| 1,024 | 2,096,128 | 1,048,576 | 2.00 vs 1.00 |
| 4,096 | 33,550,336 | 16,777,216 | 2.00 vs 1.00 |

Exactly a factor of two, at every size. And the measured times follow it:

| n | transpose + reverse | four-way | speedup | write ratio |
|---|---|---|---|---|
| 512 | 0.36ms | 0.16ms | **2.25x** | 2.00x |
| 1,024 | 2.37ms | 1.20ms | **1.98x** | 2.00x |
| 2,048 | 12.23ms | 9.36ms | 1.31x | 2.00x |
| 4,096 | 62.09ms | 45.49ms | 1.36x | 2.00x |

At 512 and 1,024 the speedup matches the write count almost exactly. Above that
it drops to about 1.35x — a 2,048 × 2,048 matrix of ints is 16 MB, past this
machine's last-level cache, so both versions become limited by memory bandwidth
rather than by how many writes they issue. The instruction-count advantage stops
translating once you are waiting on RAM.

## Two things that did not matter

Worth reporting because both are plausible and both were wrong.

**Layout.** A `vector<vector<int>>` allocates each row separately, so rows are
not contiguous with one another, and it is reasonable to expect a flat array to
transpose faster. Measured, the difference was **0.75x to 1.00x** — essentially
none, and the nested version was slightly *faster* at small n. The strided access
inside a transpose defeats prefetching either way.

**Blocking.** Tiling the transpose into 64 × 64 blocks is the standard fix for
cache-hostile transposes. Here it helped slightly at n = 1,024 (2.04ms against
2.75ms flat) and **hurt** at n = 4,096 (68.04ms against 62.40ms). Not worth the
complexity for this problem.

## Which to write

**Transpose plus reverse**, for almost all purposes. It is two lines of obvious
intent, it is hard to get wrong once the triangle bound is right, and the cases
where its 2x disadvantage matters are matrices large enough that you are probably
not rotating them in a single-threaded loop anyway.

Reach for the **four-way cycle** when the matrix is genuinely large and the
rotation is hot — it is measurably twice as fast at cache-resident sizes — and
accept that its index arithmetic is four expressions that all have to be right.

<!-- @intuition -->
A quarter turn moves the four corners into each other's places, and then the four cells just inside the corners, and so on inwards — the matrix is a set of nested rings, each rotating independently, and every cell has exactly three companions it trades places with. That is the four-way cycle, and it is what the rotation literally is. The transpose-and-reverse trick is a different route to the same destination: reflecting across the diagonal and then across the vertical gets you a quarter turn, the same way two mirrors at 45 degrees turn an image through 90. Two reflections make a rotation, which is also why doing them in the other order turns it the other way.

<!-- @approach -->
### Brute Force - Write Into a New Matrix

<!-- @idea -->
Allocate a second matrix and copy each cell straight to where the rotation formula says it belongs.

<!-- @steps -->
1. Allocate a new n by n matrix.
2. Walk every position of the result.
3. Fill it from the source using the rotation formula.
4. The cell at row r, column c takes the value from row n-1-c, column r.
5. Copy the result back over the original if the caller needs it modified in place.

<!-- @complexity -->
- time: O(n^2), each cell written exactly once
- space: O(n^2) for the second matrix
- note: The clearest statement of what the rotation is, and the version to write when memory is not a concern. Its write count matches the four-way cycle at one per cell, so it is not slow — measured 1.17ms at n = 1,024 against 2.51ms for transpose-plus-reverse. What disqualifies it is the allocation, not the speed.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void rotate(vector<vector<int>>& matrix) {
    int n = matrix.size();
    vector<vector<int>> result(n, vector<int>(n));

    for (int r = 0; r < n; r++)
        for (int c = 0; c < n; c++)
            result[r][c] = matrix[n - 1 - c][r];

    matrix = result;
}
```

<!-- @annotations -->
- 10: The rotation formula, stated directly. Everything else in this lesson is a way to apply it without the second matrix.
- 12: Assigning back is what makes this satisfy an in-place signature, though the allocation already happened.

<!-- @code java -->
```java
static void rotate(int[][] matrix) {
    int n = matrix.length;
    int[][] result = new int[n][n];

    for (int r = 0; r < n; r++)
        for (int c = 0; c < n; c++)
            result[r][c] = matrix[n - 1 - c][r];

    for (int r = 0; r < n; r++) matrix[r] = result[r];
}
```

<!-- @annotations -->
- 9: Replacing the row references rather than the outer array, since the caller holds a reference to matrix itself.

<!-- @code python -->
```python
def rotate(matrix):
    n = len(matrix)
    result = [[matrix[n - 1 - c][r] for c in range(n)] for r in range(n)]
    matrix[:] = result


# matrix[:] = result mutates the caller's list in place.
# matrix = result would only rebind the local name and change nothing.
```

<!-- @annotations -->
- 3: The formula as a comprehension, which is the whole algorithm on one line.
- 4: Slice assignment mutates the caller's list. A plain assignment would rebind the local name and change nothing.

<!-- @approach -->
### Transpose Then Reverse Each Row

<!-- @idea -->
Reflect the matrix across its main diagonal, then reverse every row — two reflections compose into a quarter turn.

<!-- @steps -->
1. Walk the upper triangle only, with the inner index starting one past the outer.
2. Swap each cell with its mirror across the main diagonal.
3. The matrix is now transposed.
4. Reverse each row with two pointers walking inward.
5. The result is the clockwise rotation.

<!-- @complexity -->
- time: O(n^2), but two passes — about 2.00 cell writes per cell
- space: O(1) auxiliary
- note: The version to write by default: two lines of obvious intent and no index arithmetic to get wrong beyond the triangle bound. Measured 2.00 writes per cell against the four-way cycle's 1.00, and correspondingly 2.25x slower at n = 512 and 1.98x at n = 1,024, narrowing to about 1.35x once the matrix exceeds cache.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void rotate(vector<vector<int>>& matrix) {
    int n = matrix.size();

    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)          // upper triangle ONLY
            swap(matrix[i][j], matrix[j][i]);

    for (auto& row : matrix) reverse(row.begin(), row.end());
}
```

<!-- @annotations -->
- 9: j starts at i + 1. Starting at 0 swaps every pair twice, so the transpose cancels itself out — measured 88% wrong on 3x3.
- 12: Reversing after transposing gives clockwise. Reversing first would give anticlockwise, which is a different correct answer to a different question.

<!-- @code java -->
```java
static void rotate(int[][] matrix) {
    int n = matrix.length;

    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
        }

    for (int r = 0; r < n; r++)
        for (int lo = 0, hi = n - 1; lo < hi; lo++, hi--) {
            int t = matrix[r][lo]; matrix[r][lo] = matrix[r][hi]; matrix[r][hi] = t;
        }
}
```

<!-- @annotations -->
- 5: The triangle bound written out, since Java has no swap and the loop is easy to widen by accident.
- 10: The two-pointer row reversal, the same primitive used in Left Rotate by K Places.

<!-- @code python -->
```python
def rotate(matrix):
    n = len(matrix)

    for i in range(n):
        for j in range(i + 1, n):                # upper triangle ONLY
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]

    for row in matrix:
        row.reverse()


# Transposing the full square instead of the triangle swaps every pair
# twice, which is the identity — the matrix comes back unchanged and
# only the row reversal survives, giving a mirror rather than a rotation.
```

<!-- @annotations -->
- 5: range(i + 1, n), not range(n). The full range transposes twice and cancels out.
- 8: row.reverse() mutates in place, where reversed(row) would build a new iterator and discard it.

<!-- @approach -->
### Optimal - Four-Way Cycle Swap

<!-- @idea -->
Move the matrix ring by ring, rotating four cells at a time through a single temporary, so every cell is written exactly once.

<!-- @steps -->
1. Work outward ring by ring, for as many rings as half the matrix width.
2. Within a ring, walk the top edge from the left corner to one short of the right corner.
3. Save the top cell in a temporary.
4. Move the left cell into the top, the bottom into the left, and the right into the bottom.
5. Put the saved temporary into the right.
6. Every cell in the ring is moved exactly once, and the centre cell of an odd matrix never moves.

<!-- @complexity -->
- time: O(n^2), one pass — 1.00 cell writes per cell
- space: O(1) auxiliary, a single temporary
- note: Half the writes of transpose-plus-reverse and measured 2.25x faster at n = 512 and 1.98x at n = 1,024, where the speedup matches the write ratio almost exactly. Above cache the advantage narrows to about 1.35x, since both versions become memory-bandwidth bound. Worth it when the rotation is hot; otherwise the four index expressions are four chances to be wrong.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void rotate(vector<vector<int>>& matrix) {
    int n = matrix.size();

    for (int i = 0; i < n / 2; i++) {
        for (int j = i; j < n - 1 - i; j++) {         // stop one SHORT of the corner
            int temp                   = matrix[i][j];
            matrix[i][j]               = matrix[n - 1 - j][i];
            matrix[n - 1 - j][i]       = matrix[n - 1 - i][n - 1 - j];
            matrix[n - 1 - i][n - 1 - j] = matrix[j][n - 1 - i];
            matrix[j][n - 1 - i]       = temp;
        }
    }
}
```

<!-- @annotations -->
- 8: n - 1 - i, not n - i. Running to the corner rotates it twice and measured 88% wrong on 3x3.
- 9: One temporary holds the cell about to be overwritten, and the other three moves chain from it.
- 13: The chain closes here, putting the saved value where the cycle began.

<!-- @code java -->
```java
static void rotate(int[][] matrix) {
    int n = matrix.length;

    for (int i = 0; i < n / 2; i++) {
        for (int j = i; j < n - 1 - i; j++) {
            int temp = matrix[i][j];
            matrix[i][j] = matrix[n - 1 - j][i];
            matrix[n - 1 - j][i] = matrix[n - 1 - i][n - 1 - j];
            matrix[n - 1 - i][n - 1 - j] = matrix[j][n - 1 - i];
            matrix[j][n - 1 - i] = temp;
        }
    }
}
```

<!-- @annotations -->
- 4: n / 2 rings. An odd matrix has a centre cell that belongs to no ring and correctly never moves.

<!-- @code python -->
```python
def rotate(matrix):
    n = len(matrix)

    for i in range(n // 2):
        for j in range(i, n - 1 - i):            # stop one SHORT of the corner
            (matrix[i][j],
             matrix[n - 1 - j][i],
             matrix[n - 1 - i][n - 1 - j],
             matrix[j][n - 1 - i]) = (matrix[n - 1 - j][i],
                                      matrix[n - 1 - i][n - 1 - j],
                                      matrix[j][n - 1 - i],
                                      matrix[i][j])


# Tuple assignment evaluates the whole right side first, so no temporary
# is needed and the four moves happen simultaneously.
```

<!-- @annotations -->
- 5: range(i, n - 1 - i). Ending at n - i would rotate the corner cell a second time.
- 6: Tuple assignment evaluates the entire right side before binding anything, so the four moves are simultaneous and no temporary is needed.

<!-- @approach -->
### Anticlockwise - Reverse Then Transpose

<!-- @idea -->
Perform the same two reflections in the opposite order, which turns the matrix the other way.

<!-- @steps -->
1. Reverse each row first, with two pointers walking inward.
2. Then walk the upper triangle only.
3. Swap each cell with its mirror across the main diagonal.
4. The result is the anticlockwise rotation.
5. The only difference from the clockwise version is which step comes first.

<!-- @complexity -->
- time: O(n^2), two passes
- space: O(1) auxiliary
- note: Not a variant of the clockwise algorithm but the answer to the mirror question. Measured against a clockwise reference it disagrees on 94% of 3x3 matrices, and it matches the anticlockwise reference on every input tested. Worth writing out explicitly, because reaching for it by accident is one of the easiest mistakes here.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void rotateAntiClockwise(vector<vector<int>>& matrix) {
    int n = matrix.size();

    for (auto& row : matrix) reverse(row.begin(), row.end());   // reverse FIRST

    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            swap(matrix[i][j], matrix[j][i]);
}
```

<!-- @annotations -->
- 8: The reversal comes first here. That single reordering is the entire difference between the two directions.

<!-- @code java -->
```java
static void rotateAntiClockwise(int[][] matrix) {
    int n = matrix.length;

    for (int r = 0; r < n; r++)
        for (int lo = 0, hi = n - 1; lo < hi; lo++, hi--) {
            int t = matrix[r][lo]; matrix[r][lo] = matrix[r][hi]; matrix[r][hi] = t;
        }

    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++) {
            int t = matrix[i][j]; matrix[i][j] = matrix[j][i]; matrix[j][i] = t;
        }
}
```

<!-- @annotations -->
- 4: Reversing every row before transposing, which is the clockwise version with its two steps exchanged.

<!-- @code python -->
```python
def rotate_anticlockwise(matrix):
    n = len(matrix)

    for row in matrix:
        row.reverse()                            # reverse FIRST

    for i in range(n):
        for j in range(i + 1, n):
            matrix[i][j], matrix[j][i] = matrix[j][i], matrix[i][j]


# [[1,2,3],[4,5,6],[7,8,9]] -> [[3,6,9],[2,5,8],[1,4,7]]
# The clockwise version gives  [[7,4,1],[8,5,2],[9,6,3]]
```

<!-- @annotations -->
- 4: Reversing before transposing rather than after. Two reflections still compose into a rotation, but in the opposite direction.

<!-- @example -->

<!-- @input -->
matrix = [[1,2,3],[4,5,6],[7,8,9]]

<!-- @output -->
[[7,4,1],[8,5,2],[9,6,3]]

<!-- @why -->
The canonical case, traced through both steps so the transpose and the reversal can each be checked separately.

<!-- @walkthrough -->
1. The transpose swaps across the main diagonal, so 2 and 4 exchange, 3 and 7 exchange, and 6 and 8 exchange.
2. The diagonal itself — 1, 5, 9 — never moves, which is why the inner loop starts one past the outer.
3. After transposing the matrix reads [[1,4,7],[2,5,8],[3,6,9]].
4. Now reverse each row: 1,4,7 becomes 7,4,1.
5. The second row 2,5,8 becomes 8,5,2, and the third becomes 9,6,3.
6. The result is [[7,4,1],[8,5,2],[9,6,3]].
7. Check one cell against the formula: result[0][0] should be matrix[n-1-0][0], which is matrix[2][0], which is 7.

<!-- @example -->

<!-- @input -->
matrix = [[1,2,3],[4,5,6],[7,8,9]] with the two steps in the other order

<!-- @output -->
[[3,6,9],[2,5,8],[1,4,7]] — a correct anticlockwise rotation

<!-- @why -->
Shows that the classic "bug" is not producing garbage, which is exactly why it survives a casual glance at the output.

<!-- @walkthrough -->
1. Reversing the rows first gives [[3,2,1],[6,5,4],[9,8,7]].
2. Transposing that swaps across the diagonal to give [[3,6,9],[2,5,8],[1,4,7]].
3. Compare against the clockwise answer, [[7,4,1],[8,5,2],[9,6,3]] — every cell differs.
4. But compare against the anticlockwise reference and it matches exactly.
5. Measured against a clockwise reference it disagrees on 94% of 3x3 matrices.
6. The output is a well-formed rotation, so nothing about it looks wrong on inspection.
7. Two reflections always compose into a rotation; their order decides the direction.

<!-- @example -->

<!-- @input -->
matrix = [[1,2,3],[4,5,6],[7,8,9]] with the transpose looping over the full square

<!-- @output -->
[[3,2,1],[6,5,4],[9,8,7]] — a horizontal mirror, not a rotation

<!-- @why -->
The loop bound bug, and it is worth seeing that the transpose step contributes nothing at all rather than contributing something slightly wrong.

<!-- @walkthrough -->
1. With j running the full range, the pair at (0,1) and (1,0) is swapped when i is 0 and j is 1.
2. It is swapped back when i is 1 and j is 0.
3. Every off-diagonal pair is therefore swapped exactly twice, which returns it to where it started.
4. So the transpose is the identity and the matrix is unchanged when the reversal begins.
5. Only the row reversal happens, giving [[3,2,1],[6,5,4],[9,8,7]].
6. That is identical to simply reversing every row of the input, confirming the transpose did nothing.
7. Measured wrong on 88% of 3x3 matrices, and it passes on a 1x1 matrix where there is no off-diagonal pair.

<!-- @example -->

<!-- @input -->
A 1,024 x 1,024 matrix, transpose-plus-reverse against the four-way cycle

<!-- @output -->
2.37ms against 1.20ms — 1.98x, matching the 2.00x ratio in cell writes

<!-- @why -->
Ties the measured speed difference to a countable quantity rather than leaving it as an unexplained constant factor.

<!-- @walkthrough -->
1. Transpose-plus-reverse writes 2,096,128 cells: the transpose writes two per swap, then the reversal rewrites every cell.
2. The four-way cycle writes 1,048,576 cells, exactly one per cell of the matrix.
3. That ratio is exactly 2.00, and it holds at every size tested.
4. The measured speedup at n = 512 was 2.25x and at n = 1,024 it was 1.98x — the write ratio, near enough.
5. At n = 2,048 the speedup dropped to 1.31x and at n = 4,096 to 1.36x.
6. A 2,048 x 2,048 int matrix is 16 MB, past this machine's last-level cache.
7. Beyond that point both versions wait on memory bandwidth, so issuing half as many writes stops helping proportionally.

<!-- @visualization matrix -->

<!-- @description -->
A grid with every cell carrying a distinct value and, more usefully, a distinct hue assigned by its ORIGINAL position — colour is what makes a rotation legible, since a grid of numbers turning through 90 degrees is nearly impossible to follow by reading. Open with the destination question rather than the mechanism: pick one cell, draw a curved arrow from it to where it must end up, and show the formula result[r][c] = matrix[n-1-c][r] resolving for that specific pair of indices. Repeat for a corner and for a diagonal cell so the reader sees the rule is uniform. Then the two-step route, staged as two distinct reflections with a pause between: for the transpose, draw the main diagonal as a mirror line and animate each upper-triangle cell arcing across it and swapping with its partner, leaving the diagonal cells visibly stationary — that stationarity is why the inner loop starts one past the outer, and it should be seen before it is stated. Then the second reflection: a vertical mirror line down the middle, with each row's cells swapping inward pairwise. The colours land in rotated order and the quarter turn is unmistakable. Beside it, run the reverse-then-transpose order on an identical grid simultaneously, so both animations play at once and diverge from the very first frame — ending with the two results side by side, one turned clockwise and one anticlockwise, captioned so it is clear neither is broken. A third panel handles the loop bound: run the transpose with j over the full square and show each pair swapping across the diagonal and then swapping straight back, drawing the second swap as the first one played in reverse; the grid visibly returns to its starting state, and the caption notes the transpose contributed nothing. For the four-way cycle, redraw the matrix as concentric rings in alternating shades, then animate one ring at a time: four cells lift, rotate a quarter turn about the centre together, and set down, with a counter showing each cell touched exactly once. Contrast that against a replay of transpose-plus-reverse where each cell lights up twice, and put the two counters side by side — 1,048,576 against 2,096,128 at n = 1,024. Close with a chart of speedup against n showing it tracking the 2.00x write ratio at 512 and 1,024, then falling to about 1.35x at 2,048 and 4,096, with a marked line where the matrix passes 16 MB and leaves cache.

<!-- @sampleInput -->
```json
{"primary":{"input":[[1,2,3],[4,5,6],[7,8,9]],"formula":"result[r][c] = matrix[n-1-c][r]","sampleMappings":[{"to":[0,0],"from":[2,0],"value":7},{"to":[0,2],"from":[0,0],"value":1},{"to":[1,1],"from":[1,1],"value":5}],"afterTranspose":[[1,4,7],[2,5,8],[3,6,9]],"diagonalFixed":[1,5,9],"afterReverse":[[7,4,1],[8,5,2],[9,6,3]]},"orderPanel":{"clockwise":{"steps":["transpose","reverse rows"],"result":[[7,4,1],[8,5,2],[9,6,3]]},"anticlockwise":{"steps":["reverse rows","transpose"],"result":[[3,6,9],[2,5,8],[1,4,7]]},"disagreementVsClockwise":0.94,"bothAreValidRotations":true},"boundPanel":{"correctBound":"j from i+1 to n-1","buggyBound":"j from 0 to n-1","effect":"every pair swapped twice = identity","afterBuggyTranspose":[[1,2,3],[4,5,6],[7,8,9]],"finalResult":[[3,2,1],[6,5,4],[9,8,7]],"sameAsJustReversingRows":true,"failureRate3x3":0.88,"passesAt1x1":true},"cyclePanel":{"rings":2,"ringForN":"n/2","centreCellMoves":false,"writesPerCell":{"fourWay":1.0,"transposeReverse":2.0},"writeCounts":[{"n":512,"transposeReverse":523776,"fourWay":262144},{"n":1024,"transposeReverse":2096128,"fourWay":1048576},{"n":4096,"transposeReverse":33550336,"fourWay":16777216}]},"speedPanel":{"rows":[{"n":512,"transposeReverseMs":0.36,"fourWayMs":0.16,"speedup":2.25},{"n":1024,"transposeReverseMs":2.37,"fourWayMs":1.20,"speedup":1.98},{"n":2048,"transposeReverseMs":12.23,"fourWayMs":9.36,"speedup":1.31},{"n":4096,"transposeReverseMs":62.09,"fourWayMs":45.49,"speedup":1.36}],"writeRatio":2.0,"cacheBoundaryMB":16,"note":"speedup tracks the write ratio until the matrix leaves cache"},"nonFindings":{"layoutFlatVsNested":"0.75x to 1.00x - no real difference","blockedTranspose":"helped at n=1024, hurt at n=4096"}}
```

<!-- @highlights -->
- Every cell carries a distinct hue assigned by its ORIGINAL position, because a grid of numbers turning through 90 degrees cannot be followed by reading.
- The opening frame asks where one cell must end up, drawing a curved arrow and resolving result[r][c] = matrix[n-1-c][r] for that index pair.
- The same rule is shown for a corner and for a diagonal cell, so its uniformity is visible rather than asserted.
- The main diagonal is drawn as a mirror line and upper-triangle cells arc across it to swap with their partners.
- The diagonal cells 1, 5 and 9 stay visibly stationary — seen before it is stated as the reason the inner loop starts at i+1.
- A vertical mirror line then runs down the middle and each row's cells swap inward pairwise.
- The hues land in rotated order and the quarter turn is unmistakable.
- An identical grid runs reverse-then-transpose simultaneously, diverging from the very first frame.
- Both finish as well-formed rotations, one clockwise and one anticlockwise, captioned so it is clear neither is broken.
- A third panel runs the transpose over the full square, showing each pair swap across the diagonal and then swap straight back.
- The grid visibly returns to its starting state, so the transpose is seen contributing nothing at all.
- Only the row reversal survives, producing a horizontal mirror that is identical to simply reversing the rows.
- The matrix is then redrawn as concentric rings, and four cells lift, turn a quarter about the centre together, and set down.
- A counter shows each cell touched exactly once, against a replay of transpose-plus-reverse where each cell lights twice.
- The two write counters sit side by side: 1,048,576 against 2,096,128 at n = 1,024.
- A final chart shows the speedup tracking the 2.00x write ratio at 512 and 1,024, then falling to about 1.35x once the matrix passes 16 MB and leaves cache.

<!-- @edgeCases -->
- Empty matrix — nothing to rotate, and the size lookup must not assume a first row exists.
- 1x1 matrix — the single cell stays put, and every buggy variant in this lesson passes here.
- 2x2 matrix — one ring, one four-way cycle, and the smallest case where the loop bounds can be wrong.
- 3x3 matrix — one ring plus a centre cell that must not move, which catches a ring count of n/2 rounded the wrong way.
- Odd n generally — the exact centre belongs to no ring and is correctly never written.
- Even n generally — every cell belongs to a ring, so the four-way cycle writes all n squared of them.
- All cells identical — every approach returns the matrix unchanged, so this input cannot distinguish correct code from any of the bugs.
- A matrix that is already symmetric about the diagonal — the transpose step does nothing, hiding a wrong triangle bound.
- A matrix with distinct values in every cell — the only kind of input that reliably exposes all three bugs here.
- Rotating four times — must return the original matrix exactly, which is a strong self-check requiring no reference implementation.
- Non-square input — the in-place approaches are undefined for it, since the result has different dimensions.
- Large n where the matrix exceeds cache — correctness is unaffected but the four-way cycle's advantage shrinks from 2x to about 1.35x.

<!-- @pitfalls -->
- Looping the transpose over the full square instead of the upper triangle. Every pair is swapped twice, the transpose becomes the identity, and only the row reversal survives — measured 88% wrong on 3x3.
- Reversing the rows before transposing. That is a correct anticlockwise rotation, not a broken clockwise one, which is why the output looks entirely reasonable — measured 94% disagreement with a clockwise reference on 3x3.
- Running the four-way inner loop to n - i rather than n - 1 - i. The corner cell is rotated a second time — measured 88% wrong on 3x3.
- Testing on a 1x1 matrix. All three bugs above pass it, since there are no off-diagonal pairs and no ring to walk.
- Testing on a symmetric matrix. The transpose step does nothing on such input, so a wrong triangle bound is invisible.
- Testing with repeated values. Distinct values in every cell are what make a misplaced cell detectable at all.
- Writing `matrix = result` in Python. That rebinds the local name and leaves the caller's list untouched; slice assignment is needed.
- Reassigning the outer array in Java rather than its rows. The caller holds a reference to the array itself, so replacing it locally changes nothing.
- Assuming the four-way cycle is always worth it. It is 2x faster at cache-resident sizes and about 1.35x once the matrix exceeds cache, against four index expressions that all have to be right.
- Reaching for a blocked transpose. Measured, it helped slightly at n = 1,024 and hurt at n = 4,096.
- Assuming a flat array beats a vector of vectors here. Measured 0.75x to 1.00x — no real difference, since the strided access defeats prefetching either way.
- Applying an in-place approach to a non-square matrix. The rotation of an m x n matrix is n x m, so it cannot be done in the original storage.

<!-- @doubt -->
### Why does the transpose loop start at i + 1 instead of 0?

<!-- @answer -->
Because a transpose swaps each off-diagonal pair once, and looping the full square visits every pair twice — once as (i,j) and once as (j,i). The second swap undoes the first, so the transpose becomes the identity and the matrix is unchanged by the time the row reversal starts. The result is that only the reversal happens, giving a horizontal mirror rather than a rotation: [[1,2,3],[4,5,6],[7,8,9]] comes out as [[3,2,1],[6,5,4],[9,8,7]], which is exactly what you get from reversing the rows and not transposing at all. Measured wrong on 88% of 3x3 matrices, and it passes on a 1x1 matrix where no off-diagonal pair exists.

<!-- @doubt -->
### I reversed the rows first and got a rotation, just the wrong way. Is that a bug?

<!-- @answer -->
It is a correct algorithm for a different question. Reverse-then-transpose is the anticlockwise rotation, and it matches an anticlockwise reference on every input tested. Measured against a clockwise reference it disagrees on 94% of 3x3 matrices, but nothing about the output looks malformed — it is a proper quarter turn, just the other way. That is what makes it hard to spot. Two reflections always compose into a rotation and their order decides the direction: transpose then reverse gives clockwise, reverse then transpose gives anticlockwise.

<!-- @doubt -->
### Why is the four-way cycle faster if both are O(n^2)?

<!-- @answer -->
Because it writes half as many cells. Transpose-plus-reverse touches every cell twice — once during the transpose and once during the reversal — while the four-way cycle moves each cell exactly once, straight to its final position. Counted at n = 1,024 that is 2,096,128 writes against 1,048,576, a ratio of exactly 2.00, and the same ratio holds at every size. The measured speedup follows it closely at cache-resident sizes: 2.25x at n = 512 and 1.98x at n = 1,024.

<!-- @doubt -->
### Then why does the speedup drop at larger sizes?

<!-- @answer -->
Because the bottleneck changes. At n = 2,048 the matrix is 16 MB of ints, past this machine's last-level cache, so both versions spend most of their time waiting on memory rather than issuing instructions. Halving the write count stops helping proportionally once the writes are not the limiting factor. Measured, the speedup fell from 1.98x at n = 1,024 to 1.31x at n = 2,048 and 1.36x at n = 4,096, while the write ratio stayed at exactly 2.00 throughout. The instruction advantage is still there; it just no longer translates.

<!-- @doubt -->
### Which version should I actually write?

<!-- @answer -->
Transpose plus reverse, for almost everything. It is two lines of obvious intent, the only thing to get wrong is the triangle bound, and both steps are independently checkable. Take the four-way cycle when the matrix is large and the rotation is genuinely hot, where it is measurably about twice as fast at cache-resident sizes — but note it has four index expressions that all have to be right, and its classic off-by-one measured 88% wrong. Speed you do not need is not worth four chances to be subtly incorrect.

<!-- @doubt -->
### Would a flat array or a blocked transpose be faster?

<!-- @answer -->
Neither, measurably. A vector of vectors allocates each row separately so rows are not contiguous, and it is reasonable to expect a flat array to transpose faster — measured, the difference was 0.75x to 1.00x, essentially none, with the nested version slightly ahead at small n. The strided access inherent to a transpose defeats prefetching either way. Blocking the transpose into 64 x 64 tiles is the standard fix for cache-hostile transposes, and here it helped a little at n = 1,024 and actually hurt at n = 4,096. Both are worth knowing about and neither is worth writing for this problem.

<!-- @doubt -->
### How do I test this without writing a reference implementation?

<!-- @answer -->
Rotate four times and check you get the original matrix back. That catches any approach that is not a genuine quarter turn, needs no reference, and is a strong test. Add one more: use a matrix with a distinct value in every cell. Repeated values let a misplaced cell go unnoticed, and a symmetric matrix hides a wrong transpose bound entirely because the transpose step does nothing on it. Never test only on 1x1 — every bug in this lesson passes there.

<!-- @doubt -->
### Can I rotate a non-square matrix in place?

<!-- @answer -->
No. Rotating an m x n matrix produces an n x m one, so the result does not fit the original storage unless m equals n. The transpose step alone already breaks: swapping matrix[i][j] with matrix[j][i] reads out of bounds as soon as the indices exceed the shorter dimension. For a non-square rotation you have to allocate the result, which is the brute-force approach in this lesson with the loop bounds adjusted to the new shape.
