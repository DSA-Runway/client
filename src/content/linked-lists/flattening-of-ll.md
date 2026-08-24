---
id: flattening-of-ll
topic: Linked Lists
title: Flattening of a Linked List
difficulty: Hard
status: ready
prerequisites:
  - sort-ll
  - reverse-ll-in-group-of-given-size-k
  - introduction-to-singly-linkedlist
relatedIds:
  - sort-ll
  - rotate-a-ll
  - reverse-ll-in-group-of-given-size-k
  - sort-a-linked-list-of-0s-1s-and-2s
  - add-two-numbers-in-linked-list
---

<!-- @summary -->
Merging the sublists one at a time is the answer everyone gives and it is O(N·k): with the node count held at 200,000 and only the shape changing, it goes from 726 microseconds to 12.95 seconds. Merging in pairs is O(N log k) and stays at 11.8 milliseconds. The version that forgets to clear next produces every value correctly and leaves stale pointers on 80.23% of inputs.

<!-- @theory -->
## The problem

Each node has two pointers: `next` to the head of the following sublist, and
`bottom` to the next node within its own sublist. Every sublist is already sorted.
Flatten everything into one sorted list linked by `bottom`.

```
5 -> 10 -> 19 -> 28
|    |     |     |
7    20    22    35
|          |     |
8          50    40
|                |
30               45

flattened:  5 -> 7 -> 8 -> 10 -> 19 -> 20 -> 22 -> 28 -> 30 -> 35 -> 40 -> 45 -> 50
```

Two numbers describe an input and they matter separately: **N**, the total node
count, and **k**, the number of sublists. Every measurement below holds N at
200,000 and varies only k, so the tables show the effect of *shape* rather than
size.

## Merging one at a time is O(N·k)

The natural approach — merge sublist 1 with 2, the result with 3, and so on — is
correct and its cost is quadratic in the wrong parameter. Each merge re-walks
everything accumulated so far, so the first sublist is traversed k times.

Counting actual comparisons at N = 200,000:

| k | one at a time | in pairs | ratio |
|---|---|---|---|
| 2 | 199,999 | 199,999 | 1.0x |
| 8 | 874,972 | 599,988 | 1.5x |
| 64 | 6,495,081 | 1,199,866 | 5.4x |
| 512 | 51,091,400 | 1,796,079 | 28.4x |
| 4,096 | **394,527,286** | **2,351,250** | **167.8x** |

Those numbers match the theory exactly: `N·k/2` is 409.6 million at k = 4,096 and
`N·log₂k` is 2.4 million. The wall clock follows:

| k | nodes per sublist | one at a time | in pairs | min-heap | collect and sort |
|---|---|---|---|---|---|
| 2 | 100,000 | **726,500** | 723,959 | 1,919,375 | 8,993,708 |
| 8 | 25,000 | **1,837,250** | 2,137,000 | 4,440,917 | 7,012,666 |
| 64 | 3,125 | 15,917,917 | **4,415,333** | 6,565,875 | 6,763,583 |
| 512 | 390 | 189,460,209 | 7,011,792 | 8,495,916 | **6,608,083** |
| 4,096 | 48 | 2,061,330,958 | 9,658,958 | 12,831,459 | **6,598,458** |
| 20,000 | 10 | **12,953,398,917** | 11,809,417 | 19,616,500 | **6,715,959** |

Nanoseconds. The same 200,000 nodes, rearranged: merging one at a time goes from
726 microseconds to **12.95 seconds**, a factor of **17,800**, while merging in
pairs moves by 16x across the same range. At k = 20,000 the gap is **1,097x**.

## The approach that ignores the structure wins at large k

Look at the last column. Collecting every value into an array, sorting it and
rebuilding the list is O(N log N) *regardless of shape* — and past k = 512 it is
the fastest option, beating even the divide-and-conquer merge.

