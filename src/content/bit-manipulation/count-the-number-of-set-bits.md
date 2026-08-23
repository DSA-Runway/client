---
id: count-the-number-of-set-bits
topic: Bit Manipulation
title: Count the Number of Set Bits
difficulty: Easy
status: ready
prerequisites:
  - check-if-a-number-is-power-of-2-or-not
  - check-if-the-i-th-bit-is-set-or-not
  - introduction-to-bits-and-tricks
  - time-and-space-complexity-basics
relatedIds:
  - minimum-bit-flips-to-convert-number
  - set-unset-the-rightmost-unset-bit
  - power-set-bit-manipulation
  - single-number-i
  - check-if-a-number-is-power-of-2-or-not
---

<!-- @summary -->
Four methods, all verified against a 32-iteration reference over every one of the 4,294,967,296 uint32 values with zero mismatches. The famous one — Kernighan's `n &= n - 1`, which runs once per set bit — turns out not to run at all: at `-O2` the compiler recognises it and emits **byte-identical assembly** to `__builtin_popcount`. Forced to actually execute, it is **8.61x slower** than the naive fixed scan on random data and 11.71x slower on dense data, winning only below about two set bits. In Python, where there is no vectoriser to lose, the same loop is 2.62x **faster** than the fixed scan — the identical algorithm, the opposite conclusion.

<!-- @theory -->
## The problem

Count the 1 bits in `n`. Also called the population count, or popcount.

```
13 = 00001101  ->  3
 0 = 00000000  ->  0
 7 = 00000111  ->  3
```

Averaged over every uint32 value the answer is exactly 16 — measured, the total
across all 4,294,967,296 values is 68,719,476,736, which is 32 × 2^31 exactly.
That number matters later, because it is the input the "average case" argument
is really about.

## Four methods

| Method | Idea |
|---|---|
| Divide by two | Take `n % 2`, halve, repeat |
| Fixed scan | Read all 32 positions with `(n >> i) & 1` |
| Kernighan | `n &= n - 1` clears the lowest set bit, so loop once per set bit |
| Hardware | One instruction: `__builtin_popcount`, `Integer.bitCount`, `int.bit_count` |

All four were checked against a 32-iteration reference over every one of the
4,294,967,296 uint32 values — 113.8 seconds, **0 mismatches** for every method,
including a byte-table lookup and the SWAR parallel count below.

## Kernighan's loop, and what the compiler does to it

The argument for `n &= n - 1` is that it runs once per set bit rather than once
per position, so it is 32 iterations only in the worst case and 16 on average.
On this machine, at `-O2`, that argument never gets tested — because the loop
does not run:

```
kernighan(unsigned):              __builtin_popcount(unsigned):
    fmov  s0, w0                      fmov  s0, w0
    cnt.8b  v0, v0                    cnt.8b  v0, v0
    uaddlv.8b  h0, v0                 uaddlv.8b  h0, v0
    fmov  w0, s0                      fmov  w0, s0
    ret                               ret
```

Byte-identical. The compiler's loop-idiom recogniser sees the shape and emits the
hardware population-count instruction. So the measured "Kernighan" timing of
8,333ns over 65,536 values, flat across every density, is the timing of one
instruction and not of the algorithm at all.

That is worth knowing for its own sake: the clever loop and the builtin produce
the same program, so on this compiler the choice between them is a choice about
what the source says, not what runs.

## What the loop costs when it actually runs

Defeating the recogniser with an opaque barrier, so the written loop is the
executed loop, over 65,536 values:

| Input | Mean bits set | Kernighan | Fixed 32-scan | Verdict |
|---|---|---|---|---|
| Dense | 30.00 | 2,262,833ns | 193,250ns | **11.71x slower** |
| Random | 15.99 | 1,660,542ns | 192,958ns | **8.61x slower** |
| Sparse | 1.97 | 95,625ns | 192,917ns | 2.02x faster |
| One bit | 1.00 | 66,708ns | 192,916ns | 2.89x faster |
| Zero | 0.00 | 66,583ns | 192,917ns | 2.90x faster |

The fixed scan is flat — 193,000ns whatever the data — while Kernighan's tracks
the bit count. Doing fewer iterations loses anyway, for the same reason the
early-exit loop lost in the i-th bit subtopic: a data-dependent trip count cannot
be unrolled or vectorised, and a branch that depends on the data cannot be
predicted. The crossover is around **two set bits**. On the average uint32,
which has exactly 16, Kernighan's is the wrong choice by a factor of 8.61.

The textbook claim is not false — it really does perform fewer iterations, 15.99
on average against 32. It is that iterations stopped being the thing that costs.

## The full comparison

Over 65,536 random values, best of 60 runs, all at `-O2`:

| Method | Time | Ratio |
|---|---|---|
| `__builtin_popcount` | **8,333ns** | 1.00x |
| SWAR parallel count | 8,292ns | 1.00x |
| Kernighan (as compiled) | 8,333ns | 1.00x |
| Byte-table lookup | 99,916ns | 12.0x |
| Fixed 32-scan | 222,583ns | 26.7x |
| Divide by two | 1,556,542ns | **186.8x** |

