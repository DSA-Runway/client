---
id: if-else-statements
topic: Basics
title: If / Else Statements
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-programming
  - data-types
  - variables-and-constants
  - relational-and-logical-operators
relatedIds:
  - relational-and-logical-operators
  - else-if-ladder
  - switch-case
  - while-loop
---

<!-- @summary -->
Making a program take different paths depending on a condition — the first point where code stops running straight through from top to bottom.

<!-- @theory -->
## Straight lines and branches

Every program you've written so far runs top to bottom, executing every line in
order. That's enough to compute things, but not to *decide* anything.

The `if` statement introduces a **branch**: a point where the program looks at a
condition and chooses whether to run a block of code. This is where a program stops
being a calculation and starts being a program.

## The condition is a boolean

An `if` takes exactly one thing: a boolean. That's the entire connection to the
previous subtopic — relational operators produce booleans, logical operators combine
them, and `if` is what finally consumes one.

```
if (score >= 50) {
    // runs only when the condition is true
}
```

If the condition is true, the block runs. If it's false, the block is skipped
entirely and execution continues after it. Nothing else happens — a plain `if` has
no alternative path.

## Adding the other path with else

`else` attaches a second block that runs when the condition is false:

```
if (score >= 50) {
    // pass
} else {
    // fail
}
```

Exactly one of the two blocks runs. Never both, never neither. That guarantee is
what makes `if-else` different from writing two separate `if` statements — two
independent `if`s can both run, or both be skipped, because each tests its own
condition without knowing about the other.

## Blocks, braces, and the bug that follows

A **block** is the group of statements the branch controls. How you mark it is where
the three languages differ, and it matters more than it looks.

**Python uses indentation.** The indented lines are the block. There are no braces,
and the indentation isn't a style choice — it *is* the syntax. Get it wrong and you
get an `IndentationError`, or worse, a line silently ends up in the wrong block.

**C++ and Java use braces** — and make them **optional for a single statement**:

```
if (x > 0)
    cout << "positive";
```

That works. The problem arrives later, when someone adds a second line:

```
if (x > 0)
    cout << "positive";
    cout << "checked";     // ALWAYS runs — not part of the if
```

The indentation says both lines belong to the `if`. The compiler disagrees: only the
first statement is attached, and the second is an ordinary line that runs no matter
what `x` is. The code *looks* correct, which is what makes this dangerous.

**Always write the braces**, even for one line. It costs two characters and removes
an entire category of bug. This is one of the very few places where a style rule is
really a correctness rule.

A related trap: a stray semicolon.

```
if (x > 0);          // <- this semicolon is the entire body
    cout << "hi";    // always runs
```

The semicolon forms an empty statement, so the `if` controls nothing and the block
below runs unconditionally. Python cannot express this at all.

## Nesting

An `if` can contain another `if`. Use it when a second question only makes sense
once the first is answered:

```
if (isLoggedIn) {
    if (isAdmin) {
        // both conditions held
    }
}
```

When the inner `if` has no `else` of its own, this is the same as `isLoggedIn &&
isAdmin`, and the combined form is easier to read. Prefer combining with `&&` unless
the branches genuinely differ.

Deep nesting is a warning sign. Three or more levels usually means the conditions
should be combined, or the logic split into a function.

## The conditional expression

When a branch just picks between two *values*, there's a compact form:

| | Syntax |
|---|---|
| C++ / Java | `condition ? valueIfTrue : valueIfFalse` |
| Python | `valueIfTrue if condition else valueIfFalse` |

```
int max = (a > b) ? a : b;              // C++ / Java
max = a if a > b else b                 # Python
```

**Note the order is different.** C++ and Java put the condition first; Python puts
the true-value first and the condition in the middle. Reading Python's aloud gets
you there: "a, if a is greater than b, else b."

The difference from a statement is real: this is an **expression**, so it produces a
value you can assign or pass along. Use it when both branches produce a value for the
same purpose. Don't use it to run two different actions — that's what `if-else` is
for, and nesting ternaries makes code much harder to read than the statement it
replaced.

## What counts as true

Java is strict: an `if` requires an actual `boolean`, and nothing else compiles.

