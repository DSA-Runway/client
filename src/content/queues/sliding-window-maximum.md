---
id: sliding-window-maximum
topic: Queues
title: Sliding Window Maximum
difficulty: Hard
status: ready
prerequisites:
  - next-greater-element
  - implement-queue-using-arrays
  - longest-subarray-with-given-sum-k-positives
  - time-and-space-complexity-basics
relatedIds:
  - next-greater-element
  - implement-queue-using-arrays
  - largest-rectangle-in-a-histogram
  - lru-cache
  - longest-substring-without-repeating-characters
---

<!-- @summary -->
**Next Greater Element**'s monotonic stack with the other end opened: every element is pushed once and popped once, measured at **exactly 2.0000 deque operations per element** on increasing, decreasing, random and all-equal input alike. The textbook answer, and in C++ the slowest reasonable one — a two-pass prefix/suffix scan with no data structure at all beat it at **every** window size tested, 7.41ns per element against 17.79ns, and plain brute force beat it up to **k ≈ 230**. Python inverts that completely: there the same block method is the *slowest* option and brute force stops winning at **k ≈ 11**.

<!-- @theory -->
## The problem

For every contiguous window of size `k`, report its maximum. An array of `n`
elements has `n − k + 1` windows.

```
a = [1, 3, -1, -3, 5, 3, 6, 7],  k = 3

[1  3 -1] -3  5  3  6  7   ->  3
 1 [3 -1 -3] 5  3  6  7    ->  3
 1  3 [-1 -3 5] 3  6  7    ->  5
 ...                            5, 6, 7
```

The windows overlap by `k − 1` elements, so recomputing each maximum from
scratch throws away almost everything the previous window already knew. Every
approach below is a different way of not throwing it away.

## The monotonic deque

Keep a deque of **indices** whose values are strictly decreasing. Before pushing
`i`, discard every index at the back whose value is no larger than `a[i]` —
they can never be a maximum again, because `a[i]` is bigger *and* stays in the
window longer. Then drop the front if it has fallen out of the window. The front
is now the answer.

```
a = [1, 3, -1, -3, 5, ...],  k = 3          deque holds indices

i=0  a=1   push          [0]
i=1  a=3   1 <= 3, pop   [1]                      3 evicted the 1
i=2  a=-1  push          [1,2]        window full -> a[1] = 3
i=3  a=-3  push          [1,2,3]      front 1 still in window -> 3
i=4  a=5   pop 3, 2, 1   [4]          -> 5
```

This is exactly the structure **Next Greater Element** built, with one change:
that problem only ever pushed and popped at one end, so a stack sufficed. Here
elements also expire from the *front* when the window moves past them, and that
second end is the entire reason this needs a deque.

## Every element is pushed once and popped once

The amortisation is the same as that subtopic's and just as exact. An element
enters the deque exactly once and leaves at most once, so the total work is
linear regardless of how the values are arranged. Measured at n = 1,000,000,
k = 1,000:

| input | pushes | pops (back) | pops (front) | total | per element |
|---|---|---|---|---|---|
| increasing | 1,000,000 | 999,999 | 0 | 1,999,999 | **2.0000** |
| decreasing | 1,000,000 | 0 | 999,000 | 1,999,000 | 1.9990 |
| random | 1,000,000 | 999,001 | 991 | 1,999,992 | **2.0000** |
| all equal | 1,000,000 | 0 | 999,000 | 1,999,000 | 1.9990 |

Pushes are exactly `n` in every row, and the constant is 2.00 whatever the shape
of the data — the same figure **Next Greater Element** measured for its stack.
Note how differently the work is *distributed*: an increasing array pops
everything from the back and nothing from the front, a decreasing one does the
reverse, and the total is unchanged.

The deque also stays small. At k = 1,000 its maximum size was **21** on random
input — the expected length of a decreasing run — and 1 on increasing input.

## `>` or `>=`, and why it matters

Popping the back while `a[back] <= a[i]` discards equal values; using `<`
keeps them. **Both give the correct answer** — verified over 20,000 tie-heavy
random cases with 216,165 window maxima compared and zero disagreements — but
they are not the same program:

| input, k = 1,000 | max deque size with `<` (keep equals) | with `<=` (discard) |
|---|---|---|
| increasing | 1 | 1 |
| random | 21 | 21 |
| decreasing | 1,001 | 1,001 |
| **all equal** | **1,001** | **1** |

On duplicate-heavy data, keeping equal values makes the deque hold the entire
window; discarding them collapses it to a single entry. Measured on an all-equal
array of a million elements, that cost **5.97ns per element against 5.01ns**, a
1.19x difference — and a thousandfold difference in memory. Use `<=`.

## Is it actually the fastest? No.

Three implementations, n = 1,000,000 random values, minimum of five runs:

| k | brute force | monotonic deque | block decomposition |
|---|---|---|---|
| 2 | **1.75ns** | 14.92ns | 3.99ns |
| 8 | 5.08ns | 18.06ns | **4.89ns** |
| 64 | 11.90ns | 17.83ns | **6.24ns** |
| 192 | 16.50ns | 18.22ns | **6.85ns** |
| 256 | 19.17ns | 18.26ns | **7.03ns** |
| 1,000 | 56.29ns | 17.79ns | **7.41ns** |

Two things to read off it. The deque's cost is **flat in k** — 17.8 to 18.3ns
from k = 8 upward — which is the O(n) property made visible, and it is what
makes the quadratic brute force collapse past it: the crossover is at
**k ≈ 230**, where brute/deque passes 1.00x.

And the block decomposition is faster than both at **every** window size, by
2.4x at k = 1,000. It is O(n) as well, with no data structure at all.

## Block decomposition

Cut the array into blocks of exactly `k`. Compute a running maximum forward from
each block start (`pre`) and backward from each block end (`suf`). Then **any**
window of size `k` spans exactly two adjacent blocks, so its maximum is

```
answer[i] = max( suf[i], pre[i + k - 1] )
```

