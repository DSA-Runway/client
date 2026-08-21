---
id: pattern-6-inverted-right-angled-number-triangle
topic: Pattern Printing
title: Pattern 6 - Inverted Right-Angled Number Triangle
difficulty: Easy
status: ready
prerequisites:
  - pattern-5-inverted-right-angled-star-triangle
  - pattern-3-right-angled-number-triangle
  - nested-loops
  - for-loop
relatedIds:
  - pattern-3-right-angled-number-triangle
  - pattern-5-inverted-right-angled-star-triangle
  - pattern-13-increasing-number-triangle
  - pattern-15-reverse-letter-triangle
  - nested-loops
---

<!-- @summary -->
Print rows counting 1 to n, then 1 to n-1, down to 1 — Pattern 3 reversed and Pattern 5's shape carrying numbers, where every row is a prefix of the first but the cut lands on a token boundary rather than a byte count, so the obvious 2k-1 shortcut is correct for every n up to 9 and wrong from 10.

<!-- @theory -->
## The problem

Print n rows where row i holds the numbers 1 through n - i + 1, separated by
single spaces.

```
n = 4      1 2 3 4
           1 2 3
           1 2
           1
```

## Two threads meeting

This is Pattern 3's content on Pattern 5's shape: the value still comes from the
column counter, and the row length still counts down. Both earlier lessons apply
unchanged, and so do both of their blind spots:

- from Pattern 3, a **value** bug preserves the item count, so counting sees nothing
- from Pattern 5, a **direction** bug preserves the sizes too, so sorting the line
  lengths sees nothing either

Measured over n from 1 to 40, the smallest n at which each check notices:

| Mistake | Wrong on | Items | Lengths, sorted | Lengths, in order | Tokens |
|---|---|---|---|---|---|
| Row length one short | 40/41 | n = 1 | n = 1 | n = 1 | n = 1 |
| Row length fixed at n | 39/41 | n = 2 | n = 2 | n = 2 | n = 2 |
| 0-based values | 40/41 | never | n = 10 | n = 10 | n = 1 |
| Prints the row value, not the column | 39/41 | never | n = 10 | n = 10 | n = 2 |
| **Not inverted (= Pattern 3)** | 39/41 | **never** | **never** | n = 2 | n = 2 |

This pattern is Pattern 3 with its lines reversed — 0 differences for every n from
0 to 300 — so a direction bug leaves the item total *and* the multiset of line
lengths untouched, exactly as Pattern 5's did against Pattern 2. The characters
printed are identical too: 16 at n = 4, 14,187 at n = 100, 1,897,888 at n = 1,000.

The assertion that has survived every pattern in this topic is still the specific
one: line i must be the tokens 1 through n - i + 1, in that position.

## Every row is a prefix of the first — but not at the offset you expect

Pattern 5's fast version built one buffer and printed shorter and shorter pieces
of it. The same is true here: **every row is a prefix of the first row**, checked
across 20,100 rows from n = 1 to 200 with no exceptions. Row 1 is `1 2 3 4` and
row 2 is `1 2 3`, which is its first six characters.

The difference is where to cut. In Pattern 5 the row length in characters *was*
the row length in stars, so the cut was `n - i + 1`. Here the cut has to land on a
token boundary, and the byte offset of the first k tokens is not k. It looks like
`2k - 1` — one digit and one space per token, minus the missing final space — and
for a while it is:

| k | 1 | 2 | ... | 9 | **10** | 11 | 12 |
|---|---|---|---|---|---|---|---|
| Byte offset | 1 | 3 | ... | 17 | **20** | 23 | 26 |
| 2k - 1 | 1 | 3 | ... | 17 | **19** | 21 | 23 |

Cutting at `2k - 1` bytes is **correct for every n from 0 to 9 and wrong from
n = 10**, where it truncates the last number:

```
correct        1 2 3 4 5 6 7 8 9 10
2k - 1 cut     1 2 3 4 5 6 7 8 9 1
```

That is the same n = 10 threshold this topic keeps producing — Pattern 3 found it
in the line-length check, Pattern 4 found it again — but this is the first time it
sits inside an *optimisation* rather than inside a test. A shortcut that is right
on every small example is worse than one that is obviously wrong.

The two ways to cut correctly: record where each token ends while building the
buffer, or shrink the buffer by the last token's width each row. Both verified
against the reference for every n from 0 to 200 with no differences.

