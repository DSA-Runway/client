---
id: segregate-odd-and-even-nodes-in-linked-list
topic: Linked Lists
title: Segregate odd and even nodes in Linked List
difficulty: Medium
status: ready
prerequisites:
  - introduction-to-singly-linkedlist
  - reverse-a-linkedlist-iterative
  - find-the-length-of-the-linked-list
  - deletion-of-the-head-of-ll
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - sort-a-linked-list-of-0s-1s-and-2s
  - reverse-a-linkedlist-iterative
  - check-if-ll-is-palindrome-or-not
  - remove-nth-node-from-the-back-of-the-ll
  - reverse-ll-in-group-of-given-size-k
---

<!-- @summary -->
Two bugs live in this problem and they have **opposite parities**: dropping half the loop guard crashes on **every even-length list and no odd one**, while forgetting to terminate the even chain cycles on **every odd-length list and no even one**. A test suite built from one parity catches exactly one of them. Underneath sits a measurement that cuts against instinct twice over — the version doing **2.5x more pointer reads** ties in C++ and wins by **2x** in Python.

<!-- @theory -->
## Which "odd and even"?

Positions, not values. The list is numbered from 1, and the task is to gather
every odd-numbered node first, then every even-numbered one, keeping the
original relative order inside each group.

```
in:   1 -> 2 -> 3 -> 4 -> 5
      ^    ^    ^    ^    ^
      1st  2nd  3rd  4th  5th

out:  1 -> 3 -> 5 -> 2 -> 4
      \_ odd positions _/  \_ even _/
```

The values in that example happen to match their positions, which is exactly the
kind of coincidence that hides a misunderstanding — so here is one where they do
not:

| n | Input | Output |
|---|---|---|
| 3 | `1 2 3` | `1 3 2` |
| 4 | `1 2 3 4` | `1 3 2 4` |
| 5 | `1 2 3 4 5` | `1 3 5 2 4` |
| 7 | `1 2 3 4 5 6 7` | `1 3 5 7 2 4 6` |
| 9 | `1 2 3 4 5 6 7 8 9` | `1 3 5 7 9 2 4 6 8` |

Partitioning by **value** is a different problem, and this topic covers it
separately under **Sort a Linked List of 0's 1's and 2's**, which is the general
technique for grouping by a property of the data.

Two properties are required and easy to lose. The nodes must be **relinked, not
rewritten** — this is a rearrangement of the list, not of its contents — and the
grouping must be **stable**, preserving relative order within each half. Both
were verified for every length from 0 to 200: the same set of nodes comes back
with nothing lost or duplicated, and each group's internal order is unchanged.

## The weave

Run two pointers down the list, each hopping over the other's nodes, then join
the odd chain to the head of the even one.

```cpp
Node* oddEvenList(Node* head) {
    if (head == nullptr || head->next == nullptr) return head;
    Node* odd = head;
    Node* even = head->next;
    Node* evenHead = even;
    while (even != nullptr && even->next != nullptr) {
        odd->next = even->next;
        odd = odd->next;
        even->next = odd->next;
        even = even->next;
    }
    odd->next = evenHead;
    return head;
}
```

A detail worth noticing: this version needs **no explicit termination** for the
even chain. When `odd` reaches the last node, `even->next = odd->next` assigns
null, and the even chain ends correctly for free. The dummy-head version below
does not get that for free, which is where the second bug lives.

## Two bugs, opposite parities

**Dropping half the guard.** Writing `while (even)` instead of
`while (even && even->next)` looks harmless — `even` is the pointer being
advanced, after all. Tested on every length from 1 to 60:

| Length | Crashed | Survived |
|---|---|---|
| Even | **30 of 30** | 0 |
| Odd | 0 | **30 of 30** |

On an even-length list the even runner eventually stands on the final node, so
`odd->next = even->next` makes `odd` null and the very next line dereferences it.
On an odd-length list the runner becomes null first and the loop exits before any
of that.

**Forgetting to terminate the even chain.** In the dummy-head formulation you
must set the even tail's `next` to null yourself. Omit it and:

| Length | Cycled | Fine |
|---|---|---|
| Even | 0 | **30 of 30** |
| Odd | **29 of 30** | 1 |

On an odd-length list the final node sits at an odd position, so it joins the
*odd* chain — leaving the even tail still pointing forward at a node that is now
behind it, which closes a loop. On an even-length list the final node **is** the
even tail and its `next` was already null. The single odd-length exception is
`n = 1`, which has no even node at all.

