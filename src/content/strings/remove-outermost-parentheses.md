---
id: remove-outermost-parentheses
topic: Strings
title: Remove Outermost Parentheses
difficulty: Medium
status: ready
prerequisites:
  - for-loop
  - if-else-statements
  - variables-and-constants
  - count-number-of-substrings
  - sort-characters-by-frequency
  - time-and-space-complexity-basics
relatedIds:
  - maximum-nesting-depth-of-the-parentheses
  - count-number-of-substrings
  - reverse-every-word-in-a-string
  - sort-characters-by-frequency
  - largest-odd-number-in-a-string
---

<!-- @summary -->
Strip the outer parentheses from each primitive block of a valid parentheses string — where a depth counter replaces the whole decomposition, verified over 626 exhaustive strings; where the textbook O(1)-space one-pass answer measured **4.9x slower** than copying blocks because it appends one character at a time; and where the classic warning that `out += c` is quadratic in Python is simply **no longer true** — measured x1.99 per doubling, which is linear.

<!-- @theory -->
## The problem

A **primitive** valid parentheses string is one that cannot be split into two
non-empty valid parts. Every valid string decomposes uniquely into primitives.
Remove the outermost parentheses of each and concatenate what is left.

```
"(()())(())"          ->  "()()()"
"(()())(())(()(()))"  ->  "()()()()(())"
"()()"                ->  ""
"((()))"              ->  "(())"
```

The input is guaranteed valid, so there is no error case to handle — only a
decomposition to perform.

## The decomposition is a running balance hitting zero

Walk left to right adding one for `(` and subtracting one for `)`. A primitive
ends exactly where the running balance returns to zero, because that is precisely
where the prefix so far is valid and every shorter prefix was not.

```
( ( ) ( ) )  ( ( ) )
1 2 1 2 1 0  1 2 1 0
          ^        ^
      primitive  primitive
```

That gives the literal algorithm: find the boundaries, drop the first and last
character of each block, join.

## But you never have to build the blocks

Ask which characters survive rather than which blocks they belong to. A character
is removed exactly when it is one of the outermost pair of its primitive, and that
is visible from the depth alone:

- Keep a `(` when the depth **before** it is greater than zero.
- Keep a `)` when the depth **after** it is greater than zero.

The two off-by-one halves are the entire subtlety, and they are not symmetric:
one tests before the update and one after. That is because an opening bracket at
depth 0 starts a primitive, while a closing bracket that returns to depth 0 ends
one.

Verified against the literal split-and-strip over every valid parentheses string
up to length 14 — **626 strings, zero mismatches**, and the same for a stack-based
version.

## How much survives

If the string has `n` characters and decomposes into `p` primitives, the output
has exactly `n - 2p` characters — two removed per primitive. Zero violations over
the same 626 strings.

That formula is worth keeping because it bounds everything below. The two extremes
are both ordinary inputs:

| Input | n | Primitives | Output |
|---|---|---|---|
| `"()()()..."` | 200,000 | 100,000 | **0** |
| `"((( ... )))"` | 200,000 | **1** | 199,998 |
| Random valid | 200,000 | 219 | 199,562 |

A string of 100,000 `"()"` pairs produces nothing at all. A single deeply nested
block produces almost the entire input. Across all valid strings up to length 14,
the mean surviving fraction is 0.6432.

## The textbook answer is the slow one

The depth counter is the standard recommendation: one pass, O(1) extra space, no
decomposition. It is also, on most inputs, the slowest correct approach here.

Measured at n = 200,000, microseconds:

| Shape | Primitives | Output | Depth counter | Boundaries + block copies |
|---|---|---|---|---|
| Random valid | 219 | 199,562 | **1,083.19** | **205.53** |
| `"()()()..."` | 100,000 | 0 | **96.33** | 222.10 |
| `"((( ... )))"` | 1 | 199,998 | 523.05 | **208.45** |
| `"(())(())..."` | 50,000 | 100,000 | 367.22 | **331.42** |

The depth counter is **4.9x slower** on random input and 2.5x slower on a nested
one — then 2.3x faster on the flat one. The reason is what each version's cost
tracks:

- The **depth counter** appends one character at a time, so its cost follows the
  **output size**. On the flat string the output is empty and it does nothing.
- The **block version** appends one run per primitive with a `memcpy`, so its cost
  follows the **primitive count**. On the flat string it makes 100,000 tiny
  copies.

This is the same result **Sort Characters by Frequency** measured from the other
direction: a run written as one block costs almost nothing, and the same bytes
written one at a time cost everything.

Note the stability. The block version spans 205.53 to 331.42 across all four
shapes — **1.6x**. The depth counter spans 96.33 to 1,083.19 — **11.2x**. One of
them has a performance profile you can predict.

## Two of those numbers differ only by branch prediction

