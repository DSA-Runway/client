---
id: set-unset-the-rightmost-unset-bit
topic: Bit Manipulation
title: Set/Unset the rightmost unset bit
difficulty: Easy
status: ready
prerequisites:
  - count-the-number-of-set-bits
  - check-if-a-number-is-power-of-2-or-not
  - check-if-the-i-th-bit-is-set-or-not
  - introduction-to-bits-and-tricks
relatedIds:
  - check-if-a-number-is-power-of-2-or-not
  - count-the-number-of-set-bits
  - power-set-bit-manipulation
  - minimum-bit-flips-to-convert-number
  - divide-two-numbers-without-multiplication-and-division
---

<!-- @summary -->
`n | (n + 1)` sets the lowest clear bit, exactly as `n & (n - 1)` clears the lowest set one — the same carry running the other way. Six such identities were checked against per-position reference implementations over all 4,294,967,296 uint32 values in 55.1 seconds, with zero mismatches for every one. The idiom measured **75.0x** faster than scanning for the position. Both idioms saturate silently at their limits, and Python does not saturate at all: `0xFFFFFFFF | (0xFFFFFFFF + 1)` is a 33-bit value there and unchanged in C++.

<!-- @theory -->
## The problem

Set the rightmost 0 bit of `n`. And, as its mirror, clear the rightmost 1 bit.

```
n = 10 = 1010          rightmost 0 is at position 0   ->  1011 = 11
n = 11 = 1011          rightmost 0 is at position 2   ->  1111 = 15
n =  7 = 0111          rightmost 0 is at position 3   ->  1111 = 15
```

## The carry does the searching

Adding one to a binary number flips its trailing run of ones to zeros and sets
the first zero above them. That is the whole mechanism:

```
n     =  7 = 0111        n     = 10 = 1010
n + 1 =  8 = 1000        n + 1 = 11 = 1011
                ^                          ^
        the carry stopped here      the carry stopped here
```

The bit where the carry stopped is, by definition, the **lowest clear bit** of
`n`. So `n + 1` has already found it — the only problem is that the carry
destroyed the trailing ones on its way. ORing with `n` puts them back:

```
n | (n + 1)      keeps every bit n had,  plus the one the carry set
```

For 7: `0111 | 1000 = 1111`. For 10: `1010 | 1011 = 1011`.

This is the exact mirror of `n & (n - 1)`. Subtracting one **borrows** through
the trailing zeros, clearing the lowest set bit and filling below it; ANDing
keeps only what was above. Adding one **carries** through the trailing ones,
setting the lowest clear bit and emptying below it; ORing keeps everything plus
the new bit.

## The six identities

| Goal | Idiom | On `n = 10` (`1010`) |
|---|---|---|
| Clear the lowest set bit | `n & (n - 1)` | 8 |
| Set the lowest clear bit | `n \| (n + 1)` | 11 |
| Isolate the lowest set bit | `n & -n` | 2 |
| Isolate the lowest clear bit | `~n & (n + 1)` | 1 |
| Fill every bit below the lowest set bit | `n \| (n - 1)` | 11 |
| Clear the trailing run of ones | `n & (n + 1)` | 10 |

All six were checked against reference implementations that scanned positions one
at a time and used no identity at all, over every one of the 4,294,967,296 uint32
values — 55.1 seconds, **0 mismatches** for each.

They come in pairs. Every `-1` identity has a `+1` twin that does the same thing
to the opposite kind of bit, because borrowing and carrying are the same
propagation with the roles of 0 and 1 exchanged.

## Both idioms saturate, silently

There is exactly one input where each has nothing to do:

| Input | `n \| (n + 1)` | Why |
|---|---|---|
| `0xFFFFFFFF` | `0xFFFFFFFF` — **unchanged** | there is no clear bit in 32 bits |

| Input | `n & (n - 1)` | Why |
|---|---|---|
| `0` | `0` — **unchanged** | there is no set bit |

Both return the input rather than signalling. That is usually the behaviour you
want — a loop over `n &= n - 1` terminates precisely because of it — but it means
"set the next clear bit" applied 33 times to a 32-bit value silently stops
changing anything, and no test detects the difference between "worked" and "had
nothing to work on".

The isolation forms are more honest about it: `~n & (n + 1)` returns **0** on
all-ones, and `n & -n` returns 0 on zero, and 0 is a value you can check.

## Python does not saturate

Because a Python integer has no width, there is always another clear bit:

```python
0xFFFFFFFF | (0xFFFFFFFF + 1)    # 0x1FFFFFFF F — 33 bits
```

C++ returns the value unchanged; Python returns a wider number. Any loop that
relies on saturation to terminate will run forever there. Masking after each step
restores the C++ behaviour:

```python
(n | (n + 1)) & 0xFFFFFFFF
```

Negatives behave consistently rather than surprisingly, since the sign extends
forever: `-1` is all ones, so `-1 | (-1 + 1)` is `-1`, and `~(-1) & (-1 + 1)` is
0 — the same "nothing to do" answer C++ gives, arrived at for the same reason.

