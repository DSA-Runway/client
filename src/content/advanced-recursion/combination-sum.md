---
id: combination-sum
topic: Advanced Recursion
title: Combination Sum
difficulty: Medium
status: ready
prerequisites:
  - power-set
  - generate-parentheses
  - learn-all-patterns-of-subsequences-theory
  - count-all-subsequences-with-sum-k
  - time-and-space-complexity-basics
relatedIds:
  - power-set
  - generate-parentheses
  - count-all-subsequences-with-sum-k
  - learn-all-patterns-of-subsequences-theory
---

<!-- @summary -->
Power Set's loop with one character changed — recurse on i rather than i + 1, so elements may be reused — and a target added. Two things break with the series. The recursion depth stops being n and becomes target/min(a), which is the first depth this course cannot bound from the input length. And the guard stops being complete: 80.7% of nodes are dead ends where the previous three subtopics had exactly zero. Measured, the two standard fixes for that are worth 1.00x and 1.01x in C++, while precomputing reachability — which nobody teaches — is worth 2.96x and drives dead ends to zero.

<!-- @theory -->
## The problem

Given distinct candidates and a target, list every combination summing to the
target. Any candidate may be used **any number of times**.

```
a = [2, 3, 6, 7], target = 7  ->  [2, 2, 3]  [7]
```

Order within a combination does not matter, and `[2,2,3]` and `[3,2,2]` are the
same answer — so the recursion must generate each multiset once.

## One character

Power Set's loop form was:

```
collect(start):  emit; for i in start..n-1: take a[i], recurse(i+1), undo
```

Combination Sum is the same loop with `i` in place of `i + 1`, plus a target
carried down:

```
collect(start, rem):  if rem == 0 emit; for i in start..n-1: take a[i], recurse(i, rem-a[i]), undo
```

Recursing on `i` leaves `a[i]` available at the next level, which is what
permits reuse. Recursing on `i + 1` is the Power Set behaviour and gives
subsets instead — and on the same input the difference is not subtle:

| a | target | recurse on i | recurse on i + 1 |
|---|---|---|---|
| [2,3,6,7] | 7 | 2 results | 1 |
| [2,3,5] | 8 | 3 results | 1 |
| [2,3,5,7] | 14 | 9 results | 1 |

Starting the loop at `start` rather than 0 is what stops `[2,2,3]` and
`[3,2,2]` both appearing: an element may repeat, but the indices never go
backwards, so each multiset is generated in exactly one order.

## The guard is the base case now

In the previous three subtopics the guard was an optimisation. Remove the
`open < n` check from Generate Parentheses and you still get a terminating
recursion, just a wasteful one that builds invalid strings. Remove the target
check here and the recursion never terminates at all — `rem` keeps decreasing
past zero forever, because `a[i]` can always be taken again.

So `rem == 0` and `a[i] <= rem` are not tuning. They are the only reason the
tree is finite. That is a genuinely new situation for the series.

## Depth stops being n

Every earlier recursion here had depth exactly `n`: one frame per element,
per character, per pair of brackets. This one does not. The loop form's depth
is the length of the longest combination, which is

```
target / min(a)
```

and `n` does not appear. Verified exactly:

| a | n | target | measured depth | target/min(a) |
|---|---|---|---|---|
| [2,3,5] | 3 | 20 | 10 | 10 |
| [2,3,5,7,11] | 5 | 50 | 25 | 25 |
| [2,3,5,7,11,13] | 6 | 80 | 40 | 40 |
| [7,11] | 2 | 700 | 100 | 100 |

The take/skip form is deeper still, at `target/min(a) + n − 1`, because its
skip branch also consumes a frame — measured 29 against the loop form's 25 at
n = 5, target = 50, and 45 against 40 at n = 6, target = 80.

This is a real hazard rather than a curiosity. With a `1` among the candidates
the depth equals the target, and in Python the default recursion limit of 1000
is reached quickly: with `a = [1, 2]` a target of **997 completes and 998
raises RecursionError**. The same target with `min(a) = 5` needs depth 200 and
is fine. Nothing about the input *length* warns you.

## The first imperfect pruning

The nodes-per-result and dead-end numbers across the series:

| recursion | nodes / result | dead ends |
|---|---|---|
| power set, loop form | 1.000 | 0% |
| power set, take/skip | 2.000 | 0% |
| no adjacent 1s | 2.618 = phi^2 | 0% |
| parentheses (n = 12) | 4.968 | 0% |
| **combination sum** | **37.13** | **80.7%** |

Every previous guard was *complete*: it refused exactly the branches that could
not lead to an answer, so no node was ever wasted. This one is not. `a[i] <= rem`
refuses only branches that overshoot **immediately**. A branch that leaves
`rem = 1` with `min(a) = 2` is accepted, explored, and found barren one level
down.

The reason is structural rather than sloppy. In the earlier problems, legality
was decidable in O(1) from the carried state — is the balance positive, was the
previous character a 1. Here the honest question is *can rem still be formed
from a[start:]*, and that is subset-sum reachability. It is not O(1), so the
cheap guard cannot be complete.

## Three choices that measure as nothing

Measured in C++ on `a = {2,3,5,7,11,13}`, `target = 200`, 143,713 results,
min of 9 with each form measured twice in opposite order:

| form | time | vs loop | nodes |
|---|---|---|---|
| loop, sorted + break | 26.119ms | 1.00x | 5,336,459 |
| loop, continue (no sort) | 25.926ms | **0.99x** | 5,336,459 |
| take/skip, pre-checked | 26.334ms | **1.01x** | 12,545,382 |
| reject on entry | 29.989ms | 1.15x | 7,208,924 |

