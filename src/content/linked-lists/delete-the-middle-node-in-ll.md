---
id: delete-the-middle-node-in-ll
topic: Linked Lists
title: Delete the middle node in LL
difficulty: Medium
status: ready
prerequisites:
  - middle-of-a-linkedlist-tortoisehare-method
  - remove-nth-node-from-the-back-of-the-ll
  - deletion-of-the-head-of-ll
  - find-the-length-of-the-linked-list
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - middle-of-a-linkedlist-tortoisehare-method
  - remove-nth-node-from-the-back-of-the-ll
  - deletion-of-the-head-of-ll
  - check-if-ll-is-palindrome-or-not
  - sort-ll
---

<!-- @summary -->
Finding the middle is a solved problem in this topic; deleting it is not the same problem, because the pointer you need is the one **before** it. Reusing the tortoise-hare unchanged removes the neighbour instead — index `⌊n/2⌋ + 1` — and crashes only at `n = 2`. And the cost result from the previous subtopic reproduces exactly: counting the length first does **25% fewer** pointer reads and runs **1.7x slower**.

<!-- @theory -->
## Which node is the middle?

The node at index `⌊n / 2⌋`, counting from zero — the **second** of the two
middles when the length is even. That is precisely the node
**Middle of a LinkedList** returns, so the finding half of this problem is
already done:

| n | Before | After | Index removed |
|---|---|---|---|
| 1 | `0` | *(empty)* | 0 |
| 2 | `0 1` | `0` | 1 |
| 3 | `0 1 2` | `0 2` | 1 |
| 4 | `0 1 2 3` | `0 1 3` | 2 |
| 5 | `0 1 2 3 4` | `0 1 3 4` | 2 |
| 6 | `0 1 2 3 4 5` | `0 1 2 4 5` | 3 |
| 7 | `0 1 2 3 4 5 6` | `0 1 2 4 5 6` | 3 |

Verified for every length from 1 to 400.

## Finding it is not deleting it

Removing a node from a singly linked list means pointing its **predecessor**
past it, and the tortoise-hare walk hands you the middle itself. Reusing it
unmodified — taking the middle and deleting `slow->next` — removes the node
after the middle:

| n | Correct | Plain tortoise-hare | |
|---|---|---|---|
| 2 | `0` | **crash** | |
| 3 | `0 2` | `0 1` | removed index 2, not 1 |
| 4 | `0 1 3` | `0 1 2` | removed index 3, not 2 |
| 5 | `0 1 3 4` | `0 1 2 4` | removed index 3, not 2 |
| 6 | `0 1 2 4 5` | `0 1 2 3 5` | removed index 4, not 3 |
| 7 | `0 1 2 4 5 6` | `0 1 2 3 5 6` | removed index 4, not 3 |

It removes index `⌊n/2⌋ + 1` every time, and crashes only at `n = 2`, where
there is no node past the middle. This is the same failure shape as the
off-by-one gap in **Remove Nth node from the back**: a well-formed list of
exactly the right length, with the wrong node gone.

The fix is to make the tortoise lag by one, and the neatest way is to start the
hare **two nodes ahead** instead of at the head:

```cpp
Node* deleteMiddle(Node* head) {
    if (head == nullptr || head->next == nullptr) { delete head; return nullptr; }
    Node* slow = head;
    Node* fast = head->next->next;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    Node* dead = slow->next;
    slow->next = dead->next;
    delete dead;
    return head;
}
```

Giving the hare a two-node head start makes the tortoise finish one node earlier
than it otherwise would — exactly the offset needed.

## The single-node case is the only guard you need

`head->next->next` dereferences two links, so a one-node list breaks it. That is
the entire purpose of the opening `if`, and it also produces the right answer:
deleting the middle of a one-node list leaves nothing, so the function returns
null. Without the guard the code is correct for every `n ≥ 2` and crashes on
`n = 1` — the same "correct everywhere except one boundary" pattern the dummy
head solved in the previous subtopic.

