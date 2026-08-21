---
id: largest-element
topic: Arrays
title: Largest Element
difficulty: Easy
status: ready
prerequisites:
  - for-loop
  - variables-and-constants
  - relational-and-logical-operators
  - data-types
  - pass-by-value-vs-pass-by-reference
  - time-and-space-complexity-basics
relatedIds:
  - second-largest-element
  - maximum-consecutive-ones
  - kadanes-algorithm
---

<!-- @summary -->
Find the maximum value in an array with a single left-to-right pass, and see why answering an order question does not require ordering anything — plus why the hand-written loop is free in C++ and a 4x tax in Python.

<!-- @theory -->
## The problem

Given an array of `n` integers, return the largest value in it. Assume the array
has at least one element — the empty case is a genuine decision, and it gets its
own section below.

## The obvious move, and why it overshoots

Sort the array, read the last element. It works, and it is two lines.

But look at what it buys. Sorting arranges **every** element relative to **every**
other. The question asked for one value. You have computed the complete ordering
of the input and then thrown all of it away except the final entry.

That gap between what you computed and what you were asked for is the thing to
notice. It shows up constantly, and recognising it is most of what separates an
O(n log n) habit from an O(n) one.

## Carry the best so far

Hold a **candidate** for the answer. Walk the array once. Whenever an element
beats the candidate, it becomes the new candidate. When the walk ends, the
candidate is the maximum.

Why that is correct, stated properly: every element was compared against the
candidate at the moment it was visited, and the candidate only ever moved upward.
So no element in the array exceeds the final candidate, and the final candidate
is itself an element of the array. Those two facts together are exactly the
definition of the maximum.

That is the whole algorithm. Its value is not the algorithm — it is the shape.
**Carry a running best, update it on a condition, return it at the end.** Maximum
consecutive ones carries a running streak. Kadane's algorithm carries a running
sum. Stock buy-and-sell carries a running minimum. You are learning the skeleton
here on the simplest possible body.

## Seed from the array, never from zero

The candidate must start as a **real element**, and the natural choice is `arr[0]`.

Seeding `max = 0` is the classic bug. On `[-7, -2, -9]` nothing ever beats 0, so
you return 0 — a value that does not appear in the input at all. The test data
that catches this is any array whose elements are all negative, which is exactly
the data that casual testing omits.

Seeding with the type's minimum (`INT_MIN`, `Integer.MIN_VALUE`, `float('-inf')`)
is correct, and it is genuinely useful when you must handle an empty array by
returning a sentinel. But for a non-empty array `arr[0]` is simpler, needs no
header, and cannot be got wrong.

## Why the comparison is strictly greater-than

`>` and `>=` return the **same value**. If several elements tie for the maximum,
they are equal, so which one you keep does not change the answer.

They differ in which one you *latch onto*: `>` keeps the **first** occurrence and
`>=` keeps the **last**. That is invisible here and decisive the moment the
problem asks for the **index** of the maximum instead of its value. Forming the
habit of `>` now means the index variant is correct by default.

## You cannot do better than one pass

n - 1 comparisons is not just good, it is **optimal**. Any algorithm that skips
an element can be defeated: put a huge value in the position it skipped, and the
answer it returns is wrong. So every element must be examined at least once, and
the scan already achieves that bound exactly.

O(n) time, O(1) extra space, and no algorithm can beat the time.

## What sorting actually costs

Measured on this machine at n = 1,000,000: the scan performs 999,999 comparisons
and `std::sort` performs 22,224,069 — a ratio of 22.2x.

That ratio is **not a constant**. `std::sort` uses roughly 1.115 * n log2(n)
comparisons, so the gap is about `1.1 * log2(n)` and widens as the array grows:

| n | scan comparisons | sort comparisons | ratio |
|---|---|---|---|
| 1,000 | 999 | 11,157 | 11.2x |
| 100,000 | 99,999 | 1,895,153 | 19.0x |
| 1,000,000 | 999,999 | 22,224,069 | 22.2x |

