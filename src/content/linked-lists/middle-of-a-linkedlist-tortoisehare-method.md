---
id: middle-of-a-linkedlist-tortoisehare-method
topic: Linked Lists
title: Middle of a LinkedList [TortoiseHare Method]
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-singly-linkedlist
  - find-the-length-of-the-linked-list
  - search-in-linked-list
  - while-loop
  - largest-element
  - time-and-space-complexity-basics
relatedIds:
  - find-the-length-of-the-linked-list
  - detect-a-loop-in-ll
  - find-the-starting-point-in-ll
  - delete-the-middle-node-in-ll
  - remove-nth-node-from-the-back-of-the-ll
---

<!-- @summary -->
Two pointers, one moving twice as fast — where the famous one-pass advantage turns out **not** to be less work: counted exactly, both approaches perform **1.5n pointer dereferences**, identical at every size. What the tortoise and hare actually save is **loop iterations**, n/2 against 1.5n, which is invisible in C++ (measured 0.66x to 1.44x, non-monotonic) and worth a consistent **2.8x** in Python. And on an even-length list, one character in the loop condition decides which of the two middles you get.

<!-- @theory -->
## The problem

Return the middle node of a singly linked list.

```
1 -> 2 -> 3 -> 4 -> 5 -> null        middle is 3
          ^

1 -> 2 -> 3 -> 4 -> 5 -> 6 -> null   middle is... 3 or 4?
               ^
```

The odd case is unambiguous. The even case is not, and the specification has to
say which one it wants — the standard statement asks for the **second** middle.

## The obvious approach, and the one everyone quotes

**Count, then walk.** Traverse once to get the length, then traverse again `n/2`
steps. Two passes, obviously correct.

**Tortoise and hare.** Move one pointer one node at a time and another two nodes
at a time. When the fast one runs off the end, the slow one is at the middle —
because it has taken exactly half as many steps.

The second is presented as the clever one, and the usual justification is that it
does the job in a single pass. It is worth checking what that is actually worth.

## Both do exactly the same amount of pointer chasing

Counted precisely rather than estimated:

| n | Two-pass `next` reads | Tortoise-hare `next` reads |
|---|---|---|
| 1,000 | 1,500 | **1,500** |
| 10,000 | 15,000 | **15,000** |
| 100,000 | 150,000 | **150,000** |

Identical, and it is easy to see why once stated. The two-pass version reads `n`
links counting and `n/2` walking — 1.5n. The hare reads two links per step and
the tortoise one, over n/2 steps — also 1.5n.

**The single pass is not fewer memory accesses.** It is the same accesses,
arranged differently.

## What it does save is loop iterations

| n | Two-pass iterations | Tortoise-hare iterations |
|---|---|---|
| 1,000 | 1,500 | **500** |
| 10,000 | 15,000 | **5,000** |
| 100,000 | 150,000 | **50,000** |

A factor of **three**, because the hare does three link reads inside one
iteration where the two-pass version spreads them across three iterations.

Whether that matters depends entirely on what an iteration costs.

## In C++ it barely matters, and the sign flips

Work-normalised so every size gets similar total work, three runs each:

| n | Two-pass | Tortoise-hare | Ratio across three runs |
|---|---|---|---|
| 1,000 | ~0.57us | ~0.84us | **0.66x, 0.71x, 0.66x** |
| 10,000 | ~12.6us | ~9.4us | 1.33x, 1.33x, 1.34x |
| 100,000 | ~125us | ~88us | 1.43x, 1.36x, 1.44x |
| 1,000,000 | 619-807us | 725-810us | 1.00x, 0.85x, 0.82x |

Read the first row: at a thousand nodes the **two-pass version is about 1.5x
faster**, reproducibly. In the middle band the tortoise-hare wins by around 1.4x.
At a million they are within noise of each other and the ordering flips again.

