---
id: maximum-nesting-depth-of-the-parentheses
topic: Strings
title: Maximum Nesting Depth of the Parentheses
difficulty: Medium
status: ready
prerequisites:
  - for-loop
  - if-else-statements
  - variables-and-constants
  - largest-element
  - remove-outermost-parentheses
  - time-and-space-complexity-basics
relatedIds:
  - remove-outermost-parentheses
  - largest-element
  - kadanes-algorithm
  - count-number-of-substrings
  - maximum-consecutive-ones
---

<!-- @summary -->
Find the deepest nesting in a valid parentheses expression — where the answer is the running maximum of a `+1/-1` sum, so one integer replaces the stack everyone reaches for, and the stack measured up to **5.4x slower with 5.4x variance** across input shapes; and where the loop body's *shape* outweighs its logic, since replacing two character comparisons with one table lookup measured **3.7x** on identical work.

<!-- @theory -->
## The problem

Given a valid parentheses expression — brackets, digits and operators — return the
maximum nesting depth of the brackets.

```
"(1+(2*3)+((8)/4))+1"   ->  3
"(1)+((2))+(((3)))"     ->  3
"1+(2*3)/(2-1)"         ->  1
"1"                     ->  0
```

The string is guaranteed valid, which means the brackets balance and no prefix
ever closes more than it opened. That guarantee is doing real work, and the last
section says what breaks without it.

## The answer is a running maximum of a running sum

Walk left to right. Add one on `(`, subtract one on `)`, ignore everything else.
The value you are carrying is the current depth, and the answer is the largest
value it ever reaches.

```
( 1 + ( 2 * 3 ) + ( ( 8 ) / 4 ) ) + 1
1 1 1 2 2 2 2 1 1 2 3 3 2 2 2 1 0 0 0
            max ------^
```

That is the whole algorithm: **carry a running best, update it on a condition,
return it at the end** — the skeleton from **Largest Element**, with the running
value being a depth rather than an array element. It is also the same `+1/-1`
counter that **Remove Outermost Parentheses** uses to decide what to keep; here
the maximum of that counter *is* the answer rather than a means to one.

## Counting brackets is not the same as depth

The most common wrong answer is to count opening brackets. Depth is how many are
open **at once**, which is a different quantity entirely:

| Input (200 characters) | Max depth | Count of `(` |
|---|---|---|
| `"((( ... )))"` | 100 | 100 |
| `"()()()..."` | **1** | **100** |
| A realistic expression | **20** | **56** |

They agree only when every bracket is opened before any is closed. On a flat
string of 100 pairs the depth is 1 and the count is 100.

## You do not need a stack

A stack is the reflex, and it is the wrong structure here for the reason it was
wrong in **Remove Outermost Parentheses**: nothing is ever read out of it. Every
operation is a push, a pop, or a size query — and the size is the integer the
counter already holds. Storing 100,000 identical `'('` characters to learn how
many there are is paying O(n) memory for a number.

Measured at n = 200,000, microseconds per run, medians of three runs:

| Shape | Max depth | Counter | Stack |
|---|---|---|---|
| Random balanced | 453 | **250.21** | 643.08 |
| Fully nested | 100,000 | **243.69** | 126.99 |
| Flat `"()()..."` | 1 | **245.17** | 119.02 |
| Realistic expression | 20 | **237.96** | 516.19 |

Read the stack column rather than the ratio. It spans **119.02 to 643.08 — 5.4x**
— depending on how the brackets are arranged, because a `vector` that grows and
shrinks unpredictably behaves very differently from one that grows monotonically
and then drains. The counter spans **237.96 to 250.21**, a 5% band.

So the stack is sometimes faster and never predictable. The counter is always
about the same, and that is worth more than a best case.

## The loop body's shape beats its logic

Here is the part worth the measurement. All three of these compute exactly the
same thing:

```
if (c == '(') { d++; if (d > mx) mx = d; } else if (c == ')') d--;   // branchy
d += (c == '(') - (c == ')');  mx = d > mx ? d : mx;                 // branchless
d += DELTA[c];                 mx = d > mx ? d : mx;                 // table
```

Measured at n = 200,000:

| Shape | Branchy | Branchless | Table lookup |
|---|---|---|---|
| Random balanced | 250.21 | 153.93 | **66.30** |
| Fully nested | 243.69 | 150.50 | **65.89** |
| Flat | 245.17 | 149.32 | **64.14** |
| Realistic expression | 237.96 | 148.31 | **67.76** |

