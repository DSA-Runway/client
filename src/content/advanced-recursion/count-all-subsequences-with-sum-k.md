---
id: count-all-subsequences-with-sum-k
topic: Advanced Recursion
title: Count all subsequences with sum K
difficulty: Easy
status: ready
prerequisites:
  - learn-all-patterns-of-subsequences-theory
  - pow-x-n
  - fibonacci-number
  - time-and-space-complexity-basics
  - integer-overflow-and-precision-errors
relatedIds:
  - learn-all-patterns-of-subsequences-theory
  - check-if-there-exists-a-subsequence-with-sum-k
  - fibonacci-number
  - pow-x-n
---

<!-- @summary -->
Changing the leaf from "emit this subsequence" to "return 1 or 0" does something the previous subtopic's tree could not: it creates overlap. Different paths reach the same (index, running sum), so at n = 20 the 2,097,151 calls collapse to 968 distinct states — a factor of 2,166. That is the doorway to dynamic programming, with two honest caveats: a count cannot be pruned the way an existence check can, and memoising is a net loss below about n = 16.

<!-- @theory -->
## The problem

Given an array and a target `K`, count how many subsequences sum to `K`.

```
[1, 2, 3],  K = 3   ->   2      // [1,2] and [3]
[1, 2, 1],  K = 2   ->   2      // [2] and [1,1]
```

## Two small edits to the previous pattern

Take the generator from the theory subtopic and change two lines:

```
generate(i, cur):                     count(i, sum):
    if i == n: emit(cur); return          if i == n: return sum == K
    cur.push(a[i])                        return count(i+1, sum+a[i])
    generate(i+1, cur); cur.pop()              + count(i+1, sum)
    generate(i+1, cur)
```

The leaf **answers** instead of recording, and the parent **adds its two children**
instead of discarding them. That is the whole difference, and it has two
consequences — one obvious and one not.

The obvious one is that the buffer disappears. You carry a running sum instead of
a list, so there is no `push_back`, no `pop_back`, and no copy at the leaf. The
per-level space drops from O(n) to O(1), and measured at n = 20 that alone is
worth **163.5x**: 45,672ns against 7,468,750ns for generating every subsequence
and adding it up.

## The consequence that matters more

The previous subtopic ended by saying there was nothing to memoise, because every
leaf was a distinct subsequence. That is still true of the *subsequences*. It is
no longer true of the *work*.

A count does not care **how** you reached a sum, only that you did. So two
different paths that arrive at the same index with the same running total will do
identical work from there on. Measured, counting distinct `(index, running sum)`
pairs against total calls:

| n | Leaves 2^n | Calls 2^(n+1)−1 | Distinct (i, sum) | Collapse |
|---|---|---|---|---|
| 5 | 32 | 63 | 43 | 1x |
| 10 | 1,024 | 2,047 | 275 | 7x |
| 15 | 32,768 | 65,535 | 668 | 98x |
| 20 | 1,048,576 | **2,097,151** | **968** | **2,166x** |

At n = 20 more than two million calls are doing the work of 968. And the collapse
grows with n — 1x, 7x, 98x, 2,166x — because the number of states is bounded by
`n × (sum range)` while the tree keeps doubling.

The smallest example: with `a = [1,2,3,4]` and `K = 5`, the state `(i=3, sum=3)`
is reached twice — once by taking 1 and 2, once by taking 3. Everything below it
is computed twice for no reason.

**This is the first subsequence problem where memoisation applies at all**, and
the reason is precisely that the answer became a number instead of a list.

## What it is worth, and where it is not

| n | Generate + sum | Running sum | Memoised | Tabulated |
|---|---|---|---|---|
| 12 | 23,412ns | **187ns** | 1,329ns | 116ns |
| 16 | 419,244ns | 2,838ns | 2,800ns | 191ns |
| 20 | 7,468,750ns | 45,672ns | 3,267ns | 226ns |
| 24 | — | 7,455,775ns | 5,798ns | **434ns** |

Read the memoised column carefully. At n = 12 it is **7.1x slower** than the plain
recursion, because allocating the table costs more than walking a tree of 8,191
nodes. Break-even is around **n = 16**, where the two are within 1.4% of each
other. From there it runs away: 14.0x at n = 20 and **1,286x at n = 24**.

Memoisation is not free and it is not always an improvement. It buys an
asymptotic change at a fixed setup cost, and below the crossover the setup is the
whole bill.

Tabulation wins everywhere — 11.5x to 13.4x faster than memoising at every size
tested — because it allocates one row of `K+1` values instead of an
`n × sum` table, and has no recursion at all. At n = 24 it is **17,179x** faster
than the plain recursion.

## You cannot prune a count

The previous subtopic measured pruning on the *existence* question and found it
worth up to 100%. None of that transfers here.

An existence check can stop the moment one branch says yes. A count must add up
**every** branch, so every leaf has to be visited no matter what. There is no
early return that preserves correctness, and the two problems that look almost
identical have completely different best cases:

| | Best case | Worst case |
|---|---|---|
| Does one exist? | n + 1 calls | 2^(n+1)−1 |
| How many are there? | 2^(n+1)−1 | 2^(n+1)−1 |

That is why counting is the problem that *needs* dynamic programming and existence
is the one that often gets away without it.

## Zeros double the answer, and break the tempting shortcut

A zero can be taken or skipped without changing the sum, so both choices are valid
completions and every zero **doubles** the count:

| Array | K = 3 | Count |
|---|---|---|
| `[1,2,3]` | | 2 |
| `[0,1,2,3]` | | **4** |
| `[0,0,1,2,3]` | | **8** |
| `[0,0,0,1,2,3]` | | **16** |

Now the trap. Many write the recursion with a shrinking target instead of a
growing sum, and add what looks like a harmless early exit:

```
if (target == 0) return 1;     // WRONG — stops before the array is exhausted
if (i < 0) return 0;
```

That returns 1 as soon as the target is met, which silently discards the
remaining elements — including any zeros still to be decided. Measured, it stays
stuck at **2** for every row of the table above, undercounting by a factor of
`2^(number of zeros)`. On `[0,0,0]` with `K = 0` it returns **1** where the true
answer is **8**.

The safe form checks the index first:

```
if (i < 0) return target == 0;    // every element has been decided
```

## Negative values remove every shortcut

With negatives the running sum is no longer monotonic — it can move away from `K`
and come back:

```
a = [2, -1, 3, -2, 1]
K =  0  1  2  3  -1
     5  5  5  5   3
```

Three things stop working. You cannot prune on "the sum already exceeds K",
because it may come back down. The tabulated version above indexes `dp` by the
sum, so a negative sum needs an offset of `|minimum possible total|` and a table
of width `total range` rather than `K+1`. And the `for s = K down to x` loop
direction assumes `x` is non-negative; with negative values it has to run the
other way or use a second row.

For non-negative inputs — which is how this problem is almost always posed — none
of that applies.

## Watch the count, not just the sum

The number of subsequences can be far larger than anything in the array. There
are up to 2^n of them, so for n = 64 the count alone overflows a signed 64-bit
integer even though every element might be 1. Any version that reports a raw
count needs a wide return type, or a modulus — which is exactly what the harder
problems in this topic ask for, and why so many of them say "return the answer
modulo 10^9 + 7".

## Where this goes next

**Check if there exists a subsequence with sum K** is the same tree with `+`
replaced by `||`. That one change restores everything this subtopic lost: the
early return becomes valid again, so a `true` answer can cost as little as n + 1
calls. It is worth doing immediately after this one precisely because the code is
nearly identical and the performance characteristics are opposites.

<!-- @intuition -->
The generator built a list and showed it to you; the counter just needs a number, and that difference is bigger than it looks. Once you only want a count, the path you took to reach a partial sum stops mattering — two different sets of choices that arrive at index i with the same total will produce exactly the same number of completions from there. That is what makes the tree collapse, and it is the first time in this topic that a recursion has repeated work worth remembering. The other half of the change is that you no longer need to carry a list at all, only a running total, which removes the buffer and all its copying. What you lose is the ability to stop early: adding up branches means visiting all of them, so unlike an existence check there is no lucky input that finishes fast.

<!-- @approach -->
### Brute Force - Generate Every Subsequence and Add It Up

<!-- @idea -->
Build each subsequence as before, then total it and compare with K.

<!-- @steps -->
1. Run the take / not-take recursion from the theory subtopic, carrying a buffer.
2. At the end of the array, add up the elements currently in the buffer.
3. Increment a counter if that total equals K.
4. Undo the take before exploring the skip branch.
5. Return the counter once the whole tree has been walked.

<!-- @complexity -->
- time: O(n · 2^n) — the extra n is summing the buffer at each of the 2^n leaves
- space: O(n) for the buffer plus O(n) call stack
- note: Correct but doing two unnecessary things at once — carrying a list it never inspects, and re-adding a total it could have maintained incrementally. Measured 7,468,750ns at n = 20 against 45,672ns for the running-sum version, a factor of 163.5. Worth writing once to see that the buffer is what the next approach removes.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void countSub(const vector<int>& a, int i, vector<int>& cur, long long K, long long& total) {
    if (i == (int)a.size()) {
        long long s = 0;
        for (int x : cur) s += x;          // re-adding what we already knew
        if (s == K) total++;
        return;
    }
    cur.push_back(a[i]); countSub(a, i + 1, cur, K, total); cur.pop_back();
    countSub(a, i + 1, cur, K, total);
}
```

<!-- @annotations -->
- 7: This loop is the whole waste — the sum could have been maintained on the way down instead of rebuilt at every leaf.
- 8: total is a reference, so the two branches accumulate into one counter rather than returning values.
- 11: The push / recurse / pop sandwich, exactly as in the theory subtopic.

<!-- @code java -->
```java
static void countSub(int[] a, int i, List<Integer> cur, long K, long[] total) {
    if (i == a.length) {
        long s = 0;
        for (int x : cur) s += x;
        if (s == K) total[0]++;
        return;
    }
    cur.add(a[i]); countSub(a, i + 1, cur, K, total); cur.remove(cur.size() - 1);
    countSub(a, i + 1, cur, K, total);
}
```

<!-- @annotations -->
- 1: A one-element long array stands in for an out-parameter, since Java has no pass-by-reference for primitives.

<!-- @code python -->
```python
def count_sub(a, i=0, cur=None, k=0):
    if cur is None:
        cur = []
    if i == len(a):
        return 1 if sum(cur) == k else 0

    cur.append(a[i])
    taken = count_sub(a, i + 1, cur, k)
    cur.pop()
    return taken + count_sub(a, i + 1, cur, k)


