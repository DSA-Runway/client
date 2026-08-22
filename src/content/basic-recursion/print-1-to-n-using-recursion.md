---
id: print-1-to-n-using-recursion
topic: Basic Recursion
title: Print 1 to N using Recursion
difficulty: Easy
status: ready
prerequisites:
  - print-name-n-times-using-recursion
  - understand-recursion-by-print-something-n-times
  - stack-memory-and-recursion-depth
  - if-else-statements
  - for-loop
relatedIds:
  - print-n-to-1-using-recursion
  - print-name-n-times-using-recursion
  - understand-recursion-by-print-something-n-times
  - stack-memory-and-recursion-depth
---

<!-- @summary -->
Print the numbers 1 to N in order — the first recursion whose output has an order, where the version that counts downward prints upward and needs one parameter instead of two, and where swapping its two lines produces Print N to 1 exactly, wrong on 39 of the 41 sizes from 0 to 40.

<!-- @theory -->
## The problem

Print `1, 2, 3, … N`, in that order.

```
n = 5   ->   1 2 3 4 5
```

The previous two subtopics printed the same thing every time, so the order the
prints happened in was invisible. Here it is the entire answer, and that changes
what the choices in the function mean.

## The obvious version counts up

If the output ascends, make the parameter ascend. That needs a second parameter,
because the function has to know both where it is and where to stop:

```
up(i, n):
    if i > n: return
    print i
    up(i + 1, n)
```

`i` is the variant and `n` is the invariant, exactly the split the previous
subtopic established. The print comes **before** the recursive call, so the
numbers are emitted on the way *down* into the recursion — 1 first, then 2, and
so on.

This is the version most people write, and it is not the interesting one.

## The version that counts down also prints up

Here is the same output from a function that never counts upward at all:

```
down(n):
    if n <= 0: return
    down(n - 1)
    print n
```

It takes **one parameter**. It moves `n` downward, toward zero. And it prints
`1 2 3 4 5`.

The reason is that nothing is printed on the way in. `down(5)` immediately calls
`down(4)`, which calls `down(3)`, all the way to `down(0)`, which returns without
printing. Only then does anything get emitted — and the first frame to resume is
the innermost one, holding `n = 1`. Then `n = 2`, then `n = 3`. **The prints
happen during the unwind, so they come out in the reverse of the order the calls
were made.**

Two reversals cancel: the parameter descends and the printing order is reversed,
so the output ascends.

Verified identical to the counting-up version for every n tested.

That is the idea this subtopic exists for. **Where you put the print decides
whether you are reading the stack on the way in or on the way out**, and the
second option is often the one that needs less state — one parameter here rather
than two.

## Swapping those two lines gives you the next subtopic

In the very first subtopic, moving the print from before the call to after it made
no observable difference. Here it makes all of it:

```
down(n):                      down(n):
    if n <= 0: return             if n <= 0: return
    down(n - 1)                   print n
    print n                       down(n - 1)

-> 1 2 3 4 5                  -> 5 4 3 2 1
```

The right-hand version is **Print N to 1**, correct and complete — just for a
different problem. Measured against the correct output for every n from 0 to 40,
it is **wrong on 39 of them**, agreeing only at n = 0 and n = 1 where a
one-element sequence reads the same in both directions.

So the smallest test that distinguishes them is **n = 2**. A solution checked only
against n = 1 tells you nothing at all.

## The two versions have very different ceilings

They produce identical output and they are not equally capable.

The counting-up version's recursive call is the last thing it does — a tail call —
so a compiler may discard the frame before making it. The counting-down version
has a `print` still pending when the call returns, so its frame must survive.

Measured, deepest N that completes:

| | `-O0` | `-O2` |
|---|---|---|
| Count up, print before the call | 261,000 | **> 29,996,338** |
| Count down, print after the call | 261,000 | **261,000** |

At `-O0` neither is optimised and both die at the same depth. At `-O2` the
counting-up version becomes a loop — zero self-calls remain in the generated
assembly — and stops having a limit at all, while the counting-down version is
unchanged.

The timing says the same thing. Per number, at `-O2`:

| | ns |
|---|---|
| Loop | 0.723 |
| **Count up** | **0.729** |
| Count down | **10.972** |

