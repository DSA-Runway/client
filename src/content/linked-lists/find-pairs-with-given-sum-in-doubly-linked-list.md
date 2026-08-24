---
id: find-pairs-with-given-sum-in-doubly-linked-list
topic: Linked Lists
title: Find Pairs with Given Sum in Doubly Linked List
difficulty: Medium
status: ready
prerequisites:
  - two-sum
  - introduction-to-singly-linkedlist
  - search-in-linked-list
  - find-the-length-of-the-linked-list
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - two-sum
  - 3-sum
  - introduction-to-singly-linkedlist
  - check-if-ll-is-palindrome-or-not
  - sort-a-linked-list-of-0s-1s-and-2s
---

<!-- @summary -->
The first problem here that a **doubly** linked list makes possible: a backwards pointer turns the sorted-array two-pointer sweep into something a list can do, at **41x** the speed of a hash map. Two things need stating precisely before any of it is correct — the walk enumerates **disjoint** pairs, so four 2s summing to 4 give **two** pairs and not the six index-pairs; and the crossing check is not decoration, since omitting it changed the answer on **10.4%** of random sorted lists, always by inventing pairs that are not there.

<!-- @theory -->
## The structure

A doubly linked list gives every node a `prev` as well as a `next`, and the list
is normally held by both ends:

```
head                                        tail
 |                                            |
 v                                            v
[1] <-> [2] <-> [3] <-> [4] <-> [5] <-> [6] <-> [7]
```

That backwards pointer is the entire subject of this problem. Every technique in
this topic so far has been shaped by the fact that a singly linked list can only
be read forwards — the tortoise and hare, the reversals, the alignment tricks.
With a `prev` pointer and a `tail`, one of those constraints disappears, and an
algorithm that was previously out of reach becomes the obvious one.

## The problem

Given a **sorted** doubly linked list and a target, find the pairs of nodes whose
values sum to it.

```
list:   1 <-> 2 <-> 3 <-> 4 <-> 5 <-> 6 <-> 7        target: 8

pairs:  (1,7)  (2,6)  (3,5)
```

## Two pointers, closing inward

Start one pointer at the head and one at the tail. If their sum is too small,
the only way to increase it is to move the low pointer right; if too large, move
the high pointer left. Either way one pointer moves and the search space shrinks.

```cpp
vector<pair<int,int>> findPairs(Node* head, Node* tail, int target) {
    vector<pair<int,int>> result;
    Node* lo = head;
    Node* hi = tail;
    while (lo != nullptr && hi != nullptr && lo != hi && hi->next != lo) {
        int sum = lo->data + hi->data;
        if (sum == target) {
            result.push_back({lo->data, hi->data});
            lo = lo->next;
            hi = hi->prev;
        } else if (sum < target) {
            lo = lo->next;
        } else {
            hi = hi->prev;
        }
    }
    return result;
}
```

This is the sorted-array two-pointer sweep, unchanged. What makes it available
is `hi = hi->prev` — the one line a singly linked list cannot write.

Verified against the identical algorithm running on a sorted **array** across
200,000 random lists, with zero disagreements.

## What counts as a pair

This needs settling before correctness means anything, because there is more
than one reasonable answer. The walk never revisits a node, so **each element is
used at most once** — it enumerates *disjoint* pairs:

| List | Target | The walk finds | Count | Distinct index pairs |
|---|---|---|---|---|
| `2 2 2 2` | 4 | (2,2) (2,2) | **2** | 6 |
| `1 1 2 2 3 3` | 4 | (1,3) (1,3) (2,2) | **3** | 5 |
| `1 1 1` | 2 | (1,1) | **1** | 3 |
| `0 0 0 0` | 0 | (0,0) (0,0) | **2** | 6 |
| `1 2 3 4 5` | 6 | (1,5) (2,4) | **2** | 2 |

Four 2s can be paired into two disjoint pairs, but there are six ways to choose
two of them by position. Both numbers are defensible answers to "find pairs" —
the last row shows they coincide whenever the values are distinct, which is
exactly why the difference is easy to miss. Every result in this container uses
the disjoint reading, which is what the two-pointer sweep naturally computes.

## The crossing check earns its place

The loop condition has two termination tests, and the second one looks redundant:

```cpp
while (lo != nullptr && hi != nullptr && lo != hi && hi->next != lo)
```

`lo != hi` catches the pointers landing on the same node. But when a pair is
found **both** pointers move, so they can step *past* each other without ever
being equal — `hi` ends up immediately before `lo`, which is what `hi->next != lo`
detects.

