---
id: remove-nth-node-from-the-back-of-the-ll
topic: Linked Lists
title: Remove Nth node from the back of the LL
difficulty: Medium
status: ready
prerequisites:
  - find-the-length-of-the-linked-list
  - deletion-of-the-head-of-ll
  - middle-of-a-linkedlist-tortoisehare-method
  - introduction-to-singly-linkedlist
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - delete-the-middle-node-in-ll
  - find-the-length-of-the-linked-list
  - deletion-of-the-head-of-ll
  - middle-of-a-linkedlist-tortoisehare-method
  - segregate-odd-and-even-nodes-in-linked-list
---

<!-- @summary -->
"One pass" turns out to name the number of traversals and not the amount of work: the gap method and the count-then-walk method differ by **exactly one pointer dereference** at every size measured. It is nonetheless the faster of the two — by roughly **1.5x to 2x** — and this container is explicit that the reason was **not** established. The obvious cache explanation was tested and **refuted**. Meanwhile the two classic bugs are precise: without a dummy head the code is correct for every n except the one that removes the head, and a gap off by one silently deletes the **neighbour**.

<!-- @theory -->
## The problem

Given a list and a number `n`, remove the node that is `n`-th counting from the
back. `n = 1` is the last node; `n = length` is the head.

```
1 -> 2 -> 3 -> 4 -> 5      n = 2   ->   1 -> 2 -> 3 -> 5
               ^
            2nd from the back
```

The awkward part is that a singly linked list has no way to count backwards, and
the node you must actually modify is the one **before** the target — which is
even further from the end.

## The gap method

Put two pointers `n + 1` apart, then slide them together until the leading one
falls off the end. The trailing one is then sitting on the node before the target.

```cpp
Node* removeNthFromEnd(Node* head, int n) {
    Node dummy(0);
    dummy.next = head;
    Node* fast = &dummy;
    Node* slow = &dummy;

    for (int i = 0; i <= n; i++) fast = fast->next;
    while (fast != nullptr) { fast = fast->next; slow = slow->next; }

    Node* dead = slow->next;
    slow->next = dead->next;
    delete dead;
    return dummy.next;
}
```

Verified against two other implementations on **every combination of length 1 to
60 and every valid n** — 1,830 cases — with zero disagreements.

## The dummy head is what makes `n = length` work

Removing the head is not a special case of "unlink the node after `slow`" unless
something sits in front of the head to *be* `slow`. That is the entire job of the
dummy node, and dropping it produces code that looks fine:

| n | Without a dummy | With a dummy |
|---|---|---|
| 1 | `1 2 3 4` | `1 2 3 4` |
| 2 | `1 2 3 5` | `1 2 3 5` |
| 3 | `1 2 4 5` | `1 2 4 5` |
| 4 | `1 3 4 5` | `1 3 4 5` |
| **5** | **crash** | `2 3 4 5` |

It is correct for every `n` except the single value that removes the head — and
it crashes on a one-node list for the same reason. The failing case is exactly
the one a hand-written test is least likely to include, because it is the only
one where the answer's first element changes.

## An off-by-one in the gap removes the neighbour

The loop advances `fast` by `n + 1`, not `n`. Getting that wrong does not
produce an obviously broken list — it produces a **plausible** one:

| n | Correct | Gap of `n` instead of `n + 1` | |
|---|---|---|---|
| 1 | `1 2 3 4` | **crash** | |
| 2 | `1 2 3 5` | `1 2 3 4` | removed the 1st, not the 2nd |
| 3 | `1 2 4 5` | `1 2 3 5` | removed the 2nd, not the 3rd |
| 4 | `1 3 4 5` | `1 2 4 5` | removed the 3rd, not the 4th |

It deletes the node **one closer to the end** than asked, every time, and only
crashes at the boundary `n = 1` where there is no such node. A test that checks
"the list got shorter by one" passes. A test that checks *which* node left does
not.

The extra step is there because `slow` must stop on the node **before** the
target, so it needs to lag the target by one more than the target lags the end.

## "One pass" is a claim about traversals, not about work

The two-pass method — count the length, then walk to position `length - n` — is
usually presented as the naive version that the gap method improves on. Counted
in pointer dereferences, they are the same algorithm:

| Length | n | Gap method | Count-then-walk |
|---|---|---|---|
| 10 | 1 | 21 | 20 |
| 10 | 10 | 12 | 11 |
| 1,000 | 1 | 2,001 | 2,000 |
| 1,000 | 500 | 1,502 | 1,501 |
| 100,000 | 1 | 200,001 | 200,000 |
| 100,000 | 50,000 | 150,002 | 150,001 |
| 100,000 | 100,000 | 100,002 | 100,001 |

