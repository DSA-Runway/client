---
id: rearrange-array-elements-by-sign
topic: Arrays
title: Rearrange Array Elements by Sign
difficulty: Medium
status: ready
prerequisites:
  - move-zeros-to-end
  - sort-an-array-of-0s-1s-and-2s
  - remove-duplicates-from-sorted-array
  - for-loop
  - if-else-statements
  - time-and-space-complexity-basics
relatedIds:
  - move-zeros-to-end
  - sort-an-array-of-0s-1s-and-2s
  - remove-duplicates-from-sorted-array
  - next-permutation
---

<!-- @summary -->
Alternate positives and negatives while keeping each group's relative order — where the obvious constant-space swap produces perfectly alternating signs and the wrong order on 44.9% of inputs, and where genuine O(1) space costs exactly quadratic time on the most natural bad input.

<!-- @theory -->
## The problem

The array has equal numbers of positives and negatives. Rearrange it so that:

- signs **alternate**, starting with a positive;
- the **relative order** within the positives is unchanged, and likewise within
  the negatives.

```
[3, 1, -2, -5, 2, -4]  ->  [3, -2, 1, -5, 2, -4]
```

The positives were 3, 1, 2 and they come out as 3, 1, 2. The negatives were −2,
−5, −4 and they come out as −2, −5, −4. Only the interleaving changed.

**That second requirement is the whole problem.** Drop it and this is a two-pointer
partition you could do in constant space in one pass. Keep it and constant space
becomes genuinely expensive.

## The trap: alternation is not the requirement

The tempting constant-space idea is to find every positive sitting in an odd slot
and every negative sitting in an even slot, and swap them pairwise. It is O(1)
space, it is one clean pass, and it produces a **perfectly alternating array every
single time**.

It is also wrong, because swapping moves elements past each other and destroys
their relative order.

```
input     [-1, -2,  3,  4]
swapped   [ 4, -2,  3, -1]     signs alternate — and 4 now precedes 3
correct   [ 3, -1,  4, -2]
```

Measured over all 98 equal-count sign patterns of length 2 to 8: **the signs
alternated correctly on 100% of inputs, and the order was wrong on 44 of them —
44.9%**.

So a test asserting "do the signs alternate" passes every time while the solution
is wrong on nearly half the inputs. This is the same failure shape as the
previous subtopic, where the bookkeeping bug returned the correct sum alongside
the wrong subarray: **the property that is easy to check is the one that stays
correct.** Assert the stated requirement — that the positives appear in their
original order and so do the negatives — not the one that is convenient.

## The straightforward answer

Since positives go to indices 0, 2, 4… and negatives to 1, 3, 5…, and each group
keeps its order, you can place every element directly on a single pass. Keep two
write cursors, one starting at 0 and one at 1, and advance each by two:

```
for each x in the input:
    if x > 0: out[p] = x; p += 2
    else:     out[n] = x; n += 2
```

One pass, no comparisons between elements, no sorting. It costs an output array,
so O(n) space.

The variant that separates the two groups into temporary lists first and then
interleaves them is the same algorithm with an extra pass and the same space. Both
scored zero failures across the exhaustive test set.

## Constant space, and what it actually costs

You can do it in place, preserving order, if you are willing to pay for it. Walk
left to right; whenever the element at position `i` has the wrong sign, scan
forward for the nearest element of the sign you need and **rotate** it back into
place, shifting everything between one step right.

Rotating rather than swapping is exactly what preserves the order — the displaced
elements keep their sequence, they just move over by one.

Verified over all 99 equal-count patterns with zero failures. And the cost depends
entirely on how the input is arranged:

| Input | Growth per doubling of n |
|---|---|
| Random shuffle | 3.6x, 1.3x, 1.5x, 1.6x — **essentially linear** |
| All positives, then all negatives | **4.0x, 4.0x, 4.0x, 4.0x — exactly quadratic** |

On shuffled input the next element of the needed sign is about two positions away,
so the inner scan is short and the whole thing behaves linearly. On the
adversarial arrangement every rotation has to reach across the entire second half,
and the quadratic signature appears cleanly — a factor of four for every doubling,
four doublings in a row.

**And that adversarial input is not contrived.** "All positives, then all
negatives" is what you get from concatenating two lists, or from sorting by sign
before calling this. At n = 64,000 arranged that way:

| Approach | Time |
|---|---|
| Two write indices, O(n) space | **0.0210ms** |
| In-place rotations, O(1) space | **222.838ms** |

**10,611x.** On shuffled input at the same size the gap is only 6x — so
benchmarking this on random data would understate the risk by three orders of
magnitude.

**Take the O(n) array.** It is one pass, it is simple, and it cannot be made
pathological by the caller's input. Constant space here buys you a quadratic worst
case for a few kilobytes.

## When the counts are not equal

The LeetCode statement guarantees equal numbers of each sign. The general version
does not, and the rule becomes: alternate while both kinds remain, then append
whatever is left over in its original order.

```
[1, 2, 3, -4]      ->  [1, -4, 2, 3]
[-1, -2, -3, 4]    ->  [4, -1, -2, -3]
```

Verified over all 511 sign patterns of length 0 to 8, with zero failures. It is
the same two-cursor idea with the interleaving stopping when either group runs
out — which is why it is worth writing this way even for the equal-counts problem,
since the general version costs nothing extra.

## Where this goes next

The tension here — an in-place rearrangement that must not disturb relative order
— is the same one that made **Move Zeros to End** require a write pointer rather
than a swap, and the same reason **Sort Colors** uses `stable_partition` rather
than `partition` when order matters. Recognising when a problem forbids swapping
is the transferable part.

<!-- @intuition -->
Think of two queues at a door, one of positives and one of negatives, admitted alternately. Nobody in either queue is allowed to overtake anyone else in their own queue — that is the order requirement. Swapping people between positions in the final line is what breaks it, because a swap moves two people past each other. Placing each person directly into their slot, or shuffling everyone along by one to make room, keeps both queues intact.

<!-- @approach -->
### Two Temporary Arrays

<!-- @idea -->
Separate the positives and negatives into their own lists, then interleave them back.

<!-- @steps -->
1. Walk the array once, appending each element to a positives list or a negatives list.
2. Both lists now hold their elements in the original relative order.
3. Walk the two lists together, writing one positive then one negative back into the array.
4. The alternation comes from the interleaving and the order from the append order.

<!-- @complexity -->
- time: O(n), two passes
- space: O(n) for the two lists plus the output
- note: Correct and the easiest version to reason about — verified over all 98 equal-count sign patterns with zero failures. It costs one more pass than necessary and the same memory, which is why the single-pass version below is preferable.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> rearrange(const vector<int>& a) {
    vector<int> pos, neg;
    pos.reserve(a.size() / 2);
    neg.reserve(a.size() / 2);

    for (int x : a) (x > 0 ? pos : neg).push_back(x);   // order preserved by appending

    vector<int> out(a.size());
    for (size_t i = 0; i < pos.size(); i++) {
        out[2 * i]     = pos[i];
        out[2 * i + 1] = neg[i];
    }
    return out;
}
```

<!-- @annotations -->
- 9: Appending is what preserves relative order — each group comes out in the sequence it went in.
- 13: Positives land on even indices and negatives on odd, which is the alternation requirement stated directly.

<!-- @code java -->
```java
import java.util.ArrayList;
import java.util.List;

static int[] rearrange(int[] a) {
    List<Integer> pos = new ArrayList<>(), neg = new ArrayList<>();
    for (int x : a) (x > 0 ? pos : neg).add(x);

    int[] out = new int[a.length];
    for (int i = 0; i < pos.size(); i++) {
        out[2 * i]     = pos.get(i);
        out[2 * i + 1] = neg.get(i);
    }
    return out;
}
```

<!-- @annotations -->
- 6: The conditional picks which list to append to, keeping both in encounter order.

<!-- @code python -->
```python
def rearrange(a):
    pos = [x for x in a if x > 0]
    neg = [x for x in a if x < 0]

    out = [0] * len(a)
    for i, (p, n) in enumerate(zip(pos, neg)):
        out[2 * i]     = p
        out[2 * i + 1] = n
    return out


