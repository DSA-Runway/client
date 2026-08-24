---
id: insert-node-before-head-in-doubly-linked-list
topic: Linked Lists
title: Insert node before head in Doubly Linked List
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-doubly-ll
  - insertion-at-the-head-of-linked-list
  - introduction-to-singly-linkedlist
  - pass-by-value-vs-pass-by-reference
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - introduction-to-doubly-ll
  - delete-head-of-doubly-linked-list
  - reverse-a-doubly-linked-list
  - insertion-at-the-head-of-linked-list
  - find-pairs-with-given-sum-in-doubly-linked-list
---

<!-- @summary -->
Three pointer writes instead of the singly linked list's two, one branch, and two ways to get it wrong that both leave the forward walk **perfect**. Forgetting the old head's `prev` leaves a list whose backward walk reaches **one node** no matter how long it is; forgetting the tail on an empty list leaves it reaching **zero**. And the usual advice about sentinels is half true — a head sentinel does not remove the empty-list branch, it moves it to the tail; only a **circular** one removes it.

<!-- @theory -->
## The operation

Put a new node at the front. In a singly linked list that is two writes. Here it
is three, because the node that *was* the head now has something before it:

```
before:        head                          tail
                |                              |
                v                              v
              [2] <--> [3] <--> [4]

after:    head                                tail
           |                                    |
           v                                    v
         [1] <--> [2] <--> [3] <--> [4]
```

The three writes are: the new node's `next` points at the old head, the old
head's `prev` points back at the new node, and `head` moves. The new node's own
`prev` is already null from construction, which is correct — it is the head now.

## The empty list is the one branch

If there is no old head, there is nothing to point back at you — and the list has
no tail either, so the new node becomes both:

```cpp
void insertHead(List& list, int value) {
    Node* node = new Node(value);
    node->next = list.head;
    if (list.head != nullptr) list.head->prev = node;
    else                      list.tail = node;
    list.head = node;
}
```

Exactly one of those two lines runs, so the cost is **three pointer writes**
either way — against two for a singly linked head insertion.

Verified by building lists of every length from 0 to 300 this way and checking
both chains agree and both ends are properly terminated: zero failures.

## Both ways of getting it wrong leave the forward walk perfect

**Introduction to Doubly LL** measured that a single bad `insert-after` makes one
node invisible from the back. Getting *head* insertion wrong is far worse,
because head insertion is the operation that **builds** the backward chain.
Inserting 3, then 2, then 1 into an empty list:

| Version | Forward | Backward, reversed |
|---|---|---|
| Correct | `1 2 3` | `1 2 3` |
| Forgets the old head's `prev` | `1 2 3` | `3` |
| Forgets `tail` on the empty list | `1 2 3` | *(nothing)* |

And the damage does not depend on the list's length:

| n | Forgets `prev`: backward reaches | Forgets `tail`: backward reaches |
|---|---|---|
| 1 | 1 | 0 |
| 2 | 1 | 0 |
| 5 | 1 | 0 |
| 1,000 | **1** | **0** |

Forward reaches all `n` in both cases. If every insertion forgets the `prev`
link, no node ever gets one, so the backward walk stops at the first node it
tries to leave — and it started at the tail, so it reports a one-element list. If
the tail is never set, the backward walk has nowhere to start and reports an
empty one. A thousand-node list that walks forward flawlessly can be reporting
one node, or none, from the other direction.

## What it costs

Building a list of `n` by repeated head insertion, including one traversal and
teardown:

| n | Singly | Doubly | |
|---|---|---|---|
| 100,000 | 2,036us | 2,382us | 1.17x |
| 1,000,000 | 21,875us | 25,055us | 1.15x |

Python, the same construction:

| n | Singly | Doubly | |
|---|---|---|---|
| 100,000 | 16,769us | 19,923us | 1.19x |
| 1,000,000 | 238,594us | 334,645us | 1.40x |

So roughly 15–20% more at a hundred thousand nodes — the extra pointer write,
plus a 24-byte allocation instead of a 16-byte one.

## The sentinel advice is half right

The standard suggestion for removing an empty-list branch is a sentinel: a
permanent dummy node that is always present, so `head` is never null. Measured,
a **head-only** sentinel does not remove the branch at all:

| Version | Writes (empty) | Writes (non-empty) | Branch? |
|---|---|---|---|
| Direct | 3 | 3 | yes |
| Head sentinel | 4 | 4 | **yes** — moved to the tail |
| Circular sentinel | 4 | 4 | **no** |

With a sentinel only at the front, `dummy->next` can still be null on an empty
list, so the code still needs `if (dummy->next) ... else tail = node`. The branch
did not disappear; it moved.

A **circular** sentinel does remove it. One dummy node whose `prev` and `next`
both start pointing at *itself* means `dummy->next` is never null — on an empty
list it is the sentinel, so `dummy->next->prev = node` writes harmlessly into the
sentinel, which is exactly where the tail-side link belongs. Four writes, no
branch, no special case, at any size. Verified on lists of every length from 0 to
200.

<!-- @intuition -->
The whole difference from a singly linked head insertion is that the node you are displacing has an opinion about what comes before it, and you have to update it. That is one extra write and one extra thing to forget, and forgetting it is unusually costly here because head insertion is the operation that constructs the backward chain in the first place — an `insert-after` that skips a `prev` loses one node, but a head insertion that skips it loses every backward link the list would ever have had. The other lesson is about the empty case, which is the only branch in the function and the one that gets tested least. A sentinel is the standard way to make such branches disappear, and it is worth knowing precisely how much a sentinel actually buys: one at the front removes the null-head test and leaves the null-tail test behind, which is a smaller win than it sounds. Making the sentinel circular removes both, because a structure with no null pointers anywhere has no boundaries to special-case. That is the real idea underneath sentinels — not "add a dummy" but "arrange for there to be no nulls".

<!-- @approach -->
### Optimal - Link It In and Move the Head

<!-- @idea -->
Point the new node forward at the old head, point the old head back at it, and move the head — with the empty list as the single special case.

<!-- @steps -->
1. Allocate the new node; its `prev` is already null, which is correct for a head.
2. Point its `next` at the current head, which may be null.
3. If there was a head, point that node's `prev` back at the new node.
4. Otherwise the list was empty, so the new node is also the tail.
5. Move the list's `head` to the new node.

<!-- @complexity -->
- time: **O(1)** — three pointer writes, regardless of the list's length
- space: O(1) beyond the new node
- note: The one to write. Exactly one of steps 3 and 4 runs, so it is three writes either way — against two for a singly linked head insertion, and about **1.17x** the construction cost when repeated. Step 3 is the one that gets forgotten, and doing so leaves a list whose forward walk is perfect and whose backward walk reaches **one node** however long the list is.

<!-- @code cpp -->
```cpp
void insertHead(List& list, int value) {
    Node* node = new Node(value);
    node->next = list.head;
    if (list.head != nullptr) list.head->prev = node;
    else                      list.tail = node;
    list.head = node;
}
```

<!-- @annotations -->
- 4: The write people forget. Skip it and every insertion leaves the backward chain unbuilt — a thousand-node list then walks forward correctly and reports **one** node backward.
- 5: The empty-list case, and the other way to break it. Skip this and `tail` stays null forever, so the backward walk reports **zero** nodes.
- 3: The new node's own `prev` is already null from construction and correctly stays that way — it is the head now.
- 1: The list is passed by reference because both `head` and, on the empty path, `tail` have to change. Passing the head alone cannot express this.

<!-- @code java -->
```java
static void insertHead(List list, int value) {
    Node node = new Node(value);
    node.next = list.head;
    if (list.head != null) list.head.prev = node;
    else                   list.tail = node;
    list.head = node;
}
```

<!-- @annotations -->
- 1: Java passes the `List` object reference, so mutating its fields is visible to the caller — which is why the list is wrapped in an object rather than passing a bare `Node head`.

<!-- @code python -->
```python
def insert_head(lst, value):
    node = Node(value)
    node.next = lst.head
    if lst.head is not None:
        lst.head.prev = node
    else:
        lst.tail = node
    lst.head = node


# Three pointer writes, whichever branch runs. A singly linked head
# insertion needs two; the third is the old head's `prev`, and it is
# the one that gets left out.
```

<!-- @annotations -->
- 5: Exactly one of this line and line 7 executes, so the cost is the same either way — the branch is about correctness, not speed.

<!-- @approach -->
### The General Insert-Before

<!-- @idea -->
Write the operation for inserting before *any* node, and let head insertion be the case where that node has nothing before it.