The two failure modes are exact complements. A test suite made of
`[1,2]`, `[1,2,3,4]` and `[1,2,3,4,5,6]` catches the first bug and is blind to
the second; one made of odd lengths does precisely the reverse. Neither parity
alone is a test.

## Fewer pointer reads, no faster

The dummy-head version walks the list exactly once. The weave re-reads
`odd->next` and `even->next` as it goes, and the difference is not small:

| n | Weave | Dummy heads | Copy values |
|---|---|---|---|
| 10 | 23 | **10** | 20 |
| 1,000 | 2,498 | **1,000** | 2,000 |
| 100,000 | 249,998 | **100,000** | 200,000 |
| 1,000,000 | 2,499,998 | **1,000,000** | 2,000,000 |

That is **2.5x** as many dereferences. Timed at n = 100,000, over five runs of
300 freshly built lists each:

| | Weave | Dummy heads | Copy values |
|---|---|---|---|
| Median | **228.29us** | 230.00us | 608.33us |
| Range | 195.88–234.79 | 195.58–241.29 | 579.79–654.46 |

They are indistinguishable, and swap places between runs. The extra reads cost
nothing because they are re-reads of pointers already sitting in L1 cache — the
two versions visit the same nodes in the same order, and that traversal is what
the time is actually spent on.

Python disagrees in the other direction:

| n | Weave | Dummy heads | Copy values |
|---|---|---|---|
| 1,000 | **41.29us** | 78.75us | 150.27us |
| 100,000 | **4,057us** | 8,299us | 15,736us |

Here the weave is about **2x faster** despite the same 2.5x disadvantage in
pointer reads, because CPython charges per *bytecode*, not per dereference, and
the dummy-head loop carries a branch and a counter increment on every node that
the weave does not have.

So the dereference count fails to predict the winner in both languages, in
opposite directions. **Check if LL is palindrome** made the same point from the
other side, where an O(n) array beat an O(1) pointer walk. Operation counts
describe an algorithm's shape; only a clock ranks implementations.

## A benchmark that lies

This operation permutes the list, which makes the obvious timing loop useless.
Calling it repeatedly on the same list re-permutes an already-permuted list, and
each pass scatters the nodes further from traversal order. Successive calls on
one million nodes:

| Call | 1 | 2 | 3 | 4 | 5 | 6 |
|---|---|---|---|---|---|---|
| Time | 3,621us | 2,632us | 4,202us | 8,141us | 11,773us | **20,850us** |

Rebuilding the list before each timed call instead gives 1,533–2,072us, stable.
The first measurement was inflated by roughly **10x** and reversed the ranking of
two of the three approaches. Every figure above comes from timing a single call
on a freshly built list, with the build excluded.

<!-- @intuition -->
The algorithm is a zip run backwards: one runner claims the odd-position nodes and the other the even ones, each stepping over the node the other just took, and at the end the two chains are joined. Nothing about that is deep, which is why the interesting part of this problem is entirely in the boundaries. A list has an odd or an even number of nodes, the two runners run out on different beats depending on which, and almost every mistake here is really a mistake about that one bit of information — which is why the two classic bugs land on opposite parities and why testing on one parity feels like testing and is not. The measurement carries a second lesson that is easy to take too far. Two subtopics ago an O(n) helper lost badly to a pointer walk; one subtopic ago a flat array beat the clever in-place method; here the version doing two and a half times the pointer work ties in one language and wins in another. None of those contradict each other, because none of them were ever about operation counts. They are about what an operation costs on real hardware, and that is not something a complexity class or a dereference tally was ever going to tell you.

<!-- @approach -->
### Optimal - Weave in Place

<!-- @idea -->
Send two runners down the list, each skipping over the node the other just claimed, then join the odd chain to the head of the even chain.

<!-- @steps -->
1. Return immediately for a list of zero or one node — there is nothing to rearrange.
2. Point `odd` at the first node and `even` at the second, and remember the second as the head of the even chain.
3. While both `even` and the node after it exist, link `odd` to the node after `even` and advance `odd` onto it.
4. Link `even` to the node after the new `odd`, and advance `even` onto it.
5. When the loop ends, join `odd` to the remembered even head.
6. Return the original head, which is still the first node.

<!-- @complexity -->
- time: O(n) — one pass, with each node visited once by one of the two runners
- space: **O(1)** — three pointers
- note: The one to write. It needs **no explicit termination** for the even chain — when `odd` lands on the last node, step 4 assigns null automatically, which is exactly the line the dummy-head version has to add by hand. It performs **2.5x more dereferences** than that version and is not slower for it: 228.29us against 230.00us at a hundred thousand nodes, and about **2x faster** in Python.