Look again at the depth counter on random input (1,083.19us) against the nested
one (523.05us). Their outputs are almost the same size — 199,562 and 199,998
characters — and their inputs are identical in length. It does the same number of
appends either way.

The difference is that `"((( ... )))"` is 100,000 predictable `(` followed by
100,000 predictable `)`, while the random string flips unpredictably. **2.1x from
branch misprediction alone**, on the same work.

The block version does not pay it, because its inner work is a `memcpy` rather
than a per-character branch.

## Python: the quadratic-concatenation warning is out of date

The standard advice is to never build a string with `out += c` in a loop, because
strings are immutable and each concatenation copies — making it O(n^2). CPython
has optimised that case for years: when the string being appended to has a
reference count of one, it is resized in place.

Measured, building the output character by character:

| n | `out += c` | Growth | `list.append` + `join` | Growth |
|---|---|---|---|---|
| 25,000 | 1,487.7us | | 1,086.6us | |
| 50,000 | 2,952.6us | **x1.98** | 2,189.7us | x2.02 |
| 100,000 | 5,881.0us | **x1.99** | 4,351.9us | x1.99 |
| 200,000 | 11,692.6us | **x1.99** | 8,814.6us | x2.03 |

Both are linear. `+=` is about **1.3x slower**, not asymptotically worse. The
advice to use `join` is still right — it is just right for a factor, not for a
complexity class, and repeating the quadratic claim teaches a wrong model.

The optimisation is fragile in a way worth knowing: it depends on the refcount
being one, so keeping a second reference to the partial string, or building it
inside a class attribute, silently restores the quadratic behaviour.

## Python's ranking is flatter

The same four shapes at n = 200,000, microseconds:

| Shape | Depth + join | Depth + `+=` | Block copies |
|---|---|---|---|
| Random valid | 8,792.2 | 11,092.2 | **7,990.8** |
| `"()()()..."` | **5,478.7** | 5,530.2 | 11,148.9 |
| `"((( ... )))"` | 8,724.6 | 11,771.5 | **8,015.1** |
| `"(())(())..."` | **7,473.7** | 8,543.1 | 12,118.7 |

Everything is within about 1.6x, and everything is roughly 40x the C++ figures,
because the per-character Python loop dominates whatever the appends do. So in
Python the choice is a readability one — `depth + join` is the most consistent
across shapes and the shortest to read.

## What to write

At the stated constraint the input is at most 100,000 characters and every
approach here finishes in well under a millisecond, so write the depth counter:
it is four lines, needs no extra space, and states the rule directly. Reach for
block copies when the strings are large, the primitives are few, and the profile
says this function matters — which is exactly when the depth counter is at its
worst.

<!-- @intuition -->
The problem describes an operation on blocks — decompose into primitives, strip each one — and the useful move is to stop thinking about blocks and ask what makes a single character survive. A bracket is removed precisely when it is the outer pair of its primitive, and that is a local property: the depth at that moment. Once you see it, the decomposition disappears and the whole thing is a counter. The second half is a caution about what "optimal" means. The depth counter is optimal in the sense complexity notation measures — one pass, constant extra space — and it is the slowest thing here on most inputs, because it emits the answer one character at a time while the version that looks wasteful emits it in runs. Whether that matters depends on a property of the input that the complexity analysis never names: how many primitives there are. The two versions have costs that track different quantities entirely, so neither dominates, and the only way to know which you want is to know what your strings look like.

<!-- @approach -->
### Split Into Primitives, Strip Each

<!-- @idea -->
Find where the running balance returns to zero, cut there, drop the first and last character of each block, and join.

<!-- @steps -->
1. Track a running balance, adding one for an opening bracket and subtracting one for a closing one.
2. Record the start of the current primitive.
3. When the balance returns to zero, the primitive ends at this position.
4. Take the block between the start and here, without its first and last character.
5. Append that to the output and set the next start to the following position.
6. Return the joined result.

<!-- @complexity -->
- time: O(n) — one pass, plus one copy per primitive
- space: O(n) for the output, and O(n) more if each primitive is materialised as its own string first
- note: The literal reading of the problem statement, and the one to write if you also need the primitives for something else. Materialising each block as a separate string before stripping it costs an allocation per primitive — measured 886.50 microseconds against 385.65 for the version that only records boundaries, on a string of 100,000 primitives. Both are correct; only one allocates.

<!-- @code cpp -->
```cpp
#include <string>
#include <vector>
using namespace std;

string removeOuterParentheses(const string& s) {
    vector<string> primitives;
    int depth = 0;
    size_t start = 0;
    for (size_t i = 0; i < s.size(); i++) {
        depth += s[i] == '(' ? 1 : -1;
        if (depth == 0) {
            primitives.push_back(s.substr(start, i + 1 - start));
            start = i + 1;
        }
    }
    string out;
    for (const string& p : primitives) out += p.substr(1, p.size() - 2);
    return out;
}
```

