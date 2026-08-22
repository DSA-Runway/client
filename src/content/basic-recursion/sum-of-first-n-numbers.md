---
id: sum-of-first-n-numbers
topic: Basic Recursion
title: Sum of First N Numbers
difficulty: Easy
status: ready
prerequisites:
  - print-n-to-1-using-recursion
  - print-1-to-n-using-recursion
  - understand-recursion-by-print-something-n-times
  - stack-memory-and-recursion-depth
  - data-types
relatedIds:
  - print-n-to-1-using-recursion
  - factorial-of-a-given-number
  - stack-memory-and-recursion-depth
  - data-types
---

<!-- @summary -->
The first recursion here that returns a value rather than performing an action — and that one change hands the whole problem to the compiler, which flattens the naive version into closed-form arithmetic that runs in 0.6ns whether n is a thousand or a hundred million. The twist is which version breaks first: the O(1) formula is wrong for 19,195 inputs where the O(n) loop is still right.

<!-- @theory -->
## The problem

Return `1 + 2 + … + n`.

```
n = 5   ->   15
n = 10  ->   55
n = 0   ->   0
```

## What actually changed

The four subtopics before this one all *did* something at each frame — they
printed. This one *returns* something. That sounds like a small edit, and for the
first few minutes it is:

```
printNToOne(n):                 sumToN(n):
    if n <= 0: return               if n <= 0: return 0
    print n                         return n + sumToN(n - 1)
    printNToOne(n - 1)
```

Two changes. The base case stops returning nothing and starts returning **zero**,
and the recursive line stops discarding its result and starts adding to it.

Both are more consequential than they look, and in opposite directions. The base
case now has to carry a **value**, and the only value that works is the one that
leaves a sum unchanged — zero. Meanwhile the recursive line now has a **pending
addition** after the call, which by the last subtopic's rules should be a
disaster: it is not a tail call, so the frame cannot be discarded.

Measured, it is not a disaster at all. It is the opposite.

## The optimiser solves the recurrence

The same function, compiled three ways. Self-calls counted in the generated
assembly:

| | Self-calls | Instructions | What it became |
|---|---|---|---|
| `-O0` | **1** | 26 | genuine recursion |
| `-O1` | 0 | 11 | a **loop** |
| `-O2` | 0 | 12 | **closed-form arithmetic** |

At `-O1` the pending addition is turned into an accumulator and the recursion
becomes a loop. At `-O2` the compiler goes further and **solves the loop**,
emitting a multiply where the addition used to be:

```
sumRec at -O2:
    subs  x8, x0, #1
    b.lt  LBB0_2
    sub   x9, x0, #2
    mul   x10, x8, x9
    umulh x9, x8, x9        ; a widening multiply
    extr  x9, x9, x10, #1   ; ...shifted right by one — a division by 2
    madd  x8, x8, x8, x0
    sub   x0, x8, x9
    ret
```

There is no loop and no call in there. That is `n(n+1)/2`, derived by the
compiler from a function that never mentions multiplication.

The consequence is measurable and absolute — total time for one call, at `-O2`:

| n | Time |
|---|---|
| 1,000 | 0.6ns |
| 100,000 | 0.6ns |
| 10,000,000 | 0.6ns |
| 100,000,000 | **0.6ns** |

Flat across five orders of magnitude. At `-O0` the same function is cleanly
linear — 7,016.7ns, 76,597.6ns, 760,760.1ns for n of 1,000, 10,000 and 100,000 —
so at n = 100,000 the gap between the two builds is **1,337,024x**. The optimiser
did not make the recursion faster. It removed the algorithm.

## Why this problem and not the last one

The previous subtopic's printing recursion was never flattened this way, and the
reason is the pending operation. Same shape, five different pending operations,
all at `-O2`:

| Written | Self-calls | Compiled to |
|---|---|---|
| `return n + f(n-1)` | **0** | closed-form arithmetic |
| `return n * f(n-1)` | **0** | a loop, 4x unrolled |
| `return f(n-1) - n` | 1 | still recursive |
| `f(n-1); print n` | 1 | still recursive |
| `return f(n-1) + f(n-2)` | 1 | one call became a loop, one remains |

The first two are accumulations into a single running value. The compiler can
reassociate those, turn the recursion into an accumulator loop, and — where a
closed form exists — solve it. Printing cannot be reassociated: the order of the
output *is* the result. That is the whole reason Print 1 to N stayed stuck at a
depth of 261,000 while this problem has no depth limit at `-O2` at all.

So the lesson from the last subtopic — *get the call into tail position* — turns
out to be the wrong lesson to carry forward. Tail position was never the real
requirement. **What the operation is** matters more than **where the call sits**.

## Tail position stops paying

The accumulator rewrite, which was worth 17.6x in the previous subtopic:

```
sumFrom(n, acc):
    if n <= 0: return acc
    return sumFrom(n - 1, acc + n)      // a true tail call
```

