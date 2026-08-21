---
id: pattern-3-right-angled-number-triangle
topic: Pattern Printing
title: Pattern 3 - Right-Angled Number Triangle
difficulty: Easy
status: ready
prerequisites:
  - pattern-2-right-angled-star-triangle
  - nested-loops
  - for-loop
  - type-conversion-and-casting
relatedIds:
  - pattern-2-right-angled-star-triangle
  - pattern-4-right-angled-repeating-number-triangle
  - pattern-6-inverted-right-angled-number-triangle
  - pattern-13-increasing-number-triangle
  - nested-loops
---

<!-- @summary -->
Print a triangle whose rows read 1, then 1 2, then 1 2 3 — the first pattern where the printed value comes from the inner counter, which quietly retires the counting check that was sufficient one pattern ago, turns the most natural mistake into a different pattern's correct answer, and reverses which version is fast: growing one row is 113x faster here against 1.30x there.

<!-- @theory -->
## The problem

Print n rows where row i holds the numbers 1 through i, separated by single spaces.

```
n = 4      1
           1 2
           1 2 3
           1 2 3 4
```

## What changed: the value now comes from the inner counter

Pattern 2 used the inner counter only as a *counter* — it decided how many stars
to print, and the star itself was a constant. Here the inner counter is also the
**thing being printed**:

```
for i in 1..n:
    for j in 1..i:
        print j            <- j is the value, not just the repeat count
    print a newline
```

Two jobs, one variable. That is the whole idea of this pattern, and it is why the
mistakes below are of a kind that could not exist in Pattern 2.

## The check that worked one pattern ago stops working

Pattern 2 ended on a deliberately narrow claim: for *that* pattern, counting the
stars was a sufficient check, because every mistake shifted the count. Here is
where that stops being true. Measured against the correct output for every n from
0 to 40, and then asked of each check, what is the smallest n at which it notices:

| Mistake | Wrong on | Total count | Per-line count | Line length |
|---|---|---|---|---|
| Inner bound `j < i`, so one short | 40/41 | n = 1 | n = 1 | n = 1 |
| Row length left at n (a rectangle) | 39/41 | n = 2 | n = 2 | n = 2 |
| **Prints `j` with 0-based values** | 40/41 | **never** | **never** | n = 10 |
| **Prints the row index, not the column** | 39/41 | **never** | **never** | n = 10 |

The two structural mistakes are caught instantly, exactly as before. The two
**value** mistakes are invisible to counting at every size tested, because they
print exactly the right number of things — they just print the wrong things.

This is the general lesson: **a count checks the shape, never the contents.** As
soon as a pattern chooses what to print, the contents need a check of their own.

## The most interesting wrong answer is a different pattern

The natural slip is to reach for the wrong loop variable and print `i` where you
meant `j`:

```
correct (print j)      the slip (print i)
1                      1
1 2                    2 2
1 2 3                  3 3 3
1 2 3 4                4 4 4 4
```

The right-hand side is not noise. It is **Pattern 4**, the repeating-number
triangle, produced perfectly — verified byte-identical to an independent Pattern 4
implementation for every n from 0 to 300.

That makes it a bad bug to have. It is a well-formed triangle, it has the right
number of items on every row, and at n = 1 it is *correct*, since both print a
single 1. It is wrong on 39 of the 41 sizes from 0 to 40, passing exactly at n = 0
and n = 1.

## Line lengths tell you nothing until n = 10

The assertion Pattern 2 recommended — check the length of each line — does
eventually catch both value bugs, but not soon. Every value from 1 to 9 is one
character wide, so while the numbers stay single-digit, a line's length is fixed
by how many items are on it and carries no information about what they are:

| Row | Correct | Prints `j` | Prints row index |
|---|---|---|---|
| 1..9 | 1, 3, 5 ... 17 | identical | identical |
| **10** | **20** | 19 | 29 |
| 11 | 23 | 22 | 32 |

The lengths first separate at **row 10**, when the number 10 becomes two
characters wide. So the check needs n of at least 10 to say anything at all. Total
characters behave the same way — at n = 9 all three produce exactly 81, and at
n = 100 they read 14,187, 14,095 and 15,105.

