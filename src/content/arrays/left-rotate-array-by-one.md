---
id: left-rotate-array-by-one
topic: Arrays
title: Left Rotate Array by One
difficulty: Easy
status: ready
prerequisites:
  - largest-element
  - remove-duplicates-from-sorted-array
  - for-loop
  - variables-and-constants
  - pass-by-value-vs-pass-by-reference
  - time-and-space-complexity-basics
relatedIds:
  - left-rotate-array-by-k-places
  - check-if-array-is-sorted-and-rotated
  - move-zeros-to-end
  - remove-duplicates-from-sorted-array
---

<!-- @summary -->
Move every element one position left and wrap the first one round to the end — a four-line problem whose real lesson is that the version with the fewest writes is not the fastest, and whose reversal solution is deliberate overkill that becomes the answer for rotating by K.

<!-- @theory -->
## The problem

Given an array, rotate it left by one position. Every element moves one slot
towards the front, and the first element wraps around to the back.

```
[1, 2, 3, 4, 5]  ->  [2, 3, 4, 5, 1]
```

Do it **in place**, so the caller sees the change, and use O(1) extra memory.

## It is the ring again

Subtopic 3 established that an array can be read as a ring, and that rotation
only changes where you start reading. This problem is that idea made concrete:
rotating left by one is stepping the reading position one place clockwise.

Nothing about the circular arrangement changes. If you could hand the caller a
different starting offset instead of an array, rotation would cost nothing at
all — which is precisely what a **deque** does, and why the measurements below
show its rotate running in constant time. With a plain array you cannot move the
starting point, so you must move all the data instead.

## The core algorithm, and the bug that lives in it

Save the first element. Shift everything left by one. Put the saved element at
the end.

```
temp = arr[0]
for i from 0 to n-2:  arr[i] = arr[i+1]
arr[n-1] = temp
```

**The save must happen first.** Written the other way round, the first iteration
overwrites `arr[0]`, and the value you eventually place at the end is whatever
replaced it. Executed on `[1,2,3,4,5]`, forgetting the save produces
`[2,3,4,5,2]` — the 1 is gone and the 2 appears twice. It is a one-line mistake
that produces a plausible-looking array.

Note the loop bound too: `i` stops at `n-2`, because `arr[i+1]` would read past
the end at `i = n-1`. The last slot is filled by the saved value, not by the loop.

## Counting the writes

Every approach here is O(n) time, so the interesting comparison is how many
element writes each performs. Measured exactly at n = 1,000:

| Approach | Writes | Per element |
|---|---|---|
| Save one, shift, place | 1,001 | **1.0n** |
| Temporary array | 2,000 | 2.0n |
| Adjacent swaps | 2,997 | 3.0n |
| Reversal (k = 1) | 2,997 | 3.0n |

The single-temp version is optimal, and provably so: every element genuinely
changes position, so at least `n` writes are required, and it performs `n + 1`.

You would expect that to settle the question. It does not.

## Fewer writes is not faster

Measured at n = 10,000,000:

| Approach | Writes | Time |
|---|---|---|
| Manual shift loop | 1.0n | 5.707ms |
| Reversal | 3.0n | **4.685ms** |
| memmove + place | 1.0n | **1.249ms** |
| `std::rotate` | — | 1.250ms |

Two things there are worth stopping on.

**The reversal does three times the writes and finishes faster.** Compiled with
`-Rpass=loop-vectorize`, clang reports `std::reverse` as *"vectorized loop
(vectorization width: 4, interleaved count: 2)"*, so it moves several elements
per instruction. The hand-written shift loop gets no such remark — it moves
exactly one element per iteration.

**`memmove` performs the identical element moves 4.4x faster.** Same 1.0n
writes, same data, same result. The difference is entirely that `memmove` is a
bulk operation the library implements with wide vector loads and stores, while
the loop is a sequence of individual assignments. `std::rotate` matched it to
three decimal places — 1.250ms against 1.249ms — so it is dispatching to the same
bulk path.

This is the third subtopic in a row where the operation count and the runtime
disagree, and it is the cleanest instance yet: here the two versions perform
*exactly the same number of writes* and differ by 4.4x.

## The reversal algorithm, and why it is here

Reversal solves rotation like this, for a left rotation by `k`:

```
reverse(arr, 0, k-1)      // reverse the first k
reverse(arr, k, n-1)      // reverse the rest
reverse(arr, 0, n-1)      // reverse the whole thing
```

