---
id: add-one-to-a-number-represented-by-ll
topic: Linked Lists
title: Add one to a number represented by LL
difficulty: Medium
status: ready
prerequisites:
  - reverse-a-linkedlist-iterative
  - reverse-a-ll
  - introduction-to-singly-linkedlist
  - find-the-length-of-the-linked-list
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - add-two-numbers-in-linked-list
  - reverse-a-linkedlist-iterative
  - reverse-a-ll
  - find-the-intersection-point-of-y-ll
  - sort-ll
---

<!-- @summary -->
The arithmetic is almost free and the traversal is not: measured on uniform random digits, the carry travels a mean of **1.111 digits** — matching the predicted 10/9 exactly — yet the list is stored most-significant-first, so finding where to apply it costs a full forward pass. The version that scans once for the last digit below 9 runs **about 2x** faster than reversing twice, and the only input needing a brand-new node is the all-nines one.

<!-- @theory -->
## The problem

The number is stored one digit per node, **most significant first** — the head is
the leading digit.

```
3 -> 4 -> 5     is 345, and +1 gives     3 -> 4 -> 6
9 -> 9 -> 9     is 999, and +1 gives 1 -> 0 -> 0 -> 0
```

That second line is the whole difficulty in miniature. Addition carries from the
**right**, the list can only be walked to the **left-to-right**, and occasionally
the result needs a node that does not exist yet.

## The carry is short, and that is not the problem

Adding one only propagates while it meets a 9. Measured over 200,000 random
numbers at each size, with uniform digits:

| Digits | Mean carry depth | Deepest seen |
|---|---|---|
| 5 | 1.1102 | 5 |
| 10 | 1.1117 | 6 |
| 50 | 1.1105 | 6 |
| 1,000 | 1.1106 | 7 |

The theoretical mean is `Σ k · (1/10)^(k−1) · (9/10) = 10/9 = 1.1111`, and the
measurements land on it. So the arithmetic itself is **O(1) expected** — on a
thousand-digit number the carry almost never touches more than two digits.

What costs O(n) is not the addition but the **navigation**. The digit that needs
incrementing is near the end, and a singly linked list stored
most-significant-first gives no way to start there. Every approach below is a
different way of paying that travel cost.

## Scan once for the last digit below 9

Walk the list remembering the last node whose digit is not 9. That node is where
the carry stops. Increment it, and set every digit after it to zero.

```cpp
Node* addOne(Node* head) {
    Node* lastNotNine = nullptr;
    for (Node* p = head; p != nullptr; p = p->next) {
        if (p->data != 9) lastNotNine = p;
    }
    if (lastNotNine == nullptr) {           // every digit is a 9
        Node* newHead = new Node(1);
        newHead->next = head;
        for (Node* p = head; p != nullptr; p = p->next) p->data = 0;
        return newHead;
    }
    lastNotNine->data++;
    for (Node* p = lastNotNine->next; p != nullptr; p = p->next) p->data = 0;
    return head;
}
```

Checked against a reference implementation on **every digit string up to length
six** — 1,111,110 numbers — with zero disagreements, alongside the two
alternatives below.

## The all-nines case is the only one that grows

`lastNotNine` stays null exactly when every digit is a 9, and that is precisely
when the answer has one more digit than the input:

| Input | Output | Length |
|---|---|---|
| `9` | `1 0` | 1 → 2 |
| `99` | `1 0 0` | 2 → 3 |
| `999` | `1 0 0 0` | 3 → 4 |
| `9999` | `1 0 0 0 0` | 4 → 5 |

No other input allocates anything. That makes the null check both the
edge-case guard and the signal for when a node is needed — one test doing two
jobs, which is why it is worth writing the scan this way rather than tracking a
separate flag.

## Reversing works and costs twice as much

The other standard answer reverses the list so the least significant digit comes
first, adds with an ordinary carry loop, and reverses back. Counted in pointer
dereferences at 100,000 digits:

| Input | Scan for last non-9 | Reverse twice |
|---|---|---|
| A typical number | **100,001** | 200,001 |
| All nines | **100,000** | 300,000 |

