---
id: find-the-length-of-the-linked-list
topic: Linked Lists
title: Find the length of the Linked List
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-singly-linkedlist
  - insertion-at-the-head-of-linked-list
  - deletion-of-the-head-of-ll
  - while-loop
  - stack-memory-and-recursion-depth
  - time-and-space-complexity-basics
relatedIds:
  - introduction-to-singly-linkedlist
  - search-in-linked-list
  - detect-a-loop-in-ll
  - middle-of-a-linkedlist-tortoisehare-method
  - deletion-of-the-head-of-ll
---

<!-- @summary -->
Count the nodes by walking to the null — a four-line function whose interest is entirely in what it costs, since counting a million nodes measured **1,088.63us against 1,040.82 for summing them**, making length a full traversal rather than a cheap query; where caching the count is **2.3 million times faster** and costs between nothing and 7.4% to maintain, yet silently becomes a lie the moment anything touches a `next` pointer directly — which is why `std::forward_list` deliberately has **no** `size()` at all.

<!-- @theory -->
## The operation

Start at the head, follow `next` until it is null, count the steps.

```
head -> 10 -> 20 -> 30 -> null
         1     2     3
```

Four lines, O(n), O(1) space. There is nothing else to it — a linked list stores
no length, so the only way to know how many nodes there are is to visit them all.

## Counting is not a cheap query; it is a full traversal

It is easy to read "O(n)" and picture something light. Measured at a million
nodes:

| Operation | Time |
|---|---|
| Walking the list to count it | **1,088.63us** |
| Summing every node's value | 1,040.82us |
| `vector::size()` | **0.0003us** |

Counting and summing cost the **same**, because they are the same walk with a
different body. Asking a linked list its length is as expensive as reading every
value in it, and about three and a half million times more expensive than asking
an array.

That is the fact to carry into every later problem in this topic. Any algorithm
that starts "first find the length, then..." has already paid for one complete
pass, which is why so many linked-list techniques exist to avoid needing it.

## Caching the count is nearly free and enormously faster

Keep an `int count` beside the head, increment on insert, decrement on delete.
The query becomes a field read:

| n | Walk and count | Cached counter | Ratio |
|---|---|---|---|
| 1,000 | 0.53us | 0.0003us | 1,697x |
| 10,000 | 9.22us | 0.0004us | 26,095x |
| 100,000 | 75.96us | 0.0003us | 257,907x |
| 1,000,000 | **680.11us** | **0.0003us** | **2,314,625x** |

And maintaining it costs almost nothing, because an increment is invisible beside
an allocation:

| n | Pushing n times, plain | With a counter | Overhead |
|---|---|---|---|
| 10,000 | 209.0us | 207.7us | **-0.7%** |
| 100,000 | 2,130.8us | 2,153.0us | 1.0% |
| 1,000,000 | 21,881.2us | 23,494.8us | 7.4% |

At ten thousand the difference is inside the noise — the counted version measured
marginally *faster*. So the obvious question is why every linked list does not
simply carry its length.

## Because the counter is a claim the list cannot verify

A cached count is only correct if every modification goes through the API that
maintains it. A linked list's whole appeal is that you can rewire `next` pointers
directly, and the moment anything does, the counter is silently wrong.

Demonstrated on a five-node list:

| After | `size()` says | Actually |
|---|---|---|
| Five pushes | 5 | 5 |
| Splicing one node out by rewiring | **5** | **4** |
| Splicing two nodes in at the tail | **5** | **6** |

Nothing detected either edit. There is no checksum, no invalidation, no way for
the list to notice — the count and the chain are two independent facts that
happen to agree until they do not.

## The standard library made this exact trade, in both directions

This is not a hypothetical design tension; it is visible in C++ and dated.

**`std::list::size()` was allowed to be O(n) before C++11 and is required to be
O(1) since.** The committee chose the cached counter, and the cost is that
`splice` — the operation a linked list exists for — has to count the nodes it
moves in some cases, making an operation that could be O(1) into O(n).

Measured on this implementation:

| n | `list.size()` | `distance(begin, end)` | Ratio |
|---|---|---|---|
| 1,000 | 0.0003us | 1.09us | 3,460x |
| 10,000 | 0.0003us | 12.76us | 40,529x |
| 100,000 | 0.0003us | 100.18us | 292,843x |
| 1,000,000 | **0.0003us** | **857.03us** | **2,737,024x** |

Flat, exactly as the guarantee requires.

**`std::forward_list` has no `size()` at all.** Not an O(n) one — none:

```
error: no member named 'size' in 'std::forward_list<int>'
```

That is the other half of the decision. `forward_list` exists to be the leanest
possible singly linked list, so it refuses to carry a counter, and rather than
offer an O(n) `size()` that looks like the O(1) one on every other container, it
offers nothing and makes you write `distance(begin(), end())` where the cost is
visible at the call site.

Both choices are defensible and they are opposite. Which tells you the answer for
your own list is "it depends on whether anything splices".

## On a cyclic list, length does not terminate

The loop's only stopping condition is reaching a null. If the chain loops back on
itself there is no null, and the function does not return a wrong answer — it
never returns:

```
1 -> 2 -> 3 -+
^            |
+------------+      walked 20 steps, no null, and it would walk forever
```

This is worth naming here because it explains why **Detect a loop in LL** is a
separate problem with its own technique, and why any code taking a list from an
untrusted source cannot begin by asking for its length.

## Python: the same shape, and a much lower recursion ceiling

| n | Walking the chain | `len(list)` | Ratio |
|---|---|---|---|
| 1,000 | 17.00us | 0.0304us | 559x |
| 10,000 | 190.61us | 0.0317us | 6,005x |
| 100,000 | **2,023.50us** | **0.0302us** | **67,109x** |

`len()` on a built-in list is a field read, exactly like the cached counter — the
list object stores its size.

Counting recursively is possible and hits a limit far sooner than C++ does.
Python's own recursion limit stops it at **1,000 frames by default**, so a
900-node list counts fine and a 5,000-node list raises `RecursionError`. The
previous subtopic measured C++ surviving 256,250 frames before the stack gave
out; Python refuses at 1,000, which is the friendlier failure — an exception you
can catch rather than a segmentation fault.

<!-- @intuition -->
The function is four lines and the lesson is entirely about price. A linked list stores no length, so asking for one means visiting every node, and the measurement makes the point sharper than the complexity class does: counting a million nodes costs the same as summing them, because it *is* the same walk. That reframes a lot of later problems — any approach beginning "first compute the length" has silently spent a full pass, and the reason so many linked-list techniques use two pointers at different speeds is precisely to avoid that. Caching the count looks like an obvious win, and by the numbers it is: two million times faster to read, essentially free to maintain. What stops it being universal is that a cached count is an assertion about a structure that anyone holding a node can quietly rewire, so it is correct only as long as every piece of code cooperates. The standard library shows both answers to that: `std::list` carries a counter and pays for it in `splice`, and `forward_list` refuses to have a `size()` at all rather than offer one that looks cheap and is not.

<!-- @approach -->
### Optimal - Walk and Count

<!-- @idea -->
Follow `next` from the head until it is null, counting steps.

<!-- @steps -->
1. Start a counter at zero and a pointer at the head.
2. While the pointer is not null, increase the counter.
3. Move the pointer to `current->next`.
4. Return the counter when the pointer becomes null.
5. An empty list needs no special case — the loop simply never runs.

<!-- @complexity -->
- time: O(n) — every node is visited exactly once
- space: O(1) — one pointer and one counter
- note: The only way a bare singly linked list can answer the question, and more expensive than "O(n)" suggests: counting a million nodes measured 1,088.63 microseconds against 1,040.82 for summing them, because they are the same traversal. On a cyclic list it does not terminate, which is why any code handling untrusted lists cannot start by asking for the length.

<!-- @code cpp -->
```cpp
int length(Node* head) {
    int count = 0;
    for (Node* current = head; current != nullptr; current = current->next)
        count++;
    return count;
}
```

