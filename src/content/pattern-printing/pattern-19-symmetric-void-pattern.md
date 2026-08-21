---
id: pattern-19-symmetric-void-pattern
topic: Pattern Printing
title: Pattern 19 - Symmetric Void Pattern
difficulty: Easy
status: ready
prerequisites:
  - pattern-9-diamond-star-pattern
  - pattern-12-number-crown-pattern
  - pattern-17-alpha-hill-pattern
  - nested-loops
relatedIds:
  - pattern-9-diamond-star-pattern
  - pattern-12-number-crown-pattern
  - pattern-20-symmetric-butterfly-pattern
  - pattern-21-hollow-rectangle-pattern
  - nested-loops
---

<!-- @summary -->
Print a solid block with a diamond-shaped hole opening through the middle — a fixed 2n by 2n grid where the two invariants Pattern 12 lost at n = 10 both hold forever, and where swapping the halves escapes every one of them, so after eighteen patterns of building a check ladder this is the shape that defeats all of it at once.

<!-- @theory -->
## The problem

Print 2n rows, each exactly 2n characters wide. Row i holds an arm of stars, a gap
of spaces, and a matching arm — with the gap widening to the middle and closing
again.

```
n = 5      **********
           ****  ****
           ***    ***
           **      **
           *        *
           *        *
           **      **
           ***    ***
           ****  ****
           **********
```

For the first n rows the arm is n - i + 1 stars and the gap is 2(i - 1) spaces;
the second n rows are the first reversed. So **the narrowest row appears twice**,
which is Pattern 9's convention mirrored — the widest row there, the narrowest
here.

## The exact counts

| | |
|---|---|
| Rows | **2n** |
| Width of every row | **2n** |
| Stars | **2n(n + 1)** — 20,200 at n = 100 |
| Spaces | **2n(n - 1)** — 19,800 at n = 100 |
| Characters | **4n²** — 40,000 at n = 100 |

All verified for every n from 1 to 200. Note how close the star and space totals
are: the hole is **very nearly half the output**, which matters below.

## Two invariants that never break — and still catch almost nothing

Pattern 12 had exactly these two properties and lost both at n = 10, because its
numbers widened and reversing `10` gives `01`. Stars and spaces never widen, so
here both hold for every n from 1 to 200 with no exceptions:

- every row is exactly **2n** characters
- every row is a **palindrome**

That is the good news. Measured against the correct output for every n from 1 to
40, here is what they are worth:

| Mistake | Wrong on | Rows | Stars | Width | Palindrome | First row | Exact |
|---|---|---|---|---|---|---|---|
| Narrowest row printed once (2n - 1 rows) | 40/41 | n = 1 | n = 1 | **never** | **never** | **never** | n = 1 |
| **Halves swapped** | 39/41 | **never** | **never** | **never** | **never** | n = 2 | n = 2 |
| Gap `2i` wide instead of `2(i - 1)` | 40/41 | **never** | **never** | n = 1 | **never** | n = 1 | n = 1 |
| Left arm one star short | 40/41 | **never** | n = 1 | n = 1 | n = 2 | n = 1 | n = 1 |

**Swapping the halves escapes all four summary checks.** It has 2n rows, 2n(n+1) stars, every row
2n wide, and every row still a palindrome — because reversing the two halves of a
palindrome gives another palindrome. What it produces is the shape inside out: the
hole widest at top and bottom, solid through the middle.

This topic has spent eighteen patterns assembling a ladder of cheap checks — a
count, then per-line counts, then line lengths in order, then symmetry. Here is
one shape where **every rung passes a wrong answer**.

What does catch it is one positional assertion, and it need not be expensive:
**the first row must be 2n solid stars**, which the swapped version breaks at
n = 2. That check has its own blind spot — a version printing the narrowest row
once still has a correct first row — and the row count catches exactly that. So
the first row plus the row count cover all four. Pattern 20 is the same shape with
the halves genuinely exchanged, and it turns on the same pair.

## The whitespace is purely interior

No row ends with a space — every row closes with its right arm. Measured,
right-trimming every line changes the output on **0 of 41** sizes: it is a
complete no-op here.

That places this pattern at the far end of a scale the topic has been building:

| | Whitespace | Trimming |
|---|---|---|
| Pattern 7 | leading, and load-bearing | hides three mistakes, two structural |
| Pattern 12 | interior | hides only the cosmetic one |
| **Pattern 19** | **interior only** | **does nothing at all** |

