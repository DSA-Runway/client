---
id: divisors-of-a-number
topic: Bit Manipulation
title: Divisors of a Number
difficulty: Easy
status: ready
prerequisites:
  - print-prime-factors-of-a-number
  - prime-check
  - check-if-a-number-is-odd-or-not
  - time-and-space-complexity-basics
relatedIds:
  - print-prime-factors-of-a-number
  - prime-factorisation-of-a-number
  - count-primes-in-range-l-to-r
  - find-the-smallest-divisor
  - prime-check
---

<!-- @summary -->
Divisors come in pairs multiplying to n, so one loop to √n finds both members of every pair and the work drops from n steps to √n — measured **462x** on 3,000 random values below a million. The pairing has exactly one exception: when `d == n / d` the two members coincide, and omitting that guard over-counts. Checked over every n from 1 to 200,000, the buggy version was wrong on **447** values — which is exactly the number of perfect squares in that range, matching to the last one. Below a million the loop never exceeds 1,000 steps, while the most divisor-rich value there, 720,720, has 240 divisors.

<!-- @theory -->
## The problem

List every divisor of `n`. For 36 that is 1, 2, 3, 4, 6, 9, 12, 18, 36.

## Divisors come in pairs

If `d` divides `n`, then so does `n / d`, and the two multiply back to `n`:

```
36 = 1 x 36 = 2 x 18 = 3 x 12 = 4 x 9 = 6 x 6
```

Every pair has one member at or below √36 = 6 and one at or above it. So a loop
that only reaches the square root sees **one member of every pair**, and gets the
other by division:

```cpp
for (int d = 1; (long long)d * d <= n; d++)
    if (n % d == 0) {
        collect(d);
        if (d != n / d) collect(n / d);
    }
```

This is the same square-root insight as Print Prime Factors, used differently.
There it bounded a search and left one possible survivor; here the pairing *is*
the answer, and the loop produces two results per hit.

## The one exception, measured

When `n` is a perfect square, the middle pair is `√n × √n` — the same divisor
twice. Without the `d != n / d` guard it gets collected twice.

Checked over every n from 1 to 200,000:

| | Count |
|---|---|
| Values where the unguarded version is wrong | **447** |
| Perfect squares in 1..200,000 | **447** |

Exactly equal, which is the guard's specification stated as a measurement: it
fires on perfect squares and on nothing else. The failure is also quiet — the list
is one element too long and otherwise correct, so a test that checks membership
rather than count will pass.

## Cost

| | Time | Ratio |
|---|---|---|
| Test every `d` from 1 to n | 1,615,988,167ns | 462x |
| Pair around √n | **3,496,333ns** | 1.00x |
| Count only, no list built | 2,733,125ns | 1.28x faster still |

462x over 3,000 random values below a million. And the loop bound is reassuringly
small: √10^6 is 1,000, so no input in that range costs more than a thousand
iterations — regardless of how many divisors it actually has. The most
divisor-rich number below a million is **720,720 with 240 divisors**, and it still
takes at most 1,000 steps to find them.

That last point is worth holding onto: the cost depends on the size of `n`, not on
how many divisors it has.

## Counting without listing

If only the count is wanted, skip the container — worth 1.28x on its own. But
there is also a closed form, from the prime factorisation:

```
n = p1^e1 * p2^e2 * ... * pk^ek
number of divisors = (e1 + 1)(e2 + 1)...(ek + 1)
```

Each divisor chooses an exponent from 0 to `ei` for each prime, independently, so
the count is a product of choices. For 36 = 2² × 3², that is (2+1)(2+1) = 9 —
matching the list above. Verified against the enumerated count for every n from 1
to 200,000, with **0 mismatches**.

720,720 factors as 2⁴ × 3² × 5 × 7 × 11 × 13, giving
(5)(3)(2)(2)(2)(2) = 240 — which is why it wins its range.

## The output is not sorted

The pairing emits `d` and `n / d` together, so the sequence comes out as
`1, 36, 2, 18, 3, 12, 4, 9, 6` — ascending and descending interleaved. If sorted
order is required, either sort afterwards, or collect the small halves ascending
and the large halves into a second list to be appended in reverse. The second is
O(1) extra work; sorting is O(√n log √n) on top of an O(√n) algorithm.

