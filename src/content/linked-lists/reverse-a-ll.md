---
id: reverse-a-ll
topic: Linked Lists
title: Reverse a LL
difficulty: Medium
status: ready
prerequisites:
  - reverse-a-linkedlist-iterative
  - introduction-to-singly-linkedlist
  - deletion-of-the-head-of-ll
  - find-the-length-of-the-linked-list
  - stack-memory-and-recursion-depth
  - time-and-space-complexity-basics
relatedIds:
  - reverse-a-linkedlist-iterative
  - reverse-ll-in-group-of-given-size-k
  - check-if-ll-is-palindrome-or-not
  - sort-ll
  - flattening-of-ll
---

<!-- @summary -->
The same reversal expressed recursively, where the interesting facts are all about the stack: forgetting one line produces output whose **first n values are correct** before it loops forever; the tail-recursive form crashes at **174,500 nodes with `-O0` and never crashes at `-O2`**, because the compiler turns it into the loop; and Python — the language with the notorious 1,000-frame limit — recursed **2,000,000 deep** once that limit was lifted, roughly **8x deeper than C++ managed**.

<!-- @theory -->
## The recursive statement

Reverse everything after the head, then put the head on the end.

```
reverse(1 -> 2 -> 3)
    = reverse(2 -> 3)  followed by  1
    = (3 -> 2)         followed by  1
    = 3 -> 2 -> 1
```

The base case is a list of zero or one node, which is already reversed.

```cpp
Node* reverse(Node* head) {
    if (head == nullptr || head->next == nullptr) return head;
    Node* newHead = reverse(head->next);
    head->next->next = head;      // the node after me now points BACK at me
    head->next = nullptr;         // and I become the tail
    return newHead;
}
```

Two things about this deserve more attention than they usually get.

**`head->next->next = head` looks wrong and is right.** After the recursive
call, the sublist starting at `head->next` has been reversed, so `head->next` —
which still points where it always did — is now that sublist's **last** node.
Attaching `head` to it is exactly "put the head on the end". The recursion
returns the new head unchanged through every level, because the far end of the
list becomes the front and never moves again.

**`head->next = nullptr` is not tidying up.** Skip it and you get this, on
`0 1 2 3 4`:

```
4 3 2 1 0 1 0 1 0 1 ...
```

The first **five** values are correct. Then node 0 and node 1 point at each other
and the walk never terminates. Floyd's cycle detection confirms a genuine cycle.
This is the nastiest kind of bug: a test that prints `n` elements passes, a test
that walks to null hangs, and the difference is one line.

## Two recursions, and only one of them is free

The version above does work *after* the recursive call, so every frame must stay
alive until the call beneath it returns. There is another shape that does its
work *before* recursing, carrying the answer down in a parameter:

```cpp
Node* reverse(Node* head, Node* prev) {
    if (head == nullptr) return prev;
    Node* next = head->next;
    head->next = prev;
    return reverse(next, head);   // nothing happens after this returns
}
```

That is a **tail call** — the recursive call's result is returned directly, so
the current frame has nothing left to do and can be reused rather than stacked.
Compare the two, compiled on this machine (Apple M2, Apple clang 17.0.0) against
an 8,372,224-byte stack:

| | `-O0` | `-O2` |
|---|---|---|
| Head recursion | crashes at 174,500 | crashes at 261,500 |
| Tail recursion | crashes at 174,500 | **never crashes** |
| Iterative | never crashes | never crashes |

The tail-recursive function is character-for-character the same in both columns.
At `-O0` it dies like any other recursion; at `-O2` it survived every depth
tested, to nearly **40 million** nodes, where the limit was memory rather than stack.

The disassembly says plainly why. At `-O2` the tail-recursive function contains
**no call instruction at all** — no `bl`, no frame setup — just a backward branch:

```
 0: cbz  x0, 0x20
 4: mov  x8, x0
 8: ldr  x0, [x8, #0x8]
 c: str  x1, [x8, #0x8]
10: mov  x1, x8
14: cbnz x0, 0x4         <-- branches back. this is a loop.
18: mov  x0, x8
1c: ret
```

The head-recursive version still has its `bl` at `-O2`. It cannot be flattened,
because there is work waiting on the other side of the call.

The two crash depths also check out exactly against the frame sizes in the
assembly — 48 bytes per frame at `-O0` and 32 at `-O2`:

| | Frame in asm | Measured 8,372,224 / depth |
|---|---|---|
| `-O0` | `sub sp, sp, #0x30` = 48 | 48.0 bytes |
| `-O2` | `stp x20, x19, [sp, #-0x20]!` = 32 | 32.0 bytes |

## Python inverts the whole picture

