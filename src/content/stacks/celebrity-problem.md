---
id: celebrity-problem
topic: Stacks
title: Celebrity Problem
difficulty: Hard
status: ready
prerequisites:
  - implement-stack-using-arrays
  - stock-span-problem
  - next-greater-element
  - time-and-space-complexity-basics
relatedIds:
  - stock-span-problem
  - implement-stack-using-arrays
  - next-greater-element
  - largest-rectangle-in-a-histogram
  - implement-min-stack
---

<!-- @summary -->
The last subtopic in the topic, and the one where the stack is a red herring. Counting `knows()` calls rather than array operations — the right metric when each call is an API request — the stack elimination and a single-variable sweep make **exactly the same number of queries at every size measured**: 27, 147, 297, 1497, 2997, precisely `3n - 3`. The stack adds O(n) space and 1.35x wall-clock over the sweep and buys nothing. Two other results: skipping the verification pass is wrong on **40.18%** of matrices, and the O(n^2) brute force actually *beats* the elimination methods when the celebrity happens to sit early in the ordering — 1,998 queries against 2,997 at n = 1,000.

<!-- @theory -->
## The problem

Among `n` people, a celebrity is someone who is known by **everyone else** and
knows **nobody**. There is at most one. The only thing you may ask is
`knows(a, b)`, which is a single call. Find the celebrity, or report that there
is none.

```
        knows  0  1  2  3
             0 -  1  1  0
             1 0  -  1  0
             2 0  0  -  0
             3 0  1  1  -

person 2 knows nobody and is known by 0, 1 and 3   ->   celebrity is 2
```

## The cost metric is the query count

Every other problem in this topic counted array operations. Here the natural
statement is different: `knows(a, b)` is presented as an oracle, and in the
setting the problem models — a directory service, a graph database, a rate-limited
API — a call is far more expensive than anything else in the algorithm. So the
number to minimise is the number of `knows()` calls, and everything below is
measured that way.

That also changes what "O(n^2)" means. Reading the whole `n x n` matrix is
`n^2 - n` queries. At n = 1,000 that is 999,000 calls against the best method's
2,997 — a factor of 333, and if each call is a network round trip the difference
is between milliseconds and minutes.

## One query eliminates one person, permanently

This is the entire insight, and it takes one line.

```
if knows(a, b):   a is not the celebrity   (a celebrity knows nobody)
else:             b is not the celebrity   (everyone knows a celebrity)
```

Either way, one call removes one candidate for good. `n - 1` calls therefore
reduce `n` candidates to one. That survivor is the **only possible** celebrity —
but it is not yet known to be one, because elimination only ever proved things
about the people it discarded.

## Verification is not optional

The elimination gives a candidate that has never been checked in its own right.
Ask directly: does it know anyone, and does everyone know it? That is
`2(n - 1)` further calls, for a total of

```
(n - 1) + 2(n - 1)  =  3n - 3
```

Skipping it is the mistake that matters. Measured over 30,000 matrices — half
constructed with a celebrity, half random — eliminating without verifying
returns a wrong answer on **40.18%** of them (40.43% in an independent Python
check). The reason is that the elimination always leaves *someone* standing,
even when no celebrity exists at all, so the algorithm confidently names a
person who fails both tests.

The good news is that when there is no celebrity, verification usually finds out
almost immediately: measured over random matrices at n = 10, 100 and 1,000, it
bailed after an average of **2 queries** in every case. The full `2(n - 1)` is
paid only when the answer is yes.

## Where the stack comes in, and why it does not matter

The classic presentation pushes all `n` people onto a stack, then repeatedly pops
two, asks one question, and pushes back the survivor. After `n - 1` questions one
person remains. It is a correct and vivid way to schedule the eliminations.

It is also exactly the same algorithm as keeping a single variable:

```
candidate = 0
for i in 1 .. n-1:
    if knows(candidate, i):
        candidate = i
```

Both perform `n - 1` eliminations, one query each. Measured over 200 random
matrices per size, with a celebrity present:

```
    n      brute   degree count   stack elim     sweep     3n - 3
   10         26             90           27        27         27
   50        146          2,450          147       147        147
  100        295          9,900          297       297        297
  500      1,566        249,500        1,497     1,497      1,497
1,000      3,130        999,000        2,997     2,997      2,997
```

The stack column and the sweep column are identical at every size, and both
equal `3n - 3` exactly. The stack does not save a single query. What it costs is
`O(n)` space instead of `O(1)`, and — when `knows()` is a plain array read —
1.35x the wall clock at n = 2,000 (21,459 ns against 15,500 ns), which Python
reproduces at 1.30x (0.56 ms against 0.43 ms).

So the closing subtopic of the Stacks topic is one where the honest advice is not
to use a stack. The elimination *idea* is the content; the stack is one of two
equally good ways to schedule it, and the other one needs a single integer.

## The brute force is not simply worse

The obvious approach — test each person against everyone until one passes —
is `O(n^2)` in the worst case, and the measured numbers refuse to be simple.

On random matrices it is competitive, and sometimes better:

```
celebrity at index (n = 1,000)     brute queries     sweep queries
                    0                      1,998             2,997
                  250                      2,504             2,997
                  500                      2,970             2,997
                  750                      3,455             2,997
                  999                      3,913             2,997
```

When the celebrity sits early the brute force finds it before doing much work
and wins outright — 1,998 against 2,997. A non-celebrity is usually rejected
after one or two queries, so the scan is cheap until it reaches the answer.

Its quadratic behaviour needs a structure that keeps candidates alive. Make
person `i` know person `j` exactly when `i < j`; then person `n - 1` knows
nobody and is known by everyone, so the celebrity is last, and every earlier
candidate survives a long prefix of checks before failing:

```
    n      brute queries      sweep      ratio
   10                 99         27       3.7x
  100              9,999        297      33.7x
1,000            999,999      2,997     333.7x
2,000          3,999,999      5,997     667.0x
```

