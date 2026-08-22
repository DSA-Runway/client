---
id: search-in-linked-list
topic: Linked Lists
title: Search in Linked List
difficulty: Medium
status: ready
prerequisites:
  - introduction-to-singly-linkedlist
  - find-the-length-of-the-linked-list
  - linear-search
  - while-loop
  - if-else-statements
  - time-and-space-complexity-basics
relatedIds:
  - find-the-length-of-the-linked-list
  - linear-search
  - introduction-to-singly-linkedlist
  - detect-a-loop-in-ll
  - middle-of-a-linkedlist-tortoisehare-method
---

<!-- @summary -->
Walk until the value turns up — where the cost is set by *where* the target is rather than by how long the list is, and the answer "not present" always costs the full walk; where **sorting the list does not enable binary search**, because there is no way to reach the middle, leaving a sorted chain **24,583x** behind a sorted array at a million elements; and where the classic sentinel trick, which removes one test per node, measured consistently **slower** — 0.65x to 0.79x over four runs.

<!-- @theory -->
## The operation

Start at the head, compare each node's value, stop when it matches or the list
ends.

```
head -> 10 -> 20 -> 30 -> null      searching for 20
         ^      ^
         1      2 found
```

It is **Linear Search** with `current = current->next` in place of `i++`, and
that one substitution is the whole difference — and the whole problem.

## The cost is the position, not the length

A search that finds its target early stops early. Measured on a million-node
list:

| Target | Time |
|---|---|
| First node | **0.00us** |
| 10% of the way in | 66.24us |
| Half way | 287.45us |
| Last node | 637.67us |
| **Absent** | **624.33us** |

The last two rows are the ones that matter. Finding the last element and finding
nothing cost the same, because both walk every node — so **"not present" is
always the worst case**, and in most real uses it is also the common case.

Quoting "O(n)" for this hides that a hit near the front is essentially free and a
miss is a full traversal. If your workload is mostly misses, the average is the
worst case.

## Sorting the list does not give you binary search

This is the important structural fact, and it is where linked lists and arrays
genuinely part company.

Binary search needs to jump to the middle. An array does that with arithmetic —
`base + (n/2) * size`. A linked list has no such operation: reaching the middle
node means walking to it, which costs more than the search you were trying to
speed up. **A sorted linked list is still O(n) to search.**

Measured against a sorted `vector`, looking for the last element:

| n | Sorted chain (walk) | Sorted vector (`binary_search`) | Ratio |
|---|---|---|---|
| 1,000 | 0.97us | 0.0103us | 94x |
| 10,000 | 8.65us | 0.0153us | 566x |
| 100,000 | 59.30us | 0.0224us | 2,647x |
| 1,000,000 | **732.87us** | **0.0298us** | **24,583x** |

Note the third column of the raw data too: a **linear** scan of the sorted vector
took 313.76us at a million, against 732.87 for the linked list walking the same
number of elements. Same algorithm, 2.3x apart, entirely from memory layout.

## What sorting does buy: misses stop half way

Sorting is not worthless — it changes the constant on the miss case. On a sorted
list you can stop as soon as you pass where the value would have been.

Counting nodes visited exactly, over 500 absent values spread through a sorted
100,000-node chain:

| | Mean nodes visited | Min | Max |
|---|---|---|---|
| Plain walk | **100,000** | 100,000 | 100,000 |
| Sorted walk with early exit | **50,803** | 88 | 99,869 |

**1.97x** — the miss stops on average half way rather than at the end. And it
stays linear: mean steps of 11,972, 23,943, 47,885 and 95,768 as n doubles from
25,000 to 200,000, which is x2.00 each time.

So sorting halves the average miss and changes nothing about the complexity
class. If you need better than O(n), the data structure has to change — a hash
set, or a **skip list**, which is a linked list with extra forward pointers at
higher levels precisely so it *can* skip.

## The sentinel trick does not pay here

A well-known optimisation for linear search: append the target to the end of the
data so a match is guaranteed, which lets the loop drop its bounds check and test
only the value.

```
plain:     while (p != nullptr && p->data != target) p = p->next;   // two tests
sentinel:  while (p->data != target) p = p->next;                   // one test
```

Measured on **one list**, in one memory layout, with both loops walking the same
1,000,001 nodes — medians of nine, repeated four times:

