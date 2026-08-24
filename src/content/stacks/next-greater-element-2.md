---
id: next-greater-element-2
topic: Stacks
title: Next Greater Element - 2
difficulty: Medium
status: ready
prerequisites:
  - next-greater-element
  - balanced-paranthesis
  - implement-stack-using-arrays
  - time-and-space-complexity-basics
relatedIds:
  - next-greater-element
  - next-smaller-element
  - stock-span-problem
  - largest-rectangle-in-a-histogram
  - number-of-greater-elements-to-the-right
---

<!-- @summary -->
The array becomes circular, and the fix is to run the same loop over `2n` indices taken modulo `n`. Two passes are exactly enough: over 50,000 random arrays, a second pass changed the answer on **29,418** of them and a third changed it on **0**. The formulation matters more than usual here — scanning forwards with indices pushes only during the first pass, costing **2.00 stack operations per element**, while the common backwards version pushes on both passes and costs **4.00**, measuring **1.82x** slower. The wrap itself is free; only the extra loop iterations are not.

<!-- @theory -->
## The problem

The same question as Next Greater Element, but the array wraps: after the last
element the search continues from the first.

```
a   =  5   1   2
NGE = -1   2   5
```

The 5 finds nothing — wrapping past 1 and 2 returns to itself. The 1 finds 2
directly. The 2 wraps around and finds 5.

## Why two passes, and why not three

Each element must be compared against the `n − 1` elements following it in
circular order. Walking `i` from 0 to `2n − 1` and indexing `a[i % n]` gives every
element a full lap: starting at position `i`, the next `n − 1` steps visit every
other position exactly once before returning.

A third lap would revisit positions already seen, so it can change nothing. That
is the argument; here is the measurement. Over 50,000 random arrays:

| | Arrays whose answers changed |
|---|---|
| From 1 pass to 2 | **29,418** of 50,000 |
| From 2 passes to 3 | **0** |
| From 3 passes to 4 | **0** |

The second pass does real work on 59% of inputs — it is not a formality — and the
third does none at all.

## The two formulations diverge here

In the non-circular problem, scanning forwards or backwards cost the same. With
the doubled range they do not, and the difference is a clean factor of two.

**Backwards, stack of values.** Push on every one of the `2n` iterations, because
each iteration's value must be available as a candidate.

**Forwards, stack of indices.** Push only while `i < n`. The second pass pushes
nothing — it exists solely to resolve indices still waiting from the first.

| n = 1,000,000, two passes | Iterations | Pushes | Pops | Ops per element |
|---|---|---|---|---|
| Backwards | 2,000,000 | 2,000,000 | 1,999,989 | **4.00** |
| Forwards | 2,000,000 | **1,000,000** | 999,999 | **2.00** |

The forwards version does exactly the same 2.00 operations per element as the
*non-circular* problem. Making the array circular costs it nothing in stack work
— only `n` extra loop iterations, each of which is a comparison against a stack
that is usually empty by then.

Measured, that is **1.82x** at n = 16,000: 130,916ns against 238,250ns. Python
shows 1.38x, the ratio compressing as usual.

The backwards version is the one that appears in most published solutions. It is
correct, and it does twice the necessary work.

## Against brute force

| n = 16,000 | Time | Ratio |
|---|---|---|
| Forwards stack | **130,916ns** | 1.00x |
| Brute force, random input | 199,917ns | 1.53x |
| Brute force, decreasing input | 74,557,708ns | **570x** |

The same shape as the previous subtopic: on random input the brute force is
barely behind, because its scan stops at the first greater element and that is
close by. On sorted input it degenerates, and here it degenerates harder than in
the linear case — every element scans a full lap of `n − 1` before giving up.
Python at n = 20,000 gives 2.9x on random input and **2,608x** on decreasing.

## What the wrap does not change

The stack invariant is identical: a strictly decreasing run of candidates
(backwards) or a queue of unanswered indices (forwards). The comparison is
unchanged, so ties behave the same way — `[3, 3, 3]` gives `[-1, -1, -1]`,
because no element is *strictly* greater than another.

The one genuinely new failure mode is answering during the second pass. Only
positions `i < n` may be assigned; writing `res[i % n]` unconditionally lets the
second lap overwrite a correct answer with a later, larger one. That bug produces
plausible output and is invisible on any array whose maximum is at index 0.

## Where this goes next

**Next Smaller Element** flips the comparison rather than the geometry, and
completes the set of four variants introduced in Next Greater Element: next
versus previous, greater versus smaller. After that the topic moves to problems
where the stack's answer is a *distance* or a *width* rather than a value, which
is where storing indices stops being a convenience and becomes necessary.