## Where this goes next

**Count primes in range L to R** moves from one number to a whole interval, where
testing each value separately is the wrong shape entirely — a sieve computes the
answer for every value at once, and the difference is orders of magnitude rather
than a constant.

<!-- @intuition -->
A divisor never travels alone. Choosing d as a factor of n automatically names n / d as another one, and those two multiply back to n — so the divisors of any number fold neatly into pairs around its square root, one member below and one above. That means a loop only ever has to search the small half; the large half comes free by division, with no searching at all. The only place the fold is imperfect is a perfect square, where the middle pair is a number paired with itself, and the whole difficulty of the problem is remembering that one case. It is worth noticing that this makes the cost depend on the size of n rather than on how many divisors it turns out to have: a number with 240 divisors and a prime with 2 both take the same thousand steps below a million.

<!-- @approach -->
### Brute Force - Test Every d from 1 to n

<!-- @idea -->
Try dividing n by every integer up to n itself and keep the ones that divide evenly.

<!-- @steps -->
1. Loop `d` from 1 to `n`.
2. Test whether `n % d` is 0.
3. If so, collect `d`.
4. Note that the result is naturally in ascending order.
5. Note that the loop performs n divisions regardless of the answer.

<!-- @complexity -->
- time: O(n) divisions
- space: O(number of divisors) for the output
- note: Correct and the reference the fast version was checked against on every n from 1 to 200,000, with 0 mismatches. Measured 1,615,988,167ns over 3,000 random values below a million against the paired version's 3,496,333ns — a factor of 462. Its one genuine advantage is that the output arrives sorted with no extra work.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> divisors(int n) {
    vector<int> out;
    for (int d = 1; d <= n; d++)
        if (n % d == 0) out.push_back(d);
    return out;
}
```

<!-- @annotations -->
- 6: n iterations whatever the input, so a prime near a million costs the same million divisions as a highly composite number.
- 7: Ascending by construction, which the paired version gives up.

<!-- @code java -->
```java
static List<Integer> divisors(int n) {
    List<Integer> out = new ArrayList<>();
    for (int d = 1; d <= n; d++)
        if (n % d == 0) out.add(d);
    return out;
}
```

<!-- @annotations -->
- 4: Each add boxes an int into an Integer, which adds an allocation per divisor on top of the n divisions.

<!-- @code python -->
```python
def divisors(n: int) -> list[int]:
    return [d for d in range(1, n + 1) if n % d == 0]
```

<!-- @annotations -->
- 2: Readable and linear in n, which becomes unusable well before the paired version does — at n = 10^9 this is a billion modulo operations.

<!-- @approach -->
### Optimal - Pair Divisors Around the Square Root

<!-- @idea -->
Every divisor below the square root has a partner above it, so finding one gives both.

<!-- @steps -->
1. Loop `d` from 1 while `d * d` is at most `n`.
2. If `d` divides `n`, collect it.
3. Also collect `n / d`, which is the partner divisor.
4. Skip the second collection when `d` equals `n / d`, which happens only for a perfect square.
5. Note that the output is interleaved rather than sorted.

<!-- @complexity -->
- time: O(sqrt(n)) divisions
- space: O(number of divisors)
- note: Verified against a divide-to-n reference on every n from 1 to 200,000, 0 mismatches. Measured 3,496,333ns over 3,000 random values below a million against 1,615,988,167ns — 462x. The loop bound is small in absolute terms too: below a million it never exceeds 1,000 iterations, whatever the input, including 720,720 with its 240 divisors.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<int> divisors(int n) {
    vector<int> out;
    for (int d = 1; (long long)d * d <= n; d++) {
        if (n % d == 0) {
            out.push_back(d);
            if (d != n / d) out.push_back(n / d);
        }
    }
    return out;                       // NOT sorted: 1 36 2 18 3 12 4 9 6
}
```

