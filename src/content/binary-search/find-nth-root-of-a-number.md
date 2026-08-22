---
id: find-nth-root-of-a-number
topic: Binary Search
title: Find Nth root of a number
difficulty: Medium
status: ready
prerequisites:
  - find-square-root-of-a-number
  - integer-overflow-and-precision-errors
  - lower-bound
relatedIds:
  - find-square-root-of-a-number
  - integer-overflow-and-precision-errors
  - koko-eating-bananas
  - find-the-smallest-divisor
  - lower-bound
---

<!-- @summary -->
The square root generalised, and the two things that were merely awkward there become the whole problem: widening to 64 bits stops being a fix, because at n = 10 only bases up to 78 are representable, and `pow(m, 1.0/n)` returns 3.9999999999999996 for the cube root of 64. The repair is to stop computing the power at all — compare against m while multiplying and bail out the moment you pass it.

<!-- @theory -->
## The problem

Given an exponent n and a value m, return the integer k with kⁿ = m, or -1 if no
such integer exists.

```
n = 3, m = 27    ->  3
n = 4, m = 69    ->  -1
n = 3, m = 64    ->  4
n = 10, m = 1024 ->  2
```

The shape is identical to the square root: the search space is the range of
candidate answers and the predicate "kⁿ ≤ m" is monotone in k. What changes is
that evaluating the predicate is now the hard part.

## Widening is no longer a fix

For the square root, `(long long)mid * mid` solved everything. Here is the same
question asked for each exponent — the largest base whose power is representable:

| n | largest base in a 32-bit int | in a 64-bit int |
|---|---|---|
| 2 | 46,340 | 3,037,000,499 |
| 3 | 1,290 | 2,097,151 |
| 4 | 215 | 55,108 |
| 5 | 73 | 6,208 |
| 7 | 21 | 511 |
| 10 | **8** | **78** |
| 15 | 4 | 18 |
| 20 | **2** | **8** |

At n = 20 a 64-bit integer holds the power of nothing above 8. Sixty-four bits is
not a bigger hammer here; it is the same hammer one size up.

And as in the square root, the naive upper bound makes the first probe the one
that breaks. With `hi = m` the first candidate is m/2, so:

| n | first probe overflows a 64-bit product from m = |
|---|---|
| 3 | 4,194,304 |
| 5 | 12,418 |
| 7 | 1,024 |
| 10 | **158** |

For n = 10, any m above 158 overflows on the first step.

## Do not compute the power

The fix is not a wider type. It is to notice that the search never needs the value
of kⁿ — it only needs to know how kⁿ compares to m. So multiply and stop as soon
as the answer is decided:

```
cmpPow(base, n, m):        # -1 if base^n < m, 0 if equal, 1 if greater
    r = 1
    for i in 1..n:
        r *= base
        if r > m: return 1
    return 0 if r == m else -1
```

The running product never exceeds `m × base`, which for a 32-bit m and base is
below 2⁶², so nothing overflows regardless of n. Tested across every exponent from
1 to 20 and every m from 1 to 200,000 — four million cases — this is **0 wrong**,
where computing the full power in a 64-bit integer is not.

## The failures are all false negatives

Both broken approaches fail in the same direction, which is worth knowing because
it changes how you would catch them.

Over the same four million cases, 200,577 have an exact root and 3,799,423 do not:

| | wrong when a root exists | wrong when none exists |
|---|---|---|
| full power in a 64-bit int | 25 — 0.012% | **0** |
| `pow(m, 1.0/n)`, uncorrected | 61 — 0.030% | **0** |

Neither ever invents a root. They only ever miss one — the overflow wraps to a
value that steers the search away, and the floating-point version lands one below
the answer and fails its own verification. A test that only checks "does it reject
non-roots" passes both.

The absolute rates look reassuring and are not. The naive power misses
19⁴ = 130,321, 8⁵ = 32,768 and 10⁵ = 100,000 — ordinary numbers, not edge cases.

## `pow` gets the cube root of 64 wrong

The floating-point route fails on inputs small enough to be startling:

```
pow(64,  1.0/3) = 3.9999999999999996   truncates to 3
pow(125, 1.0/3) = 4.9999999999999991   truncates to 4
pow(216, 1.0/3) = 5.9999999999999991   truncates to 5
pow(343, 1.0/3) = 6.9999999999999991   truncates to 6
```

The cause is not `pow` being inaccurate about cube roots. It is that **1.0/3 is
not representable**: as a double it is 0.33333333333333331483, so the expression
computes 64 raised to slightly less than one third, which is slightly less than 4.
Truncation then loses the whole integer.

The contrast makes it precise — `cbrt(64.0)` returns exactly **4**, because it
never forms the reciprocal at all.

So `pow(m, 1.0/n)` is not usable as-is. It is usable as a *seed*: round it and
then test candidates within ±2 with exact integer arithmetic. Measured that way it
is **0 wrong** across all four million cases.

## Choosing `hi` matters more than it did

With `hi = m` the iteration count does not depend on n at all, which is absurd on
its face — the answer for n = 20 is at most 2, and the search still takes 31 steps
to find it. The bit-length bound `2^ceil(bits(m)/n)` is an upper bound on the
answer and collapses the range:

| n | iterations with hi = m | with the bit-length bound |
|---|---|---|
| 2 | 31 | 16 |
| 3 | 31 | 11 |
| 5 | 31 | 7 |
| 10 | 31 | **4** |
| 20 | 31 | **2** |
| 31 | 31 | **2** |

## Three regimes

Nanoseconds per call, m drawn uniformly from 1 to 2³¹ − 1:

| n | linear | binary, hi = m | binary, bounded | Newton |
|---|---|---|---|---|
| 2 | 45,204 | 98.5 | 73.6 | **22.6** |
| 3 | 1,695 | 90.2 | 53.1 | **22.7** |
| 5 | 151 | 84.8 | **36.0** | 37.7 |
| 10 | 38 | 85.7 | **23.9** | 33.8 |

Three things move at once, and they move in different directions.

**The linear scan becomes viable as n grows.** At n = 2 it is catastrophic —
45 microseconds, because the answer can be 46,340. At n = 10 the answer is at most
8, so it tries at most nine candidates and measures 38ns, beating the unbounded
binary search.

**Newton wins for small n and loses for large n.** Its per-step cost includes
computing x^(n−1), which is n−1 multiplications, so its steps get more expensive
exactly as the binary search's step count falls. It leads at n = 2 and n = 3 and
is behind by n = 5.

**The bounded binary search is the only one that is never bad.** It is second at
worst across the whole range, which is usually what you want from a default.

<!-- @intuition -->
The square root container made the point that binary search needs a range and a monotone predicate rather than an array. This one makes the sharper point that the predicate is code you have to write, and code can be wrong in ways an array lookup cannot. Reading `a[mid]` either works or crashes; computing `mid^n` can silently produce a number that is not the power of anything, and the search will then narrow confidently toward nonsense. The reframing that fixes it is to stop thinking of the predicate as "compute the power, then compare" and start thinking of it as "compare, computing only as much as the comparison needs". Once the loop can answer *greater than m* without ever holding a value larger than m, the entire class of overflow bugs stops existing rather than being pushed to a larger type.

<!-- @approach -->
### Linear Search

<!-- @idea -->
Try candidates upward until the power reaches or passes m.

<!-- @steps -->
1. Start at 1.
2. Compare the candidate's nth power against m, stopping the multiplication early if it passes.
3. If the power equals m, that candidate is the answer.
4. If it exceeds m, no integer root exists.
5. Otherwise advance to the next candidate.

<!-- @complexity -->
- time: O(m^(1/n) · n)
- space: O(1)
- note: Its cost falls sharply as n grows, because the answer does. Measured 45,204ns at n = 2 — where the answer can be 46,340 — and 38ns at n = 10, where it can be at most 8, which is faster than an unbounded binary search.

<!-- @code cpp -->
```cpp
static int cmpPow(long long base, int n, long long m) {
    long long r = 1;
    for (int i = 0; i < n; i++) {
        r *= base;
        if (r > m) return 1;
    }
    return r == m ? 0 : -1;
}

int nthRoot(int n, long long m) {
    for (long long b = 1; ; b++) {
        int c = cmpPow(b, n, m);
        if (c == 0) return (int)b;
        if (c > 0) return -1;
    }
}
```

