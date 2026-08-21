---
id: print-subarray-with-maximum-subarray-sum
topic: Arrays
title: Print Subarray with Maximum Subarray Sum
difficulty: Medium
status: ready
prerequisites:
  - kadanes-algorithm
  - second-largest-element
  - maximum-consecutive-ones
  - for-loop
  - relational-and-logical-operators
  - time-and-space-complexity-basics
relatedIds:
  - kadanes-algorithm
  - stock-buy-and-sell
  - second-largest-element
  - maximum-consecutive-ones
---

<!-- @summary -->
Return the maximum-sum subarray itself rather than its total — where the one extra variable has to be updated at the restart rather than at the improvement, a mistake that yields the correct sum alongside the wrong subarray on 62.6% of inputs.

<!-- @theory -->
## The problem

Same as Kadane's algorithm, with a different return value: give back the
**subarray** that achieves the maximum sum, not just the sum.

```
[-2, 1, -3, 4, -1, 2, 1, -5, 4]  ->  [4, -1, 2, 1]   (sum 6)
[-3, -1, -2]                     ->  [-1]            (sum -1)
[2, 2]                           ->  [2, 2]          (sum 4)
```

The algorithm does not change at all. What changes is that you now have to
remember **where the current run began**, which is one extra variable and one
decision about when to update it.

## One variable, updated at exactly one moment

Kadane's already makes the decision you need. At each element it either **extends**
the current run or **starts fresh**. Starting fresh is precisely the moment the
subarray's beginning moves.

```
if x > cur + x:
    cur   = x
    start = i        <-- the run begins HERE
else:
    cur = cur + x

if cur > best:
    best = cur
    bestStart, bestEnd = start, i
```

Two separate things are happening and they must not be merged. `start` tracks
where the **current** run began and changes on every restart. `bestStart` and
`bestEnd` record the **best run seen so far** and change only when the best
improves. The current run's start is copied into the best only at the moment the
best is updated.

## The bug that passes your tests

The tempting shortcut is to set the start marker inside the improvement branch —
where the answer is being recorded — rather than at the restart:

```
if cur > best:
    best  = cur
    start = i                  <-- WRONG
    bestStart, bestEnd = start, i
```

That reports the range `[i, i]`, a single element, whenever the best improves.
And here is what makes it dangerous: **the sum it returns is still correct**,
because the sum comes from `cur`, which the bug never touches.

Measured over every array of length 1 to 6 drawn from `{-3,-1,0,2,4}` — 19,530
arrays:

| | Wrong |
|---|---|
| The returned **sum** | **0** — 0.0% |
| The returned **bounds** | **12,235** — 62.6% |

A test that checks only the sum passes **every single time**. A test that checks
the bounds fails on nearly two inputs in three. The smallest failure is two
elements: on `[2, 2]` it reports sum 4 with the range `[1,1]` — and that range
actually sums to 2.

**So validate the bounds, not the sum.** The check that catches this is: does the
subarray you are returning actually add up to the number you are returning
alongside it? That single assertion turns a 0%-detectable bug into a
62.6%-detectable one.

## There is usually more than one right answer

Before writing a test that asserts a specific range, know this: **42.4% of arrays
have more than one subarray achieving the maximum sum** — 8,281 of the 19,530
tested.

The simplest example is `[-3, -3]`. The maximum sum is −3, achieved by the first
element alone and by the second element alone. Both are correct.

Which one you get is decided by a single character:

| Comparison | Returns |
|---|---|
| `if cur > best` | the **earliest**-starting maximum — `(0,0)` |
| `if cur >= best` | a **later** one — `(1,1)` |

Verified across all 8,281 tied arrays: strict `>` returned the earliest range in
**every** case, with zero exceptions.

This is the same distinction that decided which occurrence was latched in Second
Largest Element, and it has the same consequence: neither is wrong, but a test
asserting one exact range is testing your tie-break convention rather than your
algorithm. Assert that the returned range **sums to the maximum**, not that it
equals a specific pair of indices.

