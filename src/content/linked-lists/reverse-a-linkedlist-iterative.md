---
id: reverse-a-linkedlist-iterative
topic: Linked Lists
title: Reverse a LinkedList [Iterative]
difficulty: Medium
status: ready
prerequisites:
  - introduction-to-singly-linkedlist
  - insertion-at-the-head-of-linked-list
  - deletion-of-the-head-of-ll
  - middle-of-a-linkedlist-tortoisehare-method
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - reverse-a-ll
  - insertion-at-the-head-of-linked-list
  - reverse-ll-in-group-of-given-size-k
  - check-if-ll-is-palindrome-or-not
  - reverse-a-doubly-linked-list
---

<!-- @summary -->
Turn every arrow around in one pass with three pointers — where the temporary is not a convenience but a necessity, since overwriting `next` first leaves **one node of five reachable**; where "reverse the list" and "reverse the values" produce the same printout and **different outcomes for anything holding a node**, one moving the node and the other changing what it holds; and where relinking measured faster at every size tested — by **1.7x to 2.7x**, widening with n — while using three pointers against their two n-element arrays.

<!-- @theory -->
## The operation

Every `next` pointer should point the other way, and the last node becomes the
first.

```
before:   head -> 1 -> 2 -> 3 -> null

after:    null <- 1 <- 2 <- 3 <- head
                                 (i.e. head -> 3 -> 2 -> 1 -> null)
```

Nothing is allocated, nothing is copied, and no node changes address. Only the
arrows move.

## The temporary is not optional

The natural first attempt is two pointers — one for where you are, one for what
came before:

```
while (head) {
    head->next = prev;     // turn this arrow around
    prev = head;
    head = head->next;     // ...and now go forward
}
```

The last line reads `head->next`, which the **first** line just overwrote. It no
longer points to the rest of the list; it points back to `prev`. The walk
immediately reverses direction and the rest of the list is unreachable.

Measured on a five-node list, that version leaves **one node reachable out of
five**. Everything past the head is lost on the first iteration.

So the forward pointer has to be saved before the arrow is turned:

```
Node* next = head->next;   // save the way forward
head->next = prev;         // now it is safe to overwrite
prev = head;
head = next;
```

This is the third time this topic has needed the same rule. **Deletion of the
head** needed `next` read before the node was freed; **clearing a list** needed it
per node; here it is needed before the pointer is repointed. In every case the
route onward is stored inside the thing being modified.

## Three pointers, not necessarily three names

You can write it with two named variables — `std::exchange` folds the temporary
into the expression:

```cpp
while (head) head = std::exchange(head->next, std::exchange(prev, head));
```

Verified correct. But the inner exchange is holding the old `prev` while the outer
holds the old `next`, so three values are still live at once — the temporary
moved into the expression rather than disappearing. Python does the same thing
more legibly with one simultaneous assignment:

```python
head.next, prev, head = prev, head, head.next
```

Python evaluates the entire right-hand side before assigning any of it, which is
exactly what makes this safe — and it measured **1.26x faster** than the explicit
three-statement version, at 1,396.45 microseconds against 1,762.45 for a
100,000-node list.

## Reversing the list is not reversing the values

There is a second way to get the same printout: read all the values into an
array, then write them back in reverse order. The nodes never move; their
contents change.

For a list of plain integers the results look identical. For anything that holds
a pointer **into** the list, they are opposite. Demonstrated on `0 1 2 3 4` while
holding a pointer to the second node:

| | Resulting list | The node I was holding |
|---|---|---|
| Reverse the **links** | `4 3 2 1 0` | still holds **1** — the node kept its value and moved |
| Reverse the **values** | `4 3 2 1 0` | now holds **3** — the node stayed put and its value changed |

Both are "reversed" and only one of them is what "reverse a linked list" means.
The distinction matters whenever nodes have identity — an iterator held by a
caller, another list splicing through the same nodes, a cache keyed by node
address. It also matters when the payload is expensive to copy, since relinking
moves 8-byte pointers and value reversal copies whole objects.