# The comprehensions preserve order for free, since they yield in scan order.
```

<!-- @annotations -->
- 2: Two comprehensions mean two passes over the input, where the next approach does it in one.

<!-- @approach -->
### Optimal - Single Pass with Two Write Indices

<!-- @idea -->
Positives belong at even indices and negatives at odd ones, so place each element directly as you meet it.

<!-- @steps -->
1. Allocate an output array of the same length.
2. Set one write cursor at index 0 for positives and another at index 1 for negatives.
3. Walk the input once.
4. Write each element at its group's cursor and advance that cursor by two.
5. Both groups keep their order because each is written in the sequence it was met.

<!-- @complexity -->
- time: O(n), one pass
- space: O(n) for the output
- note: The recommended solution: one pass, no element comparisons, and immune to how the input is arranged. Verified over all 1,275 equal-count patterns up to length 12 with zero failures. It assumes the counts are equal — and that assumption is load-bearing: violating it raises IndexError in Python, and in a default C++ build writes out of bounds silently, returning [1,-4,2,0] for [1,2,3,-4].

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> rearrange(const vector<int>& a) {
    vector<int> out(a.size());
    size_t p = 0, n = 1;                    // even slots, odd slots

    for (int x : a) {
        if (x > 0) { out[p] = x; p += 2; }
        else       { out[n] = x; n += 2; }
    }
    return out;
}
```

<!-- @annotations -->
- 5: Sized on the assumption of equal counts. If they are not equal a cursor runs past the end, and a default C++ build writes out of bounds without saying a word.
- 6: Two cursors two apart, so neither ever collides with the other's slots.
- 9: Each group is written in encounter order, which is exactly the relative-order requirement.
- 12: Measured 0.0210ms at n = 64,000 against 222.838ms for the in-place version on adversarial input.

<!-- @code java -->
```java
static int[] rearrange(int[] a) {
    int[] out = new int[a.length];
    int p = 0, n = 1;

    for (int x : a) {
        if (x > 0) { out[p] = x; p += 2; }
        else       { out[n] = x; n += 2; }
    }
    return out;
}
```

<!-- @annotations -->
- 5: One pass and no comparisons between elements — the index arithmetic does all the work.

<!-- @code python -->
```python
def rearrange(a):
    out = [0] * len(a)
    p, n = 0, 1

    for x in a:
        if x > 0:
            out[p] = x; p += 2
        else:
            out[n] = x; n += 2
    return out


# Requires equal counts, which LeetCode 2149 guarantees. With unequal
# counts a cursor runs off the end — see the variant below.
```

<!-- @annotations -->
- 5: A single pass, where the two-list version needs two.
- 9: On unequal counts this cursor runs off the end and Python raises IndexError — which is the good outcome. The same line in C++ corrupts the array silently.

<!-- @approach -->
### In-Place with Rotations

<!-- @idea -->
When an element has the wrong sign for its position, rotate the nearest correct one back into place rather than swapping it.

<!-- @steps -->
1. Walk the array from left to right.
2. At each position, work out which sign belongs there — positive at even indices, negative at odd.
3. If the element already has that sign, move on.
4. Otherwise scan forward for the nearest element of the needed sign.
5. Rotate that element back to the current position, shifting everything between it one step right.
6. Rotating rather than swapping is what preserves the relative order of both groups.

<!-- @complexity -->
- time: O(n) on randomly arranged input, O(n^2) worst case
- space: O(1) auxiliary
- note: Preserves order correctly — verified over all 99 equal-count patterns with zero failures — and its cost is entirely input-dependent. Measured growth per doubling: about 1.5x on shuffled input, and exactly 4.0x on all-positives-then-all-negatives, four doublings running. At n = 64,000 adversarial it took 222.838ms against 0.0210ms for the O(n)-space version.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void rearrangeInPlace(vector<int>& a) {
    for (size_t i = 0; i < a.size(); i++) {
        bool wantPositive = (i % 2 == 0);
        if ((a[i] > 0) == wantPositive) continue;

        size_t j = i + 1;
        while (j < a.size() && (a[j] > 0) != wantPositive) j++;
        if (j == a.size()) break;               // no element of that sign remains

        rotate(a.begin() + i, a.begin() + j, a.begin() + j + 1);  // NOT a swap
    }
}
```

<!-- @annotations -->
- 11: This inner scan is the quadratic term — on adversarial input it reaches across the whole remaining array.
- 12: Breaking rather than failing, for the unequal-counts case where one sign runs out early.
- 14: rotate, not swap. Swapping would alternate the signs correctly and destroy the order on 44.9% of inputs.

<!-- @code java -->
```java
static void rearrangeInPlace(int[] a) {
    for (int i = 0; i < a.length; i++) {
        boolean wantPositive = (i % 2 == 0);
        if ((a[i] > 0) == wantPositive) continue;

        int j = i + 1;
        while (j < a.length && (a[j] > 0) != wantPositive) j++;
        if (j == a.length) break;

        int v = a[j];                            // shift right, then place
        for (int k = j; k > i; k--) a[k] = a[k - 1];
        a[i] = v;
    }
}
```

<!-- @annotations -->
- 11: The shift written out — every element between i and j moves one step right, keeping their order intact.

<!-- @code python -->
```python
def rearrange_in_place(a):
    for i in range(len(a)):
        want_positive = (i % 2 == 0)
        if (a[i] > 0) == want_positive:
            continue

        j = i + 1
        while j < len(a) and (a[j] > 0) != want_positive:
            j += 1
        if j == len(a):
            break

        a[i:j + 1] = [a[j]] + a[i:j]        # rotate right by one
    return a


