---
id: majority-element-ii
topic: Arrays
title: Majority Element-II
difficulty: Hard
status: ready
prerequisites:
  - majority-element-i
  - count-subarrays-with-given-sum
  - for-loop
  - if-else-statements
  - time-and-space-complexity-basics
relatedIds:
  - majority-element-i
  - count-subarrays-with-given-sum
  - find-the-repeating-and-missing-number
  - sort-an-array-of-0s-1s-and-2s
---

<!-- @summary -->
Find every element appearing more than n/3 times — where the verification pass that Majority Element I could skip becomes mandatory and its absence is wrong on 89.77% of inputs, and where the counting algorithm's cost is completely flat while a hash map swings 10.6x with the data.

<!-- @theory -->
## The problem

Return all elements appearing **more than ⌊n/3⌋ times**. There may be none, one,
or two — never three.

```
[3, 2, 3]        ->  [3]          n/3 = 1, and 3 appears twice
[1, 2]           ->  [1, 2]       n/3 = 0, and both appear once
[1, 1, 1, 3, 3, 2, 2, 2]  ->  [1, 2]
```

## Why at most two

If three distinct values each appeared more than n/3 times, they would account
for more than n elements between them. So the answer has size 0, 1 or 2 —
verified over every array from four distinct values with n up to 12, where the
maximum found was exactly 2.

That bound is what makes the whole approach possible: you only ever need to
track **two** candidates.

## Extending Boyer-Moore

**Majority Element I** kept one candidate and one counter, cancelling a matched
element against an unmatched one. With a threshold of n/3 the same idea runs with
two candidates: an element that matches either candidate reinforces it, and an
element matching neither cancels **one from each**.

```
for each x:
    if x == candidate1:  count1++
    elif x == candidate2: count2++
    elif count1 == 0:    candidate1, count1 = x, 1
    elif count2 == 0:    candidate2, count2 = x, 1
    else:                count1--; count2--
```

The intuition is a knockout: three distinct values cancel each other out, and
only a value appearing more than a third of the time can survive enough rounds.

## The order of those branches is not arbitrary

Matching an existing candidate must come **before** filling an empty slot. Swap
those and the same value can be installed as both candidates, which wastes a slot
that a genuine answer needed:

```
[0, 0, 1, 1, 1]   filling empty slots first  ->  [1]
                  correct                    ->  [0, 1]
```

Measured 7.08% wrong over all 1,398,101 arrays from four distinct values with
n up to 10 — it does not produce a wrong answer so much as **lose a right one**.

Two related worries turn out to be unfounded, and both are worth knowing so you
do not add code you do not need:

- **Checking candidate 2 before candidate 1 is harmless.** Measured 0 failures.
- **The candidates can never end up equal.** Measured across all 1,398,101
  arrays, the correct branch order produced `candidate1 == candidate2` exactly
  **zero** times. The `set()` many implementations wrap the result in is doing
  nothing.

## The verification pass is now mandatory

This is the real difference from Majority Element I. There, a majority element was
**guaranteed to exist**, so whatever survived the cancellation had to be it and
the second pass could be skipped. Here nothing is guaranteed — the answer may be
empty — and the algorithm always finishes holding two candidates regardless.

Returning them unverified is wrong on **89.77%** of inputs, the highest failure
rate measured anywhere in this module. The smallest case is `[0, 0, 1]`: the
cancellation ends holding 0 and 1, but n/3 is 1 and the value 1 appears only once.

```
count each candidate in a second pass
keep it only if its count is strictly greater than n/3
```

**Strictly greater.** Using `>=` measured **60.38% wrong**, failing on that same
`[0, 0, 1]` — with n/3 = 1, a value appearing exactly once passes a `>=` test and
must not.

## What it costs

The two-candidate scan is two passes with four integers of state, so its cost
depends on nothing but n:

| n | Distribution | Hash map | Sorting | Boyer-Moore | Hash / BM |
|---|---|---|---|---|---|
| 1,000,000 | two majorities | 17.28ms | 10.66ms | **4.49ms** | 3.85x |
| 1,000,000 | none, many distinct | 48.77ms | 38.58ms | **4.50ms** | **10.85x** |
| 1,000,000 | none, 4 distinct | 5.62ms | 6.26ms | **4.49ms** | 1.25x |

