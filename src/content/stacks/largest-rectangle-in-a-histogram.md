---
id: largest-rectangle-in-a-histogram
topic: Stacks
title: Largest rectangle in a histogram
difficulty: Hard
status: ready
prerequisites:
  - sum-of-subarray-minimums
  - next-smaller-element
  - next-greater-element
  - trapping-rainwater
relatedIds:
  - sum-of-subarray-minimums
  - next-smaller-element
  - trapping-rainwater
  - next-greater-element
  - remove-k-digits
---

<!-- @summary -->
The problem where the stack finally has no rival — there is no two-pointer trick and no prefix-array shortcut, and the one-pass stack is **2.28x** faster than the two-pass version in C++ and 2.00x in Python. It is also the cleanest place in the topic to settle what tie conventions actually do. Running the *same* four strict/non-strict combinations against both this problem and Sum of Subarray Minimums: this one accepts three of the four and fails the fourth on **69.78%** of inputs, while Sum of Subarray Minimums accepts only two and fails the other two on **78.37%**. Same code, same conventions, different verdicts — because one takes a maximum and the other takes a sum.

<!-- @theory -->
## The problem

Given bar heights of equal width 1, find the area of the largest rectangle that
fits entirely inside the histogram.

```
heights = [2,1,5,6,2,3]   ->   10

        #
      # #
      # #   #
  #   # # # #
  # # # # # #
```

The 10 comes from the bars of height 5 and 6 taken together: width 2, height
`min(5,6) = 5`.

## The one observation

Any rectangle inside the histogram spans some contiguous range of bars, and its
height is limited by the **shortest** bar in that range. So every candidate
rectangle has a height equal to some bar's height — there is no advantage in
choosing a height that no bar has, since you could always raise it to the next
bar's height for free.

That flips the search around. Instead of asking "which range?", ask, for each
bar `i`:

> If bar `i` is the shortest bar in the rectangle, how wide can that rectangle
> get?

The answer is immediate. Extend left until you meet a bar shorter than `h[i]`,
extend right until you meet a bar shorter than `h[i]`, and everything between
those two barriers is at least as tall as `h[i]`.

```
area(i) = h[i] * (nextSmaller(i) - prevSmaller(i) - 1)
```

The answer is the maximum of `area(i)` over all `i`. That is the whole problem,
and it reduces immediately to two things this topic has already built: previous
smaller element and next smaller element.

```
index     0   1   2   3   4   5
heights   2   1   5   6   2   3
prevSm   -1  -1   1   2   1   4
nextSm    1   6   4   4   6   6
width     1   6   2   1   4   1
area      2   6  10   6   8   3      -> max 10
```

Read the third column: bar 2 has height 5, is stopped on the left by the 1 at
index 1 and on the right by the 2 at index 4, so it spreads over indices 2 and 3
for a width of 2 and an area of 10. Note that bar 3, the tallest at height 6, is
*not* the answer — height alone decides nothing, and the winning bar here is
neither the tallest nor the shortest.

## Why the tie convention matters here — and how much

`prevSmaller` and `nextSmaller` each have two reasonable definitions: strictly
smaller, or smaller-or-equal. That is four combinations, and they were all run
against an O(n^2) reference over 50,000 arrays with heights drawn from 1..3 so
that plateaus are the norm:

```
convention                     largest rectangle
strict left, strict right              0.00%  wrong
strict left, non-strict right          0.00%  wrong
non-strict left, strict right          0.00%  wrong
non-strict left, non-strict right     69.78%  wrong
```

Three of four are correct. The failing one fails on a two-element array:

```
[1,1]   ->   gives 1, correct answer 2
```

With smaller-or-equal on *both* sides, each bar of a plateau is walled in by its
own neighbours, so a plateau of `k` equal bars gives every one of them width 1
and nobody claims the full span of `k`. The maximum never sees the rectangle
that actually exists.

Keeping at least one side strict fixes it, because then some member of the
plateau — the leftmost or the rightmost, depending on which side you made
strict — sees straight through the others and claims the whole span. The other
plateau members compute smaller widths, and since the answer is a **maximum**,
those redundant smaller values are harmless.

## The same conventions on a different problem

That "harmless redundancy" argument is doing real work, and it is worth seeing
where it stops applying. Sum of Subarray Minimums uses the *identical* boundary
arrays, with the same four conventions, and asks for a sum instead of a maximum:

```
convention                     largest rectangle    sum of subarray minimums
strict left, strict right              0.00%                 78.37%
strict left, non-strict right          0.00%                  0.00%
non-strict left, strict right          0.00%                  0.00%
non-strict left, non-strict right     69.78%                 78.37%
```

Same 50,000 arrays, same boundary code, opposite requirements:

- **This problem needs at least one strict side.** Redundancy is free because a
  maximum ignores duplicates; the only failure is when *nobody* claims the full
  span.
- **Sum of Subarray Minimums needs exactly one strict side.** A sum cannot
  ignore duplicates. Strict on both sides makes every tied minimum count the
  same subarray, and it over-counts on 78.37%. Non-strict on both under-counts
  on the same 78.37%.

And a third regime sits next door: in Trapping Rainwater all four conventions
measured 0.00% wrong, because a tie there contributes exactly zero water and the
arithmetic absorbs the ambiguity entirely.

So the rule generalises cleanly, and it is not about stacks at all:

> A tie convention matters exactly as much as the tied element's contribution.
> Zero contribution — free. Counted once — needs one strict side. Counted in a
> maximum — needs only that *someone* sees the whole span.

## From boundaries to one pass

The two-pass version computes `prevSmaller` in a left-to-right sweep, then
`nextSmaller` in a right-to-left sweep, then takes the maximum. Three passes and
two `n`-sized arrays.

The one-pass version notices that the stack already knows both boundaries at the
moment it pops. When index `i` causes index `t` to be popped:

- the **right** boundary of `t` is `i` — that is why it is being popped;
- the **left** boundary of `t` is whatever is now on top of the stack, because
  everything between them was popped earlier for being taller.

```
width = i - stack.top() - 1        (or i, if the stack is now empty)
```

So the area for `t` can be finalised on the spot, and neither array is ever
built. One sweep, one container.

The only wrinkle is the end of the array: bars still on the stack when the sweep
finishes never met a shorter bar on the right. A virtual bar of height 0
appended past the end forces them all to pop with the correct right boundary of
`n`, which costs one extra iteration and removes the entire drain loop.

## What it costs

Best of nine runs, random heights in 1..10000:

```
n = 100,000     one-pass    581,542 ns   two-pass  1,325,458 ns   D&C  1,919,250 ns
n = 1,000,000   one-pass  5,916,959 ns   two-pass 13,519,625 ns   D&C 23,707,167 ns
```

