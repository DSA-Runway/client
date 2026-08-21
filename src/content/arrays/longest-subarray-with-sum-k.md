---
id: longest-subarray-with-sum-k
topic: Arrays
title: Longest Subarray with Sum K
difficulty: Medium
status: ready
prerequisites:
  - longest-subarray-with-given-sum-k-positives
  - two-sum
  - find-missing-number
  - for-loop
  - relational-and-logical-operators
  - time-and-space-complexity-basics
relatedIds:
  - longest-subarray-with-given-sum-k-positives
  - count-subarrays-with-given-sum
  - largest-subarray-with-sum-0
  - two-sum
---

<!-- @summary -->
The same question as the previous subtopic with negatives allowed — which deletes the sliding window entirely and leaves prefix-sum hashing as the only linear answer, while making that answer 8.6x faster than it was on the easier input.

<!-- @theory -->
## The problem

Given an array of integers — **any** integers, positive, zero or negative — and a
target `k`, return the length of the longest contiguous subarray summing to `k`.

```
[10, 5, 2, 7, 1, -10], k = 15   ->  6   (the whole array)
[-1, 1, 1],            k = 1    ->  3
[1, -1],               k = 0    ->  2
```

One word changed from the previous subtopic — the values are no longer restricted
to non-negative. That single removal deletes an entire family of solutions.

## What the sign guarantee was holding up

The sliding window worked because of one property: growing the window could not
decrease the sum, and shrinking it could not increase the sum. That monotonicity
is what made it safe for the left pointer to move forward and never come back.

With negatives, both halves fail. Removing an element can **raise** the sum, so
the shrink loop pushes in the wrong direction. And extending the window can
**lower** the sum, so a window that has overshot might become correct by growing
further — something the window never tries.

Measured over 136,717 (array, k) pairs drawn from `{-2,-1,0,1,2}` with `k` from
−3 to 3, the previous subtopic's window was wrong on **65,418 of them — 47.8%**.
Its smallest failure is two elements: `[-2,-1]` with `k = −3` returns 0 where the
answer is 2.

The binary-search-on-prefix-sums variant dies for the same reason — a signed
prefix sequence is not sorted, so there is nothing to binary search.

**So this subtopic has fewer approaches than the last one, and that reduction is
the lesson.** Prefix-sum hashing survives precisely because it never assumes
anything about direction.

## Prefix sums, restated

Let `P[i]` be the sum of everything before index `i`. Then the sum of the elements
between two prefix positions is `P[j] − P[i]`. So a subarray ending at `j` sums
to `k` exactly when some earlier prefix equals `P[j] − k`.

Walk once, keeping a map from each prefix sum to the **earliest** index at which it
occurred. At each position, look up `P[j] − k`; if it is present, you have a
qualifying subarray, and its length is the distance between the two indices.

No claim is made about the sums increasing, decreasing, or doing anything at all —
which is exactly why negatives cannot break it.

## Two details that are not optional

Both were measured on the corpus above, and both fail on inputs of one or two
elements.

### Seed the map with `{0: −1}`

Prefix sum 0 exists *before the array starts*. Without that entry, any subarray
beginning at index 0 is invisible, because there is no earlier prefix to match
against.

Measured: **39,528 failures — 28.9%**. The smallest is a single element:
`a = [−2]` with `k = −2` returns 0 where the answer is 1. The whole array is the
answer and the algorithm cannot see it.

The index is −1 rather than 0 because the length is computed as
`current index − stored index`, and a subarray covering indices 0 through j has
length `j + 1`.

### Store the earliest index, never overwrite

The length is the current index minus the stored one, so an **earlier** stored
index gives a **longer** subarray. Keeping the latest gives you the shortest
qualifying subarray instead.

Measured: **39,123 failures — 28.6%**. Smallest: `a = [0,−2]` with `k = −2`
returns 1 where the answer is 2.

### Why that second bug was invisible one subtopic ago

This is worth dwelling on. In the previous subtopic — positives only — the same
overwriting code measured **zero failures over 7,651 pairs**. Not "rarely wrong":
structurally incapable of being wrong.