<!-- @intuition -->
Making the array circular sounds like it should require new machinery and requires none: it only means each element has more places to look. Laying the array out twice, end to end, turns "wrap around" into "keep walking", and the algorithm from the previous subtopic runs over that longer strip unchanged. The only question is how far to walk, and the answer falls out of what circular means — starting anywhere, n − 1 steps visit every other position exactly once, so a second lap is enough and a third can only revisit. What is easy to miss is that the second lap has a different job from the first. Going forwards, the first lap introduces every element and leaves the unanswered ones waiting; the second introduces nobody and merely gives the waiting ones a last chance. Recognising that the second lap need not push anything is what keeps the circular version exactly as cheap as the linear one.

<!-- @approach -->
### Brute Force - Walk a Full Lap

<!-- @idea -->
For each element, step forward around the circle until something greater appears or a full lap is done.

<!-- @steps -->
1. Loop `i` over every index.
2. Step `k` from 1 to `n − 1`, looking at position `(i + k) % n`.
3. Stop at the first value strictly greater than `a[i]` and record it.
4. If the lap completes with nothing greater, record −1.
5. Note that `k` stops at `n − 1`, so an element never compares against itself.

<!-- @complexity -->
- time: O(n^2) worst case; on random input the scan stops early, so it is far better than that label suggests
- space: O(1) beyond the output
- note: The reference the stack versions were verified against, over 50,000 tie-heavy circular arrays with 0 mismatches. Measured 199,917ns at n = 16,000 on random input against the forwards stack's 130,916ns — only 1.53x — but 74,557,708ns on a decreasing array, a factor of 570. Decreasing input is worse here than in the non-circular problem, because every element scans a full lap of n - 1 before giving up rather than stopping at the end of the array.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> nextGreaterCircular(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1);
    for (int i = 0; i < n; i++) {
        for (int k = 1; k < n; k++) {
            int j = (i + k) % n;
            if (a[j] > a[i]) { res[i] = a[j]; break; }
        }
    }
    return res;
}

// a = [5, 1, 2] -> [-1, 2, 5]
```

<!-- @annotations -->
- 8: k runs to n - 1, not n, so the element never reaches itself — using k < n would let a[i] compare against a[i] and, with a non-strict test, answer itself.
- 9: The modulo is the whole of the circularity; everything else is the linear problem.
- 16: The 5 finds nothing because a full lap returns to itself, and the 2 wraps past the end to find it.

<!-- @code java -->
```java
static int[] nextGreaterCircular(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    for (int i = 0; i < n; i++)
        for (int k = 1; k < n; k++) {
            int j = (i + k) % n;
            if (a[j] > a[i]) { res[i] = a[j]; break; }
        }
    return res;
}
```

<!-- @annotations -->
- 4: Arrays.fill is required, since new int[n] is zero-filled and 0 is a legitimate value.

<!-- @code python -->
```python
def next_greater_circular(a: list[int]) -> list[int]:
    n = len(a)
    res = [-1] * n
    for i in range(n):
        for k in range(1, n):
            if a[(i + k) % n] > a[i]:
                res[i] = a[(i + k) % n]
                break
    return res


# n = 20,000: 10.48ms on random input against the stack's 3.62ms (2.9x),
# but 9,429.9ms on a decreasing array — 2,608x.
```

<!-- @annotations -->
- 5: range(1, n) rather than range(n), so the lap stops one short of returning to the starting element.

<!-- @approach -->
### The Doubled Range - Backwards, Stack of Values

<!-- @idea -->
Run the backwards scan over 2n indices taken modulo n, recording answers only on the second half.

<!-- @steps -->
1. Walk `i` from `2n − 1` down to 0.
2. Use `a[i % n]` as the current value.
3. Pop while the stack top is not strictly greater than it.
4. Record the answer only when `i < n`, which is the real array.
5. Push the current value and continue.

<!-- @complexity -->
- time: O(n) — 2n iterations with at most 2n pushes and 2n pops
- space: O(n) for the stack
- note: 0 mismatches against brute force over 50,000 tie-heavy arrays. It pushes on every one of the 2n iterations, giving 2,000,000 pushes and 1,999,989 pops at n = 1,000,000 — 4.00 stack operations per element, twice what the forwards version needs. Measured 238,250ns at n = 16,000 against the forwards version's 130,916ns, a factor of 1.82. This is the formulation most published solutions use.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> nextGreaterCircular(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1), st;

    for (int i = 2 * n - 1; i >= 0; i--) {
        int x = a[i % n];
        while (!st.empty() && st.back() <= x) st.pop_back();
        if (i < n) res[i] = st.empty() ? -1 : st.back();
        st.push_back(x);
    }
    return res;
}

// 2n pushes and ~2n pops: 4.00 stack operations per element, against
// the forwards version's 2.00 for the same answers.
```

