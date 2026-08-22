---
id: find-minimum-in-rotated-sorted-array
topic: Binary Search
title: Find Minimum in Rotated Sorted Array
difficulty: Easy
status: ready
prerequisites:
  - lower-bound
  - search-x-in-sorted-array
  - integer-overflow-and-precision-errors
relatedIds:
  - find-out-how-many-times-the-array-is-rotated
  - search-in-rotated-sorted-array-i
  - search-in-rotated-sorted-array-ii
  - lower-bound
  - search-x-in-sorted-array
---

<!-- @summary -->
The first problem in the module with no target to search for, which forces the comparison to key off an endpoint instead — and the choice of endpoint is not symmetric. Comparing the midpoint to the right end is correct with no special case; comparing it to the left end is wrong on 99.02% of unrotated arrays unless you add a guard.

<!-- @theory -->
## The problem

An array was sorted, then rotated some number of times. Find its minimum.

```
[3, 4, 5, 1, 2]   ->  1
[4, 5, 6, 7, 0, 1, 2]  ->  0
[11, 13, 15, 17]  ->  11      rotated zero times, still valid input
[2, 1]            ->  1
```

Every such array is two ascending runs, and the minimum is the first element of
the second run. If there is only one run — the array was never rotated — the
minimum is the first element.

## There is nothing to compare against

Every previous subtopic compared `a[mid]` to a target x supplied by the caller.
Here there is no x. The comparison has to be against something inside the array,
and the only positions guaranteed to be meaningful are the ends of the current
window.

That choice turns out to matter more than it looks.

## Compare to the right end

```
lo = 0, hi = n - 1
while lo < hi:
    mid = lo + (hi - lo) / 2
    if a[mid] > a[hi]:  lo = mid + 1
    else:               hi = mid
return a[lo]
```

The invariant is that the minimum is always inside `[lo, hi]`, and each step
preserves it:

- **`a[mid] > a[hi]`** — mid sits in the first, higher run and `hi` sits in the
  second. The minimum must be strictly to the right of mid, so `lo = mid + 1`
  discards nothing.
- **`a[mid] <= a[hi]`** — mid and hi are in the same ascending run, so everything
  after mid is at least `a[mid]`. The minimum is at or before mid, so `hi = mid`
  keeps mid as a candidate.

Notice that neither case asked whether the array was rotated. Both are true of a
fully sorted array too, where the second branch simply fires every time and walks
`hi` down to 0.

Verified over every distinct sorted array of length 1 to 9 drawn from `{0..9}`,
in every rotation — **5,110 cases, 0 wrong.** Writing `>=` instead of `>` is also
0 wrong, because with distinct values `a[mid] == a[hi]` cannot happen while
`lo < hi`.

## Compare to the left end and it breaks

The mirror version looks equally reasonable and is not:

```
if a[mid] >= a[lo]:  lo = mid + 1        # "left half is sorted, so go right"
else:                hi = mid
```

Measured over the same 5,110 cases it is wrong on **2,089 — 40.88%.** The failures
are not scattered:

| | wrong |
|---|---|
| all cases | 2,089 of 5,110 (40.88%) |
| **unrotated cases only** | **1,012 of 1,022 (99.02%)** |

Every unrotated array fails except the ten of length 1, where the loop never runs
at all.

The reason is that the reasoning behind the left-end test contains a hidden
assumption. "`a[mid] >= a[lo]`, so the left half is already sorted, so the minimum
is on the right" is only valid **if the array is rotated at all**. On a fully
sorted array the left half is always sorted and the minimum is on the *left* — at
index 0 — so the test walks straight past it.

The right-end test has no such gap. `a[mid] > a[hi]` is impossible in a sorted
array, so the branch that would discard the minimum is simply never taken.

The left-end version can be repaired by testing the window for sortedness first:

```
while lo < hi:
    if a[lo] <= a[hi]: return a[lo]      # window already sorted
    ...
```

With that guard it is **0 wrong over all 5,110 cases**. It is correct, and it
needs a special case that the right-end version does not — which is the whole
argument for preferring the right end.

## The sortedness shortcut, measured

That same guard is also legal in the right-end version, where it is not a fix but
an optimisation: exit as soon as the remaining window is sorted. It can save a
great deal of work. Whether it saves any *time* depends entirely on your inputs.

