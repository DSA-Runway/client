---
id: pattern-17-alpha-hill-pattern
topic: Pattern Printing
title: Pattern 17 - Alpha-Hill Pattern
difficulty: Easy
status: ready
prerequisites:
  - pattern-7-star-pyramid
  - pattern-12-number-crown-pattern
  - pattern-14-increasing-letter-triangle
  - nested-loops
relatedIds:
  - pattern-7-star-pyramid
  - pattern-12-number-crown-pattern
  - pattern-16-alpha-ramp-pattern
  - pattern-18-alpha-triangle-pattern
  - nested-loops
---

<!-- @summary -->
Print a centred pyramid whose rows climb to a letter and back down — where the per-row palindrome that Pattern 12 lost at n = 10 holds across the whole domain and is still nearly useless as a check, and where buffering the letters while leaving the spaces in a loop measures 2.2x slower than doing nothing clever at all.

<!-- @theory -->
## The problem

Print n rows. Row i holds n - i leading spaces, then the letters A up to the i-th,
then back down to A.

```
n = 6           A
              ABA
             ABCBA
            ABCDCBA
           ABCDEDCBA
          ABCDEFEDCBA
```

No separators between the letters — the same reason Pattern 12 gave, that a
centred shape only lines up when the characters butt together.

## The exact counts

| | |
|---|---|
| Letters | **n²** — 676 at n = 26 |
| Spaces | **n(n - 1)/2** — 325 at n = 26 |
| Row i length | n + i - 1 |
| Widest row | 2n - 1 |
| Whole output at n = 26 | 1,001 characters, 1,027 bytes with newlines |

Both formulas hold for every n from 1 to 26, verified. This is Pattern 7's
geometry exactly — same row lengths, same widest row — with letters where the
stars were.

## The palindrome invariant survives here, and is still a bad check

Pattern 12 had a per-row palindrome that stopped being true at n = 10, because its
numbers widened and reversing `10` gives `01`. Here letters never widen, so the
property holds across the entire domain: ignoring the leading spaces, **all 351
rows of every n from 1 to 26 read the same backwards**, with no exceptions.

So the check is *sound*. It is also nearly worthless. Measured against the correct
output for every n from 1 to 26:

| Mistake | Wrong on | Letters | Line lengths | Palindrome | After strip |
|---|---|---|---|---|---|
| Spaces `n-i+1` (shifted right) | 26/27 | **never** | n = 1 | **never** | **never** |
| Right half repeats the peak | 25/27 | **never** | **never** | n = 2 | n = 2 |
| No leading spaces at all | 25/27 | **never** | n = 2 | **never** | **never** |
| Trailing spaces as well as leading | 25/27 | **never** | n = 2 | **never** | **never** |
| Peak letter doubled (`ABCCBA`) | 26/27 | n = 1 | n = 1 | **never** | n = 1 |

The palindrome test catches **one of five**, at n = 2. A shifted hill is still a
palindrome. A hill with no leading spaces is still a palindrome. `ABCCBA` is still
a palindrome.

That is the pair worth holding onto: in Pattern 12 the same appealing check was
**false of the correct output** past n = 10, and here it is **true of almost every
wrong output**. Two different ways for a symmetry check to be useless, and neither
of them is that the shape is not symmetric.

Two more results carried over:

- The **letter count** catches only the doubled peak — the other four leave it at
  exactly n².
- **Stripping** each line before comparing hides three of the five, including two
  structural ones, exactly as Pattern 7 measured. These spaces are leading, not
  interior like Pattern 12's.

What works is line lengths plus the palindrome together — lengths catch four and
the palindrome catches the fifth — or comparing the rows against what they should
be.

## The alphabet ceiling

Row i uses the i-th letter, so the first row that can run past Z is row 27 —
measured at n = 27, 30 and 40, the first row containing a non-letter is always row
27. Same silence, same precondition: **1 <= n <= 26**.

## Optimising the letters while leaving the spaces makes it slower

Row i's left half is a prefix of `ABC...` and its right half is a **suffix** of
`...CBA` — verified across all 351 rows from n = 1 to 26, with no failures either
way. So both halves can come from prebuilt buffers, and the gap from a third.