<!-- @code cpp -->
```cpp
Node* oddEvenList(Node* head) {
    if (head == nullptr || head->next == nullptr) return head;
    Node* odd = head;
    Node* even = head->next;
    Node* evenHead = even;
    while (even != nullptr && even->next != nullptr) {
        odd->next = even->next;
        odd = odd->next;
        even->next = odd->next;
        even = even->next;
    }
    odd->next = evenHead;
    return head;
}
```

<!-- @annotations -->
- 6: Both halves of the guard are required. `while (even)` alone crashes on **every** even-length list and no odd-length one — 30 of 30 either way, over lengths 1 to 60.
- 9: This is also what terminates the even chain. When `odd` is the last node, `odd->next` is null and that null lands here, so no separate termination step is needed.
- 12: Joining after the loop, not inside it. `evenHead` had to be saved at line 5 because `head->next` stops pointing at it on the first iteration.
- 2: The early return covers both the empty list and the single-node list, which the loop below could not handle without dereferencing null.

<!-- @code java -->
```java
static Node oddEvenList(Node head) {
    if (head == null || head.next == null) return head;
    Node odd = head;
    Node even = head.next;
    Node evenHead = even;
    while (even != null && even.next != null) {
        odd.next = even.next;
        odd = odd.next;
        even.next = odd.next;
        even = even.next;
    }
    odd.next = evenHead;
    return head;
}
```

<!-- @annotations -->
- 13: Returning the original head is correct because the first node is at position 1 and therefore stays at the front.

<!-- @code python -->
```python
def odd_even_list(head):
    if head is None or head.next is None:
        return head
    odd = head
    even = head.next
    even_head = even
    while even is not None and even.next is not None:
        odd.next = even.next
        odd = odd.next
        even.next = odd.next
        even = even.next
    odd.next = even_head
    return head


# 2.5x more pointer reads than the dummy-head version and about 2x
# FASTER here -- CPython charges per bytecode, and this loop carries
# no per-node branch or counter.
```

<!-- @annotations -->
- 7: The two-part condition matters as much here as in C++, though Python raises `AttributeError` on `None` rather than crashing.

<!-- @approach -->
### Build Two Lists with Dummy Heads

<!-- @idea -->
Walk the list once with a position counter, appending each node to one of two chains, then join them.

<!-- @steps -->
1. Create two dummy head nodes, one for the odd chain and one for the even chain, each with a tail pointer.
2. Walk the original list, counting positions from 1.
3. Append each node to the odd chain if its position is odd, and to the even chain otherwise.
4. Set the even chain's tail `next` to null — this step is mandatory.
5. Join the odd chain's tail to the first real node of the even chain.
6. Return the first real node of the odd chain.

<!-- @complexity -->
- time: O(n) — a single pass, one dereference per node
- space: **O(1)** — two dummy nodes and two tail pointers
- note: Reads far more directly than the weave and touches **2.5x fewer pointers** — 100,000 against 249,998 at a hundred thousand nodes — with no measurable time advantage in C++ and a 2x disadvantage in Python. Step 4 is where the second classic bug lives: omit it and the result cycles on **29 of 30 odd-length lists** and on none of the even ones.

<!-- @code cpp -->
```cpp
Node* oddEvenListDummy(Node* head) {
    Node oddDummy(0), evenDummy(0);
    Node* oddTail = &oddDummy;
    Node* evenTail = &evenDummy;

    int i = 1;
    for (Node* p = head; p != nullptr; p = p->next, i++) {
        if (i % 2 == 1) { oddTail->next = p; oddTail = p; }
        else            { evenTail->next = p; evenTail = p; }
    }
    evenTail->next = nullptr;
    oddTail->next = evenDummy.next;
    return oddDummy.next;
}
```

<!-- @annotations -->
- 11: Mandatory. Without it, an odd-length list leaves the even tail pointing forward at a node that has moved behind it, closing a cycle — measured on 29 of 30 odd lengths.
- 8: The counter is what makes this positional. Testing `p->data % 2` instead would partition by **value**, which is a different problem.
- 12: `evenDummy.next` rather than `evenTail`, which is the last node of the even chain, not its first.
- 13: Returning `oddDummy.next` handles the empty list for free — it is null, which is the right answer.

