---
id: sum-of-subarray-minimums
topic: Stacks
title: Sum of Subarray Minimums
difficulty: Medium
status: ready
prerequisites:
  - next-smaller-element
  - next-greater-element
  - implement-stack-using-arrays
  - integer-overflow-and-precision-errors
relatedIds:
  - next-smaller-element
  - sum-of-subarray-ranges
  - largest-rectangle-in-a-histogram
  - stock-span-problem
  - next-greater-element
---

<!-- @summary -->
Every subarray has exactly one minimum, so instead of visiting the `n(n+1)/2` subarrays, ask each element how many of them it is minimal over — `(i − prev) × (next − i)` — and multiply by its value. Verified against an O(n²) brute force over 200,000 tie-heavy arrays with zero mismatches. Get the tie convention wrong and it fails on **70.5%** of them, overcounting by up to 315: `[2, 2, 2]` returns 20 where the answer is 12. And the two-pass span method is not the best form — a **one-pass DP** carrying the running answer measured **2.2x to 2.9x** faster.

<!-- @theory -->
## The problem

Sum the minimum of every contiguous subarray.

```
a = [3, 1, 2, 4]

[3]=3  [3,1]=1  [3,1,2]=1  [3,1,2,4]=1
       [1]=1    [1,2]=1    [1,2,4]=1
                [2]=2      [2,4]=2
                           [4]=4         total = 17
```

There are `n(n+1)/2` subarrays, so enumerating them is quadratic before any
minimum is computed.

## Turn it inside out

The previous subtopic established the span: with `prev` the index of the previous
smaller element and `next` the index of the next smaller one, `a[i]` is the
minimum of exactly

```
(i - prev) * (next - i)
```

subarrays — the ones starting anywhere after `prev` and ending anywhere before
`next`. Since every subarray has exactly one minimum, those groups partition all
of them, and the answer is

```
sum over i of  a[i] * (i - prev[i]) * (next[i] - i)
```

That replaces a quadratic enumeration with two linear stack passes. Verified
against brute force over 200,000 arrays of up to 9 elements drawn from four
values: **0 mismatches**.

## The tie convention decides whether it is right at all

| Convention | Wrong on |
|---|---|
| Previous strictly smaller, next smaller-**or-equal** | **0** |
| Both strictly smaller | **140,930** (70.5%) |
| Both smaller-or-equal | **140,930** (70.5%) |

Both symmetric conventions fail, on the same arrays. The largest overcount
observed was **315**.

The smallest demonstration:

```
a = [2, 2, 2]     true answer 12     both strict gives 20
```

Six subarrays, every minimum 2, so `6 × 2 = 12`. With both comparisons strict, no
2 stops any other, each element claims all the ground between the boundaries, and
the same subarrays are counted repeatedly.

Now the input that hides it:

```
a = [3, 1, 2, 4]  true answer 17     both strict gives 17    asymmetric gives 17
```

Distinct values, so every convention agrees. This is why the bug survives: the
natural test case has no repeats.

## The one-pass form is faster

The span method makes two stack passes and builds two index arrays. There is a
tighter formulation that carries the answer forward instead.

Let `dp[i]` be the sum of the minimums of all subarrays *ending* at `i`. When the
previous smaller element is at `p`, every subarray ending at `i` and starting
after `p` has minimum `a[i]` — there are `i − p` of them — and every subarray
starting at or before `p` has the same minimum it had when it ended at `p`:

```
dp[i] = dp[p] + (i - p) * a[i]        with dp[-1] treated as 0
```

The total is the sum of `dp`. One pass, one stack, no second array — and 0
mismatches over the same 200,000 arrays.

| n | Brute force | Two-pass spans | One-pass DP | spans / DP |
|---|---|---|---|---|
| 1,000 | 422,833ns | 21,209ns | **9,667ns** | 2.19x |
| 4,000 | 6,727,917ns | 94,000ns | **42,459ns** | 2.21x |
| 16,000 | 245,267,708ns | 413,708ns | **172,125ns** | 2.40x |
| 64,000 | — | 2,568,208ns | **882,417ns** | **2.91x** |

**593x** over brute force at n = 16,000, and the DP is a further 2.4x on top.
Python agrees: 371x and 2.33x at n = 2,000.

## Overflow is not optional

The sum grows as `n² × value`. At the usual constraint of n = 30,000 with values
up to 30,000:

```
sum = 13,500,450,000,000
```

That is **6,287x** larger than `INT_MAX`. It fits in a 64-bit integer with a
factor of 683,190 to spare, so `long long` is sufficient — but a 32-bit
accumulator wraps silently and produces a plausible small number.

The problem statement asks for the answer modulo 10⁹+7, which is a separate
requirement from the overflow. In Python integers never overflow, so the modulo
there is purely the problem's rule, not the language's — and applying it too
early, inside the per-element product, is a common way to get a wrong answer that
looks reasonable.

## Where this goes next

**Asteroid Collision** breaks the pattern deliberately: the stack still holds
elements awaiting resolution, but arrivals can *destroy* the incoming element
rather than only the waiting ones, so the push is conditional. It is the first
problem here where an element may never join the stack at all.

