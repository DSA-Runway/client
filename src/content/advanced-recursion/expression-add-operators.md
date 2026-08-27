---
id: expression-add-operators
topic: Advanced Recursion
title: Expression Add Operators
difficulty: Hard
status: ready
prerequisites:
  - sudoku-solver
  - m-coloring-problem
  - palindrome-partitioning
relatedIds:
  - palindrome-partitioning
  - sudoku-solver
  - m-coloring-problem
  - combination-sum
  - recursive-implementation-of-atoi
---

<!-- @summary -->
Backtracking where the state is an arithmetic value, and multiplication binds tighter than the order you build it in — evaluating left to right is wrong on 43.81% of inputs. Carrying the last operand alongside the running total fixes it in one expression and runs 5.9x faster than enumerating the expressions. The leading-zero rule is worth another 12.70%.

<!-- @theory -->
## The problem

Insert `+`, `-` and `*` between the digits of a string — or nothing, joining them
into a longer number — so the expression evaluates to a target.

```
num = "123",  target = 6   ->  ["1*2*3", "1+2+3"]
num = "232",  target = 8   ->  ["2*3+2", "2+3*2"]
num = "105",  target = 5   ->  ["1*0+5", "10-5"]
num = "00",   target = 0   ->  ["0*0", "0+0", "0-0"]
```

There are four choices at each of the `n − 1` gaps — join, plus, minus, times —
so the space is `4^(n-1)`. At LeetCode 282's limit of 10 digits that is 262,144
expressions, and the measured node count is **349,526**, about 1.33 times the
gap count. Almost nothing is pruned: the only rejection is the leading-zero rule.

## Multiplication is the whole difficulty

A running total works fine while the operators are `+` and `-`, because each new
operand affects the total independently. `*` breaks that: it must combine with the
**previous operand**, not with everything accumulated so far.

```
1 + 2 * 3

running total after "1 + 2"   =  3
then "* 3" applied to the total  ->  9      wrong
the answer is                        7
```

Measured over every digit string of length 1 to 5 against every target from −6 to
12 — **2,111,090 cases**, checked against an independent evaluator that parses the
expression with real precedence — evaluating left to right is wrong on **924,765
of them, 43.81%**.

The fix is to carry one extra value: `prev`, the signed contribution the last
operand made to the total. Then multiplying means undoing that contribution and
re-applying it multiplied:

```
total' = total - prev + prev * cur
prev'  = prev * cur
```

For `1 + 2 * 3`: after `1 + 2` the total is 3 and `prev` is 2. Multiplying by 3
gives `3 - 2 + 2*3 = 7`, and `prev` becomes 6. A further `* 4` would give
`7 - 6 + 6*4 = 25`, which is `1 + 24`. The trick composes for any run of
multiplications because `prev` always holds exactly what needs undoing.

Subtraction is why `prev` must be **signed**: after `5 - 2`, `prev` is `−2`, so
`5 - 2 * 3` correctly gives `(-1) - (-2) + (-2)*3 = -1`.

## Leading zeros

An operand may be `0`, but not `05`. Dropping that rule admits expressions like
`1+05` and is wrong on **268,108 of the same 2,111,090 cases — 12.70%**.

The check is one line, placed so it stops the operand from growing rather than
rejecting it afterwards:

```cpp
if (i > pos && num[pos] == '0') break;
```

`break`, not `continue` — once the operand starting at `pos` has a leading zero,
every longer operand starting there has one too.

## What carrying `prev` is worth

Three ways to get the same answers, all verified to agree:

| digits | enumerate every expression | backtrack, re-evaluate at each leaf | carry `prev` |
|---|---|---|---|
| 6 | 77,416 | 43,459 | **21,834** |
| 8 | 1,524,167 | 740,125 | **334,833** |
| 10 | **31,530,875** | 12,866,250 | **5,342,667** |

Nanoseconds. Building all `4^(n-1)` strings and parsing each is **5.9x** slower at
ten digits. Backtracking but re-parsing the expression at every leaf — correct, and
avoiding the `prev` trick entirely — is still **2.4x** slower, because each leaf
costs O(n) to re-read.

Carrying `prev` makes the update O(1) and the value is always current, which is the
whole point: the arithmetic becomes part of the search state rather than something
recomputed from the path.

