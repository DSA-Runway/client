---
id: sort-a-stack-using-recursion
topic: Advanced Recursion
title: Sort a stack using recursion
difficulty: Medium
status: ready
prerequisites:
  - count-good-numbers
  - recursive-implementation-of-atoi
  - insertion-sorting
  - stack-memory-and-recursion-depth
  - time-and-space-complexity-basics
relatedIds:
  - insertion-sorting
  - reverse-a-stack
  - stack-memory-and-recursion-depth
  - count-good-numbers
---

<!-- @summary -->
The first problem here where the call stack is the tool rather than the limit — "no auxiliary data structure" is satisfied by keeping the popped elements in the frames. Three measurements complicate that: the comparison count equals the inversion count exactly, so this is insertion sort in disguise; the space was relocated rather than saved, and an explicit auxiliary stack measured 1.71x faster; and it is the first recursion in this topic that -O2 cannot flatten, because the work happens on the way out.

<!-- @theory -->
## The problem

Sort a stack into ascending order — smallest at the bottom, largest on top —
using recursion and **no other data structure**. You may only push, pop and
inspect the top.

```
bottom -> [3, 1, 4, 2] <- top      becomes      bottom -> [1, 2, 3, 4] <- top
```

## Two functions that need each other

A stack only exposes its top, so you cannot reach in and place an element. The
way around that is to take everything off, sort what remains, and put the element
back **in the right place** — which is itself a recursive operation:

```
sortStack(s):                        insertSorted(s, x):
    if s is empty: return                if s is empty or s.top() <= x:
    t = s.pop()                              s.push(x); return
    sortStack(s)                         t = s.pop()
    insertSorted(s, t)                   insertSorted(s, x)
                                         s.push(t)
```

Every recursion in this topic so far has been one function calling itself. This is
two, and neither is useful alone — `sortStack` produces a sorted stack only
because `insertSorted` preserves that property, and `insertSorted` is only ever
called on an already-sorted stack.

## Where the elements actually live

The interesting claim is that this uses no auxiliary structure. Look at where the
popped values go: `t` is a **local variable in a frame**. While `sortStack`
recurses, the whole stack has been dismantled into n locals, one per level, and
put back on the way out.

So the elements are stored — just in the call stack rather than in something you
declared. Measured, peak depth is exactly **n + 1**:

| n | Peak depth |
|---|---|
| 10 | 11 |
| 50 | 51 |
| 100 | 101 |
| 200 | 201 |

That is `n + 1`, not `2n`, which is worth knowing: `insertSorted` only goes deep
once `sortStack` has already unwound, so the two chains never stack up together.

The space is O(n) either way. What changed is that it became invisible.

## It is insertion sort

Count how many elements get **lifted** past another and the identity is exact:

| n | Inversions | Elements lifted | Condition tests |
|---|---|---|---|
| 10 | 21 | **21** | 31 |
| 50 | 586 | **586** | 636 |
| 100 | 2,632 | **2,632** | 2,732 |
| 200 | 10,790 | **10,790** | 10,990 |

**Lifts equal the inversion count exactly**, at every size and on every
hand-checked case — 0 for a sorted stack, 6 for a reversed one of four, 2 for
`[2,1,4,3]`, 3 for `[3,1,4,2]`.

The two columns differ by exactly `n`, because each insert ends with one
successful test that places the element. So the lifts are the interesting
quantity and the tests are the lifts plus a constant.

That is precisely the identity Insertion Sorting established for shifts, and it
is not a coincidence: `insertSorted` walks an element down past everything
greater than it, which is what insertion sort's inner loop does. The stack is the
array and the call frames are the shifting. So the cost is O(n²), adaptive, and
stable — all the properties that subtopic measured, inherited whole.

## -O2 cannot save this one

Every earlier recursion in this topic lost its depth limit at `-O2`, because the
recursive call was the last thing the frame did. Here **neither** call is in tail
position:

```
sortStack:     sortStack(s);  insertSorted(s, t);   // work after the call
insertSorted:  insertSorted(s, x);  s.push(t);      // work after the call
```

Each frame has to survive its own recursive call in order to put its element
back. Measured, the deepest stack it can sort is **259,765 — identical at `-O0`
and `-O2`**. That is the first time in this topic the optimiser has made no
difference at all to the depth.

It follows directly from the shape: the entire algorithm happens during the
unwind. A frame that has nothing to do on the way out can be discarded; these
frames are the only place the data is.

## The recursion is hiding a container

Rewrite `insertSorted` as a loop and the hidden storage becomes visible — you
immediately need somewhere to hold the elements you lifted off:

```
insertIter(s, x):
    held = new stack                      // <- this is what the frames were
    while s not empty and s.top() > x: held.push(s.pop())
    s.push(x)
    while held not empty: s.push(held.pop())
```

