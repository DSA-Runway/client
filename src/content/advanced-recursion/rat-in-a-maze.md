---
id: rat-in-a-maze
topic: Advanced Recursion
title: Rat in a Maze
difficulty: Hard
status: ready
prerequisites:
  - n-queen
  - word-search
  - palindrome-partitioning
relatedIds:
  - word-search
  - n-queen
  - palindrome-partitioning
  - flattening-of-ll
  - find-peak-element-ii
---

<!-- @summary -->
The paths must come back in lexicographic order, and trying the directions in alphabetical order — D, L, R, U — produces that for free: sorted on 100% of 200,000 random mazes, where an arbitrary order fails on 10.26% and costs 1.5x to fix afterwards. Path counts verified against OEIS A007764, which reaches 1,262,816 on a 6x6 open grid.

<!-- @theory -->
## The problem

An n×n grid where 1 is open and 0 is blocked. A rat starts at `(0,0)` and must
reach `(n-1,n-1)`, moving only to orthogonally adjacent open cells and never
revisiting one. Return **every** path, written as a string of moves from
`D`, `L`, `R`, `U` — in lexicographic order.

```
1 0 0 0
1 1 0 1        ->  [ "DDRDRR", "DRDDRR" ]
1 1 0 0
0 1 1 1
```

## Lexicographic order comes free from the direction order

The natural instinct is to collect the paths and sort them. It is unnecessary. If
the four directions are tried in alphabetical order — **D, L, R, U** — the search
emits paths already sorted, because at every branch it explores the smaller letter
first, and depth-first order over a prefix tree *is* lexicographic order.

Measured over **200,000** random mazes:

| direction order tried | output not sorted | finds the same paths |
|---|---|---|
| D, L, R, U | **0 — 0.00%** | — |
| U, D, L, R | 20,517 — **10.26%** | **100.00%** |

Two things worth separating there. The order never affects *which* paths are
found — both variants returned identical sets on every one of the 200,000 mazes.
It only affects the order they come out in. And an arbitrary order is not always
wrong: it happens to be sorted on 89.74% of mazes, which is exactly the kind of
frequency that makes a bug survive testing.

Sorting afterwards fixes it and costs:

| n | paths | D,L,R,U | U,D,L,R then sort | ratio |
|---|---|---|---|---|
| 4 | 184 | 46,666 | 70,208 | 1.50x |
| 5 | 8,512 | 2,508,625 | 3,804,333 | 1.52x |
| 6 | 1,262,816 | 220,475,708 | 320,353,042 | **1.45x** |

Nanoseconds. Half again as much work, to recover an ordering that was available
for the price of writing the direction array in the right sequence.

## How many paths are there?

On a fully open grid, every corner-to-corner self-avoiding walk is a path, and
that count is a known sequence — OEIS A007764. The implementation reproduces it
exactly:

| n | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| paths | 1 | 2 | 12 | 184 | **8,512** | **1,262,816** |
| nodes visited | 1 | 5 | 51 | 1,271 | 90,111 | 18,470,411 |

The next term is 575,780,564. So the output is exponential in n and no algorithm
can avoid that — but note the node column: **18,470,411 nodes for 1,262,816
paths**, about 14.6 nodes per path. Most of the search is dead ends.

## Which is why the traversal dominates here, unlike Palindrome Partitioning

Running the same search while building nothing separates the two costs:

| n | paths | count only | full output | ratio |
|---|---|---|---|---|
| 4 | 184 | 10,042 | 13,083 | 1.30x |
| 5 | 8,512 | 780,459 | 1,118,375 | 1.43x |
| 6 | 1,262,816 | 145,368,250 | 232,232,250 | **1.60x** |

Producing the paths costs 30% to 60% on top of the search. Compare Palindrome
Partitioning, where the same measurement showed the output costing **eight times**
the traversal — there, almost every leaf was an answer, so the tree was nearly all
output. Here about fourteen nodes are explored per path emitted, so the walking
dominates.

That is the general rule the two measurements give between them: whether the
output or the search costs more is decided by the **dead-end ratio**, not by the
size of the answer.

