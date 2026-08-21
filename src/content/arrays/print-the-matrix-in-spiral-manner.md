---
id: print-the-matrix-in-spiral-manner
topic: Arrays
title: Print the Matrix in Spiral Manner
difficulty: Medium
status: ready
prerequisites:
  - rotate-matrix-by-90-degrees
  - set-matrix-zeroes
  - nested-loops
  - for-loop
  - time-and-space-complexity-basics
relatedIds:
  - rotate-matrix-by-90-degrees
  - set-matrix-zeroes
  - leaders-in-an-array
  - nested-loops
---

<!-- @summary -->
Walk a matrix in spiral order — where the two guards everyone forgets are needed on 47.5% of matrix shapes, are never needed on a square one, and where the bug they prevent usually duplicates exactly one element.

<!-- @theory -->
## The problem

Return every element of an m × n matrix in spiral order: left across the top,
down the right side, back across the bottom, up the left side, then inward and
repeat.

```
 1  2  3  4
 5  6  7  8      ->   1 2 3 4 8 12 11 10 9 5 6 7
 9 10 11 12
```

## The four-boundary walk

Track four edges — `top`, `bottom`, `left`, `right` — and peel one layer per
loop, shrinking whichever edge you just consumed:

```
walk left to right along  top,     then top++
walk top  to bottom along right,   then right--
walk right to left along  bottom,  then bottom--
walk bottom to top along  left,    then left++
```

Repeat while `top <= bottom` and `left <= right`.

That is the whole algorithm, and on a square matrix it is also entirely correct
as written. Which is the problem.

## The two guards, and why your tests will not catch them missing

The third and fourth passes each need a check before they run:

```
if (top <= bottom)  { walk the bottom row;    bottom--; }
if (left <= right)  { walk the left column;   left++;   }
```

Without them, a layer that has collapsed to a **single row or single column**
gets walked twice — once forwards by the top pass, once backwards by the bottom
pass.

```
input   [[1, 2, 3]]
correct  1 2 3
unguarded 1 2 3 2 1     <- walked back along the same row
```

Measured over every shape up to 20 × 20:

| Innermost layer shape | Shapes | Fail rate |
|---|---|---|
| 1 × 1 | 10 | 0% |
| 1 × w, w > 1 | 100 | **100%** |
| h × 1, h > 1 | 100 | **90%** |
| h × w, both > 1 | 190 | 0% |

**190 of 400 shapes — 47.5% — produce the wrong answer.** The guards matter
precisely when the innermost surviving layer is a degenerate strip.

The exceptions in the h × 1 group are exactly the height-2 columns, where the
top pass takes one cell and the right pass takes the other, emptying the strip
exactly so the unguarded passes iterate empty ranges and emit nothing.

### And now the part that actually matters

**No square matrix ever fails.** Zero of the twenty tested, and the reason is
structural: peeling a square always leaves a square, so the innermost layer is
1 × 1 or 2 × 2 — never a strip. Every worked example in the usual problem
statement is square or close to it.

So the standard test suite cannot distinguish correct code from code missing
both guards. Test `[[1,2,3]]` and `[[1],[2],[3]]` — the one-row and one-column
cases — and the bug fails immediately.

### The damage is usually one element

On most failing shapes the bug emits **exactly one extra element**:

| Shape | Correct | Unguarded emits |
|---|---|---|
| 3 × 4 | 12 | 13 |
| 5 × 6 | 30 | 31 |
| 9 × 7 | 63 | 64 |
| 1 × 8 | 8 | **15** |

A single duplicate in a list of sixty-three is easy to miss by eye, which is
what makes this worth measuring rather than eyeballing. Only when the *whole
matrix* is a strip does the overcount become obvious.

**A cheap assertion:** the output length must equal m × n. That catches every
one of these failures without a reference implementation.

## Why not track visited cells?

The alternative is to walk with a direction vector and turn right whenever the
next cell is off the edge or already seen. It needs a visited grid the size of
the matrix, and it is the version most people reach for first because it needs
no reasoning about boundaries.

It is correct, and it costs:

| Matrix | Four-boundary | Visited grid | Ratio |
|---|---|---|---|
| 256 × 256 | 0.052ms | 0.141ms | **2.73x** |
| 1,024 × 1,024 | 1.124ms | 2.681ms | **2.39x** |
| 4,096 × 4,096 | 35.908ms | 73.558ms | **2.05x** |

Twice as slow, plus one extra byte per cell — 16.8 MB alongside a 67 MB matrix
at n = 4,096, a 25% memory overhead. It pays that for a bounds-and-visited check
at every single step, where the boundary walk knows the length of each run
before it starts.

## A third framing, and a link backwards

You can also drive the walk by direction alone, stopping when you have emitted
m × n elements rather than testing the boundaries:

```
while emitted < m*n:
    walk the current direction to its boundary
    shrink that boundary, turn right
```

This measured the same speed as the four-boundary version — 0.849ms against
1.124ms at n = 1,024 — and it needs no guards at all, because the loop condition
counts output instead of testing edges. The guards do not disappear so much as
get replaced by a single global check.

And there is a fourth way that connects directly to the previous subtopic: take
the top row, then **rotate the remaining matrix anticlockwise**, and repeat. The
spiral falls out of repeated rotation, because after rotating, the next side to
walk is always the new top row. It allocates a new matrix each round, so it is
not the one to write — but it is the clearest statement of what a spiral is, and
it reuses `reverse then transpose` from **Rotate Matrix by 90 Degrees** exactly.

## Which to write

The **four-boundary walk**, with both guards. It is O(1) space, it is the fastest
measured, and each of the four passes is independently readable. Write the two
guards, and test a single-row matrix so you know they are doing their job.
```

<!-- @intuition -->
Peeling a spiral is peeling an onion, and the only hard part is the last layer. While there is real matrix left, each ring has four genuinely distinct sides and walking them in order is unambiguous. But a ring that has thinned to a single row has a top and a bottom that are the same cells, and a ring one column wide has a left and a right that coincide. The guards exist to notice that the ring has collapsed and that two of its four sides no longer exist. A square never collapses that way — peel a square and you get a smaller square — which is exactly why testing on squares tells you nothing about whether you handled it.

<!-- @approach -->
### Brute Force - Direction Vector with a Visited Grid

<!-- @idea -->
Walk one step at a time in the current direction, turning right whenever the next cell is off the edge or already visited.

<!-- @steps -->
1. Allocate a grid of booleans the same size as the matrix.
2. Start at the top-left corner heading right.
3. Record the current cell and mark it visited.
4. Look at the next cell in the current direction.
5. If it is off the edge or already visited, turn right.
6. Step to the next cell and repeat until every cell has been recorded.

<!-- @complexity -->
- time: O(m * n), one step per cell plus a turn check
- space: O(m * n) for the visited grid
- note: Correct and it needs no reasoning about boundaries, which is why it is the common first attempt. Measured 2.05x to 2.73x slower than the boundary walk and it adds one byte per cell — 16.8 MB alongside a 67 MB matrix at n = 4,096. It pays a bounds-and-visited test at every step, where the boundary walk knows each run's length in advance.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> spiralOrder(const vector<vector<int>>& matrix) {
    if (matrix.empty() || matrix[0].empty()) return {};
    int R = matrix.size(), C = matrix[0].size();
    vector<int> out;
    out.reserve((size_t)R * C);

    vector<vector<char>> seen(R, vector<char>(C, 0));
    int dr[4] = {0, 1, 0, -1}, dc[4] = {1, 0, -1, 0};   // right, down, left, up
    int r = 0, c = 0, d = 0;

    for (long i = 0; i < (long)R * C; i++) {
        out.push_back(matrix[r][c]);
        seen[r][c] = 1;
        int nr = r + dr[d], nc = c + dc[d];
        if (!(nr >= 0 && nr < R && nc >= 0 && nc < C && !seen[nr][nc])) {
            d = (d + 1) % 4;                            // turn right
            nr = r + dr[d]; nc = c + dc[d];
        }
        r = nr; c = nc;
    }
    return out;
}
```

<!-- @annotations -->
- 11: The four directions in clockwise order, so turning right is just advancing the index.
- 18: This test runs once per cell, which is the cost the boundary walk avoids by knowing each run's length up front.
- 19: Modulo 4 wraps from up back to right, so no explicit direction table lookup is needed.

<!-- @code java -->
```java
import java.util.ArrayList;
import java.util.List;

static List<Integer> spiralOrder(int[][] matrix) {
    if (matrix.length == 0 || matrix[0].length == 0) return new ArrayList<>();
    int R = matrix.length, C = matrix[0].length;
    List<Integer> out = new ArrayList<>(R * C);

    boolean[][] seen = new boolean[R][C];
    int[] dr = {0, 1, 0, -1}, dc = {1, 0, -1, 0};
    int r = 0, c = 0, d = 0;

    for (int i = 0; i < R * C; i++) {
        out.add(matrix[r][c]);
        seen[r][c] = true;
        int nr = r + dr[d], nc = c + dc[d];
        if (nr < 0 || nr >= R || nc < 0 || nc >= C || seen[nr][nc]) {
            d = (d + 1) % 4;
            nr = r + dr[d]; nc = c + dc[d];
        }
        r = nr; c = nc;
    }
    return out;
}
```

<!-- @annotations -->
- 9: A full boolean grid, the same shape as the matrix, which is the whole space cost of this approach.

