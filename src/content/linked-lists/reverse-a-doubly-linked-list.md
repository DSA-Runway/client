---
id: reverse-a-doubly-linked-list
topic: Linked Lists
title: Reverse a Doubly Linked List
difficulty: Medium
status: ready
prerequisites:
  - introduction-to-doubly-ll
  - reverse-a-linkedlist-iterative
  - insert-node-before-head-in-doubly-linked-list
  - delete-head-of-doubly-linked-list
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - reverse-a-linkedlist-iterative
  - introduction-to-doubly-ll
  - find-pairs-with-given-sum-in-doubly-linked-list
  - check-if-ll-is-palindrome-or-not
  - delete-head-of-doubly-linked-list
---

<!-- @summary -->
Reversing a doubly linked list is **swapping each node's two pointers** and then swapping the two ends — no temporary variable needed, because after the swap the way forward is sitting in `prev`. Forgetting the second half is the memorable failure: the list reports **one node from each end** while every node is present and correctly linked, just held by the wrong handles. And the value-swapping alternative is **2.4x faster in C++** and no faster at all in Python.

<!-- @theory -->
## The idea

A doubly linked list already contains its own reversal — the `prev` chain read
from the tail *is* the list backwards. Reversing it properly means making that
the official direction, which takes one move repeated at every node: **swap
`prev` and `next`**.

```
before:   head                                    tail
           |                                        |
         [0] <--> [1] <--> [2] <--> [3] <--> [4]

after:                                            head
           |                                        |
          tail
         [0] <--> [1] <--> [2] <--> [3] <--> [4]
```

Nothing moves in memory and no node is created or destroyed. Every node's two
pointers exchange places, and then the list's two handles do the same.

```cpp
void reverseDLL(List& list) {
    Node* p = list.head;
    while (p != nullptr) {
        std::swap(p->prev, p->next);
        p = p->prev;
    }
    std::swap(list.head, list.tail);
}
```

Verified against the expected sequence for every length from 0 to 300, checking
the forward chain, the backward chain, that both ends are properly terminated,
and that the nodes come back in exactly reversed order.

## No temporary is needed, and that is unusual

**Reverse a LinkedList [Iterative]** needed a third pointer, and the reason was
that overwriting `next` destroyed the only route onward — measured there as
leaving one node of five reachable. Here that problem does not arise, because the
route onward is not destroyed but **moved**: after `swap(p->prev, p->next)`, the
node's old `next` is sitting in `p->prev`. So the walk continues with
`p = p->prev`, reading the value the swap just put there.

That is a genuine difference between the two structures rather than a trick. A
singly linked list has one pointer and overwriting it loses information; a doubly
linked node has two, and swapping them loses nothing.

## The cost

Two writes per node for the swap, plus two for the ends:

| n | Pointer writes |
|---|---|
| 10 | 22 |
| 1,000 | 2,002 |
| 100,000 | 200,002 |

Exactly `2n + 2`, against a singly linked reversal's `n` — one write per node.
Twice the writes, and no temporary to carry.

## Forgetting the end swap loses nothing and breaks everything

The swap loop and the end swap are two separate statements, and omitting the
second is the characteristic mistake. Reversing `0 1 2 3 4` without it:

| Read from | Result |
|---|---|
| `head` forward | `0` |
| `tail` backward | `4` |

A five-node list reporting one element from each end. But nothing is damaged —
walking forward from `list.tail` gives the complete `4 3 2 1 0`. Every node is
present, every link is correct, and the list is simply being held by the wrong
two handles: after the swap, the old head's `next` is null because that was its
`prev`, so a forward walk from it stops immediately.

This is a different flavour of bug from the ones **Insert node before head** and
**Delete head** measured. Those left the structure genuinely inconsistent or
dangling. This one leaves a perfectly correct reversed list that you cannot see,
which means the fix is one line and no data is at risk.

## Swapping values instead — faster in C++, not in Python

The `prev` pointer allows a different approach entirely: close in from both ends
and exchange the **values**, exactly as **Find Pairs with Given Sum** closes in
from both ends. That touches each node once but runs only `n/2` iterations.

| n | Swap pointers | Relink | Swap values |
|---|---|---|---|
| 1,000 | 0.67us | 0.67us | **0.50us** |
| 1,000,000 | 2,227us | 2,088us | **914us** |

About **2.4x** faster in C++, because it does half as many iterations. Python
disagrees:

| n | Swap pointers | Relink | Swap values |
|---|---|---|---|
| 1,000 | 21.1us | **21.0us** | 25.5us |
| 200,000 | 5,273us | **4,346us** | 4,964us |

There the half-iteration advantage is eaten by the heavier per-iteration work —
two attribute reads and two writes, against one swap of two slots — and the
plain relink comes out ahead. Same three algorithms, opposite ranking.

## But it is a different operation

The now-familiar distinction, measured again: swapping pointers and relinking
both **move the nodes**, so the node set comes back in exactly reversed order.
Swapping values leaves **every node exactly where it was** and changes what it
holds. Verified across every length from 0 to 300.

If anything outside holds a pointer into the list, the first two hand it the same
node in a new position and the third hand it a new value at the same position.
**Reverse a LinkedList [Iterative]** measured that difference on a singly linked
list; it is identical here, and the speed advantage runs the other way, which
makes the trade sharper.

<!-- @intuition -->
The neat thing about this problem is that a doubly linked list is already storing its own reversal — the backward chain is the answer, and all the work is in promoting it to be the official one. That reframing makes the algorithm obvious rather than clever: swap the two pointers in every node so that each one's idea of "forward" flips, then swap the two handles so the list agrees. It also explains why no temporary variable is needed, which is the one real contrast with reversing a singly linked list. There, overwriting the single `next` pointer destroys the only route onward, so a third pointer must hold it; here the route onward is not destroyed but relocated into `prev`, and the walk can simply read it back out. The other thing worth taking is that the characteristic bug is unusually benign. Forgetting to swap the handles leaves a completely correct reversed list that reports one element from each end — nothing is corrupted, nothing dangles, and the entire list is still reachable from the pointer you did not update. That is worth recognising for what it is, because the instinct on seeing a one-element list is to suspect the loop, and the loop is fine.

<!-- @approach -->
### Optimal - Swap Each Node's Two Pointers

<!-- @idea -->
Exchange `prev` and `next` in every node, then exchange the list's head and tail.

<!-- @steps -->
1. Start at the head.
2. Swap the current node's `prev` and `next`.
3. Continue to what is now in `prev`, which is the node's original `next`.
4. Stop when that is null — the walk has passed the original tail.
5. Swap the list's `head` and `tail`.

<!-- @complexity -->
- time: O(n) — one pass, two pointer writes per node
- space: **O(1)** — one pointer, and no temporary for the route onward
- note: The one to write. It costs **2n + 2** writes against a singly linked reversal's `n`, and needs no third pointer — after the swap on step 2 the original `next` is in `prev`, so step 3 reads it back. Step 5 is separate and easy to omit: without it the list reports **one node from each end**, while remaining entirely correct and fully reachable from the handle you did not update.

<!-- @code cpp -->
```cpp
void reverseDLL(List& list) {
    Node* p = list.head;
    while (p != nullptr) {
        std::swap(p->prev, p->next);
        p = p->prev;
    }
    std::swap(list.head, list.tail);
}
```

<!-- @annotations -->
- 5: `p->prev`, not `p->next` — the swap on the line above put the original `next` here. This is why no temporary is needed, unlike the singly linked reversal.
- 7: Separate from the loop, and the line that gets forgotten. Without it a five-node list reads as `0` forward and `4` backward, with every node still present and correctly linked.
- 4: Swapping the two fields rather than assigning through a temporary — the node's own pointers are the only storage required.
- 2: Starting at the head and following the *original* forward direction, which the swap relocates one field to the left as it goes.

<!-- @code java -->
```java
static void reverseDLL(List list) {
    Node p = list.head;
    while (p != null) {
        Node temp = p.prev;
        p.prev = p.next;
        p.next = temp;
        p = p.prev;
    }
    Node temp = list.head;
    list.head = list.tail;
    list.tail = temp;
}
```

<!-- @annotations -->
- 4: Java has no `swap`, so the exchange is written out — but the temporary here holds a field during one exchange, not the route onward, which is a different thing from the singly linked version's third pointer.

<!-- @code python -->
```python
def reverse_dll(lst):
    p = lst.head
    while p is not None:
        p.prev, p.next = p.next, p.prev
        p = p.prev
    lst.head, lst.tail = lst.tail, lst.head


# Tuple assignment does both swaps, and `p = p.prev` reads back the
# original `next` that the swap just moved there -- no temporary
# needed, which the singly linked reversal could not manage.
```