At `k = 1` the first call reverses a single element and does nothing at all, so
this is a needlessly elaborate way to achieve a one-step shift. Verified on
`[1,2,3,4,5]`: the middle reverse gives `[1,5,4,3,2]`, and the final reverse
gives `[2,3,4,5,1]`.

It earns its place for two reasons. It is measurably faster than the naive loop
despite doing three times the writes, for the vectorisation reason above. And it
is the **only approach here that generalises**: rotating by K with the shift
method means repeating the whole shift K times, which is O(n·K), while the
reversal is O(n) for any K. That is the next subtopic, and this is where the
trick is worth meeting first on an input small enough to trace by hand.

## Python inverts the ranking, again

Measured at n = 1,000,000:

| Approach | Time |
|---|---|
| Manual loop | 53.303ms |
| Reverse ×3 | 19.033ms |
| Slicing `a[1:] + a[:1]` | 14.001ms |
| `deque.rotate(-1)` including the copy | 7.402ms |
| `a.append(a.pop(0))` | **3.258ms** |

`a.pop(0)` is nominally O(n) — it shifts the entire list down one slot — and it
still beats the hand-written loop by **16x**, because it is one C-level bulk move
against a million interpreted iterations. Same story as `max()` in Largest
Element and `set` in Remove Duplicates, arrived at from a different direction.

## The one place a data structure beats an algorithm

`collections.deque` stores its contents in blocks with a movable head, so
rotating is a pointer adjustment rather than a data move. Measured on an existing
deque:

| n | `rotate(-1)` |
|---|---|
| 1,000 | 0.0535 µs |
| 100,000 | 0.0538 µs |
| 10,000,000 | 0.0619 µs |

Ten thousand times the data for essentially the same time. That is **O(1)**, not a
better constant — the only case so far in this module where changing the data
structure changes the complexity class rather than the multiplier.

The catch is the conversion: turning a list into a deque is O(n), so this only
pays when the data already lives in a deque, or when you will rotate many times.
If rotation is a frequent operation in your problem, that is a strong signal you
picked the wrong container, not the wrong algorithm.

## Left versus right

Rotating **right** by one is the mirror image: save the **last** element, shift
everything one slot **right**, and place the saved value at index 0. The shift
loop must then run **backwards**, from `n-1` down to `1`, or it will overwrite
values it has not yet copied.

Mixing the two directions up is the most common way to fail this problem when it
appears as one line inside a larger algorithm.

## Where this goes next

**Left Rotate Array by K Places** is the real destination, where repeating this
shift K times is O(n·K) and the reversal algorithm delivers O(n). The same
in-place discipline continues into **Move Zeros to End**.

<!-- @intuition -->
Everyone in a queue steps forward one place and the person at the front walks to the back. You cannot move them all simultaneously, so you take the front person out of the line first — that empty space is what lets everyone else shuffle up without colliding. Forget to take them out first and you overwrite them with the person behind.

<!-- @approach -->
### Brute Force - Temporary Array

<!-- @idea -->
Build the rotated array in fresh storage, then copy it back over the original.

<!-- @steps -->
1. Create a temporary array of the same length.
2. Copy each element from index i + 1 of the original into index i of the temporary array.
3. Copy the original's first element into the last position of the temporary array.
4. Copy the temporary array back over the original.
5. Return, having modified the original in place.

<!-- @complexity -->
- time: O(n)
- space: O(n)
- note: Measured 2.0n writes — 2,000 at n = 1,000. Correct and simple, and it allocates a whole second array to avoid needing a single temporary variable.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void rotateLeftByOne(vector<int>& arr) {
    int n = arr.size();
    if (n <= 1) return;

    vector<int> temp(n);
    for (int i = 0; i < n - 1; i++) temp[i] = arr[i + 1];
    temp[n - 1] = arr[0];

    for (int i = 0; i < n; i++) arr[i] = temp[i];
}
```

<!-- @annotations -->
- 6: A single element rotated by one is itself, and an empty array has nothing to move.
- 9: The wrap is explicit here: the old first element is placed by hand at the end.
- 12: The copy back is what makes this 2.0n writes — measured 2,000 at n = 1,000, against 1,001 for the single-temp version.

<!-- @code java -->
```java
static void rotateLeftByOne(int[] arr) {
    int n = arr.length;
    if (n <= 1) return;

    int[] temp = new int[n];
    for (int i = 0; i < n - 1; i++) temp[i] = arr[i + 1];
    temp[n - 1] = arr[0];

    System.arraycopy(temp, 0, arr, 0, n);
}
```

<!-- @annotations -->
- 5: The allocation is the whole cost of this approach, and it is the constraint the optimal version removes.
- 9: arraycopy writes into the caller's array, so the rotation is visible outside the method.

<!-- @code python -->
```python
def rotate_left_by_one(arr):
    n = len(arr)
    if n <= 1:
        return

    temp = arr[1:] + arr[:1]     # everything after the first, then the first
    arr[:] = temp                # slice assignment mutates the caller's list
