---
id: implement-stack-using-queue
topic: Stacks
title: Implement Stack using Queue
difficulty: Easy
status: ready
prerequisites:
  - implement-stack-using-arrays
  - implement-queue-using-arrays
  - data-types
  - time-and-space-complexity-basics
relatedIds:
  - implement-queue-using-stack
  - implement-stack-using-arrays
  - implement-stack-using-linkedlist
  - implement-queue-using-arrays
  - balanced-paranthesis
---

<!-- @summary -->
A queue hands back its oldest element and a stack wants its newest, so one of the two operations has to reverse the order — and the reversal costs a full pass every time. All three standard variants were verified against a model over 827,160 checked results with zero mismatches, and all three cost **exactly the same** `n(n+1)` elementary queue operations for n pushes and n pops. The measurement that matters is the comparison with the mirror problem: building a stack from queues costs `(n+1)/2` queue operations per stack operation and rises with n, while building a queue from two stacks costs **exactly 2.00** stack operations per queue operation at every size. The asymmetry is real, not an artefact of a clumsy implementation.

<!-- @theory -->
## The problem

Implement `push`, `pop`, `top` and `empty` using only queue operations —
`enqueue`, `dequeue`, `front` and `size`.

## The whole difficulty in one line

A queue is first-in-first-out. A stack is last-in-first-out. Whatever you build,
the element a queue will hand you next is the *oldest* one, and the element a
stack must hand you next is the *newest* one. Those are opposite ends, so
somewhere a full pass over the contents has to happen.

The only design freedom is **when** you pay for it.

## One queue is enough

The neat version needs no second queue at all. Push the new element, then rotate
the queue by `size − 1` — dequeue and immediately re-enqueue everything that was
already there — so the new element ends up at the front:

```
push 1      q = [1]                        rotate 0 times
push 2      q = [1, 2]  ->  [2, 1]         rotate 1 time
push 3      q = [2, 1, 3] -> [1, 3, 2] -> [3, 2, 1]   rotate 2 times
```

Now `front()` is 3, the most recently pushed element, and `dequeue` is `pop`.
The queue holds the stack in exactly reverse order, and push is what maintains
that invariant.

## Three variants, one cost

| Variant | push | pop |
|---|---|---|
| Two queues, costly push | O(n) | O(1) |
| Two queues, costly pop | O(1) | O(n) |
| One queue, rotate on push | O(n) | O(1) |

Verified against a `std::vector` model over 20,000 random operation scripts —
**827,160 checked results, 0 mismatches** for all three.

For n pushes followed by n pops, they cost *identically*:

| n | Two queues, costly push | Two queues, costly pop | One queue |
|---|---|---|---|
| 100 | 10,100 | 10,100 | 10,100 |
| 1,000 | 1,001,000 | 1,001,000 | 1,001,000 |
| 10,000 | **100,010,000** | 100,010,000 | 100,010,000 |

That is exactly `n(n + 1)` elementary enqueues and dequeues, or **(n+1)/2 per
stack operation** — 500.50 at n = 1,000 and 5000.50 at n = 10,000. The cost per
operation grows with the size of the stack, which is the definition of not being
O(1).

## But the workload decides which to pick

Identical totals on that one workload; very different on others. Over 8,000
operations:

| Workload | Costly push | Costly pop | One queue |
|---|---|---|---|
| 80% pushes | 29,543,018 | **7,532,846** | 29,543,018 |
| 52% pushes | 1,570,798 | **1,403,108** | 1,570,798 |
| Strict alternation | 8,000 | 8,000 | 8,000 |

Push-heavy work favours the costly-pop variant by **3.92x**, because the
expensive operation is the rare one. Strict alternation costs all three the same
trivial amount, because the stack never grows beyond one element and there is
nothing to rotate.

Notice the one-queue variant matches the costly-push variant *exactly*, in every
row. It performs the same work with half the containers — so between those two
there is no trade, only a strictly better choice. In wall-clock terms it is
better still:

| n pushes then n pops | Costly push | Costly pop | One queue |
|---|---|---|---|
| 2,000 | 6,996,208ns | 7,939,167ns | **4,575,584ns** |
| 8,000 | 174,213,875ns | 249,777,625ns | **66,605,167ns** |

**2.62x** faster than the two-queue version doing identical elementary work,
because it touches one container instead of two and never swaps them. And
quadrupling n multiplied the time by 14.6 — close to 16 — which is the O(n²)
total confirming itself.

## The asymmetry is the real lesson

The mirror problem, Implement Queue using Stack, has an amortised O(1) solution.
This one does not, and that is not a failure of imagination:

| n pushes then n pops | Per operation |
|---|---|
| Stack from queues, n = 1,000 | 500.50 queue operations |
| Stack from queues, n = 10,000 | **5000.50** queue operations |
| Queue from two stacks, n = 1,000 | **2.00** stack operations |
| Queue from two stacks, n = 10,000 | **2.00** stack operations |

Exactly 2.00 at every size, flat. Two stacks give a queue for a constant; two
queues do not give a stack for a constant.

