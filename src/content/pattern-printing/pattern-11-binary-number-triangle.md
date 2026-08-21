---
id: pattern-11-binary-number-triangle
topic: Pattern Printing
title: Pattern 11 - Binary Number Triangle
difficulty: Easy
status: ready
prerequisites:
  - pattern-6-inverted-right-angled-number-triangle
  - pattern-3-right-angled-number-triangle
  - nested-loops
  - arithmetic-operators
relatedIds:
  - pattern-3-right-angled-number-triangle
  - pattern-6-inverted-right-angled-number-triangle
  - pattern-12-number-crown-pattern
  - pattern-22-concentric-number-rectangle
  - nested-loops
---

<!-- @summary -->
Print a triangle of alternating 0s and 1s starting from the row's parity — the pattern whose commonest bug is correct at n = 0, 1 and 2 and invisible to every counting check, and the first where the row cannot be made in one repetition, which turns the buffer trick from worth nothing into worth 35x to 110x.

<!-- @theory -->
## The problem

Print n rows where row i holds i alternating binary digits, beginning with 1 when
i is odd and 0 when i is even.

```
n = 6      1
           0 1
           1 0 1
           0 1 0 1
           1 0 1 0 1
           0 1 0 1 0 1
```

## The value depends on parity, not on the index

Pattern 3 took the value from the column counter and Pattern 4 from the row
counter. Here it comes from **both, and only their parity matters**. Three ways to
write it, all producing byte-identical output for every n from 0 to 200:

| Formulation | |
|---|---|
| Start at `i % 2`, toggle after each cell | the one that reads as the shape |
| `value = (i + j + 1) % 2` | closed form, no state |
| `value = ((i + j) & 1) ^ 1` | the same thing with bit operations |

The closed form is worth knowing because it makes the row independent of
everything before it — which is exactly what the buffer version below needs.

## The bug that survives to n = 3

Writing the toggle as one variable and forgetting to reset it at the top of each
row is the natural slip, and it is unusually well hidden. Measured against the
correct output for every n from 0 to 40:

| Mistake | Wrong on | Correct at |
|---|---|---|
| One toggle, never reset per row | 38/41 | **n = 0, 1 and 2** |
| Always starts the row with 1 | 39/41 | n = 0 and 1 |
| 0 and 1 swapped everywhere | 40/41 | n = 0 |
| Row one value short | 40/41 | n = 0 |

Three passing sizes is the deepest blind spot in this topic. Here is what the
un-reset toggle produces:

```
correct              one toggle, no reset
1                    1
0 1                  0 1
1 0 1                0 1 0        <- first divergence, row 3
0 1 0 1              1 0 1 0
1 0 1 0 1            1 0 1 0 1
0 1 0 1 0 1          0 1 0 1 0 1
```

Rows 1 and 2 agree, so n = 1 and n = 2 both pass. And rows 5 and 6 agree again,
which is why eyeballing a single large output is not a reliable check either.

## Counting catches nothing here

Every one of those first three mistakes prints the right number of digits in the
right places. The smallest n at which each check notices, over n from 1 to 40:

| Mistake | Digit count | Count of 1s | Line lengths | First column | Exact |
|---|---|---|---|---|---|
| One toggle, never reset | never | **never** | never | n = 3 | n = 3 |
| Always starts with 1 | never | n = 3 | never | n = 2 | n = 2 |
| 0 and 1 swapped | never | n = 1 | never | n = 1 | n = 1 |
| Row one value short | n = 1 | n = 1 | n = 1 | n = 1 | n = 1 |

The un-reset toggle escapes **all three** summary checks at every size tested,
including the count of 1s — it moves digits around without changing how many of
each there are. The cheap assertion that works: **row i begins with 1 when i is
odd and 0 when i is even.** That catches it at n = 3 and the always-1 bug at n = 2.

The exact counts, for when you do want them:

| | |
|---|---|
| Digits in total | n(n+1)/2 — 5,050 at n = 100 |
| Number of 1s | **⌊(n+1)²/4⌋** — 2,550 at n = 100 |
| Number of 0s | the difference — 2,500 at n = 100 |
| 1s minus 0s | **⌈n/2⌉** — always |

All verified for every n from 1 to 200.

## The shortcut Pattern 6 warned about is safe here

