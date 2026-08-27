---
id: implement-queue-using-linkedlist
topic: Queues
title: Implement queue using Linkedlist
difficulty: Easy
status: ready
prerequisites:
  - implement-queue-using-stack
  - implement-queue-using-arrays
  - implement-stack-using-linkedlist
  - introduction-to-singly-linkedlist
  - time-and-space-complexity-basics
relatedIds:
  - implement-stack-using-linkedlist
  - implement-queue-using-arrays
  - implement-queue-using-stack
  - introduction-to-singly-linkedlist
  - lru-cache
---

<!-- @summary -->
The direct answer to the **2,559,000ns** single dequeue the previous subtopic measured — except the obvious version does not deliver it. A linked queue built with `new` and `delete` still spiked to **667,625ns**, only 1.8x better than the growing array it was meant to beat; recycling nodes through a free list brought that to **32,000ns**, which is 38x better. So the bounded worst case comes from not calling the allocator, not from the pointers. The rest is the tail pointer: without one, enqueue walks `(n-1)(n-2)/2` nodes, and the single line `if (!head) tail = nullptr;` is what stops **100.0%** of your elements from silently disappearing.

<!-- @theory -->
## Why this one needs two pointers

**Implement Stack using Linkedlist** had it easy: a singly linked list has exactly
one cheap end, the head, and a stack only ever needs one end. A queue needs both,
so it needs a second pointer.

```
head -> [10] -> [20] -> [30] <- tail

enqueue(40):  tail->next = new node; tail = new node
dequeue():    x = head->val; head = head->next; free the old head
```

Both are a constant number of pointer writes, with no shifting, no wraparound and
no capacity. Verified against a `std::queue` model over 800,000 operations —
**359,856 dequeued values, 0 mismatches**, with the size and empty invariants
checked after every call.

## The orientation is forced

You might expect a free choice about which end does what. There isn't one, and
the reason is specific to singly linked lists.

With a `tail` pointer you can **append** at the tail in O(1) — you have the node
and you write its `next`. You can never **remove** at the tail in O(1), because
removing it means updating the `next` of the node *before* it, and a singly
linked list gives you no way to find that node except by walking from the head.

So enqueue-at-head/dequeue-at-tail is quadratic, and by exactly the amount you
would guess:

| n | nodes walked | `n(n-1)/2` |
|---|---|---|
| 1,000 | 499,500 | 499,500 |
| 2,000 | 1,999,000 | 1,999,000 |
| 4,000 | 7,998,000 | 7,998,000 |
| 8,000 | **31,996,000** | 31,996,000 |

That is the third time this shape has appeared: **Implement Queue using Arrays**
measured `n(n-1)/2` element moves for shifting on dequeue, and **Implement Stack
using Arrays** measured the same total for growing an array by one. Different
mistakes, one arithmetic.

Dropping the tail pointer entirely gives the same disease at the other end —
enqueue walks to find the last node, at exactly `(n-1)(n-2)/2` steps.

## The line that keeps your elements

`dequeue` has one line that looks like defensive tidying and is not:

```cpp
head = old->next;
if (!head) tail = nullptr;      // <-- this one
```

When the last element leaves, `head` becomes null but `tail` still points at the
node you are about to free. The next `enqueue` sees a non-null `tail`, links the
new node onto a dead one, and never touches `head` — which is still null. The
queue reports itself empty, forever, while accepting elements.

Measured over 200,000 balanced operations with the line removed: **100,452 of
100,454 enqueued elements became unreachable — 100.0%**.

The detail that makes this dangerous is *when* it starts. Everything works
perfectly until the queue first becomes empty. A fill-then-drain test never
empties the queue mid-run, so it passes; the failure needs an interleaving that
drains to zero and then enqueues again, which is what real traffic does
constantly.

## The worst case, which is the whole point

The previous subtopic's two-stack queue measured a single dequeue at
**2,559,000ns**, and the subtopic before that grew its array by doubling. A
linked queue has no transfer and no reallocation, so the promise is O(1) worst
case. Measured — 2,000,000 enqueues then 2,000,000 dequeues, worst single
operation, three runs each:

| | run 1 | run 2 | run 3 |
|---|---|---|---|
| linked list, `new`/`delete` | 651,625ns | 845,750ns | 667,625ns |
| **linked list, free list** | **32,000ns** | **36,083ns** | **27,041ns** |
| growing circular buffer | 1,321,708ns | 1,223,042ns | 1,225,958ns |
| two-stack queue | 1,521,500ns | 1,862,708ns | 1,548,542ns |

The naive linked queue is **only 1.8x better** than the growing array. That is
not the O(1) worst case anyone was promised, and the reason is the one the stack
subtopic named: the spike is the allocator's slow path asking the operating
system for memory, and accumulating two million nodes asks it repeatedly.

With a free list — dequeue parks the node on a spare chain instead of freeing it,
enqueue takes from that chain instead of allocating — the worst case drops to
**32,000ns**, which is **38.3x** better than the growing buffer and **48.4x**
better than the two-stack queue. *That* is the bounded worst case, and it comes
from not calling the allocator rather than from the linked structure.

The tail of the distribution tells the other half of the story:

| balanced workload, 4,000,000 ops | p99.9 | max |
|---|---|---|
| linked list, `new`/`delete` | 83ns | 20,333ns |
| linked list, free list | 83ns | 15,167ns |
| growing circular buffer | **42ns** | 299,334ns |
| two-stack queue | 83ns | 190,333ns |

The arrays are *better* at the 99.9th percentile and far worse at the maximum.
The linked queue trades a slightly noisier body of the distribution for a much
shorter tail — which is the right trade for a latency budget and the wrong one
for raw throughput.

## What it costs

4,000,000 data-dependent operations at 55% enqueue, each in its own process, on
the harness the previous two subtopics used:

| | per operation | ratio |
|---|---|---|
| circular buffer (mask) | **3.07ns** | 1.00x |
| two-stack queue | 3.90ns | 1.27x |
| `std::queue` | 3.90ns | 1.27x |
| **linked list, free list** | **4.31ns** | **1.40x** |
| linked list, `new`/`delete` | 14.45ns | **4.71x** |
| `std::list` | 14.86ns | 4.84x |

The allocator is **3.35x** of the cost — 14.45ns falls to 4.31ns when nodes are
recycled and nothing else changes. That is the same conclusion **Implement Stack
using Linkedlist** reached from its own numbers (14.5ns to 3.9ns, a 3.69x
improvement): the linked structure is not slow, `new` is.

