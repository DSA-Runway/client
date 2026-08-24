---
id: trapping-rainwater
topic: Stacks
title: Trapping Rainwater
difficulty: Hard
status: ready
prerequisites:
  - next-greater-element
  - next-smaller-element
  - sum-of-subarray-minimums
  - implement-stack-using-arrays
relatedIds:
  - sum-of-subarray-minimums
  - next-greater-element
  - implement-min-stack
  - remove-k-digits
  - next-smaller-element
---

<!-- @summary -->
This problem lives in the Stacks topic, and the stack is measurably the worst way to solve it — **6.8x slower** than two pointers at n = 1,000,000 and using O(n) space to two pointers' zero. More surprising: the prefix/suffix array method, which uses the *most* memory, is the **fastest in C++ at 0.84x** two pointers, because its three straight-line passes vectorize while the two-pointer loop cannot. That advantage is entirely SIMD — with the vectorizer off it inverts to 0.65x, and in Python, where there is no vectorizer, two pointers wins outright. Also measured: four "obvious" tie-convention bugs here are not bugs at all (0.00% wrong across 70,000 arrays), while two arithmetic slips are wrong on **99.27%** and **99.82%**.

<!-- @theory -->
## The problem

Each entry of the array is the height of a bar of width 1. Rain falls. How much
water is trapped between the bars?

```
height = [0,1,0,2,1,0,1,3,2,1,2,1]   ->   6

              #
      #~~~~~~~##~#
  #~~###~#~~#####
```

## The local rule

Everything follows from one observation about a **single index**. The water
standing on top of bar `i` is bounded by the tallest bar to its left and the
tallest bar to its right — whichever of those two is shorter is the height the
water can reach, because it will spill over the shorter side first.

```
water[i] = min( max(h[0..i]), max(h[i..n-1]) ) - h[i]
```

That is the whole problem. It is never negative, because both maxima include
`h[i]` itself, so `min(L, R) >= h[i]` always. There is no case analysis and no
clamping to write.

What remains is purely a question of **how to obtain those two maxima**, and
the four approaches below differ in nothing else. That is unusual: normally
different approaches to a problem embody different insights. Here they embody
one insight and four data-access strategies, which is exactly why this problem
turns into a measurement exercise rather than an argument.

## Four ways to get the maxima

```
recompute per index      scan left and scan right, every time      O(n^2)
precompute both          two arrays, one pass each                 O(n) time, O(n) space
monotonic stack          settle water in horizontal layers         O(n) time, O(n) space
two pointers             advance from the shorter side             O(n) time, O(1) space
```

## Why two pointers works without knowing either maximum

This is the only genuinely subtle argument in the problem, so it is worth
stating carefully.

Keep `l` at the left end and `r` at the right, with `lm` the tallest bar seen
from the left so far and `rm` the tallest seen from the right. Now suppose
`h[l] < h[r]`. We do **not** know the true maximum to the right of `l` — but we
know it is at least `h[r]`, and `h[r] > h[l]`.

The water at `l` is `min(trueLeftMax, trueRightMax) - h[l]`. We know
`trueLeftMax = lm` exactly, because everything left of `l` has been visited.
And `trueRightMax >= h[r] > h[l]`. So the `min` is decided: whichever of the two
is smaller, `lm` is the binding one whenever `lm <= h[r]`, and `lm` is what we
have. The right maximum's exact value is irrelevant — it only needs to be big
enough not to be the constraint, and the comparison `h[l] < h[r]` is precisely
the test for that.

So the algorithm never needs a value it does not have. It advances the pointer
on the shorter side because that is the side whose answer is already pinned
down.

## What is fragile here, and what is not

Four comparison conventions that look like they should matter were measured
across 70,000 random arrays, and **none of them is a bug**:

```
stack: pop on >= instead of >               0.00% wrong
two pointers: h[l] <= h[r] instead of <     0.00% wrong
two pointers: compare lm < rm instead       0.00% wrong
two pointers: while (l <= r) instead of <   0.00% wrong
```

That is worth pausing on, because it is the opposite of what the neighbouring
problems teach. In Remove K Digits, popping on `>=` instead of `>` is wrong on
13.0% of inputs. In Implement Min Stack, writing `<` instead of `<=` is wrong
on 22.7%. Here the equivalent choices are all free, and for a reason: every
tie contributes **zero** water. Popping an equal bar computes a width times a
height difference of `0`; advancing either pointer when the two are equal
accumulates the same `0`. The arithmetic absorbs the ambiguity.

The two things that *are* fragile are arithmetic rather than comparison:

```
stack: width as i - top instead of i - top - 1       99.27% wrong
two pointers: update lm after adding, not before     99.82% wrong
```

Both fail on almost every input, and the second produces **negative** totals —
`t += lm - h[l]` before `lm` has absorbed `h[l]` subtracts whenever a new
maximum arrives. These are the good kind of bug: they announce themselves on
the first test.

So the hazard profile is inverted from the rest of the topic. Here the
comparisons forgive and the arithmetic does not.

## The measurements

Best of nine runs, random heights in 0..99999:

```
n = 20,000       arrays    19,125 ns    stack   134,375 ns    two pointers    22,125 ns
n = 1,000,000    arrays   914,292 ns    stack 7,421,291 ns    two pointers 1,091,083 ns
```

Two results stand out, and both are the reverse of the usual story.

**The stack is 6.8x slower than two pointers.** It is the reason this problem
sits in the Stacks topic and it is the approach to reach for last. It performs
almost exactly one pop per element — 999,974 pops over 1,000,000 elements — so
the work is linear, but each element costs a push, a data-dependent inner loop,
and an indirect load `h[st.back()]` on every comparison. Replacing the stack of
indices with a stack of `(index, height)` pairs to remove that indirection
recovered only **1.18x** of the gap (7,372,666 ns to 6,270,750 ns), so the
indirection is about a sixth of the problem and the rest is the push/pop
bookkeeping itself, which no compiler can vectorize away.

**The array method is faster than two pointers, at 0.84x.** The approach that
allocates two extra arrays beats the one that allocates nothing. Its three
passes are straight-line loops with sequential access, and the final
accumulation `t += min(L[i], R[i]) - h[i]` vectorizes; the two-pointer loop
cannot be vectorized at all, because the next index depends on the comparison
just made.

Compiling the identical source with `-fno-vectorize -fno-slp-vectorize`
confirms it:

```
                     vectorized       scalar
arrays                848,541 ns   1,565,875 ns     1.85x slower
two pointers        1,019,583 ns   1,020,334 ns     unchanged
ratio (2ptr/arrays)      1.20x         0.65x        the ordering inverts
```