Choose the middle of the list to test this and you will see no difference at all:
the midpoint is the one value a reversal leaves alone. That is worth knowing
because it makes the wrong implementation look right on a five-element example.

## Relinking is also the fastest

| n | Relink in place | Copy values via array | Collect nodes, then relink |
|---|---|---|---|
| 1,000 | **0.91us** | 2.10us | 1.56us |
| 10,000 | **9.55us** | 21.18us | 20.83us |
| 100,000 | **98.48us** | 254.81us | 236.09us |
| 1,000,000 | **842.46us** | 2,285.22us | 1,938.82us |

Relinking is fastest at every size measured — by **1.7x at a thousand nodes,
rising to 2.3x–2.7x at a million** — and the array versions also use O(n)
memory where relinking uses three pointers. There is no trade here — the in-place version wins on time,
space, and semantics.

In Python the ordering is the same: 1,396.45 microseconds to relink a
100,000-node list against 4,185.96 to copy the values, about **3x**.

## Benchmarking this has a trap worth naming

Reversal **mutates**. Timing it by calling it repeatedly on the same variable
measures almost nothing: after the first call, the variable points at what is now
the **tail**, whose `next` is null — so every subsequent call reverses a one-node
list and returns immediately.

That produced a first set of Python numbers reading 0.07 microseconds at
n = 100,000, which is roughly 0.7 nanoseconds per node and obviously impossible.
The fix is to time a **round trip** — reverse, then reverse back — and halve it,
with an assertion afterwards that the list really is in its original order. The
C++ figures above avoid the problem by reassigning the head from the return value
on every call, and the table was re-run with a length check after timing to prove
no call had degenerated.

<!-- @intuition -->
Reversing a singly linked list is the clearest possible statement of the constraint the whole structure imposes: the only way forward is stored inside the node you are about to change, so every step has to save its exit before it edits anything. That is the same rule deletion needed, and clearing needed, and it shows up here as the third pointer everyone initially thinks is redundant. The other half of this problem is a question of what "reverse" means. A list of integers can be turned around by rewriting the numbers, and it will print identically — but a linked list's whole reason for existing is that nodes are stable things you can hold pointers to and splice between structures, so moving values while the nodes sit still is a different operation that happens to agree on the simplest possible payload. Once nodes have identity, or the payload is bigger than a pointer, the two stop agreeing, and only one of them is the operation the name refers to.

<!-- @approach -->
### Optimal - Three Pointers, Relink in Place

<!-- @idea -->
Walk once, turning each arrow to point at the node before it, keeping hold of the node after it.

<!-- @steps -->
1. Start with `prev` at null and `current` at the head.
2. Save `current->next` into a temporary, because the next line destroys it.
3. Point `current->next` at `prev`.
4. Move `prev` to `current`.
5. Move `current` to the saved temporary.
6. Return `prev` when `current` becomes null — it is the last node visited and therefore the new head.

<!-- @complexity -->
- time: O(n) — one pass, three assignments per node
- space: O(1) — three pointers regardless of length
- note: The one to write, and it wins on every axis: fastest at every size measured, by **1.7x to 2.7x** with the margin widening as n grows, O(1) space against their O(n), and it is the only version that preserves node identity. The temporary on step 2 is load-bearing — without it a five-node list leaves one node reachable, because the forward pointer has already been overwritten by the time it is read.

<!-- @code cpp -->
```cpp
Node* reverse(Node* head) {
    Node* prev = nullptr;
    while (head != nullptr) {
        Node* next = head->next;   // save the way forward FIRST
        head->next = prev;
        prev = head;
        head = next;
    }
    return prev;
}
```

<!-- @annotations -->
- 4: Without this line, the next statement destroys the only route to the rest of the list, and the advance at the bottom of the loop turns around into `prev`. Measured: one node reachable out of five.
- 9: `prev`, not `head` — the loop exits with `head` null, and `prev` holds the last node visited, which is the new first node.
- 2: Starting `prev` at null is what makes the old head's `next` become null, so the reversed list terminates properly with no special case.

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
- 4: Identical constraint. Java has no way to express this with fewer live values either — the temporary is about the data structure, not the language.

