---
id: reverse-a-stack
topic: Advanced Recursion
title: Reverse a Stack
difficulty: Medium
status: ready
prerequisites:
  - sort-a-stack-using-recursion
  - count-good-numbers
  - stack-memory-and-recursion-depth
  - time-and-space-complexity-basics
  - reverse-an-array
relatedIds:
  - sort-a-stack-using-recursion
  - reverse-an-array
  - stack-memory-and-recursion-depth
  - insertion-sorting
---

<!-- @summary -->
The same skeleton as sorting a stack with the comparison deleted — and deleting it deletes the adaptivity. Sorting cost the inversion count, anywhere from 0 to n(n−1)/2; reversing costs exactly n(n+1)/2 pops and n(n+1)/2 pushes for every input of the same length, measured with a spread of zero across 5,000 random cases. It is also the worse bargain: the recursion runs 1,266x slower than an O(n) alternative at n = 1,000, and that gap grows linearly.

<!-- @theory -->
## The problem

Reverse a stack using recursion, with no other data structure. Only push, pop and
inspect the top.

```
bottom -> [1, 2, 3, 4] <- top      becomes      bottom -> [4, 3, 2, 1] <- top
```

## One line simpler than sorting

Take the pair of functions from Sort a stack using recursion and delete the
comparison:

```
sortStack:                              reverseStack:
    t = s.pop()                             t = s.pop()
    sortStack(s)                            reverseStack(s)
    insertSorted(s, t)                      insertAtBottom(s, t)

insertSorted(s, x):                     insertAtBottom(s, x):
    if empty or s.top() <= x:               if empty:
        s.push(x); return                       s.push(x); return
    t = s.pop()                             t = s.pop()
    insertSorted(s, x)                      insertAtBottom(s, x)
    s.push(t)                               s.push(t)
```

`insertAtBottom` has **no comparison at all**. It recurses until the stack is
empty, pushes, and rebuilds — every element gets lifted, every time. That makes
it the cleaner illustration of what these two-function recursions are actually
doing: the only job of the recursion is to hold elements out of the way while the
one beneath is dealt with.

## Deleting the comparison deletes the best case

Sorting was adaptive. Its cost was the inversion count, which is 0 on an
already-sorted stack and n(n−1)/2 on a reversed one. Reversing has no such
variation, because there is no condition that can stop the walk early:

| Input, n = 4 | Pops | Pushes | Calls | Peak depth |
|---|---|---|---|---|
| `[1,2,3,4]` sorted | 10 | 10 | 15 | 5 |
| `[4,3,2,1]` reversed | 10 | 10 | 15 | 5 |
| `[2,1,4,3]` | 10 | 10 | 15 | 5 |
| `[7,7,7,7]` all equal | 10 | 10 | 15 | 5 |

Identical, including for an input that is already its own reverse in every
respect but order. Measured across 5,000 random stacks of 12 elements:

| | Range | Spread |
|---|---|---|
| Reverse: pops + pushes | 156 … 156 | **0** |
| Sort: elements lifted | 8 … 55 | **47** |

Zero variance against a spread of 47 on identical inputs. Sorting's cost is a
property of the *data*; reversing's is a property of the *length*.

## The counts are exact

| n | Pops | Pushes | Calls |
|---|---|---|---|
| 4 | 10 | 10 | 15 |
| 10 | 55 | 55 | 66 |
| 20 | 210 | 210 | 231 |
| 50 | 1,275 | 1,275 | 1,326 |

**Pops = pushes = n(n+1)/2** and **calls = (n+1)(n+2)/2**, matched at every n
tested. Both are triangular numbers — the same `n(n+1)/2` that Sum of First N
Numbers spent its whole subtopic on, arriving here as an operation count rather
than an answer.

The reason is immediate: `insertAtBottom` on a stack of k elements does k pops
and k+1 pushes, and it is called once for each k from 0 to n−1.

## It is a much worse bargain than sorting was

Sorting recursively was 195x slower than draining and calling `sort`. Here the
alternative is not O(n log n) but **O(n)** — draining a stack into a vector and
pushing the elements back in the same order reverses it, because two reversals
in a row are one reversal:

| n | Drain and push back | Fully recursive | Ratio |
|---|---|---|---|
| 100 | 814ns | 116,390ns | **143x** |
| 500 | 3,796ns | 2,413,492ns | 636x |
| 1,000 | 8,204ns | 10,389,402ns | **1,266x** |
| 2,000 | 15,708ns | 37,538,417ns | **2,390x** |

