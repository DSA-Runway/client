---
id: count-inversions
topic: Arrays
title: Count Inversions
difficulty: Hard
status: ready
prerequisites:
  - merge-two-sorted-arrays-without-extra-space
  - union-of-two-sorted-arrays
  - integer-overflow-and-precision-errors
  - for-loop
  - time-and-space-complexity-basics
relatedIds:
  - merge-two-sorted-arrays-without-extra-space
  - union-of-two-sorted-arrays
  - reverse-pairs
  - find-the-repeating-and-missing-number
---

<!-- @summary -->
Count pairs that are out of order — where the answer itself overflows a 32-bit integer at n = 65,537, where counting one inversion per step instead of a whole block is 86.86% wrong, and where a Fenwick tree with matching complexity measured 7.2x slower than merge sort at ten million elements.

<!-- @theory -->
## The problem

An **inversion** is a pair of positions `i < j` where `a[i] > a[j]` — two elements
that are in the wrong order relative to each other. Count them.

```
[2, 4, 1, 3, 5]  ->  3      the pairs (2,1), (4,1) and (4,3)
```

The count measures how far the array is from sorted: zero means already sorted,
and the maximum, `n(n-1)/2`, means fully reversed.

## Counting during a merge

The insight is that **merge sort already compares exactly the pairs you care
about**, and it does so in a way that lets you count them in bulk.

During a merge, the left half and the right half are each already sorted. When
the next element to emit comes from the **right** half, that element is smaller
than everything remaining in the left half — and every one of those is at an
earlier original position. So it forms an inversion with **all of them at once**:

```
left  = [3, 5, 8]   right = [4, ...]
                    4 is emitted, and 4 < 3? no...
left  = [5, 8]      right = [4, ...]
                    4 is emitted -> it inverts with BOTH 5 and 8: add 2, not 1
```

That bulk count is the whole trick:

```
if left[i] <= right[j]:  emit left[i]
else:                    emit right[j];  count += (elements remaining in left)
```

Sorting as you go is not a side effect to be tolerated — it is what makes the
bulk count valid, because both halves being ordered is exactly why one comparison
settles many pairs.

## Adding one instead of the block

The most common mistake is incrementing by 1 where the block count belongs.
Measured over all 87,381 arrays from four distinct values with n up to 8, that was
**86.86% wrong**. The smallest failure is `[1,1,0,0]`, which returns 2 where the
answer is 4 — each 0 inverts with both 1s, and counting one per emission finds
only half of them.

It is a quiet bug because it always **undercounts** and never overcounts, so the
answer stays plausible and stays positive.

## The comparison must be non-strict

Emitting from the left on `left[i] <= right[j]` is required. Using a strict `<`
treats equal elements as inversions, and equal elements are **not** out of order.

Measured **99.93% wrong** — almost everything, since duplicates are common in
four-value arrays. The smallest failure is `[0, 0]`, returning 1 where the answer
is 0.

**And it is invisible without duplicates.** Over all 5,914 permutations of
distinct values, the strict version was wrong **zero** times. This is the same
shape as the operator bugs in **Next Permutation**: a test suite of distinct
values cannot distinguish it from correct code.

## The answer overflows a 32-bit integer

The maximum inversion count is `n(n-1)/2`, reached by a fully descending array.
That exceeds INT32_MAX at **n = 65,537**:

| n | Maximum inversions | Fits int32 |
|---|---|---|
| 65,536 | 2,147,450,880 | yes |
| 65,537 | 2,147,516,416 | **no** |
| 100,000 | 4,999,950,000 | **no** — 2.33x |
| 200,000 | 19,999,900,000 | **no** — 9.31x |

Note that this is the **result** overflowing, not an intermediate. It is a
different failure from the one in **Find the Repeating and Missing Number**, where
the intermediate sums overflowed while the answer was small. Here the answer
itself does not fit, so no amount of care with intermediates helps — the return
type has to be 64-bit.

A descending array of 100,000 elements is not exotic, and it produces
4,999,950,000 inversions. Verified directly.

## What it costs