This is the third subtopic in a row with the same hazard shape: a cost that
depends on the *arrangement* of the data rather than its size, invisible to a
random benchmark. Trapping Rainwater's two-pointer branch needed a symmetric
hill. Maximum Rectangles' height rebuild needed a dense matrix. Stock Span's
backward walk needed ties or a rising trend. Here the brute force needs the
celebrity to be last in a transitively ordered graph.

## How much slack is left in 3n - 3

The `3n - 3` calls are not all distinct. Elimination asks `knows(candidate, i)`
for various `i`, and verification asks many of those same pairs again. Caching
answers and counting only distinct pairs:

```
    n     plain    memoised     saved
   10        27          22     19.6%
  100       297         255     14.0%
  500     1,497       1,229     17.9%
1,000     2,997       2,509     16.3%
```

A cache removes about one query in six, bringing the cost to roughly `2.5n`
rather than `3n`. Whether that is worth a hash table depends entirely on what a
call costs: pointless when `knows()` is an array read, clearly worth it when it
is a network request. The cache is also the only change here that reduces the
query count at all — the algorithm itself is already down to a single pass plus
a verification.

## What to write

The single-variable sweep. It matches the stack's query count exactly, uses
`O(1)` space, is faster in both languages measured, and is four lines. Add
memoisation only when a query is expensive enough to pay for the table. Keep the
verification pass under all circumstances.

<!-- @intuition -->
One `knows()` call always eliminates somebody: if `a` knows `b` then `a` is not the celebrity, and if not then `b` is not. So `n - 1` calls leave exactly one candidate — who has still never been checked, which is why the `2(n - 1)` verification pass is mandatory rather than defensive. The stack is a vivid way to schedule those eliminations and, measured, an exactly equivalent one: identical query counts at every size, with O(n) space and 1.35x the wall clock.

<!-- @approach -->
### Brute force — test every candidate against everyone

<!-- @idea -->
Apply the definition. For each person, ask whether they know anyone and whether everyone knows them, bailing as soon as either fails. Correct by construction, and its cost depends far more on where the celebrity sits than on `n`.

<!-- @steps -->
```
1. For each candidate i:
2.   For each other person j: if knows(i, j) or not knows(j, i), reject i.
3.   If no j rejected i, return i.
4. If every candidate was rejected, return -1.
```

<!-- @complexity -->
- time: O(n^2) queries worst case, but O(n) on random matrices where non-celebrities are rejected in one or two questions
- space: O(1)
- note: On random matrices it is competitive and sometimes better — measured 1,998 queries at n = 1,000 when the celebrity sits at index 0, against the elimination methods' fixed 2,997, rising to 3,913 when the celebrity is last. Its quadratic case needs a transitively ordered graph: with `knows(i, j)` true exactly when `i < j`, it takes 999,999 queries at n = 1,000 and 3,999,999 at n = 2,000, ratios of 333.7x and 667.0x. Used as the reference for 30,000 randomised cross-checks — 0 mismatches.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool knows(int a, int b);            // the oracle; every call is the unit of cost

int findCelebrity(int n) {
    for (int i = 0; i < n; i++) {
        bool ok = true;
        for (int j = 0; j < n && ok; j++) {
            if (j == i) continue;
            if (knows(i, j) || !knows(j, i)) ok = false;   // bails on the first failure
        }
        if (ok) return i;
    }
    return -1;
}
```

<!-- @annotations -->
- 11: The `||` short-circuits, so a person who knows someone costs one query rather than two — this is why the scan is cheap on random matrices and why its quadratic case needs candidates that survive long prefixes.
- 10: `j == i` must be skipped explicitly. `knows(i, i)` is undefined by the problem and asking it wastes a query at best.
- 15: Returning -1 rather than throwing, because "no celebrity" is a legitimate answer here and not an error — roughly half of random matrices have none.

<!-- @code java -->
```java
// boolean knows(int a, int b) is supplied by the judge

static int findCelebrity(int n) {
    for (int i = 0; i < n; i++) {
        boolean ok = true;
        for (int j = 0; j < n && ok; j++) {
            if (j == i) continue;
            if (knows(i, j) || !knows(j, i)) ok = false;
        }
        if (ok) return i;
    }
    return -1;
}
```

<!-- @annotations -->
- 6: The `ok` flag in the loop condition rather than a `break` keeps the early exit visible in one place; either is fine, but mixing the two is how a stray extra query gets added.
- 4: The outer loop is over candidates and the inner over witnesses. Swapping them gives the degree-counting approach below, which cannot bail early at all.
- 12: A single return point for success and one for failure; with an oracle-based cost model it is worth being able to count the query sites by eye.

<!-- @code python -->
```python
def find_celebrity(n: int) -> int:
    for i in range(n):
        ok = True
        for j in range(n):
            if j == i:
                continue
            if knows(i, j) or not knows(j, i):
                ok = False
                break
        if ok:
            return i
    return -1
```

<!-- @annotations -->
- 7: `or` short-circuits in Python exactly as `||` does in C++, so the second call is skipped whenever the first already rejects the candidate.
- 9: The `break` exits the inner loop only; a `return -1` here would abandon the remaining candidates and is a common transcription slip.
- 2: This version was the cross-checking reference for 20,000 Python matrices, against which the elimination methods returned 0 mismatches.

<!-- @approach -->
### Degree counting — read the whole relation

<!-- @idea -->
A celebrity is exactly a person with out-degree 0 and in-degree `n - 1`. Ask every pair once, tally both degrees, and look for that signature. Simple, obviously correct, and the most expensive thing you can do under an oracle cost model.

<!-- @steps -->
```
1. For every ordered pair (i, j) with i != j, call knows(i, j).
2. Increment outdegree[i] and indegree[j] when it is true.
3. Return the i with outdegree 0 and indegree n - 1, or -1.
```

<!-- @complexity -->
- time: exactly n^2 - n queries, with no early exit possible
- space: O(n) for the two degree arrays
- note: Measured 999,000 queries at n = 1,000 against the elimination methods' 2,997 — a factor of 333. If a query is an array read that is a few milliseconds; if it is a network round trip it is the difference between a fraction of a second and several minutes. Included because it is the approach that looks harmless when "O(n^2)" is read as a time bound rather than as a call count.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool knows(int a, int b);

int findCelebrity(int n) {
    vector<int> outd(n, 0), ind(n, 0);

    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++) {
            if (i == j) continue;
            if (knows(i, j)) { outd[i]++; ind[j]++; }    // n^2 - n calls, unconditionally
        }

    for (int i = 0; i < n; i++)
        if (outd[i] == 0 && ind[i] == n - 1) return i;
    return -1;
}
```