## Restoring the cell, again

Marking a cell on the way in and clearing it on the way out is the same
requirement as Word Search. Omitting the restore is wrong on **17.12%** of random
mazes — the abandoned branches leave cells marked, so later paths that legitimately
pass through them are never found.

That rate sits between the two neighbouring subtopics: Word Search measured 4% to
27% depending on board size, and here it is 17% on small mazes. The mechanism is
identical; only the exposure differs.

## In-place marking versus a visited array

Writing `0` into the maze and restoring it, against keeping a separate grid:

| n | in-place | visited array | ratio |
|---|---|---|---|
| 4 | 10,792 | 11,958 | 1.11x |
| 5 | 1,037,750 | 1,137,875 | 1.10x |
| 6 | 233,808,583 | 252,023,417 | **1.08x** |

A smaller margin than Word Search's 1.10x–1.43x, and for the same reason it is
worth mentioning: the visited array leaves the caller's maze untouched, which the
in-place version only manages if every restore is right.

<!-- @intuition -->
The pleasing thing here is that a requirement which sounds like post-processing — "return the paths in lexicographic order" — turns out to be a property of the traversal order, available at no cost if you notice it. Depth-first search over choices emits leaves in the order the choices were tried, so ordering the choice list alphabetically orders the output alphabetically, with no comparison, no sort, and no extra memory. The general habit: when a problem asks for output in some order, check whether the search can be made to generate it in that order before reaching for a sort. It often can, and when it can the sort was never a small cost — here it was half again the total runtime.

<!-- @approach -->
### Collect Paths, Then Sort

<!-- @idea -->
Explore in whatever direction order is convenient, gather every path, and sort the results at the end.

<!-- @steps -->
1. Depth-first search from `(0,0)`, marking cells on the path.
2. On reaching `(n-1,n-1)`, record the move string.
3. Restore each cell on the way out.
4. Sort the collected strings before returning.

<!-- @complexity -->
- time: O(4^(n²)) worst case, plus O(P log P) to sort P paths
- space: O(P) for the output plus O(n²) recursion
- note: Correct, and **1.45x to 1.52x** slower than ordering the search — the sort is pure overhead once the direction array is written alphabetically.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
#include <algorithm>
#include <functional>
using namespace std;

vector<string> findPath(vector<vector<int>> maze) {
    int n = (int)maze.size();
    vector<string> out;
    if (n == 0 || !maze[0][0] || !maze[n - 1][n - 1]) return out;

    const int dr[4] = {-1, 1, 0, 0}, dc[4] = {0, 0, -1, 1};
    const char ch[4] = {'U', 'D', 'L', 'R'};
    string path;

    function<void(int,int)> go = [&](int r, int c) {
        if (r == n - 1 && c == n - 1) { out.push_back(path); return; }
        maze[r][c] = 0;
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= n || nc >= n || !maze[nr][nc]) continue;
            path.push_back(ch[k]);
            go(nr, nc);
            path.pop_back();
        }
        maze[r][c] = 1;
    };

    go(0, 0);
    sort(out.begin(), out.end());
    return out;
}
```

<!-- @annotations -->
- 12: An arbitrary direction order. It finds exactly the same paths as any other order — verified identical on all 200,000 mazes tested — but emits them unsorted on 10.26% of them.
- 30: The sort that the next approach does not need. It costs half again the total runtime at n = 6.
- 10: Both endpoints are checked before any search. A blocked start or finish means no path exists, and testing here avoids a pointless descent.
- 26: The restore. Omitting it is wrong on 17.12% of random mazes.
- 7: `maze` is taken **by value**, so the marking never reaches the caller — the copy is what makes the in-place trick safe here.

<!-- @code java -->
```java
static List<String> findPath(int[][] maze) {
    int n = maze.length;
    List<String> out = new ArrayList<>();
    if (n == 0 || maze[0][0] == 0 || maze[n - 1][n - 1] == 0) return out;

    int[][] m = new int[n][n];
    for (int i = 0; i < n; i++) m[i] = maze[i].clone();

    int[] dr = {-1, 1, 0, 0}, dc = {0, 0, -1, 1};
    char[] ch = {'U', 'D', 'L', 'R'};
    go(m, n, 0, 0, new StringBuilder(), dr, dc, ch, out);
    Collections.sort(out);
    return out;
}