<!-- @code java -->
```java
static Node oddEvenListDummy(Node head) {
    Node oddDummy = new Node(0), evenDummy = new Node(0);
    Node oddTail = oddDummy, evenTail = evenDummy;

    int i = 1;
    for (Node p = head; p != null; p = p.next, i++) {
        if (i % 2 == 1) { oddTail.next = p; oddTail = p; }
        else            { evenTail.next = p; evenTail = p; }
    }
    evenTail.next = null;
    oddTail.next = evenDummy.next;
    return oddDummy.next;
}
```

<!-- @annotations -->
- 6: Capturing `p = p.next` in the for-header is safe here because the body only ever rewrites a **tail's** next pointer, never `p`'s.

<!-- @code python -->
```python
def odd_even_list_dummy(head):
    odd_dummy = Node(0)
    even_dummy = Node(0)
    odd_tail, even_tail = odd_dummy, even_dummy

    p, i = head, 1
    while p is not None:
        nxt = p.next
        if i % 2 == 1:
            odd_tail.next = p
            odd_tail = p
        else:
            even_tail.next = p
            even_tail = p
        p, i = nxt, i + 1
    even_tail.next = None
    odd_tail.next = even_dummy.next
    return odd_dummy.next
```

<!-- @annotations -->
- 8: Saving `p.next` before the body is the safe habit from **Deletion of the head** — here the body happens not to overwrite it, but the saved copy costs nothing and removes the question.
- 16: The line whose absence cycles every odd-length list.

<!-- @approach -->
### Copy the Values Out and Write Them Back

<!-- @idea -->
Collect the odd-position and even-position values into two arrays, concatenate, and write the result back over the nodes.

<!-- @steps -->
1. Walk the list, appending each value to an odd array or an even array by position.
2. Append the even array to the end of the odd array.
3. Walk the list again, writing the combined values back in order.
4. Return the original head, unchanged.

<!-- @complexity -->
- time: O(n) — two passes plus the copy
- space: **O(n)** — two arrays holding every value
- note: Produces the right sequence and is a different operation, exactly as in **Reverse a LinkedList**: the nodes never move, so anything holding a pointer into the list sees a changed value at the same address. It is also the slowest — 608.33us against 228.29us at a hundred thousand nodes, about **2.7x** — and the only one of the three needing O(n) memory. Worth knowing mainly so the distinction between rearranging nodes and rewriting them stays sharp.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

Node* oddEvenListValues(Node* head) {
    vector<int> odd, even;
    int i = 1;
    for (Node* p = head; p != nullptr; p = p->next, i++) {
        (i % 2 == 1 ? odd : even).push_back(p->data);
    }
    odd.insert(odd.end(), even.begin(), even.end());

    size_t k = 0;
    for (Node* p = head; p != nullptr; p = p->next) p->data = odd[k++];
    return head;
}
```

<!-- @annotations -->
- 13: The nodes keep their addresses and exchange contents — a rearrangement of values, not of the list.
- 14: Returning the same head it was given, which is itself the tell: a genuine positional rearrangement of an odd-length list returns the same head too, but of a list whose nodes have moved.
- 10: Concatenating rather than interleaving. The odd group must come first in its original order, then the even group in its original order.

<!-- @code java -->
```java
static Node oddEvenListValues(Node head) {
    List<Integer> odd = new ArrayList<>(), even = new ArrayList<>();
    int i = 1;
    for (Node p = head; p != null; p = p.next, i++) {
        (i % 2 == 1 ? odd : even).add(p.data);
    }
    odd.addAll(even);

    int k = 0;
    for (Node p = head; p != null; p = p.next) p.data = odd.get(k++);
    return head;
}
```

<!-- @annotations -->
- 2: Two `ArrayList<Integer>` allocations plus boxing for every value, which is why this is the most expensive of the three in Java too.

<!-- @code python -->
```python
def odd_even_list_values(head):
    odd, even = [], []
    p, i = head, 1
    while p is not None:
        (odd if i % 2 == 1 else even).append(p.data)
        p, i = p.next, i + 1
    odd += even

    p, k = head, 0
    while p is not None:
        p.data = odd[k]
        k += 1
        p = p.next
    return head


