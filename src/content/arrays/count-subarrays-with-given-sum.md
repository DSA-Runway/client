---
id: count-subarrays-with-given-sum
topic: Arrays
title: Count Subarrays with Given Sum
difficulty: Medium
status: ready
prerequisites:
  - longest-subarray-with-sum-k
  - longest-subarray-with-given-sum-k-positives
  - two-sum
  - for-loop
  - time-and-space-complexity-basics
relatedIds:
  - longest-subarray-with-sum-k
  - longest-subarray-with-given-sum-k-positives
  - two-sum
  - largest-subarray-with-sum-0
---

<!-- @summary -->
Count every subarray summing to k — the same prefix-sum map as the longest-subarray problems, except the map now stores counts rather than earliest indices, and the sliding window that was safe with zeros there breaks on 51.49% of inputs here.

<!-- @theory -->
## The problem

Given an array and an integer `k`, return **how many** subarrays sum to `k`.
Subarrays are contiguous, and different index ranges count separately even when
they hold the same values.

```
a = [1, 1, 1], k = 2   ->  2      the ranges [0,1] and [1,2]
```

## Counting is not finding

You have already built the prefix-sum map twice — for the longest subarray with
sum k, and for its positives-only variant. The technique here is the same, and
**the thing stored in the map is not**.

For *longest*, the map holds the **earliest index** at which each prefix sum
appeared, because an earlier start gives a longer subarray. For *counting*, it
holds **how many times** each prefix sum has appeared, because every earlier
occurrence is a separate subarray ending here.

```
longest:  first.putIfAbsent(sum, i)      keep the earliest, ignore repeats
counting: count[sum]++                   keep them all
```

Carrying the wrong one across is a real mistake, not a hypothetical: an
index-storing version measured **39.96% wrong** across 117,186 tested
(array, k) pairs, because it can credit at most one subarray per position.

The rule: `sum[j] - sum[i] == k` means the subarray from i+1 to j sums to k. So
at each position, the number of subarrays ending here is the number of times
`sum - k` has already been seen.

## The seed that is easy to forget

The map must start with `count[0] = 1`, standing for the empty prefix before
index 0. Without it, every subarray that starts at index 0 is missed.

Measured **46.81% wrong** across all tested pairs, and the smallest failing case
is a single element: `a = [-2], k = -2` returns 0 where the answer is 1.

It is worth understanding rather than memorising. The prefix sum after zero
elements is 0, and it is a genuine occurrence — the subarray `a[0..j]` is
`sum[j] - sum[-1]`, and `sum[-1]` is that empty prefix.

## The sliding window, and exactly where it stops working

A sliding window is the natural O(1)-space idea: grow on the right, shrink from
the left while the sum is too big, count when it matches. It is much narrower
here than in the longest-subarray problem, and it fails in three distinct ways.

**First, the empty window at k = 0.** On strictly positive values the plain
window is wrong on **99.8% of k = 0 cases and 0% of every other k**. The shrink
loop can empty the window entirely, leaving a sum of 0, which then matches. That
one is fixable with a guard that refuses to count an empty range.

**Second, zeros.** With that guard added, strictly positive values are **0%
wrong** — but non-negative values, meaning zeros allowed, are **51.49% wrong**.
A zero lets several subarrays end at the same position, and a sliding window
reports at most one per right endpoint:

```
a = [0, 1], k = 1     window says 1, the answer is 2      ([1] and [0,1])
a = [0,0,0], k = 0    window says 3, the answer is 6
```

**This is the contrast worth keeping.** In *Longest Subarray with Sum K
(positives)*, zeros were measured completely safe — zero failures — because
finding the *longest* needs only one answer per endpoint. Counting needs all of
them. Same window, same data, different question, and the safe domain shrinks
from non-negative to strictly positive.

**Third, negatives.** 66.94% wrong even with the guard, for the familiar reason:
the sum is not monotonic in the window's width, so shrinking from the left is
not a valid way to search.

So the sliding window's domain here is **strictly positive values, with an
empty-window guard**. Inside that domain it is correct and needs no map.