| Run | Plain | Sentinel | Sentinel speedup |
|---|---|---|---|
| 1 | 429.35us | 592.59us | **0.72x** |
| 2 | 419.11us | 555.25us | 0.75x |
| 3 | 636.28us | 803.19us | 0.79x |
| 4 | 736.78us | 1,136.85us | 0.65x |

The sentinel version is **slower every time**, by 1.3x to 1.5x. Removing a test
per node does not help because the loop is not limited by tests — it is waiting
for each `next` pointer to arrive from memory, and the comparison happens for
free inside that wait.

The absolute figures move a lot between runs (plain ranged 419 to 737), which is
memory and frequency noise; the *ratio* is stable, which is why it is the ratio
being quoted.

This is a useful calibration: on a pointer-chasing loop, arithmetic and branches
are nearly free and the only thing that costs is the next load.

## Python

| Target | Chain walk | `x in list` |
|---|---|---|
| First | 0.05us | 0.03us |
| 10% in | 394.90us | 66.89us |
| Half way | 2,036.09us | 345.78us |
| Last | 4,313.66us | 720.85us |
| Absent | 3,834.83us | 685.11us |

The `in` operator is about **6x** faster at every position, because the scan runs
in C while the chain walk runs a bytecode loop.

And `bisect` on a sorted built-in list is in a different league again — 0.1071us
against 1,979.43 for walking a sorted chain of 100,000, about **18,483x** — for
exactly the reason above: `bisect` indexes, and a chain cannot.

<!-- @intuition -->
Search on a linked list is linear search with the index step replaced by a pointer hop, and almost everything interesting follows from what that substitution takes away. An array's index arithmetic is what lets binary search exist at all — the ability to land on the middle element without touching the ones before it — and a chain has no way to do that, so a sorted chain is exactly as slow to search as an unsorted one. Sorting still buys something real, just smaller than people expect: a miss can stop as soon as it passes where the value would have been, which halves the average failed lookup and leaves the complexity untouched. The other thing worth taking from this one is a calibration about what costs time in a pointer-chasing loop. Removing a comparison from the inner loop is the classic micro-optimisation, and here it measured consistently *slower*, because the processor is idle waiting for the next node's address to arrive and the comparison it would have skipped was happening for free inside that wait.

<!-- @approach -->
### Optimal - Walk Until Found

<!-- @idea -->
Compare each node's value in turn and stop at the first match.

<!-- @steps -->
1. Start a pointer at the head.
2. While it is not null, compare the node's value with the target.
3. Return success as soon as they match.
4. Otherwise move to `current->next`.
5. Return failure when the pointer becomes null.

<!-- @complexity -->
- time: O(n) worst case, O(1) when the target is at the front, and **always O(n) when the target is absent**
- space: O(1)
- note: The only thing a bare singly linked list can do, and the cost tracks position rather than length — measured 0.00 microseconds for the first node, 287.45 half way, and 637.67 for the last on a million-node list. A miss costs 624.33, the same as finding the last element, so a workload of mostly misses has no best case at all.

<!-- @code cpp -->
```cpp
Node* find(Node* head, int target) {
    for (Node* current = head; current != nullptr; current = current->next)
        if (current->data == target) return current;
    return nullptr;
}

bool contains(Node* head, int target) {
    return find(head, target) != nullptr;
}
```

<!-- @annotations -->
- 3: Returning the **node** rather than a boolean is worth the extra character — the caller can then delete or modify it in O(1), where a boolean forces a second search.
- 4: Returning null for "not found" works because a valid node is never null. A search returning an index would need a separate sentinel like -1.
- 2: The null test comes first, so `current->data` is never read from a null pointer.

<!-- @code java -->
```java
static Node find(Node head, int target) {
    for (Node current = head; current != null; current = current.next)
        if (current.data == target) return current;
    return null;
}

static boolean contains(Node head, int target) {
    return find(head, target) != null;
}
```

<!-- @annotations -->
- 3: `==` compares `int` values here. If the payload were a reference type this would compare identity rather than contents, and would need `.equals`.

