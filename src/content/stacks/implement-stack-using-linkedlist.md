---
id: implement-stack-using-linkedlist
topic: Stacks
title: Implement stack using Linkedlist
difficulty: Easy
status: ready
prerequisites:
  - implement-stack-using-arrays
  - introduction-to-singly-linkedlist
  - insertion-at-the-head-of-linked-list
  - deletion-of-the-head-of-ll
relatedIds:
  - implement-stack-using-arrays
  - implement-queue-using-linkedlist
  - implement-stack-using-queue
  - implement-min-stack
  - balanced-paranthesis
---

<!-- @summary -->
A singly linked list already has a cheap end, so a stack is the head and nothing else: push is one allocation and one pointer write, pop is one read and one free, both O(1) **worst case** with no capacity, no reallocation and nothing to amortise. Verified over 247,012 popped values with zero mismatches. The costs are equally concrete: 16 bytes per node for a 4-byte payload, and 14.5ns per operation against a vector's 3.7ns. But that 3.96x is **entirely allocation** — recycling nodes through a free list brings it to 3.9ns, level with the vector. What the array cannot match is the worst case: its slowest single push measured **690,292ns**, always at element 2,097,152.

<!-- @theory -->
## The problem, and why it is easy this time

Implement `push`, `pop`, `top` and `empty` with a linked list.

The previous subtopic built a stack out of a structure that fights it. This one
is the opposite: a singly linked list has exactly one cheap end — the head — and
a stack only ever needs one end. They fit.

```
head -> [30] -> [20] -> [10] -> null

push(40):   new node, next = head, head = new node
pop():      value = head->val, head = head->next, free the old head
```

Both are a constant number of pointer writes. Nothing shifts, nothing is copied,
nothing is searched for. Verified against a `std::vector` model over 20,000 random
scripts — **247,012 popped values, 0 mismatches**, with the size invariant checked
after every operation.

## What it buys over the array

**O(1) worst case, not amortised.** The array stack's push is amortised O(1):
most pushes are instant and occasionally one copies the entire contents. The
linked list has no such spike, and the difference is measurable:

| Worst single push over 4,000,000 pushes | Run 1 | Run 2 | Run 3 |
|---|---|---|---|
| Growing `std::vector` | 690,292ns | 632,375ns | 253,375ns |
| Linked list | 40,375ns | 45,167ns | 39,875ns |

The vector's worst push happened at element **2,097,152** in all three runs —
exactly 2^21, a reallocation boundary. The linked list's worst case is 6.4x to
17.1x smaller and, more importantly, stable.

Be honest about what that does *not* say: 40µs is not O(1) either. The linked
list's spike is an allocator slow path asking the operating system for memory.
Neither structure gives a genuinely bounded push; the list's is just far smaller
and not tied to the size of the stack.

**No capacity.** It grows until memory runs out, with no `cap` field, no growth
factor and no reallocation.

## What it costs

**Memory.** A node is a value plus a pointer, and alignment rounds it up:

```
sizeof(Node{int val; Node* next;}) == 16 bytes    for a 4-byte payload
```

**4x the memory per element**, before the allocator's own per-block overhead. The
array stack stores 4 bytes and some spare capacity.

**Throughput.** Over 2,000,000 data-dependent push/pop operations:

| | Per operation |
|---|---|
| Linked list, `new`/`delete` per node | 14.5ns |
| `std::vector`, reserved | **3.7ns** |

**3.96x slower.** But that number hides where the cost actually is.

## The cost is allocation, not the pointers

Replace `new`/`delete` with a free list — pop pushes the node onto a spare chain
instead of freeing it, and push takes from that chain instead of allocating:

| Over 2,000,000 operations | Per operation |
|---|---|
| `new`/`delete` per node | 14.5ns |
| Free list | **3.9ns** |
| `std::vector` for reference | 3.7ns |

**3.69x faster**, and now level with the vector. So the linked structure itself
is not slow — the allocator is. The worst-case push improves too, from 45,834ns
to 25,625ns.

That is the whole throughput story on a workload where the nodes stay hot in
cache. The other story is what happens when they do not.

## Fragmentation is the real hazard

The measurement above allocates nodes back to back, so they end up adjacent in
memory and the traversal reads sequentially. A long-lived stack in a real program
does not look like that — its nodes are interleaved with everything else the
allocator handed out. Walking 2,000,000 nodes:

| Node layout | Total | Per node |
|---|---|---|
| Consecutively allocated | 3,232,541ns | **1.6ns** |
| Scattered | 92,521,708ns | **46.3ns** |

**28.62x.** Each node is a dependent load — the address of the next one is not
known until the current one arrives — so a cache miss cannot be overlapped with
anything. An array walk prefetches perfectly; a scattered list cannot be
prefetched at all.

This is the argument against linked lists in one number, and it does not appear
in any benchmark that allocates its nodes in a tight loop.

## Python

| 200,000 data-dependent operations | Per operation |
|---|---|
| Linked list of node objects | 708ns |
| Native `list` | **636ns** |

Only **1.11x**, because interpreter overhead swamps both. The memory comparison
is where Python is brutal:

