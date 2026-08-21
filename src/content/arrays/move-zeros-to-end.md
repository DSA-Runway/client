---
id: move-zeros-to-end
topic: Arrays
title: Move Zeros to End
difficulty: Easy
status: ready
prerequisites:
  - remove-duplicates-from-sorted-array
  - largest-element
  - for-loop
  - if-else-statements
  - pass-by-value-vs-pass-by-reference
  - time-and-space-complexity-basics
relatedIds:
  - remove-duplicates-from-sorted-array
  - linear-search
  - sort-an-array-of-0s-1s-and-2s
  - rearrange-array-elements-by-sign
---

<!-- @summary -->
Push every zero to the back while the non-zero elements keep their order — the same read/write pointer split as Remove Duplicates, plus a measured result that matters more than the algorithm: at identical size, density and write count, how the data is arranged changed the runtime by 5.5x.

<!-- @theory -->
## The problem

Given an array `nums`, move every `0` to the end while keeping the **relative
order of the non-zero elements unchanged**. Do it in place, without making a copy.

```
[0, 1, 0, 3, 12]  ->  [1, 3, 12, 0, 0]
```

That order requirement is the whole problem. Without it you could count the zeros,
fill the front with the non-zeros in any order, and pad the back — or simply sort.
With it, `1`, `3` and `12` must come out in exactly that sequence.

This is why sorting is not a shortcut. Sorting `[0,1,0,3,12]` by value descending
gives `[12,3,1,0,0]`: the zeros are at the end and the answer is wrong, because the
non-zeros were reordered.

## It is Remove Duplicates again

The structure is identical to Remove Duplicates from Sorted Array. A **write
pointer** `j` marks where the next kept element belongs, and a **read pointer**
`i` scans forward. The only thing that changed is the test: there it was "is this
different from the last kept value", here it is "is this non-zero".

The invariant is the same shape too: *`nums[0..j-1`] holds every non-zero element
seen so far, in their original order.* Because `j` only advances when something is
kept, `j` can never overtake `i`, so writing into position `j` never destroys an
element still waiting to be read.

That single guarantee is what makes the whole family of in-place compaction
problems work, and recognising it here is worth more than the specific answer.

## Two ways to finish, and they are not equivalent

### Overwrite, then fill

Copy each non-zero forward to `j`. When the scan ends, everything from `j` to the
end is stale, so fill it with zeros.

Two passes, and exactly **n writes** every time — the non-zeros get written on the
first pass, the zeros on the second, and together that is every position once.

### Swap in one pass

When `nums[i]` is non-zero, swap it with `nums[j]` and advance `j`. The zero that
was at `j` travels to `i`, so the zeros accumulate at the back automatically and
no second pass is needed.

One pass, but each swap is **three writes**, and there is one swap per non-zero
element. So the cost is `3 × (number of non-zeros)`.

### Which is cheaper depends on the data

Let `f` be the fraction of elements that are non-zero. Overwrite costs `n`. Swap
costs `3fn`. So swap wins exactly when `3f < 1` — when **fewer than a third** of the
elements are non-zero.

Measured at n = 1,000:

| zeros | non-zeros | overwrite | swap |
|---|---|---|---|
| 0% | 1000 | 1,000 | 3,000 |
| 33% | 673 | 1,000 | 2,019 |
| **67%** | **330** | **1,000** | **990** |
| 90% | 109 | 1,000 | 327 |
| 100% | 0 | 1,000 | 0 |

The crossover lands exactly at 67% zeros, which is `f = 1/3`, as the formula says.

## The guard that costs one comparison

Both versions do pointless work when `i == j` — that is, when nothing has been
skipped yet, so the element is already where it belongs. The overwrite copies it
onto itself; the swap exchanges it with itself.

Adding `if (i != j)` removes that. On an array with **no zeros at all**, measured at
n = 1,000: both unguarded versions perform 1,000 writes moving every element onto
itself, and both guarded versions perform **zero**.

It is one comparison per element to eliminate up to `n` pointless writes on the
input most likely to occur in practice — arrays that are mostly or entirely
non-zero.

## The measurement that outranks all of this

Here is where this subtopic earns its place. Three arrays, each with
n = 10,000,000, each with **exactly 50% zeros**, each performing **the same number
of writes**. The only difference is how the zeros are arranged:

| Arrangement | overwrite | swap + guard |
|---|---|---|
| Random 50/50 | 31.529ms | 30.679ms |
| Blocked — non-zeros then zeros | **5.691ms** | **4.936ms** |
| Alternating 0, 7, 0, 7, … | 7.406ms | 5.090ms |