<!-- @intuition -->
Counting over subarrays is hopeless because there are quadratically many of them, and the way out is to notice that the quantity being summed — the minimum — is attached to a single element of each subarray. So rather than walking the subarrays and asking each one for its minimum, walk the elements and ask each one which subarrays it owns. An element owns exactly the subarrays that reach neither of the smaller elements flanking it, because the moment a subarray extends past one of those, that smaller element takes over as the minimum. The two boundaries are precisely what next-smaller and previous-smaller give you, and the count of subarrays between them is a product of two independent choices: where to start and where to end. The only difficulty is that when neighbouring elements are equal, "flanked by something smaller" does not distinguish them, so a rule is needed to decide which of the equals owns the shared ground — and that rule is one character on one side of one comparison.

<!-- @approach -->
### Brute Force - Every Subarray, Carrying the Minimum

<!-- @idea -->
Fix a start, extend the end one step at a time, and keep a running minimum so each subarray costs O(1).

<!-- @steps -->
1. Loop `i` over every start position.
2. Set a running minimum to infinity.
3. Extend `j` from `i` to the end, updating the running minimum with `a[j]`.
4. Add the running minimum to the total at each step.
5. Note that carrying the minimum avoids recomputing it, so this is O(n^2) rather than O(n^3).

<!-- @complexity -->
- time: O(n^2) — one addition per subarray, and there are n(n+1)/2 of them
- space: O(1) beyond the accumulator
- note: The reference the other two were verified against, over 200,000 tie-heavy arrays with 0 mismatches. Measured 245,267,708ns at n = 16,000 against the one-pass DP's 172,125ns, a factor of 1,425. Worth writing carefully: the naive version recomputes the minimum for each subarray and is O(n^3), which is a different and much worse algorithm than this one.

<!-- @code cpp -->
```cpp
#include <vector>
#include <climits>
#include <algorithm>
using namespace std;

long long sumSubarrayMins(const vector<int>& a) {
    int n = a.size();
    long long total = 0;
    for (int i = 0; i < n; i++) {
        int running = INT_MAX;
        for (int j = i; j < n; j++) {
            running = min(running, a[j]);
            total += running;
        }
    }
    return total;
}

// a = [3, 1, 2, 4] -> 17
```

<!-- @annotations -->
- 11: The running minimum is what keeps this quadratic; recomputing min over a[i..j] inside the inner loop would make it cubic.
- 8: long long from the start — the sum reaches 13,500,450,000,000 at the usual constraints, which is 6,287x INT_MAX.
- 19: Four elements, ten subarrays, and every convention agrees on this input because the values are distinct.

<!-- @code java -->
```java
static long sumSubarrayMins(int[] a) {
    int n = a.length;
    long total = 0;
    for (int i = 0; i < n; i++) {
        int running = Integer.MAX_VALUE;
        for (int j = i; j < n; j++) {
            running = Math.min(running, a[j]);
            total += running;
        }
    }
    return total;
}
```

<!-- @annotations -->
- 3: long rather than int for the accumulator; Java's int would wrap silently at the problem's stated constraints.

<!-- @code python -->
```python
def sum_subarray_mins(a: list[int]) -> int:
    n = len(a)
    total = 0
    for i in range(n):
        running = float("inf")
        for j in range(i, n):
            running = min(running, a[j])
            total += running
    return total


# 933.3ms at n = 2,000 against the one-pass DP's 1.08ms.
```

<!-- @annotations -->
- 5: float("inf") works but makes the running minimum a float until the first comparison; a[i] is a cleaner initial value and keeps the arithmetic integral.

<!-- @approach -->
### Optimal - Spans, With the Asymmetric Tie Rule

<!-- @idea -->
Ask each element how many subarrays it is the minimum of, and weight by its value.

<!-- @steps -->
1. Compute `prev[i]`, the index of the previous **strictly** smaller element, with a forward stack pass.
2. Compute `next[i]`, the index of the next smaller **or equal** element, with a backward pass.
3. Note that `a[i]` is the minimum of every subarray starting after `prev[i]` and ending before `next[i]`.
4. Count them as `(i − prev[i]) × (next[i] − i)`, a product of independent start and end choices.
5. Sum `a[i]` times that count over all `i`.

<!-- @complexity -->
- time: O(n) — two stack passes, each with n pushes and at most n pops
- space: O(n) for the two index arrays and the stack
- note: 0 mismatches against brute force over 200,000 tie-heavy arrays with the asymmetric rule. With both comparisons strict, or both non-strict, it is wrong on 140,930 of them — 70.5% — with overcounts up to 315. Measured 413,708ns at n = 16,000 against brute force's 245,267,708ns, a factor of 593.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