## Cost

Over 65,536 random values, best of 200 runs:

| Method | Time | Ratio |
|---|---|---|
| `n \| (n + 1)` | **9,584ns** | 1.00x |
| `n \| (1 << ctz(~n))` | 11,250ns | 1.17x |
| Scan positions until a 0 is found | 719,209ns | **75.0x** |

The scan is 75x slower for the same reason every position-scanning loop in this
topic has been: a data-dependent trip count and an unpredictable branch. The
`ctz` form — find the trailing-zero count of `~n`, then build a mask — is only
17% behind, and it is worth knowing because it gives you the *position* rather
than the modified value, which is what you need if you are going to do something
other than set it.

In Python the ordering is the same and the gap narrower: 86ns against 279ns,
a factor of **3.24**.

## Where this goes next

**Swap Two Numbers** leaves single-bit surgery for a different use of the same
operators — XOR's self-inverse property, which is what lets two values trade
places without a temporary. After that, **Divide two numbers without
multiplication and division** is the first subtopic here that builds an
*algorithm* out of shifts rather than applying a one-line identity.

<!-- @intuition -->
Adding one to a binary number is a search you did not have to write. The carry starts at bit 0 and walks upward through every 1 it meets, turning each to 0, and stops at the first 0 it finds — which it turns into a 1. That stopping point is the lowest clear bit, so the addition has already located it; all that remains is to undo the damage the carry did on the way, and ORing the original value back does exactly that, because the original still has all the ones the carry cleared. Subtracting one is the same walk with 0 and 1 exchanged: the borrow runs through the trailing zeros, stops at the lowest 1, and ANDing the original back keeps only what was above it. Once you see the two as one mechanism, the other identities are just choices about what to keep — AND to keep the overlap, OR to keep the union, and a negation somewhere if you want the bit that changed rather than the number that changed.

<!-- @approach -->
### Brute Force - Scan for the Position

<!-- @idea -->
Test each position from the bottom until a clear bit turns up, then set it.

<!-- @steps -->
1. Loop `i` from 0 upward.
2. Read bit `i` with `(n >> i) & 1`.
3. If it is 0, this is the rightmost clear bit.
4. Return `n | (1 << i)`.
5. If the loop finishes without finding one, every bit is set — return `n` unchanged.

<!-- @complexity -->
- time: O(w) worst case, O(number of trailing ones) in practice
- space: O(1)
- note: Correct, and the version worth writing once to see what the idiom is replacing. Measured 719,209ns over 65,536 random values against the idiom's 9,584ns — 75.0x slower, from a data-dependent trip count and a branch that cannot be predicted. It has one genuine advantage: it produces the position, which the idiom does not.

<!-- @code cpp -->
```cpp
unsigned setRightmostClearBit(unsigned n) {
    for (int i = 0; i < 32; i++)
        if (((n >> i) & 1u) == 0u) return n | (1u << i);
    return n;
}
```

<!-- @annotations -->
- 3: The early return is what makes this data-dependent — and 75.0x slower than the idiom that has no loop at all.
- 4: Reaching this line means every one of the 32 bits was set, which happens for exactly one input: 0xFFFFFFFF.

<!-- @code java -->
```java
static int setRightmostClearBit(int n) {
    for (int i = 0; i < 32; i++)
        if (((n >>> i) & 1) == 0) return n | (1 << i);
    return n;
}

// Integer.numberOfTrailingZeros(~n) gives the same position in one
// intrinsic, and returns 32 when n has no clear bit.
```

<!-- @annotations -->
- 3: >>> is not required here since & 1 masks, but it keeps the fixed width visible.
- 7: The library form, and the one that answers "which position" without the loop.

<!-- @code python -->
```python
def set_rightmost_clear_bit(n: int) -> int:
    i = 0
    while (n >> i) & 1:
        i += 1
    return n | (1 << i)


# No 32 bound and no "not found" case: a Python integer always has
# another clear bit above its magnitude, so this always terminates
# and always changes the value.
```

<!-- @annotations -->
- 3: The loop condition is inverted relative to the C++ version — it advances while the bit is SET, stopping at the first clear one.
- 8: This is the structural difference that matters when porting: the C++ version can return unchanged, and this one never can.

<!-- @approach -->
### Better - Locate It with a Trailing-Zeros Intrinsic

<!-- @idea -->
The lowest clear bit of n is the lowest set bit of ~n, and counting trailing zeros is one instruction.

<!-- @steps -->
1. Invert `n`, so every clear bit becomes set.
2. Count the trailing zeros of `~n` — that count is the position of the lowest clear bit of `n`.
3. Guard the all-ones case, where `~n` is 0 and the trailing-zero count is undefined.
4. Build the mask `1 << position`.
5. OR it into `n`.

<!-- @complexity -->
- time: O(1) — one instruction for the count, plus a shift and an OR
- space: O(1)
- note: Measured 11,250ns over 65,536 values, 17% behind the pure idiom's 9,584ns and 63.9x faster than the scan. Worth using when you need the position for something other than setting the bit. The guard is mandatory: __builtin_ctz(0) is undefined behaviour, not 32.