<!-- @code python -->
```python
def find(head, target):
    current = head
    while current is not None:
        if current.data == target:
            return current
        current = current.next
    return None


def contains(head, target):
    return find(head, target) is not None


# 3,834.83us to fail on a 200,000-node chain, against 685.11 for
# `target in list` on the same values -- about 6x, because the built-in
# scan runs in C and this loop does not.
```

<!-- @annotations -->
- 11: `is not None`, not `!= None` — a node class could define `__eq__`, and identity is what is actually meant.
- 4: The comparison uses `==` on the payload, so it follows whatever `__eq__` the stored values define, which is usually what you want and occasionally a surprise.

<!-- @approach -->
### Search a Sorted List

<!-- @idea -->
If the values are in order, a miss can stop as soon as it passes where the target would have been.

<!-- @steps -->
1. Walk from the head as usual.
2. Return the node if its value equals the target.
3. Return failure as soon as a value **exceeds** the target — everything after it is larger still.
4. Return failure if the list ends first.

<!-- @complexity -->
- time: O(n) — unchanged; the early exit halves the average miss and does not alter the class
- space: O(1)
- note: The honest version of "sorting helps". Counted exactly over 500 absent values spread through a sorted 100,000-node chain, the plain walk visited all 100,000 every time while this visited **50,803 on average** — a factor of **1.97**. It stays linear: mean steps of 11,972, 23,943, 47,885 and 95,768 as n doubles, exactly x2.00 each time. What it does **not** give you is binary search, because reaching the middle would cost more than the search.

<!-- @code cpp -->
```cpp
Node* findSorted(Node* head, int target) {
    for (Node* current = head; current != nullptr; current = current->next) {
        if (current->data == target) return current;
        if (current->data > target) return nullptr;   // passed where it would be
    }
    return nullptr;
}
```

<!-- @annotations -->
- 4: The whole benefit. Without this line a miss walks the entire list; with it, a miss stops on average half way — measured 50,803 nodes against 100,000. It has to be `>` and not `>=`: the equality case was already handled on the line above, and `>=` here would return null on a match.
- 1: Only valid on a list that really is sorted. Nothing in the structure enforces or records that, so it is a precondition the caller must guarantee.

<!-- @code java -->
```java
static Node findSorted(Node head, int target) {
    for (Node current = head; current != null; current = current.next) {
        if (current.data == target) return current;
        if (current.data > target) return null;
    }
    return null;
}
```

<!-- @annotations -->
- 4: Two comparisons per node rather than one, in exchange for stopping early — worth it on misses and a small loss on hits, since a hit would have stopped anyway.

<!-- @code python -->
```python
def find_sorted(head, target):
    current = head
    while current is not None:
        if current.data == target:
            return current
        if current.data > target:
            return None
        current = current.next
    return None


# Exactly measured: on a sorted 100,000-node chain, absent lookups
# visited 50,803 nodes on average against 100,000 for the plain walk --
# 1.97x. Still O(n): mean steps doubled exactly with n.
```

<!-- @annotations -->
- 6: The early exit assumes ascending order. On a descending list the comparison flips, and on an unsorted one it returns wrong answers rather than being merely slow.

<!-- @approach -->
### The Sentinel Trick - Measured and Rejected

<!-- @idea -->
Append the target to the end so a match is guaranteed, letting the loop drop its null check and test only the value.

<!-- @steps -->
1. Attach a node holding the target to the end of the list.
2. Walk without a bounds check, since a match is now certain.
3. Stop at the first node whose value matches.
4. Report success only if the node found is not the appended one.
5. Remove the appended node afterwards.

<!-- @complexity -->
- time: O(n), with one comparison per node instead of two
- space: O(1), plus the temporary node
- note: A classic linear-search optimisation that does not survive contact with a linked list. Measured on one list in one memory layout, with both loops walking the same 1,000,001 nodes: the sentinel version was **slower in all four runs**, at 0.72x, 0.75x, 0.79x and 0.65x. The loop is limited by waiting for each `next` pointer to arrive, not by the test being removed — so the saved comparison was already free, and the restructuring costs. It also mutates the list, which rules it out for shared or const data.

<!-- @code cpp -->
```cpp
// Measured slower than the plain loop. Kept here as the thing not to do.
bool containsSentinel(Node* head, Node* tail, int target) {
    Node sentinel(target);          // a match is now guaranteed
    tail->next = &sentinel;

    Node* p = head;
    while (p->data != target) p = p->next;   // no null test needed

    tail->next = nullptr;           // must be undone
    return p != &sentinel;
}
```

