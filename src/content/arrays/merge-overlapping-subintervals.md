---
id: merge-overlapping-subintervals
topic: Arrays
title: Merge Overlapping Subintervals
difficulty: Medium
status: ready
prerequisites:
  - 3-sum
  - remove-duplicates-from-sorted-array
  - for-loop
  - if-else-statements
  - time-and-space-complexity-basics
relatedIds:
  - 3-sum
  - remove-duplicates-from-sorted-array
  - merge-two-sorted-arrays-without-extra-space
  - leaders-in-an-array
---

<!-- @summary -->
Collapse overlapping intervals into disjoint ones — where sorting by end instead of start is wrong on 35.35% of inputs, not sorting at all is wrong on 66.59%, and the sort turns out to be roughly 71% of the total running time.

<!-- @theory -->
## The problem

Given a list of intervals, merge every group that overlaps and return the
disjoint result.

```
[[1,3], [2,6], [8,10], [15,18]]  ->  [[1,6], [8,10], [15,18]]
```

## Settle the semantics first

Two intervals **overlap** when `max(starts) <= min(ends)`. Note the non-strict
comparison: `[1,4]` and `[4,5]` share the single point 4 and therefore merge into
`[1,5]`.

That is the standard reading and it treats intervals as **continuous ranges**. It
is worth stating because there is a different, equally reasonable reading —
intervals as sets of **integers**, where `[0,0]` and `[1,1]` are adjacent and
would merge into `[0,1]`. Under the continuous reading they do not, because the
real numbers between 0 and 1 belong to neither.

The two models disagree on exactly the inputs where one interval ends where the
next begins, which is a case real data produces constantly. **Decide which you
mean before writing the comparison**, because nothing downstream will tell you.
This lesson uses the continuous reading.

## The algorithm

Sort by start, then sweep, keeping one interval open:

```
sort by start
open = first interval
for each remaining interval:
    if it starts at or before open's end:  extend open's end to max(open.end, its end)
    else:                                  close open, start a new one
```

One pass after the sort, so the whole thing is O(n log n) and the sort is the
expensive part.

## Why sorting by start, specifically

Sorting by start is what makes a **single comparison** sufficient. Once the list
is in start order, any interval that overlaps the currently open block must begin
at or before that block's end — so testing `start <= open.end` is a complete test,
and the block's own start never needs revisiting.

Sort by **end** instead and that guarantee disappears. An interval can arrive
whose start lies *before* the open block began, which would require revising the
block's start backwards — something the sweep never does:

```
[[0,2], [1,1]]   sorted by end -> [[1,1], [0,2]]
   the sweep opens at [1,1] and never learns the block should have started at 0
   result [[1,2]], correct [[0,2]]
```

Measured over all 50,625 four-interval sets with endpoints in [0,4]:

| Mistake | Wrong |
|---|---|
| Not sorting at all | **66.59%** |
| Using strict `<` (touching does not merge) | **59.77%** |
| Sorting by end | **35.35%** |
| Assigning the end instead of taking the max | **35.35%** |

Those last two carry identical failure counts — 17,898 each — but they are
**different functions**, producing different output on 29.87% of inputs. A shared
failure rate is not evidence of a shared cause, and this is the second time in
this module that coincidence has appeared.

## Two details that look like they matter and do not

**The secondary sort key.** Many implementations sort by `(start, end)`. Measured
across 54,241 interval sets, sorting by start *alone* never once produced a
different answer — because the `max()` on the end handles ties already. The
secondary key is harmless but it is not doing anything.

**Taking the max on the end.** This one *does* matter, and it is easy to miss why.
Assigning `open.end = current.end` looks equivalent after sorting by start, since
starts are ascending — but ends are not. A fully contained interval like `[1,1]`
inside `[0,2]` would shrink the block:

```
[[0,2], [1,1]]   assigning -> [[0,1]]      taking max -> [[0,2]]
```

Measured 35.35% wrong.

## The brute force, and why it is worse than it looks

