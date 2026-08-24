---
id: sort-ll
topic: Linked Lists
title: Sort LL
difficulty: Hard
status: ready
prerequisites:
  - middle-of-a-linkedlist-tortoisehare-method
  - sort-a-linked-list-of-0s-1s-and-2s
  - reverse-a-ll
  - stack-memory-and-recursion-depth
  - merge-two-sorted-arrays-without-extra-space
  - time-and-space-complexity-basics
relatedIds:
  - sort-a-linked-list-of-0s-1s-and-2s
  - middle-of-a-linkedlist-tortoisehare-method
  - merge-two-sorted-arrays-without-extra-space
  - reverse-a-ll
  - flattening-of-ll
---

<!-- @summary -->
The one recursion in this topic that does **not** run out of stack: merge sort's depth is exactly `ceil(log2 n) + 1`, so ten million nodes needs **25 frames** where every other recursive algorithm here held one frame per node and died at about 261,000. The split must genuinely sever the list — omit that one assignment and it never terminates. And the honest measurement is uncomfortable: copying the values into an array and calling the library sort is **4.8x faster in C++ and 7.1x in Python**, at the cost of O(n) memory, stability, and node identity.

<!-- @theory -->
## Why merge sort

Sorting a linked list rules out most of the usual algorithms. Quicksort wants to
partition around a pivot and walk inwards from both ends; heapsort wants random
access; insertion sort wants to move backwards. Merge sort wants none of those —
it splits, recurses, and merges, and **merging two sorted lists needs no extra
storage at all**, because the result is built by relinking the nodes that already
exist.

That is the whole reason it is the answer here, and it is a property of the
structure rather than of the algorithm: on an array, merging normally needs a
scratch buffer.

```
split:    [4 2 7 1]  ->  [4 2]      [7 1]
                    ->  [4] [2]    [7] [1]
merge:              ->  [2 4]      [1 7]
                    ->  [1 2 4 7]
```

## The split must actually cut

The middle is found with the tortoise and hare from **Middle of a LinkedList**,
and then one assignment does the work that makes the recursion terminate:

```cpp
Node* splitHalf(Node* head) {
    Node* slow = head;
    Node* fast = head->next;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    Node* second = slow->next;
    slow->next = nullptr;          // the cut
    return second;
}
```

Without `slow->next = nullptr`, the first half still runs to the end of the
list — so the recursive call on `head` sees the **whole** list again, splits it
again, and never gets smaller. On a two-node list that is an infinite recursion,
and it terminates only by exhausting the stack: measured as a segmentation fault.

Note also `fast = head->next` rather than `head`. Starting the hare one node
ahead makes the tortoise stop on the **first** of the two middles, so a two-node
list splits into one and one. Starting it at the head leaves the tortoise on the
second middle, a two-node list splits into two and zero, and the recursion again
never shrinks.

## The recursion that does not overflow

Every other recursive algorithm in this topic held one stack frame per node.
**Reverse a LL** measured the ceiling at **174,252** frames unoptimised and
**261,123** optimised; **Add one to a number** hit the same wall from a different
function. Merge sort is different in kind, because each call halves the problem:

| n | Measured depth | `ceil(log2 n) + 1` |
|---|---|---|
| 1 | 1 | 1 |
| 2 | 2 | 2 |
| 10 | 5 | 5 |
| 1,000 | 11 | 11 |
| 100,000 | 18 | 18 |
| 10,000,000 | **25** | 25 |

An exact match at every size. Ten million nodes needs twenty-five frames, so the
stack limit that dominated the rest of this topic is simply not a consideration
here — you would need more nodes than addressable memory to approach it.

## Bottom-up removes even that

The same merges can be driven by a loop instead of recursion: merge runs of width
1, then 2, then 4, until the width covers the list. That is genuinely **O(1)**
space rather than O(log n), and it is the version to reach for if the call stack
is constrained at all.

It measured about **1.9x slower** than the recursive version — 336,980us against
177,631us at a million nodes — because the loop re-walks each run to find and
sever it, where the recursion gets its boundaries for free from the call
structure.

## The uncomfortable measurement

Copying the values into an array, sorting them with the library sort, and writing
them back is the approach a linked-list problem is supposed to teach you to
avoid. Measured, each algorithm in its own process so their heaps do not
interact:

| n | Recursive merge sort | Bottom-up | Copy to array |
|---|---|---|---|
| 1,000 | 32.12us | 37.38us | **15.00us** |
| 1,000,000 | 177,631us | 336,980us | **36,779us** |

**4.8x faster.** Python is worse:

| n | Recursive merge sort | Bottom-up | Copy to array |
|---|---|---|---|
| 1,000 | 1,201us | 1,635us | **150us** |
| 200,000 | 373,380us | 608,044us | **52,502us** |

**7.1x.** A contiguous array of integers sorted by an optimised introsort or
Timsort beats `O(n log n)` pointer-chasing by a wide margin, and the two linear
passes to copy in and out are cheap by comparison. This is the same result
**Check if LL is palindrome** measured, more emphatically.

## What the array version actually costs

Three things, and they are the reason merge sort is still the answer to the
question as usually asked.

**Memory.** Peak usage at four million nodes:

| | Peak RSS |
|---|---|
| Recursive merge sort | **78.0 MB** |
| Bottom-up | **77.9 MB** |
| Copy to array | 109.2 MB |

**Stability.** Merge sort keeps equal elements in their original order because
`a->data <= b->data` takes from the left run on a tie. `std::sort` does not.
Measured on 200 lists of 200–2,200 nodes with only five distinct keys:

| | Unstable results |
|---|---|
| Merge sort on the list | **0 of 200** |
| Copy to array + `std::sort` | **200 of 200** |

That test only works at scale — an earlier version using twelve-node lists
reported **0 of 20,000** for both, because `std::sort` falls back to insertion
sort on short ranges and insertion sort is stable. The instability is real but
invisible below the cutoff.

**Node identity.** Merge sort **relinks** the nodes; the array version rewrites
their values and leaves every node where it was. The distinction **Reverse a
LinkedList** and **Segregate odd and even nodes** both measured applies here
unchanged.

<!-- @intuition -->
Merge sort is the answer for linked lists because merging is the one sorting primitive that a linked list does better than an array — joining two sorted runs needs no scratch space at all, just relinking. Everything else about the algorithm follows from arranging to use that primitive, and the two details that actually matter are both about the split: it has to cut the list, or the recursion never shrinks, and it has to cut in the right place, or a two-node list splits into two and zero and never shrinks either. The genuinely pleasant surprise is the stack. This topic has spent a lot of time on recursions that hold one frame per node and die somewhere north of two hundred thousand, and merge sort simply does not have that problem — halving the input means the depth is logarithmic, and ten million nodes fits in twenty-five frames. The uncomfortable part is that copying into an array and calling the library sort is several times faster, and pretending otherwise would be dishonest. What merge sort actually buys is O(1) extra memory, stability, and nodes that move rather than values that change — three properties worth naming precisely, because "it is the proper linked-list algorithm" is not one of them.

<!-- @approach -->
### Optimal - Recursive Merge Sort

<!-- @idea -->
Split the list in half, sort each half recursively, and merge the two sorted halves by relinking.

<!-- @steps -->
1. A list of zero or one node is already sorted — return it.
2. Find the middle with the tortoise and hare, starting the hare one node ahead.
3. Sever the list there, so the first half genuinely ends.
4. Sort each half recursively.
5. Merge the two sorted halves, taking from the left run whenever the values tie.
6. Return the merged head.

<!-- @complexity -->
- time: O(n log n) — `log n` levels, each merging every node once
- space: **O(log n)** stack — one frame per level, not per node
- note: The answer to the question as usually asked. Its depth is exactly `ceil(log2 n) + 1`, measured at every size up to ten million, so the stack ceilings that dominated **Reverse a LL** and **Add one to a number** — 174,252 and 261,123 frames — are irrelevant here. Step 3 is not optional: without the cut the recursion never shrinks and terminates only by overflowing the stack. Step 5's `<=` is what makes it stable.

<!-- @code cpp -->
```cpp
Node* merge(Node* a, Node* b) {
    Node dummy(0);
    Node* tail = &dummy;
    while (a != nullptr && b != nullptr) {
        if (a->data <= b->data) { tail->next = a; a = a->next; }
        else                    { tail->next = b; b = b->next; }
        tail = tail->next;
    }
    tail->next = (a != nullptr) ? a : b;
    return dummy.next;
}

Node* splitHalf(Node* head) {
    Node* slow = head;
    Node* fast = head->next;
    while (fast != nullptr && fast->next != nullptr) {
        slow = slow->next;
        fast = fast->next->next;
    }
    Node* second = slow->next;
    slow->next = nullptr;
    return second;
}

Node* mergeSort(Node* head) {
    if (head == nullptr || head->next == nullptr) return head;
    Node* second = splitHalf(head);
    return merge(mergeSort(head), mergeSort(second));
}
```

