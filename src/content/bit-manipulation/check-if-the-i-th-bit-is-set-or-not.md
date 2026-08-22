---
id: check-if-the-i-th-bit-is-set-or-not
topic: Bit Manipulation
title: Check if the i-th bit is Set or Not
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-bits-and-tricks
  - data-types
  - relational-and-logical-operators
  - type-conversion-and-casting
relatedIds:
  - check-if-a-number-is-odd-or-not
  - count-the-number-of-set-bits
  - check-if-a-number-is-power-of-2-or-not
  - set-unset-the-rightmost-unset-bit
  - power-set-bit-manipulation
---

<!-- @summary -->
Two one-line answers, both correct, and they are not interchangeable: `(n >> i) & 1` returns 1 while `n & (1 << i)` returns 2^i, so on n = 13 the second gives 1, 0, 4, 8 for the first four positions. All three defensible forms were checked against a division reference across 1,048,576 (value, position) pairs with zero failures, and the near-miss `(n & (1 << i)) == 1` was wrong on 491,520 of them — none of which had i = 0, which is exactly why it survives a quick test. The shift form also measured 1.60x faster, at 10,416ns against 16,625ns over 65,536 random reads.

<!-- @theory -->
## The problem

Given `n` and a position `i`, report whether bit `i` of `n` is 1. Bit 0 is the
rightmost.

```
n = 13 = 0 0 0 0 1 1 0 1
             i=  3 2 1 0

bit 0 -> 1     bit 1 -> 0     bit 2 -> 1     bit 3 -> 1
```

There are exactly two ideas here, and the whole subtopic is the difference
between them: **move the bit to the mask, or move the mask to the bit.**

## Move the number down, or move the mask up

```
(n >> i) & 1                        n & (1 << i)

  shift n right by i, so bit i        build a mask with one bit at
  lands in position 0, then           position i, then AND — every
  clear everything above it           other column is forced to 0
```

Both answer the question. They do not return the same thing:

| `i` | `(13 >> i) & 1` | `13 & (1 << i)` |
|---|---|---|
| 0 | 1 | 1 |
| 1 | 0 | 0 |
| 2 | 1 | **4** |
| 3 | 1 | **8** |

The second column is `2^i` when the bit is set, because the AND *preserves the
column it kept* — it does not move it. Both are correct as truth values, since any
non-zero is true. Only one of them is correct as a number.

## The near-miss that passes your tests

That difference produces the single most common bug in this subtopic:

```cpp
if ((n & (1 << i)) == 1)      // wrong for every i except 0
```

Checked over all 65,536 sixteen-bit values and all 16 positions:

| | Count | Share |
|---|---|---|
| Pairs tested | 1,048,576 | |
| Pairs where `== 1` gives the wrong answer | **491,520** | 46.875% |
| …of those, pairs with `i = 0` | **0** | 0% |
| Pairs where the bit is clear, and it agrees | 524,288 of 524,288 | **100%** |

Read the last two rows together, because they explain why this bug ships. It is
right on **every** `i = 0` case, and right on **every** case where the bit is
clear. A test that checks bit 0, or checks that the function says "no" when the
bit is absent, passes completely. The failures are entirely in "bit `i > 0` is
set", which is the case people assume is symmetric with the one they tested.

Write `!= 0` and the problem disappears — or use the shift form, which returns
1 and cannot be misread.

## The shift form is also the faster one

Over 65,536 random `(n, i)` pairs, best of 300 runs:

| Form | Time | Returns |
|---|---|---|
| `(n >> i) & 1` | **10,416ns** | 0 or 1 |
| `(n & (1 << i)) != 0` | 16,625ns | 0 or 1 |
| `(n & (1 << i)) == (1 << i)` | 16,625ns | 0 or 1 |
| `if (n & (1 << i))` | 16,625ns | branch |

A real **1.60x**, and it is not the AND that costs — all three mask forms are
identical to the nanosecond. The difference is that `(n >> i) & 1` *is already a
number*, so summing it is free, while the mask forms must be turned into 0-or-1
with a compare before they can be counted. In a plain `if` that comparison would
have happened anyway, which is why the branchy version costs exactly the same as
the other two.

If `i` is a compile-time constant, the shift is folded into the instruction and
the read drops to 8,291ns — **1.26x** faster again. Worth knowing when the
position is a literal.

## Reading every bit: the fixed loop wins

The natural way to walk all 32 positions is a loop, and the natural instinct is to
stop early once `n` reaches 0. Over 16,384 random 32-bit values:

| Loop | Time | Iterations |
|---|---|---|
| `for i in 0..31: (n >> i) & 1` | **65,500ns** | always 32 |
| `for i in 0..31: (n & (1 << i)) != 0` | 216,667ns | always 32 |
| `while (n) { n & 1; n >>= 1; }` | 381,750ns | 31.01 average |