**3.7x from the table version over the branchy one**, consistently, on identical
logic. The branchless arithmetic gets 1.6x by replacing control flow with two
comparisons that produce integers; the table gets the rest by replacing those two
comparisons with a single indexed load. A 256-byte array of `+1`, `-1` and `0`
turns "which character is this" into "what is its delta", and the loop stops
deciding anything at all.

The table is worth knowing and not always worth writing — it needs a 256-byte
constant and it obscures a four-line function. But it is the honest answer to
"can this be faster", and the answer is yes by a factor most people would not
guess is available in a loop this small.

## And here, unlike the last problem, the input shape does not matter

**Remove Outermost Parentheses** measured 2.1x between random and nested input on
a structurally identical loop, from branch misprediction. This loop shows nothing
of the kind: 237.96, 243.69, 245.17 and 250.21 microseconds across four very
different bracket arrangements — a 5% band.

The difference between the two loops is that the other one **writes** — it
conditionally appends a character — while this one only updates registers. The
measurement is what it is either way, and the lesson is that "this loop has a
branch, so it must mispredict expensively" is a hypothesis to check rather than a
conclusion to assume. Two loops of the same shape gave 2.1x and 1.05x.

## Python: there is nothing to move into C

Every other problem in this topic has had a large Python win available from
pushing work into the standard library. This one does not:

| Shape | Plain loop | Branchless loop | `accumulate` + `max` | `accumulate` over bytes | Stack |
|---|---|---|---|---|---|
| Random balanced | **7,079.6** | 8,882.8 | 9,592.7 | 9,866.5 | 7,782.6 |
| Fully nested | **7,129.2** | 8,981.3 | 9,878.4 | 9,612.2 | 9,511.5 |
| Flat | **7,119.5** | 8,559.3 | 8,427.7 | 8,453.9 | 8,474.7 |
| Realistic expression | **7,731.8** | 9,347.8 | 9,040.9 | 10,317.8 | 8,379.9 |

Everything is within 1.4x, and the plain explicit loop is the **fastest**. The
functional one-liner —

```python
max(accumulate((c == "(") - (c == ")") for c in s), default=0)
```

— is 1.2x to 1.4x *slower*, because `accumulate` runs in C but the generator
expression feeding it does not. Moving the loop into C only helps when the
per-element work goes with it, and here the per-element work is a pair of
comparisons that must happen in Python either way.

Write the explicit loop. It is the fastest, the clearest, and the one that
survives being read.

## What the validity guarantee buys

The problem promises a valid expression, and that is what lets the counter be the
whole algorithm. Without it two things change:

- The depth can go **negative**, on a string like `"())("`. The counter happily
  continues and reports a maximum that ignores the imbalance entirely.
- The depth can end **non-zero**, on `"(()"`, which likewise goes unnoticed.

Neither is a crash and neither is detectable from the answer. If the guarantee
comes from a caller rather than a problem statement, both checks are one line
each inside the loop you already have — reject as soon as the depth goes below
zero, and reject at the end if it is not zero. They cost nothing, because the
depth is already being maintained.

<!-- @intuition -->
The word "depth" invites a structure, and structures are what people reach for — a stack, because brackets and stacks belong together in everyone's training. But the question is not what is open, it is how many things are open at once, and "how many" is a number rather than a collection. Once you notice that the only thing you ever ask the stack is its size, the stack collapses into the integer it was tracking, and the problem becomes carrying a running best over a running sum, which is the same skeleton as finding the largest element in an array. The second half of this one is a measurement lesson rather than an algorithmic one. The loop is four lines with no interesting choices left in it, and it can still be made three and a half times faster by changing what the body does rather than what it decides — swapping two character comparisons for one array lookup. That is worth knowing not because this function is ever the bottleneck, but because it calibrates how much room can hide inside code that already looks minimal.

<!-- @approach -->
### A Stack of Brackets

<!-- @idea -->
Push on every opening bracket, pop on every closing one, and record the largest the stack ever gets.

<!-- @steps -->
1. Start with an empty stack and a maximum of zero.
2. Walk the string one character at a time.
3. On an opening bracket, push it and update the maximum with the stack's new size.
4. On a closing bracket, pop.
5. Ignore every other character.
6. Return the maximum size ever seen.

<!-- @complexity -->
- time: O(n) — one pass, with a push or pop per bracket
- space: O(n) — the stack grows to the maximum depth, which can be n/2
- note: The reflex answer, and the wrong structure. Nothing is ever read out of the stack: every operation is a push, a pop, or a size query, and the size is exactly the integer a counter would hold. Measured at n = 200,000 it spans **119.02 to 643.08 microseconds** across four bracket arrangements — a 5.4x variance — against a 5% band for the counter, because a container that grows and shrinks unpredictably behaves very differently from one that fills and then drains.

