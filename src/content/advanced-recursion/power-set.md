---
id: power-set
topic: Advanced Recursion
title: Power Set
difficulty: Medium
status: ready
prerequisites:
  - generate-parentheses
  - learn-all-patterns-of-subsequences-theory
  - count-all-subsequences-with-sum-k
  - time-and-space-complexity-basics
relatedIds:
  - generate-parentheses
  - power-set-bit-manipulation
  - learn-all-patterns-of-subsequences-theory
  - generate-binary-strings-without-consecutive-1s
---

<!-- @summary -->
The unconstrained tree, after two subtopics of pruning — every element in or out, no guard anywhere. Take-or-skip spends exactly 2 nodes per subset; restructuring it into the start-index loop spends exactly 1, halving the call count. Measured, that is worth 1.00x in C++ and 0.75x in Python, and the reason is exact: calls plus loop iterations is the identical 2^(n+1) − 1, so the branching only relocates. The cost that actually matters is neither shape — materialising the answer costs 15.8x the traversal, because the output is n/2 times bigger than the tree.

<!-- @theory -->
## The problem

Generate every subset of `a`.

```
a = [1, 2, 3]  ->  []  [1]  [2]  [3]  [1,2]  [1,3]  [2,3]  [1,2,3]
```

All 2^n of them, including the empty set and the whole array.

## Nothing to prune

The last two subtopics were about guards. Binary strings forbade adjacent 1s
and the base dropped from 2 to phi. Parentheses forbade closing what was never
opened and the leaf count became Catalan. Here there is no rule at all: every
one of the 2^n in-or-out decisions is legal, so every leaf is an answer.

That makes this the baseline both of those were measured against, and it is
worth seeing directly. There is no dead end to avoid, no guard to place, and
no candidate ever discarded. Whatever the recursion costs here is the floor.

## Two recursions, both correct

The series form branches on each element in turn — take it, or skip it — and
records the subset at the bottom:

```
collect(i):  if i == n: emit; else: take a[i], recurse; undo; recurse
```

The other form carries a start index, loops over every element from there, and
emits at *every* node rather than only at leaves:

```
collect(start):  emit; for i in start..n-1: take a[i], recurse(i+1), undo
```

Both produce all 2^n subsets. They differ in how many nodes they visit, and
the counts are exact rather than approximate:

| n | take/skip nodes | 2^(n+1) − 1 | loop nodes | 2^n | loop iterations |
|---|---|---|---|---|---|
| 3 | 15 | 15 | 8 | 8 | 7 |
| 10 | 2,047 | 2,047 | 1,024 | 1,024 | 1,023 |
| 15 | 65,535 | 65,535 | 32,768 | 32,768 | 32,767 |
| 20 | 2,097,151 | 2,097,151 | 1,048,576 | 1,048,576 | 1,048,575 |

Take-or-skip visits **2.00 nodes per subset** at every n — half its tree is
interior nodes that emit nothing. The loop form visits **1.00**, the floor:
one node, one subset. Halving the call count looks like a clear win.

## The work is conserved

It is not a win, and the reason is an identity rather than a measurement.
The loop form makes 2^n calls and runs 2^n − 1 loop iterations, and

```
2^n + (2^n - 1)  =  2^(n+1) - 1
```

which is exactly the take/skip node count. At n = 20 that is 1,048,576 calls
plus 1,048,575 iterations against 2,097,151 calls. The branching did not
disappear; it moved out of the call frames and into the loop.

Measured in C++ at n = 20, min-of-15, each form measured twice in opposite order, the two are indistinguishable:

| form | time | vs take/skip |
|---|---|---|
| take/skip, shared buffer | 57.76ms | 1.00x |
| start-index loop | 57.87ms | **1.00x** |
| iterative doubling | 108.14ms | 1.87x |
| bitmask loop | 289.01ms | 5.00x |

A predicted null result that the measurement confirms — the run-to-run spreads
were 1.001x and 1.002x, far below any difference worth reporting.

## Why Python disagrees

The same swap in Python is worth something:

| form | n = 16 | vs take/skip |
|---|---|---|
| take/skip | 29.28ms | 1.00x |
| start-index loop | 21.97ms | **0.75x** |
| iterative doubling | 12.04ms | 0.41x |
| bitmask | 105.66ms | 3.45x |

The identity still holds — the same total work either way. What changed is the
price of the *unit*. The loop form trades call frames for loop iterations, and
a call frame costs almost nothing in C++ and a great deal in Python. So the
restructuring is worth 0% in one language and 25% in the other, from the same
arithmetic. The Bit Manipulation treatment of this problem measured the
bitmask at 102.1ms at this size, which agrees with the 105.66ms here.

## The real cost is the output

Neither shape is where the time goes. The tree has 2^n leaves, but the answer
is bigger than the tree: the average subset has n/2 elements, so the total
output is

```
n * 2^(n-1)  =  (n/2) * 2^n
```

At n = 20 that is 10,485,760 integers across 1,048,576 subsets. The recursion
is Theta(2^n); the output is Theta(n · 2^n). Measured in C++ at n = 20,
traversing the tree and accumulating a sum takes **3.67ms**, while building the
same subsets takes **57.76ms** — materialising costs **15.8x** the walk, and
15.7x at n = 18. The factor tracks n/2, as it should.