<!-- @code python -->
```python
def reverse(head):
    prev = None
    while head is not None:
        head.next, prev, head = prev, head, head.next
    return prev


# Python evaluates the whole right-hand side before assigning any of
# it, so `head.next` on the right is still the ORIGINAL next -- the
# temporary is implicit. Measured 1,396.45us against 1,762.45 for the
# three-statement version at n = 100,000, about 1.26x.
```

<!-- @annotations -->
- 4: The three assignments happen simultaneously. Splitting this into three statements in this order would be the broken two-pointer version — the safety comes entirely from the right-hand side being evaluated first.

<!-- @approach -->
### Copy the Values Out and Write Them Back

<!-- @idea -->
Read every value into an array, then walk again writing them back in reverse order.

<!-- @steps -->
1. Walk the list, appending each node's value to an array.
2. Return to the head.
3. Walk again, writing values back from the end of the array towards the start.
4. Return the original head — it has not moved.

<!-- @complexity -->
- time: O(n) — two passes plus the array
- space: **O(n)** for the array
- note: Produces the same printout and is a different operation. The nodes never move, so anything holding a pointer into the list now sees a **different value** at the same address — on `0 1 2 3 4`, a caller holding the second node saw 1 before and 3 after. It is also slower: 254.81 microseconds against 98.48 at n = 100,000, about 2.6x, and worse again when the payload is larger than a pointer, since it copies whole values where relinking moves 8-byte addresses.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

Node* reverseValues(Node* head) {
    vector<int> values;
    for (Node* p = head; p != nullptr; p = p->next) values.push_back(p->data);

    int i = (int)values.size() - 1;
    for (Node* p = head; p != nullptr; p = p->next) p->data = values[i--];
    return head;
}
```

<!-- @annotations -->
- 9: The nodes keep their positions and exchange contents. That is the whole semantic difference, and it is invisible unless something outside holds a node pointer.
- 5: O(n) extra memory, against three pointers for the in-place version.
- 10: Returning `head` unchanged is correct here and is itself a signal that this is not a reversal of the list — a real reversal returns a different node.

<!-- @code java -->
```java
static Node reverseValues(Node head) {
    List<Integer> values = new ArrayList<>();
    for (Node p = head; p != null; p = p.next) values.add(p.data);

    int i = values.size() - 1;
    for (Node p = head; p != null; p = p.next) p.data = values.get(i--);
    return head;
}
```

<!-- @annotations -->
- 2: `List<Integer>` boxes every value, so the copy is more expensive again than the C++ version's — one allocation per node on top of the array.

<!-- @code python -->
```python
def reverse_values(head):
    values = []
    p = head
    while p is not None:
        values.append(p.data)
        p = p.next

    p = head
    i = len(values) - 1
    while p is not None:
        p.data = values[i]
        i -= 1
        p = p.next
    return head


# 4,185.96us at n = 100,000 against 1,396.45 for relinking -- about 3x,
# plus O(n) memory, plus the different meaning.
```

<!-- @annotations -->
- 14: Returns the same head it was given. A caller writing `head = reverse_values(head)` gets the right answer by accident, which hides the difference until something depends on node identity.

<!-- @approach -->
### Collect the Nodes, Then Relink

<!-- @idea -->
Put every node pointer into an array, then walk the array backwards wiring each node to the one before it.

<!-- @steps -->
1. Walk the list, appending each node's address to an array.
2. Return null immediately if the array is empty.
3. For each position from the last down to the second, point that node at its predecessor in the array.
4. Set the first node's `next` to null — it is now the tail.
5. Return the last element of the array as the new head.

<!-- @complexity -->
- time: O(n) — one pass to collect, one to rewire
- space: **O(n)** for the array of pointers
- note: Semantically identical to the in-place version — it moves nodes, not values — and pays O(n) memory for nothing. Measured 236.09 microseconds against 98.48 at n = 100,000, about **2.4x** slower. It is worth seeing because it is what the three-pointer loop is doing, written out with the intermediate state made explicit; once that is clear, the loop is easier to trust.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

Node* reverseViaVector(Node* head) {
    vector<Node*> nodes;
    for (Node* p = head; p != nullptr; p = p->next) nodes.push_back(p);
    if (nodes.empty()) return nullptr;

    for (size_t i = nodes.size() - 1; i > 0; i--) nodes[i]->next = nodes[i - 1];
    nodes[0]->next = nullptr;
    return nodes.back();
}
```

