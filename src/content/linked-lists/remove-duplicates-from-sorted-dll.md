---
id: remove-duplicates-from-sorted-dll
topic: Linked Lists
title: Remove Duplicates from Sorted DLL
difficulty: Medium
status: ready
prerequisites:
  - delete-all-occurrences-of-a-key-in-dll
  - introduction-to-doubly-ll
  - delete-head-of-doubly-linked-list
relatedIds:
  - delete-all-occurrences-of-a-key-in-dll
  - introduction-to-doubly-ll
  - reverse-a-doubly-linked-list
  - find-pairs-with-given-sum-in-doubly-linked-list
  - sort-a-linked-list-of-0s-1s-and-2s
---

<!-- @summary -->
A doubly linked list can be perfectly correct read forwards and corrupt read backwards, and this is the problem where that happens: forgetting to repair prev leaves the forward chain right on 100% of inputs while the backward chain is wrong on 64.76% and walks into freed memory. Forgetting the tail is the same shape at 59.52%. Both are invisible to the way most people test a list.

<!-- @theory -->
## The problem

A sorted doubly linked list. Remove nodes so each value appears once, keeping the
list sorted, doubly linked and correctly terminated at both ends.

```
1 <-> 1 <-> 1 <-> 2 <-> 3 <-> 4      ->      1 <-> 2 <-> 3 <-> 4
```

Because the list is sorted, equal values sit in a contiguous run. That single fact
does all the work: a duplicate is always the *next* node, so one pass suffices and
nothing needs remembering.

## Four pointers, not one

Deleting from a singly linked list means fixing one pointer. Here every removal
touches up to four things, and three of them are easy to forget:

```
... A <-> D <-> B ...            removing D

  A->next = B        the forward chain      -- everyone writes this
  B->prev = A        the backward chain     -- forgotten on 64.76%
  tail = A           if D was last          -- forgotten on 59.52%
  delete D           the node itself
```

The measurements below are over **every sorted doubly linked list of length 0 to 6
with values from `{0..3}` — 210 lists** — checked four ways: values read forward,
values read backward from the tail, whether the tail is the real last node, and
whether any traversal reaches a node that was freed.

| version | forward wrong | backward wrong | tail wrong | reaches a freed node |
|---|---|---|---|---|
| unlink in place | 0 | 0 | 0 | 0 |
| **forgets `prev`** | **0** | **136 — 64.76%** | 0 | **136** |
| **forgets `tail`** | **0** | 125 | **125 — 59.52%** | **125** |
| rebuild from survivors | 0 | 0 | 0 | 0 |

Read the first column again: both broken versions are correct **forwards on every
single input**. A test that prints the list from the head cannot see either bug.

The smallest cases are tiny:

```
forgetting prev,  list [0, 0, 1]
   forward :  0 1        correct
   backward:  1 0 0      wrong — the freed duplicate is still in the prev chain

forgetting tail,  list [0, 0]
   forward :  0          correct
   backward:  0 0        wrong — tail still points at the node that was deleted
```

Both cases are worse than a wrong answer. The stale `prev` and the stale `tail`
point at memory that has been handed back, so reading them is undefined behaviour
— the first version of this measurement harness segfaulted on exactly that, which
is why the numbers above come from a run that marks nodes freed instead of
actually freeing them.

## The nested version is not quadratic

The natural "brute force" is to take each node and scan forward deleting equal
neighbours, which looks like a nested loop and therefore like O(n²). On a sorted
list it is not. Each node is removed at most once, so the inner scans partition
the list rather than repeating it. Counting actual comparisons:

| n | duplicate rate | single pass | nested scan |
|---|---|---|---|
| 1,000 | 0% / 90% / 99% | 999 | 999 |
| 10,000 | 0% / 90% / 99% | 9,999 | 9,999 |
| 100,000 | 0% / 90% / 99% | 99,999 | 99,999 |

Exactly `n − 1` both ways, at every duplicate rate. They are the same algorithm
written two ways, and the sortedness is what collapses the nesting — remove that
assumption and the same code really is quadratic.

