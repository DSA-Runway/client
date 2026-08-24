---
id: combination-sum-ii
topic: Advanced Recursion
title: Combination Sum II
difficulty: Medium
status: ready
prerequisites:
  - combination-sum
  - power-set
  - generate-parentheses
  - learn-all-patterns-of-subsequences-theory
  - time-and-space-complexity-basics
relatedIds:
  - combination-sum
  - power-set
  - learn-all-patterns-of-subsequences-theory
  - generate-parentheses
---

<!-- @summary -->
Combination Sum with the reuse switched back off and duplicates allowed in the input, which is where the sort finally earns the place it did not earn last time. The headline is that the two standard fixes for the duplicate problem are not the same fix at different speeds: skipping equal values at the same loop level refuses the subtree, while deduplicating afterwards builds it and throws it away, and the gap is unbounded — 1.00x at no duplication and 529.90x at seven copies of each candidate. Also measured: take/skip visits exactly 2N − 1 nodes to the loop form's N on every input tested, and is 0.85x in C++ while being 1.21x in Python.

<!-- @theory -->
## The problem

Each candidate may be used **at most once**, and the input **may contain
duplicates**. List every distinct combination summing to the target.

```
a = [10, 1, 2, 7, 6, 1, 5], target = 8  ->  [1,1,6]  [1,2,5]  [1,7]  [2,6]
```

`[1,1,6]` is legal because there are two 1s at different positions. But
`[1,7]` must appear once, not twice, even though either 1 could have formed it.

## Two changes from Combination Sum

The recursion goes back to `i + 1` — each position is used at most once, which
is Power Set's rule. What is new is that positions holding equal values are
interchangeable, so the same multiset becomes reachable by more than one path.
That is the entire difficulty of this problem, and it is a new kind: every
earlier subtopic could produce each answer once by construction.

## The depth hazard is gone

Combination Sum's depth was `target/min(a)` with `n` absent, which made a short
input capable of overflowing the stack. Here each position is consumed once, so
the depth is bounded by both:

```
depth  <=  min(n, target / min(a))
```

Measured: 20 candidates of value 1 with target 10 goes to depth 10, thirty 2s
with target 20 goes to depth 10, and the eight distinct values 1..8 with target
20 stops at depth 5 because no six of them sum to 20 — an upper bound rather
than an equality. The important part is that `n` is back in the expression, so
the input length bounds the stack again.

## Two fixes that are not the same fix

The obvious repair is to generate everything as if the values were distinct and
remove duplicates at the end. The standard repair is one line inside the loop:

```
if (i > start && a[i] == a[i-1]) continue;
```

Both give the right answer. They are not the same operation. The skip refuses
the *subtree* before it is entered; the dedupe builds every duplicate in full
and then discards it. So the cost of the first tracks the answer and the cost
of the second tracks the duplication, and the gap has no ceiling.

Measured on `k` copies of each of {1,2,3,4,5}, target 10:

| k | n | results | skip-line nodes | dedupe-after nodes | raw results | ratio |
|---|---|---|---|---|---|---|
| 1 | 5 | 3 | 25 | 25 | 3 | **1.00x** |
| 2 | 10 | 12 | 59 | 208 | 51 | 3.53x |
| 3 | 15 | 18 | 80 | 986 | 324 | 12.32x |
| 4 | 20 | 22 | 93 | 3,451 | 1,342 | 37.11x |
| 5 | 25 | 25 | 101 | 9,973 | 4,341 | 98.74x |
| 6 | 30 | 27 | 106 | 25,221 | 11,922 | 237.93x |
| 7 | 35 | 28 | 109 | 57,759 | 29,106 | **529.90x** |

Read the two node columns rather than the ratio. The skip version **converges**
— 25, 59, 80, 93, 101, 106, 109 — because past a point extra copies of a value
cannot appear in any new answer, so they add nothing to the tree. The dedupe
version grows combinatorially, producing 29,106 raw results to yield 28
distinct ones. At k = 1 the two are identical, which is the honest control:
with no duplicates the skip line never fires.

## i > start, not i > 0

The condition is the part that gets written wrong, and the wrong version fails
quietly:

| a | target | `i > start` | `i > 0` |
|---|---|---|---|
| [10,1,2,7,6,1,5] | 8 | [1,1,6] [1,2,5] [1,7] [2,6] | **[1,1,6] missing** |
| [2,5,2,1,2] | 5 | [1,2,2] [5] | **[1,2,2] missing** |
| [1,1,1,1] | 2 | [1,1] | **[] — nothing at all** |

`i > 0` refuses a value whenever it equals its neighbour, anywhere. `i > start`
refuses it only when it equals its neighbour *and both are choices at this same
level*. The first copy at a level is always at `i == start`, so it is always
taken; later copies at that level are the ones that would repeat work. Choosing
a value that equals the one chosen at the level above is not a repeat — it is
how `[1,1,6]` is built — and `i > 0` cannot tell the difference.

## The sort is finally load-bearing

Combination Sum measured the sort as worth nothing: it licensed a `break` that
removed loop iterations but not one node. Here it is doing something else
entirely. `a[i] == a[i-1]` only detects duplicates that are **adjacent**, so
without the sort the skip line silently misses most of them:

| a | target | sorted | unsorted |
|---|---|---|---|
| [10,1,2,7,6,1,5] | 8 | 4 results | **6** — [1,2,5] and [1,7] twice |
| [2,5,2,1,2] | 5 | 2 results | **4** — [1,2,2] three times |
| [1,2,1,2,1] | 3 | 2 results | **7** — [1,2] six times |

So the sort is a correctness requirement here, not a tuning choice. That is the
promise the previous subtopic made, paid.

## Four shapes, and an exact identity

Measured in C++ on 14 copies of each of 1..16 (n = 224), target 50, 137,778
results, min of 7 with each form measured twice in opposite order:

| form | time | vs skip-line | nodes |
|---|---|---|---|
| skip equal at same level | 15.749ms | 1.00x | 951,862 |
| take/skip past all copies | 13.411ms | **0.85x** | 1,903,723 |
| frequency (value, count) | 16.955ms | 1.08x | 5,237,171 |

The take/skip form takes one copy on the left branch and, on the right,
advances past **every** copy of that value at once. Its node count is not
approximately double — it is exactly `2N − 1` where `N` is the loop form's,
verified on seven inputs from 3 nodes to 34,385. That is the left-child
right-sibling encoding of the same tree, and Power Set measured the identical
relation between its two forms.

Twice the nodes and yet **faster**, which is the strongest case this course has
measured for node count being a poor proxy for time: the take/skip nodes are
binary and predictable, while the loop form's inner test and `break` are not.
Python reverses it, as it has in every subtopic since Power Set:

| form | time | vs skip-line |
|---|---|---|
| skip equal at same level | 29.27ms | 1.00x |
| take/skip past all copies | 35.41ms | **1.21x** |
| frequency (value, count) | 49.75ms | 1.69x |

Same mechanism as before. The extra nodes are call frames; C++ barely charges
for them and Python charges a great deal, so 0.85x becomes 1.21x on identical
work.

## The arc

| recursion | nodes / result | dead ends |
|---|---|---|
| power set, loop form | 1.000 | 0% |
| power set, take/skip | 2.000 | 0% |
| no adjacent 1s | 2.618 = phi^2 | 0% |
| parentheses (n = 12) | 4.968 | 0% |
| combination sum | 37.13 | 80.7% |
| **combination sum II** | **6.91** | **67.6%** |

Still imperfect, for the same reason as last time — reachability is not O(1)
from the carried state — but far leaner than Combination Sum, because forbidding
reuse cuts the branching hard. The reachability table from that subtopic applies
here unchanged and would take the 67.6% to zero.

## Where this goes next

**Subsets II** is this problem with the target removed: duplicates in the input,
each position used once, every subset wanted. The skip line transfers verbatim,
which is the point — it is a property of duplicate handling, not of the target.
**Combination Sum III** goes the other way, keeping distinct candidates and
adding a fixed combination size, which is a guard that *is* complete and cheap —
a useful contrast with the incomplete one carried through both of these.

<!-- @intuition -->
Switch Combination Sum's reuse back off — recurse on i + 1 again — and allow the input to contain repeated values, and a genuinely new difficulty appears: the same multiset is now reachable by more than one path, because positions holding equal values are interchangeable. Every earlier subtopic produced each answer once by construction; this is the first that has to work at it. There are two repairs and they look like the same idea at different speeds, but they are not. Deduplicating at the end builds every duplicate in full and then throws it away, so its cost tracks how duplicated the input is; skipping equal values at the same loop level refuses the subtree before entering it, so its cost tracks the answer. With no duplicates the two are identical; at seven copies of each candidate one walks 109 nodes and the other 57,759. The one-line skip is also the point at which sorting stops being a tuning choice and becomes a correctness requirement, since the test only sees duplicates that are adjacent.

<!-- @approach -->
### Generate Everything, Deduplicate Afterwards

<!-- @idea -->
Treat equal values at different positions as distinct, collect every combination, then remove the repeats at the end.

<!-- @steps -->
1. Sort the candidates and run the ordinary at-most-once recursion, ignoring duplicates entirely.
2. At each level loop from the start index and recurse on i + 1, so no position is reused.
3. Emit whenever the remainder reaches zero, without checking whether this combination was seen before.
4. Collect the results in a hashable form, since the same multiset will appear more than once.
5. Filter to the distinct ones at the end and return those.

<!-- @complexity -->
- time: proportional to the number of *index* combinations, not the number of distinct answers
- space: O(target/min(a)) stack, plus every raw result before deduplication
- note: Correct, and the cost has no relation to the size of the answer. On k copies of each of {1,2,3,4,5} with target 10 it walks 25, 208, 986, 3,451, 9,973, 25,221 and 57,759 nodes for k = 1 to 7, while the answer only grows from 3 to 28 — a ratio rising from 1.00x to 529.90x with no ceiling. At k = 7 it produces 29,106 raw results to yield 28 distinct ones.

<!-- @code cpp -->
```cpp
#include <vector>
#include <set>
#include <algorithm>
using namespace std;

void collect(const vector<int>& a, int start, int rem, vector<int>& cur,
             vector<vector<int>>& out) {
    if (rem == 0) {
        out.push_back(cur);
        return;
    }
    for (int i = start; i < (int)a.size(); i++) {
        if (a[i] > rem) break;
        cur.push_back(a[i]);
        collect(a, i + 1, rem - a[i], cur, out);
        cur.pop_back();
    }
}

vector<vector<int>> combinationSum2(vector<int> a, int target) {
    sort(a.begin(), a.end());
    vector<vector<int>> raw;
    vector<int> cur;
    collect(a, 0, target, cur, raw);
    set<vector<int>> unique(raw.begin(), raw.end());
    return vector<vector<int>>(unique.begin(), unique.end());
}
```

<!-- @annotations -->
- 15: i + 1, so no position is reused — this is Power Set's recursion with a target attached, and it is correct apart from producing the same multiset once per index path that reaches it.
- 25: The deduplication happens only after the entire tree has been walked. Every repeat was built in full before being discarded, which is why the cost tracks the duplication rather than the answer.

<!-- @code java -->
```java
static List<List<Integer>> combinationSum2(int[] a, int target) {
    int[] s = a.clone();
    Arrays.sort(s);
    List<List<Integer>> raw = new ArrayList<>();
    collect(s, 0, target, new ArrayList<>(), raw);
    Set<List<Integer>> unique = new LinkedHashSet<>(raw);
    return new ArrayList<>(unique);
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
        collect(a, i + 1, rem - a[i], cur, out);
        cur.remove(cur.size() - 1);
    }
}
```

