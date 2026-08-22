---
id: find-peak-element
topic: Binary Search
title: Find peak element
difficulty: Medium
status: ready
prerequisites:
  - lower-bound
  - search-x-in-sorted-array
  - single-element-in-a-sorted-array
relatedIds:
  - find-peak-element-ii
  - single-element-in-a-sorted-array
  - lower-bound
  - find-minimum-in-rotated-sorted-array
  - search-in-rotated-sorted-array-i
---

<!-- @summary -->
The first subtopic where the input is not sorted in any sense — binary search works because a rising slope guarantees a peak to the right, not because anything is ordered. It is also the first where the logarithmic algorithm is not a speedup: on random input a plain scan finds a peak in e − 1 ≈ 1.72 steps regardless of n and beats it 27x, while on an ascending array the scan loses by 2,139x. Binary search here buys a guarantee, not throughput.

<!-- @theory -->
## The problem

Find any index whose element is strictly greater than both its neighbours,
treating out-of-range neighbours as negative infinity. Adjacent elements are
guaranteed never to be equal.

```
[1, 2, 3, 1]           ->  2
[1, 2, 1, 3, 5, 6, 4]  ->  1 or 5, either is correct
[1, 2, 3, 4, 5]        ->  4      the last element, since a[n] is -infinity
[5, 4, 3, 2, 1]        ->  0
```

Two things stand out immediately. The array is **not sorted**, and there is
usually **more than one right answer**.

## Why binary search applies to unsorted data

Every previous subtopic used sortedness to conclude something about a whole half.
There is no such structure here, and one local observation replaces it:

> If `a[mid] < a[mid + 1]`, then a peak exists somewhere strictly to the right of
> mid.

The argument is short. Starting at `mid + 1` the sequence is rising. Walk right:
either it keeps rising until the end, in which case the last element is a peak
because `a[n]` is negative infinity, or it stops rising somewhere, and the element
where it stops is a peak. Either way a peak lies in `[mid + 1, n - 1]`, so
discarding everything at or before mid discards no *guarantee* — it may discard
peaks, but the problem accepts any of them.

The mirror case is the same argument reversed: if `a[mid] >= a[mid + 1]` then a
peak lies in `[lo, mid]`.

So the loop is an ordinary boundary search over the predicate "is the slope still
rising here":

```
lo = 0, hi = n - 1
while lo < hi:
    mid = lo + (hi - lo) / 2
    if a[mid] < a[mid + 1]:  lo = mid + 1
    else:                    hi = mid
return lo
```

Verified over every array of length 1 to 9 drawn from `{0,1,2,3}` with no two
adjacent equal — **39,364 arrays, 0 wrong.** The mirror formulation comparing
against the left neighbour is also 0 wrong, and so is writing `<=` instead of `<`,
which cannot differ because the problem forbids adjacent equals.

## Which peak comes back

Since most inputs have several peaks, it is worth knowing that the answer is
genuinely arbitrary. Over 200,000 random permutations of 64 elements:

| | |
|---|---|
| returned the leftmost peak | 4.3% |
| returned the rightmost peak | 4.3% |
| returned some interior peak | **91.4%** |

There is no "first peak" guarantee to lean on. If a caller needs a specific one,
this algorithm is the wrong tool.

## The scan is O(1) on random input, and it is not close

Walking from the left until the slope turns down finds a peak too. It is O(n) in
the worst case, which makes it look like the obviously worse option. On random
data it is not:

| n | mean scan steps | max over 20,000 trials | binary search steps |
|---|---|---|---|
| 16 | 1.722 | 7 | 4 |
| 256 | 1.718 | 7 | 8 |
| 4,096 | 1.706 | 7 | 12 |
| 65,536 | 1.743 | 6 | 16 |
| 1,048,576 | 1.740 | 6 | 20 |

The mean does not grow with n at all. It is a constant, and the constant is
identifiable: over 400,000 random permutations of 4,096 elements the measured mean
is **1.7171**, against **e − 1 = 1.7183**.

That follows directly. The scan runs past index k only if the first k + 1 elements
happen to be in increasing order, which for a random permutation has probability
1/(k + 1)!. Summing those probabilities gives
1/1! + 1/2! + 1/3! + … = e − 1.

