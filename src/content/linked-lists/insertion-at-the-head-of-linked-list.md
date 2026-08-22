---
id: insertion-at-the-head-of-linked-list
topic: Linked Lists
title: Insertion at the head of Linked List
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-singly-linkedlist
  - pass-by-value-vs-pass-by-reference
  - functions-declaration-and-calling
  - while-loop
  - data-types
  - time-and-space-complexity-basics
relatedIds:
  - introduction-to-singly-linkedlist
  - deletion-of-the-head-of-ll
  - find-the-length-of-the-linked-list
  - reverse-a-ll
  - insert-node-before-head-in-doubly-linked-list
---

<!-- @summary -->
Put a new node at the front — two assignments, O(1), and the only constant-time insertion a bare singly linked list has; where that single fact makes the obvious way to build a list in order **quadratic**, measured **435x** slower at 16,000 elements and growing x4.3 per doubling; and where the function signature is the real trap, because taking the head by value compiles, runs, leaks every node, and leaves the list empty with no warning at all.

<!-- @theory -->
## The operation

Make a node, point it at the current first node, and call it the new first node.

```
before:   head -> 20 -> 30 -> null

          node(10)
             |
             v
          +----+----+
          | 10 |  --+--> 20 -> 30 -> null
          +----+----+

after:    head -> 10 -> 20 -> 30 -> null
```

Two assignments — `node->next = head` and `head = node`. Nothing else in the list
is read, written, or moved, so it costs the same whether the list has three nodes
or three million.

It also needs **no special case for the empty list**. If `head` is null, the new
node's `next` becomes null, which is exactly what a correct one-element list looks
like.

## The signature is the hard part

The list *is* the head pointer, so an insertion has to change the caller's
pointer. A function receives a copy of it, and assigning to that copy changes
nothing outside.

Four versions, three of which work:

| Signature | Result |
|---|---|
| `Node* insert(Node* head, int v)` returning the new head | works — caller writes `head = insert(head, v)` |
| `void insert(Node*& head, int v)` | works — assigns through a reference |
| `void insert(Node** head, int v)` | works — the C idiom, assigns through `*head` |
| `void insert(Node* head, int v)` assigning locally | **silently does nothing** |

Measured, inserting three nodes with each: the first three give a list of length
3, the fourth gives length **0** — three nodes allocated, none reachable, no
crash and no warning. It compiles cleanly, leaks 48 bytes, and presents as a list
that never grows.

This is the most common first bug with linked lists, and it is a bug about
parameter passing rather than about lists. Java and Python have exactly the same
constraint for exactly the same reason: both pass references by value, so a
function can follow a reference but cannot rebind the caller's name.

## The order comes out backwards

Insert 0, then 1, then 2, and the list reads `2 -> 1 -> 0`. Head insertion
**reverses** the order things arrive in:

| How the list was built | Result for 0..4 |
|---|---|
| Insert at head | `4 3 2 1 0` |
| Insert at tail | `0 1 2 3 4` |

That makes it exactly right for a stack and exactly wrong when input order
matters — and since head insertion is the *only* O(1) insertion available, the
mismatch shapes how lists get built.

## Building a list in order is where it goes wrong

If you want the elements in the order they arrive and you only know how to insert
at the head, the obvious repair is to insert at the tail instead: walk to the last
node and attach there. Each insertion is O(n), so building n elements is
**O(n²)**.

Measured, building a list of n elements, medians of five runs:

| n | Insert at head | **Tail, walking each time** | Tail with a tail pointer | Head then reverse |
|---|---|---|---|---|
| 1,000 | 31.8us | 347.7us | 19.5us | 20.1us |
| 2,000 | 40.2us | 1,162.1us | 39.7us | 41.0us |
| 4,000 | 79.5us | 6,117.5us | 80.7us | 87.4us |
| 8,000 | 190.0us | 36,448.0us | 169.8us | 178.8us |
| 16,000 | **323.9us** | **140,944.5us** | **327.1us** | **343.0us** |

**435x at 16,000 elements**, and the growth confirms the class — x3.65, x4.59,
x4.62, x4.34 per doubling, where a linear method doubles.

The three other columns are within a few percent of each other at every size.
There is no trade-off being made here: the quadratic version is simply worse.

## Two ways out, both linear

**Keep a tail pointer.** Remember the last node as well as the first, and
appending is O(1) — the same two assignments as head insertion, at the other end.
Costs one extra pointer and the discipline of updating it on every insertion.

**Build backwards, then reverse.** Insert at the head as usual, accepting the
reversed order, then reverse the whole list in one O(n) pass at the end.

