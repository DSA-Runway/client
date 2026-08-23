---
id: kth-element-of-2-sorted-arrays
topic: Binary Search
title: Kth element of 2 sorted arrays
difficulty: Medium
status: ready
prerequisites:
  - lower-bound
  - merge-two-sorted-arrays-without-extra-space
  - capacity-to-ship-packages-within-d-days
relatedIds:
  - median-of-2-sorted-arrays
  - merge-two-sorted-arrays-without-extra-space
  - lower-bound
  - capacity-to-ship-packages-within-d-days
  - count-occurrences-in-a-sorted-array
---

<!-- @summary -->
The search runs over a partition point that spans both arrays, so one cut determines the other and the bounds must keep both legal. Omit the clamp without checking the derived cut and you index out of range on 31.86% of inputs — the same bound-it-or-check-it choice the shipping problem posed. Two pieces of standard advice also turn out to be unnecessary: the clamp already makes searching the smaller array pointless, and INT_MIN/INT_MAX sentinels are safe even on arrays containing them.

<!-- @theory -->
## The problem

Two sorted arrays. Return the kth smallest element of their union, counting from
one.

```
a = [2, 3, 6, 7, 9], b = [1, 4, 8, 10], k = 5   ->  6
merged: 1 2 3 4 [6] 7 8 9 10
```

## One cut decides both

Imagine splitting each array so that the two left parts together hold exactly k
elements. Then the kth smallest is the largest element on the left. If `cut1`
elements are taken from the first array, the second must supply `cut2 = k - cut1` —
so choosing one cut fixes the other, and there is only one number to search.

A cut is correct when nothing on either left side exceeds anything on either right
side. Since each array is already sorted internally, only the crossing pairs need
checking:

```
        left            right
a:  ... l1  |  r1 ...
b:  ... l2  |  r2 ...

correct when   l1 <= r2   and   l2 <= r1
answer         max(l1, l2)
```

If `l1 > r2` the first array gave too many, so move `cut1` down. Otherwise it gave
too few. That is an ordinary binary search over `cut1`.

Verified over every pair of sorted arrays with at most four elements each drawn
from `{0..6}`, for every k — **762,300 cases, 0 wrong.**

## Both halves of the condition are needed

Checking only `l1 <= r2` and taking `max(l1, l2)` looks plausible: it confirms the
first array's left side does not overshoot. But it says nothing about the second
array's left side, which can still exceed the first array's right side.

Measured, dropping `l2 <= r1` is wrong on **177,364 of 762,300 — 23.27%**. The two
conditions are not redundant; they check opposite crossings.

## The bounds must keep the derived cut legal

`cut2 = k - cut1` is not free to be anything. It has to land inside the second
array, which constrains `cut1` from both sides:

```
lo = max(0, k - n2)      cut2 must not exceed n2
hi = min(k, n1)          cut1 must not exceed n1, nor exceed k
```

Start instead at `lo = 0, hi = n1` and `cut2` can fall outside `[0, n2]` — at which
point the code reads `b[cut2 - 1]` or `b[cut2]` out of range. Measured over the
same exhaustive space, an unclamped search reaches an out-of-range index on
**242,836 of 762,300 cases — 31.86%.**

The alternative is to keep the loose bounds and range-check `cut2` inside the loop,
adjusting the search when it falls outside. That is also **0 wrong**. So this is
the same choice the shipping-capacity container posed: **put the constraint in the
bound, or put it in the predicate — and the bug is having neither.** The bound is
the better place here, because it states the relationship between the two cuts once
rather than re-deriving it every iteration.

## Two pieces of standard advice that are not needed

**"Always search the smaller array, for O(log min(m, n))."** True conclusion, but
the clamp already delivers it. The initial range width searching the first array is
`min(k,n1) - max(0,k-n2)`, and searching the second it is `min(k,n2) - max(0,k-n1)`.
Those are **the same number** in every case:

| n1 | n2 | k | width searching a | width searching b |
|---|---|---|---|---|
| 10 | 50,000 | 25,000 | 11 | 11 |
| 50,000 | 50,000 | 50,000 | 50,001 | 50,001 |
| 1 | 100,000 | 50,000 | 2 | 2 |
| 100,000 | 1 | 50,000 | 2 | 2 |

