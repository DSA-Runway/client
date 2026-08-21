---
id: pattern-16-alpha-ramp-pattern
topic: Pattern Printing
title: Pattern 16 - Alpha-Ramp Pattern
difficulty: Easy
status: ready
prerequisites:
  - pattern-14-increasing-letter-triangle
  - pattern-4-right-angled-repeating-number-triangle
  - nested-loops
  - type-conversion-and-casting
relatedIds:
  - pattern-14-increasing-letter-triangle
  - pattern-4-right-angled-repeating-number-triangle
  - pattern-17-alpha-hill-pattern
  - pattern-18-alpha-triangle-pattern
  - nested-loops
---

<!-- @summary -->
Print row i as the i-th letter repeated i times — Pattern 4 with letters, where the row is a repetition of a two-character unit rather than of a character, which Python can express in one operation and C++ cannot, so the two languages have different fastest versions.

<!-- @theory -->
## The problem

Print n rows where row i holds the i-th letter of the alphabet, i times.

```
n = 5      A
           B B
           C C C
           D D D D
           E E E E E
```

The value comes from the **row** counter, so this is Pattern 4's mechanic on
Pattern 14's alphabet. As in Pattern 4, the inner counter appears in the loop
header and nowhere else.

## The swap gives Pattern 14, exactly as Pattern 4's gave Pattern 3

Printing the column's letter instead of the row's produces output byte-identical
to Pattern 14 for every n from 0 to 26. It is wrong here on 25 of the 27 sizes
from 0 to 26, passing at n = 0 and n = 1.

That is the third instance of the same shape in this topic — a wrong loop variable
producing a neighbouring pattern's correct answer — and the checks behave the same
way. Measured over n from 1 to 26:

| Mistake | Wrong on | Letter count | Line lengths | First column | Exact |
|---|---|---|---|---|---|
| Prints the column's letter (= Pattern 14) | 25/27 | **never** | **never** | n = 2 | n = 2 |
| Lowercase letters | 26/27 | **never** | **never** | n = 1 | n = 1 |
| Starts at B | 26/27 | **never** | **never** | n = 1 | n = 1 |
| Row one letter short | 26/27 | n = 2 | n = 1 | n = 1 | n = 1 |
| Repeat count fixed at n | 25/27 | n = 2 | n = 2 | **never** | n = 2 |

A letter is always one character, so a row is exactly `2i - 1` bytes whatever
letters are on it — the same reason Patterns 11, 14 and 15 gave. Note the last
row of the table: the first-column check, which catches the three value bugs, is
the one thing blind to a wrong *count*, and the length check is the reverse. You
need both, or the exact comparison.

Totals: n(n+1)/2 letters — 351 at n = 26 — with letter i appearing exactly i times.
The rows do not nest: over n from 1 to 26 there are 0 nesting pairs and 325
non-nesting ones, exactly as in Pattern 4.

## The alphabet ceiling sits where Pattern 14's does

The letter comes from the row index, so the first row that can run past Z is row
27 — measured at n = 27, 30 and 40, the first row containing a non-letter is
always row 27, and at n = 27 that row is made of `[`. Same silence, same
precondition: **1 <= n <= 26**.

## A prediction that failed, and what it was wrong about

Patterns 11 and 14 established a rule: the buffer trick pays when a row cannot be
built by a single repetition. Every letter on a row is the same here, so the
prediction was that the buffer would buy nothing — as in the star patterns.

Measured at n = 6,000, which is past the alphabet and included only to expose the
code paths:

| Version | Time | |
|---|---|---|
| Letter at a time | 582.03ms | |
| Append per cell | 131.56ms | 4.4x |
| Repeat the two-character unit by hand | 125.24ms | 1.05x — no help |
| Fill the spaces, stripe the letters in | 19.86ms | **6.3x** |
| One buffer, restriped | 12.46ms | 1.6x |

