---
id: detect-a-loop-in-ll
topic: Linked Lists
title: Detect a loop in LL
difficulty: Medium
status: ready
prerequisites:
  - middle-of-a-linkedlist-tortoisehare-method
  - introduction-to-singly-linkedlist
  - find-the-length-of-the-linked-list
  - search-in-linked-list
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - find-the-starting-point-in-ll
  - length-of-loop-in-ll
  - middle-of-a-linkedlist-tortoisehare-method
  - reverse-a-ll
  - remove-nth-node-from-the-back-of-the-ll
---

<!-- @summary -->
Two pointers at different speeds, where almost everything people "know" about the choice of speeds turns out to be wrong: a hare moving **3, 4, 5, 6 or 7** steps detects every cycle just as reliably as one moving 2 — verified across 1,640 shapes — and 2 wins on **cost**, not correctness, in 81.9% of shapes; the meeting point is **not** the start of the loop; and the two classic bugs fail in exactly characterisable ways, one reporting a loop in every acyclic list and the other crashing on **every odd-length list and no even-length one**.

<!-- @theory -->
## The problem

A singly linked list normally ends at null. If some node's `next` points back at
an earlier node, walking the list never terminates:

```
1 -> 2 -> 3 -> 4 -> 5
          ^         |
          +---------+
```

Detecting that without modifying the list and without O(n) memory is the
question. The list has two parameters that matter throughout: the **tail
length** — how many nodes you pass before entering the loop — and the **loop
length**. Call them the tail and the cycle.

## The idea

Move one pointer one step at a time and another two steps at a time. If the list
ends, the fast one reaches null. If it does not end, both pointers end up
circling the loop, and the fast one gains exactly one position per iteration on
the slow one, so it must eventually land on it.

```cpp
bool hasCycle(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}
```

Verified against a hash-set implementation and against ground truth on **960
shapes** — every combination of tail 0–30 and cycle 0–30 — with zero
disagreements.

## Why two? Not for the reason usually given

The common explanation is that a gap closing by exactly one cannot "jump over"
the slow pointer, and that a faster hare might skip past it forever. That
sounds right and is false.

Every speed from 2 to 7 was run against every shape with tail 0–40 and cycle
1–40 — 1,640 shapes each:

| Hare speed | Shapes | Cycles missed |
|---|---|---|
| 2 | 1,640 | **0** |
| 3 | 1,640 | **0** |
| 4 | 1,640 | **0** |
| 5 | 1,640 | **0** |
| 6 | 1,640 | **0** |
| 7 | 1,640 | **0** |

Nothing is ever skipped, and the reason is that **both pointers start on the
same node**. The gap between them therefore starts at zero and grows by
`speed - 1` each iteration, so after enough iterations it is a multiple of the
cycle length again — which is the same node. A gap that started at some awkward
offset could indeed be missed by a fast hare; a gap that starts at zero cannot.

So the choice of 2 is about **cost**, not correctness. Counting every pointer
dereference across 3,660 shapes — tail 0–60 by cycle 1–60 — and asking which
speed is cheapest:

| Hare speed | Cheapest (or tied) | Share |
|---|---|---|
| **2** | 2,999 shapes | **81.9%** |
| 3 | 576 shapes | 15.7% |
| 4 | 135 shapes | 3.7% |
| 5 | 84 shapes | 2.3% |
| 6 | 101 shapes | 2.8% |
| 7 | 65 shapes | 1.8% |

The reason is the tail. The slow pointer has to walk the entire tail before it
is even in the loop, so the **iteration count can never be less than the tail
length** — confirmed on every shape tested. Once the tail dominates, every speed
takes the same number of iterations and a faster hare merely does more reads
inside each one. Split by shape:

| | Speed 2 cheaper | Speed 3 cheaper |
|---|---|---|
| No tail at all | 30 of 60 | 30 of 60 |
| Tail of 1–5 | 158 of 300 | 140 of 300 |
| Tail of 6 or more | **2,677 of 3,300** | 325 of 3,300 |

With no tail it is an even split. With a real tail, 2 wins four times out of five.

## Where they meet is not where the loop starts

A natural assumption is that the collision happens at the loop entry. It does
not, except by coincidence:

| Tail | Cycle | They meet at node | Loop starts at node | Same? |
|---|---|---|---|---|
| 0 | 5 | 0 | 0 | yes |
| 1 | 5 | 5 | 1 | no |
| 3 | 5 | 5 | 3 | no |
| 5 | 5 | 5 | 5 | yes |
| 7 | 5 | 10 | 7 | no |
| 10 | 3 | 12 | 10 | no |
| 6 | 4 | 8 | 6 | no |

