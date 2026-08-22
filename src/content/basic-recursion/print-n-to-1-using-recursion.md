---
id: print-n-to-1-using-recursion
topic: Basic Recursion
title: Print N to 1 using Recursion
difficulty: Easy
status: ready
prerequisites:
  - print-1-to-n-using-recursion
  - print-name-n-times-using-recursion
  - understand-recursion-by-print-something-n-times
  - stack-memory-and-recursion-depth
  - for-loop
relatedIds:
  - print-1-to-n-using-recursion
  - sum-of-first-n-numbers
  - understand-recursion-by-print-something-n-times
  - stack-memory-and-recursion-depth
---

<!-- @summary -->
Print N down to 1 — the mirror of the previous subtopic, and not a symmetric one: here a single function is both one-parameter and tail-recursive, which no version of Print 1 to N manages, so the same optimiser that leaves that problem stuck at 261,000 lets this one run past 29,996,338.

<!-- @theory -->
## The problem

Print `N, N-1, … 2, 1`, in that order.

```
n = 5   ->   5 4 3 2 1
```

The previous subtopic ended by pointing here, and by now the mechanics are
familiar: a recursive function can act **before** its recursive call or **after**
it, and those two moments produce opposite orders. So this problem has the same
two solutions with the roles exchanged.

What is not obvious — and is the reason this deserves its own subtopic rather than
a footnote — is that the exchange is **not symmetric**. One of these two problems
has a strictly better natural solution than the other, and it is this one.

## The two forms, mirrored

```
count down, print BEFORE the call        count up, print AFTER the call

downFirst(n):                            upAfter(i, n):
    if n <= 0: return                        if i > n: return
    print n                                  upAfter(i + 1, n)
    downFirst(n - 1)                         print i

-> 5 4 3 2 1                             -> 5 4 3 2 1
```

Both print `5 4 3 2 1`, verified identical for every n tested.

The left one prints on the way **in**: the outermost frame emits `n` first, then
hands on. The right one prints on the way **out**: the deepest frame holds `i = n`
and resumes first, so the largest value is emitted first even though the parameter
was ascending.

## The asymmetry

Now compare the two problems side by side. Each has a one-parameter form and a
tail-recursive form, and the question is whether they are the *same* form:

| | One-parameter form | Tail-recursive form | Same function? |
|---|---|---|---|
| Print 1 to N | count down, print after | count up, print before | **no** |
| **Print N to 1** | count down, print before | count down, print before | **yes** |

For **1 to N** you must choose. The version with one parameter keeps a pending
print, so its frame cannot be discarded; the version that is a tail call needs an
index and a limit. You get one property or the other.

For **N to 1** they coincide. Counting down means the parameter itself is the
value to print, so no second parameter is needed — and printing before the call
leaves nothing pending, so it is a tail call. **One function, both properties.**

Confirmed in the generated assembly, counting each function's calls to itself at
`-O2`:

| Function | Parameters | Self-calls at `-O2` |
|---|---|---|
| N to 1, count down, print first | **1** | **0** |
| N to 1, count up, print after | 2 | 1 |
| 1 to N, count up, print first | 2 | **0** |
| 1 to N, count down, print after | **1** | 1 |

Only the first row has both a 1 and a 0.

## What that is worth

Deepest N that completes:

| | `-O0` | `-O2` |
|---|---|---|
| Count down, print first | 261,000 | **> 29,996,338** |
| Count up, print after | 261,000 | 261,000 |

And per number, at `-O2`:

| | ns |
|---|---|
| Loop | 0.354 |
| **Count down, print first** | **0.345** |
| Count up, print after | 6.083 |

The natural solution to this problem measures **the same as a loop**, because at
`-O2` it has become one — and it has no depth limit. The one-parameter solution to
Print 1 to N measured 10.972ns and crashed at 261,000. Two problems that look like
exact mirrors, and one of them is genuinely easier to solve well.

## Counting downward has hazards counting upward does not

The recursion is the easy half. The *loop* is where descending order introduces
mistakes that ascending order simply cannot make.

### The unsigned counter never terminates

```cpp
for (size_t i = n; i >= 0; i--)     // i >= 0 is ALWAYS true
```

An unsigned value is never negative, so the condition can never fail. The loop
runs forever, and when `i` is 0 the decrement wraps it to a huge value rather than
ending anything.

The ascending equivalent has no such trap — `i < n` behaves identically signed or
unsigned.

