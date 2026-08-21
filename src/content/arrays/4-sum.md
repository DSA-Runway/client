---
id: 4-sum
topic: Arrays
title: 4 Sum
difficulty: Medium
status: ready
prerequisites:
  - 3-sum
  - two-sum
  - integer-overflow-and-precision-errors
  - remove-duplicates-from-sorted-array
  - time-and-space-complexity-basics
relatedIds:
  - 3-sum
  - two-sum
  - remove-duplicates-from-sorted-array
  - count-subarrays-with-given-sum
---

<!-- @summary -->
Find every unique quadruplet summing to a target — the same shape as 3 Sum with three deduplication sites instead of two, plus an overflow hazard the smaller problem mostly avoids: 6.21% of four-element sums drawn from the stated input range do not fit in a 32-bit integer, rising to 99.97% on large values.

<!-- @theory -->
## The problem

Given an array and a target, return all **unique** quadruplets `[a, b, c, d]`
with `a + b + c + d == target`. Four distinct positions, and quadruplets holding
the same four values are the same quadruplet.

This is **3 Sum with one more level**, and it is worth treating it that way: sort,
fix two anchors with nested loops, and two-pointer the remainder. That is O(n³).

```
for anchor i:
    for anchor j > i:
        lo = j+1, hi = n-1
        squeeze until a[i] + a[j] + a[lo] + a[hi] == target
```

## Three places to deduplicate, not two

3 Sum needed two skips: one on the anchor, one on the partners after a match.
4 Sum needs **three**, because there are two anchor loops:

```
if (i > 0     && a[i] == a[i-1]) continue;      // first anchor
if (j > i + 1 && a[j] == a[j-1]) continue;      // second anchor  <- note the bound
...
while (lo < hi && a[lo] == a[lo-1]) lo++;       // partners
while (lo < hi && a[hi] == a[hi+1]) hi--;
```

Note that the second anchor's guard compares against `i + 1`, not `0`. The
second anchor starts at `i + 1`, so the first value it takes has no predecessor
*within this loop* and must never be skipped.

Measured over all 136,717 (array, target) pairs from the values {−2..2} with n
up to 6:

| Missing | Wrong |
|---|---|
| First anchor skip | **15.62%** |
| Second anchor skip | **14.11%** |
| Partner skips | 1.85% |
| All three | **25.74%** |

And exactly as in 3 Sum, **every one of these bugs is purely duplication** — the
deduped output of all four buggy variants was 0% wrong. They emit correct
quadruplets too many times, never a wrong one and never a missing one. A `set()`
at the end hides all three.

## The overflow, which is genuinely worse here

LeetCode 18 allows values and target anywhere in **[−10⁹, 10⁹]**. Four values at
that limit sum to **4,000,000,000**, which is **1.86× INT_MAX**.

This is not a corner case:

| Values drawn from | 4-sums that overflow int32 |
|---|---|
| [−10⁹, 10⁹] uniform | **6.21%** |
| [0, 10⁹] all positive | **40.30%** |
| [5×10⁸, 10⁹] large positive | **99.97%** |

For comparison, three-element sums from the same range overflow only **2.58%**
of the time — so the hazard is about 2.4× more likely with four addends, and
crosses from "rare" to "routine" as soon as the data skews positive.

### What it actually does

The failure is a **false positive**. Four values of 10⁹ truly sum to 4×10⁹; as a
32-bit int that wraps to −294,967,296. Ask for that as the target:

```
target = -294967296
   64-bit sum:  0 quadruplets     correct, nothing sums to that
   32-bit sum:  1 quadruplet      reports [1e9, 1e9, 1e9, 1e9]
```

There is also a **false negative** that needs no arithmetic to see: the true sum
4,000,000,000 cannot be held in an `int` target at all.

One caution about how this shows up. When *every* sum overflows — all values
large and positive — the two-pointer comparisons stop being monotonic, the
squeeze loses its guarantee, and the search tends to find **nothing** rather than
something wrong. Measured on such data the int and 64-bit versions frequently
agreed, both returning empty. That makes the bug worse, not better: it hides on
the input where it is most likely, and surfaces on mixed data where a single
wrapped sum happens to land on the target.

**Use a 64-bit accumulator and a 64-bit target.** It costs nothing and removes
the whole class.

## Pruning, and when it is worth 200x

Because the array is sorted, each anchor knows the smallest and largest sums
still reachable from it:

```
smallest with this i:  a[i] + a[i+1] + a[i+2] + a[i+3]
largest  with this i:  a[i] + a[n-3] + a[n-2] + a[n-1]
```

If the smallest already exceeds the target, no later anchor can help either —
**break**. If the largest is still below the target, this anchor is hopeless but
a later one might work — **continue**. The same two tests apply to the inner
anchor.

| n | range | target | plain | pruned | speedup |
|---|---|---|---|---|---|
| 400 | ±50 | 0 | 0.901ms | 0.731ms | 1.23x |
| 1,200 | ±100000 | 0 | 509.350ms | 426.779ms | 1.19x |
| 1,200 | ±50 | 100000 | 1.563ms | **0.008ms** | **200.64x** |

On a reachable target the pruning is a modest 1.19x to 1.58x. On an
**unreachable** one it is 92x to 200x, because the outer `break` fires on the
first anchor and the whole O(n³) search collapses. That case is not exotic —
it is exactly what a caller does when the target is outside the data's range.