# Slowest of the three, and semantically distinct: the nodes never
# move, so any outside reference sees a changed value in place.
```

<!-- @annotations -->
- 5: A conditional expression selecting the list to append to, which keeps the positional test in one place.

<!-- @example -->

<!-- @input -->
`1 -> 2 -> 3 -> 4 -> 5`

<!-- @output -->
`1 -> 3 -> 5 -> 2 -> 4`

<!-- @why -->
An odd-length trace of the weave, showing where the even chain gets terminated without a dedicated step.

<!-- @walkthrough -->
1. `odd` starts on node 1, `even` on node 2, and `evenHead` remembers node 2.
2. First iteration: `odd->next` becomes node 3 and `odd` advances to it; `even->next` becomes node 4 and `even` advances to it.
3. The guard now checks node 4 and node 5 — both exist, so the loop runs again.
4. Second iteration: `odd->next` becomes node 5 and `odd` advances to it.
5. Still in that iteration, `even->next` is set to `odd->next`, which is **null** because node 5 is the last node — this is where the even chain gets its terminator.
6. `even` advances to null, the guard fails, and the loop ends.
7. `odd->next = evenHead` joins node 5 to node 2, giving `1 3 5 2 4`.

<!-- @example -->

<!-- @input -->
`while (even)` in place of `while (even && even->next)`

<!-- @output -->
Crashes on all 30 even lengths from 1 to 60, and on none of the 30 odd ones

<!-- @why -->
The first of two parity bugs, and the one that fails loudly.

<!-- @walkthrough -->
1. The loop body dereferences `even->next` and, one line later, `odd->next` after `odd` has just moved.
2. On an **even**-length list the even runner eventually stands on the final node, whose `next` is null.
3. `odd->next = even->next` therefore sets `odd` to null on the following line.
4. `even->next = odd->next` then dereferences that null pointer and the program crashes.
5. On an **odd**-length list the even runner becomes null one beat earlier, so the loop exits before any of that happens.
6. Measured over lengths 1 to 60: 30 of 30 even lengths crashed, 30 of 30 odd lengths ran cleanly.
7. Testing only `[1,2,3]` and `[1,2,3,4,5]` would therefore report the bug as absent.

<!-- @example -->

<!-- @input -->
The dummy-head version with `evenTail->next = nullptr` removed

<!-- @output -->
Cycles on 29 of 30 odd lengths, and on none of the 30 even ones

<!-- @why -->
The second parity bug — the exact complement of the first, and it fails silently.

<!-- @walkthrough -->
1. On an **odd**-length list the final node sits at an odd position, so it is appended to the odd chain.
2. The even chain's last node is therefore not the list's last node, and its `next` still points forward.
3. That forward pointer now aims at a node which has been moved behind it, closing a loop.
4. On an **even**-length list the final node **is** the even tail, and its `next` was already null, so nothing is wrong.
5. Measured over lengths 1 to 60: 29 of 30 odd lengths cycled, 0 of 30 even lengths did.
6. The single odd-length exception is `n = 1`, which has no even node for the bug to strand.
7. Note the contrast with the weave, which never needs this line — its `even->next = odd->next` supplies the null automatically.

<!-- @example -->

<!-- @input -->
Timing the weave by calling it repeatedly on the same one-million-node list

<!-- @output -->
3,621us, then 2,632, 4,202, 8,141, 11,773 and 20,850

<!-- @why -->
A benchmarking trap belonging to any operation that permutes its input.

<!-- @walkthrough -->
1. The operation rearranges the list, so the second call runs on an already-rearranged list.
2. Each pass moves nodes further from the order in which memory was allocated.
3. Traversal therefore gets progressively worse at using the cache, and the measured time climbs.
4. Six successive calls ran 3,621us, 2,632, 4,202, 8,141, 11,773 and 20,850 — a factor of about six.
5. Building a fresh list before each timed call gives 1,533us to 2,072us, stable across trials.
6. The first version of these measurements was inflated roughly **tenfold** and reversed the ranking of two approaches.
7. Every timing in this container comes from a single call on a freshly built list, with the construction excluded from the clock.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the list in one straight row with position numbers above each node, since positions are what the problem is about and values will mislead. Colour odd positions and even positions differently from the first frame. Run the weave with two visible runners: on each beat, show `odd` reaching **over** the node `even` occupies to claim the one beyond, then `even` doing the same in the other direction — the reaching-over is the whole idea and should read as two interleaved hops rather than two separate walks. Keep the nodes physically in place and let only the arrows move, so it is clear this is relinking and not copying. The frame that matters most is the last iteration on an odd-length list: highlight `even->next = odd->next` picking up a null because `odd` has landed on the final node, and label it the even chain terminates here, for free. Then the join: `odd->next = evenHead` drawn as a long arc from the end of the odd chain back to the second node. The second panel is the two parity bugs, side by side and deliberately symmetric. On the left, `while (even)` on an even-length list: the runner steps onto the last node, `odd` goes null, and the next dereference hits a wall — with the tally 30 of 30 even lengths crash, 0 of 30 odd. On the right, the dummy-head build on an odd-length list with the terminator missing: the even tail's forward arrow is left in place, drawn curving back into the middle of the joined list to close a visible ring — tally 29 of 30 odd lengths cycle, 0 of 30 even. Setting them adjacently makes the complementarity the point. Close with the cost chart, and make it two bars per approach: dereferences on the left, microseconds on the right. The weave's dereference bar is two and a half times the dummy version's while its time bar is the same height — that mismatch, standing alone with no caption needed, is the measurement worth remembering.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"definition":{"by":"POSITION, not value","indexing":"1-based","task":"all odd-numbered nodes first, then all even-numbered, preserving relative order within each group","valueBasedVariantLivesIn":"Sort a Linked List of 0's 1's and 2's"},"examples":[{"n":3,"in":"1 2 3","out":"1 3 2"},{"n":4,"in":"1 2 3 4","out":"1 3 2 4"},{"n":5,"in":"1 2 3 4 5","out":"1 3 5 2 4"},{"n":7,"in":"1 2 3 4 5 6 7","out":"1 3 5 7 2 4 6"},{"n":9,"in":"1 2 3 4 5 6 7 8 9","out":"1 3 5 7 9 2 4 6 8"}],"requiredProperties":{"relinkNotRewrite":"a rearrangement of the list, not of its contents","stable":"relative order preserved within each group","verified":"every length 0..200 -- same node set, nothing lost or duplicated, group order unchanged"},"weaveNeedsNoTerminator":{"why":"when `odd` reaches the last node, `even->next = odd->next` assigns null automatically","contrast":"the dummy-head version must set the even tail's next by hand, which is where the second bug lives"},"twoBugsOppositeParities":{"bug1":{"code":"while (even) instead of while (even && even->next)","mechanism":"on an even-length list the even runner stands on the final node, so odd->next = even->next makes odd null and the next line dereferences it","evenLengths":{"crashed":30,"of":30},"oddLengths":{"crashed":0,"of":30},"failsLoudly":true},"bug2":{"code":"dummy-head build with evenTail->next = nullptr removed","mechanism":"on an odd-length list the final node sits at an odd position and joins the ODD chain, leaving the even tail pointing forward at a node now behind it","oddLengths":{"cycled":29,"of":30,"exception":"n=1 has no even node at all"},"evenLengths":{"cycled":0,"of":30},"failsSilently":true},"theComplementarity":"a suite of [1,2], [1,2,3,4], [1,2,3,4,5,6] catches bug 1 and is blind to bug 2; an odd-length suite does exactly the reverse -- neither parity alone is a test"},"dereferences":{"rows":[{"n":10,"weave":23,"dummy":10,"values":20},{"n":1000,"weave":2498,"dummy":1000,"values":2000},{"n":100000,"weave":249998,"dummy":100000,"values":200000},{"n":1000000,"weave":2499998,"dummy":1000000,"values":2000000}],"shape":"weave about 2.5n, dummy exactly n, values 2n"},"benchCpp":{"unit":"microseconds, median of 300 fresh-list single calls, five runs, n=100,000","weave":{"median":228.29,"range":"195.88-234.79"},"dummy":{"median":230.00,"range":"195.58-241.29"},"values":{"median":608.33,"range":"579.79-654.46"},"verdict":"weave and dummy are indistinguishable and swap places between runs, despite the weave doing 2.5x the dereferences","why":"the extra reads are re-reads of pointers already in L1; both versions visit the same nodes in the same order, and that traversal is where the time goes"},"benchPython":{"unit":"microseconds, median of fresh-list single calls, three runs","rows":[{"n":1000,"weave":41.29,"dummy":78.75,"values":150.27},{"n":100000,"weave":4057.17,"dummy":8298.54,"values":15735.52}],"verdict":"the weave is about 2x FASTER despite the same 2.5x disadvantage in pointer reads","why":"CPython charges per bytecode, and the dummy-head loop carries a per-node branch and counter increment that the weave does not"},"theLesson":{"statement":"the dereference count fails to predict the winner in both languages, in opposite directions","companion":"Check if LL is palindrome made the same point from the other side, where an O(n) array beat an O(1) pointer walk","rule":"operation counts describe an algorithm's shape; only a clock ranks implementations"},"benchmarkTrap":{"cause":"the operation PERMUTES its input, so repeated calls run on a progressively scrambled list and lose cache locality","successiveCallsAt1M":[3621,2632,4202,8141,11773,20850],"freshListEachTime":"1,533-2,072us, stable","inflation":"about 10x, and it reversed the ranking of two of the three approaches","methodUsedHere":"a single call on a freshly built list, with construction excluded from the clock"},"recommendation":"the weave -- no terminator to forget, fastest or tied in both languages, O(1) space","lesson":"almost every mistake in this problem is a mistake about one bit of information: whether the list has an odd or an even number of nodes"}
```

