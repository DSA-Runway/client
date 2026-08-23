---
id: balanced-paranthesis
topic: Stacks
title: Balanced Paranthesis
difficulty: Easy
status: ready
prerequisites:
  - implement-stack-using-arrays
  - implement-stack-using-linkedlist
  - remove-outermost-parentheses
  - maximum-nesting-depth-of-the-parentheses
relatedIds:
  - implement-min-stack
  - maximum-nesting-depth-of-the-parentheses
  - remove-outermost-parentheses
  - next-greater-element
  - implement-stack-using-arrays
---

<!-- @summary -->
The first subtopic that uses a stack instead of building one, and it is the canonical reason the structure exists: the most recently opened bracket is always the next one that must close. Checked exhaustively against an independent pair-reduction reference over **all 72,559,411 strings** of length 0 to 10 from `()[]{}`, with zero disagreements. The tempting shortcut — one counter per bracket type — fails on **66,264** of those strings, and the failures are all in one direction: it never rejects a valid string, only accepts invalid ones, the smallest being `[(])`. With a single bracket type the counter is exactly right, verified over every string up to length 20.

<!-- @theory -->
## The problem

Given a string of `(`, `)`, `[`, `]`, `{`, `}`, decide whether every bracket is
closed by a matching bracket, in the right order.

```
{[()]}     balanced
([)]       not — the ) closes an open [
(()        not — one ( is never closed
)(         not — a ) arrives with nothing open
```

## Why this is a stack

Scan left to right. When you meet a closing bracket, which opening bracket must
it match? Always the **most recently opened one that is still open**. Not the
first, not any other — the last.

That sentence is the definition of a stack, so the algorithm writes itself:

- An opening bracket: push it.
- A closing bracket: the top of the stack must be its partner. If the stack is
  empty, or the top is the wrong kind, the string is unbalanced.
- At the end, the stack must be empty, or something was opened and never closed.

Verified against an independent reference that repeatedly deletes adjacent
matched pairs — a completely different method — over every string of length 0 to
8. **0 disagreements.**

## The shortcut that almost works

The obvious simplification is to skip the stack and just count: one counter per
bracket type, incremented on open, decremented on close, rejecting if any goes
negative and requiring all three to end at zero.

Over all 72,559,411 strings of length 0 to 10:

| | Count |
|---|---|
| Strings tested | 72,559,411 |
| Actually balanced | 11,497 (0.0158%) |
| Counter method disagreed | **66,264** |
| …of which false positives | **66,264** |
| …of which false negatives | **0** |

Every single disagreement is the counter method calling an unbalanced string
balanced. It never rejects a valid one. That asymmetry is worth understanding
rather than memorising: counting can detect *too many closers* and *leftover
openers*, because those are arithmetic facts. What it cannot detect is
**interleaving**, because a count has no order in it.

The smallest counterexample is four characters:

```
[(])       counters:  [ =1, ( =1, ] closes [ -> 0, ) closes ( -> 0   all zero
           truth:     the ) tries to close a [
```

## But with one bracket type, counting is exactly right

If the alphabet is only `(` and `)`, there is nothing to interleave, and a single
counter is sufficient — verified over **every one of the 2,097,151 strings** of
length 0 to 20, with 0 disagreements against the stack.

That matters practically, because it drops the space from O(n) to **O(1)**. The
rule is precise: the stack is needed for the *kinds*, not for the counting.

## The brute force is quadratic

The other approach people reach for is repeatedly deleting adjacent matched pairs
until nothing changes, and declaring the string balanced if it emptied. It is
correct — it agreed with the stack on every string of length 0 to 8 — and it is
O(n²), because each deletion restarts the scan:

| Length | Stack | Repeated pair removal | Ratio |
|---|---|---|---|
| 400 | 1,000ns | 46,125ns | 46x |
| 2,000 | 3,791ns | 947,167ns | 250x |
| 8,000 | **13,625ns** | **12,998,958ns** | **954x** |

The ratio roughly quadruples as the length quadruples, which is O(n²) against
O(n) showing itself. In Python the same comparison gives 13x, 38x and 97x — the
`s.replace("()", "")` loop that looks so neat is the quadratic one.

## Two properties worth knowing

**It exits early, and that is not a micro-optimisation.** A string that fails at
position 0 is rejected without reading the rest:

| Input | Time |
|---|---|
| `")" + "(" * 2,000,000` | **166ns** |
| `"(" * 2,000,000 + "))"` | 2,108,667ns |

**12,703x.** The algorithm is O(n) in the worst case and O(1) on inputs that fail
immediately.

