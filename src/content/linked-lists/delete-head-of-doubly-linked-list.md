---
id: delete-head-of-doubly-linked-list
topic: Linked Lists
title: Delete head of Doubly Linked List
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-doubly-ll
  - insert-node-before-head-in-doubly-linked-list
  - deletion-of-the-head-of-ll
  - introduction-to-singly-linkedlist
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - introduction-to-doubly-ll
  - insert-node-before-head-in-doubly-linked-list
  - deletion-of-the-head-of-ll
  - reverse-a-doubly-linked-list
  - find-pairs-with-given-sum-in-doubly-linked-list
---

<!-- @summary -->
Insertion's mistakes were silent; deletion's leave **pointers into freed memory**. Forget to clear the new head's `prev` and it holds the deleted node's address — demonstrated here by watching the very next allocation **reuse that exact block**, after which reading through the stale pointer returned a completely unrelated value. Forget the tail on the last deletion and the list is simultaneously empty going forward and non-empty going backward. Two pointer writes, one branch, and a circular sentinel removes the branch for free — unlike insertion, where it cost an extra write.

<!-- @theory -->
## The operation

Remove the front node. Two writes: `head` moves forward, and whatever is now at
the front must be told it has nothing before it.

```
before:   head                          tail
           |                              |
           v                              v
         [1] <--> [2] <--> [3] <--> [4]

after:            head                  tail
                   |                      |
                   v                      v
                 [2] <--> [3] <--> [4]
                  ^
                  prev must become null
```

```cpp
void deleteHead(List& list) {
    if (list.head == nullptr) return;
    Node* dead = list.head;
    list.head = dead->next;
    if (list.head != nullptr) list.head->prev = nullptr;
    else                      list.tail = nullptr;
    delete dead;
}
```

Two pointer writes either way, against **one** for a singly linked head deletion
— which only has to move `head`. Verified by deleting every possible number of
heads from every list length up to 200 — **20,301 cases** — checking the forward
chain, the backward chain, that the new head's `prev` is null, and that an
emptied list has *both* ends null. Zero failures.

## The mistakes leave dangling pointers, not just wrong answers

This is the real difference from **Insert node before head**. There, forgetting a
write left a list that was merely inconsistent — wrong, but safe to read.
Here the node is **freed**, so a missed write leaves a pointer aimed at memory
that no longer belongs to the list.

**Forgetting to clear the new head's `prev`.** After deleting the front of
`0 1 2`, the new head's `prev` still holds the deleted node's address. That is
not a theoretical hazard — allocating one more node immediately afterwards:

```
freed node was at      0x102da99e0
new head's prev is     0x102da99e0   <-- same address: dangling
a fresh allocation is  0x102da99e0   <-- reused the freed block
reading head->prev->data now gives 999, not the deleted value
```

The allocator handed the block straight back, and the stale pointer now reads a
completely unrelated node. Nothing crashed and nothing warned.

**Forgetting the tail on the last deletion.** Delete the only node without
clearing `tail`, and the list reports `head == nullptr` — empty — while `tail`
still points at the freed node. The list is empty in one direction and not in the
other, and any backward walk reads freed memory immediately.

Deleting from an already-empty list is safe and is a no-op: the guard on the
first line returns, leaving both ends null. Calling it twice on an empty list
changes nothing.

## Read before you free

`dead->next` is read on the line *before* `delete dead`, and that ordering is not
stylistic. **Deletion of the head of LL** measured this in the singly linked
case, where freeing first left the head pointing at reclaimed memory. The rule is
the same here and there is simply more of it: a doubly linked node holds two
links, and both are gone the instant it is freed.

## The circular sentinel is free here

**Insert node before head** measured that a circular sentinel removes every
empty-list branch, at the cost of one extra pointer write — four instead of
three. Deletion is a better bargain:

| Version | Writes | Branch? |
|---|---|---|
| Direct | 2 | yes |
| Circular sentinel | **2** | **no** |

The same two writes, and the branch disappears. With a sentinel, `dead->next` is
never null — on the last real node it is the sentinel — so `dead->next->prev = d`
needs no guard, and there is no "the list just became empty" case to detect at
all. Verified on the same 20,301 cases with zero failures.

