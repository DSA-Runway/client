---
id: learn-all-patterns-of-subsequences-theory
topic: Advanced Recursion
title: Learn All Patterns of Subsequences (Theory)
difficulty: Easy
status: ready
prerequisites:
  - pow-x-n
  - fibonacci-number
  - reverse-an-array
  - nested-loops
  - time-and-space-complexity-basics
relatedIds:
  - count-all-subsequences-with-sum-k
  - check-if-there-exists-a-subsequence-with-sum-k
  - pow-x-n
  - fibonacci-number
---

<!-- @summary -->
One binary decision per element — take it or don't — which builds a complete binary tree with 2^n leaves and 2^(n+1)−1 nodes. Every subsequence problem that follows is this skeleton with the leaf action changed. What decides whether your version is usable is not the tree but what happens between nodes: carrying the partial answer by reference rather than by value avoids exactly (n−1)·2^n + 1 element copies and measured 37.1x faster.

<!-- @theory -->
## What a subsequence is

A subsequence keeps the original **order** but may skip elements. It does not
have to be contiguous.

```
[1, 2, 3]  ->  [], [1], [2], [3], [1,2], [1,3], [2,3], [1,2,3]
```

`[1, 3]` is a subsequence of `[1,2,3]`. It is **not** a subarray, because a
subarray must be a contiguous run. That distinction is the whole reason this
topic exists, and the counts show why:

| n | Subsequences (2^n) | Subarrays (n(n+1)/2 + 1) |
|---|---|---|
| 3 | 8 | 7 |
| 10 | 1,024 | 56 |
| 20 | **1,048,576** | **211** |

At n = 20 there are 4,970 times more subsequences than subarrays. A problem
phrased over subarrays usually has a linear or quadratic answer. A problem
phrased over subsequences starts out exponential, and the work is in *not*
visiting all of it.

## The pattern: one decision per element

Stand at index `i` and ask a single question — is `a[i]` in this subsequence?
There are exactly two answers, and each leads to the same question at `i+1`:

```
solve(i, cur):
    if i == n:  emit(cur); return          // a complete decision set
    cur.push(a[i]); solve(i+1, cur); cur.pop()   // TAKE a[i]
    solve(i+1, cur)                              // DON'T take a[i]
```

That is the entire pattern. Every subsequence problem in this topic is this
function with a different line at the base case.

## The tree is exactly a complete binary tree

Two branches per level, n levels. Counted:

| n | Subsequences emitted | Calls made | 2^(n+1)−1 |
|---|---|---|---|
| 3 | 8 | 15 | 15 |
| 10 | 1,024 | 2,047 | 2,047 |
| 20 | 1,048,576 | **2,097,151** | 2,097,151 |

**2^n leaves and 2^(n+1)−1 nodes**, matched at every n tested. This is worth
contrasting with Fibonacci, whose tree was lopsided and grew by φ ≈ 1.618. Here
both branches are the same size, so the base really is 2 — and unlike Fibonacci
the duplication is not waste. Every leaf is a *different* subsequence, so there
is nothing to memoise away. The exponential is the answer, not an artefact.

## The order it produces

Taking first means the largest subsequence comes out first and the empty one last:

```
[1,2,3]  ->  [1,2,3]  [1,2]  [1,3]  [1]  [2,3]  [2]  [3]  []
```

Swap the two recursive calls and the order reverses. If a problem asks for the
lexicographically smallest answer, or the shortest, this ordering is what decides
whether you can return the first hit or must compare all of them.

## The mistake that makes this unusable

The partial subsequence has to travel down the tree. Passing it **by value** copies
it at every node:

```
void gen(vector<int> cur)     // copies at every one of 2^(n+1)-1 nodes
void gen(vector<int>& cur)    // one push_back and one pop_back per node
```

Counted, the by-value version copies exactly **(n−1)·2^n + 1** elements:

| n | Elements copied by value | By reference |
|---|---|---|
| 5 | 129 | 0 |
| 10 | 9,217 | 0 |
| 15 | 458,753 | 0 |
| 20 | **19,922,945** | **0** |

Measured in wall clock at n = 20: **127,935,583ns against 3,445,597ns — 37.1x**.
The ratio was stable across sizes (33.7x, 36.9x, 37.1x at n = 10, 15, 20), and it
is larger than the copy count alone predicts because every copy also allocates.

The fix is the `push_back` … recurse … `pop_back` sandwich. The `pop_back` is the
half people forget: it undoes the decision on the way out, so the same buffer is
correct for the sibling branch. Take, explore, **undo** — that third step is what
makes one buffer enough for the whole tree.

## The iterative alternative, and when it is actually better

Subsequence `k` corresponds to the bits of `k`: bit `i` set means take `a[i]`. So
you can walk `0 … 2^n − 1` and read off the elements, with no recursion at all.

Measured at n = 20:

| | ns |
|---|---|
| Recursive, one buffer | 3,356,383 |
| Bitmask with an inner loop over bits | 4,388,250 |
| Bitmask with `popcount` | **183,842** |

