---
id: print-prime-factors-of-a-number
topic: Bit Manipulation
title: Print Prime Factors of a Number
difficulty: Hard
status: ready
prerequisites:
  - prime-check
  - check-if-a-number-is-odd-or-not
  - gcd-euclidean-algorithm
  - time-and-space-complexity-basics
relatedIds:
  - divisors-of-a-number
  - prime-factorisation-of-a-number
  - count-primes-in-range-l-to-r
  - prime-check
  - divide-two-numbers-without-multiplication-and-division
---

<!-- @summary -->
Trial division stops at √n, not n, because dividing each factor out as it is found means at most one prime factor can ever remain above the square root — verified across every n from 2 to 300,000, where **0** values had two such factors and 219,884 had exactly one. That single leftover is what the final `if (n > 1)` handles. The saving is not a constant: on 2,000 random values below a million it measured **2,101x**, and on the prime 999,999,937 it was **29,045x**, 31,622 iterations against 999,999,936. Skipping multiples of 2 and 3 with a 6k±1 wheel buys a further 3.15x.

<!-- @theory -->
## The problem

Print the prime factors of `n`. For 60 that is 2, 3 and 5; for 1024 it is just 2;
for a prime it is the number itself.

## Why √n is enough

The naive method tests every `d` from 2 to `n` and checks whether it is prime — a
primality test inside a divisor loop, which is quadratic before it starts.

The improvement rests on one fact. **Divide each factor out as you find it.** Then
at any moment `n` holds only the factors not yet extracted, and:

> If two primes both exceeded √n, their product would exceed n.

So after dividing out everything up to √n, whatever remains is either 1 or a
single prime. That is the entire justification for:

```cpp
for (int d = 2; (long long)d * d <= n; d++)
    if (n % d == 0) { print(d); while (n % d == 0) n /= d; }

if (n > 1) print(n);          // the one factor that can exceed sqrt(n)
```

Checked over every n from 2 to 300,000: **0** values had more than one prime
factor above their square root, and **219,884** had exactly one — 73.3% of the
range. That final `if` is not an edge case; it fires for most inputs.

Against a divide-to-n reference, the √n version agreed on every n from 2 to
200,000, with 0 mismatches.

## The loop finds only primes

The inner `while` is doing more than saving iterations — it is what makes the
primality test unnecessary. When `d` reaches a composite value like 4, every
factor of 2 has already been divided out, so `n % 4` cannot be 0. By the time any
composite `d` is tested, its prime factors are gone from `n`.

That means the printed divisors are prime **by construction**, with nothing
checking them. It is the part of the algorithm most often reimplemented
unnecessarily.

## How much this saves

| Input | Divide to n | Divide to √n | Ratio |
|---|---|---|---|
| 2,000 random n < 10^6 | 1,810,658,334ns | **861,875ns** | **2,101x** |
| the prime 999,999,937 | 1,258,602,084ns | **43,333ns** | **29,045x** |

The second row is the shape of the problem: 999,999,936 iterations against 31,622.
The ratio is not a constant — it is roughly √n — so it grows without bound as the
input does. A prime is the worst case for both methods, because nothing divides
out and the loop runs to its limit.

## Skipping the obvious multiples

Once 2 is handled separately, no even `d` can ever divide `n`, so the loop can
step by 2. Extending that to 3 gives the **6k±1 wheel**: every prime above 3 is
one less or one more than a multiple of 6, so testing only `5, 7, 11, 13, 17, 19…`
covers every possible prime factor.

| Method | 4,000 random n < 10^9 | Ratio |
|---|---|---|
| Every `d` | 23,675,833ns | 1.00x |
| Odd `d` only | 12,274,834ns | 1.93x |
| 6k±1 wheel | **7,522,791ns** | **3.15x** |

Both verified against the plain version on every n from 2 to 300,000, with 0
mismatches. These are constant-factor wins — the complexity is still O(√n) — but
1.93x and 3.15x for four extra lines is a good trade.

## Cost, stated honestly

O(√n) **divisions**, which is not the same as O(√n) in the input's size. A 64-bit
`n` has about 19 digits, and √n is around 10^9.5 — so trial division is
exponential in the number of digits, and factoring a large semiprime this way is
hopeless. That is what public-key cryptography relies on.

For the ranges this subtopic deals with — up to 10^9 or so — √n is at most about
31,623 iterations, which is instant.

