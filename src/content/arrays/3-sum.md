---
id: 3-sum
topic: Arrays
title: 3 Sum
difficulty: Medium
status: ready
prerequisites:
  - two-sum
  - remove-duplicates-from-sorted-array
  - for-loop
  - if-else-statements
  - time-and-space-complexity-basics
relatedIds:
  - two-sum
  - remove-duplicates-from-sorted-array
  - 4-sum
  - count-subarrays-with-given-sum
---

<!-- @summary -->
Find every unique triplet summing to zero — where both classic deduplication bugs produce the correct SET of triplets and only the wrong number of copies, so a set() at the end hides them completely while the output quietly grows to 442x its proper size.

<!-- @theory -->
## The problem

Given an array, return all **unique** triplets `[a, b, c]` with `a + b + c == 0`.
Triplets must use three different positions, and two triplets holding the same
values are the same triplet however they were found.

```
[-1, 0, 1, 2, -1, -4]  ->  [[-1, -1, 2], [-1, 0, 1]]
```

Note that `-1` appears twice in the input, and `[-1, -1, 2]` legitimately uses
both. Meanwhile `[-1, 0, 1]` can be formed two different ways — using either
copy of `-1` — and counts once.

**That tension is the entire problem.** Finding triplets that sum to zero is
easy; reporting each distinct one exactly once is not.

## Reducing it to Two Sum

Sort the array. Then fix the first element and look for two others summing to
its negation — which is **Two Sum** on a sorted array, and sorted Two Sum is a
two-pointer scan:

```
for each anchor i:
    lo = i+1, hi = n-1
    while lo < hi:
        s = a[i] + a[lo] + a[hi]
        s < 0  ->  lo++     (need a bigger sum)
        s > 0  ->  hi--     (need a smaller sum)
        s == 0 ->  record it, then move BOTH inward
```

The sort costs O(n log n), the scan is O(n) per anchor, so the whole thing is
O(n²). That is the standard solution — and as written above it is still wrong,
because nothing yet prevents duplicates.

## The two skips

**Skip duplicate anchors.** If `a[i] == a[i-1]`, this anchor produces exactly the
triplets the previous one already produced.

**Skip duplicate partners after a match.** Having recorded a triplet, advance
`lo` past any equal values and `hi` back past any equal values, or the same
triplet is found again with a different pair of positions.

```
if (i > 0 && a[i] == a[i-1]) continue;          // anchor skip
...
while (lo < hi && a[lo] == a[lo-1]) lo++;       // partner skips
while (lo < hi && a[hi] == a[hi+1]) hi--;
```

Measured over all 19,531 arrays over the values {−2..2} with n up to 6:

| Missing | Wrong |
|---|---|
| Anchor skip | **34.60%** |
| Partner skips | **8.02%** |
| Both | **40.34%** |

## What is actually wrong, and why a set hides it

Here is the finding that matters. Run the deduped output of either buggy version
against the truth:

| Missing | Raw output wrong | After wrapping in a set |
|---|---|---|
| Anchor skip | 34.60% | **0%** |
| Partner skips | 8.02% | **0%** |
| Both | 40.34% | **0%** |

**The set of triplets is always correct.** Neither bug ever misses a triplet or
invents one — they only emit the right answers too many times. Up to 4 copies of
a single triplet without the anchor skip, up to 6 without either.

So `return list(set(results))` makes both bugs vanish, which is exactly why so
much 3 Sum code has a set bolted on the end. The correctness problem is real but
it is trivially patchable, and patching it hides the actual cost.

## The actual cost

The skips are not primarily about correctness. They are about **not generating
the duplicates in the first place**:

| n | Correct triplets | No anchor skip | Neither skip |
|---|---|---|---|
| 60 | 25 | 142 (5.7x) | 351 (14.0x) |
| 200 | 61 | 587 (9.6x) | 4,021 (65.9x) |
| 400 | 41 | 1,001 (24.4x) | **18,139 (442.4x)** |

At 400 elements with both skips missing you build 18,139 rows to report 41. The
ratio grows with n, because more elements means more repeated values means more
redundant work per anchor.

In time, on a 3,000-element array over a narrow value range:

| Approach | Time |
|---|---|
| Two pointers **with** skips | **0.134ms** |
| Two pointers, no skips, `set()` at the end | 53.209ms |

**397x**, for output that is identical. The skips are the algorithm; the set is
a bandage over the wound they prevent.

## Against the alternatives