So the buffer is worth about **10.5x** over appending per cell, not nothing. The
prediction was wrong, and the rule was not.

The mistake was in classifying the row. With a separator between the letters, a
row is `A A A` — not one character repeated, but a **two-character unit** `"A "`
repeated, minus the final space. That is still an alternation as far as a
character-by-character loop is concerned, which is why appending per cell costs
what it does.

Two things then follow, and they differ by language:

- **C++** has no way to repeat a two-character unit in one operation, so the win
  comes from the other direction: allocate the row as a bulk fill of spaces, then
  write the letters into the even positions. That is 6.3x. Keeping one buffer for
  the whole pattern — so the spaces are written once ever, and only the letters
  are restriped — adds 1.6x.
- **Python and Java can** repeat the unit: `(c + " ") * (i - 1) + c` is a single
  bulk operation. Measured at n = 3,000, that is 5.62ms against 66.46ms for
  joining a list of letters — about **12x** — and against 209.86ms for the
  restriped-list version, which is the slowest of the bulk forms in Python.

So the fastest version is a genuinely different technique in each language, and
the C++ answer is the worst choice in Python.

## At the sizes this pattern actually accepts

The valid range tops out at n = 26, where the whole output is 702 bytes:

| n | Letter at a time | Build each row | Best form | Output |
|---|---|---|---|---|
| 10 | 1.89us | 0.73us | 0.42us | 110 bytes |
| 20 | 7.00us | 2.76us | 0.90us | 420 bytes |
| **26** | **11.58us** | **4.52us** | **1.18us** | **702 bytes** |

As in Pattern 15, the ordering holds and the absolute cost does not matter. The
reason to know which version is fastest is that the same shapes appear in patterns
without a ceiling.

<!-- @intuition -->
The interesting part of this one is not the shape, which is Pattern 4 with letters, but what happens when you try to apply a rule from two patterns ago and it gives the wrong answer. The rule was sound: a row that cannot be produced in one bulk operation costs per-cell work, and a buffer removes it. What was wrong was the reading of this row as uniform. It looks uniform because every letter is the same, but the separators are part of it, so what actually repeats is a pair. And a pair is something Python and Java can repeat in one call while C++ cannot, which is why the fastest code here is not the same code in the three languages — the structure of the row is identical and the operations available to express it are not.

<!-- @approach -->
### Letter at a Time

<!-- @idea -->
Nested loops printing the row's letter on every inner iteration, with a separator between.

<!-- @steps -->
1. Loop over the rows from one up to and including n, with n at most 26.
2. Take this row's letter as 'A' plus the row index minus one.
3. Loop the inner counter from zero up to but not including i.
4. Print a space first if this is not the first letter, then the row's letter.
5. Print a newline after the inner loop finishes.