| Per node | Bytes |
|---|---|
| `Node` with `__slots__` | 48 |
| `Node` without `__slots__` | **344** (object plus its `__dict__`) |
| A `list` slot | 8, plus the shared int object |

Omitting `__slots__` costs **7.2x** the memory per node. And a linked list invites
recursive traversal, which Python caps at a default recursion limit of 1,000 — so
a recursive walk of a 10,000-node stack overflows where the iterative one is fine.

## Where this goes next

**Balanced Paranthesis** is the first subtopic that *uses* a stack rather than
building one, and it is the canonical reason the structure exists: the most
recently opened bracket is always the next one that must close, which is
last-in-first-out stated as a rule about text.

<!-- @intuition -->
The previous two subtopics had to force a stack out of structures that wanted to do something else. A linked list does not need forcing, because it already has the shape the problem asks for: one end you can reach immediately and one direction you can travel. A stack only ever touches its top, and the head of a list is exactly that — adding means making a new node point at the old head, removing means following the head's pointer one step and letting go. Neither operation depends on how many elements are behind it, which is why this is O(1) in the worst case rather than on average. What you pay for that guarantee is not time but arrangement: every element now carries a pointer alongside it, and every element lives wherever the allocator happened to put it. That second cost is invisible in a benchmark that allocates everything at once and devastating in a program that does not.

<!-- @approach -->
### Push and Pop at the Head

<!-- @idea -->
Make the new node point at the old head and move the head to it; reverse the steps to pop.

<!-- @steps -->
1. Keep a single `head` pointer, null when the stack is empty.
2. To push, allocate a node holding the value with `next` set to the current head.
3. Move `head` to the new node — the stack has grown by one, and nothing else moved.
4. To pop, remember the head, read its value, advance `head` to `head->next`, and release the old node.
5. To peek, read the head's value without moving anything; the stack is empty exactly when `head` is null.

<!-- @complexity -->
- time: O(1) worst case for push, pop, top and empty — no amortisation involved
- space: O(n), at 16 bytes per node for a 4-byte payload, which is 4x the array's per-element cost
- note: Verified against a std::vector model over 20,000 random scripts — 247,012 popped values, 0 mismatches, with size checked after every operation. Measured 14.5ns per operation against a reserved vector's 3.7ns, a factor of 3.96 that turns out to be allocation rather than pointer traversal. Its real advantage is the worst case: the vector's slowest single push measured 690,292ns against this one's 40,375ns.

<!-- @code cpp -->
```cpp
class LinkedStack {
    struct Node {
        int val;
        Node* next;
    };
    Node* head = nullptr;
    int   n = 0;

public:
    ~LinkedStack() { while (head) { Node* q = head->next; delete head; head = q; } }

    void push(int x) {
        head = new Node{x, head};        // the old head becomes the new node's next
        n++;
    }

    bool pop(int& out) {
        if (!head) return false;
        Node* old = head;
        out = old->val;
        head = old->next;
        delete old;
        n--;
        return true;
    }

    bool top(int& out) const {
        if (!head) return false;
        out = head->val;
        return true;
    }

    bool empty() const { return head == nullptr; }
    int  size()  const { return n; }
};
```

<!-- @annotations -->
- 13: new Node{x, head} reads the old head as the new node's next before head is reassigned, so the order is safe in one statement.
- 22: head must advance BEFORE the delete — reading old->next after freeing it is a use-after-free that usually appears to work.
- 10: Without this destructor every node leaks; the array version had nothing to clean up because it owned one block.
- 7: A size counter, because a linked list has no length of its own and counting it would be O(n).

<!-- @code java -->
```java
class LinkedStack {
    private static class Node {
        final int val;
        Node next;
        Node(int val, Node next) { this.val = val; this.next = next; }
    }

    private Node head = null;
    private int n = 0;

    void push(int x) {
        head = new Node(x, head);
        n++;
    }

    int pop() {
        if (head == null) throw new NoSuchElementException("stack underflow");
        int v = head.val;
        head = head.next;                // the old node becomes garbage
        n--;
        return v;
    }

    int peek() {
        if (head == null) throw new NoSuchElementException("stack underflow");
        return head.val;
    }

    boolean isEmpty() { return head == null; }
    int size() { return n; }
}
```

<!-- @annotations -->
- 2: static, so each node does not carry a hidden reference to the enclosing LinkedStack — a non-static inner class silently adds a field and keeps the stack alive.
- 19: No explicit free, but dropping the reference is what makes the node collectable; holding it in a field by accident is the Java version of a leak.

<!-- @code python -->
```python
class LinkedStack:
    class Node:
        __slots__ = ("val", "next")
        def __init__(self, val, nxt):
            self.val = val
            self.next = nxt

    def __init__(self):
        self._head = None
        self._n = 0

    def push(self, x) -> None:
        self._head = LinkedStack.Node(x, self._head)
        self._n += 1

    def pop(self):
        if self._head is None:
            raise IndexError("pop from empty stack")
        node = self._head
        self._head = node.next
        self._n -= 1
        return node.val

    def top(self):
        if self._head is None:
            raise IndexError("peek from empty stack")
        return self._head.val

    def __len__(self) -> int:
        return self._n
```