Note that no dummy node is needed here. The middle of a list with two or more
nodes is never the head, since `⌊n/2⌋ ≥ 1` whenever `n ≥ 2`, so there is always a
real predecessor to unlink from.

## Fewer pointer reads, slower again

The alternative is to measure the list and walk to `n/2 − 1`. Counted exactly:

| n | Hare two ahead | Count first |
|---|---|---|
| 1,000 | 2,001 | **1,501** |
| 100,000 | 200,001 | **150,001** |
| 1,000,000 | 2,000,001 | **1,500,001** |

The hare-ahead version reads `2n` pointers; counting first reads `1.5n` — a
genuine **25% fewer**. And it is the slower one:

| n | Hare two ahead | Explicit predecessor | Count first |
|---|---|---|---|
| 1,000 | 0.88us | **0.75us** | 1.29us |
| 1,000,000 | **967.58us** | 1,049.88us | 1,623.33us |

Counting first is about **1.7x slower** while doing three-quarters of the pointer
work. Python agrees, at roughly 2.1x:

| n | Hare two ahead | Explicit predecessor | Count first |
|---|---|---|---|
| 1,000 | 10.21us | 10.54us | 21.88us |
| 200,000 | 2,562us | **2,222us** | 5,270us |

This is the second subtopic in a row to produce that result. **Remove Nth node
from the back** found the same inversion, tested the obvious cache explanation
and **refuted** it — the advantage survives on a list small enough to sit
entirely in L1. Two independent measurements now show the same thing, and the
cause is still not established here. What can be said is narrow and worth
saying anyway: on this machine, walking a list once with two pointers is
consistently cheaper than walking it twice with one, and pointer-read counts do
not predict it.

<!-- @intuition -->
The useful idea in this problem is that finding a node and deleting it are different jobs, and the second one needs a different pointer than the first. A singly linked list can only be edited from in front of the target, so any algorithm that hands you the target itself has stopped one node short of useful. Once that is clear, the fixes are all the same move — lag the pointer by one — and they differ only in where the lag is introduced: start the fast pointer ahead, carry a trailing pointer, or compute the index and walk to one before it. The rest of the interest is in a result that has now shown up twice in a row and still has no explanation. Counting the list first does measurably less pointer-following and is measurably slower, on two different problems, in two languages. The honest position is that the operation count is not the thing being measured by the clock, that the obvious explanation was tested and failed, and that this is a perfectly ordinary state to be in — knowing that something reproduces is worth more than a story about why it happens that has not been checked.

<!-- @approach -->
### Optimal - Start the Hare Two Ahead

<!-- @idea -->
Give the fast pointer a two-node head start so the slow pointer finishes on the node before the middle rather than on the middle itself.

<!-- @steps -->
1. If the list is empty or has one node, delete it and return null — there is no predecessor and no list left.
2. Put `slow` on the head and `fast` two nodes further along.
3. While `fast` and the node after it both exist, advance `slow` by one and `fast` by two.
4. When the loop ends, `slow` is on the node immediately before the middle.
5. Unlink `slow->next`, free it, and return the head.

<!-- @complexity -->
- time: O(n) — one traversal with two pointers
- space: **O(1)** — two pointers
- note: The one to write. It reads `2n` pointers against the counting version's `1.5n` and is about **1.7x faster** anyway — the same inversion measured in **Remove Nth node from the back**, where the obvious cache explanation was tested and refuted. No dummy node is needed: for `n ≥ 2` the middle is never the head, since `⌊n/2⌋ ≥ 1`.

<!-- @code cpp -->
```cpp
Node* deleteMiddle(Node* head) {
    if (head == nullptr || head->next == nullptr) { delete head; return nullptr; }
    Node* slow = head;
    Node* fast = head->next->next;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    Node* dead = slow->next;
    slow->next = dead->next;
    delete dead;
    return head;
}
```