The two "yes" rows are accidents of those particular shapes, not a rule. Turning
a meeting point into the loop's entry needs a second phase, which is the whole
of **Find the starting point in LL** — for detection, the collision alone is the
answer.

## What the O(1) space is worth

The obvious alternative is to record every node you have seen and stop when one
repeats. It is easier to believe and much more expensive.

| Tail | Cycle | Floyd | Hash set | Floyd iterations |
|---|---|---|---|---|
| 1,000 | 1,000 | **4.14us** | 214.09us | 1,000 |
| 100,000 | 100,000 | **378.60us** | 26,903us | 100,000 |
| 999,999 | 1 | **2,735us** | 268,869us | 999,999 |
| 200,000 | none | **486.95us** | 28,528us | 100,000 |
| 1,000,000 | none | **2,115us** | 261,300us | 500,000 |

Across four runs the advantage ranged from **47x to 260x**. That spread is the
hash set's, not Floyd's — its cost is dominated by allocation and rehashing and
moves with memory pressure, while Floyd's iteration counts are exact and
reproducible. Note the acyclic rows: the hare reaches null after n/2 iterations,
which is why a list with no loop costs half as many iterations as its length.

Memory is the more fundamental difference, measured on an acyclic list where
every node must be recorded:

| n | Floyd peak RSS | Hash set peak RSS |
|---|---|---|
| 1,000,000 | **24.3 MB** | 73.9 MB |
| 4,000,000 | **93.2 MB** | 282.5 MB |

About **50 bytes per node** on top of the list itself, roughly tripling total
memory. Floyd uses two pointers at any size.

In Python the gap is narrower but the same shape — **3.9x to 8.3x**:

| Shape | Floyd | Set of ids |
|---|---|---|
| tail 1,000, cycle 1,000 | **58.4us** | 330us |
| tail 50,000, cycle 50,000 | **2,978us** | 24,000us |
| tail 100,000, no cycle | **2,982us** | 23,900us |
| tail 99,999, cycle 1 | **6,100us** | 24,000us |

The last row is worth reading: a one-node loop at the end of a long tail is
Floyd's worst case, costing 99,999 iterations, and the ratio narrows to 3.9x.

<!-- @intuition -->
The whole algorithm rests on one observation: inside a loop, a pointer that gains ground on another must eventually land on it exactly, because the track is finite and the gap only ever moves in one direction. Everything else is bookkeeping. What makes this problem worth studying carefully is how much of the folklore around it is decoration rather than reasoning — the hare moves two steps because two is cheap, not because two is safe, and the pointers meet somewhere in the loop rather than at its mouth. Both of those are checkable in an afternoon, and checking them is the difference between knowing the algorithm and repeating it. The other half of the lesson is that the difficulty here has moved out of the algorithm and into the loop condition: the interesting failures are not wrong reasoning about pointers gaining on each other, they are testing for a collision before either pointer has moved, or dereferencing two links after checking only one. Those are the bugs that ship, and both of them pass a good fraction of any test suite you are likely to write by hand.

<!-- @approach -->
### Optimal - Floyd's Tortoise and Hare

<!-- @idea -->
Walk one pointer at one step and another at two; if they ever coincide, the list loops.

<!-- @steps -->
1. Start both pointers at the head.
2. While the fast pointer and the node after it both exist, keep going.
3. Advance the slow pointer one node.
4. Advance the fast pointer two nodes.
5. If the two pointers are now equal, report a loop.
6. If the loop condition fails, the fast pointer reached the end — report no loop.

<!-- @complexity -->
- time: O(n) — the slow pointer walks the tail, then at most one lap of the cycle
- space: **O(1)** — two pointers, at any list size
- note: The one to write. Measured **47x to 260x** faster than a hash set and about a third of its memory — 24.3 MB against 73.9 MB at a million nodes. The comparison on step 5 must come **after** both advances: test it first and every acyclic list of two or more nodes reports a loop, since both pointers start on the same node.