<!-- @annotations -->
- 3: __slots__ is not a micro-optimisation here — measured, it is 48 bytes per node against 344 without, a factor of 7.2.
- 13: Measured 708ns per operation against a native list's 636ns, so this costs 1.11x the time and several times the memory to reimplement what a list already does.

<!-- @approach -->
### The Wrong End - Push at the Tail

<!-- @idea -->
Append to the end of the list instead, which looks equally reasonable and is not.

<!-- @steps -->
1. Keep a `head` pointer and walk to the last node to append.
2. Note that with only a head pointer, appending is O(n) because the end must be found.
3. Adding a `tail` pointer makes appending O(1) again.
4. But popping must then remove the *last* node, which requires the node before it.
5. A singly linked list cannot step backwards, so that search is O(n) no matter what pointers are kept.

<!-- @complexity -->
- time: O(1) push with a tail pointer, but O(n) pop always — the tail is the expensive end of a singly linked list
- space: O(n), plus one extra pointer for the tail
- note: Included because it is the natural first instinct and it is wrong in a way worth seeing. The head is cheap for both operations and the tail is cheap for at most one. A doubly linked list fixes it by storing a previous pointer, which costs another 8 bytes per node — 24 instead of 16 — to buy back what the head offered for free.

<!-- @code cpp -->
```cpp
class TailStack {                        // DON'T — shown to make the asymmetry visible
    struct Node { int val; Node* next; };
    Node* head = nullptr;
    Node* tail = nullptr;

public:
    void push(int x) {                   // O(1), thanks to the tail pointer
        Node* nd = new Node{x, nullptr};
        if (tail) tail->next = nd; else head = nd;
        tail = nd;
    }

    bool pop(int& out) {                 // O(n) — the previous node must be found
        if (!head) return false;
        if (head == tail) { out = head->val; delete head; head = tail = nullptr; return true; }

        Node* prev = head;
        while (prev->next != tail) prev = prev->next;    // the whole list, every pop
        out = tail->val;
        delete tail;
        tail = prev;
        tail->next = nullptr;
        return true;
    }
};
```

<!-- @annotations -->
- 18: This walk is the entire problem: a singly linked list cannot step backwards, so reaching the second-to-last node costs a full traversal on every pop.
- 9: The tail pointer makes push O(1), which is exactly what makes the design look viable until pop is written.
- 15: The single-element case must be handled separately, or tail is left dangling — an easy omission because it only triggers when the stack empties.

<!-- @code java -->
```java
class TailStack {                        // DON'T
    private static class Node { int val; Node next; Node(int v){ val = v; } }
    private Node head, tail;

    void push(int x) {
        Node nd = new Node(x);
        if (tail != null) tail.next = nd; else head = nd;
        tail = nd;
    }

    int pop() {                          // O(n)
        if (head == null) throw new NoSuchElementException();
        if (head == tail) { int v = head.val; head = tail = null; return v; }
        Node prev = head;
        while (prev.next != tail) prev = prev.next;
        int v = tail.val;
        tail = prev; tail.next = null;
        return v;
    }
}
```

<!-- @annotations -->
- 15: java.util.LinkedList is doubly linked precisely to avoid this walk, at the cost of a second reference in every node.

<!-- @code python -->
```python
class TailStack:                          # DON'T
    class Node:
        __slots__ = ("val", "next")
        def __init__(self, val): self.val = val; self.next = None

    def __init__(self):
        self.head = self.tail = None

    def push(self, x) -> None:            # O(1)
        nd = TailStack.Node(x)
        if self.tail: self.tail.next = nd
        else: self.head = nd
        self.tail = nd

    def pop(self):                        # O(n)
        if self.head is None:
            raise IndexError("pop from empty stack")
        if self.head is self.tail:
            v = self.head.val; self.head = self.tail = None; return v
        prev = self.head
        while prev.next is not self.tail:
            prev = prev.next
        v = self.tail.val
        self.tail = prev; prev.next = None
        return v
```

<!-- @annotations -->
- 21: `is not` rather than `!=`, because the comparison is about node identity; `!=` would invoke __eq__ and compare values.

<!-- @approach -->
### Reducing the Cost - Recycle Nodes with a Free List

<!-- @idea -->
Popped nodes go onto a spare chain instead of being freed, and pushes take from that chain instead of allocating.

<!-- @steps -->
1. Keep a second head pointer, the free list, holding nodes that are no longer in the stack.
2. On pop, unlink the node as usual but link it onto the free list rather than deleting it.
3. On push, take a node from the free list if one is available.
4. When the free list is empty, allocate a block of many nodes at once and chain them onto it.
5. Release the blocks only when the stack itself is destroyed.

<!-- @complexity -->
- time: O(1) worst case, with a much smaller constant — measured 3.9ns per operation against 14.5ns for new/delete per node
- space: O(n) plus the retained free nodes, which are never returned to the allocator until the end
- note: 3.69x faster, which brings the linked stack level with a reserved std::vector at 3.7ns per operation. That is the useful finding: the linked list's throughput penalty was allocation, not pointer traversal. The worst-case push improves as well, from 45,834ns to 25,625ns. The trade is that memory is held rather than returned, so a stack that peaks large and then shrinks keeps the peak.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

