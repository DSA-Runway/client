---
id: introduction-to-doubly-ll
topic: Linked Lists
title: Introduction to Doubly LL
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-singly-linkedlist
  - data-types
  - pass-by-value-vs-pass-by-reference
  - while-loop
  - stack-memory-and-recursion-depth
  - time-and-space-complexity-basics
relatedIds:
  - introduction-to-singly-linkedlist
  - insert-node-before-head-in-doubly-linked-list
  - delete-head-of-doubly-linked-list
  - reverse-a-doubly-linked-list
  - find-pairs-with-given-sum-in-doubly-linked-list
---

<!-- @summary -->
One extra pointer per node, and the trade is sharper than "uses more memory": the node grows **1.50x** in C++ — from 16 bytes to 24 for a 4-byte payload — while a forward walk slows by only about **5%**, and in Python without `__slots__` the extra pointer measured **completely free** at 344 bytes either way. What it buys is exact: deleting a node you already hold drops from **98,997 links followed** to **2 pointer writes**. What it costs beyond memory is that there are now two chains that can disagree, and a list with one broken `prev` walks forward perfectly.

<!-- @theory -->
## The node

A singly linked node knows what comes after it. A doubly linked node also knows
what came before:

```
      +------+------+------+
      | prev | data | next |
      +------+------+------+

null <-- [1] <--> [2] <--> [3] <--> [4] --> null
          ^                          ^
        head                       tail
```

Lists like this are normally held by **both** ends, because a `tail` pointer is
most of what makes the backwards direction useful.

## What the second pointer costs

In C++ the node grows by exactly one pointer, and the ratio is worse than it
looks because the payload is small:

| | `sizeof` | Payload | Overhead |
|---|---|---|---|
| Singly linked node | 16 bytes | 4 | 300% |
| Doubly linked node | **24 bytes** | 4 | **500%** |

That is **1.50x** the memory for the same data. The layout is worth seeing —
`data` at offset 0, `prev` at 8, `next` at 16 — which means four of those bytes
are **padding**, inserted so the pointers land on 8-byte boundaries. A 4-byte
payload buys a 24-byte node.

The density difference shows up in the cache too: a 64-byte cache line holds
**4.00** singly linked nodes but only **2.67** doubly linked ones.

Python behaves completely differently, and this is worth knowing before
optimising anything:

| | Bytes |
|---|---|
| Singly node, ordinary class | 344 |
| Doubly node, ordinary class | **344** |
| Singly node with `__slots__` | 48 |
| Doubly node with `__slots__` | **56** |

With an ordinary class the extra pointer is **free** — both come to 344 bytes,
because the per-instance `__dict__` dominates so completely that a third
attribute costs nothing measurable. Only with `__slots__` does the difference
appear at all, and even then it is 1.17x rather than C++'s 1.50x.

## The memory cost does not become a speed cost

The natural next assumption is that a 50% larger node means a 50% slower walk.
It does not. Measured on a million nodes, with each list allocated contiguously
so neither is handicapped:

| | Time | Bytes walked |
|---|---|---|
| Singly, forward | **953us** | 16 MB |
| Doubly, forward | 1,012us | 24 MB |
| Doubly, backward | 1,012us | 24 MB |
| Singly, backward | *not expressible without O(n) extra space* | — |

Half again as much memory, about **5%** more time. Walking a linked list is
dominated by following one pointer to find the next address, and that dependency
does not get faster by moving fewer bytes — so the extra 8 bytes per node ride
along nearly free. Bytes walked is simply not what this measurement is bounded
by.

Backwards costs the same as forwards, which is the point of having it.

## What it buys: deletion in place

Here is the one that justifies the whole structure. Suppose something hands you a
pointer to a node and asks you to remove it. In a doubly linked list you already
have everything you need. In a singly linked list you have to **find the
predecessor**, and the only way is to walk from the head:

| List | Node's position | Doubly: pointer writes | Singly: links followed |
|---|---|---|---|
| 1,000 | first | 1 | 0 |
| 1,000 | middle | 2 | 498 |
| 1,000 | near the end | 2 | 987 |
| 100,000 | first | 1 | 0 |
| 100,000 | middle | 2 | 49,998 |
| 100,000 | near the end | **2** | **98,997** |

The doubly linked cost does not depend on where the node is. The singly linked
cost **is** its distance from the head. That is the difference between an O(1)
operation and an O(n) one, and it is why every structure that needs to remove
arbitrary elements cheaply — LRU caches, intrusive lists, `std::list` — is doubly
linked.

## What it costs beyond memory: two chains that can disagree

A doubly linked list is not one chain but **two**, running in opposite
directions, and nothing enforces that they describe the same sequence. Every
insertion and deletion has to update both, and forgetting one half produces a
list that is wrong in a very quiet way.

Inserting 99 after the second node of `0 1 2 3`, but neglecting to point the
following node's `prev` at the new one:

| Direction | Result |
|---|---|
| Forward | `0 1 99 2 3` — correct |
| Backward, reversed | `0 1 2 3` — the new node is **invisible** |

The forward walk is perfect. Only the backward walk is wrong, and only by one
node. Measured on larger lists, that is exactly the scale of the damage:

| n | Forward reaches | Backward reaches |
|---|---|---|
| 10 | 11 nodes | 10 — 90.9% |
| 1,000 | 1,001 nodes | 1,000 — 99.9% |
| 100,000 | 100,001 nodes | 100,000 — **100.0%** |

One missing `prev` makes exactly one node unreachable from the back. On a
hundred-thousand-node list the backward walk still finds 100.0% of the list to
one decimal place. No crash, no cycle, no obviously missing data — and any test
that only reads `next` cannot see it at all.

<!-- @intuition -->
The useful way to hold this is that the second pointer is not a convenience but a purchase, with a price and a specific thing bought. The price is 50% more memory per node in C++ and a maintenance burden of keeping two chains in agreement; it is not, as one might guess, a proportionally slower traversal, because walking a list is bound by chasing pointers rather than by moving bytes. The thing bought is that a node becomes **self-sufficient**: give a singly linked node to a function and it cannot remove itself, because removal means editing the node before it and it has no way to reach that node. Give a doubly linked one and it can, in two writes, regardless of how long the list is. Almost everything a doubly linked list is good for follows from that — removing arbitrary elements cheaply, walking backwards, closing in from both ends — and almost everything that goes wrong with one follows from the other half, that the two directions are maintained separately and only conventionally agree. A list whose `prev` chain has quietly drifted out of step with its `next` chain will pass every test written in the direction people naturally test.

<!-- @approach -->
### The Node, and What the Second Pointer Costs

<!-- @idea -->
A doubly linked node carries a pointer in each direction, which makes it 1.50x the size in C++ and effectively free in ordinary Python.

<!-- @steps -->
1. Give the node three fields: the payload, a pointer to the previous node, and a pointer to the next.
2. Set both pointers to null on construction — a lone node has neither neighbour.
3. Hold the list by both its head and its tail, since the backwards direction is only reachable from the tail.
4. Treat a null `prev` as "this is the head" and a null `next` as "this is the tail".

<!-- @code cpp -->
```cpp
struct Node {
    int data;
    Node* prev;
    Node* next;
    Node(int d) : data(d), prev(nullptr), next(nullptr) {}
};

struct List {
    Node* head = nullptr;
    Node* tail = nullptr;
};
```

<!-- @annotations -->
- 2: `sizeof(Node)` is 24 here, not 20 — `data` sits at offset 0, `prev` at 8 and `next` at 16, so four bytes of padding are inserted to keep the pointers 8-aligned.
- 10: Storing the tail is what makes the second pointer useful. Without it the back of the list is only reachable by walking forward from the head, which defeats the purpose.
- 5: Both pointers null on construction, so a lone node is simultaneously a valid head and a valid tail.

