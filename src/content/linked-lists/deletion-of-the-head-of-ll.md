---
id: deletion-of-the-head-of-ll
topic: Linked Lists
title: Deletion of the head of LL
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-singly-linkedlist
  - insertion-at-the-head-of-linked-list
  - pass-by-value-vs-pass-by-reference
  - stack-memory-and-recursion-depth
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - insertion-at-the-head-of-linked-list
  - introduction-to-singly-linkedlist
  - delete-head-of-doubly-linked-list
  - remove-nth-node-from-the-back-of-the-ll
  - delete-the-middle-node-in-ll
---

<!-- @summary -->
Remove the first node — the mirror of head insertion, and harder in two specific ways: the order of the two statements matters, because freeing before reading `next` destroys the only route to the rest of the list and measured **wrong immediately** here rather than failing later; and unlike insertion it genuinely needs an empty-list guard. Freeing a whole list recursively survives 256,250 nodes and dies at 262,500, at **32 bytes of stack per node**.

<!-- @theory -->
## The operation

Take the first node out and make the second one the head.

```
before:   head -> 10 -> 20 -> 30 -> null
                  ^
                 doomed

after:    head -> 20 -> 30 -> null      and the node holding 10 is freed
```

Two statements plus a free:

```
Node* doomed = head;
head = head->next;
delete doomed;
```

O(1), like insertion — no node is walked to and nothing after the second node is
touched.

## The order is not a style choice

The obvious-looking alternative destroys the list:

```
delete head;             // the node is gone
head = head->next;       // ...and this reads out of freed memory
```

`head->next` is stored **inside** the node you just freed. Once it is freed, that
memory belongs to the allocator, and reading it is undefined behaviour.

The dangerous part is that undefined does not mean "obviously broken". Measured
here, reading `next` out of a freed node:

| | Expected | Got |
|---|---|---|
| Nothing allocated in between | `0x1057edb30` | **`0x4`** |
| One allocation in between | `0x1057edb30` | **`0x0`** |

In the second case the newly allocated node landed at **exactly the address that
was just freed** — the allocator handed the same block straight back — so the read
returned the new node's `next`, which was null.

On this platform it is wrong immediately. On allocators that store their
free-list pointer in the *first* word of a freed block, the `next` field at offset
8 can survive untouched and the buggy version returns the right answer for years
before something changes. Both behaviours are the same bug; only one of them tells
you.

Save the pointer first. It costs one local variable.

## Deletion needs an empty-list guard; insertion did not

This is the asymmetry with the previous subtopic. Head **insertion** works on an
empty list with no special case, because `node->next = head` correctly sets null.
Head **deletion** has nothing to delete and nothing to advance to:

```
if (head == nullptr) return nullptr;    // or throw, or report failure
```

Without it, `head->next` dereferences null. Every version below carries that
guard, and it is the first thing to write rather than an afterthought.

There is a design question hiding here that the problem statement usually
ducks: deleting from an empty list is an **error**, not a no-op. Returning null
quietly is fine when the caller does not care; a container class should say so,
because "delete failed" and "the list is now empty" are different facts.

## Getting the value out as well

Most real uses want the value, not just the removal — that is a stack pop. The
same ordering rule applies one level deeper: read the **data** before the free
too.

```
int value = head->data;      // read first
Node* doomed = head;
head = head->next;
delete doomed;               // now nothing is needed from it
return value;
```

Returning `doomed->data` after the `delete` is the same class of bug as the
pointer version, and reads the same way to a reviewer.

## Clearing the whole list, and the stack

Freeing every node is the same operation repeated, and it has one trap of its
own. The recursive version reads beautifully:

```
void clear(Node* head) {
    if (head == nullptr) return;
    clear(head->next);
    delete head;
}
```

It is also one stack frame per node. Measured by bisection, with an 8 MB stack:

| Nodes | Recursive | Iterative |
|---|---|---|
| 200,000 | survives | survives |
| **256,250** | **survives** | survives |
| **262,500** | **stack overflow** | survives |
| 1,000,000 | stack overflow | survives |
| 2,000,000 | stack overflow | **survives** |

That works out to **32 bytes of stack per node** — 8,372,224 bytes divided by
256,250 frames. A quarter of a million nodes is not an exotic size, and the
failure is a hard crash rather than a wrong answer.

The iterative version is three lines and has no limit:

```
while (head) { Node* next = head->next; delete head; head = next; }
```

Note that the same ordering rule appears here for the third time: capture `next`
before deleting.

## Java and Python do not free; they stop referring

There is no `delete` in either. Removing the head means dropping the last
reference to it, and the runtime reclaims it.

In CPython that happens immediately, not eventually. Measured with a weak
reference: after `head = head.next`, the old head's weak reference reads **None**
— it was freed the moment its reference count hit zero.

Dropping a whole chain also turns out to be safe at any size tried:

| Nodes | Result |
|---|---|
| 100,000 | freed cleanly |
| 1,000,000 | freed cleanly |
| 4,000,000 | **freed cleanly** |

No `RecursionError` and no crash, which is worth checking rather than assuming —
a refcount cascade down a four-million-node chain is exactly the shape that could
blow a C stack, and here it did not.

One incidental finding from setting that test up: **`__slots__` removes weak
reference support** unless you list `__weakref__` in it. `weakref.ref(node)`
raises `TypeError: cannot create weak reference to 'Node' object` until
`__slots__ = ("data", "next", "__weakref__")`. Worth knowing, since the previous
subtopic recommended `__slots__` for a 7x memory saving.

<!-- @intuition -->
Deleting the head is insertion run backwards, and it is more dangerous for one reason: the thing you need in order to continue is stored inside the thing you are about to destroy. A node's `next` field is the only route to the rest of the list, so freeing the node first and reading its `next` afterwards is not merely bad style — it is reading memory the allocator has taken back. What makes it worth a whole section is that the failure is quiet. Depending on how the allocator reuses freed blocks, the read can return exactly the right pointer, and the program works until the day something else allocates in between. The same ordering rule then reappears twice more, at the value level when you want a pop, and once per node when you free the whole list. And the whole-list case brings its own trap, because the recursive version is the prettiest code in this container and it puts one stack frame on the stack for every node — which is fine until a quarter of a million nodes turn a clean program into a crash.

<!-- @approach -->
### Optimal - Advance the Head, Then Free

<!-- @idea -->
Save the node being removed, move the head forward, and only then release it.

<!-- @steps -->
1. Return immediately if the list is empty — there is nothing to delete.
2. Save a pointer to the current head.
3. Move the head to `head->next`.
4. Free the saved node.
5. Make sure the caller's head pointer is the one that changed.

<!-- @complexity -->
- time: O(1) — two assignments and a free, independent of length
- space: O(1)
- note: The mirror of head insertion, with two differences. It needs an explicit empty-list guard, where insertion needed none. And the order of the statements is load-bearing: freeing before reading `next` reads memory the allocator has reclaimed, which measured wrong immediately here — `0x4` where a real pointer was expected — and can silently return the right answer on other allocators.

<!-- @code cpp -->
```cpp
Node* deleteHead(Node* head) {
    if (head == nullptr) return nullptr;

    Node* doomed = head;
    head = head->next;      // read `next` BEFORE the node is freed
    delete doomed;
    return head;
}

// Node* list = build();
// list = deleteHead(list);   // the reassignment is required
```

<!-- @annotations -->
- 5: The whole subtopic is this line coming before line 6. Swapping them reads `next` out of a freed node — undefined behaviour that measured `0x4` here and can look correct elsewhere.
- 2: Unlike head insertion, this guard is required. Without it `head->next` dereferences null on an empty list.
- 11: Same reassignment obligation as insertion — the list *is* the head pointer, and a function receives a copy of it.

<!-- @code java -->
```java
static Node deleteHead(Node head) {
    if (head == null) return null;
    return head.next;
}
```