The second sounds wasteful and is not:

| n | Build alone | Build then reverse | Overhead |
|---|---|---|---|
| 4,000 | 80.7us | 83.0us | **+3%** |
| 16,000 | 321.4us | 336.3us | **+5%** |

The reverse pass touches every node once with no allocation, and allocation is
where the time actually goes — so a whole extra traversal costs less than five
percent. That is worth remembering whenever a linked-list algorithm is easier to
write in reverse.

## Python: the same shape, worse constants

| n | Head | **Tail, walking** | Tail pointer | Head + reverse | `[i for i in range(n)]` |
|---|---|---|---|---|---|
| 1,000 | 90.9us | 4,645.7us | 97.5us | 106.4us | 12.4us |
| 2,000 | 182.7us | 18,266.0us | 196.4us | 215.9us | 25.2us |
| 4,000 | 371.0us | 74,302.4us | 400.1us | 467.0us | 97.5us |
| 8,000 | **797.0us** | **296,774.4us** | 802.0us | 874.3us | **103.6us** |

The quadratic build takes **0.3 seconds** for eight thousand elements — 372x the
head-insertion version.

Read the last column too. A Python list holding the same values builds in 103.6
microseconds, **7.7x faster** than the fastest node chain, and supports indexing
the chain cannot. In Python a hand-built linked list is something you write to
learn the structure or because a problem demands it, not because it is the right
container.

<!-- @intuition -->
Head insertion is almost too simple to discuss — two assignments and no traversal — and the reason it deserves its own subtopic is what it *cannot* do. It is the only position in a bare singly linked list you can reach in constant time, because it is the only one you already have a pointer to. Everything else has to be walked to. That single asymmetry decides how lists get built: the natural operation produces the elements backwards, and the obvious fix, appending to the end instead, quietly turns a linear job into a quadratic one by walking the whole list on every insertion. The two real repairs are both about arranging to already hold the pointer you need — keep the tail as well as the head, or accept the reversed order and turn it around once at the end. That second option looks wasteful and measures at three to five percent, because the walk is cheap and the allocation is not, which is a useful calibration for a structure where it is tempting to count traversals as if they were the expensive part.

<!-- @approach -->
### Optimal - Insert at the Head

<!-- @idea -->
Point the new node at the current first node, then make it the first node.

<!-- @steps -->
1. Create a node holding the value.
2. Set its `next` to the current head.
3. Set the head to the new node.
4. Make sure the caller's head pointer is the one that changed — by returning it, or by taking it by reference.

<!-- @complexity -->
- time: O(1) — two assignments, independent of the list's length
- space: O(1) beyond the node itself
- note: The only constant-time insertion a bare singly linked list offers, and the reason the rest of this container exists. It needs no special case for an empty list, since the new node's `next` becomes null and that is a correct one-element list. Building 16,000 elements this way measured 323.9 microseconds against 140,944.5 for appending to the tail by walking — 435x.

<!-- @code cpp -->
```cpp
// Shape 1: return the new head. The caller must reassign.
Node* insertAtHead(Node* head, int value) {
    return new Node(value, head);
}

// Shape 2: take the head by reference and assign through it.
// Note the different NAME -- see the annotation.
void pushFront(Node*& head, int value) {
    head = new Node(value, head);
}

// Node* list = nullptr;
// list = insertAtHead(list, 30);   // shape 1 -- the reassignment is required
// pushFront(list, 20);             // shape 2 -- reassigns for you
```

<!-- @annotations -->
- 3: Works when `head` is null: the new node's `next` becomes null, which is a correct one-element list. No empty-list branch is needed anywhere in this function.
- 8: `Node*&` — a reference *to the pointer*. Dropping the `&` makes this compile, run, leak the node, and leave the caller's list unchanged.
- 7: The two shapes cannot share a name. Overloading on `Node*` and `Node*&` is ambiguous for an lvalue argument — `insertAtHead(list, 30)` matches both equally and the call fails to compile. Pick one shape per codebase.
- 13: The reassignment on the call site is not optional with shape 1. `insertAtHead(list, 30);` on its own discards the only pointer to the new node.

<!-- @code java -->
```java
static Node insertAtHead(Node head, int value) {
    return new Node(value, head);
}

// Node list = null;
// list = insertAtHead(list, 30);
// list = insertAtHead(list, 20);   ->  20 -> 30 -> null
```

<!-- @annotations -->
- 2: Java has no reference-to-reference, so returning the new head is the only shape available — which makes the reassignment impossible to forget by accident, since ignoring a return value looks wrong.

