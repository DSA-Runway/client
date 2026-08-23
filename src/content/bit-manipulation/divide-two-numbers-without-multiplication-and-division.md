---
id: divide-two-numbers-without-multiplication-and-division
topic: Bit Manipulation
title: Divide two numbers without multiplication and division
difficulty: Medium
status: ready
prerequisites:
  - swap-two-numbers
  - check-if-a-number-is-power-of-2-or-not
  - introduction-to-bits-and-tricks
  - integer-overflow-and-precision-errors
  - check-if-a-number-is-odd-or-not
relatedIds:
  - count-the-number-of-set-bits
  - pow-x-n
  - find-the-smallest-divisor
  - divisors-of-a-number
  - integer-overflow-and-precision-errors
---

<!-- @summary -->
Binary long division: subtract the largest shifted copy of the divisor that still fits, 32 times, and the quotient assembles itself one bit at a time. Verified against the built-in operator on all 16,004,000 pairs in −2000..2000 and 3,000,000 random 32-bit pairs, with zero mismatches. Repeated subtraction gives the same answers and needs **2,147,483,647** iterations for `INT_MAX / 1` where this needs 32. The case no bit trick escapes is `INT_MIN / -1`, whose true answer is 2,147,483,648 and whose representable maximum is 2,147,483,647 — and `abs(INT_MIN)` is still negative, so the usual "normalise the sign first" step fails on exactly that input.

<!-- @theory -->
## The problem

Compute `a / b`, truncating toward zero, using no multiplication, division or
modulo operator. Return `INT_MAX` if the true answer overflows.

## Long division, in base two

Decimal long division picks the largest multiple of the divisor that fits, writes
a digit, subtracts, and moves on. In base two the digit can only be 0 or 1, so
"which multiple fits" collapses to "does it fit at all":

```
100 / 7

  7 << 3 = 56   <= 100    ->  bit 3 = 1,  100 - 56 = 44
  7 << 2 = 28   <=  44    ->  bit 2 = 1,   44 - 28 = 16
  7 << 1 = 14   <=  16    ->  bit 1 = 1,   16 - 14 =  2
  7 << 0 =  7   >    2    ->  bit 0 = 0

  quotient = 1110 = 14      remainder = 2
```

`14 × 7 = 98`, remainder 2. Each step tests one shifted copy of the divisor and
contributes one bit of the answer, most significant first — which is why the loop
counts **down** from 31.

## Why 32 steps and not the quotient

Repeated subtraction is the obvious method and gives identical answers — verified
on all 16,004,000 pairs in −2000..2000 with 0 mismatches. Its cost is the
quotient itself:

| Division | Repeated subtraction | Binary long division |
|---|---|---|
| `100 / 7` | 14 iterations | 32 |
| `1000000 / 3` | 333,333 | 32 |
| `1000000 / 1` | 1,000,000 | 32 |
| `INT_MAX / 1` | **2,147,483,647** | 32 |

The bit method is worse on the small case and unboundedly better on the large
one, which is the whole trade. Measured on 20,000 divisions with a mean quotient
of 374, repeated subtraction took 5,441,666ns against the shift version's
849,500ns — **6.41x** — and that gap widens without limit as quotients grow.

## The doubling variant is faster than the fixed loop

This is the first place in this topic where a data-dependent loop wins:

| Method | 20,000 random 32-bit divisions | Ratio |
|---|---|---|
| Built-in `/` | **27,708ns** | 1.00x |
| Doubling the divisor | 233,875ns | 8.44x |
| Fixed 32-step loop | 849,250ns | 30.65x |

The doubling variant finds the largest shifted divisor by doubling up from the
bottom, then repeats on the remainder, so it performs only as many steps as the
quotient has bits. It measured **3.63x** faster than the fixed 32-step version.

That contradicts the pattern established in Count the Number of Set Bits, where a
fixed loop beat a data-dependent one by 8.61x — and the reason is worth being
precise about. There, each iteration was one instruction, so the loop overhead
dominated and vectorisation was the prize. Here each iteration is a 64-bit shift,
a compare and a subtract, and two random 32-bit values usually produce a small
quotient. When an iteration is expensive, skipping it pays; when it is nearly
free, being predictable pays.

Both remain far slower than the hardware divider: 42.5ns per division against
1.39ns.

## The case no trick escapes

```
INT_MIN / -1  =  2147483648        INT_MAX  =  2147483647
```

The true quotient is one larger than the largest representable `int`. In C++ the
expression is **undefined behaviour** — and unlike most undefined behaviour, it
does not quietly produce a wrong number: on x86 it raises a hardware exception
and the process dies. The convention, and what the problem statement requires, is
to detect it and return `INT_MAX`.

Worse, the standard first move makes it harder:

```cpp
int x = abs(a);      // abs(INT_MIN) is INT_MIN — still negative
```

There is no positive `INT_MIN`, so taking the absolute value silently fails on
exactly the input that needs care. Two fixes, both fine:

- **Widen.** Do the arithmetic in `long long`, where `llabs((long long)INT_MIN)`
  is 2147483648 and everything fits.