**Exactly one more**, at every size and every `n`. Both do about
`length + (length − n)` reads. The gap method does not touch fewer pointers; it
touches one more.

## It is faster anyway, and this container does not know why

Timed on a million nodes, median of 25 single calls each on a freshly built list:

| n | Gap method | Count-then-walk | Ratio |
|---|---|---|---|
| 1 | **2,559us** | 4,911us | 0.52x |
| 10 | **2,534us** | 4,765us | 0.53x |
| 1,000 | **2,677us** | 5,434us | 0.47x |
| 100,000 | **2,804us** | 4,629us | 0.61x |
| 500,000 | **2,828us** | 3,612us | 0.70x |
| 1,000,000 | 2,904us | 2,885us | ~1.0x |

So it is genuinely **1.5x to 2x** faster despite the extra dereference, and the
advantage disappears exactly when `n = length` — the case where the trailing
pointer never moves at all.

The obvious explanation is that the trailing pointer re-reads cache lines the
leading pointer has just fetched. **That was tested and it is wrong.** If it were
right, a list small enough to sit entirely in L1 would show no advantage. This
machine has a 65,536-byte L1 data cache; a 200-node list occupies 3,200 bytes:

| Length | Bytes | Ratio |
|---|---|---|
| 200 | 3,200 | 0.56x |
| 1,000 | 16,000 | 0.94x |
| 5,000 | 80,000 | 0.52x |
| 100,000 | 1,600,000 | 0.39x |
| 1,000,000 | 16,000,000 | 0.49x |
| 4,000,000 | 64,000,000 | 0.76x |

The advantage is present at 3,200 bytes and the numbers show no relationship to
cache size. Whatever produces the speedup, cache residency is not it. A second
hypothesis — that two independent pointer chains overlap their memory latency
where two sequential passes cannot — fits the shape of the data, including the
disappearance of the advantage at `n = length`, but it was **not measured**, so
it is recorded here as a guess rather than a result.

Python shows the same pattern, on a 200,000-node list:

| n | Gap method | Count-then-walk | Ratio |
|---|---|---|---|
| 1 | **4,614us** | 11,768us | 0.39x |
| 1,000 | **6,420us** | 12,850us | 0.50x |
| 100,000 | **6,647us** | 10,132us | 0.66x |
| 200,000 | **4,975us** | 7,228us | 0.69x |

<!-- @intuition -->
Everything hard about this problem comes from one asymmetry: you are asked to count from the end, and the structure only lets you walk from the front. Both good solutions are ways of converting one into the other — either measure the list first so the backwards index becomes a forwards one, or hold two pointers a fixed distance apart so that when the front one arrives at the end, the back one has arrived at the answer. The gap is the more elegant idea and the arithmetic is where it bites, because the pointer you need is not the node to delete but the node before it, so the gap is `n + 1` and not `n`, and getting that wrong quietly deletes the wrong node rather than failing. The other thing worth taking from this one is a small correction of vocabulary. "One pass" sounds like it should mean less work, and here it does not — the two methods differ by a single dereference. The gap version is still faster, by a factor this container measured and could not explain, having tested the obvious explanation and found it false. That is an ordinary outcome of measuring things, and a more useful place to stop than a tidy story that happens not to be true.

<!-- @approach -->
### Optimal - One Pass with a Gap

<!-- @idea -->
Open a gap of `n + 1` between two pointers, then move them together until the leading one runs off the end.

<!-- @steps -->
1. Create a dummy node whose `next` is the head, and point both `fast` and `slow` at it.
2. Advance `fast` by `n + 1` steps.
3. Move `fast` and `slow` forward together, one node at a time.
4. Stop when `fast` becomes null — `slow` is now on the node **before** the target.
5. Unlink the target by pointing `slow->next` past it, and free it.
6. Return the dummy's `next`, which is the head — possibly a different node than the one passed in.

<!-- @complexity -->
- time: O(n) — one traversal, with two pointers moving through it
- space: **O(1)** — a dummy node and two pointers
- note: The one to write. It performs **one more** dereference than counting first, not fewer, and is nonetheless about **1.5x to 2x** faster — a gap this container measured but could not explain, having tested and refuted the cache-reuse hypothesis. The dummy on step 1 is what allows `n = length`; the `+ 1` on step 2 is what puts `slow` on the predecessor instead of the target.

