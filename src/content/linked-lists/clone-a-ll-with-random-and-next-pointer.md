---
id: clone-a-ll-with-random-and-next-pointer
topic: Linked Lists
title: Clone a LL with Random and Next Pointer
difficulty: Hard
status: ready
prerequisites:
  - flattening-of-ll
  - rotate-a-linked-list
  - introduction-to-singly-linkedlist
relatedIds:
  - flattening-of-ll
  - rotate-a-linked-list
  - reverse-ll-in-group-of-given-size-k
  - find-the-intersection-point-of-y-ll
  - detect-a-loop-in-ll
---

<!-- @summary -->
The last Linked Lists subtopic, and the one where the obvious test cannot detect the obvious bug: a clone whose random pointers still aim into the original passes a value-based check on 100% of inputs and is not a copy at all. The interleaving trick removes the hash map and runs 14.31x faster at a million nodes, at the cost of one obligation — putting the input back, which 85.42% of inputs will otherwise catch you out on.

<!-- @theory -->
## The problem

Every node has a `next` and a `random`, where `random` points at any node in the
list or at null. Produce a **deep copy**: a new list of new nodes with the same
values and the same shape, sharing nothing with the original.

```
[0] 7   random -> null
[1] 13  random -> [0]
[2] 11  random -> [4]
[3] 10  random -> [2]
[4] 1   random -> [0]
```

`next` is easy — walk and copy. `random` is the problem: when you copy node 3 you
need the *copy* of node 2, which may not exist yet, and which you have no way to
name.

## Two ways to check the answer, and only one of them works

A deep copy has two requirements, and they are not equally easy to verify:

1. The values and the shape match — node `i`'s `random` points at position `j` in
   the clone exactly when it did in the original.
2. **No node of the clone is, or points at, a node of the original.**

The natural test walks both lists together comparing `data`, and where `random` is
non-null compares `p->random->data` with `q->random->data`. That test cannot see a
violation of the second requirement at all. A clone built by copying values and
`next` correctly but leaving every `random` aimed at the **original** node passed
that check on **all 50,000** random lists measured — 100%. The same clones passed a
real deep-copy check, which resolves each `random` to a *position within the clone*
and rejects any pointer into the original, on **10.43%**, and those are exactly the
lists where every `random` happened to be null.

So the first thing to fix is the test. Comparing `random->data` compares a value
that is identical in both lists by construction; it establishes nothing.

## The hash map, and what it is really doing

Map each original node to its copy, then make a second pass wiring both pointers
through the map:

```
copy[p]->next   = copy[p->next]
copy[p]->random = copy[p->random]
```

The map exists to answer one question — *given an original node, what is its
copy?* — and it answers it in O(1) with O(n) space.

## Interleaving answers the same question for free

Weave each copy in immediately after its original:

```
O0 -> C0 -> O1 -> C1 -> O2 -> C2 -> O3 -> C3 -> O4 -> C4
```

Now the copy of any node `X` is `X->next`, permanently and without a lookup. So
the line that needed the map becomes:

```cpp
copy->random = original->random->next;
```

Three passes, no map, no allocation beyond the nodes themselves. Measured:

| n | hash map | interleave | ratio |
|---|---|---|---|
| 1,000 | 83,667 | **13,042** | 6.42x |
| 10,000 | 964,625 | **164,416** | 5.87x |
| 100,000 | 11,087,167 | **1,600,833** | 6.93x |
| 1,000,000 | 310,090,084 | **21,676,125** | **14.31x** |

Nanoseconds. Both are O(n), and the gap *widens* with n — 6.4x at a thousand
nodes, 14.3x at a million — because the hash map's cost is not really the hashing
but the cache behaviour: `copy[p->random]` is a random probe into a table that no
longer fits in cache, once per node.

## The obligation the trick creates

Interleaving mutates the input. The third pass has to separate the two chains
*and put the original back*, and it is easy to write a separation that extracts
the clone correctly while leaving the original pointing at copy nodes.

Measured over 50,000 random lists, a version that unweaves the clone without
restoring the original produces a **perfectly correct clone — 0 wrong** — and
leaves the **original corrupted on 42,709 of them, 85.42%**.

This is the third time in this topic that shape has appeared: the doubly linked
list whose `prev` chain was broken while `next` read correctly, the flattened list
whose `next` pointers were stale while `bottom` read correctly, and now a function
that returns the right answer and destroys its argument. In each case the thing
checked and the thing damaged are different.