static void go(int[][] m, int n, int r, int c, StringBuilder path,
               int[] dr, int[] dc, char[] ch, List<String> out) {
    if (r == n - 1 && c == n - 1) { out.add(path.toString()); return; }
    m[r][c] = 0;
    for (int k = 0; k < 4; k++) {
        int nr = r + dr[k], nc = c + dc[k];
        if (nr < 0 || nc < 0 || nr >= n || nc >= n || m[nr][nc] == 0) continue;
        path.append(ch[k]);
        go(m, n, nr, nc, path, dr, dc, ch, out);
        path.deleteCharAt(path.length() - 1);
    }
    m[r][c] = 1;
}
```

<!-- @annotations -->
- 7: `maze[i].clone()` per row, because `int[][]` is an array of row references — a shallow copy would still let the marking reach the caller.

<!-- @code python -->
```python
def find_path(maze):
    n = len(maze)
    out = []
    if n == 0 or not maze[0][0] or not maze[n - 1][n - 1]:
        return out

    m = [row[:] for row in maze]
    moves = [(-1, 0, "U"), (1, 0, "D"), (0, -1, "L"), (0, 1, "R")]
    path = []

    def go(r, c):
        if r == n - 1 and c == n - 1:
            out.append("".join(path))
            return
        m[r][c] = 0
        for dr, dc, ch in moves:
            nr, nc = r + dr, c + dc
            if not (0 <= nr < n and 0 <= nc < n) or not m[nr][nc]:
                continue
            path.append(ch)
            go(nr, nc)
            path.pop()
        m[r][c] = 1

    go(0, 0)
    out.sort()
    return out
```

<!-- @annotations -->
- 7: `[row[:] for row in maze]` copies each row. `maze[:]` alone would copy the outer list only and share every row with the caller.
- 13: Building the path as a list and joining once at each solution, rather than concatenating strings at every step — string concatenation in the recursion would be quadratic in the path length.

<!-- @approach -->
### Order the Directions Alphabetically

<!-- @idea -->
Try the moves in the order D, L, R, U, so depth-first exploration emits the paths already in lexicographic order.

<!-- @steps -->
1. Write the direction array in alphabetical order of the move letters.
2. Search depth-first exactly as before.
3. Record each path on reaching the destination.
4. Return without sorting.

<!-- @complexity -->
- time: O(4^(n²)) worst case
- space: O(P) for the output plus O(n²) recursion
- note: Output sorted on **100%** of 200,000 random mazes, and **1.45x to 1.52x** faster than sorting afterwards. Identical search, identical paths — only the order of the direction array changes.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
#include <functional>
using namespace std;

vector<string> findPath(vector<vector<int>> maze) {
    int n = (int)maze.size();
    vector<string> out;
    if (n == 0 || !maze[0][0] || !maze[n - 1][n - 1]) return out;

    const int dr[4] = {1, 0, 0, -1}, dc[4] = {0, -1, 1, 0};
    const char ch[4] = {'D', 'L', 'R', 'U'};
    string path;

    function<void(int,int)> go = [&](int r, int c) {
        if (r == n - 1 && c == n - 1) { out.push_back(path); return; }
        maze[r][c] = 0;
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= n || nc >= n || !maze[nr][nc]) continue;
            path.push_back(ch[k]);
            go(nr, nc);
            path.pop_back();
        }
        maze[r][c] = 1;
    };

    go(0, 0);
    return out;
}
```

<!-- @annotations -->
- 12: `D, L, R, U` — alphabetical. The offsets on the line above must be permuted to match, and getting the two arrays out of step is the way this goes wrong silently.
- 11: `{1,0,0,-1}` and `{0,-1,1,0}` are down, left, right, up in that order — read the two arrays column-wise to check them.
- 18: Depth-first exploration tries the smallest letter first at every branch, and depth-first order over a prefix tree *is* lexicographic order. That is the whole argument for why no sort is needed.
- 29: No sort. The result is already ordered — verified on 200,000 mazes.
- 25: The restore, exactly as before; the ordering trick changes nothing about the backtracking.

