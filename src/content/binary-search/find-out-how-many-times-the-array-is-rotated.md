---
id: find-out-how-many-times-the-array-is-rotated
topic: Binary Search
title: Find out how many times the array is rotated
difficulty: Easy
status: ready
prerequisites:
  - find-minimum-in-rotated-sorted-array
  - lower-bound
  - integer-overflow-and-precision-errors
relatedIds:
  - find-minimum-in-rotated-sorted-array
  - search-in-rotated-sorted-array-i
  - search-in-rotated-sorted-array-ii
  - lower-bound
  - left-rotate-array-by-k-places
---

<!-- @summary -->
Return lo instead of a[lo] and the previous subtopic answers this one. What the one-token change actually costs is everything else: the direction of rotation stops being cosmetic, the modulo becomes load-bearing on 20% of inputs, the linear alternative loses 44x because an index cannot be vectorised where a value can, and under duplicates the identity this problem rests on stops being true at all.

<!-- @theory -->
## The problem

A sorted array was rotated some number of times. Recover that number.

```
[4, 5, 6, 7, 0, 1, 2]  ->  4
[11, 13, 15, 17]       ->  0      never rotated
[2, 1]                 ->  1
```

## It is the index of the minimum

Rotating a sorted array right by k moves its first element — the minimum — to
index k. Nothing else can land there, so reading the minimum's position reads k
back.

The previous subtopic's loop already computes that position and then throws it
away:

```
lo = 0, hi = n - 1
while lo < hi:
    mid = lo + (hi - lo) / 2
    if a[mid] > a[hi]:  lo = mid + 1
    else:               hi = mid
return lo                    # not a[lo]
```

Verified over every distinct sorted array of length 1 to 9 drawn from `{0..9}`,
in every rotation — **5,110 cases, 0 wrong.**

That is the entire algorithmic content of this subtopic. Everything below is the
part that actually goes wrong.

## Which direction?

"Rotated k times" does not say which way, and the two readings give different
numbers for the same array. This is not pedantry — it is the mistake I made
constructing the test set for this container, and the exhaustive check failed on
3,578 of 5,110 cases before I noticed.

- **Right rotation by k** moves each element k places toward the back, wrapping.
  The minimum lands at index k, so `k = indexOfMin`.
- **Left rotation by k** moves each element k places toward the front. The
  minimum lands at index `n - k`, so `k = (n - indexOfMin) % n`.

```
sorted:            [1, 2, 3, 4, 5]

right-rotate by 2: [4, 5, 1, 2, 3]     min at index 2
left-rotate  by 2: [3, 4, 5, 1, 2]     min at index 3 = 5 - 2
```

Measured, `(n - indexOfMin) % n` recovers the left-rotation count on **5,110 of
5,110** cases. Most sources posing this problem mean the right-rotation count,
because it is the one the index gives directly — but the phrasing rarely says so,
and a solution that silently assumes the wrong one is wrong on every rotated
input.

## The modulo is not decoration

Writing the left-rotation count as `n - indexOfMin` without the `% n` is wrong on
**1,022 of 5,110 cases — exactly 20.00%**, and the failures are precisely the
unrotated arrays: the minimum is at index 0, so the formula returns `n` where the
answer is 0.

This is the same shape of bug as the previous subtopic's missing guard. An
unrotated array is a fifth of the exhaustive space, not an edge case, and it is
the input every one of these formulas trips over.

## The alternative that reads out of bounds

The other natural approach is to binary search for the *drop* — the single place
where `a[i] > a[i+1]` — and return the index just after it. It works, and its two
probes need bounds guards:

```
if m + 1 < n and a[m] > a[m + 1]:  return m + 1
if m - 1 >= 0 and a[m - 1] > a[m]: return m
```

Measured, those guards are not defensive: over the 5,110 exhaustive cases, a probe
lands on `m == 0` or `m == n - 1` in **507 of them — 9.92%**. One call in ten
would read `a[-1]` or `a[n]` without them.