## What it costs, and a surprise about the data

Against the O(n²) brute force the map wins as expected:

| n | values | brute force | prefix map | ratio |
|---|---|---|---|---|
| 1,000 | positive | 0.185ms | 0.034ms | 5x |
| 10,000 | positive | 18.975ms | 0.358ms | **53x** |
| 1,000 | mixed | 0.181ms | 0.010ms | 19x |
| 10,000 | mixed | 18.861ms | 0.072ms | **263x** |

Look at the two prefix-map columns rather than the ratios. The same code on the
same size ran **0.358ms on positive data and 0.072ms on mixed data — five times
faster with negatives.** At n = 100,000 the gap was 3.640ms against 0.539ms,
**6.8x**.

The reason is how many distinct prefix sums exist:

| n | Values | Distinct prefix sums | As a share of n |
|---|---|---|---|
| 1,000,000 | positive | 1,000,001 | **100.0%** |
| 1,000,000 | mixed +/− | 7,691 | 0.8% |
| 1,000,000 | random walk | 1,155 | **0.1%** |

With positive values every prefix sum is strictly larger than the last, so they
are all distinct and the map grows to n entries — far past cache. With negatives
the running sum wanders back over ground it has already covered, so the map stays
tiny and cache-resident. A million elements needed **1,155 map entries**.

This is the same effect measured in **Longest Subarray with Sum K**, where the
identical code ran 8.6x faster on data containing negatives. Two independent
measurements of the same cause.

The practical consequence: benchmarking this on positive data measures the worst
case for the map, and the input that looks hardest — mixed signs — is the one it
handles best.

## Which to write

The **prefix-sum count map**. It is O(n), it is correct on every input, and the
only two things to get right are seeding with `count[0] = 1` and storing counts
rather than indices.

Take the sliding window only when you can guarantee **strictly positive** values
and you need O(1) space — and write the empty-window guard, because k = 0 will
find you otherwise.

<!-- @intuition -->
Keep a running total as you walk, and write down every total you have seen and how many times. Standing at position j with running total S, a subarray ending here sums to k exactly when it started just after some earlier point whose running total was S − k. So the question "how many subarrays end here" is just "how many times have I already seen S − k" — a lookup, not a search. The empty prefix counts as one of those earlier points, which is why the tally starts with a single zero already in it: a subarray that starts at the very beginning is measuring from nothing.

<!-- @approach -->
### Brute Force - Every Subarray with a Running Sum

<!-- @idea -->
Fix each start position, extend the end one element at a time carrying a running total, and count every time it hits k.

<!-- @steps -->
1. Take each index in turn as the start of a subarray.
2. Reset a running sum to zero.
3. Extend the end position through the rest of the array, adding each element.
4. Increment the count whenever the running sum equals k.
5. Do not stop early on a match, since a later end position can match again.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: The running sum is what keeps this quadratic rather than cubic. It is correct on every input including negatives and zeros, which makes it the right reference implementation. Measured 18.975ms at n = 10,000 against the prefix map's 0.358ms.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

long long countSubarrays(const vector<int>& a, long long k) {
    long long count = 0;
    int n = a.size();

    for (int i = 0; i < n; i++) {
        long long sum = 0;
        for (int j = i; j < n; j++) {
            sum += a[j];                 // running sum: no inner re-summing
            if (sum == k) count++;        // no break — a later j can match too
        }
    }
    return count;
}
```

<!-- @annotations -->
- 11: Carrying the sum forward is what makes this O(n^2) instead of O(n^3).
- 12: No break here. With negatives the sum can leave k and come back, so a later end position can match again.

<!-- @code java -->
```java
static long countSubarrays(int[] a, long k) {
    long count = 0;

    for (int i = 0; i < a.length; i++) {
        long sum = 0;
        for (int j = i; j < a.length; j++) {
            sum += a[j];
            if (sum == k) count++;
        }
    }
    return count;
}
```

<!-- @annotations -->
- 5: A long accumulator, since n elements at the int limit overflow an int sum long before the loop ends.

<!-- @code python -->
```python
def count_subarrays(a, k):
    count = 0
    n = len(a)

    for i in range(n):
        total = 0
        for j in range(i, n):
            total += a[j]
            if total == k:
                count += 1
    return count