Sorting so the loop can `break` instead of `continue` is the optimisation this
problem is famous for, and it is worth nothing: **the node count is identical**
— 5,336,459 either way — because `break` removes loop *iterations*, not nodes,
and the iterations it removes are a comparison each. This is exactly the
distinction Power Set made, arriving at the same null from the other direction.

Take/skip visits **2.35x** the nodes and costs 1.01x, so node count is a poor
proxy for time here — its extra nodes are shallow skip-frames that do nothing.
Only guard placement shows up at all, and modestly: rejecting on entry rather
than before descending costs 1.15x on 1.35x the nodes, the same lesson
Generate Parentheses measured at 1.60x.

Python disagrees about one of them, and in the way Power Set predicts:

| form | time | vs loop |
|---|---|---|
| loop, sorted + break | 50.90ms | 1.00x |
| loop, continue | 52.06ms | 1.02x |
| take/skip, pre-checked | 72.30ms | **1.42x** |

The sort-and-break null holds. But take/skip's 2.35x extra nodes cost 1.42x
here against 1.01x in C++, because what those nodes are is call frames — and
that is the one thing the two languages price completely differently.

## The one that works

If the cheap guard cannot be complete, buy a complete one. Precompute

```
reach[s][r]  =  can r be formed from a[s:], with reuse?
```

in `O(n · target)`, then refuse any branch whose remainder is unreachable.
Every surviving branch provably contains at least one solution:

| | nodes | dead ends | nodes/result | time |
|---|---|---|---|---|
| sorted + break | 5,336,459 | 80.7% | 37.13 | 26.119ms |
| reachability-pruned | 1,031,636 | **0.0%** | **7.18** | **8.813ms** |

**5.17x fewer nodes and 2.96x faster**, for a table of 1,407 cells — against
the 4,304,823 dead-end nodes it removes. Python agrees: 16.49ms against
50.90ms, **0.32x**. The table is smaller than the answer by four orders of
magnitude, and it is the only one of the four changes that pays.

The reason it is not the standard advice is worth stating: it costs
`O(n · target)` memory, which is unbounded in the target rather than the input
length, and on the small targets typical of interview inputs the 80.7% waste is
invisible. The lesson generalises past this problem — when a guard is
incomplete, the question is what a complete one would cost, and sometimes the
answer is a small table.

## Where this goes next

**Combination Sum II** removes the reuse — back to `i + 1` — but allows
duplicate values in the input, which is a different problem entirely: the
recursion must skip repeated values at the same level to avoid emitting the
same multiset twice. **Subsets II** is that same duplicate-handling on Power
Set. Both keep this loop shape, and both need the start index for exactly the
reason it exists here: it is what makes at this level expressible.

<!-- @intuition -->
Take Power Set's loop and change one character — recurse on i instead of i + 1 — and elements become reusable; add a target and the recursion has a reason to stop. Two things then break with everything before it. The depth is no longer n but target divided by the smallest candidate, so nothing about the input length tells you how deep the stack will go, and a 1 among the candidates makes the depth equal the target. And the guard is no longer complete. Every previous subtopic could decide legality in O(1) from the carried state, so pruning was perfect and no node was wasted; here the honest question is whether the remainder can still be formed at all, which is subset-sum reachability and not O(1). The cheap guard only catches immediate overshoot, and 80.7% of the tree turns out to be dead ends. The interesting part is what fixes it: the two famous shape optimisations measure as nothing, and precomputing a small reachability table — which is not the standard advice — removes every dead end and nearly triples the speed.

<!-- @approach -->
### Take or Skip, With Reuse

<!-- @idea -->
At each index either take that candidate again, leaving the index alone, or move past it for good.

<!-- @steps -->
1. Carry an index i, the remaining target, and a shared buffer.
2. If the remainder has reached zero, copy the buffer out and return.
3. If the index has passed the last candidate, return with nothing.
4. If a[i] fits in the remainder, append it and recurse on the same index, then undo — this is the reuse.
5. Recurse on i + 1 with the remainder untouched, permanently abandoning a[i].

<!-- @complexity -->
- time: O(n · target/min(a) · number of results) in practice, exponential in target/min(a)
- space: O(target/min(a) + n) stack, plus the output
- note: Depth is target/min(a) + n − 1, since the skip chain also consumes frames — measured 29 against the loop form's 25 at n = 5, target = 50. Visits 12,545,382 nodes against the loop form's 5,336,459, a factor of 2.35, yet measures 26.334ms against 26.119ms — 1.01x, because the extra nodes are shallow skip-frames. In Python the same 2.35x costs 1.42x, since there the nodes are call frames.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void collect(const vector<int>& a, int i, int rem, vector<int>& cur,
             vector<vector<int>>& out) {
    if (rem == 0) {
        out.push_back(cur);
        return;
    }
    if (i == (int)a.size()) return;
    if (a[i] <= rem) {
        cur.push_back(a[i]);
        collect(a, i, rem - a[i], cur, out);
        cur.pop_back();
    }
    collect(a, i + 1, rem, cur, out);
}
```

<!-- @annotations -->
- 11: The only place n enters the recursion at all. Everything else is driven by rem, which is why the depth has nothing to do with the input length.
- 12: Checked before descending rather than rejected on entry. The alternative — recurse first, return if rem < 0 — measured 1.15x slower on 1.35x the nodes.
- 14: i, not i + 1. This single character is the whole difference from Power Set: the candidate stays available, so it can be taken again at the next level.
- 17: The skip branch advances the index and leaves rem alone. This chain is why the depth is target/min(a) + n − 1 rather than the loop form's target/min(a).

<!-- @code java -->
```java
static void collect(int[] a, int i, int rem, List<Integer> cur,
                    List<List<Integer>> out) {
    if (rem == 0) {
        out.add(new ArrayList<>(cur));
        return;
    }
    if (i == a.length) return;
    if (a[i] <= rem) {
        cur.add(a[i]);
        collect(a, i, rem - a[i], cur, out);
        cur.remove(cur.size() - 1);
    }
    collect(a, i + 1, rem, cur, out);
}
```

<!-- @annotations -->
- 4: The copy is required for the same reason as everywhere in this topic — adding cur itself stores one aliased list that ends up empty.
- 10: Same index passed down, which is what makes the reuse unbounded rather than a single extra use.

<!-- @code python -->
```python
def combination_sum(a, target):
    a = sorted(a)
    out, cur = [], []

    def go(i, rem):
        if rem == 0:
            out.append(cur[:])
            return
        if i == len(a):
            return
        if a[i] <= rem:
            cur.append(a[i])
            go(i, rem - a[i])
            cur.pop()
        go(i + 1, rem)

    go(0, target)
    return out