Because `cut2 = k - cut1` ties the two together, whichever array you index, the
window is pinned by *both* sizes. Measured mean probes on random arrays confirm
it — 13.07 against 13.03 at 50,000 by 50,000, and 4.00 against 3.00 at 10 by
50,000 — and searching the larger array is **0 wrong** over the exhaustive space.
The swap is worth keeping for readability, not for complexity.

**"Use 64-bit sentinels, or the array's own extremes will collide with them."**
This one I expected to matter and it does not. Using `INT_MIN` for "nothing to the
left" and `INT_MAX` for "nothing to the right", on arrays drawn entirely from
`{INT_MIN, INT_MIN+1, -1, 0, 1, INT_MAX-1, INT_MAX}` — **0 wrong of 300,000
cases.**

The reason is that the sentinel's meaning and the extreme value's behaviour
coincide. `l1 = INT_MIN` means "no constraint from this side", and a real
`INT_MIN` is genuinely ≤ everything, so `l1 <= r2` holds either way. The same
symmetry holds at the top. Widening to 64 bits is still the habit worth having,
because it costs nothing and does not depend on that coincidence — but it is not
what makes this correct.

## The two-pointer walk is not a fallback

Walking both arrays and stopping after k steps is O(k) with no allocation. For
small k that is not merely acceptable, it is competitive with the binary search:

| n1 | n2 | k | merge both | two pointers | partition search |
|---|---|---|---|---|---|
| 10 | 10 | 1…8 | 139 | 23 | **9.9** |
| 1,000 | 1,000 | 1…8 | 9,388 | **14** | 14.7 |
| 50,000 | 50,000 | 1…8 | 495,773 | **16** | 12.2 |
| 1,000 | 1,000 | any | 8,553 | 2,314 | **81.7** |
| 50,000 | 50,000 | any | 434,184 | 245,576 | **216.2** |
| 10 | 50,000 | any | 53,677 | 41,269 | **27.2** |

Nanoseconds per call, with k varying per call so nothing can be cached. For small
k the two-pointer ties the partition search; across the full range of k it loses
by **1,136x** at 50,000 by 50,000. Merging both arrays is always worst, because it
allocates and copies everything before looking at k at all.

<!-- @intuition -->
Every earlier search in this tier had one dimension to move along — an index, a capacity, a divisor. This one appears to have two, since there are two arrays to cut, and the whole difficulty dissolves once you see that it does not: fixing k means the second cut is determined by the first, so the search space is one number after all. What that costs is that the single number now has to satisfy constraints belonging to both arrays at once, which is exactly where the bounds come from and exactly what goes wrong when they are left loose. The general shape is worth recognising — when a problem looks two-dimensional, look for a conservation law that collapses it, and then expect the bounds to inherit the constraints from both dimensions.

<!-- @approach -->
### Merge Both Arrays

<!-- @idea -->
Merge the two sorted arrays into one and index the kth element directly.

<!-- @steps -->
1. Walk both arrays with two indices, always taking the smaller front element.
2. Append it to a new array.
3. Drain whichever array still has elements.
4. Return the element at position k − 1.
5. The merge is the standard one; nothing about k is used until the end.

<!-- @complexity -->
- time: O(m + n)
- space: O(m + n)
- note: The slowest of the three at every size measured, because it allocates and copies both arrays before looking at k. 495,773ns at 50,000 by 50,000 against the partition search's 12.2ns for small k. Worth writing once because the merge's ordering rule is the fact the other two approaches exploit.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int kthElement(const vector<int>& a, const vector<int>& b, int k) {
    vector<int> merged;
    merged.reserve(a.size() + b.size());
    size_t i = 0, j = 0;
    while (i < a.size() && j < b.size())
        merged.push_back(a[i] <= b[j] ? a[i++] : b[j++]);
    while (i < a.size()) merged.push_back(a[i++]);
    while (j < b.size()) merged.push_back(b[j++]);
    return merged[k - 1];
}
```

<!-- @annotations -->
- 9: `<=` rather than `<`, which keeps equal elements in their original relative order. It changes nothing for the answer here, and it is the habit that makes a merge stable.
- 10: Both drains are needed; only one of them ever runs.
- 12: `k - 1`, because k counts from one. This is the only line that uses k at all — everything above is done regardless.

<!-- @code java -->
```java
static int kthElement(int[] a, int[] b, int k) {
    int[] merged = new int[a.length + b.length];
    int i = 0, j = 0, m = 0;
    while (i < a.length && j < b.length)
        merged[m++] = a[i] <= b[j] ? a[i++] : b[j++];
    while (i < a.length) merged[m++] = a[i++];
    while (j < b.length) merged[m++] = b[j++];
    return merged[k - 1];
}
```

<!-- @annotations -->
- 2: The allocation is the cost. It is proportional to both arrays even when k is 1.

<!-- @code python -->
```python
def kth_element(a, b, k):
    import heapq
    return list(heapq.merge(a, b))[k - 1]


