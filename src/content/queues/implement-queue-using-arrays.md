---
id: implement-queue-using-arrays
topic: Queues
title: Implement Queue using Arrays
difficulty: Easy
status: ready
prerequisites:
  - implement-stack-using-arrays
  - left-rotate-array-by-k-places
  - time-and-space-complexity-basics
relatedIds:
  - implement-stack-using-arrays
  - implement-stack-using-queue
  - implement-queue-using-linkedlist
  - implement-queue-using-stack
  - sliding-window-maximum
---

<!-- @summary -->
A stack touches one end of the array, so an index is enough. A queue touches both, and that single difference is the whole subtopic. The two obvious fixes both fail measurably: shifting on dequeue costs exactly `n(n-1)/2` element moves — **499,999,500,000** at a million, the same figure **Implement Stack using Arrays** measured for growing by one — and letting the window walk right refuses its 1,001st enqueue at capacity 1,000 **while holding zero elements**. The circular buffer fixes both, at the price of a real subtlety: `head == tail` means empty *and* full, and a queue in flight is wrapped **99.2%** of the time, so growing it by copying the array straight across silently reorders it.

<!-- @theory -->
## The whole data structure

A queue is first-in, first-out. Backed by an array, that needs somewhere to put
the elements and two indices — one for each end.

```
        a = [ 10 | 20 | 30 |    |    ]
               ^              ^
             head           tail        size = 3
```

- **enqueue(x)** — write at `tail`, advance `tail`.
- **dequeue()** — read at `head`, advance `head`.
- **front()** — read `a[head]` without moving.
- **empty()**, **size()**.

That looks like the stack with one more index. It is not, and the reason is the
first thing worth stating plainly.

## Why the array is harder here

The previous subtopic's stack worked so well because **a stack only ever touches
one end**. Nothing shifts, nothing searches, and the array's one weakness —
inserting or removing anywhere but the end — never comes up.

A queue removes from the front and adds at the back. The front is exactly the
position an array is worst at. So the array is no longer a natural fit, and every
implementation below is a different answer to *how do you avoid paying for that*.

## The first fix: shift on dequeue

Keep the front pinned at index 0 and slide everything left when you remove it.
`dequeue` is now O(n), and the total is the familiar sum:

| n enqueue/dequeue pairs | element moves | `n(n-1)/2` |
|---|---|---|
| 1,000 | 499,500 | 499,500 |
| 10,000 | 49,995,000 | 49,995,000 |
| 100,000 | 4,999,950,000 | 4,999,950,000 |
| 1,000,000 | **499,999,500,000** | 499,999,500,000 |

Exact at every size. That last number is worth recognising: **Implement Stack
using Arrays** measured the identical 499,999,500,000 for growing an array one
element at a time. Same quadratic, reached by a completely different mistake —
one grows by one, this one shifts by one — which is a good reminder that O(n²)
is a shape, not a specific bug.

The wall clock agrees. Timing `vector::erase(begin())` on a data-dependent
script, total time when `n` doubles:

| n | total | per operation | vs previous |
|---|---|---|---|
| 50,000 | 4,269,959ns | 85.40ns | — |
| 100,000 | 10,521,042ns | 105.21ns | 2.46x |
| 200,000 | 42,954,833ns | 214.77ns | **4.08x** |
| 400,000 | 188,949,416ns | 472.37ns | **4.40x** |

Four times the work for twice the input. The circular buffer below performs
**zero** element moves at every one of those sizes.

## The second fix: let the window walk

Keep two indices and never move any data — `head++` on dequeue, `tail++` on
enqueue. Both operations are genuinely O(1), and the structure is broken anyway,
because the live window marches rightward and never reclaims what it leaves
behind.

Measured, capacity 1,000, alternating one enqueue and one dequeue so the queue
never holds more than a single element:

```
enqueues served before it reported FULL  : 1000
largest number of elements ever held     : 1
slots in use at the moment it refused    : 0
usable fraction of the array             : 0.0%
```

It refuses the 1,001st enqueue **while completely empty**. A capacity-`C` queue
of this design serves exactly `C` enqueues in its whole lifetime, no matter how
many you take out. The array is not full; it has been *used up*.

## The circular buffer

Let the indices wrap. When an index runs off the end it goes back to zero, so the
array becomes a ring with no end to walk off:

```
capacity 4, after enqueue 1..4, dequeue twice, enqueue 5,6

        a = [ 5 | 6 | 3 | 4 ]
                    ^
                  head = 2, count = 4        reads 3, 4, 5, 6
```

`enqueue` writes at `(head + count) % capacity`; `dequeue` reads `a[head]` and
sets `head = (head + 1) % capacity`. Every operation is O(1) **worst case** —
no shifting, no amortisation, nothing to reclaim. Verified against a model over
800,000 random operations at 55% enqueue, with 360,222 dequeued values compared
and **zero mismatches**.

## `head == tail` is ambiguous

The one genuine subtlety. With only two indices, the empty state and the full
state are indistinguishable:

```
start            head=0 tail=0     head == tail
after 4 pushes   head=0 tail=0     head == tail       array holds [1 2 3 4]
```

Identical state, opposite meanings. There are three standard fixes:

- **Keep a count.** `empty()` is `count == 0`, `full()` is `count == capacity`.
  Both are trivial, `size()` is free, and it costs one integer.
- **Sacrifice a slot.** Allocate `capacity + 1` and call it full when
  `(tail + 1) % size == head`. At capacity 4,096 ints that is 4 extra bytes,
  **0.024%**.
- **Keep a boolean** that records whether the last operation was an enqueue.

The count is the one to reach for: it makes `size()` O(1) without a modulo, which
the sacrificed-slot version cannot do. What is not optional is picking one — two
bare indices genuinely cannot express the difference.

## What the wraparound actually costs

`% capacity` is a division, and the usual advice is to avoid it with a
conditional or a power-of-two mask. Measured on a serially dependent index chain,
where nothing can hide the latency:

| | per step | vs mask |
|---|---|---|
| `i = (i + 1) % cap` | 3.18ns | **5.47x** |
| `i = (i + 1 == cap) ? 0 : i + 1` | 0.865ns | 1.49x |
| `i = (i + 1) & (cap - 1)` | **0.581ns** | 1.00x |

Flat across capacities of 1,024, 65,536 and 1,048,576 — it really is a division,
not something the compiler strength-reduced, because the capacity is a runtime
value.

Now the same three inside an actual queue, 4,000,000 data-dependent operations,
reported as the median of five runs because one run cannot separate them:

| | per operation | vs mask |
|---|---|---|
| modulo | **3.05ns** | **0.99x** |
| mask | 3.07ns | 1.00x |
| conditional | 3.14ns | **1.02x** |

**The 5.47x does not shrink — it disappears.** The modulo is not slower than the
mask in a working queue; across ten paired trials it was *faster* in eight of
them, at a median ratio of 0.995x. The division is entirely hidden behind the
queue's unpredictable branches and its memory traffic, which is the kind of work
an out-of-order core uses to fill a stall.

The useful result is the third row. The conditional — the standard advice for
avoiding a division — is the **slowest** of the three, and reproducibly so: 3.14ns
in all ten trials, with a spread of 0.04ns. Trading a hidden division for a branch
the processor has to predict makes the operation measurably worse.

So write the modulo. It is the clearest of the three, it does not require a
power-of-two capacity, and it costs nothing. An earlier draft of this container
reported 3.19 / 3.16 / 3.07 from a single run and concluded the mask was worth
4%; that ordering was noise, and ten paired trials reversed it.

## Growing a circular buffer

If the queue grows instead of refusing, the wraparound bites. The live elements
may straddle the end of the array, so copying the array straight across preserves
the *slots* and destroys the *order*:

```
array [5 6 3 4], head = 2, count = 4      logical contents: 3 4 5 6

copy the array across, keep head = 2      ->  drained: 3 4 0 0 7   WRONG
copy in logical order, reset head = 0     ->  drained: 3 4 5 6 7   correct
```

The zeros are untouched slots in the new half, read back as data. Nothing throws.

This is not an edge case. Sampling a live queue across 2,000,000 operations, its
contents were wrapped **99.2%** of the time — the unwrapped state is the rare
one. Growth must walk `count` elements from `head` in logical order and reset
`head` to zero, which is O(n) but happens on the same doubling schedule the stack
container measured, so it stays amortised O(1).

## Against the library

4,000,000 data-dependent operations at 55% enqueue, each implementation in its
own process:

| | per operation | ratio |
|---|---|---|
| circular buffer, modulo | **3.05ns** | 0.99x |
| circular buffer, mask | 3.07ns | 1.00x |
| circular buffer, conditional | 3.14ns | 1.02x |
| `std::deque` | 3.88ns | **1.26x** |
| `std::queue` (deque-backed) | 3.90ns | 1.27x |

The hand-written queue wins by about **26%**, almost exactly the **1.30x** the
stack container measured for a raw array against `std::vector`. The prize is the
same size and comes from the same place: no bounds logic, no indirection.

Memory is a wash — 4.00 bytes per element for the circular buffer against 4.03
for `std::deque` at sixteen million ints — so the deque's cost is per-operation,
not per-element.

And the benchmark caveat from that subtopic applies here unchanged: a
fill-then-drain loop measures a bulk copy rather than a queue. Every figure above
comes from an interleaved script where the value enqueued depends on the value
last dequeued.

## Python: do not write this at all

| 400,000 data-dependent operations | per operation |
|---|---|
| `collections.deque` | **45ns** |
| list + a head index | 51ns |
| hand-rolled circular list | 78ns |
| `list` with `pop(0)` | 1,367ns |
| `queue.Queue` | 489ns |

The hand-rolled circular buffer is **1.74x slower** than `deque` — the modulo,
the indexing and the counter are each an interpreted operation, and `deque` is a
C-level doubly linked list of blocks. This is the same result the stack container
found, more emphatically: in Python the manual version is not a trade-off, it is
just worse.

Two traps in that table. `list.pop(0)` is the O(n) one, and its cost against
`deque` grows with the queue: **2.2x** at 20,000 operations, **6.5x** at 100,000,
**30.0x** at 400,000. Isolated, one operation, minimum of 200:

| n | `list.pop()` | `list.pop(0)` | `deque.popleft()` |
|---|---|---|---|
| 1,000 | 41ns | 125ns | 41ns |
| 10,000 | 42ns | 1,500ns | 41ns |
| 100,000 | 42ns | 14,333ns | 42ns |
| 1,000,000 | 42ns | **171,417ns** | **42ns** |

Ten times the list, ten times the cost — exactly linear — against a flat 42ns.

The second trap is `queue.Queue`, which is **11x** slower than `deque` because it
is a *thread-safe* queue and acquires a lock on every operation. It is the
obvious-looking import and the wrong one for a single-threaded FIFO;
`collections.deque` is what `queue.Queue` is built on.

## Where this goes next

**Implement Queue using Stack** asks for the same FIFO from a structure that only
has one usable end, and the answer — two stacks, with the amortised transfer
between them — is the first place in this topic where an operation is O(n) in the
worst case and O(1) on average, which is a genuinely different guarantee from
anything measured here.

<!-- @intuition -->
Everything in this subtopic follows from one sentence: a stack touches one end of the array and a queue touches two. The array's single weakness is removing from the front, and that is precisely the operation a queue needs, so the naive implementations are each an attempt to dodge it. Shifting everything left keeps the front at index 0 and pays n(n-1)/2 element moves for the privilege. Letting the two indices walk rightward never moves any data, and instead consumes the array permanently — a capacity-1,000 queue that refuses the 1,001st enqueue while holding nothing at all. The circular buffer is the fix that costs neither, by noticing that an array only has an end because you decided it does; wrap the indices and it becomes a ring. What you buy with that is one real problem, which is that head == tail can no longer tell you whether the queue is empty or full, and one hidden one, which is that a queue in flight is almost always wrapped, so anything that copies the raw array — growing it, most obviously — will reorder the contents without complaining. The rest is measurement, and the measurements mostly say the micro-optimisations do not matter and the structural choices do.

<!-- @approach -->
### Brute Force - Shift on Dequeue

<!-- @idea -->
Keep the front pinned at index 0, and slide every remaining element one slot left whenever you remove it.

<!-- @steps -->
1. Store the elements in an array with the front at index 0.
2. To enqueue, append at the end.
3. To dequeue, read the element at index 0.
4. Move every remaining element one slot to the left.
5. Shrink the logical size by one.
6. The front is at index 0 again, by construction.

<!-- @complexity -->
- time: enqueue O(1) amortised, dequeue **O(n)**
- space: O(n)
- note: Correct, and the reason the rest of this subtopic exists. Draining `n` elements performs exactly `n(n-1)/2` moves — **499,999,500,000** at a million, the same figure **Implement Stack using Arrays** measured for growing an array one element at a time. Measured wall-clock quadrupled for each doubling of `n`: 4.08x from 100,000 to 200,000 and 4.40x from 200,000 to 400,000.

