---
id: rotate-a-ll
topic: Linked Lists
title: Rotate a Linked List
difficulty: Hard
status: ready
prerequisites:
  - find-the-length-of-the-linked-list
  - reverse-ll-in-group-of-given-size-k
  - detect-a-loop-in-ll
relatedIds:
  - reverse-ll-in-group-of-given-size-k
  - find-the-length-of-the-linked-list
  - detect-a-loop-in-ll
  - remove-nth-node-from-the-back-of-the-ll
  - middle-of-a-linkedlist-tortoisehare-method
---

<!-- @summary -->
Rotating right by k is one modulo, one temporary ring, and one cut. The modulo is the whole problem: LeetCode 61 allows k up to 2,000,000,000 on a list of at most 500 nodes, where rotating one step at a time is an extrapolated 15 minutes against 375 nanoseconds. The walk that follows is n - s steps, which makes a large rotation cheaper than a small one.

<!-- @theory -->
## The problem

Rotate the list to the right by `k` places. The last `k` nodes move to the front,
in order.

```
1 -> 2 -> 3 -> 4 -> 5,  k = 2    ->    4 -> 5 -> 1 -> 2 -> 3
0 -> 1 -> 2,            k = 4    ->    2 -> 0 -> 1
```

The second example is the important one: `k` may exceed the length. Four rotations
of a three-node list is one rotation, because rotating by the length is the
identity.

## The modulo is the algorithm

Rotating right by `n` returns the list unchanged, so only `s = k mod n` matters.
That single line separates a constant-time answer from an unusable one. LeetCode 61
allows `k` up to **2,000,000,000** with `n` at most 500, and rotating one step at a
time costs `O(n · k)`:

| k | one step at a time, n = 500 | ns per rotation |
|---|---|---|
| 500 | 217,083 | 434.2 |
| 100,000 | 39,279,125 | 392.8 |
| 10,000,000 | **4,455,901,334** | 445.6 |

The per-rotation cost is flat across four orders of magnitude — about 440ns — so
at the problem's stated maximum of `k = 2 × 10⁹` the extrapolation is roughly
**890 seconds, or about 15 minutes**. The ring-and-cut version below handles that
same input in **375 nanoseconds**.

## Close the ring, then cut it

Once `s` is known, the rotation is three moves:

```
1 -> 2 -> 3 -> 4 -> 5        s = 2

  join the tail to the head          a temporary ring
  walk n - s = 3 steps from the head new tail is 3
  break after the new tail           new head is 4

4 -> 5 -> 1 -> 2 -> 3
```

Making the list circular for a moment is what removes all the pointer juggling:
the nodes that need to move to the front are already in front of the head once the
ring is closed, so nothing is spliced — one link is added and one is removed.

The walk length is `n - s`, and it is worth noticing which direction that runs:

| n | s | walk |
|---|---|---|
| 5 | 1 | 4 steps |
| 5 | 2 | 3 steps |
| 5 | 3 | 2 steps |
| 5 | 4 | **1 step** |

**A bigger rotation is a shorter walk.** Measured at n = 5,000, rotating by 1 takes
**13,000ns** and rotating by 4,999 takes **2,208ns** — the large rotation is
**5.9x cheaper**, which is the reverse of what the phrase "rotate by 4,999" suggests.

## The walk length is where the off-by-one lives

`n - s` steps land on the node **before** the new head, which is the new tail.
Walking one step further lands on the new head itself and cuts in the wrong place.
Measured over every list of length 0 to 7 with every k from 0 to 15 — **128 cases**
— that single extra step is wrong on **68, or 53.12%**. The smallest failure needs
two nodes:

```
list 1 -> 2,  k = 1        correct  2 -> 1
                           got      1 -> 2
```

It returns the list unchanged, which is exactly what a correct implementation
returns when `s = 0` — so on a casual test it looks like the `k mod n` case working
rather than a bug.

## Reducing k is necessary but not sufficient