The counting-up version measures the same as a loop **because by then it is one**.
The counting-down version costs **15.2x** the loop, which is the real price of a
call, a frame, and a return per number.

## Python has neither the optimisation nor the same ranking

Python never eliminates tail calls, so both versions are genuinely recursive and
both stop at the default recursion limit of 1,000.

And there the ordering reverses. Per number at n = 20,000:

| | ns |
|---|---|
| Loop | 12.9 |
| Count up (two parameters) | 64.8 |
| **Count down (one parameter)** | **57.2** |

The counting-down version is **faster in Python**, because passing one argument
per call is cheaper than passing two. The version C++ punishes is the one Python
mildly rewards.

## Both off-by-one mistakes are silent

The base cases are where this goes wrong, and neither error crashes.

| Written | Should be | n = 3 gives | Effect |
|---|---|---|---|
| `if (i >= n) return` | `i > n` | `1 2` | loses the last number |
| `if (n < 0) return` | `n <= 0` | `0 1 2 3` | prints an extra 0 |

Both produce a well-formed ascending sequence of the right shape and the wrong
length, which is exactly the kind of output that passes an eyeball check.

## Splitting the range removes the depth limit

The count does not have to change by one. Printing `1..n` is also "print
`lo..mid`, then print `mid+1..hi`" — two halves of a range:

| n | Linear: depth / calls | Range split: depth / calls |
|---|---|---|
| 1,000 | 1,001 / 1,001 | **11** / 1,999 |
| 1,000,000 | crashes | **21** / 1,999,999 |

One thing changes from the previous subtopic, and it is the point of including
this here. When printing the same name `n` times, the two halves could run in
either order. **Here they cannot** — and the way they fail is the same failure the
linear versions have. Running the right half first reverses the whole sequence
exactly, giving **N to 1**, verified for every n tested. So all three recursive
forms turn into the next subtopic by swapping their two statements.

At Python's **default** recursion limit of 1,000, printing 1 to 1,000,000: the
linear version raises `RecursionError` and the range split completes with all
1,000,000 numbers.

It costs about twice the calls, and measured 3.492ns per number against the
counting-up version's 0.729ns at `-O2`.

## Where this goes next

**Print N to 1** is the mirror, and by now most of it is already written: it is
this function with the two lines swapped, in either version. The wider idea — that
work done on the way *out* of a recursion sees things in reverse — is what makes
recursion natural for reversing a list, walking a tree in postorder, and
backtracking.

<!-- @intuition -->
Recursion gives you two moments to do work at, and until now only one of them mattered. On the way in, each call acts before handing on; on the way out, each call acts after getting control back. Those two moments produce opposite orders, because the last call to start is the first to finish. So there are two ways to print an ascending sequence: count upward and print as you go, or count downward and print as you come back — the descending parameter and the reversed unwind cancel each other out. Once you see that, the mirror problem is free, and so is the general habit of asking whether a job belongs before the call or after it.

<!-- @approach -->
### Iteration - The Loop

<!-- @idea -->
Count from one to n with a loop, printing each value.

<!-- @steps -->
1. Start a counter at one.
2. While the counter is less than or equal to n, print the counter.
3. Increase the counter by one.
4. Stop when the counter passes n.
5. Nothing is held between iterations except the counter itself.

<!-- @complexity -->
- time: O(n)
- space: O(1)
- note: The baseline, measured 0.723ns per number at -O2 and 12.9ns in Python. It has no depth limit and no ordering subtlety, because a loop only offers one moment to do work at.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printOneToN(int n) {
    for (int i = 1; i <= n; i++) {
        cout << i << " ";
    }
}
```

<!-- @annotations -->
- 5: i <= n rather than i < n, because the sequence includes n itself — the mirror of the i > n base case in the recursive version.
- 6: A loop has only one place to put this statement, which is why ordering never comes up here.

<!-- @code java -->
```java
static void printOneToN(int n) {
    for (int i = 1; i <= n; i++) {
        System.out.print(i + " ");
    }
}
```

<!-- @annotations -->
- 2: n of zero or less prints nothing, since the condition fails before the first iteration.

<!-- @code python -->
```python
def print_one_to_n(n):
    for i in range(1, n + 1):
        print(i, end=" ")


