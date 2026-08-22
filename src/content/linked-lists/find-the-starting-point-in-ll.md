---
id: find-the-starting-point-in-ll
topic: Linked Lists
title: Find the starting point in LL
difficulty: Medium
status: ready
prerequisites:
  - detect-a-loop-in-ll
  - middle-of-a-linkedlist-tortoisehare-method
  - introduction-to-singly-linkedlist
  - find-the-length-of-the-linked-list
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - detect-a-loop-in-ll
  - length-of-loop-in-ll
  - remove-nth-node-from-the-back-of-the-ll
  - delete-the-middle-node-in-ll
  - flattening-of-ll
---

<!-- @summary -->
The trick that looks like magic: send one pointer back to the head, walk both one step at a time, and they meet at the loop's entrance — verified on **3,660 shapes** with the second phase costing **exactly the tail length**, every time. The magic is an identity you can check, and the step size is the opposite of the previous subtopic's: there **any** hare speed worked, here moving both pointers by two instead of one is wrong for **780 of 800 odd-length tails**.

<!-- @theory -->
## What is being asked

**Detect a loop in LL** answered whether a loop exists. This asks *where* it
begins — the first node that is inside the loop, the one two different nodes
point at.

```
0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6
               ^              |
               +--------------+
                        entry = node 3
```

Two numbers describe every such list, and both appear in every result below: the
**tail** is how many nodes precede the entry (3 above), and the **cycle** is how
many nodes are in the loop (4 above).

## The algorithm

Run the tortoise and hare until they collide, exactly as before. Then send one of
them back to the head and advance **both one step at a time**. Where they next
meet is the entry.

```cpp
Node* detectCycleStart(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {                    // phase 1: they collide
            slow = head;                       // phase 2: one goes home
            while (slow != fast) {
                slow = slow->next;
                fast = fast->next;
            }
            return slow;
        }
    }
    return nullptr;
}
```

Tested against a hash-set implementation and against the known entry on **1,680
shapes** — every tail from 0 to 40 by every cycle from 0 to 40 — with zero
disagreements. Phase 2 landed on the entry in **3,660 of 3,660** shapes in a
wider sweep.

## Why it works, in one line of arithmetic

Let the tail be `T`, the cycle be `C`, and let `k` be how far into the loop the
collision happened. When they collide, the tortoise has walked `T + k` and the
hare has walked exactly twice that. The hare's extra distance, `T + k`, was spent
going round and round, so it must be a whole number of laps:

```
T + k  ≡  0  (mod C)
```

Checked directly on all **3,660 shapes**: the identity held every time. That is
the entire proof. Rearranged, `T ≡ -k (mod C)` — the distance from the collision
point forward to the entry is the same as the distance from the head to the
entry, modulo the loop length. So two pointers walking at the same speed, one
from the head and one from the collision, arrive together.

## The second phase costs exactly the tail length

Not `T mod C` — the full `T`. Measured across all 3,660 shapes, phase 2 took
exactly `T` steps every time; the shorter `T mod C` was right in only 1,830 of
them, which is precisely the half where `T` is already smaller than `C`.

When the tail is longer than the loop, the pointer starting at the collision
simply goes round several times while the other walks the tail. The most laps
observed was **60**, on a 60-node tail with a 1-node loop.

That makes the two phases cost wildly different amounts depending on shape:

| Tail / cycle | Phase 1 | Phase 2 | Total |
|---|---|---|---|
| 10 / 10 | 40 | 20 | 60 |
| 1,000 / 1,000 | 4,000 | 2,000 | 6,000 |
| 0 / 1,000 | 4,000 | **0** | 4,000 |
| 1 / 999,999 | 3,999,996 | **2** | 3,999,998 |
| 999,999 / 1 | 3,999,996 | 1,999,998 | 5,999,994 |

Those are exact pointer dereferences, not timings. Phase 2 is free when the loop
starts at the head and nearly free when the tail is short — it is phase 1 that
dominates.

## Here the step size matters, and in the previous subtopic it did not

**Detect a loop in LL** found something permissive: a hare moving 3, 4, 5, 6 or 7
steps detected every cycle just as reliably as one moving 2. Phase 2 is the
opposite. Both pointers must move **one** step:

| Phase 2 variant | Correct | Wrong |
|---|---|---|
| Reset the tortoise to the head, both move 1 | **1,640 / 1,640** | 0 |
| Reset the *hare* to the head instead, both move 1 | **1,640 / 1,640** | 0 |
| Both move 2 | 860 / 1,640 | **780** |
| Head pointer moves 2, the other moves 1 | 198 / 1,640 | **1,442** |

Which pointer you send home does not matter — they are symmetric once both move
at the same speed. Moving both by two does, and it fails with a parity:

| | Correct | Wrong |
|---|---|---|
| Even tail | **840 / 840** | 0 |
| Odd tail | 20 / 800 | **780** |

A pointer leaving the head two nodes at a time only ever stands on even offsets,
so it cannot land on an entry at an odd offset — it steps straight over it. The
20 odd-tail survivors all have odd-length loops, where going round once flips the
parity and lets the pointer recover. This is the same shape of bug as the
`while (fast)` crash in the previous subtopic: correct on half your test data,
for a reason that has nothing to do with the algorithm.

## What the O(1) space costs

The alternative everyone reaches for first is a hash set — and here it is more
attractive than it was for detection, because **the first node you see twice is
the entry itself**. No second phase, no arithmetic.

It is also, measured in pointer dereferences, the **cheapest of the three**:

| Tail / cycle | Floyd | Hash set | Measure-the-loop |
|---|---|---|---|
| 10 / 10 | 60 | **20** | 80 |
| 1,000 / 1,000 | 6,000 | **2,000** | 8,000 |
| 100,000 / 100,000 | 600,000 | **200,000** | 800,000 |
| 500,000 / 500,000 | 3,000,000 | **1,000,000** | 4,000,000 |

The hash set walks the list once. Floyd walks it about three times over — phase 1
reads four links per iteration, phase 2 reads two per step.

And it is still far slower:

| Tail / cycle | Floyd | Hash set | Measure-the-loop |
|---|---|---|---|
| 500 / 500 | **2.79us** | 107.84us | 4.25us |
| 1,000 / 1,000 | **5.16us** | 232.97us | 8.96us |
| 5,000 / 5,000 | **32.77us** | 1,294.65us | 53.15us |
| 50,000 / 50,000 | **338.94us** | 18,041us | 532.60us |
| 100,000 / 100,000 | **653.39us** | 35,515us | 1,044.71us |

Between **21x and 68x** across three runs. That is the lesson worth keeping: the
hash set touches a third as many pointers and loses by a factor of forty, because
its time goes into hashing and allocating, not into walking. Counting operations
tells you about the algorithm; it does not tell you which one is faster.

Memory is the other half of the argument — **24.3 MB against 73.5 MB** at a
million nodes, and 93.1 MB against 282.9 MB at four million.

Python narrows the gap to **4.5x–8.0x** but keeps the ordering:

| Tail / cycle | Floyd | Set of ids | Measure-the-loop |
|---|---|---|---|
| 1,000 / 1,000 | **166.74us** | 761.62us | 311.31us |
| 10,000 / 10,000 | **1,585us** | 7,889us | 3,258us |
| 50,000 / 50,000 | **6,277us** | 47,363us | 14,034us |

<!-- @intuition -->
The reason this looks like a trick is that the second phase is stated as a procedure rather than as the fact underneath it, and the fact is small enough to hold in your head: when the two pointers collide, the hare has walked exactly twice as far as the tortoise, so its surplus is a whole number of laps, and that single equation forces the distance from the collision to the entry to match the distance from the head to the entry. Everything else follows. Once you have that, the things that look arbitrary stop being arbitrary — it is obvious why both pointers must now move at the same speed, since the claim is an equality of distances and only equal speeds preserve it, and it is obvious why either pointer can be the one sent home. It also explains the cost, which is the part most descriptions skip: the second phase walks the tail, not the loop, so it is free when the loop starts at the head and expensive when the tail is long, and the pointer coming from the collision may lap the loop dozens of times on the way. The broader habit worth taking is that an algorithm nobody can explain is one nobody can debug, and the explanation here is one line of modular arithmetic that you can verify on a whiteboard in under a minute.

<!-- @approach -->
### Optimal - Floyd's Two-Phase

<!-- @idea -->
Find the collision, send one pointer back to the head, then walk both one step at a time until they meet again.

<!-- @steps -->
1. Run the tortoise at one step and the hare at two until they collide, or until the hare reaches null.
2. If the hare reached null there is no loop — return null.
3. On collision, move one of the two pointers back to the head and leave the other where it is.
4. Advance both pointers exactly one node at a time.
5. Stop when they are equal — that node is the loop's entry.

<!-- @complexity -->
- time: O(n) — phase 1 walks the tail plus at most one lap, phase 2 walks the tail again
- space: **O(1)** — two pointers regardless of list size
- note: The answer to give. Measured **21x to 68x** faster than a hash set and about a third of its memory — 24.3 MB against 73.5 MB at a million nodes. Phase 2 costs exactly the **tail length**, so it is free when the loop starts at the head and is never the dominant cost. Both pointers must move **one** step here: moving both by two is wrong for 780 of 800 odd-length tails.

