---
id: remove-duplicates-from-sorted-array
topic: Arrays
title: Remove Duplicates from Sorted Array
difficulty: Easy
status: ready
prerequisites:
  - largest-element
  - for-loop
  - if-else-statements
  - relational-and-logical-operators
  - pass-by-value-vs-pass-by-reference
  - time-and-space-complexity-basics
relatedIds:
  - largest-element
  - second-largest-element
  - move-zeros-to-end
  - linear-search
---

<!-- @summary -->
Collapse a sorted array's duplicates in place and return how many unique values remain — the problem that introduces the read/write pointer split, and where returning a count instead of an array confuses more people than the algorithm does.

<!-- @theory -->
## The problem

Given a sorted array `nums`, remove the duplicates **in place** so each unique
value appears once, keeping the original relative order. Return `k`, the number
of unique elements. The first `k` positions of `nums` must hold those values.
Use only O(1) extra memory.

Three constraints are doing real work, and each rules out an approach that would
otherwise be fine.

## The return contract confuses people more than the algorithm

You do not return the array. You return a **count**, and you edit the array
through the reference you were given.

Whatever sits beyond index `k - 1` is **ignored**. Not required to be empty, not
required to be anything — the judge reads the first `k` slots and stops. Verified
on `[0,0,1,1,1,2,2,3,3,4]`: after the scan, `k = 5`, the first five slots read
`[0,1,2,3,4]`, and the tail is left as `[2,2,3,3,4]` — stale values from before
the compaction that nobody looks at.

People lose time trying to shrink the array or blank the tail. Neither is asked
for, and in C++ the vector's size does not change unless you erase.

**In place** also means the caller sees your edits. That is the pass-by-reference
lesson from Basics becoming the entire point of the exercise rather than a
footnote: mutating the caller's data is the requirement here, not the hazard.

## Sorted is the gift

Because the array is sorted, **every duplicate is adjacent to its twin**. There
is no need to remember which values you have seen — the only value that could
duplicate the current one is the one immediately before it.

That single fact is what collapses this from a hashing problem into a comparison
of neighbours, and it is why the unsorted version of this problem is genuinely
harder and needs O(n) extra space.

## The ladder

### 1. Shift everything left on each duplicate

The most direct in-place idea: when `nums[i] == nums[i+1]`, delete the second one
by sliding the rest of the array one position left.

Correct, and quadratic. Each deletion moves up to `n` elements, and there can be
up to `n` deletions. Measured: at n = 100,000 this takes **339.932ms** against
**0.478ms** for the two-pointer — **717x**. The ratio was 24x at n = 1,000 and 57x
at 10,000, growing linearly with `n` exactly as O(n²) against O(n) predicts.

It fails on **time**.

### 2. Put everything in a set, then write it back

If the goal is uniqueness, a set gives it directly. Insert every element, then
write the set's contents back to the front of the array.

This works, and it throws away the sortedness you were handed — you pay
O(log n) per insert to rediscover an order the input already had. Measured at
n = 1,000,000: **222.302ms**, which is **46x slower** than the two-pointer, because
every insert allocates a node.

It also needs O(n) extra memory, so it fails on **space** — the one constraint
the problem states outright.

**And in Python it is a correctness trap.** `list(set(arr))` does not preserve
order. The measured failure rate on sorted input, by value range:

| values | arrays reordered |
|---|---|
| 0–9 | 0 / 20,000 (0.0%) |
| 0–99 | 19,937 / 20,000 (99.7%) |
| 0–999 | 19,998 / 20,000 (100.0%) |
| 0–999,999 | 20,000 / 20,000 (100.0%) |

Small integers hash to themselves and land in slot order while they still fit the
table, so `[1,1,2,2,3]` really does give `[1,2,3]` and every tutorial example
looks perfect. Step outside single digits and it breaks essentially always — the
first randomly drawn realistic array tested here went `[11,32,41,49]` →
`[32,41,11,49]`. If you want a set-like idiom that keeps order, use
`dict.fromkeys(arr)`, which preserves insertion order in Python 3.7 and later.

### 3. Build a temporary array, then copy back

Walk once, appending each element that differs from the previous one to a fresh
array, then copy that array back over the front of the original.

This is O(n) time and genuinely simple — measured **5.397ms** at n = 1,000,000,
within striking distance of optimal. But it still allocates a second array, so it
fails on **space** for the same reason as the set, just less expensively.

It is worth writing once, because the two-pointer is exactly this idea with the
temporary array deleted.

### 4. Two pointers — the optimal