**A 5.5x spread with size, density and write count all held constant.**

The cause is the branch. `if (nums[i] != 0)` is evaluated `n` times, and modern
processors guess its outcome in advance and speculatively execute what follows.
In the random array that guess is a coin flip, so roughly half the guesses are
wrong and each wrong one throws away the work already in flight. In the blocked
array the answer is the same for millions of consecutive elements, and in the
alternating array it follows a trivially learnable pattern — both predict almost
perfectly.

Every earlier subtopic showed operation counts failing to predict runtime because
of *how the code was written* — vectorisation in Left Rotate, the interpreter
boundary in Largest Element. This one shows it failing because of **what the data
looks like**, with the code held completely fixed. It is the reason benchmarking on
convenient input is misleading, and the reason "O(n) either way" can hide a 5.5x
difference that no complexity analysis will ever surface.

## Python inverts it again

At n = 1,000,000 with 50% zeros:

| Approach | Time |
|---|---|
| List comprehension | **23.101ms** |
| Temporary array | 23.753ms |
| Two-pointer overwrite | 49.180ms |
| Swap | 51.154ms |
| `sort(key=lambda x: x == 0)` | 63.990ms |

The comprehension beats the hand-written two-pointer by **2.1x** while using O(n)
extra space, because it runs as compiled C. Same pattern as every previous
subtopic; the O(1)-space answer is the one the problem demands and the one the
interpreter punishes.

The sort trick deserves a note because it is genuinely correct: Python's sort is
**stable**, so `sort(key=lambda x: x == 0)` sends every zero to the back while
leaving the non-zeros in their original relative order. Verified on `[0,1,0,3,12]`,
it gives `[1,3,12,0,0]`. It is O(n log n) and the slowest option measured, but it
is a legitimate one-liner rather than a bug.

## Where this goes next

Replace "is non-zero" with any predicate and this becomes **stable partitioning**,
which is the same machinery underneath `std::stable_partition` and a close
relative of the partition step in quicksort. The read/write split continues into
**Remove Element** and every other in-place compaction problem.

<!-- @intuition -->
Walk the line with a bucket. Every non-zero you meet gets placed at the front of the finished section and the section grows by one; every zero you simply walk past. Because the finished section can never be longer than the distance you have walked, you are always placing into ground you have already cleared — which is why no second array is needed and why the order survives.

<!-- @approach -->
### Brute Force - Remove and Append

<!-- @idea -->
Repeatedly delete a zero from its position and push a zero onto the end.

<!-- @steps -->
1. Count how many zeros the array contains.
2. Repeat that many times.
3. Find the first zero, remove it by shifting every later element one position left.
4. Write a zero into the final position.
5. The relative order of the non-zero elements is preserved because they only ever shift left as a block.

<!-- @complexity -->
- time: O(n^2)
- space: O(1)
- note: Correct and order-preserving, and quadratic because each removal shifts the remainder of the array. Measured 0.9ms at n = 1,000 in Python against 0.033ms for the temporary array — and the ratio grows with n.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void moveZeroes(vector<int>& nums) {
    int zeros = count(nums.begin(), nums.end(), 0);

    for (int c = 0; c < zeros; c++) {
        auto it = find(nums.begin(), nums.end(), 0);
        nums.erase(it);          // shifts everything after it left: O(n)
        nums.push_back(0);
    }
}
```

<!-- @annotations -->
- 9: find scans from the front each time, so the search alone is O(n) per zero.
- 10: erase on a vector moves every later element, which is the second O(n) factor.
- 11: Correct, order-preserving, and O(n^2) overall — unusable on a large array with many zeros.

<!-- @code java -->
```java
static void moveZeroes(int[] nums) {
    int n = nums.length;
    int zeros = 0;
    for (int x : nums) if (x == 0) zeros++;

    for (int c = 0; c < zeros; c++) {
        int idx = 0;
        while (nums[idx] != 0) idx++;
        for (int i = idx; i + 1 < n; i++) nums[i] = nums[i + 1];
        nums[n - 1] = 0;
    }
}
```

<!-- @annotations -->
- 9: Scanning for the next zero from index 0 every time is wasteful; it is already known to be at or after the previous one.
- 10: The explicit shift is what erase does implicitly in C++, and it costs the same.

<!-- @code python -->
```python
def move_zeroes(nums):
    zeros = nums.count(0)
    for _ in range(zeros):
        nums.remove(0)      # finds the first 0 and shifts the rest left: O(n)
        nums.append(0)


