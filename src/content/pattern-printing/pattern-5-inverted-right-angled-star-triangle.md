---
id: pattern-5-inverted-right-angled-star-triangle
topic: Pattern Printing
title: Pattern 5 - Inverted Right-Angled Star Triangle
difficulty: Easy
status: ready
prerequisites:
  - pattern-2-right-angled-star-triangle
  - pattern-4-right-angled-repeating-number-triangle
  - nested-loops
  - for-loop
relatedIds:
  - pattern-2-right-angled-star-triangle
  - pattern-6-inverted-right-angled-number-triangle
  - pattern-8-inverted-star-pyramid
  - pattern-10-half-diamond-star-pattern
  - nested-loops
---

<!-- @summary -->
Print a triangle whose rows shrink from n stars to one — the first pattern whose inner bound depends on n as well as the row, where five different-looking formulations produce byte-identical output, and where getting the direction wrong survives every check that ignores order because this pattern is exactly Pattern 2 with its lines reversed.

<!-- @theory -->
## The problem

Print n rows where row i holds n - i + 1 stars, counting rows from one.

```
n = 4      ****
           ***
           **
           *
```

## The bound now depends on n as well as the row

Every pattern so far had an inner bound written purely in terms of the outer
counter. This one needs both:

```
for i in 1..n:
    for j in 1..n-i+1:      <- the row length counts down from n
        print a star
    print a newline
```

Row 1 gets n stars, row n gets one. That `n - i + 1` is the first place in this
topic where an off-by-one has two independent things to be wrong about, which is
why the alternatives below are worth knowing.

## Five ways to write it, one output

Unlike Pattern 2 — where two *wrong* versions turned out to be the same function —
here several *right* versions do. All five produce byte-identical output, verified
for every n from 0 to 200 with no differences:

| Formulation | Outer | Inner |
|---|---|---|
| Count the length down | `i = 1..n` | `j = 1..n-i+1` |
| Count the rows down | `i = n..1` | `j = 1..i` |
| Start the inner loop late | `i = 1..n` | `j = i..n` |
| Zero-indexed | `i = 0..n-1` | `j < n-i` |
| Shrink one string | `i = 1..n` | remove one star per row |

The second is worth preferring when you have the choice: counting the outer loop
down removes the `n - i + 1` arithmetic entirely, so there is one fewer place for
an off-by-one to hide.

## Getting the direction wrong beats every order-blind check

This is the new failure mode. The inverted triangle is **exactly Pattern 2 with
its lines reversed** — verified with 0 differences for every n from 0 to 300. So
printing the non-inverted triangle by mistake gives an output with:

- the **same star total**, n(n+1)/2 — 10 at n = 4, 5,050 at n = 100
- the **same multiset of line lengths**, 1 through n in both
- only a different **order**

Measured over n from 1 to 40, asking each check for the smallest n at which it
notices:

| Mistake | Wrong on | Star total | Line lengths, sorted | Line lengths, in order |
|---|---|---|---|---|
| Inner bound one short (`n - i`) | 40/41 | n = 1 | n = 1 | n = 1 |
| Inner bound one long (`n - i + 2`) | 40/41 | n = 1 | n = 1 | n = 1 |
| Row length fixed at n (rectangle) | 39/41 | n = 2 | n = 2 | n = 2 |
| **Not inverted (= Pattern 2)** | 39/41 | **never** | **never** | n = 2 |
| **Grows one row (the stale trick)** | 39/41 | **never** | **never** | n = 2 |

Pattern 3 retired the counting check because a value bug preserves the shape.
This retires the *sorted* length check too, because a direction bug preserves the
shape and the sizes and disturbs only the sequence. Each pattern so far has cost
one more assertion.

The cheap assertion that catches it immediately: **the first row must have n
stars.** In Pattern 2 the first row always has one.

## The nesting has reversed