<!-- @code java -->
```java
class Node {
    int data;
    Node prev;
    Node next;
    Node(int d) { data = d; }
}

class List {
    Node head;
    Node tail;
}
```

<!-- @annotations -->
- 5: Java initialises reference fields to null automatically, so the constructor only has to set the payload.

<!-- @code python -->
```python
class Node:
    __slots__ = ('data', 'prev', 'next')

    def __init__(self, data):
        self.data = data
        self.prev = None
        self.next = None


# With __slots__ this is 56 bytes against a singly linked node's 48.
# WITHOUT __slots__ both come to 344 -- the instance dict is so large
# that the third attribute costs nothing measurable.
```

<!-- @annotations -->
- 2: `__slots__` is what makes the size difference visible at all. On an ordinary class the extra pointer measured completely free, at 344 bytes either way.

<!-- @approach -->
### Walking It Both Ways

<!-- @idea -->
Follow `next` from the head to read the list forwards, or `prev` from the tail to read it backwards — the second of which a singly linked list cannot do at all.

<!-- @steps -->
1. To read forwards, start at the head and follow `next` until it is null.
2. To read backwards, start at the **tail** and follow `prev` until it is null.
3. Stop on null in both cases — the ends are marked by absent pointers, not by a counter.
4. Note that the two walks should produce the same sequence in opposite orders, and that nothing in the structure enforces this.

<!-- @complexity -->
- time: O(n) in either direction
- space: **O(1)** — one pointer, in either direction
- note: The backward walk measured the **same** cost as the forward one, 1,012us against 1,012us on a million nodes, which is the whole point of storing the extra pointer. A singly linked list cannot do it at all without first building an O(n) structure of node addresses. The doubly linked forward walk costs about **5%** more than the singly linked one despite touching 50% more memory — 1,012us against 953us — because the walk is bound by chasing pointers, not by moving bytes.

<!-- @code cpp -->
```cpp
long sumForward(const List& list) {
    long total = 0;
    for (Node* p = list.head; p != nullptr; p = p->next) total += p->data;
    return total;
}

long sumBackward(const List& list) {
    long total = 0;
    for (Node* p = list.tail; p != nullptr; p = p->prev) total += p->data;
    return total;
}
```

<!-- @annotations -->
- 9: `list.tail` and `p->prev` — the two things a singly linked list does not have. Everything else about this loop is identical to the forward one.
- 3: Identical in shape to a singly linked traversal, and measured only about 5% slower despite the node being 1.50x the size.

<!-- @code java -->
```java
static long sumForward(List list) {
    long total = 0;
    for (Node p = list.head; p != null; p = p.next) total += p.data;
    return total;
}

static long sumBackward(List list) {
    long total = 0;
    for (Node p = list.tail; p != null; p = p.prev) total += p.data;
    return total;
}
```

<!-- @annotations -->
- 9: The two methods differ from the forward version in exactly two tokens — the starting field and the field followed — which is a fair summary of what the structure adds.

<!-- @code python -->
```python
def sum_forward(lst):
    total = 0
    p = lst.head
    while p is not None:
        total += p.data
        p = p.next
    return total


def sum_backward(lst):
    total = 0
    p = lst.tail
    while p is not None:
        total += p.data
        p = p.prev
    return total
```

<!-- @annotations -->
- 12: Starting from the tail, which only exists because the list stores it — walking forward to find it would make the backward traversal two passes.

<!-- @approach -->
### Removing a Node You Already Hold

<!-- @idea -->
Given a pointer to a node, unlink it by connecting its two neighbours to each other — which a doubly linked node can do because it knows both of them.

<!-- @steps -->
1. If the node has a previous neighbour, point that neighbour's `next` past this node; otherwise this node was the head, so move the head forward.
2. If the node has a next neighbour, point that neighbour's `prev` back past this node; otherwise this node was the tail, so move the tail backward.
3. Free the node.
4. Note that neither step searched for anything — both neighbours were already known.

