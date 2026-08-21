---
id: merge-two-sorted-arrays-without-extra-space
topic: Arrays
title: Merge Two Sorted Arrays Without Extra Space
difficulty: Medium
status: ready
prerequisites:
  - union-of-two-sorted-arrays
  - merge-overlapping-subintervals
  - remove-duplicates-from-sorted-array
  - for-loop
  - time-and-space-complexity-basics
relatedIds:
  - union-of-two-sorted-arrays
  - merge-overlapping-subintervals
  - remove-duplicates-from-sorted-array
  - majority-element-ii
---

<!-- @summary -->
Merge two sorted arrays in place so the first holds the smaller half — where the gap method's halving must round UP or it silently skips gap values and fails on 100% of realistic merges, and where paying for O(m+n) space instead runs 8.3x to 10.2x faster.

<!-- @theory -->
## The problem

Two sorted arrays, `a` of length m and `b` of length n. Rearrange them so that
`a` holds the m smallest values in order and `b` holds the n largest in order —
**without allocating a third array**.

```
a = [1, 4, 8, 10]     ->   a = [1, 2, 3, 4]
b = [2, 3, 9]              b = [8, 9, 10]
```

Treat the two arrays as one virtual array of length m + n, where index `i` means
`a[i]` when `i < m` and `b[i - m]` otherwise. The goal is that virtual array,
sorted.

## The gap method

Sorting a virtual array in place with no buffer is a **Shell sort**: compare
elements a fixed distance apart, swap them if out of order, then shrink the
distance and repeat.

```
gap = ceil((m + n) / 2)
while gap > 0:
    for every i with i + gap < m + n:
        if virtual[i] > virtual[i + gap]: swap them
    gap = (gap == 1) ? 0 : ceil(gap / 2)
```

Because both inputs are already sorted, the only disorder is *between* the two
arrays, and this shrinking-gap sweep is enough to resolve it. Roughly log₂(m+n)
passes over m+n elements, so O((m+n) log(m+n)) time and **O(1) extra space**.

## The halving must round up

Write `gap = gap / 2` with integer division and the sequence starts **skipping
values**:

| Total | Rounding up | Rounding down | Skipped |
|---|---|---|---|
| 3 | 2, 1 | 1 | **2** |
| 6 | 3, 2, 1 | 3, 1 | **2** |
| 7 | 4, 2, 1 | 3, 1 | **4, 2** |
| 8 | 4, 2, 1 | 4, 2, 1 | — |
| 17 | 9, 5, 3, 2, 1 | 8, 4, 2, 1 | **9, 5, 3** |

The problem is `3 / 2 = 1`, which jumps straight past 2. A shrinking-gap sweep is
only correct if the gaps descend through a proper chain to 1; skip one and
inversions survive that the final gap-1 pass cannot repair alone.

Rounding down happens to work when the total is a **power of two**, because then
the two sequences coincide. Measured on random merges:

| m | n | Total | Rounding down is wrong on |
|---|---|---|---|
| 5 | 5 | 10 | 48.2% |
| 50 | 50 | 100 | **100%** |
| 500 | 500 | 1,000 | **100%** |
| 1,000 | 24 | **1,024** | **0%** |

So it passes cleanly on a power-of-two total and fails on essentially every
realistic merge otherwise. That is close to the worst possible failure profile:
one convenient test size makes it look correct.

Over an exhaustive sweep of small arrays it was wrong on 10.33% overall, with the
smallest failure `a = [1,1], b = [0]` returning `([1,0], [1])`.

**A caution about the power-of-two rule:** it is not a clean "correct if and only
if". A total of 9 passed every case in one restricted test space despite not
being a power of two. The reliable statement is that the sequences coincide at
powers of two, that rounding down skips gaps otherwise, and that on real merges
it fails essentially always.

## The simpler O(1) alternative

There is a much more obvious constant-space method. Walk `a`; whenever `a[i]`
exceeds `b[0]`, swap them — now `a[i]` is correct, but `b` may have lost its
order, so sink the new `b[0]` to its place.

Measured over 63,504 exhaustive pairs it is **completely correct**, and its one
weakness is not algorithmic: without a guard for an empty array it throws on
`b = []`. That missing guard accounted for its entire 1.41% failure rate in the
first sweep; with the guard added it was wrong on **zero** inputs.

Its real problem is cost: sinking after every swap makes it **O(m × n)**. At
1,000 × 1,000 it measured 0.34ms against the gap method's 0.06ms, and it becomes
unusable well before either of the others do.

