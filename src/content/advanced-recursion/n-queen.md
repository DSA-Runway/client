---
id: n-queen
topic: Advanced Recursion
title: N Queen
difficulty: Hard
status: ready
prerequisites:
  - word-search
  - palindrome-partitioning
  - subsets-i
relatedIds:
  - word-search
  - palindrome-partitioning
  - generate-parentheses
  - combination-sum
  - power-set-bit-manipulation
---

<!-- @summary -->
Three ways to write this explore exactly the same search tree — 856,189 nodes at n = 12, identical to the node — and differ only in what a node costs, which spans 11.8x from a linear scan to bitmasks. The one thing that must be right is the diagonal indexing: folding the two anti-diagonals together with abs(r - c) returns zero solutions for every n above 5.

<!-- @theory -->
## The problem

Place n queens on an n×n board so that no two share a row, a column, or a
diagonal. Return every distinct arrangement.

```
n = 4  ->  2 solutions

    . Q . .          . . Q .
    . . . Q          Q . . .
    Q . . .          . . . Q
    . . Q .          . Q . .
```

Placing one queen per row is not a restriction — two queens in a row would attack
each other — so the search is: for each row in turn, pick a column that no earlier
queen attacks.

## The three constraints, and the one that is easy to get wrong

A queen at `(r, c)` attacks another at `(r', c')` when they share a column, or when
they share a diagonal. The two diagonals have neat closed forms:

```
same column       c' == c
same ↘ diagonal   r' + c' == r + c        (r + c is constant along it)
same ↙ diagonal   r' - c' == r - c        (r - c is constant along it)
```

`r + c` runs from 0 to 2n−2, so it indexes an array of size 2n−1 directly.
`r − c` runs from **−(n−1) to n−1**, so it needs shifting: `r - c + n - 1`.

Reaching for `abs(r - c)` instead is the trap. It maps the diagonals at `r−c = 2`
and `r−c = −2` onto the same slot, so placing a queen on one blocks the other, and
the search rejects arrangements that are perfectly legal. Verified against the
known solution counts:

| n | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 10 | 12 |
|---|---|---|---|---|---|---|---|---|---|---|
| correct | 1 | 0 | 0 | 2 | 10 | 4 | 40 | 92 | 724 | 14,200 |
| with `abs(r-c)` | 1 | 0 | 0 | **0** | **4** | **0** | **0** | **0** | **0** | **0** |

It returns **zero solutions for every n from 6 upward**. That is at least a loud
failure — but it agrees on n = 1, 2 and 3, which is exactly the range someone
checks by hand.

## Three implementations, one search tree

The obvious progression is to make the "is this square attacked?" test cheaper:
scan the queens placed so far, or keep three boolean arrays, or keep three
bitmasks. None of them changes what gets explored:

| n | scan nodes | array nodes | bitmask nodes |
|---|---|---|---|
| 8 | 2,057 | 2,057 | 2,057 |
| 10 | 35,539 | 35,539 | 35,539 |
| 12 | **856,189** | **856,189** | **856,189** |

Identical, to the node. Every version prunes at exactly the same points, because
they compute the same predicate. What differs is the price of a node:

| n | solutions | scan | arrays | bitmask | scan/arrays | arrays/bitmask |
|---|---|---|---|---|---|---|
| 8 | 92 | 132,292 | 80,208 | **13,791** | 1.65x | 5.82x |
| 10 | 724 | 3,311,292 | 1,893,166 | **263,750** | 1.75x | 7.18x |
| 12 | 14,200 | 68,529,958 | 39,434,125 | **5,895,167** | 1.74x | 6.69x |
| 13 | 73,712 | 388,214,833 | 224,095,167 | **32,816,167** | 1.73x | 6.83x |

Nanoseconds. End to end that is **11.8x** at n = 13, entirely from constant
factors — a rare case in this topic where the whole difference is per-node cost
rather than pruning.