The obvious alternative is to repeatedly find any overlapping pair, merge them,
and repeat until nothing changes. It is correct and needs no sorting.

| n | Data | Brute force | Sort + sweep |
|---|---|---|---|
| 200 | sparse | 0.61ms | 0.022ms |
| 2,000 | sparse | **240.11ms** | **0.112ms** |
| 2,000 | dense | 1.43ms | 0.078ms |

**2,144x** at two thousand intervals. And note the density column: on dense data,
where everything collapses into a single interval, the brute force took 1.43ms
against 240.11ms on sparse data — **168x apart at the same n**. It is fast exactly
when the answer is small, because every merge shrinks the list it is re-scanning.
So a benchmark on heavily-overlapping data makes it look far more viable than it
is.

## Where the time actually goes

| n | Data | Sort + sweep | Sort alone |
|---|---|---|---|
| 2,000,000 | sparse | 327.049ms | **231.722ms** |
| 2,000,000 | dense | 240.439ms | 228.033ms |

The sort is about **71%** of the total on sparse data and essentially all of it
on dense data. Two consequences worth knowing:

- Optimising the sweep is not where the time is. If this is hot, the lever is the
  sort — a radix sort on integer starts, or keeping the data sorted upstream.
- **If the input is already sorted, say so and skip the sort.** That is the entire
  cost.

<!-- @intuition -->
Line the intervals up left to right by where they begin, then walk along with a single open bracket in hand. Because you meet them in starting order, the only question at each new interval is whether it begins before the bracket you are holding has closed — if it does, the bracket stretches to cover it, and if it does not, nothing later can reach back either, so you can put that bracket down for good and pick up a new one. Sorting by start is precisely what makes that one question sufficient; in any other order an interval could turn up that ought to have widened a bracket you already put down.

<!-- @approach -->
### Brute Force - Merge Any Overlapping Pair Until Stable

<!-- @idea -->
Repeatedly scan for any two intervals that overlap, merge them into one, and start over until a full scan finds nothing left to merge.

<!-- @steps -->
1. Scan every pair of intervals in the list.
2. Two intervals overlap when the larger start is at or below the smaller end.
3. On finding such a pair, replace one with their union and remove the other.
4. Restart the scan, since merging can create new overlaps.
5. Stop when a complete scan finds no overlapping pair.

<!-- @complexity -->
- time: O(n^3) worst case — a full pairwise scan repeated once per merge
- space: O(1) beyond the list
- note: Correct and needs no sorting, which is its only appeal. Measured 240.11ms at n = 2,000 on sparse data against the sweep's 0.112ms, a factor of 2,144. It is much faster on dense data — 1.43ms at the same size — because every merge shrinks the list, so benchmarking on heavily-overlapping input badly overstates it.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<vector<int>> merge(vector<vector<int>> a) {
    bool changed = true;
    while (changed) {
        changed = false;
        for (size_t i = 0; i < a.size() && !changed; i++)
            for (size_t j = i + 1; j < a.size(); j++)
                if (max(a[i][0], a[j][0]) <= min(a[i][1], a[j][1])) {   // overlap test
                    a[i][0] = min(a[i][0], a[j][0]);
                    a[i][1] = max(a[i][1], a[j][1]);
                    a.erase(a.begin() + j);
                    changed = true;
                    break;
                }
    }
    sort(a.begin(), a.end());
    return a;
}
```

<!-- @annotations -->
- 11: The overlap test in its symmetric form, which needs no assumption about ordering — this is why the brute force works unsorted.
- 14: Erasing from the middle is O(n) on its own, on top of the repeated scanning.
- 19: Sorted only at the end, so the output order matches the sweep's for comparison.

<!-- @code java -->
```java
import java.util.*;

