---
id: check-if-there-exists-a-subsequence-with-sum-k
topic: Advanced Recursion
title: Check if there exists a subsequence with sum K
difficulty: Easy
status: ready
prerequisites:
  - count-all-subsequences-with-sum-k
  - learn-all-patterns-of-subsequences-theory
  - pow-x-n
  - time-and-space-complexity-basics
  - relational-and-logical-operators
relatedIds:
  - count-all-subsequences-with-sum-k
  - learn-all-patterns-of-subsequences-theory
  - pow-x-n
  - fibonacci-number
---

<!-- @summary -->
One operator changes — the count's `+` becomes `||` — and everything counting gave up comes back: a target equal to the whole array is answered in 23 calls instead of 8,388,607, a factor of 364,722. But the pruning story has three parts, and two of them cut against the obvious reading: writing the branches into locals first destroys the short-circuit silently, and the bound check that rescues a "no" costs 26% when it cannot fire.

<!-- @theory -->
## The problem

Given an array and a target `K`, report whether **any** subsequence sums to `K`.

```
[1, 2, 3],  K = 3   ->   true      // [1,2] or [3]
[1, 2, 3],  K = 7   ->   false
```

## One operator different from the last subtopic

```
count(i, sum):                        exists(i, sum):
    if i == n: return sum == K            if i == n: return sum == K
    return count(i+1, sum+a[i])           return exists(i+1, sum+a[i])
         + count(i+1, sum)                    || exists(i+1, sum)
```

Same tree, same base case, same state. The only edit is `+` becoming `||`.

That single character changes the cost profile completely, because **addition
needs both operands and `||` does not**. The previous subtopic measured the
consequence from the other side: a count has no early exit at all, so its best
case and worst case are both 2^(n+1)−1 calls. Here a `true` from the first branch
means the second is never evaluated.

Measured at n = 22 with `a = [1..22]`, where the full tree is 8,388,607 calls:

| | Calls | Time |
|---|---|---|
| Count (no short-circuit possible) | 8,388,607 | — |
| Exists, K = 253 (the whole array) | **23** | **2ns** |

23 calls, because taking first walks straight down to the full-set leaf. That is
a factor of **364,722** on the call count, from one operator.

## The trap that silently undoes it

These two look equivalent and are not:

```
bool take = exists(i+1, sum+a[i]);        // WRONG
bool skip = exists(i+1, sum);
return take || skip;

return exists(i+1, sum+a[i]) || exists(i+1, sum);    // right
```

The first assigns both results before combining them, so **both branches are
always evaluated** and `||` has nothing left to skip. It is exactly the count's
cost profile wearing the existence problem's clothes.

Measured at n = 22:

| Target | Locals first | Short-circuit |
|---|---|---|
| K = 253 (found) | 5,748,938ns | **2ns** |
| K = 25 (found) | 4,509,208ns | 14,740ns |
| K = 3 (found) | 4,444,125ns | 122,465ns |
| K = 254 (not found) | 4,490,875ns | 490,054ns |

The locals-first column barely moves with the target — around 4.5 million
nanoseconds whatever you ask it — because it always walks the whole tree.

Note the last row. Neither version can prune an unreachable target, and counting
the calls confirms it: **8,388,607 for both**, identical. Yet the short-circuit
version is still **9.2x faster**. That difference is not algorithmic at all; it is
code generation. The locals-first form keeps two booleans live across each
recursive call, which blocks the tail-call shape the compiler would otherwise use.

## The second prune, which the count could never have

Short-circuiting only helps when the answer is yes. The previous subtopic
established that an early exit saves exactly 0% on a target that does not exist.

For **non-negative** values there is a second prune that does help a "no": if the
running sum already exceeds `K`, no further additions can bring it back down, so
that whole subtree can be abandoned.

```
if (sum == K) return true;
if (i == n || sum > K) return false;      // the bound prune
```

To measure it honestly you need a target that is unreachable but still *inside*
the range of sums — otherwise `sum > K` never fires. Using `a = [2,4,…,40]`
where the total is 420, every odd `K` is in range and unreachable:

| K | Short-circuit only | With the bound | Saved |
|---|---|---|---|
| 41 | 2,097,151 | **7,883** | 99.62% |
| 99 | 2,097,151 | 172,493 | 91.77% |
| 199 | 2,097,151 | 1,457,253 | 30.51% |
| 399 | 2,097,151 | 2,097,151 | **0.00%** |

So it does cut a "no" — which nothing in the previous subtopic could — but the
saving decays sharply as `K` approaches the total:

| K as a fraction of the total | Saved |
|---|---|
| 0.05 | **99.94%** |
| 0.10 | 99.56% |
| 0.25 | 89.80% |
| 0.50 | 23.15% |
| 0.75 | 0.24% |
| 0.95 | **0.00%** |