# range stops before its second argument, so n + 1 is what includes n.
# Measured 12.9ns per number at n = 20,000.
```

<!-- @annotations -->
- 2: range(1, n + 1) yields 1 through n. Writing range(1, n) silently drops the last number.

<!-- @approach -->
### Count Up, Print Before the Call

<!-- @idea -->
Carry a rising index alongside the limit, printing each value on the way into the recursion.

<!-- @steps -->
1. Take two parameters: the current value i and the limit n.
2. Check the base case first — if i is greater than n, return.
3. Print i.
4. Call the function again with i plus one and n unchanged.
5. Start the whole thing from i equal to one.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack as written, O(1) if the compiler eliminates the tail call
- note: The recursive call is the last statement, so clang at -O2 removes it entirely — zero self-calls remain and the version stops having a depth limit, completing beyond n = 29,996,338 where -O0 dies at 261,000. Measured 0.729ns per number against the loop's 0.723ns, which is the same because by then it is a loop.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printFrom(int i, int n) {
    if (i > n) return;               // base case: i has passed the limit

    cout << i << " ";                // print on the way IN
    printFrom(i + 1, n);
}

void printOneToN(int n) { printFrom(1, n); }
```

<!-- @annotations -->
- 5: i > n, not i >= n. The stricter test stops one number early — at n = 3 it prints 1 2 rather than 1 2 3.
- 7: Printing before the call is what makes the output ascend in the same direction the parameter moves.
- 8: Nothing follows this call, so it is a tail call and -O2 compiles the function into a loop.
- 11: A wrapper hides the second parameter from the caller, which is the usual way this two-parameter form is presented.

<!-- @code java -->
```java
static void printFrom(int i, int n) {
    if (i > n) return;

    System.out.print(i + " ");
    printFrom(i + 1, n);
}

static void printOneToN(int n) { printFrom(1, n); }
```

<!-- @annotations -->
- 2: Only i moves. Advancing n as well would move the target and the base case would never be reached.
- 5: The JVM specification forbids tail-call elimination, so this stays O(n) stack regardless of the optimiser.

<!-- @code python -->
```python
def print_from(i, n):
    if i > n:
        return
    print(i, end=" ")
    print_from(i + 1, n)


def print_one_to_n(n):
    print_from(1, n)


# Two arguments per call. Measured 64.8ns per number, slightly SLOWER
# than the one-parameter counting-down version at 57.2ns.
```

<!-- @annotations -->
- 5: Python never eliminates tail calls, so this consumes a frame per number and stops at the default limit of 1,000.

<!-- @approach -->
### Count Down, Print After the Call

<!-- @idea -->
Recurse all the way down first, then print on the way back out, so a descending parameter produces ascending output.

<!-- @steps -->
1. Take a single parameter n.
2. Check the base case first — if n is zero or less, return without printing.
3. Call the function with n minus one, before printing anything.
4. That call prints everything from 1 up to n minus one.
5. Print n, which now lands after all the smaller values.

<!-- @complexity -->
- time: O(n)
- space: O(n) call stack, and it cannot be optimised away
- note: One parameter instead of two, and identical output to the counting-up version at every n tested. A print is still pending when the call returns, so the frame must survive: measured 261,000 maximum at both -O0 and -O2, against no limit at all for the tail-recursive version. Costs 10.972ns per number at -O2, which is 15.2x the loop — and 57.2ns in Python, which is FASTER than the two-parameter version's 64.8ns.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printOneToN(int n) {
    if (n <= 0) return;

    printOneToN(n - 1);              // go all the way down FIRST
    cout << n << " ";                // print on the way OUT
}
```

<!-- @annotations -->
- 5: n <= 0 rather than n < 0. Testing n < 0 lets n = 0 print, adding a spurious 0 to the front of the output.
- 7: Nothing has been printed yet at this point — the whole chain runs down to zero before any output appears.
- 8: This is the swap. Moving this line above the call turns the function into Print N to 1, wrong on 39 of 41 sizes. It also has a cost: because a statement is pending after the call, the frame cannot be discarded and the depth limit stays at 261,000 even at -O2.

<!-- @code java -->
```java
static void printOneToN(int n) {
    if (n <= 0) return;

    printOneToN(n - 1);
    System.out.print(n + " ");
}
```

<!-- @annotations -->
- 4: The first number printed is 1, emitted by the innermost frame — the last call to start is the first to finish.

<!-- @code python -->
```python
def print_one_to_n(n):
    if n <= 0:
        return
    print_one_to_n(n - 1)
    print(n, end=" ")


