---
id: check-if-ll-is-palindrome-or-not
topic: Linked Lists
title: Check if LL is palindrome or not
difficulty: Medium
status: ready
prerequisites:
  - middle-of-a-linkedlist-tortoisehare-method
  - reverse-a-linkedlist-iterative
  - find-the-length-of-the-linked-list
  - introduction-to-singly-linkedlist
  - while-loop
  - time-and-space-complexity-basics
relatedIds:
  - reverse-a-linkedlist-iterative
  - middle-of-a-linkedlist-tortoisehare-method
  - segregate-odd-and-even-nodes-in-linked-list
  - reverse-ll-in-group-of-given-size-k
  - find-pairs-with-given-sum-in-doubly-linked-list
---

<!-- @summary -->
The first problem in this topic where the celebrated O(1)-space answer is the **slowest** of the three — measured at **407us against the array's 199us**, an exact inversion of the loop subtopics where the O(n) structure lost by 21x to 68x. The difference is what O(n) memory is made of. And the reverse-based version has a defect most write-ups omit: without a restoring pass it silently **truncates the caller's list** to `floor(n/2) + 1` nodes, leaving something still well-formed enough that nothing crashes.

<!-- @theory -->
## The question

Does the list read the same forwards and backwards?

```
1 -> 2 -> 3 -> 2 -> 1     palindrome
1 -> 2 -> 2 -> 1          palindrome
1 -> 2 -> 3               not
```

The difficulty is that a singly linked list cannot be read backwards. Every
approach below is a different way of buying that ability.

## Reverse the second half

Find the middle with the tortoise and hare, reverse everything from there, then
walk the two halves in step.

```cpp
bool isPalindrome(Node* head) {
    if (head == nullptr || head->next == nullptr) return true;
    Node* mid = middle(head);
    Node* rev = reverseList(mid);

    Node* a = head;
    Node* b = rev;
    bool ok = true;
    while (b != nullptr) {
        if (a->data != b->data) { ok = false; break; }
        a = a->next;
        b = b->next;
    }
    reverseList(rev);              // put the list back
    return ok;
}
```

Verified against a reference implementation on **every binary list up to length
14** — 32,767 of them — with zero disagreements, alongside the two approaches
below.

## The parity question answers itself

The tortoise-hare `middle` returns the node at index `n / 2`, which is the
**second** of the two middles when the length is even:

| n | List | `middle` returns | Index |
|---|---|---|---|
| 4 | 0 1 2 3 | 2 | 2 |
| 5 | 0 1 2 3 4 | 2 | 2 |
| 6 | 0 1 2 3 4 5 | 3 | 3 |
| 7 | 0 1 2 3 4 5 6 | 3 | 3 |

That is exactly what this problem wants, and the reason is the loop condition.
Reversing from index `n / 2` gives a second half of `n - n/2` nodes — the same
size as the first half when `n` is even, and one longer when it is odd. Walking
**while the reversed pointer is non-null** therefore compares:

- even `n`: each half against the other, exactly `n / 2` comparisons;
- odd `n`: the same, plus one final comparison of the middle node **against
  itself**, which is always true and harmless.

So no parity branch is needed anywhere. The stack-based approach further down
does need one, which is a fair way to see what this arrangement is buying.

## The list does not survive unless you put it back

This is the part most descriptions skip. After reversing the second half, the
first half's last node still points at the node that is now the **tail** of the
reversed half. Walk from the head and the list ends there:

| n | Before | After, with no restoring pass |
|---|---|---|
| 4 | `0 1 1 0` | `0 1 1` |
| 5 | `0 1 2 1 0` | `0 1 2` |
| 6 | `0 1 2 2 1 0` | `0 1 2 2` |
| 7 | `0 1 2 3 2 1 0` | `0 1 2 3` |

The list is silently truncated to `floor(n / 2) + 1` nodes. Nothing crashes, no
cycle is created, and what remains is a perfectly well-formed null-terminated
list — which is what makes this dangerous. A predicate named `isPalindrome`
returned the right answer and destroyed half the caller's data.

The fix is one line: reverse the second half back before returning. It costs a
second pass over half the list and restores the list exactly, confirmed for every
length from 0 to 200. It works because the link **into** the second half is never
touched — only the links inside it are.

## The inversion