```

<!-- @annotations -->
- 6: Slicing builds two new lists and concatenates them, so this is O(n) extra space.
- 7: arr[:] = temp mutates in place. arr = temp would rebind the local name and the caller would see nothing.

<!-- @approach -->
### Adjacent Swaps

<!-- @idea -->
Bubble the first element to the end by swapping it with each neighbour in turn.

<!-- @steps -->
1. Start at index 0.
2. Swap the element at the current index with the one immediately after it.
3. Advance one index, so the original first element travels one step further right.
4. Repeat until the original first element has reached the last position.
5. Every other element has shifted one place left as a side effect.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Meets the space constraint and performs three times the necessary writes — measured 3.0n against 1.0n for the single-temp version. Worth seeing because it needs no temporary at all, and worth rejecting because the temporary is cheaper than the swaps.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void rotateLeftByOne(vector<int>& arr) {
    for (size_t i = 0; i + 1 < arr.size(); i++) {
        swap(arr[i], arr[i + 1]);
    }
}
```

<!-- @annotations -->
- 6: No guard needed: with 0 or 1 elements the condition fails immediately and nothing happens.
- 7: Each swap is three writes, giving 3.0n overall — measured 2,997 at n = 1,000, triple the optimal.

<!-- @code java -->
```java
static void rotateLeftByOne(int[] arr) {
    for (int i = 0; i + 1 < arr.length; i++) {
        int t = arr[i];
        arr[i] = arr[i + 1];
        arr[i + 1] = t;
    }
}
```

<!-- @annotations -->
- 3: The three lines are the three writes. Java has no built-in swap for primitives.

<!-- @code python -->
```python
def rotate_left_by_one(arr):
    for i in range(len(arr) - 1):
        arr[i], arr[i + 1] = arr[i + 1], arr[i]
```

<!-- @annotations -->
- 3: Tuple assignment swaps without a named temporary, but still performs the same element writes underneath.

<!-- @approach -->
### Optimal - Save One, Shift, Place

<!-- @idea -->
Hold the first element in one variable, slide everything left, then drop it into the vacated last slot.

<!-- @steps -->
1. Return immediately if the array has fewer than two elements.
2. Save the first element in a temporary variable.
3. For each index from 0 to n - 2, copy the element from the next index into the current one.
4. Stop the loop at n - 2, because reading index n would run past the end.
5. Write the saved value into the last position.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The write-count optimum at 1.0n, and NOT the fastest. Measured at n = 10,000,000: this loop takes 5.707ms while memmove performs the identical moves in 1.249ms and the 3n-write reversal finishes in 4.685ms.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void rotateLeftByOne(vector<int>& arr) {
    int n = arr.size();
    if (n <= 1) return;

    int temp = arr[0];                              // save FIRST
    for (int i = 0; i < n - 1; i++) arr[i] = arr[i + 1];
    arr[n - 1] = temp;
}
```

<!-- @annotations -->
- 8: Saving before the loop is the whole correctness of this approach. Shifting first destroys arr[0] on iteration one.
- 9: The bound is n - 1 so that arr[i + 1] never reads past the end; the final slot is filled after the loop.
- 10: 1.0n writes overall — measured 1,001 at n = 1,000, which is the provable minimum since every element must move.

<!-- @code java -->
```java
static void rotateLeftByOne(int[] arr) {
    int n = arr.length;
    if (n <= 1) return;

    int temp = arr[0];
    for (int i = 0; i < n - 1; i++) arr[i] = arr[i + 1];
    arr[n - 1] = temp;
}
```

<!-- @annotations -->
- 5: One int of extra storage regardless of array size, which is what O(1) space means here.
- 7: Arrays are objects in Java, so this writes through the caller's reference and the rotation is visible outside.

<!-- @code python -->
```python
def rotate_left_by_one(arr):
    n = len(arr)
    if n <= 1:
        return

    temp = arr[0]
    for i in range(n - 1):
        arr[i] = arr[i + 1]
    arr[-1] = temp