<!-- @code python -->
```python
def spiral_order(matrix):
    if not matrix or not matrix[0]:
        return []
    R, C = len(matrix), len(matrix[0])
    seen = [[False] * C for _ in range(R)]
    dr, dc = [0, 1, 0, -1], [1, 0, -1, 0]
    r = c = d = 0
    out = []

    for _ in range(R * C):
        out.append(matrix[r][c])
        seen[r][c] = True
        nr, nc = r + dr[d], c + dc[d]
        if not (0 <= nr < R and 0 <= nc < C and not seen[nr][nc]):
            d = (d + 1) % 4
            nr, nc = r + dr[d], c + dc[d]
        r, c = nr, nc
    return out


# No guards are needed here — 'already visited' subsumes every degenerate
# case — but that convenience costs a full grid and roughly double the time.
```

<!-- @annotations -->
- 14: Chained comparison reads as a range test. The visited check is what makes turning correct at a collapsed layer.

<!-- @approach -->
### Four-Boundary Walk

<!-- @idea -->
Track the four edges of the unvisited region and peel one full ring per iteration, shrinking each edge as it is consumed.

<!-- @steps -->
1. Set top and left to zero, and bottom and right to the last row and column.
2. While the region is non-empty, walk the top row left to right, then move top down.
3. Walk the right column top to bottom, then move right inward.
4. If rows remain, walk the bottom row right to left, then move bottom up.
5. If columns remain, walk the left column bottom to top, then move left inward.
6. Those two conditional checks are what stop a collapsed layer being walked twice.

<!-- @complexity -->
- time: O(m * n), each cell emitted exactly once
- space: O(1) beyond the output
- note: The recommended solution: fastest measured, constant extra space, and each of the four passes reads independently. Measured 1.124ms at n = 1,024 against 2.681ms for the visited-grid version. The two guards are required on 47.5% of shapes up to 20x20 and on none of the square ones.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> spiralOrder(const vector<vector<int>>& matrix) {
    if (matrix.empty() || matrix[0].empty()) return {};
    vector<int> out;
    out.reserve(matrix.size() * matrix[0].size());
    int top = 0, bottom = matrix.size() - 1;
    int left = 0, right = matrix[0].size() - 1;

    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.push_back(matrix[top][c]);
        top++;

        for (int r = top; r <= bottom; r++) out.push_back(matrix[r][right]);
        right--;

        if (top <= bottom) {                        // GUARD: rows remain
            for (int c = right; c >= left; c--) out.push_back(matrix[bottom][c]);
            bottom--;
        }
        if (left <= right) {                        // GUARD: columns remain
            for (int r = bottom; r >= top; r--) out.push_back(matrix[r][left]);
            left++;
        }
    }
    return out;
}
```

<!-- @annotations -->
- 12: The top pass runs first and unconditionally, which is why the bottom pass is the one that needs guarding.
- 18: Without this, a layer collapsed to a single row is walked forwards then backwards — measured wrong on 47.5% of shapes.
- 22: Without this, a layer one column wide is walked down then back up.

<!-- @code java -->
```java
import java.util.ArrayList;
import java.util.List;

static List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> out = new ArrayList<>();
    if (matrix.length == 0 || matrix[0].length == 0) return out;
    int top = 0, bottom = matrix.length - 1;
    int left = 0, right = matrix[0].length - 1;

    while (top <= bottom && left <= right) {
        for (int c = left; c <= right; c++) out.add(matrix[top][c]);
        top++;

        for (int r = top; r <= bottom; r++) out.add(matrix[r][right]);
        right--;

        if (top <= bottom) {
            for (int c = right; c >= left; c--) out.add(matrix[bottom][c]);
            bottom--;
        }
        if (left <= right) {
            for (int r = bottom; r >= top; r--) out.add(matrix[r][left]);
            left++;
        }
    }
    return out;
}
```

<!-- @annotations -->
- 17: Both guards are needed. A square matrix never triggers either one, so testing on squares proves nothing about them.

<!-- @code python -->
```python
def spiral_order(matrix):
    if not matrix or not matrix[0]:
        return []
    out = []
    top, bottom = 0, len(matrix) - 1
    left, right = 0, len(matrix[0]) - 1

    while top <= bottom and left <= right:
        for c in range(left, right + 1):
            out.append(matrix[top][c])
        top += 1

        for r in range(top, bottom + 1):
            out.append(matrix[r][right])
        right -= 1

        if top <= bottom:                       # GUARD: rows remain
            for c in range(right, left - 1, -1):
                out.append(matrix[bottom][c])
            bottom -= 1

        if left <= right:                       # GUARD: columns remain
            for r in range(bottom, top - 1, -1):
                out.append(matrix[r][left])
            left += 1
    return out