# heapq.merge is lazy, so islice(heapq.merge(a, b), k - 1, k)
# would stop after k -- which is the next approach in disguise.
```

<!-- @annotations -->
- 3: `list(...)` is what forces the whole merge. Dropping it and slicing instead turns this into the O(k) walk below.

<!-- @approach -->
### Walk Two Pointers to k

<!-- @idea -->
Advance through both arrays exactly k times, taking the smaller front element each step, and return the last one taken.

<!-- @steps -->
1. Keep an index into each array.
2. Repeat k times: take whichever front element is smaller and advance that index.
3. If one array is exhausted, always take from the other.
4. The element taken on the kth step is the answer.
5. Nothing is stored.

<!-- @complexity -->
- time: O(k)
- space: O(1)
- note: The right answer whenever k is small — measured **14ns at 1,000 by 1,000 and 16ns at 50,000 by 50,000** for k up to 8, which ties or beats the partition search. Across the full range of k it loses badly: 245,576ns against 216.2ns at 50,000 by 50,000, a factor of 1,136.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int kthElement(const vector<int>& a, const vector<int>& b, int k) {
    size_t i = 0, j = 0;
    int last = 0;
    for (int c = 0; c < k; c++) {
        if (i < a.size() && (j >= b.size() || a[i] <= b[j])) last = a[i++];
        else                                                 last = b[j++];
    }
    return last;
}
```

<!-- @annotations -->
- 8: The bounds test comes first in each half, so an exhausted array is never indexed. Reordering the two halves of that condition reads past the end. `j >= b.size() ||` handles the case where only the first array has elements left, which is what removes the need for separate drain loops.
- 11: `last`, not `a[i]` or `b[j]` — both indices have already moved past the element that was taken.

<!-- @code java -->
```java
static int kthElement(int[] a, int[] b, int k) {
    int i = 0, j = 0, last = 0;
    for (int c = 0; c < k; c++) {
        if (i < a.length && (j >= b.length || a[i] <= b[j])) last = a[i++];
        else                                                 last = b[j++];
    }
    return last;
}
```

<!-- @annotations -->
- 4: Java short-circuits both `&&` and `||`, so the bounds tests protect the accesses exactly as in C++.

<!-- @code python -->
```python
from heapq import merge
from itertools import islice


def kth_element(a, b, k):
    return next(islice(merge(a, b), k - 1, k))


# heapq.merge is a lazy generator, so islice stops it after k
# elements -- this is the two-pointer walk, written declaratively.
```

<!-- @annotations -->
- 6: `islice(..., k - 1, k)` consumes exactly k elements and no more, which is what keeps this O(k) rather than O(m + n).

<!-- @approach -->
### Binary Search the Partition

<!-- @idea -->
Search for the cut in one array that puts exactly k elements on the combined left side, with nothing on the left exceeding anything on the right.

<!-- @steps -->
1. Bound the cut so that the derived cut in the other array is also legal.
2. Take the midpoint cut, and derive the second cut as k minus it.
3. Read the two elements bordering each cut, using infinities where a cut sits at an edge.
4. If neither left element exceeds the opposite right element, the cut is correct and the answer is the larger left element.
5. Otherwise move the cut toward whichever side gave too many.

<!-- @complexity -->
- time: O(log min(m, n)) — measured 13.07 mean probes at 50,000 by 50,000
- space: O(1)
- note: The answer. 0 wrong over 762,300 exhaustive cases, and the only version whose cost is independent of k — 216.2ns at 50,000 by 50,000 across the full range of k, against the two-pointer's 245,576ns. For k below about 10 the two-pointer ties it.

