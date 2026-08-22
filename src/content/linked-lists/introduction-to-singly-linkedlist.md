---
id: introduction-to-singly-linkedlist
topic: Linked Lists
title: Introduction to Singly LinkedList
difficulty: Easy
status: ready
prerequisites:
  - data-types
  - variables-and-constants
  - pass-by-value-vs-pass-by-reference
  - while-loop
  - stack-memory-and-recursion-depth
  - time-and-space-complexity-basics
relatedIds:
  - insertion-at-the-head-of-linked-list
  - deletion-of-the-head-of-ll
  - find-the-length-of-the-linked-list
  - search-in-linked-list
  - introduction-to-doubly-ll
---

<!-- @summary -->
A chain of nodes, each holding a value and the address of the next — where storing one 4-byte integer costs **16 bytes** in C++ and **344 bytes** in Python, traversal measured **23x slower** than an array even in the best case, and the folklore that linked lists are cache-hostile turns out to need qualifying: a freshly built list came out **100% contiguous**, and only churn or a deliberately scattered chain produced the 5x collapse everyone warns about.

<!-- @theory -->
## What a linked list is

An array stores its elements side by side and finds the i-th by arithmetic. A
linked list stores each element in its own **node**, and each node carries the
address of the next one. The list is just a pointer to the first node.

```
head
 |
 v
+----+----+    +----+----+    +----+------+
| 10 |  --+--> | 20 |  --+--> | 30 | null |
+----+----+    +----+----+    +----+------+
 data next      data next      data  next
```

Two rules define the whole structure:

- **`head`** points to the first node, or is null when the list is empty.
- The **last node's `next` is null**, which is how you know to stop.

There is no length stored anywhere, no index, and no way to reach the fifth node
except by walking through the first four.

## A node is mostly not your data

The node has to hold a pointer, and a pointer is 8 bytes on a 64-bit machine.
Put a 4-byte integer beside it and the compiler pads the struct to keep the
pointer aligned:

| | Bytes |
|---|---|
| `sizeof(int)` | 4 |
| `sizeof(Node*)` | 8 |
| **`sizeof(Node)`** | **16** — 4 data, 4 padding, 8 pointer |

So **75% of a node is bookkeeping**, and storing a million integers costs:

| | Memory |
|---|---|
| Array of a million `int` | 3,906.25 KB |
| Linked list of a million `int` | **15,625.00 KB** |

Four times the memory to hold the same numbers. In Python it is far worse — see
below.

## Reaching the i-th element is a walk, not a calculation

An array computes the address of element `i` as `base + i * size`, which is one
multiply and one add regardless of `i`. A linked list has no such formula: the
only way to find the address of the next node is to **read it out of the current
one**.

That is the structural cost, and it shows up as more than just extra
instructions. The processor cannot fetch the next node until it has finished
loading this one, so the loads cannot overlap. Measured, summing the elements:

| n | Array | Linked list | Ratio |
|---|---|---|---|
| 1,000 | 0.13us | 1.18us | 9x |
| 10,000 | 0.46us | 9.20us | 20x |
| 100,000 | 4.42us | 89.62us | 20x |
| 1,000,000 | 48.56us | 975.36us | **20x** |

**About 20x, and it does not improve with size.** Part of that is touching 4x the
memory; the rest is the dependency between one load and the next.

## The cache warning, and what is actually true

The standard warning is that linked-list nodes are scattered across memory, so
every step is a cache miss. It is worth checking rather than repeating, because
what a real allocator does is not obvious.

Building a 100,000-node list with `new`, one node at a time, and then measuring
how many nodes sit exactly 16 bytes from their successor:

| How the list was built | Adjacent nodes | Traversal |
|---|---|---|
| Fresh, nothing else allocated | **100.0%** | 103.32us |
| Into a heap fragmented beforehand | **100.0%** | 88.66us |
| After deleting half the nodes and re-inserting | 33.3% | 148.04us |
| One block, chain deliberately shuffled | 0.0% | **529.09us** |

Read the first two rows first. A freshly built list is **perfectly contiguous** —
the allocator hands back consecutive 16-byte slots — and deliberately fragmenting
the heap first did not change that, because the allocator refills the holes in
order.