So the optimisation worth having is not the tree shape but the copying. The
canonical trap is passing the subset by value, which copies at every node
instead of once per leaf:

| language | shared buffer | by value | cost |
|---|---|---|---|
| C++ (n = 20) | 57.76ms | 261.85ms | **4.51x** |
| Python (n = 16) | 29.28ms | 31.01ms | **1.03x** |

Another split verdict from one change. In C++ the by-value version allocates a
fresh vector per node and the allocator dominates. In Python the buffer version
is already copying with `cur[:]` at every leaf, so the by-value version does
comparable total work and the "trap" costs 3%.

## Iterative doubling reverses too

The non-recursive form starts from `[[]]` and, for each element, appends it to
a copy of everything already built — doubling the answer n times. It needs no
stack and no index, and it also disagrees across languages: **1.87x slower**
than the recursion in C++, **0.41x** — two and a half times faster — in Python.
Same reason inverted. In C++ it copies every existing subset explicitly; in
Python the list comprehension runs in C while the recursion pays interpreter
overhead per call.

It has one property the recursions do not: its output order is exactly the
bitmask order, because appending element `x` to everything built so far *is*
setting bit `x`. Verified at n = 2 and n = 3, doubling and bitmask agree
element for element, while the two recursions each produce their own order.

## The nodes-per-result arc

Reading the series back through this one number:

| recursion | nodes per result |
|---|---|
| power set, loop form | 1.000 |
| power set, take/skip | 2.000 |
| no adjacent 1s | 2.618 = phi^2 |
| parentheses (n = 12) | 4.968, still rising |

The pattern is the opposite of the intuitive one. The *more* constrained the
problem, the *more* interior nodes it burns per result — because a constraint
does not remove nodes, it removes leaves, and the survivors sit deeper behind
the same interior structure. Perfect pruning did not get parentheses below 4.9.
Only restructuring the recursion so that every node emits reaches 1.000, and
that is available precisely because there is no constraint left to check.

## The limits

The ceiling here is memory, not arithmetic. At n = 20 the answer is 40MB of
integers plus 24MB of vector headers; at n = 24 it is 768MB plus 384MB. So
20 to 24 is the practical range for materialising, and beyond it the only
option is to consume subsets as they are generated rather than store them.

The one width trap is the bound: `1 << n` as a signed 32-bit int is fine to
n = 30 and overflows at n = 31, which is far past the point where the loop
would finish anyway — but it turns a slow program into a wrong one.

## Where this goes next

**Combination Sum** keeps the start-index loop form exactly as written here and
adds a target, so the loop becomes the natural place to prune. **Subsets II**
keeps it too and adds duplicates, where the loop index is what makes skipping
a repeated element expressible at all. The take/skip shape cannot express
either cleanly, which is the practical reason the loop form is the one that
carries forward — not the node count.

<!-- @intuition -->
Every element faces the same independent question — in or out — and no answer to one constrains another, so the recursion has no guard and every leaf is an answer. That makes this the floor the previous two subtopics were measured against. The interesting part is that there are two correct recursions here and the obvious argument for preferring one of them is wrong. The start-index form visits exactly 2^n nodes against take-or-skip's 2^(n+1) − 1, which looks like halving the work; but its loop runs 2^n − 1 times and those two numbers sum to exactly the take/skip count. Nothing was saved, only moved, and C++ measures the two as identical while Python measures a 25% gap — because the thing that moved was call frames, which the two languages price completely differently. Meanwhile both are dominated by something neither of them addresses: the output is n/2 times larger than the tree, so materialising costs 15.8x the traversal.

<!-- @approach -->
### Take or Skip Each Element

<!-- @idea -->
Branch on including or excluding each element in turn, and record the subset at the bottom.

<!-- @steps -->
1. Carry an index i and a shared buffer holding the elements taken so far.
2. If i has passed the last element, copy the buffer into the output and return.
3. Otherwise append a[i] to the buffer and recurse on i + 1 — the take branch.
4. Remove it again, restoring the buffer, and recurse on i + 1 — the skip branch.
5. Impose no condition on either branch, because every subset is legal.

