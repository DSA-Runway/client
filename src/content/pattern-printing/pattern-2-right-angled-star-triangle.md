---
id: pattern-2-right-angled-star-triangle
topic: Pattern Printing
title: Pattern 2 - Right-Angled Star Triangle
difficulty: Easy
status: ready
prerequisites:
  - pattern-1-rectangular-star-pattern
  - nested-loops
  - for-loop
  - variables-and-constants
relatedIds:
  - pattern-1-rectangular-star-pattern
  - pattern-3-right-angled-number-triangle
  - pattern-5-inverted-right-angled-star-triangle
  - nested-loops
---

<!-- @summary -->
Print a triangle whose rows grow by one star — the first pattern where the row length depends on the row index, where every index mistake fails from n = 1 yet a different bug still hides there, and where each row being the previous plus one star makes growing a single string 1.30x to 1.73x faster than rebuilding it.

<!-- @theory -->
## The problem

Print n rows where row i holds i stars, counting rows from one.

```
n = 4      *
           **
           ***
           ****
```

## The one thing that changed

In **Pattern 1** every row was identical, so the inner loop ran a fixed n times
and the row could be built once outside the loop. Here the inner loop's bound
**depends on the outer loop's counter**, which is the idea this whole topic is
built on.

Counting rows from zero, row `i` needs `i + 1` stars:

```
for i in 0..n-1:
    for j in 0..i:          <- bound depends on i
        print a star
    print a newline
```

The `+1` is because row 0 must still print one star. Counting from one instead,
row `i` needs `i` stars and the inner bound is `j <= i` — the same thing said
differently, and worth picking one convention rather than mixing them.

## The count is now triangular

A useful check, and a different one from Pattern 1:

| n | Stars in this triangle | Stars in a rectangle |
|---|---|---|
| 4 | 10 | 16 |
| 10 | 55 | 100 |
| 100 | **5,050** | 10,000 |

The total is `n(n+1)/2` rather than `n²`. At n = 100 that is 5,050 against
10,000 — so a version that accidentally prints a rectangle is off by nearly half,
and simply counting stars catches it.

## Every index mistake fails at n = 1 — but one bug still hides

This is the useful contrast with Pattern 1, where the classic newline error was
invisible at n = 1. Measured against the correct output for every n from 0 to 40:

| Mistake | Wrong on | Correct only at |
|---|---|---|
| Inner loop runs `i` times, not `i + 1` | 40/41 | n = 0 |
| Inner loop runs `i + 2` times | 40/41 | n = 0 |
| 1-indexed rows with a `< i` bound | 40/41 | n = 0 |
| **Row length fixed at n (a rectangle)** | 39/41 | **n = 0 and n = 1** |

The index bugs all break immediately. But forgetting the dependency altogether —
printing n stars on every row — still passes at n = 1, because a one-row triangle
and a one-row rectangle are the same single star.

So n = 1 remains a blind spot; it has just moved to a different bug. The reliable
rule from Pattern 1 stands: **test at n = 3 or more.**

## Two different mistakes, one identical output

Running the inner loop `i` times with zero-indexed rows, and running it `< i`
times with one-indexed rows, are different errors — but they produce **exactly the
same wrong output**, verified identical for every n from 0 to 199:

```
n = 4      (empty line)
           *
           **
           ***
```

Both lose one star per row and leave the first row empty. Worth knowing because
the symptom does not tell you which mistake you made — you have to look at the
loop, not the output.

## Here, every bug changes the star count

In Pattern 1 the two newline mistakes produced exactly the right number of stars
and only the wrong shape, so counting characters missed them entirely. Here the
picture is simpler: at n = 4 the correct answer is 10 stars, and

| Variant | Lines | Stars |
|---|---|---|
| correct | 4 | **10** |
| one short per row | 4 | 6 |
| one long per row | 4 | 14 |
| rectangle | 4 | 16 |

every mistake shifts the count. So for this pattern the star total is a genuinely
sufficient check — which is not something to generalise, since it was not true one
pattern ago.

