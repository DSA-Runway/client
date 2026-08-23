---
id: next-smaller-element
topic: Stacks
title: Next Smaller Element
difficulty: Medium
status: ready
prerequisites:
  - next-greater-element
  - next-greater-element-2
  - balanced-paranthesis
  - implement-stack-using-arrays
relatedIds:
  - next-greater-element
  - largest-rectangle-in-a-histogram
  - sum-of-subarray-minimums
  - stock-span-problem
  - sum-of-subarray-ranges
---

<!-- @summary -->
Flipping one comparison turns Next Greater into Next Smaller, and the loop is otherwise unchanged — 0 mismatches over 50,000 tie-heavy arrays, at the same 2.00 stack operations per element. The subtopic's real content is what happens when you use it *with* previous-smaller to find each element's span, because ties then break the arithmetic: over 200,000 arrays drawn from four values, the symmetric convention failed the span identity on **70.4%** of them, overcounting by up to 105 subarrays. Making one side strict and the other non-strict failed on **0**. That asymmetry is a prerequisite for Largest Rectangle and Sum of Subarray Minimums, both of which are built on it.

<!-- @theory -->
## The problem

For each element, find the first element to its right that is strictly smaller,
or −1 if there is none.

```
a   =  4   8   5   2   9
NSE =  2   5   2  -1  -1
```

## One comparison, four problems

This is Next Greater Element with `<=` replaced by `>=`. The scan direction, the
stack discipline, the amortised argument and the operation count are all
identical — verified at 1,000,000 pushes and 999,982 pops on a million elements,
**2.00 stack operations per element**, exactly as before.

| Problem | Scan | Pop while |
|---|---|---|
| Next greater | backwards | top `<=` current |
| Next smaller | backwards | top `>=` current |
| Previous greater | forwards | top `<=` current |
| Previous smaller | forwards | top `>=` current |

Two independent switches, one loop. The worst case flips with the comparison:
Next Greater degenerates on a *decreasing* array, Next Smaller on an *increasing*
one — measured at **399x** against brute force in C++ and 2,115x in Python, while
random input gives only 1.17x and 2.7x.

If that were all, this subtopic would be a footnote to the previous one. It is
not, because of what next-smaller is *for*.

## What next-smaller is actually for

Take previous-smaller and next-smaller together. For element `i`, let `prev` be
the index of the previous smaller element and `next` the index of the next
smaller one. Then `a[i]` is the minimum of every subarray that starts after
`prev` and ends before `next` — and there are exactly

```
(i - prev) * (next - i)
```

of them. Every subarray has exactly one minimum, so summing that product over all
`i` must give the total number of subarrays:

```
sum over i of (i - prev) * (next - i)  =  n(n+1)/2
```

That identity is the foundation of Sum of Subarray Minimums, Largest Rectangle in
a Histogram and Sum of Subarray Ranges. It is also where ties destroy everything.

## Ties break the identity, and by a lot

Run the identity over 200,000 arrays of up to 9 elements drawn from only four
distinct values, so ties are everywhere:

| Convention | Identity failed on |
|---|---|
| Previous strictly smaller, next strictly smaller | **140,794** (70.4%) |
| Previous smaller-or-equal, next smaller-or-equal | **140,794** (70.4%) |
| Previous strictly smaller, next smaller-**or-equal** | **0** |

Both symmetric conventions fail, on exactly the same arrays. Only the asymmetric
one works. Python reproduces it at 70.6%, with overcounts as large as **105
subarrays** on a nine-element input.

The smallest case shows why:

```
a = [2, 2]        n(n+1)/2 = 3 subarrays

both strict:   prev = [-1, -1]   next = [2, 2]
               (0-(-1))*(2-0) + (1-(-1))*(2-1) = 2 + 2 = 4     wrong

asymmetric:    prev = [-1, -1]   next = [1, 2]
               (0-(-1))*(1-0) + (1-(-1))*(2-1) = 1 + 2 = 3     correct
```

With both sides strict, neither 2 stops at the other, so both claim the subarray
`[2, 2]` as theirs and it is counted twice. Making the right side non-strict lets
the left 2 be stopped by the right one, so each tied element owns a disjoint
range and the ranges partition the subarrays exactly.

## Why asymmetry is the fix rather than a hack

The requirement is that every subarray be attributed to exactly one element. When
several equal values are all minimal in some subarray, a rule is needed to pick
one — and "the leftmost of the tied minima" is such a rule. Strict on the left
means an equal element to the left does not stop you; non-strict on the right
means an equal element to the right does. Together they say: *your range extends
left past equals, and stops at the first equal on the right.*