The mechanism is straightforward once stated: `sum > K` can only fire if a partial
sum can overshoot `K`, and the higher `K` sits relative to the total, the fewer
branches ever do.

## And it is not free

The bound check runs at every node whether or not it ever fires. In C++ that cost
is invisible, but Python makes it plain. At n = 18 with a target above the total,
where the check can never succeed:

| | ns |
|---|---|
| Short-circuit only | 29,338,617 |
| With the bound check | **37,000,008** |

**26% slower** for a test that cannot possibly help on that input. Pruning is a
bet, and this is what losing it costs.

## What actually solves the hard case

Both prunes fail on the same input: a target that is unreachable and high. That
is precisely where the state-collapse from the previous subtopic still applies —
the reachable sums are a set, and a boolean row tracks them directly:

| n = 22, a = [1..22] | Not found (K = 254) |
|---|---|
| Locals first | 4,490,875ns |
| Short-circuit | 490,054ns |
| Short-circuit + bound | 482,023ns |
| **Tabulated** | **964ns** |

**500x** faster than the best recursive form on the case the recursion cannot
prune. And on the easy targets the recursion wins — 2ns against 928ns for
K = 253 — because it stops after 23 calls while the table always fills every cell.

That is the honest summary: **the recursion is unbeatable when the answer is an
easy yes, and unusable when the answer is a hard no.** Tabulation is flat.

## Everything else carries over unchanged

Because the state is identical to the counting version, so are its hazards:

- **Zeros** still let a subsequence be extended without changing its sum, so the
  base case must check the index rather than returning early on `sum == K`. The
  bound version above checks `sum == K` first, which is safe here only because a
  `true` is final — for a *count* the same shortcut undercounted by 2^(zeros).
- **Negative values** break the bound prune entirely: the running sum can exceed
  `K` and come back down, so abandoning that subtree discards real answers. With
  negatives present, use the short-circuit form alone or offset the table.
- The problem is **subset-sum**, which is NP-complete in general. The tabulated
  version is O(n·K), which is pseudo-polynomial — fast when `K` is small, and no
  help at all when `K` is large.

## Where this goes next

**Recursive Implementation of atoi()** leaves subsequences behind and applies
recursion to parsing, where each frame consumes one character and the interesting
work is in the failure cases rather than the search. After that the topic returns
to this tree with **Combination Sum**, which keeps the take/skip shape but allows
an element to be reused, turning the binary decision into an unbounded one.

<!-- @intuition -->
Asking whether something exists is a fundamentally cheaper question than asking how many there are, and the code barely shows it — a plus becomes an or. The reason is that or can stop: once one branch says yes, nothing the other branch does can change the answer, so it is never run. Counting has no such luxury, which is why the same tree costs the same amount every time there. The subtlety worth carrying away is that this saving is fragile in two directions. It disappears the moment you assign both branches to variables before combining them, because then both have already run. And it only ever helps when the answer is yes — to make a no cheap you need a different idea entirely, namely noticing that a running sum which has already overshot the target can never come back, which is true only when every element is non-negative.

<!-- @approach -->
### Brute Force - Evaluate Both Branches First

<!-- @idea -->
Compute the result of taking and of skipping, then combine them.

<!-- @steps -->
1. Recurse on the take branch and store the result.
2. Recurse on the skip branch and store that result too.
3. Return whether either of them was true.
4. Note that both calls have already completed before the or runs.
5. The tree is therefore walked in full, whatever the answer turns out to be.

<!-- @complexity -->
- time: O(2^n) always, best case equal to worst case
- space: O(n) call stack
- note: The counting version's cost profile applied to a question that does not need it. Measured at n = 22 it took about 4.5 million nanoseconds for every target tested, including one answered in 2ns by short-circuiting. Worth writing once only to see how easily the saving is lost — the two forms differ by a single pair of local variables.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool existsSum(const vector<int>& a, int i, long long sum, long long K) {
    if (i == (int)a.size()) return sum == K;

    bool take = existsSum(a, i + 1, sum + a[i], K);   // both run
    bool skip = existsSum(a, i + 1, sum, K);          // unconditionally
    return take || skip;
}
```

<!-- @annotations -->
- 7: Assigning to a local forces the call to complete, so the or on line 9 has nothing left to skip.
- 9: This or is correct but useless — both operands were already evaluated above it.
- 5: The base case is identical to the counting version's, because the state is identical; only the combining operator differs.

<!-- @code java -->
```java
static boolean existsSum(int[] a, int i, long sum, long K) {
    if (i == a.length) return sum == K;

    boolean take = existsSum(a, i + 1, sum + a[i], K);
    boolean skip = existsSum(a, i + 1, sum, K);
    return take || skip;
}
```

<!-- @annotations -->
- 4: Java's || short-circuits exactly as C++ does, so this loses the saving for the same reason — the operands are evaluated before the operator is reached.

<!-- @code python -->
```python
def exists_sum(a, i, cur, k):
    if i == len(a):
        return cur == k
    take = exists_sum(a, i + 1, cur + a[i], k)
    skip = exists_sum(a, i + 1, cur, k)
    return take or skip