C++ accepts any value and treats **non-zero as true**. That flexibility is exactly
why `if (x = 5)` compiles — it assigns 5, which is non-zero, so the branch always
runs.

Python accepts any value too, with a defined notion of **falsy**: `0`, `""`,
`[]`, `{}`, and `None` are false, and everything else is true. This is why
`if my_list:` is idiomatic Python for "if the list has anything in it."

## More than two paths

Everything above handles one condition and its opposite. Real problems often need
three or more branches — grade bands, menu choices, ranges. That's the **else-if
ladder**, and it's the next subtopic.

<!-- @intuition -->
An if statement is a fork in the road with a sign on it. The condition reads the sign; the block is the road taken. The only thing that trips people is which lines are actually part of that road — which is a question of blocks, not of conditions.

<!-- @approach -->
### Running Code Conditionally with if

<!-- @idea -->
Guard a block so it executes only when a condition holds.

<!-- @steps -->
1. Write the condition as an expression that evaluates to a boolean.
2. Attach a block containing the statements that should run when it is true.
3. At runtime the condition is evaluated once.
4. If it is true, the block runs and execution continues after it.
5. If it is false, the block is skipped entirely and execution continues after it.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

int main() {
    int score = 72;

    if (score >= 50) {
        cout << "Passed" << endl;
    }

    cout << "Done" << endl;   // runs either way

    // Braces matter — this looks right and is not
    if (score >= 90)
        cout << "Excellent" << endl;
        cout << "Top scorer" << endl;   // ALWAYS runs

    return 0;
}
```

<!-- @annotations -->
- 7: The block runs only when the condition holds. Nothing else changes.
- 16: Indented to look attached, but the if only controls the single statement above it.

<!-- @code java -->
```java
public class IfDemo {
    public static void main(String[] args) {
        int score = 72;

        if (score >= 50) {
            System.out.println("Passed");
        }

        System.out.println("Done");   // runs either way

        // Same brace trap as C++
        if (score >= 90)
            System.out.println("Excellent");
            System.out.println("Top scorer");   // ALWAYS runs
    }
}
```

<!-- @annotations -->
- 5: Java requires the condition to be a genuine boolean — an int here would not compile.
- 14: Identical hazard to C++. Writing the braces prevents it.

<!-- @code python -->
```python
score = 72

if score >= 50:
    print("Passed")

print("Done")   # runs either way

# The brace trap cannot happen — indentation IS the block
if score >= 90:
    print("Excellent")
    print("Top scorer")   # genuinely inside the if

# Truthiness: empty values are false
names = []
if names:
    print("has names")
else:
    print("empty")   # this runs
```

<!-- @annotations -->
- 3: The colon opens the block; the indented lines below are its body.
- 11: Both lines are indented, so both belong to the if. Python has no way to disagree.
- 16: An empty list is falsy, which is why this idiom replaces checking the length.

<!-- @approach -->
### Choosing Between Two Paths with if-else

<!-- @idea -->
Provide an alternative block so exactly one of two paths always runs.

<!-- @steps -->
1. Write the condition and the block to run when it is true.
2. Attach an else with the block to run when it is false.
3. At runtime the condition is evaluated once.
4. Whichever block matches runs, and the other is skipped completely.
5. Execution rejoins after the else block, regardless of which path was taken.

<!-- @code cpp -->
```cpp
int n = 7;

if (n % 2 == 0) {
    cout << "Even" << endl;
} else {
    cout << "Odd" << endl;      // this runs
}

// Nested: only ask the second question if the first passed
int a = 3, b = 9, c = 5;

if (a > b) {
    if (a > c) {
        cout << "a is largest" << endl;
    } else {
        cout << "c is largest" << endl;
    }
} else {
    if (b > c) {
        cout << "b is largest" << endl;   // this runs
    } else {
        cout << "c is largest" << endl;
    }
}
```

<!-- @annotations -->
- 3: Exactly one of the two blocks runs. Two separate ifs would not guarantee that.
- 13: The inner question only makes sense once the outer one is settled.

<!-- @code java -->
```java
int n = 7;

if (n % 2 == 0) {
    System.out.println("Even");
} else {
    System.out.println("Odd");      // this runs
}

