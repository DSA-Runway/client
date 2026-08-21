---
id: pattern-10-half-diamond-star-pattern
topic: Pattern Printing
title: Pattern 10 - Half Diamond Star Pattern
difficulty: Easy
status: ready
prerequisites:
  - pattern-9-diamond-star-pattern
  - pattern-2-right-angled-star-triangle
  - pattern-5-inverted-right-angled-star-triangle
  - nested-loops
relatedIds:
  - pattern-9-diamond-star-pattern
  - pattern-2-right-angled-star-triangle
  - pattern-5-inverted-right-angled-star-triangle
  - pattern-19-symmetric-void-pattern
  - nested-loops
---

<!-- @summary -->
Print rows growing to n stars and shrinking back — 2n-1 rows with a single middle, the exact opposite of Pattern 9's convention, and the pattern that explains the last three: with no leading spaces a row's length determines the row completely, so the row count and star count that were blind to half of Pattern 9's mistakes catch all four here.

<!-- @theory -->
## The problem

Print 2n - 1 rows: 1 star, then 2, up to n, then back down to 1.

```
n = 4      *
           **
           ***
           ****
           ***
           **
           *
```

## The middle row appears once

Pattern 9's diamond printed its widest row **twice**, giving 2n rows. This prints
it **once**, giving 2n - 1. Same-sounding shape, opposite convention, and the same
off-by-one is correct in one and wrong in the other.

| | Pattern 9 | This pattern |
|---|---|---|
| Rows | 2n | **2n - 1** |
| Widest row | twice | **once** |
| Stars | 2n² | **n²** |

Printing the middle twice here gives 2n rows and exactly **n more stars** — always,
verified for every n from 1 to 200. At n = 4 that is 8 rows and 20 stars against
the correct 7 and 16, and it is wrong on 40 of the 41 sizes from 0 to 40.

The shape itself is Pattern 2 followed by Pattern 5 with its first row dropped —
0 differences over n = 1 to 200.

## No spaces, and the checks come back

This is the first shape since Pattern 6 with **no leading whitespace at all**, and
it is worth measuring against Pattern 9 because it explains what went wrong there.
The smallest n at which each check notices, over n from 1 to 40:

| Mistake | Wrong on | Row count | Star count | Palindrome | Widest row = n |
|---|---|---|---|---|---|
| Middle row printed twice (2n rows) | 40/41 | n = 1 | n = 1 | never | never |
| Top half only (= Pattern 2) | 39/41 | n = 2 | n = 2 | n = 2 | never |
| Halves swapped (an hourglass) | 39/41 | **never** | n = 2 | never | never |
| Peak one short, never reaches n | 40/41 | n = 1 | n = 1 | never | n = 1 |

**The row count and the star count together catch all four.** In Pattern 9 those
same two checks caught neither the bowtie nor the shift.

The reason is the whitespace, and it is the point worth taking from this run of
patterns. Here every row is entirely stars, so a row's **length is the row** —
there is nothing a line can be except a run of that many stars, and a summary of
the lengths is a summary of the content. The moment leading spaces appear, length
stops determining content and position, and every count-based check goes blind at
once. That is exactly what Patterns 7, 8 and 9 measured.

Two things do not come back:

- **The palindrome test is still nearly useless** — it catches one of the four, and
  only at n = 2. A doubled middle, an hourglass and a truncated peak are all
  symmetric.
- **The hourglass still escapes the row count**, because reversing the two halves
  keeps 2n - 1 rows. Only the star total separates it, at n = 2, since the two
  halves here have different star counts unlike Pattern 9's.

## The totals

| | |
|---|---|
| Rows | 2n - 1 |
| Stars | **n²** — 16 at n = 4, 10,000 at n = 100 |
| Characters | also n², since there are no spaces |

Worth putting beside Pattern 7: the pyramid has the **same** n² stars but prints
about 1.5n² characters, because half its output is the spaces that place them.

## One buffer of n characters

Every row is a prefix of the middle row — verified across 40,000 rows from n = 1
to 200 with no exceptions. So the buffer is n stars, and both halves are prefixes
of it:

| | This pattern | Patterns 7, 8, 9 |
|---|---|---|
| Buffer | **n characters** | 3n - 2 |
| Row rule | a prefix, length 1..n..1 | a window, moving and resizing |

At n = 12,000 that is 12,000 characters against 35,998.

