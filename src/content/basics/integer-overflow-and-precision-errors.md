---
id: integer-overflow-and-precision-errors
topic: Basics
title: Integer Overflow and Precision Errors
difficulty: Hard
status: ready
prerequisites:
  - data-types
  - type-conversion-and-casting
  - arithmetic-operators
  - time-and-space-complexity-basics
  - reverse-a-number
relatedIds:
  - data-types
  - type-conversion-and-casting
  - count-digits
  - reverse-a-number
  - lcm
  - prime-check
---

<!-- @summary -->
The two ways arithmetic silently produces wrong answers — a value too large for its type, and a decimal that cannot be written in binary — and how to detect both before they happen.

<!-- @theory -->
## Two failures, one property

Every bug in this subtopic shares a signature: **the program does not stop.** No
exception, no warning, no crash. It computes a wrong number and carries on, and the
symptom appears somewhere else entirely.

There are exactly two causes:

- **Integer overflow** — the true result is larger than the type can hold.
- **Floating-point imprecision** — the true value cannot be represented in binary at all.

This module has hit both repeatedly. Here they are together.

## What this module already measured

Every one of these was reproduced on this machine, not quoted:

| Subtopic | Expression | Expected | Actually got |
|---|---|---|---|
| Data Types | `100000 * 100000` | 10,000,000,000 | **−1,794,967,296** |
| Reverse a Number | reverse of 1534236469 | 9,646,324,351 | **1,056,389,759** |
| LCM | `50000 * 60000 / gcd` | 300,000 | **−129,496** |
| Prime Check | `i*i <= n` at i = 46341 | loop ends | **never terminates** |
| Count Digits | `log10(999999999999999)` | just under 15 | **exactly 15.0** |

The last one is the floating-point failure and the rest are integer overflow. Five
different problems, one root cause each.

## Integer overflow: the mechanism

A fixed-width type has a fixed number of bit patterns. A 32-bit signed `int` has 2³²
of them, covering **−2,147,483,648 to 2,147,483,647**.

Exceeding that range does not produce an error. The high bits that do not fit are
**discarded**, and what remains is reinterpreted — which flips the sign bit and lands
you somewhere unrelated. Measured:

```
INT_MAX + 1  ->  -2147483648      wraps to the minimum
INT_MIN - 1  ->   2147483647      wraps to the maximum
```

The number line is a circle. Walk past one end and you appear at the other.

## The most-negative value cannot be negated

A trap that catches people who already know about overflow.

The range is asymmetric: **−2,147,483,648 to 2,147,483,647.** There is one more
negative value than positive, so the positive counterpart of the minimum **does not
exist in the type**. Measured:

```
INT_MIN       = -2147483648
-INT_MIN      = -2147483648      still negative
abs(INT_MIN)  = -2147483648      still negative
```

Any code taking an absolute value — Count Digits, Reverse a Number, GCD — has this
edge case. `Math.abs(Integer.MIN_VALUE)` in Java returns a negative number, and it is
documented behaviour rather than a bug.

## Detect before, not after

The instinct is to compute and then check whether the result looks wrong. **That never
works** — once the operation has overflowed, the value is garbage and there is nothing
left to inspect.

Check **before**, by rearranging so the test itself cannot overflow:

```
if (b > INT_MAX - a)  ->  a + b would overflow
if (a > INT_MAX / b)  ->  a * b would overflow
```

Measured: with `a = 2000000000`, `INT_MAX - a` is **147,483,647** — a small, safe
number. Comparing against it costs nothing and cannot itself overflow.

This is the same shape as three earlier fixes:

- **Reverse a Number**: `rev > INT_MAX / 10` before multiplying by 10
- **LCM**: `(a / gcd) * b` — divide first so the product starts smaller
- **Type Conversion**: cast the operands, not the result

**Reorder so the dangerous operation never happens, rather than testing its wreckage.**

## Simply using a wider type

Often the right answer. A 64-bit integer holds up to about **9.2 × 10¹⁸**, and most
DSA problems fit comfortably.

```
long long product = 1LL * a * b;      // C++: promote BEFORE multiplying
long product = (long) a * b;          // Java: same rule
```

Note the placement — widening *after* the multiplication is too late, exactly as
Type Conversion covered. Python sidesteps this entirely: its integers are unbounded
and grow to fit.

## Floating point: why 0.1 + 0.2 is not 0.3

Now the other failure, and it is not a bug in your language.

Binary fractions can only represent sums of ½, ¼, ⅛ and so on. **One tenth is not such
a sum**, any more than one third can be written exactly in decimal. So `0.1` is stored
as the nearest value that *can* be represented. Measured exactly:

```
0.1  is stored as  0.1000000000000000055511151231257827021181583404541015625
0.2  is stored as  0.200000000000000011102230246251565404236316680908203125
0.3  is stored as  0.299999999999999988897769753748434595763683319091796875
```

