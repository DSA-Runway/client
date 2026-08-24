---
id: delete-all-occurrences-of-a-key-in-dll
topic: Linked Lists
title: Delete all occurrences of a key in DLL
difficulty: Hard
status: ready
prerequisites:
  - delete-head-of-doubly-linked-list
  - introduction-to-doubly-ll
  - deletion-of-the-head-of-ll
  - insert-node-before-head-in-doubly-linked-list
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - delete-head-of-doubly-linked-list
  - remove-duplicates-from-sorted-dll
  - introduction-to-doubly-ll
  - deletion-of-the-head-of-ll
  - reverse-a-doubly-linked-list
---

<!-- @summary -->
Deleting inside a loop turns the read-before-free rule into something you have to get right on every iteration, and getting it wrong here does not crash — measured over 41,699 lists, `p = p->next` after the free **never** faulted and **never** broke either chain. It deletes exactly **one** occurrence and stops, which makes it correct on **11,934 of 11,934** lists containing a single match and **0 of 29,765** containing more. A test built from single occurrences passes it completely.

<!-- @theory -->
## The operation

Walk the list and remove every node whose value equals the key. Each removal is
the same two writes as **Delete head of Doubly Linked List** — connect the two
neighbours to each other — with the head and tail cases handled when the removed
node sits at an end.

```
key = 2

before:   1 <-> 2 <-> 2 <-> 3 <-> 2 <-> 4
after:    1 <-> 3 <-> 4
```

What makes it harder than the single deletion is that all four boundary cases can
occur repeatedly in one pass: a run of matches at the head keeps moving `head`, a
run at the tail keeps moving `tail`, and a list of nothing but matches must end
with **both** ends null.

## The rule that now applies every iteration

Every previous deletion in this topic needed `next` read before the node was
freed. In a loop that rule has to hold on each pass, and the natural shape of a
loop makes it easy to break:

```cpp
while (p != nullptr) {
    Node* next = p->next;          // saved BEFORE any free
    if (p->data == key) { /* unlink and delete p */ }
    p = next;                      // never reads p again
}
```

Writing `p = p->next` at the bottom instead reads a field of a node that may have
just been freed.

## That bug does not crash, and it is wrong in a very specific way

Reading freed memory is undefined behaviour, so anything is permitted — but what
actually happens on this machine is worth knowing, because it is not what you
would hope. Over **41,699** randomly generated lists that contained the key:

| | |
|---|---|
| Wrong answers | **29,765** — 71.4% |
| Crashes | **0** |
| Wrong results still containing the key | 29,765 — all of them |
| Wrong results where forward and backward agree | 29,765 — all of them |
| Cases where it deleted **exactly one** match | **41,699 — all of them** |

It never faulted and never left the two chains disagreeing. It returns a
perfectly well-formed doubly linked list that simply still contains the key.
Split by how many matches the list held:

| Matches in the list | Correct |
|---|---|
| Exactly one | **11,934 of 11,934** |
| Two or more | **0 of 29,765** |

So the behaviour is not "sometimes wrong". It **deletes one occurrence and
stops**, which is correct precisely when there was only one to delete. Any test
suite built from lists containing a single occurrence of the key passes it
completely.

Two cautions about that measurement. It is allocator-dependent — "exactly one"
is what this allocator did, not a guarantee, and a different build could crash or
do something else entirely. And it was found by **observing behaviour**, not by a
sanitiser: UndefinedBehaviorSanitizer does not detect use-after-free, and
AddressSanitizer hangs in this environment.

## The cost

Two pointer writes per deletion, and nothing else:

| n | Matches | Writes |
|---|---|---|
| 1,000 | 0 | 0 |
| 1,000 | 1 | 2 |
| 1,000 | 500 | 1,000 |
| 1,000 | 1,000 | 2,000 |

Exactly `2k` for `k` deletions, independent of where the matching nodes sit —
which is the property **Introduction to Doubly LL** measured as the whole reason
for the second pointer.

## Rebuilding instead of unlinking

The alternative is to walk once and thread the survivors onto a fresh pair of
handles, freeing the rest. It touches the same nodes and does the same amount of
work, and the measurements say so:

| | C++, n = 500,000 | Python, n = 200,000 |
|---|---|---|
| Unlink in place | **4,413us** | **13,666us** |
| Rebuild from survivors | 4,400us | 17,039us |

