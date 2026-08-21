---
id: pattern-13-increasing-number-triangle
topic: Pattern Printing
title: Pattern 13 - Increasing Number Triangle
difficulty: Easy
status: ready
prerequisites:
  - pattern-3-right-angled-number-triangle
  - pattern-6-inverted-right-angled-number-triangle
  - integer-overflow-and-precision-errors
  - nested-loops
relatedIds:
  - pattern-3-right-angled-number-triangle
  - pattern-12-number-crown-pattern
  - pattern-14-increasing-letter-triangle
  - integer-overflow-and-precision-errors
  - nested-loops
---

<!-- @summary -->
Print a triangle of consecutive numbers running across the rows — the first pattern where nothing repeats, so the buffer trick that was worth 113x in Pattern 3 is worth nothing here, and where the closed form for a row's first number overflows a 32-bit int at row 46,342 while the value it computes is only half of INT_MAX.

<!-- @theory -->
## The problem

Print n rows where row i holds i consecutive numbers, continuing from where the
previous row stopped.

```
n = 5      1
           2 3
           4 5 6
           7 8 9 10
           11 12 13 14 15
```

## The rows only look dependent

This is the first pattern here that reads as if each row needs the one before it —
you have to know where the last row stopped. It does not. Row i starts at

```
i(i - 1)/2 + 1
```

verified for every row of every n from 1 to 200. Row 1 starts at 1, row 4 at 7,
row 100 at 4,951. The last number printed is n(n+1)/2 — 10 at n = 4, 5,050 at
n = 100.

That matters for the same reason it mattered in Patterns 8 and 9: a row computed
from i alone can be produced in any order, printed on its own, or generated in
parallel. A running counter forces you to replay everything before it.

## The closed form breaks long before the numbers do

And it breaks in a way worth knowing, because it is not where you would guess.
With 32-bit ints:

| | |
|---|---|
| The **value** n(n+1)/2 first exceeds INT_MAX | at **n = 65,536** |
| The **product** i(i - 1) in the row-start formula first exceeds it | at **i = 46,342** |

So the expression overflows **1.41x earlier than the answer requires**. At
i = 46,342:

```
correct first number     1073767312       50.0% of INT_MAX — comfortably representable
i * (i - 1) / 2 + 1     -1073716336       computed in int
```

That leaves a window of **19,194 rows** — 46,342 through 65,535 — whose values fit
in an int perfectly well and which the natural expression gets wrong anyway. The
intermediate product is the problem, not the result.

Two fixes, both verified at i = 46,342 and i = 65,535:

- widen before multiplying — `(long long)i * (i - 1) / 2 + 1`
- divide before multiplying — one of i and i - 1 is even, so halve that one first

Python is exempt: its integers do not overflow, so the same expression is safe at
any n. C++ and Java are not.

## What the checks catch

Measured against the correct output for every n from 1 to 40:

| Mistake | Wrong on | Item count | Last number | Line lengths | Exact |
|---|---|---|---|---|---|
| Counter reset each row (= Pattern 3) | 39/41 | **never** | n = 2 | n = 4 | n = 2 |
| Counter starts at 0 | 40/41 | **never** | n = 1 | n = 4 | n = 1 |
| Counter advanced by i + 1 | 39/41 | **never** | n = 2 | n = 4 | n = 2 |

The item count never catches anything — every one of these prints n(n+1)/2 numbers
in rows of 1, 2, 3 and so on. The cheap check that does work is a single value:
**the last number must be n(n+1)/2**, which catches all three at n = 1 or n = 2.

The line-length column is worth a second look. Patterns 3, 6 and 11 all found a
boundary where length checks gain power once values need two characters. Here that
boundary is **n = 4**, not n = 10 — because row 4 ends at 10, and the values are
the running total rather than the column index. That is the rule Pattern 11 stated
as a condition rather than a threshold, confirmed by a case where the threshold
moves.

## Nothing repeats, so nothing can be reused

Every pattern from 3 onward has had a buffer version, and each one was worth
something different:

| Pattern | What repeated | Buffer step |
|---|---|---|
| 3 | the numbers 1..i, on every row | 113x |
| 6 | the same, reversed | 75x to 105x |
| 11 | two digits, forever | 35x to 73x |
| 12 | the gap, and both digit runs | 41x to 64x |
| **13** | **nothing** | **1.03x to 1.07x** |