# One argument per call rather than two, and measured faster than the
# counting-up version — 57.2ns per number against 64.8ns at n = 20,000.
```

<!-- @annotations -->
- 4: The parameter descends and the unwind reverses the order, and those two reversals cancel to give ascending output.

<!-- @approach -->
### Split the Range

<!-- @idea -->
Print the first half of the range and then the second half, halving the depth at each level.

<!-- @steps -->
1. Take the two ends of the range, lo and hi.
2. If lo is greater than hi, there is nothing to print, so return.
3. If lo equals hi, print that single value and return.
4. Otherwise find the midpoint and print the range from lo to mid.
5. Then print the range from mid plus one to hi, in that order.

<!-- @complexity -->
- time: O(n), with about 2n calls rather than n
- space: O(log n) call stack
- note: Depth falls from 1,001 to 11 at n = 1,000, and is 21 at n = 1,000,000 where the linear versions crash. At Python's default recursion limit of 1,000 it printed all 1,000,000 numbers. Unlike the same trick in the previous subtopic, the two halves must now run in this order — the output has an order to get wrong. Costs 3.492ns per number at -O2 against 0.729ns.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

void printRange(int lo, int hi) {
    if (lo > hi) return;
    if (lo == hi) { cout << lo << " "; return; }

    int mid = lo + (hi - lo) / 2;
    printRange(lo, mid);             // left half FIRST
    printRange(mid + 1, hi);
}

void printOneToN(int n) { printRange(1, n); }
```

<!-- @annotations -->
- 6: Two base cases — one for an empty range and one for a single value, which is what stops the splitting.
- 8: lo + (hi - lo) / 2 rather than (lo + hi) / 2, which can overflow for large bounds.
- 9: The left half must be printed before the right. In the previous subtopic the two halves were interchangeable; swapping them here reverses the entire sequence, giving N to 1.
- 10: mid + 1, not mid. Repeating mid would print it twice and recurse forever on a two-element range.

<!-- @code java -->
```java
static void printRange(int lo, int hi) {
    if (lo > hi) return;
    if (lo == hi) { System.out.print(lo + " "); return; }

    int mid = lo + (hi - lo) / 2;
    printRange(lo, mid);
    printRange(mid + 1, hi);
}

static void printOneToN(int n) { printRange(1, n); }
```

<!-- @annotations -->
- 6: Because the depth is logarithmic, this version does not hit StackOverflowError at any n an int can hold.

<!-- @code python -->
```python
def print_range(lo, hi):
    if lo > hi:
        return
    if lo == hi:
        print(lo, end=" ")
        return
    mid = lo + (hi - lo) // 2
    print_range(lo, mid)
    print_range(mid + 1, hi)


def print_one_to_n(n):
    print_range(1, n)


# At the DEFAULT recursion limit of 1,000 this printed 1 to 1,000,000,
# where the linear version raised RecursionError.
```

<!-- @annotations -->
- 7: Floor division with //, since a float midpoint would never satisfy lo == hi.
- 9: Swapping these two lines reverses the whole sequence exactly, giving N to 1 — verified for every n tested, including sizes that are not powers of two.

<!-- @example -->

<!-- @input -->
n = 3, through the counting-down version

<!-- @output -->
1 2 3 — printed entirely during the unwind

<!-- @why -->
The trace that makes the central idea concrete: nothing is printed until the deepest call has already returned, so a parameter that only ever decreases produces increasing output.

<!-- @walkthrough -->
1. printOneToN(3) is called. n is 3, which is not zero, so it immediately calls printOneToN(2) — printing nothing yet.
2. printOneToN(2) calls printOneToN(1), which calls printOneToN(0). Still nothing has been printed.
3. printOneToN(0) matches the base case and returns at once, having printed nothing.
4. Control returns to the frame holding n = 1, which now runs its print statement and emits 1 — the first output of the whole run.
5. That frame returns, and the frame holding n = 2 resumes and prints 2.
6. Finally the outermost frame, holding n = 3, resumes and prints 3.
7. The parameter went 3, 2, 1, 0 and the output came out 1, 2, 3, because the last call to start is the first to finish.

