---
id: reverse-an-array
topic: Basic Recursion
title: Reverse an array
difficulty: Easy
status: ready
prerequisites:
  - factorial-of-a-given-number
  - sum-of-first-n-numbers
  - print-n-to-1-using-recursion
  - pass-by-value-vs-pass-by-reference
  - stack-memory-and-recursion-depth
relatedIds:
  - check-if-string-is-palindrome-or-not
  - factorial-of-a-given-number
  - sum-of-first-n-numbers
  - stack-memory-and-recursion-depth
---

<!-- @summary -->
The first recursion in this topic that neither prints nor returns a value — it changes memory, and the change outlives every frame that made it. Two pointers moving toward each other means one frame per two elements, so the same stack that summed 174,254 numbers reverses an array of 348,510. Python shows the ratio exactly: 1,997 elements against the 999 a linear recursion managed.

<!-- @theory -->
## The problem

Reverse an array in place.

```
[1, 2, 3, 4, 5]   ->   [5, 4, 3, 2, 1]
```

## A third kind of recursive function

Everything in this topic so far has fallen into two groups. The printing
subtopics *performed an action* and returned nothing. Sum and Factorial *computed
a value* and returned it up the chain. This one does neither: it returns nothing
and prints nothing, and yet it is the only one whose effect is still there after
the last frame is gone.

```
factorial(n):                     reverse(arr, l, r):
    if n <= 1: return 1               if l >= r: return
    return n * factorial(n - 1)       swap(arr[l], arr[r])
                                      reverse(arr, l + 1, r - 1)
```

The frames carry no result. What they carry is a **shrinking window** — a pair of
indices closing in on the middle — and each one performs exactly one swap before
handing a narrower window to the next.

## Two pointers means half the frames

Every recursion in this topic so far consumed one frame per input element. This
one moves two indices toward each other, so it consumes one frame per **two**
elements. Measured:

| n | Frames |
|---|---|
| 10 | 5 |
| 11 | 5 |
| 1,000 | 500 |
| 1,001 | 500 |

The frame count is `floor(n/2)`, which is why 10 and 11 cost the same.

That halving is worth exactly what you would expect, and it is measurable at the
limit. Compiled at `-O0`:

| Problem | Frames before the stack dies | Largest input |
|---|---|---|
| Sum of First N Numbers | 174,254 | n = 174,254 |
| **Reverse an array** | **174,255** | **n = 348,510** |

The same stack, the same 48-byte frame, essentially the same number of frames —
and **twice the input**. The prediction lines up too: 8,372,224 bytes ÷ 48 gives
174,421 frames, against 174,255 measured, within 0.1%.

Python makes the ratio exact. At the default recursion limit of 1,000 the linear
recursions in this topic reached about 999 elements; this one reverses a list of
**1,997** — a ratio of **2.00**.

## It is already a tail call

Look at what happens after the recursive call: nothing.

```
swap(arr[l], arr[r]);
reverse(arr, l + 1, r - 1);      // last statement, nothing pending
```

Sum and Factorial both left an arithmetic operation waiting, which is why both
subtopics discussed an accumulator rewrite. Here there is nothing to accumulate —
the work was already done to the array before the call — so the natural way to
write it is **already in tail position**.

The compiler agrees. Self-calls in the generated assembly:

| | `-O0` | `-O1` | `-O2` |
|---|---|---|---|
| Two-pointer recursion | 1 self-call, 32 instrs | **0**, 15 instrs | **0**, 15 instrs |
| Hand-written loop | — | 0, 16 instrs | 0, 16 instrs |

At `-O1` the recursion is a loop, and at `-O2` it is fifteen instructions against
the loop's sixteen. The depth limit disappears with it: at `-O2` the recursion
completed n = 199,999,237, where `-O0` died at 348,510.

This is the first problem in the topic where the obvious formulation is also the
optimal one, with no rewrite to discuss.

## The base case is where this goes wrong

The correct test is `l >= r`. The tempting one is `l == r` — stop when the two
pointers meet in the middle. For an odd-length array they do meet:

```
n = 5:  (0,4) -> (1,3) -> (2,2)   l == r, stop
n = 4:  (0,3) -> (1,2) -> (2,1)   they CROSSED without ever being equal
```

For an even length the pointers step past each other and `l == r` is never true.
Measured over n = 1 to 2,000:

| Lengths | With `l == r` |
|---|---|
| Odd | **1,000 correct, 0 broken** |
| Even | **0 correct, 1,000 broken** |

Exactly half of all inputs. And the failure is close to invisible, because the
recursion keeps swapping on the way past and **undoes its own work**:

```
n = 6, start [1,2,3,4,5,6]
  swap a[0] a[5] -> [6,2,3,4,5,1]
  swap a[1] a[4] -> [6,5,3,4,2,1]
  swap a[2] a[3] -> [6,5,4,3,2,1]   <- correct, for one step
  swap a[3] a[2] -> [6,5,3,4,2,1]
  swap a[4] a[1] -> [6,2,3,4,5,1]
  swap a[5] a[0] -> [1,2,3,4,5,6]   <- back to the input
```

It produces the right answer at the midpoint and then destroys it. What the caller
sees, before anything crashes, is an array that **did not change** — which reads
like the function was never called rather than like a bug in it.

What happens next differs by language:

- **C++** keeps walking off the allocation. Measured: **SIGBUS, exit status 138**.
- **Python** treats a negative index as legal, so `arr[-1]` wraps to the end and
  the corruption continues silently until `l` reaches `len(arr)` — then
  `IndexError: list index out of range`.

Neither one points at the base case.

## Nothing here is faster than anything else

At n = 1,000,000, `-O2`, nanoseconds per element, median of nine alternated rounds:

| | ns/element |
|---|---|
| Recursion | 0.312 |
| Loop | 0.314 |
| `std::reverse` | 0.310 |

Identical, because at `-O2` all three are the same loop. And `std::reverse` is not
doing anything clever: its `-O2` body is 18 instructions and **touches no vector
registers at all** — the compiler did not vectorise it. There is no hidden trick
being missed by writing this yourself.

The one-index variant is the only form that costs anything, and barely: **0.348ns
against 0.309**, about 1.13x, from recomputing `n - 1 - i` on every frame.

Python is the opposite — the built-ins are far ahead, because the loop is
interpreted and the reversal is not. At n = 1,500:

| | ns/element |
|---|---|
| Recursion | 73.89 |
| Explicit loop | 47.15 |
| `list.reverse()` | **2.11** |
| `arr[::-1]` | **1.83** |

`list.reverse()` is **22.3x** faster than a hand-written loop and **35x** faster
than the recursion.

## Where this goes next

**Check if String is Palindrome or Not** uses this exact two-pointer shape and
changes what happens at each step: instead of swapping the ends it *compares*
them, and instead of always running to the middle it can stop at the first
mismatch. That turns a function that always costs n/2 frames into one whose cost
depends on the input — and it returns a value again, so the base case has to
answer a question rather than do nothing.

<!-- @intuition -->
Reversing is just swapping the first with the last, then solving the same problem on everything in between. That is the recursion, and the window shrinking by one from each side is what makes it terminate. The thing worth noticing is that this function has no result — no value comes back up the chain and nothing is printed, yet the array is reversed when it finishes, because each frame changed memory that outlives it. That also explains why nothing is pending after the recursive call: the swap already happened, so the call is the last thing the frame does and the compiler can drop the frame entirely. The one place to be careful is the stopping test. Two pointers walking toward each other only land on the same index when there is a middle element to land on, so testing for equality quietly breaks every even-length array.

<!-- @approach -->
### Iteration - Two Pointers

<!-- @idea -->
Walk one index in from each end, swapping as they go, until they meet.

<!-- @steps -->
1. Put one index at the first element and one at the last.
2. While the left index is strictly less than the right, swap the two elements.
3. Move the left index forward and the right index back.
4. Stop as soon as they meet or cross.
5. An array of length zero or one is already reversed and the loop body never runs.

<!-- @complexity -->
- time: O(n), with n/2 swaps
- space: O(1)
- note: The condition is l < r, not l != r — the same trap as the recursive base case, and it breaks on exactly the even lengths. Measured 0.314ns per element at n = 1,000,000, which is the same as both the recursion and std::reverse.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void reverseArray(vector<int>& arr) {
    int l = 0, r = (int)arr.size() - 1;

    while (l < r) {
        swap(arr[l], arr[r]);
        l++;
        r--;
    }
}
```

<!-- @annotations -->
- 5: r is int, not size_t. An empty vector gives size() - 1 of a huge unsigned value, and the loop reads far out of bounds.
- 7: l < r, not l != r. The two indices cross without meeting on every even length, so != never stops.
- 8: Nothing needs to happen when l equals r — that element is its own mirror.

<!-- @code java -->
```java
static void reverseArray(int[] arr) {
    int l = 0, r = arr.length - 1;

    while (l < r) {
        int t = arr[l]; arr[l] = arr[r]; arr[r] = t;
        l++;
        r--;
    }
}
```

<!-- @annotations -->
- 2: arr.length is an int in Java, so the empty-array underflow that C++ allows with size_t cannot happen here.

<!-- @code python -->
```python
def reverse_array(arr):
    l, r = 0, len(arr) - 1
    while l < r:
        arr[l], arr[r] = arr[r], arr[l]
        l += 1
        r -= 1
    return arr