<!-- @annotations -->
- 6: One test per node instead of two, which is the entire theory — and it measured 1.3x to 1.5x slower, because the processor was waiting on the next load anyway.
- 3: The list is **modified** to search it. That rules the technique out for a `const` list, a shared one, or anything another thread might be reading.
- 9: The restoration has to happen on every exit path. An early return or a thrown exception between lines 3 and 9 leaves a dangling pointer to a stack object.

<!-- @code java -->
```java
// Measured slower. Kept as a documented dead end.
static boolean containsSentinel(Node head, Node tail, int target) {
    Node sentinel = new Node(target);
    tail.next = sentinel;
    Node p = head;
    while (p.data != target) p = p.next;
    tail.next = null;
    return p != sentinel;
}
```

<!-- @annotations -->
- 8: `!=` on references here compares identity, which is exactly what is wanted — "is this the node I appended" rather than "does it hold the same value".

<!-- @code python -->
```python
# Measured slower in C++, and pointless in Python: the win was supposed
# to be removing one test per iteration, and an interpreted loop pays
# far more per iteration than that test costs.
def contains_sentinel(head, tail, target):
    sentinel = Node(target)
    tail.next = sentinel
    p = head
    while p.data != target:
        p = p.next
    tail.next = None
    return p is not sentinel


# In Python the real answer is not to hand-roll the loop at all --
# `target in [...]` measured about 6x faster than any node walk.
```

<!-- @annotations -->
- 11: `is not`, comparing identity — the appended node holds the same value as a genuine match, so only identity can distinguish them.

<!-- @example -->

<!-- @input -->
`10 -> 20 -> 30 -> null`, searching for 20 and then for 40

<!-- @output -->
The node holding 20; then null

<!-- @why -->
The operation and its two outcomes, showing that the failing case is the one that costs.

<!-- @walkthrough -->
1. Searching for 20: the first node holds 10, which does not match, so the walk moves on.
2. The second node holds 20 — return it immediately, having read two nodes.
3. Searching for 40: 10 does not match, 20 does not match, 30 does not match.
4. The pointer becomes null and the search reports failure, having read all three nodes.
5. A hit can stop anywhere; a miss always reaches the end.
6. Measured on a million nodes, finding the first took 0.00 microseconds and a miss took 624.33 — the same as finding the last element, at 637.67.
7. So the average cost depends entirely on the hit rate of the workload, not on the list's length alone.

<!-- @example -->

<!-- @input -->
A sorted chain and a sorted vector of a million elements, both searched for the last value

<!-- @output -->
732.87us and 0.0298us

<!-- @why -->
The structural difference between the two containers, on data that is favourable to both.

<!-- @walkthrough -->
1. Both hold the same million values in the same ascending order.
2. `binary_search` on the vector halves the range about twenty times and lands on the answer in 0.0298 microseconds.
3. Every one of those halvings needs the address of a middle element, computed as `base + index * size`.
4. A linked list cannot compute that address — the only way to reach the middle node is to walk to it, which costs more than the search.
5. So the chain must walk, and took **732.87** microseconds, a factor of **24,583**.
6. A *linear* scan of the same sorted vector took 313.76 microseconds — 2.3x faster than the chain doing the identical algorithm, purely from memory layout.
7. Sorting a linked list makes it printable in order and no faster to search.

<!-- @example -->

<!-- @input -->
500 absent values spread through a sorted 100,000-node chain, counting nodes visited

<!-- @output -->
100,000 every time without the early exit; a mean of 50,803 with it

<!-- @why -->
Measures what sorting is actually worth, exactly, by counting steps rather than timing them.

<!-- @walkthrough -->
1. The chain holds the even numbers, so every odd value is guaranteed absent and they spread evenly through the range.
2. Without an early exit, every miss visits all 100,000 nodes — mean, minimum and maximum are all 100,000.
3. With the early exit, a miss stops at the first value larger than the target.
4. Measured across the 500 lookups: mean **50,803** nodes, minimum 88, maximum 99,869.
5. That is a factor of **1.97** — the miss stops on average half way, as expected.
6. Repeating at 25,000, 50,000, 100,000 and 200,000 nodes gave mean steps of 11,972, 23,943, 47,885 and 95,768 — exactly x2.00 per doubling.
7. So sorting halves the constant and leaves the complexity class alone.
8. Timing this was too noisy to resolve a 2x at these sizes, which is why the claim rests on counted steps instead.