<!-- @intuition -->
The interleaving trick is worth understanding as an answer to a specific question rather than as a clever manoeuvre to memorise. The hard part of this problem is a lookup — *what is the copy of this node?* — and the hash map answers it by building an index. Interleaving answers it by choosing a layout in which the answer is already adjacent to the question, so no index is needed. That is a general move: when you find yourself building a map from one structure into a parallel one, ask whether the two can be interleaved, nested or paired so the correspondence becomes positional. The cost is that you have temporarily destroyed the input, which is exactly the kind of debt that is easy to take on and easy to forget to repay.

<!-- @approach -->
### Map Each Node to Its Copy

<!-- @idea -->
Build a dictionary from every original node to its fresh copy, then wire both pointers by looking them up.

<!-- @steps -->
1. Walk the list creating a copy of each node, recording original → copy.
2. Walk again, and for each original set the copy's `next` and `random` by looking up the originals' targets.
3. Null targets map to null.
4. Return the copy of the head.

<!-- @complexity -->
- time: O(n)
- space: O(n) for the map
- note: Correct on all 50,000 random lists, and the version to reach for when the input must not be touched. **14.31x** slower than interleaving at a million nodes, because every `random` lookup is a cache miss.

<!-- @code cpp -->
```cpp
#include <unordered_map>
using namespace std;

Node* copyRandomList(Node* head) {
    if (!head) return nullptr;

    unordered_map<Node*, Node*> copy;
    for (Node* p = head; p; p = p->next)
        copy[p] = new Node(p->data);

    for (Node* p = head; p; p = p->next) {
        copy[p]->next   = p->next   ? copy[p->next]   : nullptr;
        copy[p]->random = p->random ? copy[p->random] : nullptr;
    }
    return copy[head];
}
```

<!-- @annotations -->
- 8: Every copy is created before any pointer is wired, which is what makes the second pass able to resolve a `random` that points forwards.
- 13: `copy[p->random]`, not `p->random`. Assigning the original's node here produces a clone that passes a value-based check on 100% of inputs and is not a copy.
- 12: The null tests matter because `unordered_map::operator[]` would *insert* a null key rather than fail, silently producing a copy whose pointers lead nowhere.
- 15: The map is keyed by pointer, so it never confuses two nodes that hold the same value — which a value-keyed map would.

<!-- @code java -->
```java
static Node copyRandomList(Node head) {
    if (head == null) return null;

    HashMap<Node, Node> copy = new HashMap<>();
    for (Node p = head; p != null; p = p.next)
        copy.put(p, new Node(p.data));

    for (Node p = head; p != null; p = p.next) {
        copy.get(p).next   = p.next   != null ? copy.get(p.next)   : null;
        copy.get(p).random = p.random != null ? copy.get(p.random) : null;
    }
    return copy.get(head);
}
```

<!-- @annotations -->
- 4: `HashMap<Node, Node>` uses `Node`'s `hashCode` and `equals`. With the defaults those are identity-based, which is what this needs — overriding them by value would merge distinct nodes holding the same data.

<!-- @code python -->
```python
def copy_random_list(head):
    if head is None:
        return None

    copy = {}
    p = head
    while p:
        copy[p] = Node(p.data)
        p = p.next

    p = head
    while p:
        copy[p].next = copy[p.next] if p.next else None
        copy[p].random = copy[p.random] if p.random else None
        p = p.next
    return copy[head]
```

<!-- @annotations -->
- 5: A plain `dict` keyed by node objects hashes by identity unless `__hash__` is overridden, so distinct nodes with equal data stay distinct keys.

<!-- @approach -->
### Interleave, Wire, Separate

<!-- @idea -->
Put each copy directly after its original, so the copy of any node is simply that node's `next` — then the random pointers wire themselves.

<!-- @steps -->
1. First pass: after each original node, splice in a copy of it.
2. Second pass: for each original, set `copy->random = original->random->next`, or null.
3. Third pass: unweave the two chains, restoring the original's `next` pointers and building the clone's.
4. Return the head of the clone.

<!-- @complexity -->
- time: O(n)
- space: O(1) beyond the copied nodes
- note: **6.4x to 14.31x** faster than the map, the gap widening with n. Its one obligation is the third pass: separating without restoring leaves a correct clone and an original corrupted on **85.42%** of inputs.