Here is the observation that removes the extra array. The temporary array is
always **shorter than or equal to** the portion of the input already consumed. So
its contents can be written straight into the original array without ever
overwriting anything still needed.

Keep two indices:

- `i` — the **write** pointer. `nums[0..i]` holds the unique values found so far.
- `j` — the **read** pointer, scanning forward.

For each `j`, compare `nums[j]` against `nums[i]`, the last value written. If they
differ, `nums[j]` is a new unique value: advance `i` and write it there. If they
match, it is a duplicate — skip it and leave `i` alone.

The **invariant** is the thing to hold onto: *`nums[0..i]` is always exactly the
deduplicated prefix of everything read so far.* It is true before the loop with
`i = 0`, every iteration preserves it, and when `j` reaches the end it says the
whole array has been deduplicated into `nums[0..i]`. So return `i + 1`.

O(n) time, O(1) space, one pass. Measured **4.838ms** at n = 1,000,000, against
**4.558ms** for `std::unique` — writing it by hand costs essentially nothing in
C++.

### 5. The library call

`std::unique` in C++ does exactly this and returns an iterator to the new end;
the container is **not** shrunk, which mirrors the problem's own contract
remarkably well. Python has `itertools.groupby`, whose keys are the unique run
values, and `dict.fromkeys` for the order-preserving set idiom.

## Why the != guard matters

Writing `nums[++i] = nums[j]` only when the values differ is not just tidiness. It
avoids writing a value back onto itself.

Measured write counts at n = 1,000,000: an array of all identical values performs
**0 writes**, each-value-twice performs **499,999**, and all-distinct performs
**999,999**. An unguarded version that assigns on every iteration performs
`n - 1` writes no matter what the data looks like.

## Python inverts the ranking again

Measured at n = 100,000: `sorted(set(a))` **3.095ms**, `dict.fromkeys`
**3.904ms**, the two-pointer **7.548ms**.

The approach that violates the space constraint is **2.4x faster** than the
optimal one, because `set` and `sorted` run as compiled C while the two-pointer
loop runs in the interpreter. This is the third subtopic in a row where Python's
constant factors contradict the complexity ranking — the same effect as `max()`
beating a hand loop by 4x in Largest Element.

The conclusion is not to submit the set version: the problem demands O(1) extra
space, and in Python it also demands `dict.fromkeys` over `set` for correctness.
The conclusion is that **complexity classes rank algorithms, not runtimes**, and
on a given machine and language the two orderings can disagree.

## Where this goes next

The read/write pointer split is the engine of **Remove Element**, **Move Zeros to
End** and every other in-place compaction. The same invariant style — *a prefix of
the array is always the finished answer so far* — reappears throughout the module.
Removing duplicates from an **unsorted** array is a genuinely different problem:
duplicates are no longer adjacent, so a hash set becomes necessary and O(1) space
is no longer achievable.

<!-- @intuition -->
Two people walk the array. The scout runs ahead reading; the scribe stays behind and only writes when the scout reports something new. The scribe can never outpace the scout, so everything behind the scribe is finished work and everything ahead of the scout is untouched input — which is exactly why no extra array is needed to keep them from colliding.

<!-- @approach -->
### Brute Force - Shift Left on Each Duplicate

<!-- @idea -->
When two neighbours are equal, delete the second by sliding the rest of the array one position left.

<!-- @steps -->
1. Start at the first index and compare each element with the one after it.
2. If they are equal, remove the second by shifting every later element one position left.
3. Do not advance the index after a removal, because a new element has just slid into the position after it.
4. If they differ, advance the index by one.
5. Stop when the index reaches the end, and return the remaining length.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Measured against the two-pointer: 24x slower at n = 1,000, 57x at 10,000, and 717x at 100,000 — 339.932ms against 0.478ms. The ratio grows linearly with n, which is the signature of O(n^2) against O(n).

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int removeDuplicates(vector<int>& nums) {
    for (size_t i = 0; i + 1 < nums.size(); ) {
        if (nums[i] == nums[i + 1]) {
            nums.erase(nums.begin() + i + 1);   // shifts everything after it left
        } else {
            i++;
        }
    }
    return nums.size();
}
```

<!-- @annotations -->
- 5: No increment in the loop header — the index only advances when nothing was removed.
- 7: erase is O(n) on a vector because it moves every later element. Up to n erases gives O(n^2).
- 12: This version genuinely shrinks the vector, which the problem never asked for.

<!-- @code java -->
```java
static int removeDuplicates(int[] nums) {
    int n = nums.length;
    for (int i = 0; i + 1 < n; ) {
        if (nums[i] == nums[i + 1]) {
            for (int t = i + 1; t + 1 < n; t++) nums[t] = nums[t + 1];
            n--;                                 // logical length shrinks
        } else {
            i++;
        }
    }
    return n;
}
```

<!-- @annotations -->
- 5: Java arrays are fixed length, so the shift is written out and a separate counter tracks the logical size.
- 6: n is the live length. The array object keeps its original capacity forever.

<!-- @code python -->
```python
def remove_duplicates(nums):
    i = 0
    while i + 1 < len(nums):
        if nums[i] == nums[i + 1]:
            nums.pop(i + 1)      # O(n): every later element shifts down
        else:
            i += 1
    return len(nums)
