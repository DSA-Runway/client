---
id: pattern-12-number-crown-pattern
topic: Pattern Printing
title: Pattern 12 - Number Crown Pattern
difficulty: Easy
status: ready
prerequisites:
  - pattern-11-binary-number-triangle
  - pattern-6-inverted-right-angled-number-triangle
  - pattern-7-star-pyramid
  - nested-loops
relatedIds:
  - pattern-11-binary-number-triangle
  - pattern-7-star-pyramid
  - pattern-20-symmetric-butterfly-pattern
  - pattern-22-concentric-number-rectangle
  - nested-loops
---

<!-- @summary -->
Print numbers counting up, a gap, then counting back down — the first pattern with interior whitespace, where the two invariants the shape obviously has (every row 2n wide, every row a palindrome) are both false from n = 10 so a checker asserting either rejects the correct answer, and where removing nine million number conversions is worth 1.3x while batching the same number of space writes is worth 45x.

<!-- @theory -->
## The problem

Print n rows. Row i holds the numbers 1 to i run together, then 2(n - i) spaces,
then the numbers i down to 1 run together.

```
n = 4      1      1
           12    21
           123  321
           12344321
```

Note there are **no separators between the numbers** — `123` is one, two, three,
not one hundred and twenty-three. That is inherent to the shape: the crown only
closes because the two sides butt against the gap. It also means every check in
this container works on characters rather than on tokens.

## Two invariants that are only true up to n = 9

Look at the picture and two properties jump out: every row is the same width, and
every row reads the same backwards. Both are real — and both stop being true at
exactly n = 10.

| | Row widths | Every row a palindrome |
|---|---|---|
| n = 9 | 18, 18, 18, 18, 18, 18, 18, 18, 18 | yes |
| **n = 10** | 20, 20, 20, 20, 20, 20, 20, 20, 20, **22** | **no** |
| n = 11 | 22 x 9, then **24, 26** | no |

Row 10 is where it goes, both times, and for the same reason — the number 10 is
two characters:

```
n = 10, row 10     1234567891010987654321        22 characters, not 20
       reversed    1234567890101987654321        not the same string
```

This is the fourth time in this topic that n = 10 has mattered, and it is the
first time the boundary does something worse than let a bug through: **a checker
asserting either invariant rejects the correct output** from n = 10 onward. Rows 1
to 9 keep both properties at every n; no row from 10 up keeps either.

If you want a width rule that holds at all sizes, it is `2 * D(i) + 2(n - i)`
where `D(i)` is the number of digits in 1 through i — which happens to equal 2n
only while `D(i) = i`.

## What the checks catch

Measured against the correct output for every n from 1 to 40:

| Mistake | Wrong on | Row widths | Digit count | Space count | Exact |
|---|---|---|---|---|---|
| `2(n-i)+1` spaces | 40/41 | n = 1 | **never** | n = 1 | n = 1 |
| `n-i` spaces instead of `2(n-i)` | 39/41 | n = 2 | **never** | n = 2 | n = 2 |
| **Right side counts up too** | 39/41 | **never** | **never** | **never** | n = 2 |
| A trailing space on every row | 40/41 | n = 1 | **never** | n = 1 | n = 1 |

The digit count never catches anything, because none of these mistakes changes
which digits get printed — three change spacing and one changes order.

The right-hand-side bug is the sharp one. Printing `1234` instead of `4321` on the
right leaves the row exactly as wide, with exactly the same digits and exactly the
same spaces, because **`up(i)` and `down(i)` always have the same length**. No
summary sees it at any size. Only reading the characters does, at n = 2.

## Interior whitespace behaves better than leading whitespace

Pattern 7 found that stripping lines before comparing hid three separate mistakes,
two of them structural. Here the same habit is much safer:

| Mistake | Hidden by right-trimming? |
|---|---|
| A trailing space on every row | **yes**, at every size — and it is cosmetic |
| `2(n-i)+1` spaces | no, caught at n = 1 |
| `n-i` spaces | no, caught at n = 2 |
| Right side counts up | no, caught at n = 2 |

The difference is where the whitespace sits. Pattern 7's spaces were **leading**,
so trimming destroyed the only thing placing the stars. Here they are **interior**,
between two runs of digits, and trimming cannot reach them. Right-trimming this
pattern removes exactly the cosmetic error and nothing else.

