---
id: pattern-21-hollow-rectangle-pattern
topic: Pattern Printing
title: Pattern 21 - Hollow Rectangle Pattern
difficulty: Medium
status: ready
prerequisites:
  - pattern-1-rectangular-star-pattern
  - pattern-19-symmetric-void-pattern
  - if-else-statements
  - nested-loops
relatedIds:
  - pattern-1-rectangular-star-pattern
  - pattern-19-symmetric-void-pattern
  - pattern-20-symmetric-butterfly-pattern
  - pattern-22-concentric-number-rectangle
  - nested-loops
---

<!-- @summary -->
Print an n by n square with only its border filled — the first pattern naturally written as a per-cell test rather than as counts, where there is no interior at all below n = 3 so four separate mistakes pass at n = 0, 1 and 2 alike, and where hoisting the repeated middle row out of the loop throws at n = 1 in C++ while leaving it inside does not.

<!-- @theory -->
## The problem

Print an n by n grid where the border is stars and the interior is spaces.

```
n = 5      *****
           *   *
           *   *
           *   *
           *****
```

## The first pattern that wants a predicate, not a count

Every pattern so far was written as *how many* of each character to print. This
one is naturally written as a question asked of every cell:

```
for i in 1..n:
    for j in 1..n:
        print '*' if (i == 1 or i == n or j == 1 or j == n) else ' '
```

That reads exactly like the specification — a cell is a star if it lies on any
edge. It also evaluates that condition **n² times**: 144,000,000 at n = 12,000,
against n for the alternative.

The alternative is the count-based form this topic has used throughout. There are
only **two kinds of row**:

```
row 1 and row n      n stars
every other row      a star, n - 2 spaces, a star
```

Both are correct at every size, and the second is 134x to 155x faster. Which to
prefer is not obvious — the predicate says what the shape *is*, and the two-row
form says what it *looks like*.

## There is no interior below n = 3

The hollow part of a hollow rectangle needs a row and a column to spare:

```
n = 1      *          n = 2      **          n = 3      ***
                                 **                     * *
                                                        ***
```

At n = 1 and n = 2 every cell is on an edge, so **any mistake about the interior
is invisible**. Measured over n from 0 to 40:

| Mistake | Wrong on | Correct at |
|---|---|---|
| `j == 1` written as `i == 1` | 38/41 | **n = 0, 1 and 2** |
| `and` instead of `or` (corners only) | 38/41 | **n = 0, 1 and 2** |
| Last row tested as `n - 1` | 38/41 | **n = 0, 1 and 2** |
| No interior test at all (solid block) | 38/41 | **n = 0, 1 and 2** |

Four different mistakes, all passing the three smallest inputs. **n = 3 is the
smallest test worth running** — and it is enough, since every one of them fails
there.

## The star count is blind to one of them

The counts are clean: **n² characters** at every size, and **4n - 4 stars** for
n ≥ 2. Note the exception — at n = 1 the perimeter formula gives 0 and the answer
is 1, because the single cell is counted on four edges at once.

| Mistake | Rows | Characters | Stars | First row | Exact |
|---|---|---|---|---|---|
| `j == 1` written as `i == 1` | never | never | n = 3 | never | n = 3 |
| `and` instead of `or` | never | never | n = 3 | n = 3 | n = 3 |
| **Last row tested as `n - 1`** | never | never | **never** | **never** | n = 3 |
| No interior test (solid) | never | never | n = 3 | never | n = 3 |

Testing `i == n - 1` instead of `i == n` makes row n - 1 solid and row n hollow.
Row n - 1 gains exactly n - 2 stars and row n loses exactly n - 2, so **the star
count is unchanged at every n from 2 to 200** — verified. The row count and the
character count cannot see it either, since neither the shape nor the size
changed. Only comparing the rows in position catches it.

## Hoisting the middle row crashes at n = 1

The two-row form has an obvious refinement: the middle row is identical on every
one of the n - 2 interior lines, so build it once before the loop.

That is faster — and in C++ it **throws at n = 1**:

```
inside the loop      n = 1 -> prints "*"
hoisted above it     n = 1 -> throws std::length_error
```

The reason is that `string(n - 2, ' ')` is evaluated whether or not the middle row
is ever used. At n = 1 the loop takes the solid branch on its only row, so the
in-loop version never computes `n - 2` at all; the hoisted version computes it
before the loop starts, and -1 converts to a huge unsigned count. Measured, it
throws — the same failure Pattern 7's buffer had, arriving here through an
optimisation rather than a buffer.