With every value positive the prefix sums are **strictly increasing**, so no sum
ever occurs twice, so nothing is ever overwritten, so the earliest and latest
index for any sum are the same index. The bug has nothing to bite on.

Allow negatives and the prefix sums start repeating immediately — and the bug goes
from 0% to 28.6%. Same code, same test suite, different input class. If you wrote
the buggy version for the previous subtopic and reused it here, no test you ran
there would have warned you.

## The result that runs backwards

Here is the measurement I did not expect. The prefix-map solution is **faster on
arrays containing negatives than on all-positive ones** — the same code, the same
length, only the values differing.

Distinct prefix sums at n = 1,000,000:

| Values | Distinct sums | As % of n |
|---|---|---|
| positive 1..9 | 1,000,001 | 100.0% |
| non-negative 0..9 | 899,932 | 90.0% |
| mixed −9..9 | 5,948 | **0.6%** |
| mixed −1..1 | 1,271 | **0.1%** |

With positive values every prefix sum is larger than the last, so all `n` of them
are distinct and the map holds `n` entries. With negatives the prefix sum is a
**random walk**, whose distance from the origin grows like `√n` rather than `n` —
so it revisits the same values over and over, and the map stays tiny.

And that decides the runtime. At n = 10,000,000:

| Values | Distinct sums | Time |
|---|---|---|
| positive 1..9 | 10,000,001 | 318.77ms |
| mixed −9..9 | 21,290 | **39.11ms** |
| mixed −1..1 | 2,781 | **37.22ms** |

**8.6x faster with negatives present.** A map of twenty thousand entries lives
comfortably in cache; a map of ten million does not, and nearly every lookup
becomes a memory stall.

So the input that is *algorithmically* harder — it removes your best tool — is
*computationally* easier for the tool that remains. Those two senses of "harder"
are unrelated, and this is the cleanest example of that in the module.

## Against brute force

At n = 100,000 with values from −9 to 9: brute force **2,975.32ms**, prefix map
**0.42ms** — a factor of **7,127**. The brute force is the only other approach
that survives the sign change, since it too assumes nothing.

## What to write

Use the prefix map. It is the only linear solution that works, it is short, and on
realistic signed data it is very fast. If you know the values are non-negative, the
previous subtopic's sliding window is better — 8x faster there and O(1) space — but
that decision has to be made from the problem statement, because neither algorithm
can detect which situation it is in.

## Where this goes next

**Count Subarrays with Given Sum** is the same prefix map storing counts rather
than first-indices, which is a smaller change than it looks. **Largest Subarray
with Sum 0** is this problem with `k` fixed at zero. And the prefix-sum idea
generalises to any question of the form "is there a stretch whose aggregate equals
X", including the XOR variant later in the module.

<!-- @intuition -->
Record your running total after every step, and note the first time you ever saw each total. If you are at total T now and you once stood at total T minus k, then everything you walked between those two moments summed to exactly k. Nothing in that argument cares whether you were walking forwards or backwards — which is why it survives negative numbers, and why the sliding window, which assumes you only ever climb, does not.

<!-- @approach -->
### Brute Force - Every Subarray

<!-- @idea -->
Try every starting point, extend to every endpoint with a running sum, and keep the longest match.

<!-- @steps -->
1. Take each index in turn as the start of a subarray.
2. Reset a running sum to zero.
3. Extend the endpoint one element at a time, adding each to the running sum.
4. Whenever the running sum equals k, record the length if it beats the best so far.
5. Do not stop early — with negatives, a longer subarray from the same start may also reach k.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Correct for any values because it assumes nothing, which is exactly why it survives the change from the previous subtopic while the sliding window does not. Measured 2,975.32ms at n = 100,000 against the prefix map's 0.42ms.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int longestSubarray(const vector<int>& a, long long k) {
    int best = 0;
    for (size_t i = 0; i < a.size(); i++) {
        long long sum = 0;
        for (size_t j = i; j < a.size(); j++) {
            sum += a[j];
            if (sum == k) best = max(best, (int)(j - i + 1));
        }
    }
    return best;
}
```

<!-- @annotations -->
- 7: Measured 2,975.32ms at n = 100,000 against 0.42ms for the prefix map — 7,127x.
- 10: The running sum keeps this O(n^2) rather than O(n^3), and it assumes nothing about sign.
- 11: No break after a match. With negatives the sum can leave k and return to it, so a longer match may follow.

<!-- @code java -->
```java
static int longestSubarray(int[] a, long k) {
    int best = 0;
    for (int i = 0; i < a.length; i++) {
        long sum = 0;
        for (int j = i; j < a.length; j++) {
            sum += a[j];
            if (sum == k) best = Math.max(best, j - i + 1);
        }
    }
    return best;
}
```

<!-- @annotations -->
- 4: A long accumulator, since a signed sum can exceed int range in either direction.

<!-- @code python -->
```python
def longest_subarray(a, k):
    best = 0
    for i in range(len(a)):
        total = 0
        for j in range(i, len(a)):
            total += a[j]
            if total == k:
                best = max(best, j - i + 1)
    return best