Wall-clock is worse still — 0.573ms against 32.866ms at n = 1,000,000, a 57x
gap — because sorting does not only compare, it also **moves** elements. The scan
never writes to the array at all.

## The three languages disagree about your own loop

Every language ships a one-liner: `*max_element(...)` in C++,
`Arrays.stream(arr).max().getAsInt()` in Java, `max(arr)` in Python. All are O(n).
The interesting part is what the hand-written loop costs relative to them, and
the answer is not the same in each.

**In C++ the loop is free.** Measured at n = 1,000,000: `max_element` 0.638ms,
hand-written loop 0.575ms. They are the same code once compiled — the abstraction
costs nothing, so writing it out to show the mechanism is not a sacrifice.

**In Python the loop costs 4x.** Measured at the same size: `max(arr)` 10.179ms,
hand-written loop 40.530ms. Both are O(n) and the ratio held steady at 4.0x, 4.2x
and 4.0x across three sizes, so this is a constant factor, not a complexity
difference. The reason is where the work happens: `max()` is compiled C looping
over the list, while your `for` runs the interpreter on every element.

The practical reading: **write the loop to learn the pattern and in an interview
where the loop is the point; call the builtin in production Python, where the same
complexity runs four times faster.** In C++ the choice is purely about readability.

## Empty input fails three different ways

This is a real decision, not a footnote, and the three languages punish you
differently for skipping it:

| Language | `arr[0]` on empty | Library call on empty |
|---|---|---|
| C++ | undefined behaviour, often no crash | `max_element` returns `end()`; dereferencing is UB |
| Java | `ArrayIndexOutOfBoundsException` | `getAsInt()` throws `NoSuchElementException` |
| Python | `IndexError` | `ValueError: max() iterable argument is empty` |

Java and Python both fail **loudly**, naming the problem. C++ fails **silently** —
it reads whatever memory sits there and hands you a plausible-looking number. The
C++ case is the dangerous one precisely because it usually does not crash.

So decide deliberately: reject the input, return a sentinel, or document that
non-empty is a precondition. All three are defensible; not deciding is not.

## Sorting mutates the caller's array

If you take the sorting route, note what it does to the data you were handed.

Verified in C++: a function taking `vector<int>& arr` and sorting it left the
caller's vector permanently reordered. Java's `Arrays.sort(arr)` does the same,
because the array reference is copied but the array is not. Python's
`arr.sort()` mutates in place and returns `None`, while `sorted(arr)` returns a
new list and leaves the original alone.

This is the pass-by-value-versus-reference lesson from Basics showing up with
real consequences for the first time. The caller did not ask you to reorder their
data, and a function that quietly does is a bug waiting to be blamed on someone
else.

## Where this goes next

The **second largest** element looks like a trivial extension and is not — the
naive two-pass version and the single-pass version disagree on duplicates.
Returning the **index** of the maximum is where `>` versus `>=` starts to matter.
And the running-best skeleton built here is the direct ancestor of **maximum
consecutive ones** and **Kadane's algorithm**.

<!-- @intuition -->
A value is the maximum exactly when nothing beats it. So appoint a champion, make every element challenge it once, and whoever is still standing at the end is the answer — you never needed to rank the losers against each other, which is precisely the work sorting does and then discards.

<!-- @approach -->
### Brute Force - Sorting

<!-- @idea -->
Sort the array in ascending order, then read the last element.

<!-- @steps -->
1. Sort the array in ascending order.
2. The largest element is now at index n - 1.
3. Read and return that element.
4. If the caller's array must survive, sort a copy instead of the original.

<!-- @complexity -->
- time: O(n log n)
- space: O(1) sorting in place, O(n) if you copy to protect the caller
- note: The sort dominates entirely. Measured at n = 1,000,000: 22,224,069 comparisons and 32.866ms, against 999,999 comparisons and 0.573ms for a single scan.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
using namespace std;

// Takes the vector BY VALUE, so arr is already a copy and the caller's
// data is untouched.
int largestElement(vector<int> arr) {
    sort(arr.begin(), arr.end());
    return arr[arr.size() - 1];
}