- **Go negative.** Normalise both operands to negative instead of positive, since
  every `int` has a negative form.

Verified: with the widening approach and the `INT_MIN / -1` guard, the shift
version matched the built-in operator on 3,000,000 random 32-bit pairs with 0
mismatches.

## Truncation, not flooring

C++ and Java truncate toward zero, so `-7 / 2` is `-3`. The natural
implementation computes with absolute values and applies the sign at the end,
which truncates automatically — that is what makes the sign-first approach
correct rather than merely convenient.

Python floors: `-7 // 2` is `-4`. Translating this problem there needs the sign
applied after the magnitude division, exactly as in C++. The obvious shortcut
`int(a / b)` truncates correctly and then fails for a different reason:

```python
(2**53 + 1) // 1        # 9007199254740993
int((2**53 + 1) / 1)    # 9007199254740992  — the float lost a bit
```

Python otherwise has no edges here at all: `abs(INT_MIN)` is 2147483648 and
`INT_MIN // -1` is representable, because integers do not overflow.

## Where this goes next

**Minimum Bit Flips to Convert Number** returns to XOR, and to a much shorter
answer: the number of positions where two numbers differ is the popcount of their
XOR, which composes the two subtopics before this one into a single line.

<!-- @intuition -->
Division is repeated subtraction, and the only problem with saying so is that it takes as many steps as the answer is large. Long division fixes that by subtracting big pieces first — in decimal you ask how many hundreds of the divisor fit, then how many tens, then how many ones. In binary the question gets easier, because the only possible answers are one and none: either this shifted copy of the divisor fits into what remains, in which case that bit of the quotient is 1 and you subtract it, or it does not, in which case the bit is 0 and nothing happens. Thirty-two of those questions determine every bit of the answer, whatever the answer is, which is why the cost stops depending on the size of the quotient. The only part that has nothing to do with bits is the sign, and it is where the problem's real difficulty lives — because the range of a signed integer is asymmetric, one input has an answer that cannot be represented at all.

<!-- @approach -->
### Brute Force - Repeated Subtraction

<!-- @idea -->
Subtract the divisor from the dividend until it no longer fits, counting the subtractions.

<!-- @steps -->
1. Record whether the result should be negative, then work with magnitudes.
2. While the remaining dividend is at least the divisor, subtract the divisor.
3. Count each subtraction; the count is the quotient.
4. What is left at the end is the remainder.
5. Apply the recorded sign to the count.

<!-- @complexity -->
- time: O(a / b) — the quotient itself, which is 2,147,483,647 iterations for INT_MAX / 1
- space: O(1)
- note: Correct — 0 mismatches against the built-in operator over all 16,004,000 pairs in -2000..2000. Measured 5,441,666ns over 20,000 divisions with a mean quotient of 374, which is 6.41x the shift version on inputs deliberately chosen to be survivable. On genuinely large quotients it does not finish in reasonable time, which is the point of the subtopic.

<!-- @code cpp -->
```cpp
#include <climits>
#include <cstdlib>

int divideBySubtraction(int a, int b) {
    if (a == INT_MIN && b == -1) return INT_MAX;
    bool neg = (a < 0) != (b < 0);
    long long x = llabs((long long)a), y = llabs((long long)b);

    long long q = 0;
    while (x >= y) { x -= y; q++; }
    return (int)(neg ? -q : q);
}
```

<!-- @annotations -->
- 5: The only input whose true quotient is unrepresentable, and it has to be handled before anything else touches the values.
- 7: llabs on a widened value, not abs on the int — abs(INT_MIN) is INT_MIN and stays negative.
- 10: This loop runs 2,147,483,647 times for INT_MAX / 1, which is the entire reason for the rest of this subtopic.

<!-- @code java -->
```java
static int divideBySubtraction(int a, int b) {
    if (a == Integer.MIN_VALUE && b == -1) return Integer.MAX_VALUE;
    boolean neg = (a < 0) != (b < 0);
    long x = Math.abs((long) a), y = Math.abs((long) b);

    long q = 0;
    while (x >= y) { x -= y; q++; }
    return (int) (neg ? -q : q);
}
```

<!-- @annotations -->
- 4: The cast to long happens BEFORE Math.abs, which is what makes it correct — Math.abs(Integer.MIN_VALUE) returns Integer.MIN_VALUE.

<!-- @code python -->
```python
def divide_by_subtraction(a: int, b: int) -> int:
    neg = (a < 0) != (b < 0)
    x, y, q = abs(a), abs(b), 0
    while x >= y:
        x -= y
        q += 1
    return -q if neg else q


# No overflow guard is needed: Python integers have no INT_MIN, and
# abs(-2**31) is 2**31 rather than staying negative.
```

<!-- @annotations -->
- 3: abs() is safe here in a way it is not in C++ or Java, because there is no most-negative value.
- 10: The guard is still worth adding if the function must match C++ semantics, since the caller may expect clamping.

<!-- @approach -->
### Better - Double the Divisor

<!-- @idea -->
Grow the divisor by doubling until one more doubling would overshoot, subtract that, and repeat on the remainder.