Pattern 12 measured that the gap, not the digits, was where its time went. That
result reproduces here, and harder. At n = 6,000, past the alphabet and included
only to expose the code paths:

| Version | Time | Against the previous |
|---|---|---|
| Character at a time | 887.37ms | |
| Build each row | 136.74ms | 6.5x |
| Letters buffered, gap still looped | 299.17ms | **0.46x — worse** |
| Three buffers, gap included | 3.33ms | 90x |

Buffering the letters and leaving the spaces as a per-space loop is **2.2x slower
than not bothering**, because it replaces a bulk fill of the leading spaces with
n - i individual writes. In Pattern 12 that same half-measure still gained a token
1.3x; here it loses outright.

The full version is **247x to 266x** over printing character by character. Python
agrees on the shape: 7x for the first step and a further 42x to 51x for the
buffers.

## At the sizes this pattern accepts

| n | Char at a time | Build each row | Letters only | Three buffers | Bytes |
|---|---|---|---|---|---|
| 10 | 2.87us | 0.80us | 1.42us | 0.70us | 155 |
| 20 | 10.60us | 3.53us | 4.68us | 1.42us | 610 |
| **26** | **17.55us** | **5.92us** | **7.50us** | **2.12us** | **1,027** |

The half-measure is visibly slower than building each row even here, at the
largest valid input — which is the one performance result in this container that
shows up at the pattern's real scale.

<!-- @intuition -->
This shape hands you a symmetry and invites you to test it, and the test is worth almost nothing — a hill shifted a column right is still symmetric, a hill with its peak doubled is still symmetric, a hill with no indentation at all is still symmetric. The property is real and it constrains almost nothing, which is a different failure from Pattern 12's, where the same property quietly stopped being true. The other half repeats a lesson about where the work is. It is natural to treat the letters as the interesting part and the indentation as scaffolding, and it is the indentation that decides the running time: buffer the letters and leave the spaces alone and you end up behind where you started.

<!-- @approach -->
### Character at a Time

<!-- @idea -->
Three inner loops per row: the leading spaces, the letters climbing, then the letters descending.

<!-- @steps -->
1. Loop over the rows from one up to and including n, with n at most 26.
2. Print n minus i spaces.
3. Print the letters A through the i-th, climbing.
4. Print the letters from the one before the peak back down to A.
5. Print a newline, with no trailing spaces.

<!-- @complexity -->
- time: O(n^2) characters, one stream operation per character
- space: O(1)
- note: The direct translation, and the version where the two halves are most visible. Measured 887.37ms at n = 6,000 against 136.74ms for building each row — 6.5x. At n = 26, the largest valid input, it is 17.55 microseconds on a 1,027-byte job.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int s = 0; s < n - i; s++) cout << ' ';
        for (int k = 0; k < i; k++) cout << char('A' + k);
        for (int k = i - 2; k >= 0; k--) cout << char('A' + k);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: n - i spaces, shrinking as the rows widen. Writing n - i + 1 shifts the whole hill right without changing the letter count.
- 8: Starting at i - 2 rather than i - 1 is what stops the peak from being printed twice.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int s = 0; s < n - i; s++) System.out.print(' ');
        for (int k = 0; k < i; k++) System.out.print((char) ('A' + k));
        for (int k = i - 2; k >= 0; k--) System.out.print((char) ('A' + k));
        System.out.println();
    }
}
```

<!-- @annotations -->
- 5: The descending half stops one short of the peak, so row i holds 2i - 1 letters rather than 2i.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for s in range(n - i):
            print(" ", end="")
        for k in range(i):
            print(chr(ord("A") + k), end="")
        for k in range(i - 2, -1, -1):
            print(chr(ord("A") + k), end="")
        print()


# Defined only for n up to 26. Row i uses the i-th letter, so row
# 27 is the first that can run past Z.
```

<!-- @annotations -->
- 7: range(i - 2, -1, -1) descends from one below the peak to A, which is what makes the row a palindrome.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Assemble the spaces and both halves into one string, then print it in one operation.

