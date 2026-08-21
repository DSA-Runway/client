---
id: pattern-18-alpha-triangle-pattern
topic: Pattern Printing
title: Pattern 18 - Alpha-Triangle Pattern
difficulty: Easy
status: ready
prerequisites:
  - pattern-14-increasing-letter-triangle
  - pattern-6-inverted-right-angled-number-triangle
  - type-conversion-and-casting
  - nested-loops
relatedIds:
  - pattern-14-increasing-letter-triangle
  - pattern-15-reverse-letter-triangle
  - pattern-16-alpha-ramp-pattern
  - pattern-19-symmetric-void-pattern
  - nested-loops
---

<!-- @summary -->
Print rows ending at the n-th letter and reaching further back each time — growing suffixes of the same buffer Patterns 14 and 15 read as prefixes, with a letter histogram and row lengths both identical to Pattern 16's, so neither summary check can tell two completely different shapes apart.

<!-- @theory -->
## The problem

Print n rows. Row i holds the last i letters of the first n — so every row ends at
the n-th letter, and each reaches one letter further back than the last.

```
n = 5      E
           D E
           C D E
           B C D E
           A B C D E
```

## Growing suffixes of a buffer three patterns share

Patterns 14 and 15 both read one string — the first n letters, space separated,
2n - 1 characters — as prefixes. This reads the same string as **suffixes**:

```
n = 5      B = "A B C D E"

Pattern 14   prefixes, growing     B[:1]  B[:3]  B[:5]  B[:7]  B[:9]
Pattern 15   prefixes, shrinking   B[:9]  B[:7]  B[:5]  B[:3]  B[:1]
Pattern 18   suffixes, growing     B[8:]  B[6:]  B[4:]  B[2:]  B[0:]
```

Row i is `B[len(B) - (2i-1):]`, verified across all 351 rows of every n from 1 to
26 with no exceptions. Three visually different triangles, one buffer, three
traversal rules — the same relationship Patterns 7, 8 and 9 had with their pyramid
buffer.

## Its letter histogram is Pattern 16's

Here is the finding worth the container. Count how many times each letter appears:

```
n = 5      A: 1   B: 2   C: 3   D: 4   E: 5
```

The k-th letter of the alphabet appears exactly k times — which is **also true of
Pattern 16**, the ramp that prints each letter in a row of its own. Verified
identical for every n from 1 to 26. And the row lengths match too: both give
1, 3, 5, ... 2n - 1.

So two shapes that look nothing alike —

```
Pattern 16        Pattern 18
A                 E
B B               D E
C C C             C D E
D D D D           B C D E
E E E E E         A B C D E
```

— have the same letter total, the same per-letter tally, and the same line
lengths at every size. No summary check separates them. It is the strongest
version of a point this topic has made repeatedly: a histogram describes the
contents and says nothing about where they are.

## The alphabet is consumed from the top

Row 1 uses the n-th letter, so an out-of-range n corrupts the **first** line:

| n | Pattern 18 | Pattern 14 | Pattern 16 |
|---|---|---|---|
| 27 | **row 1** | row 27 | row 27 |
| 30 | **row 1** | row 27 | row 27 |
| 40 | **row 1** | row 27 | row 27 |

At n = 27 row 1 is `[`. That is Pattern 15's behaviour rather than Pattern 14's,
and for the same reason — the widest reach into the alphabet comes first. The
precondition is unchanged: **1 <= n <= 26**, and nothing raises.

## First row and last row are each blind to a different mistake

Measured against the correct output for every n from 1 to 26:

| Mistake | Wrong on | Letters | Line lengths | Last row | First row | Exact |
|---|---|---|---|---|---|---|
| Each row starts at A (= Pattern 14) | 25/27 | **never** | **never** | **never** | n = 2 | n = 2 |
| Start offset one too high | 26/27 | **never** | **never** | n = 1 | n = 1 | n = 1 |
| Row counts down instead of up | 25/27 | **never** | **never** | n = 2 | **never** | n = 2 |
| Row one letter short | 26/27 | n = 2 | n = 1 | n = 1 | n = 1 | n = 1 |

Neither summary check catches any of the three value mistakes — the letter total
and the line lengths are fixed by the shape, not the contents, since a letter is
always one character.

The two cheap positional checks each miss one thing:

- **The last row** is `A B C ... ` in both this pattern and Pattern 14, so it
  never separates them.