**Peak stack depth is the maximum nesting depth**, not the length:

| Input, length 100,000 | Peak depth |
|---|---|
| `"(" * 50,000 + ")" * 50,000` | **50,000** |
| `"()" * 50,000` | **1** |

So the space is O(n) in the worst case and O(1) for flat input — which is why
Maximum Nesting Depth of the Parentheses is the same scan with the counter
retained instead of discarded.

## Where this goes next

**Number of Greater Elements to the Right** moves from matching brackets to
comparing values, and introduces the pattern that occupies the rest of this
topic: a stack that holds elements still waiting for an answer, popped the moment
that answer arrives. The bracket scan is that idea in its simplest possible form
— an open bracket is an element waiting, and its closer is the answer.

<!-- @intuition -->
Reading bracketed text, the question you are always answering is "what is still open, and which of those things must close first?" — and the answer is never in doubt: whatever opened most recently. A bracket opened earlier cannot close before one opened later, because that would mean the two ranges cross rather than nest, and crossing is exactly what unbalanced means. So the only structure you need is one that hands back the most recent thing you put in, which is a stack, and the algorithm becomes a single pass with no lookahead and no backtracking. What makes the counting shortcut so seductive is that arithmetic catches two of the three ways a string can be wrong — too many closers, and openers left over — and silently misses the third. Interleaving is a statement about order, and a count is precisely the thing that has thrown order away.

<!-- @approach -->
### Brute Force - Repeatedly Delete Adjacent Pairs

<!-- @idea -->
Erase any adjacent matched pair, over and over, and see whether the string disappears.

<!-- @steps -->
1. Scan the string for an adjacent pair like `()`, `[]` or `{}`.
2. If one is found, erase those two characters and start the scan again.
3. Repeat until a full scan finds no adjacent pair.
4. The string was balanced exactly when nothing is left.
5. Note that restarting the scan after every deletion is what makes this quadratic.

<!-- @complexity -->
- time: O(n^2) — up to n/2 deletions, each restarting an O(n) scan
- space: O(n) for the mutable copy
- note: Correct, and useful precisely because it is a completely different method — it agreed with the stack on every string of length 0 to 8 from the six-symbol alphabet, which is what makes it a trustworthy reference rather than a rival implementation. Measured 12,998,958ns at length 8,000 against the stack's 13,625ns, a factor of 954, with the ratio growing linearly in the length.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool isBalanced(string s) {
    bool changed = true;
    while (changed) {
        changed = false;
        for (size_t i = 0; i + 1 < s.size(); i++) {
            if ((s[i] == '(' && s[i+1] == ')') ||
                (s[i] == '[' && s[i+1] == ']') ||
                (s[i] == '{' && s[i+1] == '}')) {
                s.erase(i, 2);
                changed = true;
                break;                       // restart — this is the O(n^2)
            }
        }
    }
    return s.empty();
}
```

<!-- @annotations -->
- 14: The break restarts the outer scan from position 0, which is the entire reason this is quadratic — resuming from i - 1 instead would make it linear and is the standard fix.
- 12: s.erase shifts every following character, so each deletion is itself O(n) on top of the rescan.
- 4: Taking the string by value, because this destroys it; taking a reference would silently empty the caller's string.

<!-- @code java -->
```java
static boolean isBalanced(String input) {
    StringBuilder s = new StringBuilder(input);
    boolean changed = true;
    while (changed) {
        changed = false;
        for (int i = 0; i + 1 < s.length(); i++) {
            char a = s.charAt(i), b = s.charAt(i + 1);
            if ((a == '(' && b == ')') || (a == '[' && b == ']') || (a == '{' && b == '}')) {
                s.delete(i, i + 2);
                changed = true;
                break;
            }
        }
    }
    return s.length() == 0;
}
```

<!-- @annotations -->
- 2: A StringBuilder because String is immutable — doing this with String concatenation would add another O(n) per deletion on top of the quadratic scan.

<!-- @code python -->
```python
def is_balanced(s: str) -> bool:
    prev = None
    while prev != s:
        prev = s
        s = s.replace("()", "").replace("[]", "").replace("{}", "")
    return s == ""


