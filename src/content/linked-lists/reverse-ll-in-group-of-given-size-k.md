---
id: reverse-ll-in-group-of-given-size-k
topic: Linked Lists
title: Reverse LL in Group of Given Size K
difficulty: Hard
status: ready
prerequisites:
  - reverse-a-linkedlist-iterative
  - reverse-a-ll
  - find-the-length-of-the-linked-list
relatedIds:
  - reverse-a-linkedlist-iterative
  - reverse-a-ll
  - check-if-ll-is-palindrome-or-not
  - remove-nth-node-from-the-back-of-the-ll
  - segregate-odd-and-even-nodes-in-linked-list
---

<!-- @summary -->
Reversing k at a time is the plain reversal plus one question asked before each group: are there k nodes left? Getting that wrong does not produce a bug so much as a different problem — the two readings disagree on 38.89% of inputs. The recursive solution, which is the one usually taught, overflows an 8 MiB stack somewhere between 250,000 and 300,000 frames, and because the depth is n/k the danger is small k, not large.

<!-- @theory -->
## The problem

Reverse the list k nodes at a time. If the final group has fewer than k nodes,
leave it alone.

```
1 -> 2 -> 3 -> 4 -> 5,  k = 2    ->    2 -> 1 -> 4 -> 3 -> 5
1 -> 2 -> 3 -> 4 -> 5,  k = 3    ->    3 -> 2 -> 1 -> 4 -> 5
```

The reversal itself is the three-pointer loop from Reverse a Linked List. What is
new is everything around it: knowing when a group is complete, and stitching the
reversed groups back together.

## The leftover clause is not a detail

"If the last group is short, leave it" and "reverse it anyway" are both real
problems — the first is LeetCode 25, the second is a common interview variant.
The code that distinguishes them is the check performed before reversing, and the
two answers differ often. Over every list of length 0 to 8 with every k from 1 to
8 — **72 cases** — they disagree on **28, or 38.89%**.

The smallest disagreement takes two nodes:

```
list 1 -> 2,   k = 3

leave the leftover   ->   1 -> 2      no group of 3 exists, nothing happens
reverse it anyway    ->   2 -> 1
```

A version written without the "are there k left?" probe matched the
reverse-the-leftover specification on **all 72 cases, 0 wrong**. It is not broken
code; it answers the other question. So the first thing to establish is which
question you were asked, because no amount of testing against your own
expectations will reveal the difference.

## Three pointers, and then three more

A single reversal needs `prev`, `cur`, `next`. Doing it in groups adds the
bookkeeping that connects them:

```
before          groupPrev -> [ a b c ] -> rest
after           groupPrev -> [ c b a ] -> rest
                                   ^ this must end up pointing at `rest`
                                     and groupPrev must become `a`
```

The trick that removes most of the pain: seed the reversal's `prev` with the first
node *after* the group rather than with null. The group then ends up already
attached to what follows, and the only remaining job is to re-point `groupPrev`.
A dummy node in front of the head removes the last special case, which is that the
first group changes what `head` is.

## The recursive version overflows the stack, and small k is the danger

One frame per group, so the depth is `n / k`. Measured with an 8 MiB stack
(`ulimit -s` reports 8176 KiB):

| n | k | depth | result |
|---|---|---|---|
| 250,000 | 1 | 250,000 | OK |
| **300,000** | **1** | **300,000** | **stack overflow** |
| 1,000,000 | 1 | 1,000,000 | stack overflow |
| 1,000,000 | 2 | 500,000 | stack overflow |
| 1,000,000 | 3 | 333,333 | stack overflow |
| 1,000,000 | **4** | 250,000 | OK |
| 1,000,000 | 100 | 10,000 | OK |

The threshold sits between 250,000 and 300,000 frames — roughly 28 bytes of stack
per call. Note which direction the risk runs: at a million nodes the recursion
dies for k = 1, 2 and 3 and survives from k = 4 upward. Intuition says a large k
is the demanding case, and the opposite is true, because a larger k means *fewer*
groups and therefore fewer frames.

## What each approach costs

At n = 200,000, small enough that the recursion survives every k:

| k | iterative | recursive | collect and relink |
|---|---|---|---|
| 1 | **0** | 1,282,542 | 609,250 |
| 2 | **590,708** | 796,250 | 585,375 |
| 4 | **323,542** | 538,166 | 513,291 |
| 16 | **245,208** | 340,292 | 414,875 |
| 64 | **234,209** | 409,875 | 450,833 |
| 1,024 | **268,542** | 375,959 | 423,875 |

Nanoseconds. The iterative version wins at every k. Two rows deserve a second
look:

**k = 1 costs the iterative version nothing at all.** Reversing groups of one is
the identity, so it returns immediately. The recursive version still descends
200,000 frames to produce an unchanged list — 1.28 milliseconds of work for a
no-op, and a crash outright past 300,000 nodes.

**The iterative version gets faster as k grows**, 590,708 down to 234,209 between
k = 2 and k = 64, then flattens. The per-node work is fixed — each node is walked
twice, once by the probe and once by the reversal, `2n` steps regardless of k —
but the per-*group* bookkeeping is paid `n/k` times, so it thins out as groups get
longer.

<!-- @intuition -->
Almost everything here is bookkeeping rather than insight, and that is worth saying plainly, because the temptation with a Hard-labelled linked list problem is to look for a clever idea that is not there. The reversal is the one you already know. What the difficulty actually consists of is three separate things that each have an off-by-one available: deciding whether a group is complete, attaching a reversed group to what follows it, and advancing to the next group. The two techniques that make it manageable — seeding `prev` with the node after the group so the attachment happens for free, and putting a dummy in front of the head so the first group is not special — are both ways of removing a case rather than handling it. When a problem is mostly cases, the useful move is usually to find the framing where there are fewer of them.

<!-- @approach -->
### Collect the Nodes, Then Relink

<!-- @idea -->
Put every node pointer in an array, reverse each complete run of k in place, then rewrite all the `next` pointers in one pass.

<!-- @steps -->
1. Walk the list, pushing each node pointer into an array.
2. For each starting index i where a full group of k fits, reverse that slice of the array.
3. Walk the array once, pointing each node at its successor.
4. Terminate the last node and return the first.

<!-- @complexity -->
- time: O(n)
- space: O(n)
- note: The easiest to get right, because the linking is rebuilt from scratch rather than repaired. Competitive at small k and loses at large k, and it needs an array of n pointers.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

Node* reverseKGroup(Node* head, int k) {
    vector<Node*> ns;
    for (Node* p = head; p; p = p->next) ns.push_back(p);

    int n = (int)ns.size();
    for (int i = 0; i + k <= n; i += k)
        reverse(ns.begin() + i, ns.begin() + i + k);

    for (int i = 0; i < n; i++)
        ns[i]->next = (i + 1 < n) ? ns[i + 1] : nullptr;

    return n ? ns[0] : nullptr;
}
```

<!-- @annotations -->
- 10: `i + k <= n` is the leftover rule written as a loop bound — a short final group simply never enters the loop and keeps its order.
- 14: Every `next` is rewritten, including the ones that did not move — rebuilding rather than repairing is why this version has no stitching bugs. The last node is terminated by the same expression, since `i + 1 < n` is false exactly once.
- 16: `n ? ns[0] : nullptr` handles the empty list; `ns[0]` on an empty vector would be undefined.

<!-- @code java -->
```java
static Node reverseKGroup(Node head, int k) {
    ArrayList<Node> ns = new ArrayList<>();
    for (Node p = head; p != null; p = p.next) ns.add(p);

    int n = ns.size();
    for (int i = 0; i + k <= n; i += k)
        Collections.reverse(ns.subList(i, i + k));

    for (int i = 0; i < n; i++)
        ns.get(i).next = (i + 1 < n) ? ns.get(i + 1) : null;

    return n > 0 ? ns.get(0) : null;
}
```

<!-- @annotations -->
- 7: `subList` is a view, not a copy, so reversing it reorders the backing list directly — the same effect as the C++ iterator range.

<!-- @code python -->
```python
def reverse_k_group(head, k):
    ns = []
    p = head
    while p:
        ns.append(p)
        p = p.next

    n = len(ns)
    for i in range(0, n - k + 1, k):
        ns[i:i + k] = ns[i:i + k][::-1]

    for i in range(n):
        ns[i].next = ns[i + 1] if i + 1 < n else None

    return ns[0] if n else None
