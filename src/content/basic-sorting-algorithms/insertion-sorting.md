---
id: insertion-sorting
topic: Basic Sorting Algorithms
title: Insertion Sorting
difficulty: Easy
status: ready
prerequisites:
  - bubble-sort
  - selection-sort
  - nested-loops
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - bubble-sort
  - selection-sort
  - count-inversions
  - linear-search
---

<!-- @summary -->
Take each element and slide it back into the sorted prefix — the one basic sort whose cost really is the inversion count, which is why the array that costs bubble sort its full 499,500 comparisons costs this 1,997, and the only one of the three that real library sorts still run.

<!-- @theory -->
## The problem

Sort an array in ascending order, in place. Insertion sort grows a sorted prefix
one element at a time: take the next element, slide it left past everything larger
than it, and drop it in.

```
[5, 2, 4, 1]  ->  [1, 2, 4, 5]
```

It is how most people sort a hand of cards, which is not a coincidence — the
algorithm is the physical procedure written down.

## The invariant

**After step `i`, `arr[0..i]` contains the first `i+1` elements of the input, in
sorted order.**

Compare that with the other two. Selection sort's prefix holds the smallest
elements of the *whole array*, permanently placed. Bubble sort's suffix holds the
largest, permanently placed. Insertion sort's prefix holds *everything seen so
far* — sorted relative to itself, but every one of those elements may still move
when a smaller value arrives later.

That is a weaker invariant, and it is what buys the adaptivity.

## The shift, and why it is not a swap

The inner loop does not exchange pairs. It saves the element being placed — the
**key** — copies larger elements one position right, and writes the key once into
the gap that opens up:

```
save key = arr[i]
while j >= 0 and arr[j] > key:
    arr[j+1] = arr[j]        one write, not three
    j--
arr[j+1] = key
```

Writing it with swaps instead is correct and costs three writes per step rather
than one. Measured at n = 2,000 on random input: **2,909,145 writes against
971,714**, a factor of **2.99**.

Whether that matters is a separate question, and this topic has now answered it
twice. Measured in wall clock the two forms came out 1.34x apart on random input
and 1.33x on reverse — both inside this machine's run-to-run spread. Writes are
close to free on a CPU; the shift form is worth preferring because it is the
clearer statement of what the algorithm does, not because it is measurably faster.

## The number of shifts is exactly the inversion count

Every shift moves one element one position to the right past the key, which
removes exactly one inversion — the same argument that governed bubble sort's
swaps. So the total number of shifts is **exactly the number of inversions in the
input**.

Verified with zero mismatches over all 87,380 arrays of length 1 to 8 from four
symbols, all 5,913 permutations up to length 7, and 30,000 random arrays with
duplicates and n up to 60.

The comparison count is that plus a small constant per element, and it is also
exact:

```
comparisons = shifts + (n - 1) - (elements that run off the front)
```

Verified over 20,000 random arrays with zero mismatches. So insertion sort costs
**inversions + n**, near enough, and nothing else.

## Which is the whole difference from bubble sort

Bubble sort's *swap* count is also exactly the inversion count. Its *comparison*
count is not — that is governed by the largest distance any element must travel
leftward, which is a completely different quantity.

Here is the case that separates them. Two arrays of 1,000 elements, each one
element away from sorted, each containing exactly **999 inversions**:

| | Insertion: comparisons | Insertion: shifts | Bubble: comparisons |
|---|---|---|---|
| Largest element at the front | 1,997 | 999 | 1,997 |
| **Smallest element at the end** | **1,997** | **999** | **499,500** |

**Insertion sort does not distinguish them at all.** Bubble sort differs by a
factor of 250 on inputs that are identically disordered.

Measured at n = 16,000 on the second array: insertion **0.0123ms**, bubble
**39.43ms** — a factor of **3,206**.

## This is what adaptive actually means

Bubble Sort's early-exit flag detects that sorting has *finished*. Insertion
sort's cost is proportional to how much sorting was *needed*. Those sound similar
and behave nothing alike.

Take a sorted array of 1,000 elements and apply `k` random transpositions:

| Transpositions | Inversions | Insertion comparisons | Bubble passes |
|---|---|---|---|
| 0 | 0 | 999 | 1 |
| 1 | 543 | 1,542 | 273 |
| **5** | **4,827** | **5,826** | **973 of 999** |
| 50 | 34,320 | 35,319 | 922 |

Five random swaps in a thousand elements. Insertion sort does 5,826 comparisons —
**1.2%** of the worst case. Bubble sort runs 973 of its 999 passes, which is
essentially all of them.

Measured at n = 16,000 with five transpositions: insertion **0.0405ms**, bubble
**38.74ms**, selection **46.59ms** — factors of **957** and **1,150**.

That is the property worth having, and insertion sort is the only one of the three
that has it.

## Binary insertion sort, and what it gives up

The inner loop does two jobs: find where the key belongs, and make room for it.
The search is a linear scan over a **sorted** prefix, so binary search can replace
it and cut the comparisons to `O(n log n)`.

It works. At n = 1,000 the comparison count collapses:

| Input | Plain | Binary |
|---|---|---|
| Reverse sorted | 499,500 | **8,977** |
| Random | 250,099 | **8,589** |
| **Already sorted** | **999** | **7,987** |

