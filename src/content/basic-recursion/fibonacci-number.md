---
id: fibonacci-number
topic: Basic Recursion
title: Fibonacci Number
difficulty: Easy
status: ready
prerequisites:
  - check-if-string-is-palindrome-or-not
  - factorial-of-a-given-number
  - sum-of-first-n-numbers
  - stack-memory-and-recursion-depth
  - time-and-space-complexity-basics
relatedIds:
  - factorial-of-a-given-number
  - sum-of-first-n-numbers
  - check-if-string-is-palindrome-or-not
  - stack-memory-and-recursion-depth
---

<!-- @summary -->
One frame, two calls — and the chain every earlier subtopic built becomes a tree. The count of calls is itself a Fibonacci number, 2·F(n+1)−1 exactly, so it grows by the golden ratio per step. This is the first problem in the topic where nothing external stops you: the type is fine to F(92) and the depth never exceeds n−1, yet reaching F(92) naively would take a projected 710 years against a loop's 32.1 nanoseconds.

<!-- @theory -->
## The problem

`F(0) = 0`, `F(1) = 1`, and `F(n) = F(n-1) + F(n-2)`.

```
0, 1, 1, 2, 3, 5, 8, 13, 21, 34, ...
```

## The change is one extra call

```
factorial(n):                     fib(n):
    if n <= 1: return 1               if n <= 1: return n
    return n * factorial(n - 1)       return fib(n - 1) + fib(n - 2)
```

Every recursion in this topic so far has made **one** call per frame, which
produces a chain: n levels, one frame per level, a predictable amount of work in
each. This one makes **two**, and a chain becomes a tree.

## What that costs, exactly

The number of calls the naive version makes is not approximately anything — it is
a Fibonacci number:

| n | F(n) | Calls made | 2·F(n+1)−1 |
|---|---|---|---|
| 10 | 55 | 177 | 177 |
| 20 | 6,765 | 21,891 | 21,891 |
| 30 | 832,040 | 2,692,537 | 2,692,537 |
| 40 | 102,334,155 | 331,160,281 | 331,160,281 |

**calls(n) = 2·F(n+1) − 1**, matched at every n tested. The work of computing a
Fibonacci number naively is itself Fibonacci.

The waste has an exact shape too. Computing `fib(30)` calls `fib(k)` exactly
`F(30-k+1)` times:

| Subproblem | Times computed |
|---|---|
| `fib(30)` | 1 |
| `fib(28)` | 2 |
| `fib(26)` | 5 |
| `fib(24)` | 13 |
| **`fib(1)`** | **832,040** |
| `fib(0)` | 514,229 |

2,692,537 calls to produce 31 distinct values — a redundancy factor of
**86,856x**. `fib(1)` alone, which returns a constant, is evaluated 832,040 times.

## It is not 2^n

"Exponential" is right; the base is not 2. Each frame makes two calls but one of
them is a strictly smaller subproblem, so the tree is lopsided and the growth
factor is the golden ratio:

| n | Actual calls | 2^n | 2^n overstates by |
|---|---|---|---|
| 20 | 21,891 | 1,048,576 | 48x |
| 30 | 2,692,537 | 1,073,741,824 | 399x |
| 50 | 40,730,022,147 | 1,125,899,906,842,624 | **27,643x** |

Measured, `calls(n+1)/calls(n)` converges to **1.618034** — φ, to six decimals. At
n = 50 the difference between φ^n and 2^n is four orders of magnitude, so it is
worth being precise about which one you mean.

## Nothing external stops you

Every earlier subtopic ran into a wall that was not the algorithm's fault. Print
N times died at 261,000 stack frames. Factorial's 32-bit type ran out at 12!.
Here neither applies:

- The **type** is generous. `F(46)` = 1,836,311,903 is the last that fits a 32-bit
  `int`, and `F(92)` = 7,540,113,804,746,346,429 the last for 64-bit — where
  factorial died at 12 and 20.
- The **depth** never exceeds `n - 1`. At n = 30 the deepest chain is 29 frames,
  nowhere near any limit, while 2,692,537 calls are made. It is the *breadth* that
  explodes, not the height, which is why `RecursionError` is not what stops you.

What stops you is the clock:

| n | Naive, wall clock |
|---|---|
| 30 | 2.41 ms |
| 35 | 26.91 ms |
| 40 | 293.93 ms |
| **45** | **3,397 ms** |

`F(45)` is 1,134,903,170 — it still fits a 32-bit `int` with room to spare, and
the recursion already takes three and a half seconds. Extrapolating the measured
0.918 ns per call to n = 92, the last value a 64-bit integer can hold, gives
**24,400,320,830,243,753,475 calls — about 710 years**. The two-variable loop
does it in **32.1 nanoseconds**.

So this is the first problem in the topic where the recursion itself is the thing
that has to be fixed.

## The compiler cannot rescue this one

In every earlier subtopic the optimiser flattened the recursion completely — sum,
factorial, reverse and palindrome all reached `-O1` with **zero** self-calls
remaining. Here:

| | `-O0` | `-O1` | `-O2` |
|---|---|---|---|
| `n + sum(n-1)` | 1 self-call | **0** | 0 |
| `fib(n-1) + fib(n-2)` | **2 self-calls** | **1** | **1** |

