---
id: add-two-numbers-in-linked-list
topic: Linked Lists
title: Add two numbers in Linked List
difficulty: Medium
status: ready
prerequisites:
  - add-one-to-a-number-represented-by-ll
  - reverse-a-linkedlist-iterative
  - reverse-a-ll
  - introduction-to-singly-linkedlist
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - add-one-to-a-number-represented-by-ll
  - reverse-a-linkedlist-iterative
  - reverse-a-ll
  - find-the-intersection-point-of-y-ll
  - sort-ll
---

<!-- @summary -->
The digits run **least significant first** here — the opposite of the previous subtopic, and the single most important thing to check before writing a line. Then the whole problem is one loop whose condition has three parts, and dropping either of the last two is measurably catastrophic: stopping when the shorter list ends is wrong on **67.6%** of inputs, and forgetting the final carry is wrong on **50.4%** — verified to be wrong **exactly** when the sum needs an extra digit, on 1,000,000 pairs with zero exceptions.

<!-- @theory -->
## Check the direction first

This problem stores digits **least significant first**. The head is the ones
digit, and the list reads backwards compared to how you would write the number:

```
2 -> 4 -> 3     is 342
5 -> 6 -> 4     is 465
                      342 + 465 = 807
7 -> 0 -> 8     is 807
```

That is the opposite of **Add one to a number represented by LL**, which put the
most significant digit at the head. Both conventions are standard for their
respective problems and the two subtopics sit next to each other, so the first
thing to establish on any question of this shape is which way the digits run — an
implementation for one convention silently produces a completely different number
under the other.

The reason this convention is used here is that it makes the problem easy:
addition carries from the least significant end, which is now the head, so a
single forward walk is all that is required. The previous subtopic had to work
around exactly this and could only do so because one of its operands was the
constant 1. With two arbitrary operands there is no such shortcut, which is what
the last two approaches below are for.

## One loop, three conditions

```cpp
Node* addTwoNumbers(Node* a, Node* b) {
    Node dummy(0);
    Node* tail = &dummy;
    int carry = 0;

    while (a != nullptr || b != nullptr || carry != 0) {
        int sum = carry;
        if (a != nullptr) { sum += a->data; a = a->next; }
        if (b != nullptr) { sum += b->data; b = b->next; }
        carry = sum / 10;
        tail->next = new Node(sum % 10);
        tail = tail->next;
    }
    return dummy.next;
}
```

Checked against ordinary integer addition on **every pair of numbers from 0 to
999** — a million pairs — with zero disagreements.

The loop condition carries all the difficulty. Each of its three parts handles a
case, and the measurements show what happens without them.

## Both of the tempting simplifications are wrong most of the time

**Stopping when either list ends.** Writing `while (a && b)` looks reasonable —
you are adding pairs of digits, after all. It discards whatever remains of the
longer number:

> Wrong on **676,305 of 1,000,000** pairs — **67.6%**.

**Leaving out the carry.** Writing `while (a || b)` handles unequal lengths but
throws away a carry that survives past the last digit, which is exactly the case
where the answer is longer than both inputs:

> Wrong on **504,495 of 1,000,000** pairs — **50.4%**.

That second figure is not approximate. The bug produces a wrong answer **exactly
when the sum has more digits than the longer input** — checked pair by pair
across all million, with the set of wrong answers and the set of longer results
agreeing in every single case and disagreeing in none.

## Why 50% — and how that differs from adding one

Adding one, in the previous subtopic, carried a mean of **1.11 digits total**,
because the carry died at the first digit below 9. Adding two arbitrary numbers
is a different regime entirely — measured over 200,000 random pairs at each size:

| Digits | Positions that carry | Result is one digit longer | Most extra digits |
|---|---|---|---|
| 1 | 44.85% | 44.85% | 1 |
| 5 | 48.88% | 50.04% | 1 |
| 20 | 49.74% | 50.12% | 1 |
| 1,000 | 49.99% | 49.95% | 1 |

At a single digit the rate is 45%, which is just the count of digit pairs summing
to 10 or more — 45 of the 100. Longer numbers converge on **exactly one half**,
and the reason is that a carry coming in makes the next carry more likely: with
no carry in, 45 of 100 pairs carry out; with one, 55 do. The steady state solves
`p = 0.45(1 − p) + 0.55p`, giving `p = ½`.

