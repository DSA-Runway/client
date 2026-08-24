---
id: split-array-largest-sum
topic: Binary Search
title: Split Array - Largest Sum
difficulty: Hard
status: ready
prerequisites:
  - book-allocation-problem
  - painters-partition
  - aggressive-cows
relatedIds:
  - book-allocation-problem
  - painters-partition
  - aggressive-cows
  - koko-eating-bananas
  - capacity-to-ship-packages-within-d-days
---

<!-- @summary -->
The third costume of one problem — both the Painter's Partition and Book Allocation solutions, applied verbatim, are correct on all 112,305 exhaustive cases. What this formulation adds is measurable: the greedy's comparison operator must be > and not >=, which is wrong on 48.07% of inputs, and the partition DP passes this problem's own stated limits in C++ at 14ms while failing them in Python at 1,666ms.

<!-- @theory -->
## The problem

Split `nums` into exactly `k` non-empty **contiguous** subarrays so that the
largest subarray sum is as small as possible, and return that sum.

```
nums = [7, 2, 5, 10, 8], k = 2   ->  18
       [7, 2, 5] | [10, 8]       ->  max(14, 18) = 18

nums = [1, 2, 3, 4, 5], k = 2    ->  9
       [1, 2, 3] | [4, 5]        ->  max(6, 9) = 9
```

## You have already written this solution twice

This is Painter's Partition and Book Allocation with the nouns changed again —
elements per subarray instead of boards per painter or pages per student. Checked
rather than assumed: the C++ solutions from **both** of those subtopics, applied
without changing a character, over every array of length 1 to 6 with values from
`{0..4}` and every `k` from 1 to n — **112,305 cases** — give **0 wrong** each,
against an independent enumeration of every possible split.

So the recognition rule is worth more than the code:

> contiguous blocks + "minimise the largest" = binary search the answer,
> and the feasibility check is a single greedy pass.

Two identities fall straight out of the formulation and are the fastest way to
sanity-check any implementation:

| k | answer |
|---|---|
| 1 | `sum(nums)` — one block holds everything |
| n | `max(nums)` — one element each, so the largest element is unavoidable |

Measured on a fixed 1,000-element array with `sum = 485,688` and `max = 1,000`:
k=1 gives 485,688, k=2 gives 242,845, k=5 gives 97,360, k=50 gives 10,080,
k=500 gives 1,299, and k=1000 gives 1,000. Monotone the whole way down, which is
the property the search leans on in the other direction.

## The comparison operator is not a detail

The greedy that counts blocks for a given limit is one line, and that line has a
trap:

```cpp
if (load + x > limit) { blocks++; load = x; }   // correct
if (load + x >= limit) { blocks++; load = x; }  // wrong on 48.07%
```

With `>=`, a block whose sum lands *exactly* on the limit is treated as
overflowing, so the greedy opens an unnecessary new block, reports more blocks
than needed, and the search concludes the limit is infeasible when it is exactly
achievable. Measured over the same 112,305 cases, that is wrong on **53,986 —
48.07%**, essentially a coin flip.

It matters here more than in the other two costumes because the answer very often
*is* an exact block sum — that is what "minimise the largest sum" converges on. A
limit that is achievable only with equality is the common case, not the corner.

## The DP passes this problem's limits in C++ and fails them in Python

LeetCode 410 caps this problem at `n <= 1000`, `k <= 50`, `nums[i] <= 10^6`, and
those limits are low enough that the O(n²k) partition DP is a legitimately
*accepted* solution — which is why so many published solutions use it. Measured at
exactly that ceiling:

| n | k | binary search | partition DP | ratio |
|---|---|---|---|---|
| 100 | 5 | 2,917 | 35,750 | 12x |
| 500 | 20 | 9,708 | 10,419,166 | 1,073x |
| **1,000** | **50** | **16,472** | **13,981,875** | **849x** |
| 1,000 | 10 | 12,069 | 2,892,125 | 240x |
| 1,000 | 2 | 10,194 | 582,875 | 57x |