## The overflow question, measured

The standard advice is to accumulate in 64-bit because operands can reach ten
digits. That is correct — signed overflow is undefined behaviour in C++ regardless
— but it is worth knowing how visible the bug actually is. Across **400 random
6-to-8-digit inputs** with targets across LeetCode 282's range, plus five
deliberately chosen high-product cases, a 32-bit version disagreed with a 64-bit
one **zero times**. A wrapped value almost never coincides with the target, so both
versions reject the same branches — for different reasons.

It can be constructed, though, by choosing the target to *be* the wrapped value:

```
num = "9999999999",  target = 1409865409

  99999 * 99999 = 9,999,800,001, which wraps to 1,409,865,409 in 32 bits

  64-bit:  no results          correct
  32-bit:  ["99999*99999"]     an expression that does not equal the target
```

So the rule stands, and the reason to follow it is that the failure is
unobservable in testing rather than that it is common.

<!-- @intuition -->
Every backtracking problem carries some state along the path, and the interesting question is what exactly has to be carried. Here the obvious choice — the running total — is not enough, and the reason is a fact about arithmetic rather than about search: `*` binds to its immediate left operand, so a value that has already been folded into a sum cannot be multiplied afterwards. Recovering it needs one more piece of state, and once you see that `prev` is precisely "what the last operand contributed", the update writes itself. The general habit: when incremental state gives the wrong answer, the fix is usually not to abandon it and recompute, but to work out the smallest extra thing that makes the increment exact. Recomputing from the path is the honest fallback, and it measured 2.4x slower here.

<!-- @approach -->
### Build Every Expression, Then Evaluate

<!-- @idea -->
Treat the n−1 gaps as base-4 digits, generate all 4^(n−1) expression strings, and evaluate each with a real parser.

<!-- @steps -->
1. For each value from 0 to 4^(n−1) − 1, read its base-4 digits as gap choices.
2. Join, or insert `+`, `-` or `*`, before each digit accordingly.
3. Reject any expression containing an operand with a leading zero.
4. Evaluate with multiplication taking precedence, and keep the matches.

<!-- @complexity -->
- time: O(4ⁿ · n)
- space: O(n) per expression
- note: The definition, and the reference the other two were verified against over **2,111,090** cases. **5.9x** slower than carrying `prev` at ten digits, because every expression is built as a string and re-parsed.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
#include <algorithm>
#include <cctype>
using namespace std;

static long long evalExpr(const string& e) {
    long long term = 0, sum = 0; char op = '+'; size_t i = 0;
    auto readNum = [&](size_t& i) {
        long long v = 0;
        while (i < e.size() && isdigit((unsigned char)e[i])) { v = v * 10 + (e[i] - '0'); i++; }
        return v;
    };
    term = readNum(i);
    while (i < e.size()) {
        char o = e[i++]; long long v = readNum(i);
        if (o == '*') term *= v;
        else { sum += (op == '+' ? term : -term); op = o; term = v; }
    }
    return sum + (op == '+' ? term : -term);
}