# Measured 29,434,771ns at n = 18 for a target the short-circuit
# version answers in 1,092ns.
```

<!-- @annotations -->
- 4: Python's or short-circuits too, so the problem is the assignment rather than the language.
- 9: About 27,000x slower on a first-path target, for a change that looks like a readability preference.

<!-- @approach -->
### Short-Circuit with ||

<!-- @idea -->
Put the recursive calls directly in the or, so the second only runs if the first failed.

<!-- @steps -->
1. Return the take branch or-ed with the skip branch, as a single expression.
2. The or evaluates its left operand first.
3. If that is true, the right operand is never evaluated.
4. So a subsequence found early collapses the rest of the search.
5. A target that does not exist still costs the full tree.

<!-- @complexity -->
- time: O(2^n) worst case, as little as O(n) when an answer is found on the first path
- space: O(n) call stack
- note: One operator's worth of difference from the count, and worth 364,722x on the call count at n = 22 — 23 calls against 8,388,607 for a target equal to the whole array. On an unreachable target it walks the same tree as the locals-first form, with identical call counts, yet still measured 9.2x faster because it keeps no live values across the recursive call.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool existsSum(const vector<int>& a, int i, long long sum, long long K) {
    if (i == (int)a.size()) return sum == K;

    return existsSum(a, i + 1, sum + a[i], K)      // TAKE
        || existsSum(a, i + 1, sum, K);            // SKIP, only if the take failed
}
```

<!-- @annotations -->
- 7: The take branch runs first, so an answer that includes every element is reached in n + 1 calls.
- 8: This line is skipped entirely whenever line 7 returned true — that is the whole optimisation.
- 5: Swap the two operands and the search explores skip-first instead, which finds small-sum answers faster and large-sum answers slower.

<!-- @code java -->
```java
static boolean existsSum(int[] a, int i, long sum, long K) {
    if (i == a.length) return sum == K;

    return existsSum(a, i + 1, sum + a[i], K)
        || existsSum(a, i + 1, sum, K);
}
```

<!-- @annotations -->
- 4: Use ||, not the non-short-circuiting | — the single-pipe operator evaluates both sides and reintroduces the full cost.

<!-- @code python -->
```python
def exists_sum(a, i, cur, k):
    if i == len(a):
        return cur == k
    return exists_sum(a, i + 1, cur + a[i], k) or exists_sum(a, i + 1, cur, k)


# Measured 1,092ns at n = 18 for K equal to the whole array, against
# 29,434,771ns for the version that assigns both branches first.
```

<!-- @annotations -->
- 4: or returns the first truthy operand without evaluating the second, which is what makes this the cheap form. Avoid any() over a generator of both branches — equivalent, but the explicit or keeps the pruning visible as the point of the line.

<!-- @approach -->
### Add the Bound Prune

<!-- @idea -->
Abandon a branch as soon as the running sum passes the target.

<!-- @steps -->
1. Return true immediately if the running sum already equals the target.
2. Return false if the array is exhausted or the running sum has passed the target.
3. Otherwise recurse on take and skip as before.
4. This second test only holds when every element is non-negative.
5. It is the only prune here that can make a negative answer cheap.

<!-- @complexity -->
- time: O(2^n) worst case, often far less
- space: O(n) call stack
- note: The only prune in these three subtopics that helps when the answer is no. On unreachable in-range targets it saved 99.62% at K = 41 and 91.77% at K = 99, but the benefit decays with K over the total — 89.80% at a quarter, 23.15% at half, and 0.00% above three quarters. It is also not free: in Python, on a target the check can never fire for, it measured 26% SLOWER than short-circuiting alone. Requires non-negative values.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool existsSum(const vector<int>& a, int i, long long sum, long long K) {
    if (sum == K) return true;                       // done, at any depth
    if (i == (int)a.size() || sum > K) return false; // exhausted, or overshot

    return existsSum(a, i + 1, sum + a[i], K)
        || existsSum(a, i + 1, sum, K);
}
```

<!-- @annotations -->
- 5: Returning on sum == K before the index is safe here because a true is final. The counting version cannot do this — the same shortcut undercounted it by 2^(number of zeros).
- 6: sum > K is only valid for non-negative elements — with a negative present the sum can overshoot and come back, so this discards real answers. It also runs at every node whether or not it ever fires, which is why it measured 26% slower in Python on an input where it could not help.

<!-- @code java -->
```java
static boolean existsSum(int[] a, int i, long sum, long K) {
    if (sum == K) return true;
    if (i == a.length || sum > K) return false;

    return existsSum(a, i + 1, sum + a[i], K)
        || existsSum(a, i + 1, sum, K);
}
```

<!-- @annotations -->
- 3: Checking i == a.length before sum > K costs nothing but makes the two distinct reasons for failure explicit.

<!-- @code python -->
```python
def exists_sum(a, i, cur, k):
    if cur == k:
        return True
    if i == len(a) or cur > k:
        return False
    return exists_sum(a, i + 1, cur + a[i], k) or exists_sum(a, i + 1, cur, k)


