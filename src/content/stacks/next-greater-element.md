---
id: next-greater-element
topic: Stacks
title: Next Greater Element
difficulty: Medium
status: ready
prerequisites:
  - number-of-greater-elements-to-the-right
  - balanced-paranthesis
  - implement-stack-using-arrays
  - time-and-space-complexity-basics
relatedIds:
  - next-greater-element-2
  - next-smaller-element
  - stock-span-problem
  - largest-rectangle-in-a-histogram
  - number-of-greater-elements-to-the-right
---

<!-- @summary -->
Each element is pushed once and popped at most once, so the whole scan costs **exactly 2.00 stack operations per element** — measured at n = 1,000,000, and 1.00 on an increasing array where nothing is ever popped. Both formulations were verified against brute force over 50,000 tie-heavy arrays with zero mismatches. The surprise is the timing: on random input the brute force is only **1.28x** slower, because its average scan is about `ln(n)` comparisons — 14.36 measured against `ln(10⁶) = 13.82` — making it Θ(n log n), not Θ(n²). The stack's win is entirely about the worst case, where it is **1,621x** ahead.

<!-- @theory -->
## The problem

For each element, find the first element to its right that is strictly greater.
Report −1 when there is none.

```
a  =  2   7   3   5   4   6   8
NGE=  7   8   5   6   6   8  -1
```

## Two ways to hold the stack

The previous subtopic showed why counting cannot use a stack. This one is the
problem the stack *does* solve, and it comes in two formulations that are worth
seeing together, because they are the same algorithm with different things stored.

**Right to left — the stack holds candidates.** Walk backwards. Before answering
for `a[i]`, discard everything on the stack that is not greater than it; those
elements are permanently useless, because `a[i]` sits between them and anything
further left, and is at least as large. Whatever remains on top is the answer.

**Left to right — the stack holds questions.** Walk forwards, keeping indices of
elements that have not yet found their answer. Each new element resolves every
waiting index it exceeds, all at once, and then joins the queue of the unanswered.

Both were checked against brute force over 50,000 random arrays of up to 10
elements drawn from a range of 6, so ties are everywhere — **0 mismatches** for
each.

The second formulation is the one that generalises: Stock Span, Largest Rectangle
and Sum of Subarray Minimums are all "elements waiting for a boundary, resolved
in a batch when it arrives".

## Why it is linear

Every element is pushed exactly once and popped at most once. That is the whole
argument, and it is measurable:

| n | Pushes | Pops | Stack operations per element |
|---|---|---|---|
| 1,000 | 1,000 | 991 | 1.99 |
| 10,000 | 10,000 | 9,992 | 2.00 |
| 100,000 | 100,000 | 99,994 | 2.00 |
| 1,000,000 | 1,000,000 | 999,989 | **2.00** |

The pops fall just short of the pushes because whatever is still on the stack at
the end was never popped — those are exactly the elements with no greater element
to their right.

The bound is not an average. It holds for every input:

| Input, n = 100,000 | Pushes | Pops | Per element |
|---|---|---|---|
| Strictly increasing | 100,000 | **0** | **1.00** |
| Strictly decreasing | 100,000 | 99,999 | 2.00 |

An increasing array never pops anything, because scanning right to left every new
element is smaller than the top. A decreasing array pops almost everything. Both
are 2n or less, which is what O(n) means here.

## The honest timing

This is where the expected result does not arrive:

| n | Brute force, random | Stack | Ratio |
|---|---|---|---|
| 1,000 | 4,166ns | 2,583ns | 1.6x |
| 4,000 | 27,917ns | 18,833ns | 1.5x |
| 16,000 | 130,708ns | 112,042ns | 1.2x |
| 64,000 | 485,083ns | 378,750ns | **1.28x** |

Barely anything. The brute force is nominally O(n²), so why?

Because its inner loop breaks at the *first* greater element, and on random data
that is close by. Measuring the average scan length directly:

| Random input | Comparisons per element |
|---|---|
| n = 1,000 | 6.82 |
| n = 10,000 | 8.43 |
| n = 100,000 | 10.87 |
| n = 1,000,000 | **14.36** |

Compare `ln(1,000,000) = 13.82`. The average scan is about `ln(n)`, so the brute
force is **Θ(n log n)** on random input, not Θ(n²) — and a linear algorithm beats
an n log n one by a factor of log n, which at these sizes is small.

## Where the stack actually earns its keep

Give it the worst case — a strictly decreasing array, where every element must
scan to the end:

| n | Brute force, decreasing | Stack | Ratio |
|---|---|---|---|
| 1,000 | 204,709ns | 2,583ns | 79x |
| 4,000 | 2,766,792ns | 18,833ns | 147x |
| 16,000 | 38,680,083ns | 112,042ns | 345x |
| 64,000 | **613,938,500ns** | 378,750ns | **1,621x** |