So the naive list you write today is not cache-hostile. What produces the
collapse is **churn**: delete half the nodes, insert new ones, and adjacency falls
to a third with traversal 1.4x slower. The full 5x needs a chain deliberately
scattered across memory it already owns — a constructed worst case, not something
ordinary code produces.

The honest summary: the 20x against an array is structural and always there. The
extra 5x on top of it is a property of your list's *history*, not of linked lists
as such.

## What you get in exchange

Adding to the front of a linked list is three assignments and does not touch any
existing node. Adding to the front of an array means shifting everything.

Building a list of n elements by repeatedly inserting at the front, against the
same with a `vector`:

| n | Linked list (with `new` per node) | `vector::insert(begin())` | Ratio |
|---|---|---|---|
| 1,000 | 63.01us | 62.89us | **1.0x — a tie** |
| 10,000 | 286.36us | 2,506.46us | 8.8x |
| 100,000 | **2,120.12us** | **351,291.13us** | **166x** |

At a thousand elements they are level, because allocating a thousand nodes costs
about as much as shifting a thousand integers. By a hundred thousand the array is
doing five billion element moves and the list is not.

Note the caveat in the heading: those list figures **include** allocating every
node and freeing it afterwards. Carving the nodes out of one pre-allocated block
instead makes the same comparison read 2,971x — a much more flattering number
that measures a different program from the one you would write.

## Python: a node costs 344 bytes

Python has no pointers to expose, so a node is an object with two attributes. The
cost is startling:

| | Bytes |
|---|---|
| A `Node` instance | 48 |
| ...plus its per-instance `__dict__` | **+296** |
| **Total per node** | **344** |
| A node with `__slots__ = ("data", "next")` | **48** |
| A Python `int` object | 28 |

**344 bytes to store one integer**, and declaring `__slots__` removes the
per-instance dictionary and cuts it to 48 — a **7x** reduction for one line.

Traversal is 7x slower than the built-in list at every size:

| n | `sum(list)` | Node chain | `__slots__` chain |
|---|---|---|---|
| 1,000 | 3.2us | 21.6us | 21.0us |
| 10,000 | 34.1us | 225.6us | 218.2us |
| 100,000 | 388.1us | 2,626.9us | 2,367.1us |

Note that `__slots__` barely helps the *speed* — 2,367.1 against 2,626.9, about
1.1x. It is a memory optimisation, not a traversal one, because the attribute
lookup was never the bottleneck.

And the front-insertion advantage is there too: at 100,000 elements a node chain
took 10,506.2 microseconds against **2,250,832.2** for `list.insert(0, x)` — 2.25
seconds, a factor of 214.

## When to reach for one

Almost never in application code, and constantly in interviews and inside other
data structures. The honest position:

- If you need indexing, iteration, or memory efficiency, use an array. It wins
  by 20x on traversal and 4x on memory.
- If you need to insert or remove at a position you **already hold a pointer to**,
  and you do it often, the list wins by orders of magnitude.
- The catch is "already hold a pointer to". Finding that position costs O(n),
  which usually eats the advantage — and that is why the problems that follow are
  about clever ways to *already be holding* the right pointer.

<!-- @intuition -->
The trade a linked list makes is simple to state and easy to misjudge: it gives up knowing where anything is in exchange for never having to move anything. An array knows the address of element five without looking, and pays for that by keeping every element side by side, so inserting at the front means shifting all of them. A list keeps each element wherever memory happened to be free and threads them together with addresses, so inserting is three assignments — but nothing can be found without walking. What makes the structure worth studying is that the walking is more expensive than it looks. Each step has to read the next address out of the node it is standing on, so the processor cannot start the next load until this one lands, and the loads that an array would overlap end up strictly sequential. That dependency, not cache misses, is the durable cost — and it is why the measured gap against an array stays at about twenty times no matter how big the list gets.

<!-- @approach -->
### Define the Node

<!-- @idea -->
One value and one address; the address is what makes it a list rather than a variable.

<!-- @steps -->
1. Declare a type holding the value you want to store.
2. Add a pointer to the same type, for the next node.
3. Initialise that pointer to null when the node is created, so a lone node is a valid one-element list.
4. Keep a separate pointer to the first node, which is the list itself.

<!-- @code cpp -->
```cpp
struct Node {
    int data;
    Node* next;

    Node(int value) : data(value), next(nullptr) {}
    Node(int value, Node* nextNode) : data(value), next(nextNode) {}
};
```