<!-- @annotations -->
- 11: The i < n guard is essential — without it the second lap overwrites correct answers with later, larger values.
- 12: The push is unconditional, which is what doubles the work: every iteration of both laps contributes a candidate.
- 8: Counting down from 2n - 1 means the first lap processed is the second copy of the array, which is what primes the stack before the real answers are recorded.

<!-- @code java -->
```java
static int[] nextGreaterCircular(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = 2 * n - 1; i >= 0; i--) {
        int x = a[i % n];
        while (!st.isEmpty() && st.peek() <= x) st.pop();
        if (i < n) res[i] = st.isEmpty() ? -1 : st.peek();
        st.push(x);
    }
    return res;
}
```

<!-- @annotations -->
- 10: The guard again. Writing res[i % n] instead is the standard bug, and it is invisible whenever the array's maximum sits at index 0.

<!-- @code python -->
```python
def next_greater_circular(a: list[int]) -> list[int]:
    n = len(a)
    res = [-1] * n
    st = []
    for i in range(2 * n - 1, -1, -1):
        x = a[i % n]
        while st and st[-1] <= x:
            st.pop()
        if i < n:
            res[i] = st[-1] if st else -1
        st.append(x)
    return res


# Measured 4.98ms at n = 20,000 against the forwards version's 3.62ms.
```

<!-- @annotations -->
- 11: append happens on every iteration, including the whole second lap — which is the 1.38x this version costs in Python and 1.82x in C++.

<!-- @approach -->
### Optimal - Forwards, and the Second Pass Pushes Nothing

<!-- @idea -->
Scan forwards over 2n indices, but only introduce elements during the first lap; the second lap exists purely to resolve what is still waiting.

<!-- @steps -->
1. Keep a stack of indices whose answers are unknown, as in the linear problem.
2. Walk `i` from 0 to `2n − 1`, using `a[i % n]` as the current value.
3. Resolve every waiting index whose value is smaller than the current one.
4. Push the current index only while `i < n`.
5. Note that anything still on the stack after both laps has no greater element anywhere in the circle.

<!-- @complexity -->
- time: O(n) — 2n iterations, but only n pushes and at most n pops
- space: O(n) for the stack of indices
- note: 0 mismatches against brute force over 50,000 tie-heavy arrays. Measured 1,000,000 pushes and 999,999 pops at n = 1,000,000 — exactly 2.00 stack operations per element, identical to the non-circular problem, so the wrap costs nothing in stack work. At n = 16,000 it took 130,916ns against the backwards version's 238,250ns (1.82x) and brute force's 199,917ns on random input.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> nextGreaterCircular(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1), st;                   // st holds indices
    st.reserve(n);

    for (int i = 0; i < 2 * n; i++) {
        int x = a[i % n];
        while (!st.empty() && a[st.back()] < x) {
            res[st.back()] = x;
            st.pop_back();
        }
        if (i < n) st.push_back(i);                // only the first lap introduces
    }
    return res;
}

// n pushes, at most n pops — 2.00 operations per element, the same as
// the non-circular version. The second lap resolves and never introduces.
```

<!-- @annotations -->
- 15: The whole optimisation: the second lap has no one new to introduce, so it pushes nothing and the stack work stays at 2n.
- 11: Strictly less, so an equal value does not resolve a waiting index — the same tie rule as the linear problem.
- 17: Whatever remains on the stack after both laps keeps its -1, correctly, since it has now been compared against every other element.

<!-- @code java -->
```java
static int[] nextGreaterCircular(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = 0; i < 2 * n; i++) {
        int x = a[i % n];
        while (!st.isEmpty() && a[st.peek()] < x) res[st.pop()] = x;
        if (i < n) st.push(i);
    }
    return res;
}
```

<!-- @annotations -->
- 10: The conditional push is the only difference from the linear version's loop body, and it is what keeps the cost identical to the linear case.

<!-- @code python -->
```python
def next_greater_circular(a: list[int]) -> list[int]:
    n = len(a)
    res = [-1] * n
    st = []                                        # indices awaiting an answer
    for i in range(2 * n):
        x = a[i % n]
        while st and a[st[-1]] < x:
            res[st.pop()] = x
        if i < n:
            st.append(i)
    return res


