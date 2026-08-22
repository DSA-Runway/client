---
id: pow-x-n
topic: Advanced Recursion
title: Pow(x, n)
difficulty: Easy
status: ready
prerequisites:
  - fibonacci-number
  - factorial-of-a-given-number
  - data-types
  - integer-overflow-and-precision-errors
  - time-and-space-complexity-basics
relatedIds:
  - fibonacci-number
  - factorial-of-a-given-number
  - integer-overflow-and-precision-errors
  - data-types
---

<!-- @summary -->
The first problem where recursion makes something faster rather than merely expressing it: halving the exponent turns n multiplications into floor(log2 n) + 2, which at n = 1,048,576 is 22 instead of a million. It also contains the sharpest trap in the topic — writing the recursive call twice instead of storing it costs exactly 4n − 1 calls, making it 2.81x slower than the naive loop it was meant to replace.

<!-- @theory -->
## The problem

Compute `x` raised to the power `n`, where `n` may be negative.

```
pow(2.0, 10)   ->  1024.0
pow(2.0, -2)   ->  0.25
pow(2.0, 0)    ->  1.0
```

## Recursion that buys something

Everything in Basic Recursion expressed a definition. Factorial's recursion cost
the same as its loop; palindrome's cost the same as its loop; Fibonacci's cost
catastrophically more. None of them was *faster* than iterating.

This one is, and the reason is that the problem halves instead of decrementing:

```
x^n  =  (x^(n/2))^2            when n is even
x^n  =  (x^(n/2))^2 * x        when n is odd
```

Each step throws away half the remaining exponent, so the recursion depth is
logarithmic. Measured multiplication counts:

| n | Naive loop | Binary exponentiation |
|---|---|---|
| 8 | 8 | 5 |
| 1,024 | 1,024 | **12** |
| 65,536 | 65,536 | 18 |
| 1,048,576 | 1,048,576 | **22** |

The call count is exactly `floor(log2 n) + 2` — the chain runs n, n/2, n/4 … 1, 0,
which is one level per bit plus the base case.

## The trap: writing the call twice

This is the version that looks right and is not:

```
return pow(x, n/2) * pow(x, n/2);        // WRONG — two calls
double half = pow(x, n/2); return half*half;   // right — one call
```

Both compute the same value. The first one asks for it twice, and each of those
asks twice again, so the halving buys nothing at all. Counted exactly:

| n | Correct: calls | Trap: calls | Trap: multiplications |
|---|---|---|---|
| 8 | 5 | 31 | 23 |
| 1,024 | 12 | **4,095** | 3,071 |
| 1,048,576 | 22 | **4,194,303** | 3,145,727 |

Two exact identities: the trap makes **4n − 1 calls** and **3n − 1
multiplications**. So it is not merely "not logarithmic" — it does **three times
the multiplications of the naive loop**, and measured at `-O0` it ran
**10,862.7ns against the naive loop's 3,866.5ns**, a factor of **2.81 slower than
the thing it was supposed to improve on**.

## But the compiler may hide it, which is worse

Compile the same trap at `-O2` and it measures **12.5ns** — faster than the
correct recursive version. The optimiser noticed that `pow(x, n/2)` and
`pow(x, n/2)` are the same call with the same arguments and computed it once.
That is common-subexpression elimination, and it makes the bug invisible in a
benchmark:

| | `-O0` | `-O2` |
|---|---|---|
| Naive loop | 3,866.5ns | 1,156.8ns |
| Binary exponentiation | 81.1ns | 35.9ns |
| **The trap** | **10,862.7ns** | **12.5ns** |

The same source, 869x apart depending on the flag.

Compare this with Fibonacci, where the compiler could not help at all. There the
two calls were `fib(n-1)` and `fib(n-2)` — **different arguments**, so there is
nothing to fold. Here they are identical, which is exactly the condition CSE
needs. The rescue evaporates the moment the function has a side effect or the
compiler cannot prove it is pure: with a call counter added, the count stays at
4n − 1 at every optimisation level.

Do not rely on it. Store the result in a variable and the question never arises.

## Fewer multiplications does not mean less error

The tempting next claim is that doing 22 multiplications instead of a million
must also be more accurate. Measured against a 60-digit reference over 3,283
random pairs with `x` in 0.5…1.5 and `n` in 50…3,000:

| | Share of cases where it was more accurate |
|---|---|
| Naive loop | **57.9%** |
| Binary exponentiation | 40.9% |
| Exact tie | 1.2% |

The naive loop wins more often. The error ratio of binary to naive had a median
of 1.15x, a 90th percentile of 3.80x, and a worst case of **2,890x**.

The mechanism is that **squaring doubles the relative error**. If `h` carries
relative error `e`, then `h*h` carries about `2e`, because the error appears in
both factors. Measured directly, squaring x repeatedly:

| After k squarings | Relative error | Ratio to previous |
|---|---|---|
| 1 | 5.844e-17 | — |
| 4 | 5.121e-16 | 2.17x |
| 6 | 1.843e-15 | 2.10x |
| 8 | **7.187e-15** | **2.01x** |

So `log2(n)` squarings compound to roughly `n · eps` — the same order as `n`
sequential roundings. The operation count falls by a factor of 47,662 and the
accuracy does not improve at all. Speed and precision are separate questions
here, and only one of them is helped.

## The exponent's sign is where the bugs are

`x^-n` is `1 / x^n`, so the usual shape is:

```
if (n < 0) { x = 1 / x; n = -n; }
```

With `n` declared `int` that line has a bug that only fires on one input.
`INT_MIN` is −2,147,483,648 and `INT_MAX` is 2,147,483,647, so **`-INT_MIN` is
not representable**. Measured:

```
INT_MIN         = -2147483648
-INT_MIN as int = -2147483648      <- still negative
```

The negation silently returns the same value, `n` stays negative, and the
recursion never reaches its base case. Widening to `long long` before negating
fixes it, and that is the entire fix.

## If you are doing this in integers, the type runs out immediately

Factorial died at 12! and Fibonacci reached F(92). Integer powers are worse than
either, because the base matters:

| Base | Last exponent whose result fits a 32-bit int |
|---|---|
| 2 | 30 |
| 3 | 19 |
| 10 | **9** |

`10^10` already overflows. Any integer power routine needs either a modulus, a
64-bit type, or a range check — which is why the practical version of this
problem is almost always *modular* exponentiation.

## What to actually call

Per call, `-O2`:

| | n = 1,024 | n = 1,048,576 |
|---|---|---|
| Naive loop | 1,359.9ns | 1,383,484.7ns |
| Binary exponentiation, recursive | 39.6ns | 71.0ns |
| Binary exponentiation, iterative | **4.7ns** | 12.5ns |
| `std::pow` | 7.6ns | **7.6ns** |

Three things stand out. The iterative bit-walk beats the recursive version by
about 8x at n = 1,024, because it has no call overhead and no stack. `std::pow`
is **flat** — 7.6ns at both sizes — because it does not iterate at all; it
computes `exp(n · log x)`, which is O(1) and has entirely different accuracy
behaviour. And at n = 1,048,576 the naive loop is **110,679x** slower than the
iterative version.

For floating-point powers, call `std::pow`. Binary exponentiation earns its place
where `std::pow` does not apply: integer or modular arithmetic, matrices, or any
monoid where "multiply" is defined but "logarithm" is not.

## Where this goes next

The next subtopics take the same halving idea into problems with no closed form
at all. **Count Good Numbers** is modular exponentiation wearing a disguise — the
same recursion with every multiplication taken mod 10^9+7, which is where binary
exponentiation stops being an optimisation and becomes the only option, since
there is no `std::pow` for modular arithmetic.

<!-- @intuition -->
Multiplying x by itself n times is the definition, not the method. The observation that makes it fast is that x^n is the square of x^(n/2) — so instead of removing one factor per step you remove half the remaining exponent, and the number of steps drops from n to the number of bits in n. The one thing to be careful about is that you need x^(n/2) once, not twice: writing the recursive call on both sides of the multiplication asks for the same value twice, and since each of those does the same again, the halving is completely cancelled out. Store it in a variable. The other half of the problem is the exponent's sign, where a negative n means take the reciprocal, and the most negative int cannot be negated at all.

<!-- @approach -->
### Brute Force - Multiply n Times

<!-- @idea -->
Start at one and multiply by x, n times over.

<!-- @steps -->
1. Start the result at one, the identity for multiplication.
2. Repeat n times, multiplying the result by x each pass.
3. Return the result.
4. Handle a negative exponent by taking the reciprocal of the answer.
5. Note that the loop count is the exponent itself, so cost grows with n rather than with its size.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The definition written out, and it is the slow one — 1,383,484.7ns at n = 1,048,576 against the iterative binary version's 12.5ns, a factor of 110,679. It is worth keeping in mind for one reason: measured against a 60-digit reference it was the MORE accurate of the two in 57.9% of 3,283 random cases, so it is not strictly dominated.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

double myPow(double x, int n) {
    long long e = n;                  // widen BEFORE negating
    if (e < 0) { x = 1 / x; e = -e; }

    double result = 1;
    for (long long i = 0; i < e; i++) result *= x;
    return result;
}
```

<!-- @annotations -->
- 5: Widening to long long before negating is the whole fix for INT_MIN — as an int, -INT_MIN is still INT_MIN and the loop would never run.
- 6: Reciprocal first, then a positive exponent, so the loop body never has to know about the sign.
- 9: Exactly n multiplications, which is what the next approach removes.

<!-- @code java -->
```java
static double myPow(double x, int n) {
    long e = n;
    if (e < 0) { x = 1 / x; e = -e; }

    double result = 1;
    for (long i = 0; i < e; i++) result *= x;
    return result;
}
```

<!-- @annotations -->
- 2: Java's int has the same asymmetric range as C++, so Integer.MIN_VALUE cannot be negated either — the widening to long is required for the same reason.

<!-- @code python -->
```python
def my_pow(x, n):
    if n < 0:
        x, n = 1 / x, -n
    result = 1.0
    for _ in range(n):
        result *= x
    return result