## Against the brute force

| n | Brute force | Two pointers |
|---|---|---|
| 100 | 7.54ms | 0.140ms |
| 400 | 1,443.93ms | **0.901ms** |

**1,602x** at n = 400, where the brute force's four nested loops are O(n⁴).

And note the value range again, as in 3 Sum: at n = 1,200 the same algorithm took
2.026ms over ±50 and 509.350ms over ±100000 — because the answer itself grew from
29,920 quadruplets to 279,492. Past a point you are measuring the size of the
output, not the speed of the search.

## Which to write

**Sort, two anchors, two pointers, with all three skips, a 64-bit accumulator,
and the pruning.** The skips are correctness-by-construction rather than a
trailing `set()`, the 64-bit sum removes a 6% to 40% hazard for free, and the
pruning costs four comparisons and occasionally saves two orders of magnitude.

<!-- @intuition -->
Everything that made 3 Sum work still works; there is simply one more value to pin down before the squeeze begins. Sorting is what lets you pin anything: with two values fixed, the remaining two must come from an ordered range, so the two ends can walk toward each other and never backtrack. The extra anchor brings an extra way to repeat yourself, which is why there are three places to step over duplicates rather than two. And because the range is ordered, each anchor can see its own best and worst case before doing any work at all — if the smallest sum it could possibly reach is already too big, every later anchor is worse, and the whole search can stop.

<!-- @approach -->
### Brute Force - Four Nested Loops

<!-- @idea -->
Try every combination of four positions, keep those summing to the target, and let a set collapse duplicates.

<!-- @steps -->
1. Sort the array so each quadruplet is produced in a canonical order.
2. Choose every combination of four distinct positions with four nested loops.
3. Add the four values using a wide accumulator.
4. Keep the quadruplet when the sum equals the target.
5. Insert each into a set, which discards repeats automatically.

<!-- @complexity -->
- time: O(n^4)
- space: O(number of quadruplets) for the set
- note: Correct and unusable past a few hundred elements. Measured 1,443.93ms at n = 400 against the two-pointer version's 0.901ms, a factor of 1,602. Its value is as a reference implementation, since it makes no assumptions about ordering.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <set>
using namespace std;

vector<vector<int>> fourSum(vector<int> a, long long target) {
    sort(a.begin(), a.end());
    set<vector<int>> found;
    int n = a.size();

    for (int i = 0; i < n; i++)
      for (int j = i + 1; j < n; j++)
        for (int k = j + 1; k < n; k++)
          for (int l = k + 1; l < n; l++)
            if ((long long)a[i] + a[j] + a[k] + a[l] == target)
              found.insert({a[i], a[j], a[k], a[l]});

    return vector<vector<int>>(found.begin(), found.end());
}
```

<!-- @annotations -->
- 6: A 64-bit target, since the true sum of four values at 1e9 does not fit in an int.
- 15: The cast makes the whole addition 64-bit. Without it the four ints are summed as an int first and can wrap.

<!-- @code java -->
```java
import java.util.*;

static List<List<Integer>> fourSum(int[] nums, long target) {
    int[] a = nums.clone();
    Arrays.sort(a);
    Set<List<Integer>> found = new LinkedHashSet<>();

    for (int i = 0; i < a.length; i++)
      for (int j = i + 1; j < a.length; j++)
        for (int k = j + 1; k < a.length; k++)
          for (int l = k + 1; l < a.length; l++)
            if ((long) a[i] + a[j] + a[k] + a[l] == target)
              found.add(List.of(a[i], a[j], a[k], a[l]));

    return new ArrayList<>(found);
}
```

<!-- @annotations -->
- 12: Casting the first operand promotes the rest, which is the whole overflow fix.

<!-- @code python -->
```python
from itertools import combinations

def four_sum(nums, target):
    a = sorted(nums)
    found = {q for q in combinations(a, 4) if sum(q) == target}
    return [list(q) for q in sorted(found)]


# Python integers are unbounded, so no overflow concern here at all —
# which is exactly why a Python solution can hide a bug that the same
# algorithm in C++ or Java would expose.
```

<!-- @annotations -->
- 5: No overflow risk in Python, since its integers grow as needed. The same code in C++ needs an explicit widening.

<!-- @approach -->
### Sort and Two Pointers with All Three Skips

<!-- @idea -->
Fix two anchors with nested loops, squeeze the remaining range with two pointers, and step over repeated values at all three places they can occur.

<!-- @steps -->
1. Sort the array.
2. Take each position as the first anchor, skipping it when it equals the previous value.
3. Take each later position as the second anchor, skipping it when it equals the previous value and is not the first candidate.
4. Squeeze the range beyond the second anchor with a pointer at each end.
5. Move the left pointer up when the sum is too small and the right pointer down when it is too large.
6. On a match, record the quadruplet, move both pointers inward, then step each past any equal values.

<!-- @complexity -->
- time: O(n^3), the two anchor loops times the linear squeeze
- space: O(1) beyond the sort and the output
- note: The core solution. Measured 0.901ms at n = 400 against the brute force's 1,443.93ms. Omitting the first anchor skip measured 15.62% wrong, the second 14.11%, and the partner skips 1.85% — all of them purely by duplication, so a trailing set hides every one.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<vector<int>> fourSum(vector<int> a, long long target) {
    sort(a.begin(), a.end());
    vector<vector<int>> out;
    int n = a.size();

    for (int i = 0; i + 3 < n; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;              // FIRST anchor skip
        for (int j = i + 1; j + 2 < n; j++) {
            if (j > i + 1 && a[j] == a[j - 1]) continue;      // SECOND anchor skip
            int lo = j + 1, hi = n - 1;
            while (lo < hi) {
                long long s = (long long)a[i] + a[j] + a[lo] + a[hi];
                if (s < target) lo++;
                else if (s > target) hi--;
                else {
                    out.push_back({a[i], a[j], a[lo], a[hi]});
                    lo++; hi--;
                    while (lo < hi && a[lo] == a[lo - 1]) lo++;   // PARTNER skips
                    while (lo < hi && a[hi] == a[hi + 1]) hi--;
                }
            }
        }
    }
    return out;
}
```