# Measured 53.303ms at n = 1,000,000 — the SLOWEST option in Python,
# because every one of those assignments is an interpreted step.
# arr.append(arr.pop(0)) does the same job in 3.258ms.
```

<!-- @annotations -->
- 6: Correct, minimal in writes, and the slowest thing you can write in Python for this task.
- 9: arr[-1] is the last element, so no length arithmetic is needed.
- 13: pop(0) is nominally O(n) and still 16x faster, because it is one bulk C move rather than a million interpreted ones.

<!-- @approach -->
### Reversal Algorithm

<!-- @idea -->
Reverse the first k elements, reverse the rest, then reverse the whole array.

<!-- @steps -->
1. Reverse the first k elements, which for k = 1 is a single element and therefore does nothing.
2. Reverse the remaining elements from index k to the end.
3. Reverse the entire array.
4. The result is the array rotated left by k positions.
5. For k = 1 this is deliberate overkill; for a general k it is the whole solution.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: 3.0n writes — measured 2,997 at n = 1,000, triple the optimum, and still 4.685ms against 5.707ms for the 1.0n loop at ten million elements. Its real justification is generality: this is O(n) for any k, while repeating a one-step shift k times is O(n*k).

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void rotateLeftByK(vector<int>& arr, int k) {
    int n = arr.size();
    if (n <= 1) return;
    k %= n;                                     // k may exceed n

    reverse(arr.begin(), arr.begin() + k);      // k = 1: reverses one element
    reverse(arr.begin() + k, arr.end());        // [1,2,3,4,5] -> [1,5,4,3,2]
    reverse(arr.begin(), arr.end());            //            -> [2,3,4,5,1]
}

void rotateLeftByOne(vector<int>& arr) { rotateLeftByK(arr, 1); }
```

<!-- @annotations -->
- 8: Without this, k larger than n indexes past the end. Irrelevant at k = 1 and essential for the general case.
- 10: A no-op at k = 1, which is exactly why this approach is overkill here and correct everywhere.
- 12: Measured 4.685ms at n = 10,000,000 — FASTER than the 1.0n-write shift loop, because clang vectorises std::reverse at width 4.

<!-- @code java -->
```java
static void reverse(int[] a, int l, int r) {
    while (l < r) { int t = a[l]; a[l] = a[r]; a[r] = t; l++; r--; }
}

static void rotateLeftByK(int[] arr, int k) {
    int n = arr.length;
    if (n <= 1) return;
    k %= n;

    reverse(arr, 0, k - 1);
    reverse(arr, k, n - 1);
    reverse(arr, 0, n - 1);
}
```

<!-- @annotations -->
- 10: At k = 1 this is reverse(arr, 0, 0), where l < r is immediately false and the loop never runs.
- 12: Three passes over the data, 3.0n writes, and O(1) space — no allocation anywhere.

<!-- @code python -->
```python
def rotate_left_by_k(arr, k):
    n = len(arr)
    if n <= 1:
        return
    k %= n

    arr[:k] = arr[:k][::-1]
    arr[k:] = arr[k:][::-1]
    arr[:] = arr[::-1]


def rotate_left_by_one(arr):
    rotate_left_by_k(arr, 1)
```

<!-- @annotations -->
- 7: Slice assignment keeps the mutation in place, though [::-1] does build a temporary copy of each slice.
- 9: Measured 19.033ms at n = 1,000,000 — faster than the interpreted loop's 53.303ms, slower than pop(0) at 3.258ms.

<!-- @approach -->
### Library Call or the Right Data Structure

<!-- @idea -->
Use the standard rotate routine, or store the data in a structure where rotation costs nothing.

<!-- @steps -->
1. In C++, call rotate with the new first element as the middle argument.
2. In Python, use a deque and call rotate with a negative argument to rotate left.
3. Recognise that a deque's rotate is a pointer adjustment rather than a data move.
4. Account for the O(n) cost of converting a list into a deque if the data does not already live in one.
5. Prefer this whenever rotation is a frequent operation rather than a one-off.

<!-- @complexity -->
- time: O(n) for arrays and lists, O(1) for a deque already holding the data
- space: O(1)
- note: std::rotate measured 1.250ms at n = 10,000,000 against 5.707ms for the hand-written loop. Python's deque.rotate is flat in n — 0.0535us at a thousand elements and 0.0619us at ten million — the only case in this module where a data structure changes the complexity class rather than the constant.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
#include <cstring>
using namespace std;

void rotateLeftByOne(vector<int>& arr) {
    if (arr.size() <= 1) return;
    rotate(arr.begin(), arr.begin() + 1, arr.end());
}