That is not a ringing endorsement of either, and it should not be — the
dereference counts are identical, so what is left is second-order effects that
move with size. A loop iteration in optimised C++ costs almost nothing, so
removing two thirds of them buys almost nothing.

**Do not choose the tortoise and hare here because it is faster.** In C++ it is
sometimes slower.

## In Python it matters a great deal

| n | Two-pass | Tortoise-hare | Ratio |
|---|---|---|---|
| 1,000 | 21.30us | 8.59us | **2.48x** |
| 10,000 | 248.41us | 88.47us | **2.81x** |
| 100,000 | 2,510.13us | 890.02us | **2.82x** |

Consistent, at every size, and it follows directly from the iteration count. Every
Python loop iteration carries interpreter overhead that dwarfs an attribute
lookup, so doing a third as many iterations is worth close to a third of the time
— and the identical attribute-lookup count never shows up.

The same algorithm, the same asymptotics, and the same exact memory-access count
give 0.66x in one language and 2.82x in the other. Which is worth remembering as
a general point: "one pass instead of two" is a statement about loop structure,
and its value depends on what your loops cost.

## So why is it the technique everyone teaches

Because speed was never the reason.

**It needs only one pass.** That matters when a second pass is impossible or
expensive — a list arriving as a stream, a list being consumed, a structure where
traversal has side effects, or simply a list too large to want to touch twice.

**It never needs the length.** The previous subtopic measured that asking a linked
list for its length costs a full traversal, the same as reading every value.
Anything phrased as "compute the length, then use it" has already spent a whole
pass; the tortoise and hare answers positional questions without ever knowing how
long the list is.

**It generalises.** The same two pointers at different speeds detect a cycle, find
where a cycle begins, locate the n-th node from the end, and split a list for
merge sort. Four of the problems after this one are the same pattern with the
speeds or the starting offsets changed. This is where it is easiest to see.

## One character decides which middle you get

On an even-length list the two natural loop conditions give different answers:

```
while (fast && fast->next)               ->  second middle
while (fast->next && fast->next->next)   ->  first middle
```

Measured on lists of 1 to 6 nodes holding 0..n-1:

| n | Second-middle rule | First-middle rule |
|---|---|---|
| 1 | 0 | 0 |
| **2** | **1** | **0** |
| 3 | 1 | 1 |
| **4** | **2** | **1** |
| 5 | 2 | 2 |
| **6** | **3** | **2** |

They agree on every odd length and differ on every even one. The standard problem
wants the second middle, so `while (fast && fast->next)` is the one to write — but
several later problems, notably **splitting a list for merge sort** and
**deleting the middle node**, need the *first* middle, because they need the node
*before* the split point. Getting this backwards produces an answer that is off
by one only half the time, which is exactly the kind of bug that survives a small
test.

Both versions were checked against the count-then-walk approach over every length
from 1 to 2000: **zero disagreements**.

<!-- @intuition -->
The trick is a small piece of arithmetic dressed as a race: if one pointer moves twice as fast as another and they start together, then whenever the fast one has covered the whole list the slow one has covered exactly half of it. No length is needed because the end of the list announces itself, and the slow pointer's position is defined relative to that arrival rather than to any count. What is worth being careful about is why this is better, because the usual answer — that one pass beats two — does not survive counting. Both approaches touch the same 1.5n links; the fast version simply packs three of those reads into each iteration instead of spreading them over three. That distinction is invisible in a compiled language and decisive in an interpreted one, which is a useful reminder that "fewer passes" is a claim about loop structure rather than about memory traffic. The real reason to learn it is that it answers a positional question without ever measuring the list, and that same manoeuvre — two pointers, different speeds — is about to solve cycle detection, cycle entry, n-th from the end, and the merge-sort split.

<!-- @approach -->
### Count, Then Walk Half

<!-- @idea -->
Find the length on one pass, then take half that many steps on a second.

