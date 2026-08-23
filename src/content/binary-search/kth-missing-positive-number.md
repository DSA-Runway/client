---
id: kth-missing-positive-number
topic: Binary Search
title: Kth Missing Positive Number
difficulty: Medium
status: ready
prerequisites:
  - lower-bound
  - search-insert-position
  - count-occurrences-in-a-sorted-array
relatedIds:
  - lower-bound
  - search-insert-position
  - find-missing-number
  - count-occurrences-in-a-sorted-array
  - koko-eating-bananas
---

<!-- @summary -->
The predicate stops simulating and becomes one subtraction: at index i exactly `arr[i] - (i + 1)` positive integers are missing below `arr[i]`, and that count only grows. The measured lesson is which mistakes hide — the two off-by-ones in the returned value are wrong on 100% of inputs and die on the first test, while the two inside the count are wrong on 17% and 21% and survive.

<!-- @theory -->
## The problem

Given a strictly increasing array of positive integers, find the kth positive
integer that is **not** in it.

```
arr = [2, 3, 4, 7, 11], k = 5   ->  9      missing are 1, 5, 6, 8, 9, ...
arr = [1, 2, 3, 4],     k = 2   ->  6      missing are 5, 6, 7, ...
arr = [2],              k = 1   ->  1
```

## The count of missing values is one subtraction

If the array held no gaps it would read 1, 2, 3, … so `arr[i]` would equal
`i + 1`. Every unit by which it exceeds that is a missing value:

```
arr    =  2   3   4   7   11
i + 1  =  1   2   3   4    5
missing=  1   1   1   3    6      <- arr[i] - (i + 1)
```

That count is non-decreasing, because a strictly increasing array satisfies
`arr[i+1] >= arr[i] + 1`, which gives `missing(i+1) >= missing(i)`. So it is a
monotone predicate and the answer is a lower bound over it: find the first index
where at least k values are missing.

## The answer is `lo + k`

Once the search settles, `lo` is the first index whose missing-count reaches k —
so `lo - 1` is the last index that is still short, and the answer lies just past
`arr[lo-1]`. Writing that out:

```
answer = arr[lo-1] + (k - missing(lo-1))
       = arr[lo-1] + k - (arr[lo-1] - lo)
       = lo + k
```

The `arr[lo-1]` cancels entirely, which is why the final line needs no array
access and no special case for `lo == 0`. Verified against the explicit
anchored form over 200,000 randomised inputs — **0 disagreements**.

It also handles the case where k exceeds everything the array is missing: then
`lo` runs to n and the answer is `n + k`, with no separate branch.

## Which off-by-one survives testing

This problem is unusually rich in one-character slips, and they fall into two
groups with very different consequences. Measured over every strictly increasing
array of length 1 to 5 drawn from `{1..9}`, with k from 1 to 12 — 4,572 cases:

| slip | wrong |
|---|---|
| `return hi + k` | **4,572 — 100.00%** |
| `return lo + k - 1` | **4,572 — 100.00%** |
| `missing = arr[mid] - mid` | 955 — **20.89%** |
| `missing <= k` instead of `<` | 792 — **17.32%** |

The two in the returned value are wrong on *every* input — including
`arr = [1], k = 1`, which returns 1 instead of 2. They cannot survive a single
test. (They are also the same bug written twice: the loop always exits with
`hi == lo - 1`.)

The two inside the count are wrong on roughly one input in five, which means four
in five pass. Those are the ones that reach production. It is worth noticing that
the harmless-looking mistakes here are the loud ones, and the subtle-looking
arithmetic is where the damage is.

The canonical form and the `lo < hi` lower-bound shape are both **0 wrong**.

## The linear versions win more often than you would expect

Two non-binary approaches are available. Walking the integers from 1 and counting
misses is O(n + k). Scanning the array and stopping at the first index whose
missing-count reaches k is O(n), but it returns early. Measured at n = 1,000 —
the problem's own limit:

| k | walk from 1 | scan the gaps | binary search | fastest |
|---|---|---|---|---|
| 1 | **3.6** | 3.8 | 45.4 | walk |
| 2 | 9.8 | **5.9** | 56.9 | scan |
| 5 | 16.5 | **8.7** | 50.8 | scan |
| 20 | 51.6 | **28.0** | 51.8 | scan |
| 50 | 141.4 | 66.7 | **52.6** | binary |
| 200 | 709.1 | 270.4 | **54.1** | binary |
| 1,000 | 7,869.8 | 1,234.4 | **40.8** | binary |