```

<!-- @annotations -->
- 9: `range(0, n - k + 1, k)` stops before any partial group, which is the same bound as `i + k <= n`. For `k > n` the range is empty and the list is returned untouched.

<!-- @approach -->
### Recursive, One Group per Frame

<!-- @idea -->
Reverse the first k nodes, then recursively solve the rest and attach it behind them.

<!-- @steps -->
1. Walk k nodes ahead. If the list runs out first, return the head unchanged.
2. Recurse on the node after the group; it returns the already-processed remainder.
3. Reverse the first k nodes, seeding `prev` with that remainder.
4. Return the new front of the group.

<!-- @complexity -->
- time: O(n)
- space: O(n/k) stack frames
- note: The version usually taught, and the one that crashes: **stack overflow between 250,000 and 300,000 frames** on an 8 MiB stack. At n = 1,000,000 it dies for k = 1, 2 and 3.

<!-- @code cpp -->
```cpp
Node* reverseKGroup(Node* head, int k) {
    Node* probe = head;
    for (int i = 0; i < k; i++) {
        if (!probe) return head;
        probe = probe->next;
    }

    Node* prev = reverseKGroup(probe, k);
    Node* cur = head;
    for (int i = 0; i < k; i++) {
        Node* nxt = cur->next;
        cur->next = prev;
        prev = cur;
        cur = nxt;
    }
    return prev;
}
```

<!-- @annotations -->
- 4: The probe runs **before** the recursion, so a short final group is returned untouched without descending further. Reversing first and checking after is the usual way this goes wrong.
- 8: Seeding `prev` with the already-processed remainder is what attaches this group to the next one — no separate stitching step exists in this version.
- 9: The recursion happens before any pointer is modified, so the frame's `head` still means what it did on entry.
- 16: Returning `prev` returns the *last* node of the original group, which is the first node after reversal.

<!-- @code java -->
```java
static Node reverseKGroup(Node head, int k) {
    Node probe = head;
    for (int i = 0; i < k; i++) {
        if (probe == null) return head;
        probe = probe.next;
    }

    Node prev = reverseKGroup(probe, k);
    Node cur = head;
    for (int i = 0; i < k; i++) {
        Node nxt = cur.next;
        cur.next = prev;
        prev = cur;
        cur = nxt;
    }
    return prev;
}
```

<!-- @annotations -->
- 8: The JVM's default thread stack is around 512 KiB — smaller than the 8 MiB measured here — so this overflows at a correspondingly lower depth.

<!-- @code python -->
```python
def reverse_k_group(head, k):
    probe = head
    for _ in range(k):
        if probe is None:
            return head
        probe = probe.next

    prev = reverse_k_group(probe, k)
    cur = head
    for _ in range(k):
        nxt = cur.next
        cur.next = prev
        prev = cur
        cur = nxt
    return prev