<!-- @steps -->
1. Loop over the rows.
2. Start the row as n minus i spaces, built in one step.
3. Append the climbing letters, then the descending ones.
4. Print the finished row followed by a newline.
5. The stream operations drop from one per character to one per row.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations
- space: O(n) for the widest row, which is 2n - 1
- note: Measured 136.74ms at n = 6,000, worth 6.5x. Note what it already gets right: the leading spaces are one bulk fill rather than a loop, which is exactly what the half-optimised version below throws away.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        string row(n - i, ' ');
        for (int k = 0; k < i; k++) row += char('A' + k);
        for (int k = i - 2; k >= 0; k--) row += char('A' + k);
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 7: The leading spaces in one construction. Replacing this with a loop of stream writes is what makes the half-optimised version 2.2x slower than this one.
- 8: The letters are still appended one at a time, which is what the buffers remove.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        StringBuilder row = new StringBuilder(" ".repeat(n - i));
        for (int k = 0; k < i; k++) row.append((char) ('A' + k));
        for (int k = i - 2; k >= 0; k--) row.append((char) ('A' + k));
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 3: repeat builds the indentation in one step, so only the letters remain as per-character work.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        left = "".join(chr(ord("A") + k) for k in range(i))
        print(" " * (n - i) + left + left[-2::-1])


# left[-2::-1] is the climbing half reversed with the peak dropped,
# which is exactly the descending half.
```

<!-- @annotations -->
- 4: One slice produces the descending half from the climbing one, so the row is built in two operations rather than 2i - 1.

<!-- @approach -->
### Three Buffers

<!-- @idea -->
Build the ascending letters, the descending letters and the gap once each, then write three slices per row.

<!-- @steps -->
1. Guard against a non-positive n, since the buffers are built before the loop.
2. Build the ascending string A through the n-th letter.
3. Build the descending string, which is that one reversed.
4. Build one gap of n spaces.
5. For each row, write a prefix of the gap, a prefix of the ascending string, and a suffix of the descending one.

<!-- @complexity -->
- time: O(n^2) characters written, three bulk writes per row, no per-character work
- space: O(n) — two letter buffers and a gap of n spaces
- note: The fastest by a wide margin — 3.33ms at n = 6,000 against 136.74ms, and 247x to 266x over printing character by character. The gap must be buffered too: leaving it as a loop measured 299.17ms, which is slower than not buffering anything.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    string up, down, gap(n, ' ');
    for (int k = 0; k < n; k++) up += char('A' + k);
    for (int k = n - 1; k >= 0; k--) down += char('A' + k);
    for (int i = 1; i <= n; i++) {
        cout.write(gap.data(), n - i);
        cout.write(up.data(), i);
        cout.write(down.data() + (n - i + 1), i - 1);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 7: Three buffers, all built once. The gap is the one people leave out, and leaving it out costs more than the other two save.
- 11: A prefix of the gap — one bulk write in place of a loop that ran n(n-1)/2 times across the pattern.
- 13: A suffix of the descending string, because that string grows on the left as the letters fall. Its length is i - 1, one short of the climbing half.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    StringBuilder up = new StringBuilder();
    for (int k = 0; k < n; k++) up.append((char) ('A' + k));
    String asc = up.toString(), desc = up.reverse().toString(), gap = " ".repeat(n);
    for (int i = 1; i <= n; i++) {
        System.out.println(gap.substring(0, n - i) + asc.substring(0, i)
                + desc.substring(n - i + 1));
    }
}
```

<!-- @annotations -->
- 5: reverse mutates the builder, so the ascending string is captured before it is called.

<!-- @code python -->
```python
def pattern(n):
    up = "".join(chr(ord("A") + k) for k in range(n))
    down = up[::-1]
    gap = " " * n
    for i in range(1, n + 1):
        print(gap[: n - i] + up[:i] + down[n - i + 1 :])


# Measured 42x to 51x faster than building each row, and no guard
# is needed since " " * 0 is the empty string.
```

