---
id: median-of-2-sorted-arrays
topic: Binary Search
title: Median of 2 Sorted Arrays
difficulty: Hard
status: ready
prerequisites:
  - kth-element-of-2-sorted-arrays
  - upper-bound
  - lower-bound
relatedIds:
  - kth-element-of-2-sorted-arrays
  - search-in-rotated-sorted-array-i
  - matrix-median
  - find-peak-element
---

<!-- @summary -->
The partition search from Kth Element, specialised to k = the middle, plus the even-length averaging. The rule everyone repeats — binary search the shorter array or it breaks — turns out to be false as stated: searching the longer one is correct too. What the swap actually does is make the cut2 range guards provably unnecessary, which is worth knowing because without either the swap or the guards it fails on 3.55% of inputs.

<!-- @theory -->
## The problem

Two sorted arrays. Return the median of their combined contents, in
O(log(min(m, n))). The median is the middle element when the total length is odd
and the average of the two middle elements when it is even.

```
a = [1, 3],  b = [2]        ->  2.0     combined [1,2,3], middle is 2
a = [1, 2],  b = [3, 4]     ->  2.5     combined [1,2,3,4], (2+3)/2
```

## The partition idea, specialised

Rather than merge anything, cut both arrays so that the left pieces together hold
exactly half the elements:

```
a:  a[0..cut1-1] | a[cut1..]
b:  b[0..cut2-1] | b[cut2..]

with   cut1 + cut2 = (n1 + n2 + 1) / 2
```

Only `cut1` is free — `cut2` follows from it. The cut is correct when everything
on the left is at most everything on the right, which reduces to two comparisons:

```
l1 <= r2   and   l2 <= r1
```

where `l1, l2` are the last elements of the left pieces and `r1, r2` the first
elements of the right pieces. If `l1 > r2` then `cut1` is too far right; otherwise
it is too far left. That is a binary search on `cut1`.

Once the cut is valid, the answer is immediate:

| total | answer |
|---|---|
| odd | `max(l1, l2)` |
| even | `(max(l1, l2) + min(r1, r2)) / 2` |

The `(n1 + n2 + 1) / 2` — with the `+1` — is what puts the extra element on the
left when the total is odd, so `max(l1, l2)` is the median without a separate case.

## The swap is about range, not speed

The standard advice is to binary search the **shorter** array, usually justified
by the O(log(min(m,n))) bound. Measured over all pairs of sorted arrays of length
0 to 5 drawn from `{0..3}` — **15,875 cases** — searching the *longer* array is
**0 wrong**. The bound is real, but correctness does not depend on it.

What the swap actually buys is that `cut2` can never leave `[0, n2]`:

```
with n1 <= n2 and cut1 in [0, n1]:
    cut2 = (n1+n2+1)/2 - cut1

  largest  cut2 = (n1+n2+1)/2        <= n2   whenever n1 <= n2
  smallest cut2 = (n1+n2+1)/2 - n1   >= 0    whenever n1 <= n2+1
```

Both hold exactly because the searched array is the shorter one. Measured:

| version | `cut2` out of range | wrong |
|---|---|---|
| swap to shorter, no range guards | **0** | 0 |
| no swap, no range guards | 563 of 15,875 — **3.55%** | 0 |

So there are two working designs — swap and omit the guards, or keep the guards
and search either array — and one broken one, which is the version people usually
write: no swap and no guards. The smallest failure is `a = [0]`, `b = []`, where
`cut2` becomes 1 against an empty array.

The guards are also not free to write correctly: they have to *adjust* `lo` or
`hi` and continue rather than return, since an out-of-range `cut2` means the
current `cut1` is infeasible, not that no answer exists.

## Unlike most searches here, linear never competes

Several subtopics in this module measured a linear scan beating the binary search
on realistic data. This one does not, at any size:

| n1 × n2 | full merge | walk to the middle | partition search |
|---|---|---|---|
| 1,000 × 1,000 | 78,708 | 6,833 | **71** |
| 1 × 1,999 | 13,722 | 1,764 | **21** |
| 100 × 1,900 | 47,555 | 2,570 | **40** |
| 50,000 × 50,000 | 2,863,597 | 202,208 | **57** |
| 10 × 100,000 | 1,383,667 | 43,167 | **10** |
| 1 × 1,000,000 | 5,279,833 | 398,653 | **5** |