<!-- @code cpp -->
```cpp
Node* copyRandomList(Node* head) {
    if (!head) return nullptr;

    for (Node* p = head; p; ) {
        Node* nxt = p->next;
        Node* c = new Node(p->data);
        p->next = c;
        c->next = nxt;
        p = nxt;
    }

    for (Node* p = head; p; p = p->next->next)
        p->next->random = p->random ? p->random->next : nullptr;

    Node dummy(0);
    Node* t = &dummy;
    for (Node* p = head; p; ) {
        Node* c = p->next;
        Node* nxt = c->next;
        t->next = c;
        t = c;
        p->next = nxt;
        p = nxt;
    }
    return dummy.next;
}
```

<!-- @annotations -->
- 13: The line the whole trick exists for. The copy of any node sits at that node's `next`, so the copy of `p->random` is `p->random->next` — the lookup the hash map was built to perform. The null test on the same line cannot be dropped either: `p->random->next` dereferences null when `random` is null, and roughly half of all random pointers are null in a typical input.
- 12: `p = p->next->next` skips over the copy, so this loop visits only originals. Advancing by one would try to read a copy's `random` before it is set.
- 22: Restoring the original's `next` is not optional. Omit it and the clone is still perfect while the input is left threaded through copy nodes — measured wrong on 85.42%.
- 5: `p->next` is saved before it is overwritten on line 7.

<!-- @code java -->
```java
static Node copyRandomList(Node head) {
    if (head == null) return null;

    for (Node p = head; p != null; ) {
        Node nxt = p.next;
        Node c = new Node(p.data);
        p.next = c;
        c.next = nxt;
        p = nxt;
    }

    for (Node p = head; p != null; p = p.next.next)
        p.next.random = p.random != null ? p.random.next : null;

    Node dummy = new Node(0);
    Node t = dummy;
    for (Node p = head; p != null; ) {
        Node c = p.next;
        Node nxt = c.next;
        t.next = c;
        t = c;
        p.next = nxt;
        p = nxt;
    }
    return dummy.next;
}
```

<!-- @annotations -->
- 12: `p.next.next` is safe here only because the first pass guaranteed every original is followed by exactly one copy — the invariant this loop silently depends on.

<!-- @code python -->
```python
def copy_random_list(head):
    if head is None:
        return None

    p = head
    while p:
        nxt = p.next
        c = Node(p.data)
        p.next = c
        c.next = nxt
        p = nxt

    p = head
    while p:
        p.next.random = p.random.next if p.random else None
        p = p.next.next

    dummy = Node(0)
    t = dummy
    p = head
    while p:
        c = p.next
        nxt = c.next
        t.next = c
        t = c
        p.next = nxt
        p = nxt
    return dummy.next
```

<!-- @annotations -->
- 15: `p.random.next if p.random else None` — the conditional expression puts the null guard and the lookup on one line without evaluating `p.random.next` when `p.random` is None.
- 26: The original's `next` is restored in the same loop that extracts the clone, so the list is never left half-separated.

<!-- @example -->

<!-- @input -->
```
[0] 7   random -> null
[1] 13  random -> [0]
[2] 11  random -> [4]
[3] 10  random -> [2]
[4] 1   random -> [0]
```

<!-- @output -->
```
a new list 7 -> 13 -> 11 -> 10 -> 1 with the same random shape,
sharing no nodes with the input
```

<!-- @why -->
The standard example. Node 2's `random` points forward to node 4, which is why a single pass cannot wire the randoms — the copy of node 4 does not exist yet.

<!-- @walkthrough -->
```
step 1   weave a copy in after each original

  O0(7) -> C0(7) -> O1(13) -> C1(13) -> O2(11) -> C2(11)
        -> O3(10) -> C3(10) -> O4(1) -> C4(1)

step 2   C_i.random = O_i.random.next

  C0.random = null                          O0.random was null
  C1.random = O1.random.next = C0           O1.random was O0
  C2.random = O2.random.next = C4           O2.random was O4
  C3.random = O3.random.next = C2           O3.random was O2
  C4.random = O4.random.next = C0           O4.random was O0

step 3   unweave, restoring both chains

  original: O0 -> O1 -> O2 -> O3 -> O4      back as it was
  clone   : C0 -> C1 -> C2 -> C3 -> C4

C2 pointing at C4 is the forward reference that made this hard,
and step 2 resolved it without knowing anything about order.
```