# Prefer the built-ins: list.reverse() measured 2.11ns per element
# against this loop's 47.15ns at n = 1,500, and arr[::-1] 1.83ns.
```

<!-- @annotations -->
- 4: The tuple assignment swaps without a temporary, and both right-hand values are read before either is written.
- 10: 22.3x faster, because the swapping happens in C rather than in interpreted bytecode.

<!-- @approach -->
### Recursion - Swap the Ends

<!-- @idea -->
Swap the outermost pair, then reverse everything strictly between them.

<!-- @steps -->
1. Take the array and the two ends of the window, l and r.
2. If l is greater than or equal to r, the window holds nothing left to do, so return.
3. Swap the elements at l and r.
4. Call the function on the window from l plus one to r minus one.
5. Nothing follows that call, so the frame has no reason to survive it.

<!-- @complexity -->
- time: O(n)
- space: O(n/2) call stack as written, O(1) at -O1 and above
- note: One frame per two elements, so at -O0 it reversed an array of 348,510 using 174,255 frames — twice the input the linear recursions in this topic managed on the same stack. It is already a tail call, so -O1 leaves zero self-calls and the depth limit disappears: at -O2 it completed n = 199,999,237. Measured 0.312ns per element against the loop's 0.314ns.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void reverseArray(vector<int>& arr, int l, int r) {
    if (l >= r) return;              // NOT l == r

    swap(arr[l], arr[r]);
    reverseArray(arr, l + 1, r - 1); // nothing pending after this
}

void reverseArray(vector<int>& arr) { reverseArray(arr, 0, (int)arr.size() - 1); }
```

<!-- @annotations -->
- 5: l >= r, not l == r. On an even length the indices cross without ever being equal, so the equality test never fires — measured 0 of 1,000 even lengths correct. The inequality also covers the empty and single-element cases, where l starts at or past r.
- 8: The swap happens before the call, so nothing is pending afterwards — this is a tail call, and -O1 compiles it to a loop with zero self-calls.
- 11: The wrapper exists so callers never have to supply the initial window, which is where off-by-one errors get introduced.

<!-- @code java -->
```java
static void reverseArray(int[] arr, int l, int r) {
    if (l >= r) return;

    int t = arr[l]; arr[l] = arr[r]; arr[r] = t;
    reverseArray(arr, l + 1, r - 1);
}

static void reverseArray(int[] arr) { reverseArray(arr, 0, arr.length - 1); }
```

<!-- @annotations -->
- 5: The JVM specification forbids tail-call elimination, so this keeps one frame per two elements all the way down and throws StackOverflowError on a large enough array.

<!-- @code python -->
```python
def reverse_array(arr, l=None, r=None):
    if l is None:
        l, r = 0, len(arr) - 1
    if l >= r:
        return arr
    arr[l], arr[r] = arr[r], arr[l]
    return reverse_array(arr, l + 1, r - 1)


# One frame per two elements: at the default recursion limit of 1,000
# this reverses a list of 1,997, against about 999 for the linear
# recursions in this topic — a ratio of exactly 2.00.
```

<!-- @annotations -->
- 2: Defaulting to None rather than to 0 and len(arr) - 1, because a default argument is evaluated once at definition time and could not see the caller's array.
- 4: l >= r. In Python the equality version does not even crash promptly — negative indices are legal, so it keeps swapping until l reaches len(arr) and only then raises IndexError.

<!-- @approach -->
### Recursion - One Index

<!-- @idea -->
Pass only how far in you are and compute the matching element from the length.

<!-- @steps -->
1. Take the array, its length, and a single index i counting from the front.
2. The element paired with i is the one at n minus one minus i.
3. If i has reached or passed that partner, the middle is reached, so return.
4. Otherwise swap the two and recurse with i plus one.
5. The window is implied by i rather than carried in two parameters.

<!-- @complexity -->
- time: O(n)
- space: O(n/2) call stack, O(1) once eliminated
- note: One parameter instead of two, at the cost of recomputing n - 1 - i on every frame — measured 0.348ns per element against the two-pointer form's 0.309ns, about 1.13x. It is also a tail call and loses its self-call at -O1. Worth writing once to see that the second pointer was never information, only a cached subtraction.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void reverseFrom(vector<int>& arr, int n, int i) {
    if (i >= n - 1 - i) return;

    swap(arr[i], arr[n - 1 - i]);
    reverseFrom(arr, n, i + 1);
}