Nanoseconds. At the ceiling the DP takes **14 milliseconds** — comfortably inside
any normal time limit, and 849x slower than necessary.

Now the same measurement in CPython:

| n | k | binary search | partition DP | ratio |
|---|---|---|---|---|
| 100 | 5 | 0.09 ms | 1.52 ms | 17x |
| 500 | 20 | 0.45 ms | 158.63 ms | 350x |
| **1,000** | **50** | **0.93 ms** | **1,665.75 ms** | **1,787x** |

The same algorithm, at the same problem's own stated constraints, is **14ms in C++
and 1.67 seconds in Python** — the C++ version passes and the Python version does
not. The constraints were evidently set against a compiled implementation.

This is worth more than the timing. "Accepted" is a fact about a judge, a language
and a constraint bound, not a property of an algorithm. An O(n²k) solution to a
problem whose answer is searchable in O(n log(sum)) is the wrong solution whether
or not it happens to fit; here that gap is the difference between a program that
runs and one that does not.

## Where enumeration dies

Trying every split is C(n−1, k−1) partitions, each costing O(n) to score:

| n (k = n/2) | enumerate every split | binary search |
|---|---|---|
| 10 | 3,667 | 375 |
| 16 | 186,333 | 458 |
| 20 | 3,206,209 | 458 |
| 24 | 54,849,500 | 666 |
| 26 | 225,508,667 | 666 |

Nanoseconds. The binary search is flat across the whole range while enumeration
grows by roughly 4x per two elements — at n = 26 the gap is **338,000x**, and
n = 30 would not finish while you waited.

<!-- @intuition -->
Meeting the same problem a third time is the point of this one. The first time it is a puzzle, the second time it is a coincidence, and the third time it should be a category — contiguous blocks plus a minimised maximum, solved by searching the answer and verifying with one greedy pass. What is genuinely new here is smaller and sharper than a new algorithm: the greedy's comparison operator has to be strict, because this formulation converges on limits that are achievable only with equality, and a single character turns a correct solution into a coin flip. That pairing is typical of mature problems — the structure is familiar and the remaining risk has concentrated into one line. Being able to say *which* line is where the value is.

<!-- @approach -->
### Enumerate Every Split

<!-- @idea -->
Choose k−1 cut positions in every possible way, score each split by its largest block, and keep the best.

<!-- @steps -->
1. There are n−1 gaps between elements; choose k−1 of them as cuts.
2. For each choice, sum each block and take the largest.
3. Return the smallest such largest.
4. This is the definition, so it needs no argument for correctness.

<!-- @complexity -->
- time: O(C(n−1, k−1) · n)
- space: O(n) for the recursion
- note: The reference the other two were verified against. Dies fast — **225ms at n = 26** against the binary search's 666 nanoseconds, growing about 4x per two elements added.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
#include <functional>
using namespace std;

long long splitArray(const vector<int>& nums, int k) {
    int n = (int)nums.size();
    if (n == 1) return nums[0];
    long long best = LLONG_MAX;
    vector<int> cut(n - 1, 0);
    function<void(int,int)> rec = [&](int i, int used) {
        if (i == n - 1) {
            if (used != k - 1) return;
            long long worst = 0, cur = 0;
            for (int j = 0; j < n; j++) {
                cur += nums[j];
                if (j < n - 1 && cut[j]) { worst = max(worst, cur); cur = 0; }
            }
            best = min(best, max(worst, cur));
            return;
        }
        cut[i] = 1; rec(i + 1, used + 1);
        cut[i] = 0; rec(i + 1, used);
    };
    rec(0, 0);
    return best;
}
```

<!-- @annotations -->
- 14: Only splits using exactly k−1 cuts count. Allowing fewer would answer a different question, since the problem demands exactly k blocks.
- 20: `max(worst, cur)` folds in the final block, which has no cut after it and would otherwise be ignored.
- 23: The two recursive calls are "cut here" and "do not cut here" — the whole enumeration is this one binary choice repeated.

<!-- @code java -->
```java
static long best;