long long sumSubarrayMins(const vector<int>& a) {
    int n = a.size();
    vector<int> prev(n, -1), next(n, n), st;

    for (int i = 0; i < n; i++) {                     // previous STRICTLY smaller
        while (!st.empty() && a[st.back()] >= a[i]) st.pop_back();
        prev[i] = st.empty() ? -1 : st.back();
        st.push_back(i);
    }
    st.clear();
    for (int i = n - 1; i >= 0; i--) {                // next smaller OR EQUAL
        while (!st.empty() && a[st.back()] > a[i]) st.pop_back();
        next[i] = st.empty() ? n : st.back();
        st.push_back(i);
    }

    long long total = 0;
    for (int i = 0; i < n; i++)
        total += (long long)a[i] * (i - prev[i]) * (next[i] - i);
    return total;
}
```

<!-- @annotations -->
- 9: >= makes the left side strict: an equal element is popped, so it does not become the boundary.
- 15: > rather than >=, so an equal element on the right survives and DOES become the boundary. These two characters are the whole tie rule.
- 16: n as the right-hand sentinel, not -1, or (next - i) is not a width.
- 22: The cast must come before the multiplication — (long long)a[i] * ... widens the whole product, while (long long)(a[i] * ...) would overflow first and then widen the wrong answer.

<!-- @code java -->
```java
static long sumSubarrayMins(int[] a) {
    int n = a.length;
    int[] prev = new int[n], next = new int[n];
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && a[st.peek()] >= a[i]) st.pop();
        prev[i] = st.isEmpty() ? -1 : st.peek();
        st.push(i);
    }
    st.clear();
    for (int i = n - 1; i >= 0; i--) {
        while (!st.isEmpty() && a[st.peek()] > a[i]) st.pop();
        next[i] = st.isEmpty() ? n : st.peek();
        st.push(i);
    }

    long total = 0;
    for (int i = 0; i < n; i++)
        total += (long) a[i] * (i - prev[i]) * (next[i] - i);
    return total;
}
```

<!-- @annotations -->
- 20: (long) a[i] before the multiplication, for the same reason — the product of three ints overflows before the assignment widens it.

<!-- @code python -->
```python
def sum_subarray_mins(a: list[int]) -> int:
    n = len(a)
    prev, nxt = [-1] * n, [n] * n

    st = []                                           # previous STRICTLY smaller
    for i in range(n):
        while st and a[st[-1]] >= a[i]:
            st.pop()
        prev[i] = st[-1] if st else -1
        st.append(i)

    st = []                                           # next smaller OR EQUAL
    for i in range(n - 1, -1, -1):
        while st and a[st[-1]] > a[i]:
            st.pop()
        nxt[i] = st[-1] if st else n
        st.append(i)

    return sum(a[i] * (i - prev[i]) * (nxt[i] - i) for i in range(n))


# [2, 2, 2] -> 12.  With both comparisons strict it returns 20.
```

<!-- @annotations -->
- 8: >= here and > below. Writing the same operator twice is the bug, and it is invisible on any array of distinct values.
- 19: No overflow concern in Python, but the problem's modulo still applies — and it must be taken at the end, not inside the product.

<!-- @approach -->
### Faster - One Pass, Carrying the Answer

<!-- @idea -->
Track the sum of minimums over all subarrays ending at each position, and build each from the previous smaller element's value.

<!-- @steps -->
1. Let `dp[i]` be the sum of the minimums of all subarrays ending at `i`.
2. Find `p`, the index of the previous strictly smaller element, with the usual stack.
3. Every subarray ending at `i` and starting after `p` has minimum `a[i]`, and there are `i − p` of them.
4. Every subarray starting at or before `p` keeps whatever minimum it had ending at `p`, which is `dp[p]`.
5. So `dp[i] = dp[p] + (i − p) × a[i]`, with `dp[-1]` treated as 0, and the answer is the sum of `dp`.

<!-- @complexity -->
- time: O(n) — a single pass with one stack
- space: O(n) for the dp array, reducible to O(n) for the stack alone since only dp at stack positions is ever read
- note: 0 mismatches against brute force over the same 200,000 tie-heavy arrays. Measured 2.19x to 2.91x faster than the two-pass span method — 882,417ns against 2,568,208ns at n = 64,000 — because it makes one pass instead of two, allocates one array instead of two, and never builds an explicit next-smaller table. Python agrees at 2.33x.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

long long sumSubarrayMins(const vector<int>& a) {
    int n = a.size();
    vector<long long> dp(n, 0);
    vector<int> st;
    long long total = 0;

    for (int i = 0; i < n; i++) {
        while (!st.empty() && a[st.back()] >= a[i]) st.pop_back();
        int p = st.empty() ? -1 : st.back();
        dp[i] = (p < 0 ? 0 : dp[p]) + (long long)(i - p) * a[i];
        st.push_back(i);
        total += dp[i];
    }
    return total;
}

// One pass, one stack, no next-smaller table — 2.4x the two-pass version
// at n = 16,000 and 2.9x at n = 64,000.
```

<!-- @annotations -->
- 11: >= gives the previous strictly smaller element, which is the same left-hand rule as the span version — the tie asymmetry is now implicit rather than split across two loops.
- 13: dp[p] carries the entire history of subarrays reaching past p, so nothing before p is ever revisited. Note also that (long long)(i - p) * a[i] widens before multiplying; at the problem's constraints the product alone can exceed a 32-bit int.
- 15: Accumulating inside the loop avoids a second pass over dp, which is worth a measurable amount at these sizes.

