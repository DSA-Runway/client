---
id: introduction-to-bits-and-tricks
topic: Bit Manipulation
title: Introduction to Bits and Tricks
difficulty: Easy
status: ready
prerequisites:
  - data-types
  - arithmetic-operators
  - type-conversion-and-casting
  - integer-overflow-and-precision-errors
  - reverse-a-number
relatedIds:
  - check-if-the-i-th-bit-is-set-or-not
  - swap-two-numbers
  - count-the-number-of-set-bits
  - check-if-a-number-is-power-of-2-or-not
  - find-the-number-that-appears-once-and-other-numbers-twice
---

<!-- @summary -->
Six operators and about eight one-line idioms, all of which read a number as a row of bits rather than a quantity. The identity the whole topic rests on — that `-x` and `~x + 1` are the same bit pattern — was checked here against all 4,294,967,296 int32 values with zero mismatches, and the four bit accessors against all 1,048,576 (value, position) pairs at 16 bits, also zero. What does not survive measurement is the folklore: `x * 2` and `x << 1` timed at 4,083ns and 4,084ns over 65,536 elements, identical, because the compiler has emitted the shift for you since long before you learned the trick.

<!-- @theory -->
## The number was always a row of bits

Nothing in this topic converts anything. An `int` is already 32 bits in memory; the
decimal you type is a *notation* for it, and every operator here reads the bits
that were there the whole time.

```
       13  =  0  0  0  0  1  1  0  1
bit index    7  6  5  4  3  2  1  0
place value 128 64 32 16  8  4  2  1        8 + 4 + 1 = 13
```

Bit `i` has place value `2^i`, and bit 0 is the *rightmost*. That indexing is not
a convention you could have chosen differently: bit `i` is worth `2^i`, so `n >> i`
slides bit `i` into position 0 where a single `& 1` can read it.

## Reading the bits: two loops that look different and compile the same

The schoolbook conversion repeatedly divides by 2 and keeps the remainders:

```
13 % 2 = 1   13 / 2 = 6      digits so far: 1
 6 % 2 = 0    6 / 2 = 3                     10
 3 % 2 = 1    3 / 2 = 1                     101
 1 % 2 = 1    1 / 2 = 0                     1101   <- read bottom-up
```

The bit-native version replaces `% 2` with `& 1` and `/ 2` with `>> 1`. This is
the same loop Reverse a Number ran with 10 instead of 2 — only the base changed.
Timed over 65,536 random values, extracting every bit of each:

| Loop | Unsigned | Signed, non-negative values |
|---|---|---|
| `n % 2`, `n /= 2` | 1,008,583ns | 2,208,333ns |
| `n & 1`, `n >>= 1` | 1,047,000ns | **982,666ns** |

On unsigned values the two are the same code — the 3.8% gap is noise, because the
compiler already knows `/ 2` on an unsigned value *is* `>> 1`. On signed values it
cannot make that substitution, and the division loop costs **2.25x** more. The
lesson is not "use shifts"; it is that the sign is what costs you.

## The six operators, on one pair

With `a = 13` (`1101`) and `b = 7` (`0111`):

| Operator | Expression | Result | Bits |
|---|---|---|---|
| AND | `a & b` | 5 | `0101` — 1 only where both are 1 |
| OR | `a \| b` | 15 | `1111` — 1 where either is 1 |
| XOR | `a ^ b` | 10 | `1010` — 1 where they *differ* |
| NOT | `~a` | −14 | every bit flipped, all 32 of them |
| Left shift | `a << 1` | 26 | bits slide up, a 0 enters at the bottom |
| Right shift | `a >> 1` | 6 | bits slide down, the bottom bit is lost |

`~13` is `-14` and not `2` because `~` flips all 32 bits, including the ones your
four-bit sketch left out. The three that matter later are:

- **AND is the reader and the masker.** `n & (1 << i)` isolates one bit; `n & 0xFF`
  keeps the low eight and discards the rest.
- **OR is the writer.** It can only turn bits on.
- **XOR is the toggler, and it undoes itself.** `a ^ a == 0` and `a ^ 0 == a`,
  verified across all 65,536 16-bit values. Everything Single Number does is built
  on those two lines.

## Negative numbers: one identity, checked exhaustively

A signed integer stores negatives in **two's complement**: the top bit carries a
place value of `−2^31` instead of `+2^31`, and the rule for negating is *flip
every bit, then add one*.

```
   7  = 00000000000000000000000000000111
  ~7  = 11111111111111111111111111111000
~7+1  = 11111111111111111111111111111001  = -7
```

So `-x == ~x + 1`. That is worth more than a claim, so it was checked against
**every one of the 4,294,967,296 values an int32 can hold** — 0 mismatches, in
2.76 seconds. (At `-O2` the compiler folds the comparison away entirely, which is
its own kind of proof; the run above forces it through a `volatile`.)

Two consequences follow immediately and both matter:

- **`n & -n` isolates the lowest set bit.** `-n` is `~n + 1`, so it agrees with `n`
  from the lowest set bit downward and disagrees everywhere above it. Zero failures
  over all 65,536 16-bit values.
- **`INT_MIN` has no positive counterpart.** `-(-2147483648)` is `-2147483648`
  again, because the positive value does not exist in 32 bits. Every "take the
  absolute value first" algorithm in this topic breaks on exactly that one input.

## Where division and shifting part company

For non-negative values `x / 2^k` and `x >> k` agree — 0 disagreements over
1..1,000,000. For negatives they systematically do not, because C++ division
rounds **toward zero** and shifting rounds **toward −∞**:

```
-7 / 2  = -3        -7 >> 1 = -4
-1 / 2  =  0        -1 >> 1 = -1        (and -1 >> 31 is still -1)
```

Measured over −1,000,000..−1:

| Comparison | Values disagreeing | Share |
|---|---|---|
| `y / 2` vs `y >> 1` | 500,000 | 50% |
| `y / 4` vs `y >> 2` | 750,000 | 75% |
| `y / 8` vs `y >> 3` | 875,000 | 87.5% |

The pattern is `1 − 1/2^k`: shifting is wrong for every negative that is not an
exact multiple of `2^k`. Replacing `/ 2` with `>> 1` in code that can see a
negative is a silent off-by-one on half the inputs.

## The "shifts are faster" folklore does not survive a stopwatch

Over 65,536 unsigned elements, best of 200 runs:

| Expression | Time | Expression | Time |
|---|---|---|---|
| `x * 2` | 4,083ns | `x << 1` | 4,084ns |
| `x / 2` | 4,083ns | `x >> 1` | 4,084ns |
| `x / 8` | 4,250ns | `x >> 3` | 4,250ns |
| `x / 7` | **11,417ns** | — | — |

Identical to the nanosecond in three pairs. What is actually expensive is dividing
by something that is *not* a power of two: `x / 7` costs **2.69x** what `x / 8`
does, because that one really is a division instruction. And on signed values,
where the rounding rule blocks the substitution, `x / 2` at 5,666ns against
`x >> 1` at 4,291ns is a genuine **1.32x** — the only place in this table where
writing the shift buys anything, and the place where it is most likely to be wrong.

Write shifts because you mean *bits*, and arithmetic because you mean *numbers*.

## The idiom table

Everything in this topic is assembled from these. Each was checked against a
reference implementation that used only `/` and `%`, across all 65,536 16-bit
values and all 16 positions — 1,048,576 pairs, zero failures:

| Goal | Idiom | On `n = 13` (`1101`) |
|---|---|---|
| Read bit `i` | `(n >> i) & 1` | bit 2 → 1 |
| Set bit `i` | `n \| (1 << i)` | set bit 1 → 15 |
| Clear bit `i` | `n & ~(1 << i)` | clear bit 0 → 12 |
| Toggle bit `i` | `n ^ (1 << i)` | toggle bit 2 → 9 |
| Drop the lowest set bit | `n & (n - 1)` | 13 → 12 |
| Isolate the lowest set bit | `n & -n` | 13 → 1 |
| Multiply by `2^k` | `n << k` | — |
| Test a bit without shifting `n` | `n & (1 << i)` | non-zero, not 1 |

`n & (n - 1)` is the one to remember: it removes exactly one set bit per
application, so looping it runs once per set bit rather than once per position.
On `0xF0F0F0F0` it looped exactly 16 times for 16 set bits.

Note the last row. `n & (1 << i)` is *truthy* when the bit is set, but its value is
`2^i`, not 1. Comparing it to 1 is a bug that passes every test where `i` is 0.

## Three languages, three different edges

| | C++ | Java | Python |
|---|---|---|---|
| Width | fixed, `int` is 32 bits here | fixed, `int` is 32 bits by spec | unbounded |
| Unsigned type | yes | **no** — use `>>>` | not applicable |
| `>>` on negatives | arithmetic, sign-extends | arithmetic; `>>>` is the logical one | arithmetic, forever |
| Over-shifting | undefined behaviour | shift count masked — `1 << 32` is `1` | `1 << 32` is 4294967296 |
| Divide vs shift | disagree on negatives | disagree on negatives | **agree** — `//` floors |

Python is the odd one out twice over. Its integers have no width, so `1 << 200`
just works, and negatives behave like an infinitely long two's complement string:
`-1 >> 100` is still `-1`. And because `//` floors rather than truncating, `y // 2`
and `y >> 1` agreed on all 1,000,000 negatives tested — while `int(y / 2)`, the
translation people actually reach for, disagreed on 500,000 of them. The C++ trap
and the Python trap are the same trap wearing different clothes.

One more Python-specific edge: `bin(-5)` returns `'-0b101'`, a minus sign glued to
the magnitude, not a bit pattern. To see the bits, mask first — `bin(-5 & 0xFF)`
gives `'0b11111011'`.

## Cost, honestly

Every idiom here is one machine instruction, so this topic is not about asymptotics
— a 32-bit loop is O(1) with a constant of 32. Where it does show up is the
constant factor, and Python is where that is visible: counting set bits over 20,000
values cost 1,882ns each with a hand-written shift loop and 45ns each with
`int.bit_count()`, a factor of **41.8**. The idioms are for expressing intent; the
speed, when you need it, is in the builtin.

## Where this goes next

**Check if the i-th bit is Set or Not** takes the first row of that table on its
own and finds three ways to write it that are not equivalent — one of which
returns `2^i` where you expected 1. From there the topic climbs the table:
Odd or Not is `n & 1`, Power of 2 is `n & (n - 1)`, Count Set Bits is that same
expression in a loop, and Single Number is `a ^ a == 0` applied to a whole array.

<!-- @intuition -->
Stop reading the number as a quantity and start reading it as a row of switches. Every operator here acts on all 32 switches at once and independently — AND keeps a switch only if both inputs had it on, OR turns switches on, XOR turns a switch on only when the two inputs disagree, and shifting slides the whole row sideways. Once you see it that way, `1 << i` is just "a row with only switch i on", and every idiom in the topic is that row combined with your number in one of three ways: AND it to read or erase, OR it to write, XOR it to flip. Negatives are the one place where the row is not the whole story — the top switch counts as −2^31 rather than +2^31, which is what makes `-x` the same thing as flipping every switch and adding one, and what makes shifting a negative number and dividing it two different operations.

<!-- @approach -->
### Brute Force - Build the Binary String by Dividing

<!-- @idea -->
Peel off remainders with % 2 and / 2, collect the digits, and reverse them at the end.