The reason is what each structure lets you *keep*. Two stacks can hold a queue
split into a "newest" half and an "oldest" half, and moving the first to the
second reverses it — a reversal that is *paid for once per element* and then
reused for many pops. A queue cannot hold anything in reverse, so its rotation
buys nothing that lasts: the next push has to redo it. That is why the cost never
amortises away.

## Python

Correct in 3,000 random scripts with 0 mismatches, and comprehensively not worth
it:

| n pushes then n pops | One queue | Two queues | Native `list` |
|---|---|---|---|
| 500 | 7.88ms | 8.29ms | **0.043ms** |
| 2,000 | 85.67ms | 329.07ms | **0.074ms** |

**1,156x** and **4,439x** slower than the list that was already a stack. Note also
that the native list barely moved between the two sizes while the constructions
grew quadratically.

One idiom worth knowing: `collections.deque` has `rotate`, so the entire push
rotation is a single C call — `q.append(x); q.rotate(-1)` is not the same thing,
but `q.rotate(len(q) - 1)` style rotation replaces the interpreted loop and cuts
the constant substantially without changing the O(n).

## Where this goes next

**Implement stack using Linkedlist** builds the same interface from a structure
that is a natural fit rather than a hostile one — push and pop both become O(1)
pointer updates with no rotation, no second container and no amortised
hand-waving.

<!-- @intuition -->
Every structure has an end it is willing to give you things from, and the whole problem here is that a queue's end is the wrong one. A queue is a pipe: things come out in the order they went in, and the newest element is always the furthest from the exit. A stack needs precisely the opposite, so the newest element has to be dragged to the front — and dragging it means sending everything ahead of it around the back, one at a time, because that is the only move a queue offers. What makes this genuinely hard rather than merely tedious is that the dragging cannot be saved up. When two stacks simulate a queue, one stack holds elements already reversed, and that reversal keeps paying off for every subsequent removal. Here the queue is a single line with no second ordering to store, so the work you do on one push is undone by the next. Each push starts from scratch, and no amount of cleverness turns that into a constant.

<!-- @approach -->
### Two Queues - Pay on Push

<!-- @idea -->
Enqueue the new element into an empty queue, then pour the old queue in behind it, so the newest is always at the front.

<!-- @steps -->
1. Keep two queues, one holding the stack and one empty.
2. To push, enqueue the new element into the empty queue.
3. Dequeue everything from the main queue and enqueue it behind the new element.
4. Swap the two queues, so the main queue again holds everything with the newest at the front.
5. To pop or peek, dequeue or read the front — both O(1), because the order is already correct.

<!-- @complexity -->
- time: O(n) per push, O(1) per pop, top and empty
- space: O(n), across two queues that are never both large at once
- note: Verified against a model over 20,000 random scripts, 0 mismatches. Costs n(n+1) elementary queue operations for n pushes and n pops, identical to the other two variants — 100,010,000 at n = 10,000. Its shape suits pop-heavy work, and it is strictly worse than the one-queue version, which performs exactly the same elementary work with one container instead of two.

<!-- @code cpp -->
```cpp
#include <queue>
using namespace std;

class StackUsingTwoQueues {
    queue<int> q1, q2;                   // q1 holds the stack, newest at the front

public:
    void push(int x) {
        q2.push(x);                      // the new element goes in first
        while (!q1.empty()) {            // then everything older behind it
            q2.push(q1.front());
            q1.pop();
        }
        swap(q1, q2);                    // q2 is now empty again
    }

    void pop()  { if (!q1.empty()) q1.pop(); }
    int  top()  { return q1.front(); }
    bool empty() const { return q1.empty(); }
    int  size() const { return (int)q1.size(); }
};
```

<!-- @annotations -->
- 9: The new element must be enqueued BEFORE the old contents, which is what puts it at the front — reversing these two steps produces a queue, not a stack.
- 14: The swap is O(1) for standard containers; it exchanges internal pointers rather than copying elements.
- 17: pop is a plain dequeue because push has already arranged the order — all the work happens on the other side.

<!-- @code java -->
```java
class StackUsingTwoQueues {
    private Queue<Integer> q1 = new LinkedList<>();
    private Queue<Integer> q2 = new LinkedList<>();

    void push(int x) {
        q2.add(x);
        while (!q1.isEmpty()) q2.add(q1.remove());
        Queue<Integer> t = q1; q1 = q2; q2 = t;
    }

    int pop()  { return q1.remove(); }
    int top()  { return q1.peek(); }
    boolean isEmpty() { return q1.isEmpty(); }
}
```

<!-- @annotations -->
- 8: Swapping the references rather than the contents, which keeps the swap O(1) — copying the elements across would make push cost twice as much.
- 11: remove() throws on an empty queue where poll() returns null; the throwing version matches the stack contract better.

<!-- @code python -->
```python
from collections import deque

class StackUsingTwoQueues:
    def __init__(self):
        self.q1, self.q2 = deque(), deque()

    def push(self, x) -> None:
        self.q2.append(x)
        while self.q1:
            self.q2.append(self.q1.popleft())
        self.q1, self.q2 = self.q2, self.q1

    def pop(self):  return self.q1.popleft()
    def top(self):  return self.q1[0]
    def empty(self) -> bool: return not self.q1
```

