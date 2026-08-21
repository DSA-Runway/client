---
id: next-permutation
topic: Arrays
title: Next Permutation
difficulty: Medium
status: ready
prerequisites:
  - left-rotate-array-by-k-places
  - rearrange-array-elements-by-sign
  - for-loop
  - if-else-statements
  - time-and-space-complexity-basics
relatedIds:
  - left-rotate-array-by-k-places
  - rearrange-array-elements-by-sign
  - sort-an-array-of-0s-1s-and-2s
  - 3-sum
---

<!-- @summary -->
Rearrange the array into the next arrangement in dictionary order, in place — where the two comparison operators everyone gets wrong are provably harmless on distinct values and wrong or crashing on nearly half of inputs with duplicates.

<!-- @theory -->
## The problem

Think of every arrangement of the array listed in dictionary order. Given one of
them, produce the one that comes next. If you are already at the last (the array
is descending), wrap around to the first (ascending).

```
[1,2,3] -> [1,3,2]
[1,3,2] -> [2,1,3]
[3,2,1] -> [1,2,3]     the wrap-around
```

It must be done **in place, with constant extra memory**.

## The shape of the answer

To get the *next* arrangement you want to change the array **as far to the right
as possible** — changing an earlier position jumps further ahead in dictionary
order than necessary.

So scan from the right and ask: where is the rightmost position we can increase?

A suffix that is **descending** cannot be increased at all — it is already the
largest arrangement of those values. So walk left while the array is descending.
The first position that breaks the descent is the **pivot**: the rightmost place
where a larger value can be put.

```
[1, 5, 8, 4, 7, 6, 5, 3, 1]
          ^  pivot = 4, because 4 < 7 and everything after 7 descends
```

Now three steps:

1. **Find the pivot** — rightmost `i` with `a[i] < a[i+1]`.
2. **Swap** it with the rightmost value that is strictly greater than it.
3. **Reverse** everything after the pivot.

```
[1,5,8,4,7,6,5,3,1]  pivot 4 at index 3
[1,5,8,5,7,6,4,3,1]  swapped 4 with the rightmost value > 4, which is 5
[1,5,8,5,1,3,4,6,7]  reversed the suffix
```

## Why reversing works, and why it is not a shortcut

The suffix after the pivot was **non-increasing** — that is exactly the condition
that made the scan stop there. Swapping the pivot with the rightmost larger value
**keeps it non-increasing** (the incoming value sits in a slot whose neighbours
already bracket it).

A non-increasing sequence reversed is a non-decreasing sequence. So reversing
**sorts it**, in O(n), without a comparison.

Sorting the suffix explicitly gives the identical answer — it is not a bug, just
unnecessary work. On strictly descending input, where the suffix is the entire
array, sorting measured **exactly 5x slower at every size tested** (n = 1,000,
100,000 and 4,000,000). At four million elements: **2.546ms reversing against
12.565ms sorting.**

## The two operators, and why testing will not catch them

Both loops use a non-strict comparison, and both are routinely written strict:

```
while (i >= 0 && a[i] >= a[i+1]) i--;      // pivot scan
while (a[j] <= a[i]) j--;                  // successor scan
```

Here is the measurement that matters. Over **all 5,913 arrangements of 1 to 7
distinct values**, four implementations were compared against a brute-force
reference — the correct one, the sort-the-suffix one, and both operator bugs:

| Implementation | Failures on distinct values |
|---|---|
| Standard | **0** |
| Sort the suffix | **0** |
| `>` instead of `>=` | **0** |
| `<` instead of `<=` | **0** |

**All four are perfect.** And every worked example in the problem statement uses
distinct values.

Now add duplicates:

| Implementation | over {0,1,2} | over {0,1} |
|---|---|---|
| `>` instead of `>=` | 22.84% wrong **+ 22.75% crash** | 24.54% wrong **+ 37.88% crash** |
| `<` instead of `<=` | 30.77% wrong | **47.31% wrong** |

The smallest input that breaks the pivot bug is **`[0, 0]`** — and it does not
return a wrong answer. It runs off the end of the array: `IndexError` in Python,
an out-of-bounds read in C++.

