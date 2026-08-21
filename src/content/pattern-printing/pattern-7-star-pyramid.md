---
id: pattern-7-star-pyramid
topic: Pattern Printing
title: Pattern 7 - Star Pyramid
difficulty: Easy
status: ready
prerequisites:
  - pattern-5-inverted-right-angled-star-triangle
  - pattern-2-right-angled-star-triangle
  - nested-loops
  - for-loop
relatedIds:
  - pattern-8-inverted-star-pyramid
  - pattern-9-diamond-star-pattern
  - pattern-5-inverted-right-angled-star-triangle
  - pattern-21-hollow-rectangle-pattern
  - nested-loops
---

<!-- @summary -->
Print a centred pyramid of stars — the first pattern where whitespace is part of the answer, which makes the star count blind to four of six mistakes and makes the habit of trimming lines hide three genuinely wrong shapes, and where every row turns out to be a window into one fixed string of length 3n-2.

<!-- @theory -->
## The problem

Print n rows where row i holds n - i leading spaces followed by 2i - 1 stars.

```
n = 4       *
           ***
          *****
         *******
```

## Two segments per row, and the first one is invisible

Every pattern so far built a row out of one repeated thing. This one has two, and
only the second is visible:

```
for i in 1..n:
    print (n - i) spaces        <- shrinks
    print (2i - 1) stars        <- grows, and stays odd
    print a newline
```

The star count being **odd** is what gives the pyramid a single centre column. It
is also what makes `2i` instead of `2i - 1` an immediately obvious mistake — the
rows come out even-width with no apex — and that one is caught by every check at
n = 1.

Two exact facts worth having:

| | |
|---|---|
| Stars in total | **n²** — 16 at n = 4, 10,000 at n = 100 |
| Length of row i | **n + i - 1** — so the widest row is 2n - 1 |
| Characters in total, spaces included | 22 at n = 4, 145 at n = 10, 14,950 at n = 100 |

The star total being a perfect square rather than triangular is the sum of the
first n odd numbers, and it is a genuinely useful check — for exactly one of the
mistakes below.

## Whitespace breaks the star count

Once part of the answer is invisible, counting the visible part stops working.
Measured over n from 1 to 40, the smallest n at which each check notices:

| Mistake | Wrong on | Star count | Line lengths |
|---|---|---|---|
| Stars `2i`, not `2i - 1` | 40/41 | n = 1 | n = 1 |
| Stars `i`, not `2i - 1` | 39/41 | n = 2 | n = 2 |
| **Spaces `n - i + 1` (shifted right)** | 40/41 | **never** | n = 1 |
| **No leading spaces at all** | 39/41 | **never** | n = 2 |
| **Trailing spaces as well as leading** | 39/41 | **never** | n = 2 |
| **Inverted (apex at the bottom)** | 39/41 | **never** | n = 2 |

Four of the six never move the star count, because none of them adds or removes a
star. Every pattern in this topic has cost one more assertion, and this is where
the count finally stops being useful at all for the majority of mistakes.

## Trimming hides three of them

This is the part worth taking away. Comparing output line by line after stripping
whitespace is a common habit — in test helpers, in judges, in a quick eyeball
diff. Measured over the same range:

| Mistake | Caught by an exact compare | After right-trimming | After stripping both ends |
|---|---|---|---|
| Trailing spaces as well as leading | n = 2 | **never** | **never** |
| Spaces `n - i + 1` (shifted right) | n = 1 | n = 1 | **never** |
| No leading spaces at all | n = 2 | n = 2 | **never** |

Right-trimming is defensible — it hides only the trailing-space mistake, which is
genuinely cosmetic. Stripping both ends is not. It hides a pyramid shifted one
column right, and it hides an output with **no leading spaces at all** — which is
a left-aligned staircase, not a pyramid, and is wrong on 39 of 41 sizes. After
stripping, the two are indistinguishable from the correct answer at every size.

For a pattern whose whole content is alignment, a check that discards alignment
checks nothing.

The cheap assertion that does work: **column n is a star on every row** — verified
for every row of every n from 1 to 200. That single fact pins the apex, and any
horizontal shift breaks it.

## Every row is a window into one string