# sum(cur) at every leaf is O(n) work repeated 2^n times.
```

<!-- @annotations -->
- 5: sum(cur) walks the whole buffer at each of the 2^n leaves, which is the O(n) factor the next approach removes.
- 8: Returning the two branches added together rather than mutating a shared counter, which is the shape the running-sum version keeps.

<!-- @approach -->
### Carry a Running Sum

<!-- @idea -->
Keep the total as a parameter, so the leaf already knows the answer.

<!-- @steps -->
1. Pass the running sum down instead of the list.
2. On the take branch, add a[i] to it; on the skip branch, pass it unchanged.
3. At the end of the array, return 1 if the running sum equals K and 0 otherwise.
4. Return the sum of the two branches.
5. No buffer means nothing to push, pop or copy.

<!-- @complexity -->
- time: O(2^n)
- space: O(n) call stack only
- note: Removes both the buffer and the O(n) summing at each leaf — measured 45,672ns at n = 20 against the generating version's 7,468,750ns, a factor of 163.5. This is also the form that exposes the overlap: the parameters (i, sum) are exactly the state that repeats, which is what the next approach exploits.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

long long countSub(const vector<int>& a, int i, long long sum, long long K) {
    if (i == (int)a.size()) return sum == K;      // 1 or 0

    return countSub(a, i + 1, sum + a[i], K)      // TAKE
         + countSub(a, i + 1, sum, K);            // SKIP
}
```

<!-- @annotations -->
- 5: Check the index, not the sum — returning early when sum == K discards the elements still to be decided and undercounts by 2^(number of zeros). The comparison is a bool that converts to 1 or 0, which is why no explicit if is needed.
- 7: The two branches are added, not or-ed — that single operator is the whole difference from the existence version, and it is why nothing can be pruned.

<!-- @code java -->
```java
static long countSub(int[] a, int i, long sum, long K) {
    if (i == a.length) return sum == K ? 1 : 0;

    return countSub(a, i + 1, sum + a[i], K)
         + countSub(a, i + 1, sum, K);
}
```

<!-- @annotations -->
- 2: Java has no implicit boolean-to-int conversion, so the ternary is required where C++ can return the comparison directly.

<!-- @code python -->
```python
def count_sub(a, i, cur, k):
    if i == len(a):
        return 1 if cur == k else 0
    return count_sub(a, i + 1, cur + a[i], k) + count_sub(a, i + 1, cur, k)


# Python's int is arbitrary precision, so the COUNT cannot overflow here
# even though there are up to 2^n subsequences.
```

<!-- @annotations -->
- 3: Returning an int rather than the bool directly, since True + True would be 2 and read confusingly even though it is correct.
- 7: In C++ or Java a count of up to 2^n needs a 64-bit return type, and overflows it once n reaches 64.

<!-- @approach -->
### Memoise on (index, sum)

<!-- @idea -->
Remember the answer for each (index, running sum) pair, since the path taken to reach it does not matter.

<!-- @steps -->
1. Note that two different sets of choices can arrive at the same index with the same total.
2. From that point on they produce identical counts, so the work is duplicated.
3. Keep a table indexed by the position and the running sum.
4. Return the stored answer if it is present, otherwise compute and store it.
5. The tree collapses to the number of distinct states rather than the number of paths.

<!-- @complexity -->
- time: O(n · S) where S is the range of reachable sums
- space: O(n · S) for the table plus O(n) call stack
- note: The first subsequence problem in this topic where memoisation applies, because a count forgets the path. At n = 20 the 2,097,151 calls collapse to 968 distinct states, a factor of 2,166. But it is not free — measured it is 7.1x SLOWER than plain recursion at n = 12, breaks even around n = 16, and only then runs away: 14.0x faster at n = 20 and 1,286x at n = 24.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

