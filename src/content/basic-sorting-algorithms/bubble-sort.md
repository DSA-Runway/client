---
id: bubble-sort
topic: Basic Sorting Algorithms
title: Bubble Sort
difficulty: Easy
status: ready
prerequisites:
  - selection-sort
  - nested-loops
  - for-loop
  - if-else-statements
  - time-and-space-complexity-basics
relatedIds:
  - selection-sort
  - insertion-sorting
  - count-inversions
  - nested-loops
---

<!-- @summary -->
Repeatedly sweep the array swapping out-of-order neighbours — where the swap count is exactly the inversion count with no exceptions in 123,293 arrays, and where one element in the wrong place costs 2 passes or 999 depending only on which direction it is wrong, the same 999 swaps buying 250x the comparisons.

<!-- @theory -->
## The problem

Sort an array in ascending order, in place, by comparing **adjacent** elements and
swapping them when they are out of order. Repeat until nothing needs swapping.

```
[5, 1, 4, 2]  ->  [1, 2, 4, 5]
```

Selection sort chose the smallest element and moved it a long way. Bubble sort
never moves anything more than one position at a time, and that single restriction
produces everything below.

## One sweep settles the maximum

Walk from left to right comparing `arr[j]` with `arr[j+1]`. Whenever the left one
is larger, swap. The effect is that the largest value encountered so far is always
being carried along in the right hand of the sweep, and it can only be put down
when something even larger displaces it — so by the end of the sweep, **the
maximum of the whole array is at the last position.**

That is the invariant: after pass `i`, `arr[n-1-i .. n-1]` holds the `i+1` largest
elements, in their final places.

Which gives the first refinement immediately. Those settled elements never need
comparing again, so pass `i` only has to sweep up to `n - 1 - i`. Leaving the bound
at `n - 1` is still **correct**, and it costs exactly `(n-1)²` comparisons against
`n(n-1)/2` — a factor of **2.0** at every size. At n = 1,000 that is 998,001
against 499,500.

## Every swap removes exactly one inversion

An **inversion** is a pair of positions `i < j` where `arr[i] > arr[j]` — the same
quantity **Count Inversions** measures. Bubble sort only ever swaps adjacent
out-of-order elements, and swapping two adjacent elements changes the relative
order of exactly that one pair and no other. So each swap destroys precisely one
inversion, and the array is sorted when none remain.

**The total number of swaps is therefore exactly the number of inversions in the
input.** Not approximately — exactly.

Verified three ways with zero mismatches: all 87,380 arrays of length 1 to 8 drawn
from four symbols, all 5,913 permutations of length up to 7, and 30,000 random
arrays with duplicates and n up to 60. At n = 2,000 shuffled, both figures were
998,216.

That identity is worth carrying. It means bubble sort's swap count is a property
of the **input**, not of the algorithm, and it puts a floor under every sorting
method that only swaps neighbours: none of them can beat the inversion count.
Reverse-sorted input has the maximum possible `n(n-1)/2` inversions, which is why
it is bubble sort's worst case — 499,500 swaps at n = 1,000.

## The early-exit flag

A pass that performs no swaps found every adjacent pair already in order — and an
array whose every adjacent pair is in order **is sorted.** So a swap-free pass is
a genuine proof of sortedness, and the algorithm can stop.

That is a real difference from selection sort, whose comparison count is fixed at
n(n-1)/2 regardless. With the flag, an already-sorted array costs **one pass and
999 comparisons** at n = 1,000, against 499,500 without it.

Measured at n = 16,000, sorted input: bubble **0.0053ms**, selection **46.33ms**
— a factor of **8,742**.

## But the flag is worth either everything or nothing

Here is the part that is usually stated too generously. Bubble sort is described
as adaptive, which suggests it does progressively less work as input gets closer
to sorted. Measured at n = 1,000, comparisons saved by the flag:

| Input | With flag | Without | Saved |
|---|---|---|---|
| Already sorted | 999 | 499,500 | **99.800%** |
| Largest element moved to the front | 1,997 | 499,500 | **99.600%** |
| Random | 497,789 | 499,500 | 0.343% |
| Reverse sorted | 499,500 | 499,500 | **0.000%** |
| **Smallest element moved to the end** | **499,500** | 499,500 | **0.000%** |

The last row is the one to sit with. That array is **one element out of place** —
about as close to sorted as an unsorted array gets — and the flag saves nothing at
all. The algorithm runs every one of its 999 passes.

## Turtles and rabbits

The reason is that bubble sort is **directionally asymmetric**, and the asymmetry
is total.

A large element near the front is carried by the right-going sweep for as long as
it keeps winning comparisons, so it can travel the **entire array in a single
pass**. A small element near the back moves left by exactly **one position per
pass**, because the sweep passes over it once and only the one comparison
involving it can move it.

Traditionally the fast one is called a rabbit and the slow one a turtle. At
n = 1,000, moving one element to the opposite end:

| | Comparisons | Swaps | Passes |
|---|---|---|---|
| Largest moved to the front | 1,997 | 999 | **2** |
| Smallest moved to the end | 499,500 | 999 | **999** |

