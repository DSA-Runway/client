---
id: understand-recursion-by-print-something-n-times
topic: Basic Recursion
title: Understand recursion by print something N times
difficulty: Easy
status: ready
prerequisites:
  - functions-declaration-and-calling
  - function-parameters-and-return-values
  - stack-memory-and-recursion-depth
  - if-else-statements
  - for-loop
relatedIds:
  - print-name-n-times-using-recursion
  - print-1-to-n-using-recursion
  - stack-memory-and-recursion-depth
  - functions-declaration-and-calling
---

<!-- @summary -->
Print a message N times by having a function call itself — the smallest problem that shows what a base case is for, and where swapping the two lines of the body produces byte-identical output while changing the largest N the program survives from 261,000 to 100,000,000.

<!-- @theory -->
## The problem

Print some fixed message `N` times. A loop does this in one line, and the point of
doing it with recursion is that the answer is not interesting — which leaves the
*mechanism* as the only thing to look at.

```
n = 3   ->   x
             x
             x
```

## A function that calls itself

Recursion is one idea: **solve a smaller version of the same problem, then use it.**

Printing something `n` times is: print it once, then print it `n - 1` times. That
second half is the same problem with a smaller number, so the function can call
itself to do it.

```
printNTimes(n):
    if n == 0: return          <- base case: the version small enough to answer directly
    print the message          <- the work this call is responsible for
    printNTimes(n - 1)         <- the smaller version of the same problem
```

Two parts, and both are mandatory.

The **base case** is the input the function answers without calling itself. Here
it is `n == 0`: printing something zero times means doing nothing.

The **recursive case** does one unit of work and hands the rest on. The number it
hands on must be **closer to the base case** than the one it received, or the
chain never ends.

## Every call is still a live function

This is the part that a loop does not have and the part everything below turns on.

When `printNTimes(3)` calls `printNTimes(2)`, the first call has **not finished**.
It is suspended, holding its own copy of `n`, waiting for the inner call to
return. So at the deepest point of `printNTimes(3)` there are **four** function
calls alive at once — for n = 3, 2, 1 and 0 — stacked on top of each other.

Those suspended calls live on the **call stack**, and each one occupies real
memory. A loop keeps one variable; this keeps `n + 1` frames.

Compiled at `-O0` on this machine, each frame is **32 bytes** — the function
opens with `sub sp, sp, #32`. The stack is **8,372,224 bytes**. Dividing gives a
predicted maximum depth of **261,632**, and the measured crash sits at **261,718**,
with 259,960 still surviving.

That is the whole cost model: **recursion trades O(1) space for O(n) space**, and
the ceiling is a real, computable number.

## Forgetting the base case does not hang — it crashes

The natural expectation is an infinite loop. That is not what happens, because
each call consumes stack that is never released.

| | Behaviour |
|---|---|
| C++, `-O0` | **SIGSEGV**, exit 139, no message of any kind |
| C++, `-O2` | worse — see below |
| Python | `RecursionError: maximum recursion depth exceeded`, **catchable** |

Python's is the only one that tells you what went wrong. C++ simply dies.

The same thing happens if the base case exists but the recursion moves **away**
from it — writing `printNTimes(n + 1)` never reaches zero, and crashes exactly as
a missing base case does.

### And at -O2 the C++ behaviour is not merely a crash

Infinite recursion with no side effects is **undefined behaviour** in C++, so the
compiler is entitled to assume it cannot happen. Clang acts on that: the function
body is replaced with a single trap instruction, `brk #0x1`. The program then
prints garbage — a depth counter reading 4,294,967,291 that was never incremented
— and exits **0**.

So the failure is not "it hangs", and at `-O2` it is not even "it crashes". It is
"the program does something arbitrary and reports success."

## The two lines can be swapped, and the output does not change

Here is where this problem earns its place as the first one.

```
print then recurse            recurse then print
    print                         printNTimes(n - 1)
    printNTimes(n - 1)            print
```

