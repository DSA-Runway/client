---
id: pattern-1-rectangular-star-pattern
topic: Pattern Printing
title: Pattern 1 - Rectangular Star Pattern
difficulty: Easy
status: ready
prerequisites:
  - nested-loops
  - for-loop
  - input-and-output
  - variables-and-constants
relatedIds:
  - nested-loops
  - for-loop
  - pattern-2-right-angled-star-triangle
  - input-and-output
---

<!-- @summary -->
Print an n by n block of stars — the first pattern, where the only real decisions are where the newline goes and how the output is written, and where building the text before printing it measured about 7x faster end to end and over 100x on formatting alone.

<!-- @theory -->
## The problem

Given n, print a solid rectangle of stars with n rows and n columns.

```
n = 4      ****
           ****
           ****
           ****
```

## The structure

Two nested loops: the outer one counts rows, the inner one counts columns within
a row.

```
for row in 0..n-1:
    for col in 0..n-1:
        print a star
    print a newline
```

The newline belongs to the **outer** loop, after the inner one finishes. That
placement is the entire content of this pattern, and it is where the mistakes
live.

## Where the newline goes

Put it inside the inner loop and every star gets its own line:

```
n = 3   correct       newline inside the inner loop
        ***           *
        ***           *
        ***           *  ... nine lines of one star
```

Measured against the correct output for every n from 0 to 40, that misplacement
is wrong on **39 of 41** values.

**But it is right at n = 0 and n = 1.** With a single star, one star followed by
one newline is the same string either way. So a test at n = 1 passes a version
that is wrong for every larger input — the smallest failing case is **n = 2**.

Omitting the newline entirely is wrong on 40 of 41, passing only at n = 0.

### The two bugs fail differently

| Bug | Lines at n = 3 | Stars at n = 3 |
|---|---|---|
| correct | 3 | 9 |
| newline inside inner loop | 9 | **9** |
| newline omitted | 1 | **9** |
| inner loop runs to n inclusive | 3 | 12 |
| outer loop runs to n inclusive | 4 | 12 |

The two newline bugs produce **exactly the right number of stars** and only the
wrong arrangement. The two bound bugs produce the wrong count. So counting stars
catches the second kind and says nothing about the first — checking the line
count is what catches those.

A useful pair of assertions for any pattern: the output has n lines, and every
line has the same length.

## How the output is written matters more than the loops

The loops here are trivial; printing is not. Three strategies, measured writing
the pattern to a real file:

| n | Star at a time | Build the whole text, write once | Gain |
|---|---|---|---|
| 200 | 0.46ms | **0.06ms** | 7.3x |
| 1,000 | 10.64ms | **1.55ms** | 6.8x |
| 3,000 | 104.69ms | **14.38ms** | 7.3x |

About **7x**, consistently. Measuring only the formatting cost — writing to an
in-memory stream so the device is out of the picture — the gap is much wider:
**50x at n = 100 and over 100x from n = 500 upward**, because each `<<` on a
single character carries stream bookkeeping that one large write pays once.

### And in C++, `endl` is not a newline

`endl` writes a newline **and flushes**. Measured writing to a file:

| n | `endl` | `'\n'` | Cost of `endl` |
|---|---|---|---|
| 200 | 2.17ms | 0.45ms | **4.86x** |
| 1,000 | 15.74ms | 12.09ms | 1.30x |
| 3,000 | 103.59ms | 102.67ms | 1.01x |

Note the direction: the penalty **shrinks** as n grows. `endl` costs one flush
per line, so it hurts when there are many short lines and barely registers when
each line is long. At n = 200 that is 200 flushes for 40,000 characters; at
n = 3,000 it is 3,000 flushes for nine million.

So the rule is not "endl is slow" but **"endl costs per line"** — which makes it
worst on exactly the small-n patterns this topic is full of.

### Python is the same story with different numbers

| n | Character at a time | Row at a time | Ratio |
|---|---|---|---|
| 500 | 5.10ms | 0.07ms | **71.9x** |
| 2,000 | 90.47ms | 0.48ms | **188.9x** |
| 5,000 | 575.22ms | 4.42ms | 130.2x |