That asymmetry is worth noticing. Insertion has to decide whether a **tail**
exists; deletion has to decide whether one **still** exists. The sentinel answers
both by making the question meaningless, but only insertion pays for it.

<!-- @intuition -->
The shape of this operation is the same as inserting at the front, run backwards, and the interesting difference is not in the pointer arithmetic but in what happens when you get it wrong. An insertion that skips a write leaves a list that disagrees with itself — bad, but every pointer in it still aims at a real node. A deletion that skips a write leaves a pointer aimed at memory the allocator has taken back, and the demonstration here is worth remembering precisely because it was so undramatic: the very next allocation reused the block, the stale pointer started reading someone else's data, and nothing complained. That is the category of bug that survives a test suite and surfaces months later as something unrelated. The other thing worth carrying is the small asymmetry between this and insertion. Both have exactly one branch, and both branches exist for the same reason — the list may have no tail, or may be about to have none. A circular sentinel dissolves the question in both cases, but it charges an extra write for insertion and nothing at all for deletion, which is a fair illustration that "add a sentinel" is a design decision with a measurable price rather than a free simplification.

<!-- @approach -->
### Optimal - Move the Head and Detach

<!-- @idea -->
Save the front node, move the head forward, tell the new front it has nothing before it, and free the old one.

<!-- @steps -->
1. If the list is empty, return — there is nothing to delete.
2. Save a pointer to the current head, which is the node being removed.
3. Move the list's `head` to that node's `next`.
4. If there is now a head, clear its `prev`, since it is the front.
5. Otherwise the list is now empty, so clear the `tail` as well.
6. Free the saved node — after step 3 has already read its `next`.

<!-- @complexity -->
- time: **O(1)** — two pointer writes, regardless of the list's length
- space: O(1)
- note: The one to write. Two writes against a singly linked deletion's one, and exactly one of steps 4 and 5 runs. Step 4 is the one that gets forgotten, and unlike insertion's equivalent mistake it leaves a **dangling** pointer: the new head's `prev` holds a freed address, and the next allocation may reuse that block. Step 6 must come last, since step 3 reads a field of the node being freed.

<!-- @code cpp -->
```cpp
void deleteHead(List& list) {
    if (list.head == nullptr) return;
    Node* dead = list.head;
    list.head = dead->next;
    if (list.head != nullptr) list.head->prev = nullptr;
    else                      list.tail = nullptr;
    delete dead;
}
```

<!-- @annotations -->
- 5: Forgetting this leaves the new head's `prev` pointing at the freed node. Measured, the next allocation reused that exact block and the stale pointer began reading a different node's data.
- 6: The other half, and the one that only runs once — on the deletion that empties the list. Skip it and `head` is null while `tail` still points at freed memory.
- 4: Reading `dead->next` **before** line 7 frees the node. The same ordering rule **Deletion of the head of LL** established, with two links to lose here instead of one.
- 2: Deleting from an empty list is a no-op rather than an error — both ends stay null, and calling it repeatedly is safe.

<!-- @code java -->
```java
static void deleteHead(List list) {
    if (list.head == null) return;
    Node dead = list.head;
    list.head = dead.next;
    if (list.head != null) list.head.prev = null;
    else                   list.tail = null;
    dead.next = null;
    dead.prev = null;
}
```

<!-- @annotations -->
- 7: No `delete`, but detaching the removed node still matters — leaving its links set keeps its former neighbours reachable from it, which can hold objects alive longer than intended.

<!-- @code python -->
```python
def delete_head(lst):
    if lst.head is None:
        return
    dead = lst.head
    lst.head = dead.next
    if lst.head is not None:
        lst.head.prev = None
    else:
        lst.tail = None
    dead.next = None


# Python has no dangling-pointer failure here, but the same two
# writes are still required for the list to be self-consistent --
# and a stale `prev` still keeps the removed node alive.
```

<!-- @annotations -->
- 7: The garbage collector removes the memory-safety consequence, not the correctness one: a list whose new head still has a `prev` is simply wrong when read backwards.

<!-- @approach -->
### The General Delete-Node

<!-- @idea -->
Write the operation for unlinking *any* node, and let head deletion be the case where the node has nothing before it.