The two steps are worth different amounts. Replacing the O(r) scan with O(1)
lookups is worth only **1.65x to 1.75x**, because the scan is short in practice —
most placements fail after a few comparisons. Replacing three array lookups with
three bit tests is worth **5.8x to 7.2x**, which is much more: the masks live in
registers, the availability set is computed with one `and`, and iterating the safe
columns becomes `avail & -avail` instead of a loop with three memory reads per
column.

## Mirror symmetry halves the tree

Reflecting a board left-to-right maps solutions onto solutions, so any arrangement
whose first queen sits in the right half mirrors one whose first queen sits in the
left half. Searching only the left half and doubling the count gives exactly the
same answer for half the work:

| n | full nodes | symmetric nodes |
|---|---|---|
| 8 | 2,057 | **1,028** |
| 10 | 35,539 | **17,769** |
| 12 | 856,189 | **428,094** |

Exactly half, and the counts agree — 14,200 either way at n = 12. For odd n the
middle column is its own mirror and must be counted once rather than doubled,
which is where this is usually got wrong. Unlike everything above, this one does
change the tree.

<!-- @intuition -->
This problem is unusually clean about separating two things that are normally tangled: how much of the space you explore, and what it costs to explore a node. The three implementations here explore the identical tree — 856,189 nodes, not approximately but exactly — so every difference between 388ms and 33ms is the price of a node. That is the opposite of the previous subtopic, where reversing the word left the per-node cost unchanged and shrank the tree by four orders of magnitude. Both kinds of improvement are real and they compose, but they are found by different means: one by thinking about the problem, the other by thinking about the machine. Knowing which one you are looking at tells you where to look.

<!-- @approach -->
### Scan the Placed Queens

<!-- @idea -->
Keep the chosen column for each row so far, and before placing a queen, compare it against all of them.

<!-- @steps -->
1. Work row by row, keeping the column chosen for each earlier row.
2. For a candidate column, compare against every queen already placed.
3. Reject if any shares the column, or if the row gap equals the column gap.
4. Place, recurse to the next row, then undo.
5. Reaching row n means a complete arrangement.

<!-- @complexity -->
- time: O(n!) nodes, each costing O(n)
- space: O(n)
- note: The definition of "attacked" written out, and it needs no index arithmetic — which is why it cannot fall into the diagonal trap. Explores the identical tree to the other two and runs **11.8x** slower than bitmasks at n = 13.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
#include <cstdlib>
using namespace std;

static void go(int r, int n, vector<int>& col, vector<vector<string>>& out) {
    if (r == n) {
        vector<string> board;
        for (int c : col) board.push_back(string(c, '.') + "Q" + string(n - c - 1, '.'));
        out.push_back(board);
        return;
    }
    for (int c = 0; c < n; c++) {
        bool ok = true;
        for (int p = 0; p < r && ok; p++)
            if (col[p] == c || abs(col[p] - c) == r - p) ok = false;
        if (!ok) continue;
        col[r] = c;
        go(r + 1, n, col, out);
    }
}

vector<vector<string>> solveNQueens(int n) {
    vector<vector<string>> out;
    vector<int> col(n, -1);
    go(0, n, col, out);
    return out;
}
```

<!-- @annotations -->
- 16: `abs(col[p] - c) == r - p` is the diagonal test as a distance comparison — two queens are on a diagonal exactly when the row gap equals the column gap. No index shifting, so no offset to get wrong.
- 15: `p < r` scans only the rows already filled; `col` beyond row r holds stale values from abandoned branches.
- 18: No undo is needed here, because `col[r]` is overwritten by the next candidate and never read beyond row `r`.
- 9: The board strings are built only at a complete arrangement, so the O(n²) formatting is paid once per solution rather than once per node.

<!-- @code java -->
```java
static void go(int r, int n, int[] col, List<List<String>> out) {
    if (r == n) {
        List<String> board = new ArrayList<>();
        for (int c : col) {
            char[] row = new char[n];
            Arrays.fill(row, '.');
            row[c] = 'Q';
            board.add(new String(row));
        }
        out.add(board);
        return;
    }
    for (int c = 0; c < n; c++) {
        boolean ok = true;
        for (int p = 0; p < r && ok; p++)
            if (col[p] == c || Math.abs(col[p] - c) == r - p) ok = false;
        if (!ok) continue;
        col[r] = c;
        go(r + 1, n, col, out);
    }
}