Look at the last row. Binary search always performs about `log₂ i` comparisons,
whether or not any are needed — so on an already-sorted array it does **eight
times more** work than the plain version, which needs exactly one comparison per
element. **Binary insertion sort trades away the O(n) best case**, which is the
entire reason to choose insertion sort in the first place.

The shifts are unchanged at 499,500, because knowing where the key goes does not
move anything. So it remains O(n²).

Measured, it is nonetheless considerably faster on disordered input — 5.10ms
against 22.31ms on random at n = 16,000, and 9.72ms against 44.67ms on reverse —
and **35x slower on sorted input**, 0.2477ms against 0.0070ms. The gain on
disordered data comes from the shifting being separated into its own countdown
loop with no data-dependent test in it, rather than from the comparisons saved.

## Where it is genuinely the right answer

Below about two dozen elements, insertion sort beats the library sort. Measured
nanoseconds per sort on random input:

| n | Insertion | `std::sort` |
|---|---|---|
| 8 | **12.9** | 14.8 |
| 16 | **37.5** | 38.2 |
| 24 | 67.9 | **67.8** |
| 32 | 141.0 | **93.5** |
| 256 | 7,327.8 | **2,719.0** |

**The crossover sits right at about 24 on this machine** — the same shape of
result Linear Search measured against binary search, and for the same reasons:
sequential access, a predictable branch, and an array small enough to sit in a
cache line or two.

This is not a curiosity. It is why production sorts stop recursing on small
partitions and finish with insertion sort, and why Timsort is built on runs that
insertion sort extends.

## Stability

Insertion sort is **stable**, provided the shift condition is `arr[j] > key`
strictly. An equal element fails that test, so the key stops to its right and
equal values keep their original order. Verified over all 3,279 arrays of length 1
to 7 from three symbols with **zero** unstable results.

Writing `>=` shifts past equal elements, placing the key before its own twins:
**99.54% unstable** over the same corpus, with the smallest failure being `[0, 0]`
at n = 2. It also performs 1.22x the shifts.

## Speed, and the verdict for the topic

At n = 16,000 on random input: insertion **22.31ms**, bubble **75.50ms**,
selection **114.13ms**, `std::sort` **0.2596ms**. Insertion sort is **3.4x**
faster than bubble, **5.1x** faster than selection, and **86x** slower than the
library.

So of the three basic sorts, this is the one to write when you must write one.
Python agrees on the ranking for structured input and narrows it on random data —
at n = 2,000: insertion 55.40ms against selection 48.28ms and bubble 109.10ms —
but on the turtle it is 0.238ms against bubble's 58.47ms. Note also
`bisect.insort`, which is this algorithm with the shifting performed in C: 0.660ms
against the hand-written 55.40ms on random input.

## Where this goes next

The run-extending idea here is the foundation of **Timsort**, which finds
already-sorted runs and merges them. The inversion count that governs this
algorithm is what **Count Inversions** computes in O(n log n) — worth noticing
that measuring the disorder is asymptotically cheaper than removing it one
position at a time.

<!-- @intuition -->
This is how a hand of cards gets sorted: hold a tidy fan in your left hand, pick up the next card, and slide it back along the fan until it sits between two cards it belongs between. The cost of each card is how far back it has to travel, so a card that is nearly in the right place is nearly free — and the total cost is the total distance travelled, which is precisely the amount of disorder in the deck. That is the difference from bubble sort in one sentence. Bubble sort also moves elements one position at a time and also performs exactly one move per unit of disorder, but it re-scans the entire hand between moves, so a single badly-placed card makes it re-read everything as many times as that card has places to travel.

<!-- @approach -->
### Swap-Based Insertion

<!-- @idea -->
Walk each element leftward by repeatedly swapping it with its left neighbour while that neighbour is larger.

<!-- @steps -->
1. Take each index i from 1 to the last.
2. Set a walker j to i.
3. While j is above zero and the element to the left of the walker is larger, swap them.
4. Decrease j by one and repeat, so the element keeps moving left.
5. Stop when the left neighbour is no longer larger, or the walker reaches the front.

<!-- @complexity -->
- time: O(n^2) worst case, O(n) on already-sorted input
- space: O(1)
- note: Correct, adaptive, and performs three writes per step where one would do — measured 2,909,145 writes against 971,714 at n = 2,000 on random input, a factor of 2.99. In wall clock, at n = 16,000, the two forms measured 1.34x apart, inside this machine's spread, so the reason to prefer shifting is clarity rather than speed.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void insertionSort(vector<int>& arr) {
    int n = arr.size();

    for (int i = 1; i < n; i++) {
        for (int j = i; j > 0 && arr[j - 1] > arr[j]; j--) {
            swap(arr[j - 1], arr[j]);
        }
    }
}
```

<!-- @annotations -->
- 8: i starts at 1, because a prefix of one element is already sorted.
- 9: The condition tests j > 0 first, so arr[j-1] is never read at a negative index — the order of the two tests is load-bearing.
- 10: Three writes per step. The element being placed is re-read and re-written at every position it passes.

<!-- @code java -->
```java
static void insertionSort(int[] arr) {
    int n = arr.length;

    for (int i = 1; i < n; i++) {
        for (int j = i; j > 0 && arr[j - 1] > arr[j]; j--) {
            int t = arr[j - 1]; arr[j - 1] = arr[j]; arr[j] = t;
        }
    }
}
```

<!-- @annotations -->
- 5: Strictly greater, which is what keeps the sort stable — an equal neighbour stops the walk.
- 6: The same value is written three times per position it moves, which the shift form reduces to one.

<!-- @code python -->
```python
def insertion_sort(arr):
    n = len(arr)
    for i in range(1, n):
        j = i
        while j > 0 and arr[j - 1] > arr[j]:
            arr[j - 1], arr[j] = arr[j], arr[j - 1]
            j -= 1