<!-- @annotations -->
- 12: One allocation per primitive, and a second on line 17 to strip it. On a string of 100,000 `"()"` pairs that is 200,000 allocations to produce an empty answer.
- 11: The balance returning to zero is the definition of a primitive boundary — the prefix so far is valid and no shorter prefix was.

<!-- @code java -->
```java
static String removeOuterParentheses(String s) {
    StringBuilder out = new StringBuilder(s.length());
    int depth = 0, start = 0;
    for (int i = 0; i < s.length(); i++) {
        depth += s.charAt(i) == '(' ? 1 : -1;
        if (depth == 0) {
            out.append(s, start + 1, i);
            start = i + 1;
        }
    }
    return out.toString();
}
```

<!-- @annotations -->
- 7: `append(CharSequence, start, end)` copies the range directly out of the source, so no intermediate `String` is created per primitive.
- 2: Pre-sizing to the input length means no reallocation, since the output can never be longer than the input.

<!-- @code python -->
```python
def remove_outer_parentheses(s):
    out = []
    depth = 0
    start = 0
    for i, c in enumerate(s):
        depth += 1 if c == "(" else -1
        if depth == 0:
            out.append(s[start + 1:i])
            start = i + 1
    return "".join(out)


# 7,990.8us on random input at n = 200,000 -- the fastest of the three
# Python versions there, and the slowest on a flat string of 100,000
# primitives at 11,148.9.
```

<!-- @annotations -->
- 8: The slice is empty when the primitive is exactly `"()"`, so this appends `""` 100,000 times on a flat string. Guarding with `if i > start + 1` skips that.

<!-- @approach -->
### Optimal - One Pass With a Depth Counter

<!-- @idea -->
A bracket is removed exactly when it is the outer pair of its primitive, and the depth alone says which those are.

<!-- @steps -->
1. Start the depth at zero and the output empty.
2. For an opening bracket, append it only if the depth is already above zero, then increase the depth.
3. For a closing bracket, decrease the depth first, then append it only if the depth is still above zero.
4. Return the output.

<!-- @complexity -->
- time: O(n) — one pass, one branch per character
- space: O(1) beyond the output, with no decomposition stored
- note: The one to write at the stated constraint: four lines, no extra structure, and it states the rule rather than reconstructing it. Its cost tracks the **output** size, since it appends one character at a time — measured 1,083.19 microseconds on random input at n = 200,000 against 205.53 for block copies, and 96.33 against 222.10 on a flat string where the output is empty. Across four shapes it spans 11.2x while the block version spans 1.6x.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

string removeOuterParentheses(const string& s) {
    string out;
    out.reserve(s.size());
    int depth = 0;
    for (char c : s) {
        if (c == '(') {
            if (depth > 0) out += c;
            depth++;
        } else {
            depth--;
            if (depth > 0) out += c;
        }
    }
    return out;
}
```

<!-- @annotations -->
- 10: Test **before** the increment. An opening bracket at depth 0 is the one that starts a primitive, so it is the one to drop.
- 13: Test **after** the decrement. A closing bracket that brings the depth back to 0 is the one that ends a primitive. The asymmetry between these two lines is the whole subtlety.
- 6: Reserving the input's length avoids reallocation, since the output is never longer.

<!-- @code java -->
```java
static String removeOuterParentheses(String s) {
    StringBuilder out = new StringBuilder(s.length());
    int depth = 0;
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (c == '(') {
            if (depth > 0) out.append(c);
            depth++;
        } else {
            depth--;
            if (depth > 0) out.append(c);
        }
    }
    return out.toString();
}
```

<!-- @annotations -->
- 7: Writing `depth++` before this test drops the wrong bracket — it keeps the outer one and discards an inner one, which is valid-looking output with the wrong content.

<!-- @code python -->
```python
def remove_outer_parentheses(s):
    out = []
    depth = 0
    for c in s:
        if c == "(":
            if depth > 0:
                out.append(c)
            depth += 1
        else:
            depth -= 1
            if depth > 0:
                out.append(c)
    return "".join(out)