<!-- @code cpp -->
```cpp
#include <vector>
#include <climits>
#include <algorithm>
using namespace std;

int kthElement(vector<int> a, vector<int> b, int k) {
    if (a.size() > b.size()) swap(a, b);
    int n1 = (int)a.size(), n2 = (int)b.size();
    int lo = max(0, k - n2), hi = min(k, n1);
    while (lo <= hi) {
        int cut1 = lo + (hi - lo) / 2;
        int cut2 = k - cut1;
        long long l1 = cut1 > 0  ? a[cut1 - 1] : LLONG_MIN;
        long long l2 = cut2 > 0  ? b[cut2 - 1] : LLONG_MIN;
        long long r1 = cut1 < n1 ? a[cut1]     : LLONG_MAX;
        long long r2 = cut2 < n2 ? b[cut2]     : LLONG_MAX;
        if (l1 <= r2 && l2 <= r1) return (int)max(l1, l2);
        if (l1 > r2) hi = cut1 - 1;
        else         lo = cut1 + 1;
    }
    return -1;
}
```

<!-- @annotations -->
- 7: Searching the smaller array is for readability, not complexity — the clamp on the next line already bounds the range by both sizes, and searching the larger one measured 0 wrong with the same probe count.
- 9: The bounds that keep `cut2` legal. With `lo = 0, hi = n1` instead, `cut2` falls outside `[0, n2]` and the code indexes out of range on 31.86% of inputs — unless the loop range-checks it, which is the other valid design.
- 12: `cut2` is derived, not searched. Fixing k means one cut determines the other, which is why this is a one-dimensional search over what looks like a two-dimensional choice.
- 13: Infinities where a cut sits at an edge, meaning "no constraint from this side". `INT_MIN` and `INT_MAX` also work — measured 0 wrong even on arrays full of them — because the sentinel's meaning and the extreme value's behaviour coincide.
- 17: Both halves are required. Dropping `l2 <= r1` is wrong on 23.27% of exhaustive cases, because the two conditions check opposite crossings.
- 18: `l1 > r2` means the first array contributed too many, so its cut moves down.
- 21: Unreachable for valid input, since some cut always satisfies the condition.

<!-- @code java -->
```java
static int kthElement(int[] a, int[] b, int k) {
    if (a.length > b.length) return kthElement(b, a, k);
    int n1 = a.length, n2 = b.length;
    int lo = Math.max(0, k - n2), hi = Math.min(k, n1);
    while (lo <= hi) {
        int cut1 = lo + (hi - lo) / 2;
        int cut2 = k - cut1;
        long l1 = cut1 > 0  ? a[cut1 - 1] : Long.MIN_VALUE;
        long l2 = cut2 > 0  ? b[cut2 - 1] : Long.MIN_VALUE;
        long r1 = cut1 < n1 ? a[cut1]     : Long.MAX_VALUE;
        long r2 = cut2 < n2 ? b[cut2]     : Long.MAX_VALUE;
        if (l1 <= r2 && l2 <= r1) return (int) Math.max(l1, l2);
        if (l1 > r2) hi = cut1 - 1;
        else         lo = cut1 + 1;
    }
    return -1;
}
```

<!-- @annotations -->
- 2: Recursing with the arguments swapped avoids copying, where the C++ version takes its vectors by value so it can swap them.

<!-- @code python -->
```python
def kth_element(a, b, k):
    if len(a) > len(b):
        a, b = b, a
    n1, n2 = len(a), len(b)
    lo, hi = max(0, k - n2), min(k, n1)
    while lo <= hi:
        cut1 = (lo + hi) // 2
        cut2 = k - cut1
        l1 = a[cut1 - 1] if cut1 > 0 else float("-inf")
        l2 = b[cut2 - 1] if cut2 > 0 else float("-inf")
        r1 = a[cut1] if cut1 < n1 else float("inf")
        r2 = b[cut2] if cut2 < n2 else float("inf")
        if l1 <= r2 and l2 <= r1:
            return max(l1, l2)
        if l1 > r2:
            hi = cut1 - 1
        else:
            lo = cut1 + 1
    return -1
```

<!-- @annotations -->
- 3: Swapping the names, not the data — Python rebinds rather than copying, so this costs nothing.
- 5: The clamp, and the reason no index in the loop needs a range check.