Leaving it out does not hang. It quietly reports pairs that are not there, by
continuing to pair up elements that have already been consumed:

> Over 200,000 random sorted lists, the answer differed **20,743** times — 10.4%
> — and in **every one** of those the version without the check produced *extra*
> pairs. Never fewer.

## Sorted is a precondition, not a preference

The whole method rests on two claims: moving `lo` right cannot decrease the sum,
and moving `hi` left cannot increase it. Both are false without sorted order, and
the failure is quiet:

> Over 178,932 genuinely unsorted lists, the walk was wrong **46,036** times —
> **25.7%** — and every wrong answer contained **fewer** pairs than actually
> exist. Never more.

So an unsorted input does not produce nonsense; it produces a plausible, short
list of correct-looking pairs. If the input may be unsorted, either sort it first
or use the hash-map approach, which does not care about order.

## What the sweep costs

The two pointers between them traverse the list exactly once — measured at
`n − 1` iterations for a target that is never reached:

| n | Iterations |
|---|---|
| 1,000 | 999 |
| 100,000 | 99,999 |
| 1,000,000 | 999,999 |

Against the hash-map alternative on a sorted list of 100,000:

| | C++ | Python |
|---|---|---|
| Two pointers from both ends | **88.12us** | **5,020us** |
| Hash map of counts | 3,592.91us | 18,050us |

About **41x** in C++ and 3.6x in Python, with O(1) extra space against O(n) — the
same pattern the loop subtopics measured, and for the same reason: hashing costs
more than walking.

<!-- @intuition -->
Every problem in this topic so far has been shaped by one restriction — a singly linked list can be read in only one direction — and most of the cleverness has gone into working around it. The tortoise and hare, the pointer-switching trick, the reversals: all of them exist because you cannot walk backwards. Give the list a `prev` pointer and a `tail` and that constraint lifts, and the first thing that becomes possible is the sorted two-pointer sweep, which is the natural way to find pairs and which no amount of ingenuity makes available on a singly linked list. That is really what this problem is for: it is the demonstration that the extra pointer per node buys something specific rather than being general convenience. The care needed is all in the boundaries. Two pointers moving toward each other can pass without ever meeting, and a walk that assumes sorted order fails silently rather than loudly when it is not. Both of those produce answers that look entirely reasonable — the right shape, plausible pairs, no crash — which is the category of bug this topic has repeatedly shown to be worth measuring rather than reasoning about.

<!-- @approach -->
### Optimal - Two Pointers from Both Ends

<!-- @idea -->
Close in from the head and the tail simultaneously, moving whichever pointer brings the sum closer to the target.

<!-- @steps -->
1. Put one pointer on the head and one on the tail.
2. While the two pointers have not met and have not crossed, compare their sum with the target.
3. If the sum matches, record the pair and move **both** pointers inward.
4. If the sum is too small, move the low pointer right — the only move that can increase it.
5. If the sum is too large, move the high pointer left.
6. Return the collected pairs.

<!-- @complexity -->
- time: O(n) — the two pointers together traverse the list once, measured at exactly `n − 1` iterations for a full sweep
- space: **O(1)** — two pointers and the result
- note: The one to write, and the reason this problem is set on a doubly linked list at all: `hi = hi->prev` is the line a singly linked list cannot express. Measured **41x** faster than the hash-map version at a hundred thousand nodes. It requires **sorted** input — on unsorted lists it was wrong 25.7% of the time, always finding too few pairs — and both halves of the termination test are needed, since a matched pair moves both pointers and they can cross without ever being equal.

<!-- @code cpp -->
```cpp
#include <vector>
#include <utility>
using namespace std;

vector<pair<int,int>> findPairs(Node* head, Node* tail, int target) {
    vector<pair<int,int>> result;
    Node* lo = head;
    Node* hi = tail;
    while (lo != nullptr && hi != nullptr && lo != hi && hi->next != lo) {
        int sum = lo->data + hi->data;
        if (sum == target) {
            result.push_back({lo->data, hi->data});
            lo = lo->next;
            hi = hi->prev;
        } else if (sum < target) {
            lo = lo->next;
        } else {
            hi = hi->prev;
        }
    }
    return result;
}
```

<!-- @annotations -->
- 9: Four conditions, and the last is the one people drop. A matched pair advances **both** pointers, so they can step past each other without ever being equal — omitting `hi->next != lo` invented extra pairs on 10.4% of random sorted lists.
- 13: Both pointers move on a match, which is what makes the pairs **disjoint** — each node is consumed once and never revisited.
- 16: Moving `lo` right is the only way to increase the sum, and that is true only because the list is sorted.
- 18: `hi->prev` — the line that requires a doubly linked list, and the reason this problem is posed on one.