# The most consistent Python version across input shapes: 8,792.2us
# random, 5,478.7 flat, 8,724.6 nested, 7,473.7 alternating -- all
# within 1.6x, where the block version spans 11,148.9 to 7,990.8.
```

<!-- @annotations -->
- 13: `"".join` on a list rather than `out += c` on a string. The difference is about 1.3x, not the quadratic blowup the usual warning describes.

<!-- @approach -->
### Boundaries and Block Copies

<!-- @idea -->
Record where each primitive starts and ends, then copy the stripped interior as one block instead of one character at a time.

<!-- @steps -->
1. Track the running balance and the start of the current primitive.
2. When the balance returns to zero, the primitive spans from the start to here.
3. Copy the range between them, excluding the first and last character, as a single block.
4. Skip the copy entirely when that range is empty.
5. Move the start to the next position and continue.

<!-- @complexity -->
- time: O(n) — one pass, plus one block copy per primitive rather than one append per character
- space: O(n) for the output, O(1) beyond it
- note: The fastest and by far the steadiest, because its inner work is a `memcpy` rather than a per-character branch. Measured across four shapes at n = 200,000: 205.53, 222.10, 208.45 and 331.42 microseconds — a **1.6x** spread, where the depth counter spans 96.33 to 1,083.19, or **11.2x**. The skip on empty ranges is what keeps it competitive on a flat string, improving 378.02 to 222.10.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

string removeOuterParentheses(const string& s) {
    string out;
    out.reserve(s.size());
    int depth = 0;
    size_t start = 0;
    for (size_t i = 0; i < s.size(); i++) {
        depth += s[i] == '(' ? 1 : -1;
        if (depth == 0) {
            if (i > start + 1) out.append(s, start + 1, i - start - 1);
            start = i + 1;
        }
    }
    return out;
}
```

<!-- @annotations -->
- 12: The guard skips the append when the primitive is exactly `"()"`. Without it, a string of 100,000 such primitives makes 100,000 zero-length calls — measured 378.02 microseconds against 222.10. The append itself is one `memcpy`, which is the whole difference from the depth counter that reaches the same bytes one at a time.
- 10: No substring is built. The primitive is described by two indices and copied straight out of the source.

<!-- @code java -->
```java
static String removeOuterParentheses(String s) {
    StringBuilder out = new StringBuilder(s.length());
    int depth = 0, start = 0;
    for (int i = 0; i < s.length(); i++) {
        depth += s.charAt(i) == '(' ? 1 : -1;
        if (depth == 0) {
            if (i > start + 1) out.append(s, start + 1, i);
            start = i + 1;
        }
    }
    return out.toString();
}
```

<!-- @annotations -->
- 7: Java's `append(CharSequence, start, end)` takes an exclusive end index, where the C++ overload takes a length — an easy place to be off by one when porting between them.

<!-- @code python -->
```python
def remove_outer_parentheses(s):
    out = []
    depth = 0
    start = 0
    for i, c in enumerate(s):
        depth += 1 if c == "(" else -1
        if depth == 0:
            if i > start + 1:
                out.append(s[start + 1:i])
            start = i + 1
    return "".join(out)


# In Python the advantage largely evaporates -- 7,990.8us against
# 8,792.2 on random input -- because the interpreted loop dominates
# whatever the appends do. Roughly 40x the C++ figures throughout.
```

<!-- @annotations -->
- 8: The same empty-range guard. It matters more here, since a flat string would otherwise append 100,000 empty strings to the list before joining them.

<!-- @example -->

<!-- @input -->
s = "(()())(())"

<!-- @output -->
"()()()"

<!-- @why -->
Two primitives of different shapes, enough to show the balance-hits-zero rule and the depth rule agreeing.

<!-- @walkthrough -->
1. The running balance is 1, 2, 1, 2, 1, 0 over the first six characters, so the first primitive is `"(()())"`.
2. It continues 1, 2, 1, 0 over the last four, so the second primitive is `"(())"`.
3. Stripping the outer pair of each gives `"()()"` and `"()"`.
4. Concatenated, that is `"()()()"`.
5. By the depth rule: the first `(` is at depth 0 before it, so it is dropped.
6. The final `)` brings the depth to 0, so it is dropped — and the same happens at the boundaries of the second primitive.
7. Every other character sits strictly inside a primitive and survives.
8. Checking the identity: n is 10, there are 2 primitives, so the output is 10 - 4 = 6 characters.

<!-- @example -->

<!-- @input -->
s = "()()()..." with 100,000 pairs, against "(((...)))" with 100,000 of each

<!-- @output -->
Empty and 199,998 characters — from inputs of identical length

<!-- @why -->
The two extremes of the `n - 2p` identity, and the pair of inputs on which the two fast approaches swap places.

<!-- @walkthrough -->
1. Both inputs are 200,000 characters long.
2. The flat string has 100,000 primitives, each exactly `"()"`, so 200,000 characters are removed and the output is empty.
3. The nested string is a single primitive, so 2 characters are removed and the output is 199,998.
4. The depth counter appends once per surviving character, so it does nothing on the first and 199,998 appends on the second — 96.33 against 523.05 microseconds.
5. The block version copies once per primitive, so it makes 100,000 copies on the first and one on the second — 222.10 against 208.45.
6. Each is fastest exactly where the other is slowest.
7. Neither dominates, and which you want depends on how many primitives your strings have — a quantity the complexity analysis never mentions.

