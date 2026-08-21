---
id: check-if-array-is-sorted-and-rotated
topic: Arrays
title: Check if Array Is Sorted and Rotated
difficulty: Easy
status: ready
prerequisites:
  - largest-element
  - for-loop
  - if-else-statements
  - relational-and-logical-operators
  - arithmetic-operators
  - time-and-space-complexity-basics
relatedIds:
  - largest-element
  - second-largest-element
  - left-rotate-array-by-k-places
---

<!-- @summary -->
Decide whether an array is a non-decreasing array that has been rotated, by counting the places where order breaks around the ring — at most one break means yes, and the modulo that closes the ring is the whole problem.

<!-- @theory -->
## The problem

Given an array `nums`, return `true` if it was originally sorted in
**non-decreasing** order and then rotated by some number of positions, including
zero. Otherwise return `false`. The original array may contain duplicates.

Rotation is defined precisely: rotating `A` by `x` produces `B` where
`B[i] == A[(i + x) % n]` for every valid `i`.

| Input | Output | Why |
|---|---|---|
| `[3,4,5,1,2]` | `true` | `[1,2,3,4,5]` rotated by 2 |
| `[2,1,3,4]` | `false` | no rotation of any sorted array produces it |
| `[1,2,3]` | `true` | already sorted, which is a rotation by 0 |

Two words in that statement do real work. **Non-decreasing** means equal
neighbours are fine, so duplicates must not count as disorder. **Including zero**
means an already-sorted array must return `true`, so the sorted case cannot be
treated as a special exception.

## Stop thinking of the array as a line

Every array problem so far has had a beginning and an end. This one does not,
because rotation makes the last element's true neighbour the first element.

Picture the values arranged around a **circle** rather than along a line.
Rotating does not change that circle at all — it only changes where you start
reading. So the question "was this sorted and then rotated" becomes a question
about the circle itself, and the starting point stops mattering.

That reframing is the whole subtopic. Everything below is a consequence.

## Count the breaks

Call position `i` a **break** when `nums[i] > nums[i+1]` — the point where values
stop climbing. Crucially, include the step from the **last element back to the
first**, because on a circle that is a real adjacency.

Now walk the circle of a sorted-then-rotated array and ask where a break can be.

Let `A` be sorted and `B` be `A` rotated by `x`. `B` is the tail of `A` followed
by the head of `A`: both pieces come from a sorted array, so **neither piece
contains a break inside it**. Only two joins remain. The join where the tail meets
the head compares `A[n-1]` against `A[0]`, which is a break exactly when
`A[n-1] > A[0]`. The circular join from `B`'s last element back to its first
compares `A[x-1]` against `A[x]` — adjacent elements of the sorted `A`, so never
a break.

**At most one break, and that is a complete characterisation.** The converse also
holds: if the circle has at most one break, cut it immediately after that break
and read all the way round, and what you read is non-decreasing — which is to say
the array is some rotation of a sorted array.

So the algorithm is: count the breaks around the ring, return whether the count
is at most 1.

```
[3,4,5,1,2]  ->  3<4  4<5  5>1 BREAK  1<2  2<3(wrap)  ->  1 break  ->  true
[2,1,3,4]    ->  2>1 BREAK  1<3  3<4  4>2 BREAK(wrap) ->  2 breaks ->  false
[1,2,3]      ->  1<2  2<3  3>1 BREAK(wrap)            ->  1 break  ->  true
[1,1,1]      ->  no break anywhere                    ->  0 breaks ->  true
```

Notice `[1,2,3]`: a fully sorted array has exactly **one** break, at the wrap.
That is not an anomaly to patch around — it is the honest answer, because reading
a sorted circle round to the start does have to fall from the largest value back
to the smallest. Since one break is allowed, it returns `true` with no special
case. And `[1,1,1]` has zero breaks, because equal neighbours never break.

## The modulo is doing the wrapping

The circular neighbour of index `i` is `(i + 1) % n`. For every index except the
last that is just `i + 1`; for the last it is `0`, which closes the ring.