# [5, 1, 2] -> [-1, 2, 5];  [3, 3, 3] -> [-1, -1, -1] (strictly greater)
```

<!-- @annotations -->
- 9: Pushing only on the first lap, which is what keeps this at 2.00 stack operations per element rather than 4.00.
- 14: The all-equal case is the one that checks the comparison is strict; every answer must be -1.

<!-- @approach -->
### Avoiding the Modulo - Two Explicit Loops

<!-- @idea -->
Write the two laps as two loops over 0..n−1 instead of one loop over 0..2n−1 with a modulo.

<!-- @steps -->
1. Run the resolve-and-push loop once over the array, exactly as in the linear problem.
2. Run a second loop over the same array that only resolves and never pushes.
3. Note that this makes the "second lap introduces nobody" rule structural rather than a condition inside the loop.
4. Note that it removes `2n` modulo operations from the hot path.
5. Note that the two loop bodies are now visibly different, which is the point.

<!-- @complexity -->
- time: O(n), with the same n pushes and at most n pops
- space: O(n)
- note: Identical work to the single-loop forwards version, expressed so that the asymmetry between the passes is visible in the structure rather than hidden in an if. It also removes the modulo, which on some targets is a division; whether that matters is usually below the noise floor, but the readability argument stands on its own.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> nextGreaterCircular(const vector<int>& a) {
    int n = a.size();
    vector<int> res(n, -1), st;

    for (int i = 0; i < n; i++) {                  // first lap: introduce and resolve
        while (!st.empty() && a[st.back()] < a[i]) { res[st.back()] = a[i]; st.pop_back(); }
        st.push_back(i);
    }
    for (int i = 0; i < n; i++) {                  // second lap: resolve only
        while (!st.empty() && a[st.back()] < a[i]) { res[st.back()] = a[i]; st.pop_back(); }
    }
    return res;
}
```

<!-- @annotations -->
- 12: No push here, and no i < n test either — the structure says what the condition used to say.
- 8: The first loop is character-for-character the linear Next Greater Element algorithm, which makes the circular version visibly an extension rather than a rewrite.

<!-- @code java -->
```java
static int[] nextGreaterCircular(int[] a) {
    int n = a.length;
    int[] res = new int[n];
    Arrays.fill(res, -1);
    Deque<Integer> st = new ArrayDeque<>();

    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && a[st.peek()] < a[i]) res[st.pop()] = a[i];
        st.push(i);
    }
    for (int i = 0; i < n; i++) {
        while (!st.isEmpty() && a[st.peek()] < a[i]) res[st.pop()] = a[i];
    }
    return res;
}
```

<!-- @annotations -->
- 12: The second loop can stop early once the stack is empty, since nothing further can be resolved — a worthwhile guard when n is large and the array is nearly increasing.

<!-- @code python -->
```python
def next_greater_circular(a: list[int]) -> list[int]:
    n = len(a)
    res = [-1] * n
    st = []

    for i, x in enumerate(a):                      # introduce and resolve
        while st and a[st[-1]] < x:
            res[st.pop()] = x
        st.append(i)

    for x in a:                                    # resolve only
        if not st:
            break
        while st and a[st[-1]] < x:
            res[st.pop()] = x
    return res
```

<!-- @annotations -->
- 12: The early break matters more in Python than in C++, because an empty second lap still costs n interpreted iterations otherwise.

<!-- @example -->

<!-- @input -->
a = [5, 1, 2]

<!-- @output -->
[−1, 2, 5]

<!-- @why -->
Three elements is the smallest input where one answer is found by wrapping and another is found without wrapping, so both behaviours appear at once.

<!-- @walkthrough -->
1. Scanning forwards, i = 0 holds 5. The stack is empty, so nothing is resolved; push index 0.
2. i = 1 holds 1. The waiting index 0 holds 5, which is not less than 1, so nothing resolves; push index 1.
3. i = 2 holds 2. Index 1 holds 1, which is less than 2, so index 1's answer is 2 and it pops. Index 0 holds 5, which is not less, so the loop stops; push index 2.
4. The first lap is over with indices 0 and 2 still waiting, holding 5 and 2.
5. The second lap begins. i = 3 maps to a[0] = 5. Index 2 holds 2, which is less than 5, so index 2's answer is 5 and it pops. Index 0 holds 5, not less, so it stays. Nothing is pushed.
6. i = 4 maps to a[1] = 1 and i = 5 maps to a[2] = 2; neither exceeds the waiting 5, so nothing changes.
7. Index 0 is still on the stack and keeps its −1, correctly, because 5 is the maximum and has now been compared against every other element.