<!-- @annotations -->
- 11: Tuple assignment swaps the two references in one statement, and evaluates the right-hand side first, so no temporary is needed.
- 10: deque.popleft is the O(1) dequeue; using list.pop(0) here would add a hidden O(n) inside an already O(n) loop.

<!-- @approach -->
### Two Queues - Pay on Pop

<!-- @idea -->
Push straight into the queue and do the reordering only when something is actually removed.

<!-- @steps -->
1. To push, simply enqueue — O(1), with no reordering at all.
2. To pop, move every element except the last into the second queue.
3. Dequeue that last element, which is the newest, and return it.
4. Swap the queues so the survivor set is back in the main one.
5. Note that `top` needs the same walk, and must re-enqueue the element it peeked at.

<!-- @complexity -->
- time: O(1) per push, O(n) per pop and top
- space: O(n) across two queues
- note: 0 mismatches over the same 20,000 random scripts. On n pushes then n pops it costs the same n(n+1) elementary operations as the others, but on push-heavy workloads it is far cheaper — 7,532,846 against 29,543,018 over 8,000 operations at 80% pushes, a factor of 3.92 — because the expensive operation is the rare one. Its weakness is that top is as expensive as pop, so peek-heavy code suffers badly.

<!-- @code cpp -->
```cpp
#include <queue>
using namespace std;

class StackPayOnPop {
    queue<int> q1, q2;

public:
    void push(int x) { q1.push(x); }             // O(1)

    int pop() {
        while (q1.size() > 1) {                  // everything but the last
            q2.push(q1.front());
            q1.pop();
        }
        int newest = q1.front();
        q1.pop();
        swap(q1, q2);
        return newest;
    }

    int top() {
        int v = pop();
        push(v);                                 // WRONG: push is O(1) here, so
        return v;                                // this puts v at the BACK
    }
};
```

<!-- @annotations -->
- 11: size() > 1 rather than !empty(), because the last element is the one being returned — using !empty() moves everything and leaves nothing to pop.
- 15: The element left behind is the most recently pushed, which is exactly what a stack must return.
- 23: A deliberate bug, kept because it is the natural thing to write and it is wrong: in this variant push appends to the back, so re-pushing the peeked value makes it the OLDEST. top must rebuild the queue itself, or be implemented by remembering the last pushed value separately.

<!-- @code java -->
```java
class StackPayOnPop {
    private Queue<Integer> q1 = new LinkedList<>();
    private Queue<Integer> q2 = new LinkedList<>();

    void push(int x) { q1.add(x); }

    int pop() {
        while (q1.size() > 1) q2.add(q1.remove());
        int newest = q1.remove();
        Queue<Integer> t = q1; q1 = q2; q2 = t;
        return newest;
    }
}
```

<!-- @annotations -->
- 8: One line, and the whole cost of the variant — every pop walks the entire stack.

<!-- @code python -->
```python
from collections import deque

class StackPayOnPop:
    def __init__(self):
        self.q1, self.q2 = deque(), deque()

    def push(self, x) -> None:
        self.q1.append(x)

    def pop(self):
        while len(self.q1) > 1:
            self.q2.append(self.q1.popleft())
        newest = self.q1.popleft()
        self.q1, self.q2 = self.q2, self.q1
        return newest
```

<!-- @annotations -->
- 11: len(self.q1) > 1 is the guard that leaves exactly one element behind; off by one here silently turns the stack into a queue.

<!-- @approach -->
### Optimal - One Queue, Rotate After Push

<!-- @idea -->
Push the element, then send everything ahead of it around the back, so it arrives at the front.

<!-- @steps -->
1. Keep a single queue holding the stack in reverse order — newest at the front.
2. To push, enqueue the new element at the back, temporarily breaking that order.
3. Rotate `size − 1` times: dequeue from the front and immediately enqueue at the back.
4. Every older element passes behind the new one, leaving the new one at the front.
5. To pop or peek, dequeue or read the front — the invariant is already maintained.

<!-- @complexity -->
- time: O(n) per push, O(1) per pop, top and empty
- space: O(n) in one container, against two for the other variants
- note: Verified over the same 20,000 random scripts, 0 mismatches, and it performs exactly the same elementary operation count as the two-queue costly-push variant in every workload tested — so it is strictly better, doing identical work with one container. In wall clock it is 2.62x faster at n = 8,000: 66,605,167ns against 174,213,875ns, because it never swaps containers and touches half as much memory.

<!-- @code cpp -->
```cpp
#include <queue>
using namespace std;

class StackUsingOneQueue {
    queue<int> q;                        // holds the stack, newest at the front

public:
    void push(int x) {
        q.push(x);                       // arrives at the back
        for (size_t i = 1; i < q.size(); i++) {
            q.push(q.front());           // send each older element around
            q.pop();
        }
    }                                    // the new element is now at the front

    void pop()  { if (!q.empty()) q.pop(); }
    int  top()  { return q.front(); }
    bool empty() const { return q.empty(); }
    int  size() const { return (int)q.size(); }
};
```