**Identical swap counts.** Both arrays contain exactly 999 inversions, so both do
exactly 999 swaps. One takes 2 passes and the other takes 999, and the difference
is nothing but direction.

Measured at n = 16,000, median of sixteen alternated runs: **39.43ms against
0.0097ms — a factor of 4,065**, from moving one element to the other end of the
array.

Displacing a single element by `d` positions makes the rule exact, verified for
every combination tested at n = 50, 200 and 1,000:

- a small value pushed `d` places **right** costs `min(d+1, n-1)` passes
- a large value pushed `d` places **left** costs **2 passes**, whatever `d` is

## Cocktail shaker sort

If the problem is that one direction is slow, sweep both ways. Alternate a
left-to-right pass with a right-to-left pass, shrinking the range from both ends.
Turtles now move a full array-length per round trip, exactly as rabbits do.

On the turtle at n = 16,000: **0.0150ms against 39.43ms, a factor of 2,629.**

On random input it is worth much less — measured 1.24x, which is within this
machine's run-to-run spread for workloads of this length and should not be read as
a real difference. Cocktail shaker fixes one specific pathology; it does not make
bubble sort fast.

## Stability, and the operator that destroys it

Bubble sort is **stable**, and it is stable for a precise reason: it only swaps
when `arr[j] > arr[j+1]` **strictly**, so two equal elements are never exchanged
and their original order survives every pass. Verified over all 3,279 arrays of
length 1 to 7 from three symbols with **zero** unstable results.

Change that `>` to `>=` and stability collapses. Equal neighbours now swap on every
encounter, so equal elements are reordered constantly. Measured over the same
3,279 arrays: **99.05% unstable**, and the smallest failure is two elements —
`[0, 0]` comes back with its two entries exchanged.

It also does substantially more work. On 8,000 values drawn from 0 to 9, the
strict version performed 14,428,519 swaps and the `>=` version 31,959,840 — a
factor of **2.22**. Note that the extra swaps did **not** show up in wall clock,
which is the same result Selection Sort found for its own write count: on a CPU,
swaps are close to free and comparisons are what cost. So the argument against
`>=` is not performance, it is that it is wrong.

## Speed

At n = 16,000 on random input, medians of alternated runs: bubble **75.50ms**,
insertion **22.31ms**, `std::sort` **0.2596ms**. Insertion sort is **3.4x** faster
and the library sort is **291x** faster.

Against selection sort bubble came out ahead on random input — **75.50ms against
114.13ms**, a factor of **1.51** — and over forty alternated samples each the two
sets did not overlap. Read that weakly: 1.51x is small by this topic's standards,
and bubble's was the least stable measurement here, ranging 64ms to 87ms across
runs of the same session while selection held near 114ms. On structured input they
diverge completely — bubble is 8,742x faster on sorted data and selection is
unbeatably consistent on everything.

Python is the same shape with the ordering slightly changed, at n = 2,000: bubble
**0.059ms** sorted and **109.10ms** random, against selection's flat ~49ms on both.
Selection sort's indifference to input becomes an advantage in Python precisely
because bubble sort's best case is so rare.

## Where this goes next

**Insertion Sorting** is the third of the basic sorts and the one worth actually
using: it is adaptive in a way bubble sort only appears to be, because its cost is
proportional to the inversion count rather than to the worst displacement. The
inversion identity here is the same quantity **Count Inversions** computes in
O(n log n) with merge sort, which is a good demonstration that counting something
and producing it can have very different costs.

<!-- @intuition -->
Bubble sort can only ever exchange neighbours, so an element moves at walking pace — and the whole character of the algorithm follows from one asymmetry in that walk. Sweeping left to right, you are effectively carrying the largest thing you have met so far, so a big value at the front gets carried the entire way in one trip. But a small value at the back is only ever glanced at once per sweep, so it shuffles forward one place per pass and needs as many passes as it has places to travel. Same element, same number of swaps, opposite direction, and the cost differs by a factor of the array length. Everything else here — why the early-exit flag rescues some almost-sorted arrays and not others, why sweeping both ways helps — is that one fact seen from a different side.

<!-- @approach -->
### Brute Force - Sweep the Whole Array Every Pass

<!-- @idea -->
Run n minus one full sweeps over the entire array, swapping any adjacent pair that is out of order.

<!-- @steps -->
1. Repeat the following n minus one times.
2. Walk from the first index to the second-to-last, comparing each element with its right neighbour.
3. Swap them whenever the left one is larger.
4. Do not shorten the sweep, even though the tail is already settled.
5. After n minus one passes the array is sorted, because each pass settles at least one more element.