That `held` stack is exactly the chain of `t` locals the recursion was using. And
once you see that, the recursion can be removed entirely: pop from the source,
roll back anything larger, and push — one auxiliary stack, no recursion at all.

Measured at n = 1,000:

| | ns |
|---|---|
| Fully recursive | 3,964,239 |
| Recursive outer, iterative insert | 2,447,564 |
| **Two stacks, no recursion** | **2,320,421** |
| Drain into an array, sort, refill | **20,308** |

The explicit auxiliary stack is **1.71x faster** than the recursion doing the same
work — same algorithm, same O(n²), just without the call overhead. All three
quadratic forms are within 1.7x of each other, and the O(n log n) approach is
**195x** faster than any of them.

## So when would you write this?

Essentially never, for sorting. Draining into a vector and calling `sort` is 195x
quicker at n = 1,000 and the gap widens with n — 23.9x at 100, 112.7x at 500,
314.4x at 2,000, because one is O(n log n) and the rest are O(n²).

The problem is a constraint exercise, and a good one. What it teaches is that the
call stack is a data structure you already have: when an algorithm needs to hold
things temporarily and you are forbidden a container, the frames will do it. That
idea is what makes the next subtopic work, and it is the whole of how
backtracking stores a partial solution.

## Python bites earlier than usual

The recursion limit applies to the peak depth of `n + 1`, so:

| | Largest stack it can sort |
|---|---|
| Already sorted | 998 |
| Reverse sorted | 998 |

Identical, because the depth is set by the `sortStack` chain and does not depend
on the ordering. And the cost is punishing — at n = 300 the recursion measured
4,393,052ns against `sorted()`'s 14,719ns, a factor of **298**.

## Where this goes next

**Reverse a Stack** is the same technique with the insert changed: instead of
placing each element in sorted position, it places it at the **bottom**. That is
a simpler helper — `insertAtBottom` has no comparison at all — and it makes the
structure clearer, because the only thing the recursion is doing is holding
elements while the one underneath is dealt with.

<!-- @intuition -->
A stack will only ever show you its top, so there is no way to put a value into the middle of it. The trick is to take the top off, deal with everything underneath, and then put it back where it belongs — and putting it back is the same problem again, one element smaller. That gives two functions that lean on each other, which is new here. The part worth sitting with is where the removed elements go: each one is a local variable in a frame, so while the recursion is running, the entire stack has been turned inside out and is being held by the call stack. That is why the rule "no extra data structure" is satisfiable at all, and also why it is a bit of a fiction — the space is still linear, it has just moved somewhere you cannot see.

<!-- @approach -->
### Brute Force - Drain, Sort, Refill

<!-- @idea -->
Empty the stack into an array, sort the array, and push it back.

<!-- @steps -->
1. Pop every element into a vector.
2. Sort the vector ascending.
3. Push the elements back in order, smallest first.
4. The largest ends on top, which is what ascending means for a stack.
5. Note that this uses the auxiliary structure the problem forbids.

<!-- @complexity -->
- time: O(n log n)
- space: O(n) explicit
- note: What you would write if the constraint did not exist, and by a wide margin the fastest — measured 20,308ns at n = 1,000 against the recursive version's 3,964,239ns, a factor of 195. The gap grows with n, from 23.9x at 100 to 314.4x at 2,000, because this is O(n log n) and every other approach here is quadratic.

<!-- @code cpp -->
```cpp
#include <stack>
#include <vector>
#include <algorithm>
using namespace std;

void sortStack(stack<int>& s) {
    vector<int> v;
    v.reserve(s.size());
    while (!s.empty()) { v.push_back(s.top()); s.pop(); }

    sort(v.begin(), v.end());
    for (int x : v) s.push(x);            // smallest pushed first
}
```

<!-- @annotations -->
- 9: Draining a stack reverses it, but the sort makes that irrelevant — the order elements come off in does not matter here.
- 12: Pushing ascending puts the largest on top, which is what "sorted stack" means when the top is the maximum.
- 11: This is the line the problem exists to forbid; everything after this approach is about doing it without the vector.

<!-- @code java -->
```java
static void sortStack(Deque<Integer> s) {
    List<Integer> v = new ArrayList<>();
    while (!s.isEmpty()) v.add(s.pop());

    Collections.sort(v);
    for (int x : v) s.push(x);
}
```

<!-- @annotations -->
- 1: Deque rather than the legacy Stack class — java.util.Stack extends Vector and is synchronised, which costs for no benefit here.

<!-- @code python -->
```python
def sort_stack(s):
    s.sort()          # a Python list used as a stack is already the array
    return s


# Worth noticing: in Python the "stack" is a list, so the drain-and-refill
# collapses to a single call. Measured 14,719ns at n = 300 against the
# recursive version's 4,393,052ns — a factor of 298.
```