<!-- @complexity -->
- time: O(n · 2^n), dominated by the output rather than the tree
- space: O(n) buffer and call stack, plus the O(n · 2^n) output
- note: Visits exactly 2^(n+1) − 1 nodes — 2,097,151 at n = 20 — which is 2.00 per subset at every n, since half the tree is interior nodes that emit nothing. Measured 57.76ms at n = 20 in C++ against 3.67ms to traverse without building, so materialising is 15.8x the walk. In Python 29.28ms at n = 16.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void collect(const vector<int>& a, int i, vector<int>& cur,
             vector<vector<int>>& out) {
    if (i == (int)a.size()) {
        out.push_back(cur);
        return;
    }
    cur.push_back(a[i]);
    collect(a, i + 1, cur, out);
    cur.pop_back();
    collect(a, i + 1, cur, out);
}
```

<!-- @annotations -->
- 6: The only base case, and it is a depth test rather than a guard — there is no illegal state to reject, so this is reached by every one of the 2^n paths.
- 7: The one place a subset is materialised. This copies, and it is where the time goes: 2^n copies of average length n/2, which is 15.8x the cost of the traversal itself at n = 20.
- 12: Restoring the buffer before the skip branch is what makes a single shared vector correct. Passing cur by value instead removes the need for this line and measured 4.51x slower.

<!-- @code java -->
```java
static void collect(int[] a, int i, List<Integer> cur,
                    List<List<Integer>> out) {
    if (i == a.length) {
        out.add(new ArrayList<>(cur));
        return;
    }
    cur.add(a[i]);
    collect(a, i + 1, cur, out);
    cur.remove(cur.size() - 1);
    collect(a, i + 1, cur, out);
}
```

<!-- @annotations -->
- 4: new ArrayList<>(cur) is required. Adding cur directly stores the same mutable list 2^n times, and since the buffer is empty when the recursion unwinds, the output ends up as 2^n empty lists.
- 9: remove(cur.size() - 1) resolves to remove(int index) because the argument is an int. Since the list holds Integer, passing a boxed value instead would select remove(Object) and delete by value — a real hazard in exactly this kind of buffer.

<!-- @code python -->
```python
def power_set(a):
    out, cur = [], []

    def go(i):
        if i == len(a):
            out.append(cur[:])
            return
        cur.append(a[i])
        go(i + 1)
        cur.pop()
        go(i + 1)

    go(0)
    return out


# 29.28ms at n = 16. The loop form is 21.97ms, a 25% saving that the
# identical change measured at 1.00x in C++.
```

<!-- @annotations -->
- 6: cur[:] copies. out.append(cur) appends a reference to the one buffer 2^n times, and every entry reads as [] once the recursion unwinds — the same failure as the Java version without the copy constructor.

<!-- @approach -->
### Start-Index Loop, Emitting at Every Node

<!-- @idea -->
Carry a start index, loop over the remaining elements, and record the buffer at every node rather than only at the bottom.

<!-- @steps -->
1. Carry a start index and the shared buffer.
2. Record the buffer immediately, before any recursion — this is the emit, and it happens at every node.
3. Loop i from start to the last element.
4. Append a[i], recurse with start = i + 1 so each element is considered once, then remove it.
5. Let the loop end naturally; there is no base case, because a node with nothing left simply runs an empty loop.

<!-- @complexity -->
- time: O(n · 2^n), the same as take/skip and for the same reason
- space: O(n) buffer and call stack, plus the output
- note: Visits exactly 2^n nodes — 1.00 per subset, the floor — but runs 2^n − 1 loop iterations, and 2^n + (2^n − 1) = 2^(n+1) − 1 is exactly the take/skip node count. Measured 57.87ms at n = 20 in C++ against take/skip's 57.76ms, a 1.00x null result the identity predicts. In Python 21.97ms at n = 16 against 29.28ms, because the frames it removes are expensive there.

<!-- @code cpp -->
```cpp
void collect(const vector<int>& a, int start, vector<int>& cur,
             vector<vector<int>>& out) {
    out.push_back(cur);
    for (int i = start; i < (int)a.size(); i++) {
        cur.push_back(a[i]);
        collect(a, i + 1, cur, out);
        cur.pop_back();
    }
}
```

<!-- @annotations -->
- 3: The emit sits at the top with no condition, so every node produces exactly one subset — that is the whole difference from take/skip, and it is why there are 2^n nodes rather than 2^(n+1) − 1.
- 4: This loop is where the second branch went. It runs 2^n − 1 times in total, which is precisely the number of nodes the take/skip form has and this one does not.
- 6: i + 1, not start + 1. Passing start + 1 would let the same element be chosen again and generate combinations with repetition instead of subsets.

<!-- @code java -->
```java
static void collect(int[] a, int start, List<Integer> cur,
                    List<List<Integer>> out) {
    out.add(new ArrayList<>(cur));
    for (int i = start; i < a.length; i++) {
        cur.add(a[i]);
        collect(a, i + 1, cur, out);
        cur.remove(cur.size() - 1);
    }
}
```

<!-- @annotations -->
- 3: Emitted unconditionally at entry, so the very first call contributes the empty subset before the loop starts.
- 4: A node whose start has passed the end runs this loop zero times and returns, which is why no explicit base case is needed.

<!-- @code python -->
```python
def power_set(a):
    out, cur = [], []

    def go(start):
        out.append(cur[:])
        for i in range(start, len(a)):
            cur.append(a[i])
            go(i + 1)
            cur.pop()

    go(0)
    return out