<!-- @steps -->
1. Walk the list once, counting the nodes.
2. Return null immediately if the list is empty.
3. Start again from the head.
4. Take `n / 2` steps forward.
5. Return the node arrived at.

<!-- @complexity -->
- time: O(n) — 1.5n link reads across two passes
- space: O(1)
- note: Obviously correct and the right first version to write, and it is **not** slower in any meaningful sense: it performs exactly the same 1,500 link reads at n = 1,000 as the tortoise-hare, and measured about **1.5x faster** at that size in C++. Its real costs are structural — it needs two passes over the data, and it needs the length, which the previous subtopic measured as a full traversal in its own right.

<!-- @code cpp -->
```cpp
Node* middleTwoPass(Node* head) {
    int n = 0;
    for (Node* p = head; p != nullptr; p = p->next) n++;

    Node* p = head;
    for (int i = 0; i < n / 2; i++) p = p->next;
    return p;
}
```

<!-- @annotations -->
- 6: `n / 2` with integer division gives the **second** middle on even lengths — index 2 of 0..3 — which matches the standard specification. Using `(n - 1) / 2` gives the first middle instead.
- 3: The counting pass. This alone is as expensive as reading every value in the list, which is the structural argument against needing it at all.
- 1: Returns null for an empty list without a special case: the count is 0, the second loop runs zero times, and `p` is still the null head.

<!-- @code java -->
```java
static Node middleTwoPass(Node head) {
    int n = 0;
    for (Node p = head; p != null; p = p.next) n++;

    Node p = head;
    for (int i = 0; i < n / 2; i++) p = p.next;
    return p;
}
```

<!-- @annotations -->
- 6: Two separate loops mean the list is walked twice, which is fine for an in-memory list and impossible for anything consumed as it is read.

<!-- @code python -->
```python
def middle_two_pass(head):
    n = 0
    p = head
    while p is not None:
        n += 1
        p = p.next

    p = head
    for _ in range(n // 2):
        p = p.next
    return p


# 1.5n loop iterations, against n/2 for the tortoise-hare -- and in
# Python that is the whole story: 2,510.13us against 890.02 at
# n = 100,000, a factor of 2.82.
```

<!-- @annotations -->
- 9: `n // 2`, floor division, for the second middle. The identical rule as C++'s integer division, and equally easy to get backwards.

<!-- @approach -->
### Optimal - Tortoise and Hare

<!-- @idea -->
Move one pointer one step and another two; when the fast one reaches the end, the slow one is halfway.

<!-- @steps -->
1. Start both pointers at the head.
2. While the fast pointer and the node after it both exist, advance the slow pointer one node.
3. Advance the fast pointer two nodes.
4. Stop when the fast pointer reaches the end or falls off it.
5. Return the slow pointer.

<!-- @complexity -->
- time: O(n) — the same 1.5n link reads as the two-pass version, in n/2 iterations
- space: O(1)
- note: The one to write, and not because it is faster — measured 0.66x to 1.44x against the two-pass version in C++ depending on size, sometimes slower. It is worth it because it needs **one pass** and never needs the length, and because it is the template for cycle detection, cycle entry, n-th from the end and the merge-sort split. In Python the reduced iteration count is worth a consistent **2.8x**.

<!-- @code cpp -->
```cpp
Node* middle(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    return slow;
}
```

<!-- @annotations -->
- 4: This condition gives the **second** middle on even lengths. `while (fast->next && fast->next->next)` gives the first, and needs its own empty-list guard because it dereferences `fast` immediately. Both tests are required and the order matters — checking `fast->next` before `fast` would dereference a null pointer on an even-length list.
- 6: `fast->next->next` is safe precisely because the condition just established that `fast->next` is not null.

<!-- @code java -->
```java
static Node middle(Node head) {
    Node slow = head, fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    return slow;
}
```

<!-- @annotations -->
- 3: Java's `&&` short-circuits exactly as C++'s does, so `fast.next` is only evaluated once `fast` is known non-null — the whole safety of the loop rests on that.