Indistinguishable in C++ — the two traded places across runs — and about 1.25x
slower in Python. The real difference is in the code rather than the clock: the
rebuild has no head-or-tail branch on the delete path, because it never patches
neighbours, it only appends survivors. It pays for that by rebuilding the `prev`
chain for every node it keeps, including the ones it did not need to touch.

## The sentinel earns its keep here

**Delete head of Doubly Linked List** measured a circular sentinel removing the
empty-list branch at no cost. This operation hits both boundaries repeatedly —
runs of matches at the head, at the tail, and lists that empty entirely — and
with a sentinel none of those are special:

```cpp
if (p->data == key) {
    p->prev->next = p->next;
    p->next->prev = p->prev;
    delete p;
}
```

No null checks, no head or tail updates, and no case where the list becoming
empty needs detecting — the sentinel is always there to be pointed at. Verified
on the same 40,000 random lists as the other two.

<!-- @intuition -->
Every individual deletion here is the one from the previous subtopic, so the new difficulty is entirely structural: the deletions happen in a loop, which means the discipline of reading the way forward before destroying the node has to hold on every single iteration rather than once. The natural way to write a loop — advance at the bottom — is exactly the way that breaks it, which is why this particular mistake is so common. What is worth internalising is the shape of its failure. It does not crash, it does not corrupt either chain, and it returns something that passes every structural check you might think to write; it simply stops deleting after the first match. The only way to catch it is to test with more than one occurrence of the key, which is a small enough observation to sound trivial and is precisely what the measured 11,934-out-of-11,934 against 0-out-of-29,765 says. The second thing this problem rewards is the sentinel. Deleting one node has one boundary case; deleting every match has all of them, repeatedly, in a single pass — and a circular sentinel makes the whole category disappear rather than making each case shorter.

<!-- @approach -->
### Optimal - Unlink in Place

<!-- @idea -->
Walk once, and for each matching node connect its two neighbours to each other before freeing it — saving the way forward first.

<!-- @steps -->
1. Start at the head.
2. Save the current node's `next` **before** anything else, because the node may not survive this iteration.
3. If the node matches the key, point its predecessor past it — or move the head, if it has none.
4. Point its successor back past it — or move the tail, if it has none.
5. Free the node.
6. Continue from the saved pointer, never from the node just freed.

<!-- @complexity -->
- time: O(n) — one pass, with two pointer writes per deletion
- space: **O(1)** — one saved pointer
- note: The one to write, and step 2 is the whole difficulty. Advancing with `p = p->next` at the bottom of the loop instead reads a freed node — which, measured over 41,699 lists, never crashed and deleted **exactly one** occurrence every time, making it correct on all single-match lists and none with two or more. Steps 3 and 4 each have a branch, and both fire repeatedly when matches run along either end.

<!-- @code cpp -->
```cpp
void deleteAllOccurrences(List& list, int key) {
    Node* p = list.head;
    while (p != nullptr) {
        Node* next = p->next;
        if (p->data == key) {
            if (p->prev != nullptr) p->prev->next = p->next;
            else                    list.head = p->next;

            if (p->next != nullptr) p->next->prev = p->prev;
            else                    list.tail = p->prev;

            delete p;
        }
        p = next;
    }
}
```

<!-- @annotations -->
- 4: Saved before the node can be freed. Replacing line 14 with `p = p->next` instead reads a freed node — and measured, that never crashed and silently deleted exactly one match.
- 14: Continuing from the **saved** pointer. This line and line 4 are the same rule stated twice, and both must be present.
- 7: The head branch, which fires on every node of a run of matches at the front — not just once.
- 10: The tail branch, and the one that leaves `tail` null when the list empties entirely.

<!-- @code java -->
```java
static void deleteAllOccurrences(List list, int key) {
    Node p = list.head;
    while (p != null) {
        Node next = p.next;
        if (p.data == key) {
            if (p.prev != null) p.prev.next = p.next;
            else                list.head = p.next;

            if (p.next != null) p.next.prev = p.prev;
            else                list.tail = p.prev;

            p.prev = null;
            p.next = null;
        }
        p = next;
    }
}
```

<!-- @annotations -->
- 12: Detaching the removed node's own links. There is no dangling-pointer hazard here, but leaving them set keeps its former neighbours reachable from it.