<!-- @highlights -->
- The list is drawn in one straight row with position numbers above each node, since positions are the subject and values would mislead.
- Odd and even positions are coloured differently from the first frame.
- Two visible runners advance, each reaching **over** the node the other occupies to claim the one beyond.
- The reaching-over reads as two interleaved hops rather than two separate walks.
- Nodes stay physically in place and only arrows move, making clear this is relinking rather than copying.
- The key frame is the last iteration on an odd-length list.
- There, `even->next = odd->next` picks up a null because `odd` has landed on the final node.
- It is labelled the even chain terminates here, for free.
- The join is drawn as a long arc from the end of the odd chain back to the second node.
- The second panel sets the two parity bugs side by side, deliberately symmetric.
- On the left, `while (even)` on an even-length list: the runner steps onto the last node, `odd` goes null, and the next dereference hits a wall — 30 of 30 even lengths crash, 0 of 30 odd.
- On the right, the dummy-head build on an odd-length list with the terminator missing: the even tail's forward arrow curves back into the joined list to close a visible ring — 29 of 30 odd lengths cycle, 0 of 30 even.
- Placing them adjacently makes the complementarity the point.
- The close gives two bars per approach: dereferences on the left, microseconds on the right.
- The weave's dereference bar is two and a half times the dummy version's while its time bar is the same height.
- That mismatch, standing alone without a caption, is the measurement worth remembering.

