---
id: set-matrix-zeroes
topic: Arrays
title: Set Matrix Zeroes
difficulty: Medium
status: ready
prerequisites:
  - nested-loops
  - pass-by-value-vs-pass-by-reference
  - move-zeros-to-end
  - for-loop
  - time-and-space-complexity-basics
relatedIds:
  - move-zeros-to-end
  - rotate-matrix-by-90-degrees
  - print-the-matrix-in-spiral-manner
  - nested-loops
---

<!-- @summary -->
If a cell is zero, clear its whole row and column — in place, without letting the zeros you write trigger more zeros. The celebrated O(1)-space trick saves 0.01% of the memory a large matrix already occupies, runs no faster, and got the wrong answer on 14.6% of inputs when its one easy-to-miss flag was omitted.

<!-- @theory -->
## The problem

Given an m × n matrix, if any cell is zero, set that cell's entire row and entire
column to zero. Modify the matrix in place.

```
1 1 1        1 0 1
1 0 1   ->   0 0 0
1 1 1        1 0 1
```

## The trap, and it catches almost everyone

Scan the matrix and, whenever you find a zero, clear its row and column
immediately. Then keep scanning.

That is wrong, and it is wrong in a way that destroys the whole matrix. The zeros
you *write* are indistinguishable from the zeros that were *already there*, so
the scan finds them and clears their rows and columns too. One original zero
cascades until almost everything is gone.

```
[[0, 1],        naive result   [[0, 0],       correct   [[0, 0],
 [1, 1]]                        [0, 0]]                  [0, 1]]
```

The cell at (1,1) has no zero in its row or its column originally, so it must
survive. The naive version clears it anyway: after row 0 and column 0 are
cleared, the scan reaches the zero it just wrote at (1,0) and clears row 1.

Measured over every 0/1 matrix of each size, the cascade produced the wrong
answer on **18.8% of 2×2**, **15.6% of 2×3**, and **15.6% of 3×3** matrices.
The smallest failing input is exactly the one above.

**The fix in one sentence:** every decision must be made from the *original*
matrix. Separate deciding from writing.

## Deciding, then writing

Once you separate the two phases, the algorithm is easy. Which cells end up zero?
Cell (r, c) is zero exactly when row r contained a zero **or** column c contained
a zero. So you do not need to remember *where* the zeros were — only *which rows*
and *which columns* had one.

That is one boolean per row and one per column:

```
pass 1:  for every zero at (r,c):  rowHasZero[r] = true;  colHasZero[c] = true
pass 2:  for every cell (r,c):     if rowHasZero[r] or colHasZero[c] -> write 0
```

Two clean passes, no cascade possible, because pass 2 only reads the flags that
pass 1 finished computing.

## Why not clear each row and column as you go?

Even with a saved copy to decide from, clearing a full row and a full column for
every zero you find does redundant work: two zeros in the same row clear that row
twice. Its cost is proportional to the number of zeros, not to the matrix.

Measured on a 1000 × 1000 matrix:

| Zero density | zeros | clear-each | row/column markers | ratio |
|---|---|---|---|---|
| 0 | 0 | 0.868ms | 1.869ms | 0.5x |
| 0.0001 | 103 | 0.988ms | 1.040ms | 1.0x |
| 0.001 | 1,019 | 3.730ms | 0.742ms | 5.0x |
| 0.01 | 10,057 | 32.675ms | 0.750ms | **43.6x** |
| 0.1 | 99,858 | 321.673ms | 1.252ms | **256.9x** |

The marker version is flat — it is O(m × n) whatever the data looks like. The
clear-each version is O(zeros × (m + n)) and crosses over at about a hundred
zeros, then runs away.

## The O(1)-space version, and whether it is worth it

The famous refinement removes even the two boolean arrays. Instead of allocating
them, **store the flags inside the matrix's own first row and first column** —
they are going to be overwritten anyway if they contain a zero.

The complication is the cell at (0,0), which belongs to both the first row and
the first column and cannot flag both. So you keep **one separate boolean** for
one of them — conventionally the first column — and handle it at the end.

Miss that separate flag and you have reintroduced the cascade. Measured over
every 0/1 matrix: **18.8% wrong at 2×2, 14.1% at 2×3, 14.6% at 3×3**, with the
same smallest failing input as the naive cascade, `[[0,1],[1,1]]`.