<!-- @annotations -->
- 3: A pointer to the type being defined, inside its own definition. That is legal because a pointer's size is known before the type is complete — writing `Node next;` instead would be a type of infinite size, and the compiler says so.
- 6: Defaulting `next` to null means a freshly made node is already a valid one-element list, with nothing extra to remember.
- 1: `sizeof(Node)` is 16, not 12 — the compiler inserts 4 bytes of padding after `data` so the 8-byte pointer stays aligned.

<!-- @code java -->
```java
class Node {
    int data;
    Node next;

    Node(int value) { this.data = value; this.next = null; }
    Node(int value, Node next) { this.data = value; this.next = next; }
}
```

<!-- @annotations -->
- 3: Java has no pointer syntax — a reference to `Node` is the same idea with the asterisk removed, and it is null by default.
- 1: Every node is a separate heap object with an object header, so the real footprint is larger than the two fields suggest.

<!-- @code python -->
```python
class Node:
    __slots__ = ("data", "next")

    def __init__(self, data, next=None):
        self.data = data
        self.next = next
```

<!-- @annotations -->
- 2: `__slots__` is the line worth remembering. Without it every node carries a per-instance dictionary and costs **344 bytes** to hold one integer; with it, 48.
- 4: `next=None` by default, so `Node(5)` is a complete one-element list.

<!-- @approach -->
### Build a List and Walk It

<!-- @idea -->
Hold a pointer to the first node, then follow `next` until it is null.

<!-- @steps -->
1. Start with `head` set to null, meaning an empty list.
2. To build, create each node and link it to what came before.
3. To traverse, copy `head` into a temporary pointer.
4. While that pointer is not null, use the node it points at.
5. Move it to `current->next` and repeat.
6. Never advance `head` itself — losing it loses the whole list.

<!-- @complexity -->
- time: O(n) to visit every node, and O(n) to reach any single one
- space: O(1) for the walk itself, on top of the O(n) the nodes already occupy
- note: There is no formula for the address of the i-th node, so reaching it means reading n pointers. Measured against summing an array: 20x slower at 10,000 elements and still 20x at a million — the gap is structural and does not close with size, because each load has to finish before the next address is known.

<!-- @code cpp -->
```cpp
#include <cstdio>

int length(Node* head) {
    int count = 0;
    for (Node* current = head; current != nullptr; current = current->next)
        count++;
    return count;
}

void print(Node* head) {
    for (Node* current = head; current != nullptr; current = current->next)
        printf("%d -> ", current->data);
    printf("null\n");
}
```

<!-- @annotations -->
- 5: `current` is a separate pointer, and `head` is passed by value, so the caller's head is untouched. Writing the loop over `head` directly would leave the caller holding null. `current != nullptr` is the terminating condition, and it is the only thing that ends the walk — a list has no stored length to check against.

<!-- @code java -->
```java
static int length(Node head) {
    int count = 0;
    for (Node current = head; current != null; current = current.next) count++;
    return count;
}

static void print(Node head) {
    for (Node current = head; current != null; current = current.next)
        System.out.print(current.data + " -> ");
    System.out.println("null");
}
```

<!-- @annotations -->
- 3: Java passes the reference by value, so reassigning `current` inside the method cannot affect the caller's variable — the same protection C++ gets from taking `Node*` by value.

<!-- @code python -->
```python
def length(head):
    count = 0
    current = head
    while current is not None:
        count += 1
        current = current.next
    return count


def to_list(head):
    out = []
    current = head
    while current is not None:
        out.append(current.data)
        current = current.next
    return out


# Walking a 100,000-node chain took 2,626.9us against 388.1 for
# sum() over a built-in list of the same values -- about 7x.
```

<!-- @annotations -->
- 4: `is not None`, not `!= None`. Identity is the right test for a sentinel, and it cannot be overridden by a `__eq__` on the node class.
- 5: The walk itself is O(1) in space; `to_list` below it is O(n) because it materialises the values.

<!-- @approach -->
### Insert at the Head

<!-- @idea -->
Point the new node at the current first node, then make it the first node — nothing else moves.

<!-- @steps -->
1. Create a node holding the new value.
2. Set its `next` to the current head.
3. Set head to the new node.
4. Return or store the new head, since the list is identified by that pointer.

