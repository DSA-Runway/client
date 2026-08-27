---
id: lru-cache
topic: Queues
title: LRU Cache
difficulty: Medium
status: ready
prerequisites:
  - implement-queue-using-linkedlist
  - introduction-to-doubly-ll
  - two-sum
  - time-and-space-complexity-basics
relatedIds:
  - implement-queue-using-linkedlist
  - lfu-cache
  - introduction-to-doubly-ll
  - two-sum
  - sliding-window-maximum
---

<!-- @summary -->
The subtopic where the doubly linked list finally earns the 4x memory the previous one measured: a hash map finds the node, and only a `prev` pointer lets you unlink it from the middle. Drop to a singly linked list and the walk costs **778 nodes per operation** at capacity 2,000, where the doubly linked version is flat at every capacity. But the measurements that matter are about the policy rather than the pointers. Forget to promote on `get` and your LRU is silently a FIFO, worth **10.34 points** of hit rate on a realistic workload. And LRU has a case where it returns **0.00%** — a sequential loop just larger than the cache — while random eviction gets 20.30% on the identical trace.

<!-- @theory -->
## The problem

A fixed-capacity map where both operations are O(1):

- `get(key)` — return the value, or −1, and mark the key most recently used.
- `put(key, value)` — insert or update, and if that exceeds capacity, evict the
  **least** recently used key.

Two requirements pull in opposite directions. Finding a key by name wants a hash
map. Knowing which key is oldest wants an ordering. Neither structure does both,
so the answer is both structures, sharing their nodes.

## Why the list has to be doubly linked

The hash map maps a key to its node in constant time. Then you need to move that
node to the front — which means unlinking it from wherever it currently sits, in
the *middle* of the list.

**Implement queue using Linkedlist** measured exactly this limitation: a singly
linked list lets you append after a node you hold, but never unlink it, because
unlinking needs the `next` of the node *before* it and there is no way back. A
queue never needed that; this does, on every single `get`.

Measured — 40,000 operations, keys drawn from twice the capacity:

| capacity | nodes walked | per operation | singly | doubly | ratio |
|---|---|---|---|---|---|
| 125 | 2,187,052 | 54.7 | 3,266,458ns | 1,166,292ns | 2.8x |
| 250 | 4,358,366 | 109.0 | 5,207,750ns | 1,145,541ns | 4.5x |
| 500 | 8,626,302 | 215.7 | 9,059,250ns | 1,165,500ns | 7.8x |
| 1,000 | 16,738,993 | 418.5 | 16,404,500ns | 1,163,834ns | 14.1x |
| 2,000 | **31,121,189** | **778.0** | 29,669,542ns | **1,230,542ns** | **24.1x** |

The walk doubles with the capacity, exactly, and the doubly linked column does
not move at all — 1.17ms at every size. That flat column is the whole argument
for the `prev` pointer, and it is why this is the subtopic where the extra 8
bytes per node stops being waste.

## The two sentinels

A `head` and a `tail` node that never hold data, permanently present:

```
head <-> [ 3 ] <-> [ 1 ] <-> [ 7 ] <-> tail
          MRU                  LRU
```

They cost two nodes and remove every null check. `unlink` becomes two
unconditional writes rather than four branches for "is this the first node? the
last? the only one?". The eviction victim is always `tail->prev`, and it is
always a real node when the map is non-empty. Skipping them is the single largest
source of bugs in hand-written LRU caches, and they are not an optimisation —
they are what makes the code short enough to be obviously right.

## The policy, which is the actual subject

Everything above is machinery. What LRU *is* is a guess: **the key used longest
ago is the one least likely to be needed next.** That guess can be measured.

200,000 accesses, hit rates against FIFO, random eviction, LFU, and Belady's
offline optimum — which cheats by knowing the future and is the ceiling nothing
online can beat:

| workload | cap | LRU | FIFO | random | LFU | **OPT** |
|---|---|---|---|---|---|---|
| Zipf α=1.0, 10k keys | 100 | 39.90% | 35.11% | 35.11% | **50.76%** | 59.04% |
| Zipf α=1.0, 10k keys | 1,000 | 68.75% | 64.30% | 64.41% | **74.30%** | 82.08% |
| uniform, 10k keys | 100 | **0.99%** | **0.99%** | 0.96% | 1.03% | 12.98% |
| sequential loop, 1k keys | 500 | **0.00%** | 0.00% | **20.30%** | **0.00%** | 49.75% |
| 80% hot(200) + scan | 500 | 79.75% | 69.41% | 69.55% | **79.94%** | 80.98% |

Four things worth reading off that table.

**LRU beats FIFO whenever there is locality**, by 4.79 points on Zipf and
**10.34** on the hot-set-plus-scan workload. That gap is exactly what promoting
on `get` buys, and it is the entire reason for the doubly linked list.

**Under uniform access it buys nothing** — 0.99% against FIFO's 0.99%. With no
locality there is nothing to exploit, and all the machinery is pure overhead.

**LRU has a pathological case, and it is not obscure.** A sequential loop over
1,000 keys with capacity 500 gives LRU **0.00%** — every key is evicted precisely
before it is next needed. Random eviction, which knows nothing, gets **20.30%**
on the identical trace. LFU does *not* rescue it: on a loop every key has the same
frequency, so LFU's tie-break decides everything, and the canonical tie-break is
least-recently-used — which makes LFU behave exactly like LRU and score **0.00%**
too. This is the scan-resistance problem, and it is why real caches are usually
neither plain LRU nor plain LFU.

**Even at its best it is well short of optimal** — 0.676 of OPT on Zipf at
capacity 100, rising to 0.985 on the workload it suits. Belady is unachievable
online, but it is the honest scale.

## What it costs

2,000,000 operations at capacity 4,096, 60% `get`, median of five runs:

| | per operation | share |
|---|---|---|
| hash lookups alone, no recency at all | **16.24ns** | 30% |
| hash map + doubly linked list, nodes pooled | 28.42ns | — |
| hash map + doubly linked list, `new`/`delete` | 54.39ns | — |
| `unordered_map` + `std::list` with `splice` | 54.46ns | — |

Two conclusions, and the first one surprised me.

**Hand-writing the doubly linked list buys nothing.** 54.39ns against `std::list`'s
54.46ns — a 0.1% difference. `splice` performs exactly the same six pointer
writes, in the same order, with no copy.

**Unless you also pool the nodes**, which `std::list` will not let you do. Keeping
freed nodes on a spare chain instead of calling `delete` took 54.39ns to
**28.42ns** — **1.91x**, and it means allocation was **48%** of the total cost.
That is the same finding **Implement queue using Linkedlist** reached, where a
free list was worth 3.35x; here it is worth less because the hash map is also
paying, but it is still the largest single cost in the structure.

Note what that leaves: the pointer surgery everyone worries about is
28.42 − 16.24 = **12.18ns**, or 22% of the operation. The hash map is 30%. The
allocator is the rest.

## Python

