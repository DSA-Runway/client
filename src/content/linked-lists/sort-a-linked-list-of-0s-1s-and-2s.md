---
id: sort-a-linked-list-of-0s-1s-and-2s
topic: Linked Lists
title: Sort a Linked List of 0's 1's and 2's
difficulty: Medium
status: ready
prerequisites:
  - segregate-odd-and-even-nodes-in-linked-list
  - introduction-to-singly-linkedlist
  - find-the-length-of-the-linked-list
  - sort-an-array-of-0s-1s-and-2s
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - segregate-odd-and-even-nodes-in-linked-list
  - sort-ll
  - sort-an-array-of-0s-1s-and-2s
  - reverse-a-linkedlist-iterative
  - check-if-ll-is-palindrome-or-not
---

<!-- @summary -->
Three dummy-headed chains and a two-line join — where the join needs **no special case for empty chains**, because an empty chain's tail still aliases its own dummy, verified on all **29,524** lists of 0/1/2 up to length 9. The familiar missing-terminator bug returns with a sharper trigger than in **Segregate odd and even**: it cycles **exactly when the list contains a 2 and does not end with one**. And after two subtopics where pointer counts mispredicted the clock, here they finally agree in C++ — then disagree again in Python.

<!-- @theory -->
## The problem

Every value is 0, 1 or 2. Put them in order.

```
2 -> 0 -> 1 -> 2 -> 0 -> 1     ->     0 -> 0 -> 1 -> 1 -> 2 -> 2
```

The array version of this is Dutch National Flag, which sorts in place by
swapping from both ends at once. That does not transfer: a singly linked list
has no backwards pointer, so the two-ended sweep has nothing to sweep with. What
replaces it is the technique from **Segregate odd and even nodes** — build
separate chains and join them — with the grouping key changed from position to
value.

## Three chains and a join

Walk once, appending each node to the chain for its value, then link the three
chains together.

```cpp
Node* sortZeroOneTwo(Node* head) {
    Node d0(0), d1(0), d2(0);
    Node* t0 = &d0;
    Node* t1 = &d1;
    Node* t2 = &d2;

    for (Node* p = head; p != nullptr; p = p->next) {
        if (p->data == 0)      { t0->next = p; t0 = p; }
        else if (p->data == 1) { t1->next = p; t1 = p; }
        else                   { t2->next = p; t2 = p; }
    }

    t2->next = nullptr;
    t1->next = d2.next;
    t0->next = d1.next;
    return d0.next;
}
```

Checked against a sorted reference on 3,000 random lists with zero
disagreements, and the join specifically on **every** list of 0s, 1s and 2s up
to length 9 — 29,524 of them.

## The join has no special cases, and that is not luck

The obvious worry is what happens when a value is missing entirely. If there are
no 1s, does `t0->next = d1.next` throw away the 2s? If there are no 0s, does
`return d0.next` return null?

Neither, and the reason is worth seeing. When a chain receives no nodes, its
tail pointer never moves — it is still pointing at that chain's **dummy**. So
with no 1s, `t1` is still `&d1`, and `t1->next = d2.next` writes the 2s head
into `d1.next`. The next line, `t0->next = d1.next`, therefore picks up the 2s
and the gap closes itself. The same aliasing makes `return d0.next` correct when
there are no 0s: `t0` is still `&d0`, so the previous line already wrote the
right head into it.

The joins have to run in that order — 2s into 1s, then 1s into 0s — so that each
one sees the result of the one before. Written that way, all eight possible
combinations of present and absent values fall out with no branching. Verified
exhaustively on all 29,524 lists.

An earlier version of this container wrote the join defensively, with a ternary
at each step to skip empty chains. Those ternaries are unnecessary, and the
simpler code is the one that was verified.

## The terminator, and exactly when it bites

`t2->next = nullptr` is mandatory, for the same reason it was in **Segregate odd
and even nodes**: the last node of the 2s chain is usually not the last node of
the original list, so it still points forward at something now behind it.

The trigger here is sharper than the parity rule that governed the segregate
version. Over every list up to length 9:

| Original list | Cycled | Fine |
|---|---|---|
| Ends in 2 | **0** | 9,841 |
| Ends in 0 or 1 | **18,660** | 1,022 |