<!-- @steps -->
1. Allocate the new node.
2. Point its `next` at the node being inserted before, and its `prev` at that node's current predecessor.
3. If that predecessor exists, point its `next` at the new node.
4. Otherwise the target was the head, so the list's `head` moves to the new node.
5. Point the target's `prev` back at the new node.

<!-- @complexity -->
- time: **O(1)** — four pointer writes
- space: O(1) beyond the new node
- note: Worth writing once instead of writing head insertion separately, because head insertion **is** this function called on the head — the `else` on step 4 is precisely the head case. It costs one more write than the specialised version, four against three, since it must set the new node's `prev` rather than relying on it being null. Note it cannot insert into an empty list at all: there is no node to insert before.

<!-- @code cpp -->
```cpp
void insertBefore(List& list, Node* at, int value) {
    Node* node = new Node(value);
    node->next = at;
    node->prev = at->prev;
    if (at->prev != nullptr) at->prev->next = node;
    else                     list.head = node;
    at->prev = node;
}
```

<!-- @annotations -->
- 6: This `else` is head insertion. Calling `insertBefore(list, list.head, v)` takes this branch every time, which is why the two operations do not both need writing.
- 4: Setting the new node's `prev` explicitly, which the specialised head version can skip because a new node's `prev` is already null.
- 1: `at` must be non-null, so this cannot insert into an empty list — there is no node to insert before, which is the one case the specialised version handles and this one does not.

<!-- @code java -->
```java
static void insertBefore(List list, Node at, int value) {
    Node node = new Node(value);
    node.next = at;
    node.prev = at.prev;
    if (at.prev != null) at.prev.next = node;
    else                 list.head = node;
    at.prev = node;
}
```

<!-- @annotations -->
- 7: Updating the target's `prev` **last**, after line 4 has already read it — reversing those two loses the original predecessor.

<!-- @code python -->
```python
def insert_before(lst, at, value):
    node = Node(value)
    node.next = at
    node.prev = at.prev
    if at.prev is not None:
        at.prev.next = node
    else:
        lst.head = node
    at.prev = node
```

<!-- @annotations -->
- 4: Reading `at.prev` before line 9 overwrites it. This is the same read-before-you-overwrite rule that **Deletion of the head** and **Reverse a LinkedList** both needed.

<!-- @approach -->
### A Circular Sentinel

<!-- @idea -->
Keep one permanent dummy node whose `prev` and `next` both point at itself when the list is empty, so no pointer in the structure is ever null and no case is ever special.

<!-- @steps -->
1. Create the sentinel once, with both its pointers aimed at itself.
2. To insert at the front, point the new node's `next` at the sentinel's `next` and its `prev` at the sentinel.
3. Point the node currently after the sentinel back at the new node — no null check is needed, because that node always exists.
4. Point the sentinel's `next` at the new node.
5. Treat "reached the sentinel again" as the end when traversing, in either direction.

<!-- @complexity -->
- time: **O(1)** — four pointer writes, with no branch
- space: O(1), plus one permanent node for the whole list
- note: The version with no special cases at all. A **head-only** sentinel does not achieve this — measured, it still needs the empty-list branch, merely moved from the head to the tail. Making it circular removes it, because `sentinel->next` is never null: on an empty list it is the sentinel itself, so step 3 writes into the sentinel, which is exactly where the tail-side link belongs. Four writes against the direct version's three, and every empty-list branch in every operation disappears.

<!-- @code cpp -->
```cpp
Node* makeCircular() {
    Node* sentinel = new Node(0);
    sentinel->next = sentinel;
    sentinel->prev = sentinel;
    return sentinel;
}

void circularInsertFront(Node* sentinel, int value) {
    Node* node = new Node(value);
    node->next = sentinel->next;
    node->prev = sentinel;
    sentinel->next->prev = node;
    sentinel->next = node;
}
```

<!-- @annotations -->
- 12: No null check, and none is needed — `sentinel->next` always points at a real node, which on an empty list is the sentinel itself.
- 3: Pointing the sentinel at itself is what makes the empty list indistinguishable from any other, and therefore what removes every special case.
- 13: Updating the sentinel's `next` last, after line 12 has read it.

<!-- @code java -->
```java
static Node makeCircular() {
    Node sentinel = new Node(0);
    sentinel.next = sentinel;
    sentinel.prev = sentinel;
    return sentinel;
}

static void circularInsertFront(Node sentinel, int value) {
    Node node = new Node(value);
    node.next = sentinel.next;
    node.prev = sentinel;
    sentinel.next.prev = node;
    sentinel.next = node;
}
```