<!-- @complexity -->
- time: **O(1)** — at most two pointer writes, regardless of the list's length or the node's position
- space: O(1)
- note: This is the operation the whole structure exists for. Measured, it costs **1 or 2 pointer writes** wherever the node sits; the singly linked equivalent has to walk from the head to find the predecessor, which cost **98,997 links** for a node near the end of a hundred-thousand-node list. That gap — O(1) against O(n) — is why LRU caches, intrusive lists and `std::list` are all doubly linked.

<!-- @code cpp -->
```cpp
void removeNode(List& list, Node* node) {
    if (node->prev != nullptr) node->prev->next = node->next;
    else                       list.head = node->next;

    if (node->next != nullptr) node->next->prev = node->prev;
    else                       list.tail = node->prev;

    delete node;
}
```

<!-- @annotations -->
- 2: No search. The predecessor is already known, which is exactly what the singly linked version has to walk the list to discover.
- 3: A null `prev` means this node was the head, so the list's head pointer has to move — the only reason `list` is passed at all.
- 6: The mirror case for the tail. Both branches are needed, and forgetting either leaves the list holding a pointer to a freed node.

<!-- @code java -->
```java
static void removeNode(List list, Node node) {
    if (node.prev != null) node.prev.next = node.next;
    else                   list.head = node.next;

    if (node.next != null) node.next.prev = node.prev;
    else                   list.tail = node.prev;

    node.prev = null;
    node.next = null;
}
```

<!-- @annotations -->
- 8: Clearing the removed node's own pointers, so it does not keep its former neighbours alive from the collector's point of view.

<!-- @code python -->
```python
def remove_node(lst, node):
    if node.prev is not None:
        node.prev.next = node.next
    else:
        lst.head = node.next

    if node.next is not None:
        node.next.prev = node.prev
    else:
        lst.tail = node.prev

    node.prev = None
    node.next = None


# Two pointer writes, wherever the node is. The singly linked
# equivalent walks from the head to find the predecessor -- 98,997
# links for a node near the end of a 100,000-node list.
```

<!-- @annotations -->
- 13: Detaching the removed node from both neighbours, which matters here because a lingering reference would keep them reachable.

<!-- @example -->

<!-- @input -->
A four-node list, and the same data as a singly linked list

<!-- @output -->
24 bytes per node against 16 — 1.50x for the same 4 bytes of payload

<!-- @why -->
Puts a number on the cost before discussing what it buys.

<!-- @walkthrough -->
1. A singly linked node holds a 4-byte `int` and one 8-byte pointer.
2. Alignment rounds that to **16 bytes**, so three quarters of the node is overhead.
3. A doubly linked node holds the same `int` and **two** pointers.
4. The fields land at offsets 0, 8 and 16, so four bytes of padding sit between the payload and the first pointer, giving **24 bytes**.
5. That is 1.50x the memory, and five bytes of structure for every byte of data.
6. A 64-byte cache line therefore holds 4.00 singly linked nodes but only 2.67 doubly linked ones.
7. In Python the picture inverts entirely: with an ordinary class both node types measured **344 bytes**, because the instance dictionary dwarfs the difference.

<!-- @example -->

<!-- @input -->
A million-node list of each kind, walked end to end

<!-- @output -->
953us singly, 1,012us doubly — about 5% apart, not 50%

<!-- @why -->
Corrects the natural assumption that 50% more memory means a 50% slower walk.

<!-- @walkthrough -->
1. The doubly linked list occupies 24 MB against the singly linked list's 16 MB.
2. Each list was built in its own loop so its nodes are allocated consecutively and neither is handicapped.
3. Walked forward, the singly linked list took 953us and the doubly linked one 1,012us.
4. That is about **5%**, against a 50% difference in bytes touched.
5. Following a linked list means reading a pointer to learn where to read next, and that chain of dependent reads is what the time goes on.
6. Moving 8 extra bytes per node alongside a read that was going to happen anyway costs very little.
7. The backward walk measured 1,012us — the same as forwards — which is the return on the whole investment.