Because the same message is printed every time, the order the prints happen in is
invisible. Verified: byte-identical output at n = 1,000.

They are not the same program.

In the first version the recursive call is the **last thing the function does** —
a **tail call**. There is nothing left to come back for, so the compiler can
discard the current frame before making the call, which turns the recursion into
a loop. In the second, a print is still pending after the call returns, so the
frame must survive and the recursion is real.

Clang at `-O2` does exactly this. Counting the function's calls to itself in the
generated assembly:

| Version | Self-calls at `-O2` | Deepest N survived |
|---|---|---|
| Print then recurse | **0** | **100,000,000** |
| Recurse then print | 2 | **261,000** |

**A factor of about 383 in the largest input the program can handle, from
swapping two adjacent lines that produce identical output.**

The optimiser's own label gives it away — the loop it produces is annotated
`This Inner Loop Header: Depth=1`, and there is no recursive branch left at all.

Two things follow. **The recursion you write is not necessarily the recursion that
runs.** And a program that works at `-O2` may crash at `-O0`, which is the reverse
of the usual expectation.

## Python's limit is a policy, not a wall

Python does not eliminate tail calls — ever, in any version, deliberately. But its
depth limit is a different kind of thing from C++'s.

`sys.getrecursionlimit()` returns **1000** by default, and the deepest successful
call is **998**. That number is a counter the interpreter checks, not a measure of
available memory, and it can simply be raised.

Measured on **Python 3.13.4**: raising it to 1,000,000 and recursing **900,000**
deep completes normally. Older advice warns that raising the limit trades a clean
`RecursionError` for a hard interpreter segfault, because each Python call used a
C stack frame. On this version that is no longer the case for ordinary Python
functions.

So the limit is a guard rail you may move — while knowing it was put there for a
reason, and that the reason has changed.

## What it costs

Per step, at `-O2`, n = 100,000, median of fifteen runs:

| | ns per step |
|---|---|
| Loop | 1.379 |
| Print-then-recurse (compiled to a loop) | 0.735 |
| **Recurse-then-print (genuinely recursive)** | **5.468** |

Real recursion costs about **4.0x** a loop here — a call, a return, and a frame
per step. The tail version is not being compared as recursion at all, because by
this point it is not recursion.

Python, n = 50,000: a loop costs **10.4ns** per step and recursion **56.4ns**, a
factor of **5.4**, with no optimisation available to close it.

## So why write it recursively

Not for this problem. A loop is shorter, faster, and cannot run out of stack.

The reason to meet recursion here is that this is the smallest problem where the
machinery is visible without anything else competing for attention. The next two
subtopics change one thing each — **Print 1 to N** and **Print N to 1** are this
function with the print moved relative to the call, and the order that was
invisible here becomes the entire answer.

<!-- @intuition -->
Think of it as passing a task down a line of people. You are told to print something three times; you print it once yourself and hand "print it twice" to the person behind you, who prints once and hands "print it once" on again. The line ends when someone is handed "print it zero times" and does nothing. The thing to notice is that nobody in the line has finished — each is still standing there waiting for the person behind them to report back, which is why a line of a million people costs a million people's worth of space, and why a line with no end does not run forever but falls over.

<!-- @approach -->
### Iteration - The Loop

<!-- @idea -->
Run a counted loop and print once per iteration.

<!-- @steps -->
1. Take the count n as input.
2. Start a counter at zero.
3. While the counter is below n, print the message.
4. Increase the counter by one.
5. Stop when the counter reaches n, having printed exactly n times.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The baseline every recursive version is measured against. One variable regardless of n, no depth limit, and measured 1.379ns per step at n = 100,000 against 5.468ns for genuine recursion. A loop cannot overflow the stack, which is the whole of its advantage here.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printNTimes(int n) {
    for (int i = 0; i < n; i++) {
        cout << "x\n";
    }
}
```

<!-- @annotations -->
- 5: One counter, one comparison, and the same memory whatever n is — this is the O(1) space the recursive versions give up.
- 6: A negative or zero n prints nothing, because the condition fails before the first iteration.

<!-- @code java -->
```java
static void printNTimes(int n) {
    for (int i = 0; i < n; i++) {
        System.out.println("x");
    }
}
```

<!-- @annotations -->
- 2: No stack depth is consumed at all, so this version has no maximum n beyond the range of the counter itself.

<!-- @code python -->
```python
def print_n_times(n):
    for _ in range(n):
        print("x")