<!-- @example -->

<!-- @input -->
```
a = [2, 3, 6, 7, 9], b = [1, 4, 8, 10], k = 5
```

<!-- @output -->
```
6
```

<!-- @why -->
The merged order is 1 2 3 4 6 7 8 9 10, whose fifth element is 6. The search finds a cut putting five elements on the left without ever merging anything.

<!-- @walkthrough -->
```
a is longer, so swap:  a = [1,4,8,10] (n1=4), b = [2,3,6,7,9] (n2=5)

lo = max(0, 5-5) = 0,  hi = min(5, 4) = 4
cut1 = 2, cut2 = 3

    left        |  right
a:  1  4        |  8  10
b:  2  3  6     |  7  9

l1 = 4, r1 = 8
l2 = 6, r2 = 7

l1 <= r2 ?  4 <= 7  yes
l2 <= r1 ?  6 <= 8  yes
-> max(4, 6) = 6

One probe. Five elements sit on the left and the largest of
them is the answer.
```

<!-- @example -->

<!-- @input -->
```
a = [100, 112, 256, 349, 770], b = [72, 86, 113, 119, 265, 445, 892], k = 7
```

<!-- @output -->
```
256
```

<!-- @why -->
A case where the first cut is wrong and the search has to move. It shows `l1 > r2` doing its job — the first array contributed too many, so its cut comes down.

<!-- @walkthrough -->
```
a = [100,112,256,349,770] (n1=5), b = [72,86,113,119,265,445,892] (n2=7)
lo = max(0, 7-7) = 0,  hi = min(7, 5) = 5

cut1 = 2, cut2 = 5
  l1 = 112, r1 = 256 | l2 = 265, r2 = 445
  l1 <= r2 ? 112 <= 445 yes
  l2 <= r1 ? 265 <= 256 NO   -> the second array gave too many, lo = 3

cut1 = 4, cut2 = 3
  l1 = 349, r1 = 770 | l2 = 113, r2 = 119
  l1 <= r2 ? 349 <= 119 NO   -> the first array gave too many, hi = 3

cut1 = 3, cut2 = 4
  l1 = 256, r1 = 349 | l2 = 119, r2 = 265
  256 <= 265 yes, 119 <= 349 yes
  -> max(256, 119) = 256
```

<!-- @example -->

<!-- @input -->
```
a = [], b = [1, 2, 3], k = 2
```

<!-- @output -->
```
2
```

<!-- @why -->
An empty array, where the clamp collapses the range to a single point. Without it the search would try cuts in an array that has none.

<!-- @walkthrough -->
```
a is empty, so n1 = 0, n2 = 3
lo = max(0, 2-3) = 0,  hi = min(2, 0) = 0

cut1 = 0, cut2 = 2
  l1 = -inf (no left side in a), r1 = +inf (no right side either)
  l2 = b[1] = 2,   r2 = b[2] = 3
  l1 <= r2 ? yes
  l2 <= r1 ? 2 <= +inf  yes
  -> max(-inf, 2) = 2

Both sentinels fire at once here, which is why they have to
mean "no constraint" rather than any particular value.
```

<!-- @example -->

<!-- @input -->
```
a = [INT_MIN, 0], b = [INT_MAX], k = 3
```

<!-- @output -->
```
INT_MAX
```

<!-- @why -->
The case that would break sentinels if the sentinel value could be confused with real data. Measured over 300,000 arrays drawn entirely from the extremes, it does not — and this input shows why.

<!-- @walkthrough -->
```
b is shorter, so swap: a = [INT_MAX] (n1=1), b = [INT_MIN, 0] (n2=2)
lo = max(0, 3-2) = 1,  hi = min(3, 1) = 1

cut1 = 1, cut2 = 2
  l1 = a[0] = INT_MAX,  r1 = +inf   (cut1 == n1, no right side)
  l2 = b[1] = 0,        r2 = +inf   (cut2 == n2, no right side)
  l1 <= r2 ? INT_MAX <= +inf  yes
  l2 <= r1 ? 0 <= +inf        yes
  -> max(INT_MAX, 0) = INT_MAX

With INT_MAX as the sentinel instead of +inf, r1 and r2 are
both INT_MAX and the comparisons still hold: a real INT_MAX
is <= INT_MAX. The sentinel's meaning and the extreme's
behaviour coincide, which is why the collision is harmless.
```