| n | Brute force | Merge sort | Fenwick tree |
|---|---|---|---|
| 2,000 | 0.66ms | **0.10ms** | 0.17ms |
| 20,000 | 26.35ms | **0.88ms** | 1.36ms |
| 1,000,000 | (too slow) | **46.96ms** | 123.54ms |
| 10,000,000 | (too slow) | **545.77ms** | 3,916.47ms |

Merge sort wins throughout, and the gap against the Fenwick tree **widens with
n** — 1.7x at two thousand, 2.6x at a million, **7.2x at ten million** — even
though both are O(n log n).

The reason is locality. Merge sort streams: every pass reads and writes
contiguous runs, and the hardware prefetches perfectly. A Fenwick tree jumps
around an array of size n by powers of two, so once the tree exceeds cache almost
every update and query is a miss. Same complexity, very different constant, and
the constant is not constant — it grows as the structure outgrows the cache.

This is the third time in this module that a linear-memory-access algorithm has
beaten a theoretically comparable one on cache behaviour, after **Two Sum** and
**Longest Consecutive Sequence**.

## When the Fenwick tree is still the right answer

It handles things merge sort cannot. Merge sort counts inversions **once, for the
whole array**; a Fenwick tree maintains a running structure, so it answers
questions merge sort has no way to express — inversions in a prefix, inversions
after inserting a new element, or counts against an arbitrary threshold rather
than equality. **Reverse Pairs**, the next subtopic, is exactly such a variant.

## Which to write

**Merge sort**, with a 64-bit counter and a non-strict comparison. It is the
fastest at every size measured, and the count falls out of a sort you understand
already.

<!-- @intuition -->
Sorting the array is a process of repeatedly discovering that two elements are in the wrong order and fixing it, so the work a sort does is exactly a measure of how disordered the input was. Merge sort makes that measurement cheap to collect. When it merges two already-sorted halves and reaches for an element from the right, that element is smaller than every element still waiting on the left — and all of those sit earlier in the original array. One comparison has therefore just identified a whole block of out-of-order pairs at once, which is why the count can be gathered in the same time the sort takes rather than pair by pair.

<!-- @approach -->
### Brute Force - Every Pair

<!-- @idea -->
Compare every pair of positions and count those where the earlier element is larger.

<!-- @steps -->
1. Take each position as the earlier element of a pair.
2. Compare it against every later position.
3. Count the pair when the earlier element is strictly larger.
4. Equal elements are not inversions, so the comparison is strict.
5. Accumulate the total in a 64-bit counter.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Correct on every input and the natural reference, since it needs no argument about why a bulk count is valid. Measured 26.35ms at n = 20,000 against merge sort's 0.88ms, a factor of 30, and it becomes unusable well before the answer itself gets large.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

long long countInversions(const vector<int>& a) {
    long long count = 0;                       // 64-bit: the ANSWER can overflow
    int n = a.size();

    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (a[i] > a[j]) count++;          // strict: equals are not inversions

    return count;
}
```

<!-- @annotations -->
- 5: A 64-bit counter. At n = 100,000 a descending array has 4,999,950,000 inversions, about 2.33 times INT32_MAX.
- 10: Strictly greater. Equal elements are in order, so they must not be counted.

<!-- @code java -->
```java
static long countInversions(int[] a) {
    long count = 0;

    for (int i = 0; i < a.length; i++)
        for (int j = i + 1; j < a.length; j++)
            if (a[i] > a[j]) count++;

    return count;
}
```

<!-- @annotations -->
- 2: Declared long rather than int, since the count itself exceeds a 32-bit range from n = 65,537 upward.

<!-- @code python -->
```python
def count_inversions(a):
    count = 0
    n = len(a)

    for i in range(n):
        for j in range(i + 1, n):
            if a[i] > a[j]:
                count += 1
    return count