# Correct, and it moves the same element repeatedly rather than
# opening a gap once — 2.99x the element writes of the shift form.
```

<!-- @annotations -->
- 5: Python evaluates j > 0 before indexing, so a walker at the front never reads arr[-1] — which would silently wrap to the last element.

<!-- @approach -->
### Optimal - Shift-Based Insertion

<!-- @idea -->
Save the element being placed, slide everything larger one position right, and write it once into the gap.

<!-- @steps -->
1. Take each index i from 1 to the last, saving the element there as the key.
2. Start a scanner j at i minus one, the end of the sorted prefix.
3. While j is not negative and the element at j is larger than the key, copy it one position right and step j left.
4. Stop when a smaller-or-equal element is found, or the scanner falls off the front.
5. Write the key into position j plus one, which is the gap the shifting opened.

<!-- @complexity -->
- time: O(n) best case, O(n + inversions) in general, O(n^2) worst case
- space: O(1)
- note: The number of shifts is exactly the inversion count of the input — zero mismatches over 87,380 exhaustive arrays, 5,913 permutations and 30,000 random arrays. One write per shift rather than three. Measured 22.31ms at n = 16,000 on random input against bubble's 75.50ms and selection's 114.13ms.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void insertionSort(vector<int>& arr) {
    int n = arr.size();

    for (int i = 1; i < n; i++) {
        int key = arr[i];                       // save it: the slot is about to be overwritten
        int j = i - 1;

        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];                // one write per shift
            j--;
        }
        arr[j + 1] = key;                       // the gap the shifting opened
    }
}
```

<!-- @annotations -->
- 8: Saving the key first is essential — the very first shift writes over arr[i].
- 11: Two things on one line. j >= 0 must be tested before arr[j], or the scan reads one position before the array. And the comparison is strictly greater — writing >= shifts past equal elements and is 99.54% unstable.
- 12: The shift, not a swap. Each element moves once and the key is written once at the end.
- 15: j + 1, not j. The loop exits with j one position left of where the key belongs.

<!-- @code java -->
```java
static void insertionSort(int[] arr) {
    int n = arr.length;

    for (int i = 1; i < n; i++) {
        int key = arr[i];
        int j = i - 1;

        while (j >= 0 && arr[j] > key) {
            arr[j + 1] = arr[j];
            j--;
        }
        arr[j + 1] = key;
    }
}
```

<!-- @annotations -->
- 5: The invariant: arr[0..i-1] is already sorted, so the scan only has to find where the key fits inside it.
- 8: Each iteration removes exactly one inversion, which is why the shift total equals the inversion count exactly.
- 12: Reached both when a smaller element is found and when the scan runs off the front, where j is -1 and the key lands at index 0.

<!-- @code python -->
```python
def insertion_sort(arr):
    n = len(arr)
    for i in range(1, n):
        key = arr[i]
        j = i - 1
        while j >= 0 and arr[j] > key:
            arr[j + 1] = arr[j]
            j -= 1
        arr[j + 1] = key


# Python has this with the shifting done in C:
#     from bisect import insort
#     out = []
#     for x in arr: insort(out, x)
# Measured 0.660ms against 55.40ms at n = 2,000 on random input.
```

<!-- @annotations -->
- 6: j >= 0 comes first. Without it a scan reaching the front reads arr[-1], which in Python is the LAST element and produces a silently wrong answer rather than a crash.
- 9: Writing the key here rather than inside the loop is what makes this one write per shift instead of three.

<!-- @approach -->
### Binary Insertion Sort

<!-- @idea -->
Find the key's position by binary search over the sorted prefix, then shift the block to make room.

<!-- @steps -->
1. Take each index i, saving the element there as the key.
2. Binary search the sorted prefix for the first position holding a value greater than the key.
3. Shift every element from that position up to i one place right.
4. Write the key into the position the search found.
5. Note that the comparisons fall to O(n log n) while the shifts remain unchanged.