Worse, **the standard warning set does not catch it.** Measured on this compiler:

| Flags | Warnings |
|---|---|
| none | 0 |
| `-Wall` | **0** |
| `-Wall -Wextra` | **0** |
| `-Wtautological-unsigned-zero-compare` | 2 |

You have to ask for that diagnostic by name.

### Python's descending range has three wrong forms

Ascending is `range(1, n + 1)`, and the one natural mistake is dropping the `+ 1`.
Descending needs all three arguments, and each one can be wrong on its own:

| Written | n = 5 gives | |
|---|---|---|
| `range(n, 0, -1)` | `5 4 3 2 1` | correct |
| `range(n, 0)` | `[]` | step omitted — **empty, silently** |
| `range(n, 1, -1)` | `5 4 3 2` | loses the 1 |
| `range(n, -1, -1)` | `5 4 3 2 1 0` | includes 0 |

The second is the nastiest: forgetting the step does not raise, it produces no
output at all.

## The recursive base cases mirror too

| Written | Should be | n = 3 gives | Effect |
|---|---|---|---|
| `if (n < 0) return` | `n <= 0` | `3 2 1 0` | prints a trailing 0 |
| `if (i >= n) return` | `i > n` | `2 1` | loses the n |

Note where the damage lands. Both mistakes lose or add the same value as they did
in Print 1 to N — a spurious 0, and the value n going missing — but at the
opposite end of the output, because the emission order is reversed. There the 0
arrived at the *front* and the missing n was at the *back*; here the 0 is at the
back and the missing n is at the front.

## Python does not get the asymmetry

Python never eliminates tail calls, so the property that makes this problem easier
in C++ has nothing to act on. Both recursive forms are genuinely recursive, both
stop at the default recursion limit of 1,000, and they measure almost the same —
per number at n = 20,000:

| | ns |
|---|---|
| Loop | 13.3 |
| Count down, print first | **62.2** |
| Count up, print after | 63.4 |

A slight edge to the one-parameter version, from passing one argument instead of
two, and nothing like the 17.6x separation C++ produces.

## Splitting the range

The same escape from the depth limit is available, with the halves reversed:
print `mid+1..hi` first, then `lo..mid`.

| n | Linear: depth | Range split: depth / calls |
|---|---|---|
| 1,000 | 1,001 | **11** / 1,999 |
| 1,000,000 | crashes | **21** / 1,999,999 |

At Python's default limit of 1,000, printing 1,000,000 down to 1: the linear
version raises `RecursionError` and the range split completes.

It is worth noticing that this is the *third* form in this pair of subtopics whose
two statements swap into the other problem — the halves here run right-then-left
where 1 to N ran left-then-right, and swapping them reverses the whole sequence
exactly.

## Where this goes next

**Sum of First N Numbers** keeps this exact skeleton and changes what happens at
each frame: instead of printing, each call returns a value that its caller uses,
which is the step from recursion that *does* something to recursion that
*computes* something. The descending parameter that turned out to be so convenient
here is the same one that makes `sum(n) = n + sum(n - 1)` read directly.

<!-- @intuition -->
This is the previous problem with the two statements swapped, and the surprise is that swapping them makes the problem easier rather than merely different. Counting downward means the number you are holding is the number you want to print, so you need nothing else — and printing it immediately means the call you make afterwards is the last thing you do, which is exactly the shape a compiler can flatten into a loop. Printing upward cannot have both of those at once: either you carry an index and a limit, or you leave a print waiting behind you. The two problems look like reflections and only one of them lets a single function be both cheap in parameters and cheap in stack.

<!-- @approach -->
### Iteration - The Descending Loop

<!-- @idea -->
Count from n down to one with a loop, printing each value.

<!-- @steps -->
1. Start a counter at n.
2. While the counter is at least one, print the counter.
3. Decrease the counter by one.
4. Stop when the counter falls below one.
5. Use a signed counter, since an unsigned one can never fall below zero.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: Measured 0.354ns per number at -O2 and 13.3ns in Python. The only real hazard is the counter's type: written with an unsigned counter and a condition of i >= 0 the loop never terminates, and neither -Wall nor -Wall -Wextra reported it on this compiler.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printNToOne(int n) {
    for (int i = n; i >= 1; i--) {
        cout << i << " ";
    }
}