<!-- @complexity -->
- time: O(1) — three assignments, independent of how long the list is
- space: O(1) beyond the node itself
- note: The operation the whole structure exists for. Building a list of 100,000 elements by repeated front-insertion measured 2,120.12 microseconds against 351,291.13 for the same with `vector::insert(begin())` — **166x** — and that list figure includes allocating and freeing every node. At 1,000 elements the two are a tie at 63.01 and 62.89, because allocation costs about what shifting a thousand integers costs.

<!-- @code cpp -->
```cpp
Node* insertAtHead(Node* head, int value) {
    Node* node = new Node(value);
    node->next = head;
    return node;
}

// Node* list = nullptr;
// list = insertAtHead(list, 30);
// list = insertAtHead(list, 20);
// list = insertAtHead(list, 10);   ->  10 -> 20 -> 30 -> null
```

<!-- @annotations -->
- 4: Returning the new head is what makes this usable — the caller's pointer must be reassigned, because the list *is* that pointer. Taking `Node*& head` and assigning inside is the other valid shape.
- 3: This works when `head` is null too: the new node's `next` becomes null and it is a correct one-element list, with no special case.
- 2: Every `new` here needs a matching `delete` eventually. A list built this way and never freed leaks 16 bytes per node.

<!-- @code java -->
```java
static Node insertAtHead(Node head, int value) {
    return new Node(value, head);
}

// Node list = null;
// list = insertAtHead(list, 30);
// list = insertAtHead(list, 20);
// list = insertAtHead(list, 10);   ->  10 -> 20 -> 30 -> null
```

<!-- @annotations -->
- 2: One line, because the constructor takes the next node. Garbage collection removes the freeing obligation the C++ version carries.

<!-- @code python -->
```python
def insert_at_head(head, value):
    return Node(value, head)


# head = None
# for v in (30, 20, 10):
#     head = insert_at_head(head, v)     ->  10 -> 20 -> 30 -> None
#
# Building 100,000 elements this way took 10,506.2us against
# 2,250,832.2 for list.insert(0, x) -- about 214x, or 2.25 seconds
# against 0.01.
```

<!-- @annotations -->
- 2: The reassignment `head = insert_at_head(head, v)` is essential. Python passes the reference by value, so a function cannot rebind the caller's name.

<!-- @example -->

<!-- @input -->
Building 10 -> 20 -> 30 by inserting at the head

<!-- @output -->
head points at 10, and the chain ends at a null

<!-- @why -->
The smallest complete picture of the structure — construction, linking, and termination in three steps.

<!-- @walkthrough -->
1. Start with `head` null, which is the empty list.
2. Insert 30: a node is made, its `next` is set to null (the old head), and head now points at it.
3. The list is `30 -> null`.
4. Insert 20: the new node's `next` is set to the node holding 30, and head moves to the new node.
5. The list is `20 -> 30 -> null`, and the node holding 30 never moved in memory.
6. Insert 10 the same way, giving `10 -> 20 -> 30 -> null`.
7. Note the order: inserting at the head reverses the insertion order, which is why this is the natural way to build a stack and the wrong way to preserve input order.

<!-- @example -->

<!-- @input -->
One million integers, in an array and in a linked list

<!-- @output -->
3,906.25 KB against 15,625.00 KB, and 48.56us against 975.36us to sum them

<!-- @why -->
Puts both halves of the cost — memory and traversal — on the same input, so the trade is visible as a single figure rather than an argument.

<!-- @walkthrough -->
1. An `int` is 4 bytes, so a million of them in an array occupy 3,906.25 KB.
2. A node holds a 4-byte `int` and an 8-byte pointer, and the compiler pads it to 16 bytes so the pointer stays aligned.
3. A million nodes therefore occupy 15,625.00 KB — **four times** the array.
4. Summing the array took 48.56 microseconds; summing the list took 975.36 — about **20x**.
5. Part of that is touching four times as much memory.
6. The rest is that the address of the next node lives *inside* the current one, so the processor cannot begin the next load until this one has completed.
7. That ratio was 20x at 10,000 elements and 20x at a million: the gap is structural, not a cache effect that appears at scale.

<!-- @example -->

<!-- @input -->
A 100,000-node list, built four different ways, with node adjacency measured

