---
id: pattern-22-concentric-number-rectangle
topic: Pattern Printing
title: Pattern 22 - Concentric Number Rectangle
difficulty: Medium
status: ready
prerequisites:
  - pattern-21-hollow-rectangle-pattern
  - pattern-12-number-crown-pattern
  - pattern-19-symmetric-void-pattern
  - nested-loops
relatedIds:
  - pattern-21-hollow-rectangle-pattern
  - pattern-12-number-crown-pattern
  - pattern-19-symmetric-void-pattern
  - pattern-1-rectangular-star-pattern
  - nested-loops
---

<!-- @summary -->
Print nested square rings numbered from the outside in — where a cell's value is its distance from the border rather than its row or column, the whole grid factors through one array of 2n-1 values, and eight-fold symmetry turns out to catch one mistake in four while the value histogram catches all of them.

<!-- @theory -->
## The problem

Print a (2n - 1) by (2n - 1) grid of nested square rings, numbered n on the
outside down to 1 at the centre.

```
n = 4      4 4 4 4 4 4 4
           4 3 3 3 3 3 4
           4 3 2 2 2 3 4
           4 3 2 1 2 3 4
           4 3 2 2 2 3 4
           4 3 3 3 3 3 4
           4 4 4 4 4 4 4
```

## The value is a distance

Every earlier pattern took its value from a row index, a column index, or their
parity. Here it comes from **how far the cell is from the nearest edge**:

```
cell(i, j) = n - min(i, j, 2n-2-i, 2n-2-j)
```

Those four terms are the distances to the top, left, bottom and right. Take the
smallest and subtract from n. Written out for n = 4, the distances are:

```
0 0 0 0 0 0 0
0 1 1 1 1 1 0
0 1 2 2 2 1 0
0 1 2 3 2 1 0
0 1 2 2 2 1 0
0 1 1 1 1 1 0
0 0 0 0 0 0 0
```

This is Pattern 21 with the question sharpened. That pattern asked **whether** a
cell's distance from the border is zero; this asks **what it is**.

## The whole grid factors through one array

Define the middle row's profile — the sequence that counts down to the centre and
back up:

```
C[k] = n - min(k, 2n-2-k)        n = 4:   C = [4, 3, 2, 1, 2, 3, 4]
```

Then every cell of the grid is

```
cell(i, j) = max(C[i], C[j])
```

Verified for every cell of every n from 1 to 40, with no exceptions. **One array
of 2n - 1 values generates all (2n - 1)² of them** — the grid is the max table of
that sequence against itself. It also removes the four-way minimum from the inner
loop, which is worth 2.7x to 2.8x on its own.

Two further consequences fall out:

- there are only **n distinct rows**, since row i depends on C[i] alone, and
  row i is identical to row 2n - 2 - i
- **every row is itself a palindrome**, since swapping j for 2n - 2 - j leaves
  C[j] unchanged

Both verified for every n from 1 to 25.

## The counts

| | |
|---|---|
| Cells | **(2n - 1)²** |
| Occurrences of value v, for v >= 2 | **8v - 8** |
| Occurrences of value 1 | **1** — the centre |

They add up: 1 + Σ(8v - 8) for v from 2 to n is 4n(n - 1) + 1, which is exactly
(2n - 1)². Verified for n = 2 to 25.

## Eight-fold symmetry, and how little it buys

This shape is invariant under every symmetry of the square — four rotations and
their reflections — verified for n = 1 to 25 with no exceptions. It is the most
symmetric thing in this topic, and as a check it is the weakest yet.

Measured against the correct output for every n from 1 to 25:

| Mistake | Wrong on | Cells | Histogram | Symmetry | Corner | Exact |
|---|---|---|---|---|---|---|
| `max` instead of `min` | 24/26 | never | n = 2 | **never** | n = 2 | n = 2 |
| Only two of the four terms | 24/26 | never | n = 2 | n = 2 | **never** | n = 2 |
| Counted outward from the centre | 24/26 | never | n = 2 | **never** | n = 2 | n = 2 |
| Grid sized 2n instead of 2n - 1 | 25/26 | n = 1 | n = 1 | **never** | **never** | n = 1 |