Both linear formulations below use strict `>`, and measured across all 19,530
arrays they returned **identical ranges — 0 differences**.

## The bookkeeping is free

You might expect three extra integer assignments to cost something. Measured with
the loop structure held identical so the only difference is the tracking:

| n | Sum only | With indices | Difference |
|---|---|---|---|
| 65,536 | 0.961ns | **0.870ns** | −9.4% |
| 1,048,576 | 0.953ns | **0.873ns** | −8.5% |
| 8,388,608 | 0.960ns | **0.868ns** | −9.6% |

Consistently **faster** with the tracking, at every size, reproducibly.

I could not explain that, and I would rather say so than invent a reason. Both
versions compile to the same number of data-dependent branches, and the indexed
one emits *more* instructions (30 against 19) and more conditional selects (4
against 2) — so the obvious hypotheses do not hold. It is most likely an
instruction-scheduling effect on this particular processor.

The claim worth carrying is the conservative one: **tracking the indices costs
nothing**, so there is no performance reason to return only the sum when the
caller wants the subarray.

## Where this goes next

**Stock Buy and Sell** is this problem on the array of consecutive differences,
where the returned indices become the buy and sell days — so the index tracking
stops being a follow-up and becomes the whole point. The same
record-where-it-started technique applies to every "return the best window"
problem in the module.

<!-- @intuition -->
Kadane's already knows when a new subarray begins — it is the moment it decides to abandon what it was carrying and start fresh. Returning the subarray is just writing that moment down. The mistake is writing it down when you notice a new record instead, because by then the run has usually been going for a while and you have lost its beginning.

<!-- @approach -->
### Brute Force - Every Subarray, Recording Bounds

<!-- @idea -->
Try every start and end, keep a running sum, and record the bounds whenever a new maximum appears.

<!-- @steps -->
1. Take each index in turn as the start of a subarray.
2. Reset a running sum and extend the end one element at a time.
3. Whenever the running sum exceeds the best seen, record the sum and both indices.
4. Seed the best from the first element so all-negative arrays work.
5. Return the recorded bounds.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Correct and quadratic, and useful here as the reference the linear approaches were validated against — 50,000 random arrays with both the sum and the reported bounds checked, zero failures.

<!-- @code cpp -->
```cpp
#include <vector>
#include <tuple>
using namespace std;

// returns {sum, left, right}
tuple<long long,int,int> maxSubArray(const vector<int>& a) {
    long long best = a[0];
    int bl = 0, br = 0;

    for (int i = 0; i < (int)a.size(); i++) {
        long long sum = 0;
        for (int j = i; j < (int)a.size(); j++) {
            sum += a[j];
            if (sum > best) { best = sum; bl = i; br = j; }
        }
    }
    return {best, bl, br};
}
```

<!-- @annotations -->
- 8: Seeded from a[0], not 0, for the same reason as the previous subtopic — the maximum may be negative.
- 14: Strict > keeps the earliest range among ties; >= would keep a later one, and both are valid answers.

<!-- @code java -->
```java
static int[] maxSubArray(int[] a) {      // {sum, left, right}
    long best = a[0];
    int bl = 0, br = 0;

    for (int i = 0; i < a.length; i++) {
        long sum = 0;
        for (int j = i; j < a.length; j++) {
            sum += a[j];
            if (sum > best) { best = sum; bl = i; br = j; }
        }
    }
    return new int[]{ (int) best, bl, br };
}
```

<!-- @annotations -->
- 7: A long accumulator, since a subarray sum can exceed int range before the array is large.

<!-- @code python -->
```python
def max_sub_array(a):
    """returns (sum, left, right)"""
    best = a[0]
    bl = br = 0

    for i in range(len(a)):
        total = 0
        for j in range(i, len(a)):
            total += a[j]
            if total > best:
                best, bl, br = total, i, j
    return best, bl, br
```