| n | Star at a time | Fresh row | Prefixes of one buffer |
|---|---|---|---|
| 2,000 | 40.61ms | 0.32ms | 0.20ms |
| 6,000 | 355.58ms | 2.11ms | 1.61ms |
| 12,000 | 1442.70ms | 9.96ms | 8.10ms |

The first step is worth **about 127x to 169x** and the buffer **1.2x to 1.6x** —
the same split Pattern 5 measured, for the same reason: single characters, nothing
to convert. In Python the buffer is worth nothing at all, 0.95x to 1.05x, because
slicing allocates exactly as repetition does. Pattern 5 measured that too.

<!-- @intuition -->
Read this one against Pattern 9 rather than on its own. Two shapes that look like the same idea disagree about their middle row, and no amount of staring at either picture settles it — the convention is part of the specification, not something the shape implies. The more useful half is what happens to checking. In every pattern with leading spaces, a line's length told you almost nothing, because the same length could be stars in the wrong place. Strip the spaces away and length becomes the whole content of a line, so counting lines and counting stars is suddenly a real test rather than a summary that a dozen wrong shapes also satisfy. That is not a fact about this pattern; it is the reason the previous three were hard to check.

<!-- @approach -->
### Star at a Time

<!-- @idea -->
Two loops, the first counting the row length up to n and the second counting back down from n minus one.

<!-- @steps -->
1. Loop k from one up to and including n.
2. Print k stars, then a newline.
3. Loop k from n minus one down to one.
4. Print k stars, then a newline.
5. The second loop starts at n minus one, which is what prints the middle row only once.

<!-- @complexity -->
- time: O(n^2) characters, and one stream operation per character
- space: O(1)
- note: The direct translation, and the version where the single middle row is visible as the second loop's starting value. Measured 1442.70ms at n = 12,000 against 9.96ms for building each row — about 127x to 169x across the sizes tested.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int k = 1; k <= n; k++) {
        for (int j = 1; j <= k; j++) cout << '*';
        cout << '\n';
    }
    for (int k = n - 1; k >= 1; k--) {
        for (int j = 1; j <= k; j++) cout << '*';
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 5: The loop counter is the row length directly, so there is no arithmetic to get wrong.
- 9: Starting at n - 1 is what makes the middle row appear once. Starting at n would give 2n rows, which is Pattern 9's convention.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int k = 1; k <= n; k++) {
        for (int j = 1; j <= k; j++) System.out.print('*');
        System.out.println();
    }
    for (int k = n - 1; k >= 1; k--) {
        for (int j = 1; j <= k; j++) System.out.print('*');
        System.out.println();
    }
}
```

<!-- @annotations -->
- 6: n - 1 rather than n, giving 2n - 1 rows in total rather than 2n.

<!-- @code python -->
```python
def pattern(n):
    for k in range(1, n + 1):
        for j in range(k):
            print("*", end="")
        print()
    for k in range(n - 1, 0, -1):
        for j in range(k):
            print("*", end="")
        print()


# The row lengths read 1, 2, ... n, ... 2, 1 — n appears once.
```

<!-- @annotations -->
- 6: range(n - 1, 0, -1) gives n-1 down to 1, so the middle row is not repeated and the last row is a single star.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Make each row by repetition and print it in one operation.

<!-- @steps -->
1. Loop k from one up to and including n, building a string of k stars.
2. Print it followed by a newline.
3. Loop k from n minus one down to one, building a string of k stars.
4. Print it followed by a newline.
5. Both inner loops disappear.

<!-- @complexity -->
- time: O(n^2) characters, 2n - 1 stream operations
- space: O(n) for the longest row
- note: Recovers essentially all the available speed — 9.96ms at n = 12,000 against 1442.70ms printing star by star. In Python this is already the practical optimum, since the buffer version measured 0.95x to 1.05x against it.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int k = 1; k <= n; k++) cout << string(k, '*') << '\n';
    for (int k = n - 1; k >= 1; k--) cout << string(k, '*') << '\n';
}
```

<!-- @annotations -->
- 6: One line per half. The whole pattern is two counted ranges, 1 up to n and n-1 back down to 1.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int k = 1; k <= n; k++) System.out.println("*".repeat(k));
    for (int k = n - 1; k >= 1; k--) System.out.println("*".repeat(k));
}
```

<!-- @annotations -->
- 3: The two ranges together give 2n - 1 rows and n squared stars.

<!-- @code python -->
```python
def pattern(n):
    for k in range(1, n + 1):
        print("*" * k)
    for k in range(n - 1, 0, -1):
        print("*" * k)


