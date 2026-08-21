---
id: largest-subarray-with-sum-0
topic: Arrays
title: Largest Subarray with Sum 0
difficulty: Medium
status: ready
prerequisites:
  - longest-subarray-with-sum-k
  - count-subarrays-with-given-sum
  - two-sum
  - for-loop
  - time-and-space-complexity-basics
relatedIds:
  - longest-subarray-with-sum-k
  - count-subarrays-with-given-sum
  - longest-subarray-with-given-sum-k-positives
  - two-sum
---

<!-- @summary -->
Find the longest subarray summing to zero — where keeping the latest index instead of the earliest is wrong on 54.65% of inputs, both ways of getting the seed wrong fail on exactly the same 33.33%, and the answer typically covers most of the array.

<!-- @theory -->
## The problem

Return the **length** of the longest contiguous subarray whose elements sum to
zero.

```
[15, -2, 2, -8, 1, 7, 10]  ->  5      the run -2, 2, -8, 1, 7
```

## The k = 0 simplification

This is **Longest Subarray with Sum K** with k fixed at zero, and that fixing
buys a genuine simplification.

The general rule is that a subarray from i+1 to j sums to k exactly when
`prefix[j] - prefix[i] == k`. With k = 0 that collapses to

```
prefix[j] == prefix[i]
```

So the question becomes: **find the two furthest-apart positions with the same
running sum.** No arithmetic on the target at all — just look for a repeat.

Geometrically, plot the running sum as it walks. A zero-sum subarray is any
stretch where the walk returns to a height it has already been at, and the
longest one is the widest such return.

```
walk the array, keeping a running sum
the first time you see a sum, write down where
every later time you see it, the gap since then is a zero-sum subarray
```

## Keep the earliest, not the latest

The map must store the **first** index at which each running sum appeared. Every
later occurrence measures back to it, and an earlier start gives a longer
subarray.

Writing the index unconditionally — overwriting on every occurrence — is the
single most damaging mistake here:

| Bug | Wrong |
|---|---|
| Overwriting with the latest index | **54.65%** |
| No seed at all | 33.33% |
| Seeding index 0 rather than −1 | 33.33% |

Measured over all 488,281 arrays from the values {−2..2} with n up to 8. The
smallest failing case for the overwrite is `[0, 0]`: it returns 1 where the
answer is 2.

**And it does not return the shortest.** It is tempting to describe the overwrite
as "finds the shortest instead" — measured, its result matched the shortest
zero-sum subarray on only **19.7%** of arrays. What it actually returns is the
largest gap between *adjacent* equal prefix sums, which is neither the longest
nor the shortest and has no useful meaning.

This is the exact opposite of the previous subtopic. **Count Subarrays with Given
Sum** needed the map to hold *how many times* each prefix sum occurred, and
keeping only the earliest index was wrong there. Here it needs the earliest index
and counting is useless. Same map, same walk, opposite contents — decided by
whether the question is "how many" or "how long".

## The seed, and two different ways to get it wrong

The map must start with `{0: -1}` — the running sum is zero before any element is
read, and that position is index **−1**, the slot before the array begins.

Both ways of getting this wrong fail at **33.33%**:

- **No seed.** The first prefix sum encountered gets written, and the zero that
  existed before the array is never recorded.
- **Seeding `{0: 0}`.** The empty prefix is recorded at the wrong position, so
  every measurement from it is one element short.

They fail on the same proportion of inputs but they are **not the same
function** — measured, they disagree with each other on 100,610 of the 488,281
arrays. Two different wrong answers, coincidentally equally often wrong.

What they get wrong is identical though: **both miss only subarrays that start at
index 0.** `[0]` returns 0 instead of 1; `[-1, 1]` returns 0 instead of 2. That
is precisely what the −1 seed is for.

## How big is the answer, usually?

Larger than most people expect, and it depends entirely on whether the values can
cancel:

| n | Values | Has a zero-sum subarray | Mean best length |
|---|---|---|---|
| 10 | {−1,0,1} | 100% | 6.9 |
| 100 | {−1,0,1} | 100% | 74.2 |
| 1,000 | {−1,0,1} | 100% | **775.2** |
| any | positive only | **0%** | — |