So trimming is safe here — and useless, because there was nothing to trim.

## Building each row is already right; half-optimising it is a disaster

Row i is an arm, a gap, and the same arm, so both pieces can come from prebuilt
buffers. Measured, with the character-by-character version included for scale:

| n | Char at a time | Build each row | Stars buffered, gap looped | Two buffers |
|---|---|---|---|---|
| 1,000 | 38.28ms | 0.33ms | 19.20ms | 0.19ms |
| 2,000 | 154.17ms | 0.94ms | 76.89ms | 0.60ms |
| 4,000 | 628.57ms | 3.72ms | 308.10ms | 2.93ms |

Two results, and the second is the one to keep.

**Building each row is essentially optimal already** — the two-buffer version is
worth only 1x to 2x on top, because building a row is already three bulk
operations. In Python it is worth nothing at all: slicing measured **0.86x to
0.91x**, slower than plain repetition, as in Patterns 5 and 10.

**But buffering the stars and leaving the gap as a per-space loop is 58x to 83x
slower than not bothering.** It trades a bulk fill of 2(i - 1) spaces for that
many individual writes, and the spaces are half the output — 32 million of them at
n = 4,000.

That completes an escalation across three patterns which measured the same
half-measure:

| | Gap as a share of the output | The half-measure |
|---|---|---|
| Pattern 12 | about a third | gains 1.3x |
| Pattern 17 | about a third | loses 2.2x |
| **Pattern 19** | **about a half** | **loses 58x to 83x** |

<!-- @intuition -->
Everything appealing about this shape is a trap. It is a perfect square of fixed width, so the width is worth asserting — and it holds for every wrong version but one. It is symmetric on both axes, so symmetry is worth asserting — and it holds for every wrong version but one. The two of them together still pass a shape that is the intended one turned inside out. What is left is the unglamorous check the topic has been converging on since Pattern 3: say what row i should be, and compare. The performance half rhymes with that. The obvious code is already the fast code, and the thing that looks like an optimisation — precomputing the part you can see — is the only way to make it badly slower, because it quietly turns the part you cannot see back into character-by-character work.

<!-- @approach -->
### Character at a Time

<!-- @idea -->
Three inner loops per row: the left arm, the gap, the right arm — with the row index sweeping down and back up.

<!-- @steps -->
1. Sweep the row index from one to n, then from n back to one.
2. Print n minus i plus one stars for the left arm.
3. Print 2 times i minus one, spaces for the gap.
4. Print the same number of stars again for the right arm.
5. Print a newline; every row comes out exactly 2n wide.

<!-- @complexity -->
- time: O(n^2) characters, one stream operation per character
- space: O(1)
- note: The direct translation. Measured 628.57ms at n = 4,000 against 3.72ms for building each row — between 116x and 169x, the usual per-character penalty when the items are single characters.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int pass = 0; pass < 2; pass++) {
        for (int q = 1; q <= n; q++) {
            int i = pass == 0 ? q : n - q + 1;
            for (int k = 0; k < n - i + 1; k++) cout << '*';
            for (int k = 0; k < 2 * (i - 1); k++) cout << ' ';
            for (int k = 0; k < n - i + 1; k++) cout << '*';
            cout << '\n';
        }
    }
}
```

<!-- @annotations -->
- 7: The two passes sweep i down and then back up, which is what makes the narrowest row appear twice.
- 9: 2(i - 1) spaces, so row 1 has none and the block is solid. Writing 2i widens every row by two and breaks the fixed width.
- 10: The right arm repeats the left, which is why every row is a palindrome — a property four of the five wrong versions also have.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int pass = 0; pass < 2; pass++) {
        for (int q = 1; q <= n; q++) {
            int i = (pass == 0) ? q : n - q + 1;
            for (int k = 0; k < n - i + 1; k++) System.out.print('*');
            for (int k = 0; k < 2 * (i - 1); k++) System.out.print(' ');
            for (int k = 0; k < n - i + 1; k++) System.out.print('*');
            System.out.println();
        }
    }
}
```

<!-- @annotations -->
- 5: The arm and the gap always sum to 2n, which is the fixed-width invariant stated as arithmetic.

