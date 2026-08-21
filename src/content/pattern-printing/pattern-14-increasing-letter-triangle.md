---
id: pattern-14-increasing-letter-triangle
topic: Pattern Printing
title: Pattern 14 - Increasing Letter Triangle
difficulty: Easy
status: ready
prerequisites:
  - pattern-11-binary-number-triangle
  - pattern-3-right-angled-number-triangle
  - type-conversion-and-casting
  - nested-loops
relatedIds:
  - pattern-11-binary-number-triangle
  - pattern-15-reverse-letter-triangle
  - pattern-16-alpha-ramp-pattern
  - pattern-3-right-angled-number-triangle
  - nested-loops
---

<!-- @summary -->
Print a triangle of letters running A, A B, A B C — Pattern 3 with characters instead of numbers, and the first pattern with a hard ceiling on n: past 26 the alphabet runs out and the code keeps going, printing punctuation from n = 27, lowercase letters from n = 33, and a NUL byte at n = 192, with nothing anywhere reporting an error.

<!-- @theory -->
## The problem

Print n rows where row i holds the first i letters of the alphabet.

```
n = 4      A
           A B
           A B C
           A B C D
```

The value comes from the column counter, exactly as in Pattern 3 — only now it is
`'A' + j` rather than `j + 1`. Character arithmetic is the whole new mechanic, and
it brings one property numbers do not have.

## The alphabet runs out, and nothing says so

`'A'` is 65 and `'Z'` is 90. There are 26 letters, so **n has a hard maximum of
26** — and the code does not know that. Past it, `'A' + j` keeps producing values
and they keep printing:

| n | Last character | Code | What it is |
|---|---|---|---|
| 26 | `Z` | 90 | the last real letter |
| **27** | `[` | 91 | printable punctuation |
| 28 | `\` | 92 | printable punctuation |
| 32 | `` ` `` | 96 | printable punctuation |
| **33** | `a` | 97 | **a lowercase letter** |
| 58 | `z` | 122 | still lowercase |
| 62 | `~` | 126 | the last printable ASCII |
| **63** | DEL | 127 | no longer printable |
| **64** | — | 128 | past what a signed char holds |
| **192** | NUL | 256 → 0 | a zero byte inside the output |

The dangerous stretch is **27 through 62**: the output still looks like a
well-formed ASCII pattern, and from n = 33 it is once again made of letters — just
the wrong case. A reader glancing at n = 40 sees a tidy triangle of letters and
symbols and has no reason to suspect anything.

On this build `char` is **signed** (`CHAR_MIN` is -128), which was measured rather
than assumed. So from n = 64 the value stored in a `char` goes negative, and at
n = 192 the arithmetic reaches 256 and stores as 0 — a NUL byte written into the
middle of the output.

The fix is not clever code, it is a stated precondition: **this pattern is defined
for 1 <= n <= 26.** Check it and refuse, or document it. Silence is the bug.

## The wrap-around version is not a bug

A natural instinct is to write `'A' + (j % 26)` so the alphabet cycles. Measured
over the whole valid range, that version is **identical to the plain one for every
n from 0 to 26** — 0 differences. The two only diverge where the pattern is
already undefined.

So it is a design decision about behaviour outside the domain, not a correctness
question inside it. Wrapping at least keeps the output made of letters; it does
not make n = 40 meaningful.

## The checks behave exactly as in Pattern 11

Every value is one character, always — so the byte length of a row is exactly
`2i - 1` for every row of every valid n, and a length check can never see a wrong
value. Measured over n from 1 to 26:

| Mistake | Wrong on | Letter count | Line lengths | First column | Exact |
|---|---|---|---|---|---|
| Lowercase letters | 26/27 | **never** | **never** | n = 1 | n = 1 |
| Prints the row's letter, not the column's | 25/27 | **never** | **never** | n = 2 | n = 2 |
| Starts at B | 26/27 | **never** | **never** | n = 1 | n = 1 |
| Row one letter short | 26/27 | n = 2 | n = 1 | n = 1 | n = 1 |
| Wraps at Z back to A | **0/27** | — | — | — | — |

The three value mistakes are invisible to both summary checks at every size, for
the same reason Pattern 11 gave: the digits — here characters — never widen, so
length is fixed by the item count and carries no information about content.

The assertion that works is the same one: **row i must begin with A and hold
exactly i letters, in alphabetical order.**

## Speed: the same result as Pattern 11, for the same reason

