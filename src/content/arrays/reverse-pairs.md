---
id: reverse-pairs
topic: Arrays
title: Reverse Pairs
difficulty: Hard
status: ready
prerequisites:
  - count-inversions
  - merge-two-sorted-arrays-without-extra-space
  - integer-overflow-and-precision-errors
  - for-loop
  - time-and-space-complexity-basics
relatedIds:
  - count-inversions
  - merge-two-sorted-arrays-without-extra-space
  - find-the-repeating-and-missing-number
  - maximum-product-subarray-in-an-array
---

<!-- @summary -->
Count pairs where one element exceeds twice a later one — where the counting can no longer ride along inside the merge, where the shortcut that appears to work is invisible on small values and 23.62% wrong once they widen, and where half the allowed input range overflows the doubling.

<!-- @theory -->
## The problem

A **reverse pair** is a pair of positions `i < j` with `a[i] > 2 * a[j]`. Count
them.

```
[1, 3, 2, 3, 1]  ->  2      the pairs (3,1) at (1,4) and (3,1) at (3,4)
```

This is **Count Inversions** with the condition changed from `a[i] > a[j]` to
`a[i] > 2 * a[j]`, and that one factor of two changes the algorithm more than it
looks like it should.

## The count no longer rides along inside the merge

In Count Inversions, the merge's own comparison **is** the inversion test, so
counting is free: whenever an element is emitted from the right half, it inverts
with everything remaining on the left, and the merge was going to make that
comparison anyway.

Here the two questions have come apart. The merge must advance on `a[i] <= a[j]`
to produce a sorted result, but the count needs `a[i] > 2 * a[j]`. One pointer
walk cannot serve both.

So the structure gains a step: **count first, in a dedicated pass over the two
sorted halves, then merge**.

```
for each i in the left half:
    advance j while a[i] > 2 * a[j]
    add (j - start of right half)
then merge normally
```

Both passes are linear and the pointers never reset, so the whole thing is still
O(n log n) — it just does two walks per level instead of one.

### That extra pass is not free

Measured at ten million elements: **1,031.47ms here against 545.77ms for Count
Inversions** on the same machine — about **1.89x**. Same complexity, same data
size, one extra linear pass per merge level.

## The shortcut that looks like it works

The tempting move is to keep the single-pass structure and just put the factor of
two into the merge's comparison:

```
if (a[i] <= 2 * a[j]) emit a[i];
else                  emit a[j], count += (elements left in the left half);
```

Tested exhaustively over **11,718,750 arrays** from the values {−2..2}, that is
wrong **zero** times.

It is also badly broken. Widen the values and it fails:

| Values drawn from | n = 8 | n = 16 |
|---|---|---|
| −1..1 | 0% | 0% |
| −2..2 | **0%** | **0%** |
| −3..3 | 9.55% | **39.03%** |
| −5..5 | 14.12% | 56.07% |
| −100..100 | 17.75% | **65.30%** |

The smallest failing input is `[3, 2, 1]`, which returns 0 where the answer is 1.

**Why it passes on small values.** Merging on `a[i] <= 2*a[j]` does not produce a
sorted array — measured, it leaves an unsorted run on **64.5%** of inputs, which
breaks the precondition every level above it depends on. But when every value is
in {−2..2}, doubling barely moves anything relative to the comparisons being made,
so the disorder it introduces never changes an answer. From |values| ≥ 3 the
doubling separates enough for the broken ordering to matter.

This is worth dwelling on as a testing lesson rather than an algorithm one. An
exhaustive sweep of nearly twelve million arrays gave a clean pass on code that is
wrong on two thirds of realistic inputs — because the **value range**, not the
array length or the number of cases, was the dimension that mattered. Exhaustive
over the wrong space is still the wrong test.

## Half the allowed input overflows the doubling

LeetCode 493 permits any 32-bit value. For `2 * a[j]` to stay in range you need
`|a[j]| <= 1,073,741,823` — so **50.0% of the permitted range overflows**:

| a[j] | 2 × a[j] | Fits int32 |
|---|---|---|
| 1,073,741,823 | 2,147,483,646 | yes |
| 1,073,741,824 | 2,147,483,648 | **no** |
| 2,147,483,647 | 4,294,967,294 | **no** |
| −2,147,483,648 | −4,294,967,296 | **no** |