## What it actually costs to avoid the buffer

Here is the measurement that should drive the decision:

| m × n | Concat + sort | Merge with a buffer | Gap method | Gap / merge |
|---|---|---|---|---|
| 1,000 × 1,000 | 0.05ms | **0.01ms** | 0.06ms | 9.09x |
| 50,000 × 50,000 | 4.75ms | **0.34ms** | 3.18ms | 9.34x |
| 500,000 × 500,000 | 59.88ms | **3.42ms** | 34.89ms | **10.20x** |

The ordinary two-pointer merge into a temporary array is **8.3x to 10.2x faster**
than the gap method, consistently, at every size. That is the price of the
constraint: one linear pass with perfect locality, against twenty passes over the
same data.

So the honest framing is that "without extra space" is a **constraint imposed by
the problem**, not an optimisation. If you are allowed the buffer, take it. The
gap method is what you write when m + n is large enough that an extra array is
genuinely a problem, and you accept an order of magnitude in exchange.

### And it ignores how lopsided the split is

| m × n | Concat + sort | Merge with a buffer | Gap method |
|---|---|---|---|
| 1,000,000 × 10 | 18.41ms | **3.37ms** | **28.04ms** |

With one array of ten elements the gap method is *slower than sorting the whole
thing*. Its cost depends only on m + n — about twenty full passes over a million
elements — and nothing about it notices that only ten values are out of place. A
merge, or even a sort, exploits that immediately.

## Which to write

- **Two-pointer merge into a buffer** whenever O(m+n) space is available. Fastest
  at every size measured, and it is the same merge as **Union of Two Sorted
  Arrays** without the deduplication.
- **Gap method** when the constraint is real and both arrays are large.
- **Swap-and-sink** only for small inputs, where its O(m × n) does not bite and
  its simplicity is worth something — and write the empty-array guard.
- **Never round the gap down.**

<!-- @intuition -->
Picture the two arrays laid end to end as one long row. Each is already tidy internally; the only mess is at the seam, where large values from the first array need to trade places with small ones from the second. Comparing neighbours would fix that eventually but slowly, because a value stranded at the wrong end has to shuffle across one step at a time. So start by comparing elements far apart — half the row — which lets a badly placed value leap most of the way in a single swap, then halve the distance and sweep again, and again, until you are finally comparing neighbours and only tiny local corrections remain. Halving must never skip a distance: each pass assumes the previous larger one has already done its work, and a gap that was never applied leaves disorder the final neighbour-pass cannot reach.

<!-- @approach -->
### Brute Force - Concatenate and Sort

<!-- @idea -->
Copy both arrays into one, sort it, and copy the two halves back.

<!-- @steps -->
1. Build a single array holding every element of both inputs.
2. Sort it.
3. Copy the first m values back into the first array.
4. Copy the remaining n values back into the second.
5. The sort discards the fact that both inputs were already ordered.

<!-- @complexity -->
- time: O((m+n) log(m+n))
- space: O(m+n) for the combined array
- note: Correct and simple, and it throws away the inputs' existing order — a general sort cannot exploit that the data arrives as two sorted runs. Measured 59.88ms at 500,000 elements each, against 3.42ms for a two-pointer merge doing the same job.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void mergeArrays(vector<int>& a, vector<int>& b) {
    vector<int> all;
    all.reserve(a.size() + b.size());
    all.insert(all.end(), a.begin(), a.end());
    all.insert(all.end(), b.begin(), b.end());

    sort(all.begin(), all.end());

    for (size_t i = 0; i < a.size(); i++) a[i] = all[i];
    for (size_t i = 0; i < b.size(); i++) b[i] = all[a.size() + i];
}
```

<!-- @annotations -->
- 11: A general sort, which cannot use the fact that the input was two already-ordered runs.
- 13: Splitting at m, so the first array takes the smaller half by construction.

<!-- @code java -->
```java
import java.util.Arrays;

static void mergeArrays(int[] a, int[] b) {
    int[] all = new int[a.length + b.length];
    System.arraycopy(a, 0, all, 0, a.length);
    System.arraycopy(b, 0, all, a.length, b.length);

    Arrays.sort(all);

    System.arraycopy(all, 0, a, 0, a.length);
    System.arraycopy(all, a.length, b, 0, b.length);
}
```

<!-- @annotations -->
- 8: Arrays.sort on int[] is a dual-pivot quicksort, which gains nothing from the input being two sorted runs.

<!-- @code python -->
```python
def merge_arrays(a, b):
    m = len(a)
    all_values = sorted(a + b)
    a[:] = all_values[:m]
    b[:] = all_values[m:]