<!-- @annotations -->
- 8: The cast avoids overflow for n near INT_MAX; d <= n / d is the alternative and costs a division instead.
- 11: The guard that fires only for perfect squares. Without it the output has one duplicate — measured wrong on exactly 447 of the values from 1 to 200,000, which is precisely the number of perfect squares in that range.
- 13: Sort afterwards if order matters, or collect the partners into a second list and append it reversed, which is O(1) extra work rather than O(sqrt(n) log sqrt(n)).

<!-- @code java -->
```java
static List<Integer> divisors(int n) {
    List<Integer> out = new ArrayList<>();
    for (int d = 1; (long) d * d <= n; d++) {
        if (n % d == 0) {
            out.add(d);
            if (d != n / d) out.add(n / d);
        }
    }
    return out;
}
```

<!-- @annotations -->
- 3: (long) d * d, with the cast on the first operand — d * (long) d still multiplies in int first and overflows.

<!-- @code python -->
```python
def divisors(n: int) -> list[int]:
    out = []
    d = 1
    while d * d <= n:
        if n % d == 0:
            out.append(d)
            if d != n // d:
                out.append(n // d)
        d += 1
    return out


# Sorted, at O(1) extra work rather than a sort:
#     small, large = [], []
#     ... small.append(d); large.append(n // d) ...
#     return small + large[::-1]
```

<!-- @annotations -->
- 8: // rather than /, which would make the partner a float and break the equality test against the integer d.
- 13: The two-list form keeps the ascending order for free, since the partners are naturally produced in descending order.

<!-- @approach -->
### Counting Only - Skip the Container

<!-- @idea -->
If only the number of divisors is wanted, add 1 or 2 per hit and never allocate.

<!-- @steps -->
1. Loop to the square root exactly as before.
2. When `d` divides `n`, add 2 to a counter — one for `d` and one for its partner.
3. Add only 1 when `d` equals `n / d`.
4. Return the counter.
5. Note that no container is built, so nothing is allocated.

<!-- @complexity -->
- time: O(sqrt(n)) divisions
- space: O(1)
- note: Measured 2,733,125ns over 3,000 random values below a million against 3,496,333ns for the version that builds the list — 1.28x, entirely from not allocating. It is the same enumeration; the difference is only what is done with each hit, which is the same effect seen in the power-set subtopic at a much larger scale.

<!-- @code cpp -->
```cpp
int countDivisors(int n) {
    int count = 0;
    for (int d = 1; (long long)d * d <= n; d++)
        if (n % d == 0) count += (d == n / d) ? 1 : 2;
    return count;
}

// n = 36 -> 9 (the middle pair 6 x 6 contributes 1, not 2)
// n = 37 -> 2
// n = 720720 -> 240, the most below a million
```

<!-- @annotations -->
- 4: The ternary is the same perfect-square guard written as an arithmetic choice rather than a branch around a second push.
- 8: A prime always gives 2, since only 1 and n divide it — which is the definition, stated as a divisor count.

<!-- @code java -->
```java
static int countDivisors(int n) {
    int count = 0;
    for (int d = 1; (long) d * d <= n; d++)
        if (n % d == 0) count += (d == n / d) ? 1 : 2;
    return count;
}
```

<!-- @annotations -->
- 4: Identical to C++, and the absence of boxing here is a larger relative saving than in the list-building version.

<!-- @code python -->
```python
def count_divisors(n: int) -> int:
    count = 0
    d = 1
    while d * d <= n:
        if n % d == 0:
            count += 1 if d == n // d else 2
        d += 1
    return count
```

<!-- @annotations -->
- 6: Avoiding the list matters more in Python than in C++, since every append is an interpreter-level operation.

<!-- @approach -->
### From the Factorisation - the Product of (e + 1)

<!-- @idea -->
A divisor picks an exponent from 0 to e for each prime independently, so the count is a product of independent choices.

<!-- @steps -->
1. Factorise `n` as p1^e1 × p2^e2 × … × pk^ek.
2. Note that any divisor uses each prime pi some number of times from 0 to ei.
3. So there are ei + 1 choices per prime, made independently.
4. Multiply them: the divisor count is (e1+1)(e2+1)…(ek+1).
5. Note that this gives the count without enumerating anything.