<!-- @code cpp -->
```cpp
#include <algorithm>
#include <string>
#include <vector>
using namespace std;

int maxDepth(const string& s) {
    vector<char> stack;
    size_t best = 0;
    for (char c : s) {
        if (c == '(') {
            stack.push_back(c);
            best = max(best, stack.size());
        } else if (c == ')') {
            stack.pop_back();
        }
    }
    return (int)best;
}
```

<!-- @annotations -->
- 11: Every element pushed here is the same character, and none is ever inspected. The only thing read is `stack.size()` on the next line.
- 14: `pop_back` on an empty vector is undefined behaviour. The validity guarantee is what makes this safe, and it is the guarantee a counter version can check for free.

<!-- @code java -->
```java
static int maxDepth(String s) {
    Deque<Character> stack = new ArrayDeque<>();
    int best = 0;
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (c == '(') {
            stack.push(c);
            best = Math.max(best, stack.size());
        } else if (c == ')') {
            stack.pop();
        }
    }
    return best;
}
```

<!-- @annotations -->
- 2: `Deque<Character>` boxes every character into an object. That is up to 100,000 allocations to count to 100,000.

<!-- @code python -->
```python
def max_depth(s):
    stack = []
    best = 0
    for c in s:
        if c == "(":
            stack.append(c)
            if len(stack) > best:
                best = len(stack)
        elif c == ")":
            stack.pop()
    return best


# Measured 7,782.6us on random input against 7,079.6 for the counter --
# in Python the gap is small, because the interpreted loop dominates
# either way. The memory is still O(n) for a number.
```

<!-- @annotations -->
- 7: `len(stack)` is O(1) in CPython, so this is not slow for the reason people expect — it is simply storing 100,000 references to learn a count.

<!-- @approach -->
### Optimal - One Counter, One Pass

<!-- @idea -->
Track the depth as a single integer and keep the largest value it reaches.

<!-- @steps -->
1. Start the depth and the maximum at zero.
2. Walk the string one character at a time.
3. Increase the depth on an opening bracket, then update the maximum if the depth is now larger.
4. Decrease the depth on a closing bracket.
5. Ignore every other character.
6. Return the maximum.

<!-- @complexity -->
- time: O(n) — one pass, one comparison per character
- space: O(1) — two integers, whatever the input
- note: The one to write. Measured 237.96 to 250.21 microseconds at n = 200,000 across four very different bracket arrangements — a 5% band, where the stack version spans 5.4x. The maximum only needs updating after an increment, since a decrement can never produce a new high; checking it every iteration is harmless and slightly slower.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

int maxDepth(const string& s) {
    int depth = 0, best = 0;
    for (char c : s) {
        if (c == '(') {
            depth++;
            if (depth > best) best = depth;
        } else if (c == ')') {
            depth--;
        }
    }
    return best;
}
```

<!-- @annotations -->
- 9: The update belongs here, right after the increment — a closing bracket can never create a new maximum, so testing after a decrement is wasted work.
- 10: `else if`, not `else`. Digits and operators must fall through both branches untouched; a plain `else` would treat every non-bracket character as a closing bracket.
- 5: Two integers is the entire state. This is the stack version with the container deleted and its size kept.

<!-- @code java -->
```java
static int maxDepth(String s) {
    int depth = 0, best = 0;
    for (int i = 0; i < s.length(); i++) {
        char c = s.charAt(i);
        if (c == '(') {
            depth++;
            if (depth > best) best = depth;
        } else if (c == ')') {
            depth--;
        }
    }
    return best;
}
```

<!-- @annotations -->
- 2: No boxing, no allocation, and no `Deque` — the same algorithm as the stack version with the object graph removed.

<!-- @code python -->
```python
def max_depth(s):
    depth = best = 0
    for c in s:
        if c == "(":
            depth += 1
            if depth > best:
                best = depth
        elif c == ")":
            depth -= 1
    return best