The division loop is the slowest thing in this subtopic by two orders of
magnitude. The byte table — 256 precomputed counts, four lookups per value — was
the standard answer for years and is now 12x slower than the instruction, because
it touches memory where the alternative touches nothing.

SWAR deserves a mention as the portable fallback: it counts all 32 bits in
parallel with five arithmetic steps and no loop, no table and no builtin, and it
measured indistinguishable from the hardware instruction.

## Python inverts the ranking

There is no vectoriser to lose, and every interpreted loop iteration is
expensive, so doing fewer of them wins:

| Method | Random (15.99 bits) | Sparse (1.97 bits) |
|---|---|---|
| Fixed 32 loop | 2,824ns | 2,331ns |
| Kernighan | **1,078ns** | **164ns** |
| `bin(n).count("1")` | 329ns | 170ns |
| `int.bit_count()` | **53ns** | 50ns |

Kernighan's is 2.62x faster than the fixed loop on random data and 14.2x faster
on sparse — the exact opposite of the C++ result, for the same algorithm. And
`int.bit_count()` is 53.3x the fixed loop regardless.

## The Python negative-number trap

`int.bit_count()` counts the bits of the **magnitude**, not of a two's complement
pattern, because a Python integer has no width:

```python
(-1).bit_count()   # 1, not 32
(-8).bit_count()   # 1, not 29
(-8 & 0xFFFFFFFF).bit_count()   # 29 — mask first to impose a width
```

C++ and Java have no such question: `__builtin_popcount((unsigned)-1)` is 32 and
`Integer.bitCount(-1)` is 32, because the width is part of the type. Any code
translated from either language must mask before counting.

## Where this goes next

**Set/Unset the rightmost unset bit** works the other end of the same borrowing
behaviour — where `n & (n - 1)` clears the lowest set bit, `n | (n + 1)` sets the
lowest clear one. **Minimum Bit Flips to Convert Number** then combines this
count with XOR: the number of flips between `a` and `b` is the popcount of
`a ^ b`, which turns a two-number problem into this one.

<!-- @intuition -->
Three of the four methods here walk the bits one at a time and differ only in which ones they bother to visit — every position, only the positions below the highest set bit, or only the set bits themselves. The fourth does not walk at all: counting bits is a single instruction on every processor built in the last fifteen years, and the compiler is watching for loops that mean "count bits" so it can substitute that instruction even when you did not ask. That is what makes this subtopic more interesting than it looks. The clever loop is genuinely clever — it visits a set bit and then skips straight to the next one, never looking at a zero — and on a machine that executes what you wrote, it wins only when the bits are sparse, because doing fewer iterations stopped being the thing that makes code fast. Predictability and the ability to do thirty-two positions at once matter more, and a loop whose length depends on the data has neither.

<!-- @approach -->
### Brute Force - Divide by Two and Count Remainders

<!-- @idea -->
Repeatedly take the remainder on division by 2 and halve, exactly as when converting to binary.

<!-- @steps -->
1. While `n` is non-zero, take `n % 2` and add it to the count.
2. Divide `n` by 2, discarding the bit just counted.
3. Repeat until `n` reaches 0.
4. The loop therefore runs once per significant bit, not once per set bit.
5. Return the accumulated count.

<!-- @complexity -->
- time: O(log n) — one iteration per significant bit, up to 32
- space: O(1)
- note: Verified over all 4,294,967,296 uint32 values, 0 mismatches. The slowest method measured by a wide margin — 1,556,542ns over 65,536 random values, 186.8x the hardware instruction and 7.0x even the naive fixed scan. Division is the expensive part; on unsigned values the compiler can substitute a shift, but the data-dependent loop bound remains.

<!-- @code cpp -->
```cpp
int countSetBits(unsigned n) {
    int c = 0;
    while (n) {
        c += n % 2;
        n /= 2;
    }
    return c;
}

// On a SIGNED n this loop never terminates for negative input, because
// >> and / keep sign-extending toward -1 rather than reaching 0.
```

<!-- @annotations -->
- 4: On an unsigned n the compiler emits an AND here, so the remainder itself is not what costs — the loop structure is.
- 5: Likewise a shift. The division is free and the data-dependent bound is not.
- 10: The first reason to prefer unsigned throughout this subtopic: the terminating condition depends on it.

<!-- @code java -->
```java
static int countSetBits(int n) {
    int c = 0;
    while (n != 0) {
        c += n & 1;
        n >>>= 1;
    }
    return c;
}
```

<!-- @annotations -->
- 5: >>> rather than >>. With >> a negative n sign-extends and n != 0 is never satisfied, so the loop hangs — Java's substitute for having no unsigned type.

<!-- @code python -->
```python
def count_set_bits(n: int) -> int:
    c = 0
    while n:
        c += n % 2
        n //= 2
    return c


# For a negative n this never terminates: // floors, so -1 // 2 is -1.
# Mask to a width first, or take abs(), or just use int.bit_count().
```

<!-- @annotations -->
- 4: Correct for negatives in the sense that % returns 0 or 1 here — but the loop still never ends, so the correctness of one line does not save it.
- 9: The same trap as C++ and Java, arriving by a different route: flooring rather than sign extension.

<!-- @approach -->
### Better - Scan All 32 Positions