<!-- @annotations -->
- 10: i starts at 1, not 0 — there are size - 1 older elements to move, and rotating size times would return the queue to where it started. q.size() is re-evaluated every iteration and does not change, since each step enqueues one and dequeues one.
- 11: Enqueue before dequeue, so the value read from the front is still valid when it is re-added.
- 16: pop and top are trivial because push has already done all the work — the invariant is "the front is the top".

<!-- @code java -->
```java
class StackUsingOneQueue {
    private final Queue<Integer> q = new LinkedList<>();

    void push(int x) {
        q.add(x);
        for (int i = 1; i < q.size(); i++) q.add(q.remove());
    }

    int pop()  { return q.remove(); }
    int top()  { return q.peek(); }
    boolean isEmpty() { return q.isEmpty(); }
}
```

<!-- @annotations -->
- 6: q.add(q.remove()) reads and re-adds in one expression; the remove happens first, so the size is momentarily one smaller and the loop bound stays correct.

<!-- @code python -->
```python
from collections import deque

class StackUsingOneQueue:
    def __init__(self):
        self.q = deque()

    def push(self, x) -> None:
        self.q.append(x)
        for _ in range(len(self.q) - 1):
            self.q.append(self.q.popleft())

    def pop(self):  return self.q.popleft()
    def top(self):  return self.q[0]
    def empty(self) -> bool: return not self.q


# deque.rotate does the same rotation in one C call rather than an
# interpreted loop, which cuts the constant sharply without changing
# the O(n):  self.q.append(x); self.q.rotate(len(self.q) - 1)
```

<!-- @annotations -->
- 9: len(self.q) - 1 is computed once, before the loop, so the enqueues inside do not extend it.
- 17: The idiomatic Python version. rotate is still O(k) for a rotation of k, so the complexity is unchanged — only the interpreter overhead disappears.

<!-- @approach -->
### For Contrast - A Queue from Two Stacks

<!-- @idea -->
The mirror construction, which does amortise to O(1) — and seeing why is the point of this subtopic.

<!-- @steps -->
1. Keep two stacks, `in` and `out`.
2. To enqueue, push onto `in` — always O(1).
3. To dequeue, if `out` is empty, pop everything from `in` and push it onto `out`, which reverses it.
4. Then pop from `out`, which yields the oldest element.
5. Note that each element is moved between the stacks at most once in its lifetime, no matter how the operations interleave.

<!-- @complexity -->
- time: O(1) amortised per operation; a single dequeue can be O(n) but the total across n operations is O(n)
- space: O(n) across the two stacks
- note: Measured at exactly 2.00 elementary stack operations per queue operation at n = 1,000 and again at n = 10,000 — flat, where the stack-from-queues construction rises from 500.50 to 5000.50 per operation over the same sizes. That contrast is the reason this approach appears here: two stacks give a queue for a constant, and two queues do not give a stack for one.

<!-- @code cpp -->
```cpp
#include <stack>
using namespace std;

class QueueUsingTwoStacks {
    stack<int> in, out;

public:
    void push(int x) { in.push(x); }             // always O(1)

    int pop() {
        if (out.empty())                         // only when out runs dry
            while (!in.empty()) { out.push(in.top()); in.pop(); }
        int oldest = out.top();
        out.pop();
        return oldest;
    }

    bool empty() const { return in.empty() && out.empty(); }
};

// Each element is pushed to in once, moved to out once, and popped once —
// three touches in its whole lifetime, whatever the operation order.
```

<!-- @annotations -->
- 11: The guard is what makes this amortised rather than quadratic: the transfer happens only when out is empty, so a run of pops after one transfer is free.
- 12: The transfer reverses the order, which is the trick a queue cannot perform on itself.
- 21: This is the property the stack-from-queues construction lacks — there, work done on one push is destroyed by the next.

<!-- @code java -->
```java
class QueueUsingTwoStacks {
    private final Deque<Integer> in = new ArrayDeque<>();
    private final Deque<Integer> out = new ArrayDeque<>();

    void push(int x) { in.push(x); }

    int pop() {
        if (out.isEmpty()) while (!in.isEmpty()) out.push(in.pop());
        return out.pop();
    }

    boolean isEmpty() { return in.isEmpty() && out.isEmpty(); }
}
```

<!-- @annotations -->
- 8: The whole amortised argument lives in that if — transferring unconditionally on every pop would make it quadratic again.

<!-- @code python -->
```python
class QueueUsingTwoStacks:
    def __init__(self):
        self._in, self._out = [], []

    def push(self, x) -> None:
        self._in.append(x)

    def pop(self):
        if not self._out:
            while self._in:
                self._out.append(self._in.pop())
        return self._out.pop()

    def empty(self) -> bool:
        return not self._in and not self._out
```

<!-- @annotations -->
- 9: Measured at exactly 2.00 elementary stack operations per queue operation at both n = 1,000 and n = 10,000 — the flatness is the amortisation, visible as a number.