Reverse it — non-strict left, strict right — and the rule becomes "the rightmost
of the tied minima", which also works. What fails is choosing the same strictness
on both sides, because then equal elements either all claim the shared subarrays
or none of them do.

## Cost

| n = 16,000 | Time | Ratio |
|---|---|---|
| Stack | **100,459ns** | 1.00x |
| Brute force, random | 117,375ns | 1.17x |
| Brute force, increasing | 40,105,292ns | **399x** |

The same lesson as Next Greater Element: on random data the brute force stops at
the first smaller element and is barely behind, and on the sorted input that is
its worst case it collapses. Only the direction of "sorted" has flipped.

## Where this goes next

**Sum of Subarray Minimums** is this identity turned into an algorithm: instead of
counting the subarrays each element dominates, multiply that count by the element
and add them up. Everything difficult about it is the tie convention established
here — the arithmetic is one line.

<!-- @intuition -->
Next Smaller is Next Greater with a comparison flipped, and on its own it teaches nothing new. What makes it worth a subtopic is that it is half of a pair. Knowing the nearest smaller element on both sides of a position tells you exactly how far that element's influence extends: it is the minimum of every subarray lying strictly between those two boundaries, and of no others. That converts a question about subarrays — of which there are quadratically many — into a question about elements, of which there are n. The whole family of later problems runs on that conversion. And it is fragile in exactly one place: when neighbouring elements are equal, "how far does my influence extend" has no single answer, because equal elements are both minimal over the ground between them. The fix is to break the tie deliberately, giving one side of the comparison strictness and the other not, so that each element owns a range no other element claims.

<!-- @approach -->
### Brute Force - Scan Right Until Something Smaller

<!-- @idea -->
For each element, walk forward until a strictly smaller value appears.

<!-- @steps -->
1. Loop `i` over every index.
2. Walk `j` forward from `i + 1`.
3. Stop at the first `a[j]` strictly smaller than `a[i]` and record it.
4. If the walk reaches the end, record −1.
5. Note that the early stop makes this fast on random data and catastrophic on increasing data.

<!-- @complexity -->
- time: O(n^2) worst case, and far better on random input where the scan stops quickly
- space: O(1) beyond the output
- note: The reference the stack version was verified against, over 50,000 tie-heavy arrays with 0 mismatches. Measured 117,375ns at n = 16,000 on random input against the stack's 100,459ns — only 1.17x — but 40,105,292ns on an increasing array, a factor of 399. Note that the worst case has flipped from the Next Greater problem: there it was a decreasing array, here it is an increasing one.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> nextSmaller(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1);
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (a[j] < a[i]) { res[i] = a[j]; break; }
    return res;
}

// a = [4, 8, 5, 2, 9] -> [2, 5, 2, -1, -1]
```

<!-- @annotations -->
- 9: Strictly smaller, so equal values do not stop the scan — which is the convention this subtopic later has to break deliberately.
- 13: The 8 and the 5 both stop at different elements, and the 2 and the 9 find nothing, so this input exercises every branch.

<!-- @code java -->
```java
static int[] nextSmaller(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    for (int i = 0; i < n; i++)
        for (int j = i + 1; j < n; j++)
            if (a[j] < a[i]) { res[i] = a[j]; break; }
    return res;
}
```

<!-- @annotations -->
- 4: Arrays.fill again, since 0 is a legitimate value and new int[n] is zero-filled.

<!-- @code python -->
```python
def next_smaller(a: list[int]) -> list[int]:
    n = len(a)
    res = [-1] * n
    for i in range(n):
        for j in range(i + 1, n):
            if a[j] < a[i]:
                res[i] = a[j]
                break
    return res


# n = 20,000: 6.47ms on random input against the stack's 2.43ms (2.7x),
# but 5,145.8ms on an increasing array — 2,115x.
```

<!-- @annotations -->
- 12: The increasing array is this problem's worst case, mirroring the decreasing array in Next Greater Element.

<!-- @approach -->
### Optimal - The Same Loop, One Comparison Flipped

<!-- @idea -->
Run the Next Greater scan with the pop condition reversed.

<!-- @steps -->
1. Walk from the last index down to the first with an empty stack.
2. Pop while the top of the stack is greater than or equal to `a[i]` — those elements can never be a smaller answer again.
3. If the stack is empty, record −1.
4. Otherwise the top is the nearest smaller element to the right.
5. Push `a[i]` and continue.

<!-- @complexity -->
- time: O(n) — n pushes and at most n pops, measured at 2.00 stack operations per element on a million elements
- space: O(n), the stack holding a strictly increasing run
- note: 0 mismatches against brute force over 50,000 arrays drawn from a range of 6. Identical to Next Greater Element except that <= becomes >=, so the stack now holds an increasing run rather than a decreasing one. Measured 100,459ns at n = 16,000, against brute force's 117,375ns on random input and 40,105,292ns on an increasing one.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> nextSmaller(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1), st;
    st.reserve(n);

    for (int i = n - 1; i >= 0; i--) {
        while (!st.empty() && st.back() >= a[i]) st.pop_back();
        res[i] = st.empty() ? -1 : st.back();
        st.push_back(a[i]);
    }
    return res;
}

// The only change from Next Greater Element is <= becoming >=.
// The stack now holds a strictly INCREASING run of the values to the right.
```