Nanoseconds per call. The binary search's cost barely moves with k — it is
O(log n) and k appears only in the final addition — while both scans grow with it.
The crossover sits near **k = 35**.

Since the problem caps both n and k at 1,000, both regimes are reachable: at
k = 1 the binary search is **12x slower** than simply walking, and at k = 1,000 it
is **190x faster**. Neither is a general answer, and the binary search is the one
whose worst case is bounded.

<!-- @intuition -->
The move worth internalising is turning "how many are missing" from something you count into something you compute. A scan discovers the gaps by walking past them; the subtraction `arr[i] - (i + 1)` reads off the total number of gaps before position i in one operation, because a gapless prefix would have put `i + 1` there. Once the count is available at any index for free, the array becomes an ordinary monotone sequence and everything the module has already established applies. The same reframing appears whenever a problem asks about absences: instead of enumerating what is not there, find a quantity whose value already encodes how much is not there — the difference between where a value is and where it would be if nothing were missing.

<!-- @approach -->
### Walk the Integers

<!-- @idea -->
Count upward from 1, stepping past array elements and tallying everything else.

<!-- @steps -->
1. Keep a cursor into the array and a count of missing values found.
2. Consider each positive integer in turn.
3. If it matches the current array element, advance the cursor.
4. Otherwise it is missing, so increase the count.
5. Return the integer at which the count reaches k.

<!-- @complexity -->
- time: O(n + k)
- space: O(1)
- note: The definition written directly, and genuinely the fastest option for small k — measured **3.6ns at k = 1 against the binary search's 45.4** at n = 1,000. It degrades steeply: 7,869.8ns at k = 1,000, which is 190x behind.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int findKthPositive(const vector<int>& arr, int k) {
    int i = 0, seen = 0;
    for (int v = 1; ; v++) {
        if (i < (int)arr.size() && arr[i] == v) i++;
        else if (++seen == k) return v;
    }
}
```

<!-- @annotations -->
- 7: The bounds test comes first, so the array is never read past its end once the walk goes beyond the last element.
- 8: `else if`, not two separate ifs. A value that is present must not also be counted as missing.
- 6: No upper bound on the loop, because the answer is guaranteed to exist — every k has a kth missing positive integer.

<!-- @code java -->
```java
static int findKthPositive(int[] arr, int k) {
    int i = 0, seen = 0;
    for (int v = 1; ; v++) {
        if (i < arr.length && arr[i] == v) i++;
        else if (++seen == k) return v;
    }
}
```

<!-- @annotations -->
- 4: Java short-circuits &&, so the bounds test protects the array access exactly as it does in C++.

<!-- @code python -->
```python
def find_kth_positive(arr, k):
    i = seen = 0
    v = 0
    while True:
        v += 1
        if i < len(arr) and arr[i] == v:
            i += 1
        else:
            seen += 1
            if seen == k:
                return v
```

<!-- @annotations -->
- 6: `i < len(arr)` must be tested first, since Python would otherwise raise IndexError once the walk passes the last element.

<!-- @approach -->
### Scan the Gaps

<!-- @idea -->
Use the subtraction directly — walk the array and stop at the first index where the missing-count reaches k.

<!-- @steps -->
1. For each index, compute how many values are missing below that element.
2. That count is the element minus its one-based position.
3. Stop at the first index whose count reaches k.
4. The answer is k plus that index.
5. If no index reaches k, the answer is k plus the array's length.

<!-- @complexity -->
- time: O(n), returning early
- space: O(1)
- note: The best of the three across most of the problem's k range — measured fastest from k = 2 to k = 20 at n = 1,000, and 28.0ns against the binary search's 51.8 at k = 20. Its cost grows with k where the binary search's does not, so it loses from about k = 35.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int findKthPositive(const vector<int>& arr, int k) {
    for (int i = 0; i < (int)arr.size(); i++)
        if (arr[i] - (i + 1) >= k) return k + i;
    return k + (int)arr.size();
}
```

<!-- @annotations -->
- 6: Two decisions on one line. `arr[i] - (i + 1)` needs the `+ 1` because positions are zero-based and the values counted from 1 — writing `arr[i] - i` is wrong on 20.89% of exhaustive cases. And `>= k`, not `> k`: the first index that *reaches* k is the boundary, and requiring it to exceed k skips past the answer.
- 7: Reached when k exceeds every gap in the array, and `k + n` is then correct without a special case.

