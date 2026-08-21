---
id: pattern-4-right-angled-repeating-number-triangle
topic: Pattern Printing
title: Pattern 4 - Right-Angled Repeating Number Triangle
difficulty: Easy
status: ready
prerequisites:
  - pattern-3-right-angled-number-triangle
  - pattern-2-right-angled-star-triangle
  - nested-loops
  - for-loop
relatedIds:
  - pattern-3-right-angled-number-triangle
  - pattern-6-inverted-right-angled-number-triangle
  - pattern-11-binary-number-triangle
  - pattern-13-increasing-number-triangle
  - nested-loops
---

<!-- @summary -->
Print a triangle whose row i holds i copies of the number i — the exact mirror of Pattern 3, where the rows stop nesting entirely (0 of 19,900 pairs), which turns the optimisation that was fastest one pattern ago into a silent wrong answer that no counting check catches, and shrinks the total speed available from 300x to 5.2x.

<!-- @theory -->
## The problem

Print n rows where row i holds i copies of the number i, separated by single spaces.

```
n = 4      1
           2 2
           3 3 3
           4 4 4 4
```

## The mirror of Pattern 3

Pattern 3 printed the **column** counter and repeated it across the row. This
prints the **row** counter:

```
Pattern 3 (print j)     Pattern 4 (print i)
1                       1
1 2                     2 2
1 2 3                   3 3 3
1 2 3 4                 4 4 4 4
```

Same loops, same bounds, one variable swapped. Pattern 3's container introduced
this output as *its* most common bug; here it is the answer, and Pattern 3's
answer is the bug. Verified: writing `j` here produces output byte-identical to an
independent Pattern 3 implementation for every n from 0 to 300, and it is wrong on
39 of the 41 sizes from 0 to 40, correct at exactly n = 0 and n = 1.

## The inner counter now does nothing

Worth noticing because it is the structural signature of this pattern and the
thing that makes the optimisation below legal:

```
for i in 1..n:
    for j in 1..i:
        print i          <- j appears in the loop header and nowhere else
    print a newline
```

Every token on a row is identical to every other — checked at n = 4 and n = 12,
with no exceptions. So `j` is a pure repeat count, exactly as it was in Patterns 1
and 2, and the row is a repetition rather than a sequence.

## The rows have stopped nesting

Patterns 2 and 3 both ended on the same observation: row i is a prefix of row
i + 1, so you can hold one string and extend it. Both containers flagged that as a
property of those shapes rather than a general technique. This is where it breaks.

Row 2 is `2 2` and row 3 is `3 3 3` — they share nothing. Measured across n from
1 to 200: **0 nesting pairs, 19,900 non-nesting pairs.**

So carrying the trick over does not make the code slower, it makes it **wrong**.
And the output it produces is, once again, Pattern 3 — byte-identical to an
independent Pattern 3 implementation for every n from 0 to 300, first wrong at
n = 2.

That is the case worth sitting with. Two unrelated mistakes — reaching for the
wrong loop variable, and reusing an optimisation whose precondition no longer
holds — converge on the same wrong output, and it is a wrong output that looks
completely well-formed.

## What the checks catch, again

Same four checks as Pattern 3, same measurement: the smallest n at which each
one notices, over n from 1 to 40.

| Mistake | Wrong on | Total count | Per-line count | Line length | Tokens |
|---|---|---|---|---|---|
| Inner bound one short | 40/41 | n = 1 | n = 1 | n = 1 | n = 1 |
| Repeat count fixed at n | 39/41 | n = 2 | n = 2 | n = 2 | n = 2 |
| 0-based rows, value not shifted | 40/41 | never | never | n = 10 | n = 1 |
| **Prints column j (= Pattern 3)** | 39/41 | **never** | **never** | n = 10 | n = 2 |
| **Grows one row (the stale trick)** | 39/41 | **never** | **never** | n = 10 | n = 2 |

The counting checks stay blind for exactly the same reason as in Pattern 3 — every
one of those variants prints the right number of items in the right places. Line
lengths are blind below n = 10 for the same reason too, since every value from 1
to 9 is one character wide: rows 1 to 9 measure 1, 3, 5 up to 17 in this pattern
and in Pattern 3 alike. They first separate at **row 10**, where this pattern's
row is 29 characters against Pattern 3's 20, because ten copies of `10` is wider
than the numbers 1 through 10.

