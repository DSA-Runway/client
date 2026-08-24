---
id: combination-sum-iii
topic: Advanced Recursion
title: Combination Sum III
difficulty: Medium
status: ready
prerequisites:
  - combination-sum-ii
  - combination-sum
  - subsets-ii
  - power-set
  - time-and-space-complexity-basics
relatedIds:
  - combination-sum
  - combination-sum-ii
  - subsets-ii
  - power-set
---

<!-- @summary -->
The third guard in the family, and the first one that is complete. Combination Sum's overshoot test left 80.7% of nodes as dead ends because it could only refuse a branch that already exceeded the target, never one that could not reach it. Fixing the combination size changes that: with a known number of slots left and candidates drawn from 1 to 9, the smallest and largest reachable sums are both O(1), and every sum between them is achievable. Measured across all 405 inputs, that takes the dead-end rate from 80.7% to exactly **0.0%** and the node count from 126,675 to 1,990.

<!-- @theory -->
## The problem

Find every combination of exactly `k` distinct numbers from 1 to 9 summing to
`n`. Each number may be used at most once.

```
k = 3, n = 9  ->  [1,2,6]  [1,3,5]  [2,3,4]
```

Two things are fixed by the statement rather than by the input: the candidates
are always 1 through 9, and each is used at most once. So the entire search
space is the 2^9 = 512 subsets of a nine-element set, whatever k and n are.

## Two constraints, and one of them is different

This is Combination Sum II's recursion with the duplicates removed and a size
constraint added. Both constraints look alike — the sum must equal n, the count
must equal k — but they behave completely differently as guards, and that is the
whole point of doing this problem after the other two.

## Why the sum guard was never complete

Combination Sum and Combination Sum II both carried `a[i] <= rem`. It refuses a
branch that would *immediately* overshoot, and nothing else. A branch that leaves
`rem = 1` with no candidate below 2 is accepted, explored, and found barren one
level down. That is why those files measured 80.7% and 67.6% dead ends: the
honest question — *can rem still be formed from what is left* — is subset-sum
reachability, which is not O(1) from the carried state.

Carried over here unchanged, it does no better:

| guard | nodes | dead ends | rate |
|---|---|---|---|
| check only at the leaf | 126,675 | 102,201 | 80.7% |
| sum overshoot only | 71,881 | 58,416 | **81.3%** |

Adding the overshoot test to the naive version removes 43% of the nodes and the
dead-end *rate* does not improve at all — it rises slightly. The guard is
removing dead ends and live nodes in about the same proportion, which is exactly
what an incomplete guard does.

## The size constraint makes the sum checkable

Fixing k changes the question. At any node there are `slots` values still to
choose, and they must come from `i+1 .. 9`. So the remaining sum is bounded:

```
min reachable = (i+1) + (i+2) + ... + (i+slots)      the smallest slots values left
max reachable =    9   +   8   + ... + (9-slots+1)   the largest slots values left
```

Both are O(1) from a prefix-sum table of 1..9. And the crucial part is that
**every value between them is achievable** — the reachable sums form a
contiguous interval with no gaps. Verified exhaustively for every `(lo, r)` with
`lo` in 1..9: the achievable sums of `r` distinct values from `lo..9` are exactly
`[min, max]`, no exceptions.

That makes `min <= need <= max` not a heuristic but a *decision procedure*. A
branch passes the test if and only if it contains at least one solution.

## Complete pruning, measured

| guard | nodes | dead ends | rate |
|---|---|---|---|
| check only at the leaf | 126,675 | 102,201 | 80.7% |
| sum overshoot only | 71,881 | 58,416 | 81.3% |
| **size + reachable-sum bounds** | **1,990** | **0** | **0.0%** |

Zero, exactly, across all 405 `(k, n)` pairs — 129 of which have solutions —
producing all 511 combinations, which is 2^9 − 1 as it must be. The node count
falls **63.7x** against the naive version, and every node the recursion enters
provably leads to at least one answer.

Timing follows, on a full sweep of all 405 pairs, min of 200 with each form
measured twice in opposite order:

| form | C++ | vs bounded | Python | vs bounded |
|---|---|---|---|---|
| check only at the leaf | 757.0µs | 8.81x | 23.88ms | 12.55x |
| sum overshoot only | 456.1µs | 5.29x | 15.47ms | 8.09x |
| size + reachable-sum bounds | **85.9µs** | 1.00x | **1.91ms** | 1.00x |
| enumerate all 512 masks | 328.8µs | 3.83x | 41.78ms | 21.94x |

Note what this does *not* say. This is a small problem — the whole space is 512
subsets and a full sweep takes 86 microseconds — so these numbers are reported
because the exact node counts explain them, not because the timings would matter
in a real program. The 0.0% dead-end rate is the finding; the microseconds are
the confirmation.

## Why it works here and not in general

The completeness comes from the *candidates*, not from the size constraint alone.
A contiguous range has no gaps in its reachable sums; an arbitrary set does:

| pool | r | achievable sums | gaps |
|---|---|---|---|
| 1..5 | 2 | 3,4,5,6,7,8,9 | none |
| 1..5 | 3 | 6,7,8,9,10,11,12 | none |
| {1,5,9} | 2 | 6,10,14 | 7,8,9,11,12,13 |
| {2,3,5,7,11} | 2 | 5,7,8,9,10,12,13,14,16,18 | 6,11,15,17 |