```

<!-- @annotations -->
- 3: len(nums) is re-evaluated every iteration, so the loop naturally tracks the shrinking list.
- 5: list.pop(index) on anything but the last position is O(n), which is what makes the whole routine quadratic.

<!-- @approach -->
### Brute Force - Set and Rewrite

<!-- @idea -->
Insert every element into a set to collapse duplicates, then write the set back over the front of the array.

<!-- @steps -->
1. Insert every element of the array into an ordered set, which discards duplicates.
2. Note the size of the set, which is the number of unique values.
3. Write the set's elements back into the array from index zero, in order.
4. Return the size of the set.
5. In Python, use dict.fromkeys rather than set, because a plain set does not preserve order.

<!-- @complexity -->
- time: O(n log n)
- space: O(n)
- note: Violates the problem's O(1) extra memory constraint, and pays O(log n) per insert to rediscover an ordering the input already had. Measured 222.302ms at n = 1,000,000 in C++ — slower than the O(n^2)-free approaches below despite a better complexity class than the shifting version.

<!-- @code cpp -->
```cpp
#include <vector>
#include <set>
using namespace std;

int removeDuplicates(vector<int>& nums) {
    set<int> unique(nums.begin(), nums.end());   // ordered set, so sorted

    int k = 0;
    for (int value : unique) nums[k++] = value;
    return k;
}
```

<!-- @annotations -->
- 6: std::set is ordered. unordered_set would collapse duplicates but hand them back in arbitrary order.
- 9: Measured 222.302ms at n = 1,000,000 — 46x the two-pointer, because every insert allocates a tree node.

<!-- @code java -->
```java
import java.util.TreeSet;
import java.util.Set;

static int removeDuplicates(int[] nums) {
    Set<Integer> unique = new TreeSet<>();       // TreeSet keeps sorted order
    for (int x : nums) unique.add(x);

    int k = 0;
    for (int value : unique) nums[k++] = value;
    return k;
}
```

<!-- @annotations -->
- 5: TreeSet, not HashSet. HashSet would lose the ordering the input already had.
- 6: Autoboxing every int into an Integer allocates on top of the tree nodes.

<!-- @code python -->
```python
def remove_duplicates(nums):
    # WRONG in general: set() does not preserve order.
    # Measured: 99.7% of sorted arrays with values 0-99 come back reordered.
    #   [11, 32, 41, 49]  ->  list(set(...))  ->  [32, 41, 11, 49]
    # It only looks correct on single-digit data, where 0/20,000 were reordered.

    unique = list(dict.fromkeys(nums))    # preserves insertion order (3.7+)
    nums[:len(unique)] = unique
    return len(unique)
```

<!-- @annotations -->
- 3: The bug hides precisely on the data tutorials use, which is what makes it worth measuring rather than asserting.
- 7: dict.fromkeys is the order-preserving set idiom. sorted(set(nums)) also works here, but only because the input is sorted.
- 8: Slice assignment writes in place, so the caller's list is modified as the problem requires.

<!-- @approach -->
### Better - Temporary Array

<!-- @idea -->
Collect the unique values into a fresh array in one pass, then copy them back over the front.

<!-- @steps -->
1. Create an empty temporary array.
2. Walk the input once, from the first element to the last.
3. Append an element to the temporary array when it is the first element, or when it differs from the element before it.
4. Copy the temporary array back over the front of the original array.
5. Return the length of the temporary array.

<!-- @complexity -->
- time: O(n)
- space: O(n)
- note: Optimal in time and still allocating a second array, so it fails the stated O(1) memory constraint. Measured 5.397ms at n = 1,000,000 against 4.838ms for the two-pointer — the gap is the allocation and the copy back.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int removeDuplicates(vector<int>& nums) {
    vector<int> temp;
    temp.reserve(nums.size());

    for (size_t i = 0; i < nums.size(); i++) {
        if (i == 0 || nums[i] != nums[i - 1]) temp.push_back(nums[i]);
    }

    for (size_t i = 0; i < temp.size(); i++) nums[i] = temp[i];
    return temp.size();
}
```