## The exact counts

| | |
|---|---|
| Spaces | **n(n - 1)** — 12 at n = 4, 9,900 at n = 100 |
| Digits | 20 at n = 4, 90 at n = 9, 112 at n = 10, 18,474 at n = 100 |
| Characters | 32 at n = 4, 202 at n = 10, 28,374 at n = 100 |

The space count is the clean one and it is exact at every size, since spaces never
widen. The digit count is not a simple formula, because it depends on how many
numbers have reached two and three digits.

## The spaces are where the time is

Row i's left side is a prefix of `1234...n` and its right side is a **suffix** of
`n...4321` — the right-hand string grows on the left as i increases, so it is a
suffix rather than a prefix. Both verified across all 20,100 rows from n = 1 to
200. So both sides can come from one buffer each, with no conversions in the
printing loop at all.

That removes n(n+1) integer-to-text conversions — 9,003,000 at n = 3,000, down to
6,000. Measured:

| n | Digit at a time | Fresh row | Two buffers, spaces still looped | Three buffers |
|---|---|---|---|---|
| 500 | 11.80ms | 3.09ms | 2.45ms | 0.06ms |
| 1,500 | 86.89ms | 28.13ms | 21.67ms | 0.34ms |
| 3,000 | 346.48ms | 113.99ms | 87.47ms | 1.93ms |

Removing nine million conversions was worth **1.3x**. Then batching the spaces —
writing them from a buffer instead of one stream call each — was worth **41x to
64x** on top.

That is the result to keep. The conversions are the part you can see in the output
and they were not the cost; the spaces are the part you cannot see and they were
almost all of it. Whole ladder: **about 180x to 256x**, and only the last step
matters. Python agrees, at 4.6x to 5.1x for the first step and 40x to 65x for the
buffers.

<!-- @intuition -->
Two things about this shape look obvious and are traps. The first is that it is a fixed-width block — every row the same length, every row symmetric — which is true right up to the moment a number needs two characters, and then quietly false in a way that makes the obvious test reject correct output rather than catch wrong output. The second is that the numbers are the interesting part, so the numbers must be where the work is; in fact the gap is, because the gap is quadratic in n and every space in it is a separate write unless you make it not be. Both traps come from the same habit of reasoning about the part of the output you can read, when the part you cannot read is doing most of the work.

<!-- @approach -->
### Digit at a Time

<!-- @idea -->
Three inner loops per row: count up, print the gap, count back down.

<!-- @steps -->
1. Loop over the rows from one up to and including n.
2. Print the numbers one through i, run together with no separators.
3. Print 2 times n minus i spaces.
4. Print the numbers i down to one, run together.
5. Print a newline, with no trailing spaces.

<!-- @complexity -->
- time: O(n^2) characters, one stream operation per number and per space
- space: O(1)
- note: The direct translation, and the version where the gap's size is most visible. Measured 346.48ms at n = 3,000 against 113.99ms for building each row — only about 3.0x to 3.8x, because building a row here still costs one conversion per number.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int v = 1; v <= i; v++) cout << v;
        for (int s = 1; s <= 2 * (n - i); s++) cout << ' ';
        for (int v = i; v >= 1; v--) cout << v;
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: No separator between the numbers, so 1, 2, 3 runs together as 123. That is what lets the two sides meet in the last row.
- 7: 2(n - i) spaces, shrinking to zero on the last row. This loop is where almost all the running time goes.
- 8: Counting down, not up. Printing this side upward leaves the widths, digits and spaces all unchanged.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int v = 1; v <= i; v++) System.out.print(v);
        for (int s = 1; s <= 2 * (n - i); s++) System.out.print(' ');
        for (int v = i; v >= 1; v--) System.out.print(v);
        System.out.println();
    }
}
```

<!-- @annotations -->
- 4: The gap is 2(n - i) rather than n - i, which is what makes the row exactly 2n wide while the numbers stay single-digit.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for v in range(1, i + 1):
            print(v, end="")
        for s in range(2 * (n - i)):
            print(" ", end="")
        for v in range(i, 0, -1):
            print(v, end="")
        print()


# The gap holds n(n-1) spaces in total — more characters than the
# digits at every n above 3, and all of them invisible.
```