<!-- @code python -->
```python
def delete_all_occurrences(lst, key):
    p = lst.head
    while p is not None:
        nxt = p.next
        if p.data == key:
            if p.prev is not None:
                p.prev.next = p.next
            else:
                lst.head = p.next

            if p.next is not None:
                p.next.prev = p.prev
            else:
                lst.tail = p.prev

            p.prev = None
            p.next = None
        p = nxt


# `nxt` is saved on line 4 and used on the last line. Advancing with
# `p = p.next` instead works in Python -- but it still stops after
# the first match, because the detached node's next is now None.
```

<!-- @annotations -->
- 4: Saved before the node is detached. Python has no use-after-free, but line 17 sets `p.next` to `None`, so advancing from `p` afterwards would end the loop just as abruptly.

<!-- @approach -->
### Rebuild from the Survivors

<!-- @idea -->
Walk once, appending every non-matching node to a fresh pair of handles and freeing the rest.

<!-- @steps -->
1. Start with an empty output list — both handles null.
2. Walk the input, saving each node's `next` before touching it.
3. If the node matches the key, free it.
4. Otherwise append it to the output: set its `prev` to the output tail, its `next` to null, and link the previous tail to it.
5. When the walk ends, replace the caller's handles with the output's.

<!-- @complexity -->
- time: O(n) — one pass, appending or freeing each node
- space: **O(1)** — two extra handles
- note: Measured **indistinguishable** from unlinking in C++ — 4,400us against 4,413us at half a million nodes, trading places across runs — and about **1.25x slower** in Python. Its appeal is structural rather than numeric: there is no head-or-tail branch on the delete path at all, because nothing is patched, only appended. It pays for that by writing `prev` and `next` for every node it **keeps**, including ones that needed no attention.

<!-- @code cpp -->
```cpp
void deleteAllRebuild(List& list, int key) {
    List out;
    Node* p = list.head;
    while (p != nullptr) {
        Node* next = p->next;
        if (p->data == key) {
            delete p;
        } else {
            p->prev = out.tail;
            p->next = nullptr;
            if (out.tail != nullptr) out.tail->next = p;
            else                     out.head = p;
            out.tail = p;
        }
        p = next;
    }
    list = out;
}
```

<!-- @annotations -->
- 9: Rewiring every survivor, which is the cost of this approach — the unlinking version leaves untouched nodes completely alone.
- 12: The only branch in the function, and it is about building rather than deleting: is this the first survivor?
- 17: Replacing both handles at once. An emptied list gets two nulls for free, since `out` started that way.

<!-- @code java -->
```java
static void deleteAllRebuild(List list, int key) {
    Node outHead = null, outTail = null;
    Node p = list.head;
    while (p != null) {
        Node next = p.next;
        if (p.data == key) {
            p.prev = null;
            p.next = null;
        } else {
            p.prev = outTail;
            p.next = null;
            if (outTail != null) outTail.next = p;
            else                 outHead = p;
            outTail = p;
        }
        p = next;
    }
    list.head = outHead;
    list.tail = outTail;
}
```

<!-- @annotations -->
- 7: Detaching the discarded node so it does not keep the rest of the list reachable through its old links.

<!-- @code python -->
```python
def delete_all_rebuild(lst, key):
    out_head = out_tail = None
    p = lst.head
    while p is not None:
        nxt = p.next
        if p.data == key:
            p.prev = None
            p.next = None
        else:
            p.prev = out_tail
            p.next = None
            if out_tail is not None:
                out_tail.next = p
            else:
                out_head = p
            out_tail = p
        p = nxt
    lst.head, lst.tail = out_head, out_tail
```

<!-- @annotations -->
- 18: Both handles assigned together, so a list that lost every node ends with both `None` without a special case.

<!-- @approach -->
### Circular Sentinel

<!-- @idea -->
With a permanent sentinel node that is always present, every deletion is two unconditional writes — no ends, no null checks, no emptying case.

<!-- @steps -->
1. Start at the node after the sentinel.
2. Save the current node's `next` before anything else.
3. If it matches the key, point its predecessor and successor at each other and free it.
4. Continue from the saved pointer.
5. Stop on reaching the sentinel again.

<!-- @complexity -->
- time: O(n) — one pass, two pointer writes per deletion
- space: O(1), plus one permanent node for the whole list
- note: The version where this operation is genuinely simple. **Delete head of Doubly Linked List** measured a circular sentinel removing that operation's single branch at no cost; here it removes **four** — the head case, the tail case, and both of them again for every node in a run — because `p->prev` and `p->next` are never null. Verified on the same 40,000 random lists.