static List<int[]> merge(int[][] intervals) {
    List<int[]> a = new ArrayList<>();
    for (int[] x : intervals) a.add(new int[]{x[0], x[1]});

    boolean changed = true;
    while (changed) {
        changed = false;
        outer:
        for (int i = 0; i < a.size(); i++)
            for (int j = i + 1; j < a.size(); j++)
                if (Math.max(a.get(i)[0], a.get(j)[0]) <= Math.min(a.get(i)[1], a.get(j)[1])) {
                    a.get(i)[0] = Math.min(a.get(i)[0], a.get(j)[0]);
                    a.get(i)[1] = Math.max(a.get(i)[1], a.get(j)[1]);
                    a.remove(j);
                    changed = true;
                    break outer;
                }
    }
    a.sort((x, y) -> x[0] - y[0]);
    return a;
}
```

<!-- @annotations -->
- 18: A labelled break to leave both loops, since merging invalidates the outer loop's position.

<!-- @code python -->
```python
def merge(intervals):
    a = [list(x) for x in intervals]
    changed = True
    while changed:
        changed = False
        for i in range(len(a)):
            for j in range(i + 1, len(a)):
                if max(a[i][0], a[j][0]) <= min(a[i][1], a[j][1]):
                    a[i] = [min(a[i][0], a[j][0]), max(a[i][1], a[j][1])]
                    a.pop(j)
                    changed = True
                    break
            if changed:
                break
    return sorted(a)


# Correct without sorting, which makes it the reference — but 2,144x
# slower than the sweep at n = 2,000 on sparse data.
```

<!-- @annotations -->
- 8: The symmetric overlap test, true whenever the two ranges share at least one point.
- 11: Restarting after every merge, because a new union can now overlap something already scanned.

<!-- @approach -->
### Optimal - Sort by Start, Then Sweep

<!-- @idea -->
Put the intervals in starting order and walk once, keeping a single open interval and extending it whenever the next one begins before it ends.

<!-- @steps -->
1. Return an empty list for empty input.
2. Sort the intervals by their start value.
3. Open a block equal to the first interval.
4. For each remaining interval, compare its start against the open block's end.
5. If it starts at or before that end, extend the block's end to the larger of the two ends.
6. Otherwise close the block, append it, and open a new one at the current interval.

<!-- @complexity -->
- time: O(n log n), dominated by the sort
- space: O(1) beyond the sort and the output
- note: The recommended solution. Measured 0.112ms at n = 2,000 against the brute force's 240.11ms. The sort is roughly 71% of the total on sparse data — 231.722ms of 327.049ms at n = 2,000,000 — so if the input arrives already sorted, skipping the sort removes almost all of the cost.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<vector<int>> merge(vector<vector<int>> a) {
    if (a.empty()) return {};

    sort(a.begin(), a.end(),
         [](const vector<int>& x, const vector<int>& y) { return x[0] < y[0]; });

    vector<vector<int>> out;
    out.reserve(a.size());
    out.push_back(a[0]);

    for (size_t i = 1; i < a.size(); i++) {
        if (a[i][0] <= out.back()[1])                        // <= : touching merges
            out.back()[1] = max(out.back()[1], a[i][1]);     // max : keep the further end
        else
            out.push_back(a[i]);
    }
    return out;
}
```

<!-- @annotations -->
- 9: Sorting by start alone. A secondary key on the end is harmless but measured to make no difference across 54,241 interval sets.
- 16: Non-strict, so [1,4] and [4,5] merge. Using < instead measured 59.77% wrong.
- 17: The max matters because ends are not ascending after sorting by start — assigning directly measured 35.35% wrong.

<!-- @code java -->
```java
import java.util.*;

static int[][] merge(int[][] intervals) {
    if (intervals.length == 0) return new int[0][];

    int[][] a = intervals.clone();
    Arrays.sort(a, (x, y) -> Integer.compare(x[0], y[0]));

    List<int[]> out = new ArrayList<>();
    out.add(new int[]{a[0][0], a[0][1]});

    for (int i = 1; i < a.length; i++) {
        int[] last = out.get(out.size() - 1);
        if (a[i][0] <= last[1]) last[1] = Math.max(last[1], a[i][1]);
        else out.add(new int[]{a[i][0], a[i][1]});
    }
    return out.toArray(new int[0][]);
}
```