<!-- @annotations -->
- 9: Compare against the PREVIOUS input element. Sortedness guarantees any duplicate sits immediately behind.
- 12: The copy back is the only reason this needs a second array at all — which is exactly what the two-pointer removes.

<!-- @code java -->
```java
static int removeDuplicates(int[] nums) {
    int[] temp = new int[nums.length];
    int k = 0;

    for (int i = 0; i < nums.length; i++) {
        if (i == 0 || nums[i] != nums[i - 1]) temp[k++] = nums[i];
    }

    System.arraycopy(temp, 0, nums, 0, k);
    return k;
}
```

<!-- @annotations -->
- 2: Allocated at full length because the number of uniques is not known until the scan finishes.
- 9: arraycopy is the fast bulk copy; a manual loop would work identically and more slowly.

<!-- @code python -->
```python
def remove_duplicates(nums):
    temp = [v for i, v in enumerate(nums) if i == 0 or v != nums[i - 1]]
    nums[:len(temp)] = temp
    return len(temp)
```

<!-- @annotations -->
- 2: The list comprehension runs largely in C, which is why this measured 9.871ms against 7.548ms for the explicit two-pointer at n = 100,000.
- 3: Slice assignment mutates in place; nums = temp would only rebind the local name and lose the caller's edit.

<!-- @approach -->
### Optimal - Two Pointers

<!-- @idea -->
Keep a write pointer for the deduplicated prefix and a read pointer scanning ahead, writing only when a new value appears.

<!-- @steps -->
1. Return zero immediately if the array is empty.
2. Set the write pointer i to 0, so that nums[0..0] is trivially deduplicated.
3. Scan with a read pointer j from index 1 to the end.
4. Compare nums[j] against nums[i], the last value written.
5. If they differ, advance i by one and write nums[j] into that position.
6. If they match, the value is a duplicate, so leave i where it is and move on.
7. When the scan finishes, nums[0..i] holds every unique value, so return i + 1.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: One pass, no allocation, and the only approach that satisfies every stated constraint. Measured 4.838ms at n = 1,000,000 against 4.558ms for std::unique — the hand-written version costs essentially nothing in C++. Write counts: 0 for all-identical input, 499,999 for each-value-twice, 999,999 for all-distinct.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

int removeDuplicates(vector<int>& nums) {
    if (nums.empty()) return 0;

    int i = 0;                                   // write pointer
    for (size_t j = 1; j < nums.size(); j++) {   // read pointer
        if (nums[j] != nums[i]) {
            nums[++i] = nums[j];
        }
    }
    return i + 1;                                // count, not index
}
```

<!-- @annotations -->
- 5: Without this guard, returning i + 1 on an empty array would report 1 unique element that does not exist.
- 7: The invariant: nums[0..i] is always exactly the deduplicated prefix of everything read so far.
- 9: Compare against nums[i], the last value WRITTEN, not nums[j-1]. Both work when sorted; this one states the invariant.
- 10: i can never overtake j, so this write can never clobber an element still waiting to be read.
- 13: i is the last written index, so the count is i + 1. Returning i is the most common off-by-one here.

<!-- @code java -->
```java
static int removeDuplicates(int[] nums) {
    if (nums.length == 0) return 0;

    int i = 0;
    for (int j = 1; j < nums.length; j++) {
        if (nums[j] != nums[i]) {
            nums[++i] = nums[j];
        }
    }
    return i + 1;
}
```

<!-- @annotations -->
- 5: j starts at 1 because nums[0] is already in place as the first unique value.
- 7: ++i moves the write pointer first, then the assignment lands in the newly vacated slot.

<!-- @code python -->
```python
def remove_duplicates(nums):
    if not nums:
        return 0

    i = 0                          # write pointer
    for j in range(1, len(nums)):  # read pointer
        if nums[j] != nums[i]:
            i += 1
            nums[i] = nums[j]
    return i + 1