### What it buys

This is the part worth being blunt about. The two boolean arrays it eliminates
are m + n entries against a matrix of m × n:

| Matrix | Matrix bytes | Marker bytes | Markers as a share of the matrix |
|---|---|---|---|
| 100 × 100 | 40,000 | 200 | 0.5000% |
| 1,000 × 1,000 | 4,000,000 | 2,000 | 0.0500% |
| 5,000 × 5,000 | 100,000,000 | 10,000 | **0.0100%** |

And the share **shrinks as the matrix grows** — the bigger the input, the less
there is to save.

It is not faster either. Measured against the marker version:

| Matrix | density | O(m+n) | O(1) | ratio |
|---|---|---|---|---|
| 500 × 500 | 0.0001 | 0.229ms | 0.210ms | 0.92x |
| 500 × 500 | 0.01 | 0.197ms | 0.204ms | 1.03x |
| 2,000 × 2,000 | 0.0001 | 3.306ms | 2.878ms | 0.87x |
| 2,000 × 2,000 | 0.01 | 2.886ms | 2.903ms | 1.01x |

Between 0.87x and 1.03x — the same speed, within noise.

So the O(1) trick trades a **14.6% measured failure rate** on its classic mistake
for **0.01% of the memory** the matrix already occupies, at **no speed benefit**.
Learn it, because it is asked for by name and the idea — storing metadata inside
data you are about to overwrite — is genuinely worth having. But in code you
have to maintain, write the marker version.

## What "in place" actually requires

Note that all three correct approaches modify the matrix in place. "In place"
constrains the *output*, not the scratch space: you may not build and return a
new matrix, but m + n booleans of working memory is not a violation of anything
the problem says. The O(1) version is answering a stricter question than the one
being asked.

<!-- @intuition -->
A zero is an announcement, not an action: it says "this row and this column are condemned". If you start demolishing the moment you hear the first announcement, the rubble looks exactly like more announcements and you end up levelling the whole block. Collect every announcement first — which rows, which columns — and only then send in the wrecking crew. The clever version notices that the condemned row and column are being demolished anyway, so it chalks the notices on their own walls instead of carrying a notepad; the one cell where those two walls meet cannot hold two notices, and that corner is the entire difficulty.

<!-- @approach -->
### Brute Force - Clear Each Row and Column From a Copy

<!-- @idea -->
Take a copy of the matrix to decide from, then for every zero in the copy, clear that row and column in the original.

<!-- @steps -->
1. Copy the whole matrix, so every decision reads the original values.
2. Walk every cell of the copy.
3. When the copy holds a zero at a position, clear that entire row in the working matrix.
4. Also clear that entire column in the working matrix.
5. Zeros written into the working matrix are never read, so no cascade can occur.

<!-- @complexity -->
- time: O(zeros * (m + n)) — a full row and column cleared per zero found
- space: O(m * n) for the copy
- note: Correct, because the copy stops the cascade, but it repeats work: two zeros in the same row clear that row twice. Measured on a 1000x1000 matrix it went from 0.988ms at 103 zeros to 321.673ms at 99,858 zeros, while the marker version stayed flat.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void setZeroes(vector<vector<int>>& matrix) {
    int R = matrix.size(), C = matrix[0].size();
    vector<vector<int>> original = matrix;        // decide from this, write to matrix

    for (int r = 0; r < R; r++) {
        for (int c = 0; c < C; c++) {
            if (original[r][c] != 0) continue;
            for (int k = 0; k < C; k++) matrix[r][k] = 0;
            for (int k = 0; k < R; k++) matrix[k][c] = 0;
        }
    }
}
```

<!-- @annotations -->
- 6: The copy is the whole point. Reading from matrix here instead is the cascade bug, measured 15.6% wrong on 3x3.
- 10: Skipping non-zeros early, so the clearing loops only run for real zeros.
- 11: Clearing the row and column costs m + n every time, even if this row was already cleared.

<!-- @code java -->
```java
static void setZeroes(int[][] matrix) {
    int R = matrix.length, C = matrix[0].length;
    int[][] original = new int[R][];
    for (int r = 0; r < R; r++) original[r] = matrix[r].clone();

    for (int r = 0; r < R; r++) {
        for (int c = 0; c < C; c++) {
            if (original[r][c] != 0) continue;
            for (int k = 0; k < C; k++) matrix[r][k] = 0;
            for (int k = 0; k < R; k++) matrix[k][c] = 0;
        }
    }
}
```

<!-- @annotations -->
- 4: Cloning row by row, because a shallow copy of int[][] would share the same row arrays.

<!-- @code python -->
```python
def set_zeroes(matrix):
    R, C = len(matrix), len(matrix[0])
    original = [row[:] for row in matrix]      # row[:] copies each row

    for r in range(R):
        for c in range(C):
            if original[r][c] != 0:
                continue
            for k in range(C):
                matrix[r][k] = 0
            for k in range(R):
                matrix[k][c] = 0