At n = 65,536, average loop iterations and nanoseconds per call:

| workload | plain: iterations | shortcut: iterations | iterations saved | plain ns | shortcut ns | |
|---|---|---|---|---|---|---|
| no array unrotated | 16.00 | 15.50 | 3% | 27.50 | 43.67 | **1.59x slower** |
| half unrotated | 16.00 | 8.25 | **48%** | 26.32 | 25.61 | 1.03x faster |
| all unrotated | 16.00 | 1.00 | 94% | 23.91 | 1.21 | **19.8x faster** |

The middle row is the one to sit with. The shortcut removes **half of all
iterations** and returns essentially nothing — 3% — because at a fifty-fifty mix
its own test is the unpredictable branch, and what it saves in comparisons it
gives back in mispredictions. At the extremes the branch becomes predictable and
the arithmetic works normally: never taken, so pure overhead; always taken, so a
20x win.

This is the same pattern the last four subtopics measured, and it is worth naming
now that it has recurred so consistently: **a shortcut's value is set by how
predictable its test is, not by how much work it removes.**

Since real inputs are rarely all-sorted or all-rotated, the plain version is the
right default. Add the shortcut only if you know your arrays are usually
unrotated.

## Duplicates break it

With duplicate values the right-end test loses its guarantee, because
`a[mid] == a[hi]` tells you nothing about which run mid is in.

Measured over every rotation of every sorted multiset over `{0,1,2}` up to length
8 — 990 cases — the distinct-only version is wrong on **60, or 6.06%.** The
smallest failure is `[1, 1, 0, 1]`, where it returns 1 and the minimum is 0.

The repair is to shrink the window by one when the comparison is uninformative:

```
if   a[mid] > a[hi]:  lo = mid + 1
elif a[mid] < a[hi]:  hi = mid
else:                 hi -= 1
```

That is **0 wrong** over the same 990 cases, and it gives up the complexity
guarantee to get there:

| n | all elements equal | distinct, rotated |
|---|---|---|
| 1,000 | **999 iterations** | 10 |
| 100,000 | **99,999 iterations** | 16 |

O(n) in the worst case, which is not a bug but a proven limit — with duplicates
there is no way to decide which side holds the minimum without, sometimes, looking
at everything. It also costs about 1.25x on inputs that have no duplicates at all
(34.28ns against 27.50ns at n = 65,536), because of the extra branch. Use it only
when duplicates are actually possible.

## The index is the rotation count

The loop returns `a[lo]`, and `lo` itself is worth keeping: the position of the
minimum is exactly how many times the array was rotated right. Verified on all
5,110 cases. That is the next subtopic, and it needs no new code — only a change
of what you return.

<!-- @intuition -->
The instinct carried in from every earlier subtopic is to look for something, and there is nothing here to look for — which is why the first attempt is usually to reconstruct the rotation point by reasoning about which half is "the sorted half". That framing is what introduces the special case, because on an unrotated array both halves are sorted and the reasoning has no way to break the tie. The cleaner way in is to stop thinking about halves at all and ask one question about the midpoint: *is it bigger than the last element?* If it is, it belongs to the run that comes before the wrap, and the minimum is past it. If it is not, it belongs to the same run as the last element, and the minimum is at or before it. That question has an answer on every input, rotated or not, which is precisely why the version built on it needs no guard.

<!-- @approach -->
### Linear Scan

<!-- @idea -->
Walk the array and keep the smallest element seen.

<!-- @steps -->
1. Take the first element as the current best.
2. Compare every later element against it.
3. Keep the smaller one.
4. Return the best after the walk.
5. Rotation is never considered, which is why this works and why it is slow.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Correct on every input including duplicates, and the only version here that never needs a caveat. Measured 6.34ns at n = 16 against 3.43ns for the binary version, and 36.62ns against 11.70ns at n = 1,024. It uses none of the structure, which is the point of showing it.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int findMin(const vector<int>& a) {
    int best = a[0];
    for (int i = 1; i < (int)a.size(); i++) {
        if (a[i] < best) best = a[i];
    }
    return best;
}
```

<!-- @annotations -->
- 5: Seeding from a[0] rather than a sentinel, which avoids inventing a value larger than everything the array can hold.
- 7: No use of sortedness or rotation anywhere. This is why it survives duplicates that break the binary version.

<!-- @code java -->
```java
static int findMin(int[] a) {
    int best = a[0];
    for (int v : a) {
        if (v < best) best = v;
    }
    return best;
}
```

<!-- @annotations -->
- 2: a[0] on an empty array throws. Every version in this container assumes at least one element, which the problem guarantees.

<!-- @code python -->
```python
def find_min(a):
    return min(a)


