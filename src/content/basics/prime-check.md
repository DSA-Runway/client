---
id: prime-check
topic: Basics
title: Prime Check
difficulty: Medium
status: ready
prerequisites:
  - for-loop
  - arithmetic-operators
  - if-else-statements
  - functions-declaration-and-calling
relatedIds:
  - gcd-euclidean-algorithm
  - lcm
  - integer-overflow-and-precision-errors
  - time-and-space-complexity-basics
---

<!-- @summary -->
Decide whether a number has exactly two divisors — and learn the square-root bound, which turns a hundred thousand operations into three hundred.

<!-- @theory -->
## The problem

A **prime** is an integer greater than 1 whose only positive divisors are 1 and
itself.

```
2, 3, 5, 7, 11, 13, ...   prime
4 = 2x2, 9 = 3x3, 25 = 5x5   not prime
1     not prime — it has only ONE divisor, not two
0, negatives   not prime by definition
```

**1 is not prime.** The definition requires exactly two distinct divisors, and 1 has
only itself. This is not a quirk — it is what makes prime factorisation unique.

## The obvious approach

Try every possible divisor from 2 up to n-1. If any divides evenly, it is not prime.

```
for (int i = 2; i < n; i++)
    if (n % i == 0) return false;
return true;
```

Correct, and it does far more work than necessary. Measured: `isPrime(100003)` takes
**100,001** modulo operations this way.

A common half-step is to stop at `n / 2`, since no divisor can exceed half the number.
That halves the work and leaves it O(n) — still linear, still too slow.

## The square-root bound

**Divisors come in pairs.** If `d` divides `n`, then so does `n / d`, and together they
multiply back to `n`:

```
36:  1x36   2x18   3x12   4x9   6x6   (then it mirrors: 9x4, 12x3, ...)
```

Now the key observation: **in every pair, one member is at most √n.**

If both were larger than √n, their product would be larger than n — which
contradicts the fact that they multiply to exactly n. So one of them must be at or
below the square root.

The consequence: **if n has any divisor at all, it has one at or below √n.** Checking
past that point can only find the larger partners of pairs you already tested.

```
for (int i = 2; i * i <= n; i++)
    if (n % i == 0) return false;
return true;
```

Measured on the same input: `isPrime(100003)` drops from **100,001** operations to
**315**. A 317-fold reduction, from one line changed.

√36 is 6, and 6x6 is the pair where the mirror turns around. That is why the bound is
exactly the square root and not some approximation of it.

## Write i * i <= n, not i <= sqrt(n)

Both express the bound. The multiplication form is preferred for two reasons:

**It is exact.** `sqrt` returns a floating-point value, and the data-types subtopic
covered why those cannot be trusted at boundaries. `i * i` is integer arithmetic with
no rounding anywhere.

**It avoids recomputation.** Written as `i <= sqrt(n)` inside the condition, the square
root may be recalculated on every iteration.

**But there is a trap in the multiplication form**, and it was verified rather than
assumed.

`√INT_MAX` is about 46340.95, so the loop reaches `i = 46341`. And:

```
46341 x 46341 = 2,147,488,281      exceeds INT_MAX (2,147,483,647)
as a 32-bit int it wraps to -2,147,479,015      <- NEGATIVE
```

A negative value is always `<= n`, so the condition **stays true forever and the loop
never terminates.** Checking the primality of a number near the type maximum hangs.

**The fix**: widen the multiplication, `(long long) i * i <= n`, or compute the square
root once before the loop and compare against that. Note it must be widened *before*
the multiply — the same cast-placement rule from Type Conversion.

## The 6k ± 1 refinement

Beyond 2 and 3, primes cluster in a predictable pattern.

Every integer can be written as `6k + i` where `i` is 0 through 5:

- `6k`, `6k+2`, `6k+4` are all **even** — divisible by 2
- `6k+3` is **divisible by 3**

That leaves only `6k+1` and `6k+5`. And `6k+5` is the same as `6(k+1)-1`, so:

> **Every prime above 3 has the form 6k − 1 or 6k + 1.**

So test 2 and 3 directly, then step through candidates 6 apart and check both `i` and
`i+2` at each stop. That skips two thirds of the candidates the plain square-root loop
tests.