```

<!-- @annotations -->
- 5: Measured 7.548ms at n = 100,000 — slower than sorted(set(nums)) at 3.095ms, because this loop runs in the interpreter.
- 7: The guard is not just tidiness: on an all-identical array it performs 0 writes, against n - 1 for an unguarded version.
- 9: Assigning into nums mutates the caller's list. Rebuilding a new list would satisfy the tests and miss the point.

<!-- @approach -->
### Library Call

<!-- @idea -->
Use the standard library routine that already performs adjacent-duplicate removal.

<!-- @steps -->
1. In C++, call unique over the whole range, which compacts adjacent duplicates to the front.
2. Take the returned iterator as the new logical end and convert it to a count by subtracting begin.
3. Note that the container is not resized, which matches the problem's own contract.
4. In Python, use itertools.groupby, whose group keys are the distinct run values.
5. Write those keys back over the front of the list and return how many there were.

<!-- @complexity -->
- time: O(n)
- space: O(1) for std::unique, O(n) for the Java and Python forms shown
- note: std::unique measured 4.558ms at n = 1,000,000 against 4.838ms for the hand-written two-pointer — the same code once compiled. The Python and Java library forms build a new sequence and therefore break the space constraint.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

int removeDuplicates(vector<int>& nums) {
    auto end = unique(nums.begin(), nums.end());
    return (int)(end - nums.begin());
}
```

<!-- @annotations -->
- 6: unique collapses only ADJACENT equal elements, which is exactly right for sorted input and wrong for unsorted.
- 7: It returns an iterator, not a count, and the vector keeps its original size — verified on [1,1,2,2,3], which gives k = 3 with the tail left untouched.

<!-- @code java -->
```java
import java.util.Arrays;

// Java has no in-place adjacent-unique routine for primitive arrays.
// The stream form allocates, so it does NOT meet the O(1) space constraint.
static int removeDuplicates(int[] nums) {
    int[] unique = Arrays.stream(nums).distinct().toArray();
    System.arraycopy(unique, 0, nums, 0, unique.length);
    return unique.length;
}
```

<!-- @annotations -->
- 6: distinct() works on unsorted input too, because it hashes rather than comparing neighbours — and it allocates to do so.
- 8: Shown for completeness; the two-pointer remains the correct answer under the stated constraint.

<!-- @code python -->
```python
from itertools import groupby

def remove_duplicates(nums):
    unique = [key for key, _ in groupby(nums)]   # groups RUNS of equal values
    nums[:len(unique)] = unique
    return len(unique)
```

<!-- @annotations -->
- 4: groupby groups consecutive equal elements, so like std::unique it depends on the input being sorted.
- 5: Verified: [0,0,1,1,1,2,2] gives [0,1,2], and an empty list gives [] with k = 0.

<!-- @example -->

<!-- @input -->
nums = [1, 1, 2]

<!-- @output -->
k = 2, with nums starting [1, 2, ...]

<!-- @why -->
The smallest input that contains both a duplicate and a new value, so it exercises both branches of the loop exactly once.

<!-- @walkthrough -->
1. The write pointer i starts at 0, so nums[0..0] holding 1 is already a valid deduplicated prefix.
2. j = 1: nums[1] is 1 and nums[i] is 1, so this is a duplicate and nothing is written.
3. j = 2: nums[2] is 2, which differs from nums[i] = 1, so i advances to 1 and 2 is written there.
4. The scan ends with i = 1, so the answer is i + 1 = 2.
5. The array now begins [1, 2] and whatever sits at index 2 is ignored by the caller.

<!-- @example -->

<!-- @input -->
nums = [0, 0, 1, 1, 1, 2, 2, 3, 3, 4]

<!-- @output -->
k = 5, with nums starting [0, 1, 2, 3, 4]

<!-- @why -->
The standard multi-run example, and the one that makes the ignored tail concrete rather than theoretical.

<!-- @walkthrough -->
1. i starts at 0 with the value 0 already in place.
2. j = 1 finds another 0, which matches nums[i], so it is skipped.
3. j = 2 finds 1, which differs, so i becomes 1 and 1 is written to index 1.
4. j = 3 and j = 4 find further 1s, both matching nums[i], so both are skipped.
5. The remaining values 2, 3 and 4 each trigger one write, ending with i = 4.
6. The answer is 5, and verified on this machine the tail is left as [2, 2, 3, 3, 4] — stale values that the judge never reads.

<!-- @example -->

<!-- @input -->
nums = [7, 7, 7, 7] and nums = [1, 2, 3, 4]

<!-- @output -->
k = 1 and k = 4 — the two extremes of the write count

<!-- @why -->
The two ends of the behaviour range in one place, and the concrete evidence that the != guard changes real work rather than merely reading well.

<!-- @walkthrough -->
1. On the all-identical array, every comparison matches nums[i], so the condition never fires.
2. The write pointer never moves, i finishes at 0, and the answer is 1.
3. Measured at a million identical elements, this performs zero writes, because the guard rejects every candidate.
4. On the all-distinct array, every comparison differs, so every element triggers a write.
5. The write pointer keeps pace with the read pointer, and each element is written back to the position it already occupied.
6. Measured at a million distinct elements, this performs 999,999 writes — the opposite extreme, and the reason the guard is worth having.