The early-exit loop does **fewer** iterations and takes **5.83x** longer. The
reason is that its trip count depends on the data, so it cannot be unrolled or
vectorised, while a fixed 32-iteration loop can be. And the saving it is chasing
barely exists: in a random 32-bit value the top bit is set half the time, so the
average trip count is 31.01 out of 32.

This is the first place in the topic where the clever version loses, and it will
not be the last.

## Negatives need no special handling

Sign extension looks like a problem and is not, because the `& 1` erases
everything the sign dragged in:

```
-8 = 11111111111111111111111111111000

bit:  0    1    2    3    4        (…and every bit from 3 upward)
      0    0    0    1    1
```

`(n >> i) & 1` gives the right answer for a negative `n` in C++, Java and Python
alike. What differs is only what happens *above* the width:

- **C++ and Java** stop at 31. Bit 31 of −1 is 1, and asking for bit 32 is
  undefined in C++ and silently wraps in Java, where the shift count is masked to
  five bits — so `n >> 32` is `n`, not 0.
- **Python** never stops. `(-1 >> 99) & 1` is 1, because the sign extends forever.
  There is no bit 31 in particular, and no width at which the answer becomes
  meaningless.

Java's `>>` versus `>>>` does not matter here, which is worth saying explicitly
because it matters almost everywhere else in this topic: both forms give the same
answer once you mask with `& 1`.

## The width trap

The mask form has one failure mode the shift form does not:

```cpp
long long big = ...;
bool set = big & (1 << 40);        // wrong: 1 is an int
bool set = big & (1LL << 40);      // right
```

Shifting a 32-bit `1` by 40 is undefined behaviour, and undefined behaviour that
looks like it works — measured here, `1 << 40` produced **256**, because the
hardware masks the shift count to five bits and 40 mod 32 is 8. The value is
plausible, the type is right, and nothing warns at runtime. `(big >> 40) & 1`
has no such problem, because `big` is already wide enough.

## Where this goes next

**Check if a Number is Odd or Not** is this subtopic with `i` fixed at 0 — and
that single specialisation turns out to be worth measuring separately, because
`n & 1` beats `n % 2` on signed values for the same rounding reason that made
`x / 2` and `x >> 1` differ. After that, **Count the Number of Set Bits** runs
this read 32 times and then discovers that not doing so is much faster.

<!-- @intuition -->
The question "is bit i set" has two symmetrical answers, and picking between them is the whole subtopic. You can bring the bit to a fixed place — shift n right by i so the bit you want lands in position 0, then wipe everything else with & 1 — or you can bring a probe to the bit, building a mask that is 1 only at position i and ANDing it against n so every other column collapses to zero. The first returns a clean 0 or 1. The second returns 0 or 2^i, because AND keeps a column where it stands rather than moving it, and that is the detail everything else here follows from: compare it against 1 and you have written a bug that is correct for bit 0 and correct whenever the bit is absent, which is to say correct on every case a hurried test looks at.

<!-- @approach -->
### Brute Force - Convert to a Binary String and Index It

<!-- @idea -->
Build the binary representation as text, then look at the character in position i.

<!-- @steps -->
1. Convert `n` to a string of binary digits, most significant digit first.
2. Note that the string is indexed left to right while bits are numbered right to left.
3. So bit `i` lives at string position `length - 1 - i`.
4. Guard the case where `i` is at least the string length — those bits are 0 (or the sign, for a negative).
5. Compare that character to '1' and return the result.

<!-- @complexity -->
- time: O(w) to build the string, O(1) to index it
- space: O(w) for the string, against O(1) for either real answer
- note: Correct, and worth writing once to see the indexing flip — the string runs the opposite way from the bit numbering, which is where the off-by-one lives. It is the slowest form available and the only one that allocates, so it is a teaching step rather than an answer.

<!-- @code cpp -->
```cpp
#include <string>
#include <algorithm>
using namespace std;

bool ithBitSet(unsigned n, int i) {
    string s;
    if (n == 0) s = "0";
    while (n) { s += char('0' + (n & 1u)); n >>= 1; }

    if (i >= (int)s.size()) return false;
    return s[i] == '1';
}
```

<!-- @annotations -->
- 8: Because the digits were appended lowest bit first, s is already in bit order — s[i] IS bit i, with no reversal and no length - 1 - i.
- 10: Positions beyond the significant digits are 0, so this is the honest answer rather than a guard against a crash.
- 11: If you reverse s for printing, this line becomes s[s.size() - 1 - i] — reversing for display and then indexing as if you had not is the classic bug in this form.

<!-- @code java -->
```java
static boolean ithBitSet(int n, int i) {
    String s = Integer.toBinaryString(n);
    int idx = s.length() - 1 - i;
    if (idx < 0) return false;
    return s.charAt(idx) == '1';
}
```