<!-- @annotations -->
- 3: No free, so no ordering hazard — dropping the reference is the deletion, and the garbage collector reclaims the node once nothing points at it.

<!-- @code python -->
```python
def delete_head(head):
    if head is None:
        return None
    return head.next


# The removed node is freed immediately, not eventually: with a weak
# reference held to the old head, the reference reads None straight
# after `head = head.next` -- CPython frees it when the count hits zero.
```

<!-- @annotations -->
- 4: There is nothing to free and nothing to order. The old head becomes unreachable the moment the caller reassigns, and its reference count drops to zero.

<!-- @approach -->
### Pop: Remove the Head and Return Its Value

<!-- @idea -->
Read the value out before releasing the node, then remove it.

<!-- @steps -->
1. Fail or report empty if the list has no nodes.
2. Copy the head's value into a local.
3. Save the head pointer and advance the head.
4. Free the saved node.
5. Return the copied value.

<!-- @complexity -->
- time: O(1)
- space: O(1)
- note: What deletion is usually actually for — this is a stack pop, and head insertion is the matching push. The ordering rule applies one level deeper: the **value** must be copied out before the free, exactly as the pointer must. Returning `doomed->data` after `delete doomed` is the same defect wearing different clothes, and it reads just as innocently.

<!-- @code cpp -->
```cpp
#include <stdexcept>

int pop(Node*& head) {
    if (head == nullptr) throw std::runtime_error("pop from an empty list");

    int value = head->data;     // copy the value out first
    Node* doomed = head;
    head = head->next;
    delete doomed;
    return value;
}
```

<!-- @annotations -->
- 7: Copying the value before the free, for the same reason the pointer is read before the free. `return doomed->data;` placed after line 10 is undefined behaviour.
- 3: `Node*&` here rather than a return value, because the function already returns the popped value — this is the case where taking the pointer by reference genuinely reads better.
- 4: Throwing rather than returning a sentinel, because every `int` is a legitimate value and there is no spare one to mean "empty".

<!-- @code java -->
```java
static int pop(LinkedList list) {
    if (list.head == null) throw new NoSuchElementException("pop from an empty list");
    int value = list.head.data;
    list.head = list.head.next;
    return value;
}
```

<!-- @annotations -->
- 2: `NoSuchElementException` is what the standard collections throw for this, so callers already know how to handle it.
- 4: Holding the head on an object sidesteps Java's inability to pass a reference by reference — the same trick the tail-pointer approach used in the previous subtopic.

<!-- @code python -->
```python
def pop(node_list):
    if node_list.head is None:
        raise IndexError("pop from an empty list")
    value = node_list.head.data
    node_list.head = node_list.head.next
    return value


# IndexError is what list.pop() raises on an empty list, so this
# matches what a caller already expects.
```

<!-- @annotations -->
- 3: Matching the built-in's exception type matters more than the message — `except IndexError` is what surrounding code will already be written to catch.

<!-- @approach -->
### Clear the Whole List

<!-- @idea -->
Repeat the deletion until the list is empty — iteratively, because the recursive version puts one stack frame on the stack per node.

<!-- @steps -->
1. Start at the head.
2. While the current pointer is not null, save its `next`.
3. Free the current node.
4. Move to the saved `next`.
5. Set the caller's head to null when finished.

<!-- @complexity -->
- time: O(n) — each node is visited and freed once
- space: O(1) iteratively, and **O(n) stack** recursively
- note: The recursive version is shorter and prettier and has a hard size limit. Measured by bisection with an 8 MB stack: it survives **256,250** nodes and overflows by **262,500** — about **32 bytes of stack per node**. The iterative version handled 2,000,000 without difficulty. The failure is a crash rather than a wrong answer, and a quarter of a million nodes is not an unusual size.