The stronger assertion, and the one that transfers: **line i must have exactly
i + 1 characters**, so the line lengths are 1, 2, 3, … n exactly.

## Building the rows

The row now differs per line, so it cannot be built once outside the loop. Three
ways to build it, measured:

| n | Star at a time | Fresh string per row | Grow one string | Fresh vs grow |
|---|---|---|---|---|
| 500 | 2.38ms | 0.06ms | **0.03ms** | 1.73x |
| 2,000 | 18.61ms | 0.22ms | **0.15ms** | 1.42x |
| 6,000 | 170.59ms | 1.76ms | **1.35ms** | 1.30x |

Two separate results there.

**Per-row instead of per-character is worth about 97x** at n = 6,000, which is the
same lesson as Pattern 1 and the one that matters most.

**Growing a single string is worth a further 1.30x to 1.73x**, and it is specific
to this shape: row i+1 is exactly row i plus one more star, so you can keep one
string and append to it rather than constructing a fresh one of i+1 stars each
time. That opportunity exists because the rows nest — it will not be available in
every pattern, and it is worth noticing when it is.

<!-- @intuition -->
The rectangle needed the inner loop to ignore which row it was on; the triangle needs it to care. Once the inner bound is written in terms of the outer counter, the shape follows from the arithmetic rather than from anything you draw — row zero gets one star, row one gets two, and the diagonal edge is just that relationship made visible. The other thing worth seeing is that each row contains the whole of the row above it plus one more star, so nothing about the previous row needs discarding; you can hold one growing string and add to it, rather than starting each row from nothing.

<!-- @approach -->
### Star at a Time

<!-- @idea -->
Nested loops where the inner bound is the outer counter, printing one star per inner iteration.

<!-- @steps -->
1. Loop over the rows from zero up to but not including n.
2. Inside it, loop from zero up to and including the current row index.
3. That runs the inner loop i plus one times for row i.
4. Print a single star on each inner iteration.
5. Print a newline after the inner loop finishes.

<!-- @complexity -->
- time: O(n^2) characters, and one stream operation per character
- space: O(1)
- note: The direct translation, and the version to write first because the bound is visible in it. Measured 170.59ms at n = 6,000 against 1.76ms for building each row — about 97x, the same per-character cost measured in Pattern 1.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= i; j++) {
            cout << '*';
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: j <= i, so row i gets i + 1 stars. Writing j < i loses one per row and leaves the first row empty.
- 9: The newline still belongs to the outer loop, exactly as in Pattern 1.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 0; i < n; i++) {
        for (int j = 0; j <= i; j++) {
            System.out.print('*');
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 3: The inner bound depends on the outer counter, which is the whole difference from Pattern 1.

<!-- @code python -->
```python
def pattern(n):
    for i in range(n):
        for j in range(i + 1):       # i + 1 stars on row i
            print("*", end="")
        print()


# range(i + 1) rather than range(i): row 0 must still print one star.
```

<!-- @annotations -->
- 3: range(i + 1) yields i + 1 values. Writing range(i) leaves row zero empty and loses a star from every row.

<!-- @approach -->
### Fresh Row Each Time

<!-- @idea -->
Build each row as a string of the right length and print it in one operation.

<!-- @steps -->
1. Loop over the rows.
2. For row i, construct a string of i plus one stars using repetition.
3. Print that string followed by a newline.
4. The inner loop disappears.
5. The number of stream operations drops from the total star count to n.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations
- space: O(n) for the longest row
- note: Recovers almost all the available speed — 1.76ms at n = 6,000 against 170.59ms printing star by star, about 97x. The row must be built inside the loop here, unlike Pattern 1 where every row was identical.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 0; i < n; i++) {
        cout << string(i + 1, '*') << '\n';
    }
}
```

<!-- @annotations -->
- 7: A fresh string of i + 1 stars per row, constructed inside the loop because the length changes.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 0; i < n; i++) {
        System.out.println("*".repeat(i + 1));
    }
}
```

<!-- @annotations -->
- 3: repeat takes the count directly, so the row length is stated rather than looped.