CPython does **no** tail-call optimisation, so the accumulator version buys
nothing there. It is in fact one node *worse*, because it recurses one extra
time to reach its `None` base case. Called at module level with the default
recursion limit of 1,000, head recursion handles **999** nodes and the
tail-recursive version handles **998**.

Those absolutes are worth reading carefully: the limit counts **every** frame on
the stack, not just your recursion's. Measured from one enclosing function the
same two numbers become 998 and 997, and from two they become 997 and 996. What
stays fixed is the gap of exactly one.

But the famous limit turns out not to be a wall. Raising it with
`sys.setrecursionlimit` and re-running, this reversal recursed **2,000,000 nodes
deep without crashing** on CPython 3.13.4 — about **8x deeper than C++ managed at
`-O2`**. CPython 3.12 moved Python frames off the C stack, so depth costs heap
rather than a fixed 8 MB allocation. Measured, that cost is about **110 bytes per
frame**:

| n | Recursive peak RSS | Iterative peak RSS | Difference |
|---|---|---|---|
| 500,000 | 106.1 MB | 52.6 MB | 53.5 MB — 112 bytes/frame |
| 1,000,000 | 196.1 MB | 90.9 MB | 105.2 MB — 110 bytes/frame |
| 2,000,000 | 363.1 MB | 167.6 MB | 195.5 MB — 102 bytes/frame |

So the usual advice — "never raise the recursion limit, you will segfault" — is
out of date for this shape of recursion on 3.12 and later. It is still true that
you are trading a crash for memory, and 363 MB to reverse a list that iteration
handles in 167 MB is a bad trade. But it is a trade, not a cliff.

## What recursion costs when it does not crash

| n | Head recursion | Tail recursion | Iterative |
|---|---|---|---|
| 1,000 | 5.60us | 0.86us | **0.86us** |
| 10,000 | 57.5us | 8.67us | **8.10us** |
| 100,000 | 568us | 80.3us | **70.4us** |

Head recursion costs **6.5x to 8.1x**, widening with n. The tail-recursive
version lands on the iterative time almost exactly at n = 1,000 — 0.86us against
0.86us — which is what you would expect from two functions that compiled to the
same loop.

Python, medians of three clean runs, timed as a round trip and halved because
reversal mutates:

| n | Head recursion | Tail recursion | Iterative |
|---|---|---|---|
| 100 | 3.74us | 2.78us | **1.55us** |
| 900 | 45.32us | 39.58us | **14.13us** |
| 10,000 | 580.83us | 472.45us | **145.52us** |

**2.4x rising to about 4x**, and no tail-call rescue at any size.

<!-- @intuition -->
Recursion earns its place here by saying the thing out loud — reverse the rest, then put the head on the end — and the iterative loop is what that statement compiles down to once you notice the recursion is only ever carrying one live value per level. The two shapes make that explicit. Head recursion has work waiting after the call, so every level must be remembered, and the memory is real: a fixed stack in C++, heap in modern Python, but always one frame per node. Tail recursion has nothing waiting, so the frame is dead the moment the call is made — and a compiler that notices can reuse it, at which point the function *is* the loop, which is why the same source crashes at one optimisation level and runs unbounded at another. That is the useful lesson underneath the specific problem. Recursion depth is not a property of your algorithm alone; it is a property of your algorithm, your language, and your compiler flags together, and the only way to know where the ceiling is on a given combination is to go and find it.

<!-- @approach -->
### Optimal - Head Recursion

<!-- @idea -->
Reverse everything after the head, then attach the head to the end of that reversed sublist.

<!-- @steps -->
1. If the list is empty or has one node, it is already reversed — return it unchanged.
2. Recursively reverse the sublist starting at `head->next`, keeping its returned head.
3. Note that `head->next` still points at the node it always did, which is now that sublist's **last** node.
4. Set `head->next->next` to `head`, hooking the head onto the end.
5. Set `head->next` to null, because the head is now the tail.
6. Return the head that came back from the recursion, unchanged.

<!-- @complexity -->
- time: O(n) — one frame per node, constant work in each
- space: **O(n)** stack — one frame per node, and the frames must stay alive because work waits after the call
- note: The clearest statement of the algorithm and the one that crashes first. On this machine it dies at **174,500 nodes at `-O0`** and **261,500 at `-O2`**, and runs **6.5x to 8.1x** slower than iteration. Step 5 is not cosmetic: skip it and the output's first n values are correct before it enters a 2-cycle forever.

<!-- @code cpp -->
```cpp
Node* reverse(Node* head) {
    if (head == nullptr || head->next == nullptr) return head;
    Node* newHead = reverse(head->next);
    head->next->next = head;
    head->next = nullptr;
    return newHead;
}
```