<!-- @complexity -->
- time: O(n^2) — exactly (n-1)^2 comparisons on every input
- space: O(1)
- note: Correct and exactly twice the necessary work — 998,001 comparisons at n = 1,000 against 499,500 for the shrinking bound, a factor of 2.0 at every size. It re-compares a tail that is already in its final order and can never change.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void bubbleSort(vector<int>& arr) {
    int n = arr.size();

    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1; j++) {
            if (arr[j] > arr[j + 1]) swap(arr[j], arr[j + 1]);
        }
    }
}
```

<!-- @annotations -->
- 8: n - 1 passes suffice, because each pass settles at least one more element at the end.
- 9: The bound that does not shrink. Every pass re-sweeps the settled tail, costing exactly (n-1)^2 comparisons in total.
- 10: Strictly greater, which is what makes the sort stable — equal neighbours are never exchanged.

<!-- @code java -->
```java
static void bubbleSort(int[] arr) {
    int n = arr.length;

    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1; j++) {
            if (arr[j] > arr[j + 1]) {
                int t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t;
            }
        }
    }
}
```

<!-- @annotations -->
- 5: The inner bound is independent of i here, which is precisely the waste the next approach removes.
- 7: Only adjacent elements are ever exchanged, which is what ties the swap count to the inversion count.

<!-- @code python -->
```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - 1):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]


# Measured 998,001 comparisons at n = 1,000 against 499,500 with the
# shrinking bound — exactly 2.0x, at every size.
```

<!-- @annotations -->
- 4: range(n - 1) every pass, so the sweep never gets shorter as the tail settles.
- 6: Tuple assignment swaps in place without a temporary.

<!-- @approach -->
### Shrink the Sweep

<!-- @idea -->
Stop each sweep before the tail that has already been settled by previous passes.

<!-- @steps -->
1. Repeat the sweep n minus one times, tracking the pass number.
2. On pass i, sweep only up to n minus one minus i.
3. Compare each element with its right neighbour and swap when out of order.
4. Everything from that bound onward already holds the largest elements in their final order.
5. The total comparison count falls from (n-1) squared to n(n-1)/2.

<!-- @complexity -->
- time: O(n^2) — exactly n(n-1)/2 comparisons
- space: O(1)
- note: Exactly half the comparisons of the full sweep, 499,500 against 998,001 at n = 1,000. Still has no best case: an already-sorted array costs the full 499,500 comparisons, because nothing detects that no swaps occurred.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void bubbleSort(vector<int>& arr) {
    int n = arr.size();

    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) swap(arr[j], arr[j + 1]);
        }
    }
}
```

<!-- @annotations -->
- 9: The minus i is the whole change. After pass i the last i elements are in their final positions and can never move again.
- 10: The sweep carries the largest value it has met along with it, which is why one pass is enough to settle the maximum.

<!-- @code java -->
```java
static void bubbleSort(int[] arr) {
    int n = arr.length;

    for (int i = 0; i < n - 1; i++) {
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t;
            }
        }
    }
}
```

<!-- @annotations -->
- 5: The invariant this bound relies on: after pass i, arr[n-1-i .. n-1] holds the i+1 largest elements in order.

<!-- @code python -->
```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]


# n(n-1)/2 comparisons on every input, including an already-sorted one.
# The next approach is what gives this sort a best case at all.
```

<!-- @annotations -->
- 4: The sweep shortens by one each pass, so the totals are (n-1) + (n-2) + ... + 1.

<!-- @approach -->
### Optimal - Add the Early-Exit Flag

<!-- @idea -->
Record whether any swap happened during a pass, and stop when one completes without any.

<!-- @steps -->
1. Before each pass, set a flag to false.
2. Sweep up to n minus one minus i, swapping out-of-order neighbours and setting the flag whenever you do.
3. After the sweep, check the flag.
4. If nothing was swapped, every adjacent pair is in order, so the array is sorted and the algorithm stops.
5. Otherwise continue with the next pass.

<!-- @complexity -->
- time: O(n) best case, O(n^2) average and worst
- space: O(1)
- note: Turns an already-sorted array into a single pass — 999 comparisons at n = 1,000 against 499,500, and measured 0.0053ms against selection sort's 46.33ms at n = 16,000, a factor of 8,742. On random input it saves 0.343% and on an array with its smallest element at the end it saves exactly nothing.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void bubbleSort(vector<int>& arr) {
    int n = arr.size();

    for (int i = 0; i < n - 1; i++) {
        bool swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                swap(arr[j], arr[j + 1]);
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}
```

<!-- @annotations -->
- 9: Reset per pass. Declaring it above the outer loop makes it permanently true after the first swap and the exit never fires.
- 11: Strict greater-than. Writing >= swaps equal neighbours, which is 99.05% unstable and performs 2.22x the swaps.
- 16: A swap-free pass proves every adjacent pair is in order, and an array whose adjacent pairs are all in order is sorted — so this is a proof, not a heuristic. Selection sort has no equivalent, because a pass with no swap there says nothing about the rest of the array.

<!-- @code java -->
```java
static void bubbleSort(int[] arr) {
    int n = arr.length;

    for (int i = 0; i < n - 1; i++) {
        boolean swapped = false;
        for (int j = 0; j < n - 1 - i; j++) {
            if (arr[j] > arr[j + 1]) {
                int t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t;
                swapped = true;
            }
        }
        if (!swapped) break;
    }
}
```

<!-- @annotations -->
- 5: The flag belongs to the pass, so it is declared inside the outer loop.
- 12: This is the only reason bubble sort has an O(n) best case, and it is what makes it adaptive in the narrow sense measured above.

<!-- @code python -->
```python
def bubble_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        swapped = False
        for j in range(n - 1 - i):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        if not swapped:
            break