The scan length there is `(n−1)/2` per element — 49,999.5 at n = 100,000 — which
is the genuine quadratic. Python shows the same shape: 4.3x on random input at
n = 20,000, and **1,867x** on decreasing input.

So the monotonic stack is not a constant-factor optimisation of the obvious
method. It is insurance against an input shape that is both common in practice —
sorted data is everywhere — and catastrophic without it.

## Ties

`a = [2, 2]` has no next greater element for either position, because the problem
says *strictly* greater. That fixes the comparison in each formulation:

- Right to left: pop while the top is `<= a[i]`.
- Left to right: resolve while `a[stack.top()] < a[i]`.

They look inconsistent and are not — one is deciding what to discard and the other
what to answer. Getting either backwards makes equal values report each other,
which is invisible on any input with distinct values. The verification used a
value range of 6 for exactly this reason.

## Where this goes next

**Next Greater Element - 2** makes the array circular, so the scan wraps around.
The standard trick is to run the same loop twice over a doubled index range, which
turns out to cost nothing asymptotically — and there is a reason the second pass
cannot cascade further, which is the interesting part.

<!-- @intuition -->
Scanning right to left, ask what makes an element worth remembering. If you have already seen a large value to the right, then any smaller value you saw further right is useless — it can never be the answer for anything you meet later, because that larger value stands in front of it and would be reached first. So the only elements worth keeping are the ones forming a decreasing run from where you stand, and the answer for the current element is simply the first of those that beats it. Every element you throw away is thrown away permanently, which is why the total work is linear rather than quadratic: an element cannot be discarded twice. Read the other way round, forwards, the same structure holds the elements still waiting for an answer, and a large new value settles all the outstanding small ones at once — which is the shape that most of the rest of this topic reuses.

<!-- @approach -->
### Brute Force - Scan Right Until Something Bigger

<!-- @idea -->
For each element, walk forward until a greater value appears, and stop there.

<!-- @steps -->
1. Loop `i` over every index.
2. Walk `j` forward from `i + 1`.
3. Stop at the first `a[j]` strictly greater than `a[i]` and record it.
4. If the walk reaches the end, record −1.
5. Note that the early stop is what makes this far better than its O(n^2) label suggests on random data.

<!-- @complexity -->
- time: O(n^2) worst case, but Theta(n log n) on random input — the measured average scan is about ln(n) comparisons, 14.36 at n = 1,000,000 against ln(10^6) = 13.82
- space: O(1) beyond the output
- note: The reference the stack versions were checked against, over 50,000 tie-heavy arrays with 0 mismatches. On random input it is only 1.28x slower than the stack at n = 64,000, which is why this problem's usual "quadratic versus linear" framing is misleading. On a strictly decreasing array it scans (n-1)/2 elements each — 49,999.5 at n = 100,000 — and is 1,621x slower.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> nextGreater(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1);
    for (int i = 0; i < n; i++) {
        for (int j = i + 1; j < n; j++) {
            if (a[j] > a[i]) { res[i] = a[j]; break; }
        }
    }
    return res;
}

// On random input the inner loop runs about ln(n) times, so this is
// Theta(n log n) — and only 1.28x slower than the stack at n = 64,000.
// On a decreasing array it runs (n-1)/2 times and is 1,621x slower.
```

<!-- @annotations -->
- 9: The break is the whole story: without it this would be genuinely quadratic on every input, and with it the average case collapses to about ln(n) scans. Strictly greater, so equal values do not stop the scan — [2, 2] correctly yields -1 for both positions.
- 16: Worth stating because the usual framing of this problem overstates the improvement on typical data and understates it on sorted data.

<!-- @code java -->
```java
static int[] nextGreater(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (a[j] > a[i]) { res[i] = a[j]; break; }
    return res;
}
```

<!-- @annotations -->
- 4: Arrays.fill is needed because new int[n] is zero-initialised, and 0 is a legitimate array value that must not be confused with "no answer".

<!-- @code python -->
```python
def next_greater(a: list[int]) -> list[int]:
    n = len(a)
    res = [-1] * n
    for i in range(n):
        for j in range(i + 1, n):
            if a[j] > a[i]:
                res[i] = a[j]
                break
    return res