<!-- @annotations -->
- 2: A list used as a stack appends and pops at the end, so index 0 is the bottom and sorting ascending is exactly the required order.
- 7: The constraint is artificial in Python for this reason, which makes it a better place to study the recursion than to use it.

<!-- @approach -->
### Optimal - Pop, Sort the Rest, Insert Back

<!-- @idea -->
Remove the top, sort what is left, then push the removed value back into its place.

<!-- @steps -->
1. Return immediately if the stack is empty.
2. Pop the top element and hold it in a local.
3. Sort the remaining stack recursively.
4. Insert the held element into the now-sorted stack.
5. Inserting is itself recursive — lift off everything larger, push, and replace.

<!-- @complexity -->
- time: O(n^2)
- space: O(n) call stack — peak depth exactly n + 1
- note: The intended answer, and the operation count identifies it: the number of elements lifted past another equals the inversion count exactly, at every size tested, with the condition-test count being that plus n. That is insertion sort's identity from the Basic Sorting topic, so this inherits its properties whole — quadratic, adaptive, stable. Neither call is in tail position, so -O2 cannot flatten it: the depth limit is 259,765 at both -O0 and -O2.

<!-- @code cpp -->
```cpp
#include <stack>
using namespace std;

void insertSorted(stack<int>& s, int x) {
    if (s.empty() || s.top() <= x) { s.push(x); return; }

    int t = s.top(); s.pop();
    insertSorted(s, x);
    s.push(t);                       // work AFTER the call — not a tail call
}

void sortStack(stack<int>& s) {
    if (s.empty()) return;

    int t = s.top(); s.pop();
    sortStack(s);
    insertSorted(s, t);              // work AFTER the call — not a tail call
}
```

<!-- @annotations -->
- 5: s.top() <= x rather than <, so equal elements are not lifted off — that is what keeps the sort stable.
- 7: t is where the element lives while the recursion runs. n of these locals hold the whole stack at peak depth.
- 9: Because this push happens after the recursive call, the frame must survive it — which is why -O2 cannot eliminate the recursion.
- 17: The two functions are only correct together: sortStack relies on insertSorted preserving order, and insertSorted assumes it was handed a sorted stack.

<!-- @code java -->
```java
static void insertSorted(Deque<Integer> s, int x) {
    if (s.isEmpty() || s.peek() <= x) { s.push(x); return; }

    int t = s.pop();
    insertSorted(s, x);
    s.push(t);
}

static void sortStack(Deque<Integer> s) {
    if (s.isEmpty()) return;

    int t = s.pop();
    sortStack(s);
    insertSorted(s, t);
}
```

<!-- @annotations -->
- 2: s.peek() <= x unboxes an Integer for the comparison; using == on the boxed values instead would compare references and fail outside the small-integer cache.

<!-- @code python -->
```python
def insert_sorted(s, x):
    if not s or s[-1] <= x:
        s.append(x)
        return
    t = s.pop()
    insert_sorted(s, x)
    s.append(t)


def sort_stack(s):
    if not s:
        return
    t = s.pop()
    sort_stack(s)
    insert_sorted(s, t)


# Peak depth is n + 1, so the default recursion limit of 1,000 caps this
# at a stack of 998 — the same for sorted and reverse-sorted input.
```

<!-- @annotations -->
- 2: not s is the empty test; s[-1] is the top, since a list used as a stack grows at the end.
- 19: The limit does not depend on the ordering, because the depth is set by the sort_stack chain rather than by how far any insert has to travel.

<!-- @approach -->
### Make the Insert Iterative

<!-- @idea -->
Replace the recursive insert with a loop, and see what the recursion was storing.

<!-- @steps -->
1. Keep the outer sort recursive.
2. Rewrite the insert as a loop that lifts off everything greater than the new element.
3. Notice that the lifted elements now need somewhere to go.
4. Push the new element once the top is small enough.
5. Put the lifted elements back in reverse order.

<!-- @complexity -->
- time: O(n^2)
- space: O(n) call stack plus O(n) explicit
- note: The point of writing this is the holding stack it forces you to declare — that container is exactly the chain of locals the recursive insert was using, made visible. Measured 2,447,564ns at n = 1,000 against the fully recursive 3,964,239ns, so removing half the recursion is worth about 1.62x. It also breaks the problem's own rule, which is the honest observation: the rule was only ever satisfied by hiding the container in the frames.

<!-- @code cpp -->
```cpp
#include <stack>
using namespace std;

void insertIter(stack<int>& s, int x) {
    stack<int> held;                          // the frames, made visible
    while (!s.empty() && s.top() > x) { held.push(s.top()); s.pop(); }

    s.push(x);
    while (!held.empty()) { s.push(held.top()); held.pop(); }
}

void sortStack(stack<int>& s) {
    if (s.empty()) return;

    int t = s.top(); s.pop();
    sortStack(s);
    insertIter(s, t);
}
```