Look at the third line. **The stored 0.3 is slightly *below* 0.3**, while the stored
0.1 and 0.2 are each slightly *above* theirs. Add the two and you land slightly above
0.3 — and the two values are genuinely different numbers:

```
0.1 + 0.2  ->  0.30000000000000004
0.1 + 0.2 == 0.3  ->  false
```

Nothing went wrong. Two approximations were added, and the result is not the third
approximation. Every language using IEEE-754 behaves this way.

## Errors accumulate

A single rounding is tiny. Repeated, they compound. Measured:

```
0.1 added 10 times    ->  0.9999999999999999      not 1.0
0.1 added 1000 times  ->  99.9999999999986        error 1.4e-12
```

That matters for anything summing many floating-point values. Prefer working in
integers where you can — money in cents rather than dollars is the classic example.

## Doubles stop counting at 2⁵³

A limit worth knowing precisely, because it is where integers and floats collide.

A double has 53 bits of mantissa, so it represents every integer exactly **up to
2⁵³ = 9,007,199,254,740,992** — and not beyond. Measured:

```
float(2^53 + 1) == float(2^53)   ->  True
```

The two are indistinguishable. Past that point consecutive integers no longer have
distinct representations.

**This is the root of the Count Digits failure.** `log10(999999999999999)` is truly
14.999999999999999996…, and at that magnitude no double exists between it and 15.0 —
so the library returns exactly 15.0, and the digit count comes out one too high.

## float is much worse than double

A 32-bit `float` has only **24 bits** of mantissa, so it counts exactly only to
2²⁴ = 16,777,216. Measured:

```
int 16777217  ->  float  ->  int     gives 16777216      lost 1
```

And on a larger value:

```
123456789012345  ->  float  ->  123456788103168      error: 909,177
123456789012345  ->  double ->  123456789012345      error: 0
```

An error of nearly a million from a "widening" conversion that required no cast.
**Use `double`, not `float`**, unless memory is genuinely the constraint.

## Comparing floating-point values

Never with `==`. Compare the **difference against a small tolerance**:

```
abs(a - b) < 1e-9
```

Measured: `0.1 + 0.2` differs from `0.3` by **5.55 × 10⁻¹⁷**, comfortably inside that
tolerance. The tolerance is a judgement call — too tight and legitimately equal values
compare unequal, too loose and genuinely different ones compare equal. For values of
wildly different magnitudes a *relative* tolerance is better than a fixed one.

## The rules

**For integers:**

1. Work out the largest value the computation can reach — not the largest input.
2. If it exceeds about 2 × 10⁹, use a 64-bit type.
3. Widen or divide **before** the dangerous operation, never after.
4. Handle the most-negative value separately wherever you take an absolute value.

**For floating point:**

1. Never test equality; compare against a tolerance.
2. Use `double`, not `float`.
3. Prefer integer arithmetic when exactness matters.
4. Do not trust a float-derived integer at a boundary — the Count Digits lesson.

## And the honest counterweight

The Palindrome Number subtopic scanned the **entire** non-negative 32-bit range and
found the naive reverse-and-compare produced **zero false positives and zero false
negatives**. The overflow was real; the wrong answer never materialised.

That is worth keeping. These failures are silent and serious and they are not
universal — the discipline is to know which operations can overflow and check those,
not to treat every arithmetic expression as suspect.

<!-- @intuition -->
Integers fail by running off the end of a circle and reappearing on the other side. Floats fail by never having held the value you asked for in the first place. Both fail quietly, which is why the only defence is arranging the computation so the dangerous step cannot happen — checking afterwards is always too late.

<!-- @approach -->
### Integer Overflow: Detect Before, Not After

<!-- @idea -->
Rearrange the check so the test itself cannot overflow, or widen the type before the operation runs.

<!-- @steps -->
1. Determine the largest value the computation can reach, considering intermediate results and not only the final answer.
2. Compare that against the type's maximum of roughly 2.1 billion for 32 bits or 9.2 quintillion for 64 bits.
3. If a wider type is available and the answer fits, widen an operand before the operation rather than casting the result.
4. If the type is fixed, rewrite the check by dividing or subtracting from the limit, so the test itself cannot overflow.
5. Guard the most-negative value separately wherever an absolute value or negation is taken.
6. Decide what to do on detection: return a sentinel, throw, or use a wider type.

<!-- @complexity -->
- time: O(1)
- space: O(1)
- note: Every guard here is a single comparison against a precomputed limit, adding constant time per operation. Widening a type costs nothing at runtime on modern hardware. These are correctness measures with no meaningful performance cost, which is why there is never a good reason to omit them where overflow is possible.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <climits>
using namespace std;