Patterns 5 and 6 found that every row was a *prefix* of the first. Here the rows
are not prefixes of each other — they gain a star on the left and on the right at
once. But they are all substrings of one fixed string, taken at a window that
moves by one and widens by two:

```
S = (n - 1 spaces)(2n - 1 stars)          length 3n - 2

n = 4      S = "   *******"
           row 1 = S[0:4]  = "   *"
           row 2 = S[1:6]  = "  ***"
           row 3 = S[2:8]  = " *****"
           row 4 = S[3:10] = "*******"
```

Row i is `S[i-1 : i-1 + (n+i-1)]`, verified for all 20,100 rows from n = 1 to 200
with no exceptions. Dropping one space from the front and gaining two stars at
the back is exactly what the window does when its start advances by one and its
end advances by two.

That is a satisfying way to see the shape, and it makes the alignment literal
rather than computed. It is **not** a speed technique here, and it is worth being
straight about that.

## The clever version is barely faster

Measured with the output accumulated in a string stream, the fast variants timed
in batches:

| n | Char at a time | Fresh row | One row buffer | Sliding window |
|---|---|---|---|---|
| 1,000 | 24.55ms | 0.23ms | 0.13ms | 0.09ms |
| 3,000 | 221.51ms | 1.30ms | 1.07ms | 0.79ms |
| 6,000 | 887.58ms | 4.84ms | 4.94ms | 4.77ms |

The first step is the whole story — **107x to 183x** — and it is the same
per-character result Patterns 2 and 5 measured, for the same reason. Everything
after it is worth between about 1.8x and nothing, shrinking as n grows, because
at that point the time is the 1.5n² characters themselves, and every version
writes all of them.

That fits the rule the topic has been building. The buffer step paid enormously in
Patterns 3 and 6 — 75x to 113x — because it removed n(n+1)/2 number conversions.
Here, as in Pattern 5, the items are single characters with nothing to convert, so
there is nothing left to remove. Python agrees: 275x to 557x for the first step,
and a flat 1.20x to 1.24x for the window.

<!-- @intuition -->
A pyramid is the first shape in this topic where what you do not print matters as much as what you do. The spaces are load-bearing: they are the only thing placing the stars, and they are the only part of the output you cannot see. That is the whole source of difficulty — every instinct for checking a pattern, from counting stars to glancing at the screen to stripping lines before comparing them, throws away precisely the information the answer depends on. The odd width follows from the same idea: a row needs a middle, and only an odd count has one, which is why 2i - 1 rather than 2i. The window insight is a bonus rather than the point — noticing that a row loses a space on the left as it gains stars on the right means the row is not being rebuilt at all, only re-framed.

<!-- @approach -->
### Character at a Time

<!-- @idea -->
Two inner loops per row: one printing the leading spaces, one printing the stars.

<!-- @steps -->
1. Loop over the rows from one up to and including n.
2. Print n minus i spaces, which shrinks as the rows descend.
3. Print 2i minus 1 stars, which grows and stays odd.
4. Print a newline after the stars, with no trailing spaces.
5. Row one has n minus one spaces and a single star; row n has none and 2n minus one.

<!-- @complexity -->
- time: O(n^2) characters, and one stream operation per character
- space: O(1)
- note: The direct translation, and the version where the two segments are most visible. Measured 887.58ms at n = 6,000 against 4.84ms for building each row — between 107x and 183x across the sizes tested, the same per-character effect Patterns 2 and 5 measured.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int s = 1; s <= n - i; s++) {
            cout << ' ';
        }
        for (int k = 1; k <= 2 * i - 1; k++) {
            cout << '*';
        }
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: n - i spaces, shrinking by one per row. Writing n - i + 1 shifts the whole pyramid right and leaves the star count untouched.
- 9: 2i - 1 stars, odd so that the row has a single centre. Writing 2i gives even rows with no apex.
- 12: The newline follows the last star, so no trailing spaces are printed.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        for (int s = 1; s <= n - i; s++) System.out.print(' ');
        for (int k = 1; k <= 2 * i - 1; k++) System.out.print('*');
        System.out.println();
    }
}
```

<!-- @annotations -->
- 3: The spaces are part of the answer, not formatting — this loop is what centres the pyramid.
- 4: The star count must stay odd; the sum over all rows is exactly n squared.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        for s in range(n - i):
            print(" ", end="")
        for k in range(2 * i - 1):
            print("*", end="")
        print()


# No trailing spaces: the row ends at the last star. A symmetric
# second space loop looks tidy and fails an exact comparison.
```