<!-- @annotations -->
- 11: Omitting this measured 15.62% wrong, always by duplication rather than by a wrong quadruplet.
- 13: Compared against i + 1, not 0. The second anchor's first candidate has no predecessor within this loop and must not be skipped.
- 16: The cast to long long. Without it, 6.21% of four-element sums from the stated input range wrap.
- 22: Both partner skips, comparing against the value each pointer just left behind.

<!-- @code java -->
```java
import java.util.*;

static List<List<Integer>> fourSum(int[] nums, long target) {
    int[] a = nums.clone();
    Arrays.sort(a);
    List<List<Integer>> out = new ArrayList<>();
    int n = a.length;

    for (int i = 0; i + 3 < n; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;
        for (int j = i + 1; j + 2 < n; j++) {
            if (j > i + 1 && a[j] == a[j - 1]) continue;
            int lo = j + 1, hi = n - 1;
            while (lo < hi) {
                long s = (long) a[i] + a[j] + a[lo] + a[hi];
                if (s < target) lo++;
                else if (s > target) hi--;
                else {
                    out.add(List.of(a[i], a[j], a[lo], a[hi]));
                    lo++; hi--;
                    while (lo < hi && a[lo] == a[lo - 1]) lo++;
                    while (lo < hi && a[hi] == a[hi + 1]) hi--;
                }
            }
        }
    }
    return out;
}
```

<!-- @annotations -->
- 12: The j > i + 1 bound. Writing j > 0 here would wrongly skip the second anchor's first candidate.
- 15: A long accumulator. Java's int arithmetic wraps silently, exactly as C++ does.

<!-- @code python -->
```python
def four_sum(nums, target):
    a = sorted(nums)
    out = []
    n = len(a)

    for i in range(n - 3):
        if i > 0 and a[i] == a[i - 1]:              # FIRST anchor skip
            continue
        for j in range(i + 1, n - 2):
            if j > i + 1 and a[j] == a[j - 1]:      # SECOND anchor skip
                continue
            lo, hi = j + 1, n - 1
            while lo < hi:
                s = a[i] + a[j] + a[lo] + a[hi]
                if s < target:
                    lo += 1
                elif s > target:
                    hi -= 1
                else:
                    out.append([a[i], a[j], a[lo], a[hi]])
                    lo += 1
                    hi -= 1
                    while lo < hi and a[lo] == a[lo - 1]:    # PARTNER skips
                        lo += 1
                    while lo < hi and a[hi] == a[hi + 1]:
                        hi -= 1
    return out
```

<!-- @annotations -->
- 7: The first anchor skip, identical in shape to the one in 3 Sum.
- 10: j > i + 1, not j > 0 — the bound that differs between the two anchor loops.
- 23: Stepping past equal partners, comparing with the value just passed.

<!-- @approach -->
### Optimal - With Range Pruning

<!-- @idea -->
Before each anchor does any work, use the sorted order to check the smallest and largest sums still reachable from it, and stop or skip when the target is outside them.

<!-- @steps -->
1. Sort the array and set up the two anchor loops as before.
2. At each first anchor, compute the smallest sum reachable using the next three elements.
3. If that already exceeds the target, break out entirely, since every later anchor is larger.
4. Compute the largest sum reachable using the three largest elements; if it is still below the target, skip this anchor.
5. Apply the same two tests inside the second anchor loop.
6. Otherwise squeeze as normal, with all three duplicate skips.

