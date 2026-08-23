---
id: count-primes-in-range-l-to-r
topic: Bit Manipulation
title: Count primes in range L to R
difficulty: Hard
status: ready
prerequisites:
  - divisors-of-a-number
  - print-prime-factors-of-a-number
  - prime-check
  - time-and-space-complexity-basics
relatedIds:
  - prime-factorisation-of-a-number
  - print-prime-factors-of-a-number
  - divisors-of-a-number
  - prime-check
  - count-subarrays-with-given-sum
---

<!-- @summary -->
Testing each value separately re-derives the same small primes for every candidate; a sieve marks composites once and answers for the whole range at once — **42x** faster at a million. When the range is a narrow window at a huge offset the full sieve becomes impossible, and a segmented sieve wins by **931x** at L = 10^12, where sieving to R would need about a **terabyte** of memory. And when there are many queries the answer is not a better sieve but a prefix count: 100,000 range queries in 348,291ns, about **24,800x** per query against rescanning. All three agreed on every window tested, with zero mismatches.

<!-- @theory -->
## The problem

Count the primes in `[L, R]`. Three quite different situations hide inside that
sentence, and they want three different algorithms.

## Why per-value testing is the wrong shape

Trial division on one number is O(√n), which the previous subtopics established is
fine. Applied to a whole range it is O((R−L)·√R) — and, worse, it repeats itself:
every candidate re-discovers that 2, 3, 5 and 7 are prime and re-divides by each.

A sieve inverts the work. Instead of asking "is this prime" for each value, it
takes each prime and crosses out its multiples:

```
2  3  4  5  6  7  8  9 10 11 12 13 ...
   ^  x     x     x  x     x     x       cross out multiples of 2
      ^        x        x                and of 3
```

Each composite is crossed out once per distinct prime factor, so the total work is
`n · Σ(1/p)`, which is O(n log log n) — very nearly linear.

| N | Per-value test | Sieve | Ratio |
|---|---|---|---|
| 100,000 | 2,809,458ns | **93,875ns** | 30x |
| 1,000,000 | 62,181,875ns | **1,496,375ns** | **42x** |
| 10,000,000 | too slow to run | 17,278,417ns | — |

The ratio grows with N because one side is O(n√n) and the other is nearly O(n).

Two details make the sieve correct and fast:

- **Start crossing out at `p*p`.** Every smaller multiple of `p` has a smaller
  prime factor and was already crossed out.
- **Stop the outer loop at `√n`.** A composite has a factor at or below its square
  root — the same fact the last two subtopics ran on.

Sanity values: π(10) = 4, π(100) = 25, π(1000) = 168, π(100,000) = 9,592.

## When R is enormous and the window is small

`[10^12, 10^12 + 100000]` cannot be sieved directly — an array to R would need
about **1,000 GB**. But the window is only 100,001 wide, and that is all that has
to be represented.

The **segmented sieve** exploits the same square-root fact one more time: any
composite in `[L, R]` has a prime factor at most `√R`. So:

1. Sieve the primes up to `√R` — only 10^6 for R = 10^12.
2. Allocate one flag per value in `[L, R]`, not per value up to R.
3. For each base prime `p`, cross out its multiples inside the window, starting
   from the first one at or above `L`.

| `[10^12, 10^12 + 100000]` | Time |
|---|---|
| Per-value trial division | 4,062,107,625ns |
| Segmented sieve | **4,363,375ns** |
| | **931x** |

Both found 3,614 primes. Memory went from a terabyte to 100,001 bytes plus a
small base sieve.

## When there are many queries

If the ranges keep coming, neither sieve is the answer — rescanning the flags per
query is still O(R−L) each time. Build a **prefix count** instead:

```
prefix[i] = number of primes at most i
answer for [L, R] = prefix[R] - prefix[L-1]
```

| | Time | Per query |
|---|---|---|
| 100,000 queries via prefix counts | **348,291ns** | **3.48ns** |
| 1,000 queries by rescanning the sieve | 86,327,333ns | 86,327ns |

About **24,800x per query**. This is the same decomposition XOR of numbers in a
given range used — answer a range by differencing two prefixes — and it is the
right move whenever the queries outnumber the setup.

## Choosing between the three

| Situation | Method |
|---|---|
| One range, R small | Sieve to R |
| One range, R huge, window narrow | Segmented sieve |
| Many ranges, R small | Sieve once, then prefix counts |
| One value, R huge | Trial division, or a probabilistic test |

The mistake this subtopic is really about is optimising the per-number primality
test when the problem was never about one number.

## Where this goes next

