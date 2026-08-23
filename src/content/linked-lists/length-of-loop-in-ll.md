---
id: length-of-loop-in-ll
topic: Linked Lists
title: Length of loop in LL
difficulty: Medium
status: ready
prerequisites:
  - detect-a-loop-in-ll
  - find-the-starting-point-in-ll
  - find-the-length-of-the-linked-list
  - middle-of-a-linkedlist-tortoisehare-method
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - detect-a-loop-in-ll
  - find-the-starting-point-in-ll
  - find-the-length-of-the-linked-list
  - remove-nth-node-from-the-back-of-the-ll
  - flattening-of-ll
---

<!-- @summary -->
The easiest of the three loop questions, guarding the nastiest trap: the number of iterations phase 1 takes is **always an exact multiple of the loop length** — verified on 3,660 shapes — and it equals the length exactly when the tail is no longer than the loop, which makes it look like a free answer. It is right in **1,890 of 1,890** shapes with a short tail and **0 of 1,770** with a long one, off by as much as **999x**. The honest version needs no arithmetic at all: stand on any node in the loop and walk until you come back.

<!-- @theory -->
## The question

Given a list that loops, how many nodes are in the loop?

```
0 -> 1 -> 2 -> 3 -> 4 -> 5 -> 6
               ^              |
               +--------------+
                 loop length = 4
```

As in the previous two subtopics, two numbers describe the list: the **tail**
(nodes before the loop begins, 3 here) and the **cycle** (nodes in the loop, 4).

## The algorithm

Run the tortoise and hare until they collide. The collision node is inside the
loop, so walking forward from it must come back to it — and the number of steps
that takes is the loop length.

```cpp
long loopLength(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            long count = 1;
            for (Node* p = slow->next; p != slow; p = p->next) count++;
            return count;
        }
    }
    return 0;
}
```

There is no modular arithmetic here and no second phase. The only thing being
relied on is that the collision happens **somewhere in the loop**, and any node
in the loop is as good as any other for this purpose — confirmed by counting from
every loop node in every shape with tail 0–40 and cycle 1–40: all **1,640**
shapes gave the same answer from every starting point.

Verified against two other implementations on **2,115 shapes**, tail 0–45 by
cycle 0–45, with zero disagreements.

## The trap: phase 1's iteration count

It is very tempting to think the work is already done. Phase 1 ran some number of
iterations before colliding — surely that tells you the loop length?

It does not, and it is worse than simply being wrong, because it is **right about
half the time**. Across all 3,660 shapes with tail 0–60 and cycle 1–60:

| | Phase-1 count equals the loop length |
|---|---|
| Tail ≤ cycle | **1,890 of 1,890** |
| Tail > cycle | **0 of 1,770** |

The boundary is exact, not approximate:

| Tail | Cycle | Phase-1 count | True length | |
|---|---|---|---|---|
| 50 | 50 | 50 | 50 | correct |
| 51 | 50 | 100 | 50 | **2x too big** |
| 10 | 3 | 12 | 3 | 4x |
| 100 | 7 | 105 | 7 | 15x |
| 1,000 | 4 | 1,000 | 4 | 250x |
| 999 | 1 | 999 | 1 | **999x** |

Every test you write with a short tail passes. The first list with a long tail
returns an answer that can be hundreds of times too large.

What *is* true — and this is the reason the trap is so convincing — is that the
phase-1 count is always an exact **multiple** of the loop length. That held in
**3,660 of 3,660** shapes, with multiples ranging from 1 to 60. It follows
directly from the identity in **Find the starting point in LL**: the tortoise has
walked `T + k` when they collide, and `T + k ≡ 0 (mod C)`. So the count is
`C`, or `2C`, or `250C`, and nothing in the number itself tells you which.

## Counting from the collision, not the entry

A natural instinct after the previous subtopic is to find the loop's entry first
and count from there. It works and it is pure extra effort — the entry has no
special property that the collision node lacks. Measured in pointer
dereferences:

| Tail / cycle | From the collision | Via the entry |
|---|---|---|
| 10 / 10 | **50** | 70 |
| 1,000 / 1,000 | **5,000** | 7,000 |
| 0 / 1,000 | **5,000** | 5,000 |
| 100,000 / 100,000 | **500,000** | 700,000 |
| 999,999 / 1 | **3,999,997** | 5,999,995 |

The two are identical when the loop starts at the head, because that is exactly
when locating the entry is free. Everywhere else the detour costs the tail
length twice over, and it ran **1.35x to 1.59x** slower.

## What the O(1) space costs

Recording each node's position gives the length in one pass and with no
reasoning at all: when you meet a node again, subtract the two positions.

| Tail / cycle | From the collision | Hash map | Via the entry |
|---|---|---|---|
| 500 / 500 | **1.69us** | 77.40us | 2.29us |
| 5,000 / 5,000 | **26.34us** | 878.17us | 41.95us |
| 50,000 / 50,000 | **214.47us** | 9,798.80us | 290.15us |
| 100,000 / 100,000 | **431.14us** | 23,317.18us | 610.20us |

Between **33x and 54x** slower. And as in the previous subtopic, the map does the
**least pointer work of the three** — 2,000 dereferences against 5,000 at a
thousand nodes — and still loses by a factor of forty, because its time goes into
hashing and allocating rather than walking. Counting operations describes an
algorithm; it does not rank implementations.

Python narrows it to **3.5x–5.2x** with the same ordering:

| Tail / cycle | From the collision | Hash map | Via the entry |
|---|---|---|---|
| 1,000 / 1,000 | **93.22us** | 379.93us | 127.77us |
| 10,000 / 10,000 | **937.90us** | 3,750.81us | 1,245.85us |
| 50,000 / 50,000 | **4,802.49us** | 21,295.64us | 6,419.48us |

<!-- @intuition -->
This is the gentlest of the three loop problems and the one most likely to be got wrong, which is worth sitting with. It is gentle because the insight is nearly nothing: the collision lands you somewhere inside the loop, and from anywhere inside a loop you can measure it by walking until you return — no identity, no second phase, no proof to remember. It goes wrong because the previous two subtopics leave you holding a number that looks like the answer. Phase 1 counted its iterations, that count really is determined by the loop length, and on every small example you are likely to try by hand it is exactly the loop length. The relationship is real; it is just weaker than it appears, giving you some multiple of the answer with no way to tell which. That pattern — a quantity that is genuinely related to what you want, and genuinely useless for computing it — is worth recognising, because it produces bugs that survive testing. The defence is the same one this topic keeps rewarding: state precisely what you know, check it at the boundary rather than in the middle, and prefer the version whose correctness you can see directly over the one that arrives by a shortcut you cannot quite justify.

<!-- @approach -->
### Optimal - Count One Lap from the Collision

<!-- @idea -->
Collide the two pointers, then walk forward from the collision node until you arrive back at it, counting as you go.

<!-- @steps -->
1. Run the tortoise at one step and the hare at two until they collide, or until the hare reaches null.
2. If the hare reached null there is no loop — return 0.
3. Start a counter at 1, standing on the collision node.
4. Walk forward one node at a time, incrementing the counter.
5. Stop when you are back on the collision node — the counter is the loop length.

<!-- @complexity -->
- time: O(n) — phase 1 walks the tail plus part of a lap, then one full lap to count
- space: **O(1)** — two pointers and a counter
- note: The answer to give, and the one whose correctness you can see rather than derive. Measured **33x to 54x** faster than a hash map and **1.35x to 1.59x** faster than locating the entry first. Any node inside the loop works as a starting point — verified from every loop node in all 1,640 shapes tested — so the collision needs no adjustment before counting.

<!-- @code cpp -->
```cpp
long loopLength(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) {
            long count = 1;
            for (Node* p = slow->next; p != slow; p = p->next) count++;
            return count;
        }
    }
    return 0;
}
```