<!-- @annotations -->
- 10: >= rather than <=, and that is the entire difference from the previous subtopic's algorithm. An equal value is therefore popped, so the answer is strictly smaller — the convention that the span identity later has to override on one side.
- 17: Worth stating the flipped invariant explicitly, because it is what makes the worst case an increasing array rather than a decreasing one.

<!-- @code java -->
```java
static int[] nextSmaller(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = n - 1; i >= 0; i--) {
        while (!st.isEmpty() && st.peek() >= a[i]) st.pop();
        res[i] = st.isEmpty() ? -1 : st.peek();
        st.push(a[i]);
    }
    return res;
}
```

<!-- @annotations -->
- 7: No Arrays.fill is needed here, unlike the brute force, because every position is written during the loop.

<!-- @code python -->
```python
def next_smaller(a: list[int]) -> list[int]:
    res = [-1] * len(a)
    st = []
    for i in range(len(a) - 1, -1, -1):
        while st and st[-1] >= a[i]:
            st.pop()
        res[i] = st[-1] if st else -1
        st.append(a[i])
    return res


# 2.43ms at n = 20,000, against 6.47ms for the brute force on random
# input and 5,145.8ms on an increasing one.
```

<!-- @annotations -->
- 5: The flipped comparison. Everything else is character-for-character the Next Greater Element loop.

<!-- @approach -->
### The Pair - Spans, and Why Ties Must Be Broken

<!-- @idea -->
Previous-smaller and next-smaller together mark the range over which an element is the minimum — but only if the tie rule makes those ranges disjoint.

<!-- @steps -->
1. Compute, for each `i`, the index `prev` of the previous smaller element and `next` of the next smaller one.
2. Note that `a[i]` is the minimum of every subarray starting after `prev` and ending before `next`.
3. Count them: there are `(i − prev)` choices of start and `(next − i)` choices of end.
4. Note that every subarray has exactly one minimum, so those counts must sum to `n(n+1)/2`.
5. Make one comparison strict and the other non-strict, or equal elements claim the same subarrays and the sum is wrong.

<!-- @complexity -->
- time: O(n) for both passes together
- space: O(n) for the two index arrays and the stack
- note: Over 200,000 arrays of up to 9 elements drawn from four values, the identity failed on 140,794 with both comparisons strict and on the same 140,794 with both non-strict — 70.4% either way — and on 0 with one of each. Python reproduces 70.6%, with overcounts of up to 105 subarrays. This is the prerequisite for Sum of Subarray Minimums, Largest Rectangle in a Histogram and Sum of Subarray Ranges.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

// previous STRICTLY smaller: an equal element to the left does not stop us
vector<int> prevSmaller(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1), st;
    for (int i = 0; i < n; i++) {
        while (!st.empty() && a[st.back()] >= a[i]) st.pop_back();
        res[i] = st.empty() ? -1 : st.back();
        st.push_back(i);
    }
    return res;
}

// next smaller OR EQUAL: an equal element to the right does stop us
vector<int> nextSmallerOrEqual(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, n), st;
    for (int i = n - 1; i >= 0; i--) {
        while (!st.empty() && a[st.back()] > a[i]) st.pop_back();
        res[i] = st.empty() ? n : st.back();
        st.push_back(i);
    }
    return res;
}

// sum over i of (i - prev[i]) * (next[i] - i)  ==  n(n+1)/2, always.
```

<!-- @annotations -->
- 9: >= makes this strict: an equal element is popped, so it does not become the boundary and the range extends past it to the left.
- 20: > rather than >=, so an equal element survives and DOES become the boundary — the asymmetry is these two characters.
- 19: n rather than -1 as the sentinel, so that (next - i) is a valid width when nothing smaller exists to the right.
- 26: The invariant to test against. It held on all 200,000 tie-heavy arrays with this pairing and failed on 70.4% with either symmetric one.

<!-- @code java -->
```java
static int[] prevSmaller(int[] a) {                 // strictly smaller
    int n = a.length;
    int[] res = new int[n];
    Deque<Integer> st = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && a[st.peek()] >= a[i]) st.pop();
        res[i] = st.isEmpty() ? -1 : st.peek();
        st.push(i);
    }
    return res;
}

