---
id: pattern-20-symmetric-butterfly-pattern
topic: Pattern Printing
title: Pattern 20 - Symmetric Butterfly Pattern
difficulty: Medium
status: ready
prerequisites:
  - pattern-19-symmetric-void-pattern
  - pattern-9-diamond-star-pattern
  - nested-loops
  - for-loop
relatedIds:
  - pattern-19-symmetric-void-pattern
  - pattern-9-diamond-star-pattern
  - pattern-8-inverted-star-pyramid
  - pattern-21-hollow-rectangle-pattern
  - nested-loops
---

<!-- @summary -->
Print two wings that grow until they meet and then shrink — byte for byte, Pattern 19 with its halves swapped, which is the exact mistake Pattern 19's container measured as escaping every summary check, so the two adjacent patterns are indistinguishable by row count, star count, width and symmetry alike.

<!-- @theory -->
## The problem

Print 2n rows, each exactly 2n characters wide. Row i holds a wing of i stars, a
gap of 2(n - i) spaces, and a matching wing — the wings growing until they meet,
then shrinking again.

```
n = 5      *        *
           **      **
           ***    ***
           ****  ****
           **********
           **********
           ****  ****
           ***    ***
           **      **
           *        *
```

The **solid row appears twice**, at rows n and n + 1 — the same doubling
convention as Pattern 9, and the mirror of Pattern 19, which doubles its narrowest
row instead.

## This is Pattern 19's most dangerous bug, as a specification

Pattern 19's container measured four ways to get that pattern wrong. One of them —
printing the two halves in the wrong order — escaped the row count, the star
count, the width check and the palindrome check, at every size tested. It was the
one mistake nothing cheap caught.

**That output is this pattern.** Verified byte-identical for every n from 0 to 200.

Which means the two containers sit next to each other in the curriculum describing
shapes that no summary can tell apart:

| | Pattern 19 | Pattern 20 |
|---|---|---|
| Rows | 2n | 2n |
| Width of every row | 2n | 2n |
| Stars | 2n(n + 1) | 2n(n + 1) |
| Spaces | 2n(n - 1) | 2n(n - 1) |
| Characters | 4n² | 4n² |
| Every row a palindrome | yes | yes |
| Doubled middle row | the narrowest | the widest |

All the formulas verified for every n from 1 to 200 in both. And the two outputs
are **identical at n = 0 and n = 1** — at n = 1 both are two rows of `**`.

## The cheap thing that does separate them

Look at the first row:

| n | Pattern 20 | Pattern 19 |
|---|---|---|
| 2 | `*  *` | `****` |
| 3 | `*    *` | `******` |
| 5 | `*        *` | `**********` |

**Pattern 20's first row has 2 stars; Pattern 19's has 2n.** That single assertion
separates them from n = 2, and it is the specific positional check Pattern 19's
container recommended in general terms without naming.

Measured against the correct output for every n from 1 to 40:

| Mistake | Wrong on | Rows | Stars | Width | Palindrome | First row | Exact |
|---|---|---|---|---|---|---|---|
| **Halves swapped (= Pattern 19)** | 39/41 | never | never | never | never | **n = 2** | n = 2 |
| Solid row printed once (2n - 1 rows) | 40/41 | **n = 1** | n = 1 | never | never | **never** | n = 1 |
| Gap one space too wide | 40/41 | never | never | n = 1 | never | n = 1 | n = 1 |
| Right wing one star longer | 40/41 | never | n = 1 | n = 1 | n = 2 | n = 1 | n = 1 |

The first-row check catches three of the four and is blind to the row count — a
version that prints the solid row once has a perfectly correct first row. The row
count catches exactly that one. So **the first row plus the row count catch all
four**, which is the cheap pair Pattern 19's table stopped short of naming.

## Everything else carries over unchanged

The two patterns are the same work in a different order, so the performance
results are the same too. Measured:

| n | Char at a time | Build each row | Stars buffered, gap looped | Two buffers |
|---|---|---|---|---|
| 1,000 | 42.86ms | 0.37ms | 22.37ms | 0.21ms |
| 2,000 | 180.58ms | 1.11ms | 89.79ms | 0.83ms |
| 4,000 | 714.94ms | 4.02ms | 338.09ms | 3.52ms |

- Not printing character by character is worth **116x to 178x**.
- Building each row is already essentially optimal — the buffers add **1.1x to
  1.8x**, and in Python they measured **0.87x to 0.91x**, which is slower.
- Buffering the stars and leaving the gap in a loop is **60x to 84x slower** than
  building each row plainly, for the same reason as in Pattern 19: the spaces are
  nearly half the output and the loop turns a bulk fill back into individual
  writes.

And as in Pattern 19, no row ends with a space, so right-trimming is a no-op.

<!-- @intuition -->
The useful thing about this pattern is not how to write it — it is two loops and an arithmetic swap away from the one before it — but what it does to the idea of checking by summary. Two shapes that a person tells apart instantly, at a glance, agree on every number you might reasonably compute about them: how many rows, how wide, how many stars, how many spaces, whether each row reads the same backwards. A summary compresses, and compression loses exactly the thing that distinguishes these two, which is order. The escape is not a cleverer summary; it is to stop summarising and say what a particular row should contain. One row is enough here, and the first is the cheapest to look at.

<!-- @approach -->
### Character at a Time

<!-- @idea -->
Three inner loops per row: the left wing, the gap, the right wing — with the row index sweeping up and back down.

<!-- @steps -->
1. Sweep the row index from one to n, then from n back to one.
2. Print i stars for the left wing.
3. Print 2 times n minus i, spaces for the gap.
4. Print i stars again for the right wing.
5. Print a newline; every row comes out exactly 2n wide.

<!-- @complexity -->
- time: O(n^2) characters, one stream operation per character
- space: O(1)
- note: The direct translation. Measured 714.94ms at n = 4,000 against 4.02ms for building each row — between 117x and 178x, the usual per-character penalty for single-character items.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int pass = 0; pass < 2; pass++) {
        for (int q = 1; q <= n; q++) {
            int i = pass == 0 ? q : n - q + 1;
            for (int k = 0; k < i; k++) cout << '*';
            for (int k = 0; k < 2 * (n - i); k++) cout << ' ';
            for (int k = 0; k < i; k++) cout << '*';
            cout << '\n';
        }
    }
}
```

<!-- @annotations -->
- 7: The two passes sweep i up and then back down, which is what prints the solid row twice.
- 8: i stars, growing. Pattern 19 writes n - i + 1 here, shrinking — that one expression is the entire difference between the two patterns.
- 9: The gap closes as the wings grow, so the two always sum to 2n.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int pass = 0; pass < 2; pass++) {
        for (int q = 1; q <= n; q++) {
            int i = (pass == 0) ? q : n - q + 1;
            for (int k = 0; k < i; k++) System.out.print('*');
            for (int k = 0; k < 2 * (n - i); k++) System.out.print(' ');
            for (int k = 0; k < i; k++) System.out.print('*');
            System.out.println();
        }
    }
}
```

<!-- @annotations -->
- 5: The wing is i rather than n - i + 1, so the first row is the narrowest and the middle is solid.

<!-- @code python -->
```python
def pattern(n):
    for i in list(range(1, n + 1)) + list(range(n, 0, -1)):
        for k in range(i):
            print("*", end="")
        for k in range(2 * (n - i)):
            print(" ", end="")
        for k in range(i):
            print("*", end="")
        print()


# 2n rows, each 2n wide, with the SOLID row doubled. Pattern 19 has
# the same totals and doubles the narrowest row instead.
```