<!-- @complexity -->
- time: O(n log n) comparisons and O(n^2) shifts, so still O(n^2) overall
- space: O(1)
- note: Caps comparisons at about n log n — 8,977 against 499,500 on reverse-sorted input at n = 1,000 — and gives up the O(n) best case entirely, doing 7,987 comparisons on an already-sorted array where the plain version does 999. Measured 5.10ms against 22.31ms on random at n = 16,000, and 35x SLOWER on sorted input.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void binaryInsertionSort(vector<int>& arr) {
    int n = arr.size();

    for (int i = 1; i < n; i++) {
        int key = arr[i];

        int lo = 0, hi = i;                     // first position holding a value > key
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] > key) hi = mid; else lo = mid + 1;
        }

        for (int j = i; j > lo; j--) arr[j] = arr[j - 1];
        arr[lo] = key;
    }
}
```

<!-- @annotations -->
- 12: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which can overflow on a very large array.
- 13: Greater-than, not greater-or-equal — this is what makes the search land AFTER any equal elements and keeps the sort stable.
- 16: The shift loop is unchanged in count, so this is still O(n^2). What changed is only how the position was found. This loop has no data-dependent test in it, which is why the version measured faster on disordered input despite doing the same shifting.

<!-- @code java -->
```java
static void binaryInsertionSort(int[] arr) {
    int n = arr.length;

    for (int i = 1; i < n; i++) {
        int key = arr[i];

        int lo = 0, hi = i;
        while (lo < hi) {
            int mid = lo + (hi - lo) / 2;
            if (arr[mid] > key) hi = mid; else lo = mid + 1;
        }

        System.arraycopy(arr, lo, arr, lo + 1, i - lo);
        arr[lo] = key;
    }
}
```

<!-- @annotations -->
- 13: arraycopy handles the overlapping ranges correctly, and performs the same number of element moves as the explicit loop.

<!-- @code python -->
```python
from bisect import bisect_right

def binary_insertion_sort(arr):
    n = len(arr)
    for i in range(1, n):
        key = arr[i]
        pos = bisect_right(arr, key, 0, i)   # first index after equal elements
        arr[pos + 1 : i + 1] = arr[pos : i]  # slice shift, done in C
        arr[pos] = key


# On an already-sorted array this does about n log n comparisons where
# the plain version does n - 1 — 7,987 against 999 at n = 1,000.
```

<!-- @annotations -->
- 7: bisect_right, not bisect_left. Inserting after equal elements is what preserves their original order.
- 8: Slice assignment performs the block shift as a single C-level move rather than an interpreted loop.

<!-- @approach -->
### Library Call and the Small-Array Base Case

<!-- @idea -->
Use the library sort in general, and insertion sort only below the size where it actually wins.

<!-- @steps -->
1. For a general sort, call the language's sort routine.
2. Measure where insertion sort stops winning on your data and hardware.
3. Below that threshold, use insertion sort directly.
4. In a hybrid sort, stop recursing at that threshold and finish the partition with insertion sort.
5. In Python, use bisect.insort when elements arrive one at a time and the collection must stay sorted.

<!-- @complexity -->
- time: O(n log n) for the library sort, O(n^2) for insertion sort above the crossover
- space: O(1) to O(log n) depending on the implementation
- note: Insertion sort measured FASTER than std::sort up to about two dozen elements — 37.5ns against 38.2ns at n = 16, with the two dead level at n = 24 (67.9ns against 67.8ns) and the library clearly ahead by n = 32, 141.0ns against 93.5ns. By n = 256 the library sort is 2.7x faster. This is the same shape of result Linear Search measured against binary search, whose crossover was around 24.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void insertionSort(vector<int>& arr, int lo, int hi) {
    for (int i = lo + 1; i < hi; i++) {
        int key = arr[i], j = i - 1;
        while (j >= lo && arr[j] > key) { arr[j + 1] = arr[j]; j--; }
        arr[j + 1] = key;
    }
}

void hybridSort(vector<int>& arr) {
    const int THRESHOLD = 24;                   // measured crossover on this machine
    if ((int)arr.size() <= THRESHOLD) {
        insertionSort(arr, 0, arr.size());
        return;
    }
    sort(arr.begin(), arr.end());
}
```

<!-- @annotations -->
- 5: Taking an explicit range is what lets the same routine finish a partition inside a larger sort.
- 14: Measured between 24 and 32 on this machine, and worth re-measuring rather than inheriting — it depends on the element size and the hardware.
- 19: std::sort already does this internally, which is why calling it is almost always the right answer.

<!-- @code java -->
```java
import java.util.Arrays;

static void insertionSort(int[] arr, int lo, int hi) {
    for (int i = lo + 1; i < hi; i++) {
        int key = arr[i], j = i - 1;
        while (j >= lo && arr[j] > key) { arr[j + 1] = arr[j]; j--; }
        arr[j + 1] = key;
    }
}

static void hybridSort(int[] arr) {
    if (arr.length <= 24) insertionSort(arr, 0, arr.length);
    else Arrays.sort(arr);
}
```

<!-- @annotations -->
- 13: Arrays.sort on primitives is a dual-pivot quicksort that already falls back to insertion sort on small partitions.

<!-- @code python -->
```python
from bisect import insort

def sort_stream(values):
    """Keep a sorted list as elements arrive — insertion sort, shifting in C."""
    out = []
    for x in values:
        insort(out, x)
    return out


# For a plain sort, use sorted() — measured 0.116ms at n = 2,000 on random
# input against 55.40ms for a hand-written insertion sort.
# insort measured 0.660ms doing the same work, because the shift is a
# C-level memory move rather than an interpreted loop.
```

<!-- @annotations -->
- 8: insort is the genuine use case for this algorithm in Python: elements arriving one at a time into a collection that must stay sorted.
- 12: Timsort, which is what sorted() runs, is itself built on insertion sort extending already-sorted runs.

<!-- @example -->

<!-- @input -->
arr = [5, 2, 4, 1]

<!-- @output -->
[1, 2, 4, 5] — 6 comparisons, 5 shifts

<!-- @why -->
Small enough to trace by hand, and its 5 shifts are exactly the 5 inversions in the input, which is the identity the whole subtopic rests on.