300,000 operations at capacity 4,096:

| | per operation | vs `OrderedDict` |
|---|---|---|
| **`OrderedDict.move_to_end`** | **135ns** | 1.00x |
| dict + hand-rolled doubly linked list | 193ns | 1.43x |
| plain dict, pop and re-insert | 377ns | **2.79x** |

`OrderedDict` wins outright, and it is not close. It *is* a hash map plus a
doubly linked list — the same design, with the relinking done in C — so the
hand-rolled version is the identical algorithm running one interpreted attribute
access at a time.

The third row is the trap. Since Python 3.7 a plain `dict` preserves insertion
order, so "pop the key and re-insert it" looks like a free `move_to_end`. It is
the **slowest** option measured, at 2.79x, because every promotion is a delete
and an insert into the hash table rather than two pointer writes, and the table
periodically compacts to reclaim the deleted slots.

Memory agrees, by `tracemalloc` over 200,000 entries: 137.4 bytes per entry for
`OrderedDict` against 148.4 for the hand-rolled version.

For memoisation specifically, `functools.lru_cache` is faster still at **128ns**
per call — it is the same policy implemented entirely in C — but it caches
function results keyed on arguments and gives you no `put`, so it is a different
interface rather than a faster cache.

## Where this goes next

**LFU Cache** replaces "used longest ago" with "used fewest times", and the table
above shows both why that is worth the trouble and where it stops helping. LFU
beat LRU wherever frequencies actually differ — **50.76%** against 39.90% on Zipf
at capacity 100 — and tied it exactly on the sequential loop, because there every
key has the same frequency and the tie-break does all the work. The cost is that
frequency needs its own ordering structure, which is a harder problem than this
one.

<!-- @intuition -->
Two requirements pull against each other: finding a key by name wants a hash map, and knowing which key is oldest wants an ordering. Neither structure does both, so you use both and let them share their nodes — the map holds pointers into a list that keeps everything in recency order, most recent at the front. Then every operation is a lookup followed by a move-to-front, and the only question is whether that move is cheap. It is cheap exactly when the list is doubly linked, because unlinking a node from the middle needs the node before it, and only a prev pointer hands you that in constant time. That is the whole reason this structure earns memory the previous subtopic called waste. What is easy to miss is that all of this is machinery in service of a guess — that the key used longest ago is the one least likely to be needed next — and the guess is worth measuring rather than assuming. It pays well when accesses cluster, pays nothing at all when they are uniform, and on a sequential loop slightly larger than the cache it is beaten by evicting at random, because LRU throws out each key precisely before it comes round again.

<!-- @approach -->
### Brute Force - A List in Recency Order

<!-- @idea -->
Keep the entries in one array ordered by recency, scanning it to find a key and moving the hit to the front.

<!-- @steps -->
1. Store key/value pairs in a list with the most recent at the front.
2. To `get`, scan from the front for the key.
3. On a hit, erase it from its position and re-insert it at the front.
4. To `put`, remove any existing entry for the key, then insert at the front.
5. If the list now exceeds capacity, drop the last element.
6. That last element is the least recently used, by construction.

<!-- @complexity -->
- time: **O(n)** for both operations, where n is the capacity
- space: O(n)
- note: Obviously correct and useless at scale — which is why it makes a good model. Every measurement in this container was verified against it: **240,355 gets checked over 400,000 random operations, zero mismatches**. The cost is the scan *and* the shift; an array insert at the front moves every element, which is the same `n(n-1)/2` behaviour **Implement Queue using Arrays** measured for shifting on dequeue.

<!-- @code cpp -->
```cpp
class ModelLRU {
    int cap;
    vector<pair<int,int>> v;                 // front = most recently used

public:
    explicit ModelLRU(int c) : cap(c) {}

    int get(int k) {
        for (size_t i = 0; i < v.size(); i++)
            if (v[i].first == k) {
                auto e = v[i];
                v.erase(v.begin() + i);
                v.insert(v.begin(), e);
                return e.second;
            }
        return -1;
    }

    void put(int k, int val) {
        for (size_t i = 0; i < v.size(); i++)
            if (v[i].first == k) { v.erase(v.begin() + i); break; }
        v.insert(v.begin(), {k, val});
        if ((int)v.size() > cap) v.pop_back();
    }
};
```

<!-- @annotations -->
- 9: The linear scan. Everything the rest of this container builds is a way to replace this one loop with a hash lookup.
- 13: And the shift — `insert` at the front moves every element after it, so a hit costs O(n) even once it has been found.
- 23: Eviction is trivial here: the last element is the oldest, so `pop_back` is the whole policy.

<!-- @code java -->
```java
class ModelLRU {
    private final int cap;
    private final List<int[]> v = new ArrayList<>();

    ModelLRU(int c) { cap = c; }

    int get(int k) {
        for (int i = 0; i < v.size(); i++)
            if (v.get(i)[0] == k) { int[] e = v.remove(i); v.add(0, e); return e[1]; }
        return -1;
    }

    void put(int k, int val) {
        for (int i = 0; i < v.size(); i++)
            if (v.get(i)[0] == k) { v.remove(i); break; }
        v.add(0, new int[]{k, val});
        if (v.size() > cap) v.remove(v.size() - 1);
    }
}
```

<!-- @annotations -->
- 16: `add(0, ...)` is `System.arraycopy` of the whole list — the same hidden O(n) that `ArrayList.remove(0)` was in the array-queue subtopic.

<!-- @code python -->
```python
class ModelLRU:
    def __init__(self, cap):
        self.cap = cap
        self.v = []                          # front = most recently used

    def get(self, k):
        for i, (key, val) in enumerate(self.v):
            if key == k:
                self.v.pop(i)
                self.v.insert(0, (key, val))
                return val
        return -1

    def put(self, k, val):
        for i, (key, _) in enumerate(self.v):
            if key == k:
                self.v.pop(i)
                break
        self.v.insert(0, (k, val))
        if len(self.v) > self.cap:
            self.v.pop()
```

<!-- @annotations -->
- 10: `insert(0, ...)` is the O(n) front insert, the mirror of the `pop(0)` measured at 171,417ns on a million-element list two subtopics ago.

<!-- @approach -->
### The Singly Linked Trap - Hash Map and One Pointer

<!-- @idea -->
Add a hash map so the node is found instantly — and discover that finding it is not the same as being able to move it.

<!-- @steps -->
1. Keep a hash map from key to node, and a singly linked list in recency order.
2. To `get`, look the node up in O(1).
3. To move it to the front, unlink it — which needs the node *before* it.
4. A singly linked list offers no way back, so walk from the head to find it.
5. Relink the node at the front.
6. To evict, find the predecessor of the tail the same way.