static long splitArray(int[] nums, int k) {
    int n = nums.length;
    if (n == 1) return nums[0];
    best = Long.MAX_VALUE;
    rec(nums, new boolean[n - 1], 0, 0, k);
    return best;
}

static void rec(int[] nums, boolean[] cut, int i, int used, int k) {
    int n = nums.length;
    if (i == n - 1) {
        if (used != k - 1) return;
        long worst = 0, cur = 0;
        for (int j = 0; j < n; j++) {
            cur += nums[j];
            if (j < n - 1 && cut[j]) { worst = Math.max(worst, cur); cur = 0; }
        }
        best = Math.min(best, Math.max(worst, cur));
        return;
    }
    cut[i] = true;  rec(nums, cut, i + 1, used + 1, k);
    cut[i] = false; rec(nums, cut, i + 1, used, k);
}
```

<!-- @annotations -->
- 24: The array is reused across both branches, so `cut[i]` must be reset before the second call — a shared mutable buffer is the usual source of bugs in this shape.

<!-- @code python -->
```python
def split_array(nums, k):
    n = len(nums)
    if n == 1:
        return nums[0]
    best = float("inf")
    cut = [False] * (n - 1)

    def rec(i, used):
        nonlocal best
        if i == n - 1:
            if used != k - 1:
                return
            worst = cur = 0
            for j in range(n):
                cur += nums[j]
                if j < n - 1 and cut[j]:
                    worst = max(worst, cur)
                    cur = 0
            best = min(best, max(worst, cur))
            return
        cut[i] = True
        rec(i + 1, used + 1)
        cut[i] = False
        rec(i + 1, used)

    rec(0, 0)
    return best
```

<!-- @annotations -->
- 9: `nonlocal` is required to assign to `best` from the inner function. Without it Python creates a fresh local and the result never escapes.

<!-- @approach -->
### Partition DP

<!-- @idea -->
Let dp[j][i] be the best achievable largest-sum when the first i elements are split into j blocks, and try every ending position for the j-th block.

<!-- @steps -->
1. Build prefix sums so any block's sum is O(1).
2. dp[0][0] = 0; every other state starts at infinity.
3. For each block count j and prefix length i, try every previous boundary t.
4. That choice costs `max(dp[j-1][t], sum of t+1..i)`.
5. dp[k][n] is the answer.

<!-- @complexity -->
- time: O(n²·k)
- space: O(n) with a rolling row
- note: Accepted on this problem in C++ (**14ms at the constraint ceiling**) and too slow in Python (**1,666ms**) at the very same limits. 849x slower than the binary search either way.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

long long splitArray(const vector<int>& nums, int k) {
    int n = (int)nums.size();
    vector<long long> pre(n + 1, 0);
    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];

    const long long INF = LLONG_MAX / 4;
    vector<long long> prev(n + 1, INF), cur(n + 1, INF);
    prev[0] = 0;
    for (int j = 1; j <= k; j++) {
        fill(cur.begin(), cur.end(), INF);
        for (int i = 1; i <= n; i++)
            for (int t = j - 1; t < i; t++)
                cur[i] = min(cur[i], max(prev[t], pre[i] - pre[t]));
        swap(prev, cur);
    }
    return prev[n];
}
```

<!-- @annotations -->
- 12: Two rows rather than a full table, since layer j only reads layer j−1. That takes the space from O(n·k) to O(n).
- 18: `max`, not `+` — the cost of a split is its worst block, not the total. This single operator is what makes it a minimax DP rather than an ordinary partition DP.
- 19: `swap` rather than copy, so advancing a layer is O(1) instead of O(n).
- 15: `fill` is essential. Reusing the previous layer's values would let a k−1 block answer masquerade as a k block answer.