<!-- @example -->

<!-- @input -->
```
[0] 1   random -> [1]
[1] 2   random -> [1]
```

<!-- @output -->
```
1 -> 2, with both randoms pointing at the clone's node [1]
```

<!-- @why -->
Two nodes both pointing at the same target, one of them at itself. Shared targets and self-references need no special handling — they fall out of the `->next` rule.

<!-- @walkthrough -->
```
weave:   O0(1) -> C0(1) -> O1(2) -> C1(2)

C0.random = O0.random.next = O1.next = C1
C1.random = O1.random.next = O1.next = C1     points at itself

unweave: original 1 -> 2      clone 1 -> 2

A self-reference is just the case where random->next is the
node's own copy. Nothing in the rule cares.
```

<!-- @example -->

<!-- @input -->
```
[0] 3   random -> null
[1] 3   random -> [0]
[2] 3   random -> null
```

<!-- @output -->
```
3 -> 3 -> 3, with node [1]'s random pointing at the clone's node [0]
```

<!-- @why -->
Every value is identical, which is what breaks a map keyed by value rather than by node identity — and what makes a value-based correctness check useless here.

<!-- @walkthrough -->
```
All three nodes hold 3.

value-keyed map:    copy[3] is one entry, so all three
                    originals collapse onto one copy      WRONG

identity-keyed map: three distinct keys, three copies      correct

value-based check:  compares data along next (3,3,3) and
                    random->data (-, 3, -) -- passes for
                    almost any wrong answer
```

<!-- @example -->

<!-- @input -->
```
(empty list)
```

<!-- @output -->
```
(empty list)
```

<!-- @why -->
Both approaches guard on a null head. The interleaving version needs it before the first pass, since the second pass dereferences `p->next` unconditionally.

<!-- @walkthrough -->
```
head is null

  map version:        the first loop never runs, and copy[head]
                      would INSERT a null entry -- hence the guard
  interleave version: pass 2 does `p->next->random`, which needs
                      every original to be followed by a copy

A single node with random -> itself is the next case worth
trying by hand: weave gives O0 -> C0, and C0.random =
O0.random.next = O0.next = C0.
```

<!-- @visualization custom -->

<!-- @description -->
Shows why the natural correctness check cannot detect a shallow copy, how interleaving replaces the hash lookup with adjacency, and the obligation that creates.