<!-- @annotations -->
- 9: `i > 0` rather than `i >= 0` — `size_t` is unsigned, so `i >= 0` is always true and the loop wraps around instead of ending.
- 10: The old head becomes the tail, so its `next` must be nulled explicitly. Forgetting this leaves it pointing at the second node and creates a cycle.
- 7: The empty check is needed because `nodes.size() - 1` underflows on an empty vector.

<!-- @code java -->
```java
static Node reverseViaList(Node head) {
    List<Node> nodes = new ArrayList<>();
    for (Node p = head; p != null; p = p.next) nodes.add(p);
    if (nodes.isEmpty()) return null;

    for (int i = nodes.size() - 1; i > 0; i--) nodes.get(i).next = nodes.get(i - 1);
    nodes.get(0).next = null;
    return nodes.get(nodes.size() - 1);
}
```

<!-- @annotations -->
- 6: `int` here, so `i >= 0` would be safe — but stopping at `i > 0` is still correct and keeps the two languages' versions the same shape.

<!-- @code python -->
```python
def reverse_via_list(head):
    nodes = []
    p = head
    while p is not None:
        nodes.append(p)
        p = p.next
    if not nodes:
        return None

    for i in range(len(nodes) - 1, 0, -1):
        nodes[i].next = nodes[i - 1]
    nodes[0].next = None
    return nodes[-1]


# The three-pointer loop with its intermediate state written out.
# Useful for seeing what the loop does; O(n) memory for no benefit.
```

<!-- @annotations -->
- 12: `nodes[0].next = None` is the step people forget. Without it the old head still points forward and the list becomes a cycle.

<!-- @example -->

<!-- @input -->
`1 -> 2 -> 3 -> null`

<!-- @output -->
`3 -> 2 -> 1 -> null`

<!-- @why -->
The operation traced through the three pointers, which is the only way the temporary's role becomes obvious.

<!-- @walkthrough -->
1. `prev` is null and `head` is the node holding 1.
2. Save `next` as the node holding 2, then point 1's `next` at null — 1 is now the tail.
3. `prev` becomes 1, `head` becomes 2.
4. Save `next` as 3, point 2's `next` at 1, `prev` becomes 2, `head` becomes 3.
5. Save `next` as null, point 3's `next` at 2, `prev` becomes 3, `head` becomes null.
6. The loop ends and `prev` — the node holding 3 — is returned as the new head.
7. Note the first iteration: starting `prev` at null is what gives the old head its terminating null, with no special case.

<!-- @example -->

<!-- @input -->
The same loop with the temporary removed

<!-- @output -->
One node reachable out of five

<!-- @why -->
Shows that the third pointer is a requirement of the data structure, not a stylistic preference.

<!-- @walkthrough -->
1. The two-pointer attempt writes `head->next = prev` and then `head = head->next`.
2. On the first iteration, `head->next` is set to null, because `prev` starts as null.
3. The next line reads `head->next` — which is now null, not the node holding 2.
4. The loop condition fails immediately and the function returns after one node.
5. Measured on a five-node list, exactly **one** node is reachable in the result.
6. The general shape is that a node's `next` is the only route onward, so anything that overwrites it must save it first.
7. That is the same rule that **Deletion of the head** needed before freeing a node, and that clearing a list needs once per node.

<!-- @example -->

<!-- @input -->
`0 1 2 3 4`, holding an outside pointer to the second node, reversed both ways

<!-- @output -->
The held node still holds 1 after relinking, and holds 3 after value reversal

<!-- @why -->
Separates two operations that produce identical output and differ in what happens to the nodes.