<!-- @annotations -->
- 5: The space loop. It runs n(n-1) times across the whole pattern, and batching it is worth more than every other change combined.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Assemble the left side, the gap and the right side into one string, then print it.

<!-- @steps -->
1. Loop over the rows.
2. Build the left side by appending the numbers one through i.
3. Append 2 times n minus i spaces in one operation.
4. Append the right side by appending the numbers i down to one.
5. Print the finished row followed by a newline.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations, still n(n+1) integer-to-text conversions
- space: O(n) for the widest row
- note: Measured 113.99ms at n = 3,000, worth about 3.0x to 3.8x. The gap is now one bulk append rather than a loop, which is most of that gain — the conversions remain and, as the next approach shows, they were never the expensive part.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        string row;
        for (int v = 1; v <= i; v++) row += to_string(v);
        row.append(2 * (n - i), ' ');
        for (int v = i; v >= 1; v--) row += to_string(v);
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 9: One bulk append for the whole gap, rather than one operation per space. This single line is most of the gain over the previous approach.
- 10: The right side is rebuilt from scratch every row, converting each number again — n(n+1) conversions in total.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        StringBuilder row = new StringBuilder();
        for (int v = 1; v <= i; v++) row.append(v);
        row.append(" ".repeat(2 * (n - i)));
        for (int v = i; v >= 1; v--) row.append(v);
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 5: repeat builds the gap in one step. The two number loops around it are what the buffer approach removes.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        left = "".join(str(v) for v in range(1, i + 1))
        right = "".join(str(v) for v in range(i, 0, -1))
        print(left + " " * (2 * (n - i)) + right)


# Clear, and it converts every number on both sides of every row.
# Measured 4.6x to 5.1x faster than printing digit by digit.
```

<!-- @annotations -->
- 5: The gap is a single repetition here, which is why this is already much faster than the loop version.

<!-- @approach -->
### Three Buffers

<!-- @idea -->
Build the ascending digits, the descending digits and the gap once each, then write three slices per row.

<!-- @steps -->
1. Guard against a negative n, since the gap is built before the loop.
2. Build the ascending string 1 through n, recording after each number how many characters it holds.
3. Build the descending string n down to 1.
4. Build one gap of 2n spaces.
5. For each row, write a prefix of the ascending string, a prefix of the gap, and a suffix of the descending string.

<!-- @complexity -->
- time: O(n^2) characters written, only 2n integer-to-text conversions, three bulk writes per row
- space: O(n) — two digit buffers and a gap of 2n spaces
- note: The fastest by a wide margin — 1.93ms at n = 3,000 against 87.47ms for the same code with the gap still looped, so 41x to 64x. Against building each row it is about 59x, and against printing digit by digit about 180x. The conversions saved along the way, from 9,003,000 down to 6,000, were worth only 1.3x of that.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    string upStr, downStr;
    vector<size_t> digits(n + 1, 0);
    for (int v = 1; v <= n; v++) { upStr += to_string(v); digits[v] = upStr.size(); }
    for (int v = n; v >= 1; v--) downStr += to_string(v);
    string gap(2 * n, ' ');
    for (int i = 1; i <= n; i++) {
        cout.write(upStr.data(), digits[i]);
        cout.write(gap.data(), 2 * (n - i));
        cout.write(downStr.data() + (downStr.size() - digits[i]), digits[i]);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 10: The table records how many characters the numbers 1 through v occupy. It is needed because that count is not v once numbers reach two digits.
- 11: The descending string grows on the left as v falls, so row i's right side is a suffix of it rather than a prefix.
- 12: One gap of 2n spaces, the widest any row needs. Every row takes a prefix of it.
- 15: This one line replaces a loop that ran n(n-1) times, and it is worth more than every other change in this container combined.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    StringBuilder up = new StringBuilder(), down = new StringBuilder();
    int[] digits = new int[n + 1];
    for (int v = 1; v <= n; v++) { up.append(v); digits[v] = up.length(); }
    for (int v = n; v >= 1; v--) down.append(v);
    String gap = " ".repeat(2 * n);
    for (int i = 1; i <= n; i++) {
        System.out.println(up.substring(0, digits[i])
                + gap.substring(0, 2 * (n - i))
                + down.substring(down.length() - digits[i]));
    }
}
```

<!-- @annotations -->
- 5: Both sides use the same digit-length table, since the numbers 1 through i occupy the same space whichever direction they are written in.