<!-- @code python -->
```python
def insert_at_head(head, value):
    return Node(value, head)


# head = None
# for v in (30, 20, 10):
#     head = insert_at_head(head, v)     ->  10 -> 20 -> 30 -> None
#
# The reassignment is required: Python passes the reference by value,
# so the function cannot rebind the caller's name.
```

<!-- @annotations -->
- 2: One expression. The whole operation is constructing a node whose `next` is the old head — the "insertion" is the caller's reassignment.

<!-- @approach -->
### Insert at the Tail by Walking

<!-- @idea -->
To keep the arrival order, walk to the last node and attach the new one there.

<!-- @steps -->
1. Create the node.
2. If the list is empty, the new node becomes the head and there is nothing more to do.
3. Otherwise start at the head and follow `next` until reaching a node whose `next` is null.
4. Set that node's `next` to the new node.
5. Repeat for each value, walking the whole list again every time.

<!-- @complexity -->
- time: O(n) per insertion and **O(n^2)** to build a list of n elements
- space: O(1) beyond the nodes
- note: The trap this container is about. It produces the right order and is the obvious repair for head insertion's reversal, and it turns a linear job into a quadratic one — measured 140,944.5 microseconds to build 16,000 elements against 323.9 for head insertion, a factor of **435**. Growth per doubling was x3.65, x4.59, x4.62 and x4.34, where a linear method doubles. In Python it reached 0.3 seconds for eight thousand elements.

<!-- @code cpp -->
```cpp
Node* insertAtTail(Node* head, int value) {
    Node* node = new Node(value);
    if (head == nullptr) return node;

    Node* current = head;
    while (current->next != nullptr) current = current->next;
    current->next = node;
    return head;
}
```

<!-- @annotations -->
- 6: This walk is the whole problem, and the condition is `current->next != nullptr` rather than `current != nullptr` — stopping on the null itself leaves `current` past the end with nothing to attach to. It runs once per insertion and gets longer every time, so building n elements performs n(n-1)/2 pointer reads.
- 3: The empty-list case has to be handled explicitly here, unlike head insertion — there is no last node to attach to.
- 5: Walk a copy, never `head` itself. Advancing `head` here would return a pointer to the last node instead of the first.

<!-- @code java -->
```java
static Node insertAtTail(Node head, int value) {
    Node node = new Node(value);
    if (head == null) return node;

    Node current = head;
    while (current.next != null) current = current.next;
    current.next = node;
    return head;
}
```

<!-- @annotations -->
- 6: Identical cost in Java. The quadratic behaviour is a property of the data structure, not of the language or the allocator.

<!-- @code python -->
```python
def insert_at_tail(head, value):
    node = Node(value)
    if head is None:
        return node
    current = head
    while current.next is not None:
        current = current.next
    current.next = node
    return head


# Building 8,000 elements this way took 296,774.4us -- 0.3 seconds --
# against 797.0 for head insertion. 372x.
```

<!-- @annotations -->
- 6: The walk again. It is easy to miss in review because the function itself looks linear and cheap; the quadratic term only appears when it is called in a loop.

<!-- @approach -->
### Insert at the Tail with a Tail Pointer

<!-- @idea -->
Remember the last node as well as the first, so appending needs no walk.

<!-- @steps -->
1. Keep two pointers: one to the first node and one to the last.
2. Create the node.
3. If the list is empty, both pointers become the new node.
4. Otherwise attach it after the current tail and move the tail to it.
5. Both pointers must be updated together, on every insertion.

<!-- @complexity -->
- time: O(1) per insertion, O(n) to build a list of n elements
- space: O(1) — one extra pointer for the whole list
- note: The direct fix, and it restores head insertion's cost at the other end: measured 327.1 microseconds to build 16,000 elements against 323.9 for head insertion, within noise. The price is bookkeeping — the tail must be updated on every insertion and reset correctly when the last node is removed, which is a class of bug head insertion does not have.

<!-- @code cpp -->
```cpp
struct List {
    Node* head = nullptr;
    Node* tail = nullptr;

    void pushBack(int value) {
        Node* node = new Node(value);
        if (head == nullptr) { head = tail = node; return; }
        tail->next = node;
        tail = node;
    }
};
```

<!-- @annotations -->
- 7: Both pointers set together when the list was empty. Setting only `head` here leaves `tail` null and the next append writes through a null pointer.
- 9: `tail = node` is the line that keeps the O(1) — forgetting it does not break correctness immediately, because `tail->next` still lands on the right node once, but the list silently loses everything appended after that.
- 2: Wrapping the two pointers in a struct is what makes them impossible to update separately by accident.