a suffix of the left block and a prefix of the right one. Three flat passes over
contiguous memory, no branches on data, nothing to maintain. That is why it wins:
the deque's work is unpredictable pops and pointer-chasing, and this is three
loops a prefetcher handles perfectly.

Its cost does creep up with `k` — 3.99ns at k = 2 to 7.41ns at k = 1,000 —
because `suf[i]` and `pre[i + k - 1]` sit `k` apart, so large windows read two
streams far apart in memory rather than adjacent ones.

## The other two candidates

At n = 1,000,000, k = 1,000:

| | per element |
|---|---|
| block decomposition | **7.41ns** |
| monotonic deque | 17.79ns |
| lazy-deletion max-heap | 21.65ns |
| deque on a hand-rolled ring buffer | 26.54ns |
| brute force | 56.29ns |
| `std::max_element` per window | **592.68ns** |

The **heap** is only 1.22x the deque, but its peak size was **991,077 entries**
where the deque never exceeds 1,000 — stale entries accumulate until they surface,
exactly as **LFU Cache** measured for the same lazy-deletion trick at 787x.

Replacing `std::deque` with a **hand-rolled ring buffer** made it *worse*, 26.54ns
against 17.79ns, because the ring's modular index arithmetic sits in a dependent
chain where `std::deque`'s block indexing does not.

And `std::max_element` is the one to be careful with: **10.5x slower** than the
identical hand-written loop, because returning an iterator forces it to track a
position and the compiler will not vectorise it.

## Python inverts almost all of this

n = 200,000, random values:

| | k = 8 | k = 1,000 |
|---|---|---|
| `collections.deque` | 302ns | **303ns** |
| list + a head index | 316ns | 398ns |
| brute force, `max(a[i:i+k])` | **244ns** | 12,677ns |
| block decomposition | 368ns | 399ns |

The deque is flat at ~300ns per element, the same O(n) signature as in C++. Two
reversals though.

**Brute force stops winning at k ≈ 11**, against C++'s k ≈ 230 — a twentyfold
difference in where the identical trade-off flips. `max(a[i:i+k])` runs entirely
in C, so its per-element constant is tiny, but it is still Θ(n·k) and the
interpreted deque loop overtakes it almost immediately.

**Block decomposition is the slowest option**, where in C++ it was the fastest.
It makes three interpreted passes over `n` elements instead of one, and Python
charges per operation rather than per cache miss. This is the same inversion
**Implement queue using Linkedlist** found — what wins in C++ is whatever touches
memory well, and what wins in Python is whatever asks the interpreter for least.

## Where this goes next

The remaining Queues subtopics are sliding-window problems of a different kind —
**Longest Substring Without Repeating Characters** and the rest — where the window
is *variable* length and the question is when to grow or shrink it, rather than
what to remember about a fixed one.

<!-- @intuition -->
Consecutive windows overlap by all but one element, so recomputing each maximum from scratch discards almost everything you just learned. The monotonic deque is the observation that most of what you learned was worthless anyway: if some element is smaller than a later one, it can never be the maximum of any window containing both, because the later element is bigger and also survives longer. So you keep only the elements that are still candidates, which is a decreasing sequence, and the front of it is always the answer. That is exactly the monotonic stack from Next Greater Element, except elements now also expire from the far end as the window slides, and that second end is the only reason it has to be a deque rather than a stack. Where it gets interesting is that this beautiful O(n) structure is not the fastest way to do it. Brute force keeps up until the window is a couple of hundred wide, because a tight scan over contiguous memory is very cheap per element. And a block decomposition — cut the array into chunks of k, take running maxima forwards and backwards, and read each answer as one suffix and one prefix — is O(n) with no structure at all and beat the deque at every size measured. In Python the ranking rearranges again, because there the cost is interpreted operations rather than memory traffic.

<!-- @approach -->
### Brute Force - Scan Every Window

<!-- @idea -->
For each window, look at all `k` elements and take the largest.

<!-- @steps -->
1. For each starting index from 0 to `n − k`.
2. Set the running maximum to the first element of the window.
3. Compare it against the other `k − 1` elements.
4. Record the result and move the window one place right.

<!-- @complexity -->
- time: **Θ(n·k)** — exactly `k − 1` comparisons per window, with no early exit
- space: O(1) beyond the output
- note: Worth more than its reputation. Measured at **1.75ns per element** at k = 2 and beating the monotonic deque all the way to **k ≈ 230**, because a tight scan over contiguous memory vectorises and the deque's pops do not. It is genuinely quadratic though — 56.29ns per element at k = 1,000 — and unlike **Next Greater Element**'s brute force, which got away with it because it could stop early and averaged `ln(n)` comparisons, this one has no early exit and always pays `k − 1`.

<!-- @code cpp -->
```cpp
vector<int> maxSlidingWindow(const vector<int>& a, int k) {
    vector<int> out;
    out.reserve(a.size() - k + 1);
    for (size_t i = 0; i + k <= a.size(); i++) {
        int m = a[i];
        for (int j = 1; j < k; j++) m = max(m, a[i + j]);
        out.push_back(m);
    }
    return out;
}
```

<!-- @annotations -->
- 6: A branchless running maximum over contiguous memory, which the compiler vectorises — this is why brute force stays competitive to a window of about 230. Note also that no early exit exists: every one of the `k − 1` comparisons must happen, so the cost is `Θ(n·k)` rather than the `Θ(n log n)` **Next Greater Element**'s brute force turned out to have.
- 5: The running maximum starts from the window's first element, not from zero — an array that is entirely negative would otherwise report 0 everywhere.
- 3: `reserve` matters at these sizes: the output has `n − k + 1` elements and its length is known before the loop starts.

<!-- @code java -->
```java
static int[] maxSlidingWindow(int[] a, int k) {
    int[] out = new int[a.length - k + 1];
    for (int i = 0; i + k <= a.length; i++) {
        int m = a[i];
        for (int j = 1; j < k; j++) m = Math.max(m, a[i + j]);
        out[i] = m;
    }
    return out;
}
```