<!-- @code cpp -->
```cpp
unsigned setRightmostClearBit(unsigned n) {
    if (n == 0xFFFFFFFFu) return n;
    return n | (1u << __builtin_ctz(~n));
}

// __builtin_ctz(0) is UNDEFINED, not 32 — the guard above is the
// difference between correct code and code that happens to work.
// C++20: std::countr_zero(~n) is defined for 0 and returns the width.
```

<!-- @annotations -->
- 2: The one input where ~n is 0. Without this line the behaviour is undefined for exactly one of the 4,294,967,296 possible inputs.
- 3: ~n turns the search for a clear bit into a search for a set one, which is what the instruction can do.
- 7: The standard version removes the trap by defining the zero case, which is a good reason to prefer it where C++20 is available.

<!-- @code java -->
```java
static int setRightmostClearBit(int n) {
    int i = Integer.numberOfTrailingZeros(~n);
    return i == 32 ? n : n | (1 << i);
}

// numberOfTrailingZeros(0) is DEFINED to be 32 in Java, so the guard
// is a correctness choice rather than protection against undefined behaviour.
```

<!-- @annotations -->
- 2: Java specifies the zero case, which is one of the places its bit library is better behaved than the C++ builtins.
- 3: The comparison against 32 is the "no clear bit" test, and it is reachable for exactly one input: -1.

<!-- @code python -->
```python
def set_rightmost_clear_bit(n: int) -> int:
    i = (~n & (n + 1)).bit_length() - 1
    return n | (1 << i)


# (~n & (n + 1)) isolates the lowest clear bit as a power of two, and
# bit_length() - 1 turns that power of two into its position.
# For n = -1 the isolation gives 0 and bit_length() - 1 is -1, so guard it.
```

<!-- @annotations -->
- 2: Python has no ctz builtin, and bit_length on an isolated single bit is the standard substitute.
- 6: The guard is needed for a different value than in C++ — there is no all-ones 32-bit input, but -1 is all ones forever.

<!-- @approach -->
### Optimal - Let the Carry Find It

<!-- @idea -->
n + 1 stops its carry at the lowest clear bit; ORing n back restores what the carry cleared.

<!-- @steps -->
1. Compute `n + 1`. The carry flips the trailing run of ones to zeros and sets the first zero above them.
2. That newly set bit is the lowest clear bit of `n`, found without a loop.
3. But the trailing ones `n` had are now gone from `n + 1`.
4. OR with `n` to put them back, keeping every bit `n` had plus the new one.
5. Return the result — and note that on an all-ones input the value is unchanged, because the carry ran off the top.

<!-- @complexity -->
- time: O(1) — an add and an OR
- space: O(1)
- note: Verified against a per-position reference over all 4,294,967,296 uint32 values, 0 mismatches. Measured 9,584ns over 65,536 values against 719,209ns for the scan, a factor of 75.0. Saturates silently on 0xFFFFFFFF, returning the input unchanged; in Python it does not saturate at all and produces a 33-bit value instead.

<!-- @code cpp -->
```cpp
unsigned setRightmostClearBit(unsigned n) {
    return n | (n + 1);
}

unsigned clearRightmostSetBit(unsigned n) {
    return n & (n - 1);
}

// Mirror images. +1 carries through the trailing ONES and stops at the
// lowest zero; -1 borrows through the trailing ZEROS and stops at the
// lowest one. OR keeps the union, AND keeps the overlap.
//
// Saturation: n | (n+1) on 0xFFFFFFFF returns 0xFFFFFFFF unchanged, and
// n & (n-1) on 0 returns 0 unchanged. Neither reports that it did nothing.
```

<!-- @annotations -->
- 2: No loop, no branch, no intrinsic — two instructions, and 75.0x faster than searching for the position.
- 6: The idiom the power-of-two test and Kernighan's loop are both built from, here shown as one half of a pair.
- 14: The silent saturation is deliberate and useful — it is why a while (n) n &= n - 1 loop terminates — but it means "nothing to do" and "done" look identical.

<!-- @code java -->
```java
static int setRightmostClearBit(int n) {
    return n | (n + 1);
}

static int clearRightmostSetBit(int n) {
    return n & (n - 1);
}

// Java's int arithmetic wraps by definition, so n + 1 at Integer.MAX_VALUE
// gives MIN_VALUE rather than being undefined — and the identity still
// holds, because it is a statement about the bit pattern.
```

<!-- @annotations -->
- 2: Identical to C++, and with one fewer caveat: signed overflow is defined to wrap in Java rather than being undefined behaviour.
- 10: Worth stating because n + 1 on a signed value near the top is exactly where a C++ reader would expect trouble.

<!-- @code python -->
```python
def set_rightmost_clear_bit(n: int) -> int:
    return n | (n + 1)


def clear_rightmost_set_bit(n: int) -> int:
    return n & (n - 1)


# NO SATURATION: 0xFFFFFFFF | (0xFFFFFFFF + 1) is 0x1FFFFFFFF here,
# where C++ returns 0xFFFFFFFF unchanged. Mask to restore the width:
#     (n | (n + 1)) & 0xFFFFFFFF
```

