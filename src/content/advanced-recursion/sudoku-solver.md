---
id: sudoku-solver
topic: Advanced Recursion
title: Sudoku Solver
difficulty: Hard
status: ready
prerequisites:
  - m-coloring-problem
  - n-queen
  - rat-in-a-maze
relatedIds:
  - m-coloring-problem
  - n-queen
  - rat-in-a-maze
  - word-search
  - power-set-bit-manipulation
---

<!-- @summary -->
Two independent improvements, and this problem separates them cleanly. Replacing the row-column-box scan with bitmasks places exactly the same values in exactly the same order and runs 6.2x to 8.8x faster. Filling the most constrained cell first places 4,405x fewer values — turning a 1.56-second puzzle into 0.47 milliseconds — though on an easy grid its own overhead makes it slower.

<!-- @theory -->
## The problem

Fill a 9×9 grid so every row, every column and every 3×3 box contains each of
1–9 exactly once. Empty cells are `.`, and a well-formed puzzle has one solution.

```
5 3 . | . 7 . | . . .          5 3 4 | 6 7 8 | 9 1 2
6 . . | 1 9 5 | . . .          6 7 2 | 1 9 5 | 3 4 8
. 9 8 | . . . | . 6 .          1 9 8 | 3 4 2 | 5 6 7
------+-------+------   ->     ------+-------+------
8 . . | . 6 . | . . 3          8 5 9 | 7 6 1 | 4 2 3
4 . . | 8 . 3 | . . 1          4 2 6 | 8 5 3 | 7 9 1
7 . . | . 2 . | . . 6          7 1 3 | 9 2 4 | 8 5 6
------+-------+------          ------+-------+------
. 6 . | . . . | 2 8 .          9 6 1 | 5 3 7 | 2 8 4
. . . | 4 1 9 | . . 5          2 8 7 | 4 1 9 | 6 3 5
. . . | . 8 . | . 7 9          3 4 5 | 2 8 6 | 1 7 9
```

## The box index

The box containing cell `(r, c)` is:

```
box = (r / 3) * 3 + c / 3
```

The `* 3` is not decoration. Writing `r / 3 + c / 3` produces only five distinct
values for nine boxes:

```
correct                  buggy  r/3 + c/3
(0,0)->0 (0,4)->1 (0,8)->2      (0,0)->0 (0,4)->1 (0,8)->2
(4,0)->3 (4,4)->4 (4,8)->5      (4,0)->1 (4,4)->2 (4,8)->3
(8,0)->6 (8,4)->7 (8,8)->8      (8,0)->2 (8,4)->3 (8,8)->4
```

The top-right box and the bottom-left box collapse onto the same index, so a digit
in one blocks the other. Measured on five puzzles including LeetCode 37's own
example, the buggy version reports **unsolvable on every one** — a loud failure,
which is the good case.

## Two improvements that do different things

Both are usually mentioned together. They are not the same kind of change, and
this problem makes the difference visible.

**Bitmasks replace the scan.** Keeping a nine-bit mask per row, column and box
makes the "is this digit legal here?" test one `and` instead of a 27-cell walk.
Measured, this places **exactly the same values in exactly the same order**:

| puzzle | values placed, scan | values placed, bitmask |
|---|---|---|
| LeetCode 37 | 4,208 | 4,208 |
| AI Escargot | 8,969 | 8,969 |
| anti-brute-force | 69,175,316 | 69,175,316 |
| 17 clues | 26,590,293 | 26,590,293 |

Identical, because the two compute the same predicate and therefore make the same
choices. The whole gain is per-node cost — **6.18x to 8.76x**.

**Most-constrained-cell-first changes the tree.** Instead of filling cells in
row order, always fill the empty cell with the fewest legal digits. That is a
different search:

| puzzle | bitmask, row order | with MRV | fewer placements |
|---|---|---|---|
| easy | 200 | 49 | 4x |
| LeetCode 37 | 4,208 | **51** | 83x |
| AI Escargot | 8,969 | **219** | 41x |
| anti-brute-force | 69,175,316 | **58,233** | **1,188x** |
| 17 clues | 26,590,293 | **6,036** | **4,405x** |

## What that costs in real time

| puzzle | scan | bitmask | MRV |
|---|---|---|---|
| easy | 11,333 | **1,833** | 3,041 |
| LeetCode 37 | 254,334 | 32,916 | **3,625** |
| AI Escargot | 634,708 | 81,375 | **18,125** |
| anti-brute-force | **4,131,996,542** | 479,673,041 | **4,351,208** |
| 17 clues | 1,555,789,417 | 177,598,209 | **473,458** |