// The version usually written — and it reorders the caller's vector.
int largestElementInPlace(vector<int>& arr) {
    sort(arr.begin(), arr.end());
    return arr.back();
}
```

<!-- @annotations -->
- 7: By value costs a full copy of the array, which is O(n) extra space — the price of not mutating the caller.
- 8: About 1.115 * n * log2(n) comparisons. Measured: 22,224,069 at n = 1,000,000.
- 13: The & makes this the caller's own vector. Verified: after this call the caller's [3,1,2] became [1,2,3].

<!-- @code java -->
```java
import java.util.Arrays;

// Arrays.sort mutates the caller's array — the reference is copied,
// the array itself is not.
static int largestElement(int[] arr) {
    Arrays.sort(arr);
    return arr[arr.length - 1];
}

// Copy first when the caller's order matters.
static int largestElementSafe(int[] arr) {
    int[] copy = Arrays.copyOf(arr, arr.length);
    Arrays.sort(copy);
    return copy[copy.length - 1];
}
```

<!-- @annotations -->
- 6: Arrays.sort on a primitive int[] is a dual-pivot quicksort, which is O(n log n) on average but O(n^2) in its worst case.
- 12: Arrays.copyOf is the explicit copy. Java gives you no by-value option for arrays the way C++ does.

<!-- @code python -->
```python
def largest_element(arr):
    # sorted() returns a NEW list; the caller's list is untouched.
    return sorted(arr)[-1]


def largest_element_in_place(arr):
    arr.sort()        # mutates the caller's list, returns None
    return arr[-1]


# The classic bug this invites:
# biggest = arr.sort()   ->  biggest is None, because sort() returns nothing
```

<!-- @annotations -->
- 3: Index -1 is Python's last element. sorted() allocates a full copy, so this is O(n) extra space.
- 7: Verified: a = [3,1,2]; a.sort() leaves a == [1,2,3]. The return value is None, not the list.
- 12: Assigning the result of .sort() is the single most common Python beginner error on this problem.

<!-- @approach -->
### Optimal - Single Pass

<!-- @idea -->
Carry the best value seen so far, updating it whenever an element beats it.

<!-- @steps -->
1. Set the candidate to arr[0], so it starts as a real element of the array.
2. Start the scan at index 1, since comparing arr[0] against itself can change nothing.
3. Compare the current element against the candidate.
4. If the element is strictly greater, it becomes the new candidate.
5. Advance to the next index and repeat until the array is exhausted.
6. Return the candidate, which no element exceeded and which is itself an element of the array.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: n - 1 comparisons, which is provably optimal — any element left unexamined could have been the maximum. Measured 999,999 comparisons and 0.573ms at n = 1,000,000.

<!-- @code cpp -->
```cpp
#include <vector>
#include <stdexcept>
using namespace std;

int largestElement(const vector<int>& arr) {
    if (arr.empty()) {
        throw invalid_argument("largestElement: empty array");
    }

    int maxi = arr[0];
    for (size_t i = 1; i < arr.size(); i++) {
        if (arr[i] > maxi) {
            maxi = arr[i];
        }
    }
    return maxi;
}
```

<!-- @annotations -->
- 5: const& takes no copy and promises not to modify — the read-only intent is in the signature itself.
- 6: Without this guard arr[0] on an empty vector is undefined behaviour, and C++ will usually NOT crash. It returns garbage.
- 10: Seeded from a real element. Seeding 0 returns 0 on an all-negative array.
- 12: Strictly greater, so maxi latches onto the FIRST maximum. Using >= would latch the last, which matters once you return an index.

<!-- @code java -->
```java
static int largestElement(int[] arr) {
    if (arr == null || arr.length == 0) {
        throw new IllegalArgumentException("largestElement: empty array");
    }

    int maxi = arr[0];
    for (int i = 1; i < arr.length; i++) {
        if (arr[i] > maxi) {
            maxi = arr[i];
        }
    }
    return maxi;
}
```

<!-- @annotations -->
- 2: Java would throw ArrayIndexOutOfBoundsException on its own, but an explicit message beats a stack trace naming index 0.
- 6: Identical logic to C++ — for primitive int[] there is no divergence here at all.

<!-- @code python -->
```python
def largest_element(arr):
    if not arr:
        raise ValueError("largest_element: empty array")

    maxi = arr[0]
    for value in arr[1:]:
        if value > maxi:
            maxi = value
    return maxi