int main() {
    // THE WRAP, measured
    cout << (int)(INT_MAX + 1) << endl;   // -2147483648
    cout << (int)(INT_MIN - 1) << endl;   //  2147483647

    // DETECT BEFORE — the check cannot itself overflow
    int a = 2000000000, b = 200000000;
    if (b > INT_MAX - a) {                // INT_MAX - a is 147483647, safe
        cout << "a + b would overflow" << endl;
    }
    // Naive: a + b gives -2094967296

    // Multiplication guard
    if (a != 0 && b > INT_MAX / a) {
        cout << "a * b would overflow" << endl;
    }

    // SIMPLY WIDEN — usually the better answer
    long long safe = 1LL * a * b;         // promote BEFORE multiplying
    cout << safe << endl;                 // 400000000000000000

    // long long wrong = (long long)(a * b);   // TOO LATE — a*b already wrapped

    // THE MOST-NEGATIVE TRAP, measured
    int m = INT_MIN;
    cout << -m << endl;        // -2147483648  — still negative
    cout << abs(m) << endl;    // -2147483648  — still negative
    // The range is asymmetric: +2147483648 does not exist in an int.

    return 0;
}
```

<!-- @annotations -->
- 12: Subtracting from the limit leaves a small number, so the comparison is always safe.
- 22: 1LL * a promotes the whole expression to 64-bit before the multiplication happens.
- 29: Any code taking an absolute value has this edge case — Count Digits, Reverse and GCD all do.

<!-- @code java -->
```java
public class Overflow {
    public static void main(String[] args) {
        // The wrap
        System.out.println(Integer.MAX_VALUE + 1);   // -2147483648
        System.out.println(Integer.MIN_VALUE - 1);   //  2147483647

        int a = 2000000000, b = 200000000;

        // Detect before
        if (b > Integer.MAX_VALUE - a) {
            System.out.println("a + b would overflow");
        }

        // Widen before the operation
        long safe = (long) a * b;
        System.out.println(safe);   // 400000000000000000

        // Java's exact methods — throw instead of wrapping silently
        try {
            int bad = Math.addExact(a, b);
        } catch (ArithmeticException e) {
            System.out.println("addExact caught it: " + e.getMessage());
        }
        // Also multiplyExact, subtractExact, negateExact, toIntExact.

        // The most-negative trap — documented behaviour, not a bug
        System.out.println(Math.abs(Integer.MIN_VALUE));   // -2147483648
    }
}
```

<!-- @annotations -->
- 19: Java's best tool here, and it has no C++ equivalent — silent wrapping becomes a thrown exception.
- 27: The Javadoc states this explicitly: the absolute value of the most negative int is itself.

<!-- @code python -->
```python
# Python integers are UNBOUNDED — arithmetic overflow does not exist.
a, b = 2000000000, 200000000
print(a * b)          # 400000000000000000 — exact, no widening needed
print(2 ** 200)       # computed exactly, at any size
print(abs(-2**31))    # 2147483648 — no asymmetry, no trap

# So when does this matter in Python?

# 1. When a PROBLEM imposes a 32-bit range, as LeetCode often does
INT_MAX, INT_MIN = 2**31 - 1, -2**31

def reverse_bounded(n):
    sign = -1 if n < 0 else 1
    rev = int(str(abs(n))[::-1]) * sign
    return 0 if rev < INT_MIN or rev > INT_MAX else rev

print(reverse_bounded(1534236469))   # 0 — rejected by the stated range

# 2. When you translate the code to C++ or Java, where the limits are real.

# 3. The one place Python DOES lose precision — floats have limits:
print(2**53 + 1)                # 9007199254740993  exact as an int
print(float(2**53 + 1))         # 9.007199254740992e+15  <-- lost 1
print(int(float(2**53 + 1)))    # 9007199254740992

# Verified: float(2**53 + 1) == float(2**53) is True.
# Converting a large integer to a float discards precision Python's
# integers were holding perfectly.
```

<!-- @annotations -->
- 2: The genuine advantage. Every integer overflow lesson in this module is inapplicable to Python's integers.
- 26: The exception that matters: the moment an integer becomes a float, the 2^53 limit applies again.

<!-- @approach -->
### Floating-Point Representation and Why Equality Fails

<!-- @idea -->
Understand that a decimal fraction is stored as the nearest representable binary value, so two different roundings rarely land on the same result.

<!-- @steps -->
1. Recognise that binary fractions represent only sums of one half, one quarter, one eighth and so on.
2. Note that one tenth is not such a sum, so it cannot be stored exactly at any precision.
3. The stored value is therefore the nearest representable neighbour, which may be slightly above or below.
4. Arithmetic on two approximations produces a result that is itself approximate.
5. That result need not equal the approximation of the mathematically correct answer.
6. Conclude that testing floating-point equality asks whether two independent roundings coincided, which is not the question you meant.

<!-- @complexity -->
- time: O(1)
- space: O(1)
- note: Floating-point operations are single hardware instructions. Exact alternatives are not free: Decimal in Python and BigDecimal in Java are implemented in software and are typically an order of magnitude slower, which is why integer arithmetic in a smaller unit — cents rather than dollars — is usually the better answer when exactness matters.

<!-- @code python -->
```python
from decimal import Decimal