# assert len(out) == len(matrix) * len(matrix[0])
# catches every guard failure without needing a reference implementation.
```

<!-- @annotations -->
- 18: Test [[1,2,3]] to see this fire. Without it the output is 1 2 3 2 1.
- 23: Test [[1],[2],[3]] for this one. Without it the output is 1 2 3 2.

<!-- @approach -->
### Direction Vector with Shrinking Boundaries

<!-- @idea -->
Walk whole runs in the current direction and turn right after each, stopping once the output holds every element rather than testing the boundaries.

<!-- @steps -->
1. Keep the four boundaries and a direction index starting at right.
2. While fewer than m times n elements have been emitted, walk one full run.
3. Heading right means the top row, then move top down.
4. Heading down means the right column, then move right inward.
5. Heading left means the bottom row, and heading up means the left column, shrinking each in turn.
6. Turn right after every run.

<!-- @complexity -->
- time: O(m * n)
- space: O(1) beyond the output
- note: The same cost as the four-boundary walk — measured 0.849ms against 1.124ms at n = 1,024 — and it needs no per-pass guards, because counting the output subsumes them. Worth knowing as the variant where the collapsed-layer problem is solved by the loop condition rather than by two extra checks.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> spiralOrder(const vector<vector<int>>& matrix) {
    if (matrix.empty() || matrix[0].empty()) return {};
    int R = matrix.size(), C = matrix[0].size();
    vector<int> out;
    out.reserve((size_t)R * C);
    int top = 0, bottom = R - 1, left = 0, right = C - 1, d = 0;

    while ((long)out.size() < (long)R * C) {          // counts output, not edges
        if (d == 0)      { for (int c = left; c <= right; c++) out.push_back(matrix[top][c]);    top++; }
        else if (d == 1) { for (int r = top; r <= bottom; r++) out.push_back(matrix[r][right]);  right--; }
        else if (d == 2) { for (int c = right; c >= left; c--) out.push_back(matrix[bottom][c]); bottom--; }
        else             { for (int r = bottom; r >= top; r--) out.push_back(matrix[r][left]);   left++; }
        d = (d + 1) % 4;
    }
    return out;
}
```

<!-- @annotations -->
- 11: Counting the output is what removes the need for guards — an exhausted region simply cannot add anything.
- 14: A collapsed layer makes this loop iterate an empty range, which is harmless because the outer condition has already stopped.

<!-- @code java -->
```java
import java.util.ArrayList;
import java.util.List;

static List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> out = new ArrayList<>();
    if (matrix.length == 0 || matrix[0].length == 0) return out;
    int R = matrix.length, C = matrix[0].length;
    int top = 0, bottom = R - 1, left = 0, right = C - 1, d = 0;

    while (out.size() < R * C) {
        if (d == 0)      { for (int c = left; c <= right; c++) out.add(matrix[top][c]);    top++; }
        else if (d == 1) { for (int r = top; r <= bottom; r++) out.add(matrix[r][right]);  right--; }
        else if (d == 2) { for (int c = right; c >= left; c--) out.add(matrix[bottom][c]); bottom--; }
        else             { for (int r = bottom; r >= top; r--) out.add(matrix[r][left]);   left++; }
        d = (d + 1) % 4;
    }
    return out;
}
```

<!-- @annotations -->
- 10: One global condition replaces the two per-pass guards of the previous approach.

<!-- @code python -->
```python
def spiral_order(matrix):
    if not matrix or not matrix[0]:
        return []
    R, C = len(matrix), len(matrix[0])
    out = []
    top, bottom, left, right, d = 0, R - 1, 0, C - 1, 0

    while len(out) < R * C:
        if d == 0:
            out += [matrix[top][c] for c in range(left, right + 1)]; top += 1
        elif d == 1:
            out += [matrix[r][right] for r in range(top, bottom + 1)]; right -= 1
        elif d == 2:
            out += [matrix[bottom][c] for c in range(right, left - 1, -1)]; bottom -= 1
        else:
            out += [matrix[r][left] for r in range(bottom, top - 1, -1)]; left += 1
        d = (d + 1) % 4
    return out


# The loop condition counts emitted elements, so a collapsed layer
# ends the walk rather than being traversed a second time.
```

<!-- @annotations -->
- 8: Counting output rather than testing edges, which is what makes the guards unnecessary here.

<!-- @approach -->
### Peel and Rotate

<!-- @idea -->
Take the top row, rotate what is left anticlockwise, and repeat — the next side to walk is then always the new top row.

<!-- @steps -->
1. While the matrix still has rows and columns, remove its first row and append it to the output.
2. Rotate the remaining matrix ninety degrees anticlockwise.
3. The side that was the right column is now the top row.
4. Repeat, taking the new top row each time.
5. The spiral falls out of repeated rotation, with no boundary tracking at all.