```

<!-- @annotations -->
- 8: CPython's recursion limit is 1,000 by default, so this raises `RecursionError` at roughly n/k = 1000 — long before any stack actually runs out.

<!-- @approach -->
### Iterative with a Group Probe

<!-- @idea -->
Before each group, walk k nodes ahead to confirm it is complete; reverse it seeded with the node that follows, then move the anchor forward.

<!-- @steps -->
1. Put a dummy node in front of the head and anchor `groupPrev` there.
2. Probe k nodes past `groupPrev`. If you fall off the end, stop — the rest is a short group.
3. Reverse the k nodes, seeding `prev` with the node after the group.
4. The old first node of the group is now its last, so it becomes the next `groupPrev`.
5. Point the old `groupPrev` at the group's new front.
6. Return `dummy.next`.

<!-- @complexity -->
- time: O(n), each node walked twice
- space: O(1)
- note: Fastest at every k measured, and the only version with constant space and no depth limit. At k = 1 it returns immediately, where the recursive version spends 200,000 frames producing an unchanged list.

<!-- @code cpp -->
```cpp
Node* reverseKGroup(Node* head, int k) {
    if (!head || k <= 1) return head;

    Node dummy(0);
    dummy.next = head;
    Node* groupPrev = &dummy;

    while (true) {
        Node* probe = groupPrev;
        for (int i = 0; i < k && probe; i++) probe = probe->next;
        if (!probe) break;

        Node* prev = probe->next;
        Node* cur = groupPrev->next;
        for (int i = 0; i < k; i++) {
            Node* nxt = cur->next;
            cur->next = prev;
            prev = cur;
            cur = nxt;
        }

        Node* newGroupPrev = groupPrev->next;
        groupPrev->next = prev;
        groupPrev = newGroupPrev;
    }
    return dummy.next;
}
```

<!-- @annotations -->
- 2: `k <= 1` is the identity, and returning at once is why this column reads 0ns at k = 1 while the recursive version spends 1.28ms.
- 4: The dummy removes the only special case — that reversing the first group changes what `head` is. Without it the first iteration needs its own code path.
- 10: The probe answers "are there k nodes left?" before anything is modified. This is the line that decides which of the two specifications you have implemented.
- 13: `prev` is seeded with the node *after* the group rather than null, so the reversed group comes out already attached to the rest. That removes the stitching step entirely.
- 22: `groupPrev->next` is read **before** it is overwritten on the next line — it is the group's old first node, which after reversal is its last, and therefore the anchor for the group that follows.
- 26: `dummy.next` rather than `head`, because `head` is no longer the front once the first group is reversed.

<!-- @code java -->
```java
static Node reverseKGroup(Node head, int k) {
    if (head == null || k <= 1) return head;

    Node dummy = new Node(0);
    dummy.next = head;
    Node groupPrev = dummy;

    while (true) {
        Node probe = groupPrev;
        for (int i = 0; i < k && probe != null; i++) probe = probe.next;
        if (probe == null) break;

        Node prev = probe.next;
        Node cur = groupPrev.next;
        for (int i = 0; i < k; i++) {
            Node nxt = cur.next;
            cur.next = prev;
            prev = cur;
            cur = nxt;
        }

        Node newGroupPrev = groupPrev.next;
        groupPrev.next = prev;
        groupPrev = newGroupPrev;
    }
    return dummy.next;
}
```

<!-- @annotations -->
- 10: `probe != null` is tested inside the loop condition, so the probe stops at the end of the list rather than dereferencing null.

<!-- @code python -->
```python
def reverse_k_group(head, k):
    if head is None or k <= 1:
        return head

    dummy = Node(0)
    dummy.next = head
    group_prev = dummy

    while True:
        probe = group_prev
        for _ in range(k):
            probe = probe.next
            if probe is None:
                break
        if probe is None:
            break

        prev = probe.next
        cur = group_prev.next
        for _ in range(k):
            nxt = cur.next
            cur.next = prev
            prev = cur
            cur = nxt

        new_group_prev = group_prev.next
        group_prev.next = prev
        group_prev = new_group_prev

    return dummy.next
```

<!-- @annotations -->
- 13: The inner `break` leaves `probe` as `None`, which the outer test then catches — Python has no `&&` inside a `for`, so the check moves into the body.
- 26: Reading `group_prev.next` before reassigning it, exactly as in C++. Swapping these two lines loses the anchor and the loop stops making progress.

<!-- @example -->

<!-- @input -->
```
1 -> 2 -> 3 -> 4 -> 5,  k = 2
```

<!-- @output -->
```
2 -> 1 -> 4 -> 3 -> 5
```

<!-- @why -->
Two complete pairs are reversed. The final node has no partner, so it stays where it is.

<!-- @walkthrough -->
```
probe 2 ahead from the dummy   found [1,2]        reverse  ->  2 -> 1
probe 2 ahead from node 1      found [3,4]        reverse  ->  4 -> 3
probe 2 ahead from node 3      only 1 node left   stop

2 -> 1 -> 4 -> 3 -> 5