The one-pass version is **2.28x** faster at both sizes, and the ratio holds
across input shapes — 2.31x on random data, 1.77x on strictly increasing, 2.83x
on strictly decreasing and 2.79x on all-equal input. In Python the same
comparison gives 33.1ms against 66.1ms, a factor of **2.00**.

That consistency is worth noting after the previous subtopic. In Trapping
Rainwater the ranking between two approaches inverted when the vectorizer was
disabled and inverted again in Python, so the C++ result was a compiler
property. Here the one-pass advantage is doing genuinely less work — three
passes and two arrays become one pass and no arrays — so it survives every
change of shape and language.

## The stack's shape sensitivity, inverted

The stack pops when the incoming bar is not taller, so a **rising** histogram
never pops anything and the stack grows to `n`:

```
random 1..10000          max depth      26 of 200,000    0.01%
random 1..4              max depth       4 of 200,000    0.00%
strictly increasing      max depth 200,000 of 200,000  100.00%
strictly decreasing      max depth       1 of 200,000    0.00%
all equal                max depth       1 of 200,000    0.00%
```

This is the mirror image of Trapping Rainwater, where the stack was
non-increasing and *decreasing* input was the worst case. Same data structure,
opposite monotonicity, opposite adversary. Note also that both plateau cases —
all-equal and low-range random — keep the stack tiny here, because equal bars
pop each other under the `>=` test.

## Divide and conquer, and why it is not the answer

There is a genuine O(n log n) alternative: find the minimum bar in the range,
take `height x fullWidth` as one candidate, then recurse left and right of it.
With a sparse table for range-minimum queries the split is O(1) and the
recursion is O(n log n) on balanced input.

It is 3.30x slower than the one-pass stack at n = 100,000 and 4.01x at
n = 1,000,000, and it has a failure mode the others do not:

```
recursion depth, random input        42 at n = 100,000    129 at n = 1,000,000
recursion depth, sorted input   100,000 at n = 100,000  segfault at n = 1,000,000
```

On sorted input every split peels off one element, so the depth equals `n`. At
n = 1,000,000 with the default 8 MB stack that is a **segmentation fault**, not
a slow answer. It survives the stated limit of n = 100,000, but only just, and
in Python the default recursion limit of 1000 means it fails on any sorted input
longer than about a thousand bars. It is worth knowing as a technique and is the
wrong tool here.

## Arithmetic

Unlike the previous subtopic, overflow is not a concern. At the stated limits —
n up to 100,000 and heights up to 10,000 — the largest possible area is
1,000,000,000, against an `INT_MAX` of 2,147,483,647. That is **114.7%** of
headroom, so a 32-bit accumulator is comfortable rather than marginal. Trapping
Rainwater had 7.4%. The difference is worth internalising: "does it fit in an
int" is a question with an arithmetic answer, and it is worth computing rather
than guessing in either direction.

<!-- @intuition -->
Every rectangle's height equals its shortest bar, so instead of searching over ranges, ask of each bar how far it can spread before something shorter stops it. That turns the problem into previous-smaller and next-smaller, and the stack already knows both at the instant it pops — which is why one pass suffices and is 2.28x faster than computing the two boundary arrays separately.

<!-- @approach -->
### Brute force — every range, tracking the running minimum

<!-- @idea -->
Fix a left endpoint and extend right, keeping the minimum height seen so far. Each extension gives one candidate rectangle whose height is that running minimum. Quadratic, and the reference every other approach was verified against.

<!-- @steps -->
```
1. For each start index i, set mn to +infinity.
2. For each end index j from i to n-1, update mn = min(mn, h[j]).
3. The rectangle spanning i..j has height mn and width j - i + 1.
4. Keep the maximum area seen.
```

<!-- @complexity -->
- time: O(n^2) — the running minimum makes each extension O(1), so this is n^2 and not n^3
- space: O(1) beyond the input
- note: Measured 178x slower than the one-pass stack at n = 1,000, 731x at n = 5,000 and 1,138x at n = 20,000 (115,490,458ns against 101,500ns). Used as the reference for 50,000 randomised cross-checks with heights drawn from 1..2, 1..3 and 1..6 so that plateaus and ties dominate — 0 mismatches against the one-pass stack and divide and conquer.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <climits>
#include <vector>
using namespace std;

long long largestRectangleArea(const vector<int>& h) {
    int n = h.size();
    long long best = 0;

    for (int i = 0; i < n; i++) {
        int mn = INT_MAX;
        for (int j = i; j < n; j++) {
            mn = min(mn, h[j]);                       // running minimum
            best = max(best, (long long)mn * (j - i + 1));
        }
    }
    return best;
}
```

<!-- @annotations -->
- 13: The running minimum is what keeps this O(n^2) instead of O(n^3); recomputing min(h[i..j]) inside the inner loop is the version most people write first and it is another factor of n slower.
- 14: The cast is on mn before the multiply. Within the stated limits the product tops out at 1,000,000,000 and would fit in an int, but the habit is worth keeping since the previous subtopic had only 7.4% of headroom.
- 8: best is initialised to 0 rather than to h[0], which makes the empty-array case correct without a separate guard.

<!-- @code java -->
```java
static long largestRectangleArea(int[] h) {
    int n = h.length;
    long best = 0;

    for (int i = 0; i < n; i++) {
        int mn = Integer.MAX_VALUE;
        for (int j = i; j < n; j++) {
            mn = Math.min(mn, h[j]);
            best = Math.max(best, (long) mn * (j - i + 1));
        }
    }
    return best;
}
```

<!-- @annotations -->
- 9: (long) mn before the multiply, not a cast of the product — casting afterwards would compute in 32 bits first and widen a value that had already wrapped.
- 6: Integer.MAX_VALUE as the identity is safe because the inner loop always executes at least once, so mn is always overwritten before it is used in an area.
- 3: long for the accumulator even though int would suffice at the stated limits, because the same code with heights an order of magnitude larger would silently wrap.

<!-- @code python -->
```python
def largest_rectangle_area(h: list[int]) -> int:
    n = len(h)
    best = 0
    for i in range(n):
        mn = h[i]
        for j in range(i, n):
            mn = min(mn, h[j])
            best = max(best, mn * (j - i + 1))
    return best