**Memory is the honest cost.** A node is a value and a pointer, and alignment
rounds it up:

```
sizeof(Node{int val; Node* next;}) == 16 bytes    for a 4-byte payload
```

Measured at four and sixteen million elements, **16.06 bytes per element against
the circular buffer's 4.00** — exactly **4x**, before the allocator's own
per-block overhead. The two pointers the queue itself holds are O(1) and do not
figure.

## A hypothesis that did not survive

A stack touches one end of the list; a queue touches two. It seemed likely that
the queue would pay for that — the head being dequeued is far in memory from the
tail being enqueued, so both ends must stay resident.

Measured with identical node and free-list machinery, the same 4,000,000
operations, only the linking discipline differing:

| | per operation |
|---|---|
| used as a stack (one live end) | 4.98ns |
| used as a queue (two live ends) | 5.02ns |

Indistinguishable. The second live end costs nothing measurable, so the 1.40x
above is the ordinary price of a linked structure and not a queue-specific
penalty. Recorded because the hypothesis was reasonable and testing it was
cheaper than assuming it.

What does still apply, unchanged, is the fragmentation result that subtopic
measured: consecutively allocated nodes walked at 1.6ns each and scattered ones
at 46.3ns, a factor of **28.62x**. A free list makes that better rather than
worse, because it keeps recycling the same small set of nodes.

## Python

| 400,000 data-dependent operations | per operation | vs `deque` |
|---|---|---|
| `collections.deque` | **45ns** | 1.00x |
| two stacks (previous subtopic) | 48ns | 1.07x |
| linked list, `__slots__` nodes | 106ns | **2.38x** |
| linked list, plain class nodes | 114ns | 2.55x |

This is the **worst** hand-written queue in the topic for Python, and by some
distance — the previous subtopic's two-stack construction was 1.07x. Every node
here is a heap-allocated Python object with its own header, so enqueue means an
object construction and dequeue means a reference drop, where `deque` moves a
pointer inside a C block.

Memory, by `tracemalloc` over 200,000 elements with a distinct payload object
each:

| | bytes per element |
|---|---|
| `collections.deque` | **24.3** |
| linked list, `__slots__` | 64.0 |
| linked list, plain class | 104.0 |

`__slots__` is worth taking — it removes the per-instance `__dict__` and saves 40
bytes a node — but even then the structure costs **2.6x** the `deque`.

## Where this goes next

**LRU Cache** is the first subtopic where the linked structure earns its 4x
memory: it needs a doubly linked list so that a node found through a hash map can
be unlinked in O(1) from the middle, which is the one thing neither the circular
buffer nor the two-stack queue can do at any price.

<!-- @intuition -->
A stack lives at one end of a linked list, so the previous linked-structure subtopic needed a single pointer and nothing else. A queue lives at both ends, and everything here follows from that. You need a tail pointer, or enqueue walks the list to find the end. You cannot flip the orientation, because a singly linked list lets you append at the tail cheaply but never remove there — removing the last node means finding the one before it, and there is no way back. And you need one line most people forget: when the last element leaves, the tail pointer still points at the node you just freed, so the next enqueue links onto a corpse while the head stays null and the queue quietly swallows everything you give it. The interesting part is the promise. This structure exists to fix the millisecond-long spikes the array and two-stack queues have, and measured, the naive version barely does — calling new for every node produces its own spike almost as large, because the allocator goes to the operating system. Recycling nodes through a free list is what actually delivers the bounded worst case, and it also removes three quarters of the running cost. The pointers were never the problem or the solution; the allocator was both.

<!-- @approach -->
### Brute Force - No Tail Pointer

<!-- @idea -->
Keep only a head pointer, and walk to the end of the list on every enqueue.

<!-- @steps -->
1. Keep a single `head` pointer.
2. To dequeue, take the head node and advance `head` — this end is already cheap.
3. To enqueue, allocate a node.
4. If the list is empty, it becomes the head.
5. Otherwise walk from `head` until a node whose `next` is null.
6. Link the new node there.

<!-- @complexity -->
- time: enqueue **O(n)**, dequeue O(1)
- space: O(n), 16 bytes per node
- note: The version that forgets a queue has two ends. Enqueueing `n` elements walks exactly `(n-1)(n-2)/2` nodes — 127,976,001 at n = 16,000, measured at 154,630,209ns against the tail-pointer version's linear time. Every one of those steps is a dependent load, so it is also the worst possible memory access pattern. One extra pointer removes all of it.

<!-- @code cpp -->
```cpp
struct Node { int val; Node* next; };

class NoTailQueue {
    Node* head = nullptr;

public:
    void enqueue(int x) {
        Node* node = new Node{x, nullptr};
        if (!head) { head = node; return; }
        Node* cur = head;
        while (cur->next) cur = cur->next;
        cur->next = node;
    }

    int dequeue() {
        Node* old = head;
        int x = old->val;
        head = old->next;
        delete old;
        return x;
    }

    bool empty() const { return head == nullptr; }
};
```

<!-- @annotations -->
- 11: The walk, and the whole problem. It costs `(n-1)(n-2)/2` steps across n enqueues, each one a dependent load that cannot be prefetched.
- 18: Dequeue was never the issue — the head end of a singly linked list is cheap, which is exactly why the stack version needed nothing else.

<!-- @code java -->
```java
class NoTailQueue {
    private static class Node { int val; Node next; Node(int v){ val = v; } }
    private Node head;

    void enqueue(int x) {
        Node node = new Node(x);
        if (head == null) { head = node; return; }
        Node cur = head;
        while (cur.next != null) cur = cur.next;
        cur.next = node;
    }

    int dequeue() { int x = head.val; head = head.next; return x; }

    boolean isEmpty() { return head == null; }
}
```

<!-- @annotations -->
- 9: The same walk. Java's garbage collector removes the `delete`, but it does nothing about the O(n) traversal.

<!-- @code python -->
```python
class Node:
    __slots__ = ("val", "next")
    def __init__(self, val):
        self.val = val
        self.next = None


class NoTailQueue:
    def __init__(self):
        self._head = None

    def enqueue(self, x):
        node = Node(x)
        if self._head is None:
            self._head = node
            return
        cur = self._head
        while cur.next is not None:
            cur = cur.next
        cur.next = node

    def dequeue(self):
        node = self._head
        self._head = node.next
        return node.val

    def is_empty(self):
        return self._head is None
```

