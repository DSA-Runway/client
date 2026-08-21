---
id: pattern-15-reverse-letter-triangle
topic: Pattern Printing
title: Pattern 15 - Reverse Letter Triangle
difficulty: Easy
status: ready
prerequisites:
  - pattern-14-increasing-letter-triangle
  - pattern-5-inverted-right-angled-star-triangle
  - type-conversion-and-casting
  - nested-loops
relatedIds:
  - pattern-14-increasing-letter-triangle
  - pattern-6-inverted-right-angled-number-triangle
  - pattern-16-alpha-ramp-pattern
  - pattern-17-alpha-hill-pattern
  - nested-loops
---

<!-- @summary -->
Print letter rows shrinking from the full alphabet down to a single A — Pattern 14 upside down, sharing its buffer read backwards, where the alphabet overrun now lands in the very first line instead of the twenty-seventh, and where the whole valid output is 702 bytes so none of this topic's performance results apply.

<!-- @theory -->
## The problem

Print n rows where row i holds the first n - i + 1 letters of the alphabet.

```
n = 5      A B C D E
           A B C D
           A B C
           A B
           A
```

## Pin down which reversal is meant

"Reverse letter triangle" describes two different shapes, and they are not the
same one:

```
rows shrink, each still starting at A     letters count down from the row's top
A B C D                                   D C B A
A B C                                     C B A
A B                                       B A
A                                         A
```

This container takes the first. Measured, the two agree only at n = 0 and n = 1 —
so they are distinguishable from n = 2, and choosing wrongly is not something a
small test will reveal. That is worth settling from the statement rather than from
the picture, exactly as the middle-row question was in Patterns 9 and 10.

## It is Pattern 14 with the lines reversed

Verified byte-identical for every n from 0 to 26. Which means the totals are the
same, and the order-blind checks fail again:

| n | Letters | Characters | Sorted line lengths |
|---|---|---|---|
| 4 | 10 | 16 | identical to Pattern 14 |
| 10 | 55 | 100 | identical |
| 26 | 351 | 676 | identical |

So a letter count, a character count, or a multiset of line lengths cannot tell
this pattern from Pattern 14. That is the same result Pattern 5 measured against
Pattern 2 and Pattern 6 against Pattern 3. The cheap assertion here is that the
**first row holds all n letters** — Pattern 14's first row always holds one.

## The same buffer, prefixes taken the other way

Pattern 14 built one alphabet row and printed growing prefixes of it. This prints
the same prefixes of the same buffer, longest first:

```
n = 5      B = "A B C D E"          2n - 1 characters

Pattern 14 prefix lengths   1, 3, 5, 7, 9
Pattern 15 prefix lengths   9, 7, 5, 3, 1
```

Row i is `B[:2(n-i+1)-1]`, verified across all 351 rows of every n from 1 to 26
with no exceptions. It is the Pattern 7 and 8 relationship again: one object, two
traversal orders.

## The alphabet overrun now lands in line one

Pattern 14 has the same hard ceiling — 26 letters — and the same silence past it.
What changes is **where you see it**:

| n | First row containing a non-letter, Pattern 14 | Here |
|---|---|---|
| 26 | none | none |
| 27 | row 27 | **row 1** |
| 30 | row 27 | **row 1** |
| 40 | row 27 | **row 1** |

Pattern 14's longest row is last, so an out-of-range n corrupts only the bottom of
the output and the first 26 rows look perfect. Here the longest row is first, so
the damage is the first thing printed.

That is a small mercy and worth naming: the same bug is far more discoverable in
this pattern than in its twin. The precondition is unchanged — **1 <= n <= 26** —
and still has to be stated, because nothing raises either way.

## None of this topic's performance results apply here

Worth being blunt about, because thirteen containers of timing tables invite the
opposite conclusion. The entire valid output is **n² + n bytes**:

| n | Rows | Letters | Bytes including newlines |
|---|---|---|---|
| 10 | 10 | 55 | 110 |
| 20 | 20 | 210 | 420 |
| **26** | 26 | 351 | **702** |

At the largest input this pattern accepts, the whole job is 702 bytes. Measured
there, in microseconds per run:

| n | Letter at a time | Fresh row | One buffer |
|---|---|---|---|
| 10 | 1.94us | 0.74us | 0.42us |
| 20 | 7.22us | 2.79us | 0.92us |
| **26** | **11.94us** | **4.56us** | **1.20us** |

