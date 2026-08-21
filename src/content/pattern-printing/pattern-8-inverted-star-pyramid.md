---
id: pattern-8-inverted-star-pyramid
topic: Pattern Printing
title: Pattern 8 - Inverted Star Pyramid
difficulty: Easy
status: ready
prerequisites:
  - pattern-7-star-pyramid
  - pattern-5-inverted-right-angled-star-triangle
  - nested-loops
  - for-loop
relatedIds:
  - pattern-7-star-pyramid
  - pattern-9-diamond-star-pattern
  - pattern-5-inverted-right-angled-star-triangle
  - pattern-20-symmetric-butterfly-pattern
  - nested-loops
---

<!-- @summary -->
Print a pyramid standing on its point — the same buffer Pattern 7 builds, read through the same windows in the opposite order, and the pattern where the obvious shortcut of generating Pattern 7 and reversing it is perfectly correct while holding 216 million characters at n = 12,000 against 23,999 for the direct version.

<!-- @theory -->
## The problem

Print n rows where row i holds i - 1 leading spaces followed by 2(n - i) + 1 stars.

```
n = 4      *******
            *****
             ***
              *
```

## Everything Pattern 7 measured still holds

This is Pattern 7 upside down — verified byte-identical to Pattern 7 with its
lines reversed, for every n from 0 to 300. So the totals are the same: **n² stars**
(16 at n = 4, 10,000 at n = 100) and the same character counts including spaces (22
at n = 4, 14,950 at n = 100).

Which means the check results carry over unchanged, and are worth restating once
because this is the second pattern in a row where they bite:

| Mistake | Wrong on | Stars | Line lengths | After right-trim | After strip |
|---|---|---|---|---|---|
| Stars `2(n-i)` instead of `2(n-i)+1` | 40/41 | n = 1 | n = 1 | n = 1 | n = 1 |
| Leading spaces `i` instead of `i-1` | 40/41 | **never** | n = 1 | n = 1 | **never** |
| No leading spaces at all | 39/41 | **never** | n = 2 | n = 2 | **never** |
| Trailing spaces as well as leading | 39/41 | **never** | n = 2 | **never** | **never** |
| Not inverted (= Pattern 7) | 39/41 | **never** | n = 2 | n = 2 | n = 2 |

Four of five never touch the star count. Stripping both ends of each line hides
three of them.

The one difference from Pattern 7 worth noticing: here the **first** row is the
widest, at 2n - 1, and row i has length 2n - i. So the output starts at full width
and narrows, which matters if anything downstream is sizing a field from the first
line it sees.

## The same windows, walked backwards

Pattern 7 found that every row was a window into one fixed string:

```
S = (n - 1 spaces)(2n - 1 stars)          length 3n - 2
```

The striking part is that **this pattern uses the same string and the same
windows** — just in the opposite order:

```
n = 4      S = "   *******"

Pattern 7 windows      S[0:4]   S[1:6]   S[2:8]   S[3:10]
Pattern 8 windows      S[3:10]  S[2:8]   S[1:6]   S[0:4]
```

Row i here is `S[n-i : n-i + (2n-i)]`, verified for all 20,100 rows from n = 1 to
200 with no exceptions. The window's start moves **left** by one each row while
its width **shrinks** by two — one space gained, two stars lost — exactly the
reverse of Pattern 7's sweep.

That is a fact about the two patterns, not just a trick: one buffer of 3n - 2
characters contains both pyramids, and Pattern 9's diamond is the two sweeps run
back to back.

## The tempting shortcut, and what it costs

Since this is Pattern 7 reversed, the obvious move is to generate Pattern 7 and
print its lines backwards. That is **correct** — 0 differences over n = 0 to 200 —
and it is worth knowing exactly what you pay for it.

You cannot print the last line first without having produced it, so the whole
output has to exist before anything is emitted:

| n | Direct versions hold | Reverse-Pattern-7 holds |
|---|---|---|
| 1,000 | 1,999 characters | 1,500,500 |
| 6,000 | 11,999 | 54,003,000 |
| 12,000 | **23,999** | **216,006,000** |

That is a factor of about **9,000x** at n = 12,000 — O(n) space against O(n²) —
and it also delays the first line until the last one is ready.

It is slower too, which is less obvious. Measured against building each row
directly: **1.4x, 2.1x and 2.3x** slower at n = 1,000, 3,000 and 6,000.

So the shortcut is not a trade of memory for speed. It costs both. The reason to
know it is that a great many "print it upside down" problems tempt exactly this,
and the direct version here is a one-character change to the loop.

## Speed, briefly

| n | Char at a time | Fresh row | Window backwards | Reverse Pattern 7 |
|---|---|---|---|---|
| 1,000 | 15.13ms | 0.14ms | 0.06ms | 0.20ms |
| 3,000 | 139.48ms | 0.80ms | 0.51ms | 1.71ms |
| 6,000 | 518.80ms | 3.77ms | 3.30ms | 8.59ms |

The same shape as Pattern 7: the first step is worth **108x to 174x**, and the
window is worth about **1.1x to 2.3x**, shrinking as n grows because what remains
is the characters. Python matches it — 263x to 570x for the first step, and a flat
1.13x to 1.28x for the window.

<!-- @intuition -->
The useful way to see this is not as a new shape but as the same shape read in the other direction, and the reason that matters is that it changes what the cheap implementation is. Reversing an output is the most natural thought and it is the expensive one, because reversal is the one operation that cannot start until generation has finished — the last line is needed first. Turning the loop around instead costs nothing, because the row's contents were never a function of what came before them; they were always just arithmetic on i. That is the general lesson worth taking: when the rows are computed independently, changing their order is free, and materialising them all in order to reverse them is buying something you already had.

<!-- @approach -->
### Character at a Time

<!-- @idea -->
Two inner loops per row: growing leading spaces, then shrinking stars.

<!-- @steps -->
1. Loop over the rows from one up to and including n.
2. Print i minus one spaces, which grows as the rows descend.
3. Print 2 times n minus i, plus one, stars — shrinking and still odd.
4. Print a newline after the stars, with no trailing spaces.
5. Row one has no spaces and 2n minus one stars; row n has n minus one spaces and a single star.

<!-- @complexity -->
- time: O(n^2) characters, and one stream operation per character
- space: O(1)
- note: The direct translation. Measured 518.80ms at n = 6,000 against 3.77ms for building each row — between 108x and 174x across the sizes tested, matching Pattern 7 and Pattern 2.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int s = 1; s <= i - 1; s++) {
            cout << ' ';
        }
        for (int k = 1; k <= 2 * (n - i) + 1; k++) {
            cout << '*';
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: i - 1 spaces, so the first row has none. Writing i shifts the whole pyramid right without changing the star count.
- 9: Still odd, so every row keeps a centre. The counts run 2n-1, 2n-3, down to 1, and they sum to n squared.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int s = 1; s <= i - 1; s++) System.out.print(' ');
        for (int k = 1; k <= 2 * (n - i) + 1; k++) System.out.print('*');
        System.out.println();
    }
}
```

<!-- @annotations -->
- 3: The spaces grow here rather than shrink, which is the only structural change from Pattern 7.
- 4: The stars shrink to match, so each row is two narrower than the one above it.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for s in range(i - 1):
            print(" ", end="")
        for k in range(2 * (n - i) + 1):
            print("*", end="")
        print()


# The first row is now the widest, at 2n - 1, and row i is 2n - i
# characters long.
```

<!-- @annotations -->
- 3: range(i - 1) runs zero times on the first row, which is what leaves it flush left.
- 5: range(2 * (n - i) + 1) is 2n-1 on the first row and 1 on the last.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Make the spaces and the stars by repetition and print the row in one operation.