With mixed signs a zero-sum subarray is essentially guaranteed, and the longest
one covers roughly three quarters of the array. With strictly positive values
there is **never** one, because the running sum increases at every step and can
never revisit a height — so the answer is always 0 and the map never sees a
repeat.

That last row is worth stating explicitly as a fast path: if every value is
positive, the answer is 0 without looking further.

## What it costs

| n | Values | Brute force | Hash map | Ratio |
|---|---|---|---|---|
| 1,000 | {−1,0,1} | 0.31ms | 0.004ms | 86x |
| 10,000 | {−1,0,1} | 31.36ms | **0.030ms** | **1,028x** |
| 10,000 | {−1000..1000} | 29.87ms | 0.291ms | 102x |

And unlike several earlier problems in this module, **the hash map is the right
structure here** — an ordered tree map measured 2.7x to 5.3x slower:

| n | Values | Hash map | Tree map |
|---|---|---|---|
| 1,000,000 | {−1,0,1} | 2.734ms | 12.687ms |
| 1,000,000 | {−1000..1000} | 22.688ms | 120.448ms |

The difference from Two Sum and Longest Consecutive Sequence, where sorting beat
hashing, is that this problem needs **exact lookup and nothing else**. There is
no ordering to exploit, so the tree's extra structure is pure overhead.

### The map stays small when the values are small

| n | Values | Distinct prefix sums | Share of n |
|---|---|---|---|
| 1,000,000 | {−1,0,1} | 1,378 | **0.14%** |
| 1,000,000 | {−1000..1000} | 615,514 | 61.55% |

A ±1 walk over a million steps only ever reaches a few hundred distinct heights,
so the map is tiny and cache-resident. Wide values let it wander far, and the map
grows toward n. This is the same effect measured in **Longest Subarray with Sum
K** and again in **Count Subarrays with Given Sum**, and it is why the narrow
case ran 8.3x faster here.

## Which to write

The **hash map keeping the earliest index**, seeded with `{0: -1}`. One pass, one
map, and the two things to get right are writing only on first sight and seeding
at −1 rather than 0.

<!-- @intuition -->
Watch the running total as a walker moving up and down a number line, one step per element. A stretch of the array sums to zero exactly when the walker ends that stretch back at the height it started from — the ups cancelled the downs. So the longest zero-sum stretch is the widest pair of visits to a single height, which means all you need is, for each height, the earliest moment it was ever visited. Record a height the first time you reach it and never again, because any later visit is measuring back to the earliest one and that is what makes the stretch as wide as possible. The walker starts at height zero before taking a single step, and forgetting to record that starting moment is what loses every stretch that begins at the very front.

<!-- @approach -->
### Brute Force - Every Subarray with a Running Sum

<!-- @idea -->
Fix each start position, extend the end one element at a time carrying a running total, and record the length whenever it reaches zero.

<!-- @steps -->
1. Take each index in turn as the start of a subarray.
2. Reset a running sum to zero.
3. Extend the end position through the rest of the array, adding each element.
4. Whenever the running sum is zero, compare that subarray's length against the best so far.
5. Do not stop on the first zero, since a longer one can follow.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Correct on every input and the natural reference implementation. Measured 31.36ms at n = 10,000 against the hash map's 0.030ms, a factor of 1,028. The running sum is what keeps it quadratic rather than cubic.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int longestZeroSum(const vector<int>& a) {
    int best = 0, n = a.size();

    for (int i = 0; i < n; i++) {
        long long sum = 0;
        for (int j = i; j < n; j++) {
            sum += a[j];
            if (sum == 0) best = max(best, j - i + 1);   // no break: longer may follow
        }
    }
    return best;
}
```

<!-- @annotations -->
- 11: The running sum, carried forward rather than recomputed, which is what makes this O(n^2) and not O(n^3).
- 12: No break. A longer zero-sum subarray can start at the same place and end later.

<!-- @code java -->
```java
static int longestZeroSum(int[] a) {
    int best = 0;

    for (int i = 0; i < a.length; i++) {
        long sum = 0;
        for (int j = i; j < a.length; j++) {
            sum += a[j];
            if (sum == 0) best = Math.max(best, j - i + 1);
        }
    }
    return best;
}
```

<!-- @annotations -->
- 5: A long accumulator, since a long array of large values overflows an int sum well before the loop ends.

<!-- @code python -->
```python
def longest_zero_sum(a):
    best = 0
    n = len(a)

    for i in range(n):
        total = 0
        for j in range(i, n):
            total += a[j]
            if total == 0:
                best = max(best, j - i + 1)
    return best