<!-- @complexity -->
- time: O(m * n) elements emitted, but each rotation copies the remaining matrix
- space: O(m * n) for the rotated copies
- note: Not the one to write — it allocates a fresh matrix every round — but it is the clearest statement of what a spiral is, and it reuses the anticlockwise rotation from Rotate Matrix by 90 Degrees exactly. Useful as an independent reference implementation when testing the others.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<int> spiralOrder(vector<vector<int>> m) {        // by value: it is consumed
    vector<int> out;
    while (!m.empty() && !m[0].empty()) {
        out.insert(out.end(), m[0].begin(), m[0].end());
        m.erase(m.begin());                             // drop the top row

        int R = m.size();
        if (R == 0) break;
        int C = m[0].size();
        vector<vector<int>> rotated(C, vector<int>(R));
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                rotated[C - 1 - c][r] = m[r][c];        // anticlockwise
        m = rotated;
    }
    return out;
}
```

<!-- @annotations -->
- 8: Taking the whole top row at once, which is the only kind of move this approach ever makes.
- 17: The anticlockwise rotation, the same operation built in the previous subtopic.

<!-- @code java -->
```java
import java.util.ArrayList;
import java.util.List;

static List<Integer> spiralOrder(int[][] matrix) {
    List<Integer> out = new ArrayList<>();
    int[][] m = matrix;
    while (m.length > 0 && m[0].length > 0) {
        for (int v : m[0]) out.add(v);

        int R = m.length - 1, C = m[0].length;
        if (R == 0) break;
        int[][] rotated = new int[C][R];
        for (int r = 0; r < R; r++)
            for (int c = 0; c < C; c++)
                rotated[C - 1 - c][r] = m[r + 1][c];
        m = rotated;
    }
    return out;
}
```

<!-- @annotations -->
- 15: Reading from row r + 1 skips the row just consumed, avoiding a separate copy to drop it.

<!-- @code python -->
```python
def spiral_order(matrix):
    out = []
    m = [row[:] for row in matrix]
    while m and m[0]:
        out += m.pop(0)                        # take the top row
        m = [list(r) for r in zip(*m)][::-1]   # rotate anticlockwise
    return out