Only the token check works from the start: line i should read i, i, ... i.

## The optimisation that is available, and how much smaller it is

Pattern 3's fast version converted one number per row instead of every number,
and it got there by extending the previous row. That route is closed. But the
*conversion* saving is still available by a different route: since the value does
not depend on `j`, convert it once before the inner loop and append the same text
i times.

Measured at n = 6,000, output accumulated in a string stream:

| Version | Time | Against the previous |
|---|---|---|
| Number at a time | 1216.81ms | |
| Fresh row, converting each number | 463.13ms | 2.6x |
| **Convert once per row** | **234.33ms** | **2.0x** |

That is 3,000 times fewer conversions — 6,000 rather than 18,003,000 — for a 2.0x
saving, and the total available across all three versions is **5.2x**.

Compare Pattern 3, where the same three-step ladder was worth **300x** end to end.
The missing factor is precisely what nesting bought: there, extending the previous
row skipped the per-item appends as well as the conversions. Here the row must
still be assembled item by item, because nothing from the previous row survives.
Pattern 3 measured that split directly — removing conversions alone was worth 2.0x
there too, and the remaining 57x came from not rebuilding. This pattern gets the
2.0x and not the 57x.

Reusing a single buffer across rows instead of allocating a fresh row string
recovers a further 1.05x to 1.13x, which is small enough to say plainly: after the
conversions are hoisted, the remaining time is the characters themselves.

## The separator, unchanged

As in Pattern 3, printing a space after every number rather than between them
differs from the correct output on **40 of 41 sizes** under an exact byte
comparison and on **0 of 41** after right-trimming each line.

<!-- @intuition -->
Two loops, and only one of them is about content. Once you see that the printed value never mentions the inner counter, everything else follows: the row is one thing repeated, so the number only needs converting to text once, and the inner loop is doing nothing but counting to i. The harder half is what stops being true. The previous two patterns both let you keep one string and extend it, because each row began with the whole of the row above. Here every row is made of a different digit, so there is nothing to extend, and the habit of extending produces a triangle that looks entirely reasonable and is the previous lesson's answer. That is the general shape of the risk: an optimisation carries a precondition, and when the precondition is about the shape of the output rather than about the code, nothing in the code reminds you to recheck it.

<!-- @approach -->
### Number at a Time

<!-- @idea -->
Nested loops printing the outer counter's value on every inner iteration, with a separator between numbers.

<!-- @steps -->
1. Loop over the rows from one up to and including n.
2. Inside it, loop from one up to and including the current row index.
3. Print a space first if this is not the first number on the row.
4. Print the value of the outer counter, ignoring the inner one.
5. Print a newline after the inner loop finishes.