# Correct on every input, which makes it the reference the fast versions
# were checked against over all 87,381 arrays from four values, n up to 8.
```

<!-- @annotations -->
- 7: The strict comparison, which is the definition of an inversion — equal elements are not out of order.

<!-- @approach -->
### Optimal - Count During a Merge Sort

<!-- @idea -->
Sort the array by merging, and whenever an element is taken from the right half, count it as inverted with everything still remaining in the left half.

<!-- @steps -->
1. Split the range in half and count inversions within each half recursively.
2. Merge the two halves, which are now each sorted.
3. Take from the left half whenever its head is less than or equal to the right's.
4. Otherwise take from the right half, and add the number of elements still remaining in the left.
5. Those elements are all larger and all sit earlier, so each forms an inversion.
6. Add the two halves' counts to the count from the merge.

<!-- @complexity -->
- time: O(n log n)
- space: O(n) for the merge buffer
- note: The recommended solution, fastest at every size measured — 545.77ms at ten million elements against a Fenwick tree's 3,916.47ms. The sorting is not a side effect: both halves being ordered is precisely what makes the bulk count valid.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

static long long mergeCount(vector<int>& a, vector<int>& buf, int lo, int hi) {
    if (hi - lo <= 1) return 0;
    int mid = (lo + hi) / 2;
    long long count = mergeCount(a, buf, lo, mid) + mergeCount(a, buf, mid, hi);

    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (a[i] <= a[j]) buf[k++] = a[i++];          // <= : equals are NOT inversions
        else { buf[k++] = a[j++]; count += mid - i; } // BLOCK: all of a[i..mid) invert
    }
    while (i < mid) buf[k++] = a[i++];
    while (j < hi)  buf[k++] = a[j++];
    for (int t = lo; t < hi; t++) a[t] = buf[t];

    return count;
}

long long countInversions(vector<int> a) {            // by value: caller's data survives
    vector<int> buf(a.size());
    return mergeCount(a, buf, 0, a.size());
}
```

<!-- @annotations -->
- 11: Non-strict. Using < instead measured 99.93% wrong, and it is invisible on distinct values.
- 12: mid - i, not 1. Adding one instead measured 86.86% wrong, always by undercounting.
- 21: Taking the vector by value, since the merge reorders it and the caller probably wants their array intact.

<!-- @code java -->
```java
static long mergeCount(int[] a, int[] buf, int lo, int hi) {
    if (hi - lo <= 1) return 0;
    int mid = (lo + hi) / 2;
    long count = mergeCount(a, buf, lo, mid) + mergeCount(a, buf, mid, hi);

    int i = lo, j = mid, k = lo;
    while (i < mid && j < hi) {
        if (a[i] <= a[j]) buf[k++] = a[i++];
        else { buf[k++] = a[j++]; count += mid - i; }
    }
    while (i < mid) buf[k++] = a[i++];
    while (j < hi)  buf[k++] = a[j++];
    System.arraycopy(buf, lo, a, lo, hi - lo);

    return count;
}

static long countInversions(int[] nums) {
    int[] a = nums.clone();
    return mergeCount(a, new int[a.length], 0, a.length);
}
```

<!-- @annotations -->
- 9: The block count, which is why one comparison can settle many pairs at once.
- 19: Cloning so the caller's array is not reordered by the sort.

<!-- @code python -->
```python
def count_inversions(nums):
    a = list(nums)
    buf = [0] * len(a)

    def rec(lo, hi):
        if hi - lo <= 1:
            return 0
        mid = (lo + hi) // 2
        count = rec(lo, mid) + rec(mid, hi)

        i, j, k = lo, mid, lo
        while i < mid and j < hi:
            if a[i] <= a[j]:                 # <= : equals are NOT inversions
                buf[k] = a[i]; i += 1
            else:
                buf[k] = a[j]; j += 1
                count += mid - i             # BLOCK: everything left of mid inverts
            k += 1
        while i < mid:
            buf[k] = a[i]; i += 1; k += 1
        while j < hi:
            buf[k] = a[j]; j += 1; k += 1
        a[lo:hi] = buf[lo:hi]
        return count

    return rec(0, len(a))


# [1,1,0,0] -> 4.  Counting one per emission instead of the block gives 2.
```