So `min <= need <= max` is a decision procedure only because the candidates are
1 through 9. On `{1,5,9}` it would accept `need = 8` with two slots and find
nothing. The general lesson is the useful one: a bound test is complete exactly
when the reachable set is an interval, and it is worth knowing which of those
two facts you are relying on.

## The whole problem fits in a table

Because the candidate set is fixed at nine elements, every possible answer to
every possible query is contained in the 512 subsets. Enumerate them once,
bucket each by (popcount, sum), and any `(k, n)` becomes a lookup:

- build once: **96.3µs**, about the cost of one guided sweep
- 405 queries afterwards: **208ns total**, or 0.51ns each

That is the right answer when the function is called more than once, and it is
available only because k and n are bounded by the statement — n cannot exceed
45 and k cannot exceed 9. None of the earlier problems in this family had that
property.

## The arc

| recursion | nodes / result | dead ends |
|---|---|---|
| power set, loop form | 1.000 | 0% |
| subsets I | 1.000 | 0% |
| subsets II | 1.000 | 0% |
| no adjacent 1s | 2.618 = phi^2 | 0% |
| parentheses (n = 12) | 4.968 | 0% |
| combination sum | 37.13 | 80.7% |
| combination sum II | 6.91 | 67.6% |
| **combination sum III** | **3.89** | **0.0%** |

The two outliers were outliers because of the guard, not because of the target.
Give the recursion enough structure to answer *can this branch finish* in O(1)
and the dead ends disappear — which is what the earlier files claimed would take
a reachability table, and here comes free from the problem statement.

## Where this goes next

**Word Break** leaves this family. The recursion is over positions in a string
rather than over a candidate list, the branching factor is the number of
dictionary words matching at the current position rather than a fixed two, and
the same prefix is reachable by many different splits — which makes it the first
problem here where memoisation, rather than pruning, is the thing that changes
the complexity.

<!-- @intuition -->
This is the same loop the last three subtopics used, with the duplicates gone and a size constraint added — and the size constraint is what finally makes the sum constraint checkable. On its own, `a[i] <= rem` can only refuse a branch that already overshot; it can never tell that a branch will fall short, because deciding that is subset-sum reachability. Fix the number of values still to choose and the picture changes: those values must come from what is left of 1..9, so the smallest and largest sums they could make are both a subtraction away, and because the candidates form a contiguous range every sum in between is actually achievable. That turns a bound into a decision procedure, and the dead ends go to exactly zero. The caveat worth carrying is that the completeness comes from the candidates being contiguous, not from the size constraint by itself — on a pool with gaps the same test accepts branches that cannot finish.

<!-- @approach -->
### Check Only at the Leaf

<!-- @idea -->
Walk every way of choosing k values from 1 to 9 and test the sum at the bottom.

<!-- @steps -->
1. Carry a start value, the remaining sum, and the number of slots still to fill.
2. When no slots remain, keep the combination if the remainder is exactly zero.
3. Otherwise loop i from start to 9.
4. Take i, recurse with one fewer slot and the remainder reduced by i, then undo.
5. Impose no condition on any branch, so every combination is built before being judged.

<!-- @complexity -->
- time: Θ(k · C(9, k)) per query, independent of n
- space: O(k) stack, plus the output
- note: The baseline that shows what the guards are worth. Across all 405 (k, n) pairs it walks 126,675 nodes of which 102,201 — 80.7% — produce nothing. Measured 757.0µs for a full sweep in C++ and 23.88ms in Python, 8.81x and 12.55x the guarded version. It is the only form here that ever builds a combination which cannot possibly sum correctly.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void collect(int start, int rem, int slots, vector<int>& cur,
             vector<vector<int>>& out) {
    if (slots == 0) {
        if (rem == 0) out.push_back(cur);
        return;
    }
    for (int i = start; i <= 9; i++) {
        cur.push_back(i);
        collect(i + 1, rem - i, slots - 1, cur, out);
        cur.pop_back();
    }
}
```

<!-- @annotations -->
- 6: The slot count is the only thing driving termination here, which is why this version's cost is independent of n — it walks the same C(9, k) combinations whatever the target.
- 7: The sum is tested once, at the bottom, after the whole combination has been built. Everything the guarded versions do is a matter of moving this test earlier.
- 11: i + 1, so each value is used at most once — the rule Subsets I and Combination Sum II both use, unchanged.

<!-- @code java -->
```java
static void collect(int start, int rem, int slots, List<Integer> cur,
                    List<List<Integer>> out) {
    if (slots == 0) {
        if (rem == 0) out.add(new ArrayList<>(cur));
        return;
    }
    for (int i = start; i <= 9; i++) {
        cur.add(i);
        collect(i + 1, rem - i, slots - 1, cur, out);
        cur.remove(cur.size() - 1);
    }
}
```

<!-- @annotations -->
- 4: The copy, as everywhere in this topic — adding cur itself stores one aliased list that reads as empty once the recursion unwinds.
- 10: remove(int) removes by index. Since the list holds Integer, passing a boxed value would select remove(Object) and delete by value instead.

<!-- @code python -->
```python
def combination_sum3(k, n):
    out, cur = [], []

    def go(start, rem, slots):
        if slots == 0:
            if rem == 0:
                out.append(cur[:])
            return
        for i in range(start, 10):
            cur.append(i)
            go(i + 1, rem - i, slots - 1)
            cur.pop()

    if 1 <= k <= 9:
        go(1, n, k)
    return out