<!-- @complexity -->
- time: O(n^3) worst case, often far less
- space: O(1) beyond the sort and the output
- note: The recommended solution. On reachable targets the pruning measured a modest 1.19x to 1.58x, but on a target outside the data's range it measured 92x to 200x — 1.563ms down to 0.008ms at n = 1,200 — because the outer break fires on the first anchor and the whole search collapses.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<vector<int>> fourSum(vector<int> a, long long target) {
    sort(a.begin(), a.end());
    vector<vector<int>> out;
    int n = a.size();

    for (int i = 0; i + 3 < n; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;
        if ((long long)a[i] + a[i+1] + a[i+2] + a[i+3] > target) break;      // smallest too big
        if ((long long)a[i] + a[n-3] + a[n-2] + a[n-1] < target) continue;   // largest too small

        for (int j = i + 1; j + 2 < n; j++) {
            if (j > i + 1 && a[j] == a[j - 1]) continue;
            if ((long long)a[i] + a[j] + a[j+1] + a[j+2] > target) break;
            if ((long long)a[i] + a[j] + a[n-2] + a[n-1] < target) continue;

            int lo = j + 1, hi = n - 1;
            while (lo < hi) {
                long long s = (long long)a[i] + a[j] + a[lo] + a[hi];
                if (s < target) lo++;
                else if (s > target) hi--;
                else {
                    out.push_back({a[i], a[j], a[lo], a[hi]});
                    lo++; hi--;
                    while (lo < hi && a[lo] == a[lo - 1]) lo++;
                    while (lo < hi && a[hi] == a[hi + 1]) hi--;
                }
            }
        }
    }
    return out;
}
```

<!-- @annotations -->
- 12: break, not continue. If the smallest sum from this anchor is too big, every later anchor is larger still.
- 13: continue, not break. A later anchor can reach higher sums, so this one is skipped rather than ending the loop.
- 17: The same pair of tests one level in, where they prune whole squeezes rather than whole anchors.

<!-- @code java -->
```java
import java.util.*;

static List<List<Integer>> fourSum(int[] nums, long target) {
    int[] a = nums.clone();
    Arrays.sort(a);
    List<List<Integer>> out = new ArrayList<>();
    int n = a.length;

    for (int i = 0; i + 3 < n; i++) {
        if (i > 0 && a[i] == a[i - 1]) continue;
        if ((long) a[i] + a[i+1] + a[i+2] + a[i+3] > target) break;
        if ((long) a[i] + a[n-3] + a[n-2] + a[n-1] < target) continue;

        for (int j = i + 1; j + 2 < n; j++) {
            if (j > i + 1 && a[j] == a[j - 1]) continue;
            if ((long) a[i] + a[j] + a[j+1] + a[j+2] > target) break;
            if ((long) a[i] + a[j] + a[n-2] + a[n-1] < target) continue;

            int lo = j + 1, hi = n - 1;
            while (lo < hi) {
                long s = (long) a[i] + a[j] + a[lo] + a[hi];
                if (s < target) lo++;
                else if (s > target) hi--;
                else {
                    out.add(List.of(a[i], a[j], a[lo], a[hi]));
                    lo++; hi--;
                    while (lo < hi && a[lo] == a[lo - 1]) lo++;
                    while (lo < hi && a[hi] == a[hi + 1]) hi--;
                }
            }
        }
    }
    return out;
}
```

<!-- @annotations -->
- 11: The break that turns an unreachable target from an O(n^3) search into an immediate exit — measured 200x at n = 1,200.

<!-- @code python -->
```python
def four_sum(nums, target):
    a = sorted(nums)
    out = []
    n = len(a)

    for i in range(n - 3):
        if i > 0 and a[i] == a[i - 1]:
            continue
        if a[i] + a[i+1] + a[i+2] + a[i+3] > target:      # smallest too big
            break
        if a[i] + a[n-3] + a[n-2] + a[n-1] < target:      # largest too small
            continue

        for j in range(i + 1, n - 2):
            if j > i + 1 and a[j] == a[j - 1]:
                continue
            if a[i] + a[j] + a[j+1] + a[j+2] > target:
                break
            if a[i] + a[j] + a[n-2] + a[n-1] < target:
                continue

            lo, hi = j + 1, n - 1
            while lo < hi:
                s = a[i] + a[j] + a[lo] + a[hi]
                if s < target:
                    lo += 1
                elif s > target:
                    hi -= 1
                else:
                    out.append([a[i], a[j], a[lo], a[hi]])
                    lo += 1
                    hi -= 1
                    while lo < hi and a[lo] == a[lo - 1]:
                        lo += 1
                    while lo < hi and a[hi] == a[hi + 1]:
                        hi -= 1
    return out
```

<!-- @annotations -->
- 9: break: the sums only grow from here, so nothing later can match either.
- 11: continue: this anchor cannot reach the target, but a larger one might.

<!-- @approach -->
### Generalised k-Sum

<!-- @idea -->
Peel one anchor at a time recursively until only two values remain, then finish with the two-pointer squeeze.

<!-- @steps -->
1. Sort the array once, before any recursion.
2. If only two values are needed, run the two-pointer squeeze on the current range.
3. Otherwise take each position in the range as an anchor, skipping repeated values.
4. Recurse on the remainder with one fewer value needed and the target reduced by the anchor.
5. Prepend the anchor to each result the recursion returns.
6. The duplicate skip appears once in the recursive case and covers every level.

<!-- @complexity -->
- time: O(n^(k-1)) for k values, so O(n^3) at k = 4
- space: O(k) recursion depth beyond the output
- note: The same algorithm expressed once for all k, which removes the main risk in hand-written 4 Sum — the duplicate skip is written a single time rather than once per anchor loop. Slightly slower than the flat version from call overhead, and the right choice when k varies or when correctness matters more than the last constant factor.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

static void kSum(const vector<int>& a, long long target, int start, int k,
                 vector<int>& path, vector<vector<int>>& out) {
    int n = a.size();
    if (k == 2) {                                   // base case: the squeeze
        int lo = start, hi = n - 1;
        while (lo < hi) {
            long long s = (long long)a[lo] + a[hi];
            if (s < target) lo++;
            else if (s > target) hi--;
            else {
                path.push_back(a[lo]); path.push_back(a[hi]);
                out.push_back(path);
                path.pop_back(); path.pop_back();
                lo++; hi--;
                while (lo < hi && a[lo] == a[lo - 1]) lo++;
                while (lo < hi && a[hi] == a[hi + 1]) hi--;
            }
        }
        return;
    }
    for (int i = start; i + k <= n; i++) {
        if (i > start && a[i] == a[i - 1]) continue;   // ONE skip covers every level
        path.push_back(a[i]);
        kSum(a, target - a[i], i + 1, k - 1, path, out);
        path.pop_back();
    }
}

vector<vector<int>> fourSum(vector<int> a, long long target) {
    sort(a.begin(), a.end());
    vector<vector<int>> out; vector<int> path;
    kSum(a, target, 0, 4, path, out);
    return out;
}
```