The ratio grows **linearly** with n, because this is O(n²) against O(n). Sorting's
equivalent ratios were 23.9x, 112.7x, 195x and 314.4x — growing more slowly,
because there the comparison was O(n²) against O(n log n).

And if you control the container type, reversing it in place costs **855ns at
n = 1,000** — the recursion is **12,151x** slower than that.

## Everything structural carries over

The mechanics are identical to the sorting version, so the same observations hold
without needing to be re-derived:

- **Peak depth is n + 1.** `insertAtBottom` only descends after `reverseStack`
  has already unwound, so the two chains never stack up.
- **Neither call is in tail position** — each frame has to push its element back
  after the recursive call returns — so `-O2` cannot flatten it.
- **Python caps at 998**, exactly as sorting did, because the depth is the same
  and does not depend on the input.

At n = 300, Python's recursion measured 10,398,922ns against `list.reverse()`'s
1,289ns — a factor of **8,065**.

## What the constraint is actually teaching

Two subtopics in a row have used the call stack as storage, and this one isolates
the idea because nothing else is happening. Strip out the comparison and what
remains is: *lift everything off, do one thing, put it all back* — with the
frames holding the elements in between.

That is exactly the shape of backtracking. Choose, recurse, undo. The elements
held in `insertAtBottom`'s frames are the same thing as the partial solution held
in a backtracking search's frames, and the `s.push(t)` on the way out is the
same undo step that Learn All Patterns of Subsequences called `pop_back`.

## Where this goes next

**Generate Binary Strings Without Consecutive 1s** returns to the take/skip tree
of the subsequence subtopics, but with the first *constraint* between successive
choices: a decision is only legal if the previous one allows it. That turns a
complete binary tree into a pruned one, and the number of leaves stops being 2^n
and becomes a Fibonacci number — connecting the two halves of this topic.

<!-- @intuition -->
Reversing a stack recursively is the same trick as sorting one, with the decision taken out. To get an element to the bottom you have to lift everything above it, and the only place to put what you lift is the call stack — so each frame holds one element, pushes it back on the way out, and the whole thing works without declaring a container. What changes from the sorting version is that there is no comparison, so nothing can ever stop the walk early: every element is lifted every time, and the cost depends only on how many elements there are, not on what they are. That makes it the clearer of the two for seeing the mechanism, and the worse of the two as an algorithm, because reversing a stack has a genuinely linear solution that this quadratic one is competing against.

<!-- @approach -->
### Brute Force - Drain and Push Back

<!-- @idea -->
Pop everything into a vector, then push it back in the same order.

<!-- @steps -->
1. Pop each element into a vector, which visits them top to bottom.
2. That vector is therefore the reverse of the stack's bottom-to-top order.
3. Push its elements back in the order they were collected.
4. Pushing reverses again, so the stack ends up reversed overall.
5. Note that this is linear, where every recursive approach here is quadratic.

<!-- @complexity -->
- time: O(n)
- space: O(n) explicit
- note: The practical answer, and it beats the recursion by a margin that grows with n — 143x at n = 100, 1,266x at n = 1,000 and 2,390x at n = 2,000. That growth is linear because this is O(n) and the recursion is O(n^2), a wider gap than Sort a stack faced, where the alternative was O(n log n).

<!-- @code cpp -->
```cpp
#include <stack>
#include <vector>
using namespace std;

void reverseStack(stack<int>& s) {
    vector<int> v;
    v.reserve(s.size());
    while (!s.empty()) { v.push_back(s.top()); s.pop(); }

    for (int x : v) s.push(x);        // pushing back in the SAME order reverses
}
```

<!-- @annotations -->
- 8: Draining visits top to bottom, so v holds the stack backwards already.
- 10: Pushing in that same order reverses a second time — and two reversals of the traversal direction leave the stack reversed relative to where it started.
- 7: reserve avoids the reallocation that would otherwise dominate a linear pass.

<!-- @code java -->
```java
static void reverseStack(Deque<Integer> s) {
    List<Integer> v = new ArrayList<>();
    while (!s.isEmpty()) v.add(s.pop());

    for (int x : v) s.push(x);
}
```

<!-- @annotations -->
- 3: Deque.pop removes from the head, so v is filled top-first exactly as in the C++ version.

<!-- @code python -->
```python
def reverse_stack(s):
    s.reverse()          # a list used as a stack is already the container
    return s


# Or s[::-1] for a copy. Measured at n = 300: list.reverse() 1,289ns
# against the recursive version's 10,398,922ns — a factor of 8,065.
```

<!-- @annotations -->
- 2: In Python the stack is a list, so the drain-and-refill collapses to one call and the constraint becomes visibly artificial.
- 6: The slice makes a copy rather than reversing in place, which is O(n) space instead of O(1).