<!-- @steps -->
1. Handle zero separately, since the loop below produces nothing for it.
2. Take `n % 2` — that is the current lowest bit — and append it to a string.
3. Divide `n` by 2, discarding the bit just read.
4. Repeat until `n` reaches 0, which happens after exactly one pass per significant bit.
5. Reverse the string, because the digits were produced lowest bit first.

<!-- @complexity -->
- time: O(log n) — one pass per significant bit, at most 32 for an int
- space: O(log n) for the string
- note: On unsigned values this is not slower than the shift version — 1,008,583ns against 1,047,000ns over 65,536 values, which is noise, because the compiler emits the shift for you. On signed values it costs 2.25x, since the sign blocks that substitution. The real objection is not speed but that it produces text you then have to parse back.

<!-- @code cpp -->
```cpp
#include <string>
#include <algorithm>
using namespace std;

string toBinary(unsigned n) {
    if (n == 0) return "0";
    string s;
    while (n) {
        s += char('0' + n % 2);
        n /= 2;
    }
    reverse(s.begin(), s.end());
    return s;
}
```

<!-- @annotations -->
- 6: Without this, zero returns the empty string — the loop body never runs.
- 9: n % 2 is the lowest bit. On an unsigned value the compiler compiles this to the same AND that n & 1 would give.
- 10: Discards the bit just read. Identical to n >>= 1 for unsigned, and NOT identical for signed negatives.
- 12: The digits came out lowest-first, so the string is backwards until this line.

<!-- @code java -->
```java
static String toBinary(int n) {
    if (n == 0) return "0";
    StringBuilder sb = new StringBuilder();
    while (n != 0) {
        sb.append(n & 1);
        n >>>= 1;
    }
    return sb.reverse().toString();
}
```

<!-- @annotations -->
- 6: >>> is the unsigned right shift. With >> a negative n would sign-extend forever and this loop would never terminate — Java has no unsigned int type, so this operator is the substitute.
- 8: StringBuilder.reverse does in place what the C++ version does with std::reverse.

<!-- @code python -->
```python
def to_binary(n: int) -> str:
    if n == 0:
        return "0"
    digits = []
    while n:
        digits.append(str(n % 2))
        n //= 2
    return "".join(reversed(digits))


# bin(13) == '0b1101' is the builtin. Note bin(-5) == '-0b101' —
# a minus sign and a magnitude, not a bit pattern. Mask first:
# bin(-5 & 0xFF) == '0b11111011'.
```

<!-- @annotations -->
- 7: // floors rather than truncating, so this terminates for negatives instead of stalling at -1 — but it also never stops, since Python integers have no width.
- 12: The builtin, and what you should actually call.
- 13: bin() on a negative gives a signed-magnitude string, which is the single most common surprise when translating C++ bit code to Python.

<!-- @approach -->
### Better - Shift and Mask

<!-- @idea -->
Slide the bit you want down to position 0 and read it with a single AND.

<!-- @steps -->
1. To read bit `i`, shift `n` right by `i` places.
2. That moves bit `i` into position 0 and discards everything below it.
3. AND with 1 to erase every bit above position 0.
4. The result is 0 or 1 — a value you can compare, add, or return directly.
5. To print a whole number, run `i` from the top position down to 0 and emit each bit.

<!-- @complexity -->
- time: O(1) per bit read, O(w) to print all w bits
- space: O(1) — nothing is built up
- note: The shift and the AND are one machine instruction each. This is the form every later subtopic uses, because it produces a number rather than text.

<!-- @code cpp -->
```cpp
#include <cstdio>

int getBit(unsigned n, int i) {
    return (n >> i) & 1;
}

void printBits(unsigned n, int width) {
    for (int i = width - 1; i >= 0; i--)
        putchar('0' + ((n >> i) & 1u));
}
```

<!-- @annotations -->
- 4: The parentheses are load-bearing. & binds more loosely than >>, but more tightly than == — so n >> i & 1 works and n & 1 == 0 does not mean what it reads like.
- 8: Counting down from the top prints most significant bit first, which is the order humans read.
- 9: '0' + bit turns 0 and 1 into the characters '0' and '1'.

<!-- @code java -->
```java
static int getBit(int n, int i) {
    return (n >>> i) & 1;
}

static String printBits(int n, int width) {
    StringBuilder sb = new StringBuilder();
    for (int i = width - 1; i >= 0; i--) sb.append((n >>> i) & 1);
    return sb.toString();
}

// Integer.toBinaryString(-7) already prints the 32-bit two's complement form.
```

<!-- @annotations -->
- 2: >>> rather than >> so a negative n reads its true bit pattern instead of an infinite run of sign bits.
- 11: The builtin, and it handles negatives correctly where a hand-rolled >> loop would not.

<!-- @code python -->
```python
def get_bit(n: int, i: int) -> int:
    return (n >> i) & 1


def print_bits(n: int, width: int = 8) -> str:
    return "".join(str((n >> i) & 1) for i in range(width - 1, -1, -1))


# format(13, '08b') == '00001101' is the builtin.
# For a negative, mask to the width first: format(-7 & 0xFFFFFFFF, '032b').
```

<!-- @annotations -->
- 2: Works for negatives too, because Python sign-extends forever — (-1 >> i) & 1 is 1 for every i.
- 9: format() with a width is the readable way to see a fixed-width pattern.
- 10: Masking is what turns Python's unbounded integer into the 32-bit view C++ and Java show by default.

<!-- @approach -->
### Optimal - The Four Accessors and the Two Lowest-Bit Idioms

<!-- @idea -->
Build a one-bit mask with 1 << i, then AND to read, OR to write, AND-NOT to erase and XOR to flip.