With `s = k mod n` computed first, rotating one step at a time is `O(n²)` rather
than `O(n · k)` — bounded, and still not viable:

| n | s | ring and cut | one step at a time | via array |
|---|---|---|---|---|
| 500 | 1 | 1,750 | 1,833 | 6,167 |
| 500 | 250 | **1,375** | 220,333 | 6,000 |
| 500 | 499 | **833** | 434,875 | 6,541 |
| 5,000 | 2,500 | **4,917** | 14,178,500 | 16,000 |
| 5,000 | 4,999 | **2,208** | 17,640,250 | 15,875 |
| 50,000 | 25,000 | **60,667** | too slow to measure | 119,375 |

Nanoseconds, with `k` already reduced in every version. The gap reaches **2,884x**
at n = 5,000. The array version is genuinely O(n) and loses to the ring by about
**2x** on allocation alone, plus O(n) space.

<!-- @intuition -->
Two habits are on display here and they pull in the same direction. The first is reducing the input before acting on it: `k mod n` is one line that turns an unbounded parameter into one bounded by the data, and every version in this container depends on it. The second is changing the shape of the structure so the operation becomes trivial rather than handling the operation on the shape you were given — closing the ring means the nodes that must move to the front are already there, so the rotation reduces to choosing where to cut. Neither is specific to linked lists. When a problem has a parameter that can dwarf the data, look for the modulus first; when the pointer surgery is getting complicated, look for a temporary shape in which it is not surgery at all.

<!-- @approach -->
### Rotate One Step at a Time

<!-- @idea -->
Move the last node to the front, and do that k times.

<!-- @steps -->
1. Reduce `k` to `s = k mod n`, or the loop is unbounded.
2. Walk to the last node, keeping its predecessor.
3. Detach the last node and put it at the front.
4. Repeat `s` times.

<!-- @complexity -->
- time: O(n·s), and O(n·k) if k is not reduced first
- space: O(1)
- note: The definition, and correct on all 128 exhaustive cases. Even with `k` reduced it is **2,884x** behind at n = 5,000; without reducing, an extrapolated **15 minutes** at LeetCode 61's maximum.

<!-- @code cpp -->
```cpp
Node* rotateRight(Node* head, long long k) {
    if (!head || !head->next) return head;

    int n = 0;
    for (Node* p = head; p; p = p->next) n++;
    long long s = k % n;

    for (long long r = 0; r < s; r++) {
        Node* prev = nullptr;
        Node* p = head;
        while (p->next) { prev = p; p = p->next; }
        prev->next = nullptr;
        p->next = head;
        head = p;
    }
    return head;
}
```

<!-- @annotations -->
- 6: Without this line the loop runs `k` times rather than at most `n − 1`. At LeetCode 61's limits that is the difference between microseconds and a quarter of an hour.
- 11: A full traversal inside the rotation loop is what makes this O(n·s) — the last node has to be found again on every single rotation.
- 12: `prev` is the second-to-last node, and it becomes the new tail. Tracking it during the walk avoids a second traversal.
- 2: The single-node and empty cases exit here, so `prev` on line 13 can never be null when it is dereferenced.

<!-- @code java -->
```java
static Node rotateRight(Node head, long k) {
    if (head == null || head.next == null) return head;

    int n = 0;
    for (Node p = head; p != null; p = p.next) n++;
    long s = k % n;

    for (long r = 0; r < s; r++) {
        Node prev = null;
        Node p = head;
        while (p.next != null) { prev = p; p = p.next; }
        prev.next = null;
        p.next = head;
        head = p;
    }
    return head;
}
```

<!-- @annotations -->
- 6: `k % n` on a `long`, because k can be 2 × 10⁹ — beyond `int` range in the general case even though it fits here.

<!-- @code python -->
```python
def rotate_right(head, k):
    if head is None or head.next is None:
        return head

    n = 0
    p = head
    while p:
        n += 1
        p = p.next
    s = k % n

    for _ in range(s):
        prev = None
        p = head
        while p.next:
            prev = p
            p = p.next
        prev.next = None
        p.next = head
        head = p
    return head
```