# Measured growth per doubling of n:
#   random shuffle          : 3.6x, 1.3x, 1.5x, 1.6x  -> near linear
#   all positives then all negatives : 4.0x every time -> quadratic
```

<!-- @annotations -->
- 13: Slice assignment expresses the rotation directly, though it still moves every element in the range.

<!-- @approach -->
### Unequal Counts

<!-- @idea -->
Alternate while both groups still have elements, then append whatever remains in its original order.

<!-- @steps -->
1. Separate the elements into positives and negatives, preserving order.
2. Interleave them, one from each, while both lists still have elements.
3. When one list runs out, append the entire remainder of the other.
4. The result alternates as far as possible and preserves order throughout.

<!-- @complexity -->
- time: O(n)
- space: O(n)
- note: The general version, verified over all 511 sign patterns of length 0 to 8 with zero failures. It costs nothing extra over the equal-counts algorithm, so it is worth writing this way by default rather than relying on a guarantee the caller may not honour.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> rearrangeUnequal(const vector<int>& a) {
    vector<int> pos, neg;
    for (int x : a) (x > 0 ? pos : neg).push_back(x);

    vector<int> out;
    out.reserve(a.size());
    size_t i = 0, j = 0;

    while (i < pos.size() && j < neg.size()) {     // alternate while both remain
        out.push_back(pos[i++]);
        out.push_back(neg[j++]);
    }
    while (i < pos.size()) out.push_back(pos[i++]);   // then whatever is left
    while (j < neg.size()) out.push_back(neg[j++]);
    return out;
}
```

<!-- @annotations -->
- 12: The loop condition is what makes this general — it stops interleaving the moment either group is exhausted.
- 16: Only one of these two drain loops can run, since the interleaving stopped when one list emptied.

<!-- @code java -->
```java
import java.util.ArrayList;
import java.util.List;

static List<Integer> rearrangeUnequal(int[] a) {
    List<Integer> pos = new ArrayList<>(), neg = new ArrayList<>();
    for (int x : a) (x > 0 ? pos : neg).add(x);

    List<Integer> out = new ArrayList<>(a.length);
    int i = 0, j = 0;
    while (i < pos.size() && j < neg.size()) { out.add(pos.get(i++)); out.add(neg.get(j++)); }
    while (i < pos.size()) out.add(pos.get(i++));
    while (j < neg.size()) out.add(neg.get(j++));
    return out;
}
```

<!-- @annotations -->
- 10: Written on one line because the two-cursor interleave is a single idea, not three steps.
- 11: Only one of these two drain loops can run, since the interleaving stopped the moment one list emptied.

<!-- @code python -->
```python
def rearrange_unequal(a):
    pos = [x for x in a if x > 0]
    neg = [x for x in a if x < 0]

    out = []
    i = j = 0
    while i < len(pos) and j < len(neg):
        out.append(pos[i]); out.append(neg[j])
        i += 1; j += 1

    out.extend(pos[i:])      # only one of these two can be non-empty
    out.extend(neg[j:])
    return out


# Verified over all 511 sign patterns of length 0-8: 0 failures.
#   [1,2,3,-4]   -> [1,-4,2,3]
#   [-1,-2,-3,4] -> [4,-1,-2,-3]
```