// NEVER write this — i >= 0 is always true for an unsigned type:
//     for (size_t i = n; i >= 0; i--)
// Measured: 0 warnings from -Wall and from -Wall -Wextra.
```

<!-- @annotations -->
- 5: int, not size_t or unsigned. The condition i >= 1 would still be reachable, but i >= 0 with an unsigned counter never fails. Writing i >= 1 rather than i > 0 is style: it reads as the intended stopping value, and both are correct for a signed counter.
- 11: Only -Wtautological-unsigned-zero-compare catches this, and it is not in -Wall or -Wextra.

<!-- @code java -->
```java
static void printNToOne(int n) {
    for (int i = n; i >= 1; i--) {
        System.out.print(i + " ");
    }
}
```

<!-- @annotations -->
- 2: Java has no unsigned int, so the loop-forever trap that C++ allows here cannot be written.

<!-- @code python -->
```python
def print_n_to_one(n):
    for i in range(n, 0, -1):
        print(i, end=" ")


# All three arguments are required and each can be wrong alone:
#   range(n, 0)      -> []          step omitted, silently empty
#   range(n, 1, -1)  -> 5 4 3 2     loses the 1
#   range(n, -1, -1) -> 5 4 3 2 1 0 includes 0
```

<!-- @annotations -->
- 2: The stop of 0 is exclusive, which is what makes 1 the last value printed. Forgetting the step is the dangerous one — it produces no output rather than an error.

<!-- @approach -->
### Count Down, Print Before the Call

<!-- @idea -->
Print the current value and then recurse on one less, so the output descends with the parameter.

<!-- @steps -->
1. Take a single parameter n.
2. Check the base case first — if n is zero or less, return without printing.
3. Print n immediately.
4. Call the function with n minus one.
5. Nothing follows that call, so the frame has no reason to survive it.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack as written, O(1) once the tail call is eliminated
- note: The best form either of these two subtopics offers — one parameter and a tail call at the same time, which no version of Print 1 to N achieves. Zero self-calls remain at -O2 and it completed beyond n = 29,996,338 where -O0 dies at 261,000. Measured 0.345ns per number against the loop's 0.354ns, which is the same because by then it is a loop.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printNToOne(int n) {
    if (n <= 0) return;

    cout << n << " ";                // print on the way IN
    printNToOne(n - 1);              // nothing pending after this
}
```

<!-- @annotations -->
- 5: n <= 0, not n < 0. Testing n < 0 lets the zero call print, adding a trailing 0 to the output.
- 7: The parameter is the value, so no second parameter is needed — which is the half of the asymmetry that Print 1 to N cannot have.
- 8: Nothing follows, so this is a tail call and -O2 compiles the function into a loop with zero self-calls remaining. Moving this line above the print turns the function into Print 1 to N — and costs the tail call.

<!-- @code java -->
```java
static void printNToOne(int n) {
    if (n <= 0) return;

    System.out.print(n + " ");
    printNToOne(n - 1);
}
```

<!-- @annotations -->
- 4: The JVM specification forbids tail-call elimination, so Java gets the one-parameter half of the asymmetry and not the stack half.

<!-- @code python -->
```python
def print_n_to_one(n):
    if n <= 0:
        return
    print(n, end=" ")
    print_n_to_one(n - 1)


# Python never eliminates tail calls either, so this stops at the
# default recursion limit of 1,000. Measured 62.2ns per number,
# marginally ahead of the two-parameter form's 63.4ns.
```

<!-- @annotations -->
- 4: Printing before the call is the whole difference from Print 1 to N, where this same line sits below the call instead.

<!-- @approach -->
### Count Up, Print After the Call

<!-- @idea -->
Recurse all the way up to n first, then print on the way back out so the largest value appears first.

<!-- @steps -->
1. Take two parameters, the current index i and the limit n.
2. Check the base case first — if i is greater than n, return.
3. Call the function with i plus one, before printing anything.
4. That call prints everything from n down to i plus one.
5. Print i, which now lands after all the larger values.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack, and it cannot be optimised away
- note: The mirror of the counting-down solution to Print 1 to N, and it inherits both disadvantages at once — two parameters and a print pending after the call. Measured 6.083ns per number against 0.345ns, about 17.6x, and it crashed at 261,000 at both -O0 and -O2. It is worth writing to see that the ascending parameter is what forces the second parameter.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printFrom(int i, int n) {
    if (i > n) return;

    printFrom(i + 1, n);             // go all the way up FIRST
    cout << i << " ";                // then print, on the way out
}