<!-- @annotations -->
- 6: LinkedHashSet rather than HashSet, so the surviving order is first-seen rather than arbitrary. List defines equals and hashCode element-wise, which is what makes this work at all.
- 19: The same at-most-once recursion. Nothing here knows about duplicates; all the correction happens after it finishes.

<!-- @code python -->
```python
def combination_sum2(a, target):
    a = sorted(a)
    raw, cur = [], []

    def go(start, rem):
        if rem == 0:
            raw.append(tuple(cur))
            return
        for i in range(start, len(a)):
            if a[i] > rem:
                break
            cur.append(a[i])
            go(i + 1, rem - a[i])
            cur.pop()

    go(0, target)
    return [list(c) for c in dict.fromkeys(raw)]


# At 7 copies of each candidate this walks 57,759 nodes and builds
# 29,106 raw results to yield 28 — 529.90x the skip version's 109.
```

<!-- @annotations -->
- 7: tuple(cur) rather than cur[:], because a list is unhashable and the deduplication below needs an immutable key.
- 17: dict.fromkeys keeps first-seen order, where a set would return the results in an arbitrary one.

<!-- @approach -->
### Skip Equal Values at the Same Level

<!-- @idea -->
Sort, then refuse any candidate equal to the one immediately before it *within the same loop*, so each distinct value is chosen once per level.

<!-- @steps -->
1. Sort the candidates so that equal values are adjacent.
2. At each level loop i from the start index, as usual.
3. Skip i whenever it is past the start of this loop and a[i] equals a[i-1] — the first copy is always taken, later ones never are.
4. Break out of the loop once a[i] exceeds the remainder, which the sort licenses.
5. Otherwise take a[i], recurse on i + 1, and undo.

<!-- @complexity -->
- time: proportional to the answer rather than to the duplication
- space: O(min(n, target/min(a))) stack, plus the output
- note: The node count converges as copies are added — 25, 59, 80, 93, 101, 106, 109 for k = 1 to 7 — because extra copies past a point cannot appear in any new answer. Measured 15.749ms at n = 224, target 50, on 951,862 nodes for 137,778 results: 6.91 nodes per result, with 67.6% of nodes still dead ends. Identical to the deduplicating version at k = 1, and 529.90x cheaper at k = 7.

<!-- @code cpp -->
```cpp
void collect(const vector<int>& a, int start, int rem, vector<int>& cur,
             vector<vector<int>>& out) {
    if (rem == 0) {
        out.push_back(cur);
        return;
    }
    for (int i = start; i < (int)a.size(); i++) {
        if (i > start && a[i] == a[i - 1]) continue;
        if (a[i] > rem) break;
        cur.push_back(a[i]);
        collect(a, i + 1, rem - a[i], cur, out);
        cur.pop_back();
    }
}
```

<!-- @annotations -->
- 8: The entire fix. i > start, not i > 0 — the first copy at this level sits at i == start and must be taken, while later copies at this level would repeat a subtree already explored. Choosing a value equal to the one taken one level up is a different thing and must stay allowed, which is how [1,1,6] gets built; i > 0 cannot tell those apart and loses it.
- 9: This break is correct only because a is sorted — and the sort is required here for the line above it too, since a[i] == a[i-1] only detects duplicates that are adjacent.
- 11: i + 1, so the position just taken is not available again. Passing i would be Combination Sum's unlimited reuse.

<!-- @code java -->
```java
static void collect(int[] a, int start, int rem, List<Integer> cur,
                    List<List<Integer>> out) {
    if (rem == 0) {
        out.add(new ArrayList<>(cur));
        return;
    }
    for (int i = start; i < a.length; i++) {
        if (i > start && a[i] == a[i - 1]) continue;
        if (a[i] > rem) break;
        cur.add(a[i]);
        collect(a, i + 1, rem - a[i], cur, out);
        cur.remove(cur.size() - 1);
    }
}
```

<!-- @annotations -->
- 8: i > start compares against this loop's own starting index, which is what confines the rule to one level. On [1,1,1,1] with target 2, writing i > 0 returns nothing at all instead of [1,1].
- 11: The recursion advances past the taken position, so each element is used at most once regardless of how many equal copies follow it.

<!-- @code python -->
```python
def combination_sum2(a, target):
    a = sorted(a)
    out, cur = [], []

    def go(start, rem):
        if rem == 0:
            out.append(cur[:])
            return
        for i in range(start, len(a)):
            if i > start and a[i] == a[i - 1]:
                continue
            if a[i] > rem:
                break
            cur.append(a[i])
            go(i + 1, rem - a[i])
            cur.pop()

    go(0, target)
    return out


# 29.27ms at n = 120, target 35. The take/skip form is 35.41ms here
# (1.21x) and 0.85x in C++, on exactly 2N - 1 nodes either way.
```

<!-- @annotations -->
- 2: sorted(a) is a correctness requirement in this version, not a tuning choice. Unsorted, [1,2,1,2,1] with target 3 returns seven results where two are distinct.
- 10: i > start. The rule applies within a level, never across levels.

<!-- @approach -->
### Take or Skip Past All Copies

<!-- @idea -->
Take exactly one copy of the current value, or skip every copy of it at once, which makes the duplicate handling an asymmetry between the two branches.

<!-- @steps -->
1. Carry an index, the remaining target, and the shared buffer.
2. Emit if the remainder is zero; return if the index is past the end or the current value exceeds the remainder.
3. On the take branch, append a[i] and recurse on i + 1 — one copy only.
4. On the skip branch, advance j past every position holding the same value as a[i].
5. Recurse from j with the remainder untouched, so a value refused here is refused entirely.