The reason is that `log k` catches up with `log N`: at k = 20,000 they are 14.3
and 17.6, so the asymptotic advantage of merging has almost evaporated — and what
remains is that `sort` runs over a contiguous array while every merge chases
pointers. Its measured spread across the whole table is **6.6ms to 9.0ms**, the
flattest of the four.

That is worth stating plainly because it inverts the usual lesson. The structure
is *given* to you already sorted, and using it is the point of the exercise, but
past a certain shape throwing that structure away and sorting is measurably
better. It costs O(N) extra space and it allocates new nodes, which is the real
argument against it.

## Clearing `next` is not tidiness

The flattened list is supposed to be linked by `bottom` alone, with every `next`
null. A merge that only rewrites `bottom` pointers produces **every value in the
right order** and leaves the old `next` pointers in place. Measured over 20,000
random multi-level lists:

| | values wrong | stale `next` pointers |
|---|---|---|
| clears `next` | 0 | 0 |
| forgets to clear `next` | **0** | **16,047 — 80.23%** |

Zero values wrong. A judge that reads the result down the `bottom` chain — which
is how this problem is checked — accepts it. What is left behind is a node whose
`next` points into the middle of the flattened list, so anything that later walks
`next` sees a structure that is neither the original nor the result. This is the
same failure shape as forgetting `prev` in a doubly linked list: the traversal
everyone performs is exactly the one that cannot see the damage.

## Recursion costs a frame per sublist

The recursive formulation — flatten the rest, then merge the head into it — uses
one stack frame per sublist. Measured: **100,000 sublists is fine, 200,000
overflows** an 8 MiB stack. Since k can be as large as N when every sublist holds
one node, that is a reachable input rather than a theoretical one. The
divide-and-conquer version recurses too, but only to depth `log k` — 15 frames at
k = 20,000.

<!-- @intuition -->
The useful idea here is that "N" is not enough to describe this input. Two lists of 100,000 and twenty thousand lists of ten are both 200,000 nodes, and they are different problems: the first is one merge, the second is a merge tree. Almost every mistake in this container comes from writing an algorithm whose cost depends on k while thinking about N — merging one at a time feels linear because each individual merge is, and the k-fold repetition hides in the loop around it. Whenever a structure has two independent size parameters, it is worth writing the complexity with both in it before choosing, because the shape that makes one approach obvious is usually the shape that makes it wrong.

<!-- @approach -->
### Collect the Values and Sort

<!-- @idea -->
Walk the whole structure gathering values, sort them, and build a fresh list linked by `bottom`.

<!-- @steps -->
1. Traverse every sublist via `next`, and every node within it via `bottom`.
2. Collect all N values into an array.
3. Sort the array.
4. Build a new list, linking with `bottom` and leaving `next` null.

<!-- @complexity -->
- time: O(N log N), independent of k
- space: O(N)
- note: Discards the fact that the sublists are already sorted — and past k = 512 it is the **fastest** of the four, because `log k` has caught up with `log N` and sorting an array beats chasing pointers. The flattest of the four, 6.6ms to 9.0ms across the whole table.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