<!-- @complexity -->
- time: O(1) lookup, **O(capacity)** to move or evict
- space: O(n)
- note: The instructive failure. The hash map does its job perfectly and the structure is still not O(1), because the bottleneck moved from *finding* the node to *unlinking* it. Measured over 40,000 operations, the walk is exactly linear in the capacity — 54.7 nodes per operation at capacity 125 and **778.0** at capacity 2,000 — while the doubly linked version stayed flat at 1.17ms for every capacity tested. The ratio grows without bound: 2.8x at capacity 125, **24.1x** at 2,000.

<!-- @code cpp -->
```cpp
struct SNode { int key, val; SNode* next; };

class SinglyLRU {
    int cap;
    unordered_map<int, SNode*> map;
    SNode *head = nullptr, *tail = nullptr;

    void moveToFront(SNode* n) {
        if (head == n) return;
        SNode* prev = head;
        while (prev->next != n) prev = prev->next;
        prev->next = n->next;
        if (tail == n) tail = prev;
        n->next = head;
        head = n;
    }

public:
    explicit SinglyLRU(int c) : cap(c) {}

    int get(int k) {
        auto it = map.find(k);
        if (it == map.end()) return -1;
        moveToFront(it->second);
        return it->second->val;
    }
};
```

<!-- @annotations -->
- 11: The walk, and the whole point of this approach. The hash map found the node in O(1) and it does not help, because unlinking needs the node before it.
- 22: `map.find` really is constant time — the structure is not slow because the lookup is slow, which is what makes this failure worth showing.
- 13: Maintaining `tail` is necessary and insufficient. Holding a pointer to the last node still does not let you remove it, exactly as the previous subtopic measured.

<!-- @code java -->
```java
private void moveToFront(SNode n) {
    if (head == n) return;
    SNode prev = head;
    while (prev.next != n) prev = prev.next;      // O(capacity)
    prev.next = n.next;
    if (tail == n) tail = prev;
    n.next = head;
    head = n;
}
```

<!-- @annotations -->
- 4: One `prev` field per node removes this loop entirely. That is 8 more bytes a node, and it is the trade the next approach makes.

<!-- @code python -->
```python
def _move_to_front(self, n):
    if self._head is n:
        return
    prev = self._head
    while prev.next is not n:                     # O(capacity)
        prev = prev.next
    prev.next = n.next
    if self._tail is n:
        self._tail = prev
    n.next = self._head
    self._head = n
```

<!-- @annotations -->
- 5: An interpreted walk of up to `capacity` nodes on every hit, which is the worst possible version of an already-wrong design.

<!-- @approach -->
### Optimal - Hash Map and a Doubly Linked List

<!-- @idea -->
Give every node a `prev` pointer so it can unlink itself, and bracket the list with two sentinel nodes so there are no edge cases.

<!-- @steps -->
1. Keep a hash map from key to node, and a doubly linked list in recency order.
2. Bracket the list with `head` and `tail` sentinels that never hold data.
3. To `get`, look up the node; if absent return −1.
4. Unlink it — two writes, using its own `prev` and `next` — and push it after `head`.
5. To `put` an existing key, update the value and promote it the same way.
6. To `put` a new key at capacity, take `tail->prev` as the victim, unlink it, and **erase it from the map**.
7. Allocate the new node, push it after `head`, and record it in the map.

<!-- @complexity -->
- time: O(1) for `get` and `put`, worst case
- space: O(n), at a node of key, value and two pointers, plus the map entry
- note: The answer. Verified against the O(n) model over 400,000 operations with 240,355 gets compared and **zero mismatches**, and flat at every capacity tested where the singly linked version rose to 778 nodes walked per operation. Step 4 is not optional bookkeeping — omit the promotion and the policy silently becomes FIFO, measured at **10.34 points** of hit rate on a realistic workload. Step 6's map erase is the other one: skip it and the map grows without bound while the list stays at capacity.

<!-- @code cpp -->
```cpp
struct Node { int key, val; Node *prev, *next; };

class LRUCache {
    int cap;
    unordered_map<int, Node*> map;
    Node *head, *tail;                       // sentinels; they never hold data

    void unlink(Node* n) {
        n->prev->next = n->next;
        n->next->prev = n->prev;
    }
    void pushFront(Node* n) {
        n->next = head->next;
        n->prev = head;
        head->next->prev = n;
        head->next = n;
    }

public:
    explicit LRUCache(int capacity) : cap(capacity) {
        head = new Node{0, 0, nullptr, nullptr};
        tail = new Node{0, 0, nullptr, nullptr};
        head->next = tail;
        tail->prev = head;
    }

    int get(int key) {
        auto it = map.find(key);
        if (it == map.end()) return -1;
        unlink(it->second);
        pushFront(it->second);
        return it->second->val;
    }

    void put(int key, int value) {
        auto it = map.find(key);
        if (it != map.end()) {
            it->second->val = value;
            unlink(it->second);
            pushFront(it->second);
            return;
        }
        if ((int)map.size() == cap) {
            Node* lru = tail->prev;
            unlink(lru);
            map.erase(lru->key);
            delete lru;
        }
        Node* n = new Node{key, value, nullptr, nullptr};
        pushFront(n);
        map[key] = n;
    }
};
```

<!-- @annotations -->
- 6: Two nodes that hold no data and remove every null check. Without them `unlink` needs four branches for first / last / only / middle, which is where hand-written LRU caches go wrong.
- 9: Two unconditional writes, and the reason the list is doubly linked — `n->prev` is the thing a singly linked list cannot give you.
- 24: The empty invariant, established once in the constructor and never special-cased again. `tail->prev == head` means empty.
- 30: Promotion on `get`. Delete these two lines and the cache still works, still passes a correctness test, and quietly becomes a FIFO — worth 10.34 points of hit rate.
- 46: Erasing from the map as well as the list. Forget it and the map keeps every key ever inserted while the list stays at capacity, so lookups start returning freed nodes.
- 44: The victim is always `tail->prev`, and it is always a real node when the map is non-empty — another edge case the sentinels removed.

<!-- @code java -->
```java
class LRUCache {
    private static class Node {
        int key, val; Node prev, next;
        Node(int k, int v) { key = k; val = v; }
    }
    private final int cap;
    private final Map<Integer, Node> map = new HashMap<>();
    private final Node head = new Node(0, 0), tail = new Node(0, 0);

    LRUCache(int capacity) { cap = capacity; head.next = tail; tail.prev = head; }

    private void unlink(Node n) { n.prev.next = n.next; n.next.prev = n.prev; }
    private void pushFront(Node n) {
        n.next = head.next; n.prev = head;
        head.next.prev = n; head.next = n;
    }

    public int get(int key) {
        Node n = map.get(key);
        if (n == null) return -1;
        unlink(n); pushFront(n);
        return n.val;
    }

    public void put(int key, int value) {
        Node n = map.get(key);
        if (n != null) { n.val = value; unlink(n); pushFront(n); return; }
        if (map.size() == cap) { Node lru = tail.prev; unlink(lru); map.remove(lru.key); }
        n = new Node(key, value);
        pushFront(n); map.put(key, n);
    }
}
```