static List<List<String>> solveNQueens(int n) {
    List<List<String>> out = new ArrayList<>();
    go(0, n, new int[n], out);
    return out;
}
```

<!-- @annotations -->
- 6: Building each row from a `char[]` avoids the quadratic string concatenation that repeated `+` would produce inside the loop.

<!-- @code python -->
```python
def solve_n_queens(n):
    out = []
    col = [-1] * n

    def go(r):
        if r == n:
            out.append(["." * c + "Q" + "." * (n - c - 1) for c in col])
            return
        for c in range(n):
            if any(col[p] == c or abs(col[p] - c) == r - p for p in range(r)):
                continue
            col[r] = c
            go(r + 1)

    go(0)
    return out
```

<!-- @annotations -->
- 10: `any(... for p in range(r))` short-circuits on the first attacking queen, so a rejected column usually costs far less than r comparisons.

<!-- @approach -->
### Three Boolean Arrays

<!-- @idea -->
Keep one flag per column and one per diagonal in each direction, so the safety test is three lookups instead of a scan.

<!-- @steps -->
1. Keep `usedCol[n]`, `diag1[2n-1]` indexed by `r + c`, and `diag2[2n-1]` indexed by `r - c + n - 1`.
2. A square is safe when all three flags are clear.
3. Set them, recurse, then clear them.
4. The flags are the only state; the columns chosen are tracked separately for output.

<!-- @complexity -->
- time: O(n!) nodes, each costing O(1)
- space: O(n)
- note: **1.65x to 1.75x** faster than scanning — a smaller gain than it looks, because the scan short-circuits early in practice. This is where the `r - c + n - 1` shift has to be right.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
using namespace std;

static void go(int r, int n, vector<int>& col,
               vector<char>& usedCol, vector<char>& diag1, vector<char>& diag2,
               vector<vector<string>>& out) {
    if (r == n) {
        vector<string> board;
        for (int c : col) board.push_back(string(c, '.') + "Q" + string(n - c - 1, '.'));
        out.push_back(board);
        return;
    }
    for (int c = 0; c < n; c++) {
        int d1 = r + c, d2 = r - c + n - 1;
        if (usedCol[c] || diag1[d1] || diag2[d2]) continue;
        usedCol[c] = diag1[d1] = diag2[d2] = 1;
        col[r] = c;
        go(r + 1, n, col, usedCol, diag1, diag2, out);
        usedCol[c] = diag1[d1] = diag2[d2] = 0;
    }
}

vector<vector<string>> solveNQueens(int n) {
    vector<vector<string>> out;
    vector<int> col(n, -1);
    vector<char> usedCol(n, 0), diag1(2 * n - 1, 0), diag2(2 * n - 1, 0);
    go(0, n, col, usedCol, diag1, diag2, out);
    return out;
}
```

<!-- @annotations -->
- 15: `r + c` needs no shift because it is already 0 to 2n−2; `r - c` runs from −(n−1) to n−1 and must be shifted by `n - 1`. Writing `abs(r - c)` instead folds two distinct diagonals together and returns **zero** solutions for every n above 5.
- 20: All three flags are cleared on the way out. Unlike the scanning version, this one carries state that genuinely must be undone.
- 16: Three array reads and no loop — the O(1) test that replaces the scan.
- 27: `2 * n - 1` slots, because there are that many diagonals in each direction.

<!-- @code java -->
```java
static void go(int r, int n, int[] col, boolean[] usedCol,
               boolean[] diag1, boolean[] diag2, List<List<String>> out) {
    if (r == n) {
        List<String> board = new ArrayList<>();
        for (int c : col) {
            char[] row = new char[n];
            Arrays.fill(row, '.');
            row[c] = 'Q';
            board.add(new String(row));
        }
        out.add(board);
        return;
    }
    for (int c = 0; c < n; c++) {
        int d1 = r + c, d2 = r - c + n - 1;
        if (usedCol[c] || diag1[d1] || diag2[d2]) continue;
        usedCol[c] = diag1[d1] = diag2[d2] = true;
        col[r] = c;
        go(r + 1, n, col, usedCol, diag1, diag2, out);
        usedCol[c] = diag1[d1] = diag2[d2] = false;
    }
}

static List<List<String>> solveNQueens(int n) {
    List<List<String>> out = new ArrayList<>();
    go(0, n, new int[n], new boolean[n], new boolean[2 * n - 1], new boolean[2 * n - 1], out);
    return out;
}
```