<!-- @steps -->
1. If the node has a predecessor, point that predecessor's `next` past this node; otherwise the node was the head, so move the head forward.
2. If the node has a successor, point that successor's `prev` back past this node; otherwise the node was the tail, so move the tail backward.
3. Free the node.
4. Note that no search happened — both neighbours were already known.

<!-- @complexity -->
- time: **O(1)** — at most two pointer writes, wherever the node sits
- space: O(1)
- note: The operation the whole structure exists for, and head deletion is one of its four cases — the branch where `prev` is null. **Introduction to Doubly LL** measured the payoff: two writes here against **98,997 links followed** for the singly linked equivalent on a node near the end of a hundred-thousand-node list. Writing this one function gives head deletion, tail deletion and middle deletion together.

<!-- @code cpp -->
```cpp
void deleteNode(List& list, Node* node) {
    if (node->prev != nullptr) node->prev->next = node->next;
    else                       list.head = node->next;

    if (node->next != nullptr) node->next->prev = node->prev;
    else                       list.tail = node->prev;

    delete node;
}
```

<!-- @annotations -->
- 3: This `else` is head deletion. Calling `deleteNode(list, list.head)` takes it every time, which is why the two operations need not both be written.
- 6: And this `else` is tail deletion. All four combinations of the two branches are the four positions a node can occupy.
- 2: Both neighbours are already in hand — no search, which is exactly what a singly linked list cannot do.

<!-- @code java -->
```java
static void deleteNode(List list, Node node) {
    if (node.prev != null) node.prev.next = node.next;
    else                   list.head = node.next;

    if (node.next != null) node.next.prev = node.prev;
    else                   list.tail = node.prev;

    node.prev = null;
    node.next = null;
}
```

<!-- @annotations -->
- 8: Clearing the removed node's own links last, after both branches above have finished reading them.

<!-- @code python -->
```python
def delete_node(lst, node):
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
```

<!-- @annotations -->
- 2: Reading `node.prev` and `node.next` throughout, and only clearing them at the end — the same read-before-you-overwrite discipline the whole topic has needed.

<!-- @approach -->
### Circular Sentinel

<!-- @idea -->
With a permanent dummy node whose links never become null, deleting the front needs no check for whether the list is about to become empty.

<!-- @steps -->
1. If the sentinel's `next` is the sentinel itself, the list is empty — return.
2. Otherwise the node after the sentinel is the one to remove.
3. Point the sentinel's `next` past it.
4. Point that node's successor's `prev` back at the sentinel — no null check needed, since the successor always exists.
5. Free the removed node.

<!-- @complexity -->
- time: **O(1)** — two pointer writes, with no branch
- space: O(1), plus one permanent node for the whole list
- note: Cheaper than it was for insertion. **Insert node before head** measured the circular sentinel costing one extra write — four against three — to remove its branch. Here it removes the branch for **the same two writes**, because `dead->next` is never null: on the last real node it is the sentinel, so step 4 writes into the sentinel, which is exactly where the tail-side link belongs. Verified on the same 20,301 cases.

<!-- @code cpp -->
```cpp
void circularDeleteFront(Node* sentinel) {
    if (sentinel->next == sentinel) return;
    Node* dead = sentinel->next;
    sentinel->next = dead->next;
    dead->next->prev = sentinel;
    delete dead;
}
```

<!-- @annotations -->
- 5: No null check, and none is possible to need — `dead->next` always points at a real node, which on the last deletion is the sentinel itself.
- 2: The only test in the function, and it asks whether the list is empty rather than whether it is *becoming* empty — which is the case the direct version has to handle.
- 4: Reading `dead->next` before line 6 frees the node, exactly as in the direct version.

<!-- @code java -->
```java
static void circularDeleteFront(Node sentinel) {
    if (sentinel.next == sentinel) return;
    Node dead = sentinel.next;
    sentinel.next = dead.next;
    dead.next.prev = sentinel;
    dead.next = null;
    dead.prev = null;
}
```

<!-- @annotations -->
- 2: Reference comparison against the sentinel, which is how an empty circular list identifies itself — there is no null to test.