<!-- @code java -->
```java
static int findKthPositive(int[] arr, int k) {
    for (int i = 0; i < arr.length; i++)
        if (arr[i] - (i + 1) >= k) return k + i;
    return k + arr.length;
}
```

<!-- @annotations -->
- 3: Returning `k + i` rather than `arr[i] - something`. The array value cancels out of the arithmetic entirely.

<!-- @code python -->
```python
def find_kth_positive(arr, k):
    for i, v in enumerate(arr):
        if v - (i + 1) >= k:
            return k + i
    return k + len(arr)
```

<!-- @annotations -->
- 3: `v - (i + 1)` is the number of positive integers missing below `v`, available in one subtraction at any index.

<!-- @approach -->
### Binary Search the Gap Count

<!-- @idea -->
The missing-count only grows, so binary search for the first index where it reaches k.

<!-- @steps -->
1. Search the array's indices.
2. At the midpoint, compute the missing-count as the element minus its one-based position.
3. If it is below k, the answer lies further right.
4. Otherwise it lies at or before the midpoint.
5. When the pointers cross, the answer is the surviving index plus k.

<!-- @complexity -->
- time: O(log n), with k appearing only in the final addition
- space: O(1)
- note: 0 wrong over 4,572 exhaustive cases, and the only version whose cost does not grow with k — measured 40.8ns to 56.9ns across the whole range at n = 1,000. It is **12x slower than a plain walk at k = 1** and **190x faster at k = 1,000**.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int findKthPositive(const vector<int>& arr, int k) {
    int lo = 0, hi = (int)arr.size() - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int missing = arr[mid] - (mid + 1);
        if (missing < k) lo = mid + 1;
        else             hi = mid - 1;
    }
    return lo + k;
}
```

<!-- @annotations -->
- 7: Subtracting before halving, so lo + hi never overflows — the same guard every subtopic in this module has needed.
- 8: `(mid + 1)`, because a gapless array would hold `mid + 1` at index `mid`. Dropping the `+ 1` is wrong on 20.89% of exhaustive cases, which means it passes four tests in five.
- 9: `<`, not `<=`. The boundary wanted is the first index whose count *reaches* k, and `<=` pushes it one past — wrong on 17.32%.
- 12: `lo + k`, and the array value has cancelled out: `arr[lo-1] + (k - missing(lo-1))` simplifies to exactly this. Writing `hi + k` or `lo + k - 1` is wrong on 100% of inputs, which is why neither survives a first test. The cancellation is also why no special case is needed for `lo == 0` or `lo == n` — the formula covers k smaller than every gap and k larger than all of them.

<!-- @code java -->
```java
static int findKthPositive(int[] arr, int k) {
    int lo = 0, hi = arr.length - 1;
    while (lo <= hi) {
        int mid = lo + (hi - lo) / 2;
        int missing = arr[mid] - (mid + 1);
        if (missing < k) lo = mid + 1;
        else             hi = mid - 1;
    }
    return lo + k;
}
```

<!-- @annotations -->
- 5: The whole predicate is one subtraction, which is what separates this problem from the simulate-and-count predicates of the previous four subtopics.

<!-- @code python -->
```python
def find_kth_positive(arr, k):
    lo, hi = 0, len(arr) - 1
    while lo <= hi:
        mid = (lo + hi) // 2
        missing = arr[mid] - (mid + 1)
        if missing < k:
            lo = mid + 1
        else:
            hi = mid - 1
    return lo + k


# The lower-bound shape works identically:
#   lo, hi = 0, len(arr)
#   while lo < hi: ... else: hi = mid
# Both measured 0 wrong over the same 4,572 exhaustive cases.
```

<!-- @annotations -->
- 10: `lo + k`. After the loop `hi` is `lo - 1`, so `hi + k` is off by exactly one on every input.

<!-- @example -->

<!-- @input -->
```
arr = [2, 3, 4, 7, 11], k = 5
```

<!-- @output -->
```
9
```

<!-- @why -->
The missing values are 1, 5, 6, 8, 9, 10, … and the fifth is 9. The search finds the first index whose gap count reaches 5, and the answer follows by addition.

<!-- @walkthrough -->
```
arr     =  2   3   4   7  11
i + 1   =  1   2   3   4   5
missing =  1   1   1   3   6

lo=0 hi=4   mid=2   missing = 4 - 3 = 1  < 5   lo = 3
lo=3 hi=4   mid=3   missing = 7 - 4 = 3  < 5   lo = 4
lo=4 hi=4   mid=4   missing = 11 - 5 = 6 >= 5  hi = 3
lo=4 > hi=3  ->  4 + 5 = 9