# 72.30ms at target = 120 against the loop form's 50.90ms — 1.42x.
# The identical comparison in C++ measured 1.01x.
```

<!-- @annotations -->
- 13: go(i, ...) keeps the candidate in play. Writing go(i + 1, ...) here turns this into the subsets recursion and drops [2,2,3] entirely.

<!-- @approach -->
### Start-Index Loop With Reuse

<!-- @idea -->
Loop over the candidates from a start index and recurse on the same index, so each one may be taken repeatedly but the indices never go backwards.

<!-- @steps -->
1. Carry a start index, the remaining target, and the shared buffer.
2. If the remainder is zero, copy the buffer out and return — this is the only emit.
3. Loop i from start to the last candidate.
4. Skip a[i] if it exceeds the remainder, otherwise append it and recurse with start = i.
5. Undo the append and continue the loop, so each multiset is produced in exactly one index order.

<!-- @complexity -->
- time: exponential in target/min(a); 5,336,459 nodes for 143,713 results at target = 200
- space: O(target/min(a)) stack, plus the output
- note: Depth is exactly target/min(a), with n absent — verified at 10, 25, 40 and 100 across four inputs. Only 19.3% of nodes reach a solution; the other 80.7% are dead ends, the first non-zero figure in this series. Measured 25.926ms at target = 200, and 37.13 nodes per result.

<!-- @code cpp -->
```cpp
void collect(const vector<int>& a, int start, int rem, vector<int>& cur,
             vector<vector<int>>& out) {
    if (rem == 0) {
        out.push_back(cur);
        return;
    }
    for (int i = start; i < (int)a.size(); i++) {
        if (a[i] > rem) continue;
        cur.push_back(a[i]);
        collect(a, i, rem - a[i], cur, out);
        cur.pop_back();
    }
}
```

<!-- @annotations -->
- 8: The guard, applied before descending. It is incomplete — it refuses only immediate overshoot, so a branch leaving rem = 1 with min(a) = 2 is still explored and found barren one level down.
- 10: Passing i keeps the candidate available; passing i + 1 would make this Power Set. Starting the loop at start rather than 0 is the separate mechanism that stops [2,2,3] and [3,2,2] both appearing.

<!-- @code java -->
```java
static void collect(int[] a, int start, int rem, List<Integer> cur,
                    List<List<Integer>> out) {
    if (rem == 0) {
        out.add(new ArrayList<>(cur));
        return;
    }
    for (int i = start; i < a.length; i++) {
        if (a[i] > rem) continue;
        cur.add(a[i]);
        collect(a, i, rem - a[i], cur, out);
        cur.remove(cur.size() - 1);
    }
}
```

<!-- @annotations -->
- 8: Removing this test does not just cost nodes — it must be replaced by an if (rem < 0) return on entry, or nothing stops rem running negative forever. That entry-check variant is the one measured at 1.15x on 1.35x the nodes.
- 10: The same index, so the candidate can be taken again immediately.

<!-- @code python -->
```python
def combination_sum(a, target):
    out, cur = [], []

    def go(start, rem):
        if rem == 0:
            out.append(cur[:])
            return
        for i in range(start, len(a)):
            if a[i] > rem:
                continue
            cur.append(a[i])
            go(i, rem - a[i])
            cur.pop()

    go(0, target)
    return out


# 52.06ms at target = 120. Sorting so this can break instead of
# skipping measured 50.90ms — 1.02x, on an identical node count.
```

<!-- @annotations -->
- 8: range(start, len(a)) with go(i, ...) inside is the whole recursion. Combination Sum II and Subsets II both keep this line and change only what happens inside it.

<!-- @approach -->
### Sorted, With an Early Break

<!-- @idea -->
Sort the candidates so that once one exceeds the remainder, every later one does too and the loop can stop rather than skip.

<!-- @steps -->
1. Sort the candidates ascending before starting the recursion.
2. Carry a start index, the remaining target, and the shared buffer.
3. If the remainder is zero, copy the buffer out and return.
4. Loop i from start, and break out entirely the moment a[i] exceeds the remainder.
5. Otherwise append, recurse on the same index, and undo as before.

<!-- @complexity -->
- time: the same as the unsorted loop, plus O(n log n) for the sort
- space: O(target/min(a)) stack, plus the output
- note: This is the optimisation the problem is famous for and it is worth nothing measurable. The node count is identical to the continue version — 5,336,459 in both — because break removes loop iterations rather than nodes. Measured 26.119ms against 25.926ms in C++ (1.00x) and 50.90ms against 52.06ms in Python (1.02x). Sorting does still matter for Combination Sum II, where it is what makes duplicate values adjacent.

<!-- @code cpp -->
```cpp
void collect(const vector<int>& a, int start, int rem, vector<int>& cur,
             vector<vector<int>>& out) {
    if (rem == 0) {
        out.push_back(cur);
        return;
    }
    for (int i = start; i < (int)a.size(); i++) {
        if (a[i] > rem) break;
        cur.push_back(a[i]);
        collect(a, i, rem - a[i], cur, out);
        cur.pop_back();
    }
}