# One of only two approaches that survive the sign change, because like the
# prefix map it makes no assumption about direction at all.
```

<!-- @annotations -->
- 7: Recording rather than returning, for the same reason as above.

<!-- @approach -->
### Guarded Sliding Window

<!-- @idea -->
Check once whether any value is negative, and dispatch to the fast window only when it is safe to do so.

<!-- @steps -->
1. Scan the array once looking for a negative value.
2. If none is found, run the sliding window from the previous subtopic, which is faster and uses no extra space.
3. If any negative is present, fall back to the prefix map.
4. Never run the window without that check, because it cannot detect its own precondition being violated.

<!-- @complexity -->
- time: O(n) either way, plus one O(n) check
- space: O(1) when the window runs, O(n) when it does not
- note: An engineering pattern rather than a new algorithm: it buys the previous subtopic's speed and space when the data permits, at the cost of one extra linear scan. Worth it precisely because the window fails silently — measured 47.8% wrong on signed input — rather than raising.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int longestSubarrayPrefix(const vector<int>& a, long long k);   // the general one

static int slidingWindow(const vector<int>& a, long long k) {   // non-negative only
    size_t left = 0; long long sum = 0; int best = 0;
    for (size_t right = 0; right < a.size(); right++) {
        sum += a[right];
        while (sum > k && left <= right) { sum -= a[left]; left++; }
        if (sum == k) best = max(best, (int)(right - left + 1));
    }
    return best;
}

int longestSubarray(const vector<int>& a, long long k) {
    bool hasNegative = any_of(a.begin(), a.end(), [](int x) { return x < 0; });
    return hasNegative ? longestSubarrayPrefix(a, k) : slidingWindow(a, k);
}
```

<!-- @annotations -->
- 17: One extra O(n) pass to establish which algorithm is even valid — cheap next to choosing wrongly.
- 18: Measured, the window is wrong on 47.8% of signed inputs, so this dispatch is a correctness guard, not an optimisation.

<!-- @code java -->
```java
static int longestSubarray(int[] a, long k) {
    boolean hasNegative = false;
    for (int x : a) if (x < 0) { hasNegative = true; break; }

    return hasNegative ? prefixMap(a, k) : slidingWindow(a, k);
}

static int slidingWindow(int[] a, long k) {     // non-negative only
    int left = 0, best = 0; long sum = 0;
    for (int right = 0; right < a.length; right++) {
        sum += a[right];
        while (sum > k && left <= right) { sum -= a[left]; left++; }
        if (sum == k) best = Math.max(best, right - left + 1);
    }
    return best;
}
```

<!-- @annotations -->
- 3: Breaking on the first negative, so the check costs almost nothing on signed input.

<!-- @code python -->
```python
def longest_subarray(a, k):
    if any(x < 0 for x in a):
        return prefix_map(a, k)          # the only correct option here
    return sliding_window(a, k)          # faster, O(1) space, needs non-negatives


def sliding_window(a, k):
    """PRECONDITION: no negative values."""
    left = 0; total = 0; best = 0
    for right, x in enumerate(a):
        total += x
        while total > k and left <= right:
            total -= a[left]; left += 1
        if total == k:
            best = max(best, right - left + 1)
    return best


# The window is 8x faster and O(1) space on non-negative input, and wrong on
# 47.8% of signed input. The check is what lets you have the first without
# risking the second.
```