# 23.88ms to sweep all 405 (k, n) pairs, against 1.91ms for the bounded
# version — 12.55x, on 126,675 nodes against 1,990.
```

<!-- @annotations -->
- 12: The guard on k is not an optimisation but a bounds check: with k above 9 the loop simply finds nothing, and with k below 1 the base case fires immediately and would wrongly emit the empty combination for n = 0.

<!-- @approach -->
### Sum Overshoot Only

<!-- @idea -->
Carry Combination Sum's guard across unchanged — stop the loop once the candidate exceeds what is left.

<!-- @steps -->
1. Carry the same start value, remaining sum, and slot count.
2. Emit when the slots run out and the remainder is zero.
3. Loop i from start to 9.
4. Break out of the loop as soon as i exceeds the remainder, since every later i is larger.
5. Otherwise take i, recurse, and undo.

<!-- @complexity -->
- time: better than the leaf-check version by a constant, with the same shape
- space: O(k) stack, plus the output
- note: The guard the two earlier Combination Sum problems carry, and it is no more complete here. It removes 43% of the nodes — 71,881 against 126,675 — while the dead-end rate goes from 80.7% to **81.3%**, slightly worse. That is the signature of an incomplete guard: it discards live and dead nodes in roughly equal proportion. Measured 456.1µs per sweep in C++ and 15.47ms in Python.

<!-- @code cpp -->
```cpp
void collect(int start, int rem, int slots, vector<int>& cur,
             vector<vector<int>>& out) {
    if (slots == 0) {
        if (rem == 0) out.push_back(cur);
        return;
    }
    for (int i = start; i <= 9; i++) {
        if (i > rem) break;
        cur.push_back(i);
        collect(i + 1, rem - i, slots - 1, cur, out);
        cur.pop_back();
    }
}
```

<!-- @annotations -->
- 7: break rather than continue, valid because the candidates ascend — every later i is larger still. This is the same line Combination Sum and Combination Sum II both carry.
- 8: What it cannot see is a branch that will fall short. Taking i = 1 with two slots left and rem = 20 passes this test and cannot possibly finish, because 8 and 9 are the largest values available.

<!-- @code java -->
```java
static void collect(int start, int rem, int slots, List<Integer> cur,
                    List<List<Integer>> out) {
    if (slots == 0) {
        if (rem == 0) out.add(new ArrayList<>(cur));
        return;
    }
    for (int i = start; i <= 9; i++) {
        if (i > rem) break;
        cur.add(i);
        collect(i + 1, rem - i, slots - 1, cur, out);
        cur.remove(cur.size() - 1);
    }
}
```

<!-- @annotations -->
- 7: The overshoot test, unchanged from Combination Sum II. Removing it costs 43% more nodes; keeping it leaves 81.3% of the surviving nodes still barren.

<!-- @code python -->
```python
def combination_sum3(k, n):
    out, cur = [], []

    def go(start, rem, slots):
        if slots == 0:
            if rem == 0:
                out.append(cur[:])
            return
        for i in range(start, 10):
            if i > rem:
                break
            cur.append(i)
            go(i + 1, rem - i, slots - 1)
            cur.pop()

    if 1 <= k <= 9:
        go(1, n, k)
    return out


# 15.47ms per sweep, 8.09x the bounded version. Removes 43% of the nodes
# and moves the dead-end rate from 80.7% to 81.3% — the wrong direction.
```

<!-- @annotations -->
- 9: This test looks upward only. It knows a value is too big; it has no way to know the remaining slots cannot reach far enough.

<!-- @approach -->
### Size Plus Reachable-Sum Bounds

<!-- @idea -->
With the slot count known, compute the smallest and largest sums the remaining slots could make, and refuse any branch whose remainder falls outside that range.

<!-- @steps -->
1. Precompute prefix sums of 1 through 9, so any consecutive run sums in O(1).
2. At each candidate i, the remaining slots must be filled from i+1 upward.
3. Compute the smallest reachable sum as the next slots−1 values, and the largest as the top slots−1 values of the whole range.
4. Break out of the loop when the needed remainder falls below the smallest, since larger i only reduces it further.
5. Skip this i when the needed remainder exceeds the largest, and otherwise descend.

<!-- @complexity -->
- time: proportional to the answer, since every node entered leads to a solution
- space: O(k) stack, plus the output
- note: The first complete guard in this family. Across all 405 (k, n) pairs it walks 1,990 nodes with **zero** dead ends — 63.7x fewer than the leaf-check version — and produces all 511 combinations, 2^9 − 1. Completeness holds because the reachable sums of r distinct values from a contiguous range form an interval with no gaps, verified for every (lo, r) with lo in 1..9. Measured 85.9µs per sweep in C++ and 1.91ms in Python.

<!-- @code cpp -->
```cpp
int PRE[10];                      // PRE[v] = 1 + 2 + ... + v

int minFrom(int lo, int r) {      // smallest sum of r distinct values from lo..9
    if (r == 0) return 0;
    if (lo + r - 1 > 9) return -1;
    return PRE[lo + r - 1] - PRE[lo - 1];
}

int maxFrom(int lo, int r) {      // largest sum of r distinct values from lo..9
    if (r == 0) return 0;
    if (9 - r + 1 < lo) return -1;
    return PRE[9] - PRE[9 - r];
}