<!-- @code python -->
```python
def pattern(n):
    up = "".join(str(v) for v in range(1, n + 1))
    down = "".join(str(v) for v in range(n, 0, -1))
    gap = " " * (2 * n)
    end = 0
    for i in range(1, n + 1):
        end += len(str(i))
        print(up[:end] + gap[: 2 * (n - i)] + down[len(down) - end :])


# Measured 40x to 65x faster than building each row. No guard is
# needed: " " * 0 and " " * -1 are both the empty string in Python.
```

<!-- @annotations -->
- 7: end is carried forward rather than recomputed, so it costs one length lookup per row instead of a scan.
- 8: A prefix, a prefix of the gap, and a suffix — the whole row without touching a single number.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
Four rows, each eight characters wide, meeting in the middle on the last one

<!-- @why -->
Small enough to count by hand, and it shows both invariants holding — which is exactly what makes them misleading.

<!-- @walkthrough -->
1. Row 1 prints 1, then 2 times 3 spaces, then 1.
2. Row 2 prints 12, then 4 spaces, then 21, and so on.
3. Row 4 prints 1234 with no gap at all, then 4321, giving 12344321.
4. Every row is 8 characters, which is 2n, and every row reads the same backwards.
5. The gap holds 6 plus 4 plus 2 plus 0, which is 12 spaces, matching n(n-1).
6. The digits number 20, so the whole output is 32 characters.
7. Both of the properties visible here fail from n = 10, which is the point of the next example.

<!-- @example -->

<!-- @input -->
n = 10 and n = 11, checking the width and palindrome rules

<!-- @output -->
Both rules break at row 10 — and a checker asserting them rejects the correct answer

<!-- @why -->
The first time in this topic that the n = 10 boundary invalidates a test rather than letting a bug slip through.

<!-- @walkthrough -->
1. At n = 9 every row is 18 characters and every row reads the same backwards.
2. At n = 10 the first nine rows are 20 characters but row 10 is 22.
3. That row is 1234567891010987654321, and reversed it is 1234567890101987654321.
4. So neither invariant survives, and the cause is the same both times: 10 is two characters.
5. At n = 11 the widths run 22 nine times, then 24 and 26.
6. Rows 1 to 9 keep both properties at every n, and no row from 10 up keeps either.
7. The width rule that does hold at all sizes is 2 D(i) + 2(n - i), where D(i) is the digit count of 1 through i.

<!-- @example -->

<!-- @input -->
The right side printed upward instead of downward

<!-- @output -->
Same widths, same digits, same spaces — and wrong

<!-- @why -->
Every summary check in this container passes it, so it is the case that fixes what the container's assertions have to be.

<!-- @walkthrough -->
1. Writing the second loop upward gives rows like 1234    1234 instead of 1234    4321.
2. The numbers 1 through i occupy the same characters in either direction, so the row width is unchanged.
3. The digit count is unchanged for the same reason, and the gap is untouched.
4. Asked for the smallest n at which the row widths, the digit count or the space count notice, over n from 1 to 40, none of them ever does.
5. Right-trimming does not help either, since nothing about the trailing whitespace changed.
6. An exact comparison catches it at n = 2, where the correct row reads 12  21.
7. So the assertion this pattern needs is on the characters of each side, not on any total.

<!-- @example -->

<!-- @input -->
n = 3,000, with the conversions removed and then the spaces batched

<!-- @output -->
Removing 9,003,000 conversions: 1.3x. Batching 9,003,000 space writes: 45x.

<!-- @why -->
Separates two changes that sound equally significant and measure two orders of magnitude apart.

<!-- @walkthrough -->
1. Building each row converts every number on both sides, which is n(n+1) conversions — 9,003,000 at this size.
2. Taking both sides from prebuilt buffers cuts that to 2n, which is 6,000.
3. Measured, that took 113.99ms to 87.47ms — about 1.3 times.
4. The same buffered version still wrote its gap one space at a time, n(n-1) stream calls.
5. Writing the gap from a buffer instead took it to 1.93ms — between 41 and 64 times.
6. So the visible half of the output was not the cost and the invisible half was almost all of it.
7. The whole ladder is about 180 to 256 times, and essentially all of it is that last step.

<!-- @visualization custom -->