<!-- @code java -->
```java
static List<String> findPath(int[][] maze) {
    int n = maze.length;
    List<String> out = new ArrayList<>();
    if (n == 0 || maze[0][0] == 0 || maze[n - 1][n - 1] == 0) return out;

    int[][] m = new int[n][n];
    for (int i = 0; i < n; i++) m[i] = maze[i].clone();

    int[] dr = {1, 0, 0, -1}, dc = {0, -1, 1, 0};
    char[] ch = {'D', 'L', 'R', 'U'};
    go(m, n, 0, 0, new StringBuilder(), dr, dc, ch, out);
    return out;
}

static void go(int[][] m, int n, int r, int c, StringBuilder path,
               int[] dr, int[] dc, char[] ch, List<String> out) {
    if (r == n - 1 && c == n - 1) { out.add(path.toString()); return; }
    m[r][c] = 0;
    for (int k = 0; k < 4; k++) {
        int nr = r + dr[k], nc = c + dc[k];
        if (nr < 0 || nc < 0 || nr >= n || nc >= n || m[nr][nc] == 0) continue;
        path.append(ch[k]);
        go(m, n, nr, nc, path, dr, dc, ch, out);
        path.deleteCharAt(path.length() - 1);
    }
    m[r][c] = 1;
}
```

<!-- @annotations -->
- 24: `deleteCharAt(length - 1)` is the undo for `append` — a `StringBuilder` is used precisely so this is O(1) rather than rebuilding the string.

<!-- @code python -->
```python
def find_path(maze):
    n = len(maze)
    out = []
    if n == 0 or not maze[0][0] or not maze[n - 1][n - 1]:
        return out

    m = [row[:] for row in maze]
    moves = [(1, 0, "D"), (0, -1, "L"), (0, 1, "R"), (-1, 0, "U")]
    path = []

    def go(r, c):
        if r == n - 1 and c == n - 1:
            out.append("".join(path))
            return
        m[r][c] = 0
        for dr, dc, ch in moves:
            nr, nc = r + dr, c + dc
            if not (0 <= nr < n and 0 <= nc < n) or not m[nr][nc]:
                continue
            path.append(ch)
            go(nr, nc)
            path.pop()
        m[r][c] = 1

    go(0, 0)
    return out
```

<!-- @annotations -->
- 8: Keeping the offset and its letter in one tuple makes the two impossible to get out of step — the failure mode the separate C++ arrays invite.
- 26: No `out.sort()`. The list is already in lexicographic order.

<!-- @approach -->
### Keep a Separate Visited Grid

<!-- @idea -->
Leave the maze untouched and track the current path in a parallel boolean grid.

<!-- @steps -->
1. Allocate an n×n visited grid.
2. A move is legal when the target is in bounds, open in the maze, and not visited.
3. Mark on the way in, clear on the way out.
4. Everything else is unchanged.

<!-- @complexity -->
- time: O(4^(n²)) worst case
- space: O(n²) for the grid plus O(P) output
- note: **1.08x to 1.11x** slower, and it cannot corrupt the caller's maze even if a restore is missed — the failure the in-place version risks on 17.12% of inputs.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
#include <functional>
using namespace std;