Measured at n = 100,000, per number:

| | `-O0` | `-O2` |
|---|---|---|
| `n + sum(n-1)` | 8.0221ns | 0.6ns total |
| Accumulator | 7.3259ns | 0.6ns total |
| Loop | 0.9482ns | 0.6ns total |

At `-O0` the accumulator is **8.7% cheaper** — not 17.6x, because the pending
addition was never the expensive part; the call was. At `-O2` the difference is
**zero**, because both became the same closed form. The rewrite that mattered
enormously one subtopic ago is worth almost nothing here.

## The fast version is the one that breaks

`n(n+1)/2` is exact, O(1), and taught as the obvious answer. It is also the
**least robust** of the four, and the reason is that it computes a product larger
than the result it returns.

Using 32-bit `int`, the first n at which each form stops being correct:

| Form | First wrong n |
|---|---|
| Loop | 65,536 |
| Recursion | 65,536 |
| `n * (n + 1) / 2` | **46,341** |
| `(n/2) * (n+1)` when n is even | 65,536 |

There are **19,195 values of n** where the O(1) formula is wrong and the O(n)
loop is right. And the failures are not near the edge of the type:

```
n = 46,341    exact 1,073,767,311    formula gives -1,073,716,337
n = 65,535    exact 2,147,450,880    formula gives         -32,768
```

At n = 65,535 the answer fits in an `int` with room to spare. The formula still
returns −32,768, because `n * (n + 1)` overflowed before the division could
bring it back down. A sum of positive numbers came out negative.

Reordering to divide first — `(n/2) * (n+1)` for even n, `n * ((n+1)/2)` for odd
— removes the intermediate entirely and restores the full range. The same
arithmetic holds one type up: with 64-bit integers the sum is exact to
n = 4,294,967,295, but `n * (n + 1)` overflows from n = 3,037,000,500.

## The rewrite does not change the answer

A fair worry: if `-O2` replaces the loop with algebra, does wraparound still
behave the same? Compared over every n from 1 to 100,000, `-O0` and `-O2` output:
**0 differences**. The `umulh`/`extr` pair in that assembly is a widening
multiply followed by a shift — the compiler computes the product at double width
precisely so the truncation matches what the additions would have done.

## Python gets none of it, and does not need it

Python never performs this transformation. At n = 900:

| | ns per number |
|---|---|
| `n + sum(n-1)` | 58.751 |
| Accumulator | **67.165** |
| Explicit loop | 20.189 |
| `sum(range(1, n+1))` | 7.657 |
| `n*(n+1)//2` | 0.057 |

The accumulator is **14.3% more expensive** here, not cheaper — Python charges
for the second argument and refunds nothing for tail position. And the depth
limit bites early: the deepest n that completes at the default limit of 1,000 is
**998**, with `RecursionError` from 999.

What Python does have is arbitrary-precision integers, so the formula that
overflows in C++ is simply correct:

```
sum_form(10**20) = 5000000000000000000050000000000000000000   (exact, 40 digits)
```

The one trap is `/` instead of `//`. It produces a float, and floats are exact
here only up to a point — the first disagreement is at **n = 188,659,441**,
where it is off by 1. Every test below that passes.

## Where this goes next

**Factorial** is the same skeleton with `*` for `+` and a base case of 1 instead
of 0 — the identity element of the other operation. It is also where the
overflow story stops being a corner case: 12! is the last factorial that fits in
a 32-bit `int`, so the type runs out long before the stack does.

<!-- @intuition -->
Reading it as a definition rather than a procedure is the whole trick: the sum of the first n numbers is n plus the sum of the first n − 1, and the sum of the first zero numbers is zero. Two lines, and both fall straight out of that sentence. The base case has to return zero rather than nothing, because it is now a value that gets added to — and zero is the only choice that leaves the total alone. What is worth noticing is that this is the first version of the recursion whose result is *used* rather than discarded. That is exactly the property that lets a compiler reason about it: an accumulation into one running value can be rearranged and, when the arithmetic allows, solved outright, which is something a sequence of print statements can never be.

<!-- @approach -->
### Iteration - The Running Total

<!-- @idea -->
Keep a running total and add each number from 1 to n to it.

<!-- @steps -->
1. Start a total at zero, which is what an empty sum is worth.
2. Step a counter from 1 up to n inclusive.
3. Add the counter to the total at each step.
4. Return the total once the counter passes n.
5. Make the total wide enough for the answer, which grows about as fast as n squared.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Measured 0.9482ns per number at -O0 and 20.189ns in Python. The type of the total matters more than anything else here: with a 32-bit int the first wrong answer is at n = 65,536, and going to 64 bits pushes that to n = 4,294,967,295.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