<!-- @annotations -->
- 17: Java's chained assignment sets all three to the same value in one statement, exactly as in C++.

<!-- @code python -->
```python
def solve_n_queens(n):
    out = []
    col = [-1] * n
    used_col = [False] * n
    diag1 = [False] * (2 * n - 1)
    diag2 = [False] * (2 * n - 1)

    def go(r):
        if r == n:
            out.append(["." * c + "Q" + "." * (n - c - 1) for c in col])
            return
        for c in range(n):
            d1, d2 = r + c, r - c + n - 1
            if used_col[c] or diag1[d1] or diag2[d2]:
                continue
            used_col[c] = diag1[d1] = diag2[d2] = True
            col[r] = c
            go(r + 1)
            used_col[c] = diag1[d1] = diag2[d2] = False

    go(0)
    return out
```

<!-- @annotations -->
- 13: `r - c + n - 1` — in Python a negative index would not raise, it would wrap to the end of the list and silently corrupt a different diagonal's flag.
- 19: Python's chained assignment binds all three names to `False` in one statement.

<!-- @approach -->
### Bitmask

<!-- @idea -->
Hold the three constraint sets as integers, compute the safe columns of a row with one bitwise expression, and iterate them by extracting the lowest set bit.

<!-- @steps -->
1. Carry three masks: occupied columns, and the two diagonal sets projected onto the current row.
2. `avail = full & ~(cols | d1 | d2)` is the set of safe columns.
3. Take its lowest set bit with `avail & -avail`, place there, clear it, repeat.
4. Recurse with `cols | bit`, `(d1 | bit) << 1`, and `(d2 | bit) >> 1` — the shifts move each diagonal onto the next row.

<!-- @complexity -->
- time: O(n!) nodes, each costing a few register operations
- space: O(n) recursion
- note: **5.8x to 7.2x** faster than the boolean arrays, and 11.8x faster than scanning, on the identical search tree. The shifts are what make the diagonal bookkeeping disappear.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

static void go(int r, int n, int full, int cols, int d1, int d2,
               vector<int>& col, vector<vector<int>>& out) {
    if (r == n) { out.push_back(col); return; }
    int avail = full & ~(cols | d1 | d2);
    while (avail) {
        int bit = avail & -avail;
        avail -= bit;
        col[r] = __builtin_ctz(bit);
        go(r + 1, n, full, cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1, col, out);
    }
}

vector<vector<int>> solveNQueens(int n) {
    vector<vector<int>> out;
    vector<int> col(n, -1);
    go(0, n, (1 << n) - 1, 0, 0, 0, col, out);
    return out;
}
```

<!-- @annotations -->
- 7: One `and` produces every safe column at once, where the array version reads three flags per column and the scanning version walks the placed queens.
- 9: `avail & -avail` isolates the lowest set bit — two's complement makes `-avail` flip everything above that bit, so the `and` leaves exactly it.
- 12: The shifts are the whole trick: a ↘ diagonal moves one column right as the row advances, so shifting the mask left keeps it aligned with the current row, and the ↙ diagonal shifts the other way. `& full` discards the bit that has walked off the board; the right shift needs no mask because bits fall off the bottom. No index arithmetic is needed at all — the question `abs(r - c)` gets wrong is never asked.
- 6: This version records column indices rather than formatted boards. Turning a column list into the `.Q..` strings is a separate O(n²) step, kept out of the search so a node stays cheap.
- 19: `(1 << n) - 1` is n low bits set. For n = 32 this overflows a signed int — a 64-bit type is needed, though n that large is far beyond feasible anyway.

<!-- @code java -->
```java
static void go(int r, int n, int full, int cols, int d1, int d2,
               int[] col, List<int[]> out) {
    if (r == n) { out.add(col.clone()); return; }
    int avail = full & ~(cols | d1 | d2);
    while (avail != 0) {
        int bit = avail & -avail;
        avail -= bit;
        col[r] = Integer.numberOfTrailingZeros(bit);
        go(r + 1, n, full, cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >>> 1, col, out);
    }
}