<!-- @example -->

<!-- @input -->
A pointer to a node near the end of a 100,000-node list, to be removed

<!-- @output -->
2 pointer writes in a doubly linked list; 98,997 links followed in a singly linked one

<!-- @why -->
The single measurement that justifies the structure.

<!-- @walkthrough -->
1. Removing a node means making its predecessor point past it.
2. A doubly linked node holds its predecessor already, so the work is two assignments — one for each neighbour.
3. A singly linked node does not, and the only way to find the predecessor is to walk from the head.
4. For a node at index 98,999 of a 100,000-node list, that walk followed **98,997** links.
5. The doubly linked cost was **2** for that node and 2 for the node in the middle and 1 for the head — it does not depend on position at all.
6. So the same operation is O(1) in one structure and O(n) in the other, for a node you already have in your hand.
7. That is why LRU caches, intrusive lists and `std::list` are doubly linked: they all need to remove arbitrary known elements cheaply.

<!-- @example -->

<!-- @input -->
An insertion that updates `next` but forgets the following node's `prev`

<!-- @output -->
Forward reads `0 1 99 2 3`; backward reads `0 1 2 3`

<!-- @why -->
The failure mode unique to having two chains, and the reason it survives testing.

<!-- @walkthrough -->
1. Inserting 99 after the second node requires four pointer updates: the new node's two, the predecessor's `next`, and the successor's `prev`.
2. Omitting the last of those leaves the `next` chain completely correct.
3. Walking forward gives `0 1 99 2 3`, which is exactly right.
4. Walking backward from the tail gives `3 2 1 0`, which reversed is `0 1 2 3` — the new node is simply **not there**.
5. On larger lists the damage is the same size: one missing `prev` makes exactly one node unreachable from the back.
6. Measured on 100,000 nodes, the backward walk still reached **100.0%** of the list to one decimal place.
7. There is no crash, no cycle and no visibly missing data, and a test suite that reads only `next` cannot detect any of it.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the list with both arrows between every adjacent pair and both ends labelled, but draw the two chains as **visually separate** — the `next` arrows in one colour above the nodes and the `prev` arrows in another below them — because the single most important idea here is that they are two independent structures that only conventionally agree. Open with the node itself, blown up as a byte-level box: four bytes of payload, four bytes of padding shaded differently, then two eight-byte pointers, totalling 24, with the singly linked node's 16 drawn beneath it at the same scale so the 1.50x is a length rather than a number. Put the cache line across both as a 64-byte ruler showing 4.00 nodes fitting one and 2.67 the other. The middle panel is the deletion, and it should be two animations side by side on lists of the same length with the same node marked for removal. On the doubly linked side, two arrows redraw and it is done — freeze immediately. On the singly linked side, a marker starts at the head and walks, and walks, with a counter climbing, and only after 98,997 steps does the single rewrite happen. Let that walk actually take time on screen; the asymmetry is the whole argument and a static diagram cannot convey it. The last panel is the broken insert: perform it correctly first, showing all four pointer updates as four distinct beats, then replay omitting the fourth. Walk forward — perfect, `0 1 99 2 3`. Walk backward — and have the traversal step straight over the new node, which should stay drawn on screen but greyed and unvisited. Print both readings side by side with the inserted node circled in the forward one and absent from the backward one, captioned that a test reading only `next` sees nothing wrong.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"structure":{"node":"payload, a pointer to the previous node, and a pointer to the next","heldBy":"both head and tail -- a tail pointer is most of what makes the backwards direction useful","ends":"a null prev means head; a null next means tail"},"nodeSize":{"cpp":[{"kind":"singly linked","sizeof":16,"payload":4,"overhead":"300%"},{"kind":"doubly linked","sizeof":24,"payload":4,"overhead":"500%"}],"ratio":"1.50x","layout":{"data":0,"prev":8,"next":16,"note":"four bytes of padding after the payload, so the pointers land 8-aligned -- a 4-byte payload buys a 24-byte node"},"cacheLine":{"bytes":64,"singlyNodes":4.00,"doublyNodes":2.67}},"python":{"rows":[{"kind":"singly, ordinary class","bytes":344},{"kind":"doubly, ordinary class","bytes":344},{"kind":"singly with __slots__","bytes":48},{"kind":"doubly with __slots__","bytes":56}],"finding":"with an ordinary class the extra pointer is FREE -- both are 344 bytes, because the per-instance __dict__ dominates so completely that a third attribute costs nothing measurable","withSlots":"1.17x, against C++'s 1.50x"},"memoryCostIsNotASpeedCost":{"setup":"a million nodes, each list built in its own loop so its nodes are allocated consecutively","rows":[{"walk":"singly, forward","us":953,"bytesWalked":"16 MB"},{"walk":"doubly, forward","us":1012,"bytesWalked":"24 MB"},{"walk":"doubly, backward","us":1012,"bytesWalked":"24 MB"},{"walk":"singly, backward","us":null,"note":"not expressible without O(n) extra space"}],"finding":"half again as much memory, about 5% more time","why":"walking a list is dominated by reading a pointer to learn the next address -- that chain of dependent reads does not get faster by moving fewer bytes","backwardCost":"the same as forward, which is the return on the whole investment"},"whatItBuys":{"operation":"remove a node you already hold a pointer to","rows":[{"n":1000,"position":"first","doublyWrites":1,"singlyLinksFollowed":0},{"n":1000,"position":"middle","doublyWrites":2,"singlyLinksFollowed":498},{"n":1000,"position":"near the end","doublyWrites":2,"singlyLinksFollowed":987},{"n":100000,"position":"first","doublyWrites":1,"singlyLinksFollowed":0},{"n":100000,"position":"middle","doublyWrites":2,"singlyLinksFollowed":49998},{"n":100000,"position":"near the end","doublyWrites":2,"singlyLinksFollowed":98997}],"finding":"the doubly cost does not depend on where the node is; the singly cost IS its distance from the head","consequence":"O(1) against O(n) for a node already in hand -- which is why LRU caches, intrusive lists and std::list are all doubly linked"},"whatItCostsBeyondMemory":{"problem":"a doubly linked list is TWO chains running in opposite directions, and nothing enforces that they describe the same sequence","brokenInsert":{"action":"insert 99 after the second node of 0 1 2 3, forgetting to point the following node's prev at the new one","forward":"0 1 99 2 3 -- correct","backwardReversed":"0 1 2 3 -- the new node is invisible"},"scaleOfDamage":[{"n":10,"forwardReaches":11,"backwardReaches":10,"percent":"90.9%"},{"n":1000,"forwardReaches":1001,"backwardReaches":1000,"percent":"99.9%"},{"n":100000,"forwardReaches":100001,"backwardReaches":100000,"percent":"100.0%"}],"finding":"one missing prev makes exactly ONE node unreachable from the back -- not a cascade","whyItSurvivesTesting":"no crash, no cycle, no visibly missing data, and any test that reads only `next` cannot see it at all"},"lesson":"the second pointer is a purchase with a price and a specific thing bought -- the price is 50% more memory and a maintenance burden, NOT a proportionally slower walk; the thing bought is that a node becomes self-sufficient enough to remove itself in two writes"}
```

<!-- @highlights -->
- The list is drawn with both arrows between adjacent nodes, but the two chains are visually separate — `next` above the nodes in one colour, `prev` below in another.
- That separation carries the central idea: they are two independent structures that only conventionally agree.
- The opening blows the node up to a byte-level box: four bytes of payload, four of padding shaded differently, then two eight-byte pointers, totalling 24.
- The singly linked node's 16 bytes sits beneath at the same scale, so the 1.50x is a length rather than a number.
- A 64-byte ruler across both shows 4.00 nodes fitting one and 2.67 the other.
- The middle panel animates deletion twice, side by side, on equal-length lists with the same node marked.
- On the doubly linked side two arrows redraw and it freezes immediately.
- On the singly linked side a marker walks from the head with a counter climbing, and the rewrite happens only after 98,997 steps.
- That walk takes real time on screen, because the asymmetry is the argument and a static diagram cannot convey it.
- The last panel performs the insert correctly first, showing all four pointer updates as four distinct beats.
- It then replays omitting the fourth.
- The forward walk is perfect: `0 1 99 2 3`.
- The backward walk steps straight over the new node, which stays drawn but greyed and unvisited.
- Both readings print side by side, the inserted node circled in one and absent from the other.
- The caption notes that a test reading only `next` sees nothing wrong.

<!-- @edgeCases -->
- The empty list — both head and tail are null, and every traversal ends before it starts.
- A single node — its `prev` and `next` are both null, so it is simultaneously the head and the tail.
- Removing the only node — both branches of the removal take their null path, leaving head and tail null.
- Removing the head — `prev` is null, so the list's head pointer must move; this is why the removal needs the list, not just the node.
- Removing the tail — the mirror case, moving the tail pointer backward.
- A list held only by its head — the backward walk is unreachable without first walking forward, which costs the structure its main advantage.
- A node whose `prev` and `next` are both stale — still walks correctly from whichever end agrees with it.
- An insertion that updates three of the four pointers — leaves a list correct in one direction and wrong by one node in the other.
- A very large payload — the 8 extra bytes per node become negligible, and the 1.50x figure shrinks toward 1.00x.
- Python without `__slots__` — the extra pointer costs nothing measurable, both node types coming to 344 bytes.
- Freeing a node without detaching it — leaves its former neighbours pointing at freed memory from both sides rather than one.

<!-- @pitfalls -->
- Updating `next` but not `prev` on an insertion or deletion. The forward walk stays perfect and only the backward one is wrong, by exactly one node.
- Testing only in the forward direction. Every broken-`prev` bug passes, since `next` is untouched.
- Storing only a head pointer. The backward direction then costs a forward traversal to reach, which is most of what the structure was for.
- Assuming 50% more memory means a 50% slower walk. Measured, it is about 5% — the walk is bound by chasing pointers, not by moving bytes.
- Assuming the extra pointer costs the same everywhere. It is 1.50x in C++, 1.17x in Python with `__slots__`, and free without them.
- Removing a node without passing the list. A node at either end requires the head or tail pointer to move, which the node alone cannot do.
- Forgetting either null branch in the removal. The head or tail is then left pointing at a freed node.
- Expecting `sizeof` to be 20 for a 4-byte payload and two pointers. Alignment padding makes it 24.
- Reaching for a doubly linked list when the payload is tiny and you never delete by pointer. The 50% overhead buys nothing you use.
- Leaving a removed node's own pointers set. It keeps its former neighbours reachable, which matters under a garbage collector.
- Trusting a `prev` chain that has been edited by code you have not audited. Nothing in the structure validates that the two chains agree.

<!-- @doubt -->
### What does the extra pointer actually cost?

<!-- @answer -->
In C++, 50% more memory per node and almost nothing in traversal time. The node grows from **16 bytes to 24** for the same 4-byte payload — worth noting that it is 24 rather than 20, because four bytes of padding are inserted after `data` so the pointers land on 8-byte boundaries. A 64-byte cache line therefore holds 4.00 singly linked nodes but only 2.67 doubly linked ones. What it does **not** cost is a proportionally slower walk: measured on a million nodes, forward traversal took 953us singly and 1,012us doubly, about **5%** apart despite touching 50% more memory. Python is different again — with an ordinary class both node types measured **344 bytes**, so the extra pointer is genuinely free there, because the per-instance dictionary dwarfs it. Only with `__slots__` does a difference appear, and then it is 48 against 56, about 1.17x.

<!-- @doubt -->
### What do I get in return?

<!-- @answer -->
Chiefly one thing: a node becomes able to remove itself. Deleting a node means making its predecessor point past it, and a singly linked node has no way to reach its predecessor — the only route is to walk from the head. Measured on a hundred-thousand-node list, removing a node near the end took **98,997 links followed** singly, against **2 pointer writes** doubly. The doubly linked cost does not depend on the node's position at all: 1 write at the head, 2 anywhere else, on a list of any length. That is an O(1) operation against an O(n) one, for a node you already hold. Everything else the structure is known for follows from the same fact — LRU caches evict a node they already have a pointer to, intrusive lists let an object unlink itself, and the sorted two-pointer sweep in **Find Pairs with Given Sum** needs a `prev` to close in from the back.

<!-- @doubt -->
### Is a backward walk slower than a forward one?

<!-- @answer -->
No — measured at 1,012us in both directions on a million nodes, which is exactly what you would hope for from a structure whose whole purpose is symmetry. Both walks follow one pointer per node through the same memory; only the field being read differs. The comparison that matters more is against the singly linked list, which cannot walk backwards **at all** without first building something O(n) — an array of node addresses, or a reversed copy. So the honest framing is not that backwards is cheap but that it is *possible*, and it costs the same as the direction you already had. One practical requirement: the backward walk starts at the **tail**, so the list has to store one. If your structure keeps only a head pointer, reaching the tail costs a full forward traversal and the backward walk becomes two passes rather than one.

<!-- @doubt -->
### What goes wrong that cannot go wrong in a singly linked list?

<!-- @answer -->
The two chains can disagree. A doubly linked list is not one sequence but two — the `next` chain read from the head and the `prev` chain read from the tail — and nothing in the structure enforces that they describe the same thing. Every insertion and deletion has to update both, and forgetting one half is quiet. Inserting 99 after the second node of `0 1 2 3` but neglecting the successor's `prev` gives a list that reads `0 1 99 2 3` forwards, correctly, and `0 1 2 3` backwards — the new node simply is not there. The damage is precisely one node: measured on 100,000 nodes, the backward walk still reached **100.0%** of the list to one decimal place. No crash, no cycle, nothing obviously missing. And because most code and most tests read `next`, this class of bug can live in a codebase for a long time.

<!-- @doubt -->
### When should I not use one?

<!-- @answer -->
When you are paying the 50% and not using what it buys. Two situations in particular. If the payload is tiny and you only ever walk forwards and delete by *searching* rather than by pointer, then every byte of the second pointer is waste — a singly linked list does the same work in two thirds of the memory with 2.67 times the cache density. And if the payload is **large**, the ratio inverts in a different way: 8 extra bytes on a node holding a kilobyte of data is a rounding error, so the memory argument disappears and the decision should rest entirely on whether you need backward traversal or O(1) removal. The other consideration is maintenance rather than performance — twice as many pointers to keep consistent, with a failure mode that forward-only tests cannot see. If nothing in your code ever reads `prev`, the field is not free; it is a liability that silently rots.

<!-- @doubt -->
### Why is the node 24 bytes and not 20?

<!-- @answer -->
Alignment padding. A 4-byte `int` and two 8-byte pointers add up to 20, but a pointer must sit at an address divisible by 8, so the compiler inserts four bytes of padding after `data` — the fields land at offsets **0, 8 and 16**, and the struct rounds up to 24. This is the same effect that makes a singly linked node 16 bytes rather than 12. It is worth knowing because it changes the arithmetic of the trade: the doubly linked node is not 20/12 = 1.67x the singly linked one, nor 24/12, but **24/16 = 1.50x**. It also means that reordering the fields does not help here, and that adding a second 4-byte field to the node would be **free** — it would fit in the existing padding, taking the payload from 4 bytes to 8 with no change to `sizeof`.
