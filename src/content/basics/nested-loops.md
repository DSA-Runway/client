---
id: nested-loops
topic: Basics
title: Nested Loops
difficulty: Medium
status: ready
prerequisites:
  - for-loop
  - while-loop
  - for-each-loop
  - break-and-continue
  - arithmetic-operators
relatedIds:
  - for-loop
  - break-and-continue
  - time-and-space-complexity-basics
  - for-each-loop
---

<!-- @summary -->
Putting one loop inside another so the inner one runs in full for every single outer iteration — the structure behind patterns, grids, and every all-pairs comparison.

<!-- @theory -->
## A loop inside a loop

A loop repeats a block. Put a loop *in* that block and the inner one runs completely
for **every single iteration of the outer one**.

```
for (int i = 0; i < 3; i++) {        // outer: 3 times
    for (int j = 0; j < 4; j++) {    // inner: 4 times, restarted each time
        // this body runs 3 x 4 = 12 times
    }
}
```

The mental model that matters: **the inner loop restarts from scratch on every outer
iteration.** It is not one loop counting to twelve. It is a fresh four-count, run
three separate times.

An odometer is the closest everyday analogy. The rightmost digit spins through its
full range, and only then does the digit to its left tick over by one. The outer loop
is the slow digit; the inner is the fast one.

## Counting the iterations

Total body executions = outer count × inner count. Three levels multiply again.

| Structure | Body runs |
|---|---|
| `n` outer, `m` inner | `n × m` |
| `n` outer, `n` inner | `n²` |
| Three levels of `n` | `n³` |

That multiplication is the whole cost story, and it grows fast:

| n | n² |
|---|---|
| 10 | 100 |
| 1,000 | 1,000,000 |
| 100,000 | 10,000,000,000 |

A single loop over 100,000 elements is instant. A doubly nested one over the same
data is ten billion operations, which no judge will wait for. **Whenever you write a
nested loop, know what n can reach.**

## Polynomial, not exponential

Worth stating precisely, because it is commonly said wrong.

`k` nested loops over `n` is **O(n^k)** — quadratic, cubic, and so on. That is
**polynomial** growth. **Exponential** means **O(2^n)**, where the *exponent* grows
with the input rather than the base.

They are not the same and the difference is enormous:

| n | n² (polynomial) | 2ⁿ (exponential) |
|---|---|---|
| 10 | 100 | 1,024 |
| 30 | 900 | 1,073,741,824 |
| 60 | 3,600 | about 10¹⁸ |

At n = 60, the quadratic is trivial and the exponential exceeds anything computable.
Nested loops are never exponential no matter how many you stack, as long as the
nesting depth is fixed. Getting this right now matters, because complexity analysis
depends on the distinction.

## Where nested loops show up

**Patterns.** Rows and columns map exactly onto outer and inner. The entire Pattern
Printing topic — all 22 subtopics — is this one structure with different bodies.

**Grids and matrices.** A 2D structure has rows and columns, so traversing it takes
two loops. Row-major order (outer over rows, inner over columns) also matches how the
data sits in memory, which makes it measurably faster than the reverse on large
matrices.

**Comparing every pair.** Checking whether any two elements match, finding the closest
pair, or generating all combinations all need each element paired against the others.

## Triangular loops

Comparing every pair with both loops running the full range does each pair **twice** —
once as (i, j) and again as (j, i) — plus n useless self-comparisons.

Start the inner loop at `i + 1` instead:

```
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++)
        // each unordered pair exactly once
```

The inner loop shrinks as the outer advances: n-1 iterations, then n-2, down to 0.
That totals **n(n-1)/2** — roughly half the work.

But it is **still O(n²)**. Halving matters in practice and changes nothing about the
growth class, because constant factors drop out of Big O. That distinction comes up
constantly in DSA: a 2× speedup is real and still leaves you needing a better
algorithm.

## Independent counters

Each loop needs its **own** variable. Reusing one for both is a classic bug:

```
for (int i = 0; i < 3; i++)
    for (i = 0; i < 3; i++)     // same i — outer never progresses
```

The inner loop drives `i` to 3 every time, so the outer condition fails immediately
after the first pass. Convention is `i`, then `j`, then `k`.

## Reset what should be per-iteration

The single most common nested-loop bug. If the inner loop accumulates something
per-row, that accumulator has to be **reset inside the outer loop**:

```
int sum = 0;                     // WRONG — accumulates across all rows
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) sum += grid[i][j];
    print(sum);                  // running total, not the row total
}

for (int i = 0; i < rows; i++) {
    int sum = 0;                 // RIGHT — fresh for each row
    for (int j = 0; j < cols; j++) sum += grid[i][j];
    print(sum);
}
```

This follows directly from the mental model: the inner loop restarts, so anything it
builds should usually restart with it.

## break and continue stay inside

From the break-and-continue subtopic: **`break` exits only the innermost loop**, and
the outer one carries on. In a nested search this means the outer loop keeps scanning
after the answer is found.

Java offers labelled break. C++ and Python do not — use a flag, or extract the loops
into a function and `return`, which leaves every level at once.

## When to avoid them

A nested loop is often the obvious solution and rarely the best one. Finding a pair
summing to a target is O(n²) with two loops, and O(n) with a hash set. Recognising
when nesting can be replaced by a smarter data structure is a large part of what DSA
teaches.

Write the nested version first if it helps you understand the problem. Then ask
whether the inner loop is really necessary.

<!-- @intuition -->
The inner loop is an odometer digit that completes a full spin before the outer digit moves once. Once you see it that way, both the iteration count and the reset bug become obvious — the inner loop starts over, so whatever it builds should usually start over too.

<!-- @approach -->
### Running a Loop Inside a Loop

<!-- @idea -->
Repeat an entire loop once for each iteration of an outer loop.

<!-- @steps -->
1. Write the outer loop with its own counter, controlling how many times the whole inner sequence repeats.
2. Write the inner loop with a different counter, controlling one full sweep.
3. Place any state that should be per-outer-iteration inside the outer loop but outside the inner one.
4. The inner loop runs to completion, then the outer update fires and the inner loop restarts from its initial value.
5. Total body executions are the outer count multiplied by the inner count.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

int main() {
    // 3 x 4 = 12 body executions
    for (int i = 0; i < 3; i++) {
        for (int j = 0; j < 4; j++) {
            cout << i << j << " ";
        }
        cout << endl;
    }
    // 00 01 02 03
    // 10 11 12 13
    // 20 21 22 23

    // A right triangle — the inner bound depends on the outer counter
    int n = 4;
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            cout << "*";
        }
        cout << endl;
    }
    // *
    // **
    // ***
    // ****

    return 0;
}
```

<!-- @annotations -->
- 7: j is re-initialised to 0 every time the outer loop advances. It is not one count to twelve.
- 10: Printing the newline here, between the loops, is what ends each row.
- 18: The inner bound is i rather than n, so each row is one star longer than the last.

<!-- @code java -->
```java
public class Nested {
    public static void main(String[] args) {
        // 3 x 4 = 12 body executions
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 4; j++) {
                System.out.print("" + i + j + " ");
            }
            System.out.println();
        }

        // A right triangle
        int n = 4;
        for (int i = 1; i <= n; i++) {
            for (int j = 1; j <= i; j++) {
                System.out.print("*");
            }
            System.out.println();
        }
    }
}
```

<!-- @annotations -->
- 5: Each loop has its own counter. Reusing i here would stop the outer loop after one pass.

<!-- @code python -->
```python
# 3 x 4 = 12 body executions
for i in range(3):
    for j in range(4):
        print(f"{i}{j}", end=" ")
    print()
# 00 01 02 03
# 10 11 12 13
# 20 21 22 23

# A right triangle
n = 4
for i in range(1, n + 1):
    for j in range(i):
        print("*", end="")
    print()
# *
# **
# ***
# ****

# Python often expresses the inner loop without one at all
for i in range(1, n + 1):
    print("*" * i)
```

<!-- @annotations -->
- 3: range(4) is regenerated on every outer iteration, which is Python's version of the restart.
- 22: String repetition replaces the inner loop entirely. Learn the loop first, then the shortcut.

<!-- @approach -->
### Traversing a 2D Structure

<!-- @idea -->
Visit every cell of a grid using one loop for rows and one for columns.

<!-- @steps -->
1. Determine the number of rows and the number of columns.
2. Loop over the rows in the outer loop.
3. Loop over that row's columns in the inner loop.
4. Access the element using both counters as its coordinates.
5. Reset any per-row accumulator inside the outer loop, before the inner loop begins.
6. Prefer rows in the outer loop, since that order matches how the data sits in memory.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<vector<int>> grid = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};
int rows = grid.size(), cols = grid[0].size();

// Print every cell, row by row
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        cout << grid[i][j] << " ";
    }
    cout << endl;
}

// Per-row sums — the accumulator MUST be reset inside the outer loop
for (int i = 0; i < rows; i++) {
    int rowSum = 0;                       // fresh for each row
    for (int j = 0; j < cols; j++) {
        rowSum += grid[i][j];
    }
    cout << "row " << i << ": " << rowSum << endl;
}
// row 0: 6 / row 1: 15 / row 2: 24

// Grand total — this one genuinely belongs outside
int total = 0;
for (int i = 0; i < rows; i++)
    for (int j = 0; j < cols; j++)
        total += grid[i][j];
cout << total << endl;   // 45
```