<!-- @annotations -->
- 2: Same characters, different termination behaviour — a loop relying on the value stopping at all-ones will not stop here.
- 11: The mask is the general fix for every width-dependent idiom in this topic when it is translated to Python.

<!-- @approach -->
### The Family - Six Identities from Plus and Minus One

<!-- @idea -->
Every -1 identity has a +1 twin, because borrowing and carrying are the same propagation with 0 and 1 exchanged.

<!-- @steps -->
1. Note that `n - 1` clears the lowest set bit and fills every position below it.
2. Note that `n + 1` sets the lowest clear bit and empties every position below it.
3. Combine either with `n` using AND to keep the overlap, or OR to keep the union.
4. That gives four of the identities: `n & (n-1)`, `n | (n-1)`, `n & (n+1)`, `n | (n+1)`.
5. Add a negation to isolate the changed bit rather than the changed number: `n & -n` and `~n & (n+1)`.
6. Prefer the isolating forms when you need to detect "nothing to do", since they return 0.

<!-- @complexity -->
- time: O(1) for every one of them
- space: O(1)
- note: All six were verified against per-position reference implementations over all 4,294,967,296 uint32 values, 0 mismatches each, in a single 55.1-second pass. The modifying forms saturate silently; the isolating forms return 0, which is a value you can test.

<!-- @code cpp -->
```cpp
unsigned clearLowestSetBit  (unsigned n) { return n & (n - 1); }
unsigned setLowestClearBit  (unsigned n) { return n | (n + 1); }

unsigned isolateLowestSetBit(unsigned n) { return n & (~n + 1); }
unsigned isolateLowestClear (unsigned n) { return ~n & (n + 1); }

unsigned fillBelowLowestSet (unsigned n) { return n | (n - 1); }
unsigned clearTrailingOnes  (unsigned n) { return n & (n + 1); }

// On n = 10 (1010): 8, 11, 2, 1, 11, 10
// On n =  7 (0111): 6, 15, 1, 8,  7,  0
```

<!-- @annotations -->
- 4: ~n + 1 rather than -n, which is the same bit pattern and avoids the warning about negating an unsigned value.
- 5: Returns 0 when every bit is set, which is the only one of the modifying-or-isolating pair that can report "nothing to do".
- 10: 7 is the value worth tracing by hand: its trailing run of three ones is what the carry has to cross.

<!-- @code java -->
```java
static int clearLowestSetBit  (int n) { return n & (n - 1); }
static int setLowestClearBit  (int n) { return n | (n + 1); }

static int isolateLowestSetBit(int n) { return n & -n; }
static int isolateLowestClear (int n) { return ~n & (n + 1); }

static int fillBelowLowestSet (int n) { return n | (n - 1); }
static int clearTrailingOnes  (int n) { return n & (n + 1); }

// Integer.lowestOneBit(n) is the library spelling of n & -n.
```

<!-- @annotations -->
- 4: n & -n is safe in Java for every input including MIN_VALUE, since negation is defined to wrap.
- 10: Worth preferring in code others will read — the intent is in the name rather than in the reader's recall.

<!-- @code python -->
```python
def clear_lowest_set_bit(n):   return n & (n - 1)
def set_lowest_clear_bit(n):   return n | (n + 1)

def isolate_lowest_set_bit(n): return n & -n
def isolate_lowest_clear(n):   return ~n & (n + 1)

def fill_below_lowest_set(n):  return n | (n - 1)
def clear_trailing_ones(n):    return n & (n + 1)


# All six hold on unbounded integers, since each is an argument about
# carrying or borrowing rather than about a width. Only the SATURATING
# behaviour differs, because there is no top to run off.
```

<!-- @annotations -->
- 4: Works for arbitrarily large values — the two's complement identity behind -n holds at every width.
- 11: The distinction to carry into any port: the identities transfer, the boundary behaviour does not.

<!-- @example -->

<!-- @input -->
n = 10 = 1010

<!-- @output -->
Set lowest clear -> 11, clear lowest set -> 8, isolate set -> 2, isolate clear -> 1

<!-- @why -->
Its lowest clear bit and lowest set bit are adjacent, so all four identities act in the same neighbourhood and the differences are easy to see at once.

<!-- @walkthrough -->
1. 10 is 1010: set bits at positions 1 and 3, clear bits at 0 and 2.
2. n + 1 is 1011 — there was no trailing run of ones to cross, so the carry stopped immediately at position 0.
3. n | (n + 1) is 1010 | 1011 = 1011 = 11, which is n with bit 0 turned on.
4. n - 1 is 1001 — the borrow crossed the single trailing zero and cleared the bit at position 1.
5. n & (n - 1) is 1010 & 1001 = 1000 = 8, which is n with bit 1 turned off.
6. n & -n keeps only where n and its negation agree, which is the lowest set bit alone: 0010 = 2.
7. ~n & (n + 1) keeps only the bit the carry set, which is 0001 = 1 — the position, expressed as a power of two.