<!-- @annotations -->
- 5: `<=`, not `<`. Taking from the left run on a tie is the entire reason this sort is stable — measured as 0 unstable results against `std::sort`'s 200 of 200.
- 9: Attaching whichever run still has nodes, in one assignment. No loop is needed because the remainder is already sorted and already linked.
- 15: `head->next`, not `head`. Starting the hare one ahead puts the tortoise on the **first** middle, so a two-node list splits one and one; starting at the head splits it two and zero and the recursion never shrinks.
- 21: The cut. Without it the first half still runs to the end, so the recursive call sees the whole list again — infinite recursion, ending in a stack overflow.

<!-- @code java -->
```java
static Node merge(Node a, Node b) {
    Node dummy = new Node(0);
    Node tail = dummy;
    while (a != null && b != null) {
        if (a.data <= b.data) { tail.next = a; a = a.next; }
        else                  { tail.next = b; b = b.next; }
        tail = tail.next;
    }
    tail.next = (a != null) ? a : b;
    return dummy.next;
}

static Node splitHalf(Node head) {
    Node slow = head, fast = head.next;
    while (fast != null && fast.next != null) {
        slow = slow.next;
        fast = fast.next.next;
    }
    Node second = slow.next;
    slow.next = null;
    return second;
}

static Node mergeSort(Node head) {
    if (head == null || head.next == null) return head;
    Node second = splitHalf(head);
    return merge(mergeSort(head), mergeSort(second));
}
```

<!-- @annotations -->
- 2: A dummy node so the merge loop needs no "is this the first node?" test — the same device the whole topic has used for list construction.

<!-- @code python -->
```python
def merge(a, b):
    dummy = Node(0)
    tail = dummy
    while a is not None and b is not None:
        if a.data <= b.data:
            tail.next = a
            a = a.next
        else:
            tail.next = b
            b = b.next
        tail = tail.next
    tail.next = a if a is not None else b
    return dummy.next


def split_half(head):
    slow, fast = head, head.next
    while fast is not None and fast.next is not None:
        slow = slow.next
        fast = fast.next.next
    second = slow.next
    slow.next = None
    return second


def merge_sort(head):
    if head is None or head.next is None:
        return head
    second = split_half(head)
    return merge(merge_sort(head), merge_sort(second))
```

<!-- @annotations -->
- 22: The cut, and the reason this recursion terminates. Its depth is `ceil(log2 n) + 1` — 18 frames for a hundred thousand nodes, against one-per-node elsewhere in this topic.

<!-- @approach -->
### Bottom-Up Merge Sort

<!-- @idea -->
Drive the same merges from a loop: combine runs of width 1, then 2, then 4, until one run covers the list.

<!-- @steps -->
1. Count the nodes, so the loop knows when the run width covers the list.
2. For each width, walk the list taking two consecutive runs of that width.
3. Sever each run from what follows it.
4. Merge the pair and attach the result after everything already merged at this width.
5. Continue until the width reaches the list length.

<!-- @complexity -->
- time: O(n log n) — the same `log n` passes, each touching every node
- space: **O(1)** — no recursion at all, just a few pointers
- note: The version to use when the call stack is constrained, since it removes even merge sort's modest `log n` frames. It measured about **1.9x slower** than the recursive version — 336,980us against 177,631us at a million nodes — because each pass must re-walk every run to find and sever it, where recursion gets those boundaries free from the call structure. An earlier draft of this container was 5x slower still, from walking each run four times more than necessary.

<!-- @code cpp -->
```cpp
Node* cutAfter(Node* head, long n) {
    while (--n > 0 && head != nullptr) head = head->next;
    if (head == nullptr) return nullptr;
    Node* rest = head->next;
    head->next = nullptr;
    return rest;
}

Node* mergeSortBottomUp(Node* head) {
    if (head == nullptr || head->next == nullptr) return head;
    long n = 0;
    for (Node* p = head; p != nullptr; p = p->next) n++;

    Node dummy(0);
    dummy.next = head;
    for (long width = 1; width < n; width *= 2) {
        Node* cur = dummy.next;
        Node* tail = &dummy;
        while (cur != nullptr) {
            Node* left = cur;
            Node* right = cutAfter(left, width);
            cur = cutAfter(right, width);
            tail->next = merge(left, right);
            while (tail->next != nullptr) tail = tail->next;
        }
    }
    return dummy.next;
}
```

<!-- @annotations -->
- 1: Detaching the first `n` nodes and returning the rest, which is the operation the recursion never has to perform explicitly.
- 24: Advancing to the end of what was just merged, so the next pair attaches after it. This walk is why the bottom-up version costs more than the recursive one.
- 17: Restarting from the front on every width, which is what makes this `log n` full passes rather than a recursive descent.