<!-- @code python -->
```python
def pattern(n):
    for i in range(n):
        print("*" * (i + 1))


# The whole pattern in two lines, because the row length is arithmetic
# rather than a loop.
```

<!-- @annotations -->
- 3: Repetition by i + 1, which is the same bound the nested version expresses as range(i + 1).

<!-- @approach -->
### Grow One Row

<!-- @idea -->
Keep a single string and append one star per row, since each row is the previous row plus one star.

<!-- @steps -->
1. Create one empty string and reserve space for n characters.
2. Loop over the rows.
3. Append one star to the string.
4. Print the string followed by a newline.
5. No row is ever rebuilt, because each one extends the last.

<!-- @complexity -->
- time: O(n^2) characters, n appends and n stream operations
- space: O(n) for the single growing row
- note: The fastest measured, at 1.35ms against 1.76ms for constructing a fresh row each time at n = 6,000 — between 1.30x and 1.73x. The saving exists because the rows nest, so it is specific to this shape rather than a general technique.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    string row;
    row.reserve(n);
    for (int i = 0; i < n; i++) {
        row.push_back('*');            // row i is row i-1 plus one star
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 7: Reserving n up front, since the row ends at exactly n characters and never shrinks.
- 9: Appending rather than rebuilding, which is what the nesting of the rows allows.

<!-- @code java -->
```java
static void pattern(int n) {
    StringBuilder row = new StringBuilder(n);
    for (int i = 0; i < n; i++) {
        row.append('*');
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 2: A builder sized to the final row, so no reallocation happens during the loop.

<!-- @code python -->
```python
def pattern(n):
    row = ""
    for i in range(n):
        row += "*"                     # row i is row i-1 plus one star
        print(row)


# Measured 1.30x to 1.73x faster than rebuilding the row each time in C++.
# In Python the same trick is less clear-cut, since strings are immutable
# and += may or may not extend in place.
```

<!-- @annotations -->
- 4: In CPython this often extends in place when the string has one reference, but that is an implementation detail rather than a guarantee.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
Four rows of one, two, three and four stars — ten stars in total

<!-- @why -->
Small enough to count by hand, and it fixes the triangular total that distinguishes this pattern from the rectangle.

<!-- @walkthrough -->
1. The outer loop runs for i values 0, 1, 2 and 3.
2. At i = 0 the inner loop runs once, since j goes from 0 up to and including 0 — one star.
3. At i = 1 it runs twice, giving two stars, and so on.
4. Each row is followed by a newline printed after the inner loop.
5. The line lengths are 1, 2, 3 and 4, increasing by exactly one each time.
6. The total is 1 + 2 + 3 + 4, which is 10 — matching n times n plus one over two.
7. A rectangle of the same height would have 16 stars, which is how counting catches that mistake.

<!-- @example -->

<!-- @input -->
n = 1, testing a version whose row length is fixed at n

<!-- @output -->
Correct — so n = 1 is still a blind spot, just for a different bug

<!-- @why -->
Pattern 1's blind spot was the newline; here it is the row-length dependency, which is worth seeing before assuming the earlier lesson was specific to that pattern.

<!-- @walkthrough -->
1. The correct output at n = 1 is a single star followed by a newline.
2. A version that prints n stars on every row also prints a single star, since n is 1.
3. So the dependency on the row index is never exercised.
4. Every index mistake, by contrast, does fail at n = 1 — the short version leaves the row empty.
5. From n = 2 the rectangle version diverges: it gives two rows of two stars where the triangle gives one and two.
6. Measured across n from 0 to 40, the rectangle version is wrong on 39 of the 41 values.
7. The two it passes are n = 0 and n = 1, which is why n = 3 remains the smallest test worth trusting.

<!-- @example -->

<!-- @input -->
Two different off-by-one mistakes, at n = 4

<!-- @output -->
Byte-identical output — an empty first row, then one, two and three stars

<!-- @why -->
Shows that the symptom does not identify the cause, so the fix has to come from reading the loop rather than the output.

<!-- @walkthrough -->
1. The first mistake counts rows from zero and runs the inner loop i times instead of i plus one.
2. The second counts rows from one and keeps a strictly-less-than bound, so row i gets i minus one stars.
3. Both lose exactly one star from every row.
4. Both therefore leave the first row completely empty and end one star short.
5. Verified identical for every n from 0 to 199 — they are the same function written two ways.
6. At n = 4 both give 6 stars where the answer is 10.
7. Seeing an empty first row tells you a star is missing per row, but not which of the two conventions slipped.

<!-- @example -->

<!-- @input -->
n = 6,000, built three different ways

<!-- @output -->
170.59ms star by star, 1.76ms per row, 1.35ms growing one string

<!-- @why -->
Separates the large general win from the small pattern-specific one, so the second is not mistaken for a technique that always applies.

<!-- @walkthrough -->
1. Printing star by star performs about eighteen million stream operations at this size.
2. Building each row and printing it once drops that to 6,000 operations.
3. That measured 1.76ms against 170.59ms — about 97 times, which is the same effect measured in Pattern 1.
4. Constructing a fresh string of i plus one stars per row still allocates and fills once per row.
5. Because row i is exactly row i minus one plus a star, a single string can be appended to instead.
6. That measured 1.35ms, a further 1.30 times at this size and 1.73 times at n = 500.
7. The second saving depends on the rows nesting, so it is available here and will not be in every pattern.

<!-- @visualization custom -->

<!-- @description -->
A grid with the row counter and the inner bound shown as a linked pair — the inner loop's limit box should visibly take its value from the outer counter at the start of each row, drawn as an arrow copying the number across, because that copy is the entire difference from Pattern 1 and the mechanic every later pattern reuses. Fill the grid star by star, and as each row completes leave its completed length labelled in the margin so the sequence 1, 2, 3, 4 builds up as a visible column of numbers rather than something the reader has to infer from the shape. Alongside, keep a running star total next to the formula n(n+1)/2 evaluating in step, and a greyed rectangle outline behind the triangle showing the n squared it is not — at n = 4 the filled triangle reads 10 against the outline's 16, and at n = 100 the labels read 5,050 against 10,000. Then a bug panel showing the two off-by-one mistakes side by side: one with zero-indexed rows and a strictly-less-than bound, one with one-indexed rows and the same bound, their loop headers visibly different and their grids visibly identical, both opening with an empty first row. Annotate that they agree for every n tested to 199, so the output cannot tell them apart. Add a third grid with the inner bound left at n, which fills a full rectangle — and run all three at n = 1 first, where the rectangle grid is indistinguishable from the correct one, before stepping to n = 2 where it separates. Close with a row-building panel: three lanes producing the same triangle, the first emitting one star per stream click, the second allocating a fresh row block per line, the third holding one block that grows by a single cell each line with no reallocation — time bars beneath reading 170.59ms, 1.76ms and 1.35ms, with the first gap marked as the one that matters and the second as specific to rows that nest.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"*\n**\n***\n****\n","lines":4,"lineLengths":[1,2,3,4],"stars":10,"formula":"n(n+1)/2","rectangleWouldBe":16,"innerBound":"j from 0 to i inclusive"},"countPanel":[{"n":4,"triangle":10,"rectangle":16},{"n":10,"triangle":55,"rectangle":100},{"n":100,"triangle":5050,"rectangle":10000}],"bugPanel":{"variants":[{"name":"inner runs i times (0-indexed)","wrongOn":"40 of 41","correctAt":[0],"starsAtN4":6,"firstRow":"empty"},{"name":"1-indexed rows with < i","wrongOn":"40 of 41","correctAt":[0],"starsAtN4":6,"firstRow":"empty"},{"name":"inner runs i+2 times","wrongOn":"40 of 41","correctAt":[0],"starsAtN4":14},{"name":"row length fixed at n (rectangle)","wrongOn":"39 of 41","correctAt":[0,1],"starsAtN4":16}],"identicalPair":{"a":"inner runs i times (0-indexed)","b":"1-indexed rows with < i","differOn":0,"tested":"n = 0 to 199","note":"same symptom, two different causes"},"blindSpot":{"n":1,"bug":"row length fixed at n","why":"a one-row triangle and a one-row rectangle are the same single star"},"contrastWithPattern1":"there the newline bug hid at n=1; here the index bugs all fail at n=1 and the dependency bug hides instead"},"assertions":["line i has exactly i+1 characters","line lengths are 1,2,3,...,n","total stars equal n(n+1)/2"],"buildPanel":[{"n":500,"perCharMs":2.38,"freshRowMs":0.06,"growRowMs":0.03,"freshVsGrow":1.73},{"n":2000,"perCharMs":18.61,"freshRowMs":0.22,"growRowMs":0.15,"freshVsGrow":1.42},{"n":6000,"perCharMs":170.59,"freshRowMs":1.76,"growRowMs":1.35,"freshVsGrow":1.30}],"perCharVsPerRowAt6000":96.9,"growRationale":"row i is exactly row i-1 plus one star, so the rows nest and nothing needs rebuilding"}
```

<!-- @highlights -->
- The inner loop's limit box visibly takes its value from the outer row counter at the start of each row, drawn as an arrow copying the number across.
- That copy is the entire difference from Pattern 1 and the mechanic every later pattern reuses.
- The grid fills star by star, and each completed row leaves its length labelled in the margin.
- Those labels build up as a visible column reading 1, 2, 3, 4 rather than being inferred from the shape.
- A running star total sits beside the formula n(n+1)/2 evaluating in step.
- A greyed rectangle outline behind the triangle shows the n squared it is not.
- At n = 4 the filled triangle reads 10 against the outline's 16, and at n = 100 it reads 5,050 against 10,000.
- A bug panel shows two off-by-one mistakes side by side, their loop headers visibly different.
- Their grids are visibly identical, both opening with an empty first row.
- The panel notes they agree for every n tested to 199, so the output cannot tell them apart.
- A third grid leaves the inner bound at n and fills a full rectangle.
- All three run at n = 1 first, where the rectangle grid is indistinguishable from the correct one.
- Stepping to n = 2 separates them, showing where the blind spot ends.
- A row-building panel runs three lanes producing the same triangle.
- The first emits one star per stream click, the second allocates a fresh row per line, the third grows one block by a single cell per line.
- Time bars read 170.59ms, 1.76ms and 1.35ms, the first gap marked as the one that matters and the second as specific to rows that nest.

<!-- @edgeCases -->
- n equal to zero — no output, and the outer loop never runs.
- n equal to one — a single star, and the size where a fixed row length is indistinguishable from the correct version.
- n equal to two — the smallest input that separates the triangle from the rectangle.
- n equal to three — the smallest input worth trusting, since it exercises the dependency properly.
- Negative n — no output, since the loop does not run.
- Very large n — the output is n times n plus one over two characters, so n of ten thousand is about fifty million.
- One-indexed row counting — the inner bound becomes j <= i rather than j <= i - 1, and mixing conventions is where the off-by-ones come from.
- A caller expecting the triangle to point the other way — that is Pattern 5, with the row length running n down to one.
- A caller expecting no trailing newline after the final row — worth settling, as with every pattern.
- Output where each star is followed by a space — a different format, and the line-length assertion changes with it.

<!-- @pitfalls -->
- Writing the inner bound as j < i rather than j <= i. Every row loses a star and the first row comes out empty — measured wrong on 40 of 41 values of n.
- Mixing zero-indexed and one-indexed conventions. Counting rows from one while keeping a strictly-less-than bound produces exactly the same wrong output as the previous mistake, so the symptom does not identify the cause.
- Leaving the inner bound at n. The output is a rectangle, which is wrong on 39 of 41 values but passes at n = 1.
- Testing only at n = 1. Every index mistake fails there, but the missing dependency does not — so the test looks more informative than it is.
- Building the row outside the loop. That worked in Pattern 1 because every row was identical; here the length changes each time.
- Asserting only the total star count. It happens to be sufficient for this pattern, but it was not for Pattern 1 and will not be in general — assert the per-line lengths.
- Forgetting that the total is triangular rather than square. At n = 100 the answer is 5,050 stars, not 10,000.
- Printing star by star at scale. Measured about 97 times slower than building each row at n = 6,000.
- Assuming the grow-one-string trick applies everywhere. It works here only because each row contains the previous one.
- Reserving the wrong capacity when growing the row. The final row is n characters, so reserving n is exact and reserving less forces reallocation.

<!-- @doubt -->
### Why is the inner bound j <= i rather than j < i?

<!-- @answer -->
Because row i must contain i + 1 stars when rows are counted from zero — row 0 needs one star, not none. A strictly-less-than bound gives row i exactly i stars, which leaves the first row empty and loses one star from every subsequent row. Measured against the correct output for every n from 0 to 40, that is wrong on 40 of them, passing only at n = 0 where nothing is printed either way. If you prefer counting rows from one, the bound becomes j <= i with i starting at 1 — the important thing is to pick one convention and not mix them.

<!-- @doubt -->
### I get an empty first row. Which mistake is it?

<!-- @answer -->
The output cannot tell you, which is the point worth knowing here. Two different mistakes produce it: counting rows from zero with a strictly-less-than inner bound, and counting rows from one while keeping that same bound. Verified byte-identical for every n from 0 to 199 — they are the same function written two ways. Both lose exactly one star per row. So read the loop headers rather than the output: check whether the outer counter starts at 0 or 1, and then whether the inner bound accounts for it.

<!-- @doubt -->
### Pattern 1 said n = 1 is a useless test. Is that still true here?

<!-- @answer -->
Yes, though for a different bug. Here every index mistake does fail at n = 1 — a short inner bound leaves the row empty, and a long one prints two stars. But forgetting the dependency entirely, and leaving the inner bound at n, still passes: a one-row triangle and a one-row rectangle are both a single star. That version is wrong on 39 of the 41 values from 0 to 40 and passes exactly at n = 0 and n = 1. The general rule survives unchanged: test at n = 3 or more, where the shape is genuinely exercised.

<!-- @doubt -->
### Is counting stars enough to check this pattern?

<!-- @answer -->
For this one, yes — every mistake shifts the count. At n = 4 the correct total is 10, while one short per row gives 6, one long gives 14, and a rectangle gives 16. But do not generalise it: in Pattern 1 both newline mistakes produced exactly the right number of stars and only the wrong arrangement, so the same check caught nothing. The assertion that transfers is on the line lengths — line i must have exactly i + 1 characters, so the lengths read 1, 2, 3 up to n.

<!-- @doubt -->
### Why can the row not be built once, as in Pattern 1?

<!-- @answer -->
Because it changes on every line. Pattern 1's rows were identical, so one string could be constructed before the loop and printed n times. Here row i has i + 1 stars, so the row has to be produced inside the loop. There are two ways to do that: construct a fresh string of the right length each time, or keep one string and append a star per row. The second is possible only because each row contains the whole of the previous one — the rows nest — and it measured between 1.30 and 1.73 times faster.

<!-- @doubt -->
### How much does the growing-string trick actually buy?

<!-- @answer -->
Less than the step before it, and it is worth keeping the two separate. Moving from printing star by star to building each row is worth about 97 times at n = 6,000 — 170.59ms down to 1.76ms — and that is the same general lesson as Pattern 1. Growing a single string instead of allocating a fresh one per row takes it to 1.35ms, a further 1.30 times at that size and 1.73 times at n = 500. So the first change is transformative and the second is a refinement. It also only applies where the rows nest, which is a property of this shape rather than a technique to reach for by default.

<!-- @doubt -->
### Does the string-growing trick work in Python?

<!-- @answer -->
Less predictably. CPython can extend a string in place when it holds the only reference to it, so `row += "*"` in a loop is often efficient — but that is an implementation detail rather than a language guarantee, and it does not hold when another reference exists. In practice, `"*" * (i + 1)` per row is clear, fast enough, and free of that dependence. The measured 1.30x to 1.73x gain in this lesson comes from C++, where reserving once and appending is explicitly what the code does.