<!-- @annotations -->
- 3: range(n - i) runs zero times on the last row, which is what leaves it flush left.
- 5: range(2 * i - 1) gives 1, 3, 5 and so on, and those sum to n squared.

<!-- @approach -->
### Build Each Row

<!-- @idea -->
Make the spaces and the stars by repetition and print the row in one operation.

<!-- @steps -->
1. Loop over the rows.
2. Build a string of n minus i spaces.
3. Append 2i minus 1 stars to it.
4. Print the result followed by a newline.
5. Both inner loops disappear.

<!-- @complexity -->
- time: O(n^2) characters, n stream operations
- space: O(n) for the widest row, which is 2n - 1
- note: Recovers essentially all the available speed — 4.84ms at n = 6,000 against 887.58ms printing character by character. Everything past this point is worth at most about 1.8x and less as n grows, since what remains is writing the characters.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        cout << string(n - i, ' ') << string(2 * i - 1, '*') << '\n';
    }
}
```

<!-- @annotations -->
- 7: The two counts state the whole pattern. Their sum, n + i - 1, is the row's length.

<!-- @code java -->
```java
static void pattern(int n) {
    for (int i = 1; i <= n; i++) {
        System.out.println(" ".repeat(n - i) + "*".repeat(2 * i - 1));
    }
}
```

<!-- @annotations -->
- 3: repeat takes both counts directly, so the arithmetic is the only thing that can be wrong.

<!-- @code python -->
```python
def pattern(n):
    for i in range(1, n + 1):
        print(" " * (n - i) + "*" * (2 * i - 1))


# Row length is n + i - 1, so the widest row is 2n - 1 and the
# whole output is about 1.5 n squared characters.
```

<!-- @annotations -->
- 3: Two repetitions and a concatenation. Measured 275x to 557x faster than printing character by character in Python.

<!-- @approach -->
### One Buffer, Sliding Window

<!-- @idea -->
Build one string of n minus one spaces followed by 2n minus one stars, and print a window of it that moves right by one and widens by two each row.

<!-- @steps -->
1. Guard against n being zero or less, since n minus one would be negative.
2. Build the buffer once: n minus one spaces, then 2n minus one stars.
3. Loop over the rows from one up to and including n.
4. Write n plus i minus one characters starting at offset i minus one.
5. Nothing is built, copied or resized inside the loop.

<!-- @complexity -->
- time: O(n^2) characters written, one allocation in total
- space: O(n) — the buffer is 3n - 2 characters
- note: Correct and elegant rather than fast. Measured 4.77ms against 4.84ms at n = 6,000, and 0.79ms against 1.30ms at n = 3,000 — the gain shrinks as n grows, because what remains is the characters. Python is flatter still, at 1.20x to 1.24x. The reason to write it is that it makes the alignment literal.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void pattern(int n) {
    if (n <= 0) return;
    string buf(n - 1, ' ');
    buf.append(2 * n - 1, '*');
    for (int i = 1; i <= n; i++) {
        cout.write(buf.data() + (i - 1), n + i - 1);
        cout << '\n';
    }
}
```

<!-- @annotations -->
- 6: Required. At n = 0 the count n - 1 is negative, converts to a huge unsigned value, and the string constructor throws.
- 8: The buffer is 3n - 2 characters, and every row of the pyramid is a substring of it.
- 10: The window starts one further right each row and is two characters longer, which is exactly one space lost and two stars gained.

<!-- @code java -->
```java
static void pattern(int n) {
    if (n <= 0) return;
    String buf = " ".repeat(n - 1) + "*".repeat(2 * n - 1);
    for (int i = 1; i <= n; i++) {
        System.out.println(buf.substring(i - 1, i - 1 + n + i - 1));
    }
}
```

<!-- @annotations -->
- 2: The same guard is needed here, since repeat rejects a negative count.
- 5: substring copies in Java, so this states the structure clearly but keeps the per-row allocation.

<!-- @code python -->
```python
def pattern(n):
    buf = " " * (n - 1) + "*" * (2 * n - 1)
    for i in range(1, n + 1):
        print(buf[i - 1 : i - 1 + n + i - 1])


# No guard needed: " " * -1 is the empty string in Python, where
# the C++ constructor throws on the same expression.
```