# Measured at n = 2,000: 0.059ms already sorted, 109.10ms random.
# The gap is the flag, and it only opens on input that is genuinely
# sorted from some pass onward.
```

<!-- @annotations -->
- 4: Reset each pass. Hoisting it above the loop silently disables the early exit entirely.
- 9: The break is what separates this from the previous approach; everything else is identical.

<!-- @approach -->
### Cocktail Shaker Sort - Sweep Both Ways

<!-- @idea -->
Alternate a left-to-right pass with a right-to-left one, so small elements travel as fast as large ones.

<!-- @steps -->
1. Track a low and a high boundary, initially the first and last index.
2. Sweep upward from low to high, swapping out-of-order neighbours, which settles the maximum at high.
3. Decrease high, and stop if that sweep performed no swaps.
4. Sweep downward from high to low, swapping out-of-order neighbours, which settles the minimum at low.
5. Increase low, and stop if that sweep performed no swaps, otherwise repeat.

<!-- @complexity -->
- time: O(n) best case, O(n^2) average and worst
- space: O(1)
- note: Removes the directional asymmetry entirely — on an array whose smallest element sits at the end it measured 0.0150ms against bubble sort's 39.43ms at n = 16,000, a factor of 2,629. On random input the measured difference was 1.24x, which is inside this machine's run-to-run spread and should not be treated as real.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void cocktailSort(vector<int>& arr) {
    int lo = 0, hi = (int)arr.size() - 1;

    while (lo < hi) {
        bool swapped = false;
        for (int j = lo; j < hi; j++)                    // carry the max up
            if (arr[j] > arr[j + 1]) { swap(arr[j], arr[j + 1]); swapped = true; }
        hi--;
        if (!swapped) break;

        swapped = false;
        for (int j = hi; j > lo; j--)                    // carry the min down
            if (arr[j - 1] > arr[j]) { swap(arr[j - 1], arr[j]); swapped = true; }
        lo++;
        if (!swapped) break;
    }
}
```

<!-- @annotations -->
- 6: Two boundaries rather than one, because both ends of the array settle.
- 12: hi must shrink after the upward sweep, since the maximum is now parked there.
- 17: The downward sweep is what fixes the turtle: a small element at the back now travels the whole array in one pass rather than one position.
- 19: lo grows after the downward sweep, for the mirrored reason.

<!-- @code java -->
```java
static void cocktailSort(int[] arr) {
    int lo = 0, hi = arr.length - 1;

    while (lo < hi) {
        boolean swapped = false;
        for (int j = lo; j < hi; j++)
            if (arr[j] > arr[j + 1]) {
                int t = arr[j]; arr[j] = arr[j + 1]; arr[j + 1] = t; swapped = true;
            }
        hi--;
        if (!swapped) break;

        swapped = false;
        for (int j = hi; j > lo; j--)
            if (arr[j - 1] > arr[j]) {
                int t = arr[j - 1]; arr[j - 1] = arr[j]; arr[j] = t; swapped = true;
            }
        lo++;
        if (!swapped) break;
    }
}
```

<!-- @annotations -->
- 14: The comparison indices differ from the upward sweep — j-1 against j rather than j against j+1 — which is the easiest part of this to get wrong.

<!-- @code python -->
```python
def cocktail_sort(arr):
    lo, hi = 0, len(arr) - 1
    while lo < hi:
        swapped = False
        for j in range(lo, hi):
            if arr[j] > arr[j + 1]:
                arr[j], arr[j + 1] = arr[j + 1], arr[j]
                swapped = True
        hi -= 1
        if not swapped:
            break

        swapped = False
        for j in range(hi, lo, -1):
            if arr[j - 1] > arr[j]:
                arr[j - 1], arr[j] = arr[j], arr[j - 1]
                swapped = True
        lo += 1
        if not swapped:
            break


# On the smallest-element-at-the-end array it took 3 passes where
# bubble sort took 999.
```

<!-- @annotations -->
- 3: Verified to sort the turtle array in 3 iterations of this loop at both n = 100 and n = 1,000, against n - 1 passes for the one-directional version.
- 14: range(hi, lo, -1) walks downward and stops before lo, which is already settled.

<!-- @example -->

<!-- @input -->
arr = [5, 1, 4, 2]

<!-- @output -->
[1, 2, 4, 5] — 6 comparisons, 4 swaps, 3 passes

<!-- @why -->
Small enough to trace by hand, and its swap count of 4 is exactly the number of inversions in the input — the identity the rest of the subtopic rests on.