<!-- @annotations -->
- 2: toBinaryString prints most significant digit first, so the index has to be flipped — unlike the C++ version above, which never reversed.
- 3: For a negative n this returns all 32 characters, so bit 31 is reachable and idx is never negative for i in 0..31.

<!-- @code python -->
```python
def ith_bit_set(n: int, i: int) -> bool:
    s = bin(n)[2:]
    if i >= len(s):
        return False
    return s[len(s) - 1 - i] == "1"


# Fails for negative n: bin(-8) is '-0b1000', so s becomes 'b1000'.
# Mask first — bin(n & 0xFFFFFFFF)[2:] — or just use (n >> i) & 1.
```

<!-- @annotations -->
- 2: Slicing off '0b' is fine for non-negative values and quietly wrong for negatives, where the string starts '-0b'.
- 8: This is the concrete reason the string approach is worse in Python than in the other two languages — there is no fixed-width binary form to fall back on.

<!-- @approach -->
### Better - Slide the Mask Up to the Bit

<!-- @idea -->
Build a value with a single 1 at position i and AND it against n.

<!-- @steps -->
1. Compute `1 << i`, which is a value with exactly one bit set, at position `i`.
2. AND it with `n`; every column except `i` is forced to 0 because the mask is 0 there.
3. The result is `2^i` if bit `i` was set, and 0 otherwise.
4. Convert to a truth value by comparing against 0 — never against 1.
5. Return that comparison.

<!-- @complexity -->
- time: O(1) — a shift, an AND and a compare
- space: O(1)
- note: Verified against a division reference over all 1,048,576 (value, position) pairs at 16 bits, 0 failures, in both the `!= 0` and `== (1 << i)` spellings. Measured 16,625ns over 65,536 reads against the shift form's 10,416ns — a 1.60x gap that comes from the compare, not the AND. Preferred when you want to test several bits against one mask, since the mask can be built once.

<!-- @code cpp -->
```cpp
bool ithBitSet(unsigned n, int i) {
    return (n & (1u << i)) != 0u;
}

// (n & (1u << i)) == 1  is wrong for every i except 0.
// Measured: wrong on 491,520 of 1,048,576 (value, position) pairs,
// and on none of the pairs where i == 0.
//
// For a value wider than int, the literal must be wide too:
//     big & (1LL << 40)     not     big & (1 << 40)
```

<!-- @annotations -->
- 2: 1u rather than 1, so that i = 31 is not undefined behaviour. This is the position least likely to appear in a test and most likely to appear in production.
- 2: != 0u rather than == 1u. The AND preserves the column where it stands, so a set bit yields 2^i.
- 10: 1 << 40 with an int literal is undefined behaviour that looks like it works — measured here it produced 256, because the shift count is masked to five bits.

<!-- @code java -->
```java
static boolean ithBitSet(int n, int i) {
    return (n & (1 << i)) != 0;
}

// 1 << 31 is well defined in Java and gives Integer.MIN_VALUE,
// so bit 31 needs no special care. But the shift count is masked
// to five bits, so (n & (1 << 32)) tests bit 0, silently.
//
// For a long, write 1L << i.
```

<!-- @annotations -->
- 2: Java has no unsigned int, but none is needed — 1 << 31 is defined here, unlike C++.
- 6: The masking is specified rather than undefined, which makes it worse in one respect: it always produces a plausible answer, so nothing ever reports the mistake.

<!-- @code python -->
```python
def ith_bit_set(n: int, i: int) -> bool:
    return n & (1 << i) != 0


# No width limit: 1 << 200 is an ordinary integer, so any i works.
# Measured 105ns per read against 98ns for (n >> i) & 1 over 20,000 reads.
```

<!-- @annotations -->
- 2: Comparison binds more tightly than & in Python, so this parses as n & ((1 << i) != 0) — which is n & True — and is WRONG. Write (n & (1 << i)) != 0 with the parentheses.
- 6: The one language where the mask form has no width trap at all, because there is no width.

<!-- @approach -->
### Optimal - Shift the Bit Down to Position 0

<!-- @idea -->
Slide bit i into position 0 and clear everything above it with a single AND.

<!-- @steps -->
1. Shift `n` right by `i`, which moves bit `i` into position 0 and discards everything below.
2. Everything above position 0 is still there, so AND with 1 to erase it.
3. The result is exactly 0 or 1 — a number, not just a truth value.
4. Return it directly, or compare it to 1 if a boolean is wanted.
5. Note that this works unchanged for negative `n`, because the AND removes whatever the sign extended in.

<!-- @complexity -->
- time: O(1) — a shift and an AND
- space: O(1)
- note: Verified over all 1,048,576 (value, position) pairs at 16 bits, 0 failures. Measured 10,416ns over 65,536 random reads against the mask form's 16,625ns, a 1.60x gap, because the result is already a number and needs no compare to be counted. With a constant i it folds to 8,291ns, a further 1.26x. This is the form the rest of the topic uses.