void printNToOne(int n) { printFrom(1, n); }
```

<!-- @annotations -->
- 5: i > n, not i >= n. The stricter test stops one step early and loses n itself — at n = 3 the output is 2 1, missing the value that should have come first.
- 7: Nothing has been printed yet at this point — the chain runs all the way to n before any output appears.
- 8: A statement is pending after the call, so the frame must survive and no tail call elimination is possible.
- 11: The wrapper exists only because the ascending parameter needs a limit to compare against.

<!-- @code java -->
```java
static void printFrom(int i, int n) {
    if (i > n) return;

    printFrom(i + 1, n);
    System.out.print(i + " ");
}

static void printNToOne(int n) { printFrom(1, n); }
```

<!-- @annotations -->
- 4: The deepest frame holds i equal to n, and it resumes first — which is why an ascending parameter yields descending output.

<!-- @code python -->
```python
def print_from(i, n):
    if i > n:
        return
    print_from(i + 1, n)
    print(i, end=" ")


def print_n_to_one(n):
    print_from(1, n)


# Measured 63.4ns per number against 62.2ns for the one-parameter
# version — in Python the two forms are close, because the tail-call
# advantage that separates them in C++ does not exist here.
```

<!-- @annotations -->
- 4: Two arguments per call rather than one, which is the only difference Python can actually charge for.

<!-- @approach -->
### Split the Range

<!-- @idea -->
Print the upper half of the range and then the lower half, halving the depth at each level.

<!-- @steps -->
1. Take the two ends of the range, lo and hi.
2. If lo is greater than hi, there is nothing to print, so return.
3. If lo equals hi, print that single value and return.
4. Otherwise find the midpoint and print the range from mid plus one to hi first.
5. Then print the range from lo to mid, in that order.

<!-- @complexity -->
- time: O(n), with about 2n calls rather than n
- space: O(log n) call stack
- note: Depth falls from 1,001 to 11 at n = 1,000, and is 21 at n = 1,000,000 where the linear versions crash. At Python's default recursion limit of 1,000 it printed 1,000,000 down to 1. The upper half must run first — swapping the two calls reverses the whole sequence exactly, giving Print 1 to N. Costs 2.433ns per number at -O2 against 0.345ns.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printRange(int lo, int hi) {
    if (lo > hi) return;
    if (lo == hi) { cout << lo << " "; return; }

    int mid = lo + (hi - lo) / 2;
    printRange(mid + 1, hi);         // UPPER half first
    printRange(lo, mid);
}

void printNToOne(int n) { printRange(1, n); }
```

<!-- @annotations -->
- 8: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which can overflow for large bounds.
- 9: Upper half first — this is the only line that differs from the Print 1 to N version, and swapping the two calls reverses the entire output.
- 10: lo to mid, not lo to mid - 1. The midpoint belongs to the lower half, since the upper half started at mid + 1.

<!-- @code java -->
```java
static void printRange(int lo, int hi) {
    if (lo > hi) return;
    if (lo == hi) { System.out.print(lo + " "); return; }

    int mid = lo + (hi - lo) / 2;
    printRange(mid + 1, hi);
    printRange(lo, mid);
}

static void printNToOne(int n) { printRange(1, n); }
```

<!-- @annotations -->
- 6: Logarithmic depth means this version does not hit StackOverflowError at any n an int can hold.

<!-- @code python -->
```python
def print_range(lo, hi):
    if lo > hi:
        return
    if lo == hi:
        print(lo, end=" ")
        return
    mid = lo + (hi - lo) // 2
    print_range(mid + 1, hi)
    print_range(lo, mid)


def print_n_to_one(n):
    print_range(1, n)


# At the DEFAULT recursion limit of 1,000 this printed 1,000,000 down
# to 1, where the linear version raised RecursionError.
```

<!-- @annotations -->
- 7: Floor division with //, since a float midpoint would never satisfy lo == hi.
- 8: The upper half first. This pair of lines swapped is the Print 1 to N version, verified to produce the exactly reversed sequence.

<!-- @example -->

<!-- @input -->
n = 3, through the counting-down version

<!-- @output -->
3 2 1 — printed entirely on the way in

<!-- @why -->
The trace that contrasts directly with Print 1 to N: the same descending parameter, and the output appears immediately rather than after the deepest call returns.

