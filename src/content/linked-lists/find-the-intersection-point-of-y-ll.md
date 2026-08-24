---
id: find-the-intersection-point-of-y-ll
topic: Linked Lists
title: Find the intersection point of Y LL
difficulty: Medium
status: ready
prerequisites:
  - find-the-length-of-the-linked-list
  - introduction-to-singly-linkedlist
  - detect-a-loop-in-ll
  - search-in-linked-list
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - detect-a-loop-in-ll
  - find-the-starting-point-in-ll
  - find-the-length-of-the-linked-list
  - add-two-numbers-in-linked-list
  - clone-a-ll-with-random-and-next-pointer
---

<!-- @summary -->
Walking both lists in step from their heads is not a slightly unreliable solution — it is wrong on **99.2%** of unequal-length inputs, because lockstep from two heads never aligns the lists at all. Both real algorithms exist to fix that alignment. The elegant one, switching each pointer to the other list's head, terminates on all **17,575** shapes tested and takes exactly `a + b + c + 1` steps — except when the lists are the same length, where it takes `a` and never switches.

<!-- @theory -->
## The shape of the problem

Two lists may join and share a common tail — a Y, not a V. The task is to find
the first shared node.

```
A:  a0 -> a1 -> a2 \
                    c0 -> c1 -> null
B:        b0 -> b1 /
```

Three numbers describe every case, and all the results below are indexed by
them: `a` and `b` are how many nodes each list holds **privately**, and `c` is
how many they **share**. `c = 0` means they never meet.

Two things matter before any algorithm. The answer is a **node**, identified by
address, not by value — two nodes holding equal data are not an intersection.
And the shared tail is shared: once the lists meet they never separate again,
because each node has exactly one `next`.

## Why lockstep from the heads cannot work

The tempting first attempt walks both lists together from their heads and stops
where they agree. It fails, and not by a small margin:

| Input | Wrong answers |
|---|---|
| Equal-length lists | 892 of 20,000 — **4.5%** |
| Unequal-length lists | 19,839 of 20,000 — **99.2%** |

The 4.5% figure is the failure people expect: two different nodes happened to
hold the same value before the real intersection. The 99.2% is the real problem,
and it has nothing to do with duplicate values. When the lists have different
lengths, walking from both heads compares nodes at **different distances from
the intersection** — position 3 of a long list against position 3 of a short one,
which are not the same distance from the join. The comparison is meaningless
before it is unlucky.

Comparing addresses instead of values does not rescue it either, for the same
reason: correctly comparing misaligned nodes still answers the wrong question.

That reframes the whole problem. **Both real algorithms are alignment
techniques.** Once the two walks are the same distance from the end, lockstep
works and identity comparison finds the join.

## Switching heads

Walk both. When a pointer runs off the end of its list, restart it at the *other*
list's head. They meet at the intersection.

```cpp
Node* getIntersection(Node* headA, Node* headB) {
    Node* p = headA;
    Node* q = headB;
    while (p != q) {
        p = (p != nullptr) ? p->next : headB;
        q = (q != nullptr) ? q->next : headA;
    }
    return p;
}
```

The reason it works is a distance argument. A pointer starting on A travels
`a + c`, then switches and travels `b` more to reach the join — total `a + c + b`.
A pointer starting on B travels `b + c + a`. Those are the same number, so they
arrive together.

If the lists never meet, both pointers reach null after the same total distance
and the loop ends with `p == q == nullptr`, which is the right answer. That is
worth checking rather than assuming, so it was: across **17,575** shapes with
`a`, `b` and `c` each from 0 to 25, it terminated every time and returned the
correct node every time.

## What it actually costs

Counting steps across all shapes with `a`, `b`, `c` from 0 to 30:

| Case | Steps | Verified |
|---|---|---|
| `a == b` | exactly **`a`** | 960 / 960 |
| `a != b` | exactly **`a + b + c + 1`** | 28,830 / 28,830 |