<!-- @annotations -->
- 6: Three slices and one print per row. Nothing inside the loop touches an individual character.

<!-- @example -->

<!-- @input -->
n = 6

<!-- @output -->
Six rows climbing to F and back, thirty-six letters and fifteen spaces

<!-- @why -->
Six rather than four, because it shows the descending half long enough to read and puts the peak clearly in the middle.

<!-- @walkthrough -->
1. Row 1 has n minus 1, so 5, spaces and the single letter A.
2. Row 2 has 4 spaces and A B A, which is 3 letters.
3. Row i has 2i minus one letters, since the descending half stops one short of the peak.
4. The letter total is the sum of the odd numbers, which is n squared, or 36.
5. The spaces total n(n-1)/2, which is 15.
6. Row i is n plus i minus one characters long, so the widest row is 2n minus one, which is 11.
7. Ignoring the indentation, every row reads the same backwards — and so do four of the five wrong versions below.

<!-- @example -->

<!-- @input -->
The palindrome check, run against five wrong outputs

<!-- @output -->
It catches one of them, at n = 2

<!-- @why -->
The most tempting check for this shape, and the one that constrains least — a different failure from Pattern 12's.

<!-- @walkthrough -->
1. Ignoring the leading spaces, every row of the correct output is a palindrome, at every n from 1 to 26 with no exceptions.
2. So unlike Pattern 12, where the same property stopped being true at n = 10, the check is sound here.
3. But a hill shifted one column right is still made of palindromic rows.
4. A hill with no leading spaces at all is too, and so is one with trailing spaces added.
5. A hill whose peak is doubled — A B C C B A — is a palindrome as well.
6. Only the version whose right half repeats the peak's successors rather than reversing is caught, at n = 2.
7. So a symmetry check confirms symmetry, which is not the same as confirming the shape.

<!-- @example -->

<!-- @input -->
Buffering the letters but not the gap, at n = 6,000

<!-- @output -->
299.17ms — slower than the version that buffers nothing

<!-- @why -->
Pattern 12 measured that the spaces were the cost; here optimising around them makes things actively worse.

<!-- @walkthrough -->
1. Building each row already writes the leading spaces as one bulk construction.
2. Taking the letters from prebuilt buffers removes the per-letter appends, which sounds like a clear improvement.
3. But the natural way to write it streams the gap one space at a time, replacing that bulk fill with n minus i writes.
4. Measured, that is 299.17ms against 136.74ms — 2.2 times slower than doing nothing clever.
5. Buffering the gap as well takes it to 3.33ms, about 90 times faster again.
6. In Pattern 12 the same half-measure still gained a token 1.3x; here it loses outright.
7. The difference is visible even at n = 26, where it is 7.50 microseconds against 5.92 for the simple version.

<!-- @example -->

<!-- @input -->
n = 26, the largest input this pattern accepts

<!-- @output -->
1,027 bytes, produced in 17.55 microseconds by the slowest version

<!-- @why -->
Keeps the timing table in proportion, as Patterns 15 and 16 established for the letter patterns.

<!-- @walkthrough -->
1. The alphabet supplies 26 letters, so n cannot exceed 26.
2. At n = 26 the output is 676 letters and 325 spaces, so 1,027 bytes including newlines.
3. Printing character by character takes 17.55 microseconds there.
4. Building each row takes 5.92, and the three-buffer version 2.12.
5. So the ordering matches the large-n measurements and the whole job is under twenty microseconds.
6. The one result that matters at this scale is the half-optimised version, at 7.50 microseconds — slower than the simple one.
7. That is worth knowing because it is the version someone reaches for after reading about buffers.

<!-- @visualization custom -->