void collect(int start, int rem, int slots, vector<int>& cur,
             vector<vector<int>>& out) {
    if (slots == 0) {
        if (rem == 0) out.push_back(cur);
        return;
    }
    for (int i = start; i <= 9; i++) {
        int mn = minFrom(i + 1, slots - 1);
        int mx = maxFrom(i + 1, slots - 1);
        if (mn < 0 || mx < 0) break;
        int need = rem - i;
        if (need < mn) break;
        if (need > mx) continue;
        cur.push_back(i);
        collect(i + 1, need, slots - 1, cur, out);
        cur.pop_back();
    }
}
```

<!-- @annotations -->
- 5: A negative return marks impossible rather than a sum, since there are not enough values at or above lo to choose r of them.
- 12: The largest r values in the whole range are always the top r, so this does not depend on lo except through the feasibility test above it.
- 26: mn and mx bracket what the remaining slots can reach. Because the candidates are contiguous, every value in between is achievable — so this bracket decides the branch rather than merely bounding it, and the dead-end rate is exactly zero.
- 28: break, not continue. Once need falls below the smallest reachable sum, a larger i makes need smaller still, so the whole rest of the loop is dead.
- 29: continue, not break, on the other side. A too-large need means this i is too small; a larger i may still work.

<!-- @code java -->
```java
static int[] PRE = new int[10];

static int minFrom(int lo, int r) {
    if (r == 0) return 0;
    if (lo + r - 1 > 9) return -1;
    return PRE[lo + r - 1] - PRE[lo - 1];
}

static int maxFrom(int lo, int r) {
    if (r == 0) return 0;
    if (9 - r + 1 < lo) return -1;
    return PRE[9] - PRE[9 - r];
}

static void collect(int start, int rem, int slots, List<Integer> cur,
                    List<List<Integer>> out) {
    if (slots == 0) {
        if (rem == 0) out.add(new ArrayList<>(cur));
        return;
    }
    for (int i = start; i <= 9; i++) {
        int mn = minFrom(i + 1, slots - 1);
        int mx = maxFrom(i + 1, slots - 1);
        if (mn < 0 || mx < 0) break;
        int need = rem - i;
        if (need < mn) break;
        if (need > mx) continue;
        cur.add(i);
        collect(i + 1, need, slots - 1, cur, out);
        cur.remove(cur.size() - 1);
    }
}
```

<!-- @annotations -->
- 1: PRE must be filled before the first call — a static array is zeroed by the JVM, and a zeroed table makes every bound zero and every branch look reachable.
- 24: The two-sided test. One side breaks and the other continues, and swapping them silently loses answers rather than merely slowing the search.

<!-- @code python -->
```python
PRE = [0] * 10
for _v in range(1, 10):
    PRE[_v] = PRE[_v - 1] + _v


def combination_sum3(k, n):
    def min_from(lo, r):
        if r == 0:
            return 0
        return PRE[lo + r - 1] - PRE[lo - 1] if lo + r - 1 <= 9 else None

    def max_from(lo, r):
        if r == 0:
            return 0
        return PRE[9] - PRE[9 - r] if 9 - r + 1 >= lo else None

    out, cur = [], []

    def go(start, rem, slots):
        if slots == 0:
            if rem == 0:
                out.append(cur[:])
            return
        for i in range(start, 10):
            mn, mx = min_from(i + 1, slots - 1), max_from(i + 1, slots - 1)
            if mn is None or mx is None:
                break
            need = rem - i
            if need < mn:
                break
            if need > mx:
                continue
            cur.append(i)
            go(i + 1, need, slots - 1)
            cur.pop()

    if not 1 <= k <= 9:
        return out
    lo, hi = min_from(1, k), max_from(1, k)
    if lo is None or not lo <= n <= hi:
        return out
    go(1, n, k)
    return out


# 1.91ms per sweep against 23.88ms for the leaf-check version. 1,990
# nodes across all 405 (k, n) pairs, with zero dead ends.
```

<!-- @annotations -->
- 25: The same two-sided bracket, and the reason the recursion never enters a branch that cannot finish.
- 37: Applying the bracket once at the top rejects an impossible (k, n) without entering the recursion at all — 276 of the 405 pairs have no solution, and this answers them in O(1).

<!-- @approach -->
### Precompute the Whole Table

<!-- @idea -->
The candidates are always 1 to 9, so enumerate all 512 subsets once and bucket them by size and sum.

<!-- @steps -->
1. Note that k cannot exceed 9 and n cannot exceed 45, so the space of queries is finite and small.
2. Loop a mask over all 512 subsets of {1..9}.
3. For each, compute its size and its sum in one pass.
4. Append it to the bucket for that (size, sum) pair.
5. Answer any query by returning the bucket, with no search at all.

<!-- @complexity -->
- time: O(512 · 9) once, then O(1) per query
- space: O(511) for the table, which holds every combination that exists
- note: Available only because the statement bounds both k and n — none of the earlier problems in this family had that. Measured: the table builds in 96.3µs, about the cost of a single guided sweep, and 405 lookups afterwards take 208ns in total, or 0.51ns each. Scanning the masks per query instead is the wrong version of this idea: 328.8µs per sweep in C++ and 41.78ms in Python, where popcount is not a single instruction.

<!-- @code cpp -->
```cpp
vector<vector<int>> TABLE[10][46];

void build() {
    for (int m = 0; m < 512; m++) {
        int k = 0, s = 0;
        vector<int> v;
        for (int i = 0; i < 9; i++)
            if (m >> i & 1) { v.push_back(i + 1); s += i + 1; k++; }
        if (k >= 1 && s <= 45) TABLE[k][s].push_back(move(v));
    }
}