## What the alternatives actually cost

| n | duplicate rate | unlink in place | rebuild | hash set |
|---|---|---|---|---|
| 1,000,000 | 0% | **1,073,125** | 26,047,209 | 31,736,042 |
| 1,000,000 | 50% | **6,427,167** | 19,692,792 | — |
| 1,000,000 | 90% | **11,070,041** | 14,209,417 | 15,628,708 |

Nanoseconds. Two things move in opposite directions and are worth naming:

- **Unlinking gets slower as duplicates increase** — 1,073,125 to 11,070,041 —
  because the cost is `delete`, and more duplicates means more frees. With no
  duplicates it is a bare traversal.
- **Rebuilding gets faster** — 26,047,209 to 14,209,417 — because it allocates one
  node per survivor, and more duplicates means fewer survivors.

So the gap closes from **24x** to **1.28x**. Unlinking never loses, but the reason
it wins is allocation, not comparisons — both do exactly `n − 1` of those.

The hash-set version is the only one that does not need the list sorted, and it
pays **26x to 29x** for that generality on distinct data.

<!-- @intuition -->
The useful habit this problem teaches is not the algorithm — the algorithm is one comparison and a splice. It is that a doubly linked list has two independent representations of the same sequence, and an operation is only correct if it maintains both. Printing from the head is the natural way to check your work, and it is exactly the check that cannot see either of the two common bugs here. So the test has to walk back from the tail, which also means the tail has to be right, which is the third thing people forget. Whenever a structure carries redundant links — parent pointers, back edges, a cached size, a tail — the redundancy is a second invariant, and code that satisfies only the one you can easily observe will look correct for a long time.

<!-- @approach -->
### Track Seen Values in a Hash Set

<!-- @idea -->
Walk the list once, remembering every value already kept, and unlink any node whose value has been seen.

<!-- @steps -->
1. Keep a set of values already retained.
2. Walk from the head, saving the next pointer before touching the node.
3. If the value is in the set, unlink the node and free it.
4. Otherwise add the value and move on.
5. Fix head and tail when the removed node was at either end.

<!-- @complexity -->
- time: O(n) expected
- space: O(n)
- note: The only version here that does not require the list to be sorted. On distinct values that generality costs **26x to 29x** against unlinking in place.

<!-- @code cpp -->
```cpp
#include <unordered_set>
using namespace std;

void removeDuplicates(List& list) {
    unordered_set<int> seen;
    Node* cur = list.head;
    while (cur) {
        Node* nxt = cur->next;
        if (seen.count(cur->data)) {
            if (cur->prev) cur->prev->next = cur->next;
            else           list.head = cur->next;
            if (cur->next) cur->next->prev = cur->prev;
            else           list.tail = cur->prev;
            delete cur;
        } else {
            seen.insert(cur->data);
        }
        cur = nxt;
    }
}
```

<!-- @annotations -->
- 8: `nxt` is saved **before** the node can be freed. Reading `cur->next` after `delete cur` is the most common way this loop goes wrong.
- 10: Four cases, not one: the removed node may be at the head, at the tail, both, or neither. Each `if/else` handles one end.
- 13: The `else` branch is what keeps `tail` honest when the last node is the one removed — the bug measured at 59.52%.
- 5: This version never compares neighbours, so it works on an unsorted list too. That is the whole reason to pay for the set.

<!-- @code java -->
```java
static void removeDuplicates(List list) {
    HashSet<Integer> seen = new HashSet<>();
    Node cur = list.head;
    while (cur != null) {
        Node nxt = cur.next;
        if (seen.contains(cur.data)) {
            if (cur.prev != null) cur.prev.next = cur.next;
            else                  list.head = cur.next;
            if (cur.next != null) cur.next.prev = cur.prev;
            else                  list.tail = cur.prev;
        } else {
            seen.add(cur.data);
        }
        cur = nxt;
    }
}
```