Check the explicit form: arr[3] = 7 has 3 missing below it,
so the 5th missing is 7 + (5 - 3) = 9. Same answer, and the
7 cancels out of the algebra.
```

<!-- @example -->

<!-- @input -->
```
arr = [1, 2, 3, 4], k = 2
```

<!-- @output -->
```
6
```

<!-- @why -->
The array has no gaps at all, so every missing value lies beyond it. `lo` runs off the end to 4, and `lo + k` gives 6 with no special case.

<!-- @walkthrough -->
```
missing = 0, 0, 0, 0   -- a gapless prefix

lo=0 hi=3   mid=1   0 < 2   lo = 2
lo=2 hi=3   mid=2   0 < 2   lo = 3
lo=3 hi=3   mid=3   0 < 2   lo = 4
lo=4 > hi=3  ->  4 + 2 = 6

lo = n here, which the formula handles without a branch:
the array supplies four values, so the kth missing overall
is n + k.
```

<!-- @example -->

<!-- @input -->
```
arr = [1], k = 1
```

<!-- @output -->
```
2
```

<!-- @why -->
The smallest input that kills both return-value slips. `hi` ends at -1 and `lo` at 1, so `hi + k` and `lo + k - 1` both give 1 — a value that is present in the array.

<!-- @walkthrough -->
```
missing(0) = 1 - 1 = 0

lo=0 hi=0   mid=0   missing 0 < 1   ->  lo = 1, hi stays 0
loop ends with lo = 1, hi = 0

  lo + k      = 1 + 1 = 2      correct
  hi + k      = 0 + 1 = 1      WRONG -- 1 is in the array
  lo + k - 1  = 1 + 1 - 1 = 1  WRONG -- the same bug

Both are wrong on all 4,572 exhaustive cases, because the
loop always exits with hi = lo - 1, which makes hi + k and
lo + k - 1 the same expression.
```

<!-- @example -->

<!-- @input -->
```
arr = [2], k = 1
```

<!-- @output -->
```
1
```

<!-- @why -->
The answer comes before every array element. `lo` stays at 0, and `lo + k` gives 1 without needing to look at the array at all.

<!-- @walkthrough -->
```
missing(0) = 2 - 1 = 1

lo=0 hi=0   mid=0   missing 1 >= 1   hi = -1
lo=0 > hi=-1  ->  0 + 1 = 1

This is the case that would need a guard if the answer were
written as arr[lo-1] + (k - missing(lo-1)), since lo - 1 is
-1 here. The simplified form has no such index to protect.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the missing-count as a subtraction available at any index, the cancellation that turns the answer into `lo + k`, and the measured split between off-by-ones that die immediately and off-by-ones that survive testing.

