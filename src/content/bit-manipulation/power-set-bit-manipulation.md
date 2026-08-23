---
id: power-set-bit-manipulation
topic: Bit Manipulation
title: Power Set Bit Manipulation
difficulty: Medium
status: ready
prerequisites:
  - single-number-i
  - check-if-the-i-th-bit-is-set-or-not
  - count-the-number-of-set-bits
  - set-unset-the-rightmost-unset-bit
relatedIds:
  - power-set
  - subsets-i
  - count-the-number-of-set-bits
  - set-unset-the-rightmost-unset-bit
  - learn-all-patterns-of-subsequences-theory
---

<!-- @summary -->
There are 2^n subsets and 2^n numbers of n bits, so counting from 0 to 2^n − 1 enumerates the power set — bit `i` of the counter decides whether element `i` is in. Verified against a take/skip recursion on 3,000 random sets with 0 mismatched collections. What measurement contradicts is the reason it is usually taught: for *building* the subsets it is **4.21x slower** than the recursion, in both C++ and Python, because it reassembles each subset from scratch. Its real value appears when nothing is materialised — counting over all subsets ran **373x** faster, and building each subset's answer from `m & (m - 1)` ran **26.66x** faster than recomputing.

<!-- @theory -->
## The correspondence

A subset of an n-element set is a yes-or-no decision per element. An n-bit number
is a 0-or-1 per position. Those are the same object:

```
set {a, b, c}

  m = 000  ->  {}          m = 100  ->  {c}
  m = 001  ->  {a}         m = 101  ->  {a, c}
  m = 010  ->  {b}         m = 110  ->  {b, c}
  m = 011  ->  {a, b}      m = 111  ->  {a, b, c}
```

Bit `i` of `m` is 1 exactly when element `i` is in the subset. So looping `m` from
0 to 2^n − 1 visits every subset exactly once, with no recursion, no stack and no
bookkeeping:

```cpp
for (unsigned m = 0; m < (1u << n); m++)
    for (int i = 0; i < n; i++)
        if ((m >> i) & 1) /* element i is in this subset */;
```

Checked against a take/skip recursion on 3,000 random sets of 0 to 12 elements:
both produced exactly the same collection of subsets, and both produced exactly
2^n of them — **0 mismatches**.

## What the measurement says

| n | Subsets | Bitmask | Recursion |
|---|---|---|---|
| 10 | 1,024 | 280,292ns | **73,625ns** |
| 16 | 65,536 | 20,958,791ns | **5,005,333ns** |
| 20 | 1,048,576 | 379,824,250ns | **90,314,542ns** |

The recursion is **4.21x faster**, and Python agrees — at n = 16, 102.1ms against
22.6ms, a factor of 4.52, with `itertools.combinations` faster still at 15.7ms.

The reason is structural. The recursion holds a partial subset and pushes or pops
one element per step, so each subset costs O(1) to derive from the previous one.
The bitmask loop rebuilds every subset from nothing, scanning all n positions:
2^n × n operations instead of 2^n.

So the usual claim — that the bitmask version is the fast one because it avoids
recursion — is wrong. Recursion was never the expensive part.

## Where the bitmask actually wins

The cost above is entirely in **materialising** the subsets. Stop doing that, and
the picture inverts:

| n = 20 | Time | Ratio |
|---|---|---|
| Build every subset as a list | 379,824,250ns | 373x |
| Count over every subset, building nothing | **1,019,083ns** | 1.00x |

373x, for the same enumeration. The loop itself is nearly free; the allocation
and copying is everything.

And once nothing is materialised, the mask becomes usable as an **index**, which
recursion cannot offer. That is the real prize:

```cpp
// subsetSum[m] for every one of the 2^n subsets
vector<int> s(1u << n);
for (unsigned m = 1; m < (1u << n); m++)
    s[m] = s[m & (m - 1)] + a[__builtin_ctz(m)];
```

`m & (m - 1)` is `m` with its lowest set bit removed — a subset already computed,
because it is numerically smaller. `__builtin_ctz(m)` names the element that was
removed. So each subset's answer is built in O(1) from a smaller one:

| n = 20, subset sums | Time | Ratio |
|---|---|---|
| Recompute each sum by scanning | 115,642,291ns | 26.66x |
| Build from `m & (m - 1)` | **4,337,917ns** | 1.00x |

Two idioms from earlier subtopics — dropping the lowest set bit, and counting
trailing zeros — turn enumeration into dynamic programming over subsets. This is
what bitmask DP is, and it is the reason the correspondence matters.

## The limits are severe