<!-- @code python -->
```python
def middle(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    return slow


# n/2 iterations against the two-pass version's 1.5n, for the same
# number of attribute lookups. In Python iteration overhead dominates,
# so this measured 2.48x, 2.81x and 2.82x faster at n = 1,000, 10,000
# and 100,000.
```

<!-- @annotations -->
- 2: `slow = fast = head` binds both names to the same node, which is correct — they only diverge once the loop starts moving them at different rates.
- 3: `and` short-circuits, so `fast.next` is never evaluated on a null `fast`. Reversing the two tests raises `AttributeError` on even-length lists.

<!-- @example -->

<!-- @input -->
`1 -> 2 -> 3 -> 4 -> 5 -> null`

<!-- @output -->
The node holding 3

<!-- @why -->
The odd case, where both rules agree and the halving is easiest to follow.

<!-- @walkthrough -->
1. Both pointers start on the node holding 1.
2. `fast` and `fast->next` both exist, so slow moves to 2 and fast moves to 3.
3. Both still exist, so slow moves to 3 and fast moves to 5.
4. `fast` is the node holding 5 and `fast->next` is null, so the loop stops.
5. Slow is on the node holding 3, which is the middle of five nodes.
6. Slow took 2 steps while fast took 4 — exactly half, which is why slow lands at the midpoint whenever fast lands at the end.
7. The two-pass version counts 5, then walks `5 / 2 = 2` steps from the head, arriving at the same node.

<!-- @example -->

<!-- @input -->
`1 -> 2 -> 3 -> 4 -> 5 -> 6 -> null`, under both loop conditions

<!-- @output -->
The node holding 4 under one rule, and 3 under the other

<!-- @why -->
The even case, where the specification has to choose and one character in the condition decides.

<!-- @walkthrough -->
1. With `while (fast && fast->next)`: slow goes 1 to 2 to 3 to 4 while fast goes 1 to 3 to 5 to null.
2. The loop ends when fast becomes null, leaving slow on the node holding **4** — the second middle.
3. With `while (fast->next && fast->next->next)`: fast stops one step earlier, on the node holding 5.
4. Slow has then advanced only twice, landing on the node holding **3** — the first middle.
5. Measured across lengths 1 to 6, the two rules agree on every odd length and differ on every even one.
6. The standard problem asks for the second middle, so the first form is the one to write.
7. Splitting a list for merge sort and deleting the middle node both need the **first** middle instead, because they need the node before the split.
8. An off-by-one that only appears on half of all inputs is exactly the kind that survives a handful of tests.

<!-- @example -->

<!-- @input -->
Both approaches, with link reads and loop iterations counted exactly

<!-- @output -->
Identical link reads; three times fewer iterations

<!-- @why -->
Separates what the technique actually saves from what it is usually said to save.

<!-- @walkthrough -->
1. The two-pass version reads `n` links to count and `n/2` to walk — 1.5n in total.
2. The tortoise-hare runs n/2 iterations, and each reads three links: one for slow and two for fast — also 1.5n.
3. Counted at n = 1,000, 10,000 and 100,000, both performed **1,500**, **15,000** and **150,000** link reads. Identical.
4. So "one pass instead of two" does not mean fewer memory accesses.
5. Loop iterations, however, are 1,500 against 500, 15,000 against 5,000, and 150,000 against 50,000 — a factor of three.
6. In C++ an iteration costs almost nothing, so the saving is invisible and the measured ratio wanders between 0.66x and 1.44x.
7. In Python an iteration carries interpreter overhead, so a third as many iterations is worth a consistent 2.8x.
8. Same algorithm, same memory traffic, opposite conclusions — because the thing being saved is loop structure, not work.

<!-- @example -->

<!-- @input -->
An empty list and a one-node list

<!-- @output -->
Null, and the single node itself

<!-- @why -->
The two boundary cases, both of which the standard loop handles without a special case.