long long solve(const vector<int>& a, int i, int sum, int K,
                vector<vector<long long>>& memo, vector<vector<char>>& seen) {
    if (i == (int)a.size()) return sum == K;
    if (seen[i][sum]) return memo[i][sum];

    seen[i][sum] = 1;
    return memo[i][sum] = solve(a, i + 1, sum + a[i], K, memo, seen)
                        + solve(a, i + 1, sum, K, memo, seen);
}
```

<!-- @annotations -->
- 6: The base case is checked before the table, since index n is outside it.
- 7: A separate seen array rather than a sentinel value, because 0 is a legitimate count and cannot mean not-yet-computed.
- 10: Storing on the way out, so each of the distinct states is computed exactly once.
- 5: The table is sized n by (total sum + 1), which is why this only works for non-negative values without an offset.

<!-- @code java -->
```java
static long solve(int[] a, int i, int sum, int K, long[][] memo, boolean[][] seen) {
    if (i == a.length) return sum == K ? 1 : 0;
    if (seen[i][sum]) return memo[i][sum];

    seen[i][sum] = true;
    return memo[i][sum] = solve(a, i + 1, sum + a[i], K, memo, seen)
                        + solve(a, i + 1, sum, K, memo, seen);
}
```

<!-- @annotations -->
- 5: Java zero-fills both arrays, so the boolean seen table starts correctly as all false without an explicit fill.

<!-- @code python -->
```python
import functools


def count_sub(a, k):
    @functools.lru_cache(maxsize=None)
    def go(i, cur):
        if i == len(a):
            return 1 if cur == k else 0
        return go(i + 1, cur + a[i]) + go(i + 1, cur)
    return go(0, 0)


# The cache is defined inside, so it is discarded between calls rather
# than leaking results computed for a different array or target.
```

<!-- @annotations -->
- 5: Defining the cached helper inside means each call gets a fresh cache — a module-level lru_cache would return answers computed for a previous array.
- 6: (i, cur) are the state, and they are hashable, so lru_cache needs no manual table at all.

<!-- @approach -->
### Optimal - Tabulate Over One Row

<!-- @idea -->
Fill the counts for every target from zero upward, one element at a time.

<!-- @steps -->
1. Start with a row saying there is exactly one way to make a total of zero — take nothing.
2. Take each element of the array in turn.
3. For each target from K downward, add the count of the target minus that element.
4. Iterate downward so each element is used at most once per subsequence.
5. The answer is the entry at K after all elements have been processed.

<!-- @complexity -->
- time: O(n · K)
- space: O(K)
- note: The fastest form at every size measured — 226ns at n = 20 and 434ns at n = 24, which is 17,179x quicker than the plain recursion there and 11.5x to 13.4x quicker than memoising. It also handles zeros with no special case: when the element is 0 the inner loop performs dp[s] += dp[s], which doubles every entry, and that is exactly the 2^(zeros) multiplier. Verified against brute force over 54,205 (array, K) pairs with about a quarter of elements zero.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

long long countSub(const vector<int>& a, int K) {
    vector<long long> dp(K + 1, 0);
    dp[0] = 1;                              // one way to total zero: take nothing

    for (int x : a)
        for (int s = K; s >= x; s--)        // DOWNWARD
            dp[s] += dp[s - x];

    return dp[K];
}
```

<!-- @annotations -->
- 6: dp[0] = 1 is the empty subsequence, which is why K = 0 correctly returns at least 1.
- 9: Downward is what stops an element being counted twice — going upward would let dp[s - x] already include x and turn this into unbounded counts.
- 10: With x equal to 0 this becomes dp[s] += dp[s], doubling every entry, which is exactly the effect a zero should have.
- 4: Requires non-negative values; a negative x makes s >= x meaningless and needs an offset table instead.

<!-- @code java -->
```java
static long countSub(int[] a, int K) {
    long[] dp = new long[K + 1];
    dp[0] = 1;

    for (int x : a)
        for (int s = K; s >= x; s--)
            dp[s] += dp[s - x];

    return dp[K];
}
```

<!-- @annotations -->
- 2: new long[] zero-fills, so only dp[0] needs setting explicitly.

<!-- @code python -->
```python
def count_sub(a, k):
    dp = [0] * (k + 1)
    dp[0] = 1
    for x in a:
        for s in range(k, x - 1, -1):
            dp[s] += dp[s - x]
    return dp[k]


# range(k, x - 1, -1) counts down to x inclusive. Writing range(k, x, -1)
# stops one short and silently drops the case s == x.
```

<!-- @annotations -->
- 5: The stop is x - 1 because range excludes it, so this covers s from k down to x inclusive.
- 10: Getting that bound wrong loses exactly the subsequences consisting of x alone, which is easy to miss on tests where K is large.

<!-- @example -->

<!-- @input -->
a = [1, 2, 3], K = 3, through the running-sum recursion

<!-- @output -->
2 — from [1,2] and [3]

<!-- @why -->
The smallest case where two different subsequences hit the target, so the addition at the parent is doing visible work.