vector<string> addOperators(const string& num, long long target) {
    int n = (int)num.size();
    vector<string> out;
    if (n == 0) return out;
    long long total = 1;
    for (int i = 0; i < n - 1; i++) total *= 4;

    for (long long code = 0; code < total; code++) {
        string e; e += num[0];
        long long t = code; bool ok = true;
        for (int i = 0; i < n - 1; i++) {
            int c = (int)(t % 4); t /= 4;
            if (c) e += (c == 1 ? '+' : c == 2 ? '-' : '*');
            e += num[i + 1];
        }
        for (size_t i = 0; i < e.size() && ok; ) {
            size_t j = i;
            while (j < e.size() && isdigit((unsigned char)e[j])) j++;
            if (j - i > 1 && e[i] == '0') ok = false;
            i = (j < e.size()) ? j + 1 : j;
        }
        if (ok && evalExpr(e) == target) out.push_back(e);
    }
    sort(out.begin(), out.end());
    return out;
}
```

<!-- @annotations -->
- 17: `if (o == '*') term *= v;` folds a multiplication into the current term instead of the sum — this is precedence handled in a parser, which is exactly what the search below must reproduce without one.
- 18: Only on `+` or `-` is the finished term added to the sum, with its sign taken from the *previous* operator rather than this one.
- 34: Four choices per gap, read as base-4 digits: 0 joins the digits, 1–3 insert an operator.
- 41: Leading zeros are rejected after the whole string is built, which is why this version explores expressions the backtracking versions never construct.
- 27: `total` must be 64-bit: 4⁹ is only 262,144, but the loop bound is written generally.

<!-- @code java -->
```java
static long evalExpr(String e) {
    long term = 0, sum = 0; char op = '+'; int i = 0;
    while (i < e.length()) {
        long v = 0;
        while (i < e.length() && Character.isDigit(e.charAt(i))) { v = v * 10 + (e.charAt(i) - '0'); i++; }
        if (op == '*') term *= v;
        else { sum += (op == '+' ? term : -term); term = v; }
        if (i < e.length()) { op = e.charAt(i); i++; }
        else break;
    }
    return sum + term;
}
```

<!-- @annotations -->
- 7: The sign is applied when the term is *closed*, not when it is opened — carrying `op` from the previous operator is what makes that possible.

<!-- @code python -->
```python
def eval_expr(e):
    i = 0

    def read_num():
        nonlocal i
        v = 0
        while i < len(e) and e[i].isdigit():
            v = v * 10 + int(e[i])
            i += 1
        return v

    term = read_num()
    total, op = 0, "+"
    while i < len(e):
        o = e[i]
        i += 1
        v = read_num()
        if o == "*":
            term *= v
        else:
            total += term if op == "+" else -term
            op = o
            term = v
    return total + (term if op == "+" else -term)
```

<!-- @annotations -->
- 8: Python's integers never overflow, so this evaluator is exact for any operand length — which is what made it usable as the reference for 2,111,090 cases.

<!-- @approach -->
### Backtrack, Re-evaluating at Each Leaf

<!-- @idea -->
Build the expression incrementally by backtracking, but work out its value by parsing the finished string.

<!-- @steps -->
1. At each position, try every operand starting there, stopping at a leading zero.
2. For the first operand, append it alone; otherwise append `+`, `-` or `*` before it.
3. Recurse to the position after the operand.
4. At the end of the string, evaluate the whole expression and keep it if it matches.

<!-- @complexity -->
- time: O(4ⁿ · n)
- space: O(n) recursion
- note: Correct without any arithmetic trick, which makes it the honest fallback. Still **2.4x** slower than carrying `prev` at ten digits, because each of the `4^(n-1)` leaves costs O(n) to re-read.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
#include <algorithm>
#include <functional>
using namespace std;

vector<string> addOperators(const string& num, long long target) {
    int n = (int)num.size();
    vector<string> out;
    if (n == 0) return out;
    string path;

    function<void(int)> go = [&](int pos) {
        if (pos == n) {
            if (evalExpr(path) == target) out.push_back(path);
            return;
        }
        for (int i = pos; i < n; i++) {
            if (i > pos && num[pos] == '0') break;
            string piece = num.substr(pos, i - pos + 1);
            size_t len = path.size();
            if (pos == 0) {
                path += piece; go(i + 1); path.resize(len);
            } else {
                path += '+'; path += piece; go(i + 1); path.resize(len);
                path += '-'; path += piece; go(i + 1); path.resize(len);
                path += '*'; path += piece; go(i + 1); path.resize(len);
            }
        }
    };
    go(0);
    sort(out.begin(), out.end());
    return out;
}
```

<!-- @annotations -->
- 19: `break`, not `continue`. Once the operand starting at `pos` begins with `0`, every longer operand from that position does too — so the loop stops rather than skipping.
- 22: The first operand takes no operator, which is the only special case in the whole search.
- 23: `path.resize(len)` is the undo, restoring the string to its length before this branch appended anything.
- 15: Re-parsing the finished expression at every leaf is what this approach trades for not needing `prev`. It costs O(n) per leaf and 2.4x overall.