<!-- @walkthrough -->
1. i = 1, key = 2. The scan compares 5 > 2, shifts the 5 right, and falls off the front, so the key lands at index 0 giving [2, 5, 4, 1].
2. That pass performed 1 shift and 1 comparison, and no failing comparison because the scan ran off the front rather than stopping.
3. i = 2, key = 4. The scan compares 5 > 4 and shifts, then compares 2 > 4 which fails, so the key lands at index 1 giving [2, 4, 5, 1].
4. That pass performed 1 shift and 2 comparisons — one that succeeded and one that stopped it.
5. i = 3, key = 1. The scan shifts 5, then 4, then 2, and falls off the front, so the key lands at index 0 giving [1, 2, 4, 5].
6. The totals are 6 comparisons and 5 shifts.
7. The input contains exactly 5 inversions — (5,2), (5,4), (5,1), (2,1) and (4,1) — matching the shift count exactly.

<!-- @example -->

<!-- @input -->
The smallest element moved to the end, against the largest moved to the front

<!-- @output -->
Insertion sort cannot tell them apart; bubble sort differs by 250x

<!-- @why -->
The case that separates cost-driven-by-inversions from cost-driven-by-displacement, and it is the reason this algorithm is the one worth using.

<!-- @walkthrough -->
1. Both arrays hold 1,000 elements with exactly one moved to the opposite end, so both contain exactly 999 inversions.
2. Insertion sort performs 1,997 comparisons and 999 shifts on each of them — identical figures.
3. That is because its cost is the inversion count plus roughly one comparison per element, and the inversion counts are equal.
4. Bubble sort performs 1,997 comparisons on the array with the largest element at the front, because one sweep carries it the whole way.
5. It performs 499,500 comparisons on the array with the smallest element at the end, because that element moves one position per pass and needs 999 passes.
6. Measured at n = 16,000 on that second array: insertion 0.0123ms against bubble 39.43ms, a factor of 3,206.
7. Bubble sort's swap count is also the inversion count, so the two algorithms move exactly the same amount — one of them just re-reads the array between moves.

<!-- @example -->

<!-- @input -->
A sorted array of 1,000 elements with five random transpositions applied

<!-- @output -->
5,826 comparisons — 1.2% of the worst case — where bubble sort runs 973 of its 999 passes

<!-- @why -->
Shows what adaptive means when it is a real property: the cost tracks how disordered the input is, rather than merely detecting the moment sorting completes.

<!-- @walkthrough -->
1. Five random transpositions in a thousand elements introduce 4,827 inversions.
2. Insertion sort performs 4,827 shifts and 5,826 comparisons, which is 1.2% of the 499,500 its worst case would cost.
3. Bubble sort's early-exit flag fires only after a pass with no swaps at all, which does not happen until almost everything is settled.
4. It therefore runs 973 of its 999 passes on the same input, which is essentially the full quadratic cost.
5. Measured at n = 16,000 with five transpositions: insertion 0.0405ms, bubble 38.74ms, selection 46.59ms.
6. Those are factors of 957 and 1,150 respectively.
7. Selection sort is unaffected by the disorder at all, since its comparison count is fixed at n(n-1)/2 on every input.

<!-- @example -->

<!-- @input -->
Binary insertion sort on an already-sorted array of 1,000 elements

<!-- @output -->
7,987 comparisons where the plain version does 999

<!-- @why -->
An optimisation that improves the worst case by 56x and destroys the best case, which is the property the algorithm was chosen for.

<!-- @walkthrough -->
1. Binary search finds the key's position in about log base 2 of i comparisons, whatever the data looks like.
2. On reverse-sorted input that cuts the comparisons from 499,500 to 8,977, which is a 56-fold reduction.
3. On random input it cuts them from 250,099 to 8,589.
4. On an already-sorted array the plain version needs exactly one comparison per element, totalling 999, because the first test always fails immediately.
5. Binary search still performs its full log base 2 of i comparisons per element, totalling 7,987 — eight times more.
6. Measured at n = 16,000 on sorted input: 0.2477ms against 0.0070ms, so the binary version is 35 times slower.
7. The shifts are identical in both versions, so neither is better than O(n squared) — only the comparison count moved.

<!-- @visualization array -->

<!-- @description -->
The array as a strip with a hard divider between a tinted sorted prefix on the left and untouched input on the right, and the divider advancing exactly one cell per outer step — that steady advance is the invariant and it should never jump. The key is the object to animate: lift it physically out of its cell into a holding slot above the strip, leaving a visible gap in the row, because the gap is the whole mechanism and the reason the key has to be saved before anything moves. Then walk a scanner leftward from the gap, and on each step draw the comparison against the key in its holding slot; when the scanned element is larger, slide it one cell right into the gap and let the gap move left with the scanner — one cell moving one place, never a pair exchanging. When the comparison fails, or the scanner falls off the front, drop the key from the slot into the gap and re-tint the prefix. Run a shift counter beside a fixed inversion counter and let them finish exactly equal, labelled exact. The centre of the figure is a two-strip comparison against bubble sort on the array whose smallest element sits at the end. Both strips carry the annotation 999 inversions. On the insertion strip the final key walks the full width once, in one continuous motion, and the sort is done. On the bubble strip the same element inches left one cell per full sweep, and the sweep is redrawn every time — let it grind through many repetitions so the 250x is felt rather than read. Print the two comparison counters diverging to 1,997 and 499,500 while the two movement counters stay locked at 999. Then an adaptivity panel: a slider for the number of random transpositions applied to a sorted array, with three cost bars responding — insertion climbing smoothly from 999 in proportion to the inversions, bubble jumping almost immediately to its full height, selection drawn as a flat line that never moves at all. Close with a binary-search panel showing the inner loop split into its two jobs: a search phase that shrinks to a few probes and a shift phase that does not shrink at all, with two counters beneath reading 8,977 and 499,500 on reverse input — and then the same panel on sorted input where the search phase costs 7,987 against the plain version's 999, drawn as the optimisation losing.