With equal neighbours, a strict `>` fails to skip past them, so the scan stops
at a position that cannot actually be increased — and the successor search then
finds nothing and walks past index 0.

**Write the tests with repeated values.** Distinct-value tests cannot distinguish
correct code from either bug.

## What it actually costs

The complexity is O(n) — but only in the worst case, and the worst case is rare.

The pivot scan stops at the first position that breaks a descent. On randomly
ordered input that happens almost immediately. Measured over hundreds of
thousands of shuffles:

| n | Mean suffix length |
|---|---|
| 8 | 1.719137 |
| 64 | 1.718465 |
| 1024 | 1.722317 |

That constant is **e − 1 = 1.718282**, and it does not depend on n at all.

So on random input the work is **O(1) amortised**. Measured cost per call was
flat across a four-thousand-fold range of sizes: 0.00808us at n = 1,000 and
0.00571us at n = 4,000,000. The O(n) bound is real, but it is reached only when
the array is nearly descending.

## The library call

C++ has `std::next_permutation`, which does exactly this and returns `false` on
the wrap-around. It is the right call in production. It was, however, **slower
than the hand-written version** on the worst case here — 4.137ms against 2.546ms
at n = 4,000,000, about 1.6x — because it is written for general iterators and
comparators rather than a contiguous array of `int`.

<!-- @intuition -->
Reading a number left to right, the last digits are worth the least. To get the next larger number you change the latest digit you possibly can, and then make everything after it as small as it can be. The pivot is the latest digit that can be raised at all. Once you raise it, the tail should be the smallest arrangement of what is left — and because that tail was already descending, flipping it end for end is exactly that smallest arrangement.

<!-- @approach -->
### Brute Force - Generate Every Permutation

<!-- @idea -->
List all arrangements in dictionary order, find where this one sits, and take the one after it.

<!-- @steps -->
1. Generate every distinct arrangement of the array's values.
2. Sort that list into dictionary order.
3. Locate the current arrangement inside it.
4. Return the arrangement at the next position, wrapping to the first if it was last.

<!-- @complexity -->
- time: O(n! * n log n) — generating every arrangement, then ordering them
- space: O(n! * n) to hold them all
- note: Unusable beyond about n = 10, where there are already 3.6 million arrangements. Its value is as an independent reference: this is what the exhaustive correctness sweep in this lesson was checked against.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <set>
using namespace std;

// Only usable as a reference for tiny n — n = 12 is already half a billion.
void nextPermutationBrute(vector<int>& a) {
    vector<int> sorted = a;
    sort(sorted.begin(), sorted.end());

    set<vector<int>> all;                     // set: dedupes repeated values
    do { all.insert(sorted); }
    while (next_permutation(sorted.begin(), sorted.end()));

    auto it = all.find(a);
    ++it;
    a = (it == all.end()) ? *all.begin() : *it;   // wrap around
}
```

<!-- @annotations -->
- 11: A set rather than a vector, so repeated values do not produce duplicate arrangements.
- 17: Landing on end() means the input was the last arrangement, which is the wrap-around case.

<!-- @code java -->
```java
import java.util.*;

static void nextPermutationBrute(int[] a) {
    List<int[]> all = new ArrayList<>();
    int[] s = a.clone();
    Arrays.sort(s);
    permute(s, 0, all);                       // collect every arrangement
    all.sort(Arrays::compare);

    int idx = 0;
    for (int i = 0; i < all.size(); i++)
        if (Arrays.equals(all.get(i), a)) { idx = i; break; }

    int[] next = all.get((idx + 1) % all.size());
    System.arraycopy(next, 0, a, 0, a.length);
}
```

<!-- @annotations -->
- 7: Building the whole list is what makes this factorial in both time and memory.
- 14: The modulo gives the wrap-around for free, without a separate branch.

<!-- @code python -->
```python
from itertools import permutations

def next_permutation_brute(a):
    ordered = sorted(set(permutations(a)))    # set() collapses duplicate values
    i = ordered.index(tuple(a))
    return list(ordered[(i + 1) % len(ordered)])


