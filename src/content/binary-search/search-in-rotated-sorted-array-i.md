---
id: search-in-rotated-sorted-array-i
topic: Binary Search
title: Search in rotated sorted array-I
difficulty: Medium
status: ready
prerequisites:
  - find-minimum-in-rotated-sorted-array
  - search-x-in-sorted-array
  - find-out-how-many-times-the-array-is-rotated
relatedIds:
  - search-in-rotated-sorted-array-ii
  - find-minimum-in-rotated-sorted-array
  - find-out-how-many-times-the-array-is-rotated
  - search-x-in-sorted-array
  - lower-bound
---

<!-- @summary -->
One of the two halves around the midpoint is always fully sorted, which is enough to search a rotated array in a single descent. Three separate `=` characters are load-bearing in that decision, failing at 1.69%, 3.83% and 9.37% when dropped — and the tidier alternative of finding the pivot first and then searching normally is 1.7x slower, because it does a whole extra descent rather than a cheaper one.

<!-- @theory -->
## The problem

A sorted array of distinct values was rotated. Find x and return its index, or -1.

```
a = [4, 5, 6, 7, 0, 1, 2]

x = 0  ->  4
x = 3  ->  -1
x = 4  ->  0
```

The array is two ascending runs. Ordinary binary search fails because comparing x
to `a[mid]` no longer tells you which side to discard — `a[mid] < x` could mean x
is to the right, or that mid is in the second run and x is in the first.

## One half is always sorted

Cut the window at mid. The wrap point can lie in at most one of the two halves,
so **the other half is fully sorted** — and a fully sorted half can be tested for
containment with two comparisons.

That gives the whole algorithm:

```
if a[lo] <= a[mid]:                 # left half is sorted
    if a[lo] <= x < a[mid]:  hi = mid - 1      # x is in it
    else:                    lo = mid + 1      # x is not
else:                               # right half is sorted
    if a[mid] < x <= a[hi]:  lo = mid + 1
    else:                    hi = mid - 1
```

Verified over every distinct sorted array of length 1 to 9 drawn from `{0..9}`, in
every rotation, against every probe from -1 to 10 — **61,320 cases, 0 wrong.**

## Three `=` characters, three failure rates

Every one of the three comparisons above has a boundary decision in it, and all
three are load-bearing. Dropping each in turn, over the same 61,320 cases:

| change | wrong | smallest counterexample |
|---|---|---|
| `a[lo] <= a[mid]` becomes `<` | 1,034 — **1.69%** | `[1,0]`, x = 0 → -1, want 1 |
| `x <= a[hi]` becomes `<` | 2,349 — **3.83%** | `[2,0,1]`, x = 1 → -1, want 2 |
| `a[lo] <= x` becomes `<` | 5,746 — **9.37%** | `[0,1,2]`, x = 0 → -1, want 0 |

Each has its own reason:

- **`a[lo] <= a[mid]`** — when the window narrows to one or two elements, `lo`
  and `mid` are the same index, so `a[lo] < a[mid]` is false and the code takes
  the *right-half-is-sorted* branch on a window whose right half does not exist.
  `[1,0]` searching for 0 is the smallest case.
- **`a[lo] <= x`** — the left end of a sorted half is *in* that half. Excluding it
  loses x whenever x is the first element of the window, which on an unrotated
  array means losing `a[0]` — `[0,1,2]` searching for 0 returns -1.
- **`x <= a[hi]`** — the mirror, at the other end. `[2,0,1]` searching for 1
  returns -1.

The failure rates are worth noticing for what they say about testing. The most
dangerous of the three is also the most obvious once you see it — losing the
first element of an unrotated array — and it still fails less than one call in
ten. None of these show up on a casually chosen example.

## Finding the pivot first is slower

The tidier-looking alternative is to do it in two stages: find the rotation point
with the previous subtopic's descent, then run an ordinary binary search on
whichever segment can contain x. It is correct — 0 wrong over the same 61,320
cases — and it is the one most people find easier to reason about, because
neither stage has any rotation logic in it.