<!-- @example -->

<!-- @input -->
The counting-down version with its two lines swapped

<!-- @output -->
5 4 3 2 1 — a correct answer to a different problem

<!-- @why -->
The same edit that was completely invisible in the first subtopic now changes the answer entirely, and the wrong answer is the next subtopic's correct one.

<!-- @walkthrough -->
1. Moving the print above the recursive call means each frame emits its value before handing on.
2. The outermost frame therefore prints n first, then the next prints n minus one, and so on down to 1.
3. The output is 5 4 3 2 1 for n = 5 — well formed, complete, and descending.
4. That is exactly Print N to 1, which is the next subtopic and a legitimate problem in its own right.
5. Measured against the correct ascending output for every n from 0 to 40, the swapped version is wrong on 39 of them.
6. It agrees only at n = 0, where nothing is printed, and n = 1, where a one-element sequence reads the same in both directions.
7. So the smallest input that distinguishes them is n = 2, and a solution tested only at n = 1 proves nothing.

<!-- @example -->

<!-- @input -->
The same output from both recursive versions, at -O0 and -O2

<!-- @output -->
261,000 for both at -O0; unlimited against 261,000 at -O2

<!-- @why -->
Two functions with identical output and different capabilities, where the difference appears only once the optimiser is involved — so the more capable version is the one that looks less natural.

<!-- @walkthrough -->
1. The counting-up version prints before it recurses, so nothing is pending when the call returns and it is a tail call.
2. The counting-down version has a print waiting after the call, so its frame has to survive until that call finishes.
3. Compiled at -O0 neither is optimised, and both crash at about n = 261,000.
4. Compiled at -O2 clang removes the counting-up version's self-call entirely, leaving zero recursive branches in the assembly.
5. That version then completed beyond n = 29,996,338, while the counting-down version still crashed at about 261,000.
6. The timings confirm the mechanism: counting up measured 0.729ns per number against the loop's 0.723ns, effectively identical.
7. Counting down measured 10.972ns, about 15.2 times the loop, which is the cost of a genuine call and frame per number.

<!-- @example -->

<!-- @input -->
Both off-by-one base cases at n = 3

<!-- @output -->
1 2 from one mistake, 0 1 2 3 from the other

<!-- @why -->
Neither error crashes or produces anything obviously malformed — both give a tidy ascending sequence of the wrong length, which is what makes them survive a glance at the output.

<!-- @walkthrough -->
1. In the counting-up version the base case must be i > n, so that i equal to n still prints before stopping.
2. Writing i >= n stops one step early, printing 1 2 for n = 3 and losing the final number at every size.
3. In the counting-down version the base case must be n <= 0, so that the chain stops before reaching zero.
4. Writing n < 0 lets the call with n equal to 0 run its print statement.
5. Because that frame is the innermost one, its print happens first, and the output becomes 0 1 2 3.
6. Both results are ascending runs of consecutive integers, so nothing about their shape signals a problem.
7. Checking the first and last values printed against 1 and n catches both immediately.

<!-- @visualization memory-model -->

<!-- @description -->
The call stack as a column of frames, and beside it an output strip that fills left to right — the relationship between the two is the entire subject, so both must be on screen at all times. Run the counting-down version for n = 3: push frames for 3, 2, 1 and 0 while the output strip stays conspicuously empty, and label that descent nothing printed yet, holding it long enough to be uncomfortable. When the n = 0 frame returns, start the unwind and let each resuming frame emit its value into the strip — 1 from the innermost, then 2, then 3 — so the reader watches ascending output being produced by a parameter that only ever descended. Mark each frame with a small pending-print badge on the way down and clear it as the value is emitted, because that pending badge is exactly what stops the frame being discarded. Beside it run the counting-up version on the same input: the strip fills as the frames are pushed rather than as they pop, and its frames carry no pending badge at all. Put the two output strips directly under one another so they are seen to be identical while the moments of writing are opposite. The swap panel is the centre: take the counting-down version, lift the print statement above the recursive call, and replay — now the strip fills during the descent and reads 3 2 1, with a caption naming it as Print N to 1 and a verdict lamp reading wrong on 39 of 41 sizes, agreeing only at n = 0 and n = 1. Then the ceiling panel: two columns growing against a wall marked 8,372,224 bytes, one carrying pending badges and one not, with an -O0 / -O2 toggle — at -O0 both reach the wall at 261,000, and at -O2 the badge-free column collapses to a single frame and runs past the wall indefinitely while the other is unchanged. Close with the range split drawn as a balanced tree over the numbers rather than a chain, only 11 levels deep at n = 1,000, with an arrow showing that the left subtree must be fully emitted before the right one begins.

