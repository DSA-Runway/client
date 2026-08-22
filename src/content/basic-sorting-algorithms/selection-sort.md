---
id: selection-sort
topic: Basic Sorting Algorithms
title: Selection Sort
difficulty: Easy
status: ready
prerequisites:
  - nested-loops
  - largest-element
  - for-loop
  - if-else-statements
  - time-and-space-complexity-basics
relatedIds:
  - bubble-sort
  - insertion-sorting
  - largest-element
  - left-rotate-array-by-k-places
  - nested-loops
---

<!-- @summary -->
Repeatedly select the smallest remaining element and swap it into place — the only one of the three basic sorts that performs exactly n(n-1)/2 comparisons on every input, whose sole theoretical advantage is writing at most n-1 times, and where the stable variant that writes 2,677x more measured 0.89x the time, so the property you would trade stability for buys nothing on a CPU.

<!-- @theory -->
## The problem

Sort an array in ascending order, in place. Selection sort does it by choosing,
on each pass, the smallest element from the part that is not yet sorted, and
putting it where it belongs.

```
[64, 25, 12, 22, 11]  ->  [11, 12, 22, 25, 64]
```

## The invariant

After pass `i`, **`arr[0..i]` holds the i+1 smallest elements of the whole array,
in order, and none of them will ever move again.**

That is stronger than the invariant most sorts maintain. In bubble sort and
insertion sort the finished prefix is only sorted *relative to what has been seen*;
here each settled element is in its **final** position from the moment it is
placed. Selection sort settles positions permanently, one per pass.

The algorithm follows directly. To settle position `i`, find the smallest value in
`arr[i..n-1]` and put it at `i`. Whatever was at `i` has to go somewhere, and the
slot the minimum vacated is the obvious place — so the two swap.

## Finding the minimum is Largest Element, run n times

The inner loop is exactly the running-candidate scan from **Largest Element**,
with the comparison flipped. Carry a candidate, replace it when something beats
it, and the survivor is the answer.

One detail carries over and matters more here: **track the index, not the value.**
Largest Element could return the value because that was the question. Here you
need to know *where* the minimum is in order to swap it, so a version that
remembers only the value has nowhere to put the displaced element.

Measured over all 21,844 arrays of length 1 to 7 drawn from four symbols, a
version that assigns the minimum value into position `i` without swapping is
**wrong on 98.49%** of them. The smallest failure is two elements: `[1, 0]`
returns `[0, 0]`, and the 1 is simply gone.

## The comparison count does not depend on the input at all

This is the property that separates selection sort from the other two, and it is
exact rather than approximate.

Pass `i` scans `n - 1 - i` elements. Summing over every pass gives

```
(n-1) + (n-2) + ... + 1  =  n(n-1)/2
```

with **no branch anywhere that can shorten it.** The scan has to reach the end of
the tail to know it has found the minimum — there is no early exit, because a
smaller element could always be the last one you look at.

Measured across four input shapes — already sorted, reverse sorted, random, and
all elements equal — the number of distinct comparison counts is **one**:

| n | comparisons, every shape | n(n-1)/2 |
|---|---|---|
| 10 | 45 | 45 |
| 100 | 4,950 | 4,950 |
| 1,000 | 499,500 | 499,500 |
| 4,000 | 7,998,000 | 7,998,000 |

**Selection sort has no best case.** Handing it an already-sorted array saves it
nothing. That is worth stating precisely because bubble sort and insertion sort
both finish an already-sorted array in O(n) — measured at n = 16,000, bubble took
**0.0053ms** and insertion **0.0070ms** where selection sort took **46.33ms**.

## What it does have: at most n - 1 swaps

Every pass performs one swap or none, and there are n - 1 passes. So the write
count is bounded by `3(n-1)` and does not depend on how disordered the input is —
verified over 20,000 random arrays, with **zero** exceeding n - 1 swaps.

Set against the other basic sorts, at n = 4,000 on random input:

| Algorithm | Element writes |
|---|---|
| **Selection sort** | **11,976** |
| Insertion sort | 4,015,043 |
| Bubble sort | 12,033,132 |

Selection sort writes **335x less than insertion sort** and **1,005x less than
bubble sort**. That is its entire case, and it is a real one: it is the algorithm
to reach for when a write physically costs more than a read — flash memory with
limited erase cycles, a structure where each assignment triggers work, a network
round trip per element.

The guard matters here. Writing `if (minIdx != i)` before the swap means an
already-sorted array performs **0 writes** rather than n - 1 pointless
self-swaps — measured 0 against 2,997 at n = 1,000.

| Input | Writes at n = 4,000 |
|---|---|
| Already sorted | **0** |
| All elements equal | **0** |
| Reverse sorted | 6,000 |
| Random | 11,976 |

Note that reverse sorted costs *half* what random does. Each swap on a reversed
array fixes two elements at once, so it needs only about n/2 of them.

## Selection sort is not stable

Two equal elements can come out in the opposite of their original order, because
the swap that brings the minimum forward throws whatever was at position `i`
across the array, over the top of its equal twins.

The smallest case is three elements. Label the two 1s by where they started:

```
[1a, 1b, 0]   ->  swap the 0 into place  ->  [0, 1b, 1a]
```

`1a` began before `1b` and ends after it. Measured over all 3,279 arrays of
length 1 to 7 drawn from three symbols, the swap-based version produces an
**unstable result on 60.29%** of them. Failures begin at n = 3 — there are none at
n = 1 or n = 2 — and there are exactly 3 at n = 3.

That 60% is worth pausing on. Instability here is not a rare edge case that
careful inputs avoid; it is the normal behaviour of the algorithm on data
containing duplicates.

## The variant that fixes it, and what it appears to cost