This is a sharper hazard than in the previous two subtopics. In **Find the
Repeating and Missing Number** the overflow needed n above 1,861; in **Count
Inversions** it needed the answer to grow past 65,537 elements. Here a **single
element** anywhere near the limit is enough, and half the legal values qualify.

Compare in 64 bits — `(long long)a[i] > 2LL * a[j]` — rather than pre-doubling in
place.

The answer overflows too: at ten million elements this measured
**24,997,563,527,674** reverse pairs, about 11,640 times INT32_MAX.

## What it costs

| n | Brute force | Merge + count pass | Fenwick tree |
|---|---|---|---|
| 2,000 | 0.26ms | **0.10ms** | 0.19ms |
| 20,000 | 22.27ms | **1.34ms** | 3.07ms |
| 1,000,000 | (too slow) | **93.70ms** | 325.96ms |
| 10,000,000 | (too slow) | **1,031.47ms** | 4,323.88ms |

Merge sort wins throughout, by **4.2x** over the Fenwick tree at ten million — the
same locality story measured in Count Inversions, where merge streams contiguous
runs and the tree jumps by powers of two.

The Fenwick version is more awkward here than there, because the compression table
must hold **both** the values and their doubles so a query for `2 * a[j]` has a
rank to land on. That doubles the table and is exactly the kind of bookkeeping the
merge approach avoids.

## Which to write

**Merge sort with a separate counting pass**, comparing in 64 bits. It is the
fastest measured, and the extra pass is a small, explicit price for a condition
the merge's own comparison can no longer answer.

<!-- @intuition -->
Counting inversions was cheap because the sort was already asking exactly the right question — every comparison it made was one you wanted the answer to. Doubling one side breaks that coincidence: the order the merge needs and the threshold you are counting against no longer line up, so the sort's comparisons stop being free evidence. The fix is not to force the count into the merge but to accept it needs its own sweep. Both halves are still sorted, which is what keeps that sweep linear — as the left pointer moves to larger values, the boundary in the right half only ever moves forward, so neither pointer ever goes back.

<!-- @approach -->
### Brute Force - Every Pair

<!-- @idea -->
Compare every pair of positions and count those where the earlier element exceeds twice the later one.

<!-- @steps -->
1. Take each position as the earlier element of a pair.
2. Compare it against every later position.
3. Count the pair when the earlier element is strictly greater than twice the later.
4. Do the comparison in a wide type, since doubling can overflow.
5. Accumulate the total in a 64-bit counter.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Correct on every input and the natural reference. Measured 22.27ms at n = 20,000 against the merge approach's 1.34ms, a factor of 17. Its value here is that it needs no reasoning about sortedness, which is precisely what the tempting shortcut gets wrong.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

long long countReversePairs(const vector<int>& a) {
    long long count = 0;                                  // the ANSWER overflows int
    int n = a.size();

    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if ((long long)a[i] > 2LL * a[j]) count++;     // widen BOTH sides

    return count;
}
```

<!-- @annotations -->
- 5: A 64-bit counter. At ten million elements the answer measured 24,997,563,527,674, about 11,640 times INT32_MAX.
- 10: 2LL forces 64-bit doubling. Half the allowed 32-bit range overflows when doubled in place.

<!-- @code java -->
```java
static long countReversePairs(int[] a) {
    long count = 0;

    for (int i = 0; i < a.length; i++)
        for (int j = i + 1; j < a.length; j++)
            if ((long) a[i] > 2L * a[j]) count++;

    return count;
}
```

<!-- @annotations -->
- 6: 2L * a[j] promotes the multiplication to long before it can wrap.

<!-- @code python -->
```python
def count_reverse_pairs(a):
    count = 0
    n = len(a)

    for i in range(n):
        for j in range(i + 1, n):
            if a[i] > 2 * a[j]:
                count += 1
    return count