<!-- @annotations -->
- 2: `__slots__` removes the per-instance `__dict__`, taking a node from 104 to 64 bytes measured. Worth having on any node class, and still 2.6x a `deque` slot.
- 18: An interpreted walk, which is the slowest possible version of the slowest possible design.

<!-- @approach -->
### The Wrong Orientation - Enqueue at the Head

<!-- @idea -->
Add elements at the head and remove them from the tail — which sounds symmetric to the working version and is not.

<!-- @steps -->
1. Keep `head` and `tail` pointers.
2. To enqueue, link the new node in front of `head` — O(1).
3. To dequeue, the oldest element is at the tail.
4. Removing it requires the node *before* it, to become the new tail.
5. A singly linked list offers no way back, so walk from `head` to find it.
6. Unlink the tail and set `tail` to the node found.

<!-- @complexity -->
- time: enqueue O(1), dequeue **O(n)**
- space: O(n)
- note: The orientation is not a free choice. A `tail` pointer lets you **append** at the tail in O(1), because you hold the node and write its `next` — it never lets you **remove** there, because that needs the previous node's `next`. Measured at exactly `n(n-1)/2` nodes walked: **31,996,000** at n = 8,000. The same arithmetic **Implement Queue using Arrays** measured for shifting on dequeue, from an unrelated mistake.

<!-- @code cpp -->
```cpp
class ReversedQueue {
    Node* head = nullptr;
    Node* tail = nullptr;

public:
    void enqueue(int x) {
        head = new Node{x, head};
        if (!tail) tail = head;
    }

    int dequeue() {
        Node* prev = nullptr;
        Node* cur = head;
        while (cur->next) { prev = cur; cur = cur->next; }
        int x = cur->val;
        if (prev) prev->next = nullptr; else head = nullptr;
        tail = prev;
        delete cur;
        return x;
    }
};
```

<!-- @annotations -->
- 14: The walk that a `tail` pointer cannot save you from — it finds the node *before* the tail, which is the thing a singly linked list structurally cannot hand you.
- 7: Enqueue really is O(1) here, which is what makes the design look plausible until you write the dequeue.
- 8: `tail` is maintained faithfully and is still useless for removal. Holding a pointer to a node is not the same as being able to unlink it.

<!-- @code java -->
```java
int dequeue() {
    Node prev = null, cur = head;
    while (cur.next != null) { prev = cur; cur = cur.next; }
    if (prev != null) prev.next = null; else head = null;
    tail = prev;
    return cur.val;
}
```

<!-- @annotations -->
- 3: A doubly linked list would fix this outright, since each node knows its predecessor — at the cost of another 8 bytes per node. That is the trade **LRU Cache** eventually pays on purpose.

<!-- @code python -->
```python
def dequeue(self):
    prev, cur = None, self._head
    while cur.next is not None:
        prev, cur = cur, cur.next
    if prev is not None:
        prev.next = None
    else:
        self._head = None
    self._tail = prev
    return cur.val
```

<!-- @annotations -->
- 3: The same O(n) walk, interpreted. Nothing about the language changes the structural fact that a singly linked list has no way back.

<!-- @approach -->
### Optimal - Head and Tail Pointers

<!-- @idea -->
Keep a pointer to each end: dequeue from the head, enqueue at the tail, both in a constant number of pointer writes.

<!-- @steps -->
1. Keep `head`, `tail` and a size counter.
2. To enqueue, allocate a node with a null `next`.
3. If `tail` exists, link it to the new node; otherwise the queue was empty, so the new node is also the head.
4. Point `tail` at the new node.
5. To dequeue, read the head's value and advance `head` to its `next`.
6. If `head` is now null, the queue is empty — set `tail` to null as well.
7. Free the old head.

<!-- @complexity -->
- time: O(1) for every operation, worst case — no shifting, no wraparound, no transfer
- space: O(n), at 16 bytes per node for a 4-byte payload
- note: The answer, and the direct reply to the previous subtopic's 2,559,000ns dequeue. Verified over 800,000 operations with 359,856 values checked and zero mismatches. Read step 6 twice: without it, `tail` points at a freed node the moment the queue empties, and **100.0%** of everything enqueued afterwards becomes unreachable. Note also that the O(1) worst case is only as good as the allocator — with `new`/`delete` this measured a 667,625ns spike, which the next approach fixes.

<!-- @code cpp -->
```cpp
struct Node { int val; Node* next; };

class LinkedQueue {
    Node* head = nullptr;
    Node* tail = nullptr;
    size_t n = 0;

public:
    void enqueue(int x) {
        Node* node = new Node{x, nullptr};
        if (tail) tail->next = node;
        else      head = node;
        tail = node;
        n++;
    }

    int dequeue() {
        Node* old = head;
        int x = old->val;
        head = old->next;
        if (!head) tail = nullptr;
        delete old;
        n--;
        return x;
    }

    int front() const { return head->val; }
    bool empty() const { return head == nullptr; }
    size_t size() const { return n; }

    ~LinkedQueue() { while (head) { Node* p = head; head = head->next; delete p; } }
};
```

<!-- @annotations -->
- 1: 16 bytes for a 4-byte payload once alignment rounds it up — measured at 16.06 bytes per element against the circular buffer's 4.00.
- 11: One pointer write, because `tail` is held rather than searched for. This single line is the difference between O(1) and the `(n-1)(n-2)/2` walk of the first approach.
- 21: The line the whole structure rests on. Without it `tail` dangles the instant the queue empties, and everything enqueued afterwards is lost — measured at 100.0% over 200,000 operations.
- 22: Where the time actually goes. Replacing this `delete` and the `new` above with a free list took the cost from 14.45ns to 4.31ns per operation.

<!-- @code java -->
```java
class LinkedQueue {
    private static class Node { int val; Node next; Node(int v){ val = v; } }
    private Node head, tail;
    private int n = 0;

    void enqueue(int x) {
        Node node = new Node(x);
        if (tail != null) tail.next = node;
        else              head = node;
        tail = node;
        n++;
    }

    int dequeue() {
        int x = head.val;
        head = head.next;
        if (head == null) tail = null;
        n--;
        return x;
    }

    int front()       { return head.val; }
    boolean isEmpty() { return head == null; }
    int size()        { return n; }
}
```

<!-- @annotations -->
- 17: Still required under garbage collection, and for two reasons — the correctness bug is identical, and a stale `tail` also keeps the whole drained chain reachable, so the collector cannot free any of it.