Ending in 2 is always safe — the 2s tail *is* the list's tail, already null. The
1,022 survivors among the rest are exactly the lists containing **no 2s at all**,
where the 2s chain is empty and there is nothing to terminate. Counting them
confirms it: lists over `{0,1}` of length 1 to 9 number `2 + 4 + … + 512 = 1,022`.

So the rule is exact: **the missing terminator creates a cycle if and only if the
list contains a 2 and does not end with one.**

## Moving nodes versus rewriting values

The other standard solution counts how many of each value there are and then
overwrites the list. It produces the same sequence and is a different operation
— the same distinction **Reverse a LinkedList** and **Segregate odd and even**
both measured:

| | Relinking | Counting |
|---|---|---|
| What moves | the **nodes** | the **values** |
| Node addresses afterwards | reordered, same set | unchanged, in place |
| Measured over 3,000 lists | 3,000 / 3,000 | 3,000 / 3,000 |

If anything outside holds a pointer into the list, relinking moves that node and
leaves its data intact, while counting leaves the node where it is and changes
what it holds.

## For once, the pointer count predicts the clock

Relinking makes a single pass; counting makes two — one to tally, one to write:

| n | Relinking | Counting |
|---|---|---|
| 1,000 | **1,000** | 2,000 |
| 100,000 | **100,000** | 200,000 |
| 1,000,000 | **1,000,000** | 2,000,000 |

And in C++ the timings agree with that for the first time in three subtopics:

| n | Relinking | Counting |
|---|---|---|
| 1,000 | **1.08us** | 2.00us |
| 1,000,000 | **1,310–2,972us** | 2,370–5,270us |

Counting is about **1.8x** slower across runs. The difference from the previous
two subtopics is what the extra reads are: there the loser re-read pointers
*within* one traversal, which cost nothing; here it makes a genuine second
traversal, which costs a traversal.

Python disagrees, as it has throughout this topic:

| n | Relinking | Counting |
|---|---|---|
| 1,000 | 52.94us | **39.29us** |
| 200,000 | 10,845us | **10,721us** |

Counting is **faster** at a thousand nodes and level at two hundred thousand,
despite doing twice the pointer reads — because the relinking loop carries a
three-way branch and two assignments per node, and CPython charges per bytecode.

<!-- @intuition -->
This is the value-based twin of **Segregate odd and even nodes**, and recognising that is most of the work: the same three moves — walk once, append each node to the chain it belongs in, stitch the chains together — with the only change being that the test looks at the data rather than a counter. Dutch National Flag, the answer everyone reaches for from the array version, is the thing that genuinely does not carry over, because it depends on closing in from both ends and a singly linked list has no other end to close in from. The part worth slowing down for is the join. It looks like it needs care for missing values and it does not, because an empty chain's tail is still its own dummy and so the links thread straight through — which is a small, precise piece of reasoning that replaces three defensive branches, and the kind of thing worth verifying exhaustively rather than arguing about. The rest is the theme this topic keeps returning to: whether you are moving nodes or moving values is a real distinction even when the printed output is identical, and it only stops being invisible when something outside is holding a pointer.

<!-- @approach -->
### Optimal - Three Chains, Then Join

<!-- @idea -->
Walk once, appending every node to the chain for its value, then link the three chains end to end.

<!-- @steps -->
1. Create three dummy heads, one per value, each with a tail pointer starting on its own dummy.
2. Walk the list, appending each node to the chain matching its data.
3. Terminate the 2s chain by setting its tail's `next` to null.
4. Join the 2s chain onto the end of the 1s chain.
5. Join the 1s chain onto the end of the 0s chain — in that order, so this line sees the previous one's result.
6. Return the 0s dummy's `next`.

<!-- @complexity -->
- time: O(n) — a single traversal, one dereference per node
- space: **O(1)** — three dummy nodes and three tail pointers
- note: The one to write. It moves **nodes**, so anything holding a pointer into the list keeps its data and changes position. Steps 4 and 5 need no empty-chain guards — an unused chain's tail still aliases its dummy, so the links thread through, verified on all 29,524 lists up to length 9. Step 3 is not optional: without it the result cycles whenever the list contains a 2 and does not end with one.