The three previous subtopics all found the same thing: the O(n) helper structure
was dramatically slower, by 21x to 68x, even when it touched fewer pointers.
Here the opposite happens.

Exact dereferences at n = 100,000:

| Input | Reverse | Array | Stack |
|---|---|---|---|
| True palindrome | 400,000 | **100,000** | 250,000 |
| Fails on first comparison | 300,000 | **100,000** | 249,999 |
| Random 0/1 | 300,002 | **100,000** | 200,001 |

And the timings agree with the dereference counts this time:

| Input | n | Reverse | Array | Stack |
|---|---|---|---|---|
| True palindrome | 1,000 | 3.25us | 2.53us | **1.85us** |
| True palindrome | 100,000 | 407.27us | **198.63us** | 245.50us |
| Fails on first comparison | 100,000 | 300.34us | **153.22us** | 229.18us |

The array is about **2.05x faster** than reversing, and the stack about 1.66x.

The reason is what the O(n) memory is made of. A hash set costs a hash
computation and an allocation per element; a `vector<int>` is one contiguous
block filled sequentially, which is close to the cheapest thing a CPU can do.
"O(n) extra space" is a single phrase covering costs that differ by two orders of
magnitude, and the loop subtopics happened to use the expensive kind.

What the O(1) version actually buys is memory, and that part is real:

| n | Reverse | Array | Stack |
|---|---|---|---|
| 4,000,000 | **77.9 MB** | 109.2 MB | 85.6 MB |
| 10,000,000 | **192.2 MB** | 292.2 MB | 212.0 MB |

The array adds about 100 MB at ten million nodes; the stack, holding only half as
many values, adds 19.8 MB.

Python keeps the same ordering, and more sharply:

| Input | n | Reverse | Array | Stack |
|---|---|---|---|---|
| True palindrome | 1,000 | 98.16us | **59.41us** | 80.58us |
| True palindrome | 100,000 | 9,130us | **5,078us** | 8,489us |

Worth noticing there: the Python array version is written `v == v[::-1]`, which
builds an entire reversed copy and does **no** early exit — strictly more work
than the pointer walk — and still wins by **1.8x**, because all of it happens in
C rather than in the interpreter.

<!-- @intuition -->
A singly linked list can only be read in one direction, so every solution here is really an answer to the question "how do I get a backwards view of this?" — copy it into something that can be indexed, push half of it onto a stack, or physically turn the second half around. Seeing them as three answers to that one question is more useful than memorising three algorithms, and it explains why the in-place one is fiddly: it is the only one that changes the thing it was asked to inspect, which is why restoring the list matters and why forgetting to is such an easy mistake to make. The other thing worth carrying away is a correction to a habit. Three subtopics in a row have shown the O(1)-space pointer method beating an O(n) helper by a wide margin, and it is tempting to generalise that into a rule. The rule is false. What made those cases lopsided was hashing, not the memory; swap the hash table for a flat array and the same comparison comes out the other way round. Complexity classes tell you how cost grows, never what it is, and the only way to know which of two O(n) algorithms is faster is to run them.

<!-- @approach -->
### Optimal for Space - Reverse the Second Half

<!-- @idea -->
Turn the back half of the list around so it can be read backwards, walk both halves in step, then put it back.

<!-- @steps -->
1. Treat a list of zero or one node as a palindrome and return immediately.
2. Find the middle node with the tortoise and hare.
3. Reverse the list from the middle onwards, keeping the new head of that reversed half.
4. Walk one pointer from the head and one from the reversed half, comparing values.
5. Stop at the first mismatch, or when the reversed half runs out.
6. Reverse the second half back before returning, so the caller's list is unchanged.

<!-- @complexity -->
- time: O(n) — a pass to find the middle, one to reverse, one to compare, one to restore
- space: **O(1)** — a handful of pointers
- note: The one to write when memory matters, and **the slowest of the three** — 407.27us against the array's 198.63us at a hundred thousand nodes. Its real payment is space: 192.2 MB against 292.2 MB at ten million. Step 6 is not optional: without it the caller's list is silently truncated to `floor(n / 2) + 1` nodes, still well-formed, so nothing announces the damage.

<!-- @code cpp -->
```cpp
bool isPalindrome(Node* head) {
    if (head == nullptr || head->next == nullptr) return true;
    Node* rev = reverseList(middle(head));

    Node* a = head;
    Node* b = rev;
    bool ok = true;
    while (b != nullptr) {
        if (a->data != b->data) { ok = false; break; }
        a = a->next;
        b = b->next;
    }
    reverseList(rev);
    return ok;
}
```