# min() is O(n) in C rather than in interpreted bytecode,
# so it is fast in absolute terms and still linear.
```

<!-- @annotations -->
- 2: Written as the built-in because the complexity is the point, not the loop syntax.

<!-- @approach -->
### Compare the Midpoint to the Left End

<!-- @idea -->
Decide which half is sorted by comparing the midpoint to the left end, and add an explicit check for the case where the whole window is already sorted.

<!-- @steps -->
1. Keep a window from lo to hi.
2. If the window is already sorted — its first element is at most its last — the minimum is its first element, so return it.
3. Otherwise take mid.
4. If the midpoint is at least the left end, the left half is sorted and cannot contain the minimum, so move lo past mid.
5. Otherwise the minimum is at or before mid, so bring hi down to mid.

<!-- @complexity -->
- time: O(log n)
- space: O(1)
- note: Correct on all 5,110 exhaustive cases **with the sortedness check**, and wrong on 2,089 of them without it — including 99.02% of unrotated arrays. The check is not an optimisation here; it is load-bearing, which is what makes this the weaker of the two binary formulations.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int findMin(const vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        if (a[lo] <= a[hi]) return a[lo];   // REQUIRED, not an optimisation
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= a[lo]) lo = mid + 1;
        else                 hi = mid;
    }
    return a[lo];
}
```

<!-- @annotations -->
- 7: Deleting this line makes the function wrong on 2,089 of 5,110 exhaustive cases, and on 99.02% of unrotated arrays specifically. The right-end formulation needs no equivalent.
- 9: "The left half is sorted, so the minimum is to the right" — true only when the array is actually rotated, which is the assumption line 7 is patching.
- 10: hi = mid, not mid - 1. mid is still a candidate here.
- 12: Returning a[lo], the surviving position, which is also the rotation count.

<!-- @code java -->
```java
static int findMin(int[] a) {
    int lo = 0, hi = a.length - 1;
    while (lo < hi) {
        if (a[lo] <= a[hi]) return a[lo];
        int mid = lo + (hi - lo) / 2;
        if (a[mid] >= a[lo]) lo = mid + 1;
        else                 hi = mid;
    }
    return a[lo];
}
```

<!-- @annotations -->
- 5: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int from n = 1,073,741,825.

<!-- @code python -->
```python
def find_min(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        if a[lo] <= a[hi]:
            return a[lo]
        mid = (lo + hi) // 2
        if a[mid] >= a[lo]:
            lo = mid + 1
        else:
            hi = mid
    return a[lo]
```

<!-- @annotations -->
- 4: The guard runs on every iteration, not only the first, because the window can become sorted partway down.

<!-- @approach -->
### Compare the Midpoint to the Right End

<!-- @idea -->
Ask one question about the midpoint — is it greater than the last element of the window — and let the answer decide which side keeps the minimum.

<!-- @steps -->
1. Keep a window from lo to hi, with the invariant that the minimum lies inside it.
2. While the window holds more than one position, take mid.
3. If the midpoint is greater than the right end, mid is in the run before the wrap, so the minimum is strictly to its right.
4. Otherwise mid shares a run with the right end, so the minimum is at or before mid.
5. When lo and hi meet, that position holds the minimum.