Stability is recoverable. Instead of swapping the minimum into place, **shift the
block between `i` and `minIdx` one position right** and drop the minimum into the
hole. Nothing jumps over anything, so equal elements keep their order — verified
over the same 3,279 arrays with **0 unstable results.**

And it destroys the one advantage selection sort had. At n = 4,000 on random
input the shift version performs **4,015,034 writes against 11,976** — it has
become insertion sort's write count almost exactly (4,015,043).

So on paper the choice is stark: **minimum writes or stability, never both.**

## Except that on a CPU it costs nothing

Measured, median of nine runs, same random input:

| n | Swap-based | Stable shift | Ratio | Writes |
|---|---|---|---|---|
| 4,000 | 11.23ms | 11.25ms | 1.00x | 335x |
| 16,000 | 114.13ms | **109.19ms** | **0.96x** | 1,344x |
| 32,000 | 368.99ms | **327.75ms** | **0.89x** | **2,677x** |

**At n = 32,000 the stable version performs 2,677 times the writes and finishes
measurably faster.**

The reason is that neither version's writes are where the time goes. Both perform
the same n(n-1)/2 comparisons, and that scan dominates completely; the shift is a
short contiguous block move of exactly the kind hardware is fastest at, while the
swap saves writes the machine was never charged much for.

This is the same result **Left Rotate Array by K Places** measured for the
juggling algorithm: the write-optimal method lost by 2.5x to 24.8x there and
never won once. The cost model has to match the machine. Selection sort's
minimum-write property is genuinely valuable — in a model where writes are the
expensive operation, which a CPU is not.

**So on ordinary hardware, take the stable version.** You are not paying for it.

## The comparison count is fixed and the runtime is not

The counts above say every input costs the same. The clock disagrees. At
n = 16,000, median of nine:

| Input | Time |
|---|---|
| Already sorted | 46.33ms |
| All equal | 50.03ms |
| Reverse sorted | 59.15ms |
| **Random** | **114.13ms** |

**A 2.46x spread with the comparison count held exactly constant.**

Move Zeros to End found a 5.5x spread from branch misprediction, so that is the
natural suspect — and here it is the wrong one. Clang compiles the inner loop
**branchless**, selecting the minimum index with a conditional move:

```
ldr   w16, [x8, x15, lsl #2]     ; load arr[j]
ldr   w17, [x8, w14, sxtw #2]    ; load arr[minIdx]  <- address depends on minIdx
cmp   w16, w17
csel  w14, w15, w14, lt          ; minIdx = select, no jump
```

There is no data-dependent branch to mispredict. What there is instead is
**two loads per comparison**, and the second one's address is computed from the
loop-carried `minIdx`.

The fix confirms the diagnosis. Carry the minimum **value** alongside the index,
so the loop loads only `arr[j]`:

| Input | Index only | Value cached |
|---|---|---|
| Sorted | 46.33ms | 89.46ms |
| All equal | 50.03ms | 82.82ms |
| Reverse | 59.15ms | 86.73ms |
| Random | 114.13ms | 82.20ms |
| **Spread** | **2.46x** | **1.09x** |

Caching the value **flattens the input dependence almost completely** — and is
slower on the inputs where the second load was cheap. The trade is real in both
directions, which is why it is a separate approach below rather than a fix.

Neither loop vectorises; clang reports *"value that could not be identified as
reduction is used outside the loop"* for both, the same refusal Kadane's algorithm
draws.

## Speed, honestly

At n = 16,000 on random input: selection **114.13ms**, insertion **22.31ms**, and
`std::sort` **0.2596ms**.

Selection sort is beaten by insertion sort by 5.1x on random data and by
`std::sort` by **440x**. Bubble sort also came out ahead on random input —
**75.50ms against 114.13ms**, a factor of **1.51** — and over forty alternated
samples each the two sets did not overlap. Read that ranking weakly: 1.51x is a
small gap by this topic's standards, and bubble sort's was the least stable
measurement in the set, moving between 64ms and 87ms across runs of the same
session while selection sort held near 114ms. On structured input they diverge
completely, where bubble sort's early exit wins by four orders of magnitude and
selection sort's indifference to input shape is the more predictable behaviour.

Selection sort is quadratic and it scales like it — 0.82ms, 3.11ms, 11.23ms,
37.54ms and 114.13ms at n = 1,000 through 16,000, roughly quadrupling each time
the input doubles.

Python is the same story with one addition: there the input-independence
survives, because the interpreter dominates and the memory effects that produced
the C++ spread disappear. At n = 2,000, median of seven: **49.35ms sorted, 51.94ms
reverse, 48.28ms random** — 1.08x apart. Replacing the inner loop with
`min()` and `index()` moves both scans into C and measured **21.64ms against
48.28ms**, about 2.23x, at the cost of walking the tail twice.

## Where this goes next

**Bubble Sort** and **Insertion Sorting** are the same O(n²) budget spent
differently — both are adaptive where this is not, and both are stable where this
is not. The running-candidate scan in the inner loop is **Largest Element**. And
the selection idea itself survives into heapsort, where the "find the minimum"
step becomes O(log n) instead of O(n) and the whole algorithm becomes O(n log n).

<!-- @intuition -->
You are sorting a hand of cards by repeatedly taking the lowest card left and putting it at the front. The distinctive thing about doing it this way is that you must look at every remaining card to know which is lowest — you cannot stop early, because the lowest might be the last one you turn over. That is why this sort never gets faster on easy input, and it is the price of its one virtue: having found the right card, you move exactly one card into place and never touch it again. The rest of the subtopic is discovering that the virtue is priced for a machine you are probably not using.

<!-- @approach -->
### Brute Force - Extract the Minimum into a New Array

<!-- @idea -->
Repeatedly find the smallest remaining element, remove it from the input, and append it to a fresh array.