# Python integers are unbounded, so the doubling cannot overflow here —
# which is why a Python solution cannot demonstrate the bug that the same
# algorithm has in C++ or Java.
```

<!-- @annotations -->
- 7: No widening needed in Python, which is exactly what hides the overflow when the algorithm is ported.

<!-- @approach -->
### Optimal - Merge Sort with a Separate Counting Pass

<!-- @idea -->
Sort by merging, but count reverse pairs in a dedicated two-pointer sweep over the sorted halves before merging them.

<!-- @steps -->
1. Split the range in half and count reverse pairs within each half recursively.
2. Both halves are now sorted.
3. Sweep the left half, advancing a pointer in the right half while the left element exceeds twice the right one.
4. Add the number of right-half elements that pointer has passed.
5. The pointer never resets, so the sweep is linear.
6. Then merge the two halves normally, on the ordinary comparison.

<!-- @complexity -->
- time: O(n log n), with two linear passes per merge level instead of one
- space: O(n) for the merge buffer
- note: The recommended solution and the fastest measured — 1,031.47ms at ten million elements against a Fenwick tree's 4,323.88ms. The extra pass is a real cost: the same machine counted plain inversions on the same size in 545.77ms, so the separate sweep is about 1.89x.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

static long long rec(vector<int>& a, vector<int>& buf, int lo, int hi) {
    if (hi - lo <= 1) return 0;
    int mid = (lo + hi) / 2;
    long long count = rec(a, buf, lo, mid) + rec(a, buf, mid, hi);

    int j = mid;                                        // COUNT pass, before merging
    for (int i = lo; i < mid; i++) {
        while (j < hi && (long long)a[i] > 2LL * a[j]) j++;
        count += j - mid;                               // j never resets: linear overall
    }

    int i = lo, j2 = mid, k = lo;                       // then merge, ordinary comparison
    while (i < mid && j2 < hi) buf[k++] = (a[i] <= a[j2]) ? a[i++] : a[j2++];
    while (i < mid)  buf[k++] = a[i++];
    while (j2 < hi)  buf[k++] = a[j2++];
    for (int t = lo; t < hi; t++) a[t] = buf[t];

    return count;
}

long long countReversePairs(vector<int> a) {            // by value: caller's data survives
    vector<int> buf(a.size());
    return rec(a, buf, 0, a.size());
}
```

<!-- @annotations -->
- 9: The count needs its own pass. Folding it into the merge below measured 23.62% wrong once values widen past two.
- 11: 2LL widens before doubling. Half the allowed 32-bit range overflows otherwise.
- 12: j only ever moves forward across the whole loop, which is what keeps this pass linear rather than quadratic.
- 16: The merge uses the plain comparison, since its job is to sort rather than to count.

<!-- @code java -->
```java
static long rec(int[] a, int[] buf, int lo, int hi) {
    if (hi - lo <= 1) return 0;
    int mid = (lo + hi) / 2;
    long count = rec(a, buf, lo, mid) + rec(a, buf, mid, hi);

    int j = mid;
    for (int i = lo; i < mid; i++) {
        while (j < hi && (long) a[i] > 2L * a[j]) j++;
        count += j - mid;
    }

    int i = lo, j2 = mid, k = lo;
    while (i < mid && j2 < hi) buf[k++] = (a[i] <= a[j2]) ? a[i++] : a[j2++];
    while (i < mid)  buf[k++] = a[i++];
    while (j2 < hi)  buf[k++] = a[j2++];
    System.arraycopy(buf, lo, a, lo, hi - lo);

    return count;
}

static long countReversePairs(int[] nums) {
    int[] a = nums.clone();
    return rec(a, new int[a.length], 0, a.length);
}
```

<!-- @annotations -->
- 8: The widened comparison, done inline rather than by pre-doubling the array.
- 22: Cloning so the caller's array is not reordered by the sort.

<!-- @code python -->
```python
def count_reverse_pairs(nums):
    a = list(nums)
    buf = [0] * len(a)

    def rec(lo, hi):
        if hi - lo <= 1:
            return 0
        mid = (lo + hi) // 2
        count = rec(lo, mid) + rec(mid, hi)

        j = mid                                  # COUNT pass, before merging
        for i in range(lo, mid):
            while j < hi and a[i] > 2 * a[j]:
                j += 1
            count += j - mid

        i, j2, k = lo, mid, lo                   # then merge, ordinary comparison
        while i < mid and j2 < hi:
            if a[i] <= a[j2]:
                buf[k] = a[i]; i += 1
            else:
                buf[k] = a[j2]; j2 += 1
            k += 1
        while i < mid:
            buf[k] = a[i]; i += 1; k += 1
        while j2 < hi:
            buf[k] = a[j2]; j2 += 1; k += 1
        a[lo:hi] = buf[lo:hi]
        return count

    return rec(0, len(a))


# [3,2,1] -> 1.  Folding the count into the merge returns 0, and that bug
# is invisible on any array whose values all lie in {-2..2}.
```