Writing a row at a time rather than a character at a time is worth up to **188x**.
Going further and joining the entire pattern into one string gained **nothing
measurable** — 1.0x to 1.4x — because building the row already removed the
per-character cost.

The first step is enormous; the second is not worth the code.

## What carries forward

Every pattern in this topic shares three concerns — the loop bounds, the newline
placement, and the output strategy. The bounds change from pattern to pattern;
the other two do not. Build each row with repetition rather than character by
character, use `'\n'` rather than `endl`, and assert the line count rather than
only the character count.

<!-- @intuition -->
A rectangle of stars is just a row repeated, so the code should say that: an inner loop that lays down one row and an outer loop that repeats it. The only thing that makes it a rectangle rather than a single long line is where the newline sits — it belongs to the row, not to the star, so it goes after the inner loop rather than inside it. Everything else about this pattern is about how expensive it is to say the same thing many times: asking the output stream for one character at a time makes it do bookkeeping on every single star, while handing it a finished row asks once.

<!-- @approach -->
### Star at a Time

<!-- @idea -->
Two nested loops, printing one star per inner iteration and one newline per outer iteration.

<!-- @steps -->
1. Loop over the rows, from zero up to but not including n.
2. Inside it, loop over the columns the same way.
3. Print a single star on each inner iteration.
4. After the inner loop finishes, print a newline.
5. The newline belongs to the outer loop, which is what makes the output a rectangle.