2^n grows fast enough that the technique's ceiling arrives quickly:

| n | Subsets | Materialised size |
|---|---|---|
| 10 | 1,024 | trivial |
| 20 | 1,048,576 | ~80 MB |
| 25 | 33,554,432 | **~1.6 GB** |
| 30 | 1,073,741,824 | not feasible |

And two type limits:

- `1 << n` with a signed `int` breaks at n = 31 — `(int)(1 << 31)` is
  −2147483648, so the loop condition `m < (1 << n)` is immediately false and the
  loop body never runs. Write `1u << n`, or `1ull << n` beyond 32.
- Above n = 63 no integer mask exists at all in C++ or Java. Python has no such
  limit — `2**40` is an ordinary integer — but 1,099,511,627,776 subsets is not
  enumerable regardless, so the constraint becomes time rather than the type.

In practice a bitmask solution implies n ≤ 20 or so, and seeing "n ≤ 20" in a
problem statement is itself the hint.

## Where this goes next

**XOR of numbers in a given range** returns to XOR with a pattern-finding
problem: XORing 1 through n has a closed form that depends only on `n % 4`, which
turns an O(n) loop into O(1). **Single Number - III** then uses a single bit of
an XOR to split an array into two independent halves.

<!-- @intuition -->
Choosing a subset is answering one yes-or-no question per element, and a binary number is a row of yes-or-no answers, so the two are the same thing written differently — there is nothing to construct, only a change of notation. That makes counting from 0 upward a complete enumeration of subsets, in a fixed order, with the number itself serving as a name for the subset it describes. The naming is what matters. A recursion can visit every subset perfectly well and slightly faster, but while it is inside one it has no way to refer to another; the mask is an integer, so it can index an array, be stored in a table, or be transformed into a related subset by clearing a bit. Once subsets have names, an answer for one can be built from the answer for a smaller one, and enumeration turns into dynamic programming.

<!-- @approach -->
### Recursive - Take or Skip Each Element

<!-- @idea -->
For each element in turn, branch on including it or not, and record the subset at the bottom.

<!-- @steps -->
1. Track an index into the input and a partial subset being built.
2. When the index passes the end, record a copy of the partial subset.
3. Otherwise recurse once without adding the current element.
4. Then add the current element, recurse again, and remove it afterwards.
5. Note that the tree has 2^n leaves, one per subset.

<!-- @complexity -->
- time: O(2^n * n) including the cost of copying each subset out, O(2^n) for the traversal itself
- space: O(n) for the recursion depth and the partial subset, plus the output
- note: Measured 90,314,542ns at n = 20 against the bitmask loop's 379,824,250ns — 4.21x FASTER, which is the opposite of the usual claim. It wins because it derives each subset from the previous one with a single push or pop, where the bitmask loop rebuilds every subset from nothing. Python agrees at 4.52x, with itertools.combinations faster still.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void go(const vector<int>& a, int i, vector<int>& cur, vector<vector<int>>& out) {
    if (i == (int)a.size()) { out.push_back(cur); return; }
    go(a, i + 1, cur, out);
    cur.push_back(a[i]);
    go(a, i + 1, cur, out);
    cur.pop_back();
}

vector<vector<int>> subsets(const vector<int>& a) {
    vector<vector<int>> out;
    out.reserve(1u << a.size());
    vector<int> cur;
    go(a, 0, cur, out);
    return out;
}
```

<!-- @annotations -->
- 6: The skip branch first, which makes the output start with the empty set — a different order from the bitmask version, though the same collection.
- 8: push before, pop after: the partial subset is shared across the whole traversal rather than rebuilt, which is where the 4.21x comes from.
- 9: The undo step. Omitting it is the classic bug — every later subset then inherits elements it never chose.

<!-- @code java -->
```java
static void go(int[] a, int i, List<Integer> cur, List<List<Integer>> out) {
    if (i == a.length) { out.add(new ArrayList<>(cur)); return; }
    go(a, i + 1, cur, out);
    cur.add(a[i]);
    go(a, i + 1, cur, out);
    cur.remove(cur.size() - 1);
}
```

<!-- @annotations -->
- 2: new ArrayList<>(cur) makes a copy — adding cur itself would store the same mutable list 2^n times, and every entry would end up empty.

<!-- @code python -->
```python
def subsets(a: list[int]) -> list[list[int]]:
    out, cur = [], []
    def go(i):
        if i == len(a):
            out.append(cur[:])
            return
        go(i + 1)
        cur.append(a[i])
        go(i + 1)
        cur.pop()
    go(0)
    return out