The two-pointer time does not move at all. The whole of the array method's
advantage is SIMD, and it is a property of this machine and this compiler
rather than of the algorithm.

**In Python the ordering inverts again**, exactly as the mechanism predicts —
no vectorizer, so the method doing the fewest interpreter operations wins:

```
n = 200,000     two pointers 17.8 ms     arrays 31.0 ms     stack 37.5 ms
```

## Branch prediction, and the input that exposes it

The two-pointer loop has one data-dependent branch, which invites the
assumption that it mispredicts constantly. Counting how often the branch
outcome differs from the previous iteration says otherwise:

```
shape                two pointers   arrays    ratio     branch flips per 1M steps
random 0..99999        1,019,583   848,541    1.20x            12
symmetric bowl         1,014,875   826,917    1.23x             0
strictly increasing    1,019,250   861,917    1.18x             0
strictly decreasing    1,062,833   856,417    1.24x             0
symmetric hill         2,199,458   823,000    2.67x       999,998
```

On random data the branch flips **twelve times in a million steps**. Once one
side's running maximum pulls ahead, the pointer on the other side advances for
a long run, so the branch is almost perfectly predictable — random input will
never reveal a misprediction cost.

The symmetric hill does. Both halves rise toward a centre peak, so whichever
side is currently shorter alternates on nearly every step: 999,998 flips, and
the time jumps to 2.67x. Note that this shape traps **no water at all**. The
adversarial input for speed and the adversarial input for the answer are
completely different arrays, which is a useful thing to know before choosing a
benchmark.

## The one place the arithmetic can overflow

At the stated limits — n up to 20,000 and heights up to 100,000 — the largest
possible total is a single bowl:

```
[100000, 0, 0, ..., 0, 100000]  with n = 20,000
total = 19,998 * 100,000 = 1,999,800,000
INT_MAX  = 2,147,483,647       headroom 147,683,647, or 7.4%
```

So a 32-bit accumulator fits, with 7% to spare. That is a narrow enough margin
to be worth knowing rather than assuming: raise `n` to 25,000 with the same
shape and the total is 2,499,800,000, which overflows `int` by 352,316,353. The
per-index term never overflows; only the running sum can.

<!-- @intuition -->
Water on a bar is capped by the shorter of the two tallest walls flanking it, so the entire problem is a lookup of two maxima and every approach differs only in how it obtains them. That makes it a measurement problem rather than an insight problem — and the measurements go against the reputations: the stack is 6.8x slower than two pointers, and the method that allocates the most memory is the fastest in C++ because its passes vectorize.

<!-- @approach -->
### Brute force — recompute both maxima at every index

<!-- @idea -->
Apply the local rule directly. For each index, scan left for the tallest bar at or before it, scan right for the tallest at or after it, and add `min(L, R) - h[i]`. Correct by definition, and the reference every other approach was verified against.

<!-- @steps -->
```
1. For each index i, scan j from 0 to i tracking the maximum -> L.
2. Scan j from i to n-1 tracking the maximum -> R.
3. Add min(L, R) - h[i] to the total.
4. No clamping is needed: both maxima include h[i], so the term is never negative.
```

<!-- @complexity -->
- time: O(n^2) — two full scans per index
- space: O(1) beyond the input
- note: Measured against two pointers at 29x for n = 1,000, 167x for n = 5,000 and 712x for n = 20,000 (15,580,875ns against 21,875ns), with the ratio growing linearly as expected. Used as the reference for 50,000 randomised cross-checks with n up to 14 and value caps of 3, 6 and 20 to force ties and plateaus — 0 mismatches against all three linear methods.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

long long trap(const vector<int>& h) {
    int n = h.size();
    long long total = 0;

    for (int i = 0; i < n; i++) {
        int L = 0, R = 0;
        for (int j = 0; j <= i; j++) L = max(L, h[j]);
        for (int j = i; j < n; j++) R = max(R, h[j]);
        total += min(L, R) - h[i];       // never negative: both maxima include h[i]
    }
    return total;
}
```

<!-- @annotations -->
- 11: Both loops are inclusive of i, which is what guarantees the term is non-negative — writing j < i and j > i instead would let min(L,R) fall below h[i] and produce negative water at every local maximum.
- 13: No max(0, ...) wrapper is needed anywhere in this problem. If you find yourself adding one, the maxima are being computed over the wrong ranges.
- 7: total is long long even here, because the sum can reach 1,999,800,000 at the stated limits — within int by only 7.4%, and past it the moment n reaches 21,477.

<!-- @code java -->
```java
static long trap(int[] h) {
    int n = h.length;
    long total = 0;

    for (int i = 0; i < n; i++) {
        int L = 0, R = 0;
        for (int j = 0; j <= i; j++) L = Math.max(L, h[j]);
        for (int j = i; j < n; j++) R = Math.max(R, h[j]);
        total += Math.min(L, R) - h[i];
    }
    return total;
}
```

<!-- @annotations -->
- 3: long rather than int for the accumulator, for the same 7.4% headroom reason; Java has no unsigned types, so this is the only defence.
- 8: Math.max on primitives compiles to a branchless conditional move, so this inner loop is fast per iteration and still quadratic overall — a good illustration that constant factors do not rescue the wrong complexity.
- 9: Each term is computed independently, which makes this trivially parallelisable and still the wrong approach; the linear methods win by doing less work, not by doing it faster.

<!-- @code python -->
```python
def trap(h: list[int]) -> int:
    n = len(h)
    total = 0
    for i in range(n):
        L = max(h[:i + 1])
        R = max(h[i:])
        total += min(L, R) - h[i]
    return total