<!-- @steps -->
1. Loop over the rows.
2. Build i minus one spaces.
3. Append 2 times n minus i, plus one, stars.
4. Print the result followed by a newline.
5. Both inner loops disappear.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations
- space: O(n) — the widest row is 2n - 1, and it is the first one
- note: Recovers essentially all the available speed — 3.77ms at n = 6,000 against 518.80ms printing character by character. Note that this holds one row at a time; generating Pattern 7 and reversing it holds the entire output, which is 54,003,000 characters at the same size.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        cout << string(i - 1, ' ') << string(2 * (n - i) + 1, '*') << '\n';
    }
}
```

<!-- @annotations -->
- 7: The two counts sum to 2n - i, which is the row's length. Nothing depends on the row before it, which is why reversing the loop is free.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        System.out.println(" ".repeat(i - 1) + "*".repeat(2 * (n - i) + 1));
    }
}
```

<!-- @annotations -->
- 3: Turning Pattern 7 upside down is this one line, not a reversal step.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        print(" " * (i - 1) + "*" * (2 * (n - i) + 1))


# Each row is computed from i alone, so the loop can be walked in
# either direction at no cost. Reversing the output cannot.
```

<!-- @annotations -->
- 3: Two repetitions and a concatenation, measured 263x to 570x faster than printing character by character in Python.

<!-- @approach -->
### One Buffer, Window Running Backwards

<!-- @idea -->
Build the same buffer Pattern 7 uses and visit the same windows in the opposite order.

<!-- @steps -->
1. Guard against n being zero or less, since n minus one would be negative.
2. Build the buffer once: n minus one spaces, then 2n minus one stars.
3. Loop over the rows from one up to and including n.
4. Write 2n minus i characters starting at offset n minus i.
5. The start moves left by one each row while the width shrinks by two.

<!-- @complexity -->
- time: O(n^2) characters written, one allocation in total
- space: O(n) — the buffer is 3n - 2 characters, the same one Pattern 7 builds
- note: Correct and structurally satisfying rather than fast. Measured 3.30ms against 3.77ms at n = 6,000, and 0.06ms against 0.14ms at n = 1,000 — about 1.1x to 2.3x, shrinking as n grows. Python is flatter, at 1.13x to 1.28x.

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
        cout.write(buf.data() + (n - i), 2 * n - i);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 7: Character for character the same buffer Pattern 7 builds — one string of 3n - 2 characters holds both pyramids.
- 10: The start moves left and the width shrinks: one space gained, two stars lost, which is Pattern 7's sweep run backwards.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    String buf = " ".repeat(n - 1) + "*".repeat(2 * n - 1);
    for (int i = 1; i <= n; i++) {
        System.out.println(buf.substring(n - i, n - i + 2 * n - i));
    }
}
```

<!-- @annotations -->
- 2: The same guard Pattern 7 needs, since repeat rejects a negative count and n - 1 is negative at n = 0.
- 5: substring copies in Java, so the structure is stated clearly but the per-row allocation remains.

<!-- @code python -->
```python
def pattern(n):
    buf = " " * (n - 1) + "*" * (2 * n - 1)
    for i in range(1, n + 1):
        print(buf[n - i : n - i + 2 * n - i])


# The same buffer Pattern 7 builds, with the windows visited in the
# opposite order. Measured 1.13x to 1.28x against building each row.
```

<!-- @annotations -->
- 2: No guard needed in Python, since " " * -1 is the empty string rather than an error.
- 4: Offsets n - i and width 2n - i. At i = 1 that is the whole star run; at i = n it is the leading spaces plus one star.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
Rows of 0, 1, 2 and 3 spaces followed by 7, 5, 3 and 1 stars — sixteen stars

<!-- @why -->
Small enough to count by hand, and it fixes the totals as identical to Pattern 7's, which is what makes the order-blind checks fail.

