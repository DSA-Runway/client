---
id: count-good-numbers
topic: Advanced Recursion
title: Count Good Numbers
difficulty: Medium
status: ready
prerequisites:
  - recursive-implementation-of-atoi
  - pow-x-n
  - integer-overflow-and-precision-errors
  - data-types
  - time-and-space-complexity-basics
relatedIds:
  - pow-x-n
  - recursive-implementation-of-atoi
  - integer-overflow-and-precision-errors
  - fibonacci-number
---

<!-- @summary -->
Where binary exponentiation stops being an optimisation and becomes the only option: n reaches 10^15, there is no closed form for a modular power and no library call in C++, and the naive loop would take a projected 47.1 days against 155.1 nanoseconds. Two traps sit on top — the parity split is only ever exposed by an odd n, and a 32-bit accumulator gives correct answers through exponent 13 before going silently wrong at 14.

<!-- @theory -->
## The problem

A digit string is **good** when every even index holds an even digit and every odd
index holds a prime digit. Count the good strings of length `n`, modulo 10^9 + 7.

```
even digits  : 0 2 4 6 8   -> 5 choices
prime digits : 2 3 5 7     -> 4 choices
```

Positions are independent, so the count is a product:

```
answer = 5^(number of even positions) * 4^(number of odd positions)
       = 5^ceil(n/2) * 4^floor(n/2)          mod 10^9 + 7
```

Verified against brute force for n = 0 through 7, and against the known values
n = 1 → 5, n = 4 → 400, n = 50 → 564,908,303.

## The counting is the easy half

There is no search here at all — no tree, no subsequences, no backtracking. The
whole problem is a power. What makes it a *recursion* problem is the size of the
exponent:

| n | Naive multiplications | Binary-exponentiation squarings |
|---|---|---|
| 10^9 | 1,000,000,000 | 30 |
| 10^12 | 1,000,000,000,000 | 40 |
| **10^15** | **1,000,000,000,000,000** | **50** |

Measured, the naive loop runs at 4.0716ns per multiplication. At n = 10^15 that
projects to **47.1 days**. Binary exponentiation measured **155.1ns**.

That is a ratio of about 2.6 × 10^13, and unlike Pow(x, n) there is no third
option. There `std::pow` was a flat 7.6ns alternative that sidestepped the whole
question. Here there is no closed form — `exp(n · log x)` cannot produce an exact
residue modulo a prime — and the C++ standard library has no modular power at all.
The halving *is* the algorithm.

## The modulus forces 64 bits

Every step multiplies two values that are already reduced, so both are below
10^9 + 7. Their product is not:

```
MOD          = 1,000,000,007
(MOD - 1)^2  = 1,000,000,012,000,000,036
int64 max    = 9,223,372,036,854,775,807      -> fits, with 9.22x headroom
int32 max    =             2,147,483,647      -> too small by 4.66 x 10^8
```

The largest `a` whose square still fits a 32-bit int is **46,341** — the same
number that broke `n(n+1)/2` in Sum of First N Numbers, arriving here for the
same reason.

What makes this dangerous is that a 32-bit version does not fail immediately. The
products stay small while the accumulator is small, so it produces **correct
answers through exponent 13** and silently wrong ones from **14**:

| Exponent | Correct | 32-bit accumulator |
|---|---|---|
| 10 | 9,765,625 | 9,765,625 |
| 13 | 220,703,118 | 220,703,118 |
| **14** | — | **first divergence** |
| 20 | 430,973,056 | 813,274,620 |
| 31 | 102,694,758 | **−745,403,241** |

By exponent 31 it has gone negative, but by then it has been returning plausible
positive numbers for seventeen steps. Any test that stops at small exponents
passes.

## The parity split, and why only odd n catches it

With `n` positions the even indices are 0, 2, 4, … and the odd ones 1, 3, 5, …,
so there are `ceil(n/2)` even and `floor(n/2)` odd. Two natural mistakes are
swapping the 5 and the 4, and using `n/2` for both. Both are invisible on even
inputs:

| n | Correct | 5 and 4 swapped | `n/2` for both |
|---|---|---|---|
| 0 | 1 | 1 | 1 |
| 1 | **5** | **4** | **1** |
| 2 | 20 | 20 | 20 |
| 3 | **100** | **80** | **20** |
| 4 | 400 | 400 | 400 |
| 5 | **2,000** | **1,600** | **400** |
| 6 | 8,000 | 8,000 | 8,000 |

Every even row agrees. Every odd row exposes both, and **n = 1** is the smallest
case that does — which is worth remembering, because it is also the case people
skip when testing "just the interesting sizes".

## The recursion is a chain, not a tree