<!-- @code cpp -->
```cpp
Node* removeNthFromEnd(Node* head, int n) {
    Node dummy(0);
    dummy.next = head;
    Node* fast = &dummy;
    Node* slow = &dummy;

    for (int i = 0; i <= n; i++) fast = fast->next;
    while (fast != nullptr) { fast = fast->next; slow = slow->next; }

    Node* dead = slow->next;
    slow->next = dead->next;
    delete dead;
    return dummy.next;
}
```

<!-- @annotations -->
- 7: `i <= n`, so `n + 1` steps. Using `n` puts `slow` on the target rather than its predecessor, which silently deletes the node one closer to the end and crashes outright at `n = 1`.
- 2: The dummy exists for exactly one case — `n = length`, which removes the head. Without it that case has no predecessor to unlink from and the code crashes.
- 13: `dummy.next`, not `head`. When the head was the node removed, `head` now points at freed memory.
- 12: Freeing after the unlink, never before — the read of `dead->next` on the line above has to happen while the node is still alive.

<!-- @code java -->
```java
static Node removeNthFromEnd(Node head, int n) {
    Node dummy = new Node(0);
    dummy.next = head;
    Node fast = dummy;
    Node slow = dummy;

    for (int i = 0; i <= n; i++) fast = fast.next;
    while (fast != null) { fast = fast.next; slow = slow.next; }

    slow.next = slow.next.next;
    return dummy.next;
}
```

<!-- @annotations -->
- 10: No explicit free, so the unlink is the whole deletion — the collector reclaims the node once nothing refers to it.

<!-- @code python -->
```python
def remove_nth_from_end(head, n):
    dummy = Node(0)
    dummy.next = head
    fast = slow = dummy

    for _ in range(n + 1):
        fast = fast.next
    while fast is not None:
        fast = fast.next
        slow = slow.next

    slow.next = slow.next.next
    return dummy.next


# `range(n + 1)`, not `range(n)`. The gap has to be one larger than
# the index, because `slow` must land on the node BEFORE the target.
```

<!-- @annotations -->
- 6: An off-by-one here removes the neighbour rather than raising — the list is still valid and still one node shorter, which is why it survives casual testing.

<!-- @approach -->
### Count the Length, Then Walk

<!-- @idea -->
Measure the list, convert the backwards index into a forwards one, and walk straight to the node before the target.

<!-- @steps -->
1. Walk the list once, counting nodes.
2. Create a dummy node whose `next` is the head, and point `prev` at it.
3. Advance `prev` by `length − n` steps, which lands it on the node before the target.
4. Unlink the target and free it.
5. Return the dummy's `next`.

<!-- @complexity -->
- time: O(n) — two traversals, together covering about the same ground as the gap method's one
- space: **O(1)** — a dummy node, a pointer and a counter
- note: Usually cast as the naive version, and it performs **one fewer** dereference than the gap method at every size measured — 200,000 against 200,001 at a hundred thousand nodes. It is the slower of the two in wall clock by roughly **1.5x to 2x**, which is the interesting part, since it is doing marginally less work. Its genuine advantage is that the arithmetic is visible: `length − n` can be read and checked, where the gap method's `n + 1` has to be reasoned about.

<!-- @code cpp -->
```cpp
Node* removeNthFromEndTwoPass(Node* head, int n) {
    long length = 0;
    for (Node* p = head; p != nullptr; p = p->next) length++;

    Node dummy(0);
    dummy.next = head;
    Node* prev = &dummy;
    for (long i = 0; i < length - n; i++) prev = prev->next;

    Node* dead = prev->next;
    prev->next = dead->next;
    delete dead;
    return dummy.next;
}
```

<!-- @annotations -->
- 8: `length - n` steps from the dummy. When `n == length` this is zero steps, `prev` stays on the dummy, and the head is removed — the same case the dummy exists for.
- 2: A **signed** type, deliberately. With `n > length` the subtraction on line 8 goes negative and the loop simply does not run; in an unsigned type it would wrap to an enormous count instead.
- 3: The count and the walk are separate traversals, which is what "two pass" names — not extra work, since together they read one fewer pointer than the gap method's single pass.

<!-- @code java -->
```java
static Node removeNthFromEndTwoPass(Node head, int n) {
    long length = 0;
    for (Node p = head; p != null; p = p.next) length++;

    Node dummy = new Node(0);
    dummy.next = head;
    Node prev = dummy;
    for (long i = 0; i < length - n; i++) prev = prev.next;

    prev.next = prev.next.next;
    return dummy.next;
}
```

<!-- @annotations -->
- 3: Counting first also gives you a cheap place to validate `n`, which the gap method cannot do without walking anyway.