<!-- @annotations -->
- 21: Declared inside the outer loop, so it is created and destroyed once per row.
- 30: The difference is intent: a grand total should accumulate across rows, a row total should not.

<!-- @code java -->
```java
int[][] grid = {
    {1, 2, 3},
    {4, 5, 6},
    {7, 8, 9}
};
int rows = grid.length, cols = grid[0].length;

// Print every cell
for (int i = 0; i < rows; i++) {
    for (int j = 0; j < cols; j++) {
        System.out.print(grid[i][j] + " ");
    }
    System.out.println();
}

// Per-row sums
for (int i = 0; i < rows; i++) {
    int rowSum = 0;
    for (int j = 0; j < cols; j++) {
        rowSum += grid[i][j];
    }
    System.out.println("row " + i + ": " + rowSum);
}

// Nested for-each works when indices are not needed
for (int[] row : grid) {
    for (int value : row) {
        System.out.print(value + " ");
    }
    System.out.println();
}
```

<!-- @annotations -->
- 6: grid[0].length assumes every row has the same length, which is not guaranteed in Java.
- 26: Cleaner when you only need the values. Use indexed loops when positions matter.

<!-- @code python -->
```python
grid = [
    [1, 2, 3],
    [4, 5, 6],
    [7, 8, 9]
]
rows, cols = len(grid), len(grid[0])

# Indexed traversal
for i in range(rows):
    for j in range(cols):
        print(grid[i][j], end=" ")
    print()

# Per-row sums — reset inside the outer loop
for i in range(rows):
    row_sum = 0
    for j in range(cols):
        row_sum += grid[i][j]
    print(f"row {i}: {row_sum}")

# Iterating directly is more idiomatic when indices are not needed
for row in grid:
    for value in row:
        print(value, end=" ")
    print()

# And Python has built-ins for the common cases
for row in grid:
    print(sum(row))          # 6 / 15 / 24
print(sum(sum(row) for row in grid))   # 45
```

<!-- @annotations -->
- 22: Each row is itself a list, so the outer loop yields lists and the inner yields values.
- 28: Know the loop first — the built-in is doing exactly the same traversal underneath.

<!-- @approach -->
### Generating Pairs with Triangular Loops

<!-- @idea -->
Compare every element against every other, without doing each pair twice.

<!-- @steps -->
1. Loop over the array with the outer counter to select the first element of each pair.
2. Start the inner counter at one past the outer counter, not at zero.
3. Loop the inner counter to the end to select the second element.
4. Each unordered pair is now produced exactly once, and no element is paired with itself.
5. Note that the total is n times n minus one, divided by two — about half the full nesting, but still quadratic.

<!-- @code cpp -->
```cpp
vector<int> arr = {3, 7, 1, 9};
int n = arr.size();

// FULL nesting — 16 iterations, each pair twice plus 4 self-comparisons
for (int i = 0; i < n; i++)
    for (int j = 0; j < n; j++)
        cout << arr[i] << "," << arr[j] << " ";
cout << endl;

// TRIANGULAR — 6 iterations, each unordered pair exactly once
for (int i = 0; i < n; i++)
    for (int j = i + 1; j < n; j++)
        cout << arr[i] << "," << arr[j] << " ";
cout << endl;
// 3,7 3,1 3,9 7,1 7,9 1,9

// Practical use: does any pair sum to a target?
int target = 10;
bool found = false;
for (int i = 0; i < n && !found; i++) {
    for (int j = i + 1; j < n; j++) {
        if (arr[i] + arr[j] == target) { found = true; break; }
    }
}
cout << found << endl;   // 1  (3 + 7)

// This is O(n^2). A hash set solves the same problem in O(n) —
// recognising that is what DSA is actually teaching.
```

<!-- @annotations -->
- 11: Starting at i + 1 skips both the self-comparison and the mirrored duplicate.
- 13: n(n-1)/2 = 6 for n = 4, against 16 for the full nesting.
- 19: The flag in the outer condition is needed because break only leaves the inner loop.