<!-- @annotations -->
- 2: Both conditions are needed. `head == nullptr` handles the empty list; `head->next == nullptr` stops at the last node, which becomes the new head and is returned untouched all the way back up.
- 4: `head->next` was never modified, so it still points at the node that is now the reversed sublist's **tail**. Attaching `head` there is what "put the head on the end" means.
- 5: Omitting this leaves the old head pointing forward as well as being pointed at — a 2-cycle. Measured on `0 1 2 3 4`, the walk reads `4 3 2 1 0 1 0 1 0 1 ...` forever.
- 6: `newHead` is passed straight through unchanged at every level. The far end of the original list becomes the front and never moves again.

<!-- @code java -->
```java
static Node reverse(Node head) {
    if (head == null || head.next == null) return head;
    Node newHead = reverse(head.next);
    head.next.next = head;
    head.next = null;
    return newHead;
}
```

<!-- @annotations -->
- 3: Java's stack is per-thread and set by `-Xss`, so the crash depth is tunable at launch in a way the C++ main-thread stack is not. The failure arrives as a catchable `StackOverflowError` rather than a signal.

<!-- @code python -->
```python
def reverse(head):
    if head is None or head.next is None:
        return head
    new_head = reverse(head.next)
    head.next.next = head
    head.next = None
    return new_head


# At the default recursion limit of 1,000 this handles at most 999
# nodes when called at module level -- one fewer for each enclosing
# frame, since the limit counts the whole stack. Raising the limit
# genuinely works on CPython 3.12+ -- verified to 2,000,000 deep --
# but costs about 110 bytes of heap per frame.
```

<!-- @annotations -->
- 6: The one line that separates a reversed list from a cycle, in every language.

<!-- @approach -->
### Tail Recursion with an Accumulator

<!-- @idea -->
Carry the reversed prefix down as a parameter, so nothing is left to do when the recursive call returns.

<!-- @steps -->
1. Take a second parameter `prev`, the reversed prefix built so far, starting as null.
2. If `head` is null, every node has been moved — return `prev` as the new head.
3. Save `head->next` before overwriting it.
4. Point `head->next` at `prev`.
5. Recurse with the saved next node and `head` as the new `prev`, returning that result directly.

<!-- @complexity -->
- time: O(n) — same work, one frame per node
- space: **O(n) stack, or O(1) if the compiler eliminates the tail call** — the whole point of this shape
- note: The recursive call is the last thing that happens, so the frame is dead when it is made. Compiled at `-O2` on this machine, clang emits **no call instruction at all** for this function — just a backward branch — and it survived every depth tested, to nearly 40 million nodes. At `-O0` the same source crashes at 174,500 like any other recursion. CPython does no such thing: there it is always exactly one node *worse* than head recursion — 998 against 999 from module level, 997 against 998 from inside one function.

<!-- @code cpp -->
```cpp
Node* reverseTail(Node* head, Node* prev = nullptr) {
    if (head == nullptr) return prev;
    Node* next = head->next;
    head->next = prev;
    return reverseTail(next, head);
}
```

<!-- @annotations -->
- 5: A genuine tail call — the result is returned directly, with no work after it. That is the precondition for the compiler reusing the frame instead of stacking a new one.
- 2: The base case is `head == nullptr`, one step further than head recursion's `head->next == nullptr`. That is exactly why this version handles one fewer node where the limit is a frame count.
- 1: The default argument lets callers write `reverseTail(head)` and keeps the accumulator out of the public shape. It is also why this cannot be called `reverse` alongside the head-recursive version: a one-argument call would match both overloads, and clang rejects it with `call to 'reverse' is ambiguous`.

<!-- @code java -->
```java
static Node reverseTail(Node head, Node prev) {
    if (head == null) return prev;
    Node next = head.next;
    head.next = prev;
    return reverseTail(next, head);
}
```

<!-- @annotations -->
- 5: The JVM specification does not require tail-call elimination and HotSpot does not perform it, so this shape carries no depth advantage in Java — it is still one frame per node.

<!-- @code python -->
```python
def reverse_tail(head, prev=None):
    if head is None:
        return prev
    nxt = head.next
    head.next = prev
    return reverse_tail(nxt, head)


# CPython performs no tail-call optimisation, so this is still one
# frame per node -- and always exactly one node worse than head
# recursion, whatever the call site: 998 against 999 from module
# level, 997 against 998 from inside one function.
```

<!-- @annotations -->
- 6: Identical in shape to the C++ version and with none of the benefit. Whether a tail call is free is a fact about the implementation, not about the code.

<!-- @approach -->
### Explicit Stack

<!-- @idea -->
Keep the recursion's shape but hold the pending nodes in a container on the heap instead of on the call stack.