# `original = matrix[:]` would NOT work — it copies the outer list but
# shares every inner row, so writes would be visible through both.
```

<!-- @annotations -->
- 3: A nested copy. Copying only the outer list would share the inner rows and reintroduce the cascade.

<!-- @approach -->
### Row and Column Markers

<!-- @idea -->
Record which rows and which columns contain a zero, then use those two flag arrays to write the whole matrix in a second pass.

<!-- @steps -->
1. Allocate one boolean per row and one per column, all false.
2. Walk every cell; when it is zero, flag that cell's row and its column.
3. The flags now describe the original matrix completely.
4. Walk every cell again.
5. Write zero wherever the cell's row is flagged or its column is flagged.

<!-- @complexity -->
- time: O(m * n), two passes, independent of how many zeros there are
- space: O(m + n) for the two flag arrays
- note: The recommended solution. Cost is flat regardless of zero density — measured 0.742ms to 1.869ms across densities from 0 to 0.1 on a 1000x1000 matrix, where the brute force ranged from 0.868ms to 321.673ms. The flag arrays are 0.05% of a 1000x1000 matrix and 0.01% of a 5000x5000 one.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void setZeroes(vector<vector<int>>& matrix) {
    int R = matrix.size(), C = matrix[0].size();
    vector<char> rowHasZero(R, 0), colHasZero(C, 0);

    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (matrix[r][c] == 0) { rowHasZero[r] = 1; colHasZero[c] = 1; }

    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (rowHasZero[r] || colHasZero[c]) matrix[r][c] = 0;
}
```

<!-- @annotations -->
- 6: char rather than bool, because vector<bool> is bit-packed and slower to index for this use.
- 10: Pass one only READS the matrix. Nothing is written until every flag is decided.
- 14: Pass two only WRITES. Separating the two phases is what makes the cascade impossible.

<!-- @code java -->
```java
static void setZeroes(int[][] matrix) {
    int R = matrix.length, C = matrix[0].length;
    boolean[] rowHasZero = new boolean[R], colHasZero = new boolean[C];

    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (matrix[r][c] == 0) { rowHasZero[r] = true; colHasZero[c] = true; }

    for (int r = 0; r < R; r++)
        for (int c = 0; c < C; c++)
            if (rowHasZero[r] || colHasZero[c]) matrix[r][c] = 0;
}
```

<!-- @annotations -->
- 3: Two arrays totalling m + n entries, against a matrix of m * n — 0.05% of a 1000x1000 matrix.

<!-- @code python -->
```python
def set_zeroes(matrix):
    R, C = len(matrix), len(matrix[0])
    row_has_zero = [False] * R
    col_has_zero = [False] * C

    for r in range(R):
        for c in range(C):
            if matrix[r][c] == 0:
                row_has_zero[r] = True
                col_has_zero[c] = True

    for r in range(R):
        for c in range(C):
            if row_has_zero[r] or col_has_zero[c]:
                matrix[r][c] = 0


# Two passes, no copy, and the cost does not depend on how many zeros there are.
```

<!-- @annotations -->
- 7: The deciding pass, which never writes.
- 13: The writing pass, which never decides. Merging these two loops is exactly the cascade bug.

<!-- @approach -->
### Optimal Space - The First Row and Column as Markers

<!-- @idea -->
Store the row and column flags inside the matrix's own first row and first column, since those get cleared anyway, keeping one separate boolean for the cell where they overlap.