static int[] nextSmallerOrEqual(int[] a) {          // smaller or equal
    int n = a.length;
    int[] res = new int[n];
    Deque<Integer> st = new ArrayDeque<>();
    for (int i = n - 1; i >= 0; i--) {
        while (!st.isEmpty() && a[st.peek()] > a[i]) st.pop();
        res[i] = st.isEmpty() ? n : st.peek();
        st.push(i);
    }
    return res;
}
```

<!-- @annotations -->
- 6: The two loops differ only in >= against > and in the scan direction — which is why the bug is so easy to introduce by copy-and-paste.

<!-- @code python -->
```python
def spans(a: list[int]) -> list[tuple[int, int]]:
    n = len(a)
    prev, nxt = [-1] * n, [n] * n

    st = []                                    # previous STRICTLY smaller
    for i in range(n):
        while st and a[st[-1]] >= a[i]:
            st.pop()
        prev[i] = st[-1] if st else -1
        st.append(i)

    st = []                                    # next smaller OR EQUAL
    for i in range(n - 1, -1, -1):
        while st and a[st[-1]] > a[i]:
            st.pop()
        nxt[i] = st[-1] if st else n
        st.append(i)

    return list(zip(prev, nxt))


# Check: sum((i - prev[i]) * (nxt[i] - i)) == n*(n+1)//2 for every array.
# With both comparisons strict it fails on 70.6% of tie-heavy inputs.
```

<!-- @annotations -->
- 8: >= here and > below — writing the same operator in both loops is the bug, and it is invisible on any array with distinct values.
- 22: The identity is cheap to assert in a test and catches the mistake immediately, which is worth doing before building anything on top of these spans.

<!-- @approach -->
### The Other Two - Previous Greater and Previous Smaller

<!-- @idea -->
Scanning forwards instead of backwards gives the "previous" variants from the same loop.

<!-- @steps -->
1. Keep the same stack discipline and pop condition.
2. Walk forwards instead of backwards.
3. The stack now holds a monotonic run of the elements to the *left* of the current position.
4. The top after popping is the nearest qualifying element on the left.
5. Note that this completes the four combinations of scan direction and comparison direction.

<!-- @complexity -->
- time: O(n), with the same 2.00 stack operations per element
- space: O(n)
- note: Completing the set is worth doing once, because the later subtopics use specific combinations without re-deriving them: Stock Span is previous-greater-or-equal with the distance recorded instead of the value, and Largest Rectangle in a Histogram needs previous-smaller and next-smaller together with exactly the asymmetric tie rule above.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> previousSmaller(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1), st;
    for (int i = 0; i < n; i++) {
        while (!st.empty() && st.back() >= a[i]) st.pop_back();
        res[i] = st.empty() ? -1 : st.back();
        st.push_back(a[i]);
    }
    return res;
}

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
```

<!-- @annotations -->
- 8: Identical to next-smaller except that the loop runs forwards — the direction of the scan is the only difference.
- 19: And identical to previous-smaller except for the comparison, which is the second of the two switches.

<!-- @code java -->
```java
static int[] previousSmaller(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Deque<Integer> st = new ArrayDeque<>();
    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && st.peek() >= a[i]) st.pop();
        res[i] = st.isEmpty() ? -1 : st.peek();
        st.push(a[i]);
    }
    return res;
}
```

<!-- @annotations -->
- 6: The stack holds an increasing run of the values to the LEFT, which is the mirror of the backwards version's invariant.

<!-- @code python -->
```python
def previous_smaller(a: list[int]) -> list[int]:
    res = [-1] * len(a)
    st = []
    for i, x in enumerate(a):
        while st and st[-1] >= x:
            st.pop()
        res[i] = st[-1] if st else -1
        st.append(x)
    return res


# next greater     : backwards, pop while top <=
# next smaller     : backwards, pop while top >=
# previous greater : forwards,  pop while top <=
# previous smaller : forwards,  pop while top >=
```

<!-- @annotations -->
- 12: Four problems, two switches. Worth keeping visible, because the later subtopics select from this table rather than deriving the loop again.

<!-- @example -->

<!-- @input -->
a = [4, 8, 5, 2, 9]

<!-- @output -->
[2, 5, 2, −1, −1]