```

<!-- @annotations -->
- 5: Seeding mn with h[i] rather than a sentinel avoids importing a maximum constant and is correct because the inner loop starts at j = i.
- 7: Python integers are arbitrary precision, so no overflow reasoning is needed here at all — the C++ and Java casts have no counterpart.
- 8: This is the reference implementation used for cross-checking, not a solution to submit; at n = 20,000 the C++ version already takes 115ms and Python would take minutes.

<!-- @approach -->
### Divide and conquer on the minimum bar

<!-- @idea -->
The largest rectangle either uses the shortest bar in the range — in which case it spans the whole range — or it lies entirely to the left or entirely to the right of that bar. Find the minimum's position, take `height x width` as one candidate, and recurse on the two sides. A sparse table makes each range-minimum lookup O(1).

<!-- @steps -->
```
1. Build a sparse table of argmin over the heights, O(n log n) once.
2. solve(l, r): if l > r return 0.
3. m = index of the minimum in l..r; candidate = h[m] * (r - l + 1).
4. Return max(candidate, solve(l, m-1), solve(m+1, r)).
```

<!-- @complexity -->
- time: O(n log n) on balanced input; O(n) recursion levels on sorted input
- space: O(n log n) for the sparse table, plus O(n) worst-case recursion depth
- note: 3.30x slower than the one-pass stack at n = 100,000 and 4.01x at n = 1,000,000. The recursion depth is the real problem: 42 on random input at n = 100,000 and 129 at n = 1,000,000, but exactly n on sorted input — which segfaults at n = 1,000,000 with the default 8MB stack. Python's default recursion limit of 1000 breaks it on any sorted input past about a thousand bars.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

struct Sparse {
    vector<vector<int>> t;
    const vector<int>* h;
    Sparse(const vector<int>& a) : h(&a) {
        int n = a.size(), K = 1;
        while ((1 << K) <= n) K++;
        t.assign(K, vector<int>(n));
        for (int i = 0; i < n; i++) t[0][i] = i;
        for (int k = 1; k < K; k++)
            for (int i = 0; i + (1 << k) <= n; i++) {
                int x = t[k-1][i], y = t[k-1][i + (1 << (k-1))];
                t[k][i] = a[x] <= a[y] ? x : y;
            }
    }
    int argmin(int l, int r) {
        int k = 31 - __builtin_clz(r - l + 1);
        int x = t[k][l], y = t[k][r - (1 << k) + 1];
        return (*h)[x] <= (*h)[y] ? x : y;
    }
};

long long solve(Sparse& sp, const vector<int>& h, int l, int r) {
    if (l > r) return 0;
    int m = sp.argmin(l, r);
    return max((long long)h[m] * (r - l + 1),
               max(solve(sp, h, l, m - 1), solve(sp, h, m + 1, r)));
}
```

<!-- @annotations -->
- 22: The <= tie-break makes argmin return the leftmost minimum consistently; any consistent choice is correct here, but an inconsistent one would split the same range differently in the two overlapping blocks.
- 20: 31 - __builtin_clz(len) is floor(log2(len)); the two overlapping blocks of that size cover the range exactly, which is what makes the query O(1) rather than O(log n).
- 29: This is the whole argument in one line: either the rectangle includes the shortest bar and spans everything, or it avoids that bar and lies wholly on one side.
- 30: The recursion is the hazard, not the arithmetic. On sorted input each call peels off one element and the depth reaches n — a segfault at n = 1,000,000 rather than a wrong answer.

<!-- @code java -->
```java
static int[][] table;
static int[] hh;

static void build(int[] a) {
    int n = a.length, K = 1;
    while ((1 << K) <= n) K++;
    table = new int[K][n];
    hh = a;
    for (int i = 0; i < n; i++) table[0][i] = i;
    for (int k = 1; k < K; k++)
        for (int i = 0; i + (1 << k) <= n; i++) {
            int x = table[k-1][i], y = table[k-1][i + (1 << (k-1))];
            table[k][i] = a[x] <= a[y] ? x : y;
        }
}

static int argmin(int l, int r) {
    int k = 31 - Integer.numberOfLeadingZeros(r - l + 1);
    int x = table[k][l], y = table[k][r - (1 << k) + 1];
    return hh[x] <= hh[y] ? x : y;
}

static long solve(int l, int r) {
    if (l > r) return 0;
    int m = argmin(l, r);
    return Math.max((long) hh[m] * (r - l + 1),
                    Math.max(solve(l, m - 1), solve(m + 1, r)));
}
```

<!-- @annotations -->
- 18: Integer.numberOfLeadingZeros is Java's __builtin_clz; it is an intrinsic and compiles to a single instruction, so the O(1) query claim holds here too.
- 6: The K loop must run while (1 << K) <= n, not < n, or the table is one level short and the largest queries read out of bounds.
- 27: Java's default thread stack is typically 512KB to 1MB, smaller than the 8MB the C++ measurement used, so the sorted-input recursion fails even earlier here — a StackOverflowError rather than a segfault.

<!-- @code python -->
```python
def largest_rectangle_area(h: list[int]) -> int:
    n = len(h)
    if n == 0:
        return 0

    K = 1
    while (1 << K) <= n:
        K += 1
    t = [list(range(n))] + [[0] * n for _ in range(K - 1)]
    for k in range(1, K):
        for i in range(n - (1 << k) + 1):
            x, y = t[k-1][i], t[k-1][i + (1 << (k-1))]
            t[k][i] = x if h[x] <= h[y] else y

    def argmin(l, r):
        k = (r - l + 1).bit_length() - 1
        x, y = t[k][l], t[k][r - (1 << k) + 1]
        return x if h[x] <= h[y] else y

    def solve(l, r):
        if l > r:
            return 0
        m = argmin(l, r)
        return max(h[m] * (r - l + 1), solve(l, m - 1), solve(m + 1, r))

    return solve(0, n - 1)
```

<!-- @annotations -->
- 16: (length).bit_length() - 1 is Python's floor(log2), and it is exact for positive integers where math.log2 would risk a floating-point boundary error at powers of two.
- 24: This recursion hits Python's default limit of 1,000 on any sorted input longer than about a thousand bars — far tighter than the C++ segfault at a million, and the reason this approach is a teaching device rather than a submission.
- 9: The first row is built with list(range(n)) rather than the [0]*n comprehension, because level 0 of the table is the identity mapping of indices to themselves.

<!-- @approach -->
### Two-pass monotonic stack — build both boundary arrays

<!-- @idea -->
Compute `prevSmaller` in a left-to-right sweep and `nextSmaller` in a right-to-left sweep, each with a monotonic stack, then take the maximum of `h[i] * (nextSmaller[i] - prevSmaller[i] - 1)`. Direct, readable, and the version to write when the boundary arrays are also wanted for something else.

<!-- @steps -->
```
1. Left to right: pop while the stack top is >= h[i]; prevSmaller[i] is what remains, or -1.
2. Right to left: pop while the stack top is > h[i]; nextSmaller[i] is what remains, or n.
3. width = nextSmaller[i] - prevSmaller[i] - 1 for each i.
4. Answer is the maximum of h[i] * width.
```

<!-- @complexity -->
- time: O(n) — each index is pushed and popped once per sweep, so three passes in total
- space: O(n) for two boundary arrays plus the stack
- note: 1,325,458ns at n = 100,000 and 13,519,625ns at n = 1,000,000, which is 2.28x the one-pass version at both sizes and between 1.77x and 2.83x across input shapes. Exactly one of the four strict/non-strict combinations is wrong: smaller-or-equal on both sides fails on 69.78% of inputs, with [1,1] as the smallest counterexample.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