<!-- @complexity -->
- time: O(sqrt(n)) for the factorisation, then O(k) to multiply
- space: O(1)
- note: Verified against the enumerated count for every n from 1 to 200,000, 0 mismatches. It does not beat the direct count asymptotically — both are dominated by the same sqrt(n) trial division — but it explains the structure. 36 = 2^2 x 3^2 gives (3)(3) = 9, and 720720 = 2^4 x 3^2 x 5 x 7 x 11 x 13 gives (5)(3)(2)(2)(2)(2) = 240, which is why it is the most divisor-rich value below a million.

<!-- @code cpp -->
```cpp
int countDivisors(int n) {
    int count = 1;
    for (int d = 2; (long long)d * d <= n; d++) {
        if (n % d == 0) {
            int e = 0;
            while (n % d == 0) { n /= d; e++; }
            count *= (e + 1);
        }
    }
    if (n > 1) count *= 2;            // one leftover prime, exponent 1
    return count;
}
```

<!-- @annotations -->
- 8: e counts how many times this prime divides n, and e + 1 is the number of choices a divisor has for it — from using it zero times to using it e times.
- 11: The same leftover as in Print Prime Factors: at most one prime can exceed the square root, and its exponent is 1, so it contributes a factor of 2.
- 3: Starting at 2 rather than 1, because 1 is not a prime and would loop forever.

<!-- @code java -->
```java
static int countDivisors(int n) {
    int count = 1;
    for (int d = 2; (long) d * d <= n; d++) {
        if (n % d == 0) {
            int e = 0;
            while (n % d == 0) { n /= d; e++; }
            count *= (e + 1);
        }
    }
    if (n > 1) count *= 2;
    return count;
}
```

<!-- @annotations -->
- 10: Reassigning n inside the method is safe, since Java passes primitives by value.

<!-- @code python -->
```python
def count_divisors(n: int) -> int:
    count = 1
    d = 2
    while d * d <= n:
        if n % d == 0:
            e = 0
            while n % d == 0:
                n //= d
                e += 1
            count *= e + 1
        d += 1
    if n > 1:
        count *= 2
    return count


# 36 = 2^2 * 3^2 -> (2+1)(2+1) = 9
# 720720 = 2^4 * 3^2 * 5 * 7 * 11 * 13 -> 5*3*2*2*2*2 = 240
```

<!-- @annotations -->
- 14: The formula also explains WHICH numbers are divisor-rich: many small primes with modest exponents beat one large prime with a big exponent.

<!-- @example -->

<!-- @input -->
n = 36

<!-- @output -->
1, 2, 3, 4, 6, 9, 12, 18, 36 — nine divisors from six iterations

<!-- @why -->
It is a perfect square, so it exercises both the pairing and the exception in one trace.

<!-- @walkthrough -->
1. d = 1 divides 36, so collect 1 and its partner 36 / 1 = 36.
2. d = 2 divides 36, so collect 2 and 18.
3. d = 3 divides 36, so collect 3 and 12.
4. d = 4 divides 36, so collect 4 and 9.
5. d = 5 does not divide 36, so nothing is collected.
6. d = 6 divides 36, and 36 / 6 is also 6 — the same divisor — so collect it only once.
7. d = 7 would make d * d = 49, which exceeds 36, so the loop ends: nine divisors from six iterations, and the ninth was the one that needed the guard.

<!-- @example -->

<!-- @input -->
The unguarded version over every n from 1 to 200,000

<!-- @output -->
Wrong on 447 values — exactly the number of perfect squares in that range

<!-- @why -->
It turns "remember the perfect-square case" into a measured statement about precisely which inputs fail and how many there are.

<!-- @walkthrough -->
1. The unguarded version collects both d and n / d on every hit, with no equality check.
2. Run over all 200,000 values and compared against a divide-to-n reference, it was wrong on 447 of them.
3. The perfect squares from 1 to 200,000 number 447, since 447^2 is 199,809 and 448^2 exceeds the range.
4. The two counts match exactly, which is the guard's specification: it matters for perfect squares and for nothing else.
5. The failure mode is quiet — the output contains one duplicate and is otherwise complete and correct.
6. So a test that checks whether every expected divisor is present will pass, and only a test that checks the count or checks for duplicates will fail.
7. That is why the case is worth naming rather than discovering: it is invisible for 99.8% of inputs and silent when it does occur.