<!-- @code cpp -->
```cpp
Node* sortZeroOneTwo(Node* head) {
    Node d0(0), d1(0), d2(0);
    Node* t0 = &d0;
    Node* t1 = &d1;
    Node* t2 = &d2;

    for (Node* p = head; p != nullptr; p = p->next) {
        if (p->data == 0)      { t0->next = p; t0 = p; }
        else if (p->data == 1) { t1->next = p; t1 = p; }
        else                   { t2->next = p; t2 = p; }
    }

    t2->next = nullptr;
    t1->next = d2.next;
    t0->next = d1.next;
    return d0.next;
}
```

<!-- @annotations -->
- 13: Mandatory. Without it the result cycles exactly when the list contains a 2 and does not end with one — 18,660 of the lists tested up to length 9.
- 14: Must come before line 15, so that line 15 sees the 2s already attached. Reversing the two loses the 2s whenever there are no 1s.
- 15: No guard for an empty 1s chain is needed. If no node had value 1 then `t1` is still `&d1`, so line 14 wrote the 2s head into `d1.next` and this line picks it up.
- 16: Correct even with no 0s at all, by the same aliasing — `t0` would still be `&d0`, so line 15 wrote the right head into it.

<!-- @code java -->
```java
static Node sortZeroOneTwo(Node head) {
    Node d0 = new Node(0), d1 = new Node(0), d2 = new Node(0);
    Node t0 = d0, t1 = d1, t2 = d2;

    for (Node p = head; p != null; p = p.next) {
        if (p.data == 0)      { t0.next = p; t0 = p; }
        else if (p.data == 1) { t1.next = p; t1 = p; }
        else                  { t2.next = p; t2 = p; }
    }

    t2.next = null;
    t1.next = d2.next;
    t0.next = d1.next;
    return d0.next;
}
```

<!-- @annotations -->
- 5: Capturing `p = p.next` in the header is safe because the body only rewrites a **tail's** `next`, never `p`'s — until `p` itself becomes a tail, by which point the header has already read it.

<!-- @code python -->
```python
def sort_zero_one_two(head):
    d0, d1, d2 = Node(0), Node(0), Node(0)
    t0, t1, t2 = d0, d1, d2

    p = head
    while p is not None:
        nxt = p.next
        if p.data == 0:   t0.next = p; t0 = p
        elif p.data == 1: t1.next = p; t1 = p
        else:             t2.next = p; t2 = p
        p = nxt

    t2.next = None
    t1.next = d2.next
    t0.next = d1.next
    return d0.next


# The three joins need no empty-chain guards: an unused chain's tail
# is still its own dummy, so the links thread straight through.
# Verified on all 29,524 lists of 0/1/2 up to length 9.
```

<!-- @annotations -->
- 7: Saving `p.next` before the body, the habit from **Deletion of the head**. Here the body does not overwrite it, but the copy costs nothing and removes the question.

<!-- @approach -->
### Count and Overwrite

<!-- @idea -->
Tally how many of each value there are, then walk again writing them back in order.

<!-- @steps -->
1. Walk the list once, counting the 0s, 1s and 2s.
2. Return to the head.
3. Write that many 0s, then that many 1s, then that many 2s, advancing one node per value written.
4. Return the original head, which has not moved.

<!-- @complexity -->
- time: O(n) — two traversals
- space: **O(1)** — three counters
- note: Produces the same sequence and is a different operation: the nodes never move and their contents change, so anything holding a pointer into the list sees new data at the same address. Measured over 3,000 lists, every node stayed exactly in place. It also makes a genuine second pass — 2,000,000 dereferences against 1,000,000 at a million nodes — and runs about **1.8x** slower in C++, though it is *faster* than relinking in Python at small sizes.

<!-- @code cpp -->
```cpp
Node* sortZeroOneTwoByCount(Node* head) {
    long count[3] = {0, 0, 0};
    for (Node* p = head; p != nullptr; p = p->next) count[p->data]++;

    Node* p = head;
    for (int value = 0; value < 3; value++) {
        for (long i = 0; i < count[value]; i++) { p->data = value; p = p->next; }
    }
    return head;
}
```

<!-- @annotations -->
- 3: Indexing the counter array by the value itself, which only works because the values are known to be exactly 0, 1 and 2 — any other value indexes out of bounds silently.
- 7: The nodes keep their addresses and exchange contents. That is the whole semantic difference from relinking, and it is invisible unless something outside holds a node pointer.
- 9: Returning the head it was given, unchanged — itself a signal that no node moved.