<!-- @code cpp -->
```cpp
class ShiftingQueue {
    vector<int> a;

public:
    void enqueue(int x) { a.push_back(x); }

    int dequeue() {
        int x = a.front();
        a.erase(a.begin());
        return x;
    }

    int front() const { return a.front(); }
    bool empty() const { return a.empty(); }
    size_t size() const { return a.size(); }
};
```

<!-- @annotations -->
- 9: The whole cost of this design, in one call. `erase(begin())` moves every later element one slot left, so a dequeue from a queue of `n` touches `n - 1` elements.
- 5: Enqueue is fine — appending at the end is the operation an array is good at. Only the front is the problem.

<!-- @code java -->
```java
class ShiftingQueue {
    private final List<Integer> a = new ArrayList<>();

    void enqueue(int x) { a.add(x); }

    int dequeue() { return a.remove(0); }

    int front()       { return a.get(0); }
    boolean isEmpty() { return a.isEmpty(); }
    int size()        { return a.size(); }
}
```

<!-- @annotations -->
- 6: `ArrayList.remove(0)` is `System.arraycopy` of everything after it — the same O(n) shift, hidden behind a method call that looks like O(1).

<!-- @code python -->
```python
class ShiftingQueue:
    def __init__(self):
        self._a = []

    def enqueue(self, x):
        self._a.append(x)

    def dequeue(self):
        return self._a.pop(0)

    def front(self):
        return self._a[0]

    def is_empty(self):
        return not self._a

    def size(self):
        return len(self._a)
```

<!-- @annotations -->
- 9: `pop(0)` is the O(n) one. Measured at 171,417ns on a million-element list against 42ns for `pop()` from the other end and 42ns for `deque.popleft()`.

<!-- @approach -->
### Two Indices That Never Wrap

<!-- @idea -->
Move the front index forward instead of moving the data, and accept that the live window walks rightward.

<!-- @steps -->
1. Allocate a fixed array and keep two indices, `head` and `tail`.
2. The live elements are the half-open range from `head` to `tail`.
3. To enqueue, write at `tail` and advance it — refusing if it has reached the end.
4. To dequeue, read at `head` and advance it.
5. The queue is empty when `head` equals `tail`.
6. Nothing ever reclaims the slots before `head`.

<!-- @complexity -->
- time: enqueue O(1), dequeue O(1) — both genuinely worst case
- space: O(capacity), of which an unbounded fraction is unusable
- note: The operations are as fast as they will ever get and the structure is still wrong. A capacity-`C` queue serves exactly `C` enqueues in its lifetime however many you remove. Measured at capacity 1,000 alternating enqueue and dequeue: it refused the 1,001st enqueue while holding **zero** elements, with **0.0%** of the array in use. Shown here because it is the natural second attempt and because the circular buffer is exactly this with one operator changed.

<!-- @code cpp -->
```cpp
class WalkingQueue {
    vector<int> a;
    size_t head = 0, tail = 0;

public:
    explicit WalkingQueue(size_t capacity) : a(capacity) {}

    bool enqueue(int x) {
        if (tail == a.size()) return false;
        a[tail++] = x;
        return true;
    }

    int dequeue() { return a[head++]; }

    bool empty() const { return head == tail; }
    size_t size() const { return tail - head; }
};
```

<!-- @annotations -->
- 9: The refusal that is wrong. `tail` reaching the end says the array has been written to the end, not that the queue is full — measured refusing an enqueue with 0 elements held and 0.0% of the array in use.
- 14: O(1) and it never gives anything back. Every slot before `head` is live memory that this design can never reuse.
- 17: `tail - head` is a correct size only because the indices never wrap. The moment they do, this becomes the modulo expression the next approach needs.

<!-- @code java -->
```java
class WalkingQueue {
    private final int[] a;
    private int head = 0, tail = 0;

    WalkingQueue(int capacity) { a = new int[capacity]; }

    boolean enqueue(int x) {
        if (tail == a.length) return false;
        a[tail++] = x;
        return true;
    }

    int dequeue() { return a[head++]; }

    boolean isEmpty() { return head == tail; }
    int size()        { return tail - head; }
}
```

<!-- @annotations -->
- 8: Identical failure in Java. The array is not full here — it has been used up, which is a different condition that this test cannot distinguish.

<!-- @code python -->
```python
class WalkingQueue:
    def __init__(self, capacity):
        self._a = [None] * capacity
        self._head = 0
        self._tail = 0

    def enqueue(self, x):
        if self._tail == len(self._a):
            return False
        self._a[self._tail] = x
        self._tail += 1
        return True

    def dequeue(self):
        x = self._a[self._head]
        self._head += 1
        return x

    def is_empty(self):
        return self._head == self._tail
```

<!-- @annotations -->
- 8: The Python form of the same leak. A growable list plus a head index avoids the refusal but leaks memory instead — the prefix before `_head` is never freed, and it measured 51ns per operation against `deque`'s 45ns for the trouble.

<!-- @approach -->
### Optimal - The Circular Buffer

<!-- @idea -->
Let the indices wrap around to zero when they run off the end, so the array becomes a ring with no end to walk off.

<!-- @steps -->
1. Allocate a fixed array, and keep `head` plus a `count` of live elements.
2. The queue is empty when `count` is zero and full when `count` equals the capacity.
3. To enqueue, refuse if full, otherwise write at `(head + count) % capacity`.
4. Increment `count`.
5. To dequeue, read `a[head]`.
6. Advance `head` to `(head + 1) % capacity`.
7. Decrement `count`.

<!-- @complexity -->
- time: O(1) **worst case** for every operation — no shifting and nothing to amortise
- space: O(capacity), all of it usable
- note: The answer. Verified against a model over 800,000 random operations with 360,222 dequeued values compared and **zero mismatches**, performing **zero** element moves where the shifting version performed 499,999,500,000. The `count` field is what makes `head == tail` unambiguous; without it, empty and full are the same state. Measured at **3.05ns** per operation with `%` against 3.07ns with a power-of-two mask — indistinguishable — where those same two expressions differ by 5.47x in isolation.

<!-- @code cpp -->
```cpp
class CircularQueue {
    vector<int> a;
    size_t head = 0, count = 0;

public:
    explicit CircularQueue(size_t capacity) : a(capacity) {}

    bool enqueue(int x) {
        if (count == a.size()) return false;
        a[(head + count) % a.size()] = x;
        count++;
        return true;
    }

    int dequeue() {
        int x = a[head];
        head = (head + 1) % a.size();
        count--;
        return x;
    }

    int front() const { return a[head]; }
    bool empty() const { return count == 0; }
    bool full()  const { return count == a.size(); }
    size_t size() const { return count; }
};
```