<!-- @annotations -->
- 10: Python integers do not overflow, so `k % n` is safe for any k — but the loop below still runs `s` times, so the reduction is about work, not about width.

<!-- @approach -->
### Collect into an Array and Rebuild

<!-- @idea -->
Put the node pointers in an array, compute each node's new position arithmetically, and rewrite every link.

<!-- @steps -->
1. Walk the list collecting node pointers.
2. Reduce `k` to `s = k mod n`; if `s` is zero, return unchanged.
3. Place the node at index `i` into output slot `(i + s) mod n`.
4. Rewrite every `next` from the output order.
5. Return the first output node.

<!-- @complexity -->
- time: O(n)
- space: O(n)
- note: Genuinely linear and correct on all 128 cases. The index arithmetic makes the rotation obvious, at the price of an n-pointer array and about **2x** the ring version's time.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

Node* rotateRight(Node* head, long long k) {
    vector<Node*> ns;
    for (Node* p = head; p; p = p->next) ns.push_back(p);

    int n = (int)ns.size();
    if (n == 0) return head;
    long long s = k % n;
    if (s == 0) return head;

    vector<Node*> out(n);
    for (int i = 0; i < n; i++) out[(int)((i + s) % n)] = ns[i];
    for (int i = 0; i < n; i++) out[i]->next = (i + 1 < n) ? out[i + 1] : nullptr;
    return out[0];
}
```

<!-- @annotations -->
- 14: `(i + s) % n` is the rotation stated directly — every node moves `s` places right, wrapping. Nothing about linked lists appears in this line.
- 15: Every link is rewritten, including the ones that do not change, which is why this version cannot leave a dangling pointer.
- 9: The empty check comes before the modulo. `k % 0` is undefined behaviour in C++, not an error you will see reported.
- 11: Returning early when `s` is zero avoids rebuilding a list that is already correct.

<!-- @code java -->
```java
static Node rotateRight(Node head, long k) {
    ArrayList<Node> ns = new ArrayList<>();
    for (Node p = head; p != null; p = p.next) ns.add(p);

    int n = ns.size();
    if (n == 0) return head;
    long s = k % n;
    if (s == 0) return head;

    Node[] out = new Node[n];
    for (int i = 0; i < n; i++) out[(int) ((i + s) % n)] = ns.get(i);
    for (int i = 0; i < n; i++) out[i].next = (i + 1 < n) ? out[i + 1] : null;
    return out[0];
}
```

<!-- @annotations -->
- 11: The cast to `int` is safe because `(i + s) % n` is below `n`, which is an `int` — but the addition itself happens in `long` and must, since `s` can be large.

<!-- @code python -->
```python
def rotate_right(head, k):
    ns = []
    p = head
    while p:
        ns.append(p)
        p = p.next

    n = len(ns)
    if n == 0:
        return head
    s = k % n
    if s == 0:
        return head

    out = [None] * n
    for i in range(n):
        out[(i + s) % n] = ns[i]
    for i in range(n):
        out[i].next = out[i + 1] if i + 1 < n else None
    return out[0]