<!-- @walkthrough -->
1. Both produce a list that reads `4 3 2 1 0`, so printing the result cannot tell them apart.
2. Relinking moves the node holding 1 to the fourth position; the node keeps its value.
3. Value reversal leaves every node where it is and overwrites the contents; the node at the second position now holds 3.
4. A caller holding that node sees **1** in the first case and **3** in the second.
5. That matters when nodes have identity — an iterator held elsewhere, another list splicing through the same nodes, or a cache keyed by node address.
6. It also matters when the payload is larger than a pointer, since relinking moves 8-byte addresses and value reversal copies whole objects.
7. Testing this on the **middle** node shows no difference at all, because the midpoint is the one value a reversal leaves in place — which is how the wrong implementation passes a five-element example.

<!-- @example -->

<!-- @input -->
Timing a reversal by calling it repeatedly on the same variable

<!-- @output -->
0.07us at n = 100,000 — about 0.7 nanoseconds per node

<!-- @why -->
A benchmarking trap specific to mutating operations, and the reason the figures in this container were re-derived.

<!-- @walkthrough -->
1. Reversal mutates the list in place and returns a **different** node as the new head.
2. Timing `reverse(h)` in a loop without reassigning `h` leaves `h` pointing at the original head.
3. After the first call that node is the **tail**, and its `next` is null.
4. Every subsequent call therefore reverses a one-node list and returns immediately.
5. The measured result was 0.07 microseconds at n = 100,000, which is impossible for an O(n) operation and is the tell.
6. The fix used here is to time a **round trip** — reverse, then reverse back — and halve, asserting afterwards that the list is in its original order.
7. The C++ figures avoid it differently, by reassigning the head from the return value on each call, and were re-run with a length check after timing to prove no call had degenerated.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the chain with three labelled markers — `prev`, `current`, `next` — and step the loop one beat at a time, but make the **order** of the four operations explicit rather than instantaneous. Beat one: `next` attaches to the node ahead, drawn as a hook being set before anything else moves. Beat two: the arrow out of `current` swings from forward to backward, landing on `prev`. Beats three and four: `prev` and `current` each slide one node right. Repeat, and let the reader see that beat two would sever the chain if beat one had not happened. Then show it severed: replay with beat one removed, so the arrow flips first and the marker that should advance finds itself pointing back at `prev` — the rest of the chain visibly detaches and greys out, with a counter reading 1 node reachable of 5. The centre panel is the semantic comparison, and it needs a held pointer to make the point. Draw the same list twice with an external hand-drawn pointer labelled `held` attached to the second node. On the left, relinking: the boxes physically rearrange, the held pointer travels with its box, and its value stays 1. On the right, value reversal: the boxes stay rooted, the numbers slide between them, and the held pointer's box now reads 3. Both result lists print `4 3 2 1 0` underneath, identical — with the two held values, 1 and 3, circled. Caption it same output, different operation. Close with the cost bars for all three approaches at a million nodes — 842.46, 1,938.82 and 2,285.22 — annotated with their space usage, three pointers against two n-element arrays, so the in-place version is visibly cheaper on both axes at once.