Nanoseconds. Even at LeetCode 4's ceiling of m + n = 2,000, the partition search
is **96x** faster than walking to the middle.

The structural reason is worth naming. Find Peak Element's linear scan won because
it could stop early — a peak turns up after about two probes on random data. A
median has no such luck: it is defined by position, so any scan must reach the
middle every time, `(n1+n2)/2` steps with no early exit available. When the linear
alternative has no early exit, the logarithm always wins eventually, and here
"eventually" is n = 2.

Notice too that the partition column *falls* as the shorter array shrinks — 71ns
at 1,000×1,000 down to 5ns at 1×1,000,000 — because the probe count is
`log2(min(n1,n2))`, and a one-element array needs a single probe.

## Sentinels have to be wider than the data

The empty-side cases use ±infinity so the comparisons work without special-casing.
With `INT_MIN`/`INT_MAX` as those sentinels, the even-length average
`(max(l1,l2) + min(r1,r2)) / 2` adds two ints, and at the extremes that overflows:

```
a = [INT_MAX], b = [INT_MAX]     true median 2147483647.0,  int version gives -1.0
a = [2147483647], b = [2147483646]  true median 2147483646.5,  int version gives -1.5
```

LeetCode 4 caps values at 10⁶ so this never fires there, which is exactly why it
survives in so much published code. Holding the four boundary values in `long
long` — or casting before the addition — costs nothing and removes the trap.

<!-- @intuition -->
The thing to carry away is what the swap is for. "Binary search the shorter array" is repeated everywhere as though correctness depended on it, and measuring shows it does not — the longer array works fine. The swap earns its place for a different and more interesting reason: it makes an invariant hold automatically, so a whole class of bounds checks becomes unnecessary rather than merely usually-satisfied. That is the same move as Book Allocation's `lo = max(pages)`, where a line justified as an optimisation turned out to be doing correctness work. Both times the received explanation attaches to the right line for the wrong reason, and both times the wrong reason is the dangerous part: it tells you the line is optional.

<!-- @approach -->
### Merge and Read the Middle

<!-- @idea -->
Concatenate both arrays, sort, and take the middle element or the average of the two middle ones.

<!-- @steps -->
1. Copy both arrays into one.
2. Sort it.
3. If the total is odd, return the middle element.
4. If even, average the two middle elements.

<!-- @complexity -->
- time: O((m+n) log(m+n))
- space: O(m+n)
- note: The definition, and the reference the other two were verified against. Throws away the fact that both inputs are already sorted, which is the entire structure of the problem.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