<!-- @output -->
100.0% adjacent when freshly built; 0.0% and 5x slower when deliberately scattered

<!-- @why -->
Tests the standard warning about linked lists and cache misses, and finds it true only under conditions the warning usually omits.

<!-- @walkthrough -->
1. The claim is that nodes are scattered across memory, so every step of a traversal is a cache miss.
2. Built fresh with `new`, one node at a time, **100.0%** of nodes sat exactly 16 bytes from their successor — the allocator hands back consecutive slots.
3. Traversal took 103.32 microseconds.
4. Fragmenting the heap first by allocating 400,000 nodes and freeing a random three quarters changed nothing: still 100.0% adjacent, 88.66 microseconds.
5. Deleting half the list's nodes and inserting new ones dropped adjacency to 33.3% and traversal to 148.04 — about 1.4x slower.
6. Only a chain deliberately shuffled across a block it already owns reached 0.0% adjacency and 529.09 microseconds — **5x**.
7. So the collapse is real, and it is a property of a list's history rather than of the structure itself.
8. The 20x against an array, by contrast, is present even in the perfectly contiguous case.

<!-- @example -->

<!-- @input -->
A Python node holding a single integer

<!-- @output -->
344 bytes without `__slots__`, 48 with it

<!-- @why -->
The largest one-line saving available anywhere in this container, and it is invisible from the class body.

<!-- @walkthrough -->
1. A plain `Node` instance reports `sys.getsizeof` of 48 bytes.
2. That figure excludes the per-instance `__dict__` every ordinary object carries, which is another 296 bytes.
3. So the real cost is **344 bytes** to hold one integer — and the integer itself is a further 28-byte object.
4. Declaring `__slots__ = ("data", "next")` removes the dictionary entirely, bringing a node to 48 bytes.
5. That is a **7x** reduction from one line, with no change to how the class is used.
6. It barely affects speed: traversing 100,000 nodes took 2,367.1 microseconds with slots against 2,626.9 without, about 1.1x.
7. The lesson is to reach for `__slots__` when a class will have many instances, and not to expect it to make anything faster.

<!-- @visualization linked-list -->

<!-- @description -->
Open with three nodes drawn as two-part boxes — a data half and a next half — with arrows from each next half into the following box, and a `head` label pointing at the first. Make the final next half visibly hold a null rather than an arrow, since that is the only thing that ends a traversal. Then animate the walk: a `current` marker starts on head, lights each node as it lands, and crucially shows the arrow being *read out of the box* before it can move — pause on that read each time, because the fact that the next address lives inside the current node is the whole cost model. Beside it run an array walk on the same values, where the next address is computed from the index with no read at all, and keep a step counter on both so the reader sees them take the same number of steps at very different speeds, with 48.56us against 975.36us at a million elements. Next, the memory panel: draw one node to scale as sixteen cells with four shaded for the data, four hatched as padding, and eight for the pointer, captioned 75% bookkeeping — then stack a million of them beside a million array slots at 15,625 KB against 3,906 KB. The centre of the figure is the layout investigation, and it should be drawn as four memory strips of the same length. Strip one, freshly built: every node adjacent, arrows short and parallel, 100.0%, 103.32us. Strip two, built into a pre-fragmented heap: identical, 100.0%, 88.66us — which is the frame that contradicts the folklore, so hold it. Strip three, after deleting half and re-inserting: arrows begin crossing, 33.3%, 148.04us. Strip four, deliberately shuffled: arrows criss-cross the whole strip, 0.0%, 529.09us. Label the group the cost is your list's history, not the structure. Close on the trade: a front-insertion animation where the list makes three assignments and no existing box moves, beside an array where every element shifts one slot right — with the counters reading 1.0x at a thousand elements and 166x at a hundred thousand, so the crossover is visible rather than asserted.