Every row is a prefix of the last row — checked across all 351 rows of every n
from 1 to 26, no exceptions — so one buffer of 2n - 1 characters serves the whole
pattern.

The timings below were taken at n of 1,000 to 6,000. **Those are not valid letter
triangles** — the alphabet ran out at 26 — and they are included only because the
valid range is far too small to time. What they measure is the code path, which is
the same shape at any n.

| n | Letter at a time | Fresh row | One buffer |
|---|---|---|---|
| 1,000 | 16.65ms | 4.02ms | 0.09ms |
| 3,000 | 150.04ms | 34.25ms | 0.54ms |
| 6,000 | 604.52ms | 135.85ms | 2.62ms |

Not printing letter by letter is worth **4.1x to 4.4x**; the buffer is worth
**45x to 63x**. That is Pattern 11's split almost exactly, and the cause is the
same: the letters differ from cell to cell, so no single repetition builds a row
and the per-cell work only disappears with the buffer. Python agrees, at 4.8x to
5.6x and 35x to 102x.

<!-- @intuition -->
Letters feel like a cosmetic change from numbers and they bring one real difference: the supply is finite. Every pattern so far scaled to whatever n you gave it, and this one has a ceiling built into the character set rather than into the code, which is why nothing in the code enforces it. That is the shape of the whole problem — the constraint lives in the meaning of the data, not in its representation, so the machine has nothing to complain about and simply carries on adding one to a number. The practical consequence is that the precondition has to be written down by a person, because it will never be discovered by running the program.

<!-- @approach -->
### Letter at a Time

<!-- @idea -->
Nested loops printing the letter that is j places after A, with a separator between letters.

<!-- @steps -->
1. Loop over the rows from one up to and including n, with n at most 26.
2. Loop the inner counter from zero up to but not including i.
3. Print a space first if this is not the first letter on the row.
4. Print the character 'A' plus the inner counter.
5. Print a newline after the inner loop finishes.