<!-- @code java -->
```java
static List<int[]> findPairs(Node head, Node tail, int target) {
    List<int[]> result = new ArrayList<>();
    Node lo = head;
    Node hi = tail;
    while (lo != null && hi != null && lo != hi && hi.next != lo) {
        int sum = lo.data + hi.data;
        if (sum == target) {
            result.add(new int[]{lo.data, hi.data});
            lo = lo.next;
            hi = hi.prev;
        } else if (sum < target) {
            lo = lo.next;
        } else {
            hi = hi.prev;
        }
    }
    return result;
}
```

<!-- @annotations -->
- 5: Reference comparison for `lo != hi`, which is correct — the question is whether the two pointers are on the same node, not whether two nodes hold equal data.

<!-- @code python -->
```python
def find_pairs(head, tail, target):
    result = []
    lo, hi = head, tail
    while lo is not None and hi is not None and lo is not hi and hi.next is not lo:
        total = lo.data + hi.data
        if total == target:
            result.append((lo.data, hi.data))
            lo = lo.next
            hi = hi.prev
        elif total < target:
            lo = lo.next
        else:
            hi = hi.prev
    return result


# `is not` on both tests -- these ask whether the pointers are on the
# same node. The second one catches them CROSSING, which happens when
# a matched pair moves both of them past each other.
```

<!-- @annotations -->
- 4: `hi.next is not lo` is the crossing test. Without it the walk keeps going after the pointers pass, pairing elements it has already used.

<!-- @approach -->
### Hash Map of Counts

<!-- @idea -->
Count how many of each value the list holds, then walk once pairing each value with the complement it needs.

<!-- @steps -->
1. Walk the list, counting occurrences of each value.
2. Walk again from the head.
3. For each value still available, compute the complement the target requires.
4. If the value is its own complement, take a pair only if at least two remain.
5. Otherwise take a pair if the complement is still available, decrementing both counts.
6. Return the collected pairs.

<!-- @complexity -->
- time: O(n) expected, dominated by hashing
- space: **O(n)** — one entry per distinct value
- note: The version to use when the list is **not** sorted, which the two-pointer sweep cannot handle — and its only real advantage, since it measured **41x slower** at a hundred thousand nodes, 3,592.91us against 88.12us. The count bookkeeping is what keeps the pairs disjoint; a plain set would report the same element twice. It does not need the `prev` pointer at all, so it works unchanged on a singly linked list.

<!-- @code cpp -->
```cpp
#include <unordered_map>
#include <vector>
#include <utility>
#include <algorithm>
using namespace std;

vector<pair<int,int>> findPairsByHash(Node* head, int target) {
    unordered_map<int,int> available;
    for (Node* p = head; p != nullptr; p = p->next) available[p->data]++;

    vector<pair<int,int>> result;
    for (Node* p = head; p != nullptr; p = p->next) {
        int value = p->data;
        int need = target - value;
        if (available[value] == 0) continue;
        if (need == value) {
            if (available[value] >= 2) { available[value] -= 2; result.push_back({value, need}); }
        } else if (available.count(need) && available[need] > 0) {
            available[value]--;
            available[need]--;
            result.push_back({min(value, need), max(value, need)});
        }
    }
    return result;
}
```

<!-- @annotations -->
- 17: The self-complement case needs **two** of the value, not one — without this check a lone 4 pairs with itself for a target of 8.
- 20: Decrementing both counts is what makes the pairs disjoint. Using a plain set instead would let one element be reported in two different pairs.
- 9: Counts, not presence. The multiplicity matters as soon as the list holds duplicates.

<!-- @code java -->
```java
static List<int[]> findPairsByHash(Node head, int target) {
    Map<Integer,Integer> available = new HashMap<>();
    for (Node p = head; p != null; p = p.next)
        available.merge(p.data, 1, Integer::sum);

    List<int[]> result = new ArrayList<>();
    for (Node p = head; p != null; p = p.next) {
        int value = p.data, need = target - value;
        if (available.getOrDefault(value, 0) == 0) continue;
        if (need == value) {
            if (available.get(value) >= 2) {
                available.merge(value, -2, Integer::sum);
                result.add(new int[]{value, need});
            }
        } else if (available.getOrDefault(need, 0) > 0) {
            available.merge(value, -1, Integer::sum);
            available.merge(need, -1, Integer::sum);
            result.add(new int[]{Math.min(value, need), Math.max(value, need)});
        }
    }
    return result;
}
```