<!-- @sampleInput -->
```json
{"primary":{"values":[10,20,30],"built":"by inserting at the head in the order 30, 20, 10","chain":"head -> 10 -> 20 -> 30 -> null","note":"inserting at the head reverses the insertion order"},"structure":{"node":"a value plus the address of the next node","head":"points at the first node, or is null when the list is empty","termination":"the last node's next is null — there is no stored length","noRandomAccess":"reaching the i-th node means walking through the i-1 before it"},"nodeSize":{"cpp":{"sizeofInt":4,"sizeofPointer":8,"sizeofNode":16,"layout":"4 data + 4 padding + 8 pointer","alignment":8,"overhead":"4x the payload; 75% of a node is bookkeeping"},"memoryForAMillionInts":{"array":"3,906.25 KB","linkedList":"15,625.00 KB","ratio":"4x"},"python":{"nodeInstance":48,"perInstanceDict":296,"totalWithoutSlots":344,"withSlots":48,"reduction":"7x from one line","intObject":28,"listSlot":"8 bytes, a pointer"}},"traversal":{"why":"the address of the next node lives inside the current one, so loads cannot overlap","cpp":[{"n":1000,"array":0.13,"list":1.18,"ratio":"9x"},{"n":10000,"array":0.46,"list":9.20,"ratio":"20x"},{"n":100000,"array":4.42,"list":89.62,"ratio":"20x"},{"n":1000000,"array":48.56,"list":975.36,"ratio":"20x"}],"reading":"about 20x, and it does not improve with size — the gap is structural rather than a cache effect that appears at scale","python":[{"n":1000,"sumList":3.2,"nodeChain":21.6,"slotsChain":21.0},{"n":10000,"sumList":34.1,"nodeChain":225.6,"slotsChain":218.2},{"n":100000,"sumList":388.1,"nodeChain":2626.9,"slotsChain":2367.1}],"pythonRatio":"about 7x at every size","slotsNote":"__slots__ is a memory optimisation, not a speed one — 2,367.1 against 2,626.9, about 1.1x"},"cacheFolklore":{"claim":"linked-list nodes are scattered across memory, so every step is a cache miss","tested":"100,000-node list, measuring how many nodes sit exactly 16 bytes from their successor","results":[{"howBuilt":"fresh, nothing else allocated","adjacent":"100.0%","traversalUs":103.32},{"howBuilt":"into a heap fragmented beforehand","adjacent":"100.0%","traversalUs":88.66},{"howBuilt":"after deleting half the nodes and re-inserting","adjacent":"33.3%","traversalUs":148.04},{"howBuilt":"one block, chain deliberately shuffled","adjacent":"0.0%","traversalUs":529.09}],"verdict":"a freshly built list is perfectly contiguous and deliberately fragmenting the heap first did not change that; the collapse comes from churn, and the full 5x needs a constructed worst case","honestSummary":"the 20x against an array is structural and always present; the extra 5x is a property of the list's history"},"whatYouGetInExchange":{"operation":"insert at the front — three assignments, no existing node moves","cpp":[{"n":1000,"linkedListWithNew":63.01,"vectorInsertBegin":62.89,"ratio":"1.0x — a tie"},{"n":10000,"linkedListWithNew":286.36,"vectorInsertBegin":2506.46,"ratio":"8.8x"},{"n":100000,"linkedListWithNew":2120.12,"vectorInsertBegin":351291.13,"ratio":"166x"}],"caveat":"those list figures include allocating every node and freeing it afterwards; carving nodes from one pre-allocated block instead reads 2,971x, which measures a different program from the one you would write","python":[{"n":1000,"nodeChain":73.5,"listInsertZero":261.3,"ratio":"3.6x"},{"n":10000,"nodeChain":751.4,"listInsertZero":24008.9,"ratio":"32.0x"},{"n":100000,"nodeChain":10506.2,"listInsertZero":2250832.2,"ratio":"214.2x"}]},"whenToUseOne":["if you need indexing, iteration, or memory efficiency, use an array — it wins by 20x on traversal and 4x on memory","if you need to insert or remove at a position you already hold a pointer to, and do it often, the list wins by orders of magnitude","the catch is 'already hold a pointer to' — finding that position is O(n), which usually eats the advantage"],"assertions":["the list is identified by the head pointer alone","an empty list is a null head","the last node's next is null","reaching the i-th node requires reading i pointers","inserting at the head moves no existing node"],"lesson":"a linked list gives up knowing where anything is in exchange for never having to move anything — and the walking costs more than it looks, because each step must read the next address out of the node it is standing on"}
```