# Correct on every input — negatives, zeros, any k — which is exactly
# what makes it the reference to test the fast versions against.
```

<!-- @annotations -->
- 8: The running total, rebuilt once per start rather than once per subarray.

<!-- @approach -->
### Sliding Window - Strictly Positive Values Only

<!-- @idea -->
Grow the window on the right, shrink it from the left while the sum exceeds k, and count whenever it lands exactly on k.

<!-- @steps -->
1. Keep a window with a left edge, a right edge and a running sum.
2. Extend the right edge one element at a time, adding to the sum.
3. While the sum exceeds k, remove the leftmost element and advance the left edge.
4. If the sum now equals k and the window is not empty, count one subarray.
5. The empty-window check is what stops k equal to zero counting a range of no elements.

<!-- @complexity -->
- time: O(n), each element enters and leaves the window at most once
- space: O(1)
- note: Correct ONLY for strictly positive values, and only with the empty-window guard. Measured 0% wrong on strictly positive input with the guard, 99.8% wrong at k = 0 without it, 51.49% wrong once zeros are allowed, and 66.94% wrong with negatives. Worth having when the domain genuinely holds, since it needs no map.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// Requires every element to be strictly positive.
long long countSubarraysPositive(const vector<int>& a, long long k) {
    long long count = 0, sum = 0;
    int lo = 0;

    for (int hi = 0; hi < (int)a.size(); hi++) {
        sum += a[hi];
        while (lo <= hi && sum > k) { sum -= a[lo]; lo++; }
        if (sum == k && lo <= hi) count++;      // lo <= hi rejects the EMPTY window
    }
    return count;
}
```

<!-- @annotations -->
- 11: Shrinking from the left is only valid because every element is positive, so removing one always lowers the sum.
- 12: Without the lo <= hi test, k = 0 counts an empty window — measured wrong on 99.8% of k = 0 cases.

<!-- @code java -->
```java
// Requires every element to be strictly positive.
static long countSubarraysPositive(int[] a, long k) {
    long count = 0, sum = 0;
    int lo = 0;

    for (int hi = 0; hi < a.length; hi++) {
        sum += a[hi];
        while (lo <= hi && sum > k) { sum -= a[lo]; lo++; }
        if (sum == k && lo <= hi) count++;
    }
    return count;
}
```

<!-- @annotations -->
- 9: One count per right endpoint is all this can ever produce, which is why a zero in the data breaks it.

<!-- @code python -->
```python
def count_subarrays_positive(a, k):
    """Requires every element to be strictly positive."""
    count = 0
    total = 0
    lo = 0

    for hi in range(len(a)):
        total += a[hi]
        while lo <= hi and total > k:
            total -= a[lo]
            lo += 1
        if total == k and lo <= hi:      # lo <= hi rejects the EMPTY window
            count += 1
    return count


# [0, 1], k = 1  ->  this returns 1, the answer is 2 ([1] and [0,1]).
# A zero lets two subarrays end at the same position; a window reports one.
```

<!-- @annotations -->
- 12: The empty-window guard. Zeros still break this approach even with it, which is why the domain is strictly positive.

<!-- @approach -->
### Optimal - Prefix Sums with a Count Map

<!-- @idea -->
Keep a running sum and a tally of how often each running sum has occurred; at each position the number of subarrays ending there is the tally of sum minus k.

<!-- @steps -->
1. Start a tally with the value zero recorded once, standing for the empty prefix.
2. Walk the array carrying a running sum.
3. At each element, add it to the running sum.
4. Add to the answer however many times the running sum minus k has already been tallied.
5. Then tally the current running sum.
6. Look up before tallying, so a subarray is never matched against itself.