```

<!-- @annotations -->
- 5: h[:i + 1] copies the slice before scanning it, so this is O(n) space per iteration on top of the O(n) time — the version most likely to be written and the most expensive one here.
- 6: max(h[i:]) has the same problem from the other end. Passing explicit indices to a manual loop avoids both copies without changing the complexity class.
- 7: Python integers are arbitrary precision, so the overflow that constrains the C++ and Java versions does not exist here.

<!-- @approach -->
### Prefix and suffix maximum arrays

<!-- @idea -->
The brute force recomputes the same two maxima over and over. Compute them once instead: one left-to-right pass filling a prefix-maximum array, one right-to-left pass filling a suffix-maximum array, then one pass applying the local rule. Three straight-line loops, no branches on the data.

<!-- @steps -->
```
1. L[0] = h[0]; L[i] = max(L[i-1], h[i]) going left to right.
2. R[n-1] = h[n-1]; R[i] = max(R[i+1], h[i]) going right to left.
3. total = sum over i of min(L[i], R[i]) - h[i].
```

<!-- @complexity -->
- time: O(n) — three passes, no nesting
- space: O(n) — two extra int arrays, 8 bytes per element, allocated unconditionally
- note: The fastest of the four in C++ despite using the most memory: 914,292ns at n = 1,000,000 against two pointers' 1,091,083ns, a ratio of 0.84x. The advantage is entirely vectorization — compiled with -fno-vectorize it slows to 1,565,875ns, a factor of 1.85, while the two-pointer time is unchanged at 1,020,334ns and the ordering inverts to 0.65x. In Python, with no vectorizer, it loses to two pointers 31.0ms to 17.8ms.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

long long trap(const vector<int>& h) {
    int n = h.size();
    if (n == 0) return 0;

    vector<int> L(n), R(n);
    L[0] = h[0];
    for (int i = 1; i < n; i++) L[i] = max(L[i - 1], h[i]);

    R[n - 1] = h[n - 1];
    for (int i = n - 2; i >= 0; i--) R[i] = max(R[i + 1], h[i]);

    long long total = 0;
    for (int i = 0; i < n; i++) total += min(L[i], R[i]) - h[i];
    return total;
}
```

<!-- @annotations -->
- 7: The empty guard is needed because L[0] = h[0] on the next lines would read past the end; the two-pointer version needs no such guard, which is one small point in its favour.
- 11: A running maximum is a scan with a loop-carried dependency, so this loop does not vectorize on its own — the payoff comes at line 17.
- 17: This loop is the one that vectorizes: three sequential reads and an accumulate, no branches and no dependencies between iterations. Disabling the vectorizer makes the whole function 1.85x slower while leaving two pointers untouched. The term is also never negative, because both arrays include h[i] at index i, so no clamping belongs here.

<!-- @code java -->
```java
static long trap(int[] h) {
    int n = h.length;
    if (n == 0) return 0;

    int[] L = new int[n], R = new int[n];
    L[0] = h[0];
    for (int i = 1; i < n; i++) L[i] = Math.max(L[i - 1], h[i]);

    R[n - 1] = h[n - 1];
    for (int i = n - 2; i >= 0; i--) R[i] = Math.max(R[i + 1], h[i]);

    long total = 0;
    for (int i = 0; i < n; i++) total += Math.min(L[i], R[i]) - h[i];
    return total;
}
```

<!-- @annotations -->
- 5: new int[n] zero-fills both arrays before either is written, which is work the C++ version also pays via vector's value-initialisation — worth knowing when the measured constant matters.
- 10: Counting down from n - 2 with >= 0 is the standard reverse-scan bound; using > 0 would leave R[0] holding its zero-initialised value and silently under-count the water at index 0.
- 13: The JIT will vectorize this loop once it is hot, but only after enough iterations to trigger compilation — short arrays get the scalar version, which is part of why microbenchmarks on small inputs mislead.

<!-- @code python -->
```python
def trap(h: list[int]) -> int:
    n = len(h)
    if n == 0:
        return 0

    L = [0] * n
    R = [0] * n
    L[0] = h[0]
    for i in range(1, n):
        L[i] = max(L[i - 1], h[i])

    R[n - 1] = h[n - 1]
    for i in range(n - 2, -1, -1):
        R[i] = max(R[i + 1], h[i])

    return sum(min(L[i], R[i]) - h[i] for i in range(n))
```

<!-- @annotations -->
- 13: range(n - 2, -1, -1) — the stop value is -1, not 0, or index 0 is never visited. This is the single most common transcription error when porting a reverse loop into Python.
- 16: The generator expression avoids materialising a third list, but measured at 31.0ms for n = 200,000 this is still the slower method in Python; the C++ result does not transfer because there is no vectorizer to exploit.
- 6: [0] * n allocates and fills in C, which is much faster than appending in a loop and is the idiomatic way to pre-size a Python list.

<!-- @approach -->
### Monotonic stack — settle the water in horizontal layers

<!-- @idea -->
Keep a stack of indices whose heights are non-increasing. When a taller bar arrives it closes off a basin: pop the bottom of the basin, and the water above it is bounded by the new bar on the right and by whatever is now on top of the stack on the left. This fills the water in horizontal slabs rather than vertical columns — the only approach here that computes the answer in a different order.

<!-- @steps -->
```
1. For each index i, while the stack is non-empty and h[i] > h[stack.top()]:
2.   pop that index as the basin floor.
3.   If the stack is now empty there is no left wall, so stop.
4.   width = i - stack.top() - 1, and height = min(h[i], h[stack.top()]) - floor height.
5.   Add width * height.
6. Push i.
```

<!-- @complexity -->
- time: O(n) amortised — measured 999,974 pops over 1,000,000 elements, almost exactly one per element
- space: O(n) worst case for the stack — measured max depth 27 of 200,000 on random data (0.01%) but 200,000 of 200,000 on decreasing or all-equal input
- note: The slowest linear method by a wide margin: 7,421,291ns at n = 1,000,000, or 6.80x two pointers, and 6.07x at n = 20,000. The gap is not the index indirection — replacing the stack of indices with a stack of (index, height) pairs recovered only 1.18x of it, from 7,372,666ns to 6,270,750ns. The rest is the push/pop bookkeeping and its data-dependent inner loop, which cannot be vectorized.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

long long trap(const vector<int>& h) {
    int n = h.size();
    long long total = 0;
    vector<int> st;                          // indices, heights non-increasing

    for (int i = 0; i < n; i++) {
        while (!st.empty() && h[i] > h[st.back()]) {
            int floorIdx = st.back();
            st.pop_back();
            if (st.empty()) break;           // no left wall, so nothing is trapped
            int width  = i - st.back() - 1;
            int height = min(h[i], h[st.back()]) - h[floorIdx];
            total += (long long)width * height;
        }
        st.push_back(i);
    }
    return total;
}
```

<!-- @annotations -->
- 11: Popping on > or on >= gives identical answers here — measured 0.00% difference over 70,000 arrays — because an equal bar yields a height of exactly 0 and contributes nothing. That is unusual: the same choice is wrong on 13.0% of inputs in Remove K Digits.
- 14: Without this break, st.back() on the next line reads an empty vector. The condition is not rare: it fires at every new global maximum.
- 15: i - st.back() - 1, not i - st.back(). The bars at both ends are walls, not floor, so the span between them is one shorter. Writing it without the -1 is wrong on 99.27% of inputs.
- 16: min of the two walls minus the floor height, which is the thickness of this horizontal slab — the layers below it were already added when their own floors were popped.
- 17: The cast is on width before the multiply. Both factors are int, so the product would be computed in 32 bits and only then widened, which is the same promotion trap as anywhere else.
- 8: Measured max depth 27 of 200,000 on random heights, so in practice this vector stays in L1 — the O(n) worst case needs decreasing or all-equal input to appear.

<!-- @code java -->
```java
import java.util.ArrayDeque;
import java.util.Deque;