# Measured 10.4ns per step at n = 50,000, against 56.4ns for the
# recursive version — a factor of 5.4 that no optimisation removes.
```

<!-- @annotations -->
- 2: The underscore names the counter honestly, since its value is never used.

<!-- @approach -->
### Recursion - Print Then Recurse

<!-- @idea -->
Print once, then ask a smaller call to print the remaining n minus one times.

<!-- @steps -->
1. Check the base case first: if n is zero or less, return without doing anything.
2. Print the message once, which is this call's share of the work.
3. Call the same function with n minus one.
4. That call handles every remaining print, by the same rule.
5. When it returns there is nothing left to do, so this call returns immediately.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack as written, O(1) if the compiler eliminates the tail call
- note: The recursive call is the last statement, which makes it a tail call. Clang at -O2 removes it entirely — zero self-calls in the generated assembly, and the loop it produces is labelled This Inner Loop Header. Measured to survive n = 100,000,000, against 261,000 for the non-tail version.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printNTimes(int n) {
    if (n <= 0) return;              // base case, checked FIRST

    cout << "x\n";                   // this call's own work
    printNTimes(n - 1);              // the same problem, one smaller
}
```

<!-- @annotations -->
- 5: The base case must come before the recursive call, or the check never runs and the chain has no end.
- 5: n <= 0 rather than n == 0, so a negative argument stops immediately instead of recursing away from the base case forever.
- 8: n - 1 moves toward the base case. Writing n + 1 or n compiles fine and crashes at runtime.
- 8: Nothing follows this call, which is what makes it a tail call and lets -O2 turn the whole function into a loop.

<!-- @code java -->
```java
static void printNTimes(int n) {
    if (n <= 0) return;

    System.out.println("x");
    printNTimes(n - 1);
}
```

<!-- @annotations -->
- 2: Java's specification does not permit the JVM to eliminate tail calls, so this stays O(n) stack and throws StackOverflowError rather than segfaulting.
- 5: At the deepest point there are n + 1 calls alive at once, each holding its own copy of n.

<!-- @code python -->
```python
def print_n_times(n):
    if n <= 0:
        return

    print("x")
    print_n_times(n - 1)


# Python never eliminates tail calls, by deliberate design, so this
# is O(n) stack at every n. The default limit is 1000 and the
# deepest successful call is 998.
```

<!-- @annotations -->
- 2: Returning on n <= 0 covers both the base case and a negative argument in one test.
- 6: This call is in tail position and Python does not care — the frame is kept regardless.

<!-- @approach -->
### Recursion - Recurse Then Print

<!-- @idea -->
Ask the smaller call to run first, then print once on the way back out.

<!-- @steps -->
1. Check the base case first and return if n is zero or less.
2. Call the same function with n minus one, before printing anything.
3. That call completes the whole chain down to the base case.
4. Only when it returns does this call print its message.
5. The prints therefore happen as the stack unwinds, in the reverse order.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack, and it cannot be optimised away
- note: Produces byte-identical output to the previous approach for this problem — verified at n = 1,000 — because the same message is printed each time. It is nonetheless a different program: two self-calls survive at -O2, and it crashed above n = 261,000 where the tail version survived 100,000,000.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printNTimes(int n) {
    if (n <= 0) return;

    printNTimes(n - 1);              // recurse FIRST
    cout << "x\n";                   // then print, on the way back out
}
```

<!-- @annotations -->
- 7: The call comes first, so the printing happens in reverse order — invisible here, and the whole answer in Print N to 1.
- 8: Because a statement still has to run after the call returns, this frame cannot be discarded and the recursion is real.
- 8: Measured 5.468ns per step against the loop's 1.379ns — about 4.0x, which is the genuine cost of a call and a frame.

<!-- @code java -->
```java
static void printNTimes(int n) {
    if (n <= 0) return;

    printNTimes(n - 1);
    System.out.println("x");
}
```

<!-- @annotations -->
- 4: Identical output to the print-first version for this problem, and a different execution order underneath.

<!-- @code python -->
```python
def print_n_times(n):
    if n <= 0:
        return

    print_n_times(n - 1)
    print("x")