vector<vector<int>> combinationSum3(int k, int n) {
    if (k < 1 || k > 9 || n < 1 || n > 45) return {};
    return TABLE[k][n];
}
```

<!-- @annotations -->
- 6: Size and sum accumulate in the same pass over the bits, so the whole table costs one walk of 512 masks with nine steps each.
- 8: The empty subset is excluded, since k must be at least 1. Its sum is zero, which is outside the query range anyway.
- 13: The bounds test is what makes the lookup safe — without it a k of 12 or an n of 90 indexes outside the table.

<!-- @code java -->
```java
static List<List<List<Integer>>> TABLE = new ArrayList<>();

static void build() {
    for (int k = 0; k < 10; k++) {
        TABLE.add(new ArrayList<>());
        for (int s = 0; s < 46; s++) TABLE.get(k).add(new ArrayList<>());
    }
    for (int m = 0; m < 512; m++) {
        int k = Integer.bitCount(m), s = 0;
        List<Integer> v = new ArrayList<>();
        for (int i = 0; i < 9; i++)
            if ((m >> i & 1) == 1) { v.add(i + 1); s += i + 1; }
        if (k >= 1 && s <= 45) TABLE.get(k).get(s).add(v);
    }
}

static List<List<Integer>> combinationSum3(int k, int n) {
    if (k < 1 || k > 9 || n < 1 || n > 45) return new ArrayList<>();
    return TABLE.get(k).get(n);
}
```

<!-- @annotations -->
- 8: Integer.bitCount compiles to a single popcount instruction on any modern JVM, which is why the size need not be counted in the loop below.
- 18: Returning the stored list hands out a reference to the table's own data — a caller that mutates it corrupts every later query, so a defensive copy belongs here in anything but a puzzle.

<!-- @code python -->
```python
from collections import defaultdict

TABLE = defaultdict(list)
for _m in range(512):
    _v = [_i + 1 for _i in range(9) if _m >> _i & 1]
    if _v:
        TABLE[(len(_v), sum(_v))].append(_v)


def combination_sum3(k, n):
    return TABLE[(k, n)]