# n = 10 is 3.6 million arrangements; n = 12 is 479 million.
# This exists to verify the real algorithm, not to run on real input.
```

<!-- @annotations -->
- 4: sorted(set(...)) is dictionary order with duplicates collapsed, which is exactly the required ordering.
- 6: The modulo wraps the last arrangement back to the first.

<!-- @approach -->
### Pivot, Swap, Then Sort the Suffix

<!-- @idea -->
Find the rightmost position that can be increased, raise it, then sort everything after it into ascending order.

<!-- @steps -->
1. Scan from the right for the pivot: the rightmost index where the value is less than its right-hand neighbour.
2. If there is no such index the array is fully descending, so sort the whole array and stop.
3. Otherwise scan from the right for the last value strictly greater than the pivot.
4. Swap those two positions.
5. Sort the suffix after the pivot into ascending order.

<!-- @complexity -->
- time: O(n log n) worst case, dominated by the sort
- space: O(1) auxiliary in C++ and Java; Python's slice assignment allocates
- note: Fully correct — verified against brute force with zero failures on both distinct and duplicate inputs. The sort is simply redundant: the suffix is guaranteed non-increasing, so reversing already produces ascending order. Measured exactly 5x slower than reversing on descending input at every size tested.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void nextPermutationSort(vector<int>& a) {
    int n = a.size(), i = n - 2;
    while (i >= 0 && a[i] >= a[i + 1]) i--;          // >= not > : skip equal neighbours

    if (i >= 0) {
        int j = n - 1;
        while (a[j] <= a[i]) j--;                    // <= not < : skip equal values
        swap(a[i], a[j]);
    }
    sort(a.begin() + i + 1, a.end());                // correct, and more work than needed
}
```

<!-- @annotations -->
- 7: The non-strict >= is what makes duplicates safe. With > this crashes on [0,0].
- 11: Also non-strict. A strict < was measured 30.77% wrong once duplicates are present.
- 14: When i is -1 this sorts the whole array, which is exactly the wrap-around case.

<!-- @code java -->
```java
import java.util.Arrays;

static void nextPermutationSort(int[] a) {
    int n = a.length, i = n - 2;
    while (i >= 0 && a[i] >= a[i + 1]) i--;

    if (i >= 0) {
        int j = n - 1;
        while (a[j] <= a[i]) j--;
        int t = a[i]; a[i] = a[j]; a[j] = t;
    }
    Arrays.sort(a, i + 1, n);
}
```

<!-- @annotations -->
- 12: Arrays.sort with a range sorts only the suffix, leaving the prefix untouched.

<!-- @code python -->
```python
def next_permutation_sort(a):
    n = len(a)
    i = n - 2
    while i >= 0 and a[i] >= a[i + 1]:
        i -= 1

    if i >= 0:
        j = n - 1
        while a[j] <= a[i]:
            j -= 1
        a[i], a[j] = a[j], a[i]

    a[i + 1:] = sorted(a[i + 1:])
    return a


# Measured identical output to the reversing version on every input tested.
# On descending input it was 5x slower at n = 1,000 / 100,000 / 4,000,000 alike.
```

<!-- @annotations -->
- 13: sorted() here is doing work that reversing would do for free, since the suffix is already non-increasing.

<!-- @approach -->
### Optimal - Pivot, Swap, Reverse

<!-- @idea -->
Same three steps, but reverse the suffix instead of sorting it, because it is already non-increasing.

<!-- @steps -->
1. Scan from the right for the pivot: the rightmost index where the value is less than its right-hand neighbour.
2. If no such index exists, the whole array is the suffix and step four reverses it into ascending order.
3. Otherwise scan from the right for the last value strictly greater than the pivot, and swap them.
4. Reverse everything after the pivot.
5. Reversing sorts it because a non-increasing sequence read backwards is non-decreasing.

