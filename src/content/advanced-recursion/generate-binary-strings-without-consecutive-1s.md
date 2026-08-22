---
id: generate-binary-strings-without-consecutive-1s
topic: Advanced Recursion
title: Generate Binary Strings Without Consecutive 1s
difficulty: Medium
status: ready
prerequisites:
  - reverse-a-stack
  - learn-all-patterns-of-subsequences-theory
  - fibonacci-number
  - count-all-subsequences-with-sum-k
  - time-and-space-complexity-basics
relatedIds:
  - fibonacci-number
  - learn-all-patterns-of-subsequences-theory
  - count-all-subsequences-with-sum-k
  - generate-parentheses
---

<!-- @summary -->
The first constraint that links one choice to the next, and it changes the shape of the tree rather than just its contents: the leaf count stops being 2^n and becomes exactly F(n+2). Fibonacci, which Basic Recursion measured as the cost of a naive recursion, turns up here as the answer — and at n = 90 the count is 7,540,113,804,746,346,429, which is F(92), the same value that subtopic named as the last one fitting a 64-bit integer.

<!-- @theory -->
## The problem

Generate every binary string of length `n` containing no two adjacent `1`s.

```
n = 4  ->  0000  0001  0010  0100  0101  1000  1001  1010
```

Eight of the sixteen four-bit strings survive.

## A constraint between consecutive choices

The subsequence subtopics made n independent decisions — each element in or out,
with nothing linking them. Here the decisions are **coupled**: you can always
write a `0`, but you may only write a `1` if the previous character was not one.

```
gen(cur):
    if len(cur) == n: emit(cur); return
    place '0'                              // always legal
    if cur is empty or cur.back() == '0':  // conditional branch
        place '1'
```

One of the two branches has a guard on it. That is the whole difference from the
complete binary tree of Learn All Patterns of Subsequences, and it is enough to
change the tree's growth rate.

## The count is Fibonacci

| n | Results | F(n+2) | 2^n |
|---|---|---|---|
| 1 | 2 | 2 | 2 |
| 2 | 3 | 3 | 4 |
| 3 | 5 | 5 | 8 |
| 4 | 8 | 8 | 16 |
| 8 | 55 | 55 | 256 |
| 16 | 2,584 | 2,584 | 65,536 |
| 20 | **17,711** | **17,711** | 1,048,576 |

**Exactly F(n+2)**, matched at every n tested. The reason is a one-line argument:
a legal string of length n either ends in `0`, and the first n−1 characters are
any legal string of length n−1, or it ends in `01`, and the first n−2 are any
legal string of length n−2. That is the Fibonacci recurrence.

So the growth base is φ rather than 2. Measured, the ratio of successive counts
converges to **1.618034**.

This is the third time φ has appeared in this curriculum, and the first time as
an *answer*. Fibonacci measured it as the branching factor of a naive recursion
tree — the cost of a bad algorithm. Here the same number counts the objects that
exist.

## The call count is Fibonacci too

| n | Calls | F(n+4) − 2 | Naive calls, 2^(n+1) − 1 |
|---|---|---|---|
| 4 | 19 | 19 | 31 |
| 8 | 142 | 142 | 511 |
| 12 | 985 | 985 | 8,191 |
| 20 | **46,366** | **46,366** | **2,097,151** |

`calls = F(n+4) − 2`, exact at every n. Compare that with the naive
generate-everything-then-filter approach, which walks the full binary tree of
2^(n+1) − 1 nodes whatever the constraint says.

## What the guard is worth

The constrained version never builds a string it would have to throw away. The
saving grows fast, because it is the gap between 2^n and φ^n:

| n | 2^n | F(n+2) | Ratio |
|---|---|---|---|
| 10 | 1,024 | 144 | 7.1x |
| 20 | 1,048,576 | 17,711 | 59.2x |
| 30 | 1,073,741,824 | 2,178,309 | 492.9x |
| 40 | 1,099,511,627,776 | 267,914,296 | 4,104x |
| 50 | 1,125,899,906,842,624 | 32,951,280,099 | **34,169x** |

In wall clock, generating and filtering against generating only the legal strings:

| n | Constrained | Generate + filter | Mask walk |
|---|---|---|---|
| 10 | 7,241ns | 31,908ns | **6,615ns** |
| 15 | 62,756ns | 1,099,538ns | 185,530ns |
| 20 | 842,838ns | 33,116,673ns | 2,775,006ns |
| 22 | **1,998,754ns** | **128,978,685ns** | 9,588,327ns |

**64.5x** at n = 22. Note the mask walk, which tests `m & (m << 1)` to reject
adjacent bits: it is marginally *faster* at n = 10 and 4.8x slower by n = 22,
because it is O(2^n) regardless while the recursion is O(φ^n). The crossover is
around n = 10 to 12.