<!-- @description -->
Draw each row as three bands — a ghost-cell gap, a climbing letter run, and a descending one — on a fixed 2n-1 field so the hill sits inside its bounding box, with a vertical accent line down the centre column marking the peak. Fill top to bottom and keep two running counters, letters against n squared and spaces against n(n-1)/2. The first panel is the palindrome trap: place five grids beside the correct one — shifted right, right half repeating the peak, no leading spaces, trailing spaces added, peak doubled — and run the palindrome test on every one of them literally, folding each row onto itself. Four of the five fold cleanly. Light the palindrome lamp green under those four and let only the right-half-repeating grid fail. Beside that, carry a small inset of Pattern 12's row 10 with its palindrome broken, labelled there the property stopped being true; here it stays true and stops being useful — the two failures should be shown together, since neither alone makes the point. The second panel is the cost. Draw three lanes with per-character emission as visible clicks: the simple lane stamps its indentation as one block and clicks out the letters; the half-optimised lane stamps the letters as blocks but clicks out every space, and its click counter must visibly overtake the simple lane; the full lane stamps all three bands as blocks. Time bars beneath read 887.37ms, 136.74ms, 299.17ms and 3.33ms, with the third bar drawn longer than the second and marked worse than doing nothing. Close with the scale block: the whole n = 26 output as a single small rectangle labelled 1,027 bytes.

<!-- @sampleInput -->
```json
{"primary":{"n":6,"output":"     A\n    ABA\n   ABCBA\n  ABCDCBA\n ABCDEDCBA\nABCDEFEDCBA\n","rows":6,"spacesPerRow":[5,4,3,2,1,0],"lettersPerRow":[1,3,5,7,9,11],"letters":36,"spaces":15,"rowLength":"n + i - 1","widestRow":11,"noSeparators":true},"counts":{"letters":"n^2","spaces":"n(n-1)/2","widestRow":"2n - 1","verified":"n = 1..26","atN26":{"letters":676,"spaces":325,"chars":1001,"bytesWithNewlines":1027}},"palindrome":{"holdsForCorrectOutput":true,"rowsChecked":351,"exceptions":0,"over":"n = 1..26","why":"letters never widen, unlike Pattern 12's numbers","butCatches":"one of five wrong outputs, at n = 2","stillPalindromic":["shifted one column right","no leading spaces at all","trailing spaces added","peak letter doubled"],"pattern12Contrast":"there the same property was FALSE of the correct output from n = 10; here it is TRUE of almost every wrong output"},"bugPanel":{"variants":[{"name":"spaces n-i+1 (shifted right)","wrongOn":"26 of 27","correctAt":[0]},{"name":"right half repeats the peak","wrongOn":"25 of 27","correctAt":[0,1]},{"name":"no leading spaces at all","wrongOn":"25 of 27","correctAt":[0,1]},{"name":"trailing spaces as well as leading","wrongOn":"25 of 27","correctAt":[0,1]},{"name":"peak letter doubled (ABCCBA)","wrongOn":"26 of 27","correctAt":[0]}]},"checkPanel":{"columns":["letter count","line lengths","palindrome","after strip","exact"],"smallestNThatCatches":{"spaces n-i+1":["never",1,"never","never",1],"right half repeats the peak":["never","never",2,2,2],"no leading spaces":["never",2,"never","never",2],"trailing spaces":["never",2,"never","never",2],"peak doubled":[1,1,"never",1,1]},"reading":["the letter count catches only the doubled peak — the other four leave it at exactly n^2","stripping hides three of the five, two of them structural, exactly as Pattern 7 measured","line lengths catch four and the palindrome catches the fifth, so together they cover all five"]},"assertions":["row i has exactly n - i leading spaces","row i holds exactly 2i - 1 letters","row i climbs A to the i-th letter and back to A","total letters equal n^2 and total spaces equal n(n-1)/2","n is at most 26"],"domain":{"validRange":"1 <= n <= 26","firstRowThatCanRunPastZ":27,"measuredAt":[27,30,40],"firstBadRowAlways":27,"enforcement":"none — nothing raises"},"buffers":{"up":"A through the n-th letter; row i's left half is a prefix of it","down":"that string reversed; row i's right half is a SUFFIX of it, of length i - 1","gap":"n spaces; row i takes a prefix of length n - i","verified":"351 rows over n = 1..26, 0 prefix failures and 0 suffix failures"},"buildPanel":{"pastAlphabet":[{"n":3000,"charAtATimeMs":221.95,"freshRowMs":34.39,"lettersOnlyMs":74.54,"threeBuffersMs":0.90},{"n":6000,"charAtATimeMs":887.37,"freshRowMs":136.74,"lettersOnlyMs":299.17,"threeBuffersMs":3.33}],"atValidSizes":[{"n":10,"charAtATimeUs":2.87,"freshRowUs":0.80,"lettersOnlyUs":1.42,"threeBuffersUs":0.70,"bytes":155},{"n":20,"charAtATimeUs":10.60,"freshRowUs":3.53,"lettersOnlyUs":4.68,"threeBuffersUs":1.42,"bytes":610},{"n":26,"charAtATimeUs":17.55,"freshRowUs":5.92,"lettersOnlyUs":7.50,"threeBuffersUs":2.12,"bytes":1027}],"caveat":"the millisecond figures are at sizes past the 26-letter limit and expose the code paths only"},"ratios":{"perCharToFreshRow":"6.5x","freshRowToLettersOnly":"0.46x — the half-measure is 2.2x SLOWER","lettersOnlyToThreeBuffers":"83x to 90x","perCharToThreeBuffers":"247x to 266x","why":"buffering the letters replaces a bulk fill of the indentation with n - i individual writes"},"python":{"perCharToRow":"7x","rowToBuffers":"42x to 51x","atN26Us":{"charAtATime":246.49,"freshRow":46.78,"threeBuffers":16.27}},"pattern12Contrast":{"there":"buffering the digits but not the gap still gained 1.3x","here":"the same half-measure loses 2.2x","reason":"building each row here already writes the indentation as one bulk fill"}}
```