<!-- @annotations -->
- 2: One sequence of row indices up and back down. Reversing it produces Pattern 19, which no count-based check distinguishes from this.
- 5: The gap loop runs 2n(n-1) times across the whole pattern — nearly half the output.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Make the wing once per row and print wing, gap, wing as one string.

<!-- @steps -->
1. Sweep the row index up and back down.
2. Build the wing as i stars, in one step.
3. Build the gap as 2 times n minus i, spaces, in one step.
4. Concatenate wing, gap, wing and print with a newline.
5. Both pieces are bulk fills — nothing is written character by character.

<!-- @complexity -->
- time: O(n^2) characters, one stream operation per row
- space: O(n) — the row is always 2n characters
- note: Already essentially optimal. Measured 4.02ms at n = 4,000 against 714.94ms character by character, and the buffered version adds only 1.1x to 1.8x. In Python it is the fastest form outright, since slicing a buffer measured 0.87x to 0.91x — slower than repetition.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int pass = 0; pass < 2; pass++) {
        for (int q = 1; q <= n; q++) {
            int i = pass == 0 ? q : n - q + 1;
            string wing(i, '*');
            cout << wing << string(2 * (n - i), ' ') << wing << '\n';
        }
    }
}
```

<!-- @annotations -->
- 9: The wing is built once and printed twice, since the two sides are identical — which is also why every row is a palindrome.
- 10: The gap is a bulk fill. Replacing this construction with a loop is what makes the half-optimised version 60x to 84x slower.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int pass = 0; pass < 2; pass++) {
        for (int q = 1; q <= n; q++) {
            int i = (pass == 0) ? q : n - q + 1;
            String wing = "*".repeat(i);
            System.out.println(wing + " ".repeat(2 * (n - i)) + wing);
        }
    }
}
```

<!-- @annotations -->
- 6: Two repeat calls whose lengths sum to 2n, which is the fixed-width invariant written as arithmetic.

<!-- @code python -->
```python
def pattern(n):
    for i in list(range(1, n + 1)) + list(range(n, 0, -1)):
        wing = "*" * i
        print(wing + " " * (2 * (n - i)) + wing)


# The fastest form in Python — measured 324x to 580x faster than
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
3. Sweep the row index up and back down.
4. Write a prefix of the stars, a prefix of the gap, then the same star prefix again.
5. Nothing is allocated or filled inside the loop.

<!-- @complexity -->
- time: O(n^2) characters written, three bulk writes per row
- space: O(n) — one star buffer and one gap buffer
- note: The fastest in C++, and only just — 3.52ms at n = 4,000 against 4.02ms. Worth writing for what it states rather than the margin, and worth avoiding in Python, where it measured 0.87x to 0.91x against plain repetition.

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
            cout.write(stars.data(), i);
            cout.write(gap.data(), 2 * (n - i));
            cout.write(stars.data(), i);
            cout << '\n';
        }
    }
}
```

<!-- @annotations -->
- 7: Two buffers hold every character the pattern will print — n stars for the widest wing and 2(n-1) spaces for the widest gap.
- 11: The star buffer is read here and again two lines down, once per wing.
- 12: The gap must come from the buffer too. Looping it here is the single worst thing you can do to this pattern.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    String stars = "*".repeat(n), gap = " ".repeat(2 * (n - 1));
    for (int pass = 0; pass < 2; pass++) {
        for (int q = 1; q <= n; q++) {
            int i = (pass == 0) ? q : n - q + 1;
            System.out.println(stars.substring(0, i)
                    + gap.substring(0, 2 * (n - i)) + stars.substring(0, i));
        }
    }
}
```

<!-- @annotations -->
- 3: The guard matters because repeat rejects a negative count and 2(n - 1) is negative at n = 0.

<!-- @code python -->
```python
def pattern(n):
    stars = "*" * n
    gap = " " * (2 * (n - 1)) if n else ""
    for i in list(range(1, n + 1)) + list(range(n, 0, -1)):
        print(stars[:i] + gap[: 2 * (n - i)] + stars[:i])