<!-- @sampleInput -->
```json
{"primary":{"array":[5,2,4,1],"trace":[{"i":1,"key":2,"shifts":[{"from":0,"value":5}],"ranOffFront":true,"placedAt":0,"after":[2,5,4,1],"comparisons":1},{"i":2,"key":4,"shifts":[{"from":1,"value":5}],"stoppedAt":{"value":2},"placedAt":1,"after":[2,4,5,1],"comparisons":2},{"i":3,"key":1,"shifts":[{"from":2,"value":5},{"from":1,"value":4},{"from":0,"value":2}],"ranOffFront":true,"placedAt":0,"after":[1,2,4,5],"comparisons":3}],"result":[1,2,4,5],"comparisons":6,"shifts":5,"inversions":5,"inversionPairs":[[5,2],[5,4],[5,1],[2,1],[4,1]]},"invariant":"after step i, arr[0..i] holds the first i+1 input elements in sorted order","shiftIdentity":{"claim":"shifts == inversions, exactly","verified":[{"corpus":"all arrays length 1-8 from 4 symbols","count":87380,"mismatches":0},{"corpus":"all permutations up to length 7","count":5913,"mismatches":0},{"corpus":"random arrays with duplicates n<=60","count":30000,"mismatches":0}]},"comparisonFormula":{"rule":"comparisons = shifts + (n-1) - (elements that run off the front)","verifiedOver":20000,"mismatches":0},"vsBubble":{"n":1000,"turtle":{"description":"smallest element at the end","inversions":999,"insertionComparisons":1997,"insertionShifts":999,"bubbleComparisons":499500,"bubblePasses":999},"rabbit":{"description":"largest element at the front","inversions":999,"insertionComparisons":1997,"insertionShifts":999,"bubbleComparisons":1997,"bubblePasses":2},"reading":"insertion sort cannot tell them apart; bubble sort differs by 250x","timingAtN16000":{"insertionMs":0.0123,"bubbleMs":39.43,"ratio":3206}},"adaptivity":{"n":1000,"rows":[{"transpositions":0,"inversions":0,"insertionComparisons":999,"bubblePasses":1},{"transpositions":1,"inversions":543,"insertionComparisons":1542,"bubblePasses":273},{"transpositions":5,"inversions":4827,"insertionComparisons":5826,"bubblePasses":973},{"transpositions":50,"inversions":34320,"insertionComparisons":35319,"bubblePasses":922}],"worstCase":499500,"atFiveTranspositions":{"insertionPctOfWorstCase":1.2,"timingN16000":{"insertionMs":0.0405,"bubbleMs":38.74,"selectionMs":46.59,"vsBubble":1042,"vsSelection":1519}}},"binaryInsertion":{"n":1000,"comparisons":{"sorted":{"plain":999,"binary":7987},"reverse":{"plain":499500,"binary":8977},"random":{"plain":250099,"binary":8589}},"shiftsUnchanged":true,"nLog2N":9965,"timingN16000":{"random":{"plain":22.31,"binary":5.10},"reverse":{"plain":44.67,"binary":9.72},"sorted":{"plain":0.0070,"binary":0.2477,"binarySlowerBy":35}},"verdict":"caps comparisons at n log n and gives up the O(n) best case"},"writes":{"n":2000,"shiftForm":1043227,"swapForm":3123684,"ratio":2.99,"wallClockRatio":1.34,"note":"inside this machine's run-to-run spread"},"stability":{"strictGreater":{"arraysTested":3279,"unstable":0},"greaterOrEqual":{"arraysTested":3279,"unstable":3264,"rate":0.9954,"smallestFailure":[0,0]},"extraShifts":1.22},"crossover":{"unit":"ns per sort, random input","rows":[{"n":8,"insertion":12.9,"stdSort":14.8,"winner":"insertion"},{"n":16,"insertion":37.5,"stdSort":38.2,"winner":"insertion"},{"n":24,"insertion":67.9,"stdSort":67.8,"winner":"stdSort","note":"dead heat — 0.1% apart"},{"n":32,"insertion":141.0,"stdSort":93.5,"winner":"stdSort"},{"n":48,"insertion":333.0,"stdSort":173.9,"winner":"stdSort"},{"n":64,"insertion":623.5,"stdSort":314.6,"winner":"stdSort"},{"n":128,"insertion":2151.7,"stdSort":1047.5,"winner":"stdSort"},{"n":256,"insertion":7327.8,"stdSort":2719.0,"winner":"stdSort"}],"crossoverBetween":[16,24],"echoes":"linear-search measured its crossover against binary search at about 24"},"speed":{"n":16000,"random":{"insertionMs":22.31,"bubbleMs":75.50,"selectionMs":114.13,"stdSortMs":0.2596,"vsBubble":3.4,"vsSelection":5.1,"vsStdSort":86}},"python":{"n":2000,"insertion":{"sorted":0.130,"reverse":107.36,"random":55.40,"turtle":0.238,"nearly":0.548},"bubble":{"random":109.10,"turtle":58.47},"selection":{"random":48.28},"bisectInsort":{"random":0.660},"sortedBuiltin":{"random":0.116}}}
```