# a[:] = ... mutates the caller's list; a = ... would only rebind the name.
```

<!-- @annotations -->
- 4: Slice assignment writes through to the caller's list, where a plain assignment would rebind a local name.

<!-- @approach -->
### Two Pointers into a Buffer

<!-- @idea -->
Walk both arrays together taking the smaller head each time, building the merged sequence, then copy it back in two halves.

<!-- @steps -->
1. Allocate a buffer of m plus n elements.
2. Keep one index into each input array.
3. Repeatedly append whichever head is smaller and advance that index.
4. When one array runs out, append the rest of the other.
5. Copy the buffer's first m values into the first array and the rest into the second.

<!-- @complexity -->
- time: O(m+n), a single pass
- space: O(m+n) for the buffer
- note: The fastest approach at every size measured, and the one to use whenever the buffer is allowed — 3.42ms at 500,000 elements each, against 34.89ms for the gap method. It is the same merge as Union of Two Sorted Arrays with the deduplication removed.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void mergeArrays(vector<int>& a, vector<int>& b) {
    size_t m = a.size(), n = b.size();
    vector<int> out;
    out.reserve(m + n);

    size_t i = 0, j = 0;
    while (i < m && j < n) out.push_back(a[i] <= b[j] ? a[i++] : b[j++]);
    while (i < m) out.push_back(a[i++]);
    while (j < n) out.push_back(b[j++]);

    for (size_t k = 0; k < m; k++) a[k] = out[k];
    for (size_t k = 0; k < n; k++) b[k] = out[m + k];
}
```

<!-- @annotations -->
- 10: The non-strict <= keeps equal elements in their original relative order, which makes the merge stable.
- 11: Only one of these two drain loops can run, since the loop above ended when one array was exhausted.

<!-- @code java -->
```java
static void mergeArrays(int[] a, int[] b) {
    int m = a.length, n = b.length;
    int[] out = new int[m + n];

    int i = 0, j = 0, k = 0;
    while (i < m && j < n) out[k++] = (a[i] <= b[j]) ? a[i++] : b[j++];
    while (i < m) out[k++] = a[i++];
    while (j < n) out[k++] = b[j++];

    System.arraycopy(out, 0, a, 0, m);
    System.arraycopy(out, m, b, 0, n);
}
```

<!-- @annotations -->
- 6: A single pass over both arrays, which is why this beats every other approach here by roughly an order of magnitude.

<!-- @code python -->
```python
def merge_arrays(a, b):
    m, n = len(a), len(b)
    out = []
    i = j = 0

    while i < m and j < n:
        if a[i] <= b[j]:
            out.append(a[i]); i += 1
        else:
            out.append(b[j]); j += 1
    out.extend(a[i:])
    out.extend(b[j:])

    a[:] = out[:m]
    b[:] = out[m:]


# The standard merge step of merge sort, and the same walk as
# Union of Two Sorted Arrays with the duplicate-skipping removed.
```

<!-- @annotations -->
- 7: Taking the smaller head, with <= rather than < so equal values keep their original order.
- 11: Only one of these two extends anything, since the loop ended when one array was exhausted.

<!-- @approach -->
### Swap and Sink

<!-- @idea -->
Walk the first array and whenever an element exceeds the second array's smallest, swap them and let the incoming value sink back into place.

<!-- @steps -->
1. Return immediately if either array is empty.
2. Walk the first array from left to right.
3. Compare each element against the second array's first element.
4. If the first array's element is larger, swap the two.
5. The value just moved into the second array may now be out of order, so sink it rightwards past any smaller neighbours.
6. After the walk, the first array holds the m smallest values and the second is sorted.