<!-- @example -->

<!-- @input -->
Random valid input and fully nested input, both 200,000 characters, through the depth counter

<!-- @output -->
1,083.19us and 523.05us — 2.1x apart for the same amount of work

<!-- @why -->
Isolates a cost that is not in the algorithm at all, by holding the work fixed and changing only the predictability of the data.

<!-- @walkthrough -->
1. The random string produces 199,562 output characters; the nested string produces 199,998.
2. So both perform essentially the same number of appends, on inputs of the same length.
3. The depth counter branches on every character: is it an opening or a closing bracket, and is the depth above zero.
4. In `"((( ... )))"` the answer is the same for 100,000 characters in a row, then the same for the next 100,000.
5. The branch predictor gets that almost perfectly right.
6. In a random valid string the brackets alternate unpredictably, and the predictor misses often.
7. The measured gap is 2.1x, from branch misprediction alone.
8. The block-copy version does not show it, because its inner work is a `memcpy` with no per-character branch.

<!-- @example -->

<!-- @input -->
Building a 200,000-character output in Python, `out += c` against `list.append` then `join`

<!-- @output -->
11,692.6us and 8,814.6us — both growing x1.99 per doubling

<!-- @why -->
Tests a piece of advice that is repeated constantly and is no longer true as stated.

<!-- @walkthrough -->
1. The classic warning is that `out += c` in a loop is O(n^2), because strings are immutable so each step copies the whole accumulated result.
2. CPython optimises the case where the target's reference count is one, resizing the string in place instead of copying.
3. Measured at n of 25,000, 50,000, 100,000 and 200,000: 1,487.7, 2,952.6, 5,881.0 and 11,692.6 microseconds.
4. That is growth of x1.98, x1.99 and x1.99 — linear, not quadratic.
5. The `join` version measured 1,086.6, 2,189.7, 4,351.9 and 8,814.6, growing x2.02, x1.99 and x2.03.
6. So `join` is about 1.3x faster, which is a constant factor rather than a complexity class.
7. The advice to prefer `join` still stands; the reason usually given for it does not.
8. The optimisation depends on the refcount being one, so holding a second reference to the partial string restores the quadratic behaviour.

<!-- @visualization custom -->

<!-- @description -->
Draw the string as a row of brackets with a balance line plotted beneath it, rising on each `(` and falling on each `)`. Mark every point where the line touches zero and drop a divider there, so the primitives appear as segments without any explicit splitting step — the balance curve is the decomposition. Then shade the first and last bracket of each segment in a removal colour and let them fade out, leaving the answer. Immediately re-derive the same result locally: sweep a cursor along the string with a depth readout, and at each bracket show the two tests side by side — for `(`, is the depth above zero *before* the update; for `)`, is it above zero *after* — with the removal colour lighting up exactly on the characters the segments marked. The asymmetry between the two tests should be visible as two differently placed probes on the same counter. The centre of the figure is the cost model, and it needs two panels that swap. On the left, a flat string of 100,000 `"()"` primitives: draw the depth counter emitting nothing at all while the block version fires 100,000 tiny copy operations, with timings 96.33us and 222.10us. On the right, one deeply nested primitive: the depth counter emits 199,998 characters one at a time while the block version performs a single wide `memcpy`, with timings 523.05us and 208.45us. The highlight marking the winner must visibly swap sides between the panels, and both inputs must be drawn the same width, because they are the same length. Beneath them put the stability bars: the depth counter's four shape timings spanning 11.2x and the block version's spanning 1.6x. Close on the branch-prediction result, which needs no algorithm at all: two inputs of equal length producing near-equal output — 199,562 and 199,998 characters — with a predictable bracket pattern on one side and a random one on the other, and the two timings 523.05us and 1,083.19us joined by a label reading same work, 2.1x, mispredicted branches.