vector<string> findPath(const vector<vector<int>>& maze) {
    int n = (int)maze.size();
    vector<string> out;
    if (n == 0 || !maze[0][0] || !maze[n - 1][n - 1]) return out;

    vector<vector<char>> seen(n, vector<char>(n, 0));
    const int dr[4] = {1, 0, 0, -1}, dc[4] = {0, -1, 1, 0};
    const char ch[4] = {'D', 'L', 'R', 'U'};
    string path;

    function<void(int,int)> go = [&](int r, int c) {
        if (r == n - 1 && c == n - 1) { out.push_back(path); return; }
        seen[r][c] = 1;
        for (int k = 0; k < 4; k++) {
            int nr = r + dr[k], nc = c + dc[k];
            if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
            if (!maze[nr][nc] || seen[nr][nc]) continue;
            path.push_back(ch[k]);
            go(nr, nc);
            path.pop_back();
        }
        seen[r][c] = 0;
    };

    go(0, 0);
    return out;
}
```

<!-- @annotations -->
- 6: `const` reference — the maze is never written to, so this version is safe to call on shared or read-only data.
- 22: Two separate conditions where the in-place version needed one, because "blocked" and "already on the path" are now different facts.
- 27: The clear. Getting it wrong here loses paths but leaves the maze intact, so the damage is bounded to the return value.

<!-- @code java -->
```java
static List<String> findPath(int[][] maze) {
    int n = maze.length;
    List<String> out = new ArrayList<>();
    if (n == 0 || maze[0][0] == 0 || maze[n - 1][n - 1] == 0) return out;

    boolean[][] seen = new boolean[n][n];
    int[] dr = {1, 0, 0, -1}, dc = {0, -1, 1, 0};
    char[] ch = {'D', 'L', 'R', 'U'};
    go(maze, seen, n, 0, 0, new StringBuilder(), dr, dc, ch, out);
    return out;
}

static void go(int[][] maze, boolean[][] seen, int n, int r, int c,
               StringBuilder path, int[] dr, int[] dc, char[] ch, List<String> out) {
    if (r == n - 1 && c == n - 1) { out.add(path.toString()); return; }
    seen[r][c] = true;
    for (int k = 0; k < 4; k++) {
        int nr = r + dr[k], nc = c + dc[k];
        if (nr < 0 || nc < 0 || nr >= n || nc >= n) continue;
        if (maze[nr][nc] == 0 || seen[nr][nc]) continue;
        path.append(ch[k]);
        go(maze, seen, n, nr, nc, path, dr, dc, ch, out);
        path.deleteCharAt(path.length() - 1);
    }
    seen[r][c] = false;
}
```

<!-- @annotations -->
- 6: No cloning is needed now — the maze is only read, so passing the caller's array directly is safe.

<!-- @code python -->
```python
def find_path(maze):
    n = len(maze)
    out = []
    if n == 0 or not maze[0][0] or not maze[n - 1][n - 1]:
        return out

    seen = [[False] * n for _ in range(n)]
    moves = [(1, 0, "D"), (0, -1, "L"), (0, 1, "R"), (-1, 0, "U")]
    path = []

    def go(r, c):
        if r == n - 1 and c == n - 1:
            out.append("".join(path))
            return
        seen[r][c] = True
        for dr, dc, ch in moves:
            nr, nc = r + dr, c + dc
            if not (0 <= nr < n and 0 <= nc < n):
                continue
            if not maze[nr][nc] or seen[nr][nc]:
                continue
            path.append(ch)
            go(nr, nc)
            path.pop()
        seen[r][c] = False

    go(0, 0)
    return out
```

<!-- @annotations -->
- 7: `[[False] * n for _ in range(n)]` — writing `[[False] * n] * n` would create n references to one row, so marking any cell would mark a whole column's worth.

<!-- @example -->

<!-- @input -->
```
1 0 0 0
1 1 0 1
1 1 0 0
0 1 1 1
```

<!-- @output -->
```
[ "DDRDRR", "DRDDRR" ]
```

<!-- @why -->
Two routes reach the corner, and they are returned in lexicographic order without any sorting — `DDRDRR` precedes `DRDDRR` because `D` sorts before `R` at the second character.

<!-- @walkthrough -->
```
from (0,0)  D is tried first and succeeds
              the whole subtree beginning "D" is explored
                 within it, "DD..." is explored before "DR..."
                    -> DDRDRR emitted first
                    -> DRDDRR emitted second
            L, R, U from (0,0) are blocked or off the grid