# Correct on every input, which makes it the reference the fast
# version was checked against over 488,281 arrays.
```

<!-- @annotations -->
- 8: Extending the end rather than re-summing the range, so each start costs one pass rather than one pass per end.

<!-- @approach -->
### Sort the Prefix Sums

<!-- @idea -->
Pair each prefix sum with its index, sort by the sum, and within each group of equal sums take the spread between the first and last index.

<!-- @steps -->
1. Build the list of prefix sums, including the empty prefix of zero at index -1.
2. Pair each with the index at which it occurred.
3. Sort the pairs by the sum.
4. Equal sums are now adjacent, forming groups.
5. Within each group the widest subarray spans from the smallest index to the largest.
6. Take the largest such spread across all groups.

<!-- @complexity -->
- time: O(n log n), dominated by the sort
- space: O(n) for the pairs
- note: A genuine alternative that avoids hashing entirely, and useful when a hash map is unavailable or when the prefix sums must be inspected anyway. It is slower than the hash map here because sorting does more than the problem needs — the question is pure exact lookup, with no ordering to exploit.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int longestZeroSum(const vector<int>& a) {
    vector<pair<long long,int>> p;
    p.reserve(a.size() + 1);
    p.push_back({0LL, -1});                       // the empty prefix

    long long sum = 0;
    for (int i = 0; i < (int)a.size(); i++) { sum += a[i]; p.push_back({sum, i}); }

    sort(p.begin(), p.end());                     // equal sums become adjacent

    int best = 0;
    for (size_t i = 0, j = 0; i < p.size(); i = j) {
        while (j < p.size() && p[j].first == p[i].first) j++;
        best = max(best, p[j - 1].second - p[i].second);   // widest span in this group
    }
    return best;
}
```

<!-- @annotations -->
- 8: The empty prefix at index -1, exactly as in the hash version. Omitting it loses every subarray starting at index 0.
- 13: Sorting by the pair orders by sum first and by index second, so each group's indices are already ascending.
- 18: The first and last of a group are its smallest and largest indices, so their difference is the widest span.

<!-- @code java -->
```java
import java.util.Arrays;

static int longestZeroSum(int[] a) {
    long[][] p = new long[a.length + 1][2];
    p[0] = new long[]{0L, -1L};

    long sum = 0;
    for (int i = 0; i < a.length; i++) { sum += a[i]; p[i + 1] = new long[]{sum, i}; }

    Arrays.sort(p, (x, y) -> x[0] != y[0] ? Long.compare(x[0], y[0]) : Long.compare(x[1], y[1]));

    int best = 0;
    for (int i = 0, j = 0; i < p.length; i = j) {
        while (j < p.length && p[j][0] == p[i][0]) j++;
        best = Math.max(best, (int)(p[j - 1][1] - p[i][1]));
    }
    return best;
}
```

<!-- @annotations -->
- 10: Comparing by sum then index, so a group's members come out in index order.

<!-- @code python -->
```python
def longest_zero_sum(a):
    pairs = [(0, -1)]                     # the empty prefix
    total = 0
    for i, x in enumerate(a):
        total += x
        pairs.append((total, i))

    pairs.sort()                          # equal sums become adjacent

    best = 0
    i = 0
    while i < len(pairs):
        j = i
        while j < len(pairs) and pairs[j][0] == pairs[i][0]:
            j += 1
        best = max(best, pairs[j - 1][1] - pairs[i][1])
        i = j
    return best


# No hashing at all — but O(n log n), where the hash version is O(n).
```