<!-- @complexity -->
- time: O(n^2) letters, with one stream operation per letter and per separator
- space: O(1)
- note: The direct translation, and the version where the character arithmetic is most visible. Measured 604.52ms at n = 6,000 against 135.85ms for building each row — 4.1x to 4.4x, the same modest step Pattern 11 measured, because building the row is per-cell work here too. Those sizes are past the alphabet and exist only to time the code path.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 0; j < i; j++) {
            if (j) cout << ' ';
            cout << char('A' + j);
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: The value comes from the column counter, as in Pattern 3 — only the base is a character.
- 8: 'A' + j is an int; the cast is what makes it print as a letter rather than as a number. Nothing here checks that j stays under 26.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 0; j < i; j++) {
            if (j > 0) System.out.print(' ');
            System.out.print((char) ('A' + j));
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 5: Without the cast this prints 65, 66, 67 — the codes rather than the letters, which is the first thing to check when the output is numeric.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for j in range(i):
            if j > 0:
                print(" ", end="")
            print(chr(ord("A") + j), end="")
        print()


# Defined only for n up to 26. At n = 27 this prints '[' and keeps
# going; nothing raises.
```

<!-- @annotations -->
- 6: chr of ord('A') plus j. Past j = 25 this leaves the alphabet without any error, which is this pattern's real hazard.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Assemble each row into a string and print it in one operation.

<!-- @steps -->
1. Loop over the rows.
2. Start an empty row string.
3. Append the letter for each column, with a separator before all but the first.
4. Print the finished row followed by a newline.
5. The stream operations drop from one per letter to one per row.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations, still one append per letter
- space: O(n) for the longest row
- note: Measured 135.85ms at n = 6,000, worth 4.1x to 4.4x. As in Pattern 11, that is far less than a star pattern gains from the same move, because the letters differ from cell to cell and there is no single repetition that produces a row.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        string row;
        for (int j = 0; j < i; j++) {
            if (j) row += ' ';
            row += char('A' + j);
        }
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 10: One append per letter. Every row rebuilds the same prefix the previous row already held, which is what the next approach removes.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        StringBuilder row = new StringBuilder();
        for (int j = 0; j < i; j++) {
            if (j > 0) row.append(' ');
            row.append((char) ('A' + j));
        }
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 6: append of a char, not of an int. Appending the int gives the code, and the mistake is silent in the same way the alphabet overrun is.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        print(" ".join(chr(ord("A") + j) for j in range(i)))


# join places separators between the letters, so no trailing space
# can appear. Measured 4.8x to 5.6x faster than letter by letter.
```

<!-- @annotations -->
- 3: The row is rebuilt from scratch each time, even though it is the previous row plus one letter.

<!-- @approach -->
### One Buffer, Growing Prefix

<!-- @idea -->
Build the full alphabet row once and print a prefix of it for each row.

<!-- @steps -->
1. Guard against a non-positive n, since the buffer is built before the loop.
2. Build one string holding the first n letters separated by spaces.
3. Loop over the rows from one up to and including n.
4. Write the first 2i minus one characters of the buffer.
5. Print a newline after each.

<!-- @complexity -->
- time: O(n^2) characters written, one pass to build the buffer, no per-cell work in the printing loop
- space: O(n) — the buffer is 2n - 1 characters
- note: The fastest here — 2.62ms at n = 6,000 against 135.85ms, so 45x to 63x, and 35x to 102x in Python. The prefix length is exactly 2i - 1 at every size, which is safe here for the same reason it was in Pattern 11: a letter is always one character.

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
    for (int i = 1; i <= n; i++) {
        cout.write(alphabet.data(), 2 * i - 1);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 7: The last row, built once. Every earlier row is a prefix of it — checked across all 351 rows of every n from 1 to 26.
- 14: 2i - 1 characters exactly, because a letter never takes more than one. Pattern 6 had to keep an offset table for the same idea, since numbers widen.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    StringBuilder alphabet = new StringBuilder();
    for (int j = 0; j < n; j++) {
        if (j > 0) alphabet.append(' ');
        alphabet.append((char) ('A' + j));
    }
    for (int i = 1; i <= n; i++) {
        System.out.println(alphabet.substring(0, 2 * i - 1));
    }
}
```

<!-- @annotations -->
- 9: substring copies in Java, so this states the structure clearly but keeps a per-row allocation.

<!-- @code python -->
```python
def pattern(n):
    alphabet = " ".join(chr(ord("A") + j) for j in range(n))
    for i in range(1, n + 1):
        print(alphabet[: 2 * i - 1])


# Measured 35x to 102x faster than rebuilding each row — the same
# result Pattern 11 gave, and for the same reason.
```

<!-- @annotations -->
- 2: One string for the whole pattern. No guard is needed in Python, since range of a non-positive n is empty.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
A / A B / A B C / A B C D — ten letters over four lines

<!-- @why -->
Small enough to read at a glance, and it fixes the letter total and the row lengths that the value bugs will be shown to preserve.

<!-- @walkthrough -->
1. Row 1 prints the character 'A' plus 0, which is A.
2. Row 2 prints 'A' plus 0 and 'A' plus 1, giving A B.
3. The value depends only on the column, so every row starts at A.
4. The letter total is 1 + 2 + 3 + 4, which is 10 — the same n(n+1)/2 as Pattern 3.
5. Every row is 2i minus one characters, since a letter is one character and the separators are single spaces.
6. Row 4 is A B C D, and every earlier row is a prefix of it.
7. Lowercasing every letter, or starting at B, changes neither the total nor any length.

<!-- @example -->

<!-- @input -->
n = 27, 33, 63 and 192

<!-- @output -->
'[', then a lowercase 'a', then DEL, then a NUL byte — and never an error

<!-- @why -->
The pattern's own ceiling, and the whole reason this container exists rather than being a restatement of Pattern 3.

<!-- @walkthrough -->
1. 'A' is 65 and 'Z' is 90, so the alphabet supplies exactly 26 letters.
2. At n = 27 the last character is 'A' plus 26, which is 91 — the punctuation mark '['.
3. It stays printable all the way to n = 62, and from n = 33 it is made of lowercase letters again.
4. So an output at n = 40 looks like a tidy triangle of letters and symbols, with nothing to suggest it is wrong.
5. At n = 63 the value reaches 127, which is DEL and no longer printable.
6. On this build char is signed, so from n = 64 the stored value goes negative, and at n = 192 the arithmetic reaches 256 and stores as zero — a NUL byte in the middle of the output.
7. Nothing raises at any point, so the precondition n at most 26 has to be written down rather than discovered.

<!-- @example -->

<!-- @input -->
Wrapping at Z with 'A' + (j % 26), over the valid range

<!-- @output -->
Byte-identical to the plain version for every n from 0 to 26

<!-- @why -->
Separates a genuine design decision from a correctness question, since the two look like alternatives and are not.

<!-- @walkthrough -->
1. Writing the value as 'A' plus j modulo 26 makes the alphabet cycle instead of running off the end.
2. Inside the valid range j never reaches 26, so the modulo never does anything.
3. Measured over every n from 0 to 26, the two versions produce identical output — 0 differences.
4. They can only differ where the pattern is undefined in the first place.
5. Wrapping does keep the output made of letters at n = 40, which is nicer to look at.
6. It does not make n = 40 meaningful — the 27th row would repeat the first.
7. So choose it for the behaviour you want outside the domain, and state the domain either way.

<!-- @example -->

<!-- @input -->
n = 6,000, built three different ways

<!-- @output -->
604.52ms letter by letter, 135.85ms per row, 2.62ms from one buffer

<!-- @why -->
Reproduces Pattern 11's split on a different alphabet, which tests whether that explanation was about binary digits or about uniformity.

<!-- @walkthrough -->
1. These sizes are far past the 26-letter limit, so the outputs are not valid letter triangles; only the code path is being measured.
2. Not printing letter by letter is worth 4.1x to 4.4x — much less than the 100x-plus every star pattern gave.
3. The reason is the same as in Pattern 11: the letters differ from cell to cell, so no single repetition builds a row.
4. Holding one buffer and printing prefixes of it removes the per-cell work entirely.
5. That measured 45x to 63x, and 35x to 102x in Python.
6. Pattern 11 measured 35x to 73x and 40x to 110x for the same step.
7. So the explanation was about whether a row's contents are uniform, not about binary digits in particular.

<!-- @visualization custom -->

<!-- @description -->
A grid of letter cells with an alphabet ruler running along the top, marked A at 65 and Z at 90, and a pointer that walks the ruler as each cell is filled — the pointer is the subject, and the ruler must be drawn as a finite strip with a visible end rather than as an open axis. Fill the triangle normally for n up to 26, then let the pointer walk off the end of the strip and keep going, with the ruler continuing in a different, unlabelled colour past Z. As it advances, show what each cell prints: punctuation from 27, then lowercase letters from 33 with the grid still looking entirely plausible, then DEL at 63 drawn as a struck-out cell, then at 64 a signed-char meter dropping below zero, then at 192 a cell containing a visible NUL glyph. Attach an error lamp beside the whole panel and keep it dark the entire time, labelled nothing raises — that lamp staying off is the point of the figure. Beside the grid keep the check panel from Pattern 11: letter count, line lengths, first column, exact, over three value bugs, with the first two lamps green throughout. Add a small strip showing the wrap-around version alongside the plain one for n up to 26, overlaid and identical, labelled 0 differences inside the domain. Close with three time bars at n = 6,000 — 604.52ms, 135.85ms, 2.62ms — set beside a greyed copy of Pattern 11's bars at the same proportions, captioned the same split, a different alphabet, and marked clearly as sizes past the letter limit, code path only.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"A\nA B\nA B C\nA B C D\n","rows":4,"lettersPerRow":[1,2,3,4],"letters":10,"formula":"n(n+1)/2","rowByteLength":"2i - 1","valueRule":"'A' + j, from the column counter"},"domain":{"validRange":"1 <= n <= 26","reason":"'A' is 65 and 'Z' is 90, so the alphabet supplies exactly 26 letters","enforcement":"none in the code — the precondition must be written down","charIsSignedOnThisBuild":true,"charMin":-128,"charMax":127,"overrun":[{"n":26,"char":"Z","code":90,"kind":"the last real letter"},{"n":27,"char":"[","code":91,"kind":"printable punctuation"},{"n":28,"char":"\\","code":92,"kind":"printable punctuation"},{"n":32,"char":"`","code":96,"kind":"printable punctuation"},{"n":33,"char":"a","code":97,"kind":"a lowercase letter"},{"n":58,"char":"z","code":122,"kind":"still lowercase"},{"n":62,"char":"~","code":126,"kind":"the last printable ASCII"},{"n":63,"char":"DEL","code":127,"kind":"no longer printable"},{"n":64,"code":128,"kind":"past what a signed char holds; stored value goes negative"},{"n":192,"code":256,"stored":0,"kind":"a NUL byte inside the output"}],"dangerousStretch":"27 through 62, where the output still looks like a well-formed ASCII pattern"},"wrapAround":{"expression":"'A' + (j % 26)","differencesInsideDomain":0,"over":"n = 0..26","reading":"a design decision about behaviour outside the domain, not a correctness question inside it"},"bugPanel":{"variants":[{"name":"lowercase letters","wrongOn":"26 of 27","correctAt":[0]},{"name":"prints the row's letter, not the column's","wrongOn":"25 of 27","correctAt":[0,1]},{"name":"starts at B","wrongOn":"26 of 27","correctAt":[0]},{"name":"row one letter short","wrongOn":"26 of 27","correctAt":[0]},{"name":"wraps at Z back to A","wrongOn":"0 of 27","correctAt":"all of 0..26"}]},"checkPanel":{"columns":["letter count","line lengths","first column","exact"],"smallestNThatCatches":{"lowercase letters":["never","never",1,1],"prints the row's letter":["never","never",2,2],"starts at B":["never","never",1,1],"row one letter short":[2,1,1,1]},"reading":["a letter is always one character, so line lengths are fixed by the item count","the three value mistakes are invisible to both summary checks at every size","this is Pattern 11's result on a different alphabet"],"cheapestAssertion":"row i begins with A and holds exactly i letters in alphabetical order"},"assertions":["row i holds exactly i letters","row i begins with A","the letters ascend by one along each row","row i is exactly 2i - 1 characters long","n is at most 26"],"buffer":{"claim":"every row is a prefix of the last row","rowsChecked":351,"exceptions":0,"over":"n = 1..26","bufferLength":"2n - 1","prefixRule":"row i = the first 2i - 1 characters","whyNoOffsetTable":"a letter is always one character, unlike Pattern 6 where numbers widen"},"buildPanel":{"caveat":"these sizes are far past the 26-letter limit; the outputs are not valid letter triangles and only the code path is being measured","rows":[{"n":1000,"letterAtATimeMs":16.65,"freshRowMs":4.02,"bufferMs":0.09},{"n":3000,"letterAtATimeMs":150.04,"freshRowMs":34.25,"bufferMs":0.54},{"n":6000,"letterAtATimeMs":604.52,"freshRowMs":135.85,"bufferMs":2.62}]},"ratios":{"perLetterToFreshRow":"4.1x to 4.4x","freshRowToBuffer":"45x to 63x","whole":"185x to 278x"},"python":{"perLetterToJoin":"4.8x to 5.6x","joinToSlice":"35x to 102x"},"comparisonWithPattern11":{"pattern11":{"perItemToFreshRow":"8x to 11x","bufferStep":"35x to 73x"},"pattern14":{"perItemToFreshRow":"4.1x to 4.4x","bufferStep":"45x to 63x"},"conclusion":"the explanation was about whether a row's contents are uniform, not about binary digits"}}
```

<!-- @highlights -->
- An alphabet ruler runs along the top of the grid, marked A at 65 and Z at 90.
- The ruler is drawn as a finite strip with a visible end, not as an open axis.
- A pointer walks the ruler as each cell is filled, and the pointer is the subject.
- Past n = 26 the pointer walks off the end and keeps going, the ruler continuing in a different unlabelled colour.
- Punctuation appears from n = 27, then lowercase letters from n = 33 with the grid still looking plausible.
- DEL appears at n = 63 as a struck-out cell.
- At n = 64 a signed-char meter drops below zero.
- At n = 192 a cell contains a visible NUL glyph.
- An error lamp beside the panel stays dark the entire time, labelled nothing raises.
- That lamp staying off is the point of the figure.
- The check panel from Pattern 11 carries over: letter count, line lengths, first column, exact.
- Its first two lamps stay green across all three value bugs.
- A small strip overlays the wrap-around version on the plain one for n up to 26, identical, labelled 0 differences inside the domain.
- Three time bars at n = 6,000 read 604.52ms, 135.85ms and 2.62ms.
- A greyed copy of Pattern 11's bars sits beside them at the same proportions, captioned the same split, a different alphabet.
- The timing panel is marked clearly as sizes past the letter limit, code path only.

<!-- @edgeCases -->
- n equal to zero — no output, and the buffer version needs its guard since it builds a string before looping.
- n equal to one — a single A, where two of the four mistakes still pass.
- n equal to two — the smallest input that catches printing the row's letter instead of the column's.
- n equal to twenty-six — the largest valid input, whose last row runs A through Z.
- n equal to twenty-seven — the first invalid input, and it produces '[' rather than an error.
- n between 27 and 62 — still printable ASCII, and from 33 still letters, so the output looks plausible while being meaningless.
- n equal to sixty-three — the value reaches 127, DEL, and stops being printable.
- n equal to sixty-four — past what a signed char holds on this build, so the stored value goes negative.
- n equal to one hundred and ninety-two — the arithmetic reaches 256 and stores as zero, putting a NUL byte in the output.
- Negative n — no output from the loop versions; the buffer versions need the guard.

<!-- @pitfalls -->
- Not stating that n is at most 26. Nothing in the code enforces it and nothing reports it, so the constraint has to be written down.
- Assuming the overrun will be obvious. From n = 33 the extra characters are lowercase letters, so the output still looks like a letter triangle.
- Testing at a size past 26 to see what happens. It will not raise, and between 27 and 62 it will not even look wrong.
- Forgetting the cast in C++ or Java. 'A' + j is an int, so it prints as 65, 66, 67 without one.
- Checking the letter count or the line lengths. A letter is always one character, so both are fixed by the item count and cannot see a wrong letter.
- Treating 'A' + (j % 26) as a fix. Inside the valid range it is byte-identical to the plain version — it changes only what happens where the pattern is already undefined.
- Printing the row's letter rather than the column's. Correct at n = 1, and invisible to both summary checks.
- Building an offset table as Pattern 6 needed. Letters never widen, so the prefix length is exactly 2i - 1 at every size.
- Rebuilding each row from scratch. The buffer is worth 45x to 63x here, against 4.1x to 4.4x for not printing letter by letter.
- Reading the timing table as advice for real inputs. The valid range tops out at 26 rows, where none of this is measurable.

<!-- @doubt -->
### What happens if n is more than 26?

<!-- @answer -->
The code keeps going and prints whatever `'A' + j` lands on. At n = 27 the last character is 91, which is `[`. It remains printable ASCII up to n = 62, and from n = 33 it is lowercase letters again — so an output at n = 40 looks like a tidy triangle and is meaningless. At n = 63 the value is 127, DEL. On this build `char` is signed, so from n = 64 the stored value goes negative, and at n = 192 the arithmetic reaches 256 and stores as 0, writing a NUL byte into the output. Nothing raises at any point. The precondition 1 <= n <= 26 has to be stated by you.

<!-- @doubt -->
### Should I use 'A' + (j % 26) so it wraps?

<!-- @answer -->
It is a reasonable choice and it is not a bug fix. Measured over every n from 0 to 26 — the whole valid range — the wrapping version is byte-identical to the plain one, because j never reaches 26 there. The two can only differ outside the domain. What wrapping buys is that an out-of-range n produces letters rather than punctuation, which is friendlier but no more correct: at n = 27 the 27th column would repeat A. Decide it as a question about behaviour outside the domain, and state the domain either way.

<!-- @doubt -->
### Why does my output show numbers instead of letters?

<!-- @answer -->
The cast is missing. `'A' + j` promotes to `int` in both C++ and Java, so printing it directly gives 65, 66, 67 rather than A, B, C. Write `char('A' + j)` in C++ or `(char) ('A' + j)` in Java. Python has the opposite shape — `ord("A") + j` is a number and `chr` turns it back into a character — so the conversion is explicit in both directions there. It is worth noticing that this mistake and the alphabet overrun are the same kind of thing: the arithmetic is always valid, and only the interpretation is wrong.

<!-- @doubt -->
### Can I check this pattern by counting letters or line lengths?

<!-- @answer -->
No, for the same reason as Pattern 11. Every letter is exactly one character, so a row's byte length is 2i - 1 whatever letters are on it, and the letter total is n(n+1)/2 whatever they are. Measured over n from 1 to 26, lowercasing everything, starting at B, and printing the row's letter instead of the column's are all invisible to both checks at every size. The assertion that works is specific: row i begins with A, holds exactly i letters, and they ascend by one.

<!-- @doubt -->
### Why is the buffer worth so much more than the per-row step?

<!-- @answer -->
Because a letter row, like a binary row, cannot be produced by a single repetition — each cell holds a different character, so building it costs one append per cell however you write it, and only a prebuilt buffer removes that. Measured, not printing letter by letter is worth 4.1x to 4.4x while the buffer is worth 45x to 63x. Pattern 11 measured 8x to 11x and 35x to 73x for the same two steps. That the two patterns agree is the useful part: the explanation was about whether a row's contents are uniform, not about binary digits specifically.

<!-- @doubt -->
### Why does the buffer need no offset table, when Pattern 6 did?

<!-- @answer -->
Because letters never widen. Pattern 6 sliced a buffer of space-separated numbers, where the byte offset of k tokens is 2k - 1 only while every value is a single digit — and it stops being that at k = 10, so it kept a table of where each token ended. Here every value is one character at every size, so the prefix length is exactly 2i - 1 always, and the arithmetic is safe. That is the same condition Pattern 11 satisfied with binary digits, stated once more: what matters is whether an item's width can change.