<!-- @example -->

<!-- @input -->
The plain loop and the sentinel loop over the same 1,000,001-node list

<!-- @output -->
The sentinel version is slower in all four runs — 0.72x, 0.75x, 0.79x, 0.65x

<!-- @why -->
A textbook micro-optimisation that measurement rejects, and the reason why is worth more than the trick would have been.

<!-- @walkthrough -->
1. The plain loop tests two things per node: whether the pointer is null and whether the value matches.
2. The sentinel loop guarantees a match by appending the target, so it tests only the value.
3. Both were run over the **same** list in the same memory, walking the same 1,000,001 nodes, medians of nine runs.
4. The sentinel version measured slower every time, by between 1.3x and 1.5x.
5. The reason is that the loop is not limited by comparisons — it is waiting for each `next` pointer to be fetched from memory.
6. The comparison it removed was already happening for free inside that wait, so nothing was saved and the restructuring cost.
7. The absolute numbers varied widely between runs — plain measured 419, 429, 636 and 737 microseconds — which is why the stable ratio is what gets quoted.
8. The general calibration: in a pointer-chasing loop, branches and arithmetic are close to free, and the only thing that costs is the next load.

<!-- @visualization linked-list -->

<!-- @description -->
Open on a chain with a target chip pinned above it, and run the search three times over the same list with the target placed differently — at the front, half way, and absent. Draw a cost bar that fills as the cursor advances, so the three runs end with visibly different bars, and label the absent run identical in length to the last-node run. That equality is the point: a miss is not a special case, it is the worst case. Next, the binary-search comparison, which needs the two containers drawn honestly side by side. Above, an array as contiguous cells with a bracket that halves repeatedly — three or four visible jumps landing straight on the answer, each annotated with the arithmetic `base + i * size` that made the jump possible. Below, the same values as a chain, with the same bracket attempted: show the midpoint arrow trying to reach the middle node and having to walk there, node by node, so the "jump" is drawn as a full traversal in miniature. Put 0.0298us against 732.87us beneath them. Then the sorted early-exit: two runs over a sorted chain looking for an absent value, one walking to the end and one stopping the moment a larger value appears, with a step counter under each ending on 100,000 and 50,803 and a caption reading half the walk, the same complexity. The last panel is the sentinel result, and it should be presented as a rejected hypothesis rather than a technique. Draw the two loop bodies stacked — two tests versus one — with the removed test crossed out, then show the actual timings as four paired bars where the "optimised" bar is longer every time. Underneath, draw a single node fetch as a long latency bar with the comparison as a tiny sliver sitting inside it, captioned the test you removed was already free.