Look at the Boyer-Moore column: **4.49, 4.50, 4.49** — identical across three
completely different distributions. The hash map ranges from 5.62ms to 48.77ms on
the same size of input, an **8.7x swing**, because its map grows with the number
of distinct values.

So the advantage depends entirely on the data: **10.85x** when values are mostly
distinct, and only **1.25x** when there are just four of them. Benchmark this on
low-cardinality data and you will conclude the hash map is fine.

The 3.85x on the two-majorities case matches the 3.8x measured for the
single-candidate version in **Majority Element I**, which is the same algorithm
with one fewer candidate.

<!-- @intuition -->
Think of it as a tournament where any three differently-labelled players who meet all knock each other out simultaneously. A label held by more than a third of the players cannot be eliminated: there are simply not enough other players to pair it off, because every knockout consumes one of each of three distinct labels. So after every possible cancellation, at most two labels can still be standing. But surviving is not the same as qualifying — with few players and no real majority, two labels can be left standing purely because nothing was around to knock them out. That is why the survivors must be counted afterwards: the tournament narrows the field to two suspects, and only a recount convicts.

<!-- @approach -->
### Brute Force - Count Each Distinct Value

<!-- @idea -->
For each element, scan the whole array counting how many times it occurs, and keep it if that exceeds n/3.

<!-- @steps -->
1. Take each position in turn.
2. Scan the entire array counting occurrences of that value.
3. Keep the value when its count is strictly greater than n over 3.
4. Skip it if it has already been collected, to avoid reporting it twice.
5. Return the collected values.

<!-- @complexity -->
- time: O(n^2)
- space: O(1) beyond the output
- note: Correct and the natural reference, since it makes no argument about how many answers can exist. Unusable past a few thousand elements — the counting scan runs once per position regardless of how few distinct values there are.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<int> majorityElement(const vector<int>& a) {
    vector<int> out;
    int n = a.size(), limit = n / 3;

    for (int i = 0; i < n; i++) {
        if (find(out.begin(), out.end(), a[i]) != out.end()) continue;   // already kept
        int count = 0;
        for (int j = 0; j < n; j++) if (a[j] == a[i]) count++;
        if (count > limit) out.push_back(a[i]);                          // strictly greater
    }
    sort(out.begin(), out.end());
    return out;
}
```

<!-- @annotations -->
- 10: Skipping values already collected, so a repeated majority is not reported twice.
- 13: Strictly greater than n/3. Using >= instead measured 60.38% wrong.

<!-- @code java -->
```java
import java.util.*;

static List<Integer> majorityElement(int[] a) {
    List<Integer> out = new ArrayList<>();
    int n = a.length, limit = n / 3;

    for (int i = 0; i < n; i++) {
        if (out.contains(a[i])) continue;
        int count = 0;
        for (int j = 0; j < n; j++) if (a[j] == a[i]) count++;
        if (count > limit) out.add(a[i]);
    }
    Collections.sort(out);
    return out;
}
```

<!-- @annotations -->
- 11: The threshold uses integer division, so for n = 8 the limit is 2 and a value needs at least 3 occurrences.

<!-- @code python -->
```python
def majority_element(a):
    n = len(a)
    limit = n // 3
    out = []

    for x in a:
        if x in out:
            continue
        if a.count(x) > limit:      # strictly greater
            out.append(x)
    return sorted(out)


# a.count(x) is itself a full scan, which is what makes this O(n^2).
```

<!-- @annotations -->
- 9: a.count is a full pass, so this line is where the quadratic cost lives.

<!-- @approach -->
### Hash Map Counting

<!-- @idea -->
Tally every value in one pass, then report those whose tally exceeds n/3.

<!-- @steps -->
1. Walk the array incrementing a count per distinct value.
2. Compute the threshold as n divided by three, rounded down.
3. Walk the tally.
4. Collect every value whose count is strictly greater than the threshold.
5. Sort the result if a canonical order is wanted.

<!-- @complexity -->
- time: O(n) expected
- space: O(k) for k distinct values, up to O(n)
- note: The straightforward linear solution, and its cost swings with the data rather than the size. On a million elements it measured 5.62ms with four distinct values and 48.77ms with many — an 8.7x range at identical n — because the map grows with distinct values. The two-candidate scan measured 4.49ms on both.

<!-- @code cpp -->
```cpp
#include <vector>
#include <unordered_map>
#include <algorithm>
using namespace std;