<!-- @code java -->
```java
static Node cutAfter(Node head, long n) {
    while (--n > 0 && head != null) head = head.next;
    if (head == null) return null;
    Node rest = head.next;
    head.next = null;
    return rest;
}

static Node mergeSortBottomUp(Node head) {
    if (head == null || head.next == null) return head;
    long n = 0;
    for (Node p = head; p != null; p = p.next) n++;

    Node dummy = new Node(0);
    dummy.next = head;
    for (long width = 1; width < n; width *= 2) {
        Node cur = dummy.next, tail = dummy;
        while (cur != null) {
            Node left = cur;
            Node right = cutAfter(left, width);
            cur = cutAfter(right, width);
            tail.next = merge(left, right);
            while (tail.next != null) tail = tail.next;
        }
    }
    return dummy.next;
}
```

<!-- @annotations -->
- 20: `cutAfter` returns null harmlessly when the run is short or absent, so the final odd run needs no special case.

<!-- @code python -->
```python
def cut_after(head, n):
    while n - 1 > 0 and head is not None:
        head = head.next
        n -= 1
    if head is None:
        return None
    rest = head.next
    head.next = None
    return rest


def merge_sort_bottom_up(head):
    if head is None or head.next is None:
        return head
    n = 0
    p = head
    while p is not None:
        n += 1
        p = p.next

    dummy = Node(0)
    dummy.next = head
    width = 1
    while width < n:
        cur = dummy.next
        tail = dummy
        while cur is not None:
            left = cur
            right = cut_after(left, width)
            cur = cut_after(right, width) if right is not None else None
            tail.next = merge(left, right)
            while tail.next is not None:
                tail = tail.next
        width *= 2
    return dummy.next
```

<!-- @annotations -->
- 30: Guarding against a null `right`, which happens on the last pair of every pass when the list length is not a multiple of twice the width.

<!-- @approach -->
### Copy the Values to an Array

<!-- @idea -->
Read the values into an array, sort them with the library sort, and write them back over the nodes.

<!-- @steps -->
1. Walk the list, appending every value to an array.
2. Sort the array.
3. Walk the list again, writing the sorted values back in order.
4. Return the original head, which has not moved.

<!-- @complexity -->
- time: O(n log n) — the same order, with a far smaller constant
- space: **O(n)** — one slot per node
- note: **4.8x faster than merge sort in C++ and 7.1x in Python**, and it should be said plainly rather than dismissed. What it gives up is threefold: O(n) memory (109.2 MB against 78.0 at four million nodes), **stability** (`std::sort` was unstable on 200 of 200 lists where merge sort was stable on all), and **node identity** — the nodes never move and their contents change instead. Choose it when none of those three matter, which is more often than the framing of this problem suggests.

<!-- @code cpp -->
```cpp
#include <vector>
#include <algorithm>
using namespace std;

Node* sortByArray(Node* head) {
    vector<int> values;
    for (Node* p = head; p != nullptr; p = p->next) values.push_back(p->data);
    sort(values.begin(), values.end());

    size_t i = 0;
    for (Node* p = head; p != nullptr; p = p->next) p->data = values[i++];
    return head;
}
```

<!-- @annotations -->
- 8: `std::sort` is introsort and is **not** stable — measured unstable on 200 of 200 lists with repeated keys. `std::stable_sort` fixes that and allocates its own buffer to do so.
- 11: The nodes keep their addresses and exchange contents, which is the semantic difference from merge sort and is invisible unless something outside holds a node pointer.
- 7: The O(n) allocation both merge sort variants avoid entirely.

<!-- @code java -->
```java
static Node sortByArray(Node head) {
    List<Integer> values = new ArrayList<>();
    for (Node p = head; p != null; p = p.next) values.add(p.data);
    Collections.sort(values);

    int i = 0;
    for (Node p = head; p != null; p = p.next) p.data = values.get(i++);
    return head;
}
```

<!-- @annotations -->
- 4: `Collections.sort` **is** stable, unlike C++'s `std::sort` — so the stability argument against this approach does not apply in Java.

<!-- @code python -->
```python
def sort_by_array(head):
    values = []
    p = head
    while p is not None:
        values.append(p.data)
        p = p.next
    values.sort()

    p = head
    i = 0
    while p is not None:
        p.data = values[i]
        i += 1
        p = p.next
    return head


# 7.1x faster than merge sort here -- Timsort runs in C, where the
# pointer chasing of a list merge runs one bytecode at a time.
```

<!-- @annotations -->
- 7: `list.sort()` is Timsort, which **is** stable — so as in Java, the stability objection applies only to C++.