<!-- @highlights -->
- Three nodes are drawn as two-part boxes — a data half and a next half — with arrows into the following box and a `head` label on the first.
- The final next half visibly holds a null rather than an arrow, since that is the only thing that ends a traversal.
- A `current` marker walks the chain, lighting each node, and pauses to show the arrow being read *out of* the box before it can move.
- That pause is the cost model: the next address lives inside the current node.
- An array walk runs alongside on the same values, computing the next address from the index with no read at all.
- A step counter on both shows the same number of steps at very different speeds — 48.56us against 975.36us at a million elements.
- The memory panel draws one node to scale as sixteen cells: four shaded for data, four hatched as padding, eight for the pointer.
- It is captioned 75% bookkeeping, with a million nodes stacked beside a million array slots at 15,625 KB against 3,906 KB.
- The centre is four memory strips of equal length showing how the same list can be laid out.
- Strip one, freshly built: every node adjacent, arrows short and parallel — 100.0%, 103.32us.
- Strip two, built into a pre-fragmented heap: identical at 100.0%, 88.66us — the frame that contradicts the folklore, held longer.
- Strip three, after deleting half and re-inserting: arrows begin crossing — 33.3%, 148.04us.
- Strip four, deliberately shuffled: arrows criss-cross the whole strip — 0.0%, 529.09us.
- The group is labelled the cost is your list's history, not the structure.
- The close is the trade: front-insertion makes three assignments and moves no existing box, while the array shifts every element one slot right.
- The counters read 1.0x at a thousand elements and 166x at a hundred thousand, so the crossover is visible rather than asserted.

<!-- @edgeCases -->
- The empty list — `head` is null, and every traversal loop must handle it by simply never running rather than by a special case.
- A one-element list — its `next` is null, so it is both the first and last node; most bugs that treat "first" and "last" differently show up here.
- Losing the head — a list is only reachable through that pointer, so overwriting it without keeping a copy leaks every node and loses the data.
- Advancing `head` inside a traversal loop instead of a copy — the caller is left holding the end of the list, or null.
- Reading `current->data` after the loop — `current` is null at that point, and dereferencing it is a crash rather than a wrong answer.
- Forgetting to set the new node's `next` — it holds whatever the allocator left there, and the traversal walks into unowned memory.
- Inserting into an empty list — works with no special case, because the new node's `next` becomes null.
- A cycle in the chain — traversal never terminates, which is why detecting one is its own problem later in this topic.
- Freeing nodes in C++ — each `new` needs a `delete`, and freeing must capture `next` *before* deleting the node.
- A very long list traversed recursively — one stack frame per node, so it overflows where the loop version does not.

<!-- @pitfalls -->
- Expecting `list[i]` to exist. There is no index and no address arithmetic; reaching the i-th node means reading i pointers.
- Advancing `head` rather than a separate `current` pointer. The walk works and the caller's list is gone afterwards.
- Assuming the memory cost is the data. A node holding a 4-byte `int` occupies 16 bytes — 75% of it is padding and a pointer.
- Writing a Python node class without `__slots__`. Each instance then costs **344 bytes** to hold one integer, against 48 with it.
- Expecting `__slots__` to make traversal faster. It measured 1.1x, and it is a memory optimisation.
- Repeating that linked lists are always cache-hostile. A freshly built list measured **100.0%** contiguous; the collapse needs churn or a deliberately scattered chain.
- Quoting the pooled front-insertion figure. Carving nodes from one pre-allocated block gives 2,971x, where including real allocation gives 166x — and a tie at a thousand elements.
- Reaching for a linked list to make insertion fast without checking how you will find the insertion point. Locating it is O(n), which usually cancels the O(1) insert.
- Dereferencing the loop variable after the loop ends. It is null by definition at that point.
- Deleting a node before reading its `next`. The pointer to the rest of the list is inside the node you just freed.

<!-- @doubt -->
### Why use a linked list at all if arrays are faster?

<!-- @answer -->
Because they are faster at different things, and the gap runs both ways by orders of magnitude. Arrays win traversal by about **20x** and memory by **4x** — summing a million integers took 48.56 microseconds from an array and 975.36 from a list, at 3,906 KB against 15,625 KB. Lists win insertion at a position you already hold: building 100,000 elements by repeated front-insertion took 2,120.12 microseconds against **351,291.13** for `vector::insert(begin())`, a factor of 166. The honest catch is in "already hold". If you have to *find* the position first, that search is O(n) and usually cancels the O(1) insertion — which is exactly why the problems that follow this one are largely about arranging to be holding the right pointer already.

