---
id: factorial-of-a-given-number
topic: Basic Recursion
title: Factorial of a given number
difficulty: Easy
status: ready
prerequisites:
  - sum-of-first-n-numbers
  - print-n-to-1-using-recursion
  - understand-recursion-by-print-something-n-times
  - data-types
  - stack-memory-and-recursion-depth
relatedIds:
  - reverse-an-array
  - sum-of-first-n-numbers
  - fibonacci-number
  - data-types
  - stack-memory-and-recursion-depth
---

<!-- @summary -->
The same skeleton as Sum of First N Numbers with multiplication in place of addition — and the first problem in this topic where the type runs out long before the stack does. The recursion happily runs 173,828 frames deep; the answer stops being correct at n = 21. Only 0.0115% of the depth the machine offers is usable, which means the entire correct domain of a 64-bit factorial is 21 values.

<!-- @theory -->
## The problem

Return `n! = n × (n-1) × … × 2 × 1`, with `0! = 1`.

```
n = 5   ->   120
n = 10  ->   3628800
n = 0   ->   1
```

## One operator away from the last subtopic

```
sumToN(n):                        factorial(n):
    if n <= 0: return 0               if n <= 1: return 1
    return n + sumToN(n - 1)          return n * factorial(n - 1)
```

Two edits: `+` becomes `*`, and the base case returns **1** instead of **0**. Both
are the identity element of their operation — the value that leaves the running
result alone — and picking it correctly is the whole of what the base case does.

The difference in what happens when you get it wrong is much larger than the
difference in the code. Returning `1` from the sum's base case made every answer
exactly one too high. Returning `0` from factorial's base case makes every answer
**zero**, for every input:

| Base case | n=0 | n=1 | n=3 | n=5 | n=10 |
|---|---|---|---|---|---|
| `if (n <= 1) return 1` | 1 | 1 | 6 | 120 | 3628800 |
| `if (n <= 1) return 0` | **0** | **0** | **0** | **0** | **0** |
| `if (n <= 0) return 1` | 1 | 1 | 6 | 120 | 3628800 |

Zero is the *annihilator* for multiplication, not the identity. One wrong constant
and the function returns a single value for its entire domain.

## The limit moved

Every subtopic in this topic so far has been bounded by recursion depth. Printing
N times died at 261,000 frames. Sum of First N Numbers died at 174,254. Python
stopped at 998.

Factorial is not bounded by depth in any way that matters. Compiled at `-O0` the
recursion runs to **n = 173,828** before the stack is exhausted — essentially the
same as the sum, because the frame is the same size. But:

| Type | Last n whose factorial fits | The next one |
|---|---|---|
| `int` (32-bit) | **12** — 479,001,600 | 13! = 6,227,020,800, **2.90x** the limit |
| `unsigned` (32-bit) | 12 | 1.45x the limit |
| `long long` (64-bit) | **20** — 2,432,902,008,176,640,000 | 21! = 51,090,942,171,709,440,000, **5.54x** |
| `unsigned long long` | 20 | 2.77x |

So the recursion is correct for 20 of the 173,828 inputs it will accept without
crashing — **0.0115%**. The depth exceeds the useful range by a factor of
**8,691**. For the first time in this topic the interesting limit is not the
machine's; it is the type's.

## Overflow here is unusually hard to see

A wrapped sum tends to announce itself by going negative. A wrapped factorial does
not, for a while. With a 32-bit `int`:

| n | Exact | What `int` returns |
|---|---|---|
| 12 | 479,001,600 | 479,001,600 |
| **13** | 6,227,020,800 | **1,932,053,504** |
| 14 | 87,178,291,200 | 1,278,945,280 |
| 15 | 1,307,674,368,000 | 2,004,310,016 |
| 16 | 20,922,789,888,000 | 2,004,189,184 |
| 17 | 355,687,428,096,000 | −288,522,240 |

Three cheap sanity checks, and where each one first fires:

- the first **wrong** answer is at **13!**
- the first value that **decreases** is at **14!** — so "did it grow?" misses 13! by one step
- the first **negative** value is at **17!** — so "is it positive?" misses **four** wrong answers

13! comes back as 1,932,053,504: positive, larger than 12!, and comfortably inside
the range of an `int`. Nothing about it looks wrong.

## A double holds more than you would guess

The obvious reasoning says a `double` has a 53-bit mantissa, so it should stop
being exact once n! exceeds 2^53 = 9,007,199,254,740,992, which happens at 19!.
Measured, it stays exact all the way to **22!**:

| n | n! | Bits | Trailing zero bits | Exact as a double? |
|---|---|---|---|---|
| 20 | 2,432,902,008,176,640,000 | 62 | 18 | **yes** |
| 22 | 1,124,000,727,777,607,680,000 | 70 | 19 | **yes** |
| 23 | 25,852,016,738,884,976,640,000 | 75 | 19 | no |

A factorial collects a factor of 2 from every even term, so it ends in a long run
of zero bits that the mantissa does not have to store. 20! is a 62-bit number but
only 44 of those bits are significant. The exponent carries the rest.

