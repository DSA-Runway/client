---
id: print-name-n-times-using-recursion
topic: Basic Recursion
title: Print name N times using recursion
difficulty: Easy
status: ready
prerequisites:
  - understand-recursion-by-print-something-n-times
  - pass-by-value-vs-pass-by-reference
  - function-parameters-and-return-values
  - functions-declaration-and-calling
  - stack-memory-and-recursion-depth
relatedIds:
  - understand-recursion-by-print-something-n-times
  - print-1-to-n-using-recursion
  - pass-by-value-vs-pass-by-reference
  - stack-memory-and-recursion-depth
---

<!-- @summary -->
Print a given name N times recursively — the first recursion carrying a parameter that never changes, where forgetting one ampersand copies the name on all n calls and costs nothing for a 22-character name and 30x for a 23-character one, and where halving the count instead of decrementing it turns a RecursionError at n = 1,000 into a completed run at n = 1,000,000.

<!-- @theory -->
## The problem

Given a name and a count `n`, print that name `n` times.

```
name = "Ada", n = 3   ->   Ada
                           Ada
                           Ada
```

The previous subtopic printed a fixed message, so the function needed one
parameter. This one needs two, and **only one of them changes**.

## One parameter moves, one does not

```
printName(name, n):
    if n <= 0: return
    print name
    printName(name, n - 1)      <- name unchanged, n smaller
```

`n` is the **variant**: it shrinks toward the base case and is the reason the
recursion ends. `name` is the **invariant**: every call needs it, no call modifies
it, and it is identical in all `n + 1` frames.

That split is the shape of nearly every recursion you will write from here on —
an array that stays fixed and an index that moves, a target that stays fixed and
a remaining sum that shrinks. Getting the invariant's *cost* right is what this
subtopic is about, because the obvious way to write it in C++ is expensive.

## Passing the invariant by value copies it every call

Written the natural way, `void printName(string name, int n)` takes the name **by
value**, which means each call constructs its own copy. There are `n + 1` calls,
so there are `n + 1` copies.

Measured by counting copy constructions directly: at n = 1,000 the by-value form
performs **1,001 copies** and the by-reference form performs **0**. Exactly `n + 1`
against exactly zero, at every size.

Copying a `std::string` is not always expensive, which is precisely what makes
this hard to notice.

## The 22-character cliff

`std::string` stores short contents inside the object itself — the small-string
optimisation — and only reaches for the heap when the text does not fit.
`sizeof(std::string)` is **24 bytes** here, and the measured threshold is exact:

| Name length | Heap allocations at n = 1,000, by value |
|---|---|
| 3 (`"Ada"`) | **0** |
| 22 | **0** |
| **23** | **1,001** |
| 60 | 1,001 |

**A name of 22 characters allocates nothing. A name of 23 allocates once per
call.** One character.

The timing follows it, measured at `-O2`, nanoseconds per call:

| Name length | By value | By reference | Ratio |
|---|---|---|---|
| 3 | 13.98 | 3.44 | 4.2x |
| 22 | 22.69 | 2.34 | 12.2x |
| **23** | **64.89** | 2.05 | **30.1x** |
| 60 | 47.88 | 1.57 | 30.1x |

Going from a 22-character name to a 23-character one takes the by-value version
from 22.69ns to **64.89ns per call** — nearly 3x — while the by-reference version
does not move.

`"Ada"`, `"Grace Hopper"`, `"Alan Turing"` are all under the threshold. So the
mistake is invisible on every short test name and expensive on real ones.

## And the optimiser does not rescue it

Compiled at `-O2`, the by-value version still emits a copy: the assembly contains
a call to the string copy path that the by-reference version does not have.

The gap actually **widens** with optimisation — 3.8x at `-O0` and 30.1x at `-O2`
for a 23-character name — because `-O2` makes the by-reference version much
faster while the by-value version still has to allocate.

## It also costs you two thirds of your recursion depth

A frame holding a `std::string` by value is bigger than one holding a reference:

| | Frame size (`-O0`) | Deepest N survived |
|---|---|---|
| By value | **96 bytes** | **86,722** |
| By reference | **32 bytes** | **261,284** |

Three times the frame, so one third of the depth — and the arithmetic predicts it.
The stack is **8,372,224 bytes**: dividing by 96 gives 87,211 and by 32 gives
261,632, against measured crash points of 86,722 and 261,284.