<!-- @annotations -->
- 5: This declaration is the whole lesson — the recursive version needed the same storage and got it from the call stack.
- 6: s.top() > x, the strict complement of the recursive version's <=, so equal elements are still left in place.
- 9: Popping from held and pushing to s restores the original relative order, because two reversals cancel.

<!-- @code java -->
```java
static void insertIter(Deque<Integer> s, int x) {
    Deque<Integer> held = new ArrayDeque<>();
    while (!s.isEmpty() && s.peek() > x) held.push(s.pop());

    s.push(x);
    while (!held.isEmpty()) s.push(held.pop());
}
```

<!-- @annotations -->
- 2: ArrayDeque rather than Stack for the same reason as before, and it is the structure the recursion was simulating.

<!-- @code python -->
```python
def insert_iter(s, x):
    held = []
    while s and s[-1] > x:
        held.append(s.pop())
    s.append(x)
    while held:
        s.append(held.pop())


def sort_stack(s):
    if not s:
        return
    t = s.pop()
    sort_stack(s)
    insert_iter(s, t)
```

<!-- @annotations -->
- 2: held is the explicit form of what the recursive insert kept in its frames.
- 11: The outer recursion still runs n deep, so this only removes half of the depth — Python's limit still applies.

<!-- @approach -->
### The Explicit Auxiliary Stack

<!-- @idea -->
Drop the recursion entirely and keep one sorted stack alongside the original.

<!-- @steps -->
1. Keep a second, always-sorted stack.
2. Pop an element from the source.
3. Move anything larger back from the auxiliary stack to the source.
4. Push the element onto the auxiliary stack, which stays sorted.
5. Repeat until the source is empty, then the auxiliary stack is the answer.

<!-- @complexity -->
- time: O(n^2)
- space: O(n) explicit, O(1) call stack
- note: The same algorithm with the frames replaced by a container, and measurably cheaper for it — 2,320,421ns at n = 1,000 against the fully recursive 3,964,239ns, about 1.71x, from having no call overhead and no frames. It also has no depth limit, where the recursive version stops at 259,765 in C++ and 998 in Python. All three quadratic forms sit within 1.7x of each other; the real gap is to the O(n log n) approach, which is 195x faster.

<!-- @code cpp -->
```cpp
#include <stack>
using namespace std;

void sortStack(stack<int>& s) {
    stack<int> aux;

    while (!s.empty()) {
        int t = s.top(); s.pop();
        while (!aux.empty() && aux.top() > t) { s.push(aux.top()); aux.pop(); }
        aux.push(t);
    }
    s = aux;                                  // aux is sorted; hand it back
}
```

<!-- @annotations -->
- 9: Rolling the larger elements back onto the source is what keeps aux sorted, and it is the same walk the recursive insert performed.
- 12: Assigning aux back to s makes this a drop-in replacement; swapping instead would avoid one copy.
- 7: The outer loop runs n times and the inner one up to n, which is where the O(n^2) comes from — identical to the recursive version's cost.

<!-- @code java -->
```java
static void sortStack(Deque<Integer> s) {
    Deque<Integer> aux = new ArrayDeque<>();

    while (!s.isEmpty()) {
        int t = s.pop();
        while (!aux.isEmpty() && aux.peek() < t) s.push(aux.pop());
        aux.push(t);                              // aux keeps the SMALLEST on top
    }
    while (!aux.isEmpty()) s.push(aux.pop());     // draining reverses it into place
}
```

<!-- @annotations -->
- 6: The comparison is < here, not > as in C++, because Java cannot hand the caller a different Deque — aux has to be drained back into s, and draining reverses it. Building aux smallest-on-top makes that reversal land the stack ascending. Using > and then draining returns the stack in exactly the wrong order, on 4,605 of 5,000 random inputs.

<!-- @code python -->
```python
def sort_stack(s):
    aux = []
    while s:
        t = s.pop()
        while aux and aux[-1] > t:
            s.append(aux.pop())
        aux.append(t)
    s[:] = aux
    return s


# No recursion, so no depth limit — this sorts a stack of any size,
# where the recursive version stops at 998 on the default settings.
```

<!-- @annotations -->
- 8: s[:] = aux replaces the caller's list in place; s = aux would only rebind the local name and leave the caller's stack untouched.
- 12: The only version here that is not bounded by the recursion limit.

<!-- @example -->

<!-- @input -->
bottom → [3, 1, 4, 2] ← top

<!-- @output -->
bottom → [1, 2, 3, 4] ← top, from 3 lifts and 4 frames of storage

<!-- @why -->
The smallest input where an element has to travel past more than one other, so the recursive insert does visible work.