<!-- @approach -->
### Optimal - Pop, Reverse the Rest, Insert at Bottom

<!-- @idea -->
Take the top off, reverse what remains, then push the removed element underneath everything.

<!-- @steps -->
1. Return immediately if the stack is empty.
2. Pop the top and hold it in a local.
3. Reverse the remaining stack recursively.
4. Insert the held element at the bottom of the result.
5. Inserting at the bottom is itself recursive — lift everything off, push, and replace.

<!-- @complexity -->
- time: O(n^2)
- space: O(n) call stack — peak depth exactly n + 1
- note: The intended answer under the no-extra-structure rule. Its cost is completely input-independent: pops and pushes are both exactly n(n+1)/2 and calls are (n+1)(n+2)/2, matched at every n tested, with a measured spread of zero across 5,000 random inputs. Neither call is in tail position, so -O2 cannot flatten it, and Python caps at 998 exactly as the sorting version did.

<!-- @code cpp -->
```cpp
#include <stack>
using namespace std;

void insertAtBottom(stack<int>& s, int x) {
    if (s.empty()) { s.push(x); return; }      // no comparison — always descend

    int t = s.top(); s.pop();
    insertAtBottom(s, x);
    s.push(t);                                 // the undo, on the way out
}

void reverseStack(stack<int>& s) {
    if (s.empty()) return;

    int t = s.top(); s.pop();
    reverseStack(s);
    insertAtBottom(s, t);
}
```

<!-- @annotations -->
- 5: The only base case is an empty stack, which is what makes this non-adaptive — there is no condition that can stop the descent early.
- 7: t holds one element per frame; at peak depth the whole stack is in the frames.
- 9: This push is why the frame must survive its own recursive call, and why -O2 cannot eliminate the recursion.
- 16: Popping the top and inserting it at the bottom is exactly what reversal means, applied one element at a time.

<!-- @code java -->
```java
static void insertAtBottom(Deque<Integer> s, int x) {
    if (s.isEmpty()) { s.push(x); return; }

    int t = s.pop();
    insertAtBottom(s, x);
    s.push(t);
}

static void reverseStack(Deque<Integer> s) {
    if (s.isEmpty()) return;

    int t = s.pop();
    reverseStack(s);
    insertAtBottom(s, t);
}
```

<!-- @annotations -->
- 1: Deque rather than the legacy Stack class, whose iteration order is bottom-to-top and reads backwards from what push and pop suggest.

<!-- @code python -->
```python
def insert_at_bottom(s, x):
    if not s:
        s.append(x)
        return
    t = s.pop()
    insert_at_bottom(s, x)
    s.append(t)


def reverse_stack(s):
    if not s:
        return
    t = s.pop()
    reverse_stack(s)
    insert_at_bottom(s, t)


# Peak depth n + 1, so the default recursion limit of 1,000 caps this
# at 998 — identical to the sorting version, since the depth is the same.
```

<!-- @annotations -->
- 2: not s is the empty test, and append/pop at the end make a list behave as a stack with index −1 as the top.
- 19: The cap does not depend on the input at all here, because neither the depth nor the work varies with the values.

<!-- @approach -->
### Insert at Bottom Iteratively

<!-- @idea -->
Replace the inner recursion with a loop, and watch the hidden container appear.

<!-- @steps -->
1. Keep the outer reversal recursive.
2. Rewrite the bottom-insert as a loop that empties the stack into a holding area.
3. Push the new element onto the now-empty stack.
4. Push everything back from the holding area.
5. Note that the holding area is the storage the recursion was keeping in its frames.

<!-- @complexity -->
- time: O(n^2)
- space: O(n) call stack plus O(n) explicit
- note: Written to make the point rather than to be used — the held stack it forces you to declare is exactly the chain of locals the recursive version was using. Measured 6,718,048ns at n = 1,000 against the fully recursive 10,389,402ns, so removing the inner recursion is worth about 1.55x. It also breaks the problem's rule, which is the honest observation: the rule was only ever met by hiding the container in the call stack.

<!-- @code cpp -->
```cpp
#include <stack>
using namespace std;

void insertAtBottomIter(stack<int>& s, int x) {
    stack<int> held;                              // the frames, made visible
    while (!s.empty()) { held.push(s.top()); s.pop(); }

    s.push(x);
    while (!held.empty()) { s.push(held.top()); held.pop(); }
}

void reverseStack(stack<int>& s) {
    if (s.empty()) return;

    int t = s.top(); s.pop();
    reverseStack(s);
    insertAtBottomIter(s, t);
}
```