<!-- @annotations -->
- 3: `count` rather than a second index, and this is the design decision. It makes `empty`, `full` and `size` all trivial, where two bare indices cannot even distinguish the first two.
- 10: The tail is computed rather than stored — `head + count` is where the next element goes, wrapped. One less thing to keep in step.
- 17: The wraparound. Measured at 3.18ns in isolation against 0.581ns for `& (cap - 1)` — 5.47x — and yet **indistinguishable from it** inside a real queue, where the division hides behind everything else the operation does.
- 25: O(1) because `count` is maintained. With the sacrificed-slot convention this line needs `(tail + capacity - head) % capacity` instead, and `full()` above becomes `(tail + 1) % capacity == head`.

<!-- @code java -->
```java
class CircularQueue {
    private final int[] a;
    private int head = 0, count = 0;

    CircularQueue(int capacity) { a = new int[capacity]; }

    boolean enqueue(int x) {
        if (count == a.length) return false;
        a[(head + count) % a.length] = x;
        count++;
        return true;
    }

    int dequeue() {
        int x = a[head];
        head = (head + 1) % a.length;
        count--;
        return x;
    }

    int front()       { return a[head]; }
    boolean isEmpty() { return count == 0; }
    boolean isFull()  { return count == a.length; }
    int size()        { return count; }
}
```

<!-- @annotations -->
- 9: `(head + count) % a.length` cannot overflow for any capacity Java can allocate, since both terms are bounded by the array length. Adding two indices that each approach `Integer.MAX_VALUE` — as the walking version's would — could.

<!-- @code python -->
```python
class CircularQueue:
    def __init__(self, capacity):
        self._a = [None] * capacity
        self._head = 0
        self._count = 0

    def enqueue(self, x):
        if self._count == len(self._a):
            return False
        self._a[(self._head + self._count) % len(self._a)] = x
        self._count += 1
        return True

    def dequeue(self):
        x = self._a[self._head]
        self._head = (self._head + 1) % len(self._a)
        self._count -= 1
        return x

    def front(self):
        return self._a[self._head]

    def is_empty(self):
        return self._count == 0

    def size(self):
        return self._count
```

<!-- @annotations -->
- 10: Correct, and **1.74x slower than `collections.deque`** — 78ns per operation against 45ns. Each of the modulo, the indexing and the counter is a separate interpreted operation. Write this to show you understand the structure, not to use it.

<!-- @approach -->
### Optimal in Practice - Use the Language's Container

<!-- @idea -->
Every standard library already ships a double-ended queue; reach for it unless you are being asked to build one.

<!-- @steps -->
1. Pick the container that is already a queue: `std::queue`, `ArrayDeque`, `collections.deque`.
2. Enqueue at the back.
3. Read and remove at the front.
4. Let the library own the capacity, the wraparound and the growth.

<!-- @complexity -->
- time: O(1) amortised per operation
- space: O(n)
- note: Measured **1.27x** slower than the hand-written circular buffer in C++ — 3.90ns against 3.07ns — which is almost exactly the 1.30x the stack container measured for `std::vector` against a raw array, and comes from the same bounds logic and indirection. Memory is a wash at 4.03 bytes per element against 4.00. In Python the library version is not a compromise but the fastest thing available: `deque` at 43ns against the hand-rolled circular list's 78ns.

<!-- @code cpp -->
```cpp
#include <queue>
#include <deque>

std::queue<int> q;          // std::deque underneath
q.push(10);                 // enqueue
int x = q.front();          // peek
q.pop();                    // dequeue -- returns void

std::deque<int> d;          // when you want both ends
d.push_back(10);
d.push_front(5);
d.pop_front();
```

<!-- @annotations -->
- 7: `pop()` returns `void`, so peeking and removing are two calls. That is deliberate — returning by value could throw after the element was already removed.
- 4: `std::queue` is an adaptor, not a container. Its default backing is `std::deque`; `std::queue<int, std::list<int>>` also works and is slower.

<!-- @code java -->
```java
Deque<Integer> q = new ArrayDeque<>();
q.addLast(10);              // enqueue
int x = q.peekFirst();      // peek
q.pollFirst();              // dequeue

// java.util.Queue is an interface; LinkedList also implements it,
// but ArrayDeque is the array-backed circular buffer of this subtopic.
```

<!-- @annotations -->
- 1: `ArrayDeque` **is** the circular buffer described above, with a power-of-two capacity and a mask rather than a modulo — an optimisation measured at 1.00x inside a working queue, so it is a consequence of its sizing policy rather than a reason for it.

<!-- @code python -->
```python
from collections import deque

q = deque()
q.append(10)                # enqueue
x = q[0]                    # peek
q.popleft()                 # dequeue

q = deque(maxlen=1000)      # bounded: appending past the limit drops from the front
```

<!-- @annotations -->
- 6: 45ns per operation, flat at every size measured. The `list` equivalent, `pop(0)`, was 1,367ns on the same workload and 171,417ns as a single operation on a million-element list.
- 8: `maxlen` gives a bounded queue that silently discards from the other end rather than refusing — useful for a rolling window, wrong if you needed the refusal.

<!-- @example -->

<!-- @input -->
`capacity = 4`, then: enqueue 1, 2, 3, 4 — dequeue twice — enqueue 5, 6

<!-- @output -->
Array `[5, 6, 3, 4]` with `head = 2`, `count = 4`; draining reads 3, 4, 5, 6

<!-- @why -->
The wrap itself, on the smallest array that shows it.

<!-- @walkthrough -->
1. Four enqueues fill the array left to right: `[1, 2, 3, 4]`, `head = 0`, `count = 4`.
2. Dequeue reads `a[0] = 1`, advances `head` to 1, `count` to 3.
3. Dequeue reads `a[1] = 2`, advances `head` to 2, `count` to 2 — the queue now holds 3 and 4.
4. Slots 0 and 1 are free, but they are *behind* the front, which is what defeated the walking version.
5. Enqueue 5 writes at `(head + count) % 4` = `(2 + 2) % 4` = **0**, reusing the first slot.
6. Enqueue 6 writes at `(2 + 3) % 4` = 1, and `count` reaches 4 — full again, with nothing moved.
7. Draining follows `head` around the ring and reads 3, 4, 5, 6 — first in, first out, from an array whose physical order is `[5, 6, 3, 4]`.