<!-- @annotations -->
- 8: Starting at 1 counts the collision node itself. Starting at 0 gives an answer one too small — the counter is measuring nodes, not steps between them.
- 9: Beginning at `slow->next` and stopping on return to `slow` is what makes the off-by-one work out. Beginning at `slow` would terminate immediately with a count of 1.
- 7: The number of iterations this loop ran is **not** the answer. It is always an exact multiple of the loop length, and equals it only when the tail is no longer than the loop.
- 13: Zero for a list with no loop, which is distinguishable from every real loop length since the shortest possible loop has one node.

<!-- @code java -->
```java
static long loopLength(Node head) {
    Node slow = head;
    Node fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) {
            long count = 1;
            for (Node p = slow.next; p != slow; p = p.next) count++;
            return count;
        }
    }
    return 0;
}
```

<!-- @annotations -->
- 9: Reference comparison, as everywhere in this topic — `p != slow` must ask whether it is the same node, not whether the data matches.

<!-- @code python -->
```python
def loop_length(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            count = 1
            p = slow.next
            while p is not slow:
                count += 1
                p = p.next
            return count
    return 0


# No arithmetic and no second phase. The only fact used is that the
# collision is somewhere inside the loop -- and counting from ANY loop
# node gives the same answer, verified across all 1,640 shapes tested.
```

<!-- @annotations -->
- 7: The counter starts at 1 for the node you are standing on, and the walk below adds one for each of the others.

<!-- @approach -->
### Map Each Node to Its Position

<!-- @idea -->
Record how far along each node was when first seen; the first repeat gives the length as the difference between the two positions.

<!-- @steps -->
1. Create an empty map from node address to position, and a position counter at 0.
2. Walk from the head one node at a time.
3. If the current node is already in the map, subtract its stored position from the current one — that difference is the loop length.
4. Otherwise record the node at the current position.
5. If the walk reaches null, there is no loop — return 0.

<!-- @complexity -->
- time: O(n) expected, dominated by hashing and allocation
- space: **O(n)** — one entry per node
- note: Needs no insight at all, which is a genuine virtue when you are unsure. It also does the **least pointer work of the three** — 2,000 dereferences against 5,000 at a thousand nodes — and still runs **33x to 54x** slower, because its cost is hashing rather than walking. The node it stops on is also the loop's entry, so this single pass answers all three loop questions at once, which is the real reason to reach for it.

<!-- @code cpp -->
```cpp
#include <unordered_map>
using namespace std;

long loopLengthMap(Node* head) {
    unordered_map<Node*, long> position;
    long i = 0;
    for (Node* p = head; p != nullptr; p = p->next, i++) {
        auto found = position.find(p);
        if (found != position.end()) return i - found->second;
        position.emplace(p, i);
    }
    return 0;
}
```

<!-- @annotations -->
- 9: The difference between the two positions is exactly one lap, because the walk between them went round the loop once and arrived back at the same node. The node found here is also the loop's **entry**, so this one pass can answer detection, entry and length together.
- 10: `emplace` rather than `operator[]`, which would default-construct an entry on every lookup miss and then assign over it.
- 5: Keyed by node **address**, valued by position. Keying on the data would measure the gap between two equal values rather than a lap of the loop.

<!-- @code java -->
```java
static long loopLengthMap(Node head) {
    Map<Node, Long> position = new IdentityHashMap<>();
    long i = 0;
    for (Node p = head; p != null; p = p.next, i++) {
        Long seen = position.get(p);
        if (seen != null) return i - seen;
        position.put(p, i);
    }
    return 0;
}
```

<!-- @annotations -->
- 2: `IdentityHashMap` deliberately. A `HashMap` would key on `equals`, so a node type with value equality would return the gap between two equal *values* rather than a lap of the loop.

<!-- @code python -->
```python
def loop_length_map(head):
    position = {}
    p = head
    i = 0
    while p is not None:
        if id(p) in position:
            return i - position[id(p)]
        position[id(p)] = i
        p = p.next
        i += 1
    return 0


# Touches under half as many pointers as the collision method and
# still runs 3.5x to 5.2x slower here -- the time is in the hashing.
```

<!-- @annotations -->
- 6: Keying on `id` avoids any `__eq__` or `__hash__` the node class defines, and is safe because every node stays alive for the walk.