<!-- @annotations -->
- 12: Every pair is asked whether or not the answer can still matter. There is no branch that can skip a call, which is exactly what makes this the worst approach under an oracle cost model.
- 16: `ind[i] == n - 1`, not `== n` — a person is not counted as knowing themselves, so the maximum in-degree is one less than the population.
- 7: Two O(n) arrays, which is more space than the sweep needs and still far cheaper than the query count that fills them.

<!-- @code java -->
```java
// boolean knows(int a, int b) is supplied by the judge

static int findCelebrity(int n) {
    int[] outd = new int[n], ind = new int[n];

    for (int i = 0; i < n; i++)
        for (int j = 0; j < n; j++) {
            if (i == j) continue;
            if (knows(i, j)) { outd[i]++; ind[j]++; }
        }

    for (int i = 0; i < n; i++)
        if (outd[i] == 0 && ind[i] == n - 1) return i;
    return -1;
}
```

<!-- @annotations -->
- 4: new int[n] zero-fills both arrays, which is the required starting state for a tally.
- 9: One call per ordered pair, so the loop body runs n^2 - n times — at n = 1,000 that is 999,000 oracle calls before any conclusion is drawn.
- 13: The scan for the signature is O(n) and free; all the cost was spent above it.

<!-- @code python -->
```python
def find_celebrity(n: int) -> int:
    outd = [0] * n
    ind = [0] * n

    for i in range(n):
        for j in range(n):
            if i == j:
                continue
            if knows(i, j):
                outd[i] += 1
                ind[j] += 1

    for i in range(n):
        if outd[i] == 0 and ind[i] == n - 1:
            return i
    return -1
```

<!-- @annotations -->
- 9: The unconditional call is the whole problem with this approach — no arrangement of the input can make it ask fewer questions.
- 14: `ind[i] == n - 1` again; writing `n` here silently makes the function return -1 on every input, which is a failure mode that looks like "no celebrity exists" rather than a bug.
- 2: Two O(n) tallies rather than one pass with early exit — the structure that makes this simple is exactly the structure that makes it expensive.

<!-- @approach -->
### Stack elimination — the classic presentation

<!-- @idea -->
Push everyone onto a stack. Pop two, ask one question, and push back whichever of the two survives. After `n - 1` questions a single person remains, and that person is the only possible celebrity — then verify them directly.

<!-- @steps -->
```
1. Push 0 .. n-1 onto a stack.
2. While more than one remains: pop a and b; push b if knows(a, b), else push a.
3. The survivor is the only candidate. Verify it with 2(n-1) further calls.
4. Return it if verification passes, otherwise -1.
```

<!-- @complexity -->
- time: exactly 3n - 3 queries — (n-1) eliminations plus 2(n-1) verifications
- space: O(n) for the stack
- note: Measured 27, 147, 297, 1497 and 2997 queries at n = 10, 50, 100, 500 and 1000 — identical to the single-variable sweep below at every size. Since the query counts match exactly, the stack's O(n) space is pure overhead: when `knows()` is a plain array read it also measures 1.35x the sweep's wall clock at n = 2,000 (21,459ns against 15,500ns), and 1.30x in Python.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool knows(int a, int b);

int findCelebrity(int n) {
    vector<int> st;
    for (int i = 0; i < n; i++) st.push_back(i);

    while (st.size() > 1) {                    // n - 1 iterations, one query each
        int a = st.back(); st.pop_back();
        int b = st.back(); st.pop_back();
        st.push_back(knows(a, b) ? b : a);     // the loser is gone for good
    }

    int c = st.back();
    for (int i = 0; i < n; i++) {              // verification: 2(n - 1) queries
        if (i == c) continue;
        if (knows(c, i) || !knows(i, c)) return -1;
    }
    return c;
}
```

<!-- @annotations -->
- 13: One query removes one person permanently: if a knows b then a cannot be the celebrity, and if not then b cannot. Which of the two survives is decided by that single answer.
- 10: Two pops and one push per iteration, so the stack shrinks by one each time — exactly n - 1 iterations and n - 1 queries, the same count the single-variable sweep achieves with no container.
- 17: This loop is not optional. The survivor was never itself tested; elimination only ever proved things about the people it discarded. Skipping it is wrong on 40.18% of matrices.
- 19: The `||` short-circuits, which is why a matrix with no celebrity usually bails after about 2 verification queries rather than the full 2(n - 1).
- 7: The O(n) stack is the entire difference from the next approach, and the measurements say it buys nothing.

<!-- @code java -->
```java
// boolean knows(int a, int b) is supplied by the judge