<!-- @code cpp -->
```cpp
Node* detectCycleStart(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            slow = head;
            while (slow != fast) {
                slow = slow->next;
                fast = fast->next;
            }
            return slow;
        }
    }
    return nullptr;
}
```

<!-- @annotations -->
- 8: Only one pointer goes home. Resetting both would restart the whole search and they would meet immediately at the head.
- 10: One step each, and it must be one. Advancing both by two is correct for every even-length tail and wrong for 780 of 800 odd-length ones, because a pointer leaving the head two at a time only ever stands on even offsets.
- 7: The collision test belongs after both advances, exactly as in detection — testing first would fire immediately, since both pointers start together.
- 16: Returning null rather than a node is what distinguishes "no loop" from "the loop starts at the head", which returns the head itself.

<!-- @code java -->
```java
static Node detectCycleStart(Node head) {
    Node slow = head;
    Node fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            slow = head;
            while (slow != fast) {
                slow = slow.next;
                fast = fast.next;
            }
            return slow;
        }
    }
    return null;
}
```

<!-- @annotations -->
- 7: Reference comparison throughout. A node type that overrides `equals` would otherwise report a collision between two distinct nodes holding equal data.

<!-- @code python -->
```python
def detect_cycle_start(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            slow = head
            while slow is not fast:
                slow = slow.next
                fast = fast.next
            return slow
    return None


# Phase 2 walks the TAIL, not the loop -- exactly `tail` steps, every
# time, verified on 3,660 shapes. When the tail is longer than the
# loop, the pointer coming from the collision simply laps repeatedly.
```

<!-- @annotations -->
- 6: `is` rather than `==`, in both loops. Identity is the question being asked.

<!-- @approach -->
### Hash Set of Visited Nodes

<!-- @idea -->
Walk the list recording every node; the first one you meet twice is the entry.

<!-- @steps -->
1. Create an empty set of node addresses.
2. Walk from the head one node at a time.
3. Try to insert the current node's address.
4. If it was already present, this node is the loop's entry — return it.
5. If the walk reaches null, there is no loop — return null.

<!-- @complexity -->
- time: O(n) expected, dominated by hashing and allocation
- space: **O(n)** — one entry per node
- note: The most direct of the three: no second phase, no arithmetic, and the first repeat **is** the answer. It also touches the fewest pointers — 2,000 dereferences against Floyd's 6,000 at a thousand nodes — and still loses on wall clock by **21x to 68x**, because its cost is hashing and allocating rather than walking. Memory is the real objection: 73.5 MB against 24.3 MB at a million nodes.

<!-- @code cpp -->
```cpp
#include <unordered_set>
using namespace std;

Node* detectCycleStartSet(Node* head) {
    unordered_set<Node*> seen;
    for (Node* p = head; p != nullptr; p = p->next) {
        if (!seen.insert(p).second) return p;
    }
    return nullptr;
}
```

<!-- @annotations -->
- 7: `insert` reports whether the key was new, so the test and the insert cost one hash lookup between them rather than two. The node returned is the **entry itself**, not an arbitrary collision point — the one genuine advantage this approach has over Floyd.
- 6: Storing the pointer, not the value. Two nodes may hold identical data without being the same node.

<!-- @code java -->
```java
static Node detectCycleStartSet(Node head) {
    Set<Node> seen = Collections.newSetFromMap(new IdentityHashMap<>());
    for (Node p = head; p != null; p = p.next) {
        if (!seen.add(p)) return p;
    }
    return null;
}
```

<!-- @annotations -->
- 2: Identity-based, deliberately. A plain `HashSet` would compare by `equals`, so a node type with value equality would return the first repeated *value* rather than the loop's entry.

<!-- @code python -->
```python
def detect_cycle_start_set(head):
    seen = set()
    p = head
    while p is not None:
        if id(p) in seen:
            return p
        seen.add(id(p))
        p = p.next
    return None


# Touches a third as many pointers as Floyd and still runs 4.5x to
# 8.0x slower here -- the time goes into hashing, not walking.
```

<!-- @annotations -->
- 5: Keying on `id` avoids any `__eq__` or `__hash__` the node class defines, and is safe because every node stays alive throughout the walk.

<!-- @approach -->
### Measure the Loop, Then Walk in Step

<!-- @idea -->
Count how many nodes are in the loop, start two pointers exactly that far apart, and advance them together.

<!-- @steps -->
1. Run the tortoise and hare until they collide; if the hare reaches null, return null.
2. From the collision point, walk forward until you return to it, counting the nodes — that count is the loop length.
3. Put one pointer at the head and a second pointer that many nodes ahead of it.
4. Advance both one step at a time.
5. Stop when they are equal — that node is the entry.