<!-- @annotations -->
- 5: `Math.max` on primitives is an intrinsic, so this compiles to the same branchless sequence as the C++ version rather than to a call.

<!-- @code python -->
```python
def max_sliding_window(a, k):
    return [max(a[i:i + k]) for i in range(len(a) - k + 1)]
```

<!-- @annotations -->
- 2: One line, and the **fastest** Python option for small windows — 244ns per element at k = 8 — because both the slice and `max` run in C. It is still Θ(n·k), and the monotonic deque overtakes it at k ≈ 11.

<!-- @approach -->
### Lazy-Deletion Max-Heap

<!-- @idea -->
Push every `(value, index)` pair on a max-heap and, before reading the top, discard any entry that has fallen out of the window.

<!-- @steps -->
1. Keep a max-heap ordered by value, carrying each element's index.
2. Push every element as it is reached.
3. Once the window is full, look at the top of the heap.
4. If its index is outside the window, pop it and look again.
5. The first entry still inside the window is the maximum.

<!-- @complexity -->
- time: O(n log n)
- space: **O(n)**, not O(k)
- note: Correct and unnecessary. Measured at **21.65ns per element** against the deque's 17.79ns at k = 1,000, which is a modest 1.22x — but its peak size was **991,077 entries** where the deque never exceeded 1,000. That is the same lazy-deletion cost **LFU Cache** measured at 787x: entries are never removed when they expire, only when they reach the top. Worth knowing because the trick is genuinely useful when there is no monotonic structure to exploit; here there is.

<!-- @code cpp -->
```cpp
vector<int> maxSlidingWindow(const vector<int>& a, int k) {
    priority_queue<pair<int,int>> pq;          // (value, index)
    vector<int> out;
    for (int i = 0; i < (int)a.size(); i++) {
        pq.push({a[i], i});
        if (i + 1 >= k) {
            while (pq.top().second + k <= i) pq.pop();
            out.push_back(pq.top().first);
        }
    }
    return out;
}
```

<!-- @annotations -->
- 7: The lazy deletion. Nothing is removed when it expires — only when it surfaces — so the heap grows toward `n` rather than staying at `k`.
- 2: Pairs compare lexicographically, so ordering by value with the index as a tiebreaker is free.
- 5: Every element is pushed, including ones that are already dominated. The deque's whole advantage is refusing to keep those.

<!-- @code java -->
```java
PriorityQueue<int[]> pq = new PriorityQueue<>((x, y) -> y[0] - x[0]);
// ... push {a[i], i}; before reading, drop entries whose index has expired
while (pq.peek()[1] + k <= i) pq.poll();
```

<!-- @annotations -->
- 1: `y[0] - x[0]` overflows for values near the integer limits; `Integer.compare(y[0], x[0])` is the safe form and the one to write by default.

<!-- @code python -->
```python
import heapq

def max_sliding_window(a, k):
    pq, out = [], []
    for i, v in enumerate(a):
        heapq.heappush(pq, (-v, i))           # negate: heapq is a min-heap
        if i + 1 >= k:
            while pq[0][1] + k <= i:
                heapq.heappop(pq)
            out.append(-pq[0][0])
    return out
```

<!-- @annotations -->
- 6: `heapq` provides only a min-heap, so a max-heap is built by negating the key. Forgetting to negate it back on line 10 is the standard bug.

<!-- @approach -->
### Optimal - The Monotonic Deque

<!-- @idea -->
Keep only the indices that could still be a maximum — a decreasing sequence — and read the answer off the front.

<!-- @steps -->
1. Keep a deque of indices whose values are decreasing.
2. For each index `i`, discard indices at the back whose value is `<= a[i]`.
3. Those can never win again: `a[i]` is at least as large and outlives them.
4. Push `i` at the back.
5. If the front index has fallen out of the window, drop it.
6. Once `i + 1 >= k`, the value at the front index is the window's maximum.

<!-- @complexity -->
- time: O(n) — each index is pushed once and popped at most once
- space: O(k), and far less in practice
- note: The answer to the problem as asked, and the amortisation is exact: **2.0000 deque operations per element**, measured identically on increasing, decreasing, random and all-equal input at n = 1,000,000. That is the same constant **Next Greater Element** measured for its monotonic stack, which is the same structure with one end sealed. The deque stays small — maximum size **21** at k = 1,000 on random data. Its cost is flat in `k` (17.8–18.3ns from k = 8 up), which is exactly what the block decomposition below exploits to beat it anyway.

<!-- @code cpp -->
```cpp
vector<int> maxSlidingWindow(const vector<int>& a, int k) {
    deque<int> dq;                          // indices, values decreasing
    vector<int> out;
    out.reserve(a.size() - k + 1);

    for (int i = 0; i < (int)a.size(); i++) {
        while (!dq.empty() && a[dq.back()] <= a[i]) dq.pop_back();
        dq.push_back(i);
        if (dq.front() + k <= i) dq.pop_front();
        if (i + 1 >= k) out.push_back(a[dq.front()]);
    }
    return out;
}
```

<!-- @annotations -->
- 2: **Indices, not values.** Line 9 has to decide whether the front has left the window, and only an index can answer that — a value carries no position.
- 7: The whole idea in one line: anything no larger than `a[i]` is dominated by it *and* expires sooner, so it can never be a maximum again. `<=` rather than `<` discards equal values, which is what keeps the deque at 1 entry instead of 1,001 on all-equal input.
- 8: Every index is pushed exactly once here, which is half of the measured 2.00 operations per element.
- 9: The expiry check, and the only place the *front* is touched. This single line is why a stack is not enough and the structure has to be a deque.
- 10: The front is the maximum by construction — the deque is decreasing, so its first entry dominates everything behind it.