static long trap(int[] h) {
    int n = h.length;
    long total = 0;
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && h[i] > h[st.peek()]) {
            int floorIdx = st.pop();
            if (st.isEmpty()) break;
            int width  = i - st.peek() - 1;
            int height = Math.min(h[i], h[st.peek()]) - h[floorIdx];
            total += (long) width * height;
        }
        st.push(i);
    }
    return total;
}
```

<!-- @annotations -->
- 7: Deque<Integer> boxes every index, so this allocates far more than the C++ vector<int> and is the main reason the stack approach looks even worse in Java than the 6.8x measured in C++.
- 11: st.pop() both removes and returns, unlike C++ where pop_back() returns void and back() must be read first — a frequent source of transcription bugs in both directions.
- 15: (long) width before the multiply, not after. Casting the product would be too late.

<!-- @code python -->
```python
def trap(h: list[int]) -> int:
    total = 0
    st: list[int] = []                       # indices, heights non-increasing

    for i, x in enumerate(h):
        while st and x > h[st[-1]]:
            floor_idx = st.pop()
            if not st:
                break
            width = i - st[-1] - 1
            height = min(x, h[st[-1]]) - h[floor_idx]
            total += width * height
        st.append(i)

    return total
```

<!-- @annotations -->
- 6: `while st and x > h[st[-1]]` — the emptiness test must come first so short-circuiting prevents the IndexError, exactly as in every other monotonic stack in this topic.
- 9: The break exits the while loop only, not the for loop; a return here would abandon the rest of the array, which is a bug that still passes on inputs whose global maximum happens to sit at the end.
- 12: Measured 37.5ms at n = 200,000, the slowest of the three linear methods in Python as well as in C++ — the ranking of this approach is the one thing that does not change between languages.

<!-- @approach -->
### Two pointers — the one to actually use

<!-- @idea -->
Walk in from both ends, always advancing the pointer on the shorter side. That side's answer is already fully determined: its own running maximum is exact, and the opposite side is known to be taller, so it cannot be the binding constraint. No arrays, no stack, one pass, constant space.

<!-- @steps -->
```
1. l = 0, r = n-1, lm = 0, rm = 0, total = 0.
2. While l < r: if h[l] < h[r], update lm = max(lm, h[l]), add lm - h[l], advance l.
3. Otherwise update rm = max(rm, h[r]), add rm - h[r], retreat r.
4. Update the running maximum BEFORE adding, or the term goes negative.
```

<!-- @complexity -->
- time: O(n) — each step advances one pointer, so exactly n-1 iterations
- space: O(1) — four scalars, nothing allocated
- note: 1,091,083ns at n = 1,000,000 and 22,125ns at n = 20,000. Slower than the array method by 1.20x in C++ purely because it cannot vectorize, and faster than it in Python (17.8ms against 31.0ms) for the same reason inverted. The branch is far more predictable than it looks — 12 flips per 1,000,000 steps on random data — but a symmetric hill forces 999,998 flips and costs 2.67x, and that shape traps no water at all.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

long long trap(const vector<int>& h) {
    int l = 0, r = (int)h.size() - 1;
    int lm = 0, rm = 0;
    long long total = 0;

    while (l < r) {
        if (h[l] < h[r]) {
            lm = max(lm, h[l]);              // update first
            total += lm - h[l];              // then accumulate
            l++;
        } else {
            rm = max(rm, h[r]);
            total += rm - h[r];
            r--;
        }
    }
    return total;
}
```

<!-- @annotations -->
- 11: h[l] < h[r] or h[l] <= h[r] — both are correct, measured 0.00% difference, because when the two are equal either side accumulates the same amount. Comparing lm < rm instead is also correct, and so is looping while l <= r.
- 12: This ordering is the one thing that is not free. Updating lm after the accumulate is wrong on 99.82% of inputs and produces negative totals, because a new maximum would be charged against the previous one.
- 13: lm - h[l] is exact, not an estimate. Everything left of l has been seen, so lm is the true left maximum; the right side only has to be taller, which the branch condition guarantees.
- 6: r starts at size() - 1 with an explicit cast, since size() is unsigned and an empty vector would otherwise make r a very large positive number rather than -1.
- 7: Four scalars and no allocation — the only approach here that touches no memory beyond the input, which is its real advantage over the 1.20x-faster array method.

<!-- @code java -->
```java
static long trap(int[] h) {
    int l = 0, r = h.length - 1;
    int lm = 0, rm = 0;
    long total = 0;

    while (l < r) {
        if (h[l] < h[r]) {
            lm = Math.max(lm, h[l]);
            total += lm - h[l];
            l++;
        } else {
            rm = Math.max(rm, h[r]);
            total += rm - h[r];
            r--;
        }
    }
    return total;
}
```

<!-- @annotations -->
- 2: h.length - 1 on an empty array gives -1, and the loop condition l < r is immediately false, so the empty case needs no special guard here — unlike the array method, which must check before writing L[0].
- 8: Math.max compiles to a conditional move, so this is branchless; the only real branch in the loop is the h[l] < h[r] test at line 7.
- 4: long, not int. The accumulator is the only value in this problem that can overflow, and it does so from n = 21,477 upward with maximal heights.

<!-- @code python -->
```python
def trap(h: list[int]) -> int:
    l, r = 0, len(h) - 1
    lm = rm = 0
    total = 0

    while l < r:
        if h[l] < h[r]:
            lm = max(lm, h[l])
            total += lm - h[l]
            l += 1
        else:
            rm = max(rm, h[r])
            total += rm - h[r]
            r -= 1

    return total
```

<!-- @annotations -->
- 2: len(h) - 1 is -1 for an empty list and the loop never runs, so no guard is needed; note that this relies on l < r rather than a slice, which would silently accept the empty case differently.
- 8: The update-before-accumulate ordering matters here exactly as much as in C++ — Python will happily accumulate a negative total and return it without complaint.
- 16: Measured 17.8ms at n = 200,000, the fastest of the three linear methods in Python. The C++ ranking is the opposite, and the difference is entirely that CPython has no vectorizer for the array method to exploit.

<!-- @example -->

<!-- @input -->
```
height = [0,1,0,2,1,0,1,3,2,1,2,1]
```

<!-- @output -->
```
6
```

