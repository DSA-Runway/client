---
id: implement-queue-using-stack
topic: Queues
title: Implement Queue using Stack
difficulty: Easy
status: ready
prerequisites:
  - implement-queue-using-arrays
  - implement-stack-using-queue
  - implement-stack-using-arrays
  - time-and-space-complexity-basics
relatedIds:
  - implement-stack-using-queue
  - implement-queue-using-arrays
  - implement-queue-using-linkedlist
  - implement-stack-using-linkedlist
  - lru-cache
---

<!-- @summary -->
The mirror of **Implement Stack using Queue**, and the direction that works: that subtopic measured two stacks giving a queue for exactly **2.00** stack operations per queue operation while two queues gave a stack for 5000.50 at n = 10,000. What it could not show is what the constant hides. Measured here, the cost is exactly **four elementary operations per element** under every interleaving tested — 55%, 90%, strict alternation — and yet a single dequeue at a million elements took **2,559,000ns**, 62,415x the median, with exactly one dequeue in a million paying it. The amortisation is real and the spike is real, and they are the same fact seen from two directions.

<!-- @theory -->
## The problem

Implement `enqueue`, `dequeue`, `front` and `empty` using only stack operations —
`push`, `pop`, `top` and `empty`.

## The one idea: a reversal you can keep

A stack hands back its newest element; a queue needs its oldest. So something has
to reverse the order, exactly as in the mirror problem. The difference — and it
is the whole difference — is that **a stack can hold a reversal**.

Keep two stacks. `in` receives new elements. `out` holds elements already
reversed, oldest on top. Pouring `in` into `out` reverses it, and that reversal
*stays reversed* while `out` is drained:

```
enqueue 1,2,3      in = [1,2,3>        out = []            > marks the top

dequeue            pour in -> out
                   in = []             out = [3,2,1>       top is 1, the oldest
                   pop                                     -> 1

enqueue 4          in = [4>            out = [3,2>
dequeue            out is not empty, so no pour            -> 2
dequeue                                                    -> 3
dequeue            now out is empty: pour                  -> 4
```

**Implement Stack using Queue** put the reason precisely: a queue cannot hold
anything in reverse, so its rotation buys nothing that lasts and the next push
has to redo it. Here the work is *paid once per element and reused for many
pops*. That single asymmetry is why this direction amortises and the other does
not.

## Exactly four operations per element

Each element is pushed onto `in`, popped from `in`, pushed onto `out`, and popped
from `out`. Four elementary stack operations, once, in its whole lifetime — and
crucially, **whatever order the calls arrive in**. The mirror subtopic measured
2.00 per queue operation on one workload; here is the same constant across very
different ones:

| workload | enqueues | dequeues | stack ops | per queue op |
|---|---|---|---|---|
| n then n, n = 1,000 | 1,000 | 1,000 | 4,000 | **2.0000** |
| n then n, n = 100,000 | 100,000 | 100,000 | 400,000 | **2.0000** |
| random, 55% enqueue | 109,857 | 109,857 | 439,428 | **2.0000** |
| random, 90% enqueue | 180,032 | 180,032 | 720,128 | **2.0000** |
| strict alternation | 100,000 | 100,000 | 400,000 | **2.0000** |

Not approximately. The total satisfies the identity

```
stack ops  =  4 × (elements fully dequeued)  +  1 × |in|  +  3 × |out|
```

exactly, in every run — the trailing terms being elements that have not finished
their four steps yet. That identity is the amortised proof, in the form you can
check.

## What the constant hides

"Amortised O(1)" is a statement about a *total*, and the flat 2.00 above is
exactly that total. It says nothing about any individual call, and the individual
calls are wildly unequal. A million enqueues followed by a million dequeues:

| | |
|---|---|
| mean dequeue | 31.40ns |
| median dequeue | 41.00ns |
| 99th percentile | 83.00ns |
| **slowest single dequeue** | **2,559,000ns** |
| slowest / median | **62,415x** |
| largest transfer | 1,000,000 elements |
| dequeues that transferred | **1 of 1,000,000** |

One call in a million does all the work — 2.56 milliseconds of it — and the other
999,999 are free. That is the amortisation working exactly as advertised, and it
is also a 2.5ms pause in the middle of your program.

Interleaved traffic spreads it out without removing it. Over 1,000,000 operations
at 55% enqueue:

| | |
|---|---|
| dequeues | 450,346 |
| dequeues that triggered a transfer | **73 (0.02%)** |
| mean transfer size | 7,315 elements |
| largest transfer | 96,440 elements |
| mean dequeue | 20.43ns |
| 99.9th percentile | 84.00ns |
| slowest single dequeue | 46,500ns |

Seventy-three calls out of four hundred and fifty thousand carry the entire
transfer cost. The median dequeue was below the clock's resolution.

This is the same shape **Implement Stack using Linkedlist** measured from the
other side — its slowest single push was 690,292ns against a 14.5ns average,
because a vector doubling landed there. Amortised structures move cost, they do
not delete it. If you have a latency budget rather than a throughput budget, this
is the number that matters, and it is the one the complexity notation hides.

## The guard is the algorithm

`shift()` must do nothing when `out` is non-empty. Remove that one line and the
structure stops being a queue — not slowly, but on the sixth operation:

```
enqueue 1, enqueue 2, dequeue, enqueue 3, dequeue, dequeue

correct     1  2  3
unguarded   1  3  2
```

Pouring `in` onto a non-empty `out` drops the *newer* elements on top of older
ones that are still waiting, and the stack hands the newest back first. The
result is neither FIFO nor LIFO; it is a queue that reorders under exactly the
interleaving — enqueue, dequeue, enqueue, dequeue — most tests use.

The guard is also what makes the cost amortised. Without it, every dequeue
re-reverses everything, and the four-operations-per-element identity collapses.

## Lazy against eager

The other design puts the reversal in `enqueue`: drain `in` to a scratch stack,
push the new element, pour back, so the oldest element is always on top and
`dequeue` is a single pop. It is correct, and it is quadratic:

| n | lazy ops | eager ops | ratio | lazy time | eager time | ratio |
|---|---|---|---|---|---|---|
| 1,000 | 4,000 | 2,000,000 | 500x | 30,500ns | 2,887,333ns | 94.7x |
| 4,000 | 16,000 | 32,000,000 | 2,000x | 87,875ns | 25,990,542ns | 295.8x |
| 16,000 | 64,000 | 512,000,000 | 8,000x | 195,041ns | 169,014,375ns | 866.6x |
| 64,000 | **256,000** | **8,192,000,000** | **32,000x** | 346,750ns | 3,541,462,833ns | **10,213x** |

Both closed forms are exact: lazy is `4n`, eager is `2n²`. Three and a half
seconds against a third of a millisecond at n = 64,000.

Note the asymmetry with the mirror subtopic, which found its three variants cost
*identically* on this workload and only diverged on skewed ones. Here the choice
is not a trade-off at all — lazy dominates eager everywhere, because the eager
version throws away its reversal on every enqueue, which is precisely the disease
the queue-based construction could not cure.

## What it actually costs

4,000,000 data-dependent operations at 55% enqueue, each in its own process, on
the same harness **Implement Queue using Arrays** used:

| | per operation | ratio |
|---|---|---|
| circular buffer (mask) | **3.07ns** | 1.00x |
| two stacks, bulk reverse | 3.57ns | **1.16x** |
| two stacks, pop loop | 3.90ns | 1.27x |
| `std::queue` | 3.90ns | 1.27x |
| two stacks over `std::stack` | 5.27ns | 1.72x |

The surprise is how small 1.16x is. The construction performs **four** elementary
operations per element where the circular buffer performs two, and still lands
within a sixth of it — because all four are sequential `push_back`/`pop_back` on
hot cache lines, and the transfer is a tight loop the prefetcher handles
perfectly. In its bulk-reverse form it is also *faster than `std::queue`*, which
measured 3.90ns.

The last row is the useful warning: the same algorithm over `std::stack` costs
**1.72x**. The container choice matters more here than the algorithm does.

## The transfer as a bulk reverse

The pour loop moves elements one at a time. Reversing `in` in place and swapping
it into `out` does the same thing in one pass with no per-element push:

```cpp
std::reverse(in.begin(), in.end());
out.swap(in);
in.clear();
```

Measured at **3.57ns** against the pop loop's 3.90ns — about **8%** in C++, and
verified identical over 224,368 dequeued values. In Python the same idea,
`out = inn[::-1]`, is worth more: **0.82x**, because it replaces an interpreted
loop with a C one. This is the same class of trick the mirror subtopic noted for
`deque.rotate`.

## Python

| 400,000 data-dependent operations | per operation |
|---|---|
| `collections.deque` | **45ns** |
| two stacks, slice reverse | 48ns |
| two stacks, pop loop | 58ns |
| `list.pop(0)` | 1,367ns |

Two stacks costs **1.30x** the `deque` — and that is notably *better* than the
hand-rolled circular buffer of the previous subtopic, which measured 78ns and
**1.8x**. The reason is worth keeping: this construction uses only `append` and
`pop`, the two operations a Python list is fastest at, with no modulo, no index
arithmetic and no counter. The algorithm with the worse complexity story is the
faster one to write in Python, because it asks the interpreter for less.

The spike is far worse in Python, though. A million enqueues then a million
dequeues:

| | |
|---|---|
| median dequeue | 83ns |
| **slowest single dequeue** | **36,822,625ns** |
| slowest / median | **443,646x** |

Thirty-seven milliseconds, in one call.

## Where this goes next

**Implement Queue using Linkedlist** drops the reversal entirely: with a tail
pointer, both ends are already cheap, so every operation is O(1) **worst case**
with no amortisation and no spike — which makes it the direct answer to the
2,559,000ns measured here.

<!-- @intuition -->
A stack gives you its newest element and a queue owes you its oldest, so something has to reverse the order — and the reason this direction works, where building a stack from queues does not, is that a stack can hold a reversal. Pour one stack into another and the result is reversed; drain that second stack and every pop is free until it runs dry. The work is paid once per element and then reused, which is what makes the whole thing amortised, and the measurement bears it out exactly: four elementary operations per element, no matter how the enqueues and dequeues interleave. The part worth internalising is what that constant does not say. It is a claim about the total, not about any one call, and the calls are wildly unequal — one dequeue in a million did 2.5 milliseconds of work while the other 999,999 did essentially none. Amortised structures move cost around; they do not remove it. Everything else here follows from one line: the transfer must happen only when the output stack is empty. Remove that guard and newer elements land on top of older ones still waiting, and the thing stops being a queue on the sixth operation.

<!-- @approach -->
### Brute Force - Reverse on Every Enqueue

<!-- @idea -->
Keep the oldest element permanently on top of one stack, so dequeue is a single pop — and pay a full reversal on every enqueue to maintain it.

<!-- @steps -->
1. Keep a main stack and a scratch stack.
2. To enqueue, pop the whole main stack onto the scratch stack.
3. Push the new element onto the now-empty main stack.
4. Pour the scratch stack back onto the main stack.
5. The oldest element is now on top, by construction.
6. To dequeue, pop the main stack once.

<!-- @complexity -->
- time: enqueue **O(n)**, dequeue O(1)
- space: O(n) across the two stacks
- note: Correct and quadratic. For n enqueues then n dequeues it performs exactly `2n²` elementary stack operations against the lazy version's `4n` — **8,192,000,000 against 256,000** at n = 64,000, measured at 3.54 seconds against 0.35 milliseconds, a factor of **10,213**. It fails for the same reason the mirror subtopic's constructions all fail: the reversal it builds is destroyed by the very next enqueue instead of being reused.

<!-- @code cpp -->
```cpp
class EagerQueue {
    vector<int> in, tmp;

public:
    void enqueue(int x) {
        while (!in.empty()) { tmp.push_back(in.back()); in.pop_back(); }
        in.push_back(x);
        while (!tmp.empty()) { in.push_back(tmp.back()); tmp.pop_back(); }
    }

    int dequeue() { int oldest = in.back(); in.pop_back(); return oldest; }

    int front() const { return in.back(); }
    bool empty() const { return in.empty(); }
};
```