I expected the *sortedness* check at the top to be load-bearing too, since an
unrotated array has no drop for the loop to find. It is not. The loop simply
finds nothing, falls out, and returns 0 — measured **0 wrong** with the check
removed. It is a genuine optimisation here rather than a fix, which is the
opposite of what the same-looking line did for the left-end formulation in the
previous subtopic. Worth checking rather than assuming, in both directions.

The drop version is correct and consistently slower, because each iteration does
up to three comparisons and two early-exit branches instead of one comparison:

| n | linear scan | binary drop | index of minimum |
|---|---|---|---|
| 16 | 8.47 | 11.67 | **3.36** |
| 64 | 72.84 | 16.95 | **5.71** |
| 256 | 432.07 | 22.21 | **8.56** |
| 1,024 | 1,752.22 | 27.96 | **11.66** |
| 65,536 | - | 51.98 | **28.01** |

## Returning an index costs the linear scan 44x

Look at the first column. In Count Occurrences the linear scan was the *fastest*
approach up to n = 256, because counting vectorises. Here the same-shaped scan is
**432ns at n = 256** against 11.25ns for the value-returning version — and the
only difference is what it returns.

| | instructions | vector instructions | |
|---|---|---|---|
| scan for the minimum **value** | 41 | **12** | 11.25ns at n = 256 |
| scan for the minimum **index** | 17 | 0 | 404.04ns at n = 256 |

Measured across sizes, asking for the index instead of the value costs **35.9x at
n = 256 and 44.3x at n = 1,024** (falling to 8.1x at n = 65,536, where memory
bandwidth dominates and neither version is compute-bound).

The cause is that `best = min(best, a[i])` is a reduction the compiler can split
across four lanes and combine at the end, while `if (a[i] < a[best]) best = i`
carries a loop-dependent index that each iteration must resolve before the next
can begin. Sixteen fewer instructions, forty times slower.

The binary version pays nothing for the same change — `return lo` and
`return a[lo]` compile to the same descent. So the one-token difference between
this subtopic and the last is free for the logarithmic solution and enormous for
the linear one.

## Under duplicates the question itself breaks

Every previous subtopic that met duplicates had an algorithm that needed
repairing. Here the *identity* fails first, and no algorithm can repair it.

**The rotation count can be unrecoverable.** Over every sorted multiset drawn
from `{0,1,2}` up to length 8, in every rotation — 990 pairs — **105, or 10.61%,
have more than one k producing the identical array.** The extreme case is eight
equal elements, where all eight rotation counts give the same array and no
function of that array can tell them apart.

**The index of the minimum stops being the answer.** On `a = [0, 1, 0]` the true
right-rotation count is 2, and the leftmost minimum sits at index 0. Both are
facts about the same array, and they disagree.

**Neither algorithm survives.** Of the 885 cases where k *is* uniquely determined:

| | returns a k inconsistent with the array |
|---|---|
| distinct-only form | 114 of 885 — 12.88% |
| the previous subtopic's duplicate-tolerant repair | still wrong on the index |

That last row deserves care, because the repair is not broken — it is solving the
other problem. Measured over all 990 pairs, the `hi -= 1` version returns the
**wrong minimum value 0 times** and an **index different from the true k on 132 —
13.33%**. It fixes the previous subtopic completely and this one not at all,
because this one needs the position and duplicates are exactly what makes the
position ambiguous.

The honest conclusion is that this problem is well-posed only on distinct values,
and that is a statement about the problem rather than about any solution to it.

<!-- @intuition -->
It is tempting to treat this as a relabelling of the previous subtopic, and for the code it is. The reason it is worth its own container is that returning a *position* instead of a *value* changes what can go wrong. A value is intrinsic to the array — the minimum is the minimum however you got there — while a position only means something relative to a convention: which direction you rotated, whether you count from zero, whether the array even determines a unique position at all. Every failure in this container comes from that shift, not from the search. The general lesson is worth carrying: when a function starts returning an index rather than a thing, the specification acquires questions it did not have before, and those questions have to be answered in the problem statement rather than in the loop.