- **The first row** is a single letter in both this pattern and its
  counting-down variant, so it never separates those.

Assert both, or compare row i against the last i letters directly.

Totals: n(n+1)/2 letters, row i exactly 2i - 1 characters, and n² + n bytes — 702
at n = 26, the same as Patterns 14 and 15.

## Speed, in proportion

| n | Letter at a time | Build each row | One buffer | Bytes |
|---|---|---|---|---|
| 10 | 1.89us | 0.76us | 0.45us | 110 |
| 20 | 6.99us | 2.85us | 0.92us | 420 |
| **26** | **11.61us** | **4.61us** | **1.16us** | **702** |

The same figures Patterns 14 and 15 gave, because it is the same work. Past the
alphabet, where the code paths show: 4.4x to 4.5x for the first step and 59x to
62x for the buffer. At the sizes this pattern accepts, the whole job is twelve
microseconds.

<!-- @intuition -->
Three letter triangles in a row have now turned out to be one string read three ways, which is worth noticing as a habit rather than as a fact about letters: when several shapes share an alphabet and a row length, they usually share a buffer, and the difference between them is an index rule. The sharper thing here is what that shared structure does to checking. This pattern and Pattern 16 place the same letters in the same quantities on lines of the same lengths, and look nothing like each other — so every check that summarises rather than locates is satisfied by both. The remaining cheap checks are positional, and even those come in pairs that each miss something, which is the last step of a ladder this topic has been climbing since Pattern 3.

<!-- @approach -->
### Letter at a Time

<!-- @idea -->
Nested loops where the inner counter starts at n minus i and runs to the last letter.

<!-- @steps -->
1. Loop over the rows from one up to and including n, with n at most 26.
2. Start the inner counter at n minus i — the offset of this row's first letter.
3. Run it up to but not including n.
4. Print a space before all but the first letter, then the character 'A' plus the counter.
5. Print a newline after the inner loop finishes.