<!-- @annotations -->
- 2: `HashSet<Integer>` boxes every value, which is a real cost Java pays and C++ does not — one allocation per distinct element on top of the set itself.

<!-- @code python -->
```python
def remove_duplicates(lst):
    seen = set()
    cur = lst.head
    while cur:
        nxt = cur.next
        if cur.data in seen:
            if cur.prev:
                cur.prev.next = cur.next
            else:
                lst.head = cur.next
            if cur.next:
                cur.next.prev = cur.prev
            else:
                lst.tail = cur.prev
        else:
            seen.add(cur.data)
        cur = nxt
```

<!-- @annotations -->
- 5: Saving `nxt` first matters here too — not because of freeing, but because the unlinking below overwrites the pointers this loop needs to advance.

<!-- @approach -->
### Rebuild from the Survivors

<!-- @idea -->
Read the distinct values into an array, discard the whole list, and build a fresh one.

<!-- @steps -->
1. Walk the list collecting each value that differs from the previous one.
2. Free every node of the original list.
3. Build a new list from the collected values, linking both directions.
4. Set head and tail on the new list.

<!-- @complexity -->
- time: O(n)
- space: O(n)
- note: Correct on all 210 exhaustive cases and hard to get wrong, because the links are built fresh rather than repaired. It costs **24x** on distinct data, though the gap narrows to **1.28x** when 90% of the nodes are duplicates.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

void removeDuplicates(List& list) {
    vector<int> keep;
    for (Node* p = list.head; p; p = p->next)
        if (keep.empty() || keep.back() != p->data) keep.push_back(p->data);

    for (Node* p = list.head; p; ) { Node* nxt = p->next; delete p; p = nxt; }

    list.head = list.tail = nullptr;
    for (int x : keep) {
        Node* n = new Node(x);
        if (!list.head) list.head = n;
        else { list.tail->next = n; n->prev = list.tail; }
        list.tail = n;
    }
}
```

<!-- @annotations -->
- 7: `keep.back() != p->data` compares against the last value kept rather than searching, which is only valid because the list is sorted.
- 9: The whole original list is freed before anything is rebuilt, so no node can be referenced twice — this is why the approach is hard to get wrong.
- 14: Both directions are set as the list is built: `next` forward and `prev` back. Building fresh makes the symmetry obvious in a way repairing does not.
- 16: `list.tail` is assigned every iteration, so it is automatically correct at the end — no special case for the last node.

<!-- @code java -->
```java
static void removeDuplicates(List list) {
    ArrayList<Integer> keep = new ArrayList<>();
    for (Node p = list.head; p != null; p = p.next)
        if (keep.isEmpty() || keep.get(keep.size() - 1) != p.data) keep.add(p.data);

    list.head = list.tail = null;
    for (int x : keep) {
        Node n = new Node(x);
        if (list.head == null) list.head = n;
        else { list.tail.next = n; n.prev = list.tail; }
        list.tail = n;
    }
}
```

<!-- @annotations -->
- 4: `keep.get(...) != p.data` unboxes the Integer before comparing. Comparing two boxed Integers with `!=` would compare references and silently misbehave outside the cached range.

<!-- @code python -->
```python
def remove_duplicates(lst):
    keep = []
    p = lst.head
    while p:
        if not keep or keep[-1] != p.data:
            keep.append(p.data)
        p = p.next

    lst.head = lst.tail = None
    for x in keep:
        n = Node(x)
        if lst.head is None:
            lst.head = n
        else:
            lst.tail.next = n
            n.prev = lst.tail
        lst.tail = n