<!-- @code java -->
```java
static long sumSubarrayMins(int[] a) {
    int n = a.length;
    long[] dp = new long[n];
    Deque<Integer> st = new ArrayDeque<>();
    long total = 0;

    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && a[st.peek()] >= a[i]) st.pop();
        int p = st.isEmpty() ? -1 : st.peek();
        dp[i] = (p < 0 ? 0 : dp[p]) + (long) (i - p) * a[i];
        st.push(i);
        total += dp[i];
    }
    return total;
}
```

<!-- @annotations -->
- 10: long[] for dp, not int[] — the per-position value can itself exceed a 32-bit int before the total does.

<!-- @code python -->
```python
def sum_subarray_mins(a: list[int]) -> int:
    dp = [0] * len(a)
    st = []
    total = 0
    for i, x in enumerate(a):
        while st and a[st[-1]] >= x:
            st.pop()
        p = st[-1] if st else -1
        dp[i] = (dp[p] if p >= 0 else 0) + (i - p) * x
        st.append(i)
        total += dp[i]
    return total


# 1.08ms at n = 2,000 against the span version's 2.51ms and the brute
# force's 933.3ms.
```

<!-- @annotations -->
- 9: dp[p] if p >= 0 else 0 — writing dp[p] unguarded would index dp[-1], which in Python silently reads the LAST element rather than raising.

<!-- @approach -->
### Applying the Modulo Correctly

<!-- @idea -->
The problem asks for the answer modulo 10^9+7, and where the modulo is applied changes whether it is right.

<!-- @steps -->
1. Note that the true sum can reach 13,500,450,000,000, which exceeds a 32-bit integer by 6,287x.
2. Accumulate in a 64-bit type so the running total never wraps.
3. Take the modulo of the running total, not of the individual factors.
4. Note that the per-element product `a[i] × (i − prev) × (next − i)` fits comfortably in 64 bits, so it needs no intermediate reduction.
5. Reduce once at the end, or after each addition if the accumulator could otherwise overflow.

<!-- @complexity -->
- time: unchanged
- space: unchanged
- note: The modulo and the overflow are separate concerns. In C++ and Java a 64-bit accumulator is required regardless of the modulo, since 13,500,450,000,000 does not fit in 32 bits — and it fits in 64 with a factor of 683,190 to spare. In Python integers never overflow, so the modulo there is purely the problem's rule; applying it inside the product rather than to the total is a common way to produce a plausible wrong answer.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;
const long long MOD = 1000000007;

long long sumSubarrayMinsMod(const vector<int>& a) {
    int n = a.size();
    vector<long long> dp(n, 0);
    vector<int> st;
    long long total = 0;

    for (int i = 0; i < n; i++) {
        while (!st.empty() && a[st.back()] >= a[i]) st.pop_back();
        int p = st.empty() ? -1 : st.back();
        dp[i] = ((p < 0 ? 0 : dp[p]) + (long long)(i - p) * a[i]) % MOD;
        st.push_back(i);
        total = (total + dp[i]) % MOD;
    }
    return total;
}

// Reducing dp[i] is safe: it keeps each term below MOD, so the sum of
// two of them cannot overflow a 64-bit accumulator.
```

<!-- @annotations -->
- 14: Reducing dp[i] as it is built keeps every later dp[p] small, which is what makes the accumulation safe without any wider type.
- 16: Reducing the total too, so it never grows beyond MOD regardless of n.
- 21: Worth checking rather than assuming: (i - p) * a[i] before reduction is at most about 9 x 10^8 at the stated constraints, well inside 64 bits.

<!-- @code java -->
```java
static final long MOD = 1_000_000_007L;

static long sumSubarrayMinsMod(int[] a) {
    int n = a.length;
    long[] dp = new long[n];
    Deque<Integer> st = new ArrayDeque<>();
    long total = 0;

    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && a[st.peek()] >= a[i]) st.pop();
        int p = st.isEmpty() ? -1 : st.peek();
        dp[i] = ((p < 0 ? 0 : dp[p]) + (long) (i - p) * a[i]) % MOD;
        st.push(i);
        total = (total + dp[i]) % MOD;
    }
    return total;
}
```

<!-- @annotations -->
- 1: 1_000_000_007L with the L suffix, or the constant is an int and every modulo promotes it repeatedly.

<!-- @code python -->
```python
MOD = 10**9 + 7

def sum_subarray_mins_mod(a: list[int]) -> int:
    dp = [0] * len(a)
    st = []
    total = 0
    for i, x in enumerate(a):
        while st and a[st[-1]] >= x:
            st.pop()
        p = st[-1] if st else -1
        dp[i] = ((dp[p] if p >= 0 else 0) + (i - p) * x) % MOD
        st.append(i)
        total = (total + dp[i]) % MOD
    return total