# WHAT IS ACTUALLY STORED — measured exactly
print(Decimal(0.1))
# 0.1000000000000000055511151231257827021181583404541015625
print(Decimal(0.2))
# 0.200000000000000011102230246251565404236316680908203125
print(Decimal(0.3))
# 0.299999999999999988897769753748434595763683319091796875

# Note the asymmetry: stored 0.1 and 0.2 are each slightly ABOVE
# their true value, while stored 0.3 is slightly BELOW its own.

print(0.1 + 0.2)          # 0.30000000000000004
print(0.1 + 0.2 == 0.3)   # False

# Nothing malfunctioned. Two approximations were added and the sum
# is not the third approximation. Every IEEE-754 language does this.

# ERRORS ACCUMULATE — measured
s = 0.0
for _ in range(10):
    s += 0.1
print(s, s == 1.0)        # 0.9999999999999999 False

s = 0.0
for _ in range(1000):
    s += 0.1
print(s)                  # 99.9999999999986 — error grows with the count

# WHEN EXACTNESS MATTERS — use integers or Decimal
print(Decimal("0.1") + Decimal("0.2") == Decimal("0.3"))   # True
# Decimal is exact and much slower. Storing money in cents as an
# integer is the usual answer.
```

<!-- @annotations -->
- 4: The definitive answer to why 0.1 + 0.2 is not 0.3 — the value was never 0.1 to begin with.
- 11: The directions of the two roundings are what makes the sum land on the far side of 0.3.
- 32: Decimal takes strings rather than floats, because passing 0.1 would already have lost the precision.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <iomanip>
#include <cmath>
using namespace std;

int main() {
    cout << setprecision(20);
    cout << 0.1 << endl;    // 0.1000000000000000055511151231
    cout << 0.3 << endl;    // 0.29999999999999998889776975375

    cout << (0.1 + 0.2) << endl;         // 0.30000000000000004441
    cout << (0.1 + 0.2 == 0.3) << endl;  // 0

    // float is FAR worse than double — 24-bit mantissa vs 53-bit
    int exact = 16777217;                 // 2^24 + 1
    float f = (float) exact;
    cout << (int) f << endl;              // 16777216 — lost 1

    long long big = 123456789012345LL;
    cout << (long long)(float) big << endl;   // 123456788103168 — off by 909,177
    cout << (long long)(double) big << endl;  // 123456789012345 — exact

    // Note: long long to float is a WIDENING conversion needing no cast,
    // and it still loses nearly a million. Widening protects range,
    // not precision.

    // DOUBLES STOP COUNTING INTEGERS AT 2^53
    double d = 9007199254740992.0;            // 2^53
    cout << (d == d + 1) << endl;             // 1 — indistinguishable

    return 0;
}
```

<!-- @annotations -->
- 15: float counts exactly only to 2^24. An int can hold values a float cannot represent.
- 23: The single most useful sentence about widening conversions, and it is easy to get backwards.
- 27: The root cause of the Count Digits log10 failure, stated as a general limit.

<!-- @code java -->
```java
public class Precision {
    public static void main(String[] args) {
        System.out.println(0.1 + 0.2);          // 0.30000000000000004
        System.out.println(0.1 + 0.2 == 0.3);   // false

        // BigDecimal is exact — construct from a String, never a double
        java.math.BigDecimal a = new java.math.BigDecimal("0.1");
        java.math.BigDecimal b = new java.math.BigDecimal("0.2");
        System.out.println(a.add(b).equals(new java.math.BigDecimal("0.3")));  // true

        // new BigDecimal(0.1) would capture the ALREADY-WRONG double:
        System.out.println(new java.math.BigDecimal(0.1));
        // 0.1000000000000000055511151231257827021181583404541015625

        // float versus double
        int exact = 16777217;
        System.out.println((int)(float) exact);    // 16777216 — lost 1
        System.out.println((int)(double) exact);   // 16777217 — fine

        // Doubles stop counting consecutive integers at 2^53
        double d = 9007199254740992.0;
        System.out.println(d == d + 1);            // true
    }
}
```

<!-- @annotations -->
- 7: The constructor taking a String is the correct one. The double constructor preserves the error you were trying to escape.
- 12: Printing it shows exactly the same digits Python's Decimal(0.1) revealed — the same IEEE-754 value.

<!-- @approach -->
### Working Safely with Floating Point

<!-- @idea -->
Replace equality with a tolerance, avoid accumulating error, and never trust a float-derived integer at a boundary.