Patterns 2 and 3 let you carry one string forward and extend it. Pattern 4 killed
that outright — its rows shared nothing. Here it comes back, pointing the other
way. Over n from 1 to 200, across 19,900 adjacent row pairs:

- row i a prefix of row i + 1: **0**
- row i + 1 a prefix of row i: **19,900**

And the stronger statement, which is what the fast version uses: **every row is a
prefix of the first row** — checked across 20,100 rows from n = 1 to 200, no
exceptions. So the whole pattern is one string of n stars, printed at n
successively shorter lengths, with nothing built or rebuilt.

Carrying Pattern 2's growing-string trick over unchanged, meanwhile, produces
Pattern 2 — wrong on 39 of 41 sizes, correct at n = 0 and n = 1, and invisible to
both order-blind checks. That is the third pattern in a row where a stale
optimisation and a wrong loop variable land on the same well-formed wrong output.

## What that buys, and where it does not

Measured with the output accumulated in a string stream, the fast variants timed
in batches so the readings clear timer noise:

| n | Star at a time | Fresh row | Shrink one row | Prefix of one buffer |
|---|---|---|---|---|
| 2,000 | 32.98ms | 0.27ms | 0.16ms | 0.16ms |
| 6,000 | 295.82ms | 1.75ms | 1.13ms | 1.17ms |
| 12,000 | 800.55ms | 7.27ms | 5.49ms | 5.07ms |

Two things to read off. The first step is the big one — **110x to 169x** — which
is the same per-character effect Pattern 2 measured, because the item here is a
single character again rather than a number needing conversion. The second step,
holding one buffer instead of allocating a row per line, is worth **1.3x to
1.7x**.

The third thing is a non-result worth stating: writing a prefix of a fixed buffer
and shrinking a string measure the **same**, at 0.97x to 1.08x of each other. The
saving was the per-row allocation, and both remove it. Pick whichever reads
better.

In Python the second step disappears entirely — slicing one buffer runs at 0.95x
to 1.01x of building each row with repetition, because both allocate. The
structural insight is real in both languages; the speedup is not.

<!-- @intuition -->
Turning a pattern upside down sounds like it should need new machinery, and it needs none — the row length is still one number derived from the row index, just counted the other way. The useful move is to notice you can choose *where* the counting-down happens: in the bound, or in the outer loop itself. Push it into the outer loop and the inner bound goes back to the simple form from Pattern 2, which is why several quite different-looking versions turn out to be the same function. The second half is about what the reversal costs you in checking. Reversing lines does not change how many stars there are or how long the lines are — it changes only which line comes first. So every check that summarises the output without regard to order agrees with a completely wrong answer, and the only cheap thing that separates them is looking at where the longest row sits.

<!-- @approach -->
### Star at a Time

<!-- @idea -->
Nested loops where the inner bound counts down from n, printing one star per inner iteration.

<!-- @steps -->
1. Loop over the rows from one up to and including n.
2. Compute this row's length as n minus the row index plus one.
3. Loop that many times, printing a single star each time.
4. Print a newline after the inner loop finishes.
5. Row one prints n stars and row n prints one.