<!-- @steps -->
1. Create an empty output array.
2. While the input still holds elements, scan it to find the smallest one.
3. Remove that element from the input.
4. Append it to the end of the output array.
5. Return the output, which is now in ascending order.

<!-- @complexity -->
- time: O(n^2)
- space: O(n) for the output, plus the shifting cost of removing from the middle
- note: Correct — 0 wrong over 3,000 random arrays — and it allocates a second array to avoid a swap. It is worth writing once because it states the selection idea plainly before the in-place version obscures it. In Python it measured FASTER than the in-place loop, 16.80ms against 48.28ms at n = 2,000, because min and remove both run as compiled C.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<int> selectionSortCopy(vector<int> arr) {
    vector<int> out;
    out.reserve(arr.size());

    while (!arr.empty()) {
        auto it = min_element(arr.begin(), arr.end());
        out.push_back(*it);
        arr.erase(it);                 // O(n): shifts everything after it
    }
    return out;
}
```

<!-- @annotations -->
- 5: Taking the vector by value, so the caller's data survives — this approach cannot sort in place anyway.
- 10: min_element is the same running-candidate scan the in-place version writes out by hand.
- 12: erase moves every later element, which is a second O(n) factor on top of the scan.

<!-- @code java -->
```java
import java.util.ArrayList;
import java.util.List;

static List<Integer> selectionSortCopy(int[] arr) {
    List<Integer> src = new ArrayList<>();
    for (int x : arr) src.add(x);

    List<Integer> out = new ArrayList<>();
    while (!src.isEmpty()) {
        int m = 0;
        for (int i = 1; i < src.size(); i++)
            if (src.get(i) < src.get(m)) m = i;
        out.add(src.remove(m));
    }
    return out;
}
```

<!-- @annotations -->
- 6: Boxing every int into an Integer, which the in-place version on a primitive array never does.
- 13: remove from the middle of an ArrayList shifts the tail, exactly as vector::erase does.

<!-- @code python -->
```python
def selection_sort_copy(arr):
    src = list(arr)          # do not consume the caller's list
    out = []
    while src:
        m = min(src)
        src.remove(m)        # finds it again and shifts the tail
        out.append(m)
    return out


# Measured 16.80ms at n = 2,000 against 48.28ms for the in-place loop,
# because min and remove are C-level scans and the loop is interpreted.
```

<!-- @annotations -->
- 5: min scans the whole list, and remove then scans it AGAIN to locate the same value.
- 6: Two passes per element where one would do, and still faster than an interpreted single pass.

<!-- @approach -->
### Selection Sort - Swap the Minimum into Place

<!-- @idea -->
Find the index of the smallest element in the unsorted tail and swap it into the first unsorted position.

<!-- @steps -->
1. Loop the boundary i from 0 up to but not including n minus one.
2. Assume the element at i is the smallest, recording its index rather than its value.
3. Scan every position from i plus one to the end, updating the recorded index whenever a smaller element appears.
4. If the recorded index is not i, swap those two elements.
5. Position i now holds its final value and is never touched again.

<!-- @complexity -->
- time: O(n^2) always — exactly n(n-1)/2 comparisons on every input, with no best case
- space: O(1)
- note: At most n - 1 swaps, verified over 20,000 random arrays with zero exceptions — 11,976 element writes at n = 4,000 against insertion sort's 4,015,043. Measured 114.13ms at n = 16,000 on random input, against 22.31ms for insertion sort and 0.2596ms for std::sort.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void selectionSort(vector<int>& arr) {
    int n = arr.size();

    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;                                 // the INDEX, not the value
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        if (minIdx != i) swap(arr[i], arr[minIdx]);
    }
}
```

<!-- @annotations -->
- 8: n - 1, not n. The last element is already the minimum of a one-element tail, so the final pass can only compare it with itself.
- 9: Recording the index is what makes the swap possible. Recording the value instead is wrong on 98.49% of arrays, with [1,0] returning [0,0].
- 10: j starts at i + 1 because arr[i] is already the candidate. Starting at i costs exactly n - 1 wasted self-comparisons and is otherwise harmless.
- 11: No early exit exists here — the minimum could be the very last element, so the scan always runs to the end.
- 13: The guard. Without it an already-sorted array performs n - 1 self-swaps: measured 2,997 writes against 0 at n = 1,000.

<!-- @code java -->
```java
static void selectionSort(int[] arr) {
    int n = arr.length;

    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        if (minIdx != i) {
            int t = arr[i]; arr[i] = arr[minIdx]; arr[minIdx] = t;
        }
    }
}
```

<!-- @annotations -->
- 4: After this pass, arr[0..i] holds the i+1 smallest elements in their FINAL positions — a stronger invariant than bubble or insertion sort maintains.
- 6: This inner loop is Largest Element's running-candidate scan with the comparison flipped.
- 10: Three writes per swap, and at most n - 1 swaps, which is the whole of this algorithm's case for existing.

<!-- @code python -->
```python
def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            arr[i], arr[min_idx] = arr[min_idx], arr[i]


# The idiomatic shortcut, about 2.23x faster because both scans run in C:
#     min_idx = i + arr[i:].index(min(arr[i:]))
# It walks the tail twice and copies it — measured 21.64ms against
# 48.28ms at n = 2,000.
```

<!-- @annotations -->
- 3: range(n - 1) rather than range(n), since the final one-element tail has nothing to choose from.
- 9: Tuple assignment evaluates the right side first, so no temporary is needed and the swap cannot be written in the wrong order.
- 12: Measured flat across input shapes in Python — 49.35ms sorted, 51.94ms reverse, 48.28ms random — 1.08x apart.

<!-- @approach -->
### Cache the Minimum Value

<!-- @idea -->
Carry the minimum value beside its index so the inner loop performs one load per comparison instead of two.