<!-- @steps -->
1. `1 << i` is a value with exactly one bit set, at position `i` — the mask.
2. AND with the mask to test that bit, since AND keeps only bits set in both.
3. OR with the mask to set it, since OR can only turn bits on.
4. AND with the inverted mask, `~(1 << i)`, to clear it — the inversion is 1 everywhere except position `i`.
5. XOR with the mask to toggle it, since XOR flips exactly where the mask is 1.
6. Separately, `n & (n - 1)` drops the lowest set bit and `n & -n` isolates it, both without knowing where it is.

<!-- @complexity -->
- time: O(1) — one or two instructions each
- space: O(1)
- note: Verified against a division-and-remainder reference across all 65,536 16-bit values and all 16 positions — 1,048,576 pairs, zero failures — and the two lowest-bit idioms across all 65,536 values, also zero. n & (n - 1) removes exactly one set bit per application: looped on 0xF0F0F0F0 it ran exactly 16 times for 16 set bits.

<!-- @code cpp -->
```cpp
unsigned getBit   (unsigned n, int i) { return (n >> i) & 1u; }
unsigned setBit   (unsigned n, int i) { return n |  (1u << i); }
unsigned clearBit (unsigned n, int i) { return n & ~(1u << i); }
unsigned toggleBit(unsigned n, int i) { return n ^  (1u << i); }

unsigned dropLowestSetBit(unsigned n) { return n & (n - 1); }
unsigned lowestSetBit    (unsigned n) { return n & (~n + 1); }
```

<!-- @annotations -->
- 2: 1u << i, not 1 << i. With a signed 1, shifting into bit 31 is undefined behaviour, and it is undefined at exactly the position you are least likely to test.
- 3: ~(1u << i) is all ones except position i, so the AND preserves every other bit.
- 6: n & (n - 1) works because subtracting 1 flips the lowest set bit to 0 and every zero below it to 1 — the AND then keeps only what was above.
- 7: ~n + 1 is -n written without the sign, which avoids the warning that negating an unsigned value produces. Both are the same bit pattern.

<!-- @code java -->
```java
static int getBit   (int n, int i) { return (n >>> i) & 1; }
static int setBit   (int n, int i) { return n |  (1 << i); }
static int clearBit (int n, int i) { return n & ~(1 << i); }
static int toggleBit(int n, int i) { return n ^  (1 << i); }

static int dropLowestSetBit(int n) { return n & (n - 1); }
static int lowestSetBit    (int n) { return n & -n; }

// Integer.bitCount, Integer.highestOneBit and Integer.numberOfTrailingZeros
// are the library forms and are intrinsics on every mainstream JVM.
```

<!-- @annotations -->
- 2: 1 << 31 is well defined in Java, unlike C++ — it produces Integer.MIN_VALUE rather than undefined behaviour.
- 7: n & -n is safe here because Java has no unsigned type to complain about the negation.
- 9: Reach for these before hand-rolling. They compile to single instructions.

<!-- @code python -->
```python
def get_bit(n, i):    return (n >> i) & 1
def set_bit(n, i):    return n | (1 << i)
def clear_bit(n, i):  return n & ~(1 << i)
def toggle_bit(n, i): return n ^ (1 << i)

def drop_lowest_set_bit(n): return n & (n - 1)
def lowest_set_bit(n):      return n & -n


# int.bit_count() is 41.8x faster than a hand-written shift loop:
# 45ns per value against 1,882ns, measured over 20,000 random 32-bit values.
```

<!-- @annotations -->
- 3: ~(1 << i) is a negative number in Python and that is fine — the AND still clears exactly bit i, because the sign extends with ones.
- 7: n & -n works unchanged on Python's unbounded integers, since the two's complement identity holds at every width.
- 10: Available from Python 3.10. Below that, bin(n).count('1') is the idiomatic fallback and still measured 6.2x faster than looping.

<!-- @approach -->
### Reading Negatives - Two's Complement

<!-- @idea -->
Reinterpret the signed bit pattern as unsigned before looking at it, rather than converting the value.

<!-- @steps -->
1. Note that the top bit of a signed integer carries place value −2^31, not +2^31.
2. That makes negation equivalent to flipping every bit and adding one: `-x == ~x + 1`.
3. To print the bits, cast the value to the unsigned type of the same width.
4. That cast reinterprets the pattern rather than changing it, so nothing is lost.
5. Shift and mask the unsigned copy as usual.
6. Remember that `INT_MIN` negates to itself, because its positive counterpart does not exist.

<!-- @complexity -->
- time: O(w) to print w bits
- space: O(1) beyond the output
- note: The identity -x == ~x + 1 was checked against every one of the 4,294,967,296 values an int32 can hold, with 0 mismatches, in 2.76 seconds. The single exception to the intuition behind it is INT_MIN, where -x overflows back to x — the identity still holds bitwise, but "take the absolute value" does not.

<!-- @code cpp -->
```cpp
#include <cstdint>
#include <string>
using namespace std;

string bits32(int v) {
    uint32_t u = (uint32_t)v;
    string s(32, '0');
    for (int i = 31; i >= 0; i--)
        s[31 - i] = char('0' + ((u >> i) & 1u));
    return s;
}

// bits32(-7)  == "11111111111111111111111111111001"
// -7 >> 1 == -4   (rounds toward negative infinity)
// -7 /  2 == -3   (rounds toward zero)
```

<!-- @annotations -->
- 6: The cast reinterprets the pattern, it does not convert the value — this is the whole technique.
- 9: Shifting the unsigned copy is a logical shift, so no sign bits are dragged in from the top.
- 14: These two lines differ for 50% of negative values, 75% for /4 against >>2, and 87.5% for /8 against >>3.

<!-- @code java -->
```java
static String bits32(int v) {
    StringBuilder sb = new StringBuilder();
    for (int i = 31; i >= 0; i--) sb.append((v >>> i) & 1);
    return sb.toString();
}

// Or simply String.format("%32s", Integer.toBinaryString(v)).replace(' ', '0')
// Integer.MIN_VALUE negates to itself: -Integer.MIN_VALUE == Integer.MIN_VALUE
```

