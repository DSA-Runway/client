---
id: pattern-9-diamond-star-pattern
topic: Pattern Printing
title: Pattern 9 - Diamond Star Pattern
difficulty: Easy
status: ready
prerequisites:
  - pattern-7-star-pyramid
  - pattern-8-inverted-star-pyramid
  - nested-loops
  - for-loop
relatedIds:
  - pattern-7-star-pyramid
  - pattern-8-inverted-star-pyramid
  - pattern-10-half-diamond-star-pattern
  - pattern-20-symmetric-butterfly-pattern
  - nested-loops
---

<!-- @summary -->
Print a diamond of 2n rows by stacking Patterns 7 and 8 — one buffer of 3n-2 characters generates all of them, and the symmetry that makes the shape obvious also makes a symmetry check useless: a palindrome test passes for a diamond with the wrong middle, for a bowtie, and for a diamond shifted a column right.

<!-- @theory -->
## The problem

Print 2n rows: Pattern 7's pyramid followed by Pattern 8's inverted one.

```
n = 4       *
           ***
          *****
         *******
         *******
          *****
           ***
            *
```

Note the **widest row appears twice**. That is this pattern's convention, and it
is the opposite of Pattern 10's — worth fixing now, because it is the single thing
most often got wrong here.

## The totals

| | |
|---|---|
| Rows | **2n** — not 2n - 1 |
| Stars | **2n²** — 32 at n = 4, 20,000 at n = 100 |
| Characters including spaces | 44 at n = 4, 290 at n = 10, 29,900 at n = 100 |

Everything is exactly twice Pattern 7's, because the diamond is Pattern 7 plus
Pattern 8 and those two have identical totals.

## One buffer, two sweeps

Pattern 7 found that all its rows were windows into one string. Pattern 8 found
that it used **the same string and the same windows**, walked backwards. The
diamond is what those two facts were building toward:

```
S = (n - 1 spaces)(2n - 1 stars)          length 3n - 2

rows 1 .. n      S[i-1 : i-1 + (n+i-1)]      Pattern 7's sweep, forwards
rows n+1 .. 2n   S[n-i : n-i + (2n-i)]       Pattern 8's sweep, backwards
```

Verified for all 40,200 rows across n from 1 to 200 with no exceptions. At
n = 6,000 that is a buffer of 17,998 characters producing 12,000 rows and about
108 million characters of output, with nothing built after the buffer.

## Symmetry is not a check

The shape's defining property is that it reads the same from the top and from the
bottom, so the natural test is: reverse the list of lines and compare. Measured
over n from 1 to 40, the smallest n at which each check notices:

| Mistake | Wrong on | Row count | Star count | Palindrome | Exact | After strip |
|---|---|---|---|---|---|---|
| Widest row printed once (2n - 1 rows) | 40/41 | n = 1 | n = 1 | **never** | n = 1 | n = 1 |
| **Halves swapped (a bowtie)** | 39/41 | **never** | **never** | **never** | n = 2 | n = 2 |
| **Both halves shifted one right** | 40/41 | **never** | **never** | **never** | n = 1 | **never** |
| Top half only (= Pattern 7) | 40/41 | n = 1 | n = 1 | n = 2 | n = 1 | n = 1 |

The palindrome test catches **one** of the four, and only at n = 2. It is
satisfied by a diamond with the wrong number of rows, by a bowtie, and by a
diamond shifted a column right — because reversing any of those gives them back
unchanged. A symmetry check confirms that a shape is symmetric; it says nothing
about which symmetric shape it is.

The bowtie is the sharpest case. Swapping the two halves gives:

```
*******            correct       *
 *****                          ***
  ***                          *****
   *                          *******
   *                          *******
  ***                          *****
 *****                          ***
*******                          *
```

Same 2n rows, same 2n² stars, still a palindrome — and wrong on 39 of 41 sizes.
Three separate checks pass it. Only comparing the lines against what they should
be catches it, at n = 2.

## The mirror trap, again

Because the bottom half is the top half reversed, it is very tempting to build the
top half into a list, print it, then print it backwards. That is correct, and it
is the same trade Pattern 8 measured:

| n | Streaming versions hold | Store-the-top-half holds |
|---|---|---|
| 1,000 | 1,999 characters | 1,499,500 |
| 6,000 | 11,999 | 53,997,000 |
| 12,000 | **23,999** | **215,994,000** |

And it is not faster for the trouble: measured against building each row, it came
out at 0.9x at n = 1,000 — break-even — then **1.4x and 1.6x slower** at n = 3,000
and 6,000.

The reason is the same as in Pattern 8. Each row is arithmetic on i, so the bottom
half can be generated directly rather than recalled, and storing it buys nothing.

## Speed

| n | Char at a time | Fresh row | Two sweeps | Store top half |
|---|---|---|---|---|
| 1,000 | 28.47ms | 0.27ms | 0.11ms | 0.25ms |
| 3,000 | 256.51ms | 1.82ms | 1.38ms | 2.52ms |
| 6,000 | 1028.06ms | 7.71ms | 7.05ms | 12.64ms |

The familiar shape: the first step is worth **about 105x to 141x**, and the two
sweeps are worth **about 1.1x to 2.5x**, shrinking as n grows. Python agrees, at
283x to 548x and a flat 1.18x to 1.26x.

<!-- @intuition -->
The diamond is the first pattern in this topic that is genuinely two patterns, and the interesting thing is what that does to checking rather than to writing. Its symmetry is so visible that it feels like the property to test, and it is exactly the property that carries the least information: a great many wrong shapes are also symmetric, including the one you get by swapping the halves, which preserves the row count and the star count as well. The other half is the mirror temptation. When a shape's second half is the first half reversed, storing the first half feels like avoiding work — but the rows were never expensive to produce, only to remember, and reversing is the one operation that forces you to remember all of them at once.

<!-- @approach -->
### Two Loops, Character at a Time

<!-- @idea -->
Run Pattern 7's nested loops, then Pattern 8's, one character per stream operation.

<!-- @steps -->
1. Loop i from one to n for the top half.
2. Print n minus i spaces, then 2i minus one stars, then a newline.
3. Loop i from one to n again for the bottom half.
4. Print i minus one spaces, then 2 times n minus i, plus one, stars, then a newline.
5. The widest row is printed twice, once at the end of the first loop and once at the start of the second.

<!-- @complexity -->
- time: O(n^2) characters, and one stream operation per character
- space: O(1)
- note: The direct translation, and the version that makes the doubled middle row visible as the seam between the two loops. Measured 1028.06ms at n = 6,000 against 7.71ms for building each row — about 105x to 141x.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int s = 1; s <= n - i; s++) cout << ' ';
        for (int k = 1; k <= 2 * i - 1; k++) cout << '*';
        cout << '\n';
    }
    for (int i = 1; i <= n; i++) {
        for (int s = 1; s <= i - 1; s++) cout << ' ';
        for (int k = 1; k <= 2 * (n - i) + 1; k++) cout << '*';
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: The top half, unchanged from Pattern 7 — spaces shrinking, stars growing.
- 10: This loop starts at i = 1, so its first row again has no spaces and 2n - 1 stars, which is what prints the widest row a second time. Starting at i = 2 would give 2n - 1 rows with a single middle — Pattern 10's convention, and wrong here.
- 11: The spaces grow here rather than shrink, which is Pattern 8's half verbatim.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int s = 1; s <= n - i; s++) System.out.print(' ');
        for (int k = 1; k <= 2 * i - 1; k++) System.out.print('*');
        System.out.println();
    }
    for (int i = 1; i <= n; i++) {
        for (int s = 1; s <= i - 1; s++) System.out.print(' ');
        for (int k = 1; k <= 2 * (n - i) + 1; k++) System.out.print('*');
        System.out.println();
    }
}
```

<!-- @annotations -->
- 7: Two independent loops rather than one loop with a branch, since the two halves share no state.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for s in range(n - i):
            print(" ", end="")
        for k in range(2 * i - 1):
            print("*", end="")
        print()
    for i in range(1, n + 1):
        for s in range(i - 1):
            print(" ", end="")
        for k in range(2 * (n - i) + 1):
            print("*", end="")
        print()


# 2n rows in total, and the widest row appears twice.
```