<!-- @annotations -->
- 6: A full drain on every enqueue, which is where the `2n²` comes from. The reversal built here is thrown away by the next call.
- 8: Pouring back restores the order with the newest element at the bottom, so the oldest sits on top.
- 11: The payoff, and it is genuine — dequeue really is one pop. The trade is simply a bad one.

<!-- @code java -->
```java
class EagerQueue {
    private final Deque<Integer> in = new ArrayDeque<>();
    private final Deque<Integer> tmp = new ArrayDeque<>();

    void enqueue(int x) {
        while (!in.isEmpty()) tmp.push(in.pop());
        in.push(x);
        while (!tmp.isEmpty()) in.push(tmp.pop());
    }

    int dequeue() { return in.pop(); }

    int front()       { return in.peek(); }
    boolean isEmpty() { return in.isEmpty(); }
}
```

<!-- @annotations -->
- 6: `ArrayDeque.push` and `pop` operate on the head, so it behaves as a stack here — which is what `java.util.Stack` should not be used for, being synchronised and `Vector`-backed.

<!-- @code python -->
```python
class EagerQueue:
    def __init__(self):
        self._in = []
        self._tmp = []

    def enqueue(self, x):
        while self._in:
            self._tmp.append(self._in.pop())
        self._in.append(x)
        while self._tmp:
            self._in.append(self._tmp.pop())

    def dequeue(self):
        return self._in.pop()

    def front(self):
        return self._in[-1]

    def is_empty(self):
        return not self._in
```

<!-- @annotations -->
- 7: Two interpreted loops on every enqueue. This is the version that makes Python's constant factor genuinely painful, on top of being quadratic.

<!-- @approach -->
### Optimal - Two Stacks, Transfer When `out` Runs Dry

<!-- @idea -->
Push new elements onto `in`; when `out` is empty, pour `in` into it — which reverses it — and serve every dequeue from `out` until it runs dry again.

<!-- @steps -->
1. Keep two stacks, `in` for arrivals and `out` for departures.
2. To enqueue, push onto `in` and stop — always O(1).
3. To dequeue, first check whether `out` is empty.
4. If it is, pop every element from `in` and push it onto `out`, reversing the order.
5. If it is not, change nothing — the elements already in `out` are older.
6. Pop `out` and return it.
7. `front` is the same, without the final pop.

<!-- @complexity -->
- time: O(1) **amortised** per operation; a single dequeue is O(n)
- space: O(n) across the two stacks
- note: The answer. Each element is pushed and popped once on each stack — exactly four elementary operations in its lifetime, measured at **2.0000** per queue operation under n-then-n, 55%, 70%, 90% and strict alternation alike. The amortisation is genuine and so is what it hides: at a million elements the slowest single dequeue measured **2,559,000ns**, 62,415x the median, with **1 dequeue in 1,000,000** paying the whole transfer. Step 3 is not an optimisation — without it the structure returns elements out of order.

<!-- @code cpp -->
```cpp
class QueueUsingStacks {
    vector<int> in, out;

    void shift() {
        if (!out.empty()) return;
        while (!in.empty()) {
            out.push_back(in.back());
            in.pop_back();
        }
    }

public:
    void enqueue(int x) { in.push_back(x); }

    int dequeue() {
        shift();
        int oldest = out.back();
        out.pop_back();
        return oldest;
    }

    int front() {
        shift();
        return out.back();
    }

    bool empty() const { return in.empty() && out.empty(); }
    size_t size() const { return in.size() + out.size(); }
};
```

<!-- @annotations -->
- 5: The guard, and the entire algorithm. Pouring onto a non-empty `out` puts newer elements above older ones still waiting — measured as `1, 3, 2` on a six-operation script.
- 7: The reversal, and the thing a queue cannot do to itself. It is paid once per element and then reused for every pop until `out` runs dry.
- 13: Always O(1), with no branch and no bookkeeping. All of the variance lives in `dequeue`.
- 23: `front` needs the same shift — the oldest element may still be sitting at the bottom of `in`, where no stack operation can reach it.

<!-- @code java -->
```java
class QueueUsingStacks {
    private final Deque<Integer> in = new ArrayDeque<>();
    private final Deque<Integer> out = new ArrayDeque<>();

    private void shift() {
        if (!out.isEmpty()) return;
        while (!in.isEmpty()) out.push(in.pop());
    }

    void enqueue(int x) { in.push(x); }

    int dequeue() { shift(); return out.pop(); }

    int front()   { shift(); return out.peek(); }

    boolean isEmpty() { return in.isEmpty() && out.isEmpty(); }
    int size()        { return in.size() + out.size(); }
}
```

<!-- @annotations -->
- 6: The same guard. Java's `ArrayDeque` is the array-backed circular buffer of the previous subtopic, so each `push` and `pop` here is the O(1) amortised operation measured there.

<!-- @code python -->
```python
class QueueUsingStacks:
    def __init__(self):
        self._in = []
        self._out = []

    def _shift(self):
        if self._out:
            return
        while self._in:
            self._out.append(self._in.pop())

    def enqueue(self, x):
        self._in.append(x)

    def dequeue(self):
        self._shift()
        return self._out.pop()

    def front(self):
        self._shift()
        return self._out[-1]

    def is_empty(self):
        return not self._in and not self._out
```

<!-- @annotations -->
- 7: The guard, written as a truthiness test — an empty list is falsy, so this reads naturally and costs one interpreted check.
- 10: Only `append` and `pop`, which are the two operations a Python list is fastest at. That is why this construction measured **1.27x** `deque` where the previous subtopic's hand-rolled circular buffer measured 1.8x.

<!-- @approach -->
### Variation - The Transfer as a Bulk Reverse

<!-- @idea -->
Move the whole stack in one pass — reverse it in place and swap it across — instead of pushing elements over one at a time.

<!-- @steps -->
1. Keep the same two stacks and the same guard.
2. When `out` is empty and a transfer is needed, reverse `in` in place.
3. Swap the two containers, which is a pointer exchange rather than a copy.
4. Clear what is now `in`.
5. Serve dequeues from `out` exactly as before.