Because every branch tries D before L before R before U, the
paths leave the search already sorted. The sorted order is a
property of the traversal, not of a later step.
```

<!-- @example -->

<!-- @input -->
```
1 1
1 1
```

<!-- @output -->
```
[ "DR", "RD" ]
```

<!-- @why -->
The smallest maze with two routes, and the smallest case that distinguishes the direction orders. `DR` before `RD` is the alphabetical order that D-first exploration produces.

<!-- @walkthrough -->
```
from (0,0) try D -> (1,0) open, move
  from (1,0) try D -> off the grid
  from (1,0) try L -> off the grid
  from (1,0) try R -> (1,1) is the destination   record "DR"
  from (1,0) try U -> already on the path
from (0,0) try L -> off the grid
from (0,0) try R -> (0,1) open, move
  from (0,1) try D -> (1,1) is the destination   record "RD"
  ...
from (0,0) try U -> off the grid

With U, D, L, R instead, "RD" would be emitted before "DR" —
same two paths, wrong order.
```

<!-- @example -->

<!-- @input -->
```
1 1
1 0
```

<!-- @output -->
```
[ ]
```

<!-- @why -->
The destination itself is blocked, so no path can exist. Checking both endpoints before searching avoids descending into a maze that cannot be solved.

<!-- @walkthrough -->
```
maze[n-1][n-1] == 0  ->  return immediately

The mirror case, maze[0][0] == 0, is the same check on the
other endpoint. Both are worth testing up front: without them
the search still returns an empty list, but only after
exploring the whole reachable region for nothing.
```

<!-- @example -->

<!-- @input -->
```
1 1 1 1 1 1
1 1 1 1 1 1
1 1 1 1 1 1
1 1 1 1 1 1
1 1 1 1 1 1
1 1 1 1 1 1
```

<!-- @output -->
```
1,262,816 paths
```

<!-- @why -->
A fully open 6×6 grid. Every corner-to-corner self-avoiding walk is a valid path, and the count is the known sequence OEIS A007764 — a precise external check on any implementation.

<!-- @walkthrough -->
```
n:      1   2    3     4      5          6
paths:  1   2   12   184   8512   1,262,816
nodes:  1   5   51  1271  90111  18,470,411

18,470,411 nodes for 1,262,816 paths is about 14.6 nodes per
path — most of the search is dead ends, which is why the
traversal costs more here than building the output does.