In time, on random permutations:

| n | check every element | scan the slope | binary search |
|---|---|---|---|
| 16 | 2.0 | **1.96** | 4.19 |
| 256 | 2.0 | **2.02** | 11.14 |
| 4,096 | 2.2 | **1.93** | 25.88 |
| 65,536 | 2.1 | **1.77** | 47.56 |
| 1,048,576 | 3.5 | **3.38** | 92.79 |

Nanoseconds per call. The scan is flat and the binary search is logarithmic, so
the gap widens with n — **27x at n = 1,048,576**, in favour of the O(n) algorithm.

## And it loses by 2,139x on the input that matters

Now the same three on a strictly ascending array, where the only peak is the last
element:

| n | check every element | scan the slope | binary search |
|---|---|---|---|
| 16 | 10.9 | 6.33 | **4.19** |
| 256 | 172.0 | 94.76 | **11.10** |
| 4,096 | 2,675.5 | 1,468.60 | **35.45** |
| 65,536 | 44,631.6 | 21,515.65 | **59.54** |
| 1,048,576 | 719,147.8 | 344,408.60 | **161.02** |

344 microseconds against 161 nanoseconds — **2,139x**.

That is the whole point of this subtopic, and it is a different point from every
one before it. Elsewhere the logarithmic algorithm was faster on the data you
would actually see, and the linear one was a teaching device. Here the linear scan
is faster on the data you would actually see, by a wide margin, and the binary
search exists to remove a catastrophic tail. It is insurance, not throughput.

Which you want depends on whether an adversary picks the input. For a sorted or
nearly-sorted array — a very common shape in practice — the scan degrades to
exactly its worst case.

## The no-adjacent-equals guarantee is load-bearing

The problem statement promises `a[i] != a[i+1]`, and it is easy to read that as
tidying rather than as a precondition. It is a precondition.

With plateaus allowed, `a[mid] < a[mid + 1]` being false no longer means the slope
has turned — it may just be flat, and a flat stretch gives no information about
which side holds a peak. Tested exhaustively over every array of length 1 to 12
over `{0,1}`, 8,190 arrays:

| | |
|---|---|
| no peak exists at all | 1,429 — 17.45% |
| a peak exists and the search misses it | 3,935 — 48.05% |
| a peak exists and the search finds one | 2,826 — 34.51% |

Of the 6,761 arrays that do contain a peak, the search misses it on **58.20%**.
And note the first row: with plateaus the question can have no answer, so this is
not a repairable algorithm but a different problem.

<!-- @intuition -->
Binary search is usually explained as a consequence of sortedness, and this problem is the clean counterexample. What a halving search actually needs is a way to look at one position and rule out a whole side — and sortedness is only one way to buy that. Here the purchase is made by a local slope plus a boundary condition: rising means a peak lies to the right, because the sequence must either turn over or run into an infinitely low wall at the end. Nothing about the rest of the array is known or assumed. Holding it this way makes the rest of the module read differently in hindsight: every one of those searches was really maintaining an invariant that some target lies inside the window, and sortedness was just the most familiar reason for believing it.

<!-- @approach -->
### Check Every Element

<!-- @idea -->
Test each index against both neighbours and return the first that is greater than both.

<!-- @steps -->
1. Walk every index from the left.
2. Treat a missing left neighbour as negative infinity, so index 0 only needs to beat its right side.
3. Treat a missing right neighbour the same way.
4. Return the first index that beats both.
5. A peak always exists, so the loop always returns.