<!-- @sampleInput -->
```json
{"primary":{"nodes":[{"i":0,"data":7,"random":null},{"i":1,"data":13,"random":0},{"i":2,"data":11,"random":4},{"i":3,"data":10,"random":2},{"i":4,"data":1,"random":0}],"hardPart":"node 2's random points FORWARD to node 4, so a single pass cannot wire it - the copy of node 4 does not exist yet","weave":["O0(7)","C0(7)","O1(13)","C1(13)","O2(11)","C2(11)","O3(10)","C3(10)","O4(1)","C4(1)"],"wiring":[{"copy":"C0","rule":"null","because":"O0.random was null"},{"copy":"C1","rule":"O1.random.next = C0","because":"O1.random was O0"},{"copy":"C2","rule":"O2.random.next = C4","because":"O2.random was O4"},{"copy":"C3","rule":"O3.random.next = C2","because":"O3.random was O2"},{"copy":"C4","rule":"O4.random.next = C0","because":"O4.random was O0"}]},"theTestIsTheFirstBug":{"twoRequirements":["values and shape match - node i's random points at position j in the clone exactly when it did in the original","no node of the clone IS, or POINTS AT, a node of the original"],"naturalTest":"walk both lists comparing data, and where random is non-null compare p->random->data with q->random->data","measured":{"lists":50000,"shallowClone":"copies values and next correctly but leaves every random aimed at the ORIGINAL node","passesValueOnlyCheck":50000,"passesValueOnlyPct":100.0,"passesRealDeepCheck":5215,"passesRealDeepPct":10.43,"note":"the 10.43% are exactly the lists where every random happened to be null"},"why":"comparing random->data compares a value that is identical in both lists by construction - it establishes nothing"},"whatTheMapIsFor":{"question":"given an original node, what is its copy?","hashMapAnswer":"build an index - O(1) lookup, O(n) space","interleaveAnswer":"choose a layout where the answer is adjacent to the question - the copy of X is X->next","theLine":"copy->random = original->random->next","generalMove":"when building a map from one structure into a parallel one, ask whether the two can be interleaved so the correspondence becomes positional"},"performance":{"unit":"nanoseconds","rows":[{"n":1000,"hashMap":83667,"interleave":13042,"ratio":"6.42x"},{"n":10000,"hashMap":964625,"interleave":164416,"ratio":"5.87x"},{"n":100000,"hashMap":11087167,"interleave":1600833,"ratio":"6.93x"},{"n":1000000,"hashMap":310090084,"interleave":21676125,"ratio":"14.31x"}],"bothAreLinear":true,"gapWidensWithN":"6.4x at a thousand nodes, 14.3x at a million","why":"the hash map's cost is not the hashing but the cache behaviour - copy[p->random] is a random probe into a table that no longer fits in cache, once per node"},"theObligation":{"whatInterleavingCosts":"it mutates the input","requirement":"the third pass must separate the two chains AND put the original back","measured":{"lists":50000,"cloneWrong":0,"originalCorrupted":42709,"pct":85.42},"reading":"a version that unweaves the clone without restoring the original produces a perfectly correct clone and destroys its argument","thirdTimeInThisTopic":[{"subtopic":"remove-duplicates-from-sorted-dll","checked":"next chain","damaged":"prev chain","pct":64.76},{"subtopic":"flattening-of-ll","checked":"bottom chain","damaged":"next pointers","pct":80.23},{"subtopic":"this one","checked":"the returned clone","damaged":"the input list","pct":85.42}],"pattern":"in each case the thing checked and the thing damaged are different"},"identityNotValue":{"case":[{"i":0,"data":3,"random":null},{"i":1,"data":3,"random":0},{"i":2,"data":3,"random":null}],"valueKeyedMap":"copy[3] is one entry, so all three originals collapse onto one copy - WRONG","identityKeyedMap":"three distinct keys, three copies - correct","languageNotes":{"cpp":"unordered_map<Node*,Node*> keys by pointer","java":"HashMap<Node,Node> uses the default identity hashCode/equals","python":"a dict keyed by node objects hashes by identity unless __hash__ is overridden"}},"assertions":["random may point at any node, at null, or at the node itself","the clone must share no nodes with the original","after interleaving, the copy of X is X->next","the original's next pointers must be restored","a value-based check cannot distinguish a deep copy from a shallow one"]}
```

<!-- @highlights -->
- A clone whose `random` points into the **original** passes a value-based check on **100%** of 50,000 lists; a real deep-copy check passes it on 10.43%.
- The hash map exists to answer one question — *what is the copy of this node?* — and interleaving answers it by adjacency instead.
- `copy->random = original->random->next` is the entire trick.
- Interleaving is **6.4× to 14.31×** faster, and the gap **widens** with n because the map's real cost is cache misses, not hashing.
- Its obligation is restoring the input: skipping that leaves a **perfect clone** and an original corrupted on **85.42%**.
- Third time in this topic that the thing checked and the thing damaged are different — after the DLL `prev` chain (64.76%) and the flattened `next` pointers (80.23%).

<!-- @edgeCases -->
- Empty list — guard before the first pass; the map version would otherwise insert a null key.
- Single node with `random` pointing at itself — weave gives `O0 -> C0`, and `C0.random = O0.next = C0`.
- Every `random` null — the only shape where a shallow copy is accidentally a deep one.
- All values identical — breaks any map keyed by value rather than node identity.
- Two nodes sharing a `random` target — no special handling; both resolve through `->next`.
- `random` pointing backwards — fine for both approaches.
- `random` pointing forwards — why the map version needs two passes.
- A very long list — where the map's cache behaviour costs 14.31×.
- Caller still using the original afterwards — the case the restore pass protects.