<!-- @code python -->
```python
def remove_nth_from_end_two_pass(head, n):
    length = 0
    p = head
    while p is not None:
        length += 1
        p = p.next

    dummy = Node(0)
    dummy.next = head
    prev = dummy
    for _ in range(length - n):
        prev = prev.next

    prev.next = prev.next.next
    return dummy.next
```

<!-- @annotations -->
- 12: `range(length - n)` is empty when `n == length`, so `prev` stays on the dummy and the head is the node removed — no special case needed.

<!-- @approach -->
### Index Through an Array of Node Pointers

<!-- @idea -->
Collect the node addresses into an array, which can be indexed from either end, and reach the predecessor directly.

<!-- @steps -->
1. Walk the list once, appending each node's address to an array.
2. Compute the target's forwards index as `size − n`.
3. Take the predecessor as the array element before it, or the dummy if the target is the first.
4. Unlink the target and free it.
5. Return the dummy's `next`.

<!-- @complexity -->
- time: O(n) — one traversal plus the array fill
- space: **O(n)** — one pointer per node
- note: The clearest of the three to read and the only one needing extra memory, which is a poor trade when both alternatives are O(1). It is worth seeing because it makes the arithmetic completely explicit — `size - n` and `size - n - 1` are just indices — and because it is the version to reach for if you need several removals at known positions rather than one. It timed comparably to the gap method in Python and is not competitive in C++ once the allocation is counted.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

Node* removeNthFromEndIndexed(Node* head, int n) {
    vector<Node*> nodes;
    for (Node* p = head; p != nullptr; p = p->next) nodes.push_back(p);

    long target = (long)nodes.size() - n;
    Node dummy(0);
    dummy.next = head;
    Node* prev = (target == 0) ? &dummy : nodes[target - 1];

    prev->next = nodes[target]->next;
    delete nodes[target];
    return dummy.next;
}
```

<!-- @annotations -->
- 11: The `target == 0` branch is this version's equivalent of the dummy trick — it is the head-removal case made explicit rather than absorbed.
- 8: Casting to a signed type before subtracting. `nodes.size()` is unsigned, so `size() - n` with `n > size()` would wrap rather than go negative.
- 13: Reading `nodes[target]->next` before the delete on the following line, for the same reason the other versions do.

<!-- @code java -->
```java
static Node removeNthFromEndIndexed(Node head, int n) {
    List<Node> nodes = new ArrayList<>();
    for (Node p = head; p != null; p = p.next) nodes.add(p);

    int target = nodes.size() - n;
    Node dummy = new Node(0);
    dummy.next = head;
    Node prev = (target == 0) ? dummy : nodes.get(target - 1);

    prev.next = nodes.get(target).next;
    return dummy.next;
}
```

<!-- @annotations -->
- 5: `int` arithmetic here is already signed, so the wrap hazard the C++ version guards against does not arise.

<!-- @code python -->
```python
def remove_nth_from_end_indexed(head, n):
    nodes = []
    p = head
    while p is not None:
        nodes.append(p)
        p = p.next

    target = len(nodes) - n
    dummy = Node(0)
    dummy.next = head
    prev = dummy if target == 0 else nodes[target - 1]

    prev.next = nodes[target].next
    return dummy.next