The two reversals cost `2n` before any arithmetic happens, and the carry loop
adds its own distance on top — which is why the all-nines row is 300,000 rather
than 200,000. The scan pays `n` and then a fix-up whose length is the carry
depth, averaging 1.11.

Timed at 200,000 digits:

| | C++ | Python |
|---|---|---|
| Scan for last non-9 | **289.6us** | **5,204us** |
| Reverse twice | 571.5us | 7,680us |

About **2x** in C++ and 1.5x in Python. Reversing is not wrong — it is the shape
that generalises to **Add two numbers in Linked List**, where both operands must
be walked from the least significant end — but for adding one it does work the
problem does not require.

## Recursion, and the ceiling it inherits

The third option lets the call stack do the reversing: recurse to the end, then
let the carry come back up through the returns.

It is the clearest expression of "carry from the right" and it costs one stack
frame per digit. Measured on this machine, against an 8,372,224-byte stack:

| Build | Digits handled |
|---|---|
| `-O0` | 174,252 |
| `-O2` | 261,123 |
| CPython, default limit | **997** |

Those C++ figures are the same ones **Reverse a LL** measured for a different
recursive function — 174,250 and 261,250 — because the frames are the same size,
48 bytes unoptimised and 32 optimised. The ceiling is a property of the frame and
the stack, not of the algorithm.

<!-- @intuition -->
It is worth separating two things that both look like "the cost of this problem". The addition is trivial and short — a carry that dies at the first digit below nine, which for random input means it almost never travels past the second digit. The expense is entirely that the digit you need is at the far end of a structure you can only enter from the near end. Once that is clear the three solutions stop looking like different algorithms and start looking like three ways of buying the same trip: scan to find the target and come back, physically turn the list around and turn it back, or let the call stack remember the way home for you. The scan wins because it buys the trip once; reversing buys it three times; recursion buys it once but pays for the memory of it, one frame per digit. The other thing worth taking away is the shape of the special case. Every digit being nine is the only input whose answer is longer than its input, and the same test that detects it — no digit below nine was ever seen — is also the thing that tells you a node must be allocated. When an edge case and its detector collapse into one check like that, it is usually a sign the algorithm is stated in the right terms.

<!-- @approach -->
### Optimal - Find the Last Digit Below 9

<!-- @idea -->
Scan once remembering the last non-nine digit, then increment it and zero everything after it.

<!-- @steps -->
1. Walk the whole list, keeping a pointer to the most recent node whose digit is not 9.
2. If no such node was ever seen, every digit is a 9 — allocate a new leading node holding 1, zero the whole list, and return the new head.
3. Otherwise increment the digit at that remembered node.
4. Walk from the node after it to the end, setting every digit to 0.
5. Return the original head, which has not moved.

<!-- @complexity -->
- time: O(n) — one full scan, then a fix-up whose length is the carry depth, averaging 1.11 digits
- space: **O(1)** — one pointer, plus a single node only in the all-nines case
- note: The one to write. It reads **half** the pointers of the reversing version — 100,001 against 200,001 at a hundred thousand digits — and runs about **2x** faster. The null check on step 2 does double duty: it detects the all-nines input and tells you a node must be allocated, which are the same condition.

<!-- @code cpp -->
```cpp
Node* addOne(Node* head) {
    Node* lastNotNine = nullptr;
    for (Node* p = head; p != nullptr; p = p->next) {
        if (p->data != 9) lastNotNine = p;
    }
    if (lastNotNine == nullptr) {
        Node* newHead = new Node(1);
        newHead->next = head;
        for (Node* p = head; p != nullptr; p = p->next) p->data = 0;
        return newHead;
    }
    lastNotNine->data++;
    for (Node* p = lastNotNine->next; p != nullptr; p = p->next) p->data = 0;
    return head;
}
```

<!-- @annotations -->
- 4: Overwriting on every non-nine, so the pointer ends on the **last** one — the digit where the carry stops.
- 6: Null here means no digit below 9 was ever seen, which is exactly the all-nines case and exactly when a new node is required.
- 13: The zeroing walk runs for the carry depth, which averages 1.11 digits on random input and is `n` only when the number ends in a run of nines.
- 14: Returning the original head, which is correct for every input except the all-nines one — handled by its own return above.