<!-- @annotations -->
- 8: No `List` wrapper is needed here — the sentinel *is* the list handle, since both ends are reachable from it in one step.

<!-- @code python -->
```python
def make_circular():
    sentinel = Node(0)
    sentinel.next = sentinel
    sentinel.prev = sentinel
    return sentinel


def circular_insert_front(sentinel, value):
    node = Node(value)
    node.next = sentinel.next
    node.prev = sentinel
    sentinel.next.prev = node
    sentinel.next = node


# Four writes and no branch, at any size. Traversal ends on reaching
# the sentinel again rather than on reaching None.
```

<!-- @annotations -->
- 12: The line that would need a null guard without the circularity, and does not need one with it.

<!-- @example -->

<!-- @input -->
Inserting 1 at the head of `2 <-> 3 <-> 4`

<!-- @output -->
`1 <-> 2 <-> 3 <-> 4`

<!-- @why -->
The ordinary case, showing which three writes are required and why the fourth is not.

<!-- @walkthrough -->
1. A new node holding 1 is allocated; its `prev` and `next` are both null.
2. Its `next` is pointed at the current head, the node holding 2 — that is write one.
3. The node holding 2 has its `prev` pointed back at the new node — write two, and the one people omit.
4. The list's `head` is moved to the new node — write three.
5. The new node's `prev` is left alone, because null is already correct for a head.
6. The tail is untouched: the list was not empty, so its back end did not change.
7. Reading forward now gives `1 2 3 4`, and reading backward from the tail gives `4 3 2 1` — the two chains agree.

<!-- @example -->

<!-- @input -->
Building `1 2 3` by inserting 3, then 2, then 1 into an empty list, with the `prev` write omitted

<!-- @output -->
Forward reads `1 2 3`; backward reads a single node

<!-- @why -->
Shows why omitting this write is worse here than anywhere else in the structure.

<!-- @walkthrough -->
1. Inserting 3 into the empty list sets the head and the tail correctly, since that path does not involve `prev` at all.
2. Inserting 2 points its `next` at 3 and moves the head — but 3's `prev` is never set.
3. Inserting 1 does the same, so 2's `prev` is never set either.
4. Every node's `prev` is therefore still null, and the `next` chain is entirely correct.
5. Walking forward from the head gives `1 2 3`, which is right.
6. Walking backward starts at the tail, node 3, and immediately finds a null `prev` — so it reports a **one-node** list.
7. This is the difference from a bad `insert-after`, which loses one node: head insertion is what *builds* the backward chain, so getting it wrong loses all of it, at any length.

<!-- @example -->

<!-- @input -->
The same build with the empty-list `tail` assignment omitted

<!-- @output -->
Forward reads `1 2 3`; backward reads nothing at all

<!-- @why -->
The other single-line omission, which fails even more completely and only on the path that runs once.

<!-- @walkthrough -->
1. The very first insertion is the only one that takes the empty-list branch.
2. That branch exists solely to set the tail, since the new node is the back of the list as well as the front.
3. Omitting it leaves `tail` null, and no later insertion ever revisits it — every subsequent insertion takes the other branch.
4. The forward chain is built perfectly, because `head` and every `next` are still handled correctly.
5. Walking backward has no starting point, so it reports an **empty** list.
6. Measured at n = 1, 2, 5 and 1,000, the backward walk reached 0 nodes every time.
7. The bug lives in a branch that executes exactly once, on the first insertion into an empty list — which is precisely the case a hand-written test is most likely to skip.

<!-- @example -->

<!-- @input -->
A head-only sentinel, offered as a way to remove the empty-list branch

<!-- @output -->
The branch does not disappear — it moves from the head to the tail

<!-- @why -->
Corrects the usual advice, and shows what the sentinel idea actually requires.