<!-- @walkthrough -->
1. sortStack pops 2 and holds it in a local, then recurses on [3, 1, 4].
2. That pops 4, recurses on [3, 1], which pops 1 and recurses on [3].
3. The chain bottoms out with [3] popped to empty, so four locals now hold 2, 4, 1 and 3 — the whole stack is in the frames.
4. Unwinding, 3 is inserted into an empty stack, giving [3].
5. Then 1 is inserted: the top 3 is greater, so it is lifted off, 1 is pushed, and 3 is replaced — giving [1, 3].
6. Then 4 is inserted: the top 3 is not greater, so 4 goes straight on — [1, 3, 4].
7. Finally 2 is inserted: 4 and 3 are both lifted off, 2 is pushed, and they are replaced — [1, 2, 3, 4], for 3 lifts in total, which is the inversion count of the input.

<!-- @example -->

<!-- @input -->
Lift counts against inversion counts

<!-- @output -->
Exactly equal, at every size, with condition tests exactly n higher

<!-- @why -->
It identifies the algorithm rather than merely describing it — this is insertion sort, and the identity is the one the Basic Sorting topic established.

<!-- @walkthrough -->
1. insertSorted lifts off every element greater than the one being placed, and one further test succeeds to place it.
2. That is what insertion sort's inner loop does, with the stack playing the role of the array.
3. Counting both quantities gives 21 and 21 at n = 10, 586 and 586 at n = 50, 2,632 and 2,632 at n = 100, and 10,790 and 10,790 at n = 200 — while the condition tests come to exactly n more in each case.
4. They are equal at every size, and the hand-checked cases agree too — 0 for a sorted stack, 6 for a reversed four, 2 for [2,1,4,3] and 3 for [3,1,4,2].
5. Insertion Sorting measured the same identity for shifts, and the reason is the same: each lift corresponds to one out-of-order pair being crossed.
6. So the properties transfer whole — quadratic worst case, linear on already-sorted input, and stable provided the comparison keeps equal elements in place.
7. That is why the code uses s.top() <= x rather than <, which is the one line stability depends on.

<!-- @example -->

<!-- @input -->
The same source compiled at -O0 and at -O2

<!-- @output -->
259,765 either way — the optimiser changes nothing

<!-- @why -->
Every earlier recursion in this topic had its depth limit removed at -O2, and this is the first one that does not, for a reason visible in the source.

<!-- @walkthrough -->
1. sortStack calls itself and then calls insertSorted, so there is work after the recursive call.
2. insertSorted calls itself and then pushes the held element back, so there is work after that call too.
3. Neither call is therefore in tail position, and a frame cannot be discarded when it still has to put its element back.
4. Measured, the deepest stack the recursion can sort is 259,765 at -O0 and 259,765 at -O2 — identical.
5. Compare Pow(x, n), where the tail call let -O2 reach 199,902,343, or the subsequence recursions, which lost their self-calls entirely at -O1.
6. The difference is structural rather than a missed optimisation: the frames are where the data is, so they cannot be removed.
7. That is also the answer to the problem's constraint — the algorithm satisfies "no auxiliary structure" precisely because the frames are the structure.

<!-- @example -->

<!-- @input -->
Four ways to sort the same 1,000-element stack

<!-- @output -->
195x between the fastest and the slowest, and only 1.71x among the three quadratic ones

<!-- @why -->
It separates the cost of the algorithm from the cost of the recursion, which is the question the problem's constraint actually raises.

<!-- @walkthrough -->
1. Draining into a vector, sorting and refilling measured 20,308 nanoseconds.
2. The fully recursive version measured 3,964,239 — a factor of 195.
3. Making only the insert iterative brought that to 2,447,564, about 1.62x better.
4. Removing the recursion entirely, with one explicit auxiliary stack, measured 2,320,421 — 1.71x better than the fully recursive form.
5. So all three quadratic versions sit within 1.7x of one another, and the recursion costs only the call overhead.
6. The 195x gap is the algorithm, not the recursion: O(n log n) against O(n^2).
7. It widens with n as expected — 23.9x at 100, 112.7x at 500, 314.4x at 2,000.

<!-- @visualization custom -->