<!-- @annotations -->
- 28: `map.remove` matters more under a garbage collector, not less — a map entry still pointing at an evicted node keeps that node alive, so the leak is silent rather than dangling.
- 1: `LinkedHashMap` with `accessOrder = true` is this entire class, built in; overriding `removeEldestEntry` gives the eviction. Write this one to show the mechanism, use that one in production.

<!-- @code python -->
```python
class Node:
    __slots__ = ("key", "val", "prev", "next")
    def __init__(self, key=0, val=0):
        self.key = key
        self.val = val
        self.prev = None
        self.next = None


class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.map = {}
        self.head = Node()
        self.tail = Node()
        self.head.next = self.tail
        self.tail.prev = self.head

    def _unlink(self, n):
        n.prev.next = n.next
        n.next.prev = n.prev

    def _push_front(self, n):
        n.next = self.head.next
        n.prev = self.head
        self.head.next.prev = n
        self.head.next = n

    def get(self, key):
        n = self.map.get(key)
        if n is None:
            return -1
        self._unlink(n)
        self._push_front(n)
        return n.val

    def put(self, key, value):
        n = self.map.get(key)
        if n is not None:
            n.val = value
            self._unlink(n)
            self._push_front(n)
            return
        if len(self.map) == self.cap:
            lru = self.tail.prev
            self._unlink(lru)
            del self.map[lru.key]
        n = Node(key, value)
        self._push_front(n)
        self.map[key] = n
```

<!-- @annotations -->
- 20: Correct, and **1.43x slower than `OrderedDict`** — 193ns per operation against 135ns. `OrderedDict` is this exact structure with the relinking done in C.
- 47: `del self.map[lru.key]` is why the node carries its `key` at all. Without that field you hold the node to evict and cannot say which map entry to remove.

<!-- @approach -->
### Reducing the Cost - Pool the Nodes

<!-- @idea -->
Keep evicted nodes on a spare chain and reuse them, so a cache at capacity never calls the allocator again.

<!-- @steps -->
1. Keep a pointer to a chain of unused nodes.
2. On eviction, unlink the victim and push it onto that chain instead of freeing it.
3. On insertion, take a node from the chain if one is available.
4. Allocate only when the chain is empty, which stops happening once the cache is full.
5. Overwrite the key and value and link it at the front as usual.

<!-- @complexity -->
- time: O(1), with the allocator removed from the steady-state path
- space: O(capacity) nodes, allocated once and never returned
- note: Worth **1.91x** — 54.39ns per operation falls to **28.42ns** — which means allocation was **48%** of the total cost of the structure. This is the same edit **Implement queue using Linkedlist** measured at 3.35x; it is worth less here only because the hash map is paying too. It also cannot be done with `std::list`, which owns its own nodes, and that is the one concrete reason to hand-write the list rather than use the library.

<!-- @code cpp -->
```cpp
Node* pool = nullptr;

Node* take(int k, int v) {
    Node* n;
    if (pool) { n = pool; pool = pool->next; }
    else        n = new Node;
    n->key = k; n->val = v;
    return n;
}

void give(Node* n) { n->next = pool; pool = n; }
```

<!-- @annotations -->
- 5: After the cache first reaches capacity, every eviction feeds an insertion, so this branch stops being taken and `new` is never called again.
- 11: The spare chain reuses only `next`, so a recycled node needs no cleanup — `pushFront` overwrites both pointers anyway.

<!-- @code java -->
```java
// A pool is rarely worth it in Java: allocation is a pointer bump and
// short-lived nodes die in the young generation. Reuse the Node object
// on an update instead, which is where the real garbage comes from.
Node n = map.get(key);
if (n != null) { n.val = value; unlink(n); pushFront(n); return; }
```

<!-- @annotations -->
- 5: The important reuse in Java — updating an existing key must mutate the node rather than replacing it, or every `put` to a hot key allocates.

<!-- @code python -->
```python
def _take(self, key, val):
    n = self._pool
    if n is not None:
        self._pool = n.next
        n.key = key
        n.val = val
        return n
    return Node(key, val)
```

<!-- @annotations -->
- 3: Saves the object construction and adds three interpreted attribute accesses. It did not pay in the linked-queue subtopic and it does not pay here — the answer in Python is `OrderedDict`, not a better hand-rolled node.

<!-- @approach -->
### Optimal in Practice - Use the Language's Ordered Map

<!-- @idea -->
Every major standard library already contains a hash map wired to a doubly linked list; reach for it unless the exercise is the point.

<!-- @steps -->
1. In Python, use `collections.OrderedDict` with `move_to_end`, or `functools.lru_cache` for memoisation.
2. In Java, use `LinkedHashMap` with `accessOrder = true` and override `removeEldestEntry`.
3. In C++ there is no such container, so combine `unordered_map` with `std::list` and `splice`.

<!-- @complexity -->
- time: O(1) amortised per operation
- space: O(n)
- note: In Python the library version is simply faster — **135ns** against the hand-rolled 193ns, and less memory too (137.4 bytes per entry against 148.4). In C++ it is a dead heat: `unordered_map` plus `std::list` measured **54.46ns** against a hand-written 54.39ns, because `splice` performs the identical pointer surgery. The hand-written version only pulls ahead once nodes are pooled, which `std::list` does not permit.

<!-- @code cpp -->
```cpp
#include <list>
#include <unordered_map>

list<pair<int,int>> order;                                  // front = most recent
unordered_map<int, list<pair<int,int>>::iterator> map;

// promote an existing entry -- no copy, no allocation
order.splice(order.begin(), order, map[key]);

// evict
map.erase(order.back().first);
order.pop_back();
```

<!-- @annotations -->
- 8: `splice` relinks the node in place and **keeps iterators valid**, which is what makes storing an iterator in the map sound. `erase` plus `push_front` would invalidate it and is also two allocations.

<!-- @code java -->
```java
Map<Integer,Integer> cache = new LinkedHashMap<>(16, 0.75f, true) {
    protected boolean removeEldestEntry(Map.Entry<Integer,Integer> eldest) {
        return size() > capacity;
    }
};
```

<!-- @annotations -->
- 1: The third constructor argument is `accessOrder`. Leave it out and you get insertion order — which is a FIFO cache, the exact bug this subtopic measures at 10.34 points of hit rate.

<!-- @code python -->
```python
from collections import OrderedDict

class LRUCache:
    def __init__(self, capacity):
        self.cap = capacity
        self.d = OrderedDict()

    def get(self, key):
        if key not in self.d:
            return -1
        self.d.move_to_end(key)                  # to the end = most recent
        return self.d[key]

    def put(self, key, value):
        if key in self.d:
            self.d.move_to_end(key)
        elif len(self.d) == self.cap:
            self.d.popitem(last=False)           # pop the least recent
        self.d[key] = value
```

<!-- @annotations -->
- 11: One C-level call that relinks the entry in `OrderedDict`'s internal doubly linked list — the same six pointer writes, without the interpreter.
- 18: `last=False` pops from the *other* end. Getting this backwards evicts the most recently used key, which is the worst possible policy and still passes a naive test.