<!-- @code cpp -->
```cpp
void clear(Node*& head) {
    while (head != nullptr) {
        Node* next = head->next;    // capture before freeing, for the third time
        delete head;
        head = next;
    }
}

// The recursive version reads better and overflows the stack:
//
//   void clear(Node* head) {
//       if (head == nullptr) return;
//       clear(head->next);
//       delete head;
//   }
//
// survives 256,250 nodes and crashes at 262,500 -- 32 bytes per frame.
```

<!-- @annotations -->
- 3: The same ordering rule as the single deletion, applied once per node. This is the third place in this container where `next` must be captured before the free.
- 5: `head` ends as null, so the caller is left with a valid empty list rather than a dangling pointer.
- 14: Not tail recursion — the `delete` happens *after* the recursive call returns, so no compiler can turn it into a loop for you.

<!-- @code java -->
```java
static void clear(LinkedList list) {
    list.head = null;
    list.tail = null;
}
```

<!-- @annotations -->
- 2: Dropping the head makes every node unreachable at once, and the collector handles the rest — no traversal is needed, which is the one place a garbage-collected language is strictly simpler here.

<!-- @code python -->
```python
def clear(node_list):
    node_list.head = None
    node_list.tail = None


# Dropping the head releases the whole chain. Measured at 100,000,
# 1,000,000 and 4,000,000 nodes: freed cleanly every time, with no
# RecursionError -- worth checking, since a refcount cascade down a
# four-million-node chain is exactly the shape that could blow a stack.
```

<!-- @annotations -->
- 2: One assignment frees the entire list, because each node's only reference is the previous node's `next`, so the whole chain's counts fall to zero in sequence.

<!-- @example -->

<!-- @input -->
`10 -> 20 -> 30 -> null`, deleting the head

<!-- @output -->
`20 -> 30 -> null`, with the node holding 10 freed

<!-- @why -->
The operation in its simplest form, showing that nothing after the second node is touched.

<!-- @walkthrough -->
1. Save a pointer to the node holding 10 — it is about to become unreachable and must not be lost.
2. Read `head->next`, which is the node holding 20, **while the node holding 10 is still valid**.
3. Set `head` to that node. The list is now `20 -> 30 -> null`.
4. Free the saved node.
5. The nodes holding 20 and 30 were never read or written — the operation is O(1) regardless of how long the tail is.
6. The caller's head pointer must be updated, exactly as with insertion, since the list is that pointer.
7. Repeating this three times empties the list; a fourth attempt hits the empty-list guard.

<!-- @example -->

<!-- @input -->
`delete head;` followed by `head = head->next;`

<!-- @output -->
Expected `0x1057edb30`, got `0x4` — and `0x0` when one allocation intervenes

<!-- @why -->
Shows that the wrong order is not a style problem but a read of memory the allocator has taken back, and that the symptom depends on what else the program is doing.

<!-- @walkthrough -->
1. `head->next` is stored inside the head node itself.
2. `delete head` returns that memory to the allocator, which is free to write its own bookkeeping into it.
3. Reading `head->next` afterwards is undefined behaviour, whatever value comes back.
4. Measured with nothing else happening, the read returned **`0x4`** where the true pointer was `0x1057edb30`.
5. Measured with one node allocated in between, it returned **`0x0`** — and the new node had landed at exactly the freed address, so the read picked up the new node's null `next`.
6. On an allocator that stores its free-list pointer in the first word of a block, the `next` field at offset 8 survives and the buggy code returns the **correct** answer.
7. That is the dangerous case: identical code, identical bug, and it works until the allocator, the struct layout or the surrounding allocations change.
8. Saving the pointer into a local before the free costs one variable and removes the question entirely.

<!-- @example -->

<!-- @input -->
Freeing lists of increasing length recursively

<!-- @output -->
256,250 nodes survive; 262,500 overflow the stack

<!-- @why -->
Locates the limit of the version that reads best, so the choice between it and the loop is a number rather than a preference.