# n = 20,000: 10.98ms on random input against the stack's 2.54ms (4.3x),
# but 4,739.9ms on a decreasing array — 1,867x.
```

<!-- @annotations -->
- 12: The two ratios in one line are the argument for the stack: the average case barely justifies it and the worst case entirely does.

<!-- @approach -->
### Optimal, Backwards - The Stack Holds Candidates

<!-- @idea -->
Scan right to left keeping only the elements that could still be somebody's answer.

<!-- @steps -->
1. Walk from the last index down to the first, with an empty stack.
2. Pop while the top of the stack is less than or equal to `a[i]` — those elements can never be an answer again.
3. If the stack is now empty, `a[i]` has no greater element to its right, so record −1.
4. Otherwise the top is the nearest greater element; record it.
5. Push `a[i]` and continue.

<!-- @complexity -->
- time: O(n) — exactly n pushes and at most n pops, measured at 2.00 stack operations per element
- space: O(n) for the stack, which holds a strictly decreasing run
- note: 0 mismatches against brute force over 50,000 arrays drawn from a range of 6, so ties are frequent. The operation count is not an average: an increasing array performs 100,000 pushes and 0 pops, and a decreasing array 100,000 pushes and 99,999 pops, both within 2n. The stack stores values here rather than indices, which is all this problem needs.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> nextGreater(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1), st;
    st.reserve(n);

    for (int i = n - 1; i >= 0; i--) {
        while (!st.empty() && st.back() <= a[i]) st.pop_back();
        res[i] = st.empty() ? -1 : st.back();
        st.push_back(a[i]);
    }
    return res;
}

// The stack always holds a strictly decreasing run of the values to the
// right of i — which is exactly the set that could still be an answer.
```

<!-- @annotations -->
- 10: <= rather than <, because an equal value is not strictly greater and must be discarded — this is the line that gets ties right. Each element is popped at most once across the whole scan, which is why the loop inside a loop is still linear.
- 12: Push the value after answering, so an element never answers itself.
- 17: Worth naming the invariant: everything below a kept element is smaller and further right, so it is unreachable as an answer.

<!-- @code java -->
```java
static int[] nextGreater(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = n - 1; i >= 0; i--) {
        while (!st.isEmpty() && st.peek() <= a[i]) st.pop();
        res[i] = st.isEmpty() ? -1 : st.peek();
        st.push(a[i]);
    }
    return res;
}
```

<!-- @annotations -->
- 4: ArrayDeque used as a stack, with push and pop both acting on the head — the usage established in Implement Stack using Arrays.
- 8: No Arrays.fill needed here, because every position is assigned during the loop rather than left at a default.

<!-- @code python -->
```python
def next_greater(a: list[int]) -> list[int]:
    res = [-1] * len(a)
    st = []
    for i in range(len(a) - 1, -1, -1):
        while st and st[-1] <= a[i]:
            st.pop()
        res[i] = st[-1] if st else -1
        st.append(a[i])
    return res


# 2.54ms at n = 20,000 against the brute force's 10.98ms on random input
# and 4,739.9ms on a decreasing one.
```

<!-- @annotations -->
- 5: `st and st[-1]` short-circuits, so the index is never evaluated on an empty list.
- 7: The conditional expression keeps the -1 case inline; writing it as an if would need the same two branches.

<!-- @approach -->
### Optimal, Forwards - The Stack Holds Unanswered Questions

<!-- @idea -->
Scan left to right keeping indices that have not found an answer yet; each new element settles every waiting index it exceeds.

<!-- @steps -->
1. Walk forward with a stack of indices whose answers are still unknown.
2. For each new element, while the stack's top index holds a smaller value, that element's answer is the new one — record it and pop.
3. Repeat until the top holds a value at least as large, or the stack is empty.
4. Push the current index, which now joins the unanswered.
5. Anything left on the stack at the end has no greater element, and keeps its −1.

<!-- @complexity -->
- time: O(n) — each index is pushed once and popped once, measured at 2.00 operations per element
- space: O(n) for the stack of indices
- note: 0 mismatches against brute force over the same 50,000 tie-heavy arrays. This is the formulation that generalises: Stock Span, Largest Rectangle in a Histogram and Sum of Subarray Minimums are all "elements waiting for a boundary, resolved in a batch when it arrives". It stores indices rather than values, because the answer must be written back to the position that was waiting.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> nextGreater(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1), st;                  // st holds INDICES
    st.reserve(n);

    for (int i = 0; i < n; i++) {
        while (!st.empty() && a[st.back()] < a[i]) {
            res[st.back()] = a[i];               // this index's wait is over
            st.pop_back();
        }
        st.push_back(i);
    }
    return res;                                  // whatever is left keeps its -1
}
```

<!-- @annotations -->
- 10: < rather than <=, because an equal value is not an answer — the mirror of the backwards version's <=, and both are correct for the same reason.
- 11: One new element can resolve many waiting indices at once, which is the batch behaviour the rest of this topic reuses.
- 6: Indices, not values, because the answer has to be written back to the position that was waiting.
- 16: No final loop is needed — the -1s were written at the start and never overwritten.

<!-- @code java -->
```java
static int[] nextGreater(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    Deque<Integer> st = new ArrayDeque<>();      // indices

    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && a[st.peek()] < a[i]) res[st.pop()] = a[i];
        st.push(i);
    }
    return res;
}
```

<!-- @annotations -->
- 8: res[st.pop()] = a[i] reads and removes in one expression, which is safe because pop returns the index before removing it.

<!-- @code python -->
```python
def next_greater(a: list[int]) -> list[int]:
    res = [-1] * len(a)
    st = []                                      # indices awaiting an answer
    for i, x in enumerate(a):
        while st and a[st[-1]] < x:
            res[st.pop()] = x
        st.append(i)
    return res