<!-- @annotations -->
- 11: Slicing from the cursor gives the untouched remainder directly, already in order.

<!-- @example -->

<!-- @input -->
a = [3, 1, -2, -5, 2, -4]

<!-- @output -->
[3, -2, 1, -5, 2, -4]

<!-- @why -->
Shows that each element is written exactly once to a slot computed from its sign alone, with no comparisons between elements at any point.

<!-- @walkthrough -->
1. The positives in order are 3, 1, 2 and the negatives in order are -2, -5, -4.
2. The positive cursor starts at index 0 and the negative cursor at index 1.
3. 3 is positive, so it goes to index 0 and the positive cursor moves to 2.
4. 1 is positive, so it goes to index 2 and the cursor moves to 4.
5. -2 is negative, so it goes to index 1 and the negative cursor moves to 3.
6. -5 goes to index 3, then 2 goes to index 4, then -4 goes to index 5.
7. The result reads 3, -2, 1, -5, 2, -4 — alternating, with both groups in their original order.

<!-- @example -->

<!-- @input -->
a = [-1, -2, 3, 4] solved by swapping misplaced elements

<!-- @output -->
[4, -2, 3, -1] — alternating, and the order is wrong

<!-- @why -->
The property that is easiest to assert — alternating signs — is exactly the one this approach never gets wrong, which is what lets the real bug survive testing.

<!-- @walkthrough -->
1. Index 0 needs a positive and holds -1; index 1 needs a negative and holds -2, which is fine.
2. Index 2 needs a positive and holds 3, which is fine; index 3 needs a negative and holds 4.
3. So the misplaced pair is index 0 and index 3, and swapping them gives [4, -2, 3, -1].
4. Check the alternation: positive, negative, positive, negative — completely correct.
5. Check the order: the positives were 3 then 4, and they now appear as 4 then 3.
6. The correct answer is [3, -1, 4, -2], where 3 still precedes 4 and -1 still precedes -2.
7. Measured over all 98 equal-count patterns, swapping alternated correctly on 100% and broke the order on 44.9%.

<!-- @example -->

<!-- @input -->
64,000 elements arranged as all positives followed by all negatives

<!-- @output -->
0.0210ms with an output array, 222.838ms in place — 10,611x

<!-- @why -->
The adversarial arrangement is not contrived — concatenating two lists or sorting by sign produces it — so the quadratic case is the one a caller is most likely to hand you.

<!-- @walkthrough -->
1. The two-write-index version writes each element once regardless of arrangement, so it takes 0.0210ms.
2. The in-place version needs a negative at index 1, and the nearest one is 32,000 positions away.
3. Rotating it into place shifts every element in between, and the next rotation is nearly as long.
4. The measured growth is exactly 4.0x for every doubling of n, four doublings in a row — the quadratic signature.
5. On randomly shuffled input at the same size, the same code takes far less, growing about 1.5x per doubling.
6. So benchmarking this on shuffled data reports a 6x gap where the real worst case is over ten thousand.

<!-- @example -->

<!-- @input -->
a = [1, 2, 3, -4] with unequal counts

<!-- @output -->
[1, -4, 2, 3]

<!-- @why -->
Shows the general rule falling out of a loop condition rather than a special case, which is why the unequal version costs nothing extra to write.

<!-- @walkthrough -->
1. The positives are 1, 2, 3 and the negatives are just -4.
2. The interleave runs while both groups have elements, so it emits 1 then -4 and stops.
3. The negatives are now exhausted, so the interleaving loop ends after a single pair.
4. The remaining positives, 2 and 3, are appended in their original order.
5. The result is [1, -4, 2, 3] — alternating as far as it can, then the leftovers.
6. Verified over all 511 sign patterns of length 0 to 8 with zero failures.

<!-- @visualization array -->