It eliminates one of the two and cannot touch the other. Reading the `-O2` body,
the `fib(n-2)` arm became the loop — `n` is reassigned to `n-2` and branched back
— while the `fib(n-1)` arm remains a real `bl`:

```
LBB0_3:
    sub  x0, x20, #1
    bl   __Z8fibNaivel      ; f(n-1): still a call
    mov  x8, x0
    sub  x0, x20, #2
    add  x19, x8, x19       ; accumulate
    mov  x20, x0            ; n := n-2
    b.hi LBB0_3             ; f(n-2): became the loop
```

A chain can be turned into a loop. A tree cannot, because the second call's
result is needed before the frame can finish and there is no single accumulator
that captures it.

## The fix is to stop recomputing

Nothing about the recurrence requires the tree. The waste is that `fib(k)` is
recalculated `F(n-k+1)` times when its value never changes. Remember each answer
and the tree collapses to a line — n distinct subproblems, each computed once.

Measured, per call at `-O2`:

| n | Naive | Memoised | Iterative | Fast doubling |
|---|---|---|---|---|
| 10 | 291.9ns | 53.6ns | 7.1ns | 8.3ns |
| 20 | 18,562.1ns | 50.5ns | 6.3ns | 5.4ns |
| 30 | 2,334,792.3ns | 76.9ns | 9.7ns | 5.0ns |
| 40 | **304,110,194.3ns** | 106.4ns | **13.3ns** | 6.4ns |

At n = 40 the loop is **22.9 million times** faster than the recursion that
defines the same number. Fast doubling is nearly flat from n = 10 to n = 40 —
5.0ns to 6.4ns — because it is O(log n) rather than O(n).

## And here the O(1) formula breaks first, again

Fibonacci has a closed form, Binet's: `F(n) = round(φ^n / √5)`. It is O(1) and
looks like it should end the discussion. Measured, it is exact only to **F(70)**
and first disagrees at **F(71)**:

```
F(71) exact  308,061,521,170,129
Binet gives  308,061,521,170,130      off by 1
```

A 64-bit loop is exact to F(92). So there are **22 values** where the O(n) loop is
right and the O(1) formula is wrong — the same shape of result Sum of First N
Numbers found, where `n(n+1)/2` failed 19,195 inputs before the loop did. A
closed form is not automatically the better answer; double precision runs out
before the integer type does.

## Python

Per call, with `functools.lru_cache` measured cold — the cache cleared before
each run, since a warm cache is a dictionary lookup rather than a computation:

| n | Naive | Memoised (cold) | Iterative |
|---|---|---|---|
| 10 | 6,205.2ns | 1,118.7ns | 167.3ns |
| 20 | 722,926.4ns | 2,018.0ns | 335.9ns |
| 30 | **96,193,562.5ns** | 3,197.8ns | **508.7ns** |

At n = 30 the naive version takes 96 milliseconds for a number the loop produces
in half a microsecond — **189,096x**. Note also that memoisation fixes the
asymptotics without winning: the loop is about 6x faster at every size, because
the cache costs a dictionary operation per subproblem that the loop does not pay.

Python integers do not overflow, so `F(93)` — which a C++ `long long` gets wrong —
is exact, and `F(1000)` is a 209-digit number.

## Where this goes next

This is the last subtopic in Basic Recursion, and it is the one that motivates
what follows. Remembering subproblem answers so they are computed once is
**dynamic programming**, and the recursion tree here is the smallest example of
why it exists. The same reading — write the recurrence, notice the overlap, cache
it, then often replace the cache with a loop that fills the same values in order —
is the whole method, and Fibonacci is where it is easiest to see because the
overlap is visible in a single diagram.

<!-- @intuition -->
Write the definition down and you have the recursion: F(n) is F(n-1) plus F(n-2), and the first two values are given. What makes it different from everything before it is that the frame needs two answers instead of one, so instead of a chain of calls you get a branching tree — and the two branches overlap almost entirely, because computing F(n-1) already computes F(n-2) along the way. The naive version throws that away and starts again, which is why it recomputes F(1) over eight hundred thousand times for n = 30. The fix is not a cleverer recurrence but simply refusing to compute the same thing twice, and once you do that the tree flattens into n distinct subproblems, at which point a loop with two variables does the job with no recursion at all.

<!-- @approach -->
### Brute Force - The Definition, Twice Over

<!-- @idea -->
Translate the recurrence directly: return the sum of the two previous Fibonacci numbers.

<!-- @steps -->
1. If n is zero or one, return n — those are the two given values.
2. Otherwise call the function for n minus one.
3. Call it again for n minus two.
4. Return the sum of the two results.
5. Note that nothing is shared between the two calls, so the second recomputes what the first already found.

<!-- @complexity -->
- time: O(φ^n), with exactly 2·F(n+1)−1 calls
- space: O(n) call stack — the depth is only n−1, even though the call count is exponential
- note: The call count is itself a Fibonacci number and grows by the golden ratio, not by 2 — at n = 50 the figure 2^n overstates it by 27,643x. Measured 293.93ms at n = 40 and 3,397ms at n = 45, where F(45) still fits a 32-bit int comfortably. Worth writing once, and never worth shipping.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