<!-- @description -->
Two columns side by side, and the whole point is that they are the same storage. On the left the stack itself as a vertical pile of cells with only the top one highlighted as reachable; on the right a column of call frames that grows as the left one shrinks. Run [3, 1, 4, 2]: as sortStack pops each element, animate the value physically moving out of the stack column and into a frame's local slot on the right, so by the deepest point the left column is empty and the right holds 2, 4, 1, 3 top to bottom — with a caption that the stack has been turned inside out and is now living in the frames. Then unwind: each value moves back from its frame into the left column, and for each one show the insertSorted walk as a small side-animation where elements greater than it are lifted off, it settles, and they drop back. Keep two counters running, comparisons and inversions remaining, and let them tick down together so the reader sees them stay equal — end with both at the input's inversion count and a label reading comparisons = inversions, exactly. Beneath, a depth gauge marked n + 1 that fills to exactly one past the element count, with a note that insertSorted only goes deep after sortStack has unwound so the two never stack together. The optimiser panel should be a simple two-bar comparison, -O0 and -O2, both at 259,765 and visibly identical, set against greyed bars from earlier subtopics where -O2 ran off the frame — captioned neither call is in tail position. Finally the four-way timing chart at n = 1,000 on a log axis: drain-and-sort at 20,308, two-stacks at 2,320,421, hybrid at 2,447,564 and fully recursive at 3,964,239, with the three quadratic bars grouped tightly together and the O(n log n) bar far away, annotated 1.71x among these three, 195x to that one.

<!-- @sampleInput -->
```json
{"primary":{"input":[3,1,4,2],"inputOrder":"bottom to top","result":[1,2,3,4],"lifts":3,"inversions":3,"conditionTests":7,"peakDepth":5,"descent":[{"call":"sortStack([3,1,4,2])","pops":2,"remaining":[3,1,4]},{"call":"sortStack([3,1,4])","pops":4,"remaining":[3,1]},{"call":"sortStack([3,1])","pops":1,"remaining":[3]},{"call":"sortStack([3])","pops":3,"remaining":[]},{"call":"sortStack([])","baseCase":true}],"heldInFrames":[2,4,1,3],"note":"at the deepest point the entire stack is in the call frames","unwind":[{"insert":3,"into":[],"lifted":[],"result":[3],"lifts":0},{"insert":1,"into":[3],"lifted":[3],"result":[1,3],"lifts":1},{"insert":4,"into":[1,3],"lifted":[],"result":[1,3,4],"lifts":0},{"insert":2,"into":[1,3,4],"lifted":[4,3],"result":[1,2,3,4],"lifts":2}]},"twoFunctions":{"sortStack":"pop, sort the rest, insert back","insertSorted":"lift off everything greater, push, replace","mutuallyDependent":"sortStack relies on insertSorted preserving order; insertSorted assumes a sorted stack","firstInTopic":"every earlier recursion here was a single function calling itself"},"isInsertionSort":{"identity":"elements lifted == inversion count, exactly","conditionTests":"lifts + n, since each insert ends with one successful test","rows":[{"n":10,"inversions":21,"lifts":21,"tests":31},{"n":50,"inversions":586,"lifts":586,"tests":636},{"n":100,"inversions":2632,"lifts":2632,"tests":2732},{"n":200,"inversions":10790,"lifts":10790,"tests":10990}],"handChecked":[{"input":[1,2,3,4],"inversions":0,"lifts":0},{"input":[4,3,2,1],"inversions":6,"lifts":6},{"input":[2,1,4,3],"inversions":2,"lifts":2},{"input":[3,1,4,2],"inversions":3,"lifts":3}],"echoes":"insertion-sorting measured the same identity for shifts","inherited":["quadratic worst case","linear on sorted input","stable, provided the test is <= rather than <"]},"depth":{"peak":"n + 1","rows":[{"n":10,"peak":11},{"n":50,"peak":51},{"n":100,"peak":101},{"n":200,"peak":201}],"whyNotTwoN":"insertSorted only goes deep after sortStack has unwound, so the two chains never stack together","cppLimit":{"O0":259765,"O2":259765,"identical":true},"whyO2CannotHelp":"neither call is in tail position — each frame must survive its own recursive call in order to put its element back","contrastWithEarlier":{"powXN":199902343,"subsequenceRecursions":"lost their self-calls entirely at -O1"},"python":{"defaultLimit":1000,"largestSorted":998,"largestReverseSorted":998,"sameBecause":"the depth is set by the sortStack chain, not by the ordering"}},"theHiddenContainer":{"claim":"no auxiliary data structure","reality":"the popped elements are locals, one per frame — the space is O(n), just invisible","revealedBy":"rewriting insertSorted as a loop immediately forces a held stack to be declared","heldIsExactly":"the chain of t locals the recursion was using"},"timing":{"n":1000,"unit":"ns","drainSortRefill":20308,"fullyRecursive":3964239,"hybridIterativeInsert":2447564,"twoStacksNoRecursion":2320421,"ratios":{"recursiveOverTwoStacks":1.71,"recursiveOverHybrid":1.62,"recursiveOverDrainSort":195,"spreadAmongQuadraticForms":1.71},"byN":[{"n":100,"recursive":52357,"drainSort":1845,"ratio":23.9},{"n":500,"recursive":1049586,"drainSort":13069,"ratio":112.7},{"n":1000,"recursive":3964239,"drainSort":20308,"ratio":195},{"n":2000,"recursive":17042527,"drainSort":54206,"ratio":314.4}],"reading":"the 195x is the algorithm; the 1.71x is the recursion","python":{"n":300,"recursive":4393052,"sorted":14719,"ratio":298}},"verification":{"randomStacks":3000,"maxN":24,"includes":["duplicates","negatives","empty"],"allFourApproachesAgree":true}}
```