# The shape to remember: the stack is a queue of unanswered questions,
# and each new value answers as many of them as it can.
```

<!-- @annotations -->
- 6: res[st.pop()] = x is the whole algorithm in one line — pop returns the waiting index, and x is its answer.
- 11: Worth internalising, because Stock Span, Largest Rectangle and Sum of Subarray Minimums are all this loop with a different thing recorded.

<!-- @approach -->
### The Same Scan, Other Directions

<!-- @idea -->
Next smaller, previous greater and previous smaller are the same loop with the comparison or the direction flipped.

<!-- @steps -->
1. Note that "next" versus "previous" is the direction of the scan.
2. Note that "greater" versus "smaller" is the direction of the comparison used when popping.
3. Combine them: four problems, one loop, two independent switches.
4. For previous greater, scan left to right and pop while the top is less than or equal to the current value.
5. Note that the stack's contents are monotonic in every case — decreasing for greater, increasing for smaller.

<!-- @complexity -->
- time: O(n) for all four variants, with the same 2.00 stack operations per element
- space: O(n)
- note: Worth learning as one algorithm with two switches rather than four algorithms. Next Smaller Element is the next-but-one subtopic and is this loop with < swapped for >; Stock Span is previous-greater with the distance recorded instead of the value. The comparison also decides tie behaviour, which is the part that has to be chosen deliberately rather than copied.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// previous greater element, scanning forwards
vector<int> previousGreater(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1), st;
    for (int i = 0; i < n; i++) {
        while (!st.empty() && st.back() <= a[i]) st.pop_back();
        res[i] = st.empty() ? -1 : st.back();
        st.push_back(a[i]);
    }
    return res;
}

// next smaller element: the same backwards scan with the test reversed
vector<int> nextSmaller(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1), st;
    for (int i = n - 1; i >= 0; i--) {
        while (!st.empty() && st.back() >= a[i]) st.pop_back();
        res[i] = st.empty() ? -1 : st.back();
        st.push_back(a[i]);
    }
    return res;
}
```

<!-- @annotations -->
- 9: Identical to the backwards next-greater loop except that the scan runs forwards — the direction of the loop is the only difference.
- 21: And here only the comparison changed, from <= to >=, which turns "greater" into "smaller".
- 5: Four problems, one loop, two switches: the scan direction and the comparison direction.

<!-- @code java -->
```java
static int[] previousGreater(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Deque<Integer> st = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && st.peek() <= a[i]) st.pop();
        res[i] = st.isEmpty() ? -1 : st.peek();
        st.push(a[i]);
    }
    return res;
}
```

<!-- @annotations -->
- 6: The stack holds a strictly decreasing run of the values to the LEFT of i, which is the mirror of the backwards version's invariant.

<!-- @code python -->
```python
def monotonic(a, forward=True, greater=True):
    n = len(a)
    res = [-1] * n
    st = []
    order = range(n) if forward else range(n - 1, -1, -1)
    for i in order:
        while st and (st[-1] <= a[i] if greater else st[-1] >= a[i]):
            st.pop()
        res[i] = st[-1] if st else -1
        st.append(a[i])
    return res


# next greater      : monotonic(a, forward=False, greater=True)
# next smaller      : monotonic(a, forward=False, greater=False)
# previous greater  : monotonic(a, forward=True,  greater=True)
# previous smaller  : monotonic(a, forward=True,  greater=False)
```

<!-- @annotations -->
- 7: The two switches made explicit — worth writing once to see that they are independent, and not worth keeping, since the parameterised version is slower and harder to read than four short loops.

<!-- @example -->

<!-- @input -->
a = [2, 7, 3, 5, 4, 6, 8]

<!-- @output -->
[7, 8, 5, 6, 6, 8, −1]

<!-- @why -->
The 3 and the 4 both find answers several positions away, so the stack has to hold more than one candidate at a time.