<!-- @annotations -->
- 4: Python evaluates the whole right-hand side first, so this is a genuine simultaneous swap — the same property that made the singly linked reversal's one-line form safe.

<!-- @approach -->
### Three-Pointer Relink

<!-- @idea -->
Walk the list carrying a trailing pointer, assigning both links of each node explicitly rather than swapping them.

<!-- @steps -->
1. Record the current head as the future tail, before anything moves.
2. Start with a null trailing pointer and the current node at the head.
3. Save the current node's `next` before overwriting it.
4. Point the current node's `next` at the trailing pointer and its `prev` at the saved node.
5. Advance the trailing pointer to the current node and the current node to the saved one.
6. When the walk ends, the trailing pointer is the new head.

<!-- @complexity -->
- time: O(n) — one pass, two pointer writes per node
- space: **O(1)** — three pointers
- note: The singly linked reversal from **Reverse a LinkedList [Iterative]** with the `prev` chain maintained alongside. It needs the saved-`next` temporary that the swap version avoids, because it overwrites `next` before reading it. Measured slightly **faster** than the swap version at a million nodes — 2,088us against 2,227us — and it is the fastest of the three in Python, which is the opposite of the C++ ranking.

<!-- @code cpp -->
```cpp
void reverseRelink(List& list) {
    Node* prev = nullptr;
    Node* cur = list.head;
    list.tail = list.head;
    while (cur != nullptr) {
        Node* next = cur->next;
        cur->next = prev;
        cur->prev = next;
        prev = cur;
        cur = next;
    }
    list.head = prev;
}
```

<!-- @annotations -->
- 6: The saved `next`, which this version genuinely needs — line 7 overwrites the field before line 10 would read it. The swap version avoids this because a swap loses nothing.
- 4: Recording the future tail **before** the loop, while `list.head` still holds the original head.
- 12: The trailing pointer ends on the last node visited, which is the new head — the same reasoning as the singly linked version.

<!-- @code java -->
```java
static void reverseRelink(List list) {
    Node prev = null;
    Node cur = list.head;
    list.tail = list.head;
    while (cur != null) {
        Node next = cur.next;
        cur.next = prev;
        cur.prev = next;
        prev = cur;
        cur = next;
    }
    list.head = prev;
}
```

<!-- @annotations -->
- 8: Setting both links of the current node, which is the whole difference from the singly linked version — that one writes `next` alone.

<!-- @code python -->
```python
def reverse_relink(lst):
    prev = None
    cur = lst.head
    lst.tail = lst.head
    while cur is not None:
        nxt = cur.next
        cur.next = prev
        cur.prev = nxt
        prev = cur
        cur = nxt
    lst.head = prev
```

<!-- @annotations -->
- 6: The habit this topic keeps rewarding — read the route onward before overwriting the field that holds it.

<!-- @approach -->
### Swap Values from Both Ends

<!-- @idea -->
Close two pointers in from the head and the tail, exchanging the values they hold.

<!-- @steps -->
1. Put one pointer on the head and one on the tail.
2. While they have not met and have not crossed, exchange the two values.
3. Advance the low pointer forward and the high pointer backward.
4. Stop when they meet or cross — every pair has been exchanged.

<!-- @complexity -->
- time: O(n) — but only `n/2` iterations, since both pointers move each time
- space: **O(1)** — two pointers
- note: **2.4x faster in C++** — 914us against 2,227us at a million nodes — because it runs half as many iterations. In Python it is *not* faster, at 4,964us against the relink's 4,346us, since each iteration does more work. And it is a **different operation**: the nodes never move and their contents change, so anything holding a pointer into the list sees a new value at the same address rather than the same value at a new position. Only available at all because `prev` allows closing in from the back.

<!-- @code cpp -->
```cpp
void reverseValues(List& list) {
    Node* a = list.head;
    Node* b = list.tail;
    while (a != nullptr && b != nullptr && a != b && b->next != a) {
        std::swap(a->data, b->data);
        a = a->next;
        b = b->prev;
    }
}
```

<!-- @annotations -->
- 4: The same four-part condition as **Find Pairs with Given Sum**, and for the same reason — both pointers move each iteration, so they can cross without ever being equal.
- 5: Exchanging **data**, not links. The nodes stay exactly where they are, which is the semantic difference from the other two approaches.
- 7: `b->prev` — the line that needs a doubly linked list, and the reason this approach exists here and not in the singly linked reversal.