<!-- @example -->

<!-- @input -->
`4 -> 2 -> 7 -> 1`

<!-- @output -->
`1 -> 2 -> 4 -> 7`

<!-- @why -->
The full descent and merge, showing where the cut happens.

<!-- @walkthrough -->
1. The list has four nodes, so it is split: the tortoise stops on the node holding 2 and `slow->next = nullptr` severs it.
2. That leaves `4 -> 2` and `7 -> 1` as two independent lists — independent being the point.
3. Each is split again into single nodes, which are sorted by definition.
4. Merging `4` and `2` compares once and yields `2 -> 4`; merging `7` and `1` yields `1 -> 7`.
5. The final merge walks both runs: 1 is smallest, then 2, then 4, then 7 is attached wholesale.
6. No node was allocated or freed at any point — every step relinked nodes that already existed.
7. The recursion reached depth 3 for four nodes, matching `ceil(log2 4) + 1`.

<!-- @example -->

<!-- @input -->
The same code with `slow->next = nullptr` removed

<!-- @output -->
Infinite recursion, ending in a stack overflow

<!-- @why -->
The single assignment the whole algorithm's termination rests on.

<!-- @walkthrough -->
1. The tortoise-hare walk still finds the middle correctly, and `second` still points at the right node.
2. But the first half was never detached, so it still runs all the way to the end of the list.
3. The recursive call on `head` therefore receives the **whole** list, not half of it.
4. It splits at the same place and calls itself on the whole list again.
5. Nothing ever gets smaller, so the base case is never reached.
6. Run on a two-node list, this terminated only by exhausting the stack — observed as a segmentation fault.
7. The symptom is worth recognising: a merge sort that crashes on tiny input is almost always a split that did not cut.

<!-- @example -->

<!-- @input -->
Merge sort's recursion depth at sizes from 1 to ten million

<!-- @output -->
Exactly `ceil(log2 n) + 1` every time — 25 frames for ten million nodes

<!-- @why -->
Sets this apart from every other recursion in the topic, all of which had a hard ceiling.

<!-- @walkthrough -->
1. **Reverse a LL** measured its recursion dying at 174,252 frames unoptimised and 261,123 optimised, because it held one frame per node.
2. **Add one to a number** hit the same wall from a different function, confirming the limit belongs to the frame size and the stack rather than the algorithm.
3. Merge sort halves the input at every call, so the depth is logarithmic rather than linear.
4. Measured: 11 frames at a thousand nodes, 18 at a hundred thousand, and **25** at ten million.
5. Each matched `ceil(log2 n) + 1` exactly.
6. So the stack ceiling that constrained the rest of this topic is not a consideration — reaching it would need more nodes than addressable memory.
7. The bottom-up variant removes even those 25 frames, at about 1.9x the running time.

<!-- @example -->

<!-- @input -->
Merge sort against copying the values into an array and calling the library sort

<!-- @output -->
The array version is 4.8x faster in C++ and 7.1x in Python

<!-- @why -->
The measurement this problem's usual framing discourages, reported plainly.

<!-- @walkthrough -->
1. Both are O(n log n), so the difference is entirely in the constant.
2. Merge sort chases pointers through nodes scattered across memory; the array version sorts a contiguous block.
3. Measured with each algorithm in its own process, so no run's allocations polluted another's heap.
4. At a million nodes: 177,631us for recursive merge sort against **36,779us** for the array — **4.8x**.
5. Python is more lopsided still: 373,380us against 52,502us at two hundred thousand — **7.1x**.
6. The same inversion **Check if LL is palindrome** measured, and for the same reason.
7. What merge sort buys is not speed but three specific things: O(1) extra memory, stability, and moving nodes rather than values.

<!-- @example -->

<!-- @input -->
Testing stability on twelve-node lists, then on lists of 200–2,200

<!-- @output -->
The small test reported both sorts stable; the large one found `std::sort` unstable on 200 of 200

<!-- @why -->
A test that was too small to detect the property it was written to detect.

<!-- @walkthrough -->
1. Stability means equal keys keep their original relative order, so a test needs repeated keys and a way to tell equal elements apart.
2. The first attempt used 20,000 lists of at most twelve nodes with three distinct keys.
3. It reported **0 unstable results for both** merge sort and `std::sort`, which looked like evidence that both were stable.
4. It was not: `std::sort` switches to insertion sort below a size threshold, and insertion sort **is** stable.
5. Re-run on 200 lists of 200 to 2,200 nodes with five distinct keys, `std::sort` was unstable on **200 of 200** while merge sort was stable on all.
6. So the property was real and the test simply never engaged the code path that violates it.
7. The general lesson is that a test for an algorithmic property has to be large enough for the algorithm to use the strategy being tested.