<!-- @steps -->
1. Walk the list, pushing every node onto a stack.
2. If the stack is empty, return null.
3. Pop the first node — the original tail — and keep it as the new head.
4. Pop the rest in turn, pointing each popped node's predecessor at it.
5. Set the last node popped — the original head — to point at null.
6. Return the new head.

<!-- @complexity -->
- time: O(n) — one push and one pop per node
- space: **O(n) heap**, not stack
- note: The point is not speed but where the memory lives. This is what head recursion does, with the pending work moved somewhere that grows instead of somewhere fixed, so it does not crash at 174,500 nodes. It is the standard escape hatch when a recursive algorithm is the natural one and the input is too deep for the stack — and it makes plain that recursion's O(n) space was never optional, only invisible.

<!-- @code cpp -->
```cpp
#include <stack>
using namespace std;

Node* reverseWithStack(Node* head) {
    stack<Node*> pending;
    for (Node* p = head; p != nullptr; p = p->next) pending.push(p);
    if (pending.empty()) return nullptr;

    Node* newHead = pending.top(); pending.pop();
    Node* tail = newHead;
    while (!pending.empty()) { tail->next = pending.top(); pending.pop(); tail = tail->next; }
    tail->next = nullptr;
    return newHead;
}
```

<!-- @annotations -->
- 6: Pushing every node first is the equivalent of recursing all the way down before any work happens.
- 12: The old head ends up last and must be terminated explicitly — the same line that head recursion needs, for the same reason.
- 9: `pending.top()` after the loop is the original tail, which is the new head.

<!-- @code java -->
```java
static Node reverseWithStack(Node head) {
    Deque<Node> pending = new ArrayDeque<>();
    for (Node p = head; p != null; p = p.next) pending.push(p);
    if (pending.isEmpty()) return null;

    Node newHead = pending.pop();
    Node tail = newHead;
    while (!pending.isEmpty()) { tail.next = pending.pop(); tail = tail.next; }
    tail.next = null;
    return newHead;
}
```

<!-- @annotations -->
- 2: `ArrayDeque` rather than the legacy `Stack`, which is synchronised and slower for no benefit here.

<!-- @code python -->
```python
def reverse_with_stack(head):
    pending = []
    p = head
    while p is not None:
        pending.append(p)
        p = p.next
    if not pending:
        return None

    new_head = pending.pop()
    tail = new_head
    while pending:
        tail.next = pending.pop()
        tail = tail.next
    tail.next = None
    return new_head


# Same O(n) space as the recursion, on the heap where it can grow.
# No recursion limit to raise and no frame overhead to pay.
```

<!-- @annotations -->
- 15: The old head is popped last and terminated here, exactly as in the recursive version.

<!-- @example -->

<!-- @input -->
`1 -> 2 -> 3 -> null`

<!-- @output -->
`3 -> 2 -> 1 -> null`

<!-- @why -->
Traces head recursion down to the base case and back, which is where `head->next->next` stops looking strange.

<!-- @walkthrough -->
1. `reverse(1)` sees `head->next` is not null, so it calls `reverse(2)`.
2. `reverse(2)` sees `head->next` is not null, so it calls `reverse(3)`.
3. `reverse(3)` has `head->next == nullptr` — base case — and returns node 3.
4. Back in `reverse(2)`: `newHead` is 3, and `head->next` still points at node 3, which is now the reversed sublist's tail. Setting `head->next->next = head` makes 3 point at 2.
5. `reverse(2)` then sets node 2's `next` to null and returns 3 unchanged.
6. Back in `reverse(1)`: `head->next` still points at node 2, now the tail of `3 -> 2`. Setting `head->next->next = head` makes 2 point at 1.
7. Node 1's `next` becomes null, 3 is returned again, and the final list is `3 -> 2 -> 1`.

<!-- @example -->

<!-- @input -->
`0 1 2 3 4` with `head->next = nullptr` deleted

<!-- @output -->
`4 3 2 1 0 1 0 1 0 1 ...`

<!-- @why -->
The single most dangerous bug in this problem, because the output starts out correct.

<!-- @walkthrough -->
1. Every level still runs `head->next->next = head`, so all the backward links get made correctly.
2. But each node also keeps its original forward link, so node 0 points at node 1 while node 1 points back at node 0.
3. Walking from the new head gives `4 3 2 1 0` — the first **five** values, all correct.
4. The walk then follows node 0's stale forward link to node 1, and node 1's new backward link to node 0, forever.
5. Floyd's cycle detection on the result confirms a genuine cycle rather than a long list.
6. A test that prints exactly `n` elements **passes**. A test that walks until null hangs.
7. The fix is the one deleted line, and the general rule is that the node becoming the tail must be terminated explicitly.