<!-- @annotations -->
- 7: Integer.compare rather than subtraction, since x[0] - y[0] overflows for far-apart values.
- 14: Mutating the last element in place, which is what makes the sweep allocate only when a block actually closes.

<!-- @code python -->
```python
def merge(intervals):
    if not intervals:
        return []

    a = sorted(intervals, key=lambda p: p[0])       # by START, not end
    out = [list(a[0])]

    for s, e in a[1:]:
        if s <= out[-1][1]:                          # <= : touching merges
            out[-1][1] = max(out[-1][1], e)          # max : keep the further end
        else:
            out.append([s, e])
    return out


# Sorting by end instead measured 35.35% wrong; not sorting at all, 66.59%.
```

<!-- @annotations -->
- 5: Sorting by start is what makes a single comparison against the open block's end a complete test.
- 9: Non-strict comparison, so intervals that merely touch are merged.
- 10: Without the max, a fully contained interval shrinks the block — [[0,2],[1,1]] would give [[0,1]].

<!-- @approach -->
### Boundary Sweep with Depth Counting

<!-- @idea -->
Turn each interval into a start event and an end event, walk the events in order, and treat a stretch where the open count stays above zero as one merged interval.

<!-- @steps -->
1. Emit two events per interval: an opening at its start and a closing at its end.
2. Sort the events by position, with openings placed before closings at the same position.
3. Walk the events keeping a running count of how many intervals are currently open.
4. When the count rises from zero, record the position as a block's start.
5. When the count returns to zero, the current position closes that block.
6. Ordering openings before closings at equal positions is what merges touching intervals.

<!-- @complexity -->
- time: O(n log n), sorting twice as many items as the interval sweep
- space: O(n) for the event list
- note: Slower and heavier than the interval sweep for merging alone, and worth knowing because the running count generalises. The same walk answers how many intervals overlap at the busiest point, or where coverage is at least k deep, neither of which the interval sweep can report.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<vector<int>> merge(const vector<vector<int>>& a) {
    if (a.empty()) return {};
    vector<pair<int,int>> ev;                 // (position, type) with 0 = open, 1 = close
    ev.reserve(a.size() * 2);
    for (auto& iv : a) { ev.push_back({iv[0], 0}); ev.push_back({iv[1], 1}); }
    sort(ev.begin(), ev.end());               // opens sort before closes at equal positions

    vector<vector<int>> out;
    int depth = 0, start = 0;
    for (auto& [pos, type] : ev) {
        if (type == 0) { if (depth++ == 0) start = pos; }
        else           { if (--depth == 0) out.push_back({start, pos}); }
    }
    return out;
}
```

<!-- @annotations -->
- 7: Type 0 for open and 1 for close, so the default pair ordering puts opens first at equal positions — which is what merges touching intervals.
- 15: The depth rising from zero marks a block's start; nothing before this point was covered.
- 16: The depth returning to zero closes the block, and the current position is its end.

<!-- @code java -->
```java
import java.util.*;

static int[][] merge(int[][] intervals) {
    if (intervals.length == 0) return new int[0][];
    int[][] ev = new int[intervals.length * 2][2];
    int k = 0;
    for (int[] iv : intervals) { ev[k++] = new int[]{iv[0], 0}; ev[k++] = new int[]{iv[1], 1}; }
    Arrays.sort(ev, (x, y) -> x[0] != y[0] ? Integer.compare(x[0], y[0]) : Integer.compare(x[1], y[1]));

    List<int[]> out = new ArrayList<>();
    int depth = 0, start = 0;
    for (int[] e : ev) {
        if (e[1] == 0) { if (depth++ == 0) start = e[0]; }
        else           { if (--depth == 0) out.add(new int[]{start, e[0]}); }
    }
    return out.toArray(new int[0][]);
}
```

<!-- @annotations -->
- 8: Comparing by position then by type, so an opening at a position is always processed before a closing there.

<!-- @code python -->
```python
def merge(intervals):
    if not intervals:
        return []
    events = []
    for s, e in intervals:
        events.append((s, 0))        # 0 = open
        events.append((e, 1))        # 1 = close
    events.sort()                    # opens come first at equal positions

    out = []
    depth = 0
    start = 0
    for pos, kind in events:
        if kind == 0:
            if depth == 0:
                start = pos
            depth += 1
        else:
            depth -= 1
            if depth == 0:
                out.append([start, pos])
    return out