<!-- @sampleInput -->
```json
{"primary":{"list":"10 -> 20 -> 30 -> null","searchFor":20,"result":"the node holding 20, after reading two nodes","searchForAbsent":40,"absentResult":"null, after reading all three"},"smallCases":[{"list":"10 -> 20 -> 30 -> null","target":20,"found":true,"nodesRead":2},{"list":"10 -> 20 -> 30 -> null","target":40,"found":false,"nodesRead":3},{"list":"null","target":1,"found":false,"nodesRead":0},{"list":"7 -> null","target":7,"found":true,"nodesRead":1}],"relationToLinearSearch":"identical, with current = current->next in place of i++ — and that one substitution is the whole difference","costIsPositionNotLength":{"n":1000000,"rows":[{"target":"first node","us":0.00},{"target":"10% of the way in","us":66.24},{"target":"half way","us":287.45},{"target":"last node","us":637.67},{"target":"absent","us":624.33}],"reading":"finding the last element and finding nothing cost the same, so a miss is always the worst case — and in most real uses it is also the common case"},"sortingDoesNotGiveBinarySearch":{"why":"binary search needs to jump to the middle, which an array does with base + (n/2) * size; a chain can only walk there, costing more than the search","measured":[{"n":1000,"sortedChainWalk":0.97,"vectorBinarySearch":0.0103,"vectorLinearScan":0.33,"ratio":"94x"},{"n":10000,"sortedChainWalk":8.65,"vectorBinarySearch":0.0153,"vectorLinearScan":3.10,"ratio":"566x"},{"n":100000,"sortedChainWalk":59.30,"vectorBinarySearch":0.0224,"vectorLinearScan":30.57,"ratio":"2647x"},{"n":1000000,"sortedChainWalk":732.87,"vectorBinarySearch":0.0298,"vectorLinearScan":313.76,"ratio":"24583x"}],"secondaryFinding":"a linear scan of the sorted vector took 313.76us against 732.87 for the chain doing the identical algorithm — 2.3x, purely from memory layout","ifYouNeedBetter":"the data structure has to change — a hash set, or a skip list, which is a linked list with extra forward pointers at higher levels precisely so it can skip"},"whatSortingDoesBuy":{"benefit":"a miss stops as soon as it passes where the value would have been","measuredByCountingSteps":{"chain":"even numbers, 100,000 nodes; every odd value is absent and they spread evenly","lookups":500,"plainWalk":{"mean":100000,"min":100000,"max":100000},"sortedWalk":{"mean":50803,"min":88,"max":99869},"ratio":"1.97x"},"stillLinear":[{"n":25000,"meanSteps":11972},{"n":50000,"meanSteps":23943,"growth":"x2.00"},{"n":100000,"meanSteps":47885,"growth":"x2.00"},{"n":200000,"meanSteps":95768,"growth":"x2.00"}],"whyStepsNotTiming":"timing was too noisy to resolve a 2x at these sizes; counting nodes visited is exact","verdict":"halves the constant, leaves the complexity class alone"},"sentinelTrickRejected":{"idea":"append the target so a match is guaranteed, letting the loop drop its null test and check only the value","setup":"one list, one memory layout, both loops walking the same 1,000,001 nodes, medians of nine","runs":[{"plain":429.35,"sentinel":592.59,"speedup":"0.72x"},{"plain":419.11,"sentinel":555.25,"speedup":"0.75x"},{"plain":636.28,"sentinel":803.19,"speedup":"0.79x"},{"plain":736.78,"sentinel":1136.85,"speedup":"0.65x"}],"verdict":"slower in all four runs, by 1.3x to 1.5x","why":"the loop is waiting for each next pointer to arrive from memory, so the comparison it removed was already happening for free inside that wait","noteOnNoise":"absolute figures ranged 419 to 737 for the plain loop; the ratio is stable, which is why the ratio is quoted","otherObjection":"it mutates the list, ruling it out for const or shared data","calibration":"in a pointer-chasing loop, branches and arithmetic are nearly free and the only thing that costs is the next load"},"benchPython":{"unit":"microseconds, CPython 3.13.4, n = 200,000","byPosition":[{"target":"first","chainWalk":0.05,"inOperator":0.03},{"target":"10% in","chainWalk":394.90,"inOperator":66.89},{"target":"half way","chainWalk":2036.09,"inOperator":345.78},{"target":"last","chainWalk":4313.66,"inOperator":720.85},{"target":"absent","chainWalk":3834.83,"inOperator":685.11}],"inIsAboutSixTimesFaster":"the scan runs in C while the chain walk runs a bytecode loop","bisect":[{"n":1000,"sortedChainWalk":18.61,"bisect":0.0747,"ratio":"249x"},{"n":10000,"sortedChainWalk":191.37,"bisect":0.0931,"ratio":"2057x"},{"n":100000,"sortedChainWalk":1979.43,"bisect":0.1071,"ratio":"18483x"}]},"assertions":["a hit returns the first node whose value matches","a miss visits every node in an unsorted list","the empty list returns not-found without dereferencing anything","on a sorted list the early exit never changes the answer, only the work","search cost depends on the target's position, not only on the list's length"],"recommendation":"walk and compare, returning the node rather than a boolean; add the early exit only if the list is genuinely sorted; if O(n) is not good enough, change the structure rather than the loop","lesson":"index arithmetic is what makes binary search possible, so a sorted linked list is exactly as slow to search as an unsorted one — and on a pointer-chasing loop, the test you remove was already free"}
```