<!-- @example -->

<!-- @input -->
Capacity 1,000, alternating one enqueue and one dequeue

<!-- @output -->
Refuses the 1,001st enqueue while holding **0** elements

<!-- @why -->
The clearest possible statement of what "the array is full" fails to mean.

<!-- @walkthrough -->
1. The queue never holds more than one element — every enqueue is immediately followed by a dequeue.
2. `head` and `tail` advance together, staying one apart and then equal.
3. After 1,000 such pairs, `tail` has reached the end of the array.
4. The test `tail == capacity` fires and the enqueue is refused.
5. At that moment `head == tail`, so `size()` is 0 and `empty()` is true.
6. **0.0%** of the array is in use, and every one of the 1,000 slots is dead.
7. A capacity-`C` queue of this design serves exactly `C` enqueues in its entire lifetime, which makes the capacity a lifetime budget rather than a limit on simultaneous elements.

<!-- @example -->

<!-- @input -->
`head == tail` on an empty queue, and on a full one

<!-- @output -->
Identical state, opposite meanings

<!-- @why -->
The one genuine subtlety of the circular buffer, and why a third field is not optional.

<!-- @walkthrough -->
1. A fresh capacity-4 queue has `head = 0` and `tail = 0`.
2. Enqueue four elements; each advances `tail`, and the fourth wraps it back to 0.
3. The array now holds `[1, 2, 3, 4]` and `head = 0`, `tail = 0` again.
4. The two states are byte-identical, and one is empty while the other is full.
5. Keeping a `count` resolves it directly: 0 against 4.
6. Sacrificing a slot resolves it by making the full state unreachable — declare full at `(tail + 1) % size == head`, costing 4 bytes at capacity 4,096, or **0.024%**.
7. The count is the better default because it also makes `size()` O(1) with no modulo, which the sacrificed-slot form cannot manage.

<!-- @example -->

<!-- @input -->
Growing a wrapped queue by copying the array straight across

<!-- @output -->
Drained order `3 4 0 0 7` instead of `3 4 5 6 7`

<!-- @why -->
A silent corruption that a live queue is wrapped 99.2% of the time to walk into.

<!-- @walkthrough -->
1. The queue holds 3, 4, 5, 6 in an array physically ordered `[5, 6, 3, 4]` with `head = 2`.
2. A fifth enqueue finds it full and triggers a doubling.
3. Copying slot-for-slot into the bigger array gives `[5, 6, 3, 4, _, _, _, _]` with `head` still 2.
4. The logical order is now wrong: following `head` reads 3, 4, then two untouched slots, then the new element.
5. Drained, that is `3 4 0 0 7` — and the zeros are uninitialised memory read back as data, so nothing throws.
6. The fix is to copy in *logical* order — `count` elements starting at `head` — and reset `head` to 0.
7. Sampling a live queue over 2,000,000 operations, the contents were wrapped **99.2%** of the time, so this is the normal case rather than a corner one.

<!-- @example -->

<!-- @input -->
`% cap` against `(i + 1 == cap) ? 0 : i + 1` against `& (cap - 1)`

<!-- @output -->
5.47x apart in isolation, indistinguishable inside a queue

<!-- @why -->
A micro-optimisation that is entirely real and almost entirely irrelevant.

<!-- @walkthrough -->
1. Timed as a serially dependent chain of index updates, the modulo costs **3.18ns** per step against the mask's **0.581ns**.
2. That is **5.47x**, flat at capacities of 1,024, 65,536 and 1,048,576, and stable across five repeat runs — a genuine division, not something the compiler removed.
3. It cannot be removed, because the capacity is a runtime value rather than a constant.
4. Inside a real queue running 4,000,000 data-dependent operations, the same three measured **3.05ns**, **3.07ns** and **3.14ns** — modulo, mask, conditional.
5. The modulo is not slower than the mask; over ten paired trials it was faster in eight, at a median ratio of 0.995x.
6. The conditional is the slowest of the three, reproducibly — 3.14ns in all ten trials with a spread of 0.04ns — because a predicted branch replaced a division that was already hidden.
7. A first draft of this measurement took one run and reported 3.19 / 3.16 / 3.07, which put them in the expected order and was noise.
8. The lesson is not that the division is cheap but that a difference which survives isolation can vanish entirely in context — and that a single run cannot tell you which case you are in.

<!-- @visualization queue -->