<!-- @annotations -->
- 8: Looping on `b` rather than `a` is what removes the parity branch. The reversed half is the shorter or equal one for even `n` and one longer for odd, where the extra step compares the middle node with itself.
- 13: Without this the list is truncated to `floor(n / 2) + 1` nodes. It is safe to reverse blindly because the first half's link into the second half was never modified.
- 10: Advancing `a` unconditionally is fine even for odd lengths — it never runs off the end before `b` does.
- 3: `middle` returns index `n / 2`, the **second** middle when the length is even, which is exactly the split this comparison wants.

<!-- @code java -->
```java
static boolean isPalindrome(Node head) {
    if (head == null || head.next == null) return true;
    Node rev = reverseList(middle(head));

    Node a = head;
    Node b = rev;
    boolean ok = true;
    while (b != null) {
        if (a.data != b.data) { ok = false; break; }
        a = a.next;
        b = b.next;
    }
    reverseList(rev);
    return ok;
}
```

<!-- @annotations -->
- 9: Comparing `data` by value here, deliberately — palindrome asks about the sequence of values, unlike every loop question in this topic, which asked about node identity.

<!-- @code python -->
```python
def is_palindrome(head):
    if head is None or head.next is None:
        return True
    rev = reverse_list(middle(head))

    a, b = head, rev
    ok = True
    while b is not None:
        if a.data != b.data:
            ok = False
            break
        a, b = a.next, b.next
    reverse_list(rev)
    return ok


# The restoring pass on the second-to-last line is what keeps this a
# predicate rather than a mutation. Verified to leave the list byte
# for byte identical for every length from 0 to 200.
```

<!-- @annotations -->
- 13: Leave this out and `is_palindrome` quietly shortens the caller's list to `floor(n / 2) + 1` nodes while returning the correct answer.

<!-- @approach -->
### Copy the Values to an Array

<!-- @idea -->
Read the values into an array, which can be indexed from both ends, and close two pointers towards the middle.

<!-- @steps -->
1. Walk the list once, appending every value to an array.
2. Put one index at the start and one at the end.
3. Compare the two values; if they differ, it is not a palindrome.
4. Move the first index forward and the second backward.
5. Stop when they meet or cross — everything matched.

<!-- @complexity -->
- time: O(n) — one pass to copy, at most half a pass to compare
- space: **O(n)** — one array slot per node
- note: **The fastest of the three**, at 198.63us against the reverse method's 407.27us at a hundred thousand nodes, and it touches the fewest pointers — 100,000 against 400,000. It is also the only one that leaves the list untouched by construction. The cost is memory: 292.2 MB against 192.2 MB at ten million nodes. Choose it unless the list is large enough for that to matter.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool isPalindromeArray(Node* head) {
    vector<int> v;
    for (Node* p = head; p != nullptr; p = p->next) v.push_back(p->data);

    for (size_t i = 0, j = v.size(); i < j; ) {
        if (v[i++] != v[--j]) return false;
    }
    return true;
}
```

<!-- @annotations -->
- 8: `j` starts at `size()`, one past the end, and `--j` brings it into range before the read, so the two indices are symmetric and the empty list needs no special case. `i < j` rather than `i != j` also matters: the indices step past each other for even lengths and land on the same slot for odd ones, and only `<` stops both correctly.
- 9: The increment and decrement happen inside the comparison, so each index moves exactly once per round.
- 6: Reserving `v.reserve(n)` first would avoid the reallocations, but needs the length, which is another full pass.

<!-- @code java -->
```java
static boolean isPalindromeArray(Node head) {
    List<Integer> v = new ArrayList<>();
    for (Node p = head; p != null; p = p.next) v.add(p.data);

    for (int i = 0, j = v.size() - 1; i < j; i++, j--) {
        if (!v.get(i).equals(v.get(j))) return false;
    }
    return true;
}
```

<!-- @annotations -->
- 6: `.equals`, not `==`. `List<Integer>` holds boxed values, and `==` compares references — correct only by accident for values inside the cache range, and wrong above it.

<!-- @code python -->
```python
def is_palindrome_array(head):
    v = []
    p = head
    while p is not None:
        v.append(p.data)
        p = p.next
    return v == v[::-1]