<!-- @approach -->
### Find the Entry First, Then Count

<!-- @idea -->
Locate the node where the loop begins, then walk one lap from there.

<!-- @steps -->
1. Run the tortoise and hare until they collide; if the hare reaches null, return 0.
2. Send one pointer back to the head and advance both one step at a time until they meet — that node is the entry.
3. Start a counter at 1, standing on the entry.
4. Walk forward one node at a time until you return to the entry.
5. Return the counter.

<!-- @complexity -->
- time: O(n) — an extra walk of the tail compared with counting from the collision
- space: **O(1)** — two pointers and a counter
- note: Correct, and pure extra work: the entry has no property the collision node lacks for this purpose. It costs the tail twice over — 700,000 dereferences against 500,000 at a hundred thousand nodes — and ran **1.35x to 1.59x** slower. The two are identical only when the loop starts at the head, which is exactly when finding the entry is free. Write it this way only if you needed the entry anyway.

<!-- @code cpp -->
```cpp
long loopLengthViaEntry(Node* head) {
    Node* slow = head;
    Node* fast = head;
    bool looped = false;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) { looped = true; break; }
    }
    if (!looped) return 0;

    slow = head;
    while (slow != fast) { slow = slow->next; fast = fast->next; }

    long count = 1;
    for (Node* p = slow->next; p != slow; p = p->next) count++;
    return count;
}
```

<!-- @annotations -->
- 12: This is where the detour begins. Everything from here to the count is work the collision-based version simply does not do.
- 13: One step each, as always in phase 2 — the equality of distances only survives equal speeds.
- 16: Identical counting loop to the optimal version — only the starting node differs, and it makes no difference to the answer.

<!-- @code java -->
```java
static long loopLengthViaEntry(Node head) {
    Node slow = head, fast = head;
    boolean looped = false;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) { looped = true; break; }
    }
    if (!looped) return 0;

    slow = head;
    while (slow != fast) { slow = slow.next; fast = fast.next; }

    long count = 1;
    for (Node p = slow.next; p != slow; p = p.next) count++;
    return count;
}
```

<!-- @annotations -->
- 12: When this walk ends the entry is in `slow`, so if the caller wants both answers this version hands them over together.

<!-- @code python -->
```python
def loop_length_via_entry(head):
    slow = fast = head
    looped = False
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            looped = True
            break
    if not looped:
        return 0

    slow = head
    while slow is not fast:
        slow = slow.next
        fast = fast.next

    count = 1
    p = slow.next
    while p is not slow:
        count += 1
        p = p.next
    return count
```

<!-- @annotations -->
- 14: Walking back to the entry costs the tail length again and buys nothing the collision node did not already offer.

<!-- @example -->

<!-- @input -->
`0 1 2 3 4 5 6` with node 6 pointing back at node 3

<!-- @output -->
`4`

<!-- @why -->
The straightforward trace, showing that no property of the collision node is needed beyond its being in the loop.

<!-- @walkthrough -->
1. The tail is 3 and the loop is nodes 3, 4, 5, 6 — length 4.
2. Phase 1 runs four iterations and the pointers collide on node 4.
3. Node 4 is not the entry and does not need to be — it is simply inside the loop.
4. The counter starts at 1 for node 4 itself.
5. Walking forward: node 5 makes 2, node 6 makes 3, and node 6's `next` leads to node 3, making 4.
6. Node 3's `next` is node 4, the node we started on, so the walk stops.
7. The answer is 4, and starting the same walk from node 3, 5 or 6 would have given 4 as well.

<!-- @example -->

<!-- @input -->
Phase 1's iteration count, offered as the loop length

<!-- @output -->
Correct in 1,890 of 1,890 shapes with a short tail, and 0 of 1,770 with a long one

<!-- @why -->
The trap this problem is really about, and the reason it survives testing.