<!-- @steps -->
1. Loop the boundary i as before.
2. Record both the index of the candidate minimum and its value.
3. Scan the tail, loading each element once and comparing it against the cached value.
4. When an element is smaller, update both the cached value and the index.
5. Place the cached minimum directly, which costs two writes rather than a three-write swap.

<!-- @complexity -->
- time: O(n^2), the same n(n-1)/2 comparisons
- space: O(1)
- note: One load per comparison instead of two, which removes the runtime's dependence on the input shape — measured spread 1.09x against 2.46x for the index-only form. It is not uniformly faster: 82.20ms against 114.13ms on random input at n = 16,000, and 89.46ms against 46.33ms on sorted input. It also drops the swap from three writes to two, measured 7,984 against 11,976 at n = 4,000.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void selectionSort(vector<int>& arr) {
    int n = arr.size();

    for (int i = 0; i < n - 1; i++) {
        int minIdx = i, minVal = arr[i];
        for (int j = i + 1; j < n; j++) {
            int v = arr[j];                  // the ONLY load in the loop
            if (v < minVal) { minVal = v; minIdx = j; }
        }
        if (minIdx != i) {
            arr[minIdx] = arr[i];            // two writes, not three
            arr[i] = minVal;
        }
    }
}
```

<!-- @annotations -->
- 8: Carrying the value as well as the index is the whole change.
- 10: The index-only form reloads arr[minIdx] here at an address computed from the loop-carried index, which is what made its runtime vary 2.46x with the input.
- 13: No temporary is needed because minVal already holds what arr[minIdx] contains.
- 14: Measured spread across sorted, all-equal, reverse and random input: 1.09x, against 2.46x for the index-only form.

<!-- @code java -->
```java
static void selectionSort(int[] arr) {
    int n = arr.length;

    for (int i = 0; i < n - 1; i++) {
        int minIdx = i, minVal = arr[i];
        for (int j = i + 1; j < n; j++) {
            int v = arr[j];
            if (v < minVal) { minVal = v; minIdx = j; }
        }
        if (minIdx != i) {
            arr[minIdx] = arr[i];
            arr[i] = minVal;
        }
    }
}
```

<!-- @annotations -->
- 7: Reading arr[j] once into a local, so the comparison touches memory a single time.
- 11: The two-write placement, which is only possible because the value was already in hand.

<!-- @code python -->
```python
def selection_sort(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx, min_val = i, arr[i]
        for j in range(i + 1, n):
            v = arr[j]
            if v < min_val:
                min_val, min_idx = v, j
        if min_idx != i:
            arr[min_idx] = arr[i]
            arr[i] = min_val


# Worth almost nothing in Python: 45.71ms against 48.28ms at n = 2,000.
# The effect it removes is a memory effect, and the interpreter's own
# cost per element dwarfs it entirely.
```

<!-- @annotations -->
- 6: The saved load is real in C++ and invisible here, because every one of these lines is an interpreted step.

<!-- @approach -->
### Stable Selection Sort - Shift Instead of Swap

<!-- @idea -->
Move the minimum into place by shifting the block between it and the boundary right by one, so no element ever jumps over an equal twin.

<!-- @steps -->
1. Find the index of the smallest element in the unsorted tail, exactly as before.
2. If it is already at the boundary, do nothing.
3. Otherwise take a copy of the minimum value.
4. Shift every element from the boundary up to just before the minimum one position to the right.
5. Write the minimum into the boundary position, having displaced nothing across anything equal to it.

<!-- @complexity -->
- time: O(n^2), the same n(n-1)/2 comparisons plus up to O(n) shifting per pass
- space: O(1)
- note: Stable — verified over all 3,279 arrays of length 1 to 7 from three symbols with 0 unstable results, against 60.29% for the swap version. It performs 4,015,034 writes at n = 4,000 against 11,976, and measured 327.75ms against 368.99ms at n = 32,000 — 2,677 times the writes at 0.89x the time.

<!-- @code cpp -->
```cpp
#include <vector>
#include <cstring>
using namespace std;

void selectionSortStable(vector<int>& arr) {
    int n = arr.size();

    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        if (minIdx != i) {
            int v = arr[minIdx];
            memmove(&arr[i + 1], &arr[i], (size_t)(minIdx - i) * sizeof(int));
            arr[i] = v;
        }
    }
}
```

<!-- @annotations -->
- 11: Strictly less than, not less than or equal. Using <= would latch the LAST equal minimum and reintroduce the instability this version exists to remove.
- 14: The value must be saved before the shift, because the shift overwrites the slot it came from.
- 15: A contiguous block move, which is the kind of write the hardware is fastest at — this is why 2,677x the writes cost nothing measurable.
- 16: The minimum lands at the boundary having passed over nothing, so equal elements keep their original order.

<!-- @code java -->
```java
static void selectionSortStable(int[] arr) {
    int n = arr.length;

    for (int i = 0; i < n - 1; i++) {
        int minIdx = i;
        for (int j = i + 1; j < n; j++) {
            if (arr[j] < arr[minIdx]) minIdx = j;
        }
        if (minIdx != i) {
            int v = arr[minIdx];
            System.arraycopy(arr, i, arr, i + 1, minIdx - i);
            arr[i] = v;
        }
    }
}
```

<!-- @annotations -->
- 11: arraycopy handles the overlapping source and destination correctly, behaving like memmove rather than memcpy.
- 12: Verified stable over all 3,279 arrays of length 1 to 7 from three symbols, against 60.29% unstable for the swap version.

<!-- @code python -->
```python
def selection_sort_stable(arr):
    n = len(arr)
    for i in range(n - 1):
        min_idx = i
        for j in range(i + 1, n):
            if arr[j] < arr[min_idx]:
                min_idx = j
        if min_idx != i:
            v = arr.pop(min_idx)     # removing shifts the block left...
            arr.insert(i, v)         # ...and inserting shifts it back right