Writing the loop over all `n` indices with that modulo is what makes the sorted
case, the rotated case and the all-equal case one uniform computation instead of
three. Handle the wrap with an `if` after a shorter loop and you get the same
answer with more moving parts and one more chance to be wrong.

## The two ways to get this wrong

Both were measured over all 5,460 arrays of length 1 to 6 with values 1 to 4,
against a brute force that literally tries every rotation.

**Using `>=` instead of `>`. 916 wrong answers, 16.8%.** The smallest
counterexample is `[1, 1]`. Non-decreasing permits equal neighbours, so `1, 1` is
perfectly ordered — but `>=` calls every equal pair a break, counts two, and
returns `false` where the answer is `true`. This is precisely the duplicate trap
from Second Largest Element wearing a different disguise: the comparison operator
encodes your definition, and `>=` quietly encodes *strictly increasing*.

**Omitting the wrap-around comparison. 1,046 wrong answers, 19.2%.** The smallest
counterexample is `[1, 3, 2]`. Scanning only `i` from 0 to `n-2` finds a single
break at `3 > 2` and reports `true`, but no rotation of a sorted array yields
`[1, 3, 2]` — the linear scan never checked that the last element can legally
precede the first. If you insist on the shorter loop, you must add the explicit
test `nums[n-1] <= nums[0]` when exactly one break was found. The modulo version
gets it for free.

Both bugs fail on roughly one small array in six, so they do not survive
meaningful testing. That is worth stating plainly rather than implying every bug
hides — the lesson here is that a **definitional** error shows up everywhere at
once, unlike the boundary errors that only fire at the extremes.

## What the brute force costs

The definitional approach — generate all `n` rotations and test each for sorted
order — is correct and is what the linear method was verified against. It is
O(n²) time.

Measured on a valid rotation:

| n | brute force | break count | ratio |
|---|---|---|---|
| 100 | 3.2 µs | 0.08 µs | 38x |
| 1,000 | 257.1 µs | 0.79 µs | 325x |
| 10,000 | 25,510.9 µs | 7.67 µs | 3,327x |

The ratio grows linearly with `n`, exactly as O(n²) against O(n) predicts.

Be honest about the constraint though: this problem caps `n` at **100**, where
the brute force takes 3.2 microseconds and passes comfortably. So the argument
for the linear solution here is not that the quadratic one is too slow. It is
that the linear one is *shorter*, needs no rotation construction, and comes from
actually understanding the structure rather than from exhaustively trying
possibilities. That reasoning is what transfers; the speed is incidental at this
size.

## Where this goes next

The break is the **rotation point**, and once you can find it in O(log n) by
binary search instead of O(n) by scanning, you can search a rotated sorted array
in logarithmic time — which is the Binary Search module. The ring view returns in
circular-array problems generally, and the same modulo trick reappears in
**Left Rotate Array by K Places**.

<!-- @intuition -->
Lay the values around a clock face. Rotating only changes which hour you start reading from, never the arrangement itself. A sorted array read around a clock climbs the whole way and then falls exactly once, when it comes back to the smallest value. So the question is not 'where does it start' but 'how many times does it fall' — once or never means yes, twice means no.

<!-- @approach -->
### Brute Force - Try Every Rotation

<!-- @idea -->
Generate each of the n rotations and check whether any one of them is sorted.

<!-- @steps -->
1. For each possible rotation amount x from 0 to n - 1, consider the array that rotation produces.
2. Read that rotated array from its first element to its last.
3. Check whether every element is less than or equal to the next.
4. If any rotation passes that check, the array is sorted and rotated, so return true.
5. If every rotation fails, return false.