<!-- @annotations -->
- 5: One declaration replaces n frames of storage — the recursion was never using less space, only less visible space.
- 6: The loop empties the stack unconditionally, which is the iterative form of having no comparison.
- 9: Draining held back into s restores the original order, because the two transfers reverse it twice.

<!-- @code java -->
```java
static void insertAtBottomIter(Deque<Integer> s, int x) {
    Deque<Integer> held = new ArrayDeque<>();
    while (!s.isEmpty()) held.push(s.pop());

    s.push(x);
    while (!held.isEmpty()) s.push(held.pop());
}
```

<!-- @annotations -->
- 2: ArrayDeque is the structure the recursion was simulating with its frames.

<!-- @code python -->
```python
def insert_at_bottom_iter(s, x):
    held = []
    while s:
        held.append(s.pop())
    s.append(x)
    while held:
        s.append(held.pop())


def reverse_stack(s):
    if not s:
        return
    t = s.pop()
    reverse_stack(s)
    insert_at_bottom_iter(s, t)
```

<!-- @annotations -->
- 2: held is the explicit form of what the recursive insert kept in its frames.
- 11: The outer recursion still runs n deep, so Python's limit of 998 still applies — only half the depth was removed.

<!-- @approach -->
### Reverse the Underlying Container

<!-- @idea -->
If you own the container type, reverse it directly.

<!-- @steps -->
1. Note that a stack is an adaptor over a container, not a distinct structure.
2. Use a container that exposes its elements, such as a deque or a vector.
3. Reverse it in place with the standard algorithm.
4. Nothing is copied and nothing is allocated.
5. This is unavailable through std::stack, which deliberately hides its container.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The fastest option by a wide margin — 855ns at n = 1,000 against the recursion's 10,389,402ns, a factor of 12,151. It is included to make the constraint visible for what it is: a stack is an adaptor, and the moment you can see the elements, reversing is a single linear pass with no extra space at all. The recursive version exists because std::stack refuses to show you the container.

<!-- @code cpp -->
```cpp
#include <deque>
#include <algorithm>
using namespace std;

void reverseStack(deque<int>& d) {
    reverse(d.begin(), d.end());
}

// std::stack deliberately hides its container, which is why the
// recursive version exists at all — but the container is still there.
```

<!-- @annotations -->
- 6: One linear pass, swapping from both ends inward — the same two-pointer walk as Reverse an array.
- 9: std::stack's protected member c holds exactly this deque; the adaptor's whole purpose is to deny access to it.

<!-- @code java -->
```java
static void reverseStack(List<Integer> list) {
    Collections.reverse(list);
}
```

<!-- @annotations -->
- 2: Collections.reverse works in place on any List, so a stack backed by an ArrayList reverses in a single pass.

<!-- @code python -->
```python
def reverse_stack(s):
    s.reverse()
    return s


# In Python this is the same function as the brute-force approach,
# because a list IS the container — there is no adaptor hiding it.
```

<!-- @annotations -->
- 2: Python never had the constraint to begin with, which is why the first and last approaches coincide here.

<!-- @example -->

<!-- @input -->
bottom → [1, 2, 3, 4] ← top

<!-- @output -->
bottom → [4, 3, 2, 1] ← top, from 10 pops and 10 pushes

<!-- @why -->
The smallest trace that shows insertAtBottom descending the full stack every time, which is what makes the cost independent of the input.

<!-- @walkthrough -->
1. reverseStack pops 4 and holds it, then recurses on [1, 2, 3].
2. That pops 3, recurses on [1, 2], which pops 2 and recurses on [1], which pops 1 and recurses on the empty stack.
3. Four locals now hold 4, 3, 2 and 1 — the whole stack is in the frames.
4. Unwinding, 1 is inserted at the bottom of an empty stack, giving [1].
5. Then 2 is inserted at the bottom: 1 is lifted off, 2 is pushed, 1 is replaced — giving [2, 1].
6. Then 3: both 1 and 2 are lifted, 3 is pushed, and they are replaced — [3, 2, 1].
7. Finally 4 lifts all three, is pushed, and they are replaced — [4, 3, 2, 1], for 10 pops and 10 pushes, which is n(n+1)/2 each.

<!-- @example -->

<!-- @input -->
Four different stacks of the same length

<!-- @output -->
Exactly the same cost for all of them

<!-- @why -->
It isolates what the comparison was doing in the sorting version — the difference between an adaptive algorithm and a structural one.