# Sorting descending first makes the overshoot happen sooner and prunes
# harder — but it costs an O(n log n) sort, so it only pays when the
# search would otherwise be long.
```

<!-- @annotations -->
- 4: With negative values in a this line is wrong, not merely unhelpful, because a sum past k can still come back to it.
- 9: Descending order reaches the bound faster; ascending order finds small-sum answers faster. Neither is universally better.

<!-- @approach -->
### Optimal - Tabulate a Boolean Row

<!-- @idea -->
Track which sums are reachable at all, one element at a time.

<!-- @steps -->
1. Start with a row marking only a total of zero as reachable — take nothing.
2. Take each element of the array in turn.
3. For each target from K downward, mark it reachable if the target minus that element already was.
4. Iterate downward so each element is used at most once.
5. The answer is whether K is marked after all elements have been processed.

<!-- @complexity -->
- time: O(n · K)
- space: O(K)
- note: The only form that is fast on the case the recursion cannot prune — measured 964ns at n = 22 for an unreachable target, against 482,023ns for the best recursive version, a factor of 500. It is flat: the same cost regardless of the answer. That makes it slower than the recursion on easy targets, 928ns against 2ns, because the table always fills every cell while the recursion can stop after 23 calls.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

bool existsSum(const vector<int>& a, int K) {
    if (K < 0) return false;
    vector<char> reachable(K + 1, 0);
    reachable[0] = 1;                        // zero is always reachable

    for (int x : a)
        for (int s = K; s >= x; s--)         // DOWNWARD
            if (reachable[s - x]) reachable[s] = 1;

    return reachable[K] != 0;
}
```

<!-- @annotations -->
- 7: reachable[0] = 1 represents the empty subsequence, which is why K = 0 always returns true.
- 10: Downward, so an element just marked cannot be reused within the same pass — upward would answer the unbounded version of this problem instead.
- 11: With x equal to 0 this marks nothing new, which is correct: a zero cannot make a previously unreachable sum reachable.

<!-- @code java -->
```java
static boolean existsSum(int[] a, int K) {
    if (K < 0) return false;
    boolean[] reachable = new boolean[K + 1];
    reachable[0] = true;

    for (int x : a)
        for (int s = K; s >= x; s--)
            if (reachable[s - x]) reachable[s] = true;

    return reachable[K];
}
```

<!-- @annotations -->
- 3: new boolean[] zero-fills to all false, so only index 0 needs setting.

<!-- @code python -->
```python
def exists_sum(a, k):
    if k < 0:
        return False
    reachable = [False] * (k + 1)
    reachable[0] = True
    for x in a:
        for s in range(k, x - 1, -1):
            if reachable[s - x]:
                reachable[s] = True
    return reachable[k]


# A bitset is the idiomatic fast version — reachable |= reachable << x
# does the whole inner loop in one operation on a Python int.
```

<!-- @annotations -->
- 7: range(k, x - 1, -1) covers s from k down to x inclusive; stopping at x drops the case of x on its own.
- 13: Python integers are arbitrary-precision bitsets, so mask |= mask << x replaces the inner loop entirely and is dramatically faster for large K.

<!-- @example -->

<!-- @input -->
a = [1, 2, 3], K = 3, through the short-circuiting version

<!-- @output -->
true, found before most of the tree is touched

<!-- @why -->
The smallest trace where the or actually skips something, which is the entire difference from the counting version.

<!-- @walkthrough -->
1. exists(0, 0) evaluates its left operand first, taking 1 to reach exists(1, 1).
2. That takes 2 to reach exists(2, 3), which takes 3 to reach exists(3, 6) — the leaf returns false.
3. exists(2, 3) then evaluates its right operand, skipping 3 to reach exists(3, 3), which equals K and returns true.
4. That true propagates back to exists(2, 3), which returns true without further work.
5. exists(1, 1) received true from its left operand, so its right operand — skipping 2 — is never evaluated.
6. exists(0, 0) likewise never evaluates the entire half of the tree where 1 is skipped.
7. The counting version had to visit all eight leaves to add them up; this one stopped as soon as one leaf said yes.