static List<int[]> solveNQueens(int n) {
    List<int[]> out = new ArrayList<>();
    go(0, n, (1 << n) - 1, 0, 0, 0, new int[n], out);
    return out;
}
```

<!-- @annotations -->
- 9: `>>>` and not `>>`. Java's `>>` is arithmetic and would smear the sign bit; here the masks stay positive for n < 31, but the unsigned shift is the one that means what it says.
- 3: `col.clone()` is the copy — adding `col` itself stores a reference that the rest of the search overwrites.

<!-- @code python -->
```python
def solve_n_queens(n):
    out = []
    col = [-1] * n
    full = (1 << n) - 1

    def go(r, cols, d1, d2):
        if r == n:
            out.append(col[:])
            return
        avail = full & ~(cols | d1 | d2)
        while avail:
            bit = avail & -avail
            avail -= bit
            col[r] = bit.bit_length() - 1
            go(r + 1, cols | bit, ((d1 | bit) << 1) & full, (d2 | bit) >> 1)

    go(0, 0, 0, 0)
    return out
```

<!-- @annotations -->
- 14: `bit.bit_length() - 1` recovers the column index from a single set bit, which is Python's equivalent of a count-trailing-zeros instruction.
- 10: `~` on a Python int yields a negative number of unbounded width, but the `full &` in front confines the result to n bits, so the expression is still correct.

<!-- @example -->

<!-- @input -->
```
n = 4
```

<!-- @output -->
```
. Q . .        . . Q .
. . . Q        Q . . .
Q . . .        . . . Q
. . Q .        . Q . .
```

<!-- @why -->
The smallest n with any solution. Two arrangements exist and they are mirror images of each other, which is the symmetry that lets the search be halved.

<!-- @walkthrough -->
```
row 0, col 0   place
  row 1, col 0   attacked (column)
  row 1, col 1   attacked (diagonal ↙)
  row 1, col 2   place  ->  dead end at row 2
  row 1, col 3   place  ->  dead end at row 2
row 0, col 1   place
  row 1, col 0   attacked (diagonal ↘)
  row 1, col 1   attacked (column)
  row 1, col 2   attacked (diagonal ↙)
  row 1, col 3   place  ->  leads to solution 1
row 0, col 2   place  ->  leads to solution 2
row 0, col 3   place  ->  no solution below

The two solutions come from first-row columns 1 and 2 — a
mirror pair, since column 1 reflects onto column 2.
```

<!-- @example -->

<!-- @input -->
```
n = 3
```

<!-- @output -->
```
(no solutions)
```

<!-- @why -->
Every placement in row 0 leaves row 1 with no safe column. It is the smallest board where the answer is empty rather than trivial, and the largest n on which the `abs(r - c)` bug still agrees with a correct implementation.

<!-- @walkthrough -->
```
row 0, col 0  ->  row 1 has cols 1 (↙ diagonal) and 2 free... col 2 free
                  ->  row 2 has nothing free
row 0, col 1  ->  row 1 has nothing free at all
row 0, col 2  ->  mirror of col 0, same dead end

0 solutions.

n = 2 and n = 3 both give 0, and n = 1 gives 1. All three
are also what the buggy abs(r - c) version reports — which
is why checking small boards by hand does not catch it.
```

<!-- @example -->

<!-- @input -->
```
n = 8
```

<!-- @output -->
```
92 solutions, found in 2,057 nodes
```

<!-- @why -->
The classical case. Worth knowing as a check: 92 is the number every correct implementation must produce, and 2,057 is the node count all three approaches here visit.

<!-- @walkthrough -->
```
all three implementations:  2,057 nodes,  92 solutions

  scan the placed queens      132,292 ns
  three boolean arrays         80,208 ns     1.65x
  bitmask                      13,791 ns     5.82x further