# Correct, and slower than the previous approach — 0.87x to 0.91x,
# because a slice allocates exactly as a repetition does.
```

<!-- @annotations -->
- 5: Three slices per row. In C++ this avoids two allocations; in Python it adds one, which is why it loses there.

<!-- @example -->

<!-- @input -->
n = 5

<!-- @output -->
Wings growing from one star to five, meeting, and shrinking back — sixty stars

<!-- @why -->
Small enough to count, and it shows the solid row doubled, which is the convention that distinguishes this from Pattern 19's middle.

<!-- @walkthrough -->
1. Row 1 has a wing of 1 star, a gap of 2 times 4, so 8, and another single star.
2. Row 2 has wings of 2 and a gap of 6, still 10 wide.
3. By row 5 the wings are 5 each and the gap is zero — a solid line.
4. Row 6 repeats row 5, because the second pass starts at i = n again.
5. That gives 2n rows, which is 10, every one exactly 2n wide.
6. The stars total 2n(n+1), which is 60, and the spaces 2n(n-1), which is 40.
7. Pattern 19 has exactly those totals too, and the same widths and symmetry — only the order of the rows differs.

<!-- @example -->

<!-- @input -->
This pattern and Pattern 19, put through every summary check

<!-- @output -->
Row count, star count, width and palindrome all agree — on two obviously different shapes

<!-- @why -->
Closes a case Pattern 19 opened: the mistake it could not catch cheaply turns out to be the next pattern's correct answer.

<!-- @walkthrough -->
1. Pattern 19 opens solid, opens a hole to the middle, and closes it again.
2. This pattern opens at its narrowest, grows to solid, and shrinks again.
3. Each is the other with its two halves exchanged, verified byte-identical for every n from 0 to 200.
4. So both have 2n rows, every row 2n wide, 2n(n+1) stars and 2n(n-1) spaces.
5. Every row of each is a palindrome, since no individual row differs between them.
6. Measured, none of those four checks separates them at any size from 1 to 40.
7. The two are genuinely identical at n = 0 and n = 1, where both are two rows of two stars.

<!-- @example -->

<!-- @input -->
The first row, at n = 2, 3 and 5

<!-- @output -->
Two stars here against 2n there — the cheap check that works

<!-- @why -->
Gives the specific assertion Pattern 19's container recommended only in general terms.

<!-- @walkthrough -->
1. This pattern's first row is the narrowest: one star, the gap, one star.
2. Pattern 19's first row is solid: 2n stars with no gap at all.
3. At n = 2 that is four characters either way, but two stars against four.
4. So asserting that the first row holds exactly two stars separates them from n = 2.
5. Measured, that check also catches a gap one space too wide and a wing one star too long, both at n = 1.
6. It is blind to one thing: printing the solid row once still leaves a correct first row.
7. The row count catches exactly that, so the first row and the row count together cover all four mistakes measured.

<!-- @example -->

<!-- @input -->
n = 4,000, with the stars buffered and the gap left in a loop

<!-- @output -->
338.09ms against 4.02ms for the version that buffers nothing

<!-- @why -->
Reproduces Pattern 19's sharpest performance result on the same geometry, confirming it was about the shape rather than that pattern.

<!-- @walkthrough -->
1. Building each row already writes the gap as one bulk fill of 2(n - i) spaces.
2. Precomputing the stars and slicing them looks like a strict improvement.
3. Written the natural way, it streams the gap one space at a time instead.
4. The spaces total 2n(n-1) — nearly half the output, and about 32 million writes at this size.
5. Measured, that is 338.09ms against 4.02ms, between 61 and 84 times slower.
6. Pattern 19 measured 58 to 83 times on the identical geometry, so the result is a property of the shape.
7. Building each row plainly is already within 1.1x to 1.8x of the best version, so there was little to gain and a great deal to lose.

<!-- @visualization custom -->

<!-- @description -->
Draw the output as a fixed 2n by 2n frame with the wings solid and the gap as ghost cells, filling top to bottom so the wings visibly grow, meet, and shrink — and hold the frame at rows n and n+1, which are identical, labelled the solid row twice. Keep counters for stars against 2n(n+1) and spaces against 2n(n-1). The centre of the figure is a direct confrontation with Pattern 19. Place the two grids side by side and animate one folding into the other by exchanging its top and bottom halves, so the reader sees a single operation turning one pattern into its neighbour. Beneath both, run four summary readouts — row count, star count, width, palindrome — and hold them while the fold completes: all four must stay numerically identical throughout, with no flicker, because that unchanging row of numbers is the argument. Then drop a fifth readout, first row, and let it be the only one that differs: two stars here, 2n there. Draw that difference as a highlighted strip across the top row of each grid. Add a small note that at n = 1 the two grids are the same object. Close with the cost panel from Pattern 19, since the geometry is identical: three lanes — clicking out every character, stamping wing, gap and wing as three blocks, and stamping the wings while clicking out every ghost cell — with the third lane's click counter running away because the ghost cells are half the grid. Time bars read 714.94ms, 4.02ms and 338.09ms, the third far longer than the second.

<!-- @sampleInput -->
```json
{"primary":{"n":5,"output":"*        *\n**      **\n***    ***\n****  ****\n**********\n**********\n****  ****\n***    ***\n**      **\n*        *\n","rows":10,"rowFormula":"2n","width":10,"widthFormula":"2n","wingPerRow":[1,2,3,4,5,5,4,3,2,1],"gapPerRow":[8,6,4,2,0,0,2,4,6,8],"stars":60,"spaces":40,"chars":100,"solidRowAppearsTwice":true,"doubledRow":"the widest"},"counts":{"rows":"2n","width":"2n","stars":"2n(n+1)","spaces":"2n(n-1)","chars":"4n^2","verified":"n = 1..200","atN100":{"stars":20200,"spaces":19800,"chars":40000}},"relationToPattern19":{"claim":"this is Pattern 19 with its two halves exchanged","verifiedOver":"n = 0..200, 0 differences","pattern19Documented":"that exchange as the mistake escaping the row count, the star count, the width check and the palindrome check","identicalSummaries":["rows","width","stars","spaces","chars","every row a palindrome"],"differingConvention":{"pattern19":"doubles the narrowest row","pattern20":"doubles the widest row"},"outputsIdenticalAt":[0,1],"cheapSeparator":{"check":"the first row","pattern20":"2 stars","pattern19":"2n stars","separatesFrom":2,"atN2":{"pattern20":"*  *","pattern19":"****"},"atN5":{"pattern20":"*        *","pattern19":"**********"}}},"bugPanel":{"variants":[{"name":"halves swapped (= Pattern 19)","wrongOn":"39 of 41","correctAt":[0,1],"preserves":["row count","star count","width","palindrome"]},{"name":"solid row printed once (2n-1 rows)","wrongOn":"40 of 41","correctAt":[0],"preserves":["first row"]},{"name":"gap one space too wide","wrongOn":"40 of 41","correctAt":[0]},{"name":"right wing one star longer","wrongOn":"40 of 41","correctAt":[0]}]},"checkPanel":{"columns":["row count","star count","width","palindrome","first row","exact"],"smallestNThatCatches":{"halves swapped":["never","never","never","never",2,2],"solid row once":[1,1,"never","never","never",1],"gap one too wide":["never","never",1,"never",1,1],"right wing longer":["never",1,1,2,1,1]},"reading":["the first-row check catches three of four and is blind to the row count","a version printing the solid row once has a perfectly correct first row","the first row plus the row count catch all four — the cheap pair Pattern 19's table stopped short of naming"]},"assertions":["there are exactly 2n rows","every row is exactly 2n characters","row i has a wing of i stars, a gap of 2(n-i) spaces, then the same wing","the first row holds exactly two stars","total stars equal 2n(n+1) and total spaces equal 2n(n-1)"],"buildPanel":[{"n":1000,"charAtATimeMs":42.86,"buildEachRowMs":0.37,"starsBufferedGapLoopedMs":22.37,"twoBuffersMs":0.21},{"n":2000,"charAtATimeMs":180.58,"buildEachRowMs":1.11,"starsBufferedGapLoopedMs":89.79,"twoBuffersMs":0.83},{"n":4000,"charAtATimeMs":714.94,"buildEachRowMs":4.02,"starsBufferedGapLoopedMs":338.09,"twoBuffersMs":3.52}],"ratios":{"perCharToBuildEachRow":"116x to 178x","buildEachRowToTwoBuffers":"1.1x to 1.8x","buildEachRowToHalfMeasure":"60x to 84x SLOWER","pattern19Measured":"58x to 83x on identical geometry"},"python":{"perCharToBuildEachRow":"324x to 580x","buildEachRowToTwoBuffers":"0.87x to 0.91x — the buffer is slower"},"whitespace":{"where":"interior only","noRowEndsWithASpace":true,"rightTrimming":"a no-op, as in Pattern 19"}}
```

<!-- @highlights -->
- The output fills a fixed 2n by 2n frame, wings solid and gap drawn as ghost cells.
- The wings visibly grow, meet, and shrink as the frame fills top to bottom.
- The frame holds at rows n and n+1, which are identical, labelled the solid row twice.
- Counters track stars against 2n(n+1) and spaces against 2n(n-1).
- The centre places this grid beside Pattern 19's and folds one into the other by exchanging its halves.
- A single operation visibly turns one pattern into its neighbour.
- Four summary readouts run beneath both: row count, star count, width, palindrome.
- All four stay numerically identical throughout the fold, with no flicker.
- That unchanging row of numbers is the argument, so the frame is held there.
- A fifth readout, first row, is then dropped in as the only one that differs.
- Two stars here against 2n there, drawn as a highlighted strip across the top row of each grid.
- A note records that at n = 1 the two grids are the same object.
- The cost panel carries over from Pattern 19, since the geometry is identical.
- Three lanes: clicking out every character, stamping three blocks, stamping wings while clicking every ghost cell.
- The third lane's click counter runs away, because the ghost cells are half the grid.
- Time bars read 714.94ms, 4.02ms and 338.09ms, the third far longer than the second.

<!-- @edgeCases -->
- n equal to zero — no output, and the buffer version needs its guard since 2(n - 1) is negative.
- n equal to one — two rows of two stars, and the size at which this pattern and Pattern 19 are the same output.
- n equal to two — the smallest input that separates the two, by the first row alone.
- Negative n — no output from the loop versions; the buffer version needs the same guard as n equal to zero.
- The first and last rows — the narrowest, with a wing of one star each side.
- Rows n and n plus one — both solid, and the pair most often collapsed into one.
- Very large n — 4n squared characters, so n of ten thousand is four hundred million.
- No trailing whitespace anywhere — right-trimming is a no-op, as in Pattern 19.
- A caller expecting the hole in the middle — that is Pattern 19, which shares every summary with this.
- A caller expecting an odd number of rows — that is the solid row printed once, caught by the row count at n = 1.

<!-- @pitfalls -->
- Confusing this with Pattern 19. They differ only in the order of their halves, and no count, width or symmetry check separates them.
- Checking by summary at all. Row count, star count, width and palindrome all agree on both shapes at every size tested.
- Relying on the first row alone. It catches three mistakes of four and is blind to the row count, since printing the solid row once leaves the first row correct.
- Starting the second pass at n - 1 to avoid repeating the solid row. That gives 2n - 1 rows, which is the other middle convention.
- Writing the wing as n - i + 1 rather than i. That is Pattern 19 exactly, and it is correct at n = 0 and n = 1.
- Writing the gap as 2(n - i) + 1. Every row becomes 2n + 1 wide and the fixed-width check catches it at n = 1.
- Buffering the stars and leaving the gap in a loop. Measured 60x to 84x slower than building each row plainly.
- Assuming a buffer must help. In C++ it is worth 1.1x to 1.8x over building each row; in Python it is 0.87x to 0.91x, which is slower.
- Building the wing twice per row. The two sides are identical, so build it once and print it twice.
- Testing at n = 1. This pattern and Pattern 19 produce the same output there.

<!-- @doubt -->
### How is this different from Pattern 19?

<!-- @answer -->
Only in the order of the two halves — this pattern is Pattern 19 with its top and bottom exchanged, verified byte-identical for every n from 0 to 200. Pattern 19 opens solid and opens a hole; this opens at its narrowest and grows to solid. In the code the difference is one expression: the wing is `i` here and `n - i + 1` there. Everything a summary would measure is the same in both — 2n rows, every row 2n wide, 2n(n+1) stars, 2n(n-1) spaces, every row a palindrome — and at n = 0 and n = 1 the two outputs are genuinely identical.

<!-- @doubt -->
### Then how do I check which one I have?

<!-- @answer -->
Look at the first row. Here it holds exactly two stars; in Pattern 19 it holds 2n. That separates them from n = 2, where this pattern gives `*  *` and Pattern 19 gives `****`. Measured over n from 1 to 40, that check also catches a gap one space too wide and a wing one star too long. It has one blind spot: a version that prints the solid row only once still has a correct first row, and the row count catches that at n = 1. So assert the first row and the row count together, or compare row i against the wing, gap and wing it should hold.

<!-- @doubt -->
### Pattern 19 said nothing cheap caught the swap. Was that wrong?

<!-- @answer -->
It was accurate but incomplete. That container measured four summary checks — row count, star count, width, palindrome — and found all four blind to the swap, then said only comparing rows against what they should be catches it. That is true, and this pattern makes the useful version of it concrete: you do not need to compare every row, just the first, and that is as cheap as any summary. The general lesson stands unchanged — a summary compresses away order, and order is exactly what separates these two shapes.

<!-- @doubt -->
### Should the solid row appear once or twice?

<!-- @answer -->
Twice, which is what makes the output 2n rows. The first pass ends at the solid row and the second begins there again, so rows n and n + 1 are identical. Printing it once gives 2n - 1 rows and is wrong on 40 of the 41 sizes from 0 to 40, caught immediately by the row count — and notably *not* by the first-row check, which is why the two checks are needed together. This is Pattern 9's convention, and the mirror of Pattern 19's, which doubles its narrowest row instead. As always in this topic, it is part of the specification rather than something the picture settles.

<!-- @doubt -->
### Why is precomputing the stars so much slower?

<!-- @answer -->
Because building each row already writes the gap as a single bulk fill of 2(n - i) spaces, and the natural way to write a stars-only buffered version streams that gap one space at a time. The spaces are 2n(n - 1) in total, nearly half the output, which is about 32 million writes at n = 4,000. Measured, that is 338.09ms against 4.02ms — between 61 and 84 times slower. Pattern 19 measured 58 to 83 times on the identical geometry, so this is a property of the shape rather than of either pattern. Building each row plainly is already within 1.1x to 1.8x of the best version.

<!-- @doubt -->
### Is the two-buffer version worth writing?

<!-- @answer -->
In C++, marginally — 3.52ms against 4.02ms at n = 4,000, so 1.1x to 1.8x across the sizes tested. Building each row is already three bulk operations, so little remains to remove. In Python it is worth less than nothing: slicing measured 0.87x to 0.91x against plain repetition, because a slice allocates just as a repetition does — the same result Patterns 5, 10 and 19 gave. Write it if you want the structure stated explicitly; the decision that mattered was made one step earlier, when the row stopped being assembled character by character.