<!-- @walkthrough -->
1. The outer loop runs for i values 1, 2, 3 and 4.
2. At i = 1 there are i minus 1, so 0, spaces and 2 times 3 plus 1, so 7, stars.
3. At i = 2 there are 1 space and 5 stars, then 2 and 3, then 3 and 1.
4. The star counts are the odd numbers descending, and 7 + 5 + 3 + 1 is 16, which is n squared.
5. Each row's length is 2n minus i: 7, 6, 5 and 4, so the first row is the widest.
6. Including the spaces, 22 characters are printed — exactly what Pattern 7 prints at this size.
7. So the star total, the character total and the sorted line lengths cannot tell the two patterns apart.

<!-- @example -->

<!-- @input -->
n = 4, with both pyramids taken from one string

<!-- @output -->
The same four windows, visited in opposite orders

<!-- @why -->
Shows that the two patterns are one object read two ways, which is what Pattern 9 then builds on.

<!-- @walkthrough -->
1. Build S as n minus one spaces followed by 2n minus one stars: three spaces then seven stars.
2. Pattern 7 takes S from 0 for 4 characters, then from 1 for 6, then 2 for 8, then 3 for 10.
3. This pattern takes S from 3 for 10, then 2 for 8, then 1 for 6, then 0 for 4.
4. Those are the same four windows in reverse order, so one buffer holds both pyramids.
5. In general row i here is S from n minus i, taking 2n minus i characters.
6. Verified for all 20,100 rows across n from 1 to 200 with no exceptions.
7. Running Pattern 7's sweep and then this one back to back over the same buffer produces the diamond of Pattern 9.

<!-- @example -->

<!-- @input -->
Generating Pattern 7 and reversing its lines, at n = 12,000

<!-- @output -->
Correct, and holding 216,006,000 characters instead of 23,999

<!-- @why -->
The most natural way to write this pattern, and the one worth measuring before adopting.

<!-- @walkthrough -->
1. This pattern is Pattern 7 with the lines reversed, verified with 0 differences over n = 0 to 200.
2. So collecting Pattern 7's rows and printing them backwards is a correct implementation.
3. But the last line must be printed first, so nothing can be emitted until everything is generated.
4. At n = 12,000 that means holding 216,006,000 characters, against 23,999 for a version that holds one row.
5. That is roughly a factor of 9,000, and it is O(n) space against O(n squared).
6. It is also slower — measured 1.4x, 2.1x and 2.3x against building each row at n = 1,000, 3,000 and 6,000.
7. The direct version is a one-character change to the loop, so the shortcut costs both memory and time and saves nothing.

<!-- @example -->

<!-- @input -->
An output shifted one column right, compared after stripping

<!-- @output -->
Indistinguishable from correct at every size tested

<!-- @why -->
Repeats Pattern 7's strongest warning in the mirrored case, because the mistake is just as easy here and the habit is just as common.

<!-- @walkthrough -->
1. Writing i leading spaces instead of i minus one shifts the whole pyramid one column right.
2. The star count is untouched, so it stays at exactly n squared at every size.
3. Comparing line lengths catches it at n = 1, since every row is one character longer.
4. An exact comparison catches it at n = 1, and so does right-trimming.
5. Stripping both ends of each line never catches it, at any n from 1 to 40.
6. The same is true of an output with no leading spaces at all, which is not a pyramid.
7. The cheap assertion that does work here is that row i begins with exactly i minus one spaces.

<!-- @visualization custom -->