<!-- @complexity -->
- time: O(n), one pass with constant-time lookups
- space: O(n) worst case for the tally, and far less on data containing negatives
- note: The recommended solution, correct on every input. Measured 0.358ms at n = 10,000 against the brute force's 18.975ms. Its cost depends sharply on the data: positive values make every prefix sum distinct so the tally grows to n entries, while a random walk needed only 1,155 entries at n = 1,000,000 and ran 6.8x faster.

<!-- @code cpp -->
```cpp
#include <vector>
#include <unordered_map>
using namespace std;

long long countSubarrays(const vector<int>& a, long long k) {
    unordered_map<long long, int> seen;
    seen.reserve(a.size() * 2);
    seen[0] = 1;                          // the empty prefix, before index 0

    long long sum = 0, count = 0;
    for (int x : a) {
        sum += x;
        auto it = seen.find(sum - k);
        if (it != seen.end()) count += it->second;   // COUNT, not index
        seen[sum]++;
    }
    return count;
}
```

<!-- @annotations -->
- 8: Seeding with one occurrence of zero. Omitting it misses every subarray starting at index 0 — measured 46.81% wrong.
- 14: Adding the stored COUNT. The longest-subarray version stores an earliest index instead, and carrying that across measured 39.96% wrong.
- 15: Tallying after the lookup, so the current prefix can never match itself.

<!-- @code java -->
```java
import java.util.HashMap;
import java.util.Map;

static long countSubarrays(int[] a, long k) {
    Map<Long, Integer> seen = new HashMap<>();
    seen.put(0L, 1);

    long sum = 0, count = 0;
    for (int x : a) {
        sum += x;
        Integer prior = seen.get(sum - k);
        if (prior != null) count += prior;
        seen.merge(sum, 1, Integer::sum);
    }
    return count;
}
```

<!-- @annotations -->
- 6: The seed, written explicitly as one occurrence of the sum zero.
- 13: merge increments an existing tally or inserts one, which is the whole update in a single call.

<!-- @code python -->
```python
from collections import defaultdict

def count_subarrays(a, k):
    seen = defaultdict(int)
    seen[0] = 1                      # the empty prefix, before index 0

    total = 0
    count = 0
    for x in a:
        total += x
        count += seen[total - k]     # how MANY earlier prefixes qualify
        seen[total] += 1
    return count


# Distinct prefix sums measured at n = 1,000,000:
#   positive values  1,000,001  (100% of n)  -> map far exceeds cache
#   random walk          1,155  (0.1% of n)  -> map stays cache-resident
```

<!-- @annotations -->
- 5: Without this line every subarray starting at index 0 is missed — measured 46.81% wrong.
- 11: A defaultdict returns 0 for an unseen sum, so no membership test is needed.
- 12: Incrementing after the lookup. Doing it first would let the current prefix match itself whenever k is zero.

<!-- @example -->

<!-- @input -->
a = [1, 2, 3, -3, 1, 1, 1], k = 3

<!-- @output -->
6

<!-- @why -->
Contains negatives, a prefix sum that recurs, and a final step where one lookup finds TWO earlier matches at once — which is precisely what a sliding window cannot do.

<!-- @walkthrough -->
1. Start with the tally holding one occurrence of the sum 0, and a running sum of 0.
2. After 1 the running sum is 1; the probe looks for −2, finds nothing, and 1 is tallied.
3. After 2 the running sum is 3; the probe looks for 0 and finds the seed, so the count becomes 1 — the subarray [1,2].
4. After 3 the running sum is 6; the probe looks for 3 and finds one, so the count becomes 2 — the subarray [3].
5. After −3 the running sum is back to 3; the probe finds the seed again, so the count becomes 3 — the subarray [1,2,3,−3]. The tally now holds the sum 3 twice.
6. After the next two 1s the running sums are 4 and 5, adding one more from the 4 — the subarray [2,3,−3,1] — for a count of 4.
7. After the last 1 the running sum is 6, and the probe looks for 3 and finds it TWICE, adding two at once and giving 6 — the subarrays [3,−3,1,1,1] and [1,1,1].

<!-- @example -->