```

<!-- @annotations -->
- 15: `out = [None] * n` then filling by computed index — writing `ns[-s:] + ns[:-s]` is shorter and does the same thing, and is worth preferring in Python.

<!-- @approach -->
### Close the Ring, Then Cut

<!-- @idea -->
Join the tail to the head so the list becomes a circle, walk to the node that should end up last, and break the circle there.

<!-- @steps -->
1. Walk once to find the length `n` and the tail.
2. Reduce to `s = k mod n`; if zero, return unchanged.
3. Point the tail at the head, closing the ring.
4. Walk `n − s` steps from the head — that node is the new tail.
5. The new head is the node after it; set the new tail's `next` to null.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Fastest at every size measured, and the only version with constant space. Handles `k = 2,000,000,000` on a 500-node list in **375ns**. Its walk is `n − s` steps, so a larger rotation is *cheaper*.

<!-- @code cpp -->
```cpp
Node* rotateRight(Node* head, long long k) {
    if (!head || !head->next) return head;

    int n = 1;
    Node* tail = head;
    while (tail->next) { tail = tail->next; n++; }

    long long s = k % n;
    if (s == 0) return head;

    tail->next = head;

    Node* newTail = head;
    for (long long i = 1; i < n - s; i++) newTail = newTail->next;

    Node* newHead = newTail->next;
    newTail->next = nullptr;
    return newHead;
}
```

<!-- @annotations -->
- 5: One traversal produces both the length and the tail. Computing them separately would walk the list twice for no benefit.
- 8: The line the whole problem turns on. Without it the walk on line 14 runs `k` times instead of at most `n − 1`.
- 9: Returning early when `s` is zero also protects line 11 — closing the ring and then not cutting it would leave a circular list.
- 11: The ring is what makes this cheap: the nodes destined for the front are already ahead of the head, so no splicing is needed.
- 14: `i` starts at 1, not 0, so the loop takes `n − s − 1` steps and lands on the node **before** the new head. Starting at 0 walks one node too far and is wrong on 53.12% of inputs.
- 17: Breaking the ring is mandatory. Skip it and the function returns a correct-looking rotation that never terminates when traversed.

<!-- @code java -->
```java
static Node rotateRight(Node head, long k) {
    if (head == null || head.next == null) return head;

    int n = 1;
    Node tail = head;
    while (tail.next != null) { tail = tail.next; n++; }

    long s = k % n;
    if (s == 0) return head;

    tail.next = head;

    Node newTail = head;
    for (long i = 1; i < n - s; i++) newTail = newTail.next;

    Node newHead = newTail.next;
    newTail.next = null;
    return newHead;
}
```

<!-- @annotations -->
- 14: `n - s` mixes `int` and `long` and promotes to `long`, which is correct here — `s` is already below `n`, so the difference is small and positive.

<!-- @code python -->
```python
def rotate_right(head, k):
    if head is None or head.next is None:
        return head

    n = 1
    tail = head
    while tail.next:
        tail = tail.next
        n += 1

    s = k % n
    if s == 0:
        return head

    tail.next = head

    new_tail = head
    for _ in range(n - s - 1):
        new_tail = new_tail.next

    new_head = new_tail.next
    new_tail.next = None
    return new_head
```

<!-- @annotations -->
- 18: `range(n - s - 1)` says the step count directly, where the C++ loop expresses the same thing as `i` from 1 below `n - s`. Both take `n − s − 1` steps.
- 15: Closing the ring before the walk means `new_tail` can never run off the end, even though the walk length is computed from `n`.

<!-- @example -->

<!-- @input -->
```
1 -> 2 -> 3 -> 4 -> 5,  k = 2
```

<!-- @output -->
```
4 -> 5 -> 1 -> 2 -> 3
```

<!-- @why -->
The last two nodes move to the front in order. Closing the ring puts them there already; the only decision left is where to break it.

<!-- @walkthrough -->
```
n = 5,  s = 2 % 5 = 2

close the ring:   tail 5 -> head 1
walk n - s = 3 steps from the head:   1 -> 2 -> 3
  new tail = 3
  new head = 4
break after 3

4 -> 5 -> 1 -> 2 -> 3

Only two pointers changed: one added to close the ring, one
cleared to break it. Nothing was spliced.
```

<!-- @example -->

<!-- @input -->
```
0 -> 1 -> 2,  k = 4
```

<!-- @output -->
```
2 -> 0 -> 1
```

<!-- @why -->
`k` exceeds the length. Four rotations of three nodes is one rotation, which `k mod n` reduces before any work happens.

<!-- @walkthrough -->
```
n = 3,  s = 4 % 3 = 1

close the ring:   tail 2 -> head 0
walk n - s = 2 steps:   0 -> 1
  new tail = 1
  new head = 2
break after 1

2 -> 0 -> 1