<!-- @annotations -->
- 5: The cutoff. Once the running product passes m the answer is decided, so there is no reason to keep multiplying — and no opportunity to overflow.
- 7: Three-way, not boolean. The caller needs to distinguish "too small, keep going" from "too big, stop", and collapsing them would cost an extra evaluation.
- 12: No upper bound is needed here, because the loop terminates the moment a candidate overshoots.

<!-- @code java -->
```java
static int cmpPow(long base, int n, long m) {
    long r = 1;
    for (int i = 0; i < n; i++) {
        r *= base;
        if (r > m) return 1;
    }
    return r == m ? 0 : -1;
}

static int nthRoot(int n, long m) {
    for (long b = 1; ; b++) {
        int c = cmpPow(b, n, m);
        if (c == 0) return (int) b;
        if (c > 0) return -1;
    }
}
```

<!-- @annotations -->
- 4: `r` is a long and `base` is a long, so the product is 64-bit. The cutoff on the next line is what keeps it bounded, not the type.

<!-- @code python -->
```python
def nth_root(n, m):
    b = 1
    while True:
        p = b ** n
        if p == m:
            return b
        if p > m:
            return -1
        b += 1
```

<!-- @annotations -->
- 4: No cutoff needed. Python integers grow as required, so `b ** n` is exact for any size — at the cost of computing a potentially enormous number that is then discarded.

<!-- @approach -->
### Binary Search on the Answer

<!-- @idea -->
Halve the range of candidate roots, deciding each step with a multiplication that stops as soon as it passes m.

<!-- @steps -->
1. Bound the range above using the bit length of m, since the answer cannot exceed 2^ceil(bits/n).
2. Take the midpoint of the candidate range.
3. Compare its nth power against m, stopping the multiplication early.
4. Equal means the answer; smaller means search above; larger means search below.
5. Falling out of the loop means no exact integer root exists.

<!-- @complexity -->
- time: O(log(m^(1/n)) · n) — 4 iterations at n = 10 with the bound, against 31 without it
- space: O(1)
- note: The only approach here that is never bad — first or second at every exponent tested. Measured 73.6ns at n = 2 and 23.9ns at n = 10, against 98.5 and 85.7 for the unbounded version whose iteration count ignores n entirely.

<!-- @code cpp -->
```cpp
static int cmpPow(long long base, int n, long long m) {
    long long r = 1;
    for (int i = 0; i < n; i++) {
        r *= base;
        if (r > m) return 1;
    }
    return r == m ? 0 : -1;
}

int nthRoot(int n, long long m) {
    if (m <= 1) return (int)m;
    int bits = 64 - __builtin_clzll((unsigned long long)m);
    long long lo = 1, hi = 1LL << ((bits + n - 1) / n);
    while (lo <= hi) {
        long long mid = lo + (hi - lo) / 2;
        int c = cmpPow(mid, n, m);
        if (c == 0) return (int)mid;
        if (c < 0) lo = mid + 1;
        else       hi = mid - 1;
    }
    return -1;
}
```

<!-- @annotations -->
- 5: The running product never exceeds m times base, which for 32-bit inputs stays below 2^62 — so this loop cannot overflow for any n. That is the whole fix, and it is a change of shape rather than of type.
- 11: m of 0 or 1 is its own nth root, and this also excludes zero before the next line, where counting leading zeros would be undefined.
- 12: The bit length of m. `__builtin_clzll` is undefined for a zero argument, which line 11 has already ruled out.
- 13: 2^ceil(bits/n) is at least the true root. Leaving `hi = m` instead costs 31 iterations at every exponent, even when the answer cannot exceed 2.
- 17: Three-way comparison, so one evaluation of the power decides the step. Calling it twice to test equality and then ordering would double the multiplications.
- 21: -1 for no exact root. Every candidate in the range was ruled out by an exact integer comparison, so this is a proof rather than a fallback.