<!-- @sampleInput -->
```json
{"primary":{"arr":[2,3,4,7,11],"k":5,"answer":9,"table":{"arr":[2,3,4,7,11],"onePlusIndex":[1,2,3,4,5],"missing":[1,1,1,3,6]},"missingValues":[1,5,6,8,9,10],"trace":[{"lo":0,"hi":4,"mid":2,"value":4,"missing":1,"test":"1 < 5","action":"lo = mid + 1"},{"lo":3,"hi":4,"mid":3,"value":7,"missing":3,"test":"3 < 5","action":"lo = mid + 1"},{"lo":4,"hi":4,"mid":4,"value":11,"missing":6,"test":"6 >= 5","action":"hi = mid - 1"}],"result":"lo + k = 4 + 5 = 9"},"theSubtraction":{"idea":"a gapless array would hold i + 1 at index i, so arr[i] - (i + 1) is exactly how many positive integers are missing below arr[i]","monotone":"arr is strictly increasing, so arr[i+1] >= arr[i] + 1, which gives missing(i+1) >= missing(i)","consequence":"an ordinary lower bound over a monotone predicate"},"whyLoPlusK":{"derivation":["answer = arr[lo-1] + (k - missing(lo-1))","missing(lo-1) = arr[lo-1] - lo","answer = arr[lo-1] + k - arr[lo-1] + lo = lo + k"],"consequence":"the array value cancels, so the final line needs no array access and no guard for lo == 0 or lo == n","verified":{"against":"the explicit anchored form","cases":200000,"disagreements":0}},"twoKindsOfOffByOne":{"space":"every strictly increasing array of length 1..5 from {1..9}, k = 1..12","cases":4572,"rows":[{"slip":"return hi + k","wrong":4572,"pct":100.00,"note":"the loop always exits with hi = lo - 1, so this is the same bug as the next row"},{"slip":"return lo + k - 1","wrong":4572,"pct":100.00},{"slip":"missing = arr[mid] - mid","wrong":955,"pct":20.89},{"slip":"missing <= k instead of <","wrong":792,"pct":17.32}],"correctForms":[{"form":"canonical, lo <= hi with hi = n - 1","wrong":0},{"form":"lower-bound shape, lo < hi with hi = n","wrong":0}],"smallestFailure":{"arr":[1],"k":1,"returned":1,"correct":2,"note":"1 is in the array"},"reading":"the slips in the returned value are wrong on every input and die on the first test; the slips inside the count pass four inputs in five and reach production"},"linearVersionsWinOften":{"n":1000,"units":"ns per call, randomised order, best of 9","rows":[{"k":1,"walk":3.6,"scanGaps":3.8,"binary":45.4,"fastest":"walk"},{"k":2,"walk":9.8,"scanGaps":5.9,"binary":56.9,"fastest":"scan"},{"k":5,"walk":16.5,"scanGaps":8.7,"binary":50.8,"fastest":"scan"},{"k":20,"walk":51.6,"scanGaps":28.0,"binary":51.8,"fastest":"scan"},{"k":50,"walk":141.4,"scanGaps":66.7,"binary":52.6,"fastest":"binary"},{"k":200,"walk":709.1,"scanGaps":270.4,"binary":54.1,"fastest":"binary"},{"k":1000,"walk":7869.8,"scanGaps":1234.4,"binary":40.8,"fastest":"binary"}],"crossover":"near k = 35","reading":"the binary search's cost barely moves with k, since k appears only in the final addition, while both scans grow with it","bothRegimesReachable":"the problem caps n and k at 1,000, so binary search is 12x slower at k = 1 and 190x faster at k = 1,000"},"assertions":["missing(i) = arr[i] - (i + 1) is non-decreasing","lo is the first index whose missing count reaches k","the answer is lo + k for every lo from 0 to n","no guard is needed for lo == 0 or lo == n","the loop always exits with hi = lo - 1"]}
```

<!-- @highlights -->
- The missing-count at any index is one subtraction: `arr[i] - (i + 1)`.
- It is non-decreasing, so the problem is an ordinary lower bound over a monotone predicate.
- The answer simplifies to `lo + k` — the array value cancels, so no guard is needed at either end.
- `return hi + k` and `return lo + k - 1` are wrong on **100%** of inputs and die on the first test.
- `missing = arr[mid] - mid` and `missing <= k` are wrong on **20.89%** and **17.32%** — they pass four tests in five.
- Binary search is **12× slower than a plain walk at k = 1** and **190× faster at k = 1,000**, crossing over near k = 35.

<!-- @edgeCases -->
- k smaller than the first gap — the answer is k itself, and `lo` stays 0.
- An array with no gaps — every missing value lies past it, `lo` runs to n, and the answer is `n + k`.
- `arr = [1], k = 1` — the smallest input that kills both return-value slips.
- `arr = [2], k = 1` — the answer precedes the array, and the anchored form would index `arr[-1]`.
- k larger than every gap in the array — handled by the same formula with no branch.
- A single-element array — the loop runs once and both outcomes are reachable.
- An array starting at 1 with consecutive values — the missing count is 0 throughout.
- Very large k relative to n — where the walk degrades to 190× behind and the binary search does not move.
- An array that is not strictly increasing — the count stops being monotone and the search returns a meaningless index; nothing checks it.
- `(lo + hi) / 2` — overflows an int for large bounds, exactly as in Lower Bound.

<!-- @pitfalls -->
- Writing `missing = arr[mid] - mid`. Wrong on 20.89% of exhaustive cases, so it passes most tests.
- Writing `missing <= k` instead of `<`. Wrong on 17.32% — the boundary wanted is the first index that *reaches* k.
- Returning `hi + k` or `lo + k - 1`. Both wrong on 100% of inputs, and both the same bug, since the loop exits with `hi = lo - 1`.
- Adding a guard for `lo == 0`. The simplified formula needs none — the array value has already cancelled.
- Writing the answer as `arr[lo-1] + (k - missing)` without guarding `lo == 0`. That form *does* need the guard, which is the reason to prefer the simplified one.
- Reaching for binary search by reflex. At k = 1 it is 12× slower than walking from 1.
- Reaching for the walk because it measured faster. At k = 1,000 it is 190× slower, and both k values are inside the problem's limits.
- Counting the gaps by scanning when the count is available by subtraction. The array value tells you the total directly.
- Assuming a strictly increasing input. The monotonicity of the missing-count depends on it and nothing verifies it.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int for large bounds.