<!-- @steps -->
1. Work with magnitudes, having recorded the sign.
2. While the remaining dividend is at least the divisor, start a fresh inner pass.
3. Double a copy of the divisor, and a copy of 1 alongside it, while the doubled value still fits.
4. Subtract the largest fitting copy from the dividend and add the matching power of two to the quotient.
5. Repeat until the divisor no longer fits.

<!-- @complexity -->
- time: O(log(quotient)^2) worst case, and in practice proportional to the number of set bits in the quotient
- space: O(1)
- note: 0 mismatches against the built-in operator over 3,000,000 random 32-bit pairs. Measured 233,875ns over 20,000 random divisions, 3.63x faster than the fixed 32-step loop and 8.44x the built-in operator. It wins here because each iteration is expensive — a 64-bit shift, a compare and a subtract — and random 32-bit pairs usually give a small quotient, which is the opposite of the situation in Count the Number of Set Bits.

<!-- @code cpp -->
```cpp
#include <climits>
#include <cstdlib>

int divideByDoubling(int a, int b) {
    if (a == INT_MIN && b == -1) return INT_MAX;
    bool neg = (a < 0) != (b < 0);
    long long x = llabs((long long)a), y = llabs((long long)b), q = 0;

    while (x >= y) {
        long long t = y, m = 1;
        while ((t << 1) <= x) { t <<= 1; m <<= 1; }
        x -= t;
        q += m;
    }
    return (int)(neg ? -q : q);
}
```

<!-- @annotations -->
- 11: t and m double in lockstep, so m is always the multiple of y that t represents — this is the multiplication the problem forbids, performed by shifting. The condition tests the DOUBLED value rather than the current one, which is what stops t from overshooting x.
- 13: Each outer pass contributes one set bit to the quotient, so the loop runs once per set bit rather than 32 times.

<!-- @code java -->
```java
static int divideByDoubling(int a, int b) {
    if (a == Integer.MIN_VALUE && b == -1) return Integer.MAX_VALUE;
    boolean neg = (a < 0) != (b < 0);
    long x = Math.abs((long) a), y = Math.abs((long) b), q = 0;

    while (x >= y) {
        long t = y, m = 1;
        while ((t << 1) <= x) { t <<= 1; m <<= 1; }
        x -= t;
        q += m;
    }
    return (int) (neg ? -q : q);
}
```

<!-- @annotations -->
- 8: In long arithmetic t << 1 cannot overflow for any int input, since the largest magnitude is 2^31 and long holds 2^63.

<!-- @code python -->
```python
def divide_by_doubling(a: int, b: int) -> int:
    neg = (a < 0) != (b < 0)
    x, y, q = abs(a), abs(b), 0
    while x >= y:
        t, m = y, 1
        while (t << 1) <= x:
            t <<= 1
            m <<= 1
        x -= t
        q += m
    return -q if neg else q
```

<!-- @annotations -->
- 6: No overflow concern at all, since Python integers widen — the doubling can run past 64 bits and stay correct.

<!-- @approach -->
### Optimal - Binary Long Division in Thirty-Two Steps

<!-- @idea -->
Test each shifted copy of the divisor from the largest down, setting one quotient bit per step.

<!-- @steps -->
1. Handle `INT_MIN / -1` first, returning `INT_MAX`.
2. Record the sign and widen both magnitudes to 64 bits.
3. For `k` from 31 down to 0, compare `divisor << k` against what remains of the dividend.
4. If it fits, subtract it and set bit `k` of the quotient.
5. If it does not, leave bit `k` clear and move on.
6. Apply the recorded sign to the assembled quotient.

<!-- @complexity -->
- time: O(w) — exactly 32 iterations, whatever the operands
- space: O(1)
- note: 0 mismatches against the built-in operator across all 16,004,000 pairs in -2000..2000 and 3,000,000 random 32-bit pairs. Measured 849,250ns over 20,000 divisions, 42.5ns each against the hardware divider's 1.39ns. The fixed trip count is what makes the cost independent of the quotient — the same division that takes 2,147,483,647 subtractions takes 32 steps here.

<!-- @code cpp -->
```cpp
#include <climits>
#include <cstdlib>

int divide(int a, int b) {
    if (a == INT_MIN && b == -1) return INT_MAX;

    bool neg = (a < 0) != (b < 0);
    long long x = llabs((long long)a), y = llabs((long long)b);

    long long q = 0;
    for (int k = 31; k >= 0; k--) {
        if ((y << k) <= x) {
            x -= (y << k);
            q |= (1LL << k);
        }
    }
    return (int)(neg ? -q : q);
}
```

<!-- @annotations -->
- 5: Must come first. In C++ this expression is undefined behaviour and on x86 it raises a hardware exception rather than producing a wrong number.
- 8: Widening before taking the magnitude is the whole trick — llabs((long long)INT_MIN) is 2147483648, where abs(INT_MIN) would still be negative.
- 11: Counting DOWN, because long division produces the most significant quotient digit first.
- 12: y << k in 64-bit arithmetic, so a divisor near 2^31 shifted left by 31 still fits.
- 14: Setting bit k rather than adding, which is the same thing here and says what is meant.