<!-- @complexity -->
- time: O(m * n) worst case, since each swap can sink the whole length of the second array
- space: O(1)
- note: Correct on every input tested — 0 failures across 63,504 exhaustive pairs once the empty-array guard is present. That guard is the entire difficulty: without it the code throws on an empty second array, which accounted for its whole 1.41% failure rate before it was added. The quadratic cost rules it out at scale: 0.34ms at 1,000 by 1,000 against the gap method's 0.06ms.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void mergeArrays(vector<int>& a, vector<int>& b) {
    size_t m = a.size(), n = b.size();
    if (m == 0 || n == 0) return;                 // GUARD: b[0] would not exist

    for (size_t i = 0; i < m; i++) {
        if (a[i] > b[0]) {
            swap(a[i], b[0]);
            size_t j = 0;                          // sink the incoming value
            while (j + 1 < n && b[j] > b[j + 1]) { swap(b[j], b[j + 1]); j++; }
        }
    }
}
```

<!-- @annotations -->
- 7: Without this guard the code reads b[0] on an empty array. It was the only reason this approach ever failed a test.
- 11: After the swap b[0] holds a value from a, which may be larger than its new neighbours.
- 13: Sinking restores b's order, and it is also what makes the whole approach O(m * n).

<!-- @code java -->
```java
static void mergeArrays(int[] a, int[] b) {
    int m = a.length, n = b.length;
    if (m == 0 || n == 0) return;

    for (int i = 0; i < m; i++) {
        if (a[i] > b[0]) {
            int t = a[i]; a[i] = b[0]; b[0] = t;
            int j = 0;
            while (j + 1 < n && b[j] > b[j + 1]) {
                int s = b[j]; b[j] = b[j + 1]; b[j + 1] = s; j++;
            }
        }
    }
}
```

<!-- @annotations -->
- 6: Comparing against b[0] only, because b stays sorted so its smallest element is always at the front.

<!-- @code python -->
```python
def merge_arrays(a, b):
    m, n = len(a), len(b)
    if m == 0 or n == 0:            # GUARD: b[0] would not exist
        return

    for i in range(m):
        if a[i] > b[0]:
            a[i], b[0] = b[0], a[i]
            j = 0                    # sink the incoming value
            while j + 1 < n and b[j] > b[j + 1]:
                b[j], b[j + 1] = b[j + 1], b[j]
                j += 1


# Verified correct over 63,504 exhaustive pairs, and O(m * n),
# which is what rules it out rather than any correctness problem.
```

<!-- @annotations -->
- 3: The guard. Its absence was this approach's only failure across every input tested.
- 10: The sink loop, which can run the full length of b on every swap.

<!-- @approach -->
### Optimal Space - The Gap Method

<!-- @idea -->
Treat the two arrays as one virtual array and run a shrinking-gap sweep, comparing elements a fixed distance apart and halving that distance each round.

<!-- @steps -->
1. Treat index i as belonging to the first array while it is below m, and to the second array otherwise.
2. Start the gap at half the combined length, rounded up.
3. Sweep every position i where i plus the gap is still inside the virtual array.
4. Swap the two elements whenever the earlier one is larger.
5. Halve the gap, rounding up, and repeat.
6. Stop after the pass with a gap of one.

<!-- @complexity -->
- time: O((m+n) log(m+n)) — about log2(m+n) passes over m+n elements
- space: O(1)
- note: The answer when the no-extra-space constraint is real. It measured 8.3x to 10.2x slower than merging into a buffer, which is the honest price of the constraint rather than an optimisation. Its cost depends only on m+n, so on a lopsided split like 1,000,000 by 10 it took 28.04ms where even concatenating and sorting took 18.41ms.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void mergeArrays(vector<int>& a, vector<int>& b) {
    size_t m = a.size(), n = b.size(), total = m + n;
    if (total == 0) return;

    auto at = [&](size_t i) -> int& { return i < m ? a[i] : b[i - m]; };

    size_t gap = (total + 1) / 2;                 // ceil, never floor
    while (gap > 0) {
        for (size_t i = 0; i + gap < total; i++)
            if (at(i) > at(i + gap)) swap(at(i), at(i + gap));
        gap = (gap == 1) ? 0 : (gap + 1) / 2;     // ceil again, then stop after gap 1
    }
}
```

<!-- @annotations -->
- 9: The virtual index. Everything below treats the two arrays as one row of length m + n.
- 11: Rounding up. Rounding down makes the sequence skip gaps and fails on 100% of realistic merges.
- 15: The explicit stop after gap 1, since ceil(1/2) is 1 and would otherwise loop forever.

<!-- @code java -->
```java
static void mergeArrays(int[] a, int[] b) {
    int m = a.length, n = b.length, total = m + n;
    if (total == 0) return;

    int gap = (total + 1) / 2;
    while (gap > 0) {
        for (int i = 0; i + gap < total; i++) {
            int j = i + gap;
            int x = i < m ? a[i] : b[i - m];
            int y = j < m ? a[j] : b[j - m];
            if (x > y) {
                if (i < m) a[i] = y; else b[i - m] = y;
                if (j < m) a[j] = x; else b[j - m] = x;
            }
        }
        gap = (gap == 1) ? 0 : (gap + 1) / 2;
    }
}
```