<!-- @why -->
Two elements share the same answer and two find nothing, so the stack has to hold a run and then be emptied.

<!-- @walkthrough -->
1. Scanning right to left, index 4 holds 9 with an empty stack, so the answer is -1. Push 9.
2. Index 3 holds 2. The top is 9, which is not smaller, so pop it. The stack is empty, so the answer is -1. Push 2.
3. Index 2 holds 5. The top is 2, which is smaller, so the answer is 2. Push 5, giving [2, 5] from the bottom.
4. Index 1 holds 8. The top is 5, smaller, so the answer is 5. Push 8, giving [2, 5, 8].
5. Index 0 holds 4. The top is 8, not smaller, so pop. The new top is 5, also not smaller, so pop. The next top is 2, which is smaller, so the answer is 2.
6. Two elements answered 2, and the stack held an increasing run throughout — the mirror of Next Greater Element's decreasing run.
7. The elements popped at step 5 were never examined again, which is the amortised argument unchanged from the previous subtopic.

<!-- @example -->

<!-- @input -->
a = [2, 2], with both comparisons strict

<!-- @output -->
The span sum is 4 where it must be 3

<!-- @why -->
It is the smallest input where the tie convention matters, and the error is a double count rather than a crash.

<!-- @walkthrough -->
1. There are 3 subarrays of [2, 2]: the two single elements and the whole thing.
2. With previous-strictly-smaller, neither element has a smaller element to its left, so prev is [-1, -1].
3. With next-strictly-smaller, neither has a smaller element to its right either, so next is [2, 2] using n as the sentinel.
4. The counts are (0 - (-1)) * (2 - 0) = 2 for the first element and (1 - (-1)) * (2 - 1) = 2 for the second, totalling 4.
5. The subarray [2, 2] has been claimed by both elements, because with strict comparisons on both sides neither is stopped by the other.
6. Switching the right-hand comparison to smaller-or-equal makes next = [1, 2]: the left element is now stopped by the right one.
7. The counts become 1 and 2, totalling 3 — each subarray attributed exactly once, with the rule "the leftmost of the tied minima owns it".

<!-- @example -->

<!-- @input -->
200,000 arrays of up to 9 elements drawn from four values

<!-- @output -->
70.4% failure with either symmetric convention; 0% with the asymmetric one

<!-- @why -->
The tie rule is usually presented as a detail to be careful about, and the measurement shows it is the difference between right and wrong on most inputs that contain ties.

<!-- @walkthrough -->
1. For each array the span identity was evaluated: the sum of (i - prev) * (next - i) must equal n(n+1)/2, the number of subarrays.
2. With both comparisons strict, the identity failed on 140,794 of the 200,000 arrays — 70.4%.
3. With both comparisons non-strict it failed on exactly the same 140,794 arrays.
4. That coincidence is the point: the problem is the symmetry, not the strictness. Equal elements either all claim the shared subarrays or none of them do.
5. With previous strictly smaller and next smaller-or-equal, the identity held on all 200,000.
6. Python reproduced the figures at 70.6%, with the largest overcount reaching 105 subarrays on a nine-element input.
7. Because the values were drawn from only four distinct numbers, nearly every array contained ties — on arrays of distinct values all three conventions agree, which is why this bug survives ordinary testing.

<!-- @example -->

<!-- @input -->
Brute force on random against increasing input

<!-- @output -->
1.17x and 399x — the worst case has flipped direction

<!-- @why -->
It confirms that the mirror problem has a mirror worst case, which matters when choosing test data.

<!-- @walkthrough -->
1. At n = 16,000 the stack took 100,459ns and the brute force 117,375ns on random input — a factor of only 1.17.
2. That is the same effect as in Next Greater Element: the brute force stops at the first smaller element, and on random data that is nearby.
3. On an increasing array every element must scan to the end before concluding there is nothing smaller.
4. The brute force took 40,105,292ns there, a factor of 399, and Python measured 2,115x at n = 20,000.
5. In Next Greater Element the catastrophic input was a decreasing array; here it is an increasing one.
6. So a test suite that exercises one of the pair with sorted data must use the opposite order for the other.
7. Both are common shapes in practice, which is why neither problem should be left to the brute force.

<!-- @visualization array -->