long long largestRectangleArea(const vector<int>& h) {
    int n = h.size();
    vector<int> prevSm(n), nextSm(n), st;

    for (int i = 0; i < n; i++) {                    // strictly smaller on the left
        while (!st.empty() && h[st.back()] >= h[i]) st.pop_back();
        prevSm[i] = st.empty() ? -1 : st.back();
        st.push_back(i);
    }
    st.clear();
    for (int i = n - 1; i >= 0; i--) {               // smaller-or-equal on the right
        while (!st.empty() && h[st.back()] > h[i]) st.pop_back();
        nextSm[i] = st.empty() ? n : st.back();
        st.push_back(i);
    }

    long long best = 0;
    for (int i = 0; i < n; i++)
        best = max(best, (long long)h[i] * (nextSm[i] - prevSm[i] - 1));
    return best;
}
```

<!-- @annotations -->
- 10: >= here and > on line 16 — at least one side must be strict. Making both non-strict walls every plateau member in by its own neighbours so nobody claims the full span, which is wrong on 69.78% of inputs and fails on [1,1].
- 11: -1 as the sentinel for "no smaller bar to the left", which combined with the n on line 17 makes the width formula uniform and removes every boundary special case.
- 16: Only one side needs to be strict, and which one is free — strict/non-strict and non-strict/strict both measured 0.00% wrong. That is not true of Sum of Subarray Minimums, where exactly one side must be strict and both-strict over-counts on 78.37%.
- 23: nextSm - prevSm - 1, with the -1 because both boundaries are exclusive: they name the bars that stop the spread, not the last bars included.
- 7: Two n-sized arrays that the one-pass version never allocates, which is most of where its 2.28x comes from.

<!-- @code java -->
```java
import java.util.ArrayDeque;
import java.util.Deque;

static long largestRectangleArea(int[] h) {
    int n = h.length;
    int[] prevSm = new int[n], nextSm = new int[n];
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && h[st.peek()] >= h[i]) st.pop();
        prevSm[i] = st.isEmpty() ? -1 : st.peek();
        st.push(i);
    }
    st.clear();
    for (int i = n - 1; i >= 0; i--) {
        while (!st.isEmpty() && h[st.peek()] > h[i]) st.pop();
        nextSm[i] = st.isEmpty() ? n : st.peek();
        st.push(i);
    }

    long best = 0;
    for (int i = 0; i < n; i++)
        best = Math.max(best, (long) h[i] * (nextSm[i] - prevSm[i] - 1));
    return best;
}
```

<!-- @annotations -->
- 14: st.clear() between the sweeps is essential and easy to forget; leaving the first sweep's indices in place makes the second sweep read boundaries from the wrong direction and produces plausible but wrong widths.
- 10: The comparison is on h[st.peek()], the height at the stored index, not on the index itself — a stack of indices is required because the width calculation needs positions, not just heights.
- 23: (long) h[i] before the multiply. At the stated limits the product reaches 1,000,000,000, which fits in an int with 114.7% of headroom, so this is habit rather than necessity here.

<!-- @code python -->
```python
def largest_rectangle_area(h: list[int]) -> int:
    n = len(h)
    prev_sm = [-1] * n
    next_sm = [n] * n
    st: list[int] = []

    for i in range(n):
        while st and h[st[-1]] >= h[i]:
            st.pop()
        prev_sm[i] = st[-1] if st else -1
        st.append(i)

    st = []
    for i in range(n - 1, -1, -1):
        while st and h[st[-1]] > h[i]:
            st.pop()
        next_sm[i] = st[-1] if st else n
        st.append(i)

    return max((h[i] * (next_sm[i] - prev_sm[i] - 1) for i in range(n)), default=0)
```

<!-- @annotations -->
- 13: Rebinding st to a fresh list rather than calling st.clear() — either works, but rebinding is safer if the first list was captured by a closure or returned for debugging.
- 14: range(n - 1, -1, -1) with a stop of -1, or index 0 is never visited and its next-smaller boundary keeps its initialised value.
- 20: default=0 makes max() safe on an empty histogram; without it an empty input raises ValueError rather than returning 0.
- 8: The emptiness test comes first so short-circuiting prevents the IndexError, the same pattern as every other monotonic stack in this topic.

<!-- @approach -->
### One-pass monotonic stack — the answer

<!-- @idea -->
The stack already knows both boundaries at the instant it pops. When bar `i` forces index `t` off the stack, `i` is `t`'s right boundary by construction, and whatever is left on top of the stack is `t`'s left boundary, because everything between them was popped earlier for being taller. So finalise the area for `t` immediately and never build either array.

<!-- @steps -->
```
1. Sweep i from 0 to n inclusive, treating h[n] as a virtual bar of height 0.
2. While the stack is non-empty and h[stack.top()] >= current height:
3.   pop t; its height is h[t].
4.   left = stack.top() after the pop, or -1 if the stack is empty.
5.   area = h[t] * (i - left - 1); keep the maximum.
6. Push i.
```

<!-- @complexity -->
- time: O(n) amortised — each index is pushed once and popped once, in a single sweep
- space: O(n) worst case for the stack alone, and no boundary arrays. Measured max depth 26 of 200,000 on random heights (0.01%) but 200,000 of 200,000 on strictly increasing input.
- note: 581,542ns at n = 100,000 and 5,916,959ns at n = 1,000,000 — 2.28x faster than the two-pass version at both sizes, 2.31x/1.77x/2.83x/2.79x across random, increasing, decreasing and all-equal input, and 2.00x faster in Python (33.1ms against 66.1ms). Unlike the ranking in Trapping Rainwater, this advantage is doing less work rather than vectorizing better, so it survives every change of language and shape.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

long long largestRectangleArea(const vector<int>& h) {
    int n = h.size();
    long long best = 0;
    vector<int> st;
    st.reserve(n + 1);

    for (int i = 0; i <= n; i++) {
        int cur = (i == n) ? 0 : h[i];               // virtual closing bar
        while (!st.empty() && h[st.back()] >= cur) {
            int height = h[st.back()];
            st.pop_back();
            int left = st.empty() ? -1 : st.back();
            best = max(best, (long long)height * (i - left - 1));
        }
        st.push_back(i);
    }
    return best;
}
```

<!-- @annotations -->
- 12: The virtual bar of height 0 at index n is what removes the drain loop entirely. Without it, every bar still on the stack at the end has no right boundary and needs a second loop to finish them.
- 13: >= rather than > so that equal bars pop each other; both are correct here — the strict version measured 0.00% wrong too — but popping on equality keeps the stack short on plateaus, which is why all-equal input reaches a depth of 1 instead of n.
- 16: left is read AFTER the pop. That is the whole trick: the element now on top is the popped bar's left boundary, because everything between them was taller and has already gone.
- 17: i - left - 1, with both boundaries exclusive. When the stack empties, left is -1 and the width becomes i, which is the full span from the start of the array.
- 9: reserve(n + 1) because the virtual closing index is pushed too; without it the last push can trigger a reallocation of the whole vector.