<!-- @code java -->
```java
static Node sortZeroOneTwoByCount(Node head) {
    long[] count = new long[3];
    for (Node p = head; p != null; p = p.next) count[p.data]++;

    Node p = head;
    for (int value = 0; value < 3; value++) {
        for (long i = 0; i < count[value]; i++) { p.data = value; p = p.next; }
    }
    return head;
}
```

<!-- @annotations -->
- 3: Java bounds-checks this array, so a stray value raises `ArrayIndexOutOfBoundsException` rather than corrupting memory as the C++ version would.

<!-- @code python -->
```python
def sort_zero_one_two_by_count(head):
    count = [0, 0, 0]
    p = head
    while p is not None:
        count[p.data] += 1
        p = p.next

    p = head
    for value in (0, 1, 2):
        for _ in range(count[value]):
            p.data = value
            p = p.next
    return head


# Twice the pointer reads of the relinking version and FASTER here at
# a thousand nodes -- 39.29us against 52.94 -- because the relinking
# loop carries a three-way branch that CPython charges for per node.
```

<!-- @annotations -->
- 5: A negative value would index from the end of the list rather than raising, so this version silently misbehaves on out-of-range data instead of failing.

<!-- @approach -->
### Copy the Values to an Array

<!-- @idea -->
Read every value into an array, sort or bucket it there, and write the result back over the nodes.

<!-- @steps -->
1. Walk the list, appending each value to an array.
2. Sort the array — for three known values, counting sort is the natural choice.
3. Walk the list again, writing the sorted values back in order.
4. Return the original head.

<!-- @complexity -->
- time: O(n) — two traversals plus the array work
- space: **O(n)** — one slot per node
- note: The instinct that comes from having solved the array version, and the weakest of the three here: it rewrites values like the counting method, so it has the same semantics, but pays O(n) memory for the privilege. It earns its place as the general-purpose shape — swap counting sort for a comparison sort and it handles arbitrary values, which is where **Sort LL** picks up.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

Node* sortZeroOneTwoByArray(Node* head) {
    vector<int> values;
    for (Node* p = head; p != nullptr; p = p->next) values.push_back(p->data);
    sort(values.begin(), values.end());

    size_t i = 0;
    for (Node* p = head; p != nullptr; p = p->next) p->data = values[i++];
    return head;
}
```

<!-- @annotations -->
- 8: A general comparison sort, which is what makes this version the one that generalises beyond three known values.
- 6: The O(n) allocation the other two approaches avoid entirely.

<!-- @code java -->
```java
static Node sortZeroOneTwoByArray(Node head) {
    List<Integer> values = new ArrayList<>();
    for (Node p = head; p != null; p = p.next) values.add(p.data);
    Collections.sort(values);

    int i = 0;
    for (Node p = head; p != null; p = p.next) p.data = values.get(i++);
    return head;
}
```

<!-- @annotations -->
- 2: `List<Integer>` boxes every value, so this pays an allocation per node on top of the array itself.

<!-- @code python -->
```python
def sort_zero_one_two_by_array(head):
    values = []
    p = head
    while p is not None:
        values.append(p.data)
        p = p.next
    values.sort()

    p = head
    i = 0
    while p is not None:
        p.data = values[i]
        i += 1
        p = p.next
    return head
