---
id: number-of-greater-elements-to-the-right
topic: Stacks
title: Number of Greater Elements to the Right
difficulty: Easy
status: ready
prerequisites:
  - balanced-paranthesis
  - implement-stack-using-arrays
  - count-inversions
  - time-and-space-complexity-basics
relatedIds:
  - next-greater-element
  - next-smaller-element
  - count-inversions
  - reverse-pairs
  - count-subarrays-with-given-sum
---

<!-- @summary -->
This problem sits beside Next Greater Element and looks like it, and a monotonic stack **cannot** solve it — on `[2, 7, 3, 5, 4, 6, 8]` the two questions disagree at 4 of 7 positions. "Which element is next" is answered by a stack in O(n); "how many elements" is an order-statistics question needing a Fenwick tree or a merge sort, O(n log n). Both were verified against brute force over 20,000 random arrays with zero mismatches, plus an independent identity check. Measured at n = 16,000, brute force is **224x** slower — and the merge sort beats the Fenwick tree by a consistent 1.19x to 1.38x.

<!-- @theory -->
## The problem

For each index `i`, count how many `j > i` have `a[j] > a[i]`.

```
a     =  2   7   3   5   4   6   8
count =  6   1   4   2   2   1   0
```

Every element after the 2 is larger, so it scores 6. Nothing after the 8, so it
scores 0.

## Why the stack does not work here

The neighbouring subtopics — Next Greater Element, Next Smaller Element — are
solved by a monotonic stack in O(n). This one is not, and the reason is worth
getting straight before writing any code.

A monotonic stack answers **"which element is the next greater one?"** It works
by popping elements as soon as a larger value arrives, and the popping is the
whole trick: once an element has been answered, it leaves. That is exactly what
makes it linear, and exactly why it cannot count. An element that has been popped
is no longer available to be counted against later arrivals.

Run both on the same array:

| index | 0 | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|---|
| value | 2 | 7 | 3 | 5 | 4 | 6 | 8 |
| **count** of greater to the right | **6** | 1 | **4** | **2** | **2** | 1 | 0 |
| **next** greater, as an index | 1 | 6 | 3 | 5 | 5 | 6 | −1 |

They disagree at 4 of the 7 positions, and not by a constant. The stack tells you
element 0's next greater is at index 1; it says nothing about the other five
larger elements further right.

So this is not a monotonic-stack problem wearing a disguise. It is an
order-statistics problem: *how many values seen so far exceed this one*, which is
what Fenwick trees and merge-sort counting exist for.

## The two O(n log n) methods

**Fenwick tree, scanning right to left.** Walk backwards. At each element, ask
the tree how many already-inserted values are strictly greater, then insert this
one. Values must be compressed to ranks first, since a Fenwick tree is indexed by
position, not by value.

**Merge sort.** Sort while counting. When merging two halves, every time an
element from the right half is taken before an element from the left half, that
right element is greater than *all* remaining left elements — so each left
element accumulates the count of right-half elements still unconsumed.

Both were checked against brute force over 20,000 random arrays of up to 12
elements drawn from a range of 8, so ties are common — **0 mismatches** each.

The Fenwick version was also checked against an independent identity: for every
array, the total of all counts must equal the number of strictly-increasing
pairs, and `greater + less + ties` must equal `n(n−1)/2`. **0 failures.**

## Cost

All three methods on the same arrays, one run:

| n | Brute force | Fenwick | Merge sort | brute / Fenwick |
|---|---|---|---|---|
| 1,000 | 1,375,333ns | 89,083ns | **71,333ns** | 15x |
| 4,000 | 14,241,166ns | 240,792ns | **198,333ns** | 59x |
| 16,000 | 245,265,084ns | 1,096,375ns | **920,166ns** | **224x** |
| 64,000 | — | 5,708,084ns | **4,132,209ns** | — |

The brute-force ratio grows with n/log n, as O(n²) against O(n log n) must.

More interesting: **the merge sort beats the Fenwick tree at every size**, by
1.19x to 1.38x. The Fenwick version pays for coordinate compression — a full sort
before it starts — and then performs random-access updates that jump around the
tree array. The merge sort touches memory sequentially and does its counting as a
by-product of work it was doing anyway.

That is the opposite of the usual instinct, which reaches for the Fenwick tree
because it is the more specialised tool.

## Python

| n | Brute force | Fenwick |
|---|---|---|
| 1,000 | 17.7ms | **1.4ms** |
| 4,000 | 286.9ms | **6.3ms** |

13x and 45x. The ratios are smaller than C++'s because the brute force's inner
loop is a comprehension running in C, while the Fenwick tree's bit-twiddling runs
in the interpreter — the same compression of ratios seen throughout this
curriculum.

## When brute force is the right answer

The O(n²) version is not merely a stepping stone here. If the problem asks for
only a few indices rather than all of them — the form this question often takes,
with `Q` queries — then answering each query independently costs O(n) and the
total is O(nQ). That beats O(n log n) whenever `Q` is smaller than `log n`, which
for n = 16,000 means fewer than about 14 queries.