Identical tree. The 9.6x between the first and last row is
entirely the cost of deciding whether one square is safe.

With the mirror symmetry: 1,028 nodes, still 92 solutions.
```

<!-- @example -->

<!-- @input -->
```
n = 6, using abs(r - c) for the second diagonal
```

<!-- @output -->
```
0 solutions   (correct answer: 4)
```

<!-- @why -->
The smallest n where the diagonal bug produces an outright wrong count rather than agreeing by luck. From n = 6 upward it reports zero for every board size.

<!-- @walkthrough -->
```
correct    n = 4:2  5:10  6:4  7:40  8:92  10:724  12:14200
abs(r-c)   n = 4:0  5:4   6:0  7:0   8:0   10:0    12:0

abs(r - c) maps the diagonals r-c = +2 and r-c = -2 to the
same slot, so a queen on one blocks the other. Over-constrained,
the search finds nothing.

The fix is a shift, not an absolute value:
    d2 = r - c + n - 1        range 0 .. 2n-2
```

<!-- @visualization custom -->

<!-- @description -->
Shows that the three implementations explore an identical tree at three different per-node prices, and why the second diagonal needs a shift rather than an absolute value.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"solutions":[[".Q..","...Q","Q...","..Q."],["..Q.","Q...","...Q",".Q.."]],"count":2,"note":"the two arrangements are mirror images, which is the symmetry that halves the search"},"theThreeConstraints":{"attacks":[{"kind":"same column","test":"c' == c"},{"kind":"same ↘ diagonal","test":"r' + c' == r + c","note":"r + c is constant along it"},{"kind":"same ↙ diagonal","test":"r' - c' == r - c","note":"r - c is constant along it"}],"indexing":{"rPlusC":{"range":"0 to 2n-2","needsShift":false},"rMinusC":{"range":"-(n-1) to n-1","needsShift":true,"correct":"r - c + n - 1"}},"oneQueenPerRow":"not a restriction - two queens in a row would attack each other"},"theDiagonalTrap":{"wrong":"abs(r - c)","why":"maps the diagonals at r-c = 2 and r-c = -2 onto the same slot, so placing a queen on one blocks the other","effect":"over-constrained; the search rejects perfectly legal arrangements","counts":[{"n":1,"correct":1,"withAbs":1},{"n":2,"correct":0,"withAbs":0},{"n":3,"correct":0,"withAbs":0},{"n":4,"correct":2,"withAbs":0},{"n":5,"correct":10,"withAbs":4},{"n":6,"correct":4,"withAbs":0},{"n":7,"correct":40,"withAbs":0},{"n":8,"correct":92,"withAbs":0},{"n":10,"correct":724,"withAbs":0},{"n":12,"correct":14200,"withAbs":0}],"reading":"zero solutions for every n from 6 upward","whyItHides":"it agrees on n = 1, 2 and 3 - exactly the range someone checks by hand"},"sameTreeThreePrices":{"nodeCounts":[{"n":8,"scan":2057,"arrays":2057,"bitmask":2057},{"n":10,"scan":35539,"arrays":35539,"bitmask":35539},{"n":12,"scan":856189,"arrays":856189,"bitmask":856189}],"identical":"to the node - every version prunes at exactly the same points, because they compute the same predicate","timings":{"unit":"nanoseconds","rows":[{"n":8,"solutions":92,"scan":132292,"arrays":80208,"bitmask":13791,"scanOverArrays":"1.65x","arraysOverBitmask":"5.82x"},{"n":10,"solutions":724,"scan":3311292,"arrays":1893166,"bitmask":263750,"scanOverArrays":"1.75x","arraysOverBitmask":"7.18x"},{"n":12,"solutions":14200,"scan":68529958,"arrays":39434125,"bitmask":5895167,"scanOverArrays":"1.74x","arraysOverBitmask":"6.69x"},{"n":13,"solutions":73712,"scan":388214833,"arrays":224095167,"bitmask":32816167,"scanOverArrays":"1.73x","arraysOverBitmask":"6.83x"}]},"endToEnd":"11.8x at n = 13, entirely from constant factors","whyTheStepsDiffer":{"scanToArrays":"only 1.65x to 1.75x, because the scan short-circuits - most placements fail after a few comparisons","arraysToBitmask":"5.8x to 7.2x, because the masks live in registers, the availability set is one `and`, and iterating safe columns is avail & -avail instead of a loop with three memory reads per column"}},"mirrorSymmetry":{"idea":"reflecting a board left-to-right maps solutions onto solutions","effect":"any arrangement whose first queen sits in the right half mirrors one whose first queen sits in the left half","rows":[{"n":8,"fullNodes":2057,"symmetricNodes":1028},{"n":10,"fullNodes":35539,"symmetricNodes":17769},{"n":12,"fullNodes":856189,"symmetricNodes":428094}],"exactlyHalf":true,"countsAgree":"14,200 either way at n = 12","oddN":"the middle column is its own mirror and must be counted once rather than doubled - where this is usually got wrong","unlikeTheOthers":"this one does change the tree"},"contrastWithWordSearch":{"here":"three implementations, identical tree, all the difference is per-node cost","wordSearch":"reversing the word left the per-node cost unchanged and shrank the tree by four orders of magnitude","lesson":"both kinds of improvement are real and they compose, but they are found by different means - one by thinking about the problem, the other about the machine"},"assertions":["one queen per row is forced, not assumed","r + c is constant along a ↘ diagonal and needs no shift","r - c is constant along a ↙ diagonal and ranges over -(n-1)..n-1","all three implementations explore identical trees","n = 8 has exactly 92 solutions"]}
```