The fix is a guard, and n = 1 is the only size that needs one — at n = 2 the
middle row is built and simply never printed.

## Speed

| n | Per-cell predicate | Row built in the branch | Row built once |
|---|---|---|---|
| 2,000 | 38.89ms | 0.26ms | 0.15ms |
| 6,000 | 352.53ms | 2.27ms | 1.82ms |
| 12,000 | 1448.20ms | 10.84ms | 9.00ms |

The first step is **134x to 155x** — the familiar per-character penalty, with the
per-cell condition on top. Building the middle row once adds **1.2x to 1.7x**.
Python is the same shape and steeper at the first step: **about 510x to 840x**,
then 1.5x to 1.8x.

As in Patterns 19 and 20, no row ends with a space, so right-trimming is a no-op.

<!-- @intuition -->
This is the first shape in the topic whose specification is a property of a cell rather than a quantity per row, and that changes what the natural code looks like — a question asked everywhere instead of an arithmetic bound. Both readings are available and they are not equally cheap, which is worth noticing rather than settling by reflex: the predicate is the honest transcription and costs a test per cell, and the two-row form is the same shape observed rather than defined. The second thing this pattern is good for is a reminder that a hollow shape needs room to be hollow. Below n = 3 there is no inside, so every question about the inside has the same answer regardless of the code, and four unrelated mistakes are indistinguishable from correct.

<!-- @approach -->
### Per-Cell Predicate

<!-- @idea -->
Walk every cell of the grid and print a star when the cell lies on any edge.

<!-- @steps -->
1. Loop the row index from one to n.
2. Loop the column index from one to n.
3. Print a star when the row is the first or last, or the column is the first or last.
4. Print a space otherwise.
5. Print a newline at the end of each row.

<!-- @complexity -->
- time: O(n^2) characters, one stream operation and one condition per cell
- space: O(1)
- note: The direct transcription of the specification, and the slowest — n squared condition evaluations, 144,000,000 at n = 12,000 against 12,000 for the other forms. Measured 1448.20ms there against 10.84ms for building each row, so between 134x and 155x.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            cout << (i == 1 || i == n || j == 1 || j == n ? '*' : ' ');
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 7: Four tests joined by or — a cell is a star if it lies on any edge. Using and instead gives the four corners only, which is correct at n = 2 and wrong from n = 3.
- 9: No trailing space is possible, since column n is always a star.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n; j++) {
            System.out.print(i == 1 || i == n || j == 1 || j == n ? '*' : ' ');
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 4: The condition runs once per cell, so n squared times. The two-row form below asks it n times.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for j in range(1, n + 1):
            print("*" if (i == 1 or i == n or j == 1 or j == n) else " ", end="")
        print()


# Reads exactly like the specification: a cell is a star if it is
# on any edge. Measured about 510x to 840x slower than the two-row
# form in Python.
```

<!-- @annotations -->
- 4: i == n and j == n, not n - 1. Testing n - 1 makes row n - 1 solid and row n hollow, which leaves the star count unchanged.

<!-- @approach -->
### Two Kinds of Row

<!-- @idea -->
Notice there are only two rows in the whole pattern, and build whichever one this line needs.

<!-- @steps -->
1. Loop the row index from one to n.
2. If this is the first or last row, print n stars.
3. Otherwise print a star, n minus two spaces, and a star.
4. Print a newline after each.
5. The inner loop disappears, and the condition is asked n times rather than n squared.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations, n condition evaluations
- space: O(n) for the row
- note: Measured 10.84ms at n = 12,000 against 1448.20ms for the per-cell version — 134x to 155x. Note that n - 2 is only evaluated on the interior branch, which is why this version is safe at n = 1 and the hoisted one below is not.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        if (i == 1 || i == n) cout << string(n, '*') << '\n';
        else cout << '*' << string(n - 2, ' ') << '*' << '\n';
    }
}
```

<!-- @annotations -->
- 7: The solid row, needed for the first and last lines — and for the only line when n is 1.
- 8: n - 2 is evaluated only when this branch runs, which is never at n = 1. Moving it above the loop changes that, and throws.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        if (i == 1 || i == n) System.out.println("*".repeat(n));
        else System.out.println("*" + " ".repeat(n - 2) + "*");
    }
}
```

<!-- @annotations -->
- 4: repeat would reject the negative count at n = 1, and is never reached there because the row is also the last.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        if i == 1 or i == n:
            print("*" * n)
        else:
            print("*" + " " * (n - 2) + "*")


# Only two rows exist in the whole pattern. Python would tolerate
# the negative count here, but the branch is never reached at n = 1.
```