<!-- @complexity -->
- time: O(n) worst case, O(1) expected on random input
- space: O(1)
- note: The definition written out, and on random data almost as fast as the slope scan — measured 2.0ns at n = 256 — because a peak nearly always appears within the first few positions. On an ascending array it is the slowest of the three by a wide margin: 719,147.8ns at n = 1,048,576.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int findPeakElement(const vector<int>& a) {
    int n = (int)a.size();
    for (int i = 0; i < n; i++) {
        bool leftOk  = (i == 0)     || a[i - 1] < a[i];
        bool rightOk = (i == n - 1) || a[i + 1] < a[i];
        if (leftOk && rightOk) return i;
    }
    return -1;
}
```

<!-- @annotations -->
- 7: The boundary check comes first, so a[-1] is never read. This is the code equivalent of "treat out-of-range neighbours as negative infinity".
- 8: The mirror at the other end, which is what makes the last element of an ascending array a valid peak.
- 11: Unreachable for any valid input, since a peak always exists. It is here so the function has a defined value if the precondition is violated.

<!-- @code java -->
```java
static int findPeakElement(int[] a) {
    int n = a.length;
    for (int i = 0; i < n; i++) {
        boolean leftOk  = (i == 0)     || a[i - 1] < a[i];
        boolean rightOk = (i == n - 1) || a[i + 1] < a[i];
        if (leftOk && rightOk) return i;
    }
    return -1;
}
```

<!-- @annotations -->
- 4: Java short-circuits ||, so the bounds test protects the array access exactly as it does in C++.

<!-- @code python -->
```python
def find_peak_element(a):
    n = len(a)
    for i in range(n):
        left_ok = i == 0 or a[i - 1] < a[i]
        right_ok = i == n - 1 or a[i + 1] < a[i]
        if left_ok and right_ok:
            return i
    return -1
```

<!-- @annotations -->
- 4: `i == 0` must be tested first. Without it a[-1] wraps to the last element and silently compares the wrong pair.

<!-- @approach -->
### Scan Until the Slope Turns

<!-- @idea -->
Walk from the left while the sequence is rising; the first place it stops rising is a peak.

<!-- @steps -->
1. Start at index zero.
2. While the next element is larger, keep moving right.
3. Stop at the first index whose successor is smaller.
4. That index is a peak, because everything to its left was smaller and its successor is smaller.
5. Running to the end returns the last index, which is a peak by the boundary rule.

<!-- @complexity -->
- time: O(n) worst case, **e − 1 ≈ 1.72 steps expected** on a random permutation, independent of n
- space: O(1)
- note: The fastest option on random data by a growing margin — 1.77ns against the binary search's 47.56ns at n = 65,536, and 27x at n = 1,048,576. On a strictly ascending array it walks the whole thing: 344,408.60ns against 161.02ns, a factor of 2,139.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int findPeakElement(const vector<int>& a) {
    int n = (int)a.size();
    for (int i = 0; i < n - 1; i++) {
        if (a[i] > a[i + 1]) return i;
    }
    return n - 1;
}
```

<!-- @annotations -->
- 6: Stopping at n - 1 so the lookahead is always in range, which is why no bounds test is needed inside the loop.
- 7: Only the right neighbour is checked. The left side needs no test: the loop only reached i because every earlier step was rising.
- 9: Falling out means the array never stopped rising, so the last element is the peak — the boundary rule doing real work rather than being a formality.

<!-- @code java -->
```java
static int findPeakElement(int[] a) {
    for (int i = 0; i < a.length - 1; i++) {
        if (a[i] > a[i + 1]) return i;
    }
    return a.length - 1;
}
```

<!-- @annotations -->
- 2: On a sorted array this loop runs to completion, which is the shape that makes an O(n) worst case a real risk rather than a theoretical one.

<!-- @code python -->
```python
def find_peak_element(a):
    for i in range(len(a) - 1):
        if a[i] > a[i + 1]:
            return i
    return len(a) - 1


# Expected work on a random permutation is e - 1 steps,
# because the scan passes index k only if the first k + 1
# elements happen to be increasing -- probability 1/(k+1)!.
```

<!-- @annotations -->
- 3: The single comparison that decides everything. Everything to the left is already known to be smaller.

<!-- @approach -->
### Binary Search on the Slope

<!-- @idea -->
Halve the window using one local observation: a rising slope at the midpoint guarantees a peak strictly to its right.

<!-- @steps -->
1. Keep a window with the invariant that it contains at least one peak.
2. While the window holds more than one position, take the midpoint.
3. If the element after the midpoint is larger, the slope is rising, so a peak lies strictly to the right — move lo past mid.
4. Otherwise the slope has turned or is at a peak, so a peak lies at or before mid — bring hi down to mid.
5. When the window narrows to one position, that position is a peak.