<!-- @steps -->
1. Replace any equality test between floating-point values with a comparison of their difference against a small tolerance.
2. Choose the tolerance for the magnitudes involved, using a relative tolerance when the values vary widely.
3. Avoid summing many floating-point values where an integer accumulation would work instead.
4. Where a decimal quantity must be exact, store it as an integer in a smaller unit.
5. Never derive an integer from a floating-point computation at a boundary, since the rounding may cross it.
6. Prefer double over float in every case where memory is not the binding constraint.

<!-- @complexity -->
- time: O(1)
- space: O(1)
- note: A tolerance comparison is a subtraction, an absolute value and a comparison — the same order of cost as the equality test it replaces. Restructuring to accumulate in integers is also free. The only approach with a real cost is exact decimal arithmetic through Decimal or BigDecimal, which is software-implemented and typically an order of magnitude slower than hardware floating point.

<!-- @code cpp -->
```cpp
#include <cmath>

// WRONG — asks whether two independent roundings coincided
if (a == b) { }

// RIGHT — asks whether they are close enough to be the same value
const double EPS = 1e-9;
if (fabs(a - b) < EPS) { }

// Measured: 0.1 + 0.2 differs from 0.3 by 5.55e-17,
// comfortably inside a 1e-9 tolerance.

// For values of very different magnitudes, use a RELATIVE tolerance —
// a fixed 1e-9 is meaningless next to a value of 1e12.
bool closeEnough(double a, double b) {
    return fabs(a - b) <= 1e-9 * max(fabs(a), fabs(b));
}

// AVOID ACCUMULATING — count in integers, convert once at the end
// Poor:
double total = 0;
for (int i = 0; i < n; i++) total += 0.1;      // error compounds

// Better:
int count = 0;
for (int i = 0; i < n; i++) count++;
double result = count * 0.1;                    // one rounding, not n

// MONEY IN CENTS — the standard fix for exact decimals
long long cents = 1999;                         // 19.99 dollars
long long totalCents = cents * 3;               // exact
// printing as dollars is a display concern, not a storage one

// DO NOT DERIVE AN INTEGER FROM A FLOAT AT A BOUNDARY —
// this is precisely the Count Digits failure:
//   (int) log10(999999999999999) + 1  gives 16, and the answer is 15
```

<!-- @annotations -->
- 15: A fixed tolerance only works when you know the scale. Relative tolerance adapts to it.
- 26: One multiplication rounds once. A loop of additions rounds n times, and the errors compound.
- 36: The concrete instance of the rule, already measured earlier in this module.

<!-- @code java -->
```java
// WRONG
if (a == b) { }

// RIGHT
static final double EPS = 1e-9;
if (Math.abs(a - b) < EPS) { }

// Relative tolerance for values of differing magnitude
static boolean closeEnough(double a, double b) {
    return Math.abs(a - b) <= 1e-9 * Math.max(Math.abs(a), Math.abs(b));
}

// Money as an integer number of cents
long cents = 1999;          // 19.99
long total = cents * 3;     // 5997 — exact

// Or BigDecimal when the arithmetic is complex and speed is not critical
java.math.BigDecimal price = new java.math.BigDecimal("19.99");
System.out.println(price.multiply(java.math.BigDecimal.valueOf(3)));  // 59.97

// Careful with Double.compare and equals — they compare the stored
// bit patterns, so they inherit exactly the same problem as ==:
System.out.println(Double.valueOf(0.1 + 0.2).equals(0.3));   // false
```

<!-- @annotations -->
- 21: A common misconception — the object methods are not a fix, they compare the same approximations.

<!-- @code python -->
```python
import math

# WRONG
if a == b: pass

# RIGHT — Python has this built in since 3.5
print(math.isclose(0.1 + 0.2, 0.3))                    # True
print(math.isclose(0.1 + 0.2, 0.3, abs_tol=1e-9))      # True

# It uses a RELATIVE tolerance by default, which handles differing
# magnitudes correctly. Pass abs_tol when comparing against zero,
# where a relative tolerance is meaningless.
print(math.isclose(1e-20, 0.0))                        # False
print(math.isclose(1e-20, 0.0, abs_tol=1e-9))          # True

# Measured: the actual difference is 5.551115123125783e-17
print(abs((0.1 + 0.2) - 0.3))

# AVOID ACCUMULATING
total = sum(0.1 for _ in range(10))
print(total, total == 1.0)      # 0.9999999999999999 False
print(round(0.1 * 10, 10) == 1.0)   # True — one rounding instead of ten

# MONEY IN CENTS
cents = 1999                    # 19.99
print(cents * 3)                # 5997 — exact

# WHEN AN INTEGER MUST BE EXACT, keep it an integer
print(2**53 + 1)                # 9007199254740993 — exact
print(int(float(2**53 + 1)))    # 9007199254740992 — the float lost it

# The general rule: once a value passes through a float, you cannot
# assume any integer derived from it is exact at a boundary.
```