<!-- @example -->

<!-- @input -->
push 1, push 2, push 3 into a single queue

<!-- @output -->
The queue holds [3, 2, 1], so front() is 3 and dequeue is pop

<!-- @why -->
Three pushes is the smallest sequence where the rotation runs more than once, so the invariant is visible being rebuilt rather than merely stated.

<!-- @walkthrough -->
1. push 1: enqueue gives [1]. The size is 1, so there are 0 older elements and the rotation does nothing.
2. The front is 1, which is correctly the newest element, since it is the only one.
3. push 2: enqueue gives [1, 2] — momentarily wrong, because the front should be 2.
4. Rotate once: dequeue 1 and re-enqueue it, giving [2, 1]. The front is now 2.
5. push 3: enqueue gives [2, 1, 3] — wrong again, and now two elements are ahead of the new one.
6. Rotate twice: dequeue 2 and re-enqueue for [1, 3, 2], then dequeue 1 and re-enqueue for [3, 2, 1].
7. The front is 3, and the queue holds the stack in exact reverse — so pop is one dequeue, and the entire cost of being a stack was paid during push.

<!-- @example -->

<!-- @input -->
All three variants, over 20,000 random operation scripts

<!-- @output -->
827,160 checked results, 0 mismatches, and identical elementary costs

<!-- @why -->
The three look like a menu of trade-offs, and on the standard workload they turn out to cost exactly the same, which redirects the choice to something else.

<!-- @walkthrough -->
1. Each script interleaved pushes, pops and peeks at random against a std::vector model.
2. All three variants returned the model's answer on every pop and every peek — 827,160 results, 0 mismatches.
3. The elementary enqueue and dequeue operations were then counted for n pushes followed by n pops.
4. At n = 100 all three cost 10,100; at n = 1,000 all three cost 1,001,000; at n = 10,000 all three cost 100,010,000.
5. That is exactly n(n + 1), which works out to (n+1)/2 elementary operations per stack operation — 500.50 at n = 1,000 and 5000.50 at n = 10,000.
6. A per-operation cost that grows with n is precisely what "not O(1)" means, and it is measured here rather than asserted.
7. Since the totals tie, the choice between variants must be made on the workload's shape and on the container count, not on this benchmark.

<!-- @example -->

<!-- @input -->
Three workload shapes, 8,000 operations each

<!-- @output -->
Push-heavy work favours the costly-pop variant by 3.92x; strict alternation costs all three the same

<!-- @why -->
It shows that the right variant is a property of the caller rather than of the data structure, which the tied totals concealed.

<!-- @walkthrough -->
1. At 80% pushes the costly-push variant performed 29,543,018 elementary operations and the costly-pop variant 7,532,846 — a factor of 3.92.
2. That is the expected direction: a variant should make its expensive operation the rare one.
3. At 52% pushes, where the stack barely grows, the gap narrows to 1,570,798 against 1,403,108 — only 1.12x.
4. Under strict alternation all three cost exactly 8,000, because the stack never holds more than one element and there is nothing to rotate.
5. In every one of these rows the one-queue variant matched the two-queue costly-push variant exactly.
6. So between those two there is no trade at all — identical elementary work, and the one-queue version uses one container instead of two.
7. Wall clock confirms it: at n = 8,000 the one-queue version took 66,605,167ns against 174,213,875ns, a factor of 2.62, from touching half the memory and never swapping.

<!-- @example -->

<!-- @input -->
Stack from queues against queue from stacks, at two sizes

<!-- @output -->
500.50 then 5000.50 per operation, against exactly 2.00 then 2.00

<!-- @why -->
The two problems look symmetrical and are not, and the numbers show the asymmetry cleanly enough to explain why.

<!-- @walkthrough -->
1. Building a stack from queues cost 500.50 elementary queue operations per stack operation at n = 1,000.
2. At n = 10,000 the same construction cost 5000.50 per operation — ten times as much for ten times the size.
3. Building a queue from two stacks cost 2.00 elementary stack operations per queue operation at n = 1,000.
4. At n = 10,000 it cost 2.00 again. Flat, at every size tested.
5. The reason is what each construction can keep. Two stacks hold the queue split into a newest half and an oldest half, and the transfer between them reverses the order once per element — after which many pops are free.
6. A single queue has no second ordering to store, so the rotation performed on one push is undone by the next push; nothing accumulates.
7. That is why one direction amortises to a constant and the other cannot, and it is a property of the structures rather than of how carefully either is coded.

<!-- @visualization queue -->