It is also 1.7x slower, and the reason is not subtle once measured. Average array
probes per query at n = 1,048,576:

| | probes | |
|---|---|---|
| one pass | 19.50 | |
| two passes | 38.83 | **1.99x** |

The pivot search is a full descent and the segment search is another full descent.
Nothing is shared between them, so the two-stage version does twice the work of
the one-stage version, which does the same job while it descends.

Nanoseconds per query, half the probes present:

| n | linear scan | one pass | two passes, segment | two passes, virtual index |
|---|---|---|---|---|
| 16 | **7.78** | 17.54 | 22.62 | 15.24 |
| 64 | 18.92 | **21.97** | 33.21 | 23.40 |
| 256 | 72.68 | **26.59** | 46.03 | 33.52 |
| 1,024 | 242.35 | **31.52** | 58.55 | 45.59 |
| 65,536 | - | **74.76** | 127.66 | 116.10 |
| 1,048,576 | - | **122.60** | 212.79 | 207.72 |

The measured gap is 1.7x rather than the full 2x, because the two-stage version's
probes are individually cheaper — its loops have no four-way decision, so they
compile mostly to conditional selects.

## Which corrects something this module kept finding

Five subtopics in a row measured a branchless formulation beating a branchy one
that did *less* work — the fused `equal_range` descent, the early exit in Search
Insert Position, the sortedness shortcut in Find Minimum. It would be easy to
generalise that into "prefer branchless", and this subtopic is where that
generalisation breaks.

The third column above is the honest test of it. The virtual-index version does
the pivot search and then a **completely branchless** lower bound over the rotated
array, mapping index i to `a[(i + p) mod n]` with a conditional subtract. It is
measurably branchless — 15.23, 15.24, 15.17 nanoseconds at n = 16 as the fraction
of present probes goes none, half, all, where the one-pass version swings 15.26,
17.54, 13.67. It still loses by 1.7x at n = 1,048,576.

The rule that actually held across all six subtopics is narrower: **a branch costs
about one misprediction and a probe costs about one cache miss, so count probes
first.** The earlier results all traded a *fraction* of the probes for a branch,
and lost. This one trades a branch for *twice* the probes, and loses the other
way. Branchlessness is worth roughly a fraction of a descent — never a whole one.

| | instructions | conditional selects | conditional branches |
|---|---|---|---|
| one pass | 32 | 2 | 6 |
| two passes, segment | 41 | 6 | 7 |
| two passes, virtual index | 45 | 7 | 6 |

<!-- @intuition -->
The instinct on seeing a rotated array is to undo the rotation first — find where it wraps, then treat the problem as solved. That instinct is what produces the two-stage solution, and it is not wrong so much as wasteful: it spends a full descent establishing a fact that the search could have discovered on the way past. The one-pass version works because of a small observation that is easy to miss — a single cut point cannot break both halves, so whichever half does not contain the wrap is an ordinary sorted range, and an ordinary sorted range answers "is x in here" with two comparisons. Every step therefore learns both where the wrap is not and where x is not, at the same time. Once that is the shape in your head, the rotation stops being something to remove before searching and becomes something the search reads as it goes.

<!-- @approach -->
### Linear Scan

<!-- @idea -->
Walk the array and return the first index holding x.

<!-- @steps -->
1. Start at index zero.
2. Compare each element against x.
3. Return the index on a match.
4. Return -1 after the walk ends.
5. Rotation is never considered, which is why this works and why it is slow.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Wins below about n = 50, which is a wider window than in the unrotated subtopics because each binary step here is much more expensive. Measured 7.78ns against 17.54ns at n = 16, and 242.35ns against 31.52ns at n = 1,024.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int search(const vector<int>& a, int x) {
    for (int i = 0; i < (int)a.size(); i++) {
        if (a[i] == x) return i;
    }
    return -1;
}
```

<!-- @annotations -->
- 6: No use of sortedness or rotation. That is why this is the only version in the container that is also correct when duplicates are present.
- 8: -1 for absent, which is the problem's chosen signal rather than anything the algorithm produces naturally.

<!-- @code java -->
```java
static int search(int[] a, int x) {
    for (int i = 0; i < a.length; i++) {
        if (a[i] == x) return i;
    }
    return -1;
}
```

<!-- @annotations -->
- 3: The early exit here costs nothing, because there is no vectorisation to lose — the loop already returns an index.

<!-- @code python -->
```python
def search(a, x):
    try:
        return a.index(x)
    except ValueError:
        return -1