<!-- @complexity -->
- time: O(n^2) letters, with one stream operation per letter and per separator
- space: O(1)
- note: The direct translation, and the version where the start offset is visible. Measured 11.61 microseconds at n = 26, the largest valid input, against 1.16 for the buffer version — about 10x on a 702-byte job.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int k = n - i; k < n; k++) {
            if (k > n - i) cout << ' ';
            cout << char('A' + k);
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: The start offset carries the whole pattern — n - i rather than 0, which is the single difference from Pattern 14.
- 8: Every row ends at the n-th letter, since the bound is n and not i.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int k = n - i; k < n; k++) {
            if (k > n - i) System.out.print(' ');
            System.out.print((char) ('A' + k));
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 4: The separator test compares against the row's own start, not against zero, because the counter no longer begins at zero.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for k in range(n - i, n):
            if k > n - i:
                print(" ", end="")
            print(chr(ord("A") + k), end="")
        print()


# Row 1 uses the n-th letter, so an out-of-range n shows up in the
# very first line — as in Pattern 15, not Pattern 14.
```

<!-- @annotations -->
- 3: range(n - i, n) walks up to the last letter. Writing range(i) instead gives Pattern 14, which shares this pattern's totals and line lengths.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Assemble each row from its own range of letters and print it in one operation.

<!-- @steps -->
1. Loop over the rows.
2. Take the letters from offset n minus i up to the last.
3. Join them with single spaces.
4. Print the result followed by a newline.
5. The stream operations drop from one per letter to one per row.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations, still one append per letter
- space: O(n) for the longest row, which is the last one
- note: Measured 4.61 microseconds at n = 26, and 130.23ms against 584.81ms at n = 6,000 — 4.5x. As in every letter pattern, that is a modest step, because the letters differ from cell to cell and no single repetition builds the row.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        string row;
        for (int k = n - i; k < n; k++) {
            if (k > n - i) row += ' ';
            row += char('A' + k);
        }
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 10: One append per letter, rebuilding a run that the next row will contain in full — which is what the buffer removes.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        StringBuilder row = new StringBuilder();
        for (int k = n - i; k < n; k++) {
            if (k > n - i) row.append(' ');
            row.append((char) ('A' + k));
        }
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 3: A fresh builder per row, discarding a run that is a suffix of every later row.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        print(" ".join(chr(ord("A") + k) for k in range(n - i, n)))


# join places separators between the letters, so no trailing space
# can appear. Measured about 4x faster than letter by letter.
```

<!-- @annotations -->
- 3: The range starts at n - i and ends at n, so the row grows backwards while its end stays fixed.

<!-- @approach -->
### One Buffer, Growing Suffix

<!-- @idea -->
Build the full alphabet row once and take a longer suffix of it each time.

<!-- @steps -->
1. Guard against a non-positive n, since the buffer is built before the loop.
2. Build one string holding the first n letters separated by spaces.
3. Loop over the rows from one up to and including n.
4. Write the last 2i minus one characters of the buffer.
5. Print a newline after each.

<!-- @complexity -->
- time: O(n^2) characters written, one pass to build the buffer, no per-cell work in the printing loop
- space: O(n) — the buffer is 2n - 1 characters, the same one Patterns 14 and 15 build
- note: The fastest here — 1.16 microseconds at n = 26, and 59x to 62x over building each row at sizes past the alphabet. The suffix length is exactly 2i - 1 because a letter never widens, so no offset table is needed.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    string alphabet;
    alphabet.reserve(2 * n);
    for (int k = 0; k < n; k++) {
        if (k) alphabet += ' ';
        alphabet += char('A' + k);
    }
    for (int i = 1; i <= n; i++) {
        cout.write(alphabet.data() + (alphabet.size() - (2 * i - 1)), 2 * i - 1);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 7: The last row, built once. Every earlier row is a suffix of it, checked across all 351 rows from n = 1 to 26.
- 14: A suffix rather than a prefix — the offset moves backwards while the end stays at the buffer's end.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    StringBuilder alphabet = new StringBuilder();
    for (int k = 0; k < n; k++) {
        if (k > 0) alphabet.append(' ');
        alphabet.append((char) ('A' + k));
    }
    for (int i = 1; i <= n; i++) {
        System.out.println(alphabet.substring(alphabet.length() - (2 * i - 1)));
    }
}
```

<!-- @annotations -->
- 9: The one-argument substring takes everything from the offset onward, which is exactly the suffix wanted.

<!-- @code python -->
```python
def pattern(n):
    alphabet = " ".join(chr(ord("A") + k) for k in range(n))
    for i in range(1, n + 1):
        print(alphabet[len(alphabet) - (2 * i - 1) :])


# The same buffer Patterns 14 and 15 read as prefixes, read here
# as suffixes. No guard needed, since range of 0 is empty.
```

<!-- @annotations -->
- 4: Taking the last 2i - 1 characters. Writing alphabet[-(2 * i - 1):] is the same thing and fails at i = 0, which cannot occur here.

<!-- @example -->

<!-- @input -->
n = 5

<!-- @output -->
E, then D E, up to A B C D E — fifteen letters

<!-- @why -->
Small enough to read at a glance, and it fixes the per-letter tally that turns out to match Pattern 16's exactly.

<!-- @walkthrough -->
1. Row 1 holds the last 1 letter of the first 5, which is E.
2. Row 2 holds the last 2, which is D E, and so on to row 5.
3. Every row ends at the n-th letter, and each reaches one further back.
4. The letter total is 1 + 2 + 3 + 4 + 5, which is 15 — the same n(n+1)/2 as every other letter triangle here.
5. Counting each letter: A once, B twice, C three times, D four times, E five times.
6. That is exactly Pattern 16's tally, where the k-th letter fills a row of its own.
7. The row lengths, 1, 3, 5, 7 and 9, are the same in both patterns too.

<!-- @example -->

<!-- @input -->
This pattern and Pattern 16, compared by every summary check

<!-- @output -->
Same letter total, same per-letter tally, same line lengths — and nothing alike

<!-- @why -->
The strongest case in this topic that a histogram describes contents and not arrangement.

<!-- @walkthrough -->
1. Pattern 16 prints the k-th letter k times, all on row k.
2. This pattern prints the k-th letter once on each of the last k rows.
3. So in both, the k-th letter appears exactly k times — verified identical for every n from 1 to 26.
4. The letter totals therefore match, at n(n+1)/2.
5. The line lengths match as well, both running 1, 3, 5 up to 2n minus one.
6. Yet one is a ramp of repeated letters and the other a triangle of consecutive ones.
7. Only a check that looks at where each letter sits can tell them apart.

<!-- @example -->

<!-- @input -->
Two positional checks, each against four mistakes

<!-- @output -->
The last row misses one and the first row misses another

<!-- @why -->
Shows that even the cheap positional checks come in a pair, neither of which is sufficient alone.

<!-- @walkthrough -->
1. Asserting the last row is A B C up to the n-th letter is quick and catches a wrong start offset at n = 1.
2. But Pattern 14's last row is exactly the same, so it never catches a version where every row starts at A.
3. Asserting the first row is the n-th letter alone catches that version at n = 2.
4. But a version that counts down within each row also has a single-letter first row, so that check never catches it.
5. Each of the two therefore misses a different one of the four mistakes measured.
6. Neither summary check helps: the letter total and the line lengths are unchanged by all three value mistakes.
7. Asserting both ends, or comparing row i against the last i letters, covers everything.

<!-- @example -->

<!-- @input -->
n = 27, compared with Patterns 14 and 16 at the same size

<!-- @output -->
The bad character is in row 1 here, and in row 27 there

<!-- @why -->
Places this pattern on the right side of a split the letter patterns divide into.

<!-- @walkthrough -->
1. All four letter triangles share the same ceiling of 26 letters and the same silence past it.
2. Patterns 14 and 16 reach furthest into the alphabet on their last row, so the damage starts at row 27.
3. Their first 26 rows look perfect, which makes an out-of-range n easy to miss.
4. Here row 1 already uses the n-th letter, so it is the first thing corrupted.
5. Measured at n = 27, 30 and 40, the first row containing a non-letter is always row 1.
6. At n = 27 that row is the single character after Z.
7. Pattern 15 behaves the same way, and for the same reason — its widest reach also comes first.

<!-- @visualization custom -->

<!-- @description -->
Open with the shared alphabet strip — the first n letters space separated, 2n-1 cells — and run three cursors over it at once rather than one: Pattern 14's prefix cursor growing from the left, Pattern 15's prefix cursor shrinking from the left, and this pattern's suffix cursor growing from the right. Step them together so the reader sees one object producing three triangles, with each cursor's output grid filling beside it. That shared strip is the spine of the figure. The centre panel is the histogram collision. Place this pattern's grid beside Pattern 16's ramp and, beneath both, draw the same bar chart of letter frequencies — A once, B twice, up to the n-th n times — filling in step as each grid is drawn, so the two charts complete identically while the grids look nothing alike. Add a line-length column beside each grid reading 1, 3, 5, 7, 9 in both. Then let a checker run over both grids with four lamps — letter total, per-letter tally, line lengths, position — and let only the last lamp distinguish them. That equality is the point, so hold the frame with both charts full and both length columns matching. Close with the two positional checks drawn as separate probes: a last-row probe that lights on the correct grid and also on Pattern 14's, and a first-row probe that lights on the correct grid and also on the counts-down variant, with an arrow from each probe to the mistake it fails to see, and a note that only both together are enough.

<!-- @sampleInput -->
```json
{"primary":{"n":5,"output":"E\nD E\nC D E\nB C D E\nA B C D E\n","rows":5,"lettersPerRow":[1,2,3,4,5],"letters":15,"formula":"n(n+1)/2","rowByteLength":"2i - 1","rowRule":"the last i letters of the first n","startOffset":"n - i","everyRowEndsAt":"the n-th letter"},"sharedBuffer":{"B":"the first n letters, space separated","length":"2n - 1","pattern14":"prefixes, growing — B[:2i-1]","pattern15":"prefixes, shrinking — B[:2(n-i+1)-1]","pattern18":"suffixes, growing — B[len(B)-(2i-1):]","verified":"351 rows over n = 1..26, 0 mismatches","n5":{"B":"A B C D E","pattern18Windows":["B[8:]","B[6:]","B[4:]","B[2:]","B[0:]"]},"reading":"three visually different triangles, one buffer, three index rules"},"histogramCollision":{"claim":"the k-th letter appears exactly k times, in this pattern and in Pattern 16","verified":"n = 1..26, identical multisets","lineLengthsAlsoMatch":true,"bothRun":[1,3,5,7,9],"atN5":{"A":1,"B":2,"C":3,"D":4,"E":5},"pattern16":"prints the k-th letter k times, all on row k","pattern18":"prints the k-th letter once on each of the last k rows","reading":"a histogram describes the contents and says nothing about where they are"},"domain":{"validRange":"1 <= n <= 26","alphabetConsumedFrom":"the top — row 1 uses the n-th letter","firstBadRow":{"pattern18":1,"pattern14":27,"pattern16":27},"measuredAt":[27,30,40],"atN27Row1":"[","sameAs":"Pattern 15","enforcement":"none — nothing raises"},"bugPanel":{"variants":[{"name":"each row starts at A (= Pattern 14)","wrongOn":"25 of 27","correctAt":[0,1]},{"name":"start offset one too high","wrongOn":"26 of 27","correctAt":[0]},{"name":"row counts down instead of up","wrongOn":"25 of 27","correctAt":[0,1]},{"name":"row one letter short","wrongOn":"26 of 27","correctAt":[0]}]},"checkPanel":{"columns":["letter count","line lengths","last row","first row","exact"],"smallestNThatCatches":{"each row starts at A":["never","never","never",2,2],"start offset one too high":["never","never",1,1,1],"row counts down":["never","never",2,"never",2],"row one letter short":[2,1,1,1,1]},"reading":["neither summary check catches any of the three value mistakes","the last row is A B C ... in Pattern 14 too, so it never separates them","the first row is a single letter in the counts-down variant too, so it never separates those","assert both ends, or compare row i against the last i letters"]},"assertions":["row i holds exactly i letters","row i is the last i letters of the first n","every row ends at the n-th letter","row i is exactly 2i - 1 characters long","n is at most 26"],"counts":{"letters":"n(n+1)/2","atN26":351,"outputBytes":"n^2 + n","bytesAtN26":702,"sameAs":"Patterns 14 and 15"},"buildPanel":{"atValidSizes":[{"n":10,"letterAtATimeUs":1.89,"freshRowUs":0.76,"bufferUs":0.45,"bytes":110},{"n":20,"letterAtATimeUs":6.99,"freshRowUs":2.85,"bufferUs":0.92,"bytes":420},{"n":26,"letterAtATimeUs":11.61,"freshRowUs":4.61,"bufferUs":1.16,"bytes":702}],"pastTheAlphabet":[{"n":3000,"letterAtATimeMs":145.60,"freshRowMs":33.25,"bufferMs":0.53},{"n":6000,"letterAtATimeMs":584.81,"freshRowMs":130.23,"bufferMs":2.22}],"caveat":"the millisecond figures are at sizes past the 26-letter limit and expose the code paths only"},"ratios":{"perLetterToFreshRow":"4.4x to 4.5x","freshRowToBuffer":"59x to 62x"},"python":{"atN26Us":{"letterAtATime":176.27,"joinPerRow":43.08,"sliceOfBuffer":12.72}}}
```

<!-- @highlights -->
- The shared alphabet strip of 2n-1 cells opens the figure, with three cursors running over it at once.
- Pattern 14's prefix cursor grows from the left, Pattern 15's shrinks from the left, and this pattern's suffix cursor grows from the right.
- Stepped together, one object visibly produces three triangles, each cursor's grid filling beside it.
- The centre panel places this pattern's grid beside Pattern 16's ramp.
- Beneath both, the same letter-frequency bar chart fills in step — A once, B twice, up to the n-th n times.
- The two charts complete identically while the grids look nothing alike.
- A line-length column beside each grid reads 1, 3, 5, 7, 9 in both.
- A checker runs over both grids with four lamps: letter total, per-letter tally, line lengths, position.
- Only the last lamp distinguishes them.
- The frame is held with both charts full and both length columns matching, since that equality is the point.
- Two positional probes close the figure, drawn separately.
- The last-row probe lights on the correct grid and also on Pattern 14's.
- The first-row probe lights on the correct grid and also on the counts-down variant.
- An arrow runs from each probe to the mistake it fails to see.
- A note records that only both together are enough.

<!-- @edgeCases -->
- n equal to zero — no output, and the buffer version needs its guard since it builds before looping.
- n equal to one — a single A, where two of the four mistakes still pass.
- n equal to two — the smallest input that catches a row starting at A or a row counting down.
- n equal to twenty-six — the largest valid input; the last row runs A through Z and the whole output is 702 bytes.
- n equal to twenty-seven — the first invalid input, and here row 1 already holds the character after Z.
- Negative n — no output from the loop versions; the buffer version needs the guard.
- The first row — the n-th letter alone, and the place an out-of-range n shows up.
- The last row — all n letters, identical to Pattern 14's last row, which is why that check cannot separate them.
- A caller expecting each row to start at A — that is Pattern 14, which shares this pattern's totals and line lengths.
- A caller expecting the letters to descend within a row — that variant also has a single-letter first row, so the first-row check misses it.

<!-- @pitfalls -->
- Starting the inner counter at zero. That gives Pattern 14, which has the same letter total, the same per-letter tally and the same line lengths.
- Checking with a letter count or a per-letter tally. Pattern 16 produces exactly the same histogram from a completely different arrangement.
- Checking only the last row. It is A B C up to the n-th letter in Pattern 14 as well, so it never separates the two.
- Checking only the first row. A version counting down within each row also has a single-letter first row.
- Relying on line lengths. A letter is always one character, so the lengths are fixed by the shape and blind to every value mistake.
- Comparing the separator against zero rather than against the row's start. The counter no longer begins at zero, so the first letter would gain a leading space.
- Leaving the precondition unstated. Row 1 uses the n-th letter, so at n = 27 the very first line is already wrong.
- Assuming the overrun behaves as in Pattern 14. It does not — the damage is in row 1 here, as in Pattern 15.
- Treating the rows as prefixes of the buffer. They are suffixes; the offset moves backwards while the end stays fixed.
- Building an offset table for the buffer. Letters never widen, so the suffix length is exactly 2i - 1 at every size.

<!-- @doubt -->
### How is this different from Pattern 14?

<!-- @answer -->
Only in where the inner counter starts — n - i rather than 0 — and that is enough to make the two indistinguishable by every summary check. Both print n(n+1)/2 letters, both give rows of 1, 3, 5 up to 2n - 1 characters, and both end their last row with the same A B C run. Starting at zero here produces Pattern 14 exactly, wrong on 25 of the 27 sizes from 0 to 26 and correct at n = 0 and n = 1. What separates them is the first row: a single letter here, and the n-th letter specifically.

<!-- @doubt -->
### Can I check this by counting how many times each letter appears?

<!-- @answer -->
No, and this is the sharpest case in the topic. In this pattern the k-th letter appears once on each of the last k rows; in Pattern 16 it fills row k entirely. Either way it appears exactly k times, verified identical for every n from 1 to 26 — and the line lengths match as well, both running 1, 3, 5 up to 2n - 1. So two shapes that look nothing alike agree on the letter total, the per-letter tally and every line length. A histogram describes what is present, not where it is; only a positional check separates them.

<!-- @doubt -->
### Which positional check should I use?

<!-- @answer -->
Both ends, because each alone has a blind spot. Asserting the last row is A B C up to the n-th letter catches a wrong start offset at n = 1, but Pattern 14's last row is identical, so it never catches a version where every row starts at A. Asserting the first row is the n-th letter alone catches that one at n = 2, but a version counting down within each row also has a single-letter first row, so it never catches that. Together they cover all four mistakes measured — or compare row i directly against the last i letters, which is the whole specification.

<!-- @doubt -->
### Why does an out-of-range n show up immediately here?

<!-- @answer -->
Because row 1 already uses the n-th letter. The alphabet is consumed from the top rather than the bottom, so the widest reach comes first — the same as Pattern 15 and the opposite of Patterns 14 and 16, whose first 26 rows look perfect. Measured at n = 27, 30 and 40, the first row containing a non-letter is always row 1, and at n = 27 that row is the single character after Z. The ceiling and the silence are identical in all four patterns; only the visibility differs, so the precondition 1 <= n <= 26 still has to be stated.

<!-- @doubt -->
### Is this really the same buffer as Patterns 14 and 15?

<!-- @answer -->
Character for character. All three read the first n letters space separated, which is 2n - 1 characters. Pattern 14 takes growing prefixes, Pattern 15 takes shrinking prefixes, and this takes growing suffixes — `B[len(B) - (2i-1):]`, verified across all 351 rows of every n from 1 to 26 with no exceptions. At n = 5 that is B[8:], B[6:], B[4:], B[2:], B[0:]. It is the same relationship Patterns 7, 8 and 9 had with their pyramid buffer: one object, several index rules.

<!-- @doubt -->
### Why is the separator test written against the row's start rather than zero?

<!-- @answer -->
Because the inner counter no longer begins at zero. In Pattern 14 the first letter of a row is at k = 0, so `if (k)` is the right test. Here the row starts at k = n - i, so the same test would print a leading space on every row except the last. Comparing against the row's own start — `if (k > n - i)` — is what keeps it correct. It is a small thing and it is the kind that survives a casual read, because the output still looks like a triangle, just indented by one character on all but the bottom row.