# The table holds all 511 combinations that exist. Scanning the 512
# masks per query instead measured 41.78ms per sweep against 1.91ms.
```

<!-- @annotations -->
- 3: defaultdict means a missing (k, n) returns an empty list rather than raising — but it also inserts that key, so a long-running process querying arbitrary pairs grows the table. A plain dict with .get is the safer choice.
- 11: No search of any kind. Every combination that could ever be an answer was built once, at import.

<!-- @example -->

<!-- @input -->
k = 3, n = 9

<!-- @output -->
[[1,2,6], [1,3,5], [2,3,4]]

<!-- @why -->
The canonical case, small enough to trace, and it already shows the lower bound firing.

<!-- @walkthrough -->
1. Three slots and a target of 9; the smallest possible sum is 1+2+3 = 6 and the largest is 7+8+9 = 24, so 9 is in range.
2. Taking 1 leaves need = 8 with two slots from 2..9, whose reachable range is [2+3, 8+9] = [5, 17], so it passes.
3. From [1], taking 2 leaves need = 6 with one slot from 3..9, range [3, 9] — 6 is reachable, and it gives [1,2,6].
4. Still from [1], taking 3 leaves need = 5 with one slot from 4..9, range [4, 9], giving [1,3,5].
5. Taking 4 from [1] would leave need = 4 with one slot from 5..9, whose smallest is 5 — so need falls below the minimum and the loop breaks, skipping 5 through 9 as well.
6. Back at the root, taking 2 gives [2,3,4], and taking 3 would need 6 from two values above 3, whose minimum is 4+5 = 9 — below the bound, so the root loop breaks too.
7. Three results, and the recursion never entered a branch that failed.

<!-- @example -->

<!-- @input -->
k = 2, n = 20

<!-- @output -->
[] — and the recursion is never entered

<!-- @why -->
An impossible query, and the case where the top-level bound answers in O(1) rather than by searching.

<!-- @walkthrough -->
1. Two values from 1..9 can sum to at most 8 + 9 = 17.
2. The requested 20 exceeds that, so the top-level check rejects it before any recursion starts.
3. That costs no nodes at all, where the leaf-check version would walk all 36 pairs.
4. Of the 405 (k, n) pairs in range, 276 are impossible like this one.
5. The same test rejects the other direction: k = 2 with n = 2 is below the minimum of 1 + 2 = 3.
6. The answer is the empty list, not a list containing the empty combination.
7. Answering impossible queries without searching is where the guard is doing the most work, even though it produces nothing.

<!-- @example -->

<!-- @input -->
The branch the overshoot test cannot refuse

<!-- @output -->
i = 1 with two slots and rem = 20 — accepted, and barren

<!-- @why -->
The concrete case that separates a bound from a decision procedure, and explains the 81.3% dead-end rate.

<!-- @walkthrough -->
1. With rem = 20 the test i > rem is false for every candidate, so the overshoot guard refuses nothing at all here.
2. Taking i = 1 leaves need = 19 to be made from two values in 2..9.
3. The largest two available are 8 and 9, summing to 17, so 19 is unreachable and this branch cannot finish.
4. The overshoot guard has no way to see that — it only ever compares a single candidate against the remainder.
5. The bounds guard computes max reachable as 17 directly and skips i = 1 without descending.
6. This is why adding the overshoot test to the naive version moved the dead-end rate from 80.7% to 81.3% rather than down.
7. It removes dead and live nodes in about the same proportion, which is what an incomplete guard does by definition.

<!-- @example -->

<!-- @input -->
All 405 (k, n) pairs

<!-- @output -->
511 combinations, 1,990 nodes, 0 dead ends

<!-- @why -->
The complete sweep, where the total is checkable against a number known in advance.

<!-- @walkthrough -->
1. Every non-empty subset of 1..9 is the answer to exactly one (k, n) query, so the totals must sum to 2^9 − 1 = 511.
2. All four approaches produce exactly 511, which is a genuine check rather than an internal consistency test.
3. The leaf-check version walks 126,675 nodes and 102,201 of them — 80.7% — yield nothing.
4. Adding the overshoot test brings that to 71,881 nodes, but 81.3% of those are still barren.
5. The bounds version walks 1,990 nodes and exactly zero are dead ends, a 63.7x reduction against the naive count.
6. That is 3.89 nodes per result, against 37.13 for Combination Sum and 6.91 for Combination Sum II.
7. Timing follows the counts — 757.0µs, 456.1µs and 85.9µs per sweep in C++ — though on a 512-subset problem the counts are the finding and the microseconds only confirm them.

<!-- @visualization custom -->

<!-- @description -->
Open on the branch the old guard cannot refuse, because it makes the whole file concrete in one picture. Show the state i = 1, two slots left, rem = 20, and draw the two tests side by side. The overshoot test compares 1 against 20 and passes; the bounds test computes the largest two values available from 2..9 as 8 + 9 = 17, sees that 19 is beyond it, and refuses. Label the first a bound on one value and the second a bound on the whole remainder, and mark that only the second can see a branch that will fall short.

The second panel is why the bounds test is exact rather than merely safe. Draw the number line of reachable sums for r values from lo..9 — take r = 2 from 3..9 as the worked case, marking every achievable sum 3+4 through 8+9 — and show the interval filled solid with no gaps. Beside it, put the same picture for a non-contiguous pool such as {1,5,9}, where r = 2 gives only 6, 10 and 14 and the interval is mostly holes. Caption the pair the bound decides the branch only when the reachable set is an interval, and note that 1..9 guarantees it while an arbitrary pool does not.

The third panel is the measurement, and it should show rate and count separately because they move in opposite directions. Three bars for nodes — 126,675, 71,881, 1,990 — and beside them three for the dead-end rate — 80.7%, 81.3%, 0.0%. Draw an arrow on the middle pair showing the node count falling while the rate rises slightly, annotated an incomplete guard removes live and dead nodes alike. Then the third pair dropping to zero, annotated complete.

Close with the arc, as a column of dead-end rates down the family: power set 0%, subsets I and II 0%, no adjacent 1s 0%, parentheses 0%, then combination sum 80.7% and combination sum II 67.6% standing out, and combination sum III returning to 0.0%. The caption should say that the two outliers were about the guard rather than the target, and that the size constraint is what made the target checkable.

<!-- @sampleInput -->
```json
{"primary":{"k":3,"n":9,"results":[[1,2,6],[1,3,5],[2,3,4]],"minPossible":6,"maxPossible":24,"why":"three slots from 1..9 reach [1+2+3, 7+8+9] = [6,24], and every value between is achievable"},"twoGuards":{"overshoot":{"test":"i > rem","sees":"a single candidate larger than what is left","cannotSee":"a branch that will fall short"},"bounds":{"test":"minFrom(i+1, slots-1) <= rem - i <= maxFrom(i+1, slots-1)","sees":"both directions","complete":true},"theBranch":{"i":1,"slots":2,"rem":20,"need":19,"maxReachable":17,"overshootVerdict":"accepted","boundsVerdict":"refused","note":"largest two values in 2..9 are 8 and 9"}},"deadEnds":{"allInputs":405,"feasible":129,"totalCombinations":511,"equals":"2^9 - 1","rows":[{"guard":"check only at the leaf","nodes":126675,"dead":102201,"rate":80.7},{"guard":"sum overshoot only","nodes":71881,"dead":58416,"rate":81.3},{"guard":"size + reachable-sum bounds","nodes":1990,"dead":0,"rate":0.0}],"nodeReduction":63.7,"nodesPerResult":3.89,"reading":"the overshoot test removes 43% of the nodes and moves the rate the wrong way, which is what an incomplete guard does"},"whyComplete":{"theorem":"the achievable sums of r distinct values from a contiguous range lo..9 form the interval [min,max] with no gaps","verifiedFor":"every (lo, r) with lo in 1..9","counterexamples":[{"pool":[1,5,9],"r":2,"sums":[6,10,14],"gaps":[7,8,9,11,12,13]},{"pool":[2,3,5,7,11],"r":2,"sums":[5,7,8,9,10,12,13,14,16,18],"gaps":[6,11,15,17]},{"pool":[1,2,4,8],"r":2,"sums":[3,5,6,9,10,12],"gaps":[4,7,8,11]}],"reading":"completeness comes from the candidates being contiguous, not from the size constraint alone"},"timing":{"sweep":"all 405 (k,n) pairs","minOf":200,"eachMeasuredTwice":true,"maxSpread":1.004,"cpp":{"unit":"us","leafCheck":757.0,"overshoot":456.1,"bounds":85.9,"maskScan":328.8,"ratios":{"leafCheck":8.81,"overshoot":5.29,"maskScan":3.83}},"python":{"unit":"ms","leafCheck":23.88,"overshoot":15.47,"bounds":1.91,"maskScan":41.78,"ratios":{"leafCheck":12.55,"overshoot":8.09,"maskScan":21.94}},"caveat":"the whole space is 512 subsets and a full sweep takes 86 microseconds — the node counts are the finding, the timings only confirm them"},"table":{"why":"k <= 9 and n <= 45 are fixed by the statement, so every possible answer fits in one table","buildUs":96.3,"lookups":405,"totalNs":208.0,"perQueryNs":0.51,"holds":511,"note":"available only here; none of the earlier problems in this family bound their input"},"arc":[{"recursion":"power set, loop form","nodesPerResult":1.000,"deadEndRate":0.0},{"recursion":"subsets I","nodesPerResult":1.000,"deadEndRate":0.0},{"recursion":"subsets II","nodesPerResult":1.000,"deadEndRate":0.0},{"recursion":"no adjacent 1s","nodesPerResult":2.618,"deadEndRate":0.0},{"recursion":"parentheses, n=12","nodesPerResult":4.968,"deadEndRate":0.0},{"recursion":"combination sum","nodesPerResult":37.13,"deadEndRate":80.7},{"recursion":"combination sum II","nodesPerResult":6.91,"deadEndRate":67.6},{"recursion":"combination sum III","nodesPerResult":3.89,"deadEndRate":0.0}]}
```

<!-- @highlights -->
- The state i = 1, two slots, rem = 20 is drawn with both tests applied side by side.
- The overshoot test compares 1 against 20 and passes; the bounds test computes 8 + 9 = 17 and refuses.
- They are labelled a bound on one value against a bound on the whole remainder.
- Only the second is marked as able to see a branch that will fall short.
- A number line shows every reachable sum for two values from 3..9, filled solid with no gaps.
- Beside it, {1,5,9} with r = 2 gives only 6, 10 and 14, mostly holes.
- The pair is captioned that the bound decides the branch only when the reachable set is an interval.
- Three node bars read 126,675, 71,881 and 1,990.
- Three dead-end bars beside them read 80.7%, 81.3% and 0.0%.
- An arrow on the middle pair shows the count falling while the rate rises.
- That pair is annotated an incomplete guard removes live and dead nodes alike.
- The third pair drops to zero and is annotated complete.
- A closing column lists dead-end rates down the whole family.
- Combination sum at 80.7% and combination sum II at 67.6% stand out against the zeros.
- Combination sum III returns the column to 0.0%.
- The caption states the two outliers were about the guard, not the target.

<!-- @edgeCases -->
- k = 1 — nine possible answers, one for each n from 1 to 9, and none for any other n.
- k = 9 — exactly one answer, [1..9], and only for n = 45.
- n below the minimum, such as k = 3 with n = 5 — impossible, since 1+2+3 = 6, and rejected at the top without recursing.
- n above the maximum, such as k = 2 with n = 20 — impossible, since 8+9 = 17, and rejected the same way.
- k = 0 — no valid combination; the guard on k must reject it, or the base case fires immediately and emits the empty combination for n = 0.
- k above 9 — impossible, since only nine candidates exist, and indexing a table without checking this reads out of bounds.
- n = 45 with k = 9 — the single largest case, and the only query whose answer uses every candidate.
- The 276 impossible (k, n) pairs of 405 — all answered in O(1) by the top-level bound.
- k = 4, n = 20 — the most solutions any single query has, at 12 combinations.
- Summing all 405 answers — must total 511, since every non-empty subset of 1..9 answers exactly one query.
- A caller mutating the returned list in the table version — corrupts every later query, since the table hands out its own storage.
- Java's static PRE array left unfilled — zeroed by the JVM, which makes every bound zero and every branch look reachable.
- Python's defaultdict in the table version — a missing key returns empty but is also inserted, so arbitrary queries grow the table.

<!-- @pitfalls -->
- Carrying only the overshoot test from Combination Sum. It cannot see a branch that will fall short, so 81.3% of the surviving nodes still produce nothing.
- Reading the node reduction as proof that a guard is complete. The overshoot test removes 43% of the nodes and moves the dead-end rate *up*, from 80.7% to 81.3%.
- Using break on both sides of the bounds test. Falling below the minimum means the rest of the loop is dead and break is right; exceeding the maximum means this i is too small and needs continue, and swapping them loses answers silently.
- Assuming the bounds test is complete for any candidate set. It is complete only because 1..9 is contiguous — on {1,5,9} it accepts a need of 8 with two slots and finds nothing.
- Forgetting the top-level bound. 276 of the 405 (k, n) pairs are impossible, and without it each one enters the recursion to discover that.
- Emitting the empty combination for k = 0. The base case fires immediately when slots is zero, so k must be checked before the first call.
- Indexing the table without bounds-checking k and n. A k of 12 or an n of 90 reads outside it.
- Leaving Java's static PRE array unfilled. It is zeroed by the JVM, so every bound comes out zero and the guard passes everything.
- Computing the maximum as the largest values overall rather than the largest still available. The bound must be taken over i+1..9, not 1..9, or it accepts branches that cannot finish.
- Scanning all 512 masks on every query. That is 328.8µs per sweep in C++ and 41.78ms in Python — the table is meant to be built once, not rebuilt per call.
- Returning the table's own list to the caller. A single mutation corrupts every later query.
- Treating the microsecond timings as the result. The whole space is 512 subsets; the exact node counts are the finding and the timings only confirm them.
- Expecting this technique to transfer to Combination Sum. There the candidates are arbitrary and unbounded, so the reachable sums have gaps and only a reachability table restores completeness.

<!-- @doubt -->
### Why is this guard complete when the earlier ones were not?

<!-- @answer -->
Because fixing k turns an open question into a bounded one. Combination Sum's guard could only ask *is this candidate bigger than what is left*, and the real question — *can the remainder still be formed* — is subset-sum reachability, which is not O(1) from the carried state. Fix the number of values still to choose and the remaining sum is trapped between the smallest and largest those slots could make, and both are a subtraction away from a prefix-sum table. Measured across all 405 (k, n) pairs, that takes the dead-end rate from 80.7% to exactly 0.0% and the node count from 126,675 to 1,990. Every node the recursion enters provably contains at least one answer.

<!-- @doubt -->
### Is it the size constraint that makes it complete?

<!-- @answer -->
Not by itself — the candidates matter as much. The bound `min <= need <= max` is a decision procedure only if every value between min and max is actually achievable, and that is true here because 1..9 is a contiguous range. Verified for every (lo, r) with lo in 1..9: the achievable sums of r distinct values from lo..9 are exactly the interval [min, max], with no gaps. On a pool with gaps the same test is merely a bound. Two values from {1,5,9} can make 6, 10 or 14, so a need of 8 passes the test and finds nothing. The general form of the lesson is that a bound test is complete exactly when the reachable set is an interval, and it is worth knowing which fact you are relying on.

<!-- @doubt -->
### Why did adding the overshoot test make the dead-end rate worse?

<!-- @answer -->
Because it removes live and dead nodes in roughly the same proportion. Going from the leaf-check version to the overshoot version drops the node count 43%, from 126,675 to 71,881, which is a real saving — but the dead-end rate moves from 80.7% to 81.3%, slightly the wrong way. That is the definition of an incomplete guard: it is not selecting for branches that will succeed, only for branches that have not failed yet. The rate is the better diagnostic of the two numbers, because it says whether the guard knows something about the future. A complete guard drives it to zero regardless of how many nodes remain.

<!-- @doubt -->
### Why break on one side of the bound and continue on the other?

<!-- @answer -->
Because the two failures mean opposite things. If `need` is below the smallest reachable sum, then taking a larger i makes need smaller still while the minimum only rises, so every remaining candidate fails too and the loop can break. If `need` is above the largest reachable sum, this i is too *small* — a larger i leaves less to make up and may well succeed — so the loop must continue. Swapping them does not merely slow the search; using break on the upper side abandons candidates that would have produced answers, and the failure is silent. This is the same asymmetry Combination Sum's sorted break relied on, applied to both ends at once.

<!-- @doubt -->
### How large can this problem get?

<!-- @answer -->
It cannot. Both bounds are fixed by the statement: at most nine candidates, so k is at most 9, and n is at most 1+2+...+9 = 45. That gives 405 possible queries, of which 129 have any solution, and 511 total combinations across all of them — which is 2^9 − 1, since every non-empty subset of 1..9 answers exactly one query. That is what makes the table approach available: enumerate the 512 subsets once, bucket by (size, sum), and every query is a lookup. Measured, the build takes 96.3µs — about one guided sweep — and 405 lookups afterwards take 208ns in total. None of the earlier problems in this family bound their input, so none of them had this option.

<!-- @doubt -->
### Which approach should I write?

<!-- @answer -->
The bounded recursion, unless the function is called repeatedly. It is the fastest single-query form in both languages — 85.9µs against 757.0µs for the leaf-check version in C++, and 1.91ms against 23.88ms in Python, over a full sweep — and it is the one that teaches something transferable, since the reasoning about complete versus incomplete guards applies well beyond this problem. If the function is called more than once, precompute the table: it costs about one sweep to build and answers each query in half a nanosecond. The mask-scanning version is the wrong middle ground — it does the table's work on every call, and in Python where popcount is not an instruction it is the slowest of all four at 41.78ms.

<!-- @doubt -->
### Does the bounds technique transfer to Combination Sum?

<!-- @answer -->
Not directly, and the reason is instructive. Combination Sum has no size constraint, so there is no slot count to bound the remaining sum with, and its candidates are arbitrary rather than contiguous, so even with one the reachable sums would have gaps. Both of the ingredients are missing. What restores completeness there is the reachability table that subtopic measured — O(n · target) precomputation that takes its dead-end rate from 80.7% to zero and its node count down 5.17x. The comparison is worth holding onto: the same goal, complete pruning, costs a table in one problem and comes free from the problem statement in the other.

<!-- @doubt -->
### Why are the timings reported in microseconds?

<!-- @answer -->
Because the problem really is that small, and it would be dishonest to present it otherwise. The whole search space is 512 subsets, and a sweep of all 405 possible queries takes 86 microseconds with the bounded guard. At that scale the wall clock is mostly measuring loop overhead, which is why the exact node counts carry the argument here and the timings only confirm that they translate. The counts are the durable result — 126,675 against 71,881 against 1,990, with dead-end rates of 80.7%, 81.3% and 0.0% — because they are machine-independent and exactly reproducible, where the microseconds are neither.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
**Word Break** leaves the subset family. The recursion runs over positions in a string rather than over a candidate list, so the branching factor is the number of dictionary words matching at the current position rather than a fixed two, and — the part that actually changes the complexity — the same position is reachable through many different splits. That makes it the first problem in this topic where the win comes from *memoisation* rather than from pruning: the tree is not full of branches that cannot finish, it is full of branches that have already been computed. Every guard measured across these three Combination Sum files is answering a different question from the one Word Break needs.