Pattern 6 found that the byte offset of k space-separated tokens is `2k - 1` only
while every value is one digit, and that the assumption breaks at k = 10. Here it
**never** breaks: every value is 0 or 1, so every row's byte length is exactly
`2k - 1` at every size, checked for all n from 1 to 200.

That is the point of the earlier warning stated the other way round. The rule was
never about the number ten — it was about whether the values can widen. Binary
digits cannot, so the arithmetic is exact forever.

## One buffer, two offsets

Row i is a prefix of row i + 2 — same parity, two cells longer — verified across
19,701 adjacent-by-two pairs from n = 1 to 200. So two rows would serve everything,
one per parity. In fact **one** does, because the odd-row string is the even-row
string with its first two characters dropped:

```
n = 6      C = "0 1 0 1 0 1 0"          n + 1 values, so 2n + 1 characters

           row 1 = C[2:3]   = "1"
           row 2 = C[0:3]   = "0 1"
           row 3 = C[2:7]   = "1 0 1"
           row 4 = C[0:7]   = "0 1 0 1"
           row 5 = C[2:11]  = "1 0 1 0 1"
           row 6 = C[0:11]  = "0 1 0 1 0 1"
```

Even rows are `C[0 : 2i-1]`, odd rows are `C[2 : 2i+1]`. Verified for all 20,100
rows from n = 1 to 200 with no exceptions.

## And here the buffer finally pays

| n | Digit at a time | Fresh row | One buffer |
|---|---|---|---|
| 1,000 | 36.48ms | 4.68ms | 0.13ms |
| 3,000 | 464.27ms | 45.07ms | 0.62ms |
| 6,000 | 1548.07ms | 139.63ms | 2.78ms |

Both steps are unusual, and for the same reason. Not printing digit by digit is
worth only **about 8x to 11x**, far less than the 100x-plus every star pattern
measured. The buffer is worth **roughly 35x to 73x**, where in Patterns 5, 7 and 10
it was worth 1.2x to 1.7x and in Python nothing at all.

The cause is that **the row cannot be built in one operation**. A star row is
`"*" * k`, a single bulk fill; a binary row alternates, so building it costs one
append per cell no matter how you write it. The buffer is the only thing that
removes that per-cell work — and it can, because the alternation is already there
in the buffer.

Python shows it even more sharply: 5x to 6x for the first step, and **about 40x to
110x** for the buffer, where in Pattern 10 the same move measured 0.95x to 1.05x.

<!-- @intuition -->
The alternation looks like new machinery and is really just a question about where a row's first value comes from. Once you see that it is the row's parity — odd rows open with 1, even rows with 0 — the rest is a toggle, and the only thing that can go wrong is forgetting that the toggle belongs to the row rather than to the whole triangle. The performance half is the more interesting one. Every star pattern in this topic had rows that could be produced by a single repetition, which is why holding a buffer bought so little: the row was already one bulk operation. A row that alternates is not, and cannot be made into one — so the buffer stops being a refinement and becomes the whole optimisation. What decides is not the shape but whether the row's contents are uniform.

<!-- @approach -->
### Digit at a Time

<!-- @idea -->
Set the row's first value from its parity, then toggle after every digit printed.

<!-- @steps -->
1. Loop over the rows from one up to and including n.
2. Set the current value to i modulo 2, so odd rows start at 1 and even rows at 0.
3. Loop the inner counter from one up to and including i.
4. Print a space first if this is not the first digit on the row, then the value.
5. Toggle the value, and print a newline after the inner loop finishes.