<!-- @why -->
The canonical case, and the one to trace with the local rule rather than with any algorithm. Applying `min(maxLeft, maxRight) - h[i]` index by index gives water at exactly five positions, summing to 6. Every approach here produces this number by a different route and in a different order — which is precisely the point that makes the problem a measurement exercise.

<!-- @walkthrough -->
- Prefix maxima: [0,1,1,2,2,2,2,3,3,3,3,3]; suffix maxima: [3,3,3,3,3,3,3,3,2,2,2,1].
- Taking min of the two at each index: [0,1,1,2,2,2,2,3,2,2,2,1].
- Subtracting the bar heights gives water [0,0,1,0,1,2,1,0,0,1,0,0] — five non-zero positions summing to 6.
- The stack reaches the same 6 in horizontal slabs instead, and in a different order: at i = 3 the height-2 bar closes a basin over index 2 for 1x1 = 1; at i = 6 the height-1 bar closes index 5 for another 1x1 = 1.
- At i = 7 the height-3 bar pops twice — index 6 with width 2 but height 0, contributing nothing, then index 4 with width 3 and height 1 for +3 — and a final slab at i = 10 adds the last 1.
- Two pointers walks in from both ends, and never once computes a true right maximum — at each step the far side is merely known to be taller, which is all the min needs.
- All four agree at 6, as they did on all 70,000 randomised cross-checks.

<!-- @example -->

<!-- @input -->
```
height = [2,3,1,2,2,0,1]
```

<!-- @output -->
```
2   (the width bug gives 4; the update-order bug gives -2)
```

<!-- @why -->
The smallest array the search found that separates the two genuinely fragile implementations from the correct one. Both bugs are arithmetic rather than comparison, and both fail here in opposite directions — one over-counts by measuring the basin one column too wide, the other returns a **negative** total, which is a physically impossible answer and therefore the easier of the two to notice.

<!-- @walkthrough -->
- Prefix maxima [2,3,3,3,3,3,3] and suffix maxima [3,3,2,2,2,1,1] give min [2,3,2,2,2,1,1].
- Subtracting heights: water is 1 at index 2 and 1 at index 5, everywhere else 0 — total 2.
- The stack version pops index 2 when the bar of height 2 arrives at index 3, with left wall index 1 and right wall index 3, so width = 3 - 1 - 1 = 1 and height = min(2,3) - 1 = 1.
- Writing width as `i - st.back()` instead gives 2 instead of 1 here, doubling that slab and pushing the total to 4.
- The two-pointer update-order bug adds `lm - h[l]` before lm has absorbed h[l], so at index 1 it charges 2 - 3 = -1 against the previous maximum and the total ends at -2.
- Measured across 20,000 arrays of length 2 to 401, the width bug is wrong on 99.27% and the update-order bug on 99.82% — neither survives a single realistic test.

<!-- @example -->

<!-- @input -->
```
a symmetric hill of 1,000,000 bars: h[i] = i for the first half, n - i for the second
```

<!-- @output -->
```
0 water trapped, and two pointers runs 2.67x slower than on random data
```

<!-- @why -->
The input that exposes the two-pointer branch, and it is not the input anyone would think to benchmark. Both halves rise toward a centre peak, so whichever side is currently shorter alternates on nearly every step — 999,998 branch flips in a million iterations, against **12** on random data. The array method is unaffected at 823,000ns because it has no data-dependent branch at all.

<!-- @walkthrough -->
- On random heights the two-pointer branch flips 12 times per million steps: once one side's running maximum pulls ahead, the other pointer advances for a long uninterrupted run.
- That makes the branch almost perfectly predictable, so the loop costs 1,019,583ns — 1.20x the array method, a gap caused by vectorization rather than by misprediction.
- On the symmetric hill the two heights are nearly equal at every step, so the comparison alternates: 999,998 flips.
- The time rises to 2,199,458ns, a 2.67x penalty, while the array method holds at 823,000ns and actually gets relatively faster.
- The shape traps zero water, so the answer is trivial and the timing is the worst case — the adversarial input for speed and for the answer are entirely different arrays.
- The practical lesson: benchmarking two pointers on random data measures a best case for its branch predictor and reveals nothing about this.

<!-- @example -->

<!-- @input -->
```
[100000, 0, 0, ..., 0, 100000] with n = 20,000 — the maximum possible total
```

<!-- @output -->
```
1,999,800,000  (INT_MAX is 2,147,483,647 — 7.4% of headroom)
```

<!-- @why -->
The overflow boundary, computed rather than assumed. A single bowl with maximal walls and a flat floor traps the most water any input within the stated limits can, and the answer fits in a 32-bit int with 147,683,647 to spare. That is close enough that the margin is worth knowing: the same shape at n = 25,000 gives 2,499,800,000 and overflows by 352,316,353.

<!-- @walkthrough -->
- Water on each interior bar is min(100000, 100000) - 0 = 100,000.
- There are n - 2 = 19,998 interior bars, so the total is 19,998 x 100,000 = 1,999,800,000.
- INT_MAX is 2,147,483,647, leaving 147,683,647 of headroom, or 7.4%.
- The crossover is exact: n = 21,476 gives 2,147,400,000 and fits; n = 21,477 gives 2,147,500,000 and exceeds INT_MAX by 16,353.
- Only the running sum is at risk. Each individual term is at most 100,000 and each stack slab is at most width x height = 19,998 x 100,000 = 1,999,800,000 — which is itself within int, but only just, and is why the cast belongs on the operand rather than the product.
- The stack version's `(long long)width * height` and the accumulator's type are therefore two separate decisions, and both are needed.

<!-- @visualization stack -->

