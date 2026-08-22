---
id: lower-bound
topic: Binary Search
title: Lower Bound
difficulty: Easy
status: ready
prerequisites:
  - search-x-in-sorted-array
  - linear-search
  - while-loop
  - integer-overflow-and-precision-errors
relatedIds:
  - search-x-in-sorted-array
  - upper-bound
  - search-insert-position
  - first-and-last-occurrence
  - count-occurrences-in-a-sorted-array
---

<!-- @summary -->
Find the first index where a[i] >= x — the same five lines as Search X with two characters changed, except that both of those characters were measured as bugs one subtopic ago, and removing the early exit collapses the linear-scan crossover from about fifty elements to none.

<!-- @theory -->
## The problem

Return the first index at which x could be inserted while keeping the array
sorted — equivalently, the first index i with `a[i] >= x`.

```
a = [1, 3, 3, 5, 8]

x = 3   ->  1     the FIRST 3, not any 3
x = 4   ->  3     no 4 present; 4 belongs before the 5
x = 9   ->  5     larger than everything, so it belongs at the end
x = 0   ->  0
```

Two things follow immediately, and both differ from Search X:

- **The answer is a position, not an index.** It ranges over `0..n` inclusive, and
  `n` is a perfectly ordinary answer meaning "past the end". Nothing is found and
  nothing is missing.
- **There is no early exit.** Landing on a value equal to x does not end the
  search, because an equal value further left would be a better answer. Every
  call does the full descent.

## Two characters change, and both were bugs last time

Here is the canonical loop beside Search X's:

```
Search X                          Lower Bound
lo = 0, hi = n - 1                lo = 0, hi = n
while lo <= hi:                   while lo < hi:
    mid = ...                         mid = ...
    if a[mid] == x: return mid
    if a[mid] <  x: lo = mid + 1      if a[mid] < x: lo = mid + 1
    else:           hi = mid - 1      else:          hi = mid
return -1                         return lo
```

Search X's container measured `while (lo < hi)` as **wrong on 10.14%** of cases
and `hi = mid` as **hanging on 29.6%**. Both appear here, and both are required.

They are not independent choices. Checked against `std::lower_bound` on every
sorted array of length 0 to 10 over four values, with every probe from -1 to 4 —
6,006 cases:

| Loop condition | `hi` update | Result |
|---|---|---|
| `lo < hi`, `hi = n` | `hi = mid` | **correct** |
| `lo < hi`, `hi = n` | `hi = mid - 1` | **wrong on 942** |
| `lo <= hi`, `hi = n - 1` | `hi = mid` | **hangs on 4,640** (77%) |
| `lo <= hi`, `hi = n - 1` | `hi = mid - 1` | **correct** |

Both diagonals work; both mixtures fail, and they fail differently. The
smallest failing cases:

```
lo < hi   with hi = mid - 1    a = [0,1], x = 1  ->  0, want 1
lo <= hi  with hi = mid        a = [0],   x = -1 ->  never returns
```

So the rule is a **pairing**, not a preference:

- `lo <= hi` means `hi` is the last valid index, so the discarded half must
  exclude it: `hi = mid - 1`.
- `lo < hi` means `hi` is one past the range, so `mid` stays a candidate:
  `hi = mid`.

Mixing them either skips the element that should have been the answer, or leaves
`mid` in a range that never shrinks. Search X used the first pairing; this uses
the second. Neither line is right or wrong on its own.

## The step count

With no early exit the step count is **ceil(log2(n + 1))** in the worst case, and
it barely moves:

| n | measured average | worst case | spread |
|---|---|---|---|
| 1,024 | 10.00 | 11 | 10 on 1,025 of 1,027 distinct probes |
| 65,536 | 16.00 | 17 | |
| 1,048,576 | 20.00 | 21 | |

Search X averaged 19.50 at the last size because it could stop early. Here there
is nothing to stop for, and the average sits flat on the bound.

It is *almost* constant rather than exactly constant, and the exception is worth
knowing: the count is truly identical on every probe only when n is one less than
a power of two, where the range halves evenly every time. At n = 15 all 18
distinct probes take 4 iterations. At n = 16 seventeen of nineteen take 4 and two
take 5.

## Removing the early exit removes the branch problem