<!-- @complexity -->
- time: O(log n) — measured a flat 16.00 iterations at n = 65,536 regardless of rotation
- space: O(1)
- note: The answer. 0 wrong over 5,110 exhaustive cases, with no special case for the unrotated array and no assumption about whether a rotation happened. Measured 3.43ns at n = 16 and 27.50ns at n = 65,536, and its cost does not vary with the input.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int findMin(const vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1;
        else                hi = mid;
    }
    return a[lo];
}
```

<!-- @annotations -->
- 6: lo < hi, not lo <= hi. The loop ends when one position survives, and that position is the answer — the same convention Lower Bound used.
- 7: Subtracting before halving, so lo + hi never overflows. Writing (lo + hi) / 2 breaks from n = 1,073,741,825.
- 8: Comparing to a[hi], not a[lo]. This single choice is what removes the need for a sortedness guard — a[mid] > a[hi] is impossible in an unrotated array, so the branch that would skip the minimum is never taken.
- 9: hi = mid, not mid - 1, because mid is still a candidate. Writing mid - 1 discards the answer whenever mid is the minimum.
- 11: a[lo] is the minimum, and lo itself is the number of right rotations — verified on all 5,110 cases.

<!-- @code java -->
```java
static int findMin(int[] a) {
    int lo = 0, hi = a.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1;
        else                hi = mid;
    }
    return a[lo];
}
```

<!-- @annotations -->
- 5: With distinct values, > and >= behave identically here, because a[mid] == a[hi] cannot occur while lo < hi. With duplicates neither is correct on its own.

<!-- @code python -->
```python
def find_min(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] > a[hi]:
            lo = mid + 1
        else:
            hi = mid
    return a[lo]


# No branch anywhere asks whether the array was rotated.
```

<!-- @annotations -->
- 5: The whole algorithm. There is no case analysis on rotation, which is what the left-end version needs a guard to emulate.

<!-- @example -->

<!-- @input -->
```
a = [3, 4, 5, 1, 2]
```

<!-- @output -->
```
1
```

<!-- @why -->
The array is two ascending runs, [3,4,5] and [1,2], and the minimum is the first element of the second. Three probes find it without identifying the runs explicitly.

<!-- @walkthrough -->
```
lo=0 hi=4   mid=2  a[2]=5  a[4]=2   5 > 2   lo = 3      window [3,4]
lo=3 hi=4   mid=3  a[3]=1  a[4]=2   1 > 2?  no  hi = 3  window [3,3]
lo == hi -> a[3] = 1

lo also equals 3, which is the number of right rotations
that produced this array from [1,2,3,4,5].
```

<!-- @example -->

<!-- @input -->
```
a = [11, 13, 15, 17]
```

<!-- @output -->
```
11
```

<!-- @why -->
Rotated zero times, which is legal input and is exactly the case that breaks the left-end formulation. The right-end test simply never takes its first branch.

<!-- @walkthrough -->
```
lo=0 hi=3   mid=1  a[1]=13  a[3]=17   13 > 17?  no  hi = 1
lo=0 hi=1   mid=0  a[0]=11  a[1]=13   11 > 13?  no  hi = 0
lo == hi -> a[0] = 11

Compare with the left-end test on the same input:
  mid=1, a[1]=13 >= a[0]=11  ->  lo = 2   the minimum is
  now outside the window, and the answer will be wrong.

That is why 1,012 of the 1,022 unrotated exhaustive cases
fail without the sortedness guard.
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
The smallest rotated array. It exercises the `hi = mid` branch's requirement that mid stay a candidate — with `hi = mid - 1` the window would become empty.

<!-- @walkthrough -->
```
lo=0 hi=1   mid=0  a[0]=2  a[1]=1   2 > 1   lo = 1
lo == hi -> a[1] = 1

mid is always strictly less than hi while lo < hi, so
lo = mid + 1 always makes progress and the loop cannot hang.
```

<!-- @example -->

<!-- @input -->
```
a = [1, 1, 0, 1]
```

<!-- @output -->
```
0
```

<!-- @why -->
The smallest input where duplicates defeat the right-end test: it returns 1. The comparison a[mid] == a[hi] carries no information about which run mid belongs to.