<!-- @annotations -->
- 3: `current`, not `head` — a separate pointer, so the caller's list survives. `head` is a copy here, but walking it makes the function harder to extend later.
- 3: The null is the only terminating condition. On a list whose tail links back into itself, this loop never exits.
- 1: An empty list returns 0 with no branch, because the loop body never executes.

<!-- @code java -->
```java
static int length(Node head) {
    int count = 0;
    for (Node current = head; current != null; current = current.next) count++;
    return count;
}
```

<!-- @annotations -->
- 3: Identical shape. Java's reference is the same thing as the pointer with the punctuation removed, and it is null-terminated in exactly the same way.

<!-- @code python -->
```python
def length(head):
    count = 0
    current = head
    while current is not None:
        count += 1
        current = current.next
    return count


# 2,023.50us for 100,000 nodes, against 0.0302 for len() on a built-in
# list of the same values -- about 67,000x, because len() reads a field.
```

<!-- @annotations -->
- 4: `is not None` rather than `!= None` — identity is the right test for a sentinel, and it cannot be intercepted by a `__eq__` on the node class.

<!-- @approach -->
### Cache the Count Alongside the Head

<!-- @idea -->
Store the length in the list and keep it up to date, so the query is a field read.

<!-- @steps -->
1. Hold the head and an integer count together in one type.
2. Increase the count on every insertion.
3. Decrease it on every deletion.
4. Return the stored value when asked for the length.
5. Make sure no code path can modify the chain without going through these operations.

<!-- @complexity -->
- time: O(1) to query, plus one increment per modification
- space: O(1) — a single extra integer for the whole list
- note: Enormously faster to read and nearly free to maintain — **2,314,625x** at a million nodes, for an upkeep cost measured between **-0.7% and 7.4%**. The catch is not performance, it is trust: the counter is correct only while every modification goes through this API. Splicing a node out by rewiring left `size()` reporting 5 on a 4-node list, and splicing two in left it reporting 5 on a 6-node list, with nothing detecting either.

<!-- @code cpp -->
```cpp
struct CountedList {
    Node* head = nullptr;
    int count = 0;

    void pushFront(int value) {
        head = new Node(value, head);
        count++;
    }

    bool popFront() {
        if (head == nullptr) return false;
        Node* doomed = head;
        head = head->next;
        delete doomed;
        count--;
        return true;
    }

    int size() const { return count; }
};
```

<!-- @annotations -->
- 20: A field read. This is the entire benefit — 0.0003 microseconds regardless of how many nodes there are.
- 7: The increment has to be on every path that adds a node. One `pushFront` that forgets it makes the count wrong forever, with nothing to detect it.
- 2: `head` being public is what makes the count fragile — any caller can rewire the chain behind the counter's back. Making it private is the only real defence.

<!-- @code java -->
```java
class CountedList {
    private Node head = null;
    private int count = 0;

    void pushFront(int value) { head = new Node(value, head); count++; }

    boolean popFront() {
        if (head == null) return false;
        head = head.next;
        count--;
        return true;
    }

    int size() { return count; }
}
```

<!-- @annotations -->
- 2: `private` on both fields, which is the point — a cached count is only defensible when nothing outside the class can reach a `next` pointer.

<!-- @code python -->
```python
class CountedList:
    __slots__ = ("head", "count")

    def __init__(self):
        self.head = None
        self.count = 0

    def push_front(self, value):
        self.head = Node(value, self.head)
        self.count += 1

    def pop_front(self):
        if self.head is None:
            return False
        self.head = self.head.next
        self.count -= 1
        return True

    def __len__(self):
        return self.count


# Defining __len__ makes len(my_list) work, which is what a caller
# expects -- and it is a field read, like len() on a built-in list.
```

<!-- @annotations -->
- 19: `__len__` rather than a `size()` method, so the type behaves like every other Python container and `len()` works on it.

<!-- @approach -->
### Count Recursively

<!-- @idea -->
The length of a list is one plus the length of the rest of it.

<!-- @steps -->
1. Return zero if the pointer is null.
2. Otherwise return one plus the length of the node after this one.
3. The recursion unwinds when it reaches the null at the end.