```

<!-- @annotations -->
- 9: No explicit free — the old nodes become unreachable and are collected. That removes the use-after-free hazard entirely, and with it the harshest consequence of the `prev` bug.

<!-- @approach -->
### Unlink in Place

<!-- @idea -->
Walk once and, whenever the next node repeats the current value, splice it out — repairing both directions and the tail.

<!-- @steps -->
1. Start at the head.
2. If the next node holds the same value, it is a duplicate.
3. Point `cur->next` past it.
4. Point the node after it back at `cur`, or move the tail if there is none.
5. Free the duplicate and check the same position again.
6. Otherwise advance.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The only approach using constant extra space, and the fastest at every duplicate rate measured. Its four lines are exactly the four things a doubly linked deletion must do.

<!-- @code cpp -->
```cpp
void removeDuplicates(List& list) {
    Node* cur = list.head;
    while (cur && cur->next) {
        if (cur->next->data == cur->data) {
            Node* dup = cur->next;
            cur->next = dup->next;
            if (dup->next) dup->next->prev = cur;
            else           list.tail = cur;
            delete dup;
        } else {
            cur = cur->next;
        }
    }
}
```

<!-- @annotations -->
- 4: Comparing with the **next** node, not a remembered value. Sortedness guarantees equal values are adjacent, so nothing has to be carried between iterations.
- 7: The line forgotten on 64.76% of inputs. Without it the forward chain is still perfect and the backward chain points at a freed node.
- 8: The line forgotten on 59.52%. When the duplicate was last, the tail must step back or it dangles.
- 11: `cur` advances only here, in the else branch — after a removal it deliberately stays put — a run of three or more equal values needs the same position re-examined.
- 3: `cur->next` in the condition is what makes the single-node and empty cases fall out without a special case.

<!-- @code java -->
```java
static void removeDuplicates(List list) {
    Node cur = list.head;
    while (cur != null && cur.next != null) {
        if (cur.next.data == cur.data) {
            Node dup = cur.next;
            cur.next = dup.next;
            if (dup.next != null) dup.next.prev = cur;
            else                  list.tail = cur;
        } else {
            cur = cur.next;
        }
    }
}
```

<!-- @annotations -->
- 7: Java has no `delete`, but the pointer repair is identical — and skipping it still corrupts the backward chain, it just leaks instead of dangling.

<!-- @code python -->
```python
def remove_duplicates(lst):
    cur = lst.head
    while cur and cur.next:
        if cur.next.data == cur.data:
            dup = cur.next
            cur.next = dup.next
            if dup.next:
                dup.next.prev = cur
            else:
                lst.tail = cur
        else:
            cur = cur.next
```

<!-- @annotations -->
- 3: `cur and cur.next` short-circuits, so the empty list never dereferences anything.
- 8: Python frees the node once nothing references it — but only if `prev` was repaired. Skipping line 8 keeps the duplicate alive through the backward chain, turning a dangling pointer into a leak plus a wrong traversal.

<!-- @example -->

<!-- @input -->
```
1 <-> 1 <-> 1 <-> 2 <-> 3 <-> 4
```

<!-- @output -->
```
1 <-> 2 <-> 3 <-> 4
```

<!-- @why -->
A run of three 1s collapses to one. The pointer stays put after each removal, which is what lets a single position absorb a whole run.

<!-- @walkthrough -->
```
cur = 1(a)

cur->next is 1(b), equal    unlink 1(b), repair prev on 1(c), cur stays
cur->next is 1(c), equal    unlink 1(c), repair prev on 2,    cur stays
cur->next is 2, different   advance
cur->next is 3, different   advance
cur->next is 4, different   advance
cur->next is null           stop

1 <-> 2 <-> 3 <-> 4

Not advancing after a removal is the point: had `cur` moved
on after unlinking 1(b), the second 1 would have survived.
```

<!-- @example -->

<!-- @input -->
```
0 <-> 0 <-> 1
```

<!-- @output -->
```
0 <-> 1
```

<!-- @why -->
The smallest list where forgetting to repair `prev` produces a list that is right forwards and wrong backwards. Three nodes are enough to expose it.

<!-- @walkthrough -->
```
correct:
  unlink the second 0
    cur->next   = 1        forward  chain repaired
    1->prev     = 0(a)     backward chain repaired
  forward :  0 1
  backward:  1 0            both right

forgetting `prev`:
    cur->next   = 1        forward  chain repaired
    1->prev  still points at the freed 0(b)
  forward :  0 1            looks perfect
  backward:  1 0 0          wrong, and 0(b) is freed memory