<!-- @example -->

<!-- @input -->
The two branches assigned to locals before being or-ed

<!-- @output -->
8,388,607 calls instead of 23, for a change that looks cosmetic

<!-- @why -->
It is the standard way this optimisation is lost, and nothing about the code reads as wrong.

<!-- @walkthrough -->
1. Writing bool take = exists(...) forces that call to complete before the next statement runs.
2. Writing bool skip = exists(...) does the same for the other branch.
3. By the time take || skip is evaluated, both operands are already known, so the or has nothing to skip.
4. At n = 22 with K equal to the total of the array, the short-circuiting form makes 23 calls and this one makes 8,388,607 — a factor of 364,722.
5. In time that is 2ns against 5,748,938ns.
6. The locals-first version measured around 4.5 million nanoseconds for every target tried, because its cost does not depend on the answer at all.
7. That flatness is the giveaway: an existence check whose timing does not vary with the input is not short-circuiting.

<!-- @example -->

<!-- @input -->
An unreachable target, with and without the bound prune

<!-- @output -->
99.62% of the tree saved at K = 41, and 0.00% at K = 399

<!-- @why -->
It is the only prune in these three subtopics that helps a negative answer, and its usefulness varies enormously with the target.

<!-- @walkthrough -->
1. Short-circuiting cannot help when no subsequence reaches the target, because there is never a true to stop on.
2. The bound prune abandons any branch whose running sum has already passed K, which is valid when every element is non-negative.
3. Using a = [2,4,…,40], where the total is 420 and every odd K is in range but unreachable, the full tree is 2,097,151 calls.
4. At K = 41 the bound version makes 7,883 calls, saving 99.62%.
5. At K = 199 it makes 1,457,253, saving only 30.51%.
6. At K = 399 it makes all 2,097,151, saving nothing, because a partial sum can rarely overshoot a target that high.
7. Expressed as a fraction of the total, the saving runs 99.94% at 0.05, 89.80% at 0.25, 23.15% at 0.50 and 0.00% above 0.75.

<!-- @example -->

<!-- @input -->
The same four implementations on a hard negative answer

<!-- @output -->
Tabulation is 500x faster than the best recursive form

<!-- @why -->
It identifies the one input class where recursion has nothing left to offer, and shows that the ranking flips depending on the answer rather than the algorithm.

<!-- @walkthrough -->
1. At n = 22 with K = 254, one more than the total, no subsequence can reach the target.
2. Short-circuiting cannot fire, because no branch ever returns true.
3. The bound prune cannot fire either, because no partial sum ever exceeds 254.
4. So both recursive forms walk the entire tree: 490,054ns and 482,023ns.
5. The tabulated version takes 964ns, a factor of 500 over the better of the two.
6. But on an easy target the ranking reverses — at K = 253 the recursion answers in 2ns against tabulation's 928ns.
7. The recursion is unbeatable on an easy yes and unusable on a hard no; the table is simply flat, which is what makes it the safe default.

<!-- @visualization custom -->

<!-- @description -->
The take/skip tree for a = [1,2,3] with K = 3, drawn beside the counting version from the previous subtopic so the single operator change is the visual anchor. On the counting side every leaf lights and the numbers add upward; on this side, run the traversal and grey out each branch the moment it is skipped — the whole subtree under skipping 1 should collapse to grey as soon as the left half returns true, and a label should read never evaluated. Put the two call counts side by side beneath, count 15 and exists 6, and let a slider raise n so they diverge to 8,388,607 against 23 at n = 22. The trap panel is the centre and should show the same tree twice: once with the recursive calls inline in the or, once with them assigned to locals first, and in the second the greyed region never appears — every node lights. Annotate 23 calls against 8,388,607 and 2ns against 5,748,938ns, with a caption that the two source forms differ by one pair of local variables. Then the bound panel, which needs a different visual because it prunes on failure rather than success: draw the tree with a horizontal ceiling line at K, let each node's height represent its running sum, and colour any node above the line as abandoned. Run it for K low and K high on the same array so the abandoned region visibly shrinks from almost the whole tree to none of it, with the saving printed — 99.94% at K/total = 0.05 down to 0.00% above 0.75. Finally a four-bar chart for the hard case, K unreachable and high, with locals-first, short-circuit, short-circuit plus bound and tabulated at 4,490,875ns, 490,054ns, 482,023ns and 964ns on a log axis, captioned the one input where recursion has nothing left, and beside it the same four bars for an easy target where the ordering reverses and tabulation is the slowest.