<!-- @highlights -->
- All three implementations explore an **identical** tree — 856,189 nodes at n = 12, exactly — so the whole 11.8× spread is per-node cost.
- Scan → boolean arrays is only **1.65×–1.75×**; arrays → bitmask is **5.8×–7.2×**.
- `abs(r - c)` for the second diagonal returns **zero solutions for every n ≥ 6** — and agrees on n = 1, 2, 3, the range checked by hand.
- The fix is a shift: `r - c + n - 1`, since `r - c` ranges over −(n−1) to n−1.
- Mirror symmetry halves the tree exactly (856,189 → 428,094) and is the only change here that alters what's explored.
- n = 8 has **92 solutions in 2,057 nodes** — a useful check on any implementation.

<!-- @edgeCases -->
- `n = 1` — one solution, and the buggy diagonal version agrees.
- `n = 2` and `n = 3` — no solutions, and the buggy version agrees on both.
- `n = 4` — the smallest board with solutions, and the smallest where the bug shows.
- `n = 6` — the smallest board where the bug reports zero against a correct count of 4.
- Odd n with the symmetry — the middle column is its own mirror and must not be doubled.
- `n = 0` — vacuously one arrangement, the empty one; most statements exclude it.
- `n >= 32` with 32-bit masks — `(1 << n) - 1` overflows; unreachable in practice since n = 15 already takes minutes.
- Building board strings at every node rather than at solutions — turns an O(n) node into O(n²).
- Java's `>>` instead of `>>>` on the diagonal mask — arithmetic shift smears the sign bit.

<!-- @pitfalls -->
- `abs(r - c)` for the anti-diagonal. Folds two diagonals into one and returns zero solutions above n = 5.
- Forgetting the `+ n - 1` shift. In C++ a negative index is undefined; in Python it silently wraps and corrupts another diagonal's flag.
- Sizing the diagonal arrays `n` instead of `2n - 1`. There are 2n−1 diagonals in each direction.
- Not clearing the three flags on the way out. The scanning version needs no undo, so the habit does not transfer.
- Counting the middle column twice when exploiting mirror symmetry on odd n.
- Formatting the board at every node instead of at each solution.
- Expecting the O(1) safety test to be a large win. It is 1.65×–1.75×; the bitmask step is where the speed is.
- `>>` instead of `>>>` in Java on the diagonal mask.
- Storing the column array by reference in the output. It is overwritten by the rest of the search.

<!-- @doubt -->
### Why does `abs(r - c)` break the diagonal test?