Here every number appears exactly once in the whole output. There are n(n+1)/2
distinct values and n(n+1)/2 conversions, and no arrangement of the code can make
that fewer. The only "buffer" available is the entire output:

| n | One reserved row | The whole output |
|---|---|---|
| 1,000 | 16,000 characters | 3,392,395 |
| 6,000 | 96,000 | 150,915,897 |
| 12,000 | **192,000** | **636,942,897** |

Measured, holding all of it is worth **0.99x to 1.01x** — nothing — for about
3,300 times the memory at n = 12,000.

| n | Number at a time | Fresh row | One reused row buffer | Whole output |
|---|---|---|---|---|
| 500 | 8.63ms | 3.76ms | 3.50ms | 3.48ms |
| 1,500 | 79.13ms | 34.05ms | 32.89ms | 33.04ms |
| 3,000 | 322.54ms | 138.76ms | 135.15ms | 136.56ms |

So the whole ladder is the one step everything in this topic has shared — stop
writing one item at a time, worth **2.3x** here — and then it stops. Python is the
same: 4.2x to 4.3x for that step, and exactly 1.00x for the closed form against a
running counter.

There is a pretty observation that does not help: the entire output is the string
`1 2 3 ... N` with n - 1 of its spaces turned into newlines, verified for every n
from 1 to 200. It is true, and it describes the whole output rather than anything
smaller, which is the point.

<!-- @intuition -->
Two things here are the reverse of what they look like. The rows look dependent and are not — the running counter is a way of writing the pattern, not a property of it, and the closed form is right there in the triangular numbers. And the closed form looks safer than the counter, because it avoids accumulating state, when in fixed-width arithmetic it is the more fragile of the two: it multiplies two numbers each about the size of the answer's square root, so it overflows at the square root of where the answer does. The wider lesson about the buffer trick is that it was never about strings. It was about repetition, and this pattern has none — every number is printed once and never again — so the technique that carried the last ten patterns simply has nothing to hold on to.

<!-- @approach -->
### Number at a Time

<!-- @idea -->
Keep a running counter and print each number as it comes, advancing the counter by the row's length.

<!-- @steps -->
1. Start a counter at one, before the loop over the rows.
2. Loop over the rows from one up to and including n.
3. Print i consecutive numbers starting from the counter, separated by spaces.
4. Advance the counter by i.
5. Print a newline after each row.

<!-- @complexity -->
- time: O(n^2) numbers printed, with one stream operation per number and per separator
- space: O(1)
- note: The direct translation, and the version most people write first. Measured 322.54ms at n = 3,000 against 138.76ms for building each row — 2.3x, consistent across every size tested, and the only meaningful speed step this pattern has.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    long long v = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 0; j < i; j++) {
            if (j) cout << ' ';
            cout << v + j;
        }
        v += i;
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 5: A 64-bit counter. It reaches n(n+1)/2, which passes INT_MAX at n = 65,536.
- 11: Advancing by i, not by i + 1. Advancing by i + 1 skips a number per row and no counting check notices.

<!-- @code java -->
```java
static void pattern(int n) {
    long v = 1;
    for (int i = 1; i <= n; i++) {
        for (int j = 0; j < i; j++) {
            if (j > 0) System.out.print(' ');
            System.out.print(v + j);
        }
        v += i;
        System.out.println();
    }
}
```

<!-- @annotations -->
- 2: long rather than int, since the counter ends at n(n+1)/2.
- 8: The counter carries across rows, which is what makes this version's rows dependent on each other.

<!-- @code python -->
```python
def pattern(n):
    v = 1
    for i in range(1, n + 1):
        for j in range(i):
            if j > 0:
                print(" ", end="")
            print(v + j, end="")
        v += i
        print()


# v must be declared outside the outer loop. Resetting it per row
# gives Pattern 3, which prints the same count of numbers.
```

<!-- @annotations -->
- 2: Outside the loop. Moving it inside resets the counter each row and produces Pattern 3's triangle.
- 8: Advance by exactly i — the number of items this row consumed.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Assemble each row into a string and print it in one operation, still carrying the counter.