<!-- @code java -->
```java
static void reverseValues(List list) {
    Node a = list.head;
    Node b = list.tail;
    while (a != null && b != null && a != b && b.next != a) {
        int temp = a.data;
        a.data = b.data;
        b.data = temp;
        a = a.next;
        b = b.prev;
    }
}
```

<!-- @annotations -->
- 4: `a != b` catches an odd-length list's middle node; `b.next != a` catches an even-length list's pointers crossing past each other.

<!-- @code python -->
```python
def reverse_values(lst):
    a, b = lst.head, lst.tail
    while a is not None and b is not None and a is not b and b.next is not a:
        a.data, b.data = b.data, a.data
        a = a.next
        b = b.prev


# Half as many iterations as the pointer swap, and NOT faster in
# Python -- each iteration does two attribute reads and two writes
# where the pointer swap does one exchange.
```

<!-- @annotations -->
- 4: One tuple assignment for the exchange, which is still two attribute reads and two writes at the bytecode level.

<!-- @example -->

<!-- @input -->
`0 <-> 1 <-> 2 <-> 3 <-> 4`

<!-- @output -->
`4 <-> 3 <-> 2 <-> 1 <-> 0`

<!-- @why -->
Traces the swap and shows where the walk gets its next step from.

<!-- @walkthrough -->
1. The walk starts at node 0, whose `prev` is null and whose `next` is node 1.
2. Swapping them gives node 0 a `prev` of node 1 and a `next` of null — it is now the tail.
3. The walk continues to `p->prev`, which is node 1: the value the swap just placed there.
4. Node 1's pointers are exchanged in the same way, and the walk moves on to node 2, and so on.
5. After node 4 the walk reads its `prev`, which now holds its original `next` — null — and stops.
6. Every node now points the other way, but `head` still names node 0 and `tail` still names node 4.
7. Swapping the two handles finishes the job: `head` becomes node 4 and `tail` becomes node 0.

<!-- @example -->

<!-- @input -->
The same reversal with the head/tail swap omitted

<!-- @output -->
`head` reads one node forward, `tail` reads one node backward, and nothing is broken

<!-- @why -->
The characteristic bug, and an unusually harmless one.

<!-- @walkthrough -->
1. Every node's pointers have been exchanged correctly, so the list is properly reversed.
2. But `head` still names node 0, whose `next` is now null — that was its `prev` before the swap.
3. Walking forward from `head` therefore stops immediately and reports `0`.
4. Walking backward from `tail` — still node 4 — hits the same wall and reports `4`.
5. A five-node list appears to hold one element from each end.
6. Nothing is corrupted: walking **forward** from `list.tail` produces the complete `4 3 2 1 0`.
7. The entire list is reachable from the handle that was not updated, so the fix is one line and no data was ever at risk.

<!-- @example -->

<!-- @input -->
The same list reversed by swapping values instead of pointers

<!-- @output -->
The same sequence, with every node still at its original address

<!-- @why -->
Separates two operations that produce identical output, as **Reverse a LinkedList [Iterative]** did for the singly linked case.

<!-- @walkthrough -->
1. Two pointers close in from the head and the tail, exchanging the values they find.
2. After `n/2` iterations every pair has been exchanged and the sequence reads backwards.
3. No link was touched, so every node is exactly where it started.
4. Checked across every length from 0 to 300: the node addresses come back in the **same** order for this approach and in exactly **reversed** order for the other two.
5. So a caller holding a pointer to the second node sees a different value there afterwards, rather than finding that node moved.
6. In C++ this is also the fastest of the three at 914us against 2,227us, because it runs half as many iterations.
7. In Python it is not faster at all — 4,964us against the relink's 4,346us — since each iteration costs more.

<!-- @example -->

<!-- @input -->
Counting the pointer writes for each list length

<!-- @output -->
Exactly `2n + 2`

<!-- @why -->
Puts the cost of the extra chain in concrete terms against the singly linked equivalent.