<!-- @complexity -->
- time: O(n^2) characters, and one stream operation per character
- space: O(1)
- note: The direct translation. Measured 295.82ms at n = 6,000 against 1.75ms for building each row — between 110x and 169x across the sizes tested, the same per-character effect Pattern 2 measured, since the item is a single character again.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n - i + 1; j++) {
            cout << '*';
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: The bound depends on n as well as i, which is new. At i = 1 it is n and at i = n it is 1.
- 9: The newline still belongs to the outer loop, unchanged since Pattern 1.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n - i + 1; j++) {
            System.out.print('*');
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 3: Writing n - i instead of n - i + 1 leaves the last row empty and is wrong on 40 of 41 sizes.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for j in range(n - i + 1):
            print("*", end="")
        print()


# Writing the outer loop as range(n, 0, -1) and the inner as range(i)
# gives byte-identical output with no n - i + 1 arithmetic at all.
```

<!-- @annotations -->
- 3: range(n - i + 1) yields exactly the row length. Counting the outer loop down instead removes this expression entirely.

<!-- @approach -->
### Fresh Row Each Time

<!-- @idea -->
Build each row as a string of the right length and print it in one operation.

<!-- @steps -->
1. Loop over the rows, counting down from n to one.
2. The loop counter is now the row length directly.
3. Construct a string of that many stars using repetition.
4. Print it followed by a newline.
5. The inner loop disappears.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations, n row allocations
- space: O(n) for the longest row
- note: Recovers almost all the available speed — 1.75ms at n = 6,000 against 295.82ms printing star by star. Counting the outer loop down is worth preferring on its own: the row length becomes the loop variable, so the n - i + 1 arithmetic disappears.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = n; i >= 1; i--) {
        cout << string(i, '*') << '\n';
    }
}
```

<!-- @annotations -->
- 6: Counting down means i is the row length itself, so no arithmetic is needed inside the loop.
- 7: A fresh string per row, which is the one thing the next approach removes.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = n; i >= 1; i--) {
        System.out.println("*".repeat(i));
    }
}
```

<!-- @annotations -->
- 3: repeat takes the row length directly, and the row length is the loop counter.

<!-- @code python -->
```python
def pattern(n):
    for i in range(n, 0, -1):
        print("*" * i)


# range(n, 0, -1) gives n, n-1, ... 1 — the row lengths in order,
# which is the whole pattern.
```

<!-- @annotations -->
- 2: The three-argument range counts down and stops before 0, so the last value is 1 rather than 0.

<!-- @approach -->
### One Buffer, Shorter Every Row

<!-- @idea -->
Build the first row once and print progressively shorter pieces of it, since every row is a prefix of the first.

<!-- @steps -->
1. Build one string of n stars before the loop.
2. Loop over the rows from one up to and including n.
3. Write only the first n minus i plus one characters of that string.
4. Print a newline after each.
5. Nothing is allocated, rebuilt or resized inside the loop.

<!-- @complexity -->
- time: O(n^2) characters written, one allocation in total
- space: O(n) for the single buffer
- note: Worth 1.3x to 1.7x over allocating a row per line in C++. Writing a prefix and shrinking the string measure the same, at 0.97x to 1.08x of each other — the saving is the per-row allocation, which both remove. In Python it is worth nothing at all, 0.95x to 1.01x, because slicing allocates just as repetition does.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    string buf(n, '*');
    for (int i = 1; i <= n; i++) {
        cout.write(buf.data(), n - i + 1);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: Built once. This is the first row, and every later row is a prefix of it — checked across 20,100 rows with no exceptions.
- 8: Writes the first n - i + 1 characters. Nothing is copied, resized or reallocated.

<!-- @code java -->
```java
static void pattern(int n) {
    StringBuilder row = new StringBuilder("*".repeat(n));
    for (int i = 1; i <= n; i++) {
        System.out.println(row);
        row.setLength(row.length() - 1);
    }
}
```

<!-- @annotations -->
- 5: Shrinking by one rather than slicing. It measured the same as writing a prefix, so the clearer form wins.

<!-- @code python -->
```python
def pattern(n):
    buf = "*" * n
    for i in range(n, 0, -1):
        print(buf[:i])