Two different conclusions in one table. If you need the **elements**, the bitmask
has to loop over the bits to find them, which makes it O(n·2^n) just like the
recursion — and it measured **1.31x slower**, because the recursion reuses one
buffer while the bitmask rebuilds each subsequence from scratch.

But if you only need an **aggregate** — how many, or the total size, or a sum you
can accumulate bitwise — hardware `popcount` removes the inner loop entirely and
it measured **18.3x faster**. The bitmask wins exactly when you never have to
materialise the subsequence.

## Pruning: the difference between 21 calls and 2,097,151

The three problems that follow this one are all the same tree with a different
leaf test, and the interesting one is "does a subsequence with sum K exist?",
because a `true` answer means the rest of the tree does not matter.

At n = 20 with `a = [1 … 20]`, where the full tree is 2,097,151 calls:

| Target | Calls with early return | Saved |
|---|---|---|
| K = 210 (the whole array) | **21** | 100.0% |
| K = 20 | 129,028 | 93.8% |
| K = 1 | 1,048,576 | 50.0% |
| K = 999 (not present) | **2,097,151** | **0.0%** |

K = 210 costs 21 calls — that is `n + 1`, because taking first walks straight down
to the full-set leaf and finds it immediately. K = 1 costs exactly half the tree,
because `1` is the first element and the "don't take" half still has to be
searched.

And K = 999 saves **nothing at all**. Pruning is a best-case optimisation only:
proving a subsequence *exists* can stop early, proving one *does not* cannot. The
worst case is untouched, which is why "count" and "exists" have the same
asymptotic cost and very different practical ones.

## Duplicates produce duplicate subsequences

The recursion decides per *position*, not per *value*, so equal elements generate
equal subsequences by different paths:

| Input | Generated | Distinct |
|---|---|---|
| `[1,2,2]` | 8 | 6 |
| `[2,2,2,2]` | 16 | **5** |

For k identical elements only the count matters, so there are k+1 distinct
results out of 2^k generated. Nothing in the base pattern removes these — that
requires sorting the input and skipping equal siblings, which is exactly what
Subsets II and Combination Sum II are about.

## Where this goes next

**Count all subsequences with sum K** is this tree with the leaf changed from
"emit" to "return 1 if the running sum equals K, else 0", and the parent adding
the two children instead of ignoring them. That single edit turns a generator
into a counter and removes the need for the buffer entirely — you carry a running
sum instead of a list, which drops the space from O(n) to O(1) per level.

<!-- @intuition -->
Every element faces one yes-or-no question — is it in this subsequence — and the answers to all n questions describe exactly one subsequence. That is why there are 2^n of them and why the recursion is a complete binary tree: two branches, n levels, nothing shared between siblings. The part that trips people up is not the branching but the bookkeeping between branches. You want a single buffer that you push onto before exploring the take-branch and pop from afterwards, so it is back to the right state for the not-take branch; copying the buffer instead is correct but does an extra n-times-2-to-the-n worth of work. The other thing worth internalising early is that this tree is not wasteful the way Fibonacci's was. Every leaf is a distinct subsequence, so there is nothing to memoise — the only way to do less work is to stop when you already know the answer.

<!-- @approach -->
### Brute Force - Copy the Partial Subsequence

<!-- @idea -->
Pass the subsequence built so far by value, so each branch gets its own copy.

<!-- @steps -->
1. Take the index i and the subsequence built so far, by value.
2. If i has reached the end, record the subsequence and return.
3. Make a copy with a[i] appended and recurse on it.
4. Recurse again on the untouched copy.
5. Each branch owns its own list, so nothing has to be undone.

<!-- @complexity -->
- time: O(n · 2^n)
- space: O(n · 2^n) in copies, plus O(n) call stack
- note: Correct and the easiest to reason about, because no state is shared between branches — but it copies exactly (n−1)·2^n + 1 elements, which is 19,922,945 at n = 20. Measured 127,935,583ns against the one-buffer version's 3,445,597ns, a factor of 37.1, and the ratio was stable at 33.7x, 36.9x and 37.1x for n = 10, 15 and 20.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void generate(const vector<int>& a, int i, vector<int> cur,
              vector<vector<int>>& out) {
    if (i == (int)a.size()) { out.push_back(cur); return; }

    vector<int> taken = cur;             // a second copy, per node
    taken.push_back(a[i]);
    generate(a, i + 1, taken, out);      // TAKE a[i]
    generate(a, i + 1, cur, out);        // DON'T take a[i]
}
```

<!-- @annotations -->
- 4: cur is taken by value, so every one of the 2^(n+1)-1 nodes receives its own copy of the list.
- 8: And this makes a second copy for the take-branch, which is where the (n-1)*2^n + 1 element copies come from.
- 11: Nothing is undone, because the two branches never share a buffer — that is the one thing this version gets right.

<!-- @code java -->
```java
static void generate(int[] a, int i, List<Integer> cur, List<List<Integer>> out) {
    if (i == a.length) { out.add(new ArrayList<>(cur)); return; }

    List<Integer> taken = new ArrayList<>(cur);
    taken.add(a[i]);
    generate(a, i + 1, taken, out);
    generate(a, i + 1, cur, out);
}
```

<!-- @annotations -->
- 2: The defensive copy into out is needed in every version — a Java List is a reference, so storing cur directly would store the same object 2^n times.

<!-- @code python -->
```python
def generate(a, i=0, cur=(), out=None):
    if out is None:
        out = []
    if i == len(a):
        out.append(list(cur))
        return out
    generate(a, i + 1, cur + (a[i],), out)   # TAKE — builds a new tuple
    generate(a, i + 1, cur, out)             # DON'T take
    return out