<!-- @code java -->
```java
static Node addOne(Node head) {
    Node lastNotNine = null;
    for (Node p = head; p != null; p = p.next) {
        if (p.data != 9) lastNotNine = p;
    }
    if (lastNotNine == null) {
        Node newHead = new Node(1);
        newHead.next = head;
        for (Node p = head; p != null; p = p.next) p.data = 0;
        return newHead;
    }
    lastNotNine.data++;
    for (Node p = lastNotNine.next; p != null; p = p.next) p.data = 0;
    return head;
}
```

<!-- @annotations -->
- 7: The only allocation this algorithm ever performs, and only for the all-nines input.

<!-- @code python -->
```python
def add_one(head):
    last_not_nine = None
    p = head
    while p is not None:
        if p.data != 9:
            last_not_nine = p
        p = p.next

    if last_not_nine is None:
        new_head = Node(1)
        new_head.next = head
        p = head
        while p is not None:
            p.data = 0
            p = p.next
        return new_head

    last_not_nine.data += 1
    p = last_not_nine.next
    while p is not None:
        p.data = 0
        p = p.next
    return head


# The scan is O(n) and the fix-up is O(1) expected -- the carry
# stops at the first digit below 9, a mean of 1.111 digits in.
```

<!-- @annotations -->
- 9: One test serving as both the edge-case detector and the allocation trigger, because they are the same condition.

<!-- @approach -->
### Reverse, Add, Reverse Back

<!-- @idea -->
Turn the list around so the least significant digit is first, run an ordinary carry loop, then turn it back.

<!-- @steps -->
1. Reverse the list, so the ones digit is at the head.
2. Walk from the head with a carry of 1, replacing each digit with the sum modulo 10.
3. Stop as soon as the carry becomes zero.
4. If the walk reaches the end still carrying, append a new node holding the carry.
5. Reverse the list back and return the new head.

<!-- @complexity -->
- time: O(n) — two full reversals plus the carry walk
- space: **O(1)** — the reversals are in place
- note: Correct, and it does the work twice over: `2n` dereferences for the reversals before any arithmetic, giving 200,001 against the scan's 100,001 at a hundred thousand digits, and about **2x** the wall clock. Its real value is that it is the shape that generalises — **Add two numbers in Linked List** needs both operands walked from the least significant end, and there this reversal is not optional.

<!-- @code cpp -->
```cpp
Node* addOneByReversing(Node* head) {
    Node* rev = reverseList(head);

    int carry = 1;
    for (Node* p = rev; p != nullptr && carry; p = p->next) {
        int sum = p->data + carry;
        p->data = sum % 10;
        carry = sum / 10;
    }
    if (carry) {
        Node* last = rev;
        while (last->next != nullptr) last = last->next;
        last->next = new Node(carry);
    }
    return reverseList(rev);
}
```

<!-- @annotations -->
- 5: The `&& carry` is what keeps this O(1) expected after the reversal — the loop stops at the first digit below 9 rather than walking the whole list.
- 10: Reached only for the all-nines input, where the carry survives every digit. The new node is appended to the **reversed** list, so it becomes the leading digit after the final reversal.
- 15: Reversing back is mandatory — without it the caller receives the digits in the wrong order, and the answer looks like a completely different number.

<!-- @code java -->
```java
static Node addOneByReversing(Node head) {
    Node rev = reverseList(head);

    int carry = 1;
    for (Node p = rev; p != null && carry != 0; p = p.next) {
        int sum = p.data + carry;
        p.data = sum % 10;
        carry = sum / 10;
    }
    if (carry != 0) {
        Node last = rev;
        while (last.next != null) last = last.next;
        last.next = new Node(carry);
    }
    return reverseList(rev);
}
```

<!-- @annotations -->
- 5: `carry != 0` written out, since Java will not treat an `int` as a condition.