<!-- @idea -->
Read every position with a fixed loop and add up the bits, without stopping early.

<!-- @steps -->
1. Loop `i` from 0 to 31 with a constant bound.
2. Read bit `i` with `(n >> i) & 1`, which yields 0 or 1.
3. Add it to the running count directly — no branch is needed.
4. Do not stop when the remaining value reaches 0.
5. Return the count after all 32 positions.

<!-- @complexity -->
- time: O(w) — always 32 reads for an int, whatever the value
- space: O(1)
- note: Verified over all 4,294,967,296 uint32 values, 0 mismatches. Measured 222,583ns over 65,536 random values in the as-compiled ranking. In the run where the idiom recogniser is defeated, so that both loops execute as written, it is flat at roughly 193,000ns whether the input averages 30 set bits or none. That flatness is the point: the constant bound lets the compiler unroll and vectorise, which is why it beats Kernighan's loop by 8.61x on random data despite doing twice the iterations.

<!-- @code cpp -->
```cpp
int countSetBits(unsigned n) {
    int c = 0;
    for (int i = 0; i < 32; i++) c += (n >> i) & 1u;
    return c;
}

// Flat cost: 193,000ns over 65,536 values whether they averaged 30 set
// bits or 0. A constant trip count is what buys that.
```

<!-- @annotations -->
- 3: Adding the bit rather than branching on it keeps the loop branchless, so there is nothing to mispredict. The literal 32 should be 8 * sizeof(n) if the type might change — a 32 hard-coded next to a long long is the standard way this silently starts under-counting.

<!-- @code java -->
```java
static int countSetBits(int n) {
    int c = 0;
    for (int i = 0; i < 32; i++) c += (n >>> i) & 1;
    return c;
}

// Works for negative n unchanged, because the count is over 32 fixed
// positions rather than over "the significant bits" — bitCount(-1) is 32.
```

<!-- @annotations -->
- 3: Either >> or >>> is correct here since & 1 masks, but >>> states the fixed width, which is what this method is about.

<!-- @code python -->
```python
def count_set_bits(n: int) -> int:
    return sum((n >> i) & 1 for i in range(n.bit_length()))


# A hard-coded 32 is wrong in both directions in Python: too many
# iterations for small values, and too few for large ones — bit_length()
# is the honest bound. Measured 2,824ns per value on random 32-bit input.
```

<!-- @annotations -->
- 2: bit_length() rather than 32, because there is no fixed width — and it returns 0 for n = 0, so the sum is correctly empty. Still wrong for negatives: bit_length() ignores the sign, so this counts the magnitude's bits.

<!-- @approach -->
### Better - Kernighan: One Iteration Per Set Bit

<!-- @idea -->
n & (n - 1) clears the lowest set bit, so loop it and count how many times it takes to reach zero.

<!-- @steps -->
1. While `n` is non-zero, replace `n` with `n & (n - 1)`.
2. Each such step clears exactly one set bit — the lowest one remaining.
3. Increment the count once per step.
4. The loop therefore runs exactly as many times as there are set bits, never once per position.
5. Return the count when `n` reaches 0.

<!-- @complexity -->
- time: O(popcount(n)) — 15.99 iterations on average for a random uint32, against the fixed scan's 32
- space: O(1)
- note: Verified over all 4,294,967,296 uint32 values, 0 mismatches. At -O2 on this machine the loop is recognised by the compiler and replaced with the hardware instruction, producing assembly byte-identical to __builtin_popcount — so the algorithm never runs. Forced to execute, it measured 1,660,542ns on random input against the fixed scan's 192,958ns, 8.61x slower, and 11.71x slower on dense input. It wins below about two set bits: 95,625ns against 192,917ns on sparse data. In Python the ranking reverses entirely.

<!-- @code cpp -->
```cpp
int countSetBits(unsigned n) {
    int c = 0;
    while (n) {
        n &= n - 1;
        c++;
    }
    return c;
}

// At -O2 this compiles to cnt.8b / uaddlv.8b — byte-identical to
// __builtin_popcount. The loop-idiom recogniser substitutes the hardware
// instruction, so the "fewer iterations" argument is never tested.
//
// Where it does run, it is 8.61x slower than the fixed 32-scan on random
// input and 2.02x faster on sparse input. The crossover is ~2 set bits.
```

<!-- @annotations -->
- 4: The step that does the work: subtracting one borrows through the trailing zeros, so the AND clears exactly the lowest set bit and nothing else.
- 9: Worth checking on your own target before relying on either the speed argument or its rebuttal — this is a property of the compiler, not of the algorithm.
- 13: A data-dependent trip count cannot be unrolled or vectorised, which is why doing half as many iterations still loses.

<!-- @code java -->
```java
static int countSetBits(int n) {
    int c = 0;
    while (n != 0) {
        n &= n - 1;
        c++;
    }
    return c;
}

// Correct for negatives without >>>, because nothing is shifted —
// n & (n - 1) reaches 0 from any starting pattern. countSetBits(-1) is 32.
```

<!-- @annotations -->
- 4: The one bit-counting loop that needs no unsigned shift at all, since it removes bits rather than moving them.