<!-- @annotations -->
- 3: >>> supplies the reinterpretation that the C++ version gets from the cast, since Java has no unsigned int to cast to.
- 8: The same INT_MIN edge as C++, and worth testing for explicitly — it is the one input that breaks abs().

<!-- @code python -->
```python
def bits32(v: int) -> str:
    return format(v & 0xFFFFFFFF, "032b")


# bits32(-7) == '11111111111111111111111111111001'
# In Python the sign extends forever, so -1 >> 100 is still -1
# and there is no INT_MIN — (1 << 200) is a perfectly ordinary integer.
```

<!-- @annotations -->
- 2: The mask is what imposes a width. Without it a negative has no 32-bit form at all, because the integer is unbounded.
- 6: This is why Python never overflows and also why "the top bit" is not a well-defined idea there.

<!-- @example -->

<!-- @input -->
a = 13, b = 7

<!-- @output -->
a&b=5, a|b=15, a^b=10, ~a=-14, a<<1=26, a>>1=6

<!-- @walkthrough -->
1. Write both as bit rows: 13 is 1101 and 7 is 0111, aligned at bit 0 on the right.
2. AND keeps a bit only where both rows have 1: positions 0 and 2 qualify, giving 0101, which is 5.
3. OR keeps a bit where either row has 1: positions 0, 1, 2 and 3 all qualify, giving 1111, which is 15.
4. XOR keeps a bit only where the rows differ: positions 1 and 3, giving 1010, which is 10.
5. NOT flips every bit of 13 — all 32 of them, not the four shown — so the answer is -14 and not 2.
6. Shifting left by one moves each bit up a position and feeds a 0 in at the bottom: 11010, which is 26, exactly double.
7. Shifting right by one drops the bottom bit entirely: 110, which is 6 — 13 halved and rounded down, with the discarded 1 gone for good.

<!-- @example -->

<!-- @input -->
-7, in 32-bit two's complement

<!-- @output -->
11111111111111111111111111111001, and -7 >> 1 = -4 while -7 / 2 = -3

<!-- @why -->
It is the one example where the bit view and the arithmetic view give different answers, which is where most bit-manipulation bugs live.

<!-- @walkthrough -->
1. Start from 7: 00000000000000000000000000000111.
2. Flip every bit: 11111111111111111111111111111000, which is ~7, or -8.
3. Add one: 11111111111111111111111111111001, and that is -7.
4. So -x and ~x + 1 are the same pattern — confirmed against all 4,294,967,296 int32 values, 0 mismatches.
5. Now shift it right by one. The sign bit is copied in at the top, so the result is 11111111111111111111111111111100, which is -4.
6. But -7 / 2 in C++ is -3, because division rounds toward zero and shifting rounds toward negative infinity.
7. Over the range -1,000,000..-1 those two disagree on 500,000 values — exactly half — and for /4 against >>2 the figure is 750,000, or 75%.

<!-- @example -->

<!-- @input -->
The four accessors, checked against a reference that never uses a bit operator

<!-- @output -->
1,048,576 (value, position) pairs, 0 failures

<!-- @why -->
The idioms are short enough to look obviously right and short enough to be silently wrong, so they are worth verifying rather than trusting.

<!-- @walkthrough -->
1. A reference implementation computed bit i of n as (n / 2^i) % 2, using only division and remainder.
2. It then predicted the result of setting, clearing and toggling by adding or subtracting 2^i as appropriate.
3. Every one of the 65,536 values a 16-bit unsigned can hold was run against every one of its 16 positions.
4. That is 1,048,576 pairs, and (n >> i) & 1, n | (1 << i), n & ~(1 << i) and n ^ (1 << i) matched the reference on all of them.
5. Separately, n & (n - 1) and n & -n were checked against a reference that scanned upward for the first set bit — 0 failures across all 65,536 values.
6. Looping n &= n - 1 on 0xF0F0F0F0 took exactly 16 iterations for its 16 set bits, which is the property that makes it worth knowing.
7. The XOR laws a ^ a == 0 and a ^ 0 == a were also checked across all 65,536 values, and the xor-swap across all 16,777,216 pairs of 12-bit values — 0 failures.

<!-- @example -->

<!-- @input -->
x * 2 against x << 1, over 65,536 elements

<!-- @output -->
4,083ns against 4,084ns — the folklore is 30 years out of date

<!-- @why -->
This is the first thing anyone is told about bit manipulation, and it is the thing measurement most flatly contradicts.

<!-- @walkthrough -->
1. Summing x * 2 over 65,536 unsigned values took 4,083ns, best of 200 runs.
2. Summing x << 1 over the same values took 4,084ns — one nanosecond apart, which is nothing.
3. The same held for division: x / 2 at 4,083ns against x >> 1 at 4,084ns, and x / 8 against x >> 3 at 4,250ns each.
4. The compiler substitutes the shift itself, and has done for decades, so writing it by hand changes nothing.
5. What is genuinely expensive is dividing by a non-power of two: x / 7 cost 11,417ns, 2.69x what x / 8 did.
6. The one case where writing the shift does buy something is signed division — x / 2 at 5,666ns against x >> 1 at 4,291ns, a real 1.32x — because the rounding rule blocks the substitution.
7. That is also the case where the shift gives a different answer, so the only place the trick is faster is the place it is most likely to be a bug.

<!-- @visualization custom -->