The full dihedral symmetry catches **one of four**. Three of these mistakes
produce shapes that are still perfectly symmetric — including one that numbers the
rings the wrong way round and one that is the wrong size entirely.

That is this topic's symmetry result stated as strongly as it can be. Pattern 9
found a palindrome check passing a bowtie; Pattern 17 found it passing four of
five; Pattern 19 found the width and the palindrome together passing an inside-out
block. Here eight independent symmetries pass three of four.

**The value histogram catches all four**, at n = 1 or n = 2 — which is worth
setting beside Pattern 18, where a histogram was the check that could *not*
distinguish two shapes. The difference is what the mistakes do: in Pattern 18 they
rearranged the same values, and here they change which values appear. A histogram
is exactly as useful as the errors are unlike a permutation.

## The columns stop lining up at n = 10

The rings are visually concentric only while every value is one character. From
n = 10 the values reach two, and the grid stops being a grid:

```
n = 10, row 1    10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10
n = 10, row 10   10 9 8 7 6 5 4 3 2 1 2 3 4 5 6 7 8 9 10
```

The rows are no longer even the same width. This is the fifth pattern in the topic
where n = 10 matters, and the most visible: everything the picture is *for* stops
being true, while the numbers underneath remain exactly right.

## Caching the rows pays here, where it lost in Patterns 8 and 9

Only n distinct rows exist across 2n - 1 lines, so each is used about twice.
Building all n once and indexing into them is a real trade — Θ(n²) characters held
instead of one row. Measured:

| n | Per-cell distance | Profile array | Distinct rows cached |
|---|---|---|---|
| 300 | 14.09ms | 5.07ms | 2.68ms |
| 700 | 77.90ms | 28.45ms | 14.70ms |
| 1,500 | 360.54ms | 132.27ms | 70.20ms |

| n | One row held | n distinct rows held |
|---|---|---|
| 1,500 | 12,784 characters | **19,176,000** |

So caching is worth **1.9x** for n times the memory. Patterns 8 and 9 measured the
same move — store the rows and replay them — coming out **slower** as well as
larger.

The difference is what a row costs to rebuild. There a row was two bulk fills of
identical characters, so regenerating it was nearly free and storing it bought
nothing. Here a row is 2n - 1 integer-to-text conversions, which is real work, so
not repeating it is worth something. The rule is about the cost of regeneration,
not about whether storing is good.

Python agrees on the shape: 5x for the profile array and a further 2.0x to 2.1x
for the cache.

<!-- @intuition -->
The last pattern in this topic is the one where the value stops being about position and starts being about geometry — a cell knows only how far it is from the edge, and everything else follows. That is why the whole grid collapses into one sequence and a maximum: two cells at depths a and b sit on the ring of the shallower one. It is also, fittingly, the pattern that finishes the argument the topic has been making about checks. This shape has more structure than anything before it — eight symmetries, exact counts, a closed form for every cell — and three of its four natural mistakes survive the most impressive of those properties untouched. What catches them is not the elegant invariant but the plain question of which numbers appear and how often.

<!-- @approach -->
### Per-Cell Distance

<!-- @idea -->
For every cell, take the smallest of its four distances to the edges and subtract it from n.

<!-- @steps -->
1. Let the grid width be 2n minus one.
2. Loop the row index across the width, then the column index.
3. Take the minimum of the row, the column, and their distances to the far edges.
4. Print n minus that minimum, with a space before all but the first value.
5. Print a newline at the end of each row.

<!-- @complexity -->
- time: O(n^2) cells, with a four-way minimum and a conversion at each
- space: O(1)
- note: The direct transcription of the definition, and the slowest. Measured 360.54ms at n = 1,500 against 132.27ms using the profile array — 2.7x to 2.8x, all of it from removing the four-way minimum from the inner loop.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <algorithm>
using namespace std;