<!-- @example -->

<!-- @input -->
`capacity = 2`, then: `put(1,1)`, `put(2,2)`, `get(1)`, `put(3,3)`, `get(2)`, `put(4,4)`, `get(1)`, `get(3)`, `get(4)`

<!-- @output -->
`1`, then `-1`, then `-1`, `3`, `4`

<!-- @why -->
The smallest trace in which a `get` changes which key is later evicted.

<!-- @walkthrough -->
1. `put(1,1)` and `put(2,2)` fill the cache; the list reads `2, 1` from most to least recent.
2. `get(1)` returns 1 **and promotes it**, so the list becomes `1, 2` — this is the step the whole structure exists for.
3. `put(3,3)` is over capacity, so the victim is `tail->prev`, which is now **2** rather than 1.
4. `get(2)` returns −1: it was evicted, and it was evicted *because* of the promotion in step 2.
5. `put(4,4)` evicts the new least recent, which is 1.
6. `get(1)` returns −1, `get(3)` returns 3, `get(4)` returns 4.
7. Delete the promotion in step 2 and the answers change: 1 would have been evicted at step 3 and `get(2)` would have returned 2.
8. That single behavioural difference is the whole gap between LRU and FIFO.

<!-- @example -->

<!-- @input -->
The same cache with the promotion removed from `get`

<!-- @output -->
A FIFO cache, costing **10.34 points** of hit rate

<!-- @why -->
A bug that leaves every correctness test passing and quietly changes the algorithm.

<!-- @walkthrough -->
1. Without promotion, a key's position depends only on when it was *inserted*, never on when it was used.
2. That is precisely FIFO, and FIFO is a legitimate cache — so nothing crashes and no invariant breaks.
3. On a workload of 80% accesses to a hot set of 200 keys plus a long sequential scan, capacity 500: LRU **79.75%**, FIFO **69.41%**.
4. That is 10.34 points, or one seventh of the hits, thrown away by two missing lines.
5. On a Zipf α=1.0 trace the gap is 4.79 points, and on a uniform-random trace it is **zero** — the bug is invisible if your test data has no locality.
6. Which is the real hazard: a unit test with random keys cannot detect it, and a hit-rate regression in production is what surfaces it.
7. Java has the same trap in one argument — `new LinkedHashMap<>(16, 0.75f, true)` is LRU and `false` is FIFO.

<!-- @example -->

<!-- @input -->
A sequential loop over 1,000 keys, cache capacity 500

<!-- @output -->
LRU **0.00%**; random eviction **20.30%**; canonical LFU **0.00%**; optimal 49.75%

<!-- @why -->
LRU's pathological case, and it is a completely ordinary access pattern.

<!-- @walkthrough -->
1. The trace reads keys 0, 1, 2, … 999 and then starts again, forever.
2. With capacity 500, by the time key 0 comes round again it is the least recently used key in the cache.
3. So it was evicted on the previous pass — one step before it was needed.
4. This happens to **every** key on every pass, so the hit rate is exactly **0.00%**.
5. Random eviction, which uses no information at all, keeps roughly half the working set by luck and scores **20.30%**.
6. LFU does not help: after one pass every key has the same frequency, so its tie-break decides every eviction — and the canonical tie-break is least-recently-used, making it behave exactly like LRU at **0.00%**.
7. This is the scan-resistance problem, and it is why production caches are usually segmented LRU, ARC or a CLOCK variant rather than plain LRU.
8. Note also that capacity 1,000 gives 99.50% — the cliff between "just too small" and "just big enough" is total.

<!-- @example -->

<!-- @input -->
The same cache with a singly linked list, capacities from 125 to 2,000

<!-- @output -->
54.7 nodes walked per operation rising to 778.0; the doubly linked version flat at 1.17ms

<!-- @why -->
Why the `prev` pointer is worth 8 bytes a node here and was worth nothing in the previous subtopic.

<!-- @walkthrough -->
1. The hash map finds the node in O(1) in both versions — the lookup is not the problem.
2. Moving it to the front means unlinking it, which needs the node before it.
3. A singly linked list has no way back, so it walks from the head: on average half the list.
4. Measured, that is 54.7 nodes per operation at capacity 125 and **778.0** at capacity 2,000 — exactly linear in the capacity.
5. Wall clock followed: 2.8x slower at capacity 125, **24.1x** at 2,000, and the ratio keeps growing.
6. The doubly linked column did not move at all — 1,166,292ns at capacity 125 and 1,230,542ns at 2,000.
7. A flat column against one that doubles with capacity is the entire argument for `prev`, and it is why **Implement queue using Linkedlist** called this the subtopic where the doubly linked list finally earns its memory.

<!-- @example -->

<!-- @input -->
Where 54.39ns per operation actually goes

<!-- @output -->
16.24ns hash, 12.18ns pointers, 25.97ns allocator

<!-- @why -->
The part of the structure everyone optimises is the smallest of the three.

<!-- @walkthrough -->
1. Stripping the recency machinery entirely and doing only the hash lookups measured **16.24ns** per operation — 30% of the total.
2. The full structure with `new` and `delete` per node measured **54.39ns**.
3. Pooling the nodes, changing nothing else, brought that to **28.42ns**.
4. So allocation was 54.39 − 28.42 = **25.97ns**, or **48%** of every operation.
5. The pointer surgery — the six writes people worry about — is 28.42 − 16.24 = **12.18ns**, or 22%.
6. `unordered_map` plus `std::list` measured 54.46ns, indistinguishable from the hand-written 54.39ns, because `splice` does the identical work.
7. So hand-writing the list is worth nothing on its own, and worth 1.91x only because it lets you pool the nodes — which is the same conclusion the linked-queue subtopic reached at 3.35x.

<!-- @visualization custom -->

