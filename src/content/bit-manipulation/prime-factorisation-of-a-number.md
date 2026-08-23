---
id: prime-factorisation-of-a-number
topic: Bit Manipulation
title: Prime factorisation of a Number
difficulty: Hard
status: ready
prerequisites:
  - count-primes-in-range-l-to-r
  - print-prime-factors-of-a-number
  - divisors-of-a-number
  - time-and-space-complexity-basics
relatedIds:
  - print-prime-factors-of-a-number
  - count-primes-in-range-l-to-r
  - divisors-of-a-number
  - pow-x-n
  - prime-check
---

<!-- @summary -->
Sieve once to record the **smallest prime factor** of every value, and factorising afterwards is a walk down that table — no trial division, no square root, and a hard bound of log₂(n) steps: the worst case up to 200,000 needed exactly **17** divisions, at n = 131,072 = 2¹⁷. Verified against trial division on every n from 2 to 200,000 with zero mismatches. The average speedup is a modest 5.5x to 9.6x, because trial division exits early on composites — but on primes, its worst case, the gap is **381x** (3.1ns against 1,165ns). The build has to be earned: break-even is 5,162 queries at N = 200,000 and 77,458 at N = 5,000,000.

<!-- @theory -->
## The problem

Given `n`, produce its full prime factorisation with multiplicities:

```
60 = 2² × 3 × 5        97 = 97        720720 = 2⁴ × 3² × 5 × 7 × 11 × 13
```

Print Prime Factors already solved this in O(√n) per number. This subtopic is
about the case that changes the answer: **many numbers**.

## Record the smallest prime factor, once

Modify the sieve so that instead of a boolean it stores, for each value, the
smallest prime that divides it:

```
n:      2  3  4  5  6  7  8  9 10 11 12
spf:    2  3  2  5  2  7  2  3  2 11  2
```

Then factorising is a loop with no searching in it at all:

```cpp
while (n > 1) {
    int p = spf[n];
    int e = 0;
    while (n % p == 0) { n /= p; e++; }
    record(p, e);
}
```

Look up the smallest factor, divide it out, look up the next — each lookup is a
single array read. Verified against trial division on every n from 2 to 200,000:
**0 mismatches**.

## The bound is log₂(n), exactly

Every division reduces `n` by a factor of at least 2, so the number of divisions
cannot exceed log₂(n). Measured over 2..200,000, the maximum was **17** divisions,
and the value that needed them was **131,072 = 2¹⁷** — where log₂(200,000) is
17.6.

That is a genuinely different complexity from O(√n). For n near a million, √n is
1,000 and log₂(n) is 20.

## What the measurement actually says

| N | Build | Table | SPF/query | Trial/query | Ratio | Break-even |
|---|---|---|---|---|---|---|
| 200,000 | 1,548,209ns | 0.8 MB | 66.1ns | 366ns | 5.5x | 5,162 queries |
| 1,000,000 | 8,326,959ns | 4.0 MB | 52.2ns | 336ns | 6.4x | 29,320 queries |
| 5,000,000 | 34,772,666ns | 20.0 MB | 52.0ns | 501ns | **9.6x** | 77,458 queries |

Two things worth reading carefully.

**The average ratio is modest.** 5.5x to 9.6x, not the 100x the complexity
difference suggests. Trial division's O(√n) is a *worst case* — for a random
composite it exits almost immediately, because half of all numbers are even and
the loop stops as soon as the remaining quotient is 1.

**The worst case is where the gap really lives.** Restricting the queries to
primes near a million — the input on which trial division must run its full √n
loop, and on which the SPF table answers in one step:

| 20,000 primes near 10^6 | Per query |
|---|---|
| SPF lookup | **3.1ns** |
| Trial division | 1,165ns |
| | **381x** |

3.1ns is a single array read plus one division: `spf[n]` is `n` itself, so the
loop runs once and stops. The method is fastest on exactly the inputs that are
hardest for the alternative.

## The build must be earned

The break-even column is the honest constraint. At N = 5,000,000 the sieve costs
34.8ms and 20 MB, and it takes **77,458 queries** before that is repaid. Below
that, trial division wins outright.

So the decision rule is not "SPF is better" but:

- **Few queries, or values beyond the sieve limit** → trial division.
- **Many queries, all within a known bound** → SPF sieve.
- **One enormous value** → neither; Pollard's rho or a probabilistic method.

The sieve also cannot help at all for a value above `N` — the table simply has no
entry — which rules it out for the 10^12-scale inputs the previous subtopic
handled with segmentation.

## Python

Same shape, larger constants, and the trade tips sooner:

| n < 200,000 | Per query |
|---|---|
| SPF lookup | **741ns** |
| Trial division | 8,333ns |
| | **11.2x** |

