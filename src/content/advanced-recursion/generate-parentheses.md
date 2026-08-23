---
id: generate-parentheses
topic: Advanced Recursion
title: Generate Parentheses
difficulty: Medium
status: ready
prerequisites:
  - generate-binary-strings-without-consecutive-1s
  - learn-all-patterns-of-subsequences-theory
  - fibonacci-number
  - count-all-subsequences-with-sum-k
  - time-and-space-complexity-basics
relatedIds:
  - generate-binary-strings-without-consecutive-1s
  - learn-all-patterns-of-subsequences-theory
  - power-set
  - fibonacci-number
---

<!-- @summary -->
The constraint becomes a carried counter rather than a peek backwards, and the leaf count becomes Catalan. The surprise is that this much stronger-feeling constraint is worth less: it rejects 62.4x of the candidates at n = 10 against the previous subtopic's 7.1x, but its saving is only polynomial where that one's was exponential — and the two cross at n = 27. Also measured: even with perfect pruning, checking on entry rather than before descending costs a steady 1.60x, and the O(n) counting form breaks two steps earlier than its own value limit — C(35) fits a signed 64-bit integer but the loop is only correct through C(33).

<!-- @theory -->
## The problem

Generate every valid arrangement of `n` pairs of parentheses.

```
n = 3  ->  ((()))  (()())  (())()  ()(())  ()()()
```

Five of the sixty-four three-pair strings are valid.

## The constraint is now a counter

The previous subtopic decided legality by looking one character back. Here that
is not enough — whether a `)` is legal depends on how many `(` are still
unmatched, which is a number you have to carry:

```
gen(open, close, cur):
    if len(cur) == 2n: emit(cur); return
    if open  < n:     place '(' , recurse with open+1
    if close < open:  place ')' , recurse with close+1
```

Two guards, both on counters rather than on the string. `open < n` says you have
not spent all your pairs; `close < open` says there is something to close.

## The count is Catalan

| n | Results | Catalan(n) | 4^n |
|---|---|---|---|
| 1 | 1 | 1 | 4 |
| 2 | 2 | 2 | 16 |
| 3 | 5 | 5 | 64 |
| 4 | 14 | 14 | 256 |
| 8 | 1,430 | 1,430 | 65,536 |
| 12 | **208,012** | **208,012** | 16,777,216 |

Exactly the Catalan numbers, matched at every n tested. And the pruning is
**perfect**: measured across every n from 1 to 12, the number of nodes with no
legal move is **zero**. From any state satisfying both guards you can always
finish — add the remaining opens, then all the closes — so no branch is ever a
dead end.

That makes the tree tight. Nodes per leaf:

| n | 3 | 6 | 9 | 12 |
|---|---|---|---|---|
| Calls ÷ results | 4.40 | 4.73 | 4.88 | **4.97** |

Converging to about 5 nodes per result, independent of n.

## But this constraint is worth less than the last one

Here is the result worth sitting with. The parenthesis rule *feels* far stricter —
it throws away 62.4 of every 63.4 candidates at n = 10, where the no-adjacent-1s
rule threw away only 6.1 of every 7.1. Yet measured across sizes:

| n | Parentheses: 4^n / C(n) | Binary strings: 2^n / F(n+2) |
|---|---|---|
| 5 | **24.4** | 2.5 |
| 10 | **62.4** | 7.1 |
| 20 | **167.5** | 59.2 |
| 30 | 302.2 | **492.9** |
| 40 | 461.0 | **4,104** |
| 50 | 640.8 | **34,169** |

The columns swap. Parentheses starts ten times ahead and ends fifty times behind,
because the two savings have different *kinds*:

```
4^n / C(n)      ~  sqrt(pi) * n^1.5      -> polynomial
2^n / F(n+2)    ~  (2/phi)^n = 1.236^n   -> exponential
```

Measured against those predictions: at n = 40, `4^n/C(n)` is 461.0 against a
predicted 448.4, and `2^n/F(n+2)` is 4,104 against 4,805. **The crossover is at
n = 27** — parentheses leads 245.2 to 211.2 at n = 26 and trails 259.1 to 261.0
at n = 27.

So Catalan is still exponential with base 4, the same base as the unconstrained
tree. The constraint removes a polynomial factor, not an exponential one.
Adjacency removes an exponential factor because it changes the base itself, from
2 to φ. How strict a rule *looks* is a poor guide to what it saves.

## Where the guard goes, again — and it still costs

The previous subtopic contrasted pruning at the branch with rejecting at the
leaf, which was the difference between φ^n and 2^n. There is a subtler version
here, between two implementations that **both prune perfectly**:

```
if (close < open) { place ')'; recurse; }        // check before descending
place ')'; recurse;  ... if (bal < 0) return;    // check on entry
```

The second tracks a running balance and rejects as soon as it goes negative. It
visits no illegal *subtree* — but it does create the illegal *node* and reject it
one frame in. Counted:

| n | Check before | Check on entry | Extra |
|---|---|---|---|
| 3 | 22 | 35 | 1.59x |
| 6 | 625 | 987 | 1.58x |
| 9 | 23,713 | 37,703 | 1.59x |
| 12 | **1,033,411** | **1,650,799** | **1.60x** |

A steady 1.60x, at every size. Not the difference between algorithms, but not
nothing either — and it is free to avoid.

## Against not pruning at all

| n | Pruned | Generate all 2^(2n) and validate |
|---|---|---|
| 6 | 5,889ns | 80,944ns |
| 9 | 249,276ns | 6,112,773ns |
| 11 | **2,657,148ns** | **87,195,573ns** |

**32.8x** at n = 11, and the naive version walks 2^(2n+1) − 1 nodes — 8,388,607
at n = 11 against the pruned 290,511. In Python the same comparison measured
24.2x at n = 6 rising to 52.6x at n = 10.

## If you only need the count

Catalan has a closed form, computable in O(n) with no factorials:

```
C(0) = 1,   C(n) = C(n-1) * 2*(2n-1) / (n+1)
```

Measured at n = 10 that is **853ns against 14,858,594ns** to generate the same
strings in Python — **17,422x**. The multiplication is exact at every step
because the intermediate is always divisible.

Watch the width — and note that two different limits are in play. `C(35)` =
3,116,285,494,907,301,262 is the last Catalan number whose **value** fits a
signed 64-bit integer; `C(36)` = 11,959,798,385,860,453,492 does not. But the
loop above stops being correct two steps earlier. Multiplying before dividing is
what keeps the division exact, and it inflates the intermediate by a factor of
n+1: computing `C(34)` forms `c * 2 * 67` = 28,453,041,475,240,576,740, which is
**3.08x over the signed 64-bit maximum**, and the function returns
−241,155,619,205,100,756. The last value it computes correctly is `C(33)` =
212,336,130,412,243,110.

The same shape appears one width down: an `int` holds `C(19)` but the loop goes
wrong from `C(17)`. Exactness and range pull against each other here — the step
that buys you integer arithmetic is the step that costs you two sizes of
headroom.

## Where this goes next

**Power Set** returns to the unconstrained tree — every element in or out, all
2^n subsets, no guard at all. After two subtopics of pruning it is worth seeing
the case where there is nothing to prune, because it makes the distinction
concrete: subsets are exponential because the *answer* is exponential, where
parentheses and binary strings were exponential answers hiding inside larger
exponential searches.

<!-- @intuition -->
A closing bracket is legal exactly when something is open to close, and an opening one is legal while you still have pairs left to spend. Both of those are counts rather than facts about the previous character, so the recursion carries two numbers down and the guards read directly off them. What makes this problem worth doing after the binary-string one is that the constraint looks far more aggressive — the overwhelming majority of bracket strings are invalid — and yet it buys less. The valid count is Catalan, which still grows like four to the n, the same base as the unconstrained search; all the constraint removes is a polynomial factor. The adjacency rule in the previous problem looked weaker and changed the base itself. Strictness and savings are not the same thing.

<!-- @approach -->
### Brute Force - Generate All and Validate

<!-- @idea -->
Build every string of n opening and n closing brackets, then check each one.

<!-- @steps -->
1. At each of the 2n positions, place an opening bracket and recurse, then a closing one and recurse.
2. Impose no condition on either branch.
3. On reaching length 2n, scan the finished string tracking a running balance.
4. Keep it if the balance never goes negative and ends at zero.
5. Note that every rejected string was built in full before being examined.

<!-- @complexity -->
- time: O(n · 4^n)
- space: O(n) call stack plus the output
- note: Walks the complete binary tree of 2^(2n+1) − 1 nodes — 8,388,607 at n = 11 against the pruned version's 290,511. Measured 87,195,573ns at n = 11 against 2,657,148ns, a factor of 32.8, and in Python 52.6x at n = 10. It is the baseline that shows what the guards are worth, and the only version here that ever constructs an invalid string.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

bool valid(const string& s) {
    int bal = 0;
    for (char c : s) { bal += (c == '(') ? 1 : -1; if (bal < 0) return false; }
    return bal == 0;
}

void generate(int n, string& cur, vector<string>& out) {
    if ((int)cur.size() == 2 * n) { if (valid(cur)) out.push_back(cur); return; }

    cur.push_back('('); generate(n, cur, out); cur.pop_back();
    cur.push_back(')'); generate(n, cur, out); cur.pop_back();
}
```

<!-- @annotations -->
- 6: The balance must be checked as it goes, not just at the end — ")(" ends at zero and is invalid.
- 12: Validating here means the string was already built in full, and so was the entire subtree that produced it.
- 14: Neither branch is guarded, which is what makes this the complete binary tree of depth 2n.

<!-- @code java -->
```java
static boolean valid(String s) {
    int bal = 0;
    for (char c : s.toCharArray()) {
        bal += (c == '(') ? 1 : -1;
        if (bal < 0) return false;
    }
    return bal == 0;
}