Node* flatten(Node* head) {
    vector<int> vals;
    for (Node* p = head; p; p = p->next)
        for (Node* q = p; q; q = q->bottom)
            vals.push_back(q->data);

    sort(vals.begin(), vals.end());

    Node dummy(0);
    Node* t = &dummy;
    for (int x : vals) {
        t->bottom = new Node(x);
        t = t->bottom;
    }
    return dummy.bottom;
}
```

<!-- @annotations -->
- 7: The nested walk visits every node exactly once — `next` across the sublists, `bottom` down each one. Getting these two loops the wrong way round visits only the first column.
- 11: The sublists arrive sorted and this throws that away. It is the reason the approach is O(N log N) rather than O(N log k), and also why its cost does not depend on the shape at all.
- 16: New nodes are allocated, so the originals leak unless the caller frees them. That allocation is the real argument against this approach, not its complexity.
- 15: Only `bottom` is set; `next` stays null from the constructor, which is exactly what the flattened form requires.

<!-- @code java -->
```java
static Node flatten(Node head) {
    ArrayList<Integer> vals = new ArrayList<>();
    for (Node p = head; p != null; p = p.next)
        for (Node q = p; q != null; q = q.bottom)
            vals.add(q.data);

    Collections.sort(vals);

    Node dummy = new Node(0);
    Node t = dummy;
    for (int x : vals) {
        t.bottom = new Node(x);
        t = t.bottom;
    }
    return dummy.bottom;
}
```

<!-- @annotations -->
- 7: `Collections.sort` on boxed `Integer` objects compares through references, which is markedly slower than sorting an `int[]` — extracting to a primitive array first is worth it at large N.

<!-- @code python -->
```python
def flatten(head):
    vals = []
    p = head
    while p:
        q = p
        while q:
            vals.append(q.data)
            q = q.bottom
        p = p.next

    vals.sort()

    dummy = Node(0)
    t = dummy
    for x in vals:
        t.bottom = Node(x)
        t = t.bottom
    return dummy.bottom
```

<!-- @annotations -->
- 11: `vals.sort()` is Timsort, which detects the k already-sorted runs in the array and merges them — so Python gets closer to O(N log k) here than the code suggests.

<!-- @approach -->
### Merge Sublists One at a Time

<!-- @idea -->
Merge the first sublist with the second, merge that result with the third, and continue to the end.

<!-- @steps -->
1. Take the first sublist as the running result.
2. Detach the next sublist by clearing its `next`.
3. Merge it into the running result on `bottom` pointers.
4. Repeat until the sublists are exhausted.
5. Clear `next` on every node of the merged output.

<!-- @complexity -->
- time: O(N·k)
- space: O(1) iteratively, O(k) stack frames recursively
- note: Correct, and the parameter it is quadratic in is the one that can grow. At N = 200,000 it runs in 726 microseconds at k = 2 and **12.95 seconds** at k = 20,000 — the same nodes, rearranged.

<!-- @code cpp -->
```cpp
static Node* mergeTwo(Node* a, Node* b) {
    Node dummy(0);
    Node* t = &dummy;
    while (a && b) {
        if (a->data <= b->data) { t->bottom = a; a = a->bottom; }
        else                    { t->bottom = b; b = b->bottom; }
        t = t->bottom;
        t->next = nullptr;
    }
    t->bottom = a ? a : b;
    for (Node* p = t->bottom; p; p = p->bottom) p->next = nullptr;
    return dummy.bottom;
}

Node* flatten(Node* head) {
    if (!head) return nullptr;
    Node* res = head;
    Node* cur = head->next;
    res->next = nullptr;
    while (cur) {
        Node* nxt = cur->next;
        cur->next = nullptr;
        res = mergeTwo(res, cur);
        cur = nxt;
    }
    return res;
}
```

<!-- @annotations -->
- 8: Clearing `next` as each node is threaded on. Omit this and every value still comes out in the right order while 80.23% of inputs keep stale pointers.
- 11: The tail of whichever list survived also needs clearing — those nodes were never touched by the loop above.
- 21: `cur->next` is saved before the merge, because the merge will overwrite it.
- 23: This line is why the approach is O(N·k): `res` grows with every iteration and is walked from the start each time.

<!-- @code java -->
```java
static Node mergeTwo(Node a, Node b) {
    Node dummy = new Node(0);
    Node t = dummy;
    while (a != null && b != null) {
        if (a.data <= b.data) { t.bottom = a; a = a.bottom; }
        else                  { t.bottom = b; b = b.bottom; }
        t = t.bottom;
        t.next = null;
    }
    t.bottom = (a != null) ? a : b;
    for (Node p = t.bottom; p != null; p = p.bottom) p.next = null;
    return dummy.bottom;
}