<!-- @answer -->
Because it identifies two different diagonals. The anti-diagonals are the sets where `r - c` is constant, and that value runs from `-(n-1)` to `n-1` — so a board has 2n−1 of them. Taking the absolute value maps `r - c = 2` and `r - c = -2` to the same index, so a queen sitting on one of those diagonals marks the other as attacked too. The search becomes over-constrained and rejects legal arrangements. Verified against the known counts, it returns **0 solutions for every n from 6 upward** and 4 instead of 10 at n = 5. The failure is loud, which is lucky — but it agrees with a correct implementation on n = 1, 2 and 3, and those are exactly the boards someone works through by hand before trusting the code. The fix is to shift rather than fold: `r - c + n - 1`, which maps the range onto `0 .. 2n-2`.

<!-- @doubt -->
### If all three explore the same tree, why bother with bitmasks?

<!-- @answer -->
Because at n = 13 it is the difference between 388 milliseconds and 33. The node counts really are identical — **2,057 at n = 8, 35,539 at n = 10, 856,189 at n = 12**, the same for all three — because they compute the same predicate and therefore prune in the same places. All the difference is what a node costs: **132,292ns, 80,208ns and 13,791ns** at n = 8. The two steps are not equal, though. Replacing the O(r) scan with three array lookups is worth only **1.65x to 1.75x**, because the scan short-circuits and most rejections happen after a couple of comparisons. Replacing the arrays with bitmasks is worth **5.8x to 7.2x**, because the three masks sit in registers, `full & ~(cols | d1 | d2)` yields every safe column in one operation, and iterating them with `avail & -avail` replaces a loop that did three memory reads per column. If you only remember one, it is that the second step is worth four times the first.

<!-- @doubt -->
### How do the bitmask shifts encode the diagonals?

<!-- @answer -->
They keep each diagonal set expressed relative to the current row, so no index arithmetic is needed. A ↘ diagonal moves one column to the right each time the row advances, so if `d1` marks the columns that diagonals currently block, then on the next row those same diagonals block the columns one position left — which is a shift. Passing `((d1 | bit) << 1) & full` adds the new queen's diagonal and re-projects the whole set onto the next row in one operation. The ↙ diagonal moves the other way, hence `(d2 | bit) >> 1`. The `& full` after the left shift drops the bit that has walked off the edge of the board; the right shift needs no mask because bits simply fall off the bottom. The elegance is that the "which diagonal is this" question — the one `abs(r - c)` gets wrong — never has to be asked.

<!-- @doubt -->
### Is the mirror symmetry worth using?

<!-- @answer -->
It halves the work exactly, and it is the only optimisation here that changes what gets explored. Reflecting a board left-to-right maps solutions onto solutions, so every arrangement whose first queen is in the right half is the mirror of one whose first queen is in the left half. Searching only the left half and doubling gives **1,028 nodes instead of 2,057 at n = 8, and 428,094 instead of 856,189 at n = 12** — precisely half — with identical counts, 14,200 either way. The catch is odd n: the middle column is its own mirror, so solutions starting there must be counted once, not doubled, and forgetting that inflates the answer. Note the contrast with everything else in this container: the three implementations differ only in per-node cost and leave the tree alone, while this one leaves the per-node cost alone and halves the tree. They compose — a symmetric bitmask search is faster than either alone.

<!-- @doubt -->
### Why place one queen per row rather than searching all squares?

<!-- @answer -->
Because it is forced, not chosen. Two queens on the same row attack each other, so any valid arrangement has exactly one queen in each of the n rows — searching square by square would generate the same arrangements many times over and waste most of the tree rediscovering that rows must be distinct. Fixing one queen per row turns the problem from "choose n squares out of n²" into "choose a column for each row", which is n choices per level and at most n! leaves before any pruning. The same reduction is what makes the constraint bookkeeping simple: the row is implied by the recursion depth, so only the column and the two diagonals need tracking. Recognising a constraint that collapses the search space before you start is usually worth more than any amount of tuning afterwards — here it is the difference between C(64,8) ≈ 4.4 billion placements and 2,057 nodes at n = 8.