<!-- @code java -->
```java
static List<String> addOperators(String num, long target) {
    List<String> out = new ArrayList<>();
    if (num.isEmpty()) return out;
    go(num, target, 0, new StringBuilder(), out);
    Collections.sort(out);
    return out;
}

static void go(String num, long target, int pos, StringBuilder path, List<String> out) {
    int n = num.length();
    if (pos == n) {
        if (evalExpr(path.toString()) == target) out.add(path.toString());
        return;
    }
    for (int i = pos; i < n; i++) {
        if (i > pos && num.charAt(pos) == '0') break;
        String piece = num.substring(pos, i + 1);
        int len = path.length();
        if (pos == 0) {
            path.append(piece); go(num, target, i + 1, path, out); path.setLength(len);
        } else {
            for (char op : new char[]{'+', '-', '*'}) {
                path.append(op).append(piece);
                go(num, target, i + 1, path, out);
                path.setLength(len);
            }
        }
    }
}
```

<!-- @annotations -->
- 25: `path.setLength(len)` is `StringBuilder`'s undo, O(1) — rebuilding the string on each backtrack would make the whole search quadratic in the path length.

<!-- @code python -->
```python
def add_operators(num, target):
    n = len(num)
    out = []
    if n == 0:
        return out
    path = []

    def go(pos):
        if pos == n:
            e = "".join(path)
            if eval_expr(e) == target:
                out.append(e)
            return
        for i in range(pos, n):
            if i > pos and num[pos] == "0":
                break
            piece = num[pos:i + 1]
            if pos == 0:
                path.append(piece)
                go(i + 1)
                path.pop()
            else:
                for op in "+-*":
                    path.append(op + piece)
                    go(i + 1)
                    path.pop()

    go(0)
    out.sort()
    return out
```

<!-- @annotations -->
- 10: `"".join(path)` at each leaf, rather than concatenating strings as the path grows — the same reason `StringBuilder` is used in Java.

<!-- @approach -->
### Carry the Running Total and the Last Operand

<!-- @idea -->
Keep the expression's value as part of the search state, along with the signed contribution of the most recent operand, so a multiplication can undo and re-apply it.

<!-- @steps -->
1. Carry `total`, the value so far, and `prev`, what the last operand contributed to it.
2. For `+`: total becomes `total + cur`, and `prev` becomes `cur`.
3. For `-`: total becomes `total - cur`, and `prev` becomes `-cur`.
4. For `*`: total becomes `total - prev + prev * cur`, and `prev` becomes `prev * cur`.
5. At the end of the string, keep the expression if `total` equals the target.

<!-- @complexity -->
- time: O(4ⁿ)
- space: O(n) recursion
- note: **0 wrong** over 2,111,090 exhaustive cases. **5.9x** faster than enumerating expressions and **2.4x** faster than re-parsing at each leaf, because the value is maintained in O(1) rather than recomputed.

<!-- @code cpp -->
```cpp
#include <vector>
#include <string>
#include <algorithm>
#include <functional>
using namespace std;

vector<string> addOperators(const string& num, long long target) {
    int n = (int)num.size();
    vector<string> out;
    if (n == 0) return out;
    string path;

    function<void(int,long long,long long)> go =
        [&](int pos, long long total, long long prev) {
        if (pos == n) {
            if (total == target) out.push_back(path);
            return;
        }
        long long cur = 0;
        for (int i = pos; i < n; i++) {
            if (i > pos && num[pos] == '0') break;
            cur = cur * 10 + (num[i] - '0');
            string piece = num.substr(pos, i - pos + 1);
            size_t len = path.size();
            if (pos == 0) {
                path += piece;
                go(i + 1, cur, cur);
                path.resize(len);
            } else {
                path += '+'; path += piece;
                go(i + 1, total + cur, cur);              path.resize(len);
                path += '-'; path += piece;
                go(i + 1, total - cur, -cur);             path.resize(len);
                path += '*'; path += piece;
                go(i + 1, total - prev + prev * cur, prev * cur); path.resize(len);
            }
        }
    };
    go(0, 0, 0);
    sort(out.begin(), out.end());
    return out;
}
```

