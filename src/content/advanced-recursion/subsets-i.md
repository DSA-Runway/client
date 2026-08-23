---
id: subsets-i
topic: Advanced Recursion
title: Subsets I
difficulty: Medium
status: ready
prerequisites:
  - power-set
  - combination-sum-ii
  - learn-all-patterns-of-subsequences-theory
  - time-and-space-complexity-basics
relatedIds:
  - power-set
  - combination-sum-ii
  - power-set-bit-manipulation
  - learn-all-patterns-of-subsequences-theory
---

<!-- @summary -->
The same problem as Power Set, so the tree is already settled — what is left is the part that subtopic did not measure: which order you get, and whether you can reach one subset without generating the rest. The start-index loop turns out to emit in exactly lexicographic order. Gray code order changes exactly one element per step against counting order's 2^(n+1) − n − 2 total, a ratio converging to exactly 2.000x, which is worth 1.75x when the subsets feed an incremental aggregate and nothing when they are materialised. And the k-th subset is reachable in O(n) — 57.7ns at n = 20 against 34.02ms to generate and index, and possible at n = 60 where generating is not.

<!-- @theory -->
## The same problem, a different question

This is Power Set. Same input, same 2^n outputs, same recursion. That subtopic
measured the *shapes* — take/skip against the start-index loop, the exact
2^(n+1) − 1 and 2^n node counts, the conservation identity, and the finding
that materialising costs 15.8x the traversal. None of that changes here and it
is not repeated.

What Power Set left alone is the part that actually varies once you have to
hand the subsets to something: **the order they arrive in**, and **whether you
can address one directly**. Those turn out to be real decisions with measurable
consequences, and they pull in different directions.

## The loop form is lexicographic

The start-index loop emits on entry and then descends, which is a preorder walk.
That gives:

```
a = [1,2,3]  ->  []  [1]  [1,2]  [1,2,3]  [1,3]  [2]  [2,3]  [3]
```

which is exactly lexicographic order on the index sequences — verified as
`output == sorted(output)` at n = 3, 4, 5 and 18. This is worth knowing because
it is free: the shape you would write anyway already gives the order that gets
asked for, and no sort is needed.

The other two orders are not lexicographic:

| order | n = 3 |
|---|---|
| loop form | [] [1] [1,2] [1,2,3] [1,3] [2] [2,3] [3] |
| counting | [] [1] [2] [1,2] [3] [1,3] [2,3] [1,2,3] |
| gray code | [] [1] [1,2] [2] [2,3] [1,2,3] [1,3] [3] |

Counting order is by mask value, which groups by highest set bit rather than
lexicographically. Gray code order is neither — its defining property is
something else entirely.

## Churn: what changes between consecutive subsets

Gray code order is built so that consecutive subsets differ by **exactly one
element**. Counting order does not: going from `011` to `100` changes three at
once. Summing the changes across the whole enumeration:

| n | gray total | counting total | ratio |
|---|---|---|---|
| 3 | 7 | 11 | 1.571x |
| 4 | 15 | 26 | 1.733x |
| 8 | 255 | 502 | 1.969x |
| 12 | 4,095 | 8,178 | 1.997x |
| 16 | 65,535 | 131,054 | 2.000x |

Both are exact formulas rather than measurements that happen to fit:

```
gray      =  2^n - 1          (one change per step, by construction)
counting  =  2^(n+1) - n - 2
```

verified equal at every n from 3 to 20. The ratio converges to exactly **2**,
and gray's worst single step is 1 element where counting's is n.

## When the churn is the cost

If you materialise every subset, the churn is irrelevant — you pay for the whole
subset either way. Measured in C++ at n = 20, building all 1,048,576 subsets:

| order | time | vs loop |
|---|---|---|
| start-index loop (lexicographic) | 33.50ms | 1.00x |
| counting order | 167.67ms | 5.01x |
| gray code order | 167.30ms | 4.99x |

Counting and gray are indistinguishable, and both lose to the loop form for the
reason Power Set already established — the mask forms rescan all n bits per
subset regardless of size.

The churn only becomes the cost when you *do not* materialise: when each subset
feeds a running aggregate that can be updated by adding and removing single
elements. Measured in C++ at n = 24, summing every subset:

| method | time | vs recompute | element changes |
|---|---|---|---|
| counting order, recomputed per mask | 793.09ms | 1.00x | n · 2^n |
| counting order, incremental | 28.39ms | **27.94x faster** | 33,554,406 |
| gray code order, incremental | 16.23ms | **48.9x faster** | 16,777,215 |

All three produce the identical total, `sum(a) · 2^(n-1)`, which is
order-independent and therefore a genuine check rather than a coincidence.

Two separate wins. Updating incrementally instead of rebuilding is worth 27.94x.
Then switching to gray order is worth a further **1.75x** — against a churn
ratio of exactly 2.000x, the shortfall being the per-subset loop overhead both
versions pay whatever the order.