<!-- @code java -->
```java
int[] arr = {3, 7, 1, 9};
int n = arr.length;

// TRIANGULAR — each unordered pair exactly once
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
        System.out.print(arr[i] + "," + arr[j] + " ");
    }
}
System.out.println();
// 3,7 3,1 3,9 7,1 7,9 1,9

// Pair sum with a labelled break — Java's advantage here
int target = 10;
boolean found = false;
outer:
for (int i = 0; i < n; i++) {
    for (int j = i + 1; j < n; j++) {
        if (arr[i] + arr[j] == target) {
            found = true;
            break outer;      // exits BOTH loops
        }
    }
}
System.out.println(found);   // true
```

<!-- @annotations -->
- 21: No flag needed in the outer condition, because the labelled break leaves both loops directly.

<!-- @code python -->
```python
arr = [3, 7, 1, 9]
n = len(arr)

# TRIANGULAR — each unordered pair exactly once
for i in range(n):
    for j in range(i + 1, n):
        print(f"{arr[i]},{arr[j]}", end=" ")
print()
# 3,7 3,1 3,9 7,1 7,9 1,9

# Pair sum — extracting to a function gives the cleanest multi-level exit
def has_pair_with_sum(arr, target):
    for i in range(len(arr)):
        for j in range(i + 1, len(arr)):
            if arr[i] + arr[j] == target:
                return True      # leaves both loops at once
    return False

print(has_pair_with_sum(arr, 10))   # True

# The O(n) alternative, for contrast
def has_pair_fast(arr, target):
    seen = set()
    for x in arr:
        if target - x in seen:
            return True
        seen.add(x)
    return False

print(has_pair_fast(arr, 10))   # True — one pass, no nesting
```

<!-- @annotations -->
- 16: return exits every enclosing loop, which is why extraction beats a flag in Python.
- 22: Same answer, one loop instead of two. This is the shape of most nested-loop optimisations.

<!-- @example -->

<!-- @input -->
for i in 0..2: for j in 0..3: print(i, j)

<!-- @output -->
12 lines: 00 01 02 03, then 10 11 12 13, then 20 21 22 23

<!-- @why -->
Establishes the restart, which is the mental model every other nested-loop behaviour follows from.

<!-- @walkthrough -->
1. The outer loop sets i to 0 and enters its body.
2. The inner loop runs completely, taking j through 0, 1, 2 and 3, printing four pairs.
3. The inner loop's condition fails and it ends, so control returns to the outer loop.
4. The outer update sets i to 1, and the inner loop starts again from j equal to 0.
5. It is a fresh four-count, not a continuation — j was re-initialised by the inner loop's own header.
6. This repeats for i equal to 2, giving three full sweeps of four, which is twelve body executions.

<!-- @example -->

<!-- @input -->
n = 4; for i in 1..4: for j in 1..i: print '*'

<!-- @output -->
A right triangle: 1 star, then 2, then 3, then 4

<!-- @why -->
Rows mapping to the outer loop and columns to the inner is the exact structure of all 22 Pattern Printing subtopics.

<!-- @walkthrough -->
1. With i at 1, the inner loop runs while j is at most 1, so it prints one star.
2. The newline after the inner loop ends the row.
3. With i at 2, the inner bound is now 2, so the inner loop prints two stars.
4. With i at 3 and then 4, the rows grow to three and four stars.
5. The inner loop's bound depends on the outer counter, so each sweep is a different length.
6. Total stars are 1 plus 2 plus 3 plus 4, which is 10 — not 16, because the loop is triangular.

<!-- @example -->

<!-- @input -->
Summing each row of a 3x3 grid, with the accumulator declared before the outer loop

<!-- @output -->
6, then 21, then 45 — running totals instead of row totals

<!-- @why -->
The most common nested-loop bug, and it follows directly from the restart model: the inner loop starts over, so what it builds should start over too.

<!-- @walkthrough -->
1. The accumulator is created once, before any looping begins.
2. The first row adds 1, 2 and 3, so it holds 6 and the correct row total is printed.
3. The outer loop advances, but the accumulator is not reset because it lives outside.
4. The second row adds 4, 5 and 6 on top of the existing 6, giving 21 rather than 15.
5. The third row adds its 24 on top of that, giving 45 — which is the grand total, not the row total.
6. Moving the declaration inside the outer loop creates a fresh accumulator per row and fixes it.

<!-- @example -->