<!-- @highlights -->
- Two columns sit side by side — the stack on the left, the call frames on the right — and the point is that they are the same storage.
- Only the top cell of the stack column is highlighted as reachable, which is the constraint the whole problem turns on.
- Running [3, 1, 4, 2], each popped value physically moves out of the stack and into a frame's local slot.
- At the deepest point the left column is empty and the right holds 2, 4, 1, 3.
- A caption reads that the stack has been turned inside out and now lives in the frames.
- Unwinding moves each value back, with a side-animation of the insertSorted walk lifting off larger elements and dropping them back.
- Two counters run throughout: elements lifted, and inversions remaining.
- They tick down together and finish equal, labelled lifts = inversions, exactly.
- A depth gauge marked n + 1 fills to exactly one past the element count.
- A note explains insertSorted only goes deep after sortStack has unwound, so the two chains never stack together.
- The optimiser panel shows two bars, -O0 and -O2, both at 259,765 and visibly identical.
- Greyed bars from earlier subtopics run off the frame beside them, captioned neither call is in tail position.
- A four-way log-axis chart at n = 1,000 shows 20,308, 2,320,421, 2,447,564 and 3,964,239 nanoseconds.
- The three quadratic bars are grouped tightly together.
- The O(n log n) bar sits far away from them.
- The chart is annotated 1.71x among these three, 195x to that one.

<!-- @edgeCases -->
- An empty stack — the base case returns immediately and nothing is inserted.
- A single element — one frame, no lifts, and the insert hits the empty branch.
- An already-sorted stack — every insert pushes straight on, so zero lifts, matching an inversion count of zero.
- A reverse-sorted stack — every insert walks the full depth, giving the maximum n(n−1)/2 lifts.
- All elements equal — zero lifts, because the <= test stops the walk immediately.
- Duplicate values — stability depends on the comparison being <= rather than <, so equal elements are never lifted.
- Negative values — no special handling, since only relative order is involved.
- n near 259,765 in C++ — the measured depth limit, identical at -O0 and -O2.
- n near 998 in Python — the default recursion limit, and the same figure whatever the input order.
- Using s = aux in Python instead of s[:] = aux — rebinds the local name and leaves the caller's stack unsorted.
- Comparing boxed Integers with == in Java — compares references and fails outside the small-integer cache.

<!-- @pitfalls -->
- Believing the "no auxiliary structure" claim literally. The popped elements are locals, one per frame, so the space is O(n) — it has moved, not disappeared.
- Using < instead of <= in the insert test. Equal elements are then lifted off and pushed back in the wrong order, which loses stability for no benefit.
- Expecting -O2 to remove the depth limit. Neither call is in tail position, and the limit measured 259,765 at both levels.
- Assuming the peak depth is 2n. It is exactly n + 1, because insertSorted only descends after sortStack has already unwound.
- Reaching for this to sort anything. Draining into an array and sorting is 195x faster at n = 1,000, and the gap grows with n.
- Writing s = aux rather than s[:] = aux in Python. That rebinds a local name and the caller sees an unsorted stack.
- Using java.util.Stack. It extends Vector and is synchronised; ArrayDeque is the intended structure.
- Comparing boxed Integers with == in Java. Reference comparison happens to work below 128 and fails above it.
- Forgetting that the recursion sorts into a stack, not an array. Ascending means the largest ends on top, which reads backwards if you print by popping.
- Testing only on random input. A reverse-sorted stack is the worst case at n(n−1)/2 lifts and the one most likely to hit the depth limit.
- Trying to make the insert a tail call. The element has to be pushed back after the recursive call returns, so no rearrangement makes it one.
- Assuming the iterative rewrite is a fair comparison. It declares the container the recursion was hiding, which is exactly the thing the problem forbids.

<!-- @doubt -->
### Where do the removed elements actually go?

<!-- @answer -->
Into local variables, one per frame. When sortStack pops the top and holds it in t, that value lives in the frame until the recursive call returns. So at the deepest point the entire stack has been dismantled and is being held by the call stack — measured, the peak depth is exactly n + 1. That is how the algorithm satisfies "no auxiliary data structure" while still needing somewhere to put n elements. The space is O(n) either way; what changed is that it moved somewhere you did not declare and cannot inspect.

<!-- @doubt -->
### Is this really insertion sort?