## Where this goes next

**Divisors of a Number** applies the identical √n insight to a different question:
divisors come in pairs multiplying to n, so finding one below the square root
gives the other for free. **Prime factorisation of a Number** then attacks the
repeated-query case, where a sieve of smallest prime factors turns each
factorisation into O(log n) with no division loop at all.

<!-- @intuition -->
The naive method asks two questions at once — is this a divisor, and is it prime — and the second one is expensive. Dividing each factor out as soon as it is found collapses both into one, because it changes what `n` means as the loop runs: it is no longer the original number but the part of it not yet accounted for. Once that is true, two things follow immediately. A composite `d` can never divide the remaining `n`, since its own prime factors were removed earlier, so every divisor found is automatically prime and no test is needed. And two factors larger than the square root cannot both remain, because their product would exceed what is left — so the loop can stop at √n and handle the single possible survivor with one line afterwards. The whole speedup comes from the loop modifying the thing it is iterating over, which is usually a mistake and here is the point.

<!-- @approach -->
### Brute Force - Test Every Divisor for Primality

<!-- @idea -->
Try every d from 2 to n, and when it divides, check separately whether it is prime.

<!-- @steps -->
1. Loop `d` from 2 up to `n`.
2. If `d` does not divide `n`, move on.
3. If it does, test whether `d` is prime by trial division up to √d.
4. If it is prime, print it.
5. Do not modify `n` — every divisor is tested against the original value.

<!-- @complexity -->
- time: O(n * sqrt(n)) worst case — a primality test nested inside a divisor scan
- space: O(1) beyond the output
- note: Correct, and the reference the fast version was checked against on every n from 2 to 200,000, with 0 mismatches. Measured 1,810,658,334ns on 2,000 random values below a million against the sqrt version's 861,875ns — a factor of 2,101 — and 29,045x on a single large prime. Its only value is as a definition of the answer.

<!-- @code cpp -->
```cpp
#include <cstdio>

bool isPrime(int d) {
    if (d < 2) return false;
    for (int k = 2; (long long)k * k <= d; k++)
        if (d % k == 0) return false;
    return true;
}

void printPrimeFactors(int n) {
    for (int d = 2; d <= n; d++)
        if (n % d == 0 && isPrime(d)) printf("%d ", d);
}
```

<!-- @annotations -->
- 11: The loop runs to n rather than to its square root, which for the prime 999,999,937 is 999,999,936 iterations against 31,622.
- 12: n is never modified, which is exactly why the primality test is needed here and not needed in the fast version.

<!-- @code java -->
```java
static boolean isPrime(int d) {
    if (d < 2) return false;
    for (int k = 2; (long) k * k <= d; k++)
        if (d % k == 0) return false;
    return true;
}

static void printPrimeFactors(int n) {
    for (int d = 2; d <= n; d++)
        if (n % d == 0 && isPrime(d)) System.out.print(d + " ");
}
```

<!-- @annotations -->
- 3: The cast to long prevents k * k from overflowing when d is near Integer.MAX_VALUE — the same guard the outer loop needs.

<!-- @code python -->
```python
def is_prime(d: int) -> bool:
    if d < 2:
        return False
    k = 2
    while k * k <= d:
        if d % k == 0:
            return False
        k += 1
    return True


def print_prime_factors(n: int) -> list[int]:
    return [d for d in range(2, n + 1) if n % d == 0 and is_prime(d)]
```

<!-- @annotations -->
- 5: No overflow concern here, since Python integers widen — one of the few places where the naive version needs less care than the fast one.

<!-- @approach -->
### Better - Divide Each Factor Out

<!-- @idea -->
Remove every copy of a factor as soon as it is found, so later divisors are tested against what remains.

<!-- @steps -->
1. Loop `d` upward from 2.
2. When `d` divides `n`, print it once.
3. Then divide `n` by `d` repeatedly until it no longer divides.
4. Note that this makes `n` shrink as the loop proceeds.
5. Note that a composite `d` can now never divide `n`, because its own prime factors were removed earlier.

<!-- @complexity -->
- time: O(n) worst case if the loop still runs to n, but with no primality test
- space: O(1)
- note: The step that removes the primality test entirely. Once each factor is divided out, every divisor the loop finds is prime by construction — when d reaches 4, all the 2s are gone, so n % 4 cannot be 0. This is the part most often reimplemented with a redundant isPrime call.