<!-- @approach -->
### Linear Scan

<!-- @idea -->
Walk the array and keep the index of the smallest element seen.

<!-- @steps -->
1. Take index 0 as the current best.
2. Compare every later element against the element at the best index.
3. Move the best index whenever a smaller element appears.
4. Return the best index, which is the right-rotation count.
5. An unrotated array never updates, leaving 0.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The slowest approach here by a wide margin, and instructively so. Tracking an index rather than a value blocks vectorisation entirely — 0 vector instructions against 12 — so it measures 404.04ns at n = 256 where the value-returning scan measures 11.25ns, a factor of **35.9x**. That gap is caused purely by what the loop returns.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int countRotations(const vector<int>& a) {
    int best = 0;
    for (int i = 1; i < (int)a.size(); i++) {
        if (a[i] < a[best]) best = i;
    }
    return best;
}
```

<!-- @annotations -->
- 5: Seeding at index 0 rather than a sentinel, which also makes the unrotated answer fall out with no update.
- 7: This is the line that costs 35.9x. Carrying an index makes each iteration depend on the previous one's result, so the loop cannot be split across vector lanes the way `best = min(best, a[i])` can.
- 9: Returning the index, not the value. That single word is the whole difference from the previous subtopic.

<!-- @code java -->
```java
static int countRotations(int[] a) {
    int best = 0;
    for (int i = 1; i < a.length; i++) {
        if (a[i] < a[best]) best = i;
    }
    return best;
}
```

<!-- @annotations -->
- 4: Strictly less than, so ties keep the earliest index. With distinct values that never arises; with duplicates it is one of several reasons the answer stops being well defined.

<!-- @code python -->
```python
def count_rotations(a):
    return a.index(min(a))


# Two passes rather than one, and still far faster than a
# hand-written loop because both run in C.
```

<!-- @annotations -->
- 2: min then index is two O(n) passes. In Python that beats one interpreted pass, which is the opposite of the C++ trade-off on the same line.

<!-- @approach -->
### Binary Search for the Drop

<!-- @idea -->
Find the one place where the order breaks — where an element is greater than its successor — and return the index just after it.

<!-- @steps -->
1. If the window is already sorted, there is no drop, so the answer is 0.
2. Otherwise take mid and look at its two neighbours.
3. If mid is greater than the element after it, the drop is there and the answer is mid plus one.
4. If the element before mid is greater than mid, the answer is mid.
5. Otherwise move toward the half that still contains the drop, comparing mid against the first element.

<!-- @complexity -->
- time: O(log n)
- space: O(1)
- note: Correct on all 5,110 exhaustive cases and about 1.85x slower than the index-of-minimum form, because each iteration does up to three comparisons and two early-exit branches. Its bounds guards are not defensive — a probe lands on the first or last index in **9.92%** of cases.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int countRotations(const vector<int>& a) {
    int n = (int)a.size();
    int lo = 0, hi = n - 1;
    if (a[lo] <= a[hi]) return 0;              // fast path, not a correctness fix
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (mid + 1 < n && a[mid] > a[mid + 1]) return mid + 1;
        if (mid - 1 >= 0 && a[mid - 1] > a[mid]) return mid;
        if (a[mid] >= a[0]) lo = mid + 1;
        else                hi = mid - 1;
    }
    return 0;
}
```

<!-- @annotations -->
- 7: Removing this line measures 0 wrong — the loop finds no drop, falls through, and returns 0. It is a shortcut, unlike the same-looking line in the left-end formulation of the previous subtopic, which was required.
- 10: The bounds test comes first and is load-bearing: a probe lands on the last index in 9.92% of cases, and without the guard this reads a[n].
- 11: The mirror guard for a[-1], needed for the same reason at the other end.
- 12: Comparing against a[0] rather than a[hi], which is safe here only because line 7 has already excluded the unrotated array.
- 15: The fallthrough. This is what makes line 7 optional rather than required.