<!-- @walkthrough -->
1. On an empty list, `fast` is null, so the condition fails immediately.
2. The loop body never runs and `slow` is returned still holding null — the correct answer.
3. On a one-node list, `fast` is that node and `fast->next` is null, so the condition fails on its second test.
4. `slow` is returned still on the only node, which is the middle of a one-element list.
5. Neither case needed a branch, because the condition's two tests happen to cover them.
6. The first-middle variant is **not** so lucky: `while (fast->next && ...)` dereferences `fast` before testing it, so it needs an explicit empty-list guard.
7. That asymmetry is worth noting, because the two variants look interchangeable and only one of them is safe on an empty list as written.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the chain once and run both approaches over it in parallel tracks, because the point is a comparison rather than either algorithm alone. On the upper track, the two-pass version: a cursor sweeps the whole list with a counter climbing to n, then returns to the head and sweeps again to n/2 — two complete sweeps, visibly separate. On the lower track, the tortoise and hare start together and separate, the hare taking two hops per beat and the tortoise one, ending with the hare off the end and the tortoise on the middle node. Run them to the same beat so the reader sees both finish together. Then the counters, which are the substance: keep two tallies under each track, one for link reads and one for loop iterations. The link tallies must end **equal** at 1.5n — highlight that equality, since it contradicts what the technique is usually said to do. The iteration tallies end at 1.5n and n/2, a visible factor of three. Beneath, put two small bar pairs labelled by language: C++ showing the ratio wandering — 0.66x at a thousand, 1.43x at a hundred thousand, 0.85x at a million, with the bars crossing over — and Python showing a flat 2.8x. Caption them the same saving, worth nothing and worth everything. The centre of the closing panel is the even-length rule: draw a six-node list twice, with `while (fast && fast->next)` above and `while (fast->next && fast->next->next)` below, and animate the hare stopping one step apart in the two cases so the tortoise lands on 4 and on 3 respectively. Mark the two nodes clearly and note that the rules agree on every odd length. Finish with the family preview — the same two pointers redrawn four times in miniature, labelled cycle detection, cycle entry, n-th from the end, and merge-sort split, with only the speeds or starting offsets changed.