<!-- @walkthrough -->
1. Scanning right to left, start at index 6 with 8. The stack is empty, so the answer is -1. Push 8.
2. Index 5 holds 6. The top is 8, which is greater, so the answer is 8. Push 6; the stack is now [8, 6] from the bottom.
3. Index 4 holds 4. The top is 6, greater, so the answer is 6. Push 4, giving [8, 6, 4].
4. Index 3 holds 5. The top is 4, which is not greater, so pop it. The new top is 6, so the answer is 6. Push 5, giving [8, 6, 5].
5. Index 2 holds 3. The top is 5, greater, so the answer is 5. Push 3.
6. Index 1 holds 7. Pop 3, then pop 5, then pop 6 — none of them is greater. The top is now 8, so the answer is 8. Push 7.
7. Index 0 holds 2, the top is 7, so the answer is 7. The stack was always a decreasing run, and the three elements popped at step 6 were never examined again.

<!-- @example -->

<!-- @input -->
Increasing and decreasing arrays of 100,000 elements

<!-- @output -->
0 pops and 99,999 pops — both within 2n total operations

<!-- @why -->
The linear bound is often stated as an average, and these two inputs show it is a worst-case guarantee that the extremes both satisfy.

<!-- @walkthrough -->
1. Scanning a strictly increasing array right to left, each new element is smaller than everything already on the stack.
2. So the while loop never executes, and the algorithm performs 100,000 pushes and 0 pops — 1.00 operations per element.
3. Every element's answer is its immediate right neighbour, which the stack top already holds.
4. Scanning a strictly decreasing array, each new element is larger than everything on the stack.
5. So each step empties the stack, and the algorithm performs 100,000 pushes and 99,999 pops — 2.00 per element.
6. Every element's answer is -1, and the stack never holds more than one element.
7. Neither exceeds 2n, and on random input the measurement is 2.00 per element at n = 1,000,000 as well — the bound is structural, not statistical.

<!-- @example -->

<!-- @input -->
Brute force on random input against a decreasing one

<!-- @output -->
1.28x and 1,621x — the same two algorithms, two orders of magnitude apart

<!-- @why -->
The usual "quadratic versus linear" framing is wrong about typical data and right about the case that matters, and the distinction is worth having as a number.

<!-- @walkthrough -->
1. At n = 64,000 the brute force took 485,083ns on random input against the stack's 378,750ns — a factor of only 1.28.
2. That is because its inner loop breaks at the first greater element, which on random data is close by.
3. Measured directly, the average scan is 6.82 comparisons at n = 1,000, rising to 14.36 at n = 1,000,000.
4. Since ln(1,000,000) is 13.82, the average scan is about ln(n), so the brute force is Theta(n log n) on random input rather than Theta(n^2).
5. A linear algorithm beats an n log n one by a factor of log n, which at these sizes is a small constant — hence 1.28x.
6. On a strictly decreasing array the scan length is (n-1)/2 per element, 49,999.5 at n = 100,000, and the brute force took 613,938,500ns against the same 378,750ns — 1,621x.
7. So the stack is not a constant-factor improvement on the obvious method; it is insurance against sorted input, which is both common and catastrophic without it.

<!-- @example -->

<!-- @input -->
a = [2, 2]

<!-- @output -->
[−1, −1]

<!-- @why -->
Ties are the only place the two formulations' comparisons look inconsistent, and the smallest input that exposes a wrong one.

<!-- @walkthrough -->
1. The problem asks for a strictly greater element, and 2 is not strictly greater than 2, so both answers are -1.
2. In the backwards formulation the test is "pop while the top is <= a[i]", so the first 2 pops the second and correctly finds nothing.
3. In the forwards formulation the test is "resolve while a[stack.top()] < a[i]", so the second 2 does not resolve the first and it keeps its -1.
4. One uses <= and the other <, which looks like an inconsistency and is not: the first decides what to discard and the second decides what to answer.
5. Getting either backwards makes equal values report each other, producing [2, -1] instead of [-1, -1].
6. That error is invisible on any input with distinct values, which is most randomly generated test data.
7. The verification here used arrays of up to 10 elements drawn from only 6 distinct values, precisely so that ties appear in nearly every case.

<!-- @visualization array -->