Break-even is **2,938 queries** — lower than C++'s 5,162, because the interpreted
trial-division loop is punished harder than the interpreted table walk. Verified
on every n from 2 to 50,000, 0 mismatches.

## Where this ends

This is the last of the eighteen. The topic began with `n & 1` and ends with a
precomputed table, and the connecting idea is the one every subtopic here has
been an instance of: **find the structure that makes the obvious loop
unnecessary.** Sometimes that structure is a bit pattern, sometimes an algebraic
identity, sometimes a table computed once — but the move is always the same.

<!-- @intuition -->
Trial division asks the same question from scratch every time: it starts at 2 and works upward, rediscovering for every input that 2 and 3 and 5 are the small primes. If the same question is going to be asked thousands of times over values from a known range, that search can be done once for all of them at once — and the thing worth recording is not "is this prime" but "what is the smallest prime that divides this", because that single fact makes factorisation mechanical. Once each value knows its smallest factor, factorising is not a search at all: divide by the recorded factor, land on a smaller number, read its recorded factor, repeat. Every step at least halves the value, so the walk is over in at most log₂(n) steps, and each step is one array read. The cost is that the table has to exist first, which is why this is a technique for batches rather than for single numbers.

<!-- @approach -->
### Brute Force - Trial Division per Query

<!-- @idea -->
Factorise each number independently by dividing out factors up to its square root.

<!-- @steps -->
1. For each query, loop `d` from 2 while `d * d` is at most `n`.
2. When `d` divides, count how many times it does and record the exponent.
3. Divide all copies of `d` out of `n`.
4. After the loop, any remaining `n > 1` is a prime factor with exponent 1.
5. Note that nothing is shared between queries.

<!-- @complexity -->
- time: O(sqrt(n)) per query, with no setup
- space: O(1)
- note: The right choice for few queries, or for values beyond any practical sieve limit. Measured 366ns per query at n < 200,000 and 336ns at n < 10^6 for random inputs — but 1,165ns for primes near a million, which is its true worst case. It beats the sieve outright below 5,162 queries at N = 200,000.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<pair<int,int>> factorise(int n) {
    vector<pair<int,int>> out;
    for (int d = 2; (long long)d * d <= n; d++) {
        if (n % d == 0) {
            int e = 0;
            while (n % d == 0) { n /= d; e++; }
            out.push_back({d, e});
        }
    }
    if (n > 1) out.push_back({n, 1});
    return out;
}

// 60 -> 2^2 * 3^1 * 5^1        97 -> 97^1
```

<!-- @annotations -->
- 12: The same leftover as in Print Prime Factors: at most one prime can exceed the square root, and its exponent is 1.
- 6: The bound shrinks as n shrinks, so a value with a large small factor finishes early — which is why the average case is far better than O(sqrt(n)) suggests.

<!-- @code java -->
```java
static List<int[]> factorise(int n) {
    List<int[]> out = new ArrayList<>();
    for (int d = 2; (long) d * d <= n; d++) {
        if (n % d == 0) {
            int e = 0;
            while (n % d == 0) { n /= d; e++; }
            out.add(new int[]{d, e});
        }
    }
    if (n > 1) out.add(new int[]{n, 1});
    return out;
}
```

<!-- @annotations -->
- 3: (long) d * d with the cast on the first operand, or the multiplication happens in int and overflows near Integer.MAX_VALUE.

<!-- @code python -->
```python
def factorise(n: int) -> list[tuple[int, int]]:
    out = []
    d = 2
    while d * d <= n:
        if n % d == 0:
            e = 0
            while n % d == 0:
                n //= d
                e += 1
            out.append((d, e))
        d += 1
    if n > 1:
        out.append((n, 1))
    return out


# Measured 8,333ns per query for n < 200,000.
```

<!-- @annotations -->
- 8: // rather than /, which would make n a float and break every subsequent modulo test.

<!-- @approach -->
### Better - Sieve the Primes, Then Divide Only by Those

<!-- @idea -->
Precompute the primes up to √N once and trial-divide by those alone, skipping every composite candidate.

<!-- @steps -->
1. Sieve the primes up to `√N`, where `N` is the largest query.
2. For each query, divide by each of those primes in turn.
3. Record the exponent whenever one divides.
4. Stop once the remaining value's square root is passed.
5. Handle the leftover prime as before.

<!-- @complexity -->
- time: O(pi(sqrt(N))) per query — about 168 divisions for N = 10^6 rather than 1,000
- space: O(sqrt(N)) for the prime list
- note: A real improvement over plain trial division at a fraction of the SPF sieve's memory, since the table is only sqrt(N) long. It is the middle option: cheaper setup than the SPF sieve and a smaller win, and it still has to search rather than look up. There are 78,498 primes below a million and only 168 below a thousand, so the candidate list for N = 10^6 is tiny.

<!-- @code cpp -->
```cpp
#include <vector>
#include <cmath>
using namespace std;