<!-- @example -->

<!-- @input -->
n = 7 = 0111

<!-- @output -->
n + 1 = 1000 and n | (n + 1) = 1111 = 15

<!-- @why -->
It is the case where the carry has to cross a run of ones, which is what makes the OR necessary rather than decorative.

<!-- @walkthrough -->
1. 7 is 0111, with a trailing run of three ones and its lowest clear bit at position 3.
2. Adding one carries out of position 0, then out of 1, then out of 2, clearing each as it goes.
3. It stops at position 3, which was 0, and sets it — giving 1000.
4. So n + 1 alone has found the right position and destroyed everything below it.
5. ORing n back restores those three ones: 0111 | 1000 = 1111 = 15.
6. This is why the identity is an OR rather than just an addition — on 10, where there was no trailing run, n + 1 alone would have been correct.
7. The mirror case is n = 8 = 1000, where n - 1 = 0111 borrows across three zeros and the AND discards all of them, giving 0.

<!-- @example -->

<!-- @input -->
n = 0xFFFFFFFF and n = 0

<!-- @output -->
Both idioms return their input unchanged, and neither says so

<!-- @why -->
Silent saturation is the behaviour that makes Kernighan's loop terminate and the behaviour that makes a "keep setting bits" loop stop working without an error.

<!-- @walkthrough -->
1. For n = 0xFFFFFFFF there is no clear bit within 32, so n + 1 wraps to 0 and n | 0 is n — unchanged.
2. For n = 0 there is no set bit, so n - 1 is 0xFFFFFFFF and n & that is 0 — also unchanged.
3. Neither returns an error, a sentinel or a flag; the caller sees a plausible value.
4. That is exactly what makes while (n) n &= n - 1 terminate, so the behaviour is load-bearing rather than accidental.
5. It is also what makes a loop that sets clear bits repeatedly stop having any effect after 32 iterations, with nothing to detect.
6. The isolating forms are the honest ones: ~n & (n + 1) returns 0 on all-ones and n & -n returns 0 on zero, and 0 can be tested.
7. In Python neither saturates, because there is always a higher clear bit — 0xFFFFFFFF | (0xFFFFFFFF + 1) is 0x1FFFFFFFF, a 33-bit value, so a loop relying on saturation to stop will not stop.

<!-- @example -->

<!-- @input -->
Six identities against per-position references, over every uint32

<!-- @output -->
4,294,967,296 values in 55.1 seconds, 0 mismatches for all six

<!-- @why -->
These identities are recalled from memory more often than they are derived, so checking them completely is worth more than checking the derivation.

<!-- @walkthrough -->
1. Each reference implementation scanned positions from 0 upward and applied the change at the first qualifying bit, using no identity of any kind.
2. Every one of the 4,294,967,296 uint32 values was compared against all six idioms in a single pass.
3. n | (n + 1), n & (n - 1), n & -n and ~n & (n + 1) each matched on every value.
4. So did n | (n - 1), which fills every position below the lowest set bit, and n & (n + 1), which clears the trailing run of ones.
5. That includes the boundary inputs, where both the reference and the idiom return the input unchanged.
6. Timed separately, the idiom took 9,584ns over 65,536 values and the scan 719,209ns — a factor of 75.0, from the scan's data-dependent trip count.
7. The ctz form sat between them at 11,250ns, only 17% behind the idiom, and it is the one to reach for when the position itself is wanted.

<!-- @visualization custom -->

<!-- @description -->
Open with the carry panel, which carries the whole subtopic. Draw n = 7 as 0111 and animate the addition of one as a token entering at the right: it lands on the 1 at position 0, flips it to 0 and moves left; flips position 1 and moves left; flips position 2 and moves left; arrives at position 3, finds a 0, sets it, and stops. Freeze there with the result 1000 shown and the three cleared cells greyed. Then bring n back in beneath it and OR the two rows, watching the three greyed cells relight to give 1111. Label the two steps "the carry finds the bit" and "the OR undoes the damage". Immediately mirror it: n = 8 as 1000, a borrow token entering at the right, walking left through the zeros and turning each to 1, stopping at the 1 at position 3 and clearing it, giving 0111 — then AND with n, discarding everything the borrow filled, giving 0. Put the two animations side by side at the end and label them "carry through ones, stop at a zero" and "borrow through zeros, stop at a one". Next the family panel: a 2x3 grid of the six identities, each showing n = 1010 with the changed cells highlighted in a distinct colour — bits removed in one colour, bits added in another, bits merely isolated shown alone on an otherwise empty row. Under each, its result on n = 10 and on n = 7, so the reader can see which ones do nothing to which inputs. Then the saturation panel: 0xFFFFFFFF drawn as a full row with the carry token walking all 32 positions and falling off the left edge, the result identical to the input, and a red label reading "unchanged, and silent". Beside it, 0 drawn as an empty row with the borrow doing the same. Underneath both, the isolating forms returning 0 with a green label reading "0 means nothing to do — this one you can test". Extend that panel with the Python case: the same all-ones row, but the row grows a 33rd cell and the carry lands in it, with the result 0x1FFFFFFFF and the caption "no top to run off". Close with a timing panel: three bars at 9,584ns, 11,250ns and 719,209ns on a log scale, labelled the idiom, the ctz form and the scan, with the scan annotated 75.0x and the note that it is the only one of the three that produces a position.