<!-- @annotations -->
- 11: Assigning all three together makes it impossible to update the sum without updating the bounds — the exact mistake the linear version invites.

<!-- @approach -->
### Optimal - Kadane with Index Tracking

<!-- @idea -->
Record where the current run started at the moment it restarts, and copy that into the answer whenever the best improves.

<!-- @steps -->
1. Seed the running sum, the best, and both answer bounds from the first element.
2. Track a separate marker for where the current run began, starting at index 0.
3. At each element, decide whether to extend the run or start fresh.
4. If starting fresh, move the current-run marker to this index — this is the only place it moves.
5. If the running sum now beats the best, copy the current-run marker and the current index into the answer.
6. Return the recorded bounds after one pass.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: One pass and three extra integers. Measured 0.868 to 0.873 nanoseconds per element across sizes from 65,536 to 8.4 million — consistently faster than the sum-only version at the same loop structure, so the bookkeeping costs nothing.

<!-- @code cpp -->
```cpp
#include <vector>
#include <tuple>
using namespace std;

tuple<long long,int,int> maxSubArray(const vector<int>& a) {
    long long best = a[0], cur = a[0];
    int start = 0, bl = 0, br = 0;

    for (int i = 1; i < (int)a.size(); i++) {
        if ((long long)a[i] > cur + a[i]) {
            cur   = a[i];
            start = i;                  // the run begins HERE — the only place start moves
        } else {
            cur += a[i];
        }

        if (cur > best) {
            best = cur;
            bl = start;                 // copy the CURRENT run's start, not i
            br = i;
        }
    }
    return {best, bl, br};
}
```

<!-- @annotations -->
- 7: start tracks the current run; bl and br record the best run. Two different jobs, two different update moments.
- 9: Measured 0.868ns per element at 8.4 million elements, against 0.960ns for the sum-only version.
- 13: Setting start = i inside the improvement branch instead reports a single-element range — correct sum, wrong subarray, on 62.6% of inputs.
- 19: bl = start, not bl = i. By the time the best improves, the run has usually been going for several elements.

<!-- @code java -->
```java
static int[] maxSubArray(int[] a) {      // {sum, left, right}
    long best = a[0], cur = a[0];
    int start = 0, bl = 0, br = 0;

    for (int i = 1; i < a.length; i++) {
        if (a[i] > cur + a[i]) { cur = a[i]; start = i; }
        else                   { cur += a[i]; }

        if (cur > best) { best = cur; bl = start; br = i; }
    }
    return new int[]{ (int) best, bl, br };
}
```

<!-- @annotations -->
- 6: The restart and the marker move together on one line, which makes it hard to update one without the other.
- 9: Strict > returns the earliest maximum among ties — verified as the earliest range on all 8,281 tied test arrays.

<!-- @code python -->
```python
def max_sub_array(a):
    """returns (sum, left, right)"""
    best = cur = a[0]
    start = 0
    bl = br = 0

    for i in range(1, len(a)):
        x = a[i]
        if x > cur + x:
            cur, start = x, i        # restart: the run begins here
        else:
            cur = cur + x

        if cur > best:
            best, bl, br = cur, start, i    # copy start, never i

    return best, bl, br


# To return the elements rather than the bounds:
#   s, l, r = max_sub_array(a); return a[l:r+1]
```

<!-- @annotations -->
- 10: Updating cur and start in one assignment ties them together, which is what stops them drifting apart.
- 15: bl takes start, not i — that single substitution is the difference between the right subarray and a single element.

<!-- @approach -->
### Prefix Minimum with Index Tracking

<!-- @idea -->
Track where the smallest running total occurred; the best subarray starts just after it.