The first row is the interesting one. When the two lists are the same length the
pointers **never switch at all** — they walk side by side and meet at the join,
or reach null together. The trick's famous second lap only happens when the
lengths differ, which is also the only case that needed fixing.

That shows up directly in the pointer counts against the length-difference
method:

| a | b | c | Switching | Length-difference |
|---|---|---|---|---|
| 100,000 | 100,000 | 100,000 | **200,000** | 600,000 |
| 200,000 | 200,000 | 1 | **400,000** | 800,002 |
| 1 | 1 | 200,000 | **2** | 400,004 |
| 150,000 | 50,000 | 50,000 | 500,000 | 500,000 |

On equal-length lists the switching version reads a third as many pointers,
because the length-difference method still measures both lists first — two full
traversals it does not need. On unequal lists the two are exactly level.

The timings follow:

| Shape | Switching | Length-difference | Hash set |
|---|---|---|---|
| a=b=c=100,000 | **97.23us** | 408.68us | 18,534us |
| a=150k, b=50k, c=50k | **316.15us** | 437.77us | 18,285us |

Python keeps the same ordering:

| Shape | Switching | Length-difference | Set of ids |
|---|---|---|---|
| a=b=c=100,000 | **2,594us** | 9,966us | 24,060us |
| a=150k, b=50k, c=50k | **6,811us** | 9,835us | 20,753us |

<!-- @intuition -->
The whole problem turns on one observation: two lists that share a tail are aligned at the **end**, not at the beginning, and every naive approach fails because it starts comparing from the beginning. Once that is clear, both real solutions are recognisable as the same idea — make the two walks equidistant from the end, then step them together and compare addresses. The length-difference method does that arithmetically, by measuring both lists and skipping the surplus. The switching trick does it by construction: give each pointer the same total journey, `a + c + b` one way and `b + c + a` the other, and they cannot help arriving together. What makes the switching version pleasant is that it needs no lengths, no subtraction and no branch — and what makes it worth measuring rather than admiring is that its second lap only ever happens when the lists differ in length, so on equal-length input it quietly reduces to the plain lockstep walk that would have worked anyway. The related habit is one this topic has now rewarded repeatedly: when an approach fails, find out whether it fails occasionally or structurally, because a 4.5% failure rate and a 99.2% one call for completely different responses.

<!-- @approach -->
### Optimal - Switch Heads at the End

<!-- @idea -->
Give both pointers the same total journey by sending each one down the other list when it runs out.

<!-- @steps -->
1. Start one pointer on each head.
2. While the two pointers differ, advance both.
3. Advance a pointer to its `next`, unless it is null — in which case send it to the *other* list's head instead.
4. Stop when the pointers are equal.
5. Return that node — it is the intersection, or null if the lists never meet.

<!-- @complexity -->
- time: O(a + b + c) — exactly `a + b + c + 1` steps when the lengths differ, and `a` when they match
- space: **O(1)** — two pointers
- note: The one to write: no lengths, no subtraction, no branch on which list is longer. Verified to terminate and answer correctly on all **17,575** shapes with `a`, `b`, `c` from 0 to 25, including every no-intersection case. On equal-length lists it reads a third as many pointers as the length-difference method — 200,000 against 600,000 — because it never needs to measure anything.

<!-- @code cpp -->
```cpp
Node* getIntersection(Node* headA, Node* headB) {
    Node* p = headA;
    Node* q = headB;
    while (p != q) {
        p = (p != nullptr) ? p->next : headB;
        q = (q != nullptr) ? q->next : headA;
    }
    return p;
}
```

<!-- @annotations -->
- 4: Comparing **addresses**, not `p->data`. Two different nodes holding equal values are not an intersection, and the shared tail means the real answer is always the same node object.
- 5: The switch is what equalises the journeys: `a + c + b` starting from A against `b + c + a` starting from B.
- 6: Both pointers switch, and each goes to the **other** list's head. Sending a pointer back to its own head loops forever.
- 8: Returns null when the lists never meet, because both pointers reach null on the same step and the loop condition ends.