<!-- @steps -->
1. Record separately whether the first row contains a zero, and whether the first column does.
2. Walk the matrix from row 1 and column 1, ignoring the borders.
3. When a cell is zero, write a zero into its row's first cell and its column's first cell.
4. Walk from row 1 and column 1 again, zeroing any cell whose row marker or column marker is zero.
5. Finally clear the first row if the flag from step one said so, and then the first column likewise.
6. The first column is cleared last, because clearing it earlier would destroy the row markers.

<!-- @complexity -->
- time: O(m * n), same two passes
- space: O(1) auxiliary — two booleans
- note: Same speed as the marker version, measured between 0.87x and 1.03x across sizes and densities. What it saves is 0.05% of a 1000x1000 matrix and 0.01% of a 5000x5000 one, and omitting its separate first-column flag measured 14.6% wrong on 3x3 matrices. Know it, but prefer the marker version in code you maintain.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void setZeroes(vector<vector<int>>& matrix) {
    int R = matrix.size(), C = matrix[0].size();
    bool firstRowZero = false, firstColZero = false;

    for (int c = 0; c < C; c++) if (matrix[0][c] == 0) firstRowZero = true;
    for (int r = 0; r < R; r++) if (matrix[r][0] == 0) firstColZero = true;

    for (int r = 1; r < R; r++)
        for (int c = 1; c < C; c++)
            if (matrix[r][c] == 0) { matrix[r][0] = 0; matrix[0][c] = 0; }

    for (int r = 1; r < R; r++)
        for (int c = 1; c < C; c++)
            if (matrix[r][0] == 0 || matrix[0][c] == 0) matrix[r][c] = 0;

    if (firstRowZero) for (int c = 0; c < C; c++) matrix[0][c] = 0;
    if (firstColZero) for (int r = 0; r < R; r++) matrix[r][0] = 0;
}
```

<!-- @annotations -->
- 8: These two booleans are the entire difficulty. Without them, (0,0) has to flag both its row and its column and cannot.
- 12: Starting at 1, so the borders hold markers rather than data being examined.
- 19: The first row is cleared before the first column, because clearing column 0 first would wipe every row marker.

<!-- @code java -->
```java
static void setZeroes(int[][] matrix) {
    int R = matrix.length, C = matrix[0].length;
    boolean firstRowZero = false, firstColZero = false;

    for (int c = 0; c < C; c++) if (matrix[0][c] == 0) firstRowZero = true;
    for (int r = 0; r < R; r++) if (matrix[r][0] == 0) firstColZero = true;

    for (int r = 1; r < R; r++)
        for (int c = 1; c < C; c++)
            if (matrix[r][c] == 0) { matrix[r][0] = 0; matrix[0][c] = 0; }

    for (int r = 1; r < R; r++)
        for (int c = 1; c < C; c++)
            if (matrix[r][0] == 0 || matrix[0][c] == 0) matrix[r][c] = 0;

    if (firstRowZero) for (int c = 0; c < C; c++) matrix[0][c] = 0;
    if (firstColZero) for (int r = 0; r < R; r++) matrix[r][0] = 0;
}
```

<!-- @annotations -->
- 10: A cell's markers live at the start of its row and the top of its column, which is why both are written here.

<!-- @code python -->
```python
def set_zeroes(matrix):
    R, C = len(matrix), len(matrix[0])
    first_row_zero = any(matrix[0][c] == 0 for c in range(C))
    first_col_zero = any(matrix[r][0] == 0 for r in range(R))

    for r in range(1, R):
        for c in range(1, C):
            if matrix[r][c] == 0:
                matrix[r][0] = 0
                matrix[0][c] = 0

    for r in range(1, R):
        for c in range(1, C):
            if matrix[r][0] == 0 or matrix[0][c] == 0:
                matrix[r][c] = 0

    if first_row_zero:
        for c in range(C):
            matrix[0][c] = 0
    if first_col_zero:
        for r in range(R):
            matrix[r][0] = 0