# Identical output to print-then-recurse here. In Print 1 to N and
# Print N to 1, this same swap is the difference between the two
# problems rather than an invisible detail.
```

<!-- @annotations -->
- 5: Every print in this version happens during the unwind, after the deepest call has already returned.

<!-- @approach -->
### Counting Up with Two Parameters

<!-- @idea -->
Carry a current position and a limit, and recurse until the position passes the limit.

<!-- @steps -->
1. Take two numbers: the current position i and the limit n.
2. Check the base case: if i is greater than n, return without printing.
3. Print the message once.
4. Call the function again with i increased by one and n unchanged.
5. Start the whole thing from i equal to one.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack
- note: The same number of calls and the same stack depth, with the counter running the other way. It is worth writing because it is the shape almost every later recursion takes — a moving index plus a fixed bound — and because it makes the base case a comparison between two values rather than a test against zero.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printFrom(int i, int n) {
    if (i > n) return;               // base case compares the two parameters

    cout << "x\n";
    printFrom(i + 1, n);             // i moves, n stays fixed
}

void printNTimes(int n) { printFrom(1, n); }
```

<!-- @annotations -->
- 5: The base case is now a relationship between the parameters rather than a fixed value, which is the form that generalises.
- 8: Only i changes. Advancing n as well would move the target and the base case would never be reached.
- 11: A wrapper keeps the caller's interface to a single argument, which is the usual way this pattern is presented.

<!-- @code java -->
```java
static void printFrom(int i, int n) {
    if (i > n) return;

    System.out.println("x");
    printFrom(i + 1, n);
}

static void printNTimes(int n) { printFrom(1, n); }
```

<!-- @annotations -->
- 2: Strictly greater than, so i equal to n still prints and the count comes out at exactly n.

<!-- @code python -->
```python
def print_from(i, n):
    if i > n:
        return
    print("x")
    print_from(i + 1, n)


def print_n_times(n):
    print_from(1, n)


# Python allows a default, so print_from(i, n) can be written as one
# function with i=1 — convenient, and it hides which value moves.
```

<!-- @annotations -->
- 5: i + 1 with n unchanged. Passing n + 1 as well is the mistake this two-parameter form invites.

<!-- @example -->

<!-- @input -->
n = 3, traced through the call stack

<!-- @output -->
Three lines printed, and four calls alive at the deepest point

<!-- @why -->
Small enough to hold every frame in mind at once, and it shows that the number of live calls is n + 1 rather than n — the base case call is real and occupies a frame like any other.

<!-- @walkthrough -->
1. printNTimes(3) is called. n is 3, which is not zero, so it prints once and calls printNTimes(2).
2. That first call has not returned — it is suspended, holding its own n = 3, waiting.
3. printNTimes(2) prints once and calls printNTimes(1), which prints once and calls printNTimes(0).
4. At this moment four calls are alive at the same time, holding n values of 3, 2, 1 and 0.
5. printNTimes(0) matches the base case, returns immediately, and its frame is released.
6. Each suspended call then returns in turn — the 1, then the 2, then the 3 — releasing its frame as it goes.
7. Three messages were printed and four frames existed, which is the n + 1 the stack cost is measured from.

<!-- @example -->

<!-- @input -->
The same function with the base case deleted

<!-- @output -->
SIGSEGV in C++ with no message, a catchable RecursionError in Python