<!-- @code cpp -->
```cpp
#include <cstdio>

void printPrimeFactors(int n) {
    for (int d = 2; d <= n; d++) {
        if (n % d == 0) {
            printf("%d ", d);
            while (n % d == 0) n /= d;
        }
    }
}
```

<!-- @annotations -->
- 7: The line that makes the primality test unnecessary — after it, no multiple of d can divide the remaining n.
- 5: Still runs to n, so this is correct and not yet fast; the bound is fixed in the next approach.

<!-- @code java -->
```java
static void printPrimeFactors(int n) {
    for (int d = 2; d <= n; d++) {
        if (n % d == 0) {
            System.out.print(d + " ");
            while (n % d == 0) n /= d;
        }
    }
}
```

<!-- @annotations -->
- 5: Reassigning the parameter n is safe in Java because primitives are passed by value — the caller's variable is untouched.

<!-- @code python -->
```python
def prime_factors(n: int) -> list[int]:
    out = []
    d = 2
    while d <= n:
        if n % d == 0:
            out.append(d)
            while n % d == 0:
                n //= d
        d += 1
    return out
```

<!-- @annotations -->
- 8: // rather than /, which would turn n into a float and make the modulo comparisons unreliable.

<!-- @approach -->
### Optimal - Stop at the Square Root

<!-- @idea -->
After dividing out everything up to √n, at most one prime can remain, because two of them would multiply past n.

<!-- @steps -->
1. Loop `d` from 2 while `d * d` is at most `n`.
2. When `d` divides `n`, print it and divide it out completely.
3. Note that `n` shrinks, so the loop bound shrinks with it.
4. When the loop ends, whatever remains in `n` is either 1 or a single prime.
5. If it is greater than 1, print it — that is the one factor that could exceed the square root.

<!-- @complexity -->
- time: O(sqrt(n)) divisions in the worst case, which is a prime input
- space: O(1)
- note: Verified against a divide-to-n reference on every n from 2 to 200,000, 0 mismatches. The at-most-one-large-factor claim was checked separately over 2..300,000: 0 values had two prime factors above their square root and 219,884 had exactly one, so the final if fires for 73.3% of inputs. Measured 861,875ns on 2,000 random values below a million against 1,810,658,334ns for the naive version — 2,101x — and 43,333ns against 1,258,602,084ns on the prime 999,999,937, a factor of 29,045.

<!-- @code cpp -->
```cpp
#include <cstdio>

void printPrimeFactors(int n) {
    for (int d = 2; (long long)d * d <= n; d++) {
        if (n % d == 0) {
            printf("%d ", d);
            while (n % d == 0) n /= d;
        }
    }
    if (n > 1) printf("%d ", n);
}

// n = 60   -> 2 3 5
// n = 97   -> 97          (the final if is doing all the work)
// n = 1024 -> 2
// n = 999999 -> 3 7 11 13 37
```

<!-- @annotations -->
- 5: The cast prevents d * d from overflowing when n is near INT_MAX; writing d <= n / d avoids the cast entirely and costs a division. The bound is also re-evaluated each iteration against the SHRINKING n, so dividing out a large factor early ends the loop sooner.
- 10: Not an edge case — it fires for 73.3% of values in 2..300,000, and it is the whole answer for a prime input.

<!-- @code java -->
```java
static void printPrimeFactors(int n) {
    for (int d = 2; (long) d * d <= n; d++) {
        if (n % d == 0) {
            System.out.print(d + " ");
            while (n % d == 0) n /= d;
        }
    }
    if (n > 1) System.out.print(n);
}
```

<!-- @annotations -->
- 2: (long) d * d rather than d * d — the cast must be on the first operand, or the multiplication happens in int and overflows before being widened.

<!-- @code python -->
```python
def prime_factors(n: int) -> list[int]:
    out = []
    d = 2
    while d * d <= n:
        if n % d == 0:
            out.append(d)
            while n % d == 0:
                n //= d
        d += 1
    if n > 1:
        out.append(n)
    return out


# math.isqrt(n) is the exact integer square root if you prefer a
# precomputed bound — but recomputing d * d each step is better here,
# because n shrinks and the bound should shrink with it.
```

<!-- @annotations -->
- 4: d * d <= n rather than d <= isqrt(n): the second would fix the bound at the original n and lose the shrinking benefit.
- 11: For a prime input this line is the entire answer, and the loop above it did nothing but confirm there was nothing to do.

