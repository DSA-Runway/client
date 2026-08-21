---
id: do-while-loop
topic: Basics
title: Do-While Loop
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-programming
  - variables-and-constants
  - relational-and-logical-operators
  - if-else-statements
  - for-loop
  - while-loop
relatedIds:
  - while-loop
  - for-loop
  - break-and-continue
---

<!-- @summary -->
A loop that checks its condition after the body instead of before, guaranteeing at least one run — for the case where the first iteration is what produces the value the condition needs to test.

<!-- @theory -->
## The one gap while leaves

A `while` loop checks its condition first, so a false condition means the body runs
**zero times**. That is usually exactly right.

Sometimes it is exactly wrong:

- Show a menu, then read the user's choice. The menu must appear before there is a
  choice to validate.
- Prompt for a number, re-prompt while it's out of range. You cannot judge the input
  before asking for it.
- Roll a die until you get a six. The first roll has to happen.

In each case, **the value the condition tests does not exist until the body has
run once.** Checking first is impossible — there is nothing to check yet.

## Moving the condition to the end

```
do {
    body
} while (condition);
```

Body first, condition second. If the condition is true, go round again. If false,
stop.

```
body -> check -> body -> check -> ... -> check fails -> exit
```

Compare to `while`, which is `check -> body -> check -> body -> ...`.

The standard names for this: `while` is **entry-controlled** (the gate is at the
entrance) and `do-while` is **exit-controlled** (the gate is at the exit). You always
get through an exit-controlled loop at least once, because the gate is behind you.

**A do-while body always runs at least once — even when the condition is false from
the very start.**

```
int i = 10;
do {
    print(i);      // prints 10
} while (i < 5);   // false, so it stops — but the body already ran
```

## The semicolon

`do { ... } while (condition);` ends with a **semicolon**. It is mandatory, and
forgetting it is a compile error rather than a silent bug — which is the one mercy
here, since every other loop in the language ends without one.

The reason: the whole `do-while` is a single statement, and statements terminate with
a semicolon. A `while` loop ends with the closing brace of its body, so nothing
follows.

## Why not just repeat the code?

The obvious alternative is to run the body once by hand, then use a `while`:

```
read(value);                 // do it once
while (value is invalid) {
    read(value);             // ...and again, duplicated
}
```

That works, and it duplicates the read. Two copies of the same logic means two places
to fix a bug, and one of them will eventually be missed. The `do-while` version
writes it once:

```
do {
    read(value);
} while (value is invalid);
```

**Removing that duplication is the entire argument for the construct.** If your body
is one line it barely matters; if it's fifteen, it matters a lot.

## Scope trap

A variable declared **inside** the `do` block does not exist in the `while` condition
— the block has already closed by then:

```
do {
    int x;
    cin >> x;
} while (x != 0);    // ERROR: x is not in scope here
```

Declare it **before** the loop. This catches nearly everyone once, and it is a
compile error rather than a runtime surprise.

## Python has no do-while

Like `switch`, this construct is simply absent. It was formally proposed in PEP 315
and rejected — the view being that the existing tools already express it clearly
enough.

The standard idiom moves the exit into the middle of the body:

```
while True:
    body
    if not condition:
        break
```

The body runs before the test, which is precisely do-while behaviour. Note the
condition is **negated**: a do-while continues *while* the condition holds, and a
`break` fires when it *stops* holding.

A flag variable also works — `done = False` then `while not done:` — but it needs an
extra variable and an extra assignment to say the same thing. Prefer `while True`
with `break`.

There's an upside to Python's version: the exit doesn't have to sit at the *end* of
the body. It can go wherever the decision actually becomes available, which is more
flexible than either `while` or `do-while`.

## The three loops together

| | Condition checked | Minimum runs | Use when |
|---|---|---|---|
| `for` | before | 0 | The count is known upfront |
| `while` | before | 0 | The count is unknown, condition-driven |
| `do-while` | after | **1** | The first iteration produces what you test |

## An honest note on how often you'll use it

`do-while` is the least-used of the three by a wide margin, and it is nearly absent
from DSA specifically. Algorithm problems read their input as given rather than
validating it interactively, and that validate-after-acting shape is where do-while
earns its place.

You should be able to **read** it — it appears in menu-driven programs and in older C
and C++ code — and reach for it when the "act, then check" shape genuinely fits. Do
not go looking for excuses to use it. Most loops are honestly `for` loops.

<!-- @intuition -->
Entry-controlled loops ask permission; exit-controlled loops ask forgiveness. When the thing you need permission about does not exist until you have already acted, asking afterwards is the only order that works.

<!-- @approach -->
### Writing a do-while Loop