Nanoseconds. The anti-brute-force puzzle — constructed specifically to defeat
row-order search — takes the scanning version **4.13 seconds** and the MRV
version **4.35 milliseconds**, a factor of **950**.

And note the first row. On the easy puzzle **MRV is slower than plain bitmasks**,
1,833ns against 3,041. Choosing the best cell means scanning all 81 cells and
counting candidates at every step, and when the search would have finished in 200
placements anyway, that bookkeeping costs more than it saves. The heuristic is not
free; it is a bet that the search is hard, and on easy puzzles the bet loses.

<!-- @intuition -->
Sudoku is the cleanest place to see that "make the check cheaper" and "make fewer checks" are different projects. Bitmasking is the first: it changes nothing about which cells are tried or in what order — the two versions place identical values, in identical sequence — and buys a constant factor of about eight. Most-constrained-first is the second: it computes the same predicate at the same cost per test, and simply asks the questions in a better order, which is worth up to four thousand times as much. Constant factors are found by thinking about the machine and are reliable; search-order heuristics are found by thinking about the problem and are not — the same heuristic that turns four seconds into four milliseconds also makes an easy puzzle slower. Both are worth having, and it is worth knowing which one you are reaching for.

<!-- @approach -->
### Scan the Row, Column and Box

<!-- @idea -->
Find the first empty cell, and for each digit check it against the nine cells of its row, its column and its box.

<!-- @steps -->
1. Walk the grid to the first empty cell.
2. For each digit 1–9, scan the row, the column and the 3×3 box for that digit.
3. If none contains it, place it and recurse.
4. If the recursion fails, clear the cell and try the next digit.
5. No empty cell left means the grid is solved.