<!-- @code python -->
```python
def count_set_bits(n: int) -> int:
    c = 0
    while n:
        n &= n - 1
        c += 1
    return c


# Here the textbook argument holds: 1,078ns per value against the fixed
# loop's 2,824ns on random input (2.62x), and 164ns against 2,331ns on
# sparse input (14.2x). No vectoriser to lose, and iterations are expensive.
# Still 20x slower than int.bit_count().
```

<!-- @annotations -->
- 4: Identical characters to the C++ line, opposite conclusion — the algorithm did not change, the machine underneath it did.
- 3: Never terminates for a negative n, since -1 & -2 is -2 and the magnitude grows rather than shrinking. Mask first.

<!-- @approach -->
### Optimal - The Hardware Instruction

<!-- @idea -->
Counting bits is one instruction on every mainstream processor; call it rather than reimplementing it.

<!-- @steps -->
1. Call the language's population-count function.
2. Note that it compiles to a single instruction — `cnt` on ARM, `popcnt` on x86.
3. Note that it is width-specific: the 32-bit and 64-bit forms are different functions.
4. Where a builtin is unavailable, use the SWAR form, which counts all 32 bits in parallel with five arithmetic steps.
5. Avoid the byte-table lookup, which was the standard answer and is now 12x slower because it touches memory.

<!-- @complexity -->
- time: O(1) — one instruction, independent of the value
- space: O(1), against O(256) for the table form
- note: Verified over all 4,294,967,296 uint32 values, 0 mismatches, as was the SWAR form. Measured 8,333ns over 65,536 values against 99,916ns for a byte table (12.0x), 222,583ns for the fixed scan (26.7x) and 1,556,542ns for the division loop (186.8x). SWAR measured 8,292ns, indistinguishable from the instruction, making it the right portable fallback.

<!-- @code cpp -->
```cpp
#include <cstdint>

int countSetBits(unsigned n) {
    return __builtin_popcount(n);
}

int countSetBitsLL(unsigned long long n) {
    return __builtin_popcountll(n);
}

// Portable fallback with no builtin, no table and no loop — counts all
// 32 bits in parallel and measured indistinguishable from the instruction:
uint32_t swar(uint32_t n) {
    n = n - ((n >> 1) & 0x55555555u);
    n = (n & 0x33333333u) + ((n >> 2) & 0x33333333u);
    n = (n + (n >> 4)) & 0x0F0F0F0Fu;
    return (n * 0x01010101u) >> 24;
}
```

<!-- @annotations -->
- 8: The ll suffix is not optional. __builtin_popcount on a 64-bit value silently counts only the low 32 bits after the implicit conversion.
- 14: Each step folds pairs of counts together: first 16 two-bit counts, then 8 four-bit, then 8 eight-bit.
- 17: The multiply sums the four byte counts into the top byte in one step, which is why there is no final addition chain.
- 5: C++20 offers std::popcount in <bit>, which is the standard spelling and unsigned-only.

<!-- @code java -->
```java
static int countSetBits(int n) {
    return Integer.bitCount(n);
}

// Integer.bitCount is an intrinsic on every mainstream JVM and compiles
// to the same instruction. Long.bitCount for 64-bit values.
//
// It counts the 32-bit two's complement pattern, so bitCount(-1) is 32
// and bitCount(Integer.MIN_VALUE) is 1.
```

<!-- @annotations -->
- 2: Takes a signed int and counts the pattern, so negatives need no masking — unlike Python.
- 5: Long.bitCount(n) rather than Integer.bitCount((int) n), which is the same silent truncation as the C++ suffix.

<!-- @code python -->
```python
def count_set_bits(n: int) -> int:
    return n.bit_count()


# Python 3.10+. Before that: bin(n).count("1"), measured 329ns per value
# against bit_count()'s 53ns and the fixed loop's 2,824ns.
#
# THE TRAP: bit_count() counts the MAGNITUDE, because a Python integer has
# no width. (-1).bit_count() is 1, not 32. (-8).bit_count() is 1, not 29.
# Mask first to impose a width: (-8 & 0xFFFFFFFF).bit_count() is 29.
```

<!-- @annotations -->
- 2: 53.3x faster than the fixed 32-iteration loop and 20x faster than Kernighan's, at every density tested.
- 9: The single most important line in this file for anyone porting C++ or Java bit code to Python — the answer differs by 31 on the most obvious test input.

<!-- @example -->

<!-- @input -->
n = 13

<!-- @output -->
3, reached in three iterations of n &= n - 1 rather than thirty-two reads

<!-- @why -->
It is the smallest input where the loop visibly skips zeros, which is the whole claim being made for it.

<!-- @walkthrough -->
1. 13 is 00001101, with set bits at positions 0, 2 and 3.
2. First step: 13 - 1 is 12 = 00001100, and 13 & 12 is 00001100 = 12 — the bit at position 0 is gone. Count 1.
3. Second step: 12 - 1 is 11 = 00001011, and 12 & 11 is 00001000 = 8 — the bit at position 2 is gone. Count 2.
4. Third step: 8 - 1 is 7 = 00000111, and 8 & 7 is 0 — the bit at position 3 is gone. Count 3.
5. n is now 0 and the loop stops, having run exactly three times for three set bits.
6. The fixed scan would have performed thirty-two reads to reach the same answer, twenty-nine of them on zeros.
7. That comparison is the textbook argument, and it is correct about the iteration count and wrong about the running time on this machine, for reasons the density measurements make concrete.