<!-- @annotations -->
- 7: math.isclose is the right default in Python — relative by design, with an absolute option for comparisons against zero.
- 13: The case a naive relative tolerance gets wrong, which is why the parameter exists.
- 30: Python's integers are exact until the moment one becomes a float, which is the boundary to watch.

<!-- @example -->

<!-- @input -->
The five overflow failures measured across this module

<!-- @output -->
Every one silent — a wrong number, and in one case a program that never terminates

<!-- @why -->
Seeing all five together is what makes the pattern visible. Each looked like an isolated quirk in its own subtopic, and together they are one property of fixed-width arithmetic.

<!-- @walkthrough -->
1. Data Types: 100000 times 100000 is 10 billion, which exceeded the int range and returned negative 1,794,967,296.
2. Reverse a Number: 1534236469 is a valid int whose reverse is 9,646,324,351, and a naive int accumulator returned 1,056,389,759.
3. LCM: 50000 times 60000 is 3 billion, which overflowed and produced negative 129,496 for an answer that was actually 300,000 and fitted easily.
4. Prime Check: at candidate 46341 the expression i times i wrapped to negative 2,147,479,015, and since a negative value is always below n the loop never terminated.
5. Count Digits: log10 of fifteen nines returned exactly 15.0 rather than a value just below it, so the formula reported sixteen digits instead of fifteen.
6. In none of these cases did the program stop, warn, or indicate that anything had gone wrong.

<!-- @example -->

<!-- @input -->
What 0.1, 0.2 and 0.3 are actually stored as

<!-- @output -->
Three values that are all slightly wrong, and wrong in different directions

<!-- @why -->
The usual explanation stops at floating point is imprecise. Seeing the exact stored values, and that the roundings went in opposite directions, explains why this specific comparison fails rather than merely that it might.

<!-- @walkthrough -->
1. 0.1 is stored as 0.1000000000000000055511151231257827021181583404541015625, slightly above one tenth.
2. 0.2 is stored as 0.200000000000000011102230246251565404236316680908203125, also slightly above.
3. 0.3 is stored as 0.299999999999999988897769753748434595763683319091796875, which is slightly BELOW three tenths.
4. Adding the first two produces a value slightly above three tenths, because both inputs rounded upward.
5. The stored 0.3 rounded downward, so the sum and the constant are genuinely different numbers.
6. The equality test therefore returns false, and the difference is 5.551115123125783 times ten to the minus seventeen.

<!-- @example -->

<!-- @input -->
Converting 123456789012345 through a float and through a double

<!-- @output -->
The float loses 909,177. The double loses nothing.

<!-- @why -->
Widening protects range and not precision. A conversion the language considers safe enough to perform silently can still discard nearly a million, which is the strongest argument for preferring double over float.

<!-- @walkthrough -->
1. A 32-bit float has a 24-bit mantissa, so it represents integers exactly only up to 2 to the 24th, which is 16,777,216.
2. The value 123456789012345 is far beyond that, so it is rounded to the nearest representable float.
3. Converting back gives 123456788103168, an error of 909,177.
4. A 64-bit double has a 53-bit mantissa, exact up to 2 to the 53rd, and this value is below that.
5. Converting through a double returns the original exactly.
6. Crucially, long long to float is a widening conversion that requires no cast at all — the compiler treats it as safe.

<!-- @example -->

<!-- @input -->
Whether a double can distinguish 2⁵³ from 2⁵³ + 1

<!-- @output -->
No — they compare equal

<!-- @why -->
It connects the abstract mantissa width to a failure the student already saw, turning the log10 result from a curiosity into an instance of a general limit.

<!-- @walkthrough -->
1. A double has 53 bits of mantissa, so it can represent every integer exactly up to 2 to the 53rd.
2. That value is 9,007,199,254,740,992.
3. Adding one requires a 54th bit of precision, which does not exist.
4. The result rounds back to 2 to the 53rd, so the two values become the same double.
5. Measured: the comparison returns true, meaning the two are genuinely indistinguishable.
6. This is the underlying reason the Count Digits logarithm failed — at that magnitude the gaps between representable doubles are wide enough to swallow the difference between a value and the integer above it.

<!-- @visualization memory-model -->