<!-- @sampleInput -->
```json
{"primary":{"s":"(()())(())","primitives":["(()())","(())"],"answer":"()()()","balance":[1,2,1,2,1,0,1,2,1,0],"n":10,"p":2,"outputLength":6},"smallCases":[{"s":"(()())(())","answer":"()()()"},{"s":"(()())(())(()(()))","answer":"()()()()(())"},{"s":"()()","answer":""},{"s":"((()))","answer":"(())"},{"s":"()","answer":""},{"s":"","answer":""}],"decomposition":{"rule":"a primitive ends exactly where the running balance returns to zero","why":"that is precisely where the prefix so far is valid and no shorter prefix was","uniqueness":"every valid string decomposes uniquely into primitives"},"depthRule":{"keepOpen":"append '(' only when the depth BEFORE it is greater than zero","keepClose":"append ')' only when the depth AFTER it is greater than zero","asymmetry":"one test is before the update and one is after — an opening bracket at depth 0 starts a primitive, a closing bracket returning to depth 0 ends one","verification":{"space":"all valid parentheses strings up to length 14","strings":626,"depthCounterMismatches":0,"stackVersionMismatches":0}},"outputLengthIdentity":{"formula":"|out| = n - 2p","meaning":"two characters removed per primitive","violations":0,"checkedOver":626,"meanSurvivingFraction":0.6432,"extremes":[{"shape":"100,000 \"()\" pairs","n":200000,"primitives":100000,"output":0},{"shape":"fully nested","n":200000,"primitives":1,"output":199998},{"shape":"random valid","n":200000,"primitives":219,"output":199562}]},"costModel":{"depthCounter":"cost tracks the OUTPUT size — one append per surviving character","blockCopies":"cost tracks the PRIMITIVE count — one memcpy per primitive","consequence":"neither dominates; each is fastest exactly where the other is slowest"},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2, n = 200,000","rows":[{"shape":"random valid","primitives":219,"output":199562,"depthCounter":1083.19,"blockCopies":205.53,"blockNoGuard":215.32,"splitWithSubstrings":221.95},{"shape":"flat, 100,000 primitives","primitives":100000,"output":0,"depthCounter":96.33,"blockCopies":222.10,"blockNoGuard":378.02,"splitWithSubstrings":886.50},{"shape":"fully nested","primitives":1,"output":199998,"depthCounter":523.05,"blockCopies":208.45,"blockNoGuard":205.70,"splitWithSubstrings":206.22},{"shape":"alternating (())","primitives":50000,"output":100000,"depthCounter":367.22,"blockCopies":331.42,"blockNoGuard":346.39}],"stability":{"depthCounterSpread":"96.33 to 1083.19 — 11.2x","blockCopiesSpread":"205.53 to 331.42 — 1.6x"},"emptyRangeGuard":"skipping zero-length appends improved the flat case from 378.02 to 222.10","branchPrediction":{"randomInput":{"output":199562,"us":1083.19},"nestedInput":{"output":199998,"us":523.05},"ratio":"2.1x","reading":"same input length, near-equal output size, same number of appends — the gap is branch misprediction alone","blockVersionUnaffected":"its inner work is a memcpy with no per-character branch"},"stackVersion":"measured within noise of the depth counter (1050.42 against 1083.19 on random input) — the stack's contents are never read, only its size, so it is a counter with extra memory"},"benchPython":{"unit":"microseconds per run, CPython 3.13.4, n = 200,000","rows":[{"shape":"random valid","primitives":662,"output":198676,"depthJoin":8792.2,"depthPlusEquals":11092.2,"blockCopies":7990.8},{"shape":"flat","primitives":100000,"output":0,"depthJoin":5478.7,"depthPlusEquals":5530.2,"blockCopies":11148.9},{"shape":"fully nested","primitives":1,"output":199998,"depthJoin":8724.6,"depthPlusEquals":11771.5,"blockCopies":8015.1},{"shape":"alternating (())","primitives":50000,"output":100000,"depthJoin":7473.7,"depthPlusEquals":8543.1,"blockCopies":12118.7}],"reading":"everything within about 1.6x and roughly 40x the C++ figures — the interpreted loop dominates whatever the appends do, so the choice is readability","recommendation":"depth + join is the most consistent across shapes"},"concatenationMyth":{"claim":"out += c in a loop is O(n^2) because strings are immutable","status":"no longer true as stated in CPython","why":"when the target's reference count is one, the string is resized in place instead of copied","measured":[{"n":25000,"plusEquals":1487.7,"listJoin":1086.6},{"n":50000,"plusEquals":2952.6,"plusEqualsGrowth":"x1.98","listJoin":2189.7,"listJoinGrowth":"x2.02"},{"n":100000,"plusEquals":5881.0,"plusEqualsGrowth":"x1.99","listJoin":4351.9,"listJoinGrowth":"x1.99"},{"n":200000,"plusEquals":11692.6,"plusEqualsGrowth":"x1.99","listJoin":8814.6,"listJoinGrowth":"x2.03"}],"verdict":"both linear; join is about 1.3x faster — a constant factor, not a complexity class","fragility":"the optimisation depends on the refcount being one, so holding a second reference to the partial string restores the quadratic behaviour"},"assertions":["the output is the input with 2p characters removed, where p is the primitive count","the output is itself a valid parentheses string","no removed character sits at a depth greater than one","the output is empty exactly when every primitive is \"()\"","the answer is unchanged by any decomposition method"],"recommendation":"at the stated 100,000-character constraint write the depth counter — four lines, O(1) space, states the rule directly; reach for block copies when strings are large, primitives are few, and the profile points here","lesson":"optimal in the complexity sense and fastest in practice are different claims, and here they point at different code — one version's cost follows the output size and the other's follows the primitive count"}
```