class PooledStack {
    struct Node { int val; Node* next; };
    Node* head  = nullptr;
    Node* freeList = nullptr;
    vector<Node*> blocks;                        // owned, released at the end

    Node* take() {
        if (freeList) { Node* n = freeList; freeList = n->next; return n; }
        Node* blk = new Node[1024];              // one allocation for 1024 nodes
        blocks.push_back(blk);
        for (int i = 1; i < 1024; i++) { blk[i].next = freeList; freeList = &blk[i]; }
        return &blk[0];
    }

public:
    ~PooledStack() { for (Node* b : blocks) delete[] b; }

    void push(int x) {
        Node* nd = take();
        nd->val = x;
        nd->next = head;
        head = nd;
    }

    bool pop(int& out) {
        if (!head) return false;
        Node* old = head;
        out = old->val;
        head = old->next;
        old->next = freeList;                    // recycled, not freed
        freeList = old;
        return true;
    }
};
```

<!-- @annotations -->
- 13: One allocation for 1024 nodes rather than 1024 allocations, which is where most of the 3.69x comes from.
- 15: Chaining from index 1 upward and returning index 0, so the caller gets a node without touching the free list twice.
- 33: The only difference from the plain version's pop, and it removes the delete entirely.
- 19: The blocks must outlive every node carved from them, which is why they are owned here rather than by the nodes.

<!-- @code java -->
```java
class PooledStack {
    private static class Node { int val; Node next; }
    private Node head, freeList;

    private Node take() {
        if (freeList != null) { Node n = freeList; freeList = n.next; return n; }
        return new Node();
    }

    void push(int x) {
        Node nd = take();
        nd.val = x; nd.next = head; head = nd;
    }

    int pop() {
        Node old = head;
        int v = old.val;
        head = old.next;
        old.next = freeList; freeList = old;     // recycled, not collected
        return v;
    }
}

// Worth being careful here: this defeats the generational collector, which
// is optimised for exactly the short-lived garbage a plain node stack makes.
```

<!-- @annotations -->
- 24: In Java this is often a pessimisation rather than an optimisation — the young-generation collector handles short-lived nodes almost for free, and a pool keeps them alive into the old generation.

<!-- @code python -->
```python
class PooledStack:
    class Node:
        __slots__ = ("val", "next")
        def __init__(self): self.val = None; self.next = None

    def __init__(self):
        self._head = None
        self._free = None

    def push(self, x) -> None:
        if self._free is not None:
            nd = self._free; self._free = nd.next
        else:
            nd = PooledStack.Node()
        nd.val = x; nd.next = self._head
        self._head = nd

    def pop(self):
        nd = self._head
        self._head = nd.next
        nd.next = self._free                     # recycled
        self._free = nd
        return nd.val
```

<!-- @annotations -->
- 23: Reading nd.val after linking the node onto the free list is safe because the value has not been overwritten, but it is fragile — take the value first if the pool ever clears fields.

<!-- @approach -->
### Optimal in Practice - The Array-Backed Container

<!-- @idea -->
Unless you need the worst-case guarantee, the contiguous version wins on memory, on locality and on throughput.

<!-- @steps -->
1. Use `std::vector`, `ArrayDeque` or a Python `list`, as in Implement Stack using Arrays.
2. Accept amortised O(1) instead of worst-case O(1).
3. Note that the elements are contiguous, so traversal prefetches and the per-element cost is 4 bytes rather than 16.
4. Reach for the linked version only when a single slow operation is unacceptable, or when nodes are shared with other structures.
5. Note that `std::list` exists and is almost never the right answer for a stack.

<!-- @complexity -->
- time: O(1) amortised, measured at 3.7ns per operation against the naive linked list's 14.5ns
- space: O(n) at 4 bytes per element plus spare capacity, against 16 bytes per node
- note: The linked list's case rests entirely on worst-case latency, where it is genuinely better — 40,375ns against the vector's 690,292ns for the slowest single push. Everything else favours the array: 4x less memory, and a traversal that costs 1.6ns per element against 46.3ns once the nodes are scattered.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// The stack from the first subtopic, restated as the recommendation.
vector<int> s;
// push:  s.push_back(x);
// pop:   s.pop_back();
// top:   s.back();
// empty: s.empty();

// std::list<int> would give the linked version, and is almost never right
// for a stack: 3.96x slower here before fragmentation, and much worse after.
```

<!-- @annotations -->
- 5: Four operations with no class needed, which is the practical argument on its own.
- 11: Worth naming explicitly, because reaching for std::list when the word "linked" appears in a problem statement is a common reflex.

<!-- @code java -->
```java
Deque<Integer> s = new ArrayDeque<>();   // array-backed, the recommendation
s.push(10);
int x = s.peek();
s.pop();

// java.util.LinkedList also implements Deque, so it is a drop-in linked
// version — and carries a doubly linked node, at 24 bytes plus object
// header per element, for a stack that never needs to walk backwards.
```