# cur + (a[i],) allocates a new tuple at every node, which is the
# same cost as the C++ copy: (n-1)*2^n + 1 elements at size n.
```

<!-- @annotations -->
- 1: Defaulting cur to an empty tuple rather than a list, because a mutable default argument is created once and shared across calls.
- 8: Tuple concatenation is a fresh allocation, so this has the by-value cost even though Python never says the word copy.

<!-- @approach -->
### Optimal - One Buffer, Take and Undo

<!-- @idea -->
Keep a single list, push before the take-branch and pop after it.

<!-- @steps -->
1. Take the index i and a reference to one shared buffer.
2. If i has reached the end, record a copy of the buffer and return.
3. Push a[i], recurse for the take-branch, then pop it back off.
4. Recurse again for the not-take branch, with the buffer restored.
5. The pop is what makes one buffer correct for the whole tree.

<!-- @complexity -->
- time: O(n · 2^n), dominated by copying each finished subsequence out
- space: O(n) for the buffer plus O(n) call stack
- note: One push and one pop per node instead of a copy — measured 3,445,597ns at n = 20 against the by-value version's 127,935,583ns. The pop_back is the step people omit: without it the buffer still holds a[i] when the not-take branch runs, and every subsequence after the first is wrong. This is the form every later subtopic in this topic uses.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void generate(const vector<int>& a, int i, vector<int>& cur,
              vector<vector<int>>& out) {
    if (i == (int)a.size()) { out.push_back(cur); return; }

    cur.push_back(a[i]);                 // TAKE
    generate(a, i + 1, cur, out);
    cur.pop_back();                      // UNDO — the step that matters

    generate(a, i + 1, cur, out);        // DON'T take
}
```

<!-- @annotations -->
- 4: cur is a reference now, so all 2^(n+1)-1 nodes share one list and nothing is copied on the way down.
- 6: out.push_back(cur) still copies, but only 2^n times — once per finished subsequence — rather than once per node.
- 10: Without this pop the buffer still contains a[i] when the not-take branch runs, and every result after the first is wrong.
- 12: By the time this line executes the buffer is exactly as it was on entry, which is the invariant the whole pattern rests on.

<!-- @code java -->
```java
static void generate(int[] a, int i, List<Integer> cur, List<List<Integer>> out) {
    if (i == a.length) { out.add(new ArrayList<>(cur)); return; }

    cur.add(a[i]);
    generate(a, i + 1, cur, out);
    cur.remove(cur.size() - 1);

    generate(a, i + 1, cur, out);
}
```

<!-- @annotations -->
- 6: remove(cur.size() - 1) removes by index, not by value — remove(Integer) would delete the first equal element, which is a different and wrong operation when the list has duplicates.

<!-- @code python -->
```python
def generate(a, i=0, cur=None, out=None):
    if cur is None:
        cur, out = [], []
    if i == len(a):
        out.append(cur[:])          # copy out, since cur keeps changing
        return out

    cur.append(a[i])                # TAKE
    generate(a, i + 1, cur, out)
    cur.pop()                       # UNDO

    generate(a, i + 1, cur, out)    # DON'T take
    return out
```

<!-- @annotations -->
- 5: cur[:] rather than cur — appending cur itself stores a reference to a list that keeps mutating, so every entry in out would end up empty.
- 10: The matching pop. Forgetting it is the single most common bug in this pattern, in every language.

<!-- @approach -->
### The Bitmask Walk

<!-- @idea -->
Number the subsequences from zero to 2^n − 1 and read each one off the bits.

<!-- @steps -->
1. Note that a subsequence is a choice of yes or no for each of n positions.
2. That is exactly an n-bit number, so there are 2^n of them.
3. Count from zero to 2^n − 1.
4. For each value, include a[i] whenever bit i is set.
5. No recursion and no stack are involved.