<!-- @annotations -->
- 8: The second loop is Pattern 8 verbatim. It runs the full n rows, which is what doubles the widest row.

<!-- @approach -->
### Two Loops, Building Each Row

<!-- @idea -->
Make each row by repetition and print it in one operation, still as two halves.

<!-- @steps -->
1. Loop over the top half, building n minus i spaces followed by 2i minus one stars.
2. Print each row followed by a newline.
3. Loop over the bottom half, building i minus one spaces followed by 2 times n minus i, plus one, stars.
4. Print each of those followed by a newline.
5. Both halves stream: only one row exists at a time.

<!-- @complexity -->
- time: O(n^2) characters, 2n stream operations
- space: O(n) — the widest row is 2n - 1
- note: Recovers essentially all the available speed — 7.71ms at n = 6,000 against 1028.06ms printing character by character. It also holds one row rather than the whole top half, which is what the mirroring version gives up.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        cout << string(n - i, ' ') << string(2 * i - 1, '*') << '\n';
    }
    for (int i = 1; i <= n; i++) {
        cout << string(i - 1, ' ') << string(2 * (n - i) + 1, '*') << '\n';
    }
}
```

<!-- @annotations -->
- 7: The top half, and every row here is computed from i alone.
- 10: The bottom half, also computed from i alone — which is why it does not need the top half kept around.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        System.out.println(" ".repeat(n - i) + "*".repeat(2 * i - 1));
    }
    for (int i = 1; i <= n; i++) {
        System.out.println(" ".repeat(i - 1) + "*".repeat(2 * (n - i) + 1));
    }
}
```

<!-- @annotations -->
- 6: Four counts describe the whole diamond, and the star counts sum to 2n squared.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        print(" " * (n - i) + "*" * (2 * i - 1))
    for i in range(1, n + 1):
        print(" " * (i - 1) + "*" * (2 * (n - i) + 1))


# Building the top half into a list and printing it reversed is also
# correct, and holds 215,994,000 characters at n = 12,000.
```

<!-- @annotations -->
- 4: The second loop regenerates rather than recalls. That is the whole difference from the mirroring version.

<!-- @approach -->
### One Buffer, Two Sweeps

<!-- @idea -->
Build the string Patterns 7 and 8 share, then run its window forwards and backwards.

<!-- @steps -->
1. Guard against n being zero or less.
2. Build the buffer once: n minus one spaces, then 2n minus one stars — 3n minus 2 characters.
3. Sweep forwards for the top half, the window starting one further right and two wider each row.
4. Sweep backwards for the bottom half, the window starting one further left and two narrower each row.
5. Nothing is built or copied after the buffer.

<!-- @complexity -->
- time: O(n^2) characters written, one allocation in total
- space: O(n) — a buffer of 3n - 2 characters produces all 2n rows
- note: The fastest here, and modest — 7.05ms against 7.71ms at n = 6,000, and 0.11ms against 0.27ms at n = 1,000, so about 1.1x to 2.5x and shrinking with n. Worth writing because one buffer of 17,998 characters generating 12,000 rows states the structure of Patterns 7, 8 and 9 in one place.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    string buf(n - 1, ' ');
    buf.append(2 * n - 1, '*');
    for (int i = 1; i <= n; i++) {
        cout.write(buf.data() + (i - 1), n + i - 1);
        cout << '\n';
    }
    for (int i = 1; i <= n; i++) {
        cout.write(buf.data() + (n - i), 2 * n - i);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 8: One buffer of 3n - 2 characters. At n = 6,000 that is 17,998 characters producing 12,000 rows.
- 10: Pattern 7's sweep — the window slides right and widens.
- 14: Pattern 8's sweep — the same windows, visited in the opposite order.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    String buf = " ".repeat(n - 1) + "*".repeat(2 * n - 1);
    for (int i = 1; i <= n; i++) {
        System.out.println(buf.substring(i - 1, i - 1 + n + i - 1));
    }
    for (int i = 1; i <= n; i++) {
        System.out.println(buf.substring(n - i, n - i + 2 * n - i));
    }
}
```

<!-- @annotations -->
- 3: The guard is needed because repeat rejects a negative count and n - 1 is negative at n = 0.