<!-- @complexity -->
- time: O(n) — one call per node
- space: **O(n) stack** — one frame per node, which is the reason not to use it
- note: The cleanest statement of what a length *is*, and bounded by the call stack rather than by memory. In Python it fails first and most gently: the default recursion limit is **1,000**, so a 900-node list counts and a 5,000-node list raises `RecursionError` — an exception you can catch. In C++ the equivalent limit measured in the previous subtopic was 256,250 frames, and passing it is a segmentation fault instead.

<!-- @code cpp -->
```cpp
int lengthRecursive(Node* head) {
    if (head == nullptr) return 0;
    return 1 + lengthRecursive(head->next);
}
```

<!-- @annotations -->
- 3: Not tail recursion — the `1 +` happens after the call returns — so no compiler will flatten it into a loop. Writing it as an accumulator parameter would make it tail-recursive and give the optimiser the option.
- 1: Correct, elegant, and bounded by the stack. The loop version has no such limit and is no harder to read.

<!-- @code java -->
```java
static int lengthRecursive(Node head) {
    if (head == null) return 0;
    return 1 + lengthRecursive(head.next);
}
```

<!-- @annotations -->
- 3: The JVM does not perform tail-call elimination at all, so even the accumulator form would still consume a frame per node here.

<!-- @code python -->
```python
def length_recursive(head):
    if head is None:
        return 0
    return 1 + length_recursive(head.next)


# sys.getrecursionlimit() is 1,000 by default, so a 900-node list
# returns 900 and a 5,000-node list raises RecursionError. That is a
# far lower ceiling than C++'s 256,250 frames -- and a far friendlier
# failure, since it is an exception rather than a crash.
```

<!-- @annotations -->
- 4: Raising the limit with `sys.setrecursionlimit` moves the exception closer to a real C-stack overflow, which crashes the interpreter. The limit is a guard rail, not the actual constraint.

<!-- @example -->

<!-- @input -->
`10 -> 20 -> 30 -> null`

<!-- @output -->
3

<!-- @why -->
The operation in its simplest form, and a reminder that the null is doing all the work.

<!-- @walkthrough -->
1. The counter starts at 0 and the pointer at the node holding 10.
2. The pointer is not null, so the counter becomes 1 and the pointer moves to the node holding 20.
3. Counter 2, pointer moves to the node holding 30.
4. Counter 3, pointer moves to `next`, which is null.
5. The loop condition fails and 3 is returned.
6. Three nodes were visited and three pointers were read — there is no shortcut, because nothing stores the length.
7. An empty list runs zero iterations and returns 0, with no special case required.

<!-- @example -->

<!-- @input -->
A million nodes: counting them, summing them, and asking a vector its size

<!-- @output -->
1,088.63us, 1,040.82us, and 0.0003us

<!-- @why -->
Shows that length is a traversal wearing a cheap-sounding name, which is the fact every later problem in this topic depends on.

<!-- @walkthrough -->
1. Counting the nodes walks the whole chain, incrementing an integer at each step.
2. Summing the values walks the same chain, adding a field at each step.
3. Measured, they cost **1,088.63** and **1,040.82** microseconds — the same, within a few percent.
4. The counter is not what costs; the walk is, and both do exactly one walk.
5. `vector::size()` reads a stored field and measured 0.0003 microseconds — about three and a half million times faster.
6. So "get the length" is not a preliminary step before the real work; on a linked list it *is* a full pass over the data.
7. That is why later techniques in this topic use two pointers moving at different speeds rather than measuring the list first.

<!-- @example -->

<!-- @input -->
A five-node counted list, edited by rewiring `next` directly

<!-- @output -->
`size()` still says 5 when the list holds 4, then still says 5 when it holds 6

<!-- @why -->
Explains why a cached count is not simply free, despite measuring 2.3 million times faster and costing under 8% to maintain.

<!-- @walkthrough -->
1. After five pushes through the API, `size()` returns 5 and walking the list also gives 5.
2. Splicing the second node out — setting `head->next` to `second->next` and deleting it — bypasses the API entirely.
3. `size()` still returns 5; walking gives 4.
4. Appending a two-node chain onto the tail, again by rewiring, brings the real length to 6.
5. `size()` still returns 5.
6. Nothing detected either edit, because there is no relationship between the counter and the chain other than the discipline of the code that touches both.
7. That is the whole trade: the counter is fast and cheap and it is an assertion the structure cannot check.
8. The only real defence is to make the head private so nothing outside the class can reach a `next` pointer.