# The fastest Python version measured, at 7,079.6us on random input --
# ahead of the branchless variant (8,882.8) and of
# max(accumulate(...)) (9,592.7). There is nothing here to move into C.
```

<!-- @annotations -->
- 3: The explicit loop wins in Python here, which is unusual for this topic. The per-element work is a comparison that has to happen in Python whatever wrapper is around it.

<!-- @approach -->
### The Same Counter, Without Branches

<!-- @idea -->
Replace the character tests with arithmetic, then replace the arithmetic with a table lookup, so the loop body decides nothing.

<!-- @steps -->
1. Build a 256-entry table holding one for an opening bracket, minus one for a closing bracket, and zero everywhere else.
2. Start the depth and the maximum at zero.
3. For each byte, add its table entry to the depth.
4. Take the maximum of the depth and the running best with a conditional move rather than a branch.
5. Return the maximum.

<!-- @complexity -->
- time: O(n) — one pass, one load and one add per character
- space: O(1) — two integers plus a fixed 256-byte table
- note: The measured floor for this problem. At n = 200,000 the table version ran 64.14 to 67.76 microseconds against 237.96 to 250.21 for the branchy version — **3.7x on identical logic** — with the branchless-arithmetic form landing in between at about 150. The gain is not from avoiding mispredictions, which do not appear here: the branchy version is flat across input shapes. It is from replacing two comparisons and a jump with a single indexed load.

<!-- @code cpp -->
```cpp
#include <array>
#include <string>
using namespace std;

// Every entry zero except these two. Built at compile time, portably --
// `signed char DELTA[256] = {['(']=1, [')']=-1}` is a C99 array
// designated initialiser, which is not standard C++ and MSVC rejects.
static constexpr array<signed char, 256> makeDelta() {
    array<signed char, 256> t{};
    t['('] = 1;
    t[')'] = -1;
    return t;
}

int maxDepth(const string& s) {
    static constexpr auto DELTA = makeDelta();
    int depth = 0, best = 0;
    for (unsigned char c : s) {
        depth += DELTA[c];
        best = depth > best ? depth : best;
    }
    return best;
}
```

<!-- @annotations -->
- 8: A `constexpr` function rather than a designated initialiser. The table is still built at compile time, and this form compiles everywhere — clang and gcc accept the C-style version as an extension, so it passes locally and fails on MSVC.
- 18: `unsigned char`, not `char`. A signed `char` makes every byte above 127 a negative index, which reads outside the table.
- 19: One load and one add. No comparison against `'('` or `')'` happens anywhere in the loop.
- 20: A ternary rather than an `if`, so the compiler emits a conditional move and the loop contains no branch at all.

<!-- @code java -->
```java
static final int[] DELTA = new int[256];
static {
    DELTA['('] = 1;
    DELTA[')'] = -1;
}

static int maxDepth(String s) {
    int depth = 0, best = 0;
    for (int i = 0; i < s.length(); i++) {
        depth += DELTA[s.charAt(i)];
        best = Math.max(best, depth);
    }
    return best;
}
```

<!-- @annotations -->
- 10: A 256-entry table indexed by a UTF-16 code unit is only safe while the input stays in Latin-1. Any character above 255 indexes out of bounds — which the problem's guarantee of brackets, digits and operators does provide.

<!-- @code python -->
```python
from itertools import accumulate


def max_depth(s):
    return max(accumulate((c == "(") - (c == ")") for c in s), default=0)