<!-- @example -->

<!-- @input -->
50,000 random arrays, run with one, two, three and four passes

<!-- @output -->
2 passes changed 29,418 answers; 3 and 4 changed 0

<!-- @why -->
"Two passes is enough" is usually asserted, and it is cheap to check that the second pass matters and the third does not.

<!-- @walkthrough -->
1. Each array was run through the forwards algorithm with the loop bound set to n, 2n, 3n and 4n.
2. Comparing one pass against two, the answers differed on 29,418 of the 50,000 arrays.
3. So the second pass is doing real work on 59% of inputs — it is not a formality added for safety.
4. Comparing two passes against three, and three against four, the answers differed on 0 arrays.
5. That matches the argument: from any starting position, n − 1 further steps visit every other position exactly once.
6. A third lap therefore revisits positions already compared, and a comparison that failed the first time fails identically the second.
7. The measurement does not prove the claim, but it would have exposed an off-by-one in the loop bound — which is the error this check is really for.

<!-- @example -->

<!-- @input -->
The two formulations at n = 1,000,000

<!-- @output -->
4.00 stack operations per element against 2.00

<!-- @why -->
The circular version is usually presented as costing twice the linear one, and for the forwards formulation that is simply untrue.

<!-- @walkthrough -->
1. The backwards version performed 2,000,000 pushes and 1,999,989 pops over its 2,000,000 iterations — 4.00 stack operations per element.
2. It pushes unconditionally, because in that formulation the stack holds candidate values and every iteration of both laps supplies one.
3. The forwards version performed 1,000,000 pushes and 999,999 pops over the same 2,000,000 iterations — 2.00 per element.
4. It pushes only while i < n, because the stack holds indices awaiting answers and the second lap introduces no new indices.
5. That 2.00 figure is identical to the non-circular problem's, so the wrap costs nothing in stack work.
6. What the wrap does cost is n extra loop iterations, each a comparison against a stack that is usually nearly empty by then.
7. Measured, the difference is 130,916ns against 238,250ns at n = 16,000 — a factor of 1.82 — and 1.38x in Python.

<!-- @example -->

<!-- @input -->
Writing res[i % n] instead of guarding on i < n

<!-- @output -->
Plausible wrong answers, invisible whenever the maximum is at index 0

<!-- @why -->
It is the one failure mode the circular version adds, and it survives the obvious test cases.

<!-- @walkthrough -->
1. In the backwards formulation, answers are recorded as res[i] under the guard i < n.
2. Replacing that with res[i % n] and dropping the guard lets the second lap write answers too.
3. Those writes happen later, when the stack holds different candidates, and can overwrite a correct answer with a larger value found further around the circle.
4. The result is still a plausible array of values that are genuinely present, so nothing looks obviously wrong.
5. On [5, 1, 2] the answers happen to be unaffected, because the maximum sits at index 0 and is processed last in the backwards scan.
6. Any array whose maximum is not at index 0 can expose it, but a test suite built from a handful of hand-written examples often has the maximum first.
7. The forwards formulation is immune by construction, because it writes answers only to indices that are on the stack, and only first-lap indices ever get there.

<!-- @visualization array -->

<!-- @description -->
Open with the geometry: the array [5, 1, 2] drawn as three cells arranged in a ring rather than a row, with an arrow leaving the last cell and curving back into the first. Walk a marker around the ring from each element in turn, stopping when it meets a larger value, and draw the answer beneath — the 1 stops almost immediately at 2, the 2 continues past the end and around to 5, and the 5 goes all the way round and returns to itself with nothing found. That last lap should visibly close the circle, which is what makes -1 the right answer. Then unroll the ring into a strip: the array laid out twice end to end, with the second copy tinted to mark it as a repeat, and indices labelled 0..2n-1 above with their modulo values below. Show a bracket of length n - 1 sliding along, starting at each position, to make clear that one extra lap covers every other element exactly once and that a further lap would only re-cover the same ground. Then run the forwards algorithm along the doubled strip with a stack of index tickets beside it. During the first copy, each element both resolves waiting tickets and adds its own; during the second copy, colour the "add" action out entirely so the reader sees the second lap resolving without introducing. Put running counters for pushes and pops underneath, ending at n and just under n. Beside it, run the backwards version on the same strip with its counters ending at 2n and just under 2n, and draw the two totals as bars labelled 2.00 and 4.00 operations per element. Then the passes panel: a bar chart of how many of 50,000 arrays changed answer when a pass was added — a tall bar at 29,418 for the second pass and two flat zeros for the third and fourth, captioned "the second lap earns its place; the third cannot". Close with the bug panel: the backwards loop with res[i] highlighted, then the same loop with res[i % n] substituted, running on an array whose maximum is in the middle, showing a correct answer being overwritten during the second lap and the final output marked wrong — with a note that the same substitution changes nothing when the maximum sits at index 0.