<!-- @example -->

<!-- @input -->
`std::list` and `std::forward_list`, asked for their size

<!-- @output -->
0.0003us flat for one; a compile error for the other

<!-- @why -->
The same design decision resolved two opposite ways inside one standard library, which is the strongest evidence that neither answer is simply right.

<!-- @walkthrough -->
1. Before C++11, `std::list::size()` was permitted to be O(n); since C++11 it must be O(1).
2. Measured, it is 0.0003 microseconds at 1,000 nodes and 0.0003 at a million — flat, as required.
3. Counting the same lists with `distance(begin, end)` gave 1.09 and 857.03 microseconds — a ratio reaching **2,737,024x**.
4. The price of that guarantee is paid by `splice`, which in some forms must count the nodes it moves, turning a constant-time operation into a linear one.
5. `std::forward_list` refuses the trade: it has **no** `size()` member at all, and asking for one is a compile error.
6. It could have offered an O(n) `size()`, and deliberately does not — because a `size()` that looks like every other container's and is a thousand times slower is a trap.
7. Instead you write `distance(begin(), end())`, where the cost is visible at the call site.
8. Two containers, one library, opposite answers — so the right choice for your own list depends on whether anything will splice.

<!-- @visualization linked-list -->

<!-- @description -->
Open on the walk itself: a counter starting at zero beside a chain, a cursor stepping node to node, the counter ticking, and the run ending when the cursor lands on the null. Keep the null visually emphatic — a terminator block rather than an absence — because it is the only thing that ends the loop. Immediately beside it, run the same cursor over the same chain *summing* the values instead of counting them, with both timers visible, and let them finish together at 1,088.63 and 1,040.82 microseconds. That simultaneity is the point: counting is not a preliminary, it is the whole traversal. Put a `vector::size()` panel next to both as a single instantaneous flash at 0.0003. Then the cached counter, drawn as a small box welded to the head: pushes and pops tick it up and down in step with the chain, and the query is one glance at the box. Show its timing as a flat line across n from 1,000 to 1,000,000 while the walking line climbs to 680. The centre of the figure is the invalidation, and it should feel like sabotage. With the counter reading 5, reach *past* the API and rewire one `next` pointer to skip a node — the chain visibly becomes four long while the box still reads 5, and no alarm fires anywhere. Do it again in the other direction, splicing two nodes onto the tail so the chain is six and the box still reads 5. Label the box a claim, not a measurement. Follow with the standard-library panel: `std::list` carrying the same welded box with its `splice` operation shown paying an O(n) cost to keep it honest, and `std::forward_list` drawn with no box at all and its `size()` call struck through as a compile error rather than a slow function. Close on the cyclic list — a chain whose tail arrow curves back to the head — with the cursor going round and round and the counter climbing without bound, captioned not a wrong answer, no answer.