<!-- @description -->
Draw one buffer strip at the top of the figure — three ghost cells then seven stars for n = 4 — and make it the shared object of the whole drawing, labelled 3n - 2 characters, holds both pyramids. Beneath it run two brackets over the same strip: Pattern 7's, starting at index 0 and sliding right while widening, and this pattern's, starting at index 3 and sliding left while narrowing. Step them together so the reader sees the two brackets tracing the same four positions in opposite directions, and mark each shared position with a tick that both brackets light up. The output grid fills from the widest row down, on a fixed 2n-1 field with the leading spaces drawn as visible ghost cells, so the narrowing is visible as ghost cells accumulating on the left rather than as stars simply disappearing. Beside the grid put the check panel from Pattern 7, unchanged: star count, line lengths, exact, right-trim, strip — with four bug grids and the star row reading identical for four of the five. Then the memory panel, which is this pattern's own: two side-by-side meters filling as the output is produced. The direct meter holds one row and stays flat at 2n - 1. The reverse-Pattern-7 meter climbs the whole time and only starts emitting once it is full, so the first output line appears at the very end — that latency should be animated, not just labelled. Print the two peak figures at n = 12,000 as 23,999 and 216,006,000 with the ratio 9,000x between them, and a time bar showing the reverse version is also 1.4x to 2.3x slower, so neither axis favours it.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"*******\n *****\n  ***\n   *\n","lines":4,"spacesPerRow":[0,1,2,3],"starsPerRow":[7,5,3,1],"stars":16,"starFormula":"n^2","rowLength":"2n - i","rowLengths":[7,6,5,4],"widestRow":7,"widestIsFirst":true,"charsPrinted":22},"relationToPattern7":{"claim":"this is Pattern 7 with its lines reversed","verifiedOver":"n = 0..300, 0 differences","identicalTotals":{"stars":{"n4":16,"n10":100,"n100":10000},"chars":{"n4":22,"n10":145,"n100":14950}},"difference":"the widest row is first here and last there"},"sharedBuffer":{"S":"(n-1 spaces)(2n-1 stars)","length":"3n - 2","pattern7Rule":"row i = S[i-1 : i-1 + (n+i-1)]","pattern8Rule":"row i = S[n-i : n-i + (2n-i)]","verified":"20,100 rows over n = 1..200, 0 exceptions","n4":{"S":"   *******","pattern7Windows":["S[0:4]","S[1:6]","S[2:8]","S[3:10]"],"pattern8Windows":["S[3:10]","S[2:8]","S[1:6]","S[0:4]"],"note":"the same four windows, opposite order"},"pattern9":"the two sweeps run back to back over this one buffer"},"bugPanel":{"variants":[{"name":"stars 2(n-i) instead of 2(n-i)+1","wrongOn":"40 of 41","correctAt":[0]},{"name":"leading spaces i instead of i-1","wrongOn":"40 of 41","correctAt":[0]},{"name":"no leading spaces at all","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"trailing spaces as well as leading","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"not inverted (= Pattern 7)","wrongOn":"39 of 41","correctAt":[0,1]}]},"checkPanel":{"columns":["star count","line lengths","exact compare","after right-trim","after strip both ends"],"smallestNThatCatches":{"stars 2(n-i)":[1,1,1,1,1],"leading spaces i":["never",1,1,1,"never"],"no leading spaces":["never",2,2,2,"never"],"trailing spaces":["never",2,2,"never","never"],"not inverted":["never",2,2,2,2]},"reading":["four of five never touch the star count","stripping both ends hides three of them"],"cheapestAssertion":"row i begins with exactly i - 1 spaces"},"assertions":["row i has exactly i - 1 leading spaces","row i has exactly 2(n-i) + 1 stars","row i is 2n - i characters long","total stars equal n^2","no row ends with a space"],"reverseShortcut":{"correct":true,"verifiedOver":"n = 0..200, 0 differences","peakCharactersHeld":[{"n":1000,"direct":1999,"reverse":1500500},{"n":6000,"direct":11999,"reverse":54003000},{"n":12000,"direct":23999,"reverse":216006000}],"ratioAt12000":9000,"space":"O(n) against O(n^2)","alsoSlowerBy":"1.4x, 2.1x and 2.3x at n = 1,000, 3,000 and 6,000","latency":"nothing can be emitted until everything is generated","verdict":"costs both memory and time, and the direct version is a one-character loop change"},"buildPanel":[{"n":1000,"charAtATimeMs":15.13,"freshRowMs":0.14,"windowMs":0.06,"reversePattern7Ms":0.20},{"n":3000,"charAtATimeMs":139.48,"freshRowMs":0.80,"windowMs":0.51,"reversePattern7Ms":1.71},{"n":6000,"charAtATimeMs":518.80,"freshRowMs":3.77,"windowMs":3.30,"reversePattern7Ms":8.59}],"ratios":{"perCharToFreshRow":"108x to 174x","freshRowToWindow":"about 1.1x to 2.3x, shrinking with n"},"python":{"perCharToConcat":"263x to 570x","concatToSlice":"1.13x to 1.28x"}}
```

<!-- @highlights -->
- One buffer strip sits at the top of the figure — three ghost cells then seven stars for n = 4 — labelled 3n - 2 characters, holds both pyramids.
- Two brackets run over the same strip: Pattern 7's sliding right while widening, this pattern's sliding left while narrowing.
- Stepped together, the two brackets trace the same four positions in opposite directions.
- Each shared position carries a tick that both brackets light up.
- The output grid fills from the widest row down, on a fixed 2n-1 field.
- Leading spaces are drawn as visible ghost cells, so narrowing reads as ghost cells accumulating on the left.
- The check panel from Pattern 7 carries over unchanged: star count, line lengths, exact, right-trim, strip.
- Four bug grids sit beside it, and the star-count row reads identical for four of the five.
- The memory panel is this pattern's own: two meters filling as the output is produced.
- The direct meter holds one row and stays flat at 2n - 1.
- The reverse-Pattern-7 meter climbs the whole time and emits nothing until it is full.
- That latency is animated rather than labelled — the first output line appears at the very end.
- Peak figures at n = 12,000 print as 23,999 and 216,006,000, with the ratio 9,000x between them.
- A time bar shows the reverse version is also 1.4x to 2.3x slower, so neither axis favours it.

<!-- @edgeCases -->
- n equal to zero — no output, and the buffer version needs a guard in C++ and Java since n minus one is negative.
- n equal to one — a single star with no spaces, where four of the five mistakes still pass.
- n equal to two — the smallest input that separates this pyramid from Pattern 7's.
- Negative n — no output from the loop versions; the buffer versions need the same guard as n equal to zero.
- The first row — the widest at 2n minus one, and flush left, which is the opposite of Pattern 7.
- The last row — a single star with n minus one leading spaces.
- Very large n — about 1.5 n squared characters, and a reversal-based implementation must hold all of them.
- A judge that strips whitespace — a shifted pyramid and a spaceless staircase both pass, so the local test must not strip.
- A caller expecting the apex at the top — that is Pattern 7, and no count-based check can tell the two apart.
- A caller expecting both halves — that is Pattern 9, which is this sweep appended to Pattern 7's.

<!-- @pitfalls -->
- Generating Pattern 7 and reversing the lines. Correct, but it holds the whole output — 216,006,000 characters at n = 12,000 against 23,999 — and measures 1.4x to 2.3x slower as well.
- Assuming a reversal is a cheap way to invert any pattern. It is only cheap when the rows genuinely depend on each other; here each row is arithmetic on i, so turning the loop around is free.
- Writing i leading spaces instead of i minus one. The pyramid shifts one column right, the star count is unaffected, and stripping hides it.
- Writing 2(n - i) stars instead of 2(n - i) + 1. The rows come out even with no apex — caught immediately at n = 1, which makes it the least dangerous mistake here.
- Counting stars as the check. Four of the five mistakes leave the total at exactly n squared.
- Stripping lines before comparing. It hides the shift and it hides an output with no leading spaces at all.
- Adding a symmetric trailing space loop. Invisible on screen, and it fails an exact comparison on 39 of 41 sizes.
- Sizing an output field from the last row. Here the first row is the widest, at 2n minus one, which is the reverse of Pattern 7.
- Omitting the n <= 0 guard in the buffer version. In C++ the negative count converts to a huge unsigned value and the string constructor throws.
- Expecting the window version to be much faster. It is worth about 1.1x to 2.3x and less as n grows, since what remains is the characters.

<!-- @doubt -->
### Can I just generate Pattern 7 and print it backwards?

<!-- @answer -->
It is correct — verified with 0 differences over n = 0 to 200 — and it costs more than writing the loop directly. Reversal needs the last line first, so nothing can be printed until everything has been generated: at n = 12,000 that is 216,006,000 characters held, against 23,999 for a version that holds one row, roughly a factor of 9,000 and O(n²) space against O(n). It is also slower, by 1.4x, 2.1x and 2.3x at n = 1,000, 3,000 and 6,000. Since each row is computed from i alone, turning the loop around is free — the reversal is buying something you already had.

<!-- @doubt -->
### How is this different from Pattern 7 if all the totals are the same?

<!-- @answer -->
Only in the order of the rows, which is exactly the point. The star total is n squared in both, the character totals are identical — 14,950 at n = 100 — and the multiset of line lengths is the same, so every order-blind check agrees with the wrong one. What does differ is where the width sits: here the first row is the widest at 2n - 1 and the last is narrowest, which matters if anything downstream sizes a field from the first line it reads. To separate the two, compare the lines in order, or assert that row i has exactly i - 1 leading spaces.

<!-- @doubt -->
### Is it really the same buffer as Pattern 7?

<!-- @answer -->
Character for character. Both patterns take their rows from S = (n - 1 spaces)(2n - 1 stars), which is 3n - 2 characters long. Pattern 7 reads windows starting at i - 1 with width n + i - 1; this pattern reads windows starting at n - i with width 2n - i. At n = 4 those are the same four windows — S[0:4], S[1:6], S[2:8], S[3:10] — visited in opposite orders. Verified for all 20,100 rows across n from 1 to 200 with no exceptions. Pattern 9's diamond is those two sweeps run back to back over that one string.

<!-- @doubt -->
### Which mistakes here does a star count actually catch?

<!-- @answer -->
One of five. Writing 2(n - i) stars instead of 2(n - i) + 1 changes the total and is caught at n = 1 by every check. The other four — shifting the pyramid right, dropping the leading spaces entirely, adding trailing spaces, and printing Pattern 7 instead — all leave the total at exactly n squared, and none of them is ever caught by a count at any size from 1 to 40. That is the same result Pattern 7 measured, and it is the reason this topic's checks have moved from counts to per-row assertions: row i has i - 1 leading spaces and 2(n - i) + 1 stars.

<!-- @doubt -->
### Should I write this as a separate function or reuse Pattern 7 with a flag?

<!-- @answer -->
Separate, and the reason is in the code rather than in taste. The difference is one expression per loop — i - 1 spaces instead of n - i, and 2(n - i) + 1 stars instead of 2i - 1 — so a shared function with a flag adds a branch inside the hot loop to save two lines. If you do want one routine for both, the honest shared form is the buffer version: build S once and pass in the window rule, since both patterns read the same string and only the traversal order differs.

<!-- @doubt -->
### Why is the window version barely faster here, as in Pattern 7?

<!-- @answer -->
For the same reason: the work it removes is not where the time is. It removes the per-row construction, but the output is about 1.5 n squared characters and every version writes all of them. Measured, the window is worth about 1.1x to 2.3x, shrinking as n grows, and in Python a flat 1.13x to 1.28x. Compare Patterns 3 and 6, where the equivalent move was worth 75x to 113x because it removed n(n+1)/2 number conversions. Here the items are single characters with nothing to convert, so only bytes remain.