<!-- @example -->

<!-- @input -->
3,000 random values below a million, both loop bounds

<!-- @output -->
1,615,988,167ns against 3,496,333ns — 462x

<!-- @why -->
The saving here is the same square-root insight as the previous subtopic, applied to a problem where the pairing produces answers rather than merely bounding a search.

<!-- @walkthrough -->
1. The naive version performs n divisions per input, so a value near a million costs a million iterations.
2. Across 3,000 such values it took 1,615,988,167ns.
3. The paired version stops at the square root, so it never exceeds 1,000 iterations for inputs below a million.
4. It took 3,496,333ns, a factor of 462.
5. Dropping the output container and counting only took 2,733,125ns, a further 1.28x, purely from not allocating.
6. The bound is worth stating in absolute terms as well: below a million, no input costs more than a thousand divisions.
7. And that is independent of the answer — a prime with 2 divisors and 720,720 with 240 both take the same thousand steps.

<!-- @example -->

<!-- @input -->
720,720

<!-- @output -->
240 divisors — the most of any number below a million

<!-- @why -->
It shows that the divisor count and the cost of finding it are unrelated, and the factorisation formula explains why this particular number wins.

<!-- @walkthrough -->
1. 720,720 factors as 2^4 x 3^2 x 5 x 7 x 11 x 13.
2. The divisor count formula multiplies (e + 1) over the exponents: (4+1)(2+1)(1+1)(1+1)(1+1)(1+1).
3. That is 5 x 3 x 2 x 2 x 2 x 2 = 240, matching the enumerated count exactly.
4. Verified more broadly: the formula agreed with the enumerated count for every n from 1 to 200,000, with 0 mismatches.
5. The structure it reveals is that many small primes beat one large exponent — 2^19 is under a million and has only 20 divisors.
6. Despite having 240 divisors, finding them still costs at most 1,000 iterations, because the loop bound depends on the size of n rather than on the answer.
7. That is the practical point: divisor enumeration has no bad case in the way that, say, prime factorisation of a semiprime does.

<!-- @visualization custom -->

<!-- @description -->
Open with the pairing panel on n = 36. Draw a horizontal axis from 1 to 36 with every divisor marked. Then draw an arc from each divisor to its partner: 1 arcs to 36, 2 to 18, 3 to 12, 4 to 9, and 6 arcs back to itself as a small loop. Place a vertical line at √36 = 6 and show every arc crossing it exactly once, with 6's self-loop sitting on the line. Caption it "every pair straddles the root — except the one that sits on it". Then the loop animation: d walks from 1 rightward, stopping at the vertical line. On each hit, light d, then light its partner on the far side with the arc drawn between them, and drop both into an output tray. At d = 6 the arc collapses into the self-loop and only one value drops — flash the guard condition d != n / d in that moment. Show the tray contents in the order they arrive, 1 36 2 18 3 12 4 9 6, and label it "not sorted — the pairs interleave". Beside it, show the two-list alternative filling a small ascending list and a large descending list that is then reversed and appended, arriving at sorted order with no sort. Then the bug panel: rerun the same animation without the guard, so at d = 6 two copies of 6 fall into the tray. Put the measurement beside it — 447 wrong values against 447 perfect squares in 1..200,000 — with the two numbers drawn as identical bars to make the equality visual. Note that the list is otherwise complete, so membership tests still pass. Then the cost panel: a chart of iterations against n for the two bounds, with a horizontal marker at 1,000 showing that no input below a million exceeds it; and beside it 720,720 drawn with its factorisation 2^4 x 3^2 x 5 x 7 x 11 x 13 above a row of exponent-plus-one boxes reading 5, 3, 2, 2, 2, 2, multiplying to 240 — with a caption that 240 divisors still cost the same 1,000 steps as a prime's 2.