<!-- @code java -->
```java
import java.util.ArrayDeque;
import java.util.Deque;

static long largestRectangleArea(int[] h) {
    int n = h.length;
    long best = 0;
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = 0; i <= n; i++) {
        int cur = (i == n) ? 0 : h[i];
        while (!st.isEmpty() && h[st.peek()] >= cur) {
            int height = h[st.pop()];
            int left = st.isEmpty() ? -1 : st.peek();
            best = Math.max(best, (long) height * (i - left - 1));
        }
        st.push(i);
    }
    return best;
}
```

<!-- @annotations -->
- 12: h[st.pop()] reads the height and removes the index in one expression; the C++ version must split this because pop_back returns void, and transcribing between the two is where an extra or missing pop usually creeps in.
- 13: st.isEmpty() is checked after the pop on the line above, so this correctly yields -1 when the popped bar had nothing shorter to its left.
- 7: Deque<Integer> boxes every index. For a hot path an int[] used as a manual stack with an integer top pointer avoids that entirely and is worth the extra four lines.

<!-- @code python -->
```python
def largest_rectangle_area(h: list[int]) -> int:
    n = len(h)
    best = 0
    st: list[int] = []

    for i in range(n + 1):
        cur = 0 if i == n else h[i]
        while st and h[st[-1]] >= cur:
            height = h[st.pop()]
            left = st[-1] if st else -1
            best = max(best, height * (i - left - 1))
        st.append(i)

    return best
```

<!-- @annotations -->
- 6: range(n + 1), not range(n) — the extra iteration is the virtual closing bar and it is the difference between a complete answer and one that silently ignores every bar left on the stack.
- 9: h[st.pop()] rather than reading h[st[-1]] and popping afterwards; the height must be captured before the index leaves, since the next line already needs the new top.
- 14: Measured 33.1ms at n = 200,000 against the two-pass version's 66.1ms — the same 2x that C++ shows, because the saving is one fewer pass and two fewer arrays rather than anything the compiler does.

<!-- @example -->

<!-- @input -->
```
heights = [2,1,5,6,2,3]
```

<!-- @output -->
```
10
```

<!-- @why -->
The canonical case, and it makes the central point on its own: the winning rectangle is neither the tallest bar nor the widest span. Bar 2 has height 5 and spreads over indices 2 and 3 for an area of 10, beating the tallest bar's 6 and the full-width span's 6. Height alone decides nothing.

<!-- @walkthrough -->
- Boundaries: prevSm = [-1,-1,1,2,1,4] and nextSm = [1,6,4,4,6,6], giving widths [1,6,2,1,4,1].
- Areas per bar: [2,6,10,6,8,3]. The maximum is 10, from the height-5 bar spreading right across the height-6 bar.
- The tallest bar (height 6 at index 3) is walled in immediately on both sides and contributes only 6.
- The shortest bar (height 1 at index 1) spans the entire array for a width of 6 and also contributes only 6.
- Running the one-pass stack instead: indices 0 and 1 push, then at i = 2 the height-2 bar at index 0 was already popped by the height-1 bar, and 5 and 6 stack up.
- At i = 4 the height-2 bar pops both 6 and 5 — the 6 with width 1, then the 5 with left boundary 1 and width 4 - 1 - 1 = 2, which is the 10.

<!-- @example -->

<!-- @input -->
```
heights = [1,1]
```

<!-- @output -->
```
2   (smaller-or-equal on both sides gives 1)
```

<!-- @why -->
The smallest array that separates the one broken tie convention from the three correct ones, found by exhaustive enumeration over all height vectors of length 1 to 5 drawn from {1,2}. With smaller-or-equal on both sides, each bar is walled in by the other, so both compute width 1 and the plateau of width 2 is never seen by anyone.

<!-- @walkthrough -->
- With smaller-or-equal on the left, prevSm[1] = 0 because h[0] <= h[1].
- With smaller-or-equal on the right, nextSm[0] = 1 because h[1] <= h[0].
- So bar 0 gets width 1 - (-1) - 1 = 1 and bar 1 gets width 2 - 0 - 1 = 1. Maximum area 1.
- Make the left strict: prevSm[1] becomes -1, bar 1 gets width 2 - (-1) - 1 = 2, area 2. Correct.
- Make the right strict instead: nextSm[0] becomes 2, bar 0 gets width 2, area 2. Also correct.
- Either single change works, which is why three of the four combinations pass — the answer is a maximum, so it only needs *one* bar to see the whole plateau.
- Measured over 50,000 arrays with heights from 1..3, the both-non-strict version is wrong on 69.78%.

<!-- @example -->

<!-- @input -->
```
the same four conventions run against Sum of Subarray Minimums
```

<!-- @output -->
```
this problem: 3 of 4 correct      sum of subarray minimums: 2 of 4 correct
```

<!-- @why -->
The comparison that explains what tie conventions are actually for. Identical boundary code, identical 50,000 test arrays, different aggregation — and the set of acceptable conventions changes. This problem takes a maximum, so redundant duplicate widths are ignored and only a total absence of coverage hurts. Sum of Subarray Minimums takes a sum, so duplicates are counted and both over- and under-coverage are fatal.

<!-- @walkthrough -->
- strict/strict: 0.00% wrong here, 78.37% wrong for the sum. Every member of a plateau claims the full span, so the maximum is right and the sum counts the same subarray once per tied minimum.
- strict/non-strict: 0.00% for both. Exactly one bar of each plateau claims the full span, which satisfies a maximum and gives a sum exactly one owner per subarray.
- non-strict/strict: 0.00% for both, by the mirror-image argument.
- non-strict/non-strict: 69.78% wrong here, 78.37% wrong for the sum. Nobody claims the full span, so the maximum misses rectangles and the sum under-counts.
- The generalisation: a tie convention matters exactly as much as the tied element's contribution — zero contribution makes it free, a counted contribution needs exactly one strict side, and a maximum needs only that someone sees the whole span.
- The third regime is next door in Trapping Rainwater, where all four conventions measured 0.00% because every tie contributes exactly zero water.

<!-- @example -->

<!-- @input -->
```
a strictly increasing histogram of 1,000,000 bars
```

<!-- @output -->
```
stack depth reaches 1,000,000; divide and conquer segfaults
```

<!-- @why -->
The adversarial shape, and it is the opposite of the one that hurt the previous subtopic. Here the stack pops only when the incoming bar is not taller, so a rising histogram never pops and the stack grows to `n`. The same input drives the divide-and-conquer recursion to depth `n`, which exceeds the default 8 MB stack and crashes rather than answering slowly.