# Python integers have no fixed width, so -n is always safe here —
# the INT_MIN trap simply does not exist in this language.
```

<!-- @annotations -->
- 3: Safe in Python for any n, since integers are arbitrary precision and negation cannot overflow.
- 5: The loop runs n times, so this is unusable for the large exponents the next approach handles in twenty-odd steps.

<!-- @approach -->
### Optimal - Binary Exponentiation

<!-- @idea -->
Compute x to the half power once, square it, and multiply by one more x if the exponent was odd.

<!-- @steps -->
1. If the exponent is zero, return one.
2. Otherwise compute the result for the exponent halved, and store it in a variable.
3. Square that stored value.
4. If the exponent was odd, multiply by one extra x.
5. Return the result, having used one recursive call rather than two.

<!-- @complexity -->
- time: O(log n)
- space: O(log n) call stack
- note: Exactly floor(log2 n) + 2 calls — 22 at n = 1,048,576 against the loop's 1,048,576 multiplications. The single most important detail is storing the recursive result: calling it twice instead costs 4n − 1 calls and 3n − 1 multiplications, which is 2.81x slower than the naive loop at -O0. Fewer multiplications does not mean more accuracy — squaring doubles the relative error, measured at 2.01x per squaring.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

double powPositive(double x, long long e) {
    if (e == 0) return 1;

    double half = powPositive(x, e / 2);   // ONE call, stored
    return (e % 2 == 0) ? half * half : half * half * x;
}

double myPow(double x, int n) {
    long long e = n;
    if (e < 0) { x = 1 / x; e = -e; }
    return powPositive(x, e);
}
```

<!-- @annotations -->
- 7: Storing the call in half is the entire difference between O(log n) and O(n). Writing powPositive(x, e/2) * powPositive(x, e/2) makes 4n - 1 calls.
- 8: Integer division floors, so an odd e loses its remainder — the extra multiply by x puts it back.
- 13: The sign is handled once, at the top, so the recursive function only ever sees a non-negative exponent.

<!-- @code java -->
```java
static double powPositive(double x, long e) {
    if (e == 0) return 1;

    double half = powPositive(x, e / 2);
    return (e % 2 == 0) ? half * half : half * half * x;
}

static double myPow(double x, int n) {
    long e = n;
    if (e < 0) { x = 1 / x; e = -e; }
    return powPositive(x, e);
}
```

<!-- @annotations -->
- 4: One call assigned to a local, for the same reason as in C++ — the JVM will not fold a duplicated call for you.

<!-- @code python -->
```python
def pow_positive(x, e):
    if e == 0:
        return 1.0
    half = pow_positive(x, e // 2)
    return half * half if e % 2 == 0 else half * half * x


def my_pow(x, n):
    if n < 0:
        x, n = 1 / x, -n
    return pow_positive(x, n)


# e // 2, not e / 2. With true division the exponent halves as a float
# and only underflows to exactly 0.0 after 1,078 steps — past the default
# recursion limit of 1,000, so it raises RecursionError. Raise the limit
# and it returns inf instead, because 2.5 % 2 is 0.5, so every level
# after the first is treated as odd and multiplies by x again.
```

<!-- @annotations -->
- 4: Floor division. With / the exponent becomes a float that reaches exactly 0.0 only after 1,078 halvings, so at the default recursion limit of 1,000 it raises RecursionError — and with the limit raised it returns inf, since 2.5 % 2 is 0.5 and every level then counts as odd.
- 5: The stored half is used twice in the expression but computed once, which is the point.

<!-- @approach -->
### Iterative - Walk the Bits

<!-- @idea -->
Read the exponent's binary digits, squaring a running base and folding in the ones.

<!-- @steps -->
1. Start the result at one and the running base at x.
2. While the exponent is non-zero, look at its lowest bit.
3. If that bit is set, multiply the running base into the result.
4. Square the running base and shift the exponent right by one.
5. Stop when the exponent reaches zero.

<!-- @complexity -->
- time: O(log n)
- space: O(1)
- note: The same algorithm without the stack, and measurably quicker for it — 4.7ns at n = 1,024 against the recursive version's 39.6ns, about 8x, because there is no call overhead and no frame. This is the form to use when binary exponentiation is genuinely needed, and the one that generalises directly to modular and matrix exponentiation.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