<!-- @complexity -->
- time: O(9^E) worst case for E empty cells, each placement costing O(27)
- space: O(E) recursion
- note: The definition of the rules written out. Correct on every puzzle tested — and **4.13 seconds** on a grid built to defeat row-order search.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool solveSudoku(vector<vector<char>>& g) {
    for (int r = 0; r < 9; r++) {
        for (int c = 0; c < 9; c++) {
            if (g[r][c] != '.') continue;
            for (char v = '1'; v <= '9'; v++) {
                bool ok = true;
                for (int k = 0; k < 9 && ok; k++) {
                    if (g[r][k] == v || g[k][c] == v) ok = false;
                    if (g[(r / 3) * 3 + k / 3][(c / 3) * 3 + k % 3] == v) ok = false;
                }
                if (!ok) continue;
                g[r][c] = v;
                if (solveSudoku(g)) return true;
                g[r][c] = '.';
            }
            return false;
        }
    }
    return true;
}
```

<!-- @annotations -->
- 12: `(r / 3) * 3 + k / 3` and `(c / 3) * 3 + k % 3` walk the nine cells of the box. Dropping either `* 3` collapses nine boxes into five and makes every puzzle report unsolvable.
- 19: Returning false after exhausting the digits for **this** cell, not continuing to the next — the `return` inside the loop is what makes it backtrack rather than skip.
- 17: Clearing the cell before trying the next digit. Without it the failed digit stays and blocks everything below.
- 22: Falling out of both loops means no empty cell exists, so the grid is complete.

<!-- @code java -->
```java
static boolean solveSudoku(char[][] g) {
    for (int r = 0; r < 9; r++) {
        for (int c = 0; c < 9; c++) {
            if (g[r][c] != '.') continue;
            for (char v = '1'; v <= '9'; v++) {
                boolean ok = true;
                for (int k = 0; k < 9 && ok; k++) {
                    if (g[r][k] == v || g[k][c] == v) ok = false;
                    if (g[(r / 3) * 3 + k / 3][(c / 3) * 3 + k % 3] == v) ok = false;
                }
                if (!ok) continue;
                g[r][c] = v;
                if (solveSudoku(g)) return true;
                g[r][c] = '.';
            }
            return false;
        }
    }
    return true;
}
```

<!-- @annotations -->
- 1: `char[][]` is a reference, so the grid is solved in place and the caller sees the result — which is what LeetCode 37 asks for.

<!-- @code python -->
```python
def solve_sudoku(g):
    for r in range(9):
        for c in range(9):
            if g[r][c] != ".":
                continue
            for v in "123456789":
                ok = True
                for k in range(9):
                    if g[r][k] == v or g[k][c] == v:
                        ok = False
                        break
                    if g[(r // 3) * 3 + k // 3][(c // 3) * 3 + k % 3] == v:
                        ok = False
                        break
                if not ok:
                    continue
                g[r][c] = v
                if solve_sudoku(g):
                    return True
                g[r][c] = "."
            return False
    return True
```

<!-- @annotations -->
- 12: `//` is integer division. Python's `/` yields a float and would raise on the index, which at least fails loudly rather than silently addressing the wrong box.

<!-- @approach -->
### Track Rows, Columns and Boxes as Bitmasks

<!-- @idea -->
Keep a nine-bit mask of the digits already used in each row, column and box, so testing a digit is one bitwise operation.

<!-- @steps -->
1. Scan the clues once and set a bit for each given digit in its row, column and box.
2. At each empty cell, the legal digits are the complement of the three masks combined.
3. Take the lowest set bit, place that digit, and set the three bits.
4. On failure, clear the cell and the three bits, and take the next bit.

<!-- @complexity -->
- time: O(9^E) worst case, each placement costing O(1)
- space: O(1) beyond the recursion
- note: Places **exactly the same values in the same order** as the scanning version — the tree is identical — and runs **6.18x to 8.76x** faster purely on per-node cost.

<!-- @code cpp -->
```cpp
#include <vector>
#include <functional>
using namespace std;

bool solveSudoku(vector<vector<char>>& g) {
    int row[9] = {0}, col[9] = {0}, box[9] = {0};
    for (int r = 0; r < 9; r++)
        for (int c = 0; c < 9; c++)
            if (g[r][c] != '.') {
                int bit = 1 << (g[r][c] - '1');
                row[r] |= bit; col[c] |= bit; box[(r / 3) * 3 + c / 3] |= bit;
            }

    function<bool(int)> go = [&](int pos) -> bool {
        while (pos < 81 && g[pos / 9][pos % 9] != '.') pos++;
        if (pos == 81) return true;

        int r = pos / 9, c = pos % 9, b = (r / 3) * 3 + c / 3;
        int avail = ~(row[r] | col[c] | box[b]) & 0x1FF;
        while (avail) {
            int bit = avail & -avail;
            avail -= bit;
            g[r][c] = (char)('1' + __builtin_ctz(bit));
            row[r] |= bit; col[c] |= bit; box[b] |= bit;
            if (go(pos + 1)) return true;
            g[r][c] = '.';
            row[r] ^= bit; col[c] ^= bit; box[b] ^= bit;
        }
        return false;
    };
    return go(0);
}
```

<!-- @annotations -->
- 19: `~(row | col | box) & 0x1FF` yields every legal digit at once. `0x1FF` is nine bits — masking is essential, since `~` sets all the higher bits too.
- 21: `avail & -avail` isolates the lowest set bit, so the loop visits each legal digit once without testing the illegal ones at all.
- 27: The three masks are cleared with `^=` rather than `&= ~bit`. Both work; XOR is correct only because the bit is known to be set, which it is.
- 15: Skipping filled cells in a `while` rather than recursing through them keeps the recursion depth equal to the number of empty cells.
- 11: The clue scan must use the same box formula as the search, or the initial masks disagree with the tests.

<!-- @code java -->
```java
static int[] row = new int[9], col = new int[9], box = new int[9];

static boolean solveSudoku(char[][] g) {
    Arrays.fill(row, 0); Arrays.fill(col, 0); Arrays.fill(box, 0);
    for (int r = 0; r < 9; r++)
        for (int c = 0; c < 9; c++)
            if (g[r][c] != '.') {
                int bit = 1 << (g[r][c] - '1');
                row[r] |= bit; col[c] |= bit; box[(r / 3) * 3 + c / 3] |= bit;
            }
    return go(g, 0);
}

static boolean go(char[][] g, int pos) {
    while (pos < 81 && g[pos / 9][pos % 9] != '.') pos++;
    if (pos == 81) return true;
    int r = pos / 9, c = pos % 9, b = (r / 3) * 3 + c / 3;
    int avail = ~(row[r] | col[c] | box[b]) & 0x1FF;
    while (avail != 0) {
        int bit = avail & -avail;
        avail -= bit;
        g[r][c] = (char) ('1' + Integer.numberOfTrailingZeros(bit));
        row[r] |= bit; col[c] |= bit; box[b] |= bit;
        if (go(g, pos + 1)) return true;
        g[r][c] = '.';
        row[r] ^= bit; col[c] ^= bit; box[b] ^= bit;
    }
    return false;
}
```

<!-- @annotations -->
- 4: The masks are static, so they must be reset on entry — otherwise a second call inherits the first puzzle's digits and reports unsolvable.

<!-- @code python -->
```python
def solve_sudoku(g):
    row = [0] * 9
    col = [0] * 9
    box = [0] * 9
    for r in range(9):
        for c in range(9):
            if g[r][c] != ".":
                bit = 1 << (int(g[r][c]) - 1)
                row[r] |= bit
                col[c] |= bit
                box[(r // 3) * 3 + c // 3] |= bit

    def go(pos):
        while pos < 81 and g[pos // 9][pos % 9] != ".":
            pos += 1
        if pos == 81:
            return True
        r, c = pos // 9, pos % 9
        b = (r // 3) * 3 + c // 3
        avail = ~(row[r] | col[c] | box[b]) & 0x1FF
        while avail:
            bit = avail & -avail
            avail -= bit
            g[r][c] = str(bit.bit_length())
            row[r] |= bit; col[c] |= bit; box[b] |= bit
            if go(pos + 1):
                return True
            g[r][c] = "."
            row[r] ^= bit; col[c] ^= bit; box[b] ^= bit
        return False

    return go(0)
```

<!-- @annotations -->
- 20: `& 0x1FF` matters more in Python than in C++ — `~` on an int produces an unbounded negative, and without the mask the `while avail` loop would never terminate.
- 24: `bit.bit_length()` is already the digit: a bit in position 0 means the digit 1, so no `+ 1` is needed here.

<!-- @approach -->
### Fill the Most Constrained Cell First

<!-- @idea -->
Rather than taking cells in row order, always fill the empty cell that has the fewest legal digits — and stop immediately if any cell has none.

<!-- @steps -->
1. Scan the empty cells and count the legal digits for each.
2. Take the cell with the smallest count; a count of one means a forced move.
3. If any cell has zero candidates, this branch is dead — fail at once.
4. Try that cell's candidates and recurse.
5. No empty cell means solved.

<!-- @complexity -->
- time: O(9^E) worst case, with a far smaller tree in practice
- space: O(1) beyond the recursion
- note: **4,405x** fewer placements on a 17-clue puzzle and **950x** faster than scanning on the anti-brute-force grid. Its scan-for-the-best-cell costs O(81) per node, which makes it **slower than plain bitmasks on easy puzzles**.

<!-- @code cpp -->
```cpp
#include <vector>
#include <functional>
using namespace std;

bool solveSudoku(vector<vector<char>>& g) {
    int row[9] = {0}, col[9] = {0}, box[9] = {0};
    for (int r = 0; r < 9; r++)
        for (int c = 0; c < 9; c++)
            if (g[r][c] != '.') {
                int bit = 1 << (g[r][c] - '1');
                row[r] |= bit; col[c] |= bit; box[(r / 3) * 3 + c / 3] |= bit;
            }

    function<bool()> go = [&]() -> bool {
        int best = -1, bestCount = 10, bestAvail = 0;
        for (int p = 0; p < 81; p++) {
            int r = p / 9, c = p % 9;
            if (g[r][c] != '.') continue;
            int b = (r / 3) * 3 + c / 3;
            int a = ~(row[r] | col[c] | box[b]) & 0x1FF;
            int cnt = __builtin_popcount(a);
            if (cnt < bestCount) { bestCount = cnt; best = p; bestAvail = a; }
            if (cnt <= 1) break;
        }
        if (best < 0) return true;
        if (bestCount == 0) return false;

        int r = best / 9, c = best % 9, b = (r / 3) * 3 + c / 3;
        int avail = bestAvail;
        while (avail) {
            int bit = avail & -avail;
            avail -= bit;
            g[r][c] = (char)('1' + __builtin_ctz(bit));
            row[r] |= bit; col[c] |= bit; box[b] |= bit;
            if (go()) return true;
            g[r][c] = '.';
            row[r] ^= bit; col[c] ^= bit; box[b] ^= bit;
        }
        return false;
    };
    return go();
}
```

<!-- @annotations -->
- 22: The whole heuristic. Choosing the cell with the fewest candidates places 4,405x fewer values on a 17-clue puzzle than taking cells in row order.
- 23: `cnt <= 1` stops the scan early — a forced cell cannot be improved on, and a zero-candidate cell is about to fail anyway.
- 26: Detecting a cell with **no** candidates prunes the branch immediately, without placing anything. This is the half of the heuristic that does the pruning; picking the smallest is the half that orders the work.
- 16: Scanning all 81 cells at every node is the price. It is why this version is *slower* than plain bitmasks on an easy grid — 3,041ns against 1,833.
- 25: `best < 0` means no empty cell was found, so the grid is complete. It must be tested before `bestCount`, which is still 10 in that case.

<!-- @code java -->
```java
static int[] row = new int[9], col = new int[9], box = new int[9];

static boolean solveSudoku(char[][] g) {
    Arrays.fill(row, 0); Arrays.fill(col, 0); Arrays.fill(box, 0);
    for (int r = 0; r < 9; r++)
        for (int c = 0; c < 9; c++)
            if (g[r][c] != '.') {
                int bit = 1 << (g[r][c] - '1');
                row[r] |= bit; col[c] |= bit; box[(r / 3) * 3 + c / 3] |= bit;
            }
    return go(g);
}

static boolean go(char[][] g) {
    int best = -1, bestCount = 10, bestAvail = 0;
    for (int p = 0; p < 81; p++) {
        int r = p / 9, c = p % 9;
        if (g[r][c] != '.') continue;
        int b = (r / 3) * 3 + c / 3;
        int a = ~(row[r] | col[c] | box[b]) & 0x1FF;
        int cnt = Integer.bitCount(a);
        if (cnt < bestCount) { bestCount = cnt; best = p; bestAvail = a; }
        if (cnt <= 1) break;
    }
    if (best < 0) return true;
    if (bestCount == 0) return false;

    int r = best / 9, c = best % 9, b = (r / 3) * 3 + c / 3;
    int avail = bestAvail;
    while (avail != 0) {
        int bit = avail & -avail;
        avail -= bit;
        g[r][c] = (char) ('1' + Integer.numberOfTrailingZeros(bit));
        row[r] |= bit; col[c] |= bit; box[b] |= bit;
        if (go(g)) return true;
        g[r][c] = '.';
        row[r] ^= bit; col[c] ^= bit; box[b] ^= bit;
    }
    return false;
}
```

<!-- @annotations -->
- 21: `Integer.bitCount` compiles to a single `popcnt` instruction on any modern JVM, so counting candidates is not the expensive part — scanning all 81 cells is.

<!-- @code python -->
```python
def solve_sudoku(g):
    row = [0] * 9
    col = [0] * 9
    box = [0] * 9
    for r in range(9):
        for c in range(9):
            if g[r][c] != ".":
                bit = 1 << (int(g[r][c]) - 1)
                row[r] |= bit
                col[c] |= bit
                box[(r // 3) * 3 + c // 3] |= bit

    def go():
        best, best_count, best_avail = -1, 10, 0
        for p in range(81):
            r, c = p // 9, p % 9
            if g[r][c] != ".":
                continue
            b = (r // 3) * 3 + c // 3
            a = ~(row[r] | col[c] | box[b]) & 0x1FF
            cnt = bin(a).count("1")
            if cnt < best_count:
                best_count, best, best_avail = cnt, p, a
            if cnt <= 1:
                break
        if best < 0:
            return True
        if best_count == 0:
            return False

        r, c = best // 9, best % 9
        b = (r // 3) * 3 + c // 3
        avail = best_avail
        while avail:
            bit = avail & -avail
            avail -= bit
            g[r][c] = str(bit.bit_length())
            row[r] |= bit; col[c] |= bit; box[b] |= bit
            if go():
                return True
            g[r][c] = "."
            row[r] ^= bit; col[c] ^= bit; box[b] ^= bit
        return False

    return go()
```

<!-- @annotations -->
- 21: `bin(a).count("1")` is Python's popcount before 3.10; `a.bit_count()` is the modern form and is markedly faster.

<!-- @example -->

<!-- @input -->
```
5 3 . | . 7 . | . . .
6 . . | 1 9 5 | . . .
. 9 8 | . . . | . 6 .
------+-------+------
8 . . | . 6 . | . . 3
4 . . | 8 . 3 | . . 1
7 . . | . 2 . | . . 6
------+-------+------
. 6 . | . . . | 2 8 .
. . . | 4 1 9 | . . 5
. . . | . 8 . | . 7 9
```

<!-- @output -->
```
5 3 4 | 6 7 8 | 9 1 2
6 7 2 | 1 9 5 | 3 4 8
1 9 8 | 3 4 2 | 5 6 7
------+-------+------
8 5 9 | 7 6 1 | 4 2 3
4 2 6 | 8 5 3 | 7 9 1
7 1 3 | 9 2 4 | 8 5 6
------+-------+------
9 6 1 | 5 3 7 | 2 8 4
2 8 7 | 4 1 9 | 6 3 5
3 4 5 | 2 8 6 | 1 7 9
```

<!-- @why -->
The LeetCode 37 example. Row-order search places 4,208 values to reach it; taking the most constrained cell first places 51 — barely more than the 51 empty cells themselves, meaning almost every choice was forced.

<!-- @walkthrough -->
```
row order      4,208 values placed     254,334 ns (scanning)
                                        32,916 ns (bitmasks)
most constrained  51 values placed        3,625 ns

51 placements for 51 empty cells means the search
essentially never had to guess: at each step some cell had
exactly one candidate, so it filled that one and moved on.

That is what "most constrained first" buys — it finds the
forced moves instead of stumbling into them.
```

<!-- @example -->

<!-- @input -->
```
..............3.85..1.2.......5.7.....4...1...9.......5......73..2.1........4...9
```

<!-- @output -->
```
solved — but in 4.13 seconds by row order, 4.35 milliseconds with MRV
```

<!-- @why -->
A grid constructed specifically to defeat row-order backtracking: the top-left is almost empty, so a naive search fills it many ways before discovering that the constraints far away are violated.

<!-- @walkthrough -->
```
row order      69,175,316 values placed    4,131,996,542 ns  (4.13 s)
bitmasks       69,175,316 values placed      479,673,041 ns
most constrained   58,233 values placed        4,351,208 ns  (4.35 ms)

Note the first two rows place identical counts: the bitmask
version is the same search, done faster. MRV is a different
search — 1,188x fewer placements.

Scanning vs MRV end to end: 950x.
```

<!-- @example -->

<!-- @input -->
```
..3.2.6..9..3.5..1..18.64....81.29..7.......8..67.82....26.95..8..2.3..9..5.1.3..
```

<!-- @output -->
```
solved, and MRV is the slowest of the three
```

<!-- @why -->
An easy puzzle. The search finishes in 200 placements whatever you do, so MRV's per-node cost of scanning all 81 cells is pure overhead.

<!-- @walkthrough -->
```
scan        200 placements     11,333 ns
bitmasks    200 placements      1,833 ns    <- fastest
MRV          49 placements      3,041 ns

MRV places four times fewer values and still takes 66% longer,
because choosing each cell costs a scan of the whole grid.

The heuristic is a bet that the search is hard. On this grid
the bet loses.
```

<!-- @example -->

<!-- @input -->
```
a solver using  box = r/3 + c/3
```

<!-- @output -->
```
reports "unsolvable" on every valid puzzle
```

<!-- @why -->
That formula gives only five distinct values for nine boxes, so unrelated boxes share constraints. The grid becomes over-constrained and no completion exists.

<!-- @walkthrough -->
```
correct  (r/3)*3 + c/3        buggy  r/3 + c/3
  (0,0)->0 (0,4)->1 (0,8)->2    (0,0)->0 (0,4)->1 (0,8)->2
  (4,0)->3 (4,4)->4 (4,8)->5    (4,0)->1 (4,4)->2 (4,8)->3
  (8,0)->6 (8,4)->7 (8,8)->8    (8,0)->2 (8,4)->3 (8,8)->4

The top-right box and the bottom-left box both map to 2, so a
digit in one forbids it in the other.

Tested on five puzzles including LeetCode 37's own example:
UNSOLVABLE on all five. Loud, which is the good case.
```

<!-- @visualization custom -->

<!-- @description -->
Shows that bitmasking and cell-ordering are different kinds of improvement — one changes the cost per node, the other changes the tree — and where each pays.

<!-- @sampleInput -->
```json
{"primary":{"puzzle":"53..7....6..195....98....6.8...6...34..8.3..17...2...6.6....28....419..5....8..79","name":"LeetCode 37","emptyCells":51,"placements":{"rowOrder":4208,"mostConstrained":51},"note":"51 placements for 51 empty cells means the search essentially never had to guess - at each step some cell had exactly one candidate"},"theBoxIndex":{"correct":"(r / 3) * 3 + c / 3","buggy":"r / 3 + c / 3","table":{"correct":[["(0,0)->0","(0,4)->1","(0,8)->2"],["(4,0)->3","(4,4)->4","(4,8)->5"],["(8,0)->6","(8,4)->7","(8,8)->8"]],"buggy":[["(0,0)->0","(0,4)->1","(0,8)->2"],["(4,0)->1","(4,4)->2","(4,8)->3"],["(8,0)->2","(8,4)->3","(8,8)->4"]]},"problem":"only five distinct values for nine boxes - the top-right and bottom-left boxes collapse onto index 2, so a digit in one blocks the other","measured":"reports unsolvable on all five test puzzles including LeetCode 37's own example","verdict":"a loud failure, which is the good case"},"twoDifferentImprovements":{"bitmasks":{"what":"replace the 27-cell scan with one bitwise AND","changesTheTree":false,"evidence":[{"puzzle":"LeetCode 37","scanPlacements":4208,"bitmaskPlacements":4208},{"puzzle":"AI Escargot","scanPlacements":8969,"bitmaskPlacements":8969},{"puzzle":"anti-brute-force","scanPlacements":69175316,"bitmaskPlacements":69175316},{"puzzle":"17 clues","scanPlacements":26590293,"bitmaskPlacements":26590293}],"reading":"identical, because the two compute the same predicate and therefore make the same choices","gain":"6.18x to 8.76x, entirely per-node cost"},"mostConstrainedFirst":{"what":"fill the empty cell with the fewest legal digits","changesTheTree":true,"rows":[{"puzzle":"easy","rowOrder":200,"mrv":49,"ratio":"4x"},{"puzzle":"LeetCode 37","rowOrder":4208,"mrv":51,"ratio":"83x"},{"puzzle":"AI Escargot","rowOrder":8969,"mrv":219,"ratio":"41x"},{"puzzle":"anti-brute-force","rowOrder":69175316,"mrv":58233,"ratio":"1188x"},{"puzzle":"17 clues","rowOrder":26590293,"mrv":6036,"ratio":"4405x"}],"twoHalves":["picking the smallest count orders the work","detecting a zero-candidate cell prunes the branch immediately"]}},"wallClock":{"unit":"nanoseconds","rows":[{"puzzle":"easy","scan":11333,"bitmask":1833,"mrv":3041,"fastest":"bitmask"},{"puzzle":"LeetCode 37","scan":254334,"bitmask":32916,"mrv":3625,"fastest":"mrv"},{"puzzle":"AI Escargot","scan":634708,"bitmask":81375,"mrv":18125,"fastest":"mrv"},{"puzzle":"anti-brute-force","scan":4131996542,"bitmask":479673041,"mrv":4351208,"fastest":"mrv"},{"puzzle":"17 clues","scan":1555789417,"bitmask":177598209,"mrv":473458,"fastest":"mrv"}],"headline":"the anti-brute-force puzzle takes the scanning version 4.13 seconds and the MRV version 4.35 milliseconds - a factor of 950","theException":{"puzzle":"easy","mrv":3041,"bitmask":1833,"reading":"MRV places four times fewer values and still takes 66% longer, because choosing each cell costs a scan of all 81","lesson":"the heuristic is a bet that the search is hard, and on easy puzzles the bet loses"}},"theGeneralPoint":{"constantFactors":"found by thinking about the machine, and reliable - bitmasking always helps","searchOrder":"found by thinking about the problem, and not reliable - the same heuristic that turns 4 seconds into 4 milliseconds makes an easy puzzle slower","worthKnowing":"which of the two you are reaching for"},"assertions":["every row, column and box holds each of 1-9 exactly once","the box of (r,c) is (r/3)*3 + c/3","bitmasking does not change which values are tried or in what order","most-constrained-first changes the tree, not the per-node cost","a cell with zero candidates fails the branch immediately"]}
```

<!-- @highlights -->
- The box index is `(r/3)*3 + c/3`; dropping the `*3` gives **five** distinct values for nine boxes and reports every puzzle unsolvable.
- Bitmasking **does not change the tree** — identical placements, in identical order — and buys **6.18×–8.76×** in per-node cost.
- Most-constrained-first **does** change the tree: **4,405×** fewer placements on a 17-clue puzzle.
- The anti-brute-force grid: **4.13 seconds** by row order, **4.35 milliseconds** with MRV — a factor of **950**.
- On LeetCode 37, MRV places **51 values for 51 empty cells** — almost every move was forced.
- But on an easy puzzle **MRV is the slowest of the three**: it's a bet that the search is hard, and that bet can lose.

<!-- @edgeCases -->
- An already-solved grid — no empty cells, so the first check returns true.
- An empty grid — every cell free; MRV still solves it quickly, row order does not.
- An unsolvable grid — the search must exhaust everything to say so.
- A grid with a contradiction among the clues — the initial masks conflict; some solvers only discover this mid-search.
- A puzzle with multiple solutions — all three return the first one found, and which one depends on the search order.
- 17 clues — the theoretical minimum for a unique solution, and the hardest common case.
- A cell with zero candidates — MRV detects it before placing anything; row order finds out only on reaching that cell.
- `~` without `& 0x1FF` — in Python the loop never terminates; in C++ it sets bits above 9.
- Static masks reused across calls in Java — a second puzzle inherits the first's digits.

<!-- @pitfalls -->
- `r/3 + c/3` for the box index. Nine boxes become five and every puzzle reports unsolvable.
- Forgetting `& 0x1FF` after `~`. In Python the `while avail` loop never ends.
- Not resetting static masks between calls in Java.
- Using `/` instead of `//` in Python for the indices. It yields a float and raises on the index.
- Expecting bitmasking to prune. It places exactly the same values — the gain is per-node only.
- Applying MRV unconditionally. On an easy grid it is slower than plain bitmasks.
- Recursing through already-filled cells instead of skipping them in a loop. It deepens the recursion for nothing.
- Testing `bestCount == 0` before `best < 0`. A completed grid leaves `bestCount` at 10 and `best` at −1.
- Clearing a mask bit with `&= ~bit` when it may not be set. Here it always is, so `^=` is safe — but only here.

<!-- @doubt -->
### Does bitmasking prune anything?

<!-- @answer -->
No, and that is the point worth taking from this container. Measured across every test puzzle, the scanning version and the bitmask version place **exactly the same number of values** — 4,208 on LeetCode 37, 8,969 on AI Escargot, **69,175,316** on the anti-brute-force grid — and they place them in the same order, because they compute the same predicate and therefore make the same choices at every step. The entire gain is what a step costs: **6.18x to 8.76x**. That is the same relationship as N-Queens, where the scan, the boolean arrays and the bitmasks all explored an identical 856,189-node tree. It is worth being precise about, because "use bitmasks" and "use the most constrained cell" are usually recommended in the same breath, and only one of them is a search improvement.

<!-- @doubt -->
### How much does most-constrained-first actually help?

<!-- @answer -->
Between four times and four thousand, depending entirely on the puzzle. Measured in values placed: **200 to 49 on an easy grid (4x), 4,208 to 51 on LeetCode 37 (83x), 69,175,316 to 58,233 on the anti-brute-force grid (1,188x), and 26,590,293 to 6,036 on a 17-clue puzzle (4,405x)**. In wall clock the anti-brute-force grid goes from **4.13 seconds to 4.35 milliseconds**. The LeetCode 37 figure is the most revealing: **51 placements for 51 empty cells** means the search essentially never guessed — at every step some cell had exactly one legal digit, and MRV found it. The heuristic has two halves that are worth separating: choosing the smallest candidate count *orders* the work, and noticing a cell with **zero** candidates *prunes* the branch before anything is placed. The second half is what kills bad branches early.

<!-- @doubt -->
### Is MRV ever a bad idea?

<!-- @answer -->
Yes, and the measurement is unambiguous. On an easy puzzle it placed **49 values against plain bitmasking's 200 — four times fewer — and still took 66% longer**, 3,041ns against 1,833. Choosing the best cell means scanning all 81 positions and counting candidates at every single node, so the per-node cost rises sharply; when the search would have finished in 200 placements regardless, that bookkeeping is pure overhead. The heuristic is a bet that the search is hard enough for better ordering to repay the cost of computing it. On hard puzzles the bet pays 950 to one; on easy ones it loses about a third. If you needed to solve many easy grids fast, the right structure would be to try plain bitmasking with a node budget and switch to MRV only when that budget is exceeded — which is worth knowing as a pattern, not just for Sudoku.

<!-- @doubt -->
### Why is the box index `(r/3)*3 + c/3`?

<!-- @answer -->
Because it has to number nine boxes 0 to 8, and `r/3` and `c/3` are each already 0 to 2 — the box's row and column *within* the 3×3 arrangement of boxes. Combining two base-3 digits into one number means multiplying the more significant one by 3, exactly as with any positional numbering. Writing `r/3 + c/3` adds them instead, producing values 0 to 4 — five labels for nine boxes — so the top-right box (0,8) and the bottom-left box (8,0) both become 2, and a digit placed in one forbids it in the other. Measured on five puzzles including LeetCode 37's own example, that version reports **unsolvable on every one**, which is fortunate: an over-constrained solver fails loudly rather than returning a wrong grid. The same arithmetic appears when walking the nine cells *of* a box, `(r/3)*3 + k/3` and `(c/3)*3 + k%3`, and both `* 3`s are needed there too.

<!-- @doubt -->
### Which version should I write?

<!-- @answer -->
Bitmasks plus most-constrained-first, unless you know the puzzles are easy. Bitmasking is unconditional — it never changes the answer, never changes the search, and is always several times faster, so there is no case against it. MRV is conditional, and the honest summary is that it wins by up to **950x** on hard grids and loses by about **1.7x** on trivial ones. Since a solver is usually judged on its worst case rather than its best, MRV is the right default. What is worth carrying beyond Sudoku is the distinction the two illustrate: a constant-factor improvement is found by thinking about the machine and behaves predictably, while a search-order heuristic is found by thinking about the problem and does not — it can pay four thousandfold or cost you a third, and only measurement tells you which.