<!-- @walkthrough -->
1. printNToOne(3) is called. n is 3, which is not zero, so it prints 3 straight away.
2. It then calls printNToOne(2), which prints 2 immediately and calls printNToOne(1).
3. printNToOne(1) prints 1 and calls printNToOne(0).
4. printNToOne(0) matches the base case and returns without printing.
5. The entire output has already been produced by the time the deepest call is reached.
6. Each frame then returns with nothing left to do, which is exactly why the frames were never needed.
7. Compare Print 1 to N's counting-down version, where the same four frames printed nothing on the way down and everything on the way back.

<!-- @example -->

<!-- @input -->
The one-parameter and tail-recursive forms of both problems

<!-- @output -->
Only Print N to 1 gets both from a single function

<!-- @why -->
The asymmetry is the reason this subtopic is not simply the previous one restated, and it is visible directly in the compiled output rather than argued for.

<!-- @walkthrough -->
1. For Print N to 1, counting down means the parameter is the value to print, so no limit parameter is needed.
2. Printing before the call leaves nothing pending, so the call is in tail position.
3. Counting each function's calls to itself at -O2 gives zero for that version, confirming it became a loop.
4. For Print 1 to N, the one-parameter version must print after the call, which leaves a pending statement and one self-call remains.
5. Its tail-recursive alternative prints before the call but needs an index and a limit, so it takes two parameters.
6. So Print 1 to N offers one property or the other, and Print N to 1 offers both from the same function.
7. Measured, that is worth a depth limit beyond 29,996,338 against 261,000, and 0.345ns per number against 10.972ns.

<!-- @example -->

<!-- @input -->
A descending loop written with an unsigned counter

<!-- @output -->
Never terminates, and no warning from -Wall or -Wall -Wextra

<!-- @why -->
A hazard that exists only when counting downward, and one the compiler's usual warning set does not report — so it is a mistake the ascending version of this problem cannot make and the toolchain will not catch.

<!-- @walkthrough -->
1. Writing for (size_t i = n; i >= 0; i--) looks like the mirror of the ascending loop.
2. An unsigned value can never be negative, so the condition i >= 0 is true on every iteration.
3. When i reaches 0 the decrement wraps it to the largest representable value rather than ending the loop.
4. The ascending equivalent has no such problem, because i < n behaves the same whether i is signed or unsigned.
5. Measured on this compiler: no warning at all with no flags, with -Wall, or with -Wall -Wextra.
6. Only -Wtautological-unsigned-zero-compare reports it, and that flag has to be requested by name.
7. Using a signed counter removes the hazard entirely, which is why the samples here use int.

<!-- @example -->

<!-- @input -->
Both recursive base cases written one step wrong, at n = 3

<!-- @output -->
3 2 1 0 from one mistake, 3 2 from the other

<!-- @why -->
The same two off-by-one errors as the previous subtopic, landing at the opposite end of the output — which is what makes a test that checks only the first value pass one of them.

<!-- @walkthrough -->
1. In the counting-down version the base case must be n <= 0, so the chain stops before reaching zero.
2. Writing n < 0 lets the call holding zero run its print statement.
3. Because that version prints on the way in, the extra 0 appears at the end, giving 3 2 1 0.
4. In Print 1 to N the same mistake put the 0 at the front, because that version printed on the way out.
5. In the counting-up version the base case must be i > n, so that i equal to n still prints.
6. Writing i >= n stops one step early, so the frame holding n never prints — and since that version prints on the way out, the missing value is the one that should have come first, giving 2 1.
7. Checking that the first value printed is n and the last is 1 catches both, where checking either one alone catches only one of them.

<!-- @visualization memory-model -->

<!-- @description -->
The call stack as a column of frames beside an output strip, deliberately reusing the layout from Print 1 to N so the two can be compared directly. Run the counting-down version for n = 3 and let the strip fill as the frames are pushed — 3 appears before the second frame exists, then 2, then 1 — so the whole output is present by the time the base case is reached. Draw each frame with an empty pending-work slot and label it nothing waiting, which is the visual reason the compiler may discard it: as each frame is pushed, fade the one beneath rather than dimming it, showing it is finished rather than suspended. Beside it run the counting-up version on the same input, where the strip stays empty during the ascent and every frame carries a filled pending slot, then fills 3, 2, 1 during the unwind. The two strips end identical while the moments of writing are opposite, exactly as in the previous subtopic — but now with a parameter counter beside each frame showing one value on the left and two on the right. The asymmetry panel is the centre and should be a two-by-two grid rather than a sequence: rows for Print 1 to N and Print N to 1, columns for one-parameter and tail-recursive, with a tick in each cell. Three cells hold a tick against a different function; only the Print N to 1 row has both ticks landing on the same function, which should be highlighted as a single box spanning the row. Under it, the measured consequence: a depth bar reaching 261,000 for three of the four and running off the frame for the fourth, and a timing bar reading 0.345ns beside 10.972ns. Then the loop-hazard panel: a descending counter drawn on a number line stepping toward zero, with a signed track that crosses below zero and stops, and an unsigned track where the value at zero wraps to the far right of the line and continues forever — with three warning-flag chips beneath reading -Wall, -Wall -Wextra and -Wtautological-unsigned-zero-compare, only the last of them lit.