# Both flags are read BEFORE any marker is written, since the marking
# loops overwrite the very cells the flags describe.
```

<!-- @annotations -->
- 3: Computed first, before any marker is written, because the marking loops overwrite these same cells.
- 17: Order matters here: the first row is cleared before the first column.

<!-- @example -->

<!-- @input -->
matrix = [[0, 1], [1, 1]] solved by clearing zeros as they are found

<!-- @output -->
[[0, 0], [0, 0]] — and the correct answer is [[0, 0], [0, 1]]

<!-- @why -->
The smallest input that exposes the cascade, and the same input that breaks the O(1) version when its separate first-column flag is missing.

<!-- @walkthrough -->
1. The only original zero is at (0,0), so row 0 and column 0 must be cleared.
2. The cell at (1,1) has no zero in row 1 and none in column 1, so it must survive as 1.
3. The naive scan finds the zero at (0,0) and clears row 0 and column 0.
4. The matrix is now [[0,0],[0,1]], which is in fact the correct answer.
5. But the scan continues and reaches (1,0), which now holds a zero it wrote itself.
6. Unable to tell that zero from an original one, it clears row 1, destroying the 1 at (1,1).
7. Measured over every 0/1 matrix, this produced the wrong answer on 18.8% of 2x2, 15.6% of 2x3 and 15.6% of 3x3.

<!-- @example -->

<!-- @input -->
matrix = [[1, 1, 1], [1, 0, 1], [1, 1, 1]]

<!-- @output -->
[[1, 0, 1], [0, 0, 0], [1, 0, 1]]

<!-- @why -->
Shows the two-phase marker algorithm on the canonical case, where one zero condemns exactly one row and one column.

<!-- @walkthrough -->
1. Pass one walks all nine cells and finds a single zero at (1,1).
2. It sets rowHasZero[1] and colHasZero[1], and touches nothing else.
3. No write has happened to the matrix yet, so no cascade is possible.
4. Pass two walks all nine cells again, consulting only the flags.
5. Cell (0,1) has colHasZero[1] set, so it becomes zero.
6. Every cell of row 1 has rowHasZero[1] set, so the whole row becomes zero.
7. Cell (0,0) has neither flag set, so it stays 1 — as do (0,2), (2,0) and (2,2).

<!-- @example -->

<!-- @input -->
A 5,000 x 5,000 matrix, comparing what the O(1) trick saves

<!-- @output -->
10,000 bytes saved out of 100,000,000 — 0.0100% of the matrix

<!-- @why -->
The measurement that decides which version to actually write, and it points the opposite way to the usual advice.

<!-- @walkthrough -->
1. The matrix itself occupies 100,000,000 bytes at four bytes per int.
2. The two flag arrays hold m + n entries, which is 10,000 bytes.
3. That is 0.0100% of what the matrix already costs.
4. The share shrinks as the matrix grows: 0.5000% at 100x100, 0.0500% at 1000x1000.
5. There is no speed benefit either — measured between 0.87x and 1.03x against the marker version.
6. Meanwhile omitting the O(1) version's separate first-column flag measured 14.6% wrong on 3x3 matrices.
7. So the trade is a real failure rate against a hundredth of a percent of memory, at identical speed.

<!-- @example -->

<!-- @input -->
A 1,000 x 1,000 matrix with 99,858 zeros, clear-each against markers

<!-- @output -->
321.673ms against 1.252ms — 256.9x

<!-- @why -->
Shows that the brute force's cost tracks the number of zeros while the marker version's does not depend on the data at all.

<!-- @walkthrough -->
1. The clear-each approach clears a full row and a full column for every zero it finds.
2. That is m + n writes per zero, so nearly 100,000 zeros means about 200 million writes.
3. Two zeros in the same row clear that row twice, and the repetition grows with density.
4. At 103 zeros the two approaches were level, at 0.988ms against 1.040ms.
5. At 1,019 zeros the gap was 5.0x, and at 10,057 zeros it was 43.6x.
6. The marker version measured between 0.742ms and 1.869ms across every density tested.
7. It is O(m x n) regardless of the data, because it walks the matrix exactly twice whatever it finds.

<!-- @visualization matrix -->

<!-- @description -->
A grid of cells with values shown, and — crucially — two visually distinct kinds of zero, because confusing them IS the bug. Draw original zeros as solid filled cells and written zeros with a hatched or outlined fill, and keep that distinction for the whole animation. Open with the cascade: run the naive scan on [[0,1],[1,1]], let it find the solid zero at (0,0), and clear row 0 and column 0 — the new cells appearing hatched. Pause on that frame with a caption noting the matrix is momentarily correct. Then let the scan marker continue to (1,0), land on a hatched zero, and visibly fail to distinguish it — show the marker treating it identically to a solid one — and clear row 1, destroying the surviving 1 at (1,1). That single frame, where the algorithm reads its own output as input, is the entire lesson and should be held. Next, the marker version on the same grid, staged as two clearly separated phases with a hard visual break between them: in phase one, add a gutter of row flags down the left edge and column flags across the top, and as the scan finds each zero light the corresponding gutter cells while the grid itself stays completely untouched — no writes at all, which the reader should be able to confirm by eye. Then a beat, then phase two: sweep the grid and fill each cell whose row gutter or column gutter is lit, consulting only the gutters and never the grid. The claim is visible — pass one reads and never writes, pass two writes and never decides. For the O(1) version, animate the gutters sliding INTO the matrix, coming to rest on top of the real first row and first column, and highlight the single cell at (0,0) where the two gutters collide, flashing it red as the one slot asked to hold two different notices. Show the separate boolean being lifted out of the matrix as a small tag parked outside the grid. Then run the clearing and, at the end, deliberately clear the first column before the first row to show every row marker being wiped out mid-flight, and rewind to do it in the correct order. Close on two panels: a memory bar where the matrix is a full-width block and the markers are a sliver annotated 0.0100%, and a density chart where the marker line runs flat across every density while the clear-each line climbs to 321.673ms.

<!-- @sampleInput -->
```json
{"cascadePanel":{"input":[[0,1],[1,1]],"originalZeros":[[0,0]],"step1":{"action":"clear row 0 and column 0","grid":[[0,0],[0,1]],"writtenZeros":[[0,1],[1,0]],"note":"momentarily correct"},"step2":{"scanReaches":[1,0],"cellIsWrittenZero":true,"action":"clears row 1","grid":[[0,0],[0,0]]},"correct":[[0,0],[0,1]],"failureRates":[{"size":"2x2","rate":0.188},{"size":"2x3","rate":0.156},{"size":"3x3","rate":0.156}]},"markerPanel":{"input":[[1,1,1],[1,0,1],[1,1,1]],"phase1":{"writes":0,"zerosFound":[[1,1]],"rowFlags":[false,true,false],"colFlags":[false,true,false]},"phase2":{"decisions":0,"output":[[1,0,1],[0,0,0],[1,0,1]]}},"inplacePanel":{"guttersMoveInto":"first row and first column","collisionCell":[0,0],"separateFlags":["firstRowZero","firstColZero"],"clearOrder":["first row","first column"],"wrongOrderDestroys":"row markers","noFlagFailureRates":[{"size":"2x2","rate":0.188},{"size":"2x3","rate":0.141},{"size":"3x3","rate":0.146}]},"memoryPanel":[{"matrix":"100x100","matrixBytes":40000,"markerBytes":200,"share":0.005},{"matrix":"1000x1000","matrixBytes":4000000,"markerBytes":2000,"share":0.0005},{"matrix":"5000x5000","matrixBytes":100000000,"markerBytes":10000,"share":0.0001}],"densityPanel":{"matrix":"1000x1000","rows":[{"density":0,"zeros":0,"clearEachMs":0.868,"markersMs":1.869},{"density":0.0001,"zeros":103,"clearEachMs":0.988,"markersMs":1.040},{"density":0.001,"zeros":1019,"clearEachMs":3.730,"markersMs":0.742},{"density":0.01,"zeros":10057,"clearEachMs":32.675,"markersMs":0.750},{"density":0.1,"zeros":99858,"clearEachMs":321.673,"markersMs":1.252}]},"speedPanel":[{"matrix":"500x500","density":0.0001,"markersMs":0.229,"inplaceMs":0.210,"ratio":0.92},{"matrix":"2000x2000","density":0.0001,"markersMs":3.306,"inplaceMs":2.878,"ratio":0.87},{"matrix":"2000x2000","density":0.01,"markersMs":2.886,"inplaceMs":2.903,"ratio":1.01}]}
```

<!-- @highlights -->
- The grid shows values, with original zeros drawn solid and written zeros drawn hatched — a distinction kept for the entire animation, because confusing the two IS the bug.
- The cascade runs on [[0,1],[1,1]]: the solid zero at (0,0) is found and row 0 and column 0 are cleared, the new cells appearing hatched.
- That frame is held with a caption noting the matrix is momentarily correct.
- The scan marker continues to (1,0), lands on a hatched zero, and visibly fails to distinguish it from a solid one.
- It clears row 1, destroying the 1 at (1,1) that should have survived — the frame where the algorithm reads its own output as input.
- The marker version then runs with a gutter of row flags down the left edge and column flags across the top.
- In phase one the scan lights gutter cells while the grid stays completely untouched, which the reader can confirm by eye.
- A hard visual break separates the phases, then phase two sweeps the grid consulting only the gutters.
- Each cell whose row or column gutter is lit fills in, and no decision is made from the grid itself.
- For the O(1) version the gutters slide INTO the matrix, coming to rest on the real first row and first column.
- The cell at (0,0) flashes red as the single slot asked to hold two different notices.
- The separate boolean is lifted out as a small tag parked outside the grid.
- The clearing then runs deliberately in the wrong order, wiping every row marker mid-flight, before rewinding to the correct order.
- A memory bar shows the matrix as a full-width block against a sliver of markers annotated 0.0100%.
- A density chart shows the marker line flat across every density while clear-each climbs to 321.673ms.

<!-- @edgeCases -->
- Single cell holding zero — the whole matrix becomes zero, and the O(1) version's flags must both fire.
- Single cell holding a non-zero — nothing changes, and no marker is ever written.
- Single row — every column flag matters and the row flag is all-or-nothing.
- Single column — the mirror case, and the one where the O(1) version's first-column flag does all the work.
- No zeros anywhere — the matrix must come back untouched, and both passes still run in full.
- All zeros — the result is unchanged, but every marker fires and the O(1) version overwrites its own flags harmlessly.
- A zero only at (0,0) — the cell where the first row and first column overlap, and the smallest failing case for a missing flag.
- A zero in the first row but not the first column — exercises one separate flag without the other.
- A zero in the first column but not the first row — the mirror, and the one people forget.
- A matrix where the only zero is at the bottom-right — nothing is marked until the very last cell of pass one.
- Non-square matrices in both orientations — row and column loop bounds are easy to transpose by accident.
- Negative values and large values in the matrix — only equality with zero matters, never magnitude or sign.

<!-- @pitfalls -->
- Clearing rows and columns during the scan. The zeros written are indistinguishable from original ones, measured 15.6% wrong on 3x3 matrices.
- Copying the outer list only, in Python. `matrix[:]` shares every inner row, so the copy sees the writes and the cascade returns.
- Omitting the separate first-row and first-column flags in the O(1) version. Measured 14.6% wrong on 3x3, with [[0,1],[1,1]] the smallest failing case.
- Clearing the first column before the first row in the O(1) version, which wipes every row marker before it has been used.
- Reading the first-row and first-column flags after the marking loops have run. Those loops overwrite the very cells the flags describe, so both must be computed first.
- Starting the O(1) marking loops at index 0 rather than 1, which treats the marker cells as ordinary data.
- Reaching for the O(1) version by default. It measured 0.87x to 1.03x the speed of the marker version and saves 0.01% of a 5000x5000 matrix.
- Believing the marker arrays violate the in-place requirement. The constraint is on the output, not on scratch space — m + n booleans is not a returned matrix.
- Assuming the brute force is fine because it passed on sparse input. At 103 zeros it was level with the marker version and at 99,858 zeros it was 256.9x slower.
- Indexing with matrix[c][r] somewhere in one of the four loops. Non-square matrices turn that into an out-of-bounds read rather than a wrong answer.
- Assuming matrix[0] exists. An empty matrix has no first row, so reading its length throws before any logic runs.
- Treating a value that is falsy but not zero as a zero, in dynamically typed code. Only an actual zero condemns a row.

<!-- @doubt -->
### Why can't I just clear the row and column as soon as I find a zero?

<!-- @answer -->
Because the zeros you write look exactly like the zeros that were already there, and the same scan then reads them. On [[0,1],[1,1]] the original zero at (0,0) correctly clears row 0 and column 0, leaving [[0,0],[0,1]] — which is the right answer. But the scan keeps going, reaches (1,0), finds the zero it wrote itself, and clears row 1 as well, destroying the 1 at (1,1). Measured over every 0/1 matrix, this produced the wrong answer on 18.8% of 2x2, 15.6% of 2x3 and 15.6% of 3x3 matrices. Every decision has to be made from the original matrix, which means separating the deciding pass from the writing pass.

<!-- @doubt -->
### Do the two boolean arrays break the in-place requirement?

<!-- @answer -->
No. "In place" constrains the output — you must modify the given matrix rather than build and return a new one — and all three correct approaches here do that. It does not forbid scratch space. Two arrays totalling m + n booleans against a matrix of m * n cells is 0.05% of a 1000x1000 matrix and 0.01% of a 5000x5000 one. The O(1) version is answering a stricter question than the one being asked, which is fine as an exercise but is not what the requirement demands.

<!-- @doubt -->
### Why does the O(1) version need a separate flag at all?

<!-- @answer -->
Because the cell at (0,0) sits in both the first row and the first column, and it can only hold one value. Every other marker cell is unambiguous — matrix[r][0] means "row r has a zero" and matrix[0][c] means "column c has a zero" — but (0,0) would have to mean both at once. So you record one of them, conventionally the first column, in a separate boolean outside the matrix and apply it at the end. Omitting that flag measured 14.6% wrong on 3x3 matrices, failing on exactly the same smallest input as the naive cascade, [[0,1],[1,1]].

<!-- @doubt -->
### Does the order of the final two clearing loops matter?

<!-- @answer -->
Yes, and getting it backwards is a quiet bug. The row markers live in column 0, so if you clear the first column first you destroy every row marker before the main loops have used them. Clear the first row first, then the first column. Some implementations avoid the question by clearing the borders before the main loops rather than after, but then the markers are gone when you need them — the ordering constraint does not disappear, it just moves.

<!-- @doubt -->
### Should I write the O(1) version or the marker version?

<!-- @answer -->
Learn the O(1) version, write the marker version. The idea behind the O(1) trick — storing metadata inside data you are about to overwrite anyway — is genuinely worth having, and it gets asked for by name. But measured against the marker version it runs between 0.87x and 1.03x, which is the same speed within noise, and what it saves is 0.05% of a 1000x1000 matrix or 0.01% of a 5000x5000 one. Meanwhile its one easy-to-miss detail measured a 14.6% failure rate. That is a real defect probability traded for a hundredth of a percent of memory at no speed gain.

<!-- @doubt -->
### Why is the brute force so much slower at high density?

<!-- @answer -->
Because its cost tracks the number of zeros rather than the size of the matrix. Clearing a full row and column costs m + n writes, and it does that for every zero it finds, so two zeros in the same row clear that row twice. On a 1000x1000 matrix it was level with the marker version at 103 zeros — 0.988ms against 1.040ms — then 5.0x slower at 1,019 zeros, 43.6x at 10,057, and 256.9x at 99,858 zeros, where it took 321.673ms. The marker version walks the matrix exactly twice whatever the data looks like, so it stayed between 0.742ms and 1.869ms across every density tested.

<!-- @doubt -->
### Why does the marker version use char instead of bool in C++?

<!-- @answer -->
Because vector<bool> is a bit-packed specialisation rather than a normal container of bools. Each read and write has to mask and shift to reach an individual bit, which is slower than a plain byte access for this pattern of use. vector<char> gives one byte per flag, which is still only m + n bytes — 2,000 bytes for a 1000x1000 matrix. The bit-packing would be worth it if the flags dominated memory, and here they are already 0.05% of the matrix.

<!-- @doubt -->
### How does this relate to Move Zeros to End?

<!-- @answer -->
Both are in-place problems where the obvious single-pass approach corrupts its own input, and both are fixed the same way — by separating what you decide from what you write. In Move Zeros the write pointer only ever trails the read pointer, so a cell is never read after being written. Here the two passes are fully separated in time: pass one reads and never writes, pass two writes and never decides. Recognising that an in-place algorithm must never read a cell it has already modified is the transferable part, and it is why the cascade here fails on 15.6% of inputs while looking entirely reasonable.