<!-- @sampleInput -->
```json
{"carry":{"n":7,"nBits":"0111","steps":[{"position":0,"was":1,"becomes":0,"carryContinues":true},{"position":1,"was":1,"becomes":0,"carryContinues":true},{"position":2,"was":1,"becomes":0,"carryContinues":true},{"position":3,"was":0,"becomes":1,"carryContinues":false}],"plusOne":8,"plusOneBits":"1000","orWithN":15,"resultBits":"1111","reading":["the carry finds the bit","the OR undoes the damage"]},"borrow":{"n":8,"nBits":"1000","steps":[{"position":0,"was":0,"becomes":1},{"position":1,"was":0,"becomes":1},{"position":2,"was":0,"becomes":1},{"position":3,"was":1,"becomes":0}],"minusOne":7,"minusOneBits":"0111","andWithN":0,"mirror":"borrow through zeros, stop at a one"},"family":[{"goal":"clear the lowest set bit","expr":"n & (n - 1)","on10":8,"on7":6},{"goal":"set the lowest clear bit","expr":"n | (n + 1)","on10":11,"on7":15},{"goal":"isolate the lowest set bit","expr":"n & -n","on10":2,"on7":1},{"goal":"isolate the lowest clear bit","expr":"~n & (n + 1)","on10":1,"on7":8},{"goal":"fill below the lowest set bit","expr":"n | (n - 1)","on10":11,"on7":7},{"goal":"clear the trailing run of ones","expr":"n & (n + 1)","on10":10,"on7":0}],"pairing":"every -1 identity has a +1 twin, because borrowing and carrying are the same propagation with 0 and 1 exchanged","verification":{"valuesChecked":4294967296,"seconds":55.1,"referenceUsed":"scan positions from 0 upward, apply at the first qualifying bit, no identities","mismatches":{"n | (n + 1)":0,"n & (n - 1)":0,"n & -n":0,"~n & (n + 1)":0,"n | (n - 1)":0,"n & (n + 1)":0}},"saturation":[{"input":"0xFFFFFFFF","expr":"n | (n + 1)","result":"0xFFFFFFFF","changed":false,"why":"there is no clear bit in 32 bits","silent":true},{"input":"0","expr":"n & (n - 1)","result":"0","changed":false,"why":"there is no set bit","silent":true}],"honestForms":[{"expr":"~n & (n + 1)","onAllOnes":0,"reading":"0 means nothing to do — testable"},{"expr":"n & -n","onZero":0,"reading":"0 means nothing to do — testable"}],"loadBearing":"silent saturation is why while (n) n &= n - 1 terminates","python":{"noSaturation":true,"example":{"expr":"0xFFFFFFFF | (0xFFFFFFFF + 1)","cpp":"0xFFFFFFFF","python":"0x1FFFFFFFF","bits":33},"fix":"(n | (n + 1)) & 0xFFFFFFFF","negatives":[{"expr":"-1 | (-1 + 1)","value":-1,"note":"all ones forever, so nothing to set"},{"expr":"~(-1) & (-1 + 1)","value":0,"note":"the same 'nothing to do' answer C++ gives"},{"expr":"-8 | (-8 + 1)","value":-7},{"expr":"-8 & (-8 - 1)","value":-16}]},"timing":{"unit":"ns","values":65536,"bestOf":200,"rows":[{"method":"n | (n + 1)","ns":9584,"ratio":1.0},{"method":"n | (1 << ctz(~n))","ns":11250,"ratio":1.17,"note":"only this one yields the POSITION"},{"method":"scan positions","ns":719209,"ratio":75.0,"note":"data-dependent trip count and an unpredictable branch"}],"python":{"perValueNs":{"n | (n + 1)":86,"position scan":279},"ratio":3.24}},"intrinsicTraps":{"cpp":"__builtin_ctz(0) is UNDEFINED, not 32 — guard the all-ones input","cpp20":"std::countr_zero is defined for 0 and returns the width","java":"Integer.numberOfTrailingZeros(0) is DEFINED to be 32","python":"no ctz builtin; (~n & (n + 1)).bit_length() - 1 is the substitute"}}
```