<!-- @walkthrough -->
1. The recursive `clear` calls itself before deleting, so the whole chain is on the stack before any node is freed.
2. That is one frame per node, and the frames are small — just a saved return address, frame pointer and the parameter.
3. Bisecting with an 8 MB stack, the largest list that survived was **256,250** nodes; **262,500** crashed.
4. Dividing the stack limit by the surviving depth gives **32 bytes per frame**, which matches a minimal AArch64 frame.
5. The iterative version freed 2,000,000 nodes without difficulty, using a single pointer.
6. The failure mode is a segmentation fault, not a wrong answer, so it will not be caught by checking output.
7. It is also not tail recursion — the `delete` happens after the recursive call returns — so no compiler will convert it to a loop.

<!-- @example -->

<!-- @input -->
Unlinking the head in Python, with a weak reference held to it

<!-- @output -->
The weak reference reads `None` immediately after

<!-- @why -->
Confirms that "deletion" in a reference-counted runtime is immediate rather than deferred, which is not true of every garbage-collected language.

<!-- @walkthrough -->
1. A weak reference does not keep its target alive, so it goes to `None` exactly when the object is destroyed.
2. Before unlinking, the head has one reference — the caller's variable.
3. `head = head.next` drops that reference, and nothing else points at the old head.
4. Its count reaches zero and CPython frees it at that moment; the weak reference reads `None` straight away.
5. That is a property of reference counting, not of garbage collection generally — a tracing collector would free it at some unspecified later point.
6. Setting the test up surfaced an unrelated detail: `__slots__` removes weak-reference support, and `weakref.ref` raises `TypeError` until `__weakref__` is added to the slots list.
7. Since the previous subtopic recommended `__slots__` for a 7x memory saving, that is worth knowing before it surprises you.

<!-- @visualization linked-list -->

<!-- @description -->
Open on the correct sequence, drawn as three discrete beats over a chain `10 -> 20 -> 30 -> null`: first a `doomed` label appears on the first node, then the `head` label slides to the second node along the still-intact arrow, and only then does the first box grey out and vanish. The arrow being followed *before* the box disappears is the entire point, so pace those three beats deliberately and let the reader see the order. Then replay it wrong: the first box vanishes first, leaving `head` pointing into an empty slot, and the arrow it needed goes with it — draw the subsequent read as a question mark landing on scrambled bytes rather than on the second node. Put the two measured outcomes beside it, `0x4` and `0x0`, with a note that a third allocator would have returned the correct pointer and hidden the bug entirely. Next, the asymmetry panel: insertion and deletion side by side on an empty list. Insertion's arrow lands on null and produces a valid one-element list with no branch; deletion has no node to take and no arrow to follow, so a guard box appears in its path. Label them no guard needed and guard required. The centre is the whole-list teardown, animated twice over the same chain. Iteratively: a single pointer walks forward, capturing the next arrow, freeing one box, stepping on — with a constant-height stack meter beside it. Recursively: the walk descends to the very end before a single box is freed, and the stack meter climbs one notch per node, then unwinds freeing boxes on the way back. Mark the meter with a ceiling line at 8 MB and show it touched at 256,250 nodes, with the next size crashing. Close on the reference-counted view: the same deletion in Python with a small counter attached to the head node, ticking from 1 to 0 as the arrow is redirected, and the box disappearing on the instant it reaches zero — captioned freed immediately, not eventually.