<!-- @complexity -->
- time: the same tree as the loop form, re-encoded
- space: O(min(n, target/min(a))) stack, plus the output
- note: Visits exactly 2N − 1 nodes where N is the loop form's count — verified on seven inputs from 3 nodes to 34,385, never approximately. It is the left-child right-sibling encoding of the same tree, the identical relation Power Set measured between its two forms. Measured 13.411ms against the loop form's 15.749ms in C++ — 0.85x, faster on twice the nodes — but 35.41ms against 29.27ms in Python, 1.21x, because there the extra nodes are call frames.

<!-- @code cpp -->
```cpp
void collect(const vector<int>& a, int i, int rem, vector<int>& cur,
             vector<vector<int>>& out) {
    if (rem == 0) {
        out.push_back(cur);
        return;
    }
    if (i == (int)a.size() || a[i] > rem) return;
    cur.push_back(a[i]);
    collect(a, i + 1, rem - a[i], cur, out);
    cur.pop_back();
    int j = i;
    while (j < (int)a.size() && a[j] == a[i]) j++;
    collect(a, j, rem, cur, out);
}
```

<!-- @annotations -->
- 7: a[i] > rem ends the branch rather than skipping one candidate, which is valid only under the sort — every later value is at least as large.
- 9: The take branch advances by exactly one, so a single copy is used.
- 12: The skip branch advances past every copy. That asymmetry is the whole duplicate fix in this shape: refusing a value once refuses all of its copies, so no second path can rebuild the same multiset.
- 13: Recursing from j rather than i + 1. Using i + 1 here would offer the next identical copy as a fresh choice and reintroduce every duplicate.

<!-- @code java -->
```java
static void collect(int[] a, int i, int rem, List<Integer> cur,
                    List<List<Integer>> out) {
    if (rem == 0) {
        out.add(new ArrayList<>(cur));
        return;
    }
    if (i == a.length || a[i] > rem) return;
    cur.add(a[i]);
    collect(a, i + 1, rem - a[i], cur, out);
    cur.remove(cur.size() - 1);
    int j = i;
    while (j < a.length && a[j] == a[i]) j++;
    collect(a, j, rem, cur, out);
}
```

<!-- @annotations -->
- 7: Combining the end-of-array test with the overshoot test works because the array is sorted; the order of the two matters, since a[i] would be out of bounds otherwise.
- 12: The scan past equal values. It runs at most once per distinct value along any path, so it costs nothing asymptotically.

<!-- @code python -->
```python
def combination_sum2(a, target):
    a = sorted(a)
    out, cur = [], []

    def go(i, rem):
        if rem == 0:
            out.append(cur[:])
            return
        if i == len(a) or a[i] > rem:
            return
        cur.append(a[i])
        go(i + 1, rem - a[i])
        cur.pop()
        j = i
        while j < len(a) and a[j] == a[i]:
            j += 1
        go(j, rem)

    go(0, target)
    return out


# 35.41ms at n = 120, target 35 — 1.21x the loop form. In C++ the
# same shape is 0.85x, on exactly the same 2N - 1 node count.
```

<!-- @annotations -->
- 12: One copy taken, index advanced by one.
- 17: Every copy skipped at once. The two branches are deliberately asymmetric — that is what makes each multiset reachable by exactly one path.

<!-- @approach -->
### Frequency Form

<!-- @idea -->
Group the input into distinct values with their counts, then decide how many copies of each value to take.

<!-- @steps -->
1. Sort the candidates and collapse them into (value, count) pairs.
2. Carry an index into that list and the remaining target.
3. Emit if the remainder is zero; return if the list is exhausted.
4. For the current value, loop over how many copies to take, from the most the count and the remainder allow down to zero.
5. Append that many copies, recurse on the next distinct value, and undo.

<!-- @complexity -->
- time: the same order as the others, with a larger constant
- space: O(number of distinct values) stack, plus the output
- note: Makes the duplicate handling structural rather than a guard — there is no skip line because equal values are never separate choices in the first place. Measured 16.955ms at n = 224, target 50 on 5,237,171 nodes, 1.08x the loop form in C++ and 1.69x in Python; the extra nodes come from the take = 0 branches, which the loop form never creates. Worth knowing because it generalises directly to bounded-knapsack counting, where the multiplicities are given rather than discovered.

<!-- @code cpp -->
```cpp
void collect(const vector<pair<int,int>>& items, int k, int rem,
             vector<int>& cur, vector<vector<int>>& out) {
    if (rem == 0) {
        out.push_back(cur);
        return;
    }
    if (k == (int)items.size()) return;
    int v = items[k].first, c = items[k].second;
    for (int take = min(c, rem / v); take >= 0; take--) {
        cur.insert(cur.end(), take, v);
        collect(items, k + 1, rem - v * take, cur, out);
        cur.erase(cur.end() - take, cur.end());
    }
}

vector<vector<int>> combinationSum2(vector<int> a, int target) {
    sort(a.begin(), a.end());
    vector<pair<int,int>> items;
    for (int x : a)
        if (!items.empty() && items.back().first == x) items.back().second++;
        else items.push_back({x, 1});
    vector<vector<int>> out;
    vector<int> cur;
    collect(items, 0, target, cur, out);
    return out;
}
```

<!-- @annotations -->
- 9: min(c, rem / v) bounds the count by both what exists and what fits, so no branch is created that could not possibly complete.
- 12: erase with take == 0 is erase(end, end), a well-defined no-op, which is why the loop needs no special case for taking none.
- 20: Collapsing runs of equal values into counts. This is the only place duplicates are handled — the recursion below never sees two equal choices, so there is no skip line anywhere.