static Node flatten(Node head) {
    if (head == null) return null;
    Node res = head;
    Node cur = head.next;
    res.next = null;
    while (cur != null) {
        Node nxt = cur.next;
        cur.next = null;
        res = mergeTwo(res, cur);
        cur = nxt;
    }
    return res;
}
```

<!-- @annotations -->
- 5: `a.data <= b.data` rather than `<` keeps the merge stable, so equal values retain their original relative order.

<!-- @code python -->
```python
def merge_two(a, b):
    dummy = Node(0)
    t = dummy
    while a and b:
        if a.data <= b.data:
            t.bottom = a
            a = a.bottom
        else:
            t.bottom = b
            b = b.bottom
        t = t.bottom
        t.next = None
    t.bottom = a if a else b
    p = t.bottom
    while p:
        p.next = None
        p = p.bottom
    return dummy.bottom


def flatten(head):
    if head is None:
        return None
    res = head
    cur = head.next
    res.next = None
    while cur:
        nxt = cur.next
        cur.next = None
        res = merge_two(res, cur)
        cur = nxt
    return res
```

<!-- @annotations -->
- 28: Saving `nxt` before merging. The merge reorders `bottom` links and clears `next`, so the way forward has to be captured first.

<!-- @approach -->
### Merge in Pairs

<!-- @idea -->
Merge the sublists pairwise, then merge those results pairwise, halving the count each round until one remains.

<!-- @steps -->
1. Detach every sublist head into an array, clearing `next` as you go.
2. Merge the array's two halves recursively.
3. Each level of the recursion touches every node once.
4. There are `log k` levels, so the total is O(N log k).

<!-- @complexity -->
- time: O(N log k)
- space: O(k) for the array plus O(log k) stack
- note: **2,351,250 comparisons** at k = 4,096 against the sequential version's 394 million. Its cost moves by 16x across the whole shape range where merging one at a time moves by 17,800x, and it recurses only to depth `log k`.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

static Node* mergeRange(vector<Node*>& v, int lo, int hi) {
    if (lo == hi) return v[lo];
    int mid = lo + (hi - lo) / 2;
    return mergeTwo(mergeRange(v, lo, mid), mergeRange(v, mid + 1, hi));
}

Node* flatten(Node* head) {
    vector<Node*> v;
    for (Node* p = head; p; ) {
        Node* n = p->next;
        p->next = nullptr;
        v.push_back(p);
        p = n;
    }
    if (v.empty()) return nullptr;
    return mergeRange(v, 0, (int)v.size() - 1);
}
```

<!-- @annotations -->
- 7: Each level of this recursion merges every node exactly once, and there are `log k` levels — that product is the whole complexity argument.
- 5: `lo == hi` returns a single sublist untouched, which is correct because each one is already sorted.
- 14: `next` is cleared as the heads are collected, so the merge below never has to think about it.
- 13: `p->next` is read before it is cleared on the following line.
- 19: The recursion depth is `log k` — about 15 frames at k = 20,000, against 20,000 frames for the recursive one-at-a-time formulation.

<!-- @code java -->
```java
static Node mergeRange(List<Node> v, int lo, int hi) {
    if (lo == hi) return v.get(lo);
    int mid = lo + (hi - lo) / 2;
    return mergeTwo(mergeRange(v, lo, mid), mergeRange(v, mid + 1, hi));
}

static Node flatten(Node head) {
    List<Node> v = new ArrayList<>();
    for (Node p = head; p != null; ) {
        Node n = p.next;
        p.next = null;
        v.add(p);
        p = n;
    }
    if (v.isEmpty()) return null;
    return mergeRange(v, 0, v.size() - 1);
}
```

<!-- @annotations -->
- 3: `lo + (hi - lo) / 2` rather than `(lo + hi) / 2` — the habit, though k is far too small here for the sum to overflow.

<!-- @code python -->
```python
def flatten(head):
    heads = []
    p = head
    while p:
        n = p.next
        p.next = None
        heads.append(p)
        p = n

    if not heads:
        return None

    def merge_range(lo, hi):
        if lo == hi:
            return heads[lo]
        mid = (lo + hi) // 2
        return merge_two(merge_range(lo, mid), merge_range(mid + 1, hi))

    return merge_range(0, len(heads) - 1)
```