<!-- @walkthrough -->
1. insertAtBottom has only one base case, an empty stack, so it always descends the whole way.
2. There is no condition that can stop it early, whatever the values happen to be.
3. Measured on four different four-element stacks — sorted, reversed, mixed and all-equal — each took 10 pops, 10 pushes and 15 calls with a peak depth of 5.
4. Across 5,000 random stacks of 12 elements the total of pops and pushes ranged from 156 to 156, a spread of zero.
5. The sorting version on the same 5,000 inputs ranged from 8 lifts to 55, a spread of 47.
6. So sorting's cost is a property of the data and reversing's is a property of the length alone.
7. That also means reversing has no best case to exploit: an already-reversed stack costs exactly as much as any other.

<!-- @example -->

<!-- @input -->
The recursion against a linear alternative, at four sizes

<!-- @output -->
143x, 636x, 1,266x and 2,390x — the gap grows linearly

<!-- @why -->
It shows that this is a worse trade than the sorting version made, and quantifies why: the alternative here is linear rather than linearithmic.

<!-- @walkthrough -->
1. Draining a stack into a vector and pushing the elements back in the same order reverses it, in one linear pass.
2. Measured, that took 814ns at n = 100 against the recursion's 116,390ns.
3. At n = 1,000 the figures are 8,204ns and 10,389,402ns, a factor of 1,266.
4. At n = 2,000 they are 15,708ns and 37,538,417ns, a factor of 2,390.
5. The ratio roughly doubles as n doubles, which is what O(n^2) against O(n) looks like.
6. Sort a stack's equivalent ratios were 23.9x, 112.7x, 195x and 314.4x — growing more slowly, because there the comparison was against O(n log n).
7. And reversing the underlying container directly costs 855ns at n = 1,000, making the recursion 12,151x slower than the best available option.

<!-- @example -->

<!-- @input -->
The operation counts as n grows

<!-- @output -->
n(n+1)/2 pops, n(n+1)/2 pushes, (n+1)(n+2)/2 calls

<!-- @why -->
Both are exact formulas rather than bounds, and the first is a number this curriculum has met before in a completely different role.

<!-- @walkthrough -->
1. insertAtBottom on a stack of k elements performs k pops and k+1 pushes, because it empties the stack and then rebuilds it with one extra element.
2. It is called once for each k from 0 to n−1, as reverseStack unwinds.
3. Summing k from 0 to n−1 gives n(n−1)/2, and adding the n pops from reverseStack itself gives n(n+1)/2.
4. Measured, that is 10 at n = 4, 55 at n = 10, 210 at n = 20 and 1,275 at n = 50 — matching exactly.
5. The call count works out to (n+1)(n+2)/2, which is 15, 66, 231 and 1,326 at those same sizes.
6. Both are triangular numbers, and n(n+1)/2 is the same expression Sum of First N Numbers was entirely about.
7. There it was the answer being computed; here it is the cost of computing something else, which is a good reminder that the same formula turns up in unrelated places.

<!-- @visualization custom -->

<!-- @description -->
Open by placing this beside the sorting version from the previous subtopic, with both sets of code shown and the comparison in insertSorted highlighted and then struck out — that deletion is the entire difference and should be the first thing established. Then the main animation: the stack as a vertical pile on the left and the call frames as a column on the right, running [1,2,3,4]. As reverseStack descends, each popped value slides out of the pile into a frame slot, so the pile empties and the frames fill with 4, 3, 2, 1. Unwinding, show each insertAtBottom as a complete drain and rebuild — the entire remaining pile lifts off into a second temporary column, the held value drops to the floor of the stack, and the lifted elements settle back on top of it. The key visual is that this drain is total every time: no element is ever left in place, which is what the missing comparison means. Run a counter for pops and pushes that ends at 10 and 10 for n = 4. Beside it, the adaptivity panel: four different four-element stacks — sorted, reversed, mixed, all-equal — each with its cost bar, and all four bars identical, against the sorting version where the same four inputs give bars of visibly different lengths. Put the measured spreads underneath, 0 against 47 over 5,000 random twelve-element inputs. Then the growth panel: a log-scale chart of drain-and-push against the recursion at n = 100, 500, 1,000 and 2,000, annotated 143x, 636x, 1,266x, 2,390x, with a second faint line showing the sorting subtopic's 23.9x to 314.4x so the reader sees this gap widening faster. Finally a small panel for the formulas: a triangular arrangement of dots totalling n(n+1)/2 with a note that this is the same expression Sum of First N Numbers computed, here appearing as the cost rather than the answer.