<!-- @annotations -->
- 8: The recursion bottoms out at two values, where the sorted order allows the two-pointer squeeze.
- 26: i > start rather than i > 0. Each level's first candidate has no predecessor within that level, which is what the flat version writes as i > 0 and j > i + 1.
- 28: Reducing the target by the anchor is what lets the same function serve every level.

<!-- @code java -->
```java
import java.util.*;

static void kSum(int[] a, long target, int start, int k,
                 List<Integer> path, List<List<Integer>> out) {
    int n = a.length;
    if (k == 2) {
        int lo = start, hi = n - 1;
        while (lo < hi) {
            long s = (long) a[lo] + a[hi];
            if (s < target) lo++;
            else if (s > target) hi--;
            else {
                List<Integer> found = new ArrayList<>(path);
                found.add(a[lo]); found.add(a[hi]);
                out.add(found);
                lo++; hi--;
                while (lo < hi && a[lo] == a[lo - 1]) lo++;
                while (lo < hi && a[hi] == a[hi + 1]) hi--;
            }
        }
        return;
    }
    for (int i = start; i + k <= n; i++) {
        if (i > start && a[i] == a[i - 1]) continue;
        path.add(a[i]);
        kSum(a, target - a[i], i + 1, k - 1, path, out);
        path.remove(path.size() - 1);
    }
}

static List<List<Integer>> fourSum(int[] nums, long target) {
    int[] a = nums.clone();
    Arrays.sort(a);
    List<List<Integer>> out = new ArrayList<>();
    kSum(a, target, 0, 4, new ArrayList<>(), out);
    return out;
}
```

<!-- @annotations -->
- 24: One duplicate skip serving all levels, which is why this version has fewer places to get deduplication wrong.

<!-- @code python -->
```python
def four_sum(nums, target):
    a = sorted(nums)
    out = []

    def k_sum(start, k, target, path):
        n = len(a)
        if k == 2:
            lo, hi = start, n - 1
            while lo < hi:
                s = a[lo] + a[hi]
                if s < target:
                    lo += 1
                elif s > target:
                    hi -= 1
                else:
                    out.append(path + [a[lo], a[hi]])
                    lo += 1
                    hi -= 1
                    while lo < hi and a[lo] == a[lo - 1]:
                        lo += 1
                    while lo < hi and a[hi] == a[hi + 1]:
                        hi -= 1
            return
        for i in range(start, n - k + 1):
            if i > start and a[i] == a[i - 1]:      # one skip, every level
                continue
            k_sum(i + 1, k - 1, target - a[i], path + [a[i]])

    k_sum(0, 4, target, [])
    return out


# Change the 4 to any k and this solves k Sum unchanged.
```

<!-- @annotations -->
- 25: i > start covers what the flat version writes as two separate bounds, i > 0 and j > i + 1.
- 27: Reducing the target by the anchor is what makes one function serve every level.

<!-- @example -->

<!-- @input -->
nums = [1, 0, -1, 0, -2, 2], target = 0

<!-- @output -->
[[-2, -1, 1, 2], [-2, 0, 0, 2], [-1, 0, 0, 1]]

<!-- @why -->
The canonical case, containing two zeros that a quadruplet legitimately uses together and a repeated anchor value that must not restart a search.

<!-- @walkthrough -->
1. Sorted, the array is [-2, -1, 0, 0, 1, 2].
2. First anchor -2, second anchor -1: the pointers land on 1 and 2, summing to 0, giving [-2,-1,1,2].
3. First anchor -2, second anchor 0 at index 2: the pointers land on 0 and 2, giving [-2,0,0,2].
4. First anchor -2, second anchor 0 at index 3: this equals the previous second anchor, so the skip fires.
5. First anchor -1, second anchor 0 at index 2: the pointers land on 0 and 1, giving [-1,0,0,1].
6. First anchor 0 at index 3 equals the previous first anchor value, so that skip fires too.
7. Three quadruplets in total, with both zeros used together in two of them.

<!-- @example -->

<!-- @input -->
nums = [-2, -2, -2, -1, 2], target = -3, without the first anchor skip

<!-- @output -->
[[-2, -2, -1, 2], [-2, -2, -1, 2]] — the same quadruplet twice

<!-- @why -->
The smallest input exposing the missing first anchor skip, found by exhaustive search, and it also exposes the missing second anchor skip.