<!-- @complexity -->
- time: O(n · 2^n) if you need the elements, O(2^n) if a popcount suffices
- space: O(1) beyond the output
- note: Two different verdicts. Reading out the elements requires looping over the bits, which measured 4,388,250ns at n = 20 against the recursion's 3,356,383ns — 1.31x SLOWER, because the recursion reuses one buffer while this rebuilds each subsequence. But when only an aggregate is needed, hardware popcount removes the inner loop and it measured 183,842ns, 18.3x faster. Limited to n below 64 by the width of the counter.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<vector<int>> allSubsequences(const vector<int>& a) {
    int n = (int)a.size();
    vector<vector<int>> out;
    out.reserve(1u << n);

    for (unsigned mask = 0; mask < (1u << n); mask++) {
        vector<int> cur;
        for (int i = 0; i < n; i++)
            if (mask >> i & 1) cur.push_back(a[i]);
        out.push_back(cur);
    }
    return out;
}
```

<!-- @annotations -->
- 9: 1u << n overflows for n of 32 or more; use 1ull and a 64-bit mask if n can reach that, though 2^32 subsequences is already unreachable in practice.
- 12: mask >> i & 1 tests whether position i was taken — this inner loop is what makes the elements version O(n·2^n). Iterating i upward also keeps the original order, which is what makes the result a subsequence rather than an arbitrary subset.

<!-- @code java -->
```java
static List<List<Integer>> allSubsequences(int[] a) {
    int n = a.length;
    List<List<Integer>> out = new ArrayList<>();

    for (int mask = 0; mask < (1 << n); mask++) {
        List<Integer> cur = new ArrayList<>();
        for (int i = 0; i < n; i++)
            if ((mask >> i & 1) == 1) cur.add(a[i]);
        out.add(cur);
    }
    return out;
}
```

<!-- @annotations -->
- 5: 1 << n is an int shift, so n must stay below 31 — at n = 31 this overflows to a negative bound and the loop never runs.

<!-- @code python -->
```python
def all_subsequences(a):
    n = len(a)
    return [[a[i] for i in range(n) if mask >> i & 1]
            for mask in range(1 << n)]


# For an aggregate rather than the elements, skip the inner loop:
#     total_size = sum(bin(m).count("1") for m in range(1 << n))
# which is the popcount form, and far quicker.
```

<!-- @annotations -->
- 4: Python's ints are arbitrary width, so 1 << n has no overflow limit — only time and memory bound n here.
- 7: bin(m).count("1") is Python's popcount idiom; from 3.10 int.bit_count() does the same thing faster.

<!-- @approach -->
### Stop Early When the Answer Is Known

<!-- @idea -->
When the question is whether something exists, return as soon as one branch says yes.

<!-- @steps -->
1. Carry the running total instead of the list, since only the answer matters.
2. At the end of the array, report whether the total equals the target.
3. Explore the take-branch first and return true immediately if it succeeds.
4. Only explore the not-take branch if the first one failed.
5. A true answer stops the search; a false answer still costs the whole tree.

<!-- @complexity -->
- time: O(2^n) worst case, far less when an answer exists
- space: O(n) call stack only — no buffer is needed
- note: The shape every "does it exist" subsequence problem takes. At n = 20 the full tree is 2,097,151 calls; with an early return, K = 210 costs 21 calls (n + 1, since take-first hits the full-set leaf immediately), K = 20 costs 129,028 (93.8% saved) and K = 1 costs 1,048,576 (exactly half). A target that is absent costs 2,097,151 — 0.0% saved, because you cannot prove absence early.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool existsSubsequenceWithSum(const vector<int>& a, int i, long long cur, long long K) {
    if (i == (int)a.size()) return cur == K;

    if (existsSubsequenceWithSum(a, i + 1, cur + a[i], K)) return true;  // TAKE
    return existsSubsequenceWithSum(a, i + 1, cur, K);                   // DON'T
}
```

<!-- @annotations -->
- 5: The base case answers the question instead of emitting, which is the only line that differs from the generator.
- 7: Returning true here is the pruning. Writing return take || notTake instead still short-circuits in C++, but computing both into variables first does not.
- 8: No buffer at all — a running sum carries everything the leaf needs, which drops the per-level space from O(n) to O(1).

<!-- @code java -->
```java
static boolean existsSubsequenceWithSum(int[] a, int i, long cur, long K) {
    if (i == a.length) return cur == K;

    if (existsSubsequenceWithSum(a, i + 1, cur + a[i], K)) return true;
    return existsSubsequenceWithSum(a, i + 1, cur, K);
}
```

<!-- @annotations -->
- 4: Java's || short-circuits too, so return take(...) || skip(...) prunes identically — but assigning both to booleans first evaluates both and loses it.

<!-- @code python -->
```python
def exists_with_sum(a, i, cur, k):
    if i == len(a):
        return cur == k
    if exists_with_sum(a, i + 1, cur + a[i], k):
        return True
    return exists_with_sum(a, i + 1, cur, k)


# Measured at n = 20 against a full tree of 2,097,151 calls:
#   K = 210 -> 21 calls      K = 20 -> 129,028      K = 1 -> 1,048,576
#   K absent -> 2,097,151, exactly the same as no pruning at all.
```

<!-- @annotations -->
- 4: The explicit if is clearer than or here, because it makes the early return visible as the whole point of the function.
- 9: The asymmetry is worth remembering: a yes can be cheap, a no never is.

<!-- @example -->

<!-- @input -->
[1, 2, 3] through the take / not-take recursion

<!-- @output -->
8 subsequences from 15 calls, in take-first order

<!-- @why -->
The smallest tree where every part of the pattern is visible at once — the two branches, the undo step, and the order the results come out in.