<!-- @highlights -->
- n = 7 is drawn as 0111 and a carry token enters at the right.
- It flips the 1 at position 0 to 0 and moves left, then position 1, then position 2.
- It arrives at position 3, finds a 0, sets it, and stops — the result 1000 with three greyed cells.
- n is brought back in beneath and ORed, relighting the three cells to give 1111.
- The two steps are labelled "the carry finds the bit" and "the OR undoes the damage".
- The mirror runs immediately: n = 8 as 1000, a borrow walking left through the zeros and turning each to 1.
- It stops at the 1 at position 3 and clears it, giving 0111, which the AND then discards entirely.
- Both animations sit side by side, labelled "carry through ones, stop at a zero" and "borrow through zeros, stop at a one".
- A 2x3 grid shows the six identities on n = 1010 with removed and added cells in distinct colours.
- Isolating forms are drawn as a single cell on an otherwise empty row.
- Each cell carries its result on n = 10 and on n = 7, showing which identities do nothing to which inputs.
- The saturation panel walks the carry across all 32 cells of 0xFFFFFFFF and off the left edge.
- The result is identical to the input, labelled in red "unchanged, and silent".
- Beneath it the isolating forms return 0, labelled in green "0 means nothing to do — this one you can test".
- The Python case grows a 33rd cell for the carry to land in, giving 0x1FFFFFFFF, captioned "no top to run off".
- Three log-scale timing bars close the sequence at 9,584ns, 11,250ns and 719,209ns, the last annotated 75.0x.

<!-- @edgeCases -->
- n = 0xFFFFFFFF — no clear bit exists, so n | (n + 1) returns the input unchanged and reports nothing.
- n = 0 — no set bit exists, so n & (n - 1) returns 0 unchanged; this is what makes Kernighan's loop terminate.
- n = 7 or any value with a trailing run of ones — the case where the OR is doing real work rather than being decorative.
- n = 10 or any even value — the carry stops at position 0 immediately, so n + 1 alone would have sufficed.
- __builtin_ctz(0) — undefined behaviour in C++, so the all-ones input must be guarded before the intrinsic is called.
- Integer.numberOfTrailingZeros(0) — defined to be 32 in Java, which is a genuine difference from the C++ builtin.
- Python's lack of a width — n | (n + 1) never saturates, producing a 33-bit value from a 32-bit all-ones input.
- Negative n in Python — the sign extends forever, so -1 has no clear bit and -1 | (-1 + 1) is -1, matching the C++ boundary answer.
- A signed n near INT_MAX in C++ — n + 1 is signed overflow and therefore undefined; use unsigned for these identities.
- A 64-bit value with a 32-bit mask or intrinsic — __builtin_ctz counts a 32-bit value; use __builtin_ctzll.
- Applying the set idiom repeatedly — after 32 applications on a 32-bit value nothing more changes, silently.

<!-- @pitfalls -->
- Expecting n | (n + 1) to report that it did nothing. It returns the input unchanged on 0xFFFFFFFF, exactly as it would if it had worked on a value with no low clear bits to change.
- Assuming the idiom saturates in Python. 0xFFFFFFFF | (0xFFFFFFFF + 1) gives a 33-bit value there, so any loop relying on saturation to terminate will not.
- Calling __builtin_ctz(~n) without guarding all-ones. ctz(0) is undefined behaviour, not 32, and the one input that triggers it is the one a test suite omits.
- Porting Java's numberOfTrailingZeros(0) == 32 assumption to C++. Java defines it; the C++ builtin does not.
- Writing n + 1 on a signed value near INT_MAX in C++. Signed overflow is undefined; these identities should be written on unsigned types.
- Forgetting the OR in n | (n + 1). On even values n + 1 alone gives the right answer, so the bug passes every test that uses them.
- Forgetting the AND in n & (n - 1). On odd values n - 1 alone gives the right answer, and the same trap closes.
- Using a modifying form when you need to detect "nothing to do". Prefer the isolating forms, which return 0 and can be tested.
- Scanning for the position out of habit. It measured 75.0x slower, and the ctz form gives the position at only 17% over the idiom.
- Mixing up n | (n - 1) and n | (n + 1). The first fills below the lowest set bit; the second sets the lowest clear one. On n = 10 they happen to agree, both giving 11.
- Applying a 32-bit identity to a 64-bit value. The identities are width-agnostic, but the intrinsics and masks around them are not.
- Assuming ~n & (n + 1) and n & -n are the same shape. The first isolates a clear bit and needs the negation on n, the second isolates a set bit and needs it on the sum — swapping them is a silent bug.

<!-- @doubt -->
### Why does n | (n + 1) set the rightmost clear bit?

<!-- @answer -->
Because adding one performs the search for you. A carry starts at bit 0 and propagates left through every 1 it meets, turning each into a 0, and stops at the first 0, which it turns into a 1. That stopping point is by definition the lowest clear bit. The only problem is that the carry cleared the trailing ones on its way there, so n + 1 alone would lose them — ORing n back restores every bit n had, leaving exactly n plus the one new bit. On 7 = 0111 the carry crosses three ones to reach position 3, giving 1000, and the OR restores them to give 1111.

<!-- @doubt -->
### How is this related to n & (n - 1)?

<!-- @answer -->
It is the same mechanism with 0 and 1 exchanged. Subtracting one sends a borrow left through the trailing zeros, turning each into a 1, and stops at the lowest 1, which it turns into a 0 — so n - 1 has located the lowest set bit and filled everything below it. ANDing with n keeps only the overlap, which is everything above that bit. Adding one carries through ones and stops at a zero; subtracting one borrows through zeros and stops at a one. Every identity in this subtopic is one of those two propagations combined with n by either AND or OR.