<!-- @annotations -->
- 4: The two-node head start is the whole trick. Starting `fast` at `head` instead leaves `slow` **on** the middle, which deletes index `n/2 + 1` — the neighbour — and crashes at `n = 2`.
- 2: The only guard needed, and it is also the answer: a one-node list has nothing left after its middle is removed, so null is correct. Without it, line 4 dereferences two links on a list that has one.
- 10: Reading `dead->next` before the free on the next line, the ordering rule from **Deletion of the head**.
- 12: Returning `head`, not `slow`. The head never changes here, because the middle of a list of two or more is never the first node.

<!-- @code java -->
```java
static Node deleteMiddle(Node head) {
    if (head == null || head.next == null) return null;
    Node slow = head;
    Node fast = head.next.next;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    slow.next = slow.next.next;
    return head;
}
```

<!-- @annotations -->
- 9: The unlink is the whole deletion — the collector reclaims the node once nothing points at it.

<!-- @code python -->
```python
def delete_middle(head):
    if head is None or head.next is None:
        return None
    slow = head
    fast = head.next.next
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    slow.next = slow.next.next
    return head


# `head.next.next` is why the one-node guard has to come first --
# it follows two links on a list that might only have one.
```

<!-- @annotations -->
- 5: Two links followed on this line, which the guard above has just made safe.

<!-- @approach -->
### Carry an Explicit Predecessor

<!-- @idea -->
Run the ordinary tortoise and hare, but remember where the tortoise was on the previous step.

<!-- @steps -->
1. Return null for a list of zero or one node, as before.
2. Start `prev` at null, and `slow` and `fast` both at the head.
3. While `fast` and the node after it both exist, set `prev` to `slow`, then advance `slow` by one and `fast` by two.
4. When the loop ends, `slow` is on the middle and `prev` is on the node before it.
5. Point `prev->next` past `slow`, free `slow`, and return the head.

<!-- @complexity -->
- time: O(n) — one traversal
- space: **O(1)** — three pointers
- note: The same algorithm with the offset made explicit rather than folded into the starting position, and it is easier to read for exactly that reason: `slow` really is the middle and `prev` really is its predecessor, so nothing has to be reasoned about. It costs one extra assignment per iteration and measured within noise of the hare-ahead version — slightly faster at small sizes, slightly slower at a million nodes. Choose on clarity.

<!-- @code cpp -->
```cpp
Node* deleteMiddleWithPrev(Node* head) {
    if (head == nullptr || head->next == nullptr) { delete head; return nullptr; }
    Node* prev = nullptr;
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        prev = slow;
        slow = slow->next;
        fast = fast->next->next;
    }
    prev->next = slow->next;
    delete slow;
    return head;
}
```

<!-- @annotations -->
- 7: The lag introduced explicitly. This line is doing the same job as the two-node head start in the other version.
- 11: `prev` is guaranteed non-null here because the guard on line 2 means the loop body runs at least once for any list reaching this point.
- 5: `fast` starts at the head, unmodified — this is the tortoise-hare exactly as **Middle of a LinkedList** defines it, so `slow` genuinely ends on the middle.

<!-- @code java -->
```java
static Node deleteMiddleWithPrev(Node head) {
    if (head == null || head.next == null) return null;
    Node prev = null, slow = head, fast = head;
    while (fast != null && fast.next != null) {
        prev = slow;
        slow = slow.next;
        fast = fast.next.next;
    }
    prev.next = slow.next;
    return head;
}
```

<!-- @annotations -->
- 3: Declaring all three on one line keeps the relationship between them visible, which is the point of this variant.

<!-- @code python -->
```python
def delete_middle_with_prev(head):
    if head is None or head.next is None:
        return None
    prev = None
    slow = fast = head
    while fast is not None and fast.next is not None:
        prev = slow
        slow = slow.next
        fast = fast.next.next
    prev.next = slow.next
    return head
```

<!-- @annotations -->
- 7: One extra assignment per iteration, which buys the reader the fact that `slow` is the middle and `prev` is the node before it.

<!-- @approach -->
### Count the Length, Then Walk

<!-- @idea -->
Measure the list, then walk directly to the node before index `n/2`.