<!-- @approach -->
### Constant Factors - Skip Multiples of 2 and 3

<!-- @idea -->
Once 2 and 3 are handled separately, every remaining prime is 6k±1, so two thirds of the candidates can be skipped.

<!-- @steps -->
1. Extract all factors of 2, then all factors of 3, printing each once.
2. Start `d` at 5 and step by 6 each iteration.
3. Test both `d` and `d + 2` — these are the 6k−1 and 6k+1 candidates.
4. Divide out any that divide, exactly as before.
5. Print the leftover if it exceeds 1.

<!-- @complexity -->
- time: O(sqrt(n) / 3) divisions — the same complexity with a third of the constant
- space: O(1)
- note: Verified against the plain version on every n from 2 to 300,000, 0 mismatches, as was the simpler odds-only variant. Measured over 4,000 random values below 10^9: 23,675,833ns for every d, 12,274,834ns for odds only (1.93x) and 7,522,791ns for the 6k±1 wheel (3.15x). Every prime above 3 is 6k±1 because 6k, 6k+2 and 6k+4 are even and 6k+3 is divisible by 3.

<!-- @code cpp -->
```cpp
#include <cstdio>

void printPrimeFactors(long long n) {
    if (n % 2 == 0) { printf("2 "); while (n % 2 == 0) n /= 2; }
    if (n % 3 == 0) { printf("3 "); while (n % 3 == 0) n /= 3; }

    for (long long d = 5; d * d <= n; d += 6) {
        if (n % d == 0)       { printf("%lld ", d);     while (n % d == 0)       n /= d; }
        if (n % (d + 2) == 0) { printf("%lld ", d + 2); while (n % (d + 2) == 0) n /= (d + 2); }
    }
    if (n > 1) printf("%lld ", n);
}
```

<!-- @annotations -->
- 4: Handling 2 and 3 first is what licenses the wheel — without it the loop would miss them entirely.
- 8: d and d + 2 are the 6k-1 and 6k+1 candidates. Everything else in each block of six is divisible by 2 or 3 and was already removed.
- 11: Still needed, and for the same reason as before.

<!-- @code java -->
```java
static void printPrimeFactors(long n) {
    if (n % 2 == 0) { System.out.print("2 "); while (n % 2 == 0) n /= 2; }
    if (n % 3 == 0) { System.out.print("3 "); while (n % 3 == 0) n /= 3; }

    for (long d = 5; d * d <= n; d += 6) {
        if (n % d == 0)       { System.out.print(d + " ");       while (n % d == 0)       n /= d; }
        if (n % (d + 2) == 0) { System.out.print((d + 2) + " "); while (n % (d + 2) == 0) n /= (d + 2); }
    }
    if (n > 1) System.out.print(n);
}
```

<!-- @annotations -->
- 5: long throughout, so d * d cannot overflow even for n near Long.MAX_VALUE — though at that size trial division is far too slow to finish anyway.

<!-- @code python -->
```python
def prime_factors(n: int) -> list[int]:
    out = []
    for p in (2, 3):
        if n % p == 0:
            out.append(p)
            while n % p == 0:
                n //= p

    d = 5
    while d * d <= n:
        for c in (d, d + 2):
            if n % c == 0:
                out.append(c)
                while n % c == 0:
                    n //= c
        d += 6

    if n > 1:
        out.append(n)
    return out
```

<!-- @annotations -->
- 12: Iterating over the pair (d, d + 2) keeps the wheel readable without duplicating the divide-out block.
- 3: The same loop handles 2 and 3, since both are extracted identically — only the wheel below them differs.

<!-- @example -->

<!-- @input -->
n = 60

<!-- @output -->
2 3 5

<!-- @why -->
It has a repeated factor, a factor found by the loop, and a factor left over at the end, so all three parts of the algorithm fire.

<!-- @walkthrough -->
1. d = 2 divides 60, so print 2 and divide it out: 60 becomes 30, then 15.
2. d = 2 no longer divides 15, so the loop advances.
3. d = 3 divides 15, so print 3 and divide out: 15 becomes 5.
4. Now d = 3 and d * d is 9, which exceeds the remaining n of 5, so the loop stops.
5. The leftover n is 5, which is greater than 1, so the final if prints it.
6. Notice that 5 was never tested by the loop — the bound had already shrunk past it.
7. Notice also that 4 was never reached, and would not have divided anything if it had, because both 2s were already gone.