<!-- @steps -->
1. Start a counter at one.
2. Loop over the rows.
3. Build the row from i consecutive numbers, separated by spaces.
4. Print it followed by a newline.
5. Advance the counter by i.

<!-- @complexity -->
- time: O(n^2) characters, n(n+1)/2 integer-to-text conversions, n stream operations
- space: O(n) for the longest row
- note: Measured 138.76ms at n = 3,000, worth 2.3x. The conversions cannot be reduced — there are n(n+1)/2 distinct values and each is printed once — so this is essentially where this pattern's optimisation ends. Reusing one row buffer instead of allocating per row adds only 1.03x to 1.07x.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    long long v = 1;
    for (int i = 1; i <= n; i++) {
        string row;
        for (int j = 0; j < i; j++) {
            if (j) row += ' ';
            row += to_string(v + j);
        }
        v += i;
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 11: Every value here is distinct and appears exactly once in the whole output, so these conversions cannot be cached or reused.
- 14: One stream operation per row instead of one per number, which is the entire gain.

<!-- @code java -->
```java
static void pattern(int n) {
    long v = 1;
    for (int i = 1; i <= n; i++) {
        StringBuilder row = new StringBuilder();
        for (int j = 0; j < i; j++) {
            if (j > 0) row.append(' ');
            row.append(v + j);
        }
        v += i;
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 4: A fresh builder per row. Hoisting it out and clearing it is worth 1.03x to 1.07x here, against 2.3x for this approach itself.

<!-- @code python -->
```python
def pattern(n):
    v = 1
    for i in range(1, n + 1):
        print(" ".join(str(v + j) for j in range(i)))
        v += i


# Measured 4.2x to 4.3x faster than printing number by number, and
# that is the whole optimisation available here.
```

<!-- @annotations -->
- 4: join places separators between the numbers, so no trailing space can appear.

<!-- @approach -->
### Compute Each Row's Start Directly

<!-- @idea -->
Replace the running counter with the closed form for a row's first number, so the rows become independent.

<!-- @steps -->
1. Loop over the rows from one up to and including n.
2. Compute this row's first number as i times i minus one, over two, plus one.
3. Widen the multiplication, or halve the even factor first, before it can overflow.
4. Build the row from i consecutive numbers starting there.
5. Print it followed by a newline.

<!-- @complexity -->
- time: O(n^2) characters, n(n+1)/2 conversions, n stream operations
- space: O(n), or O(1) extra if one row buffer is reused across rows
- note: Not faster — 1.03x to 1.07x over the previous approach in C++, and exactly 1.00x in Python. It is worth writing for two other reasons: rows become independent of each other, so any row can be produced on its own, and it puts the overflow where you can see and fix it rather than hidden in an accumulating counter.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    string row;
    row.reserve(16 * (size_t)n);
    for (int i = 1; i <= n; i++) {
        long long start = (long long)i * (i - 1) / 2 + 1;
        row.clear();
        for (int j = 0; j < i; j++) {
            if (j) row += ' ';
            row += to_string(start + j);
        }
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 6: One buffer for every row, cleared rather than reallocated. Worth 1.03x to 1.07x, which is the whole of what remains here.
- 9: The cast is the fix. Without it, i * (i - 1) overflows a 32-bit int from i = 46,342, where the correct answer is only half of INT_MAX.
- 10: clear keeps the reserved capacity, so no row after the first reallocates.

<!-- @code java -->
```java
static void pattern(int n) {
    StringBuilder row = new StringBuilder();
    for (int i = 1; i <= n; i++) {
        long start = (long) i * (i - 1) / 2 + 1;
        row.setLength(0);
        for (int j = 0; j < i; j++) {
            if (j > 0) row.append(' ');
            row.append(start + j);
        }
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 4: Casting i before the multiply, not the result afterwards. Casting the result is too late — the product has already wrapped.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        start = i * (i - 1) // 2 + 1
        print(" ".join(str(start + j) for j in range(i)))


# No widening needed: Python integers do not overflow, so this
# expression is safe at any n. In C++ and Java it is not.
```

<!-- @annotations -->
- 3: The closed form. Each row now depends only on i, so rows can be produced in any order or on their own.

<!-- @example -->

<!-- @input -->
n = 5

<!-- @output -->
Five rows counting 1 through 15 — fifteen numbers, ending at n(n+1)/2

<!-- @why -->
Five rather than four, because row 4 is where the first two-digit value appears and the line-length check starts working.

<!-- @walkthrough -->
1. Row 1 holds one number and starts at 1.
2. Row 2 holds two numbers and starts at 2, which is 2 times 1 over 2, plus 1.
3. Row 3 starts at 4, row 4 at 7, row 5 at 11 — each is i times i minus one, over two, plus one.
4. Row 4 ends at 10, which is the first value needing two characters.
5. So from n = 4 the line lengths stop being fixed by the item count, and a length check gains power.
6. The last number is 15, which is n times n plus one over two.
7. The item total is also 15, since every number is printed exactly once.

<!-- @example -->

<!-- @input -->
Row 46,342's first number, computed in 32-bit arithmetic

<!-- @output -->
-1073716336, where the correct answer is 1073767312

<!-- @why -->
The expression fails while the value it computes is only half of INT_MAX, which is not where anyone looks for an overflow.

<!-- @walkthrough -->
1. Row i's first number is i times i minus one, over two, plus one.
2. That value first exceeds INT_MAX at n = 65,536, where it reaches 2,147,516,416.
3. But the intermediate product i times i minus one exceeds INT_MAX much earlier, at i = 46,342.
4. At that row the correct first number is 1,073,767,312, which is 50.0 percent of INT_MAX and perfectly representable.
5. Computed in int, the same expression gives -1,073,716,336.
6. That leaves 19,194 rows — 46,342 through 65,535 — whose values fit but whose formula does not.
7. Widening before the multiply, or halving the even factor first, fixes it; both were checked at i = 46,342 and i = 65,535.

<!-- @example -->

<!-- @input -->
Three counter mistakes, checked four ways

<!-- @output -->
The item count catches none of them; the last number catches all three

<!-- @why -->
Continues this topic's ladder of checks, and identifies the single cheapest assertion for this shape.

<!-- @walkthrough -->
1. Resetting the counter each row gives Pattern 3 — 1, then 1 2, then 1 2 3.
2. Starting the counter at 0 shifts every value down by one.
3. Advancing by i plus one skips a number between rows.
4. All three print exactly n(n+1)/2 numbers in rows of 1, 2, 3 and so on, so the item count never notices at any size.
5. Line lengths catch all three, but only from n = 4, where the value 10 first appears.
6. Checking that the last number equals n(n+1)/2 catches the zero-start bug at n = 1 and the other two at n = 2.
7. That single value is the cheapest useful assertion here, and it is specific rather than a summary.

<!-- @example -->

<!-- @input -->
n = 12,000, holding the whole output instead of one row

<!-- @output -->
636,942,897 characters instead of 192,000, for no speed at all

<!-- @why -->
Closes the buffer thread that has run since Pattern 3, by measuring the one case where it has nothing to work with.

<!-- @walkthrough -->
1. In Patterns 3, 6, 11 and 12 a buffer removed repeated work and was worth between 35 and 113 times.
2. Each of those had something that repeated: the numbers 1 through i, two digits, or a run of spaces.
3. Here every number appears exactly once, so there are n(n+1)/2 distinct values and n(n+1)/2 conversions, and no code arrangement reduces that.
4. Reusing one row buffer instead of allocating per row measured 1.03x to 1.07x.
5. Buffering the entire output measured 0.99x to 1.01x — nothing.
6. At n = 12,000 that costs 636,942,897 characters against 192,000 for one reserved row, about 3,300 times the memory.
7. It is true that the whole output is 1 2 3 up to N with n minus one spaces turned into newlines, but that describes the output rather than anything smaller.

<!-- @visualization custom -->

<!-- @description -->
Fill the grid with a single counter ribbon threading through it — one continuous line of numbers that wraps at the end of each row rather than restarting — so the reader sees the triangle as one sequence broken into rows rather than as rows that happen to hold numbers. Beside each row put its start value with the arithmetic i(i-1)/2 + 1 evaluating in place, and draw a switch that cuts the ribbon: with the switch off the counter carries across rows, with it on each row computes its own start and the ribbon is replaced by n independent segments that can be lit in any order. Show one row being produced alone with the others dark, since that independence is the reason the closed form exists. Then the overflow panel, which is this pattern's centre. Draw a 32-bit register as a fixed-width bar with INT_MAX marked, and plot two traces against i: the answer i(i-1)/2, and the intermediate product i(i-1). The product crosses the ceiling at i = 46,342 while the answer is sitting at the halfway mark — hold that frame, and show the register wrapping to a negative value while the correct answer's marker stays comfortably below the line. Shade the rows from 46,342 to 65,535 as a band labelled representable, computed wrongly, and show the two fixes widening or halving so the product trace drops back under the ceiling. Close with the buffer retrospective: five bars labelled Patterns 3, 6, 11, 12 and 13 reading 113x, 75-105x, 35-73x, 41-64x and 1.03-1.07x, each annotated with what repeated in that pattern, and the last one annotated nothing. Beneath it, two memory meters at n = 12,000 reading 192,000 and 636,942,897 with a time bar showing they run at the same speed.

<!-- @sampleInput -->
```json
{"primary":{"n":5,"output":"1\n2 3\n4 5 6\n7 8 9 10\n11 12 13 14 15\n","rows":5,"itemsPerRow":[1,2,3,4,5],"items":15,"rowStarts":[1,2,4,7,11],"lastNumber":15,"lastNumberFormula":"n(n+1)/2","startFormula":"i(i-1)/2 + 1"},"closedForm":{"claim":"row i starts at i(i-1)/2 + 1","verified":"every row, n = 1..200","consequence":"the rows are independent, so any row can be produced on its own or out of order","examples":[{"i":1,"start":1},{"i":4,"start":7},{"i":10,"start":46},{"i":100,"start":4951}]},"overflow":{"intMax":2147483647,"valueExceedsAt":{"n":65536,"value":2147516416},"productExceedsAt":{"expression":"i * (i - 1)","i":46342},"lastNumberProductExceedsAt":{"expression":"i * (i + 1)","i":46341},"atRow46342":{"correct":1073767312,"asInt32":-1073716336,"percentOfIntMax":50.0},"windowOfRows":{"from":46342,"to":65535,"count":19194,"description":"representable in int, computed wrongly by the natural expression"},"earlierByFactor":1.41,"fixes":["widen before multiplying: (long long)i * (i - 1) / 2 + 1","divide before multiplying: one of i and i-1 is even, halve that one first"],"fixesVerifiedAt":[46342,65535],"python":"integers do not overflow, so the same expression is safe at any n"},"bugPanel":{"variants":[{"name":"counter reset each row (= Pattern 3)","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"counter starts at 0","wrongOn":"40 of 41","correctAt":[0]},{"name":"counter advanced by i + 1","wrongOn":"39 of 41","correctAt":[0,1]}]},"checkPanel":{"columns":["item count","last number","line lengths","exact"],"smallestNThatCatches":{"counter reset each row":["never",2,4,2],"counter starts at 0":["never",1,4,1],"counter advanced by i+1":["never",2,4,2]},"cheapestAssertion":{"text":"the last number must equal n(n+1)/2","catchesAllThreeBy":2},"wideningBoundary":{"here":4,"why":"row 4 ends at 10, and the values are the running total rather than the column index","patterns3And6And11":10,"rule":"the boundary is where values widen, not the number ten"}},"assertions":["row i holds exactly i numbers","row i starts at i(i-1)/2 + 1","the numbers are consecutive across the whole output","the last number equals n(n+1)/2","no line begins or ends with a space"],"noRepetition":{"claim":"every number appears exactly once in the whole output","distinctValues":"n(n+1)/2","conversions":"n(n+1)/2","consequence":"no buffer can reduce the work","bufferRetrospective":[{"pattern":3,"whatRepeated":"the numbers 1..i, on every row","bufferStep":"113x"},{"pattern":6,"whatRepeated":"the same, reversed","bufferStep":"75x to 105x"},{"pattern":11,"whatRepeated":"two digits, forever","bufferStep":"35x to 73x"},{"pattern":12,"whatRepeated":"the gap, and both digit runs","bufferStep":"41x to 64x"},{"pattern":13,"whatRepeated":"nothing","bufferStep":"1.03x to 1.07x"}],"prettyButUseless":"the whole output is 1 2 3 ... N with n-1 spaces turned into newlines, verified n = 1..200 — but that describes the whole output, not anything smaller"},"buildPanel":[{"n":500,"numberAtATimeMs":8.63,"freshRowMs":3.76,"reusedRowBufferMs":3.50,"wholeOutputMs":3.48},{"n":1500,"numberAtATimeMs":79.13,"freshRowMs":34.05,"reusedRowBufferMs":32.89,"wholeOutputMs":33.04},{"n":3000,"numberAtATimeMs":322.54,"freshRowMs":138.76,"reusedRowBufferMs":135.15,"wholeOutputMs":136.56}],"memory":[{"n":1000,"oneReservedRow":16000,"wholeOutput":3392395},{"n":6000,"oneReservedRow":96000,"wholeOutput":150915897},{"n":12000,"oneReservedRow":192000,"wholeOutput":636942897,"ratio":"about 3,300x"}],"ratios":{"perItemToFreshRow":"2.3x at every size tested","freshRowToReusedBuffer":"1.03x to 1.07x","wholeOutputToReusedBuffer":"0.99x to 1.01x, no gain"},"python":{"perItemToJoin":"4.2x to 4.3x","counterToClosedForm":"1.00x"}}
```

<!-- @highlights -->
- A single counter ribbon threads through the grid, wrapping at the end of each row rather than restarting.
- The triangle reads as one sequence broken into rows, not as rows that happen to hold numbers.
- Each row's start value sits beside it with i(i-1)/2 + 1 evaluating in place.
- A switch cuts the ribbon: off, the counter carries across rows; on, each row computes its own start.
- With the switch on, the ribbon becomes n independent segments that can be lit in any order.
- One row is produced alone with the others dark, showing why the closed form exists.
- The overflow panel draws a 32-bit register as a fixed-width bar with INT_MAX marked.
- Two traces plot against i: the answer i(i-1)/2, and the intermediate product i(i-1).
- The product crosses the ceiling at i = 46,342 while the answer sits at the halfway mark — hold that frame.
- The register wraps to a negative value while the correct answer's marker stays below the line.
- Rows 46,342 to 65,535 are shaded as a band labelled representable, computed wrongly.
- Both fixes are shown widening or halving, dropping the product trace back under the ceiling.
- The buffer retrospective closes the figure: five bars for Patterns 3, 6, 11, 12 and 13.
- They read 113x, 75-105x, 35-73x, 41-64x and 1.03-1.07x, each annotated with what repeated.
- The last bar is annotated nothing.
- Two memory meters at n = 12,000 read 192,000 and 636,942,897, with a time bar showing equal speed.

<!-- @edgeCases -->
- n equal to zero — no output, and the loop never runs.
- n equal to one — a single 1, where two of the three counter mistakes still pass.
- n equal to two — the smallest input that catches a reset counter or a skipping counter.
- n equal to four — where the value 10 first appears, so line lengths stop being fixed by the item count.
- Negative n — no output, since the loop does not run.
- n around 46,342 — where the natural closed form overflows a 32-bit int while the values still fit.
- n around 65,536 — where the values themselves pass INT_MAX and a 64-bit counter becomes necessary.
- Very large n — n(n+1)/2 numbers and hundreds of millions of characters; a whole-output buffer is not viable.
- A caller expecting each row to restart at 1 — that is Pattern 3, and it prints the same count of numbers.
- A caller expecting letters rather than digits — that is Pattern 14, where the values wrap rather than grow.

<!-- @pitfalls -->
- Writing i * (i - 1) / 2 in int. It overflows from i = 46,342, where the correct answer is only half of INT_MAX, and gets 19,194 otherwise-valid rows wrong.
- Casting the result rather than the operand. (long long)(i * (i - 1) / 2) is too late — the product has already wrapped.
- Keeping the running counter in an int. It reaches n(n+1)/2, which passes INT_MAX at n = 65,536.
- Checking the item count. All three counter mistakes print exactly n(n+1)/2 numbers, so it never catches any of them.
- Testing only at n = 1 or n = 2. A reset counter and a skipping counter both pass at n = 1.
- Relying on line lengths below n = 4. Every value is one character until row 4 ends at 10.
- Resetting the counter inside the outer loop. That gives Pattern 3, which looks like a perfectly good triangle.
- Advancing the counter by i + 1. One number is skipped between rows, and no summary check notices.
- Reaching for a buffer. Nothing repeats here, so it is worth 1.03x to 1.07x, against 35x to 113x in Patterns 3, 6, 11 and 12.
- Buffering the whole output because it is one clean string. It measured 0.99x to 1.01x while holding 636,942,897 characters at n = 12,000.

<!-- @doubt -->
### Do I need a running counter, or can each row stand alone?

<!-- @answer -->
Each row stands alone. Row i starts at i(i - 1)/2 + 1 — verified for every row of every n from 1 to 200 — so nothing has to be carried across rows. That is not a speed argument: measured, the closed form is 1.03x to 1.07x in C++ and exactly 1.00x in Python. It is a structure argument. With the closed form you can print row 500 without producing the first 499, generate rows out of order, or split the work; with a running counter you cannot. It also puts the arithmetic somewhere you can inspect, which matters because of the overflow below.

<!-- @doubt -->
### Why does i * (i - 1) / 2 overflow so early?

<!-- @answer -->
Because the intermediate product is roughly the square of the answer's square root — it is about twice the value you actually want, and it exists before the division brings it back down. With 32-bit ints the product first exceeds INT_MAX at i = 46,342, where the correct first number is 1,073,767,312 — exactly 50.0 percent of INT_MAX and perfectly representable. Computed in int it comes out as -1,073,716,336. The values themselves do not exceed INT_MAX until n = 65,536, so there are 19,194 rows that are representable and computed wrongly, and the expression fails 1.41x earlier than it needs to.

<!-- @doubt -->
### What is the right fix for that overflow?

<!-- @answer -->
Either widen the operand before multiplying — `(long long)i * (i - 1) / 2 + 1` — or divide before multiplying, since one of i and i - 1 is always even, so halving that one first keeps every intermediate small. Both were checked at i = 46,342 and i = 65,535 and give the correct value. What does not work is casting the result: `(long long)(i * (i - 1) / 2)` widens a number that has already wrapped. Python needs neither fix, since its integers grow as needed — which is worth knowing precisely so you do not carry the Python habit into C++ or Java.

<!-- @doubt -->
### Why does no count catch a reset counter?

<!-- @answer -->
Because resetting it gives Pattern 3, which has exactly the same shape: n rows holding 1, 2, 3 up to n items, for n(n+1)/2 in total. Only the values differ. The same is true of starting at 0 and of advancing by i + 1 — all three print the right number of numbers in the right places. Measured over n from 1 to 40, the item count never catches any of them. The cheap assertion that does is a single value: the last number must be n(n+1)/2, which catches the zero-start at n = 1 and the other two at n = 2.

<!-- @doubt -->
### Patterns 3, 6, 11 and 12 all had a big buffer win. Where is it here?

<!-- @answer -->
There is not one, and the reason is exact. Those patterns each had something that repeated — the numbers 1 through i on every row, two binary digits forever, a run of spaces — so a buffer could hold it once. Here every number in the output appears exactly once: n(n+1)/2 distinct values and n(n+1)/2 conversions, which no arrangement of the code reduces. Reusing one row buffer is worth 1.03x to 1.07x. Buffering the entire output is worth 0.99x to 1.01x — nothing — while holding 636,942,897 characters at n = 12,000 against 192,000. The technique needed repetition, not strings.

<!-- @doubt -->
### The whole output is just 1 2 3 ... N with newlines. Can I use that?

<!-- @answer -->
It is true — verified for every n from 1 to 200, the output is the flat sequence with n - 1 of its spaces replaced by newlines — and it does not help. The observation describes the entire output, so acting on it means materialising the entire output, which is exactly the Θ(n²) buffer measured above at no speed gain. It is worth knowing as a description of the shape, and as a reminder that "this is one simple string" and "this can be produced cheaply" are different claims.

<!-- @doubt -->
### Earlier patterns said length checks gain power at n = 10. Why n = 4 here?

<!-- @answer -->
Because the boundary is wherever the values first need two characters, and here the values are the running total rather than the column index. Row 4 ends at 10, so from n = 4 the line lengths stop being determined by the item count alone and a length check starts distinguishing outputs. Pattern 11 stated this as a condition rather than a threshold — binary digits never widen, so its version of the rule never breaks — and this is the case that confirms the threshold moves. If a pattern's values grew faster still, the boundary would arrive sooner again.