# n squared stars in total, the same as Pattern 7's pyramid — which
# prints about 1.5 n squared characters, the rest being spaces.
```

<!-- @annotations -->
- 4: The second range excludes n, which is the entire difference from Pattern 9's doubled middle.

<!-- @approach -->
### Prefixes of One Buffer

<!-- @idea -->
Build the middle row once and print prefixes of it, since every row is a prefix of the widest.

<!-- @steps -->
1. Guard against n being zero or less.
2. Build one string of n stars.
3. Loop k from one up to and including n, writing the first k characters.
4. Loop k from n minus one down to one, writing the first k characters.
5. Nothing is built or copied inside either loop.

<!-- @complexity -->
- time: O(n^2) characters written, one allocation in total
- space: O(n) — the buffer is n characters, against 3n - 2 for the pyramids
- note: The fastest here, modestly — 8.10ms against 9.96ms at n = 12,000, so 1.2x to 1.6x across the sizes tested. In Python it is worth nothing, at 0.95x to 1.05x, because a slice allocates just as repetition does. The same result Pattern 5 measured.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    string buf(n, '*');
    for (int k = 1; k <= n; k++) { cout.write(buf.data(), k); cout << '\n'; }
    for (int k = n - 1; k >= 1; k--) { cout.write(buf.data(), k); cout << '\n'; }
}
```

<!-- @annotations -->
- 7: The middle row, built once. Every row of both halves is a prefix of it — checked across 40,000 rows with no exceptions.
- 8: Writes the first k characters. With no spaces to place, the prefix length is simply the row length.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    StringBuilder buf = new StringBuilder("*".repeat(n));
    for (int k = 1; k <= n; k++) System.out.println(buf.substring(0, k));
    for (int k = n - 1; k >= 1; k--) System.out.println(buf.substring(0, k));
}
```

<!-- @annotations -->
- 2: Only negative n needs this here, since the count is n rather than n - 1 and repeat(0) is legal. Patterns 7 to 9 needed the same guard at n = 0 as well.

<!-- @code python -->
```python
def pattern(n):
    buf = "*" * n
    for k in range(1, n + 1):
        print(buf[:k])
    for k in range(n - 1, 0, -1):
        print(buf[:k])