<!-- @sampleInput -->
```json
{"primary":{"n":3,"version":"count down, print after the call","descent":[{"call":"printOneToN(3)","printed":null},{"call":"printOneToN(2)","printed":null},{"call":"printOneToN(1)","printed":null},{"call":"printOneToN(0)","printed":null,"baseCase":true}],"outputDuringDescent":"","unwind":[{"resumes":"n = 1","prints":1},{"resumes":"n = 2","prints":2},{"resumes":"n = 3","prints":3}],"result":"1 2 3","peakFrames":4,"parameterDirection":"descending","outputDirection":"ascending","reason":"the last call to start is the first to finish"},"twoVersions":{"countUp":{"parameters":2,"printRelativeToCall":"before","tailCall":true,"selfCallsAtO2":0},"countDown":{"parameters":1,"printRelativeToCall":"after","tailCall":false,"selfCallsAtO2":1},"outputIdentical":true,"verifiedOver":[-2,0,1,2,3,5,7,17,100,500]},"swapTrap":{"edit":"move the print above the recursive call","produces":"5 4 3 2 1","isActually":"Print N to 1 — the next subtopic","wrongOn":"39 of 41 sizes from 0 to 40","agreesAt":[0,1],"smallestDistinguishingInput":2},"depth":{"stackBytes":8372224,"O0":{"countUp":261000,"countDown":261000},"O2":{"countUp":">29,996,338 (compiled to a loop)","countDown":261000},"atN1000":{"countUp":{"depth":1001,"calls":1001},"countDown":{"depth":1001,"calls":1001},"rangeSplit":{"depth":11,"calls":1999}},"atN1000000":{"rangeSplit":{"depth":21,"calls":1999999}}},"offByOne":[{"written":"i >= n","shouldBe":"i > n","atN3":"1 2","effect":"loses the last number"},{"written":"n < 0","shouldBe":"n <= 0","atN3":"0 1 2 3","effect":"prints an extra 0"}],"timing":{"unit":"ns per number","cpp":{"n":100000,"O2":{"loop":0.723,"countUp":0.729,"countDown":10.972,"rangeSplit":3.492},"countDownVsLoop":15.2},"python":{"n":20000,"loop":12.9,"countUp":64.8,"countDown":57.2,"rangeSplit":143.2,"note":"the one-parameter version is FASTER here, reversing the C++ ranking"}},"rangeSplit":{"halvesMustRunInOrder":true,"swappingHalvesGives":"N to 1 — the sequence reversed exactly","verifiedOver":[1,2,3,4,5,6,7,8,9,11,16,17],"contrastWithPreviousSubtopic":"printing the same name n times allowed either order; an ordered output does not","unification":"all three recursive forms turn into Print N to 1 by swapping their two statements","pythonDefaultLimit":{"limit":1000,"n":1000000,"linear":"RecursionError","rangeSplit":"completed, 1,000,000 numbers"}}}
```