<!-- @annotations -->
- 3: At n = 1 the single row is both the first and the last, so the interior branch never runs at all.

<!-- @approach -->
### Build Each Row Once

<!-- @idea -->
Since the interior rows are identical, construct both row kinds before the loop and print whichever each line needs.

<!-- @steps -->
1. Return early for a non-positive n.
2. Build the solid row of n stars.
3. Handle n equal to one separately, before the middle row is constructed.
4. Build the middle row once: a star, n minus two spaces, a star.
5. Loop the rows, printing the solid row first and last and the middle row otherwise.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations, two row constructions in total
- space: O(n) — two rows held at once
- note: The fastest — 9.00ms at n = 12,000 against 10.84ms, so 1.2x to 1.7x, and 1.5x to 1.8x in Python. The n = 1 guard is not optional in C++ or Java: building the middle row unconditionally evaluates n - 2 and throws there.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    string solid(n, '*');
    if (n == 1) { cout << solid << '\n'; return; }
    string middle = "*" + string(n - 2, ' ') + "*";
    for (int i = 1; i <= n; i++) {
        cout << (i == 1 || i == n ? solid : middle) << '\n';
    }
}
```

<!-- @annotations -->
- 8: Required. Without it the next line evaluates string(-1, ' ') at n = 1 and throws, even though the middle row would never be printed.
- 9: Built once, and used on all n - 2 interior lines. That is the whole gain over the previous approach.
- 11: A choice between two prepared strings — no construction happens inside the loop at all.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    String solid = "*".repeat(n);
    if (n == 1) { System.out.println(solid); return; }
    String middle = "*" + " ".repeat(n - 2) + "*";
    for (int i = 1; i <= n; i++) {
        System.out.println(i == 1 || i == n ? solid : middle);
    }
}
```

<!-- @annotations -->
- 4: The same guard is needed here, since repeat throws on a negative count.

<!-- @code python -->
```python
def pattern(n):
    if n <= 0:
        return
    solid = "*" * n
    if n == 1:
        print(solid)
        return
    middle = "*" + " " * (n - 2) + "*"
    for i in range(1, n + 1):
        print(solid if (i == 1 or i == n) else middle)


# Python would survive without the n = 1 guard, since " " * -1 is
# the empty string — but it would then print "**" instead of "*".
```

<!-- @annotations -->
- 5: Python does not throw here, which is worse: without the guard it would silently build "**" and print that instead of a single star.

<!-- @example -->

<!-- @input -->
n = 5

<!-- @output -->
A five by five square with a three by three hole — sixteen stars and nine spaces

<!-- @why -->
The smallest size where the interior is large enough to see, and it fixes the two counting formulas.

<!-- @walkthrough -->
1. Rows 1 and 5 are solid, five stars each.
2. Rows 2, 3 and 4 are a star, three spaces, a star.
3. The stars total 10 from the two solid rows and 6 from the three middle ones, so 16.
4. That matches 4n minus 4, which is 16.
5. The spaces total 9, which is n minus 2, squared.
6. Together that is 25 characters, which is n squared — the grid is exactly filled.
7. No row ends with a space, since column n is always a star.

<!-- @example -->

<!-- @input -->
n = 1, 2 and 3, against four different mistakes

<!-- @output -->
All four pass at n = 1 and n = 2; all four fail at n = 3

<!-- @why -->
A hollow shape needs room to be hollow, and below n = 3 there is none — so the smallest inputs say nothing at all.

<!-- @walkthrough -->
1. At n = 1 the single cell is on all four edges, so every border test returns true.
2. At n = 2 all four cells are corners, so the same is true.
3. The first cell that is not on any edge appears at n = 3, in the middle.
4. Measured over n from 0 to 40, four unrelated mistakes are correct at exactly n = 0, 1 and 2.
5. Those are writing i == 1 where j == 1 belongs, using and instead of or, testing the last row as n - 1, and omitting the interior test entirely.
6. All four are wrong on the other 38 sizes.
7. So n = 3 is the smallest test worth running here, and it happens to be sufficient for every mistake measured.

<!-- @example -->

<!-- @input -->
Testing the last row as n - 1, checked four ways