<!-- @sampleInput -->
```json
{"primary":{"before":"head -> 10 -> 20 -> 30 -> null","after":"head -> 20 -> 30 -> null","freed":"the node holding 10","statements":["Node* doomed = head;","head = head->next;","delete doomed;"],"cost":"O(1) — nothing after the second node is touched"},"smallCases":[{"before":"10 -> 20 -> 30 -> null","after":"20 -> 30 -> null"},{"before":"7 -> null","after":"null","note":"one-element list becomes empty"},{"before":"null","after":"null","note":"empty list — the guard fires"}],"orderingRule":{"statement":"read `next` out of the node BEFORE freeing it","why":"the only route to the rest of the list is stored inside the node being destroyed","wrongVersion":["delete head;","head = head->next;"],"measured":[{"scenario":"nothing allocated in between","expected":"0x1057edb30","got":"0x4","verdict":"wrong"},{"scenario":"one allocation in between","expected":"0x1057edb30","got":"0x0","verdict":"wrong; the new node landed at exactly the freed address"}],"theDangerousCase":"on allocators that store their free-list pointer in the first word of a freed block, the `next` field at offset 8 survives untouched and the buggy version returns the correct answer — the same bug, silent","appearsThreeTimes":["deleting one node","popping a value (copy the data out first too)","clearing the whole list (capture next per node)"]},"emptyListAsymmetry":{"insertion":"works with no special case — node->next = head correctly sets null","deletion":"needs an explicit guard — head->next dereferences null otherwise","designNote":"deleting from an empty list is an error rather than a no-op; 'delete failed' and 'the list is now empty' are different facts"},"popVariant":{"purpose":"this is a stack pop; head insertion is the matching push","rule":"copy the VALUE out before the free, exactly as the pointer is read before the free","wrongVersion":"return doomed->data; placed after delete doomed;","exceptionChoice":{"cpp":"std::runtime_error","java":"NoSuchElementException","python":"IndexError — what list.pop() raises"},"whyNotASentinel":"every int is a legitimate value, so there is no spare one to mean empty"},"clearingTheList":{"recursiveIsPrettierAndBounded":true,"measuredByBisection":{"stackLimitBytes":8372224,"survives":256250,"crashesBy":262500,"bytesPerFrame":32},"iterative":{"handled":2000000,"space":"O(1)"},"failureMode":"segmentation fault, not a wrong answer — checking output will not catch it","notTailRecursion":"the delete happens after the recursive call returns, so no compiler converts it to a loop"},"managedLanguages":{"noFree":"removing the head means dropping the last reference to it","cpythonIsImmediate":{"test":"weak reference held to the old head","result":"reads None straight after head = head.next","why":"reference counting frees at the moment the count reaches zero, unlike a tracing collector"},"longChainTeardown":[{"nodes":100000,"result":"freed cleanly"},{"nodes":1000000,"result":"freed cleanly"},{"nodes":4000000,"result":"freed cleanly"}],"reading":"no RecursionError at any size tried, which is worth checking rather than assuming — a refcount cascade down a four-million-node chain is exactly the shape that could blow a C stack","slotsCaveat":"__slots__ removes weak-reference support; weakref.ref raises TypeError until '__weakref__' is listed in it"},"assertions":["the list is one node shorter","the old second node is the new head","no node beyond the second is read or written","the operation is O(1) regardless of length","deleting from an empty list changes nothing"],"recommendation":"guard the empty list, save the head, advance, then free — in that order; clear a whole list iteratively, never recursively","lesson":"the route to the rest of the list is stored inside the node you are destroying, so the order of two statements decides whether the program is correct or merely appears to be"}
```

<!-- @highlights -->
- The correct sequence plays as three deliberate beats over `10 -> 20 -> 30 -> null`.
- A `doomed` label appears on the first node, then `head` slides to the second along the still-intact arrow, and only then does the first box vanish.
- Following the arrow *before* the box disappears is the entire point, so the beats are paced to make the order visible.
- The wrong order replays: the first box vanishes first, taking its arrow with it.
- The subsequent read is drawn as a question mark landing on scrambled bytes rather than on the second node.
- The two measured outcomes sit beside it — `0x4` and `0x0` — noting a third allocator would have returned the correct pointer and hidden the bug.
- The asymmetry panel puts insertion and deletion side by side on an empty list.
- Insertion's arrow lands on null and yields a valid one-element list with no branch, labelled no guard needed.
- Deletion has no node to take and no arrow to follow, so a guard box appears in its path, labelled guard required.
- The centre tears down the same chain twice, with a stack meter beside each.
- Iteratively, one pointer walks forward capturing the next arrow and freeing one box at a time, and the meter stays flat.
- Recursively, the walk descends to the very end before any box is freed, the meter climbing one notch per node.
- A ceiling line marks 8 MB, touched at 256,250 nodes, with the next size crashing.
- The close shows the same deletion in Python with a reference counter on the head node.
- The counter ticks from 1 to 0 as the arrow is redirected, and the box disappears the instant it hits zero.
- That frame is captioned freed immediately, not eventually.