# Correct, and no faster: measured 0.95x to 1.05x against "*" * k
# per row, since a slice allocates too.
```

<!-- @annotations -->
- 2: No guard needed in Python, since "*" * 0 is the empty string and the loops then do not run.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
Seven rows of 1, 2, 3, 4, 3, 2 and 1 stars — sixteen stars

<!-- @why -->
Small enough to count by hand, and it fixes the row count at 2n minus one rather than 2n.

<!-- @walkthrough -->
1. The first loop runs k from 1 to 4, printing 1, 2, 3 and 4 stars.
2. The second loop runs k from 3 down to 1, printing 3, 2 and 1 stars.
3. The four-star row appears only once, because the second loop starts at n minus one.
4. That gives 2n minus one rows, which is 7.
5. The total is 1 + 2 + 3 + 4 + 3 + 2 + 1, which is 16, and that is n squared.
6. There are no spaces, so the character count is also 16.
7. Pattern 7's pyramid has the same 16 stars at this size but prints 22 characters, the extra 6 being spaces.

<!-- @example -->

<!-- @input -->
The middle row printed twice, at n = 4

<!-- @output -->
Eight rows and twenty stars — Pattern 9's convention applied here

<!-- @why -->
The single most common mistake in this pattern, and it is another pattern's correct behaviour.

<!-- @walkthrough -->
1. Writing the second loop from n rather than n minus one repeats the widest row.
2. That gives 2n rows and n more stars than it should, every time.
3. At n = 4 it is 8 rows and 20 stars against the correct 7 and 16.
4. The difference is exactly n, verified for every n from 1 to 200.
5. Measured over n from 0 to 40 it is wrong on 40, passing only at n = 0.
6. Both the row count and the star count catch it at n = 1.
7. A symmetry check does not, since a doubled middle is still a palindrome.

<!-- @example -->

<!-- @input -->
The same four checks, run here and on Pattern 9

<!-- @output -->
All four caught here by rows and stars; two escaped both in Pattern 9

<!-- @why -->
Isolates whitespace as the reason the previous three patterns were hard to check.

<!-- @walkthrough -->
1. Here every row is entirely stars, so a row's length is the row itself.
2. A doubled middle, a missing half and a truncated peak all change the row count or the star count, and are caught at n = 1 or n = 2.
3. Swapping the halves keeps 2n minus one rows, so the row count misses it, but the star total catches it at n = 2.
4. So the row count and the star count between them catch all four mistakes measured.
5. In Pattern 9 the same two checks missed the bowtie and missed a diamond shifted one column right, at every size tested.
6. The difference is that there, a line of a given length could be stars in the wrong place.
7. Once leading spaces exist, length stops determining content, and every count-based check loses its grip at once.

<!-- @example -->

<!-- @input -->
n = 12,000, from one buffer

<!-- @output -->
12,000 characters generating 23,999 rows

<!-- @why -->
Contrasts the buffer this shape needs with the one the pyramids needed, and records what it is worth.

<!-- @walkthrough -->
1. Every row is a prefix of the middle row, verified across 40,000 rows from n = 1 to 200.
2. So the buffer is n stars, against 3n minus 2 for Patterns 7, 8 and 9.
3. At n = 12,000 that is 12,000 characters rather than 35,998.
4. The prefix length is simply the row length, since there are no spaces to place.
5. Measured, the buffer is worth 1.2x to 1.6x over building each row.
6. Not printing star by star is worth about 127x to 169x, so that remains the step that matters.
7. In Python the buffer is worth nothing at all, 0.95x to 1.05x, because a slice allocates exactly as repetition does.

<!-- @visualization custom -->

<!-- @description -->
Put this pattern and Pattern 9 side by side from the first frame, since the comparison is the content. Fill both grids in step, and at the moment each reaches its widest row, hold — Pattern 9 emits it, pauses, emits it again; this one emits it and immediately turns. Label the two counters 2n and 2n - 1 and let them diverge by exactly one at that beat. Beneath each grid keep a live star counter reading 2n squared and n squared, and a third readout showing the difference between the correct output here and the doubled-middle version, pinned at exactly n. Then the check panel, which should be built as a direct rerun of Pattern 9's: the same five lamps — row count, star count, palindrome, widest row, exact — over four candidates: correct, doubled middle, halves swapped, peak one short. Run the identical panel over Pattern 9's four candidates alongside, so the reader sees the row and star lamps turning red here where they stayed green there. Annotate the difference with a single strip: a row of this pattern rendered as pure stars, and a row of Pattern 9 rendered as ghost cells plus stars, with the caption a length is a row only when there is nothing else in it. Close with a buffer comparison rather than a timing panel: two strips, one of n cells and one of 3n - 2, with the prefix cursor on the first sweeping 1 to n and back, and the window bracket on the second moving and resizing — labelled 12,000 characters against 35,998 at n = 12,000, with the small time note that the buffer is worth 1.2x to 1.6x in C++ and nothing in Python.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"*\n**\n***\n****\n***\n**\n*\n","rows":7,"rowFormula":"2n - 1","rowLengths":[1,2,3,4,3,2,1],"stars":16,"starFormula":"n^2","charsPrinted":16,"charsEqualStars":true,"widestRow":4,"widestAppearsOnce":true},"conventionVsPattern9":{"pattern9":{"rows":"2n","widestRow":"twice","stars":"2n^2"},"thisPattern":{"rows":"2n - 1","widestRow":"once","stars":"n^2"},"doubledMiddleHere":{"rowsAtN4":8,"starsAtN4":20,"correctRowsAtN4":7,"correctStarsAtN4":16,"starDifference":"exactly n, verified n = 1..200","wrongOn":"40 of 41","correctAt":[0]}},"composition":{"claim":"Pattern 2 followed by Pattern 5 with its first row dropped","verifiedOver":"n = 1..200, 0 differences"},"totals":{"stars":{"n4":16,"n10":100,"n100":10000},"chars":{"n4":16,"n10":100,"n100":10000},"vsPattern7":"the pyramid has the same n^2 stars but prints about 1.5 n^2 characters, the rest being spaces"},"bugPanel":{"variants":[{"name":"middle row printed twice (2n rows)","wrongOn":"40 of 41","correctAt":[0]},{"name":"top half only (= Pattern 2)","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"halves swapped (an hourglass)","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"peak one short, never reaches n","wrongOn":"40 of 41","correctAt":[0]}]},"checkPanel":{"columns":["row count","star count","palindrome","widest row = n"],"smallestNThatCatches":{"middle row twice":[1,1,"never","never"],"top half only":[2,2,2,"never"],"halves swapped":["never",2,"never","never"],"peak one short":[1,1,"never",1]},"reading":["the row count and the star count together catch all four","in Pattern 9 those same two caught neither the bowtie nor the shift","with no leading spaces a row's length is the row, so a summary of lengths is a summary of content","the palindrome test still catches one of four, and only at n = 2","the hourglass keeps 2n - 1 rows, so only the star total separates it"]},"whitespaceLesson":"once leading spaces exist, length stops determining content and position, and every count-based check goes blind at once — which is what Patterns 7, 8 and 9 measured","assertions":["there are exactly 2n - 1 rows","the row lengths read 1,2,...,n,...,2,1 in that order","total stars equal n^2","no line contains anything but stars"],"buffer":{"thisPattern":{"size":"n characters","rule":"a prefix, length 1..n..1"},"patterns789":{"size":"3n - 2 characters","rule":"a window, moving and resizing"},"atN12000":{"thisPattern":12000,"patterns789":35998},"everyRowPrefixOfMiddleRow":true,"rowsChecked":40000,"exceptions":0,"over":"n = 1..200"},"buildPanel":[{"n":2000,"starAtATimeMs":40.61,"freshRowMs":0.32,"prefixesMs":0.20},{"n":6000,"starAtATimeMs":355.58,"freshRowMs":2.11,"prefixesMs":1.61},{"n":12000,"starAtATimeMs":1442.70,"freshRowMs":9.96,"prefixesMs":8.10}],"ratios":{"perCharToFreshRow":"about 127x to 169x","freshRowToPrefixes":"1.2x to 1.6x"},"python":{"perCharToRepetition":"322x to 694x","repetitionToSlice":"0.95x to 1.05x, no gain","why":"a slice allocates just as repetition does, the same result Pattern 5 measured"}}
```