This does not rescue anything — a `double` gives you two more values than
`long long` and loses exactness silently after that — but it is worth knowing that
"53 bits" is the wrong way to predict where floating point stops being exact for
numbers of this shape.

## The compiler goes exactly as far as the mathematics allows

Sum of First N Numbers ended with the compiler solving the recurrence outright at
`-O2`. Factorial has the same associative-accumulation shape, so the same
machinery applies — up to a point:

| | `-O0` | `-O1` | `-O2` |
|---|---|---|---|
| `n + f(n-1)` | recursion, 26 instrs | loop, 11 instrs | **closed form**, 12 instrs, no loop |
| `n * f(n-1)` | recursion, 27 instrs | loop, 11 instrs | **loop**, 43 instrs, 4x unrolled |

Both lose their recursive call at `-O1`. At `-O2` the sum becomes arithmetic and
factorial stays a loop — because `1 + 2 + … + n` has a closed form and
`1 × 2 × … × n` does not.

What `-O2` does instead is worth seeing: it splits the product into **four
independent running products** and multiplies them together at the end.

```
LBB0_5:
    mul  x11, x0,  x11        ; four accumulators, so four multiplies
    mul  x13, x16, x13        ; can be in flight at once instead of
    mul  x14, x17, x14        ; waiting on one dependency chain
    mul  x15, x1,  x15
    ...
    mul  x11, x13, x11        ; recombine
    mul  x11, x14, x11
    mul  x0,  x15, x11
```

That is a latency optimisation, not an algorithmic one. It is still O(n).

## Which is why none of the three forms differ

Per call at `-O2`, median of seven alternated rounds:

| | n = 12 | n = 20 |
|---|---|---|
| `n * f(n-1)` | 4.70ns | 6.14ns |
| Accumulator | 4.79ns | 6.15ns |
| Loop | 4.72ns | 6.41ns |

Identical, because all three compile to that same unrolled loop. The accumulator
rewrite is worth nothing here, exactly as it was worth nothing for the sum.

## So write the table

Here is the practical conclusion, and it follows from the range rather than from
anything about recursion. A 64-bit factorial has **21 valid inputs**. That is not
a lot of inputs. The whole function is:

```
FACT[21] = { 1, 1, 2, 6, 24, …, 2432902008176640000 }
factorial(n) = n in 0..20 ? FACT[n] : error
```

Measured at n = 20: **0.53ns against the recursion's 6.55ns**, a factor of 12.4 —
and it cannot overflow, because every value it can return is one you checked when
you wrote it down. All 21 entries verified against an independent running product.

The reason to still write the recursion is that it is the clearest statement of
what a factorial *is*, and the shape transfers to problems whose domain is not 21
values wide.

## Python has neither problem

Python integers do not overflow, so the limit that dominates this subtopic in C++
simply does not exist — `math.factorial(1000)` returns an exact 2,568-digit
number. What Python has instead is the depth limit, which bites at n = 1,000
(the deepest that completes is **999**, one further than the sum's 998, because
this base case stops one step earlier).

Per call, median of seven:

| | n = 12 | n = 20 | n = 20,000 |
|---|---|---|---|
| `n * f(n-1)` | 799.6ns | 1,463.3ns | — |
| Accumulator | 862.8ns | 1,568.7ns | — |
| Loop | 369.2ns | 736.3ns | 226.0ms |
| `math.factorial` | **40.0ns** | **37.4ns** | **16.7ms** |

Two things stand out. `math.factorial` is flat between n = 12 and n = 20 — it is
not looping at that size. And its advantage over a naive loop *grows* with n, from
7.0x at n = 1,000 to **13.5x** at n = 20,000, because multiplying two big integers
of similar size is cheaper than repeatedly multiplying a huge one by a small one.

## Where this goes next

**Reverse an array** changes what a frame is for. Every recursion in this topic so
far has either printed something or returned a number; that one does neither — it
swaps two elements and returns nothing, and its effect is the only thing left once
the frames are gone. It also moves two indices toward each other instead of one
counter downward, which halves the frame count and is the first time the depth
stops being n.

<!-- @intuition -->
The definition is the code: n! is n times (n-1)!, and 0! is 1. The only thing worth pausing on is why the base case returns 1 rather than 0, and the answer is that its value gets multiplied into everything above it — so it has to be the number that changes nothing, which for multiplication is 1. Choose 0 and every answer collapses to 0, because 0 does not leave a product alone, it destroys it. Beyond that the interesting part of this problem is not the recursion at all: factorials grow so fast that a 32-bit integer runs out at n = 12 and a 64-bit one at n = 20, while the call stack would happily go a hundred thousand frames deeper. That inversion — the type failing long before the machine — is the thing to take away.

<!-- @approach -->
### Iteration - The Running Product

<!-- @idea -->
Start a product at one and multiply in each value from two up to n.

<!-- @steps -->
1. Start the result at one, which is what an empty product is worth.
2. Step a counter from two up to n inclusive.
3. Multiply the counter into the result at each step.
4. Return the result, which is already correct for n of zero or one.
5. Reject n above the largest value the return type can hold.