# list.index runs in C and raises rather than returning a
# sentinel, so the -1 has to be supplied by the caller.
```

<!-- @annotations -->
- 3: index() scans linearly and knows nothing about order, so this is O(n) however fast the constant is.

<!-- @approach -->
### Two Passes: Find the Pivot, Then Search

<!-- @idea -->
Locate the rotation point first, then run an ordinary binary search on whichever of the two sorted segments can contain x.

<!-- @steps -->
1. Find the index of the minimum with the rotated-array descent — that is the pivot.
2. If the pivot is 0 the array is not rotated, so search the whole thing.
3. Otherwise, if x is at least the first element, x can only be in the segment before the pivot.
4. Otherwise x can only be in the segment from the pivot onward.
5. Run an ordinary binary search on the chosen segment.

<!-- @complexity -->
- time: O(log n), but two full descents — measured 38.83 probes per query at n = 1,048,576 against 19.50 for the one-pass version
- space: O(1)
- note: Correct on all 61,320 exhaustive cases and easier to reason about, since neither stage contains any rotation logic. It is 1.7x slower because nothing is shared between the two descents: 212.79ns against 122.60ns at n = 1,048,576.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int search(const vector<int>& a, int x) {
    int n = (int)a.size();
    if (n == 0) return -1;

    int lo = 0, hi = n - 1;
    while (lo < hi) {                            // pivot: index of the minimum
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1;
        else                hi = mid;
    }
    int p = lo;

    if (p == 0)            { lo = 0; hi = n - 1; }
    else if (x >= a[0])    { lo = 0; hi = p - 1; }
    else                   { lo = p; hi = n - 1; }

    while (lo <= hi) {                           // ordinary binary search
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1;
        else            hi = mid - 1;
    }
    return -1;
}
```

<!-- @annotations -->
- 9: The Find Minimum descent, unchanged. Comparing to a[hi] rather than a[lo] is what lets it handle an unrotated array without a guard.
- 16: p == 0 means no rotation, so both segments collapse into one and the whole array is searched.
- 17: Comparing x against a[0] decides the segment. This works because the first segment holds everything at least a[0] and the second holds everything below it.
- 21: A completely ordinary binary search — no rotation logic survives into this loop, which is the readability argument for this approach.
- 26: Two full descents, and this is where the 1.7x goes. Neither loop shares any work with the other.

<!-- @code java -->
```java
static int search(int[] a, int x) {
    int n = a.length;
    if (n == 0) return -1;
    int lo = 0, hi = n - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] > a[hi]) lo = mid + 1;
        else                hi = mid;
    }
    int p = lo;
    if (p == 0)         { lo = 0; hi = n - 1; }
    else if (x >= a[0]) { lo = 0; hi = p - 1; }
    else                { lo = p; hi = n - 1; }
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[mid] < x) lo = mid + 1;
        else            hi = mid - 1;
    }
    return -1;
}
```

<!-- @annotations -->
- 6: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int from n = 1,073,741,825.

<!-- @code python -->
```python
def search(a, x):
    n = len(a)
    if n == 0:
        return -1
    lo, hi = 0, n - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] > a[hi]:
            lo = mid + 1
        else:
            hi = mid
    p = lo
    if p == 0:
        lo, hi = 0, n - 1
    elif x >= a[0]:
        lo, hi = 0, p - 1
    else:
        lo, hi = p, n - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x:
            return mid
        if a[mid] < x:
            lo = mid + 1
        else:
            hi = mid - 1
    return -1
```