<!-- @sampleInput -->
```json
{"primary":{"input":[1,2,3,4],"inputOrder":"bottom to top","result":[4,3,2,1],"pops":10,"pushes":10,"calls":15,"peakDepth":5,"descent":[{"call":"reverseStack([1,2,3,4])","pops":4},{"call":"reverseStack([1,2,3])","pops":3},{"call":"reverseStack([1,2])","pops":2},{"call":"reverseStack([1])","pops":1},{"call":"reverseStack([])","baseCase":true}],"heldInFrames":[4,3,2,1],"unwind":[{"insertAtBottom":1,"into":[],"lifted":[],"result":[1]},{"insertAtBottom":2,"into":[1],"lifted":[1],"result":[2,1]},{"insertAtBottom":3,"into":[2,1],"lifted":[1,2],"result":[3,2,1]},{"insertAtBottom":4,"into":[3,2,1],"lifted":[1,2,3],"result":[4,3,2,1]}]},"differenceFromSorting":{"deleted":"the comparison in insertSorted","sortingBaseCase":"s.empty() || s.top() <= x","reversingBaseCase":"s.empty()","consequence":"no condition can stop the descent, so every element is lifted every time"},"nonAdaptive":{"sameLengthSameCost":[{"input":[1,2,3,4],"label":"sorted","pops":10,"pushes":10,"calls":15,"peakDepth":5},{"input":[4,3,2,1],"label":"reversed","pops":10,"pushes":10,"calls":15,"peakDepth":5},{"input":[2,1,4,3],"label":"mixed","pops":10,"pushes":10,"calls":15,"peakDepth":5},{"input":[7,7,7,7],"label":"all equal","pops":10,"pushes":10,"calls":15,"peakDepth":5}],"variance":{"trials":5000,"n":12,"reverse":{"metric":"pops + pushes","min":156,"max":156,"spread":0},"sort":{"metric":"elements lifted","min":8,"max":55,"spread":47}},"reading":"sorting's cost is a property of the data; reversing's is a property of the length"},"exactCounts":{"pops":"n(n+1)/2","pushes":"n(n+1)/2","calls":"(n+1)(n+2)/2","rows":[{"n":4,"pops":10,"pushes":10,"calls":15},{"n":10,"pops":55,"pushes":55,"calls":66},{"n":20,"pops":210,"pushes":210,"calls":231},{"n":50,"pops":1275,"pushes":1275,"calls":1326}],"derivation":"insertAtBottom on k elements does k pops and k+1 pushes, and runs once for each k from 0 to n-1","echoes":"n(n+1)/2 is the expression Sum of First N Numbers computed — here it is the cost rather than the answer"},"timing":{"unit":"ns","rows":[{"n":100,"drainAndPush":814,"fullyRecursive":116390,"hybridInsert":109555,"reverseContainer":233,"ratio":143},{"n":500,"drainAndPush":3796,"fullyRecursive":2413492,"hybridInsert":2203789,"reverseContainer":818,"ratio":636},{"n":1000,"drainAndPush":8204,"fullyRecursive":10389402,"hybridInsert":6718048,"reverseContainer":855,"ratio":1266},{"n":2000,"drainAndPush":15708,"fullyRecursive":37538417,"hybridInsert":24092115,"reverseContainer":2216,"ratio":2390}],"recursiveOverReverseContainerAtN1000":12151,"growth":"linear in n, because this is O(n^2) against O(n)","sortSubtopicForComparison":{"ratios":[23.9,112.7,195,314.4],"why":"there the alternative was O(n log n), so the gap widened more slowly"}},"structuralCarryOver":{"peakDepth":"n + 1","whyNotTwoN":"insertAtBottom only descends after reverseStack has unwound","tailCall":false,"whyO2CannotHelp":"each frame pushes its element back after the recursive call returns","python":{"defaultLimit":1000,"largestReversible":998,"sameAsSorting":true,"n300":{"recursiveNs":10398922,"listReverseNs":1289,"ratio":8065}}},"whatItTeaches":{"pattern":"lift everything off, do one thing, put it all back","framesHold":"the elements lifted, one per frame","sameShapeAs":"backtracking — choose, recurse, undo","theUndoStep":"s.push(t) on the way out is the same move as pop_back in the subsequence recursions"},"verification":{"randomStacks":5000,"maxN":24,"includes":["duplicates","negatives","empty"],"formsAgreeing":3}}
```