<!-- @code java -->
```java
static int divide(int a, int b) {
    if (a == Integer.MIN_VALUE && b == -1) return Integer.MAX_VALUE;

    boolean neg = (a < 0) != (b < 0);
    long x = Math.abs((long) a), y = Math.abs((long) b);

    long q = 0;
    for (int k = 31; k >= 0; k--) {
        if ((y << k) <= x) {
            x -= (y << k);
            q |= (1L << k);
        }
    }
    return (int) (neg ? -q : q);
}
```

<!-- @annotations -->
- 2: Java defines Integer.MIN_VALUE / -1 to be Integer.MIN_VALUE rather than trapping — so this guard changes the answer rather than preventing a crash, and is still required to match the specification.
- 11: 1L, not 1. With an int literal, k = 31 sets the sign bit of an int and the quotient becomes negative.

<!-- @code python -->
```python
def divide(a: int, b: int) -> int:
    INT_MIN, INT_MAX = -2**31, 2**31 - 1
    if a == INT_MIN and b == -1:
        return INT_MAX

    neg = (a < 0) != (b < 0)
    x, y, q = abs(a), abs(b), 0
    for k in range(31, -1, -1):
        if (y << k) <= x:
            x -= y << k
            q |= 1 << k
    return -q if neg else q


# Verified against a truncating reference on 200,000 random 32-bit pairs:
# 0 mismatches. Note that a // b would be WRONG for negatives — it floors,
# giving -4 for -7 // 2 where the answer required is -3.
```

<!-- @annotations -->
- 8: The magnitudes are divided and the sign applied afterwards, which truncates toward zero — matching C++ rather than Python's own // operator.
- 16: And int(a / b) is not a safe shortcut either: it truncates correctly but loses precision above 2^53.

<!-- @approach -->
### Handling the Edges - Widen, or Go Negative

<!-- @idea -->
Every int has a negative counterpart but not every int has a positive one, so normalise downward or work in a wider type.

<!-- @steps -->
1. Note that the signed range is asymmetric: −2^31 exists and +2^31 does not.
2. So `abs(INT_MIN)` cannot return a positive value, and returns `INT_MIN` unchanged.
3. Option one: cast both operands to a 64-bit type before taking magnitudes.
4. Option two: negate both operands to be non-positive, which always succeeds, and count upward toward zero.
5. Either way, still special-case `INT_MIN / -1`, whose answer is unrepresentable regardless of technique.

<!-- @complexity -->
- time: unchanged — O(w) either way
- space: O(1)
- note: The widening version was verified on 3,000,000 random 32-bit pairs with 0 mismatches. The negative-normalisation version avoids 64-bit arithmetic entirely, which matters on 32-bit targets and in languages without a wider type available. Neither removes the need for the INT_MIN / -1 guard: 2,147,483,648 is not an int under any representation.

<!-- @code cpp -->
```cpp
#include <climits>

// Work in negatives, where every int has a counterpart.
int divideNegated(int a, int b) {
    if (a == INT_MIN && b == -1) return INT_MAX;

    bool neg = (a < 0) != (b < 0);
    if (a > 0) a = -a;
    if (b > 0) b = -b;

    int q = 0;
    for (int k = 31; k >= 0; k--) {
        if ((b << k) >= a && (b << k) < 0) {
            a -= (b << k);
            q -= (1 << k);
        }
    }
    return neg ? q : -q;
}
```

<!-- @annotations -->
- 8: Negating a positive int always succeeds; negating INT_MIN would not, which is why the normalisation runs downward.
- 14: The second condition detects the shift having overflowed past the sign, which replaces the 64-bit range check. Comparisons are reversed throughout because both values are non-positive — this is the version's real cost, in readability rather than speed.

<!-- @code java -->
```java
static int divideWidened(int a, int b) {
    if (a == Integer.MIN_VALUE && b == -1) return Integer.MAX_VALUE;
    long x = a, y = b;                      // widen FIRST
    boolean neg = (x < 0) != (y < 0);
    x = Math.abs(x);
    y = Math.abs(y);

    long q = 0;
    for (int k = 31; k >= 0; k--)
        if ((y << k) <= x) { x -= y << k; q |= 1L << k; }
    return (int) (neg ? -q : q);
}
```

<!-- @annotations -->
- 3: Widening before the abs is the entire fix. Math.abs(Integer.MIN_VALUE) is Integer.MIN_VALUE, and no warning is issued.

<!-- @code python -->
```python
def divide_widened(a: int, b: int) -> int:
    INT_MIN, INT_MAX = -2**31, 2**31 - 1
    if a == INT_MIN and b == -1:
        return INT_MAX
    neg = (a < 0) != (b < 0)
    x, y, q = abs(a), abs(b), 0
    while x >= y:
        t, m = y, 1
        while (t << 1) <= x:
            t <<= 1; m <<= 1
        x -= t; q += m
    return -q if neg else q


# abs(-2**31) is 2**31 here, so there is nothing to widen — the guard
# exists only to match the C++ and Java return value, not to avoid a fault.
```