vector<vector<int>> combinationSum(vector<int> a, int target) {
    sort(a.begin(), a.end());
    vector<vector<int>> out;
    vector<int> cur;
    collect(a, 0, target, cur, out);
    return out;
}
```

<!-- @annotations -->
- 8: break rather than continue, valid only because a is sorted. It removes loop iterations but not one single node — the count is 5,336,459 either way — and measures 1.00x.
- 16: The sort is what licenses the break, and taking a by value is what keeps that reordering out of the caller's array. Reordering a caller's input is a side effect worth avoiding even when it looks harmless.

<!-- @code java -->
```java
static List<List<Integer>> combinationSum(int[] a, int target) {
    int[] s = a.clone();
    Arrays.sort(s);
    List<List<Integer>> out = new ArrayList<>();
    collect(s, 0, target, new ArrayList<>(), out);
    return out;
}

static void collect(int[] a, int start, int rem, List<Integer> cur,
                    List<List<Integer>> out) {
    if (rem == 0) {
        out.add(new ArrayList<>(cur));
        return;
    }
    for (int i = start; i < a.length; i++) {
        if (a[i] > rem) break;
        cur.add(a[i]);
        collect(a, i, rem - a[i], cur, out);
        cur.remove(cur.size() - 1);
    }
}
```

<!-- @annotations -->
- 2: a.clone() before sorting. Arrays.sort works in place, so without the copy this reorders the caller's array as a side effect.
- 16: The break. Correct only under the sort above it, and measured to save nothing — its value here is as the setup for Combination Sum II rather than as a speed change.

<!-- @code python -->
```python
def combination_sum(a, target):
    a = sorted(a)
    out, cur = [], []

    def go(start, rem):
        if rem == 0:
            out.append(cur[:])
            return
        for i in range(start, len(a)):
            if a[i] > rem:
                break
            cur.append(a[i])
            go(i, rem - a[i])
            cur.pop()

    go(0, target)
    return out


# 50.90ms at target = 120 against 52.06ms unsorted — 1.02x, and the
# node counts are identical. The famous optimisation is a null result.
```

<!-- @annotations -->
- 2: sorted(a) returns a new list rather than reordering the caller's. a.sort() would mutate the argument in place, which is the same side effect the C++ and Java versions guard against.

<!-- @approach -->
### Reachability-Pruned

<!-- @idea -->
Precompute whether each remainder is formable from each suffix, then refuse any branch that cannot possibly finish.

<!-- @steps -->
1. Sort the candidates and build a table reach[s][r], true when r can be formed from a[s:] with reuse.
2. Fill it with reach[s][0] = true for every s, since zero is always formable by taking nothing.
3. Fill the rest backwards: r is formable from a[s:] if it is formable from a[s+1:], or if r − a[s] is formable from a[s:].
4. Run the ordinary start-index loop, but skip any i whose remainder r − a[i] is not marked reachable.
5. Emit as before; every node now reached provably leads to at least one solution.

<!-- @complexity -->
- time: O(n · target) for the table, then output-proportional traversal
- space: O(n · target) for the table, plus the output
- note: Drives the dead-end rate from 80.7% to exactly 0.0% and the node count from 5,336,459 to 1,031,636 — 5.17x fewer — for a table of 1,407 cells against the 4,304,823 dead-end nodes removed. Nodes per result falls from 37.13 to 7.18. Measured 8.813ms against 26.119ms in C++ (0.34x, a 2.96x speedup) and 16.49ms against 50.90ms in Python (0.32x). The only one of the four forms here that changes the time.

<!-- @code cpp -->
```cpp
vector<vector<char>> reach;

void collect(const vector<int>& a, int start, int rem, vector<int>& cur,
             vector<vector<int>>& out) {
    if (rem == 0) {
        out.push_back(cur);
        return;
    }
    for (int i = start; i < (int)a.size(); i++) {
        if (a[i] > rem) break;
        if (!reach[i][rem - a[i]]) continue;
        cur.push_back(a[i]);
        collect(a, i, rem - a[i], cur, out);
        cur.pop_back();
    }
}

vector<vector<int>> combinationSum(vector<int> a, int target) {
    sort(a.begin(), a.end());
    int n = a.size();
    reach.assign(n + 1, vector<char>(target + 1, 0));
    for (int s = 0; s <= n; s++) reach[s][0] = 1;
    for (int s = n - 1; s >= 0; s--)
        for (int r = 1; r <= target; r++)
            reach[s][r] = reach[s + 1][r] || (r >= a[s] && reach[s][r - a[s]]);
    vector<vector<int>> out;
    vector<int> cur;
    if (reach[0][target]) collect(a, 0, target, cur, out);
    return out;
}
```

<!-- @annotations -->
- 11: The complete guard. Unlike the a[i] > rem test above it, this refuses every branch that cannot finish, which is what takes the dead-end rate from 80.7% to exactly zero.
- 22: Zero is formable from any suffix by taking nothing, which is the base of the table and the reason an exact hit on the target is always recognised.
- 25: The two cases are do not use a[s] at all, and use it and stay at s — the second is what makes the reuse unbounded, and it is why this row must be filled left to right.
- 28: Checking the table once before starting also handles the impossible target without entering the recursion at all.

<!-- @code java -->
```java
static boolean[][] reach;

static void collect(int[] a, int start, int rem, List<Integer> cur,
                    List<List<Integer>> out) {
    if (rem == 0) {
        out.add(new ArrayList<>(cur));
        return;
    }
    for (int i = start; i < a.length; i++) {
        if (a[i] > rem) break;
        if (!reach[i][rem - a[i]]) continue;
        cur.add(a[i]);
        collect(a, i, rem - a[i], cur, out);
        cur.remove(cur.size() - 1);
    }
}