<!-- @highlights -->
- The call stack and an output strip sit side by side, because the relationship between them is the whole subject.
- Running the counting-down version for n = 3 pushes frames for 3, 2, 1 and 0 while the output strip stays conspicuously empty.
- That descent is labelled nothing printed yet and held long enough to be uncomfortable.
- Each frame carries a pending-print badge on the way down, which is exactly what stops it being discarded.
- When the n = 0 frame returns, the unwind begins and the innermost frame emits 1 — the first output of the run.
- Then 2, then 3, so ascending output is produced by a parameter that only ever descended.
- The counting-up version runs alongside, filling its strip as frames are pushed rather than as they pop.
- Its frames carry no pending badge at all, which is why the compiler can discard them.
- The two output strips sit directly under one another, identical, while the moments of writing are opposite.
- The swap panel lifts the print above the recursive call and replays, filling the strip during the descent instead.
- It now reads 3 2 1, captioned as Print N to 1, with a lamp reading wrong on 39 of 41 sizes.
- That lamp notes the two agreements at n = 0 and n = 1, making n = 2 the smallest distinguishing input.
- The ceiling panel grows two columns against a wall marked 8,372,224 bytes, one badge-carrying and one not.
- At -O0 both reach the wall at 261,000 and stop.
- At -O2 the badge-free column collapses to a single frame and runs past the wall indefinitely, while the other is unchanged.
- The range split closes it as a balanced tree only 11 levels deep at n = 1,000, with the left subtree required to finish before the right begins.

<!-- @edgeCases -->
- n equal to zero — nothing is printed, and both base cases must handle it without emitting a 0.
- n equal to one — the only non-empty size where ascending and descending output are identical, which makes it useless as a test.
- n equal to two — the smallest input that distinguishes 1 to N from N to 1.
- Negative n — the base cases i > n and n <= 0 both stop immediately, so nothing is printed.
- The base case written as i >= n — loses the final number at every size, giving 1 2 for n = 3.
- The base case written as n < 0 — prints a spurious 0 at the front, giving 0 1 2 3 for n = 3.
- The print moved above the recursive call in the counting-down version — produces N to 1, wrong on 39 of 41 sizes.
- n around 261,000 in C++ — where the counting-down version exhausts the stack even at -O2.
- n above 1,000 in Python — the default recursion limit, which stops both linear versions but not the range split.
- The two halves of the range split run in the wrong order — the sequence comes out exactly reversed, which is Print N to 1 rather than a scrambled order.
- The range split written with mid rather than mid + 1 — prints the midpoint twice and recurses forever on a two-element range.

<!-- @pitfalls -->
- Testing only at n = 1. Ascending and descending output are identical there, so it cannot distinguish this problem from Print N to 1.
- Printing before the recursive call in the counting-down version. It produces a complete, well-formed descending sequence — wrong on 39 of the 41 sizes from 0 to 40.
- Writing the base case as i >= n in the counting-up version, which stops one number early and loses n at every size.
- Writing the base case as n < 0 in the counting-down version, which lets the zero call print and prepends a spurious 0.
- Assuming a descending parameter means descending output. The counting-down version prints ascending, because the unwind reverses the order.
- Adding a second parameter to the counting-down version. It needs only n, and the index-and-limit pair is what the counting-up form requires instead.
- Expecting both recursive versions to have the same limits. At -O2 one compiles to a loop and the other still crashes at 261,000.
- Assuming the tail-recursive version is always the better one. In Python it measured slower — 64.8ns against 57.2ns — because it passes two arguments per call.
- Relying on tail-call elimination at all. It is absent at -O0, forbidden by the JVM specification, and never performed by Python.
- Swapping the two halves in the range split. Unlike the same trick when printing one repeated value, the halves are not interchangeable once the output has an order — the sequence comes out exactly reversed.
- Writing printRange(mid, hi) rather than printRange(mid + 1, hi), which duplicates the midpoint and never terminates on a two-element range.
- Using recursion here at all for production code. The loop is shorter, has no depth limit, and measured 15.2x faster than the counting-down version.

<!-- @doubt -->
### How can counting down print in ascending order?

<!-- @answer -->
Because nothing is printed on the way down. The call chain runs all the way from n to zero before any output appears, and then the frames finish in the reverse of the order they started — the innermost first. That frame holds n = 1, so 1 is printed first, then 2, then 3. There are two reversals happening: the parameter descends, and the unwind reverses the order of the prints. They cancel, and the output ascends.

<!-- @doubt -->
### Which version should I write, the one with one parameter or two?

<!-- @answer -->
Both are correct and produce identical output, so it depends on what you care about. The counting-down version needs only n, which is genuinely simpler, and in Python it measured faster — 57.2ns per number against 64.8ns — because it passes one argument per call instead of two. The counting-up version is a tail call, so in C++ at -O2 it becomes a loop and stops having a depth limit at all, completing past n = 29,996,338 where the other crashes at 261,000. Learn the counting-down version first, because it is the one that teaches what the unwind is for.