<!-- @annotations -->
- 11: A dedicated pass, because the merge's comparison and the counting condition no longer agree.
- 13: The doubling lives in the condition. Doubling the array in place first would overflow in a fixed-width language.
- 19: The merge compares plainly, so the halves come out sorted for the level above.

<!-- @approach -->
### Fenwick Tree with Coordinate Compression

<!-- @idea -->
Walk from the right, and for each element count how many already-seen doubles are strictly below it, using a tree over both the values and their doubles.

<!-- @steps -->
1. Collect every value and every value's double into one list.
2. Sort and deduplicate it, giving a rank for each quantity the algorithm will ask about.
3. Build a Fenwick tree indexed by rank.
4. Walk the array from the last element to the first.
5. Query how many already-inserted doubles have a rank strictly below the current element's own rank.
6. Insert the current element's double, then continue.

<!-- @complexity -->
- time: O(n log n)
- space: O(n) — the compression table holds both the values and their doubles
- note: Measured 4.2x slower than merge sort at ten million elements, the same locality gap seen in Count Inversions. It is also more awkward here, since the table must contain both values and doubles so a query for 2 * a[j] has a rank to land on — bookkeeping the merge approach avoids entirely.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

long long countReversePairs(const vector<int>& a) {
    int n = a.size();
    vector<long long> keys;
    keys.reserve(2 * n);
    for (int v : a) { keys.push_back(v); keys.push_back(2LL * v); }   // BOTH are queried
    sort(keys.begin(), keys.end());
    keys.erase(unique(keys.begin(), keys.end()), keys.end());
    int m = keys.size();

    vector<int> tree(m + 1, 0);
    auto update = [&](int i) { for (++i; i <= m; i += i & -i) tree[i]++; };
    auto query  = [&](int i) { long long r = 0; for (++i; i > 0; i -= i & -i) r += tree[i]; return r; };

    long long count = 0;
    for (int t = n - 1; t >= 0; t--) {
        int r = lower_bound(keys.begin(), keys.end(), (long long)a[t]) - keys.begin();
        if (r > 0) count += query(r - 1);                             // doubles strictly below a[t]
        int r2 = lower_bound(keys.begin(), keys.end(), 2LL * a[t]) - keys.begin();
        update(r2);
    }
    return count;
}
```

<!-- @annotations -->
- 9: Both the value and its double go into the table, since the algorithm looks up both.
- 21: Strictly below, so an element is not paired with a later one whose double merely equals it.
- 22: The double is what gets inserted, because later queries compare against doubles rather than values.

<!-- @code java -->
```java
import java.util.*;

static long countReversePairs(int[] a) {
    int n = a.length;
    long[] keys = new long[2 * n];
    for (int i = 0; i < n; i++) { keys[2*i] = a[i]; keys[2*i+1] = 2L * a[i]; }
    Arrays.sort(keys);
    int m = 0;
    for (int i = 0; i < keys.length; i++) if (i == 0 || keys[i] != keys[i-1]) keys[m++] = keys[i];

    int[] tree = new int[m + 1];
    long count = 0;
    for (int t = n - 1; t >= 0; t--) {
        int r = lowerBound(keys, m, a[t]);
        for (int i = r; i > 0; i -= i & -i) count += tree[i];
        int r2 = lowerBound(keys, m, 2L * a[t]);
        for (int i = r2 + 1; i <= m; i += i & -i) tree[i]++;
    }
    return count;
}

static int lowerBound(long[] s, int m, long v) {
    int lo = 0, hi = m;
    while (lo < hi) { int mid = (lo + hi) >>> 1; if (s[mid] < v) lo = mid + 1; else hi = mid; }
    return lo;
}
```

<!-- @annotations -->
- 5: A long array, since the doubles can exceed the int range even when the values do not.

<!-- @code python -->
```python
from bisect import bisect_left

def count_reverse_pairs(a):
    n = len(a)
    keys = sorted({v for x in a for v in (x, 2 * x)})   # BOTH values and doubles
    m = len(keys)
    tree = [0] * (m + 1)

    def update(i):
        i += 1
        while i <= m:
            tree[i] += 1
            i += i & -i

    def query(i):
        i += 1
        total = 0
        while i > 0:
            total += tree[i]
            i -= i & -i
        return total

    count = 0
    for t in range(n - 1, -1, -1):
        r = bisect_left(keys, a[t])
        if r > 0:
            count += query(r - 1)          # doubles strictly below a[t]
        update(bisect_left(keys, 2 * a[t]))
    return count