def largest_element_no_copy(arr):
    maxi = arr[0]
    for i in range(1, len(arr)):     # index loop — no slice, no copy
        if arr[i] > maxi:
            maxi = arr[i]
    return maxi
```

<!-- @annotations -->
- 2: Empty list is falsy, so this covers [] without a len() call.
- 6: arr[1:] is readable but COPIES the tail of the list — O(n) extra space that C++ and Java never pay here.
- 14: The index form avoids the copy. Measured at n = 1,000,000 this hand loop takes 40.530ms against 10.179ms for the builtin max().

<!-- @approach -->
### Library Function

<!-- @idea -->
Call the language's built-in maximum, and know what it costs relative to writing the loop.

<!-- @steps -->
1. Confirm the array is non-empty, because every library version fails on empty input.
2. Call the language's maximum routine over the whole array.
3. In C++ dereference the returned iterator, having checked it is not end().
4. In Java unwrap the OptionalInt, which throws if the stream was empty.
5. In Python call max directly, which raises ValueError on an empty iterable.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Same complexity as the hand loop, but the constant factor diverges by language. C++ measured identical (0.638ms vs 0.575ms); Python measured 4x faster than the loop (10.179ms vs 40.530ms), because max() runs as compiled C while the loop pays interpreter overhead per element.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <vector>
#include <stdexcept>
using namespace std;

int largestElement(const vector<int>& arr) {
    auto it = max_element(arr.begin(), arr.end());
    if (it == arr.end()) {
        throw invalid_argument("largestElement: empty array");
    }
    return *it;
}
```

<!-- @annotations -->
- 7: Returns an ITERATOR, not a value — which is why it can also give you the position of the maximum for free.
- 8: Verified: on an empty vector max_element returns end(). Dereferencing that without this check is undefined behaviour.
- 11: Measured 0.638ms at n = 1,000,000 against 0.575ms for the hand loop — the same speed. In C++ the abstraction is free.

<!-- @code java -->
```java
import java.util.Arrays;

static int largestElement(int[] arr) {
    return Arrays.stream(arr)
                 .max()                 // returns OptionalInt
                 .getAsInt();           // throws NoSuchElementException if empty
}

// Note: Collections.max works for List<Integer>, not for a primitive int[].
```

<!-- @annotations -->
- 5: max() returns an OptionalInt precisely because an empty stream has no maximum to return.
- 6: getAsInt() on an empty OptionalInt throws NoSuchElementException. Documented behaviour — not measured here, as this machine has no JRE installed.

<!-- @code python -->
```python
def largest_element(arr):
    return max(arr)          # ValueError on an empty iterable


def largest_element_safe(arr):
    return max(arr, default=None)    # returns None instead of raising
```

<!-- @annotations -->
- 2: Measured 10.179ms at n = 1,000,000, against 40.530ms for the hand-written loop. The builtin is 4x FASTER at identical O(n).
- 6: The default= keyword turns the empty case from an exception into a sentinel — often the cleanest guard available.

<!-- @example -->

<!-- @input -->
arr = [3, 3, 6, 1]

<!-- @output -->
6

<!-- @why -->
The duplicate of the seed value at index 1 is the case that shows > and >= return the same answer, differing only in which occurrence they latch onto.

<!-- @walkthrough -->
1. Seed the candidate with arr[0], so it starts at 3.
2. i = 1: arr[1] is 3, which is not strictly greater than 3, so the candidate stays 3.
3. i = 2: arr[2] is 6, which beats 3, so the candidate becomes 6.
4. i = 3: arr[3] is 1, which does not beat 6, so the candidate stays 6.
5. The scan is finished and the candidate holds 6.
6. Three comparisons were made for four elements, which is the n - 1 the analysis predicts.

<!-- @example -->