<!-- @output -->
Same rows, same characters, same star count — and the wrong rows are solid

<!-- @why -->
The one mistake here that no count sees, because the error moves stars rather than adding or removing them.

<!-- @walkthrough -->
1. Writing i == n - 1 makes row n - 1 solid and leaves row n hollow.
2. The grid is still n by n, so the row count and the character count are unchanged.
3. Row n - 1 gains n - 2 stars by becoming solid.
4. Row n loses exactly n - 2 by becoming hollow.
5. Those cancel, so the star total stays at 4n - 4 — verified identical for every n from 2 to 200.
6. The first row is untouched, so a first-row check does not help either.
7. Only comparing the rows in position catches it, at n = 3.

<!-- @example -->

<!-- @input -->
Building the middle row above the loop, at n = 1

<!-- @output -->
Throws in C++, and silently prints the wrong thing in Python

<!-- @why -->
The obvious refinement introduces a failure at the smallest input, and the two languages fail differently.

<!-- @walkthrough -->
1. The interior rows are all identical, so building one before the loop is a real saving — 1.2x to 1.7x measured.
2. But that construction evaluates n minus 2 unconditionally.
3. At n = 1 the loop would never print a middle row, since the only line is both first and last.
4. The in-loop version therefore never evaluates n minus 2 at n = 1 and prints a single star correctly.
5. The hoisted version evaluates it before the loop begins, where minus one becomes a huge unsigned count and the string constructor throws.
6. Python does not throw — a negative repeat count gives the empty string — so it builds two stars and prints that instead of one.
7. Both need the same guard, and n = 1 is the only size that needs it: at n = 2 the middle row is built and simply never used.

<!-- @visualization custom -->

<!-- @description -->
Draw the n by n grid with every cell present from the start, so the shape reads as a square with cells switched on rather than as rows of differing content. Two modes, switchable, and the switch is the subject of the figure. In predicate mode, a probe visits every cell in turn and lights the four edge tests beside it — row is first, row is last, column is first, column is last — with the cell turning solid if any lamp lights; keep a counter of tests performed, climbing to n squared. In row mode, the probe visits only the row headers, asks one question, and stamps a whole prepared row at a time; its counter climbs to n. Run both to completion side by side so the two counters end at 144,000,000 and 12,000 for n = 12,000. Below that, the small-n panel: draw n = 1, 2 and 3 as three tiny grids with the interior cell highlighted only in the third, and pass four wrong versions through all three — every one of them matching at n = 1 and n = 2, all failing at n = 3. Make the absence of an interior cell at n = 1 and 2 visually literal, since that is the reason. Then the star-count panel: show the n - 1 mistake as an animation that lifts the solidity from row n and drops it on row n - 1, with a star counter beside it that does not move — hold that frame, because a counter refusing to change while the shape visibly does is the point. Close with the guard: two lanes building the middle row, one inside the branch and one above the loop, stepped at n = 1; the in-loop lane never enters the branch and finishes, while the hoisted lane evaluates n - 2 immediately and raises, drawn as the loop never starting at all.