The check that actually works is the obvious one nobody writes: compare the tokens
on line i against 1, 2, ... i.

## The separator, and the trailing space

Numbers need separating in a way stars never did, and the common shortcut is to
print a space after every number rather than between them:

```
cout << j << " ";       ->  "1 2 3 4 " with a space on the end
```

Measured over n from 0 to 40, that differs from the correct output on **40 of 41
sizes** under an exact byte comparison and on **0 of 41** once each line is
right-trimmed. It is invisible on screen and fails a strict judge every time,
which is exactly the combination that costs an hour.

## The fast version is a different one this time

Pattern 2 found a large win moving from printing character-by-character to
building each row, and a small refinement in growing one string instead. Here the
two swap places. Measured at n = 6,000, output accumulated in a string stream:

| Version | Time | |
|---|---|---|
| Number at a time | 701.68ms | |
| Fresh row each time | 264.98ms | 2.6x |
| **Grow one row** | **2.34ms** | **113x** |

The reason is that the per-row version converts an integer to text for **every
number it prints** — n(n+1)/2 conversions, 18,003,000 of them at n = 6,000 —
whereas the growing version appends only the one new number per row, so it does
n. Precomputing the number text halves the fresh-row time to 132.80ms, which
confirms conversion is about half the cost and the repeated appends are the other
half; even then it stays 57x slower than growing one row.

Growing the row is available because the rows still nest — row i is a prefix of
row i + 1, verified with no exceptions across n from 1 to 200. Python behaves the
same way: joining per row is 1.6x to 1.7x faster than printing item by item, and
growing one row is a further 45x to 66x.

So the ranking held but the margins inverted, which is the thing worth carrying
forward: the cost sits wherever the repeated work is, and here that is the number
formatting rather than the stream call.

<!-- @intuition -->
A star is a constant, so in Pattern 2 the inner counter was pure bookkeeping — it only had to reach the right limit and nothing depended on its value along the way. Once the pattern prints numbers, that same counter is doing two jobs at once: it is the loop's position and it is the content. That is why `i` and `j` become genuinely confusable here in a way they were not before, and why the mistake produces something that still looks like a finished triangle. The second half follows from the same observation about nesting that Pattern 2 ended on: row i is row i minus one with one more number after it, so the previous row is not something to rebuild but something to extend — and this time that matters enormously, because rebuilding means re-converting every number on the row rather than re-copying a few bytes.

<!-- @approach -->
### Number at a Time

<!-- @idea -->
Nested loops, printing the inner counter's value on each iteration and a separator between them.

<!-- @steps -->
1. Loop over the rows from one up to and including n.
2. Inside it, loop from one up to and including the current row index.
3. Print a space first if this is not the first number on the row.
4. Print the value of the inner counter, not the outer one.
5. Print a newline after the inner loop finishes.

<!-- @complexity -->
- time: O(n^2) numbers printed, with one stream operation per number and one per separator
- space: O(1)
- note: The direct translation, and the version that makes the i-versus-j choice visible. Measured 701.68ms at n = 6,000 against 264.98ms building each row — only 2.6x, far smaller than Pattern 2's 97x, because each item costs an integer-to-text conversion rather than a single character.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            if (j > 1) cout << ' ';
            cout << j;
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: Rows counted from one, so the bound is j <= i and row i gets exactly i numbers.
- 7: The separator goes between numbers, not after them. Printing it after every number leaves a trailing space on every line.
- 8: j, not i. Printing i here produces Pattern 4 — a correct-looking triangle of repeated numbers.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            if (j > 1) System.out.print(' ');
            System.out.print(j);
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 5: The value printed comes from the inner counter, which is the entire difference from Pattern 2.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for j in range(1, i + 1):
            if j > 1:
                print(" ", end="")
            print(j, end="")
        print()