<!-- @edgeCases -->
- The empty list — the guard fires and nothing happens; without it, `head->next` dereferences null.
- A one-element list — the head becomes null, which is a valid empty list, and the caller must be left holding that null.
- Deleting every node in turn — works, and the fourth attempt on a three-node list must hit the guard rather than crash.
- Freeing before reading `next` — undefined behaviour that measured wrong immediately here and can appear correct on other allocators.
- Returning `doomed->data` after the free — the same defect at the value level, and just as invisible in review.
- Clearing a list of a quarter of a million nodes recursively — overflows an 8 MB stack at about 262,500 nodes.
- Clearing a list and leaving the caller's head dangling — set it to null, or the caller holds a pointer to freed memory.
- Deleting the head while another pointer still refers to that node — the other pointer dangles immediately; a list has no way to know about it.
- A list with a tail pointer, when the last node is deleted — the tail must be reset to null or it dangles.
- In Python, holding a weak reference to a node whose class uses `__slots__` — raises `TypeError` unless `__weakref__` is listed.

<!-- @pitfalls -->
- Freeing the node before reading its `next`. The route to the rest of the list is inside the node being destroyed; measured, the read returned `0x4` where a real pointer belonged.
- Assuming the wrong order is safe because the tests pass. On some allocators the `next` field survives the free and the buggy version returns the correct answer indefinitely.
- Omitting the empty-list guard. Head insertion needs none, which makes it easy to assume deletion needs none either — and it dereferences null.
- Returning the removed node's data after freeing it. Copy the value into a local first, exactly as with the pointer.
- Clearing a long list recursively. It survives 256,250 nodes and crashes at 262,500, at 32 bytes of stack per node.
- Expecting the compiler to turn that recursion into a loop. It is not tail recursion — the `delete` runs after the call returns.
- Leaving the caller's head pointing at freed memory after a clear. Set it to null as part of the operation.
- Forgetting to reset a tail pointer when the last node goes. It dangles, and the next append writes through it.
- Using a sentinel return value to signal an empty pop. Every `int` is a legitimate value; throw instead.
- Assuming a garbage-collected language frees the node at once. CPython does, because it refcounts; a tracing collector frees at an unspecified later time.

<!-- @doubt -->
### Does the order of `delete` and `head = head->next` really matter?

<!-- @answer -->
Yes, and it is the whole subtopic. `head->next` lives **inside** the head node, so once you free that node the pointer you need belongs to the allocator, and reading it is undefined behaviour. Measured here, reading `next` out of a freed node returned **`0x4`** where the true pointer was `0x1057edb30`; with one allocation in between it returned `0x0`, because the new node landed at exactly the freed address and the read picked up its null `next`. The genuinely dangerous case is a different allocator: many store their free-list pointer in the *first* word of a freed block, which on this layout overwrites `data` and its padding and leaves `next` at offset 8 untouched — so the buggy code returns the right answer and keeps doing so until the struct, the allocator or the surrounding allocations change. Save the pointer into a local first; it costs one variable.

<!-- @doubt -->
### Why does deletion need an empty-list check when insertion did not?

<!-- @answer -->
Because insertion had something to work with and deletion does not. Inserting into an empty list sets the new node's `next` to null, which is exactly what a correct one-element list looks like — the general path handles it, and an extra branch would be dead code. Deleting from an empty list has no node to remove and no `next` to advance to, so `head->next` dereferences null immediately. The guard is the first line of the function rather than an afterthought. There is also a design decision hiding in it that most problem statements skip: deleting from an empty list is an **error**, not a silent no-op. Returning null quietly is fine for a bare function, but a container class should distinguish "the delete failed" from "the list is now empty", because callers act on those differently.