<!-- @idea -->
Put the body before the condition so it always runs at least once.

<!-- @steps -->
1. Declare any variable the condition will test before the loop, so it stays in scope.
2. Write the body inside a do block.
3. Write the condition in a while clause after the closing brace.
4. Terminate the whole statement with a semicolon.
5. At runtime the body runs first, then the condition is checked.
6. If the condition is true, control returns to the top of the body; if false, execution continues after the loop.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

int main() {
    int i = 0;

    do {
        cout << i << " ";
        i++;
    } while (i < 5);
    cout << endl;      // 0 1 2 3 4 — same as the while version here

    // The difference shows when the condition starts false
    int j = 10;
    do {
        cout << "ran once" << endl;   // prints, despite the condition
    } while (j < 5);

    int k = 10;
    while (k < 5) {
        cout << "never printed" << endl;   // does not print
    }

    // Declare before the loop — the block closes before the condition is read
    int x;
    do {
        cin >> x;
    } while (x != 0);

    return 0;
}
```

<!-- @annotations -->
- 10: The semicolon is mandatory. Omitting it is a compile error.
- 16: The body already executed before the condition was ever evaluated.
- 27: Declaring x inside the do block would put it out of scope in the while clause below.

<!-- @code java -->
```java
import java.util.Scanner;

public class DoWhileBasics {
    public static void main(String[] args) {
        int i = 0;

        do {
            System.out.print(i + " ");
            i++;
        } while (i < 5);
        System.out.println();   // 0 1 2 3 4

        // Condition false from the start
        int j = 10;
        do {
            System.out.println("ran once");   // prints anyway
        } while (j < 5);

        int k = 10;
        while (k < 5) {
            System.out.println("never printed");
        }

        // Declare before the loop
        Scanner sc = new Scanner(System.in);
        int x;
        do {
            x = sc.nextInt();
        } while (x != 0);
    }
}
```

<!-- @annotations -->
- 10: Java uses the same trailing semicolon as C++, and the same scoping rule applies.

<!-- @code python -->
```python
# Python has no do-while. The equivalent uses while True with a break.

i = 0
while True:
    print(i, end=" ")
    i += 1
    if not (i < 5):     # negate the do-while condition
        break
print()                 # 0 1 2 3 4

# Condition false from the start — the body still runs once
j = 10
while True:
    print("ran once")   # prints
    if not (j < 5):
        break

# Compare: a plain while runs zero times
k = 10
while k < 5:
    print("never printed")

# No scope trap here — Python names outlive the block they were assigned in
while True:
    x = int(input())
    if x == 0:
        break
```

<!-- @annotations -->
- 7: A do-while continues while the condition holds, so the break fires when it stops holding.
- 23: Python has no block scope for locals, so a name assigned inside the loop is usable after it.

<!-- @approach -->
### Input Validation: The Canonical Use

<!-- @idea -->
Ask, then judge — because the value being judged does not exist until you have asked.

<!-- @steps -->
1. Declare the variable that will hold the input, before the loop.
2. Inside the body, prompt for and read the value.
3. Optionally report why a previous attempt was rejected.
4. Write the loop condition to be true while the value is still unacceptable.
5. The loop repeats until a valid value arrives, then exits with that value in scope.

<!-- @code cpp -->
```cpp
int age;

do {
    cout << "Enter age (1-120): ";
    cin >> age;

    if (age < 1 || age > 120) {
        cout << "Invalid. Try again." << endl;
    }
} while (age < 1 || age > 120);

cout << "Accepted: " << age << endl;

// The while-loop equivalent duplicates the read
cout << "Enter age (1-120): ";
cin >> age;
while (age < 1 || age > 120) {
    cout << "Invalid. Enter age (1-120): ";
    cin >> age;          // the same two lines, written twice
}

// A menu loop — display must happen before there is a choice to check
int choice;
do {
    cout << "1. Add\n2. Remove\n3. Quit\n";
    cin >> choice;
} while (choice < 1 || choice > 3);
```

<!-- @annotations -->
- 1: Declared outside so it is visible both in the condition and after the loop.
- 16: Two copies of the prompt-and-read logic. Fix a bug in one and the other still has it.
- 24: The menu is part of the body, so it is shown again on every invalid attempt.

<!-- @code java -->
```java
Scanner sc = new Scanner(System.in);
int age;

do {
    System.out.print("Enter age (1-120): ");
    age = sc.nextInt();

    if (age < 1 || age > 120) {
        System.out.println("Invalid. Try again.");
    }
} while (age < 1 || age > 120);

System.out.println("Accepted: " + age);