<!-- @walkthrough -->
- Every bar is taller than the one before it, so the `h[stack.top()] >= cur` test is false at every step and nothing is ever popped during the sweep.
- Measured max depth 200,000 of 200,000 at n = 200,000, against 26 on random heights in 1..10000.
- The virtual closing bar of height 0 then pops all n of them in one final burst, which is still O(n) total work — the time is 1,443,250ns, actually *faster* than random input's 5,939,667ns because the pops are one contiguous run.
- So for the stack this shape is a space worst case, not a time worst case, which is a distinction worth keeping separate.
- Divide and conquer fares far worse: the minimum is always at the left end, so each call peels off one element and the depth equals n. At n = 100,000 the depth is 100,000 and it survives; at n = 1,000,000 it segfaults.
- In Python the default recursion limit of 1,000 means the same failure arrives at about a thousand bars.
- Note the inversion from Trapping Rainwater: there the stack was non-increasing and *decreasing* input was the worst case. Here decreasing input keeps the stack at depth 1.

<!-- @visualization stack -->

<!-- @description -->
Open by ruling out the obvious searches: draw the histogram [2,1,5,6,2,3] and flash three candidate rectangles in turn — the tallest bar alone (area 6), the full-width span at the minimum height (area 6), and finally the winner spanning bars 2 and 3 at height 5 (area 10) — captioned "not the tallest, not the widest". Then state the reframing: highlight one bar, and animate two arrows spreading left and right from it, each stopping the instant it meets a shorter bar, with the swept region filling in at that bar's height. Step this through all six bars with a running table beneath showing prevSm, nextSm, width and area, so the answer 10 emerges from the third column. Next, the tie panel, which is the heart of the page. Show a flat plateau of four equal bars. Run it four times, once per convention, drawing for each bar the region it claims: with both sides non-strict every bar claims only itself, and a red "nobody claims the full span" banner appears over the untouched plateau; with either side strict, one bar's claim visibly extends across the whole plateau in green. Put the measured 69.78% beside the failing case and 0.00% beside the other three. Then widen it into the cross-problem table: the same four conventions as rows, with two columns — this problem and Sum of Subarray Minimums — showing 0.00/0.00/0.00/69.78 against 78.37/0.00/0.00/78.37, and a third column for Trapping Rainwater showing 0.00 all the way down. Caption it "a tie convention matters exactly as much as the tied element's contribution". Then the one-pass reveal: run the two-pass version and the one-pass version side by side on the same histogram, with the two-pass lane visibly filling two whole arrays before computing anything, and the one-pass lane finalising each bar's area at the moment it pops — draw an arrow from the popped bar to the new stack top labelled "left boundary, known for free". End with the shape panel: a rising histogram with the stack visibly growing to full height and a depth counter hitting 1,000,000, beside a falling histogram where the counter stays at 1, captioned "the mirror image of Trapping Rainwater — same structure, opposite monotonicity, opposite adversary" — and a small skull icon on the divide-and-conquer lane where the recursion segfaults on the same rising input.

<!-- @sampleInput -->
```json
{"problem":{"input":[2,1,5,6,2,3],"answer":10,"statement":"largest rectangle that fits inside the histogram, bars of width 1"},"keyObservation":{"claim":"every rectangle's height equals its shortest bar, so instead of searching over ranges, ask of each bar how far it can spread before something shorter stops it","formula":"area(i) = h[i] * (nextSmaller(i) - prevSmaller(i) - 1)","answer":"the maximum of area(i) over all i"},"trace":{"index":[0,1,2,3,4,5],"heights":[2,1,5,6,2,3],"prevSm":[-1,-1,1,2,1,4],"nextSm":[1,6,4,4,6,6],"width":[1,6,2,1,4,1],"area":[2,6,10,6,8,3],"max":10,"note":"the winner is neither the tallest bar (height 6, area 6) nor the widest span (height 1, width 6, area 6)"},"tieConventions":{"tested":50000,"heightRange":"1..3 so plateaus dominate","reference":"O(n^2) brute force","rows":[{"convention":"strict left, strict right","largestRectanglePct":0.0,"sumOfSubarrayMinimumsPct":78.37},{"convention":"strict left, non-strict right","largestRectanglePct":0.0,"sumOfSubarrayMinimumsPct":0.0},{"convention":"non-strict left, strict right","largestRectanglePct":0.0,"sumOfSubarrayMinimumsPct":0.0},{"convention":"non-strict left, non-strict right","largestRectanglePct":69.78,"sumOfSubarrayMinimumsPct":78.37}],"smallestCounterexample":{"input":[1,1],"gives":1,"correct":2,"why":"each bar is walled in by the other, so both compute width 1 and nobody claims the plateau"},"whyThreeOfFourWork":"the answer is a maximum, so redundant smaller widths are ignored; it only needs SOME member of each plateau to see the whole span","whySumNeedsExactlyOne":"a sum counts duplicates, so both-strict makes every tied minimum count the same subarray and both-non-strict misses subarrays","trappingRainwaterRegime":"all four conventions 0.00% wrong, because every tie contributes exactly zero water","generalRule":"a tie convention matters exactly as much as the tied element's contribution"},"onePassInsight":{"claim":"the stack already knows both boundaries at the instant it pops","rightBoundary":"i, the index causing the pop, by construction","leftBoundary":"whatever is on top of the stack after the pop, because everything between them was popped earlier for being taller","width":"i - stack.top() - 1, or i if the stack is now empty","virtualBar":"append a bar of height 0 at index n so everything still stacked pops with the correct right boundary of n, removing the drain loop"},"timing":{"note":"best of 9, random heights 1..10000","n100000":{"onePass":581542,"twoPass":1325458,"divideAndConquer":1919250,"twoOverOne":2.28,"dncOverOne":3.3},"n1000000":{"onePass":5916959,"twoPass":13519625,"divideAndConquer":23707167,"twoOverOne":2.28,"dncOverOne":4.01},"byShape":[{"shape":"random 1..10000","onePass":5939667,"twoPass":13705083,"ratio":2.31},{"shape":"strictly increasing","onePass":1443250,"twoPass":2560041,"ratio":1.77},{"shape":"strictly decreasing","onePass":950875,"twoPass":2686416,"ratio":2.83},{"shape":"all equal","onePass":963959,"twoPass":2686583,"ratio":2.79}],"python":{"n":200000,"onePassMs":33.1,"twoPassMs":66.1,"ratio":2.0},"bruteForce":[{"n":1000,"ns":295750,"factor":178},{"n":5000,"ns":7366125,"factor":731},{"n":20000,"ns":115490458,"factor":1138}],"contrastWithTrappingRainwater":"there the ranking between two approaches inverted with the vectorizer off and again in Python, so it was a compiler property; here the one-pass version does strictly less work, so its advantage survives every shape and language"},"stackDepth":[{"shape":"random 1..10000","depth":26,"of":200000,"pct":0.01},{"shape":"random 1..4","depth":4,"of":200000,"pct":0.0},{"shape":"strictly increasing","depth":200000,"of":200000,"pct":100.0},{"shape":"strictly decreasing","depth":1,"of":200000,"pct":0.0},{"shape":"all equal","depth":1,"of":200000,"pct":0.0}],"stackDepthNote":"the mirror image of Trapping Rainwater, where the stack was non-increasing and decreasing input was the worst case","divideAndConquer":{"idea":"the largest rectangle either spans the whole range at the minimum bar's height, or lies entirely on one side of it","rangeMinimum":"sparse table, O(1) per query","recursionDepth":[{"input":"random","n":100000,"depth":42},{"input":"random","n":1000000,"depth":129},{"input":"sorted","n":100000,"depth":100000},{"input":"sorted","n":1000000,"depth":"segfault with the default 8MB stack"}],"python":"the default recursion limit of 1000 breaks it on any sorted input past about a thousand bars"},"overflow":{"maxAreaAtStatedLimits":1000000000,"intMax":2147483647,"headroomPct":114.7,"verdict":"comfortable, unlike Trapping Rainwater's 7.4%","lesson":"whether it fits in an int is a question with an arithmetic answer, worth computing rather than guessing in either direction"},"verification":{"cpp":{"arrays":50000,"maxN":12,"heightCaps":[2,3,6],"reference":"O(n^2) brute force","mismatches":0},"python":{"arrays":30000,"mismatches":0}}}
```