<!-- @description -->
Draw the two structures side by side and connected, because the whole design is that they share nodes: a hash map on the left as a column of key boxes, a doubly linked list on the right as a horizontal chain with `head` and `tail` sentinels drawn hollow and greyed to mark them as data-free, and an arrow from each map entry into its node. Run the capacity-2 trace across it — put(1,1), put(2,2), get(1), put(3,3) — and make `get(1)` the beat that gets room: highlight the map lookup landing on the node, then animate the unlink as exactly two writes using the node's own `prev` and `next`, then the push to the front. Immediately replay the same `get(1)` in a band below with a *singly* linked list, where the map lookup lands identically and then a pointer has to crawl from the head to find the predecessor — same destination, a walk instead of two writes — with a node counter reaching 778 at capacity 2,000 while the doubly linked band's counter stays at 2. The second panel is the policy, and it should be the largest thing on the page, because it is what LRU actually is: draw four caches of capacity 500 side by side under an identical scrolling trace of a sequential loop over 1,000 keys, one each for LRU, FIFO, random and Belady, with each cache's contents shown as a bar of 500 cells and a hit flashing green. The LRU bar should never flash — 0.00% — and the random bar should flash intermittently to 20.30%, which is the uncomfortable picture the panel exists for. Put the hit-rate table beneath it with the Zipf and hot-set rows too, so the reader sees LRU winning by 10.34 points on one workload and losing to random on another. Third panel is the cost decomposition as a single stacked bar of 54.39ns: 16.24ns hash in one colour, 12.18ns pointer surgery in another, and 25.97ns allocator in a third and much larger block than the reader expects, with the pooled 28.42ns bar drawn beside it as the same bar with the allocator segment deleted.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"theDesign":"a hash map finds the node in O(1); a doubly linked list keeps recency order and lets that node unlink itself from the middle -- neither structure does both jobs, so they share their nodes","correctness":{"model":"an O(n) vector in recency order","operations":400000,"capacity":64,"getsChecked":240355,"mismatches":0},"whyDoublyLinked":{"reason":"unlinking a node from the middle needs the node BEFORE it, and a singly linked list has no way back -- the same limitation Implement queue using Linkedlist measured, except a queue never needed it and this needs it on every get","measured":[{"capacity":125,"nodesWalked":2187052,"perOperation":54.7,"singlyNs":3266458,"doublyNs":1166292,"ratio":2.8},{"capacity":250,"nodesWalked":4358366,"perOperation":109.0,"singlyNs":5207750,"doublyNs":1145541,"ratio":4.5},{"capacity":500,"nodesWalked":8626302,"perOperation":215.7,"singlyNs":9059250,"doublyNs":1165500,"ratio":7.8},{"capacity":1000,"nodesWalked":16738993,"perOperation":418.5,"singlyNs":16404500,"doublyNs":1163834,"ratio":14.1},{"capacity":2000,"nodesWalked":31121189,"perOperation":778.0,"singlyNs":29669542,"doublyNs":1230542,"ratio":24.1}],"reading":"the walk doubles with capacity, exactly, and the doubly linked column does not move at all -- that flat column is the whole argument for prev"},"sentinels":{"what":"a head and a tail node that never hold data","buys":"unlink becomes two unconditional writes instead of four branches for first / last / only / middle; the eviction victim is always tail->prev and is always real when the map is non-empty","cost":"two nodes","note":"not an optimisation -- they are what makes the code short enough to be obviously right, and skipping them is the largest single source of bugs in hand-written LRU caches"},"thePolicy":{"whatLRUIs":"a guess: the key used longest ago is the one least likely to be needed next","trace":200000,"hitRates":[{"workload":"Zipf a=1.0, 10k keys","cap":100,"LRU":39.9,"FIFO":35.11,"random":35.11,"LFU":50.76,"OPT":59.04,"LRUoverOPT":0.676},{"workload":"Zipf a=1.0, 10k keys","cap":1000,"LRU":68.75,"FIFO":64.3,"random":64.41,"LFU":74.3,"OPT":82.08,"LRUoverOPT":0.838},{"workload":"uniform, 10k keys","cap":100,"LRU":0.99,"FIFO":0.99,"random":0.96,"LFU":1.03,"OPT":12.98},{"workload":"sequential loop, 1k keys","cap":500,"LRU":0.0,"FIFO":0.0,"random":20.3,"LFU":0.0,"OPT":49.75},{"workload":"80% hot(200) + scan","cap":500,"LRU":79.75,"FIFO":69.41,"random":69.55,"LFU":79.94,"OPT":80.98,"LRUoverOPT":0.985}],"fourReadings":["LRU beats FIFO wherever there is locality -- 4.79 points on Zipf and 10.34 on the hot-set-plus-scan workload, which is exactly what promoting on get buys","under uniform access it buys NOTHING: 0.99% against FIFO's 0.99%, so all the machinery is pure overhead when there is no locality","LRU has a pathological case and it is not obscure -- a sequential loop over 1,000 keys at capacity 500 gives 0.00%, where random eviction gets 20.30% on the identical trace; canonical LFU does not rescue it either, scoring 0.00% too, because equal frequencies leave its LRU tie-break doing all the work","even at its best it is well short of Belady: 0.676 of optimal on Zipf at capacity 100, rising to 0.985 on the workload it suits"],"scanResistance":"why production caches are usually segmented LRU, ARC or a CLOCK variant rather than plain LRU","theCliff":"capacity 1,000 on the same 1,000-key loop gives 99.50% -- the gap between just too small and just big enough is total","lfuNote":"LFU figures here use the CANONICAL tie-break, least-recently-used within a frequency. An arbitrary tie-break scores 49.65% on the sequential loop instead of 0.00% -- on that workload the tie-break IS the policy, since every key has the same frequency."},"theFIFOBug":{"what":"forgetting to promote the node on get","why it hides":"FIFO is a legitimate cache, so nothing crashes and no invariant breaks","cost":{"hotSetPlusScan":10.34,"zipf":4.79,"uniform":0.0},"realHazard":"a unit test with random keys cannot detect it, because with no locality LRU and FIFO score identically; a hit-rate regression in production is what surfaces it","javaEquivalent":"new LinkedHashMap<>(16, 0.75f, true) is LRU and false is FIFO -- one argument"},"cost":{"workload":"2,000,000 operations at capacity 4096, 60% get, median of five runs","rows":[{"impl":"hash lookups alone, no recency","nsPerOp":16.24,"share":"30%"},{"impl":"hash map + DLL, nodes pooled","nsPerOp":28.42},{"impl":"hash map + DLL, new/delete","nsPerOp":54.39},{"impl":"unordered_map + std::list with splice","nsPerOp":54.46}],"decomposition":{"hash":16.24,"pointerSurgery":12.18,"allocator":25.97,"allocatorShare":"48%"},"conclusions":["hand-writing the doubly linked list buys NOTHING -- 54.39ns against std::list's 54.46ns, a 0.1% difference, because splice performs exactly the same six pointer writes","unless you also pool the nodes, which std::list will not let you do: 54.39ns to 28.42ns is 1.91x, and it is the one concrete reason to hand-write the list"],"agreesWith":"Implement queue using Linkedlist measured a free list at 3.35x; it is worth less here only because the hash map is also paying"},"python":{"workload":"300,000 operations at capacity 4096","rows":[{"impl":"OrderedDict.move_to_end","nsPerOp":135,"vsOrderedDict":1.0},{"impl":"dict + hand-rolled doubly linked list","nsPerOp":193,"vsOrderedDict":1.43},{"impl":"plain dict, pop and re-insert","nsPerOp":377,"vsOrderedDict":2.79}],"whyOrderedDictWins":"it IS a hash map plus a doubly linked list, with the relinking done in C -- the hand-rolled version is the identical algorithm one interpreted attribute access at a time","theDictTrap":"since 3.7 a plain dict preserves insertion order, so pop-and-reinsert looks like a free move_to_end; it is the SLOWEST option measured, because every promotion is a hash delete and insert rather than two pointer writes, and the table periodically compacts","memoryTracemalloc":{"entries":200000,"orderedDict":137.4,"handRolled":148.4,"plainDict":84.4},"lruCache":{"nsPerCall":128,"note":"functools.lru_cache is the same policy entirely in C, but it caches function results keyed on arguments and offers no put -- a different interface rather than a faster cache"}},"whereThisGoesNext":"LFU Cache replaces used-longest-ago with used-fewest-times: it beat LRU wherever frequencies differ (50.76% against 39.90% on Zipf at capacity 100) and tied it exactly on the sequential loop, where every key has the same frequency and the tie-break does all the work -- at the cost of needing its own ordering structure for frequency","recommendation":"hash map plus a doubly linked list with two sentinels; pool the nodes if you hand-write it in C++, and in Python use OrderedDict","lesson":"the machinery is O(1) and uninteresting; what LRU actually is is a guess about the future, and the guess is worth measuring rather than assuming"}
```

<!-- @highlights -->
- The two structures are drawn side by side and connected, because the design is that they share nodes.
- A hash map on the left as a column of key boxes; a doubly linked list on the right as a horizontal chain.
- The `head` and `tail` sentinels are drawn hollow and greyed, marking them as data-free.
- An arrow runs from each map entry into its node.
- The capacity-2 trace runs across it: put(1,1), put(2,2), get(1), put(3,3).
- `get(1)` is the beat that gets room — the map lookup lands on the node, highlighted.
- The unlink animates as exactly two writes, using the node's own `prev` and `next`.
- Then the push to the front, and the list order visibly changes.
- The same `get(1)` replays below with a *singly* linked list.
- The map lookup lands identically, and then a pointer crawls from the head to find the predecessor.
- Same destination, a walk instead of two writes.
- A node counter reaches 778 at capacity 2,000 while the doubly linked band's counter stays at 2.
- Second panel is the policy and is the largest thing on the page, because it is what LRU actually is.
- Four caches of capacity 500 run side by side under one scrolling trace: a sequential loop over 1,000 keys.
- One each for LRU, FIFO, random and Belady, each shown as a bar of 500 cells with hits flashing green.
- The LRU bar never flashes — 0.00% — and the random bar flashes intermittently to 20.30%.
- That is the uncomfortable picture the panel exists for.
- The hit-rate table sits beneath, with the Zipf and hot-set rows, so LRU is seen winning by 10.34 points on one workload and losing to random on another.
- Third panel decomposes the cost as one stacked bar of 54.39ns: 16.24ns hash, 12.18ns pointer surgery, 25.97ns allocator.
- The allocator block is much larger than the reader expects, and the pooled 28.42ns bar sits beside it as the same bar with that segment deleted.

<!-- @edgeCases -->
- `get` on a missing key — return the sentinel value without touching the list.
- `put` on an existing key — update the value **and** promote it; this is not an insertion and must not evict.
- `put` at capacity — evict first, then insert, or the cache transiently holds one entry too many.
- Capacity 1 — every insertion evicts the previous entry, and the sentinels make this need no special case.
- Capacity 0 — every `put` must evict what it just inserted; reject it at construction instead.
- Evicting when the map is empty — impossible if eviction is guarded by `map.size() == cap`, and a null dereference if it is not.
- The evicted node's key — needed to erase the map entry, which is why the node stores its key at all.
- A hit on the already-most-recent node — unlink and push-front still work, and the sentinels keep it branch-free.
- A workload with no locality — LRU and FIFO score identically, so the promotion is pure cost.
- A sequential scan slightly larger than the cache — 0.00% hit rate, the worst case for this policy.
- Concurrent access — none of these are thread-safe, and a lock around the whole structure serialises every `get`.

<!-- @pitfalls -->
- Not promoting on `get`. The cache silently becomes FIFO, costing 10.34 points of hit rate and passing every correctness test.
- Testing with uniformly random keys. LRU and FIFO score identically there, so the bug above is invisible.
- Using a singly linked list because the hash map already finds the node. Unlinking still needs the predecessor — 778 nodes walked per operation at capacity 2,000.
- Forgetting to erase the evicted key from the map. The map grows without bound and its entries point at freed nodes.
- Omitting the sentinels. `unlink` needs four branches instead of two writes, and that is where the bugs live.
- Evicting after inserting rather than before. The structure transiently exceeds its own capacity.
- Storing the value in the map and the key in the node only. Eviction needs the key *from the node*, or you cannot find the map entry to remove.
- `popitem(last=False)` versus `last=True` in Python. One evicts the least recently used and the other evicts the most.
- Leaving `accessOrder` out of `LinkedHashMap`. The default is insertion order, which is FIFO.
- Hand-writing the doubly linked list in C++ for speed. It measured 54.39ns against `std::list`'s 54.46ns — the win comes from pooling, not from the pointers.
- Hand-writing it in Python at all. `OrderedDict` measured 1.43x faster and uses less memory.
- Using pop-and-reinsert on a plain `dict` because it preserves insertion order. It was the slowest option measured, at 2.79x `OrderedDict`.
- Assuming LRU is the best policy. LFU beat it wherever frequencies differ — 50.76% against 39.90% on Zipf at capacity 100.

<!-- @doubt -->
### Why do I need two data structures?

<!-- @answer -->
Because the problem asks two different questions and no single structure answers both in constant time. *"What is the value for key k?"* is a hash map's question — it finds an entry by name in O(1) and knows nothing about order. *"Which key was used longest ago?"* is an ordering question — a list answers it instantly and cannot find a key by name without scanning. Using only a hash map means scanning every entry to find the oldest; using only a list means scanning to find the key. So you keep both, and the trick that makes it work is that they **share their nodes**: the map stores a pointer to the node rather than the value, so a lookup lands you directly in the middle of the recency list with no searching. Measured, the hash half of the work is 16.24ns of a 54.39ns operation — about 30% — so neither structure dominates; they genuinely split the job.

<!-- @doubt -->
### Why does the list have to be doubly linked?

<!-- @answer -->
Because on every `get` you unlink a node from the **middle**, and unlinking needs the node before it. **Implement queue using Linkedlist** measured this exact limitation: a singly linked list lets you append after a node you are holding but never unlink it, since there is no way back. A queue never had to care, because it only ever removed from the head. Here you remove from wherever the key happens to sit. With a `prev` pointer that is two unconditional writes; without one it is a walk from the head, averaging half the list. Measured over 40,000 operations, the walk is **54.7 nodes per operation at capacity 125** and **778.0 at capacity 2,000** — exactly linear in the capacity — making the singly linked version 2.8x slower at the small capacity and **24.1x** at the large one, with no ceiling. The doubly linked version stayed flat at 1.17ms for every capacity tested. That flat line against one that doubles is what the extra 8 bytes a node buys, and it is the first time in this course that trade has been worth taking.

<!-- @doubt -->
### What are the sentinel nodes for, and can I skip them?

<!-- @answer -->
They are a `head` and a `tail` node that never hold data and are never removed, and skipping them is the most reliable way to write a buggy LRU cache. Their job is to guarantee that **every real node has both a predecessor and a successor**. That turns `unlink` into two unconditional writes — `n->prev->next = n->next; n->next->prev = n->prev;` — where without them it needs four branches: is this the first node, the last, the only one, or in the middle? Each of those is a place to get a null dereference or leave a stale pointer. They also make eviction trivial: the victim is always `tail->prev`, and it is always a real node whenever the map is non-empty, so there is no "is the list empty?" test in the eviction path either. The cost is two nodes for the lifetime of the cache. They are not a performance optimisation — they are what makes the code short enough that you can see it is right.

<!-- @doubt -->
### What actually happens if `get` doesn't move the node to the front?

<!-- @answer -->
You get a FIFO cache, and nothing tells you. This is the most instructive bug in the subtopic because it produces no crash, no assertion failure and no broken invariant — FIFO is a perfectly valid eviction policy, so the structure keeps working and simply makes worse decisions. Without promotion, a key's position depends only on when it was inserted, never on how often or how recently it has been used. Measured on a workload of 80% accesses to a hot set of 200 keys plus a long sequential scan, capacity 500: LRU **79.75%**, FIFO **69.41%** — **10.34 points**, about one seventh of all hits, lost to two missing lines. On a Zipf trace the gap is 4.79 points. And here is the part that makes it dangerous: on a **uniform random** trace the gap is **zero**, 0.99% against 0.99%, because with no locality there is nothing for recency to exploit. So a unit test built on random keys cannot detect this bug at all. Java packages the same trap into one argument — `new LinkedHashMap<>(16, 0.75f, true)` is LRU, and `false` is FIFO.

<!-- @doubt -->
### Is LRU actually a good eviction policy?

<!-- @answer -->
It is a reasonable default and it is not the best, and both halves are measurable. Against Belady's offline optimum — which knows the future and is the ceiling no online policy can reach — LRU scored **0.676** of optimal on a Zipf α=1.0 trace at capacity 100, and **0.985** on a workload with a clear hot set. Against FIFO it wins wherever there is locality, by 4.79 to 10.34 points. Against **LFU** it generally loses where frequencies differ: 39.90% against **50.76%** on Zipf at capacity 100 — though on a sequential loop the two are identical, both at 0.00%, because equal frequencies leave LFU's tie-break doing all the work and that tie-break is recency. And under uniform random access it is exactly as good as FIFO and as random eviction — 0.99% against 0.99% against 0.96% — because when there is no locality, no policy has anything to work with and the recency machinery is pure overhead. The honest summary is that LRU is a cheap, robust guess that exploits temporal locality when it exists, and that "cheap and robust" is doing more work in that sentence than "best".

<!-- @doubt -->
### When is LRU the wrong choice?

<!-- @answer -->
When your access pattern is a **scan larger than the cache**, and this is not a contrived case. Reading keys 0 through 999 in a loop with a capacity-500 cache gives LRU a hit rate of exactly **0.00%**: by the time key 0 comes round again it is the least recently used entry, so it was evicted on the previous pass — one step before it was needed — and this happens to every key on every pass. Random eviction, which uses no information whatsoever, scores **20.30%** on the identical trace, Canonical LFU does not rescue it either, scoring **0.00%** as well, because on a loop every key has the same frequency and LFU's tie-break — least-recently-used — is left doing all the work. Being beaten by chance is a strong signal that a policy is actively misfiring rather than merely being uninformed. This is the scan-resistance problem, and it is why production caches are usually not plain LRU but segmented LRU, ARC, or a CLOCK variant — designs that keep a scan from flushing the working set. Worth noticing too how sharp the cliff is: the same 1,000-key loop at capacity 1,000 gives **99.50%**. Between "just too small" and "just big enough" there is no gradient at all.

<!-- @doubt -->
### Is the hand-written doubly linked list worth it over `std::list`?

<!-- @answer -->
On its own, no — and that surprised me. Over 2,000,000 operations at capacity 4,096, the hand-written version measured **54.39ns** per operation and `unordered_map` plus `std::list` with `splice` measured **54.46ns**. A 0.1% difference, because `splice` relinks the node in place with exactly the same six pointer writes, allocates nothing, and — importantly — keeps iterators valid, which is what makes storing an iterator in the map sound in the first place. What *is* worth it is pooling the nodes, and that is the one thing `std::list` will not let you do because it owns its own allocation. Keeping evicted nodes on a spare chain instead of calling `delete` took 54.39ns to **28.42ns**, a **1.91x** improvement, which means allocation was **48%** of every operation. That is the same conclusion **Implement queue using Linkedlist** reached, where a free list was worth 3.35x. So: use `std::list` unless you are going to pool, and if you are going to pool then hand-write it — but do it for the allocator, not for the pointers, which are only 12.18ns of the 54.39.

<!-- @doubt -->
### What should I use in Python?

<!-- @answer -->
`collections.OrderedDict` with `move_to_end`, and unlike C++ this is not a close call. Over 300,000 operations at capacity 4,096: `OrderedDict` **135ns** per operation, a hand-rolled dict-plus-doubly-linked-list **193ns** (**1.43x**), and it uses less memory too — 137.4 bytes per entry against 148.4. The reason is that `OrderedDict` *is* this structure: a hash map wired to a doubly linked list, with the relinking done in C. Hand-rolling it means running the identical algorithm one interpreted attribute access at a time. Avoid one specific temptation: since Python 3.7 a plain `dict` preserves insertion order, so "pop the key and re-insert it" looks like a free `move_to_end`. Measured, it is the **slowest** option at **377ns**, or 2.79x `OrderedDict`, because each promotion is a hash delete plus a hash insert rather than two pointer writes, and the table periodically compacts to reclaim the vacated slots. For memoisation specifically, `functools.lru_cache` is faster still at **128ns** per call, being the same policy entirely in C — but it keys on function arguments and gives you no `put`, so it is a different interface rather than a faster cache.

<!-- @doubt -->
### Why is an LRU cache in the Queues topic?

<!-- @answer -->
Because the recency list is a queue with one extra power. Strip the hash map away and what remains is exactly the FIFO of this topic's earlier subtopics: entries enter at one end, leave at the other, and the oldest is evicted first — which, as measured above, is precisely what an LRU cache degenerates into when you forget to promote on `get`. The single thing LRU adds is the ability to reach into the middle and pull an entry back to the front, and that one capability is what the whole doubly linked list exists to provide. It is worth seeing the progression that way: **Implement Queue using Arrays** got O(1) at both ends by wrapping the indices, **Implement Queue using Stack** got it by amortising a reversal, **Implement queue using Linkedlist** got it worst-case with two pointers, and this subtopic adds O(1) access to an arbitrary position by pairing that list with a hash map. **LFU Cache** then changes the ordering key from recency to frequency, which turns out to need a genuinely different structure rather than another pointer.