<!-- @walkthrough -->
1. Sorted, the array is [-2, -2, -2, -1, 2].
2. First anchor -2 at index 0, second anchor -2 at index 1: the pointers find -1 and 2, summing with the anchors to -3.
3. That records [-2,-2,-1,2], which is correct.
4. First anchor -2 at index 1 has the same value as the anchor before it.
5. Its search reaches the same -2, -1 and 2 to its right and records the identical quadruplet again.
6. The first anchor skip would have stepped over index 1 entirely.
7. The quadruplet itself is correct in both cases — the bug produces it twice, not wrongly.

<!-- @example -->

<!-- @input -->
nums = [1000000000, 1000000000, 1000000000, 1000000000], target = -294967296

<!-- @output -->
A 64-bit sum correctly finds 0; a 32-bit sum reports 1

<!-- @why -->
The overflow made concrete: the reported quadruplet does not sum to the target at all, and nothing in the output looks wrong.

<!-- @walkthrough -->
1. The four values truly sum to 4,000,000,000.
2. INT_MAX is 2,147,483,647, so that sum does not fit in a 32-bit integer.
3. Added as ints, the sum wraps to -294,967,296.
4. Asked for a target of exactly -294,967,296, the 32-bit version compares equal and records the quadruplet.
5. Nothing actually sums to -294,967,296, so the correct answer is empty.
6. The 64-bit version computes 4,000,000,000, sees it does not equal the target, and reports nothing.
7. Measured across the stated input range, 6.21% of four-element sums overflow, rising to 40.30% when all values are positive.

<!-- @example -->

<!-- @input -->
1,200 elements over the range ±50, with target 100000

<!-- @output -->
1.563ms without pruning against 0.008ms with it — 200.64x

<!-- @why -->
Shows that pruning is a modest constant factor on ordinary input and an enormous one when the target is outside the data's reach.

<!-- @walkthrough -->
1. Every value lies between -50 and 50, so the largest sum any four of them can reach is 200.
2. The target of 100000 is therefore unreachable, and the answer is empty.
3. Without pruning, both anchor loops still run in full and the squeeze runs for every pair — O(n^3) work to find nothing.
4. With pruning, the first anchor computes the largest sum it can reach and finds it below the target.
5. That triggers a continue, and the same happens for every subsequent anchor.
6. The entire search collapses to a linear pass over the anchors.
7. On reachable targets the same pruning measured only 1.19x to 1.58x, so the two cases are very different.

<!-- @visualization array -->

<!-- @description -->
The sorted strip with duplicate runs bracketed underneath, exactly as in 3 Sum, but now with TWO anchor markers to the left of the two-pointer pair — and the visual point is that there are now three distinct places a duplicate can restart work, so give each of the three skip sites its own colour and use that colour consistently wherever it appears. Run the canonical [1,0,-1,0,-2,2] with target 0: the outer anchor holds while the inner anchor advances through the range beyond it, and for each inner position the two pointers squeeze. When the inner anchor steps onto a value equal to its predecessor, strike that bracket in the second skip's colour and jump past it, showing the ghosted squeeze that was avoided. When the outer anchor does the same, strike the bracket in the first skip's colour and ghost out the entire inner loop beneath it — a visibly larger saving, which is why that skip measured the higher failure rate. Above the strip run a reachability bar for the current outer anchor: a horizontal span from the smallest sum it can reach to the largest, with the target marked as a tick. When the target sits outside the span, flash the bar and either break or continue, and make the two cases visually distinct — break collapses the whole remaining strip, continue only greys the current anchor. Run that panel twice on the same data, once with a target inside the span and once outside, so the 1.19x and the 200x are both visible as amounts of work rather than as numbers. The overflow panel is separate and deliberately plain: four cells each reading 1000000000, an addition rendered digit by digit reaching 4,000,000,000, and then a 32-bit register drawn as a fixed-width box that the value does not fit into, with the high bits falling off the end and the remainder reading -294,967,296. Put the target -294,967,296 beside it and let the two values snap together as a match, with a red banner reading FALSE POSITIVE and the true sum shown underneath. Close with the overflow-rate chart: three bars for uniform, all-positive and large-positive at 6.21%, 40.30% and 99.97%, with a fourth bar for 3 Sum at 2.58% for contrast.