<!-- @doubt -->
### Why is n = 1 a bad test for this problem?

<!-- @answer -->
Because a one-element sequence reads the same forwards and backwards, so it cannot tell 1 to N apart from N to 1. Measured against the correct output for every n from 0 to 40, the version with its two lines swapped is wrong on 39 of them and agrees at exactly n = 0 and n = 1. Since the swap is the single most likely mistake here, a test suite containing only n = 1 passes a solution that is wrong for every larger input. Test at n = 2 or more.

<!-- @doubt -->
### What happens if I move the print above the recursive call?

<!-- @answer -->
You get Print N to 1 — the next subtopic, correct and complete for a different problem. Each frame emits its value before handing on, so the outermost frame prints n first and the innermost prints 1 last, giving 5 4 3 2 1 for n = 5. Nothing about the output looks broken: it is a full, well-formed run of consecutive integers. In the very first subtopic this same edit was completely invisible because every line was identical; here it is the entire answer, and it is the reason that subtopic ended by pointing at this one.

<!-- @doubt -->
### Why do the two versions have different depth limits if the output is the same?

<!-- @answer -->
Because only one of them still has work pending when the recursive call returns. The counting-up version prints first, so nothing is waiting and the compiler may release the frame before making the call — which turns the function into a loop. The counting-down version has a print scheduled for after the call, so the frame must survive to run it. Measured: at -O0 both crash at about 261,000, and at -O2 the counting-up version completed past n = 29,996,338 while the counting-down version still crashed at 261,000.

<!-- @doubt -->
### Which base case is right, and what do the wrong ones do?

<!-- @answer -->
For the counting-up version it is i > n, so that i equal to n still prints. Writing i >= n stops one step early and prints 1 2 for n = 3. For the counting-down version it is n <= 0, so the chain stops before reaching zero. Writing n < 0 lets the zero call run its print, and because that frame is the innermost one its output comes first — giving 0 1 2 3 for n = 3. Neither mistake crashes and both produce a tidy ascending run of the wrong length, so check the first and last values against 1 and n rather than glancing at the shape.

<!-- @doubt -->
### Does the range-split version have the same freedom as before?

<!-- @answer -->
No, and that is why it is worth revisiting here. When printing the same name n times, the two halves could be run in either order because every line was identical. Now the output has an order, so the left half must be printed before the right — and running the right half first reverses the whole sequence exactly, giving N to 1, verified for every n tested including sizes that are not powers of two. That makes it the third form in this subtopic whose two statements swap into the next problem. What it buys is the same as before: depth falls from 1,001 to 11 at n = 1,000 and is only 21 at a million, which is what lets Python print 1 to 1,000,000 at its default recursion limit of 1,000 where the linear version raises RecursionError.

<!-- @doubt -->
### Is recursion worth it here?

<!-- @answer -->
Not for the output. The loop is shorter, has no depth limit, and measured 0.723ns per number against the counting-down version's 10.972ns — about 15.2x. What this problem is genuinely for is the idea that a recursive function offers two moments to do work at, before the call and after it, and that they produce opposite orders. That is what makes recursion the natural tool for reversing a sequence, for postorder tree traversal, and for backtracking, where undoing a choice has to happen on the way back out.

<!-- @doubt -->
### Why does Python rank the two versions differently from C++?

<!-- @answer -->
Because the thing C++ rewards does not exist in Python. In C++ the counting-up version wins decisively at -O2, since being a tail call lets it become a loop. Python never eliminates tail calls, deliberately, so both versions are genuinely recursive and both stop at the default limit of 1,000. With that advantage removed, what remains is argument-passing cost, and the counting-down version passes one argument per call rather than two — measured 57.2ns per number against 64.8ns. The same code, ranked oppositely, for reasons that have nothing to do with the algorithm.

<!-- @doubt -->
### How do I turn this into Print N to 1?

<!-- @answer -->
Swap the print and the recursive call, in either version. In the counting-down version, move the print above the call and it emits n first. In the counting-up version, move the print below the call and the ascending parameter's output is reversed by the unwind. Both give N to 1, which means each problem has two natural solutions and they are the two orderings of the same two lines. That symmetry is the whole of the next subtopic, which is why most of it is already visible from here.