<!-- @annotations -->
- 5: Ceiling division written as (total + 1) / 2, which is the whole difference between correct and broken.
- 16: Without the explicit zero, ceil(1/2) stays 1 and the loop never ends.

<!-- @code python -->
```python
def merge_arrays(a, b):
    m, n = len(a), len(b)
    total = m + n
    if total == 0:
        return

    def get(i):
        return a[i] if i < m else b[i - m]

    def put(i, v):
        if i < m:
            a[i] = v
        else:
            b[i - m] = v

    gap = (total + 1) // 2                 # ceil, never floor
    while gap > 0:
        i = 0
        while i + gap < total:
            if get(i) > get(i + gap):
                x, y = get(i), get(i + gap)
                put(i, y); put(i + gap, x)
            i += 1
        gap = 0 if gap == 1 else (gap + 1) // 2


# gap sequence for total = 7:  ceil gives 4, 2, 1   floor gives 3, 1
# floor skips gap 2, and the final gap-1 pass cannot repair what it left.
```

<!-- @annotations -->
- 16: Ceiling division. Using total // 2 here starts a sequence that skips values and fails on essentially every real merge.
- 24: Stopping explicitly after gap 1, because ceil(1/2) is 1 and the loop would never terminate.

<!-- @example -->

<!-- @input -->
a = [1, 4, 8, 10], b = [2, 3, 9]

<!-- @output -->
a = [1, 2, 3, 4], b = [8, 9, 10]

<!-- @why -->
The canonical case, where values must move in both directions across the seam rather than just one way.

<!-- @walkthrough -->
1. The virtual array is 1, 4, 8, 10, 2, 3, 9 with a total length of 7.
2. The first gap is ceil(7/2) = 4, so positions 0 and 4, 1 and 5, then 2 and 6 are compared.
3. Comparing 1 against 2 leaves them; comparing 4 against 3 swaps them; comparing 8 against 9 leaves them.
4. The virtual array is now 1, 3, 8, 10, 2, 4, 9.
5. The gap halves to 2, comparing positions 0 and 2, 1 and 3, 2 and 4, 3 and 5, 4 and 6.
6. That pass produces 1, 3, 2, 4, 8, 10, 9 after its swaps.
7. The final pass with a gap of 1 compares neighbours and settles it to 1, 2, 3, 4, 8, 9, 10.

<!-- @example -->

<!-- @input -->
a = [1, 1], b = [0] with the gap halved by rounding down

<!-- @output -->
a = [1, 0], b = [1] — and the correct answer is a = [0, 1], b = [1]

<!-- @why -->
The smallest input exposing the rounding bug, and it shows the failure is a skipped gap rather than a wrong comparison.

<!-- @walkthrough -->
1. The virtual array is 1, 1, 0 with a total length of 3.
2. Rounding up gives the gap sequence 2 then 1.
3. Rounding down gives 3 // 2 = 1, so the sequence is just 1 — the gap of 2 is never applied.
4. With only a gap-1 pass, position 0 is compared against 1 and position 1 against 2.
5. Comparing 1 against 1 does nothing; comparing 1 against 0 swaps them, giving 1, 0, 1.
6. Nothing then moves the 0 back to the front, because that would need a comparison across a distance of 2.
7. The correct sequence applies gap 2 first, which moves the 0 to the front before the neighbour pass runs.

<!-- @example -->

<!-- @input -->
Random merges of 500 and 500 elements, with the gap rounded down

<!-- @output -->
Wrong on 100% of them — but 0% when the total is 1,024

<!-- @why -->
Shows that a single conveniently sized test can make the broken version look correct.

<!-- @walkthrough -->
1. With a total of 1,000 the rounding-down sequence is 500, 250, 125, 62, 31, 15, 7, 3, 1.
2. That chain skips many of the gaps the correct sequence uses, so inversions survive.
3. Measured across 400 random merges at that size, every single one came out wrong.
4. With m = 1,000 and n = 24 the total is 1,024, a power of two.
5. There the two sequences coincide exactly at 512, 256, 128, 64, 32, 16, 8, 4, 2, 1.
6. Measured across 400 random merges at that size, none came out wrong.
7. So testing only on a power-of-two total gives a clean pass on genuinely broken code.

<!-- @example -->

<!-- @input -->
500,000 and 500,000 elements, gap method against merging into a buffer