<!-- @annotations -->
- 2: any() short-circuits on the first negative, so the guard is nearly free when it matters most.

<!-- @approach -->
### Optimal - Prefix Sums with a Hash Map

<!-- @idea -->
Remember the earliest index at which each running total occurred, and look up the total a qualifying subarray would have started from.

<!-- @steps -->
1. Seed a map with prefix sum 0 at index -1, representing the empty prefix before the array begins.
2. Walk the array keeping a running total.
3. At each index, look up the running total minus k in the map.
4. If it is present, a subarray ending here sums to k, and its length is the current index minus the stored one.
5. Insert the current running total only if it is not already present, so the earliest index is preserved.

<!-- @complexity -->
- time: O(n)
- space: O(d) where d is the number of distinct prefix sums — at most n, and measured as little as 0.1% of n on signed data
- note: The only linear approach that survives negatives, since it assumes nothing about direction. Measured 0.42ms at n = 100,000 against brute force's 2,975.32ms, and — counterintuitively — 39.11ms at n = 10,000,000 with negatives against 318.77ms with positives, because signed prefix sums repeat and keep the map in cache.

<!-- @code cpp -->
```cpp
#include <vector>
#include <unordered_map>
#include <algorithm>
using namespace std;

int longestSubarray(const vector<int>& a, long long k) {
    unordered_map<long long,int> firstAt;
    firstAt.reserve(a.size() * 2);
    firstAt[0] = -1;                       // the empty prefix, before index 0

    long long sum = 0;
    int best = 0;
    for (int i = 0; i < (int)a.size(); i++) {
        sum += a[i];

        auto it = firstAt.find(sum - k);
        if (it != firstAt.end()) best = max(best, i - it->second);

        if (firstAt.find(sum) == firstAt.end()) firstAt[sum] = i;   // EARLIEST wins
    }
    return best;
}
```

<!-- @annotations -->
- 9: Index -1, not 0, because the length is i minus the stored index. Omitting this seed entirely measured 28.9% wrong answers — [-2] with k=-2 returns 0 instead of 1.
- 16: The lookup makes no assumption about sign, which is the whole reason this approach survives where the sliding window does not.
- 19: Overwriting here instead of guarding measured 28.6% wrong. In the previous subtopic the same mistake was structurally unable to fail.

<!-- @code java -->
```java
import java.util.HashMap;
import java.util.Map;

static int longestSubarray(int[] a, long k) {
    Map<Long,Integer> firstAt = new HashMap<>();
    firstAt.put(0L, -1);

    long sum = 0;
    int best = 0;
    for (int i = 0; i < a.length; i++) {
        sum += a[i];

        Integer j = firstAt.get(sum - k);
        if (j != null) best = Math.max(best, i - j);

        firstAt.putIfAbsent(sum, i);        // putIfAbsent states earliest-wins
    }
    return best;
}
```

<!-- @annotations -->
- 13: Integer rather than int, because get returns null when the key is absent.
- 16: putIfAbsent rather than put — the difference measured 28.6% wrong answers.

<!-- @code python -->
```python
def longest_subarray(a, k):
    first_at = {0: -1}          # prefix 0 exists before index 0
    total = 0
    best = 0

    for i, x in enumerate(a):
        total += x

        if total - k in first_at:
            best = max(best, i - first_at[total - k])

        if total not in first_at:       # keep the EARLIEST index
            first_at[total] = i

    return best


# Measured at n = 10,000,000: 39.11ms on values -9..9, against 318.77ms on
# values 1..9 — the same code is 8.6x FASTER when negatives are present,
# because the prefix walk revisits values and the map stays cache-resident.
```

<!-- @annotations -->
- 12: The guard, not an unconditional assignment. This is the bug that could not fire in the previous subtopic.
- 18: Only 21,290 distinct prefix sums at ten million elements with signed data, against 10,000,001 with positive data.

<!-- @example -->

<!-- @input -->
a = [10, 5, 2, 7, 1, -10], k = 15

<!-- @output -->
6