<!-- @why -->
Corrects the common expectation that a missing base case produces an infinite loop, and shows the three languages failing in three genuinely different ways.

<!-- @walkthrough -->
1. Without the base case, every call makes another call and none of them ever returns.
2. Each of those calls occupies a stack frame that is never released, so the stack is consumed rather than the CPU spun.
3. Compiled at -O0, the program terminates with signal 11 and exit code 139, printing nothing at all.
4. Python raises RecursionError with the message maximum recursion depth exceeded, which can be caught and reported.
5. Compiled at -O2 the result is worse than a crash: infinite recursion with no side effects is undefined behaviour, so clang replaces the function body with a trap instruction.
6. That program printed a depth counter reading 4,294,967,291 — a value never actually computed — and exited with status 0.
7. Writing the recursive call as n + 1 instead of n - 1 fails in exactly the same ways, because it also never reaches the base case.

<!-- @example -->

<!-- @input -->
Print-then-recurse against recurse-then-print, at -O2

<!-- @output -->
Byte-identical output, and 100,000,000 against 261,000 for the largest N handled

<!-- @why -->
Two programs that no test on their output could distinguish, differing by a factor of 383 in the input they can accept — which is the clearest possible demonstration that the call stack is a real resource.

<!-- @walkthrough -->
1. Both versions print the same message the same number of times, verified byte-identical at n = 1,000.
2. In the print-first version nothing remains to be done after the recursive call returns, so it is a tail call.
3. The compiler can therefore release the current frame before making the call, which turns the whole function into a loop.
4. Counting the function's calls to itself in the generated assembly gives zero for that version and two for the other.
5. The optimiser labels the loop it produced This Inner Loop Header, confirming no recursion survives.
6. Measured, the tail version completed at n = 100,000,000 while the non-tail version crashed above n = 261,000.
7. Compiled at -O0 instead, the tail version crashes at the same depth as the other, so the program works at -O2 and fails at -O0.

<!-- @example -->

<!-- @input -->
Python's recursion limit, default and raised

<!-- @output -->
998 by default, and 900,000 after raising it, on Python 3.13.4

<!-- @why -->
Shows that Python's ceiling is a settable policy rather than a physical limit, and that the standard warning attached to raising it no longer describes current behaviour.

<!-- @walkthrough -->
1. sys.getrecursionlimit() returns 1000 by default, and the deepest call that succeeds is 998.
2. That number is a counter the interpreter increments and checks, not a measurement of available memory.
3. Raising it with sys.setrecursionlimit is permitted and takes effect immediately.
4. Measured on Python 3.13.4 with the limit set to 1,000,000, a recursion 900,000 deep completed and returned normally.
5. The long-standing warning is that raising the limit converts a clean RecursionError into an interpreter segfault, because each Python call consumed a C stack frame.
6. That is not what happens on this version for ordinary Python functions, which no longer consume C stack per call.
7. The guard rail is still worth respecting, because a deep recursion is usually a signal that the problem wanted a loop.

<!-- @visualization memory-model -->

<!-- @description -->
The call stack drawn as a vertical column of frames growing upward from a baseline, with each frame a labelled box holding its own copy of n — and the copies must be visibly separate, because the single most common misunderstanding is that there is one n being decremented rather than four independent ones. Call printNTimes(3) and push a frame; as it prints, flash the output line, then push the next frame on top with n one lower, dimming the frame beneath to show it is suspended rather than finished. Keep every dimmed frame on screen. At n = 0 the base-case frame lights differently, prints nothing, and pops immediately, after which the frames pop in turn from the top down, each brightening for an instant as it resumes and then vanishing. A counter beside the column reads live frames, peaking at 4 for n = 3 and labelled n + 1. Then the failure panel: delete the base case and let the column grow without stopping, drawn against a fixed-height wall marked 8,372,224 bytes with a frame size of 32 bytes; as the column reaches the wall, the whole figure terminates abruptly with no message, annotated SIGSEGV, exit 139, and the predicted depth 261,632 printed against the measured 261,718. The centre of the figure is the tail-call panel: two columns side by side, fed by two code snippets differing only in the order of two lines, with their output streams shown beneath and marked identical. The left column pushes a frame, prints, and then — because nothing is pending — visibly discards the frame before pushing the next, so the column never grows past one. The right column keeps every frame, because a pending print is drawn as a small marker left inside each box. Run both to n = 261,000: the right column hits the wall and dies, the left stays one frame tall and keeps going to 100,000,000. Close with a Python panel showing the limit as a numeric dial reading 1000 rather than a wall, turned up to 1,000,000, with the column growing past where the C++ wall stood and a note that the dial is a policy while the wall is physics.