Search X's container found that its canonical loop lost 2.4x to 7.3x to a
branchless rewrite, and read the generated ARM64 to show why: the `lo`/`hi` update
was already a conditional select, and the one remaining data-dependent branch was
the early-exit equality test.

Take the early exit away and that branch does not exist. Reading the assembly for
this loop confirms it: **two conditional selects, and the only branch is the
loop-back**. The canonical form here is already branchless.

The consequence is measurable. Rewriting it in the pointer style that was worth
2.4x to 7.3x in Search X is worth almost nothing here:

| n | Canonical | Pointer form | |
|---|---|---|---|
| 64 | 5.39ns | 4.92ns | 1.10x |
| 1,024 | 10.63ns | 9.30ns | 1.14x |
| 4,096 | 14.15ns | 12.13ns | 1.17x |
| 1,048,576 | 59.50ns | 54.97ns | 1.08x |

**1.08x to 1.17x**, and what remains is not branch prediction at all. The index
form computes `(hi - lo) / 2` as a *signed* division, which clang expands to three
instructions to round toward zero; the pointer form halves a length it knows is
non-negative, which is one shift. That is the whole gap.

## And the scan stops being competitive

Search X measured a linear scan winning up to about fifty elements, because its
binary search was paying a mispredicted branch per step. With that branch gone:

| n | Linear scan | Lower bound |
|---|---|---|
| 64 | 16.50ns | **5.39ns** |
| 256 | 47.91ns | **7.56ns** |
| 1,024 | 162.77ns | **10.63ns** |

At n = 64 the scan is already three times slower, and below n = 16 the two are
close enough that the measurements are dominated by call overhead rather than by
either algorithm. The crossover that sat near fifty in Search X is gone.

That is one cause producing three effects: no early exit means no unpredictable
branch, which means the canonical code is already optimal, which means the scan
never gets its window.

<!-- @intuition -->
The temptation is to read lower bound as "search, and if you miss, report where you would have been". It is cleaner to drop the idea of finding altogether: the loop is narrowing a range of *positions*, and the answer is the one position left standing. That reframing explains everything else. It explains why the answer can be n — there are n + 1 positions in an array of n elements. It explains why there is no early exit — an equal element is not an answer, it is only evidence that the answer is at or before it. And it explains why the loop condition and the hi update have to agree: they are two halves of one statement about what the surviving range means, and the two consistent readings of that statement are exactly the two that work.

<!-- @approach -->
### Linear Scan

<!-- @idea -->
Walk forward until an element is not smaller than x, and return where you stopped.

<!-- @steps -->
1. Start at index zero.
2. While the index is inside the array and the element there is smaller than x, advance.
3. Stop as soon as an element is not smaller than x.
4. Return the index where the walk stopped.
5. Running off the end returns n, which is the correct answer for an x larger than everything.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Worth writing once because the loop's stopping condition is the definition of lower bound, stated directly. It is also no longer competitive: measured 16.50ns against 5.39ns at n = 64, where Search X's scan was still ahead at n = 48.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int lowerBound(const vector<int>& a, int x) {
    int i = 0;
    while (i < (int)a.size() && a[i] < x) i++;
    return i;
}
```

<!-- @annotations -->
- 6: The bounds test comes first, so running off the end never reads a[n]. Swapping the two halves of the condition makes this read out of bounds.
- 7: Returning i, not -1. Stopping past the last element gives n, which means the value belongs at the end.

<!-- @code java -->
```java
static int lowerBound(int[] a, int x) {
    int i = 0;
    while (i < a.length && a[i] < x) i++;
    return i;
}
```

<!-- @annotations -->
- 3: Strictly less than. Using <= would walk past equal elements and return the upper bound instead.

<!-- @code python -->
```python
def lower_bound(a, x):
    i = 0
    while i < len(a) and a[i] < x:
        i += 1
    return i