<!-- @annotations -->
- 2: One string holding every character the pattern will ever print, in the right order.
- 4: A slice copies in Python too, which is why this measured only 1.20x to 1.24x against building each row.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
Rows of 3, 2, 1 and 0 spaces followed by 1, 3, 5 and 7 stars — sixteen stars

<!-- @why -->
Small enough to count by hand, and it fixes the star total as a square rather than a triangle.

<!-- @walkthrough -->
1. The outer loop runs for i values 1, 2, 3 and 4.
2. At i = 1 there are n minus 1, so 3, spaces and 2 times 1 minus 1, so 1, star.
3. At i = 2 there are 2 spaces and 3 stars, then 1 and 5, then 0 and 7.
4. The star counts are the odd numbers, and 1 + 3 + 5 + 7 is 16, which is n squared.
5. Each row's total length is n plus i minus one: 4, 5, 6 and 7.
6. Including the spaces, 22 characters are printed.
7. The last row is flush left with no spaces at all, and the widest row is 2n minus one, which is 7.

<!-- @example -->

<!-- @input -->
An output with no leading spaces, compared after stripping each line

<!-- @output -->
Indistinguishable from correct at every size tested

<!-- @why -->
The strongest argument in this topic against a comparison habit that is otherwise reasonable.

<!-- @walkthrough -->
1. Dropping the space loop entirely gives a left-aligned staircase of 1, 3, 5, 7 stars.
2. That is not a pyramid, and it is wrong on 39 of the 41 sizes from 0 to 40.
3. It contains exactly n squared stars, so the star count never notices at any size.
4. An exact comparison catches it at n = 2, and so does right-trimming.
5. Stripping both ends of each line before comparing never catches it, at any n from 1 to 40.
6. The same is true of a pyramid shifted one column right, which strip also hides completely.
7. So for this pattern the alignment is the answer, and any check that discards alignment checks nothing.

<!-- @example -->

<!-- @input -->
n = 4, with the whole pattern as one string

<!-- @output -->
Three spaces then seven stars — every row is a window into it

<!-- @why -->
Shows that the rows are not being rebuilt but re-framed, which is what the fast version acts on.

<!-- @walkthrough -->
1. Build S as n minus one spaces followed by 2n minus one stars, giving three spaces and seven stars.
2. That string is 3n minus 2, so 10, characters long.
3. Row 1 is the first 4 characters of S, which is three spaces and one star.
4. Row 2 starts one later and is two longer: characters 1 to 6, giving two spaces and three stars.
5. Advancing the start by one drops a space, and extending the end by two adds two stars.
6. In general row i is S from i minus one, taking n plus i minus one characters.
7. Verified for all 20,100 rows across n from 1 to 200 with no exceptions.

<!-- @example -->

<!-- @input -->
n = 6,000, built three different ways

<!-- @output -->
887.58ms character by character, 4.84ms per row, 4.77ms from a sliding window

<!-- @why -->
Records the sliding window as elegant but not fast, and explains why using a rule the earlier patterns established.

<!-- @walkthrough -->
1. Printing character by character is between 107x and 183x slower than building each row.
2. That is the same result Patterns 2 and 5 measured, and it is the only large step available here.
3. Reusing one row buffer, and then sliding a window over a fixed string, are worth about 1.8x at n = 1,000.
4. By n = 6,000 the difference between all three of those has shrunk to almost nothing.
5. What remains is writing about 1.5 n squared characters, and every version writes all of them.
6. Patterns 3 and 6 got 75x to 113x from the same structural move, because it removed n(n+1)/2 number conversions.
7. Here the items are single characters with nothing to convert, exactly as in Pattern 5, where the step was worth 1.3x to 1.7x.

<!-- @visualization custom -->