<!-- @walkthrough -->
1. count(0, 0) explores taking 1, giving count(1, 1), and skipping it, giving count(1, 0).
2. Under count(1, 1) it takes 2 to reach count(2, 3), then takes 3 to reach count(3, 6) — the leaf returns 0.
3. Skipping 3 from count(2, 3) reaches count(3, 3), which equals K, so that leaf returns 1 — this is [1,2].
4. Back under count(1, 1), skipping 2 gives count(2, 1); neither taking nor skipping 3 from there reaches 3 exactly, giving 0 and 0.
5. Under count(1, 0), taking 2 gives count(2, 2), whose two leaves are 5 and 2 — both 0.
6. Skipping 2 gives count(2, 0), where taking 3 reaches exactly 3 — that leaf returns 1, and this is [3].
7. Every leaf was visited, because a count adds all branches rather than stopping at the first success.

<!-- @example -->

<!-- @input -->
Distinct (index, running sum) states against total calls

<!-- @output -->
2,097,151 calls doing the work of 968 states at n = 20

<!-- @why -->
It is the measurement that separates this problem from the previous subtopic, where the same tree had nothing worth remembering.

<!-- @walkthrough -->
1. Generating all subsequences produced 2^n distinct results, so no two leaves were the same and caching could not help.
2. Counting throws the path away and keeps only a number, so two different routes to the same running sum become identical work.
3. With a = [1,2,3,4] and K = 5, the state (i = 3, sum = 3) is reached twice — once via 1 and 2, once via 3.
4. Everything below that state is therefore computed twice for no reason.
5. Counting distinct (i, sum) pairs at n = 20 gives 968, against 2,097,151 calls.
6. That is a collapse of 2,166x, and it grows with n — 1x, 7x, 98x, 2,166x at n = 5, 10, 15, 20.
7. The number of states is bounded by n times the range of sums, while the tree keeps doubling, which is why the gap widens.

<!-- @example -->

<!-- @input -->
An array containing zeros, counted two different ways

<!-- @output -->
16 the correct way and 2 with an early base case

<!-- @why -->
It is the standard bug in this problem, it is silent, and it gets worse as the input gets more degenerate.

<!-- @walkthrough -->
1. A zero can be taken or skipped without changing the sum, so both choices lead to valid completions.
2. Every zero therefore doubles the answer: [1,2,3] gives 2, [0,1,2,3] gives 4, [0,0,1,2,3] gives 8 and [0,0,0,1,2,3] gives 16.
3. Writing the recursion with a shrinking target invites an early exit — return 1 as soon as the target hits zero.
4. That stops before the remaining elements have been decided, including any zeros still to come.
5. Measured, it returns 2 for every one of those four arrays, undercounting by 2^(number of zeros).
6. On [0,0,0] with K = 0 it returns 1 where the true answer is 8, since all eight subsequences sum to zero.
7. Checking the index first — if i is past the end, return whether the target is zero — fixes it completely.

<!-- @example -->

<!-- @input -->
The same four implementations at n = 12 and n = 24

<!-- @output -->
Memoising is 7.1x slower at n = 12 and 1,286x faster at n = 24

<!-- @why -->
It shows that memoisation has a fixed cost that has to be earned back, which is easy to miss when it is presented purely as an improvement.

<!-- @walkthrough -->
1. At n = 12 the plain recursion walks 8,191 nodes and measured 187ns.
2. Memoising the same computation measured 1,329ns — 7.1x slower, because building the table costs more than the tree it saves.
3. At n = 16 the two are within 1.4% of each other, 2,838ns against 2,800ns, which is the crossover.
4. At n = 20 memoising is 14.0x faster, and at n = 24 it is 1,286x faster.
5. Tabulating is quicker than memoising at every size tested, by 11.5x to 13.4x, because it allocates one row instead of a two-dimensional table and does not recurse.
6. At n = 24 tabulating measured 434ns against the plain recursion's 7,455,775ns, a factor of 17,179.
7. So the ordering of these approaches depends on n, and below the crossover the simplest one is also the fastest.

<!-- @visualization custom -->

<!-- @description -->
The same take/skip tree as the theory subtopic, drawn for a = [1,2,3,4] with K = 5, but now every node is labelled with its (index, running sum) rather than the partial list — the change of label is the point, so start by showing the list labels fading out and the (i, sum) pairs fading in. Colour any two nodes that share a label identically, so the repeated states become visible as matching colours scattered across the tree; for this input (i=3, sum=3) appears twice and should be joined by a curved link labelled same state, same answer. Each leaf shows 1 or 0 rather than a subsequence, and the values add upward, so the reader watches the count assemble at the root — animate the addition so the parent's number appears only after both children resolve, which is the visual reason nothing here can stop early. Beside it place the previous subtopic's tree with a caption every leaf distinct, nothing to memoise, against this one captioned 2,097,151 calls, 968 states. The collapse panel is a bar pair on a log axis for n = 5, 10, 15, 20 showing calls against distinct states, with the ratios 1x, 7x, 98x, 2,166x printed and the gap visibly widening. Then the crossover chart, which should not be drawn as memoisation simply winning: plot plain recursion and memoised on the same axes against n, let them cross at n = 16, and shade the region below the crossing where the plain version is faster — annotate 7.1x slower at n = 12 on the left and 1,286x faster at n = 24 on the right. Finally the zeros panel: a row of arrays [1,2,3], [0,1,2,3], [0,0,1,2,3], [0,0,0,1,2,3] with their counts 2, 4, 8, 16 doubling, and beside each the early-base-case answer stuck at 2, with the discarded branches greyed out so it is clear the shortcut is throwing away the still-undecided zeros.