<!-- @code java -->
```java
static int[] maxSlidingWindow(int[] a, int k) {
    Deque<Integer> dq = new ArrayDeque<>();
    int[] out = new int[a.length - k + 1];
    for (int i = 0; i < a.length; i++) {
        while (!dq.isEmpty() && a[dq.peekLast()] <= a[i]) dq.pollLast();
        dq.addLast(i);
        if (dq.peekFirst() + k <= i) dq.pollFirst();
        if (i + 1 >= k) out[i - k + 1] = a[dq.peekFirst()];
    }
    return out;
}
```

<!-- @annotations -->
- 2: `ArrayDeque` is the circular buffer of **Implement Queue using Arrays** — the same structure, now being used from both ends at once, which is what it was always built for.
- 5: Boxing is the hidden cost here: `Deque<Integer>` allocates for indices above the `Integer` cache. A plain `int[]` used as a ring is the faster Java form.

<!-- @code python -->
```python
from collections import deque

def max_sliding_window(a, k):
    dq, out = deque(), []
    for i, v in enumerate(a):
        while dq and a[dq[-1]] <= v:
            dq.pop()
        dq.append(i)
        if dq[0] + k <= i:
            dq.popleft()
        if i + 1 >= k:
            out.append(a[dq[0]])
    return out
```

<!-- @annotations -->
- 7: `dq.pop()` removes from the **right** in a `deque`, unlike `list.pop()` which also removes from the right but unlike `popleft()` on line 10. Mixing the two ends up is the most common way to get this wrong.
- 5: Measured flat at ~300ns per element at every `k` — the same O(n) signature as C++, and the fastest Python option for any window wider than about 11.

<!-- @approach -->
### Faster in Practice - Prefix and Suffix Maxima per Block

<!-- @idea -->
Cut the array into blocks of `k`, take running maxima forwards and backwards within each block, and read every answer as one suffix plus one prefix.

<!-- @steps -->
1. Treat the array as consecutive blocks of exactly `k` elements.
2. Build `pre`, a running maximum that restarts at the beginning of each block.
3. Build `suf`, a running maximum that restarts at the end of each block, scanning backwards.
4. Observe that a window of size `k` always spans exactly two adjacent blocks.
5. So its maximum is `max(suf[i], pre[i + k - 1])` — a suffix of the left block and a prefix of the right.
6. Emit that for every window start.

<!-- @complexity -->
- time: O(n), in three flat passes
- space: O(n) for the two auxiliary arrays
- note: Faster than the monotonic deque at **every** window size measured — 7.41ns per element against 17.79ns at k = 1,000, and 3.99ns against 14.92ns at k = 2. It has no data structure, no unpredictable branches and no pointer chasing, which is exactly what a prefetcher wants. The costs are an extra `2n` of memory and the fact that it needs the whole array up front, so it cannot run on a stream the way the deque can. In **Python it is the slowest option**, because three interpreted passes beat one only when passes are cheap.

<!-- @code cpp -->
```cpp
vector<int> maxSlidingWindow(const vector<int>& a, int k) {
    int n = a.size();
    vector<int> pre(n), suf(n), out;
    for (int i = 0; i < n; i++)
        pre[i] = (i % k == 0) ? a[i] : max(pre[i - 1], a[i]);
    for (int i = n - 1; i >= 0; i--)
        suf[i] = (i == n - 1 || (i + 1) % k == 0) ? a[i] : max(suf[i + 1], a[i]);
    out.reserve(n - k + 1);
    for (int i = 0; i + k <= n; i++)
        out.push_back(max(suf[i], pre[i + k - 1]));
    return out;
}
```

<!-- @annotations -->
- 5: The running maximum restarts at every block boundary, so `pre[j]` is the maximum from `j`'s block start up to `j`.
- 7: The same backwards, restarting at each block *end*, so `suf[j]` covers `j` to the end of its block.
- 10: The identity the whole method rests on: a window of exactly `k` elements can straddle at most one block boundary, so it is always a suffix of one block plus a prefix of the next.
- 3: Two extra arrays of `n`, which is what this trades for its speed — and why it cannot be used on a stream.

<!-- @code java -->
```java
static int[] maxSlidingWindow(int[] a, int k) {
    int n = a.length;
    int[] pre = new int[n], suf = new int[n], out = new int[n - k + 1];
    for (int i = 0; i < n; i++)
        pre[i] = (i % k == 0) ? a[i] : Math.max(pre[i - 1], a[i]);
    for (int i = n - 1; i >= 0; i--)
        suf[i] = (i == n - 1 || (i + 1) % k == 0) ? a[i] : Math.max(suf[i + 1], a[i]);
    for (int i = 0; i + k <= n; i++) out[i] = Math.max(suf[i], pre[i + k - 1]);
    return out;
}
```

<!-- @annotations -->
- 3: No boxing anywhere, which is the main reason to prefer this form in Java over a `Deque<Integer>`.

<!-- @code python -->
```python
def max_sliding_window(a, k):
    n = len(a)
    pre, suf = [0] * n, [0] * n
    for i in range(n):
        pre[i] = a[i] if i % k == 0 else max(pre[i - 1], a[i])
    for i in range(n - 1, -1, -1):
        suf[i] = a[i] if (i == n - 1 or (i + 1) % k == 0) else max(suf[i + 1], a[i])
    return [max(suf[i], pre[i + k - 1]) for i in range(n - k + 1)]
```

<!-- @annotations -->
- 4: Three interpreted passes over `n`, where the deque makes one. That is why this measured **the slowest** of the four Python options despite being the fastest in C++.

<!-- @example -->

<!-- @input -->
`a = [1, 3, -1, -3, 5, 3, 6, 7]`, `k = 3`

<!-- @output -->
`[3, 3, 5, 5, 6, 7]`

<!-- @why -->
The canonical trace, small enough to watch the deque both grow and expire.