The ordering still holds — about 10x from slowest to fastest at n = 26 — but the
slowest is twelve microseconds. Python is the same shape at 170.48us, 42.41us and
11.68us.

For contrast, the same three functions at n = 6,000, which is not a letter
triangle at all: 599.97ms, 134.13ms and 2.30ms, a gap of **261x**. That gap is
real and it exists only at sizes this pattern is not defined for.

So here the three approaches are a lesson in code shape, and the choice between
them is about which reads best.

<!-- @intuition -->
Two patterns that differ only in the order of their rows can differ a lot in how a mistake presents itself, and that is the thing worth taking from this one. The alphabet ceiling is identical in both, but Pattern 14 hides it under twenty-six good rows while this one puts it on the first line — same defect, very different chance of being noticed. The other half is a correction to a habit this topic has been building. Thirteen patterns of measuring things at n in the thousands makes it easy to keep optimising by reflex; here the problem statement caps n at twenty-six and the entire answer is under a kilobyte, so the only honest reason to prefer one version is that it is clearer.

<!-- @approach -->
### Letter at a Time

<!-- @idea -->
Nested loops where the row's width counts down and the letter comes from the column counter.

<!-- @steps -->
1. Loop over the rows from one up to and including n, with n at most 26.
2. This row holds n minus the row index plus one letters.
3. Loop the inner counter from zero up to that limit.
4. Print a space first if this is not the first letter, then the character 'A' plus the inner counter.
5. Print a newline after the inner loop finishes.