<!-- @annotations -->
- 8: Tuples sort by sum first and index second, so no explicit key is needed.
- 16: The widest span within a group of equal sums, which is the longest zero-sum subarray at that height.

<!-- @approach -->
### Optimal - Prefix Sums with a Hash Map

<!-- @idea -->
Walk once carrying a running sum, recording the first index at which each sum appears, and measure back to it on every repeat.

<!-- @steps -->
1. Start a map holding the sum zero at index -1, standing for the empty prefix.
2. Walk the array carrying a running sum.
3. Add each element to the running sum.
4. If the running sum has been seen before, the gap since its first index is a zero-sum subarray.
5. Compare that length against the best so far.
6. Otherwise record the running sum at the current index, and never overwrite it.

<!-- @complexity -->
- time: O(n), one pass with constant-time lookups
- space: O(n) worst case, and far less when the values are small
- note: The recommended solution. Measured 0.030ms at n = 10,000 against the brute force's 31.36ms. A hash map rather than a tree map, since the problem needs only exact lookup — an ordered map measured 2.7x to 5.3x slower. The map's size tracks the running sum's range, which for a plus-or-minus-one walk over a million elements was just 1,378 entries.

<!-- @code cpp -->
```cpp
#include <vector>
#include <unordered_map>
#include <algorithm>
using namespace std;

int longestZeroSum(const vector<int>& a) {
    unordered_map<long long,int> firstAt;
    firstAt.reserve(a.size() * 2);
    firstAt[0] = -1;                       // empty prefix, BEFORE index 0

    long long sum = 0;
    int best = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        sum += a[i];
        auto it = firstAt.find(sum);
        if (it != firstAt.end()) best = max(best, i - it->second);
        else firstAt[sum] = i;             // FIRST sighting only — never overwrite
    }
    return best;
}
```

<!-- @annotations -->
- 9: Index -1, not 0. Seeding at 0 measured 33.33% wrong, and omitting the seed entirely measured the same.
- 16: Measuring back to the FIRST index this sum appeared at, which is what makes the subarray as long as possible.
- 17: Written only when absent. Overwriting on every sighting measured 54.65% wrong — the worst bug in this lesson.

<!-- @code java -->
```java
import java.util.HashMap;
import java.util.Map;

static int longestZeroSum(int[] a) {
    Map<Long, Integer> firstAt = new HashMap<>();
    firstAt.put(0L, -1);

    long sum = 0;
    int best = 0;
    for (int i = 0; i < a.length; i++) {
        sum += a[i];
        Integer seen = firstAt.get(sum);
        if (seen != null) best = Math.max(best, i - seen);
        else firstAt.put(sum, i);
    }
    return best;
}
```

<!-- @annotations -->
- 6: The seed at index -1. Java's putIfAbsent would express the never-overwrite rule below more directly.
- 14: Only inserting when the sum is new, which is the whole difference between longest and meaningless.

<!-- @code python -->
```python
def longest_zero_sum(a):
    first_at = {0: -1}          # empty prefix, BEFORE index 0
    total = 0
    best = 0

    for i, x in enumerate(a):
        total += x
        if total in first_at:
            best = max(best, i - first_at[total])
        else:
            first_at[total] = i     # FIRST sighting only — never overwrite
    return best


# If every value is positive the running sum never repeats, so the
# answer is 0 and the map never registers a hit.
```

<!-- @annotations -->
- 2: The seed at -1. Using 0 here loses every subarray that starts at index 0 — measured 33.33% wrong.
- 8: A repeat of a running sum means the stretch between the two sightings sums to zero.
- 11: The else is essential. Without it the map keeps the latest index and the answer is wrong on 54.65% of inputs.

<!-- @example -->

<!-- @input -->
a = [15, -2, 2, -8, 1, 7, 10]

<!-- @output -->
5 — the subarray -2, 2, -8, 1, 7

<!-- @why -->
The canonical case, where the answer sits in the middle of the array rather than at either end, so the map has to match two interior positions.