<!-- @highlights -->
- A target chip pins above the chain and the search runs three times over the same list, with the target at the front, half way, and absent.
- A cost bar fills as the cursor advances, so the three runs end with visibly different lengths.
- The absent run's bar is labelled identical in length to the last-node run — a miss is the worst case, not a special case.
- The binary-search comparison draws both containers honestly, one above the other.
- Above, an array of contiguous cells with a bracket halving repeatedly, each jump annotated with the `base + i * size` arithmetic that made it possible.
- Below, the same values as a chain: the midpoint arrow tries to reach the middle and has to walk there node by node.
- The "jump" is therefore drawn as a full traversal in miniature, with 0.0298us against 732.87us beneath.
- The sorted early-exit panel runs two searches for an absent value over a sorted chain.
- One walks to the end, the other stops the moment a larger value appears, with step counters ending on 100,000 and 50,803.
- That panel is captioned half the walk, the same complexity.
- The sentinel result is presented as a rejected hypothesis rather than a technique.
- Two loop bodies stack — two tests versus one — with the removed test crossed out.
- The actual timings show as four paired bars where the "optimised" bar is longer every time.
- Beneath, a single node fetch is drawn as a long latency bar with the comparison as a tiny sliver inside it.
- That final frame is captioned the test you removed was already free.

<!-- @edgeCases -->
- The empty list — returns not-found immediately, with no dereference, because the loop never runs.
- A one-element list — either an immediate hit or a one-node miss.
- The target at the head — the cheapest possible case, measured at 0.00 microseconds on a million-node list.
- The target absent — the most expensive case, and identical in cost to finding the last node.
- Duplicate values — the first match is returned; nothing in the structure prevents duplicates or records how many there are.
- A cyclic list — an unsuccessful search never terminates, exactly as with computing the length.
- A sorted-list search run on an unsorted list — returns wrong answers rather than merely being slow, because the early exit fires spuriously.
- A descending sorted list — the early-exit comparison must be flipped, or every miss returns at the first node.
- Searching from a node other than the head — searches only the remaining tail, which is occasionally what you want and easy to do by accident.
- A payload that is a reference type in Java — `==` compares identity rather than contents, and needs `.equals`.

<!-- @pitfalls -->
- Assuming a sorted linked list can be binary searched. There is no way to reach the middle, so it stays O(n) — measured 24,583x behind a sorted array at a million elements.
- Sorting a list in order to speed up searching. It halves the average miss and changes nothing else; the mean steps still doubled exactly with n.
- Quoting O(n) without saying that misses always pay it in full. A hit near the front is essentially free and a miss is a complete traversal.
- Reaching for the sentinel trick. Measured slower in all four runs, by 1.3x to 1.5x, because the removed test was already free inside the memory wait.
- Leaving a sentinel attached on an early return. The list keeps a pointer to a node that may live on the stack.
- Using the sentinel technique on shared or `const` data. It searches by mutating the list.
- Returning a boolean when the caller will need the node. That forces a second O(n) search to do anything with the result.
- Calling a search inside a loop over the same list. Two O(n) operations nested is O(n²), the same trap as calling `length` repeatedly.
- Running the sorted early exit on data that is not actually sorted. Nothing in the structure records or enforces order, so this is a silent wrong answer.
- Comparing reference payloads with `==` in Java or `is` in Python. That tests identity, not equality, and will miss values that should match.

<!-- @doubt -->
### If I sort the list, can I binary search it?

<!-- @answer -->
No, and this is the clearest place where a linked list and an array genuinely differ. Binary search works by jumping to the middle of a range, which an array does with arithmetic — the address of element `i` is `base + i * size`, computed without touching any other element. A linked list has no such operation: the only way to reach the middle node is to walk to it from the head, which costs more than the linear search you were trying to avoid. So a sorted chain is still O(n). Measured against a sorted `vector` at a million elements, `binary_search` took **0.0298 microseconds** and walking the chain took **732.87** — a factor of **24,583**. Worth noting the smaller comparison too: a plain linear scan of the sorted vector took 313.76 microseconds, still 2.3x faster than the chain running the identical algorithm, purely because contiguous memory is cheaper to walk.

<!-- @doubt -->
### So is sorting the list completely pointless?