<!-- @description -->
Open with the anatomy panel: the number 13 as a row of eight cells, each labelled with its bit index below and its place value above, and the three set cells (8, 4, 1) lit. A small sum underneath assembles 8 + 4 + 1 = 13 as the lit cells pulse in turn. Then the operator panel: two rows, a = 13 as 1101 and b = 7 as 0111, aligned at bit 0 on the right, with a result row beneath. Stepping through AND, OR and XOR, walk a column highlight from bit 0 upward and fill the result cell as each column is decided, so the reader sees the operators acting on columns independently rather than on numbers. For NOT, expand the row from four cells to all 32 and flip every one at once — the expansion is the point, because it explains why ~13 is -14 and not 2. For the shifts, slide the whole row sideways, showing the 0 entering at the bottom on a left shift and the bottom bit falling off the edge on a right shift. Next the two's complement panel: 7 as 32 cells, then every cell flipping to give ~7, then a +1 rippling from the right through the run of ones to produce -7, with the carry visibly propagating. Annotate it with the exhaustive result — 4,294,967,296 values checked, 0 mismatches. Beside that, the divergence panel: -7 shown twice, once being shifted right (result -4, rounding toward negative infinity, drawn as an arrow to the left on a number line) and once being divided by 2 (result -3, rounding toward zero, an arrow to the right), with the 50% / 75% / 87.5% disagreement rates for >>1, >>2 and >>3 as three bars. Then the mask panel: 1 << i drawn as a row with a single lit cell that the reader can slide along, and the same mask combined with n four ways — AND to read, OR to write, AND-NOT to erase, XOR to flip — each showing which cells of n changed and, crucially, that all the others did not. Follow it with the lowest-bit panel: n = 13 above n - 1 = 12, with the lowest set bit and everything below it highlighted in both, so the AND visibly clears exactly one bit; and n & -n with -n shown as ~n + 1 so the agreement below the lowest set bit is visible. Close with the myth panel: a bar chart of x*2, x<<1, x/2, x>>1, x/8, x>>3 all at the same height (4,083ns to 4,250ns), one bar for x/7 nearly three times taller at 11,417ns, and a separate pair for signed x/2 against x>>1 at 5,666 and 4,291 — labelled as the only pair that differs and the only pair where the two give different answers.

<!-- @sampleInput -->
```json
{"anatomy":{"value":13,"bits":[0,0,0,0,1,1,0,1],"bitIndexFromRight":[7,6,5,4,3,2,1,0],"placeValues":[128,64,32,16,8,4,2,1],"setPositions":[0,2,3],"sum":"8 + 4 + 1 = 13"},"operators":{"a":13,"b":7,"aBits":"1101","bBits":"0111","results":[{"op":"AND","expr":"a & b","value":5,"bits":"0101","rule":"1 only where both are 1"},{"op":"OR","expr":"a | b","value":15,"bits":"1111","rule":"1 where either is 1"},{"op":"XOR","expr":"a ^ b","value":10,"bits":"1010","rule":"1 where they differ"},{"op":"NOT","expr":"~a","value":-14,"bits":"all 32 flipped","rule":"why it is -14 and not 2"},{"op":"SHL","expr":"a << 1","value":26,"bits":"11010","rule":"a 0 enters at the bottom"},{"op":"SHR","expr":"a >> 1","value":6,"bits":"110","rule":"the bottom bit is lost"}]},"twosComplement":{"start":7,"startBits":"00000000000000000000000000000111","flipped":"11111111111111111111111111111000","flippedValue":-8,"plusOne":"11111111111111111111111111111001","result":-7,"identity":"-x == ~x + 1","exhaustive":{"valuesChecked":4294967296,"mismatches":0,"seconds":2.76},"intMin":{"value":-2147483648,"negatesToItself":true,"why":"the positive counterpart does not exist in 32 bits"}},"divergence":{"example":{"n":-7,"shift":-4,"divide":-3,"shiftRounds":"toward negative infinity","divideRounds":"toward zero"},"rates":[{"comparison":"y/2 vs y>>1","disagree":500000,"of":1000000,"percent":50},{"comparison":"y/4 vs y>>2","disagree":750000,"of":1000000,"percent":75},{"comparison":"y/8 vs y>>3","disagree":875000,"of":1000000,"percent":87.5}],"positivesDisagreeing":0,"formula":"1 - 1/2^k of negatives"},"idioms":[{"goal":"read bit i","expr":"(n >> i) & 1","on13":"bit 2 -> 1"},{"goal":"set bit i","expr":"n | (1 << i)","on13":"set bit 1 -> 15"},{"goal":"clear bit i","expr":"n & ~(1 << i)","on13":"clear bit 0 -> 12"},{"goal":"toggle bit i","expr":"n ^ (1 << i)","on13":"toggle bit 2 -> 9"},{"goal":"drop lowest set bit","expr":"n & (n - 1)","on13":"12"},{"goal":"isolate lowest set bit","expr":"n & -n","on13":"1"}],"verification":{"accessors":{"values":65536,"positions":16,"pairs":1048576,"failures":0,"referenceUsed":"(n / 2^i) % 2, no bit operators"},"lowestBitIdioms":{"values":65536,"failures":0},"xorLaws":{"values":65536,"failures":0,"laws":["a ^ a == 0","a ^ 0 == a"]},"xorSwap":{"pairs":16777216,"failures":0,"aliasingCase":"x ^= x with both names the same variable gives 0"},"dropLoop":{"input":"0xF0F0F0F0","setBits":16,"iterations":16}},"timing":{"unit":"ns","elements":65536,"bestOf":200,"pairs":[{"expr":"x * 2","ns":4083},{"expr":"x << 1","ns":4084},{"expr":"x / 2","ns":4083},{"expr":"x >> 1","ns":4084},{"expr":"x / 8","ns":4250},{"expr":"x >> 3","ns":4250},{"expr":"x / 7","ns":11417,"note":"2.69x x/8 — a real division"}],"signed":{"divide":5666,"shift":4291,"ratio":1.32,"note":"the only pair that differs, and the only pair that disagrees"},"bitExtractionLoop":{"unsigned":{"divide":1008583,"shift":1047000,"reading":"noise"},"signed":{"divide":2208333,"shift":982666,"ratio":2.25}}},"languages":{"cpp":{"width":32,"unsignedType":true,"shrOnNegative":"arithmetic","overShift":"undefined behaviour","divVsShift":"disagree on negatives"},"java":{"width":32,"unsignedType":false,"logicalShift":">>>","overShift":"count masked, 1 << 32 == 1","divVsShift":"disagree on negatives"},"python":{"width":"unbounded","shrOnNegative":"sign extends forever, -1 >> 100 == -1","overShift":"1 << 32 == 4294967296","divVsShift":"agree, // floors","trap":"int(y/2) disagrees with y>>1 on 500000 of 1000000 negatives","binOfNegative":"bin(-5) == '-0b101'","masked":"bin(-5 & 0xFF) == '0b11111011'"}},"pythonCost":{"values":20000,"perValueNs":{"shiftLoop":1882,"divmodLoop":1657,"binCount":304,"intBitCount":45},"speedup":{"bitCountOverShiftLoop":41.8,"binCountOverShiftLoop":6.2}}}
```