<!-- @code java -->
```java
static Node getIntersection(Node headA, Node headB) {
    Node p = headA;
    Node q = headB;
    while (p != q) {
        p = (p != null) ? p.next : headB;
        q = (q != null) ? q.next : headA;
    }
    return p;
}
```

<!-- @annotations -->
- 4: `!=` on references is exactly right here. Using `.equals` would compare contents and reintroduce the bug this algorithm exists to avoid.

<!-- @code python -->
```python
def get_intersection(head_a, head_b):
    p, q = head_a, head_b
    while p is not q:
        p = p.next if p is not None else head_b
        q = q.next if q is not None else head_a
    return p


# `is not`, not `!=`. Identity is the question -- and when the lists
# do not meet, both pointers reach None on the same step, so the loop
# ends with p is q is None, which is the correct answer.
```

<!-- @annotations -->
- 3: `is not` compares identity. `!=` would call `__eq__` and could stop at two distinct nodes that merely hold equal data.

<!-- @approach -->
### Align by Length Difference

<!-- @idea -->
Measure both lists, skip the surplus at the front of the longer one, then walk in step.

<!-- @steps -->
1. Walk each list once to find its length.
2. Advance the head of the longer list by the difference in lengths.
3. Both pointers are now the same distance from the end.
4. Advance both one node at a time until they are equal.
5. Return that node, or null if both reach the end without meeting.

<!-- @complexity -->
- time: O(a + b + c) — two measuring passes plus one aligned walk
- space: **O(1)** — two pointers and two counters
- note: The version that makes the alignment idea explicit, which is its real value — the surplus is computed and skipped where the switching trick hides the same effect in its second lap. It reads exactly as many pointers as the switching version when the lists differ in length, and **three times** as many when they match, because it measures both lists whether or not it needs to. Measured 408.68us against 97.23us on equal-length input.

<!-- @code cpp -->
```cpp
Node* getIntersectionByLength(Node* headA, Node* headB) {
    long lenA = 0, lenB = 0;
    for (Node* p = headA; p != nullptr; p = p->next) lenA++;
    for (Node* p = headB; p != nullptr; p = p->next) lenB++;

    Node* a = headA;
    Node* b = headB;
    while (lenA > lenB) { a = a->next; lenA--; }
    while (lenB > lenA) { b = b->next; lenB--; }

    while (a != b) { a = a->next; b = b->next; }
    return a;
}
```

<!-- @annotations -->
- 8: Only one of these two loops ever runs, so no branch on which list is longer is needed — the conditions are mutually exclusive.
- 11: Safe without a null check because both pointers are now equidistant from the end: if they never meet they reach null on the same step and the loop exits with `a == b == nullptr`.
- 3: Two full traversals spent purely on measurement, which is what makes this version lose on equal-length input where no alignment was needed.

<!-- @code java -->
```java
static Node getIntersectionByLength(Node headA, Node headB) {
    long lenA = 0, lenB = 0;
    for (Node p = headA; p != null; p = p.next) lenA++;
    for (Node p = headB; p != null; p = p.next) lenB++;

    Node a = headA, b = headB;
    while (lenA > lenB) { a = a.next; lenA--; }
    while (lenB > lenA) { b = b.next; lenB--; }

    while (a != b) { a = a.next; b = b.next; }
    return a;
}
```

<!-- @annotations -->
- 6: Both pointers start at their own heads; the skipping below moves only the one belonging to the longer list.

<!-- @code python -->
```python
def get_intersection_by_length(head_a, head_b):
    len_a = len_b = 0
    p = head_a
    while p is not None:
        len_a += 1
        p = p.next
    p = head_b
    while p is not None:
        len_b += 1
        p = p.next

    a, b = head_a, head_b
    while len_a > len_b:
        a = a.next
        len_a -= 1
    while len_b > len_a:
        b = b.next
        len_b -= 1

    while a is not b:
        a = a.next
        b = b.next
    return a
```