<!-- @input -->
arr = [-7, -2, -9]

<!-- @output -->
-2

<!-- @why -->
The all-negative array is the single test case that separates a correct seed from the max = 0 bug, and it is exactly the case that casual testing skips.

<!-- @walkthrough -->
1. Seed the candidate with arr[0], so it starts at -7.
2. i = 1: arr[1] is -2, which is greater than -7, so the candidate becomes -2.
3. i = 2: arr[2] is -9, which does not beat -2, so the candidate stays -2.
4. Return -2, which is an actual element of the array.
5. Now run the same input against a solution that seeds max = 0.
6. No element is greater than 0, so that version returns 0 — a value that never appears in the input.

<!-- @example -->

<!-- @input -->
arr = [5]

<!-- @output -->
5

<!-- @why -->
Proves the single-element case needs no guard at all, which is the payoff of seeding from arr[0] rather than looping from index 0.

<!-- @walkthrough -->
1. Seed the candidate with arr[0], so it holds 5.
2. The loop starts at i = 1 and the condition 1 < 1 is immediately false.
3. The body never runs and zero comparisons are performed.
4. Return 5, which was correct the moment it was seeded.
5. This is the for-loop rule from Basics doing real work: a loop whose condition starts false runs zero times, so no special case is needed.

<!-- @example -->

<!-- @input -->
An empty array, passed to each language's library call

<!-- @output -->
Three different failures — one of them silent

<!-- @why -->
The empty case is where the three languages diverge most sharply, and the C++ silent-success path is the one that reaches production undetected.

<!-- @walkthrough -->
1. Python evaluates max([]) and raises ValueError with the message 'max() iterable argument is empty'.
2. Java evaluates Arrays.stream(arr).max() to an empty OptionalInt, and getAsInt() then throws NoSuchElementException.
3. C++ evaluates max_element(begin, end) to end() itself, which is verified behaviour on an empty vector.
4. Dereferencing that iterator is undefined behaviour, and in practice it usually does not crash.
5. It reads whatever memory sits past the end of the container and returns it as a plausible-looking integer.
6. So two languages hand you a named exception and the third hands you a wrong answer that looks right.

<!-- @visualization array -->

<!-- @description -->
Two panels sharing one input, contrasting the work done. The SCAN panel draws the array as a horizontal strip of indexed cells with a champion badge floating above it. Seed the badge from cell 0 and tint that cell as the reigning champion. A pointer then advances one cell per frame, and on each step draw an explicit comparison arc between the pointed cell and the badge, labelled with the actual test — 3 > 3, 6 > 3 — colouring the arc red when it fails and green when it passes. On a pass, animate the value physically lifting out of the cell and into the badge, move the champion tint to the new cell, and increment a visible comparison counter. Cells behind the pointer dim to show the scanned region, and crucially the cells are NEVER reordered, because the scan performs no writes to the array at all. The SORT panel takes the same array and animates a full sort, letting cells swap positions, with its own comparison counter running alongside. Run both counters simultaneously so the divergence is watchable rather than asserted: for the four-element demo the scan ends on 3 while the sort ends around 5, and a scale readout beneath states the measured figures at one million elements — 999,999 against 22,224,069. Finish by greying out every sorted cell except the last to show, visually, how much computed order the sorting approach discards. A third small panel handles the all-negative array, running the correct arr[0] seed and a max = 0 seed side by side, so the wrong version visibly never updates and returns a value that is drawn nowhere in the array.

<!-- @sampleInput -->
```json
{"scan":{"array":[3,3,6,1],"seed":{"index":0,"value":3},"trace":[{"i":1,"value":3,"test":"3 > 3","passed":false,"champion":3},{"i":2,"value":6,"test":"6 > 3","passed":true,"champion":6},{"i":3,"value":1,"test":"1 > 6","passed":false,"champion":6}],"comparisons":3,"writesToArray":0,"answer":6},"sortContrast":{"array":[3,3,6,1],"comparisons":5,"elementsMoved":true,"discardedCells":[0,1,2]},"scaleReadout":{"n":1000000,"scanComparisons":999999,"sortComparisons":22224069,"ratio":22.2,"scanMs":0.573,"sortMs":32.866},"negativeDemo":{"array":[-7,-2,-9],"correctSeed":{"from":"arr[0]","value":-7,"answer":-2},"buggySeed":{"from":"0","value":0,"answer":0,"answerAppearsInArray":false}}}
```