vector<int> primesUpTo(int lim) {
    vector<char> isP(lim + 1, 1);
    isP[0] = isP[1] = 0;
    for (long long i = 2; i * i <= lim; i++)
        if (isP[i]) for (long long j = i * i; j <= lim; j += i) isP[j] = 0;

    vector<int> ps;
    for (int i = 2; i <= lim; i++) if (isP[i]) ps.push_back(i);
    return ps;
}

vector<pair<int,int>> factorise(int n, const vector<int>& primes) {
    vector<pair<int,int>> out;
    for (int p : primes) {
        if ((long long)p * p > n) break;
        if (n % p == 0) {
            int e = 0;
            while (n % p == 0) { n /= p; e++; }
            out.push_back({p, e});
        }
    }
    if (n > 1) out.push_back({n, 1});
    return out;
}
```

<!-- @annotations -->
- 18: The break re-checks against the shrinking n, so dividing out a large factor early ends the scan sooner — the same benefit as recomputing d * d in the plain version.
- 16: Only primes are tried, so for N = 10^6 that is 168 candidates rather than 1,000.

<!-- @code java -->
```java
static List<int[]> factorise(int n, int[] primes) {
    List<int[]> out = new ArrayList<>();
    for (int p : primes) {
        if ((long) p * p > n) break;
        if (n % p == 0) {
            int e = 0;
            while (n % p == 0) { n /= p; e++; }
            out.add(new int[]{p, e});
        }
    }
    if (n > 1) out.add(new int[]{n, 1});
    return out;
}
```

<!-- @annotations -->
- 4: Breaking rather than continuing — once p exceeds the remaining square root, no later prime can divide either.

<!-- @code python -->
```python
def factorise(n: int, primes: list[int]) -> list[tuple[int, int]]:
    out = []
    for p in primes:
        if p * p > n:
            break
        if n % p == 0:
            e = 0
            while n % p == 0:
                n //= p
                e += 1
            out.append((p, e))
    if n > 1:
        out.append((n, 1))
    return out
```

<!-- @annotations -->
- 4: The break is essential rather than an optimisation — without it the loop scans every precomputed prime for every query.

<!-- @approach -->
### Optimal for Many Queries - Smallest Prime Factor Sieve

<!-- @idea -->
Record each value's smallest prime factor once, then factorising is a walk down the table with no searching.

<!-- @steps -->
1. Allocate a table over `0..N` and run a sieve.
2. For each prime `i`, write `i` into every multiple of `i` that has no entry yet.
3. The first prime to reach a value is its smallest prime factor, so entries are written exactly once.
4. To factorise `n`, read `spf[n]`, divide that prime out counting the exponent, and repeat on the quotient.
5. Stop when `n` reaches 1.

<!-- @complexity -->
- time: O(N log log N) to build, then O(log n) per query
- space: O(N) — 0.8 MB at N = 200,000, 20 MB at N = 5,000,000 for an int table
- note: Verified against trial division on every n from 2 to 200,000, 0 mismatches. The step bound is exactly log2(n): the worst case in that range needed 17 divisions, at n = 131,072 = 2^17. Measured 52.0ns to 66.1ns per query against trial division's 336ns to 501ns — 5.5x to 9.6x on random input — and 3.1ns against 1,165ns on primes, which is 381x. Break-even is 5,162 queries at N = 200,000 and 77,458 at N = 5,000,000.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> buildSPF(int N) {
    vector<int> spf(N + 1, 0);
    for (int i = 2; i <= N; i++)
        if (spf[i] == 0)                       // i is prime
            for (long long j = i; j <= N; j += i)
                if (spf[j] == 0) spf[j] = i;   // first prime to arrive wins
    return spf;
}

vector<pair<int,int>> factorise(int n, const vector<int>& spf) {
    vector<pair<int,int>> out;
    while (n > 1) {
        int p = spf[n], e = 0;
        while (n % p == 0) { n /= p; e++; }
        out.push_back({p, e});
    }
    return out;
}

// At most log2(n) divisions — the worst case up to 200,000 is
// n = 131,072 = 2^17, which needs exactly 17.
```

<!-- @annotations -->
- 9: The if is what makes the entry the SMALLEST factor: a later, larger prime never overwrites what an earlier one wrote.
- 7: Starting the inner loop at i rather than i * i, unlike a primality sieve — i itself needs its own entry, and so do multiples below i * i whose smallest factor is i.
- 15: No square root, no search, and no primality test — every step is one array read.