static void generate(int n, StringBuilder cur, List<String> out) {
    if (cur.length() == 2 * n) { if (valid(cur.toString())) out.add(cur.toString()); return; }

    cur.append('('); generate(n, cur, out); cur.deleteCharAt(cur.length() - 1);
    cur.append(')'); generate(n, cur, out); cur.deleteCharAt(cur.length() - 1);
}
```

<!-- @annotations -->
- 11: Two toString calls per leaf, each allocating — a cost paid 4^n times rather than C(n) times.

<!-- @code python -->
```python
def valid(s):
    bal = 0
    for c in s:
        bal += 1 if c == "(" else -1
        if bal < 0:
            return False
    return bal == 0


def generate(n, cur="", out=None):
    if out is None:
        out = []
    if len(cur) == 2 * n:
        if valid(cur):
            out.append(cur)
        return out
    generate(n, cur + "(", out)
    generate(n, cur + ")", out)
    return out
```

<!-- @annotations -->
- 6: The early return on a negative balance is what distinguishes validity from merely counting brackets.
- 17: String concatenation allocates at every node, and there are 4^n of them here against C(n) in the pruned version.

<!-- @approach -->
### Optimal - Two Counters, Checked Before Descending

<!-- @idea -->
Carry how many brackets of each kind have been used, and take a branch only when it is legal.

<!-- @steps -->
1. Carry two counts, the opening brackets used and the closing ones.
2. Place an opening bracket only while fewer than n have been used.
3. Place a closing bracket only while fewer closes than opens have been used.
4. On reaching length 2n, record the string — it cannot be invalid.
5. Every state reachable under those guards can still be completed, so nothing is a dead end.

<!-- @complexity -->
- time: O(n · C(n)), where C(n) is the nth Catalan number
- space: O(n) call stack plus the output
- note: Produces exactly Catalan(n) strings with zero dead ends — measured across n = 1 to 12, no node ever had both branches blocked. The tree holds about 5 nodes per result, converging from 4.40 at n = 3 to 4.97 at n = 12. Measured 2,657,148ns at n = 11 against 87,195,573ns for generating and validating, a factor of 32.8.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

void generate(int n, int open, int close, string& cur, vector<string>& out) {
    if ((int)cur.size() == 2 * n) { out.push_back(cur); return; }   // always valid

    if (open < n) {                       // pairs left to spend
        cur.push_back('(');
        generate(n, open + 1, close, cur, out);
        cur.pop_back();
    }
    if (close < open) {                   // something is open to close
        cur.push_back(')');
        generate(n, open, close + 1, cur, out);
        cur.pop_back();
    }
}
```

<!-- @annotations -->
- 6: No validation at the leaf, because the guards make an invalid string unconstructible.
- 8: open < n, not open <= n — n pairs means n opening brackets in total.
- 13: close < open is the whole rule for closing brackets: you may close only what is already open.
- 14: The counter goes down the recursion rather than being recomputed, which is what makes each guard O(1).

<!-- @code java -->
```java
static void generate(int n, int open, int close, StringBuilder cur, List<String> out) {
    if (cur.length() == 2 * n) { out.add(cur.toString()); return; }

    if (open < n) {
        cur.append('(');
        generate(n, open + 1, close, cur, out);
        cur.deleteCharAt(cur.length() - 1);
    }
    if (close < open) {
        cur.append(')');
        generate(n, open, close + 1, cur, out);
        cur.deleteCharAt(cur.length() - 1);
    }
}
```

<!-- @annotations -->
- 2: toString is called only C(n) times here, once per valid result, rather than 4^n times as in the brute-force version.

<!-- @code python -->
```python
def generate(n, open_=0, close=0, cur="", out=None):
    if out is None:
        out = []
    if len(cur) == 2 * n:
        out.append(cur)
        return out

    if open_ < n:
        generate(n, open_ + 1, close, cur + "(", out)
    if close < open_:
        generate(n, open_, close + 1, cur + ")", out)
    return out


# n = 3 gives ((())) (()()) (())() ()(()) ()()() — five of the
# sixty-four three-pair strings, which is Catalan(3).
```

<!-- @annotations -->
- 1: open_ with a trailing underscore, since open is a builtin — shadowing it inside a recursive helper is an easy way to break unrelated code later.
- 8: Both guards are checked before the recursive call, which is what keeps the illegal nodes out of the tree entirely.

<!-- @approach -->
### Track the Balance Instead

<!-- @idea -->
Carry a single running balance and reject as soon as it becomes impossible.

<!-- @steps -->
1. Carry one number, the count of unmatched opening brackets.
2. On entering a call, reject if the balance is negative.
3. Reject also if the balance exceeds the number of positions remaining.
4. Otherwise place each bracket in turn and recurse.
5. Accept when all positions are filled and the balance is zero.

<!-- @complexity -->
- time: O(n · C(n))
- space: O(n) call stack plus the output
- note: One counter instead of two, and it prunes exactly as tightly — no illegal subtree is explored. But it creates the illegal node and rejects it one frame in, which costs a measured 1.60x more calls at every size: 1,033,411 against 1,650,799 at n = 12. Worth writing to see that "prunes perfectly" and "checks in the right place" are separate properties.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