<!-- @doubt -->
### Why is `arr[i] - (i + 1)` the number of missing values?

<!-- @answer -->
Because it measures how far the array has drifted from the gapless case. If nothing were missing, the array would read 1, 2, 3, … so index `i` would hold `i + 1`. Every unit by which `arr[i]` exceeds `i + 1` is one positive integer that was skipped somewhere before it. On `[2, 3, 4, 7, 11]` the counts are 1, 1, 1, 3, 6 — matching the missing values 1, then 5 and 6, then 8, 9 and 10. It is also monotone: strict increase means `arr[i+1] >= arr[i] + 1`, so `missing(i+1) = arr[i+1] - (i+2) >= arr[i] - (i+1) = missing(i)`. Monotone predicate, ordinary lower bound.

<!-- @doubt -->
### Why does the answer come out as `lo + k` with no array access?

<!-- @answer -->
Because the array value cancels. After the loop, `lo - 1` is the last index whose missing-count is still below k, so the answer sits `k - missing(lo-1)` places past `arr[lo-1]`. Substituting `missing(lo-1) = arr[lo-1] - lo` gives `arr[lo-1] + k - (arr[lo-1] - lo) = lo + k`. The cancellation is what makes the line safe at both ends: when `lo == 0` there is no `arr[-1]` to read, and when `lo == n` there is no element past the array — yet `lo + k` is correct in both cases. The anchored form is correct too but needs an explicit guard for `lo == 0`, which is a good reason to prefer the simplified one. Verified equal over 200,000 randomised inputs with 0 disagreements.

<!-- @doubt -->
### Which off-by-one should I actually worry about?

<!-- @answer -->
The ones inside the count, not the ones in the return. Measured over 4,572 exhaustive cases: `return hi + k` and `return lo + k - 1` are wrong on **100%** of inputs — they cannot survive a single test, and they are in fact the same bug, since the loop always exits with `hi == lo - 1`. Meanwhile `missing = arr[mid] - mid` is wrong on **20.89%** and `missing <= k` on **17.32%**, which means each passes roughly four inputs in five. Those are the versions that get committed. The general shape is worth remembering: a mistake that is wrong everywhere is cheap, and a mistake that is wrong sometimes is expensive, so the arithmetic that looks fussiest deserves the most scrutiny rather than the least.

<!-- @doubt -->
### Is binary search actually worth it here?

<!-- @answer -->
It depends on k, and both answers are reachable inside the problem's own limits. At n = 1,000: with **k = 1** the plain walk takes 3.6ns and the binary search 45.4ns, so the walk is **12x faster**; with **k = 1,000** the walk takes 7,869.8ns and the binary search 40.8ns, so the binary search is **190x faster**. The crossover is near k = 35. The reason the binary search is flat is that k never enters the loop — it appears only in the final addition — while both linear versions do work proportional to k. Since the problem caps k at 1,000 and n at 1,000, the honest recommendation is the binary search, not because it is always fastest but because it is the only one whose worst case is bounded.

<!-- @doubt -->
### What is the middle approach for, if binary search exists?

<!-- @answer -->
It uses the same subtraction without the search, and it is the fastest option across most of this problem's k range. Scanning indices and stopping at the first whose missing-count reaches k is O(n) with an early exit, and measured at n = 1,000 it wins from **k = 2 through k = 20** — 28.0ns against the binary search's 51.8ns at k = 20. It is worth writing because it separates the two ideas: the subtraction is what makes the problem easy, and the binary search is a further optimisation on top of it. If you understand only one of the two, understand the subtraction.

<!-- @doubt -->
### Does the `lo < hi` lower-bound shape work here too?

<!-- @answer -->
Yes, identically — `lo, hi = 0, n` with `hi = mid` on the else branch, returning `lo + k`. Measured **0 wrong** over the same 4,572 exhaustive cases as the canonical `lo <= hi` form. That is expected rather than lucky: this is a boundary search, and both conventions locate the same boundary provided each is written consistently, which is exactly the pairing that Lower Bound established. The one thing not to do is mix them — `lo <= hi` with `hi = mid` hangs, and `lo < hi` with `hi = mid - 1` skips the answer, for the same reasons measured there.