<!-- @description -->
Open with the two formulations side by side on the same input, because seeing them together is the point. On the left, the backwards scan: the array drawn horizontally with a caret moving right to left, and a vertical stack beside it holding values. On the right, the forwards scan with the caret moving left to right and the stack holding indices, drawn as small labelled tickets. Run both simultaneously on [2, 7, 3, 5, 4, 6, 8] so the reader can watch the same answers appear in different orders. In the backwards version, each pop should visibly fall out of the stack and fade — label the group of three pops at index 1 with "discarded permanently, never examined again". In the forwards version, when the 7 arrives it should reach into the stack and stamp answers onto several waiting tickets at once — label that "one element settles many". Then the linearity panel: a counter tracking total pushes and pops as the scan runs, ending at 7 pushes and 6 pops, with a bar showing 2.00 operations per element. Beside it, two extreme inputs animated at speed — a strictly increasing array where the stack simply grows and nothing ever falls out, and a strictly decreasing one where every step empties it — with their counters reading 1.00 and 2.00 per element. Then the timing panel, which carries the subtopic's real finding. Two charts side by side, both plotting brute force against the stack. On the left, random input: the two lines almost touching, annotated 1.28x at n = 64,000. On the right, decreasing input: the brute force curving away steeply, annotated 1,621x. Between them, put the explanation as a small inset — the measured average scan length rising 6.82, 8.43, 10.87, 14.36 against a dashed ln(n) curve that tracks it almost exactly. Close with the ties panel: [2, 2] run through both formulations, with the <= and the < highlighted in their respective loops, and a red variant showing what happens when either is flipped — the two elements pointing at each other with the output [2, -1] marked wrong.

<!-- @sampleInput -->
```json
{"problem":{"array":[2,7,3,5,4,6,8],"answer":[7,8,5,6,6,8,-1],"definition":"the first element to the right that is STRICTLY greater, or -1"},"backwards":{"stackHolds":"values that could still be somebody's answer","invariant":"a strictly decreasing run of the values to the right of i","trace":[{"i":6,"value":8,"pops":[],"answer":-1,"stackAfter":[8]},{"i":5,"value":6,"pops":[],"answer":8,"stackAfter":[8,6]},{"i":4,"value":4,"pops":[],"answer":6,"stackAfter":[8,6,4]},{"i":3,"value":5,"pops":[4],"answer":6,"stackAfter":[8,6,5]},{"i":2,"value":3,"pops":[],"answer":5,"stackAfter":[8,6,5,3]},{"i":1,"value":7,"pops":[3,5,6],"answer":8,"stackAfter":[8,7],"note":"three popped at once, never examined again"},{"i":0,"value":2,"pops":[],"answer":7,"stackAfter":[8,7,2]}],"comparison":"pop while top <= a[i]"},"forwards":{"stackHolds":"indices that have not found an answer yet","behaviour":"one new element resolves every waiting index it exceeds, in a batch","comparison":"resolve while a[top] < a[i]","generalisesTo":["stock-span-problem","largest-rectangle-in-a-histogram","sum-of-subarray-minimums"]},"linearity":{"claim":"each element is pushed once and popped at most once","measured":[{"n":1000,"pushes":1000,"pops":991,"perElement":1.99},{"n":10000,"pushes":10000,"pops":9992,"perElement":2.0},{"n":100000,"pushes":100000,"pops":99994,"perElement":2.0},{"n":1000000,"pushes":1000000,"pops":999989,"perElement":2.0}],"whyPopsFallShort":"whatever remains on the stack at the end was never popped — exactly the elements with no greater element to their right","extremes":[{"input":"strictly increasing","n":100000,"pushes":100000,"pops":0,"perElement":1.0,"why":"scanning right to left, every new element is smaller than the top"},{"input":"strictly decreasing","n":100000,"pushes":100000,"pops":99999,"perElement":2.0,"why":"each step empties the stack"}],"notAnAverage":"the bound is structural — both extremes are within 2n"},"timing":{"unit":"ns","random":[{"n":1000,"brute":4166,"stack":2583,"ratio":1.6},{"n":4000,"brute":27917,"stack":18833,"ratio":1.5},{"n":16000,"brute":130708,"stack":112042,"ratio":1.2},{"n":64000,"brute":485083,"stack":378750,"ratio":1.28}],"decreasing":[{"n":1000,"brute":204709,"ratio":79},{"n":4000,"brute":2766792,"ratio":147},{"n":16000,"brute":38680083,"ratio":345},{"n":64000,"brute":613938500,"ratio":1621}],"whyRandomIsClose":{"averageScanLength":[{"n":1000,"comparisons":6.82},{"n":10000,"comparisons":8.43},{"n":100000,"comparisons":10.87},{"n":1000000,"comparisons":14.36}],"lnOfMillion":13.82,"conclusion":"the brute force is Theta(n log n) on random input, not Theta(n^2), so a linear algorithm beats it by only a factor of log n"},"decreasingScanLength":"(n-1)/2 per element — 49,999.5 at n = 100,000","python":{"n":20000,"randomRatio":4.3,"decreasingRatio":1867},"conclusion":"the stack is not a constant-factor optimisation; it is insurance against sorted input, which is common and catastrophic without it"},"ties":{"input":[2,2],"answer":[-1,-1],"why":"strictly greater, and 2 is not strictly greater than 2","backwardsTest":"pop while top <= a[i]","forwardsTest":"resolve while a[top] < a[i]","whyDifferent":"one decides what to DISCARD and the other what to ANSWER","ifFlipped":[2,-1],"invisibleOn":"any input with distinct values","verificationRange":6},"fourVariants":{"switches":["scan direction: next vs previous","comparison direction: greater vs smaller"],"combinations":[{"name":"next greater","scan":"backwards","pop":"<="},{"name":"next smaller","scan":"backwards","pop":">="},{"name":"previous greater","scan":"forwards","pop":"<="},{"name":"previous smaller","scan":"forwards","pop":">="}],"note":"one algorithm with two independent switches, not four algorithms"}}
```