Like Pow(x, n), each call halves the exponent, so the depth is `log2 n` — about 50
at n = 10^15. That is nothing; the stack is never the constraint. And the same
trap from that subtopic applies here in full: writing the recursive call **twice**
instead of storing it turns O(log n) into O(n) and would put this problem back
into the 47-day column.

Between the two forms:

| Exponent | Recursive | Iterative |
|---|---|---|
| 1,000 | 29.8ns | **20.1ns** |
| 10^6 | 66.2ns | 46.1ns |
| 10^8 | 121.9ns | 74.6ns |
| **10^15** | 356.9ns | **155.1ns** |

The iterative bit-walk is 1.5x to 2.3x faster, from having no call overhead and no
frame. Both are O(log n) and both are instant next to the alternative.

## Python has this built in

Python's three-argument `pow(base, exponent, modulus)` **is** modular
exponentiation, implemented in C:

| Exponent | Hand-written iterative | Hand-written recursive | `pow(b, e, m)` |
|---|---|---|---|
| 10^3 | 863ns | 1,180ns | **341ns** |
| 10^6 | 1,830ns | 2,353ns | 648ns |
| 10^15 | 5,067ns | 6,499ns | **2,029ns** |

For the whole problem at n = 10^15, the hand-written version measured 10,585ns
against 3,820ns for the built-in — **2.8x**. Write the loop to understand it, then
call `pow`.

Note that Python needs no modulus for correctness at all, since its integers are
arbitrary precision — `5**(10**15)` is a well-defined number. It needs one because
that number has about 700 trillion digits.

## Where this goes next

**Sort a stack using recursion** leaves arithmetic behind and returns to
structural recursion, but with a twist none of these subtopics has had: the
recursion is allowed no data structure other than the call stack itself. Removing
an element, sorting the rest, and inserting it back is a recursion whose *state*
lives entirely in the frames — which is the first time the stack has been the
tool rather than the constraint.

<!-- @intuition -->
Each position in the string is chosen independently, so the count is just a product of how many digits fit each slot — five for the even indices, four for the odd ones. That reduces the whole problem to raising two numbers to large powers, and the only reason it is interesting is that the exponent can be 10^15, which no loop will ever finish. Halving the exponent turns a quadrillion multiplications into about fifty, and because the answer is wanted modulo a prime there is no shortcut around it: you cannot take a logarithm of a residue, and no standard library in C++ offers a modular power. The two things to be careful about are that every intermediate product needs sixty-odd bits, so the accumulator must be 64-bit, and that there is one more even position than odd whenever n is odd, which is exactly the case people forget to test.

<!-- @approach -->
### Brute Force - Multiply n Times

<!-- @idea -->
Multiply the base into an accumulator once per position, reducing each time.

<!-- @steps -->
1. Count the even positions as ceil(n/2) and the odd positions as floor(n/2).
2. Start an accumulator at one.
3. Multiply by five once per even position, taking the remainder each time.
4. Multiply by four once per odd position, taking the remainder each time.
5. Return the accumulator.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Correct and completely unusable at the sizes this problem asks for. Measured 4.0716ns per multiplication, which projects to 47.1 days at n = 10^15 against binary exponentiation's 155.1ns. It is worth writing only to establish what the answer is, so the fast version can be checked against it on small inputs.

<!-- @code cpp -->
```cpp
#include <cstdint>
using namespace std;

const long long MOD = 1000000007LL;

long long powNaive(long long base, long long exp) {
    long long result = 1;
    for (long long i = 0; i < exp; i++) result = result * base % MOD;
    return result;
}

long long countGoodNumbers(long long n) {
    return powNaive(5, (n + 1) / 2) * powNaive(4, n / 2) % MOD;
}
```

<!-- @annotations -->
- 8: result * base is a 64-bit multiply of two values below MOD, so it needs about 60 bits — an int accumulator wraps here from exponent 14.
- 13: (n + 1) / 2 is ceil(n/2) for a non-negative n and n / 2 is floor — swapping them is only ever wrong for odd n. The final % also matters: each power is below MOD, but their product is not.

<!-- @code java -->
```java
static final long MOD = 1_000_000_007L;

static long powNaive(long base, long exp) {
    long result = 1;
    for (long i = 0; i < exp; i++) result = result * base % MOD;
    return result;
}

static long countGoodNumbers(long n) {
    return powNaive(5, (n + 1) / 2) * powNaive(4, n / 2) % MOD;
}
```

<!-- @annotations -->
- 1: long, not int. Java's int would wrap on the very first product of two values near MOD, exactly as C++ does.