<!-- @walkthrough -->
```
Right-end test, distinct-only form:
  lo=0 hi=3  mid=1  a[1]=1  a[3]=1   1 > 1?  no  hi = 1
  lo=0 hi=1  mid=0  a[0]=1  a[1]=1   1 > 1?  no  hi = 0
  -> a[0] = 1                                   WRONG

Duplicate-tolerant form, shrinking by one when equal:
  lo=0 hi=3  mid=1  a[1]=1 == a[3]=1   hi = 2
  lo=0 hi=2  mid=1  a[1]=1 >  a[2]=0   lo = 2
  -> a[2] = 0                                   correct

The repair costs the complexity guarantee: on an array of
100,000 equal elements it takes 99,999 iterations.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the array as two ascending runs with the minimum at the start of the second, then the asymmetry between the two endpoint choices, and the measured behaviour of the sortedness shortcut where saving half the iterations buys nothing.

<!-- @sampleInput -->
```json
{"primary":{"array":[3,4,5,1,2],"runs":[[3,4,5],[1,2]],"answer":1,"answerIndex":3,"trace":[{"lo":0,"hi":4,"mid":2,"value":5,"rightEnd":2,"test":"5 > 2","result":true,"action":"lo = mid + 1","window":[3,4]},{"lo":3,"hi":4,"mid":3,"value":1,"rightEnd":2,"test":"1 > 2","result":false,"action":"hi = mid","window":[3,3]}],"note":"lo also equals the number of right rotations"},"noTargetToSearch":{"claim":"the first subtopic with no x supplied by the caller, so the comparison must key off an endpoint","invariant":"the minimum is always inside [lo, hi]","cases":[{"test":"a[mid] > a[hi]","meaning":"mid is in the run before the wrap","action":"minimum is strictly right of mid"},{"test":"a[mid] <= a[hi]","meaning":"mid shares a run with hi","action":"minimum is at or before mid"}],"keyPoint":"neither case asks whether the array was rotated"},"endpointAsymmetry":{"space":"every distinct sorted array of length 1..9 from {0..9}, every rotation","cases":5110,"unrotatedCases":1022,"rows":[{"form":"compare to a[hi] with >","wrong":0},{"form":"compare to a[hi] with >=","wrong":0,"note":"identical for distinct values; a[mid] == a[hi] cannot occur while lo < hi"},{"form":"compare to a[lo], no guard","wrong":2089,"pct":40.88,"unrotatedWrong":1012,"unrotatedTotal":1022,"unrotatedPct":99.02},{"form":"compare to a[lo], with sortedness guard","wrong":0}],"whyLeftFails":"'the left half is sorted so the minimum is on the right' holds only if the array is actually rotated; on a sorted array the left half is always sorted and the minimum is on the LEFT","whyRightWorks":"a[mid] > a[hi] is impossible in a sorted array, so the branch that would discard the minimum is never taken","survivors":"the 10 unrotated cases that pass are length 1, where the loop never runs"},"sortednessShortcut":{"legalInBothForms":true,"roleDiffers":"a required fix in the left-end form, an optimisation in the right-end form","n":65536,"rows":[{"workload":"0% unrotated","plainIters":16.00,"shortcutIters":15.50,"itersSavedPct":3,"plainNs":27.50,"shortcutNs":43.67,"ratio":"1.59x slower"},{"workload":"50% unrotated","plainIters":16.00,"shortcutIters":8.25,"itersSavedPct":48,"plainNs":26.32,"shortcutNs":25.61,"ratio":"1.03x faster"},{"workload":"100% unrotated","plainIters":16.00,"shortcutIters":1.00,"itersSavedPct":94,"plainNs":23.91,"shortcutNs":1.21,"ratio":"19.8x faster"}],"headline":"at a fifty-fifty mix it removes half of all iterations and returns 3% of the time","principle":"a shortcut's value is set by how predictable its test is, not by how much work it removes"},"duplicates":{"space":"every rotation of every sorted multiset over {0,1,2}, length 1..8","cases":990,"distinctOnlyWrong":60,"distinctOnlyPct":6.06,"tolerantWrong":0,"smallestFailure":{"array":[1,1,0,1],"got":1,"want":0},"repair":"if a[mid] > a[hi] then lo = mid+1, else if a[mid] < a[hi] then hi = mid, else hi -= 1","cost":{"iterations":[{"n":1000,"allEqual":999,"distinctRotated":10},{"n":100000,"allEqual":99999,"distinctRotated":16}],"overheadOnCleanData":"1.25x — 34.28ns against 27.50ns at n = 65,536"},"note":"O(n) worst case is a proven limit, not an implementation flaw"},"benchmark":{"units":"ns per call, best of 7, varying sink","unrotatedFraction":0,"rows":[{"n":16,"scan":6.34,"binary":3.43,"shortcut":9.15,"tolerant":4.12},{"n":64,"scan":8.17,"binary":5.84,"shortcut":13.77,"tolerant":7.24},{"n":256,"scan":11.79,"binary":8.59,"shortcut":18.30,"tolerant":10.85},{"n":1024,"scan":36.62,"binary":11.70,"shortcut":23.66,"tolerant":14.60},{"n":65536,"binary":27.50,"shortcut":43.67,"tolerant":34.28}]},"rotationCount":{"claim":"the index of the minimum is the number of right rotations","verified":{"cases":5110,"wrong":0},"nextSubtopic":"return lo instead of a[lo]"},"assertions":["the minimum is always inside [lo, hi]","a[mid] > a[hi] is impossible in an unrotated array","mid is strictly less than hi while lo < hi, so the loop always makes progress","the surviving index is the right-rotation count","the cost does not depend on how far the array was rotated"]}
```

<!-- @highlights -->
- The first subtopic with no target: the comparison must key off an endpoint, and the two endpoints are not interchangeable.
- Comparing to the right end is 0 wrong over 5,110 exhaustive cases and needs no special case.
- Comparing to the left end is wrong on 40.88% overall and on **99.02% of unrotated arrays** unless a sortedness guard is added.
- `a[mid] > a[hi]` is impossible in a sorted array, which is precisely why the unrotated case needs no handling.
- The sortedness shortcut removes 48% of iterations at a fifty-fifty mix and returns 3% of the time.
- Duplicates break the test on 6.06% of cases; the repair is correct and costs O(n) — 99,999 iterations at n = 100,000.

<!-- @edgeCases -->
- An unrotated array — legal input, and the case that breaks the left-end formulation on 99.02% of tries.
- A single-element array — the loop never runs and a[0] is the answer.
- Two elements — the smallest rotated case, and the one that requires `hi = mid` rather than `hi = mid - 1`.
- A rotation by exactly n, which is the same array unrotated.
- An array with duplicates — outside the problem's usual precondition, and wrong on 6.06% of such inputs.
- An array of all equal values — the duplicate-tolerant repair degrades to n - 1 iterations here.
- An empty array — every version indexes a[0] and none of them guard it; the problem guarantees at least one element.
- The minimum sitting at the last index, which only happens for `[2, 1]`-shaped input of length 2.
- n above 1,073,741,824 — where `(lo + hi) / 2` overflows an int, exactly as in Lower Bound.
- An array that is not a rotation of a sorted array — every version returns a number and none of them mean anything.

<!-- @pitfalls -->
- Comparing the midpoint to `a[lo]` without a sortedness guard. Wrong on 2,089 of 5,110 exhaustive cases, and on 99.02% of unrotated arrays.
- Believing the unrotated array is an edge case. It is a fifth of the exhaustive space and the single most common shape in practice.
- Writing `hi = mid - 1`. mid is still a candidate, and discarding it loses the answer whenever mid is the minimum.
- Writing `lo <= hi` as the loop condition. This loop narrows to one surviving position, so it must be `lo < hi`.
- Comparing `a[mid]` against `a[mid + 1]` to find the drop. It works, but it needs its own bounds guard and its own unrotated special case.
- Adding the sortedness shortcut for speed. It is 1.59x slower when arrays are always rotated and only pays when they are usually not.
- Assuming the shortcut helps because it removes work. At a fifty-fifty mix it removes half the iterations and gains 3%.
- Using the distinct-only form on data with duplicates. Wrong on 6.06% of such cases, smallest failure `[1, 1, 0, 1]`.
- Using the duplicate-tolerant form everywhere. It costs about 1.25x on clean data and is O(n) in the worst case.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825.

<!-- @doubt -->
### Why compare to the right end rather than the left?

<!-- @answer -->
Because only the right-end comparison is conclusive on every input. `a[mid] > a[hi]` can only happen if a wrap lies between mid and hi, so the minimum must be strictly right of mid — and if the array is not rotated, that test is simply never true, so no branch can discard the answer. The left-end version reasons "`a[mid] >= a[lo]`, so the left half is sorted, so the minimum is on the right", and that last step silently assumes a rotation exists. On a sorted array the left half is always sorted and the minimum is at index 0. Measured over 5,110 exhaustive cases: the right-end form is wrong 0 times, the left-end form 2,089 times — **40.88%** — and specifically on **1,012 of the 1,022 unrotated cases, 99.02%**. The ten survivors are length 1, where the loop body never executes.

<!-- @doubt -->
### Can I make the left-end version work?

<!-- @answer -->
Yes, by testing the window for sortedness before each step: `if (a[lo] <= a[hi]) return a[lo];`. With that line it is **0 wrong over all 5,110 cases**. The point of the comparison is not that one version is broken and the other is not — both can be made correct — but that one needs a special case and the other does not, and special cases are where bugs live. The guard also has to run on *every* iteration rather than once at the top, because a window that started rotated can become sorted partway down. If you write the left-end form, that is two things to remember instead of zero.

<!-- @doubt -->
### Should I add the "already sorted" shortcut to the right-end version?

<!-- @answer -->
Only if you know your arrays are usually unrotated. In the right-end version the same line is a pure optimisation rather than a fix, and its measured value swings enormously. At n = 65,536: when no array is unrotated it saves 3% of iterations and runs **1.59x slower** (43.67ns against 27.50ns), because its test is a branch that is never taken and always evaluated. When every array is unrotated it saves 94% of iterations and runs **19.8x faster** (1.21ns against 23.91ns). The interesting case is the middle: at a fifty-fifty mix it removes **48% of all iterations** and returns 1.03x — essentially nothing — because that is exactly where its own branch is least predictable. Real workloads are rarely at either extreme, so the plain version is the safer default.

<!-- @doubt -->
### What happens with duplicate values?

<!-- @answer -->
The test loses its meaning and the function starts returning wrong answers. When `a[mid] == a[hi]` you cannot tell which run mid belongs to — `[1,1,0,1]` is the smallest example, where the distinct-only version returns 1 and the minimum is 0. Measured over every rotation of every sorted multiset over `{0,1,2}` up to length 8, it is wrong on **60 of 990 cases, 6.06%**. The standard repair shrinks the window by one when the comparison is uninformative: `else hi -= 1`. That is 0 wrong over the same 990 cases and gives up the logarithmic bound to get there — on 100,000 equal elements it takes **99,999 iterations**. That is not a weakness of the repair; with duplicates there is genuinely no way to decide which side holds the minimum without sometimes examining everything. It also costs about 1.25x on data with no duplicates, so keep the plain version unless duplicates are actually possible.

<!-- @doubt -->
### Why is the loop `lo < hi` rather than `lo <= hi`?

<!-- @answer -->
Because this loop narrows to a single surviving position rather than searching for a match, so it must stop when one position is left — the same convention Lower Bound used, and for the same reason. With `lo <= hi` and `hi = mid`, mid stays inside a window that never shrinks and the loop hangs. The pairing here is fixed in the other direction too: `hi = mid` and not `mid - 1`, because mid is still a candidate for being the minimum. Progress is guaranteed because `mid` is strictly less than `hi` whenever `lo < hi`, so the `lo = mid + 1` branch always advances and the `hi = mid` branch always shrinks.

<!-- @doubt -->
### Could I just look for the place where the order drops?

<!-- @answer -->
You can — the minimum is the element right after the only `a[i] > a[i+1]` — and it costs you the two things the right-end version gave you for free. First, it needs a bounds guard, since `a[mid + 1]` is out of range when mid is the last index. Second, an unrotated array has no drop at all, so it needs its own special case to return `a[0]`, which is the same guard the left-end version needs and for the same underlying reason. Both formulations are correct once patched; the right-end comparison is worth preferring because it answers a question that has a meaningful answer on every input, so there is nothing left to patch.

<!-- @doubt -->
### Is `>=` against the right end also correct?

<!-- @answer -->
For distinct values, yes — measured 0 wrong over all 5,110 cases, identical to `>`. The reason it cannot differ is that `a[mid] == a[hi]` is impossible while `lo < hi`: mid is strictly less than hi, so they are different positions, and with distinct values different positions hold different values. The moment duplicates are allowed the question stops being cosmetic, but then neither `>` nor `>=` is correct on its own and you need the three-way form. So it is a free choice here and not one worth arguing about — unlike `<` versus `<=` in Lower Bound and Upper Bound, where the same-looking change produced two different functions.

<!-- @doubt -->
### What is the index good for?

<!-- @answer -->
It is the number of times the array was rotated right, verified on all 5,110 exhaustive cases. Return `lo` instead of `a[lo]` and you have solved the next subtopic with no new code. The reason is direct: rotating a sorted array right by k moves its first element — the minimum — to index k, and rotating by 0 leaves it at index 0, which is also what the loop returns for an unrotated array. It is worth writing the function to return the index and letting the caller index the array, since one form is recoverable from the other and only one of them carries the extra information.