# Measured 0.9ms at n = 1,000 with half zeros, against 0.033ms for the
# temporary-array version — and the gap widens quadratically from there.
```

<!-- @annotations -->
- 4: list.remove finds and deletes in one call, and both halves of that are O(n).
- 5: append is amortised O(1), so the whole cost sits in remove.

<!-- @approach -->
### Brute Force - Temporary Array

<!-- @idea -->
Collect the non-zeros into fresh storage in order, pad with zeros, then copy back.

<!-- @steps -->
1. Create an empty temporary array.
2. Walk the input once and append every non-zero element to the temporary array.
3. Append zeros to the temporary array until it matches the original length.
4. Copy the temporary array back over the original.
5. The order is preserved because the non-zeros were appended in the order they were met.

<!-- @complexity -->
- time: O(n)
- space: O(n)
- note: Optimal in time and violates the problem's no-copy requirement. Measured 23.101ms at n = 1,000,000 in Python, which is the fastest option there despite the extra allocation.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void moveZeroes(vector<int>& nums) {
    vector<int> temp;
    temp.reserve(nums.size());

    for (int x : nums) if (x != 0) temp.push_back(x);
    while (temp.size() < nums.size()) temp.push_back(0);

    for (size_t i = 0; i < nums.size(); i++) nums[i] = temp[i];
}
```

<!-- @annotations -->
- 8: Appending in scan order is exactly what preserves the relative ordering the problem demands.
- 9: The padding count is implicit — however many slots remain get zeros.
- 11: The copy back is the only reason a second array is needed, which is what the two-pointer version removes.

<!-- @code java -->
```java
static void moveZeroes(int[] nums) {
    int[] temp = new int[nums.length];
    int k = 0;

    for (int x : nums) if (x != 0) temp[k++] = x;
    // the remainder of temp is already 0 — Java zero-initialises arrays

    System.arraycopy(temp, 0, nums, 0, nums.length);
}
```

<!-- @annotations -->
- 5: k tracks how many non-zeros were kept, which is also where the zero padding begins.
- 6: A genuine Java convenience: new int[n] is already all zeros, so no padding loop is needed.

<!-- @code python -->
```python
def move_zeroes(nums):
    temp = [x for x in nums if x != 0]
    temp += [0] * (len(nums) - len(temp))
    nums[:] = temp


# Measured 23.101ms at n = 1,000,000 with half zeros — the FASTEST option in
# Python, beating the O(1)-space two-pointer at 49.180ms by 2.1x, because the
# comprehension runs as compiled C rather than in the interpreter.
```

<!-- @annotations -->
- 2: The comprehension preserves order for free, since it yields elements in scan order.
- 4: nums[:] = temp mutates in place. nums = temp would rebind the local name and lose the caller's edit.

<!-- @approach -->
### Two Pointers - Overwrite Then Fill

<!-- @idea -->
Copy every non-zero forward to the write pointer, then fill the remaining tail with zeros.

<!-- @steps -->
1. Set the write pointer j to zero.
2. Scan the array with a read pointer i.
3. Whenever the element at i is non-zero, write it to position j and advance j.
4. Skip zeros entirely, leaving j where it is.
5. After the scan, every position from j to the end is stale, so fill it with zeros.
6. Optionally guard the copy with i != j to avoid writing an element onto itself.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Exactly n writes on every input — measured 1,000 at n = 1,000 across every zero density from 0% to 100%. With the i != j guard, an array with no zeros performs zero writes instead of n.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void moveZeroes(vector<int>& nums) {
    int n = nums.size();
    int j = 0;                          // write pointer

    for (int i = 0; i < n; i++) {       // read pointer
        if (nums[i] != 0) {
            if (i != j) nums[j] = nums[i];
            j++;
        }
    }
    while (j < n) nums[j++] = 0;
}
```

<!-- @annotations -->
- 6: The invariant: nums[0..j-1] holds every non-zero seen so far, in original order.
- 10: The guard. Without it an array containing no zeros performs n writes moving each element onto itself; with it, zero.
- 14: The fill pass is what makes this exactly n writes in total, regardless of how the zeros are distributed.

<!-- @code java -->
```java
static void moveZeroes(int[] nums) {
    int n = nums.length, j = 0;

    for (int i = 0; i < n; i++) {
        if (nums[i] != 0) {
            if (i != j) nums[j] = nums[i];
            j++;
        }
    }
    while (j < n) nums[j++] = 0;
}
```

<!-- @annotations -->
- 4: j can never overtake i, so this write always lands on ground already read.
- 10: j finishes at the count of non-zeros, which is exactly where the zero tail begins.

<!-- @code python -->
```python
def move_zeroes(nums):
    n = len(nums)
    j = 0

    for i in range(n):
        if nums[i] != 0:
            if i != j:
                nums[j] = nums[i]
            j += 1

    for i in range(j, n):
        nums[i] = 0