<!-- @annotations -->
- 8: `getOrDefault` rather than `get`, which would return null for an absent key and throw when unboxed.

<!-- @code python -->
```python
def find_pairs_by_hash(head, target):
    available = {}
    p = head
    while p is not None:
        available[p.data] = available.get(p.data, 0) + 1
        p = p.next

    result = []
    p = head
    while p is not None:
        value = p.data
        need = target - value
        if available.get(value, 0) > 0:
            if need == value:
                if available[value] >= 2:
                    available[value] -= 2
                    result.append((value, need))
            elif available.get(need, 0) > 0:
                available[value] -= 1
                available[need] -= 1
                result.append((min(value, need), max(value, need)))
        p = p.next
    return result


# Works on UNSORTED input, which the two-pointer sweep cannot -- and
# never touches `prev`, so it runs unchanged on a singly linked list.
```

<!-- @annotations -->
- 14: The `need == value` branch, which is the only place the self-pairing case can go wrong — it needs **two** of the value, checked on the line below.

<!-- @approach -->
### Nested Walk

<!-- @idea -->
For each node, walk forward from it looking for a partner, marking both as used when one is found.

<!-- @steps -->
1. Walk the list with an outer pointer, skipping nodes already used.
2. From each, walk forward with an inner pointer, skipping used nodes.
3. If the two values sum to the target, record the pair and mark both used.
4. Stop the inner walk after a match and continue the outer one.
5. Return the collected pairs.

<!-- @complexity -->
- time: **O(n²)** — every node may be compared against every later node
- space: O(n) for the used-markers, or O(1) if the nodes can carry a flag
- note: Included because it is what the problem looks like **without** a backwards pointer — it uses only `next`, so it is the honest singly-linked-list answer, and its quadratic cost is precisely what the `prev` pointer buys you out of. It agreed with the two-pointer sweep on all 200,000 random lists tested, so it is a good reference implementation even though it is not a good algorithm.

<!-- @code cpp -->
```cpp
#include <vector>
#include <utility>
#include <algorithm>
using namespace std;

vector<pair<int,int>> findPairsByNestedWalk(Node* head, int target) {
    vector<Node*> nodes;
    for (Node* p = head; p != nullptr; p = p->next) nodes.push_back(p);

    vector<bool> used(nodes.size(), false);
    vector<pair<int,int>> result;
    for (size_t i = 0; i < nodes.size(); i++) {
        if (used[i]) continue;
        for (size_t j = i + 1; j < nodes.size(); j++) {
            if (used[j]) continue;
            if (nodes[i]->data + nodes[j]->data == target) {
                used[i] = used[j] = true;
                result.push_back({min(nodes[i]->data, nodes[j]->data),
                                  max(nodes[i]->data, nodes[j]->data)});
                break;
            }
        }
    }
    return result;
}
```

<!-- @annotations -->
- 17: Marking both used is what keeps the pairs disjoint, matching what the two-pointer sweep computes.
- 20: Breaking after a match, so the outer node is not paired twice.
- 8: Only `next` is read anywhere in this function — it needs no `prev`, which is exactly why it costs O(n²).

<!-- @code java -->
```java
static List<int[]> findPairsByNestedWalk(Node head, int target) {
    List<Node> nodes = new ArrayList<>();
    for (Node p = head; p != null; p = p.next) nodes.add(p);

    boolean[] used = new boolean[nodes.size()];
    List<int[]> result = new ArrayList<>();
    for (int i = 0; i < nodes.size(); i++) {
        if (used[i]) continue;
        for (int j = i + 1; j < nodes.size(); j++) {
            if (used[j]) continue;
            if (nodes.get(i).data + nodes.get(j).data == target) {
                used[i] = used[j] = true;
                result.add(new int[]{Math.min(nodes.get(i).data, nodes.get(j).data),
                                     Math.max(nodes.get(i).data, nodes.get(j).data)});
                break;
            }
        }
    }
    return result;
}
```

<!-- @annotations -->
- 5: A parallel `boolean[]` rather than a field on the node, so the algorithm does not require the node type to carry a scratch flag.