```

<!-- @annotations -->
- 7: `values.sort()` runs in C, which is why this version is more competitive in Python than its operation count suggests.

<!-- @example -->

<!-- @input -->
`2 -> 0 -> 1 -> 2 -> 0 -> 1`

<!-- @output -->
`0 -> 0 -> 1 -> 1 -> 2 -> 2`

<!-- @why -->
The straightforward trace, ending with the join order that matters.

<!-- @walkthrough -->
1. Three dummies are created and each tail pointer starts on its own dummy.
2. Walking the input: the 2 goes to the 2s chain, the 0 to the 0s chain, the 1 to the 1s chain, and so on.
3. After the walk the chains hold `0 0`, `1 1` and `2 2`, each still linked to whatever followed it originally.
4. `t2->next = nullptr` cuts the 2s chain loose — its last node was the fourth node of the input, which still pointed at a 0.
5. `t1->next = d2.next` attaches the 2s to the end of the 1s, giving `1 1 2 2`.
6. `t0->next = d1.next` attaches that to the end of the 0s, giving `0 0 1 1 2 2`.
7. Doing steps 5 and 6 in the other order would attach an unfinished 1s chain and lose the 2s.

<!-- @example -->

<!-- @input -->
`0 -> 2 -> 0 -> 2` — a list with no 1s at all

<!-- @output -->
`0 -> 0 -> 2 -> 2`, with no special case in the code

<!-- @why -->
Shows why the join needs no empty-chain guards, which is the part of this algorithm that looks like it should.

<!-- @walkthrough -->
1. No node has value 1, so the 1s chain receives nothing and `t1` never moves off `&d1`.
2. The 0s chain holds two nodes and the 2s chain holds two.
3. `t2->next = nullptr` terminates the 2s chain as usual.
4. `t1->next = d2.next` therefore writes the 2s head into `d1.next`, because `t1` **is** `&d1`.
5. `t0->next = d1.next` now reads that same field and picks up the 2s — the empty chain has passed the link through rather than breaking it.
6. The same aliasing covers a missing 0s chain: `t0` would still be `&d0`, so the line above writes the right head into `d0.next` for the return.
7. All eight combinations of present and absent values were checked this way, across all 29,524 lists of 0s, 1s and 2s up to length 9.

<!-- @example -->

<!-- @input -->
The same code with `t2->next = nullptr` removed

<!-- @output -->
A cycle, but only when the list contains a 2 and does not end with one

<!-- @why -->
The same bug as in **Segregate odd and even nodes**, with a trigger that can be stated exactly.

<!-- @walkthrough -->
1. The 2s chain's last node is whichever 2 appeared last in the input — usually not the last node overall.
2. Its `next` still points at whatever followed it, which the join has now moved earlier in the list.
3. That closes a loop, so walking the result never terminates.
4. If the list **ends** in a 2, the 2s tail is the original tail and its `next` is already null: 0 cycles out of 9,841 such lists.
5. If it ends in a 0 or 1, 18,660 of 19,682 cycled.
6. The 1,022 that did not are exactly the lists with **no 2s at all**, where the 2s chain is empty — and lists over `{0,1}` of length 1 to 9 number `2 + 4 + … + 512 = 1,022`, which matches exactly.
7. So the rule is: it cycles if and only if the list contains a 2 and does not end with one.

<!-- @example -->

<!-- @input -->
Relinking against counting, on pointer reads and on the clock

<!-- @output -->
Half the reads and 1.8x faster in C++ — and slower in Python

<!-- @why -->
The first time in three subtopics that operation counts predict the timing, and an explanation of why the earlier ones did not.

<!-- @walkthrough -->
1. Relinking makes one traversal: 1,000,000 dereferences at a million nodes.
2. Counting makes two — one to tally and one to write back: 2,000,000.
3. In C++ the clock agrees, with counting about **1.8x** slower.
4. That differs from **Remove Nth node** and **Delete the middle node**, where the version reading *more* pointers was faster.
5. The distinction is what the extra reads are. There, the loser re-read pointers inside a single traversal, which cost almost nothing.
6. Here the extra reads are a genuine second traversal of the whole list, which costs a traversal.
7. Python inverts it anyway: counting ran 39.29us against relinking's 52.94us at a thousand nodes, because the relinking loop carries a three-way branch per node and CPython charges per bytecode.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the input as one row, colour-coded by value, and three empty tracks beneath it labelled 0, 1 and 2 — each with its dummy drawn as a distinct, slightly greyed box at the left end, because the dummies are what make the join work and they need to be visible from the start. Walk the input once and let each node drop down into its track, keeping the nodes in their original left-to-right order within each track so that stability is something the reader sees rather than a claim. The nodes should keep their identity as they move — same box, same colour, new position — since this version relinks rather than rewrites. Then the join, staged in three separate beats so the order is legible: first the 2s tail's forward arrow is cut, drawn as a snipped link with the old target visibly left behind; then the 1s tail reaches down to the 2s head; then the 0s tail reaches to the 1s head. Show the result assembling as one row. The second panel is the empty-chain case, and it is the one worth the most care: run `0 2 0 2` so the 1s track stays empty, and draw `t1` still sitting on its dummy rather than on a node. When the second join fires, show it writing into that dummy's `next` field, and then show the third join reading the same field — the link passing straight through the empty track, with a caption that this is why no branch is needed. The third panel is the terminator bug: the same list ending in a 1, with the snip omitted, so the 2s tail's stale arrow curves back into the assembled row and closes a visible ring. Beside it, a list ending in 2, where the tail's arrow already points at null and nothing goes wrong — the two side by side give the exact rule. Close with the cost bars, reads and microseconds, for relinking and counting in both languages, since C++ and Python rank them oppositely and that contrast is the point.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"problem":{"input":"a linked list whose values are all 0, 1 or 2","output":"the same values in sorted order"},"whyNotDutchNationalFlag":"the array algorithm sorts in place by closing in from both ends; a singly linked list has no backwards pointer, so there is no second end to sweep from","relationToSegregate":"this is the value-based twin of Segregate odd and even nodes -- same three moves, with the grouping key changed from position to value","correctness":{"comparedAgainst":"a sorted reference","randomLists":3000,"disagreements":0,"joinVerifiedOn":"every list of 0/1/2 up to length 9","joinLists":29524,"joinFailures":0},"theJoinNeedsNoSpecialCases":{"worry":"what if a value is missing entirely -- does the join drop a chain or return null?","answer":"no, and it is not luck","mechanism":"a chain that receives no nodes never moves its tail off its own DUMMY, so t1 is still &d1 and `t1->next = d2.next` writes the 2s head into d1.next -- which the next line, `t0->next = d1.next`, then reads","orderMatters":"2s into 1s, then 1s into 0s, so each join sees the result of the one before","alsoCovers":"no 0s at all -- t0 is still &d0, so the previous line wrote the right head into it for the return","verified":"all eight combinations of present and absent values, across all 29,524 lists","note":"an earlier draft of this container guarded each join with a ternary for empty chains; those ternaries are unnecessary and the simpler code is what was verified"},"theTerminator":{"line":"t2->next = nullptr","whyNeeded":"the 2s chain's last node is usually not the list's last node, so it still points forward at something the join has moved earlier","sameBugAs":"Segregate odd and even nodes, with a sharper trigger","measuredUpToLength9":[{"originalList":"ends in 2","cycled":0,"fine":9841},{"originalList":"ends in 0 or 1","cycled":18660,"fine":1022}],"the1022":"exactly the lists containing NO 2s -- lists over {0,1} of length 1..9 number 2+4+...+512 = 1022, which matches","exactRule":"cycles if and only if the list contains a 2 and does not end with one"},"movingNodesVsRewritingValues":{"relinking":{"whatMoves":"the nodes","addressesAfterwards":"reordered, same set","measured":"3000/3000 lists"},"counting":{"whatMoves":"the values","addressesAfterwards":"unchanged, every node in place","measured":"3000/3000 lists"},"whyItMatters":"anything holding a pointer into the list keeps its data and changes position under relinking, and keeps its position and changes data under counting","sameDistinctionAs":["Reverse a LinkedList","Segregate odd and even nodes"]},"dereferences":{"rows":[{"n":1000,"relinking":1000,"counting":2000},{"n":100000,"relinking":100000,"counting":200000},{"n":1000000,"relinking":1000000,"counting":2000000}],"shape":"relinking is one traversal; counting is two"},"benchCpp":{"unit":"microseconds, median of fresh-list single calls","rows":[{"n":1000,"relinking":1.08,"counting":2.00},{"n":1000000,"relinking":"1,310-2,972","counting":"2,370-5,270"}],"ratio":"counting about 1.8x slower across runs","whyCountsPredictHere":"unlike Remove Nth node and Delete the middle node, where the loser re-read pointers WITHIN one traversal at almost no cost, the extra reads here are a genuine second traversal of the whole list"},"benchPython":{"unit":"microseconds, median of fresh-list single calls, three runs","rows":[{"n":1000,"relinking":52.94,"counting":39.29},{"n":200000,"relinking":10845,"counting":10721}],"verdict":"counting is FASTER at a thousand nodes and level at two hundred thousand, despite twice the pointer reads","why":"the relinking loop carries a three-way branch and two assignments per node, and CPython charges per bytecode"},"recommendation":"three chains and a join -- one pass, O(1) space, moves nodes rather than values, and needs no empty-chain branches","lesson":"a small piece of precise reasoning -- an empty chain's tail still aliases its dummy -- replaced three defensive branches, and was worth verifying exhaustively rather than arguing about"}
```