# `v[::-1]` builds a whole reversed copy and there is no early exit,
# so this does strictly more work than the pointer version -- and
# still runs 1.8x faster, because all of it happens in C.
```

<!-- @annotations -->
- 7: The idiomatic form, and the fastest one here despite doing more work. A hand-written two-pointer loop over `v` would exit early and still lose, because each of its steps is an interpreted bytecode.

<!-- @approach -->
### Push the First Half onto a Stack

<!-- @idea -->
Stack the first half's values as the tortoise walks, then pop them off against the second half — the stack hands them back reversed.

<!-- @steps -->
1. Walk the tortoise one step and the hare two, pushing the tortoise's value each time.
2. Stop when the hare runs out; the tortoise is now at the middle.
3. If the length was odd, step the tortoise past the middle node, which has no partner.
4. Walk the tortoise to the end, popping a value for each node and comparing.
5. It is a palindrome if every comparison matched and the stack emptied exactly.

<!-- @complexity -->
- time: O(n) — one combined pass to fill the stack, one to drain it
- space: **O(n/2)** — half as many values as the array version
- note: A genuine middle ground: faster than reversing at 245.50us against 407.27us, and holding half the memory of the array — 19.8 MB of overhead at ten million nodes against 100 MB. It pays for that with the one thing the reverse method avoids: an **explicit parity branch** on step 3, because the odd middle node has no partner to pop against.

<!-- @code cpp -->
```cpp
#include <stack>
using namespace std;

bool isPalindromeStack(Node* head) {
    stack<int> firstHalf;
    Node* slow = head;
    Node* fast = head;
    while (fast != nullptr && fast->next != nullptr) {
        firstHalf.push(slow->data);
        slow = slow->next;
        fast = fast->next->next;
    }
    if (fast != nullptr) slow = slow->next;

    while (slow != nullptr) {
        if (firstHalf.empty() || firstHalf.top() != slow->data) return false;
        firstHalf.pop();
        slow = slow->next;
    }
    return firstHalf.empty();
}
```

<!-- @annotations -->
- 13: The parity branch. A non-null `fast` here means the length was odd, so the tortoise is standing on the unpaired middle node and must step past it.
- 20: Requiring the stack to be empty catches a second-half that ran out early, which the comparison loop alone would not notice.
- 9: Pushing before advancing is what makes the stack hold exactly the first half and not one node too many.

<!-- @code java -->
```java
static boolean isPalindromeStack(Node head) {
    Deque<Integer> firstHalf = new ArrayDeque<>();
    Node slow = head, fast = head;
    while (fast != null && fast.next != null) {
        firstHalf.push(slow.data);
        slow = slow.next;
        fast = fast.next.next;
    }
    if (fast != null) slow = slow.next;

    while (slow != null) {
        if (firstHalf.isEmpty() || !firstHalf.pop().equals(slow.data)) return false;
        slow = slow.next;
    }
    return firstHalf.isEmpty();
}
```

<!-- @annotations -->
- 2: `ArrayDeque` rather than the legacy `Stack`, which is synchronised and slower for no benefit.

<!-- @code python -->
```python
def is_palindrome_stack(head):
    first_half = []
    slow = fast = head
    while fast is not None and fast.next is not None:
        first_half.append(slow.data)
        slow = slow.next
        fast = fast.next.next
    if fast is not None:
        slow = slow.next

    while slow is not None:
        if not first_half or first_half.pop() != slow.data:
            return False
        slow = slow.next
    return not first_half