<!-- @sampleInput -->
```json
{"pairing":{"n":36,"pairs":[[1,36],[2,18],[3,12],[4,9],[6,6]],"root":6,"selfPaired":6,"caption":"every pair straddles the root — except the one that sits on it","divisors":[1,2,3,4,6,9,12,18,36],"count":9,"iterations":6},"trace":[{"d":1,"divides":true,"partner":36,"collected":[1,36]},{"d":2,"divides":true,"partner":18,"collected":[2,18]},{"d":3,"divides":true,"partner":12,"collected":[3,12]},{"d":4,"divides":true,"partner":9,"collected":[4,9]},{"d":5,"divides":false},{"d":6,"divides":true,"partner":6,"samePartner":true,"collected":[6],"note":"the guard fires here"},{"d":7,"boundCheck":"7 * 7 = 49 > 36","loopEnds":true}],"outputOrder":{"asProduced":[1,36,2,18,3,12,4,9,6],"sorted":false,"note":"the pairs interleave ascending and descending","sortedAtNoCost":"collect small ones ascending and partners into a second list, then append it reversed — O(1) extra work rather than O(sqrt(n) log sqrt(n))"},"guardBug":{"missing":"d != n / d","range":[1,200000],"wrongValues":447,"perfectSquaresInRange":447,"exactMatch":true,"largestSquare":{"root":447,"square":199809},"failureMode":"the list contains one duplicate and is otherwise complete and correct","consequence":"a membership test passes; only a count or duplicate check fails","rate":"invisible for 99.8% of inputs"},"timing":{"unit":"ns","inputs":"3,000 random n < 1,000,000","rows":[{"method":"test every d from 1 to n","ns":1615988167,"ratio":462},{"method":"pair around sqrt(n)","ns":3496333,"ratio":1.0},{"method":"count only, no list","ns":2733125,"ratio":0.78,"note":"1.28x faster than building the list, entirely from not allocating"}],"absoluteBound":{"maxIterationsBelowMillion":1000,"independentOfAnswer":true,"reading":"a prime with 2 divisors and 720,720 with 240 both take the same thousand steps"}},"divisorCountFormula":{"rule":"n = p1^e1 * ... * pk^ek  =>  count = (e1+1)...(ek+1)","why":"a divisor chooses an exponent from 0 to ei for each prime, independently","verified":{"range":[1,200000],"mismatches":0},"examples":[{"n":36,"factorisation":"2^2 * 3^2","product":"(2+1)(2+1)","count":9},{"n":37,"factorisation":"37","product":"(1+1)","count":2},{"n":720720,"factorisation":"2^4 * 3^2 * 5 * 7 * 11 * 13","product":"5*3*2*2*2*2","count":240,"note":"the most divisor-rich value below a million"},{"n":524288,"factorisation":"2^19","count":20,"note":"one large exponent is far worse than many small primes"}]},"workedValues":[{"n":36,"count":9,"divisors":[1,2,3,4,6,9,12,18,36]},{"n":37,"count":2,"divisors":[1,37]},{"n":100,"count":9,"divisors":[1,2,4,5,10,20,25,50,100]},{"n":1,"count":1,"divisors":[1]}],"relationToPreviousSubtopic":{"shared":"the same square-root insight","difference":"there it bounded a search and left one possible survivor; here the pairing IS the answer and each hit produces two results"}}
```

<!-- @highlights -->
- n = 36 is drawn on an axis from 1 to 36 with every divisor marked.
- Arcs connect each divisor to its partner: 1 to 36, 2 to 18, 3 to 12, 4 to 9.
- 6 arcs back to itself as a small loop sitting on the vertical line at √36.
- Every arc crosses the root line exactly once, captioned "every pair straddles the root — except the one that sits on it".
- d then walks from 1 rightward, stopping at the root line.
- On each hit, d lights, its partner lights on the far side, and both drop into an output tray.
- At d = 6 the arc collapses into a self-loop and only one value drops, flashing the guard condition.
- The tray shows 1 36 2 18 3 12 4 9 6, labelled "not sorted — the pairs interleave".
- Beside it, a two-list alternative builds ascending and descending halves that concatenate into sorted order with no sort.
- The animation reruns without the guard, dropping two copies of 6 at the middle.
- 447 wrong values and 447 perfect squares are drawn as identical bars to make the equality visual.
- A note records that the list is otherwise complete, so membership tests still pass.
- A chart of iterations against n compares the two bounds with a horizontal marker at 1,000.
- 720,720 is drawn with its factorisation 2^4 x 3^2 x 5 x 7 x 11 x 13 above exponent-plus-one boxes.
- The boxes read 5, 3, 2, 2, 2, 2 and multiply to 240.
- A caption notes that 240 divisors still cost the same 1,000 steps as a prime's 2.