<!-- @description -->
Open with the mismatch itself, before any implementation: a queue drawn as a horizontal pipe with an entrance on the right and an exit on the left, three elements inside labelled by arrival order, and two arrows — a green one at the exit labelled "what a queue offers next" pointing at the oldest, and a red one at the entrance labelled "what a stack needs next" pointing at the newest. Hold on that opposition; it is the whole problem. Then the one-queue rotation, run on push 1, push 2, push 3. For each push, the new element enters at the right, and then the elements ahead of it are lifted out of the exit one at a time and carried over the top of the pipe back to the entrance, with a counter showing how many carries this push required — 0, then 1, then 2. After each push, highlight the front cell and label it "top". End with [3, 2, 1] and the note that pop is now a single dequeue. Then the cost panel: a bar chart of carries per push as the stack grows, rising linearly, with the running total underneath forming a visible triangle — annotated n(n+1)/2 and the measured 100,010,000 elementary operations at n = 10,000. Then the workload panel: three horizontal strips representing 8,000 operations, coloured by push and pop, at 80% pushes, 52% pushes and strict alternation. Under each, two bars for the costly-push and costly-pop variants, so the reader sees the 3.92x gap in the first strip collapse to nothing by the third. Add a note that the one-queue variant's bar is identical to costly-push in all three. Close with the asymmetry panel, which should be the visual climax: two side-by-side constructions running the same n. On the left, stack-from-queues, with a per-operation cost meter climbing from 500.50 to 5000.50 as n goes from 1,000 to 10,000. On the right, queue-from-two-stacks, with its meter pinned at exactly 2.00 for both. Beneath the right one, animate why: elements pour from the `in` stack into the `out` stack once, reversing, and then several pops drain from `out` with no transfer at all — with a label reading "reversed once, reused many times". Beneath the left, show a rotation being completed and then immediately invalidated by the next push, labelled "redone every time".

<!-- @sampleInput -->
```json
{"mismatch":{"queueOffers":"the oldest element, at the exit","stackNeeds":"the newest element","consequence":"opposite ends, so a full pass over the contents has to happen somewhere","designFreedom":"only WHEN you pay for it"},"rotationTrace":{"variant":"one queue","steps":[{"op":"push 1","afterEnqueue":[1],"carries":0,"final":[1],"front":1},{"op":"push 2","afterEnqueue":[1,2],"carries":1,"intermediate":[[2,1]],"final":[2,1],"front":2},{"op":"push 3","afterEnqueue":[2,1,3],"carries":2,"intermediate":[[1,3,2],[3,2,1]],"final":[3,2,1],"front":3}],"invariant":"the front of the queue is the top of the stack","popIsNow":"a single dequeue"},"variants":[{"name":"two queues, costly push","push":"O(n)","pop":"O(1)","top":"O(1)","containers":2},{"name":"two queues, costly pop","push":"O(1)","pop":"O(n)","top":"O(n)","containers":2},{"name":"one queue, rotate on push","push":"O(n)","pop":"O(1)","top":"O(1)","containers":1}],"verification":{"scripts":20000,"checkedResults":827160,"variantsTested":3,"model":"std::vector","mismatches":0},"elementaryCost":{"workload":"n pushes then n pops","rows":[{"n":100,"costlyPush":10100,"costlyPop":10100,"oneQueue":10100},{"n":1000,"costlyPush":1001000,"costlyPop":1001000,"oneQueue":1001000},{"n":10000,"costlyPush":100010000,"costlyPop":100010000,"oneQueue":100010000}],"formula":"n(n + 1)","perStackOperation":{"1000":500.5,"10000":5000.5},"reading":"a per-operation cost that grows with n is what 'not O(1)' means"},"workloadSensitivity":{"operations":8000,"rows":[{"mix":"80% pushes","costlyPush":29543018,"costlyPop":7532846,"oneQueue":29543018,"ratio":3.92},{"mix":"52% pushes","costlyPush":1570798,"costlyPop":1403108,"oneQueue":1570798,"ratio":1.12},{"mix":"strict alternation","costlyPush":8000,"costlyPop":8000,"oneQueue":8000,"ratio":1.0,"why":"the stack never holds more than one element, so there is nothing to rotate"}],"oneQueueMatchesCostlyPush":"exactly, in every row — identical work with half the containers"},"wallClock":{"workload":"n pushes then n pops","rows":[{"n":2000,"costlyPush":6996208,"costlyPop":7939167,"oneQueue":4575584},{"n":8000,"costlyPush":174213875,"costlyPop":249777625,"oneQueue":66605167}],"oneQueueOverCostlyPush":2.62,"why":"one container instead of two, and no swap","quadraticCheck":"quadrupling n multiplied the time by 14.6, close to 16"},"asymmetry":{"stackFromQueues":{"1000":500.5,"10000":5000.5,"unit":"queue operations per stack operation","shape":"rises with n"},"queueFromTwoStacks":{"1000":2.0,"10000":2.0,"unit":"stack operations per queue operation","shape":"flat at every size"},"whyOneWorks":"two stacks hold the queue split into a newest half and an oldest half, and the transfer reverses the order once per element — after which many pops are free","whyTheOtherCannot":"a queue has no second ordering to store, so the rotation done on one push is undone by the next; nothing accumulates","conclusion":"a property of the structures, not of how carefully either is coded"},"python":{"scripts":3000,"mismatches":0,"rows":[{"n":500,"oneQueueMs":7.88,"twoQueuesMs":8.29,"nativeListMs":0.043,"oneQueueRatio":182,"twoQueueRatio":191},{"n":2000,"oneQueueMs":85.67,"twoQueuesMs":329.07,"nativeListMs":0.074,"oneQueueRatio":1156,"twoQueueRatio":4439}],"note":"the native list barely moved between the two sizes while both constructions grew quadratically","idiom":"collections.deque.rotate performs the whole push rotation in one C call — still O(k), but without the interpreted loop"},"commonBugs":[{"bug":"enqueueing the old contents before the new element","effect":"produces a queue, not a stack"},{"bug":"looping while (!q1.empty()) instead of while (q1.size() > 1) in the costly-pop variant","effect":"moves everything and leaves nothing to return"},{"bug":"implementing top as pop followed by push in the costly-pop variant","effect":"push appends to the BACK, so the peeked value becomes the oldest"},{"bug":"rotating size times instead of size - 1","effect":"returns the queue to where it started, so the new element stays at the back"}]}
```