Each reversal seeds `prev` with the node after the group,
so [1,2] comes out as 2 -> 1 -> 3 already attached. Nothing
has to be stitched afterwards.
```

<!-- @example -->

<!-- @input -->
```
1 -> 2 -> 3 -> 4 -> 5,  k = 3
```

<!-- @output -->
```
3 -> 2 -> 1 -> 4 -> 5
```

<!-- @why -->
One complete group of three, then two leftover nodes that stay in order. The same list with k = 2 gives a different answer, which is worth checking against by hand.

<!-- @walkthrough -->
```
probe 3 ahead from the dummy   found [1,2,3]      reverse  ->  3 -> 2 -> 1
probe 3 ahead from node 1      only 2 nodes left  stop

3 -> 2 -> 1 -> 4 -> 5

The leftover 4 -> 5 is never touched. Under the other
specification it would come back as 5 -> 4, which is the
38.89% disagreement.
```

<!-- @example -->

<!-- @input -->
```
1 -> 2,  k = 3
```

<!-- @output -->
```
1 -> 2
```

<!-- @why -->
The smallest input on which the two specifications disagree. No group of three exists, so under LeetCode 25 nothing happens at all.

<!-- @walkthrough -->
```
probe 3 ahead from the dummy   only 2 nodes left  stop immediately

1 -> 2                        leftover untouched
2 -> 1                        what the other specification returns

A version written without the probe reverses whatever it
finds and returns 2 -> 1. Measured, that matches the
reverse-the-leftover specification on all 72 cases and
disagrees with LeetCode 25 on 38.89% of them. It is a
different problem, not broken code.
```

<!-- @example -->

<!-- @input -->
```
1 -> 2 -> 3 -> 4 -> 5,  k = 1
```

<!-- @output -->
```
1 -> 2 -> 3 -> 4 -> 5
```

<!-- @why -->
Reversing groups of one is the identity. The iterative version detects this and returns at once; the recursive version does not, and this is exactly where it is most likely to crash.

<!-- @walkthrough -->
```
iterative:  `k <= 1` -> return head          0 ns at n = 200,000

recursive:  one frame per node
              n = 200,000  ->  1.28 ms to produce an unchanged list
              n = 300,000  ->  stack overflow