<!-- @example -->

<!-- @input -->
The tail-recursive version compiled at `-O0` and at `-O2`

<!-- @output -->
Crashes at 174,500 nodes; never crashes

<!-- @why -->
Shows that recursion depth is a property of the compiler as much as of the code.

<!-- @walkthrough -->
1. The source is character-for-character identical in both cases.
2. At `-O0` the function emits a `bl` instruction and allocates a 48-byte frame with `sub sp, sp, #0x30`.
3. Against an 8,372,224-byte stack that gives 174,250 successful nodes and a crash at 174,500 — 48.0 bytes per frame, matching the assembly exactly.
4. At `-O2` the same function emits **no call instruction at all** and allocates no frame.
5. Its last instruction is `cbnz x0, 0x40`, a backward branch — the compiler turned the tail call into a loop.
6. It then survived every depth tested, to nearly 40 million nodes, where memory rather than stack was the limit.
7. The head-recursive version keeps its `bl` at `-O2` and still crashes, at 261,500, because work waits after its call and the frame cannot be reused.

<!-- @example -->

<!-- @input -->
Python's recursion limit, raised

<!-- @output -->
2,000,000 nodes deep without crashing, at about 110 bytes of heap per frame

<!-- @why -->
Corrects advice that was true before CPython 3.12 and is repeated long after.

<!-- @walkthrough -->
1. The default recursion limit is 1,000, which caps this reversal at 999 nodes called from module level — one fewer per enclosing frame, since the limit counts the whole stack.
2. The usual warning is that raising it will segfault the interpreter, because frames live on the C stack.
3. CPython 3.12 moved Python frames off the C stack, so on 3.13.4 that is no longer what happens.
4. Raising the limit and re-running succeeded at 1,000, 10,000, 100,000, and on to **2,000,000** nodes.
5. That is roughly **8x deeper** than the C++ head-recursive version managed at `-O2`, which died at 261,500.
6. The cost moved rather than vanished: peak memory at 2,000,000 was 363.1 MB recursive against 167.6 MB iterative, about 102 bytes per frame.
7. So it is a trade against memory, not a cliff — but 363 MB to do what iteration does in 167 MB is still a bad trade.

<!-- @visualization code-flow -->