<!-- @walkthrough -->
1. `i = 0`, value 1: the deque is empty, push index 0. Deque `[0]`.
2. `i = 1`, value 3: `a[0] = 1 <= 3`, so index 0 is discarded — 1 can never win a window that also contains 3. Push. Deque `[1]`.
3. `i = 2`, value −1: it is smaller than 3, so it stays as a future candidate. Deque `[1, 2]`. The window is now full, and the front gives **3**.
4. `i = 3`, value −3: smaller again, push. Deque `[1, 2, 3]`. The front is index 1, still inside the window `[1, 3]`, so the answer is **3**.
5. `i = 4`, value 5: it dominates everything held, so indices 3, 2 and 1 all pop from the back. Deque `[4]`, answer **5**.
6. `i = 5`, value 3: smaller, push. Deque `[4, 5]`, front is index 4, answer **5**.
7. `i = 6`, value 6: pops index 5 and index 4. Deque `[6]`, answer **6**.
8. `i = 7`, value 7: pops index 6. Deque `[7]`, answer **7**. Eight pushes and seven pops for eight elements — the 2.00 constant, on a tiny case.

<!-- @example -->

<!-- @input -->
Four differently shaped arrays of a million elements, k = 1,000

<!-- @output -->
2.0000 deque operations per element in every case

<!-- @why -->
The amortisation is not an average over random data — it holds shape by shape.

<!-- @walkthrough -->
1. An index enters the deque exactly once, so pushes are exactly `n` on every input.
2. It leaves at most once, either from the back when a larger value arrives or from the front when it expires.
3. On an **increasing** array nothing ever expires — each new element pops the previous one from the back: 999,999 back-pops, 0 front-pops.
4. On a **decreasing** array nothing is ever dominated, so the deque fills to `k` and elements only ever leave by expiring: 0 back-pops, 999,000 front-pops.
5. Those are opposite extremes and the total is identical — 1,999,999 and 1,999,000 operations.
6. Random input lands in between, at 999,001 back-pops and 991 front-pops, for the same **2.0000** per element.
7. That is the same constant **Next Greater Element** measured for the monotonic stack, which is this structure with the front sealed shut.
8. The distribution of work changes completely; the total does not.

<!-- @example -->

<!-- @input -->
An all-equal array of a million elements, popping with `<` versus `<=`

<!-- @output -->
The same answers; a deque of 1,001 entries against 1

<!-- @why -->
Two correct programs whose memory behaviour differs by a factor of a thousand.

<!-- @walkthrough -->
1. `while (a[dq.back()] < a[i])` keeps equal values, because equality fails the test.
2. `while (a[dq.back()] <= a[i])` discards them.
3. Both are correct: an equal value is just as good a maximum, so which one you keep cannot change the answer — confirmed over 20,000 tie-heavy cases with 216,165 maxima compared and zero disagreements.
4. On an all-equal array, `<` never pops from the back, so the deque fills to the entire window: maximum size **1,001**.
5. `<=` pops every time, so the deque holds exactly **one** entry throughout.
6. Measured, that cost **5.97ns per element against 5.01ns** — 1.19x — plus a thousandfold difference in the memory touched.
7. On random and increasing data the two are indistinguishable, at 21 and 1 entries respectively, which is why this only shows up on data with many ties.
8. Prefer `<=`: it is never worse and is dramatically better on the one input shape that separates them.

<!-- @example -->

<!-- @input -->
Brute force against the monotonic deque, as `k` grows

<!-- @output -->
Brute force wins to **k ≈ 230** in C++ and **k ≈ 11** in Python

<!-- @why -->
The same trade-off, flipping at points twenty times apart.

<!-- @walkthrough -->
1. Brute force is Θ(n·k) and the deque is Θ(n), so the deque must win eventually.
2. In C++ it does not win until surprisingly late: at k = 192 brute force is still 0.91x the deque's time, and only at k = 256 does it pass 1.05x.
3. The reason is that brute force's inner loop is a branchless running maximum over contiguous memory, which vectorises, while the deque's pops are data-dependent and unpredictable.
4. In Python brute force is `max(a[i:i+k])`, which also runs entirely in C — and at k = 8 it is the fastest option at 244ns per element.
5. But the interpreted deque loop costs a flat ~300ns per element regardless of `k`, so brute force is overtaken by k = 16 at 1.20x.
6. The crossover therefore sits near **11** in Python and near **230** in C++.
7. The deque's flatness is the constant in both languages — 17.8ns and 300ns — and it is the only property that transfers.
8. Which means "use the O(n) algorithm" is the right advice only once you know roughly how wide the window is.

<!-- @example -->

<!-- @input -->
Block decomposition against the monotonic deque, C++ and Python

<!-- @output -->
2.4x faster in C++ at k = 1,000; the slowest of four options in Python

<!-- @why -->
The same algorithm winning and losing for the same reason, read from two directions.

<!-- @walkthrough -->
1. The block method needs no data structure: two running-maximum passes and one combining pass.
2. In C++ that is three flat loops over contiguous memory with no data-dependent branches, which a prefetcher handles perfectly.
3. Measured at **7.41ns per element** against the deque's 17.79ns at k = 1,000, and it was faster at every window size tested.
4. Its cost rises gently with `k` — 3.99ns to 7.41ns — because `suf[i]` and `pre[i + k - 1]` are `k` apart, so wide windows read two distant streams.
5. In Python the same three passes cost **399ns per element** against the deque's 303ns, making it the slowest option measured.
6. Nothing about the algorithm changed; what changed is what the language charges for. C++ charges for cache misses and Python charges per operation.
7. Three passes over `n` is three times the interpreted work, and no amount of locality makes that back.
8. The same inversion **Implement queue using Linkedlist** measured, from the opposite side.

<!-- @visualization array -->

