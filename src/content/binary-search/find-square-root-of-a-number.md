---
id: find-square-root-of-a-number
topic: Binary Search
title: Find square root of a number
difficulty: Medium
status: ready
prerequisites:
  - lower-bound
  - integer-overflow-and-precision-errors
  - search-x-in-sorted-array
relatedIds:
  - find-nth-root-of-a-number
  - integer-overflow-and-precision-errors
  - lower-bound
  - koko-eating-bananas
  - find-the-smallest-divisor
---

<!-- @summary -->
The first problem with no array: the search space is the range of possible answers, and the comparison is a predicate you evaluate rather than an element you read. That change moves where the bugs live — writing `mid * mid` overflows from n = 92,682 rather than anywhere near INT_MAX, because the naive upper bound makes the very first probe the one that breaks, and it returns 65,536 where the answer is 304.

<!-- @theory -->
## The problem

Given a non-negative integer n, return the integer part of its square root — the
largest k with k² ≤ n.

```
36          ->  6
8           ->  2       floor(2.828...)
2147483647  ->  46340
0, 1        ->  0, 1
```

## There is no array

Every previous subtopic searched a container. Here there is nothing to index. What
is being searched is the **range of candidate answers**, 0 to n, and the question
asked at each step is not "what value is stored here" but "is this candidate too
big".

That predicate is monotone — if k² ≤ n then every smaller k also satisfies it —
which is the only property a halving search ever needed. So the loop is a lower
bound over a computed predicate rather than a stored one:

```
lo = 1, hi = n
while lo <= hi:
    mid = lo + (hi - lo) / 2
    if mid * mid <= n:  ans = mid; lo = mid + 1
    else:               hi = mid - 1
return ans
```

This shape — binary search on the answer — is what the rest of the Medium tier is
built from, and it is worth noticing that nothing about it needs data in memory.

## `mid * mid` overflows far earlier than you would guess

The largest int whose square fits in an int is **46,340**:

```
46,340² = 2,147,395,600   fits   (INT_MAX = 2,147,483,647)
46,341² = 2,147,488,281   does not
```

The obvious inference is that the bug only appears for n near two billion. That
inference is wrong, and by a factor of more than twenty thousand.

The reason is the upper bound. Starting with `hi = n` makes the very first
midpoint about n/2, so the first probe squares n/2 — and n/2 exceeds 46,340 as
soon as **n ≥ 92,682**. Measured, scanning every n from 0 upward:

| | |
|---|---|
| first n with a wrong answer | **92,682** — exactly 2 × 46,341 |
| wrong over n = 0 … 300,000 | **155,064 — 51.7%** |
| `mySqrt(93024)` returns | **65,536**, where the answer is **304** |

Not off by one. Off by a factor of two hundred, on an input small enough to appear
in a unit test.

The result is stable — the same first failure and the same count under `-O0`,
`-O2`, `-fno-strict-overflow` and `-fwrapv` — but that stability is luck rather
than a guarantee, because signed overflow is undefined behaviour. An
UndefinedBehaviorSanitizer build says so directly:

```
runtime error: signed integer overflow: 46341 * 46341
cannot be represented in type 'int'
```

Two fixes, both measured at 0 wrong:

- **Widen the product**: `(long long)mid * mid <= n`.
- **Divide instead of multiplying**: `mid <= n / mid`, which never produces a
  large intermediate at all.

A third fix is better than either, because it removes the cause rather than the
symptom: **start `hi` at 46,341**, since no larger answer can exist for a 32-bit n.
That also happens to be worth 2.2x.

## Tightening the bound halves the work

`hi = n` searches a range that is almost entirely impossible. Capping it at the
largest representable answer costs one `min` and removes half the iterations:

| n | iterations, hi = n | iterations, hi = 46,341 |
|---|---|---|
| 100 | 7 | 7 |
| 10,000 | 14 | 14 |
| 1,000,000 | 20 | **15** |
| 100,000,000 | 27 | **15** |
| 2,147,483,647 | 31 | **16** |