# 21.97ms at n = 16 against take/skip's 29.28ms — 0.75x. The same
# restructuring measured 1.00x in C++, on identical total work.
```

<!-- @annotations -->
- 5: The emit, before the loop. This is the line that makes nodes and subsets one-to-one.
- 6: range(start, len(a)) with go(i + 1) inside is the shape Combination Sum and Subsets II both build on, which is the practical reason to prefer this form over take/skip.

<!-- @approach -->
### Iterative Doubling

<!-- @idea -->
Start from the single empty subset and, for each element, append it to a copy of everything built so far.

<!-- @steps -->
1. Start the output holding one entry, the empty subset.
2. For each element x of the array, note the current size m before doing anything.
3. Loop k from 0 to m − 1 over the entries that existed at the start of this round.
4. Copy entry k, append x to the copy, and push it onto the output.
5. After all n rounds the output has doubled n times, giving 2^n subsets and no recursion anywhere.

<!-- @complexity -->
- time: O(n · 2^n)
- space: O(1) beyond the output, with no call stack at all
- note: Measured 108.14ms at n = 20 in C++, 1.87x slower than the recursion because it copies every existing subset explicitly. In Python it is the fastest of the four at 12.04ms at n = 16, 0.41x the recursion, because the comprehension runs in C while the recursion pays per-call interpreter overhead. Its output order is exactly the bitmask order, since appending element x to everything so far is the same operation as setting bit x.

<!-- @code cpp -->
```cpp
vector<vector<int>> powerSet(const vector<int>& a) {
    vector<vector<int>> out;
    out.reserve(1u << a.size());
    out.push_back({});
    for (int x : a) {
        size_t m = out.size();
        for (size_t k = 0; k < m; k++) {
            vector<int> s = out[k];
            s.push_back(x);
            out.push_back(move(s));
        }
    }
    return out;
}
```

<!-- @annotations -->
- 3: Reserving up front matters more here than elsewhere, because without it the outer vector reallocates about n times and every inner vector is moved again on each growth.
- 6: The size is captured before the inner loop. Writing k < out.size() in the condition instead reads a bound that the loop body keeps increasing, and it never terminates.
- 8: An explicit copy, then a move into the output — this is the work that makes the C++ version 1.87x slower than the recursion, and the exact work Python does in C.

<!-- @code java -->
```java
static List<List<Integer>> powerSet(int[] a) {
    List<List<Integer>> out = new ArrayList<>();
    out.add(new ArrayList<>());
    for (int x : a) {
        int m = out.size();
        for (int k = 0; k < m; k++) {
            List<Integer> s = new ArrayList<>(out.get(k));
            s.add(x);
            out.add(s);
        }
    }
    return out;
}
```

<!-- @annotations -->
- 5: Same snapshot of the size before the inner loop, and the same non-termination if out.size() is read in the condition instead.
- 7: A fresh ArrayList per new subset. Reusing out.get(k) directly would mutate the subset that is meant to remain in the answer without x.

<!-- @code python -->
```python
def power_set(a):
    out = [[]]
    for x in a:
        out += [s + [x] for s in out]
    return out


# 12.04ms at n = 16, the fastest of the four here at 0.41x the
# take/skip recursion. The same shape in C++ measured 1.87x SLOWER.
```

<!-- @annotations -->
- 4: The comprehension is fully evaluated into a new list before += extends out, so it reads the old contents and the snapshot is implicit. Replacing the brackets with parentheses makes it a generator, which is consumed while out is growing and never terminates.

<!-- @approach -->
### The Bitmask Correspondence

<!-- @idea -->
Each n-bit number names one subset, so counting from 0 to 2^n − 1 enumerates them all with no recursion.

<!-- @steps -->
1. Loop a mask m from 0 to 2^n − 1.
2. For each mask, start an empty subset.
3. Loop i from 0 to n − 1 and test bit i of m.
4. Include a[i] exactly when that bit is set.
5. Push the finished subset and move to the next mask.

<!-- @complexity -->
- time: O(n · 2^n), but with the worst constant of the four
- space: O(1) beyond the output
- note: The inner scan costs n per mask regardless of how many elements the subset actually has, so it does the full n · 2^n work with no short-cutting. Measured 289.01ms at n = 20 in C++, 5.00x the recursion, and 105.66ms at n = 16 in Python, 3.45x — agreeing with the 102.1ms the Bit Manipulation treatment measured at that size. Included here for the correspondence rather than the speed; that file develops what the masks are actually good for.

<!-- @code cpp -->
```cpp
vector<vector<int>> powerSet(const vector<int>& a) {
    int n = a.size();
    vector<vector<int>> out;
    out.reserve(1u << n);
    for (unsigned m = 0; m < (1u << n); m++) {
        vector<int> s;
        for (int i = 0; i < n; i++)
            if (m >> i & 1) s.push_back(a[i]);
        out.push_back(move(s));
    }
    return out;
}
```

<!-- @annotations -->
- 5: unsigned and 1u rather than int and 1. With a signed int the bound 1 << n overflows at n = 31 and the loop either runs zero times or forever, turning a merely slow program into a wrong one.
- 8: This scan runs n times per mask whatever the subset size, which is why this form has the worst constant here despite the same O(n · 2^n) as the others.

<!-- @code java -->
```java
static List<List<Integer>> powerSet(int[] a) {
    int n = a.length;
    List<List<Integer>> out = new ArrayList<>();
    for (int m = 0; m < (1 << n); m++) {
        List<Integer> s = new ArrayList<>();
        for (int i = 0; i < n; i++)
            if ((m >> i & 1) == 1) s.add(a[i]);
        out.add(s);
    }
    return out;
}
```

<!-- @annotations -->
- 4: Java has no unsigned int, so this bound is signed and breaks at n = 31 the same way. For larger n the counter has to be a long with 1L << n.
- 7: The == 1 is required. Java will not treat an int as a condition, so the C++ spelling if (m >> i & 1) does not compile here.

<!-- @code python -->
```python
def power_set(a):
    n = len(a)
    return [[a[i] for i in range(n) if m >> i & 1]
            for m in range(1 << n)]