<!-- @description -->
Open with the flip, briefly: the Next Greater Element loop and the Next Smaller Element loop side by side with only the comparison character differing, highlighted. Beneath each, show its stack contents mid-scan on the same input — one a decreasing run, the other increasing — and beneath those, the input shape that ruins each: a decreasing array under Next Greater and an increasing array under Next Smaller, each annotated with its brute-force penalty, 1,621x and 399x. That establishes the mirror in a few seconds. Then move to the real content: the span. Draw the array [3, 1, 4, 1, 5] as bars. Pick the bar at index 2 and extend a horizontal band left until it hits a shorter bar and right until it hits a shorter bar, shading the region between. Show the count (i - prev) * (next - i) as a small grid of start choices by end choices, filling in the subarrays it represents. Repeat for every index, and let the shaded bands accumulate into a complete, non-overlapping tiling of a triangular grid of all n(n+1)/2 subarrays — the tiling closing perfectly is the identity made visible. Then break it: switch the input to [2, 2] and run the same construction with both comparisons strict. Now the two bands overlap on the single shared subarray, and the overlap should flash red with a counter reading 4 against a target of 3. Change the right-hand comparison to non-strict and replay: the right element's band now stops the left one, the overlap disappears, and the counter reads 3. Hold on the two characters that changed, >= and >, shown large. Close with the failure-rate panel: a bar chart of the three conventions over 200,000 tie-heavy arrays — both-strict at 140,794, both-non-strict at exactly the same 140,794, and asymmetric at 0 — with the two identical bars drawn adjacent to make the point that symmetry rather than strictness is the problem.

<!-- @sampleInput -->
```json
{"flip":{"nextGreater":{"popWhile":"top <= current","stackHolds":"a decreasing run","worstInput":"decreasing array","brutePenalty":1621},"nextSmaller":{"popWhile":"top >= current","stackHolds":"an increasing run","worstInput":"increasing array","brutePenalty":399},"onlyDifference":"one comparison character","opsPerElement":2.0,"measuredAt":{"n":1000000,"pushes":1000000,"pops":999982}},"worked":{"array":[4,8,5,2,9],"answer":[2,5,2,-1,-1],"trace":[{"i":4,"value":9,"pops":[],"answer":-1,"stack":[9]},{"i":3,"value":2,"pops":[9],"answer":-1,"stack":[2]},{"i":2,"value":5,"pops":[],"answer":2,"stack":[2,5]},{"i":1,"value":8,"pops":[],"answer":5,"stack":[2,5,8]},{"i":0,"value":4,"pops":[8,5],"answer":2,"stack":[2,4]}]},"span":{"definition":"a[i] is the minimum of every subarray starting after prev[i] and ending before next[i]","count":"(i - prev) * (next - i)","identity":"sum over i of (i - prev) * (next - i) == n(n+1)/2","why":"every subarray has exactly one minimum","foundationFor":["sum-of-subarray-minimums","largest-rectangle-in-a-histogram","sum-of-subarray-ranges"]},"tieExperiment":{"arrays":200000,"maxLength":9,"distinctValues":4,"whyNarrow":"so that nearly every array contains ties — on distinct values all three conventions agree","results":[{"convention":"previous strictly smaller, next strictly smaller","failed":140794,"percent":70.4},{"convention":"previous smaller-or-equal, next smaller-or-equal","failed":140794,"percent":70.4},{"convention":"previous strictly smaller, next smaller-OR-EQUAL","failed":0,"percent":0}],"keyObservation":"both symmetric conventions fail on exactly the same arrays — the problem is the SYMMETRY, not the strictness","python":{"failurePercent":70.6,"largestOvercount":105}},"smallestFailure":{"array":[2,2],"subarrays":3,"bothStrict":{"prev":[-1,-1],"next":[2,2],"counts":[2,2],"sum":4,"correct":false,"why":"with strict comparisons on both sides neither 2 is stopped by the other, so both claim the subarray [2, 2]"},"asymmetric":{"prev":[-1,-1],"next":[1,2],"counts":[1,2],"sum":3,"correct":true,"rule":"the leftmost of the tied minima owns the shared subarrays"}},"whyAsymmetryWorks":{"requirement":"every subarray must be attributed to exactly one element","strictLeft":"an equal element to the left does not stop you, so your range extends past it","nonStrictRight":"an equal element to the right does stop you","together":"each tied element owns a disjoint range","reversedAlsoWorks":"non-strict left with strict right gives 'the rightmost of the tied minima'","whatFails":"the same strictness on both sides — equal elements either all claim the shared subarrays or none do"},"fourVariants":[{"name":"next greater","scan":"backwards","popWhile":"top <="},{"name":"next smaller","scan":"backwards","popWhile":"top >="},{"name":"previous greater","scan":"forwards","popWhile":"top <="},{"name":"previous smaller","scan":"forwards","popWhile":"top >="}],"timing":{"unit":"ns","n":16000,"stack":100459,"bruteRandom":117375,"bruteRandomRatio":1.17,"bruteIncreasing":40105292,"bruteIncreasingRatio":399,"python":{"n":20000,"randomRatio":2.7,"increasingRatio":2115},"note":"the worst case has flipped from Next Greater Element's decreasing array to an increasing one"}}
```