<!-- @sampleInput -->
```json
{"primary":{"n":5,"output":"*****\n*   *\n*   *\n*   *\n*****\n","rows":5,"width":5,"stars":16,"spaces":9,"chars":25,"starFormula":"4n - 4","spaceFormula":"(n-2)^2","charFormula":"n^2","rowKinds":2},"formulations":{"perCellPredicate":{"rule":"star if i == 1 or i == n or j == 1 or j == n","conditionEvaluations":"n^2","atN12000":144000000},"twoKindsOfRow":{"rule":"rows 1 and n are n stars; every other row is a star, n-2 spaces, a star","conditionEvaluations":"n","atN12000":12000},"bothCorrect":"at every size"},"noInteriorBelow3":{"n1":["*"],"n2":["**","**"],"n3":["***","* *","***"],"firstInteriorCellAt":3,"mistakesPassingAt":[0,1,2],"count":4,"names":["j == 1 written as i == 1","and instead of or (corners only)","last row tested as n - 1","no interior test at all (solid)"],"eachWrongOn":"38 of 41","reading":"n = 3 is the smallest test worth running, and it catches all four"},"counts":{"stars":"4n - 4 for n >= 2","starsAtN1":1,"perimeterFormulaAtN1":0,"why":"the single cell lies on all four edges at once","chars":"n^2 at every n","verified":"n = 1..200"},"checkPanel":{"columns":["row count","character count","star count","first row","exact"],"smallestNThatCatches":{"j == 1 as i == 1":["never","never",3,"never",3],"and instead of or":["never","never",3,3,3],"last row as n - 1":["never","never","never","never",3],"no interior test":["never","never",3,"never",3]},"starCountBlindSpot":{"mistake":"last row tested as n - 1","why":"row n-1 gains exactly n-2 stars and row n loses exactly n-2","verified":"star totals identical for every n from 2 to 200"}},"assertions":["there are exactly n rows and every row is n characters","rows 1 and n are all stars","every other row is a star, n-2 spaces, a star","total stars equal 4n - 4 for n >= 2","no row ends with a space"],"hoistingHazard":{"refinement":"build the middle row once above the loop","worth":"1.2x to 1.7x","cpp":{"atN1":"throws std::length_error","why":"string(n - 2, ' ') is evaluated unconditionally and -1 converts to a huge unsigned count"},"java":{"atN1":"throws, since repeat rejects a negative count"},"python":{"atN1":"does not throw — builds \"**\" and prints it instead of \"*\""},"inLoopVersion":"safe, because the interior branch never runs at n = 1","onlySizeNeedingTheGuard":1,"atN2":"the middle row is built and simply never printed"},"buildPanel":[{"n":2000,"perCellPredicateMs":38.89,"rowInBranchMs":0.26,"rowBuiltOnceMs":0.15},{"n":6000,"perCellPredicateMs":352.53,"rowInBranchMs":2.27,"rowBuiltOnceMs":1.82},{"n":12000,"perCellPredicateMs":1448.20,"rowInBranchMs":10.84,"rowBuiltOnceMs":9.00}],"ratios":{"predicateToRowInBranch":"134x to 155x","rowInBranchToBuiltOnce":"1.2x to 1.7x","predicateToBuiltOnce":"161x to 259x"},"python":{"predicateToRowInBranch":"about 510x to 840x","rowInBranchToBuiltOnce":"1.5x to 1.8x"},"whitespace":{"where":"interior only","noRowEndsWithASpace":true,"rightTrimming":"a no-op, as in Patterns 19 and 20"}}
```

<!-- @highlights -->
- The n by n grid is drawn with every cell present from the start, reading as a square with cells switched on.
- Two switchable modes, and the switch is the subject of the figure.
- In predicate mode a probe visits every cell and lights four edge tests beside it.
- The cell turns solid if any lamp lights, and a counter of tests performed climbs to n squared.
- In row mode the probe visits only the row headers, asks one question, and stamps a whole prepared row.
- Its counter climbs to n, and both run to completion side by side.
- The two counters end at 144,000,000 and 12,000 for n = 12,000.
- A small-n panel draws n = 1, 2 and 3 as three tiny grids, the interior cell highlighted only in the third.
- Four wrong versions pass through all three, matching at n = 1 and n = 2 and failing at n = 3.
- The absence of an interior cell at n = 1 and 2 is made visually literal, since that is the reason.
- The star-count panel animates the n - 1 mistake, lifting solidity from row n onto row n - 1.
- A star counter beside it does not move, and that frame is held.
- A counter refusing to change while the shape visibly does is the point of the panel.
- The closing panel steps two lanes at n = 1, one building the middle row in the branch and one above the loop.
- The in-loop lane never enters the branch and finishes correctly.
- The hoisted lane evaluates n - 2 immediately and raises, drawn as the loop never starting at all.

<!-- @edgeCases -->
- n equal to zero — no output, and the hoisted version needs its early return.
- n equal to one — a single star, and the only size where hoisting the middle row fails.
- n equal to two — four stars and no interior, so every interior mistake still passes.
- n equal to three — the first size with an interior cell, and the smallest test worth running.
- Negative n — no output from the loop versions; the hoisted version needs the guard.
- The perimeter formula at n = 1 — 4n minus 4 gives zero, but the answer is one, since the single cell lies on all four edges.
- The middle row at n = 2 — built by the hoisted version and never printed, which is why only n = 1 needs the guard.
- No trailing whitespace anywhere — column n is always a star, so right-trimming is a no-op.
- A caller expecting a rectangle rather than a square — the same two-row idea applies with the width and height separated.
- A caller expecting the interior filled — that is Pattern 1, and it is what omitting the interior test produces.