long long sumToN(int n) {
    long long sum = 0;
    for (int i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}
```

<!-- @annotations -->
- 5: long long, not int. With an int total the first wrong answer arrives at n = 65,536, and it arrives silently. Starting at zero is the same choice the recursive base case makes, for the same reason.
- 6: i <= n, not i < n. The upper bound is inclusive, so n itself must be added.

<!-- @code java -->
```java
static long sumToN(int n) {
    long sum = 0;
    for (int i = 1; i <= n; i++) {
        sum += i;
    }
    return sum;
}
```

<!-- @annotations -->
- 1: Java's int is 32 bits and wraps on overflow exactly as C++ does here, so the return type has to be long for the same reason.

<!-- @code python -->
```python
def sum_to_n(n):
    total = 0
    for i in range(1, n + 1):
        total += i
    return total


# Python integers do not overflow, so no type choice is needed.
# The built-in sum(range(1, n + 1)) does the same work and measured
# 7.657ns per number against this loop's 20.189ns.
```

<!-- @annotations -->
- 3: range(1, n + 1), because the stop is exclusive — dropping the plus one loses n itself from the total.
- 9: sum(range(...)) is 2.64x faster than the explicit loop, since the addition happens in C rather than in bytecode.

<!-- @approach -->
### Recursion - Add on the Way Out

<!-- @idea -->
Return n plus the sum of the first n minus one, and let the base case return zero.

<!-- @steps -->
1. Take a single parameter n.
2. If n is zero or less, return zero — the sum of nothing.
3. Otherwise call the function with n minus one.
4. Add n to whatever that call returns.
5. Return the total, which the caller in turn adds to.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack as written, O(1) at -O1, none at all at -O2
- note: The addition is pending after the call, so this is not a tail call — and it does not matter. At -O1 it compiles to a loop and at -O2 to closed-form arithmetic with zero self-calls, measured flat at 0.6ns from n = 1,000 to n = 100,000,000. Only at -O0 is it genuinely recursive, where it costs 8.0221ns per number against the loop's 0.9482ns and exhausts the stack at n = 174,254.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

long long sumToN(int n) {
    if (n <= 0) return 0;            // the sum of nothing is zero

    return n + sumToN(n - 1);        // an addition is pending after the call
}
```

<!-- @annotations -->
- 5: Two decisions on one line. return 0, not return 1 — returning 1 shifts every answer by exactly one, so sum(5) becomes 16. And n <= 0, not n == 0: testing for equality never matches a negative n, so the chain runs until the stack is exhausted, measured as SIGSEGV, exit status 139.
- 7: The pending addition means this is not a tail call, yet -O2 still eliminates it, because an accumulation into one value can be reassociated where a sequence of prints cannot. At -O0, where it does not, the frame is 48 bytes — predicting a depth of 174,421 against 174,254 measured.

<!-- @code java -->
```java
static long sumToN(int n) {
    if (n <= 0) return 0;

    return n + sumToN(n - 1);
}
```

<!-- @annotations -->
- 4: The JVM specification forbids tail-call elimination, and this is not a tail call in any case, so every frame here is real and deep n throws StackOverflowError.

<!-- @code python -->
```python
def sum_to_n(n):
    if n <= 0:
        return 0
    return n + sum_to_n(n - 1)


# No transformation happens here — measured 58.751ns per number
# against the loop's 20.189ns, and the deepest n that completes at
# the default recursion limit of 1,000 is 998.
```

<!-- @annotations -->
- 3: return 0 rather than a bare return, which would return None and raise TypeError on the addition one frame up.
- 4: 2.91x the cost of the loop, and unlike C++ that ratio does not go away at any setting.

<!-- @approach -->
### Recursion with an Accumulator

<!-- @idea -->
Carry the running total down as a second parameter so nothing is left pending after the call.

<!-- @steps -->
1. Take two parameters, the remaining n and the accumulated total.
2. If n is zero or less, return the accumulator — it already holds the answer.
3. Otherwise add n to the accumulator.
4. Call the function with n minus one and the new accumulator.
5. Return that result directly, with no work after the call.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack as written, O(1) once eliminated
- note: A true tail call, and worth far less than the previous subtopic would suggest — 8.7% cheaper than the plain recursion at -O0 and exactly the same at -O2, where both become the same closed form. In Python it is 14.3% more expensive, because the extra argument costs something and tail position buys nothing.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

long long sumFrom(int n, long long acc) {
    if (n <= 0) return acc;

    return sumFrom(n - 1, acc + n);  // nothing pending after this
}

long long sumToN(int n) { return sumFrom(n, 0); }
```

<!-- @annotations -->
- 5: The base case returns the accumulator rather than zero, because the total was built on the way down instead of on the way back.
- 7: A genuine tail call — and at -O2 it compiles to the identical closed form as the version without an accumulator, so it wins nothing.
- 10: The wrapper supplies the starting value zero, which is the same identity element the other version returns from its base case.

<!-- @code java -->
```java
static long sumFrom(int n, long acc) {
    if (n <= 0) return acc;

    return sumFrom(n - 1, acc + n);
}

static long sumToN(int n) { return sumFrom(n, 0); }
```

<!-- @annotations -->
- 4: Java gets no benefit from tail position at all, so this form costs an extra argument per frame and saves nothing.

<!-- @code python -->
```python
def sum_from(n, acc=0):
    if n <= 0:
        return acc
    return sum_from(n - 1, acc + n)


# Measured 67.165ns per number against 58.751ns for the version
# without an accumulator — in Python this rewrite makes it SLOWER.
```

<!-- @annotations -->
- 1: A default argument keeps the call site clean, at the cost of hiding that the starting value is the identity element.
- 4: The extra argument is charged on every call and the tail position is never rewarded, which is why this measured slower.

<!-- @approach -->
### The Closed Form

<!-- @idea -->
Use n times n plus one, over two — the sum of the pairs that each add to n plus one.

<!-- @steps -->
1. Pair the first number with the last, the second with the second-last, and so on.
2. Every pair sums to n plus one, and there are n over two pairs.
3. So the total is n times n plus one, divided by two.
4. Guard n at zero or below, since the identity assumes a non-empty range.
5. Divide before multiplying if the type is narrow, to avoid an intermediate that overflows.

<!-- @complexity -->
- time: O(1)
- space: O(1)
- note: Measured 3.12ns at -O0 and constant regardless of n — but it is the least robust form here. With a 32-bit int it produces wrong answers from n = 46,341, which is 19,195 values earlier than the loop, and at n = 65,535 it returns -32,768 for an answer that fits the type comfortably. Reordering to divide first restores the full range.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

long long sumToN(long long n) {
    if (n <= 0) return 0;

    return n * (n + 1) / 2;
}

// Narrow types need the division first, or the product overflows:
long long sumSafe(long long n) {
    return (n % 2 == 0) ? (n / 2) * (n + 1) : n * ((n + 1) / 2);
}
```

<!-- @annotations -->
- 4: The parameter is long long, not int — n * (n + 1) is computed in the parameter's type, so a narrow parameter overflows even when the answer would fit.
- 7: One of n and n + 1 is always even, so this division is always exact and never loses a remainder.
- 12: Dividing the even one of the pair first keeps the intermediate no larger than the result, which is what buys back the 19,195 values.

<!-- @code java -->
```java
static long sumToN(long n) {
    if (n <= 0) return 0;

    return n * (n + 1) / 2;
}
```

<!-- @annotations -->
- 1: Taking a long rather than an int matters for the same reason as in C++ — the multiplication happens in the wider type only if the operands are already wide.

<!-- @code python -->
```python
def sum_to_n(n):
    if n <= 0:
        return 0
    return n * (n + 1) // 2


# // not /. True division returns a float, and the first n where it
# disagrees with the exact value is 188,659,441 — every smaller test
# passes, which is what makes it dangerous.
```

<!-- @annotations -->
- 4: Floor division with //. Writing / returns a float, which is exact here only up to n = 188,659,441. The multiplication itself is safe: Python integers have no fixed width, so the overflow that breaks this form in C++ and Java cannot happen — sum_to_n(10**20) is exact.

<!-- @example -->

<!-- @input -->
n = 5, through the recursive version

<!-- @output -->
15 — assembled entirely on the way back out

<!-- @why -->
The first recursion in this topic whose frames matter on the return journey: nothing useful happens on the way down, and every frame has work waiting for it.

<!-- @walkthrough -->
1. sumToN(5) cannot return yet — it needs the value of sumToN(4) before it can add 5 to anything.
2. The same happens at 4, 3, 2 and 1, so five frames are stacked with an addition waiting in each.
3. sumToN(0) matches the base case and returns 0, the only value that leaves a sum unchanged.
4. That 0 goes back to the frame holding n equal to 1, which returns 1 + 0, or 1.
5. The frame holding 2 returns 2 + 1, or 3, and the frame holding 3 returns 3 + 3, or 6.
6. The frame holding 4 returns 4 + 6, or 10, and the outermost frame returns 5 + 10, or 15.
7. Compare the printing versions, where the frames carried no value at all — here every return feeds the frame above it.

<!-- @example -->

<!-- @input -->
The same source function compiled at -O0, -O1 and -O2

<!-- @output -->
Recursion, then a loop, then closed-form arithmetic

<!-- @why -->
The central measurement of this subtopic, and the reason the tail-call advice from the previous one does not carry over.

<!-- @walkthrough -->
1. At -O0 the function contains one call to itself and 26 instructions, and it exhausts the stack at n = 174,254.
2. At -O1 the pending addition is converted into an accumulator, the self-call disappears, and 11 instructions remain — a loop.
3. At -O2 the loop is solved: 12 instructions, no call and no back edge, with a widening multiply and a shift where the addition used to be.
4. That is n times n plus one over two, derived by the compiler from a function that never mentions multiplication.
5. Measured, one call takes 0.6ns at n = 1,000 and 0.6ns at n = 100,000,000 — flat across five orders of magnitude.
6. At n = 100,000 the -O0 build takes 802,214.2ns for the same call, a factor of 1,337,024.
7. Comparing the two builds over every n from 1 to 100,000 gives 0 differing answers, so the rewrite preserves wraparound exactly.

<!-- @example -->

<!-- @input -->
Five recursive functions differing only in the operation pending after the call

<!-- @output -->
Two are eliminated entirely, three keep their recursive call

<!-- @why -->
It isolates what the compiler is actually responding to — which is the operation, not the shape of the call — and explains why the printing subtopics never got this treatment.

<!-- @walkthrough -->
1. return n + f(n-1) compiles to closed-form arithmetic with zero self-calls remaining.
2. return n * f(n-1) also loses its self-call, becoming a loop unrolled four times, since no closed form exists for a factorial.
3. return f(n-1) - n keeps its call, with one bl to itself still in the assembly.
4. f(n-1) followed by a print keeps its call too, which is exactly the printing recursion from the previous subtopic.
5. return f(n-1) + f(n-2) keeps one of its two calls — the other became a loop.
6. The pattern is that accumulations into a single running value can be reassociated, and ordered output cannot.
7. So tail position was never the requirement it appeared to be; what the pending operation is matters more than where the call sits.

<!-- @example -->

<!-- @input -->
n = 65,535 with a 32-bit int, through the loop and through the formula

<!-- @output -->
2,147,450,880 from the loop, -32,768 from the formula

<!-- @why -->
The O(1) solution failing on an input where the O(n) solution succeeds, and on an answer that fits the type with room to spare.

<!-- @walkthrough -->
1. The correct answer, 2,147,450,880, is comfortably below the int maximum of 2,147,483,647.
2. The loop and the recursion both produce it, because no intermediate they compute is ever larger than the final total.
3. The formula first computes n times n plus one, which is 4,295,032,320 and does not fit.
4. That product wraps, and dividing the wrapped value by two gives -32,768.
5. A sum of positive numbers has come back negative, with no warning and no error.
6. The first n at which the formula is wrong is 46,341, against 65,536 for the loop — a gap of 19,195 inputs.
7. Writing it as (n/2) * (n+1) when n is even removes the oversized intermediate and closes the gap entirely.

<!-- @visualization memory-model -->

<!-- @description -->
The call stack as a column of frames beside a value channel, keeping the layout of the previous two subtopics so the change is visible rather than described. Run the recursive version for n = 5 and push five frames, but this time draw each frame with a filled pending slot reading n + ?, the question mark standing for the value it is still waiting on — the contrast with Print N to 1, whose slots were empty and labelled nothing waiting, should be immediate. The output strip from those subtopics is replaced by a single value box that stays blank during the descent, because nothing is known yet. When the base case is reached, light the returned 0 and label it the identity element, then walk it upward: each frame's question mark resolves, the frame computes its sum, and the value box updates 0, 1, 3, 6, 10, 15 as the stack drains. The frames should collapse from the bottom rather than fading, since each one genuinely had work left to do. Beside this, the optimisation ladder as three stacked panels sharing one source listing: -O0 showing the five frames just drawn, -O1 showing a single frame with a loop arrow and an accumulator register, -O2 showing no frame at all and three arithmetic boxes reading multiply, widen, shift right by one. Under the ladder a timing axis that is logarithmic in n, carrying a straight rising line for -O0 and a perfectly horizontal line at 0.6ns for -O2 that stays flat past 100,000,000. Then the pending-operation panel: five one-line function bodies stacked vertically, each with a chip on the right reading eliminated or still recursive — plus, times and the two-call Fibonacci partially, minus and print not — with the print row tied back by a thin line to the previous subtopic's diagram. Finally the overflow panel: a number line marked at 46,341 and 65,536, with a green band for the loop that extends to the second mark and a shorter green band for the formula that stops at the first, the 19,195-wide difference between them hatched in red and labelled the fast version fails first. Inside that hatched region put the single worked value: n = 65,535, loop 2,147,450,880, formula −32,768, with the intermediate 4,295,032,320 drawn overflowing its box.

<!-- @sampleInput -->
```json
{"primary":{"n":5,"form":"n + sumToN(n-1)","descent":[{"call":"sumToN(5)","pending":"5 + ?"},{"call":"sumToN(4)","pending":"4 + ?"},{"call":"sumToN(3)","pending":"3 + ?"},{"call":"sumToN(2)","pending":"2 + ?"},{"call":"sumToN(1)","pending":"1 + ?"},{"call":"sumToN(0)","pending":null,"baseCase":true,"returns":0}],"unwind":[{"frame":"n=1","computes":"1 + 0","returns":1},{"frame":"n=2","computes":"2 + 1","returns":3},{"frame":"n=3","computes":"3 + 3","returns":6},{"frame":"n=4","computes":"4 + 6","returns":10},{"frame":"n=5","computes":"5 + 10","returns":15}],"result":15,"peakFrames":6,"identityElement":0,"contrastWithPrinting":"there every pending slot was empty; here every frame is waiting on a value"},"optimisationLadder":[{"level":"-O0","selfCalls":1,"instructions":26,"became":"genuine recursion","deepestN":174254},{"level":"-O1","selfCalls":0,"instructions":11,"became":"a loop"},{"level":"-O2","selfCalls":0,"instructions":12,"became":"closed-form arithmetic","deepestN":"no limit — n = 4,000,000,000 returned 8,000,000,002,000,000,000"},{"level":"-O3","selfCalls":0,"instructions":12,"became":"closed-form arithmetic"}],"timing":{"cpp":{"n":100000,"O0":{"recursionNsPerNumber":8.0221,"accumulatorNsPerNumber":7.3259,"loopNsPerNumber":0.9482,"formulaNsTotal":3.12},"O2NsTotal":{"1000":0.6,"100000":0.6,"10000000":0.6,"100000000":0.6},"O0Linearity":{"1000":7016.7,"10000":76597.6,"100000":760760.1},"ratios":{"recOverLoopAtO0":8.46,"accumulatorSavingAtO0":"8.7% cheaper","O0OverO2AtN100000":1337024,"accumulatorSavingAtO2":"none — identical closed form"}},"python":{"version":"3.13.4","n":900,"nsPerNumber":{"recursion":58.751,"accumulator":67.165,"loop":20.189,"sumRange":7.657,"formula":0.057},"accumulatorIs":"14.3% MORE expensive","recursionLimit":{"default":1000,"deepestCompleting":998,"raisedTo200000":199902}}},"pendingOperation":[{"source":"return n + f(n-1)","selfCalls":0,"became":"closed-form arithmetic"},{"source":"return n * f(n-1)","selfCalls":0,"became":"a loop, 4x unrolled"},{"source":"return f(n-1) - n","selfCalls":1,"became":"still recursive"},{"source":"f(n-1); print n","selfCalls":1,"became":"still recursive"},{"source":"return f(n-1) + f(n-2)","selfCalls":1,"became":"one call became a loop, one remains"}],"overflow":{"type":"int32","intMax":2147483647,"firstWrongN":{"loop":65536,"recursion":65536,"formula":46341,"reorderedFormula":65536},"gapWhereFormulaAloneIsWrong":19195,"worked":[{"n":46341,"exact":1073767311,"formula":-1073716337},{"n":65535,"exact":2147450880,"formula":-32768,"intermediate":4295032320,"note":"the answer fits the type; the intermediate does not"}],"int64":{"sumFitsTo":4294967295,"productFitsTo":3037000499},"rewriteIsAnswerPreserving":{"comparedN":"1..100000","differences":0}},"baseCases":[{"written":"if (n <= 0) return 0","correct":true,"atN0":0,"atN1":1,"atN5":15},{"written":"if (n <= 0) return 1","atN0":1,"atN1":2,"atN5":16,"effect":"every answer is one too high"},{"written":"if (n <= 1) return 1","atN0":1,"atN1":1,"atN5":15,"effect":"correct for every n except 0"},{"written":"if (n <= 1) return 0","atN0":0,"atN1":0,"atN5":14,"effect":"every answer is one too low"},{"written":"if (n == 0) return 0","atNegative":"never matches — SIGSEGV, exit status 139"}],"stack":{"frameBytes":48,"stackBytes":8372224,"predictedDepth":174421,"measuredDepth":174254,"accuracy":"99.90%"},"pythonTraps":[{"written":"n * (n + 1) / 2","firstWrongN":188659441,"offBy":1,"reason":"true division produces a float"},{"written":"n * (n + 1) // 2","exactAt":"10**20","note":"arbitrary precision — never overflows"}]}
```

<!-- @highlights -->
- The stack column and frame layout carry over from the previous two subtopics, so only what changed is new.
- Every frame now draws a filled pending slot reading n + ?, where Print N to 1 drew empty slots labelled nothing waiting.
- The output strip is replaced by a single value box, which stays blank for the whole descent because nothing is known yet.
- The base case lights a returned 0, labelled the identity element.
- The value box then updates 0, 1, 3, 6, 10, 15 as the stack drains.
- Frames collapse from the bottom rather than fading, because each genuinely had work left to do.
- The optimisation ladder is three panels over one source listing: five frames, then one frame with a loop arrow, then no frame at all.
- The -O2 panel shows three arithmetic boxes reading multiply, widen, shift right by one.
- A logarithmic timing axis carries a rising line for -O0 and a flat line at 0.6ns for -O2 that stays flat past 100,000,000.
- The pending-operation panel stacks five one-line bodies, each chipped eliminated or still recursive.
- Plus and times are eliminated, minus and print are not, and Fibonacci is partial.
- A thin line ties the print row back to the previous subtopic's diagram.
- The overflow panel is a number line marked at 46,341 and 65,536 with two green bands of different lengths.
- The 19,195-wide difference is hatched in red and labelled the fast version fails first.
- Inside the hatching sits n = 65,535 with the loop's 2,147,450,880 beside the formula's −32,768.
- The intermediate 4,295,032,320 is drawn overflowing its box, which is where the sign came from.

<!-- @edgeCases -->
- n equal to zero — the answer is 0, and it is the only input that separates a base case of n <= 0 from one of n <= 1.
- n equal to one — every base-case variant except return 0 at n <= 1 happens to be right here, so it proves nothing.
- Negative n — n <= 0 returns zero, while n == 0 never matches and recurses until the stack is gone.
- n = 46,341 with a 32-bit int — the formula is wrong and the loop is right.
- n = 65,535 with a 32-bit int — the answer fits the type but the formula's intermediate does not, giving −32,768.
- n = 65,536 with a 32-bit int — the first n where the loop and the recursion are wrong too.
- n = 3,037,000,500 with 64-bit integers — where n * (n + 1) overflows although the sum still fits.
- n around 174,254 in C++ at -O0 — the measured stack limit for the recursive form, which -O2 removes entirely.
- n = 999 in Python — RecursionError at the default limit, with 998 the deepest that completes.
- n = 188,659,441 in Python — the first n where writing / instead of // gives a wrong answer.
- Very large n in Python — the formula stays exact at 10**20, since integers have no fixed width.

<!-- @pitfalls -->
- Returning 1 from the base case instead of 0. Every answer comes out exactly one too high, and n = 1 still looks right.
- Stopping at n <= 1 and returning 1. This is correct for every positive n and wrong only at n = 0, so almost any test suite misses it.
- Stopping at n <= 1 and returning 0. Every answer is exactly one too low, because the 1 is never added.
- Writing the base case as n == 0. It never matches a negative n, and the recursion runs until the stack is exhausted — measured SIGSEGV, exit status 139.
- Storing the total in an int. The first wrong answer is at n = 65,536 and it arrives silently, with no warning at any level.
- Reaching for n * (n + 1) / 2 as the safe fast answer. It is the first form to break — wrong from n = 46,341, which is 19,195 inputs earlier than the loop.
- Assuming the formula is safe because the answer fits. At n = 65,535 the answer fits an int and the formula still returns −32,768, because the intermediate product does not.
- Passing an int to a closed-form function that returns a long long. The multiplication happens in the parameter's type, so widening the return type alone fixes nothing.
- Writing n * (n + 1) / 2 in Python with a single slash. It returns a float and first disagrees with the exact value at n = 188,659,441, so every smaller test passes.
- Carrying the tail-call advice over from the previous subtopic. Here the accumulator is worth 8.7% at -O0, nothing at -O2, and is 14.3% slower in Python.
- Benchmarking the recursion at -O2 and concluding recursion is free. At -O2 there is no recursion left to measure — the same call takes 0.6ns whether n is 1,000 or 100,000,000.
- Relying on the compiler to remove the recursion. It happens for + and * and not for subtraction, printing, or the two-call Fibonacci shape, all measured at the same -O2.

<!-- @doubt -->
### Why does the base case return 0 and not nothing?

<!-- @answer -->
Because its value is now used. The frame above adds n to whatever comes back, so the base case has to hand up a number, and the only number that leaves a sum unchanged is zero — the identity element for addition. Returning 1 makes every answer exactly one too high, including sum(0), which becomes 1. This is the first real difference from the printing subtopics, where the base case returned nothing because there was nothing waiting for it. In Python the mistake is easier to make and louder when it happens: a bare return hands back None, and the addition one frame up raises TypeError rather than quietly producing a wrong number.

<!-- @doubt -->
### Is n + sum(n-1) a tail call?

<!-- @answer -->
No. The addition happens after the call returns, so the frame has to survive to perform it — by the previous subtopic's reasoning that should be expensive. Measured, it is not: at -O1 the compiler converts the pending addition into an accumulator and the self-call disappears, and at -O2 it goes further and emits closed-form arithmetic with 12 instructions, no call and no loop. The rewrite that puts the call in tail position is worth 8.7% at -O0 and exactly nothing at -O2, because both versions compile to the same thing. Tail position mattered for printing because print order cannot be rearranged; an accumulation into one value can be.

<!-- @doubt -->
### The compiler really turns my recursion into a formula?

<!-- @answer -->
Yes, and it is visible in the assembly: at -O2 the function is a widening multiply, a shift right by one, and a multiply-add — n(n+1)/2, derived from source that never mentions multiplication. The behavioural evidence is the timing. One call takes 0.6ns at n = 1,000 and 0.6ns at n = 100,000,000, flat across five orders of magnitude, and calling it with n = 4,000,000,000 returns 8,000,000,002,000,000,000 immediately. At -O0 the same source takes 802,214.2ns for n = 100,000 and dies at n = 174,254, a factor of 1,337,024 apart.

<!-- @doubt -->
### Then does the optimiser change my answers?

<!-- @answer -->
Not here. Comparing the -O0 and -O2 builds over every n from 1 to 100,000 gave 0 differing answers, including all the values where a 32-bit total wraps. The reason is in the instruction choice — the umulh and extr pair computes the product at double width and then shifts, so the truncation lands exactly where the repeated additions would have left it. That is worth knowing rather than assuming: signed overflow is undefined behaviour in C++, so the compiler is not obliged to preserve it, and this measurement says what this compiler did rather than what is guaranteed.

<!-- @doubt -->
### Which pending operations get eliminated and which do not?

<!-- @answer -->
Measured at -O2 on the same function shape: return n + f(n-1) becomes closed-form arithmetic with zero self-calls, and return n * f(n-1) becomes a four-times-unrolled loop, also with zero self-calls. Three keep their recursive call — return f(n-1) - n, a call followed by a print, and return f(n-1) + f(n-2), which loses one of its two calls but not the other. The pattern is that accumulations into a single running value can be reassociated into an accumulator, and ordered output cannot. That is precisely why the printing subtopics never got this treatment: the order of the output is the result.

<!-- @doubt -->
### Should I just use n(n+1)/2 and skip the recursion?

<!-- @answer -->
For production, use the closed form — but reorder it. As usually written it is the least robust of the four forms here: with a 32-bit int it gives wrong answers from n = 46,341, while the loop is still correct to 65,536, so there are 19,195 inputs where the fast version fails and the slow one does not. At n = 65,535 it returns −32,768 for an answer that fits the type with room to spare, because n * (n + 1) overflowed before the division could bring it back. Writing (n/2) * (n+1) when n is even and n * ((n+1)/2) when it is odd keeps the intermediate no larger than the result and closes the gap.

<!-- @doubt -->
### Why does the formula break before the loop does?

<!-- @answer -->
Because it computes something larger than its own answer. The loop's running total never exceeds the final sum, so it is correct for every n whose sum fits the type. The formula forms the product n * (n + 1) first, which is about twice the answer, so it needs roughly one extra bit — and one bit of headroom is the difference between 65,536 and 46,341, since the thresholds are the square roots of the type's limits. The same shape repeats one type up: with 64-bit integers the sum fits to n = 4,294,967,295 while the product overflows from n = 3,037,000,500.

<!-- @doubt -->
### How deep can the recursion actually go?

<!-- @answer -->
In C++ at -O0, to n = 174,254 on this machine. That follows from the frame: the compiler reserves 48 bytes per call, and an 8,372,224-byte stack divided by 48 predicts 174,421, which is within 0.1% of what was measured. At -O2 the question stops applying, because there are no frames — n = 4,000,000,000 returns instantly. Python is the strict case: the deepest n that completes at the default recursion limit of 1,000 is 998, with RecursionError from 999, and raising the limit to 200,000 got it to about 199,902.

<!-- @doubt -->
### Why is the accumulator version slower in Python?

<!-- @answer -->
Because Python charges for the extra argument and refunds nothing for tail position. Measured at n = 900, the accumulator costs 67.165ns per number against 58.751ns for the plain recursion — 14.3% more. Python does not eliminate tail calls, deliberately, so the property that the rewrite exists to create has nothing to act on, and all that remains is the cost of building a two-argument frame instead of a one-argument one. This is the mirror of C++ at -O0, where the same rewrite was 8.7% cheaper: the same edit, opposite signs, for reasons that have nothing to do with the algorithm.

<!-- @doubt -->
### What is the fastest way to write this in Python?

<!-- @answer -->
The closed form, by a very long way — 51.2ns total regardless of n, against 52,875.8ns for the recursion at n = 900. If you want the loop for clarity, prefer sum(range(1, n + 1)) over writing the addition yourself: it measured 7.657ns per number against 20.189ns, 2.64x faster, because the accumulation runs in C rather than in bytecode. The one thing to be careful about in the formula is the division — write // and not /, since true division returns a float that first disagrees with the exact answer at n = 188,659,441, which no small test will catch.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Factorial, which is the same skeleton with multiplication in place of addition and a base case of 1 instead of 0 — the identity element of the other operation, and a good check on whether the idea landed. It also sharpens the overflow story: the sum of the first n numbers stays inside a 32-bit int up to n = 65,535, whereas 12! is the last factorial that fits, so the type runs out long before the stack ever could. That reverses which limit you have to think about first.