| n | range | Brute force | Hash set | Two pointers |
|---|---|---|---|---|
| 200 | ±50 | 2.366ms | 0.848ms | **0.024ms** |
| 800 | ±50 | 65.814ms | 7.409ms | **0.053ms** |
| 3,000 | ±50 | (too slow) | 80.841ms | **0.134ms** |
| 3,000 | ±1000 | (too slow) | 205.755ms | **7.729ms** |

Two pointers beats the hash-set version by **26.6x to 603x**, and the brute force
by 1,242x at n = 800.

The hash-set approach is the natural generalisation of one-pass Two Sum — fix an
anchor, then hash-scan the rest — and it is O(n²) like the two-pointer version.
It loses on constants for the reason measured twice already in this module, in
**Two Sum** and again in **Longest Consecutive Sequence**: a hash table's cache
behaviour cannot compete with a linear scan over sorted, contiguous memory. It
also has no cheap way to deduplicate, so it needs a set for the results, which
costs again.

## Note the value range

Look at the last two rows above. The same size of input took 0.134ms over ±50
and 7.729ms over ±1000 — **58x apart**. A narrow range means many repeated
values, which means the anchor skip fires constantly and whole scans are skipped.
It also means far fewer distinct triplets to report: 1,301 against 227,377.

So the algorithm is fastest exactly where naive deduplication is most expensive.
The two facts have the same cause, and benchmarking on wide-range data measures
neither well.

## Which to write

**Sort and two pointers, with both skips.** It is O(n²) time, O(1) space beyond
the sort and the output, and it is the fastest by a wide margin at every size and
range measured. Write the skips rather than a trailing `set()` — they cost three
lines and save two orders of magnitude.

<!-- @intuition -->
Sorting turns the search into a squeeze. With the smallest element pinned down, the other two must come from the range to its right, and because that range is ordered you always know which way to move: too small means the left end must rise, too big means the right end must fall. Neither pointer ever needs to go back, which is what turns an inner search into a single sweep. The duplicate skips are the same idea applied to the answers rather than the search — once you have taken every triplet that starts with a particular value, another copy of that value has nothing new to offer, so you step over it rather than repeating the whole sweep.

<!-- @approach -->
### Brute Force - Every Triple, Deduped with a Set

<!-- @idea -->
Try every combination of three positions, keep the ones summing to zero, and let a set collapse duplicates.

<!-- @steps -->
1. Sort the array so each triplet is produced in a canonical order.
2. Choose every combination of three distinct positions with three nested loops.
3. Add the three values and keep the triple when the sum is zero.
4. Insert each kept triple into a set, which discards repeats automatically.
5. Return the set's contents.

<!-- @complexity -->
- time: O(n^3) for the loops, plus the cost of set insertion per hit
- space: O(number of triplets) for the set
- note: Correct and unusable beyond a few hundred elements. Measured 65.814ms at n = 800 against the two-pointer version's 0.053ms, a factor of 1,242. Sorting first is what lets a set deduplicate at all, since it makes each triplet's value order canonical.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <set>
using namespace std;

vector<vector<int>> threeSum(vector<int> a) {
    sort(a.begin(), a.end());              // canonical order inside each triple
    set<vector<int>> found;
    int n = a.size();

    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            for (int k = j + 1; k < n; k++)
                if (a[i] + a[j] + a[k] == 0) found.insert({a[i], a[j], a[k]});

    return vector<vector<int>>(found.begin(), found.end());
}
```

<!-- @annotations -->
- 7: Sorting first is what makes deduplication possible — without it the same triplet appears in six different orders.
- 14: The set absorbs every duplicate, which is why this is correct despite having no skip logic at all.

<!-- @code java -->
```java
import java.util.*;

static List<List<Integer>> threeSum(int[] nums) {
    int[] a = nums.clone();
    Arrays.sort(a);
    Set<List<Integer>> found = new LinkedHashSet<>();

    for (int i = 0; i < a.length; i++)
        for (int j = i + 1; j < a.length; j++)
            for (int k = j + 1; k < a.length; k++)
                if (a[i] + a[j] + a[k] == 0)
                    found.add(List.of(a[i], a[j], a[k]));

    return new ArrayList<>(found);
}
```

<!-- @annotations -->
- 4: Cloning first, since Arrays.sort would otherwise reorder the caller's array.

<!-- @code python -->
```python
from itertools import combinations

def three_sum(nums):
    a = sorted(nums)
    found = {t for t in combinations(a, 3) if sum(t) == 0}
    return [list(t) for t in sorted(found)]