<!-- @annotations -->
- 13: The non-strict comparison. A strict < measured 99.93% wrong and is undetectable without duplicate values.
- 17: mid - i is the number of elements still waiting on the left, every one of which inverts with this element.

<!-- @approach -->
### Fenwick Tree with Coordinate Compression

<!-- @idea -->
Walk the array from the right, and for each element count how many already-seen elements are strictly smaller, using a tree that supports prefix counts.

<!-- @steps -->
1. Collect the distinct values, sort them, and map each value to its rank.
2. Build a Fenwick tree indexed by rank, all zero.
3. Walk the array from the last element to the first.
4. For each element, query how many already-inserted elements have a strictly smaller rank.
5. Add that to the running count, since each is a later position holding a smaller value.
6. Insert the current element's rank into the tree.

<!-- @complexity -->
- time: O(n log n), with a sort for compression and a log-time update per element
- space: O(n) for the tree and the rank table
- note: The same complexity as merge sort and measured much slower — 3,916.47ms at ten million elements against 545.77ms, a factor of 7.2, and the gap widens with n because the tree's access pattern jumps by powers of two while merge sort streams. Its value is generality: it answers prefix and threshold queries that merge sort cannot express, which is what the next subtopic needs.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

long long countInversions(const vector<int>& a) {
    int n = a.size();
    vector<int> sorted = a;                                  // coordinate compression
    sort(sorted.begin(), sorted.end());
    sorted.erase(unique(sorted.begin(), sorted.end()), sorted.end());
    int m = sorted.size();

    vector<int> tree(m + 1, 0);
    auto update = [&](int i) { for (++i; i <= m; i += i & -i) tree[i]++; };
    auto query  = [&](int i) { long long r = 0; for (++i; i > 0; i -= i & -i) r += tree[i]; return r; };

    long long count = 0;
    for (int t = n - 1; t >= 0; t--) {                       // right to left
        int rank = lower_bound(sorted.begin(), sorted.end(), a[t]) - sorted.begin();
        if (rank > 0) count += query(rank - 1);              // strictly smaller only
        update(rank);
    }
    return count;
}
```

<!-- @annotations -->
- 8: Compression maps arbitrary values onto 0..m-1 so the tree can be indexed by them directly.
- 17: Walking right to left, so everything already in the tree sits at a later position than the current element.
- 19: rank - 1 excludes equal values, since equals are not inversions.

<!-- @code java -->
```java
import java.util.*;

static long countInversions(int[] a) {
    int n = a.length;
    int[] sorted = a.clone();
    Arrays.sort(sorted);
    int m = 0;
    for (int i = 0; i < n; i++) if (i == 0 || sorted[i] != sorted[i-1]) sorted[m++] = sorted[i];

    int[] tree = new int[m + 1];
    long count = 0;
    for (int t = n - 1; t >= 0; t--) {
        int rank = lowerBound(sorted, m, a[t]);
        for (int i = rank; i > 0; i -= i & -i) count += tree[i];
        for (int i = rank + 1; i <= m; i += i & -i) tree[i]++;
    }
    return count;
}

static int lowerBound(int[] s, int m, int v) {
    int lo = 0, hi = m;
    while (lo < hi) { int mid = (lo + hi) >>> 1; if (s[mid] < v) lo = mid + 1; else hi = mid; }
    return lo;
}
```

<!-- @annotations -->
- 14: Querying from rank downward counts strictly smaller ranks, since the tree is one-indexed and rank is zero-based.
- 22: The unsigned shift avoids the overflow a plain (lo + hi) / 2 would have on large ranges.

<!-- @code python -->
```python
from bisect import bisect_left

def count_inversions(a):
    n = len(a)
    ranks = sorted(set(a))                # coordinate compression
    m = len(ranks)
    tree = [0] * (m + 1)

    def update(i):
        i += 1
        while i <= m:
            tree[i] += 1
            i += i & -i

    def query(i):                          # sum of ranks 0..i
        i += 1
        total = 0
        while i > 0:
            total += tree[i]
            i -= i & -i
        return total

    count = 0
    for t in range(n - 1, -1, -1):         # right to left
        r = bisect_left(ranks, a[t])
        if r > 0:
            count += query(r - 1)          # strictly smaller only
        update(r)
    return count