<!-- @highlights -->
- This pattern and Pattern 9 sit side by side from the first frame, since the comparison is the content.
- Both grids fill in step, and each holds at the moment it reaches its widest row.
- Pattern 9 emits the widest row, pauses, and emits it again; this one emits it and immediately turns.
- Two counters labelled 2n and 2n - 1 diverge by exactly one at that beat.
- Live star counters beneath each grid read 2n squared and n squared.
- A third readout shows the difference between the correct output here and the doubled-middle version, pinned at exactly n.
- The check panel reruns Pattern 9's: the same five lamps over four candidates.
- The candidates are correct, doubled middle, halves swapped, and peak one short.
- Pattern 9's four candidates run under the identical panel alongside.
- The row and star lamps turn red here where they stayed green there.
- A single strip annotates the difference: a row of pure stars beside a row of ghost cells plus stars.
- Its caption reads a length is a row only when there is nothing else in it.
- The close is a buffer comparison rather than a timing panel: strips of n cells and of 3n - 2.
- A prefix cursor sweeps the first strip 1 to n and back, while a window bracket moves and resizes on the second.
- The strips are labelled 12,000 characters against 35,998 at n = 12,000.
- A small note records that the buffer is worth 1.2x to 1.6x in C++ and nothing in Python.

<!-- @edgeCases -->
- n equal to zero — no output, and unlike Patterns 7 to 9 the buffer version is safe without its guard here, since the count is n rather than n - 1.
- n equal to one — a single star and a single row, since the second loop does not run at all.
- n equal to two — three rows reading 1, 2, 1, and the smallest input that separates this from a doubled middle.
- Negative n — no output, but the buffer version genuinely needs its guard: a negative count throws in C++ and Java, where the loop versions simply do not run.
- The middle row — n stars, appearing exactly once, which is the opposite of Pattern 9's convention.
- The second loop's start — n minus one, and setting it to n is the mistake that produces Pattern 9's row count here.
- Very large n — n squared characters, so n of ten thousand is a hundred million.
- No leading or trailing whitespace anywhere — every line is a run of stars and nothing else.
- A caller expecting a centred shape — that is Pattern 9, whose rows carry leading spaces.
- A caller expecting the widest rows first — that is an hourglass, which keeps 2n minus one rows and is caught only by the star total.