<!-- @annotations -->
- 12: p is the pivot, and it is also the rotation count from the previous subtopic — the same number reused.
- 19: The second descent starts from scratch. Sharing state between the two loops is what the one-pass version does instead.

<!-- @approach -->
### One Pass: Decide Which Half Is Sorted

<!-- @idea -->
At every step, identify the half that does not contain the wrap, test whether x lies inside its range, and discard one side accordingly.

<!-- @steps -->
1. Take mid and return immediately if it holds x.
2. If the left end is at most the midpoint, the left half is sorted.
3. In that case keep the left half only if x lies within its range, from the left end inclusive up to the midpoint exclusive.
4. Otherwise the right half is sorted, and keep it only if x lies above the midpoint and at most the right end.
5. Repeat until the window empties, then return -1.

<!-- @complexity -->
- time: O(log n) — measured 19.50 probes per query at n = 1,048,576
- space: O(1)
- note: The answer. 0 wrong over 61,320 exhaustive cases and 1.7x faster than the two-stage version at every size above n = 64, because it does one descent rather than two. Its steps are branchier and that costs less than the extra descent would.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int search(const vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[lo] <= a[mid]) {                        // left half is sorted
            if (a[lo] <= x && x < a[mid]) hi = mid - 1;
            else                          lo = mid + 1;
        } else {                                      // right half is sorted
            if (a[mid] < x && x <= a[hi]) lo = mid + 1;
            else                          hi = mid - 1;
        }
    }
    return -1;
}
```

<!-- @annotations -->
- 6: lo <= hi, not lo < hi. This loop searches for a match rather than narrowing to a survivor, so it must examine the last remaining element.
- 8: The early exit is required here, unlike in Lower Bound — the answer is an index and there is no boundary that identifies it.
- 9: The <= is load-bearing. When the window has one or two elements lo and mid coincide, and writing < sends a one-element window down the right-half branch — wrong on 1.69% of exhaustive cases, smallest `[1,0]` searching for 0.
- 10: a[lo] <= x, inclusive, because the left end belongs to the sorted half. Writing < loses x whenever x is the window's first element — wrong on 9.37%, smallest `[0,1,2]` searching for 0.
- 12: Reaching here means the wrap is in the left half, so the right half is the sorted one.
- 13: x <= a[hi], inclusive, for the mirror reason. Writing < is wrong on 3.83%, smallest `[2,0,1]` searching for 1.
- 17: -1 only after the window empties. Every discarded half was proven not to contain x.

<!-- @code java -->
```java
static int search(int[] a, int x) {
    int lo = 0, hi = a.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] == x) return mid;
        if (a[lo] <= a[mid]) {
            if (a[lo] <= x && x < a[mid]) hi = mid - 1;
            else                          lo = mid + 1;
        } else {
            if (a[mid] < x && x <= a[hi]) lo = mid + 1;
            else                          hi = mid - 1;
        }
    }
    return -1;
}
```

<!-- @annotations -->
- 4: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int from n = 1,073,741,825.
- 6: All three of the boundary comparisons in this block are inclusive on the side that belongs to the sorted half and exclusive on the side that does not.

<!-- @code python -->
```python
def search(a, x):
    lo, hi = 0, len(a) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        if a[mid] == x:
            return mid
        if a[lo] <= a[mid]:
            if a[lo] <= x < a[mid]:
                hi = mid - 1
            else:
                lo = mid + 1
        else:
            if a[mid] < x <= a[hi]:
                lo = mid + 1
            else:
                hi = mid - 1
    return -1
```

<!-- @annotations -->
- 8: Python's chained comparison reads exactly as the range test it is, which makes the inclusive and exclusive ends visible at a glance.
- 13: The mirror chain, inclusive at the other end.

<!-- @example -->

<!-- @input -->
```
a = [4, 5, 6, 7, 0, 1, 2], x = 0
```

<!-- @output -->
```
4
```

<!-- @why -->
0 is in the second run. The first probe finds the left half sorted but 0 outside its range, so the whole left half is discarded in one step.

<!-- @walkthrough -->
```
lo=0 hi=6  mid=3  a[3]=7  != 0
           a[0]=4 <= a[3]=7   left half [4,5,6,7] is sorted
           is 4 <= 0 < 7 ?    no        -> lo = 4