<!-- @walkthrough -->
1. At i = 0 the function asks whether 1 is included, and explores the take-branch first with cur = [1].
2. At i = 1 it asks the same about 2, giving cur = [1,2], then about 3, giving cur = [1,2,3].
3. At i = 3 the index has reached the end, so [1,2,3] is emitted — the full set comes out first because take runs first.
4. That frame returns, the 3 is popped, and the not-take branch at i = 2 emits [1,2].
5. Unwinding further pops the 2, and the same two branches under [1] produce [1,3] and [1].
6. The whole right half then repeats with 1 never taken, producing [2,3], [2], [3] and finally [].
7. Fifteen calls were made for eight results, which is 2^(n+1)−1 nodes over 2^n leaves.

<!-- @example -->

<!-- @input -->
The partial subsequence passed by value instead of by reference

<!-- @output -->
(n−1)·2^n + 1 element copies, and 37.1x the running time

<!-- @why -->
It is the difference between a pattern that scales to n = 20 and one that does not, and the cost is exactly computable rather than approximate.

<!-- @walkthrough -->
1. Passing cur by value gives every node its own copy of the list built so far.
2. Summed over the whole tree that is exactly (n−1)·2^n + 1 elements, verified at n = 5, 10, 15 and 20.
3. At n = 20 that is 19,922,945 element copies to produce 1,048,576 subsequences.
4. The by-reference version copies nothing on the way down — one push_back and one pop_back per node.
5. Measured, 127,935,583ns against 3,445,597ns, a factor of 37.1.
6. The ratio held steady across sizes at 33.7x, 36.9x and 37.1x for n = 10, 15 and 20.
7. It exceeds what the copy count alone predicts because each copy also allocates, and allocation is the more expensive half.

<!-- @example -->

<!-- @input -->
Searching for a subsequence with sum K at n = 20

<!-- @output -->
21 calls when it exists, 2,097,151 when it does not

<!-- @why -->
It shows precisely what pruning is worth and, more usefully, precisely when it is worth nothing.

<!-- @walkthrough -->
1. Without an early return the search always visits the whole tree, 2,097,151 calls.
2. With K = 210, the sum of the entire array, the take-first path reaches the full-set leaf directly and returns after 21 calls — that is n + 1.
3. With K = 20 it takes 129,028 calls, saving 93.8%.
4. With K = 1 it takes exactly 1,048,576, half the tree, because 1 is the first element and the entire not-take half still has to be searched.
5. With K = 999, which no subsequence sums to, it takes 2,097,151 calls — identical to no pruning.
6. So the saving ranges from 100% to exactly 0%, decided entirely by whether an answer exists and where it sits in the ordering.
7. That asymmetry is why "does one exist" and "how many are there" have the same worst case but very different typical costs.

<!-- @example -->

<!-- @input -->
An input containing repeated values

<!-- @output -->
[2,2,2,2] generates 16 subsequences of which only 5 are distinct

<!-- @why -->
It explains why later subtopics need a separate skipping rule, rather than the base pattern handling duplicates on its own.

<!-- @walkthrough -->
1. The recursion decides per position, not per value, so a[1] and a[2] are different decisions even when the values are equal.
2. For [1,2,2] that gives 8 generated subsequences of which 6 are distinct.
3. For [2,2,2,2] it gives 16 generated and only 5 distinct.
4. Five is k + 1 for k equal elements, because with all values identical only the count of chosen elements distinguishes a result.
5. So 11 of the 16 are exact duplicates produced by different paths through the tree.
6. Nothing in the base pattern removes them — deduplicating afterwards works but does the exponential work first.
7. Sorting the input and skipping equal siblings at the same level is the real fix, which is what Subsets II and Combination Sum II add.

<!-- @visualization custom -->

<!-- @description -->
The recursion tree for [1,2,3], drawn as a complete binary tree three levels deep with the eight leaves along the bottom. Label each edge take or skip rather than left and right, and put the index being decided at each level down the side, so it reads as one question per row. Beneath each leaf print the subsequence it produced, ordered [1,2,3] [1,2] [1,3] [1] [2,3] [2] [3] [] left to right, and animate the traversal in that order so the take-first ordering is something the reader watches rather than reads. Two counters run alongside: leaves = 2^n = 8 and nodes = 2^(n+1)−1 = 15. Beside this put a small comparison against Fibonacci's tree from the previous topic — same two branches per node, but there the two children were different sizes and repeated each other, whereas here both halves are equal and every leaf is distinct, captioned nothing to memoise. The buffer panel is the centre and should be a single strip representing cur, shown mutating as the traversal runs: elements slide in on a take edge and slide back out on the return, so the push and the pop are visible as one motion each. Run a by-value version beside it where a fresh strip is spawned at every node and the discarded strips pile up, with a copy counter climbing to (n−1)·2^n + 1 against the shared strip's flat zero, and timing bars beneath reading 127,935,583ns against 3,445,597ns at n = 20. Then the pruning panel, which reuses the same tree but greys out everything the search never visits: run it four times for K = 210, 20, 1 and 999, and let the greyed region shrink from almost the entire tree to none of it, with the call counts 21, 129,028, 1,048,576 and 2,097,151 printed under each and the last one captioned a no costs everything. Finally a small bitmask strip: the numbers 0 through 7 in binary beside the subsequence each one selects, making the correspondence between bit i and element i explicit, with a note that reading out the elements needs the inner loop and only a popcount avoids it.