The last column is the other fact worth having: the result is **never** more than
one digit longer than the longer input, at any size. That is why one final node
after the loop is always enough.

## When the digits run the other way

If the input is most significant first — the convention the previous subtopic
used — the single forward walk no longer works, and there are two honest ways
round it.

**Reverse both, add, reverse the result.** O(1) extra space, but it mutates its
inputs, so it has to put them back. **Two stacks.** Pushing both lists onto
stacks and popping gives the digits least-significant-first without touching the
originals, at O(n) memory.

Both were checked on 250,000 pairs with no disagreements, and the reversing
version was verified to restore both inputs exactly. Timed on two 200,000-digit
numbers:

| | C++ | Python |
|---|---|---|
| Least-significant-first, one loop | **2,364.67us** | **54,231us** |
| Most-significant-first, reversing | 3,270us | 72,705us |
| Most-significant-first, two stacks | 3,024us | 67,207us |

Working in the harder direction costs about **1.3x** in either language. The
stacks are marginally faster than reversing and never touch the caller's data;
the reversing version is O(1) space but borrows the inputs mid-call, which
matters if anything else can see them.

<!-- @intuition -->
Almost everything here follows from one decision made before the problem starts: which end of the list holds the ones digit. Put it at the head and addition becomes a single forward walk, because the direction the carry travels and the direction the list can be read are finally the same. Put it at the tail and you are back to the previous subtopic's difficulty, needing to reach the far end first — which is why the last two approaches exist and why they cost about a third more. So the useful instinct on any digits-in-a-list question is to establish the convention before writing anything, since the same code produces a confidently wrong number under the other one. After that, the entire problem is a loop condition. Three things can still be true when you might think you are finished — the first list may have digits left, the second may, and there may be a carry — and each of the two obvious simplifications drops one of those and is wrong on more than half of all inputs. It is a good reminder that "handles the common case" and "correct" can be very far apart, and that the distance is measurable.

<!-- @approach -->
### Optimal - One Loop with a Carry

<!-- @idea -->
Walk both lists together from the ones digit, building the result as you go, and keep looping while either list has digits left or a carry is outstanding.

<!-- @steps -->
1. Create a dummy node to anchor the result, with a tail pointer on it, and a carry of 0.
2. Loop while either list still has a node **or** the carry is non-zero.
3. Start the running sum at the carry, then add each list's current digit if that list still has one, advancing it.
4. The new carry is the sum divided by 10; the new digit is the sum modulo 10.
5. Append a node holding that digit and advance the tail.
6. Return the dummy's `next`.

<!-- @complexity -->
- time: O(max(m, n)) — one pass over the longer input, plus at most one extra step
- space: **O(max(m, n))** for the result, and O(1) beyond it
- note: The one to write, and its whole content is the three-part loop condition. Dropping the second part is wrong on **67.6%** of inputs and dropping the third on **50.4%**. The dummy node removes the "is this the first digit?" special case; the carry never exceeds 1, and the result is never more than one digit longer than the longer input, so the loop can add at most one node after both lists end.

<!-- @code cpp -->
```cpp
Node* addTwoNumbers(Node* a, Node* b) {
    Node dummy(0);
    Node* tail = &dummy;
    int carry = 0;

    while (a != nullptr || b != nullptr || carry != 0) {
        int sum = carry;
        if (a != nullptr) { sum += a->data; a = a->next; }
        if (b != nullptr) { sum += b->data; b = b->next; }
        carry = sum / 10;
        tail->next = new Node(sum % 10);
        tail = tail->next;
    }
    return dummy.next;
}
```

<!-- @annotations -->
- 6: All three parts are load-bearing. `a && b` instead is wrong on 67.6% of inputs; dropping `carry != 0` is wrong on 50.4%.
- 8: The guarded add is what lets lists of different lengths share one loop — a finished list simply contributes nothing.
- 10: `sum` is at most `9 + 9 + 1 = 19`, so the carry is always 0 or 1 and this division never yields more.
- 14: `dummy.next` rather than a saved head, which removes the "first node" special case entirely.