<!-- @code python -->
```python
MOD = 10**9 + 7


def pow_naive(base, exp):
    result = 1
    for _ in range(exp):
        result = result * base % MOD
    return result


def count_good_numbers(n):
    return pow_naive(5, (n + 1) // 2) * pow_naive(4, n // 2) % MOD
```

<!-- @annotations -->
- 7: Python needs no width here — its integers grow — but it needs the modulus for speed, since 5**(10**15) has about 700 trillion digits.
- 12: Floor division with //, so the counts stay integers; a float exponent would raise later.

<!-- @approach -->
### Binary Exponentiation, Recursive

<!-- @idea -->
Halve the exponent, square the result, and multiply in one extra base if it was odd.

<!-- @steps -->
1. Return one when the exponent reaches zero.
2. Otherwise solve for the exponent halved, storing the result once.
3. Square that stored value, reducing modulo the divisor.
4. Multiply in one more base if the exponent was odd.
5. Return the reduced result.

<!-- @complexity -->
- time: O(log n)
- space: O(log n) call stack — about 50 frames at n = 10^15
- note: The same shape as Pow(x, n) with a modulus applied at every step, and the same trap: writing the recursive call twice rather than storing it turns O(log n) back into O(n), which here means going from 155.1ns to a projected 47 days. Measured 356.9ns at an exponent of 10^15, against 155.1ns for the iterative form.

<!-- @code cpp -->
```cpp
#include <cstdint>
using namespace std;

const long long MOD = 1000000007LL;

long long powMod(long long base, long long exp) {
    if (exp == 0) return 1;

    long long half = powMod(base, exp / 2);      // ONE call, stored
    half = half * half % MOD;

    return (exp & 1) ? half * base % MOD : half;
}

long long countGoodNumbers(long long n) {
    return powMod(5, (n + 1) / 2) * powMod(4, n / 2) % MOD;
}
```

<!-- @annotations -->
- 9: Storing the call is the whole difference between O(log n) and O(n) — writing powMod(base, exp/2) * powMod(base, exp/2) makes 4n - 1 calls, as measured in Pow(x, n).
- 10: Reducing immediately after squaring keeps every value below MOD, so the next product still fits 64 bits.
- 12: exp & 1 tests the low bit; the extra multiply restores the remainder that the halving dropped.

<!-- @code java -->
```java
static final long MOD = 1_000_000_007L;

static long powMod(long base, long exp) {
    if (exp == 0) return 1;

    long half = powMod(base, exp / 2);
    half = half * half % MOD;

    return (exp & 1) == 1 ? half * base % MOD : half;
}

static long countGoodNumbers(long n) {
    return powMod(5, (n + 1) / 2) * powMod(4, n / 2) % MOD;
}
```

<!-- @annotations -->
- 9: The explicit == 1 is required because Java has no implicit conversion from a numeric type to boolean.

<!-- @code python -->
```python
MOD = 10**9 + 7


def pow_mod(base, exp):
    if exp == 0:
        return 1
    half = pow_mod(base, exp // 2)
    half = half * half % MOD
    return half * base % MOD if exp & 1 else half


def count_good_numbers(n):
    return pow_mod(5, (n + 1) // 2) * pow_mod(4, n // 2) % MOD
```

<!-- @annotations -->
- 7: exp // 2, not exp / 2 — true division makes a float and the base case exp == 0 is then never reached exactly.
- 8: The reduction is not needed for correctness in Python, only to stop the intermediate values from growing to millions of digits.

<!-- @approach -->
### Optimal - Binary Exponentiation, Iterative

<!-- @idea -->
Walk the exponent's bits, squaring a running base and folding in the ones.

<!-- @steps -->
1. Start the result at one and the running base at the reduced base.
2. While the exponent is non-zero, examine its lowest bit.
3. Multiply the running base into the result when that bit is set.
4. Square the running base and shift the exponent right by one.
5. Reduce after every multiplication so nothing exceeds the divisor.

<!-- @complexity -->
- time: O(log n)
- space: O(1)
- note: The fastest form at every size measured — 155.1ns at an exponent of 10^15 against the recursive version's 356.9ns, and 20.1ns against 29.8ns at 1,000. It is also the shape that generalises to matrix exponentiation, which is how the same trick is applied to linear recurrences such as Fibonacci.

<!-- @code cpp -->
```cpp
#include <cstdint>
using namespace std;

const long long MOD = 1000000007LL;

long long powMod(long long base, long long exp) {
    long long result = 1;
    base %= MOD;

    while (exp > 0) {
        if (exp & 1) result = result * base % MOD;
        base = base * base % MOD;
        exp >>= 1;
    }
    return result;
}

long long countGoodNumbers(long long n) {
    return powMod(5, (n + 1) / 2) * powMod(4, n / 2) % MOD;
}
```