int a = 3, b = 9, c = 5;

if (a > b) {
    if (a > c) {
        System.out.println("a is largest");
    } else {
        System.out.println("c is largest");
    }
} else {
    if (b > c) {
        System.out.println("b is largest");   // this runs
    } else {
        System.out.println("c is largest");
    }
}
```

<!-- @annotations -->
- 11: Nesting is fine at two levels. Three or more usually means the conditions should be combined.

<!-- @code python -->
```python
n = 7

if n % 2 == 0:
    print("Even")
else:
    print("Odd")      # this runs

a, b, c = 3, 9, 5

if a > b:
    if a > c:
        print("a is largest")
    else:
        print("c is largest")
else:
    if b > c:
        print("b is largest")   # this runs
    else:
        print("c is largest")

# When the inner if has no else, combine instead of nesting
logged_in, is_admin = True, True
if logged_in and is_admin:
    print("admin access")
```

<!-- @annotations -->
- 11: Each nesting level is one more indentation step, which makes deep nesting visibly costly in Python.
- 23: Clearer than nesting two ifs, and behaves identically.

<!-- @approach -->
### The Conditional Expression

<!-- @idea -->
Pick between two values in a single expression, rather than two blocks.

<!-- @steps -->
1. Confirm both branches produce a value for the same purpose, rather than performing different actions.
2. Write the condition and the two candidate values in the language's order.
3. The condition is evaluated once.
4. Only the matching value is evaluated and produced; the other is not.
5. Assign or use the resulting value like any other expression.

<!-- @code cpp -->
```cpp
int a = 3, b = 9;

int maxVal = (a > b) ? a : b;   // condition first
cout << maxVal << endl;         // 9

// Equivalent statement form
int maxVal2;
if (a > b) {
    maxVal2 = a;
} else {
    maxVal2 = b;
}

// Useful inline
cout << "n is " << ((a % 2 == 0) ? "even" : "odd") << endl;   // n is odd
```

<!-- @annotations -->
- 3: An expression, so it produces a value that can be assigned directly.
- 15: Compact where a full if-else would interrupt the line for no benefit.

<!-- @code java -->
```java
int a = 3, b = 9;

int maxVal = (a > b) ? a : b;   // condition first
System.out.println(maxVal);     // 9

// Equivalent statement form
int maxVal2;
if (a > b) {
    maxVal2 = a;
} else {
    maxVal2 = b;
}

System.out.println("n is " + ((a % 2 == 0) ? "even" : "odd"));   // n is odd
```

<!-- @annotations -->
- 3: Java's syntax matches C++ exactly, including the order.

<!-- @code python -->
```python
a, b = 3, 9

max_val = a if a > b else b   # true-value first, then condition
print(max_val)                # 9

# Equivalent statement form
if a > b:
    max_val2 = a
else:
    max_val2 = b

print("n is", "even" if a % 2 == 0 else "odd")   # n is odd