<!-- @annotations -->
- 20: Identity again. The alignment above is what makes this comparison meaningful — without it, lockstep is wrong on 99.2% of unequal-length inputs.

<!-- @approach -->
### Hash Set of Node Addresses

<!-- @idea -->
Record every node of the first list, then walk the second and stop at the first address already seen.

<!-- @steps -->
1. Walk the first list, inserting each node's address into a set.
2. Walk the second list from its head.
3. Return the first node whose address is already in the set.
4. Return null if the second list ends without a hit.

<!-- @complexity -->
- time: O(a + b + c) expected, dominated by hashing and allocation
- space: **O(a + c)** — one entry per node of the first list
- note: Needs no alignment reasoning at all, which is a real virtue when you are unsure — the set makes "same node" directly testable. It is also **far** the slowest: 18,534us against the switching version's 97.23us on equal-length input, roughly 190x, and it is the only approach here needing memory proportional to the input. The same pattern the loop subtopics measured: hashing costs more than walking.

<!-- @code cpp -->
```cpp
#include <unordered_set>
using namespace std;

Node* getIntersectionBySet(Node* headA, Node* headB) {
    unordered_set<Node*> seen;
    for (Node* p = headA; p != nullptr; p = p->next) seen.insert(p);
    for (Node* p = headB; p != nullptr; p = p->next) {
        if (seen.count(p)) return p;
    }
    return nullptr;
}
```

<!-- @annotations -->
- 6: Storing the **pointer**, which is what makes this test identity rather than equality — storing `p->data` would find the first repeated value instead.
- 8: The first hit is the intersection, because the lists share a tail: once they meet they never separate.

<!-- @code java -->
```java
static Node getIntersectionBySet(Node headA, Node headB) {
    Set<Node> seen = Collections.newSetFromMap(new IdentityHashMap<>());
    for (Node p = headA; p != null; p = p.next) seen.add(p);
    for (Node p = headB; p != null; p = p.next) {
        if (seen.contains(p)) return p;
    }
    return null;
}
```

<!-- @annotations -->
- 2: `IdentityHashMap`, deliberately. A plain `HashSet` uses `hashCode` and `equals`, so a node type with value equality would report the first matching **value** as the intersection.

<!-- @code python -->
```python
def get_intersection_by_set(head_a, head_b):
    seen = set()
    p = head_a
    while p is not None:
        seen.add(id(p))
        p = p.next
    p = head_b
    while p is not None:
        if id(p) in seen:
            return p
        p = p.next
    return None


# `id(p)` sidesteps any __eq__ or __hash__ the node class defines,
# and is safe because every node stays alive throughout the walk.
```

<!-- @annotations -->
- 5: Keying on `id` rather than the node itself, so a class defining equality by value cannot turn this into a value search.

<!-- @example -->

<!-- @input -->
List A = `a0 a1 a2` then shared `c0 c1`; list B = `b0 b1` then the same `c0 c1`

<!-- @output -->
`c0`

<!-- @why -->
The switching trick traced on unequal lengths, showing the journeys equalise.

<!-- @walkthrough -->
1. Here `a = 3`, `b = 2` and `c = 2`, so A has 5 nodes and B has 4.
2. The pointer starting on A walks `a0 a1 a2 c0 c1`, reaches null, and switches to B's head.
3. The pointer starting on B walks `b0 b1 c0 c1`, reaches null one step earlier, and switches to A's head.
4. From B's head the first pointer now walks `b0 b1` and arrives at `c0` having travelled `a + c + b = 3 + 2 + 2 = 7`.
5. From A's head the second pointer walks `a0 a1 a2` and arrives at `c0` having travelled `b + c + a = 2 + 2 + 3 = 7`.
6. Equal totals, so they arrive on the same step and the loop stops at `c0`.
7. Measured, this shape takes `a + b + c + 1 = 8` steps of the loop, matching the formula verified across all 28,830 unequal-length shapes tested.

<!-- @example -->

<!-- @input -->
Two lists of the same length that share a tail