<!-- @description -->
Open with the local rule alone, before any algorithm: draw the twelve bars of [0,1,0,2,1,0,1,3,2,1,2,1], pick one index, and animate two arrows sweeping outward to find the tallest bar on each side. Draw a horizontal line at the shorter of the two and fill the gap above the chosen bar in blue, with the formula min(maxLeft, maxRight) - h[i] written beneath. Step that through all twelve indices, accumulating to 6, and caption it "this is the entire problem — everything else is how you obtain the two maxima". Then split into four lanes running the same array simultaneously. The brute-force lane re-sweeps both arrows at every index, visibly redoing work. The array lane fills a prefix row left to right and a suffix row right to left, then sweeps once more taking the min — three clean passes, no backtracking. The stack lane fills water in horizontal slabs rather than vertical columns: when a taller bar arrives, flash the popped floor index, draw the slab between the two walls with its width labelled i - top - 1, and let the slabs stack up. This is the lane worth lingering on, because it is the only one that computes the answer in a different order. The two-pointer lane shows l and r walking inward with lm and rm as two small counters, and crucially draws a question mark over the true right maximum whenever the left pointer advances, captioned "never known, never needed". Then the measurement panels. First a time chart at n = 1,000,000 with arrays at 914,292ns, two pointers at 1,091,083ns and the stack at 7,421,291ns, drawn to scale so the stack bar dwarfs the others, captioned "the stack is why this problem is filed under Stacks, and it is the one to use last". Second, the vectorization panel: the same two bars for arrays and two pointers side by side in a "vectorized" column and a "-fno-vectorize" column, with the ordering visibly flipping from 1.20x to 0.65x, and a Python column beside it where two pointers wins at 17.8ms against 31.0ms. Third, the branch panel: the symmetric hill drawn as a triangle with l and r ticking up its two slopes and the branch outcome flashing alternately, a flip counter racing to 999,998, beside a random array whose counter crawls to 12 — captioned "the adversarial input for speed traps no water at all". Close with a two-column hazard table: the four comparison conventions each marked 0.00% in green, and the two arithmetic slips marked 99.27% and 99.82% in red, under the heading "here the comparisons forgive and the arithmetic does not" — with a footnote comparing to Remove K Digits at 13.0% and Min Stack at 22.7%, where the comparisons did not forgive.

<!-- @sampleInput -->
```json
{"problem":{"input":[0,1,0,2,1,0,1,3,2,1,2,1],"answer":6,"statement":"each entry is a bar of width 1; how much rain is trapped between the bars"},"localRule":{"formula":"water[i] = min(max(h[0..i]), max(h[i..n-1])) - h[i]","neverNegative":"both maxima include h[i] itself, so min(L,R) >= h[i] always — no clamping belongs anywhere in this problem","consequence":"all four approaches share this one insight and differ only in how they obtain the two maxima, which is why the problem reduces to a measurement question"},"trace":{"prefixMax":[0,1,1,2,2,2,2,3,3,3,3,3],"suffixMax":[3,3,3,3,3,3,3,3,2,2,2,1],"minOfBoth":[0,1,1,2,2,2,2,3,2,2,2,1],"water":[0,0,1,0,1,2,1,0,0,1,0,0],"total":6},"twoPointerArgument":{"invariant":"lm is the exact left maximum because everything left of l has been visited","key":"when h[l] < h[r], the true right maximum is at least h[r] and therefore greater than h[l], so it cannot be the binding constraint","conclusion":"the algorithm never needs a value it does not have; it advances the side whose answer is already pinned down"},"approaches":[{"name":"brute force","time":"O(n^2)","space":"O(1)","nsAt1e6":null,"note":"29x/167x/712x slower than two pointers at n = 1000/5000/20000"},{"name":"prefix and suffix arrays","time":"O(n)","space":"O(n) — 8 bytes per element","nsAt1e6":914292,"ratioToTwoPointers":0.84,"note":"fastest in C++ despite the most memory; the advantage is entirely SIMD"},{"name":"monotonic stack","time":"O(n)","space":"O(n) worst case","nsAt1e6":7421291,"ratioToTwoPointers":6.8,"note":"the slowest linear method; ~1.00 pops per element"},{"name":"two pointers","time":"O(n)","space":"O(1)","nsAt1e6":1091083,"ratioToTwoPointers":1.0,"note":"the one to use"}],"vectorization":{"arraysVectorized":848541,"arraysScalar":1565875,"arraysSlowdown":1.85,"twoPointersVectorized":1019583,"twoPointersScalar":1020334,"twoPointersSlowdown":1.0,"ratioVectorized":1.2,"ratioScalar":0.65,"reading":"the array method's win is SIMD on its third pass; the two-pointer loop cannot vectorize because the next index depends on the comparison just made"},"python":{"nAt":200000,"twoPointersMs":17.8,"arraysMs":31.0,"stackMs":37.5,"reading":"no vectorizer, so the ordering inverts and the method with the fewest interpreter operations wins"},"stackCost":{"popsPerElement":1.0,"totalPopsAt1e6":999974,"indirectionExperiment":{"stackOfIndices":7372666,"stackOfPairs":6270750,"recovered":1.18,"reading":"the indirect load h[st.back()] is only about a sixth of the gap; the rest is push/pop bookkeeping that cannot be vectorized"},"maxDepth":[{"shape":"random 0..99999","depth":27,"of":200000,"pct":0.01},{"shape":"random 0..99","depth":2032,"of":200000,"pct":1.02},{"shape":"strictly decreasing","depth":200000,"of":200000,"pct":100.0},{"shape":"strictly increasing","depth":1,"of":200000,"pct":0.0},{"shape":"all equal","depth":200000,"of":200000,"pct":100.0},{"shape":"bowl","depth":199999,"of":200000,"pct":100.0}]},"branchBehaviour":[{"shape":"random 0..99999","twoPointersNs":1019583,"arraysNs":848541,"ratio":1.2,"flipsPerMillion":12},{"shape":"symmetric bowl","twoPointersNs":1014875,"arraysNs":826917,"ratio":1.23,"flipsPerMillion":0},{"shape":"strictly increasing","twoPointersNs":1019250,"arraysNs":861917,"ratio":1.18,"flipsPerMillion":0},{"shape":"strictly decreasing","twoPointersNs":1062833,"arraysNs":856417,"ratio":1.24,"flipsPerMillion":0},{"shape":"symmetric hill","twoPointersNs":2199458,"arraysNs":823000,"ratio":2.67,"flipsPerMillion":999998,"note":"traps zero water — the adversarial input for speed is not the adversarial input for the answer"}],"hazards":{"forgiving":[{"variant":"stack pops on >= instead of >","wrongPct":0.0},{"variant":"two pointers h[l] <= h[r] instead of <","wrongPct":0.0},{"variant":"two pointers compares lm < rm instead of the bars","wrongPct":0.0},{"variant":"two pointers loops while l <= r","wrongPct":0.0}],"whyForgiving":"every tie contributes exactly zero water, so the arithmetic absorbs the ambiguity","fatal":[{"variant":"stack width as i - top instead of i - top - 1","wrongPct":99.27,"example":{"input":[2,3,1,2,2,0,1],"gives":4,"correct":2}},{"variant":"two pointers updates the running max after accumulating","wrongPct":99.82,"example":{"input":[2,3,1,2,2,0,1],"gives":-2,"correct":2},"note":"produces a negative total, which is physically impossible and therefore easy to spot"}],"contrast":{"removeKDigits":"popping on >= instead of > is wrong on 13.0%","implementMinStack":"writing < instead of <= is wrong on 22.7%","here":"the equivalent choices are all free; the fragility moved into the arithmetic"}},"overflow":{"worstCaseInput":"[100000, 0 x 19998, 100000]","total":1999800000,"intMax":2147483647,"headroom":147683647,"headroomPct":7.4,"crossoverN":21477,"atN25000":2499800000,"overflowsBy":352316353,"note":"only the running sum is at risk; each individual term is at most 100000"},"verification":{"smallArrays":{"count":50000,"maxN":14,"valueCaps":[3,6,20],"reference":"O(n^2) brute force","mismatches":0},"largerArrays":{"count":20000,"nRange":"2..401","valueCaps":[2,3,5,50,100000],"reference":"prefix/suffix arrays","mismatches":0},"python":{"count":20000,"mismatches":0}}}
```