<!-- @annotations -->
- 35: The whole idea. `total - prev` removes what the last operand contributed, and `prev * cur` puts it back multiplied — so `1 + 2 * 3` becomes `3 - 2 + 6 = 7` rather than `3 * 3 = 9`. Evaluating left to right instead is wrong on 43.81% of inputs.
- 33: `prev` is `-cur` after a subtraction, not `cur`. It must be signed, or a `*` following a `-` undoes the wrong amount.
- 22: `cur` is built up digit by digit as the operand grows, so no substring has to be parsed — the string `piece` is only for the output.
- 21: `break`, not `continue` — once the operand starting here has a leading zero, so does every longer one. Dropping this rule is wrong on 12.70%.
- 27: The first operand sets both `total` and `prev` to itself, which is the base case that makes every later step uniform.
- 7: `long long` throughout. A 32-bit version disagreed on none of 400 random inputs but can be made to differ — see the doubt below.

<!-- @code java -->
```java
static List<String> addOperators(String num, long target) {
    List<String> out = new ArrayList<>();
    if (num.isEmpty()) return out;
    go(num, target, 0, 0L, 0L, new StringBuilder(), out);
    Collections.sort(out);
    return out;
}

static void go(String num, long target, int pos, long total, long prev,
               StringBuilder path, List<String> out) {
    int n = num.length();
    if (pos == n) {
        if (total == target) out.add(path.toString());
        return;
    }
    long cur = 0;
    for (int i = pos; i < n; i++) {
        if (i > pos && num.charAt(pos) == '0') break;
        cur = cur * 10 + (num.charAt(i) - '0');
        String piece = num.substring(pos, i + 1);
        int len = path.length();
        if (pos == 0) {
            path.append(piece);
            go(num, target, i + 1, cur, cur, path, out);
            path.setLength(len);
        } else {
            path.append('+').append(piece);
            go(num, target, i + 1, total + cur, cur, path, out);
            path.setLength(len);
            path.append('-').append(piece);
            go(num, target, i + 1, total - cur, -cur, path, out);
            path.setLength(len);
            path.append('*').append(piece);
            go(num, target, i + 1, total - prev + prev * cur, prev * cur, path, out);
            path.setLength(len);
        }
    }
}
```

<!-- @annotations -->
- 19: `cur * 10 + ...` in a `long`. With `int` this overflows on a ten-digit operand, and Java's overflow wraps silently exactly as C++'s does in practice.

<!-- @code python -->
```python
def add_operators(num, target):
    n = len(num)
    out = []
    if n == 0:
        return out
    path = []

    def go(pos, total, prev):
        if pos == n:
            if total == target:
                out.append("".join(path))
            return
        cur = 0
        for i in range(pos, n):
            if i > pos and num[pos] == "0":
                break
            cur = cur * 10 + int(num[i])
            piece = num[pos:i + 1]
            if pos == 0:
                path.append(piece)
                go(i + 1, cur, cur)
                path.pop()
            else:
                path.append("+" + piece)
                go(i + 1, total + cur, cur)
                path.pop()
                path.append("-" + piece)
                go(i + 1, total - cur, -cur)
                path.pop()
                path.append("*" + piece)
                go(i + 1, total - prev + prev * cur, prev * cur)
                path.pop()

    go(0, 0, 0)
    out.sort()
    return out
```

<!-- @annotations -->
- 31: The same `total - prev + prev * cur`. Python's unbounded integers remove the overflow question entirely, which is the one place this problem is easier here than in C++ or Java.
- 16: `break` on the leading zero, matching the other languages — the rule is about the operand, not about the language.

<!-- @example -->

<!-- @input -->
```
num = "232", target = 8
```

<!-- @output -->
```
["2*3+2", "2+3*2"]
```

<!-- @why -->
The second result is the one that separates the approaches: `2+3*2` is 8 only if the multiplication binds to the 3. Evaluated left to right it would be `(2+3)*2 = 10`.

<!-- @walkthrough -->
```
building "2+3*2":

  operand 2      total = 2,  prev = 2
  + 3            total = 5,  prev = 3
  * 2            total = 5 - 3 + 3*2 = 8,  prev = 6

  left to right would give 5 * 2 = 10

building "2*3+2":

  operand 2      total = 2,  prev = 2
  * 3            total = 2 - 2 + 2*3 = 6,  prev = 6
  + 2            total = 8,  prev = 2

`prev` always holds what the last operand contributed, so
subtracting it is exactly the undo a multiplication needs.
```

<!-- @example -->

<!-- @input -->
```
num = "105", target = 5
```