Measured on `isPrime(1000000007)`, a large prime:

| Approach | Operations |
|---|---|
| Square-root bound | 31,621 |
| 6k ± 1 | **10,540** |

A ratio of **3.0**, matching the standard claim exactly. Note this does **not** change
the complexity class — it is still O(√n), with a constant factor three times smaller.
The same distinction the nested-loops subtopic made about triangular loops.

## When you need many answers: the sieve

Everything above tests **one** number. If you need every prime up to some limit, doing
√n work per number is wasteful.

The **Sieve of Eratosthenes** inverts the problem: instead of asking which divisors
each number has, mark the multiples of each prime as composite.

```
Start with 2..n all marked prime.
For each i from 2 while i*i <= n:
    if i is still marked prime, mark i*i, i*i+i, i*i+2i, ... as composite
```

Starting at `i*i` rather than `2i` matters: every smaller multiple of `i` already has a
smaller prime factor and was marked earlier.

Cost is **O(n log log n)** to build, then **O(1)** per query. Crossover point in
practice: if you have more than a handful of queries over a bounded range, sieve
first.

## Edge cases

| n | Prime? | Why |
|---|---|---|
| n < 2 | no | Definition requires greater than 1 |
| 1 | no | Only one divisor, not two |
| 2 | **yes** | The only even prime |
| 3 | yes | Handled directly in the 6k form |
| perfect squares | no | `i * i == n` is caught exactly at the bound |

**2 is the only even prime**, which is why every optimisation handles it as a special
case before skipping evens.

## Approaches

| # | Approach | Time | Space |
|---|---|---|---|
| 1 | Trial division to n-1 | O(n) | O(1) |
| 2 | **Square-root bound** | **O(√n)** | O(1) |
| 3 | 6k ± 1 | O(√n), ~3x smaller constant | O(1) |
| 4 | Sieve of Eratosthenes | O(n log log n) build, O(1) query | **O(n)** |

**Use approach 2** as your default — it is short, exact, and the reasoning is worth
being able to state. Reach for 3 in tight loops and 4 when answering many queries.

<!-- @intuition -->
Divisors always come in pairs that multiply to n, so one of each pair sits below the square root and the other above it. Checking past the square root only re-finds partners you already met — which is why half the work is not the saving, and the square root is.

<!-- @approach -->
### Trial Division to n-1

<!-- @idea -->
Test every integer from 2 up to n-1 as a possible divisor.

<!-- @steps -->
1. Return false immediately for any value below 2, since primes are defined as greater than 1.
2. Start a candidate divisor at 2.
3. Test whether the candidate divides n exactly using modulo.
4. If it does, n has a divisor other than 1 and itself, so return false.
5. Otherwise advance the candidate and repeat while it stays below n.
6. If no candidate divided evenly, n is prime.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: One modulo operation per candidate divisor, up to n-1 of them. The worst case is a prime, since no early exit is possible. Measured at 100,001 operations for the six-digit prime 100003, where the square-root bound needs 315.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

bool isPrimeNaive(int n) {
    if (n < 2) return false;          // 0, 1 and negatives are not prime
    for (int i = 2; i < n; i++) {
        if (n % i == 0) return false; // found a divisor
    }
    return true;
}