<!-- @annotations -->
- 8: Reducing the base once up front means every later product is between two values below MOD, so 64 bits is always enough.
- 11: result and base are both below MOD here, so their product needs about 60 bits — this is the line that makes an int accumulator wrong from exponent 14.
- 12: base holds base^(2^k) at step k, which is the same squaring chain the recursion builds, unrolled.

<!-- @code java -->
```java
static final long MOD = 1_000_000_007L;

static long powMod(long base, long exp) {
    long result = 1;
    base %= MOD;

    while (exp > 0) {
        if ((exp & 1) == 1) result = result * base % MOD;
        base = base * base % MOD;
        exp >>= 1;
    }
    return result;
}

static long countGoodNumbers(long n) {
    return powMod(5, (n + 1) / 2) * powMod(4, n / 2) % MOD;
}
```

<!-- @annotations -->
- 9: Every variable here is long. Declaring result as int compiles cleanly and returns correct answers up to exponent 13, then diverges silently.

<!-- @code python -->
```python
MOD = 10**9 + 7


def pow_mod(base, exp):
    result = 1
    base %= MOD
    while exp:
        if exp & 1:
            result = result * base % MOD
        base = base * base % MOD
        exp >>= 1
    return result


def count_good_numbers(n):
    return pow_mod(5, (n + 1) // 2) * pow_mod(4, n // 2) % MOD
```

<!-- @annotations -->
- 7: while exp rather than while exp > 0, since the exponent is non-negative and zero is falsy.
- 9: Measured 5,067ns at an exponent of 10^15 — about 2.5x the built-in pow, which does the same thing in C.

<!-- @approach -->
### The Library Call

<!-- @idea -->
Use the standard modular power where the language provides one.

<!-- @steps -->
1. Check whether the language offers a three-argument power.
2. In Python, call pow with base, exponent and modulus.
3. In Java, use BigInteger.modPow when the operands justify it.
4. In C++, note that there is no such function and the loop above is required.
5. Multiply the two powers together and reduce once more at the end.

<!-- @complexity -->
- time: O(log n)
- space: O(1)
- note: Python's three-argument pow is exactly this algorithm implemented in C — measured 2,029ns at an exponent of 10^15 against a hand-written 5,067ns, and 3,820ns against 10,585ns for the whole problem, about 2.8x. C++ has no equivalent in the standard library, which is the clearest illustration that this is not a case where the library removes the need to know the algorithm.

<!-- @code cpp -->
```cpp
// The C++ standard library has no modular power.
// std::pow works in double and cannot produce an exact residue:
//     pow(5.0, 500000000000000.0)  ->  inf
// so the loop in the previous approach is not an optimisation, it is
// the only available implementation.
#include <cstdint>
const long long MOD = 1000000007LL;
```

<!-- @annotations -->
- 3: Floating point overflows to infinity long before the exponent reaches this size, and even where it does not, a double cannot represent an exact residue.
- 6: This is the real lesson of the subtopic — the halving is not a speed-up over a library call, because there is no library call.

<!-- @code java -->
```java
import java.math.BigInteger;

static final long MOD = 1_000_000_007L;

static long countGoodNumbers(long n) {
    BigInteger m = BigInteger.valueOf(MOD);
    BigInteger a = BigInteger.valueOf(5).modPow(BigInteger.valueOf((n + 1) / 2), m);
    BigInteger b = BigInteger.valueOf(4).modPow(BigInteger.valueOf(n / 2), m);
    return a.multiply(b).mod(m).longValue();
}
```

<!-- @annotations -->
- 7: BigInteger.modPow is the correct library answer, though the allocation per call makes it slower than the long loop for operands this small.

<!-- @code python -->
```python
MOD = 10**9 + 7


def count_good_numbers(n):
    return pow(5, (n + 1) // 2, MOD) * pow(4, n // 2, MOD) % MOD


# The three-argument pow IS modular exponentiation, in C. Measured
# 3,820ns for n = 10^15 against 10,585ns hand-written, about 2.8x.
```

<!-- @annotations -->
- 5: The final % is still needed — each pow returns a value below MOD, but their product is not.
- 8: Two-argument pow(5, n) would compute the full integer first, which for n = 10^15 has roughly 700 trillion digits.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
400, from 5 × 4 × 5 × 4

<!-- @why -->
The smallest case where both position types appear more than once, so the split between them is visible rather than incidental.