<!-- @complexity -->
- time: O(1) amortised, with a smaller constant on the transfer
- space: O(n), unchanged
- note: The same algorithm with the per-element push removed from the transfer. Measured at **3.57ns** per operation against the pop loop's 3.90ns — about **8%** in C++ — and verified identical to the model over 224,368 dequeued values. In Python the equivalent `inn[::-1]` is worth more, **0.82x**, because it replaces an interpreted loop with a C one. It does not change the worst case at all: the transfer is still O(n) and still lands on one unlucky call.

<!-- @code cpp -->
```cpp
#include <algorithm>

void shift() {
    if (!out.empty()) return;
    std::reverse(in.begin(), in.end());
    out.swap(in);
    in.clear();
}
```

<!-- @annotations -->
- 5: One pass over the elements with no per-element push, against `n` `push_back` calls in the loop version.
- 6: A pointer exchange, not a copy — `swap` on two vectors trades their buffers in constant time.
- 7: `in` now holds what `out` used to, which is nothing, but clearing keeps the invariant obvious rather than merely true.

<!-- @code java -->
```java
private void shift() {
    if (!out.isEmpty()) return;
    // ArrayDeque has no in-place reverse; iterating in descending order
    // and moving across is the closest equivalent.
    while (!in.isEmpty()) out.push(in.pop());
}
```

<!-- @annotations -->
- 5: Java has no in-place reverse for `ArrayDeque`, so this variation does not transfer — the pop loop is already the idiomatic form here. Reaching for `Collections.reverse` would mean copying into a `List` first, which costs more than it saves.

<!-- @code python -->
```python
def _shift(self):
    if self._out:
        return
    self._out = self._in[::-1]
    self._in = []
```

<!-- @annotations -->
- 4: The whole transfer as one slice, running in C rather than as an interpreted `while` loop. Measured **0.82x** the pop-loop version — a bigger win than the equivalent in C++, for the usual reason.

<!-- @approach -->
### Optimal in Practice - Use the Language's Container

<!-- @idea -->
This construction is an exercise; when you actually need a queue, the standard library already has one.

<!-- @steps -->
1. Reach for the real queue: `std::queue`, `ArrayDeque`, `collections.deque`.
2. Enqueue at the back, dequeue at the front.
3. Keep the two-stack version for the cases where it genuinely applies — see the note.

<!-- @complexity -->
- time: O(1) amortised, with no O(n) call hiding inside
- space: O(n)
- note: `std::queue` measured **3.90ns** per operation, which the two-stack construction actually *beats* at 3.57ns in its bulk-reverse form — so the argument for the library here is not speed but that its worst case is a reallocation rather than a full reversal. The two-stack queue is not merely a puzzle, though: it is how a queue is built from immutable structures where only one end is reachable, which is why it turns up in functional and persistent-data-structure work rather than in ordinary code.

<!-- @code cpp -->
```cpp
#include <queue>

std::queue<int> q;
q.push(10);              // enqueue
int x = q.front();       // peek
q.pop();                 // dequeue
```

<!-- @annotations -->
- 3: Backed by `std::deque`, whose worst-case operation is allocating one more fixed-size block — bounded, unlike a transfer proportional to the whole queue.

<!-- @code java -->
```java
Deque<Integer> q = new ArrayDeque<>();
q.addLast(10);           // enqueue
int x = q.peekFirst();   // peek
q.pollFirst();           // dequeue
```

<!-- @annotations -->
- 1: The same `ArrayDeque` used as the stack in the approaches above — it is a circular buffer, so it serves as either end's structure equally well.

<!-- @code python -->
```python
from collections import deque

q = deque()
q.append(10)             # enqueue
x = q[0]                 # peek
q.popleft()              # dequeue
```

<!-- @annotations -->
- 6: 45ns per operation against the two-stack construction's 57ns, and with no 36-millisecond call waiting inside it.

<!-- @example -->

<!-- @input -->
`enqueue 1, enqueue 2, enqueue 3, dequeue, enqueue 4, dequeue, dequeue, dequeue`

<!-- @output -->
`1, 2, 3, 4` — with exactly two transfers over the whole script

<!-- @why -->
The reuse that makes the amortisation work, on a script short enough to hold in the head.

<!-- @walkthrough -->
1. Three enqueues push onto `in`, which now reads `[1, 2, 3` with 3 on top. `out` is empty.
2. The first dequeue finds `out` empty, so it pours: 3, then 2, then 1 are popped from `in` and pushed onto `out`.
3. `out` now reads `[3, 2, 1` with **1** on top — reversed, so the oldest is reachable. Pop returns 1.
4. Enqueue 4 pushes onto `in` only. It does not touch `out`, and it must not.
5. The second dequeue finds `out` non-empty and skips the transfer entirely, returning 2 for one pop.
6. The third dequeue likewise returns 3 — this is the reuse, and it is why the pour in step 2 was not wasted.
7. The fourth dequeue finds `out` finally empty, pours the single element 4 across, and returns it.
8. Eight queue operations, four elements, sixteen elementary stack operations — exactly four per element, and exactly 2.00 per queue operation.

<!-- @example -->

<!-- @input -->
The same code with the `if (!out.empty()) return;` guard deleted

<!-- @output -->
`1, 3, 2` instead of `1, 2, 3`

<!-- @why -->
The shortest script that breaks it, and it breaks on the most ordinary interleaving there is.

<!-- @walkthrough -->
1. Enqueue 1 and 2, so `in` reads `[1, 2`.
2. The first dequeue pours both across, leaving `out` as `[2, 1` with 1 on top, and returns **1**. Still correct.
3. `out` now holds 2, which is the next element owed to the caller.
4. Enqueue 3 pushes onto `in`.
5. The second dequeue pours again — because the guard is gone — pushing 3 on top of the waiting 2.
6. `out` now reads `[2, 3` with **3** on top, so the pop returns 3 rather than 2.
7. The final dequeue returns 2, giving `1, 3, 2`: neither FIFO nor LIFO.
8. Note which interleaving triggered it — enqueue, dequeue, enqueue, dequeue — because that is the pattern most hand-written tests use, and a fill-then-drain test would never catch it.