<!-- @input -->
a = [0, 1], k = 1 solved with a sliding window

<!-- @output -->
1 — and the correct answer is 2

<!-- @why -->
The case that separates counting from finding: the same window that is safe with zeros in the longest-subarray problem is wrong here.

<!-- @walkthrough -->
1. The two subarrays summing to 1 are [1] and [0,1], and both end at index 1.
2. The window extends to index 0, holding just the 0, with a sum of 0 which does not match.
3. It extends to index 1, holding [0,1], with a sum of 1 which matches, so it counts one.
4. There is no mechanism to also report [1], because the window has one left edge at a time.
5. A sliding window produces at most one subarray per right endpoint, and here two end at the same place.
6. Measured over all non-negative inputs tested, this failure appears on 51.49% of them.
7. The same window on strictly positive values was measured 0% wrong, so a single zero is the whole difference.

<!-- @example -->

<!-- @input -->
a = [-2], k = -2 with the map seeded empty

<!-- @output -->
0 — and the correct answer is 1

<!-- @why -->
The smallest possible failure for the missing seed, and it shows the seed is about subarrays that start at index 0 rather than about negatives.

<!-- @walkthrough -->
1. The only subarray is the whole array, which sums to −2 and therefore matches k.
2. Walking the array, the running sum after the single element is −2.
3. The lookup asks how many times −2 − (−2), which is 0, has been tallied.
4. With the correct seed the tally holds one occurrence of 0, so the count becomes 1.
5. With an empty tally there is no 0, so nothing is added and the answer comes back as 0.
6. That zero represents the empty prefix sitting before index 0, which is a real starting point.
7. Measured over 117,186 tested pairs, omitting the seed was wrong on 46.81% of them.

<!-- @example -->

<!-- @input -->
1,000,000 elements, positive values against a random walk

<!-- @output -->
1,000,001 distinct prefix sums against 1,155 — and 6.8x in running time

<!-- @why -->
Shows that the same code's speed is decided by the data's shape rather than its size, and that the intuitively harder input is the easier one.

<!-- @walkthrough -->
1. With strictly positive values each prefix sum is larger than the one before it.
2. Every prefix sum is therefore distinct, and the tally grows to one entry per element.
3. At a million elements that is 1,000,001 entries, far larger than cache, so lookups miss.
4. With mixed signs the running sum wanders back over values it has already taken.
5. A random walk over a million elements produced only 1,155 distinct sums — 0.1% of n.
6. That tally fits comfortably in cache, so every lookup is fast.
7. Measured at n = 100,000 the same code took 3.640ms on positive data and 0.539ms on mixed — 6.8x.

<!-- @visualization array -->

<!-- @description -->
The array as a strip with a running-sum line plotted above it, drawn as a connected path rather than a bar chart, because what matters is that the path REVISITS heights and each revisit is a subarray. To the right, a tally column listing each height seen and how many times, growing as the walk proceeds — this is the map, and it should be a visible object with visible counts, not an abstraction. As the marker advances, extend the path, then draw a horizontal probe line at the current height minus k and let it strike the path: every earlier point sitting at that height lights up, and a curved arrow springs from each one to the current position, one arrow per subarray found. That is the moment worth holding — the count is not a search, it is however many arrows the probe finds, read straight off the tally. Seed the tally with a single entry at height 0 drawn slightly outside the array, before index 0, and label it the empty prefix; when a subarray starting at index 0 is found, its arrow visibly springs from that outside point, which is the argument for the seed. Run a second panel with the seed removed on a = [-2], k = -2, where the probe finds nothing and the answer comes back 0 instead of 1. A third panel contrasts counting with finding, running the identical prefix walk twice side by side: on the left the tally stores counts and every matching height contributes an arrow; on the right it stores only the earliest index and the probe can light at most one point, so arrows are lost — annotate with 39.96%. A fourth panel takes [0,1] with k = 1 and animates the sliding window: the window slides to cover [0,1], matches, counts one, and the subarray [1] is shown greyed out and unreachable because the window has only one left edge — with the note that zeros were safe in the longest-subarray version and are not here. Close with the data-shape panel: two running-sum paths side by side over the same length, one climbing monotonically so every height is fresh, the other wandering and crossing itself constantly, with their tallies beside them at 1,000,001 entries against 1,155, and the two timings at 3.640ms and 0.539ms.