<!-- @walkthrough -->
1. Phase 1 counts iterations before colliding, and that count is genuinely determined by the loop length.
2. Specifically it is always an exact **multiple** of it — verified in all 3,660 shapes, with multiples from 1 to 60.
3. That follows from the collision identity: the tortoise has walked `T + k`, and `T + k` is a whole number of laps.
4. When the tail is no shorter than one lap, the multiple is bigger than 1 and the count overshoots.
5. Measured, the multiple is exactly 1 precisely when the **tail is no longer than the cycle** — 1,890 shapes, all correct.
6. Past that boundary it is never correct: 0 of 1,770. Tail 50 with cycle 50 gives 50; tail **51** with cycle 50 gives 100.
7. At the extreme, a 999-node tail with a one-node loop reports 999 — **999 times** the right answer.

<!-- @example -->

<!-- @input -->
Counting from every node inside the loop, across 1,640 shapes

<!-- @output -->
The same length from every starting point, in every shape

<!-- @why -->
Justifies using the collision node directly rather than walking to the entry first.

<!-- @walkthrough -->
1. The collision node is somewhere inside the loop, but which node depends on the shape.
2. That raises the question of whether the count depends on where you start.
3. Every node inside the loop was tried as a starting point, for every shape with tail 0–40 and cycle 1–40.
4. All **1,640** shapes gave one identical answer from every loop node.
5. The reason is that a loop has no distinguished node — from any node in it, walking forward returns to that node after exactly one lap.
6. So the entry is not special for counting, and reaching it first is pure detour.
7. Measured, that detour costs 700,000 dereferences against 500,000 at a hundred thousand nodes, and runs 1.35x to 1.59x slower.

<!-- @example -->

<!-- @input -->
The counter started at 0 instead of 1

<!-- @output -->
Every answer one too small

<!-- @why -->
The most common implementation slip here, and one that no shape reveals more clearly than another.