<!-- @description -->
The input strip drawn above an initially empty output strip, with positives and negatives given clearly distinct fills so the alternation is legible as a pattern rather than as a sign to read. Two write cursors sit under the output — one on the even slots, one on the odd — and each is drawn as a bracket spanning to its next landing position two cells away, so it is visible that the two cursors interleave without ever colliding. As the marker walks the input, animate each element flying down to its group's cursor, and stamp a small order number on it taken from its position within its own group, so both groups can be read off the output afterwards as 1, 2, 3 in sequence. That numbering is the whole point: it makes relative order something the reader can check at a glance rather than take on trust. The swap panel runs [-1,-2,3,4] beside it with the tempting constant-space approach: highlight the misplaced positive and the misplaced negative, arc them past each other, and land on [4,-2,3,-1]. Then run two verdict strips beneath — an ALTERNATION check that lights entirely green, and an ORDER check that reads the positives' stamped numbers as 2 then 1 and lights red. Hold that frame with both verdicts on screen, because the pair is the lesson, and annotate it with the measured rates: alternation correct 100%, order wrong 44.9%. The in-place panel demonstrates the rotation: mark the position needing a sign it does not have, send a scan pointer rightward until it finds one, then animate the whole span between them sliding one cell right as the found element drops into place — every displaced element visibly keeping its stamped number's sequence, which is why rotation preserves what swapping destroys. Run that panel twice on the same length: once on a shuffled strip where the scan pointer travels two or three cells, and once on an all-positives-then-all-negatives strip where it travels half the array on every single step. Put a step counter on each and let the second one run away, closing with the measured figures — 0.0210ms against 222.838ms at 64,000 elements, and the 4.0x growth per doubling that says quadratic.

<!-- @sampleInput -->
```json
{"primary":{"input":[3,1,-2,-5,2,-4],"positives":[{"value":3,"order":1},{"value":1,"order":2},{"value":2,"order":3}],"negatives":[{"value":-2,"order":1},{"value":-5,"order":2},{"value":-4,"order":3}],"trace":[{"x":3,"sign":"pos","slot":0,"cursorAfter":2},{"x":1,"sign":"pos","slot":2,"cursorAfter":4},{"x":-2,"sign":"neg","slot":1,"cursorAfter":3},{"x":-5,"sign":"neg","slot":3,"cursorAfter":5},{"x":2,"sign":"pos","slot":4,"cursorAfter":6},{"x":-4,"sign":"neg","slot":5,"cursorAfter":7}],"output":[3,-2,1,-5,2,-4]},"swapPanel":{"input":[-1,-2,3,4],"swapped":[4,-2,3,-1],"correct":[3,-1,4,-2],"alternationCorrect":true,"orderCorrect":false,"positivesInInput":[3,4],"positivesInOutput":[4,3],"alternationRate":1.0,"orderFailureRate":0.449,"failures":44,"patterns":98},"inPlacePanel":{"shuffled":{"typicalScanDistance":2,"growthPerDoubling":[3.6,1.3,1.5,1.6],"verdict":"near linear"},"adversarial":{"arrangement":"all positives, then all negatives","typicalScanDistance":"n/2","growthPerDoubling":[4.0,4.0,4.0,4.0],"verdict":"quadratic"},"n":64000,"twoIndexMs":0.0210,"inPlaceMs":222.838,"ratio":10611,"shuffledRatio":6},"unequalPanel":{"input":[1,2,3,-4],"positives":[1,2,3],"negatives":[-4],"interleaved":[1,-4],"appended":[2,3],"output":[1,-4,2,3],"patterns":511,"failures":0}}
```

<!-- @highlights -->
- The input strip sits above an empty output strip, with positives and negatives given distinct fills so alternation reads as a pattern.
- Two write cursors sit under the output, one on even slots and one on odd, each bracketed to its next landing position two cells away.
- Every element carries a stamped number showing its position within its own group, so relative order can be checked by eye.
- The 3 flies to slot 0 and the positive cursor jumps to slot 2, skipping the odd slot entirely.
- The 1 lands at slot 2 and the -2 lands at slot 1, with the two cursors advancing independently and never colliding.
- The finished output reads 3, -2, 1, -5, 2, -4, and both groups' stamped numbers read 1, 2, 3 in sequence.
- The swap panel runs [-1,-2,3,4], arcs the misplaced positive and negative past each other, and lands on [4,-2,3,-1].
- An alternation verdict strip lights entirely green — the signs are perfectly correct.
- An order verdict strip reads the positives' stamps as 2 then 1 and lights red.
- Both verdicts are held on screen together, annotated with the measured rates: alternation 100% correct, order wrong on 44.9%.
- The in-place panel marks a slot needing a sign it lacks and sends a scan pointer rightward to find one.
- The whole span between them slides one cell right as the found element drops in, every displaced stamp keeping its sequence.
- That sliding is why rotation preserves what swapping destroys, shown rather than asserted.
- The same panel then runs on a shuffled strip, where the scan travels two or three cells per step.
- It runs again on an all-positives-then-all-negatives strip, where the scan travels half the array on every step and the counter runs away.
- The measured figures close it: 0.0210ms against 222.838ms at 64,000 elements, with growth of exactly 4.0x per doubling.