# Built-in for this specific case
print(max(a, b))   # 9
```

<!-- @annotations -->
- 3: The order is reversed from C++ and Java. Read it aloud: 'a, if a is greater than b, else b.'
- 14: For an actual maximum, the built-in is clearer than any conditional.

<!-- @example -->

<!-- @input -->
n = 7; run if (n % 2 == 0) print Even else print Odd

<!-- @output -->
Odd

<!-- @why -->
The smallest complete if-else, and it reuses the modulo operator from the arithmetic lesson to show conditions are built from what came before.

<!-- @walkthrough -->
1. The condition is evaluated first: n % 2 computes the remainder of 7 divided by 2, which is 1.
2. That result is compared against 0, and 1 does not equal 0, so the condition is false.
3. The if block is skipped entirely — Even is never printed.
4. Control moves to the else block, which prints Odd.
5. Execution rejoins after the else and continues with the next statement.

<!-- @example -->

<!-- @input -->
a = 3, b = 9, c = 5; find the largest using nested if

<!-- @output -->
b is largest

<!-- @why -->
Shows that nesting is not just indentation — an entire subtree of conditions goes unevaluated when its parent branch is not taken.

<!-- @walkthrough -->
1. The outer condition a > b compares 3 against 9, which is false.
2. The outer if block is skipped without evaluating anything inside it.
3. Control enters the else block, where a second question is asked.
4. The inner condition b > c compares 9 against 5, which is true.
5. The inner if block runs and prints that b is largest.
6. Only two comparisons were made in total, because the skipped branch was never entered.

<!-- @example -->

<!-- @input -->
x = -5; if (x > 0) print A; print B;  with no braces in C++

<!-- @output -->
B is printed even though the condition was false

<!-- @why -->
The bug appears when code is edited rather than written, so it survives the review that would have caught it on day one.

<!-- @walkthrough -->
1. The condition x > 0 compares -5 against 0 and evaluates to false.
2. Without braces, the if controls exactly one statement — the print of A.
3. That statement is skipped, so A is not printed.
4. The print of B was never part of the if at all; it is an ordinary next line.
5. It runs unconditionally, producing output that contradicts what the indentation suggested.
6. Wrapping both lines in braces attaches them both to the condition and fixes it.

<!-- @visualization code-flow -->

<!-- @description -->
Draw a flowchart with an execution token that travels it. A diamond holds the condition, with a true edge leading into a rectangular block and a false edge routing around it, and both edges rejoining at a merge point below. Evaluating the condition lights the diamond and the taken edge while the untaken edge dims, then the token follows the lit path and passes through the merge to the statement below. For if-else, draw a block on each edge so the token visibly enters exactly one. The critical part is the BLOCK BOUNDARY overlay: draw the block as a container with a visible outline, and make that outline the braces in C++/Java and an indentation guide-line in Python. Then run the missing-braces case — redraw the container so it wraps only the first statement while the second sits below it on the merge path, outside the outline. Send the token down the false edge, around the container, and straight through the second statement, so the line executes despite the condition failing. Replay with braces added, the container now enclosing both statements, and the token bypassing both. Finish with the conditional expression drawn as a single node with two value slots, where only the matching slot fills in and the other stays greyed.

<!-- @sampleInput -->
```json
{"scenarios":[{"kind":"if","condition":"score >= 50","value":72,"result":true},{"kind":"if-else","condition":"n % 2 == 0","value":7,"result":false,"trueBlock":"print Even","falseBlock":"print Odd"},{"kind":"missing-braces","condition":"x > 0","value":-5,"attached":["print A"],"detached":["print B"],"languages":{"cpp":"braces","java":"braces","python":"indentation"}},{"kind":"ternary","condition":"a > b","a":3,"b":9,"result":9}]}
```

<!-- @highlights -->
- The token arrives at the diamond, which lights up as the condition is evaluated.
- The true edge brightens and the false edge dims, and the token follows the lit path into the block.
- Both edges rejoin at the merge point, and the token continues to the statement below.
- With if-else, a block sits on each edge and the token visibly enters exactly one, never both.
- The block boundary is drawn as a container — braces in C++ and Java, an indentation guide-line in Python.
- In the missing-braces case, the container shrinks to enclose only the first statement.
- The second statement is now outside the outline, sitting on the merge path rather than inside the branch.
- The token takes the false edge, bypasses the container entirely, and still runs that second statement.
- Replayed with braces added, the container encloses both statements and the token bypasses both.
- Python's version cannot show this failure — the indentation guide always encloses exactly what is indented.
- The conditional expression appears as one node with two value slots, and only the matching slot fills in.

<!-- @edgeCases -->
- A condition that is false at the very first check, where a plain if runs nothing at all.
- A stray semicolon immediately after the condition in C++ or Java, which makes the body an empty statement.
- An if with no braces followed by a second indented line, which is not part of the branch despite appearing to be.
- An assignment written inside a C++ condition, which compiles and is true whenever the assigned value is non-zero.
- A condition with side effects, such as calling something that modifies a value, which happens even when the branch is skipped.
- Inconsistent indentation in Python, which either raises IndentationError or silently places a line in the wrong block.
- Mixing tabs and spaces in Python, where two lines look aligned but are not.
- A dangling else in C++ or Java, which binds to the nearest unmatched if rather than the one the indentation suggests.

<!-- @pitfalls -->
- Omitting braces in C++ or Java, then adding a second line later that silently runs unconditionally.
- Writing a semicolon straight after the condition, which gives the if an empty body.
- Using = instead of == in a C++ condition, which assigns and then always evaluates as true.
- Writing two separate ifs where if-else was meant, so both branches can run when the conditions overlap.
- Comparing a boolean against true, as in if (flag == true), when if (flag) says the same thing more clearly.
- Writing if (cond) return true; else return false; instead of simply returning the condition.
- Nesting three or more levels deep when the conditions could be combined with a logical AND.
- Nesting conditional expressions inside each other, which is harder to read than the if-else it replaced.
- Assuming Python's conditional expression uses the same order as C++ — the condition sits in the middle, not first.
- Relying on indentation for meaning in C++ or Java, where the compiler ignores it completely.

<!-- @doubt -->
### Do I need braces if my if statement has only one line?

<!-- @answer -->
The language does not require them in C++ or Java, but you should write them anyway. The risk is not today's single line — it is the second line someone adds next month. Without braces, only the first statement is attached, so the new line runs unconditionally while the indentation says otherwise. Two characters remove an entire class of bug that survives code review because the code looks correct.

<!-- @doubt -->
### Why does the line after my if always run, even when the condition is false?

<!-- @answer -->
Because it was never part of the if. Without braces, an if in C++ or Java controls exactly one statement, and everything after that is ordinary code. Indentation has no meaning to the compiler — it is purely for human readers. Wrap the intended block in braces and the behaviour matches the layout. This cannot happen in Python, where indentation is the actual syntax.

<!-- @doubt -->
### What does if (x) mean when x is a number and not a comparison?

<!-- @answer -->
It depends on the language. C++ treats any non-zero value as true, so if (x) means 'if x is not zero'. Python has a defined set of falsy values — zero, empty string, empty list, empty dict, and None — so if (x) means 'if x has content'. Java refuses it entirely and requires a real boolean. Where the language allows it, being explicit is usually clearer: if (x != 0) states the intent.

<!-- @doubt -->
### When should I use if-else instead of two separate ifs?

<!-- @answer -->
Use if-else whenever the cases are alternatives — exactly one should run. With two separate ifs, each condition is tested independently, so if they overlap, both blocks run; if neither holds, neither runs. That is correct when the checks really are unrelated, and a bug when they were meant to be a choice. if-else also stops evaluating once a branch is taken, so it does less work.

<!-- @doubt -->
### Why is if (x > 0); legal? It does nothing.

<!-- @answer -->
Because a lone semicolon is a valid empty statement, and that empty statement becomes the body of the if. The condition is evaluated, the empty body runs, and the block below executes unconditionally since it was never attached. It compiles cleanly and produces no warning by default, which is precisely what makes it hard to spot. Python cannot express this — a colon must be followed by an indented block.

<!-- @doubt -->
### When should I use a ternary instead of if-else?

<!-- @answer -->
When both branches produce a value for the same purpose, and each is short. int max = (a > b) ? a : b; reads well and keeps the assignment on one line. Use if-else when the branches perform different actions rather than yielding a value, or when either side is long enough that the line stops being readable. Never nest ternaries inside each other — at that point the if-else you replaced was clearer.

<!-- @doubt -->
### Why is Python's conditional expression written backwards?

<!-- @answer -->
It reads as an English sentence rather than as a control structure: a if a > b else b is 'use a, if a is greater than b, otherwise use b'. C++ and Java put the condition first because the ternary grew out of the if statement's shape. Both orders are consistent within their own language, and the practical risk is only when you switch between them — writing Python's order in C++ will not compile, and there is no form where you get it wrong silently.

<!-- @doubt -->
### How deeply should I nest if statements?

<!-- @answer -->
Two levels is usually fine; three or more is a signal to restructure. When an inner if has no else of its own, combine the conditions with a logical AND instead — if (loggedIn && isAdmin) says the same thing as two nested ifs and reads in one pass. When the branches genuinely differ at each level, extracting the inner logic into a function is normally the better fix. Deep nesting is rarely wrong, but it is consistently hard to follow.