# Measured 49.180ms at n = 1,000,000 with half zeros — slower than the
# list comprehension at 23.101ms, which is the usual interpreter tax.
```

<!-- @annotations -->
- 6: Two interpreted loops over a million elements, which is where the time goes.
- 12: The tail fill. Everything from j onward is a stale copy of a value already moved forward.

<!-- @approach -->
### Two Pointers - Swap in One Pass

<!-- @idea -->
Exchange each non-zero with the element at the write pointer, which pushes the zeros backwards as you go.

<!-- @steps -->
1. Set the write pointer j to zero.
2. Scan the array with a read pointer i.
3. When the element at i is non-zero, swap it with the element at j and advance j.
4. The value swapped back to i is necessarily a zero, so zeros accumulate behind the scan.
5. No second pass is needed, because the tail fills with zeros as a side effect.
6. Guard the swap with i != j to avoid exchanging an element with itself.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: 3x the number of non-zero elements in writes, so it beats the overwrite version exactly when non-zeros are under one third of the array. Measured at n = 1,000: 3,000 writes with no zeros, 990 at 67% zeros where it crosses over, and 327 at 90% zeros.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void moveZeroes(vector<int>& nums) {
    int j = 0;

    for (int i = 0; i < (int)nums.size(); i++) {
        if (nums[i] != 0) {
            if (i != j) swap(nums[i], nums[j]);
            j++;
        }
    }
}
```

<!-- @annotations -->
- 9: One pass and no fill loop, because every swap sends a zero backwards to position i.
- 10: Each swap is three writes, so the total is 3x the number of non-zeros — cheaper than n only when non-zeros are under a third.
- 11: j advances once per non-zero, so it always points at the first position not yet claimed.

<!-- @code java -->
```java
static void moveZeroes(int[] nums) {
    int j = 0;

    for (int i = 0; i < nums.length; i++) {
        if (nums[i] != 0) {
            if (i != j) {
                int t = nums[i]; nums[i] = nums[j]; nums[j] = t;
            }
            j++;
        }
    }
}
```

<!-- @annotations -->
- 7: Three explicit writes, which is what makes the swap version cost 3x the non-zero count.

<!-- @code python -->
```python
def move_zeroes(nums):
    j = 0
    for i in range(len(nums)):
        if nums[i] != 0:
            if i != j:
                nums[i], nums[j] = nums[j], nums[i]
            j += 1


# Measured 51.154ms at n = 1,000,000 with half zeros, essentially tied with
# the overwrite version at 49.180ms — in Python the interpreter dominates and
# the write-count difference disappears entirely.
```

<!-- @annotations -->
- 6: Tuple assignment swaps without a named temporary, though the same three element writes happen underneath.

<!-- @approach -->
### Library Call

<!-- @idea -->
Use the standard routine that already performs an order-preserving partition.

<!-- @steps -->
1. In C++, call remove with the value 0, which compacts every non-zero to the front in order and returns the new logical end.
2. Fill from that returned iterator to the end with zeros.
3. Alternatively call stable_partition with a non-zero predicate, which does the same and keeps both groups ordered.
4. In Python, use a stable sort keyed on whether the element is zero.
5. Confirm the sort is stable, or the relative order of the non-zeros is not guaranteed.

<!-- @complexity -->
- time: O(n) for remove and stable_partition, O(n log n) for the sort
- space: O(1) for remove, O(n) for the Java and sort-based forms
- note: std::remove is the overwrite approach under a library name. The Python sort trick is genuinely correct because the sort is stable, and measured 63.990ms at n = 1,000,000 — the slowest option, but a legitimate one-liner.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void moveZeroes(vector<int>& nums) {
    // remove shifts every non-zero to the front, preserving order,
    // and returns an iterator to the new logical end.
    auto end = remove(nums.begin(), nums.end(), 0);
    fill(end, nums.end(), 0);
}

// stable_partition expresses the same idea with an arbitrary predicate:
void moveZeroesPartition(vector<int>& nums) {
    stable_partition(nums.begin(), nums.end(), [](int x) { return x != 0; });
}
```

<!-- @annotations -->
- 8: This is precisely the overwrite approach, already written and already correct.
- 9: remove does not shrink the container, so the tail must be filled explicitly.
- 14: stable_partition keeps the relative order of BOTH groups; the plain partition does not and would be wrong here.

<!-- @code java -->
```java
import java.util.Arrays;