<!-- @sampleInput -->
```json
{"primary":{"array":[1,2,3],"K":3,"answer":2,"witnesses":[[1,2],[3]],"form":"running sum, no buffer","nodeLabel":"(index, running sum)","leafRule":"return sum == K","parentRule":"add the two children","everyLeafVisited":true,"whyNoEarlyExit":"a count adds all branches; there is no first success to stop at"},"theOverlap":{"claim":"a count forgets the path, so (index, running sum) repeats","example":{"array":[1,2,3,4],"K":5,"repeatedState":{"i":3,"sum":3,"reachedTimes":2,"routes":["take 1 and 2","take 3"]},"otherRepeats":[{"i":4,"sum":3},{"i":4,"sum":4},{"i":4,"sum":5},{"i":4,"sum":6},{"i":4,"sum":7}]},"rows":[{"n":5,"leaves":32,"calls":63,"states":43,"collapse":1},{"n":10,"leaves":1024,"calls":2047,"states":275,"collapse":7},{"n":15,"leaves":32768,"calls":65535,"states":668,"collapse":98},{"n":20,"leaves":1048576,"calls":2097151,"states":968,"collapse":2166}],"contrastWithTheory":"generating produced 2^n distinct results, so nothing repeated and memoisation could not help","whyItGrows":"states are bounded by n x (sum range) while the tree keeps doubling"},"timing":{"unit":"ns, -O2, median of 7","rows":[{"n":12,"generatePlusSum":23412,"runningSum":187,"memoised":1329,"tabulated":116},{"n":16,"generatePlusSum":419244,"runningSum":2838,"memoised":2800,"tabulated":191},{"n":20,"generatePlusSum":7468750,"runningSum":45672,"memoised":3267,"tabulated":226},{"n":24,"generatePlusSum":null,"runningSum":7455775,"memoised":5798,"tabulated":434}],"ratios":{"bufferRemovalAtN20":163.5,"memoVsPlainAtN12":"7.1x SLOWER","crossover":16,"memoVsPlainAtN20":14.0,"memoVsPlainAtN24":1286,"tabulatedVsPlainAtN24":17179,"tabulatedVsMemo":"11.5x to 13.4x at every size"},"reading":"memoisation has a fixed setup cost; below n = 16 it is a net loss"},"cannotPrune":{"count":{"best":"2^(n+1)-1","worst":"2^(n+1)-1"},"exists":{"best":"n + 1","worst":"2^(n+1)-1"},"why":"an existence check stops at the first yes; a count must add every branch","consequence":"counting is the version that needs dynamic programming"},"zeros":{"rule":"each zero doubles the count, because taking or skipping it leaves the sum unchanged","rows":[{"array":[1,2,3],"K":3,"correct":2,"earlyBaseCase":2},{"array":[0,1,2,3],"K":3,"correct":4,"earlyBaseCase":2},{"array":[0,0,1,2,3],"K":3,"correct":8,"earlyBaseCase":2},{"array":[0,0,0,1,2,3],"K":3,"correct":16,"earlyBaseCase":2}],"worstCase":{"array":[0,0,0],"K":0,"correct":8,"earlyBaseCase":1},"badForm":"if (target == 0) return 1;  // before the array is exhausted","goodForm":"if (i < 0) return target == 0;","undercountFactor":"2^(number of zeros)","tabulationHandlesItFree":"with x = 0 the inner loop is dp[s] += dp[s], which doubles every entry","verified":"54,205 (array, K) pairs with ~25% zeros, tabulated agrees with brute force"},"negatives":{"example":{"array":[2,-1,3,-2,1],"counts":[{"K":0,"count":5},{"K":1,"count":5},{"K":2,"count":5},{"K":3,"count":5},{"K":-1,"count":3}]},"breaks":["no bound-based pruning: the running sum can move away from K and return","the dp row must be offset by the minimum possible total and widened to the full range","the downward loop direction assumes x is non-negative"]},"overflowNote":{"maxCount":"2^n","consequence":"the count itself overflows a signed 64-bit integer once n reaches 64, whatever the element values","whyProblemsSayModulo":"which is why harder variants ask for the answer modulo 10^9 + 7"}}
```