static int findCelebrity(int n) {
    int[] st = new int[n];                     // manual stack: no boxing
    int top = -1;
    for (int i = 0; i < n; i++) st[++top] = i;

    while (top > 0) {
        int a = st[top--];
        int b = st[top--];
        st[++top] = knows(a, b) ? b : a;
    }

    int c = st[0];
    for (int i = 0; i < n; i++) {
        if (i == c) continue;
        if (knows(c, i) || !knows(i, c)) return -1;
    }
    return c;
}
```

<!-- @annotations -->
- 4: An int[] with an explicit top rather than a Deque<Integer>, which would box every person index for no benefit.
- 8: `top > 0` means "more than one element remains", since top is the index of the last element rather than a count — writing `top >= 0` here loops forever on the final survivor.
- 14: st[0] rather than st[top], which are the same slot at this point; naming the constant makes it obvious that exactly one candidate is left.

<!-- @code python -->
```python
def find_celebrity(n: int) -> int:
    st = list(range(n))

    while len(st) > 1:
        a = st.pop()
        b = st.pop()
        st.append(b if knows(a, b) else a)

    c = st[0]
    for i in range(n):
        if i == c:
            continue
        if knows(c, i) or not knows(i, c):
            return -1
    return c
```

<!-- @annotations -->
- 7: `b if knows(a, b) else a` reads as the elimination rule directly: a knowing b disqualifies a, so b survives.
- 2: list(range(n)) allocates the whole population up front — measured 0.56ms at n = 2,000 against the sweep's 0.43ms, for exactly the same 5,997 queries.
- 13: The verification is identical in every version here, because it is the part that actually establishes the answer.

<!-- @approach -->
### Single-variable sweep — the same algorithm without the container

<!-- @idea -->
Hold the current candidate in one integer. Walk through the others; whenever the candidate knows the next person, the candidate is disqualified and that person takes over. After `n - 1` comparisons the survivor is the same one the stack would have produced — then verify it the same way.

<!-- @steps -->
```
1. candidate = 0.
2. For i = 1 .. n-1: if knows(candidate, i), candidate = i.
3. Verify the candidate with 2(n-1) further calls.
4. Return it if verification passes, otherwise -1.
```

<!-- @complexity -->
- time: exactly 3n - 3 queries — identical to the stack version at every size measured
- space: O(1) — a single integer
- note: 27, 147, 297, 1497 and 2997 queries at n = 10, 50, 100, 500 and 1000, matching the stack exactly, and 15,500ns against the stack's 21,459ns at n = 2,000 when `knows()` is an array read. Verification bails after about 2 queries when no celebrity exists, so the `3n - 3` is a yes-answer cost. Memoising the calls removes 14% to 20% of them — about one in six — bringing the total to roughly 2.5n, which is worth a hash table only when a query is expensive.

<!-- @code cpp -->
```cpp
bool knows(int a, int b);

int findCelebrity(int n) {
    int c = 0;
    for (int i = 1; i < n; i++)
        if (knows(c, i)) c = i;                // c knew someone, so i takes over

    for (int i = 0; i < n; i++) {              // verification is still mandatory
        if (i == c) continue;
        if (knows(c, i) || !knows(i, c)) return -1;
    }
    return c;
}
```

<!-- @annotations -->
- 6: The whole elimination phase. Each iteration asks one question and discards one person, so this is n - 1 queries — the same as the stack's pop-pop-push loop, with a single integer in place of the container.
- 5: Starting at i = 1 with c = 0 rather than at i = 0, since comparing the candidate with itself would waste a query and the oracle's behaviour on knows(i, i) is undefined.
- 8: The candidate is the only *possible* celebrity, not a known one. Everything proved so far was about the people who were discarded.
- 10: Both directions must be checked. Testing only that the candidate knows nobody would accept a hermit whom nobody has heard of.
- 12: Returning c only after the loop completes, so a single failure anywhere reports -1 — measured to happen after about 2 queries when there is no celebrity.

<!-- @code java -->
```java
// boolean knows(int a, int b) is supplied by the judge

static int findCelebrity(int n) {
    int c = 0;
    for (int i = 1; i < n; i++)
        if (knows(c, i)) c = i;

    for (int i = 0; i < n; i++) {
        if (i == c) continue;
        if (knows(c, i) || !knows(i, c)) return -1;
    }
    return c;
}
```

<!-- @annotations -->
- 4: One int of state against the stack version's int[n]. Identical query count, so this is a strict improvement rather than a trade.
- 6: Note there is no early exit here and none is possible: every person must be given the chance to disqualify the running candidate.
- 10: `||` short-circuits in Java as elsewhere, so the second call is skipped whenever the first already disqualifies the candidate.

<!-- @code python -->
```python
def find_celebrity(n: int) -> int:
    c = 0
    for i in range(1, n):
        if knows(c, i):
            c = i

    for i in range(n):
        if i == c:
            continue
        if knows(c, i) or not knows(i, c):
            return -1
    return c
```

<!-- @annotations -->
- 3: range(1, n), not range(n) — starting at 0 would ask knows(0, 0), which is both wasted and undefined.
- 4: Four lines for the entire elimination phase, matching the stack version's query count exactly; measured 0.43ms at n = 2,000 against its 0.56ms.
- 10: If a memoising wrapper is added around knows(), this is where most of the repeats occur — the verification re-asks pairs the elimination already covered, which measurement puts at about one query in six.

<!-- @example -->

<!-- @input -->
```
knows  0  1  2  3
    0  -  1  1  0
    1  0  -  1  0
    2  0  0  -  0
    3  0  1  1  -