<!-- @highlights -->
- The Next Greater and Next Smaller loops sit side by side with only the comparison character differing, highlighted.
- Their stack contents mid-scan are shown beneath — one a decreasing run, the other increasing.
- Beneath those, the input that ruins each: a decreasing array under Next Greater and an increasing one under Next Smaller.
- They are annotated with their brute-force penalties, 1,621x and 399x.
- The array [3, 1, 4, 1, 5] is then drawn as bars for the span construction.
- A horizontal band extends from one bar left and right until it meets a shorter bar, shading the region between.
- The count (i - prev) * (next - i) appears as a grid of start choices by end choices.
- Repeating for every index, the shaded bands accumulate into a non-overlapping tiling of all n(n+1)/2 subarrays.
- The tiling closing perfectly is the identity made visible.
- The input switches to [2, 2] with both comparisons strict, and the two bands overlap on the shared subarray.
- The overlap flashes red with a counter reading 4 against a target of 3.
- Changing the right-hand comparison to non-strict replays it: the overlap disappears and the counter reads 3.
- The two characters that changed, >= and >, are held on screen large.
- The count (i - prev) * (next - i) is shown filling a triangular grid of all subarrays as the bands accumulate.
- A bar chart shows the three conventions over 200,000 tie-heavy arrays.
- Both-strict and both-non-strict are drawn adjacent at exactly 140,794, with asymmetric at 0.

<!-- @edgeCases -->
- An empty array — the loop never runs and the result is empty.
- A single element — the answer is [-1], from the empty-stack branch.
- A strictly increasing array — every answer is -1, and this is the brute force's worst case at 399x.
- A strictly decreasing array — every answer is the immediate right neighbour, and the stack never pops.
- All elements equal — every next-smaller answer is -1, since the comparison is strict.
- Two equal elements — the smallest input where the span tie convention changes the result.
- Using n rather than -1 as the "no next smaller" sentinel — required for the span calculation, so that next - i is a valid width.
- The same strictness on both sides of the span pair — fails the identity on 70.4% of tie-heavy arrays.
- Distinct values throughout — all three tie conventions agree, which is why the bug survives ordinary testing.
- Copying the previous-smaller loop to make next-smaller — the comparison must stay and the direction must flip; changing both gives previous-greater.
- Large arrays of equal values — the stack holds one element throughout with the asymmetric rule, and n elements with the strict one.

<!-- @pitfalls -->
- Using the same strictness on both sides when computing spans. The identity fails on 70.4% of tie-heavy arrays with both strict and on exactly the same 70.4% with both non-strict.
- Testing the span calculation only on arrays of distinct values. All three conventions agree there, so the bug is invisible.
- Using -1 as the right-hand sentinel in the span calculation. It must be n, or (next - i) is not a width.
- Assuming Next Smaller is only Next Greater with a flipped sign and nothing else to learn. The pair with previous-smaller is what the later subtopics need, and the tie rule is where they break.
- Copying the Next Greater loop and changing only the direction. That gives previous-greater; the comparison must change as well.
- Testing Next Smaller with a decreasing array because that was Next Greater's worst case. The worst case has flipped: it is an increasing array, at 399x.
- Forgetting Arrays.fill(res, -1) in the Java brute force. new int[n] is zero-filled and 0 is a legitimate value.
- Recording values rather than indices when spans are needed. The width comes from the gap between positions, so the index is the answer.
- Asserting the span identity only in production code. It is a one-line test that catches the tie bug immediately, and it belongs in the test suite.
- Expecting the brute force to be obviously slow. On random input it is 1.17x behind; the 399x only appears on sorted input.
- Choosing the asymmetry arbitrarily per problem. Pick a convention — leftmost or rightmost of the tied minima — and use it consistently, since mixing them across two arrays reintroduces the overlap.
- Reading "strictly smaller" in the problem statement as settling the tie question. It settles the single-array answer and says nothing about how spans should partition.

<!-- @doubt -->
### Is this just Next Greater Element with a flipped sign?

<!-- @answer -->
The single-array version is, exactly — one comparison character, the same scan, the same 2.00 stack operations per element, verified over 50,000 tie-heavy arrays with 0 mismatches. What is new is that next-smaller is half of a pair. Combined with previous-smaller it marks the range over which each element is the minimum, which converts a question about quadratically many subarrays into a question about n elements. That conversion is the basis of Sum of Subarray Minimums, Largest Rectangle in a Histogram and Sum of Subarray Ranges, and it is fragile in exactly one place — ties.