<!-- @walkthrough -->
1. Pass 1 sweeps j = 0 to 2: 5 > 1 swaps to [1,5,4,2], then 5 > 4 swaps to [1,4,5,2], then 5 > 2 swaps to [1,4,2,5].
2. The maximum 5 has been carried the whole way and is now at the last position, which no later pass will touch.
3. Pass 2 sweeps j = 0 to 1: 1 > 4 is false, then 4 > 2 swaps to [1,2,4,5].
4. Pass 3 sweeps j = 0 only: 1 > 2 is false, so no swap occurs and the flag stays false.
5. That swap-free pass proves every adjacent pair is in order, so the loop breaks — though on an array this small the outer loop would have ended after three passes regardless, so the flag saves nothing here.
6. The comparison counts per pass were 3, 2 and 1, totalling 6, which is n(n-1)/2 for n = 4.
7. The input [5,1,4,2] contains exactly 4 inversions — (5,1), (5,4), (5,2) and (4,2) — matching the 4 swaps exactly, which is the identity the rest of this subtopic rests on.

<!-- @example -->

<!-- @input -->
The largest element moved to the front, against the smallest moved to the end

<!-- @output -->
2 passes against 999, from the same 999 swaps

<!-- @why -->
The clearest possible statement of the directional asymmetry — the two inputs are equally disordered by every count that matters, and differ by a factor of the array length.

<!-- @walkthrough -->
1. Both arrays are a sorted sequence of 1,000 elements with exactly one element moved to the opposite end.
2. Both therefore contain exactly 999 inversions, and bubble sort performs exactly 999 swaps on each.
3. With the largest element at the front, the first sweep picks it up immediately and carries it all the way to the back.
4. That single pass sorts the array, and a second confirming pass finds no swaps and exits — 1,997 comparisons in total.
5. With the smallest element at the end, each sweep moves it left by exactly one position, because only one comparison per pass involves it.
6. It therefore needs 999 passes to travel 999 places, costing the full 499,500 comparisons — 250 times as many.
7. Measured at n = 16,000: 0.0097ms against 39.43ms, a factor of 4,065.

<!-- @example -->

<!-- @input -->
The early-exit flag, measured across five input shapes at n = 1,000

<!-- @output -->
Saves 99.8% on sorted input and exactly 0.000% on an array one element from sorted

<!-- @why -->
Shows that adaptive does not mean what it sounds like — the flag responds to whether the array becomes sorted, not to how close to sorted it started.

<!-- @walkthrough -->
1. On an already-sorted array the first pass swaps nothing, so the flag exits immediately after 999 comparisons instead of 499,500.
2. On an array with the largest element at the front, one pass sorts it and the second exits, saving 99.600%.
3. On random input the last few passes happen to be swap-free, saving 0.343% — essentially nothing.
4. On reverse-sorted input every pass swaps, so the flag never fires and saves 0.000%.
5. On an array with only its smallest element out of place, at the end, the flag also saves 0.000%.
6. That last case is one element away from sorted and gets no benefit at all, because a turtle guarantees a swap on every one of the 999 passes.
7. The flag detects that sorting has finished; it cannot detect that little sorting is needed.

<!-- @example -->

<!-- @input -->
Comparing arr[j] >= arr[j+1] instead of arr[j] > arr[j+1]

<!-- @output -->
99.05% of arrays come back unstable, and the smallest failure is [0, 0]

<!-- @why -->
A one-character change that costs a correctness property most people assume bubble sort has unconditionally, and the failure appears at the smallest input that can have duplicates at all.

<!-- @walkthrough -->
1. With strict greater-than, two equal neighbours are never swapped, so their original relative order is preserved through every pass.
2. Verified over all 3,279 arrays of length 1 to 7 from three symbols: zero unstable results.
3. With greater-or-equal, equal neighbours swap every time they are compared, so equal elements are shuffled repeatedly.
4. Measured over the same 3,279 arrays: 3,248 came back in an order a stable sort would not produce, which is 99.05%.
5. The smallest failure is [0, 0], where two identical values are exchanged and their origins reversed.
6. It also performs 2.22 times the swaps — 31,959,840 against 14,428,519 on 8,000 values drawn from 0 to 9.
7. The extra swaps did not register in wall clock, so the reason to use strict greater-than is correctness rather than speed.

<!-- @visualization array -->

<!-- @description -->
The array as a strip with a single comparison window spanning two adjacent cells, sliding left to right — and the window must never span more than two cells, because the one-position-at-a-time restriction is the source of everything in this subtopic. Tint the settled tail on the right permanently as each pass ends, and shrink the sweep visibly to that boundary so the shortening bound is watched rather than described. The element being carried is the thing to animate: as the window slides, hold the current maximum inside the right half of the window and let it ride along, only being set down when a larger value displaces it — that riding motion is why one pass settles the maximum. Run a swap counter beside an inversion counter, both starting at the input's inversion count and the swap counter climbing to meet it, so they visibly finish equal; label that as exact rather than approximate. The centre of the figure is a turtle-and-rabbit panel: two strips side by side, one with the largest element at the front and one with the smallest at the back, both annotated 999 inversions and 999 swaps. Step them together. The rabbit strip resolves in a single sweep as its element is carried the full width; the turtle strip advances its element by exactly one cell per pass, and the panel should be allowed to grind — repeat the pass many times so the reader feels 999 rather than reading it. Print the two comparison counters diverging to 1,997 and 499,500 while the two swap counters stay locked together at 999. Then a flag panel with five strips — sorted, rabbit, random, reverse, turtle — each with a lamp that lights when a pass completes without swapping, and a percentage saved beneath: 99.800, 99.600, 0.343, 0.000, 0.000. The turtle's lamp never lights, and it should be visually obvious that this array is one element from sorted. Close with a cocktail panel replaying the turtle strip with sweeps alternating direction, drawn as arrows above and below the strip, resolving in three passes against the one-directional version's 999 — with the measured 0.0150ms against 39.43ms beneath.