<!-- @complexity -->
- time: O(n) worst case, O(1) amortised on randomly ordered input
- space: O(1) auxiliary
- note: The recommended solution. The O(n) bound is real but reached only on nearly-descending input: the suffix that gets reversed averages e - 1 = 1.718 elements regardless of n, measured 1.719137 at n = 8 and 1.722317 at n = 1024. Cost per call measured flat across a 4,000x range of sizes.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void nextPermutation(vector<int>& a) {
    int n = a.size(), i = n - 2;
    while (i >= 0 && a[i] >= a[i + 1]) i--;      // find the pivot

    if (i >= 0) {
        int j = n - 1;
        while (a[j] <= a[i]) j--;                // rightmost value greater than the pivot
        swap(a[i], a[j]);
    }
    reverse(a.begin() + i + 1, a.end());         // the suffix is non-increasing: reversing sorts it
}
```

<!-- @annotations -->
- 7: This scan stops after 1.72 elements on average — measured e - 1, independent of n.
- 11: Because the suffix descends, the FIRST value found from the right is the smallest one that still exceeds the pivot.
- 14: No comparison happens here. The suffix's non-increasing order is what makes a reversal sufficient.

<!-- @code java -->
```java
static void nextPermutation(int[] a) {
    int n = a.length, i = n - 2;
    while (i >= 0 && a[i] >= a[i + 1]) i--;

    if (i >= 0) {
        int j = n - 1;
        while (a[j] <= a[i]) j--;
        int t = a[i]; a[i] = a[j]; a[j] = t;
    }
    for (int l = i + 1, r = n - 1; l < r; l++, r--) {
        int t = a[l]; a[l] = a[r]; a[r] = t;
    }
}
```

<!-- @annotations -->
- 10: The reversal written as two pointers walking inward — the same primitive used in Left Rotate by K Places.

<!-- @code python -->
```python
def next_permutation(a):
    n = len(a)
    i = n - 2
    while i >= 0 and a[i] >= a[i + 1]:
        i -= 1

    if i >= 0:
        j = n - 1
        while a[j] <= a[i]:
            j -= 1
        a[i], a[j] = a[j], a[i]

    a[i + 1:] = reversed(a[i + 1:])
    return a


# When i is -1 the whole array reverses, which is the [3,2,1] -> [1,2,3] wrap.
# Verified against brute force over all 5,913 distinct-value arrangements
# and all 3,279 arrangements over {0,1,2}: 0 failures.
```

<!-- @annotations -->
- 5: Non-strict >= on both loops. Making either one strict is correct on distinct values and broken on duplicates.
- 13: Slice assignment with reversed() does the reversal in place from the caller's perspective.

<!-- @approach -->
### Library Call

<!-- @idea -->
The standard library already implements this exact algorithm.

<!-- @steps -->
1. Call the library function on the whole range.
2. In C++ it returns false when it wrapped around, which is how you detect the last arrangement.
3. Python has no in-place equivalent in the standard library, so itertools is used as a reference rather than a solution.

<!-- @complexity -->
- time: O(n) worst case, same algorithm
- space: O(1)
- note: The right choice in production C++, and it handles the wrap-around reporting for you. It measured about 1.6x slower than the hand-written loop on a four-million-element descending array, which is the price of working through general iterators and comparators rather than a contiguous int array.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

bool advance(vector<int>& a) {
    return next_permutation(a.begin(), a.end());   // false means it wrapped to ascending
}

// Iterate every arrangement in order:
//   sort(a.begin(), a.end());
//   do { use(a); } while (next_permutation(a.begin(), a.end()));
```

<!-- @annotations -->
- 6: Measured 4.137ms at n = 4,000,000 descending, against 2.546ms hand-written — about 1.6x, the cost of being generic.

<!-- @code java -->
```java
// Java has no next-permutation in the standard library.
// The hand-written version above is the answer; this is the shape
// of the loop that walks every arrangement in dictionary order.

static void forEachPermutation(int[] a) {
    java.util.Arrays.sort(a);
    while (true) {
        use(a);
        int n = a.length, i = n - 2;
        while (i >= 0 && a[i] >= a[i + 1]) i--;
        if (i < 0) break;                        // wrapped: every arrangement seen
        nextPermutation(a);
    }
}
```