<!-- @highlights -->
- Three candidate rectangles flash in turn: tallest bar (6), widest span (6), and the winner (10).
- Two arrows spread out from a highlighted bar, each stopping at the first shorter bar.
- A running table beneath fills in prevSm, nextSm, width and area for all six bars.
- The tie panel shows a flat plateau claimed four different ways, once per convention.
- With both sides non-strict, every bar claims only itself and a red banner marks the uncovered span.
- With either side strict, one bar's claim visibly stretches across the whole plateau in green.
- The measured 69.78% sits beside the failing convention and 0.00% beside the other three.
- A cross-problem table puts this subtopic beside Sum of Subarray Minimums and Trapping Rainwater.
- That table reads 0.00/0.00/0.00/69.78 against 78.37/0.00/0.00/78.37 against 0.00 throughout.
- Its caption states the rule: a tie convention matters as much as the tied element's contribution.
- Two lanes then run the two-pass and one-pass versions side by side on the same histogram.
- The two-pass lane visibly fills two whole arrays before computing any area.
- The one-pass lane finalises each area at the moment of the pop.
- An arrow from the popped bar to the new stack top is labelled "left boundary, known for free".
- A rising histogram drives the stack depth counter to 1,000,000 while a falling one holds it at 1.
- A skull icon marks the divide-and-conquer lane segfaulting on that same rising input.

<!-- @edgeCases -->
- **Empty histogram** — the answer is 0. The one-pass version handles it without a guard because the loop still runs once for the virtual closing bar; the Python two-pass version needs `default=0` on its `max`.
- **A single bar** — the answer is that bar's height. The virtual closing bar pops it with left boundary -1 and width 1.
- **All bars equal** — the answer is `height x n`. The stack stays at depth 1 throughout because equal bars pop each other under `>=`, and the correct span is claimed by whichever end the strict side favours.
- **Two equal bars, `[1,1]`** — the smallest input that breaks the both-non-strict convention, giving 1 instead of 2.
- **Strictly increasing** — the stack grows to full depth `n` and nothing pops until the virtual bar arrives. A space worst case but not a time worst case; measured 1,443,250ns against random input's 5,939,667ns.
- **Strictly decreasing** — the stack never exceeds depth 1, since every bar pops its predecessor immediately.
- **A single tall spike among short bars** — the spike contributes only its own height, and the answer comes from the wide low span; a good check that height is not being favoured over width.
- **Zero-height bars** — legal, and they act as natural barriers exactly like the virtual closing bar. A histogram of all zeros gives 0.
- **The array ending on its tallest bar** — the case that most exposes a missing drain loop or missing virtual bar, since that bar never meets a shorter one during the sweep.
- **Sorted input in the divide-and-conquer version** — recursion depth equals `n`. It survives n = 100,000 but segfaults at n = 1,000,000, and fails in Python past about 1,000 bars.
- **Maximum area at the stated limits** — 100,000 bars of height 10,000 gives 1,000,000,000, which fits in a 32-bit int with 114.7% of headroom.

<!-- @pitfalls -->
- **Using smaller-or-equal on both boundary sides.** Wrong on 69.78% of inputs and on `[1,1]`. At least one side must be strict, or no member of a plateau ever claims the full span.
- **Carrying the Sum of Subarray Minimums convention over unchanged.** There, exactly one side must be strict and both-strict over-counts on 78.37%. Here both-strict is fine. The rules differ because one problem sums and the other maximises.
- **Forgetting the virtual closing bar in the one-pass version.** Every bar still on the stack when the sweep ends is silently dropped, which is invisible on inputs whose last bar is the shortest and wrong on everything else.
- **Reading the left boundary before the pop instead of after.** The whole one-pass trick is that the element revealed *by* the pop is the left boundary; reading it first gives the popped bar itself and a width of 0.
- **Writing the width as `i - left` instead of `i - left - 1`.** Both boundaries are exclusive — they name the bars that stop the spread, not the last bars included.
- **Forgetting to clear the stack between the two sweeps in the two-pass version.** The leftover indices produce plausible but wrong boundaries rather than a crash.
- **Storing heights on the stack instead of indices.** The width calculation needs positions; a stack of heights cannot produce one.
- **Reaching for divide and conquer because it looks more principled.** It is 3.30x to 4.01x slower and segfaults on sorted input at n = 1,000,000 — a crash rather than a slow answer.
- **Assuming the tallest bar is involved in the answer.** In `[2,1,5,6,2,3]` the tallest bar contributes 6 and the answer is 10 from a shorter one.
- **Assuming the increasing case is a time worst case because it is a space worst case.** It is measured *faster* than random input, because all the pops happen in one contiguous run at the end.
- **Using `math.log2` for the sparse-table level in Python.** `(r - l + 1).bit_length() - 1` is exact; floating-point log risks a boundary error at exact powers of two.
- **Assuming an `int` accumulator overflows here because it nearly did in Trapping Rainwater.** The maximum area is 1,000,000,000 against `INT_MAX`, 114.7% of headroom. The question has an arithmetic answer and is worth computing in either direction.

<!-- @doubt -->
Why is it enough to consider only rectangles whose height equals some bar's height?