Without the modulo the walk would be n - k = -1 steps,
which as an unsigned or looping quantity means the code
either misbehaves or runs k times.
```

<!-- @example -->

<!-- @input -->
```
1 -> 2,  k = 1
```

<!-- @output -->
```
2 -> 1
```

<!-- @why -->
The smallest input that catches the off-by-one in the walk length. Walking one step too far returns the list unchanged, which is indistinguishable from a correct `s = 0` result.

<!-- @walkthrough -->
```
n = 2,  s = 1

correct:   walk n - s - 1 = 0 steps    new tail = 1, new head = 2
           ->  2 -> 1                                    correct

one too far: walk 1 step               new tail = 2, new head = 1
           ->  1 -> 2                                    WRONG

Measured over 128 cases the extra step is wrong on 53.12%,
and it fails by returning the input, which is the same thing
a correct implementation returns when s = 0.
```

<!-- @example -->

<!-- @input -->
```
1 -> 2 -> 3,  k = 3
```

<!-- @output -->
```
1 -> 2 -> 3
```

<!-- @why -->
Rotating by the length is the identity, so `s` is zero and the function returns before touching anything. This is also why the early return has to come *before* the ring is closed.

<!-- @walkthrough -->
```
n = 3,  s = 3 % 3 = 0

s == 0  ->  return head, unchanged