// A menu loop
int choice;
do {
    System.out.println("1. Add");
    System.out.println("2. Remove");
    System.out.println("3. Quit");
    choice = sc.nextInt();
} while (choice < 1 || choice > 3);
```

<!-- @annotations -->
- 2: Java requires age to be assigned before use, and the do block guarantees it is.

<!-- @code python -->
```python
# The same intent with while True and break
while True:
    age = int(input("Enter age (1-120): "))
    if 1 <= age <= 120:
        break
    print("Invalid. Try again.")

print("Accepted:", age)

# Note the test is written positively here — break when the value IS valid.
# That reads better than negating the do-while condition.

# A menu loop
while True:
    print("1. Add")
    print("2. Remove")
    print("3. Quit")
    choice = int(input())
    if 1 <= choice <= 3:
        break

# Python's exit can sit anywhere in the body, not only at the end
while True:
    line = input()
    if line == "":
        break          # exit before the rest of the body runs
    print(line.upper())
```

<!-- @annotations -->
- 4: Python's chained comparison expresses the valid range directly, unlike C++ and Java.
- 23: More flexible than a do-while, whose condition is fixed at the end of the body.

<!-- @approach -->
### Emulating do-while in Python

<!-- @idea -->
Choose between the two standard workarounds, and know why one is preferred.

<!-- @steps -->
1. Write while True so the loop is unconditional at the header.
2. Place the body's work first, exactly as a do block would.
3. Evaluate the stopping test after that work, where the do-while condition would sit.
4. Break when the loop should end, remembering the test is the negation of a do-while condition.
5. Prefer this over a flag variable, which needs an extra name and an extra assignment to say the same thing.

<!-- @code python -->
```python
# METHOD 1 — while True with break (preferred)
total = 0
while True:
    n = int(input())
    total += n
    if n == 0:
        break
print(total)

# METHOD 2 — flag variable
total = 0
done = False
while not done:
    n = int(input())
    total += n
    if n == 0:
        done = True
print(total)

# Method 2 needs an extra variable, an extra assignment, and does not stop
# immediately — the rest of the body still runs after the flag is set.

# Translating a do-while directly: negate the condition
# C++:  do { body } while (i < 5);
i = 0
while True:
    i += 1
    if not (i < 5):
        break

# Usually clearer written as the positive stopping test
i = 0
while True:
    i += 1
    if i >= 5:
        break
```

<!-- @annotations -->
- 6: break leaves immediately, so nothing after it in the body runs on that iteration.
- 17: Setting a flag does not exit — the remaining body statements still execute this time round.
- 27: A literal translation works but reads awkwardly. Prefer expressing the stop condition directly.

<!-- @code cpp -->
```cpp
// For comparison — the construct Python is emulating
int total = 0;
int n;
do {
    cin >> n;
    total += n;
} while (n != 0);
cout << total << endl;

// C++ can also write the while True form, and sometimes should:
// when the exit belongs in the middle of the body rather than at the end
while (true) {
    int value;
    if (!(cin >> value)) break;   // exit before processing
    cout << value * 2 << endl;
}
```

<!-- @annotations -->
- 7: The condition is the continue-while test, which is the opposite of Python's break-when test.
- 12: do-while can only test at the end. This shape is not expressible as a do-while.

<!-- @code java -->
```java
// For comparison — the construct Python is emulating
Scanner sc = new Scanner(System.in);
int total = 0;
int n;
do {
    n = sc.nextInt();
    total += n;
} while (n != 0);
System.out.println(total);