<!-- @code java -->
```java
static List<List<Integer>> combinationSum2(int[] a, int target) {
    int[] s = a.clone();
    Arrays.sort(s);
    List<int[]> items = new ArrayList<>();
    for (int x : s)
        if (!items.isEmpty() && items.get(items.size() - 1)[0] == x)
            items.get(items.size() - 1)[1]++;
        else items.add(new int[]{x, 1});
    List<List<Integer>> out = new ArrayList<>();
    collect(items, 0, target, new ArrayList<>(), out);
    return out;
}

static void collect(List<int[]> items, int k, int rem, List<Integer> cur,
                    List<List<Integer>> out) {
    if (rem == 0) {
        out.add(new ArrayList<>(cur));
        return;
    }
    if (k == items.size()) return;
    int v = items.get(k)[0], c = items.get(k)[1];
    for (int take = Math.min(c, rem / v); take >= 0; take--) {
        for (int q = 0; q < take; q++) cur.add(v);
        collect(items, k + 1, rem - v * take, cur, out);
        for (int q = 0; q < take; q++) cur.remove(cur.size() - 1);
    }
}
```

<!-- @annotations -->
- 6: Mutating the int[] already in the list rather than replacing it, which is why items holds arrays instead of an immutable pair type.
- 22: Counting down rather than up, so the results come out in the same order as the other three approaches. Counting up is equally correct and reverses the output.

<!-- @code python -->
```python
from collections import Counter


def combination_sum2(a, target):
    items = sorted(Counter(a).items())
    out, cur = [], []

    def go(k, rem):
        if rem == 0:
            out.append(cur[:])
            return
        if k == len(items):
            return
        v, c = items[k]
        for take in range(min(c, rem // v), -1, -1):
            for _ in range(take):
                cur.append(v)
            go(k + 1, rem - v * take)
            for _ in range(take):
                cur.pop()

    go(0, target)
    return out


# 49.75ms at n = 120, target 35 — 1.69x the loop form, and 1.08x in
# C++. The take = 0 branches are nodes the loop form never creates.
```

<!-- @annotations -->
- 5: Counter(a).items() sorted gives the (value, count) pairs directly. The sort is still needed, but for output order rather than for correctness — grouping already removed the duplicate problem.
- 16: Counting down from the largest feasible take. rem // v bounds it by the remainder and c by availability.

<!-- @example -->

<!-- @input -->
a = [10, 1, 2, 7, 6, 1, 5], target = 8

<!-- @output -->
[[1,1,6], [1,2,5], [1,7], [2,6]] from 17 nodes

<!-- @why -->
The canonical case, and the smallest one where a duplicate value must both be usable twice in one answer and refused as a second choice at one level.

<!-- @walkthrough -->
1. Sorted, the array is [1, 1, 2, 5, 6, 7, 10].
2. At the root the loop starts at 0, takes the first 1, and recurses from index 1 with rem = 7.
3. At that level start is 1 and i is 1, so i > start is false and the second 1 is taken — this is how [1,1,6] becomes reachable.
4. From [1,1] with rem = 6, the 6 at index 4 completes it, giving [1,1,6].
5. Back at the root's level, i reaches 1 with start still 0, so i > start is now true and a[1] == a[0] — the second 1 is skipped, which is what stops [1,7] appearing twice.
6. The remaining answers come from taking 2 first: [2,6], and from the first 1: [1,2,5] and [1,7].
7. Four results from 17 nodes, where the deduplicating version walks 23 nodes and produces 6 raw results to reach the same 4.

<!-- @example -->

<!-- @input -->
a = [1, 1, 1, 1], target = 2

<!-- @output -->
[[1, 1]] — one result

<!-- @why -->
The minimal case that separates i > start from i > 0, where the wrong condition returns nothing at all rather than a wrong count.

<!-- @walkthrough -->
1. Sorted, the array is already [1, 1, 1, 1], and the only answer is one 1 plus another 1.
2. At the root, start is 0 and i is 0, so the first 1 is taken and the recursion moves to index 1 with rem = 1.
3. At that level start is 1 and i is 1, so i > start is false, the second 1 is taken, and rem reaches 0 — [1,1] is emitted.
4. Returning to the root's loop, i becomes 1 with start 0: i > start is true and a[1] == a[0], so it is skipped, as are indices 2 and 3.
5. That leaves exactly one result, from 3 nodes.
6. With i > 0 instead, step 3 fails — i is 1, which is greater than 0, and a[1] == a[0] — so the second 1 is refused and the answer comes back empty.
7. The failure is silent: no exception, no duplicate, just a missing result, which is why this input is worth keeping as a test.

<!-- @example -->

<!-- @input -->
a = [1, 2, 1, 2, 1], target = 3, unsorted

<!-- @output -->
7 results instead of 2 — duplicates emitted

<!-- @why -->
Shows that the sort is a correctness requirement in this problem rather than the tuning choice it was in Combination Sum.

<!-- @walkthrough -->
1. Sorted the array is [1, 1, 1, 2, 2] and the answers are [1,1,1] and [1,2].
2. Left unsorted as [1, 2, 1, 2, 1], the test a[i] == a[i-1] compares 2 against 1, 1 against 2, and so on — never equal.
3. The skip line therefore never fires, and the recursion behaves exactly like the version with no duplicate handling at all.
4. That yields [1,1,1] once and [1,2] six times, seven results where two are distinct.
5. The failure mode is the opposite of the i > 0 bug: too many answers rather than too few.
6. In Combination Sum the sort only licensed a break that removed loop iterations and measured 1.00x, so skipping it cost nothing.
7. Here skipping it produces wrong output, which is the difference between an optimisation and a precondition.

<!-- @example -->

<!-- @input -->
k copies of each of {1,2,3,4,5}, target 10, for k = 1 to 7

<!-- @output -->
Skip-line nodes converge to 109; dedupe-after reaches 57,759

<!-- @why -->
The measurement that separates the two fixes, and the control at k = 1 where they are identical.

<!-- @walkthrough -->
1. At k = 1 there are no duplicates, the skip line never fires, and both versions walk exactly 25 nodes — the honest control.
2. At k = 2 the skip version is at 59 nodes and the dedupe version at 208, a factor of 3.53.
3. By k = 4 that is 93 against 3,451, and by k = 7 it is 109 against 57,759 — a factor of 529.90 and still climbing.
4. The skip column converges because once a value has enough copies to fill the target on its own, further copies cannot appear in any new answer.
5. The dedupe column grows combinatorially, since every additional copy multiplies the number of index paths reaching the same multiset.
6. At k = 7 it produces 29,106 raw results to yield 28 distinct ones, a 1,039.5x overshoot.
7. The two are not the same fix at different speeds — one refuses the subtree, the other builds it and discards it — so the gap has no ceiling.