```

<!-- @annotations -->
- 8: `fast is not None` distinguishes odd from even. For an even length the hare lands exactly on null; for an odd one it stops on the last node.

<!-- @example -->

<!-- @input -->
`1 -> 2 -> 3 -> 2 -> 1`

<!-- @output -->
`true`

<!-- @why -->
An odd-length trace, showing why no special case is needed for the unpaired middle node.

<!-- @walkthrough -->
1. The length is 5, so `middle` returns the node at index 2 — the node holding 3.
2. Reversing from there turns `3 -> 2 -> 1` into `1 -> 2 -> 3`, whose head is the node holding 1.
3. The first half still reads `1 -> 2 -> 3`, because the link into the second half was never changed.
4. Comparison one: 1 against 1. Comparison two: 2 against 2.
5. Comparison three compares the node holding 3 against **itself** — the middle node is in both halves — which trivially matches.
6. The reversed pointer is now null, the loop ends, and the answer is `true`.
7. The restoring pass turns `1 -> 2 -> 3` back into `3 -> 2 -> 1`, and the caller's list reads `1 2 3 2 1` again.

<!-- @example -->

<!-- @input -->
`0 -> 1 -> 2 -> 3 -> 2 -> 1 -> 0` with the restoring pass removed

<!-- @output -->
The function returns `true`, and the caller's list is now `0 1 2 3`

<!-- @why -->
The defect that makes this the most dangerous approach of the three.

<!-- @walkthrough -->
1. Reversing from the middle leaves the node at index 3 pointing at null, because it is now the reversed half's tail.
2. The node at index 2 still points at it, since that link was never touched.
3. Walking from the head therefore stops after four nodes: `0 1 2 3`.
4. The list is truncated to `floor(n / 2) + 1` nodes — measured as 3 for n = 4 and n = 5, and 4 for n = 6 and n = 7.
5. Nothing crashes and no cycle is formed; the result is a valid, correctly terminated list of the wrong length.
6. The returned answer is still correct, so a test that only checks the return value passes.
7. One line — reversing the second half back — restores the list exactly, verified for every length from 0 to 200.

<!-- @example -->

<!-- @input -->
The same three approaches, timed and counted at n = 100,000

<!-- @output -->
The O(1)-space method is the slowest; the array is 2.05x faster

<!-- @why -->
Reverses the conclusion of the three preceding subtopics, and explains why both are correct.

<!-- @walkthrough -->
1. **Detect a loop**, **Find the starting point** and **Length of loop** all found the O(n) helper 21x to 68x slower than the pointer method.
2. Here the ordering flips: 198.63us for the array against 407.27us for reversing.
3. The dereference counts agree rather than contradicting: 100,000 for the array against 400,000 for reversing.
4. The difference is what the O(n) memory is made of, not how much of it there is.
5. Those subtopics used a hash set — a hash computation and an allocation per element.
6. This one uses a flat `vector<int>`: one contiguous block, filled sequentially, about the cheapest operation a CPU performs.
7. "O(n) extra space" covers both, which is exactly why the phrase cannot be used to predict which is faster.

<!-- @example -->

<!-- @input -->
`v == v[::-1]` in Python against a hand-written two-pointer loop

<!-- @output -->
The version doing strictly more work is 1.8x faster

<!-- @why -->
The same lesson in the opposite direction: where the work happens matters more than how much there is.

<!-- @walkthrough -->
1. `v[::-1]` allocates a complete reversed copy of the list of values.
2. It then compares all `n` elements with no early exit at any point.
3. A hand-written two-pointer loop allocates nothing and stops at the first mismatch.
4. By any operation count the hand-written version should win comfortably.
5. Measured at n = 100,000, the slice version ran in 5,078us against the pointer walk's 9,130us.
6. The reason is that the slice and the comparison both execute in C, while every step of the hand-written loop is interpreted bytecode.
7. The general form: in Python, moving work into a built-in usually beats doing less work in the interpreter.

<!-- @visualization linked-list -->

<!-- @description -->
The centre of this should be the mutation, because that is what the reader most needs to see and what a static diagram never shows. Draw the list straight across, mark the middle found by the tortoise and hare, and then animate the reversal of the back half in place — nodes staying where they are while their arrows swing round one at a time. The critical frame is the one immediately after: leave a bright marker on the link from the first half into the second, the one that was never modified, and let the reader trace from the head and watch the walk fall off the end early. Print what the caller now sees, `0 1 2 3`, against what they had, `0 1 2 3 2 1 0`, and label it truncated to floor(n/2)+1, not corrupted, so it is clear the damage is silent rather than loud. Then run the restoring pass and show the same trace reaching the end again. Above that, run the comparison itself with two walkers stepping inward from both ends, and use an odd-length list so the final frame lands both walkers on the same node — the middle compared against itself — with a note that this is why the loop needs no parity branch. Beside it, the stack version on the same odd list, where the parity branch is drawn explicitly as a fork the tortoise takes to step over the unpaired middle: the two approaches side by side make the trade visible. Close with the three-way cost comparison as paired bars, dereferences and microseconds, with the array shortest on both — and directly beneath it the memory bars, where the ordering reverses and the O(1) method is shortest. Two charts pointing opposite ways is the whole argument.

<!-- @sampleInput -->
```json
{"machine":{"cpu":"Apple M2","arch":"arm64","compiler":"Apple clang 17.0.0","python":"CPython 3.13.4"},"question":"does the list read the same forwards and backwards","coreDifficulty":"a singly linked list cannot be read backwards -- every approach is a different way of buying that ability","correctness":{"comparedAgainst":"a reference implementation","exhaustive":"every binary list up to length 14","lists":32767,"disagreements":0,"python":{"exhaustive":"every binary list up to length 12","lists":8191,"disagreements":0}},"parity":{"middleReturns":"the node at index n/2 -- the SECOND middle when n is even","table":[{"n":4,"list":"0 1 2 3","middle":2},{"n":5,"list":"0 1 2 3 4","middle":2},{"n":6,"list":"0 1 2 3 4 5","middle":3},{"n":7,"list":"0 1 2 3 4 5 6","middle":3}],"whyNoBranchIsNeeded":"reversing from index n/2 gives a second half the same size as the first when n is even and one longer when odd; looping while the REVERSED pointer is non-null compares n/2 pairs either way, with odd n adding one comparison of the middle node against itself","contrast":"the stack approach does need an explicit parity branch, which is a fair way to see what this arrangement buys"},"theMutation":{"cause":"after reversing the second half, the first half's last node still points at what is now the reversed half's TAIL","effect":"walking from the head stops there","truncatedLength":"floor(n/2) + 1","measured":[{"n":4,"before":"0 1 1 0","after":"0 1 1"},{"n":5,"before":"0 1 2 1 0","after":"0 1 2"},{"n":6,"before":"0 1 2 2 1 0","after":"0 1 2 2"},{"n":7,"before":"0 1 2 3 2 1 0","after":"0 1 2 3"}],"whyItIsDangerous":"nothing crashes, no cycle is created, and the result is a perfectly well-formed null-terminated list -- and the RETURN VALUE is still correct, so a test checking only the answer passes","fix":"reverse the second half back before returning","fixVerified":"list identical for every length 0..200, in both C++ and Python","whyTheFixWorks":"the link INTO the second half is never modified -- only the links inside it"},"theInversion":{"priorSubtopics":"Detect a loop, Find the starting point and Length of loop all found the O(n) helper 21x to 68x SLOWER than the pointer method","hereItFlips":"the O(n) array is about 2.05x FASTER than the O(1) reverse method","dereferencesAgreeThisTime":true,"cause":"what the O(n) memory is MADE OF, not how much of it there is","hashSet":"a hash computation and an allocation per element","flatVector":"one contiguous block filled sequentially -- about the cheapest thing a CPU does","lesson":"'O(n) extra space' covers both, which is exactly why the phrase cannot predict which is faster"},"dereferences":{"n":100000,"rows":[{"input":"true palindrome","reverse":400000,"array":100000,"stack":250000},{"input":"fails on 1st compare","reverse":300000,"array":100000,"stack":249999},{"input":"random 0/1","reverse":300002,"array":100000,"stack":200001}]},"benchCpp":{"unit":"microseconds, median of 15, three clean runs","rows":[{"input":"true palindrome","n":1000,"reverse":3.25,"array":2.53,"stack":1.85},{"input":"true palindrome","n":100000,"reverse":407.27,"array":198.63,"stack":245.50},{"input":"fails on 1st compare","n":100000,"reverse":300.34,"array":153.22,"stack":229.18}],"arrayVsReverse":"about 2.05x faster","stackVsReverse":"about 1.66x faster"},"memory":{"note":"this is what the O(1) method actually buys, and it is real","rows":[{"n":4000000,"reverse":"77.9 MB","array":"109.2 MB","stack":"85.6 MB"},{"n":10000000,"reverse":"192.2 MB","array":"292.2 MB","stack":"212.0 MB"}],"arrayOverhead":"about 100 MB at ten million nodes","stackOverhead":"19.8 MB -- exactly n/2 ints"},"benchPython":{"unit":"microseconds, medians across three runs","rows":[{"input":"true palindrome","n":1000,"reverse":98.16,"array":59.41,"stack":80.58},{"input":"true palindrome","n":100000,"reverse":9130,"array":5078,"stack":8489}],"theSliceParadox":{"code":"v == v[::-1]","doesMoreWork":"builds a complete reversed copy and has NO early exit","stillWinsBy":"1.8x","why":"the slice and the comparison both run in C, while every step of a hand-written loop is interpreted bytecode","generalForm":"in Python, moving work into a built-in usually beats doing less work in the interpreter"}},"valueVsIdentity":"palindrome compares DATA, unlike every loop question in this topic, which compared node identity -- so Java needs .equals on boxed Integers and Python needs != rather than is not","recommendation":"the array version unless the list is large enough for the memory to matter; the reverse version when it is, and never without the restoring pass","lesson":"the celebrated O(1)-space answer is the slowest of the three here -- complexity classes describe growth, never cost"}
```

<!-- @highlights -->
- The list is drawn straight across with the tortoise-hare middle marked.
- The back half reverses in place — nodes staying put while their arrows swing round one at a time.
- The critical frame comes immediately after: a bright marker sits on the link from the first half into the second, the one never modified.
- Tracing from the head, the walk visibly falls off the end early.
- What the caller now sees, `0 1 2 3`, is printed against what they had, `0 1 2 3 2 1 0`.
- It is labelled truncated to floor(n/2)+1, not corrupted — the damage is silent, not loud.
- The restoring pass then runs and the same trace reaches the end again.
- Above that, the comparison runs with two walkers stepping inward from both ends.
- The list is odd-length, so the final frame lands both walkers on the same node — the middle compared against itself.
- A note explains that this is why the comparison loop needs no parity branch.
- Beside it, the stack version runs on the same odd list.
- There the parity branch is drawn explicitly as a fork the tortoise takes to step over the unpaired middle.
- The two side by side make the trade visible.
- The close pairs bars for dereferences and microseconds, with the array shortest on both.
- Directly beneath sit the memory bars, where the ordering reverses and the O(1) method is shortest.
- Two charts pointing opposite ways is the whole argument.

<!-- @edgeCases -->
- The empty list — treated as a palindrome and returned before any pointer is dereferenced.
- A single node — a palindrome, and the shortest list where the early return matters.
- Two equal nodes — the smallest even case that actually performs a comparison.
- Two different nodes — the smallest list that is not a palindrome.
- An odd-length list — the middle node is compared against itself, which is always true and needs no branch.
- An even-length list — the two halves are the same size and every node has a partner.
- A list where every value is identical — a palindrome, and the case where no early exit ever fires.
- A mismatch at the very first comparison — the answer is known immediately, but the middle has already been found and the half already reversed.
- The caller's list after the call — unchanged only if the restoring pass runs; otherwise `floor(n / 2) + 1` nodes.
- Boxed integer values in Java — `.equals` is required, since `==` compares references outside the small-value cache.
- A list holding values that compare equal but are distinct objects — this problem asks about values, not identity, unlike the loop subtopics.

<!-- @pitfalls -->
- Omitting the restoring pass. The answer is right and the caller's list is silently truncated to `floor(n / 2) + 1` nodes, still well-formed so nothing complains.
- Testing only the return value. Every implementation here returns the correct answer; only inspecting the list afterwards catches the mutation.
- Looping the comparison on the first-half pointer instead of the reversed one. That runs past the end for odd lengths.
- Adding a parity branch to the reverse method. It is not needed — the reversed half being one longer for odd `n` is exactly what makes the middle compare against itself.
- Forgetting the parity branch in the **stack** method. There it **is** needed, because the unpaired middle node has no value to pop against.
- Using `==` on `Integer` in Java. It compares references and is correct only by accident for small values.
- Assuming O(1) space means fastest. It is the slowest of the three here — 407.27us against the array's 198.63us.
- Generalising from the loop subtopics that O(n) helpers are slow. That was hashing, not memory; a flat array inverts the result.
- Writing a hand-rolled two-pointer loop in Python to avoid `v[::-1]`. It does less work and runs 1.8x slower.
- Checking only that the comparison loop matched, in the stack version. The stack must also end empty, or a short second half slips through.
- Reserving the array with a length computed by a prior pass. That pass costs as much as the copy it optimises.

<!-- @doubt -->
### Do I need a special case for odd-length lists?

<!-- @answer -->
Not in the reverse-based version, and the reason is worth seeing rather than memorising. The tortoise-hare `middle` returns the node at index `n / 2`, which for an even length is the **second** of the two middles. Reversing from there gives a second half of `n - n/2` nodes: the same size as the first half when `n` is even, and exactly one longer when it is odd. If you loop **while the reversed pointer is non-null**, an even list performs `n / 2` comparisons and an odd list performs one more — and that extra one compares the middle node **against itself**, since it belongs to both halves. It is always true and always harmless. Loop on the first-half pointer instead and you lose this, because that pointer runs past the end. The stack approach genuinely does need a parity branch, which is a good way to see that this is a property of the arrangement rather than of the problem.

<!-- @doubt -->
### Does this modify the list I was given?

<!-- @answer -->
Yes, unless you add a line to undo it — and this is the defect most write-ups of this problem leave out. After reversing the second half, the first half's last node still points at the node that is now that half's **tail**, so walking from the head stops there. Measured: a 4-node list comes back as 3 nodes, a 7-node list as 4. The general form is `floor(n / 2) + 1`. What makes it dangerous is how quiet it is — no crash, no cycle, and what remains is a perfectly valid null-terminated list, while the function returns the **correct answer**. A test that checks only the return value passes. The fix is one line, reversing the second half back before returning, and it restores the list exactly because the link *into* the second half was never touched — verified for every length from 0 to 200.

<!-- @doubt -->
### Is the O(1)-space version the best one?

<!-- @answer -->
Only if you care about memory, which is a narrower claim than "optimal" usually implies. Measured at a hundred thousand nodes, reversing took **407.27us**, the array **198.63us** and the stack 245.50us — the O(1) method is the **slowest of the three**, by about 2x. The dereference counts say the same: 400,000 against the array's 100,000. What it genuinely buys is space, and that part is real — 192.2 MB against 292.2 MB at ten million nodes. So the honest summary is that the array is the default and the reverse method is what you reach for when the list is large enough that a hundred megabytes matters, or when you cannot allocate at all. The stack version sits usefully between them: faster than reversing, and holding only half as many values as the array.

<!-- @doubt -->
### The last three subtopics said the O(n) structure was much slower. Why is it faster here?

<!-- @answer -->
Because "O(n) extra space" describes how much memory grows, not what using it costs, and the two cases use completely different structures. **Detect a loop**, **Find the starting point** and **Length of loop** all reached for a hash set, which pays a hash computation and a separate allocation for every element — that is why it lost by 21x to 68x even while touching fewer pointers. This problem uses a flat `vector<int>`: one contiguous block, filled front to back, which is close to the cheapest thing a processor does. Same complexity class, costs two orders of magnitude apart. It is a useful correction to make deliberately, because three consecutive results pointing the same way is exactly the kind of thing that hardens into a false rule. The reliable version of the rule is narrower: complexity tells you how cost **grows**, and only measurement tells you what it **is**.

<!-- @doubt -->
### Why is `v == v[::-1]` faster than a proper two-pointer loop in Python?

<!-- @answer -->
Because it does more work in a faster place. The slice builds a complete reversed copy of the values and the comparison then checks all `n` of them with no early exit anywhere — strictly more work than a two-pointer loop that allocates nothing and stops at the first mismatch. Measured at a hundred thousand nodes it still won, 5,078us against 9,130us, about **1.8x**. The reason is that both the slice and the `==` execute inside CPython's C implementation, while every step of the hand-written loop is an interpreted bytecode with its own dispatch and object handling. The general form is worth carrying beyond this problem: in Python, pushing work into a built-in usually beats doing less work in the interpreter, and the crossover point is much further out than operation counts suggest. In C++ the same argument does not apply, which is why the array version there is written as an early-exiting two-pointer loop.

<!-- @doubt -->
### Should I compare node identity or node values?

<!-- @answer -->
Values — and this is the one problem in this stretch of the topic where that is true, which makes it easy to get wrong by habit. **Detect a loop**, **Find the starting point** and **Length of loop** all asked whether two pointers were on the **same node**, so they needed `is` in Python and reference comparison in Java, and using value equality there would have been a bug. A palindrome is a question about the **sequence of values**, so here the comparison is `a.data != b.data` and value equality is exactly right. The practical traps are language-specific: in Java, `List<Integer>` holds boxed values, so `==` compares references and is correct only by accident for values inside the small-integer cache — use `.equals`. In Python, `!=` on the data is right, while `is not` would compare object identity and give wrong answers for anything outside the interned range.