<!-- @sampleInput -->
```json
{"primary":{"before":"1 -> 2 -> 3 -> null","after":"3 -> 2 -> 1 -> null","invariant":"nothing is allocated, nothing is copied, no node changes address — only the arrows move"},"smallCases":[{"before":"null","after":"null"},{"before":"1 -> null","after":"1 -> null"},{"before":"1 -> 2 -> null","after":"2 -> 1 -> null"},{"before":"1 -> 2 -> 3 -> null","after":"3 -> 2 -> 1 -> null"}],"theTemporaryIsRequired":{"brokenAttempt":["head->next = prev;","prev = head;","head = head->next;"],"whyItFails":"the last line reads head->next, which the first line just overwrote — it now points back at prev, so the walk reverses direction","measured":"one node reachable out of five","correctOrder":["Node* next = head->next;","head->next = prev;","prev = head;","head = next;"],"thirdTimeThisRuleAppears":["Deletion of the head — read next before freeing the node","Clearing a list — read next before freeing, once per node","Reversing — read next before repointing it"],"generalForm":"the route onward is stored inside the thing being modified"},"threePointersNotThreeNames":{"cppExchange":"while (head) head = std::exchange(head->next, std::exchange(prev, head));","verdict":"verified correct, but the inner exchange holds the old prev while the outer holds the old next — three values still live","pythonTuple":"head.next, prev, head = prev, head, head.next","whyItIsSafe":"Python evaluates the entire right-hand side before assigning any of it","pythonSpeed":"1,396.45us against 1,762.45 for the three-statement version at n = 100,000 — about 1.26x"},"reversingLinksVsValues":{"sameOutput":"4 3 2 1 0 either way","test":"a 5-node list 0 1 2 3 4, holding an outside pointer to the SECOND node","relinkResult":{"heldNodeHolds":1,"meaning":"the node kept its value and moved position"},"valueResult":{"heldNodeHolds":3,"meaning":"the node stayed put and its value changed"},"whenItMatters":["a caller holds an iterator or node pointer","another list splices through the same nodes","a cache is keyed by node address","the payload is larger than a pointer — relinking moves 8-byte addresses, value reversal copies whole objects"],"testingTrap":"testing on the MIDDLE node shows no difference, because the midpoint is the one value a reversal leaves in place — which is how the wrong implementation passes a five-element example"},"benchCpp":{"unit":"microseconds, medians of nine; list length asserted after timing to prove no call degenerated","rows":[{"n":1000,"relink":0.91,"copyValues":2.10,"viaNodeArray":1.56},{"n":10000,"relink":9.55,"copyValues":21.18,"viaNodeArray":20.83},{"n":100000,"relink":98.48,"copyValues":254.81,"viaNodeArray":236.09},{"n":1000000,"relink":842.46,"copyValues":2285.22,"viaNodeArray":1938.82}],"verdict":"fastest at every size measured — 1.7x at n=1,000 rising to 2.3x-2.7x at n=1,000,000 — and O(1) space against O(n) — no trade-off, the in-place version wins on time, space and semantics"},"benchPython":{"unit":"microseconds, CPython 3.13.4, round trip halved with an order assertion","rows":[{"n":1000,"explicitTemp":16.88,"tupleAssign":14.18,"copyValues":41.92},{"n":10000,"explicitTemp":172.82,"tupleAssign":137.66,"copyValues":426.14},{"n":100000,"explicitTemp":1762.45,"tupleAssign":1396.45,"copyValues":4185.96}],"tupleVsExplicit":"1.26x","relinkVsCopyValues":"about 3x"},"benchmarkingTrap":{"problem":"reversal mutates and returns a DIFFERENT node as the new head","symptom":"timing reverse(h) in a loop without reassigning h leaves h pointing at what is now the tail, so every call after the first reverses a one-node list","measuredNonsense":"0.07us at n = 100,000 — about 0.7 nanoseconds per node","fixUsedHere":"time a round trip (reverse, then reverse back) and halve, asserting the list is back in its original order","cppFix":"reassign the head from the return value on every call; re-run with a length check after timing"},"verification":{"allThreeApproaches":"n = 0..200","disagreements":0,"involution":"reverse(reverse(list)) == list, checked on 1,000 nodes"},"assertions":["the new head is the old tail","the old head's next is null","the list contains the same nodes in the opposite order","reversing twice restores the original list","no node is allocated or freed"],"recommendation":"three pointers, relinking in place — fastest, O(1) space, and the only version that preserves node identity","lesson":"the route onward is stored inside the node you are about to change, so the temporary is a property of the data structure — and reversing values is a different operation that happens to agree on the simplest payload"}
```