<!-- @code python -->
```python
def add_one_by_reversing(head):
    rev = reverse_list(head)

    carry = 1
    p = rev
    while p is not None and carry:
        total = p.data + carry
        p.data = total % 10
        carry = total // 10
        p = p.next

    if carry:
        last = rev
        while last.next is not None:
            last = last.next
        last.next = Node(carry)

    return reverse_list(rev)


# Two full reversals before any arithmetic -- 200,001 dereferences
# against the scan's 100,001 at a hundred thousand digits.
```

<!-- @annotations -->
- 6: Stopping on the carry rather than walking to the end, which is what makes the arithmetic cheap even though the reversals are not.

<!-- @approach -->
### Recursion, Carrying Back Up

<!-- @idea -->
Recurse to the last digit, then let the carry propagate back through the returns.

<!-- @steps -->
1. On reaching the end of the list, return a carry of 1 — that is the "add one".
2. Otherwise recurse on the rest of the list first and take the carry it returns.
3. Add that carry to the current digit.
4. Store the result modulo 10 and return the new carry.
5. At the top, if a carry comes back, allocate a new leading node holding it.

<!-- @complexity -->
- time: O(n) — one frame per digit, descending and returning
- space: **O(n)** stack — the call stack is doing the reversal
- note: The most direct statement of "carry from the right", and the least practical. It costs one frame per digit, and the ceiling is the same one **Reverse a LL** measured for a different recursive function — **174,252** digits at `-O0` and **261,123** at `-O2`, because the frames are identically sized. CPython handles **997** digits at the default recursion limit.

<!-- @code cpp -->
```cpp
static int addOneCarry(Node* p) {
    if (p == nullptr) return 1;
    int carry = addOneCarry(p->next);
    int sum = p->data + carry;
    p->data = sum % 10;
    return sum / 10;
}

Node* addOneRecursive(Node* head) {
    int carry = addOneCarry(head);
    if (carry) {
        Node* newHead = new Node(carry);
        newHead->next = head;
        return newHead;
    }
    return head;
}
```

<!-- @annotations -->
- 2: Returning 1 at the end of the list **is** the increment — the "add one" is the base case rather than a separate step.
- 3: Work happens after this call returns, so the frame cannot be reused and no compiler will flatten this into a loop.
- 11: The carry surviving all the way back to the top means every digit was a 9, which is the same condition the scanning version detects with a null pointer.

<!-- @code java -->
```java
static int addOneCarry(Node p) {
    if (p == null) return 1;
    int carry = addOneCarry(p.next);
    int sum = p.data + carry;
    p.data = sum % 10;
    return sum / 10;
}

static Node addOneRecursive(Node head) {
    int carry = addOneCarry(head);
    if (carry != 0) {
        Node newHead = new Node(carry);
        newHead.next = head;
        return newHead;
    }
    return head;
}
```

<!-- @annotations -->
- 3: The JVM does not eliminate this call either, and its depth limit is set per-thread by `-Xss` rather than fixed at build time.

<!-- @code python -->
```python
def _add_one_carry(p):
    if p is None:
        return 1
    carry = _add_one_carry(p.next)
    total = p.data + carry
    p.data = total % 10
    return total // 10


def add_one_recursive(head):
    carry = _add_one_carry(head)
    if carry:
        new_head = Node(carry)
        new_head.next = head
        return new_head
    return head


# 997 digits at CPython's default recursion limit of 1,000 --
# one frame per digit, and the limit counts the whole stack.
```

<!-- @annotations -->
- 4: One frame per digit, which caps this at under a thousand digits unless the recursion limit is raised.

<!-- @example -->

<!-- @input -->
`1 -> 2 -> 9 -> 9`

<!-- @output -->
`1 -> 3 -> 0 -> 0`

<!-- @why -->
A trace where the carry actually travels, showing what the remembered pointer is for.

<!-- @walkthrough -->
1. The scan walks all four nodes, updating `lastNotNine` whenever the digit is not 9.
2. It updates on the 1, then on the 2, and not on either 9 — so it finishes pointing at the node holding 2.
3. That node is where the carry stops, because a digit below 9 absorbs the increment without producing another carry.
4. Incrementing it gives 3.
5. Everything after it was a 9 and must become 0, so the fix-up walk sets both trailing nodes to 0.
6. The result is `1 3 0 0`, and the head never moved.
7. The fix-up walked two nodes here; across random numbers that walk averages **1.11** nodes, because the carry stops at the first digit below 9.