## Where to put the guard

The two placements are not equivalent:

```
if (cur.back() == '0') { place '1'; recurse; }     // refuse to make the branch
place '1'; if (legal(cur)) recurse;                 // make it, then check
```

The first never creates the illegal state. The second creates it, checks, and
backs out — which still visits the node, so the tree is the full 2^(n+1) − 1
again and only the leaves are filtered. Checking **before** descending is what
makes this O(φ^n); checking after is the naive version wearing a guard.

The same distinction will decide the cost of every backtracking problem in this
topic: prune at the branch, not at the leaf.

## If you only need the count

Generation is the expensive part, and often unnecessary. The recurrence above is
directly computable:

```
count(0) = 1, count(1) = 2, count(n) = count(n-1) + count(n-2)
```

O(n) time, O(1) space. Measured at n = 20 that is **41.7ns against 1,803,608ns**
for generating — and it reaches sizes generation never could:

```
count(50) = 32,951,280,099
count(90) = 7,540,113,804,746,346,429
```

That last figure is `F(92)` — the exact number the Fibonacci subtopic identified
as the largest Fibonacci that fits a signed 64-bit integer. The two subtopics
meet at the same constant from opposite directions.

## Python

At n = 18:

| | ns |
|---|---|
| Constrained generation | 6,539,731 |
| Generate and filter | 133,583,746 |
| Count only | **1,085** |

The generate-and-filter penalty is about 20x, roughly constant across sizes, and
counting instead of generating is worth **6,028x**.

## Where this goes next

**Generate Parentheses** is the same idea with a richer constraint: instead of
looking one character back, the legality of a closing bracket depends on how many
opening ones remain unmatched — a counter carried down the recursion rather than
a peek at the previous choice. The leaf count there is the Catalan numbers, which
is what this pattern gives when the constraint is about balance rather than
adjacency.

<!-- @intuition -->
Every position still has two options, but one of them is now conditional on what came before — you can always write a zero, and you can only write a one if the last character was a zero. That single guard is enough to change the size of the answer from two-to-the-n to a Fibonacci number, because a legal string either ends in a zero with anything legal before it, or ends in a one that must be preceded by a zero. The important habit it teaches is where to put the check. Refusing to take the illegal branch means the tree never contains those nodes at all; taking it and then rejecting the finished string means you walk the whole tree and only save yourself the printing. Both give the right answer and only one of them is faster than brute force.

<!-- @approach -->
### Brute Force - Generate Every String and Filter

<!-- @idea -->
Build all 2^n binary strings, then discard those containing adjacent ones.

<!-- @steps -->
1. At each position, place a zero and recurse, then place a one and recurse.
2. Impose no condition on either branch.
3. On reaching length n, scan the finished string for two adjacent ones.
4. Keep it only if none are found.
5. Note that every rejected string was fully built before being examined.

<!-- @complexity -->
- time: O(n · 2^n)
- space: O(n) call stack plus the output
- note: Walks the complete binary tree of 2^(n+1) − 1 nodes regardless of the constraint, so the guard saves nothing structural — only the printing. Measured 128,978,685ns at n = 22 against the constrained version's 1,998,754ns, a factor of 64.5. The gap is the difference between 2^n and φ^n and widens quickly: 7.1x of the strings survive at n = 10 and only one in 34,169 at n = 50.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

void generate(int n, string& cur, vector<string>& out) {
    if ((int)cur.size() == n) {
        for (size_t i = 1; i < cur.size(); i++)
            if (cur[i] == '1' && cur[i-1] == '1') return;   // reject at the LEAF
        out.push_back(cur);
        return;
    }
    cur.push_back('0'); generate(n, cur, out); cur.pop_back();
    cur.push_back('1'); generate(n, cur, out); cur.pop_back();
}
```

<!-- @annotations -->
- 8: Rejecting here means the string was already built in full — the entire subtree that produced it was walked.
- 13: Neither branch is guarded, which is what makes this the complete binary tree from the subsequence subtopic.
- 12: The push / recurse / pop sandwich is unchanged; only the guard is missing.

<!-- @code java -->
```java
static void generate(int n, StringBuilder cur, List<String> out) {
    if (cur.length() == n) {
        if (cur.indexOf("11") < 0) out.add(cur.toString());
        return;
    }
    cur.append('0'); generate(n, cur, out); cur.deleteCharAt(cur.length() - 1);
    cur.append('1'); generate(n, cur, out); cur.deleteCharAt(cur.length() - 1);
}
```

<!-- @annotations -->
- 3: indexOf("11") is the clearest rejection test, and it scans the whole string — an O(n) cost paid 2^n times.

<!-- @code python -->
```python
def generate(n, cur="", out=None):
    if out is None:
        out = []
    if len(cur) == n:
        if "11" not in cur:
            out.append(cur)
        return out
    generate(n, cur + "0", out)
    generate(n, cur + "1", out)
    return out