// What makes it fast — the same 1.0n moves, done in bulk:
void rotateLeftByOneMemmove(vector<int>& arr) {
    int n = arr.size();
    if (n <= 1) return;
    int temp = arr[0];
    memmove(arr.data(), arr.data() + 1, (size_t)(n - 1) * sizeof(int));
    arr[n - 1] = temp;
}
```

<!-- @annotations -->
- 8: The middle argument becomes the new first element. Measured 1.250ms at n = 10,000,000.
- 16: memmove measured 1.249ms — matching std::rotate to three decimals, which is strong evidence rotate dispatches here.
- 17: Identical write count to the hand-written loop, and 4.4x faster. The difference is bulk movement, not fewer moves.

<!-- @code java -->
```java
import java.util.Collections;
import java.util.List;

// Collections.rotate works on a List, not on a primitive int[].
// A negative distance rotates left.
static void rotateLeftByOne(List<Integer> list) {
    if (list.size() <= 1) return;
    Collections.rotate(list, -1);
}

// For int[] there is no library rotate; the single-temp shift remains the answer.
```

<!-- @annotations -->
- 8: Negative rotates left, positive rotates right — the opposite convention to Python's deque, which is worth pinning down before use.
- 11: Boxing an int[] into a List<Integer> to use this would cost far more than the rotation itself.

<!-- @code python -->
```python
from collections import deque

def rotate_left_by_one_list(arr):
    if len(arr) <= 1:
        return                    # pop(0) raises IndexError on an empty list
    arr.append(arr.pop(0))        # 3.258ms at n = 1,000,000 — fastest for a list