Printing from the head cannot distinguish these. Measured
over 210 lists, this omission is wrong on 0% of forward
reads and 64.76% of backward reads.
```

<!-- @example -->

<!-- @input -->
```
0 <-> 0
```

<!-- @output -->
```
0
```

<!-- @why -->
The smallest list where forgetting the tail matters. Two equal nodes, the second removed — and `tail` must step back to the first.

<!-- @walkthrough -->
```
correct:
  unlink the second 0; it had no next, so  list.tail = cur
  forward :  0
  backward:  0

forgetting the tail update:
  forward :  0              looks perfect
  backward:  0 0            tail still points at the freed node

This is the 59.52% case. It also shows why the check has to
start from the tail: a backward walk is the only traversal
that touches `tail` at all.
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
The loop condition `cur && cur->next` is false immediately, so nothing runs and no special case is needed. A single-node list behaves the same way.

<!-- @walkthrough -->
```
list.head is null

cur = null
`cur && cur->next`  ->  false on the first test
return, list untouched

Single node:  cur = the node, cur->next is null, same exit.
Testing `cur->next` rather than `cur` alone is what folds
both degenerate cases into the normal path.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the four pointers a doubly linked deletion must maintain, and that the two most-forgotten ones are invisible to a forward traversal.

<!-- @sampleInput -->
```json
{"primary":{"before":[1,1,1,2,3,4],"after":[1,2,3,4],"walk":[{"cur":"1(a)","next":"1(b)","equal":true,"action":"unlink 1(b), repair prev on 1(c), cur stays"},{"cur":"1(a)","next":"1(c)","equal":true,"action":"unlink 1(c), repair prev on 2, cur stays"},{"cur":"1(a)","next":"2","equal":false,"action":"advance"},{"cur":"2","next":"3","equal":false,"action":"advance"},{"cur":"3","next":"4","equal":false,"action":"advance"},{"cur":"4","next":null,"equal":null,"action":"stop"}],"keyPoint":"cur does not advance after a removal, so one position absorbs a whole run"},"fourPointers":{"removing":"... A <-> D <-> B ...  removing D","steps":[{"assignment":"A->next = B","role":"the forward chain","forgottenPct":0,"note":"everyone writes this"},{"assignment":"B->prev = A","role":"the backward chain","forgottenPct":64.76},{"assignment":"tail = A","role":"only if D was last","forgottenPct":59.52},{"assignment":"delete D","role":"the node itself"}]},"exhaustive":{"space":"every sorted doubly linked list of length 0..6 with values from {0..3}","cases":210,"checkedFourWays":["values read forward","values read backward from the tail","whether tail is the real last node","whether any traversal reaches a freed node"],"rows":[{"version":"unlink in place","forwardWrong":0,"backwardWrong":0,"tailWrong":0,"reachesFreed":0},{"version":"forgets prev","forwardWrong":0,"backwardWrong":136,"backwardPct":64.76,"tailWrong":0,"reachesFreed":136},{"version":"forgets tail","forwardWrong":0,"backwardWrong":125,"tailWrong":125,"tailPct":59.52,"reachesFreed":125},{"version":"rebuild from survivors","forwardWrong":0,"backwardWrong":0,"tailWrong":0,"reachesFreed":0}],"headline":"both broken versions are correct FORWARDS on every single input - a test that prints from the head cannot see either bug","smallestCases":[{"bug":"forgets prev","list":[0,0,1],"forward":[0,1],"forwardCorrect":true,"backward":[1,0,0],"backwardCorrect":false,"why":"the freed duplicate is still in the prev chain"},{"bug":"forgets tail","list":[0,0],"forward":[0],"forwardCorrect":true,"backward":[0,0],"backwardCorrect":false,"why":"tail still points at the node that was deleted"}],"severity":"the stale prev and stale tail point at memory that has been handed back, so reading them is undefined behaviour - the first version of this harness segfaulted on exactly that, which is why these numbers come from a run that marks nodes freed rather than freeing them"},"nestedIsNotQuadratic":{"claim":"scanning forward from each node looks like O(n^2) and is not, on a sorted list","reason":"each node is removed at most once, so the inner scans partition the list rather than repeating it","comparisonCounts":[{"n":1000,"dupRates":"0% / 90% / 99%","singlePass":999,"nested":999},{"n":10000,"dupRates":"0% / 90% / 99%","singlePass":9999,"nested":9999},{"n":100000,"dupRates":"0% / 90% / 99%","singlePass":99999,"nested":99999}],"reading":"exactly n-1 both ways at every duplicate rate - the same algorithm written two ways","caveat":"remove the sortedness assumption and the same code really is quadratic"},"cost":{"unit":"nanoseconds, n = 1,000,000","rows":[{"dupRate":"0%","unlink":1073125,"rebuild":26047209,"hashSet":31736042},{"dupRate":"50%","unlink":6427167,"rebuild":19692792,"hashSet":null},{"dupRate":"90%","unlink":11070041,"rebuild":14209417,"hashSet":15628708}],"opposingTrends":[{"approach":"unlink in place","direction":"gets SLOWER as duplicates increase","from":1073125,"to":11070041,"why":"the cost is delete, and more duplicates means more frees; with none it is a bare traversal"},{"approach":"rebuild","direction":"gets FASTER as duplicates increase","from":26047209,"to":14209417,"why":"it allocates one node per survivor, and more duplicates means fewer survivors"}],"gapCloses":"from 24x to 1.28x","reading":"unlinking never loses, but the reason it wins is allocation, not comparisons - both do exactly n-1 of those","hashSetNote":"the only version that does not need the list sorted, paying 26x to 29x for that generality on distinct data"},"assertions":["the list is sorted, so equal values are contiguous","a removal must repair next, prev, and possibly tail","a forward traversal cannot detect a broken prev chain","cur must not advance after a removal, so runs collapse","the empty and single-node lists need no special case"]}
```

<!-- @highlights -->
- A DLL can be **right forwards and corrupt backwards** — and this is where it happens.
- Forgetting `prev`: **0%** forward errors, **64.76%** backward errors, and it walks into freed memory.
- Forgetting `tail`: **0%** forward errors, **59.52%** tail errors — same invisibility.
- Smallest cases are `[0,0,1]` and `[0,0]`.
- The "nested" scan is **not quadratic** on a sorted list: exactly `n − 1` comparisons, same as one pass.
- Unlinking beats rebuilding **24×** with no duplicates and only **1.28×** at 90% — the cost is allocation, not comparison.

<!-- @edgeCases -->
- Empty list — `cur && cur->next` is false at once; no special case needed.
- Single node — same exit, nothing removed.
- All values equal — one node survives and the tail must move back to it; the worst case for the tail bug.
- Two equal nodes — the smallest input that exposes a missing tail update.
- Three nodes, first two equal — the smallest that exposes a missing `prev` repair.
- No duplicates at all — a pure traversal, and the case where unlinking is 24× ahead of rebuilding.
- A run at the very end — the only time `tail` needs to move.
- A run at the very start — head does not move, since the first node of a run is the one kept.
- A list that is not actually sorted — outside the precondition; adjacent comparison then keeps duplicates that are not adjacent.

<!-- @pitfalls -->
- Repairing `next` but not `prev`. The forward chain looks perfect on every input while the backward chain is wrong on 64.76% and dangles into freed memory.
- Not moving `tail` when the removed node was last. Invisible forwards, wrong on 59.52%.
- Testing only by printing from the head. That traversal cannot see either bug — walk back from the tail.
- Advancing `cur` after a removal. A run of three or more equal values then leaves survivors.
- Reading `cur->next` after `delete cur`. Save the next pointer first.
- Freeing the node before repairing the neighbours' pointers.
- Assuming the nested scan is quadratic and avoiding it for that reason. On sorted input it makes exactly the same `n − 1` comparisons.
- Reaching for a hash set. It works and does not need sortedness, and costs 26× to 29× on distinct data.
- Comparing boxed `Integer` values with `!=` in Java. That compares references outside the cache range.

<!-- @doubt -->
### Why is forgetting `prev` so hard to notice?

<!-- @answer -->
Because every natural way to check a linked list walks forward. Measured over all **210** sorted doubly linked lists of length 0 to 6 over `{0..3}`, the version that repairs `next` but not `prev` produces a **perfectly correct forward traversal on every single one** — zero errors — while the backward traversal is wrong on **136, or 64.76%**. The smallest example is `[0, 0, 1]`: forward gives `0 1`, exactly right; backward from the tail gives `1 0 0`, because the freed duplicate is still sitting in the prev chain. It is also worse than an incorrect answer, since that stale pointer refers to memory already handed back — the first version of the harness for this container segfaulted on precisely that, which is why the final numbers come from a run that marks nodes freed rather than freeing them. The practical rule: any test for a doubly linked operation must read the list back from the tail, not just forward from the head.

<!-- @doubt -->
### Why does `cur` not advance after removing a node?

<!-- @answer -->
Because a run can be longer than two. After splicing out `cur->next`, the new `cur->next` is the node that followed the duplicate, and it may hold the same value again — `1 -> 1 -> 1` needs the same position examined twice. Advancing after a removal skips that check and leaves every second duplicate in place, so `[1,1,1]` becomes `[1,1]` instead of `[1]`. The loop is easier to reason about if you read it as "keep deleting whatever follows `cur` while it repeats, then move on", which is exactly what the nested-scan version writes explicitly — and, as the comparison counts show, the two do identical work.

<!-- @doubt -->
### Isn't scanning forward from every node quadratic?

<!-- @answer -->
Not on a sorted list, and the measurement is unambiguous: both the single-pass and the nested-scan versions make exactly **n − 1 comparisons** at n = 1,000, 10,000 and 100,000, and at duplicate rates of 0%, 90% and 99%. The reason is that each node is deleted at most once, so the inner scans partition the list instead of re-traversing it — the total work is bounded by the number of nodes, not by pairs of nodes. What makes this true is sortedness: equal values are contiguous, so the inner scan stops at the first different value. Drop that assumption and the same code becomes genuinely quadratic, because a duplicate could be anywhere. This is worth knowing in both directions — the nested version is not something to avoid here, and it is not something to reuse on an unsorted list.

<!-- @doubt -->
### When would rebuilding be the better choice?

<!-- @answer -->
When the list is mostly duplicates, or when you value the code being obviously correct over its speed. Measured at n = 1,000,000, unlinking beats rebuilding **24x** on distinct values — 1,073,125ns against 26,047,209 — but only **1.28x** when 90% of nodes are duplicates, 11,070,041 against 14,209,417. The two trends run opposite ways: unlinking pays for `delete`, so it gets *slower* as duplicates increase, while rebuilding allocates one node per survivor and gets *faster*. The correctness argument for rebuilding is real too — it constructs `next`, `prev` and `tail` from scratch, so neither of the two bugs measured above can occur. It costs O(n) extra space and never actually wins, so unlinking in place remains the answer; rebuilding is the one to reach for if you find yourself repeatedly getting the pointer repair wrong.

<!-- @doubt -->
### Does this work if the list is not sorted?

<!-- @answer -->
No, and the failure is quiet. The comparison `cur->next->data == cur->data` only ever looks at neighbours, so on `1 -> 2 -> 1` nothing is removed at all — the two 1s are not adjacent and are never compared. The list comes back unchanged and looks plausible. If the input might be unsorted you need the hash-set version, which remembers every value already kept rather than only the previous one; it is O(n) expected time and O(n) space, and measured **26x to 29x** slower than unlinking on distinct sorted data. Sorting first and then unlinking is the other option, and for a linked list that means a merge sort at O(n log n) — worth it only if you wanted the list sorted anyway.