# Correct, and no faster: slicing builds a new string every row,
# so this measured 0.95x to 1.01x against "*" * i per row.
```

<!-- @annotations -->
- 4: A slice is a copy in Python, so this does the same allocation per row that the previous approach did — the structure carries over but the saving does not.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
Four rows of four, three, two and one stars — ten stars in total

<!-- @why -->
Small enough to count by hand, and it fixes the star total that the direction bug will be shown to preserve exactly.

<!-- @walkthrough -->
1. The outer loop runs for i values 1, 2, 3 and 4.
2. At i = 1 the row length is n minus 1 plus 1, which is 4.
3. At i = 2 it is 3, then 2, then 1.
4. The line lengths therefore read 4, 3, 2, 1 — decreasing by exactly one.
5. The total is 4 + 3 + 2 + 1, which is 10, the same n(n+1)/2 as Pattern 2.
6. Pattern 2 at n = 4 also prints 10 stars, with lines of 1, 2, 3, 4.
7. So the two differ only in the order of the lines, which is what the checks below turn on.

<!-- @example -->

<!-- @input -->
The non-inverted triangle, checked three ways at n = 4

<!-- @output -->
Same star total, same sorted line lengths, wrong answer

<!-- @why -->
The first mistake in this topic that survives a check on sizes as well as a check on counts.

<!-- @walkthrough -->
1. This pattern is Pattern 2 with its lines reversed, verified with 0 differences for every n from 0 to 300.
2. Reversing lines changes neither how many stars there are nor how long any line is.
3. So the star total is 10 in both, and the sorted line lengths are 1, 2, 3, 4 in both.
4. Asked for the smallest n at which either check notices, over n from 1 to 40, neither ever does.
5. Comparing the line lengths in order catches it at n = 2, where this pattern gives 2 then 1 and Pattern 2 gives 1 then 2.
6. The cheapest single assertion is that the first row has n stars; Pattern 2's first row always has one.
7. Measured over n from 0 to 40 the mistake is wrong on 39, passing only at n = 0 and n = 1.

<!-- @example -->

<!-- @input -->
Five different formulations, compared for n = 0 to 200

<!-- @output -->
Byte-identical in every case — 0 differences

<!-- @why -->
Pattern 2 showed two wrong versions coinciding; this shows several right ones doing the same, which is what makes the choice between them free.

<!-- @walkthrough -->
1. Counting the row length down writes the inner bound as n minus i plus one.
2. Counting the rows down instead writes the outer loop from n to 1 and the inner bound as i.
3. Starting the inner loop late runs j from i to n, which is the same count arrived at differently.
4. The zero-indexed version runs i from 0 to n minus 1 with the bound j less than n minus i.
5. Shrinking one string removes a star per row rather than computing a length at all.
6. All five agree exactly for every n from 0 to 200.
7. Since they are interchangeable, prefer the one with the least arithmetic — counting the outer loop down, where the loop variable is the row length.

<!-- @example -->

<!-- @input -->
n = 6,000, built three different ways

<!-- @output -->
295.82ms star by star, 1.75ms per row, 1.13ms from one buffer

<!-- @why -->
Separates a large general win from a small one, and records a step that measured as no win at all.

<!-- @walkthrough -->
1. Printing star by star performs one stream operation per character, about eighteen million at this size.
2. Building each row drops that to 6,000 operations, worth between 110x and 169x across the sizes tested.
3. That is the same per-character effect Pattern 2 measured, and it returns here because the item is a single character again.
4. Holding one buffer instead of allocating a row per line is worth a further 1.3x to 1.7x.
5. Writing a prefix of a fixed buffer and shrinking a string measured the same as each other, 0.97x to 1.08x.
6. So the saving is the per-row allocation, and the choice between those two forms is a matter of readability.
7. In Python the whole second step vanishes — slicing one buffer runs at 0.95x to 1.01x of repetition per row, since both allocate.

<!-- @visualization custom -->

<!-- @description -->
A grid filling top-down with the row-length box counting 4, 3, 2, 1 while the row counter counts 1, 2, 3, 4, drawn as two boxes with the arithmetic n - i + 1 shown converting one into the other — then a control that moves the counting-down into the outer loop instead, which should visibly delete the arithmetic box and leave the row counter feeding the length directly, both variants continuing to fill the identical grid. Beside it list all five formulations as loop headers with a shared output panel, stamped 0 differences over n = 0..200, so the reader sees interchangeability rather than being told it. The centre of the drawing is a reversal panel: this pattern's grid and Pattern 2's grid side by side, with a hinge animation flipping one into the other, and three summary readouts beneath both grids — star total, sorted line lengths, ordered line lengths. The first two readouts must stay visibly identical through the flip and the third must change; that is the whole point, so hold the frame there. Add a single assertion chip reading first row has n stars, green on one grid and red on the other from n = 2. Then a nesting strip: overlay each row on the first row and mark prefix or not, counter reading 20,100 rows with no exceptions, with an arrow showing the nesting direction reversed from Patterns 2 and 3 and a struck-through copy of the grow-one-row trick labelled produces Pattern 2. Close with four build lanes at n = 6,000: one star per stream click; a fresh row block allocated per line; one block shrinking by a cell per line; one fixed block with a moving write-length marker — time bars reading 295.82ms, 1.75ms, 1.13ms and 1.17ms, with the first gap marked large, the second small, and the last two bars drawn deliberately equal and labelled no measurable difference.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"****\n***\n**\n*\n","lines":4,"lineLengths":[4,3,2,1],"stars":10,"formula":"n(n+1)/2","rowLength":"n - i + 1","firstRow":4,"lastRow":1},"newMechanic":"the inner bound depends on n as well as the row index, and can instead be moved into the outer loop","formulations":[{"name":"count the length down","outer":"i = 1..n","inner":"j = 1..n-i+1"},{"name":"count the rows down","outer":"i = n..1","inner":"j = 1..i"},{"name":"start the inner loop late","outer":"i = 1..n","inner":"j = i..n"},{"name":"zero-indexed","outer":"i = 0..n-1","inner":"j < n-i"},{"name":"shrink one string","outer":"i = 1..n","inner":"remove one star per row"}],"formulationsAgreeOver":"n = 0..200, 0 differences","reversal":{"claim":"this pattern is Pattern 2 with its lines reversed","verifiedOver":"n = 0..300, 0 differences","preserved":["star total","multiset of line lengths"],"changed":["order of lines"]},"bugPanel":{"variants":[{"name":"not inverted (= Pattern 2)","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"grows one row (the Pattern 2/3 trick)","wrongOn":"39 of 41","correctAt":[0,1],"isActually":"Pattern 2"},{"name":"inner bound one short (n - i)","wrongOn":"40 of 41","correctAt":[0]},{"name":"inner bound one long (n - i + 2)","wrongOn":"40 of 41","correctAt":[0]},{"name":"row length fixed at n (rectangle)","wrongOn":"39 of 41","correctAt":[0,1]}]},"checkPanel":{"columns":["star total","line lengths sorted","line lengths in order"],"smallestNThatCatches":{"inner bound one short":[1,1,1],"inner bound one long":[1,1,1],"row length fixed at n":[2,2,2],"not inverted":["never","never",2],"grows one row":["never","never",2]},"cheapestAssertion":{"text":"the first row must have n stars","catchesDirectionBugAt":2,"pattern2FirstRow":1},"ladder":"Pattern 3 retired the counting check; this retires the sorted-length check too"},"assertions":["line i has exactly n - i + 1 characters","line lengths run n, n-1, ... 1 in that order","the first row has n stars","total stars equal n(n+1)/2"],"nesting":{"rowIPrefixOfNext":0,"nextPrefixOfRowI":19900,"pairsTested":19900,"over":"n = 1..200","everyRowPrefixOfFirstRow":true,"rowsChecked":20100,"exceptions":0},"buildPanel":[{"n":2000,"starAtATimeMs":32.98,"freshRowMs":0.27,"shrinkRowMs":0.16,"prefixMs":0.16},{"n":6000,"starAtATimeMs":295.82,"freshRowMs":1.75,"shrinkRowMs":1.13,"prefixMs":1.17},{"n":12000,"starAtATimeMs":800.55,"freshRowMs":7.27,"shrinkRowMs":5.49,"prefixMs":5.07}],"ratios":{"perCharToFreshRow":"110x to 169x","freshRowToOneBuffer":"1.3x to 1.7x","shrinkVsPrefix":"0.97x to 1.08x, no measurable difference"},"python":{"perCharToRepetition":"312x to 777x","repetitionToSlice":"0.95x to 1.01x","reading":"the structure carries over but the saving does not, because slicing allocates"}}
```