<!-- @sampleInput -->
```json
{"primary":{"n":3,"version":"count down, print before the call","descent":[{"call":"printNToOne(3)","prints":3},{"call":"printNToOne(2)","prints":2},{"call":"printNToOne(1)","prints":1},{"call":"printNToOne(0)","prints":null,"baseCase":true}],"outputCompleteBeforeBaseCase":true,"result":"3 2 1","peakFrames":4,"pendingWorkPerFrame":"none"},"asymmetry":{"grid":[{"problem":"Print 1 to N","oneParameterForm":"count down, print after","tailRecursiveForm":"count up, print before","sameFunction":false},{"problem":"Print N to 1","oneParameterForm":"count down, print before","tailRecursiveForm":"count down, print before","sameFunction":true}],"selfCallsAtO2":[{"fn":"N to 1, count down, print first","params":1,"selfCalls":0},{"fn":"N to 1, count up, print after","params":2,"selfCalls":1},{"fn":"1 to N, count up, print first","params":2,"selfCalls":0},{"fn":"1 to N, count down, print after","params":1,"selfCalls":1}],"reading":"only one row has both a 1 and a 0"},"depth":{"O0":{"countDownPrintFirst":261000,"countUpPrintAfter":261000},"O2":{"countDownPrintFirst":">29,996,338 (compiled to a loop)","countUpPrintAfter":261000},"comparisonWithPrevious":{"oneParamFormOf1toN":{"depthO2":261000,"nsPerNumber":10.972},"oneParamFormOfNto1":{"depthO2":">29,996,338","nsPerNumber":0.345}}},"timing":{"unit":"ns per number","cpp":{"n":100000,"O2":{"loop":0.354,"countDownPrintFirst":0.345,"countUpPrintAfter":6.083,"rangeSplit":2.433},"ratio":17.6},"python":{"n":20000,"loop":13.3,"countDownPrintFirst":62.2,"countUpPrintAfter":63.4,"rangeSplit":132.9,"note":"the two recursive forms are close, because the tail-call advantage does not exist here"}},"loopHazard":{"code":"for (size_t i = n; i >= 0; i--)","reason":"an unsigned value is never negative, so the condition never fails","ascendingEquivalentSafe":true,"warnings":{"none":0,"-Wall":0,"-Wall -Wextra":0,"-Wtautological-unsigned-zero-compare":2}},"pythonRangeTraps":[{"written":"range(n, 0, -1)","atN5":[5,4,3,2,1],"correct":true},{"written":"range(n, 0)","atN5":[],"effect":"step omitted — silently empty"},{"written":"range(n, 1, -1)","atN5":[5,4,3,2],"effect":"loses the 1"},{"written":"range(n, -1, -1)","atN5":[5,4,3,2,1,0],"effect":"includes 0"}],"offByOne":[{"written":"n < 0","shouldBe":"n <= 0","atN3":"3 2 1 0","effect":"trailing 0","comparedWith1toN":"there the extra 0 appeared at the FRONT"},{"written":"i >= n","shouldBe":"i > n","atN3":"2 1","effect":"loses n itself, from the FRONT","comparedWith1toN":"there the same mistake dropped n from the BACK"}],"rangeSplit":{"upperHalfFirst":true,"swappingHalvesGives":"Print 1 to N — the sequence reversed exactly","atN1000":{"depth":11,"calls":1999},"atN1000000":{"depth":21,"calls":1999999},"pythonDefaultLimit":{"limit":1000,"n":1000000,"linear":"RecursionError","rangeSplit":"completed"}}}
```