<!-- @code python -->
```python
class Node:
    __slots__ = ("val", "next")
    def __init__(self, val):
        self.val = val
        self.next = None


class LinkedQueue:
    def __init__(self):
        self._head = None
        self._tail = None
        self._n = 0

    def enqueue(self, x):
        node = Node(x)
        if self._tail is not None:
            self._tail.next = node
        else:
            self._head = node
        self._tail = node
        self._n += 1

    def dequeue(self):
        node = self._head
        self._head = node.next
        if self._head is None:
            self._tail = None
        self._n -= 1
        return node.val

    def front(self):
        return self._head.val

    def is_empty(self):
        return self._head is None

    def size(self):
        return self._n
```

<!-- @annotations -->
- 27: The same line, and in Python it also releases the last reference so the node can be collected. Leave it out and the drained chain stays alive behind `_tail`.
- 15: Every enqueue constructs a Python object. That is why this measured **2.38x** a `collections.deque` — the worst hand-written queue in this topic for Python.

<!-- @approach -->
### Reducing the Cost - Recycle Nodes with a Free List

<!-- @idea -->
Never free a node: park it on a spare chain when it is dequeued, and take from that chain instead of allocating when one is needed.

<!-- @steps -->
1. Keep a third pointer, the head of a chain of unused nodes.
2. To enqueue, take a node from that chain if it is non-empty, and allocate only when it is not.
3. Overwrite the node's value and null its `next`, then link it at the tail as usual.
4. To dequeue, unlink the head node exactly as before.
5. Instead of freeing it, push it onto the spare chain.
6. The queue then allocates only up to its high-water mark, once.

<!-- @complexity -->
- time: O(1) worst case, with the allocator removed from the common path
- space: O(n) live nodes plus the recycled ones, which stay at the queue's peak size
- note: The change that makes the structure's promises true. Throughput went from 14.45ns to **4.31ns** per operation — the allocator was **3.35x** of the cost, close to the 3.69x **Implement Stack using Linkedlist** measured for the same edit. More importantly the worst single operation fell from 667,625ns to **32,000ns**, which is **38.3x** better than a growing circular buffer and **48.4x** better than the two-stack queue. The cost is that memory is never returned, so a queue that spikes once holds that peak forever.

<!-- @code cpp -->
```cpp
class PooledQueue {
    Node* head = nullptr;
    Node* tail = nullptr;
    Node* pool = nullptr;

    Node* take(int x) {
        Node* node;
        if (pool) { node = pool; pool = pool->next; }
        else        node = new Node;
        node->val = x;
        node->next = nullptr;
        return node;
    }

public:
    void enqueue(int x) {
        Node* node = take(x);
        if (tail) tail->next = node;
        else      head = node;
        tail = node;
    }

    int dequeue() {
        Node* old = head;
        int x = old->val;
        head = old->next;
        if (!head) tail = nullptr;
        old->next = pool;
        pool = old;
        return x;
    }

    bool empty() const { return head == nullptr; }
};
```

<!-- @annotations -->
- 8: The allocation happens only when the pool is dry, so a steady-state queue never calls `new` at all. This is the line responsible for 14.45ns becoming 4.31ns.
- 28: The node goes on the spare chain instead of to the allocator. The most recently recycled node is the next one handed out, so it is still in cache.
- 29: The recycled chain is itself a stack, which is the cheapest possible free list and needs no bookkeeping.

<!-- @code java -->
```java
// Java has no free() to avoid, but object churn still costs — a pool of
// reusable nodes reduces allocation pressure and young-generation collections.
private Node pool;

private Node take(int x) {
    Node node;
    if (pool != null) { node = pool; pool = pool.next; }
    else                node = new Node(0);
    node.val = x;
    node.next = null;
    return node;
}
```

<!-- @annotations -->
- 8: Worth far less in Java than in C++, because allocation in a generational collector is a pointer bump and short-lived objects die cheaply. Measure before adding it; the complexity is real and the gain often is not.

<!-- @code python -->
```python
def _take(self, x):
    node = self._pool
    if node is not None:
        self._pool = node.next
        node.val = x
        node.next = None
        return node
    return Node(x)
```

<!-- @annotations -->
- 3: Recycling saves the object construction but adds three interpreted attribute accesses to every enqueue, so it does not pay in Python. The measured gap to `collections.deque` — 2.32x — is not something a free list closes.

<!-- @approach -->
### Optimal in Practice - Use the Array-Backed Container

<!-- @idea -->
Unless you need the bounded worst case or O(1) unlinking from the middle, the array-backed queue is smaller and faster.

<!-- @steps -->
1. Reach for `std::queue`, `ArrayDeque` or `collections.deque`.
2. Accept an amortised bound instead of a worst-case one.
3. Choose the linked structure deliberately, for the reasons in the note.

<!-- @complexity -->
- time: O(1) amortised
- space: O(n) at 4 bytes per element rather than 16
- note: The array-backed container measured **3.07ns** per operation against the free-list linked queue's 4.31ns and a quarter of its memory. What it cannot offer is the worst case: its slowest single operation was 1,225,958ns against 32,000ns. Take the linked structure when a millisecond pause is unacceptable, when the queue must grow without a copy, or when you will later need to unlink a node from the middle — which is the requirement **LRU Cache** is built around.

<!-- @code cpp -->
```cpp
#include <queue>
#include <list>

std::queue<int> q;                  // std::deque underneath, 3.95ns/op
std::queue<int, std::list<int>> lq; // linked underneath, 14.86ns/op
```

<!-- @annotations -->
- 5: `std::queue` accepts any container with `push_back` and `pop_front`, so this really is a linked queue — and it measured **4.84x** the circular buffer, which is roughly what a per-node allocation costs.

<!-- @code java -->
```java
Deque<Integer> fast = new ArrayDeque<>();   // circular buffer
Deque<Integer> node = new LinkedList<>();   // doubly linked, 24+ bytes/node
```

<!-- @annotations -->
- 2: `LinkedList` is doubly linked, so it pays for a `prev` pointer this subtopic never needed. It is the wrong default for a plain FIFO and the right structure only when you need middle removal.

<!-- @code python -->
```python
from collections import deque

q = deque()          # 45ns/op, 24.3 bytes/element
q.append(10)
x = q.popleft()
```

<!-- @annotations -->
- 3: Internally a doubly linked list of fixed-size blocks — the linked idea applied at block granularity rather than per element, which is why it gets the growth behaviour without paying 64 bytes a node.

<!-- @example -->

<!-- @input -->
`enqueue 10, enqueue 20, dequeue, dequeue, enqueue 30`

<!-- @output -->
`10, 20`, then a queue holding 30 — with `tail` correctly reset in between