<!-- @walkthrough -->
1. Each node has both of its pointers written once, which is two writes per node.
2. The list's `head` and `tail` are then exchanged, which is two more.
3. Measured: 22 writes for ten nodes, 2,002 for a thousand, and 200,002 for a hundred thousand.
4. A singly linked reversal writes one pointer per node — `n` in total.
5. So the doubly linked reversal costs twice the writes, which is the price of maintaining two chains.
6. In exchange it needs no third pointer, because a swap relocates the route onward rather than destroying it.
7. That is the whole trade: twice the writes, no temporary, and a structure that was already storing its own reversal.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the list with the two chains separated as in the other doubly linked containers — `next` arrows above the nodes, `prev` arrows below — because this algorithm is literally the operation of exchanging those two rows. Colour them distinctly and label them, then run the swap node by node: at each node, the arrow above and the arrow below **trade places**, animated as a crossing rather than as two separate rewrites, so the reader sees one gesture per node instead of two assignments. Follow the walking marker carefully, because the interesting detail is where it goes next: after the crossing at node 0, highlight that the marker reads `prev` — the field it just moved the forward link into — and travels along it to node 1. Annotate that with no temporary needed, contrasted against a small inset of the singly linked reversal where a third pointer has to be held. When every node has flipped, freeze with the `head` and `tail` labels still on the original ends and let the reader see that the arrows all point the right way while the handles do not, before the final beat swaps the two labels. The middle panel is that bug held open. Omit the last beat and run the two reads: from `head`, one node then a wall; from `tail`, one node then a wall. Print `forward=[0]` and `backward=[4]`. Then, crucially, walk **forward from `tail`** and let the complete `4 3 2 1 0` unroll, with a caption that nothing is broken and the whole list is reachable from the handle that was not updated. Close with the three approaches as cost bars in both languages side by side, since C++ ranks value-swapping fastest and Python ranks it slowest — two charts with opposite orderings, which is the point.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"theIdea":{"observation":"a doubly linked list already contains its own reversal -- the prev chain read from the tail IS the list backwards","algorithm":"swap prev and next in every node, then swap the list's head and tail","nothingMoves":"no node is created, destroyed or relocated in memory"},"noTemporaryNeeded":{"why":"after swap(p->prev, p->next) the node's original `next` is sitting in `p->prev`, so the walk continues with p = p->prev","contrastWith":"Reverse a LinkedList [Iterative] needed a third pointer, because overwriting the single `next` destroyed the only route onward -- measured there as leaving one node of five reachable","theRealDifference":"a singly linked node has one pointer and overwriting it loses information; a doubly linked node has two, and swapping them loses nothing"},"cost":{"formula":"2n + 2 -- two writes per node plus two for the ends","measured":[{"n":10,"writes":22},{"n":1000,"writes":2002},{"n":100000,"writes":200002}],"comparedToSingly":"a singly linked reversal writes one pointer per node, n in total -- twice the writes here, and no temporary to carry"},"correctness":{"tested":"every length from 0 to 300","checked":["the forward chain","the backward chain","both ends terminated","node identity"],"failures":0,"languages":["C++","Python"]},"theCharacteristicBug":{"omission":"the head/tail swap, which is a separate statement from the loop","onFiveNodes":{"readFromHeadForward":"0","readFromTailBackward":"4"},"whyItLooksLikeThat":"after the swap the old head's `next` is null, because that was its `prev`","whatIsActuallyWrong":"nothing -- walking FORWARD from list.tail produces the complete 4 3 2 1 0","diagnosis":"a perfectly correct reversed list held by the wrong two handles; the fix is one line and no data was ever at risk","contrastWithOtherDLLBugs":"Insert node before head and Delete head both left the structure genuinely inconsistent or dangling; this one does not"},"benchCpp":{"unit":"microseconds, median of fresh-list single calls","rows":[{"n":1000,"swapPointers":0.67,"relink":0.67,"swapValues":0.50},{"n":1000000,"swapPointers":2227,"relink":2088,"swapValues":914}],"verdict":"swapping values is about 2.4x faster, because it runs only n/2 iterations"},"benchPython":{"unit":"microseconds, median of fresh-list single calls","rows":[{"n":1000,"swapPointers":21.1,"relink":21.0,"swapValues":25.5},{"n":200000,"swapPointers":5273,"relink":4346,"swapValues":4964}],"verdict":"the half-iteration advantage is eaten by heavier per-iteration work -- two attribute reads and two writes against one exchange -- and the plain relink comes out ahead","note":"same three algorithms, opposite ranking"},"movingNodesVsMovingValues":{"swapPointersAndRelink":"MOVE the nodes -- the node set comes back in exactly reversed order","swapValues":"leaves every node exactly where it was and changes what it holds","verified":"every length from 0 to 300","consequence":"a caller holding a pointer into the list gets the same node in a new position from the first two, and a new value at the same position from the third","sameDistinctionAs":"Reverse a LinkedList [Iterative], with the speed advantage running the other way here"},"recommendation":"swap each node's two pointers, then swap the ends -- O(1) space, no temporary, and it moves nodes rather than values","lesson":"the structure was already storing its own reversal; the algorithm just promotes the backward chain to be the official one"}
```

<!-- @highlights -->
- The two chains are drawn separately — `next` arrows above the nodes, `prev` arrows below — and distinctly coloured, since the algorithm is literally exchanging those two rows.
- The swap runs node by node, with the arrow above and the arrow below **trading places** as a single crossing gesture rather than two rewrites.
- The walking marker is followed closely, because where it goes next is the interesting detail.
- After the crossing at node 0, the marker is shown reading `prev` — the field the forward link was just moved into — and travelling along it.
- That is annotated no temporary needed, against a small inset of the singly linked reversal holding a third pointer.
- When every node has flipped, the animation freezes with `head` and `tail` still on the original ends.
- The reader sees the arrows all pointing correctly while the handles do not, before a final beat swaps the labels.
- The middle panel holds that bug open: the last beat is omitted and both reads are run.
- From `head`, one node then a wall; from `tail`, one node then a wall — printed as `forward=[0]` and `backward=[4]`.
- Then the walk goes **forward from `tail`** and the complete `4 3 2 1 0` unrolls.
- The caption notes nothing is broken and the whole list is reachable from the handle that was not updated.
- The close puts the three approaches as cost bars in both languages, side by side.
- C++ ranks value-swapping fastest and Python ranks it slowest.
- Two charts with opposite orderings is the point of that panel.

<!-- @edgeCases -->
- The empty list — the loop never runs, and swapping two null handles leaves them null.
- A single node — its two null pointers are exchanged harmlessly, and swapping the handles leaves both naming the same node.
- A two-node list — the shortest case where the handles genuinely change which node they name.
- The new head's `prev` — must be null afterwards, and is, because it was the old tail's `next`.
- The new tail's `next` — likewise null, because it was the old head's `prev`.
- Reversing twice — restores the original list exactly, which is the cheapest available property test.
- Omitting the head/tail swap — leaves a correct reversed list reporting one node from each end.
- An outside pointer into the list — survives the pointer swap with its value intact and its position reversed; sees a changed value in place after the value swap.
- The value-swap on an odd-length list — the middle node is its own partner and is left alone by the `a != b` test.
- The value-swap on an even-length list — the two central pointers cross without meeting, which the `b->next != a` test catches.
- A list held only by its head — the algorithm needs the tail to swap the handles, and to start the value-swap version at all.

<!-- @pitfalls -->
- Forgetting to swap `head` and `tail`. The list is correctly reversed and reports one node from each end.
- Diagnosing that as a loop bug. The loop is fine; the entire list is reachable from the handle that was not updated.
- Continuing the walk with `p = p->next` after the swap. That field now holds the original `prev`, so the walk goes backwards.
- Carrying a third pointer out of habit. The swap relocates the route onward rather than destroying it, so none is needed.
- Swapping values when the caller holds node pointers. The nodes stay put and their contents change, which is a different operation.
- Assuming the value swap is always faster. It is 2.4x faster in C++ and slower than the relink in Python.
- Using only `a != b` in the value-swap condition. Both pointers move each iteration, so they can cross without meeting.
- Overwriting `next` before reading it in the relink version. That one genuinely needs its saved temporary.
- Forgetting to record the future tail before the relink loop starts. Once `list.head` has moved, the original head is gone.
- Expecting the reversal to allocate or free anything. It does neither — every node stays at its own address.
- Reversing a list held only by its head. Both the handle swap and the value-swap version need the tail.

<!-- @doubt -->
### Why is no temporary pointer needed here?

<!-- @answer -->
Because swapping loses nothing, where overwriting does. **Reverse a LinkedList [Iterative]** needed a third pointer for a specific reason: assigning to `next` destroyed the only route to the rest of the list, measured there as leaving **one node of five** reachable. A doubly linked node has two pointers, and `swap(p->prev, p->next)` does not discard either — it relocates them. So after the swap the node's original `next` is sitting in `p->prev`, and the walk continues by reading it back out with `p = p->prev`. That is a genuine structural difference rather than a trick, and it is worth noticing which direction it runs: the doubly linked version writes **twice** as many pointers, `2n + 2` against `n`, and needs one **fewer** variable. The relink approach in this container is the other trade — it overwrites rather than swaps, so it does need the saved `next`.

<!-- @doubt -->
### My reversed list only shows one element. What did I break?

<!-- @answer -->
Almost certainly nothing — you have forgotten to swap `head` and `tail`, and the list is correct. After every node's pointers are exchanged, the old head's `next` holds what used to be its `prev`, which is null. So walking forward from `head` stops on the first node and reports one element, and walking backward from `tail` does the same at the other end. On `0 1 2 3 4` that reads as `0` forward and `4` backward. The diagnostic that settles it in one step: walk **forward from `list.tail`**, which produces the complete `4 3 2 1 0`. Every node is present, every link is right, and the whole list is reachable from the handle you did not update. This is unusually benign compared with the other doubly linked mistakes — **Insert node before head** and **Delete head** both left structures that were genuinely inconsistent or pointing at freed memory. Here the fix is one line and nothing was ever at risk.

<!-- @doubt -->
### Should I swap the values instead? It looks simpler.

<!-- @answer -->
It is faster in C++ and slower in Python, and it is a different operation — so the answer depends on both your language and what your callers hold. On speed: it runs only `n/2` iterations because both pointers move each time, which made it **2.4x faster** in C++, 914us against 2,227us at a million nodes. In Python that advantage disappears entirely, because each iteration does two attribute reads and two writes where the pointer swap does one exchange — measured at 4,964us against the plain relink's 4,346us, so it comes **last**. On semantics: swapping values leaves every node exactly where it was and changes its contents, while the other two move the nodes themselves. Verified across every length from 0 to 300, the node addresses come back in the same order for the value swap and in exactly reversed order for the others. If anything outside holds a node pointer, those are opposite outcomes.

<!-- @doubt -->
### How does this compare with reversing a singly linked list?

<!-- @answer -->
Twice the pointer writes and one fewer variable. Reversing a singly linked list writes one pointer per node — `n` in total — and needs a third pointer to hold the route onward before it is overwritten. The doubly linked version writes both of each node's pointers plus the two handles, which is exactly **2n + 2**: verified at 22 writes for ten nodes, 2,002 for a thousand and 200,002 for a hundred thousand. In exchange it needs no temporary, because a swap relocates rather than destroys. There is also a conceptual difference worth having: a singly linked list has to be *rebuilt* backwards, one link at a time, whereas a doubly linked list already **contains** its reversal — the `prev` chain read from the tail is the answer, and the algorithm is really just promoting that chain to be the official direction. That is why the whole thing is two statements.

<!-- @doubt -->
### Do I need the tail, or can I work from the head alone?

<!-- @answer -->
You need it, for both the pointer-swap and the value-swap approaches, and for different reasons. The pointer swap can *do* its loop from the head alone, but its last statement exchanges `head` and `tail`, so a list that does not store a tail has nothing to exchange — and worse, after the loop the original head is the new tail and the new head is unreachable except by having kept a pointer to the old tail. The value-swap version cannot even start without a tail, since it closes in from both ends. If your structure genuinely keeps only a head pointer, you must first walk to the end to find the tail, which turns a one-pass algorithm into two. That is one more argument for the convention **Introduction to Doubly LL** described: a doubly linked list is normally held by both ends, because a `prev` chain you cannot enter from the back is most of the cost of the structure with little of the benefit.

<!-- @doubt -->
### What is the cheapest way to test a reversal?

<!-- @answer -->
Reverse twice and check you got the original back — it is one line, needs no expected output, and catches most mistakes. It will not catch everything, though, and it is worth knowing what it misses: the forgotten head/tail swap is **self-cancelling** under a double reversal, because running the buggy version twice restores both the pointers and the handles. So pair it with a direct check of the sequence in **both** directions, plus an assertion that the new head's `prev` and the new tail's `next` are null. That is exactly what the verification behind this container did across every length from 0 to 300 — forward chain, backward chain, both ends terminated, and node identity — which is also how the moving-nodes-versus-moving-values distinction was confirmed rather than assumed.