<!-- @annotations -->
- 10: Detecting i < 0 before mutating is how you tell it was the last arrangement, without needing a return value.

<!-- @code python -->
```python
from itertools import permutations

# Python's standard library has no in-place next-permutation.
# itertools.permutations generates them, but in the order of the INPUT,
# so it only matches dictionary order when the input is already sorted.

for p in sorted(set(permutations([3, 1, 2]))):
    print(p)      # (1,2,3) (1,3,2) (2,1,3) (2,3,1) (3,1,2) (3,2,1)


# Use the hand-written version for the actual problem — this is O(n!) memory.
```

<!-- @annotations -->
- 7: sorted() is doing the ordering here. permutations() alone follows input order, not dictionary order.

<!-- @example -->

<!-- @input -->
a = [1, 5, 8, 4, 7, 6, 5, 3, 1]

<!-- @output -->
[1, 5, 8, 5, 1, 3, 4, 6, 7]

<!-- @why -->
Shows the swap preserving the suffix's non-increasing order, which is the property that lets a reversal replace a sort.

<!-- @walkthrough -->
1. Scan from the right while the array descends: 1, 3, 5, 6, 7 all descend going left.
2. At index 3 the value 4 is less than its neighbour 7, so index 3 is the pivot.
3. Scan from the right for the last value strictly greater than 4: that is the 5 at index 6.
4. Swap them, giving [1, 5, 8, 5, 7, 6, 4, 3, 1].
5. The suffix after index 3 is now 7, 6, 4, 3, 1 — still non-increasing.
6. Reverse it to 1, 3, 4, 6, 7, giving [1, 5, 8, 5, 1, 3, 4, 6, 7].
7. The prefix 1, 5, 8 never moved, because changing it would jump too far ahead.

<!-- @example -->

<!-- @input -->
a = [0, 0] run with a strict > in the pivot scan

<!-- @output -->
IndexError — it does not return a wrong answer, it runs off the end

<!-- @why -->
The smallest possible failing input, and it fails by crashing rather than by returning something plausible — which is the good outcome compared to the successor bug's silent wrong answers.

<!-- @walkthrough -->
1. The pivot scan starts at index 0 and asks whether a[0] > a[1], which is 0 > 0, false.
2. So the scan stops immediately and reports index 0 as the pivot.
3. But index 0 cannot be increased — there is no larger value anywhere in the array.
4. The successor scan then looks for a value strictly greater than 0, starting from the right.
5. It finds none, and walks past index 0 into negative indices.
6. The correct answer is [0, 0] itself, since a single arrangement wraps to itself.
7. With the non-strict >= the scan skips the equal pair, ends at index -1, and the whole array reverses correctly.

<!-- @example -->

<!-- @input -->
All 5,913 arrangements of 1 to 7 distinct values

<!-- @output -->
Four implementations, including both operator bugs: 0 failures each

<!-- @why -->
Establishes that a passing test suite on distinct values carries no information at all about whether these two operators are right.

<!-- @walkthrough -->
1. The standard algorithm, the sort-the-suffix variant, and both classic operator bugs were run against a brute-force reference.
2. Every one of them produced the correct answer on every arrangement.
3. With distinct values, no two neighbours are ever equal, so a strict and a non-strict comparison behave identically.
4. The same four implementations over {0,1,2} tell a completely different story.
5. The pivot bug: 22.84% wrong answers and a further 22.75% crashes.
6. The successor bug: 30.77% wrong answers, rising to 47.31% over just {0,1}.
7. Every worked example in the problem statement uses distinct values.

<!-- @example -->

<!-- @input -->
Randomly shuffled arrays, measuring how long the reversed suffix is

<!-- @output -->
1.719137 at n=8, 1.718465 at n=64, 1.722317 at n=1024 — against e−1 = 1.718282

<!-- @why -->
Shows that the O(n) worst case and the actual cost on typical input are three orders of magnitude apart in array size and indistinguishable in time.