<!-- @complexity -->
- time: O(n^2) letters, with one stream operation per letter and per separator
- space: O(1)
- note: The direct translation, and the version where the row-versus-column choice is visible. Measured 11.58 microseconds at n = 26, the largest valid input, against 1.18 for the best version — about 10x on a job of 702 bytes.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        char c = char('A' + i - 1);
        for (int j = 0; j < i; j++) {
            if (j) cout << ' ';
            cout << c;
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: The letter is fixed for the whole row, which is why it is computed here rather than inside the inner loop.
- 7: j appears in this header and nowhere else in the function — it is a repeat count, exactly as in Pattern 4.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        char c = (char) ('A' + i - 1);
        for (int j = 0; j < i; j++) {
            if (j > 0) System.out.print(' ');
            System.out.print(c);
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 3: The value comes from the row, not the column. Using j here produces Pattern 14, which is a well-formed triangle and the wrong one.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        c = chr(ord("A") + i - 1)
        for j in range(i):
            if j > 0:
                print(" ", end="")
            print(c, end="")
        print()


# Defined only for n up to 26. The letter comes from the row, so
# row 27 is the first that can run past Z.
```

<!-- @annotations -->
- 3: One letter per row, computed once. Naming the inner variable _ would say honestly that it is never read.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Assemble the row into a string and print it in one operation.

<!-- @steps -->
1. Loop over the rows and take this row's letter.
2. Start an empty row string.
3. Append the letter i times, with a separator before all but the first.
4. Print the finished row followed by a newline.
5. The stream operations drop from one per letter to one per row.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations, still one append per letter
- space: O(n) for the longest row
- note: Measured 4.52 microseconds at n = 26, and 131.56ms at n = 6,000 against 582.03ms for printing letter by letter — 4.4x. That is the modest step Patterns 11 and 14 measured, and for the same reason: with separators, the row is an alternation rather than a single fill.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        char c = char('A' + i - 1);
        string row;
        for (int j = 0; j < i; j++) {
            if (j) row += ' ';
            row += c;
        }
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 11: One append per letter, with a branch on every iteration. Allocating the row as spaces and writing the letters in is 6.3x faster.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        char c = (char) ('A' + i - 1);
        StringBuilder row = new StringBuilder();
        for (int j = 0; j < i; j++) {
            if (j > 0) row.append(' ');
            row.append(c);
        }
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 5: The inner loop survives here. Java's repeat can remove it entirely, which is the next approach.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        print(" ".join([chr(ord("A") + i - 1)] * i))


# A list of i identical letters, joined. Clear, and about 12x
# slower than repeating the two-character unit directly.
```

<!-- @annotations -->
- 3: join builds the separators as it goes, so no trailing space can appear — but it still walks i list elements.

<!-- @approach -->
### Stop Rebuilding the Separators

<!-- @idea -->
Produce the row without touching it character by character — by repeating the two-character unit where the language allows it, and by keeping one buffer where it does not.

<!-- @steps -->
1. Notice that a row is the unit made of the letter and a space, repeated, minus the final space.
2. In Python and Java, build that with one repetition call.
3. In C++, where no such call exists, allocate one buffer of spaces for the whole pattern.
4. For each row, write the letter into the even positions and emit the first 2i minus one characters.
5. Either way, the separators are never assembled one at a time.

<!-- @complexity -->
- time: O(n^2) characters written; in C++ the spaces are written once for the whole pattern
- space: O(n) — one buffer of 2n - 1 characters
- note: The fastest in each language, by different routes. C++: 12.46ms at n = 6,000 against 131.56ms, about 10.5x. Python: 5.62ms at n = 3,000 against 66.46ms for joining a list, about 12x — and the C++ technique, a restriped list, is the slowest bulk form in Python at 209.86ms.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    string row(2 * n - 1, ' ');
    for (int i = 1; i <= n; i++) {
        char c = char('A' + i - 1);
        for (int k = 0; k < 2 * i - 1; k += 2) row[k] = c;
        cout.write(row.data(), 2 * i - 1);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 7: The spaces are written once, here, for the whole pattern. Every later row reuses them untouched.
- 10: Only the even positions are rewritten. The odd ones are already the separators and never change.
- 11: The row is emitted as one block of exactly 2i - 1 characters, safe at every size because a letter never widens.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        String c = String.valueOf((char) ('A' + i - 1));
        System.out.println((c + " ").repeat(i - 1) + c);
    }
}
```

<!-- @annotations -->
- 4: repeat takes the two-character unit, so the whole row is one call. At i = 1 it repeats zero times and leaves the single letter.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        c = chr(ord("A") + i - 1)
        print((c + " ") * (i - 1) + c)


# One repetition of the two-character unit, then the last letter
# without its space. Measured about 12x faster than joining a list.
```

<!-- @annotations -->
- 4: Repeating the unit i - 1 times and adding the final letter is what avoids a trailing space, with no branch anywhere.

<!-- @example -->

<!-- @input -->
n = 5

<!-- @output -->
A, then B twice, C three times, D four times, E five times — fifteen letters

<!-- @why -->
Small enough to read at a glance, and it fixes the totals that the three value bugs will be shown to preserve.

<!-- @walkthrough -->
1. Row 1 takes the letter 'A' plus 0, which is A, and prints it once.
2. Row 2 takes B and prints it twice, and so on to row 5.
3. The inner counter never appears in what is printed — it only decides how many times.
4. The letter total is 1 + 2 + 3 + 4 + 5, which is 15, and letter i appears exactly i times.
5. Row i is 2i minus one characters, since a letter is one character and the separators are single spaces.
6. Printing the column's letter instead would give A / A B / A B C, which is Pattern 14.
7. That version has the same letter total and the same row lengths, so only the contents distinguish them.

<!-- @example -->

<!-- @input -->
A rule from Patterns 11 and 14, applied here and checked

<!-- @output -->
The prediction was wrong by a factor of ten

<!-- @why -->
A stated rule is worth testing against a case it seems to cover, and this one does not behave as the rule appeared to say.

<!-- @walkthrough -->
1. Patterns 11 and 14 concluded that a buffer pays when a row cannot be made by a single repetition.
2. Every letter on a row here is identical, so the row looked like a single repetition and the buffer looked pointless.
3. Measured, keeping one buffer is worth about 10.5 times over appending per cell.
4. The error was in reading the row: with separators, A A A is not one character repeated but the pair A-space repeated.
5. To a character-by-character loop that is an alternation, exactly as in Pattern 11.
6. So the rule held and the classification did not — the row is a repetition of a unit, not of a character.
7. That distinction turns out to matter, because only some languages can repeat a unit in one operation.

<!-- @example -->

<!-- @input -->
The fastest version in C++ and in Python

<!-- @output -->
Two different techniques, each poor in the other language

<!-- @why -->
The same structural insight produces different code depending on what the language can express in one call.

<!-- @walkthrough -->
1. In Python the unit can be repeated directly, so a row is one expression and no loop is needed.
2. Measured at n = 3,000, that is 5.62 milliseconds against 66.46 for joining a list of letters.
3. C++ has no equivalent call for repeating a two-character unit, and doing it by hand measured no better than appending — 125.24 against 131.56 milliseconds.
4. So C++ takes the other route: allocate the row as a bulk fill of spaces, then write letters into the even positions.
5. That measured 19.86 milliseconds, and keeping one buffer across the whole pattern took it to 12.46.
6. The same restriped-list technique in Python is the slowest of the bulk forms, at 209.86 milliseconds.
7. Each language's best answer is therefore roughly the other's worst, from one shared observation about the row.

<!-- @example -->

<!-- @input -->
n = 26, the largest input this pattern accepts

<!-- @output -->
702 bytes, produced in 11.58 microseconds by the slowest version

<!-- @why -->
Keeps the timing table in proportion, as Pattern 15 established for the letter patterns.

<!-- @walkthrough -->
1. The alphabet supplies 26 letters, so n cannot exceed 26.
2. At n = 26 the output is 351 letters and 702 bytes including separators and newlines.
3. Printing letter by letter takes 11.58 microseconds there.
4. Building each row takes 4.52, and the best version 1.18.
5. So the ordering matches the measurements at large n, and the whole job is twelve microseconds at worst.
6. The reason to know which version wins is that the same row shapes appear in patterns with no ceiling.
7. Within this pattern, choose on clarity — and prefer the version that cannot produce a trailing space.

<!-- @visualization custom -->

<!-- @description -->
A grid whose cells all carry the same letter within a row, with the row's letter shown in a badge fed by the row counter, and the inner counter drawn hollow and greyed as counts only — the same treatment Pattern 4 used, so the parallel is visible rather than asserted. Add a toggle that switches which counter feeds the cells; flipping it redraws the grid as A / A B / A B C and labels it Pattern 14, byte-identical for all n up to 26. The centre of the figure is the row's structure. Draw one row twice: once as a strip of individual cells, each a separate write, and once as a repeating two-cell unit — letter, space — with the final space struck out. Make the unit boundary the emphasised element, because the whole performance result follows from it. Beneath, two lanes labelled by language: a Python lane where the unit is stamped once and the row appears whole, and a C++ lane where the unit cannot be stamped, so instead a permanent space skeleton is laid down once for the entire pattern and only the even cells are recoloured per row. Show the skeleton persisting across rows while the letters change, since that persistence is where its win comes from. Close with two bar groups rather than one, so the languages are not conflated: C++ reading 582.03ms, 131.56ms, 19.86ms, 12.46ms, and Python reading 2024.96ms, 66.46ms, 5.62ms with the restriped variant drawn at 209.86ms in a contrasting colour and labelled the C++ answer, worst here. Beside both, a small block labelled the whole valid output at n = 26 is 702 bytes.

<!-- @sampleInput -->
```json
{"primary":{"n":5,"output":"A\nB B\nC C C\nD D D D\nE E E E E\n","rows":5,"lettersPerRow":[1,2,3,4,5],"letters":15,"formula":"n(n+1)/2","rowByteLength":"2i - 1","valueRule":"'A' + i - 1, from the row counter","innerCounterUsedInBody":false},"relationToPattern14":{"claim":"printing the column's letter instead of the row's gives Pattern 14","verifiedOver":"n = 0..26, 0 differences","wrongHereOn":"25 of 27","correctAt":[0,1],"precedent":"Pattern 4's same swap gave Pattern 3"},"nesting":{"nestingPairs":0,"nonNestingPairs":325,"over":"n = 1..26","sameAs":"Pattern 4"},"counts":{"letters":"n(n+1)/2","atN26":351,"letterIAppears":"i times","rowLength":"2i - 1 characters"},"domain":{"validRange":"1 <= n <= 26","firstRowThatCanRunPastZ":27,"measuredAt":[27,30,40],"firstBadRowAlways":27,"atN27LastRowLetter":"[","enforcement":"none — nothing raises"},"bugPanel":{"variants":[{"name":"prints the column's letter (= Pattern 14)","wrongOn":"25 of 27","correctAt":[0,1]},{"name":"lowercase letters","wrongOn":"26 of 27","correctAt":[0]},{"name":"starts at B","wrongOn":"26 of 27","correctAt":[0]},{"name":"row one letter short","wrongOn":"26 of 27","correctAt":[0]},{"name":"repeat count fixed at n","wrongOn":"25 of 27","correctAt":[0,1]}]},"checkPanel":{"columns":["letter count","line lengths","first column","exact"],"smallestNThatCatches":{"prints the column's letter":["never","never",2,2],"lowercase":["never","never",1,1],"starts at B":["never","never",1,1],"row one letter short":[2,1,1,1],"repeat count fixed at n":[2,2,"never",2]},"reading":["a letter is always one character, so a row is 2i-1 bytes whatever is on it","the first-column check catches the value bugs and is blind to a wrong count","the length check is the reverse — you need both, or the exact comparison"]},"assertions":["row i holds exactly i letters","every letter on row i is the i-th letter of the alphabet","row i is exactly 2i - 1 characters long","total letters equal n(n+1)/2","n is at most 26"],"failedPrediction":{"rule":"from Patterns 11 and 14 — a buffer pays when a row cannot be built by a single repetition","predicted":"no buffer win, since every letter on a row is identical","measured":"about 10.5x over appending per cell","whatWasWrong":"the classification, not the rule — with separators the row repeats a two-character unit, not a character","consequence":"to a character-by-character loop that is an alternation, exactly as in Pattern 11"},"languageSplit":{"python":{"technique":"(c + ' ') * (i - 1) + c — one repetition of the unit","atN3000Ms":5.62,"versusJoinList":66.46,"gain":"about 12x","restripedListMs":209.86,"note":"the C++ technique is the slowest bulk form here"},"cpp":{"technique":"one buffer of spaces for the whole pattern, letters restriped into the even positions","atN6000Ms":12.46,"versusAppendPerCell":131.56,"gain":"about 10.5x","repeatUnitByHandMs":125.24,"note":"repeating the unit by hand is no better than appending — C++ has no single call for it"},"conclusion":"each language's best answer is roughly the other's worst, from one shared observation about the row"},"buildPanel":{"cppPastAlphabet":[{"n":3000,"letterAtATimeMs":145.34,"appendPerCellMs":33.52,"fillThenStripeMs":5.04,"reusedBufferMs":3.12},{"n":6000,"letterAtATimeMs":582.03,"appendPerCellMs":131.56,"fillThenStripeMs":19.86,"reusedBufferMs":12.46}],"cppAtValidSizes":[{"n":10,"letterAtATimeUs":1.89,"appendPerCellUs":0.73,"bestUs":0.42,"bytes":110},{"n":20,"letterAtATimeUs":7.00,"appendPerCellUs":2.76,"bestUs":0.90,"bytes":420},{"n":26,"letterAtATimeUs":11.58,"appendPerCellUs":4.52,"bestUs":1.18,"bytes":702}],"pythonAtValidSizes":[{"n":26,"letterAtATimeUs":159.04,"joinListUs":15.36,"repeatUnitUs":12.94,"restripedListUs":24.45}],"caveat":"the millisecond figures are at sizes past the 26-letter limit and expose the code paths only"},"scale":{"outputBytes":"n^2 + n","atN26":702,"reading":"the ordering holds and the absolute cost does not matter; the reason to know it is that these row shapes recur in patterns with no ceiling"}}
```

<!-- @highlights -->
- Every cell in a row carries the same letter, shown in a badge fed by the row counter.
- The inner counter is drawn hollow and greyed as counts only, the same treatment Pattern 4 used.
- A toggle switches which counter feeds the cells, redrawing the grid as Pattern 14.
- The label notes it is byte-identical to Pattern 14 for all n up to 26.
- One row is drawn twice: as a strip of individual cells, and as a repeating two-cell unit of letter and space.
- The final space of the unit strip is struck out.
- The unit boundary is the emphasised element, since the whole performance result follows from it.
- Two language lanes sit beneath: a Python lane where the unit is stamped once and the row appears whole.
- A C++ lane where the unit cannot be stamped, so a permanent space skeleton is laid down once.
- Only the even cells are recoloured per row, and the skeleton persists across rows while the letters change.
- That persistence is drawn, since it is where the C++ win comes from.
- Two separate bar groups keep the languages from being conflated.
- The C++ group reads 582.03ms, 131.56ms, 19.86ms and 12.46ms.
- The Python group reads 2024.96ms, 66.46ms and 5.62ms.
- Python's restriped variant is drawn at 209.86ms in a contrasting colour, labelled the C++ answer, worst here.
- A small block beside both reads the whole valid output at n = 26 is 702 bytes.

<!-- @edgeCases -->
- n equal to zero — no output, and the C++ buffer version needs its guard since it allocates before looping.
- n equal to one — a single A, where two of the five mistakes still pass.
- n equal to two — the smallest input that catches printing the column's letter instead of the row's.
- n equal to twenty-six — the largest valid input; the last row is Z twenty-six times and the whole output is 702 bytes.
- n equal to twenty-seven — the first invalid input, and row 27 is made of the character after Z.
- Negative n — no output from the loop versions; the C++ buffer version needs the guard.
- The unit repetition at i equal to one — repeating zero times and adding the letter, which is why the expression has the final letter outside the repeat.
- A caller expecting the letters to advance along the row — that is Pattern 14, which shares this pattern's letter total and row lengths.
- A caller expecting no separators — then a row really is one character repeated, and every performance result in this container changes.
- Very large n — meaningless here, but the row shapes recur in patterns without a ceiling, which is why the code paths were timed anyway.

<!-- @pitfalls -->
- Printing j where you meant i. The output is Pattern 14 — a well-formed triangle, correct at n = 1, and invisible to both summary checks.
- Reading the row as a single repetition. With separators it repeats a two-character unit, which is why the buffer is worth about 10.5x rather than nothing.
- Carrying the C++ technique into Python. Restriping a list is the slowest bulk form there, at 209.86ms against 5.62ms for repeating the unit.
- Carrying the Python technique into C++. Repeating the unit by hand measured no better than appending per cell.
- Checking with a letter count or line lengths. A letter is always one character, so neither can see a wrong letter.
- Checking only the first column. That catches the three value bugs and is blind to a wrong repeat count.
- Leaving the precondition unstated. Row 27 prints the character after Z and nothing raises.
- Appending the separator after each letter rather than between. The unit form avoids this by construction; the append form needs the branch.
- Recomputing the row's letter inside the inner loop. It is fixed for the whole row.
- Assuming a large n is worth optimising for. The largest valid input produces 702 bytes.

<!-- @doubt -->
### Patterns 11 and 14 said the buffer only pays when the row is not a repetition. Why does it pay here?

<!-- @answer -->
Because this row is not the repetition it looks like. Every letter on it is the same, but the separators are part of the row, so what repeats is the pair `A` and a space — and to a loop that appends one character at a time, that is an alternation exactly like Pattern 11's. Measured, keeping one buffer is worth about 10.5x over appending per cell at n = 6,000. The rule from those patterns held; the classification of this row did not. It is worth checking a rule against a case it appears to cover, because the failure is usually in the reading rather than in the rule.

<!-- @doubt -->
### Why is the fastest version different in C++ and Python?

<!-- @answer -->
Because only some languages can repeat a two-character unit in one call. In Python `(c + " ") * (i - 1) + c` builds the entire row as a single operation — 5.62ms at n = 3,000 against 66.46ms for joining a list. C++ has no equivalent, and doing it by hand measured no better than appending per cell (125.24ms against 131.56ms). So C++ takes the other route: allocate one buffer of spaces for the whole pattern and rewrite only the even positions each row, which is 12.46ms. Applying either language's answer in the other is a mistake — the restriped-list form is Python's slowest bulk version at 209.86ms.

<!-- @doubt -->
### How is this different from Pattern 14?

<!-- @answer -->
Only in which counter supplies the letter, and that is enough to make each pattern the other's most likely bug. Printing the column's letter here gives output byte-identical to Pattern 14 for every n from 0 to 26, and it is correct at n = 0 and n = 1. Both patterns have the same letter total, n(n+1)/2, and the same row lengths, 2i - 1, so neither a count nor a length check can tell them apart at any size. The assertion that separates them is that every letter on row i is the same one — the i-th.

<!-- @doubt -->
### Which single check should I write?

<!-- @answer -->
Two, because neither is enough alone. Checking that row i begins with the i-th letter catches all three value mistakes — the column swap at n = 2, lowercase and a wrong starting letter at n = 1 — and is completely blind to a wrong repeat count, since a rectangle of the right letters still starts each row correctly. Checking the row lengths catches the count mistakes and is blind to the value ones, because a letter is always one character. Assert both, or compare the rows against the i-th letter repeated i times, which is the whole specification in one line.

<!-- @doubt -->
### Does the alphabet limit behave like Pattern 14's or Pattern 15's?

<!-- @answer -->
Like Pattern 14's. The letter comes from the row index, so the first row that can run past Z is row 27 — measured at n = 27, 30 and 40, the first row containing a non-letter is always row 27, and the first 26 rows look perfect. Pattern 15 was the exception because its longest row prints first. Nothing raises here either, so the precondition 1 <= n <= 26 has to be stated. At n = 27 the last row is made of `[`, the character immediately after Z.