<!-- @description -->
This one is about the stack, so draw the stack. Put the list along the top and grow a column of frames downward as `reverse` descends `1 -> 2 -> 3`, each frame labelled with its own `head`. Freeze at the base case, when three frames are stacked and the deepest one returns node 3 — that held column is the O(n) the complexity line refers to, and it should look expensive. Then unwind upward one frame at a time, and at each level highlight the two pointer writes in sequence: `head->next->next = head` drawn as a new backward arrow, then `head->next = nullptr` drawn as an existing forward arrow being cut. Show the returned `newHead` riding up the column unchanged, the same node 3 at every level. The middle panel replays that unwind with the second write deleted, so the forward arrows are never cut: the backward arrows all appear correctly, the walk reads `4 3 2 1 0`, and then it steps onto a stale forward arrow and starts going round between the last two nodes. Draw that loop as an actual closed circle and let the reader count `1 0 1 0` around it while the correct prefix stays highlighted above — the point being that everything up to `n` was right. The final panel is the two compilations side by side, same source text at the top of both. On the left, `-O0`: a frame column growing to 174,250 with a 48-byte label on each, then a red line at 174,500. On the right, `-O2`: no column at all, just one frame with an arrow curving from its bottom back to its own top, annotated `cbnz` — and instead of a crash line, the depth counter simply keeps running past 39 million. Beneath both, the two crash depths against the 8,372,224-byte stack, and the arithmetic that ties them to the frame sizes.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4","stackBytes":8372224},"recursiveStatement":{"rule":"reverse the rest, then put the head on the end","trace":["reverse(1 -> 2 -> 3)","= reverse(2 -> 3) followed by 1","= (3 -> 2) followed by 1","= 3 -> 2 -> 1"],"baseCase":"zero or one node is already reversed"},"theTwoWrites":{"first":"head->next->next = head","whyItLooksWrong":"head->next was never modified, so after the recursive call it points at the reversed sublist's LAST node -- attaching head there is exactly 'put the head on the end'","second":"head->next = nullptr","whyItIsRequired":"the head is now the tail and must be terminated","newHeadIsPassedThrough":"the far end of the original list becomes the front and never moves again"},"missingNullBug":{"input":"0 1 2 3 4","walk":"4 3 2 1 0 1 0 1 0 1 ...","firstNValuesCorrect":true,"n":5,"cycle":"nodes 0 and 1 point at each other","floydCycleDetection":"CYCLE FOUND","whyItIsDangerous":"a test that prints exactly n elements PASSES; a test that walks to null hangs","fix":"the one deleted line"},"twoRecursionShapes":{"head":{"code":"newHead = reverse(head->next); head->next->next = head; head->next = nullptr;","workAfterCall":true,"canBeFlattened":false},"tail":{"code":"head->next = prev; return reverse(next, head);","workAfterCall":false,"canBeFlattened":true,"precondition":"the recursive call's result is returned directly"}},"stackCeilings":{"unit":"node count at which the program crashes","rows":[{"variant":"head recursion","O0":174500,"O2":261500},{"variant":"tail recursion","O0":174500,"O2":"never crashes -- 39,921,876 tested, limited by memory"},{"variant":"iterative","O0":"never crashes","O2":"never crashes"}],"note":"the tail-recursive source is character-for-character identical in both columns"},"disassemblyProof":{"tailAtO2":{"blInstructions":0,"frameSetup":"none","lastInstruction":"cbnz x0, 0x4","meaning":"a backward branch -- the compiler turned the tail call into a loop"},"headAtO2":{"blInstructions":1,"meaning":"still a real call; work waits after it so the frame cannot be reused"},"frameSizes":[{"opt":"-O0","asm":"sub sp, sp, #0x30","bytes":48,"measured":48.0},{"opt":"-O2","asm":"stp x20, x19, [sp, #-0x20]!","bytes":32,"measured":32.0}],"corroboration":"8,372,224 / crash depth matches the assembly frame size exactly at both optimisation levels"},"pythonInverts":{"noTailCallOptimisation":true,"atDefaultLimit":{"limit":1000,"headRecursion":999,"tailRecursion":998,"measuredFrom":"a module-level call","callSiteMatters":"the limit counts every frame on the stack, so from one enclosing function the pair is 998/997 and from two it is 997/996 -- the invariant is the gap of exactly one","whyTailIsWorse":"its base case is head is None, one step further than head recursion's head.next is None"},"raisingTheLimit":{"folklore":"raising it will segfault the interpreter","stillTrueBefore":"CPython 3.11 and earlier","measuredOn3134":"succeeded at 1,000 / 10,000 / 100,000 / 1,000,000 / 2,000,000 nodes","versus":"about 8x deeper than C++ head recursion managed at -O2 (261,500)","why":"CPython 3.12 moved Python frames off the C stack"},"memoryCost":{"unit":"peak RSS","rows":[{"n":500000,"recursive":"106.1 MB","iterative":"52.6 MB","bytesPerFrame":112},{"n":1000000,"recursive":"196.1 MB","iterative":"90.9 MB","bytesPerFrame":110},{"n":2000000,"recursive":"363.1 MB","iterative":"167.6 MB","bytesPerFrame":102}],"verdict":"a trade against memory, not a cliff -- but 363 MB to do what iteration does in 167 MB is a bad trade"}},"benchCpp":{"unit":"microseconds, medians of nine, list length asserted after timing","rows":[{"n":1000,"headRec":5.60,"tailRec":0.86,"iterative":0.86},{"n":10000,"headRec":57.5,"tailRec":8.67,"iterative":8.10},{"n":100000,"headRec":568,"tailRec":80.3,"iterative":70.4}],"headRecVsIterative":"6.5x to 8.1x, widening with n","tailRecVsIterative":"lands on it almost exactly at n=1,000 -- 0.86us against 0.86us -- as two functions compiled to the same loop should"},"benchPython":{"unit":"microseconds, medians of three clean runs, round trip halved with the list verified intact","rows":[{"n":100,"headRec":3.74,"tailRec":2.78,"iterative":1.55},{"n":900,"headRec":45.32,"tailRec":39.58,"iterative":14.13},{"n":10000,"headRec":580.83,"tailRec":472.45,"iterative":145.52}],"verdict":"2.4x rising to about 4x, with no tail-call rescue at any size"},"verification":{"approachesCompared":"head recursion / tail recursion / iterative","range":"n = 0..200","disagreements":0,"languages":["C++","Python"]},"recommendation":"understand head recursion for what it says about the structure; ship the iterative loop","lesson":"recursion depth is not a property of your algorithm alone -- it is your algorithm, your language and your compiler flags together, and the ceiling has to be measured on the combination you actually ship"}
```

<!-- @highlights -->
- The list runs along the top and a column of frames grows downward as `reverse` descends `1 -> 2 -> 3`, each frame labelled with its own `head`.
- The descent freezes at the base case, three frames stacked, the deepest returning node 3.
- That held column is the O(n) the complexity line refers to, and it should look expensive.
- The unwind goes back up one frame at a time, highlighting two pointer writes per level.
- `head->next->next = head` is drawn as a new backward arrow appearing.
- `head->next = nullptr` is drawn as an existing forward arrow being cut.
- The returned `newHead` rides up the column unchanged — the same node 3 at every level.
- The middle panel replays the unwind with the second write deleted, so forward arrows are never cut.
- The backward arrows all appear correctly and the walk reads `4 3 2 1 0`.
- The walk then steps onto a stale forward arrow and circles between the last two nodes.
- That loop is drawn as an actual closed circle, with `1 0 1 0` countable around it.
- The correct prefix stays highlighted above it — everything up to `n` was right.
- The final panel puts the two compilations side by side, same source text atop both.
- On the left, `-O0`: a frame column growing to 174,250 with a 48-byte label on each, then a red line at 174,500.
- On the right, `-O2`: one frame with an arrow curving from its bottom back to its own top, annotated `cbnz`.
- Instead of a crash line, the right-hand depth counter keeps running past 39 million.
- Beneath both sit the crash depths against the 8,372,224-byte stack and the arithmetic tying them to the frame sizes.

<!-- @edgeCases -->
- The empty list — caught by the first half of the base case, returns null without recursing.
- A one-node list — caught by the second half, returned unchanged with its `next` already null.
- A two-node list — the shallowest case that actually performs both pointer writes.
- The original tail — becomes the new head, is returned from the base case, and rides back up through every level untouched.
- The original head — becomes the new tail, and is the node whose `next` must be explicitly nulled.
- A list long enough to overflow the stack — 174,500 nodes at `-O0`, 261,500 at `-O2`, and no ceiling at all for the tail-recursive version once the compiler flattens it.
- A list longer than Python's recursion limit — 1,000 by default, so 999 nodes for head recursion and 998 for the tail-recursive form when called at module level, one fewer of each per enclosing frame.
- Raising Python's recursion limit — works on CPython 3.12 and later, verified to 2,000,000, at about 110 bytes of heap per frame.
- The tail-recursive version called without its accumulator — the default argument of null is what makes `reverse(head)` correct.
- A cyclic list passed in — the recursion never reaches a base case and overflows the stack rather than returning.
- The explicit-stack version on an empty list — returns null on the empty check, before any pop can fail.

<!-- @pitfalls -->
- Forgetting `head->next = nullptr`. The first n values still print correctly, then the walk enters a 2-cycle forever — measured as `4 3 2 1 0 1 0 1 0 1 ...`.
- Testing the result by printing exactly n elements. That test passes on the cycle bug; walk to null instead, or run Floyd's detection.
- Writing `newHead->next = head` instead of `head->next->next = head`. `newHead` is the far end of the list, not the node adjacent to `head`.
- Returning `head` instead of `newHead`. The new head comes from the base case and must be passed through every level unchanged.
- Using only `head == nullptr` as the base case. It works, but it recurses one level deeper than needed and costs a node of depth.
- Assuming the tail-recursive version is always cheap. It is free at `-O2` on this machine and crashes at 174,500 at `-O0`, from identical source.
- Assuming any language will eliminate a tail call. CPython does not, and the JVM specification does not require it — there the accumulator version is one frame per node like any other.
- Writing the tail-recursive version in Python for depth reasons. It handles exactly one node fewer than head recursion at any call site — strictly worse.
- Believing that raising Python's recursion limit segfaults. True before CPython 3.12; on 3.13.4 this recursed 2,000,000 deep, paying memory instead.
- Reaching for recursion on input you did not build. It costs 6.5x to 8.1x in C++ and 2.4x to 4x in Python, with a crash waiting at the end.
- Passing a cyclic list to any of these. There is no base case on that path, so the recursion overflows rather than terminating.

<!-- @doubt -->
### Why is it `head->next->next = head` and not something simpler?

<!-- @answer -->
Because `head->next` is the one pointer the recursion has **not** touched, which makes it the handle you need. The recursive call reversed everything from `head->next` onward, so the node `head->next` refers to — still the same node it always referred to — is now that reversed sublist's **last** node. Setting its `next` to `head` is precisely "put the head on the end". The tempting alternative, `newHead->next = head`, is wrong because `newHead` is the far end of the list, not the node next to you: on `1 -> 2 -> 3` that would make 3 point at 1 and lose 2 entirely. Think of it as the recursion returning two things through one channel — `newHead` is the answer to pass upward untouched, and `head->next` is the local attachment point that only this frame knows about.

<!-- @doubt -->
### What actually breaks if I skip `head->next = nullptr`?

<!-- @answer -->
You get a cycle, and it hides behind correct-looking output. Every level still runs `head->next->next = head`, so all the backward links are made properly — but each node also keeps its original forward link. On `0 1 2 3 4` the result walks as `4 3 2 1 0 1 0 1 0 1 ...`: the first **five** values are exactly right, then nodes 0 and 1 point at each other and it never terminates. Floyd's cycle detection confirms a real cycle. This is worth dwelling on because of how it fails a test suite — printing `n` elements **passes**, and only walking until null reveals the hang. The general rule behind the line is the one this topic keeps returning to: the node that becomes the tail has to be terminated explicitly, because nothing else will do it for you.

<!-- @doubt -->
### Is the recursive version ever as fast as the loop?

<!-- @answer -->
The tail-recursive one is, when the compiler flattens it, because at that point it **is** the loop. At n = 1,000 with `-O2` it measured 0.86 microseconds against the iterative 0.86 — identical, which is what two functions compiled to the same machine code should do. The disassembly confirms it: at `-O2` that function contains no call instruction at all, no frame setup, and ends with `cbnz x0, 0x40`, a backward branch. Head recursion is a different story and never catches up: 5.60 microseconds against 0.86 at n = 1,000, and 568 against 70.4 at n = 100,000 — **6.5x to 8.1x**, widening with n. In Python nothing is flattened and both recursive forms cost 2.4x to about 4x. So the honest summary is that recursion is either exactly as fast as the loop or several times slower, and which one you get is decided by your compiler rather than your source.

<!-- @doubt -->
### Can I just raise Python's recursion limit?

<!-- @answer -->
On CPython 3.12 and later, yes — and the warning you have probably heard is out of date. The usual advice is that raising `sys.setrecursionlimit` will segfault the interpreter because frames live on the C stack, which was true through 3.11. CPython 3.12 moved Python frames off the C stack, and on 3.13.4 this reversal recursed **2,000,000 nodes deep** without crashing, roughly **8x deeper than the C++ version managed** at `-O2`. That inversion is genuinely surprising: the language with the notorious 1,000-frame default out-recurses the one with no limit at all, because C++ frames are stuck inside a fixed 8 MB stack while Python's grow on the heap. The catch is that the cost moved rather than disappeared — about **110 bytes of heap per frame**, so 2,000,000 nodes cost 363.1 MB against iteration's 167.6 MB. It is a trade, not a cliff, and it is still a bad trade.

<!-- @doubt -->
### If tail recursion is free, why not always write that?

<!-- @answer -->
Because "free" is a fact about your compiler, not about your code, and the same source gives you both answers. Compiled at `-O2` the tail-recursive version never crashed at any depth tested, to nearly 40 million nodes. Compiled at `-O0` — character-for-character identical — it crashed at **174,500**, exactly like head recursion. If you rely on the elimination, you are relying on a build flag, and a debug build of the same program will die on input the release build handles. It is worse elsewhere: CPython performs no tail-call optimisation at all, so there the accumulator version is one frame per node and actually **one node worse** than head recursion at any call site — 998 against 999 from module level — because its base case sits one step further along. The JVM specification does not require the optimisation either. Write tail-recursively when it reads well, but do not treat it as a depth guarantee unless you have measured the exact toolchain you ship.

<!-- @doubt -->
### So should I ever use recursion for this?

<!-- @answer -->
Use it to understand the problem, and ship the loop. The recursive form states the algorithm in one line — reverse the rest, put the head on the end — and that framing is what makes the harder list problems tractable later, where the recursion is genuinely carrying structure the loop cannot. For plain reversal it is not carrying anything: each level holds one live pointer, which is exactly what the iterative version keeps in a variable, so the O(n) stack buys nothing over O(1). And the costs are real — 6.5x to 8.1x slower in C++, 2.4x to 4x in Python, with a hard crash at 174,500 or 261,500 nodes depending on optimisation level. If you have a genuinely recursive algorithm and input too deep for the stack, the escape hatch is the explicit-stack version: identical shape, O(n) space moved to the heap where it can grow, and no crash.

<!-- @doubt -->
### Why does the crash depth change between `-O0` and `-O2`?

<!-- @answer -->
Because the frame gets smaller. At `-O0` the compiler keeps every local in memory and emits `sub sp, sp, #0x30` — a **48-byte** frame. At `-O2` it keeps them in registers and only spills what it must, emitting `stp x20, x19, [sp, #-0x20]!` — **32 bytes**. Against this machine's 8,372,224-byte stack that predicts 174,421 and 261,632 frames, and the measured crash points were 174,500 and 261,500, which works out to 48.0 and 32.0 bytes per frame. Measurement and disassembly agree to the decimal, which is the useful part: stack depth is not mysterious, it is stack size divided by frame size, and both numbers are things you can go and look at. It also explains why the head-recursive version still crashes at `-O2` while the tail-recursive one does not — a smaller frame is still a frame, and only eliminating the call removes it entirely.