<!-- @sampleInput -->
```json
{"primary":{"input":[1,2,3,-3,1,1,1],"k":3,"answer":6,"trace":[{"i":0,"x":1,"runningSum":1,"probeHeight":-2,"matches":0,"count":0,"tallyAfter":{"0":1,"1":1}},{"i":1,"x":2,"runningSum":3,"probeHeight":0,"matches":1,"count":1,"found":[[0,1]],"tallyAfter":{"0":1,"1":1,"3":1}},{"i":2,"x":3,"runningSum":6,"probeHeight":3,"matches":1,"count":2,"found":[[2,2]],"tallyAfter":{"0":1,"1":1,"3":1,"6":1}},{"i":3,"x":-3,"runningSum":3,"probeHeight":0,"matches":1,"count":3,"found":[[0,3]],"tallyAfter":{"0":1,"1":1,"3":2,"6":1}},{"i":4,"x":1,"runningSum":4,"probeHeight":1,"matches":1,"count":4,"found":[[1,4]],"tallyAfter":{"0":1,"1":1,"3":2,"4":1,"6":1}},{"i":5,"x":1,"runningSum":5,"probeHeight":2,"matches":0,"count":4,"tallyAfter":{"0":1,"1":1,"3":2,"4":1,"5":1,"6":1}},{"i":6,"x":1,"runningSum":6,"probeHeight":3,"matches":2,"count":6,"found":[[2,6],[4,6]],"note":"one lookup, TWO subarrays","tallyAfter":{"0":1,"1":1,"3":2,"4":1,"5":1,"6":2}}],"seedEntry":{"height":0,"count":1,"position":"before index 0","label":"empty prefix"}},"seedPanel":{"input":[-2],"k":-2,"withSeed":1,"withoutSeed":0,"failureRate":0.4681,"pairsTested":117186},"countVsIndexPanel":{"countingStores":"how many times each prefix sum occurred","findingStores":"the earliest index each prefix sum occurred","whyDifferent":"longest needs one answer per position, counting needs all of them","indexBugFailureRate":0.3996},"windowPanel":{"input":[0,1],"k":1,"windowAnswer":1,"correct":2,"missed":[[1,1]],"reason":"a window has one left edge, so it reports at most one subarray per right endpoint","failureRates":[{"domain":"strictly positive, with empty guard","rate":0.0},{"domain":"strictly positive, no empty guard, k=0","rate":0.998},{"domain":"non-negative (zeros allowed)","rate":0.5149},{"domain":"with negatives","rate":0.6694}],"contrast":"zeros measured completely safe in the longest-subarray version"},"dataShapePanel":{"n":1000000,"positive":{"distinctPrefixSums":1000001,"shareOfN":1.0,"pathShape":"monotonic climb"},"mixed":{"distinctPrefixSums":7691,"shareOfN":0.008},"randomWalk":{"distinctPrefixSums":1155,"shareOfN":0.001,"pathShape":"wanders and self-crosses"},"timingAtN100k":{"positiveMs":3.640,"mixedMs":0.539,"ratio":6.8}},"bruteComparison":[{"n":1000,"values":"positive","bruteMs":0.185,"mapMs":0.034},{"n":10000,"values":"positive","bruteMs":18.975,"mapMs":0.358},{"n":10000,"values":"mixed","bruteMs":18.861,"mapMs":0.072}]}
```