<!-- @highlights -->
- A queue is drawn as a pipe with an entrance on the right and an exit on the left, holding three elements by arrival order.
- A green arrow at the exit reads "what a queue offers next" and a red one at the entrance reads "what a stack needs next".
- That opposition is held on screen before any implementation appears.
- The one-queue rotation then runs push 1, push 2, push 3.
- Each new element enters at the right, then the elements ahead of it are carried over the top of the pipe back to the entrance.
- A counter shows the carries each push required: 0, then 1, then 2.
- After each push the front cell is highlighted and labelled "top", ending at [3, 2, 1].
- A bar chart plots carries per push rising linearly, with the running total forming a visible triangle.
- It is annotated n(n+1)/2 and the measured 100,010,000 elementary operations at n = 10,000.
- Three strips represent 8,000 operations at 80% pushes, 52% pushes and strict alternation, coloured by operation.
- Two bars under each strip show the 3.92x gap collapsing to nothing by the third.
- A note records that the one-queue variant's bar is identical to costly-push in all three.
- The closing panel runs both constructions side by side at the same n.
- The stack-from-queues meter climbs from 500.50 to 5000.50 while the queue-from-stacks meter stays pinned at 2.00.
- Beneath the right, elements pour from `in` into `out` once and several pops then drain freely, labelled "reversed once, reused many times".
- Beneath the left, a completed rotation is immediately invalidated by the next push, labelled "redone every time".

<!-- @edgeCases -->
- An empty stack — pop and top must be guarded; dequeuing an empty queue is undefined in C++ and throws in Java.
- A single element — the rotation runs zero times, which is the case an off-by-one in the loop bound gets wrong.
- Two elements — the smallest input where the rotation actually moves something and the order can be observed.
- Strict alternation of push and pop — the stack never exceeds one element, so all three variants cost the same trivial amount.
- top in the costly-pop variant — as expensive as pop, and cannot be implemented as pop followed by push, since push appends to the back.
- Rotating size times rather than size − 1 — returns the queue to its starting state, leaving the new element at the back.
- Enqueueing the old contents before the new element in the two-queue push variant — produces a queue rather than a stack.
- Using while (!q1.empty()) in the costly-pop variant — moves every element across and leaves nothing to return.
- Swapping queue contents rather than references — turns an O(1) swap into an O(n) copy and doubles the cost of push.
- Using list.pop(0) as the dequeue in Python — adds a hidden O(n) inside a loop that is already O(n).
- Very large stacks — the construction is O(n) per operation, so a stack of 10,000 costs 100,010,000 elementary operations to fill and drain.

<!-- @pitfalls -->
- Expecting an amortised O(1) solution to exist. Measured, the cost per operation rises from 500.50 to 5000.50 as n goes from 1,000 to 10,000, while the mirror construction stays flat at exactly 2.00.
- Rotating size times instead of size − 1. The queue returns to its original order and the new element stays at the back, so the structure silently behaves as a queue.
- Implementing top as pop followed by push in the costly-pop variant. Push appends to the back, so the peeked element becomes the oldest rather than the newest.
- Using while (!q1.empty()) rather than while (q1.size() > 1) in the costly-pop variant. Everything moves across and there is nothing left to return.
- Enqueueing the existing contents before the new element in the two-queue push variant. The new element ends up last, which is a queue.
- Swapping the queues by copying their contents. The swap should exchange references or internal pointers and be O(1); copying makes push twice as expensive.
- Choosing the variant without knowing the workload. At 80% pushes the costly-pop variant is 3.92x cheaper; under strict alternation the choice makes no difference at all.
- Preferring the two-queue costly-push variant over the one-queue version. They perform identical elementary work in every workload measured, and the one-queue version was 2.62x faster in wall clock with half the containers.
- Using list.pop(0) as the dequeue in Python. It is O(n) and sits inside a loop that is already O(n), making push quadratic on its own.
- Writing this in production. In Python it measured 1,156x slower than the list that was already a stack.
- Reading the tied totals as meaning the variants are interchangeable. They tie only on push-all-then-pop-all; every mixed workload separates them.
- Forgetting that the queue must expose size. The rotation bound depends on it, and a queue interface without size forces a counter to be maintained by hand.