long long fib(int n) {
    if (n <= 1) return n;                 // F(0)=0 and F(1)=1

    return fib(n - 1) + fib(n - 2);       // two calls, nothing shared
}
```

<!-- @annotations -->
- 5: return n, not 1. The base case supplies two different values, F(0)=0 and F(1)=1, and returning n covers both. n <= 1, not n == 1 — otherwise n = 0 recurses into negative n and never terminates.
- 7: The two calls know nothing about each other, which is the whole cost: fib(1) is evaluated 832,040 times when n = 30. This is the first recursion in the topic the compiler cannot flatten — one of the two self-calls survives at -O1 and -O2.

<!-- @code java -->
```java
static long fib(int n) {
    if (n <= 1) return n;

    return fib(n - 1) + fib(n - 2);
}
```

<!-- @annotations -->
- 4: The depth here is only n - 1, so StackOverflowError is not the failure mode — the program simply stops making progress.

<!-- @code python -->
```python
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)


# Measured 96,193,562.5ns — 96 milliseconds — for n = 30 alone,
# against 508.7ns for the two-variable loop. The recursion limit is
# never reached: the depth is 29, but 2,692,537 calls are made.
```

<!-- @annotations -->
- 4: Two calls per frame, so the call count is 2*F(n+1)-1 — 2,692,537 for n = 30.
- 7: Wall-clock time is what stops this, not RecursionError, because the tree is wide rather than deep.

<!-- @approach -->
### Memoise the Recursion

<!-- @idea -->
Keep the answers you have already computed and look them up instead of recomputing.

<!-- @steps -->
1. Keep a table indexed by n, marking which entries are known.
2. On entry, return the stored answer if there is one.
3. Otherwise compute it from the two smaller values as before.
4. Store the result before returning it.
5. Each of the n subproblems is now computed exactly once, so the tree collapses to a line.

<!-- @complexity -->
- time: O(n)
- space: O(n) for the table plus O(n) call stack
- note: The smallest useful example of dynamic programming — the change is one lookup and one store, and it takes the call count from 2·F(n+1)−1 down to n. Measured 106.4ns at n = 40 against the naive version's 304,110,194.3ns. It fixes the asymptotics without being the fastest option: the iterative version measured about 6x quicker in Python, because a cache costs a dictionary operation per subproblem that a loop does not pay.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

long long fibMemo(int n, vector<long long>& memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];          // already known

    return memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
}

long long fib(int n) {
    vector<long long> memo(n + 1, -1);
    return fibMemo(n, memo);
}
```

<!-- @annotations -->
- 6: A sentinel of -1 works because no Fibonacci number is negative; for a general problem use a separate seen array rather than a magic value.
- 8: The store happens on the way out, so each subproblem is written exactly once and read F(n-k+1) minus one times.
- 12: Sizing the table n + 1 rather than n, since index n itself has to exist.

<!-- @code java -->
```java
static long fibMemo(int n, long[] memo) {
    if (n <= 1) return n;
    if (memo[n] != -1) return memo[n];

    return memo[n] = fibMemo(n - 1, memo) + fibMemo(n - 2, memo);
}

static long fib(int n) {
    long[] memo = new long[n + 1];
    java.util.Arrays.fill(memo, -1);
    return fibMemo(n, memo);
}
```

<!-- @annotations -->
- 10: Java zero-fills arrays, so the fill with -1 is required — without it F(0)=0 would read as an already-computed entry for every n.

<!-- @code python -->
```python
import functools


@functools.lru_cache(maxsize=None)
def fib(n):
    if n <= 1:
        return n
    return fib(n - 1) + fib(n - 2)


# Measured with the cache CLEARED before each run: 3,197.8ns at n = 30
# against the naive version's 96,193,562.5ns. Timing it without clearing
# measures a dictionary lookup, not a computation — that reads as a
# flat ~25ns at every n, which is not the cost of computing anything.
```

<!-- @annotations -->
- 4: One decorator turns the exponential version into a linear one, with no change to the body at all.
- 11: The measurement trap is worth knowing: a warm lru_cache returns in constant time regardless of n, so benchmarks that do not clear it report the wrong thing.

<!-- @approach -->
### Optimal - Two Variables

<!-- @idea -->
Walk up from the bottom, keeping only the two values you still need.

<!-- @steps -->
1. Start with the two known values, F(0) = 0 and F(1) = 1.
2. Step upward n times.
3. At each step compute the next value as the sum of the two current ones.
4. Shift the pair forward so it always holds the last two.
5. After n steps the lower of the two is F(n).

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The memo table is never read more than two entries back, so it does not need to exist. Measured 13.3ns at n = 40 against the naive version's 304,110,194.3ns, a factor of 22.9 million, and 32.1ns at n = 92 — the largest value a 64-bit integer can hold, which the naive version would reach in a projected 710 years.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