<!-- @highlights -->
- The array sits below a running-sum path drawn as a connected line, because what matters is that the path revisits heights.
- A tally column to the right lists each height seen and how many times, growing as the walk proceeds — the map as a visible object.
- The tally is seeded with a single entry at height 0, drawn outside the array before index 0 and labelled the empty prefix.
- As the marker advances the path extends, then a horizontal probe line is drawn at the current height minus k.
- Every earlier point sitting at that height lights up, and a curved arrow springs from each to the current position.
- The count is one arrow per match, read straight off the tally rather than searched for.
- At index 1 the running sum is 3 and the probe at height 0 strikes the seed, so the arrow springs from outside the array.
- At index 3 the running sum returns to 3, and the probe at 0 strikes the seed again, finding the subarray spanning indices 0 to 3.
- A second panel removes the seed and runs [-2] with k = -2: the probe finds nothing and the answer is 0 instead of 1.
- A third panel runs the identical walk twice, one tally storing counts and one storing earliest indices.
- On the index side the probe can light at most one point, so arrows are visibly lost — annotated 39.96%.
- A fourth panel slides a window over [0,1] with k = 1, matching once and greying out the unreachable subarray [1].
- It is annotated that zeros were measured completely safe in the longest-subarray version and are not here.
- The closing panel shows two running-sum paths of equal length, one climbing monotonically and one wandering and self-crossing.
- Their tallies sit beside them at 1,000,001 entries against 1,155, with timings of 3.640ms and 0.539ms.

<!-- @edgeCases -->
- Empty array — no subarrays exist, so the answer is 0 whatever k is.
- Single element equal to k — the answer is 1, and this is the smallest case the missing seed gets wrong.
- Single element not equal to k — the answer is 0.
- k equal to zero with no zeros in the array — subarrays summing to zero require cancelling values, so this needs negatives.
- k equal to zero with zeros present — every run of zeros contributes many subarrays, and [0,0,0] has six.
- All elements zero and k zero — the answer is n times n plus one over two, the largest possible count for the length.
- All elements positive and k zero — the answer is 0, and it is where an unguarded sliding window counts empty windows.
- Negative k — perfectly valid, and it is where a sliding window is most obviously inapplicable.
- Values that cancel, such as [1,-1,1,-1] — the running sum revisits the same heights repeatedly, which is the case the tally handles and a window cannot.
- Large values where the running sum overflows a 32-bit integer — the accumulator and the map key must both be 64-bit.
- All elements equal and positive — every prefix sum is distinct, which is the worst case for the map's size.
- Very long arrays of mixed sign — the best case for the map, where it stays cache-resident regardless of length.

<!-- @pitfalls -->
- Omitting the seed of one occurrence of the sum zero. Every subarray starting at index 0 is then missed — measured 46.81% wrong, and [-2] with k = -2 is the smallest failing case.
- Storing the earliest index instead of a count, carried over from the longest-subarray problem. At most one subarray is then credited per position — measured 39.96% wrong.
- Tallying the current prefix sum before doing the lookup. When k is zero the prefix then matches itself and every position gains a phantom subarray.
- Using a sliding window on data containing zeros. Measured 51.49% wrong, even though zeros were completely safe in the longest-subarray version.
- Using a sliding window on data containing negatives. Measured 66.94% wrong, because the sum is not monotonic in the window's width.
- Omitting the empty-window guard in the sliding window. Measured wrong on 99.8% of k = 0 cases on otherwise valid strictly positive data.
- Breaking out of the brute force's inner loop after a match. With negatives the sum can leave k and return, so a later end position can match again.
- Accumulating the running sum in a 32-bit integer. A long array of large values overflows well before the loop ends, and the map key must be 64-bit too.
- Benchmarking only on positive data. That is the map's worst case, where every prefix sum is distinct and the map grows to n entries.
- Assuming the map is always O(n) space in practice. A random walk over a million elements needed 1,155 entries — 0.1% of n.
- Counting distinct value-sequences rather than index ranges. [1,1,1] with k = 2 has two answers, not one, because the ranges differ even though the values match.
- Returning early when the count reaches some expected value. Every position must be visited, since subarrays are counted rather than searched for.

<!-- @doubt -->
### Why does the map start with a zero already in it?