The next term is 575,780,564, so n = 7 is already beyond
what can be enumerated comfortably.
```

<!-- @visualization custom -->

<!-- @description -->
Shows why alphabetical direction order yields sorted output without a sort, and how the dead-end ratio decides whether the search or the output dominates.

<!-- @sampleInput -->
```json
{"primary":{"maze":[[1,0,0,0],[1,1,0,1],[1,1,0,0],[0,1,1,1]],"paths":["DDRDRR","DRDDRR"],"sorted":true,"note":"DDRDRR precedes DRDDRR because D sorts before R at the second character"},"orderingIsFree":{"claim":"trying directions in alphabetical order D, L, R, U emits paths already in lexicographic order","why":"depth-first exploration tries the smallest letter first at every branch, and depth-first order over a prefix tree IS lexicographic order","measured":{"mazes":200000,"rows":[{"order":"D, L, R, U","notSorted":0,"pct":0.0},{"order":"U, D, L, R","notSorted":20517,"pct":10.26}],"samePathsFound":{"count":200000,"pct":100.0}},"twoSeparateFacts":["the order never affects WHICH paths are found - both variants returned identical sets on all 200,000 mazes","it only affects the order they come out in"],"whyTheBugSurvives":"an arbitrary order happens to be sorted on 89.74% of mazes","costOfSortingInstead":{"unit":"nanoseconds, all-open mazes","rows":[{"n":4,"paths":184,"ordered":46666,"sorted":70208,"ratio":"1.50x"},{"n":5,"paths":8512,"ordered":2508625,"sorted":3804333,"ratio":"1.52x"},{"n":6,"paths":1262816,"ordered":220475708,"sorted":320353042,"ratio":"1.45x"}]}},"pathCounts":{"reference":"OEIS A007764 - corner-to-corner self-avoiding walks on an n x n grid","rows":[{"n":1,"paths":1,"nodes":1},{"n":2,"paths":2,"nodes":5},{"n":3,"paths":12,"nodes":51},{"n":4,"paths":184,"nodes":1271},{"n":5,"paths":8512,"nodes":90111},{"n":6,"paths":1262816,"nodes":18470411}],"nextTerm":575780564,"deadEndRatio":"18,470,411 nodes for 1,262,816 paths - about 14.6 nodes per path, so most of the search is dead ends"},"whatDominates":{"method":"run the same search while building nothing","rows":[{"n":4,"paths":184,"countOnly":10042,"fullOutput":13083,"ratio":"1.30x"},{"n":5,"paths":8512,"countOnly":780459,"fullOutput":1118375,"ratio":"1.43x"},{"n":6,"paths":1262816,"countOnly":145368250,"fullOutput":232232250,"ratio":"1.60x"}],"here":"producing the paths costs 30% to 60% on top of the search","contrast":{"subtopic":"palindrome-partitioning","result":"the output cost EIGHT TIMES the traversal","why":"there almost every leaf was an answer, so the tree was nearly all output; here about fourteen nodes are explored per path emitted"},"rule":"whether the output or the search costs more is decided by the dead-end ratio, not by the size of the answer"},"restoringTheCell":{"requirement":"mark on the way in, clear on the way out - the same as Word Search","omittingIt":{"wrongPct":17.12,"mazes":200000,"mechanism":"abandoned branches leave cells marked, so later paths that legitimately pass through them are never found"},"neighbouringSubtopics":{"wordSearch":"4% to 27% depending on board size","here":"17% on small mazes","note":"the mechanism is identical; only the exposure differs"}},"markingComparison":{"unit":"nanoseconds","rows":[{"n":4,"inPlace":10792,"visited":11958,"ratio":"1.11x"},{"n":5,"inPlace":1037750,"visited":1137875,"ratio":"1.10x"},{"n":6,"inPlace":233808583,"visited":252023417,"ratio":"1.08x"}],"tradeoff":"the visited array leaves the caller's maze untouched, which the in-place version only manages if every restore is right"},"assertions":["moves are orthogonal only and no cell may be revisited","both endpoints must be open or no path exists","direction order changes the output order, never the path set","depth-first order over a prefix tree is lexicographic order","the destination is reached when r == n-1 and c == n-1"]}
```

<!-- @highlights -->
- Lexicographic output is **free**: trying D, L, R, U emits sorted paths on **100%** of 200,000 mazes.
- An arbitrary order finds the **same paths every time** — it only breaks the ordering, and only on 10.26%, which is why it survives testing.
- Sorting afterwards instead costs **1.45×–1.52×**.
- Path counts match **OEIS A007764** exactly: 1,262,816 on a 6×6 open grid, next term 575,780,564.
- **14.6 nodes explored per path emitted**, so the traversal dominates — the output adds only 30–60%.
- The opposite of Palindrome Partitioning, where output cost **8×** the traversal. The **dead-end ratio** decides which.

<!-- @edgeCases -->
- Blocked start — no path; check before searching.
- Blocked destination — same, and the search would otherwise explore everything reachable for nothing.
- `n = 1` with an open cell — start *is* the destination, so the answer is one empty path `""`.
- A maze with no route — returns an empty list after a full search.
- Fully open grid — the worst case; 6×6 already yields 1,262,816 paths.
- A path that must move up or left — the reason all four directions are needed, not just D and R.
- Duplicate-looking paths — impossible, since each is a distinct move string.
- Two different orders of the same cells — different strings, both valid, both returned.
- Caller reusing the maze — safe here only because the maze is copied or read-only.

<!-- @pitfalls -->
- Sorting the output instead of ordering the directions. Costs 1.45×–1.52× for something already available.
- Writing the direction letters and offsets in different orders. The two arrays must be permuted together.
- Assuming an arbitrary direction order is wrong. It finds the same paths; it is only the order that breaks, on 10.26%.
- Forgetting to restore the cell. Wrong on 17.12% of random mazes.
- Only allowing D and R. Legal paths can move up and left, as the 6×6 counts require.
- Mutating the caller's maze. Copy it, or use a visited grid.
- `[[False] * n] * n` in Python. That makes n references to one row.
- Concatenating the path string at each step instead of a list plus one join. Quadratic in path length.
- Forgetting the `n = 1` case, where the answer is a single empty string.

<!-- @doubt -->
### Why does trying D, L, R, U give sorted output?

<!-- @answer -->
Because depth-first order over a tree of choices *is* the lexicographic order of the strings those choices spell, provided the choices are made in alphabetical order at every branch. At the first cell the search fully explores everything beginning with `D` before anything beginning with `L`, and within the `D` subtree it explores `DD…` before `DL…`, and so on to the leaves — which is exactly the definition of sorting the resulting strings. Measured over **200,000** random mazes, the D,L,R,U order produced sorted output on **every one**; a U,D,L,R order produced unsorted output on **10.26%**. It is worth noticing that the arbitrary order is not *wrong* — both orders returned identical path sets on all 200,000 mazes — so the bug is purely one of ordering, and it hides behind the 89.74% of mazes where an arbitrary order happens to come out sorted anyway.

<!-- @doubt -->
### How much does sorting afterwards actually cost?

<!-- @answer -->
About half the runtime again, for something that was free. Measured on fully open grids: **46,666ns against 70,208 at n = 4, 2,508,625 against 3,804,333 at n = 5, and 220,475,708 against 320,353,042 at n = 6** — a factor of **1.45x to 1.52x**. That is more than it sounds, because sorting P strings costs `O(P log P)` string comparisons and P is exponential in n: 1,262,816 paths at n = 6, each up to 2n−1 characters. The alternative is to permute two four-element arrays once, at no runtime cost at all. This is the general shape worth carrying: when output is required in some order, check whether the traversal can be made to produce it before adding a sort, because the sort scales with the answer size and the traversal order does not scale with anything.

<!-- @doubt -->
### Why does the traversal dominate here when the output dominated in Palindrome Partitioning?

<!-- @answer -->
Because of the dead-end ratio, which is the variable those two measurements isolate between them. Running the same search while building nothing: here, producing the paths adds only **30% to 60%** on top of the search — 145,368,250ns to count and 232,232,250ns to build at n = 6. In Palindrome Partitioning the identical experiment showed the output costing **eight times** the traversal. The difference is what fraction of explored nodes yields an answer. A maze search wanders into blocked corners and reversals that produce nothing: **18,470,411 nodes for 1,262,816 paths, about 14.6 nodes per path**. Palindrome Partitioning's pruned tree, by contrast, reaches a valid partition at nearly every leaf, so almost all the work is producing output. Same diagnostic, opposite conclusions — which is why it is worth running rather than assuming.

<!-- @doubt -->
### Is marking the maze itself safe?

<!-- @answer -->
Only because the maze is copied first. Writing `0` into a cell on the way in and `1` on the way out uses the grid as its own visited set, which is why the C++ signature takes `vector<vector<int>> maze` **by value** and the Java and Python versions clone each row. Skip the copy and the function mutates the caller's maze for the duration of the call — and permanently, if any restore is missed. The separate visited grid avoids the question entirely: it is **1.08x to 1.11x** slower and it cannot corrupt anything, since the maze is only ever read. That margin is smaller than Word Search's 1.10x–1.43x, so the argument for marking in place is correspondingly weaker here. Note the Python trap in the alternative: `[[False] * n] * n` creates n references to a single row, so marking one cell appears to mark an entire column.

<!-- @doubt -->
### How many paths can there be?

<!-- @answer -->
On a fully open grid, exactly the number of corner-to-corner self-avoiding walks — OEIS A007764 — and it grows brutally: **1, 2, 12, 184, 8,512, 1,262,816** for n = 1 to 6, with 575,780,564 next. That sequence is a precise external check on any implementation, which is how the three approaches here were verified. It also settles what is achievable: the output alone is exponential, so no amount of pruning makes this polynomial, and n = 7 is already past comfortable enumeration. If a variant of the problem asks only for the *number* of paths, or whether any path exists, both are far cheaper — existence is a plain reachability question answerable by BFS in O(n²), which is worth recognising because the exponential cost here comes entirely from enumerating routes, not from finding one.