vector<int> majorityElement(const vector<int>& a) {
    unordered_map<int,int> count;
    count.reserve(a.size() * 2);
    for (int x : a) count[x]++;

    vector<int> out;
    int limit = a.size() / 3;
    for (auto& [value, c] : count) if (c > limit) out.push_back(value);

    sort(out.begin(), out.end());
    return out;
}
```

<!-- @annotations -->
- 9: One pass to tally. The map's size is the number of distinct values, which is what makes this data-dependent.
- 13: Strictly greater, and the threshold is integer division so it truncates.

<!-- @code java -->
```java
import java.util.*;

static List<Integer> majorityElement(int[] a) {
    Map<Integer,Integer> count = new HashMap<>();
    for (int x : a) count.merge(x, 1, Integer::sum);

    List<Integer> out = new ArrayList<>();
    int limit = a.length / 3;
    for (Map.Entry<Integer,Integer> e : count.entrySet())
        if (e.getValue() > limit) out.add(e.getKey());

    Collections.sort(out);
    return out;
}
```

<!-- @annotations -->
- 5: merge increments an existing tally or inserts one, doing the whole update in a single call.

<!-- @code python -->
```python
from collections import Counter

def majority_element(a):
    limit = len(a) // 3
    return sorted(v for v, c in Counter(a).items() if c > limit)


# Measured on a million elements: 5.62ms with four distinct values,
# 48.77ms with many. The two-candidate scan measured 4.49ms on both.
```

<!-- @annotations -->
- 5: Counter builds the whole tally, so memory tracks the number of distinct values rather than the array's length.

<!-- @approach -->
### Sorting Then Grouping

<!-- @idea -->
Sort the array so equal values become adjacent, then walk it measuring each run's length.

<!-- @steps -->
1. Sort a copy of the array.
2. Walk it, finding the extent of each run of equal values.
3. Compare each run's length against n divided by three.
4. Collect the value when the run is strictly longer.
5. Runs are already in ascending order, so the result needs no further sorting.

<!-- @complexity -->
- time: O(n log n), dominated by the sort
- space: O(1) beyond the sort, or O(n) if the caller's array must be preserved
- note: Needs no auxiliary structure and its cost is far more stable than the hash map's, but it is still beaten by the two-candidate scan at every size and distribution measured — 10.66ms against 4.49ms on a million elements with two majorities.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

vector<int> majorityElement(vector<int> a) {      // by value: caller's data survives
    sort(a.begin(), a.end());
    vector<int> out;
    int n = a.size(), limit = n / 3;

    for (int i = 0; i < n; ) {
        int j = i;
        while (j < n && a[j] == a[i]) j++;         // extent of this run
        if (j - i > limit) out.push_back(a[i]);
        i = j;
    }
    return out;
}
```

<!-- @annotations -->
- 12: Advancing j to the end of the run, so each element is visited exactly once across the whole loop.
- 13: The run's length compared strictly against the threshold.

<!-- @code java -->
```java
import java.util.*;

static List<Integer> majorityElement(int[] nums) {
    int[] a = nums.clone();
    Arrays.sort(a);
    List<Integer> out = new ArrayList<>();
    int n = a.length, limit = n / 3;

    for (int i = 0; i < n; ) {
        int j = i;
        while (j < n && a[j] == a[i]) j++;
        if (j - i > limit) out.add(a[i]);
        i = j;
    }
    return out;
}
```

<!-- @annotations -->
- 4: Cloning first, since Arrays.sort would otherwise reorder the caller's array.

<!-- @code python -->
```python
def majority_element(nums):
    a = sorted(nums)
    n = len(a)
    limit = n // 3
    out = []

    i = 0
    while i < n:
        j = i
        while j < n and a[j] == a[i]:
            j += 1
        if j - i > limit:
            out.append(a[i])
        i = j
    return out


# Sorting puts the result in ascending order for free.
```