<!-- @highlights -->
- Three labelled markers — `prev`, `current`, `next` — step the loop one beat at a time, with the order of operations made explicit rather than instantaneous.
- Beat one hooks `next` onto the node ahead, before anything else moves.
- Beat two swings the arrow out of `current` from forward to backward, landing on `prev`.
- Beats three and four slide `prev` and `current` one node right.
- The reader sees that beat two would sever the chain if beat one had not happened.
- The loop replays with beat one removed: the arrow flips first, and the advancing marker finds itself pointing back at `prev`.
- The rest of the chain visibly detaches and greys out, with a counter reading 1 node reachable of 5.
- The centre draws the same list twice with an external pointer labelled `held` attached to the second node.
- On the left, relinking: the boxes rearrange, the held pointer travels with its box, and its value stays 1.
- On the right, value reversal: the boxes stay rooted, the numbers slide between them, and the held box now reads 3.
- Both result lists print `4 3 2 1 0` underneath, identical, with the two held values — 1 and 3 — circled.
- That panel is captioned same output, different operation.
- The close shows cost bars for all three approaches at a million nodes: 842.46, 1,938.82 and 2,285.22.
- Each bar is annotated with its space usage — three pointers against two n-element arrays.
- The in-place version is visibly cheaper on both axes at once.

<!-- @edgeCases -->
- The empty list — returns null, because the loop never runs and `prev` is still null.
- A one-node list — returns the same node, with its `next` set from null to null.
- A two-node list — the smallest case where the temporary actually matters, since the broken version loses the second node.
- The old head after reversal — it is now the tail and its `next` must be null, which starting `prev` at null handles automatically.
- A caller that ignores the return value — the list is still reversed, but their pointer now refers to the tail rather than the head.
- An outside pointer held into the list — survives relinking with its value intact, and sees a changed value after value reversal.
- The middle node of an odd-length list — the one node whose value is identical under both operations, and therefore useless as a test.
- Reversing twice — must restore the original list exactly, which is the cheapest property test available.
- The node-array version on an empty list — `nodes.size() - 1` underflows without the empty check.
- The node-array version forgetting to null the old head's `next` — creates a cycle rather than a list.
- A cyclic list — the loop never terminates, since `head` never becomes null.

<!-- @pitfalls -->
- Overwriting `head->next` before saving it. The next line then reads the pointer just written and walks backwards — measured, one node reachable out of five.
- Returning `head` instead of `prev`. The loop exits with `head` null, so this returns an empty list.
- Forgetting to reassign at the call site. The list is reversed correctly and the caller's variable now points at the tail.
- Reversing the values instead of the links. Same printout, different operation — anything holding a node sees a changed value rather than a moved node.
- Testing value reversal on the middle node. The midpoint is the one value a reversal leaves alone, so the difference is invisible there.
- Using `i >= 0` with an unsigned index in the node-array version. `size_t` never goes below zero and the loop wraps.
- Forgetting to null the old head's `next` in the node-array version. The result is a cycle, not a reversed list.
- Timing a reversal by calling it repeatedly on the same variable. After the first call it reverses a one-node list — the tell was 0.07 microseconds at n = 100,000.
- Reaching for an O(n) array. Relinking measured faster at every size tested, by 1.7x to 2.7x, and uses three pointers instead of n.
- Splitting the Python tuple assignment into three statements in the same order. That is exactly the broken version; the safety comes from the right-hand side being evaluated first.
- Running any of these on a possibly-cyclic list. The loop has no terminating condition other than reaching null.

<!-- @doubt -->
### Why do I need three pointers when I only seem to use two?

<!-- @answer -->
Because the pointer you are about to overwrite is the only route to the rest of the list. The two-pointer version writes `head->next = prev` and then tries `head = head->next` — but that second read now returns `prev`, since the first line just put it there. The walk reverses direction and everything past the head becomes unreachable: measured on a five-node list, **one node is reachable out of five**. Saving `head->next` into a temporary before the overwrite costs one local variable and removes the problem entirely. This is the third time this topic has needed the same rule — **Deletion of the head** needed `next` read before the node was freed, clearing a list needs it once per node, and reversal needs it before repointing. The general form is that the route onward lives inside the thing being modified.

<!-- @doubt -->
### Can I write it with two variables?