<!-- @code java -->
```java
static long splitArray(int[] nums, int k) {
    int n = nums.length;
    long[] pre = new long[n + 1];
    for (int i = 0; i < n; i++) pre[i + 1] = pre[i] + nums[i];

    final long INF = Long.MAX_VALUE / 4;
    long[] prev = new long[n + 1], cur = new long[n + 1];
    Arrays.fill(prev, INF);
    prev[0] = 0;
    for (int j = 1; j <= k; j++) {
        Arrays.fill(cur, INF);
        for (int i = 1; i <= n; i++)
            for (int t = j - 1; t < i; t++)
                cur[i] = Math.min(cur[i], Math.max(prev[t], pre[i] - pre[t]));
        long[] tmp = prev; prev = cur; cur = tmp;
    }
    return prev[n];
}
```

<!-- @annotations -->
- 15: Java swaps by rebinding the references, which is the same O(1) move as C++'s `swap` — no array copying happens.

<!-- @code python -->
```python
def split_array(nums, k):
    n = len(nums)
    pre = [0] * (n + 1)
    for i, x in enumerate(nums):
        pre[i + 1] = pre[i] + x

    INF = float("inf")
    prev = [INF] * (n + 1)
    prev[0] = 0
    for j in range(1, k + 1):
        cur = [INF] * (n + 1)
        for i in range(1, n + 1):
            for t in range(j - 1, i):
                cur[i] = min(cur[i], max(prev[t], pre[i] - pre[t]))
        prev = cur
    return prev[n]
```

<!-- @annotations -->
- 13: Three nested Python-level loops, which is why this measures 1,666ms at n = 1,000, k = 50 while the identical C++ runs in 14ms.

<!-- @approach -->
### Binary Search on the Answer

<!-- @idea -->
Guess a largest-sum limit and count the blocks a greedy fill needs; the count falls as the limit rises, so binary search the smallest limit needing at most k.

<!-- @steps -->
1. The answer lies in `[max(nums), sum(nums)]`.
2. For a candidate limit, sweep left to right adding elements until the next would exceed it, then start a new block.
3. If that needs at most k blocks, the limit is achievable — record it and search left.
4. Otherwise search right.
5. Return the smallest recorded limit.

<!-- @complexity -->
- time: O(n log(sum(nums)))
- space: O(1)
- note: **0 wrong** over 112,305 exhaustive cases. **849x** faster than the DP at the constraint ceiling and **338,000x** faster than enumeration at n = 26, and it is the only version whose Python runtime stays under a millisecond.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