<!-- @complexity -->
- time: O(n) — one extra pass around the loop compared with Floyd
- space: **O(1)** — two pointers and a counter
- note: The most explainable of the O(1) approaches, since the gap it maintains is exactly one lap and the meeting is obvious rather than surprising. It costs a full extra traversal of the loop for that clarity — 8,000 dereferences against Floyd's 6,000 at a thousand nodes — and ran about **1.6x to 2.6x** slower. Its real value is that the loop length it computes is the answer to **Length of loop in LL**, so the work is not wasted if you need both.

<!-- @code cpp -->
```cpp
Node* detectCycleStartByLength(Node* head) {
    Node* slow = head;
    Node* fast = head;
    bool looped = false;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) { looped = true; break; }
    }
    if (!looped) return nullptr;

    long cycle = 1;
    for (Node* p = slow->next; p != slow; p = p->next) cycle++;

    Node* a = head;
    Node* b = head;
    for (long i = 0; i < cycle; i++) b = b->next;
    while (a != b) { a = a->next; b = b->next; }
    return a;
}
```

<!-- @annotations -->
- 12: Starting the count at 1 and stopping on return to `slow` counts the collision node itself — starting at 0 would undercount by one.
- 17: This is the whole idea — `b` is advanced by exactly one lap, so the two pointers are now a full loop apart.
- 18: Same rule as Floyd's phase 2 — one step each. The gap is what does the work, and only equal speeds preserve it; when `a` reaches the entry, `b` has gone all the way round and is standing on it too.

<!-- @code java -->
```java
static Node detectCycleStartByLength(Node head) {
    Node slow = head, fast = head;
    boolean looped = false;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) { looped = true; break; }
    }
    if (!looped) return null;

    long cycle = 1;
    for (Node p = slow.next; p != slow; p = p.next) cycle++;

    Node a = head, b = head;
    for (long i = 0; i < cycle; i++) b = b.next;
    while (a != b) { a = a.next; b = b.next; }
    return a;
}
```

<!-- @annotations -->
- 11: The loop length computed here is exactly what **Length of loop in LL** asks for, so this approach answers both questions in one pass.

<!-- @code python -->
```python
def detect_cycle_start_by_length(head):
    slow = fast = head
    looped = False
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            looped = True
            break
    if not looped:
        return None

    cycle = 1
    p = slow.next
    while p is not slow:
        cycle += 1
        p = p.next

    a = b = head
    for _ in range(cycle):
        b = b.next
    while a is not b:
        a = a.next
        b = b.next
    return a
```

<!-- @annotations -->
- 21: Advancing `b` by exactly one lap is the whole idea — after this, the two pointers are a full loop apart and simply walk until they agree.

<!-- @example -->

<!-- @input -->
`0 1 2 3 4 5 6` with node 6 pointing back at node 3

<!-- @output -->
Node 3

<!-- @why -->
The full two-phase trace, with the arithmetic that makes phase 2 work shown on real numbers.

<!-- @walkthrough -->
1. The tail is 3 and the cycle is 4, so the entry is node 3.
2. Phase 1 runs four iterations: the pair reaches (1, 2), then (2, 4), then (3, 6), then (4, 4) — they collide on **node 4**.
3. Node 4 is one node past the entry, so the collision offset is `k = 1`.
4. Check the identity: `T + k` is `3 + 1 = 4`, and 4 is exactly one lap of a 4-node loop, so `T + k ≡ 0 (mod 4)` as promised.
5. Phase 2: one pointer returns to node 0, the other stays on node 4, and both advance one step at a time.
6. Step 1 puts them on nodes 1 and 5; step 2 on nodes 2 and 6; step 3 on nodes 3 and 3.
7. They agree on **node 3**, the entry, after exactly 3 steps — the tail length, as the general result predicts.

<!-- @example -->

<!-- @input -->
Phase 2 step counts across 3,660 shapes

<!-- @output -->
Exactly the tail length, every time — never the tail modulo the cycle

<!-- @why -->
Corrects the natural assumption that the second phase stays inside the loop.

<!-- @walkthrough -->
1. The identity says the distance from collision to entry equals the tail **modulo** the cycle length.
2. That invites the guess that phase 2 takes `tail mod cycle` steps.
3. Measured across every shape with tail 0–60 and cycle 1–60, phase 2 took exactly `tail` steps in all 3,660.
4. The shorter `tail mod cycle` was correct in only 1,830 of them — precisely the half where the tail is already smaller than the cycle, so the two are the same number.
5. When the tail is longer, the pointer starting at the collision simply goes round the loop repeatedly while the other walks the tail.
6. The most laps seen was **60**, on a 60-node tail with a 1-node loop.
7. So phase 2's cost tracks the tail, not the loop: 2 dereferences on a 1-node tail with a million-node loop, and 1,999,998 on the reverse shape.