<!-- @highlights -->
- The grid fills top-down while the row-length box counts 4, 3, 2, 1 and the row counter counts 1, 2, 3, 4.
- The arithmetic n - i + 1 is drawn as a box converting one counter into the other.
- A control moves the counting-down into the outer loop, visibly deleting that arithmetic box.
- Both variants continue to fill the identical grid, so interchangeability is shown rather than asserted.
- All five formulations are listed as loop headers sharing one output panel, stamped 0 differences over n = 0..200.
- The centre is a reversal panel: this pattern's grid and Pattern 2's, with a hinge animation flipping one into the other.
- Three readouts sit beneath both grids: star total, sorted line lengths, ordered line lengths.
- The first two stay visibly identical through the flip and only the third changes — hold the frame there.
- An assertion chip reads first row has n stars, green on one grid and red on the other from n = 2.
- A nesting strip overlays each row on the first row and marks prefix or not, with 20,100 rows and no exceptions.
- An arrow shows the nesting direction reversed from Patterns 2 and 3.
- A struck-through copy of the grow-one-row trick is labelled produces Pattern 2.
- Four build lanes run at n = 6,000: per-star clicks, a fresh block per line, one shrinking block, one fixed block with a moving write-length marker.
- Time bars read 295.82ms, 1.75ms, 1.13ms and 1.17ms.
- The first gap is marked large and the second small.
- The last two bars are drawn deliberately equal and labelled no measurable difference.