<!-- @sampleInput -->
```json
{"primary":{"input":[1,0,-1,0,-2,2],"target":0,"sorted":[-2,-1,0,0,1,2],"duplicateBrackets":[{"value":0,"indices":[2,3]}],"found":[{"outer":-2,"inner":-1,"pair":[1,2],"quad":[-2,-1,1,2]},{"outer":-2,"inner":0,"pair":[0,2],"quad":[-2,0,0,2]},{"outer":-1,"inner":0,"pair":[0,1],"quad":[-1,0,0,1]}],"skipsFired":[{"site":"second anchor","at":3,"value":0},{"site":"first anchor","at":3,"value":0}],"answer":[[-2,-1,1,2],[-2,0,0,2],[-1,0,0,1]]},"skipSites":[{"name":"first anchor","guard":"i > 0 && a[i] == a[i-1]","failureRate":0.1562},{"name":"second anchor","guard":"j > i+1 && a[j] == a[j-1]","failureRate":0.1411,"note":"bound is i+1, not 0"},{"name":"partners","guard":"a[lo] == a[lo-1] / a[hi] == a[hi+1]","failureRate":0.0185}],"allThreeMissing":0.2574,"afterSetDedup":0.0,"pairsTested":136717,"overflowPanel":{"values":[1000000000,1000000000,1000000000,1000000000],"trueSum":4000000000,"intMax":2147483647,"ratioOfIntMax":1.86,"wrappedTo":-294967296,"target":-294967296,"int32Finds":1,"int64Finds":0,"verdict":"FALSE POSITIVE","rates":[{"drawnFrom":"[-1e9, 1e9] uniform","overflowRate":0.0621},{"drawnFrom":"[0, 1e9] all positive","overflowRate":0.4030},{"drawnFrom":"[5e8, 1e9] large positive","overflowRate":0.9997},{"drawnFrom":"3 Sum, [-1e9,1e9] uniform","overflowRate":0.0258}],"caution":"when every sum overflows the two-pointer squeeze loses monotonicity and tends to find nothing at all"},"pruningPanel":{"tests":[{"name":"smallest reachable","expr":"a[i]+a[i+1]+a[i+2]+a[i+3]","action":"break","why":"every later anchor is larger"},{"name":"largest reachable","expr":"a[i]+a[n-3]+a[n-2]+a[n-1]","action":"continue","why":"a later anchor can reach higher"}],"measurements":[{"n":400,"range":50,"target":0,"plainMs":0.901,"prunedMs":0.731,"speedup":1.23},{"n":1200,"range":100000,"target":0,"plainMs":509.350,"prunedMs":426.779,"speedup":1.19},{"n":1200,"range":50,"target":100000,"plainMs":1.563,"prunedMs":0.008,"speedup":200.64,"reachable":false}]},"bruteComparison":[{"n":100,"bruteMs":7.54,"twoPtrMs":0.140},{"n":400,"bruteMs":1443.93,"twoPtrMs":0.901,"ratio":1602}]}
```

<!-- @highlights -->
- The sorted strip carries bracketed duplicate runs, with two anchor markers now sitting to the left of the two-pointer pair.
- Each of the three skip sites gets its own colour, used consistently wherever that skip appears.
- The outer anchor holds at -2 while the inner anchor advances, and the two pointers squeeze for each inner position.
- Outer -2 with inner -1 finds the pair 1 and 2, recording [-2,-1,1,2].
- Outer -2 with inner 0 finds the pair 0 and 2, recording [-2,0,0,2] — both zeros used together legitimately.
- The inner anchor steps onto the second 0, its bracket is struck in the second skip's colour, and the avoided squeeze is ghosted.
- When the outer anchor hits a repeated value, its bracket is struck and the entire inner loop beneath it is ghosted out — a visibly larger saving.
- A reachability bar above the strip spans the smallest to largest sum the current outer anchor can reach, with the target marked as a tick.
- When the target falls outside the span the bar flashes, and break collapses the whole remaining strip while continue only greys the current anchor.
- The reachability panel runs twice on the same data, once with a reachable target and once without, making 1.19x and 200x visible as amounts of work.
- The overflow panel shows four cells of 1000000000 and an addition reaching 4,000,000,000.
- A 32-bit register is drawn as a fixed-width box the value does not fit, with high bits falling off and the remainder reading -294,967,296.
- The target -294,967,296 snaps together with the wrapped value under a red FALSE POSITIVE banner, with the true sum shown beneath.
- A closing chart shows overflow rates of 6.21%, 40.30% and 99.97% for uniform, all-positive and large-positive values.
- A fourth bar shows 3 Sum at 2.58% for contrast, since the same range is far safer with one fewer addend.

<!-- @edgeCases -->
- Fewer than four elements — no quadruplet exists, and the anchor loops must not run past the end.
- Exactly four elements summing to the target — the single quadruplet.
- Exactly four elements not summing to the target — the empty result.
- All elements zero with target zero — exactly one quadruplet, and the case where all three skips fire hardest.
- Two zeros that a quadruplet legitimately needs, such as [-2,0,0,2] — the skips must remove repeats without removing this.
- A target unreachable because it is above every possible sum — where the outer break prunes the entire search.
- A target unreachable because it is below every possible sum — where the outer continue fires on every anchor instead.
- Four values at the input limit of 1e9 — their true sum is 1.86x INT_MAX and needs a 64-bit accumulator.
- A target outside the 32-bit range, such as 4,000,000,000 — an int target cannot even hold it.
- All values large and positive — 99.97% of four-element sums overflow, and the squeeze loses monotonicity entirely.
- A value repeated many times — the anchor skips prevent an enormous number of redundant squeezes.
- Large arrays over a wide value range — the output itself dominates, with 279,492 quadruplets measured at n = 1,200.