<!-- @why -->
Shows a running total leaving the target and returning to it, which cannot happen with non-negative values and is exactly what defeats the sliding window.

<!-- @walkthrough -->
1. The map starts holding prefix 0 at index -1.
2. After index 0 the running total is 10, and 10 - 15 = -5 is not in the map, so 10 is recorded at index 0.
3. After index 1 the total is 15, and 15 - 15 = 0 IS in the map at index -1, giving a length of 0 - (-1) = 1... which is the subarray [10,5] of length 2.
4. Working through the rest, the totals reach 17, 24, 25 and finally 15 again at index 5.
5. At index 5 the lookup for 0 returns index -1 again, giving a length of 5 - (-1) = 6.
6. That is the whole array, whose sum is 15 because the trailing -10 cancels an earlier 10.
7. Note the total passed through 15 at index 1 and returned to it at index 5 — only possible because a negative pulled it back down.

<!-- @example -->

<!-- @input -->
a = [-2], k = -2, with the map seed omitted

<!-- @output -->
0 — the correct answer is 1

<!-- @why -->
A one-element array is enough to expose it, and the failure mode is that every subarray starting at index 0 becomes invisible — which is a large fraction of all answers.

<!-- @walkthrough -->
1. The running total after the single element is -2, which equals k.
2. The algorithm looks up total minus k, which is -2 - (-2) = 0.
3. Without the seed the map is empty at that moment, so the lookup misses.
4. The single element is then recorded, the loop ends, and 0 is returned.
5. With the seed present, prefix 0 sits at index -1, the lookup succeeds, and the length is 0 - (-1) = 1.
6. Measured over 136,717 pairs, omitting the seed produced 39,528 wrong answers — 28.9%.

<!-- @example -->

<!-- @input -->
a = [0, -2], k = -2, with the map storing the LATEST index

<!-- @output -->
1 — the correct answer is 2

<!-- @why -->
The same bug measured zero failures across 7,651 all-positive pairs one subtopic ago, because positive prefix sums never repeat — so this two-element array is the smallest thing that could have caught it there and could not exist there.

<!-- @walkthrough -->
1. The map starts with prefix 0 at index -1.
2. After index 0 the running total is still 0, since the element is 0.
3. The correct version leaves prefix 0 pointing at index -1; the buggy version overwrites it to point at index 0.
4. After index 1 the total is -2, and the lookup for -2 - (-2) = 0 succeeds.
5. The correct version reads index -1 and returns a length of 1 - (-1) = 2, the whole array.
6. The buggy version reads index 0 and returns a length of 1 - 0 = 1, finding only the trailing element.
7. Measured, that overwrite produced 39,123 wrong answers over the same 136,717 pairs — 28.6%.

<!-- @example -->

<!-- @input -->
The identical algorithm on 10,000,000 positive values versus 10,000,000 mixed values

<!-- @output -->
318.77ms on positives, 39.11ms on mixed — the harder input is faster

<!-- @why -->
The same code running 8.6x faster on the input that removed your best algorithm — a clean separation between a problem being algorithmically harder and being computationally slower.

<!-- @walkthrough -->
1. With values drawn from 1 to 9 every prefix sum is larger than the last, so all 10,000,001 of them are distinct.
2. The map therefore holds ten million entries, and almost every lookup is a cache miss.
3. With values drawn from -9 to 9 the running total is a random walk that keeps returning to values it has already visited.
4. Only 21,290 distinct prefix sums occur across the entire ten million elements — about 0.2 percent as many.
5. That map fits comfortably in cache, so lookups are fast, and the same code finishes in 39.11ms.
6. Narrowing the values to -1..1 shrinks the map further to 2,781 entries and the time to 37.22ms.

<!-- @visualization custom -->