```

<!-- @annotations -->
- 11: A conditional expression rather than an `if`, which keeps the head case beside the general one instead of in a separate branch.

<!-- @example -->

<!-- @input -->
`1 -> 2 -> 3 -> 4 -> 5`, `n = 2`

<!-- @output -->
`1 -> 2 -> 3 -> 5`

<!-- @why -->
The standard trace, showing why the gap is `n + 1` rather than `n`.

<!-- @walkthrough -->
1. A dummy node is placed in front of node 1, and both pointers start on it.
2. `fast` advances 3 times — that is `n + 1` — landing on node 3.
3. The gap between them is now 3 nodes, which is one more than the index being asked for.
4. Both move together: `fast` to 4 and `slow` to 1; then `fast` to 5 and `slow` to 2; then `fast` to null and `slow` to 3.
5. The loop ends with `slow` on node 3, which is the node **before** the second-from-last.
6. Had `fast` advanced only twice, `slow` would have finished on node 4 — the target itself — and unlinking past it would have removed node 5 instead.
7. `slow->next` is set to node 5, node 4 is freed, and the dummy's `next` is returned.

<!-- @example -->

<!-- @input -->
`1 -> 2 -> 3 -> 4 -> 5`, `n = 5`, without a dummy head

<!-- @output -->
Crash

<!-- @why -->
Isolates the one case the dummy exists for, and shows it is the case least likely to be tested.

<!-- @walkthrough -->
1. `n = 5` on a five-node list means removing the head.
2. The removal step is always "point the predecessor past the target", so the head needs a predecessor.
3. Without a dummy there is none, and the pointer meant to land on it runs off the front instead.
4. Measured: correct for `n = 1, 2, 3, 4`, and a crash at `n = 5`.
5. The same code also crashes on a single-node list with `n = 1`, which is the same case in miniature.
6. This is the only value of `n` where the first element of the answer differs from the first element of the input.
7. So a test suite that spot-checks the middle of the range reports the bug as absent.

<!-- @example -->

<!-- @input -->
The gap opened to `n` instead of `n + 1`

<!-- @output -->
The node one closer to the end is removed, and only `n = 1` crashes

<!-- @why -->
A bug that produces a valid list of the right length, which is why it survives weak tests.

<!-- @walkthrough -->
1. With a gap of `n`, the trailing pointer finishes on the target rather than on its predecessor.
2. Unlinking past it therefore removes the node **after** the target — one closer to the end.
3. On `1 2 3 4 5`: asking for `n = 2` gives `1 2 3 4`, which is what `n = 1` should have produced.
4. Asking for `n = 3` gives `1 2 3 5`, which is the correct answer for `n = 2`.
5. Asking for `n = 4` gives `1 2 4 5`, the correct answer for `n = 3`.
6. Only `n = 1` crashes, because there is no node after the last one to remove.
7. Every non-crashing case returns a well-formed list exactly one node shorter — so any test asserting only the new length passes.

<!-- @example -->

<!-- @input -->
Pointer dereferences for the gap method against counting first

<!-- @output -->
The gap method does exactly one **more**, at every size

<!-- @why -->
Corrects what "one pass" is usually taken to mean.

<!-- @walkthrough -->
1. The gap method's leading pointer travels the whole list, and the trailing one travels `length − n` of it.
2. Counting first traverses the list once, then walks `length − n` nodes — the same two distances.
3. Counted exactly: 200,001 dereferences against 200,000 at a hundred thousand nodes.
4. The same one-dereference difference holds at every length and every `n` tested.
5. So "one pass" describes how many times the code walks from the head, not how many pointers it follows.
6. The gap method is still the faster of the two in wall clock, by roughly 1.5x to 2x.
7. Which means the speed difference has to come from something other than the amount of pointer-following, and this container did not establish what.

<!-- @example -->

<!-- @input -->
The hypothesis that the trailing pointer reuses the leading pointer's cache lines

<!-- @output -->
Refuted — the advantage is still 0.56x on a 3,200-byte list

<!-- @why -->
A worked example of testing an explanation instead of adopting it.

<!-- @walkthrough -->
1. The natural explanation for the speedup is cache: the trailing pointer re-reads lines the leading one just fetched.
2. That predicts something checkable — a list small enough to sit entirely in L1 should show no advantage at all.
3. This machine reports a 65,536-byte L1 data cache; a 200-node list of 16-byte nodes occupies 3,200 bytes.
4. Measured at that size, the gap method still ran at **0.56x** of the two-pass time.
5. Across lengths from 200 to 4,000,000 the ratio moved between 0.39x and 0.94x with no relationship to cache size.
6. The prediction failed, so the explanation is wrong, and it is not repeated as fact anywhere in this container.
7. A second guess — that two independent pointer chains overlap memory latency where two sequential passes cannot — fits the data including the vanishing advantage at `n = length`, but was not measured and is labelled a guess.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the list horizontally with a clearly separate dummy node hanging off the front in a different shade, because half of this problem is that the dummy exists at all. Number the nodes from the back underneath, in a second colour, so that both indexings are visible at once — the walk happens forwards and the question is asked backwards, and that mismatch is the entire subject. Open the gap first: hold `slow` on the dummy and step `fast` forward `n + 1` times, drawing the span between them as a measured bracket labelled with its length. Then slide the whole bracket rightwards in lockstep, keeping it visibly rigid, until `fast` drops off the end into null — and at that instant highlight that `slow` has landed on the node before the target, with the bracket's trailing edge exactly one node short of it. The rigidity is the idea: the answer arrives because the distance never changed. Then the unlink, drawn as one arrow rerouted over the doomed node. The second panel is the `n + 1` question, as two runs of the same list side by side, one with a bracket of `n` and one of `n + 1`, sliding together and stopping together — the shorter bracket leaves `slow` on the target itself, and the arrow it reroutes skips the node beyond, so the reader sees the wrong node vanish rather than being told about it. Label the results `n = 2` gives `1 2 3 4` and correct is `1 2 3 5`. The third panel is the dummy: the same removal with `n = length`, drawn twice, once with the dummy present so `slow` has somewhere to stand and once without, where the pointer that should hold the predecessor has nothing in front of the head and runs off into nothing. Close with the two cost bars — dereferences and microseconds — annotated so the mismatch is unmissable: the gap method's dereference bar is one taller and its time bar is half the height, with the caption that the reason was measured and not explained.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4","l1d":65536,"l2":4194304},"problem":{"task":"remove the node n-th from the back","indexing":"n = 1 is the last node; n = length is the head","difficulty":"a singly linked list cannot count backwards, and the node that must be MODIFIED is the one before the target -- further from the end still"},"correctness":{"approaches":["gap method","count then walk","index through an array"],"cases":1830,"range":"every length 1..60 crossed with every valid n","disagreements":0},"theGap":{"size":"n + 1, not n","why":"slow must land on the node BEFORE the target, so it lags the target by one more than the target lags the end"},"dummyHead":{"purposeInOneLine":"gives the head a predecessor, so removing it stops being a special case","withoutIt":[{"n":1,"result":"1 2 3 4"},{"n":2,"result":"1 2 3 5"},{"n":3,"result":"1 2 4 5"},{"n":4,"result":"1 3 4 5"},{"n":5,"result":"CRASH"}],"alsoCrashesOn":"a single-node list with n = 1","whyItSurvivesTesting":"n = length is the only value where the first element of the answer differs from the first element of the input"},"offByOneInTheGap":{"symptom":"removes the node one closer to the end than asked","onList":"1 2 3 4 5","rows":[{"n":1,"correct":"1 2 3 4","buggy":"CRASH"},{"n":2,"correct":"1 2 3 5","buggy":"1 2 3 4"},{"n":3,"correct":"1 2 4 5","buggy":"1 2 3 5"},{"n":4,"correct":"1 3 4 5","buggy":"1 2 4 5"}],"whyItSurvivesTesting":"every non-crashing case returns a well-formed list exactly one node shorter, so a test asserting only the new length passes"},"onePassIsAboutTraversals":{"claim":"'one pass' names how many times the code walks from the head, NOT how many pointers it follows","dereferences":[{"length":10,"n":1,"gap":21,"countThenWalk":20},{"length":10,"n":10,"gap":12,"countThenWalk":11},{"length":1000,"n":1,"gap":2001,"countThenWalk":2000},{"length":1000,"n":500,"gap":1502,"countThenWalk":1501},{"length":100000,"n":1,"gap":200001,"countThenWalk":200000},{"length":100000,"n":50000,"gap":150002,"countThenWalk":150001},{"length":100000,"n":100000,"gap":100002,"countThenWalk":100001}],"finding":"the gap method does EXACTLY ONE MORE dereference at every size and every n","bothDoAbout":"length + (length - n) reads"},"benchCpp":{"unit":"microseconds, median of 25 single calls on freshly built lists","length":1000000,"rows":[{"n":1,"gap":2559,"countThenWalk":4911,"ratio":0.52},{"n":10,"gap":2534,"countThenWalk":4765,"ratio":0.53},{"n":1000,"gap":2677,"countThenWalk":5434,"ratio":0.47},{"n":100000,"gap":2804,"countThenWalk":4629,"ratio":0.61},{"n":500000,"gap":2828,"countThenWalk":3612,"ratio":0.70},{"n":1000000,"gap":2904,"countThenWalk":2885,"ratio":1.0}],"summary":"1.5x to 2x faster despite the extra dereference","advantageVanishesWhen":"n = length -- the case where the trailing pointer never moves at all"},"mechanismNotEstablished":{"hypothesisTested":"the trailing pointer reuses cache lines the leading pointer just fetched","prediction":"a list small enough to sit entirely in L1 should show no advantage","l1Bytes":65536,"rows":[{"length":200,"bytes":3200,"ratio":0.56},{"length":1000,"bytes":16000,"ratio":0.94},{"length":5000,"bytes":80000,"ratio":0.52},{"length":100000,"bytes":1600000,"ratio":0.39},{"length":1000000,"bytes":16000000,"ratio":0.49},{"length":4000000,"bytes":64000000,"ratio":0.76}],"verdict":"REFUTED -- the advantage is present at 3,200 bytes and the ratios show no relationship to cache size","secondHypothesis":"two independent pointer chains overlap memory latency where two sequential passes cannot","secondHypothesisStatus":"fits the shape of the data including the vanishing advantage at n = length, but was NOT measured -- recorded as a guess, not a result"},"benchPython":{"unit":"microseconds, median of 25 single calls on freshly built lists","length":200000,"rows":[{"n":1,"gap":4614,"countThenWalk":11768,"ratio":0.39},{"n":1000,"gap":6420,"countThenWalk":12850,"ratio":0.50},{"n":100000,"gap":6647,"countThenWalk":10132,"ratio":0.66},{"n":200000,"gap":4975,"countThenWalk":7228,"ratio":0.69}]},"countThenWalkAdvantage":"the arithmetic is visible -- `length - n` can be read and checked, where the gap method's `n + 1` has to be reasoned about","recommendation":"the gap method, with a dummy head and a gap of n + 1","lesson":"'one pass' is a claim about traversals, not work -- and when a measurement has no explanation, say so rather than adopting the plausible one"}
```