<!-- @edgeCases -->
- The empty list — returned unchanged by the early guard, before any dereference.
- A single node — returned unchanged, and the one odd length where the missing-terminator bug does not bite, since there is no even node.
- Two nodes — already in the required order, and the shortest list that crashes the `while (even)` version.
- Three nodes — the shortest list that actually moves anything, and the shortest that cycles without the terminator.
- Any even-length list — the even runner ends on the final node, which is what the second half of the guard exists for.
- Any odd-length list — the final node joins the odd chain, which is why the even tail must be terminated explicitly in the dummy-head version.
- A list whose values happen to equal their positions — passes even a value-based misreading, so it cannot distinguish the two interpretations.
- A list of all-identical values — correct, and useless as a test, since any permutation looks the same.
- An outside pointer held into the list — survives the two relinking versions with its value intact, and sees a changed value after the copy-values version.
- A list long enough for cache effects to matter — permuting it degrades traversal locality, which is what makes repeated-call benchmarks lie.
- The returned head — always the original first node for the relinking versions, since position 1 is odd and stays at the front.

<!-- @pitfalls -->
- Writing `while (even)` instead of `while (even && even->next)`. Crashes on every even-length list and no odd-length one — 30 of 30 either way.
- Forgetting `evenTail->next = nullptr` in the dummy-head version. Cycles on 29 of 30 odd-length lists and no even ones, silently.
- Testing on a single parity. The two bugs above are exact complements, so one parity always reports the other as absent.
- Partitioning by `p->data % 2` rather than by position. That is a different problem; value-based grouping belongs to **Sort a Linked List of 0's 1's and 2's**.
- Testing on a list whose values equal their positions. It passes under either interpretation and therefore proves nothing.
- Forgetting to save `evenHead` before the loop. `head->next` stops pointing at it on the very first iteration.
- Joining the odd tail to `evenTail` instead of the even chain's **first** node.
- Rewriting values instead of relinking nodes. The sequence is right and anything holding a node pointer now sees different data at the same address.
- Timing the operation by calling it repeatedly on the same list. It permutes its input, so successive calls degrade — measured from 3,621us to 20,850us on the same list.
- Assuming fewer dereferences means faster. The weave does 2.5x more and ties in C++, then wins by 2x in Python.
- Interleaving the two groups instead of concatenating them in the copy-values version. The odd group must come first, entire.

<!-- @doubt -->
### Odd and even what — positions or values?