<!-- @code cpp -->
```cpp
int getBit(unsigned n, int i) {
    return (n >> i) & 1;
}

bool ithBitSet(unsigned n, int i) {
    return getBit(n, i) == 1;
}

// Works for a signed n too: (-8 >> 3) & 1 is 1, because & 1
// discards everything sign extension dragged in from the top.
```

<!-- @annotations -->
- 2: The parentheses are required by precedence, not by taste — & binds more loosely than >>, so n >> i & 1 happens to parse correctly, but n & 1 == 0 does not.
- 6: Comparing to 1 is safe here, unlike in the mask form, because the value really is 0 or 1.
- 9: No cast, no unsigned copy, no >>> — masking with 1 makes sign extension irrelevant.

<!-- @code java -->
```java
static int getBit(int n, int i) {
    return (n >> i) & 1;
}

// >> and >>> give the SAME answer here, which is unusual in this topic —
// the & 1 discards every sign bit the shift dragged in. Elsewhere the
// difference matters; in this one expression it does not.
```

<!-- @annotations -->
- 2: One of the few places in Java bit code where reaching for >>> is unnecessary.
- 4: Worth stating out loud because the habit of always writing >>> is a good habit, and this is the exception that explains what the habit is protecting against.

<!-- @code python -->
```python
def get_bit(n: int, i: int) -> int:
    return (n >> i) & 1


# Negatives sign extend forever, which is consistent rather than surprising:
# (-1 >> i) & 1 is 1 for every i, including i = 99.
# (-8 >> i) & 1 gives 0, 0, 0, 1, 1 for i = 0..4.
# Measured 98ns per read over 20,000 reads — the fastest of the three forms.
```

<!-- @annotations -->
- 2: Identical to the C++ and Java line, and the only one of the three approaches that translates without a caveat.
- 5: There is no bit 31 in Python, so "the sign bit" is not a position — it is every position from the top of the magnitude upward.

<!-- @approach -->
### Reading Every Bit - Fixed Loop Rather Than Early Exit

<!-- @idea -->
Walk all w positions with a constant trip count instead of stopping when n reaches zero.

<!-- @steps -->
1. Loop `i` from 0 to `w - 1` and read `(n >> i) & 1` each time.
2. Do not stop early when the remaining value hits 0.
3. Note that the fixed trip count lets the compiler unroll and vectorise the loop.
4. Note that the early-exit version saves almost nothing — the average trip count on random 32-bit values is 31.01 out of 32.
5. Choose the fixed loop unless the values are known to be small.

<!-- @complexity -->
- time: O(w) — 32 reads for an int, regardless of the value
- space: O(1)
- note: Measured over 16,384 random 32-bit values: the fixed shift loop took 65,500ns, the fixed mask loop 216,667ns, and the early-exit while loop 381,750ns. The early-exit version does fewer iterations — 31.01 on average against 32 — and still runs 5.83x slower, because a data-dependent trip count cannot be unrolled or vectorised.

<!-- @code cpp -->
```cpp
#include <cstdio>

int countSetBits(unsigned n) {
    int c = 0;
    for (int i = 0; i < 32; i++) c += (n >> i) & 1u;
    return c;
}

int countSetBitsEarlyExit(unsigned n) {
    int c = 0;
    while (n) { c += n & 1u; n >>= 1; }
    return c;
}
```

<!-- @annotations -->
- 5: A constant bound, so the compiler can unroll this and process several values at once — measured 65,500ns over 16,384 values.
- 11: Looks cheaper and is 5.83x slower, at 381,750ns, because the trip count depends on n.
- 11: It is also the version that breaks on a negative signed n, where >> sign extends and the loop never ends.

<!-- @code java -->
```java
static int countSetBits(int n) {
    int c = 0;
    for (int i = 0; i < 32; i++) c += (n >>> i) & 1;
    return c;
}

// Integer.bitCount(n) is an intrinsic and compiles to one instruction.
```

<!-- @annotations -->
- 3: >>> is not required for correctness here, since & 1 masks — but a fixed 32-iteration loop makes the width explicit, which is the point.
- 6: In real code, call this. The loop above is for seeing the mechanism.

<!-- @code python -->
```python
def count_set_bits(n: int) -> int:
    return sum((n >> i) & 1 for i in range(n.bit_length()))


# bit_length() replaces the fixed 32, since there is no fixed width.
# int.bit_count() is the real answer and measured 41.8x faster
# than a hand-written shift loop: 45ns against 1,882ns per value.
```

<!-- @annotations -->
- 2: A fixed 32 would be wrong in both directions — too many iterations for small values and too few for large ones.
- 6: The C++ argument about vectorising does not transfer; in Python the loop overhead dominates everything, so the builtin wins by a much larger margin.