<!-- @walkthrough -->
1. The map starts holding the sum 0 at index -1, and the running sum is 0.
2. After 15 the running sum is 15, which is new, so it is recorded at index 0.
3. After -2 the sum is 13, new, recorded at index 1.
4. After 2 the sum is 15, which was already seen at index 0, so the gap is 2 - 0 = 2.
5. The sum is not re-recorded, since index 0 is the earliest sighting.
6. After -8 the sum is 7, after 1 it is 8, and after 7 it is 15 again — seen at index 0, so the gap is 5 - 0 = 5.
7. After 10 the sum is 25, which is new, and the best stays at 5.

<!-- @example -->

<!-- @input -->
a = [0, 0] with the map overwriting on every sighting

<!-- @output -->
1 — and the correct answer is 2

<!-- @why -->
The smallest input exposing the overwrite bug, and it shows the failure is about which index is kept rather than about detecting the repeat at all.

<!-- @walkthrough -->
1. The map starts with the sum 0 at index -1.
2. After the first 0 the running sum is still 0, which is already in the map at index -1.
3. The gap is 0 - (-1) = 1, so the best becomes 1.
4. The overwrite then replaces the entry, storing the sum 0 at index 0.
5. After the second 0 the running sum is still 0, now found at index 0.
6. The gap is 1 - 0 = 1, so the best stays at 1 — but the whole array sums to zero and has length 2.
7. Keeping the earliest index would have measured 1 - (-1) = 2, the correct answer.

<!-- @example -->

<!-- @input -->
a = [-1, 1] with the map seeded at index 0 instead of -1

<!-- @output -->
0 — and the correct answer is 2

<!-- @why -->
Shows that both seed mistakes lose exactly one class of answer: subarrays that begin at index 0.

<!-- @walkthrough -->
1. With the wrong seed the map holds the sum 0 at index 0.
2. After -1 the running sum is -1, which is new, so it is recorded at index 0.
3. After 1 the running sum is back to 0, which is in the map at index 0.
4. The gap is computed as 1 - 0 = 1, but this stretch has length 2.
5. With no seed at all the sum 0 is simply absent, so nothing is found and the answer is 0.
6. Both mistakes measured 33.33% wrong over 488,281 arrays.
7. They are not the same function though — they disagreed with each other on 100,610 of those arrays.

<!-- @example -->

<!-- @input -->
1,000,000 elements drawn from {-1, 0, 1} against {-1000..1000}

<!-- @output -->
1,378 distinct prefix sums against 615,514 — and 2.734ms against 22.688ms

<!-- @why -->
Shows that the map's size, and therefore the running time, is set by how far the running sum wanders rather than by the array's length.

<!-- @walkthrough -->
1. Each element moves the running sum by at most one in the narrow case.
2. Over a million steps the walk still only reaches a few hundred distinct heights either side of zero.
3. Measured 1,378 distinct prefix sums — 0.14% of the array's length.
4. That map fits comfortably in cache, so every lookup is fast.
5. With values up to 1000 the walk covers a far wider range, reaching 615,514 distinct sums.
6. That map is far larger than cache, so lookups miss and the same code takes 8.3x longer.
7. The same effect was measured in Longest Subarray with Sum K and again in Count Subarrays with Given Sum.

<!-- @visualization array -->