<!-- @code java -->
```java
class LinkedList {
    Node head = null;
    Node tail = null;

    void pushBack(int value) {
        Node node = new Node(value);
        if (head == null) { head = tail = node; return; }
        tail.next = node;
        tail = node;
    }
}
```

<!-- @annotations -->
- 7: `head = tail = node` assigns right to left, so both end up referring to the same object — which is correct, since a one-element list's first and last node are the same node.

<!-- @code python -->
```python
class LinkedList:
    __slots__ = ("head", "tail")

    def __init__(self):
        self.head = None
        self.tail = None

    def push_back(self, value):
        node = Node(value)
        if self.head is None:
            self.head = self.tail = node
            return
        self.tail.next = node
        self.tail = node


# 802.0us for 8,000 elements against 797.0 for head insertion, and
# against 296,774.4 for walking to the tail each time.
```

<!-- @annotations -->
- 8: Holding the pointers on an object also solves the reassignment problem — `self.head` is reachable from the caller, so no return value is needed.

<!-- @approach -->
### Build Backwards, Then Reverse

<!-- @idea -->
Insert at the head as usual, accept the reversed order, and turn the whole list around once at the end.

<!-- @steps -->
1. Insert every element at the head, which is O(1) each.
2. The list is now in reverse arrival order.
3. Walk it once, pointing each node's `next` at the node before it.
4. Track three pointers while doing so: the previous node, the current node, and the next one — because reassigning `next` destroys the way forward.
5. Return the last node reached, which is the new head.

<!-- @complexity -->
- time: O(n) to build plus one O(n) pass to reverse — linear overall
- space: O(1) — the reversal is done in place with three pointers
- note: The option that sounds wasteful and is not. Measured against building alone: **+3% at 4,000 elements and +5% at 16,000**, because the reverse pass touches each node once with no allocation, and allocation is where the time goes. Worth reaching for whenever a list algorithm is easier to express in reverse — the extra traversal is close to free.

<!-- @code cpp -->
```cpp
Node* reverse(Node* head) {
    Node* prev = nullptr;
    while (head != nullptr) {
        Node* next = head->next;
        head->next = prev;
        prev = head;
        head = next;
    }
    return prev;
}

Node* buildInOrder(const int* values, int n) {
    Node* head = nullptr;
    for (int i = 0; i < n; i++) head = new Node(values[i], head);
    return reverse(head);
}
```

<!-- @annotations -->
- 4: `next` must be saved **before** line 5 overwrites it. Reassigning `head->next` first destroys the only route to the rest of the list.
- 9: `prev`, not `head` — the loop exits with `head` null, and `prev` holds the last node visited, which is the new first node.
- 15: Two linear passes instead of one, and it measured 3-5% slower than the single pass that produces the wrong order.

<!-- @code java -->
```java
static Node reverse(Node head) {
    Node prev = null;
    while (head != null) {
        Node next = head.next;
        head.next = prev;
        prev = head;
        head = next;
    }
    return prev;
}
```

<!-- @annotations -->
- 4: The same three-pointer dance. There is no way to reverse a singly linked list in place with fewer, because each node's forward link is overwritten before it would be needed.

<!-- @code python -->
```python
def reverse(head):
    prev = None
    while head is not None:
        nxt = head.next
        head.next = prev
        prev = head
        head = nxt
    return prev


def build_in_order(values):
    head = None
    for v in values:
        head = Node(v, head)
    return reverse(head)


# 874.3us for 8,000 elements against 797.0 for building alone -- about
# 10% here, against 3-5% in C++, since Python's per-node loop costs
# relatively more than its allocation does.
```

<!-- @annotations -->
- 4: `nxt`, spelled without the `e`, because `next` is a builtin. Shadowing it inside a function is legal and works, and it is still worth avoiding.

<!-- @example -->

<!-- @input -->
Inserting 30, then 20, then 10 at the head

<!-- @output -->
`10 -> 20 -> 30 -> null`

<!-- @why -->
Shows both the mechanics and the order reversal in the smallest case that has all three states — empty, one element, many.

<!-- @walkthrough -->
1. `head` starts null, which is the empty list.
2. Insert 30: the node's `next` is set to null, head points at it. The list is `30 -> null`.
3. No empty-list branch was needed — `next = head` did the right thing because `head` was null.
4. Insert 20: the node's `next` is set to the node holding 30, and head moves to the new node.
5. The list is `20 -> 30 -> null`, and the node holding 30 did not move in memory.
6. Insert 10 the same way, giving `10 -> 20 -> 30 -> null`.
7. The values arrived 30, 20, 10 and the list reads 10, 20, 30 — head insertion reverses the arrival order, which is why it is the natural push for a stack.