<!-- @code java -->
```java
static int countRotations(int[] a) {
    int n = a.length, lo = 0, hi = n - 1;
    if (a[lo] <= a[hi]) return 0;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (mid + 1 < n && a[mid] > a[mid + 1]) return mid + 1;
        if (mid - 1 >= 0 && a[mid - 1] > a[mid]) return mid;
        if (a[mid] >= a[0]) lo = mid + 1;
        else                hi = mid - 1;
    }
    return 0;
}
```

<!-- @annotations -->
- 5: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int from n = 1,073,741,825.
- 6: Java short-circuits && left to right, so the bounds test protects the access exactly as it does in C++.

<!-- @code python -->
```python
def count_rotations(a):
    n = len(a)
    lo, hi = 0, n - 1
    if a[lo] <= a[hi]:
        return 0
    while lo <= hi:
        mid = (lo + hi) // 2
        if mid + 1 < n and a[mid] > a[mid + 1]:
            return mid + 1
        if mid - 1 >= 0 and a[mid - 1] > a[mid]:
            return mid
        if a[mid] >= a[0]:
            lo = mid + 1
        else:
            hi = mid - 1
    return 0
```

<!-- @annotations -->
- 8: `mid + 1 < n` must come first. Without it Python raises IndexError rather than reading garbage — loud, but still a bug in 9.92% of calls.
- 10: `mid - 1 >= 0` matters more in Python than in C, because a[-1] silently wraps to the last element instead of faulting.

<!-- @approach -->
### The Index of the Minimum

<!-- @idea -->
Run the previous subtopic's descent and return the surviving position rather than the value stored there.

<!-- @steps -->
1. Keep a window from lo to hi, with the minimum always inside it.
2. While the window holds more than one position, take mid.
3. If the midpoint is greater than the right end, the minimum is strictly to its right.
4. Otherwise the minimum is at or before mid.
5. The surviving position is both the minimum's index and the right-rotation count.