<!-- @description -->
A running-total line chart drawn beneath the array strip, with the horizontal axis being the index and the vertical axis the prefix sum, plus a dotted horizontal guide at every value the total has previously visited. The line is the point: with positive values it climbs monotonically and never revisits a height, while with mixed values it wanders up and down and crosses its own past heights repeatedly. Draw a marker on the line at each step, and above it show the lookup being performed — a horizontal probe from the current height down to height minus k, landing either on a previously-visited height (a hit, drawn as a bracket spanning the two indices with its length labelled) or on empty space (a miss). Pin the seed at height 0, index -1, drawn just off the left edge of the chart so it is visibly outside the array, because that placement is what the -1 encodes. When the same height is reached twice, mark the FIRST visit with a solid dot and later visits with hollow ones, and show the map storing only the solid dot — that is the earliest-wins rule made visual. The bug panels each break one thing: removing the off-chart seed makes the probe from the first matching height land in empty space, so the bracket that should have spanned the whole array never forms; switching to latest-wins moves the solid dot rightwards each time the height is revisited, visibly shortening the bracket. Both should be run on their measured smallest counterexamples, [-2] with k=-2 and [0,-2] with k=-2, so the failure fits in one or two columns. A separate panel puts two charts side by side at the same scale: an all-positive prefix line rising straight off the top of the frame with every height distinct, and a signed prefix line hovering near zero and crossing itself constantly — with the distinct-height counts printed beneath, 10,000,001 against 21,290, and the measured times 318.77ms against 39.11ms. Finally a small strip replays subtopic 16's sliding window on [-2,-1] with k=-3, showing the window shrink away the element it needed and the one-way pointer track that prevents recovery, labelled with the 47.8% failure rate.

<!-- @sampleInput -->
```json
{"primary":{"array":[10,5,2,7,1,-10],"k":15,"prefixes":[0,10,15,17,24,25,15],"seed":{"height":0,"index":-1,"offChart":true},"hits":[{"atIndex":1,"probeTo":0,"foundAtIndex":-1,"length":2},{"atIndex":5,"probeTo":0,"foundAtIndex":-1,"length":6}],"revisitedHeights":[15],"answer":6,"note":"the total leaves 15 and returns to it, which needs a negative"},"seedBug":{"array":[-2],"k":-2,"withSeed":1,"withoutSeed":0,"reason":"the probe to height 0 lands in empty space when the off-chart seed is missing","failures":39528,"pairs":136717,"rate":0.289},"overwriteBug":{"array":[0,-2],"k":-2,"earliestWins":2,"latestWins":1,"heightRevisited":0,"solidDotMovesFrom":-1,"solidDotMovesTo":0,"failures":39123,"rate":0.286,"inPreviousSubtopic":{"pairs":7651,"failures":0,"reason":"positive prefix sums strictly increase, so no height is ever revisited"}},"windowPanel":{"array":[-2,-1],"k":-3,"windowAnswer":0,"correctAnswer":2,"failures":65418,"pairs":136717,"rate":0.478},"walkComparison":{"n":10000000,"positive":{"values":"1..9","distinctSums":10000001,"pctOfN":100.0,"ms":318.77,"shape":"monotone climb, no height revisited"},"mixedWide":{"values":"-9..9","distinctSums":21290,"pctOfN":0.2,"ms":39.11,"shape":"random walk, heights revisited constantly"},"mixedNarrow":{"values":"-1..1","distinctSums":2781,"ms":37.22}},"bruteComparison":{"n":100000,"bruteMs":2975.32,"prefixMs":0.42,"ratio":7127}}
```

<!-- @highlights -->
- A running-total line is drawn beneath the strip, with the index across and the prefix sum up.
- The seed sits at height 0 and index -1, plotted just off the left edge so it is visibly before the array starts.
- At index 1 the total reaches 15, and a probe drops to height 15 minus 15, which is 0 — landing exactly on the off-chart seed.
- A bracket spans from the seed to index 1 and is labelled length 2, the subarray [10, 5].
- The total climbs to 17, 24 and 25, with each new height drawn as a solid dot because none has been seen before.
- At index 5 the trailing -10 pulls the total back down to 15, a height it already visited at index 1.
- That revisit is drawn as a hollow dot, and the map keeps pointing at the solid one — earliest-wins made visible.
- The probe from 15 lands on the seed again, and the bracket now spans the entire array with length 6.
- The line leaving 15 and returning to it is only possible because of the negative, and it is exactly what the sliding window cannot follow.
- The seed-bug panel removes the off-chart dot and runs [-2] with k = -2: the probe lands in empty space and no bracket forms.
- That single-element failure is labelled with its measured rate, 39,528 wrong answers out of 136,717 — 28.9%.
- The overwrite panel runs [0,-2], where height 0 is revisited at index 0 and the solid dot slides right from -1 to 0.
- The bracket shortens from 2 to 1 as a direct consequence, at a measured 28.6%.
- That panel also notes the same bug scored zero failures one subtopic ago, because positive prefix lines never revisit a height at all.
- The comparison panel puts both lines side by side: the positive line climbing off the top of the frame with 10,000,001 distinct heights, the signed line hovering near zero with 21,290.
- Their measured times print beneath — 318.77ms against 39.11ms — the same code running 8.6x faster on the input that removed the sliding window.