<!-- @highlights -->
- The champion badge is seeded from cell 0, and that cell takes the champion tint — the candidate is a real element from the very first frame.
- The pointer moves to index 1 and a comparison arc is drawn to the badge, labelled 3 > 3.
- The arc turns red because the test is strictly greater-than and 3 does not beat 3; the badge does not move and the comparison counter reads 1.
- The pointer moves to index 2 and the arc reads 6 > 3, turning green.
- The value 6 lifts out of its cell into the badge, and the champion tint moves with it to cell 2.
- The pointer moves to index 3, the arc reads 1 > 6 and fails, and the counter finishes at 3 for four elements — the n - 1 the analysis predicts.
- Throughout the whole scan the cells never change position, because the algorithm performs zero writes to the array.
- The sort panel replays the same array with cells physically swapping, and its own counter climbs past the scan's.
- Every sorted cell except the last greys out, showing the ordering that was computed and then discarded.
- The scale readout resolves the contrast with measured figures at one million elements: 999,999 comparisons against 22,224,069, and 0.573ms against 32.866ms.
- The negative-array panel runs both seeds together on [-7, -2, -9].
- The arr[0] seed starts at -7, updates to -2, and returns a value drawn inside the array.
- The max = 0 seed never updates, and its badge returns 0 — a value that appears nowhere in the strip, which is drawn as an empty highlight off the end of the array.

<!-- @edgeCases -->
- Single-element array — the loop condition is false immediately, the body never runs, and the seed is already the answer.
- Empty array — the case that must be decided rather than discovered; C++ fails silently here while Java and Python raise named exceptions.
- All elements equal — the candidate never updates after seeding, which is correct rather than a missed update.
- All elements negative — the case that exposes a max = 0 seed, and the one most likely to be missing from hand-written tests.
- The maximum sitting at index 0 — the candidate is correct from the seed and no update ever fires.
- The maximum sitting at the last index — every comparison fails until the final one, the opposite update pattern.
- The maximum appearing more than once — the returned value is identical either way, since duplicates are equal by definition.
- An array containing the type's minimum value, such as INT_MIN, which is handled correctly by an arr[0] seed but breaks a sentinel seed set to that same minimum.
- Two elements only — the smallest input where the loop body actually executes, running exactly one comparison.
- A very large array where the sorting approach still returns the right answer but takes 57x longer, measured at n = 1,000,000.

<!-- @pitfalls -->
- Seeding the candidate with 0. It passes every positive test case and silently returns 0 for an all-negative array, which is not even an element of the input.
- Assuming the array is non-empty without saying so. In C++ this reads past the end and usually returns a plausible number instead of crashing.
- Sorting the caller's array in place. Verified in C++: the caller's [3,1,2] came back as [1,2,3], reordered by a function that was only asked to read it.
- Writing `biggest = arr.sort()` in Python. sort() mutates in place and returns None, so the variable holds None rather than the sorted list.
- Using arr[1:] to skip the first element in Python. It reads well but copies the tail of the list, turning an O(1)-space algorithm into an O(n)-space one.
- Reaching for sorting because it is two lines. It computes the full ordering of the input and then discards all but one element of it.
- Believing the hand-written loop is always the faster choice. Measured in Python it is 4x slower than max() at identical O(n), because the loop runs in the interpreter.
- Dereferencing the result of C++ max_element without comparing it to end() first. On an empty container that is undefined behaviour with no diagnostic.
- Calling getAsInt() on the OptionalInt from a Java stream without checking it. An empty stream throws NoSuchElementException at that point, not at max().
- Starting the loop at index 0 after seeding with arr[0]. It is harmless and correct, just one guaranteed-useless self-comparison.
- Using >= instead of >. It returns the same value here, but it latches the last maximum rather than the first, which silently changes the answer once the problem asks for an index.