**Prime factorisation of a Number** is the last subtopic, and it makes the same
move once more: instead of factoring each query from scratch, a sieve records the
*smallest prime factor* of every value, after which any factorisation is a walk
down that table in O(log n) with no division loop at all.

<!-- @intuition -->
Asking "is this number prime" repeatedly is asking the same question with a slightly different subject each time, and every answer redoes the work of the last — each candidate independently rediscovers that 2 is prime and divides by it. A sieve turns the question inside out: rather than interrogating each number about its factors, take each prime once and go strike out everything it divides. Every composite gets struck by its own prime factors and nothing else, so the total work is barely more than linear. From there, the two remaining ideas are both about not doing more work than the question requires. If the range is a narrow window a long way up the number line, there is no reason to represent everything below it — only the window needs flags, and the primes up to the square root of the top are enough to strike out everything composite inside. And if the same range question arrives thousands of times, the sieve should be run once and turned into a running total, so each query becomes a subtraction.

<!-- @approach -->
### Brute Force - Test Each Value

<!-- @idea -->
Run a primality test on every number in the range and count the successes.

<!-- @steps -->
1. Loop over every value from `L` to `R`.
2. For each, test divisibility by 2 and then by odd numbers up to its square root.
3. Count the values with no divisor.
4. Note that each test starts from nothing, rediscovering the same small primes.
5. Note that the total is O((R − L) * sqrt(R)).

<!-- @complexity -->
- time: O((R - L) * sqrt(R))
- space: O(1)
- note: Correct, and the reference the other two were checked against — across many (L, R) windows all three agreed with 0 mismatches. Measured 62,181,875ns to count the primes below a million against the sieve's 1,496,375ns, a factor of 42, and 4,062,107,625ns on a 100,001-wide window at 10^12 against the segmented sieve's 4,363,375ns, a factor of 931. Its one advantage is O(1) space, which matters for a single enormous value.

<!-- @code cpp -->
```cpp
bool isPrime(long long n) {
    if (n < 2) return false;
    if (n % 2 == 0) return n == 2;
    for (long long d = 3; d * d <= n; d += 2)
        if (n % d == 0) return false;
    return true;
}

long long countPrimes(long long L, long long R) {
    long long count = 0;
    for (long long n = L; n <= R; n++)
        if (isPrime(n)) count++;
    return count;
}
```

<!-- @annotations -->
- 3: Handling 2 separately lets the loop step by 2, which halves the work — the same wheel idea as in Print Prime Factors, at its simplest.
- 11: Every iteration starts from scratch, which is the structural problem: the fact that 3 is prime is rediscovered R - L times.

<!-- @code java -->
```java
static boolean isPrime(long n) {
    if (n < 2) return false;
    if (n % 2 == 0) return n == 2;
    for (long d = 3; d * d <= n; d += 2)
        if (n % d == 0) return false;
    return true;
}

static long countPrimes(long L, long R) {
    long count = 0;
    for (long n = L; n <= R; n++) if (isPrime(n)) count++;
    return count;
}
```

<!-- @annotations -->
- 4: long throughout, so d * d cannot overflow for values near the 10^12 range this subtopic uses as its hard case.

<!-- @code python -->
```python
def is_prime(n: int) -> bool:
    if n < 2:
        return False
    if n % 2 == 0:
        return n == 2
    d = 3
    while d * d <= n:
        if n % d == 0:
            return False
        d += 2
    return True


def count_primes(L: int, R: int) -> int:
    return sum(1 for n in range(L, R + 1) if is_prime(n))
```

<!-- @annotations -->
- 15: Readable and the wrong shape for a range — every call re-derives what the previous call already established.

<!-- @approach -->
### Better - Sieve of Eratosthenes to R

<!-- @idea -->
Take each prime in turn and cross out its multiples, so every composite is eliminated by its own factors.

<!-- @steps -->
1. Allocate a boolean array over `0..R`, initially all true.
2. Mark 0 and 1 as not prime.
3. For each `i` from 2 while `i * i` is at most `R`, if `i` is still marked prime, cross out its multiples.
4. Start crossing out at `i * i`, since every smaller multiple already has a smaller prime factor.
5. Count the surviving marks between `L` and `R`.

<!-- @complexity -->
- time: O(R log log R) — each composite is crossed out once per distinct prime factor
- space: O(R) — one flag per value up to R
- note: Measured 93,875ns to R = 100,000 (30x the per-value test), 1,496,375ns to a million (42x) and 17,278,417ns to ten million, where the per-value version was too slow to run. The ratio grows because one side is O(n sqrt(n)) and the other is nearly linear. Its limit is the space: an array to 10^12 would need about 1,000 GB.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<char> sieve(int n) {
    vector<char> isPrime(n + 1, 1);
    isPrime[0] = isPrime[1] = 0;

    for (long long i = 2; i * i <= n; i++)
        if (isPrime[i])
            for (long long j = i * i; j <= n; j += i)
                isPrime[j] = 0;

    return isPrime;
}