<!-- @complexity -->
- time: O(n^2) letters, with one stream operation per letter and per separator
- space: O(1)
- note: The direct translation. Measured 11.94 microseconds at n = 26, the largest valid input, against 1.20 for the buffer version — the ordering holds but the whole job is twelve microseconds, so this is a readability choice rather than a performance one.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 0; j < n - i + 1; j++) {
            if (j) cout << ' ';
            cout << char('A' + j);
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: The width counts down while the letter still comes from j, so every row restarts at A.
- 8: 'A' + j, unchanged from Pattern 14 — and nothing here checks that j stays under 26.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 0; j < n - i + 1; j++) {
            if (j > 0) System.out.print(' ');
            System.out.print((char) ('A' + j));
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 3: Writing n - i instead of n - i + 1 loses the last row, which is the single A.
- 5: The letter tracks the column, not the row, so the rows shrink from the right.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for j in range(n - i + 1):
            if j > 0:
                print(" ", end="")
            print(chr(ord("A") + j), end="")
        print()


# Every row still starts at A. Counting the letters down from the
# row's highest is a different shape, and the two differ from n = 2.
```

<!-- @annotations -->
- 3: range(n - i + 1) gives this row's letter count. Counting the outer loop down removes the arithmetic entirely.
- 6: Defined only for n up to 26; past that this leaves the alphabet without raising, and here it does so on the very first row.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Count the outer loop down so the loop variable is the row's width, then build and print each row in one operation.

<!-- @steps -->
1. Loop the width from n down to one.
2. Start an empty row string.
3. Append the letter for each column, with a separator before all but the first.
4. Print the finished row followed by a newline.
5. The width is the loop variable, so there is no arithmetic left in the body.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations, still one append per letter
- space: O(n) for the longest row, which is the first one
- note: Measured 4.56 microseconds at n = 26. Counting down is worth preferring on its own: the loop variable becomes the letter count, so the n - i + 1 expression disappears and with it one place for an off-by-one.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int width = n; width >= 1; width--) {
        string row;
        for (int j = 0; j < width; j++) {
            if (j) row += ' ';
            row += char('A' + j);
        }
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 6: Counting down makes width the row's letter count directly, so nothing inside the loop needs to compute it.
- 10: One append per letter. The letters differ from cell to cell, so no single repetition builds this row.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int width = n; width >= 1; width--) {
        StringBuilder row = new StringBuilder();
        for (int j = 0; j < width; j++) {
            if (j > 0) row.append(' ');
            row.append((char) ('A' + j));
        }
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 2: The loop stops at 1, not 0 — the last row is a single A, not an empty line.

<!-- @code python -->
```python
def pattern(n):
    for width in range(n, 0, -1):
        print(" ".join(chr(ord("A") + j) for j in range(width)))


# range(n, 0, -1) gives n, n-1, ... 1 — the row widths in order,
# which is the whole pattern.
```

<!-- @annotations -->
- 2: The three-argument range counts down and stops before 0, so the last width is 1 rather than 0.

<!-- @approach -->
### One Buffer, Prefixes Shrinking

<!-- @idea -->
Build the alphabet row once and print prefixes of it from longest to shortest.

<!-- @steps -->
1. Guard against a non-positive n, since the buffer is built before the loop.
2. Build one string holding the first n letters separated by spaces.
3. Loop the width from n down to one.
4. Write the first 2 times width, minus one, characters of the buffer.
5. Print a newline after each.

<!-- @complexity -->
- time: O(n^2) characters written, one pass to build the buffer, no per-cell work in the printing loop
- space: O(n) — the buffer is 2n - 1 characters, the same one Pattern 14 builds
- note: The fastest here, at 1.20 microseconds against 11.94 at n = 26 — about 10x, on a job that takes twelve microseconds either way. The same functions at n = 6,000 differ by 261x, but that size is not a letter triangle. Write this one because it states the structure, not because it is fast.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    string alphabet;
    alphabet.reserve(2 * n);
    for (int j = 0; j < n; j++) {
        if (j) alphabet += ' ';
        alphabet += char('A' + j);
    }
    for (int width = n; width >= 1; width--) {
        cout.write(alphabet.data(), 2 * width - 1);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 7: The first row, built once. Character for character, this is the buffer Pattern 14 builds.
- 14: The same prefixes as Pattern 14, taken longest first — 9, 7, 5, 3, 1 where that pattern takes 1, 3, 5, 7, 9.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    StringBuilder alphabet = new StringBuilder();
    for (int j = 0; j < n; j++) {
        if (j > 0) alphabet.append(' ');
        alphabet.append((char) ('A' + j));
    }
    for (int width = n; width >= 1; width--) {
        System.out.println(alphabet.substring(0, 2 * width - 1));
    }
}
```

<!-- @annotations -->
- 9: substring copies in Java, so the structure is stated clearly but a per-row allocation remains.

<!-- @code python -->
```python
def pattern(n):
    alphabet = " ".join(chr(ord("A") + j) for j in range(n))
    for width in range(n, 0, -1):
        print(alphabet[: 2 * width - 1])


# The same buffer Pattern 14 builds, with the prefixes taken from
# longest to shortest instead of shortest to longest.
```

<!-- @annotations -->
- 2: One string for the whole pattern. No guard is needed in Python, since range of a non-positive n is empty.
- 4: 2 * width - 1 characters exactly, because a letter is always one character wide.

<!-- @example -->

<!-- @input -->
n = 5

<!-- @output -->
A B C D E, then one letter shorter each row down to a single A

<!-- @why -->
Small enough to read at a glance, and it shows the first row carrying the full alphabet run, which is where the overrun would appear.

<!-- @walkthrough -->
1. Row 1 holds n minus 1 plus 1, so 5, letters — A through E.
2. Row 2 holds 4, then 3, then 2, then 1.
3. Every row starts at A, because the letter comes from the column counter and not from the row.
4. The letter total is 5 + 4 + 3 + 2 + 1, which is 15 — the same n(n+1)/2 as Pattern 14.
5. Row i is 2 times its width, minus one, characters long, since a letter is one character.
6. Every row is a prefix of the first row, which is the buffer the fast version uses.
7. At n = 27 that first row would already contain a non-letter, which is the difference from Pattern 14.

<!-- @example -->

<!-- @input -->
n = 27, compared against Pattern 14 at the same size

<!-- @output -->
The bad character is in line 1 here, and in line 27 there

<!-- @why -->
The same defect with very different visibility, which is the practical difference between the two patterns.

<!-- @walkthrough -->
1. Both patterns have the same ceiling, since both draw from the 26 letters of the alphabet.
2. Pattern 14's rows grow, so only its longest rows can run past Z.
3. At n = 27, 30 or 40, the first row of Pattern 14 containing a non-letter is always row 27.
4. So the first 26 rows look perfect and an out-of-range n corrupts only the bottom of the output.
5. Here the rows shrink, so the longest row is printed first.
6. At the same sizes, the first row containing a non-letter is always row 1.
7. Neither version raises, so the precondition n at most 26 still has to be written down — but this one is far likelier to be noticed.

<!-- @example -->

<!-- @input -->
The whole output at the largest valid n

<!-- @output -->
702 bytes, produced in about twelve microseconds by the slowest version

<!-- @why -->
Corrects an expectation this topic has been building, by putting the pattern's real scale next to its timing table.

<!-- @walkthrough -->
1. The output is n squared plus n bytes, counting the newlines.
2. At n = 26, the largest valid input, that is 702 bytes over 26 rows.
3. Measured at that size, printing letter by letter takes 11.94 microseconds.
4. Building each row takes 4.56, and the buffer version 1.20.
5. So the ordering from the earlier patterns holds, at about 10x from slowest to fastest.
6. But the absolute cost is twelve microseconds for the worst version, on the largest input the problem admits.
7. The same three functions differ by 261x at n = 6,000 — a size that is not a letter triangle at all.

<!-- @example -->

<!-- @input -->
The other reading of the name, at n = 4

<!-- @output -->
D C B A instead of A B C D — and identical at n = 1

<!-- @why -->
A specification ambiguity rather than a bug, and the kind that a one-row test will not surface.

<!-- @walkthrough -->
1. One reading shrinks the rows while every row still begins at A.
2. The other counts the letters down from each row's highest, so row 1 reads D C B A.
3. Both descriptions fit the name reverse letter triangle.
4. Measured, the two agree only at n = 0 and n = 1.
5. From n = 2 they differ on every size, so a small check will not reveal which was meant.
6. This container takes the first reading, matching Pattern 14 with its rows reversed.
7. The habit worth keeping is the one Patterns 9 and 10 established: settle the convention from the statement, not from the picture.

<!-- @visualization custom -->

<!-- @description -->
Open on Pattern 14's grid and rotate it on a hinge into this one, holding three readouts beneath both states — letter count, character count, sorted line lengths — all three staying identical through the rotation while the ordered lengths reverse. Put an assertion chip beside them reading first row holds n letters, green here and red on Pattern 14 from n = 2. Then the shared buffer: one alphabet strip of 2n-1 characters with two prefix cursors, Pattern 14's growing 1, 3, 5, 7, 9 and this one's shrinking 9, 7, 5, 3, 1, stepping in opposite directions over the same strip. The centre of the figure is the overrun comparison. Place the two grids side by side at n = 27 with the alphabet ruler above each, and let the pointer run off the end of the ruler in both — then mark where the damage lands: row 27 in Pattern 14, drawn far down a column of twenty-six clean rows, and row 1 here, drawn at the very top. Colour only the affected cells and keep an error lamp dark beside both, labelled nothing raises in either. That contrast — same defect, opposite visibility — is what the figure is for. Close with the scale panel, which should deliberately undercut the timing bars used everywhere else in this topic: draw the entire n = 26 output as a single small block labelled 702 bytes, with three microsecond bars beside it reading 11.94, 4.56 and 1.20, and behind them a greyed pair of bars from n = 6,000 reading 599.97ms and 2.30ms, struck through and labelled not a letter triangle.

<!-- @sampleInput -->
```json
{"primary":{"n":5,"output":"A B C D E\nA B C D\nA B C\nA B\nA\n","rows":5,"lettersPerRow":[5,4,3,2,1],"letters":15,"formula":"n(n+1)/2","rowWidth":"n - i + 1 letters","rowByteLength":"2 * width - 1","valueRule":"'A' + j, from the column counter"},"nameAmbiguity":{"thisContainer":"rows shrink, each still starting at A","otherReading":"letters count down from each row's highest","atN4":{"thisContainer":["A B C D","A B C","A B","A"],"otherReading":["D C B A","C B A","B A","A"]},"agreeAt":[0,1],"distinguishableFrom":2,"guidance":"settle it from the statement, not from the picture"},"relationToPattern14":{"claim":"this is Pattern 14 with its lines reversed","verifiedOver":"n = 0..26, 0 differences","identicalTotals":{"n4":{"letters":10,"chars":16},"n10":{"letters":55,"chars":100},"n26":{"letters":351,"chars":676}},"sortedLineLengthsIdentical":true,"cheapestAssertion":"the first row holds all n letters; Pattern 14's first row always holds one"},"sharedBuffer":{"B":"the first n letters, space separated","length":"2n - 1","pattern14Rule":"row i = B[:2i-1]","pattern15Rule":"row i = B[:2(n-i+1)-1]","verified":"351 rows over n = 1..26, 0 mismatches","n5":{"B":"A B C D E","pattern14PrefixLengths":[1,3,5,7,9],"pattern15PrefixLengths":[9,7,5,3,1]}},"domain":{"validRange":"1 <= n <= 26","reason":"the alphabet supplies exactly 26 letters","enforcement":"none — nothing raises in either pattern","overrunVisibility":[{"n":26,"pattern14FirstBadRow":null,"pattern15FirstBadRow":null},{"n":27,"pattern14FirstBadRow":27,"pattern15FirstBadRow":1},{"n":30,"pattern14FirstBadRow":27,"pattern15FirstBadRow":1},{"n":40,"pattern14FirstBadRow":27,"pattern15FirstBadRow":1}],"reading":"Pattern 14's longest row is last so its first 26 rows look perfect; here the longest row is first, so the damage is the first thing printed"},"assertions":["there are exactly n rows","row i holds exactly n - i + 1 letters","row i begins with A and the letters ascend by one","the first row holds all n letters","n is at most 26"],"scale":{"outputBytes":"n^2 + n","atN10":110,"atN20":420,"atN26":702,"reading":"the entire valid output fits in under a kilobyte, whatever the approach"},"buildPanel":{"unit":"microseconds per run, at the sizes this pattern is defined for","rows":[{"n":10,"letterAtATimeUs":1.94,"freshRowUs":0.74,"bufferUs":0.42},{"n":20,"letterAtATimeUs":7.22,"freshRowUs":2.79,"bufferUs":0.92},{"n":26,"letterAtATimeUs":11.94,"freshRowUs":4.56,"bufferUs":1.20}],"pythonAtValidSizes":[{"n":10,"letterAtATimeUs":28.01,"joinUs":10.62,"sliceUs":5.02},{"n":20,"letterAtATimeUs":102.68,"joinUs":28.36,"sliceUs":9.17},{"n":26,"letterAtATimeUs":170.48,"joinUs":42.41,"sliceUs":11.68}],"pastTheAlphabet":{"n":6000,"letterAtATimeMs":599.97,"freshRowMs":134.13,"bufferMs":2.30,"ratio":"261x","caveat":"not a letter triangle; included only to show where the gap that dominates this topic actually lives"}},"lesson":"the ordering holds at n = 26 — about 10x from slowest to fastest — but the slowest is twelve microseconds, so the choice is about which version reads best"}
```

<!-- @highlights -->
- Pattern 14's grid rotates on a hinge into this one, with three readouts held beneath both states.
- Letter count, character count and sorted line lengths all stay identical through the rotation.
- Only the ordered line lengths reverse.
- An assertion chip reads first row holds n letters, green here and red on Pattern 14 from n = 2.
- One alphabet strip of 2n-1 characters carries two prefix cursors.
- Pattern 14's cursor grows 1, 3, 5, 7, 9 while this one's shrinks 9, 7, 5, 3, 1, over the same strip.
- The centre places the two grids side by side at n = 27 with an alphabet ruler above each.
- The pointer runs off the end of the ruler in both.
- The damage lands at row 27 in Pattern 14, far down a column of twenty-six clean rows.
- Here it lands at row 1, at the very top.
- Only the affected cells are coloured, and an error lamp stays dark beside both, labelled nothing raises in either.
- Same defect, opposite visibility — that contrast is what the figure is for.
- The scale panel deliberately undercuts the timing bars used elsewhere in this topic.
- The entire n = 26 output is drawn as one small block labelled 702 bytes.
- Three microsecond bars beside it read 11.94, 4.56 and 1.20.
- Behind them, a greyed pair from n = 6,000 reads 599.97ms and 2.30ms, struck through and labelled not a letter triangle.

<!-- @edgeCases -->
- n equal to zero — no output, and the buffer version needs its guard since it builds a string before looping.
- n equal to one — a single A, and the only size at which the two readings of the name agree.
- n equal to two — the smallest input that separates the two readings, and the smallest worth testing.
- n equal to twenty-six — the largest valid input; the first row runs A through Z and the whole output is 702 bytes.
- n equal to twenty-seven — the first invalid input, and here the bad character is in line 1 rather than line 27.
- Negative n — no output from the loop versions; the buffer versions need the guard.
- The first row — all n letters, and the cheapest single thing to assert.
- The last row — a single A, and the row that disappears if the width is written n - i.
- A caller expecting the rows to grow — that is Pattern 14, and no count-based check can tell the two apart.
- A caller expecting letters counting down within each row — that is the other reading of the name, and it differs from n = 2.

<!-- @pitfalls -->
- Guessing which reversal is meant. The two readings agree only at n = 0 and n = 1, so a small test will not tell you.
- Checking with a letter count, a character count, or sorted line lengths. All three are identical to Pattern 14's at every size.
- Writing the width as n - i rather than n - i + 1. The final single-A row disappears.
- Keeping the n - i + 1 arithmetic when the outer loop could count down. The loop variable is then the width and there is nothing left to compute.
- Assuming an out-of-range n will be obvious because it is on the first line. It is more visible than in Pattern 14, but still prints without raising, and between n = 33 and 58 the extra characters are lowercase letters.
- Leaving the precondition unstated because the failure is visible here. It is unstated in Pattern 14 too, where it is not.
- Carrying this topic's performance conclusions over. The largest valid input produces 702 bytes and the slowest version takes twelve microseconds.
- Reading the n = 6,000 comparison as advice. That size is past the alphabet, so it is not a letter triangle at all.
- Forgetting the cast in C++ or Java. 'A' + j is an int and prints as 65, 66, 67 without one.
- Building an offset table for the buffer. A letter is always one character, so the prefix length is exactly 2 * width - 1 at every size.

<!-- @doubt -->
### Which reversal does "reverse letter triangle" mean?

<!-- @answer -->
Both readings exist, so pin it from the statement. This container takes rows that shrink while each still begins at A — Pattern 14 with its lines reversed. The other reading counts the letters down within each row, so row 1 of a four-row triangle reads D C B A rather than A B C D. Measured, the two agree only at n = 0 and n = 1, which means they differ at every size from 2 upward and a one-row or two-row test will not distinguish them. It is the same class of question as whether Pattern 9's widest row appears once or twice.

<!-- @doubt -->
### How do I check this against Pattern 14 if all the totals match?

<!-- @answer -->
By position, since that is the only thing that differs. This is Pattern 14 line-reversed, verified byte-identical for every n from 0 to 26, so the letter count (351 at n = 26), the character count (676) and the multiset of line lengths are all the same in both. Comparing the line lengths **in order** separates them, and the cheapest single assertion is that the first row holds all n letters — Pattern 14's first row always holds exactly one. That is the same fix Pattern 5 needed against Pattern 2 and Pattern 6 against Pattern 3.

<!-- @doubt -->
### Is the alphabet limit less dangerous here?

<!-- @answer -->
More visible, not less dangerous. Both patterns stop at 26 letters and neither raises past it. But Pattern 14's rows grow, so at n = 27, 30 or 40 the first row containing a non-letter is always row 27 — the first twenty-six rows look perfect and only the bottom of the output is corrupt. Here the rows shrink, so the longest row prints first and the bad character is in line 1 at every one of those sizes. The precondition 1 <= n <= 26 is exactly the same and still has to be written down; you are simply more likely to notice when it is broken.

<!-- @doubt -->
### Which approach should I actually use?

<!-- @answer -->
Whichever is clearest, and that is a real answer rather than a dodge. The largest input this pattern admits is n = 26, which produces 702 bytes. Measured at that size, printing letter by letter takes 11.94 microseconds, building each row 4.56, and the buffer version 1.20. The ordering matches every earlier pattern, but the whole job is twelve microseconds at worst. The 261x gap between those same functions appears only at n = 6,000, which is not a letter triangle. Counting the outer loop down is worth preferring for a different reason: it removes the n - i + 1 arithmetic.

<!-- @doubt -->
### Then why keep three approaches at all?

<!-- @answer -->
Because the progression is the transferable part. Printing item by item, building a row, and holding a buffer are the three shapes every pattern in this topic has, and their relative cost has been measured across shapes where it matters enormously — 261x here at a size past the alphabet, and 113x in Pattern 3 at a valid one. What this container adds is the boundary condition on that whole line of reasoning: when the problem statement caps the input, check what the cap implies before optimising. Here it implies 702 bytes.

<!-- @doubt -->
### Does the buffer need an offset table, as Pattern 6's did?

<!-- @answer -->
No. Pattern 6 sliced a buffer of space-separated numbers, where the byte offset of k tokens is 2k - 1 only while the values are single digits — and that fails from k = 10, so it kept a table. Letters never widen, so here the prefix length is exactly 2 * width - 1 at every size, and the arithmetic is safe by construction. It is the same reason Pattern 11 and Pattern 14 could skip the table. What decides it is whether an item's width can change, not what the items are.