<!-- @example -->

<!-- @input -->
n = 97, a prime

<!-- @output -->
97, from the final if alone

<!-- @why -->
It is the worst case for the loop and the case where the leftover line does all the work, which is easy to omit and hard to notice.

<!-- @walkthrough -->
1. The loop tests d = 2, 3, 4, 5, 6, 7, 8, 9 — stopping when d * d exceeds 97.
2. None of them divides 97, so nothing is printed and n is never modified.
3. The loop ends with n still 97.
4. The final if sees n > 1 and prints 97.
5. Without that line the function would print nothing at all for every prime input.
6. This is not a rare shape: over 2..300,000, 219,884 values — 73.3% — end with a leftover greater than 1.
7. It is also the worst case for cost, since nothing divides out and the loop runs its full √n iterations: 31,622 of them for a number near 10^9.

<!-- @example -->

<!-- @input -->
Every n from 2 to 300,000, counting factors above the square root

<!-- @output -->
0 values with more than one, 219,884 with exactly one

<!-- @why -->
The entire justification for stopping at √n is a claim about how many large factors can survive, and it is small enough to check completely.

<!-- @walkthrough -->
1. For each n, the prime factors were computed and each was compared against √n.
2. Not one of the 299,999 values had two prime factors exceeding its square root.
3. That is what the argument predicts: if two primes both exceeded √n their product would exceed n, so they cannot both divide it.
4. 219,884 values had exactly one such factor, which is 73.3% of the range.
5. Those are precisely the inputs where the final if prints something.
6. The remaining values had all their prime factors at or below √n, so the loop found everything and the leftover was 1.
7. Together these say the loop and the trailing line are not two cases but one complete method: everything small is found by iteration, and the single possible large survivor is handled by arithmetic.

<!-- @example -->

<!-- @input -->
The prime 999,999,937, both methods

<!-- @output -->
1,258,602,084ns against 43,333ns — 29,045x

<!-- @why -->
It shows that the √n bound is not a constant-factor optimisation, and the worst case for the fast method is still trivial.

<!-- @walkthrough -->
1. The naive method loops d from 2 to n, which is 999,999,936 iterations, and runs a primality test on every divisor it finds.
2. It took 1,258,602,084 nanoseconds — about 1.26 seconds for a single number.
3. The √n method loops only while d * d does not exceed n, which is 31,622 iterations.
4. It took 43,333 nanoseconds, a factor of 29,045 faster.
5. That ratio is roughly √n, so it grows without bound as the input does — at 10^18 it would be about a billion.
6. A prime is the worst case for both, because nothing divides out and neither loop can exit early.
7. Even so, 31,622 iterations is instant, which is why trial division is entirely adequate up to about 10^9 and hopeless well before 10^18.

<!-- @visualization custom -->

<!-- @description -->
Open with the divisor-pair panel, because it is the geometric reason for the √n bound. Draw n = 36 as a rectangle and show every way to split it into two factors: 1x36, 2x18, 3x12, 4x9, 6x6, 9x4, 12x3, 18x2, 36x1. Mark the midpoint at 6 = √36 and show the list folding in half around it, so each pair has one factor at or below the root and one at or above. Caption it "a factor above the root always has a partner below it". Then the main animation on n = 60: a number line of candidate divisors with d walking upward, and a separate box showing the current value of n. At d = 2 the box flashes, 2 is emitted, and the box counts down 60, 30, 15 as the twos are divided out — with the loop bound √n visibly shrinking on the number line as n shrinks. At d = 3, emit 3 and the box goes to 5. Then show the bound now sitting below d, the loop ending, and the leftover 5 dropping out of the box into the output. Highlight that 5 was never tested. Immediately replay for n = 97: d walks 2 through 9, the box never changes, the loop bound is crossed, and the entire answer falls out of the trailing if — draw that line glowing and label it "73.3% of inputs end here". Then the no-primality-test panel: run d up to 4 on a value that still contains a 2, and show 4 failing to divide because the box has already had its twos removed, with a struck-through isPrime() beside it captioned "not needed — the divisor is prime by construction". Then the wheel panel: a ring of six positions labelled 6k through 6k+5, with 6k, 6k+2, 6k+4 shaded as even and 6k+3 shaded as divisible by three, leaving only 6k+1 and 6k+5 lit — and the candidate sequence 5, 7, 11, 13, 17, 19 stepping around it. Put the three timings beside it: 23,675,833ns, 12,274,834ns and 7,522,791ns, labelled 1.00x, 1.93x and 3.15x. Close with the scale panel: a log-log chart of iterations against n for the two bounds, n and √n, with the prime 999,999,937 marked on both lines at 999,999,936 and 31,622, annotated 29,045x — and a note extending the √n line to 10^18 to show where trial division stops being viable at all.