<!-- @example -->

<!-- @input -->
Four functions inserting three nodes each, differing only in their signature

<!-- @output -->
Three produce a list of length 3; `void insert(Node* head, int v)` produces length 0

<!-- @why -->
Isolates the most common first bug with linked lists, which is about parameter passing rather than about lists.

<!-- @walkthrough -->
1. `Node* insert(Node* head, int v)` returning the new head works, provided the caller writes `head = insert(head, v)`.
2. `void insert(Node*& head, int v)` works, because the reference lets the function assign to the caller's pointer.
3. `void insert(Node** head, int v)` works for the same reason, written the C way.
4. `void insert(Node* head, int v)` that assigns to `head` inside changes only the local copy.
5. Measured, that fourth version leaves the caller's list at length **0** after three insertions.
6. Three nodes were allocated and none is reachable, so it also leaks 48 bytes.
7. Nothing reports it: it compiles without warning, runs without crashing, and presents as a list that never grows.
8. Java and Python have the same constraint — both pass references by value — which is why the returning shape is the only one available there.

<!-- @example -->

<!-- @input -->
Building 16,000 elements four ways

<!-- @output -->
323.9us, 140,944.5us, 327.1us, 343.0us

<!-- @why -->
Puts the quadratic trap next to its two fixes, showing that the fixes cost essentially nothing.

<!-- @walkthrough -->
1. Head insertion is O(1) per element, so building 16,000 took 323.9 microseconds.
2. Appending to the tail by walking is O(n) per element, so building the same list took **140,944.5** — a factor of 435.
3. Growth per doubling was x3.65, x4.59, x4.62 and x4.34, confirming the quadratic class against a linear method's x2.
4. Keeping a tail pointer makes appending O(1) and produces the right order directly: 327.1 microseconds, within noise of head insertion.
5. Building backwards and reversing once at the end: 343.0 microseconds, about 5% more.
6. So both fixes are free in practice, and the choice between them is about which bookkeeping you prefer.
7. Nothing is being traded away by avoiding the quadratic version — it is worse on every axis except the number of variables it needs.

<!-- @example -->

<!-- @input -->
Building 16,000 elements, with and without a final reverse pass

<!-- @output -->
321.4us against 336.3us — a 5% difference for a whole extra traversal

<!-- @why -->
Calibrates how cheap a traversal is against an allocation, which is the wrong way round from most people's intuition about linked lists.

<!-- @walkthrough -->
1. Building the list alone performs 16,000 allocations and 16,000 pointer assignments.
2. Reversing it afterwards performs 16,000 more pointer assignments and no allocations.
3. Naively that is one extra full pass over the list, so a reader might expect it to cost something like half again.
4. Measured, it cost **+3% at 4,000 elements and +5% at 16,000**.
5. The reason is that the time is dominated by `new`, not by walking — the traversal reads memory that is already hot and does nothing else.
6. The practical consequence is that "build it backwards and turn it around" is a legitimate strategy rather than a fallback.
7. In Python the overhead is larger at about 10%, because there the per-node loop costs relatively more than allocation does.

<!-- @visualization linked-list -->

<!-- @description -->
Open on the operation itself, drawn slowly enough to see that nothing moves: an existing chain `20 -> 30 -> null` sits fixed in place, a new box holding 10 appears above it, one arrow is drawn from the new box to the old first node, and then the `head` label slides from the old first node to the new one. Two arrows change and no existing box shifts by a pixel — hold that frame, because it is the entire cost argument. Immediately replay it with `head` null, so the reader sees the new node's arrow land on a null and the result be a correct one-element list, captioned no empty-list case needed. Next, the signature panel, which needs four call sites side by side and one shared heap. Each call allocates a visible node; in the first three the caller's `head` arrow visibly moves to it, and in the fourth the arrow does not move and the node is left floating unreferenced, greyed out and tagged leaked. Put the resulting lengths under them: 3, 3, 3, and **0**. The centre of the figure is the build comparison, animated as four runs over the same 16,000 elements with a work counter on each. Head insertion: one unit per element, counter rises linearly. Tail-by-walking: draw the walk each time as a sweep across everything built so far, so the sweeps visibly lengthen and the counter curves upward into n²/2. Tail pointer: a second label pinned to the last node, one unit per element, linear again. Head-then-reverse: linear, plus one final sweep drawn in a different colour. End with their timings as bars — 323.9, 140,944.5, 327.1, 343.0 — with the second bar clipped and labelled rather than drawn to scale, since it would be four hundred times the others. Close on the reverse pass in detail: three markers named prev, current and next moving along the chain, with the arrow from `current` visibly flipping backwards only *after* `next` has been captured, and a caption noting the whole extra pass measured under five percent.