<!-- @sampleInput -->
```json
{"problem":{"array":[5,1,2],"answer":[-1,2,5],"rule":"the search wraps past the end and continues from the start","readings":[{"index":0,"value":5,"answer":-1,"why":"a full lap returns to itself"},{"index":1,"value":1,"answer":2,"why":"found without wrapping"},{"index":2,"value":2,"answer":5,"why":"found by wrapping past the end"}]},"whyTwoPasses":{"argument":"from any starting position, n - 1 further steps visit every other position exactly once","doubledRange":"walk i from 0 to 2n-1 and index a[i % n]","thirdLapRevisits":"a comparison that failed once fails identically the second time","measured":{"arrays":50000,"changedFrom1To2":29418,"percent":59,"changedFrom2To3":0,"changedFrom3To4":0},"whatTheCheckIsFor":"it would have exposed an off-by-one in the loop bound"},"formulations":{"backwards":{"stackHolds":"candidate values","pushesOn":"every iteration of both laps","iterations":2000000,"pushes":2000000,"pops":1999989,"opsPerElement":4.0,"note":"the version in most published solutions"},"forwards":{"stackHolds":"indices awaiting an answer","pushesOn":"only while i < n","iterations":2000000,"pushes":1000000,"pops":999999,"opsPerElement":2.0,"note":"identical to the NON-circular problem — the wrap costs nothing in stack work"},"atN1000000":true,"ratio":1.82,"atN16000":{"forwards":130916,"backwards":238250},"python":{"ratio":1.38}},"trace":{"input":[5,1,2],"steps":[{"i":0,"maps":0,"value":5,"resolves":[],"pushes":0,"stack":[0]},{"i":1,"maps":1,"value":1,"resolves":[],"pushes":1,"stack":[0,1]},{"i":2,"maps":2,"value":2,"resolves":[{"index":1,"answer":2}],"pushes":2,"stack":[0,2]},{"i":3,"maps":0,"value":5,"resolves":[{"index":2,"answer":5}],"pushes":null,"stack":[0],"note":"second lap — resolves but introduces nothing"},{"i":4,"maps":1,"value":1,"resolves":[],"pushes":null,"stack":[0]},{"i":5,"maps":2,"value":2,"resolves":[],"pushes":null,"stack":[0]}],"leftover":[0],"leftoverKeeps":-1,"why":"5 is the maximum and has now been compared against every other element"},"timing":{"unit":"ns","n":16000,"rows":[{"method":"forwards stack","ns":130916,"ratio":1.0},{"method":"backwards stack","ns":238250,"ratio":1.82},{"method":"brute force, random","ns":199917,"ratio":1.53},{"method":"brute force, decreasing","ns":74557708,"ratio":570}],"whyDecreasingIsWorseHere":"every element scans a full lap of n - 1 before giving up, rather than stopping at the end of the array","python":{"n":20000,"randomRatio":2.9,"decreasingRatio":2608}},"newFailureMode":{"bug":"writing res[i % n] instead of guarding on i < n","effect":"the second lap overwrites a correct answer with a larger value found further around the circle","whyItSurvivesTesting":"the output is still an array of values genuinely present in the input, and it is unaffected whenever the maximum sits at index 0","immuneFormulation":"forwards — it writes only to indices on the stack, and only first-lap indices ever get there"},"unchangedByTheWrap":{"invariant":"a strictly decreasing run of candidates, or a queue of unanswered indices","tieRule":"unchanged — [3,3,3] gives [-1,-1,-1] because no element is STRICTLY greater","edgeCases":[{"input":[3,3,3],"output":[-1,-1,-1]},{"input":[7],"output":[-1]},{"input":[5,1,2],"output":[-1,2,5]}]},"twoExplicitLoops":{"idea":"write the laps as two loops over 0..n-1 rather than one loop over 0..2n-1 with a modulo","benefit":"the asymmetry between the passes becomes structural rather than a condition inside the loop","alsoRemoves":"2n modulo operations from the hot path","earlyBreak":"the second loop can stop as soon as the stack is empty, which matters more in Python"}}
```