<!-- @visualization custom -->

<!-- @description -->
Shows how fixing k collapses two cuts into one search variable, the crossing conditions that make a cut correct, and the measured consequences of loosening the bounds or dropping half the condition.

<!-- @sampleInput -->
```json
{"primary":{"a":[2,3,6,7,9],"b":[1,4,8,10],"k":5,"answer":6,"merged":[1,2,3,4,6,7,8,9,10],"afterSwap":{"a":[1,4,8,10],"b":[2,3,6,7,9]},"bounds":{"lo":0,"hi":4,"loFormula":"max(0, k - n2)","hiFormula":"min(k, n1)"},"probe":{"cut1":2,"cut2":3,"aLeft":[1,4],"aRight":[8,10],"bLeft":[2,3,6],"bRight":[7,9],"l1":4,"r1":8,"l2":6,"r2":7,"check1":"l1 <= r2 : 4 <= 7","check2":"l2 <= r1 : 6 <= 8","answer":"max(4, 6) = 6"},"probes":1},"oneCutDecidesBoth":{"idea":"fixing k means cut2 = k - cut1, so choosing one cut fixes the other","consequence":"a search over what looks like two dimensions is one number after all","cost":"that number must satisfy constraints belonging to both arrays, which is where the bounds come from"},"crossingConditions":{"correctWhen":"l1 <= r2 AND l2 <= r1","answer":"max(l1, l2)","whyBothNeeded":"the two conditions check opposite crossings; only one of them says nothing about the other array's left side","droppingSecond":{"wrong":177364,"of":762300,"pct":23.27}},"boundsKeepTheDerivedCutLegal":{"lo":"max(0, k - n2)","hi":"min(k, n1)","withoutClamp":{"whatHappens":"cut2 falls outside [0, n2] and the code indexes b out of range","reached":242836,"of":762300,"pct":31.86},"alternative":{"design":"keep lo = 0, hi = n1 and range-check cut2 inside the loop","wrong":0},"reading":"the same bound-it-or-check-it choice the shipping-capacity container posed; the bug is having neither"},"adviceThatIsNotNeeded":[{"advice":"always search the smaller array, for O(log min(m,n))","verdict":"already implied by the clamp","widths":[{"n1":10,"n2":50000,"k":25000,"searchingA":11,"searchingB":11},{"n1":50000,"n2":50000,"k":50000,"searchingA":50001,"searchingB":50001},{"n1":1,"n2":100000,"k":50000,"searchingA":2,"searchingB":2},{"n1":100000,"n2":1,"k":50000,"searchingA":2,"searchingB":2}],"meanProbes":[{"shape":"50,000 x 50,000","smaller":13.07,"larger":13.03},{"shape":"10 x 50,000","smaller":4.00,"larger":3.00}],"searchingLargerWrong":0,"keepItFor":"readability, not complexity"},{"advice":"use 64-bit sentinels or the array's own extremes will collide","verdict":"expected to matter and does not","test":{"arraysDrawnFrom":["INT_MIN","INT_MIN+1",-1,0,1,"INT_MAX-1","INT_MAX"],"cases":300000,"intSentinelsWrong":0,"longSentinelsWrong":0},"why":"the sentinel means 'no constraint from this side', and a real INT_MIN is genuinely <= everything, so the comparison holds either way","stillWorthDoing":"widening costs nothing and does not depend on that coincidence"}],"benchmark":{"units":"ns per call, k varies per call so nothing can be cached, randomised order, best of 5","rows":[{"n1":10,"n2":10,"k":"1..8","merge":139,"twoPointer":23,"partition":9.9},{"n1":10,"n2":10,"k":"full","merge":149,"twoPointer":34,"partition":16.5},{"n1":1000,"n2":1000,"k":"1..8","merge":9388,"twoPointer":14,"partition":14.7},{"n1":1000,"n2":1000,"k":"full","merge":8553,"twoPointer":2314,"partition":81.7},{"n1":50000,"n2":50000,"k":"1..8","merge":495773,"twoPointer":16,"partition":12.2},{"n1":50000,"n2":50000,"k":"full","merge":434184,"twoPointer":245576,"partition":216.2},{"n1":10,"n2":50000,"k":"full","merge":53677,"twoPointer":41269,"partition":27.2}],"readings":["for k below about 10 the two-pointer walk ties the partition search","across the full range of k the partition search wins by 1,136x at 50,000 by 50,000","merging both arrays is always worst, because it allocates and copies before looking at k at all"]},"assertions":["cut1 + cut2 = k always","the answer is max(l1, l2) at a correct cut","the initial range width is the same whichever array is searched","a cut always exists that satisfies both crossing conditions","the sentinels mean 'no constraint', not a particular value"]}
```