void reverseArray(vector<int>& arr) { reverseFrom(arr, (int)arr.size(), 0); }
```

<!-- @annotations -->
- 5: The partner of i is n - 1 - i, so the stopping test compares i against its own mirror rather than against a second pointer.
- 7: n - 1 - i is computed twice per frame here and recomputed on every frame, which is the whole of the 1.13x it costs.
- 8: Still a tail call, so this form loses its self-call at -O1 exactly as the two-pointer version does.

<!-- @code java -->
```java
static void reverseFrom(int[] arr, int i) {
    int j = arr.length - 1 - i;
    if (i >= j) return;

    int t = arr[i]; arr[i] = arr[j]; arr[j] = t;
    reverseFrom(arr, i + 1);
}

static void reverseArray(int[] arr) { reverseFrom(arr, 0); }
```

<!-- @annotations -->
- 2: Java arrays carry their own length, so this form needs only one parameter rather than two — the array is the second one.

<!-- @code python -->
```python
def reverse_from(arr, i=0):
    j = len(arr) - 1 - i
    if i >= j:
        return arr
    arr[i], arr[j] = arr[j], arr[i]
    return reverse_from(arr, i + 1)


# len(arr) is O(1) in Python, so recomputing the partner each frame
# costs almost nothing here — unlike a language where it would be a scan.
```

<!-- @annotations -->
- 2: len() on a list is a stored field rather than a walk, so this recomputation is cheap.
- 3: i >= j, not i == j, for the same reason the two-pointer version needs >= — on an even length they cross.

<!-- @approach -->
### The Library Call

<!-- @idea -->
Use the reversal the standard library already provides.

<!-- @steps -->
1. Reach for the built-in before writing any of the loops above.
2. In C++ call reverse over the whole range.
3. In Java use Collections.reverse on a List, since the array helper reverses only ranges of objects.
4. In Python call list.reverse to reverse in place, or slice with a step of minus one for a copy.
5. Write the loop yourself only when the container is not one the library understands.

<!-- @complexity -->
- time: O(n)
- space: O(1) in place, O(n) for the slicing form which builds a copy
- note: In C++ there is nothing to gain — std::reverse measured 0.310ns per element against a hand-written loop's 0.314ns, and its -O2 body is 18 instructions touching no vector registers at all, so it is not vectorised either. In Python the gap is enormous: list.reverse() measured 2.11ns per element against the loop's 47.15ns, 22.3x, because the swapping runs in C.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

void reverseArray(vector<int>& arr) {
    reverse(arr.begin(), arr.end());
}
```

<!-- @annotations -->
- 6: Measured 0.310ns per element against 0.314ns for a hand-written loop — the same, because there is nothing clever left to do. Its -O2 body is 18 instructions and uses no vector registers, so the library is not hiding a vectorised implementation here.

<!-- @code java -->
```java
import java.util.*;

static void reverseArray(List<Integer> arr) {
    Collections.reverse(arr);
}
```

<!-- @annotations -->
- 4: Collections.reverse works on a List. There is no Arrays.reverse for a primitive int[], which is why the loop above is still worth having.

<!-- @code python -->
```python
def reverse_in_place(arr):
    arr.reverse()          # 2.11ns per element
    return arr


def reversed_copy(arr):
    return arr[::-1]       # 1.83ns per element, but allocates a new list
```

<!-- @annotations -->
- 2: In place and returns None, so writing arr = arr.reverse() throws the list away — a common slip.
- 7: The slice is marginally faster but builds a second list, so it is O(n) space rather than O(1).

<!-- @example -->

<!-- @input -->
[1, 2, 3, 4, 5] with the two-pointer recursion

<!-- @output -->
[5, 4, 3, 2, 1] — three frames, two swaps

<!-- @why -->
The first trace in this topic where the frames carry no value at all, and the result is visible in the array rather than in anything returned.

<!-- @walkthrough -->
1. reverseArray(arr, 0, 4) is called. l is 0 and r is 4, so it swaps 1 and 5, giving [5, 2, 3, 4, 1].
2. It then calls itself with the window 1 to 3.
3. That frame swaps 2 and 4, giving [5, 4, 3, 2, 1], and calls itself with the window 2 to 2.
4. That frame finds l equal to r, matches the base case, and returns without swapping.
5. The middle element of an odd-length array is its own mirror, so leaving it alone is correct.
6. Three frames were used for five elements, and each returned nothing at all.
7. The array is already reversed by the time the deepest frame is reached — the unwind does no work.

<!-- @example -->