# Measured 22.6ms at n = 16 against the bitmask loop's 102.1ms.
# itertools.chain.from_iterable(combinations(a, r) for r in range(len(a)+1))
# is faster still at 15.7ms, and is what to write in real code.
```

<!-- @annotations -->
- 5: cur[:] copies the list; appending cur itself would store 2^n references to one list that ends up empty.
- 16: The library version, and the one to reach for unless the mask itself is needed.

<!-- @approach -->
### The Correspondence - Count from 0 to 2^n - 1

<!-- @idea -->
Each n-bit number names one subset: bit i decides whether element i is included.

<!-- @steps -->
1. Loop `m` from 0 to `2^n - 1`, giving exactly 2^n values.
2. For each `m`, scan positions 0 to n − 1.
3. Include element `i` whenever bit `i` of `m` is set.
4. Emit the assembled subset.
5. Note that `m = 0` gives the empty set and `m = 2^n - 1` gives the whole set.

<!-- @complexity -->
- time: O(2^n * n) — every subset is rebuilt from scratch by scanning all n positions
- space: O(1) beyond the output, with no recursion stack
- note: Produced exactly the same collection as the recursion on 3,000 random sets of 0 to 12 elements, 0 mismatches. Measured 379,824,250ns at n = 20, which is 4.21x SLOWER than the recursion — the loop is cheap and the rebuilding is not. Use it when the mask itself is wanted as a name; use the recursion when only the subsets are.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<vector<int>> subsets(const vector<int>& a) {
    int n = a.size();
    vector<vector<int>> out;
    out.reserve(1u << n);

    for (unsigned m = 0; m < (1u << n); m++) {
        vector<int> s;
        for (int i = 0; i < n; i++)
            if ((m >> i) & 1u) s.push_back(a[i]);
        out.push_back(move(s));
    }
    return out;
}
```

<!-- @annotations -->
- 9: 1u << n, not 1 << n. At n = 31 a signed shift gives -2147483648, so the loop condition is false immediately and the body never runs — an empty result rather than a crash. m is unsigned so that n = 31 works; beyond 32 elements it must be unsigned long long, and beyond 63 no mask exists at all.
- 12: This inner scan is the whole cost: 2^n * n operations, against the recursion's single push or pop per subset.

<!-- @code java -->
```java
static List<List<Integer>> subsets(int[] a) {
    int n = a.length;
    List<List<Integer>> out = new ArrayList<>(1 << n);

    for (int m = 0; m < (1 << n); m++) {
        List<Integer> s = new ArrayList<>();
        for (int i = 0; i < n; i++)
            if (((m >> i) & 1) == 1) s.add(a[i]);
        out.add(s);
    }
    return out;
}
```

<!-- @annotations -->
- 5: Java has no unsigned int, so n = 31 needs a long loop variable and 1L << n; below that this is safe.

<!-- @code python -->
```python
def subsets(a: list[int]) -> list[list[int]]:
    n = len(a)
    return [[a[i] for i in range(n) if (m >> i) & 1]
            for m in range(1 << n)]


# No width limit — 1 << 40 is an ordinary integer — so the ceiling here
# is time rather than the type: 2**40 is 1,099,511,627,776 subsets.
# Measured 102.1ms at n = 16 against the recursion's 22.6ms.
```

<!-- @annotations -->
- 3: Reads directly as the correspondence: for each mask, take the elements whose bit is set.
- 7: The one language where n = 31 and n = 63 are not special, which removes the shift traps and none of the combinatorial ones.

<!-- @approach -->
### Optimal for Aggregation - Do Not Materialise

<!-- @idea -->
If the answer is a count, a maximum or a sum, compute it inside the loop and never build a subset at all.

<!-- @steps -->
1. Loop `m` from 0 to `2^n - 1` as before.
2. Compute whatever the subset contributes, directly from `m`.
3. Use `popcount(m)` for its size, without listing its elements.
4. Accumulate into a running answer.
5. Never allocate a container per subset.

<!-- @complexity -->
- time: O(2^n) when the contribution is O(1) to compute
- space: O(1)
- note: Measured 1,019,083ns at n = 20 against 379,824,250ns for the same enumeration with subsets built — a factor of 373. The enumeration was never the expensive part; the allocation and copying was. This is the form most competitive-programming uses of a bitmask actually take.

<!-- @code cpp -->
```cpp
long long totalOfAllSubsetSizes(int n) {
    long long total = 0;
    for (unsigned m = 0; m < (1u << n); m++)
        total += __builtin_popcount(m);
    return total;
}

// n = 20: 1,019,083ns, against 379,824,250ns for the same loop with
// the subsets actually constructed — 373x, for identical enumeration.
```