<!-- @example -->

<!-- @input -->
A million enqueues, then a million dequeues

<!-- @output -->
One dequeue takes 2,559,000ns; the other 999,999 average 31.40ns

<!-- @why -->
What "amortised O(1)" promises and what it does not.

<!-- @walkthrough -->
1. Every enqueue is O(1), so after a million of them `in` holds a million elements and `out` is empty.
2. The first dequeue finds `out` empty and transfers **all 1,000,000** elements across.
3. That single call measured **2,559,000ns** — 2.56 milliseconds.
4. Every subsequent dequeue finds `out` stocked and pops in constant time, so the median is 41.00ns and the 99th percentile is 83.00ns.
5. Exactly **1 dequeue in 1,000,000** paid a transfer, and it was 62,415x the median.
6. The total is still 4,000,000 elementary operations, so the amortised claim holds perfectly — 2.0000 per queue operation.
7. Both statements are true at once, and which one matters depends on whether you have a throughput budget or a latency budget.
8. Python is far worse: the same experiment measured a slowest dequeue of **36,822,625ns**, or 443,646x its median.

<!-- @example -->

<!-- @input -->
1,000,000 interleaved operations at 55% enqueue

<!-- @output -->
73 of 450,346 dequeues carried the entire transfer cost

<!-- @why -->
The spike does not disappear under realistic traffic; it just becomes harder to find.

<!-- @walkthrough -->
1. With enqueues and dequeues mixed, `out` runs dry repeatedly rather than once.
2. Each time it does, the next dequeue transfers whatever has accumulated in `in`.
3. Measured, only **73** of 450,346 dequeues triggered a transfer — **0.02%**.
4. The average transfer moved 7,315 elements and the largest moved 96,440.
5. The slowest single dequeue was 46,500ns against a mean of 20.43ns.
6. The median was below the resolution of the clock, because the overwhelming majority of dequeues are a single pop.
7. So the distribution is not merely uneven, it is bimodal: almost every call is free and a handful are enormous.
8. A percentile-based latency target will pass at the 99.9th and fail at the maximum, which is exactly the failure mode this structure invites.

<!-- @example -->

<!-- @input -->
Lazy transfer against reversing on every enqueue

<!-- @output -->
`4n` elementary operations against `2n²` — 256,000 against 8,192,000,000 at n = 64,000

<!-- @why -->
The difference between reusing a reversal and rebuilding it.

<!-- @walkthrough -->
1. The eager version keeps the oldest element on top at all times, so its dequeue is a single pop.
2. To maintain that, every enqueue drains the stack to scratch, pushes the new element, and pours back.
3. That is O(n) per enqueue, so n enqueues cost `2n²` elementary operations — measured exactly.
4. The lazy version does the same total reversal work, but **once per element** instead of once per enqueue.
5. Its total is exactly `4n`, and the ratio grows without bound: 500x at n = 1,000 and **32,000x** at n = 64,000.
6. In wall-clock terms at n = 64,000 that was 3,541,462,833ns against 346,750ns — **10,213x**, or three and a half seconds against a third of a millisecond.
7. The eager version fails for precisely the reason **Implement Stack using Queue** found its constructions could not amortise: work done on one operation is destroyed by the next.
8. Unlike that subtopic's three variants, which cost identically on this workload, here there is no trade-off — lazy dominates eager on every input.

<!-- @visualization stack -->