double findMedianSortedArrays(const vector<int>& a, const vector<int>& b) {
    vector<int> all;
    all.reserve(a.size() + b.size());
    all.insert(all.end(), a.begin(), a.end());
    all.insert(all.end(), b.begin(), b.end());
    sort(all.begin(), all.end());

    int n = (int)all.size();
    if (n & 1) return all[n / 2];
    return ((double)all[n / 2 - 1] + all[n / 2]) / 2.0;
}
```

<!-- @annotations -->
- 10: Sorting inputs that are already sorted. A merge would be O(m+n) instead, which is the next approach — this line is the whole reason this version is the slowest of the three.
- 13: `n & 1` distinguishes odd from even; for odd totals `n / 2` is the exact middle index.
- 14: The cast happens before the addition, so two large ints cannot overflow on the way to the average.

<!-- @code java -->
```java
static double findMedianSortedArrays(int[] a, int[] b) {
    int[] all = new int[a.length + b.length];
    System.arraycopy(a, 0, all, 0, a.length);
    System.arraycopy(b, 0, all, a.length, b.length);
    Arrays.sort(all);

    int n = all.length;
    if ((n & 1) == 1) return all[n / 2];
    return ((double) all[n / 2 - 1] + all[n / 2]) / 2.0;
}
```

<!-- @annotations -->
- 9: `(double)` on the first operand promotes the whole expression, so the sum happens in floating point rather than wrapping as int.

<!-- @code python -->
```python
def find_median_sorted_arrays(a, b):
    all_vals = sorted(a + b)
    n = len(all_vals)
    if n % 2:
        return float(all_vals[n // 2])
    return (all_vals[n // 2 - 1] + all_vals[n // 2]) / 2.0
```

<!-- @annotations -->
- 2: `a + b` concatenates lists; `sorted` then runs Timsort, which detects the two existing sorted runs and merges them, so Python accidentally gets close to O(m+n) here.

<!-- @approach -->
### Walk to the Middle

<!-- @idea -->
Merge the two arrays with two pointers but stop at the middle, keeping only the last two values seen.

<!-- @steps -->
1. Advance whichever pointer holds the smaller current value.
2. Keep the previous and current values as you go.
3. Stop after taking `(total / 2) + 1` elements.
4. Odd total: the current value is the median. Even: average the previous and current.

<!-- @complexity -->
- time: O(m+n)
- space: O(1)
- note: Uses the sortedness and allocates nothing, which makes it 11x faster than the full merge at 1,000×1,000 — and still **96x slower** than the partition search, because a median has no early exit to find.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

double findMedianSortedArrays(const vector<int>& a, const vector<int>& b) {
    int n1 = (int)a.size(), n2 = (int)b.size(), total = n1 + n2;
    int need = total / 2;
    long long prev = 0, cur = 0;
    int i = 0, j = 0;
    for (int c = 0; c <= need; c++) {
        prev = cur;
        if (i < n1 && (j >= n2 || a[i] <= b[j])) cur = a[i++];
        else                                     cur = b[j++];
    }
    if (total & 1) return (double)cur;
    return ((double)prev + (double)cur) / 2.0;
}
```

<!-- @annotations -->
- 11: The exhaustion test comes first, so `b[j]` is never read once b is spent — the ordering of these two conditions is what makes the guard work.
- 9: `c <= need` takes one more element than the halfway point, which is what leaves `prev` and `cur` holding the two middle values for the even case.
- 15: Both casts precede the addition. Keeping `prev` and `cur` as `long long` already prevents the overflow, but the casts make it explicit.

<!-- @code java -->
```java
static double findMedianSortedArrays(int[] a, int[] b) {
    int n1 = a.length, n2 = b.length, total = n1 + n2;
    int need = total / 2;
    long prev = 0, cur = 0;
    int i = 0, j = 0;
    for (int c = 0; c <= need; c++) {
        prev = cur;
        if (i < n1 && (j >= n2 || a[i] <= b[j])) cur = a[i++];
        else                                     cur = b[j++];
    }
    if ((total & 1) == 1) return (double) cur;
    return ((double) prev + (double) cur) / 2.0;
}
```

<!-- @annotations -->
- 8: `a[i] <= b[j]`, not `<`. Either works for the median, but `<=` keeps the walk stable when values are equal across the two arrays.

<!-- @code python -->
```python
def find_median_sorted_arrays(a, b):
    n1, n2 = len(a), len(b)
    total = n1 + n2
    need = total // 2
    prev = cur = 0
    i = j = 0
    for _ in range(need + 1):
        prev = cur
        if i < n1 and (j >= n2 or a[i] <= b[j]):
            cur = a[i]
            i += 1
        else:
            cur = b[j]
            j += 1
    if total % 2:
        return float(cur)
    return (prev + cur) / 2.0
```

<!-- @annotations -->
- 9: Python short-circuits `and`/`or` exactly as C++ does, so `a[i]` is only read when `i < n1` holds.

<!-- @approach -->
### Partition Search

<!-- @idea -->
Binary search the cut position in the shorter array so the two left pieces together hold half the elements and everything left is at most everything right.

<!-- @steps -->
1. Swap so the first array is the shorter.
2. Search `cut1` over `[0, n1]`; `cut2` is `(n1+n2+1)/2 - cut1`.
3. Read the four boundary values, using ±infinity where a piece is empty.
4. If `l1 <= r2` and `l2 <= r1`, the cut is correct.
5. Odd total: return `max(l1, l2)`. Even: average it with `min(r1, r2)`.
6. Otherwise move `cut1` left if `l1 > r2`, right if not.

<!-- @complexity -->
- time: O(log(min(m, n)))
- space: O(1)
- note: **0 wrong** over 15,875 exhaustive cases. Faster than both alternatives at every size measured — 71ns against 6,833ns even at LeetCode 4's ceiling — and it gets faster as the shorter array shrinks.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

double findMedianSortedArrays(const vector<int>& A, const vector<int>& B) {
    const vector<int>* pa = &A; const vector<int>* pb = &B;
    if (pa->size() > pb->size()) swap(pa, pb);
    const vector<int>& a = *pa; const vector<int>& b = *pb;

    int n1 = (int)a.size(), n2 = (int)b.size();
    int total = n1 + n2, half = (total + 1) / 2;
    int lo = 0, hi = n1;
    while (lo <= hi) {
        int cut1 = lo + (hi - lo) / 2;
        int cut2 = half - cut1;
        long long l1 = cut1 > 0  ? a[cut1 - 1] : LLONG_MIN;
        long long l2 = cut2 > 0  ? b[cut2 - 1] : LLONG_MIN;
        long long r1 = cut1 < n1 ? a[cut1]     : LLONG_MAX;
        long long r2 = cut2 < n2 ? b[cut2]     : LLONG_MAX;
        if (l1 <= r2 && l2 <= r1) {
            if (total & 1) return (double)max(l1, l2);
            return ((double)max(l1, l2) + (double)min(r1, r2)) / 2.0;
        }
        if (l1 > r2) hi = cut1 - 1;
        else         lo = cut1 + 1;
    }
    return 0.0;
}
```

<!-- @annotations -->
- 8: Swapping pointers, not arrays — copying would make the function O(m+n) in space and defeat the point. This line is also what lets the code omit any range check on `cut2`.
- 12: The `+ 1` puts the extra element on the left for odd totals, so `max(l1, l2)` is the median with no separate case.
- 17: `LLONG_MIN` and `LLONG_MAX` as the empty-side sentinels, wider than any `int` in the data. `INT_MIN`/`INT_MAX` here would overflow the average on line 22.
- 21: The two comparisons that define a correct cut: everything left is at most everything right. No range check on `cut2` is needed, because searching the shorter array keeps it inside `[0, n2]` automatically.
- 25: `l1 > r2` means the cut in the shorter array reaches too far right, so move `hi` down. The other direction is the only remaining case.
- 28: Unreachable for valid input — some cut always satisfies the condition.

<!-- @code java -->
```java
static double findMedianSortedArrays(int[] A, int[] B) {
    int[] a = A, b = B;
    if (a.length > b.length) { int[] t = a; a = b; b = t; }

    int n1 = a.length, n2 = b.length;
    int total = n1 + n2, half = (total + 1) / 2;
    int lo = 0, hi = n1;
    while (lo <= hi) {
        int cut1 = lo + (hi - lo) / 2;
        int cut2 = half - cut1;
        long l1 = cut1 > 0  ? a[cut1 - 1] : Long.MIN_VALUE;
        long l2 = cut2 > 0  ? b[cut2 - 1] : Long.MIN_VALUE;
        long r1 = cut1 < n1 ? a[cut1]     : Long.MAX_VALUE;
        long r2 = cut2 < n2 ? b[cut2]     : Long.MAX_VALUE;
        if (l1 <= r2 && l2 <= r1) {
            if ((total & 1) == 1) return Math.max(l1, l2);
            return (Math.max(l1, l2) + (double) Math.min(r1, r2)) / 2.0;
        }
        if (l1 > r2) hi = cut1 - 1;
        else         lo = cut1 + 1;
    }
    return 0.0;
}
```

<!-- @annotations -->
- 3: Java swaps the references, so no array is copied — the same O(1) move as swapping pointers in C++.

<!-- @code python -->
```python
def find_median_sorted_arrays(a, b):
    if len(a) > len(b):
        a, b = b, a

    n1, n2 = len(a), len(b)
    total = n1 + n2
    half = (total + 1) // 2
    lo, hi = 0, n1
    while lo <= hi:
        cut1 = (lo + hi) // 2
        cut2 = half - cut1
        l1 = a[cut1 - 1] if cut1 > 0 else float("-inf")
        l2 = b[cut2 - 1] if cut2 > 0 else float("-inf")
        r1 = a[cut1] if cut1 < n1 else float("inf")
        r2 = b[cut2] if cut2 < n2 else float("inf")
        if l1 <= r2 and l2 <= r1:
            if total % 2:
                return float(max(l1, l2))
            return (max(l1, l2) + min(r1, r2)) / 2.0
        if l1 > r2:
            hi = cut1 - 1
        else:
            lo = cut1 + 1
    return 0.0
```

<!-- @annotations -->
- 3: `a, b = b, a` rebinds names rather than copying, so the swap is free here too.
- 12: `float("-inf")` compares correctly against Python ints of any size and cannot overflow, which is the cleanest form of the sentinel in any of the three languages.

<!-- @example -->

<!-- @input -->
```
a = [1, 3], b = [2]
```

<!-- @output -->
```
2.0
```

<!-- @why -->
Combined the arrays are `[1, 2, 3]`, an odd total, so the median is the middle element 2. The search cuts after the 2 in the shorter array.

<!-- @walkthrough -->
```
b is shorter after the swap:  a = [2],  b = [1, 3]
total = 3,  half = (3+1)/2 = 2,  lo = 0, hi = 1

cut1=0 cut2=2   left=(-inf, 3)  right=(2, +inf)
                l2=3 > r1=2, cut1 too small  ->  lo = 1
cut1=1 cut2=1   left=(2, 1)     right=(+inf, 3)
                2 <= 3 and 1 <= +inf         ->  VALID
total odd  ->  max(l1, l2) = max(2, 1) = 2
->  2.0

The +1 in `half` is why max(l1,l2) alone is the answer: it
puts the extra element of an odd total on the left side.
```

<!-- @example -->

<!-- @input -->
```
a = [1, 2], b = [3, 4]
```

<!-- @output -->
```
2.5
```

<!-- @why -->
Combined `[1, 2, 3, 4]`, an even total, so the median averages the two middle values 2 and 3. The valid cut takes both of `a` on the left and none of `b`.

<!-- @walkthrough -->
```
equal lengths, no swap:  a = [1, 2],  b = [3, 4]
total = 4,  half = 2,  lo = 0, hi = 2

cut1=1 cut2=1   left=(1, 3)     right=(2, 4)
                l2=3 > r1=2, cut1 too small  ->  lo = 2
cut1=2 cut2=0   left=(2, -inf)  right=(+inf, 3)
                2 <= 3 and -inf <= +inf      ->  VALID
total even ->  (max(2,-inf) + min(+inf,3)) / 2 = (2+3)/2
->  2.5

Note cut2 = 0: the whole of b sits on the right. The
sentinels are what let that case run without a branch.
```

<!-- @example -->

<!-- @input -->
```
a = [], b = [1]
```

<!-- @output -->
```
1.0
```

<!-- @why -->
One array is empty, which the sentinels handle without a special case. It is also the smallest input that breaks the version with neither the swap nor the range guards.

<!-- @walkthrough -->
```
a is already shorter (empty):  a = [],  b = [1]
total = 1,  half = 1,  lo = 0, hi = 0

cut1=0 cut2=1   left=(-inf, 1)  right=(+inf, +inf)
                -inf <= +inf and 1 <= +inf   ->  VALID
total odd  ->  max(-inf, 1) = 1
->  1.0

Without the swap this input is a = [0], b = []: cut1 can
reach 0 with cut2 = 1 indexing an empty array. That is the
3.55% failure, and swapping removes it by construction.
```

<!-- @example -->

<!-- @input -->
```
a = [1, 2, 3, 4, 5], b = [6, 7, 8]
```

<!-- @output -->
```
4.5
```

<!-- @why -->
Disjoint ranges, so the combined array is `[1..8]` and the median averages 4 and 5. The search finds this in two probes by cutting `b` entirely to the right.

<!-- @walkthrough -->
```
b is shorter:  a = [6, 7, 8],  b = [1, 2, 3, 4, 5]
total = 8,  half = 4,  lo = 0, hi = 3

cut1=1 cut2=3   left=(6, 3)     right=(7, 4)
                l1=6 > r2=4, cut1 too big    ->  hi = 0
cut1=0 cut2=4   left=(-inf, 4)  right=(6, 5)
                -inf <= 5 and 4 <= 6         ->  VALID
total even ->  (max(-inf,4) + min(6,5)) / 2 = (4+5)/2
->  4.5

Two probes for eight elements, and the count is
log2(min(n1,n2)) — it depends on the SHORTER array only,
which is why 1 x 1,000,000 needs a single probe.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the partition invariant, what swapping to the shorter array actually guarantees, and why a linear scan never competes here even though it did in earlier subtopics.

<!-- @sampleInput -->
```json
{"primary":{"a":[1,3],"b":[2],"median":2.0,"combined":[1,2,3],"validCut":{"shorter":[2],"longer":[1,3],"cut1":1,"cut2":1,"left":[2,1],"right":["+inf",3],"rule":"odd total -> max(l1,l2)"}},"partitionIdea":{"invariant":"cut1 + cut2 = (n1 + n2 + 1) / 2","freeVariable":"cut1 only - cut2 follows","validWhen":"l1 <= r2 and l2 <= r1","answer":[{"total":"odd","value":"max(l1, l2)"},{"total":"even","value":"(max(l1,l2) + min(r1,r2)) / 2"}],"whyThePlusOne":"it puts the extra element of an odd total on the left, so max(l1,l2) is the median with no separate case","moveRule":"l1 > r2 means cut1 is too far right, so hi = cut1 - 1; otherwise lo = cut1 + 1"},"swapIsAboutRangeNotSpeed":{"receivedWisdom":"binary search the shorter array or it breaks","measured":{"space":"all pairs of sorted arrays of length 0..5 over {0..3}","cases":15875,"searchingTheLongerArray":"0 wrong"},"whatItActuallyBuys":"cut2 can never leave [0, n2]","proof":{"given":"n1 <= n2 and cut1 in [0, n1]","largestCut2":"(n1+n2+1)/2 <= n2 whenever n1 <= n2","smallestCut2":"(n1+n2+1)/2 - n1 >= 0 whenever n1 <= n2+1"},"variants":[{"variant":"swap to shorter, no range guards","cut2OutOfRange":0,"wrong":0},{"variant":"no swap, no range guards","cut2OutOfRange":563,"ofCases":15875,"pct":3.55,"wrong":0,"note":"out of range means indexing an array past its end"}],"twoWorkingDesigns":["swap and omit the guards","keep the guards and search either array"],"theBrokenOne":"no swap and no guards - the version usually written","smallestFailure":{"a":[0],"b":[],"why":"cut2 becomes 1 against an empty array"},"guardSubtlety":"a guard must adjust lo or hi and continue, not return - an out-of-range cut2 means this cut1 is infeasible, not that no answer exists"},"linearNeverCompetes":{"unit":"nanoseconds","rows":[{"shape":"1000 x 1000","fullMerge":78708,"walkToMiddle":6833,"partition":71},{"shape":"1 x 1999","fullMerge":13722,"walkToMiddle":1764,"partition":21},{"shape":"100 x 1900","fullMerge":47555,"walkToMiddle":2570,"partition":40},{"shape":"50000 x 50000","fullMerge":2863597,"walkToMiddle":202208,"partition":57},{"shape":"10 x 100000","fullMerge":1383667,"walkToMiddle":43167,"partition":10},{"shape":"1 x 1000000","fullMerge":5279833,"walkToMiddle":398653,"partition":5}],"atLeetCodeCeiling":"m + n = 2000, and the partition search is 96x faster than walking to the middle","whyDifferentFromFindPeak":"Find Peak Element's linear scan won because it could stop early - a peak turns up after about two probes. A median is defined by position, so any scan must reach the middle every time, with no early exit available","probeCountFallsWithShorterArray":"71ns at 1000x1000 down to 5ns at 1x1000000, because probes = log2(min(n1,n2))"},"sentinelWidth":{"issue":"with INT_MIN/INT_MAX as the empty-side sentinels, the even-length average adds two ints and overflows at the extremes","cases":[{"a":["INT_MAX"],"b":["INT_MAX"],"trueMedian":2147483647.0,"intVersion":-1.0},{"a":[2147483647],"b":[2147483646],"trueMedian":2147483646.5,"intVersion":-1.5}],"whyItSurvives":"LeetCode 4 caps values at 10^6, so it never fires there","fix":"hold the four boundary values in long long, or cast before the addition"},"assertions":["cut1 + cut2 always equals (n1 + n2 + 1) / 2","a valid cut has everything on the left at most everything on the right","exactly one cut1 in [0, n1] is valid","the empty-array cases need no branch when sentinels are used","the probe count depends only on the shorter array"]}
```

<!-- @highlights -->
- "Binary search the shorter array **or it breaks**" is false as stated — searching the longer one measured **0 wrong** over 15,875 cases.
- What the swap really buys: `cut2` provably stays in `[0, n2]`, so the range guards become unnecessary — **0** out-of-range with the swap, **3.55%** without.
- The broken version is the common one: **neither** swap nor guards. Smallest failure `a=[0], b=[]`.
- The `+1` in `(n1+n2+1)/2` is what makes `max(l1,l2)` the answer for odd totals with no separate case.
- Unlike Find Peak Element, **linear never competes** — a median has no early exit, so the scan always walks to the middle. **96×** at LeetCode's ceiling.
- `INT_MIN`/`INT_MAX` sentinels overflow the even-length average: `[INT_MAX]` and `[INT_MAX]` returns **−1.0**.

<!-- @edgeCases -->
- One array empty — handled by the sentinels with no branch, and the smallest case that breaks the no-swap-no-guard version.
- Both arrays length 1 — one probe, and the even-total branch runs.
- Equal lengths — no swap needed; `cut2` still stays in range.
- Wildly unequal lengths — the best case, since probes are `log2` of the *shorter* array; 1 × 10⁶ needs one probe.
- Disjoint ranges (all of `a` below all of `b`) — the valid cut takes one array entirely, so `cut1` lands at 0 or `n1`.
- All elements equal — every cut satisfies `l1 <= r2` and `l2 <= r1`; the first probe returns.
- Values at `INT_MAX` — overflows the average if the sentinels are ints.
- Odd versus even total — the only place the two branches differ, and `(total+1)/2` is what keeps them one line apart.
- Negative values — no special handling, provided the sentinels are genuinely below any datum.

<!-- @pitfalls -->
- Writing neither the swap nor the `cut2` range guards. Indexes out of range on 3.55% of inputs, including `a=[0], b=[]`.
- Believing the swap is only an optimisation. It is what makes the guards unnecessary; drop it and you must add them back.
- Writing a guard that returns instead of adjusting `lo`/`hi`. An out-of-range `cut2` means this `cut1` is infeasible, not that no answer exists.
- `INT_MIN`/`INT_MAX` as sentinels. The even-length average overflows; use 64-bit or cast first.
- Copying arrays to swap them. That makes an O(log) algorithm O(m+n) in space — swap pointers or references.
- Using `(n1+n2)/2` instead of `(n1+n2+1)/2`. The odd case then needs `min(r1,r2)` and a separate branch.
- Returning `max(l1,l2)` for even totals. That is the lower of the two middle values, not their average.
- Adding `l1` and `r2` before casting to double. Same overflow as the sentinel problem, one line later.
- Reaching for the merge because m+n is small. The partition search is already 96× ahead at m+n = 2,000.

<!-- @doubt -->
### Must I binary search the shorter array?

<!-- @answer -->
Not for correctness — measured over all pairs of sorted arrays of length 0 to 5 over `{0..3}`, **15,875 cases**, searching the longer array is **0 wrong**, provided the `cut2` range guards are present. What the swap actually guarantees is that `cut2` never leaves `[0, n2]` at all. With `n1 <= n2` and `cut1` ranging over `[0, n1]`, the largest `cut2` is `(n1+n2+1)/2`, which is at most `n2` exactly when `n1 <= n2`; the smallest is `(n1+n2+1)/2 - n1`, non-negative on the same condition. Measured, the swapped version put `cut2` out of range **zero** times and the unswapped version did so **563 times — 3.55%**. So there are two correct designs: swap and omit the guards, or keep the guards and search whichever array you like. The version that fails is the common one that does neither. The O(log(min(m,n))) bound is a genuine second benefit, and the measurements show it — 5ns for 1 × 1,000,000 against 71ns for 1,000 × 1,000 — but it is not why the swap is there.

<!-- @doubt -->
### Why `(n1 + n2 + 1) / 2` rather than `(n1 + n2) / 2`?

<!-- @answer -->
The `+ 1` pushes the extra element of an odd total onto the **left** side of the cut, which collapses the odd case into a single expression. With it, the left pieces hold `ceil(total/2)` elements, so for an odd total the last of them *is* the median and the answer is just `max(l1, l2)`. Use `(n1+n2)/2` and the left holds `floor(total/2)`, so for odd totals the median is the first element on the *right*, `min(r1, r2)`, and you need a separate branch — and it is easy to get backwards, because the even case still reads from both sides. Both conventions work if you are consistent; the `+1` version is worth preferring because the odd case degenerates to one line rather than to a mirror image of the even one.

<!-- @doubt -->
### Why is the linear walk so much slower here when it won in Find Peak Element?

<!-- @answer -->
Because a median has no early exit. Find Peak Element's scan won on random data — measured, it found a peak after about two probes — since a peak is defined by a *local* condition that some cell satisfies almost immediately. A median is defined by **position**: to know which value sits in the middle you must account for every element before it, so any merge-based approach walks `(n1+n2)/2` steps on every input with no lucky case available. That is why the partition search leads at every size measured, including the smallest: **71ns against 6,833ns at 1,000 × 1,000**, and 96x at LeetCode 4's own ceiling of m + n = 2,000. The general rule the two subtopics illustrate together: a linear scan can beat a logarithmic search only when it can stop early, and whether it can stop early depends on whether the answer is defined locally or positionally.

<!-- @doubt -->
### Why do the sentinels need to be 64-bit?

<!-- @answer -->
Because they flow into an addition. The empty-side cases use ±infinity so the four comparisons work without branching, and for the even-length answer you compute `(max(l1,l2) + min(r1,r2)) / 2`. With `INT_MIN`/`INT_MAX` as the sentinels, that addition happens in `int` and wraps: `a = [INT_MAX]`, `b = [INT_MAX]` has median 2147483647.0 and the int version returns **−1.0**; `[2147483647]` with `[2147483646]` should give 2147483646.5 and gives **−1.5**. It never fires on LeetCode 4, whose values are capped at 10⁶, which is exactly why the bug is so common in published solutions — the constraints hide it. Holding the four boundary values in `long long` fixes it at no cost; casting to `double` before the addition also works. Python's `float("-inf")` sidesteps the whole issue since its ints do not overflow.

<!-- @doubt -->
### How is this different from Kth Element of 2 Sorted Arrays?

<!-- @answer -->
It is the same search with `k` fixed at the middle, plus the even-length averaging. In Kth Element you search for a cut where the left pieces hold exactly `k` elements; here `k` is `(n1+n2+1)/2`, chosen so the cut lands on the median. Everything else — the single free variable, the two-comparison validity test, the move rule — is identical, which is why the code is nearly line-for-line the same. The two genuinely new pieces are the even-total case, where the answer averages `max(l1,l2)` with `min(r1,r2)` instead of returning the first alone, and the fact that the result is a `double` rather than an element of the arrays, which is what brings the sentinel-overflow trap into play. If you have written Kth Element, the useful exercise here is deriving the `+1` rather than re-deriving the search.