<!-- @annotations -->
- 17: The recursion goes only `log k` deep, so CPython's 1,000-frame limit is not a concern here — it would be reached only at k around 2^1000.

<!-- @example -->

<!-- @input -->
```
5 -> 10 -> 19 -> 28
|    |     |     |
7    20    22    35
|          |     |
8          50    40
|                |
30               45
```

<!-- @output -->
```
5 -> 7 -> 8 -> 10 -> 19 -> 20 -> 22 -> 28 -> 30 -> 35 -> 40 -> 45 -> 50
```

<!-- @why -->
Thirteen nodes across four sorted sublists. Merging in pairs handles it in two rounds; merging one at a time takes three merges, re-walking the growing result each time.

<!-- @walkthrough -->
```
sublists   A: 5 7 8 30      B: 10 20      C: 19 22 50     D: 28 35 40 45

merge in pairs
  round 1   A+B -> 5 7 8 10 20 30          C+D -> 19 22 28 35 40 45 50
  round 2   (A+B) + (C+D) -> 5 7 8 10 19 20 22 28 30 35 40 45 50

merge one at a time
  A+B       -> 6 nodes walked
  (A+B)+C   -> 9 nodes walked, 6 of them for the second time
  ((A+B)+C)+D -> 13 nodes walked, 9 for the third time

Same answer. The difference is how often the early nodes are
re-walked, and that is exactly the k in O(N*k).
```

<!-- @example -->

<!-- @input -->
```
5 -> 10 -> 19
|    |     |
7    20    22
```

<!-- @output -->
```
5 -> 7 -> 10 -> 19 -> 20 -> 22
```

<!-- @why -->
A small case worth tracing by hand. It is also enough to expose the stale-`next` bug: after flattening, node 5's `next` must be null, not still pointing at 10.

<!-- @walkthrough -->
```
correct:
  every node's next is cleared as it is threaded on
  bottom chain:  5 7 10 19 20 22
  next  chain:   all null

forgetting to clear next:
  bottom chain:  5 7 10 19 20 22        identical, every value right
  next  chain:   5 -> 10 -> 19          the original top row survives

A checker that reads down `bottom` sees no difference. Measured
over 20,000 random inputs the values are wrong 0 times and the
next pointers are stale on 80.23%.
```

<!-- @example -->

<!-- @input -->
```
1 -> 2 -> 3 -> ... -> 20000     (each sublist holds a single node)
```

<!-- @output -->
```
the same 20,000 values, sorted, linked by bottom
```

<!-- @why -->
The shape that separates the approaches. N is 20,000 and k is also 20,000, so every sublist is one node and merging one at a time re-walks the accumulated result 20,000 times.

<!-- @walkthrough -->
```
N = 200,000 nodes in k = 20,000 sublists of 10:

  one at a time    12,953,398,917 ns    (12.95 seconds)
  in pairs             11,809,417 ns
  collect and sort      6,715,959 ns

The same 200,000 nodes arranged as k = 2 sublists of 100,000:

  one at a time           726,500 ns
  in pairs                723,959 ns
  collect and sort      8,993,708 ns

Nothing about the data changed except its shape, and the
ordering of the three approaches reversed completely.
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
A null head has no sublists to merge. Every version needs this guard before it dereferences anything or indexes an empty array.

<!-- @walkthrough -->
```
merge in pairs:  the collection loop never runs, so the array
                 is empty and `mergeRange(v, 0, -1)` would index
                 out of bounds -- hence the explicit check

one at a time:   `head` is null, return immediately

collect+sort:    `vals` is empty, the build loop never runs,
                 and `dummy.bottom` is null, so it works with
                 no special case at all