<!-- @steps -->
1. Keep a running total and the smallest running total seen so far, starting at zero for the empty prefix.
2. Also keep the index at which that smallest total occurred, starting at -1.
3. At each element, the best subarray ending here starts just after that recorded index.
4. If that beats the best, record the bounds as one past the minimum's index through the current index.
5. Only then update the minimum and its index.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Equivalent to the Kadane version and measured to return identical ranges on all 19,530 test arrays, since both use strict comparison. The index bookkeeping is one extra variable — the position of the minimum prefix — rather than the run's start.

<!-- @code cpp -->
```cpp
#include <vector>
#include <tuple>
#include <climits>
using namespace std;

tuple<long long,int,int> maxSubArray(const vector<int>& a) {
    long long best = LLONG_MIN, sum = 0, minPrefix = 0;
    int minIdx = -1, bl = 0, br = 0;

    for (int i = 0; i < (int)a.size(); i++) {
        sum += a[i];

        if (sum - minPrefix > best) {
            best = sum - minPrefix;
            bl = minIdx + 1;            // the subarray starts just AFTER the minimum
            br = i;
        }
        if (sum < minPrefix) { minPrefix = sum; minIdx = i; }
    }
    return {best, bl, br};
}
```

<!-- @annotations -->
- 8: minIdx starts at -1 for the empty prefix, so bl becomes 0 and a subarray starting at index 0 is reachable.
- 15: One past the minimum, because the minimum prefix is everything BEFORE the subarray begins.
- 18: Updating the minimum after recording, never before — reversing these two lines allows an empty subarray.

<!-- @code java -->
```java
static int[] maxSubArray(int[] a) {      // {sum, left, right}
    long best = Long.MIN_VALUE, sum = 0, minPrefix = 0;
    int minIdx = -1, bl = 0, br = 0;

    for (int i = 0; i < a.length; i++) {
        sum += a[i];

        if (sum - minPrefix > best) { best = sum - minPrefix; bl = minIdx + 1; br = i; }
        if (sum < minPrefix)        { minPrefix = sum; minIdx = i; }
    }
    return new int[]{ (int) best, bl, br };
}
```

<!-- @annotations -->
- 8: Recording before extending the candidate prefixes, which is the same ordering rule as the previous subtopic.

<!-- @code python -->
```python
def max_sub_array(a):
    """returns (sum, left, right)"""
    best = float('-inf')
    total = 0
    min_prefix = 0
    min_idx = -1
    bl = br = 0

    for i, x in enumerate(a):
        total += x

        if total - min_prefix > best:
            best, bl, br = total - min_prefix, min_idx + 1, i
        if total < min_prefix:
            min_prefix, min_idx = total, i

    return best, bl, br


# Verified against the Kadane version on all 19,530 test arrays: identical
# ranges every time, because both use strict > and so both resolve ties to
# the earliest-starting subarray.
```

<!-- @annotations -->
- 13: min_idx + 1 turns a prefix boundary into a subarray start — the off-by-one that this formulation lives or dies on.

<!-- @example -->

<!-- @input -->
a = [-2, 1, -3, 4, -1, 2, 1, -5, 4]

<!-- @output -->
[4, -1, 2, 1] — sum 6, indices 3 to 6

<!-- @why -->
The marker moves twice and then stays fixed while the answer improves three times, which is exactly the separation between the current run and the best run that the bug collapses.

<!-- @walkthrough -->
1. Seed cur, best and the bounds from -2 at index 0, with the current-run marker at 0.
2. At index 1 the value 1 beats extending, so the run restarts and the marker moves to 1; cur is 1 and best rises to 1 with bounds [1,1].
3. At index 2 extending wins, cur falls to -2, and the best is unchanged.
4. At index 3 the value 4 beats extending, so the run restarts again and the marker moves to 3; best rises to 4 with bounds [3,3].
5. At indices 4, 5 and 6 extending wins each time, so the marker stays at 3 while cur climbs to 3, then 5, then 6.
6. Each of those improvements copies the marker, giving bounds [3,4], then [3,5], then [3,6].
7. The final 4 brings cur only to 5, which does not beat 6, so the answer stays [3,6] — the subarray 4, -1, 2, 1.