<!-- @highlights -->
- Fixing k means `cut2 = k − cut1`, so a two-array problem is a one-variable search.
- A cut is correct when `l1 <= r2` **and** `l2 <= r1`; dropping either half is wrong on **23.27%** of cases.
- The bounds `max(0, k−n2)` and `min(k, n1)` keep the derived cut legal — without them, 31.86% of inputs index out of range.
- Bound it or check it, the same choice the shipping container posed; the bug is having neither.
- "Search the smaller array" is already implied by the clamp — the range width is identical either way.
- `INT_MIN`/`INT_MAX` sentinels are safe even on arrays full of them, because the sentinel's meaning matches the extreme's behaviour.

<!-- @edgeCases -->
- One array empty — the clamp collapses the range to a single cut and both sentinels fire at once.
- k = 1 — the answer is the smaller of the two first elements, and the two-pointer walk finds it in one step.
- k = m + n — the answer is the larger of the two last elements, and both cuts sit at the ends.
- k larger than one array's length — `lo = max(0, k − n2)` becomes positive, which is what stops `cut2` exceeding `n2`.
- Arrays containing `INT_MIN` or `INT_MAX` — safe with int sentinels, measured over 300,000 cases.
- All elements equal — every cut satisfies both conditions and the first probe returns.
- The two arrays disjoint in range — the answer comes entirely from one of them, and the cut sits at an edge.
- Very different sizes — the clamp bounds the range by the smaller size regardless of which array is searched.
- `cut2` computed but not range-checked — reads `b[-1]` or `b[n2]` on 31.86% of inputs.
- `(lo + hi) / 2` — safe here since both are at most k, but the habit is what protects the next problem.

<!-- @pitfalls -->
- Starting at `lo = 0, hi = n1` without range-checking `cut2`. It indexes out of range on 31.86% of exhaustive cases.
- Checking only `l1 <= r2`. Wrong on 23.27% — the two conditions check opposite crossings.
- Searching `cut2` as well as `cut1`. It is derived, not free; there is only one variable.
- Treating "search the smaller array" as a complexity requirement. The clamp already bounds the range by both sizes.
- Assuming int sentinels break on extreme data. Measured 0 wrong over 300,000 arrays drawn from the extremes.
- Returning `min(r1, r2)` instead of `max(l1, l2)`. That is the (k+1)th element, not the kth.
- Writing `k - 1` cuts instead of `k`. The left side must hold exactly k elements for its maximum to be the kth smallest.
- Merging both arrays first. It allocates and copies everything before k is even looked at — 495,773ns at 50,000 by 50,000.
- Reaching for the partition search when k is tiny. The two-pointer walk ties it below about k = 10 and is far simpler.
- Forgetting that `a` was swapped when reporting an index. The value is correct; any position you derive from it is not.

<!-- @doubt -->
### Why is this a one-dimensional search when there are two arrays?

<!-- @answer -->
Because k ties the two cuts together. If the combined left side must hold exactly k elements and `cut1` of them come from the first array, then the second must supply `cut2 = k - cut1` — there is no freedom left. So the search variable is `cut1` alone, and everything else is derived. What that collapse costs is that the single variable now carries constraints from both arrays: `cut1` must lie in `[0, n1]` *and* `k - cut1` must lie in `[0, n2]`. That is exactly where the bounds `max(0, k - n2)` and `min(k, n1)` come from, and exactly what breaks when they are left loose.

<!-- @doubt -->
### Why are both crossing conditions needed?