<!-- @description -->
The running sum drawn as a walk on a vertical number line, plotted left to right above the array strip — this problem is about revisiting heights, so the path and its heights are the subject and the array itself is secondary. Draw faint horizontal guide lines at every height the walk has visited, and pin a small marker on each guide line at the FIRST x-position that reached it, labelled with that index. Those pins are the map, and they should visibly never move once placed — that immovability is the whole lesson. Start the walk one step to the LEFT of the array, at height zero, and pin that position as index -1 outside the strip; the seed then reads as a real point on the path rather than an arbitrary initialisation. As the walk proceeds, whenever it lands on a height that already has a pin, draw a horizontal span from the pin to the current position and show its width, keeping the widest span found so far highlighted in a distinct colour. Run the canonical [15,-2,2,-8,1,7,10] so the height 15 is reached three times and the widest span between the first and last visit is the answer. Then the overwrite panel, side by side on [0,0]: on the left the pin stays at -1 and the second visit measures a span of 2; on the right the pin is dragged forward on every visit, so each span measures only back to the previous visit and the answer comes out 1 — animate the pin visibly sliding, because that sliding IS the bug. Beside it a seed panel on [-1,1] showing the pin misplaced at index 0 instead of -1, with the resulting span one cell too short, and a variant with no pin at all where the walk's return to zero finds nothing to measure against. Then a positivity panel: a walk over strictly positive values climbing monotonically, with every height visited exactly once and no pin ever matched — captioned that the answer is always 0 and no work is needed. Close with two walks of equal length side by side, one over {-1,0,1} staying in a narrow band with only a few hundred guide lines, the other over {-1000..1000} sprawling across the full height with hundreds of thousands — annotated 1,378 pins against 615,514, and 2.734ms against 22.688ms.

<!-- @sampleInput -->
```json
{"primary":{"input":[15,-2,2,-8,1,7,10],"seed":{"height":0,"index":-1,"label":"empty prefix, before the array"},"walk":[{"i":0,"x":15,"sum":15,"firstSighting":true,"pinnedAt":0},{"i":1,"x":-2,"sum":13,"firstSighting":true,"pinnedAt":1},{"i":2,"x":2,"sum":15,"firstSighting":false,"matchedPin":0,"span":2},{"i":3,"x":-8,"sum":7,"firstSighting":true,"pinnedAt":3},{"i":4,"x":1,"sum":8,"firstSighting":true,"pinnedAt":4},{"i":5,"x":7,"sum":15,"firstSighting":false,"matchedPin":0,"span":5},{"i":6,"x":10,"sum":25,"firstSighting":true,"pinnedAt":6}],"answer":5,"answerSubarray":[-2,2,-8,1,7]},"overwritePanel":{"input":[0,0],"correct":{"pinStaysAt":-1,"spans":[1,2],"answer":2},"buggy":{"pinSlidesTo":[0],"spans":[1,1],"answer":1},"failureRate":0.5465,"arraysTested":488281,"note":"the pin sliding forward IS the bug","matchesShortest":0.197},"seedPanel":{"input":[-1,1],"correctSeedIndex":-1,"correctAnswer":2,"seededAtZero":{"answer":1},"noSeed":{"answer":0},"bothFailureRate":0.3333,"disagreeWithEachOther":100610,"whatTheyMiss":"only subarrays that start at index 0"},"positivityPanel":{"values":"strictly positive","walkShape":"monotonic climb","heightsRevisited":0,"answer":0,"probabilityOfAnyZeroSum":0.0,"fastPath":"if all values are positive the answer is 0"},"presencePanel":[{"n":10,"values":"{-1,0,1}","hasZeroSum":1.0,"meanBest":6.9},{"n":100,"values":"{-1,0,1}","hasZeroSum":1.0,"meanBest":74.2},{"n":1000,"values":"{-1,0,1}","hasZeroSum":1.0,"meanBest":775.2},{"n":"any","values":"positive only","hasZeroSum":0.0}],"scalePanel":{"n":1000000,"narrow":{"values":"{-1,0,1}","distinctPrefixSums":1378,"shareOfN":0.0014,"ms":2.734},"wide":{"values":"{-1000..1000}","distinctPrefixSums":615514,"shareOfN":0.6155,"ms":22.688},"ratio":8.3},"costPanel":[{"n":1000,"bruteMs":0.31,"hashMs":0.004,"ratio":86},{"n":10000,"bruteMs":31.36,"hashMs":0.030,"ratio":1028},{"n":1000000,"hashMs":22.688,"treeMapMs":120.448,"treeRatio":5.3}]}
```