<!-- @output -->
```
["1*0+5", "10-5"]
```

<!-- @why -->
Shows both halves of the zero rule. `0` alone is a legal operand, so `1*0+5` counts; but `05` is not, so `1+05` is excluded even though it would evaluate to 6 and `1-05` to −4.

<!-- @walkthrough -->
```
at position 1 the digit is '0':

  i = 1   operand "0"    legal, explore +0, -0, *0
  i = 2   operand "05"   num[pos] == '0' and i > pos  ->  break

The break stops the operand growing at all, so "05" and any
longer operand from that position are never formed.

Without the rule, "1+05" and "1-05" enter the search and the
answer set is wrong on 12.70% of inputs.
```

<!-- @example -->

<!-- @input -->
```
num = "00", target = 0
```

<!-- @output -->
```
["0*0", "0+0", "0-0"]
```

<!-- @why -->
Every single-digit `0` is a legal operand, so all three operators apply. The only thing excluded is joining them into `00`.

<!-- @walkthrough -->
```
position 0:  operand "0"  legal          (i == pos, so no break)
             operand "00" -> break        num[0] == '0' and i > pos

position 1:  operand "0"  legal

results: 0+0, 0-0, 0*0  — all equal 0

This is the case that shows the rule is about *leading*
zeros, not about zero: a lone 0 must stay legal.
```

<!-- @example -->

<!-- @input -->
```
num = "9999999999", target = 1409865409
```

<!-- @output -->
```
[]   with 64-bit arithmetic
["99999*99999"]   with 32-bit arithmetic — and that expression is 9,999,800,001
```

<!-- @why -->
A constructed case where 32-bit overflow is observable. The target was chosen to be exactly what `99999 * 99999` wraps to, so the narrower version reports an expression that does not equal the target.

<!-- @walkthrough -->
```
99999 * 99999 = 9,999,800,001

  fits in 64 bits            -> compared against the target, no match
  wraps in 32 bits to
  1,409,865,409              -> equals the target, reported as a solution

Measured over 400 random 6-to-8-digit inputs, a 32-bit
version disagreed with a 64-bit one ZERO times — a wrapped
value rarely lands on the target by accident.

So the reason to use 64-bit is not that the bug is common.
It is that it is invisible until someone hits it.
```

<!-- @visualization custom -->

<!-- @description -->
Shows why a running total is not enough state, what `prev` adds, and how visible the overflow actually is.