<!-- @answer -->
Because any rectangle can be raised for free until it touches a bar. Take an optimal rectangle spanning some range with height `H`. Every bar in that range is at least `H` tall, so let `m` be the shortest bar in the range: `m >= H`. Raising the rectangle from `H` to `m` keeps it inside the histogram and does not change its width, so its area only increases. An optimal rectangle can therefore always be assumed to have height equal to the minimum bar in its span — which means enumerating "for each bar, the widest span in which it is the minimum" covers every candidate. That is what turns an O(n^2) search over ranges into an O(n) search over bars.

<!-- @doubt -->
Why do three of the four tie conventions work here when Sum of Subarray Minimums accepts only two?

<!-- @answer -->
Because this problem takes a maximum and that one takes a sum, and a maximum is indifferent to duplicates. If two bars of a plateau both claim the full span, the maximum sees the same area twice and returns it once — no harm. The only way to be wrong is for *nobody* to claim the full span, which is exactly what smaller-or-equal on both sides does: each plateau member is walled in by its neighbours. A sum cannot be indifferent. Strict on both sides makes every tied minimum count the same subarray, over-counting on 78.37%; non-strict on both misses subarrays entirely, under-counting on the same 78.37%. Exactly one strict side gives each subarray exactly one owner, which is what a sum requires and more than a maximum needs.

<!-- @doubt -->
Is there a single rule that covers all three of Trapping Rainwater, this problem, and Sum of Subarray Minimums?

<!-- @answer -->
Yes: a tie convention matters exactly as much as the tied element's contribution. In Trapping Rainwater a tie contributes zero water — `min(h[i], h[top]) - h[floor]` is 0 when the heights are equal — so all four conventions measured 0.00% wrong and the choice is free. Here a tie contributes a candidate to a maximum, so duplicates are absorbed and only total absence of coverage hurts; three conventions pass. In Sum of Subarray Minimums a tie contributes a term to a sum, so every duplicate and every omission changes the answer; only two pass. Work out what a tied element contributes and the required convention follows without memorising a rule per problem.

<!-- @doubt -->
How does the one-pass version know a popped bar's left boundary without having computed it?

<!-- @answer -->
Because the stack maintains it as an invariant. The stack holds indices whose heights are increasing from bottom to top, so at any moment each index's immediate predecessor on the stack is the nearest bar to its left that is shorter than it — anything between them would have had to be taller, and taller bars are popped when a shorter one arrives. So when index `t` is popped by bar `i`, `i` is `t`'s right boundary by construction, and the element now exposed on top is `t`'s left boundary by the invariant. Both come for free, which is why the two boundary arrays never need to exist and why this is 2.28x faster than building them.

<!-- @doubt -->
The one-pass version is 2.28x faster. Should I ever write the two-pass version?

<!-- @answer -->
When you need the boundary arrays themselves. `prevSmaller` and `nextSmaller` are reusable — Sum of Subarray Minimums needs them, Sum of Subarray Ranges needs them twice, and any problem asking "for each element, the span where it dominates" needs them. If they are already being built for another reason, the marginal cost of the maximum is one more pass and the one-pass version saves nothing. The two-pass version is also easier to debug, because you can print the arrays and check them against a brute-force reference. Write it when the boundaries are the product; write the one-pass version when the area is.

<!-- @doubt -->
Why does the strictly increasing input make the stack grow to n but not make it slow?

<!-- @answer -->
Because total work is bounded by pushes and pops, not by depth. Each index is pushed exactly once and popped exactly once no matter what the input looks like, so the operation count is the same 2n for every shape. What changes is *when* the pops happen: on rising input nothing pops during the sweep and all n pops happen in one burst at the virtual closing bar. That burst is a tight contiguous loop over a stack that is already in cache, which measured 1,443,250ns — actually faster than random input's 5,939,667ns, where pops are scattered and interleaved with pushes. So this shape is a space worst case at 100% depth and a time *best* case. Keeping those two axes separate is worth the habit; they do not have to agree.

<!-- @doubt -->
Trapping Rainwater's stack was worst on decreasing input and this one is worst on increasing input. Why the flip?

<!-- @answer -->
Because the two stacks maintain opposite monotonicity, which follows from what each is waiting for. In Trapping Rainwater the stack holds bars waiting for something *taller* on the right to close a basin, so it stays non-increasing and a decreasing input never closes anything — depth grows to n. Here the stack holds bars waiting for something *shorter* on the right to stop their spread, so it stays increasing and a rising input never stops anything — depth grows to n. Same data structure, mirrored comparison, mirrored adversary. It is a useful sanity check when writing any monotonic stack: work out which direction it is monotone in, and the worst-case input is immediately the input sorted that way.

<!-- @doubt -->
Divide and conquer is O(n log n), which is close to linear. Why is it 4x slower?

<!-- @answer -->
Partly the log factor and mostly the constants. The sparse table alone costs O(n log n) time and O(n log n) *space* to build before a single query runs — at n = 1,000,000 that is twenty levels of a million-element array. Each recursive step then does a random-access pair of lookups into that table rather than a sequential read, and the recursion itself costs call frames. Measured 3.30x slower at n = 100,000 and 4.01x at n = 1,000,000, with the gap widening as the log grows. The more serious problem is not speed: on sorted input the recursion depth equals `n`, which segfaults at n = 1,000,000 with the default 8 MB stack and fails in Python past about a thousand bars. An approach that crashes on sorted input is not a candidate.

<!-- @doubt -->
Does the answer overflow a 32-bit integer?

<!-- @answer -->
No, and comfortably so. At the stated limits — 100,000 bars of height at most 10,000 — the largest possible area is exactly 1,000,000,000 against an `INT_MAX` of 2,147,483,647, which is 114.7% of headroom. That is a genuinely different situation from Trapping Rainwater, where the maximum total was 1,999,800,000 and the margin was 7.4%. The point is not that one needs a wider type and the other does not; it is that both questions have arithmetic answers. Multiply the worst-case width by the worst-case height and compare. Guessing "probably fine" and guessing "better use long long everywhere" are both worse than the ten seconds it takes to compute.

<!-- @doubt -->
The one-pass advantage held in C++ and in Python. Why did the previous subtopic's ranking not transfer?

<!-- @answer -->
Because the two advantages have different sources. In Trapping Rainwater, the prefix/suffix array method beat two pointers because its final loop vectorizes — that is the compiler exploiting the hardware, and it evaporated when the vectorizer was disabled (0.65x) and again in Python, which has none. Here the one-pass version wins by doing strictly less work: one sweep instead of three, and no `n`-sized arrays allocated, written or read. That saving is in the operation count itself, so it survives translation. Measured 2.28x in C++ and 2.00x in Python, and between 1.77x and 2.83x across four different input shapes. When a speedup comes from fewer operations it travels; when it comes from better-shaped operations it belongs to the platform.