# Measured 133,583,746ns at n = 18 against the constrained version's
# 6,539,731ns — about 20x, roughly constant across sizes in Python.
```

<!-- @annotations -->
- 5: "11" not in cur is idiomatic and still O(n), performed once per leaf.
- 8: String concatenation allocates at every node, which is the by-value cost the subsequence theory subtopic measured.

<!-- @approach -->
### Optimal - Refuse the Illegal Branch

<!-- @idea -->
Only take the branch that places a one when the previous character allows it.

<!-- @steps -->
1. At each position, always place a zero and recurse.
2. Before placing a one, check whether the string is empty or ends in a zero.
3. Take that branch only if the check passes.
4. On reaching length n, record the string — no validation is needed.
5. The illegal states are never created, so they never cost anything.

<!-- @complexity -->
- time: O(n · φ^n), with exactly F(n+4) − 2 calls
- space: O(n) call stack plus the output
- note: Produces exactly F(n+2) strings, matched at every n tested, using F(n+4) − 2 calls against the naive 2^(n+1) − 1. Measured 1,998,754ns at n = 22 against generate-and-filter's 128,978,685ns, a factor of 64.5. The growth base is φ = 1.618034 rather than 2, which is where the whole saving comes from.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

void generate(int n, string& cur, vector<string>& out) {
    if ((int)cur.size() == n) { out.push_back(cur); return; }   // no check needed

    cur.push_back('0');                       // always legal
    generate(n, cur, out);
    cur.pop_back();

    if (cur.empty() || cur.back() == '0') {   // guard BEFORE descending
        cur.push_back('1');
        generate(n, cur, out);
        cur.pop_back();
    }
}
```

<!-- @annotations -->
- 6: The leaf does no validation, because an illegal string was never constructed in the first place.
- 12: cur.empty() has to come first — an empty string has no previous character, and back() on it is undefined behaviour. Checking here rather than after the push is also the entire optimisation: it removes the node instead of removing the result.
- 8: The zero branch is unconditional, which is why the recurrence has one full child and one conditional one.

<!-- @code java -->
```java
static void generate(int n, StringBuilder cur, List<String> out) {
    if (cur.length() == n) { out.add(cur.toString()); return; }

    cur.append('0');
    generate(n, cur, out);
    cur.deleteCharAt(cur.length() - 1);

    if (cur.length() == 0 || cur.charAt(cur.length() - 1) == '0') {
        cur.append('1');
        generate(n, cur, out);
        cur.deleteCharAt(cur.length() - 1);
    }
}
```

<!-- @annotations -->
- 8: The length check must precede charAt, which throws StringIndexOutOfBoundsException on an empty builder rather than being undefined.

<!-- @code python -->
```python
def generate(n, cur="", out=None):
    if out is None:
        out = []
    if len(cur) == n:
        out.append(cur)
        return out

    generate(n, cur + "0", out)
    if not cur or cur[-1] == "0":
        generate(n, cur + "1", out)
    return out


# n = 4 gives 0000 0001 0010 0100 0101 1000 1001 1010 — eight of the
# sixteen four-bit strings, which is F(6).
```

<!-- @annotations -->
- 9: not cur handles the empty case before cur[-1] is evaluated, and Python's or short-circuits so the index is never taken on an empty string.
- 8: The zero branch runs unconditionally; only the one branch is guarded.

<!-- @approach -->
### The Bitmask Walk

<!-- @idea -->
Count through every n-bit number and reject those with adjacent set bits.

<!-- @steps -->
1. Note that a binary string of length n is an n-bit number.
2. Two adjacent ones exist exactly when the number and its own left shift overlap.
3. Count from zero to 2^n − 1.
4. Skip any value where that overlap test is non-zero.
5. Render the survivors as strings.

<!-- @complexity -->
- time: O(n · 2^n), or O(2^n) if only counting
- space: O(1) beyond the output
- note: The rejection test is a single instruction — m & (m << 1) is non-zero exactly when two set bits are adjacent — which makes it very cheap per candidate but does not reduce how many candidates there are. Measured 6,615ns at n = 10, marginally faster than the recursion's 7,241ns, and 9,588,327ns at n = 22 against 1,998,754ns, so 4.8x slower. The crossover is around n = 10 to 12, and it is O(2^n) against the recursion's O(φ^n).

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