<!-- @description -->
A grid on a fixed 2n-1 wide field so the pyramid can be seen sitting inside its bounding box, with the leading spaces drawn as visible ghost cells rather than as nothing — that choice is the whole subject of this pattern and should not be softened. Two counters per row, one shrinking through n-i and one growing through 2i-1, with the odd star count shown as a centre cell plus matching wings so the reason for the minus one is visible rather than stated. Run a vertical accent line down column n and label it apex column, holding it as a star on every single row. Then a comparison panel that is the centre of the figure: four grids side by side — correct, shifted one right, no leading spaces, trailing spaces added — and beneath them three verdict rows labelled star count, exact compare, compare after stripping. The star count row must read identical for all four. The strip row must read identical for three of the four. Only the exact row separates them. Draw the ghost cells vanishing when the strip verdict is computed, so the reader watches the information being discarded. Alongside, a window panel: one long strip reading three ghost cells then seven stars for n = 4, with a bracket that starts at index 0 and slides right by one while widening by two each step, its contents dropping into the grid row by row, and a caption reading 3n - 2 characters, 20,100 rows checked. Close with four time bars at n = 6,000 — 887.58ms, 4.84ms, 4.94ms, 4.77ms — the first gap drawn to scale and the last three deliberately equal, labelled the window is for what it says, not for speed, with a small cross-reference strip showing the same step in Patterns 3 and 6 at 75x to 113x and in Pattern 5 at 1.3x to 1.7x.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"output":"   *\n  ***\n *****\n*******\n","lines":4,"spacesPerRow":[3,2,1,0],"starsPerRow":[1,3,5,7],"stars":16,"starFormula":"n^2","rowLength":"n + i - 1","rowLengths":[4,5,6,7],"widestRow":7,"widestFormula":"2n - 1","charsPrinted":22},"counts":{"stars":{"n4":16,"n10":100,"n100":10000},"charsInclSpaces":{"n4":22,"n10":145,"n100":14950},"starsAreSquare":"verified n = 0..200","rowLengthRule":"verified for every row, n = 1..200"},"newMechanic":"two segments per row, and the first one is invisible","bugPanel":{"variants":[{"name":"stars 2i, not 2i-1 (no apex)","wrongOn":"40 of 41","correctAt":[0]},{"name":"stars i, not 2i-1","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"spaces n-i+1, shifted right","wrongOn":"40 of 41","correctAt":[0]},{"name":"no leading spaces at all","wrongOn":"39 of 41","correctAt":[0,1],"note":"a left-aligned staircase, not a pyramid"},{"name":"trailing spaces as well as leading","wrongOn":"39 of 41","correctAt":[0,1]},{"name":"inverted (apex at the bottom)","wrongOn":"39 of 41","correctAt":[0,1]}]},"checkPanel":{"columns":["star count","line lengths","exact compare","after right-trim","after strip both ends"],"smallestNThatCatches":{"stars 2i":[1,1,1,1,1],"stars i":[2,2,2,2,2],"spaces n-i+1":["never",1,1,1,"never"],"no leading spaces":["never",2,2,2,"never"],"trailing spaces":["never",2,2,"never","never"],"inverted":["never",2,2,2,2]},"reading":["four of six mistakes never move the star count","stripping both ends hides three of them, two of which are structural","right-trimming hides only the cosmetic one"],"cheapestAssertion":{"text":"column n is a star on every row","verified":"every row of every n from 1 to 200"}},"assertions":["row i has exactly n - i leading spaces","row i has exactly 2i - 1 stars","column n is a star on every row","total stars equal n^2","no row ends with a space"],"window":{"buffer":"(n-1 spaces)(2n-1 stars)","bufferLength":"3n - 2","rowRule":"row i = S[i-1 : i-1 + (n+i-1)]","verified":"20,100 rows over n = 1..200, 0 exceptions","n4":{"S":"   *******","length":10,"rows":[{"i":1,"slice":"S[0:4]","text":"   *"},{"i":2,"slice":"S[1:6]","text":"  ***"},{"i":3,"slice":"S[2:8]","text":" *****"},{"i":4,"slice":"S[3:10]","text":"*******"}]},"why":"the start advances by one, losing a space, while the end advances by two, gaining two stars"},"buildPanel":[{"n":1000,"charAtATimeMs":24.55,"freshRowMs":0.23,"oneRowBufferMs":0.13,"slidingWindowMs":0.09},{"n":3000,"charAtATimeMs":221.51,"freshRowMs":1.30,"oneRowBufferMs":1.07,"slidingWindowMs":0.79},{"n":6000,"charAtATimeMs":887.58,"freshRowMs":4.84,"oneRowBufferMs":4.94,"slidingWindowMs":4.77}],"ratios":{"perCharToFreshRow":"107x to 183x","everythingAfter":"about 1.8x at n = 1,000, shrinking to almost nothing by n = 6,000","why":"what remains is about 1.5 n^2 characters, and every version writes all of them"},"topicComparison":[{"patterns":"3 and 6","item":"number","bufferStep":"75x to 113x","reason":"removes n(n+1)/2 conversions"},{"patterns":"5 and 7","item":"single character","bufferStep":"1.2x to 1.8x","reason":"nothing to convert, only bytes to write"}],"python":{"perCharToConcat":"275x to 557x","concatToSlice":"1.20x to 1.24x"},"guard":{"needed":"C++ and Java","reason":"n - 1 is negative at n = 0; the C++ string constructor throws and Java's repeat rejects a negative count","python":"safe, since \" \" * -1 is the empty string"}}
```

<!-- @highlights -->
- The grid sits on a fixed 2n-1 wide field, so the pyramid is seen inside its bounding box.
- Leading spaces are drawn as visible ghost cells rather than as nothing, which is the whole subject of the pattern.
- Two counters per row shrink through n-i and grow through 2i-1.
- The odd star count is shown as a centre cell plus matching wings, so the minus one is visible rather than stated.
- A vertical accent line runs down column n, labelled apex column, and holds a star on every row.
- The centre panel places four grids side by side: correct, shifted one right, no leading spaces, trailing spaces added.
- Three verdict rows sit beneath them: star count, exact compare, compare after stripping.
- The star count row reads identical for all four grids.
- The strip row reads identical for three of the four.
- Only the exact row separates them.
- The ghost cells vanish as the strip verdict is computed, so the reader watches the information being discarded.
- A window panel shows one strip of three ghost cells then seven stars for n = 4.
- A bracket starts at index 0 and slides right by one while widening by two each step, its contents dropping into the grid.
- Its caption reads 3n - 2 characters, 20,100 rows checked.
- Four time bars at n = 6,000 read 887.58ms, 4.84ms, 4.94ms and 4.77ms, the first gap to scale and the last three deliberately equal.
- A cross-reference strip shows the same step in Patterns 3 and 6 at 75x to 113x and in Pattern 5 at 1.3x to 1.7x.

<!-- @edgeCases -->
- n equal to zero — no output, and in C++ and Java the buffer version needs a guard, since n minus one is negative.
- n equal to one — a single star with no spaces, where four of the six mistakes still pass.
- n equal to two — the smallest input that separates a pyramid from a left-aligned staircase.
- Negative n — no output from the loop versions; the buffer versions need the same guard as n equal to zero.
- The last row — no leading spaces at all, which is what makes an absent space loop pass a strip comparison.
- The widest row — 2n minus one characters, which is what a fixed-width output field has to accommodate.
- Very large n — about 1.5 n squared characters, so n of ten thousand is roughly 150 million.
- A judge that strips whitespace — a shifted pyramid and a spaceless staircase both pass, so the local test must not strip.
- A judge that rejects trailing whitespace — printing a symmetric second space loop fails it on 39 of 41 sizes.
- A caller expecting the apex at the bottom — that is Pattern 8, and the star count cannot tell the two apart.

<!-- @pitfalls -->
- Counting stars as the check. Four of the six mistakes here leave the count at exactly n squared, including one that produces no pyramid at all.
- Stripping lines before comparing. It hides a pyramid shifted one column right and an output with no leading spaces, at every size tested.
- Writing 2i instead of 2i - 1. The rows come out even and there is no apex — caught immediately, which makes it the least dangerous mistake here.
- Writing n - i + 1 spaces. The whole pyramid shifts one column right, the star count is unaffected, and stripping hides it.
- Adding a symmetric trailing space loop. It looks tidy and balanced, is invisible on screen, and fails an exact comparison on 39 of 41 sizes.
- Forgetting that the row length is n + i - 1, not 2i - 1. The spaces count toward it, and the widest row is 2n - 1.
- Assuming the star total is triangular. It is n squared here — 10,000 at n = 100, not 5,050.
- Omitting the n <= 0 guard in the buffer version. In C++ the negative count converts to a huge unsigned value and the string constructor throws.
- Expecting the sliding window to be fast. It is worth about 1.8x at n = 1,000 and almost nothing by n = 6,000.
- Reaching for a buffer trick before switching away from character-by-character printing. That first step is worth 107x to 183x; everything after it is worth under 2x.

<!-- @doubt -->
### Why 2i - 1 stars rather than 2i?

<!-- @answer -->
Because a pyramid needs a middle, and only an odd number of cells has one. With 2i - 1 the row is a centre star plus i - 1 on each side, so every row shares the same centre column and the shape lines up. With 2i the rows are even-width, there is no apex, and the sides cannot both align. It is also the mistake that costs least, since every check catches it at n = 1 — the row widths are wrong immediately and the star total becomes n(n+1) instead of n squared. As a bonus, the odd numbers 1, 3, 5 and so on sum to exactly n squared, which is where the square total comes from.

<!-- @doubt -->
### Why is counting stars no longer a useful check?

<!-- @answer -->
Because the spaces are part of the answer and they contain no stars. Of the six mistakes measured, four leave the total at exactly n squared: shifting the pyramid one column right, omitting the leading spaces entirely, adding trailing spaces, and turning the pyramid upside down. None of them adds or removes a star, so no count can see any of them at any size from 1 to 40. Pattern 2 could be checked by counting, Pattern 3 broke that for value bugs, Pattern 5 broke it for direction bugs, and this breaks it for everything that is about position.

<!-- @doubt -->
### My output looks right on screen but the judge rejects it. What is wrong?

<!-- @answer -->
Almost certainly trailing spaces, from writing a second space loop after the stars to make the code symmetric. It is invisible on a terminal and it differs from the expected output on 39 of the 41 sizes from 0 to 40 under an exact byte comparison — and on 0 of 41 once each line is right-trimmed, which is why it survives a casual eyeball check. Print the spaces before the stars and end the row at the last star. If you want to confirm it, compare your output against the expected bytes without any trimming at all.

<!-- @doubt -->
### Is it safe to strip whitespace before comparing outputs in a test?

<!-- @answer -->
Not for this pattern, and this is the clearest case in the topic. Stripping both ends of each line hides three separate mistakes: trailing spaces, which is cosmetic; a pyramid shifted one column right, which is not; and an output with **no leading spaces at all**, which is a left-aligned staircase rather than a pyramid and is wrong on 39 of 41 sizes. After stripping, all three are indistinguishable from correct at every size tested. Right-trimming alone is defensible — it hides only the cosmetic one. For a pattern whose content is alignment, discarding alignment discards the answer.

<!-- @doubt -->
### What is the cheapest single assertion that catches a shifted pyramid?

<!-- @answer -->
That column n is a star on every row — verified for every row of every n from 1 to 200. The apex sits at column n on row 1, and every wider row keeps a star there, so a single index check pins the alignment for the whole pattern. Any horizontal shift breaks it immediately. Beyond that, the two per-row facts are that row i has exactly n - i leading spaces and exactly 2i - 1 stars, which together are a complete specification; the total star count of n squared is a weak summary by comparison, since four of six mistakes preserve it.

<!-- @doubt -->
### Why is the sliding-window version barely faster if it does so much less work?

<!-- @answer -->
Because the work it removes was not where the time was. It removes the per-row construction, but the output is about 1.5 n squared characters and every version has to write all of them. Measured, the window is worth about 1.8x at n = 1,000 and almost nothing by n = 6,000, and in Python a flat 1.20x to 1.24x. Compare Patterns 3 and 6, where the same structural move was worth 75x to 113x — there it removed n(n+1)/2 integer-to-text conversions, which is real work. Here, as in Pattern 5, the items are single characters with nothing to convert. Write the window because it makes the alignment literal, not because it is fast.

<!-- @doubt -->
### Why does the buffer version need a guard at n = 0?

<!-- @answer -->
Because it computes n - 1 as a length, and at n = 0 that is negative. In C++ the negative value converts to a huge unsigned count and the string constructor throws rather than producing an empty string, so the guard is not optional. Java's repeat rejects a negative count for the same reason. Python is the exception — `" " * -1` is simply the empty string, so the buffer comes out empty and the loop does not run. The loop-based approaches need no guard in any of the three, since a loop with a non-positive bound just does not execute.