<!-- @complexity -->
- time: O(log n)
- space: O(1)
- note: The answer, and free relative to the previous subtopic — `return lo` and `return a[lo]` compile to the same descent. Measured 3.36ns at n = 16 and 28.01ns at n = 65,536, against 11.67ns and 51.98ns for the drop-based version. 0 wrong over 5,110 exhaustive cases.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int countRotations(const vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1;
        else                hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 6: lo < hi, so the loop narrows to one surviving position — the same convention Lower Bound used.
- 8: Comparing to a[hi], not a[lo]. That choice is what removes the need for an unrotated special case, as measured in the previous subtopic at 99.02%.
- 9: hi = mid, not mid - 1, because mid is still a candidate for holding the minimum.
- 11: lo, not a[lo]. This is the entire difference from Find Minimum, and it costs nothing — the descent is identical.

<!-- @code java -->
```java
static int countRotations(int[] a) {
    int lo = 0, hi = a.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1;
        else                hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 8: This returns the RIGHT-rotation count. For the left-rotation count the caller needs (n - lo) % n, and the modulo is required.

<!-- @code python -->
```python
def count_rotations(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] > a[hi]:
            lo = mid + 1
        else:
            hi = mid
    return lo


# Right-rotation count. For left rotations: (len(a) - lo) % len(a)
# — the modulo is what makes an unrotated array give 0 and not n.
```

<!-- @annotations -->
- 5: No branch anywhere asks whether the array was rotated, which is why index 0 comes back naturally for an unrotated array.

<!-- @example -->

<!-- @input -->
```
a = [4, 5, 6, 7, 0, 1, 2]
```

<!-- @output -->
```
4
```

<!-- @why -->
The sorted array [0,1,2,4,5,6,7] rotated right by 4 puts its minimum, 0, at index 4. Reading that index back recovers the rotation count.

<!-- @walkthrough -->
```
lo=0 hi=6   mid=3  a[3]=7  a[6]=2   7 > 2   lo = 4     window [4,6]
lo=4 hi=6   mid=5  a[5]=1  a[6]=2   1 > 2?  no  hi = 5 window [4,5]
lo=4 hi=5   mid=4  a[4]=0  a[5]=1   0 > 1?  no  hi = 4 window [4,4]
lo == hi -> 4

As a LEFT-rotation count the same array reads
(7 - 4) % 7 = 3, which is a different and equally
correct answer to a different question.
```

<!-- @example -->

<!-- @input -->
```
a = [11, 13, 15, 17]
```

<!-- @output -->
```
0
```

<!-- @why -->
Never rotated. This is a fifth of the exhaustive space and the input that breaks the naive left-rotation formula, which returns n instead of 0.

<!-- @walkthrough -->
```
lo=0 hi=3   mid=1  a[1]=13  a[3]=17   13 > 17?  no  hi = 1
lo=0 hi=1   mid=0  a[0]=11  a[1]=13   11 > 13?  no  hi = 0
lo == hi -> 0

Left-rotation count, done correctly:
  (n - lo) % n = (4 - 0) % 4 = 0        correct
Left-rotation count, without the modulo:
  n - lo       = 4 - 0     = 4          WRONG

That omission is wrong on 1,022 of 5,110 exhaustive
cases — exactly the 20.00% that are unrotated.
```

<!-- @example -->

<!-- @input -->
```
a = [2, 1]
```

<!-- @output -->
```
1
```

<!-- @why -->
The smallest rotated array, and the case that requires `hi = mid` rather than `mid - 1` — with `mid - 1` the window would empty and the index would be lost.

<!-- @walkthrough -->
```
lo=0 hi=1   mid=0  a[0]=2  a[1]=1   2 > 1   lo = 1
lo == hi -> 1

For n = 2 the right- and left-rotation counts coincide:
(2 - 1) % 2 = 1. That coincidence is why two-element
arrays never catch a direction bug.
```

<!-- @example -->

<!-- @input -->
```
a = [0, 1, 0]
```

<!-- @output -->
```
2  (and the algorithm returns 0)
```

<!-- @why -->
Duplicates, and the case that shows the identity itself failing rather than the code. The true right-rotation count is 2, while the leftmost minimum sits at index 0 — so "the rotation count is the index of the minimum" is simply not true here.

<!-- @walkthrough -->
```
sorted multiset:            [0, 0, 1]
right-rotate by 2:  last 2 = [0, 1], then [0]  ->  [0, 1, 0]
so the true k is 2

leftmost minimum in [0, 1, 0] is at index 0

Both statements are true, and they disagree. No repair to
the search fixes this, because the premise it relies on is
what duplicates destroy. Over 990 exhaustive duplicate
cases, 105 (10.61%) do not determine k at all — for eight
equal elements, all eight rotation counts produce the
identical array.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the rotation count as the minimum's index, then the three ways that framing goes wrong: rotation direction, the missing modulo on unrotated arrays, and duplicates making the count unrecoverable. Also carries the measured cost of returning an index rather than a value.

<!-- @sampleInput -->
```json
{"primary":{"array":[4,5,6,7,0,1,2],"sorted":[0,1,2,4,5,6,7],"rightRotations":4,"answer":4,"trace":[{"lo":0,"hi":6,"mid":3,"value":7,"rightEnd":2,"test":"7 > 2","result":true,"action":"lo = mid + 1","window":[4,6]},{"lo":4,"hi":6,"mid":5,"value":1,"rightEnd":2,"test":"1 > 2","result":false,"action":"hi = mid","window":[4,5]},{"lo":4,"hi":5,"mid":4,"value":0,"rightEnd":1,"test":"0 > 1","result":false,"action":"hi = mid","window":[4,4]}],"verified":{"cases":5110,"wrong":0,"space":"every distinct sorted array of length 1..9 from {0..9}, every rotation"}},"direction":{"warning":"the phrase 'rotated k times' does not say which way, and the two readings give different numbers","right":{"formula":"k = indexOfMin","reason":"rotating right by k moves the minimum to index k"},"left":{"formula":"k = (n - indexOfMin) % n","verified":{"cases":5110,"agree":5110}},"example":{"sorted":[1,2,3,4,5],"rightBy2":[4,5,1,2,3],"rightMinIndex":2,"leftBy2":[3,4,5,1,2],"leftMinIndex":3},"authorNote":"this container's first test set used the wrong direction and failed 3,578 of 5,110 before the mistake was found"},"modulo":{"formula":"n - indexOfMin, without % n","wrong":1022,"of":5110,"pct":20.00,"failureSet":"exactly the unrotated arrays, where it returns n instead of 0"},"dropAlternative":{"correct":{"cases":5110,"wrong":0},"boundsGuards":{"required":true,"probeHitsEnd":507,"of":5110,"pct":9.92,"consequence":"reads a[-1] or a[n]"},"sortednessCheck":{"expected":"load-bearing","measured":"optional — 0 wrong with it removed","reason":"the loop finds no drop, falls through, and returns 0","contrast":"the same-looking line WAS required for the left-end formulation in Find Minimum"},"speed":"about 1.85x slower than index-of-minimum"},"benchmark":{"units":"ns per call, best of 7, rotation uniformly random","rows":[{"n":16,"scan":8.47,"drop":11.67,"minIndex":3.36},{"n":64,"scan":72.84,"drop":16.95,"minIndex":5.71},{"n":256,"scan":432.07,"drop":22.21,"minIndex":8.56},{"n":1024,"scan":1752.22,"drop":27.96,"minIndex":11.66},{"n":65536,"drop":51.98,"minIndex":28.01}]},"indexVersusValue":{"claim":"returning an index instead of a value costs the linear scan up to 44x and the binary version nothing","assembly":[{"fn":"scan for the minimum value","instructions":41,"vectorInstructions":12},{"fn":"scan for the minimum index","instructions":17,"vectorInstructions":0}],"measured":[{"n":256,"valueNs":11.25,"indexNs":404.04,"ratio":35.9},{"n":1024,"valueNs":36.38,"indexNs":1612.25,"ratio":44.3},{"n":65536,"valueNs":2967.50,"indexNs":23971.25,"ratio":8.1,"note":"memory-bound, so neither version is compute-limited"}],"cause":"min is a reduction that splits across lanes; carrying an index makes each iteration depend on the previous one","contrast":"in Count Occurrences the vectorised scan was the FASTEST approach up to n = 256"},"duplicates":{"framing":"here the identity fails before any algorithm does","space":"every sorted multiset over {0,1,2} of length 1..8, every right rotation","pairs":990,"kNotRecoverable":{"count":105,"pct":10.61,"worst":{"array":[0,0,0,0,0,0,0,0],"distinctKThatFit":8}},"kUniquelyDetermined":885,"identityFails":{"array":[0,1,0],"trueK":2,"leftmostMinIndex":0,"reading":"both are facts about the same array and they disagree"},"algorithms":[{"form":"distinct-only","inconsistentK":114,"ofUniqueCases":885,"pct":12.88},{"form":"previous subtopic's hi -= 1 repair","wrongMinimumValue":0,"indexNotEqualToK":132,"ofPairs":990,"pct":13.33,"reading":"it fixes Find Minimum completely and this subtopic not at all"}],"conclusion":"the problem is well-posed only on distinct values, which is a statement about the problem rather than about any solution"},"assertions":["the answer is in 0..n-1","the answer is 0 exactly when the array is unrotated","a[answer] is the minimum","rotating right by the answer's complement restores sorted order","the descent is identical to Find Minimum's"]}
```

<!-- @highlights -->
- The rotation count is the index of the minimum — `return lo` instead of `return a[lo]`, 0 wrong over 5,110 cases.
- "Rotated k times" does not say which way: right gives `indexOfMin`, left gives `(n - indexOfMin) % n`.
- Dropping the `% n` is wrong on exactly the unrotated arrays — 1,022 of 5,110, or 20.00%.
- The drop-based alternative's bounds guards are not defensive: a probe lands on an end in 9.92% of cases.
- Returning an index rather than a value blocks vectorisation and costs the linear scan up to 44x; the binary version pays nothing.
- Under duplicates the count can be unrecoverable — 10.61% of cases, and all eight rotations of eight equal elements are identical.

<!-- @edgeCases -->
- An unrotated array — the answer is 0, and it is the input that breaks the modulo-free left-rotation formula.
- A single-element array — the loop never runs and 0 is correct for every reading of the question.
- Two elements — the only size where the right- and left-rotation counts always coincide, so direction bugs hide.
- A rotation by exactly n — indistinguishable from 0, and 0 is the canonical answer.
- The minimum at the last index — only possible for `[2, 1]`-shaped input of length 2.
- An array with duplicates — the count may not be recoverable at all, in 10.61% of measured cases.
- An array of all equal values — every k in 0..n-1 is consistent, and the algorithm returns 0.
- Using the result as a left-rotation count without the modulo — off by n on every unrotated array.
- An empty array — every version indexes a[0] or a.size() - 1 unguarded; the problem guarantees at least one element.
- n above 1,073,741,824 — where `(lo + hi) / 2` overflows an int, exactly as in Lower Bound.

<!-- @pitfalls -->
- Not fixing the direction. Right rotations give `indexOfMin`; left rotations give `(n - indexOfMin) % n`, and the two differ on every rotated input.
- Writing `n - indexOfMin` for left rotations without the modulo. Wrong on 1,022 of 5,110 cases — every unrotated array, 20.00%.
- Testing only with two-element arrays. They are the one size where both directions agree, so a direction bug survives.
- Returning `a[lo]` out of habit. That is the previous subtopic; this one returns `lo`.
- Omitting the bounds guards in the drop-based version. A probe lands on the first or last index in 9.92% of calls.
- Assuming the drop version's sortedness check is required. Measured 0 wrong without it — the fallthrough returns 0.
- Using a linear scan because "it is only O(n)". Tracking an index blocks vectorisation, so it measures 44.3x slower than the value-returning scan at n = 1,024 and 150x slower than the binary version.
- Applying the previous subtopic's `hi -= 1` duplicate repair here. It recovers the minimum value with 0 errors and returns the wrong index on 13.33% of duplicate cases.
- Expecting any correct answer on duplicated input. In 10.61% of measured cases the array does not determine k.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825.

<!-- @doubt -->
### Which direction does "rotated k times" mean?

<!-- @answer -->
The problem statement has to say, and most do not. Rotating **right** by k moves the minimum to index k, so `k = indexOfMin`. Rotating **left** by k moves it to index n - k, so `k = (n - indexOfMin) % n`. On `[1,2,3,4,5]`, rotating right by 2 gives `[4,5,1,2,3]` with the minimum at index 2, and rotating left by 2 gives `[3,4,5,1,2]` with it at index 3. Both formulas verified on all 5,110 exhaustive cases. Sources posing this problem almost always mean the right-rotation count, because that is what the index gives directly — but assume it silently and you are wrong on every rotated input. This is not a hypothetical: the first test set I built for this container used the wrong direction and failed on 3,578 of 5,110 cases before I found the mistake.

<!-- @doubt -->
### Why does the left-rotation formula need `% n`?

<!-- @answer -->
Because of the unrotated array, which is where every formula in this container goes wrong. If the minimum is at index 0, `n - 0` is `n` — but the array was rotated 0 times, not n times, and n is not even a valid answer in the range 0 to n-1. Measured, dropping the modulo is wrong on **1,022 of 5,110 cases, exactly 20.00%**, and every one of those is an unrotated array. The modulo also expresses something true rather than patching something: rotations are counted modulo n, so k and k + n describe the same array and the function returns the canonical representative.

<!-- @doubt -->
### Should I search for the drop instead?

<!-- @answer -->
It works and it is slower. Finding the one place where `a[i] > a[i+1]` and returning `i+1` is correct on all 5,110 exhaustive cases, and measures about 1.85x behind the index-of-minimum form — 11.67ns against 3.36ns at n = 16, 51.98ns against 28.01ns at n = 65,536 — because each iteration does up to three comparisons and two early-exit branches where the other does one comparison. It also needs two bounds guards that are not optional: a probe lands on index 0 or index n-1 in **9.92%** of cases, so without them roughly one call in ten reads `a[-1]` or `a[n]`. The index-of-minimum form has no neighbour to look at and therefore no bound to guard.

<!-- @doubt -->
### Does the drop version need the "already sorted" check?

<!-- @answer -->
No, and I expected it to. The reasoning that it would is sound-sounding — an unrotated array has no drop, so the search has nothing to find — but the loop simply exhausts, falls through, and hits `return 0`, which is the right answer. Measured **0 wrong** with the check deleted. It is a fast path worth keeping (it turns a logarithmic descent into one comparison for sorted input) but it is not load-bearing. That is the opposite of what the identical-looking line does in the previous subtopic's left-end formulation, where deleting it made the function wrong on 99.02% of unrotated arrays. Same line, same intuition, opposite verdict — which is a good argument for measuring rather than reasoning about which guards are required.

<!-- @doubt -->
### Why is the linear scan so much slower here than in Count Occurrences?

<!-- @answer -->
Because it returns an index. In Count Occurrences the scan was the *fastest* approach up to n = 256, since counting is a reduction the compiler splits across four lanes. Here the loop body is `if (a[i] < a[best]) best = i`, and the index it carries makes every iteration depend on the previous one's result — nothing can be done speculatively. The assembly is unambiguous: the value-returning scan is 41 instructions with **12 vector instructions**, the index-returning scan is 17 instructions with **0**. Fewer instructions, far slower. Measured at n = 256 that is 11.25ns against 404.04ns — **35.9x** — rising to 44.3x at n = 1,024 and falling to 8.1x at n = 65,536 where both versions are memory-bound instead. The binary version pays none of this, because `return lo` and `return a[lo]` are the same descent.

<!-- @doubt -->
### What happens with duplicates?

<!-- @answer -->
The question stops having an answer before any algorithm gets a chance to be wrong. Over every sorted multiset from `{0,1,2}` up to length 8, in every rotation — 990 cases — **105, or 10.61%, are consistent with more than one k**. For eight equal elements all eight rotation counts produce the identical array, so no function of that array can distinguish them. Worse, the identity this whole subtopic rests on stops holding even when k *is* unique: on `[0,1,0]` the true right-rotation count is 2 and the leftmost minimum is at index 0. Of the 885 cases where k is uniquely determined, the distinct-only form returns an inconsistent k on **114 — 12.88%**. The problem is well-posed only on distinct values, and that is a property of the problem rather than a gap in any solution.

<!-- @doubt -->
### Can I reuse the `hi -= 1` repair from Find Minimum?

<!-- @answer -->
No, and the reason is precise rather than a matter of degree. That repair works perfectly for what the previous subtopic asked: measured over all 990 duplicate cases it returns the **wrong minimum value 0 times**. But this subtopic asks for the position, and the same version returns an index different from the true k on **132 of 990 — 13.33%**. Shrinking the window by one when the comparison is uninformative preserves which *value* is smallest while discarding information about *where* the run of equal values began, and the position is exactly what was being asked for. It is a good illustration that a fix belongs to a specification, not to an algorithm: the code is identical and one of the two questions it can answer is now wrong.

<!-- @doubt -->
### Is there any way to verify the answer without trusting the search?

<!-- @answer -->
Yes, and it is worth doing in tests. Rotate the array left by the returned k and check that the result is sorted — that is a direct statement of what the answer means, and it needs no second implementation of the search to compare against. It costs O(n), so it belongs in a test rather than in production, but it catches every class of bug in this container at once: a direction error produces an unsorted result, a missing modulo produces an out-of-range shift, and duplicate ambiguity shows up as several k all passing the check. That last outcome is information rather than a failure, since it tells you the input genuinely does not determine k.