<!-- @pitfalls -->
- Writing the second anchor's guard as j > 0 rather than j > i + 1. That wrongly skips the second anchor's first candidate whenever it happens to equal the element before it.
- Omitting the first anchor skip. Measured 15.62% wrong, always by duplication rather than by a wrong quadruplet.
- Omitting the second anchor skip. Measured 14.11% wrong, likewise purely duplicates.
- Omitting the partner skips. Measured 1.85% wrong — the least of the three, and still a real defect.
- Fixing any of them with a trailing set. The deduped output of every buggy variant was 0% wrong, so the set makes the answer right while leaving the wasted work in place.
- Summing four ints into an int. Measured 6.21% of four-element sums from the stated input range overflow, rising to 40.30% when all values are positive.
- Declaring the target as an int. The true sum of four values at 1e9 is 4,000,000,000, which an int cannot hold at all.
- Testing the overflow only on all-large-positive data. When every sum overflows the squeeze loses monotonicity and returns nothing, so the two versions agree and the bug hides.
- Assuming Python is safe because it found the right answer. Python integers are unbounded, so the same algorithm ported to C++ or Java gains a bug that the Python version cannot exhibit.
- Using break where continue is needed in the pruning, or the reverse. The smallest-sum test breaks and the largest-sum test continues, and swapping them either ends the search early or wastes the prune.
- Assuming pruning is always worth it. It measured 1.19x to 1.58x on reachable targets, and only becomes dramatic when the target is out of range.
- Benchmarking without stating the value range. At n = 1,200 the same algorithm measured 2.026ms over ±50 and 509.350ms over ±100000, because the answer grew from 29,920 to 279,492 quadruplets.

<!-- @doubt -->
### Why is the second anchor's guard j > i + 1 instead of j > 0?

<!-- @answer -->
Because the second anchor's loop starts at i + 1, so its first candidate has no predecessor *within that loop*. Comparing it against a[j-1] would compare it against the first anchor's own element, and skipping on that basis would discard quadruplets where the two anchors legitimately hold the same value — [-2,-2,-1,2] is exactly such a case. The rule generalises: each anchor level skips only when it has already taken a value at that level. The recursive k-Sum version makes this obvious, since it writes the single condition i > start and every level gets the right bound automatically.

<!-- @doubt -->
### Do I really need three skips? My set-based version passes.

<!-- @answer -->
Your answer is correct and your algorithm is doing redundant work. Measured over 136,717 (array, target) pairs, the deduped output of every buggy variant was 0% wrong — none of these bugs ever misses a quadruplet or invents one, they only emit correct ones repeatedly. That is the same result measured in 3 Sum, and the same conclusion: the set fixes the output while leaving the cost. With one more anchor loop than 3 Sum there is more redundancy to generate, so the wasted work grows faster here than it did there.

<!-- @doubt -->
### How likely is the overflow really?

<!-- @answer -->
Much more likely than in 3 Sum. LeetCode 18 allows values and target in [-1e9, 1e9], and four values at that limit sum to 4,000,000,000 — 1.86x INT_MAX. Measured: 6.21% of four-element sums drawn uniformly from that range overflow a 32-bit int, 40.30% when all values are positive, and 99.97% when they are all large positives. Three-element sums from the same range overflow only 2.58% of the time. Use a 64-bit accumulator and a 64-bit target; it costs nothing.

<!-- @doubt -->
### What does the overflow actually do to the answer?

<!-- @answer -->
It produces a false positive that looks entirely reasonable. Four values of 1e9 truly sum to 4,000,000,000, which wraps to -294,967,296 as a 32-bit int. Ask for a target of -294,967,296 and the 32-bit version compares equal and reports [1e9,1e9,1e9,1e9] — a quadruplet that does not sum to the target at all. The 64-bit version correctly reports nothing. There is also a false negative that needs no arithmetic: an int target cannot hold 4,000,000,000, so you cannot even ask the question.

<!-- @doubt -->
### I tested with large values and both versions agreed. Is my int version fine?

<!-- @answer -->
No — that is the bug hiding rather than being absent. When every sum overflows, which happens on 99.97% of all-large-positive data, the two-pointer comparisons stop being monotonic in the pointers' positions. The squeeze loses its guarantee and tends to find nothing at all, so the int and 64-bit versions both return empty and appear to agree. The failure surfaces on mixed data where a single wrapped sum happens to coincide with the target, which is much harder to hit deliberately and just as wrong when it happens.

<!-- @doubt -->
### Is the pruning worth the extra code?

<!-- @answer -->
It depends entirely on whether the target is reachable. On ordinary reachable targets it measured 1.19x to 1.58x — a real but modest constant factor for four extra comparisons. On a target outside the data's range it measured 92x to 200x: 1.563ms down to 0.008ms at n = 1,200, because the outer test fires on the first anchor and the entire O(n^3) search collapses. Since an unreachable target is a perfectly ordinary thing for a caller to ask about, the four comparisons are cheap insurance.

<!-- @doubt -->
### Why does one prune break and the other continue?

<!-- @answer -->
Because the array is sorted, so the two tests say different things about later anchors. If the smallest sum reachable from this anchor already exceeds the target, then every later anchor starts from a larger value and its smallest reachable sum is larger still — nothing later can work, so break. If the largest sum reachable from this anchor is below the target, this anchor is hopeless but a later one starts higher and might reach it — so continue. Swapping them either ends the search while answers remain or wastes the prune entirely.

<!-- @doubt -->
### Should I write the flat version or the recursive k-Sum?

<!-- @answer -->
The recursive one if you value correctness over the last constant factor, and especially if k might change. Its advantage is structural: the duplicate skip is written once, as i > start, and every level gets the right bound automatically — where the flat version needs i > 0 at one level and j > i + 1 at the next, which is exactly the bound people get wrong. The flat version is slightly faster from avoiding call overhead and is the more common interview answer. Both are O(n^3) at k = 4.