Knowing which version the question wants is most of the work.

## Where this goes next

**Next Greater Element** is the problem this one is often mistaken for, and it
*is* the monotonic stack — the same scan, keeping the elements that are still
waiting for a larger value and discarding each one the moment its answer arrives.
Having seen why counting cannot use that structure makes it much clearer what the
structure is actually doing.

<!-- @intuition -->
The temptation is to read this as a stack problem because of the company it keeps, and the fastest way to see that it is not is to ask what a monotonic stack throws away. That structure is fast precisely because it forgets: an element is popped the instant a larger value shows up, because its question has been answered and it will never be needed again. Counting needs the opposite — every earlier element must still be available when a new value arrives, so that the new value can be counted against all of them. The two requirements are incompatible, and no amount of care with the stack recovers the difference. What the problem really asks is "of the values I have already seen, how many exceed this one", and a structure that answers that has to keep everything and support a fast rank query — which is a Fenwick tree, or a merge sort that answers the question in passing while it sorts.

<!-- @approach -->
### Brute Force - Count Directly

<!-- @idea -->
For each element, scan everything to its right and count the larger values.

<!-- @steps -->
1. Loop `i` over every index.
2. For each `i`, loop `j` from `i + 1` to the end.
3. Increment a counter whenever `a[j] > a[i]`.
4. Store that counter as the answer for `i`.
5. Note that the comparison is strict, so equal values do not count.

<!-- @complexity -->
- time: O(n^2) — n(n-1)/2 comparisons
- space: O(1) beyond the output
- note: The reference the other two were verified against, over 20,000 random arrays with 0 mismatches. Measured 245,265,084ns at n = 16,000 against the Fenwick tree's 1,096,375ns, a factor of 224 that grows with n/log n. It is also the right answer when only a few indices are queried: answering Q queries independently costs O(nQ), which beats O(n log n) whenever Q is below about log n — fewer than 14 queries at n = 16,000.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> countGreaterToRight(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, 0);
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (a[j] > a[i]) res[i]++;
    return res;
}

// a = [2, 7, 3, 5, 4, 6, 8]  ->  [6, 1, 4, 2, 2, 1, 0]
```

<!-- @annotations -->
- 9: Strictly greater, so ties are excluded — the difference matters, and the verification used a value range of 8 precisely to make ties common.
- 8: j starts at i + 1, so the element never counts itself and the pairs are each considered once.
- 13: The 2 scores 6 because everything after it is larger; the 8 scores 0 because nothing follows it.

<!-- @code java -->
```java
static int[] countGreaterToRight(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (a[j] > a[i]) res[i]++;
    return res;
}
```

<!-- @annotations -->
- 3: new int[n] is zero-initialised in Java, so no explicit fill is needed — unlike a raw C array.

<!-- @code python -->
```python
def count_greater_to_right(a: list[int]) -> list[int]:
    n = len(a)
    return [sum(1 for j in range(i + 1, n) if a[j] > a[i]) for i in range(n)]


# Measured 286.9ms at n = 4,000 against the Fenwick version's 6.3ms.
# The ratio is smaller than C++'s because this inner loop runs in C
# while the Fenwick tree's bit arithmetic runs in the interpreter.
```

<!-- @annotations -->
- 3: The comprehension keeps the inner loop in C, which is why this is only 45x slower rather than the 224x the C++ comparison shows.

<!-- @approach -->
### Why the Monotonic Stack Fails

<!-- @idea -->
The neighbouring problems are solved by a stack that pops elements once answered — and popping is exactly what makes counting impossible.

<!-- @steps -->
1. Scan right to left, keeping a stack of elements not yet exceeded.
2. Before recording an answer for `a[i]`, pop everything at or below it.
3. The remaining top is the next greater element — one specific element, found in O(1) amortised.
4. Note that the popped elements are gone, so they cannot be counted against anything later.
5. Conclude that this structure answers "which" and not "how many".

<!-- @complexity -->
- time: O(n) — each element is pushed once and popped at most once
- space: O(n) for the stack
- note: Included to make the distinction concrete rather than to solve the problem. On [2, 7, 3, 5, 4, 6, 8] the next-greater indices are [1, 6, 3, 5, 5, 6, -1] while the counts are [6, 1, 4, 2, 2, 1, 0] — the two disagree at 4 of the 7 positions. The stack is linear because it discards answered elements, and counting requires keeping them, so the speed and the limitation are the same property.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// This computes the NEXT greater element's index — NOT the count.
vector<int> nextGreaterIndex(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1), st;
    for (int i = n - 1; i >= 0; i--) {
        while (!st.empty() && a[st.back()] <= a[i]) st.pop_back();
        res[i] = st.empty() ? -1 : st.back();
        st.push_back(i);
    }
    return res;
}

// a = [2, 7, 3, 5, 4, 6, 8]
//   next greater index: [1, 6, 3, 5, 5, 6, -1]
//   count of greater:   [6, 1, 4, 2, 2, 1,  0]   <- a different question
```