<!-- @sampleInput -->
```json
{"primary":{"input":[1,2,3],"leaves":8,"nodes":15,"identity":{"leaves":"2^n","nodes":"2^(n+1)-1"},"generationOrder":[[1,2,3],[1,2],[1,3],[1],[2,3],[2],[3],[]],"orderingRule":"take-first, so the full set is emitted first and the empty one last","swapTheCallsToReverseIt":true,"tree":{"level0":"decide 1","level1":"decide 2","level2":"decide 3","edgeLabels":["take","skip"]}},"counts":{"rows":[{"n":3,"subsequences":8,"calls":15},{"n":10,"subsequences":1024,"calls":2047},{"n":20,"subsequences":1048576,"calls":2097151}],"verifiedThrough":20,"contrastWithFibonacci":{"fibonacciBase":1.618,"subsequenceBase":2,"why":"both branches are the same size here, and every leaf is a distinct subsequence","memoisable":false,"note":"the exponential is the answer, not waste"}},"vsSubarrays":{"rows":[{"n":3,"subsequences":8,"subarrays":7},{"n":10,"subsequences":1024,"subarrays":56},{"n":20,"subsequences":1048576,"subarrays":211}],"subarrayFormula":"n(n+1)/2 + 1","ratioAtN20":4970,"reading":"a subarray must be contiguous; a subsequence only has to keep order"},"buffer":{"byValueCopyIdentity":"(n-1)*2^n + 1","rows":[{"n":5,"byValue":129,"byRef":0},{"n":10,"byValue":9217,"byRef":0},{"n":15,"byValue":458753,"byRef":0},{"n":20,"byValue":19922945,"byRef":0}],"timingAtN20":{"byValueNs":127935583,"byRefNs":3445597,"ratio":37.1},"ratioBySize":[{"n":10,"ratio":33.7},{"n":15,"ratio":36.9},{"n":20,"ratio":37.1}],"whyLargerThanCopyCount":"every copy also allocates, and allocation is the more expensive half","theUndoStep":"push_back, recurse, pop_back — without the pop the buffer still holds a[i] when the skip branch runs"},"bitmask":{"correspondence":"bit i set means take a[i]","rows":[{"mask":"000","subsequence":[]},{"mask":"001","subsequence":[1]},{"mask":"010","subsequence":[2]},{"mask":"011","subsequence":[1,2]},{"mask":"100","subsequence":[3]},{"mask":"101","subsequence":[1,3]},{"mask":"110","subsequence":[2,3]},{"mask":"111","subsequence":[1,2,3]}],"timingAtN20":{"recursiveOneBufferNs":3356383,"bitmaskInnerLoopNs":4388250,"bitmaskPopcountNs":183842},"verdicts":{"needTheElements":"1.31x SLOWER than the recursion, because it rebuilds each subsequence while the recursion reuses one buffer","needOnlyAnAggregate":"18.3x FASTER, because popcount removes the inner loop"},"limit":"n < 64, and n < 31 in Java where 1 << n is an int shift"},"pruning":{"problem":"does a subsequence sum to K?","n":20,"array":"[1..20]","fullTreeCalls":2097151,"rows":[{"K":210,"calls":21,"savedPct":100.0,"note":"n + 1 — take-first reaches the full-set leaf immediately"},{"K":20,"calls":129028,"savedPct":93.8},{"K":1,"calls":1048576,"savedPct":50.0,"note":"exactly half — 1 is the first element, so the skip half is still searched"},{"K":999,"calls":2097151,"savedPct":0.0,"note":"absent — a no cannot be proved early"}],"asymmetry":"proving existence can stop early; proving absence cannot","consequence":"exists and count share a worst case and differ enormously in practice"},"duplicates":{"rows":[{"input":[1,2,2],"generated":8,"distinct":6},{"input":[2,2,2,2],"generated":16,"distinct":5}],"rule":"k identical elements give k+1 distinct results out of 2^k generated","why":"the recursion decides per position, not per value","fix":"sort and skip equal siblings — what Subsets II and Combination Sum II add"}}
```