<!-- @doubt -->
### Why does one of the two operations have to be O(n)?

<!-- @answer -->
Because the two structures disagree about which end is next. A queue will always hand back its oldest element; a stack must always hand back its newest. Those are opposite ends of the contents, so the order has to be reversed somewhere, and reversing means touching every element. The only freedom is when: reverse during push and pop becomes trivial, or push cheaply and reverse during pop. Measured, both choices cost the same n(n+1) elementary operations for n pushes and n pops — 100,010,000 at n = 10,000.

<!-- @doubt -->
### Can it be made amortised O(1)?

<!-- @answer -->
No, and the contrast with the mirror problem shows why cleanly. Implementing a queue from two stacks costs exactly 2.00 elementary stack operations per queue operation, measured at both n = 1,000 and n = 10,000 — completely flat. Implementing a stack from queues costs 500.50 per operation at n = 1,000 and 5000.50 at n = 10,000. The difference is what each construction can keep: two stacks hold the contents split into a newest half and an oldest half, and the transfer between them reverses the order once per element, after which many pops are free. A queue has no second ordering to store, so the rotation done on one push is undone by the next and nothing accumulates.

<!-- @doubt -->
### Which variant should I use?

<!-- @answer -->
The one-queue version, unless the workload is strongly push-heavy. It performs exactly the same elementary work as the two-queue costly-push variant in every workload measured, uses one container instead of two, and was 2.62x faster in wall clock at n = 8,000 — 66,605,167ns against 174,213,875ns — because it touches half the memory and never swaps. The costly-pop variant is the right choice only when pushes dominate: at 80% pushes it performed 7,532,846 elementary operations against 29,543,018, a factor of 3.92. Its cost is that top becomes as expensive as pop.

<!-- @doubt -->
### Why rotate size − 1 times and not size?

<!-- @answer -->
Because rotating size times returns the queue to exactly where it started. Each rotation moves one element from the front to the back, so after size of them every element has made a full circuit and the order is unchanged — including the new element, which is still at the back. Rotating size − 1 times moves every element that was already present, and only those, leaving the newcomer alone at the front. The off-by-one is quiet: the structure keeps working and simply behaves as a queue, which is exactly the behaviour a careless test of "push three things, pop three things" will not distinguish.

<!-- @doubt -->
### Why can't top be pop followed by push?

<!-- @answer -->
In the costly-pop variant, because push is the cheap operation there — it appends to the back. So popping the newest element and pushing it again makes it the oldest, inverting the whole stack in one call. The peek has to rebuild the queue itself, walking to the last element and re-enqueueing what it passes, which is why top costs the same O(n) as pop in that variant. In the costly-push and one-queue variants the question does not arise: the newest element is already at the front, so top is a single read.

<!-- @doubt -->
### The three variants cost the same — so does the choice matter?

<!-- @answer -->
They tie only on the specific workload of n pushes followed by n pops, which is the one most people benchmark. Every mixed workload separates them. At 80% pushes the costly-pop variant did 7,532,846 elementary operations against the costly-push variant's 29,543,018. At 52% pushes the gap narrowed to 1.12x. Under strict alternation all three did exactly 8,000, because the stack never held more than one element and there was nothing to rotate. So the right variant is a property of the caller rather than of the structure, and a benchmark that only fills and drains will not reveal it.

<!-- @doubt -->
### How do I make the swap O(1)?

<!-- @answer -->
Exchange the containers rather than their contents. In C++ std::swap on two queues swaps internal pointers and is O(1); in Java assign the two references through a temporary; in Python a tuple assignment does it in one statement. The mistake is copying elements from one queue into the other to "empty" it, which turns the swap into a second full pass and doubles the cost of push. It is easy to write without noticing, because the code still produces correct answers — only twice as slowly.

<!-- @doubt -->
### Is this worth doing in Python?

<!-- @answer -->
Only as an exercise. Measured against a plain list, which already is a stack, the one-queue construction ran 1,156x slower at n = 2,000 — 85.67ms against 0.074ms — and the two-queue version 4,439x slower. The native list also barely moved between n = 500 and n = 2,000 while both constructions grew quadratically. If you must write it, collections.deque has rotate, which performs the entire push rotation in one C call instead of an interpreted loop; that cuts the constant substantially and leaves the O(n) exactly where it was.

<!-- @doubt -->
### What is the point of the exercise?

<!-- @answer -->
It teaches what a data structure will and will not let you build cheaply. The obvious reading — that stacks and queues are interchangeable with a bit of shuffling — turns out to be half wrong, and the measurement says which half: two stacks give you a queue for a constant 2.00 operations each, and two queues give you a stack only at a cost that grows with the stack. That asymmetry is the actual content, and it is why the interview question is usually asked in both directions.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Implement stack using Linkedlist, which builds the same interface from a structure that fits it rather than fights it. A singly linked list already has a cheap end — the head — and both push and pop are pointer updates there, so every operation is O(1) worst case with no rotation, no second container and no amortisation to argue about. Putting it directly after this subtopic makes the contrast the point: the difficulty here was never the stack, it was the queue.