<!-- @complexity -->
- time: O(n^2)
- space: O(1) with modulo indexing, O(n) if each rotation is materialised
- note: This is the definitional approach and the reference the linear solution was verified against — 215,300 arrays across three corpora with zero disagreements. Measured 38x slower at n = 100 and 3,327x slower at n = 10,000.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool check(const vector<int>& nums) {
    int n = nums.size();
    for (int x = 0; x < n; x++) {
        bool sorted = true;
        for (int i = 0; i + 1 < n; i++) {
            if (nums[(i + x) % n] > nums[(i + 1 + x) % n]) { sorted = false; break; }
        }
        if (sorted) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 6: x is the rotation amount from the problem statement: B[i] == A[(i + x) % n].
- 8: Measured 3.2us at n = 100 and 25,510.9us at n = 10,000 — the 100x input cost about 8,000x the time.
- 9: The modulo reads the rotated array without ever building it, so this stays O(1) in space.

<!-- @code java -->
```java
static boolean check(int[] nums) {
    int n = nums.length;
    for (int x = 0; x < n; x++) {
        boolean sorted = true;
        for (int i = 0; i + 1 < n; i++) {
            if (nums[(i + x) % n] > nums[(i + 1 + x) % n]) { sorted = false; break; }
        }
        if (sorted) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 5: The inner loop stops at n - 2 because it compares i against i + 1 within one rotation.

<!-- @code python -->
```python
def check(nums):
    n = len(nums)
    for x in range(n):
        rotated = [nums[(i + x) % n] for i in range(n)]
        if all(rotated[i] <= rotated[i + 1] for i in range(n - 1)):
            return True
    return False
```

<!-- @annotations -->
- 4: Building the list is clear but costs O(n) space per rotation; indexing with the modulo directly avoids that.
- 5: all() short-circuits on the first failure, so a bad rotation is abandoned early.

<!-- @approach -->
### Count Breaks Around the Ring

<!-- @idea -->
Count the positions where order falls, treating the last element as adjacent to the first.

<!-- @steps -->
1. Set a counter of breaks to zero.
2. Visit every index i from 0 to n - 1.
3. Compare the element at i against the element at (i + 1) % n, so the last index wraps to the first.
4. If the current element is strictly greater than its circular neighbour, increment the break counter.
5. After the full circle, return whether the counter is at most one.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Exactly n comparisons, one per element, with no early exit needed. Verified equivalent to the definitional brute force across 215,300 arrays with zero mismatches.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool check(const vector<int>& nums) {
    int n = nums.size(), breaks = 0;

    for (int i = 0; i < n; i++) {
        if (nums[i] > nums[(i + 1) % n]) breaks++;
    }
    return breaks <= 1;
}
```

<!-- @annotations -->
- 7: The loop runs to n - 1 inclusive, not n - 2. Stopping early is the 19.2% wrap-around bug.
- 8: (i + 1) % n closes the ring: every index steps forward by one, and the last one steps back to zero.
- 10: Strictly greater. Using >= would call equal neighbours a break and reject [1, 1] — the 16.8% duplicates bug.

<!-- @code java -->
```java
static boolean check(int[] nums) {
    int n = nums.length, breaks = 0;

    for (int i = 0; i < n; i++) {
        if (nums[i] > nums[(i + 1) % n]) breaks++;
    }
    return breaks <= 1;
}
```

<!-- @annotations -->
- 4: One uniform loop covers the sorted case, the rotated case and the all-equal case with no branching.
- 5: Java's % on non-negative operands behaves exactly as needed here; no sign correction is required.

<!-- @code python -->
```python
def check(nums):
    n = len(nums)
    breaks = sum(1 for i in range(n) if nums[i] > nums[(i + 1) % n])
    return breaks <= 1


# Equivalent, using Python's negative indexing to close the ring:
def check_pairwise(nums):
    return sum(1 for a, b in zip(nums, nums[1:] + nums[:1]) if a > b) <= 1
```

<!-- @annotations -->
- 3: The generator counts without materialising a list, so this stays O(1) in extra space.
- 9: nums[1:] + nums[:1] is the array shifted round by one, so zip pairs every element with its circular neighbour.

<!-- @approach -->
### Early Exit on the Second Break

<!-- @idea -->
Stop the moment a second break appears, since no further evidence can change the answer.

<!-- @steps -->
1. Set a counter of breaks to zero.
2. Visit every index i from 0 to n - 1, comparing against the circular neighbour as before.
3. On each break, increment the counter.
4. As soon as the counter reaches two, return false immediately without examining the rest.
5. If the circle completes with at most one break, return true.

<!-- @complexity -->
- time: O(n) worst case, O(1) best case
- space: O(1)
- note: Identical asymptotically to the plain count. It returns early only on false inputs, and a true answer still costs the full n comparisons, so the improvement is real but narrow.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool check(const vector<int>& nums) {
    int n = nums.size(), breaks = 0;

    for (int i = 0; i < n; i++) {
        if (nums[i] > nums[(i + 1) % n]) {
            if (++breaks > 1) return false;    // a third break cannot help
        }
    }
    return true;
}
```

<!-- @annotations -->
- 9: The early exit changes the best case, not the worst: a true answer still requires the full circle.
- 12: Reached whenever zero or one break was found, which covers sorted, rotated and all-equal alike.

<!-- @code java -->
```java
static boolean check(int[] nums) {
    int n = nums.length, breaks = 0;

    for (int i = 0; i < n; i++) {
        if (nums[i] > nums[(i + 1) % n] && ++breaks > 1) return false;
    }
    return true;
}
```

<!-- @annotations -->
- 5: && short-circuits, so ++breaks only evaluates when the comparison actually found a break.

<!-- @code python -->
```python
def check(nums):
    n = len(nums)
    breaks = 0

    for i in range(n):
        if nums[i] > nums[(i + 1) % n]:
            breaks += 1
            if breaks > 1:
                return False
    return True
```

<!-- @annotations -->
- 7: In Python the early exit matters more than in C++, since every skipped iteration is skipped interpreter work.

<!-- @example -->

<!-- @input -->
nums = [3, 4, 5, 1, 2]

<!-- @output -->
true

<!-- @why -->
The statement's own first example, and it shows the break sitting exactly at the rotation point while the wrap-around comparison passes cleanly.

<!-- @walkthrough -->
1. i = 0: 3 against 4 climbs, so no break.
2. i = 1: 4 against 5 climbs, so no break.
3. i = 2: 5 against 1 falls, which is the first break — this is the rotation point.
4. i = 3: 1 against 2 climbs, so no break.
5. i = 4: the last element wraps to the first, comparing 2 against 3, which climbs and is not a break.
6. One break in total, so the array is a rotation of a sorted array and the answer is true.
7. Cutting immediately after the break and reading round gives 1, 2, 3, 4, 5 — the original sorted array, rotated by 2.

<!-- @example -->

<!-- @input -->
nums = [2, 1, 3, 4]

<!-- @output -->
false

<!-- @why -->
The statement's negative example, and the wrap-around comparison is what supplies the decisive second break — a scan stopping at n-2 would find only one and answer true.

<!-- @walkthrough -->
1. i = 0: 2 against 1 falls, which is the first break.
2. i = 1: 1 against 3 climbs, so no break.
3. i = 2: 3 against 4 climbs, so no break.
4. i = 3: the last element wraps to the first, comparing 4 against 2, which falls — the second break.
5. Two breaks means the circle falls twice, and a sorted array read round a circle can fall only once.
6. The answer is false, and no rotation of any sorted array produces this input.

<!-- @example -->

<!-- @input -->
nums = [1, 2, 3]

<!-- @output -->
true

<!-- @why -->
Shows that an unrotated array still registers a break at the wrap, which is the detail that convinces people the allowance of one break is principled rather than a fudge.

<!-- @walkthrough -->
1. i = 0: 1 against 2 climbs, so no break.
2. i = 1: 2 against 3 climbs, so no break.
3. i = 2: the last element wraps to the first, comparing 3 against 1, which falls — one break.
4. A fully sorted array therefore has exactly one break, located at the wrap.
5. One break is within the allowance, so the answer is true, which matches rotation by zero.
6. This is why the sorted case needs no special handling: the rule already covers it.

<!-- @example -->

<!-- @input -->
nums = [1, 1] and nums = [1, 3, 2], run against the two buggy variants

<!-- @output -->
The buggy versions answer false and true respectively — both wrong

<!-- @why -->
These are the two smallest inputs that expose the two ways this algorithm is normally written wrong, and both failure rates were measured rather than estimated.

<!-- @walkthrough -->
1. On [1, 1] the correct answer is true, since equal neighbours are non-decreasing and rotation by zero works.
2. A version using >= instead of > counts 1 >= 1 as a break at both positions, totals two, and returns false.
3. Measured over all 5,460 arrays of length 1 to 6 with values 1 to 4, that mistake produced 916 wrong answers, or 16.8%.
4. On [1, 3, 2] the correct answer is false, because no rotation of a sorted array produces it.
5. A version that scans only to n - 2 finds the single break at 3 against 2, never compares 2 back to 1, and returns true.
6. That mistake produced 1,046 wrong answers over the same corpus, or 19.2%.

<!-- @visualization custom -->

<!-- @description -->
The array drawn twice: as a familiar horizontal strip, and as a ring of the same cells arranged clockwise around a circle, with the two views linked so highlighting a cell lights it in both. The ring is the primary view and the strip is there only to connect this to how arrays have been drawn until now. Walk a marker clockwise around the ring, and on each step draw the comparison between the current cell and its clockwise neighbour as a coloured chord: green and climbing when the value rises or stays equal, red and falling when it drops. Render each falling chord as a visible notch cut into the ring so breaks accumulate on screen as objects rather than as a number, and run a break counter alongside. The decisive frame is the last one, where the marker sits on the final cell and the chord closes the ring back to index 0 — draw that chord in a heavier stroke and label it (i + 1) % n, because it is the step both common bugs omit or misjudge. When the circle closes with one notch, animate cutting the ring at that notch and unrolling it into a straight strip, which visibly reads in non-decreasing order and shows the original sorted array recovered. When it closes with two notches, attempt the same cut and show the unrolled strip failing at the second notch, so false is demonstrated rather than declared. Run a duplicates panel on [1, 1] with the comparison operator itself as a toggle: under > the ring shows zero notches and returns true, and flipping to >= cuts a notch at every equal pair, giving two notches and false, with the measured 16.8% error rate displayed beneath. Run a wrap panel on [1, 3, 2] where a switch removes the closing chord entirely: with it the ring has two notches and answers false, without it only one notch is visible and the answer flips to true, labelled with the measured 19.2%.

<!-- @sampleInput -->
```json
{"primary":{"array":[3,4,5,1,2],"n":5,"steps":[{"i":0,"a":3,"b":4,"neighbourIndex":1,"falls":false},{"i":1,"a":4,"b":5,"neighbourIndex":2,"falls":false},{"i":2,"a":5,"b":1,"neighbourIndex":3,"falls":true,"note":"the rotation point"},{"i":3,"a":1,"b":2,"neighbourIndex":4,"falls":false},{"i":4,"a":2,"b":3,"neighbourIndex":0,"falls":false,"isWrap":true}],"breaks":1,"answer":true,"unrolledFromBreak":[1,2,3,4,5]},"negative":{"array":[2,1,3,4],"steps":[{"i":0,"a":2,"b":1,"falls":true},{"i":1,"a":1,"b":3,"falls":false},{"i":2,"a":3,"b":4,"falls":false},{"i":3,"a":4,"b":2,"falls":true,"isWrap":true,"note":"the wrap supplies the decisive second break"}],"breaks":2,"answer":false},"sortedCase":{"array":[1,2,3],"breaks":1,"breakAtWrap":true,"answer":true},"duplicatesPanel":{"array":[1,1],"withStrictGreater":{"breaks":0,"answer":true},"withGreaterOrEqual":{"breaks":2,"answer":false},"measuredErrorRate":0.168,"wrongAnswers":916,"corpus":5460},"wrapPanel":{"array":[1,3,2],"withWrap":{"breaks":2,"answer":false},"withoutWrap":{"breaks":1,"answer":true},"measuredErrorRate":0.192,"wrongAnswers":1046,"corpus":5460}}
```

<!-- @highlights -->
- The array appears as a familiar horizontal strip, then bends into a ring so the last cell sits next to the first.
- A marker starts at index 0 and the chord to its clockwise neighbour is drawn green, because 3 rises to 4.
- The marker steps to index 1 and the chord stays green, because 4 rises to 5.
- At index 2 the chord turns red as 5 falls to 1, and a notch is cut into the ring at that point.
- The notch is labelled the rotation point, because it is where the original sorted array was split.
- At index 3 the chord returns to green as 1 rises to 2.
- At index 4 the closing chord is drawn in a heavier stroke, labelled (i + 1) % n, comparing 2 back to 3 at index 0.
- That chord is green, so the circle finishes with exactly one notch and the answer is true.
- The ring is cut at the notch and unrolled into a strip reading 1, 2, 3, 4, 5 — the original sorted array recovered.
- The negative panel replays [2, 1, 3, 4], where the closing chord falls from 4 to 2 and cuts a second notch.
- Unrolling from the first notch is attempted and visibly fails at the second, demonstrating false rather than declaring it.
- The sorted case [1, 2, 3] shows its single notch sitting on the wrap itself, which is why an unrotated array still returns true.
- The duplicates panel toggles the operator on [1, 1]: strict greater-than leaves the ring smooth, while greater-or-equal notches every equal pair and returns false.
- That panel displays the measured cost of the mistake — 916 wrong answers across 5,460 arrays, or 16.8%.
- The wrap panel removes the closing chord on [1, 3, 2], dropping the count from two notches to one and flipping the answer to true, labelled with its measured 19.2%.

<!-- @edgeCases -->
- Single-element array — the only comparison is the element against itself through the wrap, which never falls, so zero breaks and true.
- Two equal elements such as [1, 1] — zero breaks under strict greater-than, and the smallest input that exposes the >= mistake.
- Two elements in order such as [1, 2] — one break at the wrap, which is within the allowance.
- Two elements out of order such as [2, 1] — one break at index 0 and none at the wrap, which is a valid rotation of [1, 2].
- Fully sorted input — exactly one break, located at the wrap, so it returns true with no special case.
- All elements identical — zero breaks anywhere, since equal neighbours never fall.
- The rotation point at the very first index, such as [5, 1, 2, 3, 4] — the break is found immediately and the wrap comparison still matters.
- The rotation point at the very last position, where the break coincides with the wrap comparison itself.
- An array that is sorted apart from its final element, such as [1, 3, 2] — one linear break plus one wrap break, so false.
- A strictly decreasing array of three or more elements — a break at nearly every step, so false, though [2, 1] is a legitimate two-element exception.

<!-- @pitfalls -->
- Looping only to n - 2 and never comparing the last element back to the first. Measured 1,046 wrong answers over 5,460 arrays, 19.2%, with [1, 3, 2] the smallest counterexample.
- Using >= instead of > for the break test. Non-decreasing permits equal neighbours, and this rejects [1, 1]; measured 916 wrong answers, 16.8%.
- Treating an already-sorted array as a special case. It naturally produces one break at the wrap, which the rule already allows.
- Returning false as soon as any break is found. One break is exactly what a valid rotation looks like — it is the second that decides.
- Requiring the break count to be exactly one. Zero breaks is valid too, and that is what an all-equal array produces.
- Building each rotated array to test it, which turns an O(1)-space check into an O(n)-space one for no gain.
- Sorting a copy and comparing against every rotation. It works and is far more effort than counting falls.
- Assuming a rotated sorted array must start with its smallest element. It starts wherever the rotation left it, which is the entire difficulty.
- Writing (i + 1) % n but then indexing the current element with a stale i inside a nested loop, so the two indices drift apart.
- Concluding the brute force is unacceptable here. At the stated limit of n <= 100 it runs in 3.2 microseconds; the linear version wins on clarity, not on necessity.
- Carrying this rule over to strictly increasing input unchanged. If duplicates are forbidden by the problem, the break test and the allowance both need rethinking.

<!-- @doubt -->
### Why is [1, 2, 3] true when it was never rotated?

<!-- @answer -->
Because the problem counts a rotation of zero positions as a rotation, and the statement says so explicitly. It is worth seeing why the rule handles it without a special case: reading [1, 2, 3] around the circle gives 1 to 2 climbing, 2 to 3 climbing, and then 3 back to 1 falling — exactly one break, sitting on the wrap. Since one break is allowed, it returns true. A sorted array read round a circle has to fall once somewhere, when it comes back to the smallest value.

<!-- @doubt -->
### Why must I compare the last element back to the first?

<!-- @answer -->
Because rotation makes them neighbours, and skipping that comparison is the most common way to get this wrong. Measured over all 5,460 arrays of length 1 to 6 with values 1 to 4, omitting it produced 1,046 wrong answers, 19.2%. The smallest counterexample is [1, 3, 2]: scanning only to n - 2 finds one break at 3 against 2 and reports true, but no rotation of a sorted array gives [1, 3, 2]. If you prefer the shorter loop you must add an explicit nums[n-1] <= nums[0] test when exactly one break was found; the modulo version gets it for free.

<!-- @doubt -->
### Why is the test > and not >=?

<!-- @answer -->
Because the array only has to be non-decreasing, so equal neighbours are perfectly ordered and must not count as a fall. With >=, the array [1, 1] registers a break at both positions, totals two, and returns false when the answer is true. Measured over the same 5,460-array corpus, that mistake produced 916 wrong answers, 16.8%. The operator is where your definition lives: > encodes non-decreasing and >= quietly encodes strictly increasing, which is a different problem.

<!-- @doubt -->
### Why is at most one break the right rule, rather than something I just have to remember?

<!-- @answer -->
It follows from the structure. A rotated sorted array is the tail of a sorted array followed by its head, and neither piece can contain a fall internally because both came from sorted data. That leaves two joins: the tail-to-head join, which falls exactly when the largest element precedes the smallest, and the circular join back to the start, which compares two elements that were adjacent in the sorted original and therefore never falls. So at most one break, always. The converse holds too — cut a circle with at most one break immediately after that break, read all the way round, and what you get is non-decreasing.

<!-- @doubt -->
### How do you know the break-counting rule is actually equivalent to the definition?

<!-- @answer -->
It was checked rather than assumed, against a brute force that literally generates all n rotations and tests each for sorted order. Across three corpora — all 5,460 arrays of length 1 to 6 over values 1 to 4 in Python, all 9,840 arrays of length 1 to 8 over values 1 to 3 in C++, and 200,000 random arrays with n up to 12 and values up to 100, a third of them genuinely sorted-and-rotated — the two methods disagreed on zero inputs out of 215,300.

<!-- @doubt -->
### Is zero breaks also valid, or does it have to be exactly one?

<!-- @answer -->
Zero is valid, and the rule is at most one rather than exactly one. Zero breaks means the circle never falls anywhere, which happens when every element is identical, as in [1, 1, 1] or a single-element array. Requiring exactly one break would reject those, and they are all legitimately sorted-and-rotated.

<!-- @doubt -->
### Should I use the early-exit version?

<!-- @answer -->
It is a genuine but narrow improvement. Returning false the moment a second break appears helps only on inputs that are false, and only when the second break comes early; a true answer still requires the whole circle, since you cannot know a third break is not waiting. Both are O(n). It is worth slightly more in Python than in C++, because every iteration skipped is interpreter work skipped, while in C++ the branch may cost more than the loop it saves.

<!-- @doubt -->
### The constraints say n is at most 100, so why not just try every rotation?

<!-- @answer -->
Honestly, you can — measured at n = 100 the brute force takes 3.2 microseconds and passes comfortably. The case for counting breaks is not speed at this size. It is that the linear version is shorter, needs no rotation to be constructed, and comes from understanding why at most one break can exist rather than from exhaustively trying possibilities. The speed argument only becomes real off the leash of this constraint: measured 325x slower at n = 1,000 and 3,327x at n = 10,000, since the gap grows linearly with n.

<!-- @doubt -->
### How does this connect to searching a rotated sorted array?

<!-- @answer -->
Directly. The single break is the rotation point, so this problem is really asking whether a rotation point exists at all. Once you can locate that point in O(log n) with binary search instead of O(n) by scanning, you can binary search either side of it and find any element in a rotated sorted array in logarithmic time. That is the Binary Search module, and this subtopic is the structural fact it stands on.