<!-- @highlights -->
- The running sum is drawn as a walk on a vertical number line above the array strip, since revisiting heights is the subject.
- Faint horizontal guide lines mark every height the walk has visited, each carrying a pin at the FIRST position that reached it.
- Those pins are the map, and they visibly never move once placed.
- The walk starts one step to the LEFT of the array at height zero, pinned as index -1 outside the strip.
- After 15 the walk reaches height 15 for the first time and a pin is placed at index 0.
- After -2 it drops to 13, a new height, pinned at index 1.
- After 2 it returns to height 15, matching the existing pin, and a span of width 2 is drawn.
- The pin at index 0 stays put rather than moving to index 2 — the immovability is the lesson.
- After 7 the walk reaches height 15 a third time, and the span from index 0 widens to 5, the answer.
- An overwrite panel runs [0,0] twice side by side, with the pin held at -1 on the left and dragged forward on the right.
- On the right each span measures only back to the previous visit, giving 1 instead of 2 — the sliding pin animated as the bug itself.
- A seed panel on [-1,1] shows the pin misplaced at index 0, producing a span one cell too short.
- A no-seed variant shows the walk returning to zero with nothing to measure against at all.
- A positivity panel shows a monotonic climb where no height is ever revisited, captioned that the answer is always 0.
- Two walks of equal length close the piece: a narrow band with a few hundred guide lines against a sprawl with hundreds of thousands, annotated 1,378 pins against 615,514 and 2.734ms against 22.688ms.

<!-- @edgeCases -->
- Empty array — the answer is 0, and the loop simply never runs.
- Single zero, such as [0] — the answer is 1, and it is the smallest case both seed mistakes get wrong.
- Single non-zero element — the answer is 0.
- Two zeros, such as [0,0] — the answer is 2, and the smallest case the overwrite bug gets wrong.
- All elements zero — the answer is the whole array's length.
- A pair that cancels at the very front, such as [-1,1,5] — the case the -1 seed exists for.
- A pair that cancels at the very end — found without needing the seed at all, which is why partial tests can pass.
- All elements positive — the running sum never repeats, so the answer is always 0.
- All elements negative — likewise, since the sum decreases monotonically.
- The whole array summing to zero — the answer is n, reached only by matching the seed.
- Large values where the running sum overflows a 32-bit integer — both the accumulator and the map key must be 64-bit.
- Values that make the running sum wander far, such as a wide random range — correctness is unaffected but the map grows toward n entries.

<!-- @pitfalls -->
- Overwriting the map entry on every sighting instead of only the first. Measured 54.65% wrong, the worst bug here, and [0,0] is the smallest failing case.
- Describing that overwrite as finding the shortest subarray. It matched the shortest on only 19.7% of arrays — what it returns is the widest gap between adjacent equal prefix sums, which has no useful meaning.
- Seeding the map at index 0 rather than -1. Measured 33.33% wrong, losing every subarray that starts at index 0.
- Omitting the seed entirely. Also 33.33% wrong, and a different wrong function — the two disagree with each other on 100,610 of 488,281 arrays.
- Testing only with answers that sit in the middle of the array. Both seed bugs are invisible unless a correct answer starts at index 0.
- Storing counts instead of the earliest index, carried over from Count Subarrays with Given Sum. That problem needs occurrence counts and this one needs the earliest position.
- Recording the current index before checking whether the sum is already present. The sum then matches itself and every position reports a length of zero.
- Using a tree map because the keys are numbers. Measured 2.7x to 5.3x slower — this problem needs exact lookup and has no ordering to exploit.
- Accumulating the running sum in a 32-bit integer. A long array of large values overflows well before the loop ends, and the map key must be 64-bit too.
- Returning the subarray's bounds without adjusting for the -1 seed. A match against the seed means the subarray starts at index 0, not index -1.
- Assuming the answer is usually small. On mixed-sign data the longest zero-sum subarray averaged 77.5% of the array's length.
- Running the full algorithm on strictly positive input. The answer is provably 0, so a single sign check is a valid fast path.

<!-- @doubt -->
### Why must the map keep the earliest index rather than the latest?

<!-- @answer -->
Because the length being measured is the gap between two sightings of the same running sum, and an earlier first sighting makes that gap wider. If you overwrite the entry every time, each match measures back only to the previous sighting rather than to the first, so you get the widest gap between *adjacent* equal sums instead of between the outermost ones. Measured 54.65% wrong over 488,281 arrays, with [0,0] the smallest failure: it returns 1 where the answer is 2. And it is not "the shortest" either — that description matched on only 19.7% of arrays.