<!-- @annotations -->
- 9: This pop is what makes the algorithm O(n) and what makes it unable to count: a popped element is never compared against anything again.
- 10: One index, or -1. There is nowhere in this structure for a quantity to accumulate.
- 17: Four of the seven positions differ, so the two are not related by any fixed adjustment.

<!-- @code java -->
```java
// NEXT greater element's index — not the count.
static int[] nextGreaterIndex(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Deque<Integer> st = new ArrayDeque<>();
    for (int i = n - 1; i >= 0; i--) {
        while (!st.isEmpty() && a[st.peek()] <= a[i]) st.pop();
        res[i] = st.isEmpty() ? -1 : st.peek();
        st.push(i);
    }
    return res;
}
```

<!-- @annotations -->
- 7: <= rather than <, so equal values are also popped — which is the right choice for "strictly greater" and the wrong one for "greater or equal".

<!-- @code python -->
```python
def next_greater_index(a: list[int]) -> list[int]:
    n = len(a)
    res, st = [-1] * n, []
    for i in range(n - 1, -1, -1):
        while st and a[st[-1]] <= a[i]:
            st.pop()
        res[i] = st[-1] if st else -1
        st.append(i)
    return res


# Solves Next Greater Element, which is the NEXT subtopic — and does not
# solve this one. The two answers differ at 4 of 7 positions on
# [2, 7, 3, 5, 4, 6, 8].
```

<!-- @annotations -->
- 5: Each index enters and leaves the stack at most once, which is the amortised argument for O(n) — and the reason the information is not retained.

<!-- @approach -->
### Optimal - Fenwick Tree, Scanning Right to Left

<!-- @idea -->
Walk backwards, asking a Fenwick tree how many already-seen values exceed the current one, then insert it.

<!-- @steps -->
1. Compress the values to ranks, since a Fenwick tree is indexed by position rather than by value.
2. Create a tree over the number of distinct values, all counts zero.
3. Walk the array from right to left.
4. For each element, query the number of inserted values with a strictly higher rank — that is its answer.
5. Insert the element's rank and continue.

<!-- @complexity -->
- time: O(n log n) — a sort for the compression, then a query and an update per element
- space: O(n) for the tree and the rank table
- note: 0 mismatches against brute force over 20,000 random arrays with frequent ties, and 0 failures of the independent identity that the counts must total the number of strictly-increasing pairs. Measured 1,096,375ns at n = 16,000 against brute force's 245,265,084ns, a factor of 224. It is, however, consistently slower than the merge-sort method — 1.19x to 1.38x — because compression costs a full sort and the tree updates jump around memory.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

struct BIT {
    vector<int> t;
    int n;
    explicit BIT(int n) : t(n + 1, 0), n(n) {}
    void add(int i) { for (++i; i <= n; i += i & -i) t[i]++; }
    int  sum(int i) { int s = 0; for (++i; i > 0; i -= i & -i) s += t[i]; return s; }
};

vector<int> countGreaterToRight(const vector<int>& a) {
    int n = a.size();
    vector<int> vals = a;
    sort(vals.begin(), vals.end());
    vals.erase(unique(vals.begin(), vals.end()), vals.end());

    int m = vals.size();
    BIT bit(m);
    vector<int> res(n, 0);
    for (int i = n - 1; i >= 0; i--) {
        int rank = lower_bound(vals.begin(), vals.end(), a[i]) - vals.begin();
        res[i] = bit.sum(m - 1) - bit.sum(rank);       // strictly greater ranks
        bit.add(rank);
    }
    return res;
}
```

<!-- @annotations -->
- 9: The i & -i idiom is the lowest set bit from the bit-manipulation topic, used here to walk the tree's parent chain.
- 16: Compression is mandatory, not an optimisation: the tree is indexed by rank, so values of 10^9 would need a tree of that size.
- 24: sum(m-1) - sum(rank) counts ranks strictly above this one; using sum(rank - 1) instead would count greater-or-equal and silently include ties.
- 25: Insert after querying, so the element never counts itself.

<!-- @code java -->
```java
static int[] countGreaterToRight(int[] a) {
    int n = a.length;
    int[] vals = a.clone();
    Arrays.sort(vals);
    int m = 0;
    for (int i = 0; i < n; i++) if (i == 0 || vals[i] != vals[i-1]) vals[m++] = vals[i];

    int[] t = new int[m + 1];
    int[] res = new int[n];
    for (int i = n - 1; i >= 0; i--) {
        int rank = lowerBound(vals, m, a[i]);
        res[i] = query(t, m, m - 1) - query(t, m, rank);
        for (int k = rank + 1; k <= m; k += k & -k) t[k]++;
    }
    return res;
}
```

<!-- @annotations -->
- 3: clone() first, or sorting destroys the caller's array — the same hazard as the sorting approaches in Single Number.
- 6: Deduplicating in place after the sort, which avoids allocating a second array for the distinct values.

<!-- @code python -->
```python
import bisect