<!-- @highlights -->
- The input is drawn as one colour-coded row above three empty tracks labelled 0, 1 and 2.
- Each track's dummy is drawn as a distinct greyed box at its left end, visible from the first frame.
- The walk drops each node down into its track, keeping original left-to-right order within each.
- Stability is therefore something the reader watches rather than a claim in a caption.
- Nodes keep their identity as they move — same box, same colour, new position — since this version relinks.
- The join is staged in three separate beats so its order is legible.
- First the 2s tail's forward arrow is snipped, with the old target visibly left behind.
- Then the 1s tail reaches down to the 2s head; then the 0s tail reaches to the 1s head.
- The second panel runs `0 2 0 2` so the 1s track stays empty.
- `t1` is drawn still sitting on its dummy rather than on a node.
- The second join is shown writing into that dummy's `next` field.
- The third join is then shown reading the same field — the link passing straight through the empty track.
- The third panel omits the snip on a list ending in 1, so the 2s tail's stale arrow curves back and closes a visible ring.
- Beside it, a list ending in 2 where the arrow already points at null and nothing goes wrong.
- Those two together give the exact rule rather than describing it.
- The close pairs read and microsecond bars for relinking and counting in both languages, since C++ and Python rank them oppositely.

<!-- @edgeCases -->
- The empty list — every chain stays empty, the joins thread nulls through, and the return is null.
- A single node — ends up alone in its chain and is returned correctly whichever value it holds.
- All 0s — the 1s and 2s chains are empty, and the joins pass the null through to terminate the 0s chain.
- All 1s — both other chains are empty; the return works only because `t0` still aliases `d0`.
- All 2s — the only all-same case where the missing terminator would be harmless anyway, since the list ends in 2.
- No 1s at all — the case that makes the join look like it needs a guard, and does not.
- No 0s at all — the return value comes from the aliasing rather than from the 0s chain.
- A list ending in 2 — the one shape where forgetting the terminator is safe, which is why it is a bad test case.
- A list ending in 0 or 1 and containing a 2 — the exact condition under which the missing terminator cycles.
- Values outside 0–2 — the counting version indexes its array by the value and would read out of bounds in C++ or from the end of the list in Python.
- Nodes held by an outside pointer — relinking moves them and keeps their data; counting keeps their position and changes their data.