<!-- @input -->
An array of 4 elements: full nesting versus starting the inner loop at i + 1

<!-- @output -->
16 iterations versus 6

<!-- @why -->
Shows a real and worthwhile optimisation that does not change the complexity class, which is a distinction students need before complexity analysis.

<!-- @walkthrough -->
1. With both loops running the full range, every ordered pair is produced, giving 4 times 4 which is 16.
2. Four of those pair an element with itself, which is almost never wanted.
3. The remaining twelve consist of each unordered pair appearing twice, once in each order.
4. Starting the inner loop at i plus 1 skips everything at or before the diagonal.
5. The inner loop now runs 3 times, then 2, then 1, then 0, totalling 6.
6. That is n times n minus one over two — roughly half the work, and still O of n squared.

<!-- @visualization matrix -->

<!-- @description -->
Draw a grid whose rows are the outer loop's iterations and whose columns are the inner loop's, with two counter chips beside it labelled i and j. Animate the traversal cell by cell: the j chip ticks through its full range lighting each cell in the current row, and only when it exhausts does the i chip tick once and the j chip visibly RESET to its starting value before sweeping the next row. Draw that reset as an explicit snap-back rather than a continuation, because it is the mental model being taught. Beside the grid, run an odometer with a fast digit and a slow digit turning in lockstep with j and i, so the relationship reads as familiar. A running counter tallies body executions and lands on the product of the two ranges. Then switch to the TRIANGULAR variant: the inner loop now starts at i plus one, so the cells at and below the diagonal are never lit and are drawn as permanently greyed. The lit region forms a visible triangle, the counter lands on n times n minus one over two, and a label makes the point that the greyed half is exactly the duplicated and self-paired work being skipped. Add a RESET panel showing an accumulator box positioned two ways: declared outside the outer loop it keeps its value as the i chip ticks, and its number visibly carries into the next row producing a running total; declared inside, it is drawn being destroyed and recreated empty at each outer tick. Finish with a GROWTH panel plotting body executions against n for one loop, two nested, and three nested, alongside a separate 2 to the n curve drawn in a different style and pulling away from all of them — labelled to make explicit that nested loops are polynomial and never exponential however many are stacked.

<!-- @sampleInput -->
```json
{"full":{"outerRange":3,"innerRange":4,"totalIterations":12,"order":"row-major"},"triangular":{"n":4,"innerStart":"i + 1","totalIterations":6,"formula":"n(n-1)/2","skipped":10},"reset":{"grid":[[1,2,3],[4,5,6],[7,8,9]],"outside":{"printed":[6,21,45],"correct":false},"inside":{"printed":[6,15,24],"correct":true}},"growth":{"n":[10,30,60,1000],"linear":[10,30,60,1000],"quadratic":[100,900,3600,1000000],"cubic":[1000,27000,216000,1000000000],"exponential":[1024,1073741824,1.15e18,null]}}
```

<!-- @highlights -->
- The grid is drawn with outer iterations as rows and inner iterations as columns, with i and j counter chips beside it.
- The j chip ticks through its full range, lighting each cell of the first row in turn.
- When j exhausts, the i chip ticks once and the j chip snaps back to its starting value — drawn as a reset, not a continuation.
- The odometer beside the grid turns its fast and slow digits in lockstep with j and i.
- The body counter lands on twelve, which is three rows multiplied by four columns.
- Switching to the triangular form starts j at i plus one, and the diagonal and everything below it stay permanently greyed.
- The lit cells form a visible triangle and the counter lands on six instead of sixteen.
- The greyed region is labelled as the duplicated and self-paired work being skipped.
- The reset panel shows an accumulator outside the outer loop keeping its value as i ticks, carrying 6 into the next row to give 21.
- Repositioned inside the outer loop, the same box is destroyed and recreated empty at each tick, giving 6, 15 and 24.
- The growth panel plots one, two and three nested loops as increasingly steep polynomial curves.
- A 2-to-the-n curve drawn in a different style pulls away from all three, making clear that nesting is polynomial and never exponential.

<!-- @edgeCases -->
- An inner loop whose range is empty for some outer values, where that outer iteration does no inner work at all.
- An outer loop that runs zero times, so the inner loop never executes despite being written.
- An inner bound that depends on the outer counter, producing a different number of iterations per row.
- Reusing the same counter variable for both loops, which stops the outer loop after a single pass.
- An accumulator declared outside the outer loop when a per-row value was intended.
- A jagged 2D structure where rows have different lengths, so a shared column bound reads out of bounds.
- break inside the inner loop, which leaves only that loop and lets the outer one continue.
- A triangular loop where the inner starts at i rather than i + 1, which reintroduces the self-comparisons.
- Three or more levels of nesting over a large n, where the iteration count becomes infeasible without any single loop looking wrong.
- Modifying the outer counter from inside the inner loop, which makes the total iteration count hard to reason about.