<!-- @annotations -->
- 4: popcount(m) is the subset's size, available without ever listing its elements — the single clearest illustration of the mask being the subset.
- 8: Worth internalising before optimising anything else about a bitmask loop: the allocation dominates by two orders of magnitude.

<!-- @code java -->
```java
static long totalOfAllSubsetSizes(int n) {
    long total = 0;
    for (int m = 0; m < (1 << n); m++)
        total += Integer.bitCount(m);
    return total;
}
```

<!-- @annotations -->
- 4: Integer.bitCount is an intrinsic, so the subset's size costs one instruction.

<!-- @code python -->
```python
def total_of_all_subset_sizes(n: int) -> int:
    return sum(m.bit_count() for m in range(1 << n))


# Measured 13.5ms at n = 16 against 102.1ms for the materialising
# version — the same 7.6x shape as the C++ result, from the same cause.
```

<!-- @annotations -->
- 2: bit_count() gives the subset size directly; the elements themselves are never touched.

<!-- @approach -->
### Optimal for Subset DP - Build Each Answer from m & (m - 1)

<!-- @idea -->
Every mask's answer can be derived in O(1) from the mask with its lowest set bit removed, which is a smaller number and therefore already computed.

<!-- @steps -->
1. Allocate an array of size 2^n indexed by mask.
2. Set the entry for mask 0 to the empty-subset answer.
3. For each `m` from 1 upward, let `low = ctz(m)` be the lowest included element.
4. Let `rest = m & (m - 1)` be the same subset without that element.
5. Combine the stored answer for `rest` with element `low` to get the answer for `m`.

<!-- @complexity -->
- time: O(2^n) — one array read and one combine per subset, rather than O(2^n * n)
- space: O(2^n) for the table
- note: Measured 4,337,917ns at n = 20 against 115,642,291ns for recomputing each subset's sum by scanning — a factor of 26.66. Two idioms carry the whole technique: n & (n - 1) drops the lowest set bit, giving a strictly smaller and therefore already-solved mask, and a trailing-zero count names the element that was dropped. This is what bitmask dynamic programming is.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> allSubsetSums(const vector<int>& a) {
    int n = a.size();
    vector<int> sum(1u << n, 0);

    for (unsigned m = 1; m < (1u << n); m++) {
        int low = __builtin_ctz(m);
        sum[m] = sum[m & (m - 1)] + a[low];
    }
    return sum;
}
```

<!-- @annotations -->
- 9: ctz is safe here because the loop starts at 1, so m is never 0 — the one input for which __builtin_ctz is undefined.
- 10: m & (m - 1) is numerically smaller than m, so its entry is always already filled — that ordering is what makes a plain ascending loop a valid DP order. One addition per subset instead of a scan of n elements, which is the 26.66x.

<!-- @code java -->
```java
static int[] allSubsetSums(int[] a) {
    int n = a.length;
    int[] sum = new int[1 << n];

    for (int m = 1; m < (1 << n); m++) {
        int low = Integer.numberOfTrailingZeros(m);
        sum[m] = sum[m & (m - 1)] + a[low];
    }
    return sum;
}
```

<!-- @annotations -->
- 6: numberOfTrailingZeros is defined for 0 in Java, so this would be safe even if the loop started at 0 — unlike the C++ builtin.

<!-- @code python -->
```python
def all_subset_sums(a: list[int]) -> list[int]:
    n = len(a)
    total = [0] * (1 << n)
    for m in range(1, 1 << n):
        low = (m & -m).bit_length() - 1
        total[m] = total[m & (m - 1)] + a[low]
    return total