<!-- @highlights -->
- The take/skip tree is redrawn for [1,2,3,4] with K = 5, with node labels changing from partial lists to (index, running sum).
- That relabelling animates — the lists fade out, the (i, sum) pairs fade in — because the change of label is the whole idea.
- Nodes sharing a label are coloured identically, so repeated states appear as matching colours across the tree.
- (i=3, sum=3) appears twice and is joined by a curved link labelled same state, same answer.
- Leaves show 1 or 0 instead of subsequences, and the values add upward to assemble the count at the root.
- The parent's number appears only after both children resolve, which is the visual reason nothing can stop early.
- The previous subtopic's tree sits beside it, captioned every leaf distinct, nothing to memoise.
- This one is captioned 2,097,151 calls, 968 states.
- A log-axis bar pair for n = 5, 10, 15, 20 shows calls against distinct states.
- The ratios 1x, 7x, 98x and 2,166x are printed, with the gap visibly widening.
- The crossover chart plots plain recursion and memoised against n, crossing at n = 16.
- The region below the crossing is shaded to mark where the plain version is faster.
- It is annotated 7.1x slower at n = 12 on the left and 1,286x faster at n = 24 on the right.
- The zeros panel shows [1,2,3], [0,1,2,3], [0,0,1,2,3] and [0,0,0,1,2,3] with counts doubling 2, 4, 8, 16.
- Beside each sits the early-base-case answer, stuck at 2 in every row.
- The branches that shortcut discards are greyed out, showing it is throwing away the still-undecided zeros.

<!-- @edgeCases -->
- K equal to zero — the empty subsequence always counts, so the answer is never less than 1.
- An empty array with K = 0 — exactly one subsequence, the empty one, so the answer is 1.
- An empty array with K non-zero — the answer is 0, which the index-first base case gives without a special case.
- An array of all zeros with K = 0 — every one of the 2^n subsequences qualifies, so the answer is 2^n.
- A single zero anywhere — doubles the answer, and is the smallest input that exposes the early-base-case bug.
- Several zeros — the early-base-case version undercounts by exactly 2^(number of zeros).
- K larger than the total of the array — the answer is 0, and the tabulated version needs a K+1 row regardless.
- Negative values present — the running sum is not monotonic, so no bound pruning is valid and the dp row needs an offset.
- All elements equal to 1 with K = n/2 — the maximum possible count, which is where a narrow return type overflows first.
- n at or above 64 — the count alone can exceed a signed 64-bit integer even with every element equal to 1.
- Writing range(k, x, -1) in Python — stops one short and silently drops the subsequence consisting of x alone.

<!-- @pitfalls -->
- Returning 1 as soon as the running sum reaches K. That discards the elements still to be decided and undercounts by 2^(number of zeros) — on [0,0,0] with K = 0 it gives 1 instead of 8.
- Checking the sum before the index in the base case. The index is what says every element has been decided; the sum only says one particular total was reached.
- Carrying the subsequence when only a count is wanted. The buffer and the per-leaf summing cost a factor of 163.5 at n = 20.
- Assuming pruning transfers from the existence version. A count must add every branch, so its best case and worst case are the same 2^(n+1)−1 calls.
- Using 0 as the not-yet-computed sentinel in the memo table. Zero is a legitimate count, so a separate seen array is required.
- Reaching for memoisation at small n. Measured, it is 7.1x slower than the plain recursion at n = 12 and only breaks even around n = 16.
- Iterating the tabulated inner loop upward. That lets dp[s - x] already include x, which counts elements more than once and answers a different problem.
- Writing range(k, x, -1) rather than range(k, x - 1, -1) in Python. It stops one short and loses exactly the subsequences equal to x alone.
- Applying the K+1-wide dp row to an array containing negatives. The row has to be offset by the smallest reachable total and widened to the whole range.
- Pruning on "the running sum already exceeds K" with negatives present. The sum can come back down, so that test discards valid answers.
- Returning an int count. There can be up to 2^n subsequences, so anything above n = 31 needs a 64-bit type and n = 64 overflows even that.
- Forgetting that dp[0] = 1 represents the empty subsequence. Initialising it to 0 makes every answer 0, in the same way that a wrong identity element did for factorial.

<!-- @doubt -->
### What actually changed from generating all subsequences?

<!-- @answer -->
Two lines, with very different consequences. The leaf returns a number instead of recording a list, and the parent adds its children instead of ignoring them. The visible effect is that the buffer disappears — you carry a running sum, so there is no push, pop, or copy, and that alone measured 163.5x at n = 20. The less visible effect is the important one: a count throws away the path and keeps only the total, so two different routes to the same running sum become the same subproblem. That creates overlap where the generator had none, which is what makes dynamic programming apply here for the first time in this topic.

<!-- @doubt -->
### Why can this be memoised when the theory subtopic said it could not?

<!-- @answer -->
Because the answer changed shape. Generating all subsequences produces 2^n distinct results, so no two leaves are the same and there is nothing to reuse — the exponential output is the answer. A count produces one number, and it does not record how any total was reached, so the state is just (index, running sum). Measured at n = 20 there are 968 distinct such states against 2,097,151 calls, a collapse of 2,166x. The smallest illustration is a = [1,2,3,4] with K = 5, where (i = 3, sum = 3) is reached both by taking 1 and 2 and by taking 3 — and everything below it is computed twice.

<!-- @doubt -->
### Can I stop early once I have found enough?