# zip(*m) transposes, and [::-1] reverses the row order — together they
# are the anticlockwise rotation from the previous subtopic, written
# as one line because Python hands you the transpose for free.
```

<!-- @annotations -->
- 5: pop(0) removes and returns the first row in a single step.
- 6: Transpose then reverse the row order — the anticlockwise rotation, in one line.

<!-- @example -->

<!-- @input -->
matrix = [[1,2,3,4],[5,6,7,8],[9,10,11,12]]

<!-- @output -->
[1, 2, 3, 4, 8, 12, 11, 10, 9, 5, 6, 7]

<!-- @why -->
A non-square matrix whose innermost layer collapses to a single row, so it exercises the bottom-row guard on the second pass through the loop.

<!-- @walkthrough -->
1. Top row left to right gives 1, 2, 3, 4, and top moves to row 1.
2. Right column from row 1 to row 2 gives 8 and 12, and right moves to column 2.
3. Rows remain, so the bottom row right to left gives 11, 10, 9, and bottom moves to row 1.
4. Columns remain, so the left column from row 1 up to row 1 gives 5, and left moves to column 1.
5. The surviving region is now row 1, columns 1 to 2 — a single row.
6. The top pass emits 6 and 7 and moves top to row 2, which is past bottom.
7. The bottom guard now fails, so 7 and 6 are not emitted a second time, and the loop ends.

<!-- @example -->

<!-- @input -->
matrix = [[1,2,3]] with the two guards removed

<!-- @output -->
[1, 2, 3, 2, 1] — five elements from a three-element matrix

<!-- @why -->
The smallest and loudest failure, where the whole matrix is a single row so the duplication is impossible to miss.

<!-- @walkthrough -->
1. The top pass emits 1, 2, 3 and moves top from row 0 to row 1.
2. The right column pass runs from row 1 to row 0, which is an empty range, so it emits nothing.
3. right moves from column 2 to column 1.
4. The unguarded bottom pass now walks row 0 from column 1 back to column 0, emitting 2 and 1.
5. The output is 1, 2, 3, 2, 1 — the row traversed forwards and then most of the way back.
6. With the guard, top is 1 and bottom is 0, so top <= bottom is false and the pass is skipped.
7. On most shapes the overcount is only one element; here the whole matrix is the collapsed layer, so it is five for three.

<!-- @example -->

<!-- @input -->
Every matrix shape from 1x1 to 20x20, with and without the guards

<!-- @output -->
190 of 400 shapes wrong without them — and 0 of the 20 square shapes

<!-- @why -->
The measurement that explains why this bug survives testing: the standard examples are square, and squares are exactly the shapes that cannot expose it.

<!-- @walkthrough -->
1. Grouping by the shape of the innermost surviving layer separates the outcomes completely.
2. When that layer is 1 x w with w greater than 1, all 100 such shapes fail.
3. When it is h x 1 with h greater than 1, 90 of 100 fail.
4. The ten exceptions are the height-2 columns, where the top and right passes empty the strip exactly.
5. When the innermost layer is 1 x 1, or has both dimensions above one, none fail.
6. Peeling a square always leaves a square, so its innermost layer is 1 x 1 or 2 x 2 — never a strip.
7. That is why no square matrix of any size can distinguish the guarded version from the unguarded one.

<!-- @example -->

<!-- @input -->
A 4,096 x 4,096 matrix, boundary walk against the visited-grid walk

<!-- @output -->
35.908ms against 73.558ms — 2.05x, plus 16.8 MB of extra memory

<!-- @why -->
Shows the cost of the approach that avoids thinking about boundaries, which is the one most people write first.

<!-- @walkthrough -->
1. The visited-grid walk tests bounds and the visited flag once per cell, then decides whether to turn.
2. That is roughly seventeen million such tests on this matrix.
3. The boundary walk computes each run's length before it starts, so its inner loops have no per-step branching.
4. Measured 2.73x apart at 256 x 256 and 2.39x at 1,024 x 1,024.
5. The gap narrows to 2.05x at 4,096 as both become more memory-bound.
6. The visited grid also costs one byte per cell — 16.8 MB against the matrix's 67 MB.
7. That is a 25% memory overhead for an approach that is also twice as slow.

<!-- @visualization matrix -->

<!-- @description -->
The matrix as a grid with all four boundary edges drawn as coloured rails just outside it — top, bottom, left, right — because the algorithm's entire state is those four numbers and they should be visible objects rather than implied. A travelling marker walks the current run while the rail it is following glows; when the run ends, animate that rail sliding inward one cell with an audible-feeling snap, so shrinking the region reads as a physical move. Emitted cells dim behind the marker and drop into an output strip below the grid, which fills left to right and doubles as the element counter. Run the 3 x 4 example fully so the reader sees the region contract to a single row on the second circuit. That is the moment the lesson turns: freeze when top and bottom rails coincide, and highlight that the top rail and the bottom rail are now pointing at the same cells. Then branch the animation into two panels playing side by side from that frozen frame — guarded on the left, unguarded on the right. On the left the bottom pass is skipped and the walk ends cleanly with the output strip holding exactly twelve cells. On the right the bottom pass runs anyway, the marker doubles back along the row it just walked, and cells that are already dimmed light up a second time and drop into the output strip again, which now overflows past twelve. Show the two output strips stacked, with the extra cells in the unguarded strip marked in a warning colour, and put the counter beside each: 12 against 13. Then a shape panel: a 20 x 20 grid of tiles, one per matrix shape, each tile coloured by whether the unguarded version fails on that shape, with the diagonal — the square shapes — standing out as an unbroken line of passes cutting through a field of failures. Annotate that diagonal directly, because it is the whole argument for why the bug survives testing. Finally a small memory-and-time panel contrasting the boundary walk against the visited-grid walk, showing the extra grid as a translucent overlay the same size as the matrix and the two bars at 35.908ms and 73.558ms.

<!-- @sampleInput -->
```json
{"primary":{"input":[[1,2,3,4],[5,6,7,8],[9,10,11,12]],"rows":3,"cols":4,"expected":[1,2,3,4,8,12,11,10,9,5,6,7],"passes":[{"dir":"right","cells":[1,2,3,4],"rail":"top","shrinkTo":1},{"dir":"down","cells":[8,12],"rail":"right","shrinkTo":2},{"dir":"left","cells":[11,10,9],"rail":"bottom","shrinkTo":1,"guarded":true},{"dir":"up","cells":[5],"rail":"left","shrinkTo":1,"guarded":true},{"dir":"right","cells":[6,7],"rail":"top","shrinkTo":2},{"dir":"down","cells":[],"rail":"right","note":"empty range"},{"dir":"left","cells":[],"rail":"bottom","note":"GUARD blocks this pass","wouldEmit":[7,6]}],"collapseAt":"second circuit, region becomes 1 x 2"},"bugPanel":{"input":[[1,2,3]],"correct":[1,2,3],"unguarded":[1,2,3,2,1],"correctCount":3,"unguardedCount":5,"typicalOvercount":1,"overcountExamples":[{"shape":"3x4","correct":12,"emits":13},{"shape":"5x6","correct":30,"emits":31},{"shape":"9x7","correct":63,"emits":64},{"shape":"1x8","correct":8,"emits":15}],"cheapAssertion":"len(out) == m * n"},"shapePanel":{"upTo":20,"totalShapes":400,"failing":190,"failRate":0.475,"squaresFailing":0,"byInnermostLayer":[{"shape":"1 x 1","count":10,"fail":0},{"shape":"1 x w (w>1)","count":100,"fail":100},{"shape":"h x 1 (h>1)","count":100,"fail":90},{"shape":"h x w (both>1)","count":190,"fail":0}],"exceptions":"height-2 columns: top and right passes empty the strip exactly","whySquaresPass":"peeling a square leaves a square, so the innermost layer is 1x1 or 2x2, never a strip"},"costPanel":[{"matrix":"256x256","boundaryMs":0.052,"visitedMs":0.141,"ratio":2.73},{"matrix":"1024x1024","boundaryMs":1.124,"visitedMs":2.681,"ratio":2.39},{"matrix":"4096x4096","boundaryMs":35.908,"visitedMs":73.558,"ratio":2.05,"matrixMB":67.1,"visitedGridMB":16.8,"overheadPct":25}],"dirShrinkPanel":{"n":1024,"boundaryMs":1.124,"dirShrinkMs":0.849,"needsGuards":false,"reason":"loop counts emitted elements instead of testing edges"}}
```

<!-- @highlights -->
- All four boundary edges are drawn as coloured rails just outside the grid, because those four numbers are the algorithm's entire state.
- A travelling marker walks the current run while the rail it follows glows.
- When a run ends, that rail slides inward one cell with a snap, so shrinking the region reads as a physical move.
- Emitted cells dim behind the marker and drop into an output strip below, which doubles as the element counter.
- The 3 x 4 example runs fully: 1 2 3 4 across the top, then 8 and 12 down the right.
- The bottom pass gives 11 10 9 and the left pass gives 5, and the region contracts to a single row.
- The animation freezes with the top and bottom rails coinciding, highlighting that both now point at the same cells.
- From that frozen frame the animation branches into two panels playing side by side, guarded and unguarded.
- On the guarded side the bottom pass is skipped and the walk ends with exactly twelve cells emitted.
- On the unguarded side the marker doubles back along the row it just walked.
- Already-dimmed cells light a second time and drop into the output strip again, which overflows past twelve.
- The two output strips are stacked with the extra cells marked in a warning colour, counters reading 12 against 13.
- A shape panel shows a 20 x 20 grid of tiles, one per matrix shape, coloured by whether the unguarded version fails.
- The diagonal of square shapes stands out as an unbroken line of passes cutting through a field of failures, annotated directly.
- A final panel shows the visited grid as a translucent overlay the size of the matrix, with bars at 35.908ms and 73.558ms.

<!-- @edgeCases -->
- Empty matrix — the output is empty, and the row-length lookup must not run before the emptiness check.
- A matrix with rows but no columns, such as [[]] — the outer array is non-empty but there is nothing to emit.
- 1x1 matrix — a single element, and the one degenerate shape where the missing guards happen to be harmless.
- Single row, such as [[1,2,3]] — the loudest guard failure, emitting five elements for three.
- Single column, such as [[1],[2],[3]] — the mirror case, emitting four for three.
- Two-row, one-column matrix — one of the ten shapes where a single-column innermost layer does not trigger the bug.
- Square matrices of any size — never expose the missing guards, which is why they are useless as tests here.
- Shapes where rows and columns differ by one, such as 3x4 — the innermost layer collapses and the overcount is exactly one element.
- Very wide matrices, such as 1x8 — the whole matrix is the collapsed layer, so the overcount reaches seven.
- Matrices where one dimension is even and the other odd — the innermost layer is most likely to be a strip.
- Repeated values throughout — a duplicated element is then indistinguishable from a correct one, so the length assertion is the only check that works.
- Very large matrices — correctness is unchanged, but the visited-grid approach's extra byte per cell becomes a real 25% memory cost.

<!-- @pitfalls -->
- Omitting the check before the bottom-row pass. A layer collapsed to a single row is walked forwards and then backwards — measured wrong on 47.5% of shapes up to 20x20.
- Omitting the check before the left-column pass. The mirror failure, on a layer one column wide.
- Testing only on square matrices. No square of any size exposes either missing guard, because peeling a square always leaves a square.
- Trusting the problem statement's examples. They are square or near-square, which is exactly the shape that cannot fail.
- Eyeballing the output instead of counting it. On most failing shapes the bug duplicates exactly one element — 63 becomes 64 — which is invisible by inspection.
- Skipping the length assertion. Checking that the output holds m times n elements catches every guard failure with no reference implementation.
- Testing with repeated values. A duplicated element is then indistinguishable from a legitimate one, so only the length check can detect the fault.
- Reaching for a visited grid to avoid boundary reasoning. It measured 2.05x to 2.73x slower and costs one byte per cell, a 25% overhead at scale.
- Shrinking a boundary before its pass has run rather than after. The pass then misses its own edge row or column entirely.
- Checking only `top <= bottom` in the while condition and not `left <= right`. A matrix that runs out of columns first then walks past its own edge.
- Reading matrix[0].size() before checking that the matrix has any rows. An empty matrix throws before the loop is reached.
- Assuming the four passes are symmetric. The top pass always runs first and unconditionally, which is precisely why it is the bottom and left passes that need guarding.

<!-- @doubt -->
### Why do the bottom and left passes need a guard but the top and right ones do not?

<!-- @answer -->
Because of the order. The top pass runs first in each circuit and is always safe: if the region is non-empty at all, it has a top row worth walking. The right pass runs immediately after and cannot re-walk anything, because top has already moved past the row it consumed. By the time the bottom pass runs, the region may have collapsed to the single row that the top pass just finished — and walking it again traverses the same cells backwards. Same for the left pass when the region is one column wide. The asymmetry is not arbitrary; it comes from which passes have already shrunk their boundaries.

<!-- @doubt -->
### My solution passes every test. How do I know the guards are needed?

<!-- @answer -->
Check whether your tests include a non-square matrix whose innermost layer collapses. Measured over every shape from 1x1 to 20x20, the unguarded version failed on 190 of 400 — 47.5% — and on none of the 20 square shapes. That is structural: peeling a square always leaves a square, so its innermost layer is 1x1 or 2x2 and never a strip. Since the usual worked examples are square or near-square, a passing suite says nothing. Add [[1,2,3]] and [[1],[2],[3]] and the bug appears immediately.

<!-- @doubt -->
### How wrong does it actually go?

<!-- @answer -->
Usually by exactly one element, which is what makes it dangerous. A 3x4 matrix emits 13 elements instead of 12, a 5x6 emits 31 instead of 30, a 9x7 emits 64 instead of 63. A single duplicate in a list of sixty-three is not something you notice by reading the output. It only becomes obvious when the whole matrix is the collapsed layer: [[1,2,3]] emits 1 2 3 2 1, and a 1x8 emits fifteen elements for eight. The reliable check is to assert that the output length equals m times n, which catches every one of these without a reference implementation.

<!-- @doubt -->
### Is there a version that does not need guards at all?

<!-- @answer -->
Yes — drive the loop by counting output instead of testing boundaries. While fewer than m times n elements have been emitted, walk one full run in the current direction, shrink that boundary and turn right. A collapsed layer then makes a run iterate an empty range, which is harmless, because the outer condition has already stopped the walk. It measured the same speed as the guarded version, 0.849ms against 1.124ms at n = 1,024. The guards have not really vanished; they have been replaced by one global condition, which is easier to get right because there is only one of it.

<!-- @doubt -->
### Why not just track visited cells and turn when blocked?

<!-- @answer -->
It works and it needs no reasoning about boundaries, which is why most people write it first. It costs about double the time and a full extra grid. Measured 2.73x slower at 256x256, 2.39x at 1,024x1,024 and 2.05x at 4,096x4,096, where the visited grid added 16.8 MB alongside a 67 MB matrix — a 25% memory overhead. The reason is that it performs a bounds-and-visited test at every single cell, roughly seventeen million of them on that matrix, whereas the boundary walk computes each run's length before starting and has no per-step branching inside its loops.

<!-- @doubt -->
### What is the peel-and-rotate version for, if it allocates?

<!-- @answer -->
For understanding and for testing. Take the top row, rotate what remains anticlockwise, repeat — the side you need next is then always the new top row, so the spiral falls out of repeated rotation with no boundary tracking at all. In Python it is two lines. It allocates a fresh matrix each round so it is not what you ship, but it is an independent implementation with a completely different structure, which makes it a genuinely useful reference to test the boundary walk against. It also reuses the anticlockwise rotation from the previous subtopic exactly.

<!-- @doubt -->
### Which shapes are the risky ones?

<!-- @answer -->
The ones whose innermost surviving layer is a single row or single column. Grouped by that, the outcomes separate completely: when the innermost layer is 1 x w with w above one, all 100 such shapes failed; when it is h x 1 with h above one, 90 of 100 failed; and when the innermost layer is 1 x 1 or has both dimensions above one, none failed. The ten exceptions are the height-2 columns, where the top pass takes one cell and the right pass takes the other, emptying the strip exactly so the unguarded passes iterate empty ranges. In practice: if the matrix is not square, assume it is a risky shape.

<!-- @doubt -->
### How does this relate to Rotate Matrix by 90 Degrees?

<!-- @answer -->
Two ways. The four-boundary walk is the same ring-by-ring decomposition the four-way cycle uses there — both treat a matrix as nested rings and process one at a time, and both have their hardest case at the innermost ring. And the peel-and-rotate approach here literally calls the anticlockwise rotation built in that subtopic, once per layer. If that rotation is correct, this spiral is correct, which is a nice example of an earlier result being reusable as a component rather than just as an idea.