<!-- @sampleInput -->
```json
{"primary":{"list":"1 -> 2 -> 3 -> 4 -> 5 -> null","middle":3,"slowSteps":2,"fastSteps":4,"rule":"when fast has covered the whole list, slow has covered exactly half"},"smallCases":[{"n":1,"values":"0","secondMiddle":0,"firstMiddle":0},{"n":2,"values":"0,1","secondMiddle":1,"firstMiddle":0},{"n":3,"values":"0,1,2","secondMiddle":1,"firstMiddle":1},{"n":4,"values":"0..3","secondMiddle":2,"firstMiddle":1},{"n":5,"values":"0..4","secondMiddle":2,"firstMiddle":2},{"n":6,"values":"0..5","secondMiddle":3,"firstMiddle":2}],"evenLengthAmbiguity":{"secondMiddleCondition":"while (fast && fast->next)","firstMiddleCondition":"while (fast->next && fast->next->next)","agreeOn":"every odd length","differOn":"every even length","standardProblemWants":"the second middle","whoNeedsTheFirst":"splitting a list for merge sort, and deleting the middle node — both need the node before the split","whyItSurvivesTesting":"an off-by-one that only appears on half of all inputs","safetyNote":"the first-middle form dereferences fast before testing it, so it needs an explicit empty-list guard; the second-middle form does not"},"theClaimThatDoesNotSurviveCounting":{"usualJustification":"the tortoise and hare does it in one pass instead of two","linkReads":[{"n":1000,"twoPass":1500,"tortoiseHare":1500},{"n":10000,"twoPass":15000,"tortoiseHare":15000},{"n":100000,"twoPass":150000,"tortoiseHare":150000}],"why":"the two-pass version reads n links counting and n/2 walking; the hare reads two links per step and the tortoise one, over n/2 steps — both 1.5n","conclusion":"the single pass is not fewer memory accesses; it is the same accesses arranged differently"},"whatItActuallySaves":{"loopIterations":[{"n":1000,"twoPass":1500,"tortoiseHare":500},{"n":10000,"twoPass":15000,"tortoiseHare":5000},{"n":100000,"twoPass":150000,"tortoiseHare":50000}],"factor":3,"whyItVariesByLanguage":"whether that matters depends entirely on what a loop iteration costs"},"benchCpp":{"unit":"microseconds, work-normalised reps, three runs each","rows":[{"n":1000,"twoPass":"~0.57","tortoiseHare":"~0.84","ratios":["0.66x","0.71x","0.66x"],"note":"two-pass is faster"},{"n":10000,"twoPass":"~12.6","tortoiseHare":"~9.4","ratios":["1.33x","1.33x","1.34x"]},{"n":100000,"twoPass":"~125","tortoiseHare":"~88","ratios":["1.43x","1.36x","1.44x"]},{"n":1000000,"twoPass":"619-807","tortoiseHare":"725-810","ratios":["1.00x","0.85x","0.82x"],"note":"within noise, ordering flips"}],"verdict":"non-monotonic and sometimes slower — do not choose the tortoise and hare in C++ because it is faster"},"benchPython":{"unit":"microseconds, CPython 3.13.4","rows":[{"n":1000,"twoPass":21.30,"tortoiseHare":8.59,"ratio":"2.48x"},{"n":10000,"twoPass":248.41,"tortoiseHare":88.47,"ratio":"2.81x"},{"n":100000,"twoPass":2510.13,"tortoiseHare":890.02,"ratio":"2.82x"}],"why":"every Python loop iteration carries interpreter overhead that dwarfs an attribute lookup, so a third as many iterations is worth close to a third of the time","crossLanguagePoint":"the same algorithm with the same exact memory-access count gives 0.66x in one language and 2.82x in the other"},"whyItIsTheTechniqueTaught":["it needs only one pass, which matters when a second is impossible — a stream, a list being consumed, or one too large to touch twice","it never needs the length, and asking a linked list for its length costs a full traversal in its own right","it generalises: the same two pointers detect a cycle, find where a cycle begins, locate the n-th node from the end, and split a list for merge sort"],"verification":{"twoPassVsTortoiseHare":"checked over every length from 1 to 2000","disagreements":0,"languages":["C++","Python"]},"assertions":["an empty list returns null","a one-node list returns that node","slow takes exactly half as many steps as fast","the answer is the second middle on even lengths under the standard condition","both approaches read the same number of links"],"recommendation":"write the tortoise and hare — not for speed, but because it needs one pass, never needs the length, and is the template for four problems that follow","lesson":"'one pass instead of two' is a claim about loop structure, not memory traffic — counted exactly, both versions touch the same 1.5n links"}
```

<!-- @highlights -->
- The chain is drawn once with both approaches running over it in parallel tracks, because the point is the comparison.
- On the upper track a cursor sweeps the whole list with a counter climbing to n, returns to the head, and sweeps again to n/2 — two visibly separate passes.
- On the lower track the tortoise and hare start together and separate, the hare taking two hops per beat and the tortoise one.
- Both tracks run to the same beat and finish together, the hare off the end and the tortoise on the middle node.
- Two tallies sit under each track: one for link reads and one for loop iterations.
- The link tallies end **equal** at 1.5n, and that equality is highlighted because it contradicts what the technique is usually said to do.
- The iteration tallies end at 1.5n and n/2 — a visible factor of three.
- Two bar pairs beneath are labelled by language: C++ with the ratio wandering from 0.66x to 1.43x to 0.85x, the bars crossing over.
- Python shows a flat 2.8x, and the pair is captioned the same saving, worth nothing and worth everything.
- The closing panel draws a six-node list twice, one per loop condition.
- The hare stops one step apart in the two cases, so the tortoise lands on 4 above and 3 below.
- Both landing nodes are marked, with a note that the rules agree on every odd length.
- The finish is a family preview: the same two pointers redrawn four times in miniature.
- They are labelled cycle detection, cycle entry, n-th from the end, and merge-sort split — only the speeds or starting offsets changed.