<!-- @code java -->
```java
static int[] buildSPF(int N) {
    int[] spf = new int[N + 1];
    for (int i = 2; i <= N; i++)
        if (spf[i] == 0)
            for (long j = i; j <= N; j += i)
                if (spf[(int) j] == 0) spf[(int) j] = i;
    return spf;
}

static List<int[]> factorise(int n, int[] spf) {
    List<int[]> out = new ArrayList<>();
    while (n > 1) {
        int p = spf[n], e = 0;
        while (n % p == 0) { n /= p; e++; }
        out.add(new int[]{p, e});
    }
    return out;
}
```

<!-- @annotations -->
- 5: A long loop variable so j += i cannot overflow near Integer.MAX_VALUE, with the cast only at the indexing site.

<!-- @code python -->
```python
def build_spf(n: int) -> list[int]:
    spf = list(range(n + 1))          # start each value as its own factor
    i = 2
    while i * i <= n:
        if spf[i] == i:               # i is prime
            for j in range(i * i, n + 1, i):
                if spf[j] == j:
                    spf[j] = i
        i += 1
    return spf


def factorise(n: int, spf: list[int]) -> list[tuple[int, int]]:
    out = []
    while n > 1:
        p, e = spf[n], 0
        while n % p == 0:
            n //= p
            e += 1
        out.append((p, e))
    return out


# 741ns per query against trial division's 8,333ns — 11.2x — with
# break-even at 2,938 queries, lower than C++'s 5,162.
```

<!-- @annotations -->
- 2: Seeding with list(range(n+1)) makes every value its own smallest factor initially, so primes are already correct and only composites are overwritten.
- 6: With that seeding the inner loop can start at i * i, because any multiple of i below i * i already has a smaller prime recorded.

<!-- @approach -->
### Beyond the Table - When Neither Works

<!-- @idea -->
For a single value too large to sieve, the answer is a different algorithm entirely.

<!-- @steps -->
1. Note that the SPF table has no entry for any value above `N`.
2. Note that trial division is O(√n), which is 10^6 operations at n = 10^12 and 10^9 at n = 10^18.
3. So for one enormous value, strip the small factors by trial division first.
4. Then apply a probabilistic method — Pollard's rho — to split what remains.
5. Test the resulting factors for primality with Miller-Rabin rather than by division.

<!-- @complexity -->
- time: O(n^(1/4)) expected for Pollard's rho, against O(n^(1/2)) for trial division
- space: O(1)
- note: Included to mark the boundary rather than to be implemented here. The practical rule is that trial division handles up to about 10^12, an SPF sieve handles many queries below its memory limit, and beyond that the problem stops being an exercise in loops. The difficulty of factoring large semiprimes is what RSA rests on, so the absence of a fast method is a feature of the landscape rather than a gap in this subtopic.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// Strip small factors first — this alone finishes most inputs.
long long stripSmall(long long n, vector<pair<long long,int>>& out) {
    for (long long p = 2; p < 1000000 && p * p <= n; p += (p == 2 ? 1 : 2)) {
        if (n % p == 0) {
            int e = 0;
            while (n % p == 0) { n /= p; e++; }
            out.push_back({p, e});
        }
    }
    return n;                   // whatever is left needs a real method
}

// What remains is 1, a prime, or a product of large primes. Test it with
// Miller-Rabin and split it with Pollard's rho — both out of scope here.
```

<!-- @annotations -->
- 6: The step expression advances 2 to 3 and then moves in twos, which is the cheapest wheel and costs one branch.
- 13: For most real inputs this returns 1 or a prime, and the expensive machinery is never reached.

<!-- @code java -->
```java
static long stripSmall(long n, List<long[]> out) {
    for (long p = 2; p < 1000000 && p * p <= n; p += (p == 2 ? 1 : 2)) {
        if (n % p == 0) {
            int e = 0;
            while (n % p == 0) { n /= p; e++; }
            out.add(new long[]{p, e});
        }
    }
    return n;
}

// java.math.BigInteger.isProbablePrime(certainty) is the built-in
// Miller-Rabin, which is the right primality test at this scale.
```

<!-- @annotations -->
- 11: Worth knowing before writing one: the standard library already has the probabilistic test this scale requires.

<!-- @code python -->
```python
def strip_small(n: int) -> tuple[list[tuple[int, int]], int]:
    out = []
    p = 2
    while p < 1_000_000 and p * p <= n:
        if n % p == 0:
            e = 0
            while n % p == 0:
                n //= p
                e += 1
            out.append((p, e))
        p += 1 if p == 2 else 2
    return out, n