<!-- @output -->
Found in exactly `a` steps, with no switch ever happening

<!-- @why -->
The case where the celebrated trick quietly does nothing, and the reason its cost table has two rows.

<!-- @walkthrough -->
1. When `a == b`, both pointers are the same distance from the end from the very start.
2. They therefore reach the shared tail on the same step and meet at the join.
3. Neither pointer ever runs off the end, so the switching branch never executes.
4. Measured across every equal-length shape with `a` up to 30: exactly `a` steps, 960 out of 960.
5. That is the plain lockstep walk — the one that is wrong on unequal lists — behaving correctly because the alignment happened to be free.
6. It also explains the pointer counts: 200,000 for switching against 600,000 for the length-difference method at `a = b = c = 100,000`.
7. The length method spends two full traversals measuring lists whose lengths turn out to be equal, and then skips nothing.

<!-- @example -->

<!-- @input -->
Walking both lists in lockstep from their heads and comparing

<!-- @output -->
Wrong on 4.5% of equal-length inputs and 99.2% of unequal-length ones

<!-- @why -->
Separates a bug that is occasionally unlucky from one that is structurally wrong, which need different responses.

<!-- @walkthrough -->
1. On equal-length lists this compares nodes that really are equidistant from the end, so it is nearly correct.
2. It still fails 4.5% of the time, when two distinct nodes hold the same value before the real join — the failure people anticipate.
3. On unequal-length lists it compares position `k` of one list against position `k` of the other.
4. Those are different distances from the intersection, so the comparison is not asking the right question at all.
5. Measured over 20,000 random unequal-length shapes: wrong **19,839** times.
6. Switching to address comparison does not help — correctly comparing misaligned nodes still answers the wrong question.
7. That is why both real algorithms are alignment techniques first and comparisons second.

<!-- @example -->

<!-- @input -->
Two lists that never meet

<!-- @output -->
Null, with the loop terminating on its own

<!-- @why -->
The case most likely to be assumed rather than checked, since the algorithm has no explicit test for it.