<!-- @description -->
Draw two stacks side by side, `in` on the left and `out` on the right, as vertical columns that grow upward, and run the canonical script across them: enqueue 1, 2, 3, dequeue, enqueue 4, dequeue, dequeue, dequeue. The beat the whole subtopic turns on is the pour, so give it room — when `out` is empty and a dequeue arrives, lift the elements off `in` one at a time and drop them onto `out`, and let the reader watch the order invert as they land, with 1 arriving last and therefore sitting on top. Then, crucially, animate the *next two* dequeues doing nothing but a single pop, with the `in` stack untouched and a caption reading paid once, reused three times — that reuse is the amortisation and it should be visible as three cheap frames following one expensive one. Beside the stacks keep a live counter of elementary stack operations and a second counter of queue operations, so the reader can watch the ratio settle onto exactly 2.00 by the end of the script. Second panel is the guard: run the six-operation script twice in parallel bands, guarded and unguarded, and at the second dequeue show 3 landing on top of the still-waiting 2 in the unguarded band, with the outputs printed beneath as 1 2 3 and 1 3 2 in red. Third panel is the spike, and it should be a plot rather than a table: a million dequeues along the x-axis and time on the y-axis, with a flat line at 41ns and one single spike at 2,559,000ns so tall the axis has to break to show it — annotated 1 call in 1,000,000, 62,415x the median. Under it, the same plot for interleaved traffic, where the flat line is at 20.43ns and there are 73 spikes instead of one, to show the cost being spread rather than removed. Final panel contrasts lazy and eager as two growth curves on one set of axes, 4n against 2n², with the measured points marked and the n = 64,000 pair labelled 256,000 and 8,192,000,000.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"theIdea":"a stack can HOLD a reversal -- pour in into out and the order inverts, and it stays inverted while out is drained, so the work is paid once per element and reused for many pops","mirrorSubtopic":{"name":"Implement Stack using Queue","itMeasured":"two stacks give a queue for exactly 2.00 stack operations per queue operation, while two queues give a stack for 500.50 at n=1,000 rising to 5000.50 at n=10,000","why":"a queue cannot hold anything in reverse, so its rotation buys nothing that lasts and the next push redoes it"},"fourOperationsPerElement":{"identity":"stack ops = 4*(elements fully dequeued) + 1*|in| + 3*|out|, exact in every run","measured":[{"workload":"n then n, n=1000","enqueues":1000,"dequeues":1000,"stackOps":4000,"perQueueOp":2.0},{"workload":"n then n, n=100000","enqueues":100000,"dequeues":100000,"stackOps":400000,"perQueueOp":2.0},{"workload":"random 55% enqueue","enqueues":109857,"dequeues":109857,"stackOps":439428,"perQueueOp":2.0},{"workload":"random 70% enqueue","enqueues":140042,"dequeues":140042,"stackOps":560168,"perQueueOp":2.0},{"workload":"random 90% enqueue","enqueues":180032,"dequeues":180032,"stackOps":720128,"perQueueOp":2.0},{"workload":"strict alternation","enqueues":100000,"dequeues":100000,"stackOps":400000,"perQueueOp":2.0}],"point":"the constant is workload-independent, which is the actual content of the amortised claim"},"whatTheConstantHides":{"nThenN":{"n":1000000,"meanDequeueNs":31.4,"medianDequeueNs":41.0,"p99Ns":83.0,"slowestSingleDequeueNs":2559000,"slowestOverMedian":62415,"largestTransferElements":1000000,"dequeuesThatTransferred":"1 of 1,000,000"},"interleaved":{"operations":1000000,"enqueuePct":55,"dequeues":450346,"dequeuesThatTransferred":73,"pctThatTransferred":0.02,"meanTransferElements":7315,"largestTransferElements":96440,"meanDequeueNs":20.43,"p999Ns":84.0,"slowestSingleDequeueNs":46500,"note":"the median was below the clock's resolution; the distribution is bimodal, not merely uneven"},"sameShapeAs":"Implement Stack using Linkedlist measured a slowest single push of 690,292ns against a 14.5ns average, from a vector doubling","lesson":"amortised structures move cost, they do not delete it -- this is the number complexity notation hides, and it matters if you have a latency budget rather than a throughput budget"},"theGuard":{"line":"if (!out.empty()) return;","script":"enqueue 1, enqueue 2, dequeue, enqueue 3, dequeue, dequeue","correct":"1 2 3","unguarded":"1 3 2","why":"pouring onto a non-empty out drops NEWER elements on top of older ones still waiting, and the stack hands the newest back first","note":"the breaking interleaving is enqueue/dequeue/enqueue/dequeue, which is what most hand-written tests use; a fill-then-drain test never catches it","alsoNote":"without the guard the four-operations-per-element identity collapses and the cost stops being amortised"},"lazyVsEager":{"closedForms":{"lazy":"4n","eager":"2n^2"},"measured":[{"n":1000,"lazyOps":4000,"eagerOps":2000000,"opsRatio":500,"lazyNs":30500,"eagerNs":2887333,"timeRatio":94.7},{"n":4000,"lazyOps":16000,"eagerOps":32000000,"opsRatio":2000,"lazyNs":87875,"eagerNs":25990542,"timeRatio":295.8},{"n":16000,"lazyOps":64000,"eagerOps":512000000,"opsRatio":8000,"lazyNs":195041,"eagerNs":169014375,"timeRatio":866.6},{"n":64000,"lazyOps":256000,"eagerOps":8192000000,"opsRatio":32000,"lazyNs":346750,"eagerNs":3541462833,"timeRatio":10213}],"whyEagerFails":"it throws its reversal away on every enqueue -- precisely the disease the queue-based construction could not cure","contrastWithMirror":"there the three variants cost identically on this workload and diverged only on skewed ones; here lazy dominates eager on every input, so it is not a trade-off"},"whatItCosts":{"workload":"4,000,000 data-dependent operations at 55% enqueue, own process each, same harness as Implement Queue using Arrays","results":[{"impl":"circular buffer (mask)","nsPerOp":3.07,"ratio":1.0},{"impl":"two stacks, bulk reverse","nsPerOp":3.57,"ratio":1.16},{"impl":"two stacks, pop loop","nsPerOp":3.9,"ratio":1.27},{"impl":"std::queue","nsPerOp":3.9,"ratio":1.27},{"impl":"two stacks over std::stack","nsPerOp":5.27,"ratio":1.72}],"surprise":"four elementary operations per element lands within a sixth of a circular buffer's two, because all four are sequential push_back/pop_back on hot cache lines and the transfer is a tight prefetcher-friendly loop -- and in its bulk-reverse form it beats std::queue","warning":"the same algorithm over std::stack costs 1.72x; the container choice matters more than the algorithm"},"bulkReverse":{"cpp":"std::reverse(in.begin(), in.end()); out.swap(in); in.clear();","cppNsPerOp":3.57,"cppVsPopLoop":0.92,"cppGain":"about 8%","verified":"identical to the model over 224,368 dequeued values","python":"out = inn[::-1]","pythonVsPopLoop":0.82,"whyBetterInPython":"it replaces an interpreted loop with a C one","java":"ArrayDeque has no in-place reverse, so the pop loop is already idiomatic there","doesNotChange":"the worst case -- the transfer is still O(n) and still lands on one unlucky call"},"python":{"workload400k":[{"impl":"collections.deque","nsPerOp":45},{"impl":"two stacks, slice reverse","nsPerOp":48},{"impl":"two stacks, pop loop","nsPerOp":58},{"impl":"list.pop(0)","nsPerOp":1367}],"twoStacksVsDeque":1.3,"contrastWithPreviousSubtopic":"the hand-rolled circular buffer measured 78ns and 1.8x; this construction uses only append and pop -- the two operations a Python list is fastest at -- with no modulo, no index arithmetic and no counter","lesson":"the algorithm with the worse complexity story is the faster one to write in Python, because it asks the interpreter for less","spike":{"n":1000000,"medianNs":83,"slowestSingleDequeueNs":36822625,"slowestOverMedian":443646}},"whenItIsActuallyRight":"not ordinary code -- it is how a queue is built from immutable structures where only one end is reachable, which is why it appears in functional and persistent-data-structure work","recommendation":"the lazy two-stack form with the guard, transferring by bulk reverse where the language supports it; reach for the library queue unless the exercise or the immutability constraint is the point","lesson":"the flat 2.00 and the 2,559,000ns single call are the same fact seen from two directions"}
```

<!-- @highlights -->
- Two stacks side by side, `in` on the left and `out` on the right, drawn as columns that grow upward.
- The canonical script runs across them: enqueue 1, 2, 3, dequeue, enqueue 4, dequeue, dequeue, dequeue.
- The pour gets room, because the whole subtopic turns on it.
- Elements lift off `in` one at a time and drop onto `out`, and the order visibly inverts as they land.
- 1 arrives last and therefore sits on top — the oldest element made reachable.
- Then the next two dequeues do nothing but a single pop, with `in` untouched.
- A caption reads paid once, reused three times: three cheap frames following one expensive one.
- That reuse is the amortisation, and it should be visible rather than asserted.
- A live counter of elementary stack operations sits beside a counter of queue operations.
- The ratio settles onto exactly 2.00 by the end of the script.
- Second panel: the six-operation script in two parallel bands, guarded and unguarded.
- At the second dequeue, 3 lands on top of the still-waiting 2 in the unguarded band.
- The outputs print beneath as 1 2 3 and 1 3 2, the second in red.
- Third panel is the spike as a plot, not a table: a million dequeues along x, time on y.
- A flat line at 41ns with one spike at 2,559,000ns so tall the axis has to break.
- Annotated 1 call in 1,000,000, 62,415x the median.
- Beneath it the interleaved version: a flat line at 20.43ns with 73 spikes instead of one.
- That second plot shows the cost being spread rather than removed.
- Final panel: lazy and eager as two growth curves on one set of axes, 4n against 2n².
- The measured points are marked, with the n = 64,000 pair labelled 256,000 and 8,192,000,000.

<!-- @edgeCases -->
- Dequeue from an empty queue — both stacks must be checked; `out` alone being empty means nothing.
- `front` on a queue whose elements are all still in `in` — it needs the same transfer as `dequeue`, not a peek at `in`.
- A single element — enqueued to `in`, transferred alone, popped from `out`; four operations, as always.
- Strict alternation — every dequeue transfers exactly one element, which is the worst *ratio* and the cheapest absolute cost.
- All enqueues, then all dequeues — the best ratio and the worst single call, at 2,559,000ns for a million elements.
- A dequeue arriving while `out` still holds elements — must not transfer, and this is the case the guard exists for.
- `size()` — the sum of both stacks, since elements live in exactly one of them.
- `empty()` — both must be empty; either alone is not enough.
- Transferring when `in` is also empty — harmless, moves nothing, and leaves the empty check to the caller.
- A latency-sensitive caller — this structure is the wrong choice, and the 99.9th percentile will not reveal why.
- Very large queues — the transfer is proportional to everything accumulated, so the spike grows without bound.

<!-- @pitfalls -->
- Dropping the `if (!out.empty()) return;` guard. The queue returns `1, 3, 2` on a six-operation script, and the breaking pattern is the ordinary enqueue/dequeue alternation.
- Testing only with fill-then-drain. That script never exercises the guard, so the most common bug in this structure survives it.
- Implementing `front` as a peek at `in`. The oldest element is at the *bottom* of `in`, which no stack operation reaches.
- Checking only `out` for emptiness. Elements sitting in `in` are still in the queue.
- Reversing on every enqueue to make dequeue cheap. That is `2n²` against `4n` — 10,213x slower at n = 64,000.
- Reading "amortised O(1)" as "every call is fast". One dequeue in a million measured 2,559,000ns, and 36,822,625ns in Python.
- Using this where latency matters. The distribution is bimodal, so percentile targets pass while the maximum fails badly.
- Building it over `std::stack`. The same algorithm measured 1.72x against plain vectors, purely from the container.
- Using `java.util.Stack`. It is synchronised and `Vector`-backed; `ArrayDeque` is the intended stack in modern Java.
- Assuming the construction is slow because it does four operations per element. It measured 1.17x a circular buffer and beat `std::queue`.
- Writing the pop loop in Python when a slice reverse will do. `inn[::-1]` measured 0.84x, because the loop stops being interpreted.
- Reaching for this in ordinary code at all. It is an exercise and a functional-programming technique, not a general-purpose queue.

<!-- @doubt -->
### Why does this need two stacks when the mirror problem could use one queue?

<!-- @answer -->
Because the two constructions are asymmetric in a way that is not about cleverness. **Implement Stack using Queue** found a neat one-queue solution — push, then rotate by `size − 1` — but measured it at `(n+1)/2` elementary operations per stack operation, rising from 500.50 at n = 1,000 to **5000.50** at n = 10,000. It never amortises. The reason it cannot is that **a queue has nowhere to keep a reversal**: rotating puts the newest element at the front, but the very next push has to redo the whole rotation, so no work survives to be reused. A stack can keep one. Pour `in` into `out` and the order inverts; that inversion then *stays* while `out` is drained, so one pass pays for many pops. The second stack is not an extra container for convenience — it is the place the reversal lives. Measured, that gives exactly **2.00** stack operations per queue operation at every size, flat, against the other direction's figure that grows with n.

<!-- @doubt -->
### What does "amortised O(1)" actually promise here?

<!-- @answer -->
It promises that **n operations cost O(n) in total**, and nothing whatsoever about any individual call. Both halves of that are measurable here and both are worth holding. The total is exact: each element is pushed and popped once on each stack, four elementary operations in its lifetime, giving **2.0000** per queue operation — and that constant held identically across n-then-n, 55%, 70%, 90% enqueue and strict alternation, so it genuinely does not depend on the workload. The individual calls are another matter. On a million enqueues followed by a million dequeues, the median dequeue was 41.00ns, the 99th percentile 83.00ns, and **one single dequeue took 2,559,000ns** — 62,415x the median, transferring all million elements. Exactly one call in a million paid for all the others. That is the amortisation working correctly, not failing. Whether it is acceptable depends entirely on whether you are budgeting throughput or latency, and the notation is silent on the difference.

<!-- @doubt -->
### Why must the transfer happen only when `out` is empty?

<!-- @answer -->
Because otherwise you are dropping newer elements on top of older ones that are still waiting, and a stack hands back the top first. It breaks immediately — on the sixth operation of the most ordinary script imaginable: `enqueue 1, enqueue 2, dequeue, enqueue 3, dequeue, dequeue` returns **1, 3, 2** instead of 1, 2, 3. Trace it: the first dequeue pours 1 and 2 across, returns 1, and leaves 2 sitting in `out`. Enqueue 3 goes to `in`. Now an unguarded second dequeue pours 3 on top of 2, so the pop returns 3. The result is neither FIFO nor LIFO. Two things make this worse than an ordinary bug. First, the triggering pattern is enqueue/dequeue/enqueue/dequeue, which is what most hand-written tests do — while a fill-then-drain test passes happily, because `out` is only ever filled once. Second, the guard is also what makes the structure *amortised*: without it every dequeue re-reverses everything, and the four-operations-per-element identity collapses. One line buys both correctness and the complexity.

<!-- @doubt -->
### How slow can a single dequeue actually get?

<!-- @answer -->
Proportional to everything that has accumulated since the last transfer, and that is unbounded. Measured at a million elements: **2,559,000ns** — 2.56 milliseconds — for one call, moving all 1,000,000 elements, against a 41.00ns median. In Python the same experiment gave **36,822,625ns**, nearly **37 milliseconds**, at 443,646x its median. Interleaved traffic spreads the cost but does not remove it: over 1,000,000 mixed operations, only **73 of 450,346** dequeues transferred anything at all — 0.02% — but the largest moved 96,440 elements and the slowest call was 46,500ns against a 20.43ns mean. The distribution is bimodal rather than merely skewed: almost every call is a single pop, and a handful are enormous. That is a specific trap for latency work, because a 99.9th-percentile target passes comfortably while the maximum misses by orders of magnitude. This is the same shape **Implement Stack using Linkedlist** measured from the other side, where a vector doubling produced a 690,292ns push against a 14.5ns average.

<!-- @doubt -->
### Is this slower than a real queue?

<!-- @answer -->
Much less than you would expect. On 4,000,000 data-dependent operations, using the same harness as **Implement Queue using Arrays**: the circular buffer measured **3.07ns** per operation, the two-stack queue with a bulk reverse **3.57ns** — **1.16x** — and the pop-loop version 3.90ns. The bulk-reverse form actually *beats* `std::queue`, which measured 3.90ns. That is surprising given it performs four elementary operations per element where the circular buffer performs two, and the reason is that all four are sequential `push_back`/`pop_back` on hot cache lines, with the transfer being a tight loop the prefetcher handles perfectly — cheap operations done four times beat expensive operations done twice. One caveat that matters more than the algorithm: building the same thing over `std::stack` measured **5.27ns**, or 1.72x. The container you pick for the two stacks dominates the result. So the honest summary is that the construction is not slow; it is simply the wrong shape for latency, because of where its cost lands rather than how much of it there is.

<!-- @doubt -->
### Would reversing on enqueue instead be better?

<!-- @answer -->
No, and not marginally — it is quadratic. The eager design keeps the oldest element permanently on top by draining to a scratch stack, pushing the new element and pouring back on **every** enqueue, which makes dequeue a single pop. The cost is exactly `2n²` elementary operations against the lazy version's `4n`: at n = 64,000 that is **8,192,000,000 against 256,000**, and in wall-clock **3,541,462,833ns against 346,750ns**, a factor of **10,213**. It fails for exactly the reason the mirror subtopic's queue-based constructions fail — the reversal it builds is destroyed by the next enqueue rather than reused. Worth noting the contrast with that subtopic explicitly: there, the three variants cost *identically* on n-pushes-then-n-pops and only separated on skewed workloads, so choosing between them was a real judgement about your traffic. Here there is no judgement to make. Lazy dominates eager on every input, and the only thing eager buys is a dequeue with no spike in it — at a price nobody would pay.

<!-- @doubt -->
### How do I implement `front` and `size`?

<!-- @answer -->
`front` needs the **same transfer** as `dequeue`, then a peek instead of a pop. This catches people out, because it looks like a read-only operation that should be cheap. It is not: if `out` is empty, the oldest element is sitting at the *bottom* of `in`, and no stack operation can reach it without moving everything above it. So `front` calls `shift()` first and inherits the same amortised cost and the same worst case — a `front()` call can be the one that takes 2.56 milliseconds. `size` is the sum of both stacks, since every element is in exactly one of them, and `empty` requires **both** to be empty — checking `out` alone is a bug that reports an empty queue while elements are waiting in `in`. None of these need any extra bookkeeping, unlike the circular buffer of the previous subtopic, where `size` forced a choice between a count field and a modulo.

<!-- @doubt -->
### Is there ever a reason to use this instead of a real queue?

<!-- @answer -->
In ordinary imperative code, no — use `std::queue`, `ArrayDeque` or `collections.deque`. But the construction is not merely an interview exercise, and it is worth knowing why. It is how you build a queue when **only one end of your structure is reachable**, which is the situation in functional and persistent data structures: a singly linked immutable list gives you cheap access at the head and nothing at the tail, so a queue is represented as a front list and a reversed back list, with exactly the transfer described here. That is where this design actually lives. It also has a genuine pedagogical role as the cleanest example of amortised analysis you will meet, precisely because the accounting is exact — four operations per element, verifiable by counting. And if you need the amortisation without the spike, the same literature has an answer: real-time queues transfer a few elements per operation instead of all of them at once, converting the amortised bound into a worst-case one, at the cost of a much fiddlier implementation.

<!-- @doubt -->
### What should I write in Python?

<!-- @answer -->
`collections.deque` for real work, at 45ns per operation. But this construction is the one hand-written queue in this topic that comes close: two lists measured **58ns** with a pop loop and **48ns** with a slice reverse, so **1.30x** the library. Compare that with the previous subtopic's hand-rolled circular buffer, which measured 78ns and **1.8x**. The reason is worth carrying: the two-stack queue asks Python for nothing but `append` and `pop`, which are the two operations a list is fastest at, with no modulo, no index arithmetic and no counter to maintain. The algorithm with the worse complexity story is the easier one for the interpreter to run. The slice-reverse transfer — `self._out = self._in[::-1]; self._in = []` — is worth taking, at **0.82x** the pop loop, because it moves the reversal into C. What none of that fixes is the spike, which is far worse in Python than in C++: a single dequeue measured **36,822,625ns** on a million-element queue, against C++'s 2,559,000ns.