# On [1a, 1b, 0] this gives 0, 1a, 1b where the swap version gives
# 0, 1b, 1a. Python's own sort is already stable, so in practice
# reach for sorted() rather than either of these.
```

<!-- @annotations -->
- 9: pop and insert together perform the same block shift the C++ version does with memmove.
- 10: The shift is what preserves the order of equal elements — nothing is ever thrown across the array.

<!-- @example -->

<!-- @input -->
arr = [64, 25, 12, 22, 11]

<!-- @output -->
[11, 12, 22, 25, 64] — 10 comparisons and 3 swaps

<!-- @why -->
Small enough to trace by hand, and its last pass finds the minimum already in place, which is the case the swap guard exists for.

<!-- @walkthrough -->
1. Pass i = 0 scans 25, 12, 22 and 11, finds the minimum 11 at index 4, and swaps it to the front, giving [11, 25, 12, 22, 64].
2. Pass i = 1 scans 12, 22 and 64, finds 12 at index 2, and swaps, giving [11, 12, 25, 22, 64].
3. Pass i = 2 scans 22 and 64, finds 22 at index 3, and swaps, giving [11, 12, 22, 25, 64].
4. Pass i = 3 scans only 64, and the minimum of that one-element tail is the 25 already sitting at index 3.
5. Since the recorded index equals i, the guard skips the swap and no write occurs on this pass.
6. The comparison counts were 4, 3, 2 and 1, totalling 10 — exactly n(n-1)/2 for n = 5.
7. Three swaps were performed, which is within the n - 1 = 4 bound, and every element settled into its final position the moment it was placed.

<!-- @example -->

<!-- @input -->
arr = [1a, 1b, 0], the two 1s labelled by where they started

<!-- @output -->
[0, 1b, 1a] — the equal elements come out reversed

<!-- @why -->
The smallest input that exposes the instability, and instability turns out to be the normal case rather than an edge case — 60.29% of all small arrays with duplicates.

<!-- @walkthrough -->
1. Pass i = 0 scans the tail and finds the minimum 0 at index 2.
2. Swapping index 0 with index 2 sends 1a all the way to the back, over the top of 1b.
3. The array is now [0, 1b, 1a], and 1a began before 1b.
4. Pass i = 1 scans index 2, finds 1a is not strictly less than 1b, and leaves the recorded index at 1.
5. No further swap occurs, so the reversed pair survives to the output.
6. Measured over all 3,279 arrays of length 1 to 7 drawn from three symbols, 1,977 came out unstable — 60.29%.
7. There are no failures at n = 1 or n = 2 and exactly 3 at n = 3, so this three-element array is the smallest possible demonstration.

<!-- @example -->

<!-- @input -->
The stable shift variant against the swap variant at n = 32,000

<!-- @output -->
2,677 times the writes, and 0.89x the time

<!-- @why -->
Selection sort's only theoretical advantage is its write count, and this is the measurement that shows the advantage buying nothing on the machine most people run.

<!-- @walkthrough -->
1. The swap version performs at most n - 1 swaps, measured 95,964 element writes at n = 32,000.
2. The stable version shifts a block on every pass instead, measured 256,928,527 writes on the same input.
3. That is 2,677 times as many writes, which by an operation count should be decisive.
4. Measured median of nine runs: 368.99ms for the swap version and 327.75ms for the stable one.
5. The stable version is marginally faster, so the entire write advantage is worth less than measurement noise.
6. Both perform the identical n(n-1)/2 comparisons, and that scan is where essentially all the time goes.
7. Left Rotate Array by K Places measured the same shape of result for the juggling algorithm, which was write-optimal and lost by 2.5x to 24.8x.

<!-- @example -->

<!-- @input -->
The same 16,000 elements arranged four ways, comparison count held constant

<!-- @output -->
46.33ms, 50.03ms, 59.15ms and 114.13ms — a 2.46x spread

<!-- @why -->
Isolates a runtime difference that no operation count can explain, and the usual suspect from Move Zeros to End turns out to be the wrong one.

<!-- @walkthrough -->
1. Already sorted, all equal, reverse sorted and random inputs all perform exactly 127,992,000 comparisons.
2. Measured, they took 46.33ms, 50.03ms, 59.15ms and 114.13ms respectively.
3. Move Zeros to End produced a 5.5x spread on a similar experiment, caused by branch misprediction.
4. That is not the cause here: clang compiles this inner loop branchless, selecting the minimum index with a csel instruction and leaving only the loop counter as a jump.
5. What the loop does have is two loads per comparison, and the second one's address is computed from the loop-carried minimum index.
6. Caching the minimum value so only arr[j] is loaded reduced the spread from 2.46x to 1.09x, which confirms the second load as the cause.
7. In Python the spread does not appear at all — 49.35ms, 51.94ms and 48.28ms — because the interpreter's per-element cost dwarfs any memory effect.

<!-- @visualization array -->

<!-- @description -->
The array as a horizontal strip with a hard vertical divider between the settled prefix and the unsorted tail, and the settled region tinted permanently rather than provisionally — that permanence is the invariant and it is what distinguishes this sort from the other two, so it must be visible from the first pass. A boundary marker sits at i on the divider, and a scanning marker sweeps the tail. Carry a MINIMUM badge above the strip holding an index rather than a value, and draw a visible tether from the badge down to the cell it points at, so the badge relocating is seen as a pointer moving rather than a number changing — that distinction is exactly the bug the badge exists to prevent. On each step draw the comparison arc between the scanned cell and the tethered cell; when a smaller element is found the tether snaps to the new cell and a counter ticks. Crucially, let the scan run all the way to the end of the strip every single pass, even when the minimum was found on the first cell, and label that as no early exit — the absence of a stopping condition is the reason this sort has no best case, and it should be felt as tedium rather than read as a sentence. Run a comparison counter that is identical on every input, beside a swap counter that is not. Then the swap: animate the minimum and the boundary element exchanging in a single arc, and hold the frame as the boundary element flies backwards across the array — because that flight is precisely what breaks stability. A stability panel replays [1a, 1b, 0] with the two 1s drawn in distinguishable shades: the swap track sends 1a over 1b and lands them reversed, while a parallel shift track slides the block right by one and lands them in order, both reaching the same values with different provenance. Beneath, two write counters climb — the swap track by 3 per pass at most, the shift track by up to n per pass — with the final tallies 95,964 against 256,928,527 at n = 32,000, and then a time bar underneath showing 368.99ms against 327.75ms, drawn deliberately equal. That contradiction between the write meters and the time bar is the centre of the whole figure and should be held longest. Close with an input-shape panel: four strips of identical length running side by side with a shared comparison counter that stays locked in step across all four, and four separate clocks that visibly diverge to 46.33, 50.03, 59.15 and 114.13 milliseconds — annotated with the two loads per comparison, one streaming and one at an address that follows the minimum badge.

<!-- @sampleInput -->
```json
{"primary":{"array":[64,25,12,22,11],"trace":[{"i":0,"scanned":[25,12,22,11],"minIdx":4,"minVal":11,"swapped":true,"after":[11,25,12,22,64],"comparisons":4},{"i":1,"scanned":[12,22,64],"minIdx":2,"minVal":12,"swapped":true,"after":[11,12,25,22,64],"comparisons":3},{"i":2,"scanned":[22,64],"minIdx":3,"minVal":22,"swapped":true,"after":[11,12,22,25,64],"comparisons":2},{"i":3,"scanned":[64],"minIdx":3,"minVal":25,"swapped":false,"after":[11,12,22,25,64],"comparisons":1}],"result":[11,12,22,25,64],"comparisons":10,"formula":"n(n-1)/2","swaps":3,"swapBound":4},"invariant":"after pass i, arr[0..i] holds the i+1 smallest elements in their FINAL positions","comparisonCount":{"inputIndependent":true,"distinctValuesAcrossShapes":1,"rows":[{"n":10,"comparisons":45},{"n":100,"comparisons":4950},{"n":1000,"comparisons":499500},{"n":4000,"comparisons":7998000}],"noEarlyExit":"the minimum may be the last element scanned, so the tail is always traversed in full"},"writes":{"n":4000,"selectionSwap":11976,"selectionStableShift":4015034,"insertion":4015043,"bubble":12033132,"byShape":{"sorted":0,"allequal":0,"reverse":6000,"random":11976,"nMinus1":3999},"guardEffect":{"n":1000,"guarded":0,"unguarded":2997},"twoWriteForm":{"n":4000,"threeWrite":11976,"twoWrite":7984},"swapBoundExceptions":{"arraysTested":20000,"over":0}},"stability":{"swapBased":{"arraysTested":3279,"unstable":1977,"rate":0.6029,"failuresByLength":{"1":0,"2":0,"3":3,"4":20,"5":98,"6":397,"7":1459}},"shiftBased":{"arraysTested":3279,"unstable":0},"smallestFailure":{"values":[1,1,0],"selectionTags":["c","b","a"],"stableTags":["c","a","b"]}},"stableTradeoff":{"rows":[{"n":4000,"swapMs":11.23,"stableMs":11.25,"ratio":1.00,"writeRatio":335},{"n":16000,"swapMs":114.13,"stableMs":109.19,"ratio":0.96,"writeRatio":1344},{"n":32000,"swapMs":368.99,"stableMs":327.75,"ratio":0.89,"writeRatio":2677,"swapWrites":95964,"stableWrites":256928527}],"reading":"2,677 times the writes at 0.89x the time \u2014 the minimum-write property buys nothing on a CPU","echoes":"left-rotate-array-by-k-places measured the juggling algorithm 2.5x to 24.8x slower while write-optimal"},"inputShape":{"n":16000,"comparisonsAllShapes":127992000,"selection":{"sorted":46.33,"allequal":50.03,"reverse":59.15,"random":114.13},"spread":2.46,"onSortedInput":{"bubble":0.0053,"insertion":0.0070,"selection":46.33,"selectionSlowerBy":8742},"onRandomInput":{"insertion":22.31,"stdSort":0.2596,"bubble":{"ms":75.50,"note":"measured faster than selection by 1.51x; sample sets did not overlap, but bubble ranged 64-87ms across runs while selection held near 114ms"}}},"loadDiagnosis":{"branchless":true,"instruction":"csel","vectorized":false,"vectorizerMessage":"value that could not be identified as reduction is used outside the loop","indexOnly":{"sorted":46.33,"allequal":50.03,"reverse":59.15,"random":114.13,"spread":2.46},"valueCached":{"sorted":89.46,"allequal":82.82,"reverse":86.73,"random":82.20,"spread":1.09},"cause":"two loads per comparison; the second address is computed from the loop-carried minimum index"},"bugPanel":[{"name":"track the min VALUE, assign it","wrongRate":0.9849,"arraysTested":21844,"smallest":[1,0],"produces":[0,0]},{"name":"swap inside the inner loop","wrong":0,"correct":true,"writesAtN1000":{"reverse":{"canonical":1500,"variant":1498500,"ratio":999},"random":{"canonical":2970,"variant":719436,"ratio":242}}},{"name":"inner loop starts at i","wrong":0,"extraComparisons":"exactly n - 1"},{"name":"outer loop runs to n","wrong":0,"note":"the final pass compares a one-element tail with itself"}],"scaling":{"random":[{"n":1000,"ms":0.82},{"n":2000,"ms":3.11},{"n":4000,"ms":11.23},{"n":8000,"ms":37.54},{"n":16000,"ms":114.13}],"stdSortAt16000":0.2596,"vsStdSort":440},"python":{"n":2000,"selection":{"sorted":49.35,"reverse":51.94,"random":48.28,"spread":1.08},"minIndexIdiom":{"random":21.64,"speedup":2.23},"insertion":{"sorted":0.130,"random":55.40},"bubble":{"sorted":0.059,"random":109.10},"sortedBuiltin":{"random":0.116},"bruteExtractVsInPlace":{"n":2000,"extract":16.80,"inPlace":48.28}}}
```

<!-- @highlights -->
- The strip carries a hard divider between the settled prefix and the unsorted tail, with the settled region tinted permanently rather than provisionally.
- That permanence is the invariant: after pass i, those cells are in their final positions and will never move again.
- A MINIMUM badge above the strip holds an index and tethers down to the cell it points at, so relocating it reads as a pointer moving rather than a number changing.
- The scan sweeps the tail and the comparison arc fires on every cell, the tether snapping across whenever something smaller appears.
- The scan runs to the very end of the strip on every pass, even when the minimum was found immediately — labelled no early exit.
- That absence of a stopping condition is why this sort has no best case, and it is felt as tedium rather than read as a sentence.
- The comparison counter reads identically on every input while the swap counter does not.
- On the swap, the boundary element flies backwards across the array in a single arc, and the frame is held there.
- That flight is exactly what breaks stability, so it is the frame the stability panel then replays.
- The stability panel runs [1a, 1b, 0] with the two 1s in distinguishable shades: the swap track lands them reversed, the shift track lands them in order.
- Two write meters climb beneath — at most 3 per pass for the swap track, up to n per pass for the shift track.
- Their final tallies read 95,964 against 256,928,527 at n = 32,000.
- The time bar underneath reads 368.99ms against 327.75ms, drawn deliberately equal.
- That contradiction between the write meters and the time bar is the centre of the figure and is held longest.
- The input-shape panel runs four strips of identical length with one shared comparison counter locked in step across all four.
- Four separate clocks diverge to 46.33, 50.03, 59.15 and 114.13 milliseconds, annotated with the two loads per comparison — one streaming, one following the minimum badge.

<!-- @edgeCases -->
- Empty array — n - 1 is negative, so the outer loop never runs and nothing happens; no guard is needed in any of the three languages.
- Single-element array — the outer loop condition is false immediately, and the element is trivially in place.
- Two elements — the smallest input where a swap can occur, and one comparison decides it.
- Already sorted input — still costs the full n(n-1)/2 comparisons, and performs zero writes because of the guard.
- All elements equal — zero swaps, since no element is ever strictly less than the candidate.
- Reverse sorted input — about n/2 swaps rather than n - 1, because each swap fixes two positions at once.
- Duplicate values present — the case where the swap version's instability appears, on 60.29% of small arrays.
- The minimum already sitting at the boundary — the guard skips the swap, which is what makes the sorted case free of writes.
- Two elements tying for the minimum — the strict less-than keeps the first, and using less-than-or-equal would keep the last and worsen the instability.
- Very large arrays — the comparisons dominate everything, so at n = 32,000 the stable variant's 2,677x extra writes cost nothing measurable.
- Negative values and zeros — nothing in the algorithm depends on sign, only on the ordering comparison.

<!-- @pitfalls -->
- Recording the minimum VALUE instead of its index. There is then nowhere to put the displaced element — measured wrong on 98.49% of 21,844 arrays, with [1,0] returning [0,0].
- Assuming selection sort is faster on sorted input. Its comparison count is exactly n(n-1)/2 on every input, measured identical across four shapes at n = 10, 100, 1,000 and 4,000.
- Adding an early exit when a pass performs no swap. That test detects nothing here — a pass with no swap only means the minimum was already at the boundary, not that the array is sorted.
- Assuming it is stable. Measured unstable on 60.29% of small arrays with duplicates, with [1,1,0] the smallest case.
- Swapping inside the inner loop instead of after it. It is still correct — 0 wrong over 20,000 arrays — and it performs 999x the writes on reverse-sorted input at n = 1,000, destroying the one property worth having.
- Omitting the minIdx != i guard. An already-sorted array then performs n - 1 self-swaps, measured 2,997 writes against 0 at n = 1,000.
- Using <= rather than < in the inner comparison. It latches the last equal minimum instead of the first, which is slower to no purpose and makes the instability worse.
- Trading stability away for the write count without measuring. At n = 32,000 the stable variant performs 2,677x the writes at 0.89x the time.
- Running the outer loop to n rather than n - 1. Harmless — 0 wrong over 21,844 arrays — and the final pass can only compare a one-element tail against itself.
- Starting the inner loop at i rather than i + 1. Also harmless, and it costs exactly n - 1 wasted self-comparisons.
- Reaching for selection sort because it is simple. Measured 5.1x slower than insertion sort and 440x slower than std::sort on random input at n = 16,000.
- Benchmarking it on sorted data. That is its fastest case at 46.33ms and its slowest is 114.13ms, so a sorted benchmark understates it by 2.5x.

<!-- @doubt -->
### Why does selection sort take just as long on an already-sorted array?

<!-- @answer -->
Because nothing in it can detect that the array is sorted. Each pass has to scan the entire remaining tail to know which element is smallest, and the smallest could be the very last one examined — so there is no point at which the scan can legitimately stop early. That makes the comparison count exactly n(n-1)/2 regardless of the input, measured identical across sorted, reverse-sorted, random and all-equal arrays at n = 10, 100, 1,000 and 4,000. Bubble sort and insertion sort both finish a sorted array in O(n); measured at n = 16,000 bubble took 0.0053ms and insertion 0.0070ms, where selection sort took 46.33ms. The obvious rescue does not work either: adding an early exit when a pass performs no swap detects nothing, because a pass with no swap only means the minimum of the tail already sat at the boundary. [1, 5, 4, 3, 2] swaps nothing on its first pass and is nowhere near sorted. That test works in bubble sort because a swap-free pass there has compared every adjacent pair; here it has compared nothing of the kind.

<!-- @doubt -->
### Why track the index of the minimum rather than its value?

<!-- @answer -->
Because you have to know where it came from in order to swap it, and a version that remembers only the value has nowhere to put the element it is displacing. Writing the minimum value into position i simply overwrites whatever was there. Measured over all 21,844 arrays of length 1 to 7 from four symbols, that is wrong on 98.49% of them, and the smallest failure is two elements: [1, 0] comes back as [0, 0] with the 1 destroyed. If you want to carry the value too, do — that is the value-cached approach, and it keeps the index alongside it.

<!-- @doubt -->
### Is selection sort stable?

<!-- @answer -->
The swap-based version is not, and it is not a rare failure. The swap that brings the minimum forward throws whatever was at the boundary across the array, potentially over the top of elements equal to it. The smallest case is three elements: [1a, 1b, 0] becomes [0, 1b, 1a], with 1a ending after 1b although it started before. Measured over all 3,279 arrays of length 1 to 7 from three symbols, 60.29% came out unstable. There are no failures at n = 1 or n = 2, and exactly 3 at n = 3.

<!-- @doubt -->
### Can I make it stable, and what does it cost?

<!-- @answer -->
Yes — shift instead of swap. Rather than exchanging the minimum with the boundary element, slide the whole block between them one position right and drop the minimum into the hole. Nothing passes over anything, so equal elements keep their order; verified over the same 3,279 arrays with zero unstable results. On paper it is expensive, turning at most n - 1 swaps into up to n writes per pass — 4,015,034 writes at n = 4,000 against 11,976. Measured, it costs nothing at all: 327.75ms against 368.99ms at n = 32,000, where it performed 2,677 times the writes. Take the stable version.

<!-- @doubt -->
### Then what is the point of the minimum-write property?

<!-- @answer -->
It is real, and it is priced for a machine you are probably not using. Selection sort performs at most n - 1 swaps whatever the input — verified over 20,000 arrays with zero exceptions — which is 11,976 element writes at n = 4,000 against insertion sort's 4,015,043 and bubble sort's 12,033,132. Where a write genuinely costs more than a read, that is decisive: flash memory with limited erase cycles, a structure where each assignment triggers work, or one network round trip per element. On a CPU the comparisons dominate and the writes are nearly free, which is why the stable variant's 2,677x extra writes were unmeasurable. Left Rotate Array by K Places found exactly this for the juggling algorithm, which was write-optimal and lost by 2.5x to 24.8x.

<!-- @doubt -->
### Why is it slower on random input if the comparison count is identical?

<!-- @answer -->
Because the comparisons cost different amounts depending on where the minimum index sits. Measured at n = 16,000 with the comparison count fixed at 127,992,000: sorted 46.33ms, all-equal 50.03ms, reverse 59.15ms, random 114.13ms — a 2.46x spread. Branch misprediction is the obvious suspect and it is the wrong one, because clang compiles the inner loop branchless, choosing the minimum index with a csel and leaving only the loop counter as a jump. The real cause is that the loop performs two loads per comparison and the second one's address is computed from the loop-carried minimum index. Caching the minimum value so only arr[j] is loaded dropped the spread from 2.46x to 1.09x.

<!-- @doubt -->
### Should I always cache the minimum value then?

<!-- @answer -->
Only if you care about predictability more than best-case speed, because it is not uniformly faster. Measured at n = 16,000: on random input it wins, 82.20ms against 114.13ms; on sorted input it loses badly, 89.46ms against 46.33ms. What it buys is a runtime that barely moves with the input — a spread of 1.09x against 2.46x — plus a two-write placement instead of a three-write swap, measured 7,984 against 11,976 at n = 4,000. In Python it buys nothing at all, 45.71ms against 48.28ms, because the effect it removes is a memory effect and the interpreter dwarfs it.

<!-- @doubt -->
### Why swap after the inner loop rather than as soon as I find something smaller?

<!-- @answer -->
Swapping inside the inner loop is still correct — verified over 20,000 random arrays with zero failures — and it throws away the only reason to use this algorithm. Every element smaller than the current boundary value triggers its own swap instead of one swap per pass. Measured at n = 1,000: on reverse-sorted input it performed 1,498,500 writes against the canonical 1,500, a factor of 999, and on random input 719,436 against 2,970, a factor of 242. The whole point of recording the index is to defer the write until you know the final answer.

<!-- @doubt -->
### Should the loops be i < n - 1 and j = i + 1?

<!-- @answer -->
Yes, and both alternatives are harmless rather than wrong, which is worth knowing so you can recognise either form in someone else's code. Running the outer loop to n adds a final pass over a one-element tail, whose minimum is necessarily the element itself — 0 wrong over 21,844 arrays. Starting the inner loop at i compares the candidate with itself once per pass, which can never change the answer; it costs exactly n - 1 extra comparisons across the whole sort. Prefer n - 1 and i + 1 because they say what is true: the last position needs no pass, and the boundary element is already the candidate.

<!-- @doubt -->
### Which of the three basic sorts should I actually use?

<!-- @answer -->
None of them, for real work — measured at n = 16,000 on random input, std::sort took 0.2596ms against selection sort's 114.13ms, a factor of 440. Among the three, insertion sort is the practical one: 22.31ms on the same input, 5.1x faster than selection sort, and it is both adaptive and stable. Selection sort earns its place in exactly one setting, when writes are the expensive operation. Learn it for two other reasons: its inner loop is Largest Element's running-candidate scan, and the selection idea itself becomes heapsort once finding the minimum drops from O(n) to O(log n).