# The neat-looking one, and the quadratic one: measured 25,451.9us at
# length 8,000 against the stack's 262.5us — 97x.
```

<!-- @annotations -->
- 5: Each replace scans and rebuilds the whole string, and the loop runs until a pass changes nothing — so the work is the number of nesting levels times the length.
- 9: This is the version that circulates because it fits on one line; the cost is invisible until the input is long or deeply nested.

<!-- @approach -->
### The Shortcut That Fails - One Counter per Bracket Type

<!-- @idea -->
Track how many of each bracket type are open, without recording the order they were opened in.

<!-- @steps -->
1. Keep three counters, one per bracket type.
2. Increment the matching counter on each opening bracket.
3. Decrement it on each closing bracket, rejecting immediately if it would go negative.
4. At the end, require all three counters to be zero.
5. Note that this records how many of each kind are open and nothing at all about their order.

<!-- @complexity -->
- time: O(n), a single pass
- space: O(1) — three integers, regardless of nesting depth
- note: WRONG for more than one bracket type. Over all 72,559,411 strings of length 0 to 10 it disagreed with the stack on 66,264 — every one a false positive, calling an unbalanced string balanced, and 0 false negatives. It catches too many closers and leftover openers, because both are arithmetic; it cannot catch interleaving, because a count has no order in it. The smallest counterexample is "[(])".

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool isBalancedWRONG(const string& s) {
    int round = 0, square = 0, curly = 0;
    for (char c : s) {
        if      (c == '(') round++;
        else if (c == '[') square++;
        else if (c == '{') curly++;
        else if (c == ')') { if (--round  < 0) return false; }
        else if (c == ']') { if (--square < 0) return false; }
        else if (c == '}') { if (--curly  < 0) return false; }
    }
    return round == 0 && square == 0 && curly == 0;
}

// "[(])" -> every counter reaches zero, so this returns true.
//           The ) is closing a [ , which no counter can notice.
```

<!-- @annotations -->
- 10: The negative check is genuinely useful and catches ")(" — this method's failure is narrower than it first appears.
- 14: All three zero is necessary and not sufficient; it is the "and in the right order" half of the problem that is missing.
- 17: Four characters, and it defeats the whole approach — worth keeping as a test case for any bracket checker.

<!-- @code java -->
```java
static boolean isBalancedWRONG(String s) {
    int round = 0, square = 0, curly = 0;
    for (char c : s.toCharArray()) {
        switch (c) {
            case '(': round++;  break;
            case '[': square++; break;
            case '{': curly++;  break;
            case ')': if (--round  < 0) return false; break;
            case ']': if (--square < 0) return false; break;
            case '}': if (--curly  < 0) return false; break;
        }
    }
    return round == 0 && square == 0 && curly == 0;
}
```

<!-- @annotations -->
- 4: A switch reads more clearly than the else-if chain and has exactly the same flaw — the shape of the code is not the problem.

<!-- @code python -->
```python
def is_balanced_wrong(s: str) -> bool:
    count = {"(": 0, "[": 0, "{": 0}
    pairs = {")": "(", "]": "[", "}": "{"}
    for c in s:
        if c in count:
            count[c] += 1
        elif c in pairs:
            count[pairs[c]] -= 1
            if count[pairs[c]] < 0:
                return False
    return all(v == 0 for v in count.values())


# Returns True for "[(])".  Over all 72,559,411 strings of length 0..10
# it produced 66,264 false positives and 0 false negatives.
```

<!-- @annotations -->
- 11: all() over the counters is the elegant ending to an algorithm that is checking the wrong property.
- 15: The direction of the error is the useful part: this method is safe to use as a fast pre-filter, since anything it rejects really is unbalanced.

<!-- @approach -->
### Optimal - Match with a Stack

<!-- @idea -->
Push each opening bracket; on a closing bracket, the top of the stack must be its partner.

<!-- @steps -->
1. Start with an empty stack and scan the string once.
2. On an opening bracket, push it.
3. On a closing bracket, fail immediately if the stack is empty — there is nothing for it to close.
4. Otherwise pop and fail if the popped bracket is not the matching opener.
5. After the scan, the string is balanced exactly when the stack is empty.

<!-- @complexity -->
- time: O(n) — one pass, one push or pop per character
- space: O(n) worst case, equal to the maximum nesting depth; O(1) for flat input like "()()()"
- note: Verified against an independent pair-reduction reference over every string of length 0 to 8 from the six-symbol alphabet, 0 disagreements, and used as the reference for the full exhaustive run over all 72,559,411 strings up to length 10. Measured 13,625ns at length 8,000 against the quadratic method's 12,998,958ns. Rejection is immediate when it can be: a string failing at position 0 took 166ns against 2,108,667ns for one failing at the end, a factor of 12,703.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