<!-- @sampleInput -->
```json
{"whySqrt":{"example":36,"factorPairs":[[1,36],[2,18],[3,12],[4,9],[6,6]],"root":6,"claim":"a factor above the root always has a partner below it","forPrimes":"if two primes both exceeded sqrt(n), their product would exceed n"},"worked":{"n":60,"steps":[{"d":2,"divides":true,"emit":2,"nAfter":15,"dividedOut":[30,15]},{"d":3,"divides":true,"emit":3,"nAfter":5},{"d":3,"boundCheck":"3 * 3 = 9 > 5","loopEnds":true}],"leftover":5,"emittedByFinalIf":5,"note":"5 was never tested by the loop — the bound had already shrunk past it","output":[2,3,5]},"primeCase":{"n":97,"loopTested":[2,3,4,5,6,7,8,9],"nEverModified":false,"leftover":97,"emittedByFinalIf":97,"withoutFinalIf":"prints nothing at all for every prime input"},"leftoverFrequency":{"range":[2,300000],"values":299999,"withTwoLargeFactors":0,"withExactlyOneLargeFactor":219884,"percent":73.3,"reading":"the final if is not an edge case — it fires for most inputs"},"noPrimalityTest":{"claim":"every divisor the loop finds is prime by construction","why":"when d reaches a composite value, its own prime factors have already been divided out of n, so n % d cannot be 0","example":"by the time d = 4 is tested, both 2s are gone","consequence":"the isPrime call in the naive version is not an optimisation to remove but a step that has become impossible to need"},"verification":{"againstNaive":{"range":[2,200000],"mismatches":0},"oddsOnly":{"range":[2,300000],"mismatches":0},"wheel":{"range":[2,300000],"mismatches":0},"nEqualsOne":{"factors":[],"note":"1 has no prime factors, and both methods return empty"}},"workedValues":[{"n":60,"factors":[2,3,5]},{"n":97,"factors":[97]},{"n":1024,"factors":[2]},{"n":999983,"factors":[999983]},{"n":999999,"factors":[3,7,11,13,37]}],"timing":{"unit":"ns","boundComparison":[{"input":"2,000 random n < 10^6","divideToN":1810658334,"divideToSqrt":861875,"ratio":2101},{"input":"the prime 999,999,937","divideToN":1258602084,"divideToSqrt":43333,"ratio":29045,"iterations":{"toN":999999936,"toSqrt":31622}}],"ratioGrowsAs":"sqrt(n) — not a constant, so it grows without bound","wheel":{"input":"4,000 random n < 10^9","everyD":23675833,"oddsOnly":12274834,"oddsRatio":1.93,"sixKWheel":7522791,"wheelRatio":3.15}},"wheelReason":{"ring":[{"position":"6k","divisibleBy":2},{"position":"6k+1","candidate":true},{"position":"6k+2","divisibleBy":2},{"position":"6k+3","divisibleBy":3},{"position":"6k+4","divisibleBy":2},{"position":"6k+5","candidate":true}],"sequence":[5,7,11,13,17,19],"prerequisite":"2 and 3 must be extracted first, or the loop misses them entirely"},"complexityHonesty":{"stated":"O(sqrt(n)) divisions","butNot":"O(sqrt(n)) in the SIZE of the input","detail":"a 64-bit n has about 19 digits and sqrt(n) is around 10^9.5, so trial division is exponential in the number of digits","consequence":"factoring a large semiprime this way is hopeless — which is what public-key cryptography relies on","practicalCeiling":"up to about 10^9, sqrt(n) is at most 31,623 iterations, which is instant"}}
```