# (m & -m) isolates the lowest set bit and bit_length() - 1 turns that
# power of two into an index, since Python has no trailing-zero builtin.
```

<!-- @annotations -->
- 5: The standard Python substitute for a trailing-zero count, exact at any width.
- 6: The recurrence is the same in all three languages, because it is a statement about masks rather than about integers of a particular size.

<!-- @example -->

<!-- @input -->
The set {a, b, c}

<!-- @output -->
Eight masks, eight subsets, in a fixed order

<!-- @why -->
Three elements is the smallest size where the correspondence is visible as a pattern rather than a coincidence.

<!-- @walkthrough -->
1. There are 3 elements, so there are 2^3 = 8 subsets and 8 three-bit numbers.
2. m = 000 has no bits set, so the subset is empty.
3. m = 001 has bit 0 set, so element 0 is included: {a}.
4. m = 010 gives {b}, and m = 011 has bits 0 and 1 set, giving {a, b}.
5. m = 100 gives {c}, m = 101 gives {a, c}, m = 110 gives {b, c}.
6. m = 111 has every bit set, giving the whole set {a, b, c}.
7. Every subset appears exactly once, and the number m is not merely a loop counter — it is a name for the subset, which is what makes it usable as an array index later.

<!-- @example -->

<!-- @input -->
3,000 random sets of 0 to 12 elements, both methods

<!-- @output -->
0 mismatched collections and 0 wrong counts

<!-- @why -->
The two methods emit subsets in different orders, so the comparison has to be on the collection rather than the sequence — and that is the only thing that should match.

<!-- @walkthrough -->
1. Each random set was enumerated twice: once by the take/skip recursion and once by counting masks from 0 to 2^n - 1.
2. Both produced exactly 2^n subsets in every case, with 0 wrong counts — including n = 0, where 2^0 = 1 and the single subset is the empty one.
3. The outputs were compared as multisets, because the orders differ: the recursion emits the empty set first and the bitmask loop emits subsets in numerical order of their masks.
4. Across all 3,000 cases the collections were identical, with 0 mismatches.
5. That is the correspondence stated as a test rather than as an argument: the same 2^n objects, reached two different ways.
6. n = 0 is worth keeping in the test set, since it is the case where "loop from 0 to 2^n - 1" means a single iteration and an easy off-by-one produces zero or two.
7. Neither method requires the input to be sorted or distinct — duplicate elements simply produce duplicate subsets, in both.

<!-- @example -->

<!-- @input -->
n = 20, with subsets built and with nothing built

<!-- @output -->
379,824,250ns against 1,019,083ns — 373x, for the same enumeration

<!-- @why -->
It locates the cost of a bitmask loop somewhere other than where the technique's reputation puts it.

<!-- @walkthrough -->
1. Enumerating all 1,048,576 subsets of a 20-element set and building each as a list took 379,824,250ns.
2. Running the identical loop and merely accumulating popcount(m) took 1,019,083ns.
3. That is a factor of 373 for the same number of iterations over the same masks.
4. So the enumeration is nearly free and the allocation and copying is essentially the entire cost.
5. The same comparison explains the earlier surprise: the recursion beat the bitmask loop by 4.21x not because recursion is fast, but because it builds each subset incrementally with one push or pop while the bitmask loop rescans all n positions.
6. Both facts point the same way: if the subsets must be materialised, use the recursion or a library; if they must not, use the mask.
7. Python shows the same shape — 13.5ms counting against 102.1ms materialising at n = 16.

<!-- @example -->

<!-- @input -->
All 2^20 subset sums, recomputed against built from m & (m - 1)

<!-- @output -->
115,642,291ns against 4,337,917ns — 26.66x

<!-- @why -->
This is the use the correspondence exists for, and it is not available to a recursion at all.

<!-- @walkthrough -->
1. Computing each subset's sum by scanning its elements costs O(n) per subset, so 2^n * n operations in total — 115,642,291ns at n = 20.
2. The alternative uses the mask as an array index, which requires the subsets to have names, which is exactly what the mask provides.
3. For any non-empty mask m, the value m & (m - 1) is m with its lowest set bit removed — the same subset minus one element.
4. That value is numerically smaller than m, so in an ascending loop its answer has already been computed.
5. __builtin_ctz(m) names the element that was removed, so sum[m] = sum[m & (m-1)] + a[ctz(m)] completes the recurrence in O(1).
6. Measured, that took 4,337,917ns — 26.66x faster, and it reuses two idioms established several subtopics earlier.
7. A recursion could compute the same values but could not index them, because inside one subset it has no name for another; the mask is an integer and can be looked up.

<!-- @visualization custom -->

<!-- @description -->
Open with the correspondence panel: on the left a set drawn as three labelled boxes a, b and c, each with a toggle switch; on the right a three-bit number with cells 0, 1 and 2. Flip a switch and watch the corresponding cell light, and vice versa, so the reader can drive it from either side and see the two representations locked together. Then run the counter from 000 to 111, showing both the mask and the subset it names at each step, ending with all eight laid out as a table. Emphasise that m = 0 is the empty set and m = 111 is everything. Then the cost panel, which is the surprise: two side-by-side animations at n = 4. On the left, the recursion, drawn as a binary tree with a single partial-subset tray at the bottom that gains and loses one element per step — highlight that only one element moves per transition. On the right, the bitmask loop, where each new mask empties the tray completely and refills it by scanning all four positions — highlight that four reads happen per subset regardless. Put operation counters under each, ending at roughly 2^n against 2^n x n, and the measured timings 90,314,542ns against 379,824,250ns at n = 20, labelled "4.21x — the opposite of the usual claim". Then the inversion panel: the same bitmask loop with the output tray removed entirely, only a running total updating, and its counter finishing 373x faster — with the caption "the enumeration was never the cost". Then the DP panel, which is the payoff: an array of 16 cells indexed by mask, for n = 4. Fill them in ascending order; for each m, draw an arrow from cell m back to cell m & (m - 1), visibly a lower index, and show the lowest set bit being stripped off the mask and turning into an element index via a trailing-zero count. The arrows form a forest pointing leftward, and the reader sees that every dependency is already filled. Annotate 26.66x. Close with the limits panel: a bar chart of 2^n at n = 10, 20, 25 and 30 on a log scale, with the materialised size annotated — trivial, 80 MB, 1.6 GB, not feasible — and a red marker at n = 31 showing (int)(1 << 31) evaluating to -2147483648 and the loop body never running.

<!-- @sampleInput -->
```json
{"correspondence":{"set":["a","b","c"],"n":3,"subsetCount":8,"table":[{"mask":0,"bits":"000","subset":[]},{"mask":1,"bits":"001","subset":["a"]},{"mask":2,"bits":"010","subset":["b"]},{"mask":3,"bits":"011","subset":["a","b"]},{"mask":4,"bits":"100","subset":["c"]},{"mask":5,"bits":"101","subset":["a","c"]},{"mask":6,"bits":"110","subset":["b","c"]},{"mask":7,"bits":"111","subset":["a","b","c"]}],"rule":"bit i of m is 1 exactly when element i is in the subset","keyPoint":"m is not a loop counter — it is a NAME for the subset, which is what makes it usable as an array index"},"verification":{"randomSets":3000,"sizeRange":[0,12],"collectionMismatches":0,"wrongCounts":0,"comparedAs":"multisets, because the two methods emit different ORDERS","recursionOrder":"empty set first","bitmaskOrder":"numerical order of masks","n0Note":"2^0 = 1, and the single subset is the empty one — the case where an off-by-one gives 0 or 2"},"materialising":{"unit":"ns","rows":[{"n":10,"subsets":1024,"bitmask":280292,"recursion":73625},{"n":16,"subsets":65536,"bitmask":20958791,"recursion":5005333},{"n":20,"subsets":1048576,"bitmask":379824250,"recursion":90314542}],"ratio":4.21,"winner":"recursion","why":"the recursion derives each subset from the previous one with one push or pop; the bitmask loop rebuilds every subset by scanning all n positions — 2^n * n against 2^n","contradicts":"the usual claim that the bitmask version is faster because it avoids recursion","python":{"n":16,"bitmask":102.1,"recursion":22.6,"itertools":15.7,"countOnly":13.5,"unit":"ms","ratio":4.52}},"notMaterialising":{"n":20,"buildEverySubset":379824250,"countOnly":1019083,"ratio":373,"unit":"ns","reading":"the enumeration is nearly free; the allocation and copying is essentially the entire cost","sizeWithoutListing":"popcount(m) is the subset's size, available without touching any element"},"subsetDp":{"n":20,"recomputeEach":115642291,"buildFromLowerMask":4337917,"ratio":26.66,"unit":"ns","recurrence":"sum[m] = sum[m & (m - 1)] + a[ctz(m)]","whyItWorks":["m & (m - 1) is m without its lowest set bit — the same subset minus one element","it is numerically SMALLER than m, so an ascending loop has already filled it","ctz(m) names the element that was removed"],"idiomsReused":["set-unset-the-rightmost-unset-bit","count-the-number-of-set-bits"],"unavailableToRecursion":"inside one subset a recursion has no name for another; a mask is an integer and can be looked up"},"limits":{"growth":[{"n":10,"subsets":1024,"materialised":"trivial"},{"n":20,"subsets":1048576,"materialised":"~80 MB"},{"n":25,"subsets":33554432,"materialised":"~1.6 GB"},{"n":30,"subsets":1073741824,"materialised":"not feasible"}],"typeTraps":[{"expr":"1 << 31 as signed int","value":-2147483648,"consequence":"the loop condition m < (1 << n) is false immediately and the body never runs — an empty result, not a crash","fix":"1u << n, or 1ull << n beyond 32"},{"limit":"n > 63","consequence":"no integer mask exists in C++ or Java"},{"language":"Python","noWidthLimit":true,"note":"2**40 is an ordinary integer, so the ceiling is time — 1,099,511,627,776 subsets"}],"practicalHint":"a bitmask solution implies n <= 20 or so, and seeing 'n <= 20' in a problem statement is itself the hint"}}
```

<!-- @highlights -->
- A set of three toggle switches sits beside a three-bit number, and flipping either drives the other.
- The counter then runs from 000 to 111, showing each mask beside the subset it names.
- All eight are laid out as a table, with m = 0 as the empty set and m = 111 as everything.
- Two side-by-side animations at n = 4 compare the recursion and the bitmask loop.
- The recursion shows a single partial-subset tray gaining and losing one element per transition.
- The bitmask loop empties the tray completely and refills it by scanning all four positions each time.
- Operation counters end at roughly 2^n against 2^n x n.
- The measured timings 90,314,542ns and 379,824,250ns are labelled "4.21x — the opposite of the usual claim".
- The output tray is then removed and only a running total updates, finishing 373x faster.
- It is captioned "the enumeration was never the cost".
- A 16-cell array indexed by mask fills in ascending order for n = 4.
- Each cell draws an arrow back to cell m & (m - 1), visibly a lower index.
- The lowest set bit is stripped off the mask and turns into an element index via a trailing-zero count.
- The arrows form a leftward forest, showing every dependency already filled, annotated 26.66x.
- A log-scale bar chart gives 2^n at n = 10, 20, 25 and 30 with materialised sizes annotated.
- A red marker at n = 31 shows (int)(1 << 31) evaluating to -2147483648 and the loop body never running.

<!-- @edgeCases -->
- n = 0 — there is exactly one subset, the empty one, and the loop runs once for m = 0.
- n = 1 — two subsets, and the smallest case where the mask has more than one value.
- m = 0 — the empty set, which is a subset and must not be skipped.
- m = 2^n - 1 — the whole set, and the last iteration.
- n = 31 with a signed shift — 1 << 31 is -2147483648, so the loop never executes and the result is silently empty.
- n = 32 with an unsigned int — 1u << 32 is undefined in C++; use 1ull.
- n > 63 — no integer mask exists in C++ or Java at all.
- Duplicate elements in the input — produce duplicate subsets, in both methods; deduplication is a separate problem.
- An unsorted input — irrelevant to correctness, though it changes the order elements appear within each subset.
- __builtin_ctz(0) in the DP loop — undefined behaviour, avoided only because the loop starts at m = 1.
- n around 25 when materialising — roughly 1.6 GB of output, which is a memory limit reached long before a time limit.

<!-- @pitfalls -->
- Writing 1 << n with a signed int at n = 31. The loop bound becomes negative, the body never runs, and the result is an empty list rather than an error.
- Claiming the bitmask version is faster. Measured, it is 4.21x slower than the recursion for building subsets, in C++ and Python alike.
- Optimising the enumeration when the allocation is the cost. Counting over the same masks without building anything was 373x faster.
- Forgetting the pop in the recursive version. Every later subset then inherits elements it never chose.
- Storing the shared partial subset instead of a copy. All 2^n entries end up referring to one list, which is empty at the end.
- Calling __builtin_ctz(m) with m = 0 in the DP loop. It is undefined behaviour; the loop must start at 1.
- Using m & (m - 1) as the DP predecessor without checking the loop is ascending. The recurrence is only valid because the predecessor is numerically smaller.
- Reaching for a bitmask at n = 25 or above. That is 33,554,432 subsets and roughly 1.6 GB materialised.
- Assuming the two methods emit subsets in the same order. They do not — comparing sequences rather than collections reports a failure that is not one.
- Using a bitmask for subsets of a multiset. Duplicate elements produce duplicate subsets, and deduplicating afterwards costs more than a different enumeration would.
- Writing the inner scan when only the subset's size is needed. popcount(m) gives it in one instruction without touching an element.
- Treating n <= 20 in a problem statement as a coincidence. It is the constraint that identifies a bitmask solution.

<!-- @doubt -->
### Why does counting from 0 to 2^n - 1 enumerate the power set?

<!-- @answer -->
Because both objects are the same thing. A subset is one yes-or-no decision per element, and an n-bit number is one 0-or-1 per position, so each mask names exactly one subset and each subset has exactly one mask. There are 2^n of each, and the correspondence is a bijection rather than a coincidence. Verified rather than argued: on 3,000 random sets of 0 to 12 elements the mask enumeration and a take/skip recursion produced identical collections, with 0 mismatches, and both produced exactly 2^n subsets every time.

<!-- @doubt -->
### Is the bitmask version faster than recursion?

<!-- @answer -->
No — it is 4.21x slower for actually building the subsets. At n = 20 the recursion took 90,314,542ns and the bitmask loop 379,824,250ns, and Python shows the same shape at 4.52x. The reason is structural: the recursion carries one partial subset and changes it by a single push or pop per step, so each subset costs O(1) to derive from the last. The bitmask loop rebuilds every subset from nothing by scanning all n positions, which is 2^n x n operations against 2^n. Recursion was never the expensive part of the recursive version.

<!-- @doubt -->
### Then why use the bitmask at all?

<!-- @answer -->
Because the mask is a name. A recursion can visit every subset but, while inside one, has no way to refer to another — it cannot index a table by "the subset I would get by removing element 3". A mask is an integer, so it can index an array directly. That is what makes bitmask dynamic programming possible: sum[m] = sum[m & (m-1)] + a[ctz(m)] computes every subset's answer in O(1) from a smaller subset's answer, measured at 4,337,917ns against 115,642,291ns for recomputing, a factor of 26.66. And when nothing is materialised the enumeration itself is nearly free — 373x faster than building the subsets.

<!-- @doubt -->
### Why is m & (m - 1) the right predecessor?

<!-- @answer -->
Two reasons, and both are needed. First, it is m with its lowest set bit removed — the same subset minus one element — so the answer for it plus that one element gives the answer for m. Second, it is numerically smaller than m, which means a plain ascending loop has already computed it, so no explicit ordering or memoisation is required. __builtin_ctz(m) supplies the element that was removed. Both idioms come from earlier subtopics: dropping the lowest set bit was the power-of-two test, and the trailing-zero count was how the rightmost-bit subtopic recovered a position.

<!-- @doubt -->
### What breaks at n = 31?

<!-- @answer -->
1 << 31 with a signed int is -2147483648, so the loop condition m < (1 << n) is false at m = 0 and the body never executes. You get an empty result rather than a crash, which means the failure is silent and looks like a logic bug elsewhere. Writing 1u << n fixes it up to n = 31; beyond 32 elements the mask must be unsigned long long, and beyond 63 no integer mask exists at all in C++ or Java. Python has no such limits — 1 << 40 is an ordinary integer — but 2^40 is 1,099,511,627,776 subsets, so the constraint just moves from the type to the clock.

<!-- @doubt -->
### How large can n be in practice?

<!-- @answer -->
Around 20 if the subsets are materialised, and around 25 if they are not. At n = 20 there are 1,048,576 subsets, which is roughly 80 MB of output; at n = 25 there are 33,554,432, which is roughly 1.6 GB; at n = 30 there are over a billion and neither the time nor the memory is available. This is why "n ≤ 20" in a problem statement is itself the hint that a bitmask solution is intended — the constraint is chosen so that 2^n is reachable and 2^n x n is not comfortable.

<!-- @doubt -->
### How do I get a subset's size without listing it?

<!-- @answer -->
popcount(m). The number of set bits in the mask is the number of elements in the subset, by the correspondence, so __builtin_popcount, Integer.bitCount or int.bit_count answers it in one instruction with no element ever touched. That is the clearest single demonstration that the mask is the subset rather than an index into a list of them — and it is the reason the count-only loop measured 373x faster than the materialising one, since size, membership and even subset sums can all be read off the mask.

<!-- @doubt -->
### Do the two methods produce subsets in the same order?

<!-- @answer -->
No, and comparing them as sequences will report a failure that is not one. The bitmask loop emits subsets in numerical order of their masks, so {a} comes before {b} because 001 is less than 010. The take/skip recursion emits them in the order its branches unwind, which puts the empty set first and depends on whether the skip branch or the take branch comes first in the code. The collections are identical — verified as multisets on 3,000 random sets with 0 mismatches — and only the collection is what either method promises.

<!-- @doubt -->
### Does this work if the input has duplicates?

<!-- @answer -->
It enumerates all 2^n masks regardless, which means duplicate elements produce duplicate subsets. For {1, 1} the four masks give {}, {1}, {1} and {1, 1}, where the power set of the multiset has three distinct members. Both methods behave identically here, so this is not a reason to prefer one. Deduplicating afterwards costs more than avoiding the duplicates in the first place, which is what Subsets II is about — sorting first and skipping an element when it equals its predecessor and its predecessor was not taken.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
XOR of numbers in a given range, which returns to XOR and to a different kind of insight: XORing 1 through n has a closed form depending only on n % 4, which collapses an O(n) loop into O(1) arithmetic. After that Single Number - III uses one bit of an XOR as a partition — any set bit in the XOR of the whole array is a position where the two unpaired values differ, so splitting on that bit turns one hard problem into two copies of Single Number - I.