<!-- @code java -->
```java
static int nthRoot(int n, long m) {
    if (m <= 1) return (int) m;
    int bits = 64 - Long.numberOfLeadingZeros(m);
    long lo = 1, hi = 1L << ((bits + n - 1) / n);
    while (lo <= hi) {
        long mid = lo + (hi - lo) / 2;
        int c = cmpPow(mid, n, m);
        if (c == 0) return (int) mid;
        if (c < 0) lo = mid + 1;
        else       hi = mid - 1;
    }
    return -1;
}
```

<!-- @annotations -->
- 6: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows for large bounds exactly as in Lower Bound.

<!-- @code python -->
```python
def nth_root(n, m):
    if m <= 1:
        return m
    lo, hi = 1, 1 << ((m.bit_length() + n - 1) // n)
    while lo <= hi:
        mid = (lo + hi) // 2
        p = mid ** n
        if p == m:
            return mid
        if p < m:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

<!-- @annotations -->
- 4: The bound still earns its place in Python. Nothing can overflow, but `mid ** n` on a needlessly large mid computes an enormous integer only to throw it away.
- 7: Exact for any size, which is why Python needs no cutoff — and why this is the one language where the central bug of this container cannot occur.

<!-- @approach -->
### Newton's Method

<!-- @idea -->
Refine an estimate instead of halving a range, using the nth-root iteration.

<!-- @steps -->
1. Handle m of 0 or 1 directly.
2. Seed the estimate from the bit length, at a power of two above the true root.
3. Replace the estimate x with ((n − 1)·x + m / x^(n−1)) / n.
4. Repeat while the estimate keeps decreasing.
5. Verify the final estimate with an exact integer comparison, since the iteration only converges to the real root.

<!-- @complexity -->
- time: O(log log m · n) — each step costs n − 1 multiplications
- space: O(1)
- note: The fastest for small exponents and not for large ones. Measured 22.6ns at n = 2 and 22.7ns at n = 3, against the bounded binary search's 73.6 and 53.1 — but 37.7ns against 36.0 at n = 5, and 33.8 against 23.9 at n = 10. Its per-step cost grows with n exactly as the binary search's step count falls.

<!-- @code cpp -->
```cpp
int nthRoot(int n, long long m) {
    if (m <= 1 || n == 1) return (n == 1) ? (int)m : (int)m;
    int bits = 64 - __builtin_clzll((unsigned long long)m);
    long long x = 1LL << ((bits + n - 1) / n);
    while (true) {
        long long p = 1;
        for (int i = 0; i < n - 1; i++) {
            p *= x;
            if (p > m) { p = 0; break; }
        }
        long long y = ((n - 1) * x + (p == 0 ? 0 : m / p)) / n;
        if (y >= x) break;
        x = y;
    }
    return cmpPow(x, n, m) == 0 ? (int)x : -1;
}
```

<!-- @annotations -->
- 4: Seeding above the true root, so the iteration descends monotonically and the first non-decrease means it has arrived. Seeding below would let it approach from underneath and stop early.
- 8: The same cutoff idea as the binary version — x^(n-1) can overshoot, and once it does the division term contributes nothing.
- 11: The stopping test. Newton converges quadratically from above, so this typically runs a handful of times regardless of m.
- 14: The verification is not optional. Newton converges to the real nth root, which is only an integer when one exists — without this check a non-root would return the floor.

<!-- @code java -->
```java
static int nthRoot(int n, long m) {
    if (m <= 1 || n == 1) return (int) m;
    int bits = 64 - Long.numberOfLeadingZeros(m);
    long x = 1L << ((bits + n - 1) / n);
    while (true) {
        long p = 1;
        for (int i = 0; i < n - 1; i++) {
            p *= x;
            if (p > m) { p = 0; break; }
        }
        long y = ((n - 1) * x + (p == 0 ? 0 : m / p)) / n;
        if (y >= x) break;
        x = y;
    }
    return cmpPow(x, n, m) == 0 ? (int) x : -1;
}
```

<!-- @annotations -->
- 4: The seed is what makes this competitive. The square root container measured a lazy seed turning Newton from the fastest option into the slowest.

<!-- @code python -->
```python
def nth_root(n, m):
    if m <= 1 or n == 1:
        return m
    x = 1 << ((m.bit_length() + n - 1) // n)
    while True:
        y = ((n - 1) * x + m // x ** (n - 1)) // n
        if y >= x:
            break
        x = y
    return x if x ** n == m else -1
```

<!-- @annotations -->
- 6: Integer division throughout. Using `/` would reintroduce the floating point this whole approach exists to avoid.
- 9: The exact check at the end, using arbitrary-precision arithmetic, so no rounding can slip through.

<!-- @example -->

<!-- @input -->
```
n = 3, m = 27
```

<!-- @output -->
```
3
```

<!-- @why -->
An exact cube root. The bit-length bound keeps the search inside a range of four candidates rather than twenty-seven.

<!-- @walkthrough -->
```
bits(27) = 5, so hi = 2^ceil(5/3) = 2^2 = 4
lo=1 hi=4   mid=2   2^3 = 8  < 27   lo = 3
lo=3 hi=4   mid=3   3^3 = 27 = 27   -> 3

Two probes. With hi = m the same search would start at
mid = 14 and take five.
```

<!-- @example -->

<!-- @input -->
```
n = 4, m = 69
```

<!-- @output -->
```
-1
```

<!-- @why -->
69 is between 2⁴ = 16 and 3⁴ = 81, so no integer fourth root exists. The -1 is a proof, not a fallback — every candidate was ruled out by exact integer arithmetic.

<!-- @walkthrough -->
```
bits(69) = 7, so hi = 2^ceil(7/4) = 2^2 = 4
lo=1 hi=4   mid=2   2^4 = 16 < 69   lo = 3
lo=3 hi=4   mid=3   3^4 = 81 > 69   hi = 2
lo > hi -> -1

The multiplication for 3^4 stopped at 81 rather than
continuing, which is the cutoff doing its job even on a
value this small.
```

<!-- @example -->

<!-- @input -->
```
n = 3, m = 64
```

<!-- @output -->
```
4
```

<!-- @why -->
The input where the floating-point shortcut fails. `pow(64, 1.0/3)` is 3.9999999999999996, so truncating gives 3, and 3³ = 27 ≠ 64 reports no root.

<!-- @walkthrough -->
```
Integer search:
  bits(64) = 7, hi = 2^ceil(7/3) = 2^3 = 8
  lo=1 hi=8   mid=4   4^3 = 64 = 64   -> 4

Floating point, uncorrected:
  1.0/3          = 0.33333333333333331483   (not exactly a third)
  pow(64, that)  = 3.9999999999999996
  (long long)    = 3
  3^3 = 27 != 64 -> -1                       WRONG

  cbrt(64.0)     = 4 exactly, because it never forms 1/3

Corrected: round to 4, test candidates 2..6 exactly -> 4
```

<!-- @example -->

<!-- @input -->
```
n = 10, m = 1024
```

<!-- @output -->
```
2
```

<!-- @why -->
A large exponent, where the answer is tiny and the naive bound is most wasteful. It is also past the point where computing the power directly overflows a 64-bit integer.

<!-- @walkthrough -->
```
bits(1024) = 11, so hi = 2^ceil(11/10) = 2^2 = 4
lo=1 hi=4   mid=2   2^10 = 1024 = 1024   -> 2

One probe. With hi = m the search starts at mid = 512, and
512^10 is about 1.3 x 10^27 — far past what a 64-bit
integer holds. Measured, the first probe overflows for any
m above 158 at this exponent.
```

<!-- @visualization custom -->

<!-- @description -->
Shows why widening the integer type stops working as the exponent grows, the cutoff that removes the overflow by never forming a large value, and the three regimes in which linear, binary and Newton each win.

<!-- @sampleInput -->
```json
{"primary":{"n":3,"m":27,"answer":3,"bound":{"bits":5,"hi":4,"formula":"2^ceil(bits/n)"},"trace":[{"lo":1,"hi":4,"mid":2,"power":8,"compare":"< m","action":"lo = mid + 1"},{"lo":3,"hi":4,"mid":3,"power":27,"compare":"== m","action":"return 3"}],"probesWithBound":2,"probesWithHiEqualsM":5},"wideningStopsWorking":{"table":[{"n":2,"int32":46340,"int64":3037000499},{"n":3,"int32":1290,"int64":2097151},{"n":4,"int32":215,"int64":55108},{"n":5,"int32":73,"int64":6208},{"n":7,"int32":21,"int64":511},{"n":10,"int32":8,"int64":78},{"n":15,"int32":4,"int64":18},{"n":20,"int32":2,"int64":8}],"reading":"at n = 20 a 64-bit integer holds the power of nothing above 8"},"firstProbeOverflows":{"cause":"hi = m puts the first candidate at m/2","rows":[{"n":3,"fromM":4194304},{"n":5,"fromM":12418},{"n":7,"fromM":1024},{"n":10,"fromM":158}]},"theFix":{"idea":"the search never needs the value of base^n, only how it compares to m","pseudocode":"r = 1; for i in 1..n: r *= base; if r > m: return 1; return 0 if r == m else -1","bound":"the running product never exceeds m * base, below 2^62 for 32-bit inputs","verified":{"cases":4000000,"space":"n = 1..20, m = 1..200,000","wrong":0}},"failuresAreFalseNegatives":{"rootExists":200577,"noRootExists":3799423,"rows":[{"method":"full power in a 64-bit int","wrongWhenRootExists":25,"pct":0.012,"wrongWhenNone":0},{"method":"pow(m, 1.0/n) uncorrected","wrongWhenRootExists":61,"pct":0.030,"wrongWhenNone":0}],"reading":"neither ever invents a root; a test that only checks rejection of non-roots passes both","naiveMisses":[{"n":4,"m":130321,"root":19},{"n":5,"m":32768,"root":8},{"n":5,"m":100000,"root":10}]},"powIsWrongOnTinyInputs":{"rows":[{"expr":"pow(64, 1.0/3)","value":"3.9999999999999996","truncates":3,"correct":4},{"expr":"pow(125, 1.0/3)","value":"4.9999999999999991","truncates":4,"correct":5},{"expr":"pow(216, 1.0/3)","value":"5.9999999999999991","truncates":5,"correct":6},{"expr":"pow(343, 1.0/3)","value":"6.9999999999999991","truncates":6,"correct":7}],"cause":"1.0/3 is not representable — as a double it is 0.33333333333333331483, so the expression raises m to slightly less than one third","contrast":{"expr":"cbrt(64.0)","value":4,"why":"never forms the reciprocal"},"usableAs":"a seed: round it, then test candidates within +/-2 using exact integer arithmetic — measured 0 wrong over all 4,000,000 cases"},"boundMatters":{"observation":"with hi = m the iteration count does not depend on n at all, even though the answer for n = 20 is at most 2","rows":[{"n":2,"hiIsM":31,"bitLengthBound":16},{"n":3,"hiIsM":31,"bitLengthBound":11},{"n":5,"hiIsM":31,"bitLengthBound":7},{"n":10,"hiIsM":31,"bitLengthBound":4},{"n":20,"hiIsM":31,"bitLengthBound":2},{"n":31,"hiIsM":31,"bitLengthBound":2}]},"threeRegimes":{"units":"ns per call, randomised round order, best of 9, m uniform in 1..2^31-1","rows":[{"n":2,"linear":45204,"binaryHiIsM":98.5,"binaryBounded":73.6,"newton":22.6},{"n":3,"linear":1695,"binaryHiIsM":90.2,"binaryBounded":53.1,"newton":22.7},{"n":5,"linear":151,"binaryHiIsM":84.8,"binaryBounded":36.0,"newton":37.7},{"n":10,"linear":38,"binaryHiIsM":85.7,"binaryBounded":23.9,"newton":33.8}],"readings":["the linear scan becomes viable as n grows, because the answer shrinks — at n = 10 it beats the unbounded binary search","Newton wins for small n and loses for large n, because each step costs n-1 multiplications","the bounded binary search is first or second at every exponent, which is what you want from a default"]},"assertions":["the predicate k^n <= m is monotone in k","the running product never exceeds m times the base","the answer never exceeds 2^ceil(bits(m)/n)","-1 is a proof that no integer root exists","Newton's result must be verified with exact arithmetic"]}
```

<!-- @highlights -->
- Widening to 64 bits stops being a fix: at n = 20 only bases up to 8 are representable.
- With `hi = m` the first probe overflows a 64-bit product from m = 158 at n = 10.
- The repair is to never form the power — multiply with a cutoff at m, which cannot overflow for any n.
- `pow(64, 1.0/3)` is 3.9999999999999996 and truncates to 3, because 1.0/3 is not representable; `cbrt(64)` is exactly 4.
- Every failure of both broken methods is a false negative — they miss roots, never invent them.
- Three regimes: Newton wins at n ≤ 3, the bounded binary search from n = 5, and the linear scan beats an unbounded search by n = 10.

<!-- @edgeCases -->
- m = 0 or 1 — its own nth root for every n, and handled before any bit-length call.
- n = 1 — the answer is m itself, and the loop would still find it but the bound degenerates.
- m = 64, n = 3 — the smallest input where the floating-point shortcut returns -1 instead of 4.
- m = 158 at n = 10 — where the unbounded search's first probe first overflows a 64-bit product.
- No exact root — the common case, at 3,799,423 of the four million tested pairs.
- Very large n with small m — the answer is 1 or 2, and the bit-length bound reduces the search to two probes.
- `__builtin_clzll(0)` — undefined, which is why m ≤ 1 must be excluded first.
- Newton landing on the floor of a non-integer root — why the final exact verification is required.
- A running product that lands exactly on m on the last multiplication — handled by comparing after the loop rather than inside it.
- Computing `mid` as `(lo + hi) / 2` — overflows for large bounds exactly as in Lower Bound.

<!-- @pitfalls -->
- Reaching for a wider integer type. At n = 20 a 64-bit integer holds no power above 8³ — the type is not the problem.
- Computing the full power before comparing. The comparison is decided long before the value is; stopping early removes the overflow entirely.
- Using `pow(m, 1.0/n)` directly. It returns 3.9999999999999996 for the cube root of 64 and truncates to 3.
- Assuming `pow` is inaccurate about roots. It is `1.0/n` that is not representable — `cbrt` gets the same input exactly right.
- Testing only that non-roots are rejected. Both broken methods reject non-roots perfectly and only ever miss real roots.
- Leaving `hi = m`. The iteration count then ignores n entirely — 31 steps to find an answer that cannot exceed 2.
- Skipping Newton's final verification. It converges to the real nth root, which is only an integer when one exists.
- Seeding Newton lazily. The square root container measured that turning it from the fastest approach into the slowest.
- Calling `__builtin_clzll` before excluding zero. It is undefined for a zero argument.
- Using a boolean predicate instead of a three-way comparison. The step needs to distinguish too-small from too-large, and collapsing them doubles the multiplications.

<!-- @doubt -->
### Why isn't a 64-bit integer enough?

<!-- @answer -->
Because the exponent, not the value, is what runs out of room. For squares a 64-bit product covers every base up to 3,037,000,499, which is far beyond anything a 32-bit m can require — so widening genuinely fixed the square root. As n grows that headroom collapses: at n = 5 the largest representable base is 6,208, at n = 10 it is **78**, and at n = 20 it is **8**. Meanwhile the naive `hi = m` puts the first probe at m/2, so at n = 10 any m above **158** overflows on the very first step. Reaching for a wider type postpones the problem by one exponent at a time, which is not a fix but a schedule.

<!-- @doubt -->
### What does "multiply with a cutoff" actually buy?

<!-- @answer -->
It removes the possibility of overflow rather than enlarging the space to overflow into. The search never needs the value of kⁿ — it needs to know whether kⁿ is less than, equal to, or greater than m. So the multiplication can stop the instant the running product passes m, which means the product never exceeds m × base. For 32-bit inputs that is below 2⁶², comfortably inside a 64-bit integer, **for every n**. Measured across every exponent from 1 to 20 and every m from 1 to 200,000 — four million cases — it is 0 wrong, where computing the full power in the same 64-bit type is not. The general form is worth carrying: when a predicate compares a computed quantity against a bound, compute only as far as the comparison needs.

<!-- @doubt -->
### Why does `pow` get the cube root of 64 wrong?

<!-- @answer -->
Because the error is in the exponent, not in `pow`. Writing `pow(m, 1.0/n)` first evaluates `1.0/3`, which as a double is **0.33333333333333331483** — very slightly less than a third. Raising 64 to that slightly-too-small power gives **3.9999999999999996**, and truncating to an integer gives 3. The verification `3³ = 27 ≠ 64` then reports no root at all. The same is true for 125, 216 and 343, which return 4, 5 and 6. The contrast makes the diagnosis exact: `cbrt(64.0)` returns **4** on the nose, because it computes the cube root directly and never forms a reciprocal. If you want to use `pow` here, use it only as a seed — round the result and test candidates within ±2 with exact integer arithmetic, which measured 0 wrong across all four million cases.

<!-- @doubt -->
### How dangerous are these bugs really? The failure rates look tiny.

<!-- @answer -->
The rates are diluted by the denominator, and the failures are the kind that hide. Of the four million pairs tested, only 200,577 have an exact root at all — so an implementation can be badly broken and still answer 95% of inputs correctly by returning -1. Measured against the cases that actually have a root, the naive 64-bit power is wrong on **25 — 0.012%** and the uncorrected `pow` on **61 — 0.030%**. More importantly, every one of those failures is a **false negative**: both methods reject non-roots perfectly and only ever miss real ones. A test suite built around "does it correctly say no" passes both. And the misses are not exotic — the naive power fails on 19⁴ = 130,321, 8⁵ = 32,768 and 10⁵ = 100,000.

<!-- @doubt -->
### Does the upper bound matter as much as it did for the square root?

<!-- @answer -->
More, because the waste now scales with the exponent. With `hi = m` the search takes 31 iterations at m = INT_MAX **regardless of n** — the same 31 steps to find an answer that, for n = 20, cannot exceed 2. Bounding by bit length, `2^ceil(bits(m)/n)`, is an upper bound on the answer and collapses the range: 16 iterations at n = 2, 11 at n = 3, 7 at n = 5, **4 at n = 10** and **2 at n = 20**. Each of those iterations also costs up to n multiplications, so the saving compounds. It is the same lesson as the square root's `min(n, 46341)`, with a larger coefficient: when you search a range you named yourself, naming it carelessly is the one inefficiency array searching cannot produce.

<!-- @doubt -->
### Which approach should I actually use?

<!-- @answer -->
The bounded binary search, unless you know the exponent. Measured with m uniform across the 32-bit range: Newton is fastest at n = 2 and n = 3 (22.6ns and 22.7ns against 73.6 and 53.1), the bounded binary search is fastest from n = 5 (36.0 against Newton's 37.7, and 23.9 against 33.8 at n = 10), and the linear scan — catastrophic at 45 microseconds for n = 2 — is down to 38ns by n = 10 and beats an *unbounded* binary search there. The reason the ordering flips is that each Newton step costs n − 1 multiplications, so its per-step cost rises exactly as the binary search's step count falls. The bounded binary search is never worse than second across the whole range, which is the property you usually want from a default.

<!-- @doubt -->
### Why does Newton need a verification step here?

<!-- @answer -->
Because it converges to the real nth root, and the problem asks for an integer one. On m = 69 with n = 4 the iteration settles at 2, since the true fourth root is about 2.88 — and 2 is a perfectly good floor but not an answer, because 2⁴ = 16 rather than 69. Without the final `cmpPow(x, n, m) == 0` check the function would return 2 and claim 69 is a perfect fourth power. This is a different failure from the floating-point one: Newton's arithmetic is exact throughout, and the gap is between *the floor of the root* and *a root that is an integer*. Any method that computes an approximation — Newton, `pow`, `cbrt` — needs the same closing check, and it costs one evaluation of the predicate you already wrote.