<!-- @steps -->
1. Walk the list once, counting nodes.
2. If the count is zero or one, delete the head and return null.
3. Start at the head and advance `n/2 − 1` times, landing on the predecessor.
4. Unlink the node after it and free that node.
5. Return the head.

<!-- @complexity -->
- time: O(n) — two traversals covering `1.5n` nodes between them
- space: **O(1)** — a pointer and a counter
- note: It touches **25% fewer** pointers than the hare-ahead version — 1,500,001 against 2,000,001 at a million nodes — and runs about **1.7x slower**, which is the second time this topic has measured that inversion. Its real advantage is that the index is written down: `n/2 − 1` can be checked against the table of which node the middle is, where the other two versions require reasoning about where a pointer lands.

<!-- @code cpp -->
```cpp
Node* deleteMiddleByCount(Node* head) {
    long length = 0;
    for (Node* p = head; p != nullptr; p = p->next) length++;
    if (length <= 1) { delete head; return nullptr; }

    Node* prev = head;
    for (long i = 0; i < length / 2 - 1; i++) prev = prev->next;

    Node* dead = prev->next;
    prev->next = dead->next;
    delete dead;
    return head;
}
```

<!-- @annotations -->
- 7: `length / 2 - 1` steps from the head lands on the predecessor of index `length / 2`. The guard above is what keeps this expression from going negative.
- 4: Handling zero and one together. At `length == 1` the subtraction on line 7 would be `-1`, so this branch is load-bearing rather than tidy.
- 2: A signed counter, so that if the guard were ever removed the expression on line 7 would go negative rather than wrapping to an enormous count.

<!-- @code java -->
```java
static Node deleteMiddleByCount(Node head) {
    long length = 0;
    for (Node p = head; p != null; p = p.next) length++;
    if (length <= 1) return null;

    Node prev = head;
    for (long i = 0; i < length / 2 - 1; i++) prev = prev.next;

    prev.next = prev.next.next;
    return head;
}
```

<!-- @annotations -->
- 3: The counting pass is also the cheapest place to reject input, which the single-traversal versions cannot do without walking anyway.

<!-- @code python -->
```python
def delete_middle_by_count(head):
    length = 0
    p = head
    while p is not None:
        length += 1
        p = p.next
    if length <= 1:
        return None

    prev = head
    for _ in range(length // 2 - 1):
        prev = prev.next

    prev.next = prev.next.next
    return head


# 25% fewer pointer reads than the hare-ahead version and about
# 2.1x slower here -- the same inversion measured in Remove Nth.
```

<!-- @annotations -->
- 11: Integer division, deliberately. `length / 2` would be a float and `range` would reject it.

<!-- @example -->

<!-- @input -->
`0 -> 1 -> 2 -> 3 -> 4`

<!-- @output -->
`0 -> 1 -> 3 -> 4`

<!-- @why -->
An odd-length trace showing where the two-node head start puts the tortoise.

<!-- @walkthrough -->
1. The length is 5, so the middle is index `⌊5/2⌋ = 2` — the node holding 2.
2. `slow` starts on node 0 and `fast` starts two ahead, on node 2.
3. The guard checks `fast` and `fast->next`: node 2 and node 3 both exist, so the loop runs.
4. `slow` advances to node 1 and `fast` advances two, to node 4.
5. The guard now finds `fast->next` is null, so the loop ends with `slow` on node 1.
6. Node 1 is the predecessor of node 2 — exactly what a deletion needs.
7. `slow->next` is set to node 3, node 2 is freed, and the result is `0 1 3 4`.

<!-- @example -->

<!-- @input -->
The tortoise-hare reused unchanged, with `fast` starting at the head

<!-- @output -->
Removes index `⌊n/2⌋ + 1` — the node after the middle — and crashes only at `n = 2`

<!-- @why -->
The central mistake: solving the finding problem and assuming it solves the deleting problem.