<!-- @pitfalls -->
- Starting the second loop at n rather than n minus one. That repeats the middle row, giving 2n rows and exactly n extra stars — Pattern 9's convention, and wrong here on 40 of 41 sizes.
- Assuming the middle convention from the picture. Patterns 9 and 10 disagree about it, and nothing in either shape settles the question — it is part of the specification.
- Testing the output for symmetry. It catches one of the four mistakes measured and only at n = 2; a doubled middle, an hourglass and a truncated peak are all palindromes.
- Checking only the row count. Swapping the halves keeps 2n minus one rows, so only the star total catches the hourglass.
- Carrying over the assumption that counts are useless. They failed in Patterns 7 to 9 because of the leading spaces; here they catch all four mistakes.
- Expecting the pyramid's buffer. This shape needs n characters, not 3n minus 2, because the rows are prefixes rather than windows.
- Assuming the star total differs from Pattern 7's. Both are n squared; what differs is the character count, since the pyramid also prints about half as many spaces again.
- Printing star by star at scale. Measured about 127x to 169x slower than building each row.
- Expecting the buffer version to help in Python. It measured 0.95x to 1.05x, since a slice allocates just as repetition does.
- Adding trailing spaces to pad the rows to width n. Invisible on screen and rejected by an exact comparison.

<!-- @doubt -->
### Does the middle row appear once or twice?

<!-- @answer -->
Once here, which is why the pattern has 2n - 1 rows. Pattern 9's diamond takes the opposite convention and prints its widest row twice for 2n rows. Nothing about either picture settles which is right — it is part of the specification, and the two patterns simply disagree. Getting it wrong here means starting the second loop at n instead of n - 1, which adds one row and exactly n stars: 8 rows and 20 stars at n = 4 against the correct 7 and 16, and wrong on 40 of the 41 sizes from 0 to 40.

<!-- @doubt -->
### Pattern 9 said counting was useless. Why does it work here?

<!-- @answer -->
Because there are no leading spaces. Every row here is entirely stars, so a row's length *is* the row — a line of length k can only be k stars — and a summary of the lengths is therefore a summary of the content. Measured, the row count and the star count between them catch all four mistakes tested. In Pattern 9 the same two checks missed the bowtie and missed a diamond shifted one column right, at every size, because there a line of a given length could be stars in the wrong place. That is the general rule: whitespace decouples length from content, and every count-based check loses its grip at the same moment.

<!-- @doubt -->
### Is the symmetry check useful here?

<!-- @answer -->
Barely. Reversing the lines and comparing catches one of the four mistakes measured, and only at n = 2. A doubled middle row is still a palindrome, an hourglass is still a palindrome, and a version whose peak stops one short is still a palindrome. That is the same result Pattern 9 got. Symmetry tells you a shape is symmetric, not which symmetric shape it is — and both of these patterns have several wrong answers that are symmetric. Use the row count and the star total, or compare the lengths in order against 1, 2, up to n and back.

<!-- @doubt -->
### How many stars is this, and how does it compare to the pyramid?

<!-- @answer -->
Exactly n² — 16 at n = 4 and 10,000 at n = 100, verified for every n from 1 to 200. That is the same total as Pattern 7's pyramid, which is worth noticing because the two look nothing alike. The difference is in what else gets printed: this pattern has no spaces, so its character count is also n², while the pyramid prints about 1.5n² characters because half again as many are the spaces placing the stars. So a star count cannot distinguish them; a character count can.

<!-- @doubt -->
### Why is the buffer smaller than the one Patterns 7 to 9 used?

<!-- @answer -->
Because the rows here are prefixes rather than windows. Every row is a prefix of the middle row — verified across 40,000 rows from n = 1 to 200 with no exceptions — so one string of n stars serves the whole pattern, and the prefix length is simply the row length. The pyramids needed 3n - 2 characters because their rows were windows that both moved and resized over a run of spaces followed by a run of stars. At n = 12,000 that is 12,000 characters here against 35,998 there.

<!-- @doubt -->
### Is the buffer version worth using?

<!-- @answer -->
In C++, mildly — 1.2x to 1.6x over building each row, measured at n = 2,000, 6,000 and 12,000. In Python, no: it measured 0.95x to 1.05x, because `buf[:k]` allocates a new string exactly as `"*" * k` does. Pattern 5 measured the same thing for the same reason. The step that matters in both languages is not printing star by star, which is worth about 127x to 169x in C++ and 322x to 694x in Python. Reach for that first and stop there unless the profile says otherwise.