# If rotation happens often, use the structure built for it:
d = deque([1, 2, 3, 4, 5])
d.rotate(-1)                      # negative rotates LEFT -> deque([2,3,4,5,1])
# Measured on an existing deque: 0.0535us at n=1,000 and 0.0619us at
# n=10,000,000 — flat in n, because no elements move at all.
```

<!-- @annotations -->
- 4: Without this guard pop(0) raises IndexError on an empty list, unlike every other approach here.
- 6: pop(0) shifts the whole list and is still the fastest list option, since it is one C-level move.
- 11: Negative for left, positive for right — the reverse of Java's Collections.rotate convention.
- 12: Genuinely O(1): ten thousand times the data for the same time, because rotating a deque moves a pointer, not the contents.

<!-- @example -->

<!-- @input -->
arr = [1, 2, 3, 4, 5]

<!-- @output -->
[2, 3, 4, 5, 1]

<!-- @why -->
The full trace shows the duplicated value travelling along the array as a normal intermediate state rather than a bug, which is the part that looks alarming the first time it is watched.

<!-- @walkthrough -->
1. Save the first element, so temp holds 1.
2. i = 0: copy arr[1] into arr[0], giving [2, 2, 3, 4, 5].
3. i = 1: copy arr[2] into arr[1], giving [2, 3, 3, 4, 5].
4. i = 2: copy arr[3] into arr[2], giving [2, 3, 4, 4, 5].
5. i = 3: copy arr[4] into arr[3], giving [2, 3, 4, 5, 5], and the loop stops here because reading arr[5] would run past the end.
6. Write temp into the last slot, giving [2, 3, 4, 5, 1].
7. Six writes for five elements, which is the n + 1 the analysis predicts.

<!-- @example -->

<!-- @input -->
arr = [1, 2, 3, 4, 5], with the save omitted

<!-- @output -->
[2, 3, 4, 5, 2] — wrong, and plausible-looking

<!-- @why -->
The single most common way to write this wrong, and the reason the ordering of two adjacent lines is worth stating explicitly rather than assuming.

<!-- @walkthrough -->
1. The shift runs first, so i = 0 copies arr[1] into arr[0] and the value 1 is destroyed immediately.
2. The remaining iterations proceed normally, leaving [2, 3, 4, 5, 5].
3. Now the code reads arr[0] to fill the last slot, but arr[0] no longer holds 1 — it holds 2.
4. The final array is [2, 3, 4, 5, 2], executed and verified on this machine.
5. The original first element has vanished and the second element appears twice.
6. Nothing about the output signals an error: it is the right length, and it looks like a rotation.

<!-- @example -->

<!-- @input -->
arr = [7] and arr = []

<!-- @output -->
[7] and [] — both unchanged

<!-- @why -->
The empty case is the one that actually needs the guard, and it fails differently in each language — silently corrupting memory in C++ and raising in Python.

<!-- @walkthrough -->
1. A single-element array rotated by one position is itself, since the only element wraps back to where it started.
2. The guard returns immediately, and even without it the loop bound n - 1 evaluates to 0 so the body never runs.
3. The final write arr[n-1] = temp would then write arr[0] back to itself, which is harmless but pointless.
4. For an empty array the guard is genuinely necessary: n - 1 is -1, and arr[-1] is an out-of-bounds write in C++ and Java.
5. In Python arr[-1] would silently target the last element, so on an empty list it raises IndexError instead.
6. Both cases are handled by the single n <= 1 check at the top.

<!-- @example -->

<!-- @input -->
The same rotation performed by four approaches at n = 10,000,000

<!-- @output -->
Runtimes that do not follow the write counts

<!-- @why -->
The cleanest demonstration in the module that operation counts rank algorithms rather than runtimes — two versions with exactly the same write count differ by 4.4x.

<!-- @walkthrough -->
1. The hand-written shift loop performs 1.0n writes, the theoretical minimum, and takes 5.707ms.
2. The reversal algorithm performs 3.0n writes, three times as many, and takes 4.685ms — faster despite tripling the work.
3. Compiled with -Rpass=loop-vectorize, clang reports std::reverse as vectorized at width 4 with interleave 2, so it moves several elements per instruction.
4. memmove performs exactly the same 1.0n writes as the hand-written loop and takes 1.249ms, which is 4.4x faster.
5. std::rotate takes 1.250ms, matching memmove to three decimal places and indicating it uses the same bulk path.
6. So the fastest and the slowest versions here perform an identical number of element writes.

<!-- @visualization array -->

<!-- @description -->
The array as a horizontal strip with a holding slot drawn above index 0, and a ring view beside it carried over from the sorted-and-rotated subtopic. Begin by lifting the first element out of the strip into the holding slot, leaving that cell visibly empty — the emptiness is the whole mechanism, because it is the space every later element shifts into. Then advance a marker left to right, and on each step animate the value at i + 1 sliding one cell left into position i, leaving its own cell showing a faded duplicate of the value it just gave away. Those faded duplicates are important to draw rather than hide: they are why a mid-rotation snapshot looks like [2, 2, 3, 4, 5] and reads as corrupted when it is merely unfinished. Stop the marker at n - 2 and draw the read it would have made at n - 1 as a red arrow pointing off the end of the strip, labelled as the reason the loop stops early. Finally drop the held value from the slot into the vacated last cell and clear every faded duplicate at once. Beside all this, the ring view stays completely still except for a single reading-head marker that steps one position clockwise, making the point that rotation changed nothing about the arrangement — only where reading begins. A bug panel replays the same input with the holding slot removed: the first shift overwrites index 0 in place, the original value visibly vanishes from the screen entirely, and the final step copies the wrong value to the end, producing [2, 3, 4, 5, 2] with the lost 1 shown greyed out beneath. A cost panel runs the four approaches side by side on the same input with live write counters — single temp reaching 1.0n, temp array 2.0n, adjacent swaps and reversal both 3.0n — and then displays the measured runtimes underneath in a deliberately mismatched order, with memmove and the manual loop marked as having identical write counts and a 4.4x time gap.

<!-- @sampleInput -->
```json
{"primary":{"array":[1,2,3,4,5],"held":1,"steps":[{"i":0,"movedFrom":1,"value":2,"state":[2,2,3,4,5]},{"i":1,"movedFrom":2,"value":3,"state":[2,3,3,4,5]},{"i":2,"movedFrom":3,"value":4,"state":[2,3,4,4,5]},{"i":3,"movedFrom":4,"value":5,"state":[2,3,4,5,5]}],"loopStopsAt":3,"wouldReadIndex":5,"finalPlace":{"index":4,"value":1},"result":[2,3,4,5,1],"writes":6},"ringView":{"values":[1,2,3,4,5],"readHeadBefore":0,"readHeadAfter":1,"arrangementChanged":false},"bugPanel":{"array":[1,2,3,4,5],"savedFirst":false,"afterShift":[2,3,4,5,5],"finalRead":2,"result":[2,3,4,5,2],"lostValue":1},"costPanel":{"n":1000,"writes":{"singleTemp":1001,"tempArray":2000,"adjacentSwaps":2997,"reversal":2997},"timingN":10000000,"timings":{"manualLoop":5.707,"reversal":4.685,"memmove":1.249,"stdRotate":1.250},"identicalWriteCountPair":["manualLoop","memmove"],"timeGap":4.4},"dequePanel":{"rotateMicroseconds":{"1000":0.0535,"100000":0.0538,"10000000":0.0619},"flatInN":true}}
```

<!-- @highlights -->
- The first element lifts out of the strip into a holding slot above it, leaving index 0 visibly empty.
- That empty cell is the mechanism — it is the space the next element shifts into, and without it there is nowhere to move.
- The marker sits at index 0 and the value 2 slides one cell left, leaving a faded duplicate behind at index 1.
- The strip now reads [2, 2, 3, 4, 5], which looks corrupted and is simply unfinished.
- The marker advances and 3, then 4, then 5 each slide one cell left, each leaving a faded duplicate.
- The marker stops at index 3, and the read it would have made at index 5 is drawn as a red arrow pointing off the end of the strip.
- That arrow is why the loop bound is n - 1: one more iteration would read past the array.
- The held value drops from the slot into the vacated last cell and every faded duplicate clears at once, giving [2, 3, 4, 5, 1].
- Six writes were performed for five elements, matching the n + 1 the analysis predicts.
- Throughout, the ring beside the strip has not moved at all — only its reading head stepped one position clockwise.
- The bug panel replays the same input with the holding slot removed, so the first shift overwrites index 0 and the value 1 disappears from the screen.
- Its final step copies the wrong value to the end, producing [2, 3, 4, 5, 2] with the lost 1 greyed out beneath.
- The cost panel runs four approaches together with live write counters: single temp reaches 1.0n, temp array 2.0n, adjacent swaps and reversal both 3.0n.
- The measured runtimes then appear in a different order entirely — reversal at 4.685ms beating the manual loop at 5.707ms despite tripling the writes.
- memmove and the manual loop are highlighted as performing an identical number of writes while differing by 4.4x, at 1.249ms against 5.707ms.
- The deque panel shows rotate holding flat at roughly 0.05 microseconds from a thousand elements to ten million, because no element moves at all.

<!-- @edgeCases -->
- Empty array — the guard is genuinely required, since n - 1 is -1 and writing arr[-1] corrupts memory in C++ and raises IndexError in Python.
- Single-element array — rotating by one returns it to itself, and the loop body never executes.
- Two-element array — the smallest input where anything visibly moves, and it is simply a swap.
- All elements identical — the rotation is invisible in the output while every write still happens.
- Array where the first element is the largest or smallest — nothing special occurs, but it is the case people expect to break.
- Rotating an array of size n by n positions — the identity, and the reason the general algorithm takes k modulo n.
- Rotating right instead of left — the mirror image, requiring the shift loop to run backwards or it overwrites unread values.
- Very large arrays where the manual loop's per-element cost dominates, measured 5.707ms against 1.249ms for memmove at ten million elements.
- A list that will be rotated repeatedly, where converting once to a deque turns each subsequent rotation into an O(1) pointer move.
- An array passed by value rather than by reference, where the rotation happens correctly and the caller never sees it.

<!-- @pitfalls -->
- Shifting before saving the first element. Executed on [1,2,3,4,5] this produces [2,3,4,5,2] — the first value is destroyed on iteration one and the wrong value lands at the end.
- Running the loop to n - 1 inclusive, so arr[i + 1] reads one position past the end of the array.
- Omitting the empty-array guard, where n - 1 is -1 and the final write targets an invalid index.
- Rotating right when left was asked for. Right rotation must also shift backwards, from the end towards the start, or it overwrites values it has not copied yet.
- Writing arr = temp in Python instead of arr[:] = temp, which rebinds the local name and leaves the caller's list untouched.
- Allocating a whole second array to avoid needing one temporary variable, doubling the writes from 1.0n to 2.0n for no benefit.
- Using adjacent swaps because they need no temporary. Each swap is three writes, measured 3.0n against 1.0n for the single-temp version.
- Assuming the fewest writes means the fastest. Measured, memmove and the hand-written loop perform identical write counts and differ by 4.4x.
- Writing an interpreted shift loop in Python. Measured 53.303ms at a million elements against 3.258ms for arr.append(arr.pop(0)).
- Converting a list to a deque for a single rotation. The conversion is O(n), so it only pays when the data already lives there or will be rotated many times.
- Confusing the rotate direction conventions. Python's deque.rotate takes negative for left, while Java's Collections.rotate takes negative for left and positive for right on a List — check before relying on either.
- Applying the reversal algorithm without taking k modulo n, so a k larger than the array length indexes past the end.

<!-- @doubt -->
### Why must I save arr[0] before the shift instead of after?

<!-- @answer -->
Because the first iteration of the shift writes into arr[0] and destroys it. Executed on [1,2,3,4,5] without the save, the shift leaves [2,3,4,5,5], and the code then reads arr[0] to fill the last slot — but arr[0] now holds 2, not 1. The result is [2,3,4,5,2]: the original first element is gone and the second appears twice. It is the right length and looks like a rotation, which is what makes it worth stating explicitly.

<!-- @doubt -->
### Why does the loop stop at n - 2 rather than n - 1?

<!-- @answer -->
Because the body reads arr[i + 1]. At i = n - 1 that would read arr[n], one position past the end of the array. The last slot is not filled by the loop at all — it receives the saved value afterwards. Writing the bound as i < n - 1 makes this automatic, and it is the same off-by-one discipline as i < n for a plain scan.

<!-- @doubt -->
### The mid-rotation array shows a duplicated value. Is something wrong?

<!-- @answer -->
No, that is the correct intermediate state. After copying arr[1] into arr[0], the value 2 legitimately sits in both positions until arr[1] receives its own new value on the next iteration. Watching [1,2,3,4,5] become [2,2,3,4,5] then [2,3,3,4,5] looks alarming and is simply unfinished work. The duplicate travels along the array like a ripple and is resolved by the final write.

<!-- @doubt -->
### Which approach has the fewest writes?

<!-- @answer -->
The single temporary variable, at 1.0n — measured exactly 1,001 writes at n = 1,000. That is provably minimal, because every element genuinely changes position so at least n writes are required. The temporary array costs 2.0n at 2,000 writes, and both the adjacent-swap and reversal approaches cost 3.0n at 2,997. If write count were the only thing that mattered the question would end there, which is precisely why it is worth measuring the runtimes too.

<!-- @doubt -->
### Then why is the version with the fewest writes not the fastest?

<!-- @answer -->
Because how the writes happen matters as much as how many there are. Measured at n = 10,000,000, the hand-written loop takes 5.707ms while memmove performs the identical 1.0n moves in 1.249ms — 4.4x faster with exactly the same write count, because it moves memory in bulk rather than one element per iteration. The reversal does three times the writes and still finishes in 4.685ms, since clang vectorises std::reverse at width 4. std::rotate measured 1.250ms, matching memmove almost exactly. Operation counts rank algorithms; they do not rank runtimes on a real machine.

<!-- @doubt -->
### Why teach the reversal algorithm for a one-step rotation?

<!-- @answer -->
Because it is the only approach here that survives the next problem. At k = 1 it is genuinely overkill — the first reverse acts on a single element and does nothing. But rotating by K with the shift method means repeating the entire shift K times, which is O(n*K), while the reversal is O(n) for any K. Meeting it now on a five-element array you can trace by hand is much easier than meeting it for the first time alongside a general k. It also happens to be faster than the naive loop here, for the vectorisation reason above.

<!-- @doubt -->
### What is the fastest way to do this in Python?

<!-- @answer -->
arr.append(arr.pop(0)), measured at 3.258ms for a million elements. That is surprising, because pop(0) is nominally O(n) — it shifts the entire list down one slot. It still beats the hand-written loop by 16x, since it is a single bulk move implemented in C against a million interpreted iterations. The explicit loop measured 53.303ms, slicing 14.001ms, and three reversals 19.033ms. This is the same pattern as max() beating a hand loop by 4x in Largest Element.

<!-- @doubt -->
### Is deque.rotate really O(1), or just fast?

<!-- @answer -->
Genuinely O(1). A deque stores its contents in blocks with a movable head, so rotating adjusts a pointer rather than moving any data. Measured on an existing deque: 0.0535 microseconds at n = 1,000, 0.0538 at n = 100,000, and 0.0619 at n = 10,000,000 — ten thousand times the data for essentially the same time. The catch is that converting a list into a deque is itself O(n), so this only pays when the data already lives in a deque or will be rotated repeatedly. If rotation is frequent in your problem, that is a signal you chose the wrong container rather than the wrong algorithm.

<!-- @doubt -->
### How do I rotate right by one instead?

<!-- @answer -->
It is the mirror image, with one detail that catches people. Save the LAST element, shift everything one position right, then place the saved value at index 0. Critically the shift loop must run BACKWARDS, from i = n - 1 down to 1, assigning arr[i] = arr[i - 1]. Running it forwards would overwrite each element before it had been copied, propagating the first value across the whole array. The direction of the loop is forced by the direction of the rotation.