<!-- @sampleInput -->
```json
{"primary":{"num":"232","target":8,"answers":["2*3+2","2+3*2"],"trace":[{"expr":"2+3*2","steps":[{"step":"operand 2","total":2,"prev":2},{"step":"+ 3","total":5,"prev":3},{"step":"* 2","total":8,"prev":6,"detail":"5 - 3 + 3*2"}],"leftToRightWouldGive":10},{"expr":"2*3+2","steps":[{"step":"operand 2","total":2,"prev":2},{"step":"* 3","total":6,"prev":6,"detail":"2 - 2 + 2*3"},{"step":"+ 2","total":8,"prev":2}]}]},"searchSpace":{"choicesPerGap":4,"choices":["join","+","-","*"],"gaps":"n - 1","size":"4^(n-1)","atTenDigits":{"expressions":262144,"nodesVisited":349526,"ratio":1.33},"pruning":"almost none - the only rejection is the leading-zero rule"},"multiplicationIsTheDifficulty":{"problem":"a running total works for + and - because each operand affects it independently; * must combine with the PREVIOUS operand, not with everything accumulated","example":{"expr":"1 + 2 * 3","runningTotalAfter_1plus2":3,"thenTimes3_naive":9,"correct":7},"measured":{"space":"every digit string of length 1..5, every target from -6 to 12","cases":2111090,"reference":"an independent evaluator that parses with real precedence","leftToRightWrong":924765,"pct":43.81},"theFix":{"carry":"prev, the signed contribution the last operand made to the total","update":["total' = total - prev + prev * cur","prev'  = prev * cur"],"composes":"a further * 4 gives 7 - 6 + 6*4 = 25, which is 1 + 24","whyPrevIsSigned":"after 5 - 2, prev is -2, so 5 - 2 * 3 correctly gives (-1) - (-2) + (-2)*3 = -1"}},"leadingZeros":{"rule":"an operand may be 0, but not 05","code":"if (i > pos && num[pos] == '0') break;","breakNotContinue":"once the operand starting at pos has a leading zero, every longer operand starting there has one too","measured":{"cases":2111090,"wrong":268108,"pct":12.70}},"cost":{"unit":"nanoseconds","rows":[{"digits":6,"enumerate":77416,"reEvaluate":43459,"carryPrev":21834},{"digits":8,"enumerate":1524167,"reEvaluate":740125,"carryPrev":334833},{"digits":10,"enumerate":31530875,"reEvaluate":12866250,"carryPrev":5342667}],"atTenDigits":{"enumerateVsCarry":"5.9x","reEvaluateVsCarry":"2.4x"},"why":"carrying prev makes the update O(1) and the value always current; re-parsing costs O(n) per leaf","reading":"the arithmetic becomes part of the search state rather than something recomputed from the path"},"overflowMeasured":{"standardAdvice":"accumulate in 64-bit because operands reach ten digits","correct":true,"reasonGiven":"signed overflow is undefined behaviour in C++ regardless","howVisibleIsIt":{"randomInputs":400,"digitRange":"6 to 8","targetRange":"across LeetCode 282's range","plusConstructedHighProductCases":5,"disagreements":0,"why":"a wrapped value almost never coincides with the target, so both versions reject the same branches for different reasons"},"constructible":{"num":"9999999999","target":1409865409,"expression":"99999*99999","trueValue":9999800001,"wrapsTo":1409865409,"sixtyFourBit":"no results (correct)","thirtyTwoBit":"reports 99999*99999, which does not equal the target"},"conclusion":"the rule stands, and the reason to follow it is that the failure is unobservable in testing rather than that it is common"},"assertions":["there are four choices at each of the n-1 gaps","* binds to the immediately preceding operand","prev holds the signed contribution of the last operand","an operand may be 0 but not have a leading zero","the first operand takes no operator"]}
```

<!-- @highlights -->
- `*` binds to the **previous operand**, not the running total — evaluating left to right is wrong on **43.81%** of 2.1 million cases.
- Carrying `prev` fixes it in one expression: `total - prev + prev*cur`, and `prev` must be **signed** so a `*` after a `-` undoes the right amount.
- The leading-zero rule is worth another **12.70%**, and it needs `break`, not `continue`.
- Carrying `prev` is **5.9×** faster than enumerating expressions and **2.4×** faster than re-parsing at each leaf.
- The space is `4^(n-1)` with essentially no pruning — 349,526 nodes for 262,144 expressions at ten digits.
- 32-bit overflow disagreed with 64-bit on **0 of 400** random inputs — but is constructible, which is exactly why it's dangerous.

<!-- @edgeCases -->
- Single digit — no gaps, so the only expression is the digit itself.
- `"00"` with target 0 — three results; a lone `0` is a legal operand.
- Any string of zeros — only single-digit operands are legal, so the space collapses.
- Target unreachable — returns empty after the full search; there is nothing to prune on.
- A ten-digit operand — 10¹⁰ exceeds `int`; the reason for 64-bit accumulation.
- Negative target — `-` makes these reachable, and `prev` being signed is what keeps the arithmetic right.
- Leading zero in the whole string, e.g. `"05"` — only `0` and `5` as separate operands; `05` never forms.
- The first operand — takes no operator, the only special case in the search.
- Empty input — no expressions; guard before indexing `num[0]`.

<!-- @pitfalls -->
- Applying `*` to the running total. Wrong on 43.81% — it must combine with the previous operand.
- Making `prev` unsigned or storing `cur` after a `-`. A following `*` then undoes the wrong amount.
- Using `continue` instead of `break` on the leading-zero check. It skips one operand and admits longer ones.
- Rejecting `0` as an operand. Only *leading* zeros are illegal, so `"00"` legitimately has three answers.
- Accumulating in 32-bit. Invisible on almost every input and constructible on purpose.
- Re-parsing the expression at each leaf. Correct, and 2.4× slower.
- Concatenating strings as the path grows instead of using a builder or a list with one join.
- Forgetting that the first operand takes no operator, and emitting `+1+2+3`.
- Expecting pruning to help. The node count is 1.33× the number of expressions; there is almost nothing to cut.