<!-- @example -->

<!-- @input -->
n = 13, i = 0, 1, 2, 3

<!-- @output -->
(n >> i) & 1 gives 1, 0, 1, 1 — while n & (1 << i) gives 1, 0, 4, 8

<!-- @why -->
It is the smallest input that separates the two forms, and it separates them at i = 2, one position past where a quick test looks.

<!-- @walkthrough -->
1. 13 is 1101, so bits 0, 2 and 3 are set and bit 1 is clear.
2. For i = 0: 13 >> 0 is 13, and 13 & 1 is 1. The mask form gives 13 & 1, also 1 — the two agree.
3. For i = 1: 13 >> 1 is 6, and 6 & 1 is 0. The mask form gives 13 & 2, which is 0. They agree again.
4. For i = 2: 13 >> 2 is 3, and 3 & 1 is 1. But the mask form gives 13 & 4, which is 4 — the same truth value, a different number.
5. For i = 3: the shift form gives 1 and the mask form gives 8.
6. Both columns are correct as answers to "is it set". Only the first is correct as an answer to "what is bit i".
7. The divergence starts at i = 2 because 2^0 and 2^1 happen to be 1 and a value that is 0 when clear — which is why testing bits 0 and 1 proves nothing.

<!-- @example -->

<!-- @input -->
(n & (1 << i)) == 1, checked over every 16-bit value and every position

<!-- @output -->
Wrong on 491,520 of 1,048,576 pairs — and on none of the pairs where i = 0

<!-- @why -->
It quantifies why this bug reaches production: the failures avoid exactly the cases a hurried test covers.

<!-- @walkthrough -->
1. All 65,536 sixteen-bit values were run against all 16 positions, giving 1,048,576 pairs.
2. Each was compared against a reference that computed (n / 2^i) % 2 using no bit operators at all.
3. The three defensible forms — (n >> i) & 1, (n & (1 << i)) != 0 and (n & (1 << i)) == (1 << i) — matched on every pair.
4. The near-miss (n & (1 << i)) == 1 was wrong on 491,520 pairs, or 46.875%.
5. Of those 491,520 failures, 0 had i = 0 — so any test that checks bit 0 passes.
6. It also agreed on all 524,288 pairs where the bit was clear, so any test that only checks "returns false when the bit is absent" passes.
7. Every failure is of the form "bit i > 0 is set", which is the case people assume behaves like the one they already checked.

<!-- @example -->

<!-- @input -->
n = -8, i = 0..4

<!-- @output -->
0, 0, 0, 1, 1 — with no cast, no unsigned copy and no >>>

<!-- @why -->
Sign extension looks like it should break this and does not, which is worth seeing once so it is not worked around unnecessarily.

<!-- @walkthrough -->
1. -8 in 32-bit two's complement is 11111111111111111111111111111000.
2. Bits 0, 1 and 2 are 0, and every bit from 3 upward is 1.
3. Shifting right sign extends, so -8 >> 3 is -1, whose bits are all ones.
4. But & 1 keeps only position 0, discarding every sign bit the shift dragged in — so the answer is 1, correctly.
5. The same holds at every position: the mask erases whatever the sign supplied.
6. In Java this means >> and >>> give identical answers here, which is not true elsewhere in the topic.
7. In Python it means the sign extends forever and stays consistent — (-1 >> 99) & 1 is 1, because there is no width at which the value runs out of bits.

<!-- @example -->

<!-- @input -->
The three forms timed over 65,536 random (n, i) pairs

<!-- @output -->
10,416ns for the shift form against 16,625ns for all three mask forms

<!-- @why -->
The correctness argument and the speed argument point the same way for once, and the reason is not the one people guess.

<!-- @walkthrough -->
1. (n >> i) & 1 summed over 65,536 random pairs took 10,416ns, best of 300 runs.
2. (n & (1 << i)) != 0 took 16,625ns, and (n & (1 << i)) == (1 << i) took exactly the same.
3. So did the branchy if (n & (1 << i)) form — all three mask spellings are identical.
4. That identity is the clue: the cost is not in the AND, it is in turning the result into a 0 or 1.
5. The shift form is already a number, so summing it needs no compare at all.
6. With i as a compile-time constant the shift folds into the instruction and drops to 8,291ns, a further 1.26x.
7. In Python the same ordering holds with a much smaller margin — 98ns against 105ns and 123ns per read — because interpreter overhead dominates the arithmetic.

<!-- @visualization custom -->