<!-- @visualization custom -->

<!-- @description -->
Open on the duplicate problem itself. Show the sorted array [1, 1, 2, 5, 6, 7, 10] as a row of cells with the two 1s marked as one value at two positions, and draw the two index paths that both produce [1,7] — position 0 with 5, and position 1 with 5 — converging on the same result box. That convergence is the whole problem and should be visible before any fix appears. Beside it, draw the path that produces [1,1,6] using both 1s, and label it legal, so the reader sees that the two 1s must be simultaneously usable together and non-interchangeable as first choices.

The second panel is the fix, and it must make i > start versus i > 0 concrete. Draw one level of the recursion as a loop with its start index marked, and shade the cells the rule refuses under each condition. Under i > start only the second-and-later copies within this loop are shaded; under i > 0 the shading also covers the copy at i == start, and an arrow should show which answer that destroys. Use [1,1,1,1] with target 2 as the worked case, printing [1,1] for the correct rule and an empty result for the wrong one — an empty answer is the clearest possible failure.

The third panel is the measurement and is the heart of the page. Plot two curves against k for k = 1 to 7, on a log axis: skip-line nodes flattening at 25, 59, 80, 93, 101, 106, 109, and dedupe-after climbing 25, 208, 986, 3,451, 9,973, 25,221, 57,759. Mark k = 1 where they touch, labelled no duplicates, no difference, and annotate the right end 529.90x and still climbing. The caption should say plainly that one refuses the subtree and the other builds it and discards it, so the gap has no ceiling. Beneath, a small strip for the sort: the same input sorted and unsorted, with result counts 2 and 7, tagged a precondition here, not an optimisation.

Close with the shape comparison. Show the loop tree and the take/skip tree for a small input side by side with their node counts, and state the exact relation 2N − 1 rather than about double, marking that Power Set measured the same identity. Then two pairs of bars: C++ 15.749ms against 13.411ms tagged 0.85x, and Python 29.27ms against 35.41ms tagged 1.21x, sharing the caption twice the nodes, faster in one language and slower in the other — the nodes are call frames.

<!-- @sampleInput -->
```json
{"primary":{"a":[10,1,2,7,6,1,5],"sorted":[1,1,2,5,6,7,10],"target":8,"results":[[1,1,6],[1,2,5],[1,7],[2,6]],"nodes":17,"depth":3,"dedupeAfterNodes":23,"dedupeAfterRaw":6,"why":"the two 1s must be usable together for [1,1,6] and yet not interchangeable as first choices, or [1,7] appears twice"},"theCondition":{"correct":"i > start && a[i] == a[i-1]","wrong":"i > 0 && a[i] == a[i-1]","rows":[{"a":[10,1,2,7,6,1,5],"target":8,"correct":[[1,1,6],[1,2,5],[1,7],[2,6]],"wrongLoses":[[1,1,6]]},{"a":[2,5,2,1,2],"target":5,"correct":[[1,2,2],[5]],"wrongLoses":[[1,2,2]]},{"a":[1,1,1,1],"target":2,"correct":[[1,1]],"wrongLoses":[[1,1]],"wrongReturns":[]}],"why":"the first copy at a level sits at i == start and must be taken; i > 0 also refuses it, and choosing a value equal to the one taken one level up is not a repeat"},"sortIsRequired":{"reason":"a[i] == a[i-1] only detects duplicates that are adjacent","rows":[{"a":[10,1,2,7,6,1,5],"target":8,"sorted":4,"unsorted":6},{"a":[2,5,2,1,2],"target":5,"sorted":2,"unsorted":4},{"a":[1,2,1,2,1],"target":3,"sorted":2,"unsorted":7}],"contrast":"in Combination Sum the sort only licensed a break worth 1.00x; here it is a correctness precondition"},"twoFixes":{"input":"k copies of each of {1,2,3,4,5}, target 10","rows":[{"k":1,"n":5,"results":3,"skipNodes":25,"dedupeNodes":25,"rawResults":3,"ratio":1.00},{"k":2,"n":10,"results":12,"skipNodes":59,"dedupeNodes":208,"rawResults":51,"ratio":3.53},{"k":3,"n":15,"results":18,"skipNodes":80,"dedupeNodes":986,"rawResults":324,"ratio":12.32},{"k":4,"n":20,"results":22,"skipNodes":93,"dedupeNodes":3451,"rawResults":1342,"ratio":37.11},{"k":5,"n":25,"results":25,"skipNodes":101,"dedupeNodes":9973,"rawResults":4341,"ratio":98.74},{"k":6,"n":30,"results":27,"skipNodes":106,"dedupeNodes":25221,"rawResults":11922,"ratio":237.93},{"k":7,"n":35,"results":28,"skipNodes":109,"dedupeNodes":57759,"rawResults":29106,"ratio":529.90}],"reading":"the skip column converges because extra copies cannot appear in new answers; the dedupe column grows combinatorially, and at k=1 the two are identical"},"timing":{"cpp":{"input":"14 copies of 1..16, n=224","target":50,"results":137778,"unit":"ms","minOf":7,"eachMeasuredTwice":true,"maxSpread":1.021,"skipLine":15.749,"takeSkip":13.411,"frequency":16.955,"nodes":{"skipLine":951862,"takeSkip":1903723,"frequency":5237171},"ratios":{"takeSkip":0.85,"frequency":1.08}},"python":{"input":"10 copies of 1..12, n=120","target":35,"results":9009,"unit":"ms","minOf":5,"skipLine":29.27,"takeSkip":35.41,"frequency":49.75,"ratios":{"takeSkip":1.21,"frequency":1.69}},"identity":{"relation":"take/skip nodes == 2N - 1 where N is the loop form's node count","exact":true,"verifiedOn":7,"range":"3 to 34,385 nodes","note":"the left-child right-sibling encoding of the same tree; Power Set measured the identical relation"},"reading":"twice the nodes and faster in C++, slower in Python — the extra nodes are call frames"},"depth":{"bound":"min(n, target/min(a))","upperBoundNotEquality":true,"rows":[{"a":"20 copies of 1","target":10,"depth":10},{"a":"30 copies of 2","target":20,"depth":10},{"a":"distinct 1..8","target":20,"depth":5,"bound":8}],"contrast":"Combination Sum's depth was target/min(a) with n absent; here n bounds the stack again"},"arc":[{"recursion":"power set, loop form","nodesPerResult":1.000,"deadEndRate":0.0},{"recursion":"power set, take/skip","nodesPerResult":2.000,"deadEndRate":0.0},{"recursion":"no adjacent 1s","nodesPerResult":2.618,"deadEndRate":0.0},{"recursion":"parentheses, n=12","nodesPerResult":4.968,"deadEndRate":0.0},{"recursion":"combination sum","nodesPerResult":37.13,"deadEndRate":80.7},{"recursion":"combination sum II","nodesPerResult":6.91,"deadEndRate":67.6}]}
```