vector<string> generate(int n) {
    vector<string> out;
    for (unsigned m = 0; m < (1u << n); m++) {
        if (m & (m << 1)) continue;              // two adjacent set bits
        string s(n, '0');
        for (int i = 0; i < n; i++)
            if (m >> i & 1) s[n - 1 - i] = '1';
        out.push_back(s);
    }
    return out;
}
```

<!-- @annotations -->
- 8: m & (m << 1) is non-zero exactly when some bit and the one below it are both set — the whole constraint in one operation.
- 11: s[n - 1 - i] writes the most significant bit at index 0, so the string reads in the conventional order.
- 7: 1u << n overflows for n of 32 or more, though 2^32 candidates is already out of reach.

<!-- @code java -->
```java
static List<String> generate(int n) {
    List<String> out = new ArrayList<>();
    for (int m = 0; m < (1 << n); m++) {
        if ((m & (m << 1)) != 0) continue;
        StringBuilder s = new StringBuilder();
        for (int i = n - 1; i >= 0; i--) s.append((m >> i & 1) == 1 ? '1' : '0');
        out.add(s.toString());
    }
    return out;
}
```

<!-- @annotations -->
- 3: 1 << n is an int shift, so n must stay below 31 — at 31 the bound goes negative and the loop never runs.

<!-- @code python -->
```python
def generate(n):
    return ["".join("1" if m >> i & 1 else "0" for i in range(n - 1, -1, -1))
            for m in range(1 << n)
            if not (m & (m << 1))]


# Python's ints are arbitrary width, so there is no shift limit — but
# the loop is still O(2^n) and falls behind the recursion above n ~ 12.
```

<!-- @annotations -->
- 2: The explicit bit loop rather than format(m, f"0{n}b") — that spec renders 0 as "0" even when n is 0, so it returns ["0"] where the answer is [""].
- 4: The parentheses around the mask test are not required, since & binds tighter than not, but they make the intent obvious.

<!-- @approach -->
### Count Without Generating

<!-- @idea -->
If only the number of strings is wanted, compute the Fibonacci recurrence directly.

<!-- @steps -->
1. Observe that a legal string of length n ends either in a zero or in the pair zero-one.
2. That gives count(n) = count(n−1) + count(n−2).
3. Seed it with count(0) = 1 and count(1) = 2.
4. Iterate upward keeping only the last two values.
5. Return the final value without ever building a string.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The whole answer in two variables. Measured 41.7ns at n = 20 against 1,803,608ns to generate the same strings, and it reaches sizes generation never could — count(50) is 32,951,280,099 and count(90) is 7,540,113,804,746,346,429, which is F(92), the largest Fibonacci that fits a signed 64-bit integer. In Python it measured 6,028x faster than generating at n = 18.

<!-- @code cpp -->
```cpp
#include <cstdint>
using namespace std;

long long countStrings(int n) {
    if (n == 0) return 1;

    long long a = 1, b = 2;                 // count(0) and count(1)
    for (int i = 2; i <= n; i++) {
        long long next = a + b;
        a = b;
        b = next;
    }
    return b;
}
```

<!-- @annotations -->
- 7: a and b hold count(i-2) and count(i-1), which is the two-variable form from Fibonacci Number.
- 5: n = 0 returns 1, the empty string, which is the base case the recurrence needs to start correctly.
- 13: The answer equals F(n+2), so it overflows a signed 64-bit integer once n passes 90.

<!-- @code java -->
```java
static long countStrings(int n) {
    if (n == 0) return 1;

    long a = 1, b = 2;
    for (int i = 2; i <= n; i++) {
        long next = a + b;
        a = b;
        b = next;
    }
    return b;
}
```

<!-- @annotations -->
- 4: long, not int — the count passes the 32-bit maximum at n = 44, long before the 64-bit limit at 90.

<!-- @code python -->
```python
def count_strings(n):
    if n == 0:
        return 1
    a, b = 1, 2
    for _ in range(2, n + 1):
        a, b = b, a + b
    return b