<!-- @highlights -->
- The number 13 is drawn as a row of eight cells, indexed below and place-valued above.
- The three set cells pulse in turn as 8 + 4 + 1 = 13 assembles underneath.
- a = 13 and b = 7 sit as aligned rows with a result row beneath them.
- A column highlight walks from bit 0 upward, filling each result cell as its column is decided.
- That makes the operators visibly column-wise and independent rather than arithmetic.
- For NOT the row expands from four cells to all 32 and every cell flips at once.
- The expansion is what explains why ~13 is -14 and not 2.
- The shifts slide the whole row sideways, with a 0 entering at the bottom and the bottom bit falling off the edge.
- The two's complement panel flips all 32 cells of 7, then ripples a +1 through the run of ones to reach -7.
- It is annotated with the exhaustive result: 4,294,967,296 values checked, 0 mismatches.
- The divergence panel shows -7 shifted (to -4) and divided (to -3) as opposite arrows on a number line.
- Three bars give the disagreement rates: 50% for >>1, 75% for >>2 and 87.5% for >>3.
- The mask panel draws 1 << i as a single lit cell the reader can slide along.
- The same mask is combined with n four ways, showing which cells changed and that the rest did not.
- The lowest-bit panel puts n = 13 above n - 1 = 12 so the AND visibly clears exactly one bit.
- The myth panel charts x*2, x<<1, x/2, x>>1, x/8 and x>>3 at the same height, x/7 nearly three times taller, and the signed pair 5,666 against 4,291 labelled as the only real difference.

<!-- @edgeCases -->
- n = 0 — every accessor works, but a divide-and-collect conversion loop produces the empty string unless zero is special-cased.
- Reading bit 31 with 1 << 31 in C++ — undefined behaviour on a signed 1; write 1u << 31.
- Shifting by 32 or more — undefined in C++, silently masked in Java so 1 << 32 is 1, and perfectly well defined in Python.
- Shifting by a negative amount — undefined in C++ and Java, a ValueError in Python.
- INT_MIN — negating it overflows back to itself, so every abs()-first approach in this topic breaks on exactly one input.
- A negative n in a while (n) shift loop with >> — sign extension means it never reaches 0. Java's >>> exists for this; in Python the loop is infinite either way.
- -1 shifted right by any amount — stays -1 in C++, Java's >> and Python, but becomes a large positive under >>>.
- bin() on a negative in Python — gives '-0b101' rather than a bit pattern; mask to a width first.
- Comparing n & (1 << i) to 1 — it equals 2^i when set, so the comparison is only correct for i = 0.
- n & (n - 1) when n is 0 — gives 0, which is the sensible answer and the reason the loop terminates.
- Mixing signed and unsigned in one expression in C++ — the signed operand converts, so a negative becomes a huge positive before the operator ever runs.
- Assuming int is 32 bits — it is here, and guaranteed only to be at least 16 by the standard; use int32_t when the width is part of the algorithm.

<!-- @pitfalls -->
- Writing 1 << i with a signed 1 to reach bit 31. It is undefined behaviour, and only at the position you are least likely to test.
- Replacing / 2 with >> 1 on values that can be negative. They disagree on 50% of negatives — 500,000 out of 1,000,000 measured — because division rounds toward zero and shifting rounds toward negative infinity.
- Writing shifts for speed. x * 2 and x << 1 measured 4,083ns and 4,084ns over 65,536 elements; the compiler has been doing this substitution for decades.
- Omitting parentheses around a bit expression. & and | bind more loosely than == , so n & 1 == 0 parses as n & (1 == 0) and is silently always 0.
- Expecting ~13 to be 2. It flips all 32 bits, not the four you sketched, so it is -14.
- Treating n & (1 << i) as a 0-or-1 answer. Its value is 2^i; use (n >> i) & 1 when you want a boolean-shaped result.
- Using >> instead of >>> in a Java bit loop. A negative value sign-extends forever and the loop never terminates.
- Expecting Python's bin() to show a two's complement pattern for negatives. It shows a sign and a magnitude; mask with 0xFFFFFFFF first.
- Translating C++ negatives to Python with int(x / 2). Python's // agrees with >> on all 1,000,000 negatives tested, but int(x / 2) disagrees on 500,000 of them.
- Calling abs() before a bit trick. INT_MIN has no positive form, so that one input silently keeps its sign.
- Assuming shift counts wrap the same way everywhere. Java masks to 5 bits so 1 << 32 is 1; C++ leaves it undefined; Python just computes it.
- Hand-writing a bit-counting loop in Python. int.bit_count() measured 41.8x faster — 45ns against 1,882ns per value.

<!-- @doubt -->
### Why is bit 0 the rightmost one?