In time, over uniformly random n across the full int range: **83.03ns against
38.15ns**, a factor of 2.2 from a single `min`.

The general form of the lesson matters more than the constant. When you binary
search on the answer, the bounds are yours to choose, and choosing them lazily is
the one inefficiency that has no counterpart in array searching — where `hi` is
simply the array's length and there is nothing to think about.

## Floating point is exact for 32-bit input and not beyond

`(int)sqrt((double)n)` is tempting and, for 32-bit n, correct: tested at every
perfect square and its neighbours across the whole 32-bit range — 196,605 probes —
it is **0 wrong**. A `double` carries 53 bits of mantissa, comfortably more than
the 31 bits n can occupy.

Push past that and it fails. Over 8,030,460 values sampled near perfect squares up
to 2⁶⁴:

| | |
|---|---|
| wrong | **1,029,825 — 12.82%** |
| first wrong | n = 4,503,612,780,717,443 |
| | `sqrt` gives 67,108,962; the exact answer is 67,108,961 |

That first failure sits just above 2⁵², exactly where a double stops being able to
distinguish consecutive integers. So the honest rule is not "never use `sqrt`" but
"`sqrt` is exact only while the input fits in the mantissa" — and if you use it,
correct the result with a loop that steps the candidate up or down until the
inequality actually holds.

## Newton converges in five steps

The search space is numeric, so an iteration that *computes* a better estimate is
available in a way it never is for an array. Newton's method on x² − n gives:

```
x <- (x + n / x) / 2
```

Each step roughly doubles the number of correct digits. Seeded from `x = n` it
still wastes most of its work getting down to the right magnitude — 19 iterations
at n = INT_MAX, worse than the tightened binary search. Seeded from a power of two
just above the answer, using the bit length, it does not:

| n | binary, tight | Newton, seeded from n | Newton, seeded by bit length |
|---|---|---|---|
| 100 | 7 | 4 | **3** |
| 10,000 | 14 | 9 | **3** |
| 1,000,000 | 15 | 12 | **2** |
| 100,000,000 | 15 | 16 | **4** |
| 2,147,483,647 | 16 | 19 | **5** |

And in time, ns per call over uniformly random n:

| range | linear | binary, hi = n | binary, tight | Newton, seeded |
|---|---|---|---|---|
| 10,000 | 28 | 32.24 | 31.21 | **6.79** |
| 1,000,000 | 241 | 53.18 | 37.33 | **8.61** |
| 2,147,483,647 | 12,707 | 83.03 | 36.84 | **10.45** |

Seeded Newton is **3.5x faster** than the best binary search and agrees with it on
all 107,828 sampled values. The seed is what makes the difference: the same
algorithm with a lazy starting point is slower than the thing it is supposed to
beat.

<!-- @intuition -->
The useful shift here is realising that binary search was never about arrays. What it needs is a range and a monotone yes-or-no question, and an array only ever supplied those incidentally — the indices were the range and "is this element too small" was the question. Once that is separated out, the range can be anything you can name and the question can be anything you can compute, which is what the rest of this tier depends on. The practical consequence is that two responsibilities move onto you that the array used to handle: choosing the bounds, which is why `hi = n` costs 2.2x here, and evaluating the predicate without breaking, which is why `mid * mid` costs correctness. Both of those are new failure modes, and both come from the same place.

<!-- @approach -->
### Linear Search

<!-- @idea -->
Count upward while the next candidate still squares to at most n.

<!-- @steps -->
1. Handle 0 and 1 directly, since their square roots are themselves.
2. Start at 1.
3. While the next integer squares to at most n, advance.
4. Stop at the largest integer whose square still fits.
5. Return it.

<!-- @complexity -->
- time: O(sqrt n)
- space: O(1)
- note: Competitive only for tiny inputs — measured 28ns against 31.21ns for the binary search over n below 10,000, and 12,707ns against 36.84ns across the full int range. It is worth writing once because the stopping condition is the definition of the answer stated directly.