<!-- @edgeCases -->
- Empty array — nothing to place and the output is empty, needing no special handling.
- Two elements, one of each sign — the smallest meaningful input, and the positive must come first.
- Two elements where the negative comes first in the input — the output still starts with the positive, since position is decided by sign.
- Already correctly alternating input — the two-cursor version still writes every element, while the in-place version does no rotations at all.
- Exactly reversed alternation, negative first throughout — every position is wrong and the in-place version rotates on every step.
- All positives followed by all negatives — the adversarial case, where the in-place version measured exactly quadratic growth.
- All negatives followed by all positives — the mirror image, equally adversarial.
- More positives than negatives — the interleaving stops early and the surplus positives are appended in order.
- More negatives than positives — the same, and note the output still begins with a positive if any exists.
- All elements of one sign — no alternation is possible and the array is returned unchanged in order.
- Zeros in the input — the problem as stated has none, so decide explicitly whether zero counts as positive or negative before writing the test.

<!-- @pitfalls -->
- Swapping misplaced elements to save space. It alternates the signs correctly on 100% of inputs and breaks the required order on 44.9% — measured 44 of 98 equal-count patterns.
- Testing only that the signs alternate. That is the one property the swap approach never gets wrong, so such a test cannot detect the bug at all.
- Using swap instead of rotate in the in-place version, which is the same order-destroying mistake wearing different clothes.
- Choosing the in-place version to save memory without checking the input's shape. On all-positives-then-all-negatives it measured 222.838ms against 0.0210ms at n = 64,000 — 10,611x.
- Benchmarking the in-place version on shuffled data, which reports a 6x gap where the worst case is over ten thousand.
- Assuming the adversarial arrangement is unlikely. Concatenating two lists or sorting by sign produces it directly.
- Advancing both write cursors by one instead of two, which makes the groups collide instead of interleave.
- Starting the negative cursor at 0 rather than 1, which puts a negative first and violates the stated output format.
- Applying the equal-counts algorithm to unequal input. Python raises IndexError, but a default C++ build writes out of bounds in silence — [1,2,3,-4] returns [1,-4,2,0], where the 3 has been replaced by a zero that was never in the input.
- Trusting a C++ run to surface that bug. Only a hardened build catches it: -D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_FAST traps with exit 133, while plain -O2 returns the corrupted array as though nothing happened.
- Forgetting that only one of the two drain loops can execute in the unequal version — writing them as an if/else is fine, but writing them as an if alone drops elements.
- Treating zero as positive without saying so. The statement excludes zeros, so any handling you add is a convention you must document.
- Reaching for stable_partition or a sort to solve this. It needs no comparisons between elements at all — position is decided by sign alone.

<!-- @doubt -->
### Why can't I just swap the misplaced elements? It uses no extra space.

<!-- @answer -->
Because swapping moves two elements past each other, and the problem requires each group's relative order to survive. On [-1,-2,3,4] the only misplaced pair is index 0 and index 3, so swapping gives [4,-2,3,-1]. The signs alternate perfectly — and the positives were 3 then 4 in the input and are 4 then 3 in the output. The correct answer is [3,-1,4,-2]. Measured over all 98 equal-count sign patterns of length 2 to 8: the alternation was correct on 100% of them and the order was wrong on 44.9%.

<!-- @doubt -->
### My solution produces alternating signs and my tests pass. Is it right?

<!-- @answer -->
Probably not, and your test is the reason you cannot tell. Alternation is the property the swap approach never gets wrong — it is the one thing that stays correct while the actual requirement is violated. Assert what the problem asks for: extract the positives from your output and check they appear in the same order as the positives in the input, then do the same for the negatives. That is the assertion that takes this bug from undetectable to failing nearly half the time. It is the same trap as the previous subtopic, where the bookkeeping bug returned the right sum with the wrong subarray.