<!-- @sampleInput -->
```json
{"primary":{"n":3,"frames":[{"depth":1,"n":3,"printed":true},{"depth":2,"n":2,"printed":true},{"depth":3,"n":1,"printed":true},{"depth":4,"n":0,"printed":false,"baseCase":true}],"peakLiveFrames":4,"rule":"n + 1","printsEmitted":3,"unwindOrder":[0,1,2,3]},"stackCost":{"frameBytes":32,"frameInstruction":"sub sp, sp, #32","stackBytes":8372224,"predictedMaxDepth":261632,"measuredDeepestSurvived":259960,"measuredFirstCrash":261718},"missingBaseCase":{"cpp":{"O0":{"signal":"SIGSEGV","exit":139,"message":"none"},"O2":{"reason":"infinite recursion without side effects is undefined behaviour","emitted":"brk #0x1","printedDepth":4294967291,"exit":0}},"python":{"error":"RecursionError","message":"maximum recursion depth exceeded","catchable":true},"wrongDirection":{"call":"printNTimes(n + 1)","behaviour":"identical failure — never reaches the base case"}},"tailCall":{"outputIdentical":true,"verifiedAt":1000,"printThenRecurse":{"selfCallsAtO2":0,"optimiserLabel":"This Inner Loop Header: Depth=1","deepestSurvived":100000000},"recurseThenPrint":{"selfCallsAtO2":2,"deepestSurvived":261000},"ratio":383,"note":"at -O0 both crash at the same depth, so the program works at -O2 and fails at -O0"},"python":{"version":"3.13.4","defaultLimit":1000,"deepestSuccessfulAtDefault":998,"raisedLimit":1000000,"depthCompleted":900000,"eliminatesTailCalls":false,"legacyWarning":"raising the limit used to risk an interpreter segfault; not observed on this version for ordinary Python functions"},"cost":{"unit":"ns per step","cpp":{"n":100000,"loop":1.379,"printThenRecurse":0.735,"recurseThenPrint":5.468,"realRecursionVsLoop":4.0},"python":{"n":50000,"loop":10.4,"recursion":56.4,"ratio":5.4}}}
```

<!-- @highlights -->
- The call stack grows upward as a column of frames, each holding its own separate copy of n.
- Those copies are drawn as distinct values, because the common misreading is that one n is being decremented.
- Each call prints, then pushes the next frame on top while dimming itself to show it is suspended, not finished.
- Every dimmed frame stays on screen, so the suspended calls accumulate visibly.
- At n = 0 the base-case frame lights differently, prints nothing, and pops at once.
- The frames then pop from the top down, each brightening as it resumes before vanishing.
- A live-frame counter peaks at 4 for n = 3, labelled n + 1 rather than n.
- The failure panel deletes the base case and lets the column grow against a wall marked 8,372,224 bytes.
- With 32 bytes per frame the wall is reached at a predicted 261,632, against a measured crash at 261,718.
- The figure terminates abruptly there with no message, annotated SIGSEGV, exit 139.
- The tail-call panel runs two columns fed by snippets differing only in the order of two lines.
- Their output streams are shown beneath and marked identical.
- The left column discards each frame before pushing the next, so it never grows past one frame.
- The right column keeps every frame, with a pending-print marker drawn inside each box.
- Run to n = 261,000 the right column hits the wall and dies while the left continues to 100,000,000 — a factor of 383.
- The Python panel draws the limit as a dial reading 1000 rather than a wall, turned up to 1,000,000 and passing where the C++ wall stood.