<!-- @answer -->
Positions, counted from 1. The task is to bring every odd-numbered node to the front, then every even-numbered one, with the original relative order kept inside each group. Grouping by **value** is a genuinely different problem and this topic covers it separately, under **Sort a Linked List of 0's 1's and 2's**, which is the general technique for partitioning by a property of the data. The distinction is easy to blur because the textbook example, `1 2 3 4 5`, has values identical to positions — so it produces `1 3 5 2 4` under either reading and cannot tell them apart. Test with values that disagree with positions, and check the implementation itself: the positional version counts as it walks, while a value-based one tests `p->data % 2`. If you see the node's data inside the branch, it is answering the other question.

<!-- @doubt -->
### Why does the loop condition need two checks?

<!-- @answer -->
Because the body dereferences two links, one of them through a pointer that has just moved. `while (even)` guarantees only that `even` is usable — but the body then runs `odd->next = even->next`, which can make `odd` null, and the next line immediately dereferences `odd`. Whether that happens depends entirely on parity: on an **even**-length list the even runner eventually stands on the final node, whose `next` is null, and the crash follows; on an **odd**-length list the runner becomes null one beat sooner and the loop exits first. Measured over lengths 1 to 60, the single-check version crashed on **30 of 30 even lengths and 0 of 30 odd ones**. This is the third time this topic has produced a parity bug — the `while (fast)` crash in **Detect a loop** and the both-move-two failure in **Find the starting point** are the same shape — and the pattern is always that a test suite drawn from one parity is not a test.

<!-- @doubt -->
### Do I need to terminate the even chain?

<!-- @answer -->
In the dummy-head version, yes, and forgetting is the second classic bug here. On an **odd**-length list the final node sits at an odd position, so it goes to the odd chain — which leaves the even chain's last node still pointing forward, at a node that is now behind it in the joined list. That closes a cycle, measured on **29 of 30 odd lengths** from 1 to 60, with `n = 1` the only exception because it has no even node at all. On even lengths nothing goes wrong, because the final node **is** the even tail and its `next` was already null: **0 of 30**. The weave version never needs the line, and it is worth seeing why — its `even->next = odd->next` assigns null automatically on the last iteration, because `odd` has landed on the final node by then. That is one real advantage of the weave: a step you cannot forget beats a step you must remember.

<!-- @doubt -->
### The dummy-head version touches fewer pointers. Is it faster?

<!-- @answer -->
In C++ it is not, and in Python it is considerably slower. It really does walk the list exactly once where the weave re-reads pointers as it goes — **100,000 dereferences against 249,998** at a hundred thousand nodes, a 2.5x difference. Timed over five runs of 300 freshly built lists, the two came out at **228.29us and 230.00us**, swapping places between runs. The extra reads cost nothing because they are re-reads of pointers already in L1 cache; both versions visit the same nodes in the same order, and that traversal is where the time actually goes. In Python the weave is about **2x faster** — 4,057us against 8,299us — because CPython charges per bytecode rather than per dereference, and the dummy-head loop carries a branch and a counter increment on every node. Choose between them for readability, or for the terminator you cannot forget.

<!-- @doubt -->
### Why did my benchmark get slower every time I ran it?

<!-- @answer -->
Because the operation permutes its input, so each call runs on a list the previous call rearranged. Every pass moves nodes further from the order they were allocated in, traversal gets progressively worse at using the cache, and the measured time climbs. Six successive calls on a million-node list ran **3,621us, 2,632, 4,202, 8,141, 11,773 and 20,850** — roughly a sixfold drift. Rebuilding the list before each timed call gives a stable 1,533–2,072us instead. This matters beyond the number being wrong: the first version of these measurements was inflated about **tenfold** and it reversed the ranking of two of the three approaches, which is the kind of error that survives into a conclusion. Every timing quoted here is a single call on a freshly built list with the construction excluded, and the same discipline applies to any operation that mutates what it is given — reversal and sorting included.

<!-- @doubt -->
### Does this change the nodes or just their values?

<!-- @answer -->
The two relinking versions move **nodes**; the copy-values version moves **values** and leaves every node exactly where it is. They produce identical output and are different operations, the same distinction **Reverse a LinkedList** measured. It matters whenever a node has identity — a caller holding a pointer into the list, another structure splicing through the same nodes, a cache keyed by node address — because after the copy-values version that caller finds different data at the same address, while after a relink the node kept its data and moved. It also matters for cost: relinking moves 8-byte pointers, whereas copying moves whole values, which is part of why that version measured **608.33us against 228.29us**. Both relinking versions were verified over lengths 0 to 200 to return the same set of nodes with nothing lost or duplicated, and to keep each group's relative order.