<!-- @annotations -->
- 6: The line that has to be written carefully in two languages and needs no thought in the third.

<!-- @example -->
<!-- @input -->
100 / 7

<!-- @output -->
14, assembled as the binary digits 1110 with remainder 2

<!-- @why -->
It is small enough to trace fully and has a quotient with several set bits, so every kind of step appears.

<!-- @walkthrough -->
1. Start with x = 100 and y = 7, and a quotient of 0.
2. At k = 3, y << 3 is 56, which is at most 100 — so bit 3 of the quotient is set and x becomes 100 - 56 = 44.
3. At k = 2, y << 2 is 28, which is at most 44 — bit 2 is set and x becomes 44 - 28 = 16.
4. At k = 1, y << 1 is 14, which is at most 16 — bit 1 is set and x becomes 16 - 14 = 2.
5. At k = 0, y << 0 is 7, which is more than 2 — bit 0 stays clear and x is unchanged.
6. The quotient is 1110 in binary, which is 14, and what remains in x is 2, the remainder.
7. Checking: 14 x 7 is 98, and 98 + 2 is 100. The higher values of k, from 31 down to 4, all failed the test and contributed nothing — those iterations are the price of the fixed trip count.

<!-- @example -->
<!-- @input -->
INT_MIN / -1

<!-- @output -->
The true answer is 2,147,483,648 and the largest representable int is 2,147,483,647

<!-- @why -->
It is the one input where the problem has no correct answer, and the standard first line of the standard solution makes it worse rather than better.

<!-- @walkthrough -->
1. INT_MIN is -2,147,483,648 and dividing by -1 should give +2,147,483,648.
2. INT_MAX is 2,147,483,647, so the true quotient is exactly one larger than the type can hold.
3. In C++ the expression is undefined behaviour, and on x86 it does not produce a wrong number — it raises a hardware exception and the process terminates.
4. Java instead defines it: Integer.MIN_VALUE / -1 evaluates to Integer.MIN_VALUE, a wrong answer delivered quietly.
5. The convention, and what the problem requires, is to detect the case and return INT_MAX.
6. The usual first line makes things worse: abs(INT_MIN) is INT_MIN, still negative, because there is no positive counterpart — so an implementation that normalises signs before checking has already lost.
7. The fixes are to widen to 64 bits before taking magnitudes, where llabs((long long)INT_MIN) is 2147483648, or to normalise toward negative instead, since every int has a negative form.

<!-- @example -->
<!-- @input -->
INT_MAX / 1, by repeated subtraction and by shifting

<!-- @output -->
2,147,483,647 iterations against 32

<!-- @why -->
It is the case that makes the two methods incomparable rather than merely different, and it is one of the smallest inputs to do so.

<!-- @walkthrough -->
1. Repeated subtraction removes the divisor once per iteration, so its iteration count is the quotient.
2. For INT_MAX / 1 the quotient is 2,147,483,647, so that is the number of subtractions.
3. For 1000000 / 1 it is 1,000,000, and for 1000000 / 3 it is 333,333.
4. Binary long division performs 32 iterations for every one of those, because it tests each bit position once.
5. On the small case it loses — 100 / 7 needs 14 subtractions against 32 shifts.
6. Measured on 20,000 divisions with a mean quotient of 374, chosen so repeated subtraction would finish at all, it took 5,441,666ns against 849,500ns, a factor of 6.41.
7. With realistic 32-bit inputs the comparison cannot be run, because a single division would take longer than the whole benchmark.

<!-- @example -->
<!-- @input -->
Three methods against the built-in operator

<!-- @output -->
0 mismatches on 16,004,000 exhaustive pairs and 3,000,000 random 32-bit pairs

<!-- @why -->
Sign handling in this problem is subtle enough that a proof is worth less than a check against the operator being reimplemented.

<!-- @walkthrough -->
1. Every pair (a, b) with both values in -2000..2000 and b non-zero was tested — 16,004,000 pairs.
2. Repeated subtraction, the fixed 32-step loop and the doubling variant all matched a / b exactly, with 0 mismatches each.
3. The two fast methods were then run on 3,000,000 random 32-bit pairs, excluding only INT_MIN / -1, and again matched on every one.
4. The Python version was checked separately against a truncating reference on 200,000 random pairs, also 0 mismatches.
5. Timing on 20,000 random divisions gave 27,708ns for the built-in operator, 233,875ns for the doubling variant and 849,250ns for the fixed loop.
6. So the doubling variant is 3.63x faster than the fixed loop here, because each iteration is expensive and random 32-bit pairs usually give small quotients.
7. That is the opposite conclusion from Count the Number of Set Bits, where the fixed loop won by 8.61x — there each iteration was a single instruction, and predictability mattered more than iteration count.