static List<List<Integer>> combinationSum(int[] a, int target) {
    int[] s = a.clone();
    Arrays.sort(s);
    int n = s.length;
    reach = new boolean[n + 1][target + 1];
    for (int k = 0; k <= n; k++) reach[k][0] = true;
    for (int k = n - 1; k >= 0; k--)
        for (int r = 1; r <= target; r++)
            reach[k][r] = reach[k + 1][r] || (r >= s[k] && reach[k][r - s[k]]);
    List<List<Integer>> out = new ArrayList<>();
    if (reach[0][target]) collect(s, 0, target, new ArrayList<>(), out);
    return out;
}
```

<!-- @annotations -->
- 11: The same complete test. boolean[][] is allocated zeroed by the JVM, so only the true cells need writing.
- 26: Filled backwards over the suffix index and forwards over the remainder, which is what lets the reuse case read a cell already written in this same row.

<!-- @code python -->
```python
def combination_sum(a, target):
    a = sorted(a)
    n = len(a)
    reach = [[False] * (target + 1) for _ in range(n + 1)]
    for s in range(n + 1):
        reach[s][0] = True
    for s in range(n - 1, -1, -1):
        for r in range(1, target + 1):
            reach[s][r] = reach[s + 1][r] or (r >= a[s] and reach[s][r - a[s]])

    out, cur = [], []

    def go(start, rem):
        if rem == 0:
            out.append(cur[:])
            return
        for i in range(start, len(a)):
            if a[i] > rem:
                break
            if not reach[i][rem - a[i]]:
                continue
            cur.append(a[i])
            go(i, rem - a[i])
            cur.pop()

    if reach[0][target]:
        go(0, target)
    return out