<!-- @highlights -->
- Each row is three bands — a ghost-cell gap, a climbing letter run, a descending one — on a fixed 2n-1 field.
- A vertical accent line down the centre column marks the peak.
- Two running counters track letters against n squared and spaces against n(n-1)/2.
- The palindrome panel places five wrong grids beside the correct one.
- The palindrome test runs literally on every grid, folding each row onto itself.
- Four of the five fold cleanly and light the lamp green.
- Only the right-half-repeating grid fails the test.
- An inset carries Pattern 12's row 10 with its palindrome broken.
- It is labelled there the property stopped being true; here it stays true and stops being useful.
- Both failures are shown together, since neither alone makes the point.
- The cost panel draws three lanes with per-character emission as visible clicks.
- The simple lane stamps its indentation as one block and clicks out the letters.
- The half-optimised lane stamps the letters as blocks but clicks out every space, its counter overtaking the simple lane.
- The full lane stamps all three bands as blocks.
- Time bars read 887.37ms, 136.74ms, 299.17ms and 3.33ms, the third drawn longer than the second and marked worse than doing nothing.
- A closing block shows the whole n = 26 output as one small rectangle labelled 1,027 bytes.

<!-- @edgeCases -->
- n equal to zero — no output, and the buffer version needs its guard since it builds before looping.
- n equal to one — a single A with no indentation, where three of the five mistakes still pass.
- n equal to two — the smallest input that catches a right half repeating the peak.
- n equal to twenty-six — the largest valid input; 676 letters, 325 spaces, 1,027 bytes.
- n equal to twenty-seven — the first invalid input, and row 27 is the first containing a non-letter.
- Negative n — no output from the loop versions; the buffer version needs the guard.
- The first row — one letter and n minus one spaces, the narrowest.
- The last row — 2n minus one letters and no indentation, the widest.
- A judge that strips whitespace — a shifted hill and a hill with no indentation both pass, so the local test must not strip.
- A caller expecting separators between the letters — the halves would no longer meet cleanly at the peak, as in Pattern 12.