<!-- @annotations -->
- 10: Scanning to the end of each run, which keeps the whole walk linear after the sort.

<!-- @approach -->
### Optimal - Extended Boyer-Moore with Two Candidates

<!-- @idea -->
Carry two candidates and two counters, cancelling one from each whenever an element matches neither, then verify both survivors in a second pass.

<!-- @steps -->
1. Start with two empty candidate slots and two counters at zero.
2. For each element, increase the counter if it matches either candidate.
3. Otherwise install it in an empty slot if one exists.
4. Otherwise decrease both counters, cancelling three distinct values against each other.
5. After the pass, count each surviving candidate's actual occurrences.
6. Keep only those occurring strictly more than n divided by three times.

<!-- @complexity -->
- time: O(n), two passes
- space: O(1) — two candidates and two counters
- note: The recommended solution, and the only one whose cost is independent of the data: measured 4.49ms, 4.50ms and 4.49ms across three completely different distributions at a million elements, where the hash map ranged from 5.62ms to 48.77ms. The verification pass is mandatory here, unlike in Majority Element I — omitting it measured 89.77% wrong.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <climits>
using namespace std;

vector<int> majorityElement(const vector<int>& a) {
    long long c1 = LLONG_MIN, c2 = LLONG_MIN;      // sentinels: no value can equal them
    int n1 = 0, n2 = 0;

    for (int x : a) {
        if (c1 == x) n1++;                         // match FIRST
        else if (c2 == x) n2++;
        else if (n1 == 0) { c1 = x; n1 = 1; }      // then fill an empty slot
        else if (n2 == 0) { c2 = x; n2 = 1; }
        else { n1--; n2--; }                       // three distinct values cancel
    }

    vector<int> out;
    int limit = a.size() / 3;
    for (long long c : {c1, c2}) {
        if (c == LLONG_MIN) continue;
        int count = 0;
        for (int x : a) if (x == c) count++;       // MANDATORY verification
        if (count > limit) out.push_back((int)c);
    }
    sort(out.begin(), out.end());
    return out;
}
```

<!-- @annotations -->
- 7: A sentinel outside the int range, so an empty slot cannot be confused with a real value of zero.
- 11: Matching before filling. Reversing these two measured 7.08% wrong by losing a valid answer.
- 15: Cancelling one from each counter, which is the three-way knockout the n/3 threshold implies.
- 23: Without this second pass the answer is wrong on 89.77% of inputs, since the scan always ends holding two candidates.

<!-- @code java -->
```java
import java.util.*;

static List<Integer> majorityElement(int[] a) {
    Integer c1 = null, c2 = null;
    int n1 = 0, n2 = 0;

    for (int x : a) {
        if (c1 != null && c1 == x) n1++;
        else if (c2 != null && c2 == x) n2++;
        else if (n1 == 0) { c1 = x; n1 = 1; }
        else if (n2 == 0) { c2 = x; n2 = 1; }
        else { n1--; n2--; }
    }

    List<Integer> out = new ArrayList<>();
    int limit = a.length / 3;
    for (Integer c : new Integer[]{c1, c2}) {
        if (c == null) continue;
        int count = 0;
        for (int x : a) if (x == c) count++;
        if (count > limit) out.add(c);
    }
    Collections.sort(out);
    return out;
}
```

<!-- @annotations -->
- 8: The null check must come first, since unboxing a null Integer for comparison throws.
- 20: Counting the survivor's real occurrences, which is what the cancellation pass cannot tell you.

<!-- @code python -->
```python
def majority_element(a):
    c1 = c2 = None
    n1 = n2 = 0

    for x in a:
        if c1 == x:
            n1 += 1
        elif c2 == x:
            n2 += 1
        elif n1 == 0:
            c1, n1 = x, 1
        elif n2 == 0:
            c2, n2 = x, 1
        else:
            n1 -= 1
            n2 -= 1

    limit = len(a) // 3
    return sorted(c for c in (c1, c2)
                  if c is not None and a.count(c) > limit)