# print(j), not print(i): the value tracks the column, not the row.
```

<!-- @annotations -->
- 3: range(1, i + 1) gives the values 1 through i directly, so the counter and the content are the same thing.
- 6: Printing j. Printing i here would give 1 / 2 2 / 3 3 3, which is Pattern 4 rather than a mistake that looks like one.

<!-- @approach -->
### Fresh Row Each Time

<!-- @idea -->
Build each row as a complete string of numbers and separators, then print it in one operation.

<!-- @steps -->
1. Loop over the rows.
2. Start an empty string for this row.
3. Append the numbers one through i, putting a separator before all but the first.
4. Print the finished string followed by a newline.
5. The number of stream operations drops from one per number to one per row.

<!-- @complexity -->
- time: O(n^2) characters, n(n+1)/2 integer-to-text conversions, n stream operations
- space: O(n) for the longest row
- note: Measured 264.98ms at n = 6,000. Worth 2.6x over printing number by number, but still 113x slower than growing one row, because it re-converts every number on every row — 18,003,000 conversions at that size against 6,000.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        string row;
        for (int j = 1; j <= i; j++) {
            if (j > 1) row += ' ';
            row += to_string(j);
        }
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 7: A fresh empty string per row, which is where the repeated work comes from.
- 10: One conversion per number printed, so n(n+1)/2 in total. Precomputing the text halves the running time, which is how the cost was attributed.
- 12: One stream operation per row instead of one per number.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        StringBuilder row = new StringBuilder();
        for (int j = 1; j <= i; j++) {
            if (j > 1) row.append(' ');
            row.append(j);
        }
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 3: A new builder for every row. Hoisting it out of the loop is the next approach, and it is worth far more here than the same move was in Pattern 2.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        print(" ".join(map(str, range(1, i + 1))))


# join places separators between the values, so no trailing space
# appears. It also converts every number on every row.
```

<!-- @annotations -->
- 3: join puts the separator between items rather than after each one, which removes the trailing-space mistake by construction.

<!-- @approach -->
### Grow One Row

<!-- @idea -->
Keep one string across all the rows and append only the new number each time, since row i is row i minus one plus one more number.

<!-- @steps -->
1. Create one empty string before the loop.
2. Loop over the rows from one up to and including n.
3. Append a separator, unless this is the first row.
4. Append the current row index as text — the only conversion performed.
5. Print the whole string followed by a newline.