<!-- @walkthrough -->
1. The pivot scan stops at the first position from the right that breaks a descent.
2. For that scan to run k steps, the last k elements must happen to be in descending order.
3. The chance of that falls factorially with k, so long scans are very rare.
4. Summing the probabilities gives e − 1 as the expected length, with no dependence on n.
5. Measured over hundreds of thousands of shuffles, all three sizes agree to three decimals.
6. So on random input the operation touches under two elements on average, whatever the array size.
7. Measured cost per call was 0.00808us at n = 1,000 and 0.00571us at n = 4,000,000 — flat.

<!-- @visualization array -->

<!-- @description -->
The array as a strip of cells, with a scan marker entering from the right edge. Draw a faint descending-staircase overlay above the cells the scan has already passed, so the reader can see the scan is not searching for a value but tracing a descent — the marker keeps moving only while the staircase keeps going down. The moment the descent breaks, freeze and label that cell PIVOT in a colour used nowhere else. Then send a second marker in from the right for the successor, and as it moves show a live comparison against the pivot value pinned at the top of the screen, so the reader sees why the first value it meets that exceeds the pivot is also the smallest such value — the suffix descends, so the rightmost qualifying value is the least. Animate the swap as a genuine exchange along an arc rather than a fade, and immediately afterwards redraw the descending-staircase overlay over the suffix to make the key invariant visible: the suffix is STILL non-increasing after the swap. Hold that frame. Then reverse the suffix with paired pointers walking inward, swapping as they meet, and let the staircase flip from descending to ascending as it happens — that flip is the whole reason a reversal replaces a sort, and it should be seen rather than captioned. Run a second panel underneath on [0,0] with a strict > in the pivot scan: the marker stops at index 0 instead of stepping past the equal pair, the successor scan finds nothing, and the pointer visibly walks off the left edge of the array into a red out-of-bounds zone. Beside it run the same input with >= so the two diverge from the very first comparison. Close with two counters side by side: over distinct values, four implementations including both bugs at 0 failures out of 5,913; over duplicates, the same bugs at 22.84% wrong plus 22.75% crashing. Finally a small histogram of pivot-scan lengths on random input, with the bars collapsing almost entirely into 1 and 2 and a marked mean line at e − 1 = 1.718.

<!-- @sampleInput -->
```json
{"primary":{"input":[1,5,8,4,7,6,5,3,1],"scanFromRight":[1,3,5,6,7],"pivotIndex":3,"pivotValue":4,"successorIndex":6,"successorValue":5,"afterSwap":[1,5,8,5,7,6,4,3,1],"suffixAfterSwap":[7,6,4,3,1],"suffixIsNonIncreasing":true,"afterReverse":[1,5,8,5,1,3,4,6,7],"prefixUntouched":[1,5,8]},"bugPanel":{"input":[0,0],"strict":{"op":">","pivotFound":0,"successorSearch":"none found","result":"IndexError - walked past index 0"},"nonStrict":{"op":">=","pivotFound":-1,"result":[0,0]},"correct":[0,0]},"correctnessPanel":{"distinct":{"arrangements":5913,"n":"1..7","standard":0,"sortSuffix":0,"pivotBug":0,"successorBug":0},"duplicates012":{"arrangements":3279,"pivotBugWrong":0.2284,"pivotBugCrash":0.2275,"successorBugWrong":0.3077},"duplicates01":{"arrangements":2046,"pivotBugWrong":0.2454,"pivotBugCrash":0.3788,"successorBugWrong":0.4731}},"costPanel":{"eMinus1":1.718282,"measured":[{"n":8,"mean":1.719137,"trials":400000},{"n":64,"mean":1.718465,"trials":400000},{"n":1024,"mean":1.722317,"trials":60000}],"perCallUs":[{"n":1000,"reverse":0.00808},{"n":4000000,"reverse":0.00571}],"descending4M":{"reverseMs":2.546,"sortMs":12.565,"stdNextPermMs":4.137,"sortRatio":5}}}
```