<!-- @code cpp -->
```cpp
bool hasCycle(Node* head) {
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
        if (slow == fast) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 4: Both halves are required, in this order. Dropping `fast->next` crashes on every odd-length acyclic list and on no even-length one — exactly half your tests pass.
- 7: This must come after lines 5 and 6. Checking before advancing returns true for every acyclic list of two or more nodes, because both pointers start at the head.
- 6: `fast->next->next` is safe only because line 4 has already established that `fast` and `fast->next` are both non-null.
- 9: Reached only when the fast pointer runs off the end, which for an acyclic list of n nodes takes n/2 iterations.

<!-- @code java -->
```java
static boolean hasCycle(Node head) {
    Node slow = head;
    Node fast = head;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
        if (slow == fast) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 7: Reference comparison, which is what is wanted — two distinct nodes holding equal values must not count as a meeting. Using `.equals` here would be a bug for any node type that defines it.

<!-- @code python -->
```python
def has_cycle(head):
    slow = fast = head
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
        if slow is fast:
            return True
    return False


# `is`, not `==`. Identity is the question -- two different nodes
# holding the same value are not a meeting. Measured 3.9x to 8.3x
# faster than recording ids in a set.
```

<!-- @annotations -->
- 6: `is` compares identity; `==` would call `__eq__` and could report a false meeting for any node class that defines equality by value.

<!-- @approach -->
### Hash Set of Visited Nodes

<!-- @idea -->
Walk the list once, recording each node's address, and stop the moment one repeats.

<!-- @steps -->
1. Create an empty set of node addresses.
2. Walk from the head one node at a time.
3. Try to insert the current node's address into the set.
4. If it was already present, this node has been visited — report a loop.
5. If the walk reaches null, report no loop.

<!-- @complexity -->
- time: O(n) expected, with hashing and allocation costs per node
- space: **O(n)** — one set entry per node
- note: Easier to believe and much worse to run: **47x to 260x** slower than Floyd across four runs, and about **50 bytes per node** of extra memory — 73.9 MB against 24.3 MB at a million nodes, roughly tripling the total. Its one genuine advantage is that it hands you the repeated node directly, which is the loop's entry point rather than an arbitrary meeting point inside it.

<!-- @code cpp -->
```cpp
#include <unordered_set>
using namespace std;

bool hasCycleSet(Node* head) {
    unordered_set<Node*> seen;
    for (Node* p = head; p != nullptr; p = p->next) {
        if (!seen.insert(p).second) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 7: `insert` returns a pair whose `.second` is false when the key was already present, so this tests and inserts in one hash lookup rather than two.
- 6: Storing the pointer, not the value. Two nodes may hold the same data without being the same node.

<!-- @code java -->
```java
static boolean hasCycleSet(Node head) {
    Set<Node> seen = Collections.newSetFromMap(new IdentityHashMap<>());
    for (Node p = head; p != null; p = p.next) {
        if (!seen.add(p)) return true;
    }
    return false;
}
```

<!-- @annotations -->
- 2: An identity-based set. A plain `HashSet` would use the node's `hashCode` and `equals`, so any node type that defines equality by value would report a loop on the first duplicate value.

<!-- @code python -->
```python
def has_cycle_set(head):
    seen = set()
    p = head
    while p is not None:
        if id(p) in seen:
            return True
        seen.add(id(p))
        p = p.next
    return False


# id(), not the node itself -- a Node class defining __eq__ or __hash__
# by value would otherwise report a loop on the first repeated value.
```

<!-- @annotations -->
- 5: Keying on `id` sidesteps any `__hash__`/`__eq__` the node class defines. It is only safe because every node stays alive for the duration of the walk.

<!-- @approach -->
### Brent's Algorithm

<!-- @idea -->
Keep the tortoise still and let the hare run a doubling number of steps, teleporting the tortoise to the hare each time the allowance runs out.

<!-- @steps -->
1. Put the tortoise on the head and the hare one node ahead, with a step allowance of 1.
2. While the two are not equal, advance only the hare, counting steps.
3. When the count reaches the allowance, move the tortoise to the hare's position.
4. Double the allowance and reset the count to zero.
5. If the hare reaches null, report no loop; if it lands on the tortoise, report a loop.

<!-- @complexity -->
- time: O(n) — same order, with a smaller constant
- space: **O(1)** — two pointers and two integers
- note: Cheaper than Floyd in **every one of 3,660 shapes tested**, using **0.25x to 0.75x** as many pointer dereferences. Per iteration Floyd reads four links — one to test `fast->next`, one to advance the tortoise and two to advance the hare — where Brent reads exactly one. Floyd is still the one to reach for: it is the expected answer, and its meeting point feeds the second phase that locates the loop's entry. Brent's is worth knowing when detection alone is the goal and the list is long.

<!-- @code cpp -->
```cpp
bool hasCycleBrent(Node* head) {
    if (head == nullptr) return false;
    Node* tortoise = head;
    Node* hare = head->next;
    long power = 1, steps = 0;
    while (hare != nullptr && tortoise != hare) {
        if (steps == power) { tortoise = hare; power *= 2; steps = 0; }
        hare = hare->next;
        steps++;
    }
    return hare != nullptr;
}
```

<!-- @annotations -->
- 7: The teleport. Instead of crawling forward, the tortoise jumps to wherever the hare is and waits for twice as long — which is why only one pointer is ever moving.
- 6: Two exit routes: the hare hits null on an acyclic list, or it catches the stationary tortoise.
- 11: Distinguishing the two exits. A non-null hare means the loop ended because they met.

<!-- @code java -->
```java
static boolean hasCycleBrent(Node head) {
    if (head == null) return false;
    Node tortoise = head;
    Node hare = head.next;
    long power = 1, steps = 0;
    while (hare != null && tortoise != hare) {
        if (steps == power) { tortoise = hare; power *= 2; steps = 0; }
        hare = hare.next;
        steps++;
    }
    return hare != null;
}
```

<!-- @annotations -->
- 5: `long` rather than `int` for the doubling allowance — it can only reach the cycle length, but a long costs nothing and removes the question.

<!-- @code python -->
```python
def has_cycle_brent(head):
    if head is None:
        return False
    tortoise = head
    hare = head.next
    power, steps = 1, 0
    while hare is not None and tortoise is not hare:
        if steps == power:
            tortoise = hare
            power *= 2
            steps = 0
        hare = hare.next
        steps += 1
    return hare is not None


# Fewer pointer reads than Floyd in all 3,660 shapes measured
# -- 0.25x to 0.75x -- because only one pointer ever moves.
```

<!-- @annotations -->
- 12: One link read per iteration, against the four Floyd needs — the loop-condition test, the tortoise, and two for the hare. That single difference is the whole of the saving.

<!-- @example -->

<!-- @input -->
`1 -> 2 -> 3 -> 4 -> 5`, with node 5 pointing back at node 3

<!-- @output -->
`true`

<!-- @why -->
The basic trace, showing that the collision happens inside the loop rather than at its mouth.

<!-- @walkthrough -->
1. Both pointers start on node 1.
2. Iteration one: slow moves to 2, fast moves to 3. Not equal.
3. Iteration two: slow moves to 3, fast moves to 5. Not equal.
4. Iteration three: slow moves to 4, fast moves from 5 back to 3, then on to 4. Equal — report a loop.
5. They met on node 4, which is neither the head nor the loop's entry at node 3.
6. The fast pointer gained exactly one position on the slow pointer each iteration, which is why a collision was unavoidable.
7. Locating the entry from here is a separate second phase, covered in **Find the starting point in LL**.

<!-- @example -->

<!-- @input -->
Hare speeds of 2, 3, 4, 5, 6 and 7 across 1,640 shapes each

<!-- @output -->
Zero cycles missed at every speed

<!-- @why -->
Refutes the usual explanation for why the hare moves two steps.

<!-- @walkthrough -->
1. The common claim is that a faster hare could leap over the tortoise and circle forever.
2. Every shape with tail 0–40 and cycle 1–40 was run at each speed from 2 to 7.
3. All six speeds detected all 1,640 cycles, missing none.
4. The reason is that **both pointers start on the same node**, so the gap between them starts at zero.
5. The gap then grows by `speed - 1` per iteration, and a gap that starts at zero returns to a multiple of the cycle length no matter what it grows by.
6. A gap starting at some other offset genuinely could be missed — that is the situation the folklore describes, and it is not this one.
7. So 2 is chosen for cost rather than safety, which the next example measures.

<!-- @example -->

<!-- @input -->
Total pointer dereferences at each hare speed, across 3,660 shapes

<!-- @output -->
Speed 2 cheapest or tied in 81.9% of shapes

<!-- @why -->
Gives the real reason for the choice, and shows where it comes from.

<!-- @walkthrough -->
1. Every shape with tail 0–60 and cycle 1–60 was run at speeds 2 through 7, counting every pointer read.
2. Speed 2 was cheapest or tied in 2,999 of 3,660 shapes; speed 3 in 576; the rest trailed further.
3. The cause is the tail: the slow pointer must walk all of it before it is even inside the loop.
4. So the iteration count can never be below the tail length, which held on every shape tested.
5. Once the tail dominates, all speeds take the same number of iterations and a faster hare only adds reads within each one.
6. Split by shape, speed 2 beat speed 3 in 2,677 of 3,300 cases with a tail of six or more.
7. With no tail at all the two are level — 30 wins each out of 60 — because there is no tail for the tortoise to be slowed by.

<!-- @example -->

<!-- @input -->
`while (fast != nullptr)` with the `fast->next` check removed

<!-- @output -->
Crashes on every odd-length acyclic list, survives every even-length one

<!-- @why -->
A bug with a parity, which is why it survives casual testing.

<!-- @walkthrough -->
1. The body runs `fast = fast->next->next`, which dereferences two links but only one was checked.
2. On an acyclic list the fast pointer visits nodes at even offsets: 0, 2, 4, and so on.
3. If the length is even it eventually lands exactly on null and the loop condition stops it safely.
4. If the length is odd it lands on the **last node**, whose `next` is null, and then dereferences that null.
5. Tested on lengths 0 through 12: crashed on 1, 3, 5, 7, 9 and 11; survived 0, 2, 4, 6, 8, 10 and 12.
6. That is six crashes and seven clean runs — near enough half a test suite passing.
7. The fix is to check both links before dereferencing both, which is exactly what `fast && fast->next` does.

<!-- @example -->

<!-- @input -->
The `slow == fast` test moved to the top of the loop body

<!-- @output -->
`true` for every acyclic list of two or more nodes

<!-- @why -->
The other classic bug, which fails in the opposite direction — never crashing, always lying.

<!-- @walkthrough -->
1. Both pointers are initialised to the head, so they are equal before either has moved.
2. Testing for equality before advancing therefore succeeds on the very first iteration.
3. The loop condition `fast && fast->next` is satisfied by any list of two or more nodes, so the body runs at least once.
4. Measured: a two-node acyclic list reports a loop, and a 1,000-node acyclic list reports a loop.
5. It still answers correctly on lists that genuinely have loops, so it looks right whenever the test data has one.
6. Empty and single-node lists also answer correctly, because the loop body never runs.
7. The fix is ordering: advance both pointers, then compare.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the list as a lollipop — a straight tail running into a circle — because the tail and the cycle are the two numbers everything in this problem depends on, and they should be visible and separately labelled from the first frame. Put the tortoise and the hare on the head together and step them, tortoise one node, hare two, leaving a fading trail so the hare's laps are visible. The moment they collide, freeze and mark the collision node — then, crucially, mark the loop's entry node in a **different** colour a little way back around the circle, with the gap between them labelled. That gap is the point: the meeting is not the mouth. Carry a live counter of the gap between the two pointers, showing it grow by one each iteration and wrap to zero at the moment of collision, since that wrap is the whole proof. The second panel answers "why two" by running four hares at once on the same lollipop, at speeds 2, 3, 4 and 5, each in its own colour, each with a dereference counter ticking up. They all collide — that is the finding — but at different times and different costs, and the counters should end at visibly different totals. Underneath, the 81.9% figure with the tail-versus-no-tail split, so it is clear that 2 wins on cost and only on cost. The last panel is the two bugs, each as a short animation on an acyclic list. For the missing null check, an odd-length list where the hare lands on the final node and reaches through its null `next` — draw that reach hitting a wall, and next to it the even-length list where the hare lands cleanly on null and stops, with the parity called out. For the misplaced comparison, show both pointers still stacked on the head at iteration zero with the equality test already firing green, and the verdict `true` on a list that plainly has no loop.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"shapeParameters":{"tail":"nodes passed before entering the loop","cycle":"nodes in the loop","note":"every result in this container is indexed by these two numbers"},"algorithm":{"idea":"slow moves 1, fast moves 2; if the list ends the fast pointer finds null, otherwise the gap closes and they collide","gapArgument":"both pointers start on the SAME node, so the gap starts at 0 and grows by (speed-1) each iteration, returning to a multiple of the cycle length"},"correctness":{"comparedAgainst":["hash set","ground truth"],"shapes":960,"range":"tail 0..30 by cycle 0..30","disagreements":0},"whyTwoIsNotAboutSafety":{"folklore":"a faster hare could leap over the tortoise and circle forever","verdict":"false when both pointers start together","sweep":{"range":"tail 0..40 by cycle 1..40","shapesPerSpeed":1640,"missed":[{"speed":2,"missed":0},{"speed":3,"missed":0},{"speed":4,"missed":0},{"speed":5,"missed":0},{"speed":6,"missed":0},{"speed":7,"missed":0}]},"whenFolkloreWouldApply":"a gap starting at a nonzero offset genuinely can be missed -- that is not this situation"},"whyTwoIsAboutCost":{"metric":"total pointer dereferences","range":"tail 0..60 by cycle 1..60","shapes":3660,"cheapestOrTied":[{"speed":2,"shapes":2999,"share":"81.9%"},{"speed":3,"shapes":576,"share":"15.7%"},{"speed":4,"shapes":135,"share":"3.7%"},{"speed":5,"shapes":84,"share":"2.3%"},{"speed":6,"shapes":101,"share":"2.8%"},{"speed":7,"shapes":65,"share":"1.8%"}],"cause":"the slow pointer must walk the whole tail, so iterations can never be fewer than the tail length -- confirmed on every shape tested","splitByShape":[{"shape":"no tail","speed2Cheaper":"30 of 60","speed3Cheaper":"30 of 60"},{"shape":"tail 1..5","speed2Cheaper":"158 of 300","speed3Cheaper":"140 of 300"},{"shape":"tail >= 6","speed2Cheaper":"2677 of 3300","speed3Cheaper":"325 of 3300"}]},"meetingPointIsNotTheEntry":{"rows":[{"tail":0,"cycle":5,"meetAt":0,"entryAt":0,"same":true},{"tail":1,"cycle":5,"meetAt":5,"entryAt":1,"same":false},{"tail":3,"cycle":5,"meetAt":5,"entryAt":3,"same":false},{"tail":5,"cycle":5,"meetAt":5,"entryAt":5,"same":true},{"tail":7,"cycle":5,"meetAt":10,"entryAt":7,"same":false},{"tail":10,"cycle":3,"meetAt":12,"entryAt":10,"same":false},{"tail":6,"cycle":4,"meetAt":8,"entryAt":6,"same":false}],"note":"the two matching rows are coincidences of those shapes, not a rule","secondPhaseLivesIn":"Find the starting point in LL"},"benchCpp":{"unit":"microseconds, medians of 9, volatile sink to stop the optimiser deleting the pure call","rows":[{"tail":1000,"cycle":1000,"floyd":4.14,"hashSet":214.09,"floydIterations":1000},{"tail":100000,"cycle":100000,"floyd":378.60,"hashSet":26903,"floydIterations":100000},{"tail":999999,"cycle":1,"floyd":2735,"hashSet":268869,"floydIterations":999999},{"tail":200000,"cycle":0,"floyd":486.95,"hashSet":28528,"floydIterations":100000},{"tail":1000000,"cycle":0,"floyd":2115,"hashSet":261300,"floydIterations":500000}],"rangeAcrossRuns":"47x to 260x","spreadBelongsTo":"the hash set -- allocation and rehashing move with memory pressure; Floyd's iteration counts are exact","acyclicNote":"an acyclic list of n nodes costs n/2 iterations, since the hare reaches null"},"memory":{"measuredOn":"an acyclic list, the worst case for the hash set","rows":[{"n":1000000,"floyd":"24.3 MB","hashSet":"73.9 MB"},{"n":4000000,"floyd":"93.2 MB","hashSet":"282.5 MB"}],"perNodeOverhead":"about 50 bytes","effect":"roughly triples total memory"},"benchPython":{"unit":"microseconds, medians of 7 across 3 clean runs","rows":[{"shape":"tail 1000, cycle 1000","floyd":58.4,"setOfIds":330},{"shape":"tail 50000, cycle 50000","floyd":2978,"setOfIds":24000},{"shape":"tail 100000, no cycle","floyd":2982,"setOfIds":23900},{"shape":"tail 99999, cycle 1","floyd":6100,"setOfIds":24000}],"range":"3.9x to 8.3x","worstCaseForFloyd":"a one-node loop after a long tail -- 99,999 iterations, narrowing the ratio to 3.9x"},"brent":{"idea":"the tortoise stays still while the hare runs a doubling allowance, then teleports to the hare","cheaperInEveryShape":"3,660 of 3,660","dereferenceRatio":"0.25x to 0.75x of Floyd","cause":"Brent reads one link per iteration; Floyd reads four -- the fast->next test, the tortoise advance, and two for the hare","measuredOn":"the published implementations, with every ->next counted","whyFloydIsStillTheAnswer":"it is the expected solution and its meeting point feeds the second phase that locates the loop entry"},"classicBugs":[{"bug":"while (fast) -- the fast->next check removed","failureMode":"dereferences two links having checked one","parity":"crashes on every ODD-length acyclic list, survives every EVEN-length one","measured":"lengths 0..12: crashed on 1,3,5,7,9,11; survived 0,2,4,6,8,10,12","why":"the hare visits even offsets, so an even length lands it exactly on null and an odd length lands it on the last node"},{"bug":"slow == fast tested before advancing","failureMode":"both pointers start on the head, so the first test always succeeds","measured":"reports a loop on a 2-node acyclic list and on a 1,000-node acyclic list","deceptive":"still answers correctly whenever the list really does have a loop"}],"edgeCaseAnswers":[{"shape":"empty list","answer":false},{"shape":"single node, no cycle","answer":false},{"shape":"single node self-loop","answer":true},{"shape":"two nodes, no cycle","answer":false},{"shape":"two-node cycle","answer":true},{"shape":"tail 1 into a 1-node cycle","answer":true},{"shape":"1000-node tail, no cycle","answer":false},{"shape":"whole list is the cycle","answer":true}],"recommendation":"Floyd, with the comparison after both advances and both null checks before either dereference","lesson":"the hare moves two because two is cheap, not because two is safe -- and the pointers meet somewhere inside the loop, not at its mouth"}
```

<!-- @highlights -->
- The list is drawn as a lollipop — a straight tail running into a circle — with the tail and the cycle separately labelled from the first frame.
- Tortoise and hare start together on the head and step one and two nodes, the hare leaving a fading trail so its laps are visible.
- At the collision the animation freezes and marks the meeting node.
- The loop's entry node is marked in a different colour further back around the circle, with the gap between them labelled.
- That gap carries the caption: the meeting is not the mouth.
- A live counter shows the gap between the pointers growing by one each iteration and wrapping to zero at the collision.
- That wrap is the whole proof and should be the most legible number on the panel.
- The second panel runs four hares at once on the same lollipop, at speeds 2, 3, 4 and 5, each in its own colour.
- Each hare carries its own dereference counter, ticking up as it moves.
- All four collide — that is the finding — but at different times and visibly different totals.
- Underneath sits the 81.9% figure with the tail-versus-no-tail split, making clear that 2 wins on cost alone.
- The last panel animates the two bugs on acyclic lists.
- For the missing null check, an odd-length list shows the hare landing on the final node and reaching through its null `next` into a wall.
- Beside it, an even-length list shows the hare landing cleanly on null and stopping, with the parity called out.
- For the misplaced comparison, both pointers sit stacked on the head at iteration zero with the equality test already firing green.
- The verdict `true` is printed against a list that plainly has no loop.

<!-- @edgeCases -->
- The empty list — the loop condition fails immediately, returns false.
- A single node with a null `next` — returns false, and is the shortest list that crashes the missing-null-check version.
- A single node pointing at itself — returns true on the first iteration, both pointers landing on it.
- Two nodes with no loop — returns false, and is the shortest list that fools the compare-before-advancing version.
- A two-node cycle — the smallest loop with more than one node, detected in one iteration.
- A one-node loop at the end of a long tail — correct, and Floyd's worst case: 99,999 iterations on a 100,000-node list.
- A list that is entirely one big loop, with no tail — detected, and the only shape where speeds 2 and 3 cost the same on average.
- A long acyclic list — costs n/2 iterations, since the hare reaches null after half as many steps as there are nodes.
- Nodes whose type defines equality by value — identity comparison is required; `==` in Python or `.equals` in Java could report a false meeting.
- A list being modified by another thread while the walk runs — none of these are safe, and the hash-set version is not safer for recording addresses.
- Very long lists in the Brent version — the doubling allowance stays below the cycle length, so it never overflows a `long`.

<!-- @pitfalls -->
- Checking `slow == fast` before advancing. Both start on the head, so every acyclic list of two or more nodes reports a loop — measured on lists of 2 and of 1,000.
- Writing `while (fast != nullptr)` without `fast->next`. Crashes on every odd-length acyclic list and no even-length one — six crashes and seven clean runs over lengths 0 to 12.
- Reversing the two halves of the condition. `fast->next != nullptr && fast != nullptr` dereferences before it checks, so the guard does nothing.
- Believing a faster hare can skip past the tortoise. Speeds 2 through 7 each detected all 1,640 cycles tested; both pointers starting together is what rules it out.
- Assuming the meeting point is the loop's entry. It usually is not — the two matching rows in the measured table are coincidences of those shapes.
- Comparing node values instead of node identity. Two distinct nodes holding the same data are not a meeting; use `is` in Python and reference equality in Java.
- Using a plain `HashSet` in Java for the set-based version. It hashes by `hashCode`, so a node type with value equality reports a loop on the first repeated value — `IdentityHashMap` is the fix.
- Reaching for the hash set because it is easier to believe. It measured 47x to 260x slower and about 50 bytes per node heavier, roughly tripling total memory.
- Benchmarking Floyd without consuming the result. It is a pure function on an unmodified list, so the optimiser deletes the call — the first attempt here reported 0.01 microseconds and a ratio of 32 million.
- Marking nodes as visited to detect the loop. That modifies the caller's list, and it needs a spare field that most node types do not have.
- Expecting detection to give you the loop's start. It gives you a collision; converting that into the entry is a separate second phase.

<!-- @doubt -->
### Why does the fast pointer move exactly two steps?

<!-- @answer -->
For cost, not for correctness — and the usual explanation is wrong. The folklore says a faster hare could leap over the tortoise and circle forever. Tested: hare speeds of 2, 3, 4, 5, 6 and 7 were each run against all 1,640 shapes with tail 0–40 and cycle 1–40, and **every speed detected every cycle**. Nothing is ever skipped, because both pointers start on the **same node**, so the gap between them begins at zero and grows by `speed - 1` each iteration — and a gap starting at zero always returns to a multiple of the cycle length. What 2 actually buys is cheapness. Counting every pointer dereference across 3,660 shapes, speed 2 was cheapest or tied in **81.9%** of them. The reason is the tail: the tortoise has to walk all of it before it is even in the loop, so the iteration count can never be lower than the tail length, and once the tail dominates, a faster hare just does more reads per iteration without finishing sooner.

<!-- @doubt -->
### Do the pointers meet at the start of the loop?

<!-- @answer -->
No, except by coincidence. On a list with a 1-node tail and a 5-node cycle they meet four nodes past the entry; with a 7-node tail and a 5-node cycle they meet three past it; with a 10-node tail and a 3-node cycle, two past. Two shapes in the measured table do meet at the entry — tail 0 and tail 5 with a 5-cycle — but those are accidents of the particular numbers, not a rule, and building on them will fail on the next input. For **detecting** a loop this does not matter at all: the collision itself is the answer, and where it happened is irrelevant. Converting a meeting point into the loop's entry takes a second phase with a genuinely surprising proof behind it, and that is the whole of **Find the starting point in LL**.

<!-- @doubt -->
### Why not just use a hash set? It is much easier to understand.

<!-- @answer -->
It is, and it costs you both time and memory. Measured against Floyd across four runs, the hash set ran **47x to 260x slower** — 214 microseconds against 4.14 at a thousand nodes, and 261,300 against 2,115 at a million. Memory is the bigger objection: on a million-node acyclic list, peak usage was **73.9 MB against 24.3 MB**, about 50 extra bytes per node, roughly tripling the total. In Python the time gap narrows to 3.9x–8.3x but the memory argument is unchanged. There is one real advantage: the repeated node it finds **is** the loop's entry, where Floyd's collision is some arbitrary node inside the loop — so if you need the entry and are not willing to write the second phase, the set gives it to you directly. That is a legitimate trade, and it should be a deliberate one rather than a default.

<!-- @doubt -->
### What is wrong with `while (fast != nullptr)`?

<!-- @answer -->
It dereferences two links having checked only one. The body runs `fast = fast->next->next`, so both `fast` and `fast->next` must exist, but that condition only guarantees the first. What makes it dangerous is the pattern of failure: on an acyclic list the hare visits even offsets, so an **even**-length list lands it exactly on null and it stops safely, while an **odd**-length list lands it on the last node and then reaches through that node's null `next`. Tested on lengths 0 through 12, it crashed on 1, 3, 5, 7, 9 and 11 and survived 0, 2, 4, 6, 8, 10 and 12 — six crashes against seven clean runs. A hand-written test suite has roughly even odds of missing it entirely, and it never misbehaves on a list that actually has a loop, since the hare never reaches null there. Write `fast != nullptr && fast->next != nullptr`, in that order — reversed, the guard dereferences before it checks and does nothing at all.

<!-- @doubt -->
### Does it matter where I put the `slow == fast` check?

<!-- @answer -->
It decides whether the function works. Both pointers are initialised to the head, so they are already equal before either has moved — put the comparison at the **top** of the loop body and it fires on the first iteration of every list long enough to enter the loop at all. Measured: a two-node acyclic list reports a loop, and a 1,000-node acyclic list reports a loop. The bug is deceptive because it still answers **correctly on every list that genuinely has one**, and correctly on empty and single-node lists too, where the body never runs — so it only shows up on longer acyclic input. Advance both pointers first, then compare. The alternative fix, starting `fast` at `head->next`, also works but needs its own null check and buys nothing.

<!-- @doubt -->
### Is there anything faster than Floyd?

<!-- @answer -->
Yes, for detection alone. Brent's algorithm keeps the tortoise stationary and lets the hare run a doubling allowance of steps, teleporting the tortoise to the hare whenever the allowance runs out. Because only one pointer ever moves, it costs one dereference per step against Floyd's three, and it used **fewer dereferences in all 3,660 shapes tested** — between **0.25x and 0.75x** of Floyd's count, with the biggest wins on long tails with short cycles. It is O(1) space like Floyd and terminates on acyclic lists the same way, by the hare reaching null. Floyd is still the right default: it is the expected answer in any setting where you are asked this, it is shorter, and its meeting point is the input to the second phase that finds the loop's entry — which Brent's collision does not directly give you. Reach for Brent's when detection is genuinely the whole job and the lists are long.

<!-- @doubt -->
### My benchmark said Floyd takes 0.01 microseconds. What went wrong?

<!-- @answer -->
The compiler deleted the call. Floyd is a pure function that reads a list and returns a bool without modifying anything, so if you discard the result in a timing loop, the optimiser can prove the whole call has no effect and remove it. That is exactly what happened on the first attempt here: Floyd measured 0.00–0.01 microseconds at every size, and the ratio against the hash set came out at over **32 million**, which is the tell — no algorithm is thirty-two million times faster than another for the same O(n) walk. The hash-set version survived only because it allocates, which the optimiser cannot elide. The fix is to consume the result, by accumulating it into a `volatile` sink so the call cannot be proved dead. It is worth pairing timings with an exact count for the same reason: Floyd's iteration counts — 1,000 and 100,000 and 999,999 on the shapes above — are reproducible in a way wall-clock numbers are not, and they would have contradicted the impossible timing immediately.