<!-- @edgeCases -->
- n equal to zero — the base case fires immediately, nothing is printed, and exactly one frame is used.
- n equal to one — one print and two frames, the smallest input where a recursive call actually happens.
- Negative n — testing n <= 0 rather than n == 0 stops immediately, where n == 0 would recurse away from the base case forever.
- The base case checked after the print — the message is printed one extra time before the chain ends.
- The base case checked after the recursive call — it never runs at all, and the behaviour is that of a missing base case.
- Recursing with n rather than n - 1 — compiles cleanly and never terminates.
- Recursing with n + 1 — the same failure, moving away from the base case rather than standing still.
- n around 261,000 in C++ — the depth at which a genuinely recursive version exhausts an 8 MB stack.
- n above 1,000 in Python — the default recursion limit, which raises a catchable error rather than crashing.
- Compiling the tail-recursive version at -O0 rather than -O2 — it loses the loop conversion and crashes at the same depth as the non-tail form.
- Very large n where the loop is the only version that works at all, since it consumes no stack whatever.

<!-- @pitfalls -->
- Omitting the base case. It does not hang — measured, C++ at -O0 dies with SIGSEGV and exit 139 and no message at all.
- Expecting -O2 to be safer. Infinite recursion without side effects is undefined behaviour, and clang replaced the body with a trap instruction, producing garbage output and exit status 0.
- Placing the base case after the recursive call, which means it never executes and the function behaves as if it had none.
- Placing the base case after the print, which prints one extra time before stopping.
- Recursing with n instead of n - 1, which compiles and never terminates because nothing moves toward the base case.
- Recursing with n + 1, which moves away from the base case and fails identically.
- Testing n == 0 rather than n <= 0, so a negative argument recurses forever instead of returning at once.
- Believing there is one n being decremented. Each live call holds its own copy, and at the deepest point of n = 3 there are four of them.
- Assuming the two orderings are the same program. They print identically here and differ by a factor of 383 in the largest n they survive.
- Relying on tail-call elimination. It is a compiler courtesy in C++, absent at -O0, forbidden by the JVM specification, and deliberately never done by Python.
- Raising Python's recursion limit as a fix. It works on 3.13.4 to 900,000 deep, and a recursion that deep is usually a signal the problem wanted a loop.
- Choosing recursion for this problem at all. The loop is shorter, uses O(1) space, measured 4.0x faster, and has no maximum n.

<!-- @doubt -->
### What is a base case, and why must it come first?

<!-- @answer -->
The base case is the input small enough to answer without calling yourself — here, printing something zero times, which means doing nothing. It has to be checked before the recursive call because it is the only thing that stops the chain. If the check comes after the call, it never executes: the function calls itself, which calls itself, and control never reaches the line that would have stopped it. Putting it first, as the very first statement, makes that ordering impossible to get wrong.

<!-- @doubt -->
### What actually happens if I forget it?

<!-- @answer -->
Not an infinite loop — a crash, and the three languages differ sharply. Each call occupies a stack frame that is never released, so the stack is consumed rather than the processor spun. Compiled at -O0, C++ terminates with SIGSEGV and exit code 139, printing nothing. Python raises RecursionError with the message maximum recursion depth exceeded, which you can catch. At -O2 the C++ case is worse than a crash: infinite recursion with no side effects is undefined behaviour, so clang replaced the whole function body with a trap instruction and the program printed a garbage depth of 4,294,967,291 and exited 0.

<!-- @doubt -->
### Why must the recursive call use n - 1?