<!-- @walkthrough -->
1. The walk begins at `slow->next` and stops on returning to `slow`.
2. That visits every node in the loop **except** the one being stood on.
3. So the counter must already account for the starting node, which is what initialising it to 1 does.
4. Starting at 0 reports 3 for the four-node loop above, and 0 for a single-node self-loop.
5. Unlike the phase-1 trap, this one is wrong on every shape rather than half of them — which makes it far easier to catch.
6. The alternative arrangement is to start the walk at `slow` with a counter of 0 and use a do-while, so the first check happens after the first move.
7. Either is fine; mixing them — counter at 0 with the walk starting at `slow->next` — is the bug.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the lollipop with the tail and loop labelled, and run phase 1 to the collision as established in the previous two subtopics — but keep a visible iteration counter running during it, because that counter is the trap and it needs to be on screen before it is discredited. Freeze on the collision. Now do the actual algorithm: park a marker on the collision node, send a walker forward, and let a second counter tick from 1 as the walker moves, closing the ring and stopping the instant it lands back on the marker. The two counters sit side by side at the end — the phase-1 count and the true length — and on a shape where the tail is longer than the loop they disagree, visibly and by a lot. That disagreement is the centre of the panel. Then make it worse on purpose: replay with tail 999 and a one-node loop, where the phase-1 counter reads 999 and the ring closes after a single step, so the two numbers are 999 and 1. Beside it, replay with tail 50 and cycle 50, where they agree exactly, and then tail 51 and cycle 50, where they do not — three frames that pin the boundary rather than describing it. The last panel should show the same counting walk started from four different nodes of the loop at once, four walkers in four colours going round simultaneously and all stopping on the same number, so that "any node in the loop will do" is something the reader watches rather than reads. Finish with the cost comparison drawn as two bars per approach, dereferences and microseconds, so the map's inversion — least pointer work, forty times the time — is visible in one glance.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"question":"how many nodes are in the loop","shapeParameters":{"tail":"nodes before the loop begins","cycle":"nodes in the loop"},"algorithm":{"idea":"collide the two pointers, then walk forward from the collision node until you return to it, counting","whyItWorks":"the collision is somewhere INSIDE the loop, and from any node in a loop, walking forward returns to that node after exactly one lap","noArithmeticNeeded":true,"noSecondPhaseNeeded":true},"correctness":{"comparedAgainst":["hash map of positions","find the entry then count"],"shapes":2115,"range":"tail 0..45 by cycle 0..45","disagreements":0},"anyLoopNodeWorks":{"tested":"every node inside the loop, as a starting point, for every shape","shapes":1640,"range":"tail 0..40 by cycle 1..40","allGaveSameAnswer":true,"consequence":"the entry is not special for counting -- reaching it first is pure detour"},"theTrap":{"claim":"phase 1's iteration count is the loop length","whyItIsConvincing":"the count IS always an exact multiple of the loop length -- verified in 3,660 of 3,660 shapes, multiples ranging 1 to 60","whereItComesFrom":"the collision identity T + k = 0 (mod C): the tortoise has walked T + k, a whole number of laps","correctWhen":[{"condition":"tail <= cycle","correct":1890,"total":1890},{"condition":"tail > cycle","correct":0,"total":1770}],"boundaryIsExact":[{"tail":50,"cycle":50,"phase1Count":50,"trueLength":50,"verdict":"correct"},{"tail":51,"cycle":50,"phase1Count":100,"trueLength":50,"verdict":"2x too big"}],"worstCases":[{"tail":10,"cycle":3,"phase1Count":12,"factor":"4x"},{"tail":100,"cycle":7,"phase1Count":105,"factor":"15x"},{"tail":1000,"cycle":4,"phase1Count":1000,"factor":"250x"},{"tail":999,"cycle":1,"phase1Count":999,"factor":"999x"}],"whyItSurvivesTesting":"every test with a short tail passes; the first long-tailed list is off by a factor"},"dereferences":{"rows":[{"shape":"10/10","fromCollision":50,"map":20,"viaEntry":70},{"shape":"1000/1000","fromCollision":5000,"map":2000,"viaEntry":7000},{"shape":"0/1000","fromCollision":5000,"map":1000,"viaEntry":5000},{"shape":"1/999999","fromCollision":4999995,"map":1000000,"viaEntry":4999997},{"shape":"999999/1","fromCollision":3999997,"map":1000000,"viaEntry":5999995},{"shape":"100000/100000","fromCollision":500000,"map":200000,"viaEntry":700000}],"viaEntryNote":"identical to the collision method only when the loop starts at the head -- exactly when finding the entry is free","mapNote":"fewest dereferences of the three, and slowest by far"},"benchCpp":{"unit":"microseconds, median of 15, three clean runs","rows":[{"shape":"500/500","fromCollision":1.69,"map":77.40,"viaEntry":2.29},{"shape":"5000/5000","fromCollision":26.34,"map":878.17,"viaEntry":41.95},{"shape":"50000/50000","fromCollision":214.47,"map":9798.80,"viaEntry":290.15},{"shape":"100000/100000","fromCollision":431.14,"map":23317.18,"viaEntry":610.20}],"mapVsCollision":"33x to 54x slower","viaEntryVsCollision":"1.35x to 1.59x slower","lesson":"the map does the least pointer work and loses by a factor of forty -- counting operations describes an algorithm, it does not rank implementations"},"benchPython":{"unit":"microseconds, medians of 7 across three runs","rows":[{"shape":"1000/1000","fromCollision":93.22,"map":379.93,"viaEntry":127.77},{"shape":"10000/10000","fromCollision":937.90,"map":3750.81,"viaEntry":1245.85},{"shape":"50000/50000","fromCollision":4802.49,"map":21295.64,"viaEntry":6419.48}],"mapVsCollision":"3.5x to 5.2x slower"},"offByOne":{"correctPairing":"counter starts at 1, walk starts at slow->next and stops on returning to slow","whyItWorks":"the walk visits every loop node EXCEPT the one being stood on, so the counter must already account for it","bug":"counter at 0 with the walk starting at slow->next","symptom":"every answer one too small -- 3 for a four-node loop, 0 for a self-loop","contrastWithTheTrap":"wrong on every shape rather than half of them, so far easier to catch","alternative":"start the walk at slow with a counter of 0 and check after the first move"},"mapAdvantage":"the node it stops on is also the loop's ENTRY, so one pass answers detection, entry and length together","recommendation":"collide, then count one lap from the collision node","lesson":"a quantity genuinely related to the answer can still be useless for computing it -- check claims at the boundary, not in the middle"}
```

<!-- @highlights -->
- The lollipop is drawn with tail and loop labelled, and phase 1 runs to the collision as in the previous two subtopics.
- A visible iteration counter runs throughout phase 1 — the trap needs to be on screen before it is discredited.
- The animation freezes on the collision.
- A marker is parked on the collision node and a walker sent forward from it.
- A second counter ticks from 1 as the walker moves, closing the ring and stopping the instant it lands back on the marker.
- The two counters sit side by side at the end: the phase-1 count and the true length.
- On a shape where the tail is longer than the loop they disagree, visibly and by a lot — the centre of the panel.
- A replay with tail 999 and a one-node loop shows the phase-1 counter reading 999 while the ring closes after a single step.
- Beside it, tail 50 with cycle 50 agrees exactly, and tail 51 with cycle 50 does not.
- Those three frames pin the boundary rather than describing it.
- The last panel starts the same counting walk from four different loop nodes at once.
- Four walkers in four colours go round simultaneously and all stop on the same number.
- That makes "any node in the loop will do" something the reader watches rather than reads.
- The close draws two bars per approach — dereferences and microseconds.
- The map's inversion is visible in one glance: least pointer work, forty times the time.

<!-- @edgeCases -->
- A list with no loop — the hare reaches null and the function returns 0, which no real loop length can be.
- A single node pointing at itself — the loop length is 1, and the counting walk stops immediately after its first step.
- A two-node loop — the smallest case where the walk actually moves more than once.
- A loop starting at the head — counting from the collision and counting via the entry cost exactly the same, since finding the entry is free.
- A one-node loop after a very long tail — the worst case for the phase-1 trap, reporting 999 instead of 1 on a 1,000-node list.
- A tail exactly equal to the cycle — the last shape where the phase-1 count happens to be correct.
- A tail one longer than the cycle — the first shape where it is not, reporting double.
- A list that is entirely one loop with no tail — the phase-1 count is correct here, which is part of why the trap survives.
- Counting from a node in the tail rather than the loop — never terminates, since the walk cannot return to a node the loop does not contain.
- Nodes whose type defines equality by value — identity comparison is required, or the walk stops early on a repeated value.
- A loop longer than fits in an `int` counter — use a wide enough type; the count can reach the full list length.

<!-- @pitfalls -->
- Returning phase 1's iteration count. It is always a multiple of the loop length and equals it only when the tail is no longer than the loop — right in 1,890 of 1,890 short-tailed shapes and 0 of 1,770 long-tailed ones.
- Testing that shortcut only on small examples. Every short tail passes; tail 51 with cycle 50 is the first failure and reports double.
- Starting the counter at 0 while walking from `slow->next`. Every answer comes out one too small, including 0 for a self-loop.
- Walking to the loop's entry before counting. Correct but pure detour — the entry has no property the collision node lacks, and it costs 1.35x to 1.59x more.
- Counting from a node in the tail. The walk never returns to it and the loop does not terminate.
- Comparing node values rather than identity. The walk stops at the first repeated value instead of the first repeated node.
- Using a plain `HashMap` in Java for the map version. It keys on `equals`, so it measures the gap between equal values rather than a lap.
- Assuming the map version is cheaper because it touches fewer pointers. It touches under half as many and runs 33x to 54x slower.
- Returning a signed `int` for the count on a very long loop. The loop can be as long as the whole list.
- Conflating "no loop" with a loop of length 0. The shortest possible loop is one node, so 0 is safely reserved for the no-loop case.
- Timing any of these without consuming the result. They are pure functions on an unmodified list, so the optimiser can delete the call.

<!-- @doubt -->
### Phase 1 already counted its iterations. Is that not the loop length?

<!-- @answer -->
No, and this is the trap the whole subtopic exists for — because it is right about half the time. That count is always an exact **multiple** of the loop length, which is why it feels like the answer: verified across all 3,660 shapes, with multiples running from 1 to 60. It follows from the collision identity, since the tortoise has walked `T + k` and that distance is a whole number of laps. The multiple is exactly 1 precisely when the **tail is no longer than the loop** — correct in **1,890 of 1,890** such shapes, and in **0 of 1,770** where the tail is longer. The boundary is sharp: tail 50 with a 50-node loop gives 50 and is right; tail **51** with the same loop gives 100. At the extreme, a 999-node tail with a one-node loop reports **999**. Every hand-written test with a short tail passes, which is exactly what makes it dangerous.

<!-- @doubt -->
### Do I need to find the loop's entry before counting?

<!-- @answer -->
No, and doing so is pure extra work. The counting walk only needs to start on a node **inside** the loop, and the collision node already is one. To be sure this is not an accident of particular shapes, every node inside the loop was used as a starting point for every shape with tail 0–40 and cycle 1–40: all **1,640** shapes gave one identical answer from every starting node. That is what you would expect — a loop has no distinguished node, so walking forward from any of them returns after exactly one lap. Going to the entry first costs the tail all over again: 700,000 dereferences against 500,000 at a hundred thousand nodes, and **1.35x to 1.59x** slower in the timings. The two are equal in cost only when the loop begins at the head, which is exactly the case where locating the entry is free. Write it that way only if the entry is something you needed anyway.

<!-- @doubt -->
### Why does the counter start at 1?

<!-- @answer -->
Because the walk it accompanies never visits the node you are standing on. The loop begins at `slow->next` and stops on returning to `slow`, so it steps onto every node of the loop **except** `slow` itself — the counter therefore has to start already holding that one. Set it to 0 and every answer is one too small: 3 for a four-node loop, and 0 for a single-node self-loop, which then looks exactly like "no loop at all". The equally valid alternative is to start the walk at `slow` with a counter of 0 and arrange the test so the first comparison happens after the first move. What you must not do is mix the two, which is the usual slip. Unlike the phase-1 trap, this bug is wrong on **every** shape rather than half of them, so almost any test catches it.

<!-- @doubt -->
### Should I just use the hash map? It needs no reasoning.

<!-- @answer -->
It is the most defensible O(n) choice in this topic, because it gives you more than the length. The node it stops on is the loop's **entry**, and stopping at all proves the loop exists — so one pass answers detection, entry and length together, where the pointer methods need a separate phase for each. That is a real reason to pick it when you need all three and memory is cheap. Against that, it is slow: **33x to 54x** in C++ and 3.5x–5.2x in Python, despite touching the **fewest pointers of the three** — 2,000 dereferences against 5,000 at a thousand nodes. That inversion is worth internalising, and it is the same one the previous subtopic measured: its time goes into hashing and allocating, not walking, so the pointer count was never the thing to optimise. Counting operations describes an algorithm; it does not rank implementations.

<!-- @doubt -->
### What happens if I start counting from a node in the tail?

<!-- @answer -->
The walk never terminates. The stopping condition is arriving back at the node you started from, and a node in the tail is not in the loop — nothing points at it once you have left it, so you circle the loop forever comparing against a node you can never reach again. This is worth naming because it is the failure mode of the most natural wrong version of this algorithm: starting the count at the **head** rather than at the collision. On a list where the loop happens to begin at the head it works, which is one more short-tailed case that passes and hides the bug. The safeguard is the same one the whole algorithm rests on — begin from a node you know is inside the loop, and the only node you know that about for free is the collision.

<!-- @doubt -->
### Is 0 a safe value to mean "no loop"?

<!-- @answer -->
Yes, because no real loop can have length 0. The shortest possible loop is a single node pointing at itself, which has length 1, so 0 is unambiguous and every non-zero return is a genuine length. That is a slightly happier position than the previous subtopic, where "no loop" and "the loop starts at the head" both wanted to be expressed by the return value and had to be distinguished by null against a node. Here the only care needed is on the caller's side: a caller testing the result for truthiness gets the right behaviour, but one comparing against a sentinel like `-1` will not, so pick one convention and document it. It is also why the off-by-one bug above is worth catching early — a counter starting at 0 turns a self-loop into a reported 0 and makes a real loop look like none at all.