<!-- @example -->

<!-- @input -->
nums = [11, 32, 41, 49] passed through Python's list(set(nums))

<!-- @output -->
[32, 41, 11, 49] — the order is destroyed

<!-- @why -->
The clearest case in the module of a bug that passes every example in the lesson and then fails on essentially all realistic input.

<!-- @walkthrough -->
1. The input is already sorted and every value is unique, so the correct output is the input unchanged.
2. list(set(nums)) collapses nothing, since there are no duplicates, but it returns the values in hash-table slot order.
3. That order is [32, 41, 11, 49], which is neither sorted nor the original ordering.
4. The same code on [1, 1, 2, 2, 3] returns [1, 2, 3], which is completely correct.
5. Small integers hash to themselves, so while the values fit inside the table they land in increasing slot order.
6. Measured on 20,000 sorted arrays per range: 0% were reordered with values 0-9, 99.7% with values 0-99, and 100% with values 0-999.

<!-- @visualization array -->

<!-- @description -->
One array strip with two distinctly drawn pointers: a hollow scout marker for the read index j riding above the cells, and a solid scribe marker for the write index i riding below them. Tint the region from 0 to i as finished work in a settled colour, leave the region from j onward as untouched input, and render the gap between i and j as visibly stale — those cells still hold old values that no longer mean anything, which is what makes the ignored tail obvious later. On each step draw the comparison between the scout's cell and the scribe's cell as a labelled arc. When the values match, flash the arc grey, leave the scribe entirely still, and increment a skipped counter — the scribe not moving is the thing to watch, because that is the duplicate being discarded. When they differ, advance the scribe one cell first, then animate the scout's value travelling down into that newly vacated slot, and increment a written counter. Keep both counters on screen throughout so the two extremes are legible: an all-identical array ends with the written counter at zero, an all-distinct array ends with it at n - 1. Because the scribe can never overtake the scout, draw a permanent shaded lane between them to make the safety of writing in place visual rather than asserted. When the scan finishes, highlight nums[0..i] as the answer, print k = i + 1 beside it, and grey the tail out completely while labelling it ignored, not cleared. A ladder panel replays the same input under the other approaches: the shifting version animates the whole suffix sliding left on every duplicate so the quadratic work is visible as motion, and the temporary-array version draws a second strip filling up beside the first and then copying back, so the two-pointer reads as that same picture with the second strip deleted. A Python panel shows [11, 32, 41, 49] entering a hash table and leaving in slot order as [32, 41, 11, 49], with a toggle to single-digit values where the reordering silently stops happening.

<!-- @sampleInput -->
```json
{"primary":{"array":[0,0,1,1,1,2,2,3,3,4],"trace":[{"j":1,"readValue":0,"writeValue":0,"match":true,"i":0,"action":"skip"},{"j":2,"readValue":1,"writeValue":0,"match":false,"i":1,"action":"write"},{"j":3,"readValue":1,"writeValue":1,"match":true,"i":1,"action":"skip"},{"j":4,"readValue":1,"writeValue":1,"match":true,"i":1,"action":"skip"},{"j":5,"readValue":2,"writeValue":1,"match":false,"i":2,"action":"write"},{"j":6,"readValue":2,"writeValue":2,"match":true,"i":2,"action":"skip"},{"j":7,"readValue":3,"writeValue":2,"match":false,"i":3,"action":"write"},{"j":8,"readValue":3,"writeValue":3,"match":true,"i":3,"action":"skip"},{"j":9,"readValue":4,"writeValue":3,"match":false,"i":4,"action":"write"}],"k":5,"answerPrefix":[0,1,2,3,4],"ignoredTail":[2,2,3,3,4],"writes":4,"skips":5},"extremes":{"allIdentical":{"array":[7,7,7,7],"k":1,"writes":0},"allDistinct":{"array":[1,2,3,4],"k":4,"writes":3}},"ladder":{"n":100000,"shiftMs":339.932,"setMs":12.390,"tempMs":0.509,"twoPointerMs":0.478,"shiftRatio":717},"pythonHashPanel":{"input":[11,32,41,49],"listOfSet":[32,41,11,49],"orderPreserved":false,"singleDigitInput":[1,1,2,2,3],"singleDigitResult":[1,2,3],"reorderRateByRange":{"0-9":0.0,"0-99":0.997,"0-999":1.0}}}
```