If the early return were missing and the ring were closed
anyway, the walk would be n - 0 = 3 steps, landing back on
the head, and the cut would produce the same list — but a
version that closes the ring and forgets to cut returns a
circular list that traverses forever.
```

<!-- @visualization custom -->

<!-- @description -->
Shows why `k mod n` is the whole problem, the ring-and-cut construction, and the counterintuitive fact that a larger rotation is a shorter walk.

<!-- @sampleInput -->
```json
{"primary":{"list":[1,2,3,4,5],"k":2,"n":5,"s":2,"answer":[4,5,1,2,3],"steps":["close the ring: tail 5 -> head 1","walk n - s = 3 steps from the head: 1 -> 2 -> 3","new tail = 3, new head = 4","break after 3"],"pointersChanged":2,"note":"one link added to close the ring, one cleared to break it - nothing spliced"},"theModuloIsTheAlgorithm":{"fact":"rotating right by n is the identity, so only s = k mod n matters","constraints":"LeetCode 61 allows k up to 2,000,000,000 with n at most 500","unreducedCost":{"unit":"one step at a time, n = 500","rows":[{"k":500,"totalNs":217083,"nsPerRotation":434.2},{"k":100000,"totalNs":39279125,"nsPerRotation":392.8},{"k":10000000,"totalNs":4455901334,"nsPerRotation":445.6}],"perRotationIsFlat":"about 440ns across four orders of magnitude","extrapolation":"at k = 2e9 that is roughly 890 seconds, about 15 minutes","ringAndCutOnTheSameInput":"375 nanoseconds"}},"walkLengthRunsBackwards":{"formula":"n - s steps","rows":[{"n":5,"s":1,"walk":4},{"n":5,"s":2,"walk":3},{"n":5,"s":3,"walk":2},{"n":5,"s":4,"walk":1}],"claim":"a bigger rotation is a SHORTER walk","measured":{"n":5000,"rotateBy1":13000,"rotateBy4999":2208,"ratio":"5.9x cheaper"},"reading":"the reverse of what the phrase 'rotate by 4,999' suggests"},"offByOne":{"correct":"n - s steps land on the node BEFORE the new head, which is the new tail","wrong":"one step further lands on the new head itself and cuts in the wrong place","measured":{"space":"every list of length 0..7, every k from 0..15","cases":128,"wrong":68,"pct":53.12},"smallestFailure":{"list":[1,2],"k":1,"correct":[2,1],"got":[1,2]},"whyItHides":"it returns the list unchanged, which is exactly what a correct implementation returns when s = 0"},"reducingKIsNecessaryNotSufficient":{"note":"k already reduced in every version, so this is a fair comparison","unit":"nanoseconds","rows":[{"n":500,"s":1,"ringAndCut":1750,"oneAtATime":1833,"viaArray":6167},{"n":500,"s":250,"ringAndCut":1375,"oneAtATime":220333,"viaArray":6000},{"n":500,"s":499,"ringAndCut":833,"oneAtATime":434875,"viaArray":6541},{"n":5000,"s":2500,"ringAndCut":4917,"oneAtATime":14178500,"viaArray":16000},{"n":5000,"s":4999,"ringAndCut":2208,"oneAtATime":17640250,"viaArray":15875},{"n":50000,"s":25000,"ringAndCut":60667,"oneAtATime":null,"viaArray":119375}],"oneAtATimeAfterReduction":"O(n^2) rather than O(n*k) - bounded, and still not viable","worstGap":"2,884x at n = 5,000","viaArray":"genuinely O(n), loses to the ring by about 2x on allocation alone, plus O(n) space"},"whyTheRingHelps":{"idea":"make the list circular for a moment","effect":"the nodes destined for the front are already ahead of the head, so no splicing is needed","cost":"one link added, one link removed","mandatory":"breaking the ring - skip it and the function returns a correct-looking rotation that never terminates when traversed"},"assertions":["rotating right by n is the identity","only s = k mod n affects the result","the walk is n - s - 1 steps from the head to the new tail","the ring must be closed before the walk and broken after it","s = 0 must return before the ring is closed"]}
```

<!-- @highlights -->
- `k mod n` is the whole problem: LeetCode 61 allows **k = 2×10⁹** on n ≤ 500.
- One step at a time costs ~440ns per rotation — an extrapolated **15 minutes** at that k, against **375 ns** for ring-and-cut.
- Closing the ring means the nodes that must move to the front are already there: **one link added, one removed**, nothing spliced.
- The walk is `n − s` steps, so **a bigger rotation is a shorter walk** — 5.9× cheaper to rotate 5,000 nodes by 4,999 than by 1.
- Walking one step too far is wrong on **53.12%**, and it fails by returning the input — which is what a correct `s = 0` also returns.
- Reducing k is necessary but not sufficient: one-at-a-time is still O(n²) and **2,884×** behind at n = 5,000.

<!-- @edgeCases -->
- `k = 0` — `s` is zero, return before touching anything.
- `k = n`, or any multiple — same; the identity, and why the early return precedes closing the ring.
- `k > n` — the case that makes the modulo mandatory rather than an optimisation.
- `k = n − 1` — the largest rotation and the *shortest* walk, one step.
- Empty list — exit before computing `n`, since `k % 0` is undefined behaviour in C++.
- Single node — the identity for every k; the guard on line 2 covers it.
- Two nodes with `k = 1` — the smallest input that exposes the walk off-by-one.
- Closing the ring and forgetting to break it — returns a circular list that looks right until something traverses it.
- `k` larger than `int` — LeetCode 61's 2 × 10⁹ exceeds a signed 32-bit int's range in the general case.

<!-- @pitfalls -->
- Not reducing `k` by `n`. Turns microseconds into an extrapolated quarter of an hour at the stated limits.
- Walking `n − s` steps instead of `n − s − 1`. Wrong on 53.12%, and it fails by returning the input unchanged.
- Closing the ring before checking `s == 0`. The list is then circular and the cut never happens.
- Forgetting to set the new tail's `next` to null. A traversal of the result never terminates.
- Computing `k % n` before checking the list is non-empty. `% 0` is undefined behaviour, not a caught error.
- Rotating left instead of right. Left by `s` is right by `n − s`; the walk length swaps accordingly.
- Assuming a large `k` is the slow case for the ring version. It is the fast one — the walk is `n − s`.
- Traversing twice to find the length and the tail. One pass gives both.

<!-- @doubt -->
### Why does `k mod n` matter so much here?

<!-- @answer -->
Because `k` is not bounded by the data. LeetCode 61 allows `k` up to **2,000,000,000** while `n` is at most 500, so an implementation whose cost depends on `k` rather than on `n` is not slow, it is unusable. Measured at n = 500, rotating one step at a time costs about **440 nanoseconds per rotation** and that figure is flat from k = 500 through k = 10,000,000 — where it takes **4.46 seconds**. Extrapolating the same rate to k = 2 × 10⁹ gives roughly **890 seconds, about 15 minutes**. The ring-and-cut version handles that exact input in **375 nanoseconds**. Rotating by `n` is the identity, so `s = k mod n` is not an optimisation that loses nothing — it is the observation that makes the problem finite. The habit generalises: when a parameter can dwarf the data, reduce it against the data before doing anything else.

<!-- @doubt -->
### Why walk `n − s − 1` steps and not `n − s`?

<!-- @answer -->
Because the walk has to stop on the new **tail**, which is the node *before* the new head. Starting from the head and taking `n − s − 1` steps lands there; taking `n − s` steps lands on the new head itself, and cutting after it puts the boundary one node late. Measured over every list of length 0 to 7 with every k from 0 to 15 — **128 cases** — the extra step is wrong on **68, or 53.12%**. What makes it nasty is the failure mode: on `1 -> 2` with `k = 1` it returns `1 -> 2`, the input unchanged, which is precisely what a correct implementation returns whenever `s = 0`. So a spot check that happens to use a multiple of `n` will pass. The C++ loop writes this as `i` from 1 while `i < n - s`, and Python as `range(n - s - 1)`; both take the same number of steps, and it is worth writing whichever form you find harder to get wrong.

<!-- @doubt -->
### Why is rotating by a large amount faster than rotating by one?

<!-- @answer -->
Because the walk is `n − s` steps, and `s` is the amount of rotation. Rotating by 1 means walking almost the whole list to find the new tail; rotating by `n − 1` means walking a single step. Measured on a 5,000-node list, rotating by 1 takes **13,000ns** and rotating by 4,999 takes **2,208ns** — the larger rotation is **5.9x cheaper**. This reads backwards at first because "rotate by 4,999" sounds like more work than "rotate by 1", but the algorithm never performs rotations; it computes where the boundary falls and moves it once. If the asymmetry bothers you, note that rotating right by `s` is rotating left by `n − s`, so the two directions have mirrored cost profiles and there is no way to be fast at both from the head — a doubly linked list, which can walk backwards, is what removes the asymmetry.

<!-- @doubt -->
### Is closing the ring necessary, or just tidy?

<!-- @answer -->
It is not strictly necessary — you can find the new tail, save the node after it, walk on to the old tail and point it at the old head — but the ring makes the operation two pointer writes instead of a sequence of splices, and removes the need to hold several nodes at once. The reason it helps is worth stating: once the list is circular, the nodes that must end up at the front are *already* in front of the head, so the rotation stops being a move and becomes a choice of where to cut. That is why the measured cost is so low — **375ns** on a 500-node list regardless of `k`. The one obligation the ring creates is that it must be broken: `newTail->next = nullptr` is not optional, and omitting it returns a list whose values are in the right order and whose traversal never ends. That failure is invisible to anything that reads a fixed number of nodes and fatal to anything that reads until null.

<!-- @doubt -->
### Does reducing `k` make the one-step-at-a-time version acceptable?

<!-- @answer -->
It makes it bounded, not acceptable. With `s = k mod n` the loop runs at most `n − 1` times and each rotation walks the list to find the last node, so the cost is `O(n²)` instead of `O(n · k)`. Measured with `k` already reduced: at n = 500 with s = 499 it takes **434,875ns** against the ring's **833ns**, and at n = 5,000 with s = 2,500 it takes **14,178,500ns** against **4,917ns — a factor of 2,884**. At n = 50,000 it was too slow to include. The array version is the honest middle ground: genuinely O(n), correct on all 128 exhaustive cases, about **2x** slower than the ring and needing O(n) space for the pointer array. So the ordering is clear — reduce `k` always, and then close the ring rather than iterate.