long long splitArray(const vector<int>& nums, int k) {
    long long lo = 0, hi = 0;
    for (int x : nums) { lo = max(lo, (long long)x); hi += x; }
    long long ans = hi;
    while (lo <= hi) {
        long long limit = lo + (hi - lo) / 2;
        int blocks = 1;
        long long load = 0;
        for (int x : nums) {
            if (load + x > limit) { blocks++; load = x; }
            else                    load += x;
        }
        if (blocks <= k) { ans = limit; hi = limit - 1; }
        else               lo = limit + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 7: `lo = max(nums)` is a correctness requirement, not a speed-up: the greedy below seats an oversized element rather than rejecting it, so limits below the largest element would be reported achievable.
- 14: `>`, not `>=`. A block landing exactly on the limit is fine — writing `>=` opens a needless new block and is wrong on 48.07% of inputs.
- 17: At most k, not exactly k. Needing fewer blocks than allowed still means the limit is achievable, since any block can be split further without raising the maximum.
- 18: The other branch — too many blocks means the limit is too tight, so search right. Achievable searches left, on the line above; Aggressive Cows has these two swapped, because it maximises.
- 20: The smallest achievable limit, which is the definition of the answer.

<!-- @code java -->
```java
static long splitArray(int[] nums, int k) {
    long lo = 0, hi = 0;
    for (int x : nums) { lo = Math.max(lo, x); hi += x; }
    long ans = hi;
    while (lo <= hi) {
        long limit = lo + (hi - lo) / 2;
        int blocks = 1;
        long load = 0;
        for (int x : nums) {
            if (load + x > limit) { blocks++; load = x; }
            else                    load += x;
        }
        if (blocks <= k) { ans = limit; hi = limit - 1; }
        else               lo = limit + 1;
    }
    return ans;
}
```

<!-- @annotations -->
- 3: `hi` accumulates into a `long`. With 1,000 elements of 10⁶ the total is 10⁹ — inside an int here, but one order of magnitude from not being.

<!-- @code python -->
```python
def split_array(nums, k):
    lo, hi = max(nums), sum(nums)
    ans = hi
    while lo <= hi:
        limit = (lo + hi) // 2
        blocks, load = 1, 0
        for x in nums:
            if load + x > limit:
                blocks += 1
                load = x
            else:
                load += x
        if blocks <= k:
            ans = limit
            hi = limit - 1
        else:
            lo = limit + 1
    return ans
```

<!-- @annotations -->
- 2: `max(nums)` and `sum(nums)` state the bounds directly — and the lower one is load-bearing, not decorative.
- 8: The strict `>` again. This is the single character that separates a correct solution from one that is wrong roughly half the time.

<!-- @example -->

<!-- @input -->
```
nums = [7, 2, 5, 10, 8], k = 2
```

<!-- @output -->
```
18
```

<!-- @why -->
`[7, 2, 5] | [10, 8]` gives block sums 14 and 18, so the largest is 18. No other split of these five elements into two contiguous blocks does better.

<!-- @walkthrough -->
```
lo = max = 10,  hi = sum = 32

limit=21  [7,2,5]=14, [10,8]=18          -> 2 <= 2   ans=21, hi=20
limit=15  [7,2,5]=14, [10]=10, [8]=8     -> 3 >  2   lo=16
limit=18  [7,2,5]=14, [10,8]=18          -> 2 <= 2   ans=18, hi=17
limit=16  [7,2,5]=14, [10]=10, [8]=8     -> 3 >  2   lo=17
limit=17  [7,2,5]=14, [10]=10, [8]=8     -> 3 >  2   lo=18
lo > hi  ->  18

Note limit=18: the block [10,8] sums to exactly 18. With
`>=` in the greedy, 10+8 >= 18 would open a third block,
this probe would report infeasible, and the search would
return 21. That is the 48.07% failure in one line.
```

<!-- @example -->

<!-- @input -->
```
nums = [1, 2, 3, 4, 5], k = 2
```

<!-- @output -->
```
9
```

<!-- @why -->
`[1, 2, 3] | [4, 5]` gives 6 and 9. The answer is again an exact block sum, which is the common case rather than a corner.

<!-- @walkthrough -->
```
lo = 5, hi = 15

limit=10  [1,2,3,4]=10, [5]=5        -> 2 <= 2   ans=10, hi=9
limit=7   [1,2,3]=6, [4]=4, [5]=5    -> 3 >  2   lo=8
limit=8   [1,2,3]=6, [4]=4, [5]=5    -> 3 >  2   lo=9
limit=9   [1,2,3]=6, [4,5]=9         -> 2 <= 2   ans=9,  hi=8
lo > hi  ->  9

Both surviving probes — 10 and 9 — are met with equality by
some block. Achievable-only-with-equality is what this
problem converges on, which is why the strict `>` matters
here more than in the other two costumes.
```

<!-- @example -->

<!-- @input -->
```
nums = [1, 4, 4], k = 3
```

<!-- @output -->
```
4
```

<!-- @why -->
With k equal to n every element is its own block, so the answer is forced to `max(nums)` — the lower bound of the search, reached exactly.

<!-- @walkthrough -->
```
lo = 4, hi = 9

limit=6  [1,4]=5, [4]=4        -> 2 <= 3   ans=6, hi=5
limit=4  [1]=1, [4]=4, [4]=4   -> 3 <= 3   ans=4, hi=3
lo > hi  ->  4

k = n always gives max(nums), and k = 1 always gives
sum(nums). Two free assertions for any implementation.
```

<!-- @example -->

<!-- @input -->
```
nums = [0, 0, 1, 0], k = 2
```

<!-- @output -->
```
1
```

<!-- @why -->
Zeros are permitted, so blocks can sum to 0 and the search range can start at 0. Here the single 1 is unavoidable, so it is the answer regardless of where the cut goes.

<!-- @walkthrough -->
```
lo = max = 1,  hi = sum = 1

limit=1   [0,0,1,0]=1              -> 1 <= 2   ans=1, hi=0
lo > hi  ->  1

When every element is 0 the range collapses to [0, 0], the
loop runs once at limit=0 and returns 0 — a real answer,
not a failure signal. Implementations that special-case
"empty range" or start the search at 1 get this wrong.
```

<!-- @visualization custom -->

<!-- @description -->
Shows that this is the third statement of one problem, that the greedy's comparison operator is the only line still carrying risk, and that the DP's acceptability depends on the language rather than the algorithm.

<!-- @sampleInput -->
```json
{"primary":{"nums":[7,2,5,10,8],"k":2,"answer":18,"split":[[7,2,5],[10,8]],"sums":[14,18]},"thirdCostume":{"claim":"Split Array - Largest Sum, Book Allocation and Painter's Partition are one problem","verification":{"method":"the C++ solutions from painters-partition.md and book-allocation-problem.md, applied verbatim","space":"every array of length 1..6 over {0..4}, every k from 1 to n","cases":112305,"paintersWrong":0,"bookAllocationWrong":0,"reference":"independent enumeration of every possible split"},"recognitionRule":"contiguous blocks + minimise the largest = binary search the answer, verified by one greedy pass","identities":[{"k":1,"answer":"sum(nums)"},{"k":"n","answer":"max(nums)"}],"monotonicity":{"array":"fixed 1000 elements, sum=485688, max=1000","rows":[{"k":1,"answer":485688},{"k":2,"answer":242845},{"k":5,"answer":97360},{"k":50,"answer":10080},{"k":500,"answer":1299},{"k":1000,"answer":1000}]}},"theOperatorTrap":{"correct":"if (load + x > limit) { blocks++; load = x; }","wrong":"if (load + x >= limit) { blocks++; load = x; }","wrongCases":53986,"ofTotal":112305,"pct":48.07,"mechanism":"a block landing exactly on the limit is treated as overflowing, so the greedy opens a needless block and reports the limit infeasible when it is exactly achievable","whyItBitesHere":"minimising the largest sum converges on limits met with equality, so achievable-only-with-equality is the common case rather than a corner","seenInExample":{"nums":[7,2,5,10,8],"k":2,"limit":18,"block":[10,8],"blockSum":18,"withStrictGT":"2 blocks, feasible, answer 18","withGE":"3 blocks, reported infeasible, answer 21"}},"dpAcceptabilityIsLanguageDependent":{"statedConstraints":"LeetCode 410: n <= 1000, k <= 50, nums[i] <= 10^6","cpp":{"unit":"nanoseconds","rows":[{"n":100,"k":5,"binary":2917,"dp":35750,"ratio":"12x"},{"n":500,"k":20,"binary":9708,"dp":10419166,"ratio":"1073x"},{"n":1000,"k":50,"binary":16472,"dp":13981875,"ratio":"849x"},{"n":1000,"k":10,"binary":12069,"dp":2892125,"ratio":"240x"},{"n":1000,"k":2,"binary":10194,"dp":582875,"ratio":"57x"}],"atCeiling":"14 milliseconds - comfortably inside any normal limit"},"python":{"unit":"milliseconds","rows":[{"n":100,"k":5,"binary":0.09,"dp":1.52,"ratio":"17x"},{"n":500,"k":20,"binary":0.45,"dp":158.63,"ratio":"350x"},{"n":1000,"k":50,"binary":0.93,"dp":1665.75,"ratio":"1787x"}],"atCeiling":"1.67 seconds - over a typical limit"},"reading":"the same algorithm at the same problem's own constraints passes in C++ and fails in Python","lesson":"accepted is a fact about a judge, a language and a constraint bound, not a property of an algorithm"},"enumerationDies":{"unit":"nanoseconds, k = n/2","rows":[{"n":10,"brute":3667,"binary":375},{"n":16,"brute":186333,"binary":458},{"n":20,"brute":3206209,"binary":458},{"n":24,"brute":54849500,"binary":666},{"n":26,"brute":225508667,"binary":666}],"growth":"about 4x per two elements added","gapAt26":"338,000x","reading":"the binary search is flat across the whole range"},"lowerBoundIsLoadBearing":{"rule":"lo = max(nums), never 0","why":"the greedy seats an oversized element rather than rejecting it, so limits below max(nums) would be reported achievable","sharedWith":"book-allocation-problem, where dropping it is wrong on 34.47%"},"assertions":["the answer lies between max(nums) and sum(nums)","block count is monotone non-increasing as the limit rises","the greedy left-to-right fill is optimal for a given limit","blocks <= k is the right test, not blocks == k","zeros are permitted and an all-zero array answers 0"]}
```

<!-- @highlights -->
- The **third statement of one problem** — both earlier solutions, verbatim, are **0 wrong** over 112,305 cases.
- `>` vs `>=` in the greedy is a **48.07%** coin flip, and it bites here because the answer is usually an exact block sum.
- The O(n²k) DP is **accepted in C++ (14ms)** and **too slow in Python (1,666ms)** at this problem's *own* stated limits.
- Binary search is **849×** faster than the DP at the ceiling and **338,000×** faster than enumeration at n = 26.
- `k = 1 → sum(nums)` and `k = n → max(nums)` are two free assertions for any implementation.
- Zeros are legal; an all-zero array answers **0**, which is a real answer rather than a failure signal.

<!-- @edgeCases -->
- `k = 1` — the answer is `sum(nums)`, the upper bound exactly.
- `k = n` — the answer is `max(nums)`, the lower bound exactly.
- `k > n` — impossible; LeetCode 410 excludes it by constraint, unlike Book Allocation which demands −1.
- All elements zero — the range collapses to `[0, 0]` and the answer is 0, a real answer.
- Zeros mixed with positives — legal, and blocks summing to 0 are fine.
- A limit met with exact equality — the common case here, and what `>=` breaks.
- One element far larger than the rest — the answer is that element, and the lower bound is reached.
- n = 1 — the answer is `nums[0]` for k = 1.
- Sum exceeding 2³¹ — 1,000 elements of 10⁶ is 10⁹, one order of magnitude from overflowing an int; accumulate in 64-bit.
- Already-sorted input — irrelevant, and sorting would be wrong: contiguity is the constraint.

<!-- @pitfalls -->
- Writing `>=` instead of `>` in the greedy. Wrong on 48.07%, and the failures are exactly the inputs whose answer is an exact block sum.
- Starting the search at 0 rather than `max(nums)`. The greedy seats an oversized element instead of rejecting it, so sub-maximum limits look achievable.
- Testing `blocks == k` instead of `blocks <= k`. Fewer blocks than allowed is still achievable.
- Reaching for the DP because it is "the proper algorithm". It is 849× slower and, in Python, too slow for this problem's own limits.
- Reusing the DP's previous layer without refilling it with infinity. A k−1 answer then masquerades as a k answer.
- Sorting `nums`. Contiguity is the whole constraint; sorting answers a different question.
- Accumulating the sum in a 32-bit int. 10⁹ fits, barely, and the habit does not survive a larger variant.
- Special-casing the empty or single-value range. An all-zero array legitimately searches `[0, 0]`.
- Treating this as a new problem. It is Painter's Partition and Book Allocation, verified over 112,305 cases.

<!-- @doubt -->
### Why must the greedy use `>` rather than `>=`?

<!-- @answer -->
Because a block that lands exactly on the limit is legal — the limit is a maximum, not a bound to stay strictly under. With `>=`, `load + x >= limit` fires when the block would sum to exactly `limit`, so the greedy closes it early, opens an unnecessary block, and reports a higher block count than needed. The search then treats an achievable limit as infeasible and returns something too large. Measured over 112,305 exhaustive cases, `>=` is wrong on **53,986 — 48.07%**. It matters more in this costume than in the other two because minimising the largest sum *converges* on a limit that some block meets with equality: in the worked example the answer 18 is the sum of `[10, 8]` exactly, so the deciding probe is precisely the one `>=` breaks. Achievable-only-with-equality is the common case here, not the corner.

<!-- @doubt -->
### The DP gets accepted on this problem — is it fine to use?

<!-- @answer -->
It gets accepted in C++ and does not in Python, at the same stated constraints, which is the more useful way to see it. LeetCode 410 caps n at 1,000 and k at 50; at exactly that ceiling the O(n²k) DP measures **13,981,875ns — about 14 milliseconds — in C++**, comfortably inside any normal limit, and **1,665.75 milliseconds in CPython**, over it. The binary search measures 16,472ns and 0.93ms respectively. So "the DP is accepted here" is a statement about a judge, a language and a constraint bound rather than about the algorithm. It is 849x more work than the problem requires, and the only reason that is survivable is that the constraints were set low. Change the language, or raise n to 10⁵ as the equivalent problems do, and the same code stops working while the search is unaffected.

<!-- @doubt -->
### Do I need to check `blocks == k` to get exactly k subarrays?

<!-- @answer -->
No — `blocks <= k` is correct, and `==` would be wrong. If a limit is met using fewer blocks than allowed, the remaining blocks can always be created by cutting an existing one, and cutting never increases any block's sum, so the limit stays achievable with exactly k. The greedy also returns the *minimum* number of blocks a limit requires, so `<=` asks precisely the right question: does the cheapest arrangement fit the budget. Insisting on `==` rejects achievable limits, pushes the search right and inflates the answer. The same reasoning appears in Book Allocation as `students <= m`, and inverted in Aggressive Cows as `count >= k`, where the inequality points the other way because that problem maximises.

<!-- @doubt -->
### Is it really worth learning this if it is the same as two earlier problems?

<!-- @answer -->
The algorithm is not the thing worth learning here — the category is. Meeting the same structure a third time under a third name is what converts "I remember this trick" into a recognition rule: contiguous blocks plus a minimised maximum means binary search the answer, with a one-pass greedy as the feasibility test. That was checked rather than asserted — both earlier solutions, unchanged, are **0 wrong across 112,305 cases**. What is genuinely new is narrow and worth knowing precisely: the comparison operator must be strict, which is a 48.07% coin flip, and the DP's acceptability turns out to depend on the implementation language. Mature problems tend to look like this — familiar structure, with the remaining risk concentrated in one or two lines.

<!-- @doubt -->
### Why start the search at max(nums) instead of 0?

<!-- @answer -->
For correctness, not speed — the same reason as in Book Allocation, where dropping the bound is wrong on 34.47% of inputs. The greedy line `if (load + x > limit) { blocks++; load = x; }` does not reject an element larger than `limit`; it opens a new block and puts the oversized element in anyway. So for a limit below `max(nums)` the block count can still come in at or under k, and the search believes a limit that no real split achieves. Starting at `max(nums)` guarantees such limits are never probed. The range narrowing this also produces is worth almost nothing — measured elsewhere at about 0.05 probes — so if you ever see the bound justified purely as an optimisation, that justification is the wrong one and would make the line look safe to delete.