<!-- @code cpp -->
```cpp
void circularDeleteAll(Node* sentinel, int key) {
    Node* p = sentinel->next;
    while (p != sentinel) {
        Node* next = p->next;
        if (p->data == key) {
            p->prev->next = p->next;
            p->next->prev = p->prev;
            delete p;
        }
        p = next;
    }
}
```

<!-- @annotations -->
- 6: No null check, and none possible to need — every node has a real predecessor and successor, which on the ends is the sentinel itself.
- 3: The stop condition is reaching the sentinel, not reaching null. A circular list has no nulls to test.
- 4: The saved pointer is still required. The sentinel removes the boundary cases, not the read-before-free rule.

<!-- @code java -->
```java
static void circularDeleteAll(Node sentinel, int key) {
    Node p = sentinel.next;
    while (p != sentinel) {
        Node next = p.next;
        if (p.data == key) {
            p.prev.next = p.next;
            p.next.prev = p.prev;
            p.prev = null;
            p.next = null;
        }
        p = next;
    }
}
```

<!-- @annotations -->
- 3: Reference comparison against the sentinel, which is how a circular list recognises its own end.

<!-- @code python -->
```python
def circular_delete_all(sentinel, key):
    p = sentinel.next
    while p is not sentinel:
        nxt = p.next
        if p.data == key:
            p.prev.next = p.next
            p.next.prev = p.prev
            p.prev = None
            p.next = None
        p = nxt


# Two unconditional writes per deletion. The head case, the tail
# case and the emptying case all stop existing, because there is
# always a real node on either side.
```

<!-- @annotations -->
- 4: Still saved before the node is detached — line 8 sets `p.next` to `None`, so advancing from `p` afterwards would end the loop early.

<!-- @example -->

<!-- @input -->
`1 <-> 2 <-> 2 <-> 3 <-> 2 <-> 4`, key 2

<!-- @output -->
`1 <-> 3 <-> 4`

<!-- @why -->
Shows the consecutive-match case, which is where the loop's discipline is tested.

<!-- @walkthrough -->
1. Node 1 does not match, so the walk saves its `next` and moves on.
2. The first 2 matches: node 1's `next` is pointed at the second 2, and the second 2's `prev` back at node 1.
3. The node is freed — and the walk continues from the pointer saved *before* the unlink, not from the freed node.
4. The second 2 matches immediately, so the same two writes happen again, this time joining node 1 to node 3.
5. Node 3 does not match; the third 2 does and is removed the same way, joining node 3 to node 4.
6. The result reads `1 3 4` forwards and `4 3 1` backwards, so both chains agree.
7. Six nodes, three deletions, six pointer writes — two per removal, wherever the node sat.

<!-- @example -->

<!-- @input -->
The same loop advancing with `p = p->next` after the free

<!-- @output -->
No crash, both chains intact, and exactly one 2 removed

<!-- @why -->
Characterises a use-after-free that behaves far more quietly than the term suggests.

<!-- @walkthrough -->
1. Reading a field of a freed node is undefined behaviour, so any outcome is permitted.
2. Measured across **41,699** random lists containing the key: **zero** crashes.
3. In every case where the answer was wrong, the forward and backward chains still agreed with each other.
4. And in every one of the 41,699 runs it deleted **exactly one** match.
5. So it was correct on **11,934 of 11,934** lists holding a single occurrence, and **0 of 29,765** holding two or more.
6. A suite of tests each containing one occurrence of the key therefore passes it completely.
7. This was found by observing behaviour rather than by tooling — UBSan does not detect use-after-free, and AddressSanitizer hangs in this environment.

<!-- @example -->

<!-- @input -->
A list whose every node matches the key

<!-- @output -->
An empty list, with **both** handles null

<!-- @why -->
The boundary that a single-deletion routine meets once and this one meets on its last iteration.

<!-- @walkthrough -->
1. Every node takes both the head branch and the tail branch at some point during the pass.
2. The first deletion moves `head` forward, because the removed node has no predecessor.
3. Each subsequent deletion does the same, since the new head immediately matches too.
4. The final deletion removes a node with neither predecessor nor successor.
5. That takes the `else` on both branches: `head` becomes its `next`, which is null, and `tail` becomes its `prev`, which is also null.
6. So the list ends correctly empty rather than with one stale handle — the failure **Delete head of Doubly Linked List** measured when its tail branch was omitted.
7. Verified across 40,000 random lists, asserting specifically that an emptied list has both ends null.