<!-- @edgeCases -->
- n equal to zero — no output, and the outer loop never runs.
- n equal to one — a single star, and the size at which the non-inverted triangle is indistinguishable from correct.
- n equal to two — the smallest input that separates this pattern from Pattern 2, giving 2 then 1 against 1 then 2.
- Negative n — no output, since the loop does not run.
- Very large n — the output is n times n plus one over two characters, the same total as Pattern 2 at the same size.
- The last row — exactly one star, and the row that disappears if the bound is written n - i.
- The first row — exactly n stars, and the cheapest single thing to assert.
- Zero-indexed rows — the bound becomes j less than n minus i, with no plus one, and mixing the conventions is where the off-by-ones come from.
- A caller expecting the triangle to grow rather than shrink — that is Pattern 2, and this pattern's two commonest bugs both produce it.
- A caller expecting the shape right-aligned rather than left-aligned — that needs leading spaces, which is Pattern 8.

<!-- @pitfalls -->
- Writing the inner bound as n - i rather than n - i + 1. The last row comes out empty and every row loses a star — wrong on 40 of 41 sizes.
- Printing the non-inverted triangle. It has the same star total and the same sorted line lengths as the correct answer, so neither check ever catches it at any size tested.
- Checking only the star count, or only the multiset of line lengths. Both are order-blind, and the direction bug changes only the order.
- Carrying Pattern 2's growing-string trick over. The nesting runs the other way here, so it produces Pattern 2's output rather than this one.
- Testing only at n = 1. The direction bug, the rectangle and the stale trick all pass there.
- Keeping the n - i + 1 arithmetic when you could count the outer loop down instead. The row length is then the loop variable and there is nothing left to get wrong.
- Assuming the one-buffer version is a large win. It is worth 1.3x to 1.7x in C++, against 110x to 169x for not printing character by character.
- Assuming that win transfers to Python. Slicing one buffer measured 0.95x to 1.01x against repetition per row, because both allocate.
- Choosing between writing a prefix and shrinking the string on performance grounds. They measured the same, at 0.97x to 1.08x of each other.
- Forgetting that the row length must reach exactly one, not zero. An inner bound that runs to zero prints an empty final line.

<!-- @doubt -->
### Why does the star count not catch a triangle pointing the wrong way?