<!-- @highlights -->
- The recursion tree for [1,2,3] is drawn complete, three levels deep, with eight leaves along the bottom.
- Edges are labelled take and skip rather than left and right, with the index being decided shown down the side.
- Each leaf prints the subsequence it produced, in the order [1,2,3] [1,2] [1,3] [1] [2,3] [2] [3] [].
- The traversal animates in that order, so take-first is watched rather than asserted.
- Two counters run alongside: leaves = 2^n = 8 and nodes = 2^(n+1)−1 = 15.
- A small panel compares this with Fibonacci's tree — same branching, but there the children differed and repeated each other.
- Here both halves are equal and every leaf is distinct, captioned nothing to memoise.
- The buffer panel shows cur as one strip, with elements sliding in on a take edge and back out on the return.
- That makes the push and the pop visible as a single motion each.
- Beside it a by-value version spawns a fresh strip at every node, and the discarded strips pile up.
- A copy counter climbs to (n−1)·2^n + 1 against the shared strip's flat zero.
- Timing bars beneath read 127,935,583ns against 3,445,597ns at n = 20.
- The pruning panel reuses the tree and greys out everything the search never visits.
- Run for K = 210, 20, 1 and 999, the greyed region shrinks from almost all of the tree to none of it.
- Call counts 21, 129,028, 1,048,576 and 2,097,151 sit under each, the last captioned a no costs everything.
- A bitmask strip lists 0 through 7 in binary beside the subsequence each selects, making bit i to element i explicit.

<!-- @edgeCases -->
- An empty array — there is exactly one subsequence, the empty one, and the base case must emit it rather than nothing.
- A single element — two subsequences, which is the smallest input where both branches matter.
- The empty subsequence — it is a valid result and the take-first ordering puts it last, so a loop that stops early can miss it.
- An array of identical values — 2^n generated but only n+1 distinct, which no part of the base pattern removes.
- n = 20 — about a million subsequences, and roughly the practical ceiling for generating them all.
- n = 31 in Java — 1 << n overflows to a negative bound and the bitmask loop never executes.
- n = 32 or more in C++ with an unsigned mask — 1u << n is undefined; a 64-bit mask is required.
- Forgetting the pop_back — every result after the first is wrong, while the first one still looks correct.
- Storing the buffer itself rather than a copy — every entry in the output ends up referring to the same, finally empty, list.
- A target sum that no subsequence reaches — pruning saves exactly 0%, and the search costs the full 2^(n+1)−1 calls.
- Negative numbers in the array with a sum target — the running total can move away from and back toward K, so no bound-based pruning is valid.

<!-- @pitfalls -->
- Passing the partial subsequence by value. It copies exactly (n−1)·2^n + 1 elements — 19,922,945 at n = 20 — and measured 37.1x slower than sharing one buffer.
- Forgetting the pop_back after the take-branch. The buffer still holds a[i] when the skip branch runs, so everything after the first result is wrong.
- Appending the buffer to the output instead of a copy of it. Every stored entry then refers to the same list, which ends up empty when the recursion finishes.
- Confusing a subsequence with a subarray. A subarray is contiguous; at n = 20 there are 211 subarrays and 1,048,576 subsequences.
- Expecting memoisation to help. Fibonacci's tree repeated subproblems and this one does not — every leaf is a distinct subsequence, so there is nothing to cache.
- Assuming the early return helps in general. It saves up to 100% when an answer exists and exactly 0% when it does not.
- Computing both branches into variables before combining them. That evaluates the second branch even when the first already answered the question, losing the pruning entirely.
- Using 1 << n with an int in Java. At n = 31 the bound goes negative and the loop body never runs.
- Relying on the bitmask being faster. Reading out the elements measured 1.31x SLOWER than the recursion; only an aggregate with popcount was faster, by 18.3x.
- Deduplicating results afterwards. It works but performs the full exponential generation first — sorting and skipping equal siblings avoids the work instead.
- Building the output list when only a count or a yes/no is needed. Carrying a running total instead drops the per-level space from O(n) to O(1) and removes all the copying.
- Trying to generate all subsequences for large n. At n = 30 there are over a billion, so any problem with a large n wants counting or dynamic programming, not enumeration.

<!-- @doubt -->
### Why are there exactly 2^n subsequences?

<!-- @answer -->
Because each element faces one independent yes-or-no question — is it included — and n independent binary choices give 2^n combinations. Each distinct set of answers describes exactly one subsequence, and no two answer-sets give the same result, so the count is exact rather than an upper bound. The recursion mirrors that structure directly: two branches per level, n levels, which makes a complete binary tree with 2^n leaves and 2^(n+1)−1 nodes. Measured, the call count matched 2^(n+1)−1 at every n up to 20, where it is 2,097,151.

<!-- @doubt -->
### How is this different from a subarray?

<!-- @answer -->
A subarray has to be contiguous; a subsequence only has to preserve order. So [1,3] is a subsequence of [1,2,3] but not a subarray of it. The consequence is the count: there are n(n+1)/2 + 1 subarrays and 2^n subsequences, which at n = 20 is 211 against 1,048,576 — a factor of 4,970. That difference decides the whole approach. Subarray problems usually have a linear or quadratic solution, often a sliding window or prefix sums, while subsequence problems start exponential and the work goes into avoiding most of the tree.

<!-- @doubt -->
### Why by reference rather than by value?