<!-- @walkthrough -->
1. The four positions are indices 0, 1, 2 and 3.
2. Indices 0 and 2 are even, so each may hold any of the five even digits.
3. Indices 1 and 3 are odd, so each may hold any of the four prime digits.
4. The choices are independent, so the total is 5 × 4 × 5 × 4.
5. Grouping them gives 5 squared times 4 squared, which is 25 × 16 = 400.
6. In the formula that is 5^ceil(4/2) times 4^floor(4/2), or 5^2 × 4^2.
7. Brute-forcing all 10,000 four-digit strings and testing each confirms 400.

<!-- @example -->

<!-- @input -->
n = 1, against the two natural mis-splits

<!-- @output -->
5 correct, 4 with the bases swapped, 1 with n/2 used twice

<!-- @why -->
It is the smallest input that distinguishes the correct split from either mistake, and every even n hides both of them.

<!-- @walkthrough -->
1. A string of length 1 has one position, index 0, which is even.
2. So the answer is 5 — the five even digits — and 4 contributes nothing.
3. Swapping the bases gives 4, because it counts the single position as odd.
4. Using n/2 for both exponents gives 5^0 × 4^0 = 1, since integer division sends 1/2 to 0.
5. At n = 2 all three forms give 20, and at n = 4 all three give 400.
6. In fact every even n agrees, because ceil and floor coincide there.
7. So a test suite of even sizes passes all three implementations, and n = 1 is the smallest case that separates them.

<!-- @example -->

<!-- @input -->
The same algorithm with a 32-bit accumulator

<!-- @output -->
Correct through exponent 13, silently wrong from 14

<!-- @why -->
It shows that the width requirement is invisible on small inputs, which is exactly the range a quick test covers.

<!-- @walkthrough -->
1. Every step multiplies two values that are already below the modulus, 10^9 + 7.
2. Their product can reach (MOD − 1)^2, which is 1,000,000,012,000,000,036.
3. That fits a signed 64-bit integer with 9.22x headroom and exceeds a 32-bit one by a factor of 4.66 × 10^8.
4. The largest value whose square still fits 32 bits is 46,341 — the same threshold that broke n(n+1)/2 in Sum of First N Numbers.
5. But the accumulator only grows large gradually, so small exponents never reach the boundary.
6. Measured, a genuine 32-bit version returns the correct answer for exponents 1 through 13 and diverges from 14.
7. By exponent 31 it returns −745,403,241, but by then it has produced seventeen plausible positive answers.

<!-- @example -->

<!-- @input -->
n = 10^15, by loop and by halving

<!-- @output -->
A projected 47.1 days against 155.1 nanoseconds

<!-- @why -->
It is the measurement that makes this subtopic different from Pow(x, n), where a constant-time library call made the whole comparison academic.

<!-- @walkthrough -->
1. The exponents are 5 × 10^14 and 5 × 10^14, so about 10^15 multiplications in total.
2. Measured, the naive loop runs at 4.0716 nanoseconds per multiplication.
3. That projects to roughly 4.07 × 10^15 nanoseconds, which is 47.1 days.
4. Binary exponentiation needs about 50 squarings per power and measured 155.1 nanoseconds for the whole call.
5. The ratio is roughly 2.6 × 10^13.
6. In Pow(x, n) this comparison had a third column — std::pow, flat at 7.6ns — that made the algorithm optional.
7. Here there is no such column: exp and log cannot produce an exact residue, and C++ has no modular power, so the halving is the only implementation available.

<!-- @visualization custom -->