<!-- @answer -->
Because the empty prefix before index 0 is a real starting point. A subarray running from index 0 to j has sum equal to the prefix sum at j minus the prefix sum before index 0, and that second quantity is zero. If the tally does not contain it, no subarray starting at index 0 can ever be matched. The smallest demonstration is a single element: a = [-2] with k = -2 returns 0 instead of 1, because the lookup asks how many times −2 − (−2) = 0 has been seen and finds nothing. Measured over 117,186 tested pairs, omitting the seed was wrong on 46.81%.

<!-- @doubt -->
### This looks like the longest-subarray problem. What actually changed?

<!-- @answer -->
What the map stores. For the longest subarray you record the earliest index at which each prefix sum appeared, because an earlier start makes a longer subarray, and you deliberately ignore later repeats. For counting you record how many times each prefix sum has appeared, because every earlier occurrence is a separate subarray ending at the current position. Carrying the index version across measured 39.96% wrong, since it can credit at most one subarray per position. The walk, the arithmetic and the lookup are identical; only the value in the map differs.

<!-- @doubt -->
### Can I use a sliding window here?

<!-- @answer -->
Only on strictly positive values, and only with an empty-window guard. Measured with the guard: 0% wrong on strictly positive input, 51.49% wrong once zeros are allowed, and 66.94% wrong with negatives. Without the guard it is additionally wrong on 99.8% of k = 0 cases even on valid positive data, because the shrink loop can empty the window and leave a sum of zero that then matches. Inside that narrow domain it is genuinely useful, since it needs no map at all.

<!-- @doubt -->
### Zeros were safe for the sliding window in the longest-subarray lesson. Why not here?

<!-- @answer -->
Because that problem needed one answer per position and this one needs all of them. A sliding window has a single left edge at any moment, so it can report at most one subarray ending at each right endpoint. When you are looking for the longest, that is exactly enough — the window's left edge is already at the best place. When you are counting, several subarrays can end at the same position and the window reports only one. On a = [0,1] with k = 1 it finds [0,1] and misses [1]; on [0,0,0] with k = 0 it reports 3 where the answer is 6. Measured, the safe domain shrinks from non-negative to strictly positive.

<!-- @doubt -->
### Why must the lookup happen before the tally update?

<!-- @answer -->
Otherwise the current prefix sum can match itself. If you tally first and then look up sum − k, then whenever k is zero the value you just inserted is the value you are about to search for, and every position gains a phantom subarray of length zero. Looking up first means the tally contains only genuinely earlier prefixes, which is what the arithmetic assumes. The same ordering rule appears in the one-pass version of Two Sum, and for the same reason: check, then insert.

<!-- @doubt -->
### Why was the code faster on data with negatives?

<!-- @answer -->
Because negatives make the map small. With strictly positive values every prefix sum is larger than the last, so all of them are distinct and the map grows to one entry per element — 1,000,001 entries at a million elements, far past cache, so lookups miss. With mixed signs the running sum wanders back over heights it has already visited, so the same sums recur and the map stays tiny: a random walk over a million elements needed just 1,155 entries, 0.1% of n. Measured at n = 100,000 the identical code took 3.640ms on positive data and 0.539ms on mixed — 6.8x. The same effect was measured independently in Longest Subarray with Sum K at 8.6x.

<!-- @doubt -->
### So benchmarking on positive numbers is misleading?

<!-- @answer -->
It measures the worst case, which is worth knowing but is not the typical case. Positive-only data maximises the map's size and therefore its cache misses. If your real input has mixed signs, a benchmark on positive data will overstate the cost by several times. It is the opposite of the usual intuition, where negatives feel like the harder input — here they are the input the algorithm handles best, and the only reason negatives are hard at all is that they rule out the sliding window.

<!-- @doubt -->
### Does [1,1,1] with k = 2 have one answer or two?

<!-- @answer -->
Two. Subarrays are index ranges, not value sequences, so [0,1] and [1,2] are different answers even though both hold the values 1 and 1. This matters because it is what makes counting genuinely different from finding — the count map handles it naturally, since the prefix sum 1 has been tallied twice by the time the walk reaches the end, and both occurrences contribute.