<!-- @complexity -->
- time: O(n), but n can never usefully exceed 20
- space: O(1)
- note: Starting from two rather than one saves a redundant multiply by 1 and makes 0! and 1! fall out without a special case. The real constraint is the type: with a 64-bit result the loop is correct up to n = 20 and silently wrong from n = 21, so the bound belongs in the code rather than in a comment.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

long long factorial(int n) {
    if (n < 0 || n > 20) return -1;      // 21! does not fit in 64 bits

    long long result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
```

<!-- @annotations -->
- 5: n > 20 is the real bound. 21! is 51,090,942,171,709,440,000, which is 5.54x the signed 64-bit maximum.
- 7: Starting at 1, the identity element — the same choice the recursive base case makes.
- 8: i starts at 2, since multiplying by 1 changes nothing. This also makes n of 0 and 1 return 1 with no special case.

<!-- @code java -->
```java
static long factorial(int n) {
    if (n < 0 || n > 20) throw new IllegalArgumentException("n must be 0..20");

    long result = 1;
    for (int i = 2; i <= n; i++) {
        result *= i;
    }
    return result;
}
```

<!-- @annotations -->
- 2: Java's long is 64-bit and wraps silently on overflow exactly as C++ does, so the same bound of 20 applies. BigInteger is the escape if you need more.

<!-- @code python -->
```python
def factorial(n):
    if n < 0:
        raise ValueError("n must be non-negative")
    result = 1
    for i in range(2, n + 1):
        result *= i
    return result


# No upper bound is needed — Python integers do not overflow.
# But prefer math.factorial: measured 40.0ns against this loop's
# 369.2ns at n = 12, and 13.5x faster at n = 20,000.
```

<!-- @annotations -->
- 2: The only bound Python needs is the lower one, since there is no largest representable integer.
- 5: range(2, n + 1), so n itself is included — dropping the plus one silently returns n! divided by n.

<!-- @approach -->
### Recursion - Multiply on the Way Out

<!-- @idea -->
Return n times the factorial of n minus one, with one as the base case.

<!-- @steps -->
1. Take a single parameter n.
2. If n is one or less, return one — the empty product, and the correct answer for both 0! and 1!.
3. Otherwise call the function with n minus one.
4. Multiply n into whatever that call returns.
5. Return the product, which the caller in turn multiplies into.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack as written, O(1) at -O1 and above
- note: The multiplication is pending after the call, so this is not a tail call — and as with the sum it does not matter, because the compiler converts it to a loop at -O1. At -O2 it becomes a four-way unrolled loop, but not closed-form arithmetic, since a factorial has no closed form. Measured 4.70ns at n = 12 against the loop's 4.72ns.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

long long factorial(int n) {
    if (n <= 1) return 1;                // 0! and 1! are both 1

    return n * (long long)factorial(n - 1);
}
```

<!-- @annotations -->
- 5: Two decisions on one line. return 1, not 0 — zero is the annihilator for multiplication, so a base case of 0 makes every answer 0 for every input. And n <= 1, not n == 1: testing for equality never matches a negative n, so the chain runs until the stack dies, measured as SIGSEGV, exit status 139.
- 7: The cast keeps the multiply in 64 bits. Without it, n * factorial(...) is computed in int for a 32-bit n and wraps from n = 13. This is also not a tail call, and it makes no difference: -O1 turns it into a loop with zero self-calls remaining.

<!-- @code java -->
```java
static long factorial(int n) {
    if (n <= 1) return 1L;

    return n * factorial(n - 1);
}
```

<!-- @annotations -->
- 4: factorial returns long, so n is widened before the multiply and the product is computed in 64 bits. Had both operands been int, the result would wrap from n = 13.

<!-- @code python -->
```python
def factorial(n):
    if n <= 1:
        return 1
    return n * factorial(n - 1)


# Correct for any n, since Python integers do not overflow — but the
# recursion limit does apply: the deepest n that completes at the
# default limit of 1,000 is 999.
```

<!-- @annotations -->
- 2: n <= 1 rather than n == 1, so a negative n returns 1 instead of recursing forever.
- 4: Measured 799.6ns at n = 12 against the loop's 369.2ns — 2.17x, and unlike C++ that gap does not close at any setting.

<!-- @approach -->
### Recursion with an Accumulator

<!-- @idea -->
Carry the running product down as a second parameter so nothing is left pending after the call.

<!-- @steps -->
1. Take two parameters, the remaining n and the accumulated product.
2. If n is one or less, return the accumulator — it already holds the answer.
3. Otherwise multiply n into the accumulator.
4. Call the function with n minus one and the new accumulator.
5. Return that result directly, with no work after the call.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack as written, O(1) once eliminated
- note: A true tail call, and worth nothing measurable — 4.79ns against 4.70ns at n = 12, because both compile to the same unrolled loop. In Python it is slower, 862.8ns against 799.6ns, since the extra argument costs something and tail position buys nothing. The starting value must be 1, for the same reason the other form's base case returns 1.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

long long factorialFrom(int n, long long acc) {
    if (n <= 1) return acc;

    return factorialFrom(n - 1, acc * n);   // nothing pending after this
}

long long factorial(int n) { return factorialFrom(n, 1); }
```

<!-- @annotations -->
- 5: The base case returns the accumulator rather than 1, because the product was built on the way down instead of on the way back.
- 7: A genuine tail call — and it compiles to the same loop as the version without an accumulator, so it wins nothing.
- 10: The wrapper supplies the starting value 1, which is the identity element the other form returns from its base case.

<!-- @code java -->
```java
static long factorialFrom(int n, long acc) {
    if (n <= 1) return acc;

    return factorialFrom(n - 1, acc * n);
}

static long factorial(int n) { return factorialFrom(n, 1L); }
```

<!-- @annotations -->
- 4: Java performs no tail-call elimination, so this form costs an extra argument per frame and saves nothing at all.

<!-- @code python -->
```python
def factorial_from(n, acc=1):
    if n <= 1:
        return acc
    return factorial_from(n - 1, acc * n)


# Measured 862.8ns against 799.6ns for the version without an
# accumulator at n = 12 — in Python this rewrite makes it SLOWER.
```

<!-- @annotations -->
- 1: The default of 1 is the identity element; writing acc=0 here would return 0 for every input.
- 4: Two arguments per frame instead of one, and no reward for tail position, which is why this measured slower.

<!-- @approach -->
### The Lookup Table

<!-- @idea -->
Write down all twenty-one factorials a 64-bit integer can hold and index into them.

<!-- @steps -->
1. Note that 20! is the largest factorial that fits in 64 bits.
2. Precompute the twenty-one values from 0! to 20! once.
3. Reject any n outside zero to twenty.
4. Return the entry at index n.
5. Verify every entry against an independent computation when you write it.

<!-- @complexity -->
- time: O(1)
- space: O(1) — 168 bytes
- note: The entire correct domain of a 64-bit factorial is 21 values, so this is not an optimisation trick but the whole function. Measured 0.53ns against the recursion's 6.55ns at n = 20, a factor of 12.4, and it cannot overflow because every value it can return was checked when it was written. All 21 entries verified against a running product.

<!-- @code cpp -->
```cpp
#include <cstdint>
#include <iterator>
using namespace std;

static const uint64_t FACT[21] = {
    1ULL, 1ULL, 2ULL, 6ULL, 24ULL, 120ULL, 720ULL, 5040ULL, 40320ULL,
    362880ULL, 3628800ULL, 39916800ULL, 479001600ULL, 6227020800ULL,
    87178291200ULL, 1307674368000ULL, 20922789888000ULL, 355687428096000ULL,
    6402373705728000ULL, 121645100408832000ULL, 2432902008176640000ULL };

bool factorial(int n, uint64_t &out) {
    if (n < 0 || n >= (int)size(FACT)) return false;
    out = FACT[n];
    return true;
}
```

<!-- @annotations -->
- 5: Twenty-one entries, indices 0 through 20 — the complete set a 64-bit result can represent.
- 11: Returning a bool rather than a sentinel makes the out-of-range case impossible to ignore by accident.
- 12: The bound is the table's own size, so the range check and the data can never disagree.

<!-- @code java -->
```java
static final long[] FACT = {
    1L, 1L, 2L, 6L, 24L, 120L, 720L, 5040L, 40320L, 362880L, 3628800L,
    39916800L, 479001600L, 6227020800L, 87178291200L, 1307674368000L,
    20922789888000L, 355687428096000L, 6402373705728000L,
    121645100408832000L, 2432902008176640000L };

static long factorial(int n) {
    if (n < 0 || n >= FACT.length) throw new IllegalArgumentException("n must be 0..20");
    return FACT[n];
}
```

<!-- @annotations -->
- 8: Checking against FACT.length rather than a literal 20 keeps the bound and the data in step.

<!-- @code python -->
```python
from math import factorial


# Python needs no table: math.factorial is exact for any n and
# measured 40.0ns against a hand-written loop's 369.2ns at n = 12.
# Its lead grows with n — 7.0x at n = 1,000 and 13.5x at n = 20,000 —
# because it multiplies similarly-sized halves rather than repeatedly
# multiplying one huge number by a small one.
```

<!-- @annotations -->
- 1: The table exists in C++ only because the range is finite there. Python's integers have no width, so the standard library function is both exact and faster.

<!-- @example -->

<!-- @input -->
n = 5, through the recursive version

<!-- @output -->
120 — assembled entirely on the way back out

<!-- @why -->
The same frame-by-frame shape as Sum of First N Numbers with one operator changed, which makes the role of the identity element in the base case visible.

<!-- @walkthrough -->
1. factorial(5) cannot return yet — it needs factorial(4) before it can multiply by 5.
2. The same happens at 4, 3 and 2, so four frames are stacked with a multiplication waiting in each.
3. factorial(1) matches the base case and returns 1, the value that leaves a product unchanged.
4. That 1 goes back to the frame holding 2, which returns 2 × 1, or 2.
5. The frame holding 3 returns 3 × 2, or 6, and the frame holding 4 returns 4 × 6, or 24.
6. The outermost frame returns 5 × 24, or 120.
7. Had the base case returned 0 instead, every one of those multiplications would have produced 0, and the answer would be 0 for every input.

<!-- @example -->

<!-- @input -->
The recursion run past the range of its return type

<!-- @output -->
Correct to n = 20, silently wrong from n = 21, and it never crashes

<!-- @why -->
It is the inversion this subtopic exists for: every earlier problem in this topic was limited by the stack, and this one is limited by the type long before the stack is anywhere near full.

<!-- @walkthrough -->
1. Compiled at -O0 the recursion runs to n = 173,828 before exhausting the stack.
2. With a 64-bit result the last correct answer is 20! — 2,432,902,008,176,640,000.
3. 21! is 51,090,942,171,709,440,000, which is 5.54 times the signed 64-bit maximum.
4. So 20 of the 173,828 inputs it will accept produce a correct answer, which is 0.0115% of them.
5. With a 32-bit int the last correct answer is 12!, and 13! is only 2.90x past that limit.
6. Nothing crashes, nothing warns, and the returned value stays inside the type's range.
7. The bound therefore has to be written into the function, because neither the machine nor the compiler will supply it.

<!-- @example -->

<!-- @input -->
Three cheap overflow checks applied to a 32-bit factorial

<!-- @output -->
The first wrong answer is at 13!, the first decrease at 14!, the first negative at 17!

<!-- @why -->
It shows why detecting this after the fact does not work, which is the argument for a range check before the computation rather than a sanity check after it.

<!-- @walkthrough -->
1. 12! is 479,001,600 and fits an int with room to spare.
2. 13! should be 6,227,020,800; the int version returns 1,932,053,504.
3. That value is positive, is larger than 12!, and sits well inside the range of an int.
4. So a check for a negative result does not fire, and neither does a check that the sequence is still growing.
5. The first value that decreases is 14!, which returns 1,278,945,280 — smaller than 13! did.
6. The first negative value is 17!, by which point four wrong answers have already been returned.
7. Checking n against 20 before multiplying anything is the only test that catches all of them.

<!-- @example -->

<!-- @input -->
The same source compiled at -O0, -O1 and -O2, beside the sum from the previous subtopic

<!-- @output -->
Both become loops; only the sum becomes arithmetic

<!-- @why -->
It shows the optimiser stopping exactly where the mathematics stops, which is a sharper statement than either subtopic makes alone.

<!-- @walkthrough -->
1. At -O0 both functions contain one call to themselves, in 26 and 27 instructions.
2. At -O1 both lose the self-call and become loops of 11 instructions.
3. At -O2 the sum collapses to 12 instructions with no loop at all — a multiply and a shift, which is n(n+1)/2.
4. At -O2 the factorial is 43 instructions and still contains a loop.
5. The reason is not that multiplication is harder but that 1 + 2 + … + n has a closed form and 1 × 2 × … × n does not.
6. What -O2 does instead is split the product across four independent accumulators and combine them at the end.
7. That removes the dependency chain between successive multiplies, which is a latency win rather than an algorithmic one — it is still O(n).

<!-- @visualization custom -->

<!-- @description -->
Two panels that must be read against each other, because the point is the mismatch between them. On the left, the call stack in the same column layout the previous subtopics used: run factorial(5), push five frames each carrying a pending slot reading n x ?, light the base case returning 1 and label it the identity element, then drain upward as the value box fills 1, 2, 6, 24, 120. Beside that base case put a small toggle showing what happens if it returns 0 instead — the value box then fills 0, 0, 0, 0, 0, and every frame should grey out as the zero propagates, since one wrong constant flattens the whole domain. On the right, and this is the panel that carries the subtopic, a single horizontal axis for n running from 0 to 173,828, drawn logarithmically so the whole range is visible. Mark the stack limit at the far right end at 173,828 and label it where the recursion stops. Then mark 20 and 12 near the extreme left — so close to the origin they need a leader line — labelled last correct with a 64-bit type and last correct with a 32-bit type. The band between 20 and 173,828 should be filled with a hatch and labelled runs fine, answers are wrong, and it should visibly occupy almost the entire axis: the correct region is 0.0115% of it. Under that axis, the detection strip: a row of cells for n = 12 through 17 showing the value an int returns, coloured green at 12 and red from 13 onward, with three markers beneath pointing at different cells — first wrong at 13, first decrease at 14, first negative at 17 — so the gap between when the answer breaks and when a naive check would notice is a visible distance rather than a claim. Finally a small optimiser ladder shared with the previous subtopic: three rungs labelled -O0, -O1, -O2, with the sum and the factorial side by side on each, identical at the first two rungs and diverging at the third, where the sum's box shows three arithmetic operations and no loop while the factorial's shows a loop with four parallel multiply lanes feeding one combine step.

<!-- @sampleInput -->
```json
{"primary":{"n":5,"form":"n * factorial(n-1)","descent":[{"call":"factorial(5)","pending":"5 x ?"},{"call":"factorial(4)","pending":"4 x ?"},{"call":"factorial(3)","pending":"3 x ?"},{"call":"factorial(2)","pending":"2 x ?"},{"call":"factorial(1)","pending":null,"baseCase":true,"returns":1}],"unwind":[{"frame":"n=2","computes":"2 x 1","returns":2},{"frame":"n=3","computes":"3 x 2","returns":6},{"frame":"n=4","computes":"4 x 6","returns":24},{"frame":"n=5","computes":"5 x 24","returns":120}],"result":120,"peakFrames":5,"identityElement":1,"ifBaseCaseWere0":{"unwind":[0,0,0,0],"result":0,"note":"0 is the annihilator for multiplication, not the identity — every answer becomes 0"}},"identityComparison":[{"operation":"+","identity":0,"wrongConstant":1,"effect":"every answer is one too high"},{"operation":"x","identity":1,"wrongConstant":0,"effect":"every answer is 0, for every input"}],"baseCases":[{"written":"if (n <= 1) return 1","correct":true,"atN0":1,"atN1":1,"atN3":6,"atN5":120,"atN10":3628800},{"written":"if (n <= 1) return 0","atN0":0,"atN1":0,"atN3":0,"atN5":0,"atN10":0,"effect":"every answer is 0"},{"written":"if (n <= 0) return 1","correct":true,"note":"also correct, one frame deeper"},{"written":"if (n == 1) return 1","atNegative":"never matches — SIGSEGV, exit status 139"}],"theLimitMoved":{"stackDepthAtO0":173828,"lastCorrect":{"int32":12,"uint32":12,"int64":20,"uint64":20},"usableFractionOfDepth":"0.0115%","depthExceedsRangeBy":8691,"values":{"12!":479001600,"13!":6227020800,"20!":2432902008176640000,"21!":51090942171709440000},"pastTheLimit":{"13! vs int32 max":"2.90x","21! vs int64 max":"5.54x","21! vs uint64 max":"2.77x"},"contrastWithEarlierSubtopics":{"printNTimes":261000,"sumOfFirstN":174254,"pythonLimit":998,"note":"all bounded by depth; this one is bounded by the type"}},"overflowDetection":{"type":"int32","rows":[{"n":12,"exact":479001600,"returned":479001600,"correct":true},{"n":13,"exact":6227020800,"returned":1932053504},{"n":14,"exact":87178291200,"returned":1278945280},{"n":15,"exact":1307674368000,"returned":2004310016},{"n":16,"exact":20922789888000,"returned":2004189184},{"n":17,"exact":355687428096000,"returned":-288522240}],"firstWrong":13,"firstDecrease":14,"firstNegative":17,"reading":"a positivity check misses four wrong answers; a monotonicity check misses 13! by one step"},"doubleExactness":{"naiveExpectation":"fails past 2^53 = 9007199254740992, i.e. from 19!","measuredLastExact":22,"firstInexact":23,"why":"a factorial collects a factor of 2 from every even term, so it ends in a long run of zero bits the mantissa need not store","rows":[{"n":20,"value":2432902008176640000,"bits":62,"trailingZeroBits":18,"exact":true},{"n":22,"bits":70,"trailingZeroBits":19,"exact":true},{"n":23,"bits":75,"trailingZeroBits":19,"exact":false}]},"optimiser":{"rows":[{"source":"n + f(n-1)","O0":{"selfCalls":1,"instructions":26},"O1":{"selfCalls":0,"instructions":11,"shape":"loop"},"O2":{"selfCalls":0,"instructions":12,"shape":"closed form"}},{"source":"n * f(n-1)","O0":{"selfCalls":1,"instructions":27},"O1":{"selfCalls":0,"instructions":11,"shape":"loop"},"O2":{"selfCalls":0,"instructions":43,"shape":"loop, 4x unrolled"}}],"reading":"the optimiser goes exactly as far as the mathematics allows — the sum has a closed form and the factorial does not","whatO2DoesInstead":"splits the product across four independent accumulators to break the dependency chain, then combines them — a latency win, still O(n)"},"timing":{"cpp":{"unit":"ns per call, -O2, median of 7 alternated rounds","n12":{"recursion":4.70,"accumulator":4.79,"loop":4.72},"n20":{"recursion":6.14,"accumulator":6.15,"loop":6.41},"table":{"n":20,"lookup":0.53,"recursion":6.55,"loop":6.37,"speedup":12.4},"reading":"all three forms identical because all three become the same unrolled loop"},"python":{"version":"3.13.4","unit":"ns per call, median of 7","n12":{"recursion":799.6,"accumulator":862.8,"loop":369.2,"mathFactorial":40.0},"n20":{"recursion":1463.3,"accumulator":1568.7,"loop":736.3,"mathFactorial":37.4},"largeN":[{"n":1000,"loopUs":419.9,"mathFactorialUs":59.7,"ratio":7.0},{"n":5000,"loopUs":12072.8,"mathFactorialUs":1260.9,"ratio":9.6},{"n":20000,"loopUs":226004.9,"mathFactorialUs":16700.2,"ratio":13.5}],"recursionLimit":{"default":1000,"deepestCompleting":999,"note":"one deeper than the sum's 998, because this base case stops a step earlier"},"arbitraryPrecision":{"mathFactorial1000Digits":2568}}},"table":{"entries":21,"covers":"n = 0..20","bytes":168,"verifiedAgainstRunningProduct":true,"cannotOverflow":true,"reading":"the entire correct domain of a 64-bit factorial is 21 values, so this is the whole function rather than an optimisation"}}
```

<!-- @highlights -->
- The stack column reuses the layout of the previous subtopics, with each frame carrying a pending slot reading n x ?.
- The base case lights a returned 1, labelled the identity element, and the value box then fills 1, 2, 6, 24, 120.
- A toggle beside the base case switches it to 0; the value box fills 0, 0, 0, 0, 0 and every frame greys out.
- That toggle is the point: one wrong constant flattens the entire domain to a single value.
- The right-hand panel is a logarithmic axis for n running from 0 to 173,828.
- The stack limit sits at the far right, labelled where the recursion stops.
- 20 and 12 sit so close to the origin they need leader lines — last correct in 64 bits and in 32 bits.
- The band between 20 and 173,828 is hatched and labelled runs fine, answers are wrong.
- That band occupies almost the whole axis, because the correct region is 0.0115% of it.
- Beneath it, a detection strip of cells for n = 12 through 17 showing what an int returns.
- The cells are green at 12 and red from 13 onward.
- Three markers point at different cells: first wrong at 13, first decrease at 14, first negative at 17.
- The distance between those markers is the visible argument against checking for overflow after the fact.
- A small optimiser ladder shares three rungs with the previous subtopic: -O0, -O1, -O2.
- The sum and the factorial sit side by side and are identical on the first two rungs.
- They diverge at -O2, where the sum shows three arithmetic operations and no loop and the factorial shows four parallel multiply lanes feeding one combine step.

<!-- @edgeCases -->
- n equal to zero — the answer is 1, which is the case most often written wrong.
- n equal to one — also 1, and it cannot distinguish a base case of n <= 1 from n == 1.
- Negative n — n <= 1 returns 1, while n == 1 never matches and recurses until the stack is gone.
- n = 12 with a 32-bit int — the last correct answer that type can give.
- n = 13 with a 32-bit int — the first wrong answer, and it comes back positive and plausible.
- n = 17 with a 32-bit int — the first negative result, four wrong answers after the first.
- n = 20 with a 64-bit type — the last correct answer, and the last entry of the table.
- n = 21 with a 64-bit type — 5.54x past the signed maximum, returned silently.
- n = 23 as a double — the first factorial a double cannot hold exactly, eleven steps later than an int and one later than 22!.
- n = 1,000 in Python — RecursionError at the default limit, with 999 the deepest that completes.
- Very large n in Python — exact, since integers have no fixed width, but use math.factorial rather than a loop.

<!-- @pitfalls -->
- Returning 0 from the base case. Zero annihilates a product rather than leaving it alone, so every answer becomes 0 for every input — a far worse failure than the equivalent slip in the sum, which shifted answers by one.
- Writing the base case as n == 1. It never matches a negative n and the recursion runs until the stack is exhausted — measured SIGSEGV, exit status 139.
- Forgetting that 0! is 1. A base case of n <= 1 gets it right for free; special-casing n == 0 to return 0 does not.
- Returning int rather than long long. The last correct answer drops from 20! to 12!, and 13! comes back as 1,932,053,504 with no warning.
- Widening only the return type. n * factorial(n - 1) is computed in the type of its operands, so an int n still wraps — the cast has to be on the multiplication.
- Checking for a negative result to detect overflow. The first wrong answer is at 13! and the first negative one at 17!, so that test misses four of them.
- Checking that the sequence is still increasing. That fires first at 14!, one step after the answer is already wrong.
- Trusting a double because the answer "looks big enough". It is exact to 22! and silently approximate after that, and it is exact further than a 53-bit mantissa suggests only because factorials end in many zero bits.
- Worrying about recursion depth here. The stack holds 173,828 frames and the type stops being correct at 21, so depth is the one limit that never binds.
- Computing a factorial at all when the range is 21 values wide. A 21-entry table is 168 bytes, measured 12.4x faster, and cannot overflow.
- Reaching for the accumulator rewrite. It measured 4.79ns against 4.70ns in C++ and is slower in Python, because both forms become the same loop and Python rewards tail position not at all.
- Expecting -O2 to solve this the way it solved the sum. It cannot: a factorial has no closed form, so the best it does is unroll the loop four ways.

<!-- @doubt -->
### Why does the base case return 1 and not 0?

<!-- @answer -->
Because its value is multiplied into everything above it, so it has to be the number that leaves a product unchanged — the identity element, which for multiplication is 1. Zero is not the identity for multiplication, it is the annihilator: choose it and every multiplication on the way back out produces zero, so the function returns 0 for every input including 5 and 10. That is a much larger failure than the matching mistake in Sum of First N Numbers, where returning 1 instead of 0 merely made every answer one too high. Same slip, same position in the code, and the operation decides whether it is an off-by-one or a total loss.

<!-- @doubt -->
### Is 0! really 1?

<!-- @answer -->
Yes, and the base case gets it right for free. An empty product — a product of no numbers at all — is 1, in the same way that an empty sum is 0, because that is the value that leaves the operation alone. It also follows from the definition: n! = n × (n-1)! at n = 1 gives 1! = 1 × 0!, so 0! must be 1 for the identity to hold. Writing n <= 1 as the base case covers both 0! and 1! with one test; special-casing zero separately is a common way to introduce a bug, since returning 0 there is wrong.

<!-- @doubt -->
### How deep can this recursion go?

<!-- @answer -->
Deep enough that the question stops mattering, which is the point of this subtopic. Measured at -O0 the recursion reaches n = 173,828 before exhausting the stack — essentially the same as Sum of First N Numbers, since the frame is the same size. But with a 64-bit return type the last correct answer is 20!, so 20 of those 173,828 inputs produce a right answer: 0.0115% of them. Every earlier problem in this topic was bounded by depth; this is the first one bounded by the type, and it is bounded by a factor of 8,691 sooner.

<!-- @doubt -->
### What is the largest factorial I can compute?

<!-- @answer -->
In a 32-bit int, 12! = 479,001,600 — and 13! at 6,227,020,800 is only 2.90x past the limit, so you lose it immediately. In 64 bits, 20! = 2,432,902,008,176,640,000, with 21! at 5.54x the signed maximum and 2.77x the unsigned one. A double is exact to 22!. Beyond that you need a big-integer type — Python's built-in integers, Java's BigInteger, or a library in C++. The practical consequence is that the range check belongs in the function, because nothing else will supply it.

<!-- @doubt -->
### Why not just check whether the result went negative?

<!-- @answer -->
Because it does not, for a while. With a 32-bit int the first wrong answer is 13!, which comes back as 1,932,053,504 — positive, larger than 12!, and comfortably inside the type's range. The first negative value is 17!, by which point four wrong answers have already been returned. Checking that the sequence is still increasing is better but still late: the first value that decreases is 14!, one step after the damage. The only test that catches every case is comparing n against 20 before multiplying anything, which is why the samples here do that.

<!-- @doubt -->
### A double has 53 bits, so shouldn't it fail at 19!?

<!-- @answer -->
That is the natural prediction and it is too pessimistic. Measured, a double holds factorials exactly up to 22! and first fails at 23!. The reason is that a factorial picks up a factor of 2 from every even term, so it ends in a long run of zero bits that the mantissa does not need to store — 20! is a 62-bit number with 18 trailing zeros, so only 44 bits are significant and the exponent carries the rest. It is a useful reminder that "does it exceed 2 to the 53" answers the wrong question: what matters is how many *significant* bits the value has, not how large it is.

<!-- @doubt -->
### The last subtopic said -O2 solves the recurrence. Does it here?

<!-- @answer -->
No, and the difference is exactly the mathematics. Both functions have the same shape and both lose their recursive call at -O1, becoming 11-instruction loops. At -O2 the sum collapses further to 12 instructions with no loop at all, because 1 + 2 + … + n has a closed form. The factorial stays a loop at 43 instructions, because 1 × 2 × … × n does not. What -O2 does instead is split the product across four independent accumulators and combine them at the end, which breaks the dependency chain between successive multiplies — a latency win, not an algorithmic one. It is still O(n).

<!-- @doubt -->
### Should I use the accumulator version?

<!-- @answer -->
There is no measurable reason to. It is a genuine tail call, but it measured 4.79ns against the plain recursion's 4.70ns at n = 12, because at -O1 and above both compile to the same loop. In Python it is actively worse — 862.8ns against 799.6ns — since the extra argument costs something on every frame and Python never rewards tail position. Write it once to see that the starting value must be 1 for the same reason the other form's base case returns 1, then use whichever reads better.

<!-- @doubt -->
### Isn't a lookup table cheating?

<!-- @answer -->
It is the correct answer, and the range is what makes it so. A 64-bit factorial has 21 valid inputs. Twenty-one values is 168 bytes, it is O(1), it measured 0.53ns against the recursion's 6.55ns, and it cannot overflow because every value it can return was verified when it was written. There is no input for which the recursion is correct and the table is not. Keep the recursion for what it teaches — it is the clearest statement of what a factorial is, and the shape carries to problems whose domain is not 21 values wide — but ship the table.

<!-- @doubt -->
### What is the fastest way to do this in Python?

<!-- @answer -->
math.factorial, by a wide margin and at every size. At n = 12 it measured 40.0ns against a hand-written loop's 369.2ns and the recursion's 799.6ns. It is also flat between n = 12 and n = 20 — 40.0ns and 37.4ns — so it is not looping at that size at all. Its advantage grows with n, from 7.0x over a naive loop at n = 1,000 to 13.5x at n = 20,000, because it multiplies similarly-sized halves rather than repeatedly multiplying one enormous number by a small one. Python needs no table and no range check, since its integers have no fixed width.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Reverse an array, which is the first recursion here that neither prints nor returns a value — it mutates memory the caller owns, so the frames carry nothing at all and the result is whatever is left behind. Two other things change with it: the recursion moves two indices toward each other rather than stepping one counter down, so the frame count is n/2 rather than n, and the swap happens before the recursive call, which makes the natural formulation a tail call with no accumulator rewrite to discuss. Fibonacci comes later in this topic and is where a frame first makes two calls instead of one.