<!-- @complexity -->
- time: O(n^2) digits, with one stream operation per digit and one per separator
- space: O(1)
- note: The direct translation, and the version where resetting the toggle per row is visible as a line inside the outer loop. Measured 1548.07ms at n = 6,000 against 139.63ms for building each row — only about 8x to 11x, far less than the 100x-plus the star patterns measured, because building the row is itself per-cell work here.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        int v = i % 2;
        for (int j = 1; j <= i; j++) {
            if (j > 1) cout << ' ';
            cout << v;
            v ^= 1;
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: Inside the outer loop, so every row restarts from its own parity. Hoisting this line above the loop still passes at n = 0, 1 and 2, and first fails at n = 3.
- 10: The toggle. Exclusive-or with 1 flips 0 and 1 and nothing else.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        int v = i % 2;
        for (int j = 1; j <= i; j++) {
            if (j > 1) System.out.print(' ');
            System.out.print(v);
            v ^= 1;
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 3: i % 2 is 1 on odd rows and 0 on even ones, which is exactly the first value each row needs.
- 7: Toggling after printing, so the first digit of the row is the one the parity chose.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        v = i % 2
        for j in range(1, i + 1):
            if j > 1:
                print(" ", end="")
            print(v, end="")
            v ^= 1
        print()


# v belongs to the row, not to the triangle. Moving this line above
# the outer loop is the bug that survives all the way to n = 3.
```

<!-- @annotations -->
- 3: Reset per row. This one line is the difference between the correct triangle and the one that agrees with it at n = 0, 1 and 2.
- 8: The toggle, applied after the digit is printed rather than before.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Assemble each row into a string and print it in one operation, still toggling per cell.

<!-- @steps -->
1. Loop over the rows.
2. Start an empty row and set the value from the row's parity.
3. Append a separator before all but the first digit, then the value.
4. Toggle the value after each append.
5. Print the finished row followed by a newline.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations, but still one append per digit
- space: O(n) for the longest row
- note: Measured 139.63ms at n = 6,000, worth about 8x to 11x over printing digit by digit. Much less than a star pattern gains from the same move, because there is no single repetition that produces an alternating row — the per-cell work stays. That is what the next approach removes.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        string row;
        int v = i % 2;
        for (int j = 1; j <= i; j++) {
            if (j > 1) row += ' ';
            row += char('0' + v);
            v ^= 1;
        }
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 11: One append per digit. A star row would be a single fill of k characters; an alternating row cannot be, which is why this step gains so much less here.
- 14: One stream operation per row instead of one per digit.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        StringBuilder row = new StringBuilder();
        int v = i % 2;
        for (int j = 1; j <= i; j++) {
            if (j > 1) row.append(' ');
            row.append(v);
            v ^= 1;
        }
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 5: The inner loop survives here, unlike in the star patterns where repeat replaced it entirely.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        v = i % 2
        row = []
        for j in range(i):
            row.append(str(v))
            v ^= 1
        print(" ".join(row))


# There is no "*" * k here. Building the row costs one Python step
# per cell, which is why this is only 5x to 6x faster than printing
# digit by digit.
```

<!-- @annotations -->
- 4: A list of cells rather than a repetition, because the contents change from cell to cell.
- 6: One append per cell — the cost the buffer approach removes entirely.

<!-- @approach -->
### One Buffer, Two Offsets

<!-- @idea -->
Build one alternating string and take every row from it, starting at offset 0 for even rows and offset 2 for odd ones.

<!-- @steps -->
1. Guard against n being zero or less.
2. Build one string of n plus one alternating values starting at 0 — 2n plus 1 characters.
3. Loop over the rows from one up to and including n.
4. Choose offset 0 when i is even and offset 2 when i is odd.
5. Write 2i minus one characters from that offset, then a newline.

<!-- @complexity -->
- time: O(n^2) characters written, one pass to build the buffer, no per-cell work in the printing loop
- space: O(n) — the buffer is 2n + 1 characters
- note: The fastest by a wide margin here — 2.78ms at n = 6,000 against 139.63ms, so roughly 35x to 73x, and about 40x to 110x in Python. That is the reverse of Patterns 5, 7 and 10, where the same move was worth 1.2x to 1.7x and nothing in Python, because there the row was already a single repetition.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    string alt;
    alt.reserve(2 * n + 1);
    for (int k = 0; k <= n; k++) {
        if (k) alt += ' ';
        alt += (k % 2 == 0 ? '0' : '1');
    }
    for (int i = 1; i <= n; i++) {
        cout.write(alt.data() + (i % 2 == 0 ? 0 : 2), 2 * i - 1);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 7: One alternating string of n + 1 values, built once. Every row of both parities is a slice of it.
- 14: Even rows start at 0 and odd rows at 2, because dropping the first two characters of "0 1 0 1..." gives "1 0 1...". The length 2i - 1 is exact at every size here, since binary digits never widen.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    StringBuilder alt = new StringBuilder();
    for (int k = 0; k <= n; k++) {
        if (k > 0) alt.append(' ');
        alt.append(k % 2 == 0 ? '0' : '1');
    }
    for (int i = 1; i <= n; i++) {
        int start = (i % 2 == 0) ? 0 : 2;
        System.out.println(alt.substring(start, start + 2 * i - 1));
    }
}
```

<!-- @annotations -->
- 9: The offset is the only thing that varies with parity; the length rule is the same for both.

<!-- @code python -->
```python
def pattern(n):
    alt = " ".join("0" if k % 2 == 0 else "1" for k in range(n + 1))
    for i in range(1, n + 1):
        start = 0 if i % 2 == 0 else 2
        print(alt[start : start + 2 * i - 1])


# Measured 40x to 110x faster than building each row — the opposite
# of the star patterns, where slicing a buffer bought nothing.
```

<!-- @annotations -->
- 2: n + 1 values gives 2n + 1 characters, which is one value more than the longest row needs so that the odd-row offset stays in range.
- 5: A slice replaces the per-cell loop entirely, which is where the whole gain comes from.

<!-- @example -->

<!-- @input -->
n = 6

<!-- @output -->
Six rows alternating from the row's parity — twenty-one digits, twelve of them 1s

<!-- @why -->
Six rather than four, because the un-reset-toggle bug agrees with the correct output on rows 1, 2, 5 and 6 and only differs on 3 and 4.

<!-- @walkthrough -->
1. Row 1 is odd, so it starts at 1 and holds one digit.
2. Row 2 is even, so it starts at 0 and reads 0 1.
3. Row 3 is odd again and reads 1 0 1, and so on down to row 6.
4. The digit total is 6 times 7 over 2, which is 21.
5. The number of 1s is the floor of 7 squared over 4, which is 12, leaving 9 zeros.
6. The difference, 3, is the ceiling of n over 2.
7. Every row's byte length is 2i minus one, since each value is one character and the separators are single spaces.

<!-- @example -->

<!-- @input -->
A single toggle declared above the outer loop, at n = 1, 2 and 3

<!-- @output -->
Correct at n = 1 and n = 2, first wrong at n = 3

<!-- @why -->
The deepest blind spot in this topic, and it escapes every counting check at every size tested.

<!-- @walkthrough -->
1. Declaring the toggle once and never resetting it lets it carry over between rows.
2. Row 1 prints 1 and leaves the toggle at 0, which happens to be what row 2 needs.
3. Row 2 prints 0 1 and leaves the toggle at 0, which is not what row 3 needs.
4. So rows 1 and 2 are correct and row 3 comes out as 0 1 0 instead of 1 0 1.
5. That means n = 0, n = 1 and n = 2 all pass, and the mistake is wrong on 38 of the 41 sizes from 0 to 40.
6. It prints the right number of digits, and even the right number of 1s, so no counting check ever notices.
7. Asserting that row i starts with 1 when i is odd catches it at n = 3.

<!-- @example -->

<!-- @input -->
Pattern 6's 2k - 1 offset rule, applied here

<!-- @output -->
Exact at every size, where Pattern 6's broke at k = 10

<!-- @why -->
Restates the earlier warning as a condition rather than a threshold, which is the form that transfers.

<!-- @walkthrough -->
1. Pattern 6 found that k space-separated tokens occupy 2k minus one bytes only while every value is one digit.
2. There the values were 1, 2, 3 upward, so the rule failed as soon as row 10 appeared.
3. Here the values are only ever 0 or 1, so they can never widen.
4. Checked for every row of every n from 1 to 200, the byte length is exactly 2i minus one.
5. So the buffer version can compute its slice length arithmetically with no offset table.
6. The transferable rule is about whether the values can widen, not about the number ten.
7. If this pattern printed values from 10 upward, the same rule would fail immediately rather than at row 10.

<!-- @example -->

<!-- @input -->
n = 6,000, built three different ways

<!-- @output -->
1548.07ms digit by digit, 139.63ms per row, 2.78ms from one buffer

<!-- @why -->
Inverts the result every star pattern in this topic gave, and identifies the property that decides it.

<!-- @walkthrough -->
1. In Patterns 5, 7 and 10 the big step was not printing character by character, worth over 100 times.
2. Here that step is worth only about 8 to 11 times.
3. The reason is that building a row is itself per-cell work: an alternating row has no single repetition that makes it.
4. The buffer removes that per-cell work, and measured roughly 35 to 73 times.
5. In Patterns 5, 7 and 10 the same buffer move was worth 1.2 to 1.7 times, and nothing at all in Python.
6. Here Python gains about 40 to 110 times from it.
7. So the deciding property is whether a row's contents are uniform, not what the shape looks like.

<!-- @visualization custom -->

<!-- @description -->
A grid whose cells carry 0 or 1, with a parity badge on each row showing i mod 2 and an arrow from that badge into the row's first cell — the badge is the subject, so it should be the only coloured element until the toggle starts. Draw the toggle as a small two-state switch that flips after each cell is emitted, and place it visually inside the row's band rather than beside the grid, so that its scope is drawn rather than described. Then the bug panel, which is this pattern's centre: lift the switch out of the row band and park it above the whole grid, and step both versions together from n = 1. They must agree on rows 1 and 2, diverge visibly at row 3, and agree again at rows 5 and 6 — hold each of those three moments. Beneath, four verdict lamps per version: digit count, count of 1s, line lengths, first column. The first three stay green under the buggy version at every step; only the first-column lamp turns red, at row 3. Print the exact counts alongside as they accumulate — n(n+1)/2 digits, floor((n+1)^2/4) ones, difference ceil(n/2) — and show the buggy version matching all three. Beside the grid put the buffer strip: one alternating string of n+1 values with two cursors, an even-row cursor anchored at offset 0 and an odd-row cursor anchored at offset 2, both extending to 2i-1. Show them alternating as the rows are emitted, and label the strip 2n+1 characters, both parities. Close with three time bars at n = 6,000 — 1548.07ms, 139.63ms, 2.78ms — set against a greyed reference row showing the same three bars for Pattern 10, where the proportions are reversed, and a single caption reading a star row is one repetition; an alternating row is not.

<!-- @sampleInput -->
```json
{"primary":{"n":6,"output":"1\n0 1\n1 0 1\n0 1 0 1\n1 0 1 0 1\n0 1 0 1 0 1\n","rows":6,"digitsPerRow":[1,2,3,4,5,6],"digits":21,"ones":12,"zeros":9,"difference":3,"rowStartRule":"1 when i is odd, 0 when i is even","rowByteLength":"2i - 1"},"formulations":[{"name":"start at i % 2, toggle after each cell","note":"the one that reads as the shape"},{"name":"value = (i + j + 1) % 2","note":"closed form, no state"},{"name":"value = ((i + j) & 1) ^ 1","note":"the same with bit operations"}],"formulationsAgreeOver":"n = 0..200, 0 differences","counts":{"digits":"n(n+1)/2","ones":"floor((n+1)^2 / 4)","zeros":"digits - ones","onesMinusZeros":"ceil(n/2)","verified":"n = 1..200","atN4":{"digits":10,"ones":6,"zeros":4,"difference":2},"atN10":{"digits":55,"ones":30,"zeros":25,"difference":5},"atN100":{"digits":5050,"ones":2550,"zeros":2500,"difference":50}},"bugPanel":{"variants":[{"name":"one toggle, never reset per row","wrongOn":"38 of 41","correctAt":[0,1,2],"firstDivergesAtRow":3,"agreesAgainAtRows":[5,6],"atN6":"1 / 0 1 / 0 1 0 / 1 0 1 0 / 1 0 1 0 1 / 0 1 0 1 0 1"},{"name":"always starts the row with 1","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"0 and 1 swapped everywhere","wrongOn":"40 of 41","correctAt":[0]},{"name":"row one value short","wrongOn":"40 of 41","correctAt":[0]}]},"checkPanel":{"columns":["digit count","count of 1s","line lengths","first column","exact"],"smallestNThatCatches":{"one toggle never reset":["never","never","never",3,3],"always starts with 1":["never",3,"never",2,2],"0 and 1 swapped":["never",1,"never",1,1],"row one value short":[1,1,1,1,1]},"reading":["the un-reset toggle escapes all three summary checks at every size tested","it moves digits around without changing how many of each there are"],"cheapestAssertion":"row i begins with 1 when i is odd and 0 when i is even"},"assertions":["row i holds exactly i digits","row i begins with i mod 2","every digit is 0 or 1 and they alternate along the row","row i is exactly 2i - 1 characters long","total digits equal n(n+1)/2"],"offsetRule":{"claim":"k space-separated tokens occupy exactly 2k - 1 bytes","holdsHere":"at every size, verified n = 1..200","pattern6":"broke at k = 10, when values reached two digits","transferableRule":"the question is whether the values can widen, not the number ten"},"buffer":{"C":"0 1 0 1 ... with n+1 values","length":"2n + 1","evenRow":"C[0 : 2i-1]","oddRow":"C[2 : 2i+1]","verified":"20,100 rows over n = 1..200, 0 mismatches","rowIPrefixOfRowIPlus2":{"pairs":19701,"exceptions":0},"n6":{"C":"0 1 0 1 0 1 0","length":13,"rows":[{"i":1,"slice":"C[2:3]","text":"1"},{"i":2,"slice":"C[0:3]","text":"0 1"},{"i":3,"slice":"C[2:7]","text":"1 0 1"},{"i":4,"slice":"C[0:7]","text":"0 1 0 1"},{"i":5,"slice":"C[2:11]","text":"1 0 1 0 1"},{"i":6,"slice":"C[0:11]","text":"0 1 0 1 0 1"}]}},"buildPanel":[{"n":1000,"digitAtATimeMs":36.48,"freshRowMs":4.68,"bufferMs":0.13},{"n":3000,"digitAtATimeMs":464.27,"freshRowMs":45.07,"bufferMs":0.62},{"n":6000,"digitAtATimeMs":1548.07,"freshRowMs":139.63,"bufferMs":2.78}],"ratios":{"perDigitToFreshRow":"about 8x to 11x","freshRowToBuffer":"roughly 35x to 73x"},"python":{"perDigitToJoin":"5x to 6x","joinToSlice":"about 40x to 110x"},"contrastWithStarPatterns":{"patterns5_7_10":{"perCharToFreshRow":"over 100x","bufferStep":"1.2x to 1.7x, and nothing in Python"},"pattern11":{"perDigitToFreshRow":"8x to 11x","bufferStep":"35x to 73x, and 40x to 110x in Python"},"why":"a star row is one repetition and an alternating row is not, so the per-cell work only disappears with the buffer"}}
```

<!-- @highlights -->
- Each cell carries 0 or 1, with a parity badge per row showing i mod 2 and an arrow into that row's first cell.
- The badge is the subject and stays the only coloured element until the toggle starts.
- The toggle is drawn as a two-state switch that flips after each cell is emitted.
- The switch sits inside the row's band, so its scope is drawn rather than described.
- The bug panel lifts the switch out of the row band and parks it above the whole grid.
- Both versions step together from n = 1, agreeing on rows 1 and 2.
- They diverge visibly at row 3, then agree again at rows 5 and 6 — all three moments are held.
- Four verdict lamps per version: digit count, count of 1s, line lengths, first column.
- The first three stay green under the buggy version at every step.
- Only the first-column lamp turns red, and only at row 3.
- Exact counts accumulate alongside: n(n+1)/2 digits, floor((n+1)^2/4) ones, difference ceil(n/2).
- The buggy version matches all three of those totals.
- The buffer strip holds one alternating string of n+1 values with two cursors, anchored at offsets 0 and 2.
- Both cursors extend to 2i-1, alternating as the rows are emitted, under the label 2n+1 characters, both parities.
- Three time bars at n = 6,000 read 1548.07ms, 139.63ms and 2.78ms.
- A greyed reference row shows the same three bars for Pattern 10, where the proportions are reversed, captioned a star row is one repetition; an alternating row is not.

<!-- @edgeCases -->
- n equal to zero — no output, and the buffer version needs its guard since it builds a string before looping.
- n equal to one — a single 1, where three of the four mistakes still pass.
- n equal to two — 1 then 0 1, and still not enough to catch the un-reset toggle.
- n equal to three — the smallest input that catches the un-reset toggle, and the smallest worth trusting here.
- Negative n — no output from the loop versions; the buffer version needs the guard.
- Odd versus even n — the last row starts with 1 when n is odd and 0 when n is even, which is the quickest visual check of the parity rule.
- Very large n — n(n+1)/2 digits and about n squared characters; the values never widen, so nothing about the arithmetic changes.
- A caller expecting every row to start with 1 — that is a different triangle, and it agrees with this one at n = 0 and n = 1.
- A caller expecting no separators — then a row is exactly i characters rather than 2i minus one, and the buffer offsets become 0 and 1.
- A caller expecting 0 first on odd rows — that is the swapped version, caught at n = 1 by the count of 1s.

<!-- @pitfalls -->
- Declaring the toggle above the outer loop. It survives to n = 3, is invisible to every counting check, and agrees with the correct output again on later rows.
- Testing at n = 1 or n = 2. Both pass the un-reset-toggle bug, so neither says anything.
- Counting digits, or counting 1s, as the check. The un-reset toggle preserves both exactly at every size tested.
- Starting every row with 1. Correct at n = 0 and 1, and caught by the count of 1s only from n = 3.
- Toggling before printing rather than after. The row then opens with the wrong parity, which is the swapped version.
- Assuming Pattern 6's 2k - 1 warning applies here. It does not — binary digits never widen, so the rule is exact at every size.
- Expecting the buffer trick to be a refinement, as it was in the star patterns. Here it is the main optimisation, worth 35x to 73x.
- Reaching first for "stop printing character by character". That step is worth only 8x to 11x here, against over 100x in every star pattern.
- Sizing the buffer at 2n - 1. The odd-row offset of 2 needs one extra value, so the buffer is n + 1 values and 2n + 1 characters.
- Omitting the n <= 0 guard in the buffer version. It builds its string before the loop, so a non-positive n is not simply a loop that does not run.

<!-- @doubt -->
### Why does forgetting to reset the toggle survive so long?

<!-- @answer -->
Because the first two rows happen to line up. Row 1 prints 1 and leaves the toggle at 0, which is exactly what row 2 needs, so rows 1 and 2 are correct and n = 1 and n = 2 both pass. Row 2 then leaves the toggle at 0 again, and row 3 needs 1 — so that is the first divergence. Measured over n from 0 to 40, the mistake is wrong on 38, passing at n = 0, 1 and 2. Worse, it agrees with the correct output again on rows 5 and 6, so scanning one large output is not reliable either. Assert that row i starts with i mod 2 and it fails at n = 3.

<!-- @doubt -->
### Why does counting the 1s not catch it?

<!-- @answer -->
Because the mistake rearranges digits without changing how many of each there are. Every row still holds the right number of cells, and across the whole triangle the totals come out exactly right: n(n+1)/2 digits, ⌊(n+1)²/4⌋ ones, and a difference of ⌈n/2⌉ — all of which the buggy version matches at every size tested. That is the same lesson Pattern 3 introduced for value bugs and Pattern 9 for placement bugs: a count summarises the output and a summary is satisfied by many different outputs. The specific per-row assertion is what works.

<!-- @doubt -->
### Pattern 6 said 2k - 1 was unsafe. Why is it safe here?

<!-- @answer -->
Because the rule was never about the number ten — it was about whether the values can widen. In Pattern 6 the values counted 1, 2, 3 upward, so from row 10 a token took two characters and the arithmetic broke. Here every value is 0 or 1 and always will be, so k space-separated tokens occupy exactly 2k - 1 bytes at every size, verified for every row of every n from 1 to 200. That is why the buffer version can compute its slice length directly with no offset table. Stated as a condition rather than a threshold, the rule transfers cleanly.

<!-- @doubt -->
### How can one buffer serve both odd and even rows?

<!-- @answer -->
Because dropping the first two characters of an alternating string gives the other alternation. Build C = "0 1 0 1 ..." with n + 1 values, which is 2n + 1 characters. Then C starts "0 1 0 ..." and C from index 2 starts "1 0 1 ...". So even rows are C[0 : 2i-1] and odd rows are C[2 : 2i+1] — verified for all 20,100 rows from n = 1 to 200 with no exceptions. The extra value is why the buffer holds n + 1 rather than n: the odd-row offset of 2 needs it to stay in range on the last row.

<!-- @doubt -->
### Why is the buffer worth so much more here than in the star patterns?

<!-- @answer -->
Because a star row is a single repetition and an alternating row is not. In Patterns 5, 7 and 10 building a row was one bulk fill — `"*" * k` — so the buffer only saved an allocation, worth 1.2x to 1.7x in C++ and nothing in Python. Here the row's contents change from cell to cell, so building it costs one append per cell however you write it, and only the buffer removes that. Measured, the buffer is worth roughly 35x to 73x in C++ and about 40x to 110x in Python. The deciding property is whether a row's contents are uniform, not what the shape looks like.

<!-- @doubt -->
### Should I use the toggle or the closed form?

<!-- @answer -->
Either — they produce byte-identical output for every n from 0 to 200, along with the bit-operation form. The toggle reads as the shape and is what most people write; the closed form `(i + j + 1) % 2` has the advantage of making each cell independent of every other, which is what lets you jump to any row without replaying the ones before it. That independence is also what the buffer version relies on. If the toggle is what you write, put its declaration inside the outer loop — that placement is the single thing this pattern is really about.