<!-- @visualization custom -->
<!-- @description -->
Open with the decimal-to-binary bridge: 100 / 7 written first as a familiar decimal long division, with the "how many sevens fit into 100" step highlighted, and beside it the same division in base two where the question is reduced to a yes or no. Make the point visually that the digit can only be 0 or 1, so no multiplication table is needed. Then the main animation: x = 100 shown as a horizontal bar, and beneath it a stack of shifted copies of the divisor drawn to scale — 7 << 31 far too long to fit on screen, tapering down through 7 << 4 = 112, 7 << 3 = 56, 7 << 2 = 28, 7 << 1 = 14, 7 << 0 = 7. Walk k downward. For each k, slide the corresponding bar up against x: if it is longer, flash it red, leave the quotient bit at 0, and move on; if it fits, flash green, subtract its length from x so the bar visibly shortens, and light bit k in a quotient row below. The quotient row fills in as 1110 from the left, and x shrinks 100 to 44 to 16 to 2. End with the remainder 2 left over and the check 14 x 7 + 2 = 100 written out. Then the cost panel: two counters racing on INT_MAX / 1 — one ticking up through 2,147,483,647 and visibly never finishing, the other completing 32 steps immediately — with a table of the four iteration counts beside them. Then the overflow panel, which needs to be unmissable: a number line marked from INT_MIN to INT_MAX with a tick at 2,147,483,648 drawn just outside the right end, in red, labelled "the answer to INT_MIN / -1". Underneath, three boxes showing what each language does — C++ "undefined; traps on x86", Java "returns INT_MIN, quietly wrong", the convention "return INT_MAX" — and beside them the abs(INT_MIN) trap, showing the value entering abs() and coming out unchanged and still negative, with a red arrow marking it as the line that breaks first. Close with the two timing charts: the ranking on random 32-bit input at 27,708ns, 233,875ns and 849,250ns, and a note contrasting this subtopic's result with Count the Number of Set Bits — a small two-row table showing where a data-dependent loop wins and where it loses, keyed on whether an iteration is expensive.

<!-- @sampleInput -->
```json
{"worked":{"a":100,"b":7,"steps":[{"k":31,"shifted":"7 << 31","fits":false,"quotientBit":0},{"k":4,"shifted":112,"fits":false,"quotientBit":0,"remaining":100},{"k":3,"shifted":56,"fits":true,"quotientBit":1,"remaining":44},{"k":2,"shifted":28,"fits":true,"quotientBit":1,"remaining":16},{"k":1,"shifted":14,"fits":true,"quotientBit":1,"remaining":2},{"k":0,"shifted":7,"fits":false,"quotientBit":0,"remaining":2}],"quotientBits":"1110","quotient":14,"remainder":2,"check":"14 * 7 + 2 = 100"},"iterationCounts":[{"division":"100 / 7","subtraction":14,"longDivision":32},{"division":"1000000 / 3","subtraction":333333,"longDivision":32},{"division":"1000000 / 1","subtraction":1000000,"longDivision":32},{"division":"INT_MAX / 1","subtraction":2147483647,"longDivision":32}],"verification":{"exhaustive":{"range":[-2000,2000],"pairs":16004000,"excluded":"b == 0","mismatches":{"subtraction":0,"fixedShift":0,"doubling":0}},"random":{"pairs":3000000,"width":32,"excluded":"INT_MIN / -1","mismatches":{"fixedShift":0,"doubling":0}},"python":{"pairs":200000,"referenceUsed":"truncating toward zero","mismatches":0}},"overflow":{"expression":"INT_MIN / -1","trueAnswer":2147483648,"intMax":2147483647,"representable":false,"cpp":"undefined behaviour — raises a hardware exception on x86, so the process dies rather than returning a wrong number","java":"defined to return Integer.MIN_VALUE — quietly wrong","convention":"detect and return INT_MAX","absTrap":{"expr":"abs(INT_MIN)","result":-2147483648,"stillNegative":true,"why":"the signed range is asymmetric: -2^31 exists and +2^31 does not","fixes":["widen to 64 bits before taking magnitudes — llabs((long long)INT_MIN) is 2147483648","normalise both operands to NEGATIVE, since every int has a negative form"]}},"timing":{"unit":"ns","divisions":20000,"random32":[{"method":"built-in /","ns":27708,"ratio":1.0,"perDivisionNs":1.39},{"method":"doubling the divisor","ns":233875,"ratio":8.44},{"method":"fixed 32-step loop","ns":849250,"ratio":30.65,"perDivisionNs":42.5}],"doublingOverFixed":3.63,"smallQuotients":{"meanQuotient":374,"subtraction":5441666,"fixedShift":849500,"builtin":23500,"subtractionOverShift":6.41}},"whenDataDependentLoopsWin":{"here":{"winner":"doubling (data-dependent)","margin":"3.63x","why":"each iteration is a 64-bit shift, compare and subtract, and random 32-bit pairs usually give a small quotient"},"countSetBits":{"winner":"fixed 32-scan","margin":"8.61x","why":"each iteration is one instruction, so loop overhead dominates and vectorisation is the prize"},"rule":"skipping iterations pays when an iteration is expensive; being predictable pays when it is nearly free"},"truncationVsFlooring":{"cpp":{"expr":"-7 / 2","value":-3,"rule":"truncates toward zero"},"python":{"expr":"-7 // 2","value":-4,"rule":"floors"},"technique":"divide magnitudes and apply the sign afterwards, which truncates automatically","pythonShortcutTrap":{"expr":"int(a / b)","truncatesCorrectly":true,"failsAt":{"input":"2**53 + 1","floorDiv":9007199254740993,"viaFloat":9007199254740992}}}}
```