<!-- @pitfalls -->
- Testing the rows for symmetry. The property is true of the correct output at every valid n and also true of four of the five wrong ones measured.
- Assuming the palindrome check failed in Pattern 12 for the same reason it is weak here. There it was false of the correct output from n = 10; here it is true of almost everything.
- Counting letters. Only the doubled peak changes the total — the other four leave it at exactly n squared.
- Stripping lines before comparing. It hides the shifted hill and the one with no indentation, both structural.
- Starting the descending loop at i - 1 rather than i - 2. That prints the peak twice, giving 2i letters instead of 2i - 1.
- Writing n - i + 1 leading spaces. The hill shifts one column right, the letter count is unchanged, and stripping hides it.
- Buffering the letters and leaving the gap in a loop. Measured 2.2x slower than building each row plainly, because it discards a bulk fill.
- Adding trailing spaces to balance the leading ones. Invisible on screen and rejected by an exact comparison from n = 2.
- Treating the descending half as a prefix of the reversed alphabet. It is a suffix, and its length is i - 1 rather than i.
- Leaving the precondition unstated. Row 27 contains the character after Z and nothing raises.

<!-- @doubt -->
### Every row is a palindrome. Is that a good check?

<!-- @answer -->
It is a true statement and a poor check. Ignoring the leading spaces, all 351 rows of every n from 1 to 26 read the same backwards, with no exceptions — so unlike Pattern 12, the property does not stop being true. But measured against five wrong outputs, it catches one, at n = 2. A hill shifted a column right is still made of palindromic rows; so is one with no indentation at all; so is one with trailing spaces; so is `ABCCBA`, whose peak is doubled. Symmetry confirms symmetry. Check the line lengths as well, which catch four of the five, or compare the rows directly.

<!-- @doubt -->
### Pattern 12 said the palindrome check breaks at n = 10. Why not here?

<!-- @answer -->
Because letters never widen. Pattern 12's rows were made of numbers, and reversing a row containing `10` gives `01`, so from n = 10 the correct output stopped being palindromic and a checker asserting it rejected correct answers. A letter is one character at every size, so the property holds across this pattern's whole domain. The pair is worth keeping together: there the appealing check was false of the right answer, here it is true of almost every wrong one. Neither failure is that the shape is asymmetric.

<!-- @doubt -->
### Why is buffering the letters slower than not buffering at all?

<!-- @answer -->
Because of what it gives up. Building each row already writes the n - i leading spaces as a single bulk construction. The natural way to write a letters-only buffered version streams the gap one space at a time instead, so it trades 2i - 1 letter appends for n - i individual stream writes. Measured at n = 6,000 that is 299.17ms against 136.74ms — 2.2 times slower. Buffering the gap as well takes it to 3.33ms. Pattern 12 measured the same asymmetry more gently, where the half-measure still gained 1.3x; here it loses.

<!-- @doubt -->
### Why is the descending half a suffix rather than a prefix?

<!-- @answer -->
Because the descending string grows on the left as the letters fall. `CBA` and `DCBA` share their ending, not their beginning, so every shorter descent is a suffix of every longer one — exactly as Pattern 12's descending digits were. Its length is i - 1 rather than i, because the peak belongs to the climbing half and must not be printed twice. Verified across all 351 rows from n = 1 to 26 with no failures on either side: the climbing half is a prefix of the ascending buffer and the descending half is a suffix of the reversed one.

<!-- @doubt -->
### How is this different from Pattern 7?

<!-- @answer -->
Geometrically it is not — same row lengths of n + i - 1, same widest row of 2n - 1, same n - i indentation. What changes is that the row's content is now a sequence rather than a repetition, which brings back the per-character cost Pattern 7 did not have, and it brings a hard ceiling: n cannot exceed 26. It also brings a new tempting check, the per-row palindrome, that Pattern 7 had no reason to offer. The star pyramid's total was n² stars; this one's is n² letters, so a count cannot tell the two shapes apart either.

<!-- @doubt -->
### Which checks should I actually write?

<!-- @answer -->
The per-row facts: row i has exactly n - i leading spaces and exactly 2i - 1 letters, climbing from A to the i-th and back. That is the whole specification. If you want cheaper summaries, line lengths catch four of the five mistakes measured and the palindrome catches the fifth, so the two together cover them all — but neither alone does, and the letter count catches only one. Do not strip the lines before comparing: it hides a shifted hill and a hill with no indentation, which is the same result Pattern 7 measured for leading whitespace.