# The functional form, and 1.2x to 1.4x SLOWER than the explicit loop:
# 9,592.7us against 7,079.6 on random input. accumulate runs in C, but
# the generator feeding it does not, so nothing actually moved.
#
# `default=0` is required -- max() of an empty sequence raises.
```

<!-- @annotations -->
- 5: `(c == "(") - (c == ")")` relies on `True` and `False` being 1 and 0, which is guaranteed in Python since `bool` subclasses `int`. It is included as the idiom people reach for, not as a recommendation — in this problem the explicit loop is both faster and clearer.

<!-- @example -->

<!-- @input -->
s = "(1+(2*3)+((8)/4))+1"

<!-- @output -->
3

<!-- @why -->
The standard case, with non-bracket characters interleaved so the "ignore everything else" rule is exercised rather than assumed.

<!-- @walkthrough -->
1. The opening bracket at the start takes the depth to 1, which becomes the maximum.
2. `1` and `+` are neither bracket, so the depth is unchanged.
3. The bracket before `2` takes the depth to 2, a new maximum.
4. The bracket after `3` closes it, returning the depth to 1.
5. The two consecutive brackets before `8` take the depth to 2 and then 3 — the maximum for the whole string.
6. Everything after that only closes brackets, so the depth falls back through 2, 1 and 0.
7. The final `+1` leaves the depth at 0, and the answer is the maximum ever reached, which is 3.

<!-- @example -->

<!-- @input -->
"()()()..." with 100 pairs, against "((( ... )))" with 100 of each

<!-- @output -->
Depth 1 and depth 100 — both containing exactly 100 opening brackets

<!-- @why -->
Separates depth from bracket count, which is the most common wrong answer to this problem.

<!-- @walkthrough -->
1. Both strings are 200 characters and both contain 100 opening brackets.
2. In the flat string every bracket closes before the next opens, so the depth reaches 1 and returns to 0, a hundred times.
3. The maximum depth is therefore 1.
4. In the nested string all 100 open before any closes, so the depth climbs to 100.
5. Counting opening brackets gives 100 for both, and is right only for the second.
6. On a realistic expression the gap is wider in the other direction: 56 opening brackets and a maximum depth of 20.
7. Depth is how many are open at once, which a total count cannot express.

<!-- @example -->

<!-- @input -->
A 200,000-character expression, counted three ways

<!-- @output -->
250.21us branchy, 153.93us branchless, 66.30us with a table lookup

<!-- @why -->
Shows how much room can hide inside a four-line loop that already looks minimal.

<!-- @walkthrough -->
1. All three functions compute the same value on the same input and were cross-checked over 20,000 random strings with zero mismatches.
2. The branchy version tests the character against `'('` and then against `')'`, with a jump on each.
3. The branchless version computes `(c == '(') - (c == ')')` and adds it, replacing control flow with two comparisons that produce integers — 1.6x faster.
4. The table version replaces those two comparisons with one indexed load from a 256-byte array — 3.7x faster than branchy overall.
5. The maximum update becomes a conditional move rather than a branch, so the loop body contains no jumps at all.
6. The gain is consistent across all four input shapes, at 64.14 to 67.76 microseconds.
7. None of this changes the algorithm; it changes only what the loop body does per character.

<!-- @example -->

<!-- @input -->
The same four input shapes through the branchy counter

<!-- @output -->
237.96, 243.69, 245.17 and 250.21 microseconds — a 5% band

<!-- @why -->
Checks an assumption carried over from the previous problem, and finds it does not hold here.

<!-- @walkthrough -->
1. **Remove Outermost Parentheses** measured 2.1x between random and nested input on a loop of the same shape, from branch misprediction.
2. That made it reasonable to expect the same effect here, since this loop also branches on every character.
3. Measured across random, nested, flat and realistic-expression inputs, the timings were 250.21, 243.69, 245.17 and 237.96.
4. That is a 5% band — no shape dependence worth naming.
5. The structural difference is that this loop only updates registers, while the other conditionally **appends** to a string.
6. So the branch is there in both, and only one of them pays for it.
7. The transferable point is that "this loop branches, so mispredictions must dominate" is a hypothesis, and two loops of the same shape measured 2.1x and 1.05x.

<!-- @visualization custom -->

<!-- @description -->
Draw the expression as a row of cells with a depth line plotted beneath it, stepping up on every `(`, down on every `)`, and running flat across digits and operators so the irrelevance of non-bracket characters is visible rather than stated. Trail a horizontal high-water mark behind the line that only ever rises, and let it lock in place at the peak — the answer is where that mark ends up, not where the line ends. Beside it run the stack version on the same input, showing cells being pushed and popped, and put a readout on the stack showing that the only value ever read from it is its height. Then physically collapse the stack into that single number, leaving the counter. The centre of the figure is the depth-versus-count contrast: two strips of equal length, one flat `"()()()..."` and one fully nested, each with a tally of opening brackets reading 100 and a depth line beneath. The flat strip's line oscillates between 0 and 1 a hundred times; the nested strip's climbs to 100 and comes back. Same tally, wildly different peaks — that is the wrong answer people give, drawn rather than described. Close on the loop body, in three panels side by side on identical input. Panel one shows two comparison probes and a branch per character, timed at 250.21us. Panel two replaces the branch with arithmetic, at 153.93us. Panel three replaces both comparisons with a single arrow into a 256-cell table holding mostly zeros with `+1` and `-1` at two positions, at 66.30us. Draw the three timings as bars to scale so the 3.7x is a picture, and label the panel group identical logic, different loop body.

<!-- @sampleInput -->
```json
{"primary":{"s":"(1+(2*3)+((8)/4))+1","answer":3,"depthTrace":[1,1,1,2,2,2,2,1,1,2,3,3,2,2,2,1,0,0,0],"peakAt":"the two consecutive brackets before 8"},"smallCases":[{"s":"(1+(2*3)+((8)/4))+1","answer":3},{"s":"(1)+((2))+(((3)))","answer":3},{"s":"1+(2*3)/(2-1)","answer":1},{"s":"1","answer":0},{"s":"","answer":0},{"s":"()","answer":1}],"coreIdea":{"claim":"the answer is the running maximum of a running +1/-1 sum","skeleton":"carry a running best, update it on a condition, return it at the end","sameAs":"Largest Element, with the running value being a depth rather than an array element","relationToRemoveOutermost":"the same +1/-1 counter; there the counter decides what to keep, here its maximum IS the answer"},"depthIsNotCount":{"claim":"counting opening brackets is a different quantity from depth","agreeWhen":"every bracket opens before any closes","measuredAt200Chars":[{"shape":"fully nested","maxDepth":100,"countOfOpen":100,"agree":true},{"shape":"flat ()()...","maxDepth":1,"countOfOpen":100,"agree":false},{"shape":"realistic expression","maxDepth":20,"countOfOpen":56,"agree":false}]},"stackIsTheWrongStructure":{"why":"nothing is ever read out of it — every operation is a push, a pop, or a size query, and the size is the integer the counter already holds","cost":"O(n) memory to hold a number","cppNote":"pop_back on an empty vector is undefined behaviour; the validity guarantee is what makes it safe","javaNote":"Deque<Character> boxes every character, so up to 100,000 allocations to count to 100,000"},"benchCpp":{"unit":"microseconds per run, Apple M2, clang -O2, n = 200,000, medians of three runs","rows":[{"shape":"random balanced","maxDepth":453,"branchy":250.21,"branchless":153.93,"tableLookup":66.30,"stack":643.08},{"shape":"fully nested","maxDepth":100000,"branchy":243.69,"branchless":150.50,"tableLookup":65.89,"stack":126.99},{"shape":"flat ()()...","maxDepth":1,"branchy":245.17,"branchless":149.32,"tableLookup":64.14,"stack":119.02},{"shape":"realistic expression","maxDepth":20,"branchy":237.96,"branchless":148.31,"tableLookup":67.76,"stack":516.19}],"tableVsBranchy":"3.7x on identical logic","branchlessVsBranchy":"1.6x","stackVariance":"119.02 to 643.08 — 5.4x across bracket arrangements","counterVariance":"237.96 to 250.21 — a 5% band","reading":"the stack is sometimes faster and never predictable; the counter is always about the same"},"loopBodyShape":{"branchy":"if (c=='(') { d++; if (d>mx) mx=d; } else if (c==')') d--;","branchless":"d += (c=='(') - (c==')'); mx = d>mx?d:mx;","table":"d += DELTA[c]; mx = d>mx?d:mx;","gain":"replacing two comparisons and a jump with one indexed load","caveat":"needs a 256-byte constant and obscures a four-line function — worth knowing, not always worth writing"},"noBranchEffectHere":{"observation":"the branchy counter measured 237.96 to 250.21 across four very different bracket arrangements — a 5% band","contrastWith":"Remove Outermost Parentheses measured 2.1x between random and nested input on a structurally identical loop","structuralDifference":"that loop conditionally appends a character; this one only updates registers","lesson":"'this loop branches, so mispredictions must dominate' is a hypothesis to check — two loops of the same shape measured 2.1x and 1.05x"},"benchPython":{"unit":"microseconds per run, CPython 3.13.4, n = 200,000","rows":[{"shape":"random balanced","maxDepth":890,"plainLoop":7079.6,"branchlessLoop":8882.8,"accumulate":9592.7,"accumulateBytes":9866.5,"stack":7782.6},{"shape":"fully nested","maxDepth":100000,"plainLoop":7129.2,"branchlessLoop":8981.3,"accumulate":9878.4,"accumulateBytes":9612.2,"stack":9511.5},{"shape":"flat","maxDepth":1,"plainLoop":7119.5,"branchlessLoop":8559.3,"accumulate":8427.7,"accumulateBytes":8453.9,"stack":8474.7},{"shape":"realistic expression","maxDepth":20,"plainLoop":7731.8,"branchlessLoop":9347.8,"accumulate":9040.9,"accumulateBytes":10317.8,"stack":8379.9}],"verdict":"everything within 1.4x and the plain explicit loop is the fastest","whyNoWin":"accumulate runs in C but the generator expression feeding it does not, so nothing actually moved — moving a loop into C only helps when the per-element work goes with it","contrastWithTopic":"every other problem in this topic had a large Python win available from pushing work into the standard library; this one does not"},"validityGuarantee":{"whatItBuys":"the counter alone is sufficient","withoutIt":[{"case":"\"())(\"","problem":"the depth goes negative and the counter reports a maximum that ignores the imbalance"},{"case":"\"(()\"","problem":"the depth ends non-zero and nothing notices"}],"detectability":"neither is a crash and neither is visible in the answer","fix":"reject as soon as the depth goes below zero, and reject at the end if it is not zero — both free, since the depth is already maintained"},"assertions":["the answer is at least 0 and at most n/2","the depth returns to 0 at the end of a valid string","the depth is never negative in a valid string","the answer equals the maximum prefix sum of the +1/-1 sequence","the answer is unaffected by every non-bracket character"],"recommendation":"write the counter — two integers, one pass, and a 5% cost band across input shapes; reach for the table only if this loop is measurably hot","lesson":"when the only thing you ask a structure is its size, you wanted a number — and a loop that already looks minimal can still hide 3.7x in its body"}
```

<!-- @highlights -->
- The expression is drawn as a row of cells with a depth line beneath it, stepping up on `(`, down on `)`, and flat across digits and operators.
- A horizontal high-water mark trails the line, only ever rising, and locks at the peak — the answer is where the mark ends, not where the line ends.
- The stack version runs beside it on the same input, cells pushing and popping.
- A readout on the stack shows that the only value ever read from it is its height.
- The stack then physically collapses into that single number, leaving the counter.
- The centre contrasts depth with count: two strips of equal length, one flat and one fully nested, each tallying 100 opening brackets.
- The flat strip's depth line oscillates between 0 and 1 a hundred times; the nested strip's climbs to 100 and returns.
- Same tally, wildly different peaks — the common wrong answer, drawn rather than described.
- The close is three panels of the loop body, side by side on identical input.
- Panel one shows two comparison probes and a branch per character, timed at 250.21us.
- Panel two replaces the branch with arithmetic, at 153.93us.
- Panel three replaces both comparisons with a single arrow into a 256-cell table, mostly zeros with `+1` and `-1` at two positions, at 66.30us.
- The three timings are drawn as bars to scale so the 3.7x is a picture.
- The panel group is labelled identical logic, different loop body.

<!-- @edgeCases -->
- The empty string — the answer is 0, and every version returns it by falling through the loop.
- A string with no brackets at all, like `"1"` — the answer is 0, and the reason the non-bracket branch must fall through rather than decrement.
- `"()"` — the smallest input with a non-zero answer, and the case that catches an update placed after the decrement.
- A flat string of many pairs — depth 1 with many brackets, which separates depth from count.
- A fully nested string — depth n/2, the maximum possible, and the stack version's largest allocation.
- Digits and operators interleaved with brackets — must be ignored, which requires `else if` rather than `else`.
- A string that is one long run of digits — the loop runs to completion and the answer stays 0.
- Input containing bytes above 127 with a signed `char` index into the table — negative subscript and an out-of-bounds read.
- Java input outside Latin-1 with a 256-entry table — a UTF-16 unit above 255 indexes past the end.
- Invalid input where the depth goes negative, like `"())("` — outside the guarantee, and reported as a plausible answer rather than an error.
- Invalid input where the depth ends non-zero, like `"(()"` — likewise silent.

<!-- @pitfalls -->
- Counting opening brackets instead of tracking depth. They agree only when every bracket opens before any closes — a flat string of 100 pairs has depth 1 and 100 opening brackets.
- Reaching for a stack. Nothing is ever read out of it, so it is a counter carrying O(n) of unused payload, and it measured 119.02 to 643.08 microseconds across shapes against a 5% band for the counter.
- Writing `else` instead of `else if`. Every digit and operator would then be treated as a closing bracket and the depth would go wildly negative.
- Updating the maximum after a decrement. A closing bracket can never produce a new high, so the check belongs immediately after the increment.
- Indexing a delta table with a signed `char`. Any byte above 127 becomes a negative subscript, which reads outside the array.
- Assuming the branch must be the bottleneck. This loop measured a 5% band across four bracket arrangements, where a structurally identical loop in Remove Outermost Parentheses measured 2.1x.
- Reaching for `max(accumulate(...))` in Python for speed. It measured 1.2x to 1.4x slower than the explicit loop, because the generator feeding `accumulate` still runs in the interpreter.
- Omitting `default=0` from that `max` call. It raises on the empty string rather than returning zero.
- Boxing characters into a `Deque<Character>` in Java. That is one allocation per opening bracket to maintain a count.
- Relying on the validity guarantee when it comes from a caller. A negative or non-zero final depth produces a plausible answer rather than an error, and both checks are one line inside the loop you already have.

<!-- @doubt -->
### Why not use a stack? Brackets and stacks go together.

<!-- @answer -->
Because you never read anything out of it. Look at what the stack version actually does: push on `(`, pop on `)`, and query `size()`. It never inspects an element, never compares one, never needs to know which bracket is on top — because there is only one kind of bracket. So the stack is a counter carrying O(n) of unused payload. Measured at n = 200,000 it also behaves unpredictably: 119.02 microseconds on a flat string, 126.99 on a nested one, and **643.08 on random input**, a 5.4x spread, because a container that grows and shrinks unpredictably is not the same workload as one that fills and drains. The counter measured 237.96 to 250.21 across the same four shapes — a 5% band. The general check is worth keeping: if the only operations on your stack are push, pop and size, you wanted an integer.

<!-- @doubt -->
### Is the answer not just the number of opening brackets?

<!-- @answer -->
Only when every bracket opens before any closes, which is one specific shape. Depth is how many brackets are open **at the same time**, and a count cannot express simultaneity. Two 200-character inputs, both with exactly 100 opening brackets: `"((( ... )))"` has depth 100, and `"()()()..."` has depth **1**, because each bracket closes before the next opens. On a realistic expression the gap runs the other way too — 56 opening brackets and a maximum depth of 20. The count and the depth coincide on the fully nested case, which is unfortunately the example people picture when they check the idea in their head.

<!-- @doubt -->
### Can a four-line loop really be made 3.7x faster?

<!-- @answer -->
Yes, and by changing what the body does rather than what it computes. Three versions, cross-checked over 20,000 random strings with zero mismatches: the branchy one tests against `'('` and then `')'` with a jump each, measured 250.21 microseconds at n = 200,000. Replacing the control flow with arithmetic — `d += (c=='(') - (c==')')` — measured 153.93, or 1.6x. Replacing those two comparisons with a single load from a 256-byte table of `+1`, `-1` and `0` measured **66.30**, or 3.7x against the original. The maximum update becomes a conditional move, so the loop contains no branch at all. Whether to write it is a different question — it needs a table constant and obscures a very readable function — but the room is there, and most people would not guess it in a loop this small.

<!-- @doubt -->
### The last problem showed 2.1x from branch misprediction. Why not here?

<!-- @answer -->
Measured, it simply does not appear. The branchy counter ran 250.21, 243.69, 245.17 and 237.96 microseconds on random, nested, flat and realistic-expression inputs — a 5% band, where **Remove Outermost Parentheses** measured 2.1x between random and nested on a loop of the same shape. The structural difference is that the other loop conditionally **appends a character to a string**, while this one only updates two registers, so a mispredicted branch there costs a stalled store and here costs almost nothing. That is a plausible reading rather than a proof, and the durable point is the method: two loops that look alike gave 2.1x and 1.05x, so "there is a branch, therefore misprediction dominates" is a hypothesis to test on more than one input shape, not a conclusion to carry between problems.

<!-- @doubt -->
### Should I use `max(accumulate(...))` in Python?

<!-- @answer -->
No, and this is the one problem in the topic where the functional idiom loses. Measured at n = 200,000 on random input: the explicit loop 7,079.6 microseconds, `max(accumulate((c == "(") - (c == ")") for c in s), default=0)` **9,592.7** — about 1.4x slower. The reason is that `accumulate` runs in C but the generator expression feeding it does not, so the per-element work stayed in the interpreter and only the loop scaffolding moved. Everywhere else in this topic — `split`, `Counter`, `in`, slicing — the C function does the per-element work too, which is why those wins are real and this one is not. Write the explicit loop: it is the fastest measured, and it is clearer. And if you do use the one-liner, `default=0` is required or it raises on the empty string.

<!-- @doubt -->
### Where exactly should the maximum be updated?

<!-- @answer -->
Immediately after the increment, inside the opening-bracket branch. A closing bracket lowers the depth, so it can never produce a new maximum, and testing after a decrement is work that can never change the answer. Putting the update at the top of the loop body instead — before either branch runs — is a subtler mistake: it records the depth *before* the current character is processed, so on `"()"` it would see 0 and 0 and return 0 rather than 1. The branchless and table versions update unconditionally after the delta is applied, which is correct because the delta has already been added; there the extra comparison is cheaper than a branch would be, which is the whole point of that formulation.

<!-- @doubt -->
### What if the input is not guaranteed valid?

<!-- @answer -->
Then the counter reports a plausible number and tells you nothing is wrong. Two things go undetected. On `"())("` the depth goes **negative** partway through, and since the maximum only ever rises, the returned answer reflects only the well-formed part. On `"(()"` the depth ends **non-zero**, and nothing checks it. Neither crashes; both produce an answer that looks fine. The fix is two lines inside the loop you already have — return an error as soon as the depth goes below zero, and check that it is zero after the loop — and they cost nothing because the depth is already being maintained. Worth adding the moment the guarantee comes from a caller rather than from a problem statement. Note that the stack version does not get this for free: `pop_back` on an empty `vector` is undefined behaviour, so invalid input there is worse than a wrong answer.