<!-- @code python -->
```python
def pattern(n):
    for i in list(range(1, n + 1)) + list(range(n, 0, -1)):
        for k in range(n - i + 1):
            print("*", end="")
        for k in range(2 * (i - 1)):
            print(" ", end="")
        for k in range(n - i + 1):
            print("*", end="")
        print()


# 2n rows, each exactly 2n wide. The narrowest row appears twice —
# Pattern 9's convention, mirrored.
```

<!-- @annotations -->
- 2: One sequence of row indices down and back up, which reads better than two nested passes.
- 5: The gap loop. It runs 2n(n-1) times across the whole pattern — nearly half the output.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Make the arm once per row and print the arm, the gap and the arm as one string.

<!-- @steps -->
1. Sweep the row index down and back up.
2. Build the arm as n minus i plus one stars, in one step.
3. Build the gap as 2 times i minus one, spaces, in one step.
4. Concatenate arm, gap, arm and print with a newline.
5. Both pieces are bulk fills — nothing is written character by character.

<!-- @complexity -->
- time: O(n^2) characters, one stream operation per row
- space: O(n) — the row is always 2n characters
- note: Already essentially optimal. Measured 3.72ms at n = 4,000 against 628.57ms character by character, and the buffered version below is worth only 1x to 2x more. In Python it is the fastest form outright, since slicing a buffer measured 0.86x to 0.91x — slower than repetition.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int pass = 0; pass < 2; pass++) {
        for (int q = 1; q <= n; q++) {
            int i = pass == 0 ? q : n - q + 1;
            string arm(n - i + 1, '*');
            cout << arm << string(2 * (i - 1), ' ') << arm << '\n';
        }
    }
}
```

<!-- @annotations -->
- 9: The arm is built once and used twice, since the two sides are identical.
- 10: The gap is a bulk fill. Replacing this one construction with a loop is what makes the half-optimised version 58x to 83x slower.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int pass = 0; pass < 2; pass++) {
        for (int q = 1; q <= n; q++) {
            int i = (pass == 0) ? q : n - q + 1;
            String arm = "*".repeat(n - i + 1);
            System.out.println(arm + " ".repeat(2 * (i - 1)) + arm);
        }
    }
}
```

<!-- @annotations -->
- 6: Two repeat calls and a concatenation describe the whole row, and their lengths sum to 2n.

<!-- @code python -->
```python
def pattern(n):
    for i in list(range(1, n + 1)) + list(range(n, 0, -1)):
        arm = "*" * (n - i + 1)
        print(arm + " " * (2 * (i - 1)) + arm)


# The fastest form in Python — measured 321x to 602x faster than
# character by character, and slicing a buffer is slower still.
```

<!-- @annotations -->
- 4: Two repetitions and a concatenation. There is nothing left for a buffer to remove in Python.

<!-- @approach -->
### Two Buffers

<!-- @idea -->
Build one run of stars and one run of spaces before the loop, then write three slices per row.

<!-- @steps -->
1. Guard against a non-positive n, since the buffers are built before the loop.
2. Build n stars and 2(n - 1) spaces, once each.
3. Sweep the row index down and back up.
4. Write a prefix of the stars, a prefix of the gap, and the same prefix of the stars again.
5. Nothing is allocated or filled inside the loop.

<!-- @complexity -->
- time: O(n^2) characters written, three bulk writes per row
- space: O(n) — one star buffer and one gap buffer
- note: The fastest in C++, and only just — 2.93ms at n = 4,000 against 3.72ms, so 1x to 2x. Worth writing for what it states rather than for the margin, and worth *not* writing in Python, where it measured 0.86x to 0.91x against plain repetition.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    string stars(n, '*'), gap(2 * (n - 1), ' ');
    for (int pass = 0; pass < 2; pass++) {
        for (int q = 1; q <= n; q++) {
            int i = pass == 0 ? q : n - q + 1;
            int arm = n - i + 1;
            cout.write(stars.data(), arm);
            cout.write(gap.data(), 2 * (i - 1));
            cout.write(stars.data(), arm);
            cout << '\n';
        }
    }
}
```

<!-- @annotations -->
- 7: Two buffers hold every character the pattern will print — n stars for the widest arm and 2(n-1) spaces for the widest gap.
- 12: The star buffer is read here and again two lines down, since the two arms are identical.
- 13: The gap must come from the buffer too. Looping it here instead is the single worst thing you can do to this pattern.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    String stars = "*".repeat(n), gap = " ".repeat(2 * (n - 1));
    for (int pass = 0; pass < 2; pass++) {
        for (int q = 1; q <= n; q++) {
            int i = (pass == 0) ? q : n - q + 1;
            int arm = n - i + 1;
            System.out.println(stars.substring(0, arm)
                    + gap.substring(0, 2 * (i - 1)) + stars.substring(0, arm));
        }
    }
}
```