lo=4 hi=6  mid=5  a[5]=1  != 0
           a[4]=0 <= a[5]=1   left half [0,1] is sorted
           is 0 <= 0 < 1 ?    yes       -> hi = 4

lo=4 hi=4  mid=4  a[4]=0  == 0          -> return 4

Three probes. The two-stage version would have spent a
full descent locating the pivot at index 4 before starting.
```

<!-- @example -->

<!-- @input -->
```
a = [4, 5, 6, 7, 0, 1, 2], x = 3
```

<!-- @output -->
```
-1
```

<!-- @why -->
3 is absent, and the value lies in the gap the rotation created. Every step still discards a provably empty half, so absence costs the same as presence.

<!-- @walkthrough -->
```
lo=0 hi=6  mid=3  a[3]=7  != 3
           left half [4,5,6,7] sorted; 4 <= 3 ? no  -> lo = 4
lo=4 hi=6  mid=5  a[5]=1  != 3
           left half [0,1] sorted;  0 <= 3 < 1 ? no -> lo = 6
lo=6 hi=6  mid=6  a[6]=2  != 3
           a[6] <= a[6], left half sorted; 2 <= 3 < 2 ? no -> lo = 7
lo > hi -> -1

Note the last step: with one element left, lo and mid are
the same index, so a[lo] <= a[mid] must be true. That is
the case the <= exists for.
```

<!-- @example -->

<!-- @input -->
```
a = [1, 0], x = 0
```

<!-- @output -->
```
1
```

<!-- @why -->
The smallest input that breaks `a[lo] < a[mid]`. With two elements mid is lo, so a strict comparison is false and the code takes the right-half branch on a window with no right half.

<!-- @walkthrough -->
```
lo=0 hi=1  mid=0  a[0]=1 != 0
  correct:  a[0] <= a[0]  is TRUE  -> left half sorted
            is 1 <= 0 < 1 ?  no    -> lo = 1
            then a[1] == 0         -> return 1

  broken:   a[0] <  a[0]  is FALSE -> "right half is sorted"
            is a[0]=1 < 0 <= a[1]=0 ?  no  -> hi = -1
            loop ends                      -> return -1

One character, wrong on 1,034 of 61,320 exhaustive cases.
```

<!-- @example -->

<!-- @input -->
```
a = [0, 1, 2], x = 0
```

<!-- @output -->
```
0
```

<!-- @why -->
An unrotated array, and the smallest input that breaks `a[lo] <= x`. Excluding the left end loses exactly the element sitting at it, which here is the answer.

<!-- @walkthrough -->
```
lo=0 hi=2  mid=1  a[1]=1 != 0
  correct:  a[0]=0 <= a[1]=1, left half sorted
            is 0 <= 0 < 1 ?  yes  -> hi = 0
            then a[0] == 0        -> return 0

  broken:   is 0 <  0 < 1 ?  no   -> lo = 2
            a[2]=2 != 0, window empties -> -1