<!-- @example -->

<!-- @input -->
`9 -> 9 -> 9`

<!-- @output -->
`1 -> 0 -> 0 -> 0`

<!-- @why -->
The only shape of input whose answer is longer than its input, and the one case that allocates.

<!-- @walkthrough -->
1. The scan never finds a digit below 9, so `lastNotNine` is still null when the walk ends.
2. That single fact carries two pieces of information: the input is all nines, and the answer needs a digit the list does not have.
3. A new node holding 1 is allocated and linked in front of the existing head.
4. Every original digit becomes 0, since `999 + 1 = 1000`.
5. The returned head is the new node, not the one that was passed in — so a caller ignoring the return value keeps a pointer to `000`.
6. Measured across lengths 1 to 5: `9`→`10`, `99`→`100`, `999`→`1000`, `9999`→`10000`, each one node longer.
7. This is also the only input where the reversing version appends a node and the recursive version returns a carry at the top — three approaches, same single special case.

<!-- @example -->

<!-- @input -->
200,000 random numbers of each length, measuring how far the carry travels

<!-- @output -->
A mean of 1.111 digits, matching the predicted 10/9

<!-- @why -->
Separates the cost of the arithmetic from the cost of reaching it, which is what the algorithm choice actually turns on.

<!-- @walkthrough -->
1. Adding one propagates only while it meets a 9, so it stops at the first digit below 9 counting from the right.
2. For uniform digits the chance of running through `k` nines is `(1/10)^k`, giving an expected depth of `Σ k · (1/10)^(k−1) · (9/10) = 10/9`.
3. Measured over 200,000 trials at each of 5, 10, 50 and 1,000 digits: **1.1102, 1.1117, 1.1105, 1.1106**.
4. The deepest carry seen in any of those 800,000 trials was 7 digits.
5. So the addition is O(1) expected regardless of how long the number is.
6. What is not O(1) is finding the digit to start at, since the list runs most significant first and can only be walked forwards.
7. Every approach here is a different way of paying that travel — scan and come back, reverse and reverse again, or recurse and unwind.

<!-- @example -->

<!-- @input -->
The recursive version on progressively longer numbers

<!-- @output -->
174,252 digits at `-O0`, 261,123 at `-O2`, and 997 in CPython

<!-- @why -->
Shows the ceiling is a property of the frame size and the stack, not of this particular algorithm.

<!-- @walkthrough -->
1. The recursion holds one frame per digit, because the carry is computed after the recursive call returns.
2. Against this machine's 8,372,224-byte stack that gives 174,252 digits unoptimised.
3. At `-O2` the frame shrinks and the ceiling rises to 261,123.
4. **Reverse a LL** measured 174,250 and 261,250 for an entirely different recursive function on the same machine.
5. The near-identical numbers are not a coincidence — both functions compile to the same 48-byte and 32-byte frames.
6. So the limit belongs to the frame size and the stack, and knowing one function's ceiling tells you another's.
7. CPython caps at **997** digits under its default recursion limit of 1,000, the remaining frames being the call site's own.

<!-- @visualization linked-list -->