long long fib(int n) {
    if (n < 0 || n > 92) return -1;      // F(93) does not fit in 64 bits

    long long a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        long long next = a + b;
        a = b;
        b = next;
    }
    return a;
}
```

<!-- @annotations -->
- 5: F(92) is 7,540,113,804,746,346,429 and F(93) is 12,200,160,415,121,876,738, which exceeds the signed 64-bit maximum.
- 7: a and b start as F(0) and F(1); after i steps they hold F(i) and F(i+1).
- 13: Returning a rather than b, since the loop advances one step past the value being asked for.

<!-- @code java -->
```java
static long fib(int n) {
    if (n < 0 || n > 92) throw new IllegalArgumentException("n must be 0..92");

    long a = 0, b = 1;
    for (int i = 0; i < n; i++) {
        long next = a + b;
        a = b;
        b = next;
    }
    return a;
}
```

<!-- @annotations -->
- 2: Java's long is 64-bit and wraps silently just as C++ does, so the same bound of 92 applies; BigInteger is the escape.

<!-- @code python -->
```python
def fib(n):
    a, b = 0, 1
    for _ in range(n):
        a, b = b, a + b
    return a


# No upper bound needed — Python integers do not overflow, so F(93)
# is exact where a C++ long long is not, and F(1000) is 209 digits.
# Measured 508.7ns at n = 30 against the recursion's 96,193,562.5ns.
```

<!-- @annotations -->
- 4: The tuple assignment evaluates both right-hand values before either is written, so no temporary is needed.
- 8: The only form here that needs no range check at all.

<!-- @approach -->
### Fast Doubling

<!-- @idea -->
Halve n at each step using the identities that give F(2k) and F(2k+1) from F(k) and F(k+1).

<!-- @steps -->
1. Return the pair F(0), F(1) when n reaches zero.
2. Otherwise solve for n halved, obtaining F(k) and F(k+1).
3. Compute F(2k) as F(k) times twice F(k+1) minus F(k).
4. Compute F(2k+1) as F(k) squared plus F(k+1) squared.
5. Return the pair shifted by one when n is odd.

<!-- @complexity -->
- time: O(log n)
- space: O(log n) call stack
- note: Nearly flat across the whole usable range — measured 8.3ns at n = 10 and 6.4ns at n = 40, against the iterative version's 7.1ns and 13.3ns. It only starts to matter for very large n with big integers, where the identities let you skip half the sequence, but it is the natural answer to why a linear scan is not the end of the story.

<!-- @code cpp -->
```cpp
#include <utility>
using namespace std;

pair<long long, long long> fibPair(int n) {
    if (n == 0) return {0, 1};

    auto [a, b] = fibPair(n >> 1);              // a = F(k), b = F(k+1)
    long long c = a * (2 * b - a);              // F(2k)
    long long d = a * a + b * b;                // F(2k+1)

    return (n & 1) ? make_pair(d, c + d) : make_pair(c, d);
}

long long fib(int n) { return fibPair(n).first; }
```

<!-- @annotations -->
- 7: n >> 1 rather than n / 2 makes the halving explicit; the depth is log base 2 of n, so 7 frames at n = 92.
- 8: 2*b - a is never negative for valid inputs, since F(k+1) is at least F(k) for all k at least 0.
- 11: The odd case shifts the pair up by one, which is what turns F(2k), F(2k+1) into F(2k+1), F(2k+2).

<!-- @code java -->
```java
static long[] fibPair(int n) {
    if (n == 0) return new long[]{0, 1};

    long[] p = fibPair(n >> 1);
    long a = p[0], b = p[1];
    long c = a * (2 * b - a);
    long d = a * a + b * b;

    return (n & 1) == 1 ? new long[]{d, c + d} : new long[]{c, d};
}

static long fib(int n) { return fibPair(n)[0]; }
```

<!-- @annotations -->
- 9: Java has no tuple type, so a two-element array stands in — allocating one per level, which is why this is not obviously worth it below very large n.

<!-- @code python -->
```python
def fib_pair(n):
    if n == 0:
        return (0, 1)
    a, b = fib_pair(n >> 1)
    c = a * (2 * b - a)
    d = a * a + b * b
    return (d, c + d) if n & 1 else (c, d)


def fib(n):
    return fib_pair(n)[0]