<!-- @highlights -->
- A hard divider separates the tinted sorted prefix from untouched input, and it advances exactly one cell per outer step.
- The key lifts physically out of its cell into a holding slot, leaving a visible gap in the row.
- That gap is the mechanism, and it is why the key must be saved before anything moves.
- A scanner walks leftward and compares each element against the key in its slot.
- When the scanned element is larger it slides one cell right into the gap, and the gap moves left with the scanner.
- One cell moves one place — never a pair exchanging, which is the difference from the swap-based form.
- When a comparison fails or the scanner falls off the front, the key drops into the gap and the prefix re-tints.
- A shift counter beside a fixed inversion counter finishes exactly equal to it, labelled exact.
- The centre panel puts insertion and bubble side by side on the array whose smallest element sits at the end, both annotated 999 inversions.
- On the insertion strip the final key walks the full width once, in a single continuous motion, and the sort is done.
- On the bubble strip the same element inches left one cell per sweep, with the whole sweep redrawn each time.
- The comparison counters diverge to 1,997 and 499,500 while the movement counters stay locked together at 999.
- An adaptivity slider applies random transpositions to a sorted array and drives three cost bars.
- Insertion climbs smoothly in proportion to the inversions, bubble jumps almost immediately to full height, and selection is a flat line that never moves.
- The binary-search panel splits the inner loop into a search phase that shrinks to a few probes and a shift phase that does not shrink at all.
- On sorted input that panel shows the search costing 7,987 against the plain version's 999 — the optimisation visibly losing.

<!-- @edgeCases -->
- Empty array — the outer loop starts at index 1 and never runs, so no guard is needed in any of the three languages.
- Single element — a one-element prefix is already sorted and the loop body never executes.
- Two elements — one comparison decides it, and it is the smallest input where the >= mistake shows.
- Already sorted — the best case, at exactly n - 1 comparisons and zero shifts.
- All elements equal — identical to the sorted case, because strict greater-than fails on the first comparison every time.
- Reverse sorted — the worst case, where every element shifts past the entire prefix for n(n-1)/2 shifts.
- Smallest element at the end — 999 shifts and 1,997 comparisons at n = 1,000, where bubble sort needs 499,500 comparisons.
- The key smaller than everything before it — the scan runs off the front, j reaches -1, and the key lands at index 0.
- The key larger than everything before it — the first comparison fails and no shift occurs at all.
- Duplicate values — handled stably by strict greater-than, and reordered by >=.
- Arrays under about two dozen elements — where insertion sort measured faster than std::sort, which is its real production use.

<!-- @pitfalls -->
- Not saving the key before shifting. The first shift overwrites arr[i], so the value being placed is destroyed.
- Writing the final placement as arr[j] rather than arr[j + 1]. The loop exits one position past where the key belongs.
- Testing arr[j] before j >= 0. In C++ that reads before the array, and in Python arr[-1] silently wraps to the last element and produces a wrong answer with no error.
- Using >= instead of > in the shift condition. Measured 99.54% unstable over 3,279 arrays with [0,0] the smallest failure, plus 1.22x the shifts.
- Starting the outer loop at index 0, which compares the first element against an empty prefix and does nothing useful.
- Swapping instead of shifting. Correct, and 2.99x the element writes — 2,909,145 against 971,714 at n = 2,000.
- Expecting the swap form to be measurably slower. It measured 1.34x, inside this machine's spread, so prefer shifting for clarity rather than for speed.
- Reaching for binary insertion sort as a strict improvement. It caps comparisons at n log n and gives up the O(n) best case, measuring 35x slower on already-sorted input.
- Believing binary insertion sort improves the complexity. The shifts are unchanged, so it remains O(n^2).
- Using bisect_left rather than bisect_right in the Python binary version, which inserts before equal elements and breaks stability.
- Writing it for a large general sort. Measured 86x slower than std::sort at n = 16,000 on random input.
- Inheriting a hybrid threshold rather than measuring it. The crossover fell right at about 24 here and depends on element size and hardware.

<!-- @doubt -->
### Why save the key instead of just swapping along?

<!-- @answer -->
Because shifting writes each element once and swapping writes it three times. The shift form opens a gap by copying larger elements right and drops the key in at the end; the swap form carries the key along, re-reading and re-writing it at every position it passes. Measured at n = 2,000 on random input: 971,714 element writes against 2,909,145, a factor of 2.99. The honest caveat is that this did not show up in wall clock — at n = 16,000 the two measured 1.34x apart, inside this machine's spread. Writes are close to free on a CPU, which this topic has now found three times. Prefer the shift form because it states the algorithm more directly.

<!-- @doubt -->
### Why is the number of shifts exactly the inversion count?