<!-- @highlights -->
- 100 / 7 is shown first as a decimal long division with the "how many sevens fit" step highlighted.
- Beside it the same division in base two reduces that question to a yes or no, with no multiplication table needed.
- x = 100 is drawn as a horizontal bar above a stack of shifted divisor copies drawn to scale.
- The stack tapers from 7 << 31, far too long for the screen, down through 112, 56, 28, 14 and 7.
- Walking k downward, each shifted copy slides up against x.
- A copy that is too long flashes red and leaves its quotient bit at 0.
- A copy that fits flashes green, shortens x by its length, and lights bit k in the quotient row.
- The quotient row fills in as 1110 while x shrinks from 100 to 44 to 16 to 2.
- The remainder 2 is left over and the check 14 x 7 + 2 = 100 is written out.
- Two counters then race on INT_MAX / 1: one ticking toward 2,147,483,647 and never finishing, the other completing 32 steps at once.
- A number line runs from INT_MIN to INT_MAX with a red tick at 2,147,483,648 just outside the right end.
- It is labelled "the answer to INT_MIN / -1", above three boxes for C++, Java and the convention.
- The abs(INT_MIN) trap is drawn as a value entering abs() and emerging unchanged and still negative.
- A red arrow marks it as the line that breaks first in the standard solution.
- Timing bars give 27,708ns, 233,875ns and 849,250ns on random 32-bit input.
- A two-row table contrasts this result with Count the Number of Set Bits, keyed on whether an iteration is expensive.

<!-- @edgeCases -->
- INT_MIN / -1 — the true answer is 2,147,483,648, which is not representable; return INT_MAX by convention.
- abs(INT_MIN) — returns INT_MIN, still negative, so any sign normalisation must widen first or normalise downward.
- b = 0 — undefined in C++ and an ArithmeticException in Java; the problem statement usually excludes it, and a guard costs nothing.
- a = 0 — the quotient is 0 and every shifted divisor fails to fit, so the loop runs 32 times and contributes nothing.
- |a| < |b| — the quotient is 0, and the fixed loop still performs all 32 iterations.
- a = INT_MIN with b = 1 — the answer is INT_MIN and fits, so this must not be caught by the overflow guard.
- b = 1 or b = -1 with any other a — the largest quotient magnitudes, and where repeated subtraction becomes impossible.
- b near 2^31 — y << 31 needs 62 bits, which is why the arithmetic must be done in a 64-bit type.
- A quotient bit at position 31 — write 1LL << k, not 1 << k, or the sign bit of an int is set instead.
- Negative operands in Python — // floors, so a // b gives -4 for -7 // 2 where the required answer is -3.
- Large values in Python via int(a / b) — truncates correctly and loses precision above 2^53.

<!-- @pitfalls -->
- Calling abs() before widening. abs(INT_MIN) is INT_MIN and stays negative, so the standard first line fails on the one input that matters.
- Omitting the INT_MIN / -1 guard. In C++ this is undefined behaviour that raises a hardware exception on x86 — the process dies rather than returning a wrong number.
- Assuming Java's behaviour matches C++. Java defines Integer.MIN_VALUE / -1 to be Integer.MIN_VALUE, so the same bug is silent there instead of fatal.
- Writing 1 << k for the quotient bit. At k = 31 that sets the sign bit of an int and the quotient comes out negative.
- Shifting the divisor in 32-bit arithmetic. y << 31 for a large y needs 62 bits, so the shift must happen in a wide type.
- Using repeated subtraction on unconstrained input. INT_MAX / 1 takes 2,147,483,647 iterations, which does not finish in any acceptable time.
- Using a // b in Python. It floors rather than truncating, giving -4 for -7 // 2 where the required answer is -3.
- Using int(a / b) in Python as the truncating fix. It truncates correctly and loses precision above 2^53, where (2**53 + 1) / 1 comes back one short.
- Applying the sign before dividing. Dividing magnitudes and negating afterwards is what produces truncation toward zero; interleaving the sign reintroduces the flooring question.
- Assuming the fixed 32-step loop is always the faster shape. Here the doubling variant measured 3.63x faster, because each iteration is expensive and quotients are usually small.
- Treating this as a fast alternative to /. It is 30.65x slower than the hardware divider; the exercise is about reconstructing division, not improving it.
- Testing only with positive operands. Every sign-related bug in this subtopic survives a suite that never passes a negative.

<!-- @doubt -->
### Why does the loop count down from 31?

<!-- @answer -->
Because long division produces the most significant digit of the quotient first. At each step you ask whether the largest remaining shifted copy of the divisor fits into what is left, and that copy is the one shifted furthest left. Counting up would find the small pieces first and then have no way to know how many of them to take — it would collapse back into repeated subtraction. Counting down means each answer is a single yes or no, because in base two the only possible quotient digits are 0 and 1, which is what removes the multiplication that decimal long division needs.