<!-- @sampleInput -->
```json
{"primary":{"array":[1,2,3],"K":3,"answer":true,"form":"short-circuiting ||","trace":[{"call":"exists(0,0)","evaluates":"take branch first"},{"call":"exists(1,1)","note":"took 1"},{"call":"exists(2,3)","note":"took 2"},{"call":"exists(3,6)","leaf":true,"returns":false},{"call":"exists(3,3)","leaf":true,"returns":true,"note":"skipped 3 — sum equals K"}],"skipped":["the right operand of exists(1,1)","the entire half of the tree where 1 is not taken"],"callsCount":6,"countingVersionCalls":15,"reading":"the count had to visit all eight leaves to add them; this stops at the first yes"},"theOperator":{"count":"+","exists":"||","why":"addition needs both operands; or does not","atN22":{"array":"[1..22]","total":253,"fullTree":8388607,"K":253,"countCalls":8388607,"existsCalls":23,"factor":364722,"existsNs":2}},"theTrap":{"wrong":"bool take = f(...); bool skip = f(...); return take || skip;","right":"return f(...) || f(...);","why":"assigning to a local forces the call to complete before the or is reached","timingAtN22":[{"K":253,"found":true,"localsFirstNs":5748938,"shortCircuitNs":2},{"K":25,"found":true,"localsFirstNs":4509208,"shortCircuitNs":14740},{"K":3,"found":true,"localsFirstNs":4444125,"shortCircuitNs":122465},{"K":254,"found":false,"localsFirstNs":4490875,"shortCircuitNs":490054}],"flatnessIsTheGiveaway":"the locals-first column barely moves with the target","unreachableTargetCallCounts":{"localsFirst":8388607,"shortCircuit":8388607,"identical":true,"timeRatio":9.2,"cause":"code generation, not algorithm — the locals-first form keeps two booleans live across each call, blocking the tail-call shape"}},"boundPrune":{"rule":"if the running sum already exceeds K, no further additions can return to it","validOnlyFor":"non-negative elements","code":"if (sum == K) return true; if (i == n || sum > K) return false;","whyCountCannotDoThis":"returning early on sum == K undercounts a count by 2^(zeros); here a true is final","testArray":"[2,4,...,40], total 420, every odd K in range but unreachable","fullTree":2097151,"rows":[{"K":41,"shortCircuitCalls":2097151,"boundCalls":7883,"savedPct":99.62},{"K":99,"shortCircuitCalls":2097151,"boundCalls":172493,"savedPct":91.77},{"K":199,"shortCircuitCalls":2097151,"boundCalls":1457253,"savedPct":30.51},{"K":399,"shortCircuitCalls":2097151,"boundCalls":2097151,"savedPct":0.00}],"byFractionOfTotal":[{"fraction":0.05,"savedPct":99.94},{"fraction":0.10,"savedPct":99.56},{"fraction":0.25,"savedPct":89.80},{"fraction":0.50,"savedPct":23.15},{"fraction":0.75,"savedPct":0.24},{"fraction":0.95,"savedPct":0.00}],"mechanism":"sum > K can only fire if a partial sum can overshoot K, and the higher K sits relative to the total, the fewer branches do","cost":{"language":"Python","n":18,"targetAboveTotal":true,"shortCircuitNs":29338617,"withBoundNs":37000008,"penaltyPct":26,"reading":"the check runs at every node whether or not it can ever fire"}},"hardCase":{"description":"target unreachable AND high — neither prune can fire","n":22,"K":254,"rows":[{"form":"locals first","ns":4490875},{"form":"short-circuit","ns":490054},{"form":"short-circuit + bound","ns":482023},{"form":"tabulated","ns":964}],"tabulatedVsBestRecursive":500,"easyCaseReverses":{"K":253,"recursionNs":2,"tabulatedNs":928,"why":"the recursion stops after 23 calls; the table always fills every cell"},"summary":"the recursion is unbeatable on an easy yes and unusable on a hard no; tabulation is flat"},"carriedOver":{"zeros":"the base case must check the index for a COUNT; for existence the sum == K shortcut is safe because a true is final","negatives":"break the bound prune — the sum can overshoot K and come back, so abandoning that subtree discards real answers","complexity":"this is subset-sum, NP-complete in general; the O(n*K) table is pseudo-polynomial and only helps while K is small"},"verification":{"pairs":51992,"note":"all four implementations agreed on every (array, K) pair tested, with about a quarter of elements zero"}}
```