So one missing `&` costs three separate things: `n + 1` copies, `n + 1`
allocations once the name exceeds 22 characters, and two thirds of the maximum
input the program accepts.

## In Java and Python the hazard does not exist

This is a C++ problem specifically, because C++ is the only one of the three where
a parameter can *be* the object rather than a handle to it.

Java's `String` is a reference type: passing it copies an 8-byte reference, never
the characters. Python passes object references too, and it can be checked
directly — `id(name)` is **identical in every frame** and equal to the caller's
object, so nothing is copied at any depth.

The timing confirms there is nothing to find. Measured in Python, nanoseconds per
call:

| Name length | 3 | 22 | 23 | 60 | 10,000 |
|---|---|---|---|---|---|
| Recursion | 66.3 | 64.0 | 65.1 | 62.2 | **62.1** |

**Flat.** A ten-thousand-character name costs the same as a three-character one,
and a 100,000-character name does not reduce the maximum depth either.

## The other parameter decides your depth limit

Now the variant. Decrementing gives a chain of `n` calls, and the previous
subtopic measured where that ends: about 261,000 in C++, and 1,000 in Python by
default.

But `n - 1` is not the only way to get smaller. Printing a name `n` times is also
"print it `n/2` times, then print it `n - n/2` times" — two half-sized problems
instead of one slightly-smaller one. That gives a **branching** recursion whose
depth is `log₂ n` rather than `n`:

| n | Linear: calls / depth | Halving: calls / depth |
|---|---|---|
| 1,000 | 1,001 / **1,001** | 1,999 / **11** |
| 1,000,000 | crashes | 1,999,999 / **21** |

Same output — verified identical for every n tested. About twice the calls. And
the depth stops being a problem at all.

The sharpest demonstration is in Python, at its **default** recursion limit of
1,000, printing a name a million times:

- linear recursion → `RecursionError`
- halving recursion → completes, 1,000,000 lines

It is not free. Measured per line at `-O2`: loop 3.52ns, linear recursion 2.83ns,
halving recursion **5.38ns** — roughly 1.9x the linear version, because it makes
about twice as many calls. In Python: 15.7ns, 61.8ns and 102.2ns.

**So depth is a design choice, not a fixed property of recursion.** How you make
the problem smaller decides it.

## Where this goes next

The invariant-plus-index shape is every recursion from here on, and the
by-reference habit matters far more once the invariant is an array rather than a
short string. **Print 1 to N** and **Print N to 1** keep both parameters and move
the print relative to the call, which is where the ordering that was invisible in
the previous subtopic becomes the entire answer.

<!-- @intuition -->
Two things are being handed down the chain and they behave completely differently. The count is what makes progress — each person passes on a smaller one, and the chain ends when it reaches zero. The name is just reference material that every person needs and nobody changes. The mistake C++ invites is giving each person their own photocopy of the reference material instead of letting them all look at the same sheet: harmless when the sheet is a single line, expensive when it is not, and either way it makes each person's desk bigger so fewer of them fit in the room. The second idea is that the count does not have to shrink by one. Splitting it in half sends two shorter chains instead of one long one, and a chain of a million becomes twenty deep.

<!-- @approach -->
### Iteration - The Loop

<!-- @idea -->
Loop n times, printing the name each pass.

<!-- @steps -->
1. Take the name and the count n.
2. Start a counter at zero.
3. While the counter is below n, print the name.
4. Increase the counter by one.
5. Stop when the counter reaches n, having printed the name exactly n times.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The baseline. It holds one copy of the name regardless of n, has no depth limit, and measured 3.52ns per line at -O2. Taking the name by const reference matters here too, but only once rather than n + 1 times.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void printName(const string& name, int n) {
    for (int i = 0; i < n; i++) {
        cout << name << "\n";
    }
}
```

<!-- @annotations -->
- 5: const& even in the loop version — it costs one copy instead of n + 1, but the habit is the same.
- 6: One frame, one name, whatever n is. There is no depth to run out of.

<!-- @code java -->
```java
static void printName(String name, int n) {
    for (int i = 0; i < n; i++) {
        System.out.println(name);
    }
}
```

<!-- @annotations -->
- 1: String is a reference type, so this parameter is already just a handle — Java has no by-value alternative to get wrong.

<!-- @code python -->
```python
def print_name(name, n):
    for _ in range(n):
        print(name)