<!-- @complexity -->
- time: O(log n) guaranteed, on any input
- space: O(1)
- note: 0 wrong over 39,364 exhaustive arrays. It is **slower than a plain scan on random data** — 92.79ns against 3.38ns at n = 1,048,576 — and 2,139x faster on an ascending one. Choose it for the guarantee rather than for the speed.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int findPeakElement(const vector<int>& a) {
    int lo = 0, hi = (int)a.size() - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < a[mid + 1]) lo = mid + 1;
        else                     hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 6: lo < hi, so the loop narrows to one surviving position — the same convention Lower Bound used, because this looks for a boundary rather than a match.
- 7: Subtracting before halving, so lo + hi never overflows. mid is always strictly less than hi here, which is what makes a[mid + 1] safe to read.
- 8: The entire algorithm. A rising slope means a peak lies strictly right of mid, so nothing is lost by moving past it — the sequence must either turn over or run into the boundary.
- 9: hi = mid, not mid - 1, because mid itself may be the peak.
- 11: The surviving index. No final check is needed: the invariant guarantees the window always held a peak, and one position is left.

<!-- @code java -->
```java
static int findPeakElement(int[] a) {
    int lo = 0, hi = a.length - 1;
    while (lo < hi) {
        int mid = lo + (hi - lo) / 2;
        if (a[mid] < a[mid + 1]) lo = mid + 1;
        else                     hi = mid;
    }
    return lo;
}
```

<!-- @annotations -->
- 4: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which overflows an int from n = 1,073,741,825.
- 5: `<` and `<=` behave identically here only because the problem forbids adjacent equals. With plateaus neither is correct.

<!-- @code python -->
```python
def find_peak_element(a):
    lo, hi = 0, len(a) - 1
    while lo < hi:
        mid = (lo + hi) // 2
        if a[mid] < a[mid + 1]:
            lo = mid + 1
        else:
            hi = mid
    return lo


# Nothing here assumes the array is sorted. The only fact
# used is that a rising slope must eventually turn over or
# reach the end.
```

<!-- @annotations -->
- 5: The only comparison in the function, and it looks at one adjacent pair rather than at any global order.

<!-- @example -->

<!-- @input -->
```
a = [1, 2, 3, 1]
```

<!-- @output -->
```
2
```

<!-- @why -->
Index 2 holds 3, which beats both neighbours. Two probes find it, and neither probe knows anything about the array beyond one adjacent comparison.

<!-- @walkthrough -->
```
lo=0 hi=3   mid=1   a[1]=2 < a[2]=3   rising   lo = 2
lo=2 hi=3   mid=2   a[2]=3 < a[3]=1?  no       hi = 2
lo == hi -> 2

The first probe discarded indices 0 and 1 without looking
at them, on the strength of one fact: the slope at index 1
is rising, so something to the right must turn over.
```

<!-- @example -->

<!-- @input -->
```
a = [1, 2, 1, 3, 5, 6, 4]
```

<!-- @output -->
```
5   (1 is also correct)
```

<!-- @why -->
Two peaks exist — index 1 and index 5 — and the problem accepts either. The search returns 5, which illustrates that there is no leftmost-peak guarantee.

<!-- @walkthrough -->
```
lo=0 hi=6   mid=3   a[3]=3 < a[4]=5   rising   lo = 4
lo=4 hi=6   mid=5   a[5]=6 < a[6]=4?  no       hi = 5
lo=4 hi=5   mid=4   a[4]=5 < a[5]=6   rising   lo = 5
lo == hi -> 5

The peak at index 1 was discarded by the very first probe.
Measured over 200,000 random permutations of 64 elements,
the leftmost peak comes back only 4.3% of the time.
```

<!-- @example -->

<!-- @input -->
```
a = [1, 2, 3, 4, 5]
```

<!-- @output -->
```
4
```

<!-- @why -->
A sorted array. The only peak is the last element, and this is exactly the shape where the linear scan degrades to its worst case while the binary search is unaffected.

<!-- @walkthrough -->
```
lo=0 hi=4   mid=2   a[2]=3 < a[3]=4   rising   lo = 3
lo=3 hi=4   mid=3   a[3]=4 < a[4]=5   rising   lo = 4
lo == hi -> 4

Two probes. The slope scan reads all five elements here,
and at n = 1,048,576 it reads all of them: 344,408.60ns
against 161.02ns.
```