<!-- @code java -->
```java
static Node addTwoNumbers(Node a, Node b) {
    Node dummy = new Node(0);
    Node tail = dummy;
    int carry = 0;

    while (a != null || b != null || carry != 0) {
        int sum = carry;
        if (a != null) { sum += a.data; a = a.next; }
        if (b != null) { sum += b.data; b = b.next; }
        carry = sum / 10;
        tail.next = new Node(sum % 10);
        tail = tail.next;
    }
    return dummy.next;
}
```

<!-- @annotations -->
- 6: `carry != 0` written out, since Java will not accept an `int` where a boolean is required — which is a small mercy, as it makes the third condition impossible to omit by accident.

<!-- @code python -->
```python
def add_two_numbers(a, b):
    dummy = Node(0)
    tail = dummy
    carry = 0

    while a is not None or b is not None or carry:
        total = carry
        if a is not None:
            total += a.data
            a = a.next
        if b is not None:
            total += b.data
            b = b.next
        carry, digit = divmod(total, 10)
        tail.next = Node(digit)
        tail = tail.next
    return dummy.next


# `divmod` gives the carry and the digit together, which keeps the
# two halves of the same fact on one line.
```

<!-- @annotations -->
- 6: A bare `carry` as the third condition works because 0 is falsy — the only values it ever holds are 0 and 1.

<!-- @approach -->
### Most-Significant-First by Reversing

<!-- @idea -->
If the digits run the other way, turn both lists around, add normally, and turn the result around too.

<!-- @steps -->
1. Reverse both input lists so their ones digits come first.
2. Add them with the ordinary single-loop method.
3. Reverse both inputs back, so the caller's lists are as they were.
4. Reverse the result, so its most significant digit comes first.
5. Return the reversed result.

<!-- @complexity -->
- time: O(max(m, n)) — four reversals plus the addition, all linear
- space: **O(1)** beyond the result — the reversals are in place
- note: The direct way to reuse the easy algorithm when the input runs most-significant-first. Step 3 is not optional and is the thing people leave out: without it the caller's two numbers come back reversed, which is the same silent damage **Check if LL is palindrome** measured. It measured about **1.3x** the cost of the natural direction — 3,270us against 2,364.67us on two 200,000-digit numbers.

<!-- @code cpp -->
```cpp
Node* addTwoNumbersMsb(Node* a, Node* b) {
    Node* ra = reverseList(a);
    Node* rb = reverseList(b);

    Node* sum = addTwoNumbers(ra, rb);

    reverseList(ra);
    reverseList(rb);
    return reverseList(sum);
}
```

<!-- @annotations -->
- 7: Restoring the caller's lists. Leaving these out returns the right answer and hands back both inputs reversed.
- 5: Reusing the least-significant-first routine unchanged, which is the entire point of the reversal.
- 9: The result is built least-significant-first, so it needs reversing too before it matches the input convention.

<!-- @code java -->
```java
static Node addTwoNumbersMsb(Node a, Node b) {
    Node ra = reverseList(a);
    Node rb = reverseList(b);

    Node sum = addTwoNumbers(ra, rb);

    reverseList(ra);
    reverseList(rb);
    return reverseList(sum);
}
```

<!-- @annotations -->
- 2: `ra` is the reversed list's head, which is the **old tail** of `a` — the variable `a` now points at what has become the last node.

<!-- @code python -->
```python
def add_two_numbers_msb(a, b):
    ra = reverse_list(a)
    rb = reverse_list(b)

    total = add_two_numbers(ra, rb)

    reverse_list(ra)
    reverse_list(rb)
    return reverse_list(total)


# Four reversals in all, and two of them exist purely so the caller's
# lists survive the call. Verified to restore both inputs exactly.
```

<!-- @annotations -->
- 7: These two lines produce no part of the answer. They exist so that a predicate-shaped function does not quietly mutate its arguments.

<!-- @approach -->
### Most-Significant-First with Two Stacks

<!-- @idea -->
Push both lists onto stacks; popping then yields the digits least significant first, without disturbing the originals.