<!-- @highlights -->
- n = 36 is drawn as a rectangle with every factor pair listed: 1x36, 2x18, 3x12, 4x9, 6x6.
- The midpoint at 6 = √36 is marked and the list folds in half around it.
- It is captioned "a factor above the root always has a partner below it".
- For n = 60, d walks a number line while a separate box shows the current value of n.
- At d = 2 the box counts down 60, 30, 15 as the twos divide out.
- The loop bound √n visibly shrinks on the number line as n shrinks.
- At d = 3 the box drops to 5, the bound falls below d, and the loop ends.
- The leftover 5 drops out of the box into the output, having never been tested.
- The n = 97 case replays with the box never changing and the whole answer falling out of the trailing if.
- That line glows and is labelled "73.3% of inputs end here".
- A separate panel runs d up to 4 on a value whose twos are already removed, so 4 fails to divide.
- A struck-through isPrime() sits beside it, captioned "not needed — the divisor is prime by construction".
- A ring of six positions shades 6k, 6k+2 and 6k+4 as even and 6k+3 as divisible by three.
- Only 6k+1 and 6k+5 stay lit, with the sequence 5, 7, 11, 13, 17, 19 stepping around it.
- Three timings sit beside it at 23,675,833ns, 12,274,834ns and 7,522,791ns, labelled 1.00x, 1.93x and 3.15x.
- A log-log chart plots iterations against n for both bounds, marking 999,999,936 and 31,622 and annotating 29,045x.

<!-- @edgeCases -->
- n = 1 — has no prime factors; the loop never runs and the final if does not fire, so the output is correctly empty.
- n = 2 — the smallest prime; the loop body never executes and the answer comes entirely from the final if.
- n prime — the worst case for cost and the case where the trailing line is the whole answer.
- n = 2^k — one factor found immediately, and the loop bound collapses to nothing after it is divided out.
- n a perfect square of a prime, such as 49 — the loop finds 7 with d * d exactly equal to n, so the bound must be <= rather than <.
- n a product of two large primes — the worst practical case; the loop runs to √n and finds the smaller one only at the end.
- d * d overflowing for n near INT_MAX — cast to a 64-bit type, or write d <= n / d instead.
- Negative n — undefined for this problem; guard it, since the loop conditions assume positive values.
- n = 0 — every d divides it, so the loop would emit 2 and then divide forever; guard it.
- Large n in Python — no overflow, but √n iterations may still be far too many; the ceiling is time, not the type.
- A composite d reached by the loop — cannot divide the remaining n, which is why no primality test appears.

<!-- @pitfalls -->
- Omitting the final if (n > 1). It fires for 73.3% of values in 2..300,000 and is the entire answer for every prime.
- Looping d up to n instead of √n. Measured 2,101x slower on random inputs and 29,045x on a single large prime.
- Adding an isPrime check inside the fast loop. It cannot fail — every divisor found is prime by construction — so it is pure cost.
- Forgetting to divide the factor out. Without it the loop reports composite divisors and the √n bound stops being valid.
- Writing d * d <= n with int arithmetic near INT_MAX. The product overflows; cast to 64-bit or compare d <= n / d.
- Casting only the second operand, as in d * (long) d in Java. The multiplication still happens in int first.
- Precomputing isqrt(n) once as the bound. It fixes the limit at the original n and loses the shrinking that dividing out provides.
- Using d * d < n rather than <=. A perfect square of a prime, like 49, then reports 49 instead of 7.
- Passing 0 or a negative n. The loop conditions assume a positive value and 0 is divisible by everything.
- Applying the 6k±1 wheel without extracting 2 and 3 first. Those two primes are not of the form 6k±1 and would be missed entirely.
- Assuming O(√n) means fast for any input. It is exponential in the number of digits, so it is fine to 10^9 and hopeless at 10^18.
- Using / instead of // in Python. n becomes a float and the modulo tests stop being reliable.

<!-- @doubt -->
### Why is it enough to loop only to √n?

<!-- @answer -->
Because factors come in pairs whose product is n, so at most one member of each pair can exceed √n — if both did, their product would exceed n. Combined with dividing each factor out as it is found, that means once the loop passes √n of the remaining value, whatever is left is either 1 or a single prime. Checked over every n from 2 to 300,000: not one value had two prime factors above its square root. That is why the loop plus one trailing line is a complete method rather than an approximation.

<!-- @doubt -->
### Why is there no primality test in the fast version?

<!-- @answer -->
Because the divisors it finds are prime by construction. Each factor is divided out completely as soon as it is found, so by the time d reaches a composite value, that value's own prime factors have already been removed from n — when d = 4 is tested, both 2s are gone, so n % 4 cannot be 0. The naive version needs the test only because it never modifies n. Adding an isPrime call to the fast loop is not a safety measure; it is a check that can never fail, paid for on every iteration.