<!-- @annotations -->
- 6: The drop-in nature is the hazard: changing one word turns a contiguous stack into a pointer-chasing one with no other visible difference.

<!-- @code python -->
```python
s = []
s.append(10)
x = s[-1]
s.pop()


# Measured against the linked version: 636ns per operation against 708ns,
# and 8 bytes per slot against 48 per node with __slots__, or 344 without.
```

<!-- @annotations -->
- 7: The time difference is small in Python — 1.11x — and the memory difference is not, which is the honest reason to prefer the list here.

<!-- @example -->

<!-- @input -->
push 10, push 20, push 30, then pop

<!-- @output -->
The head moves forward three times and back once; no other node is touched

<!-- @why -->
Following the pointers explicitly is what makes the O(1) claim obvious rather than asserted — nothing in the trace depends on how many nodes are already there.

<!-- @walkthrough -->
1. Start with head = null, which is the empty stack.
2. push 10: allocate a node holding 10 whose next is null, and point head at it. The list is [10].
3. push 20: allocate a node holding 20 whose next is the current head, the node holding 10. Point head at the new node, giving [20] -> [10].
4. push 30: the same again, giving [30] -> [20] -> [10]. Note that the nodes holding 10 and 20 were never touched — only read as the value of head.
5. pop: remember the head, read 30 from it, then move head to its next, the node holding 20.
6. Release the old head. The list is [20] -> [10] and the returned value is 30.
7. Every step was a fixed number of pointer writes, regardless of the list's length — which is what makes this worst-case O(1) rather than amortised.

<!-- @example -->

<!-- @input -->
The slowest single push out of 4,000,000, for both implementations

<!-- @output -->
690,292ns for the vector at element 2,097,152; 40,375ns for the linked list

<!-- @why -->
This is the one comparison the linked list wins, and it is the reason the structure is worth knowing rather than merely worth teaching.

<!-- @walkthrough -->
1. Each of 4,000,000 pushes was timed individually and the maximum kept.
2. The growing vector's slowest push took 690,292ns, and it occurred at element 2,097,152 — exactly 2^21, a reallocation boundary.
3. That push allocated a new array and copied two million integers into it, which is O(n) work inside a single supposedly O(1) call.
4. The linked list's slowest push took 40,375ns, and repeating the experiment gave 45,167ns and 39,875ns — stable, and not tied to any particular element.
5. Across the three runs the vector's worst was 690,292ns, 632,375ns and 253,375ns, always at the same element: ratios of 17.1x, 14.0x and 6.4x.
6. The honest reading is that neither is truly bounded — 40µs is an allocator asking the operating system for memory, not a constant-time operation.
7. But the linked list's spike does not grow with the stack, and the vector's does, which is what matters for anything with a latency budget.

<!-- @example -->

<!-- @input -->
The same linked stack with per-node allocation and with a free list

<!-- @output -->
14.5ns per operation against 3.9ns — level with the vector's 3.7ns

<!-- @why -->
It locates the linked list's throughput penalty precisely, and the answer is not the one the structure is usually blamed for.

<!-- @walkthrough -->
1. Over 2,000,000 data-dependent operations, the plain linked stack cost 14.5ns per operation and a reserved std::vector 3.7ns — a factor of 3.96.
2. The obvious explanation is pointer chasing, and it is wrong for this workload.
3. Replacing new and delete with a free list — popped nodes are chained onto a spare list and reused by later pushes — brought the cost to 3.9ns per operation.
4. That is 3.69x faster than the plain version, and within 6% of the vector.
5. So the penalty was the allocator, not the linked structure: the pointers themselves cost almost nothing when the nodes are hot in cache.
6. The free list also improved the worst-case push, from 45,834ns to 25,625ns, because most pushes no longer touch the allocator at all.
7. Its cost is that memory is retained rather than returned, so a stack that peaks at a million nodes and then drains keeps that million allocated.

<!-- @example -->

<!-- @input -->
Walking 2,000,000 nodes, allocated consecutively and scattered

<!-- @output -->
1.6ns per node against 46.3ns — a factor of 28.62

<!-- @why -->
It is the cost that every convenient benchmark hides, and the reason the array wins in real programs rather than only in microbenchmarks.

<!-- @walkthrough -->
1. Building the list in a tight loop leaves the nodes adjacent in memory, because the allocator hands out consecutive blocks.
2. Walking that list cost 3,232,541ns for two million nodes — 1.6ns each, which is close to a sequential array scan.
3. Shuffling the nodes before linking them models what a long-lived stack looks like, with its nodes interleaved among everything else the program allocated.
4. Walking the shuffled list cost 92,521,708ns — 46.3ns per node, a factor of 28.62.
5. The reason is that each node is a dependent load: the address of the next node is not known until the current one has arrived, so a cache miss cannot be overlapped with anything else.
6. An array walk has no such dependency and the hardware prefetches it perfectly.
7. This gap does not appear in the throughput measurement above, because that benchmark allocated its nodes consecutively — which is exactly why it is worth measuring separately.

<!-- @visualization linked-list -->