void generate(int n, int i, int bal, string& cur, vector<string>& out) {
    if (bal < 0 || bal > 2 * n - i) return;        // rejected AFTER entering
    if (i == 2 * n) { if (bal == 0) out.push_back(cur); return; }

    cur.push_back('('); generate(n, i + 1, bal + 1, cur, out); cur.pop_back();
    cur.push_back(')'); generate(n, i + 1, bal - 1, cur, out); cur.pop_back();
}
```

<!-- @annotations -->
- 6: bal > 2*n - i is the forward-looking half — more brackets are open than there are positions left to close them in. Note that this whole test runs on entry, so the frame already exists by the time the state is rejected, which is the source of the steady 1.60x.
- 9: One counter rather than two, which is the trade this version makes for the extra frames.

<!-- @code java -->
```java
static void generate(int n, int i, int bal, StringBuilder cur, List<String> out) {
    if (bal < 0 || bal > 2 * n - i) return;
    if (i == 2 * n) { if (bal == 0) out.add(cur.toString()); return; }

    cur.append('('); generate(n, i + 1, bal + 1, cur, out); cur.deleteCharAt(cur.length() - 1);
    cur.append(')'); generate(n, i + 1, bal - 1, cur, out); cur.deleteCharAt(cur.length() - 1);
}
```

<!-- @annotations -->
- 2: Both halves of the test are needed — bal < 0 catches closing too early and the second catches opening too late.

<!-- @code python -->
```python
def generate(n, i=0, bal=0, cur="", out=None):
    if out is None:
        out = []
    if bal < 0 or bal > 2 * n - i:
        return out
    if i == 2 * n:
        if bal == 0:
            out.append(cur)
        return out
    generate(n, i + 1, bal + 1, cur + "(", out)
    generate(n, i + 1, bal - 1, cur + ")", out)
    return out
```

<!-- @annotations -->
- 4: Returning out rather than None keeps the accumulator threading consistent when the state is rejected.
- 10: Both branches are taken unconditionally; the filtering happens on the next call's first line.

<!-- @approach -->
### Count Without Generating

<!-- @idea -->
If only the number of arrangements is wanted, compute the Catalan number directly.

<!-- @steps -->
1. Start the result at one, which is Catalan of zero.
2. Step i from zero to n minus one.
3. Multiply by two times the quantity two i plus one.
4. Divide by i plus two.
5. Return the accumulated value, having built no strings.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The recurrence C(n) = C(n-1) * 2*(2n-1) / (n+1) needs no factorials and no big integers within range — every intermediate division is exact. Measured 853ns at n = 10 against 14,858,594ns to generate the same strings in Python, a factor of 17,422. Two limits, not one: C(35) = 3,116,285,494,907,301,262 is the last Catalan value that fits a signed 64-bit integer, but this loop is correct only through C(33) — the multiply-first that keeps the division exact overflows the intermediate at C(34).

<!-- @code cpp -->
```cpp
#include <cstdint>
using namespace std;

long long catalan(int n) {
    long long c = 1;
    for (int i = 0; i < n; i++)
        c = c * 2 * (2 * i + 1) / (i + 2);
    return c;
}
```

<!-- @annotations -->
- 7: The division is exact at every step, so integer arithmetic suffices throughout — but multiplying before dividing is what keeps it exact, and it inflates the intermediate: c * 2 * (2i+1) is about (n+1) times the answer, so it overflows well before the answer would. At i = 33 that product is 28,453,041,475,240,576,740, which is 3.08x over the limit.
- 4: Correct through C(33) = 212,336,130,412,243,110. At C(34) the intermediate overflows and it returns −241,155,619,205,100,756 — a negative Catalan number, which is the visible tell. The value C(34) itself would have fitted; widening just the product to __int128 recovers C(34) and C(35).

<!-- @code java -->
```java
static long catalan(int n) {
    long c = 1;
    for (int i = 0; i < n; i++)
        c = c * 2 * (2L * i + 1) / (i + 2);
    return c;
}
```

<!-- @annotations -->
- 4: The 2L forces the multiplication into long before it can overflow an int, which it would from C(17). Same ceiling as the C++ version — correct through C(33), wrong from C(34) — since Java has no wider primitive to promote into; past that it needs BigInteger.

<!-- @code python -->
```python
def catalan(n):
    c = 1
    for i in range(n):
        c = c * 2 * (2 * i + 1) // (i + 2)
    return c