<!-- @answer -->
Because by value copies the partial subsequence at every node, and there are 2^(n+1)−1 of them. Counted exactly, that is (n−1)·2^n + 1 element copies — 19,922,945 at n = 20 to produce 1,048,576 results. Sharing one buffer copies nothing on the way down: one push_back before the take-branch and one pop_back after it. Measured at n = 20 that is 3,445,597ns against 127,935,583ns, a factor of 37.1, and the ratio was stable at 33.7x, 36.9x and 37.1x across n = 10, 15 and 20. It is worse than the copy count alone suggests because every copy also allocates.

<!-- @doubt -->
### What exactly does the pop_back do?

<!-- @answer -->
It restores the buffer so the sibling branch sees the correct state. The invariant is that the function leaves cur exactly as it found it. Push a[i], explore everything that includes it, then pop it off — and now the skip-branch runs with a buffer that does not contain a[i], which is what "skip" means. Omit the pop and a[i] stays in the buffer for the rest of the traversal, so the first subsequence emitted is still correct and every one after it is wrong, which is a particularly awkward failure to spot. Take, explore, undo: the third step is what makes a single buffer sufficient for an exponential tree.

<!-- @doubt -->
### Can I memoise this the way I memoised Fibonacci?

<!-- @answer -->
No, and the reason is worth being precise about. Fibonacci's tree repeated subproblems — fib(k) was recomputed F(n−k+1) times — so caching removed work that was genuinely redundant. Here every leaf is a *different* subsequence, so there is nothing being recomputed; the exponential output is the answer rather than an artefact of how it is calculated. If you only need an aggregate — a count, or whether one exists — then the states can collapse and dynamic programming applies, which is where Count all subsequences with sum K eventually leads. But if the problem genuinely asks for all 2^n results, no caching can reduce that, because writing them down already costs that much.

<!-- @doubt -->
### Is the iterative bitmask version better?

<!-- @answer -->
Only for aggregates. If you need the actual elements, the bitmask has to loop over the bits of each mask to find them, which is the same O(n·2^n) as the recursion — and it measured 4,388,250ns at n = 20 against the recursion's 3,356,383ns, so 1.31x slower, because the recursion reuses one buffer while the bitmask rebuilds every subsequence from scratch. If you only need something like a count or a total size, hardware popcount removes the inner loop and it measured 183,842ns, 18.3x faster than the recursion. It also caps n below 64, or below 31 in Java where 1 << n is an int shift.

<!-- @doubt -->
### How much does stopping early actually save?

<!-- @answer -->
Anywhere from everything to nothing, and which one you get depends on the input rather than the code. At n = 20 the full tree is 2,097,151 calls. Searching for a sum of 210, the total of the whole array, costs 21 calls — that is n + 1, because taking first walks straight down to the full-set leaf. A sum of 20 costs 129,028, saving 93.8%. A sum of 1 costs exactly 1,048,576, half the tree, because 1 is the first element and the entire skip-half still has to be searched. And a sum no subsequence reaches costs all 2,097,151 — 0.0% saved. Existence can be proved early; absence cannot.

<!-- @doubt -->
### Does the order the subsequences come out in matter?

<!-- @answer -->
Often, yes. Taking before skipping produces [1,2,3], [1,2], [1,3], [1], [2,3], [2], [3], [] — largest first, empty last. Swapping the two recursive calls reverses that exactly. It matters whenever a problem asks for the first, shortest, longest or lexicographically smallest result, because the right ordering lets you return the first hit instead of collecting everything and comparing. It also explains the pruning numbers above: a target equal to the sum of the whole array is found in n + 1 calls precisely because take-first reaches that leaf before anything else.

<!-- @doubt -->
### What happens when the input has duplicates?

<!-- @answer -->
You get duplicate subsequences, because the recursion decides per position rather than per value. For [1,2,2] that is 8 generated and 6 distinct; for [2,2,2,2] it is 16 generated and only 5 distinct, since with all values equal only the number chosen distinguishes a result — k identical elements give k + 1 distinct outcomes out of 2^k. The base pattern does not remove these. Filtering afterwards works but performs the full exponential generation first; the real fix is to sort the input and skip over equal siblings at the same level, which is exactly what Subsets II and Combination Sum II add to this skeleton.

<!-- @doubt -->
### When should I not use this pattern at all?

<!-- @answer -->
When n is large enough that 2^n is out of reach, which arrives quickly — n = 20 gives about a million subsequences and n = 30 over a billion. If the problem asks for a count, a maximum, or a yes/no rather than the subsequences themselves, then you do not need to enumerate: carry a running value instead of a buffer, and look for overlapping states that let dynamic programming collapse the tree. The rule of thumb is that n up to roughly 20 to 25 suits enumeration, and anything beyond that is signalling that the intended solution is counting or DP. Generating all subsequences is the right approach only when the output genuinely is all of them.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Count all subsequences with sum K, which is this exact tree with two small edits: the leaf returns 1 if the running sum equals K and 0 otherwise, and the parent adds its two children instead of discarding them. That turns a generator into a counter, and it also removes the buffer — you carry a running sum rather than a list, which drops the per-level space from O(n) to O(1) and eliminates all the copying this subtopic spent most of its time on. After that comes the existence variant, which adds the early return, and then Subsets and Combination Sum, which add the duplicate-skipping rule.