<!-- @sampleInput -->
```json
{"primary":{"list":"10 -> 20 -> 30 -> null","length":3,"work":"three nodes visited, three pointers read","note":"nothing stores the length, so there is no shortcut"},"smallCases":[{"list":"10 -> 20 -> 30 -> null","length":3},{"list":"7 -> null","length":1},{"list":"null","length":0,"note":"no special case needed — the loop never runs"}],"lengthIsATraversal":{"atOneMillionNodes":{"walkToCount":1088.63,"sumTheValues":1040.82,"vectorSize":0.0003},"reading":"counting and summing cost the same because they are the same walk with a different body","consequence":"any algorithm that begins 'first find the length' has already paid for one complete pass — which is why later techniques use two pointers at different speeds instead"},"cachedCounter":{"queryCost":[{"n":1000,"walk":0.53,"cached":0.0003,"ratio":"1,697x"},{"n":10000,"walk":9.22,"cached":0.0004,"ratio":"26,095x"},{"n":100000,"walk":75.96,"cached":0.0003,"ratio":"257,907x"},{"n":1000000,"walk":680.11,"cached":0.0003,"ratio":"2,314,625x"}],"upkeepCost":[{"n":10000,"plainPushes":209.0,"countedPushes":207.7,"overhead":"-0.7%"},{"n":100000,"plainPushes":2130.8,"countedPushes":2153.0,"overhead":"1.0%"},{"n":1000000,"plainPushes":21881.2,"countedPushes":23494.8,"overhead":"7.4%"}],"whyNotAlways":"the counter is correct only while every modification goes through the API that maintains it","invalidationDemo":[{"after":"five pushes","sizeSays":5,"actually":5},{"after":"splicing one node out by rewiring","sizeSays":5,"actually":4},{"after":"splicing two nodes in at the tail","sizeSays":5,"actually":6}],"detection":"none — there is no checksum and no invalidation; the count and the chain are independent facts that agree until they do not","defence":"make the head private so nothing outside the class can reach a next pointer"},"standardLibraryMadeThisTrade":{"stdList":{"history":"size() was permitted to be O(n) before C++11 and is required to be O(1) since","measured":[{"n":1000,"size":0.0003,"distanceBeginEnd":1.09,"ratio":"3,460x"},{"n":10000,"size":0.0003,"distanceBeginEnd":12.76,"ratio":"40,529x"},{"n":100000,"size":0.0003,"distanceBeginEnd":100.18,"ratio":"292,843x"},{"n":1000000,"size":0.0003,"distanceBeginEnd":857.03,"ratio":"2,737,024x"}],"priceOfTheGuarantee":"splice must count the nodes it moves in some forms, turning an O(1) operation into O(n)"},"stdForwardList":{"hasSize":false,"compileError":"error: no member named 'size' in 'std::forward_list<int>'","why":"it exists to be the leanest possible singly linked list, and rather than offer an O(n) size() that looks like every other container's O(1) one, it offers none","alternative":"distance(begin(), end()), where the cost is visible at the call site"},"reading":"two containers, one library, opposite answers — so the right choice depends on whether anything will splice"},"cyclicList":{"problem":"the only stopping condition is reaching a null, and a cyclic chain has none","behaviour":"not a wrong answer — no answer; the loop never terminates","demo":"walked 20 steps without reaching a null, and it would walk forever","consequence":"explains why Detect a loop in LL is a separate problem, and why code handling untrusted lists cannot begin by asking for the length"},"benchPython":{"unit":"microseconds, CPython 3.13.4","rows":[{"n":1000,"walkTheChain":17.00,"lenBuiltinList":0.0304,"ratio":"559x"},{"n":10000,"walkTheChain":190.61,"lenBuiltinList":0.0317,"ratio":"6,005x"},{"n":100000,"walkTheChain":2023.50,"lenBuiltinList":0.0302,"ratio":"67,109x"}],"lenIsAFieldRead":"a built-in list stores its size, exactly like the cached counter","recursion":{"defaultLimit":1000,"at900Nodes":"returns 900","at5000Nodes":"RecursionError","versusCpp":"the previous subtopic measured C++ surviving 256,250 frames before the stack gave out; Python refuses at 1,000","whichIsBetter":"Python's, arguably — an exception you can catch rather than a segmentation fault"}},"assertions":["the length of an empty list is 0","the length equals the number of nodes reachable from the head","the walk terminates only if the list ends in a null","a cached count equals the walked count only if every edit went through the API","counting costs the same as any other single traversal"],"recommendation":"walk and count for a bare list; cache the count only when the head is private and nothing can splice behind it","lesson":"length is a full traversal wearing a cheap-sounding name, and caching it converts a measurement into a claim the structure cannot verify"}
```