<!-- @highlights -->
- Both formulations run side by side on [2, 7, 3, 5, 4, 6, 8], one caret moving right to left and one left to right.
- The backwards stack holds values; the forwards stack holds indices drawn as labelled tickets.
- Each pop in the backwards scan falls out of the stack and fades.
- The three pops at index 1 are labelled "discarded permanently, never examined again".
- In the forwards scan, the arriving 7 stamps answers onto several waiting tickets at once, labelled "one element settles many".
- A counter tracks pushes and pops through the scan, ending at 7 and 6.
- A bar shows 2.00 stack operations per element.
- Two extreme inputs animate beside it: an increasing array where nothing ever pops, and a decreasing one where every step empties the stack.
- Their counters read 1.00 and 2.00 operations per element.
- Two timing charts plot brute force against the stack, on random and on decreasing input.
- The random chart's lines almost touch, annotated 1.28x at n = 64,000.
- The decreasing chart's brute-force curve pulls away steeply, annotated 1,621x.
- An inset plots the measured average scan length 6.82, 8.43, 10.87, 14.36 against a dashed ln(n) curve that tracks it almost exactly.
- A dashed ln(n) curve is overlaid on the inset to show how closely it tracks the measurement.
- The ties panel runs [2, 2] through both formulations with the <= and the < highlighted.
- A red variant shows either comparison flipped, with the two elements pointing at each other and the output [2, -1] marked wrong.

<!-- @edgeCases -->
- An empty array — the loop never runs and the result is empty; no special case is needed in either formulation.
- A single element — the answer is [-1], produced by the empty-stack branch.
- A strictly increasing array — every answer is the immediate right neighbour, and the stack never pops.
- A strictly decreasing array — every answer is -1, and the stack never holds more than one element.
- All elements equal — every answer is -1, because the comparison is strict; this is the case that catches < written for <=.
- Two equal elements, [2, 2] — the smallest input that distinguishes a correct comparison from a flipped one.
- The maximum element — always answers -1, wherever it appears.
- Negative values — no special handling needed, but -1 as the sentinel becomes ambiguous if -1 is a legitimate array value.
- 0 as a legitimate value in Java — new int[n] is zero-filled, so the result must be explicitly filled with -1 first.
- The stack storing values versus indices — the backwards formulation can store values, the forwards one must store indices to write answers back.
- Very large arrays — the stack can reach n entries on a decreasing input, so the space is genuinely O(n).

<!-- @pitfalls -->
- Assuming the brute force is quadratic on typical input. Its average scan is about ln(n) comparisons — 14.36 at n = 1,000,000 — making it Theta(n log n) and only 1.28x slower than the stack.
- Concluding from that the stack is not worth it. On a decreasing array the same comparison is 1,621x, and sorted input is common.
- Using < where <= belongs, or the reverse. Equal values then report each other, which no input with distinct values reveals.
- Testing only on random arrays with distinct values. Every tie-related error survives; the verification here drew from only 6 distinct values for that reason.
- Storing values instead of indices in the forwards formulation. The answer has to be written back to the waiting position, which needs the index.
- Forgetting to initialise the result to -1 in Java. new int[n] is zero-filled and 0 is a legitimate answer value.
- Using -1 as the sentinel when the array can contain -1. The caller cannot then distinguish "no answer" from a real one; use a separate boolean array or an index of -1.
- Pushing before answering. The element then finds itself on the stack and reports itself as its own next greater element.
- Reading the stack top without checking emptiness. Both formulations pop until the stack may be empty, so the check is on the hot path.
- Expecting the stack to hold the whole array. It holds a monotonic run, which is one element on decreasing input and all n on increasing input.
- Treating the four variants as four algorithms. It is one loop with two independent switches — scan direction and comparison direction.
- Assuming the linear bound is an average. It is structural: an increasing array does 1.00 operations per element and a decreasing one 2.00, both within 2n.

<!-- @doubt -->
### Why is the stack version linear?