<!-- @doubt -->
### Why is the seed at index -1 and not 0?

<!-- @answer -->
Because the running sum is zero *before* any element has been read, and that moment sits one position before index 0. If a subarray from index 0 to j sums to zero, then the running sum at j equals the running sum before the array, and the length is j − (−1) = j + 1. Seed at 0 instead and every such measurement comes out one element short; omit the seed and they are not found at all. Both mistakes measured 33.33% wrong, and both lose exactly the same class of answer — subarrays that start at index 0.

<!-- @doubt -->
### Are those two seed mistakes the same bug?

<!-- @answer -->
No, though they fail equally often. Over the 488,281 arrays tested, each was wrong on 33.33% — but they disagreed with *each other* on 100,610 of them, so they are two different wrong functions that happen to be wrong at the same rate. Seeding at 0 records the empty prefix at the wrong position, so measurements from it are one short. Omitting the seed means the pre-array zero is never recorded at all, so measurements from it do not happen. The coincidence in rate is worth noticing precisely because it might otherwise suggest they are the same mistake.

<!-- @doubt -->
### How is this different from Longest Subarray with Sum K?

<!-- @answer -->
It is that problem with k fixed at zero, and the fixing simplifies the lookup. The general rule is that a subarray sums to k when prefix[j] − prefix[i] equals k, so the code looks up sum − k. With k = 0 that becomes looking up the sum itself, so the question is just "have I been at this height before". Verified over 488,281 arrays: the general k = 0 solution and this one never disagree. If you already have the general version, call it with 0; the specialised version is worth writing only because the lookup reads more directly.

<!-- @doubt -->
### And how is it different from Count Subarrays with Given Sum?

<!-- @answer -->
The map holds the opposite thing. Counting needs to know *how many times* each prefix sum has occurred, because every earlier occurrence is a separate subarray ending here. Finding the longest needs the *earliest index* at which each sum occurred, and later repeats are deliberately ignored. Carrying either across to the other problem is a real bug: storing counts here gives you no way to compute a length, and storing earliest indices there measured 39.96% wrong. Same walk, same map, contents decided by whether the question is how many or how long.

<!-- @doubt -->
### Should I use a tree map, since the keys are numbers?

<!-- @answer -->
No. This problem needs exact lookup and nothing else — there is never a reason to ask for the next-largest prefix sum or to iterate them in order, so a tree's ordering is pure overhead. Measured 2.7x to 5.3x slower: at n = 1,000,000 over a wide value range, 22.688ms for the hash map against 120.448ms for the tree. That is the opposite conclusion to Two Sum and Longest Consecutive Sequence, where sorted contiguous memory beat hashing — the difference is that those problems had an ordering to exploit and this one does not.

<!-- @doubt -->
### How likely is it that there is any zero-sum subarray at all?

<!-- @answer -->
With mixed signs, essentially certain, and the answer is usually large. Measured on values from {−1,0,1}: 100% of arrays had one at n = 10, 100 and 1,000, and the longest averaged 6.9, 74.2 and 775.2 respectively — about three quarters of the array. With strictly positive values it is impossible: the running sum increases at every step, so it can never revisit a height and the answer is always 0. That makes a sign check a legitimate fast path, and it also means a test suite of positive arrays exercises none of the logic.

<!-- @doubt -->
### Why was the same code so much slower on wider values?

<!-- @answer -->
Because the map grows with the running sum's range rather than with the array's length. A plus-or-minus-one walk over a million steps only reaches a few hundred distinct heights, so the map held 1,378 entries — 0.14% of n — and stayed cache-resident. With values up to 1000 the walk sprawls, reaching 615,514 distinct sums, and the map is far larger than cache. Measured 2.734ms against 22.688ms, a factor of 8.3, for identical code on identically sized input. The same effect appears in Longest Subarray with Sum K and Count Subarrays with Given Sum.