Wrong on 5,746 of 61,320 cases, the highest rate of the
three boundary slips — and the one most likely to survive
testing, because it only shows up when the answer sits at
the current window's left edge.
```

<!-- @visualization custom -->

<!-- @description -->
Shows why one half around the midpoint is always sorted and how that decides the discard, then the three boundary characters with their measured failure rates, and the probe counts that explain why finding the pivot first is slower.

<!-- @sampleInput -->
```json
{"primary":{"array":[4,5,6,7,0,1,2],"runs":[[4,5,6,7],[0,1,2]],"probe":0,"answer":4,"trace":[{"lo":0,"hi":6,"mid":3,"value":7,"sortedHalf":"left","range":"[4, 7)","xInRange":false,"action":"lo = mid + 1","window":[4,6]},{"lo":4,"hi":6,"mid":5,"value":1,"sortedHalf":"left","range":"[0, 1)","xInRange":true,"action":"hi = mid - 1","window":[4,4]},{"lo":4,"hi":4,"mid":4,"value":0,"match":true,"action":"return 4"}],"probes":3},"keyIdea":{"claim":"a single wrap point cannot break both halves, so whichever half does not contain it is an ordinary sorted range","consequence":"a sorted range answers 'is x inside' with two comparisons","verified":{"cases":61320,"wrong":0,"space":"every distinct sorted array of length 1..9 from {0..9}, every rotation, probes -1..10"}},"boundaryCharacters":{"note":"three separate = characters, three different failure rates","rows":[{"change":"a[lo] <= a[mid] becomes <","wrong":1034,"pct":1.69,"smallest":{"array":[1,0],"x":0,"got":-1,"want":1},"reason":"when the window has one or two elements lo and mid coincide, so a strict test sends it down the right-half branch"},{"change":"x <= a[hi] becomes <","wrong":2349,"pct":3.83,"smallest":{"array":[2,0,1],"x":1,"got":-1,"want":2},"reason":"the right end belongs to the sorted half"},{"change":"a[lo] <= x becomes <","wrong":5746,"pct":9.37,"smallest":{"array":[0,1,2],"x":0,"got":-1,"want":0},"reason":"the left end belongs to the sorted half; on an unrotated array this loses a[0]"}],"testingNote":"the worst of the three still fails less than one call in ten, so none appear on a casually chosen example"},"twoPassAlternative":{"correct":{"cases":61320,"wrong":0},"readabilityArgument":"neither stage contains any rotation logic","probes":{"n":1048576,"rows":[{"present":0,"onePass":20.00,"twoPass":39.33,"ratio":1.97},{"present":50,"onePass":19.50,"twoPass":38.83,"ratio":1.99},{"present":100,"onePass":19.00,"twoPass":38.33,"ratio":2.02}]},"reason":"the pivot search is a full descent and the segment search is another; nothing is shared"},"benchmark":{"units":"ns per query, best of 7, half the probes present","rows":[{"n":16,"linear":7.78,"onePass":17.54,"twoSegment":22.62,"twoVirtual":15.24},{"n":64,"linear":18.92,"onePass":21.97,"twoSegment":33.21,"twoVirtual":23.40},{"n":256,"linear":72.68,"onePass":26.59,"twoSegment":46.03,"twoVirtual":33.52},{"n":1024,"linear":242.35,"onePass":31.52,"twoSegment":58.55,"twoVirtual":45.59},{"n":65536,"onePass":74.76,"twoSegment":127.66,"twoVirtual":116.10},{"n":1048576,"onePass":122.60,"twoSegment":212.79,"twoVirtual":207.72}],"linearWindow":"the scan wins below about n = 50, wider than in the unrotated subtopics because each binary step here is more expensive"},"correctsTheModulePattern":{"priorFindings":"five subtopics measured a branchless form beating a branchy one that did less work","testHere":{"variant":"two passes with a fully branchless virtual-index lower bound, mapping i to a[(i + p) mod n] via a conditional subtract","branchlessEvidence":{"n":16,"nsAtPresent":[15.23,15.24,15.17],"comparison":"the one-pass version swings 15.26, 17.54, 13.67 over the same workloads"},"result":"still 1.7x slower at n = 1,048,576"},"refinedRule":"a branch costs about one misprediction and a probe costs about one cache miss, so count probes first — branchlessness is worth a fraction of a descent, never a whole one","assembly":[{"fn":"one pass","instructions":32,"condSelects":2,"condBranches":6},{"fn":"two passes, segment","instructions":41,"condSelects":6,"condBranches":7},{"fn":"two passes, virtual index","instructions":45,"condSelects":7,"condBranches":6}]},"assertions":["at least one of the two halves around mid is fully sorted","a discarded half provably cannot contain x","the answer is an index or -1","the cost does not depend on how far the array was rotated","an unrotated array is handled with no special case"]}
```

<!-- @highlights -->
- One half around the midpoint is always sorted, because a single wrap cannot break both.
- The canonical one-pass form is 0 wrong over 61,320 exhaustive cases.
- Three `=` characters are load-bearing, failing at 1.69%, 3.83% and 9.37% when dropped.
- The worst of the three loses `a[0]` on an unrotated array — `[0,1,2]` searching for 0 returns -1.
- Finding the pivot first is correct and 1.7x slower, because it does 38.83 probes per query against 19.50.
- The fully branchless variant is measurably branchless and still loses — branchlessness is worth a fraction of a descent, not a whole one.

<!-- @edgeCases -->
- An unrotated array — handled with no special case, and the input that exposes the `a[lo] <= x` slip.
- A single-element array — lo, mid and hi all coincide, which is the case the `a[lo] <= a[mid]` inclusivity exists for.
- Two elements — the smallest input that breaks the strict version, `[1,0]` searching for 0.
- x absent — costs the same as x present, since every discarded half was proven empty of x.
- x smaller than everything or larger than everything — both range tests simply fail every time and the window empties.
- x at the pivot itself — the minimum, which is the first element of the second run.
- x at index 0 of a rotated array — the maximum of the whole array.
- An empty array — `hi` starts at -1 and the loop never runs, giving -1.
- Duplicates — outside this problem's precondition and the subject of part II; the linear scan is the only version here that survives them.
- n above 1,073,741,824 — where `(lo + hi) / 2` overflows an int, exactly as in Lower Bound.

<!-- @pitfalls -->
- Writing `a[lo] < a[mid]`. Wrong on 1.69% of exhaustive cases, smallest `[1,0]` searching for 0, because lo and mid coincide on small windows.
- Writing `a[lo] < x` in the left range test. Wrong on 9.37%, and it loses `a[0]` on an unrotated array.
- Writing `x < a[hi]` in the right range test. Wrong on 3.83%, smallest `[2,0,1]` searching for 1.
- Comparing x to `a[mid]` to pick a side, as in ordinary binary search. That comparison carries no information once the array is rotated.
- Writing `lo < hi` as the loop condition. This search returns an index, so the last remaining element must still be examined.
- Removing the `a[mid] == x` early exit. Unlike Lower Bound, there is no boundary here that identifies the answer.
- Finding the pivot first for clarity. It is correct and 1.7x slower — two full descents against one.
- Assuming a branchless rewrite must be faster. The fully branchless variant is genuinely branchless and still loses by 1.7x.
- Testing only on rotated arrays. The unrotated case is where the most common boundary slip shows up.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825.

<!-- @doubt -->
### Why is one half always sorted?

<!-- @answer -->
Because the array has exactly one wrap point — the place where the second run begins — and a single point cannot be inside both halves of a cut. So whichever half does not contain it is an ordinary ascending range, and an ordinary ascending range answers "is x somewhere in here" with two comparisons against its ends. That is the entire algorithm: identify the sorted half, test x against its range, and discard one side either way. Note what the test achieves in both outcomes — if x is inside the sorted half you keep it and have an ordinary problem; if it is not, you have proven x is in the *other* half, which is the one you knew nothing about. Verified over 61,320 exhaustive cases with 0 errors.

<!-- @doubt -->
### Why must it be `a[lo] <= a[mid]` and not `<`?

<!-- @answer -->
Because when the window narrows to one or two elements, `mid` and `lo` are the same index. `a[lo] < a[mid]` is then comparing a value to itself and is false, so the code concludes the *right* half is sorted and applies a range test to a half that does not exist. The smallest case is `[1,0]` searching for 0: the correct version finds the left half trivially sorted, rules 0 out of it, moves to index 1 and returns 1; the strict version takes the right-half branch, fails its range test, sets `hi = -1` and returns -1. Measured, that one character is wrong on **1,034 of 61,320** exhaustive cases — 1.69%. It is a small rate precisely because it needs a window that has already narrowed to one or two elements, which is the last step of a search rather than the first.

<!-- @doubt -->
### Why are the range tests inclusive on one side and not the other?

<!-- @answer -->
Because the sorted half includes its own outer end and excludes the midpoint, which the equality check has already handled. For the left half the range is `[a[lo], a[mid])` — `a[lo]` is inside the half so the test must be `a[lo] <= x`, while `a[mid]` was already compared for equality and returned, so `x < a[mid]` is right. Getting either end wrong loses real answers: writing `a[lo] < x` is wrong on **5,746 of 61,320 cases — 9.37%**, the highest of the three, because it discards x exactly when x sits at the window's left edge, which on an unrotated array is `a[0]`. `[0,1,2]` searching for 0 returns -1. The mirror slip, `x < a[hi]` instead of `<=`, is wrong on **2,349 — 3.83%**, smallest `[2,0,1]` searching for 1.

<!-- @doubt -->
### Would it be cleaner to find the pivot first?

<!-- @answer -->
Cleaner to read, and 1.7x slower. Finding the rotation point with the previous subtopic's descent and then running an ordinary binary search on the correct segment is correct — 0 wrong over the same 61,320 cases — and it has a real advantage: neither loop contains any rotation logic, so each is a function you have already verified. The cost is that they are two independent full descents. Measured at n = 1,048,576, the two-stage version makes **38.83 array probes per query against 19.50** — almost exactly double — and takes 212.79ns against 122.60ns. The gap is 1.7x rather than 2x because the two-stage version's individual probes are slightly cheaper, its loops having no four-way decision. If the code is not hot, the readability may be worth it; if it is, the one-pass version does the same job while it descends.

<!-- @doubt -->
### This module kept finding branchless versions faster. Why not here?

<!-- @answer -->
Because the trade is different in size, and this subtopic is the one that pins the rule down. The earlier findings — the fused `equal_range` descent, the early exit in Search Insert Position, the sortedness shortcut in Find Minimum — all traded a *fraction* of the probes for one unpredictable branch, and the branch cost more. Here the trade runs the other way: the branchless option costs a **whole extra descent**. To test that fairly rather than assume it, the third column of the benchmark is a fully branchless variant — pivot search, then a lower bound over the rotated array with index i mapped to `a[(i + p) mod n]` by a conditional subtract. It really is branchless: 15.23, 15.24 and 15.17 nanoseconds at n = 16 as the present fraction goes none, half, all, where the one-pass version swings 15.26, 17.54, 13.67. And it still loses by 1.7x at n = 1,048,576. The rule that survives all six subtopics is narrower than "prefer branchless": a branch costs roughly one misprediction and a probe costs roughly one cache miss, so count probes first.

<!-- @doubt -->
### Do I still need the `a[mid] == x` early exit?

<!-- @answer -->
Yes, and it is worth seeing why this differs from Lower Bound, where the same-looking line was a bug. Lower Bound returns a *boundary*, and the boundary is identified by the loop's termination rather than by any element — so stopping early returns an arbitrary occurrence instead of the leftmost one. This problem returns the *index of a match*, and nothing about where the window finally collapses identifies that index. There is no boundary to fall out. The equality test is how the answer is found, not an optimisation on top of finding it, which is also why this search has the branchier steps that made the earlier trade-off worth measuring.

<!-- @doubt -->
### How small does the array have to be before a linear scan wins?

<!-- @answer -->
About fifty elements, which is a much wider window than the unrotated subtopics gave. Measured, the scan is 7.78ns against 17.54ns at n = 16, roughly level at n = 64 (18.92 against 21.97), and behind from there — 72.68 against 26.59 at n = 256. Compare Lower Bound, where the crossover had closed entirely and the scan was already three times slower at n = 64. The difference is that each step of *this* binary search is expensive: three or four comparisons and a hard-to-predict branch, against Lower Bound's single branchless comparison. A more expensive step buys the linear scan more room. It is still not a reason to reach for the scan, since the sizes where it wins are sizes where nothing matters.