<!-- @highlights -->
- The sorting version sits alongside, with the comparison in insertSorted highlighted and then struck out.
- That deletion is the entire difference between the two subtopics and is established first.
- The stack is a vertical pile on the left, the call frames a column on the right.
- Running [1,2,3,4], each popped value slides out of the pile into a frame slot until the frames hold 4, 3, 2, 1.
- Each insertAtBottom is drawn as a complete drain and rebuild rather than a partial walk.
- The entire remaining pile lifts into a temporary column, the held value drops to the floor, and the lifted elements settle back on top.
- The drain is total every time, which is what the missing comparison means visually.
- Counters for pops and pushes end at 10 and 10 for n = 4.
- The adaptivity panel shows four different four-element stacks with identical cost bars.
- Beside it the sorting version gives visibly different bar lengths for the same four inputs.
- The measured spreads sit underneath: 0 against 47 over 5,000 random twelve-element inputs.
- A log-scale growth chart plots drain-and-push against the recursion at n = 100, 500, 1,000 and 2,000.
- It is annotated 143x, 636x, 1,266x and 2,390x.
- A faint second line shows the sorting subtopic's 23.9x to 314.4x, so this gap is visibly widening faster.
- A formula panel arranges dots into a triangle totalling n(n+1)/2.
- A note records that this is the expression Sum of First N Numbers computed, appearing here as the cost rather than the answer.

<!-- @edgeCases -->
- An empty stack — the base case returns at once and nothing is inserted.
- A single element — one frame, one push, and insertAtBottom hits the empty branch immediately.
- Two elements — the smallest input where anything is lifted, and [1,2] specifically is the smallest that distinguishes reversing from sorting.
- All elements equal — costs exactly the same as any other input of that length, unlike the sorting version where it costs nothing.
- An already-reversed stack — also costs the same, since there is no best case to detect.
- Duplicate values — no comparison is performed, so duplicates are irrelevant here.
- Negative values — likewise irrelevant, since only positions matter.
- n near 998 in Python — the default recursion limit, identical to the sorting version's.
- Large n in C++ — the cost is quadratic, so a stack of 100,000 does five billion pops and pushes before depth becomes the issue.
- Using std::stack and expecting to reach the container — the adaptor hides it deliberately, which is what makes the recursive approach necessary.
- Reversing a list in Python with s = s[::-1] inside a function — rebinds the local name and leaves the caller's list untouched.

<!-- @pitfalls -->
- Writing insertAtBottom with a comparison copied from the sorting version. It then places elements by value rather than at the bottom, which sorts instead of reversing.
- Expecting a best case. The cost is n(n+1)/2 pops and pushes for every input of length n — measured spread zero across 5,000 random cases.
- Forgetting the push on the way out. Without it the lifted elements are discarded and the stack shrinks to one element.
- Using this to reverse anything in practice. Draining and pushing back is O(n) and measured 1,266x faster at n = 1,000, with the gap growing linearly.
- Believing the no-extra-structure claim. The frames hold one element each, so the space is O(n) — rewriting the insert as a loop makes the container appear immediately.
- Expecting -O2 to remove the depth limit. Each frame pushes its element back after the recursive call, so neither call is in tail position.
- Assuming the peak depth is 2n. It is n + 1, because insertAtBottom only descends once reverseStack has unwound.
- Reaching for java.util.Stack. Its iterator runs bottom-to-top, which reads backwards from what push and pop imply and makes debugging output misleading.
- Writing s = s[::-1] inside a Python function. That rebinds the parameter and the caller sees no change; s[:] = s[::-1] or s.reverse() modifies in place.
- Testing only with distinct values. Nothing here depends on the values, so an all-equal stack is a perfectly good test — and a useless one for the sorting version.
- Assuming reversing is cheaper than sorting because it does less thinking. It does strictly more work than sorting an already-sorted stack, which costs zero lifts.
- Trying to make either call a tail call. The element has to go back after the recursive call returns, so no rearrangement achieves it.

<!-- @doubt -->
### How is this different from sorting a stack?

<!-- @answer -->
One line: insertAtBottom has no comparison. Where insertSorted stopped as soon as it found an element small enough, insertAtBottom always descends to the empty stack, pushes, and rebuilds. That single deletion removes the adaptivity — sorting's cost was the inversion count, which ranges from 0 to n(n−1)/2, while reversing costs exactly n(n+1)/2 pops and n(n+1)/2 pushes for every input of the same length. Measured over 5,000 random twelve-element stacks, reversing's total ranged from 156 to 156, a spread of zero, against sorting's 8 to 55.

<!-- @doubt -->
### Why is the cost the same for every input?

<!-- @answer -->
Because nothing in the algorithm inspects a value. insertAtBottom's only base case is an empty stack, so it lifts every element off every time regardless of what they are. That makes the work a function of the length alone: n(n+1)/2 pops, n(n+1)/2 pushes and (n+1)(n+2)/2 calls, matched exactly at n = 4, 10, 20 and 50. It also means there is no input worth optimising for — an already-reversed stack costs exactly what a sorted one does, which is the opposite of the sorting version where an already-sorted stack cost nothing at all.