<!-- @highlights -->
- The local rule is shown alone first, with two arrows sweeping outward from a single index.
- The blue fill is drawn at the height of the shorter wall, with the formula written beneath.
- Four lanes then run the same array simultaneously, so the shared insight is visible.
- The brute-force lane visibly re-sweeps both arrows at every index.
- The array lane fills a prefix row and a suffix row, then sweeps once more — three clean passes.
- The stack lane fills horizontal slabs rather than vertical columns, the only different ordering.
- Each slab's width is labelled i - top - 1 as it is drawn, making the off-by-one concrete.
- The two-pointer lane draws a question mark over the unknown right maximum, "never known, never needed".
- A time chart at n = 1,000,000 puts arrays at 914,292ns, two pointers at 1,091,083ns, stack at 7,421,291ns.
- The stack bar is drawn to scale so it dwarfs the other two.
- The vectorization panel shows the ordering flipping from 1.20x to 0.65x with SIMD disabled.
- A Python column beside it shows two pointers winning at 17.8ms against 31.0ms.
- The symmetric hill is drawn as a triangle with a flip counter racing to 999,998.
- Beside it a random array's flip counter crawls to 12.
- A hazard table marks four comparison conventions at 0.00% in green and two arithmetic slips at 99.27% and 99.82% in red.
- A footnote contrasts Remove K Digits at 13.0% and Min Stack at 22.7%, where the comparisons did not forgive.

<!-- @edgeCases -->
- **Empty array** — the two-pointer version needs no guard, since `r = n - 1` is -1 and `l < r` is immediately false. The array method must guard, because `L[0] = h[0]` writes before any loop runs.
- **One or two bars** — no water is possible, since every bar is an end wall. All four return 0 without special handling.
- **Strictly increasing or strictly decreasing** — no water at all, but the stack's depth reaches 200,000 of 200,000 on the decreasing case, its worst space behaviour, while the increasing case leaves it at depth 1.
- **All bars equal** — no water, and the stack again reaches full depth because nothing ever pops. The comparison convention (`>` versus `>=`) is invisible here since every slab has height 0.
- **All bars zero** — a special case of all-equal; the answer is 0 and the running maxima never leave 0.
- **A single bowl with maximal walls** — `[100000, 0 x 19998, 100000]` is the maximum possible total at the stated limits: 1,999,800,000, which fits in a 32-bit int by 7.4%.
- **The same bowl at n = 25,000** — 2,499,800,000, overflowing a signed 32-bit accumulator by 352,316,353. The crossover is exactly n = 21,477.
- **A symmetric hill** — traps zero water and is the two-pointer method's worst timing case at 2.67x, with 999,998 branch flips per million steps.
- **The new global maximum in the stack version** — pops the stack empty, so the `if (st.empty()) break` fires. This is not rare; it happens once per record, roughly `ln(n)` times on random data.
- **Ties between the two pointers** — `h[l] == h[r]` can take either branch and both are correct, because the accumulated amount is identical either way.
- **Plateaus of equal height in the stack version** — popped one at a time, each contributing a slab of height 0. Correct but wasteful, and the reason `>` is marginally preferable to `>=` on work done rather than on correctness.

<!-- @pitfalls -->
- **Writing the stack width as `i - top` instead of `i - top - 1`.** Wrong on 99.27% of inputs. The bars at both ends are walls, not floor, so the span between them is one shorter.
- **Updating the two-pointer running maximum after accumulating instead of before.** Wrong on 99.82%, and it produces negative totals — `lm - h[l]` is charged against the previous maximum whenever a new one arrives.
- **Adding a `max(0, ...)` clamp.** It is never needed, because both maxima include `h[i]`. If a clamp appears necessary, the maxima are being computed over the wrong ranges — typically `j < i` instead of `j <= i`.
- **Omitting the empty check after popping the basin floor.** `st.back()` on an empty container is undefined behaviour in C++, and the condition fires at every new global maximum rather than rarely.
- **Using an `int` accumulator.** The maximum total at the stated limits is 1,999,800,000, inside `INT_MAX` by only 7.4%; one step past the stated `n` and it overflows.
- **Casting the product instead of an operand.** `(long long)(width * height)` computes in 32 bits first and then widens, which is too late; the cast belongs on `width`.
- **Writing `range(n - 2, 0, -1)` in the Python suffix loop.** The stop must be `-1`, or index 0 keeps its initialised value and the water at the left end is silently lost.
- **Slicing in the Python brute force.** `max(h[:i+1])` copies the prefix on every iteration, adding O(n) space per step to an already quadratic algorithm.
- **Assuming the two-pointer branch mispredicts on random data.** It flips 12 times per million steps. The penalty is real but needs a symmetric hill to appear, and that shape traps no water — so a random benchmark measures a best case and reports nothing.
- **Benchmarking on random input and concluding the array method is always faster.** Its entire 1.20x advantage is vectorization; with SIMD disabled the ratio inverts to 0.65x, and in Python two pointers wins outright.
- **Reaching for the stack because the problem is filed under Stacks.** It is 6.8x slower than two pointers and uses O(n) space to their zero. It is here to teach the horizontal-slab decomposition, not because it is the right tool.
- **Comparing boxed `Integer` heights with `==` in the Java stack version.** The same reference-comparison hazard as elsewhere; here it hides because heights are usually small enough to land in the Integer cache.

<!-- @doubt -->
Why does the two-pointer method not need to know the true maximum on the far side?

<!-- @answer -->
Because it only needs to know which of the two maxima is smaller, not what the larger one is. Suppose `h[l] < h[r]`. Everything left of `l` has been visited, so `lm` is the exact left maximum. The true right maximum is unknown, but it is certainly at least `h[r]`, and `h[r] > h[l]`. So in `min(trueLeftMax, trueRightMax)`, the right side is guaranteed not to be the binding constraint whenever `lm <= h[r]` — and the value that *is* binding is the one we have. The comparison `h[l] < h[r]` is exactly the test for "my side's answer is already settled", which is why the algorithm advances the shorter side.