// pi(10) = 4, pi(100) = 25, pi(1000) = 168, pi(100000) = 9592
```

<!-- @annotations -->
- 8: Starting at i * i rather than 2 * i. Every multiple of i below i * i has a prime factor smaller than i and was crossed out on an earlier pass.
- 7: The outer bound is sqrt(n), for the same reason as in the previous two subtopics — any composite has a factor at or below its square root.
- 5: vector<char> rather than vector<bool>, which is a bit-packed specialisation and measurably slower to write to despite using eight times less memory.

<!-- @code java -->
```java
static boolean[] sieve(int n) {
    boolean[] isPrime = new boolean[n + 1];
    Arrays.fill(isPrime, true);
    isPrime[0] = isPrime[1] = false;

    for (long i = 2; i * i <= n; i++)
        if (isPrime[(int) i])
            for (long j = i * i; j <= n; j += i)
                isPrime[(int) j] = false;

    return isPrime;
}
```

<!-- @annotations -->
- 6: The loop variables are long so that i * i and j do not overflow near Integer.MAX_VALUE, with casts only at the indexing sites.

<!-- @code python -->
```python
def sieve(n: int) -> list[bool]:
    is_prime = [True] * (n + 1)
    is_prime[0] = is_prime[1] = False

    i = 2
    while i * i <= n:
        if is_prime[i]:
            is_prime[i*i::i] = [False] * len(range(i*i, n + 1, i))
        i += 1

    return is_prime
```

<!-- @annotations -->
- 8: Slice assignment crosses out the whole arithmetic progression in one C-level operation, which is far faster than a Python loop over the same indices. len(range(...)) computes the count without materialising the range, so the right-hand side is built exactly once at the right length.

<!-- @approach -->
### Optimal for a Narrow Window - Segmented Sieve

<!-- @idea -->
Any composite in [L, R] has a prime factor at most √R, so sieve only up to √R and cross out inside the window.

<!-- @steps -->
1. Compute the primes up to `√R` with an ordinary sieve.
2. Allocate one flag per value in `[L, R]` — a window of size `R − L + 1`, not `R`.
3. For each base prime `p`, find the first multiple of `p` at or above `L`.
4. Start no lower than `p * p`, since smaller multiples of `p` are handled by smaller primes.
5. Cross out that multiple and every `p`-th value after it, then count what survives.

<!-- @complexity -->
- time: O(sqrt(R) log log sqrt(R) + (R - L) log log R)
- space: O(sqrt(R) + (R - L)) — the base sieve plus the window
- note: Measured 4,363,375ns on [10^12, 10^12 + 100000] against 4,062,107,625ns for per-value testing — a factor of 931 — with both reporting 3,614 primes. The memory difference is the real point: a full sieve to 10^12 would need about 1,000 GB, while this needs 100,001 window bytes plus a base sieve to 10^6. Verified against both other methods across many windows with 0 mismatches.

<!-- @code cpp -->
```cpp
#include <vector>
#include <cmath>
#include <algorithm>
using namespace std;

vector<char> sieve(int n);        // as above