<!-- @doubt -->
### How do I return the deleted value safely?

<!-- @answer -->
Copy it out before the free, for the same reason you read the pointer before the free. The order is: check for empty, copy `head->data` into a local, save the head pointer, advance the head, free the saved node, return the local. Writing `return doomed->data;` after `delete doomed;` is the identical defect at the value level, and it reads just as innocently in review — arguably worse, because a stale `int` looks like a plausible number where a stale pointer at least has a chance of crashing. On signalling emptiness: throw rather than returning a sentinel. Every `int` is a legitimate value, so there is nothing left over to mean "nothing was there" — use `std::runtime_error` in C++, `NoSuchElementException` in Java, and `IndexError` in Python, which is what `list.pop()` raises and therefore what surrounding code already catches.

<!-- @doubt -->
### Can I clear the whole list recursively? It reads much better.

<!-- @answer -->
It does read better, and it has a hard limit you can measure. `clear(head->next); delete head;` puts one stack frame per node on the stack before it frees anything, because the recursive call comes first. Bisecting with an 8 MB stack, it survived **256,250** nodes and crashed at **262,500** — about **32 bytes per frame**, which matches a minimal frame holding a return address, a frame pointer and the parameter. The iterative loop handled 2,000,000 with a single pointer. Two things make this worse than it sounds: the failure is a segmentation fault rather than a wrong answer, so no amount of checking output will find it; and it is **not** tail recursion, since the `delete` runs after the call returns, so no compiler will rewrite it into a loop for you. A quarter of a million nodes is an ordinary size.

<!-- @doubt -->
### In Java or Python there is no `delete` — is anything actually freed?

<!-- @answer -->
Yes, and in CPython it happens immediately rather than eventually, which is worth knowing precisely. Removing the head means nothing points at that node any more, so its reference count reaches zero and it is destroyed at that instant — measured with a weak reference, which reads `None` straight after `head = head.next`. That is a property of reference counting specifically; a tracing collector like the JVM's would reclaim it at some unspecified later point, so "the node is gone" is true in a weaker sense there. Clearing an entire list is even simpler: assign null to the head and the whole chain becomes unreachable at once, with no traversal needed — the one place a managed runtime is strictly simpler than C++ here. And that teardown is safe at scale: chains of 100,000, 1,000,000 and 4,000,000 nodes all freed cleanly with no `RecursionError`.

<!-- @doubt -->
### Why did `weakref.ref` fail on my node class?

<!-- @answer -->
Because `__slots__` removes weak-reference support unless you ask for it. A class with `__slots__` has no `__dict__` and no `__weakref__` slot, so `weakref.ref(node)` raises `TypeError: cannot create weak reference to 'Node' object`. The fix is to list it: `__slots__ = ("data", "next", "__weakref__")`. This matters because the previous subtopic recommended `__slots__` on node classes for a **7x** memory saving — 344 bytes down to 48 — and this is the cost that comes with it. Adding `__weakref__` gives back weak-reference support at the price of one more pointer per instance, so take it only if something actually needs weak references, which for a plain linked-list node is usually nothing.

<!-- @doubt -->
### What happens to other pointers to the node I just deleted?

<!-- @answer -->
They dangle immediately, and nothing in the list can warn you. A singly linked list has no idea how many pointers refer to any node — a node knows only what comes after it — so deleting the head invalidates every other pointer to that node the instant the memory is released. This is why a tail pointer has to be reset when the last node goes, and why holding a pointer across a deletion is a bug even when the code looks unrelated. In C++ the tools for this are ownership types: `unique_ptr<Node>` for a chain makes the ownership explicit and turns the destructor recursion problem above into a very visible one, and `shared_ptr` makes deletion happen when the last holder lets go. In Java and Python the runtime handles it — the node simply stays alive as long as anything refers to it, which is safer and is also why "deleted" means something weaker there.