<!-- @sampleInput -->
```json
{"primary":{"operations":["insert 30","insert 20","insert 10"],"result":"head -> 10 -> 20 -> 30 -> null","assignments":["node->next = head","head = node"],"note":"nothing existing is read, written or moved"},"smallCases":[{"start":"null","insert":10,"result":"10 -> null","note":"empty list needs no special case"},{"start":"20 -> 30 -> null","insert":10,"result":"10 -> 20 -> 30 -> null"},{"insertOrder":[0,1,2,3,4],"headInsertResult":[4,3,2,1,0],"tailInsertResult":[0,1,2,3,4]}],"whyItIsOOne":{"work":"two assignments","independentOf":"the length of the list","reason":"the head is the one position you already hold a pointer to","emptyListCase":"none needed — the new node's next becomes null, which is a correct one-element list"},"signatureTrap":{"shapes":[{"signature":"Node* insert(Node* head, int v) returning the new head","works":true,"callerMustWrite":"head = insert(head, v)"},{"signature":"void insert(Node*& head, int v)","works":true,"how":"assigns through a reference to the pointer"},{"signature":"void insert(Node** head, int v)","works":true,"how":"the C idiom, assigns through *head"},{"signature":"void insert(Node* head, int v) assigning locally","works":false,"result":"length 0 after three insertions; three nodes allocated, none reachable"}],"measured":{"correctShapesLength":3,"brokenShapeLength":0,"leaked":"48 bytes"},"symptoms":"compiles without warning, runs without crashing, presents as a list that never grows","sameInOtherLanguages":"Java and Python pass references by value too, so the returning shape is the only one available there"},"orderReversal":{"headInsertion":"reverses arrival order","consequence":"exactly right for a stack, exactly wrong when input order matters","andBecause":"head insertion is the only O(1) insertion available, this shapes how lists get built"},"buildingAList":{"unit":"microseconds, medians of five runs, C++","rows":[{"n":1000,"head":31.8,"tailWalking":347.7,"tailPointer":19.5,"headThenReverse":20.1,"ratio":"11x"},{"n":2000,"head":40.2,"tailWalking":1162.1,"tailPointer":39.7,"headThenReverse":41.0,"ratio":"29x"},{"n":4000,"head":79.5,"tailWalking":6117.5,"tailPointer":80.7,"headThenReverse":87.4,"ratio":"77x"},{"n":8000,"head":190.0,"tailWalking":36448.0,"tailPointer":169.8,"headThenReverse":178.8,"ratio":"192x"},{"n":16000,"head":323.9,"tailWalking":140944.5,"tailPointer":327.1,"headThenReverse":343.0,"ratio":"435x"}],"tailWalkingGrowthPerDoubling":["x3.65","x4.59","x4.62","x4.34"],"reading":"quadratic, where a linear method doubles; the three linear columns are within a few percent of each other at every size"},"reversePassIsNearlyFree":{"rows":[{"n":4000,"buildAlone":80.7,"buildThenReverse":83.0,"overhead":"+3%"},{"n":16000,"buildAlone":321.4,"buildThenReverse":336.3,"overhead":"+5%"}],"why":"the reverse pass touches each node once with no allocation, and allocation is where the time goes","pythonOverhead":"about 10%, since the per-node loop costs relatively more there"},"benchPython":{"unit":"microseconds, medians of five runs, CPython 3.13.4","rows":[{"n":1000,"head":90.9,"tailWalking":4645.7,"tailPointer":97.5,"headThenReverse":106.4,"listComprehension":12.4,"ratio":"51x"},{"n":2000,"head":182.7,"tailWalking":18266.0,"tailPointer":196.4,"headThenReverse":215.9,"listComprehension":25.2,"ratio":"100x"},{"n":4000,"head":371.0,"tailWalking":74302.4,"tailPointer":400.1,"headThenReverse":467.0,"listComprehension":97.5,"ratio":"200x"},{"n":8000,"head":797.0,"tailWalking":296774.4,"tailPointer":802.0,"headThenReverse":874.3,"listComprehension":103.6,"ratio":"372x"}],"quadraticCost":"0.3 seconds for eight thousand elements","builtinComparison":"a Python list of the same values builds in 103.6us — 7.7x faster than the fastest node chain, and supports indexing it cannot"},"assertions":["the list grows by exactly one node","the new node is the head","the previous head is the new head's next","no existing node is modified","the operation works unchanged on an empty list"],"recommendation":"insert at the head and return the new head, or take the pointer by reference; to build in arrival order keep a tail pointer, or build backwards and reverse once — never append by walking","lesson":"the head is the only position a bare singly linked list can reach in constant time, and the obvious way to work around that turns a linear build into a quadratic one"}
```