<!-- @highlights -->
- The sorted array [1,1,2,5,6,7,10] is drawn as cells with the two 1s marked as one value at two positions.
- Two index paths both producing [1,7] converge on a single result box — the problem itself, before any fix.
- A third path uses both 1s to build [1,1,6] and is labelled legal.
- One level of the loop is drawn with its start index marked, and the refused cells shaded.
- Under i > start only second-and-later copies within this loop are shaded.
- Under i > 0 the shading also covers the copy at i == start, with an arrow to the answer that destroys.
- [1,1,1,1] with target 2 is worked through, printing [1,1] correct and an empty result wrong.
- Two curves are plotted against k on a log axis for k = 1 to 7.
- The skip-line curve flattens at 25, 59, 80, 93, 101, 106, 109.
- The dedupe-after curve climbs 25, 208, 986, 3,451, 9,973, 25,221, 57,759.
- k = 1 is marked where they touch, labelled no duplicates, no difference.
- The right end is annotated 529.90x and still climbing.
- A strip shows the same input sorted and unsorted with counts 2 and 7, tagged a precondition, not an optimisation.
- The loop tree and take/skip tree sit side by side with the exact relation 2N − 1, not about double.
- C++ bars read 15.749ms against 13.411ms, tagged 0.85x.
- Python bars read 29.27ms against 35.41ms, tagged 1.21x, sharing the caption that the nodes are call frames.

<!-- @edgeCases -->
- target = 0 — one answer, the empty combination, emitted at the root before the loop runs.
- An impossible target — the answer is [], not [[]].
- a = [1,1,1,1] with target 2 — one result, and the case where i > 0 returns nothing at all.
- All values equal, such as thirty 2s with target 20 — one result of ten 2s, reached at depth 10.
- No duplicates at all — the skip line never fires and this reduces exactly to the at-most-once recursion, identical to the deduplicating version at 25 nodes.
- Every value distinct and larger than the target — the root breaks on its first iteration and the answer is empty.
- Unsorted input — the skip line misses non-adjacent duplicates and emits repeats, which is wrong output rather than slow output.
- A value appearing more times than the target can use — the extra copies add nothing to the tree, which is why the node count converges.
- Duplicate values that are also the whole answer, such as [1,1] from [1,1,1,1] — needs the first copy at each level to remain takeable.
- A caller's array that must not be reordered — all three languages sort a copy, since the sort is mandatory here.
- Very large n with a small target — the depth is bounded by target/min(a) rather than n, so the stack stays shallow.
- Very large target with small n — the depth is bounded by n, unlike Combination Sum where it was not.
- The output compared literally against another implementation — the four approaches agree as sets, and the frequency form's order depends on whether the take loop counts up or down.

<!-- @pitfalls -->
- Writing i > 0 instead of i > start. That refuses the first copy at each level too, so [1,1,6] is lost and [1,1,1,1] with target 2 returns nothing at all — a silent wrong answer, not an error.
- Skipping the sort. a[i] == a[i-1] only sees adjacent duplicates, so unsorted input emits repeats — [1,2,1,2,1] with target 3 gives seven results where two are distinct.
- Assuming the sort is an optimisation because it was one in Combination Sum. There it licensed a break worth 1.00x; here it is a precondition for correctness.
- Deduplicating at the end instead of skipping. It is correct but its cost tracks the duplication rather than the answer — 529.90x more nodes at seven copies per candidate, with no ceiling.
- Recursing on i instead of i + 1. That restores Combination Sum's unlimited reuse and lets one position be counted many times.
- In the take/skip form, recursing on i + 1 in the skip branch. That offers the next identical copy as a fresh choice and reintroduces every duplicate the shape was meant to prevent.
- Judging the shapes by node count. Take/skip visits exactly 2N − 1 nodes and is 0.85x in C++, faster on twice the nodes, though 1.21x in Python.
- Expecting the node identity to be approximate. It is exact — 2N − 1 on every input tested, the same relation Power Set measured.
- Returning [[]] for an impossible target. The empty combination is an answer only when the target is 0.
- Storing the buffer rather than a copy. As everywhere in this topic, that stores one aliased list that ends up empty.
- Reordering the caller's array. The sort is mandatory here, so the copy matters more than it did in Combination Sum.
- Using a HashSet for the deduplicating version and expecting stable output order. LinkedHashSet or dict.fromkeys preserves first-seen order; a plain set does not.
- Reading out.size() or the list length inside the frequency form's take loop. The bound must be min(count, rem / value), computed before the loop body starts appending.