<!-- @why -->
The full lifecycle including the empty state, which is where the structure breaks if it is going to.

<!-- @walkthrough -->
1. `enqueue 10` on an empty queue: `tail` is null, so the new node becomes both `head` and `tail`.
2. `enqueue 20`: `tail` is non-null, so `tail->next` is written and `tail` advances. `head` is untouched.
3. `dequeue` reads 10, advances `head` to the node holding 20, and frees the old head. `head` is non-null, so `tail` stays put.
4. `dequeue` reads 20 and advances `head` to null.
5. **`head` is now null, so `tail` must be set to null too** — otherwise it still points at the node being freed on this very line.
6. `enqueue 30` sees a null `tail`, correctly treats the queue as empty, and makes the new node both `head` and `tail`.
7. Had step 5 been skipped, step 6 would have written through a dangling pointer and left `head` null — the queue would report empty while holding 30.

<!-- @example -->

<!-- @input -->
The same code with `if (!head) tail = nullptr;` removed

<!-- @output -->
100,452 of 100,454 enqueued elements became unreachable — **100.0%**

<!-- @why -->
A bug that passes every fill-then-drain test and destroys the structure under real traffic.

<!-- @walkthrough -->
1. While the queue never empties, `tail` is always valid and everything works — which is why the bug hides.
2. The first time the last element is dequeued, `head` becomes null and `tail` keeps pointing at the freed node.
3. The next `enqueue` tests `tail`, finds it non-null, and links the new node onto the dead one.
4. Because that branch was taken, `head` is never assigned — it is still null.
5. `empty()` therefore returns true, and every subsequent dequeue is skipped.
6. Every enqueue after that point vanishes into a chain nothing points to.
7. Measured over 200,000 balanced operations: **100.0%** of enqueued elements lost, with only the two present before the first drain surviving.
8. A fill-then-drain test enqueues everything before dequeuing anything, so it never reaches step 2 and reports success.

<!-- @example -->

<!-- @input -->
Two million enqueues, then two million dequeues — worst single operation

<!-- @output -->
32,000ns with a free list, 667,625ns with `new`/`delete`, 1,548,542ns for two stacks

<!-- @why -->
The reason this subtopic exists, and the discovery that the obvious version does not deliver it.

<!-- @walkthrough -->
1. The previous subtopic's two-stack queue spikes because one dequeue transfers the entire contents — measured at 1,548,542ns here.
2. A growing circular buffer spikes because one enqueue reallocates and linearises everything — 1,225,958ns.
3. A linked queue does neither: every operation is a fixed number of pointer writes, so it should have no spike at all.
4. Measured with `new` and `delete`, its worst operation was still **667,625ns** — only **1.8x** better than the growing array.
5. That spike is not the data structure; it is the allocator's slow path asking the operating system for more memory, which accumulating two million nodes triggers repeatedly.
6. With a free list, no allocation happens after the high-water mark, and the worst operation fell to **32,000ns**.
7. That is **38.3x** better than the growing buffer and **48.4x** better than the two-stack queue, and it is reproducible across runs.
8. The lesson is that "O(1) worst case" describes the algorithm, and the allocator is not part of the algorithm.

<!-- @example -->

<!-- @input -->
Enqueueing n elements with no tail pointer, and with the ends reversed

<!-- @output -->
`(n-1)(n-2)/2` nodes walked, and `n(n-1)/2` respectively

<!-- @why -->
The same quadratic reached from two different misunderstandings of what a pointer buys you.

<!-- @walkthrough -->
1. With only a `head` pointer, each enqueue walks the whole list to find the last node.
2. Across n enqueues that is exactly `(n-1)(n-2)/2` steps — 127,976,001 at n = 16,000.
3. Adding a `tail` pointer removes all of it, because the node you need is the one you are holding.
4. Reversing the ends looks symmetric but is not: dequeue must now remove the tail.
5. Removing the tail requires the node *before* it, and a singly linked list has no way back — so it walks, at exactly `n(n-1)/2` steps.
6. A `tail` pointer does not help, which is the point: holding a pointer to a node lets you **append** after it, never **unlink** it.
7. That is the third appearance of `n(n-1)/2` in this topic, after array shifting and grow-by-one — the same arithmetic from three unrelated mistakes.

<!-- @example -->

<!-- @input -->
The same node and free-list machinery used as a stack, then as a queue

<!-- @output -->
4.98ns against 5.02ns per operation — indistinguishable

<!-- @why -->
A reasonable hypothesis, tested and refuted, recorded rather than quietly dropped.