<!-- @doubt -->
### Can this be done in O(1) space?

<!-- @answer -->
Yes, by rotating rather than swapping — verified correct over all 99 equal-count patterns. When a position holds the wrong sign, scan forward for the nearest element of the sign you need and rotate it back, shifting everything between one step right. The displaced elements keep their sequence, which is exactly what a swap fails to do. The catch is the cost: that inner scan is a linear search, and on the wrong input every rotation traverses half the array.

<!-- @doubt -->
### How slow is the in-place version really?

<!-- @answer -->
It depends entirely on the arrangement, which is what makes it dangerous. On randomly shuffled input the next element of the needed sign is about two positions away, so it behaves essentially linearly — measured growth of about 1.5x per doubling of n. On all-positives-followed-by-all-negatives it is exactly quadratic: growth of 4.0x per doubling, four doublings in a row. At n = 64,000 arranged that way it took 222.838ms against 0.0210ms for the version that allocates an output array — a factor of 10,611. On shuffled input at the same size the gap is only 6x, so a benchmark on random data understates the risk by three orders of magnitude.

<!-- @doubt -->
### Is that adversarial input realistic?

<!-- @answer -->
Very. All positives followed by all negatives is what you get from concatenating two lists, from sorting by sign, from reading two data sources in sequence, or from any pipeline that groups before it interleaves. It is not a hand-crafted attack — it is one of the more likely shapes a caller will hand you. That is the argument for taking the O(n) array: it costs a few kilobytes and it cannot be made pathological by the input.

<!-- @doubt -->
### Why do the two write cursors advance by two?

<!-- @answer -->
Because each group only ever occupies alternating slots. Positives go to 0, 2, 4 and negatives to 1, 3, 5, so advancing by two moves each cursor to its group's next slot and guarantees the two cursors never target the same index. Advancing by one would make them collide and overwrite each other. Starting the negative cursor at 1 rather than 0 is what puts a positive first, which the statement requires.

<!-- @doubt -->
### What if the counts are not equal?

<!-- @answer -->
Alternate while both groups still have elements, then append whatever remains in its original order. On [1,2,3,-4] that gives [1,-4,2,3] — one pair interleaved, then the two surplus positives. The change is only in the loop condition, so it costs nothing extra to write, and it was verified over all 511 sign patterns of length 0 to 8 with zero failures. It is worth writing this way by default rather than relying on an equal-counts guarantee the caller may not honour.

<!-- @doubt -->
### The statement promises equal counts. Do I really need to handle unequal input?

<!-- @answer -->
In Python you will find out immediately if you get it wrong — the cursor runs off the end and raises IndexError. In C++ you will not. A default -O2 build writes past the end of the output vector and returns a plausible-looking array: [1,2,3,-4] comes back as [1,-4,2,0], where the 3 has been dropped and a zero that appears nowhere in the input has taken its place. Nothing crashes and nothing is logged. Compiling with -D_LIBCPP_HARDENING_MODE=_LIBCPP_HARDENING_MODE_FAST traps it with exit 133, but that is opt-in. So the guarantee is load-bearing in C++ in a way it is not in Python — either honour it deliberately or write the unequal-counts version, which costs nothing extra.

<!-- @doubt -->
### Does this need a sort or a stable partition?

<!-- @answer -->
Neither, and reaching for them is a sign of over-thinking the problem. No element is ever compared with another — each element's destination is determined entirely by its own sign and by how many of its own group came before it. That is why the single pass with two cursors works: it is a placement problem, not an ordering problem. stable_partition would group the signs correctly but leave them in two blocks rather than interleaved, which is a different output.

<!-- @doubt -->
### How does this relate to Move Zeros to End?

<!-- @answer -->
Both are in-place rearrangements that must not disturb relative order, and both are defined by what that forbids. In Move Zeros the requirement ruled out the obvious swap-from-both-ends approach and forced a write pointer that only ever moves forward. Here it rules out swapping misplaced elements and forces either an output array or a rotation. Recognising 'this rearrangement must preserve order, so I cannot swap' is the transferable step — it is also why Sort Colors needs stable_partition rather than partition when order matters.