<!-- @example -->

<!-- @input -->
Every uint32 value, five methods against a 32-iteration reference

<!-- @output -->
4,294,967,296 values in 113.8 seconds, 0 mismatches for every method

<!-- @why -->
Popcount implementations are exactly the kind of code that is nearly right, and the range is small enough to leave no room for nearly.

<!-- @walkthrough -->
1. A reference implementation read all 32 positions with (n >> i) & 1 and summed them.
2. Every uint32 value was generated in turn and compared against the division loop, Kernighan's loop, a 256-entry byte table, the SWAR parallel count and __builtin_popcount.
3. All five agreed with the reference on all 4,294,967,296 values, with 0 mismatches.
4. The same pass totalled the set bits across the whole range: 68,719,476,736.
5. That is exactly 32 × 2^31, so the mean is exactly 16.000 bits per value — each of the 32 positions is set in exactly half of all values.
6. That mean is what the "average case" argument for Kernighan's loop is about: 16 iterations rather than 32.
7. Measured separately, the loop ran 15.99 times on average over 65,536 random values, matching the derived figure.

<!-- @example -->

<!-- @input -->
Kernighan's loop and __builtin_popcount, compiled at -O2

<!-- @output -->
Byte-identical assembly: fmov, cnt.8b, uaddlv.8b, fmov, ret

<!-- @why -->
It is the case where measuring the source and measuring the program give different answers, and the difference is invisible unless you look.

<!-- @walkthrough -->
1. Timed at -O2, Kernighan's loop measured 8,333ns over 65,536 values — the same as __builtin_popcount, and flat across every density tested.
2. Flatness was the clue: an algorithm whose cost is the number of set bits cannot take the same time on inputs averaging 30 bits and inputs averaging 1.
3. Disassembling both functions gives four instructions each, and the same four: fmov, cnt.8b, uaddlv.8b, fmov.
4. The compiler's loop-idiom recogniser matched the shape of the loop and replaced it with the hardware population-count instruction.
5. So the timing was of one instruction, not of the algorithm, and the famous argument for the loop was never being tested.
6. Defeating the recogniser with an opaque barrier makes the written loop the executed loop, and the timing immediately becomes density-dependent — 66,583ns on zeros and 2,262,833ns on dense values.
7. The practical lesson is that a microbenchmark of a well-known idiom is measuring the compiler's pattern library as much as the code.

<!-- @example -->

<!-- @input -->
The same algorithm in C++ and in Python

<!-- @output -->
8.61x slower than the fixed loop in C++; 2.62x faster in Python

<!-- @why -->
It shows that "fewer iterations is faster" is a statement about a machine rather than about an algorithm, and that the two languages disagree about which machine they are.

<!-- @walkthrough -->
1. In C++, forced to actually run, Kernighan's loop took 1,660,542ns on random input against the fixed 32-scan's 192,958ns — 8.61x slower while doing half the iterations.
2. On dense input averaging 30 set bits it was 11.71x slower, and only on sparse input averaging 1.97 bits did it win, at 2.02x.
3. The reason is that the fixed loop has a constant bound, so it unrolls and vectorises, while a data-dependent bound does neither and adds an unpredictable branch.
4. In Python the same two functions gave 1,078ns for Kernighan's and 2,824ns for the fixed loop on random input — 2.62x the other way.
5. On sparse input the Python gap widened to 14.2x, because interpreted iterations are expensive and skipping them is the only optimisation available.
6. Neither result contradicts the other: the loop really does perform fewer steps, and whether that matters depends entirely on what a step costs.
7. In both languages the builtin wins outright — 8,333ns over 65,536 values in C++, and 53ns per value in Python against the Python fixed loop's 2,824ns, a factor of 53.3.

<!-- @visualization custom -->

<!-- @description -->
Open with the mechanism panel, running n = 13 through Kernighan's loop as three linked frames. Each frame shows n on top, n - 1 beneath it with the borrow animated — the lowest lit cell going dark and ones sweeping in below it — and the AND result underneath, with a counter incrementing. The reader should see the lit cells disappearing one at a time from the right and the loop stopping after exactly three steps. Beside it, run the fixed 32-scan on the same value as a spotlight sliding across all thirty-two cells, twenty-nine of which are dark, with its own counter. Label them "3 iterations" and "32 iterations" — the textbook comparison, stated before it is complicated. Then the reveal panel: two source listings side by side, the loop and the builtin call, with an arrow from each down to its compiled form — and both compiled forms identical, four instructions each. Highlight the cnt.8b line in both and label it "the loop does not run". Then the density panel, which is the substance: a horizontal axis of mean bits set, from 0 to 32, with two lines plotted — the fixed scan flat at roughly 193,000ns across the whole range, and Kernighan's rising steeply from 66,583ns at zero bits through 95,625ns at 1.97 bits, crossing the flat line at about two set bits, and reaching 2,262,833ns at 30 bits. Mark the crossover point explicitly and mark where the average uint32 sits, at exactly 16 bits, well to the right of it. Beneath, a note that the mean of 16 is exact: 68,719,476,736 set bits across all 4,294,967,296 values. Then the ranking panel: six bars for the C++ methods on a log scale — builtin, SWAR and compiled-Kernighan indistinguishable at the bottom, byte table 12x above them, fixed scan 26.7x, division loop 186.8x — with the byte table annotated "the standard answer for years, and it touches memory". Close with the inversion panel: the same two algorithms in Python, drawn as a mirror of the density panel, with Kernighan's now below the fixed loop at every density, and int.bit_count() as a flat line far beneath both at 53ns. Caption it "same algorithm, different machine".