<!-- @doubt -->
### Why do we start the loop at i = 1 instead of i = 0?

<!-- @answer -->
Because the candidate is already arr[0]. Starting at 0 compares arr[0] against itself, and that test can never be true, so it can never change anything. It is not a bug — just one comparison guaranteed to be wasted. Starting at 1 also makes the count come out at exactly n - 1, which is the provable minimum for this problem.

<!-- @doubt -->
### Why not just initialise max = 0?

<!-- @answer -->
Because 0 is not necessarily in the array. For [-7, -2, -9] every element is below 0, so nothing ever beats the candidate and you return 0 — a number that does not appear in the input at all. Seeding from arr[0] guarantees the candidate is a real element from the start, which is what makes the final answer provably a member of the array.

<!-- @doubt -->
### Sorting is only O(n log n). Is one pass really worth the trouble?

<!-- @answer -->
Measured at n = 1,000,000 on this machine: the scan does 999,999 comparisons and std::sort does 22,224,069, a 22.2x gap, and in wall-clock it is 0.573ms against 32.866ms — 57x, because sorting also moves elements while the scan only reads them. The gap widens with n, since it is roughly 1.1 * log2(n) rather than a fixed multiple. And sorting mutates the caller's array unless you pay for a copy. But the real reason is the habit: noticing that an order question does not require ordering is the skill this problem exists to teach.

<!-- @doubt -->
### Does it matter whether I use > or >=?

<!-- @answer -->
Not for the returned value. Tied elements are equal, so keeping the first or the last gives the same number. It matters for which occurrence you latch onto: > keeps the first maximum and >= keeps the last. That is invisible here and decisive the moment the problem asks for the index of the maximum instead of its value, so > is the habit worth forming now.

<!-- @doubt -->
### Should I just call max() or max_element() instead of writing the loop?

<!-- @answer -->
It depends on the language, and this is the one place the three genuinely diverge. In C++ the loop is free — max_element measured 0.638ms against 0.575ms for the hand loop, effectively identical, because they compile to the same thing. In Python the builtin is 4x FASTER at the same O(n): max() measured 10.179ms against 40.530ms, because max() is compiled C while your loop pays interpreter overhead on every element. So write the loop to learn the pattern and in an interview where the loop is the point, but call max() in real Python code.

<!-- @doubt -->
### What should happen if the array is empty?

<!-- @answer -->
That is your decision to make explicitly, and all three languages will punish you differently for skipping it. Python raises ValueError from max([]), Java throws NoSuchElementException when you unwrap the empty OptionalInt, and C++ returns end() from max_element — dereferencing which is undefined behaviour that usually does not crash and instead hands you a plausible wrong number. Reject the input, return a sentinel such as Python's max(arr, default=None), or document non-empty as a precondition. The C++ silent case is the reason this cannot be left to chance.

<!-- @doubt -->
### What if the largest element appears more than once?

<!-- @answer -->
Nothing changes at all. You are returning the value, not its position, and duplicates of the maximum are by definition equal to it. The strict > means the candidate latches onto the first occurrence and every later equal value leaves it alone, but since those values are identical the answer is the same either way.

<!-- @doubt -->
### Can this be done with recursion?

<!-- @answer -->
Yes: the largest of an array is the larger of its last element and the largest of everything before it. That performs the same n - 1 comparisons, but it adds a stack frame per element, so O(1) space becomes O(n) and a large array can exhaust the stack — which is the recursion-depth subtopic from Basics in action. The loop is strictly better here. The recursive framing earns its place later, in divide and conquer, where the split does real work.

<!-- @doubt -->
### Is there any way to beat O(n)?

<!-- @answer -->
No, and it can be proved rather than just asserted. Suppose an algorithm returns an answer without examining some element. Take the input it was given and raise that unexamined element above the reported maximum — the algorithm cannot behave differently, since it never looked, so it now returns a wrong answer. Every element must therefore be examined at least once, which is n - 1 comparisons, and the single pass already achieves exactly that. It is optimal, not merely good.