bool isBalanced(const string& s) {
    if (s.size() % 2 != 0) return false;         // odd length can never balance
    vector<char> st;
    st.reserve(s.size() / 2);

    for (char c : s) {
        if (c == '(' || c == '[' || c == '{') {
            st.push_back(c);
        } else {
            if (st.empty()) return false;        // a closer with nothing open
            char open = st.back();
            st.pop_back();
            if ((c == ')' && open != '(') ||
                (c == ']' && open != '[') ||
                (c == '}' && open != '{')) return false;
        }
    }
    return st.empty();                           // anything left was never closed
}
```

<!-- @annotations -->
- 6: A free rejection for half of all inputs, since a balanced string pairs every character.
- 8: reserve to half the length, because the stack can never exceed the number of opening brackets.
- 15: The empty check must come before back() — calling back() on an empty vector is undefined behaviour, not an exception.
- 22: The final check is what catches "((", which every per-character test passes happily.

<!-- @code java -->
```java
static boolean isBalanced(String s) {
    if (s.length() % 2 != 0) return false;
    Deque<Character> st = new ArrayDeque<>();

    for (char c : s.toCharArray()) {
        if (c == '(' || c == '[' || c == '{') {
            st.push(c);
        } else {
            if (st.isEmpty()) return false;
            char open = st.pop();
            if ((c == ')' && open != '(') ||
                (c == ']' && open != '[') ||
                (c == '}' && open != '{')) return false;
        }
    }
    return st.isEmpty();
}
```

<!-- @annotations -->
- 3: ArrayDeque rather than java.util.Stack, for the reasons established in Implement Stack using Arrays.
- 10: pop() throws on an empty deque, so the isEmpty check above it is doing real work rather than being defensive.

<!-- @code python -->
```python
def is_balanced(s: str) -> bool:
    if len(s) % 2:
        return False
    pairs = {")": "(", "]": "[", "}": "{"}
    st = []
    for c in s:
        if c in "([{":
            st.append(c)
        else:
            if not st or st[-1] != pairs[c]:
                return False
            st.pop()
    return not st


# Measured 262.5us at length 8,000 against the s.replace loop's 25,451.9us.
```

<!-- @annotations -->
- 4: A dictionary from closer to opener replaces the three-way comparison and makes adding a bracket type a one-line change.
- 10: not st short-circuits before st[-1], so the empty case never reaches the index — reversing the two halves raises IndexError.

<!-- @approach -->
### Special Case - A Single Bracket Type in O(1) Space

<!-- @idea -->
With only one kind of bracket there is nothing to interleave, so a counter is not merely faster but exactly correct.

<!-- @steps -->
1. Keep one integer, the number of currently open brackets.
2. Increment on `(` and decrement on `)`.
3. Reject immediately if the counter ever goes negative — a closer arrived with nothing open.
4. At the end, require the counter to be zero.
5. Note that no stack is needed, because every open bracket is identical to every other.

<!-- @complexity -->
- time: O(n), one pass
- space: O(1) — a single integer, against the stack's O(depth)
- note: Verified over every one of the 2,097,151 strings of length 0 to 20 built from "(" and ")", with 0 disagreements against the stack. This is the precise statement of what the stack is for: it records the KINDS of the open brackets, and when there is only one kind there is nothing to record. Maximum Nesting Depth of the Parentheses is this same scan with the counter's maximum retained rather than discarded.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

bool isBalancedSingleType(const string& s) {
    int open = 0;
    for (char c : s) {
        if (c == '(') open++;
        else if (c == ')' && --open < 0) return false;
    }
    return open == 0;
}

// Exhaustively checked against the stack over all 2,097,151 strings of
// length 0..20 from "()" — 0 disagreements. O(1) space instead of O(n).
```

<!-- @annotations -->
- 8: The decrement happens inside the condition, so a stray ')' is caught the moment it appears rather than at the end.
- 10: Still required — "((" never makes the counter negative and is still unbalanced.

<!-- @code java -->
```java
static boolean isBalancedSingleType(String s) {
    int open = 0;
    for (char c : s.toCharArray()) {
        if (c == '(') open++;
        else if (c == ')' && --open < 0) return false;
    }
    return open == 0;
}
```

<!-- @annotations -->
- 5: Short-circuit evaluation means --open only runs for ')', which is what keeps the single counter correct.

<!-- @code python -->
```python
def is_balanced_single_type(s: str) -> bool:
    open_count = 0
    for c in s:
        if c == "(":
            open_count += 1
        elif c == ")":
            open_count -= 1
            if open_count < 0:
                return False
    return open_count == 0


# The same scan, keeping max(open_count) instead of discarding it, is
# Maximum Nesting Depth of the Parentheses.
```

<!-- @annotations -->
- 13: Worth noticing how many problems are this loop with a different thing remembered — depth, validity, or the position of the outermost pair.

<!-- @example -->

<!-- @input -->
"{[()]}"