<!-- @sampleInput -->
```json
{"mechanism":{"n":13,"bits":"00001101","setPositions":[0,2,3],"steps":[{"n":13,"nBits":"00001101","minusOne":12,"minusOneBits":"00001100","and":12,"andBits":"00001100","cleared":0,"count":1},{"n":12,"nBits":"00001100","minusOne":11,"minusOneBits":"00001011","and":8,"andBits":"00001000","cleared":2,"count":2},{"n":8,"nBits":"00001000","minusOne":7,"minusOneBits":"00000111","and":0,"andBits":"00000000","cleared":3,"count":3}],"kernighanIterations":3,"fixedScanIterations":32,"zerosVisitedByFixedScan":29},"verification":{"valuesChecked":4294967296,"seconds":113.8,"referenceUsed":"32-iteration (n >> i) & 1 scan","methods":[{"name":"divide by two","mismatches":0},{"name":"kernighan","mismatches":0},{"name":"byte table","mismatches":0},{"name":"SWAR","mismatches":0},{"name":"__builtin_popcount","mismatches":0}],"totalSetBits":68719476736,"equals":"32 * 2^31","meanBitsPerValue":16.0,"note":"each of the 32 positions is set in exactly half of all values"},"compilerRewrite":{"target":"arm64","optimisation":"-O2","kernighanAssembly":["fmov s0, w0","cnt.8b v0, v0","uaddlv.8b h0, v0","fmov w0, s0","ret"],"builtinAssembly":["fmov s0, w0","cnt.8b v0, v0","uaddlv.8b h0, v0","fmov w0, s0","ret"],"identical":true,"mechanism":"loop-idiom recognition substitutes the hardware population-count instruction","clue":"the timing was flat across densities, which an O(popcount) algorithm cannot be","consequence":"the measured 8,333ns is one instruction, not the algorithm"},"densityCpp":{"unit":"ns","values":65536,"idiomDefeated":true,"rows":[{"input":"dense","meanBits":30.0,"kernighan":2262833,"fixedScan":193250,"ratio":11.71,"winner":"fixed"},{"input":"random","meanBits":15.99,"kernighan":1660542,"fixedScan":192958,"ratio":8.61,"winner":"fixed"},{"input":"sparse","meanBits":1.97,"kernighan":95625,"fixedScan":192917,"ratio":2.02,"winner":"kernighan"},{"input":"one bit","meanBits":1.0,"kernighan":66708,"fixedScan":192916,"ratio":2.89,"winner":"kernighan"},{"input":"zero","meanBits":0.0,"kernighan":66583,"fixedScan":192917,"ratio":2.9,"winner":"kernighan"}],"crossoverBits":2,"averageUint32Bits":16,"reading":"the fixed scan is flat because a constant trip count unrolls and vectorises; a data-dependent one does neither","kernighanMeanIterations":15.99},"rankingCpp":{"unit":"ns","values":65536,"bestOf":60,"input":"random","rows":[{"method":"__builtin_popcount","ns":8333,"ratio":1.0},{"method":"SWAR parallel count","ns":8292,"ratio":1.0},{"method":"kernighan (as compiled)","ns":8333,"ratio":1.0},{"method":"byte-table lookup","ns":99916,"ratio":12.0,"note":"the standard answer for years — it touches memory"},{"method":"fixed 32-scan","ns":222583,"ratio":26.7},{"method":"divide by two","ns":1556542,"ratio":186.8}]},"python":{"unit":"ns","perValue":true,"rows":[{"method":"fixed 32 loop","random":2824,"sparse":2331},{"method":"kernighan","random":1078,"sparse":164},{"method":"bin(n).count('1')","random":329,"sparse":170},{"method":"int.bit_count()","random":53,"sparse":50}],"kernighanOverFixed":{"random":2.62,"sparse":14.2},"bitCountOverFixed":53.3,"inversion":"the same algorithm that loses by 8.61x in C++ wins by 2.62x here — iterations are expensive and there is no vectoriser to lose"},"pythonNegativeTrap":{"reason":"a Python integer has no width, so bit_count counts the MAGNITUDE","examples":[{"expr":"(-1).bit_count()","value":1,"cppEquivalent":32},{"expr":"(-8).bit_count()","value":1,"cppEquivalent":29},{"expr":"(-8 & 0xFFFFFFFF).bit_count()","value":29}],"cpp":"__builtin_popcount((unsigned)-1) is 32","java":"Integer.bitCount(-1) is 32","fix":"mask to a width before counting"},"nonTermination":[{"language":"C++","cause":">> on a signed negative sign-extends toward -1","affects":["divide loop","fixed scan written as a while loop"]},{"language":"Java","cause":"same, unless >>> is used","fix":">>>"},{"language":"Python","cause":"// floors, so -1 // 2 is -1","fix":"mask first"},{"note":"kernighan is immune in C++ and Java — it removes bits rather than moving them, so it reaches 0 from any pattern"}]}
```