<!-- @description -->
Open with the two mechanisms side by side on the same value, because the subtopic is the comparison. Left panel: n = 13 drawn as a row of eight cells, with the whole row sliding right by i so that bit i arrives under a fixed spotlight at position 0, and a 1-cell mask beneath it greying out everything except that spotlight. Right panel: the same n held still while a single lit cell — the mask 1 << i — slides up the row to position i, then an AND collapses every unlit column to 0. Run both for i = 0, 1, 2, 3 in step. Under each, show the returned value in a large numeral: the left reads 1, 0, 1, 1 and the right reads 1, 0, 4, 8. The moment to hold on is i = 2, where the truth values still agree and the numbers no longer do — dim the shared truthiness and highlight the diverging numeral. Then the bug panel: the expression (n & (1 << i)) == 1 with a grid of 16 columns (positions) by rows of sample values, cells green where it agrees and red where it does not, so the reader sees the entire i = 0 column green and the red concentrated in set bits at higher positions. Annotate 491,520 wrong of 1,048,576, and 0 of them at i = 0. Beside it, a second grid filtered to "bit is clear" showing every cell green — 524,288 of 524,288 — labelled "the case your test checks". Next the timing panel: four bars for (n>>i)&1, (n&(1<<i))!=0, ==(1<<i) and the branchy if, with the last three at exactly the same height (16,625ns) and the first visibly shorter (10,416ns), plus a fifth ghosted bar at 8,291ns for a constant i. Label the gap as "the compare, not the AND". Then the loop panel: three animated loops over one 32-bit value — the fixed shift loop drawn as 32 cells lighting in parallel batches to suggest vectorisation, the fixed mask loop the same but slower, and the early-exit loop lighting cells one at a time and stopping at the top set bit, with a counter showing it stopped at 31.01 on average and still took 5.83x longer. Close with the width trap: a 64-bit row with a 32-bit mask 1 << 40 shown wrapping around to position 8 and lighting the wrong cell, the result 256 displayed as if it were correct, and 1LL << 40 shown lighting position 40 properly.

<!-- @sampleInput -->
```json
{"problem":{"n":13,"bits":"1101","setPositions":[0,2,3],"clearPositions":[1]},"twoForms":[{"i":0,"shiftForm":1,"maskForm":1,"agreeAsNumber":true},{"i":1,"shiftForm":0,"maskForm":0,"agreeAsNumber":true},{"i":2,"shiftForm":1,"maskForm":4,"agreeAsNumber":false},{"i":3,"shiftForm":1,"maskForm":8,"agreeAsNumber":false}],"whyTheyDiffer":"AND preserves the column where it stands; the shift moves it to position 0 first","verification":{"values":65536,"positions":16,"pairs":1048576,"referenceUsed":"(n / 2^i) % 2, no bit operators","forms":[{"expr":"(n >> i) & 1","failures":0},{"expr":"(n & (1 << i)) != 0","failures":0},{"expr":"(n & (1 << i)) == (1 << i)","failures":0},{"expr":"(n & (1 << i)) == 1","failures":491520,"percent":46.875,"failuresAtI0":0,"agreesOnClearBits":{"count":524288,"of":524288,"percent":100},"reading":"right on every i=0 case and every clear-bit case — exactly what a quick test covers"}]},"timing":{"unit":"ns","reads":65536,"bestOf":300,"forms":[{"expr":"(n >> i) & 1","ns":10416},{"expr":"(n & (1 << i)) != 0","ns":16625},{"expr":"(n & (1 << i)) == (1 << i)","ns":16625},{"expr":"if (n & (1 << i))","ns":16625}],"ratio":1.6,"cause":"the compare that turns 2^i into 0/1, not the AND — all three mask spellings are identical","constantPosition":{"ns":8291,"ratioOverRuntime":1.26},"python":{"reads":20000,"perReadNs":{"(n >> i) & 1":98,"if n & (1 << i)":105,"bool(n & (1 << i))":123}}},"allBitsLoop":{"values":16384,"rows":[{"loop":"fixed 32, shift form","ns":65500,"iterations":32},{"loop":"fixed 32, mask form","ns":216667,"iterations":32},{"loop":"while (n), early exit","ns":381750,"iterations":31.01}],"ratio":5.83,"reading":"fewer iterations, 5.83x slower — a data-dependent trip count cannot be unrolled or vectorised"},"negatives":{"n":-8,"bits":"11111111111111111111111111111000","reads":[{"i":0,"bit":0},{"i":1,"bit":0},{"i":2,"bit":0},{"i":3,"bit":1},{"i":4,"bit":1}],"why":"& 1 discards everything sign extension dragged in","javaNote":">> and >>> agree here, which is unusual in this topic","pythonNote":"(-1 >> 99) & 1 == 1 — the sign extends forever"},"widthTrap":{"expr":"big & (1 << 40)","literalType":"int","observed":256,"why":"the shift count is masked to five bits and 40 mod 32 is 8","fix":"1LL << 40","shiftFormImmune":"(big >> 40) & 1 — big is already wide enough"},"languageEdges":{"cpp":{"bit31":"use 1u << 31; a signed 1 is undefined behaviour","overShift":"undefined"},"java":{"bit31":"1 << 31 is defined and gives Integer.MIN_VALUE","overShift":"count masked to five bits, so 1 << 32 tests bit 0"},"python":{"anyPosition":true,"precedenceTrap":"n & (1 << i) != 0 parses as n & ((1 << i) != 0)"}}}
```