double myPow(double x, int n) {
    long long e = n;
    if (e < 0) { x = 1 / x; e = -e; }

    double result = 1;
    while (e > 0) {
        if (e & 1) result *= x;       // this bit is set
        x *= x;                        // square for the next bit
        e >>= 1;
    }
    return result;
}
```

<!-- @annotations -->
- 10: e & 1 tests the lowest bit, which is exactly the odd case from the recursive version.
- 11: x is squared once per bit, so it holds x^(2^k) at step k — this is the same squaring chain, unrolled.
- 12: e >>= 1 on a signed value is fine here because e is already non-negative; the sign was removed on line 6.

<!-- @code java -->
```java
static double myPow(double x, int n) {
    long e = n;
    if (e < 0) { x = 1 / x; e = -e; }

    double result = 1;
    while (e > 0) {
        if ((e & 1) == 1) result *= x;
        x *= x;
        e >>= 1;
    }
    return result;
}
```

<!-- @annotations -->
- 7: The explicit == 1 is needed because Java has no implicit conversion from a numeric type to boolean.

<!-- @code python -->
```python
def my_pow(x, n):
    if n < 0:
        x, n = 1 / x, -n
    result = 1.0
    while n:
        if n & 1:
            result *= x
        x *= x
        n >>= 1
    return result


# For integers, Python already has this built in: pow(base, exp, mod)
# performs modular exponentiation by exactly this method.
```

<!-- @annotations -->
- 5: while n rather than while n > 0, since n is guaranteed non-negative by line 3 and zero is falsy.
- 13: The three-argument pow is the standard-library version of the next subtopic's problem.

<!-- @approach -->
### The Library Call

<!-- @idea -->
Use the standard library's power function, which does not iterate at all.

<!-- @steps -->
1. Call the library function with the base and the exponent.
2. Accept that it computes the result through logarithms rather than by multiplying.
3. Note that its cost does not depend on the exponent.
4. Prefer it for floating-point powers.
5. Reach for binary exponentiation only where the library function does not apply.

<!-- @complexity -->
- time: O(1)
- space: O(1)
- note: Measured 7.6ns at n = 1,024 and 7.6ns at n = 1,048,576 — flat, because it evaluates exp(n · log x) rather than multiplying anything. That makes it faster than binary exponentiation at large n and slower at small n, where the iterative bit-walk measured 4.7ns. It does not extend to integers modulo m, to matrices, or to any operation without a logarithm, which is the whole reason the previous approaches exist.

<!-- @code cpp -->
```cpp
#include <cmath>
using namespace std;

double myPow(double x, int n) {
    return pow(x, (double)n);
}
```

<!-- @annotations -->
- 5: Handles negative n directly, so none of the sign or INT_MIN handling is needed here.
- 5: Constant time in n — measured 7.6ns at both n = 1,024 and n = 1,048,576.

<!-- @code java -->
```java
static double myPow(double x, int n) {
    return Math.pow(x, n);
}
```

<!-- @annotations -->
- 2: Math.pow takes doubles for both arguments, so the int exponent is widened implicitly.

<!-- @code python -->
```python
def my_pow(x, n):
    return x ** n