<!-- @doubt -->
The stack is the whole reason this problem is in the Stacks topic. Why does the file say to use two pointers?

<!-- @answer -->
Because the measurements are one-sided. At n = 1,000,000 the stack takes 7,421,291ns against two pointers' 1,091,083ns — 6.8x — and it uses O(n) space where two pointers uses four scalars. It is not close on either axis. What the stack is genuinely good for here is the *idea*: it computes the answer in horizontal slabs rather than vertical columns, which is a decomposition that transfers directly to Largest Rectangle in a Histogram, where no two-pointer alternative exists. Learn it for that. On this specific problem it is the approach to reach for last.

<!-- @doubt -->
How can the approach that allocates two extra arrays be faster than the one that allocates nothing?

<!-- @answer -->
Because the cost that dominates is not allocation, it is whether the loop can issue several elements per cycle. The array method's third pass — `total += min(L[i], R[i]) - h[i]` — is three sequential reads and an accumulate with no branch and no dependency between iterations, so the compiler vectorizes it. The two-pointer loop cannot be vectorized at all: the next index depends on the comparison just made, so it processes exactly one element per step no matter how wide the machine is. Compiling the identical source with `-fno-vectorize` settles it — the array method slows from 848,541ns to 1,565,875ns while the two-pointer time moves by 0.07%, and the ordering inverts from 1.20x to 0.65x. The advantage is SIMD, not the algorithm, and it does not survive into Python.

<!-- @doubt -->
If the array method is faster in C++, why is two pointers still the recommendation?

<!-- @answer -->
Because 1.20x of time is a smaller thing than O(n) of space, and because the 1.20x is not portable. It is a property of this compiler on this machine: turn off the vectorizer and it becomes 0.65x, and move to Python and two pointers wins outright at 17.8ms against 31.0ms. The space difference does not move — two extra `int` arrays is 8 bytes per element on every platform, against four scalars. If you are optimising one known hot loop on one known target, measure and take whichever wins there. As a default answer, constant space that is within 20% of the best time is the better trade.

<!-- @doubt -->
Four different comparison conventions all measured 0.00% wrong. Is that not just a weak test?

<!-- @answer -->
It was checked deliberately hard against that possibility. The value caps were pushed down to 2, 3 and 5 specifically to make ties and plateaus the common case rather than the rare one, across 20,000 arrays of length up to 401, plus 50,000 smaller arrays and a separate 200,000-array search for a single counterexample to each variant. Nothing turned up. There is also a reason, not just an absence of evidence: every tie contributes exactly zero water. Popping an equal bar computes `min(h[i], h[top]) - h[floor]`, which is 0 when the heights are equal; advancing either pointer when `h[l] == h[r]` accumulates the same amount from either side. The ambiguity is absorbed by the arithmetic rather than resolved by the convention.

<!-- @doubt -->
Then why do the neighbouring problems care so much about `>` versus `>=`?

<!-- @answer -->
Because in those problems the tied element *is* the answer, not a term that evaluates to zero. In Remove K Digits a pop is a deletion from the output, so popping on equality spends one of the `k` deletions for no improvement and is wrong on 13.0% of inputs. In Implement Min Stack a duplicate minimum is a separate prefix's answer, so failing to record it loses information and is wrong on 22.7%. Here a pop only ever contributes `width x height` where the height is 0, so the choice changes how much work is done and not what is computed. The general rule is worth extracting: tie conventions matter exactly when the tied element carries information, and not when it cancels.

<!-- @doubt -->
The two failing variants are wrong on 99%+ of inputs. Is that worth documenting at all?

<!-- @answer -->
Yes, precisely because of the contrast. This topic has been accumulating the other kind of bug — the branch that fires on 0.15% of inputs in Asteroid Collision, the overflow that hides until you pop past a minimum in Min Stack. Those need constructed tests. These two need no tests at all: the width bug over-counts on the first non-trivial array, and the update-order bug returns a negative amount of water, which is physically impossible. Knowing which kind of bug a piece of code is exposed to tells you how much test effort it deserves, and this problem's fragility is concentrated entirely in the arithmetic where the first run will catch it.

<!-- @doubt -->
Why does the symmetric hill make two pointers slow when random data does not?

<!-- @answer -->
Because the branch is data-dependent and random data does not vary it. On random heights, once one side's running maximum pulls ahead the pointer on the other side advances for a long uninterrupted run — measured at **12** branch flips per 1,000,000 steps, which any predictor handles perfectly. The symmetric hill defeats that by keeping `h[l]` and `h[r]` nearly equal at every step, so the comparison alternates: 999,998 flips, and the time goes from 1,019,583ns to 2,199,458ns, a 2.67x penalty. The array method is untouched at 823,000ns because it has no data-dependent branch. The uncomfortable part is that this shape traps zero water, so a correctness-focused test suite would never include it and a random benchmark would never find it.

<!-- @doubt -->
Can the total actually overflow a 32-bit integer, or is that a theoretical worry?

<!-- @answer -->
It is genuinely close rather than either safe or broken. The maximum possible total within the stated limits is a single bowl — `[100000, 0 x 19998, 100000]` — giving 19,998 x 100,000 = 1,999,800,000 against an `INT_MAX` of 2,147,483,647. That is 7.4% of headroom, so an `int` accumulator is correct for this problem and first fails at n = 21,477. Since the stated limit is 20,000, it fits by about one part in fourteen. Use a 64-bit accumulator anyway: the margin is too small to be worth remembering, and the same code with a slightly larger input silently returns a negative answer. Note that this is separate from the per-slab cast in the stack version — `width * height` can reach 2,000,000,000 on its own, so the cast belongs on the operand.

<!-- @doubt -->
The stack does one pop per element, which is linear. Why is it six times slower than another linear method?

<!-- @answer -->
Linear is a statement about growth, not about the constant, and here the constant is large. Each element costs a push, an inner `while` whose trip count depends on the data, and an indirect load `h[st.back()]` on every comparison — measured at 999,974 pops over 1,000,000 elements, so almost exactly one pop each. The obvious suspect is the indirection, so I tested it: replacing the stack of indices with a stack of `(index, height)` pairs removes that load entirely and recovered only **1.18x** of the gap, from 7,372,666ns to 6,270,750ns. So the indirection is about a sixth of it. The rest is the push/pop bookkeeping and the data-dependent inner loop, neither of which any compiler can vectorize or software-pipeline — against two pointers, which is one straight-line step per element.