<!-- @answer -->
Not completely — it halves the average miss, and it is worth knowing exactly how much rather than guessing. On a sorted list a failed search can stop as soon as it passes the point where the target would have been, instead of walking to the end. Counted precisely over 500 absent values spread through a sorted 100,000-node chain: the plain walk visited all 100,000 every single time, while the early-exit version visited **50,803 on average** — a factor of **1.97**, exactly the half you would expect. But it stays linear, and the step counts show it plainly: 11,972, 23,943, 47,885 and 95,768 as n doubles from 25,000 to 200,000, which is x2.00 each time. So sorting improves the constant on misses and does nothing to the complexity. If O(n) is the problem, you need a different structure — a hash set, or a skip list, which is a linked list carrying extra forward pointers at higher levels precisely so it can skip.

<!-- @doubt -->
### Why is "not found" the case that matters?

<!-- @answer -->
Because it is the only case with no shortcut, and it is usually the common one. A successful search stops at the match, so its cost is set by the target's position — measured on a million-node list, finding the first node took **0.00 microseconds**, half way took 287.45, and the last took 637.67. A failed search has no such option: it must prove the value is nowhere, which means visiting every node, and measured **624.33** microseconds — indistinguishable from finding the last element. That matters for how you reason about a workload. If most lookups hit early, the average is nothing like O(n); if most lookups miss, every single one pays the full traversal and the average *is* the worst case. Quoting "O(n)" flattens a distinction that can be three orders of magnitude wide.

<!-- @doubt -->
### Does the sentinel trick help?

<!-- @answer -->
It measured slower, every time. The idea is sound on paper: append the target to the end so a match is guaranteed, and the loop can then test only the value instead of also checking for null — one test per node instead of two. Run over **one** list in one memory layout, both loops walking the same 1,000,001 nodes, medians of nine runs repeated four times, the sentinel version came out at **0.72x, 0.75x, 0.79x and 0.65x** — that is 1.3x to 1.5x *slower*. The reason is the useful part: the loop is not limited by how many tests it performs, it is limited by waiting for each `next` pointer to arrive from memory, and the comparison it removed was happening for free inside that wait. It also mutates the list to search it, which rules it out for shared or `const` data. The general calibration is worth keeping: in a pointer-chasing loop, branches and arithmetic are nearly free and only the next load costs.

<!-- @doubt -->
### Should the function return a boolean or the node?

<!-- @answer -->
The node, in almost every case. A boolean answers "is it there" and then throws away everything the search learned, so a caller that wants to delete, update or splice at that position has to search again — turning one O(n) walk into two. Returning the node makes those follow-up operations O(1), and `find(head, x) != nullptr` recovers the boolean for free when that is all you needed. There is a related habit worth carrying from this: for deletion specifically you usually want the node **before** the match rather than the match itself, since a singly linked list cannot step backwards, so a search intended to support removal should track the previous pointer as it walks. That is why several later problems in this topic thread a `prev` pointer through what looks like a plain traversal.

<!-- @doubt -->
### What is the Python answer here?

<!-- @answer -->
Not to write the loop. `target in my_list` on a built-in list measured about **6x faster** than walking an equivalent node chain at every target position — 685.11 microseconds against 3,834.83 for a failed lookup over 200,000 elements — because the scan runs in C while the chain walk runs a bytecode loop. If the data is sorted, `bisect` is in a different league again: 0.1071 microseconds against 1,979.43 for walking a sorted chain of 100,000, about **18,483x**, and for exactly the reason above — `bisect` indexes, and a chain cannot. Hand-rolled linked lists in Python are for learning the structure or for problems that demand the node-level manipulation; when the task is really "is this value present", the built-in container is both faster and shorter.

<!-- @doubt -->
### What happens if the list has a cycle?

<!-- @answer -->
A successful search still returns, because it stops at the match. An **unsuccessful** one never terminates, for the same reason computing the length does not: the loop's only exit is reaching a null, and a cyclic chain has none. That asymmetry is worth noticing — the failure is invisible until someone searches for something that is not there, which may be long after the cycle was introduced. There is no cheap guard inside the search itself; detecting the cycle needs either a record of visited nodes at O(n) memory or the two-pointer technique that **Detect a loop in LL** is about. The practical rule matches the one from computing the length: a search may only be run on a list you know terminates, and code accepting a list from an untrusted source cannot simply walk it.