<!-- @description -->
Open with the fit, as a contrast with the previous subtopic: on the left, the queue-backed stack from 2/18 with its rotation animation running and a caption "the structure fought the interface"; on the right, a linked list with a single head arrow, and push drawn as one new node appearing and one arrow being redrawn. Caption it "one cheap end, and a stack only needs one". Then the mechanism, on push 10, 20, 30. Draw each node as a box split into a value cell and a pointer cell. For each push, animate in strict order: the new node materialises to the left, its pointer cell is drawn pointing at whatever head currently points to, and only then does the head arrow swing to the new node. That ordering is the code, so show it as three distinct beats. Then pop: highlight the head node, lift its value out to the side, swing the head arrow to the next node, and fade the old node out — again in that order, with a red flash if the fade is shown before the arrow moves, labelled "use after free". Then the memory panel: a node drawn to scale as 16 bytes, 4 of them shaded as the payload and 12 as pointer plus padding, beside an array cell of 4 bytes — with the 4x written between them. Add the Python row: 48 bytes with __slots__ and 344 without, drawn to the same scale so the second one runs off the panel. Then the latency panel, which is the linked list's case: two timelines of 4,000,000 pushes. The vector's is flat with a single enormous spike at element 2,097,152, annotated 690,292ns; the list's is flat with small ripples topping out at 40,375ns. Put a horizontal "latency budget" line across both so the spike visibly crosses it and the ripples do not. Then the allocation panel: the same two bars for 14.5ns and 3.7ns, then a third appearing at 3.9ns labelled "free list", closing the gap almost entirely — captioned "the pointers were never the problem". Close with the fragmentation panel: two lists of the same length drawn over a memory map. In the first, the nodes are adjacent and the traversal arrow moves smoothly left to right; in the second they are scattered across the map and the arrow jumps erratically, with each jump drawing a cache-miss marker. Run a per-node cost meter under each, settling at 1.6ns and 46.3ns.

<!-- @sampleInput -->
```json
{"fit":{"previousSubtopic":"a queue had to be rotated on every push","thisOne":"a singly linked list already has one cheap end, and a stack only needs one","pushIs":"one allocation and one pointer write","popIs":"one read and one free","guarantee":"O(1) WORST case, not amortised"},"trace":[{"op":"start","head":null,"list":[]},{"op":"push 10","newNodeNext":null,"head":"node(10)","list":[10]},{"op":"push 20","newNodeNext":"node(10)","head":"node(20)","list":[20,10],"note":"the node holding 10 was never touched"},{"op":"push 30","newNodeNext":"node(20)","head":"node(30)","list":[30,20,10]},{"op":"pop -> 30","head":"node(20)","list":[20,10],"order":["remember head","read value","advance head","free the old node"],"hazard":"advancing head AFTER the free is a use-after-free that usually appears to work"}],"verification":{"scripts":20000,"poppedValuesChecked":247012,"model":"std::vector","mismatches":0,"invariant":"size checked after every operation"},"memory":{"cpp":{"nodeBytes":16,"payloadBytes":4,"ratio":4,"why":"a value plus a pointer, rounded up by alignment"},"arrayCellBytes":4,"python":{"withSlots":48,"withoutSlots":344,"ratio":7.2,"listSlotBytes":8,"note":"plus the shared int object"}},"throughput":{"operations":2000000,"workload":"data-dependent push/pop, 55% pushes","rows":[{"impl":"linked list, new/delete per node","nsPerOp":14.5},{"impl":"linked list, free list","nsPerOp":3.9},{"impl":"std::vector, reserved","nsPerOp":3.7}],"freeListSpeedup":3.69,"finding":"the penalty was the ALLOCATOR, not pointer traversal — the pointers cost almost nothing when the nodes are hot in cache","freeListCost":"memory is retained rather than returned, so a stack that peaks large and drains keeps the peak"},"worstCaseLatency":{"pushes":4000000,"runs":[{"vector":690292,"list":40375,"ratio":17.1},{"vector":632375,"list":45167,"ratio":14.0},{"vector":253375,"list":39875,"ratio":6.4}],"vectorWorstAlwaysAt":2097152,"whichIs":"2^21, a reallocation boundary","whatHappensThere":"a new array is allocated and two million integers are copied — O(n) work inside a supposedly O(1) call","honestCaveat":"40us is not O(1) either; it is an allocator asking the operating system for memory","whyItStillMatters":"the list's spike does not grow with the stack and the vector's does","freeListWorstCase":{"plain":45834,"pooled":25625}},"fragmentation":{"nodes":2000000,"consecutivelyAllocated":{"totalNs":3232541,"perNodeNs":1.6},"scattered":{"totalNs":92521708,"perNodeNs":46.3},"ratio":28.62,"why":"each node is a dependent load — the address of the next is unknown until the current one arrives, so a cache miss cannot be overlapped","arrayContrast":"a contiguous walk has no such dependency and prefetches perfectly","hiddenBy":"any benchmark that allocates its nodes in a tight loop, which is why it is measured separately"},"wrongEnd":{"idea":"push at the tail instead","pushWithTailPointer":"O(1)","popAlways":"O(n)","why":"a singly linked list cannot step backwards, so reaching the second-to-last node is a full traversal","fix":"a doubly linked list, at 24 bytes per node instead of 16","lesson":"the head is cheap for both operations; the tail is cheap for at most one"},"python":{"operations":200000,"linkedNsPerOp":708,"listNsPerOp":636,"ratio":1.11,"why":"interpreter overhead swamps both","recursionLimit":1000,"recursionNote":"a linked list invites recursive traversal, and a recursive walk of a 10,000-node stack overflows where the iterative one is fine"},"recommendation":{"default":"the array-backed container — 4x less memory, contiguous traversal, 3.7ns per operation","chooseLinkedWhen":["a single slow operation is unacceptable and the latency budget is tight","nodes are shared with or spliced into other structures"],"avoid":"std::list for a stack, and java.util.LinkedList as a drop-in Deque — a doubly linked node for a structure that never walks backwards"}}
```