<!-- @doubt -->
### Where does n(n+1)/2 come from?

<!-- @answer -->
insertAtBottom on a stack of k elements does k pops to empty it and k+1 pushes to rebuild it with the new element underneath. As reverseStack unwinds, it calls insertAtBottom once for each k from 0 to n−1, so the pops sum to n(n−1)/2. Adding the n pops that reverseStack itself performs on the way down gives n(n+1)/2. It is worth noticing that this is the same expression Sum of First N Numbers spent an entire subtopic computing — there it was the answer, and here it is the price of doing something unrelated.

<!-- @doubt -->
### Is the recursion worth it here?

<!-- @answer -->
Less than in the sorting version, and that one was already a constraint exercise rather than an engineering choice. Draining a stack into a vector and pushing the elements back in the same order reverses it in a single linear pass — measured 8,204ns at n = 1,000 against the recursion's 10,389,402ns, a factor of 1,266. Because this is O(n²) against O(n), the gap grows linearly: 143x at n = 100, 636x at 500, 1,266x at 1,000 and 2,390x at 2,000. Sorting's equivalent ratios grew more slowly, from 23.9x to 314.4x, because its alternative was O(n log n) rather than O(n).

<!-- @doubt -->
### Why does pushing back in the same order reverse it?

<!-- @answer -->
Because draining already reverses once. Popping visits the elements from top to bottom, so the vector holds them backwards relative to the stack's bottom-to-top order. Pushing them back in that same order reverses a second time — and reversing the traversal direction twice leaves the stack itself reversed relative to where it started. It reads like it should be a no-op and is not, which is why it is worth doing slowly the first time. Pushing them back in reverse order is what restores the original.

<!-- @doubt -->
### What is the point of the constraint at all?

<!-- @answer -->
It forces you to notice that the call stack is storage. Two subtopics in a row have used it that way, and this one isolates the idea because nothing else is happening — no comparison, no sorting, just lift everything off, do one thing, put it all back. That pattern is exactly backtracking: choose, recurse, undo. The elements held in insertAtBottom's frames are the same thing as a partial solution held in a search's frames, and the s.push(t) on the way out is the same undo step the subsequence recursions performed with pop_back. Once that clicks, the rest of this topic is easier.

<!-- @doubt -->
### Can I reverse a std::stack without any of this?

<!-- @answer -->
Not through std::stack, and that is deliberate. A stack is an adaptor over a container — its protected member c is usually a deque — and the adaptor exists precisely to deny access to it. If you own the type, reversing the container directly is one linear pass with no extra space at all, measured 855ns at n = 1,000, which makes the recursion 12,151x slower than the best available option. In Python the question does not arise, because a list is the container: list.reverse() measured 1,289ns at n = 300 against the recursion's 10,398,922ns, a factor of 8,065.

<!-- @doubt -->
### Why can't -O2 flatten this either?

<!-- @answer -->
Same reason as the sorting version: neither call is in tail position. reverseStack calls itself and then calls insertAtBottom; insertAtBottom calls itself and then pushes the held element back. A frame that still has to put its element back cannot be discarded, so there is no tail call to eliminate and the depth limit stands at both optimisation levels. The peak depth is n + 1 — not 2n, because insertAtBottom only descends after reverseStack has already unwound — and Python caps at 998, exactly as the sorting version did, since the depth does not depend on the input.

<!-- @doubt -->
### What breaks if I copy insertSorted by mistake?

<!-- @answer -->
You get a sorted stack rather than a reversed one, which is a particularly confusing bug because the output is plausible and the code looks right. The two functions differ only in the base-case condition — s.empty() versus s.empty() || s.top() <= x — so the mistake is a single clause. The tell is that the result comes out sorted regardless of the input order, and that an already-sorted input appears to be handled instantly. Note which inputs cannot catch it: [2,1] reverses to [1,2] and also sorts to [1,2], so it agrees either way. The smallest input that separates the two is [1,2] — already sorted — which reverses to [2,1] and sorts to [1,2]. Testing with descending data will not find this bug.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Generate Binary Strings Without Consecutive 1s, which returns to the take/skip tree from the subsequence subtopics but adds the first genuine constraint between successive choices — a decision is only legal if the previous one permits it. That prunes the complete binary tree into a partial one, and the number of leaves stops being 2^n. What it becomes is a Fibonacci number, which connects the counting half of this topic to the tree half in a way none of the earlier subtopics has done.