<!-- @highlights -->
- The string is drawn as a row of brackets with a balance line beneath it, rising on each `(` and falling on each `)`.
- Every point where the line touches zero gets a divider, so the primitives appear as segments with no explicit splitting step.
- The first and last bracket of each segment shade in a removal colour and fade out, leaving the answer.
- The same result is re-derived locally: a cursor sweeps the string with a depth readout.
- At each bracket the two tests show side by side — for `(`, is the depth above zero before the update; for `)`, is it above zero after.
- The removal colour lights up on exactly the characters the segments marked, and the asymmetry appears as two differently placed probes on one counter.
- The centre holds two panels that swap. On the left, a flat string of 100,000 `"()"` primitives.
- There the depth counter emits nothing at all while the block version fires 100,000 tiny copies — 96.33us against 222.10us.
- On the right, one deeply nested primitive: the depth counter emits 199,998 characters one at a time.
- The block version performs a single wide `memcpy` — 523.05us against 208.45us.
- The highlight marking the winner visibly swaps sides, and both inputs are drawn the same width because they are the same length.
- Stability bars sit beneath: the depth counter's four timings spanning 11.2x, the block version's spanning 1.6x.
- The close is the branch-prediction result, needing no algorithm at all.
- Two inputs of equal length produce near-equal output — 199,562 and 199,998 characters.
- One has a predictable bracket pattern and the other a random one.
- The timings 523.05us and 1,083.19us are joined by a label reading same work, 2.1x, mispredicted branches.

<!-- @edgeCases -->
- The empty string — returns empty; every version falls through its loop without special handling.
- `"()"` — a single primitive that is entirely outer brackets, so the answer is empty.
- `"()()"` — two such primitives, and the smallest input where the block version appends two empty ranges.
- A fully nested string — one primitive, so only two characters are removed and the output is nearly the whole input.
- 100,000 `"()"` pairs — the maximum primitive count, where the output is empty and the block version does the most work for the least result.
- A single primitive at the maximum length — one block copy for the whole answer, the block version's best case.
- Depth exceeding what a counter type can hold — not reachable at the stated 100,000-character limit, where the maximum depth is 50,000.
- Input that is not valid — outside the stated guarantee, and worth noting that the depth counter produces output rather than an error, since nothing checks that the depth stays non-negative.
- Characters other than brackets — none of these versions inspect for them; `c == '('` treats every other character as a closing bracket.
- An output allocated without reserving — the answer is never longer than the input, so one reservation removes all reallocation.

<!-- @pitfalls -->
- Testing the depth on the wrong side of the update. `(` must be tested before incrementing and `)` after decrementing; swapping either keeps an outer bracket and drops an inner one, producing valid-looking output with wrong content.
- Assuming the O(1)-space one-pass version is the fastest. It measured 4.9x slower than block copies on random input, because it appends one character at a time.
- Assuming the block version is the fastest. It measured 2.3x slower on a flat string, because its cost follows the primitive count rather than the output size.
- Omitting the empty-range guard in the block version. A string of 100,000 `"()"` primitives otherwise makes 100,000 zero-length appends — 378.02 microseconds against 222.10.
- Materialising each primitive as its own string before stripping it. That is two allocations per primitive, measured 886.50 microseconds against 385.65 on a flat string.
- Using a stack of characters. Only its size is ever read, so it is a depth counter carrying an unused payload — measured within noise of the counter and using O(n) memory to do it.
- Repeating that `out += c` is quadratic in Python. Measured growth is x1.99 per doubling — linear — and `join` is about 1.3x faster, not asymptotically better.
- Relying on that CPython optimisation without knowing its condition. It applies only when the partial string's reference count is one; a second reference restores the quadratic behaviour.
- Failing to reserve the output. Its final length is bounded by the input's from the first line, so there is no reason to let it reallocate.
- Confusing the C++ and Java append overloads when porting. C++ takes a position and a length; Java takes a start and an exclusive end.

<!-- @doubt -->
### Why is the test before the increment for `(` but after the decrement for `)`?

<!-- @answer -->
Because the two brackets mark opposite ends of a primitive and the depth means something different at each. An opening bracket that begins a primitive is one seen while the depth is still 0 — so you must test **before** incrementing, since after the increment every opening bracket looks alike at depth 1 or more. A closing bracket that ends a primitive is one that brings the depth **back** to 0 — so you must test after decrementing, since before it every closing bracket sits at depth 1 or more. The rule in one sentence: keep the character if the depth is positive on the *inside* of it. Getting either side wrong does not crash; it keeps an outer bracket and drops an inner one, so the output is still a valid parentheses string and simply has the wrong content.

<!-- @doubt -->
### Is the depth counter not the optimal solution?