<!-- @description -->
Draw the number as a row of digit nodes with place values written above them — thousands, hundreds, tens, units — because the direction mismatch is the entire problem and it only becomes obvious when the place values are visible. Use `1 2 9 9`. Open by showing what addition wants to do: an arrow entering from the **right**, at the units digit, pointing left. Then show what the list permits: an arrow entering from the **left**, at the head, pointing right. Those two arrows opposing each other is the frame for everything that follows. Run the scan: a marker sweeps left to right and a second, distinct marker snaps onto each non-nine digit as it passes, visibly staying put while the two nines slide by, so it finishes parked on the 2. Label it the carry stops here. Then the fix-up: increment the 2 to a 3, and sweep right zeroing the trailing nines, with a small counter showing the fix-up length — 2 here, and captioned that it averages 1.11 across random numbers. The second panel is the all-nines case on `9 9 9`: the snapping marker never fires, and the frame should hold on it never firing, since that absence is the entire detection mechanism. Then a new node materialises in front of the head holding 1, the rest zero out, and the row is visibly one node longer than it started — with the old head pointer left dangling on the `0` to make the point that the return value must be used. Close with the three approaches drawn as travel diagrams over the same row: the scan traversing it once with a short backtrack, the reversal traversing it three times, and the recursion traversing it once while stacking a frame per digit beside it. Put the dereference counts under each — 100,001, 200,001, and one frame per digit — so the comparison is a picture of distance travelled rather than a table.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4","stackBytes":8372224},"representation":{"order":"most significant digit first -- the head is the leading digit","examples":[{"list":"3 -> 4 -> 5","value":345,"plusOne":"3 -> 4 -> 6"},{"list":"9 -> 9 -> 9","value":999,"plusOne":"1 -> 0 -> 0 -> 0"}]},"theCoreTension":{"additionCarriesFrom":"the right","listCanOnlyBeWalked":"left to right","consequence":"the digit to increment is near the end of a structure you can only enter at the beginning","everyApproachIs":"a different way of paying that travel cost"},"carryDepth":{"rule":"adding one propagates only while it meets a 9, so it stops at the first digit below 9 from the right","predictedMean":"sum k*(1/10)^(k-1)*(9/10) = 10/9 = 1.1111","measured":[{"digits":5,"meanDepth":1.1102,"deepestSeen":5},{"digits":10,"meanDepth":1.1117,"deepestSeen":6},{"digits":50,"meanDepth":1.1105,"deepestSeen":6},{"digits":1000,"meanDepth":1.1106,"deepestSeen":7}],"trialsEach":200000,"conclusion":"the arithmetic is O(1) expected regardless of the number's length; the O(n) is navigation, not addition"},"correctness":{"comparedAgainst":"a big-decimal reference","cpp":{"range":"every digit string up to length 6","numbers":1111110,"disagreements":0},"python":{"range":"every digit string up to length 5","numbers":111110,"disagreements":0}},"allNinesIsTheOnlySpecialCase":{"why":"it is the only input whose answer has more digits than its input","detection":"the scan never sees a digit below 9, so its remembered pointer stays null","doubleDuty":"that same null both identifies the case and signals that a node must be allocated","table":[{"in":"9","out":"1 0","lengths":"1 -> 2"},{"in":"99","out":"1 0 0","lengths":"2 -> 3"},{"in":"999","out":"1 0 0 0","lengths":"3 -> 4"},{"in":"9999","out":"1 0 0 0 0","lengths":"4 -> 5"}],"acrossApproaches":"the same single input is where the reversing version appends a node and the recursive version returns a carry at the top"},"dereferences":{"n":100000,"rows":[{"input":"a typical number","scanForLastNonNine":100001,"reverseTwice":200001},{"input":"all nines","scanForLastNonNine":100000,"reverseTwice":300000}],"why":"the two reversals cost 2n before any arithmetic, and the carry loop adds its own distance -- which is why all-nines costs 300,000 rather than 200,000"},"bench":{"unit":"microseconds, median of fresh-list single calls, n = 200,000","cpp":{"scanForLastNonNine":289.6,"reverseTwice":571.5,"ratio":"about 2x"},"python":{"scanForLastNonNine":5204,"reverseTwice":7680,"ratio":"about 1.5x"}},"recursionCeiling":{"cost":"one stack frame per digit -- the carry is computed after the recursive call returns, so no compiler flattens it","rows":[{"build":"-O0","digits":174252},{"build":"-O2","digits":261123},{"build":"CPython, default limit 1000","digits":997}],"crossCheck":"Reverse a LL measured 174,250 and 261,250 for a DIFFERENT recursive function on this machine -- the frames are identically sized, 48 bytes unoptimised and 32 optimised","lesson":"the ceiling belongs to the frame size and the stack, not to the algorithm"},"whyReversingStillMatters":"it is the shape that generalises -- Add two numbers in Linked List needs both operands walked from the least significant end, and there the reversal is not optional","recommendation":"scan once for the last digit below 9, then increment and zero the tail","lesson":"separate the cost of the arithmetic from the cost of reaching it -- here the first is 1.11 digits and the second is the whole list"}
```

<!-- @highlights -->
- The number is drawn as digit nodes with place values written above — thousands, hundreds, tens, units.
- The direction mismatch only becomes obvious once those place values are visible.
- The opening shows what addition wants: an arrow entering from the **right**, at the units digit, pointing left.
- Then what the list permits: an arrow entering from the **left**, at the head, pointing right.
- Those two opposing arrows frame everything that follows.
- The scan runs as a marker sweeping left to right, with a second marker snapping onto each non-nine digit.
- That second marker visibly stays put while the two nines slide past, finishing parked on the 2.
- It is labelled the carry stops here.
- The fix-up increments the 2 to a 3 and sweeps right zeroing the trailing nines.
- A small counter shows the fix-up length — 2 here — captioned that it averages 1.11 across random numbers.
- The second panel runs `9 9 9`, where the snapping marker never fires.
- The frame holds on it never firing, since that absence is the entire detection mechanism.
- A new node then materialises in front of the head holding 1, and the row is visibly one node longer.
- The old head pointer is left dangling on the `0`, making the point that the return value must be used.
- The close draws the three approaches as travel diagrams over the same row: one traversal with a short backtrack, three traversals, and one traversal with a frame stacked per digit.
- The dereference counts sit under each — 100,001, 200,001, and one frame per digit — so the comparison is a picture of distance travelled.

<!-- @edgeCases -->
- A single digit below 9 — incremented in place, no allocation, no fix-up walk.
- A single 9 — becomes `1 0`, the shortest input that grows.
- All nines at any length — the only shape whose answer is longer, and the only one that allocates.
- A number ending in one or more 9s — the fix-up walk runs for exactly that many nodes.
- A number with 9s in the middle but not at the end — the carry never reaches them and they are untouched.
- A leading zero in the input — preserved, since nothing about this algorithm normalises the representation.
- The returned head — differs from the input head only for the all-nines case, which is exactly when ignoring the return value loses the answer.
- A very long number — the scan is O(n) but the fix-up stays O(1) expected, averaging 1.11 nodes.
- The empty list — has no digits to increment; the scan finds no non-nine and would prepend a 1, giving `1`, which may or may not be the intended reading of "empty".
- The recursive version past its stack ceiling — 174,252 digits at `-O0`, 261,123 at `-O2`, 997 in CPython.
- The reversing version interrupted between its two reversals — the list is left in reverse order, which is a different number entirely.

<!-- @pitfalls -->
- Ignoring the return value. For the all-nines input the head changes, so the caller keeps a pointer to a list of zeros.
- Forgetting to zero the digits after the incremented one. `1299 + 1` becomes `1399` instead of `1300`.
- Tracking the *first* non-nine rather than the last. The carry stops at the last one; the first is usually the leading digit.
- Adding a separate flag for the all-nines case. The null pointer already carries that information — one check does both jobs.
- Forgetting the second reversal in the reversing version. The digits come back in the wrong order, which reads as a completely different number.
- Appending the carry node to the wrong end in the reversing version. It goes on the end of the **reversed** list, which becomes the front after reversing back.
- Walking the whole list in the carry loop. Stopping when the carry is zero is what keeps the arithmetic O(1) expected.
- Assuming the carry is usually long. It averages 1.11 digits and the deepest seen in 800,000 random trials was 7.
- Reaching for recursion on input you did not build. It costs a frame per digit and caps at 997 digits in CPython.
- Assuming the reversing version is equally cheap. It reads twice the pointers and runs about 2x slower.
- Testing only numbers without trailing nines. Those never exercise the fix-up walk or the allocation.

<!-- @doubt -->
### Why not just reverse the list, add, and reverse back?

<!-- @answer -->
It is correct, and it does the trip three times where one is enough. The two reversals cost `2n` dereferences before any arithmetic happens — 200,001 against the scanning version's 100,001 at a hundred thousand digits — and the all-nines case costs 300,000, because the carry then walks the whole list on top of both reversals. Timed at two hundred thousand digits it came out at 571.5us against 289.6us, about **2x**, and roughly 1.5x in Python. That said, it is worth knowing rather than dismissing: it is the shape that **generalises**. **Add two numbers in Linked List** has to walk both operands from the least significant end and align them, and there reversing is not an optimisation you can skip — the scanning trick works here only because one of the operands is the constant 1.

<!-- @doubt -->
### How do I handle 999 + 1 without a special case everywhere?

<!-- @answer -->
Let the detection and the response be the same test. Scanning for the last digit below 9 leaves the remembered pointer **null** precisely when every digit is a 9 — and that is precisely when the answer needs a digit the list does not have. So one null check tells you both that this is the special input and that you must allocate. There is no separate flag, no length comparison, and no counting of nines. It is worth noticing that all three approaches collapse to this same single case from different directions: the reversing version is the one where the carry survives to the end of the reversed list, and the recursive version is the one where a carry comes back to the top-level caller. Three algorithms, one input that behaves differently, and in each of them it is detected by the natural end-condition rather than by a test bolted on.

<!-- @doubt -->
### Isn't the carry expensive on a long number?

<!-- @answer -->
Almost never, and the measurement is clean. Adding one propagates only while it meets a 9, so it stops at the first digit below 9 counting from the right. For uniform digits the probability of running through `k` nines is `(1/10)^k`, which gives an expected depth of `10/9 = 1.1111`. Measured over 200,000 random numbers at each of 5, 10, 50 and 1,000 digits, the means were **1.1102, 1.1117, 1.1105 and 1.1106** — and the deepest carry in all 800,000 trials was 7 digits. So the arithmetic is O(1) expected no matter how long the number is. The O(n) in this problem is not the addition at all; it is that the digit you need sits near the end of a list you can only enter at the front. Confusing those two is what makes reversing look free.

<!-- @doubt -->
### Is the recursive version worth using?

<!-- @answer -->
For understanding, yes; for running, rarely. It states the problem exactly — recurse to the end, return a carry of 1, let it propagate back through the returns — and the "add one" is literally the base case rather than a separate step. But it holds one frame per digit, because the carry is computed **after** the recursive call returns, so no compiler can flatten it into a loop. Measured on this machine it handles **174,252** digits at `-O0` and **261,123** at `-O2`. Those numbers should look familiar: **Reverse a LL** measured 174,250 and 261,250 for a completely different recursive function, because both compile to the same 48-byte and 32-byte frames. The ceiling belongs to the frame and the stack, not the algorithm. In CPython the limit is much tighter — **997** digits under the default recursion limit of 1,000.

<!-- @doubt -->
### Do I have to use the return value?

<!-- @answer -->
Yes, and exactly one input makes it matter. For every number containing at least one digit below 9, the head node is unchanged and the function returns the pointer you gave it — so ignoring the return value appears to work. For the all-nines input the answer has one more digit than the input, that digit is a **new node** in front of the old head, and the returned pointer is the only reference to it. A caller that discards it keeps a pointer to what is now the list of zeros: `999 + 1` reads back as `000`. This is the same hazard as **Deletion of the head** and **Remove Nth node from the back**, where the head can also change, and the same defence applies — always write `head = addOne(head);` rather than calling it for effect, so the one input that behaves differently cannot catch you.

<!-- @doubt -->
### Should I track the first non-nine or the last one?

<!-- @answer -->
The last, and getting this backwards is a quiet way to be wrong. The carry travels from the right and dies at the first digit below 9 that it meets — which, reading the list left to right, is the **last** such digit in the list. On `1 2 9 9` the last non-nine is the 2, and incrementing it gives the right answer `1 3 0 0`. Tracking the first non-nine would give you the leading 1 and produce `2 0 0 0`, which is a different number entirely. The implementation detail that makes this easy is that the scan should **overwrite** its remembered pointer on every non-nine rather than stopping at the first one — no break, no condition, just an assignment that happens repeatedly and leaves the pointer where you want it. The digits after it are exactly the ones that must become zero, which is why the same pointer serves both halves of the fix-up.