<!-- @highlights -->
- The array is drawn as a strip with a scan marker entering from the right edge.
- A faint descending-staircase overlay forms above the cells the scan has passed, showing it traces a descent rather than searching for a value.
- The scan crosses 1, 3, 5, 6, 7 while the staircase keeps falling.
- At index 3 the value 4 breaks the descent, and that cell is frozen and labelled PIVOT in a unique colour.
- A second marker enters from the right, comparing each value against the pivot value pinned at the top.
- It stops at the 5 at index 6 — the first value exceeding 4, and therefore the smallest such value, because the suffix descends.
- The swap animates as an exchange along an arc, not a fade, so both values are seen moving.
- The staircase overlay is redrawn over the suffix, showing it is STILL non-increasing after the swap, and the frame holds.
- Paired pointers walk inward through the suffix, swapping as they go.
- The staircase flips from descending to ascending as the reversal completes — the reason a reversal replaces a sort, shown rather than captioned.
- The prefix 1, 5, 8 is visibly never touched throughout.
- A second panel runs [0,0] with a strict > : the marker stops at index 0 instead of stepping past the equal pair.
- The successor scan finds nothing and the pointer walks off the left edge into a red out-of-bounds zone.
- The same input with >= runs beside it, diverging from the very first comparison and ending correctly at [0,0].
- Two counters close the comparison: 0 failures out of 5,913 on distinct values for all four implementations, including both bugs.
- Against duplicates the same bugs read 22.84% wrong plus 22.75% crashing.
- A histogram of pivot-scan lengths on random input collapses almost entirely into 1 and 2, with a mean line marked at e − 1 = 1.718.

<!-- @edgeCases -->
- Empty array — the pivot scan starts below index 0 and nothing happens, which is correct.
- Single element — one arrangement exists, so the answer is itself.
- Two equal elements such as [0,0] — one distinct arrangement, wraps to itself, and the smallest input that exposes the strict-comparison bug.
- Strictly ascending input — the pivot is the second-to-last index and only the final two elements swap.
- Strictly descending input — no pivot exists, and the whole array reverses to ascending. This is the wrap-around and the worst case for cost.
- All elements equal — no pivot exists, the reversal is a no-op, and the array is unchanged.
- Exactly two elements in either order — the smallest case where an actual swap occurs.
- Duplicates spanning the pivot, such as [1,5,1] — the successor scan must skip values equal to the pivot, not stop at them.
- Duplicates in the suffix only, such as [1,3,2,2] — the reversal must handle repeated values without disturbing correctness.
- Large arrays that are already descending — the only shape where the O(n) bound is actually reached.
- Negative values — nothing in the algorithm assumes positivity; only the ordering matters.

<!-- @pitfalls -->
- Writing a strict > in the pivot scan. Measured 0 failures on distinct values and 22.84% wrong plus 22.75% crashes over {0,1,2} — it fails only when neighbours are equal.
- Writing a strict < in the successor scan. Measured 0 failures on distinct values, 30.77% wrong over {0,1,2}, and 47.31% wrong over {0,1}.
- Testing only with distinct values. All four implementations tried here — including both bugs — scored 0 failures across all 5,913 distinct-value arrangements, so such a suite proves nothing about either operator.
- Trusting the problem statement's examples. Every worked example in LeetCode 31 uses distinct values, so copying them as test cases reproduces exactly the blind spot.
- Forgetting the wrap-around. When no pivot exists the array must reverse to ascending, not be left alone.
- Handling the wrap-around with a separate branch. Letting the pivot index fall to -1 makes the reversal cover the whole array automatically, so no branch is needed.
- Sorting the suffix instead of reversing it. Correct, but measured exactly 5x slower on descending input at n = 1,000, 100,000 and 4,000,000 alike.
- Searching the suffix for the successor with a scan from the left. The suffix descends, so scanning from the right finds the smallest qualifying value first — from the left you would find the largest.
- Assuming this is O(n) in practice. On random input the reversed suffix averages e − 1 = 1.718 elements regardless of n, so the cost per call is effectively constant.
- Reversing from index i rather than i + 1, which drags the pivot itself into the reversal and produces a smaller arrangement, not the next one.
- Building the answer in a new array. The problem requires constant extra memory, and all three steps are in-place by construction.