<!-- @pitfalls -->
- Assigning `p->random` instead of `copy[p->random]`. Passes a value-based check on 100% of inputs and is not a copy.
- Testing with a value-based comparison. It cannot detect the bug above; resolve each `random` to a position within the clone.
- Interleaving without restoring the original's `next`. Clone perfect, input corrupted on 85.42%.
- Dropping the null test in `p->random ? p->random->next : nullptr`. Roughly half of all random pointers are null.
- Advancing by `p->next` rather than `p->next->next` in the wiring pass. That reads a copy's `random` before it is set.
- Keying the map by value. Three nodes holding 3 collapse onto one copy.
- Wiring `next` and `random` in the same pass as the copying. A forward `random` has no copy yet.
- Using `map[key]` in C++ without a null check. It inserts rather than failing.
- Returning `dummy` instead of `dummy.next`.

<!-- @doubt -->
### How do I actually test that a clone is a deep copy?

<!-- @answer -->
Not the way most people do. The natural test walks both lists comparing `data`, and where `random` is set compares `p->random->data` against `q->random->data` — and that comparison is meaningless, because the two nodes hold the same value by construction whether or not the clone is real. Measured: a clone that copies values and `next` correctly but leaves every `random` pointing at the **original** node passed that check on **all 50,000** random lists tested, 100%. A correct check has two parts. First, resolve each `random` to an *index within its own list* and compare the index sequences — that catches shape errors. Second, assert that no node of the clone is a node of the original and that no clone's `random` points into the original — that catches sharing. Under that check the shallow clone passed on **10.43%**, and those were precisely the lists where every `random` was null, so there was nothing to get wrong.

<!-- @doubt -->
### Why is interleaving faster when both approaches are O(n)?

<!-- @answer -->
Because the constant is a cache miss. Both make a linear number of operations, but the map version performs `copy[p->random]` once per node, and `p->random` is an arbitrary node, so that is a random probe into a hash table. While the table fits in cache the penalty is modest — measured **6.42x** at n = 1,000 — and once it does not, each probe becomes a trip to main memory: at n = 1,000,000 the map takes **310,090,084ns** against interleaving's **21,676,125ns**, a factor of **14.31**. The widening ratio is the signature. Interleaving replaces that probe with `p->random->next`, which is a single dereference from a node the walk already has in hand. It is the same reason an array of structs often beats a struct of hash maps: the fastest lookup is the one whose answer is already adjacent to the question.

<!-- @doubt -->
### What exactly does the third pass have to do?

<!-- @answer -->
Two things, and forgetting the second is the characteristic bug. It must build the clone's `next` chain by threading the copy nodes together, **and** restore each original's `next` to the node that followed it before the weave. Measured over 50,000 random lists, a separation that does the first but not the second produces a clone that is **correct on every input — 0 wrong** — and leaves the **original list corrupted on 42,709 of them, 85.42%**, still threaded through copy nodes that the caller does not know about. Nothing about the returned value reveals it. The reliable way to write the pass is to advance both chains in one loop, assigning `t->next = c` and `p->next = nxt` on each iteration, so the two are never out of step; separating the clone in one loop and repairing the original in a second is where the omission tends to happen.

<!-- @doubt -->
### Why must the map be keyed by node identity rather than value?

<!-- @answer -->
Because values are not unique and nodes are. A list of three nodes all holding 3 has three distinct copies, and a map keyed by the value 3 has one entry — so all three originals resolve to the same copy and the clone collapses. C++ gets this right by default because `unordered_map<Node*, Node*>` keys on the pointer; Java's `HashMap<Node, Node>` uses `Object`'s identity-based `hashCode` and `equals` unless the class overrides them, which is one more reason not to add a value-based `equals` to a node class; Python's `dict` hashes objects by `id` unless `__hash__` is defined. So all three languages are safe as written, and all three become unsafe the moment someone adds "helpful" value semantics to the node type. The interleaving approach sidesteps the question entirely — it never builds a map, so there is no key to get wrong.

<!-- @doubt -->
### Which approach should I actually use?

<!-- @answer -->
Interleaving, unless you are forbidden from touching the input. It is **6.4x to 14.31x** faster, uses O(1) extra space beyond the copied nodes, and the trick itself is the point of the question. The map version is the right answer in exactly one situation: when the original list is shared, const, or being read concurrently, because interleaving mutates it for the duration of the call and a caller holding a pointer into the middle of that list would see copy nodes appear and disappear. That is not a hypothetical concern in real code, and it is the honest argument for the O(n)-space version — not simplicity, since both are about the same length. Worth noting that the map version is also the one that survives being interrupted: if interleaving throws partway through, the input is left woven.