<!-- @annotations -->
- 3: The guard matters here because repeat rejects a negative count and 2(n - 1) is negative at n = 0.

<!-- @code python -->
```python
def pattern(n):
    stars = "*" * n
    gap = " " * (2 * (n - 1)) if n else ""
    for i in list(range(1, n + 1)) + list(range(n, 0, -1)):
        arm = n - i + 1
        print(stars[:arm] + gap[: 2 * (i - 1)] + stars[:arm])


# Correct, and slower than the previous approach — 0.86x to 0.91x,
# because a slice allocates exactly as a repetition does.
```

<!-- @annotations -->
- 3: At n = 0 the multiplier would be negative, which Python treats as zero — the conditional is for clarity rather than safety.

<!-- @example -->

<!-- @input -->
n = 5

<!-- @output -->
A ten by ten block with a diamond hole — sixty stars and forty spaces

<!-- @why -->
Small enough to count, and it shows the narrowest row appearing twice, which is the convention most often got wrong.

<!-- @walkthrough -->
1. Row 1 has an arm of 5 stars, no gap, and another 5 — a solid line of 10.
2. Row 2 has arms of 4 with a gap of 2, still 10 wide.
3. By row 5 the arms are single stars and the gap is 8.
4. Row 6 repeats row 5, because the second pass starts at i = n again.
5. That gives 2n rows, which is 10, and every one of them exactly 2n wide.
6. The stars total 2n(n+1), which is 60, and the spaces 2n(n-1), which is 40.
7. Together that is 4n squared, which is 100 — the grid is exactly filled.

<!-- @example -->

<!-- @input -->
The two halves printed in the wrong order, checked five ways

<!-- @output -->
Right rows, right stars, right width, still a palindrome — and inside out

<!-- @why -->
The one shape in this topic that defeats every cheap check assembled over eighteen patterns.

<!-- @walkthrough -->
1. Printing the second half first gives a block whose hole is widest at the top and bottom and closed in the middle.
2. It has 2n rows, because both halves still run.
3. It has 2n(n+1) stars, because the same rows are present in a different order.
4. Every row is still exactly 2n wide, since every row of the correct output is.
5. Every row is still a palindrome, because each individual row is unchanged.
6. So the row count, the star count, the width check and the symmetry check all pass, at every size from 1 to 40.
7. Comparing row i against the arm, gap and arm it should hold catches it at n = 2.

<!-- @example -->

<!-- @input -->
Right-trimming every line before comparing

<!-- @output -->
No effect at all — 0 of 41 sizes change

<!-- @why -->
Places this pattern at the far end of a scale Patterns 7 and 12 mark the other points on.

<!-- @walkthrough -->
1. Every row here ends with its right arm, so no row ends with a space.
2. Right-trimming therefore removes nothing, and the output is unchanged at every size from 0 to 40.
3. In Pattern 7 the spaces were leading and load-bearing, so stripping hid three mistakes, two of them structural.
4. In Pattern 12 they were interior, so trimming hid only the cosmetic trailing-space error.
5. Here they are interior and nothing trails, so trimming is a complete no-op.
6. That makes trimming safe, and it also makes it worthless as a normalisation step.
7. The useful reading is that whether trimming is dangerous depends on where the whitespace sits, not on whether there is any.

<!-- @example -->

<!-- @input -->
n = 4,000, with the stars buffered and the gap left in a loop

<!-- @output -->
308.10ms — against 3.72ms for the version that buffers nothing

<!-- @why -->
The sharpest instance of a trap Patterns 12 and 17 measured more gently, and it inverts the usual advice about precomputation.

<!-- @walkthrough -->
1. Building each row already writes the gap as one bulk fill of 2(i - 1) spaces.
2. Precomputing the stars and slicing them looks like a strict improvement.
3. But the natural way to write it streams the gap one space at a time.
4. The spaces are 2n(n-1) in total — nearly half the output, and 32 million writes at this size.
5. Measured, that is 308.10ms against 3.72ms, so between 58 and 83 times slower.
6. Pattern 12 measured the same half-measure gaining 1.3x, and Pattern 17 losing 2.2x.
7. The difference is what share of the output is whitespace: about a third in those, about a half here.