<!-- @walkthrough -->
1. The ordinary tortoise-hare leaves `slow` **on** the middle, which is what **Middle of a LinkedList** is for.
2. Deleting means unlinking `slow->next`, so what actually disappears is the node **after** the middle.
3. On `0 1 2 3 4` that gives `0 1 2 4` — index 3 removed, when index 2 was wanted.
4. Measured across lengths 3 to 7, it removed index `⌊n/2⌋ + 1` every time.
5. At `n = 2` the middle is the last node, so there is nothing after it and the code dereferences null.
6. Every other case returns a valid list of exactly the right length, with the wrong node missing.
7. This is the same failure shape as the off-by-one gap in **Remove Nth node from the back** — plausible output, silently wrong.

<!-- @example -->

<!-- @input -->
A one-node list

<!-- @output -->
An empty list, or a crash without the guard

<!-- @why -->
The only boundary this problem has, and the reason the opening `if` is not decoration.

<!-- @walkthrough -->
1. The middle of a one-node list is index `⌊1/2⌋ = 0` — the node itself.
2. Deleting it leaves nothing, so the correct return value is null.
3. The hare-ahead version reads `head->next->next`, which follows two links.
4. On a one-node list `head->next` is null, so that expression dereferences null.
5. Measured: without the guard the function is correct for every `n ≥ 2` and crashes at `n = 1`.
6. That is the same shape as the missing dummy head in the previous subtopic — correct everywhere but one boundary.
7. No dummy node is needed for anything else here, because for `n ≥ 2` the middle index `⌊n/2⌋` is at least 1, so the middle is never the head.

<!-- @example -->

<!-- @input -->
Pointer reads against wall-clock time for the two O(1) strategies

<!-- @output -->
Counting first does 25% fewer reads and runs 1.7x slower

<!-- @why -->
The same inversion the previous subtopic measured, now reproduced on a different problem.