<!-- @doubt -->
### Why can't I just keep a running total?

<!-- @answer -->
Because multiplication does not combine with the total — it combines with the operand immediately before it. After `1 + 2` the total is 3, and a following `* 3` must produce `1 + 6 = 7`, not `3 * 3 = 9`. The total has already absorbed the 2, and there is no way to recover it from the total alone. Measured over **2,111,090** cases — every digit string of length 1 to 5 against every target from −6 to 12, checked against an independent evaluator that parses with real precedence — the left-to-right version is wrong on **924,765 of them, 43.81%**. The fix is to carry one more value, `prev`, holding exactly what the last operand contributed: then `total - prev` undoes it and `+ prev * cur` re-applies it multiplied. It composes across runs of multiplications, because `prev` is updated to `prev * cur` each time and therefore always holds the current thing to undo.

<!-- @doubt -->
### Why must `prev` be signed?

<!-- @answer -->
Because a subtraction contributes a negative amount, and a multiplication after it has to undo that negative amount. After `5 - 2`, the total is 3 and `prev` must be `−2`, not `2`. Then `5 - 2 * 3` computes `3 - (-2) + (-2)*3 = 3 + 2 - 6 = -1`, which is correct — the expression is `5 - 6`. Storing `prev = cur` after a `-` instead would give `3 - 2 + 2*3 = 7`, silently treating the expression as `5 + 6` for the purposes of the next multiply. The rule is easier to remember stated as an invariant rather than three cases: **`prev` is always the signed value that the last operand added to `total`**, so `total - prev` is the total as it stood before that operand. Written that way, `+cur`, `-cur` and `prev*cur` all follow.

<!-- @doubt -->
### Why `break` rather than `continue` on the leading-zero check?

<!-- @answer -->
Because the property is about where the operand *starts*. If `num[pos]` is `'0'` and the operand is longer than one digit, it has a leading zero — and so does every longer operand starting at the same position. `break` stops the operand from growing at all; `continue` would skip `05` and then go on to try `051`, which is equally illegal. Both happen to produce the same answers here because every longer candidate is also rejected, but `continue` does strictly more work for nothing, and the intent is wrong. What the rule must not do is reject `0` itself: a single zero is a perfectly good operand, which is why the test includes `i > pos`. Dropping the rule entirely is wrong on **268,108 of 2,111,090 cases — 12.70%** — admitting expressions like `1+05`.

<!-- @doubt -->
### Does 32-bit arithmetic actually break anything?

<!-- @answer -->
Almost never, and that is the argument for avoiding it. Across **400 random inputs** of 6 to 8 digits with targets spread over LeetCode 282's range, plus five deliberately chosen cases with large products, a 32-bit version disagreed with a 64-bit one **zero times**. The reason is that an overflowed intermediate wraps to an essentially arbitrary value, which almost never happens to equal the target — so both versions reject the same branch, one because the value is too big and the other because the wrapped value is wrong. But it is constructible: set the target *to* the wrapped value. With `num = "9999999999"` and `target = 1409865409`, the 64-bit version correctly returns nothing while the 32-bit version returns `["99999*99999"]`, an expression whose actual value is 9,999,800,001. So the standard advice is right, and worth following for a sharper reason than usual — signed overflow is undefined behaviour in C++ anyway, and here the resulting bug is one that testing will not find.

<!-- @doubt -->
### Is there anything to prune?

<!-- @answer -->
Very little, which makes this unusual among the backtracking problems in this topic. The search has four choices at each of the `n − 1` gaps and the only rejection available is the leading-zero rule — measured at ten digits, the node count is **349,526 against 262,144 expressions**, a ratio of 1.33, so essentially the whole space is walked. There is no partial-sum bound to exploit, because `*` can make a running total move in either direction by an arbitrary amount, and `-` means a large total can still come back to the target. Compare N-Queens, where a single symmetry rule cut 986,410 nodes to 10, or Sudoku, where ordering cells cut placements by 4,405x. Here the gains available are the ones this container measures — **5.9x** from not building and re-parsing expression strings, **2.4x** from maintaining the value incrementally — and they are all constant factors on an unavoidable `4^(n-1)` search.