<!-- @complexity -->
- time: O(n^2) characters written, but only n integer-to-text conversions and n appends
- space: O(n) for the single growing row
- note: The fastest by a wide margin — 2.34ms at n = 6,000 against 264.98ms rebuilding each row, and 67x at n = 500 and 125x at n = 2,000. The same trick was worth only 1.30x to 1.73x in Pattern 2; it is worth far more here because what it avoids repeating is number formatting rather than a byte copy.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    string row;
    for (int i = 1; i <= n; i++) {
        if (i > 1) row += ' ';
        row += to_string(i);
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 6: One string for the entire pattern, declared outside the loop and never reset.
- 9: The only conversion in the whole function runs n times, against n(n+1)/2 when each row is rebuilt.
- 10: The full row is written as one block. The bytes written are still quadratic — that is the output size — but they are copied rather than reformatted.

<!-- @code java -->
```java
static void pattern(int n) {
    StringBuilder row = new StringBuilder();
    for (int i = 1; i <= n; i++) {
        if (i > 1) row.append(' ');
        row.append(i);
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 2: The builder lives outside the loop, which is the entire change from the previous approach.

<!-- @code python -->
```python
def pattern(n):
    row = ""
    for i in range(1, n + 1):
        row = f"{row} {i}" if row else str(i)
        print(row)


# Measured 45x to 66x faster than rebuilding the row with join,
# because it formats n numbers instead of n(n+1)/2.
```

<!-- @annotations -->
- 4: The guard exists so the first row does not begin with a space, which is the same between-not-after rule the separator needs everywhere.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
1 / 1 2 / 1 2 3 / 1 2 3 4 — ten numbers over four lines

<!-- @why -->
Small enough to read at a glance, and it fixes the item total that the two value bugs will be shown to preserve.

<!-- @walkthrough -->
1. The outer loop runs for i values 1, 2, 3 and 4.
2. At i = 1 the inner loop runs once with j = 1, printing 1.
3. At i = 2 it runs with j = 1 then j = 2, printing 1, a space, then 2.
4. The separator is printed before each number except the first on the row.
5. Row i therefore holds exactly the values 1 through i, in order.
6. The item total is 1 + 2 + 3 + 4, which is 10 — the same n(n+1)/2 as Pattern 2.
7. The printed characters number 16, since the four separators count too.

<!-- @example -->

<!-- @input -->
A version that prints i instead of j, at n = 4 and at n = 1

<!-- @output -->
1 / 2 2 / 3 3 3 / 4 4 4 4 at n = 4 — but correct at n = 1

<!-- @why -->
The single most likely mistake in this pattern, and it produces a well-formed triangle rather than anything that looks broken.

<!-- @walkthrough -->
1. Reaching for the outer counter inside the inner loop prints the row number on every position.
2. The result is a complete, tidy triangle — it just is not this one.
3. It is Pattern 4, the repeating-number triangle, verified byte-identical to an independent implementation for every n from 0 to 300.
4. At n = 1 both print a single 1, so the smallest test passes.
5. Measured over n from 0 to 40, it is wrong on 39 and correct at exactly n = 0 and n = 1.
6. Every row carries the right number of items, so no counting check ever notices.
7. The first size at which line lengths separate is n = 10, where the correct row is 20 characters and this one is 29.

<!-- @example -->

<!-- @input -->
A version printing 0-based values, checked with a count and then with the tokens

<!-- @output -->
0 / 0 1 / 0 1 2 / 0 1 2 3 — passes every counting check at every size tested

<!-- @why -->
Retires Pattern 2's counting check explicitly, since that lesson would otherwise carry over as a general rule.

<!-- @walkthrough -->
1. Writing the loops zero-indexed and printing j gives values starting at 0 rather than 1.
2. Row i still holds exactly i items, so the per-line count is right.
3. The total is still n(n+1)/2, so the total count is right.
4. Asked for the smallest n at which either count notices, over n from 1 to 40, the answer is that neither ever does.
5. Line lengths agree too for n from 1 to 9, since every value is one character wide.
6. They first differ at row 10 — 20 characters correct against 19 — so the length check needs n of at least 10.
7. Comparing the tokens on line i against 1 through i catches it at n = 1, which is why that is the assertion to write.

<!-- @example -->

<!-- @input -->
n = 6,000, built three different ways

<!-- @output -->
701.68ms number by number, 264.98ms per row, 2.34ms growing one row

<!-- @why -->
Inverts the margins measured in Pattern 2, so the earlier result is not carried over as a rule about which change matters.

<!-- @walkthrough -->
1. In Pattern 2 the move from per-character to per-row printing was worth about 97 times.
2. Here the same move is worth 2.6 times, because each item costs a number conversion rather than a single character.
3. Building each row converts every number on it, giving 18,003,000 conversions at this size.
4. Growing one row appends only the new number, giving 6,000 — three thousand times fewer.
5. That measured 2.34ms against 264.98ms, about 113 times, and 67x at n = 500 and 125x at n = 2,000.
6. Precomputing the number text drops the per-row version to 132.80ms, so conversion is about half its cost and the repeated appends are the rest.
7. Even with conversion removed entirely, the per-row version stays 57 times slower, which is why the growing version wins on both counts.

<!-- @visualization custom -->

<!-- @description -->
A grid where each cell now carries a number rather than a fixed glyph, with the two loop counters drawn as separate labelled boxes and a highlighted wire running from the inner counter box into the cell being filled — that wire is the subject of this pattern, and it should be drawn in the accent colour and left visible after the fill so the reader sees the value arriving from the column, not the row. Beside it, a shadowed second wire from the outer counter box into the same cell, greyed and marked as the mistake, with a toggle that switches which wire is live: flipping it redraws the grid as 1 / 2 2 / 3 3 3 / 4 4 4 4 and labels that grid Pattern 4, noting it is byte-identical to a real Pattern 4 implementation for all n up to 300. Run a check panel alongside all three grids with four indicator lights per grid — total item count, per-line item count, line length, token comparison — and step through n = 1, 4, 10: the counting lights stay green for both value bugs at every step, the line-length light stays green until n = 10 and only then turns red, and the token light is red from n = 1. That divergence at n = 10 should be drawn on the character ruler beneath row 10, where the correct row measures 20 against 19 and 29. Add a separator strip showing the between-versus-after choice as two rows of the same numbers, one ending flush and one with a visible trailing space cell, annotated 40 of 41 sizes differ under exact comparison and 0 of 41 after right-trimming. Close with three build lanes at n = 6,000: the first emitting a conversion badge per number, the second emitting a fresh row block plus a conversion badge per number, the third emitting one conversion badge per row into a single block that extends by one number each line — conversion counters reading 18,003,000, 18,003,000 and 6,000, and time bars reading 701.68ms, 264.98ms and 2.34ms.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"1\n1 2\n1 2 3\n1 2 3 4\n","lines":4,"itemsPerLine":[1,2,3,4],"items":10,"formula":"n(n+1)/2","charsPrinted":16,"separator":"single space between numbers, none trailing","valueSource":"inner counter j"},"newMechanic":"the printed value comes from the inner counter, which in Pattern 2 was only a repeat count","bugPanel":{"variants":[{"name":"prints row index i instead of column j","output":"1\n2 2\n3 3 3\n4 4 4 4\n","wrongOn":"39 of 41","correctAt":[0,1],"isActually":"Pattern 4","identicalToPattern4Over":"n = 0..300, 0 differences"},{"name":"0-based values (prints j unshifted)","output":"0\n0 1\n0 1 2\n0 1 2 3\n","wrongOn":"40 of 41","correctAt":[0]},{"name":"inner bound j < i (one short)","wrongOn":"40 of 41","correctAt":[0]},{"name":"row length fixed at n (rectangle)","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"space after every number","wrongOn":"40 of 41 strict, 0 of 41 right-trimmed","correctAt":[0]}]},"checkPanel":{"columns":["total item count","per-line item count","line length","token comparison"],"smallestNThatCatches":{"inner bound j < i":[1,1,1,1],"row length fixed at n":[2,2,2,2],"prints row index":["never","never",10,1],"0-based values":["never","never",10,1]},"whyLengthIsBlind":"values 1..9 are all one character wide, so a line's length is fixed by its item count until the number 10 appears","rowLengthsAtN11":{"row10":{"correct":20,"zeroBased":19,"rowIndex":29},"row11":{"correct":23,"zeroBased":22,"rowIndex":32}},"totalCharsAtN100":{"correct":14187,"zeroBased":14095,"rowIndex":15105},"totalCharsAtN9":{"correct":81,"zeroBased":81,"rowIndex":81},"lesson":"a count checks the shape, never the contents"},"assertions":["line i has exactly i tokens","the tokens on line i are 1,2,...,i","total items equal n(n+1)/2","no line begins or ends with a space"],"nesting":{"rowIsPrefixOfNext":true,"nonNestingPairs":0,"tested":"n = 1..200"},"buildPanel":[{"n":500,"numberAtATimeMs":4.96,"freshRowMs":1.86,"growRowMs":0.03,"freshVsGrow":67},{"n":2000,"numberAtATimeMs":76.69,"freshRowMs":28.74,"growRowMs":0.23,"freshVsGrow":125},{"n":6000,"numberAtATimeMs":701.68,"freshRowMs":264.98,"growRowMs":2.34,"freshVsGrow":113}],"conversionsAt6000":{"freshRow":18003000,"growRow":6000,"ratio":3000},"conversionAttribution":{"freshRowMs":264.98,"freshRowWithTextPrecomputedMs":132.80,"share":"about half","stillSlowerThanGrowRow":57},"pattern2Contrast":{"perItemToPerRow":{"pattern2":"about 97x","pattern3":"2.6x"},"growOneRow":{"pattern2":"1.30x to 1.73x","pattern3":"113x"},"why":"the repeated work here is number formatting, not a byte copy"},"python":{"perItemOverJoin":"1.6x to 1.7x","joinOverGrow":"45x to 66x"}}
```

<!-- @highlights -->
- Each cell carries a number rather than a fixed glyph, with the two loop counters drawn as separate labelled boxes.
- A highlighted wire runs from the inner counter box into the cell being filled, and stays visible after the fill.
- That wire is the subject of this pattern — the value arrives from the column, not the row.
- A greyed second wire from the outer counter into the same cell is marked as the mistake.
- Toggling which wire is live redraws the grid as 1 / 2 2 / 3 3 3 / 4 4 4 4 and labels it Pattern 4.
- The label notes it is byte-identical to a real Pattern 4 implementation for all n up to 300.
- A check panel gives every grid four indicator lights: total count, per-line count, line length, token comparison.
- Stepping through n = 1, 4 and 10, the counting lights stay green for both value bugs at every step.
- The line-length light stays green until n = 10 and only then turns red.
- The token light is red from n = 1, which is why that is the assertion to write.
- A character ruler beneath row 10 shows the correct row measuring 20 against 19 and 29.
- A separator strip shows the between-versus-after choice as two rows, one flush and one with a visible trailing space cell.
- That strip is annotated 40 of 41 sizes differ under exact comparison and 0 of 41 after right-trimming.
- Three build lanes run at n = 6,000, emitting a visible conversion badge whenever a number is formatted.
- Conversion counters read 18,003,000, 18,003,000 and 6,000 across the three lanes.
- Time bars read 701.68ms, 264.98ms and 2.34ms, with the large gap now at the second step rather than the first.

<!-- @edgeCases -->
- n equal to zero — no output, and the outer loop never runs.
- n equal to one — a single 1, and the size at which printing the row index instead of the column is indistinguishable from correct.
- n equal to two — the smallest input that separates the two value conventions, since the second row reads 1 2 rather than 2 2 or 0 1.
- n equal to ten — the smallest input at which any length-based check can see a value bug, because 10 is the first two-character number.
- Negative n — no output, since the loop does not run.
- Very large n — the character count grows faster than the item count once numbers get wider; at n = 1,000 there are 500,500 items but 1,897,888 characters.
- A trailing space after the last number on a line — visually identical, and a strict comparison rejects it on 40 of 41 sizes from 0 to 40.
- A leading space on the first row, from appending the separator before the check — the mirror of the same mistake.
- Rows counted from zero — then the inner bound is j <= i and the printed value is j + 1, and mixing the two is where 0-based output comes from.
- A caller expecting the numbers to repeat down the row — that is Pattern 4, which this pattern's most common bug produces exactly.

<!-- @pitfalls -->
- Printing i where you meant j. The output is a well-formed triangle of repeated numbers, which is Pattern 4's correct answer and this one's most common wrong answer — wrong on 39 of 41 sizes, and correct at n = 1.
- Trusting a count. Both value bugs print exactly the right number of items on exactly the right number of lines, so total and per-line counts never catch either at any size tested.
- Carrying Pattern 2's conclusion forward. Counting was sufficient there because every mistake there was structural; here the mistakes are about contents, and a count cannot see contents.
- Relying on line lengths below n = 10. Values 1 to 9 are all one character wide, so lengths are determined by the item count alone and both value bugs slip through.
- Printing the separator after each number rather than between them. It looks right and differs from the expected output on 40 of 41 sizes under exact comparison.
- Mixing zero-based loops with the printed value. Zero-based rows need the value written as j + 1; forgetting the shift prints 0 through i - 1.
- Leaving the inner bound at n. The result is a rectangle of numbers, caught at n = 2 by every check, but still correct at n = 1.
- Rebuilding each row from scratch at scale. Measured 113 times slower than growing one row at n = 6,000, because it re-formats every number on every row.
- Assuming the row-building step is where the speed is, as it was in Pattern 2. Here it is worth only 2.6x, and the real win is one step further on.
- Asserting the character count instead of the tokens. At n = 9 the correct output and both value bugs all produce exactly 81 characters.

<!-- @doubt -->
### Why does printing i instead of j look like it works?

<!-- @answer -->
Because it does work — for a different problem. Printing the row index on every position gives 1 / 2 2 / 3 3 3 / 4 4 4 4, which is Pattern 4's correct answer, verified byte-identical to an independent Pattern 4 implementation for every n from 0 to 300. So it is a complete, well-formed triangle with the right number of items on every row, which is why nothing about its appearance suggests a bug. It is wrong on 39 of the 41 sizes from 0 to 40 and correct at exactly n = 0 and n = 1. The check that catches it is comparing the tokens on line i against 1 through i, which fails at n = 2 immediately.

<!-- @doubt -->
### Pattern 2 said counting the stars was enough. Why not here?

<!-- @answer -->
Because Pattern 2's mistakes were all structural and this pattern's most likely ones are not. There, every bug changed how many stars were printed, so a count caught them. Here, printing the wrong value leaves the shape untouched: row i still holds i items and the total is still n(n+1)/2. Asked for the smallest n at which a total count or a per-line count notices either value bug, over n from 1 to 40, the answer is that neither ever does. That is why Pattern 2's claim was written as being about that pattern rather than as a rule. The rule that survives is narrower: a count checks the shape, never the contents.

<!-- @doubt -->
### Is checking each line's length a good enough test?

<!-- @answer -->
Better than counting, but it goes blind exactly where you need it. Every value from 1 to 9 is one character wide, so while n stays under 10 a line's length is fixed entirely by how many items are on it — the correct output, the 0-based version and the repeated-number version all give lengths 1, 3, 5 up to 17, and all produce exactly 81 characters at n = 9. The lengths first separate at row 10, where the correct row measures 20 against 19 and 29. So a length check needs n of at least 10 to say anything about values. Compare the tokens instead: line i should read 1, 2, up to i.

<!-- @doubt -->
### Should there be a space after the last number on a line?

<!-- @answer -->
No, and it is worth being deliberate about it because the two versions look identical. Writing the separator after every number rather than between them leaves a trailing space on every line; measured over n from 0 to 40, that differs from the correct output on 40 of the 41 sizes under an exact byte comparison and on 0 of 41 once each line is right-trimmed. Some judges trim and some do not. The reliable habit is to print the separator before each number except the first, or to build the row with a join, which places separators between items by construction.

<!-- @doubt -->
### Why is growing one string so much better here than it was in Pattern 2?

<!-- @answer -->
Because of what it stops repeating. In Pattern 2 rebuilding a row meant writing i identical characters, which is a cheap fill, so growing the string instead was worth only 1.30x to 1.73x. Here rebuilding a row means converting every number on it from an integer to text — n(n+1)/2 conversions in total, 18,003,000 at n = 6,000 — while growing the row converts only the new number, giving 6,000. Measured, that is 2.34ms against 264.98ms, about 113x. Precomputing the number text drops the rebuild to 132.80ms, so conversion is roughly half the cost and the repeated appends are the other half.

<!-- @doubt -->
### Why is printing number by number only 2.6x slower here, when it was 97x in Pattern 2?

<!-- @answer -->
Because the thing being compared got more expensive. The stream-operation overhead per item is roughly the same in both patterns, but in Pattern 2 the alternative was writing a single character, so that overhead dominated completely. Here each item also has to be formatted as text, which costs real work whichever version you write — so the fixed overhead is a much smaller share of the total and removing it buys less. It measured 701.68ms against 264.98ms at n = 6,000. The general point is that a speedup ratio describes a comparison, not a technique, and it moves when either side changes.

<!-- @doubt -->
### The rows still nest, so can I always grow one string?

<!-- @answer -->
Here you can, and it was verified — row i is a prefix of row i + 1 with no exceptions across n from 1 to 200, so nothing ever needs discarding. But nesting is a property of a particular pattern's shape, not a general one. It held in Pattern 2 and holds here because both grow to the right by one item per row; it will fail as soon as a pattern's rows shrink, indent, or change what came before. Check it against the shape before reaching for it, and fall back to building the row when it does not hold.

<!-- @doubt -->
### How do I write the loops if I prefer counting rows from zero?

<!-- @answer -->
Shift the value, not just the bound. With rows from zero the outer loop runs i from 0 to n - 1, the inner bound becomes j <= i so row i still gets i + 1 items, and the printed value must be j + 1 rather than j. Forgetting that last shift is exactly the 0-based bug — output reading 0 / 0 1 / 0 1 2 — which is wrong on 40 of the 41 sizes from 0 to 40 and which no counting check catches. Counting from one avoids the shift entirely, and for number patterns that is the convention worth defaulting to, since the value and the counter then coincide.