<!-- @visualization recursion-tree -->

<!-- @description -->
Build the whole thing around the recursion tree, drawn as an actual tree rather than described. Start with `4 2 7 1` as a single row at the top and let it split downwards — but animate the **cut** explicitly, showing the link between the two halves being severed and the two rows drifting apart, because that severing is what the entire termination argument rests on. Draw the tree to its leaves, then merge back upwards, and at each merge show two sorted runs being zipped together one node at a time with a marker on each run's head, so the reader sees the comparison driving which node is taken. Highlight a tie — two equal values — and show the left run's node being taken, labelled this is why it is stable. The second panel is the depth result, and it should be a picture of scale rather than a table: draw the recursion tree's height for a thousand nodes as eleven levels, then show ten million nodes as twenty-five, and beside it draw the one-frame-per-node recursion from **Reverse a LL** as a column that runs off the bottom of the frame with a red line at 261,123. Two structures, same page, wildly different heights. The third panel is the honest comparison, drawn as a race: the same list sorted by merge sort with its pointer jumps traced as long erratic arcs across scattered memory, against the array version drawn as a compact contiguous block being sorted in place. Put the two timings beneath — 177,631us and 36,779us — and then, immediately below, the three things the array version gave up, each with its number: 109.2 MB against 78.0, 200 of 200 unstable against 0, and nodes that stayed put rather than moved. The point of that panel is that the faster one is not simply better.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"whyMergeSort":{"ruledOut":["quicksort wants to partition inwards from both ends","heapsort wants random access","insertion sort wants to move backwards"],"theKeyProperty":"merging two sorted linked lists needs NO extra storage -- the result is built by relinking nodes that already exist","note":"that is a property of the structure, not the algorithm; on an array, merging normally needs a scratch buffer"},"theSplit":{"mustCut":"slow->next = nullptr","withoutIt":"the first half still runs to the end, so the recursive call sees the WHOLE list again and nothing ever shrinks","observed":"infinite recursion terminating in a segmentation fault, on a two-node list","alsoMatters":"fast = head->next, not head","why":"starting the hare one ahead puts the tortoise on the FIRST middle, so a two-node list splits one and one; starting at the head splits it two and zero and the recursion again never shrinks"},"recursionDepth":{"formula":"ceil(log2 n) + 1","measured":[{"n":1,"depth":1},{"n":2,"depth":2},{"n":10,"depth":5},{"n":1000,"depth":11},{"n":100000,"depth":18},{"n":10000000,"depth":25}],"exactMatchAtEverySize":true,"contrast":"every other recursion in this topic held ONE frame per node -- Reverse a LL measured the ceiling at 174,252 frames unoptimised and 261,123 optimised, and Add one to a number hit the same wall from a different function","consequence":"the stack limit that dominated the rest of this topic is not a consideration here"},"correctness":{"approaches":["recursive merge sort","bottom-up merge sort","copy to array"],"randomLists":"4,000 in C++ and Python, plus 5,000 more for the bottom-up version","disagreements":0},"bench":{"note":"each algorithm run in its OWN process so their heaps do not interact","cpp":[{"n":1000,"recursive":32.12,"bottomUp":37.38,"copyToArray":15.00},{"n":1000000,"recursive":177631,"bottomUp":336980,"copyToArray":36779}],"python":[{"n":1000,"recursive":1201,"bottomUp":1635,"copyToArray":150},{"n":200000,"recursive":373380,"bottomUp":608044,"copyToArray":52502}],"headline":"copying to an array is 4.8x faster in C++ and 7.1x in Python","why":"a contiguous array sorted by introsort or Timsort beats O(n log n) pointer-chasing by a wide margin, and the two linear copy passes are cheap by comparison","sameResultAs":"Check if LL is palindrome, more emphatically","bottomUpVsRecursive":"about 1.9x slower, because each pass re-walks every run to find and sever it where recursion gets those boundaries free from the call structure"},"whatTheArrayVersionCosts":{"memory":{"n":4000000,"recursive":"78.0 MB","bottomUp":"77.9 MB","copyToArray":"109.2 MB"},"stability":{"test":"200 lists of 200-2,200 nodes with only five distinct keys","mergeSort":"0 of 200 unstable","stdSort":"200 of 200 unstable","whyMergeSortIsStable":"`a->data <= b->data` takes from the LEFT run on a tie","languageNote":"Java's Collections.sort and Python's list.sort ARE stable -- the objection applies only to C++ std::sort"},"nodeIdentity":"merge sort relinks the nodes; the array version rewrites their values and leaves every node where it was -- the distinction Reverse a LinkedList and Segregate odd and even nodes both measured"},"aTestThatWasTooSmall":{"attempt":"20,000 lists of at most twelve nodes with three distinct keys","result":"0 unstable results for BOTH sorts, which looked like evidence both were stable","whyItFailed":"std::sort switches to insertion sort below a size threshold, and insertion sort IS stable","fix":"200 lists of 200-2,200 nodes, where std::sort was unstable on 200 of 200","lesson":"a test for an algorithmic property has to be large enough for the algorithm to use the strategy being tested"},"recommendation":"recursive merge sort for the question as usually asked; bottom-up if the call stack is constrained; copy-to-array when none of memory, stability or node identity matters -- which is more often than the framing suggests","lesson":"merge sort's depth is logarithmic, which makes it the one recursion here that cannot overflow -- and it is several times slower than the approach it is supposed to replace"}
```

<!-- @highlights -->
- The recursion tree is drawn as an actual tree, starting from `4 2 7 1` as a single row and splitting downwards.
- The **cut** is animated explicitly — the link between halves severed, the two rows drifting apart.
- That severing carries the entire termination argument, so it gets its own beat.
- The tree descends to its leaves, then merges back upwards.
- Each merge zips two sorted runs together one node at a time, with a marker on each run's head.
- The comparison driving which node is taken is visible on every step.
- A tie is highlighted, with the left run's node taken and labelled this is why it is stable.
- The second panel draws depth as scale rather than as a table.
- A thousand nodes is eleven levels; ten million is twenty-five.
- Beside it, the one-frame-per-node recursion from **Reverse a LL** runs off the bottom of the frame with a red line at 261,123.
- Two structures on one page with wildly different heights.
- The third panel is a race: merge sort's pointer jumps traced as long erratic arcs across scattered memory.
- Against it, the array version drawn as a compact contiguous block sorted in place.
- The two timings sit beneath — 177,631us and 36,779us.
- Immediately below, the three things the array version gave up, each with its number: 109.2 MB against 78.0, 200 of 200 unstable against 0, and nodes that stayed put rather than moved.
- That panel exists to show the faster one is not simply better.

<!-- @edgeCases -->
- The empty list — returned unchanged by the base case, before any split is attempted.
- A single node — already sorted, and the base case that stops every branch of the recursion.
- Two nodes — the shortest list that splits, and the one that exposes a hare started at the head instead of one ahead.
- An already-sorted list — merge sort still does all `log n` passes; it has no early exit.
- A reverse-sorted list — the same cost, since merge sort's work does not depend on the input order.
- A list of all-equal values — every comparison ties, so stability is the only thing distinguishing the result.
- Duplicate values generally — kept in their original relative order by merge sort and not by `std::sort`.
- A list long enough to worry about the stack — it is not: ten million nodes needs twenty-five frames.
- The split without severing — infinite recursion, ending in a stack overflow even on two nodes.
- An outside pointer into the list — follows its node under merge sort, and sees a changed value in place under the array version.
- Very large lists under the array version — the O(n) buffer is the binding constraint, at 109.2 MB against 78.0 for four million nodes.

<!-- @pitfalls -->
- Omitting `slow->next = nullptr`. The recursion never shrinks and crashes on a two-node list.
- Starting the hare at `head` instead of `head->next`. A two-node list splits into two and zero, which also never shrinks.
- Using `<` instead of `<=` in the merge. The sort stops being stable, silently.
- Assuming `std::sort` is stable because a small test said so. It falls back to insertion sort on short ranges; the instability only appears at scale.
- Testing stability without repeated keys. Nothing can tie, so nothing can be reordered.
- Assuming merge sort is faster because it is the linked-list algorithm. Copying to an array measured 4.8x faster in C++ and 7.1x in Python.
- Choosing the array version when the caller holds node pointers. It rewrites values in place rather than moving nodes.
- Worrying about merge sort's recursion depth. It is `ceil(log2 n) + 1` — 25 frames for ten million nodes.
- Writing a bottom-up version that re-walks each run more than necessary. An earlier draft here was 5x slower than the recursive version for that reason alone.
- Benchmarking several sorts in one process. Their allocations interact; each measurement here was taken in its own process.
- Expecting merge sort to exit early on sorted input. It does all `log n` passes regardless.

<!-- @doubt -->
### Why merge sort rather than quicksort?

<!-- @answer -->
Because merging is the one sorting primitive a linked list does **better** than an array. Joining two sorted runs needs no scratch space at all — the result is built by relinking nodes that already exist — whereas merging two sorted array ranges normally needs a buffer. Everything else about the algorithm is arranged to use that primitive. The alternatives all want something the structure cannot give: quicksort's partitioning wants to walk inwards from both ends, heapsort wants random access to index `2i + 1`, and insertion sort wants to move backwards. Quicksort on a linked list is possible — you can partition by relinking into two chains, exactly as **Sort a Linked List of 0's 1's and 2's** does — but it keeps quicksort's O(n²) worst case without gaining its usual cache advantages, so it is strictly worse here.

<!-- @doubt -->
### What happens if the split does not sever the list?

<!-- @answer -->
The recursion never terminates. The tortoise-hare walk still finds the middle and `second` still points at the right node — but the first half was never detached, so it still runs all the way to the end. The recursive call on `head` therefore receives the **whole** list, splits it at the same place, and calls itself on the whole list again. Nothing ever gets smaller and the base case is never reached. Run on a two-node list it ended in a segmentation fault, which is worth recognising as a symptom: **a merge sort that crashes on tiny input is almost always a split that did not cut.** There is a second, subtler version of the same failure — starting the hare at `head` instead of `head->next` leaves the tortoise on the *second* middle, so a two-node list splits into two and zero and the recursion again never shrinks.

<!-- @doubt -->
### Will the recursion overflow the stack on a long list?

<!-- @answer -->
No, and this is the one recursion in this topic where that is true. Every other recursive algorithm here held one stack frame per node: **Reverse a LL** measured the ceiling at **174,252** frames unoptimised and **261,123** optimised, and **Add one to a number** hit the same wall from an entirely different function, confirming the limit belongs to the frame size and the stack rather than to any particular algorithm. Merge sort halves the input at every call, so its depth is logarithmic. Measured at every size from one to ten million, it matched `ceil(log2 n) + 1` exactly — 11 frames at a thousand nodes, 18 at a hundred thousand, and **25** at ten million. You would need more nodes than addressable memory to approach a stack limit. If the call stack is constrained anyway — a deeply nested context, or a thread with a small stack — the bottom-up variant removes even those 25 frames, at about 1.9x the running time.

<!-- @doubt -->
### Is copying to an array really faster? That feels like cheating.

<!-- @answer -->
It is genuinely faster, by a lot, and saying otherwise would be dishonest. Measured with each algorithm in its own process so their heaps could not interact: at a million nodes, recursive merge sort took **177,631us** and the array version **36,779us** — **4.8x**. Python is more lopsided at **7.1x**, 373,380us against 52,502us. Both are O(n log n); the difference is entirely the constant, because a contiguous block sorted by introsort or Timsort avoids the pointer chasing that dominates a list merge. This is the same inversion **Check if LL is palindrome** measured, more emphatically. What merge sort buys is not speed but three specific things — **O(1) extra memory** (78.0 MB against 109.2 at four million nodes), **stability**, and **moving nodes rather than values**. If none of those three matters for your use, the array version is the better engineering choice, and that is more often than this problem's framing suggests.

<!-- @doubt -->
### Is merge sort stable, and does it matter?

<!-- @answer -->
Yes, and it comes from one character: `a->data <= b->data` takes from the **left** run when values tie, so equal elements keep their original relative order. It matters whenever the nodes carry more than the sort key — sorting records by date and expecting same-date entries to stay in insertion order, for instance. The measured contrast is stark: on 200 lists of 200–2,200 nodes with only five distinct keys, merge sort was stable on **all 200** and C++'s `std::sort` was unstable on **all 200**. One important qualification — that objection is C++-specific. Java's `Collections.sort` and Python's `list.sort` are both stable, so the array approach loses nothing on stability in those languages. Change the `<=` to `<` and you lose stability silently, with no other symptom.

<!-- @doubt -->
### How do I test that a sort is stable?

<!-- @answer -->
Give the elements a tag that distinguishes equal keys, sort by key only, and check the tags remain in ascending order within each key group — comparing against `stable_sort` on the same input is the cleanest reference. The trap is **size**. A first attempt here used 20,000 lists of at most twelve nodes with three distinct keys, and reported **0 unstable results for both** merge sort and `std::sort` — which looked like evidence that both were stable and was not. `std::sort` switches to insertion sort below a size threshold, and insertion sort is stable, so the test never reached the code path capable of violating the property. Re-run on lists of 200 to 2,200 nodes, `std::sort` failed **200 of 200**. The general form is worth carrying: a test for an algorithmic property has to be large enough for the algorithm to actually use the strategy being tested.