void pattern(int n) {
    int w = 2 * n - 1;
    for (int i = 0; i < w; i++) {
        for (int j = 0; j < w; j++) {
            if (j) cout << ' ';
            cout << n - min(min(i, j), min(w - 1 - i, w - 1 - j));
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: The grid is 2n - 1 on a side, not n — the rings need room on both sides of the centre.
- 10: The four distances are to the top, left, bottom and right. Taking the maximum instead numbers the rings outward and stays perfectly symmetric.

<!-- @code java -->
```java
static void pattern(int n) {
    int w = 2 * n - 1;
    for (int i = 0; i < w; i++) {
        for (int j = 0; j < w; j++) {
            if (j > 0) System.out.print(' ');
            System.out.print(n - Math.min(Math.min(i, j), Math.min(w - 1 - i, w - 1 - j)));
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 6: All four terms are needed. Dropping the two far-edge distances leaves a shape that is still symmetric about one diagonal.

<!-- @code python -->
```python
def pattern(n):
    w = 2 * n - 1
    for i in range(w):
        for j in range(w):
            if j > 0:
                print(" ", end="")
            print(n - min(i, j, w - 1 - i, w - 1 - j), end="")
        print()


# The value is a distance from the border, not a row or column
# index — which is what makes this Pattern 21 with the question
# sharpened from "is it zero" to "what is it".
```

<!-- @annotations -->
- 7: Python takes all four terms in one min call, which is the clearest statement of the definition.

<!-- @approach -->
### One Profile Array

<!-- @idea -->
Build the middle row's profile once, then read every cell as the larger of two of its entries.

<!-- @steps -->
1. Build the array C, where C at k is n minus the distance from k to the nearer end.
2. That array counts down from n to 1 and back up.
3. For each row i, the whole row is the larger of C at i and C at each column.
4. Build the row's text and print it.
5. No cell needs its four distances computed again.

<!-- @complexity -->
- time: O(n^2) cells, one comparison and one conversion each, plus O(n) to build the profile
- space: O(n) — the profile and one row
- note: Measured 132.27ms at n = 1,500 against 360.54ms — 2.7x to 2.8x, and 5x in Python. The identity cell(i, j) = max(C[i], C[j]) was checked against the definition for every cell of every n from 1 to 40.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    int w = 2 * n - 1;
    vector<int> C(w);
    for (int k = 0; k < w; k++) C[k] = n - min(k, w - 1 - k);
    string row;
    for (int i = 0; i < w; i++) {
        row.clear();
        for (int j = 0; j < w; j++) {
            if (j) row += ' ';
            row += to_string(max(C[i], C[j]));
        }
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 11: The profile is the middle row: n, n-1, down to 1, and back up. Every other row is derived from it.
- 17: max, not min. Two cells at depths a and b lie on the ring of the shallower one, which is the larger value.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    int w = 2 * n - 1;
    int[] c = new int[w];
    for (int k = 0; k < w; k++) c[k] = n - Math.min(k, w - 1 - k);
    StringBuilder row = new StringBuilder();
    for (int i = 0; i < w; i++) {
        row.setLength(0);
        for (int j = 0; j < w; j++) {
            if (j > 0) row.append(' ');
            row.append(Math.max(c[i], c[j]));
        }
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 8: One builder reused across all 2n - 1 rows, cleared rather than reallocated.

<!-- @code python -->
```python
def pattern(n):
    if n <= 0:
        return
    w = 2 * n - 1
    C = [n - min(k, w - 1 - k) for k in range(w)]
    for i in range(w):
        print(" ".join(str(max(C[i], c)) for c in C))


# The grid is the max table of C against itself — one array of
# 2n-1 values generating all (2n-1)^2 cells.
```

<!-- @annotations -->
- 5: C is built once, in O(n). Everything after this reads it rather than recomputing distances.

<!-- @approach -->
### Cache the Distinct Rows

<!-- @idea -->
There are only n different rows in the whole grid, so build each one once and print it by index.

<!-- @steps -->
1. Build the profile array as before.
2. For each value from one to n, build the row text that a row at that depth would hold.
3. Loop the output lines from zero to 2n minus two.
4. Print the cached row whose value is the profile entry for that line.
5. Each distinct row is built once and printed about twice.

<!-- @complexity -->
- time: O(n^2) characters, with each distinct row built once rather than twice
- space: O(n^2) — n row strings, against one for the streaming versions
- note: The fastest — 70.20ms at n = 1,500 against 132.27ms, so 1.9x, and 2.0x to 2.1x in Python. It holds 19,176,000 characters there against 12,784 for one row. Patterns 8 and 9 measured this same trade coming out slower as well as larger; the difference is that a row here costs 2n - 1 conversions to rebuild, and theirs cost two bulk fills.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
#include <vector>
#include <algorithm>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    int w = 2 * n - 1;
    vector<int> C(w);
    for (int k = 0; k < w; k++) C[k] = n - min(k, w - 1 - k);

    vector<string> rows(n + 1);
    for (int v = 1; v <= n; v++) {
        string& r = rows[v];
        for (int j = 0; j < w; j++) {
            if (j) r += ' ';
            r += to_string(max(v, C[j]));
        }
    }
    for (int i = 0; i < w; i++) cout << rows[C[i]] << '\n';
}
```

<!-- @annotations -->
- 13: n rows rather than 2n - 1, because row i is identical to row 2n - 2 - i.
- 18: Each cell of the cached row is the larger of this row's depth and the column's.
- 21: The output loop does no work at all beyond an index and a write.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    int w = 2 * n - 1;
    int[] c = new int[w];
    for (int k = 0; k < w; k++) c[k] = n - Math.min(k, w - 1 - k);
    String[] rows = new String[n + 1];
    for (int v = 1; v <= n; v++) {
        StringBuilder r = new StringBuilder();
        for (int j = 0; j < w; j++) { if (j > 0) r.append(' '); r.append(Math.max(v, c[j])); }
        rows[v] = r.toString();
    }
    for (int i = 0; i < w; i++) System.out.println(rows[c[i]]);
}
```

<!-- @annotations -->
- 6: The array is indexed by ring value, so no lookup table from row index to row is needed.

<!-- @code python -->
```python
def pattern(n):
    if n <= 0:
        return
    w = 2 * n - 1
    C = [n - min(k, w - 1 - k) for k in range(w)]
    rows = {v: " ".join(str(max(v, c)) for c in C) for v in range(1, n + 1)}
    for i in range(w):
        print(rows[C[i]])


# Each distinct row is built once and printed about twice, which
# is worth 2.0x to 2.1x — for n times the memory.
```

<!-- @annotations -->
- 6: n strings, keyed by ring value. This is the Θ(n^2) memory the streaming versions avoid.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
A seven by seven grid of four nested rings, numbered 4 outside to 1 at the centre

<!-- @why -->
The smallest size showing more than two rings, and it fixes the grid width and the ring counts.

<!-- @walkthrough -->
1. The grid is 2n minus one on a side, which is 7 — the rings need room on both sides of the centre.
2. The corner cell is zero steps from two edges, so its value is n minus 0, which is 4.
3. The centre cell is 3 steps from every edge, so its value is n minus 3, which is 1.
4. The outer ring holds 8n minus 8, which is 24, cells.
5. The next holds 8 times 3 minus 8, which is 16, and so on down to a single 1.
6. Those total 24 + 16 + 8 + 1, which is 49 — exactly 7 squared.
7. Every row reads the same backwards, and rows 1 and 7 are the same string, as are 2 and 6.

<!-- @example -->

<!-- @input -->
The eight symmetries of the square, applied to four wrong outputs

<!-- @output -->
Three of the four are still perfectly symmetric

<!-- @why -->
The strongest form of a result this topic has been building since Pattern 9, on the most symmetric shape it contains.

<!-- @walkthrough -->
1. The correct grid is unchanged by all four rotations and by reflection in either axis or diagonal — verified for n = 1 to 25.
2. Taking the maximum of the four distances instead of the minimum numbers the rings outward from the centre; that shape is equally symmetric.
3. Counting the value outward rather than inward does the same.
4. Sizing the grid 2n instead of 2n minus one produces a shape with no centre cell — still symmetric.
5. Only dropping two of the four distance terms breaks the symmetry, and that is caught at n = 2.
6. So eight independent invariants together catch one mistake in four.
7. The value histogram catches all four, at n = 1 or n = 2, because these mistakes change which values appear rather than where they sit.

<!-- @example -->

<!-- @input -->
n = 10, printed and looked at

<!-- @output -->
The rings stop lining up, and the rows stop being the same width

<!-- @why -->
The fifth appearance of this boundary in the topic, and the one where the picture itself stops working.

<!-- @walkthrough -->
1. Up to n = 9 every value is one character, so the columns align and the rings are visibly square.
2. At n = 10 the outer value takes two characters.
3. The first row becomes nineteen copies of 10, and the middle row runs 10 9 8 down to 1 and back.
4. Those rows no longer have the same width, so the grid is not rectangular as text.
5. Nothing about the numbers is wrong — every cell still holds n minus its distance from the edge.
6. What broke is the correspondence between the text and the picture it was drawn to show.
7. Padding each value to a fixed width restores the alignment, and changes every character count in this container.

<!-- @example -->

<!-- @input -->
Caching the n distinct rows, at n = 1,500

<!-- @output -->
1.9x faster for 1,500 times the memory — where Patterns 8 and 9 lost on both

<!-- @why -->
Closes the topic's longest-running trade-off with the condition that decides it.

<!-- @walkthrough -->
1. Only n distinct rows exist across 2n minus one lines, so each is used about twice.
2. Building all of them once and indexing costs 19,176,000 characters against 12,784 for a single row.
3. Measured, that is 70.20ms against 132.27ms — 1.9 times faster.
4. Patterns 8 and 9 measured the same idea, storing rows to replay them, and it came out slower as well as larger.
5. The difference is what a row costs to rebuild: theirs was two bulk fills of identical characters.
6. A row here is 2n minus one integer-to-text conversions, which is real work worth not repeating.
7. So the question was never whether to store, but whether regenerating is cheap.

<!-- @visualization custom -->

<!-- @description -->
Draw the (2n-1) by (2n-1) grid with each cell coloured by its ring rather than by its value, so the concentric structure is visible before any number is read, then fade the numbers in on top. Beside it, run a distance probe: pick a cell and draw its four measured distances as arrows to the top, left, bottom and right edges, with the shortest highlighted and the arithmetic n minus that shown resolving to the cell's number. Move the probe from a corner to the centre so the reader watches the value fall from n to 1. The centre of the figure is the factorisation. Draw the profile array C along the top edge and again down the left edge — the same sequence twice, counting n down to 1 and back — and fill each cell by lighting its row header and column header and taking the larger. Do this for a few cells slowly, then let the whole grid fill at once, with a caption reading 2n-1 values, (2n-1)^2 cells. Then the symmetry panel, which is the argument: place the correct grid beside three wrong ones — rings numbered outward, distances taken as a maximum, and the grid sized 2n — and apply all eight symmetries to each in turn, drawing each transformation as an actual rotation or flip that lands back on itself. All four survive. Only the fourth candidate, built from two distance terms instead of four, visibly fails. Then swap in a histogram readout beneath every grid and let it separate all four immediately. Close with the n = 10 panel: the same grid rendered at n = 9 and n = 10 side by side, the first square and the second visibly ragged, with a note that the numbers are identical in kind and only the alignment has gone.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"width":7,"widthFormula":"2n - 1","output":"4 4 4 4 4 4 4\n4 3 3 3 3 3 4\n4 3 2 2 2 3 4\n4 3 2 1 2 3 4\n4 3 2 2 2 3 4\n4 3 3 3 3 3 4\n4 4 4 4 4 4 4\n","cells":49,"rule":"cell(i,j) = n - min(i, j, 2n-2-i, 2n-2-j)","meaning":"n minus the Chebyshev distance to the nearest edge","distanceGrid":[[0,0,0,0,0,0,0],[0,1,1,1,1,1,0],[0,1,2,2,2,1,0],[0,1,2,3,2,1,0],[0,1,2,2,2,1,0],[0,1,1,1,1,1,0],[0,0,0,0,0,0,0]]},"relationToPattern21":{"pattern21":"asks whether a cell's distance from the border is zero","pattern22":"asks what that distance is"},"factorisation":{"profile":"C[k] = n - min(k, 2n-2-k)","n4":[4,3,2,1,2,3,4],"identity":"cell(i, j) = max(C[i], C[j])","verified":"every cell of every n from 1 to 40, 0 exceptions","reading":"one array of 2n-1 values generates all (2n-1)^2 cells","consequences":["only n distinct rows exist","row i is identical to row 2n-2-i","every row is itself a palindrome"],"consequencesVerified":"n = 1..25"},"counts":{"cells":"(2n-1)^2","valueVAppears":"8v - 8 times for v >= 2","valueOneAppears":1,"sum":"4n(n-1) + 1 = (2n-1)^2","verified":"n = 2..25","atN4":{"value4":24,"value3":16,"value2":8,"value1":1,"total":49}},"symmetry":{"invariantUnder":"all four rotations and their reflections","verified":"n = 1..25, 0 exceptions","catches":"one mistake in four","stillSymmetric":["max instead of min","counted outward from the centre","grid sized 2n instead of 2n-1"],"topicArc":[{"pattern":9,"finding":"a palindrome check passes a bowtie"},{"pattern":17,"finding":"a palindrome check passes four of five"},{"pattern":19,"finding":"width and palindrome together pass an inside-out block"},{"pattern":22,"finding":"eight independent symmetries pass three of four"}]},"bugPanel":{"variants":[{"name":"max instead of min","wrongOn":"24 of 26","correctAt":[0,1]},{"name":"only two of the four terms","wrongOn":"24 of 26","correctAt":[0,1]},{"name":"counted outward from the centre","wrongOn":"24 of 26","correctAt":[0,1]},{"name":"grid sized 2n instead of 2n-1","wrongOn":"25 of 26","correctAt":[0]}]},"checkPanel":{"columns":["cell count","value histogram","symmetry","corner value","exact"],"smallestNThatCatches":{"max instead of min":["never",2,"never",2,2],"only two terms":["never",2,2,"never",2],"counted outward":["never",2,"never",2,2],"grid sized 2n":[1,1,"never","never",1]},"reading":["the full dihedral symmetry catches one of four","the value histogram catches all four","Pattern 18 found a histogram unable to distinguish two shapes; there the mistakes rearranged the same values, here they change which values appear","a histogram is exactly as useful as the errors are unlike a permutation"]},"assertions":["the grid is (2n-1) by (2n-1)","cell (i,j) equals n minus its distance to the nearest edge","value v appears 8v-8 times for v >= 2 and value 1 appears once","row i is identical to row 2n-2-i","every row reads the same backwards"],"alignmentBreak":{"at":10,"why":"the values reach two characters","n9":"every value one character, columns aligned, rows equal width","n10Row1":"10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10 10","n10Row10":"10 9 8 7 6 5 4 3 2 1 2 3 4 5 6 7 8 9 10","rowsStillEqualWidth":false,"reading":"nothing about the numbers is wrong; the correspondence between the text and the picture is what breaks","fix":"pad each value to a fixed width, which changes every character count here"},"buildPanel":[{"n":300,"perCellMs":14.09,"profileArrayMs":5.07,"cachedRowsMs":2.68},{"n":700,"perCellMs":77.90,"profileArrayMs":28.45,"cachedRowsMs":14.70},{"n":1500,"perCellMs":360.54,"profileArrayMs":132.27,"cachedRowsMs":70.20}],"memory":[{"n":300,"oneRowChars":2182,"nDistinctRowsChars":654600},{"n":700,"oneRowChars":5382,"nDistinctRowsChars":3767400},{"n":1500,"oneRowChars":12784,"nDistinctRowsChars":19176000}],"ratios":{"perCellToProfile":"2.7x to 2.8x","profileToCached":"1.9x","perCellToCached":"5.1x to 5.3x"},"cachingTradeoff":{"here":"1.9x faster for n times the memory","patterns8And9":"the same move measured slower as well as larger","why":"a row there was two bulk fills of identical characters; a row here is 2n-1 integer-to-text conversions","rule":"the question is whether regenerating is cheap, not whether storing is good"},"python":{"perCellToProfile":"5x","profileToCached":"2.0x to 2.1x"}}
```

<!-- @highlights -->
- The grid is coloured by ring before any number is shown, so the concentric structure reads first.
- The numbers then fade in on top of the rings.
- A distance probe draws a cell's four measured distances as arrows to the top, left, bottom and right edges.
- The shortest arrow is highlighted, and n minus it resolves to the cell's number.
- The probe moves from a corner to the centre while the value falls from n to 1.
- The profile array C is drawn along the top edge and again down the left edge — the same sequence twice.
- Each cell is filled by lighting its row header and column header and taking the larger.
- A few cells fill slowly, then the whole grid at once, captioned 2n-1 values, (2n-1)^2 cells.
- The symmetry panel places the correct grid beside three wrong ones.
- All eight symmetries are applied to each as actual rotations and flips that land back on themselves.
- All four candidates survive; only the fourth, built from two distance terms, visibly fails.
- A histogram readout is then swapped in beneath every grid and separates all four immediately.
- The closing panel renders the same grid at n = 9 and n = 10 side by side.
- The first is square and the second visibly ragged.
- A note records that the numbers are identical in kind and only the alignment has gone.

<!-- @edgeCases -->
- n equal to zero — no output, and the profile and cached versions need their guard.
- n equal to one — a one by one grid holding a single 1, where three of the four mistakes still pass.
- n equal to two — a three by three grid, and the smallest input that catches every mistake measured.
- n equal to nine — the largest size where every value is one character and the columns align.
- n equal to ten — where the values reach two characters and the rows stop being equal width.
- Negative n — no output from the loop version; the others need the guard.
- The centre cell — the only cell holding 1, and the only value appearing once.
- The corner cells — zero steps from two edges at once, which is why the corner value is n rather than n - 1.
- Very large n — (2n-1)² cells, so n of a thousand is nearly four million values.
- A caller expecting fixed-width columns — the values must be padded, which changes every character count in this container.

<!-- @pitfalls -->
- Sizing the grid n by n. The rings need room on both sides of the centre, so the width is 2n - 1.
- Testing the output for symmetry. This shape has all eight symmetries of the square and three of its four natural mistakes keep them.
- Taking the maximum of the four distances. That numbers the rings outward from the centre and is still perfectly symmetric.
- Using only two of the four distance terms. The result is symmetric about one diagonal, which is enough to pass a careless symmetry check but not the full one.
- Checking the cell count. Only the wrong grid size changes it; the three value mistakes leave it at exactly (2n-1)².
- Assuming a histogram is a weak check because Pattern 18 found one useless. There the mistakes permuted the same values; here they change which values appear, and the histogram catches all four.
- Expecting the columns to align past n = 9. From n = 10 the values need two characters and the rows are not even the same width.
- Recomputing four distances per cell. The whole grid factors as max(C[i], C[j]) from one array of 2n - 1 values, worth 2.7x to 2.8x.
- Caching the rows without noticing the memory. It holds 19,176,000 characters at n = 1,500 against 12,784 for one row.
- Concluding from Patterns 8 and 9 that caching rows never pays. It pays here, 1.9x, because a row costs 2n - 1 conversions to rebuild rather than two bulk fills.

<!-- @doubt -->
### Why is the grid 2n - 1 wide rather than n?

<!-- @answer -->
Because the rings are concentric, so every ring except the innermost needs a copy on each side of the centre. Ring 1 is a single cell; ring 2 surrounds it, adding one cell in each direction; and so on to ring n. That gives 1 + 2(n - 1) = 2n - 1 cells across, and (2n - 1)² in total — 49 at n = 4. Sizing it n by n is the one mistake here that the cell count catches, at n = 1, where it produces a 2 by 2 grid with no centre.

<!-- @doubt -->
### Can I check this by testing the symmetry?

<!-- @answer -->
Barely. The shape is invariant under all four rotations of the square and all four reflections — verified for n = 1 to 25 — which makes it the most symmetric thing in this topic and the weakest check in it. Measured against four natural mistakes, the full eight-fold symmetry catches **one**. Numbering the rings outward from the centre is symmetric. Taking the maximum of the four distances instead of the minimum is symmetric. Sizing the grid 2n instead of 2n - 1 is symmetric. Only dropping two of the four distance terms breaks it, at n = 2.

<!-- @doubt -->
### Then what is the cheap check here?

<!-- @answer -->
The value histogram: value v should appear 8v - 8 times for v ≥ 2, and value 1 exactly once. That catches all four mistakes measured, at n = 1 or n = 2. It is worth setting beside Pattern 18, where a histogram was precisely the check that *could not* tell two shapes apart — because there the mistake rearranged the same values, and a histogram is blind to arrangement. Here the mistakes change which values appear at all. A histogram is exactly as useful as the errors are unlike a permutation, which is a property of the errors rather than of the check.

<!-- @doubt -->
### How does the whole grid come from one array?

<!-- @answer -->
Because a cell's value depends only on the smaller of its row depth and its column depth. Build C[k] = n - min(k, 2n-2-k), the sequence counting n down to 1 and back up — the middle row. Then cell(i, j) = max(C[i], C[j]), verified for every cell of every n from 1 to 40 with no exceptions. Two cells at depths a and b lie on the ring of the shallower one, and shallower means the larger value, which is why it is a maximum. The practical payoff is removing the four-way minimum from the inner loop, worth 2.7x, and it also shows immediately that only n distinct rows exist.

<!-- @doubt -->
### Why do the columns stop lining up?

<!-- @answer -->
Because the values reach two characters at n = 10, and nothing pads them. Up to n = 9 every value is a single digit, so the space-separated columns align and the rings look square. At n = 10 the first row becomes nineteen copies of `10` while the middle row runs `10 9 8 ... 1 ... 9 10`, and the rows are not even the same width. Nothing about the numbers is wrong — every cell still holds n minus its distance from the edge. What breaks is the correspondence between the text and the picture. Padding each value to a fixed width fixes it, and changes every character count in this container.

<!-- @doubt -->
### Patterns 8 and 9 said storing rows was a mistake. Why does it help here?

<!-- @answer -->
Because the question was never whether to store — it was whether regenerating is cheap. In those patterns a row was two bulk fills of identical characters, so rebuilding it cost almost nothing and holding the output cost O(n²) memory for no gain; both measured slower as well as larger. Here a row is 2n - 1 integer-to-text conversions, which is real work, and only n distinct rows exist across 2n - 1 lines, so each is used about twice. Measured, caching them is 1.9x faster — for 19,176,000 characters against 12,784 at n = 1,500. Pay that if the memory is available and skip it if not; the streaming version is only 1.9x behind.

<!-- @doubt -->
### Is there anything faster than caching the rows?

<!-- @answer -->
Not meaningfully, and the reason is the same one that closed Pattern 13. The output is (2n - 1)² values, every one of which must be written, and after the profile array removes the distance arithmetic and the cache removes the duplicate row building, what remains is the characters themselves. The full ladder is 5.1x to 5.3x from the direct transcription — 360.54ms to 70.20ms at n = 1,500 — and there is no fourth step. Patterns with more repetition, like 3, 6 and 11, had far more to gain; this one has n distinct rows and nearly four million cells at n = 1,000.