# For integers use the three-argument built-in instead:
#     pow(base, exp, mod)
# which is binary exponentiation with a modulus, in C.
```

<!-- @annotations -->
- 2: The ** operator dispatches to integer exponentiation for int operands and to floating-point for floats, so it is exact for integer bases.
- 6: pow(base, exp, mod) is the routine the next subtopic needs, already written and already fast.

<!-- @example -->

<!-- @input -->
x = 2, n = 10 through binary exponentiation

<!-- @output -->
1024, from 5 multiplications instead of 10

<!-- @why -->
The smallest trace where the halving is visible, and where the odd step shows why the extra multiply exists.

<!-- @walkthrough -->
1. powPositive(2, 10) needs powPositive(2, 5), so it calls once and waits.
2. powPositive(2, 5) needs powPositive(2, 2); note 5 divided by 2 is 2, losing the remainder.
3. powPositive(2, 2) needs powPositive(2, 1), which needs powPositive(2, 0).
4. powPositive(2, 0) returns 1, the base case.
5. Coming back out: 1 is odd, so it returns 1*1*2 = 2, restoring the remainder that the division dropped.
6. Then 2 is even, returning 2*2 = 4; then 5 is odd, returning 4*4*2 = 32.
7. Finally 10 is even, returning 32*32 = 1024 — five multiplications and six calls, against ten multiplications for the loop.

<!-- @example -->

<!-- @input -->
The recursive call written twice instead of stored

<!-- @output -->
4n − 1 calls and 3n − 1 multiplications — three times the naive loop

<!-- @why -->
It is the defining mistake of this problem, it looks identical to the correct version, and it is worse than the algorithm it was meant to replace rather than merely no better.

<!-- @walkthrough -->
1. Writing return pow(x, n/2) * pow(x, n/2) asks for the same value twice.
2. Each of those two calls asks twice again, so the tree doubles at every level while the exponent only halves.
3. Counted exactly, that is 4n − 1 calls and 3n − 1 multiplications, verified at n = 8, 1,024 and 1,048,576.
4. At n = 1,024 the correct version makes 12 calls and this makes 4,095.
5. Since the naive loop needs only n multiplications, the trap does three times as many.
6. Measured at -O0 it took 10,862.7ns against the naive loop's 3,866.5ns — 2.81x slower than the thing it was optimising.
7. Assigning the call to a local variable and using it twice is the entire fix.

<!-- @example -->

<!-- @input -->
The same trap compiled at -O0 and at -O2

<!-- @output -->
10,862.7ns and 12.5ns — the optimiser hides the bug

<!-- @why -->
It shows why you cannot benchmark your way to noticing this, and it contrasts precisely with Fibonacci, where the compiler could not help at all.

<!-- @walkthrough -->
1. At -O0 the trap runs every call it was written to make and measures 10,862.7ns at n = 1,024.
2. At -O2 the same source measures 12.5ns, faster than the correct recursive version.
3. The optimiser noticed that both calls have identical arguments and computed the value once — common-subexpression elimination.
4. In Fibonacci the two calls were fib(n-1) and fib(n-2), which have different arguments, so there was nothing to fold and one self-call survived even at -O2.
5. Here the arguments are the same, which is exactly the condition the optimisation needs.
6. The rescue is conditional: adding a call counter makes the function impure and the count returns to 4n − 1 at every optimisation level.
7. So the correct conclusion is not that the trap is harmless but that a release build may conceal it.

<!-- @example -->

<!-- @input -->
Accuracy of 22 multiplications versus 1,048,576 of them

<!-- @output -->
The naive loop was more accurate in 57.9% of cases

<!-- @why -->
It refutes the natural assumption that doing far less arithmetic must also accumulate less error, and the mechanism is measurable rather than asserted.

<!-- @walkthrough -->
1. Over 3,283 random pairs with x in 0.5 to 1.5 and n in 50 to 3,000, compared against a 60-digit reference.
2. The naive loop was closer to the true value in 57.9% of cases, binary exponentiation in 40.9%, with 1.2% exact ties.
3. The ratio of binary error to naive error had a median of 1.15x and a 90th percentile of 3.80x.
4. The reason is that squaring doubles the relative error: if h carries error e, then h*h carries about 2e, since the error is present in both factors.
5. Measured by squaring a value repeatedly, the error ratio between successive squarings converged to 2.01x.
6. So log2(n) squarings compound to roughly n times machine epsilon, the same order as n sequential roundings.
7. The operation count falls by a factor of 47,662 and the accuracy does not improve — speed and precision are independent here.

<!-- @visualization custom -->

<!-- @description -->
Two panels that answer different questions, plus a trap panel between them. On the left the exponent as a row of binary digits, for n = 10 shown as 1010, with a squaring chain running beneath it: x, x squared, x to the fourth, x to the eighth, one box per bit. Light the boxes whose bit is set — for 1010 that is x squared and x to the eighth — and draw them combining into the answer, so the reader sees that the algorithm is literally reading the exponent's binary representation and that the number of steps is the number of bits. Beside it run the recursive form on the same input as a vertical chain: 10, 5, 2, 1, 0, with each level annotated even or odd and the odd levels carrying an extra times x label, ending with the returned values 1, 2, 4, 32, 1024 climbing back up. Keep a step counter reading 5 multiplications next to a greyed comparison reading 10 for the loop, then let a slider raise n so the two counters diverge — at n = 1,048,576 they read 22 against 1,048,576. The trap panel sits in the middle and should be the visual centrepiece: the same recursive chain, but each node now spawns two identical children instead of one, so a structure that was a line becomes a full binary tree. Colour every node after the first at each level as a duplicate, and run two counters, calls = 4n − 1 and multiplications = 3n − 1, beside a third showing the naive loop's n — the point being that the trap's bar is three times the loop's, not shorter than it. Underneath, two timing bars labelled -O0 and -O2 for the identical source, 10,862.7ns and 12.5ns, with a caption that the optimiser folded the duplicate call because both had the same arguments, and a small side-note linking to Fibonacci where the arguments differed and it could not. The right-hand panel is accuracy and must not be drawn as a win: a horizontal error axis with two clouds of points, naive and binary, overlapping heavily, with the tally 57.9% against 40.9% printed above and a small inset showing relative error doubling — 5.844e-17, 5.121e-16, 1.843e-15, 7.187e-15 — with the ratio 2.01x marked between the last two.

<!-- @sampleInput -->
```json
{"primary":{"x":2,"n":10,"result":1024,"form":"binary exponentiation, recursive","chain":[{"e":10,"parity":"even","needs":5},{"e":5,"parity":"odd","needs":2},{"e":2,"parity":"even","needs":1},{"e":1,"parity":"odd","needs":0},{"e":0,"baseCase":true,"returns":1}],"unwind":[{"e":1,"computes":"1*1*2","returns":2,"note":"odd — the extra x restores the remainder integer division dropped"},{"e":2,"computes":"2*2","returns":4},{"e":5,"computes":"4*4*2","returns":32,"note":"odd"},{"e":10,"computes":"32*32","returns":1024}],"multiplications":5,"calls":6,"naiveMultiplications":10},"bitView":{"n":10,"binary":"1010","squaringChain":["x","x^2","x^4","x^8"],"bitsSet":["x^2","x^8"],"reading":"the algorithm reads the exponent's binary digits; the step count is the bit count"},"operationCounts":{"callIdentity":"floor(log2 n) + 2","rows":[{"n":8,"naiveMults":8,"binaryMults":5,"binaryCalls":5},{"n":1024,"naiveMults":1024,"binaryMults":12,"binaryCalls":12},{"n":65536,"naiveMults":65536,"binaryMults":18,"binaryCalls":18},{"n":1048576,"naiveMults":1048576,"binaryMults":22,"binaryCalls":22}],"reductionAtN1048576":47662},"theTrap":{"wrong":"return pow(x, n/2) * pow(x, n/2);","right":"double half = pow(x, n/2); return half*half;","callIdentity":"4n - 1","multIdentity":"3n - 1","rows":[{"n":8,"correctCalls":5,"trapCalls":31,"trapMults":23},{"n":1024,"correctCalls":12,"trapCalls":4095,"trapMults":3071},{"n":1048576,"correctCalls":22,"trapCalls":4194303,"trapMults":3145727}],"worseThanNaive":"3x the multiplications of the naive loop","measuredO0":{"naiveNs":3866.5,"binaryNs":81.1,"trapNs":10862.7,"trapVsNaive":2.81},"compilerRescue":{"O2TrapNs":12.5,"sameSourceRatio":869,"mechanism":"common-subexpression elimination — both calls have identical arguments","contrastWithFibonacci":"there the calls were fib(n-1) and fib(n-2), different arguments, so one self-call survived even at -O2","conditional":"adding a call counter makes the function impure and the count returns to 4n-1 at every level"}},"accuracy":{"reference":"60-digit decimal","trials":3283,"xRange":[0.5,1.5],"nRange":[50,3000],"naiveMoreAccuratePct":57.9,"binaryMoreAccuratePct":40.9,"tiePct":1.2,"errorRatioBinaryOverNaive":{"median":1.15,"p10":0.29,"p90":3.80,"max":2890.4},"mechanism":"squaring doubles the relative error — err(h*h) ~ 2*err(h)","squaringChain":[{"squarings":1,"relErr":5.844e-17},{"squarings":4,"relErr":5.121e-16,"ratio":2.17},{"squarings":6,"relErr":1.843e-15,"ratio":2.10},{"squarings":8,"relErr":7.187e-15,"ratio":2.01}],"reading":"the operation count falls 47,662x and the accuracy does not improve"},"signHandling":{"rule":"x^-n = 1 / x^n","intMinTrap":{"INT_MIN":-2147483648,"negatedAsInt":-2147483648,"note":"still negative — the negation is not representable","consequence":"n stays negative and the recursion never reaches its base case","fix":"widen to long long before negating"}},"integerOverflow":{"lastExponentFittingInt32":[{"base":2,"exponent":30},{"base":3,"exponent":19},{"base":10,"exponent":9}],"reading":"10^10 already overflows, which is why the practical version is modular exponentiation"},"timing":{"unit":"ns per call, -O2, median of 7","rows":[{"form":"naive loop","n1024":1359.9,"n1048576":1383484.7},{"form":"binary exponentiation, recursive","n1024":39.6,"n1048576":71.0},{"form":"binary exponentiation, iterative","n1024":4.7,"n1048576":12.5},{"form":"std::pow","n1024":7.6,"n1048576":7.6}],"notes":{"iterativeVsRecursive":"about 8x at n = 1,024, from no call overhead and no frame","stdPowIsFlat":"7.6ns at both sizes — it computes exp(n*log x), which does not iterate","naiveVsIterativeAtN1048576":110679}}}
```

<!-- @highlights -->
- The exponent is drawn as binary digits — 1010 for n = 10 — above a squaring chain of x, x², x⁴, x⁸.
- The boxes whose bit is set light up (x² and x⁸ for 1010) and combine into the answer.
- That makes the step count visibly equal to the bit count rather than to n.
- Beside it the recursive chain runs 10, 5, 2, 1, 0, each level marked even or odd.
- Odd levels carry an extra times x label, and the returned values 1, 2, 4, 32, 1024 climb back up.
- A step counter reads 5 multiplications against a greyed 10 for the loop.
- A slider raises n until the counters read 22 against 1,048,576.
- The trap panel is the centrepiece: each node spawns two identical children, so the line becomes a full binary tree.
- Every node after the first at each level is coloured as a duplicate.
- Three counters run beside it: calls 4n − 1, multiplications 3n − 1, and the naive loop's n.
- The trap's bar is three times the loop's, not shorter — that is the whole point.
- Two timing bars for identical source, -O0 at 10,862.7ns and -O2 at 12.5ns.
- A caption explains the optimiser folded the duplicate call because both had the same arguments.
- A side-note links to Fibonacci, where the arguments differed and the fold was impossible.
- The accuracy panel shows two heavily overlapping point clouds with the tally 57.9% against 40.9%.
- An inset shows relative error doubling — 5.844e-17 to 7.187e-15 — with 2.01x marked between the last two steps.

<!-- @edgeCases -->
- n equal to zero — the answer is 1 for any x, and it is the base case of the recursion.
- n equal to one — returns x, and exercises the odd branch exactly once.
- x equal to zero with positive n — returns 0; with negative n it divides by zero.
- x equal to one — returns 1 for every n, and cannot distinguish a correct implementation from a broken one.
- Negative x with an odd n — the sign must survive, which it does since the extra multiply carries it.
- n equal to INT_MIN — the negation is not representable as an int, so the exponent stays negative and the recursion never terminates.
- n equal to INT_MAX — the largest positive exponent, needing 32 levels.
- A negative exponent generally — x becomes 1/x, which loses precision before the powering even starts.
- Integer base 10 with exponent 10 — already overflows a 32-bit int, where base 2 survives to exponent 30.
- Very large n with the naive loop — 1,383,484.7ns at n = 1,048,576 against 12.5ns for the bit-walk.
- Any n with the doubled recursive call — 4n − 1 calls, which is worse than the naive loop it replaced.

<!-- @pitfalls -->
- Writing the recursive call twice instead of storing it. That costs 4n − 1 calls and 3n − 1 multiplications, which is three times the naive loop and 2.81x slower than it at -O0.
- Benchmarking that mistake at -O2 and concluding it is fine. The optimiser folds the duplicate call because both have identical arguments; the same source measured 869x apart between -O0 and -O2.
- Relying on that fold. Give the function any side effect and the count returns to 4n − 1 at every optimisation level.
- Negating an int exponent. -INT_MIN is not representable, so n stays negative and the base case is never reached — widen to long long first.
- Assuming fewer multiplications means more accuracy. Measured over 3,283 cases the naive loop was closer to the true value 57.9% of the time, because squaring doubles the relative error at each step.
- Using / instead of // for the halving in Python. The exponent becomes a float, never equals 0 exactly, and the recursion runs to RecursionError.
- Forgetting the extra multiply on the odd branch. Integer division drops the remainder, and that one x is what restores it.
- Testing only with x = 1 or n = 0. Both return the right answer for almost any implementation, correct or not.
- Computing integer powers without a bound. 10^10 overflows a 32-bit int, and base 3 runs out at exponent 19.
- Reaching for binary exponentiation for plain floating-point powers. std::pow measured 7.6ns flat at every n, faster than the bit-walk above about n = 1,024.
- Assuming std::pow always wins. It is constant time but its accuracy comes from exp and log, and it does not exist for modular or matrix arithmetic, which is where these approaches are actually needed.
- Taking the reciprocal after powering rather than before. 1/(x^n) and (1/x)^n differ in rounding, and the second keeps the intermediate magnitudes smaller.

<!-- @doubt -->
### Why is this faster when factorial's recursion was not?

<!-- @answer -->
Because the problem halves rather than decrements. Factorial's recursion removed one factor per level, so it needed n levels and cost exactly what the loop cost. Here x^n is the square of x^(n/2), so each level discards half the remaining exponent and the depth is the number of bits in n rather than n itself. Measured, that is floor(log2 n) + 2 calls: 22 at n = 1,048,576 against 1,048,576 multiplications for the loop, a reduction of 47,662x. This is the first problem in the curriculum where writing it recursively makes it asymptotically faster instead of merely expressing the definition.

<!-- @doubt -->
### What exactly goes wrong if I write the call twice?

<!-- @answer -->
The halving is cancelled out completely. Writing return pow(x, n/2) * pow(x, n/2) asks for the same value twice, and each of those asks twice again, so the tree doubles at every level while the exponent only halves. Counted exactly, that is 4n − 1 calls and 3n − 1 multiplications — verified at n = 8, 1,024 and 1,048,576. At n = 1,024 the correct version makes 12 calls and this makes 4,095. Note that 3n − 1 is three times what the naive loop needs, so this is not just a failed optimisation: measured at -O0 it took 10,862.7ns against the loop's 3,866.5ns, 2.81x slower than the code it was meant to improve.

<!-- @doubt -->
### My version times fine though — is it actually a problem?

<!-- @answer -->
Probably because you measured a release build. At -O2 the same trap measured 12.5ns, faster than the correct recursive version, because the optimiser saw that both calls have identical arguments and computed the value once. That is common-subexpression elimination, and the identical source measured 869x apart between -O0 and -O2. It is not something to rely on: the fold requires the compiler to prove the function is pure, and adding so much as a call counter puts the count back to 4n − 1 at every optimisation level. Storing the result in a local removes the question entirely and costs nothing.

<!-- @doubt -->
### Why could the compiler rescue this but not Fibonacci?

<!-- @answer -->
Because of the arguments. Here the two calls are pow(x, n/2) and pow(x, n/2) — the same function with the same inputs, so one evaluation can serve both, which is exactly what common-subexpression elimination does. In Fibonacci the two calls are fib(n-1) and fib(n-2), which have different arguments and genuinely different results, so there is nothing to fold; measured there, one self-call survived even at -O2. The lesson is that duplicate work is only removable when it is literally duplicate. A tree of distinct subproblems has to be fixed by remembering results, which is what memoisation does.

<!-- @doubt -->
### Doesn't doing 22 multiplications instead of a million improve accuracy?

<!-- @answer -->
No, and the measurement is fairly emphatic. Against a 60-digit reference over 3,283 random pairs, the naive loop was the more accurate of the two in 57.9% of cases and binary exponentiation in 40.9%, with the error ratio having a median of 1.15x and a worst case of 2,890x. The mechanism is that squaring doubles the relative error — if h carries error e then h*h carries about 2e, since the error sits in both factors. Measured directly by repeated squaring, the ratio between successive errors converged to 2.01x. So log2(n) squarings compound to about n times machine epsilon, the same order as n sequential roundings. Speed and precision are separate questions and only the first one improves.

<!-- @doubt -->
### What is the INT_MIN problem?

<!-- @answer -->
A signed int's range is asymmetric: it runs from −2,147,483,648 to 2,147,483,647, so the most negative value has no positive counterpart. The standard opening line for this problem — if (n < 0) { x = 1/x; n = -n; } — therefore fails on exactly one input. Measured, -INT_MIN as an int is still −2,147,483,648, so n stays negative, the base case is never reached, and the recursion runs until the stack is exhausted. Assigning n to a long long before negating fixes it completely, because the wider type has room for 2,147,483,648. Python has no such problem, since its integers have no fixed width.

<!-- @doubt -->
### Should I use the recursive or the iterative version?

<!-- @answer -->
Iterative, when you need this at all. It is the same algorithm with the recursion unrolled into a walk over the exponent's bits — square the base each step, and multiply it into the result whenever the current bit is set. That removes the call overhead and the stack, and measured 4.7ns at n = 1,024 against the recursive version's 39.6ns, about 8x. It is also the form that generalises: modular exponentiation and matrix exponentiation are both written this way. Keep the recursive version for explaining the idea, since the halving is much more visible there.

<!-- @doubt -->
### Why not just call std::pow?

<!-- @answer -->
For floating-point powers you should. It measured 7.6ns at n = 1,024 and 7.6ns at n = 1,048,576 — completely flat, because it does not multiply repeatedly at all; it evaluates exp(n · log x), which does not depend on the size of n. That makes it faster than the bit-walk above roughly n = 1,024 and slower below it, where the bit-walk measured 4.7ns. What it cannot do is work where there is no logarithm: integers modulo m, matrices, permutations, or any monoid with a defined product. That is precisely where binary exponentiation is not an optimisation but the only available method, and it is where the next few subtopics go.

<!-- @doubt -->
### Can I use this for integer powers?

<!-- @answer -->
You can, but the type runs out almost immediately and the base decides when. Measured, the last exponent whose result fits a 32-bit int is 30 for base 2, 19 for base 3, and just 9 for base 10 — so 10^10 already overflows. Compare that with factorial, which reached 12, and Fibonacci, which reached 46 in the same type. Any integer power routine therefore needs a 64-bit result, an explicit range check, or a modulus. The last of those is the usual answer in practice, which is why the standard form of this algorithm is modular exponentiation rather than plain integer exponentiation.

<!-- @doubt -->
### Should I take the reciprocal before or after powering?

<!-- @answer -->
Before. Computing (1/x)^n keeps the intermediate values near 1 when x is large, whereas computing x^n first and then inverting it lets the intermediate grow to something enormous before being brought back down — and that intermediate can overflow to infinity, at which point the reciprocal is 0 rather than a small number. Doing the reciprocal first also means the recursive function only ever handles non-negative exponents, so the sign logic lives in exactly one place rather than being threaded through every level. The two orders give slightly different rounding in general, and the first is the safer default.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Count Good Numbers, which is this algorithm with a modulus attached. The count there is a power of 5 times a power of 4, taken modulo 10^9+7, and n can be as large as 10^15 — so the naive loop is impossible and std::pow is unusable, because there is no floating-point route to an exact answer modulo a prime. Binary exponentiation stops being an optimisation at that point and becomes the only method available, which is the general pattern: the halving trick matters most exactly where the closed form does not exist.