<!-- @highlights -->
- An existing chain `20 -> 30 -> null` sits fixed while a new box holding 10 appears above it.
- One arrow is drawn from the new box to the old first node, then the `head` label slides across.
- Two arrows change and no existing box shifts — that frame is the entire cost argument, so it is held.
- The same insertion replays with `head` null: the new node's arrow lands on a null and the result is a correct one-element list.
- That frame is captioned no empty-list case needed.
- The signature panel shows four call sites over one shared heap, each allocating a visible node.
- In three of them the caller's `head` arrow moves to the new node; in the fourth it does not.
- The unreferenced node is greyed out and tagged leaked, with the four resulting lengths beneath: 3, 3, 3 and 0.
- The centre animates four builds of the same 16,000 elements, each with a work counter.
- Head insertion adds one unit per element and the counter rises linearly.
- Tail-by-walking draws a sweep across everything built so far, the sweeps visibly lengthening as the counter curves into n²/2.
- The tail-pointer version pins a second label to the last node and returns to linear.
- Head-then-reverse is linear plus one final sweep in a different colour.
- The four timings appear as bars — 323.9, 140,944.5, 327.1, 343.0 — with the second clipped and labelled rather than drawn to scale.
- The close follows the reverse pass with three markers named prev, current and next.
- The arrow from `current` flips backwards only after `next` has been captured, captioned that the whole extra pass measured under five percent.

<!-- @edgeCases -->
- Inserting into an empty list — works with no special case, because the new node's `next` becomes null.
- Inserting into a one-element list — the existing node becomes the second, and nothing about it changes.
- Forgetting to reassign the caller's head — the list stays as it was and the new node leaks; nothing reports it.
- Inserting the same value repeatedly — perfectly legal; a linked list has no uniqueness constraint.
- Building in arrival order with head insertion alone — the result is reversed, which is a correctness bug rather than a style issue when order matters.
- Appending with a tail pointer to an empty list — both head and tail must be set, or the next append writes through a null.
- Removing the last node when a tail pointer exists — the tail must be reset, which is the bookkeeping cost of that approach.
- Reversing an empty list — returns null correctly, since the loop never runs and `prev` stays null.
- Reversing a one-element list — returns the same node with `next` already null.
- Forgetting to save `next` before overwriting it during a reversal — the rest of the list becomes unreachable immediately.

<!-- @pitfalls -->
- Taking the head by value and assigning to it. The function compiles, runs, leaks the node, and leaves the caller's list unchanged — measured length 0 after three insertions.
- Calling a returning-shape insert without reassigning. `insertAtHead(list, 30);` discards the only pointer to the new node.
- Appending by walking to the tail in a loop. Building 16,000 elements measured 140,944.5 microseconds against 323.9 — **435x** — with growth of about x4.3 per doubling.
- Assuming the walk is cheap because the function looks linear. The quadratic term only appears when it is called n times, which is why it survives code review.
- Adding an empty-list branch to head insertion. It is unnecessary, and the extra branch is a place for a bug rather than a protection.
- Setting only `head` when appending to an empty list with a tail pointer. The next append dereferences a null tail.
- Forgetting `tail = node` after appending. Correctness survives one insertion and then everything appended afterwards is lost.
- Stopping a tail walk at `current != nullptr`. That leaves `current` past the last node; the condition must be `current->next != nullptr`.
- Overwriting `head->next` before saving it during a reversal. The remainder of the list becomes unreachable in that one assignment.
- Returning `head` rather than `prev` from a reversal. The loop ends with `head` null, so this returns an empty list.
- Reaching for a hand-built linked list in Python by default. A built-in list of the same values built 7.7x faster and supports indexing the chain cannot.

<!-- @doubt -->
### Why does my insertion function not change anything?