<!-- @input -->
The base case written as l == r, on an array of length 6

<!-- @output -->
The array comes back exactly as it went in, then the program dies

<!-- @why -->
It is the defining bug of this problem, it breaks exactly half of all inputs, and its symptom looks like the function was never called rather than like it is wrong.

<!-- @walkthrough -->
1. Starting from [1,2,3,4,5,6] the windows are (0,5), (1,4) and (2,3), and after those three swaps the array is [6,5,4,3,2,1] — correct.
2. But l is now 3 and r is 2, and l == r is false, so the recursion does not stop.
3. It swaps a[3] with a[2], then a[4] with a[1], then a[5] with a[0], undoing all three of the swaps it just made.
4. The array is back to [1,2,3,4,5,6], which is what the caller sees.
5. Over n = 1 to 2,000 every odd length is correct and every even length is broken — exactly 50%.
6. In C++ the indices then walk off the allocation, measured as SIGBUS, exit status 138.
7. In Python a negative index is legal, so the corruption continues silently until l reaches len(arr) and IndexError is raised — neither symptom points at the base case.

<!-- @example -->

<!-- @input -->
The same stack budget, spent by Sum of First N Numbers and by this problem

<!-- @output -->
174,254 numbers against an array of 348,510

<!-- @why -->
It quantifies what moving two pointers instead of one is actually worth, using the limit rather than a timing.

<!-- @walkthrough -->
1. Both functions use a 48-byte frame at -O0 on this machine.
2. The stack is 8,372,224 bytes, so it holds about 174,421 frames.
3. Sum of First N Numbers consumes one frame per number and died at n = 174,254.
4. This one consumes one frame per two elements and reversed an array of 348,510, using 174,255 frames.
5. Measured against the prediction of 174,421 frames, that is within 0.1%.
6. Python confirms the ratio exactly: at the default limit of 1,000 the linear recursions reached about 999 elements and this one reaches 1,997, a ratio of 2.00.
7. At -O2 the question stops applying, because the tail call is eliminated and n = 199,999,237 completed.

<!-- @example -->

<!-- @input -->
Recursion, hand-written loop and std::reverse at n = 1,000,000

<!-- @output -->
0.312ns, 0.314ns and 0.310ns per element

<!-- @why -->
It closes off the usual assumption that the library call must be doing something faster, and shows the recursion costing nothing once the tail call is gone.

<!-- @walkthrough -->
1. At -O2 the two-pointer recursion contains zero calls to itself and fifteen instructions.
2. The hand-written loop is sixteen instructions, so the recursion has become the loop.
3. Measured across nine alternated rounds the three forms are 0.312, 0.314 and 0.310 nanoseconds per element.
4. Those differences are far inside this machine's run-to-run spread and should not be ranked.
5. std::reverse is not vectorised here — its -O2 body is 18 instructions and touches no vector registers.
6. So there is no hidden implementation to lose by writing the loop yourself in C++.
7. Python is the opposite case: list.reverse() measured 2.11ns per element against an interpreted loop's 47.15ns, 22.3x, because there the built-in really is running different code.

<!-- @visualization array -->

<!-- @description -->
The array as a horizontal strip of cells with two markers beneath it, one at each end, moving inward one step per frame. Run [1,2,3,4,5] and draw a frame in a column at the left for each level, but give each frame an empty result slot and label the column returns nothing — the contrast with Sum of First N Numbers, whose frames each held a pending value, should be the first thing visible. Each frame highlights exactly two cells, draws the swap as a crossing arc between them, and then hands a narrower strip to the next frame; the cells outside the current window should be tinted as finished so the shrinking window is obvious. When the markers land on the middle cell, mark it as its own mirror and stop. The key panel sits beneath: a frame counter that increments once per two cells consumed, next to the same counter from Sum of First N Numbers incrementing once per cell, both filling the same fixed stack-height bar — the sum's bar fills twice as fast, and the labels under them read n = 174,254 and n = 348,510 for the same 174,255 frames. Then the base-case panel, which should be an animation rather than a table: run the l == r version on [1,2,3,4,5,6] and let the strip reach [6,5,4,3,2,1] at the midpoint, flash it green for one beat, then keep going as the markers cross and swap it back step by step to [1,2,3,4,5,6], ending red. Under it put two chips, one reading odd lengths 1,000 of 1,000 correct and one reading even lengths 0 of 1,000, and past the end of the strip draw the markers continuing off both sides into greyed-out cells labelled SIGBUS in C++ and IndexError in Python. Finally a small timing row: three bars at 0.312, 0.314 and 0.310 nanoseconds per element for recursion, loop and std::reverse, drawn identical in length with a note that the differences are inside the machine's spread.