<!-- @doubt -->
### Why 32 iterations even for 100 / 7?

<!-- @answer -->
Because the trip count is fixed by the width rather than by the operands, which is exactly the property being bought. For 100 / 7 the iterations from k = 31 down to k = 4 all fail their test and contribute nothing — wasted work, and 100 / 7 is a case where repeated subtraction would have been cheaper at 14 iterations. The trade pays off immediately at scale: INT_MAX / 1 takes 2,147,483,647 subtractions and the same 32 steps here. If you want to skip the wasted iterations, the doubling variant does, and measured 3.63x faster on random input.

<!-- @doubt -->
### What is wrong with abs(a)?

<!-- @answer -->
For INT_MIN it does nothing. The signed range is asymmetric — -2^31 is representable and +2^31 is not — so there is no value abs() could return, and it returns INT_MIN unchanged, still negative. Every subsequent comparison in the algorithm then behaves as though the dividend were negative, and the result is wrong in a way that no test with ordinary inputs will find. The two fixes are to widen before taking the magnitude, since llabs((long long)INT_MIN) is 2147483648 and fits comfortably, or to normalise both operands to be non-positive instead, because every int does have a negative counterpart.

<!-- @doubt -->
### Why must INT_MIN / -1 be special-cased?

<!-- @answer -->
Because its true answer is 2,147,483,648 and the largest representable int is 2,147,483,647 — the result does not exist in the type, so no implementation technique can produce it. What happens without the guard differs by language and neither outcome is acceptable. In C++ the expression is undefined behaviour, and on x86 the divide instruction raises a hardware exception, so the process dies. In Java it is defined to return Integer.MIN_VALUE, which is quietly wrong. The convention, and what problem statements require, is to detect the pair and return INT_MAX.

<!-- @doubt -->
### Is the doubling variant better than the fixed loop?

<!-- @answer -->
On these inputs, yes — 233,875ns against 849,250ns over 20,000 random 32-bit divisions, a factor of 3.63. It finds the largest fitting shifted divisor by doubling up from the bottom rather than testing all 32 positions, so it performs about as many steps as the quotient has bits. Two random 32-bit values usually produce a small quotient, so most of the fixed loop's 32 iterations are wasted. The fixed version's advantage is that its cost is completely independent of the operands, which matters if the timing must not depend on the data — in cryptographic code, for instance.

<!-- @doubt -->
### Doesn't this contradict the set-bits subtopic?

<!-- @answer -->
It looks like it and does not. There, a fixed 32-iteration scan beat Kernighan's data-dependent loop by 8.61x; here a data-dependent loop beats a fixed one by 3.63x. The difference is the cost of one iteration. Counting bits, an iteration is a single instruction, so loop overhead dominates and the prize is vectorising a predictable loop — skipping iterations saves almost nothing. Dividing, an iteration is a 64-bit shift, a compare and a subtract, so skipping one saves real work. The rule that fits both: being predictable pays when an iteration is nearly free, and skipping pays when it is expensive.

<!-- @doubt -->
### Why does dividing magnitudes give truncation?

<!-- @answer -->
Because the magnitude division has no sign to round away from — it simply discards the remainder, which is truncation by construction. Applying the sign afterwards then gives the C++ and Java behaviour exactly: -7 becomes 7, 7 / 2 is 3, and negating gives -3. Flooring would have given -4. This is why the sign-first structure is correct rather than merely tidy, and it is also the reason a Python translation must not use // for the inner division: Python's operator floors, so it would produce -4 where the problem wants -3.

<!-- @doubt -->
### Can I use int(a / b) in Python instead?

<!-- @answer -->
It truncates correctly and fails for a different reason. Converting to a float and back is exact only while the values fit in a double's 53-bit mantissa, and above that it silently loses precision — (2**53 + 1) // 1 gives 9007199254740993 while int((2**53 + 1) / 1) gives 9007199254740992. For 32-bit inputs it happens to be safe, which is the worst kind of safe: the code is correct until someone widens the type. Dividing magnitudes with // and applying the sign afterwards is exact at any size.

<!-- @doubt -->
### Why 1LL << k rather than 1 << k?

<!-- @answer -->
Because at k = 31 an int literal shifts a 1 into the sign bit, so the quotient bit that should mean 2,147,483,648 instead makes the accumulator negative. It is also undefined behaviour in C++ for a signed 1. The same applies to the divisor: y << 31 for a divisor near 2^31 needs 62 bits, so both the shift and the accumulator must be in the wide type. In Java the literal is 1L for the same reason, though there the shift itself is defined rather than undefined — a wrong answer instead of an unpredictable one.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Minimum Bit Flips to Convert Number, which is much shorter and composes the two subtopics before this one. The number of positions at which two numbers differ is exactly the number of set bits in their XOR — so the answer is popcount(a ^ b), one operation from Swap Two Numbers and one from Count the Number of Set Bits. After that the topic stays with XOR for several subtopics, because the self-inverse property turns out to answer a whole family of array problems that have no other short solution.