<!-- @steps -->
1. Walk each list, pushing every digit onto its own stack.
2. Loop while either stack is non-empty or a carry is outstanding.
3. Pop a digit from each non-empty stack and add them to the carry.
4. Split the sum into the new carry and the new digit.
5. Create a node for that digit and **prepend** it to the result, which builds the answer most significant first.
6. Return the result head.

<!-- @complexity -->
- time: O(m + n) — one pass to fill the stacks, one to drain them
- space: **O(m + n)** for the stacks
- note: The version to reach for when the inputs must not be touched — it never modifies them, where the reversing approach borrows them for the duration of the call. It also builds its result in the right order for free by prepending, so no final reversal is needed. Measured slightly faster than reversing, 3,024us against 3,270us, at the cost of holding every digit in memory twice over.

<!-- @code cpp -->
```cpp
#include <stack>
using namespace std;

Node* addTwoNumbersMsbStacks(Node* a, Node* b) {
    stack<int> sa, sb;
    for (Node* p = a; p != nullptr; p = p->next) sa.push(p->data);
    for (Node* p = b; p != nullptr; p = p->next) sb.push(p->data);

    Node* head = nullptr;
    int carry = 0;
    while (!sa.empty() || !sb.empty() || carry != 0) {
        int sum = carry;
        if (!sa.empty()) { sum += sa.top(); sa.pop(); }
        if (!sb.empty()) { sum += sb.top(); sb.pop(); }
        carry = sum / 10;
        Node* n = new Node(sum % 10);
        n->next = head;
        head = n;
    }
    return head;
}
```

<!-- @annotations -->
- 17: Prepending rather than appending. Each new digit is more significant than the last, so putting it at the front builds the answer in input order with no final reversal.
- 11: The same three-part condition as the natural-direction version — the stacks have simply replaced the list pointers.
- 6: Reading the inputs without writing to them, which is the whole advantage over reversing.

<!-- @code java -->
```java
static Node addTwoNumbersMsbStacks(Node a, Node b) {
    Deque<Integer> sa = new ArrayDeque<>(), sb = new ArrayDeque<>();
    for (Node p = a; p != null; p = p.next) sa.push(p.data);
    for (Node p = b; p != null; p = p.next) sb.push(p.data);

    Node head = null;
    int carry = 0;
    while (!sa.isEmpty() || !sb.isEmpty() || carry != 0) {
        int sum = carry;
        if (!sa.isEmpty()) sum += sa.pop();
        if (!sb.isEmpty()) sum += sb.pop();
        carry = sum / 10;
        Node n = new Node(sum % 10);
        n.next = head;
        head = n;
    }
    return head;
}
```

<!-- @annotations -->
- 2: `ArrayDeque` rather than the legacy `Stack`, which is synchronised and slower for no benefit here.

<!-- @code python -->
```python
def add_two_numbers_msb_stacks(a, b):
    sa, sb = [], []
    p = a
    while p is not None:
        sa.append(p.data)
        p = p.next
    p = b
    while p is not None:
        sb.append(p.data)
        p = p.next

    head = None
    carry = 0
    while sa or sb or carry:
        total = carry
        if sa:
            total += sa.pop()
        if sb:
            total += sb.pop()
        carry, digit = divmod(total, 10)
        node = Node(digit)
        node.next = head
        head = node
    return head
```

<!-- @annotations -->
- 22: Prepending, so the answer comes out most significant first without a closing reversal.

<!-- @example -->

<!-- @input -->
`2 -> 4 -> 3` and `5 -> 6 -> 4`, digits least significant first

<!-- @output -->
`7 -> 0 -> 8`

<!-- @why -->
The straightforward trace, showing why the head being the ones digit makes this a single forward walk.

<!-- @walkthrough -->
1. The lists read 342 and 465, since the head holds the ones digit.
2. First step: `2 + 5` is 7, no carry, so the result begins `7`.
3. Second step: `4 + 6` is 10 — the digit is 0 and the carry becomes 1, so the result is `7 -> 0`.
4. Third step: `3 + 4 + 1` is 8, no carry, giving `7 -> 0 -> 8`.
5. Both lists are exhausted and the carry is zero, so all three parts of the condition are false and the loop ends.
6. Reading the result as least-significant-first gives 807, which is 342 + 465.
7. Nothing had to be reversed or counted, because the direction the carry travels and the direction the list can be walked are the same.