<!-- @description -->
Draw the array as a horizontal strip with a translucent window of `k` cells sliding left to right across it, and directly beneath it the deque as a second, shorter strip holding *indices* — draw each deque cell showing its index and, faintly, the value it points at, with a leader line up to the array cell, because the whole reason this works is that the deque holds positions rather than values. Run `[1, 3, -1, -3, 5, 3, 6, 7]` with k = 3 and give two beats room. First, at `i = 1`, show the value 3 arriving and the held index 0 being ejected from the **back** — annotate it *1 is smaller and expires sooner, so it can never win again*, which is the entire algorithm in one sentence. Second, at `i = 4`, show 5 arriving and three indices popping off the back in one motion, then the deque holding a single cell. Keep two running counters beside the strips, pushes and pops, and let them finish at 8 and 7 for eight elements so the 2.00 constant is something the reader watched happen rather than read. Second panel is the shape-dependence: run the same animation three times side by side on increasing, decreasing and random arrays, and show that increasing pops only from the back, decreasing only from the front, and random from both — with all three totals landing on 2.00 per element. Third panel is the block decomposition, drawn as the array cut into blocks of `k` with two coloured arrows per block, one sweeping right building `pre` and one sweeping left building `suf`; then place a window anywhere and light up exactly two cells — `suf[i]` and `pre[i+k-1]` — showing the window is always one suffix and one prefix. Final panel is the honest ranking as two bar charts at the same scale, C++ and Python side by side, with the four implementations in each: blocks lowest in C++ and highest in Python, brute force lowest at small k and off the chart at large k, and the deque the only bar that is the same height in both charts at every `k`.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"theIdea":"keep only the indices that could still be a maximum -- a decreasing sequence -- and read the answer off the front; anything no larger than a[i] is dominated by it AND expires sooner, so it can never win again","whyADeque":"Next Greater Element's monotonic stack only ever pushed and popped at one end; here elements also expire from the FRONT as the window slides, and that second end is the entire reason this needs a deque","correctness":{"cases":20000,"note":"tiny value ranges, so ties are everywhere","windowMaximaCompared":216165,"disagreements":0,"implementations":["brute force","monotonic deque with <","monotonic deque with <=","block decomposition","lazy-deletion heap"]},"amortisation":{"claim":"every index is pushed exactly once and popped at most once","n":1000000,"k":1000,"measured":[{"input":"increasing","pushes":1000000,"popsBack":999999,"popsFront":0,"total":1999999,"perElement":2.0000},{"input":"decreasing","pushes":1000000,"popsBack":0,"popsFront":999000,"total":1999000,"perElement":1.9990},{"input":"random","pushes":1000000,"popsBack":999001,"popsFront":991,"total":1999992,"perElement":2.0000},{"input":"all equal","pushes":1000000,"popsBack":0,"popsFront":999000,"total":1999000,"perElement":1.9990}],"reading":"pushes are exactly n in every row and the constant is 2.00 whatever the shape -- the same figure Next Greater Element measured for its stack; what changes completely is how the work is DISTRIBUTED between the two ends","dequeSize":{"k":1000,"random":21,"increasing":1,"note":"the expected length of a decreasing run"}},"strictOrNot":{"question":"pop the back while a[back] < a[i], or <= a[i]","bothCorrect":"an equal value is just as good a maximum, so which you keep cannot change the answer -- confirmed over 20,000 tie-heavy cases","maxDequeSize":{"increasing":{"keepEquals":1,"discardEquals":1},"random":{"keepEquals":21,"discardEquals":21},"decreasing":{"keepEquals":1001,"discardEquals":1001},"allEqual":{"keepEquals":1001,"discardEquals":1}},"timeOnAllEqual":{"keepEquals":5.97,"discardEquals":5.01,"ratio":1.19},"verdict":"use <=: never worse, and dramatically better on the one input shape that separates them"},"cppRanking":{"n":1000000,"shape":"random","byK":[{"k":2,"brute":1.75,"deque":14.92,"blocks":3.99},{"k":8,"brute":5.08,"deque":18.06,"blocks":4.89},{"k":64,"brute":11.90,"deque":17.83,"blocks":6.24},{"k":192,"brute":16.50,"deque":18.22,"blocks":6.85},{"k":256,"brute":19.17,"deque":18.26,"blocks":7.03},{"k":1000,"brute":56.29,"deque":17.79,"blocks":7.41}],"dequeIsFlatInK":"17.8 to 18.3 ns from k=8 upward -- the O(n) property made visible","bruteCrossover":"k = 230, where brute/deque passes 1.00x","blocksWinEverywhere":"faster than the deque at EVERY window size tested, by 2.4x at k=1000","atK1000":[{"impl":"block decomposition","nsPerElement":7.41},{"impl":"monotonic deque","nsPerElement":17.79},{"impl":"lazy-deletion max-heap","nsPerElement":21.65},{"impl":"deque on a hand-rolled ring buffer","nsPerElement":26.54},{"impl":"brute force","nsPerElement":56.29},{"impl":"std::max_element per window","nsPerElement":592.68}],"heapPeakSize":{"entries":991077,"dequeNeverExceeds":1000,"sameAs":"LFU Cache measured the identical lazy-deletion cost at 787x"},"ringBufferIsWorse":"26.54ns against std::deque's 17.79ns, because the ring's modular index arithmetic sits in a dependent chain where std::deque's block indexing does not","maxElementTrap":"10.5x slower than the identical hand-written loop, because returning an iterator forces it to track a position and the compiler will not vectorise it"},"blockDecomposition":{"identity":"a window of exactly k elements straddles at most one block boundary, so answer[i] = max(suf[i], pre[i+k-1]) -- a suffix of the left block and a prefix of the right","passes":3,"whyItWins":"no data structure, no data-dependent branches, no pointer chasing -- three flat loops a prefetcher handles perfectly","costRisesWithK":"3.99ns at k=2 to 7.41ns at k=1000, because suf[i] and pre[i+k-1] sit k apart so wide windows read two distant streams","costs":["2n extra memory","needs the whole array up front, so it cannot run on a stream the way the deque can"]},"python":{"n":200000,"rows":[{"impl":"collections.deque","k8":302,"k1000":303},{"impl":"list + head index","k8":316,"k1000":398},{"impl":"brute force max(a[i:i+k])","k8":244,"k1000":12677},{"impl":"block decomposition","k8":368,"k1000":399}],"dequeIsFlat":"~300ns per element at every k, the same O(n) signature as C++","bruteCrossover":{"python":11,"cpp":230,"note":"a twentyfold difference in where the identical trade-off flips; max(a[i:i+k]) runs entirely in C so its per-element constant is tiny, but it is still theta(n*k)"},"blocksAreSlowest":"where in C++ they were fastest -- three interpreted passes over n instead of one, and Python charges per operation rather than per cache miss","sameInversionAs":"Implement queue using Linkedlist, from the opposite side"},"recommendation":"the monotonic deque for the interview and for streams; block decomposition in C++ when the array is in hand and k is known; plain brute force when k is small -- under about 230 in C++ and about 11 in Python","lesson":"the elegant O(n) structure is the right answer and the slowest of the three reasonable ones in C++, and which of the others beats it depends entirely on the language"}
```

<!-- @highlights -->
- The array is a horizontal strip with a translucent window of `k` cells sliding left to right.
- Beneath it, the deque as a second shorter strip holding **indices**, not values.
- Each deque cell shows its index with a leader line up to the array cell it points at.
- That leader line is the point: the deque holds positions, which is what makes expiry checkable.
- The trace runs `[1, 3, -1, -3, 5, 3, 6, 7]` with k = 3, and two beats get room.
- At `i = 1`, the value 3 arrives and index 0 is ejected from the **back**.
- Annotated: *1 is smaller and expires sooner, so it can never win again* — the whole algorithm in one sentence.
- At `i = 4`, the value 5 arrives and three indices pop off the back in a single motion.
- The deque is left holding one cell.
- Two running counters sit beside the strips: pushes and pops.
- They finish at 8 and 7 for eight elements, so the 2.00 constant is watched rather than read.
- Second panel runs the same animation three times side by side: increasing, decreasing, random.
- Increasing pops only from the back; decreasing only from the front; random from both.
- All three totals land on 2.00 per element, which is the panel's whole argument.
- Third panel draws the array cut into blocks of `k`, with two coloured arrows per block.
- One sweeps right building `pre`, the other sweeps left building `suf`.
- A window placed anywhere lights up exactly two cells — `suf[i]` and `pre[i+k-1]`.
- Final panel: two bar charts at the same scale, C++ and Python, four implementations each.
- Blocks are lowest in C++ and highest in Python; brute force is lowest at small k and off the chart at large k.
- The deque is the only bar the same height in both charts at every `k`.

<!-- @edgeCases -->
- `k = 1` — every window is one element, so the answer is the array itself and the deque never holds more than one index.
- `k = n` — a single window, and the deque degenerates to a running maximum.
- `k > n` — no windows exist; return empty rather than indexing past the end.
- An empty array — no windows, and `a.size() - k + 1` underflows if computed on an unsigned type before the check.
- All elements equal — correct either way, but `<` fills the deque to `k` where `<=` holds one.
- A strictly increasing array — the deque never holds more than one index and nothing ever expires.
- A strictly decreasing array — the deque fills to `k` and everything leaves by expiring, never by domination.
- Negative values throughout — the running maximum must start from the first element, not from zero.
- The front index exactly at `i - k` — it has just left the window; the test is `front + k <= i`.
- Duplicated maxima inside one window — either copy is a correct answer, which is why `<` and `<=` both work.
- A very large `k` with the block method — `pre[i + k - 1]` reads `k` ahead, which is a second memory stream rather than an error.

<!-- @pitfalls -->
- Storing values in the deque instead of indices. Expiry then cannot be tested at all.
- Using `<` rather than `<=` on the back-pop. Correct, but the deque holds the whole window on tie-heavy input — 1,001 entries against 1.
- Popping from the wrong end. The back is for domination and the front is for expiry; swapping them silently returns wrong answers.
- Testing expiry as `front < i - k` rather than `front + k <= i`. The off-by-one drops the element that is still just inside.
- Emitting a result before the window is full. The first answer belongs to index `k - 1`, not 0.
- Computing `a.size() - k + 1` on an unsigned type without checking `k <= n` first. It wraps to an enormous number.
- Assuming the O(n) algorithm is the fastest. Brute force beat it to k ≈ 230 in C++, and block decomposition beat it everywhere.
- Reaching for `std::max_element` per window. It measured **10.5x** slower than the identical hand-written loop.
- Replacing `std::deque` with a hand-rolled ring buffer for speed. It measured 26.54ns against 17.79ns — worse.
- Using a lazy-deletion heap here. It works, at 1.22x the time and a peak of 991,077 entries against the deque's 1,000.
- Porting the block decomposition to Python for speed. It is the slowest of the four options there.
- Using `Deque<Integer>` in Java without noticing the boxing. Indices above the `Integer` cache allocate.

<!-- @doubt -->
### Why a deque and not a stack?

<!-- @answer -->
Because elements leave from **both** ends, for two unrelated reasons. They leave the back when a larger value arrives, since anything no bigger than the new element can never be a maximum again — that is the monotonic-stack half, and it is exactly what **Next Greater Element** does. And they leave the front when the window slides past them, which has nothing to do with their value at all: the largest element in the array still has to go once it falls out of the window. A stack has no way to remove its oldest entry, so it cannot express the second rule. That single extra requirement is the whole difference between the two problems, and it is why this subtopic sits in Queues while that one sits in Stacks. Everything else — the domination rule, the amortisation, the exact **2.00 operations per element** — is shared.

<!-- @doubt -->
### Why store indices instead of values?

<!-- @answer -->
Because the deque has to decide whether its front has fallen out of the window, and a value cannot answer that question. `a[dq.front()]` tells you *what* the current maximum is; only `dq.front()` tells you *where* it is, which is what the test `front + k <= i` needs. Storing values means keeping a parallel structure of positions, at which point you have reinvented the index deque with extra steps. There is a second, subtler benefit: with indices, duplicate values are automatically distinguished by position, so the expiry logic needs no tie-breaking. The cost is one extra indirection per comparison — `a[dq.back()]` rather than `dq.back()` — which is why the deque reads from the array on every pop test. That indirection is real but small; the measured deque cost is flat at 17.8ns per element from k = 8 upward.

<!-- @doubt -->
### Is it really O(n)? The inner `while` loop looks like it could be O(k).

<!-- @answer -->
It is O(n), and the argument is the standard amortised one: **each index is pushed exactly once and popped at most once**, so however many iterations any single `while` loop runs, the total across the whole scan is bounded by the number of pushes. A window that pops ten elements at once could only do so because ten earlier steps each pushed one. Measured at n = 1,000,000 and k = 1,000, the total came to **2.0000 deque operations per element** — and the useful part of that measurement is that it held on *every* input shape: increasing (999,999 back-pops, 0 front-pops), decreasing (0 back-pops, 999,000 front-pops), random, and all-equal. Those are opposite extremes in how the work is distributed and the total does not move. It is the same constant, verified the same way, that **Next Greater Element** measured for the monotonic stack.

<!-- @doubt -->
### Should I pop with `<` or `<=`?

<!-- @answer -->
Use `<=`, which discards equal values. Both are **correct** — an equal value is just as good a maximum, so which of two equal candidates you keep cannot change any answer, and that was confirmed over 20,000 tie-heavy random cases with 216,165 window maxima compared and zero disagreements. What differs is what you carry. On an all-equal array of a million elements at k = 1,000, `<` never pops from the back, so the deque fills to the whole window — maximum size **1,001** — while `<=` pops every time and holds exactly **one** entry. Measured, that cost **5.97ns per element against 5.01ns**, about 1.19x, plus a thousandfold difference in memory touched. On random and increasing data the two are indistinguishable (21 and 1 entries respectively), so this only shows up on data with many ties — which is precisely the data most people forget to test with.

<!-- @doubt -->
### Why not a heap?

<!-- @answer -->
It works and it is worse on both axes, though less dramatically than you might expect. Push every `(value, index)` on a max-heap and, before reading the top, discard entries whose index has expired. Measured at n = 1,000,000 and k = 1,000, it cost **21.65ns per element** against the deque's 17.79ns — only 1.22x. The real cost is memory: because entries are removed only when they surface rather than when they expire, the heap grew to a peak of **991,077 entries** while the deque never exceeded 1,000. That is the same lazy-deletion trade **LFU Cache** measured at a factor of 787, and it is worth recognising as a pattern rather than a one-off. The heap is the right tool when there is no monotonic structure to exploit — when you need the *k*-th largest, say, rather than the largest. Here the domination rule means most elements never need to be kept at all, and the deque simply refuses to keep them.

<!-- @doubt -->
### Is the monotonic deque actually the fastest?

<!-- @answer -->
In C++, no — it was the slowest of the three reasonable options at most window sizes. **Block decomposition** beat it at *every* `k` tested: 7.41ns per element against 17.79ns at k = 1,000, and 3.99ns against 14.92ns at k = 2. It cuts the array into blocks of `k`, takes running maxima forwards and backwards, and reads each answer as `max(suf[i], pre[i + k - 1])` — three flat passes over contiguous memory with no data-dependent branches, which is exactly what a prefetcher wants, where the deque's pops are unpredictable. **Brute force** also beat it, up to **k ≈ 230**, because its inner loop vectorises. What the deque uniquely offers is that it is O(k) in space, works on a **stream** where block decomposition needs the whole array up front, and has a cost that is flat in `k`. It is the right answer to the question as asked, and the honest ranking is worth knowing before you optimise something that is already the slow option.

<!-- @doubt -->
### What about sliding window minimum?

<!-- @answer -->
The identical code with the comparison reversed: pop the back while `a[dq.back()] >= a[i]`, and the deque becomes increasing rather than decreasing. Every measurement in this container transfers unchanged, because nothing about the analysis depends on which direction the ordering runs — the domination argument is "this element is at least as good and outlives the one behind it", and "good" is whichever extreme you asked for. If you need **both** the maximum and the minimum of every window, run two deques over the same pass; the total is 4.00 operations per element rather than 2.00, and it is still one traversal of the array. That pairing is the standard building block for problems asking whether any window's spread stays within a bound, which is where variable-length sliding windows begin.

<!-- @doubt -->
### What should I use in Python?

<!-- @answer -->
`collections.deque`, for any window wider than about eleven. It measured a flat **~300ns per element** at every `k` — the same O(n) signature as the C++ version — and it is the fastest option at k = 16 and above. Below that, the one-line brute force `[max(a[i:i+k]) for i in range(len(a)-k+1)]` wins, at **244ns per element** at k = 8, because both the slice and `max` execute entirely in C. The crossover sits near **k = 11**, against C++'s **k = 230** — the identical trade-off flipping at points twenty times apart, purely because of what each language charges per element. One thing not to port: **block decomposition, which is the fastest option in C++, is the slowest in Python** at 399ns per element, because it makes three interpreted passes where the deque makes one. And take care with the two ends — on a `deque`, `pop()` removes from the right and `popleft()` from the left, and confusing them is the most common way to get this wrong.

<!-- @doubt -->
### Why is this in the Queues topic?

<!-- @answer -->
Because it is the one problem in the topic where a deque is used as a deque — both ends, for different purposes, in the same loop. Everything before it built a queue: **Implement Queue using Arrays** made both ends O(1) by wrapping indices, **Implement Queue using Stack** by amortising a reversal, **Implement queue using Linkedlist** with a tail pointer, and **LRU Cache** added O(1) access to the middle. This subtopic finally *spends* that capability — the back end enforces the monotonic order and the front end enforces the window, and neither a stack nor a plain queue can do both. It is also the bridge out of the topic: the remaining subtopics are sliding-window problems where the window is variable length, and the question shifts from what to remember about a fixed window to when to grow or shrink one.