<!-- @description -->
Draw one capacity-4 array as a horizontal strip of four slots and then bend it into a ring, because the whole subtopic is the claim that those two pictures are the same array. Run the canonical script on the strip first — enqueue 1 to 4, dequeue twice, enqueue 5 and 6 — with `head` and `tail` as two labelled arrows beneath. The beat that matters is the fifth enqueue: `tail` walks off the right edge and reappears at the left, and the strip should visibly bend into the ring at that moment, so the wrap is shown as a change of viewpoint rather than a trick. Above it, run the same script twice more in parallel bands for contrast. The shifting queue: on every dequeue, animate all remaining elements sliding one slot left, and keep a running counter of element moves that climbs while the circular band's counter stays at 0 — end with 499,999,500,000 against 0 at a million. The walking queue: no elements ever move, but grey out each slot as `head` passes it, until the whole strip is grey and a red REFUSED flashes on an enqueue while the live count reads 0 — that band is the 0.0% result and should be the most uncomfortable picture on the panel. Second panel is the ambiguity: two rings side by side, both with `head` and `tail` arrows pointing at the same slot, one ring empty and one ring completely full, captioned identical state, opposite meanings, with the three fixes listed beneath and the count highlighted. Third panel is the growth bug: show the wrapped array `[5 6 3 4]` with `head` at index 2, then two copies into a doubled array — the naive one preserving slots and yielding `3 4 0 0 7` in red, the linearising one walking from `head` in logical order and yielding `3 4 5 6 7` — with 99.2% wrapped printed underneath so the reader knows which path they are actually on. Final panel is the two bar charts that disagree: isolated wraparound at 3.18 / 0.865 / 0.581ns, and the same three inside a working queue at 3.05 / 3.14 / 3.07ns, drawn at the same scale so the first looks dramatic and the second looks flat. Label them 5.47x and indistinguishable, and order the second chart's bars by measured cost so the reader sees the conditional — the supposed optimisation — sitting last.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"theCoreDifference":"a stack touches ONE end of the array so an index is enough; a queue touches BOTH, and removing from the front is precisely the operation an array is worst at","correctness":{"operations":800000,"enqueuePct":55,"implementationsCompared":["shifting","walking","circular with count","circular with a sacrificed slot"],"valuesChecked":360222,"mismatches":0},"shiftOnDequeue":{"formula":"n(n-1)/2 element moves to drain n","measured":[{"n":1000,"moves":499500},{"n":10000,"moves":49995000},{"n":100000,"moves":4999950000},{"n":1000000,"moves":499999500000}],"circularMovesAtEverySize":0,"crossReference":"Implement Stack using Arrays measured the identical 499,999,500,000 for growing an array one element at a time -- same quadratic, different mistake","wallClock":[{"n":50000,"totalNs":4269959,"nsPerOp":85.4},{"n":100000,"totalNs":10521042,"nsPerOp":105.21,"vsPrev":2.46},{"n":200000,"totalNs":42954833,"nsPerOp":214.77,"vsPrev":4.08},{"n":400000,"totalNs":188949416,"nsPerOp":472.37,"vsPrev":4.4}]},"theCapacityLeak":{"design":"two indices that never wrap","capacity":1000,"workload":"alternating one enqueue and one dequeue, so at most one element is ever held","enqueuesServedBeforeRefusing":1000,"largestSizeEverHeld":1,"slotsInUseWhenItRefused":0,"usableFractionAtThatMoment":"0.0%","statement":"a capacity-C queue of this design serves exactly C enqueues in its whole lifetime, however many are removed -- the array is not full, it has been used up"},"theAmbiguity":{"problem":"head == tail is both the empty state and the full state, byte-identical","fixes":[{"name":"keep a count","empty":"count == 0","full":"count == capacity","alsoGives":"size() in O(1) with no modulo"},{"name":"sacrifice a slot","full":"(tail + 1) % size == head","costAtCapacity4096Ints":"4 bytes, 0.024%","cost":"size() needs (tail + capacity - head) % capacity"},{"name":"keep a boolean recording whether the last operation was an enqueue"}],"recommendation":"the count, because it makes size() free as well"},"wraparoundCost":{"isolated":{"note":"serially dependent index chain, nothing to hide the latency; flat across capacities 1024 / 65536 / 1048576 and stable over five repeat runs, so the modulo is a real division and not strength-reduced -- the capacity is a runtime value","modulo":3.18,"conditional":0.865,"mask":0.581,"modOverMask":5.47},"insideAWorkingQueue":{"operations":4000000,"reporting":"median of five runs, because one run cannot separate them","modulo":3.05,"mask":3.07,"conditional":3.14,"modOverMask":0.99},"pairedTrials":{"count":10,"moduloFasterThanMask":8,"medianModOverMask":0.995,"conditionalNsInEveryTrial":3.14,"conditionalSpread":0.04},"conclusion":"the 5.47x does not shrink, it disappears -- the modulo is indistinguishable from the mask in a working queue, and the CONDITIONAL, the standard advice for avoiding a division, is reproducibly the slowest of the three because a predicted branch replaced a division that was already hidden","recommendation":"write the modulo: clearest, works for any capacity, costs nothing; take the mask only when the capacity is already a power of two for other reasons, as ArrayDeque is","correction":"an earlier draft of this container took a single run, reported 3.19 / 3.16 / 3.07, and concluded the mask was worth 4% -- that ordering was noise and ten paired trials reversed it"},"growingAWrappedBuffer":{"setup":"array [5 6 3 4], head=2, count=4, logical contents 3 4 5 6","naiveCopy":"3 4 0 0 7 -- WRONG, and the zeros are untouched slots read back as data, so nothing throws","linearisedCopy":"3 4 5 6 7 -- correct: copy count elements starting at head in logical order, then reset head to 0","howOftenWrapped":"99.2% of sampled live states over 2,000,000 operations","consequence":"the wrapped state is the normal one, not a corner case"},"againstTheLibrary":{"workload":"4,000,000 data-dependent operations at 55% enqueue, each implementation in its own process","cpp":[{"impl":"circular buffer, modulo","nsPerOp":3.05,"ratio":0.99},{"impl":"circular buffer, mask","nsPerOp":3.07,"ratio":1.0},{"impl":"circular buffer, conditional","nsPerOp":3.14,"ratio":1.02},{"impl":"std::deque","nsPerOp":3.88,"ratio":1.26},{"impl":"std::queue (deque-backed)","nsPerOp":3.9,"ratio":1.27}],"handWrittenAdvantage":"26%, close to the 1.30x Implement Stack using Arrays measured for a raw array against std::vector, and from the same source -- no bounds logic, no indirection","memory":{"circular":"4.00 bytes/element","stdDeque":"4.03 bytes/element","atN":16000000,"conclusion":"the deque's cost is per-operation, not per-element"},"benchmarkCaveat":"a fill-then-drain loop measures a bulk copy rather than a queue; every figure here comes from an interleaved script where the value enqueued depends on the value last dequeued"},"python":{"workload400k":[{"impl":"collections.deque","nsPerOp":45},{"impl":"list + head index","nsPerOp":51},{"impl":"hand-rolled circular list","nsPerOp":78},{"impl":"queue.Queue","nsPerOp":489},{"impl":"list with pop(0)","nsPerOp":1367}],"handRolledIsWorse":"1.74x slower than deque -- the modulo, the indexing and the counter are each an interpreted operation; the same result the stack container found, more emphatically","popZeroRatioGrowsWithN":[{"ops":20000,"ratio":2.2},{"ops":100000,"ratio":6.5},{"ops":400000,"ratio":30.0}],"isolatedSingleOperation":[{"n":1000,"listPop":41,"listPop0":125,"dequePopleft":41},{"n":10000,"listPop":42,"listPop0":1500,"dequePopleft":41},{"n":100000,"listPop":42,"listPop0":14333,"dequePopleft":42},{"n":1000000,"listPop":42,"listPop0":171417,"dequePopleft":42}],"queueQueueTrap":"11x slower than deque because it is a THREAD-SAFE queue taking a lock per operation; it is the obvious-looking import and the wrong one for a single-threaded FIFO, and it is built on collections.deque anyway"},"recommendation":"a circular buffer with an explicit count; in Python use collections.deque and do not write the circular buffer at all","lesson":"the structural choices -- wrap or do not wrap, count or do not count, linearise or do not -- are worth orders of magnitude, and the micro-optimisation everyone reaches for is worth nothing at all"}
```

<!-- @highlights -->
- One capacity-4 array is drawn as a horizontal strip and then bent into a ring — the subtopic's central claim is that these are the same array.
- The canonical script runs on the strip: enqueue 1 to 4, dequeue twice, enqueue 5 and 6.
- `head` and `tail` are two labelled arrows beneath the strip.
- The fifth enqueue is the beat that matters: `tail` walks off the right edge and reappears at the left.
- The strip visibly bends into the ring at that moment, so the wrap reads as a change of viewpoint rather than a trick.
- Above it, two contrast bands run the same script.
- The shifting queue slides every remaining element left on each dequeue, with a climbing counter of element moves.
- The circular band's move counter stays at 0 — ending 499,999,500,000 against 0 at a million.
- The walking queue moves nothing, but greys out each slot as `head` passes it.
- Its strip ends entirely grey, with a red REFUSED flashing on an enqueue while the live count reads 0.
- That band is the 0.0% result and should be the most uncomfortable picture on the panel.
- Second panel: two rings with `head` and `tail` pointing at the same slot, one empty and one full.
- Captioned identical state, opposite meanings, with the three fixes beneath and the count highlighted.
- Third panel: the wrapped array `[5 6 3 4]` with `head` at index 2, copied two ways into a doubled array.
- The naive copy preserves slots and yields `3 4 0 0 7` in red; the linearising copy yields `3 4 5 6 7`.
- 99.2% wrapped is printed underneath, so the reader knows which path they are actually on.
- Final panel: two bar charts at the same scale that disagree.
- Isolated wraparound at 3.18 / 0.865 / 0.581ns, labelled 5.47x, looks dramatic.
- The same three inside a working queue at 3.05 / 3.14 / 3.07ns, labelled indistinguishable, looks flat — with the conditional sitting last.

<!-- @edgeCases -->
- Dequeue from an empty queue — must be refused or reported; with a `count` the test is `count == 0`, and without one it is indistinguishable from full.
- Enqueue into a full queue — refuse, or grow; both are defensible, and they are different data structures.
- A capacity-1 queue — `head` and `tail` are always equal, so the count is doing all the work.
- A capacity-0 queue — every modulo by the capacity is a division by zero; reject it at construction.
- The queue becoming empty with `head` in the middle of the array — perfectly normal, and the state the walking design cannot exploit.
- The contents straddling the end of the array — the ordinary case, measured at 99.2% of live states.
- Growing while wrapped — must copy in logical order from `head`, not slot for slot.
- Draining fully and refilling — `head` stays where it was; nothing needs resetting.
- `head + count` on a nearly-full queue — bounded by twice the capacity, so it cannot overflow any index type that can address the array.
- Alternating a single enqueue and dequeue forever — free on a circular buffer, and fatal to the walking one after `capacity` iterations.
- A queue used from two threads — none of these are safe; that is what `queue.Queue` is for, at 11x the cost.

<!-- @pitfalls -->
- Shifting on dequeue to keep the front at index 0. It costs `n(n-1)/2` moves — 499,999,500,000 to drain a million.
- Using `vector::erase(begin())` or `ArrayList.remove(0)` or `list.pop(0)` and reading it as O(1). All three are the shift, behind a call that does not look like one.
- Advancing `head` without wrapping. The array is consumed permanently, and the queue refuses new elements while holding none.
- Testing `tail == capacity` for fullness. That says the array has been written to the end, which is a different condition.
- Using `head == tail` alone to mean empty. It equally means full, and the two states are byte-identical.
- Computing `size()` as `tail - head` once the indices wrap. It needs `(tail + capacity - head) % capacity`, or a `count` that makes the question disappear.
- Growing a wrapped buffer with a slot-for-slot copy. The order is silently destroyed, and the gaps read back as zeros rather than throwing.
- Assuming the wrapped state is rare. It was 99.2% of sampled live states.
- Replacing `%` with a mask on an array whose capacity is not a power of two. The mask is only equivalent when it is.
- Replacing the modulo with a conditional. It is 5.47x cheaper in isolation and measurably **slower** in a working queue — 3.14ns against 3.05ns, in all ten trials.
- Benchmarking with a fill-then-drain loop. It measures a bulk copy; interleave the operations and make the enqueued value depend on the dequeued one.
- Writing the circular buffer in Python for speed. It measured 1.74x slower than `collections.deque`.
- Importing `queue.Queue` for a single-threaded FIFO. It takes a lock per operation and measured 11x slower than the `deque` it is built on.

<!-- @doubt -->
### Why can't I just shift the elements down like the stack does?

<!-- @answer -->
The stack never has to. That is the whole difference, and it is worth stating precisely: **a stack only ever touches one end of the array**, so nothing ever moves — push writes past the last element, pop reads it back. A queue removes from the front, which is the one position an array is genuinely bad at, because everything after it has to close the gap. You can do it, and the cost is exact: draining `n` elements performs `n(n-1)/2` element moves, which is **499,999,500,000** at a million. Measured, the wall-clock quadruples every time `n` doubles — 4.08x from 100,000 to 200,000 and 4.40x from 200,000 to 400,000. The circular buffer performs **zero** moves at every one of those sizes. It is also worth noticing that 499,999,500,000 is the identical figure **Implement Stack using Arrays** measured for growing an array one element at a time; the same quadratic turns up from a completely different mistake, because `n(n-1)/2` is what "do O(n) work n times" always costs.

<!-- @doubt -->
### Why not just move `head` forward and never wrap around?

<!-- @answer -->
Because the array gets consumed. Both operations really are O(1) — nothing is copied — but every slot `head` passes is dead, and nothing ever reclaims it. The measurement is the clearest thing in this container: a capacity-1,000 queue, alternating one enqueue and one dequeue so it never holds more than a single element, **refused its 1,001st enqueue while holding zero elements**, with 0.0% of the array in use. The capacity stopped being a limit on how many elements you can hold simultaneously and became a budget on how many you may ever enqueue. In Python the same design usually appears as a list plus a head index, where it does not refuse — it leaks instead, since the prefix before the index is never freed, and it measured 49ns per operation against `deque`'s 43ns for the trouble. The fix is one operator: wrap the index with `% capacity` instead of letting it run.

<!-- @doubt -->
### How do I tell an empty queue from a full one?

<!-- @answer -->
You cannot, with only `head` and `tail` — and this is the circular buffer's one real subtlety rather than a detail. A fresh capacity-4 queue has `head = 0, tail = 0`. Enqueue four elements and the fourth wraps `tail` back to 0, so you have `head = 0, tail = 0` again. The two states are byte-identical and mean opposite things. Three fixes are standard. **Keep a count** — `empty()` is `count == 0`, `full()` is `count == capacity`, and `size()` becomes free; this is the one to reach for. **Sacrifice a slot** — allocate `capacity + 1` and declare full at `(tail + 1) % size == head`, so the full state is never reached; it costs 4 bytes at capacity 4,096, or **0.024%**, but leaves `size()` needing `(tail + capacity - head) % capacity`. **Keep a boolean** recording whether the last operation was an enqueue, which works and is the fiddliest to reason about. What is not an option is picking none of them.

<!-- @doubt -->
### Should I use `%`, a conditional, or a power-of-two mask?

<!-- @answer -->
Write the modulo. The answer is counterintuitive, so here is the whole measurement. **In isolation**, on a serially dependent chain of index updates where nothing can hide the latency, `% cap` costs **3.18ns** per step, `(i + 1 == cap) ? 0 : i + 1` costs **0.865ns**, and `(i + 1) & (cap - 1)` costs **0.581ns** — the modulo is **5.47x** the mask, flat at capacities of 1,024, 65,536 and 1,048,576 and stable across five repeat runs. It is a genuine hardware division, and the compiler cannot remove it because the capacity is a runtime value rather than a constant. **Inside an actual queue**, over 4,000,000 data-dependent operations and taking the median of five runs, the same three measured **3.05ns** (modulo), **3.07ns** (mask) and **3.14ns** (conditional). The modulo is not slower than the mask — over ten paired trials it was faster in eight, at a median ratio of 0.995x — because the division is entirely overlapped with the queue's unpredictable branches and its memory traffic. And the conditional, which is the advice everyone gives, is reproducibly the **slowest** of the three: you have swapped a hidden division for a branch the processor now has to predict. So use `%`: it is the clearest, it works for any capacity, and it costs nothing. Take the mask only when the capacity is already a power of two for other reasons — Java's `ArrayDeque` is built that way — and never restructure a design for it.

<!-- @doubt -->
### What should happen when the queue is full — refuse, or grow?

<!-- @answer -->
Both are correct, and they are genuinely different data structures, which is the same split **Implement Stack using Arrays** drew. **Refusing** gives a hard capacity, which is what a bounded buffer, an embedded system, or any back-pressure design actually wants — `enqueue` returns false and the caller decides. **Growing** makes it unbounded, and then the only question is by how much: doubling copies about 1.05 elements per push amortised, growing by one copies 499,999,500,000 elements over a million pushes. Take doubling. The queue-specific trap is what growth has to *do*: you cannot copy the array slot for slot, because the live elements are usually wrapped. You must walk `count` elements from `head` in logical order into the new array and reset `head` to 0. Get that wrong and the contents are silently reordered — see the next question, because it is the most common way this structure breaks.

<!-- @doubt -->
### My queue returned things in the wrong order after it grew. What happened?

<!-- @answer -->
The contents were wrapped and you copied the array rather than the queue. Concretely: the queue holds 3, 4, 5, 6 in an array physically ordered `[5, 6, 3, 4]` with `head = 2`. Doubling it with a slot-for-slot copy gives `[5, 6, 3, 4, _, _, _, _]` with `head` still at 2, so following `head` reads 3, 4, then two untouched slots, then whatever you enqueued next — drained, `3 4 0 0 7` where the answer was `3 4 5 6 7`. The zeros are uninitialised slots read back as data, so nothing throws and no test fails unless it checks the values. The fix is to copy in **logical** order: `count` elements starting at `head`, wrapping, into positions 0 upward, then set `head = 0`. And this is not a rare case to guard against defensively — sampling a live queue over 2,000,000 operations, the contents were wrapped **99.2%** of the time. The unwrapped state is the exception.

<!-- @doubt -->
### Is the hand-written circular buffer actually worth it over `std::deque`?

<!-- @answer -->
In C++, by about **26%** — and that is the honest size of the prize. Over 4,000,000 data-dependent operations, the circular buffer measured 3.07ns per operation with a mask and 3.05ns with a modulo, against **3.88ns** for `std::deque` and **3.90ns** for `std::queue`. That 1.28x is almost exactly the 1.30x the stack container measured for a raw array against `std::vector`, and it comes from the same two places: no bounds logic and no indirection. Memory is a wash — 4.00 bytes per element against 4.03 at sixteen million ints — so the deque's cost is per-operation rather than per-element. Whether 28% is worth owning the capacity, the wraparound, the ambiguity and the growth logic is a judgement about your program, not about the data structure. One caution on the number itself: benchmark with an interleaved script where the enqueued value depends on the dequeued one. A fill-then-drain loop lets the compiler recognise a bulk copy, and it will rank these implementations by how well they resist that recognition rather than by how fast they are.

<!-- @doubt -->
### What should I use in Python?

<!-- @answer -->
`collections.deque`, and unlike C++ this is not a compromise — it is the fastest option measured. Over 400,000 data-dependent operations: `deque` **45ns** per operation, a list plus a head index 51ns, the hand-rolled circular list **78ns**, and `list` with `pop(0)` **1,287ns**. The hand-rolled circular buffer being **1.8x slower** than the library is the point: the modulo, the indexing and the counter are each a separate interpreted operation, so writing the structure by hand adds work rather than removing it. This is the same result the stack container reached, more emphatically. Two specific traps. `list.pop(0)` is O(n), and its penalty grows with the queue — 2.2x at 20,000 operations, 6.5x at 100,000, **30.0x** at 400,000 — measuring **171,417ns** as a single call on a million-element list against a flat 42ns for `deque.popleft()`. And `queue.Queue` is **11x** slower than `deque`, because it is a *thread-safe* queue taking a lock on every operation; it is the obvious-looking import, it is the wrong one for a single-threaded FIFO, and it is implemented on top of `collections.deque` anyway.

<!-- @doubt -->
### Is the circular queue really O(1), or just amortised O(1)?

<!-- @answer -->
Genuinely O(1) **worst case**, for every operation, as long as the capacity is fixed. There is no shifting, no reallocation, and nothing deferred — `enqueue` is one bounds check, one modulo, one store and one increment, and `dequeue` is the same in reverse. Every single operation costs the same, which is a stronger guarantee than the array-backed *stack* can give: that one is amortised O(1) because a push occasionally has to reallocate and copy, and **Implement Stack using Linkedlist** measured its slowest single push at 690,292ns. A fixed-capacity circular queue has no such spike. The moment you let it grow, you give that up and inherit exactly the stack's profile — amortised O(1), with an occasional O(n) operation when it doubles, made worse here because growth also has to linearise the wrapped contents. So if you need a worst-case bound, fix the capacity and refuse when full; the refusal is the price of the guarantee.