<!-- @highlights -->
- The list runs horizontally with a clearly separate dummy node hanging off the front in a different shade.
- Nodes are numbered from the back underneath in a second colour, so both indexings are visible at once.
- That forwards-walk against backwards-question mismatch is presented as the subject of the problem.
- The gap opens first: `slow` holds on the dummy while `fast` steps forward `n + 1` times.
- The span between them is drawn as a measured bracket labelled with its length.
- The whole bracket then slides rightwards in lockstep, staying visibly rigid.
- When `fast` drops off the end into null, `slow` is highlighted on the node before the target.
- The bracket's trailing edge sits exactly one node short of the target — the rigidity is the idea.
- The unlink is drawn as a single arrow rerouted over the doomed node.
- The second panel runs the same list twice side by side, with brackets of `n` and of `n + 1`.
- Both slide and stop together; the shorter bracket leaves `slow` on the target itself.
- The arrow it reroutes skips the node beyond, so the wrong node is seen to vanish rather than described.
- Results are labelled `n = 2` gives `1 2 3 4` against correct is `1 2 3 5`.
- The third panel draws `n = length` twice — with the dummy, where `slow` has somewhere to stand, and without, where the pointer runs off the front into nothing.
- The close pairs the two cost bars, dereferences and microseconds.
- The gap method's dereference bar is one taller while its time bar is half the height, captioned that the reason was measured and not explained.