<!-- @sampleInput -->
```json
{"primary":{"array":[1,2,3,4,5],"form":"two-pointer recursion","frames":[{"window":[0,4],"swaps":[1,5],"after":[5,2,3,4,1]},{"window":[1,3],"swaps":[2,4],"after":[5,4,3,2,1]},{"window":[2,2],"baseCase":true,"swaps":null,"after":[5,4,3,2,1],"note":"l == r, the middle element is its own mirror"}],"result":[5,4,3,2,1],"framesUsed":3,"swapsPerformed":2,"framesCarryAValue":false,"contrastWithEarlier":"printing recursions returned nothing and left nothing; value recursions returned a number; this returns nothing and leaves the array changed"},"frameCount":{"rule":"floor(n/2)","rows":[{"n":10,"frames":5},{"n":11,"frames":5},{"n":1000,"frames":500},{"n":1001,"frames":500}]},"depth":{"frameBytes":48,"stackBytes":8372224,"predictedFrames":174421,"O0":{"sumOfFirstN":{"framesPerElement":1,"largestInput":174254},"reverse":{"framesPerElement":0.5,"largestInput":348510,"framesUsed":174255}},"accuracyVsPrediction":"99.90%","O2":{"tailCallEliminated":true,"largestInput":199999237},"python":{"limit":1000,"linearRecursionsReached":999,"reverseReaches":1997,"ratio":2.00}},"tailCall":{"nothingPendingAfterCall":true,"reason":"the swap happens before the call, so the frame has no work left","selfCalls":[{"level":"-O0","twoPointer":1,"instructions":32},{"level":"-O1","twoPointer":0,"instructions":15},{"level":"-O2","twoPointer":0,"instructions":15}],"handWrittenLoopInstructions":16,"reading":"the first problem in this topic whose natural formulation is already the optimal one — no accumulator rewrite to discuss"},"baseCaseTrap":{"correct":"l >= r","tempting":"l == r","whyItFails":"on an even length the two indices cross without ever being equal","oddLengths":{"tested":1000,"correct":1000,"broken":0},"evenLengths":{"tested":1000,"correct":0,"broken":1000},"fractionBroken":0.5,"trace":{"n":6,"start":[1,2,3,4,5,6],"steps":[{"swap":[0,5],"after":[6,2,3,4,5,1]},{"swap":[1,4],"after":[6,5,3,4,2,1]},{"swap":[2,3],"after":[6,5,4,3,2,1],"note":"correct, for one step"},{"swap":[3,2],"after":[6,5,3,4,2,1]},{"swap":[4,1],"after":[6,2,3,4,5,1]},{"swap":[5,0],"after":[1,2,3,4,5,6],"note":"back to the input"}],"whatTheCallerSees":"an array that did not change"},"thenWhat":{"cpp":"walks off the allocation — SIGBUS, exit status 138","python":"negative indices are legal, so it corrupts silently until l reaches len(arr), then IndexError"}},"timing":{"cpp":{"n":1000000,"unit":"ns per element, -O2, median of 9 alternated rounds","recursion":0.312,"loop":0.314,"stdReverse":0.310,"oneIndexForm":0.348,"twoPointerInSameRun":0.309,"oneIndexPenalty":1.13,"stdReverseVectorised":false,"stdReverseInstructions":18,"stdReverseVectorRegisterInstructions":0,"reading":"identical — at -O2 all three are the same loop"},"python":{"version":"3.13.4","n":1500,"unit":"ns per element","recursion":73.89,"loop":47.15,"listReverse":2.11,"sliceCopy":1.83,"ratios":{"recursionOverLoop":1.57,"loopOverListReverse":22.3,"recursionOverListReverse":35}}}}
```

<!-- @highlights -->
- The array is a horizontal strip with two markers beneath it moving inward one step per frame.
- Each frame is drawn in a column with an empty result slot, and the column is labelled returns nothing.
- That contrast with Sum of First N Numbers, whose frames each held a pending value, should be visible immediately.
- Each frame highlights exactly two cells and draws the swap as a crossing arc between them.
- Cells outside the current window are tinted as finished, so the shrinking window is obvious.
- When the markers land on the middle cell it is marked as its own mirror and the recursion stops.
- Beneath, a frame counter increments once per two cells, beside the sum's counter incrementing once per cell.
- Both fill the same fixed stack-height bar, and the sum's fills twice as fast.
- The labels under the bars read n = 174,254 and n = 348,510 for the same 174,255 frames.
- The base-case panel animates the l == r version on [1,2,3,4,5,6].
- The strip reaches [6,5,4,3,2,1] at the midpoint and flashes green for one beat.
- The markers then cross and swap it back step by step to [1,2,3,4,5,6], ending red.
- Two chips beneath read odd lengths 1,000 of 1,000 correct and even lengths 0 of 1,000.
- Past the end of the strip the markers continue into greyed cells labelled SIGBUS in C++ and IndexError in Python.
- A timing row shows three identical-length bars at 0.312, 0.314 and 0.310 nanoseconds per element.
- A note under them records that those differences sit inside the machine's run-to-run spread.