<!-- @highlights -->
- The take/skip tree for [1,2,3] with K = 3 sits beside the counting version, so the single operator change is the anchor.
- On the counting side every leaf lights and the numbers add upward.
- On this side each branch greys out the moment it is skipped, labelled never evaluated.
- The entire subtree under skipping 1 collapses to grey as soon as the left half returns true.
- Call counts sit beneath: count 15, exists 6, diverging to 8,388,607 against 23 as a slider raises n to 22.
- The trap panel shows the same tree twice — calls inline in the or, and calls assigned to locals first.
- In the second version the greyed region never appears and every node lights.
- It is annotated 23 calls against 8,388,607, and 2ns against 5,748,938ns.
- A caption notes the two source forms differ by one pair of local variables.
- The bound panel draws a horizontal ceiling at K, with each node's height representing its running sum.
- Nodes above the line are coloured as abandoned, which is pruning on failure rather than success.
- Running it for a low and a high K shrinks the abandoned region from almost the whole tree to none of it.
- The saving is printed alongside: 99.94% at K/total = 0.05 down to 0.00% above 0.75.
- A four-bar log-axis chart covers the hard case at 4,490,875, 490,054, 482,023 and 964 nanoseconds.
- It is captioned the one input where recursion has nothing left.
- Beside it the same four bars for an easy target, where the ordering reverses and tabulation is slowest.

<!-- @edgeCases -->
- K equal to zero — the empty subsequence always qualifies, so the answer is true for any array.
- An empty array with K = 0 — true, and with K non-zero, false.
- A negative K with non-negative elements — impossible, and the tabulated version must guard before sizing a row of K+1.
- K equal to the total of the array — found on the very first path, in n + 1 calls.
- K one more than the total — unreachable and high, the single worst case for both prunes.
- An array of all zeros with K = 0 — true immediately, and the sum == K shortcut is safe here because a true is final.
- Zeros present with K non-zero — harmless for existence, unlike counting where they multiply the answer.
- Negative values present — the bound prune becomes incorrect, not merely unhelpful.
- A target reachable only by skipping the first element — the take-first ordering explores the whole take-half before finding it.
- Very large K with a small array — the tabulated row costs O(K) regardless, so the recursion may be the cheaper choice.
- Writing | instead of || in C++ or Java — both branches are evaluated and the entire saving disappears.

<!-- @pitfalls -->
- Assigning both branches to locals before combining them. Both calls then complete regardless, turning 23 calls into 8,388,607 at n = 22.
- Using | instead of || in C++ or Java. The single-pipe operator does not short-circuit, so it has the same effect as assigning to locals.
- Assuming an existence check is always cheap. Short-circuiting helps only when the answer is yes; a target that does not exist costs the full tree.
- Applying the bound prune with negative values present. The running sum can pass K and return to it, so abandoning that subtree discards real answers.
- Expecting the bound prune to always help. Measured, it saved 99.94% at K equal to a twentieth of the total and 0.00% above three quarters of it.
- Forgetting that the bound check costs something. On an input where it can never fire it measured 26% slower than short-circuiting alone in Python.
- Carrying the sum == K early return into the counting version. It is safe here because a true is final, but it undercounts a count by 2^(number of zeros).
- Sizing the tabulated row without guarding a negative K. A vector of K+1 with K negative is a length error rather than a wrong answer.
- Iterating the tabulated inner loop upward. That allows an element to be reused and answers the unbounded version of the problem instead.
- Reaching for tabulation on easy targets. It fills every cell regardless, measuring 928ns against the recursion's 2ns when the answer is found on the first path.
- Treating the O(n · K) table as polynomial. Subset-sum is NP-complete; the table is pseudo-polynomial and becomes unusable as K grows.
- Testing only with targets that exist. The interesting failure mode of every version here is the negative answer, which is also the expensive one.

<!-- @doubt -->
### Why is this so much cheaper than counting the same thing?

<!-- @answer -->
Because or can stop and addition cannot. A count needs both operands to produce a sum, so every branch has to be evaluated and the tree is walked in full every time — the previous subtopic measured its best case and worst case as identical. An existence check needs only one true, so once the left branch succeeds the right is never evaluated. At n = 22 with K equal to the total of the array, counting makes 8,388,607 calls and this makes 23, a factor of 364,722. The code differs by one character.

<!-- @doubt -->
### I wrote it with two variables and it got slow — why?

<!-- @answer -->
Because assigning to a variable forces the call to complete. Writing bool take = exists(...) followed by bool skip = exists(...) runs both branches before the or is ever reached, so there is nothing left for it to skip. The or is still correct, just useless. Measured at n = 22, that form took about 4.5 million nanoseconds for every target tried, including one the short-circuiting version answered in 2ns. The giveaway is exactly that flatness: an existence check whose timing does not vary with the input is not short-circuiting. The same applies to using | rather than || in C++ or Java.

<!-- @doubt -->
### Does short-circuiting help when the answer is no?