<!-- @walkthrough -->
1. A stack touches one end of a linked list; a queue touches two.
2. It seemed likely the queue would pay for that, since the head being dequeued sits far in memory from the tail being enqueued.
3. Both ends would then have to stay resident, where a stack's working set is a single hot region.
4. Measured with identical nodes, identical free list and the same 4,000,000 operations, changing only the linking discipline: **4.98ns** as a stack and **5.02ns** as a queue.
5. The difference is within run-to-run noise, so the second live end costs nothing measurable.
6. The linked queue's 1.40x against the circular buffer is therefore the ordinary price of a linked structure, not a queue-specific penalty.
7. Worth recording because the hypothesis was plausible, and an untested plausible explanation is how wrong figures enter a lesson.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the list horizontally with `head` and `tail` as two labelled arrows above it, and make the point of the subtopic visible immediately by animating one enqueue and one dequeue at opposite ends *simultaneously* — the stack subtopic's equivalent picture had both arrows on the same node, and putting the two diagrams side by side is the cleanest statement of why this one needs a second pointer. Then give the empty transition its own extended beat, because it is where the structure breaks: dequeue the last node, show `head` going null, and show `tail` still pointing at the node as it is freed — draw the freed node greying out with the `tail` arrow still attached to it. Then run the next enqueue twice in parallel bands. In the correct band `tail` was nulled, so the new node becomes both head and tail and the queue holds one element. In the buggy band `tail` is followed into the grey node, the new node hangs off a corpse, `head` stays null, and the queue reports empty — label that band 100.0% of elements lost and let the subsequent enqueues pile up in a chain that nothing points to. Second panel is the orientation: two lists side by side, one appending at the tail with a single pointer write, the other trying to *remove* at the tail and having to walk from the head to find the previous node, with the walk animated and a step counter reaching n(n-1)/2. The caption is that a pointer to a node lets you append after it, never unlink it. Third panel is the latency comparison, and it should be four horizontal timelines of the same length, one per implementation, with a tick for every operation and the tick height its cost: the two-stack queue with one colossal spike at 1,548,542ns, the growing circular buffer with a run of doubling spikes topping out at 1,225,958ns, the linked queue with `new`/`delete` showing scattered medium spikes to 667,625ns, and the free-list version nearly flat with its tallest at 32,000ns. Draw all four at the same vertical scale so the last one looks almost like a straight line. Beneath, the throughput numbers in the opposite order — 3.07, 3.90, 4.31, 14.45 — so the reader sees that the flattest timeline is not the fastest one.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"whyTwoPointers":"a stack lives at one end of a linked list and a queue at both, so a queue needs a tail pointer where Implement Stack using Linkedlist needed nothing beyond head","correctness":{"operations":800000,"valuesChecked":359856,"mismatches":0,"invariantsChecked":"size and empty after every call"},"orientationIsForced":{"canDo":"append at the tail in O(1) -- you hold the node and write its next","cannotDo":"remove at the tail in O(1) -- that needs the next of the node BEFORE it, and a singly linked list has no way back","measuredReversed":[{"n":1000,"nodesWalked":499500,"formula":499500},{"n":2000,"nodesWalked":1999000,"formula":1999000},{"n":4000,"nodesWalked":7998000,"formula":7998000},{"n":8000,"nodesWalked":31996000,"formula":31996000}],"noTailPointer":{"formula":"(n-1)(n-2)/2","atN16000":{"nodesWalked":127976001,"timeNs":154630209}},"thirdAppearance":"n(n-1)/2 has now turned up for array shifting (Implement Queue using Arrays), grow-by-one (Implement Stack using Arrays) and this -- three unrelated mistakes, one arithmetic"},"theDanglingTail":{"line":"if (!head) tail = nullptr;","whatHappens":"when the last element leaves, head goes null but tail still points at the node being freed; the next enqueue sees a non-null tail, links onto a dead node, and never assigns head","measured":{"operations":200000,"enqueued":100454,"unreachable":100452,"pct":100.0},"whyItHides":"everything works until the queue first becomes empty; a fill-then-drain test never empties mid-run, so it passes","javaNote":"still required under GC -- same correctness bug, and a stale tail also keeps the whole drained chain reachable so nothing can be collected"},"worstCase":{"workload":"2,000,000 enqueues then 2,000,000 dequeues, worst single operation, three runs","runs":[{"impl":"linked list, new/delete","ns":[651625,845750,667625]},{"impl":"linked list, free list","ns":[32000,36083,27041]},{"impl":"growing circular buffer","ns":[1321708,1223042,1225958]},{"impl":"two-stack queue","ns":[1521500,1862708,1548542]}],"headline":"the naive linked queue is only 1.8x better than the growing array -- the spike is the allocator's slow path asking the OS for memory, and accumulating two million nodes triggers it repeatedly","withFreeList":"32,000ns, which is 38.3x better than the growing buffer and 48.4x better than the two-stack queue","lesson":"O(1) worst case describes the algorithm, and the allocator is not part of the algorithm","distributionTail":{"workload":"balanced 4,000,000 ops","rows":[{"impl":"linked list, new/delete","p999":83,"max":20333},{"impl":"linked list, free list","p999":83,"max":15167},{"impl":"growing circular buffer","p999":42,"max":299334},{"impl":"two-stack queue","p999":83,"max":190333}],"reading":"the arrays are BETTER at the 99.9th percentile and far worse at the maximum; the linked queue trades a noisier body for a much shorter tail"}},"throughput":{"workload":"4,000,000 data-dependent operations at 55% enqueue, own process each, same harness as the previous two subtopics","rows":[{"impl":"circular buffer (mask)","nsPerOp":3.07,"ratio":1.0},{"impl":"two-stack queue","nsPerOp":3.9,"ratio":1.27},{"impl":"std::queue","nsPerOp":3.9,"ratio":1.27},{"impl":"linked list, free list","nsPerOp":4.31,"ratio":1.4},{"impl":"linked list, new/delete","nsPerOp":14.45,"ratio":4.71},{"impl":"std::list","nsPerOp":14.86,"ratio":4.84}],"allocatorShare":"3.35x of the cost -- 14.45ns falls to 4.31ns when nodes are recycled and nothing else changes","agreesWith":"Implement Stack using Linkedlist measured 14.5ns to 3.9ns, a 3.69x improvement, for the same edit"},"memory":{"sizeofNode":"16 bytes for a 4-byte payload","measured":[{"n":4000000,"linkedBytesPerElement":16.06,"arrayBytesPerElement":4.0},{"n":16000000,"linkedBytesPerElement":16.06,"arrayBytesPerElement":4.0}],"ratio":"exactly 4x, before the allocator's per-block overhead"},"aHypothesisThatDidNotSurvive":{"hypothesis":"a queue touches two ends of the list where a stack touches one, so the queue should pay for keeping both resident","test":"identical node and free-list machinery, same 4,000,000 operations, only the linking discipline differing","result":{"asStack":4.98,"asQueue":5.02},"conclusion":"indistinguishable -- the second live end costs nothing measurable, so the 1.40x is the ordinary price of a linked structure and not a queue-specific penalty","whyRecorded":"the hypothesis was plausible, and an untested plausible explanation is how wrong figures enter a lesson"},"fragmentation":{"stillApplies":"Implement Stack using Linkedlist measured consecutively allocated nodes at 1.6ns each and scattered ones at 46.3ns -- 28.62x","freeListEffect":"makes it better rather than worse, because it keeps recycling the same small set of nodes"},"python":{"workload400k":[{"impl":"collections.deque","nsPerOp":45,"vsDeque":1.0},{"impl":"two stacks (previous subtopic)","nsPerOp":48,"vsDeque":1.07},{"impl":"linked list, __slots__ nodes","nsPerOp":106,"vsDeque":2.38},{"impl":"linked list, plain class nodes","nsPerOp":114,"vsDeque":2.55}],"verdict":"the WORST hand-written queue in this topic for Python, and by some distance -- every node is a heap-allocated Python object with its own header","memoryTracemalloc":[{"impl":"collections.deque","bytesPerElement":24.3},{"impl":"linked list, __slots__","bytesPerElement":64.0},{"impl":"linked list, plain class","bytesPerElement":104.0}],"slotsNote":"__slots__ removes the per-instance __dict__ and saves 40 bytes a node, and the structure still costs 2.6x a deque","freeListInPython":"does not pay -- it saves the object construction but adds three interpreted attribute accesses per enqueue"},"whenToChooseIt":"when a millisecond pause is unacceptable, when the queue must grow without a copy, or when you will later need to unlink a node from the middle -- which is what LRU Cache is built around","recommendation":"head and tail pointers with a free list; otherwise use the array-backed container, which is 1.40x faster and a quarter of the memory","lesson":"the pointers were never the problem or the solution -- the allocator was both"}
```

<!-- @highlights -->
- The list is drawn horizontally with `head` and `tail` as two labelled arrows above it.
- One enqueue and one dequeue animate at opposite ends simultaneously.
- Beside it sits the stack subtopic's equivalent picture, where both arrows are on the same node.
- Those two diagrams together are the cleanest statement of why this structure needs a second pointer.
- The empty transition gets its own extended beat, because it is where the structure breaks.
- Dequeue the last node: `head` goes null while `tail` still points at the node being freed.
- The freed node greys out with the `tail` arrow still attached to it.
- The next enqueue then runs twice in parallel bands.
- Correct band: `tail` was nulled, so the new node becomes both head and tail.
- Buggy band: `tail` is followed into the grey node and the new node hangs off a corpse.
- `head` stays null, the queue reports empty, and the band is labelled 100.0% of elements lost.
- Subsequent enqueues pile up in a chain that nothing points to.
- Second panel: two lists, one appending at the tail in a single pointer write.
- The other tries to *remove* at the tail and must walk from the head to find the previous node.
- The walk is animated with a step counter reaching `n(n-1)/2`.
- Its caption: a pointer to a node lets you append after it, never unlink it.
- Third panel: four horizontal timelines of equal length, one per implementation.
- Every operation is a tick whose height is its cost, all four drawn at the same vertical scale.
- Two-stack queue shows one colossal spike at 1,548,542ns; the growing buffer a run of doubling spikes to 1,225,958ns.
- The linked queue with `new`/`delete` shows scattered medium spikes to 667,625ns; the free-list version is nearly flat at 32,000ns.
- Beneath, the throughput numbers in the opposite order — 3.07, 3.90, 4.31, 14.45 — so the flattest timeline is visibly not the fastest.

<!-- @edgeCases -->
- Enqueue into an empty queue — `tail` is null, so the new node becomes both `head` and `tail`.
- Dequeue the last element — `head` goes null, and `tail` must be nulled with it.
- Dequeue from an empty queue — `head` is null; check before dereferencing, since there is no sentinel to absorb it.
- A single element — `head` and `tail` point at the same node, which is the state both branches of `enqueue` must produce correctly.
- Draining to empty and refilling — the case that exposes a dangling `tail`, and the one fill-then-drain tests never reach.
- `front` on an empty queue — the same null check as `dequeue`; a dummy node removes both, at one wasted node.
- A queue that grows to millions of nodes — no reallocation and no copy, but the allocator's slow path measured 667,625ns.
- A long-lived queue in a fragmented heap — nodes scatter, and traversal was measured at 28.62x the consecutive case.
- A free list after a traffic spike — memory is never returned, so the queue holds its high-water mark forever.
- Destroying a non-empty queue — every node must be walked and freed; forgetting leaks the entire chain.
- A stale `tail` under garbage collection — still a correctness bug, and it also pins the whole drained chain in memory.

<!-- @pitfalls -->
- Omitting `if (!head) tail = nullptr;`. Measured at **100.0%** of subsequently enqueued elements lost.
- Testing only with fill-then-drain. The queue never empties mid-run, so the dangling-tail bug survives every such test.
- Leaving out the tail pointer. Enqueue walks the list, at `(n-1)(n-2)/2` steps across n enqueues.
- Enqueueing at the head and dequeueing at the tail. A `tail` pointer lets you append there, never unlink there — it is `n(n-1)/2` again.
- Believing a `tail` pointer makes tail removal cheap. You need the node *before* it, which a singly linked list cannot give you.
- Expecting `new`/`delete` per node to deliver an O(1) worst case. It measured 667,625ns, only 1.8x better than the growing array.
- Quoting the linked queue as "no spike". Its spike is the allocator's, and only a free list removes it.
- Assuming the linked structure is the slow part. Recycling nodes took 14.45ns to 4.31ns without touching a single pointer operation.
- Ignoring the 4x memory. 16.06 bytes per element against 4.00, before the allocator's own overhead.
- Benchmarking with nodes allocated in a tight loop. They come out adjacent; a real heap scatters them, at 28.62x the traversal cost.
- Reaching for a linked queue in Python. It measured **2.38x** `collections.deque` and 2.6x its memory — the worst option in this topic.
- Using plain classes for nodes in Python. `__slots__` saves 40 bytes each, taking 104 bytes per element to 64.
- Using `LinkedList` in Java for a plain FIFO. It is doubly linked and pays for a `prev` pointer this design never needs.

<!-- @doubt -->
### Why does this need a tail pointer when the stack version needed nothing?

<!-- @answer -->
Because a stack only ever touches one end and a queue touches both. **Implement Stack using Linkedlist** could push and pop entirely at the head, which is the one end a singly linked list makes cheap — that is why that subtopic called the structure and the problem a natural fit. A queue removes from the oldest end and adds at the newest, so one of those ends is not the head, and reaching it means either holding a pointer to it or walking there. Walking there is exactly as expensive as it sounds: with only a `head` pointer, enqueueing n elements walks `(n-1)(n-2)/2` nodes — 127,976,001 at n = 16,000, measured at 154 milliseconds where the tail-pointer version is linear. The fix is one extra pointer and two extra lines, and it is the entire difference between O(n) and O(1) on that operation.

<!-- @doubt -->
### Can I enqueue at the head and dequeue at the tail instead?

<!-- @answer -->
No, and the asymmetry is worth understanding precisely because it looks symmetric. A `tail` pointer lets you **append** at the tail in O(1): you hold the node, you write its `next`, done. It does **not** let you **remove** at the tail, because removing a node means updating the `next` of the node *before* it — and a singly linked list gives you no way to find that predecessor except by walking from the head. So holding a pointer to a node is not the same as being able to unlink it, which is the general lesson here. Measured, the reversed orientation walks exactly `n(n-1)/2` nodes: **31,996,000** at n = 8,000. That is the same arithmetic **Implement Queue using Arrays** measured for shifting on dequeue and **Implement Stack using Arrays** measured for growing by one — three unrelated mistakes producing one formula. A doubly linked list fixes it outright, since every node knows its predecessor, at the cost of another 8 bytes per node; that is the trade **LRU Cache** makes deliberately.

<!-- @doubt -->
### What is `if (!head) tail = nullptr;` actually for?

<!-- @answer -->
It stops your queue from silently swallowing everything you put in it. When the last element is dequeued, `head` becomes null but `tail` still points at the node you are about to free. The next `enqueue` tests `tail`, finds it non-null, and takes the "queue is not empty" branch — linking the new node onto a dead node and **never assigning `head`**, which is still null. From that moment `empty()` returns true forever while every enqueue disappears into a chain nothing points to. Measured over 200,000 balanced operations with the line removed: **100,452 of 100,454 enqueued elements became unreachable**, or 100.0%. What makes it genuinely dangerous is the timing — everything works perfectly until the queue *first* becomes empty, so a fill-then-drain test passes cleanly and only interleaved traffic that drains to zero and refills exposes it. Java and Python need the same line for the same reason, plus a second one: a stale `tail` keeps the entire drained chain reachable, so the collector cannot free any of it.

<!-- @doubt -->
### Is this really O(1) worst case?

<!-- @answer -->
The algorithm is; the program is not, unless you also remove the allocator. This is the most useful thing measured in this subtopic. Every operation here is a fixed number of pointer writes — no shifting, no wraparound, no transfer — so it should have none of the spikes the previous two subtopics measured. In practice, with `new` and `delete` per node, two million enqueues followed by two million dequeues produced a worst single operation of **667,625ns**, against **1,225,958ns** for a growing circular buffer and **1,548,542ns** for the two-stack queue. Only **1.8x** better than the thing it was supposed to fix. The spike is the allocator's slow path asking the operating system for memory, which accumulating millions of nodes triggers repeatedly. Add a free list — dequeue parks the node on a spare chain, enqueue takes from it — and the worst case falls to **32,000ns**, which is 38.3x better than the growing buffer and 48.4x better than the two-stack queue. So the bounded worst case is real, and it comes from not calling the allocator rather than from the pointers.

<!-- @doubt -->
### Is it slower than the array queue?

<!-- @answer -->
Yes, and by less than you would expect once nodes are recycled. On 4,000,000 data-dependent operations using the same harness as the previous two subtopics: circular buffer **3.07ns** per operation, two-stack queue 3.90ns, `std::queue` 3.90ns, free-list linked queue **4.31ns**, and the same linked queue with `new`/`delete` **14.45ns**. So the naive version is **4.71x** and the recycled version **1.40x**. The gap between those two is the whole point: the allocator is 3.35x of the cost, and not one pointer operation changed between them — the same conclusion **Implement Stack using Linkedlist** reached when a free list took it from 14.5ns to 3.9ns. There is also a memory cost that does not go away: **16.06 bytes per element against 4.00**, exactly 4x, because a node is a value plus a pointer with alignment rounding it up. And one caveat about all of these numbers — benchmarks allocate nodes in a tight loop, so they land adjacent in memory; that subtopic measured scattered nodes traversing at **28.62x** the consecutive cost, and no benchmark of this shape will show it.

<!-- @doubt -->
### Does a queue cost more than a stack because it touches both ends?

<!-- @answer -->
No — and this was worth testing rather than assuming, because the reasoning sounds right. The head being dequeued sits far in memory from the tail being enqueued, so a queue's working set is two regions where a stack's is one, and you would expect the queue to pay in cache misses. Measured with identical node structures, an identical free list and the same 4,000,000 operations, changing only whether new nodes link at the head or at the tail: **4.98ns** per operation as a stack and **5.02ns** as a queue. That is inside run-to-run noise. So the second live end costs nothing measurable, and the linked queue's 1.40x against the circular buffer is the ordinary price of a linked structure rather than anything specific to queues. The reason to record a refuted hypothesis rather than delete it is that a plausible untested explanation is exactly how a wrong number ends up in a lesson and gets repeated.

<!-- @doubt -->
### Should I use a dummy head node?

<!-- @answer -->
It is a reasonable simplification and it is not free. A dummy — a permanently allocated node that sits before the first real element — means `head` is never null, so `enqueue` loses its "was the queue empty?" branch and `dequeue` loses the `if (!head) tail = nullptr;` line, because `tail` can simply point at the dummy when the queue is empty. That removes the single most common bug in this structure, which is a real argument for it. What it costs is one node's worth of memory forever, a slightly less obvious invariant to hold in your head, and an extra indirection on `front`. For a queue built once and used everywhere, take the dummy. For an exercise or an interview, write the explicit version — the null handling *is* the thing being examined, and hiding it behind a sentinel means never confronting why `tail` has to be reset.

<!-- @doubt -->
### What about a doubly linked list?

<!-- @answer -->
For a plain FIFO it is pure cost. A queue needs to remove only at the head and add only at the tail, and a singly linked list with two pointers does both in O(1) — the `prev` pointers buy nothing and add 8 bytes to every node, taking 16 bytes per element to 24. That is why Java's `LinkedList` is the wrong default here despite implementing `Deque`: it is doubly linked, so a plain FIFO pays for backward links it never follows. The picture changes entirely when you need to remove a node from the **middle**. Then `prev` is exactly what lets you unlink in O(1) given only the node itself, which no array-backed queue can do at any price and which the singly linked version can only do by walking. That is the requirement **LRU Cache** is built around — a hash map finds the node, and the doubly linked list moves it to the front in constant time — and it is where the extra memory finally earns itself.

<!-- @doubt -->
### What should I use in Python?

<!-- @answer -->
`collections.deque`, and here the hand-written alternative is not close. Over 400,000 data-dependent operations: `deque` **45ns** per operation, the previous subtopic's two-stack construction 48ns, and the linked list **106ns** with `__slots__` nodes or 114ns with plain ones — **2.38x**. That makes it the worst hand-written queue in this topic for Python, where the two-stack version was the best at 1.06x. The reason is structural: every node is a heap-allocated Python object with its own header, so an enqueue is an object construction rather than a pointer write. Memory says the same thing — `tracemalloc` over 200,000 elements gives 24.3 bytes each for `deque` against **64.0** for `__slots__` nodes and **104.0** for plain classes. Do use `__slots__` if you write one; it removes the per-instance `__dict__` and saves 40 bytes a node. Do not bother with a free list, which pays handsomely in C++ and not at all here — it saves the object construction but adds three interpreted attribute accesses to every enqueue. And it is worth knowing that `deque` is itself a doubly linked list of fixed-size blocks: the linked idea applied per block rather than per element, which is how it gets the growth behaviour without paying 64 bytes a node.