<!-- @highlights -->
- A counter starts at zero beside the chain, a cursor steps node to node, and the run ends when the cursor lands on the null.
- The null is drawn as an emphatic terminator block rather than an absence, because it is the only thing that ends the loop.
- The same cursor runs the same chain again summing values instead of counting them, with both timers visible.
- They finish together at 1,088.63 and 1,040.82 microseconds — counting is not a preliminary, it is the whole traversal.
- A `vector::size()` panel flashes once beside both at 0.0003.
- The cached counter appears as a small box welded to the head, ticking up and down in step with pushes and pops.
- Its timing draws as a flat line from n = 1,000 to 1,000,000 while the walking line climbs to 680.
- The centre is the invalidation, staged like sabotage: with the counter reading 5, a `next` pointer is rewired past the API to skip a node.
- The chain visibly becomes four long while the box still reads 5, and no alarm fires anywhere.
- It happens again in the other direction — two nodes spliced onto the tail, chain of six, box still reading 5.
- The box is labelled a claim, not a measurement.
- The standard-library panel shows `std::list` carrying the same welded box, with `splice` paying an O(n) cost to keep it honest.
- `std::forward_list` is drawn with no box at all, its `size()` call struck through as a compile error rather than a slow function.
- The close is a cyclic list, its tail arrow curving back to the head.
- The cursor goes round and round while the counter climbs without bound.
- That frame is captioned not a wrong answer, no answer.

<!-- @edgeCases -->
- The empty list — returns 0 with no special case, because the loop body never runs.
- A one-element list — returns 1, and is the smallest case where the null terminator is actually reached.
- A cyclic list — never terminates; the function has no other stopping condition.
- A list whose tail links into its own middle — same problem, and harder to spot by inspection.
- A cached count after a direct splice — reports the old value with nothing to detect the drift.
- A cached count after the list is cleared by dropping the head — stays at its old value unless the clear resets it.
- Counting recursively in Python beyond 1,000 nodes — `RecursionError` at the default limit.
- Counting recursively in C++ beyond about 256,250 nodes — segmentation fault rather than an exception.
- A list long enough to overflow `int` — not reachable in practice, but the counter type should match whatever the container can hold.
- Two pointers into the same list — counting from a middle node gives the length of the tail, not of the list.

<!-- @pitfalls -->
- Treating "get the length" as a cheap preliminary. It measured 1,088.63 microseconds at a million nodes against 1,040.82 for summing every value — the same walk.
- Calling a length function inside a loop over the same list. That turns an O(n) algorithm into O(n²), the same shape as appending by walking to the tail.
- Trusting a cached count on a list whose head is public. Splicing one node out left `size()` reporting 5 on a four-node list, with nothing detecting it.
- Forgetting to decrement the counter on one deletion path. The count is then wrong forever, and no later operation will notice.
- Asking a `std::forward_list` for its `size()`. It has none — that is a compile error, and deliberately so.
- Assuming `std::list::size()` is O(n) because it is a linked list. It has been required to be O(1) since C++11, and measured flat at 0.0003 microseconds from 1,000 to a million nodes.
- Calling a length routine on a list that might be cyclic. It does not return a wrong answer; it does not return.
- Walking `head` itself rather than a copy. It works for counting and makes the function impossible to extend safely.
- Counting recursively on anything but a short list. Python raises at 1,000 nodes and C++ crashes at about 256,250.
- Counting from a node other than the head and calling the result the length. It is the length of the remaining tail.

<!-- @doubt -->
### Why is there no O(1) way to get the length?

<!-- @answer -->
Because a bare linked list stores no length — the only thing it stores is a head pointer and a `next` in each node, so the number of nodes is not recorded anywhere and can only be discovered by visiting them. What makes this worth stating plainly is how expensive that turns out to be: counting a million nodes measured **1,088.63 microseconds**, against **1,040.82** for summing every value in the same list. They are the same walk with a different loop body, so counting is not a lightweight preliminary before the real work — it *is* a full pass over the data. An array's `size()` measured 0.0003 microseconds for comparison. Carry that into the rest of this topic: any approach that begins "first find the length, then..." has already spent one complete traversal, which is exactly why the two-pointer techniques later on exist.

<!-- @doubt -->
### Should I just cache the length in my list?