<!-- @sampleInput -->
```json
{"primary":{"array":[5,1,4,2],"passes":[{"pass":1,"bound":3,"steps":[{"j":0,"pair":[5,1],"swap":true,"after":[1,5,4,2]},{"j":1,"pair":[5,4],"swap":true,"after":[1,4,5,2]},{"j":2,"pair":[5,2],"swap":true,"after":[1,4,2,5]}],"settled":5},{"pass":2,"bound":2,"steps":[{"j":0,"pair":[1,4],"swap":false},{"j":1,"pair":[4,2],"swap":true,"after":[1,2,4,5]}],"settled":4},{"pass":3,"bound":1,"steps":[{"j":0,"pair":[1,2],"swap":false}],"swappedThisPass":false,"exit":true}],"result":[1,2,4,5],"comparisons":6,"swaps":4,"inversions":4,"passesRun":3},"inversionIdentity":{"claim":"swaps == inversions, exactly","verified":[{"corpus":"all arrays length 1-8 from 4 symbols","count":87380,"mismatches":0},{"corpus":"all permutations length 1-7","count":5913,"mismatches":0},{"corpus":"random arrays with duplicates, n<=60","count":30000,"mismatches":0}],"atN2000":{"swaps":998216,"inversions":998216}},"counts":{"n":1000,"formula":{"shrink":"n(n-1)/2 = 499500","noShrink":"(n-1)^2 = 998001","ratio":2.0},"rows":[{"input":"sorted","comparisons":999,"swaps":0,"passes":1,"noFlag":499500,"noShrink":999},{"input":"allequal","comparisons":999,"swaps":0,"passes":1,"noFlag":499500,"noShrink":999},{"input":"reverse","comparisons":499500,"swaps":499500,"passes":999,"noFlag":499500,"noShrink":998001},{"input":"random","comparisons":497789,"swaps":252260,"passes":941,"noFlag":499500,"noShrink":940059},{"input":"turtle","comparisons":499500,"swaps":999,"passes":999,"noFlag":499500,"noShrink":998001},{"input":"rabbit","comparisons":1997,"swaps":999,"passes":2,"noFlag":499500,"noShrink":1998}]},"flagValue":[{"input":"sorted","savedPct":99.800},{"input":"rabbit","savedPct":99.600},{"input":"random","savedPct":0.343},{"input":"reverse","savedPct":0.000},{"input":"turtle","savedPct":0.000}],"asymmetry":{"rabbit":{"description":"largest element moved to the front","comparisons":1997,"swaps":999,"passes":2},"turtle":{"description":"smallest element moved to the end","comparisons":499500,"swaps":999,"passes":999},"comparisonRatio":250,"swapRatio":1,"displacementLaw":{"smallPushedRightByD":"min(d+1, n-1) passes","largePushedLeftByD":"2 passes","verifiedAt":[50,200,1000]},"timing":{"n":16000,"turtleMs":39.43,"rabbitMs":0.0097,"ratio":4065}},"stability":{"strictGreater":{"arraysTested":3279,"unstable":0},"greaterOrEqual":{"arraysTested":3279,"unstable":3248,"rate":0.9905,"smallestFailure":[0,0]},"swapCost":{"values":"8000 drawn from 0..9","strict":14428519,"greaterEqual":31959840,"ratio":2.22,"wallClock":"no measurable difference"}},"cocktail":{"turtle":{"n":16000,"cocktailMs":0.0150,"bubbleMs":39.43,"ratio":2629},"turtlePasses":{"n100":3,"n1000":3,"bubbleN1000":999},"random":{"ratio":1.24,"note":"inside this machine's run-to-run spread; not a real difference"}},"speed":{"n":16000,"random":{"bubbleMs":75.50,"insertionMs":22.31,"stdSortMs":0.2596,"insertionSpeedup":3.4,"stdSortSpeedup":291},"sorted":{"bubbleMs":0.0053,"selectionMs":46.33,"ratio":8742},"vsSelection":{"bubbleMs":75.50,"selectionMs":114.13,"ratio":1.51,"verdict":"bubble faster on random input; sample sets did not overlap, but bubble ranged 64-87ms across runs while selection held near 114ms — a weak ranking"}},"python":{"n":2000,"bubble":{"sorted":0.059,"reverse":131.08,"random":109.10,"turtle":58.47,"rabbit":0.194},"selection":{"sorted":49.35,"random":48.28},"insertion":{"sorted":0.130,"random":55.40},"sortedBuiltin":{"random":0.116}}}
```