<!-- @doubt -->
### What is the span identity?

<!-- @answer -->
For each element, let prev be the index of the previous smaller element and next the index of the next smaller one. Then a[i] is the minimum of every subarray starting after prev and ending before next, and there are (i − prev) × (next − i) of them. Since every subarray has exactly one minimum, summing that product over all i must give n(n+1)/2, the total number of subarrays. It is worth asserting in a test: it is one line, it holds for every input, and it catches the tie bug immediately.

<!-- @doubt -->
### Why do ties break it?

<!-- @answer -->
Because when several equal values are all minimal over the same stretch, "which one owns those subarrays" has no answer unless you impose one. With both comparisons strict, neither of two equal elements stops the other, so both claim the shared subarrays and the total overcounts. With both non-strict, each stops the other and the shared subarrays are claimed by neither, undercounting. Measured over 200,000 tie-heavy arrays, both symmetric conventions failed on exactly the same 140,794 — 70.4% — which shows the problem is the symmetry rather than the strictness.

<!-- @doubt -->
### Why does making one side non-strict fix it?

<!-- @answer -->
Because it imposes a tie-break. Strict on the left means an equal element to the left does not stop you, so your range extends past it; non-strict on the right means an equal element to the right does stop you. Together those say "the leftmost of several tied minima owns the ground between them", which assigns every subarray to exactly one element. On [2, 2] it turns the counts 2 and 2, totalling 4, into 1 and 2, totalling the correct 3. Reversing the asymmetry — non-strict left, strict right — gives "the rightmost owns it" and works equally well; what fails is choosing the same strictness on both sides.

<!-- @doubt -->
### How often does the wrong convention actually matter?

<!-- @answer -->
On 70.4% of arrays containing ties, measured over 200,000 arrays of up to nine elements drawn from four distinct values. Python reproduced 70.6%, with the largest overcount reaching 105 subarrays on a nine-element input — so the errors are not marginal. On arrays of distinct values all three conventions agree exactly, which is the reason this bug survives testing: randomly generated integers over a wide range almost never collide, and hand-written examples rarely include repeats deliberately.

<!-- @doubt -->
### Which sentinel should the span version use?

<!-- @answer -->
−1 on the left and n on the right, not −1 on both. The counts are (i − prev) and (next − i), so the left sentinel must be one before the array and the right sentinel one past it. Using −1 for "no next smaller" makes (next − i) negative and the product meaningless, usually producing a large wrong total rather than an obvious failure. This is a different question from the single-array version, where −1 is a perfectly good "no answer" marker because it is never used in arithmetic.

<!-- @doubt -->
### Has the worst case changed?

<!-- @answer -->
Yes, it has flipped. Next Greater Element degenerates on a decreasing array, because every element must scan to the end before concluding nothing is larger. Next Smaller degenerates on an increasing array, for the mirror reason — measured 40,105,292ns against the stack's 100,459ns at n = 16,000, a factor of 399, and 2,115x in Python. On random input the brute force is only 1.17x behind, as before. The practical consequence is that a test suite exercising one of the pair with sorted data must use the opposite order for the other.

<!-- @doubt -->
### How do I remember the four variants?

<!-- @answer -->
Two independent switches on one loop. The scan direction chooses next versus previous — backwards for next, forwards for previous. The comparison direction chooses greater versus smaller — pop while the top is <= the current value for greater, and >= for smaller. That gives four problems from one algorithm, and the later subtopics select from the table rather than re-deriving it: Stock Span is previous-greater with the distance recorded, and Largest Rectangle needs previous-smaller and next-smaller together with the asymmetric tie rule.

<!-- @doubt -->
### Should I store values or indices?

<!-- @answer -->
Indices, whenever spans are involved. The single-array answer is a value, so a stack of values is enough for Next Smaller on its own. But the span calculation needs (i − prev) and (next − i), which are distances between positions — so the answer has to be an index, and the stack has to hold indices to produce one. Since every subsequent subtopic in this family computes a width or a distance, storing indices is the safer default even when the immediate problem does not require it.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Sum of Subarray Minimums, which is the span identity turned into an algorithm: rather than counting how many subarrays each element dominates, multiply that count by the element's value and add them up. The arithmetic is a single line, and everything genuinely difficult about the problem is the tie convention established here — which is why it is worth getting right in the abstract before there is a running total to hide the error in.