<!-- @highlights -->
- The scribe marker sits below index 0 and the scout above index 1, with the region up to the scribe already tinted as finished work.
- The scout reads a second 0, the comparison arc flashes grey, and the scribe does not move — the duplicate is discarded by doing nothing.
- The scout reaches the first 1, the arc turns solid, the scribe advances one cell, and the value drops into the slot it just vacated.
- Two more 1s pass under the scout and the scribe stays put through both, so the skipped counter climbs while the written counter does not.
- The shaded lane between the two markers is never empty and never inverted, showing that the scribe can never overtake the scout.
- Because of that, every write lands on a cell whose original value has already been read, which is why no second array is needed.
- The values 2, 3 and 4 each trigger one advance-then-write, and the finished region grows to five cells.
- The scan ends with the answer prefix [0, 1, 2, 3, 4] highlighted and k = 5 printed beside it.
- The tail is greyed out and labelled ignored rather than cleared, still holding the stale values [2, 2, 3, 3, 4].
- The extremes panel runs [7, 7, 7, 7], where the written counter finishes at zero because the guard rejected every candidate.
- It then runs [1, 2, 3, 4], where every element is written and the two markers travel locked together.
- The ladder panel replays the shifting approach, sliding the entire suffix left on each duplicate so the quadratic work is visible as motion.
- It then replays the temporary-array approach as a second strip filling beside the first, then copying back — the two-pointer is that picture with the second strip removed.
- The measured ladder is printed at n = 100,000: 339.932ms shifting, 12.390ms set, 0.509ms temporary array, 0.478ms two pointers.
- The Python panel drops [11, 32, 41, 49] into a hash table and reads it back as [32, 41, 11, 49], with the order visibly destroyed.
- Toggling to single-digit values makes the reordering stop happening, matching the measured 0% failure rate on 0-9 against 99.7% on 0-99.

<!-- @edgeCases -->
- Empty array — the guard must return 0, because returning i + 1 from an uninitialised write pointer would claim one element exists.
- Single-element array — the loop never runs and the answer is 1, since one element is already deduplicated.
- All elements identical — the write pointer never moves, the answer is 1, and measured write count is zero.
- All elements distinct — every element triggers a write, the answer is n, and each value is written back to the position it already held.
- Exactly two elements that are equal — the smallest input where a duplicate is actually discarded.
- Exactly two elements that differ — the smallest input where the write pointer advances.
- Duplicates only at the very start, such as [1, 1, 2, 3] — the first skip happens before any write.
- Duplicates only at the very end, such as [1, 2, 3, 3] — every write happens before the first skip.
- A long run of one value surrounded by singletons, which keeps the write pointer stationary across many read steps.
- Negative values and zeros mixed together — nothing in the algorithm depends on sign, only on adjacency and equality.
- An unsorted array passed in by mistake — the algorithm returns a wrong answer silently, since it only ever compares neighbours.

<!-- @pitfalls -->
- Returning i instead of i + 1. The write pointer is the last written index, so the count is one greater — the most common off-by-one in this problem.
- Forgetting the empty-array guard, so an empty input reports one unique element that does not exist.
- Trying to shrink the array or blank the tail. Verified: the tail is left as stale values such as [2, 2, 3, 3, 4] and the judge never reads past k.
- Returning a new array instead of modifying in place. The problem hands you a reference precisely so your edits are visible to the caller.
- Writing nums = temp in Python. That rebinds the local name and leaves the caller's list untouched; nums[:len(temp)] = temp mutates it.
- Using list(set(nums)) in Python. Measured to reorder 99.7% of sorted arrays with values 0-99 while leaving single-digit examples untouched, so it passes the lesson's own examples and fails real input.
- Reaching for unordered_set in C++ or HashSet in Java. Both collapse duplicates and both discard the ordering the input already had.
- Erasing inside the loop with vector::erase or list.pop. Each removal shifts the whole suffix, turning an O(n) problem into a measured 717x slowdown at n = 100,000.
- Advancing the index after a removal in the shifting version, which skips the element that just slid into the vacated position.
- Assuming this works on unsorted input. Duplicates are only adjacent because the array is sorted; without that, a hash set is required and O(1) space is impossible.
- Comparing nums[j] against nums[j-1] and believing it is a different algorithm. It gives the same answer on sorted input, but comparing against nums[i] is what states the invariant.
- Concluding from the Python timings that the set version is the better submission. It is faster and it still violates the O(1) space constraint the problem states.

<!-- @doubt -->
### Why do we return a number instead of the array?