<!-- @highlights -->
- The comparison window spans exactly two adjacent cells and never more, because that restriction is the source of everything else.
- As the window slides right it carries the largest value met so far, setting it down only when something larger displaces it.
- That riding motion is why a single sweep is enough to settle the maximum at the last position.
- The settled tail tints permanently at the end of each pass, and the next sweep visibly stops short of it.
- A swap counter climbs beside a fixed inversion counter and finishes exactly equal to it, labelled exact rather than approximate.
- The turtle-and-rabbit panel places two strips side by side, both annotated 999 inversions and 999 swaps.
- The rabbit strip resolves in a single sweep as its element is carried the full width of the array.
- The turtle strip advances its element by exactly one cell per pass, and the panel grinds through the repetition rather than summarising it.
- The two comparison counters diverge to 1,997 and 499,500 while the two swap counters stay locked together at 999.
- That locked pair is the point: identical disorder, identical swaps, 250x the comparisons, decided only by direction.
- The flag panel runs five strips with a lamp that lights when a pass completes without swapping.
- Percentages saved print beneath: 99.800, 99.600, 0.343, 0.000 and 0.000.
- The turtle's lamp never lights, on an array that is visibly one element away from sorted.
- The cocktail panel replays the turtle with sweeps alternating direction, drawn as arrows above and below the strip.
- It resolves in three passes against the one-directional version's 999.
- The measured times close it: 0.0150ms against 39.43ms, a factor of 2,629.

<!-- @edgeCases -->
- Empty array — n - 1 is negative so the outer loop never runs, and no guard is needed in any of the three languages.
- Single element — the outer loop condition is immediately false and the element is trivially sorted.
- Two elements — one comparison decides it, and it is the smallest input where the >= mistake can be observed.
- Already sorted — one pass and n - 1 comparisons with the flag, against n(n-1)/2 without it.
- All elements equal — identical to the sorted case, since strict greater-than never fires.
- Reverse sorted — the worst case at n(n-1)/2 swaps, which is the maximum possible inversion count.
- Largest element at the front — two passes, whatever the array length.
- Smallest element at the end — n - 1 passes, whatever the flag does, and the case that shows adaptivity has limits.
- Duplicate values present — handled correctly and stably by strict greater-than, and reordered by >=.
- One element displaced by d positions — costs min(d+1, n-1) passes if displaced rightward and exactly 2 if leftward.
- Very large arrays — quadratic in comparisons, and 291x slower than std::sort at n = 16,000.

<!-- @pitfalls -->
- Declaring the swapped flag outside the outer loop. It becomes permanently true after the first swap and the early exit never fires again.
- Using >= instead of >. Measured 99.05% unstable over 3,279 arrays with [0,0] the smallest failure, plus 2.22x the swaps.
- Leaving the inner bound at n - 1. Still correct and exactly twice the comparisons — 998,001 against 499,500 at n = 1,000.
- Writing the inner bound as n - i, which reads past the end of the array on the first pass.
- Believing bubble sort is fast on nearly-sorted data. An array one element from sorted can still cost every pass and the full n(n-1)/2 comparisons.
- Expecting the flag to help in proportion to how sorted the input is. It saves 99.8% on a sorted array and 0.000% on one with a single misplaced small element.
- Assuming the two directions are symmetric. A large value travels the whole array in one pass; a small value travels one position per pass.
- Comparing arr[j] with arr[j+1] in the downward sweep of cocktail sort. It must compare arr[j-1] with arr[j], or the sweep skips a pair.
- Forgetting to shrink hi and grow lo in cocktail sort, which loops forever or re-sweeps settled regions.
- Reaching for bubble sort because it is the simplest to write. Measured 3.4x slower than insertion sort and 291x slower than std::sort on random input.
- Benchmarking on sorted input. That is bubble sort's single best case and it is 8,742x faster there than selection sort, which tells you nothing about random data.
- Reading the swap count as a property of the algorithm. It is exactly the inversion count of the input, so it is a property of the data.

<!-- @doubt -->
### Why does one pass put the largest element at the end?

<!-- @answer -->
Because the sweep effectively carries the largest value it has met so far. When the window reaches a pair whose left element is larger, it swaps, so that larger value moves right with the window and becomes the thing being carried. It can only be set down when the window meets something even larger, which then takes over. By the time the window reaches the end, whatever it is carrying has beaten every element in the array, so the maximum is at the last position. That is also what licenses the shrinking bound: after pass i the last i elements are settled and can never move again.

<!-- @doubt -->
### Why is the swap count exactly the inversion count?