<!-- @answer -->
Not at all. There is never a true to stop on, so every branch is evaluated and the full 2^(n+1)−1 calls are made — exactly as in the counting version. That is why the bound prune exists. What is interesting is that even in this case the short-circuiting form measured 9.2x faster than the locals-first one, despite making an identical number of calls — 8,388,607 for both. That difference is purely code generation: keeping two booleans live across each recursive call blocks the tail-call shape the compiler would otherwise use.

<!-- @doubt -->
### What is the bound prune and when does it help?

<!-- @answer -->
If every element is non-negative and the running sum has already passed K, no further additions can bring it back, so that entire subtree can be abandoned. It is the only prune in these three subtopics that makes a negative answer cheaper. How much it helps depends almost entirely on where K sits relative to the total of the array: measured on unreachable in-range targets, it saved 99.94% when K was a twentieth of the total, 89.80% at a quarter, 23.15% at half, and 0.00% above three quarters. The reason is that sum > K can only fire if a partial sum can overshoot K, and high targets are rarely overshot.

<!-- @doubt -->
### Is there a downside to adding the bound check?

<!-- @answer -->
Yes, and it is easy to overlook. The comparison runs at every node whether or not it ever succeeds. In C++ that is lost in the noise, but Python makes it visible: on a target above the total of the array, where the check can never fire, the bound version measured 37,000,008ns against 29,338,617ns for short-circuiting alone — **26% slower** for a test that cannot possibly help. Pruning is a bet on the input, and this is the cost of losing it. It is still usually worth taking, because the upside is two orders of magnitude and the downside is a quarter.

<!-- @doubt -->
### Why can I return early on sum == K here but not when counting?

<!-- @answer -->
Because a true is final and a count is not. Once one subsequence reaches K, the answer to "does one exist" cannot change, so stopping is safe at any depth. A count has to keep going, because the elements not yet decided may form further qualifying subsequences — and in particular any remaining zeros can be taken or skipped freely, each doubling the answer. The previous subtopic measured exactly that: the same shortcut applied to a count returned 1 where the true answer was 8. Same line of code, correct in one problem and wrong in the other.

<!-- @doubt -->
### When should I use the table instead?

<!-- @answer -->
When the answer is likely to be no, or when you cannot afford the worst case. The recursion's cost swings enormously with the input — 2ns for an easy yes, 490,054ns for a hard no at n = 22 — while tabulation is flat at around 964ns because it fills every cell regardless. That makes it 500x faster than the best recursive form on the hard case and about 460x slower on the easy one. If you only ever ask about targets that exist and are found quickly, the recursion wins; for anything adversarial or unknown, the table is the safe default because it has no bad case.

<!-- @doubt -->
### Does the order of the two branches matter?

<!-- @answer -->
It decides which answers are found quickly. Taking first walks straight down to the full-set leaf, so a target equal to the total is reached in n + 1 calls — that is the 23-call measurement. Swapping the operands explores skip-first, which finds small-sum answers fast and large-sum answers slowly. Sorting the array descending before searching makes the running sum overshoot sooner, which sharpens the bound prune, but it costs an O(n log n) sort that only pays back when the search would otherwise be long. None of these orderings changes the worst case; they only move which inputs land in the good case.

<!-- @doubt -->
### What breaks if the array has negative numbers?

<!-- @answer -->
The bound prune becomes wrong rather than merely useless. With a negative element present, a running sum that has passed K can come back down to it, so abandoning that subtree discards genuine answers. The short-circuiting form is still correct, because it makes no assumption about the direction the sum moves. The tabulated version needs the row offset by the smallest reachable total and widened to the whole range of sums, and the downward loop direction has to be reconsidered. Most statements of this problem restrict the input to non-negative values for exactly this reason.

<!-- @doubt -->
### Isn't this problem NP-complete?

<!-- @answer -->
Yes — this is subset-sum, and the general decision problem is NP-complete. That is not contradicted by the O(n · K) table, because K is a *value* rather than a size: writing K down takes log K bits, so a table of K entries is exponential in the length of the input even though it looks linear. That is what pseudo-polynomial means. In practice it is an excellent algorithm whenever K is small and useless when K is large, which is why competitive problems that use it always bound the target explicitly. The recursion has no such restriction and no such guarantee.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
The topic leaves subsequences for a while and picks up Recursive Implementation of atoi(), where recursion is applied to parsing rather than search — each frame consumes one character, and the interesting work is in the failure and overflow cases rather than in exploring a tree. The subsequence tree returns later with Combination Sum, which keeps this exact take/skip shape but allows an element to be chosen more than once. That turns the binary decision into an unbounded one and, notably, changes the tabulated inner loop from counting downward to counting upward — the same one-line difference this subtopic warned about.