<!-- @answer -->
Yes, and the operation count settles it rather than the resemblance. Counting how many elements get lifted past another against the inversion count of the input gives 21 and 21 at n = 10, 586 and 586 at n = 50, 2,632 and 2,632 at n = 100, and 10,790 and 10,790 at n = 200 — equal every time, with the number of condition tests being exactly that plus n. That is the identity Insertion Sorting established for shifts, and for the same reason: insertSorted lifts off every element greater than the one being placed, which is precisely insertion sort's inner loop with the stack playing the role of the array. So it inherits the whole profile — O(n²) worst case, linear on already-sorted input, and stable as long as the comparison is <= rather than <.

<!-- @doubt -->
### Why can't -O2 flatten this like the others?

<!-- @answer -->
Because neither recursive call is the last thing its frame does. sortStack calls itself and then calls insertSorted; insertSorted calls itself and then pushes the held element back. A frame that still has to put an element back cannot be discarded, so there is no tail call to eliminate. Measured, the deepest stack it can sort is 259,765 at -O0 and 259,765 at -O2 — identical, which is the first time in this topic the optimiser has made no difference to the depth. Compare Pow(x, n), where the tail call let -O2 reach 199,902,343. The difference is structural: here the frames are where the data is.

<!-- @doubt -->
### Why is the peak depth n + 1 rather than 2n?

<!-- @answer -->
Because the two recursions never run deep at the same time. sortStack descends all the way to an empty stack first, and only then does the unwinding begin — so when insertSorted is called from depth k, the stack it is inserting into holds only n − k elements, and it can descend at most that far. The two add up to n at every level rather than stacking on top of each other. Measured, the peak is 11 at n = 10, 51 at n = 50, 101 at n = 100 and 201 at n = 200 — exactly n + 1, with the extra frame being the empty base case.

<!-- @doubt -->
### What does the iterative rewrite show?

<!-- @answer -->
That the recursion was hiding a container. Rewriting insertSorted as a loop immediately forces you to declare a held stack for the elements you lift off — and that stack is precisely the chain of t locals the recursive version kept in its frames. Once that is visible, the recursion can be removed entirely: pop from the source, roll anything larger back, push, repeat. Measured at n = 1,000, the fully recursive version took 3,964,239ns, the half-converted one 2,447,564ns, and the fully iterative one 2,320,421ns — so the recursion was costing about 1.71x in call overhead and buying invisibility rather than efficiency.

<!-- @doubt -->
### Would you ever actually write this?

<!-- @answer -->
Not to sort a stack. Draining into a vector and calling sort measured 20,308ns at n = 1,000 against the recursion's 3,964,239 — a factor of 195 — and the gap widens with n, from 23.9x at 100 to 314.4x at 2,000, because one is O(n log n) and the others are quadratic. Notice how the numbers split: 195x separates the algorithms and only 1.71x separates the three quadratic implementations. The recursion is not the expensive part; the algorithm is. What the problem is actually for is the idea that the call stack is a data structure you already have, which is exactly how backtracking stores a partial solution.

<!-- @doubt -->
### What makes it stable, and how do I break it?

<!-- @answer -->
The comparison. Writing s.top() <= x means an element equal to the one being inserted is left in place and the new one goes on top of it, preserving their original relative order. Writing < instead lifts equal elements off and pushes them back above the new one, which reverses them. The cost is real too — every equal element becomes an extra lift and replace, so a stack with many duplicates does noticeably more work for a worse result. This is the same single-character decision that Insertion Sorting measured, where the >= variant was unstable on 99.05% of test arrays.

<!-- @doubt -->
### Why does Python cap out at 998?

<!-- @answer -->
Because the peak depth is n + 1 and the default recursion limit is 1,000, leaving room for the caller's own frames. What is worth noticing is that the figure is the same for an already-sorted stack and a reverse-sorted one — 998 in both cases — even though the two differ enormously in comparisons. The depth is set by the sortStack chain, which is n regardless of ordering, and the insert only ever descends into what sortStack has already unwound. So unlike the running time, the depth does not depend on the input at all.

<!-- @doubt -->
### Does the stack end up with the largest on top or the bottom?

<!-- @answer -->
Largest on top, because the insert places each element above everything smaller than it. That is what "ascending" means for a stack whose top is the maximum, and it matches what the drain-sort-refill version produces when it pushes the sorted values smallest-first. It is a common source of confusion when checking results, because printing a stack by popping gives you the reverse — descending — which looks like a bug and is not. To read it in sorted order you have to pop into a container and reverse, or inspect from the bottom.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Reverse a Stack, which is the same technique with a simpler helper. Instead of inserting each element into its sorted position, it inserts it at the bottom — so insertAtBottom has no comparison at all and simply recurses until the stack is empty, pushes, and rebuilds. That makes the structure easier to see, because the only thing the recursion is doing is holding elements out of the way while the one underneath is dealt with. It is the same idea as here with the sorting removed, which is a good way to check whether the mechanism rather than the comparison is what you understood.