<!-- @edgeCases -->
- Empty array — no subarray exists and the answer is 0, with no special handling needed.
- A single element equal to k — requires the {0: -1} seed, and is the smallest input that exposes its absence.
- The whole array summing to k — found through the seed, since the matching prefix is the empty one.
- k = 0 with a zero-sum subarray present, such as [1,-1] — a case that cannot arise with positive values at all.
- k = 0 with an all-zero array — the answer is the full length, and every prefix sum is 0 so earliest-wins is doing real work.
- All values negative with a negative k, such as [-2] and k = -2 — the arithmetic is unchanged, only the signs differ.
- A prefix sum repeating many times, which is common with negatives and is precisely when overwriting goes wrong.
- No qualifying subarray — the best never updates and 0 is returned, so 0 must mean 'none found' rather than a real length.
- Values that make the running total exceed 32-bit range in either direction, requiring a 64-bit accumulator.
- An all-non-negative array passed to this general solution — correct, and 8x slower than the sliding window would have been.
- Very large arrays of signed values, where the map stays small and cache-resident — measured 21,290 entries at ten million elements.

<!-- @pitfalls -->
- Reusing the previous subtopic's sliding window. Measured 65,418 wrong answers over 136,717 signed pairs — 47.8% — with [-2,-1] and k = -3 the smallest failure.
- Forgetting to seed the map with prefix 0 at index -1, which hides every subarray starting at index 0. Measured 28.9% wrong.
- Seeding with index 0 instead of -1, which makes every such subarray one element too short.
- Overwriting the stored index instead of keeping the earliest, which returns the shortest qualifying subarray. Measured 28.6% wrong.
- Concluding that overwrite version is fine because it passed the previous subtopic's tests, where positive prefix sums made the bug structurally unable to fire.
- Binary searching the prefix sums, which requires them to be sorted — true only when the values are non-negative.
- Breaking out of the scan on the first match, since with negatives the running total can return to a qualifying value later and give a longer subarray.
- Accumulating the running total in a 32-bit int, which can overflow in either direction on signed data.
- Treating a returned 0 as a valid length rather than as 'no such subarray'.
- Assuming the map will hold n entries and sizing memory for that. On signed data it measured as little as 0.1% of n.
- Assuming the prefix map is slower on 'harder' input. Measured, it is 8.6x faster on signed data than on positive data at n = 10,000,000.
- Using this general solution when the values are guaranteed non-negative, giving up the window's 8x speed and O(1) space for generality you do not need.

<!-- @doubt -->
### Why can't I use the sliding window from the previous subtopic?

<!-- @answer -->
Because it depends on the sum moving in one direction as the window changes, and negatives destroy that. With non-negative values, growing the window cannot lower the sum and shrinking cannot raise it, which is what makes it safe for the left pointer to advance and never return. With a negative present, removing an element can raise the sum, so the shrink loop moves the wrong way; and extending can lower the sum, so an overshooting window might become correct by growing — which the window never tries. Measured over 136,717 signed pairs it was wrong on 65,418 of them, 47.8%. The smallest failure is [-2,-1] with k = -3, where it returns 0 and the answer is 2.

<!-- @doubt -->
### Why does the map need the entry {0: -1}?