<!-- @example -->

<!-- @input -->
`while (a && b)` instead of the three-part condition

<!-- @output -->
Wrong on 676,305 of 1,000,000 pairs — 67.6%

<!-- @why -->
The first tempting simplification, and the one that fails most often.

<!-- @walkthrough -->
1. Stopping when either list runs out looks natural, since the loop is adding pairs of digits.
2. It discards every remaining digit of the longer number.
3. Adding a three-digit number to a one-digit one therefore returns a one-digit answer.
4. Measured across every pair from 0 to 999: wrong on **676,305** of the million.
5. It is right only when the two numbers have the same digit count **and** no carry survives the last position.
6. The fix is not an extra loop afterwards but the `||` in the condition, which lets a finished list contribute nothing while the other keeps going.
7. That is what the two `if` guards inside the body are for — they make "this list is done" harmless rather than fatal.

<!-- @example -->

<!-- @input -->
The correct `while (a || b)` but with `|| carry` left off

<!-- @output -->
Wrong on 504,495 of 1,000,000 pairs — and wrong on exactly those whose sum is longer

<!-- @why -->
A bug whose failure set can be characterised precisely, which makes it a good test of whether a suite means anything.

<!-- @walkthrough -->
1. This version handles unequal lengths correctly, so it survives the first bug's test cases.
2. It fails only when a carry is still outstanding after both lists are exhausted.
3. That is exactly the situation where the answer has more digits than either input.
4. Measured across all million pairs: **504,495** wrong answers, and **504,495** results longer than the longer input.
5. Comparing those two sets pair by pair found **zero** cases where one happened without the other.
6. So the bug is not merely correlated with the extra-digit case — it **is** the extra-digit case.
7. Any test suite drawn from sums that do not grow will report this bug as absent, and roughly half of all random pairs do not grow.

<!-- @example -->

<!-- @input -->
200,000 random digit pairs at several lengths, counting how often a position carries

<!-- @output -->
45% at one digit, converging to exactly 50%

<!-- @why -->
Explains why the final-carry case is so common here, and how it differs from the previous subtopic.

<!-- @walkthrough -->
1. With no carry coming in, a position carries when two digits sum to 10 or more — 45 of the 100 possible pairs.
2. With a carry coming in it carries when they sum to 9 or more, which is 55 of the 100.
3. So carries make further carries more likely, and the rate settles where `p = 0.45(1 − p) + 0.55p`, which is `p = ½`.
4. Measured: 44.85% at one digit, 48.88% at five, 49.74% at twenty, and **49.99%** at a thousand.
5. That is a completely different regime from **Add one to a number**, where the carry died at the first digit below 9 and travelled a mean of 1.11 digits in total.
6. There the carry was rare and short; here roughly every other position carries.
7. The result is nonetheless **never** more than one digit longer than the longer input — measured at every size — which is why one node after the loop always suffices.

<!-- @visualization linked-list -->