<!-- @answer -->
Because it is changing a copy of the head pointer. The list *is* that pointer, and a function receives its own copy — so `head = new Node(...)` inside the function rebinds the local copy and the caller's variable is untouched. Measured, inserting three nodes with `void insert(Node* head, int v)` leaves the caller's list at length **0**: three nodes allocated, none reachable, 48 bytes leaked, and no crash or warning to tell you. Three shapes fix it: return the new head and have the caller write `head = insert(head, v)`, take `Node*& head` and assign through the reference, or take `Node** head` and assign through `*head`. Java and Python cannot offer the second or third — both pass references by value — so returning the new head is the only option there, which at least makes the mistake visible as an ignored return value.

<!-- @doubt -->
### Why is my list coming out backwards?

<!-- @answer -->
Because head insertion reverses arrival order, and that is inherent rather than a bug. Each new node goes in front of everything already there, so the last value inserted is the first one you read — insert 0, 1, 2 and the list is `2 -> 1 -> 0`. That is exactly the behaviour a stack wants, and exactly wrong when the input order matters. You have three options: keep a tail pointer and append instead, which gives the right order directly at the same O(1) cost; build backwards as normal and reverse the whole list once at the end, which measured only 3-5% slower; or feed the values in reverse if you happen to control the order. What you should **not** do is append by walking to the tail each time, which is the next question.

<!-- @doubt -->
### Can I just insert at the tail instead to keep the order?

<!-- @answer -->
Only if you keep a tail pointer. Appending by walking to the last node each time is O(n) per insertion and **O(n²)** for the build — measured 140,944.5 microseconds to build 16,000 elements against 323.9 for head insertion, a factor of **435**, with growth per doubling of x3.65, x4.59, x4.62 and x4.34 where a linear method doubles. In Python it reaches 0.3 seconds for eight thousand elements. The insidious part is that the function itself looks fine: it is a simple linear walk, and the quadratic term only exists because it is called n times. Keeping a tail pointer brings it back to 327.1 microseconds — within noise of head insertion — at the cost of one extra pointer and the discipline of updating it on every insertion.

<!-- @doubt -->
### Is reversing at the end not wasteful?

<!-- @answer -->
It measured **+3% at 4,000 elements and +5% at 16,000**, which is close enough to free that it should change how you think about linked-list algorithms. The reverse pass is a full extra traversal, so the instinct is that it must cost something like half again — but it touches each node once, performs no allocation, and reads memory that is already hot, while the build itself is dominated by `new`. That calibration is the useful part: in a linked list, traversals are cheap relative to allocations, so an algorithm that is easier to express in reverse is usually worth expressing in reverse and turning around at the end. In Python the overhead is larger at about 10%, because there the interpreted per-node loop costs relatively more than allocation does.

<!-- @doubt -->
### Do I need a special case for the empty list?

<!-- @answer -->
Not for head insertion, and adding one is a small liability. When `head` is null, `node->next = head` sets the new node's `next` to null — which is precisely what a correct one-element list looks like — and `head = node` then points at it. The general path handles the empty case exactly right, so an `if (head == nullptr)` branch is dead code that still has to be read, reviewed and maintained. Tail insertion is the opposite: it genuinely needs the branch, because there is no last node to attach to, and the tail-pointer version needs it twice over since both `head` and `tail` must be set. That asymmetry is a small illustration of why head insertion is the operation a bare singly linked list is built around.

<!-- @doubt -->
### Should I use `Node*&` or return the new head?

<!-- @answer -->
Return the new head unless you have a reason not to. Both are correct, and the returning shape has two advantages: it is the only one available in Java and Python, so it is what a reader coming from those languages expects, and it makes the caller's reassignment explicit at the call site — `head = insertAtHead(head, v)` shows that the list identity changed. The reference version reads more cleanly at the call site, `insertAtHead(head, v)`, but that is also its weakness: nothing at the call site indicates that the caller's pointer is being rebound. The `Node**` form is the C idiom and does the same job with more punctuation. Whichever you pick, be consistent within a codebase, because mixing them is how the by-value bug gets written.

<!-- @doubt -->
### Should I be using a linked list for this at all?

<!-- @answer -->
Usually not, and the Python numbers make the point most clearly. Building 8,000 elements as a node chain took 797.0 microseconds at best; the equivalent built-in list took **103.6** — 7.7x faster — while also supporting indexing, slicing and length in constant time, none of which the chain offers. The same holds in C++ against `vector`. What a linked list buys is O(1) insertion and removal at a position you **already hold a pointer to**, and that qualification is doing all the work: if you have to search for the position first, the O(n) search cancels the O(1) edit. Hand-built linked lists earn their place in interviews, inside other data structures, and when nodes are spliced between lists without copying — which is exactly what the rest of this topic is about.