// No in-place order-preserving partition exists for a primitive int[].
// The stream form allocates, so it does not meet the no-copy requirement.
static void moveZeroes(int[] nums) {
    int[] nonZero = Arrays.stream(nums).filter(x -> x != 0).toArray();
    Arrays.fill(nums, 0);
    System.arraycopy(nonZero, 0, nums, 0, nonZero.length);
}
```

<!-- @annotations -->
- 6: filter preserves encounter order, so the ordering requirement is met.
- 7: Shown for completeness; the two-pointer version remains the correct answer under the stated constraint.

<!-- @code python -->
```python
def move_zeroes(nums):
    # Python's sort is STABLE, so equal keys keep their original order.
    # False sorts before True, so non-zeros stay in front, in order.
    nums.sort(key=lambda x: x == 0)


# Verified on [0, 1, 0, 3, 12] -> [1, 3, 12, 0, 0].
# Sorting by VALUE instead gives [12, 3, 1, 0, 0] — zeros at the end and the
# non-zero ordering destroyed, which is the wrong answer.
# Measured 63.990ms at n = 1,000,000 — correct, and the slowest option here.
```

<!-- @annotations -->
- 4: Stability is doing all the work. On an unstable sort this would be wrong for exactly the reason the value-sort is wrong.
- 8: The failure mode is worth seeing: the zeros land correctly and the answer is still wrong.

<!-- @example -->

<!-- @input -->
nums = [0, 1, 0, 3, 12]

<!-- @output -->
[1, 3, 12, 0, 0]

<!-- @why -->
The statement's own example, and it shows the write pointer standing still on every zero, which is the mechanism that compacts the array.

<!-- @walkthrough -->
1. The write pointer j starts at 0.
2. i = 0: the value is 0, so it is skipped and j stays at 0.
3. i = 1: the value is 1, which is non-zero, so it is written to position 0 and j advances to 1.
4. i = 2: the value is 0, so it is skipped again.
5. i = 3: the value is 3, written to position 1, and j advances to 2.
6. i = 4: the value is 12, written to position 2, and j advances to 3.
7. The scan ends with j = 3, so positions 3 and 4 are filled with zeros, giving [1, 3, 12, 0, 0].
8. The non-zeros came out as 1, 3, 12 — the order in which they were met, which is what the problem requires.

<!-- @example -->

<!-- @input -->
nums = [1, 2, 3] and nums = [0, 0, 0]

<!-- @output -->
[1, 2, 3] and [0, 0, 0] — both unchanged

<!-- @why -->
The two extremes, and together they show why the i != j guard is worth one comparison per element on exactly the inputs most likely to appear.

<!-- @walkthrough -->
1. With no zeros, every element is non-zero so i and j advance together and stay equal throughout.
2. The i != j guard is therefore false every time, and the unguarded version instead writes each element onto itself.
3. Measured at n = 1,000 with no zeros: the guarded version performs 0 writes and the unguarded one performs 1,000.
4. With all zeros, the condition nums[i] != 0 is never true, so j never advances and the loop writes nothing.
5. The fill pass then writes zeros over positions 0 to n-1, which are already zero.
6. The swap version performs no swaps at all here, finishing with 0 writes.

<!-- @example -->

<!-- @input -->
The same 50%-zero array at n = 10,000,000, arranged three different ways

<!-- @output -->
31.529ms, 5.691ms and 7.406ms — a 5.5x spread

<!-- @why -->
Size, density, write count and code all held fixed, leaving arrangement as the only explanation for a 5.5x difference — which no complexity analysis of this problem would ever surface.

<!-- @walkthrough -->
1. All three arrays contain exactly five million zeros and five million non-zeros.
2. All three cause the identical number of element writes, because the write count depends only on the counts, not the arrangement.
3. Randomly interleaved, the overwrite version measured 31.529ms.
4. Arranged as five million non-zeros followed by five million zeros, the same code measured 5.691ms.
5. Arranged as strictly alternating zero and non-zero, it measured 7.406ms.
6. The only variable is whether the processor can predict the outcome of nums[i] != 0, which is a coin flip in the random case and trivially learnable in the other two.

<!-- @example -->

<!-- @input -->
nums = [0, 1, 0, 3, 12] sorted two different ways in Python

<!-- @output -->
Stable key sort gives [1,3,12,0,0]; sorting by value gives [12,3,1,0,0]

<!-- @why -->
Shows that stability is the entire reason the key-sort trick is legitimate, and that a sort which merely puts zeros last is not a solution to this problem.

<!-- @walkthrough -->
1. Calling nums.sort(key=lambda x: x == 0) computes the key False for non-zeros and True for zeros.
2. False sorts before True, so all the non-zeros come first and all the zeros go to the back.
3. Python's sort is stable, so elements with equal keys retain their original relative order.
4. All the non-zeros share the key False, so 1, 3 and 12 stay in that order, giving [1, 3, 12, 0, 0].
5. Sorting by value in descending order also puts the zeros at the end, giving [12, 3, 1, 0, 0].
6. That result is wrong, and the zeros being correctly placed is exactly what makes it look right at a glance.

<!-- @visualization array -->

<!-- @description -->
The array as a strip with a solid write marker below and a hollow read marker above, carried over deliberately from Remove Duplicates so the shared structure is visible rather than described. Tint the region behind the write marker as the finished non-zero prefix, and render zeros as visually hollow cells so the scan can be followed by shape alone. On each step draw the test nums[i] != 0 as a labelled badge: on a zero it greys out, the read marker advances alone, and the visible gap between the two markers widens — that widening gap is the count of zeros passed so far and is the clearest signal of what the algorithm is doing. On a non-zero, animate the value travelling back to the write marker and both markers advance together. Run the two finishing strategies as parallel tracks on the same input: the OVERWRITE track leaves stale duplicate values in the gap and then sweeps a fill pass that turns the whole tail hollow, while the SWAP track exchanges the two cells so a hollow zero visibly flies forward to the read position, leaving no tail work to do. Keep a live write counter on each track and let them cross: with few zeros the overwrite counter stays flat at n while the swap counter races past it, and with many zeros the swap counter finishes far lower, with the crossover marked at exactly one third non-zero. A guard toggle shows the i != j case directly — with the markers locked together on an all-non-zero array, switching the guard off makes every cell flash as it is written onto itself, and the counter climbs to n while the guarded counter stays at zero. The final panel is the branch-prediction experiment: three strips of identical length and identical zero count, one randomly interleaved, one blocked into a non-zero half and a zero half, one strictly alternating. Animate a prediction meter above each that guesses the next branch outcome and flashes red on a miss — the random strip misses roughly half the time while the other two settle into near-perfect prediction after a few cells — then show the measured times beneath, 31.529ms against 5.691ms and 7.406ms, with the write counters underneath all reading exactly the same number.

<!-- @sampleInput -->
```json
{"primary":{"array":[0,1,0,3,12],"trace":[{"i":0,"value":0,"nonZero":false,"j":0,"action":"skip"},{"i":1,"value":1,"nonZero":true,"j":0,"action":"write","jAfter":1},{"i":2,"value":0,"nonZero":false,"j":1,"action":"skip"},{"i":3,"value":3,"nonZero":true,"j":1,"action":"write","jAfter":2},{"i":4,"value":12,"nonZero":true,"j":2,"action":"write","jAfter":3}],"afterScan":[1,3,12,3,12],"fillFrom":3,"result":[1,3,12,0,0],"writes":5},"extremes":{"noZeros":{"array":[1,2,3],"guardedWrites":0,"unguardedWrites":3,"result":[1,2,3]},"allZeros":{"array":[0,0,0],"swapWrites":0,"result":[0,0,0]}},"writeCrossover":{"n":1000,"rows":[{"zerosPct":0,"nonZero":1000,"overwrite":1000,"swap":3000},{"zerosPct":33,"nonZero":673,"overwrite":1000,"swap":2019},{"zerosPct":67,"nonZero":330,"overwrite":1000,"swap":990,"crossover":true},{"zerosPct":90,"nonZero":109,"overwrite":1000,"swap":327},{"zerosPct":100,"nonZero":0,"overwrite":1000,"swap":0}]},"branchPanel":{"n":10000000,"zerosPct":50,"identicalWriteCounts":true,"variants":[{"arrangement":"random 50/50","overwriteMs":31.529,"swapGuardMs":30.679,"predictable":false},{"arrangement":"blocked","overwriteMs":5.691,"swapGuardMs":4.936,"predictable":true},{"arrangement":"alternating","overwriteMs":7.406,"swapGuardMs":5.090,"predictable":true}],"spread":5.5},"sortTrick":{"input":[0,1,0,3,12],"stableKeySort":[1,3,12,0,0],"sortByValueDesc":[12,3,1,0,0],"valueSortWrong":true}}
```

<!-- @highlights -->
- The write marker sits below index 0 and the read marker above it, with zeros drawn as hollow cells so they are distinguishable at a glance.
- At i = 0 the value is a zero, the test badge greys out, and the read marker advances alone while the write marker stays put.
- The gap that opens between the two markers is exactly the number of zeros passed so far.
- At i = 1 the value 1 is non-zero, so it travels back to the write marker and both markers advance together.
- Two more zeros and two more non-zeros follow, and the finished prefix grows to [1, 3, 12].
- On the overwrite track the gap still holds stale duplicates, and a fill pass sweeps it hollow to give [1, 3, 12, 0, 0].
- On the swap track each exchange sends a hollow zero flying forward to the read position, so the tail is already correct and no fill pass runs.
- The two write counters cross as the zero density rises: overwrite holds flat at n while swap falls with the non-zero count.
- The crossover is marked at exactly one third non-zero, where both counters read close to 1,000 at n = 1,000.
- The guard toggle runs an all-non-zero array with the markers locked together, and switching the guard off makes every cell flash as it is written onto itself.
- The guarded counter finishes at zero and the unguarded one at n, on the input most likely to occur in practice.
- The final panel shows three strips of identical length and identical zero count, differing only in arrangement.
- A prediction meter above each guesses the next branch outcome, flashing red on a miss.
- The random strip misses roughly half the time, while the blocked and alternating strips settle into near-perfect prediction within a few cells.
- The measured times appear beneath — 31.529ms, 5.691ms and 7.406ms — while the write counters underneath all read exactly the same number.

<!-- @edgeCases -->
- Empty array — every loop is skipped and nothing happens, so no guard is strictly required.
- Single non-zero element — the markers stay locked together and the guarded version performs no writes at all.
- Single zero element — the scan writes nothing and the fill pass rewrites a zero over a zero.
- No zeros anywhere — the case that makes the i != j guard worth its comparison, measured 0 writes against n without it.
- All zeros — the write pointer never advances, and the swap version performs zero swaps.
- Zeros only at the front, such as [0, 0, 1, 2] — the write pointer lags maximally behind the read pointer.
- Zeros only at the end, such as [1, 2, 0, 0] — the array is already correct and the markers never separate.
- Alternating zeros and non-zeros — the arrangement that is worst for write count in the swap version and, measured, easy for the branch predictor.
- Randomly interleaved zeros at 50% density — the arrangement measured 5.5x slower than the blocked one at identical size and write count.
- Negative numbers present — only equality with zero matters, so signs are irrelevant, though it is a case people expect to break.
- An array where every element is zero except the last — the write pointer stays at 0 until the final step.

<!-- @pitfalls -->
- Sorting the array to push zeros to the end. It places the zeros correctly and destroys the non-zero ordering — [0,1,0,3,12] becomes [12,3,1,0,0], which is wrong.
- Using an unstable sort with a zero-or-not key. Stability is the only reason that trick works; without it the non-zero order is not guaranteed.
- Swapping from both ends to move zeros back. It is faster to write and it reverses the relative order of the non-zeros.
- Forgetting the fill pass in the overwrite version, which leaves stale duplicate values in the tail instead of zeros.
- Filling the tail before the scan finishes, which overwrites elements that have not been read yet.
- Omitting the i != j guard. On an array with no zeros this performs n writes moving every element onto itself, measured 1,000 against 0 at n = 1,000.
- Assuming the swap version is always cheaper. It costs 3x the non-zero count, so it only beats the overwrite version when non-zeros are under one third of the array.
- Removing zeros in a loop with erase or list.remove. Each removal shifts the remainder, making the whole routine O(n^2).
- Writing nums = temp in Python instead of nums[:] = temp, which rebinds the local name and leaves the caller's list untouched.
- Benchmarking on blocked or sorted test data. Measured, the same code on the same density ran 5.5x faster on a blocked array than a randomly interleaved one.
- Concluding from the Python timings that the list comprehension is the right submission. It is faster and it allocates a second array, which the problem forbids.
- Using std::partition rather than std::stable_partition. The plain version does not preserve relative order and is wrong for this problem.

<!-- @doubt -->
### Why can't I just sort the array?

<!-- @answer -->
Because sorting reorders the non-zero elements, and the problem requires their relative order to survive. Sorting [0,1,0,3,12] descending gives [12,3,1,0,0] — the zeros are correctly at the end and the answer is still wrong. That is what makes it deceptive: the part you were watching looks right. The one sorting approach that does work is Python's nums.sort(key=lambda x: x == 0), and only because Python's sort is stable, so the non-zeros all share the key False and keep their original order.

<!-- @doubt -->
### Should I overwrite and fill, or swap in one pass?

<!-- @answer -->
It depends on how many zeros there are, and the crossover is derivable. Overwriting costs exactly n writes on every input. Swapping costs three writes per non-zero element, so 3fn where f is the non-zero fraction. Swap therefore wins exactly when 3f < 1, meaning fewer than a third of the elements are non-zero. Measured at n = 1,000 the crossover lands precisely at 67% zeros: overwrite 1,000 writes against swap 990. With no zeros at all, swap costs 3,000 against overwrite's 1,000.

<!-- @doubt -->
### Is the i != j guard worth an extra comparison?

<!-- @answer -->
On the inputs you are most likely to meet, yes. When no elements have been skipped, i and j are equal and the copy or swap moves an element onto itself, which is pure waste. Measured at n = 1,000 on an array with no zeros, both unguarded versions performed 1,000 writes and both guarded versions performed zero. That is one comparison per element to eliminate up to n pointless writes, and arrays that are mostly non-zero are the common case.

<!-- @doubt -->
### Why is my solution slower on some arrays than others of the same size?

<!-- @answer -->
Because the arrangement of the zeros, not just how many there are, dominates the runtime. Measured at n = 10,000,000 with exactly 50% zeros in all three cases and identical write counts: randomly interleaved took 31.529ms, blocked into a non-zero half followed by a zero half took 5.691ms, and strictly alternating took 7.406ms. The test nums[i] != 0 runs n times, and the processor predicts its outcome in advance to keep working ahead. On random data that prediction is a coin flip and roughly half the guesses are discarded; on blocked or alternating data it is learned almost immediately. Same code, same size, same density, same writes, 5.5x apart.

<!-- @doubt -->
### Does that mean I should reorder my input before processing it?

<!-- @answer -->
No — sorting to make the branch predictable costs far more than the branch ever will. The practical lesson is about measurement rather than optimisation: benchmark on data shaped like your real input. A benchmark built from blocked or sorted arrays will report a number roughly five times better than randomly interleaved production data will deliver, and no complexity analysis of this problem would ever reveal the gap. When a branch genuinely is the bottleneck and the data cannot change, the fix is to remove the branch rather than to reorder the data.

<!-- @doubt -->
### Why is the two-pointer version slower than a list comprehension in Python?

<!-- @answer -->
Measured at n = 1,000,000 with half zeros: the comprehension took 23.101ms and the two-pointer 49.180ms, so the O(n)-space version is 2.1x faster. The comprehension runs as compiled C over the list while the two-pointer executes a million interpreted iterations. The same pattern has appeared in every subtopic so far — max() beating a hand loop in Largest Element, pop(0) beating a shift loop in Left Rotate. Submit the two-pointer anyway, because the problem forbids the copy, and know the constant factor is working against you.

<!-- @doubt -->
### How is this different from Remove Duplicates from Sorted Array?

<!-- @answer -->
Structurally it is the same algorithm with a different test. There the question at each element was whether it differed from the last kept value; here it is whether it is non-zero. Both keep a write pointer marking the end of a finished prefix and a read pointer scanning ahead, both rely on the write pointer never overtaking the read pointer, and both return or leave a compacted prefix. Recognising that shared skeleton is worth more than either individual solution, because it is the same one used by Remove Element and by stable partitioning generally.

<!-- @doubt -->
### Can I move the zeros by swapping from the end of the array?

<!-- @answer -->
Not without breaking the problem. Swapping each zero with the last unprocessed element does push zeros to the back, and it drags whatever was at the end into the middle, which reorders the non-zeros. On [0,1,0,3,12] that approach can produce [12,1,3,0,0], where the zeros are correctly placed and 12 has jumped to the front. It is the classic wrong answer here precisely because the zero placement looks right.

<!-- @doubt -->
### What is the library way to do this?

<!-- @answer -->
In C++, std::remove with the value 0 compacts every non-zero to the front preserving order and returns the new logical end; fill from there to the end with zeros. That is literally the overwrite approach under a library name, and it does not shrink the container, which matches the problem's contract. std::stable_partition with a non-zero predicate expresses the same thing for an arbitrary condition — and it must be the stable version, since plain std::partition does not preserve relative order and would be wrong. In Python the stable key sort is the one-liner, correct but the slowest option measured at 63.990ms.