// The mid-body exit form, which do-while cannot express
while (true) {
    if (!sc.hasNextInt()) break;
    int value = sc.nextInt();
    System.out.println(value * 2);
}
```

<!-- @annotations -->
- 8: Note the semicolon terminating the do-while statement.

<!-- @example -->

<!-- @input -->
i = 10; do { print("ran"); } while (i < 5);  compared with while (i < 5) { print("ran"); }

<!-- @output -->
The do-while prints once. The while prints nothing.

<!-- @why -->
The single defining difference between the two loops, isolated to the one input where it is visible.

<!-- @walkthrough -->
1. In the do-while, control enters the body immediately without evaluating anything.
2. The body prints, producing output before any condition has been considered.
3. The condition 10 < 5 is then evaluated and is false.
4. The loop exits, having run its body exactly once.
5. In the while version, the condition 10 < 5 is evaluated first and is false.
6. The body is skipped entirely and nothing is printed.
7. Identical condition, identical body, different output — because of where the check sits.

<!-- @example -->

<!-- @input -->
Age validation with inputs -5, then 150, then 42

<!-- @output -->
Two rejections, then Accepted: 42

<!-- @why -->
The canonical use, and it shows why entry-controlled checking is impossible here — there was no value to test until the body had run.

<!-- @walkthrough -->
1. The body runs and reads -5, which is the first value that exists to be judged.
2. The condition tests whether -5 is outside the range 1 to 120, which it is, so the loop repeats.
3. The body runs again and reads 150, which is also outside the range, so the loop repeats.
4. The body runs a third time and reads 42.
5. The condition finds 42 within range, so it is false and the loop exits.
6. 42 is still in scope after the loop because the variable was declared before it.

<!-- @example -->

<!-- @input -->
The same validation written with a while loop instead

<!-- @output -->
Works correctly, but the prompt-and-read logic appears twice

<!-- @why -->
Removing this duplication is the whole practical argument for do-while, so seeing the duplicated version is what justifies the construct.

<!-- @walkthrough -->
1. The value must be read once before the loop, so the condition has something to test.
2. The while condition then checks whether that value is invalid.
3. If it is, the body reads again — repeating the same prompt-and-read code already written above.
4. The loop exits once a valid value arrives, giving the correct result.
5. The cost is duplication: the same logic exists in two places and must be kept in step.
6. A later change to the prompt or the read must be made twice, and missing one is a real and common bug.

<!-- @example -->

<!-- @input -->
do { int x; cin >> x; } while (x != 0);

<!-- @output -->
Compile error — x is not in scope in the condition

<!-- @why -->
The one structural gotcha unique to do-while, arising directly from the condition sitting outside the block it depends on.

<!-- @walkthrough -->
1. The variable x is declared inside the do block.
2. Its scope begins at that declaration and ends at the block's closing brace.
3. The while clause sits after that closing brace, so the block has already ended.
4. At that point the name x no longer refers to anything, and the compiler rejects the code.
5. Moving the declaration above the do block gives x a scope that covers both the body and the condition.
6. This is caught at compile time, so it costs a moment rather than a debugging session.

<!-- @visualization code-flow -->

<!-- @description -->
Two flowcharts side by side, sharing one input value chosen so the condition is false from the start. The WHILE chart puts the condition diamond at the top, the body block below it on the true edge, and a back-edge returning from the body to the diamond; the token enters at the diamond. The DO-WHILE chart puts the body block at the top, the condition diamond below it, and the back-edge returning from the diamond to the top of the body; the token enters at the body. Animate both from the same start: the while token reaches its diamond first, the condition fails, and it exits with the body drawn greyed and explicitly never entered. The do-while token enters its body immediately, the body lights and emits its output into a shared output panel, and only then does it reach the diamond, fail, and exit. The output panel ending with one line on the do-while side and nothing on the while side is the whole lesson in one frame. Add a DUPLICATION overlay for the validation case: draw the while version with its read block appearing twice, once above the loop and once inside it, joined by a bracket labelled as the same logic in two places, next to the do-while version where the identical block appears once. Finally show the PYTHON panel, where no do-while shape exists — draw while True as a loop with no condition in its header, and the condition diamond relocated into the middle of the body as a break gate, with an arrow showing that gate is free to slide up or down the body while the do-while diamond is pinned to the bottom.

<!-- @sampleInput -->
```json
{"comparison":{"variable":"i","start":10,"condition":"i < 5","conditionInitiallyTrue":false,"while":{"entersAt":"condition","bodyRuns":0,"output":[]},"doWhile":{"entersAt":"body","bodyRuns":1,"output":["ran once"]}},"validation":{"prompt":"Enter age (1-120)","inputs":[-5,150,42],"iterations":3,"accepted":42,"whileEquivalent":{"readBlocksNeeded":2}},"python":{"construct":"while True + break","conditionPosition":"anywhere in body","doWhilePosition":"pinned to end"}}
```

<!-- @highlights -->
- The while chart places its condition diamond at the entrance, with the body hanging off the true edge.
- The do-while chart places the body at the entrance, with the condition diamond below it.
- Both tokens start with the same value, chosen so the condition is false immediately.
- The while token reaches its diamond first, fails the check, and exits — its body stays greyed and unentered.
- The do-while token enters its body before any check exists, and the body lights up.
- One line of output appears in the shared panel from the do-while side, and nothing from the while side.
- Only now does the do-while token reach its diamond, fail the same check, and exit.
- Same condition, same body, different output — the position of the check is the only variable.
- The duplication overlay draws the while validation with its read block appearing twice, bracketed as one logic in two places.
- The do-while version beside it shows the identical block appearing exactly once.
- The Python panel draws while True with an empty condition slot in the header.
- Its condition diamond sits inside the body as a break gate, with an arrow showing it can slide anywhere in the body.
- The do-while diamond is drawn pinned to the bottom, unable to move — the flexibility Python gains for the construct it lacks.

<!-- @edgeCases -->
- A condition that is false before the loop begins, where the body still runs exactly once.
- A variable declared inside the do block and referenced in the while condition, which is out of scope and rejected at compile time.
- A missing semicolon after the while clause, which is a compile error rather than a silent bug.
- A do-while whose condition never becomes false, which loops forever exactly as a while would.
- A body that fails on its first run because the state it assumes has not been established yet, which is the risk of guaranteeing a run.
- Validation input that never becomes valid, such as a stream that has ended, leaving the loop spinning on failed reads.
- A do-while inside a loop that is itself entered zero times, where the guaranteed run never happens at all.
- Python's while True where the break sits inside a conditional that some inputs never satisfy.
- Setting a flag instead of breaking in Python, where the remaining body statements still execute on the final iteration.

<!-- @pitfalls -->
- Forgetting the semicolon after the while clause, which does not compile.
- Declaring the tested variable inside the do block, so it is out of scope in the condition.
- Using do-while when the body must not run on invalid initial state, where the guaranteed execution is a hazard rather than a feature.
- Assuming Python has a do-while, or that while True with break is a language keyword rather than an idiom.
- Forgetting to negate the condition when translating a do-while into Python's break form.
- Using a flag variable instead of break in Python, which delays the exit until the end of the current iteration.
- Reaching for do-while as a default loop, when most loops have a known count and should be for loops.
- Duplicating the body before a while loop instead of using do-while, then changing only one of the two copies.
- Writing a do-while whose body has no path that can make the condition false, producing a silent infinite loop.

<!-- @doubt -->
### When would I actually use a do-while?

<!-- @answer -->
When the value the condition tests does not exist until the body has produced it. Input validation is the classic case — you cannot judge a number before asking for it. Menu loops are the same shape: the menu must be displayed before there is a choice to check. If you can evaluate the condition before the body runs, a while loop is the better fit and the do-while buys you nothing.

<!-- @doubt -->
### Why does a do-while need a semicolon when other loops don't?

<!-- @answer -->
Because the whole do-while is a single statement and statements end with a semicolon. A for or while loop ends with the closing brace of its body, so there is nothing left to terminate. A do-while ends with the while clause instead, which is part of the same statement. Forgetting it is a compile error rather than a silent bug, which is the one convenience here.

<!-- @doubt -->
### Does Python have a do-while loop?

<!-- @answer -->
No. It was formally proposed in PEP 315 and rejected, on the view that the existing tools already express the idea clearly. The standard equivalent is while True with a break placed after the body's work. Remember the test is inverted — a do-while continues while its condition holds, so the break fires when it stops holding. A flag variable also works but needs an extra name and does not stop immediately.

<!-- @doubt -->
### Why not just copy the body once before a while loop?

<!-- @answer -->
It works and it duplicates code. Two copies of the same prompt-and-read logic means two places a bug can live and two places every future change has to be applied. Sooner or later one gets updated and the other does not. With a one-line body the difference is trivial; with a fifteen-line body it is the entire reason the construct exists.

<!-- @doubt -->
### Is do-while ever strictly required, or always optional?

<!-- @answer -->
Always optional. Any do-while can be rewritten as a while, either by duplicating the body or by using an always-true condition with a break. It is a convenience that removes duplication rather than a capability. That is exactly why Python could reject the proposal without losing anything expressible.

<!-- @doubt -->
### Why can't I use a variable declared inside the do block in the condition?

<!-- @answer -->
Because the block has already closed by the time the condition is read. A variable's scope runs from its declaration to the closing brace of its enclosing block, and the while clause sits after that brace. The name no longer refers to anything there. Declare the variable before the do block so its scope covers both the body and the condition — and note this affects the value afterwards too, which is usually what you want with validated input.

<!-- @doubt -->
### Which of the three loops should I default to?

<!-- @answer -->
for, by a wide margin. Most repetition has a count known before it starts — iterate an array, repeat n times, walk a range — and the for header states that shape on one line. Reach for while when the stopping point depends on data you have not seen yet, and for do-while only when the first iteration is what produces the value you need to test.

<!-- @doubt -->
### Do I need do-while for DSA problems?

<!-- @answer -->
Almost never. Algorithm problems read input in a fixed format rather than validating it interactively, and that validate-after-acting shape is where do-while earns its place. Expect for loops for array traversal and while loops for condition-driven work such as binary search or digit extraction. Learn to read do-while, because it appears in menu-driven programs and older C and C++ code, but do not go looking for reasons to write it.