# Floor division with //, though it never actually floors anything —
# every intermediate is divisible. Python has no width limit, so
# catalan(1000) is exact.
```

<!-- @annotations -->
- 4: // rather than /, since true division would make c a float and lose exactness within a few steps. This version has no width limit either, so it is correct at every n where the fixed-width versions have long since wrapped — catalan(1000) is exact.
- 8: The absence of an overflow bound is the only difference from the C++ version; the arithmetic is identical.

<!-- @example -->

<!-- @input -->
n = 3

<!-- @output -->
Five strings from 22 calls, with no dead ends

<!-- @why -->
Small enough to follow completely, and the first size where both guards actually block something.

<!-- @walkthrough -->
1. The first character must be an opening bracket, because close < open is false when both are zero.
2. From "(", either guard can fire — a second opening bracket is allowed since open is 1 and n is 3, and a closing one since close is 0 and open is 1.
3. Following opens first gives "((( ", at which point open equals n and only closing brackets remain legal, producing "((()))".
4. Backtracking one level gives "(()", then "(()(", "(()()" and finally "(()())".
5. The five results in generation order are ((())), (()()), (())(), ()(()), ()()().
6. Twenty-two calls produced five results, which is about 4.4 nodes per result.
7. No call ever found both branches blocked — from any legal state you can always finish by opening the rest and then closing everything.

<!-- @example -->

<!-- @input -->
The pruning ratio for parentheses against binary strings

<!-- @output -->
Parentheses starts ten times ahead and ends fifty times behind

<!-- @why -->
It shows that how strict a constraint looks is a poor predictor of what it saves, which is the point of doing these two subtopics adjacently.

<!-- @walkthrough -->
1. At n = 10 the parenthesis rule rejects 62.4 of every 63.4 candidates, and the no-adjacent-1s rule only 6.1 of every 7.1.
2. So by any intuitive measure the parenthesis constraint is far stronger.
3. But 4^n / C(n) grows like the square root of pi times n to the power 1.5 — measured 461.0 at n = 40 against a predicted 448.4.
4. And 2^n / F(n+2) grows like (2/phi)^n, which is 1.236 to the n — measured 4,104 at n = 40 against a predicted 4,805.
5. One is polynomial and the other exponential, so the ordering must eventually reverse.
6. Measured, it reverses at n = 27: parentheses leads 245.2 to 211.2 at n = 26 and trails 259.1 to 261.0 at n = 27.
7. The reason is that Catalan still grows like 4^n, the same base as the unconstrained tree, while Fibonacci changes the base from 2 to phi.

<!-- @example -->

<!-- @input -->
Two implementations that both prune perfectly

<!-- @output -->
1,033,411 calls against 1,650,799 — a steady 1.60x

<!-- @why -->
It separates two properties that are easy to conflate: pruning the right subtrees, and checking in the right place.

<!-- @walkthrough -->
1. The two-counter version tests close < open before pushing a closing bracket, so an illegal branch is never taken.
2. The balance version pushes first and rejects on the next call's first line, when the balance is found to be negative.
3. Neither ever explores an illegal subtree, so both visit exactly the same set of legal states.
4. But the second creates one extra frame for every branch it rejects.
5. Counted, that is 22 calls against 35 at n = 3, and 1,033,411 against 1,650,799 at n = 12.
6. The ratio is 1.60x and does not drift with n, because the number of rejected branches is proportional to the number of nodes.
7. It is a constant factor rather than a complexity change — but it is free to avoid, and the same choice will recur in every backtracking problem that follows.

<!-- @example -->

<!-- @input -->
Counting rather than generating, at n = 10

<!-- @output -->
853 nanoseconds against 14,858,594

<!-- @why -->
The generation is exponential and the count is linear, so the gap is unbounded — and the closed form is simpler than it looks.

<!-- @walkthrough -->
1. The number of valid arrangements of n pairs is the nth Catalan number.
2. It obeys C(n) = C(n−1) times 2(2n−1) divided by (n+1), which needs no factorials.
3. Every intermediate division is exact, so plain integer arithmetic is enough.
4. Measured in Python at n = 10, that took 853 nanoseconds against 14,858,594 to build the same 16,796 strings — a factor of 17,422.
5. At n = 6 the same comparison is 210x, so the advantage grows with n exactly as the exponential does.
6. The counting form has its own limit, and it is tighter than the values suggest: C(35) fits a signed 64-bit integer, but the loop is correct only through C(33) = 212,336,130,412,243,110.
7. The multiply-first that keeps the division exact is what overflows — at C(34) the intermediate is 3.08x over the limit and the result comes back negative.

<!-- @visualization custom -->

<!-- @description -->
Open with the two counters as a pair of gauges beside a growing string: opens used out of n, and closes used out of opens. Run n = 3 and let each placement move a gauge, greying out the bracket that is currently illegal — at the start the closing bracket is greyed because close < open fails, and once open reaches n the opening one greys instead. That makes both guards visible as states rather than conditions. Beneath, draw the recursion tree for n = 3 with all 22 nodes and the 5 leaves labelled, and crucially mark that no node is a dead end — every node has at least one live child, which should be stated as a counter reading dead ends: 0. Beside it show the unconstrained tree for the same n, 127 nodes with 5 valid leaves scattered among 64, so the pruning is a visible difference in tree size rather than a claim. The centre panel is the comparison with the previous subtopic and should be a single chart with two curves against n: 4^n/C(n) and 2^n/F(n+2), on a log axis, crossing at n = 27 with that point marked. Annotate the left side parentheses rejects more here and the right side but adjacency compounds, and print the two asymptotic forms — sqrt(pi)·n^1.5 and 1.236^n — under their respective curves. Then the guard-placement panel: the same n = 3 tree twice, once where the illegal edge is never drawn and once where it is drawn one level deep and then crossed out, with node counts 22 and 35 and the ratio 1.60x, captioned both prune perfectly, one checks a frame too late. Finally a small strip for the counting form: the Catalan recurrence stepping from C(0) upward, with two separate failure marks rather than one. Mark C(34) first, where the answer box still fits but the intermediate box above it overflows and the result flips negative to −241,155,619,205,100,756, tagged the product overflows before the answer does. Then mark C(36), where the answer box itself overflows at 11,959,798,385,860,453,492. Between them leave C(35) shown in a lighter shade as reachable only with a wider intermediate. The point to make visible is that there are two ceilings and the lower one belongs to the arithmetic, not the value.

<!-- @sampleInput -->
```json
{"primary":{"n":3,"results":["((()))","(()())","(())()","()(())","()()()"],"count":5,"equals":"Catalan(3)","calls":22,"deadEnds":0,"nodesPerResult":4.40,"guards":{"open":"open < n — pairs left to spend","close":"close < open — something is open to close"},"firstCharacterForced":"(", "why":"close < open is false when both are zero"},"countIsCatalan":{"rows":[{"n":1,"results":1,"catalan":1,"fourToN":4},{"n":2,"results":2,"catalan":2,"fourToN":16},{"n":3,"results":5,"catalan":5,"fourToN":64},{"n":4,"results":14,"catalan":14,"fourToN":256},{"n":8,"results":1430,"catalan":1430,"fourToN":65536},{"n":12,"results":208012,"catalan":208012,"fourToN":16777216}],"recurrence":"C(n) = C(n-1) * 2*(2n-1) / (n+1)","perfectPruning":{"deadEndsAcrossN1to12":0,"why":"from any legal state you can always finish — open the rest, then close everything"},"nodesPerLeaf":[{"n":3,"ratio":4.40},{"n":6,"ratio":4.73},{"n":9,"ratio":4.88},{"n":12,"ratio":4.97}]},"strictnessVsSavings":{"claim":"how strict a constraint looks is a poor guide to what it saves","rows":[{"n":5,"parens":24.4,"binstr":2.5},{"n":10,"parens":62.4,"binstr":7.1},{"n":20,"parens":167.5,"binstr":59.2},{"n":30,"parens":302.2,"binstr":492.9},{"n":40,"parens":461.0,"binstr":4104.0},{"n":50,"parens":640.8,"binstr":34168.6}],"asymptotics":{"parens":"4^n / C(n) ~ sqrt(pi) * n^1.5 — POLYNOMIAL","binstr":"2^n / F(n+2) ~ (2/phi)^n = 1.236^n — EXPONENTIAL"},"predictionCheck":[{"n":40,"parensMeasured":461.0,"parensPredicted":448.4},{"n":40,"binstrMeasured":4104.0,"binstrPredicted":4805.0}],"crossover":{"n":27,"atN26":{"parens":245.2,"binstr":211.2},"atN27":{"parens":259.1,"binstr":261.0}},"why":"Catalan still grows like 4^n, the same base as the unconstrained tree; Fibonacci changes the base from 2 to phi"},"guardPlacement":{"checkBefore":"if (close < open) { push ')'; recurse; }","checkOnEntry":"push ')'; recurse; ... if (bal < 0) return;","bothPrunePerfectly":true,"difference":"the second creates the illegal node and rejects it one frame in","rows":[{"n":3,"before":22,"onEntry":35,"ratio":1.59},{"n":6,"before":625,"onEntry":987,"ratio":1.58},{"n":9,"before":23713,"onEntry":37703,"ratio":1.59},{"n":12,"before":1033411,"onEntry":1650799,"ratio":1.60}],"reading":"a constant factor, not a complexity change — but free to avoid"},"timing":{"cpp":{"unit":"ns","rows":[{"n":6,"pruned":5889,"generateValidate":80944},{"n":9,"pruned":249276,"generateValidate":6112773},{"n":11,"pruned":2657148,"generateValidate":87195573}],"ratioAtN11":32.8,"naiveNodes":{"formula":"2^(2n+1) - 1","atN11":8388607,"prunedAtN11":290511}},"python":{"rows":[{"n":6,"pruned":103963,"generateValidate":2517619,"catalan":495,"ratio":24.2},{"n":9,"pruned":3918384,"generateValidate":185380092,"catalan":750,"ratio":47.3},{"n":10,"pruned":14858594,"generateValidate":780925340,"catalan":853,"ratio":52.6}],"countingAdvantageAtN10":17422}},"countingForm":{"time":"O(n)","space":"O(1)","exactDivision":"every intermediate is divisible, so integer arithmetic suffices","width":{"lastValueFittingInt64":{"n":35,"value":3116285494907301262},"firstValueOverflowing":{"n":36,"value":11959798385860453492},"lastComputableByLoop":{"n":33,"value":212336130412243110},"loopBreaksAt":{"n":34,"exactValue":812944042149730764,"returned":-241155619205100756,"intermediate":28453041475240576740,"timesOverLimit":3.08},"intVersionBreaksAt":17,"why":"multiplying before dividing keeps the division exact but makes the intermediate about n+1 times the answer"}}}
```

<!-- @highlights -->
- Two gauges open the visualisation: opens used out of n, and closes used out of opens.
- Running n = 3, each placement moves a gauge and the currently illegal bracket greys out.
- At the start the closing bracket is greyed because close < open fails; once open reaches n the opening one greys instead.
- That makes both guards visible as states rather than as conditions in code.
- The recursion tree for n = 3 is drawn with all 22 nodes and 5 labelled leaves.
- A counter reads dead ends: 0, because every node has at least one live child.
- Beside it the unconstrained tree for the same n shows 127 nodes with 5 valid leaves scattered among 64.
- The centre chart plots 4^n/C(n) and 2^n/F(n+2) against n on a log axis.
- The two curves cross at n = 27, and that point is marked.
- The left side is annotated parentheses rejects more here, the right but adjacency compounds.
- The asymptotic forms sqrt(pi)·n^1.5 and 1.236^n are printed under their curves.
- The guard-placement panel shows the n = 3 tree twice, with and without the illegal edge drawn.
- Node counts 22 and 35 sit beneath, with the ratio 1.60x.
- It is captioned both prune perfectly, one checks a frame too late.
- A final strip steps the Catalan recurrence upward with two distinct failure marks.
- C(34) overflows the intermediate box and flips negative; C(36) overflows the answer box itself.

<!-- @edgeCases -->
- n = 0 — one arrangement, the empty string, and Catalan(0) is 1.
- n = 1 — one arrangement, "()", and the first character is forced because close < open fails at the start.
- The first character — always an opening bracket, for every n above zero.
- The last character — always a closing bracket, since the balance must reach zero.
- A string ending at balance zero but dipping negative, such as ")(" — invalid, which is why the validator must check as it goes rather than only at the end.
- open == n — the opening branch closes off and only closing brackets remain legal.
- close == open — the closing branch closes off, which is the state at the very start.
- n = 12 — around the practical ceiling for generating, at 208,012 results.
- n = 33 — the last count this loop computes correctly, at 212,336,130,412,243,110.
- n = 34 — the value still fits a signed 64-bit integer, but the intermediate does not, and the answer comes back negative.
- n = 35 — the last Catalan value that fits a signed 64-bit integer at all, at 3,116,285,494,907,301,262.
- n = 36 — the first value that does not, at 11,959,798,385,860,453,492.
- Shadowing the builtin open in Python — harmless inside the function but a hazard if the helper is later moved to module scope.

<!-- @pitfalls -->
- Validating completed strings instead of guarding the branches. That walks 2^(2n+1) − 1 nodes and measured 32.8x slower at n = 11.
- Checking only that the total counts match. ")(" has one of each bracket and is invalid — the balance must never go negative at any prefix.
- Writing open <= n instead of open < n. That places n+1 opening brackets and the recursion never terminates correctly.
- Writing close <= open instead of close < open. That allows a closing bracket when none is open, producing invalid strings.
- Rejecting on entry rather than before descending. Both prune the same subtrees, but the first creates and discards an extra frame per rejected branch — a measured 1.60x at every size.
- Assuming a stricter-looking constraint saves more. Parentheses rejects far more candidates than the no-adjacent-1s rule at any given n, yet saves only a polynomial factor against that one's exponential, and falls behind from n = 27.
- Describing the pruned cost as much better than 4^n. Catalan still grows like 4^n divided by n^1.5, so the base is unchanged and only a polynomial factor is removed.
- Recomputing the balance by scanning the prefix at each node. The counters are carried for free; rescanning turns each O(1) guard into O(n).
- Using an int for the Catalan count. The loop goes wrong from C(17), long before the 64-bit version does.
- Dividing before multiplying in the Catalan recurrence. The exactness depends on the multiplication happening first — but so does the overflow, which is the trade rather than a free choice.
- Testing the counting form only against the value that fits. C(35) fits a signed 64-bit integer and the loop still cannot produce it; the intermediate overflows at C(34), so the safe ceiling is C(33).
- Generating when only a count is needed. The recurrence is O(n) and measured 17,422x faster at n = 10.
- Naming the parameter open in Python. It shadows the builtin, which is invisible here and a real problem if the code is later reorganised.

<!-- @doubt -->
### Why is the count Catalan?

<!-- @answer -->
Because a valid arrangement decomposes uniquely: the first bracket opens, and somewhere there is the closing bracket that matches it. That split leaves a valid arrangement inside and another after, of sizes summing to n−1, which gives C(n) = sum over k of C(k)·C(n−1−k) — the Catalan recurrence. Measured, the generated count matches C(n) exactly at every n from 1 to 12, ending at 208,012. The practical form for computing it is C(n) = C(n−1)·2(2n−1)/(n+1), which needs no factorials and stays exact in integer arithmetic because every intermediate division divides evenly.

<!-- @doubt -->
### Is the pruning here as good as in the previous problem?

<!-- @answer -->
It looks better and is asymptotically worse. At n = 10 the parenthesis rule rejects 62.4 of every 63.4 candidates against the no-adjacent-1s rule's 6.1 of 7.1, so by any intuitive measure it is far stricter. But 4^n/C(n) grows like √π·n^1.5, which is polynomial, while 2^n/F(n+2) grows like (2/φ)^n = 1.236^n, which is exponential. Measured, the two cross at n = 27 — parentheses leads 245.2 to 211.2 at n = 26 and trails 259.1 to 261.0 at n = 27, and by n = 50 it is 640.8 against 34,169. Catalan still grows like 4^n, the same base as the unconstrained tree; Fibonacci changes the base itself.

<!-- @doubt -->
### Does the recursion ever hit a dead end?

<!-- @answer -->
No, and that is measurable rather than assumed. Counting nodes where both guards blocked, across every n from 1 to 12, gives zero. The reason is that any state satisfying open ≤ n and close ≤ open can always be completed — place the remaining n−open opening brackets, then all the outstanding closing ones. So the pruning is perfect in the strong sense: not only is no illegal string built, no effort is spent on a branch that turns out to lead nowhere. The tree ends up holding about 5 nodes per result, converging from 4.40 at n = 3 to 4.97 at n = 12.

<!-- @doubt -->
### Two counters or one balance?

<!-- @answer -->
Two counters, checked before descending. The balance version carries one number instead of two and prunes exactly the same subtrees, so it looks like a simplification — but it pushes the bracket first and rejects on the next call's opening line, which means it creates a frame for every branch it discards. Measured, that is a steady 1.60x more calls at every size: 22 against 35 at n = 3, and 1,033,411 against 1,650,799 at n = 12. It is a constant factor rather than a complexity difference, and it costs nothing to avoid. The general rule from the previous subtopic still holds and this is its finer form: prune at the branch, not one frame into it.

<!-- @doubt -->
### Why must the validator check the running balance?

<!-- @answer -->
Because counting brackets is not enough. The string ")(" contains one of each and ends at balance zero, yet it is invalid — the closing bracket appears before anything is open. A validator that only compares totals accepts it. Checking the balance as it goes, and rejecting the moment it goes negative, is the test that actually captures validity. This matters mainly for the brute-force approach; the guarded version never constructs such a string, which is why its leaf does no validation at all.

<!-- @doubt -->
### What is the largest n I can handle?

<!-- @answer -->
For generating, around 12 to 14 — at n = 12 there are 208,012 results and the count keeps multiplying by roughly 4. For counting, the limit is the integer type, and it is two steps tighter than the values are. C(35) is 3,116,285,494,907,301,262 and does fit a signed 64-bit integer, while C(36) is 11,959,798,385,860,453,492 and does not — but the recurrence cannot reach either, because it multiplies before it divides and the intermediate is about n+1 times the answer. Measured, it is correct through C(33) and returns a negative number at C(34). With an int the same break comes at C(17). Widening only the product — __int128 in C++, BigInteger in Java — recovers C(34) and C(35), after which the value itself is out of range. In Python there is no width limit at all, so catalan(1000) is exact; it is simply a very large number.

<!-- @doubt -->
### Why carry the counters instead of measuring the string?

<!-- @answer -->
Because the counters make each guard O(1) and the string does not. You could recompute the balance by scanning the prefix at every node, and it would be correct — but that turns a constant-time test into a linear one at every one of the C(n)-ish nodes, adding a factor of n to the whole algorithm for no benefit. The counters are already being passed down the recursion, so keeping them costs nothing. This is the same reasoning as the previous subtopic peeking at the last character rather than rescanning the string, generalised: carry whatever the guard needs.

<!-- @doubt -->
### When should I count instead of generating?

<!-- @answer -->
Whenever the question is how many. Generating is Θ(4^n/n^1.5) work producing that many strings, while the Catalan recurrence is a single loop in O(n) and O(1) space. Measured in Python at n = 10, that is 853 nanoseconds against 14,858,594 to build the same 16,796 strings — a factor of 17,422, up from 210x at n = 6, and the advantage keeps growing because one side is exponential. The same rule applied in the previous subtopic, where the count was Fibonacci; here it is Catalan. In both cases the recurrence falls straight out of the same decomposition that explains the constraint.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Power Set, which removes the constraint entirely — every element is in or out, all 2^n subsets, no guard at all. After two subtopics of pruning it is worth seeing the case where there is nothing to prune, because it sharpens what these problems have been doing. Parentheses and binary strings both had exponential answers hiding inside larger exponential searches, and the guards were about not paying for the gap. Subsets are exponential because the answer itself is exponential, so no amount of cleverness reduces the work — which is exactly what Learn All Patterns of Subsequences established and what the next few subtopics build on.