<!-- @answer -->
Because the argument has to get closer to the base case on every call, and n - 1 is what moves it there. Passing n unchanged means every call is identical to the one before, so the chain never ends. Passing n + 1 is worse in an obvious way — it moves away from zero — and fails exactly the same, because both never reach the base case. Neither mistake is caught by the compiler; both are perfectly valid programs that crash at runtime.

<!-- @doubt -->
### Does it matter whether I print before or after the recursive call?

<!-- @answer -->
For this problem the output is identical — verified byte-for-byte at n = 1,000 — because the same message is printed each time and the order is invisible. Underneath they are different programs. Printing first leaves nothing to do after the call returns, which makes it a tail call the compiler can turn into a loop; printing after means a statement is still pending, so the frame has to survive. Measured, that difference took the largest workable n from 261,000 to 100,000,000. And in the next two subtopics the order stops being invisible — it becomes the entire difference between Print 1 to N and Print N to 1.

<!-- @doubt -->
### How is one version 383 times better if they do the same thing?

<!-- @answer -->
Because only one of them is still recursion by the time it runs. When the recursive call is the last thing a function does, the current frame holds nothing anyone will come back for, so the compiler can release it before making the call — which is exactly a loop. Counting the function's calls to itself in the assembly clang produces at -O2 gives zero for the print-first version and two for the other, and the loop it generates is even labelled This Inner Loop Header. So one version uses one frame regardless of n and survived n = 100,000,000, while the other used n frames and crashed above 261,000.

<!-- @doubt -->
### How deep can I actually go?

<!-- @answer -->
In C++ it is a computable number rather than a mystery. Each frame here is 32 bytes, which the function announces with sub sp, sp, #32, and the stack is 8,372,224 bytes — dividing gives 261,632. Measured, 259,960 survived and 261,718 crashed, so the prediction is accurate to within a rounding error. Change the frame size, by adding local variables, and the ceiling moves. In Python the number is not derived from memory at all: it is a counter set to 1000 by default, with 998 the deepest call that succeeds.

<!-- @doubt -->
### Should I just raise Python's recursion limit?

<!-- @answer -->
You can, and it works better than its reputation. Measured on Python 3.13.4, setting the limit to 1,000,000 and recursing 900,000 deep completed normally. The traditional warning is that raising the limit swaps a clean RecursionError for an interpreter segfault, because each Python-level call consumed a C stack frame — that is not what this version does for ordinary Python functions. Treat the limit as a signal rather than an obstacle, though: needing a depth of hundreds of thousands almost always means the problem wanted a loop.

<!-- @doubt -->
### Is recursion slower than a loop?

<!-- @answer -->
Yes, when it is genuinely recursive. Measured at -O2 with n = 100,000, a loop cost 1.379ns per step and the version that cannot be optimised away cost 5.468ns — about 4.0x, which pays for a call, a return and a frame each step. In Python the gap is 10.4ns against 56.4ns, a factor of 5.4, and no optimisation is available to close it because Python never eliminates tail calls. The version that can be optimised is not a fair comparison, since by the time it runs it is a loop.

<!-- @doubt -->
### Then why would anyone write this recursively?

<!-- @answer -->
For this problem, nobody should — a loop is shorter, uses constant space, is measurably faster, and has no maximum n. The value is that printing something N times is the smallest problem in which the mechanism is visible with nothing else competing for attention: one base case, one recursive call, and a stack you can draw. Recursion earns its place when the problem is genuinely self-similar in a way a loop cannot express directly, such as a tree or a division into independent halves. Meeting it first on a problem where it is unnecessary is what makes the machinery, rather than the answer, the thing you are looking at.

<!-- @doubt -->
### Why are there n + 1 frames rather than n?

<!-- @answer -->
Because the base-case call is a real call. For n = 3 the chain is printNTimes(3), (2), (1) and (0) — four calls, of which three print and one returns immediately. The last one still had to be invoked, still received an argument, and still occupied a frame while it decided it had nothing to do. That is worth being precise about, since it is where an off-by-one in a stack-depth estimate comes from, and it is why the measured crash depth sits slightly above the frame-count prediction rather than below it.