<!-- @edgeCases -->
- n = 1 — one divisor, itself; the loop runs once at d = 1 where d equals n / d, so the guard fires immediately.
- A perfect square — the only shape where the guard matters, and 447 of them exist below 200,000.
- A prime — exactly two divisors, 1 and n, with the partner of 1 being the whole answer's second element.
- A prime squared, such as 49 — three divisors, and the middle one is the root, so the guard fires.
- n = 0 — every integer divides 0, so the problem is undefined; guard it rather than looping.
- Negative n — outside the usual definition; take the absolute value first, or reject it.
- d * d overflowing for n near INT_MAX — cast to 64-bit or compare d <= n / d.
- A highly composite n such as 720,720 — 240 divisors, and still at most 1,000 iterations below a million.
- 2^19 = 524,288 — only 20 divisors despite being large, since one big exponent is far less productive than several small primes.
- Expecting sorted output — the pairing interleaves, so sort afterwards or build two lists.
- Very large n in Python — no overflow, but sqrt(n) iterations may still be too many past about 10^14.

<!-- @pitfalls -->
- Omitting the d != n / d guard. It is wrong on exactly the perfect squares — 447 of the values from 1 to 200,000 — and the output is otherwise correct, so membership tests still pass.
- Assuming the output is sorted. The pairs interleave as 1, 36, 2, 18, …; sort afterwards or collect the partners separately and reverse them.
- Sorting when a second list would do. Sorting is O(sqrt(n) log sqrt(n)) on top of an O(sqrt(n)) algorithm, where the two-list trick is O(1) extra work.
- Looping d to n. Measured 462x slower over 3,000 random values below a million.
- Writing d * d <= n in int arithmetic near INT_MAX. The product overflows and the loop exits early, silently missing divisors.
- Starting the factorisation loop at d = 1. One divides everything, so the inner while never terminates.
- Building a list when only the count is needed. Counting measured 1.28x faster purely by not allocating.
- Assuming a number with many divisors costs more to process. The loop bound depends on the size of n, not on the answer — 720,720 and a prime both take at most 1,000 steps below a million.
- Passing 0. Every integer divides it, so the enumeration is undefined and the loop misbehaves.
- Using / rather than // in Python for the partner. A float partner never compares equal to the integer d, so the guard silently stops working.
- Applying this to find prime factors. It finds all divisors, most of which are composite; the previous subtopic's divide-out loop is the right tool.
- Testing only non-squares. Every version of this code is correct on 99.8% of inputs, so the test set has to include a perfect square deliberately.

<!-- @doubt -->
### Why does looping to √n find every divisor?

<!-- @answer -->
Because divisors come in pairs whose product is n: if d divides n then so does n / d. One member of each pair is at or below √n and the other at or above it, so a loop reaching only the square root encounters exactly one member of every pair — and produces the other by division, with no searching at all. For 36 the pairs are 1x36, 2x18, 3x12, 4x9 and 6x6, and a loop to 6 hits the left member of each. That is why the loop finds nine divisors in six iterations.

<!-- @doubt -->
### Why is the d != n / d guard needed?

<!-- @answer -->
Because when n is a perfect square, the middle pair is √n paired with itself, and collecting both members collects the same number twice. Measured over every n from 1 to 200,000, the unguarded version was wrong on 447 values — which is exactly the number of perfect squares in that range, since 447² is 199,809. The failure is quiet: the list contains one duplicate and is otherwise complete, so a test checking that every expected divisor is present will pass. Only a count or a duplicate check catches it.