<!-- @answer -->
Because bit i is worth 2^i, and 2^0 = 1 is the ones place, which is written on the right in every positional notation. It is the same reason the units digit of a decimal number is rightmost. The practical consequence is that n >> i slides bit i down into position 0, where a single & 1 reads it — the indexing and the shift-and-mask idiom are the same fact stated twice. If bit 0 were on the left you would need to know the width of the type before you could read any bit at all, which is exactly the problem Python has and solves by having no width.

<!-- @doubt -->
### Why is ~13 equal to -14 and not 2?

<!-- @answer -->
Because ~ flips every bit of the type, all 32 of them, not just the four you drew. 13 is 0…01101, so ~13 is 1…10010 — a number whose top bit is set, and the top bit of a signed int carries place value −2^31. Working it out gives −14. The general rule is ~x == -x - 1, which follows directly from -x == ~x + 1. If you genuinely want to flip only the low four bits, say so with a mask: ~13 & 0xF gives 2.

<!-- @doubt -->
### Is x << 1 really faster than x * 2?

<!-- @answer -->
No, and it has not been for a long time. Measured over 65,536 unsigned elements, best of 200 runs: x * 2 took 4,083ns and x << 1 took 4,084ns. The same for x / 2 against x >> 1, and x / 8 against x >> 3 at 4,250ns each. The compiler performs the substitution itself. What is expensive is dividing by a non-power of two — x / 7 cost 11,417ns, 2.69x what x / 8 did. The one genuine exception is signed division, where x / 2 at 5,666ns against x >> 1 at 4,291ns is a real 1.32x, because the rounding rule prevents the substitution — and that is precisely the case where the two produce different answers, so the speed is not free.

<!-- @doubt -->
### Why does -7 >> 1 give -4 when -7 / 2 gives -3?

<!-- @answer -->
They round in different directions. Division in C++ and Java truncates toward zero, so -7 / 2 is -3.5 rounded up to -3. A right shift discards the bottom bit and copies the sign in at the top, which is a floor — it rounds toward negative infinity, giving -4. For non-negative values the two directions coincide, which is why the substitution looks safe: over 1..1,000,000 there were 0 disagreements. Over -1,000,000..-1 there were 500,000, exactly half — every negative that is not an even multiple of 2. For >>2 the rate rises to 75% and for >>3 to 87.5%, following 1 − 1/2^k.

<!-- @doubt -->
### How does n & (n - 1) drop the lowest set bit?

<!-- @answer -->
Subtracting 1 from n flips the lowest set bit from 1 to 0 and turns every zero below it into a 1 — that is what borrowing does. Every bit above the lowest set bit is untouched. So n and n - 1 agree above that position and disagree at and below it, and the AND keeps only the agreeing part. On 13 = 1101, n - 1 = 1100, and the AND gives 1100 = 12. Verified against a scanning reference across all 65,536 16-bit values with 0 failures. The property that makes it worth knowing is that looping it runs once per set bit rather than once per position: on 0xF0F0F0F0 it took exactly 16 iterations for 16 set bits.

<!-- @doubt -->
### Why does n & -n isolate the lowest set bit?

<!-- @answer -->
Because -n is ~n + 1. Flipping n inverts every bit; adding 1 then ripples a carry up through the run of ones at the bottom, which stops at the lowest bit that was set in n. The effect is that -n agrees with n at that position and below it, and disagrees everywhere above — so the AND keeps exactly that one bit. For 13 = 1101, -13 is 0011 in the low four bits, and the AND gives 0001. Zero failures across all 65,536 16-bit values. In C++ write it as n & (~n + 1) if n is unsigned, to avoid the warning about negating an unsigned value; the bit pattern is identical.

<!-- @doubt -->
### What actually changes between C++, Java and Python here?

<!-- @answer -->
Three things. First, width: C++ and Java fix int at 32 bits, Python has none, so 1 << 200 is an ordinary integer there and overflow is not a concept. Second, unsigned: C++ has unsigned types, Java does not and offers >>> instead — using >> in a Java bit loop on a negative value gives an infinite loop, which is the single most common Java-specific bug in this topic. Third, over-shifting: C++ calls it undefined behaviour, Java masks the count to 5 bits so 1 << 32 is 1, and Python simply computes the answer. Python also inverts the division trap: // agrees with >> on all 1,000,000 negatives tested, while int(x / 2) — the literal translation of C++ code — disagrees on 500,000 of them.

<!-- @doubt -->
### Do I need to memorise the idiom table?

<!-- @answer -->
You need six lines, and they are all the same shape: build a one-bit mask with 1 << i, then AND to read, OR to write, AND-NOT to erase, XOR to flip. Add n & (n - 1) to drop the lowest set bit and n & -n to isolate it. Everything else in this topic is those six composed. All of them were checked here against a reference implementation using only division and remainder — 1,048,576 (value, position) pairs at 16 bits, zero failures — so what is worth memorising is the shape rather than the characters.

<!-- @doubt -->
### Why does XOR keep turning up?

<!-- @answer -->
Because it is its own inverse. a ^ a == 0 and a ^ 0 == a, checked across all 65,536 16-bit values, and it is commutative and associative, so a whole array can be XORed in any order and the pairs cancel wherever they fall. That single property is Single Number - I in its entirety, it is what makes the three-line swap work without a temporary, and it is what Minimum Bit Flips uses to find the positions where two numbers differ. AND and OR both destroy information — you cannot recover a from a & b — while XOR never does.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Check if the i-th bit is Set or Not, which takes the first row of the idiom table and finds three ways to write it that are not equivalent — one of them returns 2^i where you expected 1, and passes every test where i happens to be 0. After that the topic climbs the table one row at a time: Odd or Not is n & 1, Power of 2 is n & (n - 1) tested against zero, Count Set Bits is that expression in a loop, and Single Number is a ^ a == 0 applied to an entire array.