<!-- @edgeCases -->
- An empty array — l starts at -1 in the wrapper, so the base case must catch l >= r immediately.
- A single element — already reversed, and the base case fires before any swap.
- Two elements — the smallest input where the l == r base case fails.
- Three elements — the smallest odd input, where the middle element is its own mirror.
- Any even length — the l == r base case is wrong for every one of them, measured 0 correct out of 1,000.
- An array of identical values — reversing changes nothing, so a test on it cannot detect a broken base case.
- A palindrome — the same trap, since the reversed array equals the original.
- n around 348,510 in C++ at -O0 — the measured stack limit, twice what a one-frame-per-element recursion manages.
- n above 1,997 in Python — beyond what the default recursion limit allows for this shape.
- Using size_t for the right index in C++ — an empty container makes size() - 1 enormous and the loop reads out of bounds.
- Writing arr = arr.reverse() in Python — list.reverse() returns None, so the list is thrown away.

<!-- @pitfalls -->
- Writing the base case as l == r. The two indices cross without meeting on every even length — measured 0 of 1,000 even lengths correct, against 1,000 of 1,000 odd ones.
- Assuming a wrong base case will be obvious. It reverses the array and then un-reverses it, so the caller gets the input back unchanged, which reads like the function never ran.
- Testing only on odd-length arrays. Every one of them passes with the broken base case.
- Testing on a palindrome or an all-equal array. The reversed result equals the input, so neither can distinguish a correct implementation from a broken one.
- Using size_t or unsigned for the right index. An empty container gives size() - 1 as a huge value and the first read is out of bounds.
- Expecting the loop condition to be different from the base case. l < r and l >= r are the same test written from opposite sides, and getting one right and the other wrong is a common way to half-fix this.
- Reaching for an accumulator or a tail-call rewrite. There is nothing pending after the call already, so the natural form is the optimal one and -O1 leaves zero self-calls.
- Worrying about depth before measuring it. Two pointers means one frame per two elements, so this reaches n = 348,510 at -O0 where the linear recursions in this topic stopped at 174,254.
- Assuming std::reverse must be faster. Measured 0.310ns per element against a hand-written loop's 0.314ns, and it is not vectorised — its -O2 body touches no vector registers.
- Hand-writing the loop in Python. list.reverse() measured 22.3x faster and arr[::-1] 25.7x, because both run in C.
- Using arr[::-1] when you meant to reverse in place. It builds a second list, which is O(n) space, and leaves the original untouched.
- Passing the initial window at every call site. Wrap it, so l and r are computed in one place rather than at each caller.

<!-- @doubt -->
### Why is l >= r right and l == r wrong?

<!-- @answer -->
Because two pointers walking toward each other only land on the same index when there is a middle element for them to land on. An odd length has one, so l == r fires and the recursion stops. An even length does not — the indices step past each other, going from l < r straight to l > r without ever being equal — so the equality test never fires. Measured over n = 1 to 2,000, the equality version got every odd length right and every even length wrong: exactly half of all inputs. Writing l >= r covers both cases with one test, and it also handles the empty and single-element arrays where l already starts at or past r.

<!-- @doubt -->
### What actually happens with the wrong base case?

<!-- @answer -->
It keeps swapping past the middle and undoes its own work. On [1,2,3,4,5,6] it produces the correct [6,5,4,3,2,1] after three swaps, then swaps a[3] with a[2], a[4] with a[1] and a[5] with a[0], arriving back at [1,2,3,4,5,6]. That is what the caller sees — an array that did not change — which reads like the function was never called rather than like it has a bug. Only afterwards does anything go wrong: in C++ the indices walk off the allocation, measured as SIGBUS with exit status 138, while Python treats negative indices as legal and corrupts silently until l reaches len(arr), then raises IndexError. Neither symptom points at the base case.

<!-- @doubt -->
### Does this recursion return anything?