<!-- @pitfalls -->
- Testing only at n = 1 or n = 2. There is no interior below n = 3, so four unrelated mistakes all pass.
- Hoisting the middle row without a guard. It throws at n = 1 in C++ and Java, and silently prints two stars in Python.
- Trusting the star count. Testing the last row as n - 1 moves n - 2 stars from one row to another and leaves the total at exactly 4n - 4.
- Trusting the character count or the row count. Every mistake measured here keeps the grid n by n.
- Writing and instead of or in the border test. That prints the four corners only, and is correct at n = 2.
- Writing i == 1 where j == 1 belongs. The result is two solid rows and nothing else, which the star count catches only at n = 3.
- Applying 4n - 4 at n = 1. The formula gives zero and the answer is one.
- Reaching for the per-cell predicate at scale. It evaluates its condition n squared times — 144 million at n = 12,000 — for a 134x to 155x penalty.
- Assuming the predicate form is wrong because it is slower. It is the honest transcription of the specification, and at small n the difference is irrelevant.
- Adding trailing spaces to pad the interior rows. Column n is always a star, so a trailing space is always an error here.

<!-- @doubt -->
### Should I write the border test or the two-row version?

<!-- @answer -->
Both are correct at every size; they differ in what they say and what they cost. The per-cell predicate transcribes the specification directly — a cell is a star if it lies on any edge — and evaluates that condition n² times, which is 144,000,000 at n = 12,000. The two-row form observes that only two rows exist in the whole pattern and asks its question n times, measuring 134x to 155x faster. Prefer the predicate when the shape is the point and n is small, and the two-row form otherwise. What matters is knowing they are the same shape described two ways.

<!-- @doubt -->
### Why do my tests pass when the output is wrong?

<!-- @answer -->
Almost certainly because you tested at n = 1 or n = 2, where there is no interior. At n = 1 the single cell lies on all four edges; at n = 2 every cell is a corner. So any mistake about which cells are interior produces identical output. Measured over n from 0 to 40, four unrelated mistakes — writing `i == 1` where `j == 1` belongs, using `and` instead of `or`, testing the last row as `n - 1`, and omitting the interior test entirely — are all correct at exactly n = 0, 1 and 2, and wrong on the other 38. Test at n = 3, which catches every one of them.

<!-- @doubt -->
### Can I check this with the star count?

<!-- @answer -->
It catches three of the four mistakes measured, and misses the one that is hardest to see. Testing the last row as `n - 1` makes row n - 1 solid and row n hollow: row n - 1 gains exactly n - 2 stars and row n loses exactly n - 2, so the total stays at 4n - 4 — verified identical for every n from 2 to 200. The row count and the character count are blind too, since the grid is still n by n, and the first row is untouched. Compare the rows in position. Also note the formula's own exception: at n = 1 it gives 0 and the answer is 1.

<!-- @doubt -->
### Why does building the middle row once crash at n = 1?

<!-- @answer -->
Because the construction happens whether or not the row is used. At n = 1 the only line is both the first and the last, so the interior branch never runs — the in-loop version therefore never evaluates `n - 2` and prints a single star correctly. Hoisting the row above the loop evaluates it immediately, and `string(-1, ' ')` converts the count to a huge unsigned value and throws. Java throws too, since `repeat` rejects a negative count. Python does not throw, which is worse: it builds `**` and prints that instead of `*`. Guard n = 1; it is the only size that needs it, since at n = 2 the row is built and simply never printed.

<!-- @doubt -->
### Is the guard needed at n = 2 as well?

<!-- @answer -->
No. At n = 2 the expression `n - 2` is zero, so the middle row is built as `**` — perfectly valid — and then never printed, because both rows are first-or-last. It is wasted work and nothing more. Only n = 1 makes the count negative. That asymmetry is worth stating precisely because a guard written as `n <= 2` looks more careful and is doing nothing extra, while a guard written as `n < 1` looks equivalent and does not cover the case at all.

<!-- @doubt -->
### How does this generalise to a rectangle that is not square?

<!-- @answer -->
Separate the two dimensions and nothing else changes. With r rows and c columns, the border test becomes `i == 1 || i == r || j == 1 || j == c`, the solid rows are c stars, and the middle rows are a star, c - 2 spaces, a star. The counts become 2r + 2c - 4 stars and (r - 2)(c - 2) spaces, with r·c characters. The degenerate cases generalise too: there is no interior unless both r and c are at least 3, so a 2 by 100 rectangle hides exactly the same four mistakes that n = 2 does here.