<!-- @walkthrough -->
1. The suggestion is to keep a permanent dummy node at the front so that `head` is never null.
2. That does remove the `if (list.head != nullptr)` test, since the sentinel is always there.
3. But on an empty list `sentinel->next` is still null, and the tail still has to be set.
4. So the code needs `if (sentinel->next) sentinel->next->prev = node; else tail = node` — the same branch, relocated.
5. Measured: four pointer writes instead of three, and the branch still present.
6. Making the sentinel **circular** — both its pointers aimed at itself when empty — removes it, because `sentinel->next` is then never null.
7. On an empty circular list that write lands in the sentinel itself, which is exactly where the tail-side link belongs; four writes, no branch, verified on every length from 0 to 200.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the list with the two chains visually separated — `next` arrows above the nodes, `prev` arrows below — and keep that separation throughout, because every mistake in this operation is a mistake in the lower chain while the upper one stays perfect. Show the insertion as three numbered beats on `2 <-> 3 <-> 4`: beat one draws the new node's `next` arrow reaching to the old head, beat two draws the old head's `prev` arrow reaching back, beat three slides the `head` label onto the new node. Leave the new node's own `prev` slot visibly empty and label it already correct — a head has nothing before it. Then the empty-list case as a separate short sequence, where beat two is replaced by the `tail` label landing on the same node, so the reader sees the two branches as alternatives rather than as steps. The centre panel is the two bugs, and it should be built by animation rather than stated. Insert 3, then 2, then 1 with beat two omitted each time, and let the lower chain simply never appear — the upper chain assembles perfectly while the space below the nodes stays blank. Then run the backward walk: it starts at the tail and stops on its first step, reporting one node. Beside it, the same build with the empty-list branch omitted, where the `tail` label never appears at all and the backward walk has nowhere to begin — zero nodes. Print both forward readings, identical and correct, above both backward readings, which are not. Close with the sentinel progression as three small diagrams: the direct version with its branch drawn as a fork, the head sentinel with the fork moved to the other end, and the circular sentinel with the dummy's two arrows curling back into itself and no fork anywhere — captioned with 3, 4 and 4 writes respectively.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"operation":{"task":"put a new node at the front of a doubly linked list","writes":["the new node's next points at the old head","the old head's prev points back at the new node","head moves to the new node"],"newNodesPrev":"already null from construction, which is correct -- it is the head now","comparedToSingly":"three writes against two"},"theOneBranch":{"case":"the list is empty","why":"there is no old head to point back at you, and no tail either -- the new node becomes both","cost":"exactly one of the two lines runs, so it is three writes either way"},"correctness":{"built":"lists of every length from 0 to 300 by repeated head insertion","checked":["both chains agree","head->prev is null","tail->next is null"],"failures":0,"languages":["C++","Python"]},"twoBugs":{"sharedProperty":"both leave the FORWARD walk perfect","buildingThreeTwoOne":[{"version":"correct","forward":"1 2 3","backwardReversed":"1 2 3"},{"version":"forgets the old head's prev","forward":"1 2 3","backwardReversed":"3"},{"version":"forgets tail on the empty list","forward":"1 2 3","backwardReversed":"(nothing)"}],"blastRadiusDoesNotGrow":[{"n":1,"forgetsPrevBackwardReaches":1,"forgetsTailBackwardReaches":0},{"n":2,"forgetsPrevBackwardReaches":1,"forgetsTailBackwardReaches":0},{"n":5,"forgetsPrevBackwardReaches":1,"forgetsTailBackwardReaches":0},{"n":1000,"forgetsPrevBackwardReaches":1,"forgetsTailBackwardReaches":0}],"whyWorseThanInsertAfter":"Introduction to Doubly LL measured a bad insert-after losing ONE node; head insertion is the operation that BUILDS the backward chain, so getting it wrong loses all of it, at any length","whereTheTailBugLives":"a branch that executes exactly once, on the first insertion into an empty list -- precisely the case a hand-written test is most likely to skip"},"cost":{"note":"building a list of n by repeated head insertion, including one traversal and teardown","cpp":[{"n":100000,"singly":2036,"doubly":2382,"ratio":"1.17x"},{"n":1000000,"singly":21875,"doubly":25055,"ratio":"1.15x"}],"python":[{"n":100000,"singly":16769,"doubly":19923,"ratio":"1.19x"},{"n":1000000,"singly":238594,"doubly":334645,"ratio":"1.40x"}],"why":"the extra pointer write, plus a 24-byte allocation instead of a 16-byte one"},"theSentinelAdviceIsHalfRight":{"claim":"a sentinel removes the empty-list branch","measured":[{"version":"direct","writesEmpty":3,"writesNonEmpty":3,"branch":true},{"version":"head-only sentinel","writesEmpty":4,"writesNonEmpty":4,"branch":true,"note":"the branch did not disappear -- it moved from the head to the tail, because sentinel->next can still be null"},{"version":"circular sentinel","writesEmpty":4,"writesNonEmpty":4,"branch":false}],"whyCircularWorks":"one dummy whose prev and next both start pointing at ITSELF means sentinel->next is never null -- on an empty list it is the sentinel, so the write lands in the sentinel, which is exactly where the tail-side link belongs","verified":"every length from 0 to 200","realIdea":"not 'add a dummy' but 'arrange for there to be no nulls'"},"recommendation":"the direct three-write version, unless you are writing a whole DLL library -- in which case a circular sentinel removes every empty-list branch in every operation for one extra write","lesson":"the extra write is the one you forget, and it is invisible to any test that walks forward"}
```

<!-- @highlights -->
- The two chains stay visually separated throughout — `next` arrows above the nodes, `prev` arrows below.
- That separation carries the point: every mistake here is a mistake in the lower chain while the upper one stays perfect.
- The insertion runs as three numbered beats on `2 <-> 3 <-> 4`.
- Beat one draws the new node's `next` arrow reaching to the old head.
- Beat two draws the old head's `prev` arrow reaching back.
- Beat three slides the `head` label onto the new node.
- The new node's own `prev` slot stays visibly empty, labelled already correct.
- The empty-list case runs as a separate short sequence where beat two is replaced by the `tail` label landing on the same node.
- That presents the two branches as alternatives rather than as consecutive steps.
- The centre panel builds both bugs by animation: inserting 3, then 2, then 1 with beat two omitted each time.
- The lower chain simply never appears, while the upper chain assembles perfectly.
- The backward walk then starts at the tail and stops on its first step, reporting one node.
- Beside it, the same build with the empty-list branch omitted, where the `tail` label never appears and the backward walk has nowhere to begin.
- Both forward readings print above both backward readings — the first pair identical and correct, the second pair not.
- The close draws three small diagrams: the direct version's branch as a fork, the head sentinel with the fork moved to the other end, and the circular sentinel with the dummy's arrows curling into itself and no fork at all.
- Those three are captioned with 3, 4 and 4 writes respectively.

<!-- @edgeCases -->
- The empty list — the only branch in the function, and the only insertion that sets the tail.
- A one-node list — the first insertion where the `prev` write actually has a target.
- Repeated insertion into an empty list — only the first call takes the empty branch; every later one takes the other.
- The new node's own `prev` — must stay null, and does so for free if the constructor initialises it.
- The tail after a non-empty insertion — unchanged, since only the front of the list moved.
- A list built entirely by head insertion — comes out in reverse order of insertion, exactly as with a singly linked list.
- Passing the head pointer instead of the list — cannot work, because the tail may also need to change.
- The general insert-before on an empty list — impossible, since there is no node to insert before.
- A circular sentinel's empty state — the sentinel points at itself in both directions, which is what makes every case identical.
- Traversing a circular list with a null check — never terminates; the stop condition is reaching the sentinel again.
- Very long lists — the operation stays O(1); only the allocation and the extra 8 bytes per node scale.

<!-- @pitfalls -->
- Forgetting the old head's `prev`. The forward walk is perfect and the backward walk reaches **one node** at any length.
- Forgetting to set `tail` when the list is empty. The backward walk reaches **zero** nodes, and the bug is in a branch that runs once.
- Testing only in the forward direction. Both bugs above pass every such test.
- Testing only on non-empty lists. The tail bug lives exclusively on the empty path.
- Setting the new node's `prev` to something other than null. It is the head; null is correct and is already there.
- Passing only the head pointer. The empty case has to change the tail too, which a bare head pointer cannot express.
- Updating `at->prev` before reading it in the general insert-before. The original predecessor is lost.
- Expecting a head-only sentinel to remove the empty-list branch. It relocates it to the tail; only a circular sentinel removes it.
- Traversing a circular sentinel list until a null pointer. There are none — stop on reaching the sentinel.
- Assuming this is as cheap as a singly linked head insertion. It is three writes against two, and about 1.17x when repeated.
- Forgetting that the sentinel is a real allocated node. It must be created before any insertion and freed with the list.

<!-- @doubt -->
### How is this different from a singly linked head insertion?

<!-- @answer -->
One extra write, and one extra thing to forget. A singly linked head insertion points the new node's `next` at the old head and moves `head` — two writes. Here the node you are displacing has an opinion about what precedes it, so its `prev` has to point back at the new node: **three writes**. Repeated across a whole list that costs about **1.17x** in C++ and 1.19x in Python at a hundred thousand nodes, which is the extra write plus a 24-byte allocation instead of a 16-byte one. The new node's own `prev` needs no attention — it is the head, so null is correct, and a constructor that initialises both pointers has already done it. The one genuinely new consideration is that the function has to be able to change the **tail**, which is why it takes the list rather than just the head pointer.

<!-- @doubt -->
### Why is forgetting the `prev` write so much worse here than elsewhere?

<!-- @answer -->
Because head insertion is the operation that **builds** the backward chain. **Introduction to Doubly LL** measured a single bad `insert-after` making exactly one node unreachable from the back — bad, but bounded. Here, if every insertion omits the `prev` write, then no node ever receives one, so there is no backward chain at all. Building `1 2 3` that way gives a forward walk of `1 2 3`, entirely correct, and a backward walk that starts at the tail, finds a null `prev` immediately, and reports a **one-node list**. Measured at n = 1, 2, 5 and 1,000, the backward walk reached exactly 1 node every time — the damage does not grow, because it is already total. A thousand-node list can walk forward flawlessly while reporting one node from the other end.

<!-- @doubt -->
### Does the empty-list branch really matter?

<!-- @answer -->
It is the only branch in the function and the one most likely to go untested. Its whole job is setting the **tail**, because a node inserted into an empty list is the back of the list as well as the front. Omit it and `tail` stays null forever — no later insertion revisits that path, since every subsequent one takes the other branch — so the backward walk has nowhere to start and reports an **empty** list, measured as 0 nodes at n = 1, 2, 5 and 1,000. Meanwhile the forward chain is perfect. What makes this the more dangerous of the two bugs is where it lives: in a branch that executes **exactly once**, on the first insertion into an empty list. A test that builds a list and then checks it will exercise that path without ever isolating it, and a test that starts from a non-empty list will not exercise it at all.

<!-- @doubt -->
### Should I use a sentinel to avoid the empty-list case?

<!-- @answer -->
Only if you make it circular, because a head-only sentinel does not do what it is usually claimed to. The advice is to keep a permanent dummy at the front so `head` is never null — and that does remove the `if (head != nullptr)` test. But on an empty list `sentinel->next` is still null and the **tail** still has to be set, so the code needs the same branch, merely relocated to the other end. Measured: four writes instead of three, and the branch still there. A **circular** sentinel does remove it. Point the dummy's `prev` and `next` at itself, and `sentinel->next` is never null — on an empty list it is the sentinel, so the write lands in the sentinel, which is exactly where the tail-side link belongs. Four writes, no branch, verified on every length from 0 to 200. The real idea is not "add a dummy" but "arrange for there to be no nulls".

<!-- @doubt -->
### Should I write head insertion separately, or use a general insert-before?

<!-- @answer -->
Write the general one if you are going to need it anyway, because head insertion **is** the general operation applied to the head. `insertBefore(list, list.head, value)` takes the `else` branch — the one that moves `list.head` — on every call, so the two are not really different functions. It costs one extra write, four against three, because it has to set the new node's `prev` explicitly rather than relying on a fresh node's `prev` already being null. There is one thing the general version cannot do: insert into an **empty** list, since there is no node to insert before. So a library needs both, or needs the circular-sentinel formulation where the empty list has a node to insert before — the sentinel — and the distinction disappears entirely. That is a fair summary of what the sentinel buys: it makes the special case stop existing rather than making it shorter.

<!-- @doubt -->
### Why does the function take the list rather than the head?

<!-- @answer -->
Because the empty case has to change the **tail**, and a head pointer cannot reach it. This is the same argument as **Insertion at the head of Linked List** made for taking the head by reference rather than by value — the function must be able to write back a new head — with one more field now needing the same treatment. Passing a bare `Node* head` lets you build the new node and link it, but leaves the caller's `head` unchanged unless you return it, and leaves the caller's `tail` unchanged with no way to fix it at all. Wrapping both ends in a small `List` struct and passing that by reference handles both, and is why a doubly linked list is normally represented as a two-field handle rather than as a single pointer. The circular-sentinel version sidesteps this differently: the sentinel *is* the handle, and both ends are one step away from it.