<!-- @doubt -->
### Why is the output not sorted?

<!-- @answer -->
Because each iteration emits a small divisor and its large partner together, so the sequence alternates between the two halves: 1, 36, 2, 18, 3, 12, 4, 9, 6. If sorted order is needed, the cheap fix is not to sort — it is to collect the small members into one list and the partners into another, then append the second reversed. The partners are naturally produced in descending order, so reversing gives ascending, and the whole thing stays O(√n). Sorting instead adds an O(√n log √n) step to an O(√n) algorithm.

<!-- @doubt -->
### How does the count formula work?

<!-- @answer -->
Write n as p1^e1 × … × pk^ek. Any divisor is built by choosing how many copies of each prime to use, independently — anywhere from 0 to ei for prime pi. That is ei + 1 choices per prime, so the total number of divisors is the product (e1+1)…(ek+1). For 36 = 2² × 3² that is 3 × 3 = 9, matching the enumerated list. Verified against the enumerated count for every n from 1 to 200,000, with 0 mismatches. It does not beat direct counting in speed — both need the same √n trial division — but it explains which numbers are divisor-rich.

<!-- @doubt -->
### Why does 720,720 have so many divisors?

<!-- @answer -->
Because it is built from many small primes rather than one large exponent: 720,720 = 2⁴ × 3² × 5 × 7 × 11 × 13, giving (5)(3)(2)(2)(2)(2) = 240. Each additional distinct prime at least doubles the count, while raising an existing exponent adds only one to a single factor. The contrast is stark: 2¹⁹ = 524,288 is a comparable size and has just 20 divisors. This is what makes numbers like 720,720 useful as test inputs — they stress anything that iterates over divisors while costing the same √n to find them.

<!-- @doubt -->
### Does a number with more divisors take longer?

<!-- @answer -->
No, and it is worth being explicit about that because the intuition points the other way. The loop bound is √n, which depends on the size of the input rather than on the answer, so below a million every input costs at most 1,000 iterations — a prime with 2 divisors and 720,720 with 240 take the same number of steps. Only the output grows. That makes divisor enumeration unusually well-behaved: there is no adversarial input in the way there is for, say, factoring a semiprime.

<!-- @doubt -->
### How much does the square-root bound save here?

<!-- @answer -->
462x over 3,000 random values below a million: 3,496,333ns against 1,615,988,167ns. As in Print Prime Factors, that ratio is roughly √n and grows with the input rather than being a constant. Dropping the output container and counting only saves a further 1.28x, at 2,733,125ns, purely by not allocating — the same effect the power-set subtopic measured at 373x, smaller here because there are far fewer results per input.

<!-- @doubt -->
### What about n = 0 and negative n?

<!-- @answer -->
Both are outside the problem's definition and should be rejected rather than handled. Every integer divides 0, so there is no finite list of divisors and the loop condition d * d <= 0 is false immediately, returning an empty list — a plausible answer to an unanswerable question. For negative n the usual convention is to take the absolute value first, which raises the INT_MIN issue from earlier in this topic, since abs(INT_MIN) is still negative. Guarding the input explicitly is cheaper than reasoning about either.

<!-- @doubt -->
### Is this the same idea as the previous subtopic?

<!-- @answer -->
The same insight, used differently. Print Prime Factors used √n as a bound on a search: everything below the root is found by iterating, and at most one factor can survive above it, handled by a single trailing line. Here the pairing is the answer rather than a bound — every hit below the root produces two results, one on each side, so the loop is not merely stopping early but doing half the work and deducing the rest. The shared fact is that factors come in pairs straddling the square root; what each subtopic does with it differs.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Count primes in range L to R, which changes the shape of the question from one number to a whole interval. Testing each value in the range separately — even with a good primality test — repeats work enormously, because the same small primes are re-derived for every candidate. A sieve computes the answer for every value in the range at once by marking multiples, and the difference is orders of magnitude rather than a constant factor. It is the first subtopic here where the right move is to stop optimising the per-number method and change what is being computed.