<!-- @answer -->
You can write it with two *names*, and three values are still live. In C++, `head = std::exchange(head->next, std::exchange(prev, head));` is verified correct, but the inner `exchange` is holding the old `prev` while the outer holds the old `next` — the temporary moved into the expression rather than disappearing. Python says the same thing far more clearly: `head.next, prev, head = prev, head, head.next` is a single simultaneous assignment, and it is safe precisely because Python evaluates the **entire** right-hand side before assigning any part of it, so the `head.next` on the right is still the original. It also measured **1.26x faster** than the three-statement form, at 1,396.45 microseconds against 1,762.45 for a 100,000-node list. What you cannot do is spread those three assignments across three statements in that order — that is the broken version.

<!-- @doubt -->
### Can I just reverse the values instead of the pointers?

<!-- @answer -->
You can, and it is a different operation that happens to look the same. Copying the values into an array and writing them back reversed produces a list that prints identically — but the nodes never move, so anything holding a pointer into the list now finds a **different value** at the same address. Demonstrated on `0 1 2 3 4` while holding the second node: after relinking that node still holds **1** and has moved to fourth position; after value reversal it still sits second and holds **3**. Which you want depends on whether nodes have identity — an iterator held by a caller, another list splicing through the same nodes, a cache keyed by node address. It is also slower and larger: 254.81 microseconds against 98.48 at n = 100,000, plus O(n) memory, and worse again when the payload is bigger than a pointer. And be careful how you test it: the **middle** node is the one value a reversal leaves in place, so a five-element example checking the midpoint shows no difference at all.

<!-- @doubt -->
### Why return `prev` and not `head`?

<!-- @answer -->
Because the loop exits when `head` becomes null — that is its terminating condition. `prev` holds the last node the loop actually visited, which is the old tail, and the old tail is the new head. Returning `head` returns null, so the caller gets an empty list from a function that just correctly reversed everything. It is worth noticing what makes the other end work too: `prev` starts at **null**, so on the first iteration the old head's `next` is set to null, which is exactly what a new tail needs. Both ends of the reversal fall out of that one initial value, with no special cases at either boundary — the empty list and the one-node list both work unchanged.

<!-- @doubt -->
### Is the array-based version ever worth it?

<!-- @answer -->
Not for a plain reversal. Collecting the node pointers into an array and rewiring from it is semantically identical to the in-place loop — it moves nodes, not values — and measured **2.4x slower** at 236.09 microseconds against 98.48 for n = 100,000, while using O(n) memory instead of three pointers. Its value is pedagogical: it is the three-pointer loop with the intermediate state written out explicitly, and seeing it makes the loop easier to trust. It does have two traps of its own worth knowing, because they generalise. The index loop must stop at `i > 0` rather than `i >= 0`, since `size_t` is unsigned and never goes negative. And the old head's `next` must be set to null explicitly, or it still points forward and you have built a **cycle** rather than a reversed list.

<!-- @doubt -->
### Why did my benchmark say reversal takes 0.07 microseconds?

<!-- @answer -->
Because reversal mutates, and after the first call your variable points at the tail. The function returns a **different** node as the new head, so if you time `reverse(h)` in a loop without reassigning `h`, that variable still refers to the original head — which is now the last node, with `next` set to null. Every call after the first therefore reverses a one-node list and returns immediately. The tell is the number itself: 0.07 microseconds at n = 100,000 is about 0.7 nanoseconds per node, which no interpreted language can do. Two fixes work. Reassign from the return value on every call, as the C++ figures here do — and then verify by checking the list's length after the timing loop, which is what proved those numbers real. Or time a **round trip**, reversing and reversing back, then halve it, with an assertion that the list is in its original order.

<!-- @doubt -->
### What about the recursive version?

<!-- @answer -->
It is the next subtopic, and it is worth keeping separate because the trade-offs are entirely different. The short version: recursion expresses the reversal more declaratively — reverse the rest, then attach the head to the end — and it costs one stack frame per node, which this topic has already measured as a hard ceiling. **Deletion of the head** found a recursive free surviving 256,250 frames before the stack gave out, and **Find the length** found Python raising `RecursionError` at its default limit of 1,000. So the iterative version here is the one to reach for on any list you did not build yourself, and the recursive one is worth understanding for what it teaches about the structure rather than for running on long input.