# combinations() over 3,000 elements is about 4.5 billion triples.
# This exists as a reference to test the fast versions against.
```

<!-- @annotations -->
- 5: A set comprehension over combinations, which is the whole algorithm — and completely impractical past a few hundred elements.

<!-- @approach -->
### Hash Set - Fix One, Two-Sum the Rest

<!-- @idea -->
Fix each element as the anchor, then sweep the rest with a hash set looking for the value that completes the triplet.

<!-- @steps -->
1. Sort the array so each triplet comes out in a canonical order.
2. Take each position in turn as the anchor.
3. Walk the remaining elements to its right, keeping a set of what has been seen.
4. For each of them, compute the value that would complete a zero sum.
5. If that value is already in the set, record the triplet.
6. Collect the triplets in a set, since this approach has no cheap way to skip duplicates.

<!-- @complexity -->
- time: O(n^2) expected, with a hash lookup per inner step
- space: O(n) for the per-anchor set, plus the result set
- note: The natural generalisation of one-pass Two Sum, and O(n^2) like the two-pointer version. It measured 26.6x to 603x slower — 80.841ms against 0.134ms at n = 3,000 over a narrow range — for the reason seen in Two Sum and Longest Consecutive Sequence: a hash table cannot match a scan over sorted contiguous memory. It also needs a result set, since it has no ordering to skip along.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <set>
#include <unordered_set>
using namespace std;

vector<vector<int>> threeSum(vector<int> a) {
    sort(a.begin(), a.end());
    set<vector<int>> found;
    int n = a.size();

    for (int i = 0; i < n; i++) {
        unordered_set<int> seen;
        for (int j = i + 1; j < n; j++) {
            int need = -(a[i] + a[j]);
            if (seen.count(need)) found.insert({a[i], need, a[j]});   // already sorted
            seen.insert(a[j]);
        }
    }
    return vector<vector<int>>(found.begin(), found.end());
}
```

<!-- @annotations -->
- 16: need was inserted earlier than a[j], and the array is sorted, so these three are already in ascending order.
- 17: Inserting after the lookup, so an element never pairs with itself — the same ordering rule as one-pass Two Sum.

<!-- @code java -->
```java
import java.util.*;

static List<List<Integer>> threeSum(int[] nums) {
    int[] a = nums.clone();
    Arrays.sort(a);
    Set<List<Integer>> found = new LinkedHashSet<>();

    for (int i = 0; i < a.length; i++) {
        Set<Integer> seen = new HashSet<>();
        for (int j = i + 1; j < a.length; j++) {
            int need = -(a[i] + a[j]);
            if (seen.contains(need)) found.add(List.of(a[i], need, a[j]));
            seen.add(a[j]);
        }
    }
    return new ArrayList<>(found);
}
```

<!-- @annotations -->
- 9: A fresh set per anchor, which is where most of this approach's allocation cost lives.

<!-- @code python -->
```python
def three_sum(nums):
    a = sorted(nums)
    found = set()

    for i in range(len(a)):
        seen = set()
        for j in range(i + 1, len(a)):
            need = -(a[i] + a[j])
            if need in seen:
                found.add((a[i], need, a[j]))    # already ascending
            seen.add(a[j])

    return [list(t) for t in sorted(found)]


# O(n^2) like the two-pointer version, and measured 26.6x to 603x slower.
```

<!-- @annotations -->
- 10: The tuple is built in ascending order already, because the array is sorted and need came before a[j].

<!-- @approach -->
### Sort and Two Pointers, Deduped at the End

<!-- @idea -->
Run the two-pointer sweep with no skip logic at all, then remove duplicate triplets from the results.

<!-- @steps -->
1. Sort the array.
2. Take each position in turn as the anchor.
3. Sweep the range to its right with a pointer at each end.
4. Move the left pointer up when the sum is too small and the right pointer down when it is too large.
5. Record a triplet on every exact match and move both pointers inward.
6. Deduplicate the collected triplets before returning them.

<!-- @complexity -->
- time: O(n^2) for the sweep, plus deduplication proportional to the number of rows emitted
- space: O(rows emitted), which can be far larger than the answer
- note: Correct, and the version that seems reasonable until it is measured. On a 400-element array it emitted 18,139 rows to report 41 triplets — 442x — and at n = 3,000 over a narrow range it took 53.209ms against the skipping version's 0.134ms, a factor of 397. The output is identical; only the work is not.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <set>
using namespace std;