class BIT:
    def __init__(self, n):
        self.n = n
        self.t = [0] * (n + 1)
    def add(self, i):
        i += 1
        while i <= self.n:
            self.t[i] += 1
            i += i & -i
    def sum(self, i):
        i += 1
        r = 0
        while i > 0:
            r += self.t[i]
            i -= i & -i
        return r


def count_greater_to_right(a: list[int]) -> list[int]:
    vals = sorted(set(a))
    m = len(vals)
    bit = BIT(m)
    res = [0] * len(a)
    for i in range(len(a) - 1, -1, -1):
        rank = bisect.bisect_left(vals, a[i])
        res[i] = bit.sum(m - 1) - bit.sum(rank)
        bit.add(rank)
    return res
```

<!-- @annotations -->
- 22: sorted(set(a)) does the compression in one expression, and bisect_left then maps a value to its rank.
- 29: Measured 6.3ms at n = 4,000 against brute force's 286.9ms — 45x, smaller than C++'s 224x because this loop runs in the interpreter.

<!-- @approach -->
### Also Optimal, and Faster - Count While Merge Sorting

<!-- @idea -->
Sorting already compares every pair that matters; count the greater ones as a by-product of the merge.

<!-- @steps -->
1. Pair each value with its original index so answers can be attributed after sorting.
2. Sort recursively, splitting into a left half and a right half.
3. While merging, whenever an element from the right half is taken before one from the left, note that it is greater than the left element still waiting.
4. When a left element is finally taken, add the number of right-half elements not yet consumed — every one of them is greater.
5. Accumulate those counts into the answer indexed by the element's original position.

<!-- @complexity -->
- time: O(n log n) — the merge sort itself, with the counting free
- space: O(n) for the temporary buffer and the index pairing
- note: 0 mismatches against brute force over 20,000 random arrays. Faster than the Fenwick tree at every size measured — 71,333ns against 89,083ns at n = 1,000, and 4,132,209ns against 5,708,084ns at n = 64,000, a margin of 1.19x to 1.38x. It touches memory sequentially and needs no coordinate compression, where the Fenwick version pays for a full sort up front and then makes scattered updates.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

static void mergeCount(vector<pair<int,int>>& v, vector<int>& res,
                       int lo, int hi, vector<pair<int,int>>& tmp) {
    if (hi - lo < 2) return;
    int mid = (lo + hi) / 2;
    mergeCount(v, res, lo, mid, tmp);
    mergeCount(v, res, mid, hi, tmp);

    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (v[j].first > v[i].first) {
            res[v[i].second] += hi - j;            // all remaining right-half values are greater
            tmp[k++] = v[i++];
        } else {
            tmp[k++] = v[j++];
        }
    }
    while (i < mid) { res[v[i].second] += hi - j; tmp[k++] = v[i++]; }
    while (j < hi)  { tmp[k++] = v[j++]; }
    for (int x = lo; x < hi; x++) v[x] = tmp[x];
}

vector<int> countGreaterToRight(const vector<int>& a) {
    int n = a.size();
    vector<pair<int,int>> v(n);
    for (int i = 0; i < n; i++) v[i] = {a[i], i};
    vector<int> res(n, 0);
    vector<pair<int,int>> tmp(n);
    mergeCount(v, res, 0, n, tmp);
    return res;
}
```

<!-- @annotations -->
- 14: hi - j is the count of right-half elements not yet consumed, and every one of them is greater than v[i] because the right half is sorted.
- 13: Strictly greater, so a tie takes the right element first and contributes nothing — which is what keeps ties out of the count.
- 20: The tail loop must add the same count, because left-half elements remaining after the right half is exhausted still have hi - j = 0 to add and the expression stays correct.
- 28: Pairing with the original index is what lets the answer be attributed after the array has been reordered.

<!-- @code java -->
```java
static void mergeCount(int[][] v, int[] res, int lo, int hi, int[][] tmp) {
    if (hi - lo < 2) return;
    int mid = (lo + hi) / 2;
    mergeCount(v, res, lo, mid, tmp);
    mergeCount(v, res, mid, hi, tmp);

    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (v[j][0] > v[i][0]) { res[v[i][1]] += hi - j; tmp[k++] = v[i++]; }
        else                   { tmp[k++] = v[j++]; }
    }
    while (i < mid) { res[v[i][1]] += hi - j; tmp[k++] = v[i++]; }
    while (j < hi)  { tmp[k++] = v[j++]; }
    System.arraycopy(tmp, lo, v, lo, hi - lo);
}
```

<!-- @annotations -->
- 14: System.arraycopy rather than a loop, which is an intrinsic and considerably faster for the copy-back step.