<!-- @edgeCases -->
- `n = 1` — removes the last node, and the only value at which the off-by-one gap crashes rather than misbehaving.
- `n = length` — removes the head, and the only case the dummy node exists for.
- A single-node list with `n = 1` — both boundaries at once; returns an empty list, and crashes without a dummy.
- A two-node list — the shortest input where head removal and tail removal are different operations.
- `n` in the middle of the range — the only cases a careless test suite covers, and the only ones both classic bugs survive.
- The returned head — must come from the dummy's `next`, since the original head may be the node that was freed.
- Reading the doomed node's `next` before freeing it — required in C++, and the same ordering rule as **Deletion of the head**.
- `n` greater than the length — undefined for this problem; the gap method walks off the end, and counting first yields a negative step count.
- A signed versus unsigned step count — `length - n` must be signed, or an out-of-range `n` wraps to an enormous loop rather than a negative one.
- A list long enough that the two pointers are far apart — changes the timing relationship but not the answer.
- Removing from a list held by another reference — the caller's pointer is stale if the head was the node removed.

<!-- @pitfalls -->
- Omitting the dummy head. Correct for every `n` except `n = length`, which crashes — and that is the one case a hand-written test usually skips.
- Advancing `fast` by `n` instead of `n + 1`. Silently removes the node one closer to the end, and only crashes at `n = 1`.
- Testing only that the list got one node shorter. Both classic bugs pass that check.
- Returning `head` instead of `dummy.next`. When the head was removed, `head` refers to a freed node.
- Freeing the target before reading its `next`. The unlink needs that pointer while the node is still alive.
- Computing `length - n` in an unsigned type. An out-of-range `n` wraps to a huge positive count instead of going negative.
- Assuming "one pass" means less work. The gap method performs exactly one **more** dereference than counting first, at every size measured.
- Explaining the gap method's speed with cache reuse. The prediction that a 3,200-byte list would show no advantage was tested and failed.
- Timing this by calling it repeatedly on the same list. Each call removes a node, so later calls run on a shorter list.
- Using the gap method when you need several removals. The array version indexes directly and is clearer for that.
- Forgetting that the trailing pointer must start on the dummy too. Starting it on the head reintroduces the off-by-one.

<!-- @doubt -->
### Why is the gap `n + 1` and not `n`?