<!-- @visualization custom -->

<!-- @description -->
Draw the output as a fixed 2n by 2n grid with the frame always visible, so the reader sees a constant square with a hole opening and closing inside it rather than rows of varying length — the fixed frame is the point, since it is one of the two invariants the figure goes on to discredit. Fill top to bottom with the arm cells solid and the gap cells drawn as ghost cells, and keep two running counters, stars against 2n(n+1) and spaces against 2n(n-1), converging to nearly the same number. Hold the frame at rows n and n+1, which are identical, and label that the narrowest row twice — Pattern 9's convention mirrored. The centre panel is the check collapse. Place four wrong grids beside the correct one — narrowest row once, halves swapped, gap 2i wide, left arm short — with five lamps beneath each: row count, star count, width, palindrome, exact. Wire the halves-swapped grid so all four summary lamps stay green and only the exact lamp turns red, and hold that frame: it is the whole argument. Draw the halves-swapped grid clearly as the shape inside out, hole widest at top and bottom, so the reader sees how different it is while the lamps agree. Beside it, stack the ladder this topic built — a count, per-line counts, ordered lengths, symmetry — as four rungs, and strike each one through as the swapped grid passes it. Close with the cost panel: three lanes emitting into the grid, the first clicking out every character, the second stamping arm, gap and arm as three blocks, the third stamping the arms as blocks but clicking out every ghost cell. The third lane's click counter must visibly run away, since the ghost cells are half the grid. Time bars read 628.57ms, 3.72ms and 308.10ms, with the third drawn far longer than the second and captioned precomputing the part you can see.

<!-- @sampleInput -->
```json
{"primary":{"n":5,"output":"**********\n****  ****\n***    ***\n**      **\n*        *\n*        *\n**      **\n***    ***\n****  ****\n**********\n","rows":10,"rowFormula":"2n","width":10,"widthFormula":"2n","armPerRow":[5,4,3,2,1,1,2,3,4,5],"gapPerRow":[0,2,4,6,8,8,6,4,2,0],"stars":60,"spaces":40,"chars":100,"narrowestRowAppearsTwice":true},"counts":{"rows":"2n","width":"2n","stars":"2n(n+1)","spaces":"2n(n-1)","chars":"4n^2","verified":"n = 1..200","atN100":{"stars":20200,"spaces":19800,"chars":40000},"note":"the hole is very nearly half the output"},"invariants":{"everyRowWidth2n":{"holds":"n = 1..200","pattern12":"lost it at n = 10"},"everyRowPalindrome":{"holds":"n = 1..200","pattern12":"lost it at n = 10"},"why":"stars and spaces never widen; Pattern 12's numbers did","butWorth":"between them they catch three of four mistakes, and miss the fourth entirely"},"bugPanel":{"variants":[{"name":"narrowest row printed once (2n-1 rows)","wrongOn":"40 of 41","correctAt":[0]},{"name":"halves swapped","wrongOn":"39 of 41","correctAt":[0,1],"preserves":["row count","star count","width","palindrome"],"produces":"the shape inside out — hole widest at top and bottom"},{"name":"gap 2i wide instead of 2(i-1)","wrongOn":"40 of 41","correctAt":[0]},{"name":"left arm one star short","wrongOn":"40 of 41","correctAt":[0]},{"name":"right-trimming every line","wrongOn":"0 of 41","note":"a complete no-op — no row ends with a space"}]},"checkPanel":{"columns":["row count","star count","width","palindrome","first row","exact"],"smallestNThatCatches":{"narrowest row once":[1,1,"never","never","never",1],"halves swapped":["never","never","never","never",2,2],"gap 2i wide":["never","never",1,"never",1,1],"left arm short":["never",1,1,2,1,1]},"reading":["swapping the halves escapes all four summary checks at every size tested","eighteen patterns of cheap checks — a count, per-line counts, ordered lengths, symmetry — and every rung passes it","the first row must be 2n solid stars — that catches the swap at n = 2, and the row count catches the one mistake it misses"]},"whitespacePosition":{"pattern7":{"where":"leading, load-bearing","trimming":"hides three mistakes, two structural"},"pattern12":{"where":"interior","trimming":"hides only the cosmetic trailing-space error"},"pattern19":{"where":"interior only, nothing trails","trimming":"changes nothing on 0 of 41 sizes"},"reading":"whether trimming is dangerous depends on where the whitespace sits, not on whether there is any"},"assertions":["there are exactly 2n rows","every row is exactly 2n characters","row i has an arm of n - i + 1 stars, a gap of 2(i-1) spaces, then the same arm","total stars equal 2n(n+1) and total spaces equal 2n(n-1)","no row ends with a space"],"buildPanel":[{"n":1000,"charAtATimeMs":38.28,"buildEachRowMs":0.33,"starsBufferedGapLoopedMs":19.20,"twoBuffersMs":0.19},{"n":2000,"charAtATimeMs":154.17,"buildEachRowMs":0.94,"starsBufferedGapLoopedMs":76.89,"twoBuffersMs":0.60},{"n":4000,"charAtATimeMs":628.57,"buildEachRowMs":3.72,"starsBufferedGapLoopedMs":308.10,"twoBuffersMs":2.93}],"ratios":{"perCharToBuildEachRow":"116x to 169x","buildEachRowToTwoBuffers":"1x to 2x","buildEachRowToHalfMeasure":"58x to 83x SLOWER","perCharToTwoBuffers":"roughly 200x to 260x"},"halfMeasureEscalation":[{"pattern":12,"gapShareOfOutput":"about a third","result":"gains 1.3x"},{"pattern":17,"gapShareOfOutput":"about a third","result":"loses 2.2x"},{"pattern":19,"gapShareOfOutput":"about a half","result":"loses 58x to 83x"}],"python":{"perCharToBuildEachRow":"321x to 602x","buildEachRowToTwoBuffers":"0.86x to 0.91x — the buffer is slower","reason":"a slice allocates exactly as a repetition does, as in Patterns 5 and 10"}}
```