<!-- @example -->

<!-- @input -->
```
a = [5, 4, 3, 2, 1]
```

<!-- @output -->
```
0
```

<!-- @why -->
A descending array, the mirror of the previous case. Here the scan stops immediately and the binary search still takes its full three probes.

<!-- @walkthrough -->
```
lo=0 hi=4   mid=2   a[2]=3 < a[3]=2?  no   hi = 2
lo=0 hi=2   mid=1   a[1]=4 < a[2]=3?  no   hi = 1
lo=0 hi=1   mid=0   a[0]=5 < a[1]=4?  no   hi = 0
lo == hi -> 0

Three probes to find what the scan finds in one. The
binary search never gets to exit early — it has no notion
of having found the answer, only of the window closing.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the local slope argument that lets a halving search run on unsorted data, and the measured reversal where the linear scan is 27x faster on random input and 2,139x slower on an ascending one.

<!-- @sampleInput -->
```json
{"primary":{"array":[1,2,1,3,5,6,4],"peaks":[1,5],"returned":5,"trace":[{"lo":0,"hi":6,"mid":3,"value":3,"next":5,"rising":true,"action":"lo = mid + 1","window":[4,6]},{"lo":4,"hi":6,"mid":5,"value":6,"next":4,"rising":false,"action":"hi = mid","window":[4,5]},{"lo":4,"hi":5,"mid":4,"value":5,"next":6,"rising":true,"action":"lo = mid + 1","window":[5,5]}],"note":"the peak at index 1 was discarded by the first probe"},"notSorted":{"claim":"the input is not sorted in any sense; binary search applies for a different reason","argument":"if a[mid] < a[mid+1] the sequence is rising from mid+1, so it must either keep rising to the end — where a[n] is -infinity, making the last element a peak — or stop rising somewhere, and that place is a peak. Either way a peak lies strictly right of mid.","mirror":"if a[mid] >= a[mid+1] a peak lies in [lo, mid]","verified":{"arrays":39364,"space":"every array of length 1..9 over {0,1,2,3} with no two adjacent equal","rightNeighbourWrong":0,"leftNeighbourWrong":0,"looseComparisonWrong":0,"looseNote":"< and <= cannot differ, because the problem forbids adjacent equals"}},"anyPeakIsValid":{"trials":200000,"arraySize":64,"leftmostPct":4.3,"rightmostPct":4.3,"interiorPct":91.4,"reading":"there is no leftmost-peak guarantee to lean on"},"scanIsConstantOnRandomInput":{"steps":[{"n":16,"mean":1.722,"max":7,"binarySteps":4},{"n":256,"mean":1.718,"max":7,"binarySteps":8},{"n":4096,"mean":1.706,"max":7,"binarySteps":12},{"n":65536,"mean":1.743,"max":6,"binarySteps":16},{"n":1048576,"mean":1.740,"max":6,"binarySteps":20}],"identity":{"measured":1.7171,"trials":400000,"arraySize":4096,"eMinusOne":1.7183,"derivation":"the scan passes index k only if the first k+1 elements are increasing, probability 1/(k+1)!; summing gives 1/1! + 1/2! + ... = e - 1"}},"benchmarkRandom":{"units":"ns per call, best of 9, algorithms shuffled into a random order every repetition","rows":[{"n":16,"checkAll":2.0,"scan":1.96,"binary":4.19},{"n":256,"checkAll":2.0,"scan":2.02,"binary":11.14},{"n":4096,"checkAll":2.2,"scan":1.93,"binary":25.88},{"n":65536,"checkAll":2.1,"scan":1.77,"binary":47.56},{"n":1048576,"checkAll":3.5,"scan":3.38,"binary":92.79}],"headline":"the scan is flat and the binary search is logarithmic, so the O(n) algorithm wins by 27x at n = 1,048,576"},"benchmarkAscending":{"rows":[{"n":16,"checkAll":10.9,"scan":6.33,"binary":4.19},{"n":256,"checkAll":172.0,"scan":94.76,"binary":11.10},{"n":4096,"checkAll":2675.5,"scan":1468.60,"binary":35.45},{"n":65536,"checkAll":44631.6,"scan":21515.65,"binary":59.54},{"n":1048576,"checkAll":719147.8,"scan":344408.60,"binary":161.02}],"headline":"2,139x the other way","reading":"binary search here buys a guarantee, not throughput — elsewhere in this module the logarithmic algorithm was faster on realistic data too"},"plateausBreakIt":{"precondition":"a[i] != a[i+1] is load-bearing, not tidying","why":"a flat stretch makes a[mid] < a[mid+1] false without the slope having turned, and gives no information about which side holds a peak","space":"every array of length 1..12 over {0,1}","arrays":8190,"noPeakExists":{"count":1429,"pct":17.45},"peakExistsButMissed":{"count":3935,"pct":48.05},"peakExistsAndFound":{"count":2826,"pct":34.51},"missRateAmongSolvable":58.20,"reading":"with plateaus the question can have no answer at all, so this is a different problem rather than a repairable algorithm"},"assertions":["the window always contains at least one peak","a rising slope guarantees a peak strictly to the right","out-of-range neighbours count as negative infinity","a peak always exists when adjacent elements differ","mid is always strictly less than hi, so a[mid + 1] is in range"]}
```

<!-- @highlights -->
- The array is not sorted; the search works because a rising slope guarantees a peak to its right.
- Most inputs have several peaks, and the search returns an interior one 91.4% of the time.
- On random input a plain scan finds a peak in **e − 1 ≈ 1.72 steps regardless of n** — measured 1.7171 against 1.7183.
- That makes the O(n) scan **27x faster** than the O(log n) search at n = 1,048,576 on random data.
- On an ascending array the same scan is **2,139x slower** — binary search here is insurance, not throughput.
- The no-adjacent-equals guarantee is a precondition: with plateaus the search misses a peak on 58.20% of the arrays that have one.

<!-- @edgeCases -->
- A single-element array — the loop never runs and index 0 is the answer.
- A strictly ascending array — the only peak is the last element, and the boundary rule is what makes it one.
- A strictly descending array — the only peak is index 0, by the mirror of the same rule.
- Several peaks — the norm rather than the exception, and the returned one is arbitrary.
- A peak at index 0 or at n - 1 — valid, because out-of-range neighbours count as negative infinity.
- Two elements — whichever is larger is the peak, found in one probe.
- Adjacent equal values — outside the precondition, and the search misses a peak on 58.20% of arrays that have one.
- An array where no peak exists — impossible under the precondition, and possible in 17.45% of arrays once plateaus are allowed.
- Reading `a[mid + 1]` — always in range, because `mid < hi <= n - 1` whenever the loop body runs.
- n above 1,073,741,824 — where `(lo + hi) / 2` overflows an int, exactly as in Lower Bound.

<!-- @pitfalls -->
- Assuming binary search needs sorted input. Nothing here is sorted; the search rests on a local slope plus a boundary condition.
- Expecting the leftmost peak. Measured, it comes back 4.3% of the time — any peak is a valid answer and the returned one is arbitrary.
- Writing `hi = mid - 1`. mid itself may be the peak, and discarding it can leave a window with none.
- Using `lo <= hi` as the loop condition. This search narrows to a surviving position, so it must be `lo < hi`.
- Adding a bounds check before `a[mid + 1]`. It cannot be out of range, and the check hides whether the loop bounds are right.
- Reaching for binary search for speed. On random input the plain scan is 27x faster at n = 1,048,576.
- Reaching for the scan because it measured faster. On a sorted array it is 2,139x slower, and sorted input is common.
- Ignoring the no-adjacent-equals guarantee. It is a precondition, not tidying — with plateaus 17.45% of arrays have no peak at all.
- Checking both neighbours inside the scan. The left side needs no test, because the loop only advanced through rising elements.
- Computing `mid` as `(lo + hi) / 2`. It overflows an int from n = 1,073,741,825.

<!-- @doubt -->
### How can binary search work on an unsorted array?

<!-- @answer -->
Because halving never actually required sortedness — it requires a way to look at one position and rule out a whole side, and sortedness is only the most familiar way to buy that. Here the purchase is a local observation plus a boundary condition: if `a[mid] < a[mid + 1]` the sequence is rising as it leaves mid, so walking right it must either keep rising to the end — where the imaginary `a[n] = -infinity` makes the last element a peak — or stop rising somewhere, and wherever it stops is a peak. Either way `[mid + 1, n - 1]` contains one, so everything at or before mid can go. Nothing about the rest of the array is known or needed. Verified over 39,364 exhaustive arrays with 0 errors.

<!-- @doubt -->
### Which peak does it return?

<!-- @answer -->
An arbitrary one, and usually not an end. Over 200,000 random permutations of 64 elements it returned the leftmost peak 4.3% of the time, the rightmost 4.3%, and an interior peak **91.4%**. That is a direct consequence of the invariant: each step guarantees only that *a* peak remains inside the window, and it happily discards others. If your caller needs the leftmost peak, or the highest one, this algorithm does not provide it and cannot be patched into providing it — you would be solving a different problem with a different lower bound.

<!-- @doubt -->
### Is the O(log n) version actually faster?

<!-- @answer -->
On random input, no — and not marginally. A plain scan from the left stops at the first place the slope turns, and on a random permutation that takes **1.72 steps on average regardless of n**: measured 1.722 at n = 16 and 1.740 at n = 1,048,576, with a maximum of 6 over 20,000 trials. The binary search takes 20 probes at that size. In time that is 3.38ns against 92.79ns — the O(n) algorithm is **27x faster**. The gap grows with n, because one side is constant and the other is logarithmic. This is the first subtopic in the module where the linear approach wins on realistic data rather than merely on small data.

<!-- @doubt -->
### Why exactly e − 1 steps?

<!-- @answer -->
Because the scan gets past index k only if the first k + 1 elements happen to be in increasing order, and in a random permutation the probability that k + 1 specific elements land in increasing order is 1/(k + 1)!. Summing the probabilities of surviving each step gives the expected number of steps: 1/1! + 1/2! + 1/3! + … which is e − 1 ≈ **1.71828**. Measured over 400,000 random permutations of 4,096 elements the mean is **1.7171**. It is worth doing this kind of arithmetic when a measured constant refuses to move with n — a flat average is usually a sign that a closed form exists, and finding it turns an observation into a guarantee about the distribution rather than about one benchmark.

<!-- @doubt -->
### Then why use binary search at all?

<!-- @answer -->
Because the scan's average says nothing about its worst case, and its worst case is a shape you will actually meet. On a strictly ascending array — that is, any sorted array — the scan reads every element: **344,408.60 nanoseconds against 161.02 at n = 1,048,576, a factor of 2,139**. Sorted input is not adversarial in any exotic sense; it is one of the most common shapes real data takes. So the choice is between an algorithm that is 27x faster on random input and one that cannot be made to take more than 20 probes on any input. That is a genuine engineering trade rather than a right answer, and it is worth stating plainly: here binary search buys a guarantee, not throughput.

<!-- @doubt -->
### What breaks if adjacent elements can be equal?

<!-- @answer -->
Everything, and not repairably. The comparison `a[mid] < a[mid + 1]` distinguishes "rising" from "not rising", and with plateaus "not rising" no longer means the slope has turned — a flat stretch is consistent with a peak on either side, so no side can be discarded. Tested exhaustively over every array of length 1 to 12 over `{0,1}`, the search returns a non-peak on 3,935 of the 6,761 arrays that contain one — **58.20%**. More fundamentally, 1,429 of the 8,190 arrays — **17.45%** — contain no peak at all under the strict definition, so the question itself stops having an answer. This is why the guarantee belongs in the problem statement: it is not tidying the input, it is what makes the problem well posed.

<!-- @doubt -->
### Do I need to check the left neighbour in the scan?

<!-- @answer -->
No, and the reason is worth seeing because it is the same kind of invariant the binary search uses. The scan only reaches index i by having passed every earlier index, and it passes index j only when `a[j] < a[j + 1]` — so by the time it stands at i, it already knows `a[i - 1] < a[i]`. The left condition is carried by the loop's history rather than by a test. That leaves exactly one comparison per step, which is why the scan is so cheap in practice. The Check Every Element approach tests both sides precisely because it does not walk in order and so cannot rely on that history.