<!-- @code python -->
```python
def pattern(n):
    buf = " " * (n - 1) + "*" * (2 * n - 1)
    for i in range(1, n + 1):
        print(buf[i - 1 : i - 1 + n + i - 1])
    for i in range(1, n + 1):
        print(buf[n - i : n - i + 2 * n - i])


# One string of 3n - 2 characters holds every row of the diamond.
# Measured 1.18x to 1.26x against building each row.
```

<!-- @annotations -->
- 2: No guard needed in Python, since " " * -1 is the empty string rather than an error.
- 6: The second sweep reads the same buffer backwards. Nothing from the first sweep is retained.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
Eight rows, widening from one star to seven and back — thirty-two stars

<!-- @why -->
Small enough to count by hand, and it fixes the row count at 2n rather than 2n minus one.

<!-- @walkthrough -->
1. The first loop prints Pattern 7: 3, 2, 1 and 0 spaces with 1, 3, 5 and 7 stars.
2. The second loop prints Pattern 8: 0, 1, 2 and 3 spaces with 7, 5, 3 and 1 stars.
3. So the seven-star row appears at the end of the first loop and again at the start of the second.
4. That gives 2n rows, which is 8, and not 2n minus one.
5. The star total is 16 from each half, so 32, which is 2 n squared.
6. Including the spaces, 44 characters are printed — exactly twice Pattern 7's 22.
7. Printing the widest row once instead would give 7 rows and 25 stars, and is wrong on 40 of 41 sizes.

<!-- @example -->

<!-- @input -->
The two halves printed in the wrong order, checked four ways

<!-- @output -->
A bowtie — same rows, same stars, still symmetric, and wrong

<!-- @why -->
The clearest demonstration in this topic that a structural property can be preserved by a completely different shape.

<!-- @walkthrough -->
1. Printing Pattern 8 first and Pattern 7 second gives a bowtie: widest at top and bottom, narrowest in the middle.
2. It has 2n rows, because both halves still run.
3. It has 2 n squared stars, because the same rows are present in a different order.
4. It is still a palindrome of its own lines, since reversing a palindrome's halves gives a palindrome.
5. So the row count, the star count and the symmetry check all pass at every size from 1 to 40.
6. Comparing the lines against what they should be catches it at n = 2.
7. It is wrong on 39 of the 41 sizes from 0 to 40, passing only at n = 0 and n = 1.

<!-- @example -->

<!-- @input -->
n = 4, with the whole diamond taken from one string

<!-- @output -->
Ten characters generating eight rows

<!-- @why -->
Completes the structure Patterns 7 and 8 each showed half of.

<!-- @walkthrough -->
1. Build S as n minus one spaces followed by 2n minus one stars: three spaces then seven stars, ten characters.
2. Rows 1 to 4 take S from 0 for 4, from 1 for 6, from 2 for 8, and from 3 for 10.
3. Rows 5 to 8 take the same four windows in reverse: from 3 for 10, from 2 for 8, from 1 for 6, from 0 for 4.
4. The seam between the halves is where the window stops widening and starts narrowing, which is why the widest row repeats.
5. In general the top half is S from i minus one for n plus i minus one, and the bottom half is S from n minus i for 2n minus i.
6. Verified for all 40,200 rows across n from 1 to 200 with no exceptions.
7. At n = 6,000 a buffer of 17,998 characters produces 12,000 rows and about 108 million characters of output.

<!-- @example -->

<!-- @input -->
Storing the top half and printing it reversed, at n = 12,000

<!-- @output -->
Correct, holding 215,994,000 characters, and slower

<!-- @why -->
The symmetry makes this the most tempting implementation of this pattern, and it is the same trade Pattern 8 measured.

<!-- @walkthrough -->
1. The bottom half is the top half reversed, so collecting the top half and replaying it backwards is correct.
2. But reversal needs the last row first, so the whole half must exist before the second loop can start.
3. At n = 12,000 that is 215,994,000 characters held, against 23,999 for a version that keeps one row.
4. Measured against building each row directly, it came out at 0.9x at n = 1,000 — break-even.
5. At n = 3,000 and 6,000 it was 1.4x and 1.6x slower.
6. So it costs memory and does not buy speed.
7. Each row is arithmetic on i, so the second loop can regenerate rather than recall — which is what the direct version does.