<!-- @edgeCases -->
- The empty list — the standard condition fails on its first test and returns null, with no special case needed.
- A one-node list — the condition fails on its second test and the node itself is returned.
- A two-node list — the smallest input where the two loop conditions disagree, returning the second node or the first.
- Any even length — the two rules always differ, so the specification must say which middle it wants.
- Any odd length — the two rules always agree, which is why a test suite of odd-length lists catches nothing.
- The first-middle variant on an empty list — dereferences `fast` before testing it and crashes without an explicit guard.
- Reversing the two tests in the condition — `fast->next && fast` dereferences a null pointer on even-length lists.
- A cyclic list — the loop never terminates, since `fast` never reaches null; this is the same structure that **Detect a loop in LL** turns into a solution.
- Using the returned middle to split a list — the caller needs the node *before* it, so the first-middle rule is usually the one wanted there.
- A list long enough that `int` cannot hold the count — affects the two-pass version only; the tortoise and hare never counts anything.

<!-- @pitfalls -->
- Choosing the tortoise and hare for speed. Measured in C++ it ranged from 0.66x to 1.44x against the two-pass version and was slower at a thousand nodes and at a million.
- Believing the single pass means fewer memory accesses. Counted exactly, both perform 1.5n link reads at every size — the difference is loop iterations, not work.
- Writing `while (fast->next && fast->next->next)` when the second middle is wanted. It returns the first middle, which differs on every even-length list.
- Using that same form without an empty-list guard. It dereferences `fast` before testing it.
- Reversing the tests to `fast->next != nullptr && fast != nullptr`. The short circuit then protects nothing and the first test dereferences null.
- Testing only on odd-length lists. The two middle rules agree on every odd length, so the off-by-one is invisible.
- Running either version on a possibly-cyclic list. The fast pointer never reaches null and the loop does not terminate.
- Advancing the fast pointer by two in a single expression without checking the intermediate. `fast->next->next` is safe only because the loop condition just proved `fast->next` is non-null.
- Reaching for the length first. That is a full traversal in its own right, and the whole point of this technique is answering a positional question without one.
- Assuming the middle node is at index `n/2` in every convention. It is under the second-middle rule and not under the first.

<!-- @doubt -->
### Is the tortoise and hare actually faster than counting first?

<!-- @answer -->
Not reliably, and in C++ it is sometimes slower. Counted exactly, the two approaches perform the **same** number of link reads — 1,500 at n = 1,000, 15,000 at 10,000, 150,000 at 100,000 — because the two-pass version reads n links counting and n/2 walking, while the hare reads two per step and the tortoise one over n/2 steps. Both are 1.5n. Measured in C++ with work-normalised repetitions across three runs, the ratio was **0.66x at a thousand nodes** (two-pass faster), 1.33x at ten thousand, 1.43x at a hundred thousand, and back to 0.85x at a million. That is second-order noise around two algorithms doing identical work. In Python it is a different story — a consistent 2.8x — because there the saving is in loop iterations, which cost real money in an interpreter.

<!-- @doubt -->
### Then why is it the technique everyone teaches?

<!-- @answer -->
Three reasons, none of them raw speed. It needs **one pass**, which matters whenever a second is impossible or expensive — a list arriving as a stream, a list being consumed as it is read, or one large enough that touching it twice is the cost. It never needs the **length**, and the previous subtopic measured that asking a linked list its length is a full traversal costing the same as reading every value, so any approach phrased as "compute the length, then..." has already spent a pass before starting. And it **generalises**: the same two pointers at different speeds detect a cycle, find where the cycle begins, locate the n-th node from the end, and split a list for merge sort — four of the problems immediately after this one are this pattern with the speeds or the starting offsets changed. Finding the middle is simply the easiest place to see the mechanism.