<!-- @doubt -->
### Why is a node 16 bytes when an int is 4?

<!-- @answer -->
Because it also holds a pointer, and the pointer has to be aligned. On a 64-bit machine `Node*` is 8 bytes and must sit at an 8-byte boundary, so after the 4-byte `data` the compiler inserts **4 bytes of padding** and places the pointer at offset 8. Total 16, of which only 4 are your data — **75% bookkeeping**. Reordering the fields does not help, since the padding would just move to the end to keep the struct's size a multiple of its alignment. It is why a list of a million integers occupies 15,625 KB where the array occupies 3,906. In Python the same accounting is far worse: a node is 344 bytes without `__slots__`, since every ordinary object carries a per-instance dictionary.

<!-- @doubt -->
### Are linked lists really terrible for the cache?

<!-- @answer -->
Less than the warning suggests, and it is worth being precise because the usual version is misleading. I built a 100,000-node list with `new`, one node at a time, and measured how many nodes sat exactly 16 bytes from their successor: **100.0%**. The allocator hands back consecutive slots, so a freshly built list is perfectly contiguous. Fragmenting the heap beforehand — allocating 400,000 nodes and freeing a random three quarters — changed nothing, still 100.0%, because the allocator refills the holes in order. What *does* scatter a list is churn: deleting half its nodes and inserting new ones dropped adjacency to 33.3% and traversal from 103.32 to 148.04 microseconds. The 5x collapse everyone quotes needed a chain deliberately shuffled across memory it already owned — 529.09 microseconds at 0.0% adjacency. So the scattering is real but it is a property of your list's history. The 20x against an array is present even when every node is adjacent.

<!-- @doubt -->
### Why must I return the new head after inserting?

<!-- @answer -->
Because the list *is* that pointer, and a function receives a copy of it. When you write `insertAtHead(head, 10)`, the function gets its own copy of the head pointer; reassigning that copy inside cannot change the caller's variable, so the caller would still be pointing at the old first node and the new one would be unreachable. Returning the new head and writing `head = insertAtHead(head, 10)` fixes it, and so does taking the pointer by reference — `Node*& head` in C++ — and assigning inside. Java and Python have the same constraint for the same reason: both pass references by value, so a function can follow a reference but cannot rebind the caller's name. This is the single most common first bug with linked lists, and it presents as a list that never grows.

<!-- @doubt -->
### What actually makes traversal slow?

<!-- @answer -->
The dependency between one step and the next, more than the cache. To visit the next node the processor has to read its address **out of** the current node, so it cannot begin that load until this one has completed — the loads are strictly sequential where an array's can overlap, because an array's addresses are computable in advance. That is why the measured gap sits at about **20x** and stays there: 20x at 10,000 elements, 20x at 100,000, 20x at a million. A cache effect would grow with size as the data outgrew each level; this does not. Touching four times the memory contributes as well, but the ordering constraint is the part you cannot optimise away without changing the data structure.

<!-- @doubt -->
### Should I always add `__slots__` to a Python node class?

<!-- @answer -->
For a node class, yes — it is the largest one-line saving in this container. Without it each instance carries a per-instance `__dict__`, so a node holding one integer costs 48 bytes for the object plus **296 for the dictionary — 344 total**. Declaring `__slots__ = ("data", "next")` removes the dictionary and brings it to **48**, a 7x reduction, with no change to how the class is used. What it will not do is make anything faster: traversing 100,000 nodes measured 2,367.1 microseconds with slots against 2,626.9 without, about 1.1x, because attribute lookup was never the bottleneck. The trade-off to know is that a class with `__slots__` cannot take new attributes at runtime and needs care with multiple inheritance — neither of which matters for a node.

<!-- @doubt -->
### How do I know where the list ends?

<!-- @answer -->
By the null, and by nothing else. A linked list stores no length, so the last node's `next` being null is the only termination signal — which is why every traversal is `while (current != nullptr)` and why forgetting to initialise a new node's `next` is so dangerous: the node holds whatever was in that memory, the loop follows it, and the program walks into storage it does not own. Two consequences follow. Getting the length is O(n), not O(1), which is its own subtopic shortly. And if the chain ever loops back on itself the traversal never terminates at all — detecting that is a problem later in this topic, and the fact that it needs a whole technique tells you how little a list knows about its own shape.