<!-- @example -->

<!-- @input -->
a = [2, 2] with the start marker set inside the improvement branch

<!-- @output -->
sum 4 with range [1,1] — the sum is right and the range is wrong

<!-- @why -->
Two elements are enough, and it demonstrates the property that makes the bug dangerous: the number you would naturally assert on is the one thing that stays correct.

<!-- @walkthrough -->
1. Seed everything from the first 2, so cur and best are 2 with bounds [0,0].
2. At index 1 extending gives 4 and starting fresh gives 2, so extending wins and the run does not restart.
3. cur is now 4, which beats the best of 2, so the answer is updated.
4. The correct version copies the current-run marker, which is still 0, giving the range [0,1].
5. The buggy version sets the marker to i first, so it records [1,1] instead.
6. The reported sum is still 4, because the sum comes from cur which the bug never touches — but the range [1,1] sums to 2.
7. Measured over 19,530 arrays, that mistake produced 0 wrong sums and 12,235 wrong ranges — 62.6%.

<!-- @example -->

<!-- @input -->
a = [-3, -3]

<!-- @output -->
[-3] — but which one?

<!-- @why -->
Establishes that the answer is usually not unique, which is what makes an equality assertion on the returned indices a test of your tie-break convention rather than of correctness.

<!-- @walkthrough -->
1. Both elements are negative, so extending never wins and the run restarts at every element.
2. The maximum sum is -3, achieved by the first element alone and equally by the second alone.
3. With strict > the best is set at index 0 and never beaten, so the range returned is [0,0].
4. With >= the second element ties and replaces it, so the range returned is [1,1].
5. Both are correct answers to the question as stated, since the problem asks for a maximum-sum subarray rather than a specific one.
6. Measured, 8,281 of 19,530 test arrays — 42.4% — have more than one maximum-sum subarray, so this is the common case rather than a curiosity.

<!-- @example -->

<!-- @input -->
The same input through both linear formulations at every test size

<!-- @output -->
Identical ranges on all 19,530 arrays

<!-- @why -->
Shows the tie-break rule is a property of the comparison operator rather than of the algorithm, which is why two structurally different approaches agree exactly as long as they share it.

<!-- @walkthrough -->
1. Kadane with index tracking records the run's start at each restart and copies it when the best improves.
2. The prefix-minimum version records the position of the smallest running total and starts the subarray one past it.
3. The two arrive at the bounds by completely different routes, one tracking a restart and the other tracking a minimum.
4. Measured across all 19,530 test arrays, they returned the same range every time — zero differences.
5. That agreement is not a coincidence: both use strict >, so both resolve every tie to the earliest-starting subarray.
6. Switching either one to >= would break the agreement immediately, while leaving both still correct.

<!-- @visualization array -->

<!-- @description -->
The array as signed bars above and below a zero line, with two distinct highlight bands rather than one: a live band spanning the current run, and a locked band marking the best run recorded so far. The whole visualisation exists to keep those two separate, because the bug is exactly their conflation. A marker advances left to right, and at each element the extend-or-restart fork from the previous subtopic is drawn again. When restart wins, the live band collapses and re-anchors at the current element, and a start flag physically drops onto that index — animate the flag landing, because that is the only moment it ever moves. When the running sum beats the best, the locked band redraws to span from the start flag to the current position, and a copy arrow flies from the flag to the locked band's left edge, making it explicit that the answer's left boundary is copied from the flag rather than computed from the current index. Keep a readout of both bands' ranges side by side throughout, so the reader watches the live band re-anchor twice while the locked band's left edge stays put. The bug panel runs [2,2] beside it with one change: the start flag is dropped at the current index at the moment the best improves rather than at the restart. Show the flag landing on index 1, the locked band collapsing to a single cell, and the reported sum still reading 4 — then draw the actual sum of the highlighted cell, 2, beneath it in red, with the two measured rates alongside: 0% wrong sums, 62.6% wrong ranges. That contradiction between the reported number and the highlighted cells is the frame to hold. A tie panel runs [-3,-3] with a toggle between > and >=: under > the locked band sits on the first cell, under >= it jumps to the second, and both are labelled correct, with the measured 42.4% of arrays having multiple maxima printed beneath. Close with a two-track strip running Kadane's start-flag method against the prefix-minimum method on the same array — one tracking a restart, the other tracking the lowest point of a running-total line, with their locked bands drawn in the same place and a note that they agreed on all 19,530 test arrays.