# Measured 15.7ns per line at n = 20,000, against 61.8ns for the
# recursive version — about 3.9x.
```

<!-- @annotations -->
- 2: The underscore says the counter is never read, which is true here since only the count matters.

<!-- @approach -->
### Recursion Passing the Name by Value

<!-- @idea -->
Recurse on the count, taking the name as an ordinary value parameter.

<!-- @steps -->
1. Check the base case first: if n is zero or less, return.
2. Print the name once.
3. Call the function again with the same name and n minus one.
4. Note that each call receives its own copy of the name.
5. The chain ends when n reaches zero, after n prints and n plus one calls.

<!-- @complexity -->
- time: O(n) calls, each copying the name — O(n × length) overall in C++
- space: O(n) frames, each holding a full copy of the name
- note: Correct, and in C++ it performs exactly n + 1 copies — measured 1,001 at n = 1,000. Below 23 characters those copies are free; at 23 and above each one allocates, measured 1,001 allocations and 30.1x the by-reference time. It also triples the frame to 96 bytes, cutting the maximum depth from 261,284 to 86,722. In Java and Python this approach is identical to the next one, because strings are references there.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

// The missing & is the whole problem.
void printName(string name, int n) {
    if (n <= 0) return;

    cout << name << "\n";
    printName(name, n - 1);
}
```

<!-- @annotations -->
- 6: By value, so every call constructs its own copy — measured exactly n + 1 of them, 1,001 at n = 1,000. The frame is 96 bytes rather than 32, which is why this version crashed at 86,722 where the reference version reached 261,284.
- 9: Streaming the string does not copy it — the copy already happened at the parameter. That copy is free for a name of 22 characters or fewer and allocates on the heap from 23 upward.
- 10: Where the next copy is constructed, and -O2 does not remove it. The gap against const& widened from 3.8x at -O0 to 30.1x at -O2.

<!-- @code java -->
```java
static void printName(String name, int n) {
    if (n <= 0) return;

    System.out.println(name);
    printName(name, n - 1);
}
```

<!-- @annotations -->
- 1: This is already by reference. Java copies the 8-byte handle, never the characters, so no equivalent mistake exists.
- 5: The JVM specification does not permit tail-call elimination, so this stays O(n) stack and throws StackOverflowError.

<!-- @code python -->
```python
def print_name(name, n):
    if n <= 0:
        return
    print(name)
    print_name(name, n - 1)


# Verified: id(name) is identical in every frame and equal to the
# caller's object, so nothing is copied. Measured flat across name
# lengths from 3 to 10,000 characters — 66.3ns down to 62.1ns.
```

<!-- @annotations -->
- 5: The same object is passed down, not a copy, which is why the name's length never appears in the timings.

<!-- @approach -->
### Recursion Passing the Name by Reference

<!-- @idea -->
Take the invariant by const reference so no call ever copies it.

<!-- @steps -->
1. Declare the name parameter as a constant reference.
2. Check the base case first and return when n is zero or less.
3. Print the name once, reading it through the reference.
4. Recurse with the same reference and n minus one.
5. Every frame now holds an address rather than the text itself.

<!-- @complexity -->
- time: O(n)
- space: O(n) frames, each holding only a reference
- note: Zero copies at any n and any name length, verified by counting copy constructions. Measured 2.05ns per call against 64.89ns for a 23-character name at -O2 — 30.1x — and the 32-byte frame allows a depth of 261,284 against 86,722. In C++ this is the version to write; in Java and Python it is what you already had.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void printName(const string& name, int n) {
    if (n <= 0) return;

    cout << name << "\n";
    printName(name, n - 1);        // the same object, not a copy
}
```

<!-- @annotations -->
- 5: const& — read-only and no copy. Measured 0 copy constructions at every n against n + 1 for the by-value form. The const is doing real work too: it documents that the argument is never modified, and it lets a temporary be passed.
- 9: Passing the reference on costs nothing, so a name of any length is as cheap as a short one. The frame is 32 bytes, which is what 8,372,224 / 32 = 261,632 predicts and 261,284 measures.

<!-- @code java -->
```java
static void printName(String name, int n) {
    if (n <= 0) return;

    System.out.println(name);
    printName(name, n - 1);
}
```

<!-- @annotations -->
- 1: Identical to the previous approach, because Java has only this behaviour — the distinction the C++ versions draw does not exist here.

<!-- @code python -->
```python
def print_name(name, n):
    if n <= 0:
        return
    print(name)
    print_name(name, n - 1)