```

<!-- @output -->
```
2   (found in 9 queries, and 3n - 3 = 9)
```

<!-- @why -->
The smallest case that shows both phases doing real work. Three eliminations reduce four people to one, and six verification calls confirm the survivor — exactly `3n - 3`. Running the stack version on the same matrix produces the same candidate in the same nine queries, which is the subtopic's central measurement in miniature.

<!-- @walkthrough -->
- Elimination starts with candidate 0. `knows(0, 1)` is true, so 0 is disqualified and 1 takes over.
- `knows(1, 2)` is true, so 1 is disqualified and 2 takes over.
- `knows(2, 3)` is false, so 3 is disqualified and 2 stays. Three queries, one candidate left.
- Verification asks six questions: `knows(2, 0)` false and `knows(0, 2)` true; `knows(2, 1)` false and `knows(1, 2)` true; `knows(2, 3)` false and `knows(3, 2)` true.
- All six pass, so 2 is the celebrity. Total 9 queries against 3n - 3 = 9.
- The stack version on the same matrix: pops 3 and 2, `knows(3, 2)` is true so 2 survives; pops 2 and 1, `knows(2, 1)` is false so 2 survives; pops 2 and 0, `knows(2, 0)` is false so 2 survives. Three queries, then the same six. Nine again.

<!-- @example -->

<!-- @input -->
```
30,000 matrices, half constructed with a celebrity and half left random
```

<!-- @output -->
```
eliminating without verifying is wrong on 40.18%
```

<!-- @why -->
The one mistake that actually matters here, and it is not a rare edge case. Elimination always leaves somebody standing — the loop runs until one person remains regardless of whether any of them qualifies — so an unverified answer is a confident name for a person who may fail both tests. An independent Python run over 20,000 matrices put it at 40.43%.

<!-- @walkthrough -->
- The elimination loop's postcondition is "exactly one candidate remains", not "the celebrity remains".
- Every query it makes proves something about the person it *discards*, never about the survivor.
- On a matrix with no celebrity, the survivor is simply the last person nobody managed to disqualify, which carries no guarantee at all.
- Verification is what converts "the only possible celebrity" into "the celebrity", and it costs 2(n - 1) calls.
- When there is no celebrity, that cost is almost never paid in full: measured across n = 10, 100 and 1,000, verification bailed after an average of 2 queries.
- So the full 3n - 3 is the price of a *yes*; a *no* costs about n + 1.

<!-- @example -->

<!-- @input -->
```
n = 1,000 random matrices, moving the celebrity's index
```

<!-- @output -->
```
brute force uses 1,998 queries with the celebrity at index 0 and 3,913 at index 999;
the elimination methods use a flat 2,997 whatever the input looks like
```

<!-- @why -->
The measurement that stops the brute force from being simply dismissed. The elimination methods cost a flat 2,997 queries whatever the input looks like. The brute force's cost depends on where the answer sits, and when it sits early it wins — 1,998 queries against 2,997, a third fewer.

<!-- @walkthrough -->
- Celebrity at index 0: brute force checks person 0 first, passes all 2(n-1) tests and returns. 1,998 queries against the sweep's 2,997.
- Celebrity at index 250: 2,504. Still ahead.
- Celebrity at index 500: 2,970, essentially a tie with 2,997.
- Celebrity at index 750: 3,455. Now behind.
- Celebrity at index 999: 3,913, about 30% worse.
- The pattern is that each non-celebrity is rejected in one or two queries on a random matrix, so the scan costs roughly `2 x (index of the celebrity) + 2(n - 1)` — linear, not quadratic, until the input has structure that keeps candidates alive.

<!-- @example -->

<!-- @input -->
```
knows(i, j) is true exactly when i < j
```

<!-- @output -->
```
999,999 queries at n = 1,000 against the sweep's 2,997 — a factor of 333.7
```

<!-- @why -->
The brute force's genuine worst case, and it has to be constructed. In this graph person `n - 1` knows nobody and is known by everyone, so the celebrity is last — and every earlier candidate survives a long prefix of checks before being rejected, which is exactly the condition the random matrices never produce.

<!-- @walkthrough -->
- Candidate `i` is asked about `j = 0, 1, 2, ...` in order. For every `j < i` the answer is `knows(i, j) = false` and `knows(j, i) = true`, so the candidate survives.
- It is finally rejected at `j = i + 1`, where `knows(i, i+1)` is true. So candidate `i` costs about `2i` queries.
- Summing over all candidates gives roughly `n^2`, and the celebrity at the end is reached last.
- Measured: 99 queries at n = 10, 9,999 at n = 100, 999,999 at n = 1,000 and 3,999,999 at n = 2,000.
- Against the sweep's flat 3n - 3, that is 3.7x, 33.7x, 333.7x and 667.0x.
- This is the same hazard shape as the last three subtopics: a cost driven by the *arrangement* of the data rather than its size, and therefore invisible to a random benchmark.

<!-- @visualization stack -->

<!-- @description -->
Open on the elimination rule alone, because everything else follows from it. Draw two people, `a` and `b`, with a single question mark between them, and animate the two outcomes: if `a knows b`, strike out `a` with the caption "a celebrity knows nobody"; if not, strike out `b` with "everyone knows a celebrity". Land on "either way, one question removes one person — permanently". Then run the four-person example as a row of avatars with a moving candidate marker. `knows(0,1)` is true, so 0 greys out and the marker slides to 1; `knows(1,2)` is true, so 1 greys out and the marker slides to 2; `knows(2,3)` is false, so 3 greys out and the marker stays. Three questions, one person left, with a query counter reading 3. Now the crucial beat: put a large question mark over the surviving avatar and grey out nothing, captioned "every question so far proved something about the people who left". Run the six verification calls as arrows out of and into the candidate, ticking each off, and let the counter finish at 9 beside a label "3n - 3 = 9". Then the comparison panel that is the point of the subtopic. Two lanes, same matrix: the stack lane shows a column of avatars being popped two at a time and one pushed back; the sweep lane shows a single integer changing. Run them in lockstep with a query counter under each — and let both counters advance in perfect unison to the same total, ending at 27 / 147 / 297 / 1497 / 2997 as a size slider is dragged. Caption: "identical query counts at every size; the stack costs O(n) space and 1.35x the wall clock for nothing". Then the no-verification panel: a matrix with no celebrity, elimination confidently naming a survivor, and the verification arrows immediately failing — with a 40.18% figure. Close on the brute force's two faces, side by side: a random matrix with the celebrity at index 0 where brute force wins at 1,998 against 2,997, drawn in green, and beside it the triangular `i < j` matrix where its bar runs off the frame at 999,999 against 2,997 — captioned "the same algorithm, a third faster or 334x slower, decided entirely by the arrangement".

<!-- @sampleInput -->
```json
{"problem":{"definition":"a celebrity is known by everyone else and knows nobody; there is at most one","oracle":"knows(a, b), one call","matrix":[[0,1,1,0],[0,0,1,0],[0,0,0,0],[0,1,1,0]],"answer":2,"queriesUsed":9,"formula":"3n - 3 = 9"},"costMetric":{"unit":"knows() calls, not array operations","why":"the problem presents knows() as an oracle; in the setting it models — a directory service, a graph database, a rate-limited API — a call dominates everything else in the algorithm","consequence":"reading the whole matrix is n^2 - n calls: 999,000 at n = 1,000 against the best method's 2,997"},"eliminationRule":{"ifKnows":"a is not the celebrity, because a celebrity knows nobody","ifNotKnows":"b is not the celebrity, because everyone knows a celebrity","consequence":"one call removes one candidate permanently, so n - 1 calls leave exactly one","caveat":"the survivor is the only POSSIBLE celebrity — elimination only ever proved things about the people it discarded"},"trace":{"elimination":[{"query":"knows(0,1)","answer":true,"candidateBecomes":1},{"query":"knows(1,2)","answer":true,"candidateBecomes":2},{"query":"knows(2,3)","answer":false,"candidateBecomes":2}],"eliminationQueries":3,"verification":[{"pair":"knows(2,0)","answer":false},{"pair":"knows(0,2)","answer":true},{"pair":"knows(2,1)","answer":false},{"pair":"knows(1,2)","answer":true},{"pair":"knows(2,3)","answer":false},{"pair":"knows(3,2)","answer":true}],"verificationQueries":6,"total":9,"stackVersionOnSameMatrix":{"candidate":2,"queries":9,"note":"same candidate, same count"}},"queryCounts":{"note":"averaged over 200 random matrices per size, celebrity present","rows":[{"n":10,"brute":26,"degreeCount":90,"stackElimination":27,"sweep":27,"formula3nMinus3":27},{"n":50,"brute":146,"degreeCount":2450,"stackElimination":147,"sweep":147,"formula3nMinus3":147},{"n":100,"brute":295,"degreeCount":9900,"stackElimination":297,"sweep":297,"formula3nMinus3":297},{"n":500,"brute":1566,"degreeCount":249500,"stackElimination":1497,"sweep":1497,"formula3nMinus3":1497},{"n":1000,"brute":3130,"degreeCount":999000,"stackElimination":2997,"sweep":2997,"formula3nMinus3":2997}],"headline":"the stack and the sweep are identical at every size and both equal 3n - 3 exactly"},"split":{"elimination":"exactly n - 1","verification":"exactly 2(n - 1) when the answer is yes","measured":[{"n":10,"elimination":9,"verification":18},{"n":100,"elimination":99,"verification":198},{"n":1000,"elimination":999,"verification":1998}]},"stackIsARedHerring":{"queryCountDifference":0,"spaceStack":"O(n)","spaceSweep":"O(1)","wallClockAt2000":{"stackNs":21459,"sweepNs":15500,"ratio":1.35},"python":{"n":2000,"stackMs":0.56,"sweepMs":0.43,"ratio":1.3,"queriesBoth":5997},"verdict":"the elimination idea is the content; the stack is one of two equally good ways to schedule it, and the other one needs a single integer"},"verificationIsMandatory":{"wrongPct":40.18,"pythonWrongPct":40.43,"matricesTested":30000,"why":"the elimination loop's postcondition is 'exactly one candidate remains', not 'the celebrity remains' — it always leaves somebody standing even when no celebrity exists","costOfNo":"verification bailed after an average of 2 queries at n = 10, 100 and 1000, so a NO costs about n + 1 while a YES costs 3n - 3"},"bruteForce":{"randomMatrices":{"n":1000,"note":"cost depends on where the celebrity sits, not on n","rows":[{"celebrityIndex":0,"bruteQueries":1998,"sweepQueries":2997,"winner":"brute"},{"celebrityIndex":250,"bruteQueries":2504,"sweepQueries":2997,"winner":"brute"},{"celebrityIndex":500,"bruteQueries":2970,"sweepQueries":2997,"winner":"tie"},{"celebrityIndex":750,"bruteQueries":3455,"sweepQueries":2997,"winner":"sweep"},{"celebrityIndex":999,"bruteQueries":3913,"sweepQueries":2997,"winner":"sweep"}],"model":"each non-celebrity is rejected in one or two queries, so the scan costs about 2 x (celebrity index) + 2(n-1) — linear, not quadratic"},"adversarial":{"construction":"knows(i, j) true exactly when i < j, so person n-1 is the celebrity and every earlier candidate survives a long prefix","rows":[{"n":10,"brute":99,"sweep":27,"ratio":3.7},{"n":100,"brute":9999,"sweep":297,"ratio":33.7},{"n":1000,"brute":999999,"sweep":2997,"ratio":333.7},{"n":2000,"brute":3999999,"sweep":5997,"ratio":667.0}]},"hazardShape":"a cost driven by the arrangement of the data rather than its size — the same shape as Trapping Rainwater's symmetric hill, Maximum Rectangles' dense matrix and Stock Span's rising prices"},"memoisation":{"observation":"verification re-asks pairs the elimination already covered","rows":[{"n":10,"plain":27,"memoised":22,"savedPct":19.6},{"n":100,"plain":297,"memoised":255,"savedPct":14.0},{"n":500,"plain":1497,"memoised":1229,"savedPct":17.9},{"n":1000,"plain":2997,"memoised":2509,"savedPct":16.3}],"summary":"about one query in six, bringing 3n to roughly 2.5n","whenWorthIt":"only when a call is expensive enough to pay for the table — pointless for an array read, clearly worth it for a network request"},"recommendation":"the single-variable sweep: identical query count to the stack, O(1) space, faster in both languages measured, four lines — and keep the verification pass unconditionally","verification":{"cpp":{"matrices":30000,"maxN":9,"halfWithConstructedCelebrity":true,"reference":"O(n^2) brute force","mismatches":0},"python":{"matrices":20000,"mismatches":0}}}
```

<!-- @highlights -->
- The elimination rule is animated on two people with a single question between them.
- Each outcome strikes out one person, captioned "a celebrity knows nobody" and "everyone knows a celebrity".
- A four-person row then runs the elimination with a sliding candidate marker and a query counter.
- After three questions the counter reads 3 and one avatar remains.
- A large question mark is placed over the survivor, with nothing greyed out.
- Its caption reads "every question so far proved something about the people who left".
- Six verification arrows run out of and into the candidate, finishing the counter at 9.
- A label beside it reads "3n - 3 = 9".
- Two lanes then run the stack and the sweep on the same matrix in lockstep.
- The stack lane pops two avatars and pushes one back; the sweep lane changes a single integer.
- Query counters under both lanes advance in perfect unison to the same total.
- A size slider drives both counters through 27, 147, 297, 1497 and 2997.
- Their caption states the stack costs O(n) space and 1.35x wall clock for no query saving.
- A no-celebrity panel shows elimination naming a survivor and verification failing at once, with 40.18%.
- A green panel shows brute force winning at 1,998 against 2,997 with the celebrity at index 0.
- Beside it the triangular i < j matrix sends brute force off the frame at 999,999 against 2,997.

<!-- @edgeCases -->
- **n = 1** — the single person is vacuously a celebrity: they know nobody, and there is nobody who fails to know them. Elimination makes zero queries and verification makes zero, so the answer costs nothing.
- **n = 2** — one elimination query and two verification queries, which is `3n - 3 = 3`.
- **No celebrity at all** — roughly half of random matrices. Elimination still names a survivor, which is why verification is mandatory; measured, it bails after about 2 queries.
- **Two people who both know nobody** — neither is a celebrity, since neither knows the other, so neither is known by everyone. Elimination keeps one and verification rejects it.
- **Everybody knows everybody** — no celebrity. Elimination disqualifies the candidate at every step, leaving the last person, whom verification rejects on its first query.
- **Nobody knows anybody** — no celebrity when `n > 1`, because nobody is known. Elimination never advances the candidate, and verification fails on the `knows(i, c)` half.
- **The celebrity at index 0** — the brute force's best case, at 1,998 queries against the elimination methods' 2,997 at n = 1,000.
- **The celebrity last in a transitively ordered graph** — the brute force's worst case, at 999,999 queries against 2,997.
- **`knows(i, i)`** — undefined by the problem. Every version here skips it explicitly; asking it wastes a query and may return anything.
- **A candidate who knows nobody but is unknown to someone** — a hermit, not a celebrity. Checking only the outgoing direction accepts them, which is why both directions are verified.
- **Repeated queries** — about one call in six is a pair already asked. Harmless for correctness, and worth caching only when a call is expensive.

<!-- @pitfalls -->
- **Skipping the verification pass.** Wrong on 40.18% of matrices. Elimination's postcondition is "one candidate remains", not "the celebrity remains".
- **Verifying only one direction.** Checking that the candidate knows nobody accepts a hermit whom nobody has heard of; both `knows(c, i)` and `knows(i, c)` are needed.
- **Reaching for the stack because the problem is filed under Stacks.** It makes exactly the same number of queries as a single integer, costs O(n) space, and measures 1.35x slower in C++ and 1.30x in Python.
- **Counting array operations instead of oracle calls.** Degree counting is a clean single pass and it asks 999,000 questions at n = 1,000 against 2,997 — the wrong metric makes it look reasonable.
- **Starting the sweep at `i = 0`.** That asks `knows(0, 0)`, which is undefined and wastes a call.
- **Writing `indegree[i] == n`.** It is `n - 1`, since nobody counts as knowing themselves. The bug returns -1 on every input, which reads as "no celebrity exists" rather than as a failure.
- **Using `top >= 0` as the stack loop condition.** With `top` as the index of the last element, that loops forever once one candidate remains; the test is `top > 0`.
- **Benchmarking the brute force on random matrices.** It looks competitive and is sometimes better. Its quadratic case needs a transitively ordered graph, which random input does not produce.
- **Assuming the elimination methods have a bad case.** They do not — the query count is exactly `3n - 3` on every input, which is the real argument for them over the brute force.
- **Returning `-1` from inside the inner loop of the brute force.** It abandons the remaining candidates; the early exit must break, not return.
- **Adding a memo table when `knows()` is an array read.** It removes one query in six and costs a hash lookup per call, which is a net loss unless a query is genuinely expensive.
- **Treating "no celebrity" as an error.** It is a legitimate answer for about half of all random matrices, and it is the cheap case at roughly `n + 1` queries.

<!-- @doubt -->
Why does one `knows()` call always eliminate somebody?

<!-- @answer -->
Because the two possible answers each contradict one of the two halves of the definition. If `knows(a, b)` is true, then `a` knows somebody — and a celebrity knows nobody — so `a` is out. If it is false, then `b` is not known by `a` — and a celebrity is known by everyone — so `b` is out. There is no third outcome and no answer that leaves both alive. That is why `n - 1` calls suffice to reduce `n` candidates to one, and it is the only idea in the problem. Everything else is bookkeeping: which of the two you keep, and how you verify the survivor.

<!-- @doubt -->
If the elimination is that clean, why is verification necessary at all?

<!-- @answer -->
Because every query proved something about a person who was *discarded*, and nothing about the one who stayed. The loop's postcondition is "exactly one candidate remains", which is true whether or not a celebrity exists — it runs until one is left regardless. So the survivor is the only possible celebrity, and possibly not one. Measured over 30,000 matrices, half constructed with a celebrity and half random, returning the survivor unverified is wrong on **40.18%** — an independent Python run gave 40.43%. It is worth being precise about what elimination buys: it reduces the problem from `n` candidates to one, which is a large saving, and it establishes nothing.

<!-- @doubt -->
Is the stack version genuinely no better than a single variable?

<!-- @answer -->
Genuinely, and it is measurable rather than a matter of taste. Both perform `n - 1` eliminations with one query each and then the same `2(n - 1)` verification, so both make exactly `3n - 3` calls. Measured over 200 random matrices per size, the two columns are identical at every size: 27, 147, 297, 1497, 2997. Since the query count is the cost metric, they are the same algorithm — the stack is one way to schedule the eliminations and a single integer is another. What differs is everything else: `O(n)` space against `O(1)`, and when `knows()` is a plain array read, 21,459 ns against 15,500 ns at n = 2,000, with Python showing the same 1.3x. The stack is a good way to *explain* the elimination and the wrong way to implement it.

<!-- @doubt -->
The last subtopic of the Stacks topic says not to use a stack. Is that a strange place to end?

<!-- @answer -->
It is the right place to end, because it completes the rule the topic has been building. Trapping Rainwater: the stack lost to two pointers, because the problem offered ends to close in from. Largest Rectangle: the stack was unbeaten, because a bare histogram offers nothing but element order. Maximum Rectangles: the stack lost to a DP, because successive rows offered information to carry forward. Stock Span: the stack was unbeaten again, because a stream offers nothing but order. Here the problem offers no order at all — the people are not sequenced, and any two can be compared — so a container that models order is the wrong shape entirely. A stack is the right answer when the only structure available is the order of the elements. This problem has none, and it shows.

<!-- @doubt -->
Why measure `knows()` calls instead of running time?

<!-- @answer -->
Because the problem hands you an oracle rather than an array, and that is a deliberate signal about where the cost lives. In the situations this models — a directory service, a social graph behind an API, a rate-limited endpoint — one call dwarfs everything the algorithm does around it. Under that metric, degree counting asks 999,000 questions at n = 1,000 while the elimination asks 2,997, a factor of 333. Measured as running time on an in-memory matrix, that same gap is a few milliseconds and easy to shrug at. The two metrics do not disagree about the ranking here, but they disagree wildly about the *margin*, and the margin is what decides whether an approach is usable.

<!-- @doubt -->
Is the brute force actually worse? The measurements make it look competitive.

<!-- @answer -->
On random matrices it is competitive and sometimes better. At n = 1,000 with the celebrity at index 0 it uses 1,998 queries against the elimination methods' flat 2,997 — a third fewer — because each non-celebrity is rejected in one or two questions and the scan reaches the answer immediately. It crosses over around the middle: 2,970 at index 500, 3,455 at 750, 3,913 at 999. The real argument against it is not its average but its *variance*. Construct a graph where `knows(i, j)` holds exactly when `i < j` and every earlier candidate survives a long prefix of checks: 999,999 queries at n = 1,000 and 3,999,999 at n = 2,000, against a flat 2,997 and 5,997. The elimination methods have no bad case at all, and that guarantee is what you are buying.

<!-- @doubt -->
Why is "no celebrity" so much cheaper than "yes, it's person k"?

<!-- @answer -->
Because a *no* only needs one failing check, and failures are common. Elimination still costs its full `n - 1` calls — it has no way to stop early, since any remaining person could still be the answer. But verification short-circuits: the very first `knows(c, i) || !knows(i, c)` that comes back true ends it. Measured across random matrices at n = 10, 100 and 1,000, verification bailed after an average of **2 queries** in every case. So a no costs about `n + 1` calls and a yes costs the full `3n - 3`. That asymmetry is worth knowing when the workload is mostly negative — a service checking many groups for a celebrity spends nearly all its budget on the elimination phase.

<!-- @doubt -->
Can the `3n - 3` be reduced?

<!-- @answer -->
Somewhat, by not asking the same question twice. Verification re-asks pairs the elimination already covered, and caching answers removes about one call in six: 27 to 22 at n = 10, 297 to 255 at n = 100, 1,497 to 1,229 at n = 500, 2,997 to 2,509 at n = 1,000 — consistently around `2.5n` rather than `3n`. Whether that trade is worth taking depends entirely on what a call costs. Against an array read, a hash lookup per query is more expensive than the query it saves, and the memo table is a net loss. Against a network round trip, removing a sixth of the traffic is obviously worth a dictionary. This is the only change measured here that reduces the query count at all — the algorithm is already one pass plus a verification.

<!-- @doubt -->
Why must verification check both directions?

<!-- @answer -->
Because the definition has two halves and elimination guarantees neither for the survivor. Checking only that the candidate knows nobody accepts a hermit — someone with out-degree 0 whom several people have never heard of — and checking only that everyone knows the candidate accepts a well-known person who also knows others. Both are ordinary configurations, not contrived ones. The verification loop asks `knows(c, i)` expecting false and `knows(i, c)` expecting true for every other `i`, which is `2(n - 1)` calls, and the `||` between them means the second is skipped whenever the first has already settled it.

<!-- @doubt -->
Four subtopics in a row have had a cost that depends on the arrangement of the data. Is that a coincidence?

<!-- @answer -->
No, and it is probably the most portable thing in this stretch of the topic. Trapping Rainwater's two-pointer branch flips 12 times per million steps on random input and 999,998 times on a symmetric hill. Maximum Rectangles' height rebuild is 2.4x slower at 90% density and 63.7x on an all-ones matrix. Stock Span's backward walk is 2x on random prices and 6,229x on equal ones. Here the brute force is a third *faster* than the alternative when the celebrity sits early and 334x slower on a transitively ordered graph. In every case the input size is unchanged and the random benchmark reports the flattering number. The habit that follows: when an algorithm's cost depends on a property of the data, name that property and test its extreme deliberately. It is usually one constructed input, and it usually moves the measurement by orders of magnitude.