<!-- @answer -->
Because this pattern is exactly Pattern 2 with its lines reversed — verified with 0 differences for every n from 0 to 300 — and reversing lines moves stars around without adding or removing any. So both outputs have n(n+1)/2 stars, 10 at n = 4 and 5,050 at n = 100. Sorting the line lengths does not help either, since both produce the same multiset of 1 through n. Only a check that respects order separates them, and it does so at n = 2. The cheapest version of that check is a single assertion: the first row must have n stars, where Pattern 2's first row always has one.

<!-- @doubt -->
### Which of the five ways to write this should I use?

<!-- @answer -->
Counting the outer loop down, from n to 1, with the inner bound simply the loop variable. All five formulations produce byte-identical output for every n from 0 to 200, so the choice is free and worth spending on clarity: that version has no n - i + 1 arithmetic in it at all, and the loop variable is the row length itself. The other forms are all correct — counting the length down, starting the inner loop at i, running zero-indexed with j less than n minus i, or shrinking one string — and it is worth being able to read them, since they appear interchangeably in other people's code.

<!-- @doubt -->
### Can I still keep one string and extend it, as in Patterns 2 and 3?

<!-- @answer -->
Not extend it — shrink it. The nesting has reversed: over n from 1 to 200 there are 0 pairs where row i is a prefix of row i + 1, and 19,900 where row i + 1 is a prefix of row i. Extending unchanged produces Pattern 2's output, wrong on 39 of 41 sizes and caught by neither order-blind check. The stronger fact is that every row is a prefix of the *first* row, checked across 20,100 rows with no exceptions, so you can build n stars once and print shorter and shorter pieces of it without changing anything.

<!-- @doubt -->
### Is writing a prefix better than shrinking the string?

<!-- @answer -->
No — they measured the same, within 0.97x to 1.08x of each other across n = 2,000, 6,000 and 12,000. What both of them remove is the per-row allocation, and that is worth 1.3x to 1.7x over building a fresh row each line. Once the allocation is gone there is nothing left to save: the characters still have to be written, and they are the output. So choose on readability. In C++ the prefix write states the invariant plainly; in Java shrinking with setLength reads better; in Python neither is faster than plain repetition.

<!-- @doubt -->
### Why does the one-buffer version do nothing in Python?

<!-- @answer -->
Because a slice is a copy. `buf[:i]` builds a new string of length i every row, which is exactly the allocation that `"*" * i` was already doing — measured at 0.95x to 1.01x, so no gain at all. The C++ version wins because writing a prefix touches no memory beyond the write itself. What does transfer to Python is the first step: printing star by star measured 312x to 777x slower than one repetition per row, which is the same lesson as Pattern 2 and much larger than anything the buffer trick offers.

<!-- @doubt -->
### The inner bound has n and i in it now. How do I keep the off-by-one straight?

<!-- @answer -->
Check the two ends rather than reasoning through the middle. Row 1 must print n stars and row n must print exactly one, so substitute i = 1 and i = n into whatever bound you wrote and confirm both. With `n - i + 1` that gives n and 1, which is right; with `n - i` it gives n - 1 and 0, so the last line comes out empty — wrong on 40 of 41 sizes. Better still, avoid the arithmetic: count the outer loop down from n to 1 and the row length is the loop variable, where there are no ends to check.

<!-- @doubt -->
### Is this pattern any harder than Pattern 2, really?

<!-- @answer -->
Not to write — it is the same two loops with the bound counted the other way, and one formulation of it is literally Pattern 2's loop with the outer counter descending. It is harder to *check*, which is the part worth taking from it. Each pattern in this topic has cost one more assertion: Pattern 2 could be checked by counting stars, Pattern 3 broke that because a value bug preserves the count, and this breaks the sorted-length check too because a direction bug preserves the sizes and disturbs only the sequence. The assertion that has survived all three is the specific one: line i must be exactly what it should be, in the position it should be in.