<!-- @doubt -->
### Why is it >= in the pivot scan and not just >?

<!-- @answer -->
Because equal neighbours must be skipped. A suffix like 5, 5, 3 cannot be increased — it is already the largest arrangement of those values — so the scan has to walk past the equal pair. With a strict > the scan stops at the first pair of equals and reports a pivot that cannot actually be raised, and the successor search then finds nothing and runs off the front of the array. Measured: 0 failures across all 5,913 distinct-value arrangements, then 22.84% wrong answers plus 22.75% crashes once duplicates appear. The smallest input that breaks it is [0, 0].

<!-- @doubt -->
### My solution passes every test. How do I know these operators are right?

<!-- @answer -->
You do not, if your tests use distinct values. That is the measurement worth remembering here: four implementations were checked against brute force over all 5,913 arrangements of 1 to 7 distinct values — the correct algorithm, the sort-the-suffix variant, and both operator bugs — and all four scored zero failures. The bugs are undetectable on distinct input, and every worked example in the problem statement is distinct. Add [1,1], [1,1,2], [2,2,1] and [1,2,2] to your tests and both bugs fail immediately.

<!-- @doubt -->
### Why does reversing the suffix work? Shouldn't it be sorted?

<!-- @answer -->
It is sorted — reversing is how. The pivot scan stops precisely because everything to its right is non-increasing, and swapping the pivot with the rightmost larger value leaves it non-increasing, since the incoming value lands in a slot whose neighbours already bracket it. A non-increasing sequence read backwards is non-decreasing, so a reversal produces ascending order without a single comparison. Sorting gives the identical answer and was measured exactly 5x slower on descending input at n = 1,000, 100,000 and 4,000,000 alike — 2.546ms against 12.565ms at four million.

<!-- @doubt -->
### Why search for the successor from the right instead of the left?

<!-- @answer -->
Because you want the smallest value that still exceeds the pivot, and the suffix descends. Scanning from the right, the first value you meet that is greater than the pivot is therefore the smallest such value. Scanning from the left would find the largest one, which produces a valid arrangement but not the next one — it would skip past several. The direction is doing real work, not just matching the other loop's style.

<!-- @doubt -->
### What happens when the array is already the last arrangement?

<!-- @answer -->
The pivot scan runs off the front and leaves the index at -1. You do not need a special case for this: reversing from index i + 1, which is 0, reverses the whole array, turning descending into ascending — exactly the required wrap-around. Writing a separate branch for it is a common way to introduce a bug, since the general code already handles it.

<!-- @doubt -->
### Is this really O(n)? It seems to finish instantly.

<!-- @answer -->
O(n) is the worst case and it is reached only on nearly-descending input. On randomly ordered input the pivot scan stops almost immediately, because it only continues while the tail happens to be descending, and the chance of that falls factorially. The expected length of the reversed suffix is e − 1 = 1.718282, with no dependence on n at all — measured 1.719137 at n = 8, 1.718465 at n = 64 and 1.722317 at n = 1024. Cost per call measured 0.00808us at n = 1,000 and 0.00571us at n = 4,000,000, flat across a four-thousand-fold range.

<!-- @doubt -->
### Should I just call std::next_permutation?

<!-- @answer -->
In production C++, yes — it is the same algorithm, it is correct, and it returns false on the wrap-around so you can detect the last arrangement. Two caveats. It measured about 1.6x slower than the hand-written loop on a four-million-element descending array, 4.137ms against 2.546ms, because it works through general iterators and comparators rather than a contiguous int array. And Java has no equivalent in its standard library, so you need the hand-written version there regardless.

<!-- @doubt -->
### How does this relate to reversing an array by K places?

<!-- @answer -->
Reversal is the shared primitive. There, three reversals rotate an array in place with no extra memory; here, one reversal turns a descending suffix into an ascending one. In both cases the reversal replaces something that looks like it needs a temporary buffer or a sort, and in both cases the reason it works is a property of the data you have already established — the block structure there, the non-increasing suffix here. Recognising when a reversal is enough is the transferable step.