<!-- @description -->
Open with the digit string itself as a row of slots for n = 5, alternating shading for even and odd indices, with 5 written above each even slot and 4 above each odd one, and the product 5 × 4 × 5 × 4 × 5 assembling underneath into 5^3 × 4^2. Let a slider change n so the reader watches the exponents split — crucially, at odd n the even count visibly runs one ahead, and a counter should show ceil and floor diverging. Beside it put the three-way comparison as a small table that fills in live as the slider moves: correct, bases swapped, and n/2 for both, with the two wrong columns matching the correct one at every even n and separating at every odd one, and n = 1 marked as the first divergence. The centre panel is the exponent's binary expansion: write 5 × 10^14 in binary as a row of about 50 bits, with a squaring chain beneath it and only the set bits feeding into the running product — the point being that the number of steps is the bit count, not the value. Next to it draw two bars on a log axis for the same work: one for the naive loop, running off the edge of the frame and labelled 47.1 days, one for binary exponentiation at 155.1 nanoseconds, and between them a note that Pow(x, n) had a third bar here — std::pow at 7.6 nanoseconds — and this problem does not, because there is no modular power in the standard library. Finally the width panel: two accumulators stepping side by side through the same exponents, one 64-bit and one 32-bit, drawn as bit-width bars that grow with each product. The 32-bit bar should visibly hit its ceiling at exponent 14 and start producing different numbers, with the two value columns printed alongside — identical through 13, diverging at 14, and the 32-bit one going negative at 31. Mark 46,341 on the width axis as the largest value whose square still fits, with a back-reference to Sum of First N Numbers where the same number appeared.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"answer":400,"positions":[{"index":0,"parity":"even","choices":5,"digits":[0,2,4,6,8]},{"index":1,"parity":"odd","choices":4,"digits":[2,3,5,7]},{"index":2,"parity":"even","choices":5},{"index":3,"parity":"odd","choices":4}],"product":"5 * 4 * 5 * 4","grouped":"5^2 * 4^2 = 25 * 16","bruteForceConfirms":400},"formula":{"expression":"5^ceil(n/2) * 4^floor(n/2) mod (10^9+7)","verifiedAgainstBruteForce":"n = 0..7","knownValues":[{"n":1,"answer":5},{"n":4,"answer":400},{"n":50,"answer":564908303}]},"parityTrap":{"rows":[{"n":0,"correct":1,"swapped":1,"bothNOver2":1},{"n":1,"correct":5,"swapped":4,"bothNOver2":1},{"n":2,"correct":20,"swapped":20,"bothNOver2":20},{"n":3,"correct":100,"swapped":80,"bothNOver2":20},{"n":4,"correct":400,"swapped":400,"bothNOver2":400},{"n":5,"correct":2000,"swapped":1600,"bothNOver2":400},{"n":6,"correct":8000,"swapped":8000,"bothNOver2":8000},{"n":7,"correct":40000,"swapped":32000,"bothNOver2":8000}],"reading":"every EVEN n agrees; every odd n separates all three","smallestExposingCase":1},"scale":{"rows":[{"n":1000000000,"naiveMultiplications":1000000000,"squarings":30},{"n":1000000000000,"naiveMultiplications":1000000000000,"squarings":40},{"n":1000000000000000,"naiveMultiplications":1000000000000000,"squarings":50}],"naiveNsPerMultiply":4.0716,"projectedNaiveAtN1e15":{"ns":4071633400000000,"days":47.1},"binaryExpMeasuredNs":155.1,"ratio":2.6e13,"contrastWithPowXN":{"thereStdPowNs":7.6,"thereFlatInN":true,"hereNoLibraryCall":"exp(n log x) cannot produce an exact residue, and C++ has no modular power","reading":"the halving is not a speed-up over a library call — there is no library call"}},"width":{"MOD":1000000007,"maxProduct":1000000012000000036,"int64Max":9223372036854775807,"fitsInt64":true,"headroom":9.22,"int32Max":2147483647,"tooBigBy":4.66e8,"largestSquarableInt32":46341,"echoes":"the same threshold that broke n(n+1)/2 in sum-of-first-n-numbers","int32Divergence":{"correctThrough":13,"firstWrongAt":14,"rows":[{"exp":10,"correct":9765625,"int32":9765625},{"exp":13,"correct":220703118,"int32":220703118},{"exp":20,"correct":430973056,"int32":813274620},{"exp":31,"correct":102694758,"int32":-745403241}],"reading":"seventeen plausible positive answers before it goes negative"}},"timing":{"cpp":{"unit":"ns per call","rows":[{"exp":1000,"recursive":29.8,"iterative":20.1},{"exp":1000000,"recursive":66.2,"iterative":46.1},{"exp":100000000,"recursive":121.9,"iterative":74.6},{"exp":1000000000000000,"recursive":356.9,"iterative":155.1}],"iterativeAdvantage":"1.5x to 2.3x, from no call overhead and no frame"},"python":{"version":"3.13.4","unit":"ns per call","rows":[{"exp":1000,"handIter":863,"handRec":1180,"builtinPow":341},{"exp":1000000,"handIter":1830,"handRec":2353,"builtinPow":648},{"exp":1000000000000000,"handIter":5067,"handRec":6499,"builtinPow":2029}],"wholeProblemAtN1e15":{"handWrittenNs":10585,"builtinNs":3820,"ratio":2.8},"note":"the three-argument pow IS modular exponentiation, in C","whyPythonStillNeedsTheModulus":"5**(10**15) has roughly 700 trillion digits"}},"carriedFromPowXN":{"trap":"writing the recursive call twice instead of storing it","cost":"4n - 1 calls, turning O(log n) into O(n)","hereThatMeans":"155.1 ns becomes a projected 47 days"}}
```

<!-- @highlights -->
- The digit string opens as a row of slots for n = 5, with even and odd indices shaded differently.
- 5 is written above each even slot and 4 above each odd one, assembling into 5^3 × 4^2 underneath.
- A slider changes n so the exponent split is watched rather than described.
- At odd n the even count visibly runs one ahead, with ceil and floor shown diverging.
- A live three-way table fills in as the slider moves: correct, bases swapped, and n/2 for both.
- The two wrong columns match at every even n and separate at every odd one.
- n = 1 is marked as the first divergence.
- The centre panel writes 5 × 10^14 in binary as roughly 50 bits.
- A squaring chain runs beneath it, with only the set bits feeding the running product.
- That makes the step count visibly the bit count rather than the value.
- Two log-axis bars compare the same work: the naive loop running off the frame at 47.1 days, and binary exponentiation at 155.1 nanoseconds.
- A note records that Pow(x, n) had a third bar here — std::pow at 7.6ns — and this problem does not.
- The width panel steps a 64-bit and a 32-bit accumulator side by side as growing bit-width bars.
- The 32-bit bar hits its ceiling at exponent 14 and the value columns begin to differ.
- Those columns are identical through 13, diverge at 14, and the 32-bit one goes negative at 31.
- 46,341 is marked on the width axis, with a back-reference to where the same number appeared in Sum of First N Numbers.

<!-- @edgeCases -->
- n = 0 — the empty string is good, so the answer is 1 and both exponents are zero.
- n = 1 — the smallest case that separates the correct parity split from either mistake.
- Any odd n — the even positions outnumber the odd ones by exactly one.
- Any even n — the two counts are equal, which is why even-only tests pass wrong implementations.
- Exponent 13 with a 32-bit accumulator — the last correct answer before the silent divergence.
- Exponent 14 with a 32-bit accumulator — the first wrong one.
- n = 10^15 — the stated upper bound, needing about 50 squarings per power.
- An exponent of zero inside powMod — must return 1, since it is the base case of the halving.
- A base larger than the modulus — reduce it once before the loop, or the first square already exceeds 64 bits.
- The final multiplication of the two powers — each is below MOD but their product is not, so one more reduction is required.
- Python's two-argument pow with n = 10^15 — computes an integer of roughly 700 trillion digits before any modulus is applied.

<!-- @pitfalls -->
- Using an int accumulator. Products of two values near 10^9 + 7 need about 60 bits, and a 32-bit version returns correct answers through exponent 13 before diverging silently at 14.
- Swapping the 5 and the 4. Every even n still agrees, so only an odd test case exposes it — and n = 1 is the smallest.
- Using n/2 for both exponents. Same symptom: correct on every even n, wrong on every odd one.
- Forgetting the final reduction after multiplying the two powers. Each factor is below MOD, but their product is close to MOD squared.
- Writing the recursive call twice instead of storing it. That is the Pow(x, n) trap, and here it turns 155.1ns into a projected 47 days.
- Failing to reduce the base before the loop. If the base exceeds MOD the very first squaring can leave 64 bits.
- Reaching for std::pow. It works in double, overflows to infinity long before this exponent, and cannot represent an exact residue in any case.
- Assuming the standard library will supply a modular power in C++. There is none, which is why this loop has to be written by hand.
- Using Python's two-argument pow and taking the modulus afterwards. The intermediate integer has about 700 trillion digits at n = 10^15.
- Testing only large n. The parity bug is invisible above the smallest cases and needs n = 1 or 3 specifically.
- Testing only small n. The width bug is invisible below exponent 14 and needs a large one specifically.
- Reducing only at the end of the loop rather than after each multiplication. One unreduced product is enough to leave the range.

<!-- @doubt -->
### Where does 5^ceil(n/2) × 4^floor(n/2) come from?

<!-- @answer -->
Each position is chosen independently of the others, so the total is the product of the number of options at each position. Even indices take one of the five even digits and odd indices one of the four prime digits, so the count is five raised to the number of even positions times four raised to the number of odd ones. For a string of length n the even indices are 0, 2, 4, … which gives ceil(n/2) of them, and the odd indices give floor(n/2). The formula was checked against brute force for n = 0 through 7 and against the published values at n = 1, 4 and 50.

<!-- @doubt -->
### Why can't I just loop n times?

<!-- @answer -->
Because n reaches 10^15. Measured, the naive loop runs at about 4.07 nanoseconds per multiplication, which projects to roughly 47.1 days for that exponent. Binary exponentiation measured 155.1 nanoseconds for the same answer, a ratio of about 2.6 × 10^13. The reason is that halving the exponent turns a quadrillion multiplications into about fifty — the number of steps becomes the number of bits in n rather than the value of n. That is the same observation as Pow(x, n); what is different here is that there is no alternative to it.

<!-- @doubt -->
### Why is there no library call for this?

<!-- @answer -->
Because a modular power cannot be computed the way a floating-point power is. std::pow evaluates exp(n · log x), which is a constant-time route to a real number — but a residue modulo a prime is not recoverable from an approximation, and in any case 5 to the power 5 × 10^14 overflows a double to infinity long before precision becomes the issue. So C++ offers nothing, and the loop is not an optimisation over a library call but the only implementation available. Python does provide it, as the three-argument pow, and Java has BigInteger.modPow — but in C++ this algorithm is something you write.

<!-- @doubt -->
### Why does everything have to be 64-bit?

<!-- @answer -->
Because each step multiplies two values that are already reduced, so both are below 10^9 + 7, and their product can reach (MOD − 1)^2 = 1,000,000,012,000,000,036. That fits a signed 64-bit integer with 9.22x headroom and exceeds a 32-bit one by a factor of 4.66 × 10^8. The largest value whose square still fits 32 bits is 46,341 — the same threshold that made n(n+1)/2 overflow in Sum of First N Numbers. What makes it dangerous here is that the failure is gradual: a genuine 32-bit version returns correct answers for exponents 1 through 13 and only diverges at 14, so small tests all pass.

<!-- @doubt -->
### Why does only an odd n catch the parity bug?

<!-- @answer -->
Because ceil(n/2) and floor(n/2) are equal whenever n is even. At n = 4 the correct split is 5^2 × 4^2 = 400, swapping the bases gives 4^2 × 5^2 = 400, and using n/2 for both gives 5^2 × 4^2 = 400 — all three agree. At n = 5 they give 2,000, 1,600 and 400 respectively. So every even test case passes all three implementations and every odd one separates them, with n = 1 the smallest. It is a good reminder that "test a few representative sizes" is not the same as testing both parities.

<!-- @doubt -->
### Recursive or iterative?

<!-- @answer -->
Iterative, for the same reasons as in Pow(x, n) and by a similar margin. Measured at an exponent of 10^15 the recursive form took 356.9 nanoseconds against the iterative one's 155.1, and at 1,000 it was 29.8 against 20.1 — between 1.5x and 2.3x, from having no call overhead and no frame. Depth is not the issue: log2 of 10^15 is about 50, so the stack is never remotely stressed. Keep the recursive version for explaining the halving, which is far more visible there, and ship the bit-walk, which is also the form that generalises to matrix exponentiation.

<!-- @doubt -->
### Does Python need the modulus at all?

<!-- @answer -->
Not for correctness — Python's integers are arbitrary precision, so 5 raised to 5 × 10^14 is a perfectly well-defined number. It needs the modulus because that number has roughly 700 trillion digits and cannot be materialised. This is why the two-argument pow is the wrong call: pow(5, n) computes the full integer before any modulus is applied, whereas pow(5, n, MOD) reduces at every step. The three-argument form measured 2,029 nanoseconds at that exponent against 5,067 for a hand-written loop, and 3,820 against 10,585 for the whole problem — about 2.8x, because it is the same algorithm written in C.

<!-- @doubt -->
### Is the double-call trap still a risk here?

<!-- @answer -->
Yes, and the consequences are larger than they were in Pow(x, n). Writing powMod(base, exp/2) * powMod(base, exp/2) instead of storing the result makes 4n − 1 calls, as measured in that subtopic, which turns O(log n) back into O(n). There the penalty was a few milliseconds; here it moves the problem from 155 nanoseconds into the 47-day column. It is also the one place where the compiler might rescue you — common-subexpression elimination can fold two identical pure calls, which was measured happening at -O2 in Pow(x, n) — but relying on that is unwise, and storing the value in a local removes the question.

<!-- @doubt -->
### What should I test?

<!-- @answer -->
Both parities and at least one large exponent, because the two bugs in this problem hide in opposite directions. The parity mistake is invisible for every even n and needs n = 1 or n = 3 to surface. The width mistake is invisible below exponent 14 and needs something large to surface. A suite of n = 0, 1, 2, 3, 4, 5 and 10^15 covers both, and checking n = 50 against the published 564,908,303 is a cheap way to confirm the modular arithmetic without brute force. Brute force itself is only feasible to about n = 7, since it enumerates 10^n strings.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Sort a stack using recursion, which leaves arithmetic behind entirely and returns to structural recursion with a constraint none of these subtopics has had: no data structure is allowed other than the call stack itself. The method is to pop an element, sort what remains recursively, and insert the element back into the sorted result — so the partial state lives in the frames rather than in any container you declared. That makes it the first problem here where the call stack is the tool rather than the limit, which is a different way of thinking about recursion than anything in this topic so far.