<!-- @highlights -->
- The output is drawn as a fixed 2n by 2n grid with the frame always visible.
- A constant square with a hole opening and closing inside it, rather than rows of varying length.
- The fixed frame is the point, since it is one of the two invariants the figure goes on to discredit.
- Arm cells are solid and gap cells are ghost cells, with counters tracking stars against 2n(n+1) and spaces against 2n(n-1).
- The two counters converge to nearly the same number.
- The frame holds at rows n and n+1, which are identical, labelled the narrowest row twice.
- The centre panel places four wrong grids beside the correct one.
- Five lamps sit beneath each: row count, star count, width, palindrome, exact.
- On the halves-swapped grid all four summary lamps stay green and only the exact lamp turns red.
- That frame is held, because it is the whole argument.
- The halves-swapped grid is drawn clearly as the shape inside out, hole widest at top and bottom.
- Beside it, the ladder this topic built — count, per-line counts, ordered lengths, symmetry — is drawn as four rungs.
- Each rung is struck through as the swapped grid passes it.
- The cost panel runs three lanes: one clicking out every character, one stamping three blocks, one stamping arms but clicking every ghost cell.
- The third lane's click counter visibly runs away, since the ghost cells are half the grid.
- Time bars read 628.57ms, 3.72ms and 308.10ms, the third far longer than the second, captioned precomputing the part you can see.

<!-- @edgeCases -->
- n equal to zero — no output, and the buffer version needs its guard since 2(n - 1) is negative.
- n equal to one — two rows, each the two-character line of two stars, with no gap at all.
- n equal to two — the smallest input that catches swapping the halves.
- Negative n — no output from the loop versions; the buffer version needs the same guard as n equal to zero.
- The first and last rows — solid lines of 2n stars, with no gap.
- Rows n and n plus one — the narrowest, identical, and the pair most often collapsed into one.
- Very large n — 4n squared characters, so n of ten thousand is four hundred million.
- No trailing whitespace anywhere — right-trimming is a no-op, which makes it safe and pointless.
- A caller expecting the hole widest at the ends — that is the halves swapped, which passes every summary check.
- A caller expecting an odd number of rows — that is the narrowest row printed once, which the row count catches at n = 1.