<!-- @answer -->
It is optimal by the measure complexity notation uses — one pass, O(1) extra space — and it is the slowest correct approach here on most inputs. Measured at n = 200,000: 1,083.19 microseconds on random valid input against 205.53 for copying blocks, and 523.05 against 208.45 on a fully nested one. It wins only when the output is nearly empty, at 96.33 against 222.10 on a string of 100,000 `"()"` primitives. The reason is that it emits the answer one character at a time, so its cost follows the **output size**, while the block version emits one run per primitive with a `memcpy`, so its cost follows the **primitive count**. Neither quantity appears in the complexity analysis, and they point in opposite directions.

<!-- @doubt -->
### Which one should I actually write?

<!-- @answer -->
The depth counter, at the stated constraint. The input is at most 100,000 characters, every approach here finishes in well under a millisecond, and the counter is four lines that state the rule directly with no extra structure. The block version is what to reach for when the strings are large, the primitives are few, and a profile points at this function — which is precisely the situation where the counter is at its worst. If you want one that is never bad, take the block version: across four shapes it measured 205.53, 222.10, 208.45 and 331.42 microseconds, a **1.6x** spread, where the counter spanned 96.33 to 1,083.19, or **11.2x**. Predictability is worth something even when the peak is not.

<!-- @doubt -->
### Two runs of the same function differ by 2.1x on the same input size. Why?

<!-- @answer -->
Branch misprediction, and the measurement isolates it cleanly. The depth counter on random valid input took 1,083.19 microseconds and on a fully nested string 523.05 — but the outputs are 199,562 and 199,998 characters, so it performed essentially the same number of appends, on inputs of identical length. The difference is the shape of the data. `"((( ... )))"` is 100,000 identical decisions followed by 100,000 more, which the branch predictor gets right almost every time; a random valid string flips unpredictably and it misses constantly. The block-copy version shows no such gap, because its inner work is a `memcpy` with no per-character branch to mispredict. It is a real cost, it is invisible in the source, and only measuring on more than one input shape reveals it.

<!-- @doubt -->
### Should I use a stack instead of a counter?

<!-- @answer -->
No. A stack version is correct — verified over the same 626 exhaustive strings with zero mismatches — and it never reads what it stores. Every use is `st.empty()` or `st.size()`, which is exactly the integer the counter already holds. So the stack is a depth counter carrying an unused payload, and it turns O(1) extra space into O(n). Measured, it lands within noise of the counter at 1,050.42 microseconds against 1,083.19 on random input, so it is not even slower in any interesting way — just larger for nothing. The general check is worth keeping: if the only operations on your stack are push, pop and a size or emptiness test, you wanted a counter.

<!-- @doubt -->
### Is `out += c` in a Python loop really quadratic?

<!-- @answer -->
Not any more, and the measurement is unambiguous. CPython optimises in-place concatenation when the target string's reference count is one, resizing rather than copying. Building a 200,000-character output character by character measured 1,487.7, 2,952.6, 5,881.0 and 11,692.6 microseconds at n of 25,000 through 200,000 — growth of **x1.98, x1.99, x1.99**, which is linear. The `list.append` plus `join` version measured 1,086.6 through 8,814.6, growing at the same rate and about **1.3x faster** overall. So keep using `join`, but for the right reason: it is a constant-factor win, not a complexity-class one. The caveat that matters is that the optimisation is conditional — hold a second reference to the partial string, or build it as an attribute on an object, and the quadratic behaviour comes back.

<!-- @doubt -->
### How much of the input survives?

<!-- @answer -->
Exactly `n - 2p` characters, where `p` is the number of primitives — two removed per primitive, verified with zero violations over all 626 valid strings up to length 14. That formula is the useful one because it makes the extremes concrete, and both are ordinary inputs rather than contrived ones. A string of 100,000 `"()"` pairs is 200,000 characters with 100,000 primitives, so the output is **empty**. A single fully nested block of the same length has one primitive, so the output is 199,998 characters — almost all of it. Across all valid strings up to length 14 the mean surviving fraction is 0.6432. It is also the quantity that decides which implementation is faster, since one version's cost tracks `n - 2p` and the other's tracks `p`.

<!-- @doubt -->
### What happens if the input is not a valid parentheses string?

<!-- @answer -->
Nothing good, and nothing loud. The problem guarantees validity, and none of these versions check it. The depth counter will happily let the depth go negative on a string like `"())("`, and since its tests are `depth > 0` it simply produces some output rather than reporting a problem. The block version keys off the balance hitting zero, which on invalid input can happen in the wrong places or never, so it may drop the tail entirely. If you need robustness, the check is one line inside the existing loop — reject as soon as the depth goes negative, and reject at the end if it is not zero — which costs nothing because the depth is already being maintained. Worth adding the moment the guarantee comes from a caller rather than a problem statement.