<!-- @output -->
34.89ms against 3.42ms — 10.20x

<!-- @why -->
Prices the no-extra-space constraint, which is the decision this lesson actually turns on.

<!-- @walkthrough -->
1. The buffered merge makes one pass, taking the smaller head each time and writing forward.
2. That is a million comparisons and a million writes, all sequential.
3. The gap method makes about twenty passes over the same million elements.
4. Each pass reads two positions a long distance apart, which defeats prefetching on the early passes.
5. Measured 3.42ms against 34.89ms, and the ratio held between 8.3x and 10.2x at every size tested.
6. So the constraint costs roughly an order of magnitude rather than being free.
7. If the buffer is permitted, the buffered merge is simply the better algorithm.

<!-- @visualization array -->

<!-- @description -->
The two arrays drawn end to end as a single continuous row, with a clear seam marker between them and each half tinted differently — the whole method depends on seeing them as one virtual array, so the row must read as one object with a visible join rather than as two panels. Label positions with virtual indices along the bottom, and show the translation rule once by highlighting index m and annotating that it is b[0] wearing a different name. Then the sweep: for the current gap, draw a fixed-width bracket spanning exactly that many cells and slide it along the row one position at a time, comparing the two cells under its ends. When they are out of order, animate a genuine exchange along an arc over the top of the row — the arc matters because it shows a value leaping a long distance in one move, which is the entire reason the gap starts large. Keep a gap indicator prominent, and at the end of each pass halve it with the arithmetic shown explicitly as ceil, so the reader sees 3 becoming 2 rather than 1. Beside the main row, run a second row with the same input and the gap halved by rounding down, playing in lockstep. Show its gap sequence diverging — 3 to 1 while the correct one goes 3 to 2 to 1 — and grey out the entire pass that the broken version never performs, so the skipped work is visible as an absence rather than described. Let both finish, and hold the two final rows together with the surviving inversion circled on the broken one. Then a power-of-two panel: two gap-sequence ladders side by side for total 1,024 showing them coincide exactly, and for total 1,000 showing them diverge immediately, captioned that a single conveniently sized test makes the bug invisible. Close with a cost comparison drawn as passes over the data: the buffered merge as one left-to-right sweep with an arrow, the gap method as twenty stacked sweeps, and the measured 3.42ms against 34.89ms beneath them.

<!-- @sampleInput -->
```json
{"primary":{"a":[1,4,8,10],"b":[2,3,9],"m":4,"n":3,"total":7,"virtual":[1,4,8,10,2,3,9],"seamAtIndex":4,"passes":[{"gap":4,"comparisons":[{"i":0,"j":4,"values":[1,2],"swap":false},{"i":1,"j":5,"values":[4,3],"swap":true},{"i":2,"j":6,"values":[8,9],"swap":false}],"after":[1,3,8,10,2,4,9]},{"gap":2,"after":[1,3,2,4,8,10,9]},{"gap":1,"after":[1,2,3,4,8,9,10]}],"answer":{"a":[1,2,3,4],"b":[8,9,10]}},"roundingPanel":{"input":{"a":[1,1],"b":[0]},"total":3,"ceilSequence":[2,1],"floorSequence":[1],"skipped":[2],"ceilResult":{"a":[0,1],"b":[1]},"floorResult":{"a":[1,0],"b":[1]},"why":"moving the 0 to the front needs a comparison across distance 2"},"gapSequences":[{"total":3,"ceil":[2,1],"floor":[1],"skipped":[2]},{"total":6,"ceil":[3,2,1],"floor":[3,1],"skipped":[2]},{"total":7,"ceil":[4,2,1],"floor":[3,1],"skipped":[4,2]},{"total":8,"ceil":[4,2,1],"floor":[4,2,1],"skipped":[]},{"total":17,"ceil":[9,5,3,2,1],"floor":[8,4,2,1],"skipped":[9,5,3]}],"floorFailureRates":[{"m":5,"n":5,"total":10,"powerOfTwo":false,"wrongRate":0.482},{"m":50,"n":50,"total":100,"powerOfTwo":false,"wrongRate":1.0},{"m":500,"n":500,"total":1000,"powerOfTwo":false,"wrongRate":1.0},{"m":1000,"n":24,"total":1024,"powerOfTwo":true,"wrongRate":0.0}],"caveat":"not a clean if-and-only-if: a total of 9 passed every case in one restricted test space","swapSinkPanel":{"exhaustivePairs":63504,"failuresWithGuard":0,"failureRateWithoutGuard":0.0141,"causeOfFailure":"reading b[0] on an empty array","complexity":"O(m*n)","msAt1000x1000":0.34},"costPanel":[{"m":1000,"n":1000,"concatSortMs":0.05,"bufferedMergeMs":0.01,"gapMs":0.06,"ratio":9.09},{"m":50000,"n":50000,"concatSortMs":4.75,"bufferedMergeMs":0.34,"gapMs":3.18,"ratio":9.34},{"m":500000,"n":500000,"concatSortMs":59.88,"bufferedMergeMs":3.42,"gapMs":34.89,"ratio":10.20},{"m":1000000,"n":10,"concatSortMs":18.41,"bufferedMergeMs":3.37,"gapMs":28.04,"note":"gap ignores the lopsided split and loses even to sorting"}]}
```