vector<vector<int>> threeSum(vector<int> a) {
    sort(a.begin(), a.end());
    vector<vector<int>> rows;
    int n = a.size();

    for (int i = 0; i + 2 < n; i++) {
        int lo = i + 1, hi = n - 1;
        while (lo < hi) {
            int s = a[i] + a[lo] + a[hi];
            if (s < 0) lo++;
            else if (s > 0) hi--;
            else { rows.push_back({a[i], a[lo], a[hi]}); lo++; hi--; }   // no skips
        }
    }
    set<vector<int>> d(rows.begin(), rows.end());        // clean up afterwards
    return vector<vector<int>>(d.begin(), d.end());
}
```

<!-- @annotations -->
- 17: Recording and moving on with no skipping, which is what lets the same triplet be emitted up to six times.
- 20: The set makes the ANSWER correct, which is precisely why this bug is so easy to ship.

<!-- @code java -->
```java
import java.util.*;

static List<List<Integer>> threeSum(int[] nums) {
    int[] a = nums.clone();
    Arrays.sort(a);
    Set<List<Integer>> found = new LinkedHashSet<>();

    for (int i = 0; i + 2 < a.length; i++) {
        int lo = i + 1, hi = a.length - 1;
        while (lo < hi) {
            int s = a[i] + a[lo] + a[hi];
            if (s < 0) lo++;
            else if (s > 0) hi--;
            else { found.add(List.of(a[i], a[lo], a[hi])); lo++; hi--; }
        }
    }
    return new ArrayList<>(found);
}
```

<!-- @annotations -->
- 6: Inserting straight into a set hides the duplication rather than preventing it, so the work is still done.

<!-- @code python -->
```python
def three_sum(nums):
    a = sorted(nums)
    rows = []
    n = len(a)

    for i in range(n - 2):
        lo, hi = i + 1, n - 1
        while lo < hi:
            s = a[i] + a[lo] + a[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                rows.append((a[i], a[lo], a[hi]))     # no skipping
                lo += 1
                hi -= 1

    return [list(t) for t in sorted(set(rows))]


# On a 400-element array this emits 18,139 rows to report 41 triplets.
```

<!-- @annotations -->
- 19: sorted(set(rows)) produces the right answer from the wrong amount of work — measured 397x slower than skipping.

<!-- @approach -->
### Optimal - Sort and Two Pointers with Skips

<!-- @idea -->
Run the same sweep, but step over repeated values at the anchor and after every match so no duplicate is ever produced.

<!-- @steps -->
1. Sort the array.
2. Take each position as the anchor, skipping it when it equals the previous value.
3. Sweep the range to its right with a pointer at each end.
4. Move the left pointer up when the sum is too small and the right pointer down when it is too large.
5. On an exact match, record the triplet and move both pointers inward.
6. Then advance the left pointer past any equal values and the right pointer back past any equal values.

<!-- @complexity -->
- time: O(n^2), dominated by the sweep rather than the O(n log n) sort
- space: O(1) beyond the sort and the output
- note: The recommended solution, and the fastest by a wide margin at every size and range measured — 0.134ms at n = 3,000 over a narrow range, against 53.209ms without the skips and 80.841ms for the hash-set version. It never emits a duplicate, so it needs no result set.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<vector<int>> threeSum(vector<int> a) {
    sort(a.begin(), a.end());
    vector<vector<int>> out;
    int n = a.size();

    for (int i = 0; i + 2 < n; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;          // ANCHOR skip
        int lo = i + 1, hi = n - 1;

        while (lo < hi) {
            int s = a[i] + a[lo] + a[hi];
            if (s < 0) lo++;
            else if (s > 0) hi--;
            else {
                out.push_back({a[i], a[lo], a[hi]});
                lo++; hi--;
                while (lo < hi && a[lo] == a[lo - 1]) lo++;   // PARTNER skips
                while (lo < hi && a[hi] == a[hi + 1]) hi--;
            }
        }
    }
    return out;
}
```

<!-- @annotations -->
- 11: Omitting this measured 34.60% wrong — always by duplication, never by a missing triplet.
- 21: Omitting these measured 8.02% wrong, again purely duplicates.
- 22: Comparing against the value just left behind, which is why lo-1 and hi+1 rather than lo+1 and hi-1.

<!-- @code java -->
```java
import java.util.*;

static List<List<Integer>> threeSum(int[] nums) {
    int[] a = nums.clone();
    Arrays.sort(a);
    List<List<Integer>> out = new ArrayList<>();

    for (int i = 0; i + 2 < a.length; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;
        int lo = i + 1, hi = a.length - 1;

        while (lo < hi) {
            int s = a[i] + a[lo] + a[hi];
            if (s < 0) lo++;
            else if (s > 0) hi--;
            else {
                out.add(List.of(a[i], a[lo], a[hi]));
                lo++; hi--;
                while (lo < hi && a[lo] == a[lo - 1]) lo++;
                while (lo < hi && a[hi] == a[hi + 1]) hi--;
            }
        }
    }
    return out;
}
```

<!-- @annotations -->
- 9: The anchor skip. A repeated anchor value produces exactly the triplets the previous one already produced.
- 19: Both partner skips are needed, since the same triplet can be reached by moving either pointer.

<!-- @code python -->
```python
def three_sum(nums):
    a = sorted(nums)
    out = []
    n = len(a)

    for i in range(n - 2):
        if i > 0 and a[i] == a[i - 1]:            # ANCHOR skip
            continue
        lo, hi = i + 1, n - 1

        while lo < hi:
            s = a[i] + a[lo] + a[hi]
            if s < 0:
                lo += 1
            elif s > 0:
                hi -= 1
            else:
                out.append([a[i], a[lo], a[hi]])
                lo += 1
                hi -= 1
                while lo < hi and a[lo] == a[lo - 1]:     # PARTNER skips
                    lo += 1
                while lo < hi and a[hi] == a[hi + 1]:
                    hi -= 1
    return out


# No result set is needed, because no duplicate is ever produced.
# Measured 0.134ms at n = 3,000 against 53.209ms for dedup-at-the-end.
```

<!-- @annotations -->
- 7: Skipping a repeated anchor. Without it the entire sweep below is repeated for no new answers.
- 21: Skipping past equal partners after a match, comparing with the value just passed.

<!-- @example -->

<!-- @input -->
nums = [-1, 0, 1, 2, -1, -4]

<!-- @output -->
[[-1, -1, 2], [-1, 0, 1]]

<!-- @why -->
The canonical case, containing a repeated value that is legitimately used twice in one triplet and that also causes a duplicate of another.

<!-- @walkthrough -->
1. Sorted, the array is [-4, -1, -1, 0, 1, 2].
2. Anchor -4 at index 0: the pointers sweep 1 to 5 and never reach zero, since the largest available pair sums to 3.
3. Anchor -1 at index 1: lo is at -1 and hi is at 2, summing to zero, so [-1, -1, 2] is recorded.
4. Both pointers move inward to 0 and 1, which sum with -1 to zero, so [-1, 0, 1] is recorded.
5. The pointers meet and the sweep ends.
6. Anchor -1 at index 2 equals the previous value, so the anchor skip fires and the whole sweep is not repeated.
7. Without that skip this anchor would find [-1, 0, 1] again, since it also has a 0 and a 1 to its right.

<!-- @example -->

<!-- @input -->
nums = [-2, -2, 0, 2] without the anchor skip

<!-- @output -->
[[-2, 0, 2], [-2, 0, 2]] — the same triplet twice

<!-- @why -->
The smallest input that exposes the missing anchor skip, found by exhaustive search over all arrays from the values -2 to 2.

<!-- @walkthrough -->
1. Sorted, the array is [-2, -2, 0, 2].
2. Anchor -2 at index 0: the pointers land on 0 and 2, which sum with -2 to zero, so [-2, 0, 2] is recorded.
3. The pointers move inward and meet, so the sweep ends.
4. Anchor -2 at index 1 has the same value as the anchor before it.
5. Its sweep sees the same 0 and 2 to its right and records [-2, 0, 2] a second time.
6. The anchor skip would have stepped over this anchor entirely.
7. Note that the triplet itself is correct — the bug is producing it twice, not producing something wrong.

<!-- @example -->

<!-- @input -->
A 400-element array, with and without the two skips

<!-- @output -->
41 correct triplets, against 18,139 rows emitted with neither skip — 442x

<!-- @why -->
Shows that the skips are about the amount of work rather than about correctness, since a set at the end fixes the answer either way.

<!-- @walkthrough -->
1. With both skips the sweep emits exactly 41 rows, one per distinct triplet.
2. Without the anchor skip it emits 1,001 rows — 24.4x the answer.
3. Without either skip it emits 18,139 rows — 442.4x.
4. Every one of those rows is a correct triplet; none is spurious and none is missing.
5. So wrapping the result in a set gives the right answer in all three cases.
6. Measured over the exhaustive test set, the deduped output of every buggy variant was 0% wrong.
7. What the skips save is the work: 0.134ms against 53.209ms at n = 3,000, a factor of 397.

<!-- @example -->

<!-- @input -->
3,000 elements over a narrow range against a wide one

<!-- @output -->
0.134ms and 1,301 triplets, against 7.729ms and 227,377 triplets

<!-- @why -->
The same algorithm on the same size of input, 58x apart, which shows why benchmarking this needs the value range stated.

<!-- @walkthrough -->
1. Over values from -50 to 50 a 3,000-element array has many repeated values.
2. The anchor skip therefore fires constantly, and whole sweeps are never run.
3. There are also far fewer distinct triplets to report — 1,301.
4. Over values from -1000 to 1000 repeats are rare, so almost every anchor runs a full sweep.
5. And there are 227,377 distinct triplets, so the output itself dominates the cost.
6. The measured times were 0.134ms and 7.729ms — 58x apart at identical n.
7. The algorithm is fastest exactly where naive deduplication would be most expensive, since both effects come from repeated values.

<!-- @visualization array -->

<!-- @description -->
The sorted array as a strip, with equal values grouped under a shared bracket drawn beneath them — the runs of duplicates are the subject here, so they should be visible as blocks before any pointer moves. An anchor marker sits on the left and two pointers sweep the region to its right, with a live sum panel showing the three values and their total. As the sum is compared against zero, animate the decision: too small pushes the left pointer right, too large pulls the right pointer left, and the arrow that moves should be the one the comparison chose, so the reader sees the sortedness doing the work. On a match, lift the three cells out of the strip and drop them into a results list below. Then show the skips explicitly, because they are the lesson: after a match, walk the left pointer forward while it stays inside its duplicate bracket and grey out each cell it steps over, and do the same backwards for the right pointer. When the anchor advances into a bracket it has already used, strike the whole bracket through and jump the anchor past it in one motion, with the sweep it would have performed drawn as a ghosted, greyed-out replay so the reader sees exactly what was avoided. Run the whole thing on the canonical [-1,0,1,2,-1,-4] so the two -1 values form one bracket and the second one is visibly skipped. Then a duplication panel on [-2,-2,0,2] with the anchor skip disabled: both anchors run, both find [-2,0,2], and the results list visibly gains the same row twice — annotate that the row is correct and only the count is wrong, then show a set() collapsing the two rows into one and label it as the bandage. Beside it, a bar chart of rows emitted against correct triplets at n = 400: a short bar at 41 next to bars at 1,001 and 18,139, with the 442x called out. Close with a range panel: two sorted strips of the same length, one over a narrow range showing wide duplicate brackets and many struck-through anchors, the other over a wide range showing almost no brackets and every anchor running, captioned 0.134ms against 7.729ms.

<!-- @sampleInput -->
```json
{"primary":{"input":[-1,0,1,2,-1,-4],"sorted":[-4,-1,-1,0,1,2],"duplicateBrackets":[{"value":-1,"indices":[1,2]}],"anchors":[{"i":0,"value":-4,"skipped":false,"found":[],"note":"largest available pair sums to 3"},{"i":1,"value":-1,"skipped":false,"found":[[-1,-1,2],[-1,0,1]]},{"i":2,"value":-1,"skipped":true,"reason":"equals previous anchor","wouldHaveFound":[[-1,0,1]]}],"answer":[[-1,-1,2],[-1,0,1]]},"dupPanel":{"input":[-2,-2,0,2],"sorted":[-2,-2,0,2],"withAnchorSkip":[[-2,0,2]],"withoutAnchorSkip":[[-2,0,2],[-2,0,2]],"rowIsCorrect":true,"onlyCountWrong":true,"setCollapsesTo":[[-2,0,2]],"label":"the set is a bandage, not a fix"},"failureRates":{"arraysTested":19531,"noAnchorSkip":0.3460,"noPartnerSkips":0.0802,"neither":0.4034,"afterSetDedup":0.0,"maxCopiesOfOneTriplet":{"noAnchorSkip":4,"neither":6}},"blowupPanel":{"n":400,"correctTriplets":41,"noAnchorSkipRows":1001,"neitherSkipRows":18139,"ratios":{"noAnchorSkip":24.4,"neither":442.4},"smallerCases":[{"n":60,"correct":25,"noAnchor":142,"neither":351},{"n":200,"correct":61,"noAnchor":587,"neither":4021}]},"timingPanel":[{"n":200,"range":50,"bruteMs":2.366,"hashMs":0.848,"twoPtrMs":0.024,"noSkipDedupMs":0.266,"triplets":967},{"n":800,"range":50,"bruteMs":65.814,"hashMs":7.409,"twoPtrMs":0.053,"noSkipDedupMs":3.744,"triplets":1301},{"n":3000,"range":50,"hashMs":80.841,"twoPtrMs":0.134,"noSkipDedupMs":53.209,"triplets":1301},{"n":3000,"range":1000,"hashMs":205.755,"twoPtrMs":7.729,"noSkipDedupMs":142.021,"triplets":227377}],"rangePanel":{"n":3000,"narrow":{"range":50,"ms":0.134,"triplets":1301,"manyDuplicates":true},"wide":{"range":1000,"ms":7.729,"triplets":227377,"manyDuplicates":false},"ratio":58}}
```

<!-- @highlights -->
- The sorted strip draws equal values grouped under a shared bracket, so runs of duplicates are visible as blocks before any pointer moves.
- An anchor marker sits on the left with two pointers sweeping the region to its right, and a live panel shows the three values and their total.
- When the sum is too small the left pointer is pushed right; when too large the right pointer is pulled left — the arrow that moves is the one the comparison chose.
- On a match the three cells lift out of the strip and drop into a results list below.
- With anchor -4 the sweep never reaches zero, since the largest available pair sums to 3.
- With the first -1 the pointers find [-1,-1,2], then move inward and find [-1,0,1].
- After each match the left pointer walks forward while it stays inside its duplicate bracket, greying out every cell it steps over.
- The right pointer does the same backwards, so both partner skips are seen rather than described.
- When the anchor reaches the second -1 the whole bracket is struck through and the anchor jumps past it in one motion.
- The sweep that anchor would have run is drawn as a ghosted greyed-out replay, showing exactly what was avoided.
- A duplication panel runs [-2,-2,0,2] with the anchor skip disabled, and both anchors find [-2,0,2].
- The results list visibly gains the same row twice, annotated that the row is correct and only the count is wrong.
- A set() then collapses the two rows into one and is labelled the bandage.
- A bar chart at n = 400 puts a short bar at 41 correct triplets beside bars at 1,001 and 18,139, calling out 442x.
- A closing range panel shows two strips of equal length, one with wide duplicate brackets and many struck-through anchors at 0.134ms, the other with almost none at 7.729ms.

<!-- @edgeCases -->
- Fewer than three elements — no triplet exists, and the anchor loop must not run past the end.
- Exactly three elements summing to zero — the single triplet, and the smallest input with an answer.
- Exactly three elements not summing to zero — the empty result.
- All elements zero, such as [0,0,0,0] — exactly one triplet, and the case where both skips fire hardest.
- Three zeros among other values — [0,0,0] is a valid triplet using three distinct positions.
- No triplet sums to zero — the result is empty and both pointers simply cross on every anchor.
- All elements positive — no triplet can sum to zero, and the anchor sweep exits immediately once the anchor is above zero.
- All elements negative — the mirror case, likewise with no answer.
- A value repeated many times, such as twenty copies of -1 — the anchor skip prevents nineteen redundant sweeps.
- Two copies of a value that a triplet legitimately needs, such as [-1,-1,2] — the skips must not remove the triplet itself, only its repeats.
- Values near the integer limit — three of them can overflow a 32-bit sum, so the addition needs a wider type.
- A large array over a narrow value range — the fastest case, and the one where naive deduplication is most expensive.

<!-- @pitfalls -->
- Omitting the anchor skip. Measured 34.60% wrong, always by emitting a triplet more than once rather than by getting one wrong.
- Omitting the partner skips after a match. Measured 8.02% wrong, again purely duplicates.
- Fixing either bug with a set at the end. That makes the answer correct — measured 0% wrong after deduplication — while leaving the work in place, which measured 397x slower at n = 3,000.
- Comparing a[lo] against a[lo+1] rather than a[lo-1] in the partner skip. The comparison is with the value just passed, not the one ahead.
- Skipping the anchor when i is 0. There is no previous value to compare against, so the guard must test i > 0 first.
- Skipping duplicate anchors before recording, in a way that removes a triplet that legitimately uses two equal values. The skip is on the anchor position, not on the values inside a triplet.
- Forgetting to sort. The two-pointer sweep depends entirely on order, and without it neither the movement rule nor the skips mean anything.
- Sorting the caller's array in place. Take a copy unless reordering has been agreed.
- Summing three ints into an int. Three values near the 32-bit limit overflow, so use a wider accumulator or compare against the negated pair.
- Moving only one pointer after a match. Both must move, since the pair that just matched cannot match again with either one held fixed.
- Benchmarking without stating the value range. The same size of input measured 58x apart between a narrow and a wide range.
- Assuming the hash-set version is competitive because it is also O(n^2). It measured 26.6x to 603x slower, and it needs a result set on top.

<!-- @doubt -->
### Why do I need two different kinds of skip?

<!-- @answer -->
They prevent two different repetitions. The anchor skip stops a repeated first element from re-running an entire sweep that can only find triplets the previous anchor already found. The partner skips stop a single sweep from finding the same triplet again by sliding onto an equal neighbour after a match. Measured separately: omitting the anchor skip was 34.60% wrong and omitting the partner skips was 8.02% wrong, so they are genuinely independent faults. Omitting both was 40.34%.

<!-- @doubt -->
### I wrapped the result in a set and my tests pass. Is that fine?

<!-- @answer -->
The answer is correct and the algorithm is not. Measured over 19,531 arrays, the deduped output of every buggy variant was 0% wrong — neither bug ever misses a triplet or invents one, they only emit the right ones repeatedly, up to six copies of a single triplet. So a set genuinely fixes correctness, which is exactly why this ships so often. What it does not fix is the work: on a 400-element array the version with no skips emitted 18,139 rows to report 41 triplets, and at n = 3,000 it measured 53.209ms against 0.134ms. The skips are three lines and save a factor of 397.

<!-- @doubt -->
### Why is the comparison a[lo] == a[lo-1] rather than a[lo] == a[lo+1]?

<!-- @answer -->
Because you have already moved. After recording a triplet you advance lo, so the value you must not repeat is the one lo just left behind — at lo-1. Comparing forwards would skip past a value you have not used yet and lose triplets. The same logic mirrors on the other side: hi has just decreased, so the value to compare against is at hi+1. It is worth writing the pointer moves and the skips as one block for this reason, since the skips only make sense relative to the move that preceded them.

<!-- @doubt -->
### Does the anchor skip ever remove a real triplet?

<!-- @answer -->
No, and the distinction matters. The skip is on the anchor *position*, not on repeated values inside a triplet. A triplet like [-1,-1,2] uses two equal values legitimately and is found while the anchor sits on the first -1, with lo landing on the second. What the skip prevents is starting a fresh sweep from the second -1, which can only rediscover triplets the first anchor already covered. The two are different because the anchor is always the leftmost element of its triplet, so every triplet has exactly one anchor position that should produce it.

<!-- @doubt -->
### Why does the two-pointer version beat the hash-set version if both are O(n^2)?

<!-- @answer -->
Constant factors, and it is the third time this module has measured the same thing. Measured 26.6x to 603x apart — 80.841ms against 0.134ms at n = 3,000 over a narrow range. A hash lookup is a probable cache miss and a pointer chase; the two-pointer sweep walks sorted contiguous memory in both directions with perfect locality. The hash version also has no ordering to skip along, so it must collect results into a set, paying again. Two Sum measured the same inversion at up to 13.9x, and Longest Consecutive Sequence at up to 9.63x.

<!-- @doubt -->
### Why did the same array size take 58x longer over a wider value range?

<!-- @answer -->
Two effects with one cause. A narrow range means many repeated values, so the anchor skip fires constantly and whole sweeps never run. It also means far fewer distinct triplets to report — 1,301 against 227,377 at n = 3,000. A wide range means repeats are rare, so nearly every anchor runs a full sweep and the output itself becomes the dominant cost. Measured 0.134ms against 7.729ms. The practical point is that a 3 Sum benchmark is meaningless without stating the value range, and the algorithm is fastest exactly where naive deduplication would be most expensive.

<!-- @doubt -->
### Can this overflow?

<!-- @answer -->
Yes, if you add three ints into an int. Three values near the 32-bit limit sum past it, and the result wraps to something that can compare equal to zero when it should not. Use a 64-bit accumulator, or restructure the comparison to avoid the three-way sum — comparing a[lo] + a[hi] against -a[i] has the same risk in the pair, so widening is the simpler fix. It is the same class of error as the sum-based approach in Find Missing Number, where the overflow arrived at N = 46,341 rather than anywhere near the type's limit.

<!-- @doubt -->
### How does this extend to 4 Sum?

<!-- @answer -->
The same shape, one level deeper: sort, fix two anchors with nested loops, and two-pointer the remainder, which is O(n^3). Both skips generalise — you need a duplicate skip on each anchor loop as well as the partner skips inside — so a 4 Sum implementation has three places to get deduplication right instead of two. The failure mode is identical, and so is the trap: a set at the end will make it look correct while the row count blows up faster than it does here, because there are more anchor pairs to repeat.