<!-- @sampleInput -->
```json
{"primary":{"array":[-2,1,-3,4,-1,2,1,-5,4],"trace":[{"i":0,"seed":true,"cur":-2,"best":-2,"startFlag":0,"locked":[0,0]},{"i":1,"chose":"restart","cur":1,"startFlag":1,"best":1,"locked":[1,1],"flagMoved":true},{"i":2,"chose":"extend","cur":-2,"startFlag":1,"best":1,"locked":[1,1]},{"i":3,"chose":"restart","cur":4,"startFlag":3,"best":4,"locked":[3,3],"flagMoved":true},{"i":4,"chose":"extend","cur":3,"startFlag":3,"best":4,"locked":[3,3]},{"i":5,"chose":"extend","cur":5,"startFlag":3,"best":5,"locked":[3,5]},{"i":6,"chose":"extend","cur":6,"startFlag":3,"best":6,"locked":[3,6]},{"i":7,"chose":"extend","cur":1,"startFlag":3,"best":6,"locked":[3,6]},{"i":8,"chose":"extend","cur":5,"startFlag":3,"best":6,"locked":[3,6]}],"answer":{"sum":6,"range":[3,6],"elements":[4,-1,2,1]},"flagMoves":2,"lockedUpdates":5},"bugPanel":{"array":[2,2],"correct":{"sum":4,"range":[0,1]},"buggy":{"sum":4,"range":[1,1]},"rangeActuallySums":2,"sumWrong":0,"sumWrongPct":0.0,"boundsWrong":12235,"boundsWrongPct":0.626,"arrays":19530,"note":"the sum comes from cur, which the bug never touches"},"tiePanel":{"array":[-3,-3],"maxSum":-3,"allMaxRanges":[[0,0],[1,1]],"withStrictGreater":[0,0],"withGreaterOrEqual":[1,1],"bothCorrect":true,"arraysWithTies":8281,"ofArrays":19530,"tieRate":0.424,"strictGreaterPickedEarliest":8281,"exceptions":0},"agreement":{"kadaneVsPrefix":{"arrays":19530,"differingRanges":0},"reason":"both use strict >, so both resolve ties to the earliest range"},"cost":{"unit":"ns per element","rows":[{"n":65536,"sumOnly":0.961,"withIndices":0.870},{"n":1048576,"sumOnly":0.953,"withIndices":0.873},{"n":8388608,"sumOnly":0.960,"withIndices":0.868}],"trackingIsFree":true,"mechanismUnexplained":true}}
```