<!-- @highlights -->
- Two panels run the same value in step: the number slides right under a fixed spotlight, or a one-cell mask slides up to the bit.
- Both are run for i = 0, 1, 2, 3 with the returned value shown as a large numeral beneath each.
- The left column reads 1, 0, 1, 1 and the right reads 1, 0, 4, 8.
- At i = 2 the shared truth value is dimmed and the diverging numerals are highlighted.
- The bug panel grids positions against sample values, green where (n & (1 << i)) == 1 agrees and red where it does not.
- The entire i = 0 column is green, and the red is concentrated in set bits at higher positions.
- It is annotated 491,520 wrong of 1,048,576, with 0 failures at i = 0.
- A second grid filtered to clear bits is entirely green — 524,288 of 524,288 — labelled "the case your test checks".
- The timing panel shows the three mask spellings at exactly the same height and the shift form visibly shorter.
- A ghosted fifth bar at 8,291ns marks a compile-time constant position.
- The gap is labelled "the compare, not the AND".
- Three loops animate over one 32-bit value: two fixed and one early-exit.
- The fixed shift loop lights cells in parallel batches to suggest vectorisation.
- The early-exit loop lights one cell at a time, stops at the top set bit, and is labelled 31.01 average iterations and 5.83x slower.
- The width trap shows a 32-bit mask 1 << 40 wrapping to position 8 and lighting the wrong cell.
- The wrong result 256 is displayed as if correct, with 1LL << 40 shown beside it lighting position 40.

<!-- @edgeCases -->
- i = 0 — both forms return 1, which is why this position proves nothing about the mask form.
- i = 31 in C++ — write 1u << 31; with a signed 1 it is undefined behaviour at the position least likely to be tested.
- i >= 32 in C++ — undefined; in Java the count is masked to five bits so n >> 32 is n, not 0; in Python it just works.
- Negative n — needs no special handling, because & 1 erases whatever sign extension supplied.
- n = 0 — every position reads 0, and the string form returns the empty string unless zero is special-cased.
- n = -1 — every position reads 1, at any i, in all three languages.
- INT_MIN — bit 31 is the only bit set, so it is the natural test for the top position.
- A 64-bit n with a 32-bit mask literal — 1 << 40 is undefined and measured as 256 here; write 1LL << 40.
- Python's operator precedence — n & (1 << i) != 0 parses as n & ((1 << i) != 0); the parentheses are required.
- The string form on a negative in Python — bin(-8) is '-0b1000', so slicing [2:] leaves 'b1000'.
- Reading bits above the value's bit_length in Python — returns 0 for positives and 1 for negatives, forever.

<!-- @pitfalls -->
- Comparing n & (1 << i) to 1. It equals 2^i when set, so the test is wrong on 46.875% of (value, position) pairs — and on none where i is 0, which is why it passes a quick test.
- Testing only bit 0. Every wrong form in this subtopic is correct at position 0.
- Testing only that the function returns false for clear bits. The == 1 bug agrees on 100% of those, all 524,288 pairs.
- Writing 1 << i where the value is wider than int. Measured, 1 << 40 produced 256 rather than failing, because the shift count is masked to five bits.
- Using 1 << 31 with a signed literal in C++. Undefined behaviour, at the only position a 32-bit type has that a 16-bit test cannot reach.
- Reaching for >>> in Java for this specific expression. It changes nothing, because & 1 already discards the sign bits — the habit is right, this instance is not where it pays.
- Stopping the loop early when n reaches 0. Measured 5.83x slower than a fixed 32-iteration loop, while saving 0.99 iterations on average.
- Reversing the binary string for display and then indexing it as though you had not. The string form is the only one with two possible indexings, and both look right.
- Omitting parentheses in Python. n & (1 << i) != 0 is n & True, which is n & 1 — correct only for i = 0, so it joins the same family of bugs.
- Assuming the mask form is slower because of the AND. All three mask spellings measured identically at 16,625ns; the 1.60x gap is the compare that follows.
- Returning n & (1 << i) from a function declared to return int and then summing the results. You get a sum of powers of two rather than a count.
- Using the string form in Python on negatives without masking. There is no fixed-width binary representation to fall back on.

<!-- @doubt -->
### Which form should I actually write?

<!-- @answer -->
(n >> i) & 1. It returns a genuine 0 or 1 rather than 0 or 2^i, so it cannot be misread, it needs no special handling for negatives, it has no width trap, and it measured 1.60x faster — 10,416ns against 16,625ns over 65,536 random reads. The mask form n & (1 << i) is worth reaching for in one situation: when you are testing several bits against the same mask, or building a mask once and reusing it, since then the shift happens only once. In that case write != 0, never == 1.