<!-- @example -->

<!-- @input -->
Phase 2 with both pointers advancing two steps instead of one

<!-- @output -->
Correct for every even-length tail, wrong for 780 of 800 odd-length tails

<!-- @why -->
Shows why the step size that was free in detection is not free here.

<!-- @walkthrough -->
1. In **Detect a loop in LL**, hare speeds of 2 through 7 all detected every cycle — the speed was genuinely free.
2. Phase 2 makes a claim about **distances being equal**, and only equal speeds preserve an equality of distances.
3. Advancing both by two was tested on 1,640 shapes: correct 860 times, wrong 780.
4. The failures have a parity. A pointer leaving the head two nodes at a time stands only on even offsets.
5. So if the entry sits at an odd offset, that pointer steps straight over it and the two never agree there.
6. Split out: every one of the 840 even-tail shapes was correct, and 780 of the 800 odd-tail shapes were wrong.
7. The 20 odd-tail survivors all have odd-length loops, where completing a lap flips the parity and lets the pointer recover.

<!-- @example -->

<!-- @input -->
Pointer dereferences versus wall-clock time, Floyd against the hash set

<!-- @output -->
The hash set touches a third as many pointers and runs 21x to 68x slower

<!-- @why -->
A direct demonstration that counting operations does not predict speed.