# The stopping rule is the definition: the first position whose
# element is not smaller than x.
```

<!-- @annotations -->
- 3: Python evaluates the two halves left to right and stops at the first false, so the index check protects the lookup.

<!-- @approach -->
### Narrow the Range of Positions

<!-- @idea -->
Keep a range of candidate positions and halve it, letting mid remain a candidate whenever it is not smaller than x.

<!-- @steps -->
1. Set lo to 0 and hi to n — one past the last index, because n is a valid answer.
2. While the range holds more than one position, take mid.
3. If the element at mid is smaller than x, no position at or before mid can be the answer, so move lo past it.
4. Otherwise mid is still a candidate, so bring hi down to mid without excluding it.
5. When lo and hi meet, that position is the answer.

<!-- @complexity -->
- time: O(log n) — ceil(log2(n + 1)) iterations worst case, with no early exit and no meaningful variance
- space: O(1)
- note: The canonical form, and already branchless — the generated ARM64 uses two conditional selects and branches only to repeat the loop. That is why the pointer rewrite below is worth 1.08x to 1.17x here against 2.4x to 7.3x in Search X.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int lowerBound(const vector<int>& a, int x) {
    int lo = 0, hi = (int)a.size();
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < x) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 5: hi is n, not n - 1, because n is a possible answer. This is the opposite of Search X, where hi = n read past the end on 23.2% of cases.
- 6: lo < hi, not lo <= hi. Paired with hi = mid below, this is one of the two consistent readings; the other is lo <= hi with hi = mid - 1.
- 9: hi = mid, not mid - 1. mid is still a candidate here, since a[mid] >= x. In Search X this same line hung on 29.6% of cases, because there it was paired with lo <= hi.
- 11: Returning lo, and lo can be n. The caller must range-check before dereferencing.

<!-- @code java -->
```java
static int lowerBound(int[] a, int x) {
    int lo = 0, hi = a.length;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < x) lo = mid + 1;
        else hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 4: The same overflow-safe form Search X needed. lo + hi can exceed an int from n = 1,073,741,825.

<!-- @code python -->
```python
def lower_bound(a, x):
    lo, hi = 0, len(a)
    while lo < hi:
        mid = lo + (hi - lo) // 2
        if a[mid] < x:
            lo = mid + 1
        else:
            hi = mid
    return lo


# No early exit: landing on a value equal to x is not an answer,
# only evidence that the answer is at or before it.
```

<!-- @annotations -->
- 5: Strictly less than. Writing <= walks past equal elements and produces the upper bound instead — a different function, not a bug in this one.

<!-- @approach -->
### Track a Length Instead of Two Indices

<!-- @idea -->
Carry a pointer and a remaining length rather than two indices, so halving is an unsigned shift.

<!-- @steps -->
1. Start with the pointer at the front and the length at n.
2. While any length remains, take half of it.
3. If the element at that offset is smaller than x, move the pointer past it and shorten the length accordingly.
4. Otherwise keep the pointer and shorten the length to the half.
5. The pointer's offset from the start is the answer.

<!-- @complexity -->
- time: O(log n), the same descent
- space: O(1)
- note: Measured 1.08x to 1.17x over the canonical form — much less than the same rewrite bought in Search X, and for a different reason. The gain is not branch prediction, which the canonical form already avoids; it is that halving a known non-negative length is one shift where signed division by two is three instructions.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int lowerBound(const vector<int>& a, int x) {
    const int* base = a.data();
    int len = (int)a.size();
    while (len > 0) {
        int half = len / 2;
        if (base[half] < x) { base += half + 1; len -= half + 1; }
        else len = half;
    }
    return int(base - a.data());
}
```

<!-- @annotations -->
- 8: len is never negative, so the compiler halves it with a single shift. The canonical form's (hi - lo) / 2 is a signed division, which expands to three instructions to round toward zero.
- 9: Moving past the probed element costs half + 1, not half — the same exclusion rule the index form writes as mid + 1.
- 12: Pointer difference rather than a stored index. On an empty vector this is zero, which is the correct answer.

<!-- @code java -->
```java
static int lowerBound(int[] a, int x) {
    int base = 0, len = a.length;
    while (len > 0) {
        int half = len / 2;
        if (a[base + half] < x) { base += half + 1; len -= half + 1; }
        else len = half;
    }
    return base;
}
```

<!-- @annotations -->
- 5: Java has no unsigned shift for this without >>> and a non-negative guarantee, so whether the JIT makes the same saving is its decision. Measure before assuming it transfers.

<!-- @code python -->
```python
from bisect import bisect_left


def lower_bound(a, x):
    return bisect_left(a, x)