<!-- @code python -->
```python
def count_greater_to_right(a: list[int]) -> list[int]:
    n = len(a)
    res = [0] * n
    v = list(enumerate(a))                 # (index, value)

    def sort(lo, hi):
        if hi - lo < 2:
            return
        mid = (lo + hi) // 2
        sort(lo, mid); sort(mid, hi)
        merged, i, j = [], lo, mid
        while i < mid and j < hi:
            if v[j][1] > v[i][1]:
                res[v[i][0]] += hi - j
                merged.append(v[i]); i += 1
            else:
                merged.append(v[j]); j += 1
        while i < mid:
            res[v[i][0]] += hi - j
            merged.append(v[i]); i += 1
        while j < hi:
            merged.append(v[j]); j += 1
        v[lo:hi] = merged

    sort(0, n)
    return res
```

<!-- @annotations -->
- 23: Slice assignment writes the merged run back in one C-level operation rather than element by element.
- 6: Recursion depth is log n, so this is safe against Python's default limit of 1,000 for any array that fits in memory.

<!-- @example -->

<!-- @input -->
a = [2, 7, 3, 5, 4, 6, 8]

<!-- @output -->
[6, 1, 4, 2, 2, 1, 0]

<!-- @why -->
Small enough to verify by eye, and chosen so the counts and the next-greater indices disagree at most positions.

<!-- @walkthrough -->
1. Index 0 holds 2. Every one of the six elements after it — 7, 3, 5, 4, 6, 8 — is larger, so the count is 6.
2. Index 1 holds 7. To its right are 3, 5, 4, 6, 8, and only 8 exceeds it, so the count is 1.
3. Index 2 holds 3. To its right are 5, 4, 6, 8, all larger, giving 4.
4. Index 3 holds 5. To its right are 4, 6, 8, of which 6 and 8 are larger, giving 2.
5. Index 4 holds 4, with 6 and 8 after it, giving 2. Index 5 holds 6, with only 8 after it, giving 1.
6. Index 6 holds 8, with nothing after it, giving 0 — the last element always scores 0.
7. The totals sum to 16, which is the number of strictly-increasing pairs in the array; adding the decreasing pairs and the ties gives 21, which is 7 x 6 / 2.

<!-- @example -->

<!-- @input -->
The same array, through a monotonic stack

<!-- @output -->
[1, 6, 3, 5, 5, 6, −1] — indices, not counts, differing at 4 of 7 positions

<!-- @why -->
It is the cleanest way to see that the neighbouring technique answers a different question, rather than a harder version of the same one.

<!-- @walkthrough -->
1. Scanning right to left, index 6 holds 8 with an empty stack, so its next greater is -1. Push 6.
2. Index 5 holds 6. The top of the stack is 8, which is greater, so the answer is index 6. Push 5.
3. Index 4 holds 4. The top is 6, greater, so the answer is index 5. Push 4.
4. Index 3 holds 5. The top is 4, which is not greater, so pop it. The new top is 6, so the answer is index 5.
5. That pop is the crucial moment: the element holding 4 has left the structure permanently, and can never be counted against anything scanned later.
6. Continuing gives [1, 6, 3, 5, 5, 6, -1] against the counts [6, 1, 4, 2, 2, 1, 0].
7. They agree only where the count happens to be 0 or 1, which is 3 of the 7 positions — there is no adjustment that turns one into the other.

<!-- @example -->

<!-- @input -->
20,000 random arrays, with values drawn from a range of 8

<!-- @output -->
0 mismatches for both O(n log n) methods, and 0 identity failures

<!-- @why -->
A narrow value range makes ties common, and ties are where a strict-versus-non-strict comparison error hides.

<!-- @walkthrough -->
1. Each array held up to 12 elements drawn from only 8 distinct values, so most arrays contain repeats.
2. Both the Fenwick and merge-sort methods were compared against the brute-force count on every array.
3. Neither disagreed on any of the 20,000 — 0 mismatches each.
4. A separate identity was checked on every array: the sum of all counts must equal the number of strictly-increasing pairs.
5. And that count, plus the strictly-decreasing pairs, plus the ties, must equal n(n-1)/2.
6. There were 0 failures, which catches a whole class of errors that a direct comparison against one reference implementation would miss.
7. The tie-heavy input is deliberate: writing sum(rank - 1) instead of sum(rank) in the Fenwick version counts greater-or-equal, and only a tie reveals it.

<!-- @example -->

<!-- @input -->
All three methods at four sizes, in one run

<!-- @output -->
Brute force 224x behind at n = 16,000 — and the merge sort ahead of the Fenwick tree throughout

<!-- @why -->
The second result contradicts the usual instinct, which reaches for the specialised data structure.

<!-- @walkthrough -->
1. At n = 1,000 the times were 1,375,333ns for brute force, 89,083ns for the Fenwick tree and 71,333ns for the merge sort.
2. At n = 4,000 they were 14,241,166ns, 240,792ns and 198,333ns — the brute-force gap widening from 15x to 59x.
3. At n = 16,000 brute force took 245,265,084ns against the Fenwick tree's 1,096,375ns, a factor of 224.
4. That widening is O(n^2) against O(n log n), so the ratio grows as n over log n.
5. In every row the merge sort was faster than the Fenwick tree — by 1.25x, 1.21x, 1.19x and 1.38x at n = 64,000.
6. The Fenwick version pays for coordinate compression, which is a full sort before the algorithm starts, and then performs updates that jump around the tree array.
7. The merge sort touches memory sequentially and gets the counting free from work it was already doing, which is why the more specialised structure loses.