# 105.66ms at n = 16, the slowest of the four at 3.45x the recursion.
# No width limit on the mask, so the ceiling is time and memory only.
```

<!-- @annotations -->
- 3: The inner comprehension rebuilds the subset from scratch for each mask, scanning all n bits every time regardless of how many are set.

<!-- @example -->

<!-- @input -->
a = [1, 2, 3]

<!-- @output -->
8 subsets from 15 calls take/skip, or 8 calls loop form

<!-- @why -->
Small enough to list completely, and the first size where the two node counts visibly diverge.

<!-- @walkthrough -->
1. Take/skip descends taking everything first, reaching [1,2,3] at the bottom of the leftmost path.
2. Unwinding one level and skipping 3 gives [1,2], then backtracking further gives [1,3] and [1].
3. Skipping 1 entirely repeats the whole pattern on [2,3], producing [2,3], [2], [3] and finally [].
4. The order is [1,2,3], [1,2], [1,3], [1], [2,3], [2], [3], [] — from 15 calls, which is 2^4 − 1.
5. The loop form instead emits [] immediately at the root, then descends: [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3].
6. That is 8 calls for 8 subsets, exactly one each — but its loop ran 7 times, and 8 + 7 = 15 is the take/skip count.
7. Both outputs contain the same 8 subsets in different orders, and the 12 elements across them match n · 2^(n−1) = 3 · 4.

<!-- @example -->

<!-- @input -->
a = []

<!-- @output -->
[[]] — one subset, not zero

<!-- @why -->
The empty set has exactly one subset, itself, and both recursions must return a list of length one rather than an empty list.

<!-- @walkthrough -->
1. 2^0 is 1, so the answer has exactly one entry.
2. Take/skip calls go(0), immediately finds i == len(a), and copies the empty buffer into the output.
3. That is 1 call, which matches 2^(0+1) − 1 = 1.
4. The loop form emits the empty buffer at the root, then runs a loop with an empty range and returns.
5. That is also 1 call, matching 2^0 = 1, and its loop ran 0 times — consistent with 1 + 0 = 1.
6. Both return [[]], a list containing one empty list.
7. Returning [] instead is the classic off-by-one here, and it propagates: every later element would then double nothing and the whole answer would come back empty.

<!-- @example -->

<!-- @input -->
a = [1, 2], all four approaches

<!-- @output -->
Same 4 subsets, three different orders

<!-- @why -->
The smallest input that separates the output orders of the four approaches, which matters whenever the answer is compared literally.

<!-- @walkthrough -->
1. Take/skip gives [1,2], [1], [2], [] — largest first, because it takes before it skips.
2. The loop form gives [], [1], [1,2], [2] — the empty set first, because it emits on entry.
3. Iterative doubling gives [], [1], [2], [1,2].
4. The bitmask gives [], [1], [2], [1,2] — identical to doubling, element for element.
5. That match is not a coincidence: appending element x to everything built so far is the same operation as setting bit x, so doubling walks the masks in counting order.
6. All four contain the same four subsets, so any comparison must sort or use a set.
7. Verified identical as sets at every n from 0 to 16, and identical in order only for doubling against bitmask.

<!-- @example -->

<!-- @input -->
n = 20, C++ and Python

<!-- @output -->
Take/skip 57.76ms, loop form 57.87ms — 1.00x

<!-- @why -->
The size where the predicted null result is measurable, and where the output first clearly dominates the recursion.

<!-- @walkthrough -->
1. The answer is 1,048,576 subsets holding 10,485,760 integers in total.
2. Take/skip visits 2,097,151 nodes; the loop form visits 1,048,576 and runs 1,048,575 loop iterations.
3. Those two numbers sum to 2,097,151, so the total work is identical and only its shape differs.
4. Measured, take/skip is 57.76ms and the loop form 57.87ms — 1.00x, with a run-to-run spread of 1.002x.
5. Traversing the same tree without building anything takes 3.67ms, so materialising costs 15.8x the walk.
6. Passing the subset by value instead of restoring a shared buffer costs 261.85ms, 4.51x.
7. In Python at n = 16 the same restructuring is worth 0.75x rather than 1.00x, because the frames it removes are expensive there and nearly free in C++.

<!-- @visualization custom -->

<!-- @description -->
Open with the two trees side by side for a = [1,2,3], drawn to the same width so the shapes compare directly. On the left the take/skip tree: a full binary tree of 15 nodes, each level labelled with the element being decided, the 8 leaves shaded as results and the 7 interior nodes left hollow to make visible that half the tree emits nothing. On the right the start-index tree: 8 nodes, every one of them shaded, with the edges out of each node labelled by the loop index i. Under each, print the count as nodes / results — 15 / 8 = 2.00 against 8 / 8 = 1.00. The reader should see the second tree is genuinely smaller before the next panel takes the win away.

The centre panel is the conservation identity and is the heart of the page. Show the loop form's tree again with its 7 loop iterations drawn as small marks on the edges rather than as nodes, and a running tally beside it reading calls 8 + iterations 7 = 15. Set that against the take/skip 15 and label it the branching moved, it did not go away. Then the measurement, as two bars of visibly equal length: C++ take/skip 57.76ms and loop form 57.87ms at n = 20, tagged 1.00x — a predicted null result. Directly beneath, the Python bars for the same pair at n = 16, 29.28ms and 21.97ms, tagged 0.75x, with the caption the same identity, a different price per frame.

The third panel is the one that reframes the problem. Draw the tree at n = 20 as a single small block labelled 2^n nodes beside a much larger block labelled n · 2^(n−1) = 10,485,760 elements, sized to the 15.8x ratio measured between traversing and materialising. Beside it put the by-value comparison as two bars, 57.76ms against 261.85ms, tagged 4.51x in C++ and 1.03x in Python so the split verdict is visible. The message is that both recursion shapes are arguing about the small block.

Close with the arc strip: four bars for nodes per result — loop form 1.000, take/skip 2.000, no adjacent 1s 2.618, parentheses 4.968 — in that order, annotated more constrained, more interior nodes per result. Mark the 2.618 as phi² and the parentheses bar as still rising with n. The caption should state the inversion plainly: constraints remove leaves, not nodes, so pruning cannot reach 1.000 and only restructuring can.

<!-- @sampleInput -->
```json
{"primary":{"a":[1,2,3],"subsets":8,"takeSkip":{"order":[[1,2,3],[1,2],[1,3],[1],[2,3],[2],[3],[]],"calls":15,"formula":"2^(n+1)-1","nodesPerResult":2.00},"loopForm":{"order":[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]],"calls":8,"loopIterations":7,"formula":"2^n","nodesPerResult":1.00},"totalElements":12,"elementsFormula":"n*2^(n-1)"},"nodeCounts":{"rows":[{"n":3,"takeSkip":15,"loopCalls":8,"loopIters":7,"sum":15},{"n":10,"takeSkip":2047,"loopCalls":1024,"loopIters":1023,"sum":2047},{"n":15,"takeSkip":65535,"loopCalls":32768,"loopIters":32767,"sum":65535},{"n":20,"takeSkip":2097151,"loopCalls":1048576,"loopIters":1048575,"sum":2097151}],"identity":"2^n + (2^n - 1) = 2^(n+1) - 1","reading":"the loop form halves the calls but the branching relocates into the loop; total work is conserved"},"timing":{"cpp":{"n":20,"unit":"ms","minOf":15,"eachMeasuredTwice":true,"maxSpread":1.011,"takeSkip":57.76,"loopForm":57.87,"doubling":108.14,"bitmask":289.01,"ratios":{"loopForm":1.00,"doubling":1.87,"bitmask":5.00},"traverseOnly":3.67,"materialiseCost":15.8,"byValue":261.85,"byValueCost":4.51},"python":{"n":16,"unit":"ms","minOf":7,"takeSkip":29.28,"loopForm":21.97,"doubling":12.04,"bitmask":105.66,"byValue":31.01,"ratios":{"loopForm":0.75,"doubling":0.41,"bitmask":3.45,"byValue":1.03}},"reading":"identical total work, opposite verdicts: a call frame is nearly free in C++ and expensive in Python"},"outputDominates":{"treeSize":"Theta(2^n)","outputSize":"Theta(n*2^n)","atN20":{"subsets":1048576,"elements":10485760,"intsMB":40.0,"headersMB":24.0},"averageSubsetSize":"n/2","measured":{"n18":15.7,"n20":15.8}},"orders":{"a":[1,2],"takeSkip":[[1,2],[1],[2],[]],"loopForm":[[],[1],[1,2],[2]],"doubling":[[],[1],[2],[1,2]],"bitmask":[[],[1],[2],[1,2]],"note":"doubling and bitmask agree element for element; appending element x is the same operation as setting bit x"},"nodesPerResultArc":[{"recursion":"power set, loop form","ratio":1.000},{"recursion":"power set, take/skip","ratio":2.000},{"recursion":"no adjacent 1s","ratio":2.618,"closedForm":"phi^2"},{"recursion":"parentheses, n=12","ratio":4.968,"note":"still rising: 5.169 at n=30"}],"arcReading":"a constraint removes leaves, not nodes, so the more constrained the problem the more interior nodes it burns per result","limits":{"practicalCeiling":"n = 20 to 24 for materialising","atN24":{"intsMB":768.0,"headersMB":384.0},"intBound":{"safeTo":30,"overflowsAt":31,"expression":"1 << n as signed int32"}}}
```

<!-- @highlights -->
- Two trees for a = [1,2,3] drawn to the same width, take/skip on the left and start-index on the right.
- Take/skip shows 15 nodes with only its 8 leaves shaded; the 7 interior nodes stay hollow.
- The start-index tree shows 8 nodes, every one shaded, edges labelled by the loop index.
- Counts printed beneath each: 15 / 8 = 2.00 against 8 / 8 = 1.00.
- The centre panel redraws the loop tree with its 7 iterations as edge marks, not nodes.
- A running tally reads calls 8 + iterations 7 = 15, set against the take/skip 15.
- That panel is captioned the branching moved, it did not go away.
- Two C++ bars of visibly equal length: 57.76ms and 57.87ms, tagged 1.00x.
- Two Python bars beneath for the same pair: 29.28ms and 21.97ms, tagged 0.75x.
- Their shared caption reads the same identity, a different price per frame.
- The third panel sizes the tree block against the output block at the measured 15.8x.
- By-value bars sit beside it, 57.76ms against 261.85ms, tagged 4.51x in C++ and 1.03x in Python.
- A closing strip of four nodes-per-result bars: 1.000, 2.000, 2.618, 4.968.
- The 2.618 bar is marked phi² and the 4.968 bar is marked still rising with n.
- The strip is annotated more constrained, more interior nodes per result.
- The final caption states that constraints remove leaves rather than nodes.

<!-- @edgeCases -->
- a = [] — one subset, the empty set, so the answer is [[]] and not [].
- a = [x] — two subsets, [] and [x], the smallest case with any branching.
- The empty subset — produced by every approach, first by the loop form and doubling, last by take/skip.
- The full array — produced first by take/skip and last by doubling and the bitmask.
- Duplicate values in a, such as [1,1] — all four produce 4 subsets including [1] twice, because this problem is about positions rather than values.
- Order-sensitive comparison — the four approaches give three different orders, so any equality check must sort or use a set.
- n = 20 — around the practical ceiling, at 1,048,576 subsets and 40MB of integers plus 24MB of headers.
- n = 24 — 768MB plus 384MB, past the point where materialising is reasonable.
- n = 30 — the last n where 1 << n fits a signed 32-bit int.
- n = 31 — 1 << n overflows a signed int, which makes the bitmask loop wrong rather than merely slow.
- A very large n with only aggregation needed — the tree is Theta(2^n) but the output is Theta(n · 2^n), so not materialising removes a factor of n/2.
- Recursion depth — n frames for take/skip and at most n for the loop form, so the stack is never the constraint here.
- The output vector without reserve — the outer vector reallocates about n times and every inner vector is moved again on each growth.

<!-- @pitfalls -->
- Returning [] for an empty input. The empty set has one subset, itself, so the answer is [[]] and a wrong base here empties the entire result.
- Storing the buffer instead of a copy. out.push_back(cur) in C++, out.add(cur) in Java or out.append(cur) in Python all store one aliased list, and every entry reads as empty once the recursion unwinds.
- Passing the subset by value to avoid the undo. It copies at every node rather than once per leaf and measured 4.51x slower in C++ — though only 1.03x in Python, so the rule is not universal.
- Forgetting to restore the buffer before the second branch. The skip branch then inherits the taken element and the output is silently wrong rather than crashing.
- Recursing on start + 1 instead of i + 1 in the loop form. That allows an element to be chosen again and generates combinations with repetition.
- Reading out.size() in the doubling loop condition. The body grows out on every iteration, so the bound recedes and the loop never terminates.
- Using a generator instead of a list comprehension in the Python doubling form. It is consumed while out is being extended, with the same non-termination.
- Reusing an existing entry in the doubling form rather than copying it. Appending x in place mutates the subset that is meant to remain in the answer without x.
- Using a signed int for the bitmask bound. 1 << n overflows at n = 31 and turns a slow program into a wrong one.
- Writing if (m >> i & 1) in Java. Java will not treat an int as a condition, so it needs == 1.
- Assuming the loop form is faster because it makes half the calls. Its loop runs 2^n − 1 times, the sum is exactly the take/skip node count, and C++ measures the two at 1.00x.
- Comparing outputs literally across approaches. The four produce three distinct orders, and only doubling and the bitmask agree.
- Optimising the tree shape while materialising the answer. The output is n/2 times larger than the tree, so building costs 15.8x the traversal and the shape argument is about the small term.

<!-- @doubt -->
### Why is there no guard in this recursion?

<!-- @answer -->
Because nothing is illegal. The previous two subtopics both had a rule linking one choice to another — no two adjacent 1s, no closing bracket without an open one — and the guard existed to refuse branches that could not lead anywhere. Here the choices are independent: whether element i is in the subset says nothing about element j, so every one of the 2^n combinations is an answer and every leaf is a result. That makes this the floor the other two were measured against. It also means the only structural improvement available is not pruning but restructuring — changing which nodes emit, rather than which nodes exist.

<!-- @doubt -->
### Take/skip or the start-index loop?

<!-- @answer -->
The loop form, but not for the reason usually given. The usual argument is that it visits 2^n nodes against take/skip's 2^(n+1) − 1, so it halves the work. It does halve the call count, but its loop runs 2^n − 1 times and 2^n + (2^n − 1) = 2^(n+1) − 1 exactly — the branching relocated from call frames into loop iterations rather than disappearing. Measured in C++ at n = 20 the two are 57.76ms and 57.87ms, a 1.00x null result with a 1.002x spread. In Python the loop form does win, 21.97ms against 29.28ms, because what it removes is call frames and Python charges far more for those. The real reason to prefer it is that Combination Sum and Subsets II both need the loop index to express pruning and duplicate-skipping, and take/skip cannot express either cleanly.

<!-- @doubt -->
### Why does materialising cost so much more than traversing?

<!-- @answer -->
Because the answer is bigger than the tree. There are 2^n subsets but the average subset holds n/2 elements, so the total output is n · 2^(n−1) = (n/2) · 2^n elements — a factor of n/2 more than the number of leaves. The recursion is Theta(2^n) and the output is Theta(n · 2^n). Measured in C++ at n = 20, walking the tree and accumulating a sum takes 3.67ms while building the same subsets takes 57.76ms, a factor of 15.8, and 15.7x at n = 18. The ratio tracks n/2 as it should. The practical consequence is that if the question is a count, a maximum or a sum, not building the subsets removes a whole factor of n.

<!-- @doubt -->
### Is passing the subset by value always the mistake?

<!-- @answer -->
In C++ yes, in Python essentially not. The by-value version copies the subset at every node instead of once per leaf, and in C++ that means a fresh vector allocation per node — measured 261.85ms against 57.76ms at n = 20, a factor of 4.51. In Python the same change costs 1.03x, which is nothing. The reason is that the Python buffer version is already copying with cur[:] at every leaf, so the two do comparable total work, and Python's list allocation is cheap relative to its interpreter overhead. It is a good example of a rule that is repeated as universal but is really a statement about allocator cost, so it holds where allocation is the dominant term and dissolves where it is not.

<!-- @doubt -->
### Why do doubling and the bitmask give the same order?

<!-- @answer -->
Because they are the same enumeration written twice. Doubling appends element x to every subset built so far, which takes the block of masks 0 to 2^k − 1 and produces the block 2^k to 2^(k+1) − 1 by setting bit k on each. That is precisely counting upward in binary, so the k-th round fills in exactly the masks whose highest set bit is k. Verified at n = 2 and n = 3 the two agree element for element, while take/skip and the start-index loop each produce their own order. Take/skip emits largest-first because it takes before it skips; the loop form emits the empty subset first because it records on entry.

<!-- @doubt -->
### How large can n be?

<!-- @answer -->
Memory decides it, not arithmetic. At n = 20 the answer is 1,048,576 subsets holding 10,485,760 integers — 40MB of data plus about 24MB of vector or list headers. At n = 24 that becomes 768MB plus 384MB, which is past reasonable. So 20 to 24 is the materialising range, and beyond it the only option is to consume each subset as it is produced. The one width trap is the bitmask bound: 1 << n as a signed 32-bit int is correct to n = 30 and overflows at n = 31, which is well past any feasible run but converts a slow program into a wrong one. Java has no unsigned int, so it needs 1L << n there.

<!-- @doubt -->
### Why is the bitmask version the slowest here?

<!-- @answer -->
Because its inner loop does n work per mask no matter how large the subset is. Every one of the 2^n masks is scanned across all n bit positions, so it pays the full n · 2^n with no short-cutting, where the recursions extend a buffer by one element per edge. Measured at n = 20 in C++ it is 289.01ms against the recursion's 57.76ms, a factor of 5.00, and in Python 105.66ms against 29.28ms at n = 16, a factor of 3.45 — which agrees with the 102.1ms the Bit Manipulation treatment measured at the same size. That does not make masks a bad idea; it makes them a bad idea for materialising a power set. Their value is in representing a subset as a single integer for aggregation and subset DP, which is what that file develops.

<!-- @doubt -->
### What does the nodes-per-result number say across the series?

<!-- @answer -->
It inverts the intuitive reading. The loop form here sits at 1.000, take/skip at 2.000, the no-adjacent-1s recursion at phi² = 2.618, and parentheses at 4.968 at n = 12 and still rising — 5.169 by n = 30. So the more constrained the problem, the more interior nodes it burns per result, which is the opposite of what pruning feels like it should do. The explanation is that a constraint removes leaves, not nodes: the interior structure above a surviving leaf stays, and there are simply fewer leaves under it. This is why even perfect pruning could not get parentheses below 4.9, and why reaching 1.000 needed a restructuring rather than a better guard — an option that exists here only because there is no constraint left to check.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
The start-index loop is the form the rest of the topic is built on. **Combination Sum** keeps it exactly as written and adds a target, so the loop becomes the natural place to reintroduce a guard — and after this subtopic it should be clear that the guard removes leaves rather than nodes. **Subsets II** adds duplicate values, where the loop index is what makes skip this repeated element expressible at all; the take/skip shape cannot say it cleanly. **Combination Sum III** adds a size constraint on top. In every one of them the tree is this tree with something refusing part of it, which is why it was worth measuring the unconstrained case on its own first.