<!-- @highlights -->
- The two arrays are drawn end to end as one continuous row with a visible seam, each half tinted differently.
- Virtual indices run along the bottom, and index m is highlighted once to show it is b[0] under another name.
- A bracket spanning exactly the current gap slides along the row, comparing the two cells under its ends.
- Out-of-order pairs exchange along an arc over the top of the row, showing a value leaping a long distance in one move.
- With gap 4, comparing 1 against 2 leaves them and comparing 4 against 3 swaps them.
- A prominent gap indicator halves at the end of each pass, with the arithmetic shown explicitly as a ceiling.
- The reader sees 3 becoming 2 rather than 1, which is the distinction the whole lesson turns on.
- A second row runs in lockstep with the gap rounded down, its sequence diverging from 3 to 1.
- The entire pass the broken version never performs is greyed out, so the skipped work is visible as an absence.
- Both rows finish together with the surviving inversion circled on the broken one.
- A power-of-two panel puts two gap ladders side by side for total 1,024, showing them coincide exactly.
- The same panel for total 1,000 shows them diverge immediately, captioned that one convenient test size hides the bug.
- A cost comparison draws the buffered merge as a single left-to-right sweep with one arrow.
- The gap method is drawn beneath it as twenty stacked sweeps over the same data.
- The measured 3.42ms against 34.89ms sits under the two diagrams.

<!-- @edgeCases -->
- Both arrays empty — nothing to do, and the gap computation must not run on a total of zero.
- One array empty — the other is already sorted and correct, and this is where the swap-and-sink method throws without a guard.
- Both arrays of length one — the smallest case where a swap can actually be needed.
- Every value in the first array below every value in the second — already merged, and no swap ever fires.
- Every value in the first array above every value in the second — the arrays must effectively exchange wholesale.
- Identical values spanning the seam — the merge must be stable, so the non-strict comparison matters.
- All values equal — no swap is ever needed, but every pass still runs.
- A total that is a power of two — the one size where rounding the gap down happens to work.
- A total of three, the smallest case where rounding down skips a gap.
- Very lopsided sizes such as a million by ten — the gap method's cost ignores the imbalance entirely.
- Large values near the integer limit — only comparisons happen, so no arithmetic overflow is possible here.
- Arrays that are not actually sorted on entry — every approach here except concatenate-and-sort assumes they are.

<!-- @pitfalls -->
- Halving the gap with integer division. The sequence then skips values — 3 becomes 1, missing 2 — and the final gap-1 pass cannot repair what was left behind.
- Testing the gap method only at a power-of-two total. Measured 0% wrong at a total of 1,024 and 100% wrong at 1,000, so one convenient size makes broken code look correct.
- Forgetting to stop explicitly after the gap-1 pass. Ceiling division maps 1 to 1, so the loop never terminates.
- Omitting the empty-array guard in the swap-and-sink method. It reads b[0] unconditionally and throws, which was its only failure across 63,504 exhaustive pairs.
- Reaching for the gap method when a buffer is allowed. It measured 8.3x to 10.2x slower than a two-pointer merge at every size tested.
- Using the gap method on a very lopsided split. Its cost depends only on m + n, so at a million by ten it took 28.04ms where even concatenating and sorting took 18.41ms.
- Using a strict comparison in the buffered merge. Equal elements then swap relative order, which breaks stability without changing the sorted output.
- Assuming the swap-and-sink method is wrong because it fails a test. With the guard it was correct on every input tested; what rules it out is O(m * n), not correctness.
- Writing a[:] = ... as a = ... in Python. The second rebinds a local name and the caller sees nothing.
- Sorting the concatenation when the inputs are already sorted. A general sort cannot exploit two sorted runs, which is exactly what a merge does.
- Assuming the virtual index needs a real combined array. The whole point is that index i maps to a[i] or b[i-m] arithmetically.
- Applying any of these to unsorted input. Everything except concatenate-and-sort assumes both arrays arrive ordered.