<!-- @pitfalls -->
- Forgetting `t2->next = nullptr`. Cycles whenever the list contains a 2 and does not end with one — 18,660 of the lists tested up to length 9.
- Testing only with lists that end in 2. That is precisely the shape where the missing terminator is harmless.
- Joining 1s into 0s before joining 2s into 1s. The second join then attaches an unfinished chain and the 2s are lost.
- Adding empty-chain guards to the join. They are unnecessary — the tails alias their dummies — and the extra branches are the version that was not verified.
- Returning `d1.next` or a tail pointer instead of `d0.next`. The 0s dummy is the only correct starting point, including when there are no 0s.
- Reaching for Dutch National Flag. It needs to close in from both ends, and a singly linked list has only one.
- Assuming counting and relinking are the same operation. They produce the same sequence, and one moves nodes while the other rewrites values.
- Indexing the counter array by `p->data` without trusting the input. Any value outside 0–2 reads out of bounds in C++ and silently from the end of the list in Python.
- Assuming the relinking version is faster everywhere. It is about 1.8x faster in C++ and *slower* than counting in Python at a thousand nodes.
- Timing these by calling them repeatedly on one list. Both mutate it, and after the first call the input is already sorted.
- Comparing only the printed output when checking node identity. The sequences match; only the node addresses reveal which operation ran.

<!-- @doubt -->
### Does the join break if one of the values is missing?

<!-- @answer -->
No, and this is the part of the algorithm most worth understanding rather than memorising. When a chain receives no nodes, its tail pointer never moves off its own **dummy**. So if there are no 1s, `t1` is still `&d1`, which means `t1->next = d2.next` writes the 2s head into `d1.next` — and the next line, `t0->next = d1.next`, reads that same field and picks the 2s up. The link threads straight through the empty chain. The same aliasing handles a missing 0s chain: `t0` would still be `&d0`, so the line above already wrote the correct head into `d0.next` for the return. The one thing that does matter is **order** — 2s into 1s, then 1s into 0s — so each join sees the result of the one before. All eight combinations of present and absent values were checked across all **29,524** lists of 0s, 1s and 2s up to length 9, with no failures and no guards.