# bisect_left IS lower bound — the same function, in C. In Python
# the interpreter overhead dwarfs every effect measured here, so
# the right move is to stop writing the loop.
```

<!-- @annotations -->
- 5: Verified identical to the hand-written loop on all 8,190 exhaustive cases. bisect_right is the upper bound, which is the next subtopic.

<!-- @example -->

<!-- @input -->
a = [1, 3, 3, 5, 8], x = 3

<!-- @output -->
1 — the first 3, reached without ever stopping early

<!-- @why -->
The smallest case that shows both distinguishing features: duplicates resolve to the leftmost, and landing on x does not end the search.

<!-- @walkthrough -->
1. lo is 0 and hi is 5, so mid is 2 and a[2] is 3.
2. 3 is not smaller than 3, so mid stays a candidate and hi becomes 2.
3. The range is now positions 0 to 2, and mid is 1, where a[1] is also 3.
4. Again not smaller, so hi becomes 1 — even though this element equals x.
5. The range is now positions 0 to 1, mid is 0, and a[0] is 1.
6. 1 is smaller than 3, so lo moves past it to 1, and lo now equals hi.
7. The answer is 1, the leftmost 3 — which an early exit at step 2 would have missed by returning 2.

<!-- @example -->

<!-- @input -->
The four combinations of loop condition and hi update

<!-- @output -->
Both diagonals correct; both mixtures fail, in two different ways

<!-- @why -->
The two lines Search X measured as bugs are both required here, so the lesson has to be about pairing rather than about either line.

<!-- @walkthrough -->
1. With hi set to n, the loop condition must be lo < hi, since hi is one past the range and never a valid probe.
2. With hi set to n - 1, the condition must be lo <= hi, since hi is a real index that still needs examining.
3. Pairing lo < hi with hi = mid - 1 discards a position that was still a candidate — wrong on 942 of 6,006 cases, smallest a = [0,1] searching for 1.
4. Pairing lo <= hi with hi = mid leaves mid inside a range that never shrinks — it hangs on 4,640 of 6,006, smallest a = [0] searching for -1.
5. Both correct pairings agree with std::lower_bound on all 6,006 cases.
6. Search X used the first pairing and this uses the second, which is why its container measured these exact lines as defects.
7. The transferable rule is that hi's meaning and the loop's stopping test are one decision written on two lines.

<!-- @example -->

<!-- @input -->
a = [1, 3, 5], x = 6 and a = [], x = 1

<!-- @output -->
3 and 0 — both one past the end of their arrays

<!-- @why -->
The return value is a position rather than an index, and forgetting that is the mistake this function invites.

<!-- @walkthrough -->
1. An array of n elements has n + 1 positions where a value could be inserted.
2. So the answer ranges over 0 to n inclusive, and n is an ordinary result.
3. For x larger than every element, lo walks all the way up and the answer is n.
4. For an empty array the loop never runs and the answer is 0, which is both the first and the last position.
5. Neither case is an error and neither is signalled — there is no -1 here.
6. The caller must therefore range-check before using the result as an index.
7. Search X returned -1 for absent values, which is checkable by accident; this returns a valid-looking number that is out of range.

<!-- @example -->

<!-- @input -->
n = 1,048,576, canonical against the pointer form

<!-- @output -->
59.50ns against 54.97ns — 1.08x, where Search X measured 2.4x

<!-- @why -->
Tests the explanation the previous container gave, on a loop that has had the suspected cause removed.

<!-- @walkthrough -->
1. Search X attributed its 2.4x to 7.3x gap to one data-dependent branch, the early-exit equality test.
2. Lower bound has no early exit, so if that explanation was right the gap should mostly disappear.
3. Measured across five sizes, the same rewrite is worth 1.08x to 1.17x.
4. Reading the generated ARM64 confirms the cause: this loop already uses two conditional selects and branches only to repeat.
5. What remains is arithmetic rather than prediction — (hi - lo) / 2 is a signed division, expanded to three instructions to round toward zero.
6. The pointer form halves a length that cannot be negative, which is a single shift.
7. So the earlier explanation held, and the residual gap has a different and smaller cause.

<!-- @visualization custom -->

<!-- @description -->
Draw the array as n cells with n + 1 gaps drawn between and around them, and make the gaps the highlighted objects rather than the cells — the answer is a gap, and every misunderstanding of this function comes from looking at cells instead. Number the gaps 0 to n. Shade the live range of gaps and grey out the rest permanently as the loop runs, with lo and hi marking gap positions rather than element positions. On each step light the element at mid, resolve a[mid] < x, and collapse the shaded gap range to one side — crucially, when the element is not smaller, show mid's gap staying inside the range while the element itself greys out, since that is exactly what hi = mid means and what hi = mid - 1 would wrongly discard. Beside the main figure, run the pairing panel: a two-by-two grid of loop condition against hi update, each cell containing a miniature of the same array being searched. The two diagonal cells complete and show a green gap; the lo < hi with mid - 1 cell completes and lands one gap too far left, marked wrong on 942 of 6,006; the lo <= hi with mid cell visibly stalls, its range refusing to shrink, with an iteration counter climbing past any bound and the label hangs on 4,640 of 6,006. Hold that stalled cell. Then a small strip contrasting with Search X: the same array, Search X stopping the moment it hits a 3 and reporting index 2, lower bound continuing past it to report 1, captioned an equal element is evidence, not an answer. Close with the branch panel from Search X redrawn with its equality test removed: a prediction lamp that now has nothing to predict, steady green, beside two time bars reading 59.50ns and 54.97ns and the note 1.08x here, 2.4x there.

<!-- @sampleInput -->
```json
{"primary":{"array":[1,3,3,5,8],"x":3,"answer":1,"trace":[{"lo":0,"hi":5,"mid":2,"value":3,"compare":"3 >= 3","action":"hi = mid","newRange":[0,2],"note":"equal, and still not an answer"},{"lo":0,"hi":2,"mid":1,"value":3,"compare":"3 >= 3","action":"hi = mid","newRange":[0,1]},{"lo":0,"hi":1,"mid":0,"value":1,"compare":"1 < 3","action":"lo = mid + 1","newRange":[1,1]}],"iterations":3,"noEarlyExit":true,"otherProbes":[{"x":4,"answer":3},{"x":9,"answer":5},{"x":0,"answer":0}]},"answerIsAPosition":{"range":"0..n inclusive","reason":"an array of n elements has n + 1 insertion positions","examples":[{"array":[1,3,5],"x":6,"answer":3,"note":"one past the end"},{"array":[],"x":1,"answer":0}],"contrastWithSearchX":"Search X returns -1 for absent values, which is checkable by accident; this returns a valid-looking number that may be out of range"},"pairing":{"testedAgainst":"std::lower_bound","cases":6006,"space":"every sorted array of length 0..10 over four values, every probe from -1 to 4","grid":[{"loop":"lo < hi","hi":"n","update":"hi = mid","result":"correct","wrong":0,"hangs":0},{"loop":"lo < hi","hi":"n","update":"hi = mid - 1","result":"wrong","wrong":942,"hangs":0,"smallest":{"array":[0,1],"x":1,"got":0,"want":1}},{"loop":"lo <= hi","hi":"n - 1","update":"hi = mid","result":"hangs","wrong":0,"hangs":4640,"smallest":{"array":[0],"x":-1}},{"loop":"lo <= hi","hi":"n - 1","update":"hi = mid - 1","result":"correct","wrong":0,"hangs":0}],"rule":"hi's meaning and the loop's stopping test are one decision written on two lines","searchXContrast":"Search X measured lo < hi as wrong on 10.14% and hi = mid as hanging on 29.6% — both are required here"},"stepCount":{"formula":"ceil(log2(n + 1)) worst case; average sits flat on log2 n","measured":[{"n":1024,"average":10.00,"worst":11,"note":"10 on 1,025 of 1,027 distinct probes"},{"n":65536,"average":16.00,"worst":17},{"n":1048576,"average":20.00,"worst":21}],"exactlyConstantWhen":"n is one less than a power of two — n = 15 takes 4 iterations on all 18 distinct probes","searchXComparison":"Search X averaged 19.50 at n = 1,048,576 because it could stop early"},"branchFinding":{"searchXClaim":"its 2.4x to 7.3x gap came from one data-dependent branch, the early-exit equality test","prediction":"removing the early exit should mostly remove the gap","assembly":"this loop uses two conditional selects and branches only to repeat — already branchless","measured":[{"n":64,"canonicalNs":5.39,"pointerNs":4.92,"ratio":1.10},{"n":256,"canonicalNs":7.56,"pointerNs":6.87,"ratio":1.10},{"n":1024,"canonicalNs":10.63,"pointerNs":9.30,"ratio":1.14},{"n":4096,"canonicalNs":14.15,"pointerNs":12.13,"ratio":1.17},{"n":65536,"canonicalNs":32.91,"pointerNs":29.34,"ratio":1.12},{"n":1048576,"canonicalNs":59.50,"pointerNs":54.97,"ratio":1.08}],"residualCause":"(hi - lo) / 2 is a signed division, expanded to three instructions to round toward zero; halving a non-negative length is one shift"},"scanCrossover":{"rows":[{"n":64,"linearNs":16.50,"lowerBoundNs":5.39},{"n":256,"linearNs":47.91,"lowerBoundNs":7.56},{"n":1024,"linearNs":162.77,"lowerBoundNs":10.63}],"reading":"the crossover that sat near fifty elements in Search X is gone; below n = 16 the two are close enough that call overhead dominates","cause":"one cause, three effects — no early exit means no unpredictable branch, which means the canonical code is already optimal, which means the scan never gets its window"},"assertions":["the result is in 0..n inclusive","every element before the result is strictly less than x","every element from the result onward is at least x","duplicates resolve to the leftmost occurrence","ceil(log2(n + 1)) iterations worst case, with no early exit"]}
```

<!-- @highlights -->
- The array is drawn as n cells with n + 1 gaps between and around them, and the gaps are the highlighted objects.
- Gaps are numbered 0 to n, because the answer is a gap and not a cell.
- lo and hi mark gap positions, and the live range of gaps shades while the rest greys out permanently.
- Each step lights the element at mid and resolves a[mid] < x.
- When the element is not smaller, mid's gap stays inside the range while the element itself greys out.
- That is exactly what hi = mid means, and what hi = mid - 1 would wrongly discard.
- A pairing panel shows a two-by-two grid of loop condition against hi update.
- Both diagonal cells complete and land on a green gap.
- The lo < hi with mid - 1 cell completes one gap too far left, marked wrong on 942 of 6,006.
- The lo <= hi with mid cell visibly stalls, its range refusing to shrink, counter climbing past any bound.
- That stalled cell is held, labelled hangs on 4,640 of 6,006.
- A contrast strip runs Search X on the same array, stopping at the first 3 it lands on and reporting index 2.
- Lower bound continues past it to report 1, captioned an equal element is evidence, not an answer.
- The branch panel from Search X is redrawn with the equality test removed.
- Its prediction lamp has nothing to predict and stays steady green.
- Two time bars read 59.50ns and 54.97ns, noted as 1.08x here against 2.4x there.

<!-- @edgeCases -->
- An empty array — the loop never runs and the answer is 0, which is both the first and the last position.
- x larger than every element — the answer is n, one past the end, and is not an error.
- x smaller than every element — the answer is 0.
- x present many times — the answer is the leftmost occurrence, unlike Search X which may return any of them.
- An array of all equal values — the answer is 0 when x equals them, and n when x is larger.
- A single element — the size at which the wrong pairing first hangs, with a = [0] and x = -1.
- Using the result as an index without checking — it can be n, and a[n] is not yours.
- n above 1,073,741,824 — where (lo + hi) / 2 overflows an int, exactly as in Search X.
- An unsorted array — the loop terminates and its answer means nothing; nothing checks the precondition.
- Duplicates of x at the very start — the answer is 0, and no element before it exists to verify against.

<!-- @pitfalls -->
- Adding an early exit when a[mid] equals x. It returns an arbitrary occurrence rather than the leftmost, which is the one property this function exists to provide.
- Pairing lo < hi with hi = mid - 1. It discards a position that was still a candidate — wrong on 942 of 6,006 exhaustive cases.
- Pairing lo <= hi with hi = mid. It hangs on 4,640 of 6,006, because mid stays inside a range that never shrinks.
- Carrying Search X's habits over unchanged. Both of the lines it measured as bugs are required here; the choice is a pairing, not a preference.
- Treating the result as an index. It ranges over 0 to n, and n means the value belongs past the end.
- Expecting -1 for a value that is absent. There is no such signal — an absent value returns the position it would occupy.
- Writing a[mid] <= x instead of a[mid] < x. That is the upper bound, a different function rather than a broken one.
- Computing mid as (lo + hi) / 2. It overflows an int from n = 1,073,741,825, exactly as in Search X.
- Reaching for the pointer rewrite for speed. It is worth 1.08x to 1.17x here, against 2.4x to 7.3x in Search X.
- Reaching for a linear scan on small input. That advice came from Search X, whose binary search was paying a mispredicted branch; here the scan is already three times slower at n = 64.

<!-- @doubt -->
### Search X said `lo < hi` was wrong and `hi = mid` hangs. Why are both correct here?

<!-- @answer -->
Because they were never wrong on their own — they were wrong *paired with the other convention*. `hi` either means "the last valid index" or "one past the range", and everything else follows from which you chose. With `hi = n - 1` the loop must be `lo <= hi` and the update `hi = mid - 1`; with `hi = n` it must be `lo < hi` and `hi = mid`. Measured over 6,006 exhaustive cases, both consistent pairings match `std::lower_bound` exactly, the first mixture is wrong on 942, and the second hangs on 4,640. Search X used one pairing and this uses the other.

<!-- @doubt -->
### Why is there no early exit when a[mid] equals x?

<!-- @answer -->
Because an equal element is not the answer, only evidence about where the answer is. Lower bound wants the *leftmost* index with `a[i] >= x`, so landing on an equal value tells you the answer is at or before mid — it does not tell you it is mid. On `a = [1,3,3,5,8]` searching for 3, an early exit at the first probe would return index 2; the correct answer is 1. That is also why the step count barely moves: measured at n = 1,048,576 it averages 20.00 against Search X's 19.50, which could stop early. The bound is ceil(log2(n + 1)), and it is exactly constant only when n is one less than a power of two — at n = 1,024 the loop takes 10 iterations on 1,025 of 1,027 distinct probes and 11 on the other two.

<!-- @doubt -->
### What does it return when x is not in the array?

<!-- @answer -->
The position where x would go, which is an ordinary answer rather than a failure signal. On `[1,3,5]` searching for 4 you get 2, the position of the 5, because 4 belongs before it; searching for 6 you get 3, one past the end. There is no -1. That is the practical difference from Search X: an absent value there produced an obviously invalid index, and here it produces a valid-looking number that may be out of range. Range-check the result before dereferencing.

<!-- @doubt -->
### Does the branchless rewrite help here too?

<!-- @answer -->
Barely, and that is the interesting part. Search X measured 2.4x to 7.3x for the same rewrite and attributed it to one data-dependent branch — the early-exit equality test. This loop has no early exit, so if that explanation was right the gap should mostly vanish. Measured across six sizes it is **1.08x to 1.17x**. Reading the generated ARM64 confirms the cause: this loop already compiles to two conditional selects with only the loop-back branching. What remains is arithmetic — `(hi - lo) / 2` is a signed division that clang expands to three instructions, while halving a non-negative length is one shift.

<!-- @doubt -->
### Should I use a linear scan for small arrays, as Search X suggested?

<!-- @answer -->
No. That advice was specific to Search X, whose binary search was slowed by a mispredicted branch on every step, giving the scan a window up to about fifty elements. Here the binary form is already branchless, so the window closes: measured, the scan is 16.50ns against 5.39ns at n = 64, and three times slower again by n = 256. Below about n = 16 the two are close enough that the measurement is dominated by call overhead rather than by either algorithm. There is no size at which the scan is clearly the better choice.

<!-- @doubt -->
### How do I get the upper bound from this?

<!-- @answer -->
Change the comparison from `a[mid] < x` to `a[mid] <= x`, and nothing else. That makes elements equal to x lose their claim to being candidates, so the range collapses past them and you get the first index with `a[i] > x`. It is worth being precise that this is a *different function* rather than a bug in this one — writing `<=` here does not produce a broken lower bound, it produces a working upper bound. Python spells the pair `bisect_left` and `bisect_right`, and the next subtopic covers the second.