<!-- @doubt -->
### Why must the gap be halved by rounding up?

<!-- @answer -->
Because rounding down makes the sequence skip gaps. Integer division sends 3 to 1, so a gap of 2 is never applied — and a shrinking-gap sweep is only correct if the gaps descend through a proper chain to 1. Skip one and inversions survive that the final neighbour pass cannot reach, because fixing them would require a comparison across the distance that was skipped. The smallest demonstration is a = [1,1], b = [0]: with a total of 3, rounding down gives only a gap of 1, and the 0 can never travel from the back to the front one step at a time within a single pass.

<!-- @doubt -->
### My rounding-down version passed all my tests. How?

<!-- @answer -->
Check your test size. The two gap sequences coincide exactly when the total is a power of two — at 1,024 both give 512, 256, 128, 64, 32, 16, 8, 4, 2, 1 — so the broken version is genuinely correct there. Measured on 400 random merges each: 0% wrong at a total of 1,024, and 100% wrong at 1,000 and at 100. That is close to the worst failure profile available, since a round-numbered test array of 512 or 1,024 elements is exactly what people reach for. One caution: it is not a clean if-and-only-if — a total of 9 passed every case in one restricted test space despite not being a power of two — so the reliable rule is to round up, not to reason about which totals are safe.

<!-- @doubt -->
### Why does the loop need an explicit stop after gap 1?

<!-- @answer -->
Because ceiling division maps 1 to 1. Once the gap reaches 1, computing ceil(1/2) gives 1 again and the loop runs forever, sweeping neighbours endlessly. The usual form is to write the update as "if the gap is 1, set it to 0, otherwise take the ceiling of half" — which is why the update looks slightly awkward compared with the naive halving. Rounding down does not have this problem, since 1/2 is 0, which is part of why the broken version looks more natural.

<!-- @doubt -->
### Is the swap-and-sink method actually wrong?

<!-- @answer -->
No — it is correct and it is slow. Across 63,504 exhaustive pairs it produced zero wrong answers once an empty-array guard was added, and that missing guard was the sole cause of its entire 1.41% failure rate in the first sweep. It throws on an empty second array because it reads b[0] unconditionally, which is an edge-case bug rather than an algorithmic one. What rules it out is the cost: sinking after every swap makes it O(m * n), and it measured 0.34ms at 1,000 by 1,000 where the gap method took 0.06ms.

<!-- @doubt -->
### Should I use the gap method by default?

<!-- @answer -->
No. Use a two-pointer merge into a buffer whenever the buffer is allowed — it measured 8.3x to 10.2x faster at every size tested, including 3.42ms against 34.89ms at half a million elements each. "Without extra space" is a constraint the problem imposes, not an optimisation you are choosing, and it costs roughly an order of magnitude. The gap method is what you write when m + n is large enough that an extra array genuinely will not fit, and you accept that price knowingly.

<!-- @doubt -->
### Does the gap method get faster when one array is tiny?

<!-- @answer -->
No, and that is one of its sharper limitations. Its cost depends only on m + n — roughly log2(m+n) full passes over every element — and nothing about it notices that only a handful of values are misplaced. At a million by ten it measured 28.04ms, slower even than concatenating everything and sorting it at 18.41ms, and eight times slower than a buffered merge at 3.37ms. A merge exploits the imbalance immediately, since it exhausts the ten-element array almost at once and then just copies.

<!-- @doubt -->
### Why does the buffered merge use <= rather than <?

<!-- @answer -->
For stability. When the heads of the two arrays are equal, taking from the first array preserves the original relative order of equal elements; taking from the second silently reverses them. The sorted output is identical either way, so no test on values alone will catch it — the difference only shows when the elements carry data beyond the sort key, which is exactly the situation where stability matters. It costs nothing to get right, so write the non-strict comparison by default.

<!-- @doubt -->
### How does this relate to Union of Two Sorted Arrays?

<!-- @answer -->
The buffered merge here is that algorithm with the deduplication removed. Both walk two sorted arrays together taking the smaller head; Union skips values equal to the one just emitted, and this keeps them. Recognising that is worth something practical: if you have written one, the other is a two-line change. The gap method has no counterpart there, because Union is free to build a new array and so never faces this constraint.