## What the buffer is worth

Measured with the output accumulated in a string stream, the fast variants timed
in batches:

| n | Number at a time | Fresh row | Shrink one row | One buffer + offsets |
|---|---|---|---|---|
| 1,000 | 33.03ms | 12.62ms | 0.17ms | 0.14ms |
| 3,000 | 302.27ms | 115.29ms | 1.09ms | 1.03ms |
| 6,000 | 1215.58ms | 458.60ms | 5.23ms | 4.60ms |

The first step is about 2.6x, the same as Pattern 3 and Pattern 4, because the
per-item cost is a number conversion either way. The second step is the large one
here — roughly **75x to 105x** — because it removes both the repeated conversions
(18,003,000 down to 6,000 at n = 6,000) and the rebuilding of every row. The two
buffer forms sit within about 1.2x of each other, the offset table consistently a
shade ahead.

That is worth lining up against the rest of the topic, since all four figures are
the same measurement made under different shapes:

| Pattern | Rows | Item | Buffer step is worth |
|---|---|---|---|
| 3 | grow | number | 113x |
| **6** | **shrink** | **number** | **about 75x to 105x** |
| 5 | shrink | star | 1.3x to 1.7x |
| 4 | neither | number | unavailable — the rows do not nest |

The reuse pays when there are conversions to avoid and the rows nest. Take away
either and it collapses.

Python agrees on the shape and gives a sharper split: printing item by item is
5.9x to 6.5x off building each row with a join; shrinking one string is a further
**50x to 90x**; but caching the tokens and re-joining them per row — which removes
every conversion and nothing else — is only 4.5x to 5.4x. So in Python the
rebuilding costs several times more than the conversions do.

<!-- @intuition -->
Nothing here is new — it is Pattern 3's rows in Pattern 5's order — and that is the reason to look closely, because the interesting part is what carries over and what quietly does not. The shape idea carries: every row still sits inside the first one, so one buffer can serve the whole pattern. The arithmetic does not, and the reason is worth holding onto: in a star pattern the number of items and the number of characters are the same quantity, so a length is a length. Once the items are numbers those two quantities come apart, and any code that treats them as interchangeable is correct only while every number happens to be one character wide. That is why the same n = 10 boundary keeps appearing in this topic from different directions — it is not a coincidence about the number ten, it is the point where item counts and byte counts stop agreeing.

<!-- @approach -->
### Number at a Time

<!-- @idea -->
Nested loops where the inner bound counts down from n and the printed value comes from the inner counter.

<!-- @steps -->
1. Loop over the rows from one up to and including n.
2. This row holds n minus the row index plus one numbers.
3. Loop the inner counter from one up to that limit.
4. Print a space first if this is not the first number on the row, then the inner counter's value.
5. Print a newline after the inner loop finishes.

<!-- @complexity -->
- time: O(n^2) numbers printed, with one stream operation per number and one per separator
- space: O(1)
- note: The direct translation, carrying both earlier mechanics at once. Measured 1215.58ms at n = 6,000 against 458.60ms building each row — about 2.6x, the same figure as Patterns 3 and 4, since the per-item cost is a number conversion either way.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n - i + 1; j++) {
            if (j > 1) cout << ' ';
            cout << j;
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: The bound counts down as in Pattern 5, while the value comes from j as in Pattern 3 — both mechanics in one header.
- 8: j, not i. Printing i gives rows of repeated numbers, which no counting check catches.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int j = 1; j <= n - i + 1; j++) {
            if (j > 1) System.out.print(' ');
            System.out.print(j);
        }
        System.out.println();
    }
}
```

<!-- @annotations -->
- 3: Writing n - i instead of n - i + 1 empties the last row and is wrong on 40 of 41 sizes.
- 5: The value tracks the column, so the row reads upward even though the rows shrink.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for j in range(1, n - i + 2):
            if j > 1:
                print(" ", end="")
            print(j, end="")
        print()


# Counting the outer loop down — for k in range(n, 0, -1), inner over
# range(1, k + 1) — gives byte-identical output with no arithmetic.
```

<!-- @annotations -->
- 3: range(1, n - i + 2) stops one past the row's last value. Counting the outer loop down removes this expression entirely.
- 6: Printing j. Printing i here would repeat the row number instead, which is a well-formed triangle and the wrong one.

<!-- @approach -->
### Fresh Row Each Time