<!-- @code python -->
```python
def circular_delete_front(sentinel):
    if sentinel.next is sentinel:
        return
    dead = sentinel.next
    sentinel.next = dead.next
    dead.next.prev = sentinel
    dead.next = None
    dead.prev = None


# Two writes and no branch -- the same cost as the direct version,
# where for INSERTION the sentinel cost one write more.
```

<!-- @annotations -->
- 6: The line that would need a null guard without the circularity, and does not need one with it.

<!-- @example -->

<!-- @input -->
Deleting the head of `1 <-> 2 <-> 3 <-> 4`

<!-- @output -->
`2 <-> 3 <-> 4`

<!-- @why -->
The ordinary case, showing which two writes are required and why the order matters.

<!-- @walkthrough -->
1. The list is not empty, so the guard passes.
2. A pointer to the node holding 1 is saved, because it is about to be unreachable from the list.
3. The list's `head` is moved to that node's `next`, the node holding 2 — write one, and it reads a field of the doomed node.
4. There is a head, so the node holding 2 has its `prev` cleared — write two.
5. The tail is untouched; the back of the list did not change.
6. Only now is the saved node freed, after both reads of its fields have happened.
7. Reading forward gives `2 3 4` and reading backward from the tail gives `4 3 2` — the two chains agree.

<!-- @example -->

<!-- @input -->
The same deletion with the new head's `prev` left uncleared, followed by one more allocation

<!-- @output -->
The freed block is handed straight back, and the stale pointer reads unrelated data

<!-- @why -->
Shows that this is a live use-after-free rather than a tidiness issue, without needing a sanitiser to say so.

<!-- @walkthrough -->
1. The head is deleted correctly except that the new head's `prev` is never cleared.
2. That pointer therefore still holds the address of the node that was just freed.
3. Printing both confirms it: the freed node was at `0x102da99e0` and the new head's `prev` reads `0x102da99e0`.
4. A single further allocation is then made, for an unrelated node holding 999.
5. The allocator returns **the same block** — the fresh node is also at `0x102da99e0`.
6. Reading `head->prev->data` now returns **999**, which belongs to a node that has nothing to do with this list.
7. Nothing crashed, nothing warned, and a forward-only test sees a perfectly correct list.

<!-- @example -->

<!-- @input -->
Deleting the only node of a one-element list, without clearing the tail

<!-- @output -->
`head` is null while `tail` points at freed memory

<!-- @why -->
The other single-line omission, and the branch that runs exactly once.

<!-- @walkthrough -->
1. The list holds one node, so deleting the head empties it.
2. `head` is moved to that node's `next`, which is null — the list is now empty going forward.
3. Because there is no new head, the correct code clears the `tail`; omitting that leaves it pointing at the node about to be freed.
4. After the free, `head` is null and `tail` holds a stale address.
5. The list therefore reports itself as empty in one direction and non-empty in the other.
6. Any backward walk starts by dereferencing freed memory.
7. This branch executes only on the deletion that empties the list, which is the one a test that deletes "a few" nodes never reaches.

<!-- @example -->

<!-- @input -->
The circular sentinel version, compared with the same structure used for insertion

<!-- @output -->
Two writes and no branch — where insertion needed four instead of three

<!-- @why -->
Shows that a sentinel's price is measurable and differs by operation.

<!-- @walkthrough -->
1. The direct deletion needs a branch because the list may be **about to become** empty, which changes whether the tail must move.
2. With a circular sentinel there is no such case: `dead->next` always points at a real node, which on the last deletion is the sentinel.
3. Writing `dead->next->prev = sentinel` therefore lands in the sentinel when the list empties, which is precisely where the tail-side link belongs.
4. That is **two** writes with no test — the same count as the direct version, with the branch removed for nothing.
5. Insertion was not so lucky: **Insert node before head** measured the sentinel costing a fourth write to remove its branch.
6. The asymmetry is that insertion asks whether a tail exists while deletion asks whether one still will, and only the first needs an extra assignment either way.
7. Verified across the same 20,301 delete-k-from-n cases, with zero failures.

<!-- @visualization linked-list -->