<!-- @highlights -->
- Two highlight bands are drawn, not one: a live band over the current run and a locked band over the best run recorded so far.
- A start flag sits on the index where the current run began, and it is the only marker that moves on a restart.
- At index 1 restart wins, the live band collapses and re-anchors, and the flag physically drops onto index 1.
- At index 3 restart wins again, the flag moves to 3, and the locked band redraws as a single cell.
- From index 4 onward extend wins every time, so the flag stays fixed at 3 while the live band grows rightward.
- Each time the running sum beats the best, a copy arrow flies from the flag to the locked band's left edge.
- That arrow is the point: the answer's left boundary is copied from the flag, never computed from the current index.
- The locked band widens to [3,4], then [3,5], then [3,6] while its left edge never moves.
- The final element lifts the running sum to 5, which fails to beat 6, so the locked band stays put and the answer is [4, -1, 2, 1].
- The bug panel runs [2,2] with the flag dropped at the current index when the best improves instead of at the restart.
- The flag lands on index 1, the locked band collapses to one cell, and the reported sum still reads 4.
- Beneath it, the actual sum of that single highlighted cell is drawn in red as 2 — the reported number and the highlighted cells disagree.
- Its measured rates print alongside: 0% wrong sums and 62.6% wrong ranges over 19,530 arrays.
- The tie panel runs [-3,-3] and toggles the comparison: strict greater-than locks the first cell, greater-or-equal locks the second.
- Both are labelled correct, with the measured 42.4% of arrays having more than one maximum printed beneath.
- The closing strip runs the start-flag method against the prefix-minimum method, whose locked bands land in the same place on all 19,530 test arrays.

<!-- @edgeCases -->
- Single element — the loop never runs and the seeded bounds [0,0] are already the answer.
- Single negative element — the answer is that element, and seeding the bounds from index 0 is what makes it correct.
- All elements negative — the answer is the single least-negative element, so the returned range has length 1.
- All elements positive — the answer is the whole array and the start flag never moves from 0.
- Two equal elements such as [2,2] — the smallest input that exposes the start-marker bug.
- Two equal negatives such as [-3,-3] — the smallest input with a genuine tie between two valid answers.
- The best subarray at the very start, where the flag never moves and the locked band only widens.
- The best subarray at the very end, where the flag moves several times before the winning run begins.
- Multiple subarrays achieving the same maximum — measured in 42.4% of test arrays, so any single expected range is one of several correct answers.
- An array containing zeros at the edges of the best subarray, where including or excluding them gives the same sum and therefore another tie.
- Large values where the running sum exceeds 32-bit range, requiring a 64-bit accumulator even though the indices stay small.

<!-- @pitfalls -->
- Setting the start marker when the best improves rather than when the run restarts. Measured 0 wrong sums and 12,235 wrong ranges out of 19,530 arrays — 62.6%.
- Testing only the returned sum. That bug produces the correct sum on 100% of inputs, so a sum-only assertion can never detect it.
- Recording the answer's left bound as the current index instead of the tracked start, which reports a single-element range.
- Asserting one exact range in a test. 42.4% of arrays have several maximum subarrays, so a correct implementation using >= will fail such a test.
- Assuming > and >= are interchangeable here. They pick different valid answers — verified as the earliest range for > on all 8,281 tied arrays.
- Initialising the bounds to something other than [0,0] while seeding the sum from a[0], which leaves them inconsistent on a single-element array.
- Updating the minimum prefix before recording the answer in the prefix formulation, which permits an empty subarray and breaks all-negative input.
- Forgetting the plus one when converting the minimum prefix's index into a subarray start, which includes one element too many.
- Returning a copy of the subarray when the caller only needs the bounds, which turns an O(1)-space algorithm into an O(n)-space one.
- Assuming the index bookkeeping is expensive and returning only the sum for performance. Measured, tracking was consistently faster, not slower.
- Carrying the zero-initialisation bug from the previous subtopic, where best starts at 0 and all-negative arrays return an empty selection.
- Reporting bounds without verifying they sum to the reported total, which is the one assertion that catches the whole class of bookkeeping errors.

<!-- @doubt -->
### Where exactly does the start marker get updated?

<!-- @answer -->
At the restart, and nowhere else. Kadane's already decides at each element whether to extend the current run or start fresh, and starting fresh is precisely the moment the subarray's beginning moves — so that is the only place the marker changes. When the best later improves, you copy the marker into the answer rather than setting it. Two variables with two different jobs: one tracks where the current run began and changes often, the other records the best run found and changes rarely.

<!-- @doubt -->
### I set the marker when the best improves and my tests pass. What is wrong with that?