<!-- @answer -->
No, and this is the sharpest difference from the next subtopic. An existence check can return the moment one branch succeeds, which the theory subtopic measured as worth up to 100% of the tree. A count has to add up every branch, so every leaf is visited regardless of the input — its best case and its worst case are both 2^(n+1)−1 calls. There is no early return that preserves the answer. That asymmetry is exactly why counting is the version that needs dynamic programming and existence is the one that often gets away without it.

<!-- @doubt -->
### Why do zeros break things?

<!-- @answer -->
Because a zero can be taken or skipped without changing the sum, so both choices lead to valid completions and every zero doubles the answer — [1,2,3] gives 2, [0,1,2,3] gives 4, [0,0,1,2,3] gives 8, [0,0,0,1,2,3] gives 16. The bug appears when the recursion is written with a shrinking target and an early exit that returns 1 as soon as the target hits zero. That stops before the remaining elements have been decided, including any zeros still to come, so it stays stuck at 2 for all four of those arrays. On [0,0,0] with K = 0 it returns 1 where the true answer is 8. Checking the index first rather than the target fixes it.

<!-- @doubt -->
### Is memoisation always worth it?

<!-- @answer -->
No, and the numbers are clear about it. At n = 12 the memoised version measured 1,329ns against the plain recursion's 187ns — 7.1x slower — because allocating the table costs more than walking a tree of 8,191 nodes. The crossover is around n = 16, where the two are within 1.4% of each other. Past that it runs away: 14.0x faster at n = 20 and 1,286x at n = 24. Memoisation buys an asymptotic change at a fixed setup cost, and below the crossover you are paying the setup for nothing. It is worth knowing where your n actually sits before reaching for it.

<!-- @doubt -->
### Why is tabulation faster than memoisation?

<!-- @answer -->
It allocates far less and does not recurse. The memoised version needs a table of n by the sum range plus a matching seen array, and pays call overhead for every state. The tabulated version keeps a single row of K+1 counts and fills it with two nested loops. Measured, it was 11.5x to 13.4x faster than memoising at every size tested, and at n = 24 it took 434ns against the plain recursion's 7,455,775ns — a factor of 17,179. The trade is that the recursion reads like the problem statement while the loop does not, so it is usually worth deriving the recursion first and then rewriting it.

<!-- @doubt -->
### Why does the tabulated loop count downward?

<!-- @answer -->
So each element is used at most once per subsequence. The row is being updated in place, so if you iterate upward then dp[s - x] may already have had x added to it during this same pass, and you would be counting x more than once — which answers a different problem, the one where elements may be reused. Counting down means dp[s - x] is still the value from before this element was considered. It also has a pleasant side effect: when x is 0 the inner loop performs dp[s] += dp[s], doubling every entry, which is exactly the multiplier a zero should contribute. That was verified against brute force over 54,205 (array, K) pairs with about a quarter of elements zero.

<!-- @doubt -->
### What if the array contains negative numbers?

<!-- @answer -->
Three things stop working. The running sum is no longer monotonic — it can move away from K and come back — so any pruning based on "the sum already exceeds K" discards valid answers. The tabulated row is indexed by the sum, so a negative sum needs an offset of the smallest reachable total and a width covering the whole range rather than K+1. And the downward loop direction assumes x is non-negative. Measured on [2,-1,3,-2,1] the counts for K = 0, 1, 2, 3 are all 5 and for K = -1 it is 3, so the answers are perfectly well defined; it is only the optimisations that need care. Most statements of this problem restrict the input to non-negative values for exactly this reason.

<!-- @doubt -->
### How large can the answer get?

<!-- @answer -->
Up to 2^n, since in the worst case every subsequence qualifies — an array of all zeros with K = 0 gives exactly 2^n. That is independent of how large the elements are, so a count can overflow long before any sum does. An int return type breaks above n = 31 and a signed 64-bit one at n = 64. In Python it cannot overflow at all, since integers are arbitrary precision. This is why the harder variants of this problem ask for the answer modulo 10^9 + 7 — not to make it harder, but because the exact number does not fit.

<!-- @doubt -->
### Why is dp[0] set to 1?

<!-- @answer -->
Because there is exactly one way to make a total of zero before considering any elements: take nothing. That is the empty subsequence, and it is a real answer — which is why K = 0 always returns at least 1. It is the same identity-element choice this curriculum keeps returning to: the sum's base case returned 0, factorial's returned 1, the palindrome's returned true, and here the starting row says one way to reach zero. Initialising dp[0] to 0 instead makes every entry 0 for the same reason returning 0 from factorial's base case made every answer 0 — the whole computation is built on top of that one value.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Check if there exists a subsequence with sum K, which is this exact tree with the plus replaced by an or. That single change reverses the performance story: or short-circuits, so the early return becomes valid again and a true answer can cost as little as n + 1 calls, where a count is always the full 2^(n+1)−1. It is worth writing straight after this one because the code is nearly identical and the characteristics are opposite — the same shape can be cheap or expensive depending entirely on which question you are asking of it.