<!-- @description -->
Keep the two chains visually separate as in the insertion container — `next` arrows above the nodes, `prev` arrows below — because again every mistake here is a lower-chain mistake. Run the deletion on `1 <-> 2 <-> 3 <-> 4` as three beats: the doomed node highlighted and its `next` read, the `head` label sliding to node 2, and node 2's downward `prev` arrow being cut and left pointing at nothing. Draw the freed node greying out and falling away only **after** all three, with a small note that its `next` was read one beat earlier — the read-before-free ordering made visible rather than stated. The centre panel is the dangling pointer, and it should be built as a small drama rather than a caption. Delete the head with beat three omitted, so node 2's `prev` arrow stays drawn, still reaching down to where node 1 used to be. Grey the old node out but leave its outline in place, with the arrow visibly terminating inside a box that is no longer part of the list. Then allocate a new node holding 999 and have it materialise **into that same outline**, at which point node 2's untouched `prev` arrow is suddenly pointing at a live, unrelated node — and print `head->prev->data` reading 999. The point lands only if the reader watches the same rectangle get reused. Beside it, the one-node case: delete the only node with the tail write omitted, and show `head` going null while the `tail` label stays anchored to the greyed-out box, with the list reading empty from one end and not the other. Close with the sentinel comparison as two small diagrams side by side, insertion and deletion, each labelled with its write count with and without the sentinel — 3 against 4 for insertion, 2 against 2 for deletion — so the asymmetry is a number rather than a claim.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"operation":{"task":"remove the front node of a doubly linked list","writes":["head moves to the old head's next","the new head's prev is cleared"],"comparedToSingly":"two writes against one -- a singly linked deletion only has to move head","branch":"exactly one of 'clear the new head's prev' and 'clear the tail' runs"},"correctness":{"tested":"delete k heads from a list of n, every 0 <= k <= n <= 200","cases":20301,"checked":["the forward chain","the backward chain","the new head's prev is null","an emptied list has BOTH ends null"],"failures":0,"python":{"range":"n <= 100","cases":5151,"failures":0}},"whyDeletionIsDifferentFromInsertion":{"insertion":"a missed write leaves a list that disagrees with itself -- wrong, but every pointer still aims at a real node","deletion":"the node is FREED, so a missed write leaves a pointer aimed at memory that no longer belongs to the list"},"danglingPrev":{"bug":"forgetting to clear the new head's prev","observed":{"freedNodeAt":"0x102da99e0","newHeadPrevReads":"0x102da99e0","freshAllocationAt":"0x102da99e0","note":"the allocator handed the same block straight back"},"consequence":"reading head->prev->data returned 999 -- a node with nothing to do with this list","undramatic":"nothing crashed, nothing warned, and a forward-only test sees a perfectly correct list"},"danglingTail":{"bug":"forgetting to clear the tail on the deletion that empties the list","consequence":"head is null while tail still points at the freed node -- the list is empty in one direction and not in the other","whereItLives":"a branch that executes only on the deletion that empties the list, which a test deleting 'a few' nodes never reaches"},"emptyListIsSafe":"deleting from an already-empty list is a no-op; the guard returns and both ends stay null, and calling it repeatedly changes nothing","readBeforeYouFree":{"rule":"dead->next is read on the line BEFORE the node is freed","establishedIn":"Deletion of the head of LL, for the singly linked case","differenceHere":"a doubly linked node holds two links, and both are gone the instant it is freed"},"circularSentinel":{"comparison":[{"version":"direct","writes":2,"branch":true},{"version":"circular sentinel","writes":2,"branch":false}],"whyItIsFreeHere":"dead->next is never null -- on the last real node it is the sentinel, so `dead->next->prev = sentinel` needs no guard and there is no 'the list just became empty' case to detect","contrastWithInsertion":"Insert node before head measured the sentinel costing one EXTRA write, four against three, to remove its branch","theAsymmetry":"insertion asks whether a tail exists; deletion asks whether one still will -- only the first needs an extra assignment either way","verified":"the same 20,301 cases, zero failures"},"generalDeleteNode":{"note":"head deletion is one of the four cases of unlinking an arbitrary node -- the branch where prev is null","payoff":"Introduction to Doubly LL measured two writes here against 98,997 links followed for the singly linked equivalent on a node near the end of a 100,000-node list","benefit":"writing the general function gives head, tail and middle deletion together"},"recommendation":"the direct two-write version, unless you are writing a whole DLL library -- in which case the circular sentinel removes the branch at no cost for deletion and one write for insertion","lesson":"insertion's mistakes are wrong; deletion's are unsafe -- and the demonstration is undramatic, which is what makes it dangerous"}
```

<!-- @highlights -->
- The two chains stay visually separate — `next` arrows above the nodes, `prev` arrows below — since every mistake here is a lower-chain mistake.
- The deletion runs on `1 <-> 2 <-> 3 <-> 4` as three beats.
- Beat one highlights the doomed node and shows its `next` being read.
- Beat two slides the `head` label to node 2.
- Beat three cuts node 2's downward `prev` arrow and leaves it pointing at nothing.
- The freed node greys out and falls away only **after** all three, noting its `next` was read a beat earlier.
- That makes the read-before-free ordering visible rather than stated.
- The centre panel builds the dangling pointer as a drama: beat three is omitted, so node 2's `prev` arrow stays drawn.
- The old node greys out but its outline stays, with the arrow terminating inside a box no longer part of the list.
- A new node holding 999 then materialises **into that same outline**.
- Node 2's untouched `prev` arrow is suddenly pointing at a live, unrelated node, and `head->prev->data` prints 999.
- The point lands only because the reader watches the same rectangle get reused.
- Beside it, the one-node case: `head` goes null while the `tail` label stays anchored to the greyed-out box.
- The list then reads empty from one end and not from the other.
- The close puts insertion and deletion side by side with their sentinel write counts — 3 against 4, and 2 against 2.
- That makes the asymmetry a number rather than a claim.

<!-- @edgeCases -->
- The empty list — the guard returns immediately, and calling it repeatedly is safe.
- A one-node list — the only deletion that takes the tail branch, and the only one that empties the list.
- A two-node list — the shortest case where the new head's `prev` write actually has a target.
- The new head's `prev` — must become null, and failing to do so leaves it pointing at freed memory.
- The tail after a non-final deletion — unchanged, since only the front of the list moved.
- The freed node's `next` — must be read before the free, which is why the node is saved to a local first.
- Deleting every node in turn — each step keeps both chains consistent; the last one must clear both ends.
- A circular sentinel's empty state — identified by the sentinel pointing at itself, with no null anywhere to test.
- Traversing after a deletion that left a stale `prev` — the forward walk is correct and the backward walk reads freed memory.
- Java or Python — no dangling pointer, but a stale `prev` still makes the list wrong backwards and keeps the removed node reachable.
- Passing only the head pointer — cannot work, since the emptying case must also clear the tail.

<!-- @pitfalls -->
- Forgetting to clear the new head's `prev`. It holds a freed address, and the next allocation may hand that block straight back.
- Forgetting to clear the `tail` on the deletion that empties the list. `head` is null while `tail` dangles, so the list is empty in one direction only.
- Freeing the node before reading its `next`. The read on the previous line is what makes the free safe.
- Testing only in the forward direction. Both dangling-pointer bugs leave the forward chain perfect.
- Testing only partial deletions. The tail bug lives exclusively on the deletion that empties the list.
- Treating a dangling `prev` as untidiness. It was measured here reading a live, unrelated node after the block was reused.
- Passing only the head pointer. The emptying case has to clear the tail, which a bare head pointer cannot reach.
- Returning the new head instead of updating the list. The tail may also need to change, so a return value cannot carry the whole result.
- Assuming the garbage collector makes this safe in Java or Python. It removes the memory-safety problem, not the correctness one.
- Expecting a circular sentinel to cost extra as it does for insertion. For deletion it removes the branch for the same two writes.
- Traversing a circular sentinel list until a null pointer. There are none — stop on reaching the sentinel.

<!-- @doubt -->
### Why is forgetting a write worse here than when inserting?

<!-- @answer -->
Because the node is **freed**. **Insert node before head** measured mistakes that left the list disagreeing with itself — the forward walk perfect, the backward walk short — but every pointer in that list still aimed at a real node, so reading it was merely wrong. Here the missed write leaves a pointer at an address the allocator has reclaimed. That was demonstrated directly rather than argued: after deleting the head of `0 1 2` without clearing the new head's `prev`, that pointer read `0x102da99e0`, the freed node's address; one further allocation was made and the allocator returned **the same block**; reading `head->prev->data` then gave **999**, belonging to a node with no relationship to this list. Nothing crashed and nothing warned. That is a use-after-free, and it is exactly the kind that survives testing and surfaces later as something apparently unrelated.

<!-- @doubt -->
### Does the empty-list branch really matter?

<!-- @answer -->
It is the only branch, it runs exactly once per list, and it is the one that leaves a dangling `tail`. Deleting the last node makes `head` null — correct — but if the `tail` is not cleared at the same moment, it keeps pointing at the node about to be freed. The list then reports itself **empty going forward and non-empty going backward**, and any backward walk dereferences reclaimed memory on its first step. What makes this hard to catch is where the branch lives: it executes only on the deletion that empties the list, so a test that builds ten nodes and deletes three never reaches it. The verification behind this container deliberately covered it — deleting **every** possible number of heads from every list length up to 200, 20,301 cases, asserting specifically that an emptied list has *both* ends null.

<!-- @doubt -->
### Why save the node before moving the head?

<!-- @answer -->
Because `dead->next` has to be read while the node still exists, and after `head` moves you no longer have a pointer to it. This is the ordering rule **Deletion of the head of LL** established for singly linked lists — read the way onward before destroying the thing that holds it — and the doubly linked case simply has more to lose, since the node carries two links rather than one. The correct sequence is: save the pointer, read its `next` to move the head, fix the new head's `prev`, and only then free. Reversing the last two steps means writing through a freed pointer; freeing before reading `next` means losing the rest of the list entirely. In Java and Python there is no `free`, but the same discipline applies for a different reason — clearing the removed node's own links keeps it from holding its former neighbours reachable.

<!-- @doubt -->
### Should I use a circular sentinel?

<!-- @answer -->
For deletion it is close to free, which makes it a better bargain than it was for insertion. The direct version needs a branch because the list may be **about to become** empty, changing whether the tail must move. With a circular sentinel that case does not exist: `dead->next` always points at a real node, which on the last deletion is the sentinel itself, so writing `dead->next->prev = sentinel` lands exactly where the tail-side link belongs. Measured, that is **two writes and no branch** — the same write count as the direct version. **Insert node before head** measured the same sentinel costing a **fourth** write to remove insertion's branch. The asymmetry is worth understanding rather than memorising: insertion asks whether a tail exists, deletion asks whether one still will, and only the first needs an extra assignment whichever way the answer goes.

<!-- @doubt -->
### Is this safe in Java or Python, where there is no `free`?

<!-- @answer -->
Memory-safe, yes; correct, not automatically. The garbage collector removes the dangling-pointer failure entirely — a stale `prev` in Java or Python points at a node that is still alive, so nothing reads reclaimed memory. What it does **not** remove is the correctness problem: a list whose new head still has a `prev` is simply wrong when read backwards, and a list whose `tail` was never cleared reports itself non-empty from one end. Both bugs survive in exactly the same shape, minus the memory hazard. There is also a smaller consequence worth knowing: a removed node that still holds links to its former neighbours keeps them reachable, so a long-lived reference to a "deleted" node can hold an entire list alive. That is why the Java and Python samples here clear the removed node's own pointers even though nothing is being freed.

<!-- @doubt -->
### Can I write one function for deleting any node instead?

<!-- @answer -->
Yes, and it is usually the better choice. Unlinking an arbitrary node has four cases — has a predecessor or not, has a successor or not — and head deletion is simply the branch where `prev` is null. Writing `deleteNode(list, node)` therefore gives head deletion, tail deletion and middle deletion in one function, and `deleteNode(list, list.head)` is exactly this subtopic. It also makes visible what the structure is actually for: **Introduction to Doubly LL** measured that removing a node you already hold costs **two writes** here against **98,997 links followed** for the singly linked equivalent on a node near the end of a hundred-thousand-node list. The only reason to write the specialised head version as well is that it can handle the **empty** list, which the general one cannot — there is no node to pass it.