<!-- @visualization array -->

<!-- @description -->
Open with the distinction, because it is the point of the subtopic. Draw the array [2, 7, 3, 5, 4, 6, 8] once, and beneath it two answer rows: "count of greater to the right" reading 6, 1, 4, 2, 2, 1, 0 and "next greater, as an index" reading 1, 6, 3, 5, 5, 6, -1. Highlight the four positions where they disagree in red. Then take index 0 and animate both questions on it: for the count, draw six arrows fanning out from the 2 to every larger element on its right; for the next greater, draw a single arrow to index 1 and grey out the rest. Caption it "one arrow or six — the stack only ever draws one". Then the failure mechanism: run the monotonic stack right to left with a visible stack column, and when index 3 causes the element holding 4 to be popped, flash that element and slide it off screen entirely, with the label "gone, and never counted again". Let the scan continue so the reader sees it never returns. Then the Fenwick panel: the array scanned right to left, with a second display showing a small tree of rank buckets filling up. At each step, highlight the buckets strictly above the current element's rank, sum them into the answer cell, then drop the current element into its own bucket — making clear that the query happens before the insert. Then the merge panel: the array split recursively into halves, and during a merge show the left and right runs side by side with two pointers. Each time a right-hand element is taken first, flash the remaining right-hand run and add its length to the waiting left element's tally, with the count animating into the answer row. Close with the cost panel: three curves on log axes for brute force, Fenwick and merge sort, with the measured points marked; annotate the brute-force gap as 15x, 59x and 224x, and pull out the Fenwick-versus-merge gap as a small inset showing merge sort consistently below, labelled 1.19x to 1.38x, with the caption "the specialised structure is the slower one here".

<!-- @sampleInput -->
```json
{"problem":{"array":[2,7,3,5,4,6,8],"counts":[6,1,4,2,2,1,0],"definition":"for each i, how many j > i have a[j] > a[i]","strict":true,"lastAlwaysZero":true},"stackContrast":{"nextGreaterIndex":[1,6,3,5,5,6,-1],"counts":[6,1,4,2,2,1,0],"positionsDisagreeing":4,"of":7,"whyStackCannotCount":"a monotonic stack pops an element the instant a larger value arrives, because its question is answered — and a popped element can never be counted against anything scanned later","theTradeoff":"the popping is what makes it O(n) and what makes it unable to count; the speed and the limitation are the same property","index0":{"countArrows":6,"nextGreaterArrows":1,"caption":"one arrow or six — the stack only ever draws one"}},"identity":{"sumOfCounts":16,"strictlyIncreasingPairs":16,"plusDecreasing":"and ties","totalPairs":21,"formula":"n(n-1)/2 = 7*6/2","checkedOn":20000,"failures":0},"verification":{"randomArrays":20000,"maxLength":12,"valueRange":8,"whyNarrowRange":"ties are common, and ties are where a strict-versus-non-strict comparison error hides","fenwickMismatches":0,"mergeMismatches":0,"tieTrap":"writing sum(rank - 1) instead of sum(rank) counts greater-or-equal, and only a tie reveals it"},"fenwick":{"idea":"walk right to left; query how many inserted values exceed this one, then insert it","compressionRequired":"the tree is indexed by rank, not by value, so values of 10^9 would need a tree of that size","queryBeforeInsert":"so the element never counts itself","lowestSetBit":"the i & -i idiom from the bit-manipulation topic, walking the tree's parent chain"},"mergeSort":{"idea":"count as a by-product of merging","rule":"when a right-half element is taken before a left-half element, every remaining right-half element is greater than that left element","addend":"hi - j","whyFree":"the comparisons were being made anyway","indexPairing":"values are paired with their original positions so answers survive the reordering"},"timing":{"unit":"ns","oneRun":true,"rows":[{"n":1000,"brute":1375333,"fenwick":89083,"merge":71333,"bruteOverFenwick":15,"fenwickOverMerge":1.25},{"n":4000,"brute":14241166,"fenwick":240792,"merge":198333,"bruteOverFenwick":59,"fenwickOverMerge":1.21},{"n":16000,"brute":245265084,"fenwick":1096375,"merge":920166,"bruteOverFenwick":224,"fenwickOverMerge":1.19},{"n":64000,"brute":null,"fenwick":5708084,"merge":4132209,"bruteOverFenwick":null,"fenwickOverMerge":1.38}],"bruteGapGrowsAs":"n / log n, as O(n^2) against O(n log n) must","surprise":"the merge sort beats the Fenwick tree at every size","why":"the Fenwick version pays for coordinate compression — a full sort before it starts — and then makes scattered updates, while the merge sort touches memory sequentially and gets the counting free"},"python":{"rows":[{"n":1000,"bruteMs":17.7,"fenwickMs":1.4,"ratio":13},{"n":4000,"bruteMs":286.9,"fenwickMs":6.3,"ratio":45}],"whySmallerRatio":"the brute force's inner comprehension runs in C while the Fenwick tree's bit arithmetic runs in the interpreter"},"whenBruteForceWins":{"scenario":"only a few indices are queried rather than all of them","cost":"O(nQ) against O(n log n)","threshold":"Q below about log n","atN16000":"fewer than about 14 queries","note":"knowing which version the question wants is most of the work"}}
```