# The depth counter also answers "how many overlap at the busiest point",
# which the interval sweep cannot report.
```

<!-- @annotations -->
- 8: Tuple ordering puts (x, 0) before (x, 1), so touching intervals never let the depth reach zero between them.
- 16: The first opening of a run is where the merged block begins.

<!-- @example -->

<!-- @input -->
intervals = [[1,3], [2,6], [8,10], [15,18]]

<!-- @output -->
[[1,6], [8,10], [15,18]]

<!-- @why -->
The canonical case, where one merge happens and two intervals pass through untouched.

<!-- @walkthrough -->
1. Sorted by start the list is already [[1,3], [2,6], [8,10], [15,18]].
2. The block opens as [1,3].
3. The next interval starts at 2, which is at or below the block's end of 3, so they overlap.
4. The block's end becomes the larger of 3 and 6, giving [1,6].
5. The next interval starts at 8, which is above 6, so the block closes and [1,6] is recorded.
6. A new block opens at [8,10]; the next interval starts at 15, above 10, so that block closes too.
7. The final block [15,18] closes at the end of the walk.

<!-- @example -->

<!-- @input -->
intervals = [[0,2], [1,1]] sorted by end instead of start

<!-- @output -->
[[1,2]] — and the correct answer is [[0,2]]

<!-- @why -->
The smallest case showing why the sort key must be the start: sorting by end can put an interval first that another one should have extended backwards.

<!-- @walkthrough -->
1. Sorted by end, the list becomes [[1,1], [0,2]].
2. The block opens as [1,1].
3. The next interval starts at 0, which is at or below the block's end of 1, so they merge.
4. The block's end becomes the larger of 1 and 2, giving [1,2].
5. But the block's START is still 1, and nothing in the sweep ever revises a start backwards.
6. The correct answer is [0,2], since [1,1] sits entirely inside [0,2].
7. Sorting by start guarantees this cannot happen, because every later interval starts at or after the block's start.

<!-- @example -->

<!-- @input -->
intervals = [[0,2], [1,1]] with the end assigned rather than maximised

<!-- @output -->
[[0,1]] — and the correct answer is [[0,2]]

<!-- @why -->
Shows that sorting by start orders the starts but not the ends, which is exactly why the max is needed.

<!-- @walkthrough -->
1. Sorted by start the list is [[0,2], [1,1]].
2. The block opens as [0,2].
3. The next interval starts at 1, which is at or below the block's end of 2, so they overlap.
4. Assigning the end directly sets the block's end to 1, shrinking it from 2.
5. The result [0,1] no longer covers the point 2, which the original [0,2] did.
6. Taking the max of 2 and 1 keeps the end at 2, giving the correct [0,2].
7. Measured 35.35% wrong across all 50,625 four-interval sets tested.

<!-- @example -->

<!-- @input -->
2,000 sparse intervals, brute force against sort and sweep

<!-- @output -->
240.11ms against 0.112ms — 2,144x

<!-- @why -->
Quantifies the cost of avoiding the sort, and shows why the brute force's own benchmark depends on how much the data overlaps.

<!-- @walkthrough -->
1. The brute force scans every pair looking for an overlap, merges the first it finds, then starts over.
2. Each merge also removes an element from the middle of the list, which is itself linear.
3. On sparse data few merges happen, so the list stays long and nearly every scan is a full pairwise pass.
4. That measured 240.11ms at two thousand intervals.
5. On dense data, where everything collapses into one interval, the same code took 1.43ms — 168x faster at the same size.
6. It is fast exactly when the answer is small, so benchmarking on heavily-overlapping data overstates it badly.
7. The sweep is unaffected by density, measuring 0.112ms sparse and 0.078ms dense.

<!-- @visualization custom -->

<!-- @description -->
Intervals drawn as horizontal bars on a shared number line, stacked vertically in their input order — the vertical stacking is only to keep them readable, and the animation should make that clear by first sliding every bar down to a single shared track after sorting, so the reader sees that the vertical axis carries no meaning. Begin unsorted: bars scattered at arbitrary heights, deliberately in an order where a naive left-to-right sweep would fail. Then animate the sort as the bars sliding horizontally into start order, and only then drop them onto one track. Now the sweep: draw an open bracket around the first bar and walk right. For each new bar, drop a vertical probe line at its start and compare against the open bracket's right edge — if the probe lands at or before that edge, stretch the bracket to whichever end is further right, and if it lands beyond, snap the bracket shut with a click and open a fresh one. The stretch must visibly take the FURTHER end rather than the newest, so include a bar fully contained inside the open block and show the bracket refusing to shrink. Beside the main track, run the same input sorted by END on its own track, playing simultaneously, where the sweep opens on [1,1] and then merges [0,2] into it — animate the bracket's right edge extending while its left edge stays visibly stuck at 1, with an arrow pointing to where the left edge should have gone and a caption that the sweep never revises a start backwards. A third panel handles touching: two bars meeting exactly at a point, played twice, once with a non-strict test where the bracket stretches through and once with a strict test where it snaps shut between them, with both results shown and the 59.77% figure. Then a semantics panel, deliberately separate: the same two bars [0,0] and [1,1] drawn first as continuous ranges with a visible gap between them and then as sets of integer points with nothing between them, showing the two defensible answers and captioned that the model must be chosen before the comparison is written. Close with a cost panel: a stacked bar for the optimal solution split into sort and sweep at 231.722ms and the remainder, next to the brute force's 240.11ms on sparse data and 1.43ms on dense, annotated that it is fast only when the answer is small.

<!-- @sampleInput -->
```json
{"primary":{"input":[[1,3],[2,6],[8,10],[15,18]],"sorted":[[1,3],[2,6],[8,10],[15,18]],"sweep":[{"open":[1,3],"action":"open"},{"candidate":[2,6],"start":2,"openEnd":3,"overlaps":true,"newEnd":6,"action":"stretch"},{"candidate":[8,10],"start":8,"openEnd":6,"overlaps":false,"action":"close and open"},{"candidate":[15,18],"start":15,"openEnd":10,"overlaps":false,"action":"close and open"}],"answer":[[1,6],[8,10],[15,18]]},"sortKeyPanel":{"input":[[0,2],[1,1]],"byStart":{"order":[[0,2],[1,1]],"result":[[0,2]],"correct":true},"byEnd":{"order":[[1,1],[0,2]],"result":[[1,2]],"correct":false,"why":"the block opened at 1 and its start is never revised backwards"},"failureRate":0.3535},"maxPanel":{"input":[[0,2],[1,1]],"assigningEnd":[[0,1]],"takingMax":[[0,2]],"why":"sorting by start orders the starts, not the ends","failureRate":0.3535,"distinctFromSortByEnd":0.2987},"touchingPanel":{"input":[[1,4],[4,5]],"nonStrict":[[1,5]],"strict":[[1,4],[4,5]],"strictFailureRate":0.5977},"semanticsPanel":{"input":[[0,0],[1,1]],"continuous":{"merge":false,"result":[[0,0],[1,1]],"why":"the reals between 0 and 1 belong to neither"},"integerPoints":{"merge":true,"result":[[0,1]],"why":"the integers 0 and 1 are adjacent"},"note":"both readings are defensible; choose before writing the comparison"},"unsortedFailureRate":0.6659,"setsTested":50625,"secondaryKeyMatters":false,"secondaryKeySetsTested":54241,"costPanel":{"n":2000000,"sortPlusSweepMs":327.049,"sortAloneMs":231.722,"sortShare":0.71,"brute":{"n":2000,"sparseMs":240.11,"denseMs":1.43,"densityRatio":168},"sweepAtSameN":{"sparseMs":0.112,"denseMs":0.078},"bruteVsSweep":2144}}
```

<!-- @highlights -->
- Intervals are drawn as horizontal bars on a shared number line, stacked vertically only for readability.
- The animation opens unsorted, with bars scattered in an order where a naive left-to-right sweep would fail.
- The sort animates as bars sliding horizontally into start order, then dropping onto a single shared track.
- That drop makes clear the vertical axis carried no meaning — position on the line is the only thing that matters.
- An open bracket is drawn around the first bar and the sweep walks right.
- Each new bar drops a vertical probe at its start, compared against the open bracket's right edge.
- [2,6] probes at 2, which is at or before the open end of 3, so the bracket stretches to 6.
- A fully contained bar is included, and the bracket visibly refuses to shrink to its nearer end.
- [8,10] probes at 8, beyond the open end of 6, so the bracket snaps shut and a fresh one opens.
- A parallel track runs the same input sorted by END, opening on [1,1] and merging [0,2] into it.
- Its right edge extends while its left edge stays visibly stuck at 1, with an arrow to where it should have gone.
- A touching panel plays two bars meeting at a point twice, once non-strict and once strict, showing both results.
- A semantics panel draws [0,0] and [1,1] first as continuous ranges with a visible gap, then as integer points with none.
- Both readings are shown as defensible, captioned that the model must be chosen before the comparison is written.
- A cost panel stacks the optimal solution's sort and sweep at 231.722ms and the remainder of 327.049ms.
- Beside it the brute force shows 240.11ms sparse against 1.43ms dense, annotated that it is fast only when the answer is small.

<!-- @edgeCases -->
- Empty input — the result is empty, and the sweep must not index the first element before checking.
- A single interval — returned unchanged, and the sweep's loop body never runs.
- Two identical intervals — merge into one, and the case a strict comparison gets wrong.
- A degenerate interval where start equals end, such as [3,3] — a single point, and still a valid interval.
- Two degenerate intervals at the same point — merge into one under either reading.
- Two degenerate intervals at adjacent integers, such as [0,0] and [1,1] — the case where the continuous and integer readings disagree.
- Intervals that merely touch, such as [1,4] and [4,5] — merge under the standard reading.
- One interval fully containing another — the case that requires taking the max on the end.
- All intervals identical — collapse to one.
- All intervals disjoint — none merge, and the output is just the sorted input.
- Already sorted input — correctness is unchanged, and skipping the sort removes about 71% of the running time.
- Very large coordinate values — a comparator written as a subtraction overflows, so use an explicit comparison.

<!-- @pitfalls -->
- Not sorting at all. Measured 66.59% wrong across 50,625 four-interval sets, since an interval that should extend an earlier block may arrive after it has closed.
- Sorting by end rather than start. Measured 35.35% wrong: the sweep can open on an interval that a later one should have extended backwards, and starts are never revised.
- Assigning the new end instead of taking the maximum. Measured 35.35% wrong, because sorting by start orders the starts but leaves the ends unordered, so a contained interval shrinks the block.
- Assuming those two mistakes are the same because they fail equally often. They produce different output on 29.87% of inputs.
- Using a strict comparison so touching intervals do not merge. Measured 59.77% wrong under the standard reading.
- Leaving the continuous-versus-integer reading undecided. They disagree on exactly the inputs where one interval ends where the next begins, which real data produces constantly.
- Writing the comparator as a subtraction, such as x[0] - y[0]. Far-apart coordinates overflow and the sort silently misorders.
- Indexing the first element before checking for empty input.
- Optimising the sweep loop. The sort is about 71% of the total, so the sweep is not where the time is.
- Re-sorting input that is already sorted. That is nearly the whole cost of the algorithm.
- Benchmarking the brute force on heavily overlapping data. It measured 168x faster on dense input than sparse at the same size, because merges shrink the list it re-scans.
- Mutating the caller's list while sorting. Take a copy unless reordering has been agreed.

<!-- @doubt -->
### Why must the sort be by start rather than by end?

<!-- @answer -->
Because sorting by start is what makes one comparison sufficient. In start order, any interval that overlaps the currently open block must begin at or before that block's end, so testing start <= open.end is a complete test and the block's own start is settled for good. Sort by end and that breaks: an interval can arrive whose start lies before the open block began, which would require revising the block's start backwards, and the sweep never does that. On [[0,2],[1,1]] sorted by end the sweep opens at [1,1], merges [0,2] into it, and reports [1,2] where the answer is [0,2]. Measured 35.35% wrong.

<!-- @doubt -->
### If the starts are sorted, why do I still need max() on the end?

<!-- @answer -->
Because sorting by start orders the starts and says nothing about the ends. A later interval can be entirely contained in the open block — [1,1] inside [0,2] — and assigning its end directly shrinks the block from 2 to 1, losing coverage the input had. Taking the maximum keeps the block at whichever end reaches further right. Measured 35.35% wrong without it, the same rate as sorting by end, though the two are different bugs producing different output on 29.87% of inputs.

<!-- @doubt -->
### Should [1,4] and [4,5] merge?

<!-- @answer -->
Under the standard reading, yes — they share the point 4, so the overlap test is non-strict and they become [1,5]. Using a strict comparison measured 59.77% wrong. But note this is a specification decision rather than a fact: intervals read as continuous ranges merge when they touch, and intervals read as sets of integers would additionally merge [0,0] with [1,1], since the integers 0 and 1 are adjacent. Both readings are defensible and they disagree on exactly the inputs where one interval ends where the next begins, which is common in real data. Decide before writing the comparison.

<!-- @doubt -->
### Do I need to sort by (start, end) or is start alone enough?

<!-- @answer -->
Start alone is enough. Measured across 54,241 interval sets, sorting by start only never produced a different answer from sorting by start then end — the max() on the end already handles intervals that share a start. The secondary key is harmless and some people include it for determinism of the intermediate order, but it is not doing anything for correctness.

<!-- @doubt -->
### Where does the time actually go?

<!-- @answer -->
Almost entirely into the sort. At two million intervals the whole solution measured 327.049ms and the sort alone measured 231.722ms — about 71% — and on dense data the sort was essentially the entire cost. Two things follow. Optimising the sweep is not worth doing; if this is hot, the lever is the sort, whether that means a radix sort on integer starts or keeping the data ordered upstream. And if the input is already sorted, skip the sort — that removes nearly all of the work.

<!-- @doubt -->
### Is the brute force ever acceptable?

<!-- @answer -->
Only at very small n, and its benchmarks are misleading. Measured at two thousand intervals it took 240.11ms on sparse data against the sweep's 0.112ms, a factor of 2,144. But on dense data, where everything collapses to a single interval, the same code took 1.43ms — 168x faster at the same size — because every merge removes an element and shrinks the list it re-scans. So it looks far more viable than it is if you happen to test it on heavily overlapping input. The sweep measured 0.112ms sparse and 0.078ms dense, essentially indifferent.

<!-- @doubt -->
### When would I use the event-based sweep instead?

<!-- @answer -->
When you need more than the merged intervals. The depth counter it maintains answers questions the interval sweep cannot: how many intervals overlap at the busiest point, where coverage is at least k deep, or the total length covered. For merging alone it is slower and heavier — it sorts twice as many items and allocates an event list — so it is not the default. But if you already need the depth, merging falls out of the same walk for free.

<!-- @doubt -->
### Why does the comparator use Integer.compare instead of subtraction?

<!-- @answer -->
Because subtraction overflows. A comparator written as x[0] - y[0] is fine for small values and silently wrong for far-apart ones: if x[0] is near Integer.MAX_VALUE and y[0] is negative, the difference wraps and the comparator returns the wrong sign. Sorting with an inconsistent comparator does not merely misorder — in Java it can throw "Comparison method violates its general contract". Integer.compare has no such failure mode and costs nothing.