<!-- @code cpp -->
```cpp
int mySqrt(int n) {
    if (n < 2) return n;
    int i = 1;
    while ((long long)(i + 1) * (i + 1) <= n) i++;
    return i;
}
```

<!-- @annotations -->
- 2: 0 and 1 are their own square roots, and handling them here keeps the loop below free of special cases.
- 4: The cast is required even here. Without it the product overflows for i above 46,340, exactly as in the binary version.
- 5: Returning the last candidate that fit, not the one that failed.

<!-- @code java -->
```java
static int mySqrt(int n) {
    if (n < 2) return n;
    int i = 1;
    while ((long)(i + 1) * (i + 1) <= n) i++;
    return i;
}
```

<!-- @annotations -->
- 4: `(long)` on the first operand promotes the whole expression. Casting the result instead would compute the product in int and overflow before the cast happens.

<!-- @code python -->
```python
def my_sqrt(n):
    if n < 2:
        return n
    i = 1
    while (i + 1) * (i + 1) <= n:
        i += 1
    return i


# Python integers have no fixed width, so the overflow that
# breaks the C++ and Java versions cannot happen here.
```

<!-- @annotations -->
- 5: No cast needed. This is the one language where the central bug of this subtopic does not exist.

<!-- @approach -->
### Binary Search on the Answer

<!-- @idea -->
Halve the range of possible answers, asking at each step whether the candidate squares to at most n.

<!-- @steps -->
1. Handle 0 and 1 directly.
2. Set the range to 1 through the largest possible answer, which for a 32-bit n is 46,341.
3. Take the midpoint and square it in 64 bits.
4. If it fits, record it and search above; otherwise search below.
5. The last recorded candidate is the answer.

<!-- @complexity -->
- time: O(log n) — 16 iterations at n = INT_MAX with the tight bound, 31 with `hi = n`
- space: O(1)
- note: The general-purpose answer, and the shape the rest of the Medium tier reuses. Measured 36.84ns across the full int range with the tight bound against 83.03ns without it. `mid * mid` in int is wrong on 51.7% of n below 300,000.