<!-- @description -->
Two halves, one per failure mode. The INTEGER half draws the type's range as a closed ring rather than a line, with the maximum and minimum adjacent to each other at the top of the circle — that adjacency is the whole mechanism. A marker walks clockwise as the value increases, and stepping past the maximum carries it directly onto the minimum, with the value label flipping from positive to negative in a single step. Run the measured cases on it: 100000 times 100000 launches the marker several times around the ring before landing on negative 1,794,967,296, and the number of full laps is drawn as a counter so the discarded high bits become visible as completed circuits. Then the guard: before the operation, draw an arc from the current value to the maximum representing the available headroom, and show the pre-check comparing the operand against that arc's length rather than performing the operation — with a note that measuring the arc cannot itself overflow. Add the asymmetry panel showing the ring with one more position on the negative side than the positive, so negating the minimum has nowhere to land and returns to itself. The FLOATING-POINT half draws the real number line with representable doubles as discrete ticks whose spacing widens as magnitude grows. Place true 0.1 between two ticks and animate it snapping to the nearer one, slightly above; do the same for 0.2, also above; then for 0.3, which snaps slightly below. Adding the first two lands between ticks again and snaps to a tick that is visibly not the 0.3 tick, with the gap between them labelled 5.55e-17. Then zoom the axis out to 2 to the 53rd and show the tick spacing having grown to exactly 1, so consecutive integers share ticks — and zoom further to where log10 of fifteen nines sits, showing no tick between it and 15.0. Finish with a tolerance band drawn around a target tick, wide enough to contain the neighbouring ticks, illustrating that a comparison asks whether a value falls in the band rather than on the exact tick.

<!-- @sampleInput -->
```json
{"integerRing":{"max":2147483647,"min":-2147483648,"adjacent":true,"cases":[{"expr":"100000 * 100000","true":10000000000,"got":-1794967296,"laps":2},{"expr":"reverse(1534236469)","true":9646324351,"got":1056389759},{"expr":"50000 * 60000 / gcd","true":300000,"got":-129496},{"expr":"46341 * 46341","true":2147488281,"got":-2147479015,"consequence":"loop never terminates"}],"asymmetry":{"negatable":false,"negMinEquals":-2147483648}},"floatTicks":{"stored":{"0.1":"0.1000000000000000055511151231257827021181583404541015625","0.2":"0.200000000000000011102230246251565404236316680908203125","0.3":"0.299999999999999988897769753748434595763683319091796875"},"sum":"0.30000000000000004","difference":5.551115123125783e-17,"roundingDirections":{"0.1":"up","0.2":"up","0.3":"down"}},"mantissaLimits":{"float":{"bits":24,"exactTo":16777216,"lostOn":{"input":123456789012345,"got":123456788103168,"error":909177}},"double":{"bits":53,"exactTo":9007199254740992,"consecutiveIntegersFailAt":"2^53 + 1"}},"accumulation":{"0.1x10":0.9999999999999999,"0.1x1000":99.9999999999986},"tolerance":{"eps":1e-9,"actualDiff":5.551115123125783e-17,"passes":true}}
```

<!-- @highlights -->
- The integer range is drawn as a closed ring with the maximum and minimum adjacent at the top.
- A marker walking clockwise past the maximum lands directly on the minimum, the value flipping sign in one step.
- Running 100000 times 100000 sends the marker several full laps before settling on negative 1,794,967,296.
- A lap counter makes the discarded high bits visible as completed circuits rather than an abstraction.
- The guard panel draws the headroom from the current value to the maximum as an arc.
- The pre-check compares the operand against that arc instead of performing the operation, and measuring an arc cannot overflow.
- The asymmetry panel shows one more position on the negative side, so negating the minimum has nowhere to land.
- The floating-point half draws representable doubles as ticks whose spacing widens with magnitude.
- True 0.1 sits between two ticks and snaps to the nearer one, slightly above; 0.2 does the same.
- 0.3 snaps slightly below its true value, in the opposite direction from the other two.
- Adding the first two lands on a tick that is visibly not the 0.3 tick, with the gap labelled 5.55e-17.
- Zooming out to 2 to the 53rd, the tick spacing has grown to exactly 1 and consecutive integers begin sharing ticks.
- Zooming to where log10 of fifteen nines falls shows no tick between it and 15.0, which is the Count Digits failure.
- A tolerance band drawn around a target tick contains its neighbours, showing what a comparison actually asks.

<!-- @edgeCases -->
- A value exactly at the type's maximum, where adding one wraps to the minimum rather than saturating.
- The most negative value of a signed type, whose negation and absolute value are both still negative.
- An intermediate result that overflows while the final answer would have fitted, as in the LCM formula.
- A loop condition containing a product that overflows, which can make the condition permanently true and the loop infinite.
- A widening conversion from a 64-bit integer to a 32-bit float, which needs no cast and still loses precision.
- Integers beyond 2 to the 53rd stored as doubles, where consecutive values become indistinguishable.
- A logarithm or square root used to derive an integer at a boundary, where rounding may cross it.
- Accumulating many floating-point additions, where individually negligible errors compound.
- Comparing a floating-point value against zero, where a relative tolerance is meaningless and an absolute one is required.
- Constructing an exact decimal type from a floating-point literal, which captures the error rather than avoiding it.