<!-- @doubt -->
### What is the final if actually for?

<!-- @answer -->
The one prime factor that can exceed √n. After the loop, n holds whatever was not divided out, and by the pairing argument that is either 1 or a single prime — never a composite and never two primes. Far from being an edge case, it fires for 219,884 of the 299,999 values from 2 to 300,000, which is 73.3%. For a prime input it is the entire answer: the loop tests candidates, finds nothing, and the trailing line prints the number itself. Omitting it makes the function silently print nothing for every prime.

<!-- @doubt -->
### How much does the √n bound save?

<!-- @answer -->
It depends on n, which is the point — it is not a constant factor. On 2,000 random values below a million it measured 2,101x, at 861,875ns against 1,810,658,334ns. On the single prime 999,999,937 it measured 29,045x, at 43,333ns against 1,258,602,084ns, because the iteration counts are 31,622 against 999,999,936. The ratio is roughly √n, so it grows without bound as the input grows. A prime is the worst case for both methods, since nothing divides out and neither loop can exit early.

<!-- @doubt -->
### Why does the 6k±1 wheel work?

<!-- @answer -->
Every integer is one of 6k, 6k+1, 6k+2, 6k+3, 6k+4 or 6k+5. Three of those are even and one is a multiple of 3, so once 2 and 3 have been extracted, only 6k+1 and 6k+5 can be prime — and 6k+5 is the same as 6k−1. Testing d and d+2 starting at 5 and stepping by 6 covers exactly those. It skips two thirds of the candidates and measured 3.15x faster over 4,000 random values below 10^9, against 1.93x for skipping evens alone. The prerequisite is not optional: 2 and 3 must be handled before the loop, since neither is of the form 6k±1.

<!-- @doubt -->
### Should I compute the square root once instead?

<!-- @answer -->
No, and the reason is easy to miss. Writing d * d <= n re-evaluates the bound against the current n, which shrinks every time a factor is divided out — so for 60, after the twos and the three are removed, the bound has fallen to √5 and the loop ends at d = 3. Precomputing isqrt(60) fixes the limit at 7 and the loop keeps testing 4, 5, 6 and 7 for no reason. The saving from a shrinking bound is larger than the cost of one multiplication per iteration, and the multiplication is a single instruction.

<!-- @doubt -->
### Can d * d overflow?

<!-- @answer -->
Yes, for n near INT_MAX. When d approaches 46,341 its square exceeds 2^31, so d * d in int arithmetic wraps to a negative value and the loop condition becomes false — the loop exits early and factors are missed silently. Cast the first operand to a 64-bit type, as in (long long)d * d, or sidestep it with d <= n / d, which costs a division instead. In Java the same applies with (long) d * d, and note that the cast must be on the first operand: d * (long) d still performs the multiplication in int.

<!-- @doubt -->
### Is O(√n) actually fast?

<!-- @answer -->
For the sizes this subtopic deals with, yes — up to about 10^9, √n is at most 31,623 iterations, which is instant. But the complexity is worth stating carefully: it is O(√n) divisions, not O(√n) in the size of the input. A 64-bit n has about 19 digits, and √n is then around 10^9.5, so the running time is exponential in the number of digits. That is why factoring a large semiprime by trial division is hopeless, and why public-key cryptography can rely on exactly that.

<!-- @doubt -->
### What about n = 1 and n = 0?

<!-- @answer -->
1 has no prime factors, and the algorithm handles it correctly by accident rather than by design: the loop condition 2 * 2 <= 1 is false immediately and the final if sees n == 1, so the output is empty. 0 is different and must be guarded — every d divides 0, so the loop would emit 2 and then divide 0 by 2 forever, since 0 / 2 is 0 and the while never terminates. Negative inputs are also outside the problem's definition and should be rejected rather than handled.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Divisors of a Number applies the identical square-root insight to a different question. There the pairing is the whole answer rather than a bound: every divisor d below √n has a partner n / d above it, so one loop to the square root finds them all in pairs, with only a perfect square needing care so its root is not counted twice. After that, Prime factorisation of a Number attacks the case this subtopic cannot help with — many queries rather than one — where a sieve of smallest prime factors reduces each factorisation to O(log n) with no trial division at all.