<!-- @description -->
Lead with the convention, because getting it wrong invalidates everything after. Draw the list `2 -> 4 -> 3` with place values written **under** each node — ones, tens, hundreds — increasing to the right, and the number 342 printed beside it. Put the same digits in the opposite convention next to it, `3 -> 4 -> 2` reading 342 the other way, and mark which one this problem uses. Those two rows side by side are the frame. Then the addition, drawn as a column sum rotated ninety degrees so it looks like the arithmetic it is: both lists running left to right, a carry box sitting between the rows, and the result assembling underneath one node at a time. At each step light up the three inputs to the sum — this list's digit, that list's digit, the carry — and show the split into a new carry and a new digit. Use `2 4 3` plus `5 6 4` so the middle position carries and the reader sees the box flip to 1 and back. The second panel is the loop condition, drawn as three lamps labelled `a`, `b` and `carry` that stay lit while their part is still true, with the loop continuing while **any** lamp is lit. Run it on lists of different lengths so the reader watches the first lamp go dark while the other two keep the loop alive, then on a sum that grows so the last iteration runs with only the carry lamp lit — that final frame, two dark lamps and one lit, is the case the 50.4% bug deletes. Put the two failure rates beneath as bars. Close with the direction problem: the same addition attempted on most-significant-first lists, where the carry needs to travel right-to-left against the only direction the arrows allow — then the two fixes shown as short diagrams, one flipping both lists over and back, the other pouring them into stacks and pouring them out.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"convention":{"thisProblem":"LEAST significant digit first -- the head is the ones digit","previousSubtopic":"Add one to a number represented by LL uses MOST significant first","warning":"both are standard for their respective problems and the two subtopics are adjacent -- establish the direction before writing anything, since the same code produces a confidently wrong number under the other convention","whyThisOneIsEasier":"addition carries from the least significant end, which is now the head, so the carry travels the same direction the list can be walked"},"example":{"listA":"2 -> 4 -> 3","valueA":342,"listB":"5 -> 6 -> 4","valueB":465,"result":"7 -> 0 -> 8","resultValue":807},"correctness":{"comparedAgainst":"ordinary integer addition","cpp":{"pairs":1000000,"range":"every x, y from 0 to 999","disagreements":0},"python":{"pairs":160000,"disagreements":0},"msbVariants":{"cppPairs":250000,"pythonPairs":40000,"disagreements":0,"alsoVerified":"the reversing version restores both inputs exactly"}},"theLoopCondition":{"correct":"while (a || b || carry)","allThreePartsLoadBearing":true,"bugs":[{"code":"while (a && b)","drops":"every remaining digit of the longer number","wrong":676305,"of":1000000,"rate":"67.6%","correctOnlyWhen":"both numbers have the same digit count AND no carry survives the last position"},{"code":"while (a || b)","drops":"a carry outstanding after both lists are exhausted","wrong":504495,"of":1000000,"rate":"50.4%","exactTrigger":"wrong EXACTLY when the sum has more digits than the longer input","verification":"504,495 wrong answers and 504,495 longer results, compared pair by pair across all million with ZERO cases where one happened without the other","whyItSurvivesTesting":"roughly half of all random pairs do not grow, and those all pass"}]},"carryStatistics":{"trialsPerSize":200000,"rows":[{"digits":1,"positionsCarrying":"44.85%","resultOneDigitLonger":"44.85%","mostExtraDigits":1},{"digits":5,"positionsCarrying":"48.88%","resultOneDigitLonger":"50.04%","mostExtraDigits":1},{"digits":20,"positionsCarrying":"49.74%","resultOneDigitLonger":"50.12%","mostExtraDigits":1},{"digits":1000,"positionsCarrying":"49.99%","resultOneDigitLonger":"49.95%","mostExtraDigits":1}],"whyFortyFiveAtOneDigit":"45 of the 100 digit pairs sum to 10 or more","whyItConvergesToAHalf":"a carry coming in raises the carry-out probability from 45/100 to 55/100, so the steady state solves p = 0.45(1-p) + 0.55p, giving p = 1/2","contrastWithAddOne":"Add one to a number carried a mean of 1.11 digits IN TOTAL, because the carry died at the first digit below 9; here roughly every other position carries","neverMoreThanOneExtraDigit":"measured at every size -- which is why one node after the loop always suffices"},"otherDirection":{"problem":"if the input is most significant first, the single forward walk no longer works","optionA":{"name":"reverse both, add, reverse the result","space":"O(1) beyond the result","catch":"it mutates its inputs, so it must reverse them back -- the same silent damage Check if LL is palindrome measured"},"optionB":{"name":"two stacks","space":"O(m + n)","advantage":"never touches the inputs, and prepending the result digits builds the answer in input order with no final reversal"}},"bench":{"unit":"microseconds, median of fresh-list single calls, two 200,000-digit numbers","cpp":{"lsbOneLoop":2364.67,"msbReversing":3270,"msbStacks":3024},"python":{"lsbOneLoop":54231,"msbReversing":72705,"msbStacks":67207},"verdict":"working in the harder direction costs about 1.3x in either language"},"recommendation":"one loop with the three-part condition, and a dummy node to anchor the result","lesson":"establish which end holds the ones digit before writing anything -- and remember that 'handles the common case' and 'correct' can be more than half the inputs apart"}
```

<!-- @highlights -->
- The convention leads: `2 -> 4 -> 3` drawn with place values **under** each node — ones, tens, hundreds — increasing to the right, and 342 printed beside it.
- The opposite convention sits next to it, `3 -> 4 -> 2` also reading 342, with this problem's choice marked.
- Those two rows side by side are the frame for everything after.
- The addition is drawn as a column sum rotated ninety degrees, so it looks like the arithmetic it is.
- Both lists run left to right with a carry box between the rows and the result assembling underneath.
- Each step lights up the three inputs to the sum — this digit, that digit, the carry — then splits into a new carry and a new digit.
- The example `2 4 3` plus `5 6 4` makes the middle position carry, so the box visibly flips to 1 and back.
- The second panel draws the loop condition as three lamps labelled `a`, `b` and `carry`.
- Each lamp stays lit while its part is still true, and the loop continues while **any** lamp is lit.
- On lists of different lengths the first lamp goes dark while the other two keep the loop alive.
- On a sum that grows, the final iteration runs with only the carry lamp lit.
- That frame — two dark lamps and one lit — is exactly the case the 50.4% bug deletes.
- The two failure rates sit beneath as bars.
- The close shows the same addition on most-significant-first lists, with the carry needing to travel against the arrows.
- The two fixes follow as short diagrams: one flipping both lists over and back, the other pouring them into stacks and out again.

<!-- @edgeCases -->
- Two empty lists — the loop never runs and the result is null, which is the only input producing no digits at all.
- One list empty — the other is copied digit for digit, since the empty side contributes nothing on every step.
- Lists of very different lengths — handled by the `||` in the condition, not by a second loop afterwards.
- A sum that grows a digit — the loop runs one extra time with both lists exhausted and only the carry left.
- A carry out of the very last position — the case the third condition exists for, and roughly half of all random pairs.
- Both numbers zero — gives a single `0` node, not an empty list.
- A leading zero in an input — preserved as a digit; nothing here normalises the representation.
- A carry of exactly 1 — the only non-zero value it ever takes, since the sum is at most `9 + 9 + 1 = 19`.
- The result needing two extra digits — impossible, and measured to be so at every size.
- Most-significant-first input passed to the least-significant-first routine — returns a well-formed list holding a completely different number.
- The reversing variant interrupted before its restoring reversals — leaves both of the caller's lists backwards.

<!-- @pitfalls -->
- Assuming the digit order. This problem is least significant first; the previous subtopic is the opposite, and the same code silently answers a different question under the wrong one.
- Writing `while (a && b)`. Discards the longer number's remaining digits — wrong on 67.6% of a million pairs.
- Leaving `|| carry` off the condition. Wrong on 50.4%, and wrong on exactly the pairs whose sum has an extra digit.
- Testing only with equal-length inputs whose sums do not grow. Both bugs above pass every such test.
- Adding a second loop after the main one to drain the longer list. It works but duplicates the body; the `||` is the same thing said once.
- Forgetting to restore the inputs in the reversing variant. The answer is right and the caller's two numbers come back reversed.
- Appending rather than prepending in the stacks variant. It builds the result least-significant-first, which is the wrong order for that convention.
- Returning a saved first node instead of `dummy.next`. The dummy exists precisely to remove that special case.
- Expecting the carry to exceed 1. The sum is at most 19, so it never does — but the code should still divide rather than test for 10.
- Allocating two nodes after the loop for a large carry. One is always enough; the result never grows by more than a digit.
- Reusing the least-significant-first routine on most-significant-first data without reversing. It produces a valid list holding the wrong number.

<!-- @doubt -->
### Which end of the list is the ones digit?

<!-- @answer -->
The head — this problem stores digits **least significant first**, so `2 -> 4 -> 3` is 342. That is worth checking every time, because the previous subtopic, **Add one to a number represented by LL**, uses the opposite convention with the most significant digit at the head, and the two sit next to each other in this topic. Both are standard for their own problems, and neither is more correct. The consequence of getting it wrong is the bad kind: the code runs, returns a well-formed list, and the number it represents is unrelated to the answer. There is a reason this problem chooses this direction — addition carries from the least significant end, so putting that end at the head means the carry travels the same way the list can be walked, and one forward pass is enough. The previous subtopic could not do that and only escaped because one of its operands was the constant 1.

<!-- @doubt -->
### Why does the loop condition have three parts?

<!-- @answer -->
Because three separate things can each keep the work going, and dropping either of the last two is wrong more often than it is right. The measurements are stark. Writing `while (a && b)` stops as soon as the shorter number runs out, discarding the rest of the longer one — **wrong on 676,305 of 1,000,000 pairs, 67.6%**. Writing `while (a || b)` fixes that but throws away a carry still outstanding when both lists end — **wrong on 504,495, 50.4%**. Neither is a rare edge case; both are majority-or-near-majority failures. The three parts correspond exactly to the three reasons there might be more to do: the first number has digits left, the second does, or a carry is pending. The two `if` guards inside the body are what make the first two harmless once one list finishes, so a completed list contributes zero rather than ending the loop.

<!-- @doubt -->
### How bad is forgetting the final carry, really?

<!-- @answer -->
Wrong on slightly over half of all inputs, and wrong on a set you can describe exactly. Across every pair from 0 to 999 it produced **504,495** wrong answers — and there were **504,495** pairs whose sum has more digits than the longer input. Comparing those two sets pair by pair found **zero** cases where one occurred without the other. So it is not that the bug correlates with the growing-sum case; it **is** that case. That precision is useful because it tells you exactly what a test needs to contain. Roughly half of random pairs produce a sum with no extra digit, and every one of those passes with the bug present — so a suite of a dozen hand-picked additions has a real chance of missing it entirely unless someone deliberately includes something like `999 + 1` or `5 + 5`.

<!-- @doubt -->
### Why does a carry happen about half the time?

<!-- @answer -->
Because carries feed themselves. At a single position with no carry coming in, the sum reaches 10 only for 45 of the 100 possible digit pairs — 45%. But if a carry does come in, the threshold drops and 55 of the 100 pairs carry out. So the rate settles wherever `p = 0.45(1 − p) + 0.55p`, which solves to exactly **one half**. The measurements track that: 44.85% at a single digit — pure 45%, since nothing carries in — rising to 48.88% at five digits, 49.74% at twenty and **49.99%** at a thousand. It is worth contrasting with the previous subtopic, where adding **one** carried a mean of 1.11 digits in total because the carry died at the first digit below 9. Adding one is a rare, short carry; adding two arbitrary numbers carries at roughly every other position. Same operation, completely different statistics.

<!-- @doubt -->
### Can the result ever be two digits longer?

<!-- @answer -->
No, and that is why one node after the loop is always enough. The largest sum at any position is `9 + 9 + 1 = 19`, so the carry out is never more than 1, and a carry of 1 emerging past the most significant position adds exactly one digit. Measured across 200,000 random pairs at 1, 5, 20 and 1,000 digits, the most extra digits ever produced was **1** at every size. This also settles a related question worth asking: the carry variable never needs to hold anything but 0 or 1, so `sum / 10` and `sum % 10` are safe without any clamping. It is still better style to divide than to test `if (sum >= 10)`, because the division states the general rule and keeps working if the base ever changes — but the guarantee that the carry stays binary is real and worth knowing.

<!-- @doubt -->
### What if my input has the most significant digit first?

<!-- @answer -->
Then the single forward walk does not work, and there are two honest ways round it. **Reverse both lists**, add with the ordinary routine, reverse the result, and — this is the part that gets forgotten — reverse the two inputs back, or the caller's numbers come back backwards. That is O(1) extra space and cost about **1.3x** the natural direction, 3,270us against 2,364.67us on two 200,000-digit numbers. **Or use two stacks**: push both lists, pop to get the digits least-significant-first, and **prepend** each result digit so the answer comes out in input order with no closing reversal. That never touches the inputs at all, which matters if anything else can see them, and measured marginally faster at 3,024us — paid for with O(m + n) memory. Both were verified on 250,000 pairs, and the reversing version specifically checked to restore both inputs exactly.