<!-- @walkthrough -->
1. At a thousand nodes of tail and a thousand of cycle, the hash set performs 2,000 pointer dereferences and Floyd performs 6,000.
2. Floyd walks the list roughly three times over — phase 1 reads four links per iteration and phase 2 reads two per step.
3. By operation count the hash set should therefore win comfortably.
4. Timed, it loses: 232.97 microseconds against 5.16, and the gap held from 500 nodes to 100,000.
5. Across three runs the advantage ranged from **21x to 68x**.
6. The reason is that the hash set's time is spent hashing and allocating, not walking — pointer chasing was never its bottleneck.
7. The practical rule is to count operations to understand an algorithm and to measure wall clock to choose one.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the list as a lollipop with the tail and the loop separately labelled and, critically, with three nodes marked from the very first frame: the head, the entry, and — once phase 1 finishes — the collision. The distances between them are the whole subject, so show them as measured spans with numbers on them rather than as bare arrows. Run phase 1 first, tortoise and hare, and freeze on the collision. Then, before phase 2 moves at all, draw the arithmetic on the picture: the span from head to entry labelled `T`, the span from entry round to the collision labelled `k`, and the hare's surplus `T + k` shown wrapping around the loop as a whole number of laps so the reader can literally count them closing. That is the proof, and it should be a picture rather than a caption. Phase 2 then runs with both pointers stepping in lockstep, one from the head and one from the collision, with a shared step counter ticking up — and the counter should stop at exactly the tail length, called out against the label `T` drawn earlier. Pick a shape where the tail is longer than the loop, so the collision pointer visibly laps two or three times while the head pointer walks a straight line; that lapping is the detail every static diagram omits. The second panel is the step-size contrast, as two runs side by side on the same odd-tail list: on the left both pointers move one node and land together on the entry; on the right both move two, and the head pointer's stations are drawn as a row of even offsets that visibly skips the entry, with the pointers sailing past each other. Label it with the parity split, 840 of 840 even tails correct against 780 of 800 odd tails wrong. Close with the two cost bars — dereferences and microseconds — drawn adjacently for Floyd and the hash set so the inversion is unmissable: the hash set's bar is a third the height on the left and forty times the height on the right.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"question":"not whether a loop exists -- WHERE it begins: the first node inside the loop, the one two different nodes point at","shapeParameters":{"tail":"nodes before the entry","cycle":"nodes in the loop","note":"every result here is indexed by these two numbers"},"algorithm":{"phase1":"tortoise 1 step, hare 2 steps, until they collide","phase2":"send ONE pointer back to the head, then advance BOTH one step at a time; where they meet is the entry"},"proof":{"setup":"let T = tail, C = cycle, k = how far into the loop the collision happened","step1":"at the collision the tortoise has walked T + k","step2":"the hare has walked exactly twice that","step3":"the hare's surplus of T + k was spent going round, so it is a whole number of laps","identity":"T + k = 0 (mod C)","verifiedOn":"3,660 shapes, held every time","consequence":"T = -k (mod C), so the distance from collision to entry equals the distance from head to entry -- equal speeds arrive together"},"correctness":{"comparedAgainst":["hash set","the known entry node"],"shapes":1680,"range":"tail 0..40 by cycle 0..40","disagreements":0,"widerSweep":{"shapes":3660,"phase2LandedOnEntry":3660}},"phase2Cost":{"claim":"exactly the TAIL length, not tail mod cycle","measured":"tail steps in 3,660 of 3,660 shapes","tailModCycleCorrectIn":"1,830 of 3,660 -- precisely the half where tail < cycle, where the two numbers coincide","maxLapsObserved":60,"maxLapsShape":"60-node tail, 1-node loop","exactDereferences":[{"shape":"10/10","phase1":40,"phase2":20,"total":60},{"shape":"1000/1000","phase1":4000,"phase2":2000,"total":6000},{"shape":"0/1000","phase1":4000,"phase2":0,"total":4000},{"shape":"1/999999","phase1":3999996,"phase2":2,"total":3999998},{"shape":"999999/1","phase1":3999996,"phase2":1999998,"total":5999994}],"takeaway":"phase 2 is free when the loop starts at the head and never dominates -- phase 1 does"},"stepSizeMatters":{"contrastWith":"Detect a loop in LL, where hare speeds 2 through 7 ALL worked -- the speed was genuinely free there","whyDifferentHere":"phase 2 asserts an equality of distances, and only equal speeds preserve it","variants":[{"variant":"reset tortoise to head, both move 1","correct":1640,"wrong":0},{"variant":"reset HARE to head instead, both move 1","correct":1640,"wrong":0,"note":"symmetric -- which pointer goes home does not matter"},{"variant":"both move 2","correct":860,"wrong":780,"firstFailure":"tail 1, cycle 2 -- lands on node 2 instead of node 1"},{"variant":"head pointer moves 2, other moves 1","correct":198,"wrong":1442}],"bothMoveTwoParity":[{"tail":"even","correct":840,"wrong":0},{"tail":"odd","correct":20,"wrong":780}],"cause":"a pointer leaving the head two nodes at a time stands only on EVEN offsets, so it steps straight over an entry at an odd offset","the20Survivors":"all have odd-length loops, where completing a lap flips the parity","echoes":"the same shape of bug as the while(fast) crash in the previous subtopic -- correct on half the test data for reasons unrelated to the algorithm"},"dereferencesVsTime":{"headline":"the hash set touches a THIRD as many pointers as Floyd and runs 21x to 68x slower","dereferences":[{"shape":"10/10","floyd":60,"hashSet":20,"measureLoop":80},{"shape":"1000/1000","floyd":6000,"hashSet":2000,"measureLoop":8000},{"shape":"100000/100000","floyd":600000,"hashSet":200000,"measureLoop":800000},{"shape":"500000/500000","floyd":3000000,"hashSet":1000000,"measureLoop":4000000}],"whyFloydTouchesMore":"phase 1 reads four links per iteration and phase 2 reads two per step -- about three passes over the list","whyHashSetIsStillSlower":"its time goes into hashing and allocating, not walking; pointer chasing was never its bottleneck","rule":"count operations to understand an algorithm; measure wall clock to choose one"},"benchCpp":{"unit":"microseconds, median of 15, three runs","rows":[{"shape":"500/500","floyd":2.79,"hashSet":107.84,"measureLoop":4.25},{"shape":"1000/1000","floyd":5.16,"hashSet":232.97,"measureLoop":8.96},{"shape":"5000/5000","floyd":32.77,"hashSet":1294.65,"measureLoop":53.15},{"shape":"50000/50000","floyd":338.94,"hashSet":18041,"measureLoop":532.60},{"shape":"100000/100000","floyd":653.39,"hashSet":35515,"measureLoop":1044.71}],"range":"21x to 68x across runs","measureLoopVsFloyd":"about 1.6x to 2.6x slower"},"memory":{"rows":[{"n":1000000,"floyd":"24.3 MB","hashSet":"73.5 MB"},{"n":4000000,"floyd":"93.1 MB","hashSet":"282.9 MB"}]},"benchPython":{"unit":"microseconds, medians of 7, three runs","rows":[{"shape":"1000/1000","floyd":166.74,"setOfIds":761.62,"measureLoop":311.31},{"shape":"10000/10000","floyd":1585,"setOfIds":7889,"measureLoop":3258},{"shape":"50000/50000","floyd":6277,"setOfIds":47363,"measureLoop":14034}],"range":"4.5x to 8.0x"},"hashSetAdvantage":"the first node seen twice IS the entry -- no second phase and no arithmetic, which is a real reason to choose it when memory is free","measureLoopAdvantage":"the loop length it computes is the answer to Length of loop in LL, so the extra pass is not wasted if you need both","recommendation":"Floyd's two phases, with both pointers moving one step in phase 2","lesson":"the trick is one line of modular arithmetic -- and an algorithm nobody can explain is one nobody can debug"}
```

<!-- @highlights -->
- The list is drawn as a lollipop with the tail and loop separately labelled, and three nodes marked from the first frame: head, entry, and collision.
- The distances between those three are shown as measured spans carrying numbers, not as bare arrows.
- Phase 1 runs first, tortoise and hare, freezing on the collision.
- Before phase 2 moves, the arithmetic is drawn onto the picture itself.
- The span from head to entry is labelled `T` and the span from entry round to the collision is labelled `k`.
- The hare's surplus `T + k` is drawn wrapping the loop as whole laps, countable by eye — the proof as a picture rather than a caption.
- Phase 2 then steps both pointers in lockstep, one from the head and one from the collision, under a shared step counter.
- The counter stops at exactly the tail length, called out against the `T` label drawn earlier.
- The chosen shape has a tail longer than the loop, so the collision pointer visibly laps two or three times.
- That lapping is the detail every static diagram of this algorithm omits.
- The second panel contrasts step sizes as two runs on the same odd-tail list.
- On the left both pointers move one node and land together on the entry.
- On the right both move two, and the head pointer's stations form a row of even offsets that visibly skips the entry.
- The two pointers sail past each other, with the parity split labelled: 840 of 840 even tails correct against 780 of 800 odd tails wrong.
- The close puts two cost bars side by side for Floyd and the hash set — dereferences and microseconds.
- The hash set's bar is a third the height on the left and forty times the height on the right, making the inversion unmissable.

<!-- @edgeCases -->
- No loop at all — the hare reaches null and the function returns null, never entering phase 2.
- A loop starting at the head — the entry is the head, and phase 2 costs zero steps because both pointers are already there.
- A single node pointing at itself — tail 0, cycle 1; the collision is the node and it is also the entry.
- A two-node loop with no tail — detected in one iteration, entry is the head.
- A one-node loop at the end of a long tail — the worst shape for phase 2, costing 1,999,998 dereferences on a million-node list.
- A long loop with a one-node tail — the opposite: phase 2 costs 2 dereferences while phase 1 costs nearly four million.
- A tail longer than the loop — the pointer from the collision laps repeatedly; 60 laps observed on a 60-node tail with a 1-node loop.
- An empty list — the loop condition fails immediately and null is returned.
- Nodes whose type defines equality by value — identity comparison is required in both phases.
- The measure-the-loop variant on a one-node loop — the count starts at 1 and immediately returns to itself, giving the correct length of 1.
- Distinguishing "no loop" from "loop starts at the head" — the first returns null, the second returns the head node.

<!-- @pitfalls -->
- Returning the collision point as the entry. It is not, except by coincidence — that was measured in the previous subtopic.
- Advancing both pointers by two in phase 2. Correct for every even-length tail and wrong for 780 of 800 odd-length ones.
- Resetting both pointers to the head. They meet immediately at the head and the function returns it for every list with a loop.
- Assuming phase 2 costs `tail mod cycle` steps. It costs the full tail, every time — the shorter figure was right in only half the shapes, where the two happen to be equal.
- Advancing the head pointer faster than the other. Correct in only 198 of 1,640 shapes — phase 2 asserts equal distances and needs equal speeds.
- Carrying the permissiveness of detection over to phase 2. There any hare speed worked; here only one does.
- Testing `slow == fast` before advancing in phase 1. Both start at the head, so it fires immediately and every acyclic list of two or more nodes reports a loop.
- Dropping the `fast->next` check. It crashes on every odd-length acyclic list and no even-length one.
- Starting the loop-length count at 0 in the measure-the-loop variant. It undercounts by one, and the two pointers end up one node apart forever.
- Choosing the hash set on operation count. It touches a third as many pointers as Floyd and runs 21x to 68x slower.
- Timing Floyd without consuming the result. It is a pure function on an unmodified list, so the optimiser can delete the call entirely.

<!-- @doubt -->
### Why does sending one pointer back to the head work?

<!-- @answer -->
Because of one equation you can check in a minute. Let the tail be `T`, the loop be `C`, and let `k` be how far into the loop the collision happened. At the collision the tortoise has walked `T + k` and the hare has walked exactly twice that, so the hare's **surplus** is also `T + k` — and every step of that surplus was spent going round the loop, so it must be a whole number of laps: `T + k ≡ 0 (mod C)`. That identity was checked directly on all **3,660 shapes** and held every time. Rearranged it says `T ≡ -k (mod C)`, which is exactly the statement that the distance from the collision forward to the entry is the same as the distance from the head to the entry. Two pointers covering equal distances at equal speeds arrive together. Nothing else is going on, and the fact that it is this short is worth knowing — an algorithm you cannot explain is one you cannot debug.

<!-- @doubt -->
### Does it matter which pointer I send back to the head?

<!-- @answer -->
No. Resetting the tortoise and resetting the hare were each tested on 1,640 shapes and both were correct **1,640 out of 1,640**. Once both pointers move at the same speed, they are interchangeable — the algorithm only cares that one starts at the head and one starts at the collision. What you must not do is reset **both**, which is a surprisingly easy slip: they then start together at the head, the comparison succeeds immediately, and the function returns the head for every list with a loop. Since a loop that genuinely starts at the head is a legitimate case, that bug produces a plausible answer on exactly the input where you are least likely to notice it.

<!-- @doubt -->
### Why must both pointers move one step? A faster hare was fine before.

<!-- @answer -->
Because the two phases are asking different questions. Detection only needs the two pointers to **coincide eventually**, and the previous subtopic measured that hare speeds of 2, 3, 4, 5, 6 and 7 all achieve that on every shape — the speed really was free. Phase 2 asserts something much stronger: that two specific **distances are equal**, and an equality of distances is only preserved by equal speeds. Break it and the failures are immediate. Advancing both by two was correct in 860 of 1,640 shapes and wrong in 780; advancing the head pointer at two against the other at one was correct in only 198. The failures have a clean parity: a pointer leaving the head two nodes at a time stands only on **even** offsets, so an entry at an odd offset gets stepped over. Every one of the 840 even-tail shapes worked and 780 of the 800 odd-tail ones did not — the 20 survivors all have odd-length loops, where a lap flips the parity.

<!-- @doubt -->
### How long does the second phase actually take?

<!-- @answer -->
Exactly the **tail length**, in every one of the 3,660 shapes measured. The natural guess is `tail mod cycle`, since the identity behind the algorithm is modular — but that shorter figure was correct in only 1,830 shapes, precisely the half where the tail is already smaller than the loop and the two numbers coincide. When the tail is longer, the pointer starting from the collision simply goes round the loop repeatedly while the other walks a straight line; the most laps observed was **60**, on a 60-node tail with a one-node loop. The practical consequence is that phase 2's cost tracks the tail and never the loop, so it is **free** when the loop starts at the head, costs 2 dereferences on a one-node tail with a million-node loop, and 1,999,998 on the reverse shape. Phase 1 is the dominant cost in every shape measured.

<!-- @doubt -->
### The hash set version is simpler and finds the entry directly. Why not use it?

<!-- @answer -->
It is a real option and the trade is genuine, but measure it before choosing it. Its advantage is exactly as you say: the first node you meet twice **is** the entry, with no second phase and no arithmetic. It also touches the **fewest pointers of the three** — 2,000 dereferences against Floyd's 6,000 at a thousand nodes, because Floyd walks the list about three times over. And it still loses on wall clock by **21x to 68x**, measured from 500 nodes up to 100,000: 232.97 microseconds against 5.16 at a thousand nodes. The reason is that its time goes into hashing and allocating rather than walking, so the pointer count was never the thing to optimise. Memory settles it for large input: 73.5 MB against 24.3 MB at a million nodes, and 282.9 MB against 93.1 at four million. Choose it when lists are small and clarity matters more than either number.

<!-- @doubt -->
### Is there a version I can explain without the modular arithmetic?

<!-- @answer -->
Yes — measure the loop instead of reasoning about it. Find the collision, then walk forward from it until you come back round, counting nodes; that count is the loop length. Now put one pointer at the head and a second exactly that many nodes ahead, and advance both one step at a time. When the trailing pointer reaches the entry, the leading one has travelled exactly one full lap and is standing on the same node. There is nothing surprising left to prove. It costs one extra pass around the loop for that clarity — 8,000 dereferences against Floyd's 6,000 at a thousand nodes, and about **1.6x to 2.6x** slower in the timings here — while staying O(1) in space. It has a second benefit worth weighing: the loop length it computes along the way is precisely what **Length of loop in LL** asks for, so if you need both answers the extra pass is not extra at all.

<!-- @doubt -->
### How do I tell "no loop" from "the loop starts at the head"?

<!-- @answer -->
By the return value, which is why returning a node pointer rather than a boolean matters here. If there is no loop, the hare reaches null, phase 2 never runs, and the function returns **null**. If the loop starts at the head, phase 1 still finds a collision, phase 2 runs with both pointers already on the head, terminates after **zero** steps, and returns the **head node**. Those are different answers and callers must not conflate them — a caller that treats "falsy" as "no loop" will get it wrong in any language where the head could itself be index 0 or otherwise test as false. It is also the case that phase 2 costing zero steps here is not a special case in the code: the comparison at the top of the phase-2 loop simply succeeds on the first look, which is the same reason phase 2 costs the tail length in general, with a tail of zero.