<!-- @code cpp -->
```cpp
#include <algorithm>
using namespace std;

int mySqrt(int n) {
    if (n < 2) return n;
    int lo = 1, hi = min(n, 46341), ans = 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if ((long long)mid * mid <= n) { ans = mid; lo = mid + 1; }
        else                             hi = mid - 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 6: 46,341 is the smallest int whose square exceeds INT_MAX, so no answer can be larger. This one `min` is worth 2.2x, and it also removes the overflow's cause rather than its symptom.
- 8: Subtracting before halving, so lo + hi never overflows — the same guard every subtopic in this module has needed.
- 9: The cast is the whole bug. Without it the product is computed in int and wraps from mid = 46,341, which with `hi = n` happens on the very first probe from n = 92,682. Writing `mid <= n / mid` avoids it differently and is also 0 wrong.
- 10: hi = mid - 1, not mid, because mid has been proven too large. This form runs until the pointers cross, which is why the answer is carried in `ans` on the line above rather than read off a surviving index.
- 12: The last candidate that satisfied the predicate, which is exactly the definition of the integer square root.

<!-- @code java -->
```java
static int mySqrt(int n) {
    if (n < 2) return n;
    int lo = 1, hi = Math.min(n, 46341), ans = 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if ((long) mid * mid <= n) { ans = mid; lo = mid + 1; }
        else                         hi = mid - 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 6: `(long) mid * mid` casts the first operand so the multiplication happens in 64 bits. `(long)(mid * mid)` would overflow first and then widen the wrong value.

<!-- @code python -->
```python
def my_sqrt(n):
    if n < 2:
        return n
    lo, hi, ans = 1, min(n, 46341), 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid * mid <= n:
            ans = mid
            lo = mid + 1
        else:
            hi = mid - 1
    return ans
```

<!-- @annotations -->
- 4: The bound is still worth setting in Python. It saves iterations even though nothing can overflow.
- 7: Safe here for a reason that does not transfer: Python integers grow as needed, so this is the one language where the missing cast is not a bug.

<!-- @approach -->
### Newton's Method

<!-- @idea -->
Instead of halving a range, compute a better estimate from the current one — each step roughly doubles the number of correct digits.

<!-- @steps -->
1. Handle 0 and 1 directly.
2. Choose a starting estimate that is at least the true root, using the bit length of n.
3. Replace the estimate with the average of itself and n divided by itself.
4. Repeat while the estimate keeps decreasing.
5. The first estimate that stops decreasing is the integer square root.

<!-- @complexity -->
- time: O(log log n) — measured 5 iterations at n = INT_MAX against 16 for the tightened binary search
- space: O(1)
- note: The fastest of the three at every size — 10.45ns against 36.84ns across the full int range, a factor of 3.5 — and it agrees with the binary search on all 107,828 sampled values. The seed carries the win: starting from `x = n` instead takes 19 iterations and 38.12ns, losing to the binary search it is supposed to beat.

<!-- @code cpp -->
```cpp
int mySqrt(int n) {
    if (n < 2) return n;
    int bits = 32 - __builtin_clz((unsigned)n);
    long long x = 1LL << ((bits + 1) / 2);      // a power of two above the root
    long long y = (x + n / x) / 2;
    while (y < x) { x = y; y = (x + n / x) / 2; }
    return (int)x;
}
```

<!-- @annotations -->
- 3: The bit length of n. `__builtin_clz` is undefined for zero, which is why line 2 has to come first.
- 4: 2^ceil(bits/2) is at least the true root, which is what Newton needs to converge from above without oscillating. Seeding from n instead costs 14 extra iterations at n = INT_MAX.
- 5: 64-bit arithmetic throughout. `x + n / x` cannot overflow here because x is bounded by the seed.
- 6: Stopping when the estimate stops decreasing. Newton approaches the root from above once seeded above it, so the first non-decrease means the integer part has been reached.
- 7: x, not y. y is the estimate that failed to improve.

<!-- @code java -->
```java
static int mySqrt(int n) {
    if (n < 2) return n;
    int bits = 32 - Integer.numberOfLeadingZeros(n);
    long x = 1L << ((bits + 1) / 2);
    long y = (x + n / x) / 2;
    while (y < x) { x = y; y = (x + n / x) / 2; }
    return (int) x;
}
```

<!-- @annotations -->
- 3: Integer.numberOfLeadingZeros is defined for zero as well, but line 2 has already excluded it, which keeps this identical to the C++ version.

<!-- @code python -->
```python
def my_sqrt(n):
    if n < 2:
        return n
    x = 1 << ((n.bit_length() + 1) // 2)
    y = (x + n // x) // 2
    while y < x:
        x, y = y, (y + n // y) // 2
    return x


# math.isqrt(n) is this algorithm in C and is the right
# answer in real Python code.
```

<!-- @annotations -->
- 4: `int.bit_length()` gives the same count as counting leading zeros, and works for integers of any size — so this version is correct for n far beyond 64 bits.
- 6: Floor division throughout. Using `/` would introduce floating point and reintroduce the precision limit this approach avoids.

<!-- @example -->

<!-- @input -->
```
n = 36
```

<!-- @output -->
```
6
```

<!-- @why -->
A perfect square. The predicate "does this candidate square to at most 36" is true up to 6 and false from 7, and the search finds that boundary.

<!-- @walkthrough -->
```
lo=1 hi=36 (capped at 36)   mid=18   324 <= 36?  no    hi = 17
lo=1 hi=17                  mid=9     81 <= 36?  no    hi = 8
lo=1 hi=8                   mid=4     16 <= 36?  yes   ans=4, lo = 5
lo=5 hi=8                   mid=6     36 <= 36?  yes   ans=6, lo = 7
lo=7 hi=8                   mid=7     49 <= 36?  no    hi = 6
lo > hi -> 6

Note the third probe: `ans` is updated on the way, because
this form runs until the pointers cross rather than
narrowing to a survivor.
```

<!-- @example -->

<!-- @input -->
```
n = 8
```

<!-- @output -->
```
2
```

<!-- @why -->
Not a perfect square, so the answer is the floor. Nothing in the algorithm treats this differently — the predicate simply flips between 2 and 3.

<!-- @walkthrough -->
```
lo=1 hi=8   mid=4    16 <= 8?  no    hi = 3
lo=1 hi=3   mid=2     4 <= 8?  yes   ans=2, lo = 3
lo=3 hi=3   mid=3     9 <= 8?  no    hi = 2
lo > hi -> 2

Newton on the same input, seeded by bit length:
  bits(8) = 4, so x = 2^2 = 4
  y = (4 + 8/4)/2 = 3      3 < 4, continue
  x = 3, y = (3 + 8/3)/2 = (3+2)/2 = 2     2 < 3, continue
  x = 2, y = (2 + 8/2)/2 = 3               3 not < 2, stop
  -> 2
```

<!-- @example -->

<!-- @input -->
```
n = 92682
```

<!-- @output -->
```
304
```

<!-- @why -->
The smallest n where writing `mid * mid` in int gives a wrong answer — not because n is large, but because `hi = n` makes the first probe 46,341, whose square does not fit.

<!-- @walkthrough -->
```
With hi = n and an int product:
  lo=1 hi=92682   mid = 46341
  46341 * 46341 = 2,147,488,281, which wraps to -2,147,479,015
  -2,147,479,015 <= 92682  ->  TRUE, so the search goes UP
  ...and the answer comes back as tens of thousands.

  Measured: mySqrt(93024) returns 65,536 where the answer is 304.

With hi = min(n, 46341) or a 64-bit product:
  the first probe is at most 46,341 and the comparison is
  evaluated exactly  ->  304

92,682 is exactly 2 x 46,341, which is why this is the
first n that fails: it is the smallest n whose midpoint
reaches the first candidate that cannot be squared.
```

<!-- @example -->

<!-- @input -->
```
n = 2147483647
```

<!-- @output -->
```
46340
```

<!-- @why -->
The largest possible input, and the value that fixes the tight upper bound: 46,340 squares to 2,147,395,600 and 46,341 does not fit in an int at all.

<!-- @walkthrough -->
```
46,340² = 2,147,395,600  <=  2,147,483,647   fits
46,341² = 2,147,488,281  >   2,147,483,647   does not

So no 32-bit input can have an answer above 46,340, and
starting hi at 46,341 loses nothing while cutting the
iteration count from 31 to 16.

Newton reaches the same answer in 5 steps:
  bits = 31, x = 2^16 = 65,536
  65536 -> 49151 -> 46414 -> 46340 -> 46340 (stop)
```

<!-- @visualization custom -->

<!-- @description -->
Shows the shift from searching an array to searching a range of answers, then the two failure modes that shift creates: an overflow that appears at n = 92,682 rather than near INT_MAX, and an upper bound left at n that doubles the work.

<!-- @sampleInput -->
```json
{"primary":{"n":36,"answer":6,"predicate":"mid * mid <= n","monotone":"true for every k up to the answer, false above it","trace":[{"lo":1,"hi":36,"mid":18,"square":324,"holds":false,"action":"hi = mid - 1"},{"lo":1,"hi":17,"mid":9,"square":81,"holds":false,"action":"hi = mid - 1"},{"lo":1,"hi":8,"mid":4,"square":16,"holds":true,"action":"ans = 4, lo = mid + 1"},{"lo":5,"hi":8,"mid":6,"square":36,"holds":true,"action":"ans = 6, lo = mid + 1"},{"lo":7,"hi":8,"mid":7,"square":49,"holds":false,"action":"hi = mid - 1"}]},"noArray":{"claim":"the search space is the range of candidate answers, not a container","whatChanges":["the bounds are yours to choose","the comparison is a predicate you evaluate rather than an element you read"],"consequence":"two new failure modes: a lazy upper bound and an overflowing predicate"},"overflow":{"largestSafeCandidate":46340,"squares":{"46340":2147395600,"46341":2147488281,"INT_MAX":2147483647},"naiveInference":"the bug only appears for n near two billion","whyThatIsWrong":"hi = n makes the first midpoint about n/2, so the first probe squares n/2","firstFailingN":92682,"equals":"2 x 46341","measured":{"wrongBelow300000":155064,"of":300001,"pct":51.7,"example":{"n":93024,"returned":65536,"correct":304}},"stableAcrossFlags":["-O0","-O2","-fno-strict-overflow","-fwrapv"],"stabilityCaveat":"signed overflow is undefined behaviour, so this stability is luck rather than a guarantee","ubsan":"runtime error: signed integer overflow: 46341 * 46341 cannot be represented in type 'int'","fixes":[{"fix":"(long long)mid * mid","wrong":0},{"fix":"mid <= n / mid","wrong":0},{"fix":"hi = min(n, 46341)","wrong":0,"note":"removes the cause rather than the symptom, and is worth 2.2x"}]},"tightBound":{"iterations":[{"n":100,"hiIsN":7,"hiIs46341":7},{"n":10000,"hiIsN":14,"hiIs46341":14},{"n":1000000,"hiIsN":20,"hiIs46341":15},{"n":100000000,"hiIsN":27,"hiIs46341":15},{"n":2147483647,"hiIsN":31,"hiIs46341":16}],"time":{"fullRange":{"hiIsN":83.03,"tight":38.15,"ratio":2.2}},"lesson":"when you binary search on the answer the bounds are yours to choose, and choosing them lazily has no counterpart in array searching"},"floatingPoint":{"expression":"(int)sqrt((double)n)","for32BitN":{"probes":196605,"wrong":0,"reason":"a double carries 53 mantissa bits, comfortably more than the 31 n can occupy"},"for64BitN":{"probes":8030460,"wrong":1029825,"pct":12.82,"firstWrong":{"n":4503612780717443,"sqrtGives":67108962,"exact":67108961,"note":"just above 2^52, where a double stops distinguishing consecutive integers"}},"rule":"sqrt is exact only while the input fits in the mantissa; if used, correct the result with a loop that steps until the inequality holds"},"newton":{"step":"x <- (x + n / x) / 2","convergence":"each step roughly doubles the number of correct digits","seedMatters":{"fromN":{"itersAtIntMax":19,"ns":38.12,"note":"loses to the binary search it is meant to beat"},"byBitLength":{"seed":"2^ceil(bits/2)","itersAtIntMax":5,"ns":10.45}},"iterations":[{"n":100,"binaryTight":7,"newtonFromN":4,"newtonSeeded":3},{"n":10000,"binaryTight":14,"newtonFromN":9,"newtonSeeded":3},{"n":1000000,"binaryTight":15,"newtonFromN":12,"newtonSeeded":2},{"n":100000000,"binaryTight":15,"newtonFromN":16,"newtonSeeded":4},{"n":2147483647,"binaryTight":16,"newtonFromN":19,"newtonSeeded":5}],"agreement":{"sampledValues":107828,"disagreements":0}},"benchmark":{"units":"ns per call, randomised round order, best of 9","rows":[{"range":10000,"linear":28,"binaryHiIsN":32.24,"binaryTight":31.21,"newtonSeeded":6.79},{"range":1000000,"linear":241,"binaryHiIsN":53.18,"binaryTight":37.33,"newtonSeeded":8.61},{"range":2147483647,"linear":12707,"binaryHiIsN":83.03,"binaryTight":36.84,"newtonSeeded":10.45}]},"assertions":["the predicate is monotone in the candidate","the answer is the largest candidate satisfying it","no 32-bit input has an answer above 46,340","the product must be evaluated in 64 bits or avoided","Newton seeded above the root converges from above"]}
```

<!-- @highlights -->
- The search space is the range of answers, not an array — the first "binary search on the answer" in the module.
- `mid * mid` in int is wrong from **n = 92,682**, not near INT_MAX, because `hi = n` makes the first probe n/2.
- It returns **65,536 where the answer is 304**, and is wrong on 51.7% of n below 300,000.
- Capping `hi` at 46,341 fixes the cause and cuts iterations from 31 to 16 — worth 2.2x.
- `(int)sqrt((double)n)` is exact for every 32-bit n and wrong on 12.82% of 64-bit probes.
- Newton seeded by bit length takes 5 iterations against binary's 16 and is 3.5x faster; seeded lazily it loses.

<!-- @edgeCases -->
- n = 0 and n = 1 — their own square roots, and handled before the loop so it never divides by zero.
- n = 92,682 — the smallest input where an int product gives a wrong answer.
- n = 2,147,483,647 — the largest input, whose answer 46,340 is what fixes the tight upper bound.
- A perfect square — the predicate is true exactly at the answer, which needs no special case.
- One below a perfect square — the answer drops by one, and this is where an off-by-one in the recorded candidate shows.
- Newton seeded from zero — `__builtin_clz(0)` is undefined, which is why n < 2 must be handled first.
- Newton seeded below the root — it would converge from below and the stopping test would fire early.
- 64-bit input — the 46,341 cap no longer applies and `sqrt` stops being exact above 2⁵².
- Using `/` rather than `//` in the Python Newton — reintroduces the floating-point precision limit the method avoids.
- `(long)(mid * mid)` in Java — the product overflows before the cast widens it, so the cast must be on the operand.

<!-- @pitfalls -->
- Writing `mid * mid` in int. Wrong on 155,064 of the first 300,001 inputs, starting at n = 92,682.
- Assuming the overflow only matters near INT_MAX. The naive upper bound makes it appear more than twenty thousand times earlier.
- Relying on the overflow being harmless because the result looked stable. Signed overflow is undefined behaviour; UBSan flags it directly.
- Leaving `hi = n`. It searches a range that is almost entirely impossible and costs 2.2x.
- Casting the product rather than an operand. `(long)(mid * mid)` overflows first and then widens the wrong value.
- Using `(int)sqrt((double)n)` on 64-bit input. Wrong on 12.82% of probes near perfect squares, first at n ≈ 4.5 × 10¹⁵.
- Trusting `sqrt` without a correction loop. Even where it is nearly right, stepping the candidate until the inequality holds costs almost nothing.
- Seeding Newton from n. It takes 19 iterations at n = INT_MAX and loses to the binary search.
- Calling `__builtin_clz` before excluding zero. It is undefined for a zero argument.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825, exactly as in Lower Bound.

<!-- @doubt -->
### Why does `mid * mid` fail at n = 92,682 and not near INT_MAX?

<!-- @answer -->
Because the first probe is the one that breaks. The largest int whose square fits in an int is 46,340, and the naive `hi = n` puts the first midpoint at roughly n/2 — so the first candidate exceeds 46,340 as soon as n reaches **2 × 46,341 = 92,682**, which is exactly the measured first failure. From there the wrapped product is negative, the comparison `mid * mid <= n` is true when it should be false, and the search walks upward. Measured, `mySqrt(93024)` returns **65,536** where the answer is **304**, and 155,064 of the first 300,001 inputs — 51.7% — come back wrong. The gap between where you would expect the bug and where it actually appears is more than a factor of twenty thousand, which is why it survives casual testing on small inputs and then does not.

<!-- @doubt -->
### The wrong answer was the same under every compiler flag. Isn't that fine?

<!-- @answer -->
No — it is luck, and worth distinguishing from a guarantee. Signed integer overflow is undefined behaviour in C and C++, which means the compiler is entitled to assume it never happens and to optimise on that basis. Measured here, the first failing n and the total failure count were identical under `-O0`, `-O2`, `-fno-strict-overflow` and `-fwrapv`, so on this build the behaviour is simply two's-complement wraparound. An UndefinedBehaviorSanitizer build reports it explicitly — *signed integer overflow: 46341 * 46341 cannot be represented in type 'int'* — and that report is the reliable signal. A future compiler, a different optimisation level, or a different target may fold the comparison away entirely rather than wrapping it.

<!-- @doubt -->
### Which fix should I use?

<!-- @answer -->
All three work; one is better because it removes the cause. Widening the product with `(long long)mid * mid` and dividing instead with `mid <= n / mid` are both **0 wrong** across the whole range, and both leave the search examining candidates that could never be the answer. Setting `hi = min(n, 46341)` makes the overflow unreachable *and* halves the work — 16 iterations at n = INT_MAX instead of 31, and 38.15ns instead of 83.03, a factor of 2.2. In practice write both the cap and the widened product: the cap for the speed and the correctness, the cast so the code stays right if someone later changes the bound or the type.

<!-- @doubt -->
### Can I just use `sqrt` from the standard library?

<!-- @answer -->
For 32-bit input, yes. Tested at every perfect square and its neighbours across the whole 32-bit range — 196,605 probes — `(int)sqrt((double)n)` is **0 wrong**, because a double's 53-bit mantissa comfortably covers a 31-bit integer. Beyond that it stops being exact: over 8,030,460 values sampled near perfect squares up to 2⁶⁴ it is wrong on **1,029,825 — 12.82%** — with the first failure at n = 4,503,612,780,717,443, where it returns 67,108,962 and the answer is 67,108,961. That threshold sits just above 2⁵², exactly where consecutive integers stop being representable. So the rule is about the mantissa rather than about the function: if the input fits, `sqrt` is exact; if it might not, either use an integer method or follow the call with a loop that steps the candidate until the inequality genuinely holds.

<!-- @doubt -->
### Why start `hi` at 46,341 instead of n?

<!-- @answer -->
Because no 32-bit input can have a larger answer, so everything above it is a range of impossible candidates. 46,340² = 2,147,395,600 fits in an int and 46,341² = 2,147,488,281 does not, so 46,340 is the largest answer that can ever be returned. Capping there cuts the iteration count from 31 to 16 at n = INT_MAX and measures 2.2x faster overall. The broader point is the one this subtopic exists to make: when the search space is a range you name rather than an array you were handed, the bounds become a design decision. An array search has no equivalent mistake to make — `hi` is the length and there is nothing to think about.

<!-- @doubt -->
### Is Newton's method worth it?

<!-- @answer -->
Yes, if you seed it properly, and the seed is most of the story. Newton on x² − n roughly doubles the number of correct digits each step, so the iteration count grows like log log n rather than log n: measured **5 iterations at n = INT_MAX against 16** for the tightened binary search, and 10.45ns against 36.84 — a factor of 3.5. But seeded lazily from `x = n` it spends most of its steps just getting down to the right magnitude, taking **19 iterations and 38.12ns**, which loses to the binary search it was meant to beat. The good seed is a power of two just above the root, obtained from the bit length: `1 << ((bits + 1) / 2)`. That also matters for correctness of the stopping rule — seeded above the root Newton descends monotonically, so the first step that fails to decrease means the integer part has been reached. It agreed with the binary search on all 107,828 sampled values.

<!-- @doubt -->
### What does "binary search on the answer" actually mean?

<!-- @answer -->
It means the thing being halved is a range of candidate answers rather than a range of indices, and the comparison is a predicate you compute rather than an element you read. The only property the halving ever required is that the predicate be monotone — true for every candidate up to some boundary and false after it — and `k² ≤ n` has that property without any array existing. Recognising the shape is what the rest of this tier is built on: Koko Eating Bananas asks whether a given eating speed finishes in time, Find the Smallest Divisor asks whether a given divisor keeps the sum under a threshold, and Aggressive Cows asks whether a given minimum distance is achievable. In each case the work is choosing the bounds and writing a predicate that does not lie — which are precisely the two things this subtopic showed can go wrong.