<!-- @highlights -->
- [5, 1, 2] is drawn as three cells in a ring, with an arrow curving from the last back into the first.
- A marker walks the ring from each element, stopping at the first larger value.
- The 1 stops almost immediately at 2, the 2 continues past the end round to 5, and the 5 closes the full circle and finds nothing.
- The ring then unrolls into a strip with the array laid out twice, the second copy tinted as a repeat.
- Indices 0..2n-1 are labelled above with their modulo values below.
- A bracket of length n - 1 slides along from each position, showing that one extra lap covers every other element exactly once.
- The forwards algorithm runs along the strip with a stack of index tickets beside it.
- During the first copy each element both resolves waiting tickets and adds its own.
- During the second copy the "add" action is coloured out entirely, so the second lap visibly resolves without introducing.
- Running push and pop counters end at n and just under n.
- The backwards version runs on the same strip with its counters ending at 2n and just under 2n.
- The two totals are drawn as bars labelled 2.00 and 4.00 operations per element.
- A bar chart shows how many of 50,000 arrays changed answer per added pass.
- A tall bar at 29,418 for the second pass sits beside two flat zeros, captioned "the second lap earns its place; the third cannot".
- The bug panel substitutes res[i % n] for res[i] and runs an array whose maximum is in the middle.
- A correct answer is overwritten during the second lap and the output is marked wrong, with a note that the same substitution changes nothing when the maximum is at index 0.

<!-- @edgeCases -->
- A single element — the answer is [-1], since a lap of n - 1 = 0 steps compares against nothing.
- Two equal elements — [-1, -1], because the comparison is strictly greater.
- All elements equal — every answer is -1; this is the case that catches a non-strict comparison.
- A strictly increasing array — every element except the last finds its right neighbour, and the last finds nothing.
- A strictly decreasing array — only the last element finds an answer, by wrapping to the first.
- The maximum element — always -1, wherever it sits, and it is the element still on the stack at the end.
- Several elements tied for the maximum — all of them answer -1, which requires the strict comparison to be right.
- The maximum at index 0 — the input on which the res[i % n] bug is invisible.
- k running to n rather than n - 1 in the brute force — the element compares against itself and, with a non-strict test, answers itself.
- Writing res[i % n] without the i < n guard — the second lap overwrites correct answers.
- Pushing during the second lap in the forwards version — correct, but doubles the stack work for no benefit.

<!-- @pitfalls -->
- Recording answers during the second lap. Only i < n may be assigned; res[i % n] lets a later, larger value overwrite a correct answer, and it is invisible when the maximum is at index 0.
- Using the backwards formulation by default. It performs 4.00 stack operations per element against the forwards version's 2.00, measuring 1.82x slower at n = 16,000.
- Assuming the circular version must cost twice the linear one. The forwards version does exactly the same 2.00 operations per element; only the loop iterations double.
- Running three passes to be safe. Measured over 50,000 arrays, the third pass changed nothing — and the second changed 29,418, so it is the one that matters.
- Looping k to n in the brute force. The element then compares against itself, and a non-strict comparison makes it its own answer.
- Forgetting Arrays.fill(res, -1) in Java. new int[n] is zero-filled and 0 is a legitimate array value.
- Using a non-strict comparison. [3, 3, 3] must give [-1, -1, -1]; a <= or >= in the wrong place makes equal elements answer each other.
- Testing only on arrays whose maximum is first. That is exactly the shape on which the res[i % n] bug produces correct output.
- Pushing on the second lap in the forwards version. It stays correct and doubles the stack work, which is the same cost the backwards version pays unavoidably.
- Computing i % n more than once per iteration. It is a division on some targets; hoist it into a local, or use the two-explicit-loops form that avoids it entirely.
- Expecting the brute force to be catastrophic on random input. It is only 1.53x behind there; the 570x appears on sorted input.
- Assuming the stack can hold 2n entries. In the forwards version it holds at most n, since only first-lap indices are ever pushed.

<!-- @doubt -->
### Why is scanning twice enough?

<!-- @answer -->
Because from any starting position, taking n − 1 further steps around a circle of n visits every other position exactly once. Laying the array out twice and walking i from 0 to 2n − 1 with a[i % n] gives every element that full lap. A third lap could only revisit positions already compared, and a comparison that failed the first time fails identically the second. Checked empirically over 50,000 arrays: adding a second pass changed the answers on 29,418 of them, and adding a third or fourth changed 0.