<!-- @idea -->
Count the rows down so the loop variable is the row's length, then build and print each row in one operation.

<!-- @steps -->
1. Loop k from n down to one — k is this row's count of numbers.
2. Start an empty string for the row.
3. Append the numbers one through k, with a separator before all but the first.
4. Print the finished string followed by a newline.
5. The stream operations drop from one per number to one per row.

<!-- @complexity -->
- time: O(n^2) characters, n(n+1)/2 integer-to-text conversions, n stream operations
- space: O(n) for the longest row
- note: Measured 458.60ms at n = 6,000, worth about 2.6x. It still converts every number on every row — 18,003,000 conversions of only 6,000 distinct values — and rebuilds a row that the previous one already contained.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int k = n; k >= 1; k--) {
        string row;
        for (int j = 1; j <= k; j++) {
            if (j > 1) row += ' ';
            row += to_string(j);
        }
        cout << row << '\n';
    }
}
```

<!-- @annotations -->
- 6: Counting down makes k the row's number count directly, so the n - i + 1 arithmetic disappears.
- 10: One conversion per number printed. The values repeat across rows, which is what the next approach exploits.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int k = n; k >= 1; k--) {
        StringBuilder row = new StringBuilder();
        for (int j = 1; j <= k; j++) {
            if (j > 1) row.append(' ');
            row.append(j);
        }
        System.out.println(row);
    }
}
```

<!-- @annotations -->
- 3: A fresh builder per row, discarding a row that was a prefix of the one before it.

<!-- @code python -->
```python
def pattern(n):
    for k in range(n, 0, -1):
        print(" ".join(map(str, range(1, k + 1))))


# Clear, and the slowest of the three: n(n+1)/2 conversions of only
# n distinct values, plus a full rebuild of every row.
```

<!-- @annotations -->
- 3: join places separators between items, so no trailing space can appear.

<!-- @approach -->
### One Buffer, One Token Shorter Each Row

<!-- @idea -->
Build the first row once and print prefixes of it, cutting at token boundaries rather than at a fixed character count.

<!-- @steps -->
1. Build the full first row once, recording where each token ends as you go.
2. Loop over the rows from one up to and including n.
3. Row i needs the first n minus i plus one tokens.
4. Write exactly that many bytes, taken from the recorded end position.
5. Nothing is converted, rebuilt or reallocated inside the printing loop.

<!-- @complexity -->
- time: O(n^2) characters written, only n integer-to-text conversions, n stream operations
- space: O(n) for the buffer, plus O(n) for the offsets
- note: The fastest here — 4.60ms at n = 6,000 against 458.60ms rebuilding each row, roughly 75x to 105x across the sizes tested. Shrinking the buffer instead of recording offsets measures within about 1.2x of it. In Python the same idea is worth 50x to 90x, while caching the tokens and re-joining them is only 4.5x to 5.4x.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
#include <vector>
using namespace std;