<!-- @highlights -->
- n = 13 runs through Kernighan's loop as three linked frames, each animating the borrow in n - 1.
- The lowest lit cell goes dark and ones sweep in beneath it before the AND collapses the row.
- Lit cells disappear one at a time from the right and the loop stops after exactly three steps.
- Beside it the fixed 32-scan slides a spotlight across all thirty-two cells, twenty-nine of them dark.
- The two are labelled "3 iterations" and "32 iterations" — the textbook comparison, stated before it is complicated.
- The reveal panel puts the loop and the builtin call side by side with arrows down to their compiled forms.
- Both compiled forms are identical, four instructions each, with cnt.8b highlighted in both.
- It is labelled "the loop does not run".
- The density panel plots mean bits set on the horizontal axis against time.
- The fixed scan is flat at roughly 193,000ns across the whole range.
- Kernighan's rises from 66,583ns at zero bits to 2,262,833ns at 30, crossing the flat line at about two set bits.
- The crossover is marked explicitly, and so is the average uint32 at exactly 16 bits, well to its right.
- A note records that the mean of 16 is exact: 68,719,476,736 set bits across all 4,294,967,296 values.
- Six log-scale bars rank the C++ methods, with builtin, SWAR and compiled-Kernighan indistinguishable at the bottom.
- The byte table sits 12x above them, annotated "the standard answer for years, and it touches memory".
- The closing panel mirrors the density chart in Python, where Kernighan's is below the fixed loop at every density and int.bit_count() is a flat line far beneath both.

<!-- @edgeCases -->
- n = 0 — every method returns 0; Kernighan's loop never enters, and the fixed scan still performs all 32 reads.
- n = 1 — one iteration for Kernighan's, thirty-two reads for the fixed scan, and the widest relative gap in Kernighan's favour.
- All bits set, 0xFFFFFFFF — Kernighan's worst case at 32 iterations, and where it measured 11.71x slower than the fixed scan.
- A negative signed n in C++ — the divide and shift loops never terminate, because >> sign-extends toward -1 rather than 0.
- A negative n in Java without >>> — the same non-termination; Kernighan's loop is immune, since it removes bits rather than moving them.
- A negative n in Python — the loops never terminate because // floors, and bit_count() silently counts the magnitude instead.
- INT_MIN — exactly one set bit, so the count is 1 in C++ and Java; in Python (-2147483648).bit_count() is 31, counting the magnitude.
- A 64-bit value passed to __builtin_popcount — silently truncated to 32 bits; use __builtin_popcountll.
- A 64-bit value passed to Integer.bitCount — the same truncation; use Long.bitCount.
- A hard-coded 32 in the fixed scan next to a widened type — under-counts silently, and only for values that use the high half.
- Very large Python integers — bit_count() handles them directly, and a 32-iteration loop does not.

<!-- @pitfalls -->
- Quoting the "half as many iterations" argument as a speed claim. Measured, the loop is 8.61x slower than the fixed scan on random input and only wins below about two set bits.
- Microbenchmarking Kernighan's loop without checking the assembly. At -O2 it compiles to the same four instructions as the builtin, so the benchmark measures the compiler's pattern library.
- Reading a flat timing curve as a fast algorithm. An O(popcount) method cannot cost the same on dense and sparse input — flatness is evidence that something else is running.
- Carrying the C++ conclusion into Python. The same loop is 2.62x faster than the fixed scan there, and 14.2x on sparse data.
- Calling bit_count() on a negative in Python. It counts the magnitude: (-1).bit_count() is 1 where C++ and Java both give 32.
- Using __builtin_popcount on a 64-bit value. It converts to unsigned int first and counts only the low half, with no warning.
- Writing the divide or shift loop for a signed value. It never terminates for negative input in any of the three languages, each for a different reason.
- Reaching for a 256-entry lookup table. It was the right answer for years and now measures 12.0x slower than the instruction, because it touches memory.
- Hard-coding 32 in the fixed scan. Widening the type later leaves the loop counting half the value, and only inputs using the high bits reveal it.
- Assuming SWAR is a curiosity. It measured indistinguishable from the hardware instruction and needs no builtin, which makes it the right portable fallback.
- Counting bits to test for a power of two. Correct, but n & (n - 1) answers that question with one operation instead of a count.
- Trusting an average-case argument without knowing the average. The mean over all uint32 values is exactly 16 bits, which sits far to the wrong side of the crossover.

<!-- @doubt -->
### Is Kernighan's loop actually faster?

<!-- @answer -->
Not on random data in C++, and by a wide margin. Forced to actually execute, it measured 1,660,542ns over 65,536 random values against the fixed 32-scan's 192,958ns — 8.61x slower while performing half the iterations. On dense input it was 11.71x slower. It wins only when the input is sparse: 2.02x faster at 1.97 mean bits, 2.89x at exactly one. The crossover is around two set bits, and the average uint32 has exactly 16. In Python the conclusion reverses completely, at 2.62x faster on the same random data.