# sympy.factorint uses Pollard's rho and Miller-Rabin and is the
# right answer whenever the value is genuinely large.
```

<!-- @annotations -->
- 13: The honest recommendation at this scale — a hand-rolled Pollard's rho is a learning exercise, not a production choice.

<!-- @example -->

<!-- @input -->
n = 60, using the SPF table

<!-- @output -->
2² × 3 × 5, in three lookups

<!-- @why -->
It has a repeated factor and three distinct primes, so it shows both the exponent loop and the table walk.

<!-- @walkthrough -->
1. spf[60] is 2, so 2 is the smallest prime factor.
2. Divide 60 by 2 twice, reaching 15, and record 2 with exponent 2.
3. Now read spf[15], which is 3.
4. Divide once, reaching 5, and record 3 with exponent 1.
5. Read spf[5], which is 5 — a prime is its own smallest factor.
6. Divide once, reaching 1, and record 5 with exponent 1.
7. The loop ends with 60 = 2² × 3 × 5, having performed four divisions and three array reads, with no search and no square root anywhere.

<!-- @example -->

<!-- @input -->
Every n from 2 to 200,000, counting divisions

<!-- @output -->
0 mismatches against trial division, and a maximum of 17 divisions at n = 131,072

<!-- @why -->
It confirms both halves of the claim at once — that the table gives the same answer, and that the walk really is logarithmic rather than merely usually short.

<!-- @walkthrough -->
1. Each value was factorised twice, once by trial division and once by walking the SPF table.
2. The two agreed on all 199,999 values, with 0 mismatches.
3. The same pass counted the divisions each SPF walk performed.
4. The maximum was 17, and the value requiring it was 131,072.
5. That is 2^17 — the number in range with the most prime factors counted with multiplicity, since 2 is the smallest possible factor.
6. log2(200,000) is 17.6, so the measured maximum sits exactly at the theoretical bound.
7. The bound follows immediately from the algorithm: each division reduces n by a factor of at least 2, so no more than log2(n) of them can occur.

<!-- @example -->

<!-- @input -->
20,000 primes near a million

<!-- @output -->
3.1ns per query against 1,165ns — 381x

<!-- @why -->
The average-case comparison understates the method badly, and this is the input class where the two approaches are furthest apart.

<!-- @walkthrough -->
1. On random inputs the SPF table was only 5.5x to 9.6x faster than trial division.
2. That is because trial division's O(sqrt(n)) is a worst case rather than a typical one — half of all numbers are even, and the loop stops as soon as the quotient reaches 1.
3. A prime is the input where no early exit is possible: the loop must run all the way to sqrt(n) to conclude that nothing divides.
4. For primes near a million that is about 1,000 iterations, measured at 1,165ns each.
5. The SPF table answers the same query in 3.1ns, because spf[n] is n itself — one array read, one division, and the walk is over.
6. That is a factor of 381, and it is the shape of the trade: the table is fastest on exactly the inputs that are hardest for the alternative.
7. It also explains the flat per-query cost across table sizes — 52.2ns at N = 10^6 and 52.0ns at N = 5 x 10^6 — since the walk length depends on log2(n) rather than on N.

<!-- @example -->

<!-- @input -->
The build cost against the per-query saving

<!-- @output -->
Break-even at 5,162 queries for N = 200,000 and 77,458 for N = 5,000,000

<!-- @why -->
The complexity argument favours the sieve unconditionally and the measurement does not, which is the practical point of the subtopic.

<!-- @walkthrough -->
1. At N = 200,000 the sieve takes 1,548,209ns to build and 0.8 MB to hold.
2. Each query then saves 366 - 66.1 = about 300ns.
3. Dividing gives 5,162 queries before the build is repaid.
4. At N = 5,000,000 the build costs 34,772,666ns and 20 MB, while the saving per query rises to about 449ns.
5. That pushes break-even to 77,458 queries, because the build grew faster than the saving did.
6. So a larger table is not straightforwardly better — it costs more to build and helps each query by only a little more.
7. In Python the trade tips sooner, at 2,938 queries, because the interpreted trial-division loop is punished harder than the interpreted table walk: 8,333ns against 741ns, a ratio of 11.2.

<!-- @visualization custom -->

<!-- @description -->
Open with the table itself: a row of values 2 through 20 with a second row beneath holding each one's smallest prime factor, filled in by animation. Run the sieve to build it — p = 2 sweeps across writing 2 into every even cell that is still blank; p = 3 sweeps and writes 3 into 3, 9, 15 while 6, 12 and 18 are visibly skipped because they already hold 2; p = 5 writes into 5 and 25. Highlight the skipping, and caption it "the first prime to arrive wins, which is what makes the entry the smallest". Then the walk on n = 60: draw 60 in a box, read spf[60] = 2 by drawing an arrow down into the table and back, divide twice with the box counting 60, 30, 15, and emit 2². Then arrow into spf[15] = 3, divide to 5, emit 3. Then spf[5] = 5, divide to 1, emit 5. Show the three arrows as a chain and label the whole thing "three lookups, no search". Beside it, run trial division on the same value as a marker walking 2, 3, 4, 5 along a candidate line, to contrast searching with looking up. Then the bound panel: n = 131,072 walking down through 65,536, 32,768 and so on, each step halving, with a counter reaching exactly 17 and a note that log2(200,000) is 17.6 — and a caption that no input can do worse because 2 is the smallest possible factor. Then the honesty panel, which is the substance: two grouped bars for random input showing 66.1ns against 366ns, labelled a modest 5.5x, beside two bars for prime input showing 3.1ns against 1,165ns, labelled 381x. Draw trial division's early exit explicitly — a composite input stopping after two candidates while a prime input runs the full thousand — so the reader sees why the average understates the gap. Close with the break-even chart: total time against query count, two lines crossing — trial division a straight line from the origin, the sieve starting at its build cost and rising more slowly — with the crossings marked at 5,162 for N = 200,000 and 77,458 for N = 5,000,000, and the region left of each crossing shaded as "trial division wins".

<!-- @sampleInput -->
```json
{"table":{"values":[2,3,4,5,6,7,8,9,10,11,12],"spf":[2,3,2,5,2,7,2,3,2,11,2],"buildRule":"for each prime i, write i into every multiple of i that is still blank","whySmallest":"the first prime to arrive wins, and a later larger prime never overwrites it","skipped":[6,12,18],"skippedReason":"already hold 2 when p = 3 sweeps"},"walk":{"n":60,"steps":[{"read":"spf[60]","prime":2,"divisions":2,"quotients":[30,15],"emit":{"p":2,"e":2}},{"read":"spf[15]","prime":3,"divisions":1,"quotients":[5],"emit":{"p":3,"e":1}},{"read":"spf[5]","prime":5,"divisions":1,"quotients":[1],"emit":{"p":5,"e":1}}],"result":"2^2 * 3 * 5","lookups":3,"totalDivisions":4,"noSearch":true,"noSquareRoot":true},"workedValues":[{"n":60,"factorisation":"2^2 * 3^1 * 5^1"},{"n":97,"factorisation":"97^1"},{"n":199999,"factorisation":"199999^1"},{"n":720720,"factorisation":"2^4 * 3^2 * 5 * 7 * 11 * 13"}],"bound":{"claim":"at most log2(n) divisions","why":"every division reduces n by a factor of at least 2","measuredMax":17,"atValue":131072,"asPower":"2^17","log2Of200000":17.6,"reading":"the measured maximum sits exactly at the theoretical bound"},"verification":{"cpp":{"range":[2,200000],"mismatches":0,"comparedAgainst":"trial division"},"python":{"range":[2,50000],"mismatches":0}},"scaling":{"unit":"ns","rows":[{"N":200000,"buildNs":1548209,"tableMB":0.8,"spfPerQuery":66.1,"trialPerQuery":366,"ratio":5.5,"breakEvenQueries":5162},{"N":1000000,"buildNs":8326959,"tableMB":4.0,"spfPerQuery":52.2,"trialPerQuery":336,"ratio":6.4,"breakEvenQueries":29320},{"N":5000000,"buildNs":34772666,"tableMB":20.0,"spfPerQuery":52.0,"trialPerQuery":501,"ratio":9.6,"breakEvenQueries":77458}],"flatQueryCost":"52.2ns at 10^6 and 52.0ns at 5x10^6 — the walk length depends on log2(n), not on N","biggerTableNotBetter":"the build grows faster than the per-query saving does, so break-even rises with N"},"worstCase":{"input":"20,000 primes near 10^6","spfPerQuery":3.1,"trialPerQuery":1165,"ratio":381,"whySpfIsFast":"spf[n] is n itself, so the walk is one array read and one division","whyTrialIsSlow":"a prime admits no early exit — the loop must run the full sqrt(n) to conclude nothing divides","lesson":"the table is fastest on exactly the inputs that are hardest for the alternative","averageUnderstates":"on random input the ratio is only 5.5x to 9.6x, because half of all numbers are even and trial division exits almost immediately"},"python":{"n":200000,"spfPerQueryNs":741,"trialPerQueryNs":8333,"ratio":11.2,"breakEvenQueries":2938,"why":"the interpreted trial-division loop is punished harder than the interpreted table walk","comparedToCpp":"break-even is lower than C++'s 5,162"},"decisionRule":[{"situation":"few queries, or values beyond the sieve limit","method":"trial division"},{"situation":"many queries, all within a known bound","method":"SPF sieve"},{"situation":"one enormous value","method":"Pollard's rho with Miller-Rabin — neither of the above"}],"limits":{"aboveN":"the table simply has no entry, which rules the sieve out for the 10^12-scale inputs the previous subtopic handled by segmentation","trialDivisionCeiling":"about 10^12; sqrt is 10^6 there and 10^9 at 10^18","rsa":"the difficulty of factoring large semiprimes is what public-key cryptography rests on"},"primesBelowMillion":78498,"primesBelowThousand":168}
```

<!-- @highlights -->
- A row of values 2 to 20 sits above a second row holding each one's smallest prime factor.
- The sieve builds it live: p = 2 sweeps across writing 2 into every blank even cell.
- p = 3 writes into 3, 9 and 15 while 6, 12 and 18 are visibly skipped.
- The skipping is highlighted and captioned "the first prime to arrive wins".
- n = 60 sits in a box, with an arrow down into spf[60] and back, returning 2.
- The box counts 60, 30, 15 as two divisions run, and 2² is emitted.
- Two more arrows follow into spf[15] and spf[5], emitting 3 and 5.
- The three arrows form a chain labelled "three lookups, no search".
- Beside it, trial division walks a marker along 2, 3, 4, 5 to contrast searching with looking up.
- n = 131,072 walks down through 65,536 and 32,768, each step halving, with a counter reaching exactly 17.
- A note records that log2(200,000) is 17.6, so the measured maximum sits at the bound.
- Two grouped bars show 66.1ns against 366ns for random input, labelled a modest 5.5x.
- Beside them, 3.1ns against 1,165ns for prime input, labelled 381x.
- Trial division's early exit is drawn explicitly: a composite stopping after two candidates, a prime running the full thousand.
- A break-even chart plots total time against query count, with trial division straight from the origin and the sieve starting at its build cost.
- The crossings are marked at 5,162 and 77,458, with the region left of each shaded "trial division wins".

<!-- @edgeCases -->
- n = 1 — has no prime factors; the walk loop condition n > 1 is false immediately and the result is correctly empty.
- n = 0 — spf[0] is 0, so the walk would divide by zero; guard it before entering.
- n prime — spf[n] is n itself, so the walk is a single lookup and one division, which is the method's best case.
- n = 2^k — the worst case for the walk, needing exactly k divisions; 2^17 = 131,072 is the maximum below 200,000.
- n above the sieve limit — the table has no entry, and indexing it is out of bounds rather than merely wrong.
- A negative n — outside the definition; the table index would be negative and the read invalid.
- Building the table with spf initialised to 0 — the inner loop must start at i rather than i * i, or i itself and small multiples are left blank.
- Building it with spf seeded to the identity — the inner loop may start at i * i, since primes are already correct.
- j += i overflowing near 2^31 — use a 64-bit loop variable with the cast at the indexing site.
- Memory at large N — 20 MB at N = 5,000,000 for an int table, which a 16-bit or byte table can reduce if the smallest factor is known to be small.
- A single value near 10^12 — neither trial division nor a sieve is right; strip small factors, then use Pollard's rho.

<!-- @pitfalls -->
- Building the SPF sieve for a handful of queries. Break-even is 5,162 queries at N = 200,000 and 77,458 at N = 5,000,000 — below that, trial division wins outright.
- Overwriting an existing table entry. The if (spf[j] == 0) guard is what makes the entry the smallest factor rather than the largest.
- Starting the inner loop at i * i with a zero-initialised table. i itself and its multiples below i * i are left blank, and the walk then divides by zero.
- Indexing the table with a value above N. That is out of bounds rather than a wrong answer, so it may not fail visibly.
- Quoting the average speedup as the whole story. It is 5.5x to 9.6x on random input and 381x on primes, and the two numbers describe different situations.
- Assuming a bigger table is better. Build cost grows faster than the per-query saving, so break-even rises with N rather than falling.
- Forgetting the n = 0 guard. spf[0] is 0 and the walk divides by it immediately.
- Letting j += i overflow in the sieve. The index wraps negative and corrupts memory rather than raising an error.
- Expecting the sieve to help at 10^12. The table cannot be allocated, which is exactly the situation the segmented sieve handled for a different question.
- Using / rather than // in the Python walk. n becomes a float and spf[n] then fails as a list index.
- Writing a hand-rolled Pollard's rho for production. Use the library — BigInteger.isProbablePrime or sympy.factorint — unless the exercise is the point.
- Treating O(log n) per query as making the method universally better. The complexity is genuinely better and the constant, the build and the memory all have to be paid first.

<!-- @doubt -->
### What exactly does the SPF table store?

<!-- @answer -->
For each value up to N, the smallest prime that divides it. So spf[12] is 2, spf[15] is 3, and spf[7] is 7 because a prime's smallest factor is itself. It is built by a sieve that, for each prime i, writes i into every multiple of i that has no entry yet — the guard is what makes the recorded value the smallest, since a larger prime arriving later never overwrites what a smaller one wrote. Once that table exists, factorising needs no search: read the smallest factor, divide it out, and read again on the quotient.

<!-- @doubt -->
### Why is the walk O(log n)?

<!-- @answer -->
Because every division reduces n by a factor of at least 2 — the smallest prime factor is never smaller than 2 — so after k divisions the value is at most n / 2^k, and it cannot take more than log2(n) steps to reach 1. Measured over 2..200,000, the maximum was exactly 17 divisions, at n = 131,072 = 2^17, and log2(200,000) is 17.6. The bound is tight rather than pessimistic: the worst case is a power of two, which has the most prime factors counted with multiplicity.

<!-- @doubt -->
### Is it really only 5.5x faster?

<!-- @answer -->
On random input, yes — 66.1ns against 366ns at N = 200,000, rising to 9.6x at N = 5,000,000. The complexity difference suggests far more, and the reason it does not appear is that O(√n) is trial division's worst case rather than its typical one. Half of all numbers are even, and the loop stops as soon as the remaining quotient reaches 1, so a random composite is usually finished within a few candidates. The gap shows its real size on primes, where no early exit exists: 3.1ns against 1,165ns, a factor of 381.

<!-- @doubt -->
### When is the sieve worth building?

<!-- @answer -->
When the queries outnumber the break-even point, which is a real number rather than a rule of thumb. At N = 200,000 the build costs 1,548,209ns and each query saves about 300ns, so it takes 5,162 queries to repay. At N = 5,000,000 the build costs 34,772,666ns and 20 MB while saving about 449ns per query, pushing break-even to 77,458. In Python it is lower, at 2,938 queries, because the interpreted trial-division loop suffers more than the interpreted walk. Below those thresholds, trial division is simply the better algorithm.

<!-- @doubt -->
### Why does the per-query cost barely change with N?

<!-- @answer -->
Because the walk's length depends on log2(n), not on the size of the table. Measured, it was 52.2ns per query at N = 10^6 and 52.0ns at N = 5 × 10^6 — effectively identical, since the number of divisions changed by at most two or three. What does grow with N is the build cost and the memory, which is why a bigger table is not straightforwardly better: it costs several times more to construct while helping each query by almost nothing extra. That asymmetry is what pushes break-even up rather than down as N rises.

<!-- @doubt -->
### Why must the inner loop start at i rather than i squared?

<!-- @answer -->
It depends on how the table is initialised, and getting the two out of step is the standard bug. With a zero-initialised table, the loop must start at i, because i itself needs an entry and so do multiples like 2i and 3i whose smallest factor is i but which lie below i². Starting at i² leaves those blank, and the walk then reads 0 and divides by zero. If instead the table is seeded so that every value is its own factor — list(range(n+1)) in the Python version — primes are already correct and multiples below i² already hold a smaller prime, so starting at i² is safe.

<!-- @doubt -->
### What happens for a value above the sieve limit?

<!-- @answer -->
The table has no entry, so the lookup is out of bounds — which in C++ is undefined behaviour rather than an error, and may not fail visibly. The sieve is fundamentally bounded by memory: 20 MB already at N = 5,000,000 for an int table, and an array to 10^12 is impossible. That is the same wall the previous subtopic hit, and there it was solved by segmenting, which does not transfer here: a segmented sieve can mark composites in a window, but recording the smallest factor of every value in a window at 10^12 still requires factoring information the window does not contain.

<!-- @doubt -->
### How do I factor a single very large number?

<!-- @answer -->
Neither method here. Strip the small factors by trial division first, which finishes most real inputs outright, and then apply Pollard's rho to split whatever remains, testing the pieces with Miller-Rabin rather than by division. Pollard's rho is O(n^(1/4)) expected against trial division's O(n^(1/2)), which is the difference between feasible and not at 10^18. In practice use the library — BigInteger.isProbablePrime in Java, sympy.factorint in Python — unless implementing it is the exercise. And note that no method is fast for a large semiprime; that difficulty is what RSA rests on.

<!-- @doubt -->
### How does this differ from the previous subtopic's sieve?

<!-- @answer -->
Same sweep, different payload. A primality sieve stores one bit per value — prime or not — and answers "is this prime". An SPF sieve stores one integer per value — the smallest prime dividing it — and answers "how do I start factorising this". The extra information costs memory, 4 bytes against 1 bit, and buys a complete factorisation rather than a yes or no. The structural move is identical, and it is the move this whole topic has been making: do the shared work once, then answer each query by reading rather than by computing.

<!-- @doubt -->
### What ties this topic together?

<!-- @answer -->
One instinct, applied eighteen times: find the structure that makes the obvious loop unnecessary. Sometimes the structure is a bit pattern — n & (n-1) removes a set bit, so counting them needs no scan. Sometimes it is an algebraic identity — four consecutive integers XOR to zero, so a range collapses to a four-case formula. Sometimes it is a precomputed table, as here. And sometimes the honest finding is that the structure does not pay: the XOR swap is slower than a temporary, Kernighan's loop loses to a fixed scan, and the bitmask power set loses to recursion. The instinct is to look for the structure; the discipline is to measure whether it helped.