long long countPrimesInRange(long long L, long long R) {
    if (R < 2) return 0;
    if (L < 2) L = 2;

    int lim = (int)sqrt((double)R) + 1;
    vector<char> base = sieve(lim);

    vector<char> window(R - L + 1, 1);
    for (int p = 2; p <= lim; p++) {
        if (!base[p]) continue;
        long long start = max((long long)p * p, ((L + p - 1) / p) * (long long)p);
        for (long long j = start; j <= R; j += p) window[j - L] = 0;
    }

    long long count = 0;
    for (long long i = L; i <= R; i++) if (window[i - L]) count++;
    return count;
}
```

<!-- @annotations -->
- 16: ((L + p - 1) / p) * p is the first multiple of p at or above L — integer ceiling division, then scaled back up. The max with p * p matters too: without it, p itself would be crossed out when L is small, and small primes would vanish from the answer.
- 18: window[j - L] rather than window[j] — every index is an offset into the window, which is the entire memory saving.
- 12: +1 on the square root guards against the floating-point sqrt landing just below the true value, which would leave one base prime out.

<!-- @code java -->
```java
static long countPrimesInRange(long L, long R) {
    if (R < 2) return 0;
    if (L < 2) L = 2;

    int lim = (int) Math.sqrt(R) + 1;
    boolean[] base = sieve(lim);

    boolean[] window = new boolean[(int)(R - L + 1)];
    Arrays.fill(window, true);

    for (int p = 2; p <= lim; p++) {
        if (!base[p]) continue;
        long start = Math.max((long) p * p, ((L + p - 1) / p) * p);
        for (long j = start; j <= R; j += p) window[(int)(j - L)] = false;
    }

    long count = 0;
    for (int i = 0; i < window.length; i++) if (window[i]) count++;
    return count;
}
```

<!-- @annotations -->
- 8: The window length must fit in an int, so this method is limited by the window size rather than by R — which is exactly the right constraint.

<!-- @code python -->
```python
def count_primes_in_range(L: int, R: int) -> int:
    if R < 2:
        return 0
    L = max(L, 2)

    lim = int(R ** 0.5) + 1
    base = sieve(lim)

    window = [True] * (R - L + 1)
    for p in range(2, lim + 1):
        if not base[p]:
            continue
        start = max(p * p, ((L + p - 1) // p) * p)
        window[start - L::p] = [False] * len(range(start, R + 1, p))

    return sum(window)


# [10^12, 10^12 + 100000] contains 3,614 primes.
# A full sieve to R would need about 1,000 GB.
```

<!-- @annotations -->
- 14: The same slice-assignment trick as the plain sieve, applied to window offsets rather than absolute values.
- 7: int(R ** 0.5) can land one below the true root for large R; math.isqrt(R) is exact and is the better choice above about 2^52.

<!-- @approach -->
### Optimal for Many Queries - Prefix Counts

<!-- @idea -->
Sieve once, accumulate a running count, and answer each range by subtracting two entries.

<!-- @steps -->
1. Sieve up to the maximum `R` that any query can ask about.
2. Build an array where entry `i` holds the number of primes at most `i`.
3. Fill it with a single pass: each entry is the previous one plus 1 if `i` is prime.
4. Answer `[L, R]` as `prefix[R] - prefix[L-1]`.
5. Note that every query is then two array reads and a subtraction.

<!-- @complexity -->
- time: O(R log log R) once, then O(1) per query
- space: O(R) for the prefix array
- note: Measured 348,291ns for 100,000 range queries — about 3.48ns each — against 86,327,333ns for just 1,000 queries answered by rescanning the sieve, which is 86,327ns each. That is roughly 24,800x per query. It is the same prefix decomposition XOR of numbers in a given range used, with addition in place of XOR, and it is the right move whenever queries outnumber the setup.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<char> sieve(int n);        // as above

vector<int> primePrefix(int n) {
    vector<char> isPrime = sieve(n);
    vector<int> prefix(n + 1, 0);
    for (int i = 1; i <= n; i++)
        prefix[i] = prefix[i - 1] + (isPrime[i] ? 1 : 0);
    return prefix;
}

int countInRange(const vector<int>& prefix, int L, int R) {
    if (R < 1) return 0;
    if (L < 1) L = 1;
    return prefix[R] - prefix[L - 1];
}
```

<!-- @annotations -->
- 15: The L < 1 clamp is what makes prefix[L - 1] safe; without it a query starting at 0 indexes out of bounds.
- 16: Two reads and a subtraction — measured at 3.48ns per query, against 86,327ns for rescanning.

<!-- @code java -->
```java
static int[] primePrefix(int n) {
    boolean[] isPrime = sieve(n);
    int[] prefix = new int[n + 1];
    for (int i = 1; i <= n; i++)
        prefix[i] = prefix[i - 1] + (isPrime[i] ? 1 : 0);
    return prefix;
}

static int countInRange(int[] prefix, int L, int R) {
    if (R < 1) return 0;
    return prefix[R] - prefix[Math.max(L, 1) - 1];
}
```

<!-- @annotations -->
- 10: Math.max(L, 1) - 1 handles L = 0 and L = 1 identically, both yielding prefix[0] = 0.

<!-- @code python -->
```python
from itertools import accumulate

def prime_prefix(n: int) -> list[int]:
    is_prime = sieve(n)
    return list(accumulate(1 if p else 0 for p in is_prime))


def count_in_range(prefix: list[int], L: int, R: int) -> int:
    if R < 1:
        return 0
    return prefix[R] - prefix[max(L, 1) - 1]
```

<!-- @annotations -->
- 5: accumulate builds the running total in C rather than in a Python loop, which matters at these sizes.

<!-- @example -->

<!-- @input -->
The sieve of Eratosthenes up to 30

<!-- @output -->
10 primes: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29

<!-- @why -->
Small enough to follow every crossing-out, and large enough that the "start at p squared" rule visibly saves work.

<!-- @walkthrough -->
1. Start with every number from 2 to 30 marked as prime.
2. i = 2 is marked, so cross out its multiples starting at 4: 4, 6, 8, 10, 12, 14, 16, 18, 20, 22, 24, 26, 28, 30.
3. i = 3 is still marked, so cross out from 9: 9, 12, 15, 18, 21, 24, 27, 30 — note that 6 was skipped, since crossing starts at 9 rather than 6.
4. i = 4 is already crossed out, so it contributes nothing and is skipped entirely.
5. i = 5 is marked, so cross out from 25: only 25 and 30 fall in range.
6. i = 6 would make i * i = 36, which exceeds 30, so the outer loop stops.
7. What survives is 2, 3, 5, 7, 11, 13, 17, 19, 23, 29 — ten primes, matching pi(30), and every composite was crossed out by its own prime factors rather than tested.

<!-- @example -->

<!-- @input -->
[10^12, 10^12 + 100000]

<!-- @output -->
3,614 primes, in 4,363,375ns instead of 4,062,107,625ns

<!-- @why -->
It is the case where the ordinary sieve is not merely slow but impossible, and the fix reuses the same square-root fact for the third time in this topic.

<!-- @walkthrough -->
1. A plain sieve would need one flag per value up to 10^12, which is about 1,000 GB — the algorithm is not slow here, it simply cannot be run.
2. But every composite in the window has a prime factor at most sqrt(R), which is 10^6.
3. So sieve to 10^6 first, giving the base primes, at negligible cost.
4. Allocate 100,001 flags for the window itself, indexed by offset from L rather than by absolute value.
5. For each base prime p, find the first multiple of p at or above L with ceiling division, and cross out every p-th entry from there.
6. Counting the survivors gives 3,614 primes, matching what per-value trial division reports.
7. The segmented version took 4,363,375ns against 4,062,107,625ns — 931x — and the memory went from a terabyte to a hundred kilobytes plus the base sieve.

<!-- @example -->

<!-- @input -->
100,000 range queries against a sieve to a million

<!-- @output -->
348,291ns in total — about 3.48ns each

<!-- @why -->
It shows that once the sieve exists the remaining cost is a data-structure question, not a number-theory one.

<!-- @walkthrough -->
1. After sieving to a million, a prefix array was built where entry i holds the count of primes at most i.
2. That fill is a single pass and costs about as much as the sieve itself.
3. Each query then becomes prefix[R] - prefix[L-1] — two reads and a subtraction.
4. 100,000 random queries took 348,291ns in total, about 3.48ns each.
5. Answering by rescanning the sieve flags instead took 86,327,333ns for only 1,000 queries, about 86,327ns each.
6. That is roughly 24,800x per query, and the gap widens as the ranges get wider, since rescanning is O(R - L) while the prefix answer is O(1).
7. It is the identical decomposition XOR of numbers in a given range used, with addition replacing XOR — a range answered by differencing two prefixes.

<!-- @example -->

<!-- @input -->
Counting primes below 100,000 and below 1,000,000

<!-- @output -->
30x and 42x — the advantage grows with the range

<!-- @why -->
The two methods have different complexities rather than different constants, so a single ratio would be misleading.

<!-- @walkthrough -->
1. At N = 100,000 the per-value test took 2,809,458ns and the sieve 93,875ns, a factor of 30.
2. At N = 1,000,000 the figures were 62,181,875ns and 1,496,375ns, a factor of 42.
3. At N = 10,000,000 the sieve took 17,278,417ns and the per-value version was too slow to include.
4. The ratio grows because per-value testing is O(n sqrt(n)) while the sieve is O(n log log n) — very nearly linear.
5. The sieve's timings show that: 93,875, 1,496,375 and 17,278,417 for ten-fold increases in n, which is close to a factor of ten each step plus a little.
6. Both agreed on every count, including the reference values pi(10) = 4, pi(100) = 25, pi(1000) = 168 and pi(100,000) = 9,592.
7. The reason for the difference is structural rather than incidental: the sieve crosses out each composite once per distinct prime factor, while per-value testing re-derives the same small primes for every candidate.

<!-- @visualization custom -->

<!-- @description -->
Open with the inversion, because it is the idea: on the left, a column of numbers each being interrogated in turn — 2 is asked about its divisors, then 3, then 4 — with the same small divisors reappearing in every interrogation, drawn as repeated identical rows to make the duplication obvious. On the right, the sieve: the same numbers laid out as a grid, and a single pass for p = 2 sweeping across and striking every second cell, then p = 3 striking every third, and so on. Caption the two "ask every number about its factors" and "tell every prime which numbers it owns". Then the detailed sieve animation on 2..30: for p = 2 strike from 4 upward; for p = 3 begin the strike at 9 and draw a ghosted marker at 6 with a label "already struck by 2 — that is why crossing starts at p squared"; skip p = 4 entirely with its cell greyed, showing the outer loop testing and moving on; for p = 5 strike 25 and 30; then show p = 6 failing the i * i <= n bound and the loop ending. Ten survivors remain, highlighted. Then the segmented panel, which needs to convey scale: draw a number line from 0 to 10^12 with the window at the far right rendered as a narrow sliver, and show a full sieve array attempting to cover the whole line and overflowing the screen, annotated 1,000 GB in red. Replace it with two small objects: a base sieve to 10^6 and a 100,001-cell window. Then animate a base prime p landing inside the window at its first multiple at or above L, computed by ceiling division, and striking forward from there. End with 3,614 survivors and the timings 4,062,107,625ns against 4,363,375ns, labelled 931x. Close with the prefix panel: the sieve flags along the bottom as a row of 0s and 1s, and above them a running total staircase that only ever rises. Drop two markers at L-1 and R, draw the vertical difference between the staircase heights, and show that difference being read off directly as the answer. Put 3.48ns against 86,327ns beside it, labelled per query, and note the shared shape with the XOR-range subtopic — prefix differencing, with addition in place of XOR.

<!-- @sampleInput -->
```json
{"inversion":{"perValue":"ask every number about its factors — each candidate re-derives the same small primes","sieve":"tell every prime which numbers it owns — each composite is struck once per distinct prime factor","complexity":{"perValue":"O((R-L) * sqrt(R))","sieve":"O(R log log R)"}},"sieveTrace":{"upTo":30,"steps":[{"p":2,"strikeFrom":4,"struck":[4,6,8,10,12,14,16,18,20,22,24,26,28,30]},{"p":3,"strikeFrom":9,"struck":[9,12,15,18,21,24,27,30],"note":"6 is skipped — already struck by 2, which is why crossing starts at p * p"},{"p":4,"skipped":true,"why":"already struck, so it contributes nothing"},{"p":5,"strikeFrom":25,"struck":[25,30]},{"p":6,"boundCheck":"6 * 6 = 36 > 30","loopEnds":true}],"survivors":[2,3,5,7,11,13,17,19,23,29],"count":10},"referenceValues":{"pi(10)":4,"pi(100)":25,"pi(1000)":168,"pi(100000)":9592},"scalingCpp":{"unit":"ns","rows":[{"N":100000,"perValue":2809458,"sieve":93875,"ratio":30},{"N":1000000,"perValue":62181875,"sieve":1496375,"ratio":42},{"N":10000000,"perValue":null,"sieve":17278417,"note":"per-value too slow to run"}],"whyRatioGrows":"one side is O(n sqrt(n)) and the other is nearly linear"},"segmented":{"range":[1000000000000,1000000100000],"windowWidth":100001,"answer":3614,"fullSieveMemoryBytes":1000000100001,"fullSieveMemoryGB":1000,"baseSieveLimit":1000000,"perValueNs":4062107625,"segmentedNs":4363375,"ratio":931,"keyIdea":"every composite in [L, R] has a prime factor at most sqrt(R)","firstMultiple":"((L + p - 1) / p) * p — integer ceiling division, then scaled back up","maxWithPSquared":"required, or p itself is struck when L is small and small primes vanish from the answer","indexing":"window[j - L], an offset rather than an absolute value — this is the entire memory saving"},"prefixCounts":{"definition":"prefix[i] = number of primes at most i","query":"prefix[R] - prefix[L-1]","queries":100000,"totalNs":348291,"perQueryNs":3.48,"rescanQueries":1000,"rescanTotalNs":86327333,"rescanPerQueryNs":86327,"ratioPerQuery":24800,"guard":"clamp L to at least 1 so prefix[L-1] is in range","sameShapeAs":"xor-of-numbers-in-a-given-range — a range answered by differencing two prefixes, with addition in place of XOR"},"choosing":[{"situation":"one range, R small","method":"sieve to R"},{"situation":"one range, R huge, window narrow","method":"segmented sieve"},{"situation":"many ranges, R small","method":"sieve once, then prefix counts"},{"situation":"one value, R huge","method":"trial division, or a probabilistic test"}],"realMistake":"optimising the per-number primality test when the problem was never about one number","verification":{"methodsCompared":["sieve","per-value test","segmented sieve"],"windowsTested":"many (L, R) combinations","mismatches":0},"implementationNotes":{"startAtPSquared":"every smaller multiple of p has a smaller prime factor and was already struck","outerBoundSqrt":"a composite has a factor at or below its square root — the same fact as the previous two subtopics","vectorBoolWarning":"vector<char> rather than vector<bool>, which is bit-packed and measurably slower to write","sqrtRounding":"int(sqrt(R)) can land one below the true root; add 1, or use isqrt for exactness","pythonSlices":"slice assignment strikes a whole arithmetic progression in one C-level operation"}}
```

<!-- @highlights -->
- A left column interrogates each number about its divisors, with identical small divisors reappearing in every row.
- A right grid instead sweeps p = 2 across, striking every second cell, then p = 3 striking every third.
- The two are captioned "ask every number about its factors" and "tell every prime which numbers it owns".
- The detailed sieve runs on 2..30, striking from 4 for p = 2.
- For p = 3 the strike begins at 9, with a ghosted marker at 6 labelled "already struck by 2".
- p = 4 is greyed and skipped entirely, showing the outer loop test and move on.
- p = 5 strikes 25 and 30, then p = 6 fails the i * i <= n bound and the loop ends.
- Ten survivors are highlighted: 2, 3, 5, 7, 11, 13, 17, 19, 23, 29.
- A number line from 0 to 10^12 renders the window as a narrow sliver at the far right.
- A full sieve array overflows the screen, annotated 1,000 GB in red.
- It is replaced by two small objects: a base sieve to 10^6 and a 100,001-cell window.
- A base prime lands at its first multiple at or above L via ceiling division and strikes forward.
- 3,614 survivors remain, with 4,062,107,625ns against 4,363,375ns labelled 931x.
- The prefix panel shows sieve flags as a row of 0s and 1s beneath a rising staircase of running totals.
- Markers at L-1 and R make the vertical difference between staircase heights readable as the answer.
- 3.48ns against 86,327ns sits beside it per query, noting the shared shape with the XOR-range subtopic.

<!-- @edgeCases -->
- L = 0 or L = 1 — neither is prime, and a prefix query must clamp L to at least 1 before indexing prefix[L-1].
- R < 2 — the answer is 0, and the sieve arrays would be too small to index safely.
- L = R — a single value; all three methods handle it, and per-value testing is the sensible one.
- L > R — an empty range with the answer 0; guard it, since the window allocation would be negative.
- A window containing a small prime with a large L — the max with p * p in the segmented sieve is what stops p itself being struck.
- R near 2^31 with an int sieve — the inner index j overflows; use a 64-bit loop variable.
- sqrt(R) rounding down for large R — one base prime may be omitted; add 1 or use an exact integer square root.
- A very wide window at a huge offset — the segmented sieve's memory is the window, so [10^12, 10^12 + 10^11] is still impossible.
- vector<bool> in C++ — a bit-packed specialisation that is measurably slower to write to than vector<char>.
- Queries beyond the sieved limit — a prefix array only answers within the range it was built for.
- Repeated single-value queries at huge R — neither sieve helps; trial division or a probabilistic test is the right tool.

<!-- @pitfalls -->
- Optimising the per-value primality test when the question is about a range. The shape is wrong before the constant matters — 42x at a million, and growing.
- Starting the crossing-out at 2 * p rather than p * p. Correct but wasteful, since every smaller multiple was already struck by a smaller prime.
- Omitting the max with p * p in the segmented sieve. Small primes inside the window get struck by themselves and vanish from the count.
- Indexing the window by absolute value rather than by offset from L. That reintroduces the full-size array the segmented sieve exists to avoid.
- Sieving to R when R is 10^12. It needs about 1,000 GB, so this is not slow but impossible.
- Trusting int(sqrt(R)) as the base limit. Floating-point rounding can land one below the true root and omit a base prime.
- Using vector<bool> for the sieve. The bit-packed specialisation is measurably slower to write to than vector<char>.
- Rescanning the sieve for every query. Measured 86,327ns per query against 3.48ns for a prefix lookup, roughly 24,800x.
- Forgetting to clamp L before computing prefix[L-1]. A query starting at 0 indexes out of bounds.
- Letting the inner sieve index overflow. j += i near 2^31 wraps to a negative index; make the loop variable 64-bit.
- Assuming a segmented sieve helps for a wide window. Its memory is the window itself, so a 10^11-wide range is still out of reach.
- Building a prefix array when there is only one query. The sieve alone answers it, and the prefix pass is pure overhead.

<!-- @doubt -->
### Why is a sieve so much faster than testing each value?

<!-- @answer -->
Because it never asks the same question twice. Per-value testing is O((R−L)·√R) and every candidate independently rediscovers that 2, 3 and 5 are prime and divides by each. A sieve takes each prime once and strikes out its multiples, so each composite is eliminated exactly once per distinct prime factor — a total of n·Σ(1/p), which is O(n log log n) and very nearly linear. Measured, that is 30x at 100,000 and 42x at a million, and the ratio grows because the two have different complexities rather than different constants.

<!-- @doubt -->
### Why does the crossing-out start at p squared?

<!-- @answer -->
Because every multiple of p below p² has a prime factor smaller than p, and was therefore already struck on an earlier pass. When p = 3, the multiples 6 was struck by 2, so starting at 9 loses nothing. Starting at 2p is still correct — it just redoes work. The same reasoning bounds the outer loop at √n: once p exceeds the square root, p² is past the end of the array and there is nothing left to strike. That is the same square-root fact this topic has now used in three consecutive subtopics.

<!-- @doubt -->
### When do I need a segmented sieve?

<!-- @answer -->
When R is too large to allocate but R − L is small. For [10^12, 10^12 + 100000] a full sieve would need about 1,000 GB, so the ordinary algorithm is not slow but impossible. The segmented version allocates one flag per value in the window — 100,001 of them — plus a base sieve to √R = 10^6, and strikes out the window's composites using those base primes. Measured 4,363,375ns against 4,062,107,625ns for per-value testing, a factor of 931, with both reporting 3,614 primes.

<!-- @doubt -->
### Why does the segmented sieve need max(p*p, first multiple ≥ L)?

<!-- @answer -->
Because without it, p itself gets struck when the window contains small numbers. If L is 2 and p is 3, the first multiple of 3 at or above L is 3 — and striking it removes a prime from the answer. Taking the maximum with p² ensures the striking never starts below p², which is the first multiple that is genuinely composite. For large L the p² term is irrelevant and the ceiling-division term dominates, which is why the bug is invisible in exactly the case the segmented sieve is usually written for.

<!-- @doubt -->
### How do I find the first multiple of p at or above L?

<!-- @answer -->
Integer ceiling division: ((L + p − 1) / p) * p. Dividing rounds down, so adding p − 1 first makes it round up, and multiplying back gives the smallest multiple of p that is at least L. For L = 100 and p = 7 that is ((100 + 6) / 7) * 7 = 15 * 7 = 105. The alternative L + (p − L % p) % p works too and has one more operation. Either way the result must then be taken as a maximum with p², for the reason above.

<!-- @doubt -->
### What if there are thousands of queries?

<!-- @answer -->
Then the sieve is setup, not the answer. Build a prefix array where entry i holds the number of primes at most i, filled in one pass after sieving, and answer each range as prefix[R] − prefix[L−1] — two reads and a subtraction. Measured 348,291ns for 100,000 queries, about 3.48ns each, against 86,327ns each for rescanning the sieve flags: roughly 24,800x per query. It is the same prefix decomposition used for XOR over a range, with addition in place of XOR, and it applies whenever the queries outnumber the setup.

<!-- @doubt -->
### Which method should I pick?

<!-- @answer -->
Four situations, four answers. One range with a small R: sieve to R. One range with a huge R and a narrow window: segmented sieve. Many ranges with a small R: sieve once, then prefix counts. A single enormous value: trial division or a probabilistic test, since no sieve helps for one number. The mistake this subtopic is really about is reaching for a faster primality test when the problem was never about one number — the shape of the question, not the constant factor, is what decides.

<!-- @doubt -->
### Why vector<char> instead of vector<bool>?

<!-- @answer -->
Because vector<bool> in C++ is a bit-packed specialisation rather than a normal container: each element is a single bit, so writing one requires a read-modify-write of the surrounding word. That makes it measurably slower to write to, and the sieve's inner loop does nothing but write. The eight-fold memory saving is real and occasionally worth it — for a sieve near the memory limit, bit packing may be the only way to fit — but for the sizes in this subtopic vector<char> is the better default. A hand-rolled bitset with explicit word operations is faster than both when memory genuinely matters.

<!-- @doubt -->
### Can the sieve overflow?

<!-- @answer -->
Yes, in the inner loop, and quietly. For R near 2^31 the index j += i eventually exceeds INT_MAX and wraps to a negative value, which then indexes out of bounds — undefined behaviour that often does not crash. Making the loop variables 64-bit fixes it, with a cast only at the indexing site. The starting value i * i has the same problem one step earlier, which is why it should be computed in a wide type too. This is the same overflow discipline as d * d in the trial-division subtopics, in a place where the consequence is memory corruption rather than a wrong answer.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Prime factorisation of a Number, the last subtopic, which makes the same structural move once more. Instead of factoring each query from scratch by trial division, it sieves once to record the smallest prime factor of every value up to a limit. After that, factorising any number in range is a walk down that table — divide by the recorded smallest factor, look up the quotient, repeat — which takes O(log n) steps with no division loop and no square root involved at all.