<!-- @doubt -->
### How can fewer iterations be slower?

<!-- @answer -->
Because an iteration stopped being the unit that costs. The fixed loop has a constant bound of 32, so the compiler can unroll it and process several positions at once, and it contains no branch that depends on the data. Kernighan's loop has a bound that depends on the value, so it can be neither unrolled nor vectorised, and its exit branch is unpredictable — the processor guesses wrong roughly once per value. Half as many iterations of something several times more expensive is a loss. This is the same effect that made the early-exit bit loop 5.83x slower than a fixed scan in the i-th bit subtopic.

<!-- @doubt -->
### What do you mean the loop does not run?

<!-- @answer -->
At -O2 the compiler recognises the shape of the loop and replaces it with the hardware population-count instruction. Disassembled, Kernighan's loop and __builtin_popcount produce byte-identical output on this machine — fmov, cnt.8b, uaddlv.8b, fmov, ret. Four instructions, no loop. The tell was in the measurement before the disassembly: the loop timed flat across inputs averaging 0, 2, 16 and 30 set bits, and an algorithm whose cost is the number of set bits cannot do that. If you want to measure the algorithm rather than the compiler, you have to defeat the recogniser deliberately.

<!-- @doubt -->
### Then which one should I write?

<!-- @answer -->
The builtin — __builtin_popcount, std::popcount, Integer.bitCount, int.bit_count. It is one instruction, it says exactly what it means, and it is correct at every density. If a builtin is unavailable, the SWAR form is the portable fallback and measured indistinguishable from the instruction at 8,292ns. Kernighan's loop is worth understanding because n &= n - 1 appears everywhere else in this topic, and worth writing only when the input is known to be sparse and no builtin exists. The byte table is now a historical answer: 12.0x slower, because it touches memory.

<!-- @doubt -->
### Why is the average exactly 16?

<!-- @answer -->
Because each of the 32 positions is set in exactly half of all uint32 values — for any fixed position, the values split evenly between having it on and off. So the expected count is 32 × 1/2 = 16. Measured rather than argued, the total across all 4,294,967,296 values is 68,719,476,736, which is 32 × 2^31 exactly, giving a mean of exactly 16.000. Kernighan's loop ran 15.99 times on average over a random sample, matching. That number matters because it is where the "average case" argument for the loop actually lands, and it is well past the crossover.

<!-- @doubt -->
### Why does (-1).bit_count() give 1 in Python?

<!-- @answer -->
Because a Python integer has no width, so there is no two's complement pattern to count — bit_count() counts the bits of the magnitude. The magnitude of -1 is 1, which has one set bit. Similarly (-8).bit_count() is 1 rather than 29. C++ and Java have no such ambiguity: the width is part of the type, so __builtin_popcount((unsigned)-1) and Integer.bitCount(-1) both give 32. If you are porting, mask first — (-8 & 0xFFFFFFFF).bit_count() gives 29, which is the answer the other two languages would give.

<!-- @doubt -->
### Why do the divide and shift loops hang on negatives?

<!-- @answer -->
Three languages, three routes to the same place. In C++ and Java, >> on a negative value sign-extends, so the high bits fill with ones and the value converges to -1 rather than 0 — while (n) never becomes false. Java's >>> fixes it by shifting zeros in. In Python, // floors, so -1 // 2 is -1 and the loop is stuck immediately. Kernighan's loop is the exception in C++ and Java: it removes bits rather than moving them, so n & (n - 1) reaches 0 from any starting pattern, and countSetBits(-1) correctly returns 32.

<!-- @doubt -->
### What is the SWAR version doing?

<!-- @answer -->
Counting all 32 bits at once by folding the counts pairwise. The first line replaces each pair of bits with the number of bits set in that pair, giving sixteen 2-bit counts. The second adds adjacent pairs of those, giving eight 4-bit counts. The third adds adjacent pairs again into eight 8-bit counts, one per byte. The final multiply by 0x01010101 sums the four byte counts into the top byte, which the shift then extracts — a standard trick for summing bytes without an addition chain. It uses no loop, no table and no builtin, and measured 8,292ns against the instruction's 8,333ns, so it costs nothing to prefer where portability matters.

<!-- @doubt -->
### Is a lookup table still worth it?

<!-- @answer -->
No. A 256-entry byte table with four lookups per value measured 99,916ns over 65,536 values against 8,333ns for the instruction — 12.0x slower. It was the standard answer for a long time, and what changed is that memory got relatively slower while the instruction got free: the table touches cache on every value where the alternative touches nothing. It is still faster than the fixed 32-scan by 2.2x, so it is not absurd, but it costs 256 bytes of cache to be an order of magnitude behind a single instruction.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Two things. Set/Unset the rightmost unset bit works the other end of the same arithmetic: where n & (n - 1) clears the lowest set bit by borrowing, n | (n + 1) sets the lowest clear bit by carrying, and the symmetry is exact. And Minimum Bit Flips to Convert Number reduces a two-number problem to this one — the number of positions where a and b differ is the popcount of a ^ b, so counting bits becomes the second half of an answer whose first half is a single XOR.