<!-- @answer -->
Because they check opposite crossings and neither implies the other. `l1 <= r2` confirms that the first array's left side does not reach past the second array's right side; `l2 <= r1` confirms the mirror. A cut can satisfy one and violate the other — the first array's contribution can be perfectly placed while the second array's left side still contains an element larger than something on the first array's right. Measured, dropping `l2 <= r1` is wrong on **177,364 of 762,300 exhaustive cases — 23.27%**. The second worked example shows exactly that: at `cut1 = 2` the first condition holds (112 ≤ 445) and the second fails (265 > 256), and it is the failure that moves the search.

<!-- @doubt -->
### What happens if I don't clamp the bounds?

<!-- @answer -->
`cut2 = k - cut1` falls outside the second array and the code reads `b[cut2 - 1]` or `b[cut2]` out of range — measured on **242,836 of 762,300 cases, 31.86%**. There are two valid fixes and you need exactly one. Clamp the bounds to `lo = max(0, k - n2)` and `hi = min(k, n1)`, so no illegal cut is ever generated; or keep `lo = 0, hi = n1` and range-check `cut2` inside the loop, steering the search when it falls outside. Both measured **0 wrong**. This is the same structure the shipping-capacity container measured, where a capacity below the heaviest package was impossible rather than merely slow: put the constraint in the bound or in the predicate, and the bug is having neither. Here the bound is the better home, because it states the relationship between the cuts once instead of re-deriving it on every iteration.

<!-- @doubt -->
### Do I have to search the smaller array?

<!-- @answer -->
No — the clamp already does it for you. The initial range width searching the first array is `min(k, n1) - max(0, k - n2)`, and searching the second it is `min(k, n2) - max(0, k - n1)`. Those two expressions are **equal in every case**, because `cut2 = k - cut1` pins the window with both sizes no matter which array you index: at 10 by 50,000 with k = 25,000 both widths are 11, and at 100,000 by 1 both are 2. Measured mean probes on random arrays agree — 13.07 against 13.03 at 50,000 by 50,000 — and searching the larger array is **0 wrong** across the exhaustive space. Keep the swap for readability, since it makes `n1 <= n2` an invariant you can rely on while reading, but do not believe it is buying the complexity bound. The bound comes from the clamp.

<!-- @doubt -->
### Are `INT_MIN` and `INT_MAX` safe as sentinels?

<!-- @answer -->
Yes, and I expected them not to be. The worry is obvious: if the array itself contains `INT_MAX`, then `r1 = INT_MAX` is ambiguous between "no element here" and "an element that happens to be the maximum". Tested on arrays drawn entirely from `{INT_MIN, INT_MIN+1, -1, 0, 1, INT_MAX-1, INT_MAX}` — **0 wrong of 300,000 cases**. The reason is that the ambiguity is harmless: the sentinel means "this side imposes no constraint", and a real `INT_MAX` on the right imposes no *violated* constraint either, since every element is ≤ it. The same symmetry holds for `INT_MIN` on the left. Widen to 64 bits anyway — it costs nothing, and it makes the code correct for a reason rather than by coincidence.

<!-- @doubt -->
### When should I just walk two pointers?

<!-- @answer -->
Whenever k is small, which is more often than the complexity suggests. The walk is O(k) with no allocation, and measured with k drawn from 1 to 8 it takes **14ns at 1,000 by 1,000 and 16ns at 50,000 by 50,000** — the partition search takes 14.7ns and 12.2ns on the same inputs. They tie, and the walk is a great deal easier to get right. The picture inverts across the full range of k: at 50,000 by 50,000 the walk averages **245,576ns against 216.2ns**, a factor of 1,136, because its cost tracks k while the search's tracks log of the smaller array. If k is bounded and small, walk; if k can be anywhere, search.

<!-- @doubt -->
### Why is merging both arrays the worst option?

<!-- @answer -->
Because it does all of its work before consulting k. The merge allocates space for m + n elements and copies every one of them, then indexes position k − 1 at the very end — so asking for the first element costs exactly as much as asking for the last. Measured at 50,000 by 50,000 it takes **495,773ns for k ≤ 8**, where the two-pointer walk takes 16ns and the partition search 12.2ns. It is worth writing once because the merge's comparison rule — always take the smaller front element — is the fact the other two approaches exploit; the walk stops the merge early, and the partition search skips it entirely by reasoning about where the boundary must be.