<!-- @walkthrough -->
1. With `c = 0` there is no shared node, so the pointers can never be equal at a real node.
2. The pointer from A travels `a` then switches and travels `b`, reaching null after `a + b` moves.
3. The pointer from B travels `b` then switches and travels `a`, reaching null after the same `a + b`.
4. Both are null on the same step, `p != q` becomes false, and the loop exits returning null.
5. Without the switch they would reach null at different times and the comparison would never fire — this is the same alignment argument as the intersecting case.
6. Verified on every shape with `c = 0` inside the 17,575 tested: terminated every time, returned null every time.
7. Measured, `a = 10` and `b = 3` takes 14 steps — `a + b + 1`, the same formula with `c = 0`.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the Y properly: two separate arms meeting at a junction node and one shared tail running right from it, with the three counts `a`, `b` and `c` written as measured spans beneath their segments — every result here is a function of those three, so they should be on screen throughout. Colour the shared tail distinctly from both arms, because the fact that it is *one* chain rather than two equal-looking ones is the thing beginners misread. Open with the failure: run two markers from the two heads in lockstep on arms of different lengths, and draw a vertical tie-line between the two nodes being compared at each step so the reader sees them sitting at different distances from the junction — the tie-line visibly not spanning the junction symmetrically. Print the verdict beneath: wrong on 99.2% of unequal-length inputs. Then the switching trick on the same figure. Give each marker a distance counter that keeps running as it moves, and when a marker falls off the end, draw it jumping to the other arm's head with the counter **not** resetting. The moment both counters read `a + b + c` they land together on the junction — the two counters showing the same number is the proof, and it should be the most legible thing in the frame. Then the case that surprises people: replay with `a == b`, where the two markers advance side by side, the switch never fires, and they meet after `a` steps — captioned that the trick's second lap only happens when the lengths differ. Close with the no-intersection case, `c = 0`, where both markers step off the end onto null on the same beat, and the cost bars for the three approaches with the equal-length and unequal-length shapes side by side, since the switching version's advantage is threefold in one and level in the other.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"notation":{"a":"nodes private to list A","b":"nodes private to list B","c":"nodes shared by both","note":"c = 0 means the lists never meet; every result here is indexed by these three"},"twoThingsFirst":["the answer is a NODE identified by address, not by value","the shared tail is shared -- once the lists meet they never separate, because each node has exactly one next"],"whyLockstepFails":{"attempt":"walk both lists together from their heads and stop where they agree","measured":[{"input":"equal-length lists","wrong":892,"of":20000,"rate":"4.5%"},{"input":"unequal-length lists","wrong":19839,"of":20000,"rate":"99.2%"}],"theExpectedFailure":"the 4.5% -- two different nodes holding the same value before the real intersection","theRealFailure":"the 99.2% -- with different lengths, position k of one list is a DIFFERENT distance from the junction than position k of the other, so the comparison is meaningless before it is unlucky","addressComparisonDoesNotHelp":"correctly comparing misaligned nodes still answers the wrong question","consequence":"both real algorithms are ALIGNMENT techniques first and comparisons second","byAlphabet":[{"distinctValues":2,"wrongRate":"93.2%"},{"distinctValues":4,"wrongRate":"89.1%"},{"distinctValues":10,"wrongRate":"86.9%"},{"distinctValues":100,"wrongRate":"87.2%"}]},"switchingTrick":{"rule":"when a pointer runs off the end, restart it at the OTHER list's head","whyItWorks":"a pointer from A travels a + c + b; a pointer from B travels b + c + a -- the same number, so they arrive together","noIntersectionCase":"both reach null after a + b moves and the loop ends with p == q == null","terminationVerified":{"shapes":17575,"range":"a, b, c each 0..25","failedToTerminate":0,"wrongAnswers":0}},"stepFormula":{"verifiedOn":"every shape with a, b, c from 0 to 30","rows":[{"case":"a == b","steps":"exactly a","matched":"960/960","meaning":"the pointers NEVER switch -- they walk side by side and meet, or reach null together"},{"case":"a != b","steps":"exactly a + b + c + 1","matched":"28830/28830"}],"insight":"the famous second lap only happens when the lengths differ, which is also the only case that needed fixing"},"dereferences":{"rows":[{"a":100000,"b":100000,"c":100000,"switching":200000,"lengthDiff":600000},{"a":200000,"b":200000,"c":1,"switching":400000,"lengthDiff":800002},{"a":1,"b":1,"c":200000,"switching":2,"lengthDiff":400004},{"a":150000,"b":50000,"c":50000,"switching":500000,"lengthDiff":500000}],"reading":"on equal-length lists switching reads a third as many, because the length method measures both lists whether or not it needs to; on unequal lists the two are exactly level"},"benchCpp":{"unit":"microseconds, median of 15","rows":[{"shape":"a=b=c=100,000","switching":97.23,"lengthDiff":408.68,"hashSet":18534.61},{"shape":"a=150k b=50k c=50k","switching":316.15,"lengthDiff":437.77,"hashSet":18284.92}]},"benchPython":{"unit":"microseconds, median of 7, two runs","rows":[{"shape":"a=b=c=100,000","switching":2594.3,"lengthDiff":9966.4,"setOfIds":24059.8},{"shape":"a=150k b=50k c=50k","switching":6811.3,"lengthDiff":9834.6,"setOfIds":20752.5}]},"correctness":{"approaches":["switching","length-difference","hash set"],"cppShapes":9260,"cppRange":"a, b, c each 0..20","pythonShapes":4095,"pythonRange":"a, b, c each 0..15","disagreements":0},"hashSetNote":"needs no alignment reasoning at all, which is a real virtue when unsure -- and runs roughly 190x slower while using O(a + c) memory","recommendation":"switch heads at the end -- no lengths, no subtraction, no branch on which list is longer","lesson":"when an approach fails, find out whether it fails occasionally or structurally: 4.5% and 99.2% call for completely different responses"}
```

<!-- @highlights -->
- The Y is drawn properly — two arms meeting at a junction with one shared tail running right from it.
- The counts `a`, `b` and `c` are written as measured spans beneath their segments and stay on screen throughout.
- The shared tail is coloured distinctly from both arms, since reading it as two parallel chains is the common misconception.
- The opening runs the failure: two markers in lockstep from the heads on arms of different lengths.
- A vertical tie-line joins the two nodes being compared at each step.
- That tie-line visibly fails to span the junction symmetrically, showing the nodes sit at different distances from it.
- The verdict is printed beneath: wrong on 99.2% of unequal-length inputs.
- The switching trick then runs on the same figure, each marker carrying a running distance counter.
- When a marker falls off the end it jumps to the other arm's head with its counter **not** resetting.
- Both counters reach `a + b + c` and the markers land together on the junction.
- The two counters showing the same number is the proof, and is the most legible thing in the frame.
- A replay with `a == b` shows the markers advancing side by side and the switch never firing.
- They meet after `a` steps, captioned that the second lap only happens when the lengths differ.
- The no-intersection case follows, with both markers stepping onto null on the same beat.
- The close puts cost bars for the three approaches with equal-length and unequal-length shapes side by side.
- That pairing shows the switching version's advantage as threefold in one shape and level in the other.

<!-- @edgeCases -->
- Lists that never meet — both pointers reach null on the same step and the loop returns null with no special case.
- One list empty — its pointer starts null and switches immediately; the answer is null unless the other list is also empty.
- Both lists empty — the loop condition is false at once and null is returned.
- The two heads already identical — zero steps, since the lists are the same list.
- Equal-length lists — the switch never fires and the walk takes exactly `a` steps.
- One list much longer than the other — the case the alignment exists for, and where naive lockstep is 99.2% wrong.
- An intersection at the very first node of one list — that list is entirely shared, and `a` or `b` is zero.
- An intersection at the last node — `c = 1`, the smallest possible shared tail.
- Two lists with identical values but no shared node — the case that defeats value comparison and is handled correctly by identity.
- Nodes whose type defines equality by value — identity comparison is mandatory; `.equals` or `==` in Python would break it.
- A list containing a loop — none of these approaches is safe on cyclic input; detect that separately first.

<!-- @pitfalls -->
- Walking both lists in lockstep from the heads. Wrong on 99.2% of unequal-length inputs — not a duplicate-value problem but an alignment one.
- Comparing `p->data` instead of `p`. Two distinct nodes holding equal values are not an intersection.
- Using `!=` in Python or `.equals` in Java for the comparison. Both compare contents; identity is the question.
- Sending a pointer back to its **own** head when it runs off the end. The journeys never equalise and the loop never terminates.
- Assuming the no-intersection case needs a special check. Both pointers reach null on the same step, which ends the loop correctly.
- Adding a null guard inside the aligned walk of the length-difference version. Once aligned, both pointers reach null together, so it cannot dereference null.
- Branching on which list is longer in the length-difference version. The two skip loops are mutually exclusive, so only one ever runs.
- Reaching for the hash set by default. It is roughly 190x slower and the only approach needing O(a + c) memory.
- Using a plain `HashSet` in Java for the set version. It compares by `equals`, turning an identity search into a value search.
- Assuming the switching trick always takes two laps. On equal-length lists it never switches and finishes in `a` steps.
- Running any of these on a list that might contain a loop. None of them terminate on cyclic input.

<!-- @doubt -->
### Why can't I just walk both lists together and compare?

<!-- @answer -->
Because the two walks are not comparing corresponding nodes. Two lists that share a tail are aligned at the **end**, not the beginning, so position 3 of a five-node list and position 3 of a four-node list sit at different distances from the junction. Comparing them is not unlucky, it is meaningless. The measurements separate the two failure modes cleanly: on **equal-length** lists the naive walk is wrong 4.5% of the time — those are the duplicate-value collisions people expect — while on **unequal-length** lists it is wrong **99.2%** of the time, 19,839 out of 20,000 random shapes. Switching from value comparison to address comparison does not fix it either, since correctly comparing the wrong pair of nodes still answers the wrong question. This is why both real algorithms spend their effort on **alignment** and treat the comparison as the easy part.

<!-- @doubt -->
### Why does switching heads make them meet?

<!-- @answer -->
Because it gives both pointers the same total distance to travel. A pointer starting on A covers A's private nodes and the shared tail, `a + c`, then switches and covers B's private nodes, `b` — a total of `a + c + b`. A pointer starting on B covers `b + c` then `a`, which is `b + c + a`. Those are the same number, so both arrive at the junction on the same step and the loop stops there. The no-intersection case falls out of the same argument: with no shared tail, one pointer covers `a` then `b` and the other covers `b` then `a`, so they reach null together and the loop ends with both null, which is the correct answer. That was verified rather than assumed — across **17,575** shapes with `a`, `b` and `c` each from 0 to 25, it terminated and answered correctly every time.

<!-- @doubt -->
### How many steps does it actually take?

<!-- @answer -->
Exactly `a + b + c + 1` when the lists have different lengths, and exactly `a` when they do not — both verified across every shape with `a`, `b`, `c` from 0 to 30, matching on 28,830 and 960 cases respectively. The second row is the one worth knowing. When the two lists are the same length the pointers are already equidistant from the end, so neither ever runs off, the switch never fires, and the algorithm quietly reduces to the plain lockstep walk. That is the same walk that is wrong on unequal input — it works here because the alignment happened to be free. So the famous "second lap" is not a general cost but a repair that only runs when there is something to repair, which is also why the switching version reads a third as many pointers as the length-difference method on equal-length lists: 200,000 against 600,000.

<!-- @doubt -->
### Is measuring the lengths simpler?

<!-- @answer -->
It is more explicit, and that is a real argument for it. The length-difference version computes the surplus and skips it, so the alignment is a visible step rather than an emergent property of two equal journeys — easier to explain, and easier to convince yourself of. The costs are close but not equal. On lists of **different** lengths the two read exactly the same number of pointers, 500,000 each on a representative shape, and the switching version was modestly faster: 316.15us against 437.77us. On lists of the **same** length the length method loses badly, reading 600,000 pointers against 200,000 and timing 408.68us against 97.23us, because it spends two full traversals measuring lists it then does not need to skip anything on. Either is defensible; the switching version has no lengths, no subtraction and no branch, which is why it is the one to reach for.

<!-- @doubt -->
### Should I use a hash set instead?

<!-- @answer -->
Only if you want to avoid the reasoning entirely, which is occasionally the right call. Its appeal is that it makes "same node" directly testable — insert every node of one list, then walk the other and stop at the first address you have seen — with no alignment argument to get wrong. The price is steep: roughly **190x** slower than the switching version on equal-length input, 18,534us against 97.23us, and it is the only approach here that needs memory proportional to the input, `O(a + c)`. That is the same result the loop subtopics measured repeatedly, for the same reason: hashing and allocating cost far more than walking. One genuine caution if you do use it — key the set on the node **address**, not the node object, unless you are certain the type does not define equality by value. In Java that means `IdentityHashMap`; in Python it means `id(p)`.

<!-- @doubt -->
### What if one of the lists has a loop?

<!-- @answer -->
None of these work, and none of them fail safely. The switching version relies on each pointer eventually reaching null so it can switch; inside a loop it never does, and the two pointers circle indefinitely without the loop condition ever becoming false. The length-difference version hangs on its first counting pass for the same reason. The hash-set version is the only one that terminates, and it gives a wrong answer rather than an error — it will report the loop's entry node as an "intersection" if both lists reach it. So a cyclic list is not an edge case this problem handles; it is input this problem does not accept. If the input might be cyclic, run **Detect a loop in LL** on each list first — it is O(1) space and one pass — and decide what a Y-with-a-loop is supposed to mean before writing anything that assumes it cannot happen.