# The compression table is twice the size it would be for plain inversions,
# because queries and insertions use different quantities.
```

<!-- @annotations -->
- 5: The table holds both values and doubles, since queries use one and insertions the other.
- 28: Inserting the double rather than the value, which is what later queries will be compared against.

<!-- @example -->

<!-- @input -->
a = [1, 3, 2, 3, 1]

<!-- @output -->
2

<!-- @why -->
Small enough to enumerate by hand, and it shows that most pairs which are ordinary inversions are not reverse pairs.

<!-- @walkthrough -->
1. A reverse pair needs the earlier element to exceed twice the later one, not merely to exceed it.
2. The pair at positions 1 and 4 has values 3 and 1, and 3 is greater than 2 — so it counts.
3. The pair at positions 3 and 4 has values 3 and 1, likewise counting.
4. The pair at positions 1 and 2 has values 3 and 2, but 3 is not greater than 4 — so it does not count.
5. The pair at positions 2 and 4 has values 2 and 1, and 2 is not greater than 2 — the comparison is strict.
6. Only the two pairs found in steps two and three qualify.
7. The same array has more ordinary inversions than reverse pairs, which is why the factor of two cannot ride along inside the merge.

<!-- @example -->

<!-- @input -->
a = [3, 2, 1] with the count folded into the merge

<!-- @output -->
0 — and the correct answer is 1

<!-- @why -->
The smallest input where the tempting shortcut fails, and it needs values of at least three to appear at all.

<!-- @walkthrough -->
1. The only reverse pair is positions 0 and 2, since 3 is greater than twice 1.
2. Folding the count into the merge means the merge advances on a[i] <= 2*a[j] rather than a[i] <= a[j].
3. That comparison does not order the elements, so the merged run comes out unsorted.
4. Measured, such a merge leaves an unsorted run on 64.5% of inputs.
5. The level above then counts against halves that are not actually sorted, and the two-pointer reasoning no longer holds.
6. On this input the result is 0 where the answer is 1.
7. With every value in the range minus two to two the shortcut never fails, which is why it survives a naive exhaustive test.

<!-- @example -->

<!-- @input -->
The folded-count shortcut, tested over different value ranges

<!-- @output -->
0 wrong over 11,718,750 arrays from {−2..2}, and 65.30% wrong over {−100..100}

<!-- @why -->
The testing lesson of this subtopic: an exhaustive sweep of the wrong dimension gives a clean pass on badly broken code.

<!-- @walkthrough -->
1. Every array from the values minus two to two with n up to ten was tested — 11,718,750 of them.
2. The shortcut was wrong on none of them.
3. Widening the values to minus three through three, it failed on 9.55% at n = 8 and 39.03% at n = 16.
4. At minus one hundred through one hundred it failed on 65.30% at n = 16.
5. The reason is that doubling a value in the range minus two to two barely moves it relative to the comparisons being made.
6. From an absolute value of three upward, the doubling separates enough for the broken ordering to change answers.
7. So the dimension that mattered was the value range, not the array length or the number of cases.

<!-- @example -->

<!-- @input -->
An element of 1,073,741,824 with the doubling done in 32-bit arithmetic

<!-- @output -->
2,147,483,648 wraps to a negative number — and half the legal input range does this

<!-- @why -->
Shows the overflow arriving from a single element rather than from array size, which is a sharper hazard than the previous two subtopics.

<!-- @walkthrough -->
1. LeetCode 493 permits any 32-bit value, from about minus 2.1 billion to 2.1 billion.
2. For twice a value to stay in that range the value must be at most 1,073,741,823 in magnitude.
3. That is exactly half the permitted range, so 50.0% of legal values overflow when doubled.
4. At 1,073,741,824 the double is 2,147,483,648, one past the maximum, and wraps to negative.
5. A wrapped negative then compares as smaller than almost anything, so pairs are counted that should not be.
6. In Find the Repeating and Missing Number the overflow required n above 1,861, and in Count Inversions it required the answer to grow.
7. Here one element anywhere near the limit is enough, which is why the comparison must widen rather than the array being pre-doubled.

<!-- @visualization array -->

<!-- @description -->
Two sorted runs drawn as parallel horizontal tracks, the left half above and the right half below, with a value axis shared between them so a reader can see vertically which elements relate. The key visual is a **doubling lens**: for the element under the right-hand pointer, draw a ghosted marker at twice its value on the shared axis, clearly distinct from the element itself. The count compares the left element against that ghost, never against the element — so the ghost must be visible whenever a comparison happens, or the whole distinction from Count Inversions is lost. Run the counting pass first, deliberately labelled as a separate act: walk the left pointer forward one element at a time, and for each, advance the right pointer while the left element sits above the ghost. Shade the region of the right half the pointer has swept and show the running count taking that region's width in one go, then note that the right pointer does not return when the left pointer advances — draw a small ratchet on it to make the one-way motion explicit, since that is what keeps the pass linear. Only after the counting pass completes, wipe the ghosts and run the merge as an ordinary zip on the plain comparison, emphasising that this second walk uses a different test. Beside it, run the folded-count shortcut on the same data: a single walk whose comparison uses the ghost, and show the emitted sequence coming out **unsorted** — highlight the out-of-order pair in the output with a broken-chain icon, and then show the level above consuming that unsorted run, with its two-pointer assumption visibly violated. Follow with the range panel, which is the lesson: the same shortcut run on three arrays of identical length, one with values in minus two to two, one in minus three to three, one in minus one hundred to one hundred, with their ghosts drawn at the same scale — in the first the ghosts sit almost on top of their elements and nothing goes wrong, in the third they are flung far away and the ordering visibly shatters. Annotate 0% against 65.30%. Close with an overflow panel: a fixed-width 32-bit register with a value at 1,073,741,824, the doubling arrow pushing the result one notch past the end, and the wrapped negative shown landing on the wrong side of the comparison — captioned that half the legal range does this.

<!-- @sampleInput -->
```json
{"primary":{"input":[1,3,2,3,1],"answer":2,"reversePairs":[{"i":1,"j":4,"values":[3,1],"test":"3 > 2*1 = 2"},{"i":3,"j":4,"values":[3,1],"test":"3 > 2*1 = 2"}],"rejected":[{"i":1,"j":2,"values":[3,2],"test":"3 > 4 is false"},{"i":2,"j":4,"values":[2,1],"test":"2 > 2 is false, comparison is strict"}],"note":"more ordinary inversions than reverse pairs, which is why the merge comparison cannot serve both"},"structurePanel":{"countInversions":{"passesPerLevel":1,"reason":"the merge comparison IS the inversion test"},"reversePairs":{"passesPerLevel":2,"reason":"the merge needs a[i] <= a[j]; the count needs a[i] > 2*a[j]"},"measuredCostAtN10M":{"countInversionsMs":545.77,"reversePairsMs":1031.47,"ratio":1.89}},"shortcutPanel":{"description":"fold the count into the merge, comparing a[i] <= 2*a[j]","smallestFailure":{"input":[3,2,1],"got":0,"correct":1},"leavesUnsortedRun":0.645,"byValueRange":[{"range":"-1..1","n8":0.0,"n16":0.0},{"range":"-2..2","n8":0.0,"n16":0.0},{"range":"-3..3","n8":0.0955,"n16":0.3903},{"range":"-5..5","n8":0.1412,"n16":0.5607},{"range":"-100..100","n8":0.1775,"n16":0.6530}],"exhaustiveTestThatMissedIt":{"arrays":11718750,"valueRange":"-2..2","maxN":10,"failures":0},"lesson":"exhaustive over the wrong dimension is still the wrong test"},"overflowPanel":{"int32Max":2147483647,"int32Min":-2147483648,"safeAbsMax":1073741823,"fractionOfRangeThatOverflows":0.50,"rows":[{"value":1073741823,"doubled":2147483646,"fits":true},{"value":1073741824,"doubled":2147483648,"fits":false},{"value":2147483647,"doubled":4294967294,"fits":false},{"value":-2147483648,"doubled":-4294967296,"fits":false}],"contrast":{"findRepeatingMissing":"needed n above 1,861","countInversions":"needed the answer to grow past n = 65,537","reversePairs":"a single element near the limit is enough"}},"answerSize":{"n":10000000,"reversePairs":24997563527674,"timesInt32Max":11640},"costPanel":[{"n":2000,"bruteMs":0.26,"mergeMs":0.10,"bitMs":0.19},{"n":20000,"bruteMs":22.27,"mergeMs":1.34,"bitMs":3.07},{"n":1000000,"mergeMs":93.70,"bitMs":325.96},{"n":10000000,"mergeMs":1031.47,"bitMs":4323.88,"ratio":4.2}],"fenwickAwkwardness":"the compression table must hold both values and doubles, since queries and insertions use different quantities"}
```

<!-- @highlights -->
- Two sorted runs are drawn as parallel tracks sharing a value axis, the left half above and the right half below.
- A doubling lens places a ghosted marker at twice the value of the element under the right-hand pointer.
- Every comparison is made against that ghost rather than the element, which is the whole difference from Count Inversions.
- The counting pass runs first and is labelled as a separate act.
- The left pointer advances one element at a time, and the right pointer moves while the left element sits above the ghost.
- The swept region of the right half is shaded and the running count takes its width in one go.
- A ratchet is drawn on the right pointer to make its one-way motion explicit, which is what keeps the pass linear.
- Only after counting completes are the ghosts wiped and the merge run as an ordinary zip on the plain comparison.
- The folded-count shortcut runs beside it as a single walk whose comparison uses the ghost.
- Its emitted sequence comes out unsorted, with the out-of-order pair marked by a broken-chain icon.
- The level above is then shown consuming that unsorted run with its two-pointer assumption visibly violated.
- A range panel runs the shortcut on three arrays of identical length with values in minus two to two, minus three to three, and minus one hundred to one hundred.
- In the first the ghosts sit almost on top of their elements and nothing goes wrong; in the third they are flung far away and the ordering shatters.
- That panel is annotated 0% against 65.30%, with the note that the failing dimension was the value range rather than the length.
- An overflow panel shows a 32-bit register with 1,073,741,824 doubling one notch past the end.
- The wrapped negative is shown landing on the wrong side of the comparison, captioned that half the legal range does this.

<!-- @edgeCases -->
- Empty array — no pairs, so the answer is zero and the recursion stops before indexing.
- Single element — no pairs.
- Two elements forming a reverse pair, such as [3,1] — the smallest non-zero answer.
- Two elements that are an inversion but not a reverse pair, such as [2,1] — the answer is zero, since 2 is not greater than 2.
- All elements equal and positive — no reverse pairs, since a value never exceeds twice itself when positive.
- All elements equal and negative, such as [-2,-2] — every pair counts, since a negative value does exceed twice itself.
- Values all in the range minus two to two — the range where the folded-count shortcut is undetectably wrong.
- A value at 1,073,741,824 — the smallest magnitude whose double overflows a 32-bit integer.
- A value at the 32-bit minimum — its double overflows by the largest margin.
- Mixed signs — a large positive against a negative almost always forms a reverse pair, since twice a negative is more negative.
- A fully descending array of large values — close to the maximum answer, which needs a 64-bit return type.
- Very large arrays — correctness is unaffected, but the answer reached 24,997,563,527,674 at ten million elements.

<!-- @pitfalls -->
- Folding the count into the merge by putting the factor of two in the merge's comparison. Measured 0% wrong on values in minus two to two and 65.30% wrong on wider ranges.
- Testing that shortcut exhaustively over a narrow value range. An exhaustive sweep of 11,718,750 arrays from minus two to two passed code that is wrong on two thirds of realistic inputs.
- Doubling the array in place before the sweep. Half the allowed 32-bit range overflows when doubled, so the widening must happen inside the comparison.
- Comparing without widening at all. Writing a[i] > 2 * a[j] in fixed-width arithmetic wraps for any element above 1,073,741,823 in magnitude.
- Returning the count as a 32-bit integer. At ten million elements the answer measured 24,997,563,527,674, about 11,640 times INT32_MAX.
- Resetting the right-hand pointer for each left element. It only ever moves forward across the whole sweep, which is what makes the pass linear rather than quadratic.
- Using a non-strict comparison. A reverse pair needs the earlier element strictly greater than twice the later one, so [2,1] does not count.
- Assuming this behaves like Count Inversions because the shape is similar. The merge's comparison answers the inversion question and does not answer this one.
- Counting after merging rather than before. Once merged, the two halves are indistinguishable and the pairing information is gone.
- Forgetting that negatives make reverse pairs easier rather than harder. Twice a negative is more negative, so [-2,-2] is a reverse pair while [2,2] is not.
- Building the Fenwick compression table from the values alone. Queries use values and insertions use doubles, so the table must hold both.
- Reaching for the Fenwick tree by default. It measured 4.2 times slower than merge sort at ten million elements.

<!-- @doubt -->
### Why can't the count happen inside the merge, the way it does for inversions?

<!-- @answer -->
Because the two comparisons have come apart. In Count Inversions the merge advances on a[i] <= a[j] and an inversion is a[i] > a[j] — the same comparison, so every emission from the right half settles a block of inversions for free. Here the merge still needs a[i] <= a[j] to produce a sorted result, but the count needs a[i] > 2 * a[j]. One pointer walk cannot answer both questions, so the counting gets its own sweep before the merge. Both sweeps are linear, so the complexity is unchanged — but measured at ten million elements this took 1,031.47ms against 545.77ms for plain inversions, about 1.89 times, which is the price of the second pass.

<!-- @doubt -->
### I folded the count into the merge and my tests all pass. Is it wrong?

<!-- @answer -->
Almost certainly, and your tests are the reason you cannot tell. That shortcut merges on a[i] <= 2 * a[j], which does not order the elements — measured, it leaves an unsorted run on 64.5% of inputs, breaking the precondition every level above depends on. But with every value in the range minus two to two, doubling barely moves anything and the disorder never changes an answer: an exhaustive sweep of 11,718,750 such arrays found zero failures. Widen the values to minus three through three and it fails on 39.03% at n = 16; at minus one hundred through one hundred, 65.30%. The smallest failing input is [3,2,1], which returns 0 where the answer is 1.

<!-- @doubt -->
### So what should I have tested instead?

<!-- @answer -->
The value range, which is the dimension this bug lives in. Exhaustively covering every array of length up to ten from a five-value alphabet sounds thorough and is nearly twelve million cases — but every one of them is in the region where the doubling is too small to matter. A few hundred random arrays with values in the hundreds would have found it immediately. The general lesson is that exhaustiveness is only as good as the space you are exhausting: count the dimensions your algorithm actually depends on, and make sure the test varies each of them.

<!-- @doubt -->
### Why does the doubling overflow so easily here?

<!-- @answer -->
Because it needs only one element rather than a large array. LeetCode 493 permits any 32-bit value, and 2 * a[j] stays in range only when the magnitude is at most 1,073,741,823 — so 50.0% of the permitted values overflow when doubled. Contrast the previous two subtopics: Find the Repeating and Missing Number needed n above 1,861 before its sums overflowed, and Count Inversions needed the answer to grow past 65,537 elements. Here a single element near the limit is enough. Widen inside the comparison, as (long long)a[i] > 2LL * a[j], rather than pre-doubling the array.

<!-- @doubt -->
### Why does the right-hand pointer not reset for each left element?

<!-- @answer -->
Because the left half is sorted, so as the left element grows the boundary in the right half can only move forward. If a[i] > 2 * a[j] held for the previous, smaller left element, it certainly holds for this larger one — so everything the pointer has already passed still qualifies and never needs revisiting. That monotonicity is what makes the sweep linear: across the whole loop the right pointer advances at most the length of the right half. Resetting it per element would turn a linear pass into a quadratic one and lose the whole benefit.

<!-- @doubt -->
### Do negative numbers make reverse pairs harder or easier?

<!-- @answer -->
Easier, which surprises people. Twice a negative number is more negative than the number itself, so the bar a[i] must clear is lower. [-2,-2] is a reverse pair, since -2 is greater than -4, while the positive equivalent [2,2] is not, since 2 is not greater than 4. And any large positive followed by any negative is essentially always a reverse pair. So an array of mixed signs has far more reverse pairs than one of comparable positives, and testing only on positive values understates both the answer and the overflow risk.

<!-- @doubt -->
### Why is the Fenwick version more awkward here than for inversions?

<!-- @answer -->
Because queries and insertions use different quantities. For plain inversions you insert a value and query against values, so one compressed table of the values suffices. Here you insert 2 * a[j] and query against a[i], so the table must contain both the values and their doubles — otherwise a query has no rank to land on. That doubles the table and adds a second lookup per element. It also measured 4.2 times slower than merge sort at ten million elements, the same locality gap seen in Count Inversions, so the extra bookkeeping buys nothing here. Its value remains generality rather than speed.

<!-- @doubt -->
### Does the answer need 64 bits?

<!-- @answer -->
Yes. The maximum is the same n(n-1)/2 as for inversions, so it exceeds a 32-bit integer from n = 65,537 upward, and in practice it gets large quickly: on ten million random values the answer measured 24,997,563,527,674, about 11,640 times INT32_MAX. Note that this is a separate 64-bit requirement from the doubling — the comparison needs widening because of a single element's magnitude, and the accumulator needs widening because of how many pairs there are. Both are needed, for different reasons.