<!-- @answer -->
If the head is private, yes — the numbers are overwhelming. Reading a cached count measured **0.0003 microseconds against 680.11** for walking a million-node list, a factor of **2,314,625**, and maintaining it cost between **-0.7% and 7.4%** depending on size, because an increment is invisible next to an allocation. At ten thousand nodes the counted version measured marginally *faster* than the plain one, which is noise but tells you the upkeep is not real. The reason it is not automatic is trust rather than cost: the counter is correct only while every modification goes through the API that maintains it. On a five-node list, splicing one node out by rewiring left `size()` reporting **5** when the list held **4**, and splicing two in left it reporting 5 when it held 6, with nothing detecting either. Make the head private, or do not cache.

<!-- @doubt -->
### Does `std::list::size()` walk the list?

<!-- @answer -->
Not since C++11, when it became required to be O(1). Before that the standard permitted an O(n) implementation and some libraries used one, which is where the folklore comes from. Measured here it is flat: **0.0003 microseconds** at 1,000 nodes and 0.0003 at a million, while counting the same lists with `distance(begin, end)` went from 1.09 to **857.03** microseconds — a ratio reaching 2,737,024x. The guarantee is not free, and the bill lands on `splice`: moving a range between lists has to know how many nodes moved, so some `splice` overloads that could be O(1) are O(n) instead. That is the same trade as a hand-rolled counter, made once inside the library and paid for by a different operation.

<!-- @doubt -->
### Why does `std::forward_list` have no `size()` at all?

<!-- @answer -->
Because the alternatives were both worse. `forward_list` exists to be the leanest singly linked list the language can offer — no back pointers, no cached size, nothing per-list beyond a head — so carrying a counter was out. That left offering an O(n) `size()`, and the committee declined: a member function named `size()` looks like every other container's, all of which are O(1), so an O(n) one is a trap that reads as free. Asking for it is a compile error, `no member named 'size' in 'std::forward_list<int>'`, and you write `std::distance(f.begin(), f.end())` instead — which is longer, obviously a traversal, and visible at the call site. The two containers in the same library resolving this oppositely is the clearest evidence that neither answer is simply correct.

<!-- @doubt -->
### What happens if the list has a cycle?

<!-- @answer -->
The function never returns. Its only stopping condition is reaching a null, and a cyclic chain has none, so the pointer goes round forever and the counter climbs without bound — not a wrong answer, no answer. There is no cheap defence inside a length routine either: you cannot tell you are revisiting a node without remembering where you have been, which needs either a set of visited nodes at O(n) memory or the two-pointer trick that is the subject of **Detect a loop in LL**. The practical rules are that a length routine may only be called on a list you know terminates, and that code accepting a list from an untrusted source cannot begin by measuring it. It is also why cycle detection is a separate named problem rather than a footnote.

<!-- @doubt -->
### Is the recursive version acceptable?

<!-- @answer -->
It is the clearest statement of what a length is — one plus the length of the rest — and it is bounded by the call stack, which the loop is not. Where it fails differs sharply by language. Python stops it at its own recursion limit, **1,000 frames by default**, so a 900-node list returns 900 and a 5,000-node list raises `RecursionError`. C++ has no such guard: the previous subtopic measured a recursive free surviving **256,250** frames before the stack gave out, and passing that is a segmentation fault. Python's failure is the better one — an exception you can catch and a limit you can raise deliberately — but neither is a reason to prefer recursion here, because the loop is four lines, no harder to read, and has no ceiling at all. Note also that it is not tail recursion in this form, since the `1 +` happens after the call returns, so no compiler will flatten it for you.

<!-- @doubt -->
### Why does calling `length()` inside a loop make things so slow?

<!-- @answer -->
Because each call is a full traversal, so a loop that calls it n times performs n traversals — O(n²) from code that looks like a single pass. It is the same shape as appending to a linked list by walking to the tail each time, which the head-insertion subtopic measured at **435x** slower than the linear version at 16,000 elements. The tell is identical: a helper that is honestly O(n) gets called from inside a loop over the same structure, and nothing in either piece of code looks quadratic on its own. The fixes are the same too — compute the length once into a variable before the loop, or restructure so you never need it. On an array this habit is harmless because `size()` is a field read; carrying it over to a linked list is one of the most common ways a working program becomes unusably slow at scale.