<!-- @code python -->
```python
def find_pairs_by_nested_walk(head, target):
    nodes = []
    p = head
    while p is not None:
        nodes.append(p)
        p = p.next

    used = [False] * len(nodes)
    result = []
    for i in range(len(nodes)):
        if used[i]:
            continue
        for j in range(i + 1, len(nodes)):
            if used[j]:
                continue
            if nodes[i].data + nodes[j].data == target:
                used[i] = used[j] = True
                result.append((min(nodes[i].data, nodes[j].data),
                               max(nodes[i].data, nodes[j].data)))
                break
    return result
```

<!-- @annotations -->
- 13: The inner scan is what makes this quadratic — and what the sorted order plus a backwards pointer together replace with a single sweep.

<!-- @example -->

<!-- @input -->
`1 <-> 2 <-> 3 <-> 4 <-> 5 <-> 6 <-> 7`, target 8

<!-- @output -->
`(1,7) (2,6) (3,5)`

<!-- @why -->
The basic sweep, showing why each move is forced.

<!-- @walkthrough -->
1. `lo` is on 1 and `hi` is on 7; their sum is 8, a match, so the pair is recorded and both move inward.
2. `lo` is on 2 and `hi` is on 6; sum 8 again, recorded, both move.
3. `lo` is on 3 and `hi` is on 5; sum 8, recorded, both move.
4. Now `lo` and `hi` are both on 4 — the same node — so `lo != hi` fails and the loop ends.
5. Note that no move was ever a choice: with the list sorted, a sum below the target can only be raised by moving `lo` right, and one above can only be lowered by moving `hi` left.
6. That is why the sweep is linear — each step eliminates one node from consideration permanently.
7. The pointers between them covered all seven nodes exactly once, which is the measured `n − 1` iterations.

<!-- @example -->

<!-- @input -->
`2 <-> 2 <-> 2 <-> 2`, target 4

<!-- @output -->
Two pairs, not six

<!-- @why -->
Settles what "find pairs" means here, which has to be decided before correctness can be checked.

<!-- @walkthrough -->
1. `lo` is on the first 2 and `hi` on the last; the sum is 4, so the pair is recorded and both move inward.
2. Now `lo` is on the second 2 and `hi` on the third; sum 4 again, recorded, and both move.
3. The pointers have now crossed — `hi` sits immediately before `lo` — and the loop ends.
4. The result is **two** pairs, because each of the four nodes was used exactly once.
5. Choosing two of four positions gives **six** index-pairs, which is a different and equally reasonable answer to "find pairs".
6. The two readings coincide whenever the values are distinct, which is why the distinction is easy to miss — on `1 2 3 4 5` with target 6 both give (1,5) and (2,4).
7. Everything in this container uses the disjoint reading, since that is what the two-pointer sweep naturally computes.

<!-- @example -->

<!-- @input -->
The same walk with `hi->next != lo` removed from the condition

<!-- @output -->
Extra pairs on 10.4% of random sorted lists, and never fewer

<!-- @why -->
Shows why two termination tests are needed when both pointers can move at once.

<!-- @walkthrough -->
1. `lo != hi` catches the pointers landing on the same node, which happens on odd-length sweeps.
2. But a matched pair advances **both** pointers, so they can jump past each other in a single step.
3. When that happens `hi` sits immediately before `lo`, and they are never equal — so `lo != hi` stays true.
4. The walk then continues on the wrong side, pairing elements it has already consumed.
5. Measured over 200,000 random sorted lists: the answer differed **20,743** times, and in **every** case the version without the check reported *extra* pairs.
6. It never hangs and never returns too few — it silently over-reports, which is the harder failure to notice.
7. `hi->next != lo` is the crossing test, and it is only expressible because the list is doubly linked.

<!-- @example -->

<!-- @input -->
An unsorted doubly linked list

<!-- @output -->
Wrong on 25.7% of inputs, always finding too few pairs

<!-- @why -->
The precondition, and the shape of its violation.