<!-- @answer -->
Because the pointer you need is not the one on the target. Removing a node from a singly linked list means pointing its **predecessor** past it, so `slow` has to finish one node earlier than the target — which means it must lag by one more than the target lags the end. Get it wrong and the failure is quiet: with a gap of `n`, `slow` lands on the target itself and the unlink skips the node **after** it, removing the one closer to the end. On `1 2 3 4 5`, asking for `n = 2` returns `1 2 3 4`, which is the correct answer to `n = 1`; asking for `n = 3` returns `1 2 3 5`, the correct answer to `n = 2`. Only `n = 1` crashes, because there is no node beyond the last. Every other case hands back a well-formed list of exactly the right length, so a test that checks the length and not the contents will pass.

<!-- @doubt -->
### Do I really need the dummy node?

<!-- @answer -->
Only for one value of `n`, which is exactly why it is easy to convince yourself you do not. Every removal here works by pointing a predecessor past the target, and the head has no predecessor — so when `n = length`, there is nothing for `slow` to stand on. Measured on `1 2 3 4 5` without a dummy: `n = 1` through `n = 4` are all correct, and `n = 5` crashes. The same code crashes on a one-node list with `n = 1`, which is the same case in miniature. What makes this dangerous is that `n = length` is the **only** value where the first element of the answer differs from the first element of the input, so it is the case a spot-check is least likely to include. The dummy costs one stack-allocated node and deletes the special case entirely — including the empty-result case, where `dummy.next` is null and that is the right answer.

<!-- @doubt -->
### Is the one-pass version actually less work than counting first?

<!-- @answer -->
No — it is **one dereference more**, at every size and every `n` tested. The gap method's leading pointer covers the whole list and its trailing pointer covers `length − n` of it; counting first traverses the list once and then walks `length − n` nodes. Those are the same two distances. Counted exactly: 200,001 against 200,000 at a hundred thousand nodes, 2,001 against 2,000 at a thousand, and the same one-apart relationship everywhere in between. So "one pass" is a claim about how many times the code starts from the head, not about how much pointer-following it does. The gap method is still the one to write, but the reason is not that it touches fewer pointers — measured, it is about **1.5x to 2x** faster in wall clock, which is a separate fact and a stranger one.

<!-- @doubt -->
### If it does more work, why is it faster?

<!-- @answer -->
This container does not know, and says so deliberately rather than offering the tidy answer. The measurement is solid — roughly **1.5x to 2x** across a million nodes, with the advantage shrinking as `n` grows and disappearing entirely at `n = length`, which is the case where the trailing pointer never moves. The obvious explanation is cache: the trailing pointer re-reads lines the leading pointer just fetched. That explanation makes a checkable prediction — a list small enough to fit entirely in L1 should show no advantage — and the prediction **failed**. On this machine's 65,536-byte L1, a 200-node list occupies 3,200 bytes and the gap method still ran at 0.56x. Across lengths from 200 to four million the ratio moved between 0.39x and 0.94x with no relationship to cache size. A second guess, that two independent pointer chains can overlap their memory latency where two sequential passes cannot, fits the shape of the data including the vanishing advantage at `n = length` — but it was not measured, so it stays a guess.

<!-- @doubt -->
### What should happen if `n` is bigger than the list?

<!-- @answer -->
The problem does not define it, so the right move is to decide explicitly rather than discover it. The two methods fail differently, which is worth knowing. The gap method advances `fast` by `n + 1` without checking, so it walks off the end and dereferences null. Counting first computes `length − n`, which goes **negative** — and that is only safe if the count is held in a signed type. Write it as an unsigned `size_t` and the subtraction wraps to an enormous positive number, turning a detectable error into a loop that runs until it crashes somewhere unrelated. That is the more insidious of the two, and it is why the C++ samples here cast to a signed type before subtracting. If callers can pass anything, count first, validate `1 <= n <= length`, and return the list unchanged or signal an error — the count is already paid for by that version.

<!-- @doubt -->
### How do I test this properly?

<!-- @answer -->
Cover both boundaries, and check *which* node left rather than how many. The two classic bugs here both produce well-formed lists: without a dummy the code is correct for every `n` except `n = length`, and with a gap of `n` instead of `n + 1` it removes the neighbour while keeping the length correct. So a suite that removes from the middle of a few lists and asserts the new length will pass with both bugs present. The cases that actually discriminate are `n = 1`, `n = length`, and a single-node list with `n = 1` — plus comparing the full resulting sequence against the expected one. That is what the verification behind this container did: every length from 1 to 60 crossed with every valid `n`, **1,830 cases**, each checked against the exact expected list, across three independent implementations.