<!-- @walkthrough -->
1. The hare-ahead version moves two pointers through one traversal, reading about `2n` pointers.
2. Counting first walks the list once to measure it, then walks half of it again — about `1.5n`.
3. Counted exactly at a million nodes: 2,000,001 against 1,500,001.
4. Timed at the same size: 967.58us for the hare-ahead version against 1,623.33us for counting first.
5. So the version doing three-quarters of the pointer work takes about **1.7 times** as long.
6. Python shows the same ordering at roughly 2.1x — 2,562us against 5,270us at two hundred thousand nodes.
7. **Remove Nth node from the back** measured this inversion first and tested the obvious cache explanation, which **failed**; two independent results now agree that it reproduces, and the cause remains unestablished.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the list horizontally with 0-based indices under every node, and mark index `⌊n/2⌋` in a distinct colour from the first frame — this problem is about a specific index, and naming it early prevents the whole "which middle" confusion. Use an even-length list so that the second-middle convention is visible rather than assumed. Then run the two pointers, but stage the head start explicitly: place the tortoise on the head, then show the hare being placed **two nodes along** rather than at the head, with that offset drawn as a small labelled gap. Step them together, and at the moment the loop ends put a bright marker on the tortoise and a second, differently-shaped marker on the middle it precedes, so the one-node lag is a visible relationship rather than a claim. The unlink follows as one rerouted arrow. The second panel is the mistake, run beside it on the same list: the hare starts at the head, the tortoise ends **on** the coloured middle instead of before it, and the arrow that gets rerouted jumps over the node beyond — so the reader watches index `⌊n/2⌋ + 1` disappear while the coloured node survives. Label the two outputs against each other. The third panel is the one-node list, shown twice: with the guard, returning an empty list; without it, the hare's placement reaching through a null `next` into nothing. Close with the cost comparison as two bars per strategy — pointer reads and microseconds — where the counting version's read bar is visibly the shorter one and its time bar visibly the longer, captioned with the note that this reproduces the previous subtopic's result and that the cause was tested and not found.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"whichNode":{"index":"floor(n/2), 0-based","note":"the SECOND of the two middles when n is even -- exactly the node Middle of a LinkedList returns","table":[{"n":1,"before":"0","after":"(empty)","removedIndex":0},{"n":2,"before":"0 1","after":"0","removedIndex":1},{"n":3,"before":"0 1 2","after":"0 2","removedIndex":1},{"n":4,"before":"0 1 2 3","after":"0 1 3","removedIndex":2},{"n":5,"before":"0 1 2 3 4","after":"0 1 3 4","removedIndex":2},{"n":6,"before":"0 1 2 3 4 5","after":"0 1 2 4 5","removedIndex":3},{"n":7,"before":"0 1 2 3 4 5 6","after":"0 1 2 4 5 6","removedIndex":3}],"verified":"every length 1..400"},"findingIsNotDeleting":{"principle":"removing a node means pointing its PREDECESSOR past it, and the tortoise-hare hands you the middle itself","reusedUnchanged":[{"n":2,"correct":"0","buggy":"CRASH"},{"n":3,"correct":"0 2","buggy":"0 1","note":"removed index 2, not 1"},{"n":4,"correct":"0 1 3","buggy":"0 1 2","note":"removed index 3, not 2"},{"n":5,"correct":"0 1 3 4","buggy":"0 1 2 4","note":"removed index 3, not 2"},{"n":6,"correct":"0 1 2 4 5","buggy":"0 1 2 3 5","note":"removed index 4, not 3"},{"n":7,"correct":"0 1 2 4 5 6","buggy":"0 1 2 3 5 6","note":"removed index 4, not 3"}],"pattern":"removes index floor(n/2) + 1 every time; crashes only at n = 2 where there is no node past the middle","sameShapeAs":"the off-by-one gap in Remove Nth node from the back -- a well-formed list of exactly the right length with the wrong node gone","fix":"give the hare a two-node head start, which makes the tortoise finish one node earlier"},"theOnlyGuard":{"case":"a one-node list","why":"head->next->next follows two links on a list that has one","withoutIt":"correct for every n >= 2, crashes at n = 1","alsoTheAnswer":"deleting the middle of a one-node list leaves nothing, so null is correct","noDummyNeeded":"for n >= 2 the middle index floor(n/2) is at least 1, so the middle is never the head and a real predecessor always exists"},"dereferences":{"rows":[{"n":1000,"hareAhead":2001,"countFirst":1501},{"n":100000,"hareAhead":200001,"countFirst":150001},{"n":1000000,"hareAhead":2000001,"countFirst":1500001}],"shape":"hare-ahead reads about 2n; counting first reads about 1.5n -- a genuine 25% fewer"},"benchCpp":{"unit":"microseconds, median of fresh-list single calls, three runs","rows":[{"n":1000,"hareAhead":0.88,"explicitPrev":0.75,"countFirst":1.29},{"n":1000000,"hareAhead":967.58,"explicitPrev":1049.88,"countFirst":1623.33}],"verdict":"counting first does three-quarters of the pointer work and takes about 1.7 times as long"},"benchPython":{"unit":"microseconds, median of fresh-list single calls, three runs","rows":[{"n":1000,"hareAhead":10.21,"explicitPrev":10.54,"countFirst":21.88},{"n":200000,"hareAhead":2562.23,"explicitPrev":2222.48,"countFirst":5269.98}],"verdict":"same ordering, about 2.1x"},"theInversion":{"firstMeasuredIn":"Remove Nth node from the back","hypothesisTestedThere":"the trailing pointer reuses cache lines the leading pointer just fetched","result":"REFUTED -- the advantage survives on a list small enough to sit entirely in L1","statusNow":"two independent measurements on two different problems agree that it reproduces; the cause is still not established","whatCanBeSaid":"on this machine, walking a list once with two pointers is consistently cheaper than walking it twice with one, and pointer-read counts do not predict it"},"recommendation":"the hare two ahead, or the explicit predecessor if you prefer the offset visible -- they measured within noise of each other","lesson":"finding a node and deleting it are different jobs, and the second needs the pointer one step behind the first"}
```

<!-- @highlights -->
- The list is drawn horizontally with 0-based indices under every node.
- Index `⌊n/2⌋` is marked in a distinct colour from the first frame, naming the target before any pointer moves.
- The list has even length, so the second-middle convention is visible rather than assumed.
- The head start is staged explicitly: the tortoise goes on the head, then the hare is placed **two nodes along**.
- That offset is drawn as a small labelled gap rather than left implicit.
- The two pointers step together to the end of the loop.
- A bright marker lands on the tortoise and a differently-shaped one on the middle it precedes.
- The one-node lag is therefore a visible relationship rather than a claim.
- The unlink follows as a single rerouted arrow.
- The second panel runs the mistake beside it on the same list, with the hare starting at the head.
- The tortoise ends **on** the coloured middle instead of before it.
- The rerouted arrow jumps the node beyond, so index `⌊n/2⌋ + 1` is watched disappearing while the coloured node survives.
- The two outputs are labelled against each other.
- The third panel shows the one-node list twice — with the guard returning empty, and without it reaching through a null `next` into nothing.
- The close pairs pointer-read and microsecond bars per strategy.
- The counting version's read bar is visibly shorter and its time bar visibly longer, captioned that this reproduces the previous subtopic's result and the cause was tested and not found.

<!-- @edgeCases -->
- A one-node list — the middle is the only node, the result is empty, and this is the single case the guard exists for.
- An empty list — returns null, handled by the same guard.
- A two-node list — the middle is the second node, the result is the first, and this is where the naive reuse crashes.
- A three-node list — the shortest case where the deleted node has something on both sides.
- An even-length list — the middle is the **second** of the two candidates, which is what `⌊n/2⌋` selects.
- An odd-length list — the middle is unambiguous and sits at `⌊n/2⌋` too, so no branch is needed.
- The head — never the node deleted for `n ≥ 2`, since `⌊n/2⌋ ≥ 1`, which is why no dummy node is required.
- The returned head — always the node passed in, except for the one-node case where it is null.
- Reading the doomed node's `next` before freeing it — required in C++, the same ordering rule as **Deletion of the head**.
- `length / 2 - 1` in the counting version — would be negative at `length == 1`, which is why the guard precedes it.
- A very long list — changes the measured timings but not which index is removed.

<!-- @pitfalls -->
- Reusing the tortoise-hare unchanged. The tortoise lands **on** the middle, so the unlink removes index `⌊n/2⌋ + 1` — the neighbour — and crashes only at `n = 2`.
- Testing only that the list got one node shorter. The mistake above passes that check on every length from 3 upward.
- Omitting the one-node guard. Correct for every `n ≥ 2` and a null dereference at `n = 1`, since `head->next->next` follows two links.
- Adding a dummy head out of habit. It is genuinely unnecessary here — the middle of a list of two or more is never the first node.
- Returning `slow` instead of `head`. The head is unchanged for every case except the one-node list.
- Freeing the target before reading its `next`. The unlink needs that pointer while the node is still alive.
- Computing `length / 2 - 1` before checking the length. At `length == 1` it is `-1`, which in an unsigned type becomes an enormous loop count.
- Assuming the counting version is cheaper because it reads fewer pointers. It reads 25% fewer and runs about 1.7x slower.
- Assuming the middle is the **first** of two for even lengths. It is the second — `⌊n/2⌋`, matching **Middle of a LinkedList**.
- Timing this by calling it repeatedly on one list. Each call removes a node, so later calls run on a shorter list.
- Explaining the speed difference with cache behaviour. That hypothesis was tested in the previous subtopic and refuted.

<!-- @doubt -->
### I already have the tortoise-hare middle. Why can't I just delete what it returns?

<!-- @answer -->
Because a singly linked list can only be edited from **in front of** the node you want gone, and the tortoise-hare hands you the node itself. Unlinking `slow->next` when `slow` is the middle removes the node **after** it — measured as index `⌊n/2⌋ + 1` on every length from 3 to 7. On `0 1 2 3 4` you get `0 1 2 4`, which has removed index 3 when index 2 was wanted. It crashes only at `n = 2`, where the middle is the last node and there is nothing beyond it to delete. Everywhere else it returns a well-formed list of exactly the right length with the wrong node missing, which is why it survives any test that checks the length rather than the contents. The general lesson is worth keeping: **finding** a node and **deleting** it are different jobs, and the second needs the pointer one step behind the first.

<!-- @doubt -->
### Why start the hare two nodes ahead?

<!-- @answer -->
Because it buys exactly the one-node lag the deletion needs, without adding a variable. The ordinary walk advances the tortoise once for every two hare steps and finishes with the tortoise on index `⌊n/2⌋`. Giving the hare a two-node head start means it reaches the end one iteration sooner, so the tortoise stops one node earlier — on the predecessor. If you would rather see the offset than reason about it, the explicit-predecessor version does the same thing by remembering where the tortoise was on the previous step, and it measured within noise of this one: 0.75us against 0.88us at a thousand nodes, and 1,049us against 967us at a million. They are the same algorithm with the lag introduced in different places, so pick on readability.

<!-- @doubt -->
### Do I need a dummy head like the previous problem?

<!-- @answer -->
No, and it is worth knowing why not, since the habit is a good one elsewhere. A dummy exists to give the head a predecessor for the case where the head is what gets removed. Here that case cannot arise: for any list of two or more nodes the middle is at index `⌊n/2⌋`, which is at least 1, so the middle is never the first node and a real predecessor always exists. The one situation where the head **is** the target is a single-node list, and that has no meaningful "unlink" at all — the answer is simply an empty list. So the guard on the first line handles it directly and returns null. Adding a dummy would not be wrong, just unnecessary; the guard you genuinely cannot skip is the one-node check, because `head->next->next` follows two links on a list that might only have one.

<!-- @doubt -->
### Is counting the length first simpler? It looks like less work.

<!-- @answer -->
It is easier to justify and measurably slower. Its appeal is real: `length / 2 - 1` is an index you can check against a table, where the pointer versions require reasoning about where a walk lands. It also touches **fewer pointers** — about `1.5n` against the hare-ahead version's `2n`, which is 1,500,001 against 2,000,001 at a million nodes, a genuine 25% saving. And it ran about **1.7x slower**: 1,623us against 967us in C++, and 5,270us against 2,562us in Python. That is the second time this topic has measured a version doing less pointer-following and losing on the clock; **Remove Nth node from the back** found the same thing and tested the obvious cache explanation, which failed. So the honest recommendation is to use the pointer version and know that the operation count is not what the clock is measuring.

<!-- @doubt -->
### Which node is "the middle" when the length is even?

<!-- @answer -->
The **second** of the two candidates — index `⌊n / 2⌋` counting from zero. On `0 1 2 3` that is the node holding 2, so the result is `0 1 3`. This matters because it is a convention rather than a deduction, and the opposite choice is equally defensible in the abstract; what settles it here is that this is the node **Middle of a LinkedList** already returns, so the two subtopics agree and the tortoise-hare walk needs no adjustment beyond the one-node lag. If you are ever unsure which convention a problem wants, the fastest check is a length-2 list: under this definition it leaves the **first** node, and under the other it would leave the second. Every result in this container was verified against the `⌊n/2⌋` definition for every length from 1 to 400.

<!-- @doubt -->
### How should I test this?

<!-- @answer -->
Check *which* node left, not just that one did — and include the two short lists. Both plausible mistakes here produce a valid list of exactly the right length: reusing the tortoise-hare unchanged removes index `⌊n/2⌋ + 1`, and both versions are otherwise well-behaved. So a suite that deletes from a few medium lists and asserts the new length passes with the bug present. The cases that actually discriminate are `n = 1` (which must return an empty list, and crashes without the guard), `n = 2` (which crashes under the naive reuse), and any list of three or more compared against its full expected contents. The verification behind this container did exactly that: every length from 1 to 400, each result compared element by element against the input with index `⌊n/2⌋` removed, across three independent implementations.