Because the depth is n/k, small k is the dangerous case.
At n = 1,000,000 the recursion dies for k = 1, 2 and 3 and
survives from k = 4 up.
```

<!-- @visualization custom -->

<!-- @description -->
Shows the group probe that decides which specification you have implemented, the seeding trick that removes the stitching step, and why the recursive version's depth makes small k the dangerous case.

<!-- @sampleInput -->
```json
{"primary":{"list":[1,2,3,4,5],"k":2,"answer":[2,1,4,3,5],"steps":[{"probe":"2 ahead from the dummy","found":[1,2],"action":"reverse to 2 -> 1"},{"probe":"2 ahead from node 1","found":[3,4],"action":"reverse to 4 -> 3"},{"probe":"2 ahead from node 3","found":"only 1 node left","action":"stop"}]},"theLeftoverClause":{"twoRealProblems":[{"spec":"leave a short final group alone","source":"LeetCode 25"},{"spec":"reverse it anyway","source":"a common interview variant"}],"distinguishedBy":"the check performed before reversing","measured":{"space":"every list of length 0..8, every k from 1..8","cases":72,"disagree":28,"pct":38.89},"smallestDisagreement":{"list":[1,2],"k":3,"leaveLeftover":[1,2],"reverseLeftover":[2,1]},"noProbeVersion":{"vsLeetCode25":"28 wrong (38.89%)","vsReverseTheLeftover":"0 wrong","reading":"it is not broken code - it answers the other question"},"lesson":"establish which question you were asked, because testing against your own expectations cannot reveal the difference"},"theSeedingTrick":{"problem":"a reversed group must end up attached to what follows it, and groupPrev must advance","solution":"seed the reversal's prev with the first node AFTER the group rather than with null","effect":"the group comes out already attached, so no stitching step exists","dummyNode":"removes the remaining special case - that reversing the first group changes what head is","anchorAdvance":"groupPrev->next must be READ before it is overwritten: the group's old first node is its last after reversal, and therefore the next anchor"},"recursionDepth":{"framesPerGroup":1,"depth":"n / k","stack":"8 MiB (ulimit -s reports 8176 KiB)","rows":[{"n":250000,"k":1,"depth":250000,"result":"OK"},{"n":300000,"k":1,"depth":300000,"result":"stack overflow"},{"n":1000000,"k":1,"depth":1000000,"result":"stack overflow"},{"n":1000000,"k":2,"depth":500000,"result":"stack overflow"},{"n":1000000,"k":3,"depth":333333,"result":"stack overflow"},{"n":1000000,"k":4,"depth":250000,"result":"OK"},{"n":1000000,"k":100,"depth":10000,"result":"OK"}],"threshold":"between 250,000 and 300,000 frames - roughly 28 bytes of stack per call","counterintuitive":"intuition says a large k is demanding; the opposite is true, because a larger k means fewer groups and therefore fewer frames","otherLanguages":{"java":"default thread stack around 512 KiB, so it overflows sooner","python":"CPython's recursion limit is 1000, so it raises RecursionError at about n/k = 1000"}},"cost":{"unit":"nanoseconds, n = 200,000","rows":[{"k":1,"iterative":0,"recursive":1282542,"collectAndRelink":609250},{"k":2,"iterative":590708,"recursive":796250,"collectAndRelink":585375},{"k":4,"iterative":323542,"recursive":538166,"collectAndRelink":513291},{"k":16,"iterative":245208,"recursive":340292,"collectAndRelink":414875},{"k":64,"iterative":234209,"recursive":409875,"collectAndRelink":450833},{"k":1024,"iterative":268542,"recursive":375959,"collectAndRelink":423875}],"kEqualsOne":"reversing groups of one is the identity - the iterative version returns immediately, while the recursive one descends 200,000 frames to produce an unchanged list, and crashes outright past 300,000 nodes","iterativeSpeedsUpWithK":{"from":590708,"to":234209,"between":"k = 2 and k = 64","why":"per-node work is fixed at 2n steps (once probing, once reversing) but the per-GROUP bookkeeping is paid n/k times, so it thins out as groups get longer"}},"assertions":["a short final group is left untouched","each node is walked exactly twice by the iterative version","the reversal is seeded with the node after the group","reversing groups of size 1 is the identity","the recursive depth is n/k, not n"]}
```

<!-- @highlights -->
- The reversal is the one you already know; the difficulty is the bookkeeping around it.
- "Leave the short final group" and "reverse it anyway" are **both real problems** and disagree on **38.89%** of inputs — smallest case is `1 -> 2` with k = 3.
- A version without the probe isn't broken — it's **0 wrong** against the *other* specification.
- Seeding `prev` with the node **after** the group makes the reversed group come out already attached, removing the stitching step.
- The recursive version overflows an 8 MiB stack between **250,000 and 300,000 frames**; depth is `n/k`, so **small k is the danger** — at n = 10⁶ it dies for k = 1, 2, 3.
- At **k = 1** the answer is the unchanged list: the iterative version returns in 0ns, the recursive one burns 200,000 frames.

<!-- @edgeCases -->
- `k = 1` — the identity; return immediately, and the recursive version's worst case.
- `k >= n` — no complete group exists, so the list is returned untouched.
- Empty list — the probe fails on its first step.
- Single node — same, for any k > 1.
- `n` an exact multiple of k — no leftover, and the only case where both specifications agree by construction.
- Exactly one node left over — the smallest leftover, and where the probe earns its keep.
- The first group — changes what `head` is, which is what the dummy node absorbs.
- Very large n with small k — where the recursion dies and the iteration does not.
- `k <= 0` — outside the problem statement; guard it with the `k <= 1` early return.

<!-- @pitfalls -->
- Reversing first and checking the group length afterwards. That silently implements the other specification, which differs on 38.89% of inputs.
- Seeding the reversal's `prev` with null. The group is then detached and has to be stitched back by hand, which is where most off-by-ones live.
- Overwriting `groupPrev->next` before reading it. The old first node is the next anchor; lose it and the loop stops advancing.
- Returning `head` instead of `dummy.next`. `head` is no longer the front once the first group is reversed.
- Omitting the dummy node. The first group then needs its own code path.
- Using the recursive version on large input with small k. It overflows between 250,000 and 300,000 frames, and Java and Python fail far sooner.
- Assuming large k is the demanding case for recursion. Depth is `n/k`, so it is the reverse.
- Forgetting the `k <= 1` early return. Correct without it, and it turns a no-op into full work.

<!-- @doubt -->
### What exactly does the group probe decide?

<!-- @answer -->
Which problem you are solving. Walking k nodes ahead before touching anything is what distinguishes "leave a short final group alone" — LeetCode 25 — from "reverse whatever is left", a common interview variant. Both are legitimate; the code differs by that one check. Measured over every list of length 0 to 8 with every k from 1 to 8, **72 cases**, the two specifications produce different answers on **28 of them, 38.89%**, and the smallest example needs only two nodes: `1 -> 2` with k = 3 is unchanged under the first reading and becomes `2 -> 1` under the second. A version written without the probe was **0 wrong** against the reverse-the-leftover specification — it is not buggy code, it answers a different question. This is why the clause is worth reading twice: your own tests encode your own reading, so they cannot catch the mismatch.

<!-- @doubt -->
### Why seed `prev` with the node after the group instead of null?

<!-- @answer -->
Because it makes the attachment happen for free. A plain reversal seeds `prev = nullptr` so the reversed list terminates; here you do not want termination, you want the group to point at whatever follows it. Seeding `prev` with `probe->next` — the first node past the group — means that when the loop finishes, the group's last node already points at the rest of the list, and no separate stitching step exists. The alternative is to reverse with null, then find the group's new tail and attach it, which is two more pointer operations and the place most implementations get an off-by-one. It is the same style of move as the dummy head node: rather than handling a case, arrange for the case not to arise.

<!-- @doubt -->
### Why does the recursive version fail on small k rather than large?

<!-- @answer -->
Because it uses one stack frame per **group**, and there are `n/k` groups — so shrinking k *increases* the depth. Measured on an 8 MiB stack, the recursion survives 250,000 frames and overflows at 300,000, roughly 28 bytes per call. At n = 1,000,000 that means it dies for k = 1 (depth 10⁶), k = 2 (500,000) and k = 3 (333,333), and survives from k = 4 (250,000) upward. The most embarrassing case is k = 1, where the correct answer is the list unchanged: the iterative version returns immediately while the recursive one descends 200,000 frames to reproduce its input, taking 1.28ms at n = 200,000 and crashing past 300,000. Other languages fail sooner, not later — a JVM thread stack defaults to around 512 KiB, and CPython raises `RecursionError` at a depth of 1,000 regardless of memory.

<!-- @doubt -->
### Why does the iterative version get faster as k increases?

<!-- @answer -->
Because the per-node work is fixed while the per-group work is not. Every node is walked exactly twice — once by the probe confirming the group is complete, once by the reversal — so the node-level cost is `2n` steps whatever k is. The bookkeeping around each group (seeding `prev`, reading the old first node, re-pointing the anchor) is paid once per group, and there are `n/k` groups. Larger k means fewer groups and so less of that overhead: measured at n = 200,000 the time falls from **590,708ns at k = 2 to 234,209ns at k = 64**, then flattens once the per-group cost has become negligible. It is a useful reminder that "O(n) regardless of k" describes the node traversals only; the constant in front of it is a function of k.

<!-- @doubt -->
### Is the array-based version ever the right choice?

<!-- @answer -->
It is the one to reach for when correctness matters more than constants, or when you are writing it under time pressure. It rebuilds every `next` pointer from scratch rather than repairing links in place, so the whole class of stitching bugs — detached groups, lost anchors, a stale `head` — cannot occur; the leftover rule reduces to a loop bound, `i + k <= n`. It measured competitively at small k (585,375ns against the iterative 590,708 at k = 2) and lost at larger k (423,875 against 268,542 at k = 1,024), and it costs O(n) space for the pointer array. So it is a reasonable answer, just not the best one, and it does not demonstrate the pointer manipulation the question is usually asking you to demonstrate.