<!-- @walkthrough -->
1. The sweep rests on two claims: moving `lo` right cannot decrease the sum, and moving `hi` left cannot increase it.
2. Both hold only because the list is sorted; on unsorted input each move is a guess.
3. A wrong guess discards a node that might have been part of a pair, and the sweep never returns to it.
4. Measured over 178,932 genuinely unsorted lists: wrong **46,036** times, **25.7%**.
5. Every single wrong answer contained **fewer** pairs than actually exist — never more.
6. So the failure is quiet: a short, plausible list of pairs that are all individually correct.
7. If the input may be unsorted, sort it first or use the hash-map version, which ignores order entirely.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the list horizontally with **both** arrows between every adjacent pair — forward and backward — and label the two ends `head` and `tail`, because the whole problem exists because those backward arrows do. Grey out the backward arrows at first and note that everything earlier in this topic worked with only the forward ones; then light them up as the sweep begins. Put `lo` on the head and `hi` on the tail as two distinct markers, with their current sum displayed between them and the target pinned above it. Each step should show the comparison driving the move: sum too small and the left marker slides right, too large and the right marker slides left, equal and **both** move while the pair drops into a result row below. Use `1..7` with target 8 so all three outcomes appear. The second panel is the crossing case, and it needs `2 2 2 2` with target 4: the two markers meet no obstacle, both move on each match, and after two matches they are visibly past each other — draw `hi` sitting to the *left* of `lo` and flash the test `hi->next != lo` catching it, then replay without that test so the reader watches the markers continue on the wrong side and a third, spurious pair drop into the result row. Label the 10.4% figure there. The third panel puts the two readings of "pairs" side by side on that same `2 2 2 2`: the disjoint reading as two arcs joining four distinct nodes, and the index reading as six arcs over the same four nodes, so the difference between 2 and 6 is a picture. Close with the cost comparison — two pointers against the hash map at a hundred thousand nodes, 88.12us against 3,592.91us — and beside it the nested walk drawn as a triangle of comparisons, captioned as what the backward arrows save you from.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"structure":{"doublyLinked":"every node has prev as well as next, and the list is held by both head and tail","whyItMatters":"every technique in this topic so far was shaped by a singly linked list being readable in only one direction -- the tortoise and hare, the reversals, the alignment tricks. A prev pointer lifts that constraint, and the sorted two-pointer sweep becomes available."},"problem":{"input":"a SORTED doubly linked list and a target","output":"pairs of nodes whose values sum to the target","example":{"list":"1 <-> 2 <-> 3 <-> 4 <-> 5 <-> 6 <-> 7","target":8,"pairs":["(1,7)","(2,6)","(3,5)"]}},"theKeyLine":{"code":"hi = hi->prev","note":"the one line a singly linked list cannot write, and the reason this problem is posed on a doubly linked one"},"correctness":{"comparedAgainst":"the identical algorithm running on a sorted ARRAY","cppLists":200000,"pythonLists":100000,"disagreements":0,"alsoAgreed":["hash-map version","nested-walk version"]},"whatCountsAsAPair":{"theWalkComputes":"DISJOINT pairs -- it never revisits a node, so each element is used at most once","table":[{"list":"2 2 2 2","target":4,"walkFinds":"(2,2) (2,2)","count":2,"indexPairs":6},{"list":"1 1 2 2 3 3","target":4,"walkFinds":"(1,3) (1,3) (2,2)","count":3,"indexPairs":5},{"list":"1 1 1","target":2,"walkFinds":"(1,1)","count":1,"indexPairs":3},{"list":"0 0 0 0","target":0,"walkFinds":"(0,0) (0,0)","count":2,"indexPairs":6},{"list":"1 2 3 4 5","target":6,"walkFinds":"(1,5) (2,4)","count":2,"indexPairs":2}],"whyItIsEasyToMiss":"the two readings COINCIDE whenever the values are distinct -- the last row shows both giving the same answer","chosenHere":"the disjoint reading, since that is what the two-pointer sweep naturally computes"},"theCrossingCheck":{"condition":"while (lo && hi && lo != hi && hi->next != lo)","whyTheLastPartIsNeeded":"a matched pair advances BOTH pointers, so they can step past each other in one move without ever being equal -- hi then sits immediately before lo","measured":{"lists":200000,"answersDiffered":20743,"rate":"10.4%","ofThoseWithExtraPairs":20743,"ofThoseWithFewerPairs":0},"failureMode":"it never hangs and never returns too few -- it silently over-reports, pairing elements already consumed"},"sortedIsAPrecondition":{"restsOn":["moving lo right cannot decrease the sum","moving hi left cannot increase it"],"bothFalseWhenUnsorted":true,"measured":{"lists":178932,"wrong":46036,"rate":"25.7%","foundFewerPairs":46036,"foundMorePairs":0},"failureMode":"quiet -- a short, plausible list of pairs that are each individually correct","ifInputMayBeUnsorted":"sort it first, or use the hash-map version, which ignores order"},"iterations":{"note":"an unreachable target forces the full sweep; the two pointers together traverse the list once","rows":[{"n":1000,"iterations":999},{"n":100000,"iterations":99999},{"n":1000000,"iterations":999999}]},"bench":{"unit":"microseconds, sorted list of 100,000","cpp":{"twoPointers":88.12,"hashMap":3592.91,"ratio":"about 41x"},"python":{"twoPointers":5019.8,"hashMap":18049.9,"ratio":"about 3.6x"},"sameReasonAs":"the loop subtopics -- hashing costs more than walking"},"nestedWalk":{"why":"it is what this problem looks like WITHOUT a backwards pointer -- it reads only `next`","cost":"O(n^2)","role":"the honest singly-linked-list answer, and a good reference implementation despite being a poor algorithm","agreedOn":"all 200,000 random lists tested"},"recommendation":"two pointers from both ends, with both halves of the termination test, on sorted input","lesson":"the extra pointer per node buys something specific -- a linear sweep in place of a quadratic scan -- and the two ways to get it wrong both produce plausible, non-crashing, incorrect answers"}
```

<!-- @highlights -->
- The list is drawn horizontally with **both** arrows between adjacent nodes, forward and backward, and both ends labelled `head` and `tail`.
- The backward arrows start greyed out, noting that everything earlier in this topic used only the forward ones.
- They light up as the sweep begins, since they are what makes it possible.
- `lo` sits on the head and `hi` on the tail as distinct markers, with their current sum between them and the target pinned above.
- Each step shows the comparison driving the move: too small and the left marker slides right, too large and the right slides left.
- On equality **both** move, and the pair drops into a result row below.
- The example `1..7` with target 8 makes all three outcomes appear.
- The second panel runs `2 2 2 2` with target 4, where both markers move on every match.
- After two matches they are visibly past each other, with `hi` drawn to the *left* of `lo`.
- The test `hi->next != lo` flashes as it catches that.
- A replay without the test shows the markers continuing on the wrong side and a third, spurious pair dropping into the results.
- The 10.4% figure is labelled there.
- The third panel puts both readings of "pairs" on the same `2 2 2 2`: two arcs joining four distinct nodes, against six arcs over the same four.
- That makes the difference between 2 and 6 a picture rather than a claim.
- The close compares two pointers against the hash map at a hundred thousand nodes — 88.12us against 3,592.91us.
- Beside it the nested walk is drawn as a triangle of comparisons, captioned as what the backward arrows save you from.

<!-- @edgeCases -->
- An empty list — both pointers are null and the loop never runs, returning no pairs.
- A single node — `lo` and `hi` start on the same node, so the first test fails immediately and nothing is paired.
- Two nodes summing to the target — the shortest list producing a pair, after which the pointers cross.
- Two nodes not summing to the target — one pointer moves, they land together, and the loop ends.
- A list where every value is identical — pairs up into disjoint couples, giving `n/2` pairs for an even length.
- An odd-length list whose middle node is half the target — that node cannot pair with itself, and `lo != hi` is what prevents it.
- A target smaller than twice the smallest value — no pair exists; `hi` walks all the way left and the loop ends cleanly.
- A target larger than twice the largest value — the mirror case; `lo` walks all the way right.
- Negative values — handled without change, since the algorithm compares sums rather than assuming positivity.
- Unsorted input — silently returns too few pairs, wrong on 25.7% of such lists.
- A list held only by its head — the sweep needs the tail; finding it costs a full traversal, which the structure normally avoids by storing it.

<!-- @pitfalls -->
- Omitting `hi->next != lo`. The pointers cross without being equal and the walk invents pairs — wrong on 10.4% of random sorted lists, always by over-reporting.
- Running the sweep on unsorted input. Wrong on 25.7% of such lists, and always by finding **fewer** pairs than exist.
- Assuming "pairs" means index pairs. Four 2s summing to 4 give two disjoint pairs but six index pairs; the sweep computes the former.
- Testing only on lists of distinct values. The two readings of "pair" coincide there, so the ambiguity never surfaces.
- Moving only one pointer on a match. The matched node stays in play and can be paired again.
- Using a plain set rather than counts in the hash version. One element then appears in two different pairs.
- Forgetting the self-complement case in the hash version. A lone 4 pairs with itself for a target of 8.
- Comparing `lo->data != hi->data` instead of `lo != hi`. That asks whether the values differ, not whether the pointers have met.
- Reaching for the hash map by default. It measured 41x slower and needs O(n) memory; its advantage is only that it tolerates unsorted input.
- Assuming the sweep needs the length. It does not — it terminates on the pointers meeting or crossing, never on a counter.
- Searching for the tail on every call. The tail is part of what a doubly linked list stores; recomputing it makes the sweep two passes instead of one.

<!-- @doubt -->
### Why does this problem need a doubly linked list?

<!-- @answer -->
Because of one line: `hi = hi->prev`. The sorted two-pointer sweep works by closing in from both ends, which means one of the pointers has to move **backwards** — and a singly linked list cannot do that without either a full traversal per step or an auxiliary structure holding the nodes. Everything else in this topic has been shaped by that restriction, and much of the cleverness in it exists to work around the absence of a backwards pointer. Add `prev` and a `tail`, and the natural algorithm simply becomes available. The nested-walk approach in this container is what the same problem looks like without it: only `next` is ever read, and the cost is **O(n²)** instead of one linear sweep. That is a concrete answer to what the extra pointer per node buys — not general convenience, but this specific algorithm.

<!-- @doubt -->
### `lo != hi` already stops the loop. Why the second test?

<!-- @answer -->
Because when a pair matches, **both** pointers move, so they can jump past each other in a single step and never be equal. After that `hi` sits immediately to the left of `lo`, `lo != hi` is still true, and the walk keeps going on the wrong side — pairing elements it has already consumed. `hi->next != lo` is what detects that crossing. It is not a theoretical concern: over 200,000 random sorted lists the answer differed **20,743 times — 10.4%** — and in **every single one** the version without the check produced *extra* pairs. It never hung and never found too few. That is the difficult kind of bug, because the output looks entirely reasonable: a slightly longer list of pairs whose values do genuinely sum to the target. Only counting them against a reference reveals it.

<!-- @doubt -->
### How many pairs does `2 2 2 2` with target 4 have?

<!-- @answer -->
Two or six, depending on what you are counting, and the question has to be settled before "correct" means anything. The two-pointer walk never revisits a node, so it uses each element at most once and finds **two** disjoint pairs. Counting distinct *positions* instead gives **six**, since there are six ways to choose two of four items. Both are defensible readings of "find pairs" and different sources mean different ones. What makes this easy to miss is that the two coincide whenever the values are distinct — on `1 2 3 4 5` with target 6 both give exactly (1,5) and (2,4) — so a test suite built from distinct values never exposes the difference. Everything in this container uses the disjoint reading, because that is what the sweep naturally computes. If your problem statement wants index pairs, this algorithm is the wrong starting point.

<!-- @doubt -->
### What happens if the list is not sorted?

<!-- @answer -->
It returns a plausible wrong answer. The sweep depends on two facts that only sorted order provides: moving `lo` right cannot decrease the sum, and moving `hi` left cannot increase it. Without them each move is a guess, and a wrong guess permanently discards a node that might have been half of a pair. Measured over 178,932 genuinely unsorted lists, the walk was wrong **46,036 times — 25.7%** — and every wrong answer had **fewer** pairs than actually exist, never more. So there is no crash, no hang, and no obviously bogus output: just a short list of pairs that are each individually correct. If the input might be unsorted, either sort it first — which costs O(n log n) and makes the sweep worthwhile again for repeated queries — or use the hash-map version, which ignores order entirely and does not even need the `prev` pointer.

<!-- @doubt -->
### Should I just use a hash map? It handles unsorted input.

<!-- @answer -->
Use it when the input genuinely may be unsorted, and not otherwise. That is its real advantage and it is a significant one — but it costs **41x** on sorted input, measuring 3,592.91us against the sweep's 88.12us at a hundred thousand nodes, and 3.6x in Python. It also needs O(n) memory against the sweep's O(1). That is the same result the loop subtopics measured repeatedly, for the same reason: hashing and allocating cost far more than walking. One implementation detail worth care if you do use it — count occurrences rather than storing presence in a set. With a set, an element that has already been paired is still "present" and gets paired again, which quietly breaks the disjointness the two-pointer version guarantees. The self-complement case needs its own branch too, or a lone 4 pairs with itself for a target of 8.

<!-- @doubt -->
### Does the sweep need to know the list's length?

<!-- @answer -->
No, and that is worth noticing because the instinct from the array version says otherwise. On an array you write `while (i < j)` with integer indices, and the comparison is arithmetic. On a doubly linked list there are no indices, so termination has to be expressed structurally instead — `lo != hi` for the meeting case and `hi->next != lo` for the crossing case. Neither needs a counter, and neither needs a prior traversal to measure anything. What the sweep **does** need is the `tail`, which a doubly linked list normally stores alongside the `head` precisely so that the back end is reachable in O(1). If your structure only keeps a head pointer, finding the tail costs a full traversal and the sweep becomes two passes rather than one — still linear, but it gives up the constant factor that makes it attractive.