int main() {
    cout << isPrimeNaive(2)  << endl;   // 1  — the only even prime
    cout << isPrimeNaive(17) << endl;   // 1
    cout << isPrimeNaive(1)  << endl;   // 0  — one divisor, not two
    cout << isPrimeNaive(25) << endl;   // 0  — 5 divides it

    // Measured: isPrimeNaive(100003) performs 100,001 modulo operations.
    // The square-root version does the same job in 315.
    return 0;
}
```

<!-- @annotations -->
- 5: The guard must come first. Without it, a loop from 2 to n-1 never runs for n below 2 and wrongly reports prime.
- 7: One early exit is enough — a single divisor disproves primality, so nothing further needs testing.

<!-- @code java -->
```java
static boolean isPrimeNaive(int n) {
    if (n < 2) return false;
    for (int i = 2; i < n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

System.out.println(isPrimeNaive(2));    // true
System.out.println(isPrimeNaive(17));   // true
System.out.println(isPrimeNaive(1));    // false
System.out.println(isPrimeNaive(25));   // false

// The half-step some people reach for — stopping at n/2 — halves the
// work and is still O(n). The square root is the real bound.
```

<!-- @annotations -->
- 14: Worth naming, because n/2 feels like an optimisation and does not change the complexity class at all.

<!-- @code python -->
```python
def is_prime_naive(n):
    if n < 2:
        return False
    for i in range(2, n):
        if n % i == 0:
            return False
    return True

print(is_prime_naive(2))    # True
print(is_prime_naive(17))   # True
print(is_prime_naive(1))    # False
print(is_prime_naive(25))   # False

# Unusable at scale — is_prime_naive(1000000007) would perform
# a billion modulo operations to confirm one number is prime.
```

<!-- @annotations -->
- 4: range(2, n) stops before n, which is correct — testing n against itself would always find a divisor.

<!-- @approach -->
### Square-Root Bound

<!-- @idea -->
Stop at the square root, since divisors come in pairs and one member of every pair sits at or below it.

<!-- @steps -->
1. Return false for any value below 2.
2. Start a candidate divisor at 2.
3. Continue while the candidate squared does not exceed n.
4. Test whether the candidate divides n exactly.
5. If it does, return false, since a divisor other than 1 and n has been found.
6. If the loop completes without finding one, no divisor at or below the square root exists, so none exists at all and n is prime.

<!-- @complexity -->
- time: O(√n)
- space: O(1)
- note: One modulo per candidate up to the square root. Measured at 315 operations for 100003, against 100,001 for the naive scan — a 317-fold reduction from changing the loop bound. The worst case remains a prime, where no early exit occurs.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

bool isPrime(int n) {
    if (n < 2) return false;

    // (long long) BEFORE the multiply — see the note below
    for (int i = 2; (long long) i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    cout << isPrime(2)   << endl;   // 1
    cout << isPrime(17)  << endl;   // 1
    cout << isPrime(25)  << endl;   // 0  — caught exactly at i = 5, where i*i == n
    cout << isPrime(1)   << endl;   // 0
    cout << isPrime(2147483647) << endl;   // 1 — INT_MAX is the Mersenne prime 2^31 - 1

    // THE TRAP, if the cast is omitted:
    //   sqrt(INT_MAX) is 46340.95, so the loop reaches i = 46341.
    //   46341 * 46341 = 2,147,488,281, which exceeds INT_MAX.
    //   As an int it wraps to -2,147,479,015 — NEGATIVE.
    //   A negative value is always <= n, so the loop never terminates.

    // Alternative fix: compute the root once, outside the loop.
    // int limit = (int) sqrt((double) n);
    // for (int i = 2; i <= limit; i++) ...
    return 0;
}
```

<!-- @annotations -->
- 7: Widening before the multiplication, not after. (long long)(i * i) would overflow first and widen a wrong value.
- 16: Verified: 2147483647 is prime, and this is exactly the input that hangs without the cast.

<!-- @code java -->
```java
static boolean isPrime(int n) {
    if (n < 2) return false;

    for (int i = 2; (long) i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

System.out.println(isPrime(2));            // true
System.out.println(isPrime(17));           // true
System.out.println(isPrime(25));           // false
System.out.println(isPrime(Integer.MAX_VALUE));   // true

// Java wraps silently on overflow exactly as C++ does, so the same
// infinite loop occurs without the cast.

// The sqrt alternative, computed once:
static boolean isPrimeSqrt(int n) {
    if (n < 2) return false;
    int limit = (int) Math.sqrt(n);
    for (int i = 2; i <= limit; i++) {
        if (n % i == 0) return false;
    }
    return true;
}
```

<!-- @annotations -->
- 4: The cast to long applies to i alone, promoting the whole expression before the multiplication runs.
- 18: Computing the root once avoids both the overflow and any repeated recalculation, at the cost of trusting a floating-point value at the boundary.

<!-- @code python -->
```python
def is_prime(n):
    if n < 2:
        return False

    i = 2
    while i * i <= n:
        if n % i == 0:
            return False
        i += 1
    return True

print(is_prime(2))            # True
print(is_prime(17))           # True
print(is_prime(25))           # False  — caught at i = 5, where i*i == n
print(is_prime(2147483647))   # True

# Python integers are unbounded, so i * i cannot overflow and no cast
# is needed. The identical code in C++ or Java hangs on large inputs.

# The range form reads more naturally, using integer square root:
import math

def is_prime_range(n):
    if n < 2:
        return False
    return all(n % i != 0 for i in range(2, math.isqrt(n) + 1))

print(is_prime_range(1000000007))   # True
```

<!-- @annotations -->
- 6: No cast needed — Python's integers grow to fit, so this is one of the few places it is simply safer.
- 20: math.isqrt gives an exact integer square root with no floating point involved, which is the right tool here.

<!-- @approach -->
### 6k ± 1 Refinement

<!-- @idea -->
Handle 2 and 3 directly, then test only candidates of the form 6k − 1 and 6k + 1, since no other form can be prime.

<!-- @steps -->
1. Return false for any value below 2, and true for 2 and 3 directly.
2. Return false if the number is divisible by 2 or by 3.
3. Start the candidate at 5, which is the first number of the form 6k − 1.
4. At each stop test both the candidate and the candidate plus 2, covering 6k − 1 and 6k + 1.
5. Advance the candidate by 6 and continue while its square does not exceed n.
6. If no candidate divided evenly, n is prime.

<!-- @complexity -->
- time: O(√n)
- space: O(1)
- note: The same complexity class as the plain square-root bound, with a constant factor about three times smaller. Measured on the prime 1000000007: 31,621 operations for the square-root loop against 10,540 for this one, a ratio of 3.0. Skipping two thirds of the candidates is a real saving and does not change the growth rate.

<!-- @code cpp -->
```cpp
bool isPrime6k(int n) {
    if (n < 2)  return false;
    if (n <= 3) return true;                    // 2 and 3 are prime
    if (n % 2 == 0 || n % 3 == 0) return false; // remove all other evens and multiples of 3

    // Every remaining candidate is 6k-1 or 6k+1. Start at 5 = 6(1)-1.
    for (int i = 5; (long long) i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;   // 6k-1 and 6k+1
    }
    return true;
}

cout << isPrime6k(2)  << endl;   // 1
cout << isPrime6k(17) << endl;   // 1
cout << isPrime6k(25) << endl;   // 0
cout << isPrime6k(2147483647) << endl;   // 1

// MEASURED on isPrime(1000000007), a large prime:
//   square-root bound: 31,621 operations
//   6k +/- 1:          10,540 operations   -> ratio 3.0
// Still O(sqrt n). Only the constant factor changed.

// Verified: agrees with the square-root version on every value
// from 0 to 199,999, with zero mismatches.
```

<!-- @annotations -->
- 4: This line is what makes the skipping valid — every even and every multiple of 3 is eliminated before the loop starts.
- 8: Two modulo operations per stop, but the stops are 6 apart instead of 1, so two thirds of the candidates are skipped.

<!-- @code java -->
```java
static boolean isPrime6k(int n) {
    if (n < 2)  return false;
    if (n <= 3) return true;
    if (n % 2 == 0 || n % 3 == 0) return false;

    for (int i = 5; (long) i * i <= n; i += 6) {
        if (n % i == 0 || n % (i + 2) == 0) return false;
    }
    return true;
}

System.out.println(isPrime6k(2));    // true
System.out.println(isPrime6k(17));   // true
System.out.println(isPrime6k(25));   // false

// Why 6k +/- 1 covers every prime above 3:
//   any integer is 6k, 6k+1, 6k+2, 6k+3, 6k+4 or 6k+5
//   6k, 6k+2, 6k+4  are even
//   6k+3            is divisible by 3
//   leaving only    6k+1 and 6k+5, and 6k+5 is 6(k+1)-1
```

<!-- @annotations -->
- 6: The i += 6 step is the whole optimisation, and it is only sound because of the guard two lines above.

<!-- @code python -->
```python
def is_prime_6k(n):
    if n < 2:
        return False
    if n <= 3:
        return True
    if n % 2 == 0 or n % 3 == 0:
        return False

    i = 5
    while i * i <= n:
        if n % i == 0 or n % (i + 2) == 0:
            return False
        i += 6
    return True

print(is_prime_6k(2))            # True
print(is_prime_6k(17))           # True
print(is_prime_6k(25))           # False
print(is_prime_6k(1000000007))   # True

# Roughly three times fewer operations than the plain square-root loop,
# which matters most in Python where each operation is comparatively slow.
```

<!-- @annotations -->
- 10: No cast needed in Python, but the same three-fold saving applies.

<!-- @approach -->
### Sieve of Eratosthenes

<!-- @idea -->
Precompute primality for every number up to a limit by marking multiples, then answer each query instantly.

<!-- @steps -->
1. Create a boolean array covering 0 to the limit, initially assuming everything is prime.
2. Mark 0 and 1 as not prime.
3. For each candidate whose square does not exceed the limit, check whether it is still marked prime.
4. If it is, it is prime, so mark all its multiples as composite.
5. Begin marking at the candidate squared, since every smaller multiple already has a smaller prime factor and was marked earlier.
6. After building, any query is a single array lookup.

<!-- @complexity -->
- time: O(n log log n) to build, O(1) per query
- space: O(n)
- note: Building marks the multiples of each prime, costing roughly n divided by p for each prime p, and that sum over primes gives n log log n. Each subsequent query is a single array lookup. The trade is memory: one boolean per number in the range, which is the only approach here whose space grows with the input. Worth it above a handful of queries over a bounded range, and wasted work for a single check.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <vector>
using namespace std;

vector<bool> buildSieve(int limit) {
    vector<bool> isPrime(limit + 1, true);
    isPrime[0] = isPrime[1] = false;

    for (int i = 2; (long long) i * i <= limit; i++) {
        if (isPrime[i]) {
            // Start at i*i — smaller multiples were marked by smaller primes
            for (int j = i * i; j <= limit; j += i) {
                isPrime[j] = false;
            }
        }
    }
    return isPrime;
}

int main() {
    auto sieve = buildSieve(1000000);

    cout << sieve[17]     << endl;   // 1  — O(1) lookup
    cout << sieve[25]     << endl;   // 0
    cout << sieve[999983] << endl;   // 1

    // Count primes below a million
    int count = 0;
    for (int i = 2; i <= 1000000; i++) if (sieve[i]) count++;
    cout << count << endl;   // 78498
    return 0;
}
```

<!-- @annotations -->
- 12: Starting at i*i rather than 2*i is the standard refinement: every multiple below i*i has a factor smaller than i.
- 30: The known count of primes below one million, useful as a correctness check on any sieve implementation.

<!-- @code java -->
```java
static boolean[] buildSieve(int limit) {
    boolean[] isPrime = new boolean[limit + 1];
    java.util.Arrays.fill(isPrime, true);
    isPrime[0] = isPrime[1] = false;

    for (int i = 2; (long) i * i <= limit; i++) {
        if (isPrime[i]) {
            for (int j = i * i; j <= limit; j += i) {
                isPrime[j] = false;
            }
        }
    }
    return isPrime;
}

boolean[] sieve = buildSieve(1000000);
System.out.println(sieve[17]);       // true
System.out.println(sieve[25]);       // false
System.out.println(sieve[999983]);   // true

// Use this when you have many queries over a bounded range.
// For a single query the square-root check is far cheaper —
// building a sieve to answer one question is wasted work.
```

<!-- @annotations -->
- 8: j = i * i can itself overflow for a limit near Integer.MAX_VALUE, which is a second place the same trap appears.

<!-- @code python -->
```python
def build_sieve(limit):
    is_prime = [True] * (limit + 1)
    is_prime[0] = is_prime[1] = False

    i = 2
    while i * i <= limit:
        if is_prime[i]:
            # Slice assignment marks every multiple in one operation
            is_prime[i*i::i] = [False] * len(is_prime[i*i::i])
        i += 1
    return is_prime

sieve = build_sieve(1000000)
print(sieve[17])       # True
print(sieve[25])       # False
print(sieve[999983])   # True
print(sum(sieve))      # 78498 — primes below one million

# The slice assignment is much faster than a Python-level loop,
# because the marking happens inside the interpreter's C code.
```

<!-- @annotations -->
- 9: Slice striding replaces the inner loop entirely, which matters because Python-level loops are slow.
- 17: Booleans sum as 1 and 0, so summing the array counts the primes directly.

<!-- @example -->

<!-- @input -->
n = 100003, naive scan versus the square-root bound

<!-- @output -->
Both return prime. Naive takes 100,001 operations, the square-root bound takes 315.

<!-- @why -->
The measured 317-fold reduction comes from changing one loop bound, which makes the square-root argument concrete rather than theoretical.

<!-- @walkthrough -->
1. The naive loop tests every candidate from 2 up to 100002, performing one modulo each.
2. Since the number is prime, none divides evenly and there is no early exit, so all 100,001 tests run.
3. The square-root version stops once the candidate squared exceeds the number.
4. The square root of 100003 is about 316.2, so the loop tests only up to 316.
5. That is 315 operations, and the conclusion is identical.
6. Everything beyond 316 could only have found the larger partner of a pair whose smaller member was already tested.

<!-- @example -->

<!-- @input -->
n = 36, showing why the bound is exactly the square root

<!-- @output -->
The divisor pairs mirror around 6, which is √36

<!-- @why -->
A perfect square makes the mirroring visible, since the middle pair is a single value sitting exactly at the bound.

<!-- @walkthrough -->
1. The divisors of 36 are 1, 2, 3, 4, 6, 9, 12, 18 and 36.
2. They pair up as 1 with 36, 2 with 18, 3 with 12, 4 with 9, and 6 with itself.
3. In every pair, one member is at most 6 and the other is at least 6.
4. 6 is the square root of 36, and it is the exact point where the pairing turns around.
5. So testing 2, 3, 4, 5 and 6 covers the smaller member of every possible pair.
6. Testing 9, 12, 18 or 36 could only rediscover partners already found, which is why the loop can stop.

<!-- @example -->

<!-- @input -->
isPrime(2147483647) written with a plain i * i <= n condition

<!-- @output -->
Infinite loop — the program hangs

<!-- @why -->
Verified numerically. The input is genuinely prime, so there is no early exit to hide the bug, and it is exactly the value a test suite would use to probe the boundary.

<!-- @walkthrough -->
1. The square root of 2147483647 is about 46340.95, so the loop must reach 46341 before its condition fails.
2. At that point it computes 46341 multiplied by 46341, which is 2,147,488,281.
3. That value exceeds the maximum int of 2,147,483,647, so it wraps.
4. The wrapped result is -2,147,479,015, which is negative.
5. A negative value is always less than or equal to n, so the condition remains true.
6. The candidate keeps increasing, the product keeps wrapping, and the loop never terminates.
7. Casting to a wider type before the multiplication, or computing the square root once beforehand, fixes it.

<!-- @example -->

<!-- @input -->
isPrime(1000000007), square-root bound versus 6k ± 1

<!-- @output -->
Both return prime. 31,621 operations against 10,540 — a ratio of 3.0.

<!-- @why -->
Confirms the standard three-times-faster claim by measurement, and reinforces that a constant-factor gain is real without being a complexity improvement.

<!-- @walkthrough -->
1. The square root of 1000000007 is about 31,623, so the plain loop tests roughly that many candidates.
2. The 6k form first eliminates every even number and every multiple of 3, which is two thirds of all integers.
3. It then advances in steps of 6, testing two candidates at each stop rather than six.
4. That gives roughly a third as many modulo operations over the same range.
5. Measured: 31,621 operations against 10,540, a ratio of exactly 3.0.
6. Both are O of the square root of n — only the constant factor changed.

<!-- @visualization custom -->

<!-- @description -->
Draw a horizontal axis of candidate divisors from 2 up to n, with the value n shown above it. The NAIVE panel walks a marker along the entire axis testing each candidate, and on a prime input the marker traverses the whole span with an operation counter climbing to the full length — deliberately slow, so the waste is felt. The PAIRING panel is the one that earns the lesson: for a composite such as 36, draw every divisor as a point on the axis and connect each to its partner with an arc above the line, so 1 arcs to 36, 2 to 18, 3 to 12, 4 to 9, and 6 to itself. Mark the square root with a vertical line and show that every arc crosses it exactly once, with one endpoint on each side — and that the 6-to-6 arc collapses to a point sitting precisely on the line. That picture is the entire justification: testing only the left of the line touches one endpoint of every arc. Then dim everything right of the line and replay the scan, with the counter stopping at the square root. The OVERFLOW panel takes n as INT_MAX and draws the loop condition as a growing square whose area is compared against a capacity bar: as the candidate climbs the square grows, and at 46341 it exceeds the bar, shears off the excess exactly as in the data-types visualisation, and reassembles as a NEGATIVE value drawn below the axis — at which point the comparison against n is trivially satisfied and the marker keeps advancing forever. Loop that visibly. Finish with the SIEVE panel: draw the numbers 2 to 100 as a grid, then for each surviving prime animate its multiples being struck out starting from its square, with earlier strikes shown greyed so it is obvious why starting at i squared skips no one — and end with the primes remaining lit and a note that every subsequent query is one lookup.

<!-- @sampleInput -->
```json
{"scan":{"n":100003,"naiveOps":100001,"sqrtOps":315,"sqrtOfN":316.2,"ratio":317},"pairing":{"n":36,"sqrt":6,"pairs":[[1,36],[2,18],[3,12],[4,9],[6,6]]},"overflow":{"n":2147483647,"isPrime":true,"sqrtOfN":46340.95,"loopReaches":46341,"product":2147488281,"intMax":2147483647,"wrapsTo":-2147479015,"terminates":false,"fix":"widen before multiplying"},"sixK":{"n":1000000007,"sqrtOps":31621,"sixKOps":10540,"ratio":3.0,"eliminated":["6k","6k+2","6k+3","6k+4"],"tested":["6k+1","6k+5"]},"sieve":{"limit":100,"startMarkingAt":"i*i","complexity":"O(n log log n)","primesBelowMillion":78498}}
```

<!-- @highlights -->
- A candidate axis runs from 2 to n, with the naive marker traversing its entire length on a prime input.
- The operation counter climbs to the full span, making the wasted work visible rather than described.
- The pairing panel draws 36's divisors as points, connecting each to its partner with an arc above the line.
- 1 arcs to 36, 2 to 18, 3 to 12, 4 to 9, and 6 arcs to itself.
- A vertical line at the square root shows every arc crossing it exactly once, one endpoint on each side.
- The 6-to-6 arc collapses to a single point sitting precisely on that line.
- Dimming everything to the right and replaying the scan stops the counter at the square root.
- The overflow panel draws the loop condition as a growing square compared against a capacity bar.
- At candidate 46341 the square exceeds the bar, shears off the excess, and reassembles below the axis as a negative value.
- The comparison against n is now trivially satisfied and the marker advances forever, looped visibly.
- The sieve panel lays out 2 to 100 as a grid and strikes out each prime's multiples starting from its square.
- Earlier strikes are shown greyed, making clear why starting at i squared skips nobody.
- The surviving primes stay lit, and every later query becomes a single lookup.

<!-- @edgeCases -->
- Values below 2, including 0, 1 and negatives, which are not prime by definition.
- The number 1, which has only one divisor rather than two and is therefore not prime.
- The number 2, which is prime and is the only even prime, so every optimisation special-cases it.
- The number 3, which the 6k form must handle directly since the loop starts at 5.
- Perfect squares, where the divisor is found exactly at the bound because i multiplied by i equals n.
- A prime near the type maximum, where the loop condition overflows and never terminates without a widening cast.
- The value 2147483647, which is itself prime, so there is no early exit to mask the overflow bug.
- A composite with a very small factor, which exits on the first iteration regardless of magnitude.
- A large prime, which is the worst case since every candidate up to the square root must be tested.
- A sieve limit near the type maximum, where the inner loop's starting index i multiplied by i also overflows.

<!-- @pitfalls -->
- Writing i * i <= n without widening, which overflows near the type maximum and produces an infinite loop.
- Widening after the multiplication rather than before, which promotes an already-wrapped value.
- Forgetting the guard for values below 2, so 1 and 0 are wrongly reported as prime.
- Treating 1 as prime, when the definition requires exactly two distinct divisors.
- Stopping at n divided by 2 and believing it is an optimisation, when it halves a linear cost and stays O(n).
- Calling sqrt inside the loop condition, which may recompute it on every iteration and relies on floating point at the boundary.
- Omitting the divisibility check by 2 and 3 before the 6k loop, which makes the step of 6 unsound.
- Starting the sieve's inner marking at 2i rather than i squared, which repeats work already done by smaller primes.
- Building a sieve to answer a single query, where the square-root check is far cheaper.
- Assuming a constant-factor gain such as 6k plus or minus 1 changes the complexity class, when it remains O of the square root of n.

<!-- @doubt -->
### Why can we stop at the square root?

<!-- @answer -->
Because divisors come in pairs that multiply to n, and in every pair one member is at most the square root. If both were larger, their product would exceed n, which contradicts the fact that they multiply to exactly n. So if n has any divisor at all, it has one at or below the square root — and checking beyond that point can only rediscover the larger partners of pairs you already tested. For 36, the pairs are 1 with 36, 2 with 18, 3 with 12, 4 with 9, and 6 with itself, and 6 is precisely where the mirroring turns around.

<!-- @doubt -->
### Is 1 prime?

<!-- @answer -->
No. The definition requires exactly two distinct positive divisors, and 1 has only itself. This is not an arbitrary exclusion — it is what makes prime factorisation unique. If 1 counted as prime, every number would have infinitely many factorisations, since you could multiply in any number of ones. Zero and negative numbers are excluded for the same reason: the definition begins above 1.

<!-- @doubt -->
### Why write i * i <= n instead of i <= sqrt(n)?

<!-- @answer -->
Two reasons. It is exact, where sqrt returns a floating-point value that cannot be fully trusted at boundaries — the same concern as the log10 problem in Count Digits. And written inside the condition, sqrt may be recalculated on every iteration. The alternative is to compute the root once before the loop and compare against that stored value, which avoids both problems and is a perfectly good choice.

<!-- @doubt -->
### Why does my prime check hang on large numbers?

<!-- @answer -->
Because i * i overflows. The square root of the maximum int is about 46340.95, so the loop reaches 46341, and 46341 squared is 2,147,488,281 — past the limit. It wraps to negative 2,147,479,015, and a negative value is always less than or equal to n, so the condition stays true forever. Cast to a wider type before the multiplication, as in (long long) i * i, or compute the square root once outside the loop. The cast must come before the multiply, not after.

<!-- @doubt -->
### Why does 6k ± 1 work, and how much does it help?

<!-- @answer -->
Every integer can be written as 6k plus something from 0 to 5. Of those, 6k, 6k+2 and 6k+4 are even, and 6k+3 is divisible by 3 — so once you have tested 2 and 3 directly, only 6k+1 and 6k+5 remain, and 6k+5 is the same as 6(k+1) minus 1. That skips two thirds of the candidates. Measured on the prime 1000000007: 31,621 operations for the plain square-root loop against 10,540 for this one, a ratio of exactly 3.0. It is still O of the square root of n — only the constant factor changed.

<!-- @doubt -->
### When should I use a sieve instead?

<!-- @answer -->
When you need many answers over a bounded range. A single check costs O of the square root of n, while a sieve costs O of n log log n once and then answers every query in constant time. Building a sieve to answer one question is wasted work, but for a few hundred queries or for listing all primes up to a limit it wins decisively. The cost is memory: one boolean per number in the range, so it is the only approach here whose space grows with the input.

<!-- @doubt -->
### Why does the sieve start marking at i squared?

<!-- @answer -->
Because every multiple of i below i squared already has a prime factor smaller than i, and was therefore marked when that smaller prime was processed. For i equal to 5, the multiples 10, 15 and 20 were already struck out by 2 and by 3, so marking can begin at 25. It is a genuine saving and it changes nothing about correctness — starting at 2i would simply redo work.

<!-- @doubt -->
### Is stopping at n / 2 a useful optimisation?

<!-- @answer -->
Barely. No divisor other than n itself can exceed half of n, so the bound is valid, and it halves the number of iterations. But halving a linear cost leaves it linear — the loop is still O(n), and for a six-digit number that is still fifty thousand operations where the square-root bound needs three hundred. It is the classic case of an optimisation that feels significant and does not change the growth rate at all.