<!-- @highlights -->
- The stack column and output strip reuse the layout from Print 1 to N, so the two subtopics can be compared directly.
- Running the counting-down version for n = 3, the strip fills as frames are pushed — 3 appears before the second frame even exists.
- The whole output is present by the time the base case is reached, which is the opposite of the previous subtopic.
- Each frame carries an empty pending-work slot labelled nothing waiting.
- Finished frames fade rather than dim, showing they are complete rather than suspended — the visual reason a compiler may discard them.
- The counting-up version runs alongside with a filled pending slot in every frame and an empty strip during the ascent.
- Both strips end identical while the moments of writing are opposite, with a parameter counter reading one on the left and two on the right.
- The asymmetry panel is a two-by-two grid: rows for the two problems, columns for one-parameter and tail-recursive.
- Three ticks land on different functions; only the Print N to 1 row has both ticks on the same function.
- That row is highlighted as a single box spanning both columns.
- Beneath it a depth bar reaches 261,000 for three of the four and runs off the frame for the fourth.
- A timing bar reads 0.345ns beside 10.972ns — the one-parameter form of each problem.
- The loop-hazard panel draws a descending counter on a number line stepping toward zero.
- The signed track crosses below zero and stops; the unsigned track wraps from zero to the far right and continues forever.
- Three warning-flag chips sit beneath: -Wall, -Wall -Wextra and -Wtautological-unsigned-zero-compare.
- Only the last chip is lit, because the first two reported nothing.

<!-- @edgeCases -->
- n equal to zero — nothing is printed, and the base case must not let a 0 escape.
- n equal to one — the only non-empty size where ascending and descending output are identical, so it cannot distinguish this from Print 1 to N.
- n equal to two — the smallest input that separates the two problems.
- Negative n — the base cases n <= 0 and i > n both stop immediately.
- The base case written as n < 0 — prints a trailing 0, giving 3 2 1 0 for n = 3.
- The base case written as i >= n — loses n from the front, giving 2 1 for n = 3.
- An unsigned loop counter with the condition i >= 0 — never terminates, and is not reported by -Wall or -Wextra.
- Python's range with the step omitted — produces an empty sequence and no error at all.
- n around 261,000 in C++ — where the two-parameter version exhausts the stack even at -O2.
- n above 1,000 in Python — the default recursion limit, which stops both linear versions but not the range split.
- The two halves of the range split run in the wrong order — the sequence comes out exactly reversed, which is Print 1 to N.

<!-- @pitfalls -->
- Using an unsigned loop counter with i >= 0. The condition can never fail, and measured on this compiler neither -Wall nor -Wall -Wextra reported it.
- Omitting the step in Python's range. range(n, 0) produces an empty sequence silently, so the function prints nothing and raises nothing.
- Writing range(n, 1, -1), which stops before 1 and loses the last number.
- Writing range(n, -1, -1), which runs one step too far and prints a trailing 0.
- Writing the base case as n < 0 in the counting-down version, which prints a trailing 0.
- Writing the base case as i >= n in the counting-up version, which loses n itself — giving 2 1 for n = 3.
- Testing only at n = 1. Ascending and descending output are identical there, so it cannot distinguish this problem from Print 1 to N.
- Checking only the first value printed. One off-by-one damages the front of the output and the other damages the back, so each test catches one of them.
- Assuming this problem is exactly as hard as Print 1 to N. Here one function is both one-parameter and tail-recursive, which no version of that problem manages.
- Reaching for the two-parameter counting-up form. It inherits both disadvantages, measured 6.083ns per number against 0.345ns and crashing at 261,000 even at -O2.
- Relying on the tail-call advantage outside C++. Java forbids the optimisation and Python never performs it, so both languages get only the one-parameter half.
- Swapping the two halves in the range split. The sequence comes out exactly reversed, which is Print 1 to N rather than a scrambled order.

<!-- @doubt -->
### Isn't this just Print 1 to N with the lines swapped?

<!-- @answer -->
The code is, and the consequences are not. Both problems have a one-parameter form and a tail-recursive form, but only here are they the same function. Counting down means the parameter is already the value to print, so no limit is needed, and printing before the call leaves nothing pending, so it is a tail call. For Print 1 to N you get one property or the other: the one-parameter version prints after the call and keeps its frames, while the tail-recursive version needs an index and a limit. Measured, that is worth a depth beyond 29,996,338 against 261,000 and 0.345ns per number against 10.972ns.

<!-- @doubt -->
### Which of the two recursive forms should I write?