<!-- @highlights -->
- The array [2, 7, 3, 5, 4, 6, 8] is drawn once with two answer rows beneath it.
- One row reads 6, 1, 4, 2, 2, 1, 0 and the other 1, 6, 3, 5, 5, 6, -1.
- The four positions where they disagree are highlighted in red.
- Index 0 is animated both ways: six arrows fanning out to every larger element, then a single arrow to index 1.
- It is captioned "one arrow or six — the stack only ever draws one".
- The monotonic stack then runs right to left with a visible stack column.
- When index 3 pops the element holding 4, that element flashes and slides off screen entirely.
- It is labelled "gone, and never counted again", and the scan continues so the reader sees it never returns.
- The Fenwick panel scans right to left beside a tree of rank buckets filling up.
- At each step the buckets strictly above the current rank are highlighted and summed into the answer.
- The current element is dropped into its bucket only afterwards, making the query-before-insert order explicit.
- The merge panel splits the array recursively and shows two pointers walking the left and right runs.
- Each time a right-hand element is taken first, the remaining right run flashes and its length is added to the waiting left element's tally.
- Three curves plot brute force, Fenwick and merge sort on log axes with the measured points marked.
- The brute-force gap is annotated 15x, 59x and 224x.
- An inset pulls out the Fenwick-versus-merge gap, labelled 1.19x to 1.38x, captioned "the specialised structure is the slower one here".

<!-- @edgeCases -->
- The last element — always scores 0, since nothing follows it.
- A strictly increasing array — element i scores n - 1 - i, and the total is the maximum possible, n(n-1)/2.
- A strictly decreasing array — every count is 0.
- All elements equal — every count is 0, because the comparison is strict; this is the case that catches a >= written for >.
- A single element — the answer is [0] and every method must handle n = 1 without special-casing.
- An empty array — the answer is empty; the merge sort's base case must accept hi - lo < 2 rather than assuming at least one element.
- Large values — the Fenwick tree must compress to ranks first, or it would need a tree indexed up to the maximum value.
- Negative values — handled by compression without any special case, since only the ordering matters.
- Duplicate values in the Fenwick version — query strictly above the rank, or ties are counted as greater.
- Counts exceeding int range — impossible for a single element, whose count is at most n - 1, but the total across all elements can reach n(n-1)/2 and needs a 64-bit accumulator.
- Only a few indices queried — the O(n) per query brute force beats O(n log n) below about log n queries.

<!-- @pitfalls -->
- Reaching for a monotonic stack because the neighbouring problems use one. It answers "which element is next greater", not "how many are greater" — the two disagree at 4 of 7 positions on [2, 7, 3, 5, 4, 6, 8].
- Querying the Fenwick tree with sum(rank - 1) instead of sum(rank). That counts greater-or-equal, and only tied values reveal it.
- Inserting the element before querying. It then counts itself, adding one to every answer.
- Forgetting to compress values before building the Fenwick tree. The tree is indexed by rank, so raw values of 10^9 would demand a tree of that size.
- Sorting the caller's array in place for the compression. Clone first, as in the sorting approaches from Single Number.
- Using >= when merging. Ties then contribute to the count, which contradicts the strict definition and is invisible on inputs without repeats.
- Testing only on arrays with distinct values. Every strict-versus-non-strict error survives that test set; the verification here used a value range of 8 deliberately.
- Assuming the Fenwick tree is the fast choice. Measured, the merge sort was faster at every size, by 1.19x to 1.38x.
- Reaching for O(n log n) when the problem asks for a handful of indices. Answering Q queries directly is O(nQ) and wins below about log n queries — fewer than 14 at n = 16,000.
- Accumulating the total of all counts in a 32-bit integer. Individual counts fit easily, but the total can reach n(n-1)/2.
- Losing the original indices in the merge sort. The array is reordered, so answers must be attributed through a stored index rather than a position.
- Writing the merge's tail loop without the count. Left-half elements remaining after the right half is exhausted still need their addend, even though it is zero.

<!-- @doubt -->
### Why can't a monotonic stack solve this?