<!-- @pitfalls -->
- Using the same variable for both loops, so the inner loop drives the outer one to termination.
- Declaring a per-row accumulator outside the outer loop, producing running totals instead of row totals.
- Expecting break to leave both loops when it only leaves the innermost.
- Writing a nested loop without checking what n can reach, then timing out on large input.
- Calling nested loops exponential. Any fixed depth of nesting is polynomial; exponential means the exponent grows with n.
- Running both loops over the full range when each unordered pair is only needed once.
- Assuming a triangular loop improves the complexity class, when it only halves a constant factor.
- Assuming every row of a 2D structure has the same length, which is not guaranteed for jagged arrays.
- Putting columns in the outer loop for large matrices, which traverses against the memory layout and runs slower.
- Reaching for nesting when a hash set or sort would reduce the problem to a single pass.

<!-- @doubt -->
### How many times does the inner loop actually run?

<!-- @answer -->
Once in full for every single iteration of the outer loop. If the outer runs 3 times and the inner runs 4, the inner loop's body executes 12 times in total, but it does so as three separate four-counts rather than one count to twelve. The inner counter is re-initialised by its own header each time, which is why it restarts rather than continuing.

<!-- @doubt -->
### Why are my row sums coming out as running totals?

<!-- @answer -->
Because the accumulator is declared outside the outer loop, so it survives from one row to the next and keeps adding on top of the previous row's total. Move the declaration inside the outer loop, before the inner one, so a fresh accumulator is created for each row. The rule follows from the restart model: the inner loop starts over, so whatever it builds should usually start over with it.

<!-- @doubt -->
### Are nested loops exponential?

<!-- @answer -->
No, and the distinction matters. Any fixed number of nested loops over n is polynomial: two levels is O(n squared), three is O(n cubed), k levels is O(n to the k). Exponential means O(2 to the n), where the exponent itself grows with the input. At n equal to 60, a quadratic is 3,600 operations while 2 to the 60 is around 10 to the 18 — utterly different scales. You will see nested loops described as exponential in places; it is wrong, and complexity analysis depends on the difference.

<!-- @doubt -->
### Why start the inner loop at i + 1?

<!-- @answer -->
To generate each unordered pair exactly once. With both loops running the full range, you compare every element with itself and produce every pair twice, once in each order. Starting the inner counter at i plus one skips the diagonal and everything below it, leaving n times n minus one over two comparisons — roughly half. Use it whenever the order within the pair does not matter, which covers most pair-checking problems.

<!-- @doubt -->
### Does the triangular version make my algorithm faster?

<!-- @answer -->
About twice as fast in practice, and not at all in complexity terms. n times n minus one over two is still O(n squared), because Big O discards constant factors. That is a genuinely useful distinction: halving the work is real and worth doing, but it will not rescue a solution that is timing out. When the complexity class is the problem, you need a different approach rather than a tighter loop.

<!-- @doubt -->
### How do I break out of both loops at once?

<!-- @answer -->
break leaves only the innermost loop, so the outer one keeps going. Java has labelled break, which exits both directly. C++ and Python do not, so you either set a flag and test it in the outer condition, or — usually better — extract the loops into a function and return, which leaves every level at once regardless of depth. The break-and-continue subtopic covers all three approaches in detail.

<!-- @doubt -->
### When is a nested loop the wrong solution?

<!-- @answer -->
Whenever the inner loop is searching for something a data structure could find directly. Checking whether any pair sums to a target is O(n squared) with nesting and O(n) with a hash set that remembers what you have already seen. Sorting first often collapses a nested comparison into a single pass too. Writing the nested version first is fine when it helps you understand the problem — the skill is then asking whether the inner loop is really necessary.

<!-- @doubt -->
### Does it matter whether rows or columns go in the outer loop?

<!-- @answer -->
For correctness, no — both visit every cell. For speed on large matrices, yes. A 2D array is laid out in memory one row after another, so iterating rows in the outer loop reads consecutive memory addresses, which the processor's cache handles far better than jumping a full row's width on every step. Put rows outside and columns inside unless the problem specifically requires column-major order.