<!-- @answer -->
Count down and print before the call. It takes one parameter, it is a tail call, and at -O2 it compiles to a loop with zero self-calls remaining — measured 0.345ns per number against the plain loop's 0.354ns, which is the same because it has become one. The counting-up alternative needs a second parameter and leaves a print pending, so it measured 6.083ns and crashed at 261,000 even with optimisation. The only reason to write the counting-up version is to see why an ascending parameter forces the second parameter.

<!-- @doubt -->
### Why does the unsigned loop never end?

<!-- @answer -->
Because an unsigned value cannot be negative, so i >= 0 is true on every iteration and the loop has no exit. When i reaches zero the decrement wraps it to the largest representable value rather than terminating anything. This trap exists only when counting downward — the ascending condition i < n behaves identically whether i is signed or unsigned. What makes it worth stating is that the compiler is quiet about it: measured on this compiler there were no warnings with no flags, with -Wall, or with -Wall -Wextra, and only -Wtautological-unsigned-zero-compare reported it.

<!-- @doubt -->
### What are the ways to get Python's range wrong here?

<!-- @answer -->
Three, and each one is silent. range(n, 0, -1) is correct and gives 5 4 3 2 1 at n = 5. Omitting the step entirely, as range(n, 0), produces an empty sequence — the function prints nothing and raises nothing, which is the worst of the three. Writing range(n, 1, -1) stops before 1 and loses the last number. Writing range(n, -1, -1) runs one step too far and prints a trailing 0. Counting upward needs only range(1, n + 1), where the single natural mistake is dropping the plus one.

<!-- @doubt -->
### Why do the off-by-one mistakes show up at the other end of the output?

<!-- @answer -->
Because the emission order is reversed. In Print 1 to N the counting-down version printed on the way out, so the frame holding zero emitted first and a base case of n < 0 put a spurious 0 at the front. Here that version prints on the way in, so the zero frame emits last and the same mistake puts the 0 at the end. The same applies to an i >= n base case: there it dropped n from the back of the output, and here it drops n from the front, giving 2 1 for n = 3. The practical consequence is that a test checking only the first number printed catches one of these two errors and not the other — check that the first is n and the last is 1.

<!-- @doubt -->
### Does Python get the same advantage from counting down?

<!-- @answer -->
Only half of it. Python never eliminates tail calls, deliberately, so the property that makes this problem so much easier in C++ has nothing to act on — both forms are genuinely recursive and both stop at the default recursion limit of 1,000. What survives is the parameter count, and that is worth very little: measured 62.2ns per number for the one-parameter version against 63.4ns for the two-parameter one, where C++ separates the same pair by 17.6x. Java is in the same position, since its specification forbids the optimisation.

<!-- @doubt -->
### How do I get past the depth limit?

<!-- @answer -->
Split the range instead of stepping through it. Printing n down to 1 is also "print the upper half, then print the lower half", and each split roughly halves what remains, so the deepest chain is about log base 2 of n. Measured, the depth falls from 1,001 to 11 at n = 1,000 and is 21 at a million. At Python's default recursion limit of 1,000 that version printed 1,000,000 down to 1 where the linear version raised RecursionError. It costs about twice the calls and measured 2.433ns per number against 0.345ns.

<!-- @doubt -->
### What happens if I swap the two halves in the range split?

<!-- @answer -->
You get Print 1 to N, exactly — the sequence reversed rather than scrambled, verified for every n tested including sizes that are not powers of two. That makes it the third form across these two subtopics whose two statements swap into the other problem, alongside the counting-up and counting-down linear versions. It is a useful thing to notice: in each case the recursion is not being changed, only the order in which two independent pieces of work are performed, and that order is what the output direction is made of.

<!-- @doubt -->
### Should I use recursion for this at all?

<!-- @answer -->
For the output, no — a descending loop is shorter and has no depth limit, and it is the version where the only real risk is choosing the wrong counter type. What this problem is genuinely for is the asymmetry: two problems that look like exact reflections, where one admits a single function with both desirable properties and the other does not. Recognising that the direction of a parameter can decide whether a second parameter is needed, and whether the recursive call ends up in tail position, is what transfers.

<!-- @doubt -->
### What does this lead into?

<!-- @answer -->
Sum of First N Numbers, which keeps this skeleton and changes what each frame does. Instead of printing and discarding, each call returns a value that its caller adds to — the step from a recursion that performs an action to one that computes a result. The descending parameter that turned out so convenient here is the same one that makes sum(n) = n + sum(n - 1) read directly off the definition, and the base case moves from "print nothing" to "return zero", which is where the identity element of the operation starts to matter.