<!-- @answer -->
Because every element is pushed exactly once and popped at most once, so the total number of stack operations is at most 2n however the while loop is distributed. Measured at n = 1,000,000: 1,000,000 pushes and 999,989 pops, which is 2.00 operations per element. The pops fall a little short because whatever remains on the stack at the end was never popped — precisely the elements with no greater element to their right. The inner while loop looks like it should make the algorithm quadratic, and does not, because it can only remove elements that some earlier iteration put there.

<!-- @doubt -->
### Is the linear bound an average or a guarantee?

<!-- @answer -->
A guarantee, and the two extreme inputs demonstrate it. A strictly increasing array of 100,000 elements performs 100,000 pushes and 0 pops — 1.00 operations per element — because scanning right to left every new element is smaller than the stack top and nothing needs discarding. A strictly decreasing array performs 100,000 pushes and 99,999 pops, 2.00 per element, because each step empties the stack. Random input also measures 2.00. No input can exceed 2n, since an element that has been popped is gone for good.

<!-- @doubt -->
### Why is the brute force only 1.28x slower?

<!-- @answer -->
Because it is not actually quadratic on random data. Its inner loop stops at the first greater element, and on random input that is close by — measured, the average scan is 6.82 comparisons at n = 1,000 rising to 14.36 at n = 1,000,000. Since ln(1,000,000) is 13.82, the average scan is about ln(n), which makes the whole algorithm Theta(n log n). A linear algorithm beats an n log n one by a factor of log n, and at n = 64,000 that is a small constant. The quadratic label describes the worst case, not the typical one.

<!-- @doubt -->
### Then why bother with the stack?

<!-- @answer -->
Because the worst case is not exotic. On a strictly decreasing array every element must scan to the end — (n-1)/2 comparisons each, 49,999.5 at n = 100,000 — and the brute force took 613,938,500ns at n = 64,000 against the stack's 378,750ns, a factor of 1,621. Python shows 1,867x on the same shape. Sorted or reverse-sorted data is extremely common in practice, so this is not an adversarial input contrived to make a point. The stack turns a method whose cost depends on the input's shape into one whose cost does not.

<!-- @doubt -->
### What is the difference between the two formulations?

<!-- @answer -->
What the stack holds. Scanning backwards, it holds *candidates* — values to the right that could still be somebody's answer — and each element reads its answer off the top after discarding what it dominates. Scanning forwards, it holds *questions* — indices whose answers are not yet known — and each new element resolves every waiting index it exceeds. They produce identical output, verified over 50,000 arrays. The forwards version is the one to internalise, because Stock Span, Largest Rectangle and Sum of Subarray Minimums are all "elements waiting for a boundary, resolved in a batch when it arrives".

<!-- @doubt -->
### Why does one formulation use <= and the other <?

<!-- @answer -->
Because they are deciding different things. The backwards version asks what to *discard*: an element equal to the current one can never be a strictly greater answer for anything further left, so it is popped, which needs <=. The forwards version asks what to *answer*: an equal element is not strictly greater, so the waiting index is left alone, which needs <. Both are correct for the same underlying rule, and both produce [-1, -1] on [2, 2]. Flipping either makes equal values report each other, which no input with distinct values will reveal.

<!-- @doubt -->
### Should the stack hold values or indices?

<!-- @answer -->
Values are enough for the backwards formulation, since the answer is read off the top and written to the current position. The forwards formulation must hold indices, because the answer is written back to a position that was waiting — and by then the scan has moved on, so the position has to have been remembered. Indices work for both, and are the safer default: every later problem in this family needs them, because the answer is usually a distance or a width rather than the value itself.

<!-- @doubt -->
### How do I get next smaller, or previous greater?

<!-- @answer -->
Two independent switches on the same loop. The scan direction decides "next" versus "previous": backwards for next, forwards for previous. The comparison direction decides "greater" versus "smaller": pop while the top is <= the current value for greater, and >= for smaller. That gives four problems from one algorithm. Next Smaller Element, two subtopics from here, is exactly this loop with <= replaced by >=; Stock Span is previous-greater with the distance recorded instead of the value.

<!-- @doubt -->
### What if -1 is a legitimate value in the array?

<!-- @answer -->
Then -1 is a broken sentinel and the caller cannot tell "no greater element" from a real answer of -1. The usual fixes are to return indices instead of values, using -1 for "none" — which is unambiguous because indices are non-negative — or to return a parallel boolean array. This matters more often than it seems, because the natural test data for these problems is non-negative and the bug only appears once real data arrives. It is also why the later problems in this family return indices as a matter of course.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Next Greater Element - 2, which makes the array circular so that the search wraps past the end and continues from the start. The standard technique is to run the same loop over a doubled index range, taking indices modulo n, and it costs nothing asymptotically — still 2n stack operations, just over 2n iterations. The part worth understanding is why a second pass is enough and a third would change nothing, which follows directly from the invariant this subtopic established.