<!-- @description -->
Draw each row as three bands rather than a line of cells — an ascending digit band, a gap band, and a descending digit band — with the gap band rendered as visible ghost cells and sized 2(n-i) so it visibly closes as the rows descend. Keep a width meter down the right edge holding at 2n. Then the moment the figure exists for: step n from 9 to 10 and watch row 10 push the meter past 2n, with the number 10 highlighted as two cells where every earlier number was one. Beside it run the palindrome test on that row literally, laying the reversed string over the original so the mismatch is visible character by character, and label both failures with the same cause. Crucially, mark the width meter and the palindrome lamp as now rejecting the correct output — draw them red against a grid that is right, not wrong, since that inversion is the whole lesson. Then the bug strip: four candidate outputs with four verdict lamps each (row widths, digit count, space count, exact), the digit-count lamp green under all four, and the right-side-counts-up candidate green under three of the four with only the exact lamp red. Close with the cost panel, which should be drawn as two separate meters rather than a bar chart: a conversion meter draining from 9,003,000 to 6,000 while the clock barely moves, then a stream-call meter draining from 9,003,000 to n while the clock collapses. Time bars beneath read 346.48ms, 113.99ms, 87.47ms, 1.93ms, with the gap between the third and fourth drawn to scale and captioned the part you cannot see was the cost.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"1      1\n12    21\n123  321\n12344321\n","rows":4,"rowRule":"digits 1..i, then 2(n-i) spaces, then digits i..1","rowWidths":[8,8,8,8],"digits":20,"spaces":12,"chars":32,"noSeparatorsBetweenNumbers":true},"invariants":{"everyRowWidth2n":{"trueFor":"n = 1..9","falseFrom":10},"everyRowPalindrome":{"trueFor":"n = 1..9","falseFrom":10},"cause":"the number 10 is two characters","consequence":"a checker asserting either invariant rejects the CORRECT output from n = 10 on","widths":{"n9":[18,18,18,18,18,18,18,18,18],"n10":[20,20,20,20,20,20,20,20,20,22],"n11":[22,22,22,22,22,22,22,22,22,24,26]},"row10AtN10":{"text":"1234567891010987654321","length":22,"reversed":"1234567890101987654321"},"rowsKeepingBoth":"rows 1..9 at every n; no row from 10 up","widthRuleThatAlwaysHolds":"2 D(i) + 2(n - i), where D(i) is the digit count of 1..i"},"counts":{"spaces":"n(n-1)","spacesVerified":"n = 1..200","atN4":{"digits":20,"spaces":12,"chars":32},"atN9":{"digits":90,"spaces":72,"chars":162},"atN10":{"digits":112,"spaces":90,"chars":202},"atN100":{"digits":18474,"spaces":9900,"chars":28374}},"bugPanel":{"variants":[{"name":"2(n-i)+1 spaces","wrongOn":"40 of 41","correctAt":[0]},{"name":"n-i spaces instead of 2(n-i)","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"right side counts up too","wrongOn":"39 of 41","correctAt":[0,1],"preserves":["row widths","digit count","space count"]},{"name":"a trailing space on every row","wrongOn":"40 of 41","correctAt":[0]}]},"checkPanel":{"columns":["row widths","digit count","space count","after right-trim","exact"],"smallestNThatCatches":{"2(n-i)+1 spaces":[1,"never",1,1,1],"n-i spaces":[2,"never",2,2,2],"right side counts up":["never","never","never",2,2],"trailing space":[1,"never",1,"never",1]},"reading":["the digit count never catches anything, since none of these changes which digits are printed","up(i) and down(i) always have the same length, so the reversed-side bug moves no summary","only an exact comparison catches it, at n = 2"]},"whitespacePosition":{"thisPattern":"interior, between two runs of digits","pattern7":"leading, and the only thing placing the stars","rightTrimHere":"hides exactly the cosmetic trailing-space error and nothing else","rightTrimInPattern7":"hid three mistakes, two of them structural"},"buffers":{"up":"1234...n, and row i's left side is a prefix of it","down":"n...4321, and row i's right side is a SUFFIX of it","why":"the descending string grows on the left as the numbers fall","lengthsMatch":"len(up(i)) == len(down(i)) at every i, so one digit-length table serves both sides","verified":"20,100 rows over n = 1..200, 0 prefix failures and 0 suffix failures","n12":{"up":"123456789101112","down":"121110987654321","digitLengthTable":[1,2,3,4,5,6,7,8,9,11,13,15]}},"assertions":["row i's left side is the digits of 1..i run together","row i's right side is the digits of i..1 run together","row i holds exactly 2(n-i) spaces, all of them interior","total spaces equal n(n-1)","no row begins or ends with a space"],"buildPanel":[{"n":500,"digitAtATimeMs":11.80,"freshRowMs":3.09,"twoBuffersLoopedGapMs":2.45,"threeBuffersMs":0.06},{"n":1500,"digitAtATimeMs":86.89,"freshRowMs":28.13,"twoBuffersLoopedGapMs":21.67,"threeBuffersMs":0.34},{"n":3000,"digitAtATimeMs":346.48,"freshRowMs":113.99,"twoBuffersLoopedGapMs":87.47,"threeBuffersMs":1.93}],"costAttribution":{"conversionsRemoved":{"from":9003000,"to":6000,"atN":3000,"worth":"1.3x"},"spaceWritesBatched":{"count":9003000,"atN":3000,"worth":"41x to 64x"},"wholeLadder":"about 180x to 256x","reading":"the visible half of the output was not the cost; the invisible half was almost all of it"},"python":{"perDigitToJoin":"4.6x to 5.1x","joinToBuffers":"40x to 65x"}}
```

<!-- @highlights -->
- Each row is drawn as three bands: an ascending digit band, a gap band, and a descending digit band.
- The gap band renders as visible ghost cells sized 2(n-i), visibly closing as the rows descend.
- A width meter runs down the right edge, holding at 2n.
- Stepping n from 9 to 10, row 10 pushes the meter past 2n.
- The number 10 is highlighted as two cells where every earlier number was one.
- The palindrome test runs on that row literally, the reversed string laid over the original.
- Both failures are labelled with the same cause.
- The width meter and palindrome lamp are drawn red against a grid that is correct, not wrong.
- That inversion — a test rejecting the right answer — is the whole lesson of the figure.
- A bug strip shows four candidates with four verdict lamps each: row widths, digit count, space count, exact.
- The digit-count lamp is green under all four candidates.
- The right-side-counts-up candidate is green under three of the four, with only the exact lamp red.
- The cost panel is two draining meters rather than a bar chart.
- A conversion meter drains from 9,003,000 to 6,000 while the clock barely moves.
- A stream-call meter then drains from 9,003,000 to n while the clock collapses.
- Time bars read 346.48ms, 113.99ms, 87.47ms and 1.93ms, captioned the part you cannot see was the cost.

<!-- @edgeCases -->
- n equal to zero — no output, and the buffer version builds nothing before its loop.
- n equal to one — a single row reading 1 then 1 with no gap at all, since 2(n-i) is zero.
- n equal to two — the smallest input that catches the reversed-side bug.
- n equal to nine — the largest input at which every row is 2n wide and every row is a palindrome.
- n equal to ten — where both of those invariants fail, at row 10, because 10 is two characters.
- Negative n — no output from the loop versions; the buffer version needs its guard, since a negative gap length throws in C++ and Java.
- The last row — no gap at all, and the only row where the two sides touch.
- The first row — the widest gap, 2(n-1) spaces.
- Very large n — the gap alone is n(n-1) characters, which is more than the digits for every n above three.
- A caller expecting separators between the numbers — that is a different shape, and the sides would no longer meet cleanly in the last row.

<!-- @pitfalls -->
- Asserting that every row is 2n characters. True only up to n = 9; from n = 10 the assertion rejects correct output.
- Asserting that every row is a palindrome. Same boundary, same cause — row 10 reads 1234567891010987654321, which reversed is not itself.
- Checking the digit count. It catches none of the four mistakes measured, since none of them changes which digits are printed.
- Printing the right side upward. The row width, the digit count and the space count are all unchanged, so only an exact comparison catches it.
- Writing n - i spaces instead of 2(n - i). The two sides no longer meet on the last row, and it is caught at n = 2.
- Assuming stripping is as dangerous here as in Pattern 7. It is not — these spaces are interior, so right-trimming removes exactly the cosmetic trailing-space error.
- Optimising the number conversions first. Cutting 9,003,000 of them to 6,000 measured 1.3x.
- Leaving the gap as a per-space loop. Batching it measured 41x to 64x, which is the entire optimisation.
- Treating the right-hand digits as a prefix of the descending string. They are a suffix — the descending string grows on the left as the numbers fall.
- Indexing either side by i rather than by a digit-length table. The numbers 1 through i occupy i characters only while i is under 10.

<!-- @doubt -->
### Every row looks the same width. Can I assert that?

<!-- @answer -->
Only up to n = 9. Row width is 2 D(i) + 2(n - i), where D(i) is the number of characters in the digits 1 through i, and that equals 2n only while D(i) = i. From n = 10 the last row is wider: at n = 10 the first nine rows are 20 characters and row 10 is 22; at n = 11 the widths run 22 nine times, then 24 and 26. So an assertion that every row is 2n characters does not catch a bug at n = 10 — it **rejects the correct output**. That is worth separating from every other n = 10 result in this topic, which were about bugs slipping through.

<!-- @doubt -->
### Is every row a palindrome?

<!-- @answer -->
Up to n = 9, yes, and it is a tempting check because it is one line. It breaks at exactly the same place and for exactly the same reason as the width rule. Row 10 at n = 10 is 1234567891010987654321; reversed that is 1234567890101987654321, because reversing 10 gives 01. Rows 1 to 9 stay palindromes at every n, and no row from 10 up ever is. So like the width rule, this test starts failing correct output from n = 10 — use it as an illustration of the shape, not as an assertion.

<!-- @doubt -->
### Why does no count catch the right side counting up?

<!-- @answer -->
Because the numbers 1 through i occupy the same characters whichever order you write them in. So printing 1234 where 4321 belongs leaves the row exactly as wide, with exactly the same digits and exactly the same gap. Measured over n from 1 to 40, the row widths, the digit count and the space count never catch it at any size. Right-trimming does not help either, since no trailing whitespace changed. Only comparing the characters does, at n = 2, where the correct row is 12  21. The assertion this pattern needs is on each side's contents, not on any total.

<!-- @doubt -->
### Pattern 7 said never to strip whitespace. Does that apply here?

<!-- @answer -->
Much less. The difference is where the whitespace sits. Pattern 7's spaces were leading, and they were the only thing placing the stars, so stripping hid a shifted pyramid and an output with no spaces at all. Here the spaces are interior — between two runs of digits — and trimming cannot reach them. Measured, right-trimming hides exactly one of the four mistakes: the trailing-space error, which is cosmetic. The other three are still caught at n = 1 or n = 2. So the rule is about whether the whitespace is load-bearing at the line's edge, not about whitespace in general.

<!-- @doubt -->
### I removed nine million number conversions and it barely got faster. Why?

<!-- @answer -->
Because the conversions were not the cost. Taking both digit sides from prebuilt buffers cuts n(n+1) conversions down to 2n — 9,003,000 to 6,000 at n = 3,000 — and measured 113.99ms to 87.47ms, about 1.3x. The same version still wrote its gap one space at a time, which is n(n-1) stream calls. Writing the gap from a buffer instead took it to 1.93ms, between 41x and 64x. The gap is quadratic in n and it is the half of the output you cannot see, which is exactly why it is easy to optimise everything else first.

<!-- @doubt -->
### Why is the right-hand side a suffix of a buffer rather than a prefix?

<!-- @answer -->
Because the descending string grows on the left. down(4) is 4321 and down(5) is 54321 — the new number goes on the front, so every shorter one is a suffix of every longer one. The ascending string is the ordinary case: up(4) is 1234 and up(5) is 12345, so shorter ones are prefixes. Verified across all 20,100 rows from n = 1 to 200, with no prefix failures on the left and no suffix failures on the right. Both sides use the same digit-length table, since the numbers 1 through i occupy the same characters in either direction.

<!-- @doubt -->
### Should the numbers be separated by spaces, as in Patterns 3 and 6?

<!-- @answer -->
Not in this shape. The crown depends on the two sides meeting exactly in the last row — 1234 and 4321 becoming 12344321 with nothing between them — and separators would leave a seam there. It also changes what every check has to work on: with no separators there are no tokens, so the assertions are about the characters of each side rather than about a token list. That is why this container's checks are stated in characters throughout, unlike Patterns 3, 4 and 6.