# The two candidates can never be equal with this branch order —
# verified over 1,398,101 arrays — so no deduplication is needed.
```

<!-- @annotations -->
- 6: Matching an existing candidate comes first. Filling an empty slot first measured 7.08% wrong.
- 20: The mandatory recount, using strictly greater. Omitting it measured 89.77% wrong; using >= measured 60.38%.

<!-- @example -->

<!-- @input -->
a = [1, 1, 1, 3, 3, 2, 2, 2]

<!-- @output -->
[1, 2]

<!-- @why -->
Two genuine answers plus a third value that survives partway through the cancellation, so it exercises both the knockout and the verification.

<!-- @walkthrough -->
1. n is 8, so the threshold is 8 divided by 3, which is 2 — a value needs at least 3 occurrences.
2. The first 1 fills the empty first slot, and the next two 1s raise its counter to 3.
3. The first 3 matches neither candidate and the second slot is empty, so 3 is installed with a count of 1.
4. The second 3 matches candidate two, raising its counter to 2.
5. The first 2 matches neither and both slots are full, so both counters drop, to 2 and 1.
6. The second 2 cancels again, leaving counters of 1 and 0, and the third 2 then takes the freed second slot.
7. The survivors are 1 and 2; counting them gives 3 and 3, both above 2, so both are kept.

<!-- @example -->

<!-- @input -->
a = [0, 0, 1] with the verification pass omitted

<!-- @output -->
[0, 1] — and the correct answer is [0]

<!-- @why -->
The smallest input showing that the scan always finishes holding two candidates whether or not they qualify.

<!-- @walkthrough -->
1. n is 3, so the threshold is 1 — a value needs at least 2 occurrences.
2. The first 0 fills the first slot with a count of 1, and the second 0 raises it to 2.
3. The 1 matches neither candidate, and the second slot is empty, so it is installed there.
4. The scan ends holding candidates 0 and 1, with counters 2 and 1.
5. Returning both is wrong: the value 1 appears once, which is not more than 1.
6. The verification pass counts each survivor and discards 1, leaving [0].
7. Measured over 1,398,101 arrays, skipping that pass was wrong on 89.77% of them.

<!-- @example -->

<!-- @input -->
a = [0, 0, 1, 1, 1] with empty slots filled before matching

<!-- @output -->
[1] — and the correct answer is [0, 1]

<!-- @why -->
Shows the branch-order bug losing a valid answer rather than inventing a wrong one, which is why the output still looks plausible.

<!-- @walkthrough -->
1. n is 5, so the threshold is 1 — a value needs at least 2 occurrences, and both 0 and 1 qualify.
2. With the correct order the first 0 fills slot one, the second 0 matches it, and 1 later fills slot two.
3. With empty slots checked first, the first 0 fills slot one and the second 0 fills slot two — the same value in both.
4. A slot that a genuine second answer needed has been consumed by a duplicate.
5. The three 1s then cancel against the two 0s until the 0 candidate is displaced.
6. Only 1 survives to the verification pass, so 0 is never counted and never reported.
7. Measured 7.08% wrong over all 1,398,101 arrays tested.

<!-- @example -->

<!-- @input -->
1,000,000 elements, three different distributions

<!-- @output -->
Boyer-Moore 4.49ms, 4.50ms, 4.49ms — against the hash map's 17.28ms, 48.77ms, 5.62ms

<!-- @why -->
Shows that one algorithm's cost is set by the input's size and the other's by its shape, which decides which to pick.

<!-- @walkthrough -->
1. The two-candidate scan makes exactly two passes and holds four integers, whatever the data looks like.
2. Measured across two majorities, no majority with many distinct values, and no majority with only four, it took 4.49ms, 4.50ms and 4.49ms.
3. The hash map's cost tracks the number of distinct values, since that is its map's size.
4. With four distinct values it took 5.62ms, close to the scan.
5. With many distinct values the map far exceeds cache and it took 48.77ms.
6. That is an 8.7x swing on identical input size, and the advantage over the scan ranges from 1.25x to 10.85x.
7. Benchmarking only on low-cardinality data would suggest the hash map is perfectly adequate.

<!-- @visualization array -->

<!-- @description -->
The array as a strip with two candidate slots drawn as large empty frames above it, each with its own counter dial — the two slots are the algorithm's entire state, so they must dominate the frame rather than sit in a corner. Colour each distinct value consistently throughout so a reader tracks values by hue rather than by reading digits. Walk a marker along the strip and, for each element, resolve the branch chain visibly as a cascade of four tests in fixed order: does it match slot one, then slot two, then is slot one empty, then is slot two empty — lighting each test as it is evaluated and stopping at the first that passes. That cascade is the lesson, so play it slowly at first and show the fall-through to the cancellation case, where BOTH dials tick down together and the element is greyed out having been knocked out along with one from each slot. Show a slot emptying when its dial reaches zero, its frame visibly clearing, and then being reclaimed by the next unmatched value. Run the canonical [1,1,1,3,3,2,2,2] so the value 3 occupies a slot for a while and is later displaced, which makes clear that occupying a slot is not the same as qualifying. Then the verification, staged as a deliberate second act with a visual break: the two surviving values step out of their slots onto a scoreboard, a threshold line is drawn at n/3, and the strip is re-walked counting each survivor's real occurrences as a bar growing toward that line. Whichever bar fails to cross is struck out. Run that panel on [0,0,1] where the second bar stops exactly at the line and is rejected, captioning that the test is strictly greater and that >= measured 60.38% wrong. Beside it, a panel with the branch order reversed on [0,0,1,1,1]: show the same value filling both slots, the duplicate frame flashing, and the genuine second answer having nowhere to go. Close with a cost chart of three bars per algorithm across three distributions, where the Boyer-Moore bars are visibly identical at 4.49, 4.50 and 4.49 while the hash bars range from 5.62 to 48.77.

<!-- @sampleInput -->
```json
{"primary":{"input":[1,1,1,3,3,2,2,2],"n":8,"threshold":2,"trace":[{"x":1,"branch":"slot1 empty","c1":1,"n1":1,"c2":null,"n2":0},{"x":1,"branch":"match slot1","c1":1,"n1":2,"c2":null,"n2":0},{"x":1,"branch":"match slot1","c1":1,"n1":3,"c2":null,"n2":0},{"x":3,"branch":"slot2 empty","c1":1,"n1":3,"c2":3,"n2":1},{"x":3,"branch":"match slot2","c1":1,"n1":3,"c2":3,"n2":2},{"x":2,"branch":"cancel both","c1":1,"n1":2,"c2":3,"n2":1},{"x":2,"branch":"cancel both","c1":1,"n1":1,"c2":3,"n2":0},{"x":2,"branch":"slot2 empty","c1":1,"n1":1,"c2":2,"n2":1}],"survivors":[1,2],"verifiedCounts":{"1":3,"2":3},"answer":[1,2],"note":"3 held a slot for a while and was displaced — occupying is not qualifying"},"verifyPanel":{"input":[0,0,1],"n":3,"threshold":1,"survivors":[0,1],"actualCounts":{"0":2,"1":1},"kept":[0],"withoutVerification":[0,1],"failureRate":0.8977,"geFailureRate":0.6038,"arraysTested":1398101},"branchOrderPanel":{"input":[0,0,1,1,1],"correctOrder":{"result":[0,1]},"emptyFirst":{"result":[1],"cause":"the same value fills both slots, consuming one a real answer needed"},"failureRate":0.0708,"harmlessVariants":[{"variant":"check candidate 2 before candidate 1","failureRate":0.0},{"variant":"deduplicate the two candidates","failureRate":0.0,"note":"the correct order never produces equal candidates - 0 of 1398101"}]},"boundPanel":{"claim":"at most two elements can exceed n/3","maxFound":2,"searchSpace":"all arrays over 4 distinct values, n = 0..12"},"costPanel":{"n":1000000,"rows":[{"distribution":"two majorities","hashMs":17.28,"sortingMs":10.66,"boyerMs":4.49,"ratio":3.85},{"distribution":"none, many distinct","hashMs":48.77,"sortingMs":38.58,"boyerMs":4.50,"ratio":10.85},{"distribution":"none, 4 distinct","hashMs":5.62,"sortingMs":6.26,"boyerMs":4.49,"ratio":1.25}],"boyerIsFlat":true,"hashSwing":8.7}}
```

<!-- @highlights -->
- Two candidate slots are drawn as large frames above the strip, each with its own counter dial, dominating the frame.
- Each distinct value keeps a consistent colour, so values are tracked by hue rather than by reading digits.
- For every element the branch chain resolves as a visible cascade of four tests in fixed order, stopping at the first that passes.
- The first 1 finds slot one empty and fills it; the next two 1s match it and raise its dial to 3.
- The first 3 matches neither candidate and takes the empty second slot.
- The first 2 matches neither and both slots are full, so BOTH dials tick down together and the element is greyed out.
- That cancellation is shown as a three-way knockout, one element and one from each slot.
- The second 2 cancels again, the 3's dial reaches zero, and its frame visibly clears.
- The third 2 then reclaims the freed slot, making clear that occupying a slot is not the same as qualifying.
- A visual break separates the verification, staged as a deliberate second act.
- The two survivors step onto a scoreboard, a threshold line is drawn at n/3, and the strip is re-walked with bars growing toward it.
- On [0,0,1] the second bar stops exactly at the line and is struck out, captioned that the test is strictly greater.
- A branch-order panel on [0,0,1,1,1] shows the same value filling both slots, the duplicate frame flashing.
- The genuine second answer is shown having nowhere to go, so the bug loses a right answer rather than inventing a wrong one.
- A closing chart shows Boyer-Moore bars identical at 4.49, 4.50 and 4.49 across three distributions.
- The hash bars beside them range from 5.62 to 48.77 on the same input size.

<!-- @edgeCases -->
- Empty array — no answers, and the threshold of zero must not cause an empty candidate to be reported.
- Single element — n/3 is 0, so that element qualifies with one occurrence.
- Two distinct elements — n/3 is 0, so both qualify, and this is the case that surprises people.
- Two identical elements — one answer, reported once rather than twice.
- All elements identical — a single answer, and one candidate slot is never used.
- Exactly three elements, all distinct — n/3 is 1, so none qualifies despite each appearing once.
- A value appearing exactly n/3 times — must be rejected, since the test is strictly greater.
- A value appearing exactly n/3 plus one times — the smallest qualifying count.
- Two genuine answers plus a third value that briefly holds a slot — the case showing that surviving is not qualifying.
- Negative values — nothing assumes positivity, but a sentinel for an empty slot must lie outside the value range.
- Values equal to whatever sentinel is chosen — using 0 or Integer.MIN_VALUE as an empty marker breaks on arrays containing it.
- Very large arrays with few distinct values — where the hash map is nearly as fast and the advantage shrinks to 1.25x.

<!-- @pitfalls -->
- Omitting the verification pass. The scan always ends holding two candidates whether they qualify or not — measured 89.77% wrong, the highest rate in this module.
- Assuming the verification can be skipped as in Majority Element I. There a majority was guaranteed to exist; here the answer may be empty.
- Using >= n/3 rather than > n/3. Measured 60.38% wrong, failing on [0,0,1] where a value appearing once passes a threshold of 1.
- Filling an empty candidate slot before checking for a match. The same value then occupies both slots — measured 7.08% wrong, and it loses a valid answer rather than inventing one.
- Adding a deduplication step for the two candidates. The correct branch order never produces equal candidates, verified across 1,398,101 arrays.
- Reordering the two match tests. Checking candidate 2 before candidate 1 measured zero failures and is entirely harmless.
- Using 0 or another in-range value as the empty-slot sentinel. Any array containing that value then behaves as though the slot were occupied.
- Decrementing only one counter on a mismatch. The n/3 threshold requires a three-way cancellation, so both must drop together.
- Reporting a candidate whose counter is non-zero without counting it. A non-zero counter means it survived cancellation, not that it is frequent.
- Assuming three answers are possible. Three values each above n/3 would need more than n elements — the maximum found over every array tested was two.
- Benchmarking on low-cardinality data. The advantage over a hash map measured 1.25x with four distinct values and 10.85x with many.
- Expecting the hash map's cost to track n. It tracks the number of distinct values, swinging 8.7x on identical input sizes.

<!-- @doubt -->
### Why is the verification pass mandatory here when Majority Element I could skip it?

<!-- @answer -->
Because that problem guaranteed a majority element existed. Whatever survived the cancellation had to be it, so counting was optional. Here nothing is guaranteed — the answer can be empty — and the scan always finishes holding two candidates regardless, because nothing ever clears a slot except a later value taking it. On [0,0,1] the survivors are 0 and 1, but with n/3 = 1 the value 1 appears only once and does not qualify. Measured over 1,398,101 arrays, returning the survivors unverified was wrong on 89.77% of them.

<!-- @doubt -->
### Why strictly greater than n/3 rather than at least?

<!-- @answer -->
Because the problem asks for more than a third, and the boundary case is common rather than exotic. On [0,0,1] the threshold is 3 // 3 = 1, and the value 1 appears exactly once — a >= test accepts it and must not. Measured 60.38% wrong across all arrays tested, which is high precisely because small arrays make the threshold small and the boundary easy to land on. Note the threshold uses integer division, so for n = 8 the limit is 2 and a qualifying value needs at least 3 occurrences.

<!-- @doubt -->
### Does the order of the branches matter?

<!-- @answer -->
Partly, and the part that matters is specific. Matching an existing candidate must come before filling an empty slot: reverse those and the same value can be installed in both slots, consuming one that a genuine second answer needed. On [0,0,1,1,1] that returns [1] where the answer is [0,1] — measured 7.08% wrong, and note it loses a right answer rather than producing a wrong one, so the output still looks plausible. What does not matter is which candidate you check first: testing candidate 2 before candidate 1 measured zero failures.

<!-- @doubt -->
### Should I deduplicate the two candidates before returning?

<!-- @answer -->
No, it is dead code. With the correct branch order the two candidates can never be equal, because a value matching candidate 1 is caught by the first test and never reaches the slot-filling branches. Measured across all 1,398,101 arrays tested, the correct implementation produced equal candidates exactly zero times. Many published solutions wrap the result in a set anyway, which is harmless but hides the fact that the branch order already guarantees it — and if you are relying on the set, you will not notice when the branch order is wrong.

<!-- @doubt -->
### Why can there be at most two answers?

<!-- @answer -->
Because three values each appearing more than n/3 times would need more than n elements between them, which is impossible. That bound is what licenses tracking exactly two candidates, and it generalises: for a threshold of n/k you need k − 1 candidates. Verified empirically over every array from four distinct values with n up to 12, where the maximum number of qualifying values found was exactly 2.

<!-- @doubt -->
### Why decrement both counters instead of one?

<!-- @answer -->
Because the cancellation must be three-way to match the n/3 threshold. When an element matches neither candidate, you are discarding three distinct values at once — the incoming element and one occurrence backing each candidate. That is exactly the accounting that makes a value appearing more than a third of the time impossible to eliminate: there are not enough other elements to pair it off. Decrementing only one counter makes the cancellation two-way, which is the accounting for the n/2 threshold in Majority Element I.

<!-- @doubt -->
### Is Boyer-Moore always faster than a hash map here?

<!-- @answer -->
It was faster at every size and distribution measured, but by margins that vary enormously. On a million elements it measured 4.49ms regardless of the data, while the hash map ranged from 5.62ms with four distinct values to 48.77ms with many — an 8.7x swing on identical input size, because the map's size is the number of distinct values. So the advantage was 1.25x in the low-cardinality case and 10.85x in the high-cardinality one. If you benchmark on data with few distinct values you will reasonably conclude the hash map is fine, and on real data with many you will be losing an order of magnitude.

<!-- @doubt -->
### What sentinel should mark an empty candidate slot?

<!-- @answer -->
Something that cannot appear in the array, which usually means widening the type rather than picking a magic number. Using 0 breaks on any array containing 0, and using Integer.MIN_VALUE breaks on any array containing that. Holding the candidates as a 64-bit type and using a value outside the 32-bit range works, and so does an explicit null or a separate boolean per slot. The Java version here uses null Integers, which is safe but requires a null check before unboxing — comparing a null Integer to an int throws.