void pattern(int n) {
    string buf;
    vector<size_t> tokenEnd(n + 1, 0);
    for (int v = 1; v <= n; v++) {
        if (v > 1) buf += ' ';
        buf += to_string(v);
        tokenEnd[v] = buf.size();
    }
    for (int i = 1; i <= n; i++) {
        cout.write(buf.data(), tokenEnd[n - i + 1]);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 8: The table records where each token ends. It exists because the byte offset of k tokens is not k, and is only 2k - 1 while every value is one digit.
- 12: Filled while the buffer is built, so the offsets cost nothing beyond the n conversions already being done.
- 15: Writes the first n - i + 1 tokens' worth of bytes. Nothing is copied, resized or reallocated.

<!-- @code java -->
```java
static void pattern(int n) {
    StringBuilder row = new StringBuilder();
    for (int v = 1; v <= n; v++) {
        if (v > 1) row.append(' ');
        row.append(v);
    }
    for (int k = n; k >= 1; k--) {
        System.out.println(row);
        row.setLength(row.length() - Integer.toString(k).length() - (k > 1 ? 1 : 0));
    }
}
```

<!-- @annotations -->
- 9: Shrinking by the last token's width — its digits, plus the separator that preceded it unless it was the only token.

<!-- @code python -->
```python
def pattern(n):
    row = " ".join(map(str, range(1, n + 1)))
    for k in range(n, 0, -1):
        print(row)
        row = row[:len(row) - len(str(k)) - (1 if k > 1 else 0)]


# Measured 50x to 90x faster than rebuilding the row each time.
# Caching the tokens and re-joining is only 4.5x to 5.4x, so the
# rebuild costs several times more than the conversions do.
```

<!-- @annotations -->
- 2: The whole pattern's characters, built once. Every row printed afterwards is a prefix of this string.
- 5: The cut is computed from the token's digit count, never assumed. Assuming 2k - 1 is right up to n = 9 and wrong from n = 10.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
1 2 3 4 / 1 2 3 / 1 2 / 1 — ten numbers over four lines

<!-- @why -->
Small enough to read at a glance, and it fixes the item total and character count that the direction bug will be shown to preserve.

<!-- @walkthrough -->
1. The outer loop runs for i values 1, 2, 3 and 4.
2. At i = 1 the row length is n minus 1 plus 1, which is 4, so the row reads 1 2 3 4.
3. At i = 2 the length is 3, then 2, then 1.
4. The values always start at one and count up, no matter which row they are on.
5. The item total is 4 + 3 + 2 + 1, which is 10 — the same n(n+1)/2 as Pattern 3.
6. The characters printed number 16, which is also exactly what Pattern 3 gives at this size.
7. So the two differ only in the order of the lines, which is what the checks turn on.

<!-- @example -->

<!-- @input -->
The 2k - 1 shortcut for cutting the buffer, at n = 9 and n = 10

<!-- @output -->
Correct for every n up to 9; from n = 10 it truncates the last number

<!-- @why -->
An optimisation that passes every small hand-check and fails on the first realistic input.

<!-- @walkthrough -->
1. Every row is a prefix of the first row, so one buffer can serve them all.
2. The cut must land on a token boundary, and the natural guess is that k tokens occupy 2k - 1 bytes.
3. That is one digit and one separator per token, minus the separator the last token does not have.
4. It holds exactly while every value is a single digit, which is up to and including nine.
5. At k = 10 the real offset is 20 and the guess says 19, so the row ends 1 2 3 4 5 6 7 8 9 1.
6. Measured over n from 0 to 40, the shortcut is correct for n = 0 through 9 and wrong on the other 31.
7. Recording each token's end position while building the buffer costs nothing extra and is right at every size.

<!-- @example -->

<!-- @input -->
The non-inverted version, checked four ways

<!-- @output -->
Same item total, same sorted line lengths, same character count — wrong answer

<!-- @why -->
Combines Pattern 3's blind spot with Pattern 5's, so three of the four checks agree with a completely wrong output.

<!-- @walkthrough -->
1. This pattern is Pattern 3 with its lines reversed, verified with 0 differences for every n from 0 to 300.
2. Reversing lines moves nothing in or out, so the item total is n(n+1)/2 in both.
3. The multiset of line lengths is identical too, and so is the character count — 14,187 at n = 100 for both.
4. Asked for the smallest n at which the item count or the sorted lengths notice, over n from 1 to 40, neither ever does.
5. Comparing the line lengths in order catches it at n = 2, where this pattern gives 3 then 1 and Pattern 3 gives 1 then 3.
6. The cheapest single assertion is that the first row holds n numbers; Pattern 3's first row always holds one.
7. Measured over n from 0 to 40 the mistake is wrong on 39, passing only at n = 0 and n = 1.

<!-- @example -->

<!-- @input -->
n = 6,000, built three different ways

<!-- @output -->
1215.58ms number by number, 458.60ms per row, 4.60ms from one buffer

<!-- @why -->
Completes a four-way comparison across the topic that isolates what the buffer step actually depends on.

<!-- @walkthrough -->
1. Printing number by number costs about 2.6x more than building each row, matching Patterns 3 and 4.
2. Holding one buffer removes both the repeated conversions and the rebuilding of each row.
3. Conversions drop from 18,003,000 to 6,000, and the measured gain is roughly 75x to 105x.
4. Pattern 3 measured 113x for the same step, with the rows growing rather than shrinking.
5. Pattern 5 measured only 1.3x to 1.7x, because its items were single characters with nothing to convert.
6. Pattern 4 could not take the step at all, since its rows share nothing with each other.
7. So the step pays when there are conversions to avoid and the rows nest, and take away either and it collapses.

<!-- @visualization custom -->

<!-- @description -->
Start from Pattern 3's grid and flip it on a hinge, holding three readouts beneath both states — item total, sorted line lengths, character count — all three staying visibly identical through the flip while the ordered line lengths change. Put an assertion chip beside them reading first row holds n numbers, green on one and red on the other from n = 2. The centre of the drawing is the buffer panel. Draw the first row as one continuous strip of characters with tick marks at token boundaries, and beneath it two rulers: a token ruler counting 1, 2, 3 and a byte ruler counting the actual offsets. Up to token 9 the two rulers advance in lockstep at 2 bytes per token; at token 10 the byte ruler jumps 3 while the token ruler jumps 1, and that divergence must be the most emphasised moment in the figure. Show a cut marker driven by 2k - 1 landing mid-number at k = 10, with the resulting row rendered as 1 2 3 4 5 6 7 8 9 1 in the error colour beside the correct 1 2 3 4 5 6 7 8 9 10, and a caption reading correct for every n up to 9. Then show the fix twice: an offset table filled as the buffer is built, its entries drawn as pointers into the strip; and a shrink cursor stepping back by one token's width per row. Both cursors should drive the same output grid. Close with a four-lane comparison across the topic rather than within it: four bars labelled Pattern 3, Pattern 6, Pattern 5, Pattern 4 showing what the buffer step was worth in each — 113x, about 75x to 105x, 1.3x to 1.7x, and a struck-through bar labelled rows do not nest — with two axis labels reading has conversions to avoid and rows nest, so the reader can see the two conditions the win depends on.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"1 2 3 4\n1 2 3\n1 2\n1\n","lines":4,"itemsPerLine":[4,3,2,1],"items":10,"formula":"n(n+1)/2","charsPrinted":16,"rowLength":"n - i + 1 numbers","valueSource":"inner counter j"},"inheritsFrom":{"pattern3":"the value comes from the column counter","pattern5":"the row length counts down"},"reversal":{"claim":"this pattern is Pattern 3 with its lines reversed","verifiedOver":"n = 0..300, 0 differences","preserved":["item total","multiset of line lengths","character count"],"changed":["order of lines"],"charsEqual":{"n4":16,"n10":101,"n100":14187,"n1000":1897888}},"prefixProperty":{"everyRowPrefixOfFirstRow":true,"rowsChecked":20100,"exceptions":0,"over":"n = 1..200","cutLandsOn":"a token boundary, not a fixed byte count"},"offsetTable":{"tokenCount":[1,2,3,4,5,6,7,8,9,10,11,12],"byteOffset":[1,3,5,7,9,11,13,15,17,20,23,26],"twoKMinusOne":[1,3,5,7,9,11,13,15,17,19,21,23],"agreeUpToK":9,"divergesAtK":10},"shortcutBug":{"name":"cut the prefix at 2k - 1 bytes","correctFor":"n = 0..9","wrongOn":"31 of 41","firstFailsAt":10,"producesAtN10":"1 2 3 4 5 6 7 8 9 1","correctAtN10":"1 2 3 4 5 6 7 8 9 10","lesson":"a shortcut that is right on every small example is worse than one that is obviously wrong"},"bugPanel":{"variants":[{"name":"not inverted (= Pattern 3)","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"prints the row value, not the column","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"0-based values","wrongOn":"40 of 41","correctAt":[0]},{"name":"row length one short","wrongOn":"40 of 41","correctAt":[0]},{"name":"row length fixed at n (rectangle)","wrongOn":"39 of 41","correctAt":[0,1]}]},"checkPanel":{"columns":["item total","line lengths sorted","line lengths in order","token comparison"],"smallestNThatCatches":{"row length one short":[1,1,1,1],"row length fixed at n":[2,2,2,2],"0-based values":["never",10,10,1],"prints the row value":["never",10,10,2],"not inverted":["never","never",2,2]},"cheapestAssertion":{"text":"the first row holds n numbers","catchesDirectionBugAt":2,"pattern3FirstRow":1}},"assertions":["line i holds exactly n - i + 1 tokens","the tokens on line i are 1,2,...,n-i+1","total items equal n(n+1)/2","no line begins or ends with a space"],"buildPanel":[{"n":1000,"numberAtATimeMs":33.03,"freshRowMs":12.62,"shrinkRowMs":0.17,"bufferOffsetsMs":0.14},{"n":3000,"numberAtATimeMs":302.27,"freshRowMs":115.29,"shrinkRowMs":1.09,"bufferOffsetsMs":1.03},{"n":6000,"numberAtATimeMs":1215.58,"freshRowMs":458.60,"shrinkRowMs":5.23,"bufferOffsetsMs":4.60}],"conversionsAt6000":{"freshRow":18003000,"buffer":6000},"ratios":{"perItemToFreshRow":"about 2.6x","freshRowToBuffer":"roughly 75x to 105x","shrinkVsOffsets":"within about 1.2x, offsets a shade ahead"},"topicComparison":[{"pattern":3,"rows":"grow","item":"number","bufferStep":"113x"},{"pattern":6,"rows":"shrink","item":"number","bufferStep":"about 75x to 105x"},{"pattern":5,"rows":"shrink","item":"star","bufferStep":"1.3x to 1.7x"},{"pattern":4,"rows":"neither","item":"number","bufferStep":"unavailable, the rows do not nest"}],"conditions":["there are conversions to avoid","the rows nest"],"python":{"perItemToJoin":"5.9x to 6.5x","joinToShrink":"50x to 90x","joinToCachedTokenRejoin":"4.5x to 5.4x","reading":"the rebuild costs several times more than the conversions do"}}
```

<!-- @highlights -->
- Pattern 3's grid flips on a hinge into this one, with three readouts held beneath both states.
- Item total, sorted line lengths and character count all stay visibly identical through the flip.
- Only the ordered line lengths change, which is the entire difference between the two patterns.
- An assertion chip reads first row holds n numbers, green on one grid and red on the other from n = 2.
- The buffer panel draws the first row as one strip of characters with tick marks at token boundaries.
- Two rulers run beneath it: a token ruler counting 1, 2, 3 and a byte ruler counting actual offsets.
- Up to token 9 the rulers advance in lockstep at two bytes per token.
- At token 10 the byte ruler jumps 3 while the token ruler jumps 1 — the most emphasised moment in the figure.
- A cut marker driven by 2k - 1 lands mid-number at k = 10.
- The resulting row renders as 1 2 3 4 5 6 7 8 9 1 in the error colour beside the correct 1 2 3 4 5 6 7 8 9 10.
- A caption reads correct for every n up to 9.
- The fix is shown twice: an offset table filled as the buffer is built, its entries drawn as pointers into the strip.
- And a shrink cursor stepping back by one token's width per row, both driving the same output grid.
- A four-lane bar chart compares the buffer step across the topic: Pattern 3, Pattern 6, Pattern 5, Pattern 4.
- The bars read 113x, about 75x to 105x, 1.3x to 1.7x, and a struck-through bar labelled rows do not nest.
- Two axis labels read has conversions to avoid and rows nest, showing the two conditions the win depends on.

<!-- @edgeCases -->
- n equal to zero — no output, and the outer loop never runs.
- n equal to one — a single 1, where the non-inverted version and the rectangle both pass.
- n equal to two — the smallest input that separates this pattern from Pattern 3, giving 1 2 then 1 against 1 then 1 2.
- n equal to nine — the largest input at which the 2k - 1 cut is still correct.
- n equal to ten — where the byte offset of k tokens stops being 2k - 1, and where every length-based check finally gains power.
- Negative n — no output, since the loop does not run.
- Very large n — at n = 1,000 there are 500,500 items but 1,897,888 characters, identical to Pattern 3 at the same size.
- The last row — exactly one number, and the row that disappears if the length is written n - i.
- The first row — all n numbers, and the cheapest single thing to assert.
- A caller expecting the rows to grow — that is Pattern 3, which this pattern's direction bug produces exactly.

<!-- @pitfalls -->
- Cutting the buffer at 2k - 1 bytes. Correct for every n up to 9 and wrong from n = 10, where it truncates the last number to a single digit.
- Treating an item count as a byte count anywhere. They are the same quantity only while every item is one character wide, which is what makes star patterns misleading practice for number patterns.
- Printing the non-inverted triangle. It has the same item total, the same sorted line lengths and the same character count as the correct answer.
- Checking with anything order-blind. Item counts, sorted lengths and character totals all agree with a triangle pointing the wrong way.
- Printing i where you meant j. The rows become repeated numbers, which no counting check catches and which length checks miss until n = 10.
- Writing the row length as n - i rather than n - i + 1. The last row comes out empty, wrong on 40 of 41 sizes.
- Keeping the n - i + 1 arithmetic when you could count the outer loop down. The loop variable is then the row's length and there is nothing left to get wrong.
- Rebuilding each row when the previous one already contained it. Measured roughly 75x to 105x slower than holding one buffer.
- Assuming removing the conversions is most of the win. In Python, caching the tokens and re-joining is worth 4.5x to 5.4x while shrinking one string is worth 50x to 90x.
- Assuming the buffer step is always worth this much. It was 1.3x to 1.7x in Pattern 5 and unavailable in Pattern 4.

<!-- @doubt -->
### Why can I not just cut the buffer at 2k - 1 characters?

<!-- @answer -->
Because that assumes every number is one digit wide. Each token contributes its digits plus one separator, minus the separator the last token does not have, so k tokens occupy 2k - 1 bytes only while every value is below ten. At k = 10 the true offset is 20 and the formula gives 19, so the row ends 1 2 3 4 5 6 7 8 9 1 instead of 1 2 3 4 5 6 7 8 9 10. Measured over n from 0 to 40 the shortcut is correct for n = 0 through 9 and wrong on the other 31. Record each token's end position while building the buffer instead — it costs nothing, since you are walking the tokens anyway.

<!-- @doubt -->
### Why does n = 10 keep showing up in this topic?

<!-- @answer -->
Because it is where item counts and byte counts stop agreeing, and that boundary shows up wherever code or a check confuses the two. Pattern 3 found it in the line-length check, which is blind to value bugs while every value is one character. Pattern 4 found it again for the same reason. Here it appears inside an optimisation instead — the 2k - 1 cut. It is not a fact about the number ten; it is the first size at which a value needs two characters. If the pattern printed values from 100 upward, the same boundary would sit at a different n.

<!-- @doubt -->
### How do I check this pattern if the item count and the character count are both useless?

<!-- @answer -->
Check position by position. This pattern is Pattern 3 with its lines reversed — 0 differences over n = 0 to 300 — so the item total, the multiset of line lengths and the character count are all identical between the right answer and the wrong one, and none of them ever catches the direction bug at any size tested. Line lengths compared *in order* catch it at n = 2, and comparing the tokens on line i against 1 through n - i + 1 catches everything. The cheap single assertion is that the first row holds n numbers, where Pattern 3's first row always holds one.

<!-- @doubt -->
### Should I use an offset table or shrink the buffer?

<!-- @answer -->
Either — they measured within about 1.2x of each other, with the offset table consistently a shade ahead. The table states the invariant plainly, since each entry is literally where a row ends, and it costs one integer per token filled while you are building the buffer anyway. Shrinking reads better in Java, where setLength does exactly that. In Python shrinking is the natural form. What matters is that both compute the cut from the token's real width rather than assuming it, which is the whole point of this pattern.

<!-- @doubt -->
### The buffer step was worth 113x in Pattern 3. Why is it different here?

<!-- @answer -->
It is close — roughly 75x to 105x — because the same two things are true here: there are conversions to avoid and the rows nest. Compare the two patterns where one of those fails. Pattern 5's rows also nest, but its items are single stars with nothing to convert, so the step was worth only 1.3x to 1.7x. Pattern 4 has plenty of conversions, but its rows share nothing, so the step is not available at all and its whole ladder was 5.2x. The step is worth a lot exactly when both conditions hold.

<!-- @doubt -->
### Is caching the number text enough, without the buffer?

<!-- @answer -->
Not in Python, and the gap is large. Converting the tokens once and re-joining a slice of them per row removes every conversion — n instead of n(n+1)/2 — and measured 4.5x to 5.4x against joining from scratch. Holding one string and shrinking it measured 50x to 90x. So the rebuilding costs several times more than the conversions do, and stopping at the conversion fix leaves most of the win on the table. In C++ the two halves are closer to even, which Pattern 3 measured directly, so this split is worth treating as language-specific rather than general.

<!-- @doubt -->
### Is there anything genuinely new here, or is it Patterns 3 and 5 combined?

<!-- @answer -->
Mostly combined, and that is the reason to write it out: both parents' blind spots apply at once, so three separate checks agree with the wrong answer. The genuinely new thing is small and specific — once the items are numbers, a row's length in items and its length in characters are different quantities, and Pattern 5's buffer trick relied on them being the same. That is what produces the 2k - 1 trap, and it is the first time in this topic that an *optimisation* rather than a *test* is the thing that quietly depends on single-digit values.