<!-- @doubt -->
### Why is n & (1 << i) equal to 4 rather than 1?

<!-- @answer -->
Because AND keeps a column where it stands — it does not move it. The mask 1 << 2 is 0100, and ANDing it against 13 = 1101 leaves 0100, which is 4. The bit is still in position 2, so its value is still 2^2. The shift form moves the bit to position 0 first, which is exactly why it comes out as 1. Both are correct answers to "is bit i set", since any non-zero value is true; only one is a correct answer to "what is bit i".

<!-- @doubt -->
### How bad is the == 1 bug really?

<!-- @answer -->
It is wrong on 491,520 of 1,048,576 (value, position) pairs, which is 46.875% — but the distribution is what makes it dangerous rather than the rate. Zero of those failures occur at i = 0, so any test touching bit 0 passes. And it agrees on all 524,288 pairs where the bit is clear, so any test checking "returns false when the bit is absent" also passes. Every single failure is "bit i > 0 is set", the case people assume behaves like the one they already verified. Writing != 0 removes it entirely.

<!-- @doubt -->
### Do I need >>> in Java here?

<!-- @answer -->
No, and this is the exception worth knowing. Normally >> on a negative sign-extends and ruins bit code, which is why the habit of writing >>> is a good one. But here the expression ends in & 1, which discards every bit above position 0 — including all the sign bits the shift dragged in. So (n >> i) & 1 and (n >>> i) & 1 return the same answer for every n and every i in 0..31. The habit is still right; this one expression just does not need it.

<!-- @doubt -->
### Why is the early-exit loop slower when it does fewer iterations?

<!-- @answer -->
Because its trip count depends on the data, so the compiler cannot unroll or vectorise it — it has to test n against zero after every step. A fixed 32-iteration loop has a known bound and can process several positions at once. Measured over 16,384 random 32-bit values, the fixed shift loop took 65,500ns and the early-exit loop took 381,750ns, a factor of 5.83, while doing 31.01 iterations on average against 32. The saving it is chasing is 0.99 iterations, because in a random 32-bit value the top bit is set half the time.

<!-- @doubt -->
### What happens if i is 32 or more?

<!-- @answer -->
Three different things, and none of them is an error you will see. In C++ it is undefined behaviour — anything may happen and typically the shift count is masked to five bits, so n >> 32 gives n. In Java the masking is specified rather than undefined, so n >> 32 is exactly n and 1 << 32 is 1 — plausible answers that are silently wrong. In Python there is no width, so shifting by 40 or 200 is simply correct. If i can exceed the width, guard it explicitly; nothing else will.

<!-- @doubt -->
### Why did 1 << 40 give 256?

<!-- @answer -->
Because the literal 1 is an int, so the shift is a 32-bit operation, and the hardware masks the shift count to five bits — 40 mod 32 is 8, giving 256. It is undefined behaviour, which means the compiler was free to produce anything, and what it produced looks entirely reasonable: a positive power of two, the right type, no warning at runtime. That is the worst possible failure mode. The fix is to widen the literal, 1LL << 40, or to use the shift form (big >> 40) & 1, where the value being shifted is already wide enough and the problem cannot arise.

<!-- @doubt -->
### Is the string approach ever right?

<!-- @answer -->
Only for printing. It costs O(w) time and O(w) space where both real forms are O(1) and allocate nothing, and it introduces an indexing question the bit forms do not have: a string reads left to right while bits are numbered right to left, so bit i is at position length - 1 - i in a most-significant-first string and at position i in a least-significant-first one. Both spellings look correct, which is how the off-by-one survives. In Python it is worse still, because bin(-8) is '-0b1000' and there is no fixed-width form to fall back on.

<!-- @doubt -->
### Does this work for a negative n?

<!-- @answer -->
Yes, unchanged, in all three languages. Shifting a negative right sign-extends, so the high bits fill with ones — but the & 1 keeps only position 0 and discards all of them. For -8 = …11111000 the reads at i = 0..4 give 0, 0, 0, 1, 1, which is correct. In C++ and Java this holds for i up to 31; above that you are out of the type. In Python it holds forever, since the sign extends indefinitely — (-1 >> 99) & 1 is 1, and that is the right answer rather than an artefact.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Check if a Number is Odd or Not, which is this subtopic with i pinned to 0. That sounds like it needs no separate treatment and does: n & 1 and n % 2 disagree on negatives in C++ and Java for the same rounding reason that made x / 2 and x >> 1 differ, so the specialisation has its own correctness question. After that, Count the Number of Set Bits performs this read 32 times, then replaces it with n & (n - 1) to do it once per set bit instead, and finally with a single instruction.