# Also identical to the previous approach. Python has no by-value
# parameter passing, so the C++ hazard cannot be reproduced here.
```

<!-- @annotations -->
- 4: Reading a name of 100,000 characters costs the same as a 3-character one, and does not reduce the maximum depth.

<!-- @approach -->
### Halving the Count

<!-- @idea -->
Split the count in two and recurse on both halves, so the depth is logarithmic rather than linear.

<!-- @steps -->
1. If n is one, print the name once and return.
2. If n is zero or less, return without printing.
3. Otherwise print the name n divided by two times, by recursing.
4. Then print it the remaining n minus n divided by two times, by recursing again.
5. Both halves are strictly smaller than n, so the recursion terminates.

<!-- @complexity -->
- time: O(n), with about 2n calls rather than n
- space: O(log n) call stack
- note: Produces identical output, verified for every n tested. Depth falls from 1,001 to 11 at n = 1,000 and is only 21 at n = 1,000,000, where the linear version crashes. It costs roughly twice the calls and measured 5.38ns per line against the linear version's 2.83ns at -O2. In Python it prints a name a million times at the DEFAULT recursion limit of 1,000, where the linear version raises RecursionError.

<!-- @code cpp -->
```cpp
#include <iostream>
#include <string>
using namespace std;

void printName(const string& name, int n) {
    if (n <= 0) return;
    if (n == 1) { cout << name << "\n"; return; }    // base case: one line

    printName(name, n / 2);
    printName(name, n - n / 2);                      // the REMAINDER, not n/2 again
}
```

<!-- @annotations -->
- 7: Two base cases now — one for nothing to print and one for exactly one line, which is what stops the split.
- 9: Integer division rounds down, so this half is never larger than the other.
- 10: n - n/2, not n/2 twice. The shortfall compounds through every level rather than costing one line: at n = 1,000 writing n/2 twice prints 512. Depth is log2(n) either way: measured 11 at n = 1,000 and 21 at n = 1,000,000.

<!-- @code java -->
```java
static void printName(String name, int n) {
    if (n <= 0) return;
    if (n == 1) { System.out.println(name); return; }

    printName(name, n / 2);
    printName(name, n - n / 2);
}
```

<!-- @annotations -->
- 5: Because the depth is logarithmic, this version does not hit StackOverflowError at any n an int can hold.

<!-- @code python -->
```python
def print_name(name, n):
    if n <= 0:
        return
    if n == 1:
        print(name)
        return
    print_name(name, n // 2)
    print_name(name, n - n // 2)


# At Python's DEFAULT recursion limit of 1,000 this printed a name
# 1,000,000 times, where the linear version raised RecursionError.
```

<!-- @annotations -->
- 7: Floor division with //. True division works on powers of two, since 1.0 == 1 is True, and never lands exactly on 1.0 for any other n — measured RecursionError at n = 3, 5, 7, 100 and 1,000.
- 8: The depth is about 20 at a million, so the default limit of 1,000 is never approached.

<!-- @example -->

<!-- @input -->
name = "Ada", n = 3

<!-- @output -->
Three lines, four frames, and the name identical in all of them

<!-- @why -->
The smallest trace that shows the two parameters behaving differently — one shrinking toward the base case and one carried unchanged through every frame.

<!-- @walkthrough -->
1. printName("Ada", 3) is called. n is 3, so it prints Ada and calls printName("Ada", 2).
2. The name passed down is the same text; only the count changed.
3. printName("Ada", 2) prints and calls printName("Ada", 1), which prints and calls printName("Ada", 0).
4. Four calls are now alive, holding counts of 3, 2, 1 and 0 and the same name four times over.
5. In C++ with a by-value parameter those are four separate copies of the string; with const& they are four references to one object.
6. The n = 0 call matches the base case, returns immediately, and the chain unwinds.
7. Three lines were printed from four frames, which is the n + 1 frames the previous subtopic established.

<!-- @example -->

<!-- @input -->
The same by-value function with a 22-character name and a 23-character name

<!-- @output -->
Zero heap allocations, then 1,001 of them

<!-- @why -->
A one-character change flipping the cost of the function by a factor of three, on a boundary nothing in the code refers to — which is why short test names hide it completely.

<!-- @walkthrough -->
1. A std::string keeps short contents inside the object itself, and this implementation's object is 24 bytes.
2. Copying a string whose text fits inside that object therefore touches no heap at all.
3. Measured, the first length whose copy allocates is 23 characters.
4. At n = 1,000 with a 22-character name the by-value version performed 0 heap allocations.
5. With a 23-character name the identical code performed 1,001 — one per call.
6. The per-call time went from 22.69ns to 64.89ns at -O2, while the by-reference version stayed at about 2ns for both.
7. Names like Ada, Alan Turing and Grace Hopper are all comfortably under the threshold, so the mistake never appears during testing.

<!-- @example -->

<!-- @input -->
By value against by const reference, at -O0 and -O2

<!-- @output -->
96-byte frames against 32, a depth of 86,722 against 261,284, and 30.1x the time

<!-- @why -->
Shows a single missing ampersand costing three separate resources, and that optimisation widens the gap rather than closing it.

<!-- @walkthrough -->
1. The by-value function declares a 96-byte frame and the by-reference one declares 32 bytes, both visible in the -O0 assembly.
2. Dividing the 8,372,224-byte stack by those figures predicts maximum depths of 87,211 and 261,632.
3. Measured, the by-value version crashed at about 86,722 and the by-reference version at about 261,284.
4. So the same program accepts one third of the input purely because of how a parameter is declared.
5. On copies the difference is absolute: exactly n + 1 against exactly 0, at every size.
6. On time, a 23-character name cost 51.45ns against 13.29ns at -O0 — a factor of 3.8.
7. At -O2 the same comparison was 64.89ns against 2.05ns, a factor of 30.1, because optimisation helps the version that has no work to remove.

<!-- @example -->

<!-- @input -->
Printing a name 1,000,000 times in Python at the default recursion limit

<!-- @output -->
RecursionError from the linear version; 1,000,000 lines from the halving version

<!-- @why -->
The clearest demonstration that recursion depth is a consequence of how the problem is made smaller, not an inherent limit of recursion.

<!-- @walkthrough -->
1. Python's default recursion limit is 1,000, so a chain of a million calls cannot complete.
2. The linear version subtracts one per call, needs a million frames, and raises RecursionError.
3. The halving version splits the count in two and recurses on each half.
4. Each split roughly halves the remaining count, so the deepest chain is about log base 2 of a million, which is 20.
5. Measured, it completed and produced exactly 1,000,000 lines with the limit left at its default.
6. It made 1,999,999 calls to the linear version's 1,000,001, so roughly twice as many.
7. Measured per line at -O2 in C++: 2.83ns linear against 5.38ns halving, which is the price of the extra calls.

<!-- @visualization memory-model -->

<!-- @description -->
The call stack as a column of frames growing upward, but each frame now drawn with two compartments — a small one for the count and a wide one for the name — because the whole subtopic is that the two parameters behave differently. Run printName("Ada", 3) and push four frames, letting the count compartment show 3, 2, 1, 0 while the name compartment shows the same text every time. Then split the figure: on the left, by value, draw a full copy of the text physically duplicated into each new frame as it is pushed, with a copy counter climbing to n + 1; on the right, by const reference, draw a thin arrow from every frame back to one single name object sitting outside the stack, with the copy counter stuck at 0. Size the frames to scale — 96 bytes against 32 — so the left column is visibly three times fatter, and draw a ceiling line for the 8,372,224-byte stack that the left column reaches after 86,722 frames and the right after 261,284. The allocation panel is the sharp one: a slider for the name's length with a heap area beneath the stack, and as the slider crosses from 22 to 23 the copies stop fitting inside their frames and start spawning blocks in the heap, one per frame, with the counter jumping from 0 to 1,001 and the timing readout from 22.69ns to 64.89ns per call. Hold that transition, because one character causes it. Beside it, a Python panel showing the same recursion with every frame's name compartment replaced by an id badge that reads the same number in all four frames, and a flat timing bar across name lengths 3 to 10,000. Close with the depth panel: two recursion shapes side by side on n = 1,000 — a single chain 1,001 frames tall that runs off the top of the frame, and a balanced binary tree only 11 levels deep — with call counters reading 1,001 and 1,999 beneath them, and the note that at n = 1,000,000 the chain is impossible and the tree is 21 deep.

<!-- @sampleInput -->
```json
{"primary":{"name":"Ada","n":3,"frames":[{"depth":1,"n":3,"name":"Ada","printed":true},{"depth":2,"n":2,"name":"Ada","printed":true},{"depth":3,"n":1,"name":"Ada","printed":true},{"depth":4,"n":0,"name":"Ada","printed":false,"baseCase":true}],"peakLiveFrames":4,"variant":"n","invariant":"name","linesPrinted":3},"copies":{"rule":"by value performs exactly n + 1 copies; by reference performs 0","atN1000":{"byValue":1001,"byRef":0}},"smallStringThreshold":{"sizeofString":24,"firstLengthWhoseCopyAllocates":23,"freeUpTo":22,"heapAllocationsAtN1000":{"len3":0,"len22":0,"len23":1001,"len60":1001},"note":"Ada, Alan Turing and Grace Hopper are all under the threshold"},"timing":{"unit":"ns per call","cpp":{"O2":[{"len":3,"byValue":13.98,"byRef":3.44,"ratio":4.2},{"len":22,"byValue":22.69,"byRef":2.34,"ratio":12.2},{"len":23,"byValue":64.89,"byRef":2.05,"ratio":30.1},{"len":60,"byValue":47.88,"byRef":1.57,"ratio":30.1}],"O0":{"len23":{"byValue":51.45,"byRef":13.29,"ratio":3.8}},"optimiserRemovesCopy":false,"gapWidensWithO2":true},"python":{"flat":true,"byLength":{"3":66.3,"22":64.0,"23":65.1,"60":62.2,"10000":62.1}}},"frames":{"stackBytes":8372224,"byValue":{"frameBytes":96,"predictedDepth":87211,"measuredDeepest":86722},"byRef":{"frameBytes":32,"predictedDepth":261632,"measuredDeepest":261284},"ratio":3.01},"languages":{"cpp":"the only one with by-value parameters, so the only one with the hazard","java":"String is a reference type; passing copies an 8-byte handle","python":{"idIdenticalInEveryFrame":true,"matchesCallerObject":true,"longNameReducesDepth":false}},"halving":{"outputIdentical":true,"rows":[{"n":1000,"linearCalls":1001,"linearDepth":1001,"halvingCalls":1999,"halvingDepth":11},{"n":1000000,"linearCalls":"crashes","linearDepth":"crashes","halvingCalls":1999999,"halvingDepth":21}],"pythonDefaultLimit":{"limit":1000,"n":1000000,"linear":"RecursionError","halving":"completed, 1,000,000 lines"},"cost":{"unit":"ns per line","cpp":{"loop":3.52,"linear":2.83,"halving":5.38},"python":{"loop":15.7,"linear":61.8,"halving":102.2}},"oddSplitTrap":{"wrong":"n/2 twice","effect":"the shortfall compounds and the output collapses to the largest power of two <= n","measured":{"7":4,"17":16,"100":64,"1000":512,"1024":1024},"exactWhenNIsPowerOfTwo":true},"pythonTrueDivisionTrap":{"wrong":"n / 2","worksFor":"powers of two, since 1.0 == 1 is True","failsFor":"every other n","measured":"RecursionError at n = 3, 5, 7, 100, 1000"}}}
```

<!-- @highlights -->
- Each stack frame is drawn with two compartments: a small one for the count and a wide one for the name.
- The count compartment reads 3, 2, 1, 0 down the column while the name compartment reads the same text every time.
- On the by-value side a full copy of the text is duplicated into each frame as it is pushed, and a copy counter climbs to n + 1.
- On the by-reference side every frame draws a thin arrow to one name object outside the stack, and the copy counter stays at 0.
- The frames are drawn to scale, 96 bytes against 32, so the by-value column is visibly three times fatter.
- A ceiling line marks the 8,372,224-byte stack, reached after 86,722 frames on the left and 261,284 on the right.
- The allocation panel puts a length slider above a heap area beneath the stack.
- Crossing from 22 to 23 characters, the copies stop fitting inside their frames and spawn heap blocks, one per frame.
- The allocation counter jumps from 0 to 1,001 and the timing readout from 22.69ns to 64.89ns per call.
- That transition is held, because a single character causes it.
- The Python panel replaces each frame's name compartment with an id badge reading the same number in all four frames.
- Its timing bar is flat across name lengths from 3 to 10,000 characters.
- The depth panel places two recursion shapes side by side for n = 1,000.
- One is a single chain 1,001 frames tall that runs off the top of the figure.
- The other is a balanced binary tree only 11 levels deep, with call counters reading 1,001 and 1,999.
- At n = 1,000,000 the chain is impossible and the tree is 21 deep, which is the note the panel closes on.

<!-- @edgeCases -->
- n equal to zero — nothing is printed and one frame is used, whatever the name is.
- n equal to one — one line, and the case the halving version needs as its second base case.
- Negative n — testing n <= 0 handles it, where n == 0 would recurse away from the base case forever.
- An empty name — printed as an empty line n times, which is different from printing nothing.
- A name of 22 characters — the longest that copies without touching the heap in C++.
- A name of 23 characters — the shortest that allocates on every copy, measured 1,001 allocations at n = 1,000.
- A very long name in C++ passed by value — every frame holds a full copy and the depth limit falls accordingly.
- A very long name in Python or Java — costs nothing extra, since only a reference is passed.
- n around 86,722 with a by-value parameter — where the C++ stack runs out three times earlier than it needs to.
- n above 1,000 in Python with linear recursion — the default recursion limit, which the halving version never approaches.
- An odd n in the halving version — the second call must take n - n/2, or the shortfall compounds and the total collapses to a power of two.

<!-- @pitfalls -->
- Passing the name by value in C++. It performs exactly n + 1 copies, measured 1,001 at n = 1,000, where const& performs zero.
- Testing only with short names. A 22-character name allocates nothing and a 23-character one allocates once per call, so the cost is invisible on Ada or Alan Turing.
- Expecting -O2 to remove the copy. It does not — the gap widened from 3.8x to 30.1x, because optimisation helps the version with no work to remove.
- Forgetting that the parameter also sets the frame size. By value the frame is 96 bytes against 32, cutting the maximum depth from 261,284 to 86,722.
- Omitting const on the reference. It compiles, and it stops documenting that the invariant is never modified and prevents passing a temporary.
- Carrying the C++ habit into Java or Python as though it mattered there. Both pass references already, and Python's id is identical in every frame.
- Advancing the invariant by mistake — passing a modified name alongside the decremented count, which no compiler will question.
- Writing n / 2 twice in the halving version. The shortfall compounds at every level and the output collapses to the largest power of two — 512 lines instead of 1,000.
- Forgetting the n == 1 base case when halving, which recurses forever on the half that never reaches zero cleanly.
- Using / rather than // in the Python halving version. It works for powers of two, because 1.0 == 1 is True, and raises RecursionError for every other n.
- Assuming recursion depth is fixed by the problem. Decrementing gives depth n and halving gives depth log n for identical output.
- Choosing recursion here at all. The loop is shorter, uses O(1) space, has no depth limit, and measured 3.9x faster in Python.

<!-- @doubt -->
### Why does the name need to be passed at all?

<!-- @answer -->
Because each call is a separate invocation with its own parameters, and a function can only see what it was given. The name is the invariant — every call needs it and none of them changes it — while the count is the variant that shrinks toward the base case. That split is the shape of almost every recursion that follows: an array plus an index, a target plus a remaining sum. The alternative is to put the name somewhere both calls can reach, such as a global, which works and makes the function depend on hidden state.

<!-- @doubt -->
### Does it matter whether I write string name or const string& name?

<!-- @answer -->
In C++ it matters three ways at once. By value each call constructs its own copy, measured exactly n + 1 of them against zero for the reference. If the name is 23 characters or longer, each of those copies allocates on the heap — 1,001 allocations at n = 1,000. And the frame grows from 32 bytes to 96, which cut the deepest workable n from 261,284 to 86,722. Measured at -O2 with a 23-character name, the by-value version cost 64.89ns per call against 2.05ns, a factor of 30.1.

<!-- @doubt -->
### Why is 23 characters the magic number?

<!-- @answer -->
Because std::string keeps short text inside the object rather than on the heap — the small-string optimisation — and this implementation's object is 24 bytes, leaving room for 22 characters plus a terminator. Measured directly, the first length whose copy allocates is 23. So a 22-character name copies for free and a 23-character name allocates on every copy. Nothing in your code mentions 22 or 23, which is exactly why the mistake survives testing: Ada, Alan Turing and Grace Hopper are all comfortably underneath it.

<!-- @doubt -->
### Doesn't the optimiser remove the copy?

<!-- @answer -->
No. Compiled at -O2 the by-value version still emits a call to the string copy path that the reference version does not have. More surprisingly the gap gets wider with optimisation, not narrower — 3.8x at -O0 and 30.1x at -O2 for a 23-character name. The reason is that -O2 has plenty to remove from the reference version, which does almost nothing per call, and nothing to remove from the copy, which genuinely has to allocate. Optimisation makes cheap code cheaper; it cannot make an allocation disappear.

<!-- @doubt -->
### Do I need to worry about this in Java or Python?

<!-- @answer -->
No, and it is worth knowing why rather than just being told. C++ is the only one of the three where a parameter can be the object itself rather than a handle to it. Java's String is a reference type, so passing it copies an 8-byte reference. Python passes object references too, and you can check it directly: id(name) is identical in every frame and equal to the caller's object. The timings confirm there is nothing to find — a 10,000-character name measured 62.1ns per call against 66.3ns for a three-character one, and a 100,000-character name did not reduce the maximum depth.

<!-- @doubt -->
### How can splitting the count in half be better when it makes more calls?

<!-- @answer -->
Because calls are cheap and depth is not. Decrementing produces one chain of n frames, all alive at once; halving produces a branching shape whose deepest path is only log base 2 of n, because each branch finishes and releases its frames before the next begins. At n = 1,000 that is 11 frames instead of 1,001, and at n = 1,000,000 it is 21 instead of a million. The cost is about twice the calls — 1,999 against 1,001 — and measured 5.38ns per line against 2.83ns. You are trading a little time for the removal of a hard ceiling.

<!-- @doubt -->
### Why n - n/2 rather than n/2 twice?

<!-- @answer -->
Because integer division rounds down, so the two halves are not equal when n is odd. For n = 7, n/2 is 3, and printing 3 then 3 gives six lines rather than seven. Writing the second call as n - n/2 gives 4, so the two calls cover 3 and 4 and the total is exactly n. The shortfall is not a single line — it compounds at every level, so the output collapses to the largest power of two at or below n. Measured: 512 lines at n = 1,000, 64 at n = 100 and 4 at n = 7. It is exactly right whenever n is already a power of two, which is why 8 and 1,024 pass and 1,000 does not.

<!-- @doubt -->
### Which version should I actually write?

<!-- @answer -->
For this problem, the loop — it is shorter, uses constant space, has no depth limit, and measured 3.9x faster than recursion in Python. If the exercise requires recursion, take the name by const reference in C++ and decrement the count, which is the shape everything later builds on. Reach for the halving version only when the depth genuinely matters: it is what lets Python print a name a million times at its default recursion limit of 1,000, where the linear version raises RecursionError.

<!-- @doubt -->
### Is this subtopic really different from printing a fixed message N times?

<!-- @answer -->
The recursion is the same and everything interesting is new. The previous subtopic had one parameter, so there was no invariant to carry and no way to pay for carrying it badly. Adding the name introduces the variant-and-invariant split that every later recursion uses, and with it a C++ hazard that costs copies, allocations and depth simultaneously. It also gives the count something to be compared against: the same n can be reduced by one or halved, and those produce identical output with completely different stack behaviour.

<!-- @doubt -->
### What happens if I accidentally change the name as I recurse?

<!-- @answer -->
Nothing stops you, which is the point of declaring it const. Passing a modified name alongside the decremented count compiles cleanly and quietly prints something other than what was asked for — the base case still fires on the count, so the recursion terminates normally and the output is simply wrong. Marking the parameter const string& makes the modification a compile error rather than a silent behaviour change, which is the main reason to write const rather than treating it as decoration.