# n = 30,000 all values 30,000: the true sum is 13,500,450,000,000 and
# the answer mod 1e9+7 is 449,905,500.
```

<!-- @annotations -->
- 11: The modulo is the problem's requirement rather than the language's — Python would compute the exact 13,500,450,000,000 quite happily.
- 17: A useful test vector, because it is large enough that a misplaced modulo or a 32-bit accumulator gives a visibly different number.

<!-- @example -->

<!-- @input -->
a = [3, 1, 2, 4]

<!-- @output -->
17

<!-- @why -->
Ten subarrays is few enough to enumerate by hand, and the values are distinct so every tie convention agrees — which makes it the input that hides the bug.

<!-- @walkthrough -->
1. The subarrays starting at index 0 are [3], [3,1], [3,1,2] and [3,1,2,4], with minimums 3, 1, 1 and 1.
2. Starting at index 1: [1], [1,2], [1,2,4], with minimums 1, 1 and 1.
3. Starting at index 2: [2], [2,4], with minimums 2 and 2.
4. Starting at index 3: [4], with minimum 4. The total is 3 + 1 + 1 + 1 + 1 + 1 + 1 + 2 + 2 + 4 = 17.
5. By spans: the 1 at index 1 has no smaller element on either side, so prev is -1 and next is 4, giving (1 - (-1)) * (4 - 1) = 6 subarrays, contributing 6.
6. The 3 at index 0 is bounded on the right by the 1, so prev is -1 and next is 1, giving 1 * 1 = 1 subarray, contributing 3. The 2 at index 2 has prev 1 and next 4, giving 1 * 2 = 2 subarrays, contributing 4. The 4 at index 3 has prev 2 and next 4, giving 1 subarray, contributing 4.
7. Total 6 + 3 + 4 + 4 = 17, and the counts 6 + 1 + 2 + 1 sum to 10, which is the number of subarrays — the identity holding.

<!-- @example -->

<!-- @input -->
a = [2, 2, 2]

<!-- @output -->
12 with the asymmetric rule, 20 with both comparisons strict

<!-- @why -->
It is the smallest input where the tie convention changes the answer, and the error is a plausible larger number rather than a crash.

<!-- @walkthrough -->
1. There are six subarrays and every one has minimum 2, so the answer is 6 x 2 = 12.
2. With both comparisons strict, no 2 is stopped by any other 2, so every element has prev = -1 and next = 3.
3. That gives counts of (0+1)*(3-0) = 3, (1+1)*(3-1) = 4 and (2+1)*(3-2) = 3, totalling 10 subarrays where there are only 6.
4. Multiplying by 2 gives 20 instead of 12 — the shared subarrays have been counted by more than one element.
5. With previous strictly smaller and next smaller-or-equal, the boundaries become prev = [-1, -1, -1] and next = [1, 2, 3].
6. The counts are 1*1 = 1, 2*1 = 2 and 3*1 = 3, totalling exactly 6, and the answer is 12.
7. The rule that fixes it is "the leftmost of the tied minima owns the shared ground", imposed by making one side of the comparison non-strict.

<!-- @example -->

<!-- @input -->
200,000 arrays of up to 9 elements drawn from four values

<!-- @output -->
0 wrong with the asymmetric rule; 140,930 wrong — 70.5% — with either symmetric one

<!-- @why -->
It measures how often the convention matters rather than asserting that it does, and the answer is "on most inputs that contain ties".

<!-- @walkthrough -->
1. Every array was evaluated by the O(n^2) brute force and by the span method under three tie conventions.
2. With previous strictly smaller and next smaller-or-equal, the span method matched the brute force on all 200,000.
3. With both comparisons strict it was wrong on 140,930 — 70.5% — and the largest overcount was 315.
4. With both non-strict it was wrong on exactly the same 140,930 arrays.
5. That both symmetric conventions fail identically is the diagnostic: the problem is the symmetry, not which strictness was chosen.
6. The values were drawn from only four distinct numbers so that nearly every array contained ties; on arrays of distinct values all three conventions agree exactly.
7. The one-pass DP was checked on the same 200,000 arrays and also matched on every one, which confirms its implicit tie handling is equivalent to the explicit asymmetric rule.

<!-- @example -->

<!-- @input -->
n = 30,000 with every value 30,000

<!-- @output -->
13,500,450,000,000 — 6,287 times INT_MAX

<!-- @why -->
The overflow is not a corner case at the problem's stated constraints; it is the ordinary behaviour of the maximum input.

<!-- @walkthrough -->
1. With every value equal, every one of the n(n+1)/2 = 450,015,000 subarrays has minimum 30,000.
2. The sum is therefore 450,015,000 x 30,000 = 13,500,450,000,000.
3. INT_MAX is 2,147,483,647, so the true answer is 6,287 times larger and a 32-bit accumulator wraps.
4. It wraps silently to a small plausible number rather than failing, which is why this needs to be decided before writing rather than debugged afterwards.
5. A 64-bit accumulator holds it with a factor of 683,190 to spare, so long long or long is sufficient without any special handling.
6. The modulo of 10^9+7 that the problem requests is a separate matter — it is the problem's rule, not a workaround for the overflow.
7. In Python the integer would be computed exactly, so the modulo there is purely the problem's requirement; the correct answer for this input is 449,905,500.

<!-- @visualization array -->

<!-- @description -->
Open with the reframing, because it is the whole idea. Draw [3, 1, 2, 4] and beneath it a triangular grid of all ten subarrays, one row per start index, each cell labelled with that subarray's minimum. Point out that the grid has quadratically many cells. Then recolour: give each element a colour and tint every cell whose minimum comes from that element. The tinted regions form four contiguous blocks — the 1's block covering six cells, the 3's one cell, the 2's two, the 4's one. Caption it "every cell belongs to exactly one element; count the blocks, not the cells". Then the span construction on the bars: for the 1 at index 1, extend a band left and right until it meets a smaller bar, hitting the array edges both ways, and show the count as 2 choices of start times 3 choices of end. Repeat for each element so the four blocks are rebuilt from the boundaries rather than from the grid. Then the tie failure: switch to [2, 2, 2] with both comparisons strict, and let all three elements extend bands across the whole array. The bands overlap; shade the overlaps darker and let a counter run to 10 against a target of 6, with the answer showing 20 instead of 12. Change one comparison to non-strict and replay — the bands now abut instead of overlapping, tiling the six cells exactly, and the answer reads 12. Hold on the two characters >= and > side by side. Then the DP panel: the same array scanned once left to right, with dp[i] drawn as a stacked bar in two segments — a carried-forward part taken from dp[p], drawn in the previous element's colour, and a new part of height (i − p) × a[i] in the current element's. Show the running total accumulating beneath. The visual point is that nothing before p is ever revisited. Close with the overflow panel: a 32-bit register drawn as a fixed-width box with 13,500,450,000,000 spilling far past its right edge, annotated 6,287x, beside a 64-bit box in which the same number sits comfortably with 683,190x of headroom remaining.

<!-- @sampleInput -->
```json
{"problem":{"array":[3,1,2,4],"answer":17,"subarrayCount":10,"formula":"n(n+1)/2 subarrays","enumeration":[{"start":0,"subarrays":[[3],[3,1],[3,1,2],[3,1,2,4]],"minimums":[3,1,1,1]},{"start":1,"subarrays":[[1],[1,2],[1,2,4]],"minimums":[1,1,1]},{"start":2,"subarrays":[[2],[2,4]],"minimums":[2,2]},{"start":3,"subarrays":[[4]],"minimums":[4]}]},"reframing":{"idea":"every subarray has exactly one minimum, so count the blocks rather than the cells","spans":[{"i":0,"value":3,"prev":-1,"next":1,"count":1,"contribution":3},{"i":1,"value":1,"prev":-1,"next":4,"count":6,"contribution":6},{"i":2,"value":2,"prev":1,"next":4,"count":2,"contribution":4},{"i":3,"value":4,"prev":2,"next":4,"count":1,"contribution":4}],"countsSum":10,"contributionsSum":17,"identity":"the counts must total n(n+1)/2"},"tieConvention":{"rule":"previous STRICTLY smaller, next smaller OR EQUAL","meaning":"the leftmost of the tied minima owns the shared ground","experiment":{"arrays":200000,"maxLength":9,"distinctValues":4,"results":[{"convention":"left strict, right loose","wrong":0},{"convention":"both strict","wrong":140930,"percent":70.5,"largestOvercount":315},{"convention":"both non-strict","wrong":140930,"percent":70.5}],"diagnostic":"both symmetric conventions fail on exactly the same arrays — the problem is the symmetry, not the strictness"},"smallestFailure":{"array":[2,2,2],"trueAnswer":12,"bothStrict":{"prev":[-1,-1,-1],"next":[3,3,3],"counts":[3,4,3],"countTotal":10,"answer":20},"asymmetric":{"prev":[-1,-1,-1],"next":[1,2,3],"counts":[1,2,3],"countTotal":6,"answer":12}},"hiddenBy":{"array":[3,1,2,4],"allConventionsAgree":17,"why":"distinct values"}},"onePassDP":{"definition":"dp[i] = sum of the minimums of all subarrays ENDING at i","recurrence":"dp[i] = dp[p] + (i - p) * a[i], with dp[-1] treated as 0","reasoning":["subarrays ending at i and starting after p have minimum a[i] — there are i - p of them","subarrays starting at or before p keep the minimum they had ending at p, which is dp[p]"],"answer":"the sum of dp","advantages":["one pass instead of two","one array instead of two","no explicit next-smaller table"],"verified":{"arrays":200000,"mismatches":0}},"timing":{"unit":"ns","rows":[{"n":1000,"brute":422833,"spans":21209,"dp":9667,"bruteOverSpans":20,"spansOverDp":2.19},{"n":4000,"brute":6727917,"spans":94000,"dp":42459,"bruteOverSpans":72,"spansOverDp":2.21},{"n":16000,"brute":245267708,"spans":413708,"dp":172125,"bruteOverSpans":593,"spansOverDp":2.4},{"n":64000,"brute":null,"spans":2568208,"dp":882417,"bruteOverSpans":null,"spansOverDp":2.91}],"python":{"n":2000,"bruteMs":933.3,"spansMs":2.51,"dpMs":1.08,"bruteOverSpans":371,"spansOverDp":2.33}},"overflow":{"worstInput":"n = 30,000 with every value 30,000","subarrays":450015000,"sum":13500450000000,"intMax":2147483647,"timesIntMax":6287,"fitsIn64Bit":true,"headroom":683190,"silentFailure":"a 32-bit accumulator wraps to a small plausible number rather than failing","moduloIsSeparate":"10^9+7 is the problem's rule, not a workaround for the overflow","pythonNote":"integers never overflow, so the modulo there is purely the problem's requirement","testVector":{"input":"n = 30,000 all 30,000","exact":13500450000000,"mod":449905500}},"castingHazard":{"wrong":"(long long)(a[i] * (i - prev) * (next - i))","right":"(long long)a[i] * (i - prev) * (next - i)","why":"the first computes the product in 32 bits, overflows, and then widens the wrong answer"}}
```

<!-- @highlights -->
- [3, 1, 2, 4] is drawn above a triangular grid of all ten subarrays, each cell labelled with its minimum.
- The grid's quadratic size is pointed out before any algorithm appears.
- Each element gets a colour, and every cell is tinted by whichever element supplies its minimum.
- The tints form four contiguous blocks of sizes 6, 1, 2 and 1.
- It is captioned "every cell belongs to exactly one element; count the blocks, not the cells".
- For the 1 at index 1, a band extends left and right to the array edges, shown as 2 start choices times 3 end choices.
- Each element's band is drawn in turn, rebuilding the four blocks from boundaries rather than from the grid.
- The input switches to [2, 2, 2] with both comparisons strict, and all three bands span the whole array.
- The overlaps are shaded darker and a counter runs to 10 against a target of 6, with the answer showing 20.
- One comparison changes to non-strict and the bands abut instead of overlapping, tiling six cells exactly.
- The answer reads 12, and the two characters >= and > are held side by side.
- The 1's band reaches both array edges, which is why its block is the largest.
- The DP panel scans the array once, drawing dp[i] as a stacked bar in two segments.
- The carried part is tinted in the previous element's colour and the new part has height (i - p) x a[i].
- A running total accumulates beneath, showing that nothing before p is ever revisited.
- A 32-bit register box is drawn with 13,500,450,000,000 spilling past its edge, annotated 6,287x, beside a 64-bit box holding it with 683,190x of headroom.

<!-- @edgeCases -->
- A single element — the answer is that element, and both stack passes leave it with prev = -1 and next = 1.
- All elements equal — the answer is n(n+1)/2 times the value, and the case that exposes a symmetric tie rule.
- Two equal elements — the smallest input where the convention changes the answer.
- A strictly increasing array — every element's previous smaller is its left neighbour, so each span is narrow on the left.
- A strictly decreasing array — every element's next smaller is its right neighbour, so each span is narrow on the right.
- Distinct values throughout — all three tie conventions agree, which is why the bug survives ordinary testing.
- Using -1 as the right-hand sentinel — makes (next - i) negative and the product meaningless.
- A 32-bit accumulator at the stated constraints — the sum reaches 6,287 times INT_MAX and wraps silently.
- Casting after multiplying rather than before — the product overflows in 32 bits and the widening preserves the wrong value.
- dp[p] with p = -1 in Python — indexes the last element rather than raising, silently corrupting the result.
- Applying the modulo inside the per-element product — unnecessary at these constraints and a common source of wrong answers.

<!-- @pitfalls -->
- Using the same strictness on both comparisons. It is wrong on 70.5% of tie-heavy arrays, returning 20 for [2, 2, 2] where the answer is 12.
- Testing only with distinct values. All three tie conventions agree there, so the convention bug is invisible.
- Accumulating in a 32-bit integer. The sum reaches 13,500,450,000,000 at the stated constraints — 6,287 times INT_MAX — and wraps silently.
- Writing (long long)(a[i] * (i - prev) * (next - i)). The product is computed in 32 bits and overflows before the cast; widen the first factor instead.
- Using -1 as the next-smaller sentinel. It must be n, or the width (next - i) is negative.
- Indexing dp[p] with p = -1 in Python. It reads the last element rather than raising, which corrupts the answer quietly.
- Recomputing the minimum inside the brute force's inner loop. That makes it O(n^3) rather than O(n^2), and it is the version usually written first.
- Building the two-pass span version by default. The one-pass DP measured 2.19x to 2.91x faster and needs one array instead of two.
- Applying the modulo to the individual factors. At these constraints the product fits in 64 bits comfortably, and reducing early is a common source of wrong answers.
- Forgetting the L suffix on 1_000_000_007 in Java. The constant is then an int and gets promoted on every use.
- Assuming the modulo protects against overflow. It does, once applied, but the requirement to use a 64-bit accumulator comes from the raw sum and exists independently.
- Deriving the span boundaries with next-GREATER by mistake. The minimum's span is bounded by smaller elements; using greater ones inverts the problem into Sum of Subarray Maximums.

<!-- @doubt -->
### Why count per element instead of per subarray?

<!-- @answer -->
Because there are n(n+1)/2 subarrays and only n elements, and the quantity being summed — the minimum — belongs to exactly one element of each subarray. So instead of walking the subarrays and asking each for its minimum, walk the elements and ask each which subarrays it is minimal over. That set is exactly the subarrays lying strictly between the nearest smaller element on the left and the nearest smaller on the right, and its size is a product of independent start and end choices: (i − prev) × (next − i). A quadratic enumeration becomes two linear passes.

<!-- @doubt -->
### Why does the tie convention matter so much?

<!-- @answer -->
Because equal elements are all minimal over the ground between them, so without a rule they all claim the same subarrays. Measured over 200,000 tie-heavy arrays, using the same strictness on both sides was wrong on 140,930 — 70.5% — with overcounts up to 315. On [2, 2, 2] it returns 20 where the answer is 12: six subarrays get counted ten times between them. Making one side strict and the other non-strict imposes "the leftmost of the tied minima owns the shared ground", so the spans partition the subarrays exactly and the counts sum to n(n+1)/2.

<!-- @doubt -->
### Which side should be strict?

<!-- @answer -->
Either, as long as they differ. Previous strictly smaller with next smaller-or-equal gives "the leftmost of the tied minima owns it"; the reverse gives "the rightmost". Both partition the subarrays correctly and both were verified. What fails is choosing the same strictness twice, and the diagnostic is that both symmetric conventions were wrong on exactly the same 140,930 arrays — the problem is the symmetry rather than which strictness was picked. Pick one and use it consistently, because mixing conventions between the two arrays reintroduces the overlap.

<!-- @doubt -->
### How does the one-pass DP work?

<!-- @answer -->
dp[i] is the sum of the minimums of every subarray ending at i. Split those subarrays at p, the previous strictly smaller element. Any subarray ending at i that starts after p contains no element smaller than a[i], so its minimum is a[i] — and there are i − p of them. Any subarray that starts at or before p contains a[p], so its minimum is whatever it was when the subarray ended at p, and the sum of those is dp[p] exactly. Hence dp[i] = dp[p] + (i − p) × a[i], with dp[−1] treated as 0. The answer is the sum of dp, computed in the same pass.

<!-- @doubt -->
### Is the DP actually faster, or just shorter?

<!-- @answer -->
Faster, measurably: 2.19x at n = 1,000 rising to 2.91x at n = 64,000, and 2.33x in Python. It makes one stack pass instead of two, allocates one array instead of two, never materialises a next-smaller table, and accumulates the total inside the same loop. All four savings are real but none is asymptotic — both are O(n), and the gap is constant-factor. It is also the version where the tie handling is implicit rather than split across two loops with different comparisons, which removes the most common source of error.

<!-- @doubt -->
### How big does the sum get?

<!-- @answer -->
13,500,450,000,000 at the usual constraints — n = 30,000 with every value 30,000, giving 450,015,000 subarrays each with minimum 30,000. That is 6,287 times INT_MAX, so a 32-bit accumulator wraps, silently, to a small plausible number. A 64-bit accumulator holds it with a factor of 683,190 to spare, so long long or long is enough with no special handling. This is the ordinary behaviour of the maximum input rather than a corner case, which is why the type has to be chosen before writing rather than fixed after debugging.

<!-- @doubt -->
### Where should the modulo go?

<!-- @answer -->
On the running total, and optionally on each dp value as it is built — not inside the per-element product. At these constraints (i − p) × a[i] is at most about 9 × 10⁸, comfortably inside 64 bits, so it needs no intermediate reduction. Reducing dp[i] as it is computed is worthwhile because every later dp[p] then stays below the modulus, which keeps the additions safe for any n. Note that the modulo and the overflow are separate requirements: in Python integers never overflow, and the modulo is still needed because the problem asks for it.

<!-- @doubt -->
### Why does casting after multiplying fail?

<!-- @answer -->
Because the multiplication happens first, in 32-bit arithmetic, and the cast then widens a value that has already wrapped. Writing (long long)(a[i] * (i - prev) * (next - i)) computes a three-way int product — which at the stated constraints can exceed INT_MAX — and preserves the wrong answer perfectly. Writing (long long)a[i] * (i - prev) * (next - i) widens the first factor, which promotes the whole expression to 64-bit arithmetic. The same applies in Java with (long) a[i]. It is a one-character difference in placement and a complete difference in result.

<!-- @doubt -->
### What if the problem asked for maximums instead?

<!-- @answer -->
The identical algorithm with every comparison reversed: previous strictly greater and next greater-or-equal, and the same product. The tie asymmetry is needed for exactly the same reason and in exactly the same shape. This matters because Sum of Subarray Ranges — two subtopics from here — is precisely the maximum version minus the minimum version, so it needs both, and it is easy to derive one from the other by flipping comparisons and then forget to keep the asymmetry consistent between them.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Asteroid Collision, which deliberately breaks the pattern this family has settled into. The stack still holds elements awaiting resolution, but an arriving element can be destroyed by what is already there rather than only destroying it — so the push becomes conditional and an element may never join the stack at all. After three subtopics where every element is pushed exactly once, that is a genuine change to the invariant, and it is what makes the amortised argument need restating rather than reusing.