<!-- @highlights -->
- The queue-backed stack from the previous subtopic runs on the left, captioned "the structure fought the interface".
- On the right a linked list shows push as one new node and one redrawn arrow, captioned "one cheap end, and a stack only needs one".
- Each node is drawn as a box split into a value cell and a pointer cell.
- Every push animates in three beats: the node appears, its pointer is aimed at the current head, then the head arrow swings.
- That ordering mirrors the code, so it is shown as three distinct steps rather than one motion.
- pop highlights the head, lifts its value out, swings the head arrow, and only then fades the old node.
- Showing the fade before the arrow move triggers a red flash labelled "use after free".
- A node is drawn to scale at 16 bytes with 4 shaded as payload, beside a 4-byte array cell, with 4x between them.
- The Python row adds 48 bytes with __slots__ and 344 without, the second running off the panel.
- Two timelines of 4,000,000 pushes show the vector flat with one enormous spike at element 2,097,152, annotated 690,292ns.
- The linked list's timeline is flat with small ripples topping out at 40,375ns.
- A horizontal latency-budget line crosses the spike and clears the ripples.
- Bars for 14.5ns and 3.7ns are joined by a third at 3.9ns labelled "free list", captioned "the pointers were never the problem".
- Two equal-length lists are drawn over a memory map, one adjacent and one scattered.
- The traversal arrow moves smoothly across the first and jumps erratically across the second, marking each cache miss.
- Per-node cost meters settle at 1.6ns and 46.3ns.

<!-- @edgeCases -->
- An empty stack — head is null, so pop and top must check before dereferencing; there is no index to go negative, only a null to follow.
- A single element — pop leaves head null, and any tail pointer must be cleared too or it dangles.
- Freeing the node before advancing head — reading old->next afterwards is a use-after-free that usually appears to work.
- Forgetting the destructor — every node leaks, unlike the array version which owned a single block.
- A non-static inner Node class in Java — each node silently carries a reference to the enclosing stack and keeps it alive.
- Pushing at the tail — O(n) pop for a singly linked list, whatever pointers are kept, because it cannot step backwards.
- Counting size by walking — O(n); keep a counter, since a linked list has no length of its own.
- Recursive traversal in Python — the default recursion limit is 1,000, so a 10,000-node stack overflows.
- Omitting __slots__ in Python — 344 bytes per node against 48, a factor of 7.2.
- A free list that is never bounded — memory peaks are retained for the life of the stack rather than returned.
- Comparing nodes with != rather than is not in Python — invokes __eq__ and compares values instead of identity.

<!-- @pitfalls -->
- Advancing head after freeing the old node. Reading old->next post-free is undefined and usually appears to work, which is what makes it dangerous.
- Pushing at the tail of a singly linked list. Push stays O(1) with a tail pointer and pop becomes O(n), because the second-to-last node cannot be reached backwards.
- Blaming pointer chasing for the throughput gap. A free list cut it from 14.5ns to 3.9ns per operation, level with the vector — the cost was allocation.
- Benchmarking a linked list with nodes allocated in a tight loop. That layout costs 1.6ns per node; a realistically scattered one costs 46.3ns, a factor of 28.62.
- Using a node pool in Java by reflex. The young-generation collector handles short-lived nodes almost for free, and a pool promotes them into the old generation instead.
- Reaching for std::list because the problem says "linked". It is 3.96x slower before fragmentation and much worse after; std::vector is the stack.
- Swapping ArrayDeque for java.util.LinkedList as a Deque. It is a drop-in change with no visible difference that turns a contiguous stack into a doubly linked one at 24 bytes per node.
- Omitting __slots__ on a Python node class. 344 bytes per node against 48, for a structure whose entire purpose is to hold two fields.
- Walking the list to compute size. Keep a counter; a linked list has no length and counting is O(n).
- Declaring the linked version O(1) and the array version O(1) without qualification. One is worst case and the other is amortised, and the measured difference in the slowest single push is 690,292ns against 40,375ns.
- Claiming the linked list has bounded push latency. Its worst measured push was still 40µs, an allocator slow path — smaller than the vector's spike and not a constant.
- Forgetting to null a tail pointer when the last element is popped. It only triggers when the stack empties, so it survives most tests.

<!-- @doubt -->
### Why is this so much easier than building a stack from a queue?