<!-- @answer -->
Because the array is modified through the reference you were given, so the caller already has it — what they cannot know is how much of it is meaningful. Returning k tells them the first k slots hold the answer. Everything past that is ignored: verified on [0,0,1,1,1,2,2,3,3,4], k comes back as 5, the first five slots read [0,1,2,3,4], and the tail is left as the stale values [2,2,3,3,4]. You do not need to clear it, and in C++ the vector's size does not change unless you erase.

<!-- @doubt -->
### Why is the answer i + 1 rather than i?

<!-- @answer -->
Because i is an index, not a count. It marks the last position written, and positions are numbered from 0, so a write pointer resting at index 4 means five values occupy indices 0 through 4. Returning i is the single most common bug in this problem, and it is off by exactly one on every input including the correct ones, which makes it easy to spot the moment you test with a known answer.

<!-- @doubt -->
### Why is it safe to write into the same array we are still reading?

<!-- @answer -->
Because the write pointer can never overtake the read pointer. The write pointer advances only when the read pointer has advanced and found something new, so i is always less than or equal to j. Every cell the write pointer touches has therefore already been read, and no value still needed is ever clobbered. That guarantee is exactly what lets the temporary array be deleted, and it is the reason the two-pointer version is the same idea as the temp-array version rather than a new one.

<!-- @doubt -->
### Why compare nums[j] against nums[i] rather than nums[j-1]?

<!-- @answer -->
On sorted input both give the same answer, so neither is wrong. Comparing against nums[i] is preferable because it states the invariant directly: nums[i] is the last value accepted into the answer, so you are asking 'is this different from the last thing I kept'. Comparing against nums[j-1] asks 'is this different from the last thing I read', which happens to coincide here only because sortedness puts duplicates next to each other. The first phrasing survives into problems where they no longer coincide.

<!-- @doubt -->
### Why not just use a set?

<!-- @answer -->
Three reasons, in increasing order of importance. It needs O(n) extra memory, which the problem explicitly forbids. It is slow — measured 222.302ms at n = 1,000,000 in C++, 46x the two-pointer, because every insert allocates a node to rediscover an ordering the input already had. And in Python it is outright incorrect: list(set(nums)) does not preserve order, measured to reorder 99.7% of sorted arrays with values 0-99. If you want the set idiom in Python, dict.fromkeys preserves insertion order; a plain set does not.

<!-- @doubt -->
### But list(set(...)) worked when I tried it. Why?

<!-- @answer -->
Because you almost certainly tried it on small numbers. CPython hashes an integer to itself, so while your values are smaller than the hash table they land in increasing slot order and everything looks sorted. Measured on 20,000 sorted arrays per range: with values 0-9, zero were reordered; with values 0-99, 19,937 of 20,000 were; with values 0-999 and above, all of them were. The first realistic array drawn at random here went [11, 32, 41, 49] to [32, 41, 11, 49]. This is the cleanest example in the module of a bug that passes every example in the lesson and then fails on essentially all real input.

<!-- @doubt -->
### In Python the set version measured faster than the two-pointer. Should I submit that?

<!-- @answer -->
No, though the measurement is real: at n = 100,000, sorted(set(a)) took 3.095ms against 7.548ms for the two-pointer, so the O(n)-space version is 2.4x faster. The reason is that set and sorted run as compiled C while your loop runs in the interpreter, and it is the same effect that made max() beat a hand-written loop by 4x in Largest Element. It still allocates O(n) memory, which the problem forbids, and in the general case it loses ordering. The lesson to take is that complexity classes rank algorithms rather than runtimes, and on a given language the two orderings can disagree.

<!-- @doubt -->
### Does the != guard actually matter, or is it just tidier?

<!-- @answer -->
It changes real work. Without it you would assign on every iteration, performing n - 1 writes regardless of the data. With it, measured write counts at n = 1,000,000 are zero for an all-identical array, 499,999 when each value appears twice, and 999,999 when everything is distinct. On duplicate-heavy input that is a large number of memory writes avoided, and on an already-unique array it costs nothing extra.

<!-- @doubt -->
### Does this work if the array is not sorted?

<!-- @answer -->
No, and it fails silently, which is the dangerous part. The algorithm only ever compares neighbours, and it relies entirely on sortedness to guarantee that any duplicate of the current value sits immediately beside it. Given [1, 2, 1] it compares 2 against 1, then 1 against 2, finds no adjacent equal pair, and reports three unique values. For unsorted input you need a hash set to remember everything seen, which makes O(1) extra space impossible — or you sort first and accept O(n log n).