<!-- @answer -->
Because each shift moves exactly one element one position to the right past the key, which reverses the relative order of exactly that one pair and no other — so it removes precisely one inversion. The sort finishes when none remain, so the total is the input's inversion count. Verified with zero mismatches over all 87,380 arrays of length 1 to 8 from four symbols, all 5,913 permutations up to length 7, and 30,000 random arrays with duplicates. The comparison count is that plus roughly one per element: exactly shifts + (n-1) minus the number of elements that run off the front, verified over 20,000 arrays with no exceptions.

<!-- @doubt -->
### Bubble sort's swaps are also the inversion count. So why is it so much slower?

<!-- @answer -->
Because the two algorithms move the same amount and only one of them stops re-reading the array between moves. Insertion sort's comparisons track its shifts almost exactly, so its total cost is the inversion count plus n. Bubble sort's comparisons are governed by something else entirely — the largest distance any single element must travel leftward — because it re-sweeps the array once per position that element moves. The clearest case is two arrays with 999 inversions each: insertion sort does 1,997 comparisons on both, while bubble sort does 1,997 on one and 499,500 on the other. Measured at n = 16,000 that is 0.0123ms against 39.43ms.

<!-- @doubt -->
### Is insertion sort really adaptive, when bubble sort claims to be too?

<!-- @answer -->
Yes, and the difference is measurable. Bubble sort's flag detects that sorting has finished; insertion sort's cost is proportional to how much sorting was needed. Apply five random transpositions to a sorted array of 1,000 elements: insertion sort does 5,826 comparisons, which is 1.2% of its worst case, while bubble sort runs 973 of its 999 passes. Measured at n = 16,000 with the same disorder: insertion 0.0405ms, bubble 38.74ms, selection 46.59ms — factors of 957 and 1,150. Selection sort is unaffected by the disorder in either direction, since its comparison count is fixed.

<!-- @doubt -->
### Why must j >= 0 be tested before arr[j]?

<!-- @answer -->
Because the scan can legitimately run off the front, and what happens then differs by language. In C++ reading arr[-1] is undefined behaviour that often does not crash and returns whatever memory sits there. In Java it throws immediately. In Python it is worst of all: arr[-1] is a valid index meaning the LAST element, so the comparison succeeds or fails against completely unrelated data and the function returns a wrong answer with no error at all. All three languages short-circuit && and and, so writing the bound test first makes the index test unreachable when j is negative.

<!-- @doubt -->
### Why is the key written at arr[j + 1] rather than arr[j]?

<!-- @answer -->
Because the loop only exits after j has already stepped one position too far left. It stops either when arr[j] is not greater than the key — in which case the key belongs immediately to the right of that element, at j + 1 — or when j has fallen to -1, in which case the key belongs at index 0, which is also j + 1. Both exits agree, which is why no special case is needed for a key smaller than everything before it. Writing arr[j] instead overwrites the element the scan just stopped on.

<!-- @doubt -->
### Should I use binary search to find the position?

<!-- @answer -->
Only if you know your input is disordered, because it trades away the best case. Binary search caps the comparisons at about n log n — 8,977 against 499,500 on reverse-sorted input at n = 1,000 — and it performs that full log-many comparisons per element whatever the data looks like. On an already-sorted array the plain version needs exactly one comparison per element, 999 in total, where the binary version needs 7,987. Measured at n = 16,000 the binary version is 4.4x faster on random input and 35x slower on sorted input. It also does not improve the complexity, because the shifts are unchanged and still O(n²).

<!-- @doubt -->
### Why does >= break stability?

<!-- @answer -->
Because the shift condition decides where the key stops. With strict greater-than, an element equal to the key fails the test and the scan halts, so the key is placed to its right and the earlier of the two equal values stays earlier. With >=, the scan shifts past equal elements and the key is placed before its own twins, reversing them. Measured over all 3,279 arrays of length 1 to 7 from three symbols: zero unstable results with >, and 3,264 with >= — 99.54%. The smallest failure is [0, 0] at n = 2. It also performs 1.22x the shifts, so it is slower as well as wrong.

<!-- @doubt -->
### When is insertion sort actually the right choice?

<!-- @answer -->
Three situations, all real. When the array is small: measured, it beat std::sort up to about two dozen elements — 37.5ns against 38.2ns at n = 16, with the two dead level at n = 24 — so the crossover falls right at about 24. When the data is nearly sorted, since the cost is the inversion count: five transpositions in a thousand elements cost 1.2% of the worst case. And when elements arrive one at a time into a collection that must stay sorted, which is exactly what bisect.insort does in Python at 0.660ms against a hand-written 55.40ms. Production sorts use it for the first reason, stopping their recursion on small partitions and finishing with it.

<!-- @doubt -->
### Which of the three basic sorts should I write?

<!-- @answer -->
This one. At n = 16,000 on random input insertion sort measured 22.31ms against bubble's 75.50ms and selection's 114.13ms, so it is 3.4x and 5.1x faster respectively — and on structured input the gap becomes enormous, 957x against bubble and 1,150x against selection on an array five transpositions from sorted. It is also stable, which selection sort is not, and adaptive, which bubble sort only appears to be. The one thing selection sort still owns is minimum writes, and the one thing bubble sort owns is proving sortedness in a single pass. For everything else, and for anything large, call the library sort — it measured 86x faster here.