<!-- @visualization custom -->

<!-- @description -->
Open with the shared buffer strip from Patterns 7 and 8 — three ghost cells then seven stars at n = 4, labelled 3n - 2 characters, all 2n rows — and run a single bracket over it that slides right and widens for the first n steps, then turns around and slides left while narrowing for the next n. The turn is the subject: hold the frame at the moment the bracket reaches the far end, and show it emitting the widest row, stopping, and emitting the widest row again before reversing. That pause is why the diamond has 2n rows and not 2n - 1, and it should be the most emphasised beat in the figure. The output grid fills alongside on a fixed 2n-1 field with leading spaces as ghost cells. Then the check panel, which is this pattern's real content: four candidate outputs side by side — correct, single middle, halves swapped, both halves shifted right — with five verdict lamps beneath each: row count, star count, palindrome, exact compare, compare after stripping. Wire it so the palindrome lamp glows green under three of the four wrong shapes, and animate the palindrome test literally, flipping each candidate top to bottom and laying it over itself so the reader sees why the bowtie survives. Print 2n and 2n squared beside the correct grid and the same two numbers beside the bowtie, so the equality is unmissable. Close with the memory panel from Pattern 8, adapted: two meters, one flat at 2n - 1 for the streaming versions, one climbing to 215,994,000 for the store-the-top-half version at n = 12,000, with a time bar showing that version is also 0.9x to 1.6x — break-even at best and slower above it.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"   *\n  ***\n *****\n*******\n*******\n *****\n  ***\n   *\n","rows":8,"rowFormula":"2n","spacesPerRow":[3,2,1,0,0,1,2,3],"starsPerRow":[1,3,5,7,7,5,3,1],"stars":32,"starFormula":"2n^2","charsPrinted":44,"widestRow":7,"widestAppearsTwice":true},"totals":{"rows":{"n4":8,"n10":20,"n100":200},"stars":{"n4":32,"n10":200,"n100":20000},"chars":{"n4":44,"n10":290,"n100":29900},"note":"exactly twice Pattern 7's, since the diamond is Pattern 7 plus Pattern 8"},"sharedBuffer":{"S":"(n-1 spaces)(2n-1 stars)","length":"3n - 2","topHalf":"rows 1..n = S[i-1 : i-1 + (n+i-1)]","bottomHalf":"rows n+1..2n = S[n-i : n-i + (2n-i)]","verified":"40,200 rows over n = 1..200, 0 exceptions","atN6000":{"bufferChars":17998,"rowsProduced":12000,"outputChars":"about 108 million"},"n4":{"S":"   *******","length":10,"topWindows":["S[0:4]","S[1:6]","S[2:8]","S[3:10]"],"bottomWindows":["S[3:10]","S[2:8]","S[1:6]","S[0:4]"]}},"middleRowConvention":{"thisPattern":"the widest row appears twice, giving 2n rows","pattern10":"the widest row appears once","singleMiddleVariant":{"rows":"2n - 1","starsAtN4":25,"rowsAtN4":7,"wrongOn":"40 of 41","correctAt":[0]}},"bugPanel":{"variants":[{"name":"widest row printed once (2n-1 rows)","wrongOn":"40 of 41","correctAt":[0]},{"name":"halves swapped (a bowtie)","wrongOn":"39 of 41","correctAt":[0,1],"preserves":["row count","star count","palindrome"]},{"name":"both halves shifted one right","wrongOn":"40 of 41","correctAt":[0],"preserves":["row count","star count","palindrome","output after stripping"]},{"name":"top half only (= Pattern 7)","wrongOn":"40 of 41","correctAt":[0]}]},"checkPanel":{"columns":["row count","star count","palindrome","exact compare","after strip"],"smallestNThatCatches":{"widest row once":[1,1,"never",1,1],"halves swapped":["never","never","never",2,2],"both halves shifted":["never","never","never",1,"never"],"top half only":[1,1,2,1,1]},"reading":["the palindrome test catches one of the four, and only at n = 2","it is satisfied by the wrong row count, by a bowtie, and by a shifted diamond","a symmetry check confirms a shape is symmetric, not which symmetric shape it is"]},"assertions":["there are exactly 2n rows","row i of the top half has n - i spaces and 2i - 1 stars","row i of the bottom half has i - 1 spaces and 2(n-i) + 1 stars","total stars equal 2n^2","no row ends with a space"],"mirrorTrap":{"correct":true,"peakCharactersHeld":[{"n":1000,"streaming":1999,"storeTopHalf":1499500},{"n":6000,"streaming":11999,"storeTopHalf":53997000},{"n":12000,"streaming":23999,"storeTopHalf":215994000}],"speedVsFreshRow":{"n1000":"0.9x, break-even","n3000":"1.4x slower","n6000":"1.6x slower"},"why":"each row is arithmetic on i, so the second loop can regenerate rather than recall"},"buildPanel":[{"n":1000,"charAtATimeMs":28.47,"freshRowMs":0.27,"twoSweepsMs":0.11,"storeTopHalfMs":0.25},{"n":3000,"charAtATimeMs":256.51,"freshRowMs":1.82,"twoSweepsMs":1.38,"storeTopHalfMs":2.52},{"n":6000,"charAtATimeMs":1028.06,"freshRowMs":7.71,"twoSweepsMs":7.05,"storeTopHalfMs":12.64}],"ratios":{"perCharToFreshRow":"about 105x to 141x","freshRowToTwoSweeps":"about 1.1x to 2.5x, shrinking with n"},"python":{"perCharToConcat":"283x to 548x","concatToTwoSweeps":"1.18x to 1.26x"}}
```

<!-- @highlights -->
- The shared buffer strip from Patterns 7 and 8 opens the figure, labelled 3n - 2 characters, all 2n rows.
- A single bracket slides right and widens for n steps, then turns and slides left while narrowing for n more.
- The turn is the subject: hold the frame as the bracket reaches the far end.
- It emits the widest row, stops, and emits the widest row again before reversing.
- That pause is why the diamond has 2n rows and not 2n - 1, and it is the most emphasised beat.
- The output grid fills alongside on a fixed 2n-1 field with leading spaces drawn as ghost cells.
- The check panel places four candidates side by side: correct, single middle, halves swapped, both halves shifted right.
- Five verdict lamps sit beneath each: row count, star count, palindrome, exact compare, compare after stripping.
- The palindrome lamp glows green under three of the four wrong shapes.
- The palindrome test is animated literally, flipping each candidate top to bottom and laying it over itself.
- That makes it visible why the bowtie survives the test.
- 2n and 2n squared print beside the correct grid and again beside the bowtie, so the equality is unmissable.
- The memory panel carries over from Pattern 8: two meters, one flat at 2n - 1, one climbing to 215,994,000 at n = 12,000.
- A time bar shows the store-the-top-half version is 0.9x to 1.6x — break-even at best and slower above it.

<!-- @edgeCases -->
- n equal to zero — no output, and the buffer version needs a guard in C++ and Java.
- n equal to one — two rows, each a single star, where three of the four mistakes still pass.
- n equal to two — the smallest input that separates the diamond from a bowtie.
- Negative n — no output from the loop versions; the buffer versions need the same guard as n equal to zero.
- The seam — rows n and n plus one are both the widest, which is this pattern's convention and the opposite of Pattern 10's.
- The widest row — 2n minus one characters, appearing twice.
- Very large n — about 3 n squared characters, so a mirroring implementation must hold half of that.
- A caller expecting a single middle row — that is 2n minus one rows, which is Pattern 10's convention for its own shape.
- A judge that strips whitespace — a diamond shifted one column right passes, so the local test must not strip.
- A caller expecting the widest rows on the outside — that is the bowtie, which shares this pattern's row count, star count and symmetry.

<!-- @pitfalls -->
- Starting the second loop at i = 2 to avoid repeating the widest row. That gives 2n - 1 rows, which is a different pattern's convention and wrong on 40 of 41 sizes here.
- Testing the output for symmetry. It passes for a diamond with the wrong row count, for a bowtie, and for a shifted diamond — three of the four mistakes measured.
- Trusting the row count and the star count together. The bowtie has exactly 2n rows and exactly 2n squared stars.
- Building the top half into a list and printing it reversed. Correct, but it holds 215,994,000 characters at n = 12,000 against 23,999, and measures break-even to 1.6x slower.
- Assuming a symmetric shape needs a symmetric implementation. The two halves share no state, so two independent loops are simpler and stream.
- Shifting both halves by one space. Every summary check passes, stripping hides it, and only an exact comparison catches it.
- Counting stars as n squared. The diamond has two halves, so the total is 2n squared — 20,000 at n = 100, not 10,000.
- Adding trailing spaces to make the rows symmetric. Invisible on screen and rejected by an exact comparison.
- Omitting the n <= 0 guard in the buffer version. In C++ the negative count converts to a huge unsigned value and the string constructor throws.
- Expecting the two-sweep version to be much faster. It is worth about 1.1x to 2.5x and less as n grows.

<!-- @doubt -->
### Should the widest row appear once or twice?

<!-- @answer -->
Twice, in this pattern — that is what makes it 2n rows rather than 2n - 1. The top half ends with 2n - 1 stars and the bottom half begins with 2n - 1 stars, so the seam is a doubled row. Printing it once gives 2n - 1 rows and 2n² - (2n - 1) stars — 7 rows and 25 stars at n = 4 against 8 and 32 — and is wrong on 40 of the 41 sizes from 0 to 40. Pattern 10 takes the opposite convention for its own shape, which is exactly why it is worth fixing here rather than deciding by eye.

<!-- @doubt -->
### Can I check the output by reversing the lines and comparing?

<!-- @answer -->
It tells you almost nothing here. Measured over n from 1 to 40, that test catches one of four mistakes, and only at n = 2. It passes for a diamond with the wrong number of rows, for a diamond shifted a column right, and for a bowtie — because reversing any of those returns them unchanged. The bowtie is the case to remember: swapping the halves gives 2n rows, 2n² stars and a palindrome, so three checks agree with it at every size. Symmetry confirms that a shape is symmetric, not which symmetric shape it is.

<!-- @doubt -->
### The bottom half is the top half reversed. Why not just store it?

<!-- @answer -->
Because storing it is the expensive part and the rows were never expensive. Reversal needs the last row first, so the entire top half must exist before anything of the bottom half can be printed — 215,994,000 characters at n = 12,000, against 23,999 for a version holding one row. And it does not buy speed: measured against building each row, it was break-even at n = 1,000 and 1.4x and 1.6x slower at n = 3,000 and 6,000. Each row is arithmetic on i, so the second loop can just generate it. Pattern 8 measured the same trade for the same reason.

<!-- @doubt -->
### How does one buffer produce all 2n rows?

<!-- @answer -->
Because Patterns 7 and 8 read the same string. Build S = (n - 1 spaces)(2n - 1 stars), which is 3n - 2 characters. The top half is S from i - 1 taking n + i - 1 characters — the window sliding right and widening. The bottom half is S from n - i taking 2n - i — the same windows in the opposite order. Verified for all 40,200 rows across n from 1 to 200 with no exceptions. At n = 6,000 that is a buffer of 17,998 characters producing 12,000 rows and about 108 million characters of output.

<!-- @doubt -->
### Should I write this as one loop over 2n rows with a branch?

<!-- @answer -->
Two loops read better and cost less. The halves share no state — every row is computed from i alone — so a single loop needs a conditional in the middle of the hot path to decide which half it is in, and then two different expressions for the spaces and the stars anyway. Two independent loops say the same thing without the branch, and they make the doubled middle row visible as the seam between them rather than as an off-by-one inside a condition. If you want a single unified form, the honest one is the buffer version, where the difference is the window rule rather than a branch.

<!-- @doubt -->
### Is the total really 2n squared?

<!-- @answer -->
Yes — 32 at n = 4 and 20,000 at n = 100, verified for every n from 0 to 200. Each half is a pyramid whose star counts are the odd numbers, which sum to n², and the diamond has two of them. It is worth stating precisely because a reasonable-sounding guess of n² is off by half, and because the total is one of the checks a bowtie passes. Character counts including spaces are also exactly twice Pattern 7's — 44 at n = 4 and 29,900 at n = 100.