<!-- @pitfalls -->
- Checking for overflow after the operation, when the value is already garbage and nothing remains to inspect.
- Casting the result to a wider type instead of an operand, which widens a value that has already wrapped.
- Taking an absolute value without handling the most negative case, which silently stays negative.
- Comparing floating-point values with equality rather than against a tolerance.
- Using a fixed absolute tolerance for values of widely differing magnitude.
- Using a relative tolerance when comparing against zero, where it can never be satisfied.
- Choosing float over double for anything but a memory-constrained situation.
- Assuming a widening conversion preserves precision, when it only guarantees range.
- Deriving an integer from a floating-point computation at a boundary, as the digit-count formula does.
- Constructing a Decimal or BigDecimal from a double literal instead of a string, which preserves the very error you were escaping.

<!-- @doubt -->
### Why doesn't the program crash when an integer overflows?

<!-- @answer -->
Because nothing is checked. The hardware discards the bits that do not fit and reinterprets what remains, which is a valid operation as far as the processor is concerned. In C++ signed overflow is undefined behaviour, meaning the compiler may assume it never happens; in Java it is defined to wrap silently. Either way you get a number rather than an error. Java's Math.addExact and multiplyExact are the exception — they throw ArithmeticException instead of wrapping, and there is no C++ equivalent.

<!-- @doubt -->
### Why can't I check for overflow after doing the arithmetic?

<!-- @answer -->
Because the information is already gone. Once the high bits are discarded, the remaining value carries no record of what was lost, so no test on it can distinguish an overflowed result from a legitimate one. You have to check before, by rearranging so the test cannot itself overflow — comparing against the limit minus one operand for addition, or the limit divided by one operand for multiplication. Measured: with a equal to two billion, the maximum minus a is 147,483,647, a small and perfectly safe number to compare against.

<!-- @doubt -->
### Why is abs of the most negative integer still negative?

<!-- @answer -->
Because the range is asymmetric. A 32-bit int runs from negative 2,147,483,648 to positive 2,147,483,647 — one more negative value than positive, since zero occupies a slot on the positive side. So the positive counterpart of the minimum simply does not exist in the type, and negating it wraps back to itself. Java documents this explicitly for Math.abs. Any code taking an absolute value has this edge case, which includes Count Digits, Reverse a Number and GCD.

<!-- @doubt -->
### Why is 0.1 + 0.2 not equal to 0.3?

<!-- @answer -->
Because none of the three is stored exactly. Binary fractions can only represent sums of one half, one quarter, one eighth and so on, and one tenth is not such a sum. Measured, 0.1 is stored as 0.10000000000000000555 and change, 0.2 as 0.20000000000000001110 and change, and 0.3 as 0.29999999999999998889 and change. Notice that the first two round upward while 0.3 rounds downward — so their sum lands above the stored 0.3, and the two are genuinely different numbers. Nothing malfunctioned; two approximations were added and the result is not the third approximation.

<!-- @doubt -->
### How should I compare floating-point values?

<!-- @answer -->
By checking whether their difference is smaller than a tolerance rather than testing equality. Measured, 0.1 plus 0.2 differs from 0.3 by 5.55 times ten to the minus seventeen, which is comfortably inside a tolerance of one times ten to the minus nine. Choose the tolerance for the magnitudes involved: a fixed value works when the scale is known, and a relative tolerance is better when values vary widely. Python's math.isclose does this properly, using a relative tolerance by default with an absolute option for comparisons against zero, where relative tolerance is meaningless.

<!-- @doubt -->
### Should I use float or double?

<!-- @answer -->
Double, unless memory is genuinely the binding constraint. A float has 24 bits of mantissa and represents integers exactly only to 16,777,216, while a double has 53 bits and reaches 9,007,199,254,740,992. Measured, converting 123,456,789,012,345 through a float loses 909,177 while a double loses nothing. What makes this dangerous is that the conversion is a widening one requiring no cast, so the language performs it silently — widening protects range and not precision.

<!-- @doubt -->
### Why do the log10 and square-root failures in this module happen?

<!-- @answer -->
Both come from the same limit. A double represents every integer exactly up to 2 to the 53rd, and beyond that the gaps between representable values exceed 1. So log10 of fifteen nines is truly 14.999999999999999996, and no double exists between that and 15.0 — the library returns exactly 15.0 and the digit count comes out one too high. The general rule is never to derive an integer from a floating-point computation at a boundary, because the rounding may cross it. Compute in integers where you can, which is why the digit-removal loop and the i times i comparison are the correct forms.

<!-- @doubt -->
### Does any of this apply to Python?

<!-- @answer -->
Half of it. Python's integers are unbounded, so integer overflow genuinely does not exist there — every overflow lesson in this module is inapplicable to Python integers, and abs of any value works correctly. Floating point is entirely unchanged, because Python uses the same IEEE-754 doubles as everyone else. And the moment an integer becomes a float the limits return: float of 2 to the 53rd plus one equals float of 2 to the 53rd, so a value Python's integers held perfectly is lost. Integer overflow also matters in Python whenever a problem statement imposes a 32-bit range, or when you translate the solution to C++ or Java.