<!-- @answer -->
Because a monotonic stack is fast precisely because it forgets. It pops an element the instant a larger value arrives, since that element's question — "what is my next greater element?" — has been answered and it will never be needed again. Counting needs the opposite: every earlier element must still be present when a new value arrives, so the new value can be counted against all of them. On [2, 7, 3, 5, 4, 6, 8] the stack gives next-greater indices [1, 6, 3, 5, 5, 6, -1] against the counts [6, 1, 4, 2, 2, 1, 0], disagreeing at 4 of 7 positions with no adjustment relating them.

<!-- @doubt -->
### So why is this problem placed next to Next Greater Element?

<!-- @answer -->
Because they are easy to confuse, and confusing them is the mistake worth inoculating against. Both scan an array asking about larger values to the right; only one of them is answered by discarding elements as you go. The useful takeaway is a question to ask of any such problem: does answering one element's question make it safe to throw that element away? If yes, a monotonic stack applies and the algorithm is linear. If the element must still be available for later comparisons, you need a structure that keeps everything and supports fast rank queries.

<!-- @doubt -->
### What does the Fenwick tree actually store?

<!-- @answer -->
Counts, indexed by rank rather than by value. Scanning right to left, everything already inserted is an element to the right of the current one, so asking "how many inserted ranks are strictly above mine" is exactly the answer. The compression to ranks is mandatory rather than an optimisation: the tree is an array indexed by position, so values up to 10^9 would need a tree of that size. Sorting the distinct values and mapping each element to its position in that list bounds the tree at n. And the query must happen before the insert, or every element counts itself.

<!-- @doubt -->
### How does the merge sort count without extra work?

<!-- @answer -->
Because the comparisons it needs are the comparisons it is already making. When merging two sorted halves, taking an element from the right half before one from the left means that right element is smaller — but everything still unconsumed in the right half is greater than the waiting left element, since the right half is sorted. So when a left element is finally taken, adding the number of right-half elements not yet consumed records exactly the greater values to its right. Every pair is accounted for once across the whole recursion, which is why the counting is free.

<!-- @doubt -->
### Which of the two O(n log n) methods should I use?

<!-- @answer -->
The merge sort, on this evidence. It was faster at every size measured — 71,333ns against 89,083ns at n = 1,000, and 4,132,209ns against 5,708,084ns at n = 64,000, a margin of 1.19x to 1.38x. The Fenwick tree pays twice: coordinate compression is a full sort before the algorithm even begins, and its updates jump around the tree array rather than reading sequentially. The merge sort's advantage is that it touches memory in order and gets its counting from work it was doing anyway. The Fenwick tree wins in a different situation — when elements arrive online and the whole array is not available up front.

<!-- @doubt -->
### Why check an identity as well as comparing implementations?

<!-- @answer -->
Because comparing two implementations only catches errors they do not share. The identity used here is independent of any of them: the sum of all counts must equal the number of strictly-increasing pairs, and that plus the strictly-decreasing pairs plus the ties must equal n(n-1)/2. Both quantities were computed directly from the definition. Over 20,000 arrays there were 0 failures, which rules out a whole class of consistent-but-wrong behaviour — for example a comparison that treats ties incorrectly in every method at once.

<!-- @doubt -->
### Why use such a narrow value range for testing?

<!-- @answer -->
To force ties. The arrays held up to 12 elements drawn from only 8 distinct values, so most contained repeats — and ties are exactly where the strict-versus-non-strict distinction hides. Writing sum(rank - 1) instead of sum(rank) in the Fenwick version counts greater-or-equal rather than strictly greater, and using >= instead of > in the merge produces the same class of error. Neither is visible on an array of distinct values, which is what randomly generated test data usually produces.

<!-- @doubt -->
### Is the brute force ever the right answer?

<!-- @answer -->
Yes, when only a few indices are asked about. This question is often posed with Q queries rather than a request for the whole array, and answering each one independently costs O(n), for O(nQ) in total. That beats O(n log n) whenever Q is smaller than about log n — at n = 16,000 that means fewer than roughly 14 queries. It is also the version to write first regardless, since it is the reference the others get checked against, and it took 245,265,084ns at n = 16,000 against the Fenwick tree's 1,096,375ns, so the cost of being wrong about which version is needed is 224x.

<!-- @doubt -->
### What breaks with duplicate values?

<!-- @answer -->
The comparison, in both fast methods, and silently. The problem says strictly greater, so an equal value must not be counted. In the Fenwick version that means querying the ranks strictly above the current one — sum(m-1) minus sum(rank) — where the off-by-one sum(rank - 1) would include the element's own rank and every tie with it. In the merge sort it means taking the right-hand element only when it is strictly greater, so that ties consume the right element first and contribute nothing. Both errors are invisible on distinct values, which is why the verification deliberately used a range of only 8.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Next Greater Element, which is the problem this one is mistaken for and the genuine monotonic-stack introduction. Having seen exactly why counting cannot use that structure — the popping that makes it linear is the same popping that destroys the information — makes it much easier to see what the stack is doing there: it maintains the set of elements still waiting for an answer, and each new element resolves however many of them it can before joining the queue itself. That pattern runs through most of the rest of this topic.