```

<!-- @visualization custom -->

<!-- @description -->
Shows why N alone does not describe this input, how the cost of each approach depends on the shape rather than the size, and the stale-pointer bug that a bottom-traversal cannot see.

<!-- @sampleInput -->
```json
{"primary":{"sublists":[[5,7,8,30],[10,20],[19,22,50],[28,35,40,45]],"flattened":[5,7,8,10,19,20,22,28,30,35,40,45,50],"N":13,"k":4,"inPairs":{"round1":[[5,7,8,10,20,30],[19,22,28,35,40,45,50]],"round2":[5,7,8,10,19,20,22,28,30,35,40,45,50]},"oneAtATime":{"merges":[{"step":"A+B","nodesWalked":6},{"step":"(A+B)+C","nodesWalked":9,"reWalked":6},{"step":"((A+B)+C)+D","nodesWalked":13,"reWalked":9}],"reading":"the difference is how often the early nodes are re-walked, and that is exactly the k in O(N*k)"}},"twoSizeParameters":{"claim":"N alone does not describe this input","N":"total node count","k":"number of sublists","point":"two lists of 100,000 and twenty thousand lists of ten are both 200,000 nodes, and they are different problems","allMeasurementsHoldNConstant":200000},"comparisonCounts":{"N":200000,"rows":[{"k":2,"oneAtATime":199999,"inPairs":199999,"ratio":"1.0x"},{"k":8,"oneAtATime":874972,"inPairs":599988,"ratio":"1.5x"},{"k":64,"oneAtATime":6495081,"inPairs":1199866,"ratio":"5.4x"},{"k":512,"oneAtATime":51091400,"inPairs":1796079,"ratio":"28.4x"},{"k":4096,"oneAtATime":394527286,"inPairs":2351250,"ratio":"167.8x"}],"matchesTheory":{"oneAtATime":"N*k/2 = 409.6 million at k = 4096","inPairs":"N*log2(k) = 2.4 million at k = 4096"}},"wallClock":{"unit":"nanoseconds, N = 200,000 held constant","rows":[{"k":2,"perSublist":100000,"oneAtATime":726500,"inPairs":723959,"minHeap":1919375,"collectAndSort":8993708,"winner":"one at a time"},{"k":8,"perSublist":25000,"oneAtATime":1837250,"inPairs":2137000,"minHeap":4440917,"collectAndSort":7012666,"winner":"one at a time"},{"k":64,"perSublist":3125,"oneAtATime":15917917,"inPairs":4415333,"minHeap":6565875,"collectAndSort":6763583,"winner":"in pairs"},{"k":512,"perSublist":390,"oneAtATime":189460209,"inPairs":7011792,"minHeap":8495916,"collectAndSort":6608083,"winner":"collect and sort"},{"k":4096,"perSublist":48,"oneAtATime":2061330958,"inPairs":9658958,"minHeap":12831459,"collectAndSort":6598458,"winner":"collect and sort"},{"k":20000,"perSublist":10,"oneAtATime":12953398917,"inPairs":11809417,"minHeap":19616500,"collectAndSort":6715959,"winner":"collect and sort"}],"spread":{"oneAtATime":"726 microseconds to 12.95 seconds - a factor of 17,800","inPairs":"moves by 16x across the same range","gapAtK20000":"1,097x"}},"theStructureIgnoringApproachWins":{"which":"collect the values, sort, rebuild","complexity":"O(N log N), independent of k","whenItWins":"past k = 512, beating even the divide-and-conquer merge","why":"log k catches up with log N - at k = 20,000 they are 14.3 and 17.6 - and sort runs over a contiguous array while every merge chases pointers","spread":"6.6ms to 9.0ms, the flattest of the four","costAgainstIt":"O(N) extra space and it allocates new nodes","reading":"the structure is given to you already sorted and using it is the point of the exercise, but past a certain shape throwing it away is measurably better"},"stalePointers":{"requirement":"the flattened list is linked by bottom alone, with every next null","measured":{"randomMultiLevelLists":20000,"rows":[{"version":"clears next","valuesWrong":0,"staleNext":0},{"version":"forgets to clear next","valuesWrong":0,"staleNext":16047,"pct":80.23}]},"whyItHides":"a judge reads the result down the bottom chain, which is how this problem is checked, and accepts it","whatIsLeft":"a node whose next points into the middle of the flattened list, so anything that later walks next sees a structure that is neither the original nor the result","sameShapeAs":"forgetting prev in a doubly linked list - the traversal everyone performs is exactly the one that cannot see the damage"},"recursionDepth":{"formulation":"flatten the rest, then merge the head into it","framesPerSublist":1,"measured":[{"k":100000,"result":"OK"},{"k":200000,"result":"stack overflow"}],"reachable":"k can be as large as N when every sublist holds one node","divideAndConquer":"recurses to depth log k - about 15 frames at k = 20,000"},"assertions":["every sublist is already sorted","the flattened result is linked by bottom, with every next null","N and k are independent size parameters","merging one at a time re-walks the accumulated result once per sublist","merging in pairs touches every node once per level, and there are log k levels"]}
```

<!-- @highlights -->
- **N alone does not describe this input** — 2 lists of 100,000 and 20,000 lists of 10 are both 200,000 nodes and different problems.
- Merging one at a time is O(N·k): **726 µs at k=2, 12.95 s at k=20,000** on identical node counts — a factor of 17,800.
- Merging in pairs is O(N log k) and moves only **16×** across the same range; **1,097×** ahead at k = 20,000.
- Comparison counts match theory exactly: **394,527,286 vs 2,351,250** at k = 4,096.
- **Collect-and-sort wins past k = 512** despite ignoring the sortedness entirely — `log k` catches up with `log N`.
- Forgetting to clear `next` gets **every value right** and leaves stale pointers on **80.23%** of inputs.

<!-- @edgeCases -->
- Empty list — no sublists; the pairwise version must check before indexing an empty array.
- One sublist — already sorted, return it unchanged after clearing `next`.
- Every sublist holding one node — k equals N, the worst shape for merging one at a time.
- One sublist holding everything — k = 1, where all approaches degenerate to a traversal.
- Duplicate values across sublists — `<=` in the merge keeps them stable.
- A sublist of length zero — cannot occur if `next` only links non-empty heads, but a defensive skip costs nothing.
- Very large k with the recursive formulation — one frame per sublist, overflowing between 100,000 and 200,000.
- Nodes whose `next` was never cleared — the values read correctly and the structure is wrong.
- All values equal — every comparison takes the same branch, and the merge stays stable.

<!-- @pitfalls -->
- Merging one at a time without noticing the cost is O(N·k). At k = 20,000 that is 12.95 seconds against 11.8 milliseconds.
- Leaving `next` set on the flattened nodes. Every value is correct and 80.23% of inputs keep stale pointers.
- Forgetting to clear `next` on the *tail* the merge appends wholesale — those nodes never pass through the comparison loop.
- Using the recursive one-at-a-time form on many sublists. One frame each, overflowing past 100,000.
- Reading `p->next` after the merge has run. Save it first; the merge rewrites those links.
- Assuming the divide-and-conquer merge is always best. Past k = 512 a plain sort of the values beats it.
- Walking `bottom` in the outer loop and `next` in the inner. That visits one column and misses the rest.
- Returning `dummy` rather than `dummy.bottom`.
- Comparing with `<` instead of `<=`. Correct, but it makes the merge unstable for equal values.

<!-- @doubt -->
### Why is merging one at a time so much worse than merging in pairs?

<!-- @answer -->
Because the accumulated result is re-walked once per sublist. Merging list 1 into 2 touches the nodes of both; merging that into list 3 touches all of them again; by the end the first sublist has been walked k times. That is O(N·k). Merging in pairs walks every node once per *level* of the merge tree, and there are `log k` levels, so it is O(N log k). The comparison counts show it exactly: at N = 200,000 and k = 4,096, one at a time makes **394,527,286** comparisons and in pairs makes **2,351,250** — matching the predicted `N·k/2` of 409.6 million and `N·log₂k` of 2.4 million. In wall clock, with the node count held constant at 200,000, one at a time goes from **726 microseconds at k = 2 to 12.95 seconds at k = 20,000**, while merging in pairs moves from 723,959ns to 11,809,417ns — a factor of 16 against a factor of 17,800.

<!-- @doubt -->
### Should I ever just collect the values and sort them?

<!-- @answer -->
Yes, past a certain shape — which is a genuinely surprising result. Collecting every value, sorting and rebuilding is O(N log N) regardless of k, and measured it is the **fastest of the four approaches once k exceeds about 512**: 6,608,083ns at k = 512, 6,598,458 at k = 4,096 and 6,715,959 at k = 20,000, against the pairwise merge's 7,011,792, 9,658,958 and 11,809,417. The reason is that `log k` catches up with `log N` — at k = 20,000 they are 14.3 and 17.6 — so the merge's asymptotic edge nearly vanishes, and what remains is that `sort` runs over a contiguous array while every merge chases pointers through memory. Its cost is also the flattest of the four, 6.6ms to 9.0ms across the whole table. The real arguments against it are that it needs O(N) extra space, it allocates new nodes rather than relinking the existing ones, and it ignores the given sortedness, which is what the exercise is testing. But "it is slower" is not one of them at large k.

<!-- @doubt -->
### Why does `next` have to be cleared?

<!-- @answer -->
Because the flattened list is defined as a single chain of `bottom` pointers, and a node that still carries its old `next` is pointing into the middle of that chain. The bug is easy to miss because it does not affect a single value: measured over **20,000** random multi-level lists, a merge that rewrites only `bottom` produced **0 wrong values** and left stale `next` pointers on **16,047 of them — 80.23%**. Since the result is checked by reading down `bottom`, that version passes. What it leaves behind is a structure that is neither the input nor the output, and anything that later traverses `next` — a printer, a destructor, a second pass — will follow links into the flattened list. It is the same shape of failure as forgetting `prev` in a doubly linked list: the traversal everyone naturally performs is exactly the one that cannot see the damage. Note also that the merge's *tail* needs clearing separately, since those nodes are appended wholesale and never pass through the comparison loop.

<!-- @doubt -->
### Is a min-heap over the sublist heads a good approach?

<!-- @answer -->
It is correct and asymptotically fine, and it lost in every measurement. Pushing all k heads into a min-heap and repeatedly popping the smallest is the standard k-way merge, O(N log k) — the same complexity as merging in pairs. Measured, it is consistently the slower of the two: **1,919,375ns against 723,959 at k = 2**, 6,565,875 against 4,415,333 at k = 64, and 19,616,500 against 11,809,417 at k = 20,000. Two things cost it: every node passes through a heap push and pop with their pointer chasing and swaps, whereas the pairwise merge does a plain comparison per node; and the heap holds k live pointers throughout while the merge works on two lists at a time with far better locality. It is worth knowing because it generalises — a heap merge works on streams you cannot re-traverse — but for this problem it is the third-best of the four.

<!-- @doubt -->
### How deep does the recursion go?

<!-- @answer -->
That depends entirely on which recursion you write, and the difference is large. The natural recursive formulation — flatten the rest of the list, then merge the head into it — uses **one frame per sublist**, so the depth is k. Measured, 100,000 sublists is fine and **200,000 overflows** an 8 MiB stack. That is a reachable input rather than a theoretical one, since k equals N when every sublist holds a single node. The divide-and-conquer version also recurses, but it halves the range each time, so its depth is `log k` — about **15 frames at k = 20,000**. So the pairwise approach is not only asymptotically better in time, it converts a linear stack requirement into a logarithmic one. If you must write the one-at-a-time version, write it as a loop.