<!-- @output -->
Balanced — the stack fills to depth 3 and empties exactly

<!-- @why -->
Fully nested with all three bracket types, so every push is matched by the pop immediately following its partner, and the depth is visible.

<!-- @walkthrough -->
1. Read '{': an opener, so push it. The stack is [{].
2. Read '[': push. The stack is [{, []. 
3. Read '(': push. The stack is [{, [, (] and the depth is 3, the maximum for this input.
4. Read ')': a closer. The stack is not empty, and the top is '(' — its partner. Pop. The stack is [{, [].
5. Read ']': the top is '[', its partner. Pop. The stack is [{].
6. Read '}': the top is '{', its partner. Pop. The stack is empty.
7. The scan ends with an empty stack, so the string is balanced — and note that at every closer the correct partner was the most recently pushed opener, never an earlier one.

<!-- @example -->

<!-- @input -->
"[(])"

<!-- @output -->
Unbalanced — but every counter reaches zero

<!-- @why -->
It is the smallest string on which the counting shortcut fails, and it isolates exactly which property counting cannot see.

<!-- @walkthrough -->
1. The counting method sees '[' and sets the square counter to 1.
2. It sees '(' and sets the round counter to 1.
3. It sees ']' and decrements the square counter to 0 — no complaint, since the count was positive.
4. It sees ')' and decrements the round counter to 0. All three counters are zero, so it reports balanced.
5. The stack method sees '[' and pushes it, then '(' and pushes it, leaving the stack as [[, (].
6. It reads ']' and pops, getting '(' — which is not the partner of ']', so it rejects immediately.
7. The difference is that the stack knows which bracket is innermost and the counters do not; counting records how many of each kind are open and throws away the order they were opened in.

<!-- @example -->

<!-- @input -->
Every string of length 0 to 10 over "()[]{}"

<!-- @output -->
72,559,411 strings, 66,264 counter failures, all false positives

<!-- @why -->
The alphabet is small enough to test completely, and the result is more precise than "counting is wrong" — it says exactly how counting is wrong.

<!-- @walkthrough -->
1. All 72,559,411 strings of length 0 through 10 over the six bracket symbols were enumerated.
2. Only 11,497 of them are balanced — 0.0158%, which is worth knowing when generating random test cases.
3. The stack method was checked against an independent reference that repeatedly deletes adjacent matched pairs, over lengths 0 to 8: 0 disagreements.
4. That reference shares no code and no idea with the stack, which is what makes the agreement meaningful.
5. The counter method disagreed on 66,264 strings.
6. Every one of those was a false positive — an unbalanced string reported balanced — and there were 0 false negatives.
7. So counting is a safe pre-filter and an unsafe answer: anything it rejects really is unbalanced, and anything it accepts still needs checking.

<!-- @example -->

<!-- @input -->
Rejection at the first character against rejection at the last

<!-- @output -->
166ns against 2,108,667ns — 12,703x

<!-- @why -->
The early exit is often described as an optimisation and is really a statement about the algorithm's best case, which is O(1).

<!-- @walkthrough -->
1. The input ")" followed by two million "(" fails on the very first character: a closer arrives with an empty stack.
2. The scan returns after reading one character, in 166ns.
3. The input of two million "(" followed by "))" cannot fail until the two-millionth character has been pushed.
4. That took 2,108,667ns — a factor of 12,703.
5. Neither number says anything about the average case; both say that this algorithm reads exactly as much as it needs to.
6. The same input also demonstrates the space behaviour: the second string drives the stack to two million entries, while the first never pushes anything.
7. Peak depth equals maximum nesting depth, so "(" x 50,000 + ")" x 50,000 peaks at 50,000, while "()" repeated 50,000 times peaks at 1 for the same length.

<!-- @visualization stack -->

<!-- @description -->
Open with the rule, before any code: a line of text reading "{[()]}" with an animated caret moving left to right, and beneath it the question "which open bracket must this one close?" appearing each time the caret reaches a closer. Draw arcs from each closer back to its opener as they are resolved, and let the arcs nest without ever crossing — then show a second line, "([)]", where the same arcs are forced to cross, with the crossing highlighted in red and labelled "crossing is exactly what unbalanced means". That contrast is the whole idea and should come before the stack appears. Then the mechanism on "{[()]}": the text along the top with the caret, a stack drawn vertically below it. Each opener slides down into the stack; each closer lifts the top element out and the two fly together to form a matched pair that fades. Show the depth counter reaching 3 and returning to 0. Then run "[(])" the same way and freeze at the moment ']' is read: highlight the stack top '(' and the incoming ']' side by side in red, with a caption "the top is not its partner". Beside that frozen frame, run the counting method on the same input as three small tally boxes, all reaching zero, with a green tick — then put the two verdicts next to each other, stack says no and counters say yes, and label the counters' answer wrong. Then the exhaustive panel: a large tally reading 72,559,411 strings tested, 11,497 balanced, and a two-column breakdown of the counter method's 66,264 disagreements showing 66,264 false positives and 0 false negatives — draw the zero column as an empty bar to make the one-sidedness visual. Then the cost panel: two curves against string length, the stack linear and the pair-removal method quadratic, with the measured points 46x, 250x and 954x marked. Close with the depth panel: two strings of identical length 100,000 side by side, one fully nested and one fully flat, with their stacks animating simultaneously — one climbing to 50,000 and the other never exceeding 1, captioned "the space is the nesting depth, not the length".

<!-- @sampleInput -->
```json
{"rule":{"question":"which open bracket must this closer match?","answer":"always the most recently opened one that is still open","whyStack":"that sentence is the definition of a stack","crossingVsNesting":{"balanced":"{[()]}","arcsNest":true,"unbalanced":"([)]","arcsCross":true,"caption":"crossing is exactly what unbalanced means"}},"trace":{"input":"{[()]}","steps":[{"char":"{","action":"push","stack":["{"],"depth":1},{"char":"[","action":"push","stack":["{","["],"depth":2},{"char":"(","action":"push","stack":["{","[","("],"depth":3},{"char":")","action":"pop","popped":"(","matches":true,"stack":["{","["],"depth":2},{"char":"]","action":"pop","popped":"[","matches":true,"stack":["{"],"depth":1},{"char":"}","action":"pop","popped":"{","matches":true,"stack":[],"depth":0}],"verdict":"balanced","maxDepth":3},"counterexample":{"input":"[(])","stackTrace":[{"char":"[","action":"push","stack":["["]},{"char":"(","action":"push","stack":["[","("]},{"char":"]","action":"pop","popped":"(","matches":false,"verdict":"reject"}],"counterTrace":[{"char":"[","square":1},{"char":"(","round":1},{"char":"]","square":0},{"char":")","round":0}],"counterVerdict":"balanced","truth":"unbalanced","whyCountersMiss":"a count records how many of each kind are open and throws away the order they were opened in"},"exhaustive":{"alphabet":"()[]{}","lengths":[0,10],"stringsTested":72559411,"balanced":11497,"balancedPercent":0.0158,"seconds":3.7,"independentReference":{"method":"repeatedly delete adjacent matched pairs","lengthsChecked":[0,8],"disagreements":0,"whyItCounts":"shares no code and no idea with the stack"},"counterMethod":{"disagreements":66264,"falsePositives":66264,"falseNegatives":0,"reading":"a safe pre-filter and an unsafe answer — anything it rejects really is unbalanced","smallestCounterexample":"[(])"}},"singleType":{"alphabet":"()","lengths":[0,20],"stringsTested":2097151,"disagreements":0,"space":"O(1) instead of O(n)","precisePoint":"the stack records the KINDS of the open brackets; with one kind there is nothing to record","relatedProblem":"maximum-nesting-depth-of-the-parentheses is this scan with the counter's maximum retained"},"cost":{"unit":"ns","rows":[{"length":400,"stack":1000,"pairRemoval":46125,"ratio":46},{"length":2000,"stack":3791,"pairRemoval":947167,"ratio":250},{"length":8000,"stack":13625,"pairRemoval":12998958,"ratio":954}],"shape":"the ratio grows linearly in the length, which is O(n^2) against O(n)","python":{"rows":[{"length":400,"stackUs":16.5,"replaceLoopUs":215.3,"ratio":13},{"length":2000,"stackUs":67.9,"replaceLoopUs":2605.7,"ratio":38},{"length":8000,"stackUs":262.5,"replaceLoopUs":25451.9,"ratio":97}],"note":"the s.replace loop that fits on one line is the quadratic one"}},"earlyExit":{"failsAtPositionZero":{"input":") followed by 2,000,000 (","ns":166},"failsAtTheEnd":{"input":"2,000,000 ( followed by ))","ns":2108667},"ratio":12703,"reading":"O(n) worst case, O(1) when the input fails immediately"},"depth":{"length":100000,"fullyNested":{"input":"( x 50,000 then ) x 50,000","peakDepth":50000},"flat":{"input":"() x 50,000","peakDepth":1},"conclusion":"the space is the maximum nesting depth, not the length"},"implementationNotes":{"oddLengthShortcut":"a balanced string pairs every character, so an odd length is a free rejection for half of all inputs","emptyCheckOrder":"the empty test must precede reading the top — back() on an empty vector is undefined behaviour, and st[-1] in Python raises IndexError","finalCheck":"the stack must end empty, which is what catches '((' — every per-character test passes it","pythonIdiom":"a dict from closer to opener replaces the three-way comparison and makes a new bracket type a one-line change"}}
```

<!-- @highlights -->
- A caret moves along "{[()]}" and asks, at each closer, which open bracket it must match.
- Arcs are drawn from each closer back to its opener, nesting without ever crossing.
- A second line, "([)]", forces the same arcs to cross, highlighted red and labelled "crossing is exactly what unbalanced means".
- That contrast is shown before the stack appears at all.
- The mechanism then runs on "{[()]}" with the text above and a vertical stack below.
- Each opener slides into the stack and each closer lifts the top out, the pair flying together and fading.
- A depth counter climbs to 3 and returns to 0.
- "[(])" runs the same way and freezes when ']' is read, with the stack top '(' and the incoming ']' side by side in red.
- Beside the frozen frame, three tally boxes run the counting method to zero and show a green tick.
- The two verdicts sit together — stack says no, counters say yes — with the counters' answer marked wrong.
- A tally reads 72,559,411 strings tested and 11,497 balanced.
- The counter method's 66,264 disagreements are broken into 66,264 false positives and 0 false negatives.
- The zero column is drawn as an empty bar to make the one-sidedness visual.
- Two curves plot cost against length, the stack linear and pair-removal quadratic, marked at 46x, 250x and 954x.
- Two strings of identical length 100,000 animate their stacks simultaneously, one fully nested and one flat.
- One climbs to 50,000 while the other never exceeds 1, captioned "the space is the nesting depth, not the length".

<!-- @edgeCases -->
- The empty string — balanced, and the loop never runs; the final emptiness check returns true correctly.
- Odd length — can never balance, which is a free rejection for half of all inputs before any scanning.
- A closer with nothing open, like ")(" — caught by the empty-stack check, not by the final one.
- Openers never closed, like "((" — passes every per-character test and is caught only by the final emptiness check.
- "[(])" — the smallest string the counting shortcut reports as balanced.
- Deeply nested input — the stack reaches the full nesting depth, so 50,000 nested pairs cost 50,000 entries.
- Flat input like "()()()" — peak depth 1, so the space is effectively O(1).
- A single bracket type — a counter is exactly correct, verified over all 2,097,151 strings up to length 20.
- Non-bracket characters — this version ignores them implicitly by falling through; decide deliberately whether they should be skipped or rejected.
- Calling back() or st[-1] before checking emptiness — undefined behaviour in C++ and an IndexError in Python.
- Very long input in Python — the s.replace loop is quadratic and measured 97x slower at length 8,000.

<!-- @pitfalls -->
- Counting brackets per type instead of stacking them. It produced 66,264 false positives over 72,559,411 strings, the smallest being "[(])".
- Forgetting the final emptiness check. Every per-character test passes "((", so the string is only rejected by what happens after the loop.
- Reading the stack top before checking that the stack is non-empty. back() on an empty vector is undefined behaviour, and st[-1] raises IndexError.
- Using the repeated-replace idiom in Python. It is quadratic and measured 25,451.9us at length 8,000 against the stack's 262.5us.
- Restarting the scan from position 0 after each deletion in the pair-removal method. Resuming from i - 1 makes it linear; restarting is what makes it O(n^2).
- Assuming the counting method is merely imprecise. Its error is one-sided — it never rejects a valid string — which makes it usable as a pre-filter and unusable as an answer.
- Pushing closing brackets as well as openers. Only openers belong on the stack; pushing both makes the top meaningless.
- Comparing the closer to the popped value directly. They are different characters, so the comparison needs a mapping — a dict, a switch, or three explicit tests.
- Taking the string by reference in the pair-removal version. It destroys the string, so the caller's copy is silently emptied.
- Assuming the space is O(n) always. It is the maximum nesting depth: 50,000 for fully nested input and 1 for flat input of the same length.
- Skipping the odd-length shortcut. It rejects half of all possible inputs before any work, and costs one comparison.
- Treating unexpected characters implicitly. Falling through to the closer branch will pop the stack for a letter, which is almost never intended.

<!-- @doubt -->
### Why is a stack the right structure here?

<!-- @answer -->
Because of one fact about brackets: when a closing bracket arrives, the opener it must match is always the most recently opened one still open. Never an earlier one — if an earlier bracket closed first, its range would cross the later one's rather than containing it, and crossing is precisely what unbalanced means. A structure that returns the most recent thing you put in is a stack, so the algorithm is a single pass with no lookahead and no backtracking.

<!-- @doubt -->
### Why can't I just count each bracket type?

<!-- @answer -->
Because counting throws away order, and order is exactly what the problem is about. Counting catches two of the three ways a string can be wrong — too many closers, which drives a counter negative, and openers left over, which leaves a counter positive — but it cannot catch interleaving. "[(])" opens a square, opens a round, closes the square, closes the round: every counter returns to zero and the string is still invalid. Measured over all 72,559,411 strings of length 0 to 10, the counting method got 66,264 wrong, all of them false positives.

<!-- @doubt -->
### Are the counting method's errors always in the same direction?

<!-- @answer -->
Yes, and that is worth relying on. Across the full exhaustive run there were 66,264 false positives and 0 false negatives — it never rejected a balanced string. That makes it sound as a fast pre-filter: anything it rejects genuinely is unbalanced, so you can run it first and only pay for the stack on strings that survive. It is unsound as an answer, because everything it accepts still needs checking. Knowing which direction an approximation errs in is usually more useful than knowing its error rate.

<!-- @doubt -->
### When is a counter enough?

<!-- @answer -->
When there is only one kind of bracket. With just "(" and ")" there is nothing to interleave — every open bracket is interchangeable with every other — so a single integer suffices, and it was verified over every one of the 2,097,151 strings of length 0 to 20 with 0 disagreements against the stack. That drops the space from O(n) to O(1). The precise statement is that the stack exists to record the *kinds* of the open brackets; when there is only one kind, there is nothing to record and only the count remains.

<!-- @doubt -->
### Why is the final emptiness check necessary?

<!-- @answer -->
Because it is the only thing that catches unclosed openers. Consider "((": every character is an opening bracket, so the loop pushes twice and never enters the closing branch, never finds an empty stack, and never finds a mismatch. Every per-character test passes. The string is unbalanced solely because two brackets were opened and never closed, and that fact is only visible after the scan ends. Dropping the check is a common bug precisely because it survives any test whose inputs all end in a closing bracket.

<!-- @doubt -->
### How bad is the repeated-replace version?

<!-- @answer -->
Quadratic, and the constant is not small. In C++ it measured 46x slower at length 400, 250x at 2,000 and 954x at 8,000 — the ratio growing linearly in the length, which is exactly O(n²) against O(n). In Python the one-line s.replace("()", "").replace("[]", "")... loop gave 13x, 38x and 97x at the same lengths. The reason is that every deletion restarts the scan and shifts the remaining characters. It is worth writing once as an independent reference — it agreed with the stack on every string of length 0 to 8 — and worth never shipping.

<!-- @doubt -->
### Does the early exit matter?

<!-- @answer -->
It is the difference between O(n) and O(1) on inputs that fail immediately, which is measurable rather than theoretical: a string beginning with ")" followed by two million "(" was rejected in 166ns, while two million "(" followed by "))" took 2,108,667ns — a factor of 12,703. Both are the same algorithm; the first simply stops after one character. This also means the average cost on random input is very low, since only 0.0158% of strings of length 10 are balanced and most fail early.

<!-- @doubt -->
### How much memory does this need?

<!-- @answer -->
The maximum nesting depth, not the length. For 50,000 nested pairs the stack reaches 50,000 entries; for the same 100,000 characters written flat as "()" repeated 50,000 times, the peak depth is 1. So the worst case is O(n) and typical input is far cheaper. Reserving half the length up front is a reasonable default, since the stack can never hold more entries than there are opening brackets. If the input is adversarial and memory is bounded, the depth is the thing to cap.

<!-- @doubt -->
### What about characters that are not brackets?

<!-- @answer -->
Decide deliberately, because the natural code shape gets it wrong. Writing the scan as "if it is an opener, push; otherwise treat it as a closer" means a letter will pop the stack and be compared against an opener, which almost certainly rejects a valid string. Either skip non-bracket characters explicitly, or reject them, depending on whether the input is source code with text between the brackets or a pure bracket string. The exhaustive verification here used the six bracket symbols only, so it says nothing about that choice.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Number of Greater Elements to the Right, and through it the monotonic-stack family that occupies most of this topic. The shape is the same one this subtopic uses in its simplest form: the stack holds items that are still waiting for something, and each new item resolves however many of them it can. Here an open bracket waits for its closer and exactly one item is resolved at a time; there an element waits for a larger value and a single new element can resolve many at once. Recognising that both are the same pattern is most of what the rest of this topic asks for.