<!-- @answer -->
Because bubble sort only ever swaps adjacent elements, and swapping two adjacent elements changes the relative order of exactly one pair — themselves. Every such swap therefore removes exactly one inversion, no more and no fewer, and the sort ends when zero remain. So the number of swaps equals the number of inversions the input started with. Verified with zero mismatches over all 87,380 arrays of length 1 to 8 from four symbols, all 5,913 permutations up to length 7, and 30,000 random arrays with duplicates. It also means no neighbour-swapping sort can do better: the inversion count is a floor.

<!-- @doubt -->
### Is bubble sort actually adaptive?

<!-- @answer -->
Only in a much narrower sense than the word suggests. The flag detects that sorting has finished, not that little sorting was needed. Measured at n = 1,000, the comparisons it saves are 99.800% on an already-sorted array, 99.600% when the largest element is at the front, 0.343% on random input, and exactly 0.000% on both reverse-sorted input and an array whose only fault is its smallest element sitting at the end. That last case is one element away from sorted and gets no benefit at all, because a misplaced small element guarantees a swap on every single pass.

<!-- @doubt -->
### Why is one element out of place sometimes free and sometimes the worst case?

<!-- @answer -->
Because the algorithm is directionally asymmetric and the asymmetry is total. A large value near the front gets picked up by the sweep and carried as far as it deserves to go, so it can cross the entire array in one pass. A small value near the back is only involved in one comparison per sweep, so it moves left by exactly one position per pass. At n = 1,000 both arrangements contain 999 inversions and cost exactly 999 swaps, and one takes 2 passes while the other takes 999 — 1,997 comparisons against 499,500. Measured at n = 16,000 that is 0.0097ms against 39.43ms, a factor of 4,065.

<!-- @doubt -->
### How much does a single element cost if it is displaced by d rather than to the end?

<!-- @answer -->
It follows an exact rule, verified for every combination tested at n = 50, 200 and 1,000. A small value pushed d places to the right costs min(d+1, n-1) passes — so displacement by 10 costs 11 passes and displacement by 999 costs 999. A large value pushed d places to the left costs exactly 2 passes regardless of d, because the single upward sweep carries it back however far it needs to go. The cost of a misplaced element is therefore linear in its displacement in one direction and constant in the other.

<!-- @doubt -->
### Does cocktail shaker sort fix this?

<!-- @answer -->
It fixes exactly this and nothing else. Alternating an upward sweep with a downward one means small elements are carried leftward the same way large elements are carried rightward, so turtles move a full array-length per round trip. On an array with its smallest element at the end it sorted in 3 passes against bubble sort's 999, measured 0.0150ms against 39.43ms at n = 16,000 — a factor of 2,629. On random input the measured difference was 1.24x, which is inside this machine's run-to-run spread and should not be reported as a real gain. It removes one pathology; it does not make the algorithm fast.

<!-- @doubt -->
### Why must the comparison be > rather than >=?

<!-- @answer -->
Because strict greater-than is the entire reason bubble sort is stable. Two equal neighbours are never swapped, so their original order survives every pass — verified over all 3,279 arrays of length 1 to 7 from three symbols with zero unstable results. With >=, equal neighbours swap on every encounter and equal elements are shuffled continuously: measured 99.05% unstable over the same corpus, with the smallest failure being [0, 0]. It also does 2.22x the swaps on duplicate-heavy input, though that did not register in wall clock — so the argument is correctness, not speed.

<!-- @doubt -->
### What does the shrinking bound actually save?

<!-- @answer -->
Exactly half the comparisons, at every size. Without it each pass sweeps all n - 1 pairs, giving (n-1)² in total; with it the sweeps shorten by one each time, giving n(n-1)/2. At n = 1,000 that is 998,001 against 499,500, a ratio of exactly 2.0. The version without it is still correct — it simply re-compares a tail that is already in final order and cannot change. Note it is orthogonal to the flag: on an already-sorted array the flag exits after one pass either way, so the two refinements help on different inputs.

<!-- @doubt -->
### Is bubble sort faster or slower than selection sort?

<!-- @answer -->
On random input bubble measured faster — 75.50ms against 114.13ms at n = 16,000, a factor of 1.51, with no overlap between forty alternated samples of each. Rank them cautiously: that gap is small by this topic's standards, and bubble's own time ranged from 64ms to 87ms across runs of the same session while selection stayed near 114ms. On structured input they diverge completely and in both directions. Bubble sort is 8,742x faster on an already-sorted array, because it exits after one pass while selection sort still performs its full n(n-1)/2 comparisons. Selection sort is the more predictable of the two, since its cost does not depend on the input at all, which is worth something when worst-case behaviour matters more than best-case.

<!-- @doubt -->
### Should I ever actually use it?

<!-- @answer -->
Essentially never for real work — measured at n = 16,000 on random input, insertion sort took 22.31ms and std::sort 0.2596ms against bubble sort's 75.50ms, so 3.4x and 291x respectively. Its one genuine niche is checking whether data is already sorted while sorting it, since a single swap-free pass proves sortedness for free. It earns its place in a course for a different reason: the swap-count-equals-inversion-count identity is the cleanest connection between a sorting algorithm and a measurable property of its input, and it is the same quantity Count Inversions computes in O(n log n).