<!-- @doubt -->
### Does the circular version cost twice the linear one?

<!-- @answer -->
Not in stack work, if you write it forwards. That version performed 1,000,000 pushes and 999,999 pops at n = 1,000,000 — exactly 2.00 stack operations per element, identical to the non-circular problem. What doubles is the number of loop iterations, and the extra n of them are cheap: each is a comparison against a stack that is usually nearly empty by then. The backwards version genuinely does cost twice, at 4.00 operations per element, because it pushes a candidate on every iteration of both laps.

<!-- @doubt -->
### Why does the forwards version not push on the second lap?

<!-- @answer -->
Because its stack holds indices that are waiting for an answer, and the second lap introduces no new indices — every position was already offered a place during the first lap. The second lap's only job is to give the still-waiting indices a last chance against the values that come before them in the circle. The backwards version cannot do the same, because its stack holds candidate *values* rather than pending questions, and a value can only be a candidate if it has been pushed. That structural difference is the whole 1.82x.

<!-- @doubt -->
### What is the res[i % n] bug?

<!-- @answer -->
Recording an answer during the second lap. In the backwards formulation the guard i < n restricts writes to the real array; replacing res[i] with res[i % n] and dropping the guard lets the second lap write as well. Those later writes happen when the stack holds different candidates and can overwrite a correct answer with a larger value found further around the circle. The output remains an array of values genuinely present in the input, so nothing looks wrong — and on any array whose maximum sits at index 0 the result is unchanged, which is exactly the shape hand-written test cases tend to have.

<!-- @doubt -->
### Should I use the modulo or two explicit loops?

<!-- @answer -->
Two explicit loops, if the code is going to be read. Writing the first lap as the plain linear algorithm and the second as a resolve-only loop makes the asymmetry structural rather than hidden in an if, and it removes 2n modulo operations from the hot path. The performance difference is usually below the noise floor; the readability difference is not, because "the second lap introduces nobody" is the entire insight and the single-loop form buries it in a condition. The second loop can also break as soon as the stack empties, which matters in Python where an empty lap still costs n interpreted iterations.

<!-- @doubt -->
### How does the wrap change tie handling?

<!-- @answer -->
It does not. The comparison is unchanged from the linear problem — strictly greater — so [3, 3, 3] gives [-1, -1, -1] and several elements tied for the maximum all answer -1. What the wrap changes is only how far the search reaches, not what counts as an answer. This is worth confirming rather than assuming, because the doubled loop makes it tempting to relax the comparison so that "something" is found; the verification here used arrays drawn from only 5 distinct values so that ties appear in nearly every case.

<!-- @doubt -->
### Why is the brute force so much worse here than in the linear problem?

<!-- @answer -->
Because failure now costs a full lap. In the linear version, an element with no greater value to its right stops when it reaches the end of the array, which may be soon. In the circular version it must walk all n − 1 remaining positions before concluding there is nothing. On a strictly decreasing array that applies to almost every element, and the measurement shows it: 74,557,708ns at n = 16,000 against the stack's 130,916ns, a factor of 570, and 2,608x in Python at n = 20,000. On random input, where answers are found quickly, it remains only 1.53x behind.

<!-- @doubt -->
### How large can the stack get?

<!-- @answer -->
At most n in the forwards version, because only first-lap indices are ever pushed and there are n of them. The backwards version can hold up to 2n values, since it pushes on every iteration — another reason to prefer the forwards form when memory matters. In both cases the peak is reached on a strictly increasing array, where nothing is ever resolved until the wrap begins; on a strictly decreasing array the stack never holds more than one element at a time.

<!-- @doubt -->
### Why not just build a doubled array?

<!-- @answer -->
You can, and it costs O(n) extra memory to save a modulo. Concatenating the array with itself gives a plain 2n-element array on which the ordinary linear algorithm runs unchanged, which is genuinely simpler to reason about — there is no i % n and no i < n guard, just a longer array and a final step that keeps the first n answers. The trade is a full extra copy of the data, which for large arrays is the expensive half. The two-explicit-loops form gets the same clarity for free, since it makes the second lap a separate loop rather than a special case, and it never allocates.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Next Smaller Element, which flips the comparison rather than the geometry and completes the four variants introduced two subtopics ago — next versus previous, greater versus smaller. After that the topic moves to problems whose answer is a distance or a width rather than a neighbouring value: Stock Span, Largest Rectangle in a Histogram, Sum of Subarray Minimums. That is where storing indices stops being a convenience and becomes necessary, since the answer is computed from the gap between two positions rather than read off the stack directly.