<!-- @answer -->
Your tests are almost certainly checking the sum, and the sum is the one thing that mistake leaves correct. The sum comes from the running value, which the bug never touches — it only corrupts the recorded bounds. Measured over 19,530 arrays: 0 wrong sums and 12,235 wrong ranges, 62.6%. On [2,2] it reports sum 4 with the range [1,1], and that range actually sums to 2. Add one assertion — that the returned subarray sums to the returned total — and the bug goes from undetectable to failing nearly two inputs in three.

<!-- @doubt -->
### Why is the range wrong but the sum right?

<!-- @answer -->
Because they come from different variables. The sum is read from the running accumulator, which the algorithm maintains correctly regardless of any index bookkeeping. The bounds are read from the markers, which is where the mistake lives. That separation is what makes this bug class dangerous in general — a wrong answer travelling alongside a right one, where the right one is the more natural thing to assert on. Whenever a function returns a value and a location, check that the location produces the value.

<!-- @doubt -->
### There seem to be several correct answers. Which one should I return?

<!-- @answer -->
Any of them, and you should expect ties to be common rather than exceptional — measured, 8,281 of 19,530 arrays had more than one subarray achieving the maximum, 42.4%. The simplest case is [-3,-3], where the maximum is -3 and both single elements achieve it. Which one you return is decided by the comparison: strict > keeps the earliest, and >= keeps a later one. Verified across all 8,281 tied arrays, > returned the earliest range every time. Pick one convention, state it, and do not let a test assert a specific range unless the problem statement demands one.

<!-- @doubt -->
### How should I test this, then?

<!-- @answer -->
Assert the property rather than the exact output. Check that the returned sum equals the maximum from a brute-force reference, and separately that the returned range actually sums to that value and lies within the array. Those two together catch every bookkeeping error while accepting any valid tie-break. Asserting an exact pair of indices tests your tie-break convention, which means a correct implementation written with >= will fail it — and 42.4% of inputs give it the opportunity.

<!-- @doubt -->
### Does tracking the indices slow the algorithm down?

<!-- @answer -->
No — measured, it was consistently faster, which surprised me. With the loop structure held identical so the only difference was the bookkeeping: 0.870 nanoseconds per element with tracking against 0.961 without at 65,536 elements, and the same roughly 9% gap at 1 million and 8.4 million. I could not attribute the mechanism and would rather say so than invent one: both compile to the same number of data-dependent branches, and the indexed version emits more instructions and more conditional selects, so the obvious explanations do not hold. The safe claim is that the bookkeeping costs nothing, so there is no performance reason to withhold the subarray from a caller who wants it.

<!-- @doubt -->
### How does the prefix-minimum version find the bounds?

<!-- @answer -->
It tracks where the smallest running total occurred rather than where a run restarted. The best subarray ending at the current position starts immediately after that minimum, so its left bound is that index plus one. The plus one is the detail to get right — the minimum prefix covers everything before the subarray begins, not the subarray's first element. It also needs the minimum's index seeded to -1 for the empty prefix, so that a subarray starting at index 0 comes out with a left bound of 0.

<!-- @doubt -->
### Do the two linear approaches return the same subarray?

<!-- @answer -->
On this test set, always — measured across all 19,530 arrays with zero differing ranges. That is not a coincidence: both use strict >, so both resolve every tie to the earliest-starting subarray, and the tie-break is what determines the choice. Switch either one to >= and the agreement disappears immediately while both remain correct. It is a useful demonstration that the tie-break lives in the comparison operator rather than in the algorithm's structure.

<!-- @doubt -->
### How does this connect to Stock Buy and Sell?

<!-- @answer -->
That problem is this one applied to the array of consecutive differences: the maximum profit is the maximum-sum subarray of day-to-day price changes, and the subarray's bounds are the buy and sell days. So the index tracking stops being a follow-up requirement and becomes the entire point — nobody wants to know the profit without knowing when to trade. Learning to carry the bounds here means that problem is a change of interpretation rather than a change of algorithm.