<!-- @answer -->
No, and that is what makes it a third kind of function in this topic. The printing subtopics performed an action and returned nothing. Sum and Factorial returned a value that the frame above used. This one returns nothing and prints nothing, yet its effect is the only one that is still there after every frame is gone, because it wrote to memory the caller owns. The frames carry no result at all — what they carry is a shrinking window of two indices. That is also why nothing is pending after the recursive call, which is what makes it a tail call.

<!-- @doubt -->
### Why is the depth n/2 and does it matter?

<!-- @answer -->
Because each frame retires two elements rather than one, so the frame count is floor(n/2) — which is why n = 10 and n = 11 both cost 5 frames. It matters exactly at the limit. At -O0 on this machine the frame is 48 bytes and the stack is 8,372,224 bytes, so about 174,421 frames are available. Sum of First N Numbers spends one per number and died at n = 174,254; this spends one per two elements and reversed an array of 348,510 using 174,255 frames — the same budget, twice the input. Python makes the ratio exact: 1,997 elements against the roughly 999 the linear recursions reached, which is 2.00.

<!-- @doubt -->
### Should I rewrite this with an accumulator?

<!-- @answer -->
There is nothing to accumulate. Sum and Factorial both left an arithmetic operation waiting after the recursive call, which is what those rewrites existed to remove; here the swap happens before the call, so the frame already has no work left. The compiler confirms it: one self-call at -O0 becomes zero at -O1, in fifteen instructions against a hand-written loop's sixteen. This is the first problem in the topic where the obvious way to write it is also the optimal way, and at -O2 the depth limit disappears entirely — n = 199,999,237 completed.

<!-- @doubt -->
### Is the two-pointer form better than the one-index form?

<!-- @answer -->
Marginally, and for a boring reason. The one-index version computes its partner as n - 1 - i on every frame instead of carrying it, which measured 0.348ns per element against 0.309ns — about 1.13x. Both are tail calls and both lose their self-call at -O1, and both were correct for every length from 0 to 200. The one-index form is worth writing once because it makes a point: the second pointer was never independent information, only a cached subtraction. In Python the difference nearly vanishes, since len() on a list is a stored field rather than a scan.

<!-- @doubt -->
### Is std::reverse faster than my loop?

<!-- @answer -->
No. Measured at n = 1,000,000 it took 0.310ns per element against a hand-written loop's 0.314ns and the recursion's 0.312ns — differences well inside this machine's run-to-run spread, so they should not be ranked at all. It is also not vectorised here: its -O2 body is 18 instructions and touches no vector registers. Use it because it says what you mean in one line and cannot get the base case wrong, not because it is faster. Python is the opposite case, where the built-in really is running different code.

<!-- @doubt -->
### What is the fastest way to do this in Python?

<!-- @answer -->
list.reverse() to reverse in place, or arr[::-1] if you want a copy. At n = 1,500 they measured 2.11ns and 1.83ns per element, against 47.15ns for a hand-written loop and 73.89ns for the recursion — 22.3x and 35x respectively — because the swapping happens in C rather than in interpreted bytecode. The slice is marginally faster but allocates a second list, so it is O(n) space where reverse() is O(1). The one trap is that list.reverse() returns None, so writing arr = arr.reverse() discards the list.

<!-- @doubt -->
### Which tests would catch a broken implementation?

<!-- @answer -->
Any even length, since that is exactly what the common base-case bug breaks. What will not catch it is an odd-length array, which the broken version handles correctly every time, and neither will a palindrome or an array of identical values, because for those the reversed result equals the input and a function that changes nothing looks right. The smallest useful test is a two-element array, and the cheapest complete one is to check a handful of lengths of each parity. Testing the empty array separately is worth it too, since that is where an unsigned right index goes wrong rather than where the base case does.

<!-- @doubt -->
### Why does using size_t for the right index break the empty case?

<!-- @answer -->
Because arr.size() is unsigned, so for an empty container size() - 1 does not give -1, it wraps to the largest representable value. The loop condition l < r is then true immediately and the first swap reads far outside the array. Using int for both indices makes -1 mean what you expect and the loop body never runs. This is the same hazard the descending loop in Print N to 1 had, in a different disguise: unsigned arithmetic has no negative side to fall off, so any expression that expects to go below zero has to be signed.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Check if String is Palindrome or Not, which keeps this exact two-pointer shape and changes what each frame does with the pair it is holding. Instead of swapping the ends it compares them, and instead of always running to the middle it can stop at the first mismatch — so the cost stops being a fixed n/2 and starts depending on the input, the first time in this topic that has been true. It also returns a value again, which means the base case has to answer a question rather than simply do nothing, and the natural answer for "is an empty string a palindrome" turns out to be the same kind of identity choice that 0 and 1 were for sum and factorial.