So gray order is the slowest way to build a list of subsets and the fastest way
to stream them. That is not a contradiction; it is the same fact seen from two
sides.

## The k-th subset without the other 2^n − 1

None of the above helps if you want one particular subset. But the loop form's
order is a preorder over a tree whose subtree sizes are known in advance — the
subtree entered by taking `a[i]` holds exactly `2^(n-1-i)` subsets — so the
k-th subset can be walked to directly, in O(n), touching nothing else.

| n | unrank cost | generate-and-index |
|---|---|---|
| 20 | **57.7ns** | 34.02ms — about 590,000x |
| 30 | 86.1ns | not measured; 1.07 billion subsets |
| 40 | 118.3ns | impossible |
| 60 | 113.0ns | 2^60 subsets — impossible |

Verified exhaustively: for every k from 0 to 2^n − 1 at every n from 0 to 12,
in all three orders, `unrank(k)` equals `generate()[k]`. Counting and gray order
unrank even more simply — the mask *is* k, or `k ^ (k >> 1)` — but the
lexicographic one needs the subtree arithmetic, and lexicographic is usually
the order you want to index into.

At n = 60 there are 1,152,921,504,606,846,976 subsets and asking for
number 576,460,752,303,423,488 returns `[1, 60]` in about 113 nanoseconds.

## Which question are you asking

Three questions, three different answers, and they do not agree:

- **I need all of them, in order** — the start-index loop. Lexicographic for
  free, and 5x faster than the mask forms.
- **I need to fold over all of them** — gray code, streamed. 48.9x faster than
  the naive scan at n = 24, and 1.75x faster than incremental counting order.
- **I need one of them** — unrank. O(n), and the only option once n passes about
  30.

The mistake worth avoiding is answering the second or third question with the
first, which is what generating a list always is.

## Where this goes next

**Subsets II** is this problem with duplicates allowed in the input, and the fix
is the line Combination Sum II already established — `i > start && a[i] ==
a[i-1]` — transferred verbatim with the target removed. That transfer is the
point: the duplicate rule is a property of the input, not of the target. Note
that it applies to the loop form only; the mask and gray forms have no notion of
a level to skip within, and would need the deduplication done differently.

<!-- @intuition -->
Power Set answered how the tree is shaped and what it costs, so none of that is re-derived here. What is left is what happens once the subsets have to go somewhere. The start-index loop emits on entry and then descends, which is a preorder walk, and a preorder walk over this tree is exactly lexicographic order — so the shape you would write anyway hands you the order that gets asked for, free. Gray code order is built around a different property: consecutive subsets differ by exactly one element, which is worth nothing if you are building a list and a great deal if each subset only updates a running total, because then the total work is the number of element changes rather than the number of subsets. And if you want one specific subset, none of the generators help — but the loop form's subtree sizes are known in advance, so you can walk straight to the k-th subset in O(n) and skip everything else, which is the only approach that still works at n = 60.

<!-- @approach -->
### Start-Index Loop, in Lexicographic Order

<!-- @idea -->
Emit the buffer on entry and then extend it, which is a preorder walk and lands the subsets in lexicographic order.

<!-- @steps -->
1. Carry a start index and the shared buffer.
2. Record the buffer immediately on entry, before any recursion — this is the emit.
3. Loop i from start to the last element.
4. Append a[i], recurse with start = i + 1 so each element is used once, then remove it.
5. Let the loop end naturally; a node with nothing left runs an empty loop and returns.

<!-- @complexity -->
- time: O(n · 2^n), dominated by the output
- space: O(n) buffer and stack, plus the output
- note: Emitting on entry makes this a preorder walk, and the order that produces is exactly lexicographic — verified as output == sorted(output) at n = 3, 4, 5 and 18. Measured 33.50ms at n = 20 in C++ and 36.46ms at n = 18 in Python, in both cases about 5x faster than either mask form, because it extends a buffer by one element per edge rather than rescanning n bits per subset. Power Set analyses this tree's node counts and costs; the order is the part that belongs here.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

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
- 6: Emitting here, before the loop, is what makes this a preorder walk — and a preorder walk of this tree is lexicographic order. Moving this line below the loop gives postorder and a different, non-lexicographic sequence.
- 7: Starting at start rather than 0 keeps the index sequence increasing, which is what makes each subset appear exactly once and makes the order well defined.
- 9: i + 1, so each element is used at most once. Passing i instead would be Combination Sum's unlimited reuse.

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
- 3: The copy is required, and the emit position is what fixes the order — the very first call contributes the empty subset before the loop starts, which is why the empty set comes first in lexicographic order.
- 6: Advancing past the taken index. The lexicographic property depends on this being i + 1 rather than start + 1, which would allow the same element twice.

<!-- @code python -->
```python
def subsets(a):
    out, cur = [], []

    def go(start):
        out.append(cur[:])
        for i in range(start, len(a)):
            cur.append(a[i])
            go(i + 1)
            cur.pop()

    go(0)
    return out


# 36.46ms at n = 18, against 178.50ms for counting order and 192.91ms
# for gray. Verified output == sorted(output) at every n tested.
```