<!-- @doubt -->
### Why does i > start work when i > 0 does not?

<!-- @answer -->
Because the rule is about choices within one level, and i > 0 cannot express that. At any level the loop runs from start, so the first copy of a value is at i == start and represents a genuinely new choice that must be taken. Later copies at that same level would re-explore a subtree already explored with an identical value, so they are the repeats. Choosing a value that happens to equal the one taken one level above is not a repeat at all — it is how [1,1,6] is built — and i > 0 refuses exactly that case too. The failure is silent: on [10,1,2,7,6,1,5] with target 8 it drops [1,1,6], and on [1,1,1,1] with target 2 it returns an empty list instead of [[1,1]].

<!-- @doubt -->
### Is deduplicating at the end wrong, or just slower?

<!-- @answer -->
Not wrong — it produces the same answer — but it is not the same operation at a different speed, which is the usual way it gets described. The skip refuses a subtree before entering it, so its cost tracks the size of the answer; the dedupe builds every duplicate in full and discards it, so its cost tracks how duplicated the input is. Those are different functions of the input and the gap between them has no ceiling. Measured on k copies of each of {1,2,3,4,5} with target 10, the skip version's node count converges — 25, 59, 80, 93, 101, 106, 109 for k = 1 to 7 — while the dedupe version goes 25, 208, 986, 3,451, 9,973, 25,221, 57,759. At k = 1 they are identical, which is the control that shows the difference really is the duplication.

<!-- @doubt -->
### Why does the skip version's node count stop growing?

<!-- @answer -->
Because extra copies of a value stop being able to appear in any new answer. With target 10 and a candidate of 2, at most five 2s can ever be used, so a sixth, seventh or eighth copy contributes no new combination — and the skip line means it also contributes no new node, since only the first copy at each level is ever taken. The tree therefore stops growing once every value has as many copies as the target can absorb, which is why the count converges to 109 rather than continuing upward. The deduplicating version has no such ceiling: every additional copy multiplies the number of distinct index paths reaching the same multiset, even though the multiset set is unchanged.

<!-- @doubt -->
### Why is sorting required here when it was not in Combination Sum?

<!-- @answer -->
Because it is doing a different job. In Combination Sum the sort only licensed a break in place of a continue, which removed loop iterations but not one node — the counts were bit-identical and it measured 1.00x. Here the duplicate test is a[i] == a[i-1], which compares neighbours, so it only detects duplicates that the sort has made adjacent. Without it the line silently never fires: [1,2,1,2,1] with target 3 returns seven results where two are distinct, and [2,5,2,1,2] with target 5 returns four where two are. That is wrong output rather than slow output, so the sort has moved from tuning to precondition. The frequency form is the exception — it groups by value explicitly, so it does not depend on adjacency.

<!-- @doubt -->
### Is take/skip really exactly twice the loop form?

<!-- @answer -->
Exactly 2N − 1, not approximately. Verified on seven inputs spanning 3 nodes to 34,385: [1,1,1,1] with target 2 gives 3 and 5, the canonical case gives 17 and 33, and eight copies of 1..10 with target 30 gives 17,193 and 34,385. The reason is structural rather than coincidental — the take/skip form is the left-child right-sibling encoding of the loop tree, and a binary tree whose leaves correspond to N nodes has 2N − 1 nodes. Power Set measured the identical relation between its two forms, where 2^n and 2^(n+1) − 1 are the same statement. Despite that, take/skip measures 0.85x in C++ — faster on twice the nodes, because its branching is binary and predictable while the loop form's skip test and break are not.

<!-- @doubt -->
### Which of the four should I write?

<!-- @answer -->
The skip line, for the same reason it was the loop form last time: it is the shortest, it is what Subsets II extends verbatim, and it has the smallest tree at 951,862 nodes against take/skip's 1,903,723 and the frequency form's 5,237,171. The timings do not decide it — 15.749ms, 13.411ms and 16.955ms in C++ are close, and Python orders them 29.27, 35.41 and 49.75. The frequency form is worth knowing separately because it makes the duplicate handling structural rather than a guard, which is exactly the shape bounded-knapsack problems want when the multiplicities are given rather than discovered.

<!-- @doubt -->
### Has the stack hazard from Combination Sum gone away?

<!-- @answer -->
Yes, because each position is consumed once. Combination Sum's depth was target/min(a) with n absent entirely, so a two-element input with a large target could reach depth 700 and a 1 among the candidates made the depth equal the target. Here the depth is bounded by min(n, target/min(a)) — both terms — so the input length bounds the stack again. It is an upper bound rather than an equality: the eight distinct values 1..8 with target 20 stop at depth 5, since no six of them sum to 20. Twenty copies of 1 with target 10 do reach depth 10, and thirty 2s with target 20 also reach 10.

<!-- @doubt -->
### Why are there still dead ends?

<!-- @answer -->
For the same reason as Combination Sum, unchanged by the duplicate handling: the cheap guard a[i] > rem refuses only immediate overshoot, while the honest question is whether the remainder can still be formed from what is left, which is subset-sum reachability and not O(1). Measured here, 643,631 of 951,862 nodes produce nothing — 67.6%, against Combination Sum's 80.7%. The improvement comes from forbidding reuse, which cuts the branching hard, not from anything about duplicates. The reachability table from the previous subtopic transfers directly and would take this to zero the same way, with the same caveat that its O(n · target) memory is unbounded in the target.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
**Subsets II** is this problem with the target deleted — duplicates in the input, each position used once, every subset wanted — and the skip line transfers verbatim, which is the point worth noticing: the duplicate rule is a property of the input, not of the target. **Combination Sum III** goes the other direction, keeping distinct candidates and adding a fixed combination size, and that guard *is* complete and cheap, which makes it a clean contrast with the incomplete overshoot test carried through both of these. Between them they finish the pattern: the loop shape stays fixed and what changes each time is what the loop refuses, and whether it can refuse it completely.