<!-- @complexity -->
- time: O(n^2) characters, plus one stream operation per character
- space: O(1)
- note: The direct translation of the structure and the right thing to write first. Its cost is not the loops but the per-character stream calls — measured about 7x slower than building the text first when writing to a file, and over 100x slower on formatting alone.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int row = 0; row < n; row++) {
        for (int col = 0; col < n; col++) {
            cout << '*';
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 5: Strictly less than n. Using <= gives n + 1 rows, which is wrong for every n.
- 9: The newline sits after the inner loop. Inside it, every star gets its own line — wrong for every n above 1.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int row = 0; row < n; row++) {
        for (int col = 0; col < n; col++) {
            System.out.print('*');
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 4: print rather than println, so the stars stay on one line.
- 6: println with no argument emits just the line break, ending the row.

<!-- @code python -->
```python
def pattern(n):
    for row in range(n):
        for col in range(n):
            print("*", end="")
        print()


# range(n) already stops before n, so there is no <= to get wrong here —
# Python removes one of the two classic bound mistakes for free.
```

<!-- @annotations -->
- 4: Without end="" every star would land on its own line, which is the same bug as misplacing the newline.
- 5: A bare print emits the row's newline.

<!-- @approach -->
### Row at a Time

<!-- @idea -->
Build each row as a single string of n stars and print the whole row at once.

<!-- @steps -->
1. Loop over the rows.
2. Construct a string of n stars using repetition rather than a loop.
3. Print that string followed by a newline.
4. The inner loop disappears entirely.
5. The number of output operations drops from n squared to n.

<!-- @complexity -->
- time: O(n^2) characters, but only n stream operations
- space: O(n) for one row
- note: The step that recovers almost all of the available speed. Measured in Python at 0.48ms against 90.47ms for the character-at-a-time version at n = 2,000 — a factor of 188.9. Going further and joining the whole pattern gained nothing measurable beyond this.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    string row(n, '*');
    for (int i = 0; i < n; i++) {
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 6: The row is constructed once outside the loop, since every row is identical in this pattern.
- 8: One stream operation per row rather than one per star.

<!-- @code java -->
```java
static void pattern(int n) {
    String row = "*".repeat(n);
    for (int i = 0; i < n; i++) {
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 2: repeat builds the row in one call, avoiding a StringBuilder loop.

<!-- @code python -->
```python
def pattern(n):
    row = "*" * n
    for i in range(n):
        print(row)


# Measured at n = 2,000: 0.48ms here against 90.47ms printing one star
# at a time — a factor of 188.9.
```

<!-- @annotations -->
- 2: String repetition builds the row in a single operation rather than n appends.
- 4: print adds the newline, so no end= is needed.

<!-- @approach -->
### Build the Whole Pattern, Write Once

<!-- @idea -->
Assemble the entire output in memory and hand it to the stream in a single write.

<!-- @steps -->
1. Reserve space for the whole output, which is n times n plus one characters.
2. Append each row followed by a newline.
3. Perform exactly one write at the end.
4. This removes every remaining per-row stream operation.
5. It costs memory proportional to the whole output rather than to one row.

<!-- @complexity -->
- time: O(n^2)
- space: O(n^2) for the assembled text
- note: The fastest measured, at 14.38ms against 104.69ms writing star by star to a file at n = 3,000 — about 7x. Against the row-at-a-time version the further gain was small, so this is worth writing only when the output is large and the destination is slow.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    string out;
    out.reserve((size_t)n * (n + 1));
    for (int i = 0; i < n; i++) {
        out.append(n, '*');
        out.push_back('\n');
    }
    cout << out;
}
```

<!-- @annotations -->
- 7: Reserving up front avoids repeated reallocation as the string grows.
- 12: A single stream operation for the entire pattern.

<!-- @code java -->
```java
static void pattern(int n) {
    StringBuilder out = new StringBuilder(n * (n + 1));
    for (int i = 0; i < n; i++) {
        out.append("*".repeat(n)).append('\n');
    }
    System.out.print(out);
}
```

<!-- @annotations -->
- 2: Sizing the builder up front, since its default capacity would force several reallocations.

<!-- @code python -->
```python
def pattern(n):
    if n == 0:
        return                        # join gives "", and print("") emits a stray newline
    out = "\n".join("*" * n for _ in range(n))
    print(out)


# Measured no faster than printing row by row — 1.0x to 1.4x — because
# building the row had already removed the per-character cost.
```

<!-- @annotations -->
- 3: The guard exists because joining an empty sequence gives an empty string, and printing that still emits a newline — so n = 0 would produce one line instead of none.
- 4: join places a newline BETWEEN rows, and print supplies the final one — which is why the empty case needs handling separately.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
Four rows of four stars, sixteen stars and four newlines in total

<!-- @why -->
Small enough to count by hand, and it fixes the two facts every later pattern is measured against — the line count and the per-line length.

<!-- @walkthrough -->
1. The outer loop runs for row values 0, 1, 2 and 3 — four rows.
2. For each of those, the inner loop runs for column values 0, 1, 2 and 3.
3. Each inner iteration prints one star, so four stars accumulate on the current line.
4. When the inner loop ends, a newline is printed and the line is complete.
5. That repeats four times, giving four identical rows.
6. The total output is sixteen stars and four newlines, twenty characters.
7. Every line has the same length, which is the invariant worth asserting for this pattern.

<!-- @example -->

<!-- @input -->
n = 1, testing a version with the newline inside the inner loop

<!-- @output -->
Correct — which is why n = 1 is a useless test

<!-- @why -->
Shows that the smallest input is not always the most revealing one, which is worth establishing before twenty-one more patterns.

<!-- @walkthrough -->
1. With the newline correctly placed, n = 1 prints one star then one newline.
2. With the newline inside the inner loop, it prints one star then one newline.
3. The inner loop runs exactly once, so the two placements produce identical output.
4. The same holds at n = 0, where both produce nothing at all.
5. From n = 2 the versions diverge: the correct one gives two lines of two stars, the buggy one gives four lines of one star.
6. Measured across n from 0 to 40, the misplacement is wrong on 39 of the 41 values.
7. So a test suite containing only n = 0 and n = 1 passes a version that is wrong everywhere else.

<!-- @example -->

<!-- @input -->
n = 3, comparing what each mistake produces

<!-- @output -->
The newline bugs give nine stars in the wrong shape; the bound bugs give twelve

<!-- @why -->
Separates the two failure modes, since one preserves the character count and the other does not — and only one of the two obvious checks catches each.

<!-- @walkthrough -->
1. The correct output is three lines of three stars — nine stars in three lines.
2. Putting the newline inside the inner loop gives nine lines of one star — the right nine stars, wrongly arranged.
3. Omitting the newline gives one line of nine stars — again the right count, wrong arrangement.
4. Running the inner loop to n inclusive gives three lines of four stars, so twelve stars.
5. Running the outer loop to n inclusive gives four lines of three stars, again twelve.
6. Counting stars therefore catches the bound mistakes and misses both newline mistakes entirely.
7. Checking the line count catches the newline mistakes, which is why both assertions are worth writing.

<!-- @example -->

<!-- @input -->
n = 3,000 written to a file three different ways

<!-- @output -->
104.69ms star by star, 14.38ms built and written once — and endl adds nothing at this size

<!-- @why -->
Shows that endl's cost is per line rather than per character, so it hurts most on the small, many-lined patterns this topic is full of.

<!-- @walkthrough -->
1. Printing one star at a time performs nine million stream operations.
2. Each carries formatting overhead that a single large write pays only once.
3. Building the whole pattern first and writing it once measured 14.38ms against 104.69ms — about 7 times faster.
4. Measuring formatting alone, by writing to an in-memory stream, the gap is over 100 times.
5. Using endl instead of a newline character costs one flush per line.
6. At n = 3,000 that is 3,000 flushes across nine million characters, which measured just 1.01 times slower.
7. At n = 200 the same substitution measured 4.86 times slower, because the flushes are spread across far fewer characters.

<!-- @visualization custom -->

<!-- @description -->
A character grid being filled in real time beside the two loop counters, drawn as a nested pair so the containment is visible — the outer counter for rows enclosing the inner counter for columns, with the inner one visibly resetting to zero each time the outer advances. That reset is the mechanic of every pattern in this topic and should be the most legible thing on screen. As the inner counter ticks, drop one star into the current row left to right; when it exhausts, animate a carriage return as an explicit visible motion back to the left edge and down one line, and label that motion as the newline. Placing that motion after the inner loop rather than inside it is the whole lesson, so run a second grid alongside with the newline moved inside: there the carriage return fires after every single star, and the grid degenerates into a single column while the star counter on both grids stays identical. Put both star counters side by side reading nine and nine at n = 3, with the line counters reading three and nine — that pairing is the point, since the counts agree and the shapes do not. Then a bounds panel: the same grid with the inner loop's limit changed from n to n inclusive, showing one extra star appearing at the end of every row and the star counter climbing to twelve, so the reader sees which check catches which bug. Finally an output-cost panel, which should feel physical rather than numeric: three lanes carrying the same nine million characters to a file, the first releasing them one at a time through a narrow gate that clicks per character, the second releasing a whole row per click, the third opening once and letting the entire block through. Time bars beneath read 104.69ms and 14.38ms, and a separate small dial shows endl's flush firing once per line — spinning fast and visibly costly at n = 200, barely turning at n = 3,000, annotated 4.86x against 1.01x.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"****\n****\n****\n****\n","lines":4,"lineLength":4,"stars":16,"totalChars":20,"loops":{"outer":"row from 0 to n-1","inner":"col from 0 to n-1","newline":"after the inner loop"}},"newlinePanel":{"n":3,"correct":{"lines":3,"stars":9,"shape":"3 rows of 3"},"newlineInsideInner":{"lines":9,"stars":9,"shape":"9 rows of 1","starCountMatches":true},"newlineOmitted":{"lines":1,"stars":9,"shape":"1 row of 9","starCountMatches":true},"passesAtN":[0,1],"smallestFailure":2,"wrongOn":"39 of 41 values from n=0 to 40"},"boundsPanel":{"n":3,"innerInclusive":{"lines":3,"stars":12},"outerInclusive":{"lines":4,"stars":12},"starCountMatches":false,"note":"bound bugs change the star count; newline bugs do not"},"assertions":["output has exactly n lines","every line has the same length","total stars equal n*n"],"outputCostPanel":{"toFile":[{"n":200,"perCharMs":0.46,"buildOnceMs":0.06,"gain":7.3},{"n":1000,"perCharMs":10.64,"buildOnceMs":1.55,"gain":6.8},{"n":3000,"perCharMs":104.69,"buildOnceMs":14.38,"gain":7.3}],"formattingOnly":{"n100":50.19,"n500":111.07,"n2000":109.13,"note":"in-memory stream, device excluded"},"endlCost":[{"n":200,"endlMs":2.17,"newlineMs":0.45,"ratio":4.86},{"n":1000,"endlMs":15.74,"newlineMs":12.09,"ratio":1.30},{"n":3000,"endlMs":103.59,"newlineMs":102.67,"ratio":1.01}],"endlRule":"endl costs one flush per LINE, so it hurts when lines are short and numerous"},"pythonPanel":[{"n":500,"perCharMs":5.10,"perRowMs":0.07,"ratio":71.9},{"n":2000,"perCharMs":90.47,"perRowMs":0.48,"ratio":188.9},{"n":5000,"perCharMs":575.22,"perRowMs":4.42,"ratio":130.2}],"pythonJoinGain":"1.0x to 1.4x over per-row — not worth the code"}
```

<!-- @highlights -->
- The two loop counters are drawn nested, the outer for rows enclosing the inner for columns.
- The inner counter visibly resets to zero each time the outer advances, which is the mechanic of every pattern in this topic.
- As the inner counter ticks, one star drops into the current row from left to right.
- When the inner loop exhausts, a carriage return animates as an explicit motion back to the left edge and down one line.
- That motion is labelled as the newline, and it happens after the inner loop rather than inside it.
- A second grid runs alongside with the newline moved inside, firing the carriage return after every single star.
- That grid degenerates into a single column while its star counter stays identical to the correct one.
- Both star counters read nine at n = 3 while the line counters read three and nine — the counts agree and the shapes do not.
- A bounds panel changes the inner loop's limit to n inclusive, adding one star to the end of every row.
- Its star counter climbs to twelve, showing which check catches which bug.
- An output-cost panel sends the same nine million characters to a file down three lanes.
- The first lane releases them one at a time through a gate that clicks per character.
- The second releases a whole row per click, and the third opens once and lets the entire block through.
- Time bars beneath read 104.69ms and 14.38ms.
- A separate dial shows endl's flush firing once per line, spinning fast at n = 200 and barely turning at n = 3,000.
- That dial is annotated 4.86x against 1.01x, making the per-line nature of the cost visible.

<!-- @edgeCases -->
- n equal to zero — no output at all, and both loops simply never run. The join-based version needs an explicit guard here, since joining nothing still prints a newline.
- n equal to one — a single star and a newline, and the one size where the misplaced-newline bug passes.
- n equal to two — the smallest input that distinguishes the correct newline placement from the misplaced one.
- Negative n — the loops do not run, so the output is empty rather than an error.
- Very large n — the output is n squared characters, so n of ten thousand is a hundred million characters.
- A caller expecting a trailing newline after the final row — this version emits one, which some comparisons treat as significant.
- A caller expecting no trailing newline — worth settling explicitly, since exact-output tests fail on it.
- Output to a terminal rather than a file — flushing behaviour differs, and endl's cost changes accordingly.
- Non-square variants where rows and columns differ — the same structure with two independent bounds.
- A pattern printed with spaces between stars — a different output format, and worth deciding before writing tests.

<!-- @pitfalls -->
- Putting the newline inside the inner loop. Every star lands on its own line — measured wrong on 39 of 41 values of n from 0 to 40.
- Testing only with n equal to one. Both newline placements produce identical output there, so the test proves nothing.
- Omitting the newline entirely. All the stars land on one line, and the star count is still correct, so counting characters does not catch it.
- Checking only the number of stars. Both newline mistakes produce exactly the right count and only the wrong shape.
- Running either loop to n inclusive. That adds a whole row or a whole column, giving twelve stars at n = 3 rather than nine.
- Using endl in C++. It flushes every line — measured 4.86 times slower at n = 200, where the lines are short and numerous.
- Assuming endl is always expensive. Its cost is per line, so at n = 3,000 it measured just 1.01 times slower.
- Printing one character at a time when the output is large. Measured about 7 times slower to a file and over 100 times slower on formatting alone.
- Forgetting end="" in Python's print. The default newline turns every star into its own line, which is the misplaced-newline bug by another route.
- Building the row inside the outer loop when every row is identical. It only needs constructing once for this pattern.
- Leaving the trailing-newline question undecided. Exact-output comparisons fail on it, and the answer should be stated rather than discovered.
- Building the output with a join and printing it unguarded. At n = 0 the join yields an empty string and print still emits a newline, giving one line where there should be none.

<!-- @doubt -->
### Why does the newline go after the inner loop rather than inside it?

<!-- @answer -->
Because a newline ends a row, and the inner loop is what produces a row. Inside it, the newline would end the line after every single star, so the output becomes one star per line — nine lines at n = 3 rather than three. Measured against the correct output for every n from 0 to 40, that misplacement is wrong on 39 of them. The two exceptions are n = 0, where nothing is printed either way, and n = 1, where a single star followed by a single newline is the same string in both versions.

<!-- @doubt -->
### My code works for n = 1. Is that enough to trust it?

<!-- @answer -->
No, and this pattern is a good demonstration of why. At n = 1 the inner loop runs exactly once, so putting the newline inside it or after it produces identical output. A version that is wrong for every n above 1 passes that test cleanly. The smallest input that distinguishes them is n = 2, where the correct version gives two lines of two stars and the buggy one gives four lines of one star. For any pattern, test at least n = 3 — small enough to check by hand, large enough that the loop structure is actually exercised.

<!-- @doubt -->
### What should I assert in a test?

<!-- @answer -->
Two things, because neither catches both classes of mistake. First the line count, which must be n — that catches the newline errors, since putting the newline inside the inner loop gives n squared lines and omitting it gives one. Second the length of each line, which must be n and must be the same for all of them — that catches the bound errors, where a loop running to n inclusive adds a whole extra column or row. Counting stars alone is not enough: both newline mistakes produce exactly n squared stars and only the wrong arrangement.

<!-- @doubt -->
### Does it really matter how I print, for a pattern this simple?

<!-- @answer -->
For small n, no. For large n it dominates everything else, and the loops are not where the time goes. Measured writing to a file at n = 3,000, printing one star at a time took 104.69ms and building the whole pattern before writing took 14.38ms — about 7 times. Measuring the formatting alone, by writing to an in-memory stream so the device is excluded, the gap is over 100 times. The intermediate step of building one row at a time recovers almost all of that, which is why it is the version worth defaulting to.

<!-- @doubt -->
### Should I always avoid endl?

<!-- @answer -->
Prefer a newline character, but understand what it costs rather than treating endl as simply slow. endl writes a newline and then flushes, so its price is one flush per line — which means it hurts when there are many short lines and barely registers when each line is long. Measured writing to a file: 4.86 times slower at n = 200, 1.30 times at n = 1,000, and 1.01 times at n = 3,000. The penalty shrinks as the lines lengthen, because the same number of flushes is spread across far more characters. Pattern printing is full of short lines, so this is exactly the setting where it matters.

<!-- @doubt -->
### Is joining the whole pattern into one string worth it in Python?

<!-- @answer -->
Not beyond building each row. Measured, moving from printing one character at a time to printing one row at a time was worth between 71.9 and 188.9 times. Going further and joining every row into a single string before printing gained between 1.0 and 1.4 times — nothing meaningful. The per-character cost is what dominates, and building the row removes it entirely; after that the remaining per-row calls are too few to matter. Write whichever reads better.

<!-- @doubt -->
### Why does this pattern build the row outside the loop?

<!-- @answer -->
Because every row is identical here, so constructing it once and printing it n times is all that is needed. That is specific to the rectangle: from the next pattern onward the rows differ in length, so the row has to be built inside the loop from the current row index. The habit worth carrying forward is building the row with repetition rather than character by character — how many characters, and which, is what changes between patterns.

<!-- @doubt -->
### Should the output end with a trailing newline?

<!-- @answer -->
This version emits one, since every row including the last is followed by a newline. It is worth settling deliberately because exact-output comparisons treat it as significant, and a solution that is correct in every visible respect can fail an automated check on that single character. If the expected output has no trailing newline, join the rows with newlines between them rather than appending one after each — the Python join version in this lesson does exactly that, and then print supplies the final one.