<!-- @example -->

<!-- @input -->
Unlinking in place against rebuilding from the survivors

<!-- @output -->
Identical in C++, and about 1.25x apart in Python

<!-- @why -->
Two approaches with genuinely different shapes and almost no measurable difference in one language.

<!-- @walkthrough -->
1. Unlinking patches each removed node's neighbours and leaves every other node untouched.
2. Rebuilding never patches anything — it appends survivors to fresh handles and frees the rest.
3. At half a million nodes in C++ they measured 4,413us and 4,400us, trading places across runs.
4. In Python the rebuild was slower: 17,039us against 13,666us, about **1.25x**.
5. The rebuild's cost is that it writes `prev` and `next` for every node it **keeps**, including ones needing no attention.
6. Its benefit is that the delete path has no head-or-tail branch at all, because nothing is being patched.
7. So the choice here is about which code you would rather read, not which runs faster.

<!-- @visualization linked-list -->

<!-- @description -->
Keep the two chains drawn separately — `next` above the nodes, `prev` below — and run the walk on `1 2 2 3 2 4` with the key 2 highlighted wherever it appears. The critical thing to animate is the **saved pointer**: before each iteration's work, draw a small marker dropping onto the node ahead and staying there, visibly detached from the node being examined, so the reader sees that the walk's next step is already secured before anything is destroyed. Then the deletion itself as two arcs redrawn — the predecessor's forward arrow and the successor's backward arrow both reaching over the doomed node — and only then the node greying out and falling away, with the saved marker still sitting where it was. Run the two consecutive 2s so the reader watches the same predecessor get rewired twice in a row. The centre panel is the bug, and it should be shown as a near-miss rather than an explosion: omit the saved marker, delete the first 2, and then draw the walk trying to read `next` **from inside the greyed-out node**. Nothing dramatic happens — no crash, no red — the pointer simply comes back as something that ends the loop, and the animation stops with two 2s still sitting in the list. Print the result beside the correct one, both well-formed, both internally consistent, one wrong. Put the numbers under it: 0 crashes, correct on 11,934 of 11,934 single-match lists and 0 of 29,765 with more. The last panel contrasts the three approaches on a list that is entirely matches: the in-place version shown taking both the head and tail branches on every step, the rebuild shown never branching but rewiring each survivor, and the sentinel version shown as two unconditional arcs with the sentinel always present at both ends so no case is ever special.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"operation":{"task":"remove every node whose value equals the key","perDeletion":"the same two writes as Delete head of Doubly Linked List -- connect the two neighbours to each other","whatMakesItHarder":"all four boundary cases can occur REPEATEDLY in one pass -- a run of matches at the head keeps moving head, a run at the tail keeps moving tail, and a list of nothing but matches must end with BOTH ends null"},"theRuleNowAppliesEveryIteration":{"rule":"read `next` before the node is freed","correctShape":"Node* next = p->next; ... ; p = next;","theMistake":"advancing with `p = p->next` at the bottom of the loop, which reads a field of a node that may have just been freed"},"theBugCharacterised":{"lists":41699,"note":"randomly generated lists that contained the key","wrongAnswers":29765,"wrongRate":"71.4%","crashes":0,"wrongResultsStillContainingTheKey":29765,"wrongResultsWhereChainsAgree":29765,"casesWhereItDeletedExactlyOneMatch":41699,"splitByMatchCount":[{"matches":"exactly one","correct":"11,934 of 11,934"},{"matches":"two or more","correct":"0 of 29,765"}],"conclusion":"it deletes ONE occurrence and stops, which is correct precisely when there was only one to delete","consequence":"any test suite built from lists containing a single occurrence passes it completely","cautions":["allocator-dependent -- 'exactly one' is what this allocator did, not a guarantee","found by observing behaviour, not tooling: UBSan does not detect use-after-free and AddressSanitizer hangs in this environment"]},"cost":{"writesPerDeletion":2,"measured":[{"n":1000,"matches":0,"writes":0},{"n":1000,"matches":1,"writes":2},{"n":1000,"matches":500,"writes":1000},{"n":1000,"matches":1000,"writes":2000}],"independentOfPosition":"which is the property Introduction to Doubly LL measured as the whole reason for the second pointer"},"correctness":{"approaches":["unlink in place","rebuild from survivors","circular sentinel"],"randomLists":40000,"checked":["forward chain","backward chain","both ends null when emptied"],"failures":0,"python":{"approaches":2,"randomLists":40000,"failures":0}},"bench":{"cpp":{"n":500000,"unlinkInPlace":4413,"rebuild":4400,"verdict":"indistinguishable -- the two traded places across runs"},"python":{"n":200000,"unlinkInPlace":13666,"rebuild":17039,"verdict":"about 1.25x slower"},"theRealDifference":"in the code rather than the clock -- the rebuild has NO head-or-tail branch on the delete path because it never patches neighbours, but pays by rewiring every node it keeps"},"theSentinel":{"whatItRemoves":"the head case, the tail case, and both again for every node in a run -- because p->prev and p->next are never null","deleteBody":"p->prev->next = p->next; p->next->prev = p->prev; delete p;","comparedToDeleteHead":"that subtopic measured a circular sentinel removing its SINGLE branch at no cost; here it removes four","stillRequired":"the saved pointer -- the sentinel removes the boundary cases, not the read-before-free rule","verified":"the same 40,000 random lists"},"recommendation":"unlink in place, saving `next` first -- or a circular sentinel if you are writing a whole DLL library, where this operation is where it pays off most","lesson":"the mistake does not crash and does not corrupt anything; it stops deleting after the first match, and only a test with two occurrences can see that"}
```

<!-- @highlights -->
- The two chains stay drawn separately — `next` above the nodes, `prev` below — with the key highlighted wherever it appears in `1 2 2 3 2 4`.
- The **saved pointer** is the thing animated most carefully: a marker drops onto the node ahead before each iteration's work and stays there.
- It is visibly detached from the node being examined, so the next step is seen to be secured before anything is destroyed.
- The deletion then draws two arcs — the predecessor's forward arrow and the successor's backward arrow — reaching over the doomed node.
- Only then does the node grey out and fall away, with the saved marker still sitting where it was.
- The two consecutive 2s run in sequence, so the same predecessor is watched being rewired twice.
- The centre panel shows the bug as a near-miss rather than an explosion.
- The saved marker is omitted, the first 2 is deleted, and the walk reads `next` from **inside the greyed-out node**.
- Nothing dramatic follows — no crash, no red — the pointer simply comes back as something that ends the loop.
- The animation stops with two 2s still in the list.
- Both results print side by side, well-formed and internally consistent, one of them wrong.
- The numbers sit beneath: 0 crashes, correct on 11,934 of 11,934 single-match lists and 0 of 29,765 with more.
- The last panel runs all three approaches on a list that is entirely matches.
- The in-place version is shown taking both the head and tail branches on every step.
- The rebuild is shown never branching but rewiring each survivor.
- The sentinel version is shown as two unconditional arcs, with the sentinel present at both ends so no case is ever special.

<!-- @edgeCases -->
- No node matches — the walk touches every node and writes nothing.
- Every node matches — the list empties, and both handles must end null.
- A run of matches at the head — the head branch fires once per node in the run, not once overall.
- A run of matches at the tail — the same for the tail branch.
- A single node that matches — takes the `else` on both branches, leaving both handles null.
- Two adjacent matches — the shortest case where the same predecessor is rewired twice.
- The empty list — the loop never runs and nothing is touched.
- Matches at both ends with survivors between them — exercises both branches in one pass.
- The saved `next` pointer — must be read before the node is freed, on every iteration rather than once.
- A list where the key appears exactly once — the only shape where the use-after-free version happens to be correct.
- Under a circular sentinel — none of the above are special cases, since no pointer in the structure is ever null.

<!-- @pitfalls -->
- Advancing with `p = p->next` after freeing the node. It does not crash — it deletes exactly one match and stops, correct on 11,934 of 11,934 single-match lists and 0 of 29,765 with more.
- Testing only with a single occurrence of the key. That is precisely the shape the bug above gets right.
- Assuming a use-after-free will announce itself. Zero crashes across 41,699 lists, with both chains left agreeing.
- Relying on UBSan to catch it. UndefinedBehaviorSanitizer does not detect use-after-free; that is AddressSanitizer's job.
- Handling the head case once instead of per node. A run of matches at the front moves `head` repeatedly.
- Forgetting the tail branch. A list that empties entirely leaves `tail` pointing at a freed node.
- Checking only the forward chain afterwards. The backward chain is where a missed `prev` update shows.
- Rebuilding from survivors without clearing the discarded nodes' links. They keep their former neighbours reachable.
- Expecting the rebuild to be slower because it writes more. It measured identical in C++ and 1.25x slower only in Python.
- Assuming a sentinel removes the read-before-free requirement. It removes the boundary cases; the saved pointer is still needed.
- Traversing a circular sentinel list until null. There are none — stop on reaching the sentinel.

<!-- @doubt -->
### Why can't I just write `p = p->next` at the end of the loop?

<!-- @answer -->
Because on any iteration that deleted a node, `p` points at freed memory. Reading a field of it is undefined behaviour — but the reason this particular mistake is worth measuring rather than merely condemning is that the observed behaviour is so mild. Across **41,699** randomly generated lists containing the key it produced **zero crashes** and never left the forward and backward chains disagreeing. What it did do, in **all 41,699** runs, was delete **exactly one** occurrence and stop. That made it correct on **11,934 of 11,934** lists holding a single match and **0 of 29,765** holding two or more. The fix is one line — save `p->next` into a local before the unlink and advance from that — and the same rule appears in **Deletion of the head of LL** and **Delete head of Doubly Linked List**. The difference here is that a loop makes you obey it on every pass.

<!-- @doubt -->
### How do I test for that bug?

<!-- @answer -->
Use a list containing the key **more than once**, and that is genuinely the whole requirement. The measured split is unambiguous: the buggy version was correct on every single one of 11,934 lists containing exactly one occurrence, and on none of the 29,765 containing two or more. So a suite of a dozen hand-written cases each removing one value passes it completely, and a single case with two occurrences fails it immediately. Worth adding alongside: a list of nothing but matches, which must come back empty with **both** handles null, and a run of matches at the head and at the tail, which exercise the two branches repeatedly rather than once. Do not expect tooling to help — UBSan does not detect use-after-free, and AddressSanitizer, which does, hangs in this environment.

<!-- @doubt -->
### Is rebuilding from the survivors better than unlinking?

<!-- @answer -->
Not measurably faster, and arguably easier to get right. In C++ at half a million nodes the two came out at **4,400us and 4,413us**, trading places across runs — indistinguishable. In Python the rebuild was about **1.25x slower**, at 17,039us against 13,666us. The interesting difference is structural. The rebuild never patches a neighbour, so its delete path has **no head-or-tail branch at all** — it either appends the node to the output or frees it. That removes the two branches where the unlinking version's mistakes live. It pays for that by writing `prev` and `next` for every node it **keeps**, including ones that needed no attention, which is why it does more work for the same result. Choose on which code you would rather read, and know that neither choice buys you speed.

<!-- @doubt -->
### Does the sentinel help more here than for a single deletion?

<!-- @answer -->
Considerably more, and this is the operation that makes the case for it. **Delete head of Doubly Linked List** measured a circular sentinel removing that operation's **one** branch at no extra cost. This operation has all four boundary cases and hits them **repeatedly** in a single pass: a run of matches at the head moves `head` once per node, a run at the tail does the same for `tail`, and a list of nothing but matches ends by needing both handles nulled. With a sentinel, none of that exists — `p->prev` and `p->next` are never null, so the deletion body is two unconditional writes with no tests and no handle updates at all. Verified across the same 40,000 random lists as the other two approaches. One thing it does **not** remove: the saved pointer. The sentinel eliminates the boundary cases, not the requirement to read the way forward before freeing the node.

<!-- @doubt -->
### What has to be true after a list loses every node?

<!-- @answer -->
Both handles must be null, and that falls out of the last deletion taking the `else` on **both** branches. The final matching node has no predecessor and no successor, so `head` is set to its `next` — null — and `tail` to its `prev`, also null. Getting only one of those right leaves the failure **Delete head of Doubly Linked List** measured: a list that reads empty going forward and non-empty going backward, with a handle pointing at freed memory. It is worth asserting explicitly in tests rather than inferring it from the forward walk, because the forward walk cannot see it. The verification behind this container checked exactly that across 40,000 random lists — forward chain, backward chain, and specifically that an emptied list has both ends null — alongside runs of matches at the head and tail, which are the cases that reach the branches more than once.