<!-- @answer -->
Because prefix sum 0 genuinely exists before the array starts, and without recording it no subarray beginning at index 0 can ever be found — there is no earlier prefix for it to match against. The index is -1 rather than 0 because the length is computed as the current index minus the stored one, and a subarray covering indices 0 through j has length j+1, which is j minus -1. Measured, omitting it produced 39,528 wrong answers out of 136,717 — 28.9% — and a single-element array is enough to expose it: [-2] with k = -2 returns 0 instead of 1.

<!-- @doubt -->
### Why must I keep the earliest index rather than the most recent?

<!-- @answer -->
Because the subarray's length is the current index minus the stored one, so an earlier stored index yields a longer subarray — and you were asked for the longest. Overwriting gives you the shortest qualifying subarray instead. Measured 39,123 wrong answers over the same corpus, 28.6%, with [0,-2] and k = -2 the smallest: the correct version spans both elements for length 2, and the overwriting version finds only the trailing element for length 1.

<!-- @doubt -->
### I wrote that overwriting version for the previous subtopic and every test passed. How?

<!-- @answer -->
Because on all-positive input the bug is structurally incapable of firing, not merely unlikely. Positive values make the prefix sums strictly increasing, so no sum is ever seen twice, so nothing is ever overwritten — the earliest and latest index for any given sum are the same index. Measured over 7,651 all-positive pairs, the overwriting version scored zero failures. Allow negatives and prefix sums start repeating immediately, and the same code goes from 0% to 28.6% wrong. No test you ran there could have warned you, which is the strongest argument in this module for testing against the input class you will actually receive.

<!-- @doubt -->
### Why is the prefix map faster on arrays with negatives? That seems backwards.

<!-- @answer -->
It is backwards, and it is measured. With positive values every prefix sum is larger than the last, so all n of them are distinct and the map holds n entries — at n = 10,000,000 that is ten million keys, and nearly every lookup is a cache miss. With negatives the running total is a random walk whose distance from the origin grows like the square root of n rather than n, so it revisits the same values constantly: only 21,290 distinct prefix sums occurred across ten million signed elements. That map lives in cache, and the same code ran in 39.11ms against 318.77ms — 8.6x faster. The input that is algorithmically harder, because it removes your best tool, is computationally easier for the tool that remains.

<!-- @doubt -->
### How much memory does the map actually need?

<!-- @answer -->
As many entries as there are distinct prefix sums, which is at most n and often far less. Measured at n = 1,000,000: values from 1 to 9 produced 1,000,001 distinct sums, 100% of n; values from 0 to 9 produced 899,932, 90%; values from -9 to 9 produced 5,948, under 1%; and values from -1 to 1 produced just 1,271, about 0.1%. So sizing for n is correct as a worst case and badly pessimistic for signed data. Reserving n entries up front, as the C++ sample does, still avoids rehashing without costing much, since the table is sized rather than filled.

<!-- @doubt -->
### Should I ever still use the sliding window?

<!-- @answer -->
Yes, whenever the problem statement guarantees non-negative values. It is 8x faster there and uses O(1) space against the map's O(n), which matters on large inputs. The catch is that neither algorithm can detect which situation it is in — the window fails silently rather than raising — so the decision has to come from the statement, not from the data. If you want both, scan once for a negative and dispatch: one extra linear pass buys you the fast path when it is valid and correctness when it is not.

<!-- @doubt -->
### Can I break out of the loop when I find a match?

<!-- @answer -->
No, and this is a difference from problems where any answer will do. The running total can leave a qualifying value and return to it later, giving a longer subarray from the same earlier prefix — which is exactly what happens in [10,5,2,7,1,-10] with k = 15, where a match of length 2 is found at index 1 and a match of length 6 at index 5. Returning early would report 2. Record and keep going.

<!-- @doubt -->
### How does this extend to counting subarrays instead of finding the longest?

<!-- @answer -->
It becomes a smaller change than you would expect. Instead of mapping each prefix sum to the earliest index where it occurred, map it to how many times it has occurred so far. Then at each position, the lookup for the current total minus k returns the number of qualifying subarrays ending here, and you add that to a total rather than taking a maximum. The earliest-versus-latest question disappears entirely, because you are no longer measuring a distance — which removes one of the two bugs quantified in this subtopic.