# Same complexity as merge sort, measured 7.2x slower at ten million
# elements because the tree's access pattern jumps rather than streams.
```

<!-- @annotations -->
- 5: Compressing to ranks, so values of any magnitude index a tree sized by the count of distinct values.
- 24: Walking right to left means the tree holds exactly the elements at later positions.

<!-- @example -->

<!-- @input -->
a = [2, 4, 1, 3, 5]

<!-- @output -->
3

<!-- @why -->
Small enough to enumerate by hand and check against the merge, so the bulk count can be seen matching a pairwise count.

<!-- @walkthrough -->
1. Listing pairs directly: 2 inverts with 1, and 4 inverts with 1 and with 3 — three in total.
2. The merge splits into [2, 4] and [1, 3, 5], each of which is already sorted internally.
3. Merging them, the head of the right half is 1 and the head of the left is 2.
4. Since 1 is smaller it is emitted from the right, and both 2 and 4 remain on the left — so 2 inversions are counted at once.
5. Next the heads are 2 and 3, so 2 is emitted from the left and nothing is counted.
6. Then the heads are 4 and 3, so 3 is emitted from the right and only 4 remains on the left — 1 more inversion.
7. The remaining 4 and 5 are in order, giving 2 plus 1 equals 3.

<!-- @example -->

<!-- @input -->
a = [1, 1, 0, 0] counting one per emission instead of the block

<!-- @output -->
2 — and the correct answer is 4

<!-- @why -->
The smallest input showing the undercount, and it shows the bug always errs downward so the answer stays plausible.

<!-- @walkthrough -->
1. Each 0 sits after both 1s and is smaller than both, so there are four inversions.
2. The merge splits into [1, 1] and [0, 0], both already sorted.
3. Merging, the first 0 is emitted from the right while both 1s remain on the left.
4. The block count adds 2 here; incrementing by one adds only 1.
5. The second 0 is then emitted, again with both 1s still remaining, so the block adds 2 more.
6. The block version totals 4 and the increment version totals 2.
7. Measured over 87,381 arrays, incrementing by one was wrong on 86.86% of them, always by undercounting.

<!-- @example -->

<!-- @input -->
a = [0, 0] with a strict comparison during the merge

<!-- @output -->
1 — and the correct answer is 0

<!-- @why -->
Shows the comparison bug firing on the smallest possible input, and that it is undetectable without duplicate values.

<!-- @walkthrough -->
1. The two elements are equal, so they are not out of order and there are no inversions.
2. The merge splits into [0] and [0].
3. With a non-strict comparison the left element is emitted first and nothing is counted.
4. With a strict comparison 0 is not less than 0, so the right element is emitted instead.
5. That triggers the block count, adding the one element still remaining on the left.
6. The result is 1 where the answer is 0.
7. Over all 5,914 permutations of distinct values the strict version was wrong zero times, so only duplicates expose it.

<!-- @example -->

<!-- @input -->
A fully descending array of 100,000 elements

<!-- @output -->
4,999,950,000 inversions — 2.33x INT32_MAX

<!-- @why -->
Shows the result itself overflowing, which no care with intermediate values can fix.

<!-- @walkthrough -->
1. In a fully descending array every pair is out of order.
2. The number of pairs is n times n minus one over two, which for 100,000 is 4,999,950,000.
3. INT32_MAX is 2,147,483,647, so the answer is about 2.33 times too large to fit.
4. The threshold is n = 65,537, where the maximum first exceeds a 32-bit integer.
5. At n = 200,000 the maximum is 19,999,900,000, over nine times the limit.
6. This is the result overflowing rather than an intermediate, unlike the sums in Find the Repeating and Missing Number.
7. So the return type and the accumulator must both be 64-bit; nothing else helps.

<!-- @visualization array -->

<!-- @description -->
The array drawn as a row of bars whose heights are the values, with inversions shown as arcs connecting pairs — but only draw an arc when the pair is actually counted, because the point is that most arcs are never drawn individually. Open by enumerating a small case pairwise so the reader sees what an inversion is: sweep every pair, drawing a faint arc for each comparison and darkening it when the earlier bar is taller. Count them by hand, then wipe the arcs. Now the merge, staged bottom-up so the recursion is visible as structure rather than as calls: split the row into halves and halves again down to single bars, then rebuild upward, showing each merge as two sorted runs being zipped into one. At each merge, park the two runs side by side with a pointer on each head. When the left head wins, emit it quietly. When the RIGHT head wins, freeze — highlight every bar still waiting in the left run, draw an arc from each of them to the emitted element simultaneously, and increment the counter by that many in one visible jump. That simultaneity is the entire lesson, so hold the frame and label it with the block size rather than letting the arcs appear one at a time. Beside the counter, run a second counter that increments by one per emission, and let the two diverge visibly over the course of the merge, ending on 4 against 2 for the [1,1,0,0] panel. Then an equals panel on [0,0], played twice: with a non-strict comparison the left bar is emitted and the counter stays at zero; with a strict one the right bar is emitted, an arc is drawn, and the counter reads 1 — with a note that every distinct-value test passes both. Close with two scale panels. First, overflow: a 32-bit register drawn as a fixed-width box with the count 4,999,950,000 unable to fit, annotated 2.33x and n = 65,537. Second, locality: two memory strips animated side by side, merge sort sweeping contiguous runs with a smooth advancing highlight, and the Fenwick tree jumping by powers of two with scattered highlights far apart — captioned 545.77ms against 3,916.47ms at ten million.

<!-- @sampleInput -->
```json
{"primary":{"input":[2,4,1,3,5],"answer":3,"pairs":[[2,1],[4,1],[4,3]],"merge":{"left":[2,4],"right":[1,3,5],"steps":[{"leftHead":2,"rightHead":1,"emitFrom":"right","emitted":1,"leftRemaining":[2,4],"counted":2},{"leftHead":2,"rightHead":3,"emitFrom":"left","emitted":2,"counted":0},{"leftHead":4,"rightHead":3,"emitFrom":"right","emitted":3,"leftRemaining":[4],"counted":1},{"leftHead":4,"rightHead":5,"emitFrom":"left","emitted":4,"counted":0}],"total":3}},"blockPanel":{"input":[1,1,0,0],"correct":4,"incrementByOne":2,"left":[1,1],"right":[0,0],"steps":[{"emitted":0,"leftRemaining":2,"blockAdds":2,"incrementAdds":1},{"emitted":0,"leftRemaining":2,"blockAdds":2,"incrementAdds":1}],"failureRate":0.8686,"arraysTested":87381,"alwaysUndercounts":true},"equalsPanel":{"input":[0,0],"nonStrict":{"emitFrom":"left","counted":0},"strict":{"emitFrom":"right","counted":1},"correct":0,"failureRate":0.9993,"distinctValueTests":{"permutationsTested":5914,"failures":0,"note":"invisible without duplicates"}},"overflowPanel":{"formula":"n(n-1)/2","int32Max":2147483647,"firstOverflowAtN":65537,"rows":[{"n":65536,"max":2147450880,"fits":true},{"n":65537,"max":2147516416,"fits":false},{"n":100000,"max":4999950000,"fits":false,"ratio":2.33},{"n":200000,"max":19999900000,"fits":false,"ratio":9.31}],"note":"the RESULT overflows, not an intermediate"},"costPanel":[{"n":2000,"bruteMs":0.66,"mergeMs":0.10,"bitMs":0.17},{"n":20000,"bruteMs":26.35,"mergeMs":0.88,"bitMs":1.36},{"n":1000000,"mergeMs":46.96,"bitMs":123.54,"ratio":2.6},{"n":10000000,"mergeMs":545.77,"bitMs":3916.47,"ratio":7.2}],"localityNote":"merge sort streams contiguous runs; a Fenwick tree jumps by powers of two, so it misses cache once the tree outgrows it","fenwickValue":"answers prefix and threshold queries merge sort cannot express - see Reverse Pairs"}
```

<!-- @highlights -->
- The array is drawn as bars whose heights are the values, with inversions shown as arcs between pairs.
- The opening enumerates a small case pairwise, darkening an arc whenever the earlier bar is taller.
- Those arcs are then wiped, because the merge will not draw most of them individually.
- The row splits into halves and halves again down to single bars, then rebuilds upward.
- Each merge parks two sorted runs side by side with a pointer on each head.
- When the left head wins it is emitted quietly and nothing is counted.
- When the RIGHT head wins the animation freezes and every bar still waiting on the left is highlighted.
- An arc is drawn from each of them to the emitted element simultaneously, and the counter jumps by that many at once.
- That frame is held and labelled with the block size, rather than letting the arcs appear one at a time.
- A second counter incrementing by one per emission runs beside it and visibly diverges.
- On the [1,1,0,0] panel the two counters end on 4 against 2.
- An equals panel plays [0,0] twice, once non-strict and once strict.
- Non-strict emits the left bar and the counter stays at zero; strict emits the right, draws an arc, and reads 1.
- The panel notes that every distinct-value test passes both versions.
- An overflow panel shows a fixed-width 32-bit register that 4,999,950,000 cannot fit, annotated 2.33x and n = 65,537.
- A locality panel animates merge sort sweeping contiguous runs against a Fenwick tree jumping by powers of two, captioned 545.77ms against 3,916.47ms.

<!-- @edgeCases -->
- Empty array — no pairs, so the answer is zero and the recursion must stop before indexing.
- Single element — no pairs, and the merge's base case returns immediately.
- Two elements in order — zero inversions.
- Two elements out of order — exactly one inversion, the smallest non-zero answer.
- Two equal elements — zero inversions, and the smallest case the strict comparison gets wrong.
- Already sorted input — zero inversions, and the merge still runs in full.
- Fully descending input — the maximum, n times n minus one over two, and the case that overflows a 32-bit result.
- All elements equal — zero inversions, and every comparison during the merge hits the equals branch.
- Distinct values only — the strict-comparison bug is completely invisible here.
- A single small value at the very end — it inverts with everything before it, giving n minus one inversions from one element.
- n at 65,537 — where the maximum possible answer first exceeds a 32-bit integer.
- Very large arrays — correctness is unaffected, but the Fenwick tree's advantage disappears entirely as its tree outgrows cache.

<!-- @pitfalls -->
- Incrementing the count by one instead of by the number of elements remaining in the left half. Measured 86.86% wrong, always undercounting so the answer stays plausible.
- Using a strict comparison when emitting from the left half. Equal elements are not inversions — measured 99.93% wrong.
- Testing only with distinct values. The strict-comparison bug was wrong zero times across all 5,914 permutations of distinct values.
- Returning the count as a 32-bit integer. The maximum answer exceeds INT32_MAX from n = 65,537, and at n = 100,000 it is 2.33 times too large.
- Assuming careful intermediates are enough. Here the result itself overflows, unlike the sums in Find the Repeating and Missing Number where the answer was small.
- Counting from the left half's perspective instead of the right's. The bulk count works because the emitted element is smaller than everything remaining on the left, which is only true when it came from the right.
- Sorting the caller's array in place. The merge reorders it, so take a copy unless reordering has been agreed.
- Forgetting that the halves must be sorted before the merge counts anything. The bulk count is valid only because both runs are ordered.
- Using a Fenwick tree by default. It measured 7.2 times slower than merge sort at ten million elements despite matching complexity.
- Skipping coordinate compression in the Fenwick version. The tree is indexed by value, so raw values of any magnitude would need an impossibly large tree.
- Querying the Fenwick tree at the element's own rank rather than one below it. That would count equal values as inversions.
- Walking the array left to right in the Fenwick version. The tree must hold the elements at later positions, so the walk goes right to left.

<!-- @doubt -->
### Why does one comparison count many inversions at once?

<!-- @answer -->
Because both halves are already sorted when the merge runs. If the next element to emit comes from the right half, it is smaller than the current head of the left half — and since the left half is sorted, it is smaller than every element still remaining there. All of those sit at earlier original positions, so each forms an inversion with it. One comparison therefore settles a whole block, and the block's size is exactly the number of elements left unconsumed in the left half. This is why sorting is not a side effect to tolerate: the ordering of both halves is precisely what makes the bulk count valid.

<!-- @doubt -->
### What happens if I add one instead of the block size?

<!-- @answer -->
You undercount, on almost every input. Measured 86.86% wrong across all 87,381 arrays from four values with n up to 8. The smallest failure is [1,1,0,0]: each 0 inverts with both 1s for four in total, but incrementing once per emission finds only two. It is a quiet bug because it errs downward and never upward, so the answer remains positive and plausible — nothing about the output looks wrong unless you know what it should be.

<!-- @doubt -->
### Why must the comparison be non-strict?

<!-- @answer -->
Because equal elements are not out of order. Emitting from the left on a strict less-than means that when the two heads are equal the right element is emitted instead, which triggers the block count and records inversions that do not exist. Measured 99.93% wrong — nearly everything, since duplicates are common. The smallest failure is [0,0], returning 1 where the answer is 0. And it is completely invisible without duplicates: across all 5,914 permutations of distinct values it was wrong zero times, so a distinct-value test suite proves nothing about it.

<!-- @doubt -->
### Does the answer really need 64 bits?

<!-- @answer -->
Yes, from n = 65,537 onward. The maximum inversion count is n(n-1)/2, reached by a fully descending array, and that first exceeds INT32_MAX at 65,537. At the common constraint of n = 100,000 a descending array has 4,999,950,000 inversions — about 2.33 times the limit — and at n = 200,000 it is over nine times. Note this is the result overflowing, not an intermediate: no amount of care inside the computation helps, so the return type and the accumulator both have to be 64-bit.

<!-- @doubt -->
### Why is the Fenwick tree slower if both are O(n log n)?

<!-- @answer -->
Memory locality. Merge sort streams: every pass reads and writes contiguous runs, so the prefetcher works perfectly. A Fenwick tree indexes by powers of two, so each update and query touches positions scattered across an array of size n — once that array outgrows cache, almost every access is a miss. Measured 1.7x apart at two thousand elements, 2.6x at a million and 7.2x at ten million: the gap widens precisely because the tree outgrows successively larger caches. This is the third measurement of the same effect in this module, after Two Sum and Longest Consecutive Sequence.

<!-- @doubt -->
### Then why learn the Fenwick version at all?

<!-- @answer -->
Because it answers questions merge sort cannot express. Merge sort produces one number for the whole array as a by-product of sorting it; a Fenwick tree maintains a live structure, so it can report inversions within a prefix, inversions after inserting a new element, or counts against an arbitrary threshold rather than simple inequality. Reverse Pairs, the next subtopic, is exactly that kind of variant — the condition changes from a[i] > a[j] to a[i] > 2*a[j], and the merge-based approach needs an extra counting pass while the tree handles it by changing one query bound.

<!-- @doubt -->
### Why does the Fenwick version walk right to left?

<!-- @answer -->
So that the tree always contains exactly the elements at later positions. An inversion is a pair where a larger value comes first, so standing at position t you want to know how many already-processed elements are smaller — and "already processed" must mean "to the right". Walking left to right would put earlier elements in the tree, which answers the opposite question. The query is also for ranks strictly below the current element's, not at or below, because equal values are not inversions.

<!-- @doubt -->
### What is coordinate compression for?

<!-- @answer -->
A Fenwick tree is indexed by value, so its size is the range of values rather than the number of them. Raw values can be arbitrarily large or negative, which would need an impossibly large tree. Compression sorts the distinct values and replaces each with its rank, mapping any input onto 0 through m-1 where m is the count of distinct values. The relative order is preserved, which is all the algorithm needs, and the tree is then sized by m rather than by the value range. Merge sort needs none of this, since it only ever compares values against each other.