# This is where fast doubling earns its place: with big integers it
# reaches F(1000) in about 10 recursive steps rather than 1,000 additions.
```

<!-- @annotations -->
- 7: The conditional expression handles the odd case in one line, mirroring the C++ ternary.
- 14: For big-integer Fibonacci the log-depth version is the practical choice, since each step roughly doubles the number of digits rather than adding one term.

<!-- @example -->

<!-- @input -->
fib(5) through the naive recursion

<!-- @output -->
5, from 15 calls — where 6 would do

<!-- @why -->
The smallest tree where the overlap is visible: two independent subtrees that recompute the same values.

<!-- @walkthrough -->
1. fib(5) calls fib(4) and fib(3), and cannot return until both come back.
2. fib(4) in turn calls fib(3) and fib(2) — and that fib(3) is a complete second copy of the one fib(5) already asked for.
3. Each of those expands again, so fib(2) is reached three separate times and fib(1) five times.
4. The call count is 15, which is 2·F(6)−1 = 2·8−1.
5. Only six distinct values exist, F(0) through F(5), so nine of the fifteen calls recompute something already known.
6. The deepest chain is four frames, so the stack is never a problem — the width is.
7. At n = 30 the same pattern gives 2,692,537 calls for 31 distinct values, a redundancy of 86,856x.

<!-- @example -->

<!-- @input -->
The call count of the naive version, counted exactly

<!-- @output -->
2·F(n+1)−1, and each fib(k) evaluated F(n−k+1) times

<!-- @why -->
Both are exact identities rather than bounds, which makes the waste something you can predict rather than estimate.

<!-- @walkthrough -->
1. Counting calls for every n from 1 to 30 gives exactly 2·F(n+1)−1 in every case.
2. So the cost of computing a Fibonacci number naively is itself a Fibonacci number.
3. Counting how often each subproblem is reached shows fib(k) evaluated exactly F(n−k+1) times.
4. At n = 30 that means fib(28) is computed twice, fib(26) five times, and fib(1) 832,040 times.
5. fib(1) returns a constant, so those 832,040 evaluations produce no information whatever.
6. The growth factor is the golden ratio, measured as 1.618034 — not 2, which overstates the count by 27,643x at n = 50.
7. That is why memoising is not an optimisation but a correction: it removes work that was never needed.

<!-- @example -->

<!-- @input -->
The same source compiled at -O0, -O1 and -O2

<!-- @output -->
Two self-calls become one, and stay there

<!-- @why -->
Every earlier subtopic in this topic reached zero self-calls at -O1; this is where that stops, and the reason is structural rather than a missed optimisation.

<!-- @walkthrough -->
1. At -O0 the function contains two calls to itself, as written.
2. At -O1 one of them disappears and the instruction count drops from 30 to 18.
3. At -O2 one self-call still remains, in 24 instructions.
4. Reading the body, the fib(n-2) arm is the one that became the loop: n is reassigned to n-2 and the code branches back.
5. The fib(n-1) arm is still a real call instruction inside that loop.
6. A chain can become a loop because each frame passes one value forward; a tree cannot, because the frame needs a second result that no single accumulator carries.
7. So unlike sum, factorial, reverse and palindrome, this recursion cannot be optimised into a loop — it has to be rewritten into one.

<!-- @example -->

<!-- @input -->
n = 92, the largest Fibonacci a 64-bit integer holds

<!-- @output -->
32.1 nanoseconds by loop, a projected 710 years by recursion

<!-- @why -->
It puts a number on the difference between a correct algorithm and a correct definition, on an input the type handles without complaint.

<!-- @walkthrough -->
1. F(92) is 7,540,113,804,746,346,429, comfortably inside a signed 64-bit integer.
2. The two-variable loop computes it in 32.1 nanoseconds.
3. The naive recursion would make 2·F(93)−1 calls, which is 24,400,320,830,243,753,475.
4. Measured at n = 40, each call costs about 0.918 nanoseconds.
5. That projects to roughly 22.4 billion seconds, or about 710 years.
6. Long before that it stops being usable in practice: n = 45 already takes 3.4 seconds, and F(45) still fits a 32-bit int.
7. Neither the type nor the stack ever objects — the depth stays at n−1 throughout, so the only thing that fails is the running time.

<!-- @visualization custom -->

<!-- @description -->
The recursion tree, drawn for fib(5) and then instrumented. Start with the full tree: fib(5) at the root branching to fib(4) and fib(3), each branching again down to the fib(1) and fib(0) leaves, fifteen nodes in total. Colour every node that is a repeat of one already drawn — the second fib(3), all three fib(2)s after the first, and so on — so the eye sees immediately that the tree is mostly duplicates: six distinct values among fifteen nodes. Put a counter beside it reading calls = 15 = 2·F(6) − 1, and a second counter reading distinct values = 6. Then a slider for n: as it moves from 5 to 30 the tree cannot be drawn any more, so replace it with two bars, one for calls and one for distinct values, on a log scale — at n = 30 they read 2,692,537 and 31, and the ratio 86,856x should be printed between them. Beside that a small strip showing how often each fib(k) is evaluated, as a row of cells from k = 30 down to k = 0 with heights following F(n−k+1) — flat at the top, then curving up sharply to 832,040 at fib(1), labelled this returns a constant. The growth panel is a single chart with three curves on a log axis: the measured call count, φ^n, and 2^n, with the first two lying exactly on top of each other and 2^n running away above, annotated 27,643x at n = 50. Beneath, the limits panel, which should read as a contrast with Factorial: two horizontal bars for n, one marked type runs out and one marked algorithm runs out, drawn for both problems — for Factorial the type bar stops at 20 while the algorithm bar runs off the frame, and for Fibonacci they are the other way round, the type bar reaching 92 and the algorithm bar stopping at about 45. Finally the memoisation panel: the same fib(5) tree with every duplicate node collapsed into an arrow pointing at the first occurrence, leaving a line of six nodes, and a caption that the tree did not get smarter, it just stopped recomputing.

<!-- @sampleInput -->
```json
{"primary":{"n":5,"result":5,"totalCalls":15,"formula":"2*F(6)-1 = 2*8-1","distinctValues":6,"wastedCalls":9,"maxDepth":4,"tree":{"node":"fib(5)","children":[{"node":"fib(4)","children":[{"node":"fib(3)","children":[{"node":"fib(2)","children":[{"node":"fib(1)","leaf":true},{"node":"fib(0)","leaf":true}]},{"node":"fib(1)","leaf":true,"duplicate":true}]},{"node":"fib(2)","duplicate":true,"children":[{"node":"fib(1)","leaf":true,"duplicate":true},{"node":"fib(0)","leaf":true,"duplicate":true}]}]},{"node":"fib(3)","duplicate":true,"children":[{"node":"fib(2)","duplicate":true,"children":[{"node":"fib(1)","leaf":true,"duplicate":true},{"node":"fib(0)","leaf":true,"duplicate":true}]},{"node":"fib(1)","leaf":true,"duplicate":true}]}]},"reading":"the deepest chain is 4 frames; the width is what explodes"},"callCount":{"identity":"calls(n) = 2*F(n+1) - 1","verifiedFor":"every n from 1 to 30","rows":[{"n":10,"F":55,"calls":177},{"n":20,"F":6765,"calls":21891},{"n":30,"F":832040,"calls":2692537},{"n":40,"F":102334155,"calls":331160281}],"recomputationIdentity":"fib(k) is evaluated exactly F(n-k+1) times","atN30":[{"k":30,"times":1},{"k":28,"times":2},{"k":26,"times":5},{"k":24,"times":13},{"k":1,"times":832040,"note":"returns a constant"},{"k":0,"times":514229}],"redundancy":{"calls":2692537,"distinct":31,"factor":86856}},"growthBase":{"actualBase":"phi","measuredRatio":1.618034,"notTwo":true,"rows":[{"n":20,"calls":21891,"twoToTheN":1048576,"overstatesBy":48},{"n":30,"calls":2692537,"twoToTheN":1073741824,"overstatesBy":399},{"n":50,"calls":40730022147,"twoToTheN":1125899906842624,"overstatesBy":27643}]},"whichLimitBinds":{"fibonacci":{"typeLastFits":{"int32":46,"int64":92},"depthAtN30":29,"callsAtN30":2692537,"unusableByWallClockAt":45,"binds":"the ALGORITHM"},"factorial":{"typeLastFits":{"int32":12,"int64":20},"stackDepth":173828,"binds":"the TYPE"},"reading":"an exact inversion of the previous subtopic"},"wallClock":{"unit":"ms, naive, -O2","rows":[{"n":30,"ms":2.41},{"n":35,"ms":26.91},{"n":40,"ms":293.93},{"n":45,"ms":3397.09}],"atN45":{"F":1134903170,"note":"still fits a 32-bit int, and already takes 3.4 s"},"projectedAtN92":{"calls":24400320830243753475,"nsPerCall":0.918,"seconds":22407235210,"years":710,"iterativeNs":32.1}},"optimiser":{"rows":[{"source":"n + sum(n-1)","O0":1,"O1":0,"O2":0},{"source":"fib(n-1) + fib(n-2)","O0":2,"O1":1,"O2":1}],"instructions":{"O0":30,"O1":18,"O2":24},"whichArmBecameTheLoop":"fib(n-2) — n is reassigned to n-2 and branched back; fib(n-1) remains a real call","why":"a chain passes one value forward and can become a loop; a tree needs a second result no single accumulator carries","reading":"the first recursion in this topic the compiler cannot flatten"},"timing":{"cpp":{"unit":"ns per call, -O2, median of 7","rows":[{"n":10,"naive":291.9,"memo":53.6,"iterative":7.1,"fastDoubling":8.3},{"n":20,"naive":18562.1,"memo":50.5,"iterative":6.3,"fastDoubling":5.4},{"n":30,"naive":2334792.3,"memo":76.9,"iterative":9.7,"fastDoubling":5.0},{"n":40,"naive":304110194.3,"memo":106.4,"iterative":13.3,"fastDoubling":6.4}],"naiveOverIterativeAtN40":22865428,"fastDoublingIsFlat":"5.0 to 8.3 ns across the whole range, because it is O(log n)"},"python":{"version":"3.13.4","unit":"ns per call","note":"lru_cache measured COLD — cleared before each run; a warm cache is a dict lookup, flat at ~25ns, and is not the cost of computing anything","rows":[{"n":10,"naive":6205.2,"memoCold":1118.7,"iterative":167.3},{"n":20,"naive":722926.4,"memoCold":2018.0,"iterative":335.9},{"n":30,"naive":96193562.5,"memoCold":3197.8,"iterative":508.7}],"naiveOverIterativeAtN30":189096,"memoStillLosesToLoop":"about 6x, because the cache costs a dictionary operation per subproblem"}},"binet":{"formula":"round(phi^n / sqrt(5))","exactUpTo":70,"firstWrong":71,"atFirstWrong":{"exact":308061521170129,"binet":308061521170130,"offBy":1},"int64LoopExactTo":92,"valuesWhereLoopRightAndFormulaWrong":22,"echoes":"sum-of-first-n-numbers, where n(n+1)/2 failed 19,195 inputs before the O(n) loop did"},"python3Extras":{"F92":7540113804746346429,"F93":12200160415121876738,"F93NoteCpp":"a C++ long long gets this wrong","F1000Digits":209}}
```

<!-- @highlights -->
- The recursion tree for fib(5) is drawn in full: fifteen nodes, root fib(5) branching to fib(4) and fib(3).
- Every node that repeats one already drawn is coloured as a duplicate — the second fib(3), all three later fib(2)s, and so on.
- Two counters sit beside it: calls = 15 = 2·F(6) − 1, and distinct values = 6.
- A slider for n replaces the tree with two log-scale bars once it can no longer be drawn.
- At n = 30 those bars read 2,692,537 and 31, with the ratio 86,856x printed between them.
- A strip shows how often each fib(k) is evaluated, with heights following F(n−k+1).
- It is flat at the top and curves sharply up to 832,040 at fib(1), labelled this returns a constant.
- The growth chart carries three curves on a log axis: measured calls, φ^n and 2^n.
- The first two lie exactly on top of each other while 2^n runs away above, annotated 27,643x at n = 50.
- The limits panel contrasts this subtopic with Factorial using two bars each, type runs out and algorithm runs out.
- For Factorial the type bar stops at 20 and the algorithm bar runs off the frame.
- For Fibonacci they are reversed: the type bar reaches 92 and the algorithm bar stops around 45.
- The memoisation panel redraws the fib(5) tree with every duplicate collapsed into an arrow to its first occurrence.
- What remains is a line of six nodes rather than a tree of fifteen.
- The caption reads that the tree did not get smarter, it just stopped recomputing.
- Throughout, the deepest chain is marked at four frames, to keep the depth and the width visually separate.

<!-- @edgeCases -->
- n equal to zero — F(0) is 0, which is why the base case returns n rather than 1.
- n equal to one — F(1) is 1, and the same base case covers it.
- Negative n — n <= 1 returns n, while n == 1 would recurse forever; the iterative form simply runs zero times.
- n = 46 with a 32-bit int — the last Fibonacci that fits; F(47) is 2,971,215,073 and overflows.
- n = 92 with a 64-bit type — the last that fits, and the natural upper bound for the loop.
- n = 93 with a 64-bit type — wraps silently, while Python returns it exactly.
- n = 71 with Binet's formula — the first value it gets wrong, off by exactly 1.
- n around 45 with the naive recursion — 3.4 seconds, on a value that still fits a 32-bit int.
- n = 30 in Python with the naive recursion — 96 milliseconds, with the recursion depth only 29.
- A warm lru_cache when benchmarking — returns in constant time and reports roughly 25ns at every n, which measures a lookup rather than a computation.
- Very large n in Python — exact at any size, and the point where fast doubling starts to matter.

<!-- @pitfalls -->
- Returning 1 from the base case. F(0) is 0 and F(1) is 1, so the base case has to return n; returning 1 shifts the whole sequence.
- Writing the base case as n == 1. n = 0 then falls through and recurses into negative n forever.
- Shipping the naive recursion because it matches the definition. It makes 2·F(n+1)−1 calls and takes 3.4 seconds at n = 45, a value that still fits a 32-bit int.
- Describing the cost as 2^n. The growth factor is the golden ratio, and 2^n overstates the call count by 27,643x at n = 50.
- Expecting the compiler to flatten it. Two self-calls become one at -O1 and stay there — a tree cannot be turned into a loop the way a chain can.
- Expecting RecursionError or StackOverflowError to warn you. The depth is only n − 1; it is the breadth that explodes, so the failure is silent slowness.
- Benchmarking a memoised version without clearing the cache. A warm lru_cache is a dictionary lookup and reads as a flat 25ns regardless of n.
- Assuming memoisation is the fastest fix. It restores O(n) but the two-variable loop measured about 6x quicker in Python, since the cache costs a dictionary operation per subproblem.
- Keeping the whole memo table. Only the last two values are ever read, which is what makes the O(1)-space loop possible.
- Trusting Binet's closed form. It is exact only to F(70) and wrong from F(71), while a 64-bit loop is exact to F(92) — 22 values where the slower method is the correct one.
- Storing the result in an int. The last Fibonacci that fits is F(46), against F(92) for a 64-bit type.
- Forgetting the bound entirely. F(93) wraps silently in C++ and Java, with no warning at any optimisation level.

<!-- @doubt -->
### Why is the naive version so slow when the recurrence is so simple?

<!-- @answer -->
Because the two calls know nothing about each other. Computing F(n-1) already computes F(n-2) somewhere inside it, and the naive version throws that away and starts again. The waste has an exact shape: fib(k) is evaluated F(n-k+1) times, so at n = 30 fib(1) — which returns a constant — is evaluated 832,040 times. In total that is 2,692,537 calls to produce 31 distinct values, a redundancy factor of 86,856. Nothing about the recurrence requires this; it is purely an artefact of not remembering anything.

<!-- @doubt -->
### Is it really O(2^n)?

<!-- @answer -->
No, and the difference is large. Each frame makes two calls but one is a strictly smaller subproblem, so the tree is lopsided and the growth factor is the golden ratio rather than 2. Measured, calls(n+1)/calls(n) converges to 1.618034. The exact count is 2·F(n+1)−1, so the cost of computing a Fibonacci number naively is itself a Fibonacci number. At n = 50 the true count is 40,730,022,147 while 2^n is 1,125,899,906,842,624 — an overstatement of 27,643x. Both are exponential, but if you use 2^n to decide whether something is feasible you will be wrong by four orders of magnitude.

<!-- @doubt -->
### Will the stack overflow?

<!-- @answer -->
No, and that is the part people misjudge. The deepest chain is n − 1 frames, because the longest path down the tree subtracts one each time. At n = 30 the depth is 29 — nowhere near any limit — while 2,692,537 calls are made. The tree is wide, not deep. So the failure mode is not RecursionError or StackOverflowError; it is the program quietly taking longer and longer. Measured wall clock: 2.41ms at n = 30, 293.93ms at n = 40, and 3,397ms at n = 45.

<!-- @doubt -->
### Can the compiler optimise this like it did the others?

<!-- @answer -->
Only halfway, and this is the first subtopic where that is true. Sum, factorial, reverse and palindrome all reached -O1 with zero self-calls remaining. Here the function is written with two self-calls, one disappears at -O1, and one is still there at -O2. Reading the generated code, the fib(n-2) arm became the loop — n is reassigned to n-2 and the code branches back — while fib(n-1) remains a real call inside it. The reason is structural: a chain passes a single value forward, which an accumulator can carry, whereas a tree needs a second result that no single accumulator captures. You have to rewrite this one yourself.

<!-- @doubt -->
### Which limit actually stops me here?

<!-- @answer -->
The algorithm, which is an exact inversion of the previous subtopic. Factorial's type ran out at 12! for a 32-bit int and 20! for 64-bit, while the stack would have allowed 173,828 frames — the type was the binding constraint. Fibonacci is the reverse: a 32-bit int holds up to F(46) and a 64-bit one up to F(92), and the depth never exceeds n − 1, so neither ever objects. What fails is the running time. At n = 45 the naive version takes 3.4 seconds on a value that still fits a 32-bit int, and reaching F(92) would take a projected 710 years against the loop's 32.1 nanoseconds.

<!-- @doubt -->
### What is the smallest change that fixes it?

<!-- @answer -->
Remember what you have already computed. Add a table, return the stored answer when there is one, and store the result before returning — two extra lines, and the call count drops from 2·F(n+1)−1 to n, because each subproblem is now computed once. Measured 106.4ns at n = 40 against the naive version's 304,110,194.3ns. That is memoisation, and Fibonacci is the smallest example of dynamic programming there is: the recurrence was already correct, and all that was missing was refusing to recompute.

<!-- @doubt -->
### Then why bother with the loop?

<!-- @answer -->
Because the memo table is never read more than two entries back, so it does not need to exist. Keeping two variables and stepping upward gives the same O(n) time in O(1) space, with no recursion and no allocation. It is also simply faster: in Python the memoised version measured about 6x slower than the loop at every size, because a cache costs a dictionary operation per subproblem that the loop does not pay. Memoisation is the conceptual fix; the loop is what you ship.

<!-- @doubt -->
### Is there a closed form, and should I use it?

<!-- @answer -->
There is — Binet's formula, F(n) = round(φ^n / √5) — and no, not usually. Measured, it is exact only up to F(70) and first disagrees at F(71), where it returns 308,061,521,170,130 against the true 308,061,521,170,129. A 64-bit loop is exact all the way to F(92), so there are 22 values where the O(n) method is right and the O(1) method is wrong. This is the same result Sum of First N Numbers produced, where n(n+1)/2 overflowed 19,195 inputs before the loop did. A closed form is only better if its arithmetic is exact over the range you care about, and double precision runs out before the integer type does.

<!-- @doubt -->
### What is fast doubling for, then?

<!-- @answer -->
Very large n with big integers. It uses the identities F(2k) = F(k)·(2F(k+1) − F(k)) and F(2k+1) = F(k)² + F(k+1)², so each step halves n instead of decrementing it, giving O(log n) — seven levels at n = 92 rather than ninety-two. Within the range a 64-bit integer can hold it barely matters: measured 6.4ns at n = 40 against the loop's 13.3ns, with both in single-digit or low-double-digit nanoseconds. Where it earns its place is Python or BigInteger arithmetic at n in the thousands, where each doubling step roughly doubles the number of digits rather than adding one term.

<!-- @doubt -->
### Why did my memoised benchmark come out constant?

<!-- @answer -->
Because you measured a cache hit rather than a computation. An lru_cache with no size limit persists between calls, so after the first run every subsequent one is a dictionary lookup — which reads as roughly 25 nanoseconds at n = 10 and the same at n = 30, flat in n, which is the giveaway. Clearing the cache before each run gives the real figures: 1,118.7ns at n = 10 and 3,197.8ns at n = 30. Both numbers are interesting, but only one of them is the cost of computing a Fibonacci number, and it is worth being explicit about which you are reporting.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Dynamic programming, of which this is the smallest possible example. The pattern generalises directly: write the recurrence from the definition, notice that the subproblems overlap, cache the answers so each is computed once, and then — very often — observe that the cache is only read a bounded distance back and replace it with a loop that fills the same values in order. That is exactly the path from the naive recursion here to the memoised version to the two-variable loop. Fibonacci is where it is easiest to see, because the overlap is visible in a single small diagram rather than hidden in a table of states.