# 16.49ms at target = 120 against the plain loop's 50.90ms — 0.32x.
# 1,407 table cells removed 4,304,823 dead-end nodes at target = 200.
```

<!-- @annotations -->
- 4: A fresh inner list per row. [[False] * (target + 1)] * (n + 1) would alias one row n + 1 times, and writing to any row would appear to write to all of them.
- 20: The complete guard, sitting directly under the incomplete one. Keeping both is worthwhile — the break exits the loop entirely while this only skips one candidate.

<!-- @example -->

<!-- @input -->
a = [2, 3, 6, 7], target = 7

<!-- @output -->
[[2, 2, 3], [7]] from 10 nodes, 5 of them dead ends

<!-- @why -->
The canonical case, small enough to trace completely, and it already shows the reuse and the 50% dead-end rate.

<!-- @walkthrough -->
1. From the root with rem = 7, the loop tries 2 first, leaving rem = 5 and staying at index 0.
2. Taking 2 again leaves rem = 3, and once more leaves rem = 1 — which is a dead end, since every candidate exceeds it.
3. Backtracking to rem = 3 and advancing to index 1 takes 3, leaving rem = 0, so [2, 2, 3] is emitted.
4. Continuing from rem = 5 with 3 gives rem = 2, then 6 and 7 both overshoot, so that branch dies.
5. Skipping ahead, 3 alone leaves rem = 4 which cannot be finished from index 1 onward, 6 leaves rem = 1, and 7 leaves rem = 0 so [7] is emitted.
6. Two results from 10 nodes, of which 5 produced nothing — a 50% dead-end rate at this tiny size.
7. The deepest path is [2, 2, 3] at depth 3, which is target/min(a) rounded down only because 7 is not divisible by 2.

<!-- @example -->

<!-- @input -->
a = [2, 3, 5], target = 8

<!-- @output -->
[[2, 2, 2, 2], [2, 3, 3], [3, 5]]

<!-- @why -->
Shows the same candidate used four times, which is what the index-staying recursion buys and what recursing on i + 1 would forbid.

<!-- @walkthrough -->
1. Taking 2 four times reaches rem = 0 exactly, giving [2, 2, 2, 2] at depth 4 = target/min(a).
2. Backing up to [2, 2] with rem = 4, taking 3 leaves rem = 1 and dies, and 5 overshoots.
3. From [2] with rem = 6, taking 3 leaves rem = 3, and taking 3 again gives [2, 3, 3].
4. From [3] with rem = 5, taking 3 leaves rem = 2 which cannot be made from index 1 onward, and taking 5 gives [3, 5].
5. Starting from 5 leaves rem = 3, which cannot be formed from index 2 onward, so that branch dies.
6. Three results, and the same recursion with go(i + 1) instead of go(i) yields only [3, 5] — one result instead of three.
7. Indices never decrease, which is why [3, 2, 3] never appears alongside [2, 3, 3].

<!-- @example -->

<!-- @input -->
a = [2], target = 1

<!-- @output -->
[] — no combinations

<!-- @why -->
The smallest impossible input, and the case where the reachability table pays for itself before the recursion starts.

<!-- @walkthrough -->
1. The root has rem = 1 and the only candidate is 2.
2. The guard a[i] > rem rejects it, the loop ends, and the function returns having emitted nothing.
3. That is 1 node and 1 dead end — a 100% dead-end rate.
4. The answer is the empty list, which is different from a list containing the empty combination.
5. The empty combination is only ever an answer when the target is 0, and that case emits at the root before the loop runs.
6. The reachability version computes reach[0][1] = false and never calls the recursion at all.
7. Returning [[]] here instead of [] is the classic error, and it comes from confusing this base case with Power Set's.

<!-- @example -->

<!-- @input -->
a = [2, 3, 5, 7, 11, 13], target = 200

<!-- @output -->
143,713 results from 5,336,459 nodes — or 1,031,636 with the table

<!-- @why -->
The measurement size, large enough for the dead-end rate and the reachability saving to be visible.

<!-- @walkthrough -->
1. The plain sorted loop visits 5,336,459 nodes to produce 143,713 results — 37.13 nodes per result.
2. Of those nodes 4,304,823 produce nothing at all, an 80.7% dead-end rate.
3. Switching break for continue changes the node count by exactly zero, and the time from 26.119ms to 25.926ms.
4. The take/skip form visits 12,545,382 nodes, 2.35x more, and still measures 26.334ms — 1.01x.
5. Rejecting on entry rather than before descending visits 7,208,924 nodes and costs 1.15x.
6. The reachability table has 1,407 cells and removes every one of the 4,304,823 dead ends, leaving 1,031,636 nodes.
7. That is 5.17x fewer nodes and 8.813ms against 26.119ms — a 2.96x speedup, and the only change here that moves the time.

<!-- @visualization custom -->

<!-- @description -->
Open with the one-character panel. Show Power Set's loop line and this one directly above each other, with only the recursive argument differing — recurse(i + 1) against recurse(i, rem - a[i]) — and highlight just that character. Beside it, the same tiny input a = [2,3,6,7] with target 7 run both ways: recursing on i gives [2,2,3] and [7], recursing on i + 1 gives only [7]. Label the mechanism plainly: staying at i keeps the candidate available, while starting the loop at start rather than 0 is the separate rule that stops [3,2,2] appearing beside [2,2,3].

The second panel is the depth change, and it should feel like a warning. Draw the earlier subtopics' trees as uniform-depth blocks labelled depth = n, then this one as a ragged tree whose depth is annotated target/min(a) with n crossed out. Put the verification table beside it — [2,3,5] target 20 depth 10, [2,3,5,7,11] target 50 depth 25, [7,11] target 700 depth 100 — so the reader sees n is absent from every row. Underneath, the concrete failure: a = [1,2] with target 997 completes and 998 raises RecursionError against Python's default limit of 1000, captioned nothing about the input length warns you.

The third panel is the dead-end story and is the heart of the page. Draw the tree for a = [2,3,6,7] target 7 with all 10 nodes, shading the 2 that produce results and hollowing the 5 dead ends, then scale up to a summary bar for target 200 showing 80.7% of 5,336,459 nodes producing nothing. Set that against a strip of the previous three subtopics all reading 0%, so the break in the series is unmistakable. Annotate why: earlier guards decided legality in O(1) from the carried state, while can rem still be formed is subset-sum reachability and is not O(1).

Close with the four-way measurement as bars of visibly telling length: sorted+break 26.119ms, continue 25.926ms, take/skip 26.334ms, reject-on-entry 29.989ms, and reachability-pruned 8.813ms set clearly apart. Mark the first three as within noise of each other and tag the node counts beneath — 5,336,459, 5,336,459, 12,545,382 — so the identical first two and the 2.35x third both land. Then the reachability bar with 1,031,636 nodes, 0.0% dead ends and the caption 1,407 table cells removed 4,304,823 nodes. The closing line should be that the three famous choices measure as nothing and the untaught one is worth 2.96x.

<!-- @sampleInput -->
```json
{"primary":{"a":[2,3,6,7],"target":7,"results":[[2,2,3],[7]],"nodes":10,"deadEnds":5,"deadEndRate":0.50,"maxDepth":3,"why":"recursing on i keeps the candidate available; starting the loop at start stops [3,2,2] appearing beside [2,2,3]"},"oneCharacter":{"powerSet":"recurse(i + 1)","combinationSum":"recurse(i, rem - a[i])","rows":[{"a":[2,3,6,7],"target":7,"onI":2,"onIPlus1":1},{"a":[2,3,5],"target":8,"onI":3,"onIPlus1":1},{"a":[2,3,5,7],"target":14,"onI":9,"onIPlus1":1}]},"depth":{"formula":"target/min(a)","takeSkipFormula":"target/min(a) + n - 1","nAbsent":true,"rows":[{"a":[2,3,5],"n":3,"target":20,"measured":10,"predicted":10},{"a":[2,3,5,7,11],"n":5,"target":50,"measured":25,"predicted":25},{"a":[2,3,5,7,11,13],"n":6,"target":80,"measured":40,"predicted":40},{"a":[7,11],"n":2,"target":700,"measured":100,"predicted":100}],"pythonLimit":{"limit":1000,"a":[1,2],"lastWorking":997,"firstFailing":998,"error":"RecursionError"}},"deadEnds":{"series":[{"recursion":"power set, loop form","nodesPerResult":1.000,"deadEndRate":0.0},{"recursion":"power set, take/skip","nodesPerResult":2.000,"deadEndRate":0.0},{"recursion":"no adjacent 1s","nodesPerResult":2.618,"deadEndRate":0.0},{"recursion":"parentheses, n=12","nodesPerResult":4.968,"deadEndRate":0.0},{"recursion":"combination sum","nodesPerResult":37.13,"deadEndRate":80.7}],"why":"earlier guards decided legality in O(1) from the carried state; can rem still be formed is subset-sum reachability and is not O(1)"},"timing":{"input":{"a":[2,3,5,7,11,13],"target":200,"results":143713},"cpp":{"unit":"ms","minOf":9,"eachMeasuredTwice":true,"maxSpread":1.02,"sortedBreak":26.119,"continueNoSort":25.926,"takeSkip":26.334,"rejectOnEntry":29.989,"reachability":8.813,"nodes":{"sortedBreak":5336459,"continueNoSort":5336459,"takeSkip":12545382,"rejectOnEntry":7208924,"reachability":1031636},"ratios":{"continueNoSort":0.99,"takeSkip":1.01,"rejectOnEntry":1.15,"reachability":0.34}},"python":{"unit":"ms","target":120,"results":14952,"minOf":7,"sortedBreak":50.90,"continueNoSort":52.06,"takeSkip":72.30,"reachability":16.49,"ratios":{"continueNoSort":1.02,"takeSkip":1.42,"reachability":0.32}},"reading":"break removes loop iterations, not nodes — the counts are identical; take/skip's 2.35x extra nodes cost 1.01x in C++ and 1.42x in Python because those nodes are call frames"},"reachabilityTable":{"definition":"reach[s][r] = can r be formed from a[s:] with reuse","cost":"O(n * target)","cells":1407,"deadEndsRemoved":4304823,"nodesBefore":5336459,"nodesAfter":1031636,"nodeSaving":5.17,"deadEndRateAfter":0.0,"nodesPerResultAfter":7.18,"speedup":{"cpp":2.96,"python":3.09},"whyNotStandard":"O(n * target) memory is unbounded in the target rather than the input length, and on small interview targets the 80.7% waste is invisible"}}
```

<!-- @highlights -->
- Power Set's loop line and this one stacked, with only the recursive argument differing.
- That single character is highlighted: recurse(i + 1) against recurse(i, rem - a[i]).
- The same input run both ways — two results against one — sits beside it.
- A ragged tree labelled target/min(a) replaces the earlier uniform depth = n blocks, with n crossed out.
- The verification table shows depths 10, 25, 40 and 100 with n absent from every row.
- The concrete failure is printed: a = [1,2] completes at target 997 and raises RecursionError at 998.
- The 10-node tree for target 7 has its 2 producing nodes shaded and its 5 dead ends hollow.
- A summary bar scales that to 80.7% of 5,336,459 nodes producing nothing at target 200.
- A strip of the previous three subtopics all reading 0% sits directly beneath it.
- That break in the series is annotated with why: legality was O(1), reachability is not.
- Five timing bars close the page, the first four visibly level and the fifth clearly shorter.
- Node counts are tagged beneath them: 5,336,459, 5,336,459, 12,545,382, 7,208,924, 1,031,636.
- The identical first two counts are marked, since break removes iterations rather than nodes.
- The reachability bar carries 0.0% dead ends and 7.18 nodes per result.
- Its caption reads 1,407 table cells removed 4,304,823 nodes.
- The closing line states that the three famous choices measure as nothing and the untaught one is worth 2.96x.

<!-- @edgeCases -->
- target = 0 — one answer, the empty combination, emitted at the root before the loop runs.
- An impossible target such as a = [2], target = 1 — the answer is [], not [[]].
- a containing 1 — every target is reachable and the depth equals the target, which is the worst case for the stack.
- a = [1, 2] with target 998 in Python — exceeds the default recursion limit of 1000, where 997 completes.
- A single candidate that divides the target exactly — one result, of length target/a[0].
- A single candidate that does not divide the target — no results, and the recursion walks a single chain to find that out.
- A candidate larger than the target — never entered at all, and skipped by the sorted break on the first iteration.
- All candidates larger than the target — the root is immediately a dead end and the answer is empty.
- Duplicate values in the input — this problem assumes distinct candidates; duplicates would produce the same multiset more than once, which is what Combination Sum II exists to handle.
- Very large target with small min(a) — the depth and the result count both explode, and the stack is the first thing to fail.
- The reachability table with a large target — O(n · target) memory is unbounded in the target rather than the input size, which is the reason it is not the default advice.
- A row of the Python reachability table built with list multiplication — aliases one row for every s, so a write to one appears in all.
- Sorting the caller's array in place — a side effect that survives the call, avoided by taking a copy in all three languages.

<!-- @pitfalls -->
- Recursing on i + 1 instead of i. That forbids reuse and turns this into the subsets recursion — [2,3,5] with target 8 drops from three results to one.
- Starting the loop at 0 instead of start. Indices then go backwards and [2,3,3], [3,2,3] and [3,3,2] all appear as separate answers.
- Omitting the target guard entirely. Unlike every earlier subtopic in this topic, that does not merely waste work — the recursion never terminates, because a candidate can always be taken again.
- Returning [[]] for an impossible target. The empty combination is an answer only when the target is 0; otherwise the answer is [].
- Assuming the recursion depth is n. It is target/min(a), so a 1 among the candidates makes the depth equal the target and a short input can still overflow the stack.
- Relying on Python's default recursion limit. With a = [1,2] a target of 998 raises RecursionError while 997 completes, and nothing about the input length predicts it.
- Expecting the sort-and-break to speed things up. It removes loop iterations but not one node — the count is identical at 5,336,459 — and measures 1.00x in C++ and 1.02x in Python.
- Judging the two shapes by node count. Take/skip visits 2.35x the nodes and costs 1.01x in C++, because the extra nodes are shallow skip-frames rather than work.
- Rejecting on entry rather than before descending. It creates a node per discarded branch, measured 1.15x here and 1.60x in Generate Parentheses.
- Calling the a[i] <= rem test complete pruning. It refuses only immediate overshoot, and 80.7% of the surviving nodes still produce nothing.
- Building the Python reachability rows with [[False] * (target + 1)] * (n + 1). That aliases a single row, so writing to any row writes to all of them.
- Sorting the caller's array in place. sort(a.begin(), a.end()) on a reference, a.sort() in Python or Arrays.sort on the argument all reorder the caller's data.
- Using the reachability table without checking reach[0][target] first. It works, but an impossible target then walks into the recursion instead of returning immediately.

<!-- @doubt -->
### What exactly changed from Power Set?

<!-- @answer -->
One character in the recursive call, plus a target. Power Set's loop recursed on i + 1, which retires each element after considering it; this recurses on i, which leaves it available so it can be taken again. On a = [2,3,5] with target 8 that is the difference between three results and one. The start index is unchanged and does the same job it did there: it stops the indices going backwards, which is what makes [2,2,3] and [3,2,2] the same path rather than two. What is genuinely new is the target, and it is not an optimisation — remove it and the recursion never terminates, because rem simply keeps decreasing forever.

<!-- @doubt -->
### Why is the depth not n?

<!-- @answer -->
Because the recursion is driven by the remainder, not by the input. Each level subtracts at least min(a) from rem, and the deepest path takes the smallest candidate every time, so the depth is target/min(a) and n does not appear. Verified exactly: [2,3,5] with target 20 goes to depth 10, [2,3,5,7,11] with target 50 to depth 25, and [7,11] with target 700 to depth 100 despite having only two candidates. The take/skip form is deeper at target/min(a) + n − 1, because its skip branch also spends a frame. This matters practically: with a 1 among the candidates the depth equals the target, and in Python a = [1,2] with target 998 raises RecursionError where 997 completes. Every earlier subtopic in this course had depth exactly n, so this is the first one where the input length tells you nothing about the stack.

<!-- @doubt -->
### Why are there dead ends here when there were none before?

<!-- @answer -->
Because the guard cannot be complete at this price. In the earlier problems legality was decidable in O(1) from the carried state — is the balance still positive, was the previous character a 1 — so refusing illegal branches refused exactly the branches that could not finish, and no node was wasted. Here the equivalent question is whether rem can still be formed from a[start:], which is subset-sum reachability and is not answerable in O(1). The cheap test a[i] <= rem catches only immediate overshoot, so a branch leaving rem = 1 with min(a) = 2 is accepted and found barren one level down. Measured at target = 200, 4,304,823 of 5,336,459 nodes — 80.7% — produce nothing, against 0% for power set, binary strings and parentheses.

<!-- @doubt -->
### Does sorting and breaking early actually help?

<!-- @answer -->
No, and the node counts say why before the clock does. break and continue produce exactly the same tree — 5,336,459 nodes either way at target = 200 — because break removes loop iterations, not nodes, and the iterations it removes cost one comparison each. Measured, 26.119ms sorted-with-break against 25.926ms unsorted-with-continue in C++, and 50.90ms against 52.06ms in Python. This is the same distinction Power Set drew between calls and iterations, reached from the other side. The sort is still worth writing, but for a different reason: Combination Sum II needs equal values adjacent so it can skip duplicates at the same level, and that is where the sort earns its place.

<!-- @doubt -->
### Take/skip or the start-index loop?

<!-- @answer -->
The loop, though the C++ measurement is nearly indifferent. Take/skip visits 12,545,382 nodes against the loop's 5,336,459 — 2.35x — and measures 26.334ms against 26.119ms, which is 1.01x. Its extra nodes are shallow skip-frames that do nothing but advance an index, so node count badly overstates the difference. Python does charge for them, at 1.42x, for the same reason Power Set found: those nodes are call frames and Python prices frames highly. The decisive argument is neither. The loop form is 4 frames shallower here and target/min(a) rather than target/min(a) + n − 1 in general, and it is the shape Combination Sum II and Subsets II extend, because skipping a duplicate at this level needs a loop index to be expressible at all.

<!-- @doubt -->
### What is the reachability table actually doing?

<!-- @answer -->
Answering the question the cheap guard cannot. reach[s][r] records whether r can be formed at all from a[s:] with unlimited reuse, filled in O(n · target) by the rule that r is formable from a[s:] if it is formable from a[s+1:] — do not use a[s] — or if r − a[s] is formable from a[s:], which is using it and staying put. With that table the recursion refuses any branch whose remainder is unreachable, so every node it enters provably leads to at least one solution. Measured, the dead-end rate goes from 80.7% to exactly 0.0%, nodes from 5,336,459 to 1,031,636, and nodes per result from 37.13 to 7.18. It is 8.813ms against 26.119ms — a 2.96x speedup — for 1,407 table cells.

<!-- @doubt -->
### If the table is that good, why is it not the standard solution?

<!-- @answer -->
Two honest reasons. Its memory is O(n · target), which is unbounded in the target rather than in the input length — a target of a million costs a million cells per candidate, where the recursion itself needs only the stack. And on the small targets typical of interview inputs the 80.7% waste is a few thousand nodes and invisible, so the plain version is fast enough and shorter. The general lesson survives the caveats though: when a guard is incomplete, it is worth asking what a complete one would cost, because the answer is sometimes a table far smaller than the search it prunes. Here it was 1,407 cells against 4,304,823 wasted nodes.

<!-- @doubt -->
### How do I avoid generating the same combination twice?

<!-- @answer -->
The start index does it, and it is the only thing that does. Because the loop begins at start and recurses with i rather than 0, the indices along any path are non-decreasing, so each multiset is built in exactly one order — [2,2,3] is reachable but [3,2,2] is not, since that would require going back to index 0 after index 1. Starting the loop at 0 instead breaks this immediately and yields [2,3,3], [3,2,3] and [3,3,2] as three separate answers. Note that this relies on the candidates being distinct. If the input can contain repeated values the same multiset becomes reachable through different index paths, and that needs an explicit skip of equal values at the same level — which is exactly Combination Sum II.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
**Combination Sum II** flips the reuse back off — recursing on i + 1 again — but allows duplicate values in the input, so the start index alone no longer guarantees each multiset once and the recursion must skip equal values at the same loop level. That is where the sort finally earns the place it did not earn here. **Subsets II** is the same duplicate-handling applied to Power Set with no target at all, and **Combination Sum III** adds a fixed combination size, which is a second guard that is complete and cheap — a useful contrast with the incomplete one here. All three keep this loop shape; what changes each time is what the loop refuses.