<!-- @answer -->
Because the structure already has the shape the interface wants. A stack touches exactly one end, and a singly linked list has exactly one end it can reach immediately — the head. Push makes a new node point at the old head and moves the head; pop follows the head's pointer one step and releases the node. Neither depends on how many elements are behind them. The previous subtopic had to reverse a queue's order on every push because a queue offers its oldest element and a stack wants its newest; here there is nothing to reverse.

<!-- @doubt -->
### Is O(1) worst case actually worth anything?

<!-- @answer -->
It is the only thing the linked version wins, and it is measurable. Timing all 4,000,000 pushes individually, the growing vector's slowest was 690,292ns — occurring at element 2,097,152, exactly 2^21, where it allocated a new array and copied two million integers. The linked list's slowest was 40,375ns, and repeating gave 45,167ns and 39,875ns. So the spike is 6.4x to 17.1x smaller and, crucially, does not grow with the stack. If nothing in your program cares about a single 0.7ms pause, this buys you nothing; if you have a latency budget, it is the whole argument.

<!-- @doubt -->
### So is the linked list's push truly constant time?

<!-- @answer -->
No, and it is worth being precise rather than repeating the textbook claim. The measured worst-case push was about 40µs, which is not a constant number of instructions — it is the allocator occasionally going to the operating system for more memory. What is true is that the spike does not depend on how many elements the stack holds, whereas the vector's does: its reallocation copies n elements. A free list improves the linked list's worst case further, to 25,625ns, by removing the allocator from most pushes. Neither structure gives a hard bound; one degrades with size and the other does not.

<!-- @doubt -->
### Why is it 3.96x slower if every operation is O(1)?

<!-- @answer -->
Because O(1) says nothing about the constant, and here the constant is an allocation. Over 2,000,000 operations the plain linked stack cost 14.5ns each against a reserved vector's 3.7ns. Replacing new and delete with a free list — popped nodes are chained onto a spare list and reused — brought it to 3.9ns, within 6% of the vector. That is the useful finding: the pointers themselves cost almost nothing when the nodes are cache-resident, and essentially the entire gap was the allocator. It also means the usual explanation, pointer chasing, is wrong for this workload.

<!-- @doubt -->
### When does pointer chasing actually hurt?

<!-- @answer -->
When the nodes are not adjacent, which is the normal state of a long-lived structure. Building a list in a tight loop leaves its nodes consecutive in memory, and walking two million of them cost 1.6ns each. Shuffling the nodes before linking them — modelling a stack whose nodes are interleaved with everything else the program allocated — pushed that to 46.3ns each, a factor of 28.62. The cause is that each node is a dependent load: the address of the next is unknown until the current one arrives, so the cache miss cannot be overlapped. An array has no such dependency and prefetches perfectly.

<!-- @doubt -->
### Why not push at the tail?

<!-- @answer -->
Because a singly linked list cannot step backwards. With a tail pointer, appending is O(1) and the design looks fine — until pop has to remove the last node, which needs the node before it, which needs a full traversal from the head. So push is O(1) and pop is O(n), for a structure whose whole appeal was that both were O(1) at the head. A doubly linked list fixes it by storing a previous pointer, at 24 bytes per node instead of 16 — paying 8 extra bytes per element to buy back what the head was already giving away.

<!-- @doubt -->
### How much memory does this really cost?

<!-- @answer -->
In C++, 16 bytes per node for a 4-byte payload — a value, a pointer, and alignment padding — against 4 bytes per element in an array, so 4x, before the allocator's own per-block bookkeeping. In Python it is worse and more variable: a node class with __slots__ measured 48 bytes, and the same class without __slots__ measured 344 bytes once its instance dictionary is counted, a factor of 7.2. A list slot is 8 bytes plus the shared integer object. If you write a linked node class in Python, __slots__ is not an optimisation, it is the difference between reasonable and absurd.

<!-- @doubt -->
### Should I use a free list?

<!-- @answer -->
In C++, when the throughput matters — it measured 3.69x faster and brought the linked stack level with std::vector. In Java, usually not: the young-generation collector is built for exactly the short-lived garbage that a node stack produces, and pooling promotes those nodes into the old generation where collection is far more expensive. In both languages the cost is that memory is held rather than returned, so a stack that peaks at a million nodes and then drains keeps that million allocated for its lifetime. Bound the pool if the peak is much larger than the steady state.

<!-- @doubt -->
### Which should I actually use for a stack?

<!-- @answer -->
The array-backed container, unless you need the worst-case guarantee. It uses a quarter of the memory, traverses contiguously at 1.6ns per element rather than 46.3ns once the nodes scatter, and costs 3.7ns per operation against the naive linked list's 14.5ns. Reach for the linked version when a single slow operation is unacceptable, or when the nodes are shared with or spliced into other structures. And avoid std::list and java.util.LinkedList specifically: both are doubly linked, so they pay for a backward pointer that a stack will never follow.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Balanced Paranthesis, which is the first subtopic here that uses a stack rather than building one — and it is the canonical justification for the structure. When scanning text, the most recently opened bracket is always the next one that has to close, which is last-in-first-out expressed as a rule about syntax. After three subtopics of implementation, it is where the interface starts earning its keep.