# No overflow bound in Python, so count(998) is exact — it is F(1000),
# the same 209-digit number Fibonacci Number reported.
```

<!-- @annotations -->
- 5: The tuple assignment reads both values before writing either, so no temporary is needed.
- 10: count(n) is F(n+2), so count(998) is F(1000) — the same 209-digit number that subtopic measured.

<!-- @example -->

<!-- @input -->
n = 4

<!-- @output -->
Eight strings of the sixteen, which is F(6)

<!-- @why -->
Small enough to list in full, and large enough that the constraint removes a clear majority of the candidates.

<!-- @walkthrough -->
1. The first character is unconstrained, so both 0 and 1 are available.
2. Under the 0 branch every three-character legal string can follow, of which there are five.
3. Under the 1 branch the next character must be 0, after which every two-character legal string can follow, of which there are three.
4. Five plus three is eight, which is F(6) — and that decomposition is the Fibonacci recurrence itself.
5. Listed in generation order the results are 0000, 0001, 0010, 0100, 0101, 1000, 1001, 1010.
6. The eight rejected strings — 0011, 0110, 0111, 1011, 1100, 1101, 1110, 1111 — are never constructed at all.
7. The recursion made 19 calls, which is F(8) − 2, against 31 for walking the complete tree.

<!-- @example -->

<!-- @input -->
The number of results, for n from 1 to 20

<!-- @output -->
Exactly F(n+2), every time

<!-- @why -->
It identifies the answer rather than bounding it, and it connects this problem to a subtopic that appeared to be about something else entirely.

<!-- @walkthrough -->
1. A legal string of length n either ends in 0, or ends in 1 — and a 1 must be preceded by a 0.
2. If it ends in 0, the preceding n−1 characters form any legal string of that length.
3. If it ends in 1, the preceding character is forced to 0 and the n−2 before it form any legal string.
4. So count(n) = count(n−1) + count(n−2), which is Fibonacci's recurrence with different starting values.
5. Seeding count(0) = 1 and count(1) = 2 makes count(n) equal F(n+2).
6. Measured, that holds exactly at every n from 1 to 20 — 2, 3, 5, 8 up to 17,711.
7. Fibonacci Number measured φ as the branching factor of a wasteful recursion; here the same constant counts how many objects exist, which is a different role for the same number.

<!-- @example -->

<!-- @input -->
Guarding the branch versus rejecting the leaf

<!-- @output -->
F(n+4) − 2 calls against 2^(n+1) − 1

<!-- @why -->
Both produce the same output, and only one of them is faster than brute force — which is the habit this subtopic exists to establish.

<!-- @walkthrough -->
1. Rejecting at the leaf means every illegal string is still constructed in full before being discarded.
2. That walks the complete binary tree, which has 2^(n+1) − 1 nodes — 2,097,151 at n = 20.
3. Guarding the branch means the illegal subtree is never entered, so those nodes do not exist.
4. Measured, the constrained version makes F(n+4) − 2 calls, which is 46,366 at n = 20.
5. That is 45.2x fewer calls, and in wall clock 33,116,673ns against 842,838ns.
6. By n = 22 the timing gap is 64.5x, and it keeps widening because it is 2^n against φ^n.
7. The rule generalises to every backtracking problem that follows: prune at the branch, not at the leaf.

<!-- @example -->

<!-- @input -->
n = 90, counted rather than generated

<!-- @output -->
7,540,113,804,746,346,429 — which is F(92)

<!-- @why -->
It shows the counting form reaching sizes generation cannot approach, and it lands on a constant this curriculum has already measured for a different reason.

<!-- @walkthrough -->
1. Generating the strings is Θ(φ^n) work and produces Θ(φ^n) output, so it is unusable well before n = 50.
2. The count obeys count(n) = count(n−1) + count(n−2), which two variables and a loop compute in O(n).
3. Measured at n = 20 that is 41.7 nanoseconds against 1,803,608 to generate the same set.
4. At n = 50 the count is 32,951,280,099, already past what a 32-bit integer holds.
5. At n = 90 it is 7,540,113,804,746,346,429.
6. Since count(n) = F(n+2), that value is F(92) — which Fibonacci Number identified as the largest Fibonacci fitting a signed 64-bit integer.
7. So the two subtopics arrive at the same constant from opposite directions: there it bounded what could be computed, here it bounds what can be counted.

<!-- @visualization custom -->

<!-- @description -->
Start from the complete binary tree of the subsequence subtopic, drawn for n = 4 with all sixteen leaves, then apply the constraint as an animation: every edge that would place a 1 after a 1 fades and its entire subtree collapses away, leaving eight leaves. The collapse should happen edge by edge so the reader sees the pruning as a structural change rather than a filter, and a counter should fall from 16 to 8 alongside a second counter falling from 31 nodes to 19. Label the surviving leaves with their strings and the removed ones in grey beneath, so the eight rejected candidates are visible as things that were never built. The recurrence panel takes the same tree and splits the root: the left child, which places 0, is labelled every legal string of length 3, and the right child, which places 1 then forces 0, is labelled every legal string of length 2 — with 5 and 3 printed under them and 5 + 3 = 8 beneath that, so the Fibonacci recurrence is derived visually rather than asserted. Beside it a small table of n against results and F(n+2), the two columns identical. The growth panel plots three curves on a log axis against n: 2^n, φ^n and the measured result count, with φ^n and the measurements lying exactly on top of each other and 2^n running away above, annotated with the ratios 7.1x at n = 10 rising to 34,169x at n = 50. Then the guard-placement panel, which is the practical lesson: two identical trees side by side, one where the illegal edge is never drawn and one where it is drawn, descended and then crossed out at the leaf, with node counts F(n+4) − 2 and 2^(n+1) − 1 and the caption prune at the branch, not at the leaf. Finally a single line for the counting form: two variables sliding along a Fibonacci sequence, reaching n = 90 and stopping at 7,540,113,804,746,346,429 with a tag reading this is F(92), the last one that fits.

<!-- @sampleInput -->
```json
{"primary":{"n":4,"results":["0000","0001","0010","0100","0101","1000","1001","1010"],"count":8,"equals":"F(6)","rejected":["0011","0110","0111","1011","1100","1101","1110","1111"],"rejectedNeverBuilt":true,"calls":19,"callsFormula":"F(8) - 2","naiveCalls":31,"naiveFormula":"2^(n+1) - 1"},"theConstraint":{"rule":"a 1 may only follow a 0","unconditionalBranch":"place 0","conditionalBranch":"place 1, only if empty or previous is 0","contrastWithSubsequences":"there the n decisions were independent; here each depends on the one before"},"countIsFibonacci":{"identity":"count(n) = F(n+2)","recurrence":"count(n) = count(n-1) + count(n-2)","derivation":"a legal string ends in 0 with anything legal before it, or ends in 01 with anything legal before that","seeds":{"count0":1,"count1":2},"rows":[{"n":1,"results":2,"F":2,"twoToN":2},{"n":2,"results":3,"F":3,"twoToN":4},{"n":3,"results":5,"F":5,"twoToN":8},{"n":4,"results":8,"F":8,"twoToN":16},{"n":8,"results":55,"F":55,"twoToN":256},{"n":16,"results":2584,"F":2584,"twoToN":65536},{"n":20,"results":17711,"F":17711,"twoToN":1048576}],"growthBase":1.618034,"echoesFibonacci":"there phi was the branching factor of a wasteful recursion; here it counts the objects that exist"},"callCount":{"identity":"calls = F(n+4) - 2","rows":[{"n":4,"calls":19,"naive":31},{"n":8,"calls":142,"naive":511},{"n":12,"calls":985,"naive":8191},{"n":20,"calls":46366,"naive":2097151}],"ratioAtN20":45.2},"pruningValue":{"rows":[{"n":10,"twoToN":1024,"legal":144,"ratio":7.1},{"n":20,"twoToN":1048576,"legal":17711,"ratio":59.2},{"n":30,"twoToN":1073741824,"legal":2178309,"ratio":492.9},{"n":40,"twoToN":1099511627776,"legal":267914296,"ratio":4104},{"n":50,"twoToN":1125899906842624,"legal":32951280099,"ratio":34169}]},"guardPlacement":{"correct":"if (cur.empty() || cur.back() == '0') { place 1; recurse; }","wrong":"place 1; recurse; reject at the leaf","why":"the second still visits the node, so the tree is the full 2^(n+1)-1 and only the leaves are filtered","rule":"prune at the branch, not at the leaf","appliesTo":"every backtracking problem in this topic"},"timing":{"cpp":{"unit":"ns","rows":[{"n":10,"constrained":7241,"generateFilter":31908,"maskWalk":6615},{"n":15,"constrained":62756,"generateFilter":1099538,"maskWalk":185530},{"n":20,"constrained":842838,"generateFilter":33116673,"maskWalk":2775006},{"n":22,"constrained":1998754,"generateFilter":128978685,"maskWalk":9588327}],"filterPenaltyAtN22":64.5,"maskWalk":{"testIsOneInstruction":"m & (m << 1)","fasterAtN10":true,"slowerByN22":4.8,"crossover":"about n = 10 to 12","why":"O(2^n) regardless, against the recursion's O(phi^n)"}},"python":{"n":18,"constrained":6539731,"generateFilter":133583746,"countOnly":1085,"filterPenalty":20.4,"countingAdvantage":6028}},"countingForm":{"time":"O(n)","space":"O(1)","measuredAtN20":{"countNs":41.7,"generateNs":1803608},"reach":[{"n":50,"count":32951280099},{"n":90,"count":7540113804746346429,"note":"this is F(92) — the largest Fibonacci that fits a signed 64-bit integer, as measured in fibonacci-number"}],"pythonNote":"count(998) is F(1000), a 209-digit number"}}
```

<!-- @highlights -->
- The complete binary tree for n = 4 is drawn first, with all sixteen leaves.
- The constraint is then applied as an animation: every edge placing a 1 after a 1 fades and its subtree collapses.
- The collapse happens edge by edge, so pruning reads as a structural change rather than a filter.
- One counter falls from 16 leaves to 8, another from 31 nodes to 19.
- Surviving leaves are labelled with their strings; the eight rejected ones sit greyed beneath as things never built.
- The recurrence panel splits the root: the 0 child is labelled every legal string of length 3, the 1 child every legal string of length 2.
- 5 and 3 are printed beneath them, and 5 + 3 = 8 below that — deriving Fibonacci visually.
- A small table shows n against results and F(n+2), the two columns identical.
- A log-axis chart plots 2^n, φ^n and the measured counts.
- φ^n and the measurements lie exactly on top of each other while 2^n runs away above.
- It is annotated with ratios rising from 7.1x at n = 10 to 34,169x at n = 50.
- The guard-placement panel shows two identical trees side by side.
- In one the illegal edge is never drawn; in the other it is drawn, descended and crossed out at the leaf.
- Node counts F(n+4) − 2 and 2^(n+1) − 1 sit beneath, captioned prune at the branch, not at the leaf.
- A final line slides two variables along the Fibonacci sequence to n = 90.
- It stops at 7,540,113,804,746,346,429, tagged this is F(92), the last one that fits.

<!-- @edgeCases -->
- n = 0 — one legal string, the empty one, so the count is 1 and the recurrence needs that seed.
- n = 1 — two strings, "0" and "1", since a single 1 has nothing before it to conflict with.
- n = 2 — three strings; "11" is the first rejection and the smallest case where the constraint does anything.
- An empty prefix — cur.back() is undefined behaviour in C++ and throws in Java, so the empty test must come first.
- A string of all zeros — always legal, and it is the leftmost leaf under take-zero-first ordering.
- The all-ones string — rejected for every n above 1, and never constructed by the guarded version.
- n = 31 in Java for the mask walk — 1 << n overflows to a negative bound and the loop never runs.
- n = 44 with an int count — the number of strings passes the 32-bit maximum there.
- n = 90 with a 64-bit count — the last size that fits, because the count is F(92).
- n around 10 to 12 — where the mask walk and the recursion cross over.
- Large n with generation — Θ(φ^n) output makes it unusable well before the counting form runs out.

<!-- @pitfalls -->
- Rejecting completed strings instead of refusing branches. That still walks the full 2^(n+1) − 1 nodes and measured 64.5x slower at n = 22.
- Calling back() or charAt on an empty prefix. The empty check has to come first — it is undefined behaviour in C++ and an exception in Java.
- Guarding the zero branch as well. Zero is always legal; adding a condition there silently drops valid strings.
- Assuming the answer is 2^n. It is F(n+2), which at n = 50 is 34,169 times smaller.
- Describing the cost as exponential in base 2. The growth base is φ = 1.618034, and 2^n overstates the count by four orders of magnitude at n = 50.
- Using an int for the count. It overflows at n = 44, long before the 64-bit limit at n = 90.
- Using 1 << n with an int in Java for the mask walk. At n = 31 the bound goes negative and the loop body never executes.
- Assuming the bitmask version is faster because its test is one instruction. It is O(2^n) regardless and measured 4.8x slower by n = 22, with the crossover around n = 10 to 12.
- Generating when only the count is wanted. Two variables and a loop give the answer in O(n) — 41.7ns against 1,803,608ns at n = 20.
- Concatenating strings at every node in Python. That allocates once per node, which is the by-value cost the subsequence theory subtopic measured at (n−1)·2^n + 1 elements.
- Forgetting the pop after the recursive call. The buffer then still holds the character when the sibling branch runs, exactly as in the subsequence pattern.
- Testing only n ≤ 2. The constraint does nothing at n = 1 and only rejects one string at n = 2, so neither size distinguishes a guarded implementation from an unguarded one.

<!-- @doubt -->
### Why is the answer a Fibonacci number?

<!-- @answer -->
Because of a one-line decomposition. A legal string of length n either ends in 0, in which case the preceding n−1 characters are any legal string of that length, or it ends in 1 — and a 1 must be preceded by a 0, so the last two characters are fixed as "01" and the preceding n−2 are any legal string. That gives count(n) = count(n−1) + count(n−2), which is Fibonacci's recurrence. With count(0) = 1 and count(1) = 2 as seeds, count(n) works out to exactly F(n+2), matched at every n tested from 1 to 20. It also means the growth base is φ rather than 2, measured as 1.618034.

<!-- @doubt -->
### Where exactly should the check go?

<!-- @answer -->
Before descending, not at the leaf. Writing "if the previous character is 0, then place a 1 and recurse" means the illegal subtree is never entered — those nodes do not exist. Writing "place a 1, recurse, and reject the finished string if it is invalid" still visits every node of the complete binary tree and only saves you the output. Measured, the first makes F(n+4) − 2 calls and the second 2^(n+1) − 1, which at n = 20 is 46,366 against 2,097,151 — a factor of 45.2, and 64.5x in wall clock by n = 22. This is the habit that decides the cost of every backtracking problem later in the topic: prune at the branch, not at the leaf.

<!-- @doubt -->
### How is this different from generating subsequences?

<!-- @answer -->
The decisions are no longer independent. In Learn All Patterns of Subsequences each element was in or out with nothing linking the choices, which is what made the tree complete and the count exactly 2^n. Here one branch is conditional on the previous choice, so the tree is missing subtrees and the count falls to F(n+2). Everything else is identical — the same push, recurse, pop skeleton, the same shared buffer, the same ordering behaviour. It is worth seeing that a single guard on one branch is the whole difference between 2^n and φ^n.

<!-- @doubt -->
### Isn't Fibonacci supposed to be the bad case?

<!-- @answer -->
It was, in a different role. Fibonacci Number measured φ as the branching factor of the naive recursion — the rate at which redundant work multiplied, and something to be eliminated by memoising. Here φ counts how many objects actually exist, so it is the size of the answer rather than the cost of a mistake. The distinction matters because you cannot memoise it away: every one of those F(n+2) strings is different, so the exponential is unavoidable if you genuinely want them all. The two subtopics even meet at the same constant — count(90) is 7,540,113,804,746,346,429, which is F(92), the value Fibonacci Number identified as the largest that fits a signed 64-bit integer.

<!-- @doubt -->
### Is the bitmask version worth using?

<!-- @answer -->
Only for small n. Its rejection test is beautiful — m & (m << 1) is non-zero exactly when two set bits are adjacent, so the whole constraint is one instruction — but it still examines all 2^n candidates. Measured, it is marginally faster than the recursion at n = 10, 6,615ns against 7,241ns, because the per-candidate cost is so low. By n = 22 it is 4.8x slower, 9,588,327ns against 1,998,754ns, because the recursion visits only φ^n nodes while the mask walk visits 2^n. The crossover is around n = 10 to 12. It is also capped at n below 31 in Java by the int shift.

<!-- @doubt -->
### When should I count instead of generating?

<!-- @answer -->
Whenever the question is "how many" rather than "which ones", which is most of the time. Generating is Θ(φ^n) work producing Θ(φ^n) output and becomes unusable well before n = 50; the count is a two-variable loop in O(n) and O(1) space. Measured at n = 20 that is 41.7 nanoseconds against 1,803,608 to build the same strings, and in Python the gap was 6,028x at n = 18. It also reaches sizes generation cannot approach at all — count(50) is 32,951,280,099 and count(90) is 7,540,113,804,746,346,429. Watch the type, though: the count passes a 32-bit maximum at n = 44.

<!-- @doubt -->
### Why must the empty check come before looking at the last character?

<!-- @answer -->
Because there is no last character to look at. In C++, calling back() on an empty string is undefined behaviour — it may return garbage or crash, and it will not reliably do either. In Java, charAt on an empty builder throws StringIndexOutOfBoundsException. Writing cur.empty() || cur.back() == '0' works because || short-circuits: if the first test passes, the second is never evaluated. Python behaves the same way with not cur or cur[-1] == "0". Reversing the order compiles cleanly in every language and fails on the very first call, since the recursion starts with an empty prefix.

<!-- @doubt -->
### What sizes should I test?

<!-- @answer -->
At least n = 3, and ideally a size where the counts diverge visibly. The constraint does nothing at n = 1, where both strings are legal, and rejects exactly one string at n = 2 — so neither size distinguishes a guarded implementation from an unguarded one that filters at the end, and neither catches a guard placed on the wrong branch. At n = 3 the answer is 5 of 8, and at n = 4 it is 8 of 16, which is enough to notice a wrong count. If you are checking the pruning rather than the output, compare call counts against F(n+4) − 2 rather than timings, since at small n the difference is inside measurement noise.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Generate Parentheses, which keeps this structure and enriches the constraint. There the legality of a closing bracket does not depend on the previous character but on how many opening brackets remain unmatched — a counter carried down through the recursion rather than a peek backwards. The same prune-at-the-branch rule applies and matters more, because the illegal subtrees are larger. And the leaf count changes again: with an adjacency constraint you get Fibonacci, and with a balance constraint you get the Catalan numbers, which grow faster than φ^n but far slower than 2^n.