<!-- @doubt -->
### Which node is the middle when the list has an even number of nodes?

<!-- @answer -->
Whichever the specification says, and the loop condition decides it. `while (fast && fast->next)` returns the **second** middle — node 4 of six — and `while (fast->next && fast->next->next)` returns the **first** — node 3. Measured across lengths 1 to 6, the two rules agree on every odd length and differ on every even one. The standard problem asks for the second, so the first form is the default. But two problems shortly after this one need the *first* middle: splitting a list for merge sort and deleting the middle node both need the node **before** the split point, because a singly linked list cannot step backwards to find it. Note also that the first-middle form dereferences `fast` before testing it, so unlike the standard form it needs an explicit empty-list guard.

<!-- @doubt -->
### Why does the loop condition test two things?

<!-- @answer -->
Because the fast pointer moves two nodes at a time and both of those nodes have to exist. `fast != nullptr` covers landing exactly on the end after an even-length list; `fast->next != nullptr` covers being one short of it after an odd-length list. Without the first test, an even-length list dereferences null on the final iteration. Without the second, `fast->next->next` reads through a null pointer. The **order** matters too, and for a reason beyond style: `&&` short-circuits, so writing `fast->next != nullptr && fast != nullptr` evaluates `fast->next` before establishing that `fast` is non-null — the guard is there but it guards nothing. The same applies to `and` in Python, where the reversed form raises `AttributeError` on even-length lists.

<!-- @doubt -->
### Does this work if the list has a cycle?

<!-- @answer -->
No — the loop never terminates, because `fast` never reaches null. That is the same failure mode as computing the length or searching for an absent value, and it is worth noticing that it is the *identical* structure that **Detect a loop in LL** turns into a solution. There, the observation is that on a cyclic list the fast pointer eventually laps the slow one and they meet, and that meeting is the signal a cycle exists. So the same two pointers either terminate at the end of the list, giving you the middle, or collide inside a cycle, giving you cycle detection — one mechanism, two outcomes, distinguished only by which happens first. It is a good illustration of why this technique is worth internalising rather than memorising as a recipe for one problem.

<!-- @doubt -->
### Why does the same algorithm behave so differently in Python and C++?

<!-- @answer -->
Because the two languages charge for different things, and this technique saves only one of them. The saving is **loop iterations** — n/2 against 1.5n, a factor of three — and it is emphatically *not* memory accesses, which are identical at 1.5n in both approaches. An optimised C++ loop iteration costs a couple of instructions that overlap with the memory latency it is already waiting on, so removing two thirds of them buys close to nothing, and the measured ratio wandered between 0.66x and 1.44x depending on size. A CPython loop iteration carries bytecode dispatch and reference counting that dwarf an attribute lookup, so a third as many iterations is worth close to a third of the time — measured 2.48x, 2.81x and 2.82x. The general lesson is that "fewer passes" is a statement about loop structure, and whether it is worth anything depends entirely on what your loops cost.

<!-- @doubt -->
### Should I ever use the two-pass version?

<!-- @answer -->
Yes, in two situations. First, when you need the length anyway — if the surrounding code is going to compute it regardless, the second pass is nearly free and the resulting code is more obviously correct, since `n / 2` states the intent directly where a loop condition encodes it. Second, when you are writing the first version of something and want it plainly right; it measured about **1.5x faster** at a thousand nodes in C++, so there is no penalty for starting there. What rules it out is a list you can only traverse once, a list whose length you cannot afford, or a context where you want the technique to generalise to the cycle and n-th-from-the-end problems. In Python the 2.8x makes the tortoise and hare the default regardless.