<!-- @annotations -->
- 5: cur[:] copies, and its position before the loop is what produces lexicographic order rather than merely a correct set.

<!-- @approach -->
### Counting Order

<!-- @idea -->
Read each n-bit number as a subset, so the enumeration order is the numeric order of the masks.

<!-- @steps -->
1. Loop a mask m from 0 to 2^n − 1.
2. Start an empty subset for this mask.
3. Loop i from 0 to n − 1 and test bit i of m.
4. Include a[i] exactly when that bit is set.
5. Push the finished subset and move to the next mask.

<!-- @complexity -->
- time: O(n · 2^n), with the mask forms' larger constant
- space: O(1) beyond the output
- note: Order is by mask value, which groups by highest set bit and is not lexicographic — [1,2] arrives before [3] here and after it in the loop form. Measured 167.67ms at n = 20 in C++ and 178.50ms at n = 18 in Python, about 5x the loop form, because the inner scan costs n per subset whatever the subset's size. Its consecutive subsets differ by 2^(n+1) − n − 2 element changes in total, exact at every n from 3 to 20, with a worst single step of n. Power Set and the Bit Manipulation treatment both develop what masks are good for; the order is the part that matters here.

<!-- @code cpp -->
```cpp
vector<vector<int>> subsets(const vector<int>& a) {
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
- 5: The mask is the subset's index in this order, which is what makes random access trivial here — subset k is simply the bits of k, with no walk required.
- 8: Bit i selects a[i], so the subset comes out in increasing index order even though the sequence of subsets does not.

<!-- @code java -->
```java
static List<List<Integer>> subsets(int[] a) {
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
- 4: Java has no unsigned int, so this bound breaks at n = 31 and needs a long with 1L << n beyond that — far past any feasible run, but it turns a slow program into a wrong one.
- 7: The == 1 is required, since Java will not treat an int as a condition.

<!-- @code python -->
```python
def subsets(a):
    n = len(a)
    return [[a[i] for i in range(n) if m >> i & 1] for m in range(1 << n)]


# 178.50ms at n = 18, 4.90x the loop form. Order is by mask value:
# [1,2] arrives before [3], where the loop form puts it after.
```

<!-- @annotations -->
- 3: The inner comprehension rebuilds the subset from scratch for each mask, scanning all n bits regardless of how many are set.

<!-- @approach -->
### Gray Code Order

<!-- @idea -->
Walk the masks so that consecutive subsets differ by exactly one element, which makes the enumeration cheap to fold over.

<!-- @steps -->
1. Loop a counter k from 0 to 2^n − 1.
2. Convert it with g = k XOR (k >> 1), the binary reflected Gray code.
3. Read g as a mask exactly as in counting order.
4. Note that g for k and g for k − 1 differ in exactly one bit, always the lowest set bit of k.
5. Emit, or better, update a running aggregate by that single element and never build the subset at all.

<!-- @complexity -->
- time: O(n · 2^n) if materialised, O(2^n) element changes if streamed
- space: O(1) beyond the output
- note: Consecutive subsets differ by exactly one element at every step, giving 2^n − 1 total changes against counting order's 2^(n+1) − n − 2 — a ratio converging to exactly 2.000x, and a worst single step of 1 against n. Materialised it is no better than counting order: 167.30ms against 167.67ms at n = 20 in C++. Streamed into an incremental sum at n = 24 it is 16.23ms against counting order's 28.39ms and a per-mask rescan's 793.09ms — 1.75x and 48.9x. The slowest way to build a list of subsets and the fastest way to fold over them.

<!-- @code cpp -->
```cpp
vector<vector<int>> subsets(const vector<int>& a) {
    int n = a.size();
    vector<vector<int>> out;
    out.reserve(1u << n);
    for (unsigned k = 0; k < (1u << n); k++) {
        unsigned g = k ^ (k >> 1);
        vector<int> s;
        for (int i = 0; i < n; i++)
            if (g >> i & 1) s.push_back(a[i]);
        out.push_back(move(s));
    }
    return out;
}
```

<!-- @annotations -->
- 6: The whole transform. g for k and g for k − 1 differ in exactly one bit — specifically the lowest set bit of k — which is the property the whole order exists for.
- 9: Materialising throws that property away, since building the subset costs n whatever changed. The version worth writing folds instead, adding or removing the single changed element and never constructing s at all.

<!-- @code java -->
```java
static List<List<Integer>> subsets(int[] a) {
    int n = a.length;
    List<List<Integer>> out = new ArrayList<>();
    for (int k = 0; k < (1 << n); k++) {
        int g = k ^ (k >>> 1);
        List<Integer> s = new ArrayList<>();
        for (int i = 0; i < n; i++)
            if ((g >> i & 1) == 1) s.add(a[i]);
        out.add(s);
    }
    return out;
}
```

<!-- @annotations -->
- 5: >>> rather than >>. Java's >> is arithmetic and would sign-extend, which matters the moment k is allowed to reach the top bit; the unsigned shift is the correct one here regardless.
- 8: Same materialising cost as counting order, and the same 5x against the loop form — the Gray property pays only when the subset is not built.

<!-- @code python -->
```python
def subsets(a):
    n = len(a)
    return [[a[i] for i in range(n) if g >> i & 1]
            for g in (k ^ (k >> 1) for k in range(1 << n))]


# 192.91ms at n = 18. Computing k ^ (k >> 1) inside the inner
# comprehension instead of hoisting it here measured 1.48x slower.
```

<!-- @annotations -->
- 3: g is bound once per mask by the generator below. Writing (k ^ (k >> 1)) >> i & 1 inside the inner comprehension recomputes the transform once per element instead of once per subset, which measured 1.48x slower for no reason.

<!-- @approach -->
### Unrank — the k-th Subset in O(n)

<!-- @idea -->
The subtree sizes in the lexicographic tree are known in advance, so walk straight to the k-th subset without generating any other.

<!-- @steps -->
1. Note that in the loop form's preorder, the subtree entered by taking a[i] contains exactly 2^(n-1-i) subsets.
2. If k is zero, the current node is the answer and the buffer is returned as it stands.
3. Otherwise spend one on the node itself and decrement k.
4. Walk i forward, subtracting each subtree's size from k until k falls inside the subtree at i.
5. Append a[i], advance past it, and repeat from step 2.

<!-- @complexity -->
- time: O(n), independent of 2^n
- space: O(n) for the result, nothing else
- note: Verified exhaustively — unrank(k) equals generate()[k] for every k from 0 to 2^n − 1 at every n from 0 to 12, in lexicographic, counting and gray orders. Measured 57.7ns at n = 20 against 34.02ms to generate all 1,048,576 subsets and index one, a factor of about 590,000; 86.1ns at n = 30, 118.3ns at n = 40, 113.0ns at n = 60. At n = 60 there are 1,152,921,504,606,846,976 subsets and generating them is not an option, which is the real argument for this approach rather than the speed.

<!-- @code cpp -->
```cpp
vector<int> subsetAt(const vector<int>& a, unsigned long long k) {
    int n = a.size();
    vector<int> out;
    int i = 0;
    while (k) {
        k--;
        while (true) {
            unsigned long long block = 1ULL << (n - 1 - i);
            if (k < block) break;
            k -= block;
            i++;
        }
        out.push_back(a[i]);
        i++;
    }
    return out;
}
```

<!-- @annotations -->
- 6: One unit is spent on the current node itself, because the loop form emits on entry — that emit is the subset sitting at this position, and skipping past it is what moves into the children.
- 8: 2^(n-1-i) is the number of subsets in the subtree entered by taking a[i]. This is the whole trick: the sizes are known without walking anything.
- 13: Appending and advancing, so the index sequence stays increasing exactly as the generator's does — which is why the result matches generate()[k] rather than merely being some subset.

<!-- @code java -->
```java
static List<Integer> subsetAt(int[] a, long k) {
    int n = a.length;
    List<Integer> out = new ArrayList<>();
    int i = 0;
    while (k != 0) {
        k--;
        while (true) {
            long block = 1L << (n - 1 - i);
            if (k < block) break;
            k -= block;
            i++;
        }
        out.add(a[i]);
        i++;
    }
    return out;
}
```

<!-- @annotations -->
- 5: k != 0 rather than a truthiness test, which Java does not have for numbers.
- 8: 1L, not 1. With a plain int this overflows for n above 31 and silently returns the wrong subset rather than failing.

<!-- @code python -->
```python
def subset_at(a, k):
    n = len(a)
    out = []
    i = 0
    while k:
        k -= 1
        while True:
            block = 1 << (n - 1 - i)
            if k < block:
                break
            k -= block
            i += 1
        out.append(a[i])
        i += 1
    return out


# 1022.9ns at n = 18 against 36.46ms to generate and index — 35,646x.
# Python has no width limit, so n is bounded only by the caller.
```

<!-- @annotations -->
- 8: The subtree size. Python's arbitrary-precision integers mean this stays exact at any n, where the C++ and Java versions are bounded by their shift width.

<!-- @example -->

<!-- @input -->
a = [1, 2, 3], all three orders

<!-- @output -->
Same 8 subsets, three different sequences

<!-- @why -->
Small enough to print completely, and the only size where all three orders can be compared at a glance.

<!-- @walkthrough -->
1. The loop form gives [], [1], [1,2], [1,2,3], [1,3], [2], [2,3], [3].
2. That is exactly sorted order on the index sequences — the empty set, then everything starting with 1, then with 2, then with 3.
3. Counting order gives [], [1], [2], [1,2], [3], [1,3], [2,3], [1,2,3], which is the masks 0 through 7 in numeric order.
4. The two disagree at position 2: the loop form has [1,2] and counting order has [2], because counting order groups by highest set bit.
5. Gray code order gives [], [1], [1,2], [2], [2,3], [1,2,3], [1,3], [3].
6. Reading down that list, every step adds or removes exactly one element — 1, 2, 1, 3, 1, 2, 1 — and never two.
7. Counting order's step from [1,2] to [3] changes three elements at once, which is the difference the churn measurement is about.

<!-- @example -->

<!-- @input -->
n = 16, counting the element changes

<!-- @output -->
Gray 65,535 changes; counting 131,054 — exactly 2.000x

<!-- @why -->
The size where the ratio has converged to its limit, and where both exact formulas can be checked against a count.

<!-- @walkthrough -->
1. Gray code changes one element per step and there are 2^16 − 1 steps, so the total is 65,535 by construction.
2. Counting order's total is 131,054, which matches 2^(n+1) − n − 2 = 131,072 − 16 − 2 exactly.
3. That formula holds at every n from 3 to 20, so it is arithmetic rather than a fitted curve.
4. The ratio is 131,054 / 65,535 = 2.000, having climbed from 1.571 at n = 3 and 1.969 at n = 8.
5. Gray's worst single step is 1 element; counting order's is n, when the mask rolls from 0111... to 1000....
6. Materialised, none of this matters — both build a whole subset per step and measure 167.30ms and 167.67ms at n = 20.
7. Folded into a running total it matters directly, and the measured gap is 1.75x against the churn ratio's 2.000x.

<!-- @example -->

<!-- @input -->
n = 24, summing every subset

<!-- @output -->
793.09ms, 28.39ms, 16.23ms

<!-- @why -->
The case where the order stops being cosmetic, and where an order-independent invariant checks all three at once.

<!-- @walkthrough -->
1. Rebuilding each subset's sum from scratch scans n bits per mask and takes 793.09ms.
2. Updating incrementally in counting order touches only the bits that changed — 33,554,406 of them — and takes 28.39ms, 27.94x faster.
3. Switching to gray order halves the changes to 16,777,215 and takes 16.23ms, a further 1.75x and 48.9x against the rescan.
4. The measured 1.75x falls short of the exact 2.000x churn ratio because both versions still pay a per-subset loop step whatever the order.
5. All three produce 2,516,582,400, which is sum(a) · 2^(n-1) — a value that does not depend on the order, so agreement is a real check.
6. The lesson is that the two wins are separate: incremental instead of rebuilt, and then gray instead of counting.
7. Neither applies if the subsets are being stored, which is why the order question only has an answer once the use is known.

<!-- @example -->

<!-- @input -->
n = 60, k = 576,460,752,303,423,488

<!-- @output -->
[1, 60] in about 113 nanoseconds

<!-- @why -->
The case that separates unranking from every generator, since generating is not merely slow here but impossible.

<!-- @walkthrough -->
1. A 60-element set has 1,152,921,504,606,846,976 subsets, so no generator finishes.
2. Unranking never looks at them: it walks i forward, subtracting subtree sizes 2^(n-1-i) from k.
3. For this k the first subtraction lands immediately, so a[0] = 1 joins the result.
4. The remaining k then skips all the way to the last index, giving [1, 60].
5. The cost is O(n) — measured 113.0ns here, against 57.7ns at n = 20 and 118.3ns at n = 40.
6. At n = 20 the same answer via generate-and-index costs 34.02ms, a factor of about 590,000.
7. Verified against the generator for every k at every n from 0 to 12, so the arithmetic is not merely plausible.

<!-- @visualization custom -->

<!-- @description -->
Open by making the three orders concrete side by side. Draw three columns for a = [1,2,3], each listing its eight subsets top to bottom in its own order: loop form, counting, gray. Draw a connecting line between the columns for one subset — [1,2] is the clearest — so the reader sees it sits at position 2, 3 and 2 respectively. Label the loop column exactly lexicographic and mark the position where it and counting first disagree.

The second panel is the churn, and it should be shown rather than stated. Down the gray column, draw the single element that changes at each step as a small badge on the edge between consecutive rows — 1, 2, 1, 3, 1, 2, 1 — so the reader can see there is always exactly one. Down the counting column do the same, and let the step from [1,2] to [3] carry three badges. Beneath, the totals at n = 16 as two bars, 65,535 against 131,054, tagged exactly 2.000x, with the two formulas 2^n − 1 and 2^(n+1) − n − 2 printed under their bars.

The third panel is where the churn becomes time, and it is the heart of the page. Three bars at n = 24: recompute per mask 793.09ms, counting incremental 28.39ms, gray incremental 16.23ms. Draw the first as visibly dominating, then let the reader see the second win is a further halving. Annotate the two steps separately — incremental instead of rebuilt, 27.94x and then gray instead of counting, 1.75x — and print the shortfall honestly: churn ratio 2.000x, time ratio 1.75x, the difference being per-subset overhead both pay. Beside it put the materialised bars at n = 20 — 33.50, 167.67, 167.30 — captioned materialised, the order buys nothing, so the tension is visible in one view.

Close on unranking. Draw the lexicographic tree for a small n with each subtree labelled by its size 2^(n-1-i), and trace a single path down it for one k, subtracting sizes as it goes and touching no other node. Beside it, the table of unrank costs — 57.7ns at n = 20, 86.1ns at 30, 118.3ns at 40, 113.0ns at 60 — against generate-and-index at 34.02ms for n = 20 and impossible beyond about 30. End with the n = 60 line: 1,152,921,504,606,846,976 subsets exist, and subset number 576,460,752,303,423,488 is [1, 60].

<!-- @sampleInput -->
```json
{"primary":{"a":[1,2,3],"subsets":8,"orders":{"loopForm":[[],[1],[1,2],[1,2,3],[1,3],[2],[2,3],[3]],"counting":[[],[1],[2],[1,2],[3],[1,3],[2,3],[1,2,3]],"gray":[[],[1],[1,2],[2],[2,3],[1,2,3],[1,3],[3]]},"loopFormIsLexicographic":true,"verifiedAt":[3,4,5,18],"firstDisagreement":{"position":2,"loopForm":[1,2],"counting":[2]}},"churn":{"grayFormula":"2^n - 1","countingFormula":"2^(n+1) - n - 2","bothExact":true,"verifiedFrom":3,"verifiedTo":20,"rows":[{"n":3,"gray":7,"counting":11,"ratio":1.571},{"n":4,"gray":15,"counting":26,"ratio":1.733},{"n":8,"gray":255,"counting":502,"ratio":1.969},{"n":12,"gray":4095,"counting":8178,"ratio":1.997},{"n":16,"gray":65535,"counting":131054,"ratio":2.000}],"worstSingleStep":{"gray":1,"counting":"n"},"limit":2.0},"materialised":{"cpp":{"n":20,"subsets":1048576,"unit":"ms","minOf":9,"eachMeasuredTwice":true,"maxSpread":1.02,"loopForm":33.50,"counting":167.67,"gray":167.30,"ratios":{"counting":5.01,"gray":4.99}},"python":{"n":18,"subsets":262144,"unit":"ms","minOf":7,"maxSpread":1.027,"loopForm":36.46,"counting":178.50,"gray":192.91,"ratios":{"counting":4.90,"gray":5.29}},"reading":"materialised, the order buys nothing — both mask forms rescan n bits per subset whatever changed"},"streamed":{"n":24,"task":"sum every subset","unit":"ms","minOf":7,"recomputePerMask":793.09,"countingIncremental":28.39,"grayIncremental":16.23,"elementChanges":{"counting":33554406,"gray":16777215},"churnRatio":2.000,"timeRatio":1.75,"vsRecompute":{"counting":27.94,"gray":48.9},"invariant":{"value":2516582400,"formula":"sum(a) * 2^(n-1)","orderIndependent":true,"allThreeAgree":true},"shortfall":"the measured 1.75x falls short of the exact 2.000x because both pay a per-subset loop step whatever the order"},"unrank":{"cost":"O(n)","subtreeSize":"2^(n-1-i)","verified":"unrank(k) == generate()[k] for every k, every n from 0 to 12, in all three orders","rows":[{"n":20,"ns":57.7,"generateAndIndexMs":34.02,"factor":590000},{"n":30,"ns":86.1},{"n":40,"ns":118.3},{"n":60,"ns":113.0}],"atN60":{"subsets":1152921504606846976,"k":576460752303423488,"result":[1,60]},"python":{"n":18,"ns":1022.9,"generateAndIndexMs":36.46,"factor":35646}},"threeQuestions":[{"question":"all of them, in order","answer":"start-index loop — lexicographic free, 5x faster than the mask forms"},{"question":"fold over all of them","answer":"gray code, streamed — 48.9x over the naive scan, 1.75x over incremental counting"},{"question":"one of them","answer":"unrank — O(n), and the only option past about n = 30"}]}
```

<!-- @highlights -->
- Three columns for a = [1,2,3], each listing its eight subsets in its own order.
- A connecting line follows [1,2] across the columns, showing positions 2, 3 and 2.
- The loop column is labelled exactly lexicographic.
- The first disagreement with counting order is marked at position 2.
- Badges on the edges of the gray column show the single element changing at each step: 1, 2, 1, 3, 1, 2, 1.
- The same badges on the counting column give the [1,2] to [3] step three at once.
- Two bars beneath give the n = 16 totals, 65,535 against 131,054, tagged exactly 2.000x.
- The formulas 2^n − 1 and 2^(n+1) − n − 2 are printed under their respective bars.
- Three bars at n = 24 show 793.09ms, 28.39ms and 16.23ms.
- The two wins are annotated separately: 27.94x for incremental, then a further 1.75x for gray.
- The shortfall is printed honestly — churn ratio 2.000x against time ratio 1.75x.
- Materialised bars at n = 20 sit beside them: 33.50, 167.67, 167.30, captioned the order buys nothing.
- The lexicographic tree is drawn with each subtree labelled by its size 2^(n-1-i).
- One path is traced down it for a single k, subtracting sizes and touching no other node.
- The unrank cost table reads 57.7ns, 86.1ns, 118.3ns, 113.0ns against 34.02ms and impossible.
- The closing line gives n = 60: 1,152,921,504,606,846,976 subsets, and number 576,460,752,303,423,488 is [1, 60].

<!-- @edgeCases -->
- a = [] — one subset, the empty set, so the answer is [[]] and not [].
- a = [x] — two subsets, and the smallest case where the three orders can differ at all (they do not).
- k = 0 — the empty subset in every order, returned before the unranking loop runs once.
- k = 2^n − 1 — the last subset, which is the full array in counting order and the single element [a[n-1]] in lexicographic order.
- k outside 0 to 2^n − 1 — the unranking walk runs i past n − 1 and shifts by a negative amount, which is undefined behaviour in C++ and Java rather than an error.
- n = 0 with k = 0 — the loop never executes and the empty subset is returned correctly.
- n above 31 with a signed int mask — the counting and gray forms break, and the unranking version needs 1L or 1ULL.
- n above 63 — the mask forms have no type left, while the lexicographic unranking still works in Python.
- Duplicate values in the input — this problem assumes distinct elements; duplicates produce repeated subsets, which is what Subsets II handles.
- An input already in descending order — the loop form's output is lexicographic on index sequences, not on values, so the printed subsets will not look sorted.
- Gray order materialised — no cheaper than counting order, so the transform is wasted unless the subsets are being folded rather than stored.
- Gray order with the transform inside the inner loop — recomputes k XOR (k >> 1) once per element instead of once per subset, measured 1.48x slower in Python.
- An incremental fold with a non-invertible operation — gray order needs the aggregate to support removal as well as addition, so max or min cannot use it directly.

<!-- @pitfalls -->
- Assuming any generator gives lexicographic order. Only the loop form does; counting order puts [1,2] before [3] and gray order is neither.
- Moving the emit below the loop in the loop form. That gives postorder, which is still a correct set of subsets but no longer lexicographic.
- Sorting the output to get lexicographic order. The loop form already produces it, so the sort is 2^n log(2^n) of pure waste.
- Using gray code order to build a list. It costs the same as counting order — 167.30ms against 167.67ms at n = 20 — so the transform buys nothing unless the subsets are folded rather than stored.
- Recomputing k XOR (k >> 1) inside the inner loop. It is once per subset, not once per element, and hoisting it measured 1.48x faster in Python.
- Using >> rather than >>> for the Gray transform in Java. The arithmetic shift sign-extends, which is wrong the moment the top bit is involved.
- Expecting the 2.000x churn ratio to appear as a 2.000x speedup. It measured 1.75x, because both versions still pay a per-subset loop step whatever the order.
- Folding with gray order using an operation that cannot be undone. The single-element update must support removal, so a running max needs a different structure.
- Generating all subsets to reach one of them. Unranking is O(n) — about 590,000x faster at n = 20, and the only option at all past roughly n = 30.
- Unranking with an out-of-range k. The walk runs off the end of the array and shifts by a negative amount rather than reporting anything.
- Using int for the unranking counter. It caps n at 31; the shift needs 1ULL in C++ and 1L in Java.
- Forgetting the k-- for the node itself. The loop form emits on entry, so that emit occupies one position and skipping it is what descends into the children.
- Treating this as a different problem from Power Set. It is the same recursion, and the shape and cost analysis is there rather than repeated here.

<!-- @doubt -->
### How is this different from Power Set?

<!-- @answer -->
It is not a different problem — same input, same 2^n outputs, same recursion — so the shape analysis lives there and is not repeated: the exact 2^(n+1) − 1 and 2^n node counts, the conservation identity between the two forms, and the finding that materialising costs 15.8x the traversal. What that subtopic did not answer is what happens once the subsets have to be handed to something, and that turns out to matter: the order they arrive in, and whether one can be reached without the others. Those are the two questions here, and they have measurable answers that pull in different directions — the order that is cheapest to build is not the one that is cheapest to fold over, and neither helps if you want a single subset.

<!-- @doubt -->
### Is the loop form really lexicographic, or just close?

<!-- @answer -->
Exactly lexicographic, on the index sequences. The loop form emits on entry and then descends, which is a preorder walk, and the loop runs the indices in increasing order — so the sequence of emitted index lists is exactly the sorted one. Verified directly as output == sorted(output) at n = 3, 4, 5 and 18. It is worth knowing because it is free: this is the shape you would write anyway, and it hands you the ordering guarantee without a sort. Two caveats. The order is lexicographic on *indices*, so if the input is not sorted by value the printed subsets will not look ordered. And moving the emit below the loop turns it into postorder, which is still a correct set and no longer lexicographic.

<!-- @doubt -->
### What is Gray code order actually for?

<!-- @answer -->
Making consecutive subsets differ by exactly one element, so that a fold over all subsets only ever adds or removes one thing. The total number of element changes across the enumeration is 2^n − 1 by construction, against counting order's 2^(n+1) − n − 2 — both exact, verified equal at every n from 3 to 20 — and the ratio converges to exactly 2. Counting order's worst single step changes n elements at once, when the mask rolls from 0111... to 1000...; gray's worst is 1. This is worth nothing when you materialise, since building a subset costs n whatever changed, and both measured about 167ms at n = 20. It is worth a lot when you stream: summing every subset at n = 24 took 16.23ms in gray order against 28.39ms in counting order.

<!-- @doubt -->
### Why is the speedup 1.75x when the churn ratio is exactly 2?

<!-- @answer -->
Because the churn is not the only cost. Both versions still iterate 2^n times and do the per-subset bookkeeping — advancing the counter, computing the transform, accumulating into the total — and that part is identical whatever the order. Only the element updates halve. So the measured 16.23ms against 28.39ms is 1.75x rather than 2.000x, and the shortfall is exactly the fixed per-subset work. It is worth stating rather than rounding, because it is the honest shape of the result: the ratio you can prove from the formulas is an upper bound on the speedup, approached as the per-element work grows. With a more expensive update than adding an integer, the measured factor would move closer to 2.

<!-- @doubt -->
### How does unranking work?

<!-- @answer -->
By knowing the subtree sizes in advance. In the loop form's preorder, the subtree entered by taking a[i] contains exactly 2^(n-1-i) subsets — every subset of the elements after i, with a[i] prepended. So to find position k: spend one on the current node, since the loop form emits on entry, then walk i forward subtracting 2^(n-1-i) from k until k falls inside the subtree at i. Append a[i], advance, and repeat. That is O(n) with no allocation beyond the result. Counting and gray order unrank even more directly — the mask is k, or k XOR (k >> 1) — but lexicographic is usually the order worth indexing into. Verified exhaustively against the generator for every k at every n from 0 to 12, in all three orders.

<!-- @doubt -->
### When is unranking actually the right answer?

<!-- @answer -->
Whenever you want a subset rather than all of them — sampling one at random, resuming a paginated walk, or distributing ranges of the enumeration across workers. Measured at n = 20 it costs 57.7ns against 34.02ms to generate and index, a factor of about 590,000, and 1022.9ns against 36.46ms in Python. But the speed is the smaller argument. The real one is that generating stops being possible around n = 30 while unranking does not care: at n = 60 there are 1,152,921,504,606,846,976 subsets, and asking for number 576,460,752,303,423,488 returns [1, 60] in about 113 nanoseconds. Cost is O(n), so it grows with the input length rather than the answer count — 57.7ns, 86.1ns and 118.3ns at n = 20, 30 and 40.

<!-- @doubt -->
### Which order should I generate in?

<!-- @answer -->
It depends on the question, and the three answers disagree. If you need all the subsets as a list, use the start-index loop: it is lexicographic for free and about 5x faster than either mask form, because it extends a buffer by one element per edge instead of rescanning n bits per subset. If you need to fold over all of them, do not build a list at all — stream in gray order and update incrementally, which measured 48.9x against the naive per-mask rescan at n = 24. If you need one subset, unrank. The mistake worth naming is answering the second or third question with the first, since building a list is what every generator does and it is the wrong shape for both.

<!-- @doubt -->
### Does any of this apply to Subsets II?

<!-- @answer -->
Three of the four carry over, once one substitution is made. With duplicates the answer size stops being 2^n and becomes the product over distinct values of (count + 1), and every approach that was really about that quantity keeps working. **The loop form** carries over completely, including the lexicographic property, with the duplicate-skip line from Combination Sum II added inside the loop. **Counting order** does not survive as *binary* counting — the skip line has no level to attach to, and masks over positions produce repeats — but it generalises to counting in **mixed radix**, with digit j ranging from 0 to the multiplicity of the j-th distinct value. **Unranking** survives too: the subtree sizes are no longer 2^(n-1-i), but they are the number of distinct subsets of the remaining suffix, which is that same product and still computable in O(n). Only **Gray code** needs a genuinely different construction, being defined over binary words. Subsets II measures all of this, and the loop form is still the one to write — but because it is shortest and fastest, not because it is the only one that works.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
**Subsets II** adds duplicate values to the input and reuses the skip line established in Combination Sum II verbatim — the same condition, with the target removed. That transfer is the point worth watching: the duplicate rule belongs to the input, not to the target, which is why it moves between the two problems unchanged. **Combination Sum III** goes the other way, keeping distinct candidates and fixing the combination size, which adds a guard that is complete and cheap and therefore contrasts cleanly with the incomplete overshoot test that Combination Sum and Combination Sum II both carry.