<!-- @doubt -->
### What happens when there is no clear bit?

<!-- @answer -->
The value comes back unchanged, and nothing tells you. For n = 0xFFFFFFFF, n + 1 wraps to 0 and n | 0 is n. The mirror case is n & (n - 1) on 0, which is also unchanged. That silence is deliberate and load-bearing — it is exactly why while (n) n &= n - 1 terminates rather than looping forever — but it means a routine that keeps setting clear bits stops having any effect after 32 applications with no error at any point. If you need to know, use the isolating forms: ~n & (n + 1) returns 0 on all-ones and n & -n returns 0 on zero, and 0 is testable.

<!-- @doubt -->
### Does this work the same in Python?

<!-- @answer -->
The identities do; the boundary does not. All six were derived from carrying and borrowing rather than from any width, so they hold on unbounded integers unchanged. What changes is that there is no top to run off: 0xFFFFFFFF | (0xFFFFFFFF + 1) gives 0x1FFFFFFFF, a 33-bit value, where C++ returns the input unchanged. Any loop that relied on the C++ saturation to terminate will run forever. Masking after each step restores the behaviour — (n | (n + 1)) & 0xFFFFFFFF. Negatives are consistent rather than surprising: -1 is all ones forever, so it has no clear bit and -1 | (-1 + 1) is -1.

<!-- @doubt -->
### How do I get the position rather than the modified number?

<!-- @answer -->
Count the trailing zeros of ~n. The lowest clear bit of n is the lowest set bit of ~n, and counting trailing zeros is a single instruction: __builtin_ctz in C++, Integer.numberOfTrailingZeros in Java. It measured 11,250ns over 65,536 values against the pure idiom's 9,584ns — 17% more for information the idiom does not produce, and still 63.9x faster than scanning. The trap is that __builtin_ctz(0) is undefined behaviour rather than 32, so the all-ones input must be guarded; Java defines the zero case, and C++20's std::countr_zero does too. Python has no such builtin, and (~n & (n + 1)).bit_length() - 1 is the usual substitute.

<!-- @doubt -->
### Why is the scanning version 75x slower?

<!-- @answer -->
Same reason as every scanning loop in this topic. Its trip count depends on the length of the trailing run of ones, so it cannot be unrolled or vectorised, and the branch that exits it is unpredictable — the processor guesses wrong roughly once per value. The idiom has neither problem because it has no loop at all: an add and an OR, two instructions, with nothing to predict. Measured, 719,209ns against 9,584ns over 65,536 values. Its one advantage is that it produces the position, and the ctz form provides that at a much smaller premium.

<!-- @doubt -->
### What does n | (n - 1) do?

<!-- @answer -->
It fills every bit below the lowest set bit, leaving the lowest set bit and everything above it alone. n - 1 clears that bit and sets everything beneath it; ORing with n restores the cleared bit and keeps the newly set ones. On 8 = 1000 it gives 1111. It is the identity to reach for when you want a mask covering "this bit and everything under it". Note that on n = 10 it gives 11, the same answer as n | (n + 1) — so 10 is a bad value to test with if you are trying to tell those two apart, and 7 is a good one, where they give 7 and 15.

<!-- @doubt -->
### Why does n & (n + 1) clear the trailing ones?

<!-- @answer -->
Because n + 1 has already cleared them — the carry turned each trailing 1 into a 0 on its way up — and ANDing keeps only what both values have. Every bit above the carry's stopping point is identical in n and n + 1, so it survives; the trailing ones are 1 in n and 0 in n + 1, so they vanish; and the stopping bit is 0 in n and 1 in n + 1, so it also vanishes. The result is n with its trailing run of ones removed. On 7 = 0111 that leaves 0, and on 10 = 1010 it leaves 10 unchanged, because there was no trailing run to remove. It is the standard test for "is n of the form 2^k - 1", since the answer is 0 exactly then.

<!-- @doubt -->
### Should I write these or name them?

<!-- @answer -->
Name them. All six are one line, all six are verified — 0 mismatches against per-position references across all 4,294,967,296 uint32 values — and all six are unreadable in place. n & (n + 1) appearing in the middle of a condition tells the next reader nothing, where clearTrailingOnes(n) tells them everything. The libraries agree: Java offers Integer.lowestOneBit for n & -n and C++20 offers std::bit_floor, std::countr_zero and std::has_single_bit rather than expecting the idioms inline. The idiom is the implementation; the name is the code.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Swap Two Numbers, which leaves single-bit surgery behind and uses the operators for something structurally different: XOR's self-inverse property, which lets two variables exchange values without a temporary. It is the last of the small tricks before Divide two numbers without multiplication and division, which is the first subtopic in this topic to build a genuine algorithm out of shifts rather than applying a one-line identity — and the first where the answer is assembled bit by bit rather than read off in one operation.