<!-- @complexity -->
- time: O(n^2) numbers printed, with one stream operation per number and one per separator
- space: O(1)
- note: The direct translation, and the version where the i-versus-j choice is most visible. Measured 1216.81ms at n = 6,000 against 463.13ms building each row — 2.6x, the same ratio measured in Pattern 3, since the per-item cost is the same integer-to-text work.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            if (j > 1) cout << ' ';
            cout << i;
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: j appears in this header and nowhere else in the function — it is a repeat count, not a value.
- 7: The separator goes between numbers, not after them.
- 8: i, not j. Printing j here produces Pattern 3, which is a well-formed triangle and the wrong one.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= i; j++) {
            if (j > 1) System.out.print(' ');
            System.out.print(i);
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 5: The value printed comes from the outer counter, which is the exact mirror of Pattern 3.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for j in range(1, i + 1):
            if j > 1:
                print(" ", end="")
            print(i, end="")
        print()


# print(i), not print(j). j only counts here, so naming it _ would
# say so — and would make the swap impossible to write by accident.
```

<!-- @annotations -->
- 3: The inner loop supplies a count and nothing more, so its variable is never read inside the body.
- 6: Printing i. Printing j would give 1 / 1 2 / 1 2 3, which is Pattern 3 rather than anything that looks broken.

<!-- @approach -->
### Fresh Row, Converting Each Number

<!-- @idea -->
Build each row as a string and print it in one operation, converting the number to text at every position.

<!-- @steps -->
1. Loop over the rows.
2. Start an empty string for this row.
3. Append the row's number i times, with a separator before all but the first.
4. Print the finished string followed by a newline.
5. The stream operations drop from one per number to one per row.

<!-- @complexity -->
- time: O(n^2) characters, n(n+1)/2 integer-to-text conversions, n stream operations
- space: O(n) for the longest row
- note: Measured 463.13ms at n = 6,000, worth 2.6x over printing number by number. It converts the same value repeatedly — 18,003,000 conversions of just 6,000 distinct numbers — which is what the next approach removes.

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
            row += to_string(i);
        }
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 10: The same number converted i times over. Nothing in this expression depends on j, which is exactly why it can be lifted out.
- 12: One stream operation per row instead of one per number.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        StringBuilder row = new StringBuilder();
        for (int j = 1; j <= i; j++) {
            if (j > 1) row.append(' ');
            row.append(i);
        }
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 6: Appending an int formats it every time. Appending a pre-made string instead is the next approach.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        print(" ".join(str(i) for _ in range(i)))


# str(i) sits inside the comprehension, so it runs once per item:
# n(n+1)/2 conversions of only n distinct values.
```

<!-- @annotations -->
- 3: The underscore names the inner counter honestly — it is never read. But str(i) is still evaluated on every iteration.

<!-- @approach -->
### Convert Once Per Row

<!-- @idea -->
Convert the row's number to text once before the inner loop, then append that same text i times.

<!-- @steps -->
1. Loop over the rows.
2. Convert the current row index to text, once.
3. Seed the row with that text, so the first copy is already in place.
4. Append a separator and the same text for each remaining copy.
5. Print the finished row followed by a newline.

<!-- @complexity -->
- time: O(n^2) characters, only n integer-to-text conversions, n stream operations
- space: O(n) for the longest row
- note: The fastest available here — 234.33ms at n = 6,000 against 463.13ms, so 2.0x, and 5.2x over printing number by number. Far less than Pattern 3's 300x, because the rows do not nest and each one must still be assembled item by item. Reusing a single buffer across rows adds only 1.05x to 1.13x more.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        string tok = to_string(i);
        string row = tok;
        for (int j = 2; j <= i; j++) {
            row += ' ';
            row += tok;
        }
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 7: The only conversion in the function. It runs n times in total, against n(n+1)/2 when it sits inside the inner loop.
- 8: Seeding the row with the first copy is what lets the separator always precede a token, with no condition inside the loop.
- 9: Starting at 2 because one copy is already in place. Row 1 therefore skips the loop entirely.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        String tok = Integer.toString(i);
        StringBuilder row = new StringBuilder(tok);
        for (int j = 2; j <= i; j++) {
            row.append(' ').append(tok);
        }
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 3: One conversion per row, hoisted above the inner loop because its result does not vary with j.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        tok = str(i)
        print(" ".join([tok] * i))


# The list holds i references to one string, not i separate
# conversions, so str runs n times across the whole pattern.
```

<!-- @annotations -->
- 3: One conversion per row, bound to a name before the row is built.
- 4: Repeating a list of one element gives i references to the same string, which join then writes out with separators between them.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
1 / 2 2 / 3 3 3 / 4 4 4 4 — ten numbers over four lines

<!-- @why -->
Small enough to read at a glance, and it fixes the item total that the value bugs will be shown to preserve.

<!-- @walkthrough -->
1. The outer loop runs for i values 1, 2, 3 and 4.
2. At i = 1 the inner loop runs once and prints 1.
3. At i = 2 it runs twice, printing 2 both times with a space between them.
4. The inner counter never appears in what is printed — it only decides how many times.
5. Row i therefore holds i copies of i.
6. The item total is 1 + 2 + 3 + 4, which is 10 — the same n(n+1)/2 as Patterns 2 and 3.
7. The characters printed number 16, which is also what Pattern 3 gives at this size, since all the values are single digits.

<!-- @example -->

<!-- @input -->
The Pattern 2 and 3 trick of extending one row, applied here

<!-- @output -->
1 / 1 2 / 1 2 3 / 1 2 3 4 — a clean triangle, and Pattern 3's

<!-- @why -->
An optimisation that was correct and fastest one pattern ago becomes a wrong answer here, with nothing in the code to signal it.

<!-- @walkthrough -->
1. Patterns 2 and 3 both allowed keeping one string and appending to it, because row i began with the whole of row i minus one.
2. That holds only while the rows nest, which both containers stated explicitly as a condition.
3. Here row 2 is 2 2 and row 3 is 3 3 3, which share nothing at all.
4. Measured across n from 1 to 200, there are 0 nesting pairs and 19,900 non-nesting pairs.
5. Extending the row therefore appends 1, then 2, then 3, producing Pattern 3's output instead.
6. Verified byte-identical to an independent Pattern 3 implementation for every n from 0 to 300.
7. It is wrong on 39 of the 41 sizes from 0 to 40, first failing at n = 2 and passing at n = 0 and n = 1.

<!-- @example -->

<!-- @input -->
Printing j instead of i, checked four ways

<!-- @output -->
Wrong on 39 of 41 sizes, and only the token check notices before n = 10

<!-- @why -->
The same swap that Pattern 3 warned about, running in the opposite direction — and it lands on the same output as the stale-optimisation bug.

<!-- @walkthrough -->
1. Reaching for the inner counter inside the body prints 1 / 1 2 / 1 2 3 rather than 1 / 2 2 / 3 3 3.
2. Every row still holds the right number of items, so a total count and a per-line count are both satisfied.
3. Asked for the smallest n at which either notices, over n from 1 to 40, neither ever does.
4. Line lengths agree with the correct output for rows 1 to 9, all values being one character wide.
5. They first differ at row 10, where this pattern gives 29 characters and Pattern 3 gives 20.
6. Comparing the tokens on line i against i repeated catches it at n = 2.
7. Two quite different mistakes — this swap, and reusing the row-extending trick — produce exactly the same output, so the symptom identifies neither.

<!-- @example -->

<!-- @input -->
n = 6,000, built three different ways

<!-- @output -->
1216.81ms number by number, 463.13ms per row, 234.33ms converting once per row

<!-- @why -->
Puts a number on what nesting was worth, by measuring the same ladder in a pattern where it is unavailable.

<!-- @walkthrough -->
1. Moving from printing number by number to building each row is worth 2.6x, matching Pattern 3.
2. Building the row still converts the same value at every position, giving 18,003,000 conversions of only 6,000 distinct numbers.
3. Hoisting the conversion above the inner loop is legal here precisely because the value ignores the inner counter.
4. That leaves 6,000 conversions, three thousand times fewer, and measured 234.33ms against 463.13ms — 2.0x.
5. The whole ladder is therefore worth 5.2x, where the same ladder in Pattern 3 was worth 300x.
6. The difference is the cross-row reuse nesting allowed there and forbids here: Pattern 3 also skipped the per-item appends, worth a further 57x.
7. Reusing one buffer across rows rather than allocating per row adds 1.05x to 1.13x, so what remains is the characters themselves.

<!-- @visualization custom -->

<!-- @description -->
The same two-counter grid as Pattern 3, with the accent wire now running from the outer counter into every cell of the row and the inner counter box drawn hollow and greyed, labelled counts only — the point being that the inner counter never reaches the content. A toggle swaps which counter feeds the cells, and flipping it redraws the grid as 1 / 1 2 / 1 2 3 / 1 2 3 4 and labels it Pattern 3, noting byte-identity with a real Pattern 3 implementation for all n up to 300. Beside that toggle put a second, differently-shaped control labelled extend the previous row, and have it produce the same Pattern 3 grid from a completely different mechanism: a single row block that carries forward and grows by one cell per line. The two controls landing on one output is the thing to make unmissable — draw both paths converging on one grid. Above them run a nesting strip: for each pair of adjacent rows, overlay row i on the start of row i + 1 and mark match or no match, with the counter reading 0 matches and 19,900 mismatches over n = 1..200, and set the same strip for Pattern 3 alongside where every pair matches. Keep the four-light check panel from Pattern 3 — total count, per-line count, line length, tokens — and step n = 1, 2, 10: counting lights stay green for both value bugs throughout, the line-length light flips red only at n = 10, the token light is red from n = 2. Draw the character ruler under row 10 showing 29 here against 20 in Pattern 3, with ten two-character tokens laid out to show where the extra width comes from. Close with three build lanes at n = 6,000 emitting a conversion badge whenever a number is formatted: counters reading 18,003,000, 18,003,000 and 6,000, time bars reading 1216.81ms, 463.13ms and 234.33ms, and a ghosted fourth bar showing where Pattern 3's fourth step reached, greyed out and struck through with the label rows do not nest.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"1\n2 2\n3 3 3\n4 4 4 4\n","lines":4,"itemsPerLine":[1,2,3,4],"items":10,"formula":"n(n+1)/2","charsPrinted":16,"valueSource":"outer counter i","innerCounterUsedInBody":false,"everyTokenOnALineIdentical":true},"mirrorOfPattern3":{"pattern3":"1\n1 2\n1 2 3\n1 2 3 4\n","pattern4":"1\n2 2\n3 3 3\n4 4 4 4\n","difference":"which counter is printed"},"nesting":{"rowIsPrefixOfNext":false,"nestingPairs":0,"nonNestingPairs":19900,"tested":"n = 1..200","pattern2And3":"every pair nested"},"bugPanel":{"variants":[{"name":"prints column j instead of row i","wrongOn":"39 of 41","correctAt":[0,1],"isActually":"Pattern 3","identicalToPattern3Over":"n = 0..300, 0 differences"},{"name":"extends one row across the pattern (the Pattern 2/3 trick)","wrongOn":"39 of 41","correctAt":[0,1],"firstWrongAt":2,"isActually":"Pattern 3","identicalToPattern3Over":"n = 0..300, 0 differences","note":"a different mistake with the same output"},{"name":"0-based rows, value not shifted","wrongOn":"40 of 41","correctAt":[0]},{"name":"inner bound one short","wrongOn":"40 of 41","correctAt":[0]},{"name":"repeat count fixed at n (rectangle)","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"space after every number","wrongOn":"40 of 41 strict, 0 of 41 right-trimmed","correctAt":[0]}]},"checkPanel":{"columns":["total item count","per-line item count","line length","token comparison"],"smallestNThatCatches":{"inner bound one short":[1,1,1,1],"repeat count fixed at n":[2,2,2,2],"0-based value":["never","never",10,1],"prints column j":["never","never",10,2],"extends one row":["never","never",10,2]},"whyLengthIsBlind":"values 1..9 are one character wide, so rows 1..9 measure 1,3,5..17 in this pattern and in Pattern 3 alike","rowLengths":{"rows1to9":[1,3,5,7,9,11,13,15,17],"row10":{"pattern4":29,"pattern3":20},"row11":{"pattern4":32,"pattern3":23},"row12":{"pattern4":35,"pattern3":26}},"totalChars":{"n4":{"pattern4":16,"pattern3":16},"n10":{"pattern4":110,"pattern3":101},"n100":{"pattern4":15105,"pattern3":14187},"n1000":{"pattern4":1997005,"pattern3":1897888}}},"assertions":["line i has exactly i tokens","every token on line i equals i","total items equal n(n+1)/2","no line begins or ends with a space"],"buildPanel":[{"n":500,"numberAtATimeMs":8.32,"freshRowConvertEachMs":3.25,"convertOncePerRowMs":1.70,"ladderTotal":4.9},{"n":2000,"numberAtATimeMs":134.56,"freshRowConvertEachMs":51.17,"convertOncePerRowMs":26.44,"ladderTotal":5.1},{"n":6000,"numberAtATimeMs":1216.81,"freshRowConvertEachMs":463.13,"convertOncePerRowMs":234.33,"ladderTotal":5.2}],"conversionsAt6000":{"convertEach":18003000,"convertOnce":6000,"ratio":3000,"distinctValues":6000},"bufferReuse":{"gain":"1.05x to 1.13x","reading":"after hoisting the conversions, the remaining time is the characters themselves"},"pattern3Contrast":{"ladderTotal":{"pattern3":"300x","pattern4":"5.2x"},"conversionStepAlone":{"pattern3":"2.0x","pattern4":"2.0x"},"nestingStep":{"pattern3":"57x","pattern4":"unavailable"},"why":"nesting let Pattern 3 skip the per-item appends as well as the conversions"}}
```

<!-- @highlights -->
- The accent wire runs from the outer counter into every cell of the row, while the inner counter box is drawn hollow and greyed.
- The inner counter is labelled counts only, because it never reaches the content.
- A toggle swaps which counter feeds the cells, redrawing the grid as 1 / 1 2 / 1 2 3 / 1 2 3 4 and labelling it Pattern 3.
- A second control, labelled extend the previous row, produces that same Pattern 3 grid from a completely different mechanism.
- Both paths converge on one output, which is the thing the drawing should make unmissable.
- A nesting strip overlays row i on the start of row i + 1 for every adjacent pair and marks match or no match.
- Its counter reads 0 matches and 19,900 mismatches over n = 1..200, with Pattern 3's strip alongside where every pair matches.
- The four-light check panel carries over: total count, per-line count, line length, tokens.
- Stepping n = 1, 2 and 10, the counting lights stay green for both value bugs throughout.
- The line-length light flips red only at n = 10, and the token light is red from n = 2.
- A character ruler under row 10 shows 29 here against 20 in Pattern 3.
- Ten two-character tokens are laid out on that ruler to show where the extra width comes from.
- Three build lanes at n = 6,000 emit a conversion badge whenever a number is formatted.
- Conversion counters read 18,003,000, 18,003,000 and 6,000 across the three lanes.
- Time bars read 1216.81ms, 463.13ms and 234.33ms.
- A ghosted fourth bar shows where Pattern 3's fourth step reached, struck through and labelled rows do not nest.

<!-- @edgeCases -->
- n equal to zero — no output, and the outer loop never runs.
- n equal to one — a single 1, and the size at which printing the column instead of the row is indistinguishable from correct.
- n equal to two — the smallest input that separates this pattern from Pattern 3, and the first size at which the row-extending trick fails.
- n equal to ten — the smallest input at which any length-based check can see a value bug, since 10 is the first two-character number.
- Negative n — no output, since the loop does not run.
- Very large n — the characters grow faster than the items once the numbers widen; at n = 1,000 there are 500,500 items but 1,997,005 characters.
- Rows counted from zero — the value must then be written as i + 1, and forgetting the shift gives 0 / 1 1 / 2 2 2.
- A trailing space after the last number on a line — visually identical, rejected by a strict comparison on 40 of 41 sizes from 0 to 40.
- A caller expecting the row to count upward — that is Pattern 3, which this pattern's two commonest bugs both produce.
- Very wide numbers with an aligned layout — this pattern's rows have uneven widths by construction, so any column alignment has to be added deliberately.

<!-- @pitfalls -->
- Printing j where you meant i. The output is Pattern 3 — a well-formed triangle, wrong on 39 of 41 sizes, and correct at n = 1.
- Carrying the row-extending trick over from Patterns 2 and 3. It is not slower here, it is wrong: the rows do not nest, and it produces Pattern 3's output, first failing at n = 2.
- Assuming an optimisation stays valid because the code still compiles. Its precondition was about the shape of the output, and nothing in the code records it.
- Trusting a count. Both the swap and the stale trick print exactly the right number of items on exactly the right number of lines, so neither count catches either at any size tested.
- Relying on line lengths below n = 10. Rows 1 to 9 measure 1, 3, 5 up to 17 in this pattern and in Pattern 3 alike.
- Leaving the conversion inside the inner loop. It converts the same value i times — 18,003,000 conversions of 6,000 distinct numbers at n = 6,000, worth 2.0x to hoist.
- Expecting the hoist to be worth what Pattern 3's fast version was. That was 300x end to end; this ladder is 5.2x, and the difference is the cross-row reuse this shape does not permit.
- Printing the separator after each number rather than between them. It differs from the expected output on 40 of 41 sizes under exact comparison.
- Mixing zero-based rows with an unshifted value, giving 0 / 1 1 / 2 2 2 rather than 1 / 2 2 / 3 3 3.
- Reaching for a buffer-reuse micro-optimisation first. Measured at 1.05x to 1.13x, against 2.0x for hoisting the conversion.

<!-- @doubt -->
### Why does the trick from Pattern 3 stop working here?

<!-- @answer -->
Because it depended on the rows nesting, and they no longer do. In Patterns 2 and 3 row i began with the whole of row i minus one, so a single string could be carried forward and extended. Here row 2 is 2 2 and row 3 is 3 3 3 — measured across n from 1 to 200 there are 0 nesting pairs and 19,900 non-nesting ones. Extending the row appends 1, then 2, then 3, which is Pattern 3's output, verified byte-identical to an independent Pattern 3 implementation for every n from 0 to 300. So it is not a slower version, it is a wrong one, first failing at n = 2.

<!-- @doubt -->
### Two different bugs give the same output here. How do I tell them apart?

<!-- @answer -->
You cannot, from the output — which is why this is worth naming. Printing the inner counter instead of the outer one, and carrying over the row-extending optimisation, both produce Pattern 3's triangle exactly. They are wrong on the same 39 of 41 sizes and correct at the same n = 0 and n = 1. The same thing happened in Pattern 2, where two off-by-one conventions produced identical output. The habit that follows is the same: read the code rather than the symptom. Check first whether a single string is being carried across rows, and then which counter the body prints.

<!-- @doubt -->
### Is the token check really necessary if I already compare line lengths?

<!-- @answer -->
Yes, and the gap is measurable. Line lengths are determined by the item count alone while every value is one character wide, so for rows 1 to 9 this pattern, Pattern 3 and the 0-based version all measure 1, 3, 5 up to 17. The lengths first separate at row 10, where this pattern's row is 29 characters against Pattern 3's 20. So a length check needs n of at least 10 before it can see a value bug at all, while comparing the tokens on line i against i repeated catches the swap at n = 2 and the 0-based bug at n = 1.

<!-- @doubt -->
### Why is the inner loop variable never used?

<!-- @answer -->
Because this pattern's content depends only on which row you are on. The inner loop exists to repeat something i times, exactly as in Patterns 1 and 2, and the thing it repeats is fixed for the whole row — every token on a line is identical, checked at n = 4 and n = 12 with no exceptions. That has a practical consequence: the number can be converted to text once before the inner loop rather than at every position, which is the fastest version here. It is also a reason to name the variable `_` in Python, since a name you never read is a name you can accidentally print.

<!-- @doubt -->
### Hoisting the conversion saves 3,000 times the work. Why only 2x?

<!-- @answer -->
Because conversion was never the whole cost. It is about half of it — Pattern 3 measured that split directly, and this pattern reproduces it: 463.13ms down to 234.33ms at n = 6,000. The other half is assembling the row character by character, and that work cannot be avoided here, because nothing from the previous row can be reused. Pattern 3 removed both halves by extending the previous row, which is why its ladder was worth 300x end to end and this one is worth 5.2x. A count of operations avoided is not a speedup until you know what share of the time those operations were.

<!-- @doubt -->
### Should I reuse one buffer across the rows instead of allocating each row?

<!-- @answer -->
You can, and it is measurable, but it is the last thing to reach for. Clearing and reusing a single reserved string across all the rows instead of constructing a fresh one per row is worth 1.05x to 1.13x, against 2.0x for hoisting the conversion out of the inner loop and 2.6x for not printing number by number. That ordering is the useful part: once the conversions are hoisted, what remains is writing the characters, and the characters are the output. There is no version of this pattern that writes fewer than n(n+1)/2 numbers.

<!-- @doubt -->
### How do I write the loops with rows counted from zero?

<!-- @answer -->
Shift the value as well as the bound. With i running from 0 to n - 1, the inner bound becomes j <= i so row i still gets i + 1 items, and the printed value must be i + 1 rather than i. Forgetting the shift gives 0 / 1 1 / 2 2 2, which is wrong on 40 of the 41 sizes from 0 to 40 and which no counting check catches. As with Pattern 3, counting rows from one avoids the shift entirely, and for number patterns that is the convention worth defaulting to.