<!-- @doubt -->
### When exactly does forgetting the terminator hurt?

<!-- @answer -->
When the list contains a 2 and does not end with one — and that is an exact rule, not a rough one. The 2s chain's last node is whichever 2 appeared last in the input; if that is not the final node overall, its `next` still points at something the join has since moved earlier, closing a loop. Measured over every list up to length 9: of the 9,841 lists **ending in 2**, zero cycled, because there the 2s tail is the original tail and its `next` is already null. Of the rest, **18,660 cycled** and 1,022 did not — and those 1,022 are exactly the lists containing **no 2s at all**, where the chain is empty and there is nothing to terminate. The count confirms it: lists over `{0,1}` of length 1 to 9 number `2 + 4 + … + 512 = 1,022`. The practical consequence is that a test suite built from lists ending in 2 will never see this bug.

<!-- @doubt -->
### Why not use Dutch National Flag, like the array version?

<!-- @answer -->
Because it depends on something a singly linked list does not have. The array algorithm keeps a low pointer, a high pointer and a scanner, and its whole efficiency comes from swapping elements down from the **high** end while scanning up from the low one. A singly linked list can only be walked forwards, so there is no way to approach from the top, and swapping node values back and forth would need repeated traversals to reach the high pointer at all. What replaces it is the technique from **Segregate odd and even nodes** — build separate chains and stitch them together — which suits the structure instead of fighting it: one forward pass, three appends, three joins. It is worth noticing that this is a general pattern rather than a trick for three values; the same shape handles any small fixed set of keys, and **Sort LL** is where it gives way to a real comparison sort.

<!-- @doubt -->
### Is counting the values simpler? It avoids all the pointer work.

<!-- @answer -->
It is simpler and it is a different operation, which matters more than the simplicity. Counting leaves every node exactly where it is and overwrites the contents — verified across 3,000 lists, every node in place — while relinking moves the nodes and leaves their data untouched. If anything outside holds a pointer into the list, those two do opposite things to it, which is the same distinction **Reverse a LinkedList** and **Segregate odd and even nodes** both measured. On cost it is also the slower one in C++: it makes a genuine second traversal, 2,000,000 dereferences against 1,000,000 at a million nodes, and runs about **1.8x** slower. Python reverses that — counting ran 39.29us against relinking's 52.94 at a thousand nodes — because the relinking loop carries a three-way branch per node and CPython charges per bytecode rather than per pointer.

<!-- @doubt -->
### Earlier subtopics said pointer counts do not predict speed. Why do they here?

<!-- @answer -->
Because what the extra reads *are* differs. **Remove Nth node from the back** and **Delete the middle node** both found a version that read more pointers and ran faster — in each case the loser was making a genuine second traversal while the winner re-read pointers **within** a single pass, and those re-reads cost almost nothing. Here the relationship is the plain one: relinking makes one traversal and counting makes two, so counting's doubled dereference count is a doubled amount of actual walking, and the clock agrees at about 1.8x. That is worth stating carefully rather than as a rule in either direction. Operation counts describe the shape of an algorithm; whether they track the clock depends on whether the extra operations are real work or repeated reads of something already in a register or cache. Python then inverts even this case, which is the reminder that the answer is per-language too.

<!-- @doubt -->
### Is the result stable?

<!-- @answer -->
The relinking version is, and it comes for free. Nodes are appended to their chains in the order they are encountered, so two nodes with the same value keep their original relative order — and since the chains are joined without disturbing their internals, that order survives into the result. That is visible in the trace: `2 0 1 2 0 1` produces chains of `0 0`, `1 1` and `2 2` where each pair is in input order. Stability is not very interesting when the payload is just the digit being sorted, since equal values are indistinguishable — but it matters immediately if the nodes carry anything else, which is the normal case in real code. The counting version has no meaningful notion of stability at all: it does not move nodes, it overwrites their values, so there is nothing whose order could be preserved or disturbed.