<!-- @pitfalls -->
- Printing the halves in the wrong order. It keeps the row count, the star count, the width and the symmetry, so only a positional comparison catches it.
- Trusting the fixed width. It is genuinely true at every n — and three of the four mistakes measured preserve it.
- Trusting the symmetry. Also genuinely true at every n, and it catches one mistake of four.
- Combining every cheap check. Row count, star count, width and palindrome together still pass the halves-swapped shape.
- Starting the second pass at n - 1 to avoid repeating the narrowest row. That gives 2n - 1 rows, which is a different convention.
- Writing the gap as 2i rather than 2(i - 1). Row 1 gains a gap, every row becomes 2n + 2 wide, and the fixed-width check catches it at n = 1.
- Buffering the stars and leaving the gap in a loop. Measured 58x to 83x slower than building each row plainly.
- Assuming a buffer must help. In C++ it is worth 1x to 2x over building each row; in Python it is worth 0.86x to 0.91x, which is slower.
- Right-trimming as a normalisation step. Harmless here, and it does nothing, because no row ends with a space.
- Building the arm twice per row. The two sides are identical, so build it once and print it twice.

<!-- @doubt -->
### Every row is 2n wide and every row is a palindrome. Are those good checks?

<!-- @answer -->
They are genuinely true — for every n from 1 to 200, with no exceptions, because stars and spaces never widen the way Pattern 12's numbers did. And between them they catch three of the four mistakes measured. What they miss is the one that matters most: swapping the two halves gives a shape with the same 2n rows, the same 2n(n+1) stars, every row exactly 2n wide, and every row still a palindrome — while producing the pattern inside out. Add the row count and the star count and it still passes. Only comparing row i against the arm, gap and arm it should hold catches it, at n = 2.

<!-- @doubt -->
### Why does swapping the halves defeat everything?

<!-- @answer -->
Because it changes only the order of the rows, and every cheap check here is order-blind or row-local. The row count is unchanged because both halves still run. The star and space counts are unchanged because the same rows are present. The width check is row-local, and every row of the correct output is 2n wide, so every row of the reordered output is too. The palindrome check is also row-local, and no individual row was modified. This topic assembled that ladder over eighteen patterns — a count, per-line counts, ordered lengths, symmetry — and this is the shape where every rung passes.

<!-- @doubt -->
### Should the narrowest row appear once or twice?

<!-- @answer -->
Twice, in this pattern — it is what makes the output 2n rows rather than 2n - 1. The first pass ends at the narrowest row and the second begins there again, so rows n and n + 1 are identical. Starting the second pass one row earlier gives 2n - 1 rows and is wrong on 40 of the 41 sizes from 0 to 40, caught immediately by the row count. This is Pattern 9's convention mirrored — the widest row doubled there, the narrowest here — and as in Patterns 9 and 10 it is part of the specification rather than something the picture settles.

<!-- @doubt -->
### Is it safe to strip whitespace before comparing?

<!-- @answer -->
Here, completely — and pointless. No row ends with a space, since every row closes with its right arm, so right-trimming every line changes the output on 0 of 41 sizes. That is the far end of a scale this topic has measured: in Pattern 7 the spaces were leading and load-bearing, so stripping hid three mistakes including two structural ones; in Pattern 12 they were interior, so trimming hid only the cosmetic trailing-space error; here nothing trails at all. What decides the danger is where the whitespace sits, not whether there is any.

<!-- @doubt -->
### I precomputed the stars and it got much slower. Why?

<!-- @answer -->
Because of what you gave up rather than what you gained. Building each row already writes the gap as a single bulk fill of 2(i - 1) spaces. Precomputing the stars is usually written so that the gap becomes a loop of individual writes — and the spaces are 2n(n - 1) in total, nearly half the output, which is 32 million writes at n = 4,000. Measured, that is 308.10ms against 3.72ms, between 58 and 83 times slower. Pattern 12 measured the same half-measure gaining 1.3x and Pattern 17 losing 2.2x; the difference is how much of the output is whitespace.

<!-- @doubt -->
### Is the two-buffer version worth writing?

<!-- @answer -->
In C++, barely — 2.93ms against 3.72ms at n = 4,000, so 1x to 2x. Building each row is already three bulk operations, so there is little left to remove. In Python it is worth less than nothing: slicing a buffer measured 0.86x to 0.91x against plain repetition, because a slice allocates just as a repetition does — the same result Patterns 5 and 10 gave. Write it if you want the structure stated, and know that the important choice was made one step earlier, when the row stopped being assembled character by character.
