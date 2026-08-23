---
id: while-loop
topic: Basics
title: While Loop
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-programming
  - variables-and-constants
  - arithmetic-operators
  - relational-and-logical-operators
  - if-else-statements
  - for-loop
relatedIds:
  - for-loop
  - do-while-loop
  - break-and-continue
  - nested-loops
---

<!-- @summary -->
Repeating a block while a condition holds, when you cannot say in advance how many iterations that will take — and why the update moving into the body is what makes infinite loops a while problem.

<!-- @theory -->
## The gap a for loop leaves

A `for` loop is built for a count you know before you start: five times, `n` times,
once per array element. Plenty of repetition isn't like that.

- Read numbers until the user enters 0.
- Strip digits off a number until nothing is left.
- Halve a search range until it collapses.
- Keep refining an estimate until it stops changing.

None of these have a count you can write down in advance. What they have is a
**condition that eventually stops being true**. That's a `while` loop.

```
while (condition) {
    body
}
```

Check the condition. If true, run the body. Repeat. When it becomes false, stop.

## Same three parts, scattered

This is the idea worth carrying out of this subtopic.

A `while` loop needs exactly the same three pieces a `for` loop does. It just
doesn't put them in one place:

| | for | while |
|---|---|---|
| Initialisation | in the header | **before the loop** |
| Condition | in the header | in the header |
| Update | in the header | **inside the body** |

```
for (int i = 0; i < 5; i++) {      int i = 0;              // init
    body                            while (i < 5) {         // condition
}                                       body
                                        i++;                // update
                                    }
```

Identical behaviour. The difference is that `for` **bundles** the three parts where
you can see all of them at once, and `while` **scatters** them.

That scattering has a direct consequence: **nothing in a while loop's syntax reminds
you the update exists.** Leave it out of a `for` header and the gap is visible —
`for (int i = 0; i < 5; )` looks wrong. Leave it out of a `while` body and the body
just looks like a body. The condition stays true forever and the program hangs with
no error message.

**A forgotten update is the classic while bug**, and it is a while bug specifically
because of where the update lives.

## Entry-controlled

Like `for`, the condition is checked **before** the first iteration. If it's already
false, the body runs **zero times**:

```
int i = 10;
while (i < 5) {   // false immediately
    ...           // never runs
}
```

This is the correct, useful behaviour — reading from an empty input or processing an
empty collection needs no special case. (A loop that must run at least once is a
`do-while`, which is the next subtopic.)

## Choosing between for and while

They are interchangeable. Anything one can express, so can the other. The choice is
about **making the intent obvious to whoever reads the code next**:

- **Known count** → `for`. The header states the whole shape on one line.
- **Unknown count, condition-driven** → `while`. There is no meaningful counter to put in a header.

Forcing a `for` onto an unknown-count problem produces headers like
`for (;;)` or `for (; !done; )` — technically valid, and harder to read than the
`while` they're imitating.

## Deliberate infinite loops

`while (true)` is a real technique, not always a mistake. It's how you write "keep
going until something inside decides to stop":

```
while (true) {
    read input
    if (input is the quit signal) break;
    process input
}
```

The exit lives inside the body rather than the header. That's appropriate when the
stopping condition can only be evaluated partway through an iteration — after
reading, but before processing.

The distinction from a bug is intent plus a reachable exit. `while (true)` with a
`break` inside is deliberate; `while (i < 5)` with no `i++` is an accident. Both
loop forever if you get them wrong. (`break` is subtopic 15.)

## The digit-extraction pattern

One `while` idiom appears often enough in DSA to learn on sight:

```
while (n > 0) {
    int digit = n % 10;   // take the last digit
    n /= 10;              // remove it
}
```

Modulo 10 reads the last digit; integer division by 10 drops it. The number shrinks
by one digit per iteration and eventually reaches 0, which ends the loop. Counting
digits, reversing a number, summing digits, and palindrome checks are all this loop
with a different body.

Its iteration count is `log10(n)` — unknown until you have `n`, which is exactly why
it's a `while` and not a `for`.

One edge case worth knowing now: **`n = 0` runs zero iterations**, so a digit counter
reports 0 digits for the number 0. Zero has one digit, so that case needs handling
separately.

## Python's while matches

Worth noting after the for-loop lesson: Python's `for` is a sequence iterator rather
than a counter loop, but Python's `while` is a genuine condition loop, identical in
behaviour to C++ and Java. This is the construct where all three languages finally
agree — which also makes `while` the Python answer whenever `range` can't express
the progression, such as multiplying rather than adding.

Python adds one thing the others don't have: an `else` clause that runs **only if the
loop finished without hitting a `break`**. It's occasionally useful for search loops.
Detail belongs with `break`, in subtopic 15.

<!-- @intuition -->
A for loop hands you a contract with three signed clauses. A while loop hands you one clause and trusts you to remember the other two. The infinite loop is not a mistake about repetition — it is a mistake about trust.

<!-- @approach -->
### The Basic while Loop

<!-- @idea -->
Run a block repeatedly while a condition holds, keeping the three loop parts in mind even though only one is in the header.

<!-- @steps -->
1. Initialise whatever the condition depends on, before the loop begins.
2. Write the condition in the header; it is checked before every iteration including the first.
3. If the condition is false, skip the body entirely and continue after the loop.
4. If it is true, run the body.
5. Update the value the condition depends on, inside the body.
6. Return to the condition check and repeat until it fails.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

int main() {
    int i = 0;              // init — before the loop

    while (i < 5) {         // condition — in the header
        cout << i << " ";   // body
        i++;                // update — inside the body, easy to forget
    }
    cout << endl;           // prints: 0 1 2 3 4
    cout << i << endl;      // 5 — the value that failed the check

    // Equivalent for loop, with all three parts in one place
    for (int j = 0; j < 5; j++) {
        cout << j << " ";
    }
    cout << endl;

    // Entry-controlled: a false condition means zero iterations
    int k = 10;
    while (k < 5) {
        cout << "never printed" << endl;
    }

    return 0;
}
```

<!-- @annotations -->
- 9: Nothing in the syntax requires this line. Remove it and the loop runs forever.
- 11: Unlike a for loop's counter, i is still in scope here because it was declared outside.
- 21: The condition is checked first, so the body never runs. Same behaviour as a for loop.

<!-- @code java -->
```java
public class WhileBasics {
    public static void main(String[] args) {
        int i = 0;                          // init

        while (i < 5) {                     // condition
            System.out.print(i + " ");      // body
            i++;                            // update
        }
        System.out.println();               // prints: 0 1 2 3 4
        System.out.println(i);              // 5

        // Equivalent for loop
        for (int j = 0; j < 5; j++) {
            System.out.print(j + " ");
        }
        System.out.println();

        // Zero iterations
        int k = 10;
        while (k < 5) {
            System.out.println("never printed");
        }
    }
}
```

<!-- @annotations -->
- 5: Java requires a genuine boolean here, so an int condition would not compile — unlike C++.

<!-- @code python -->
```python
i = 0                  # init

while i < 5:           # condition
    print(i, end=" ")  # body
    i += 1             # update
print()                # prints: 0 1 2 3 4
print(i)               # 5

# Equivalent for loop, though the mechanism differs
for j in range(5):
    print(j, end=" ")
print()

# Zero iterations
k = 10
while k < 5:
    print("never printed")

# while is Python's answer whenever range cannot express the step
i = 1
while i <= 64:
    print(i, end=" ")
    i *= 2
print()   # 1 2 4 8 16 32 64
```

<!-- @annotations -->
- 5: Python has no ++ operator, so the update is written as += 1.
- 21: range only adds a fixed step. Multiplying requires a while loop in Python.

<!-- @approach -->
### Looping an Unknown Number of Times

<!-- @idea -->
Use a while when the stopping point depends on the data rather than on a count you can state upfront.

<!-- @steps -->
1. Identify the condition that describes when work remains to be done.
2. Initialise whatever that condition inspects.
3. Write the loop so each iteration makes measurable progress toward the condition failing.
4. Perform the work for the current state inside the body.
5. Advance the state so the loop moves closer to termination.
6. Handle any input value for which the loop runs zero times, if that case needs a different answer.

<!-- @code cpp -->
```cpp
// Counting the digits of a number
int n = 4729;
int count = 0;
while (n > 0) {
    n /= 10;      // drop the last digit
    count++;
}
cout << count << endl;   // 4

// Reversing a number — the same loop with a different body
n = 4729;
int rev = 0;
while (n > 0) {
    rev = rev * 10 + n % 10;   // take the last digit and append it
    n /= 10;                   // drop it
}
cout << rev << endl;   // 9274

// Reading until a sentinel value
int value;
int sum = 0;
while (cin >> value && value != 0) {
    sum += value;
}
cout << sum << endl;

// The zero edge case: 0 has one digit, but the loop runs zero times
n = 0;
count = 0;
if (n == 0) count = 1;
while (n > 0) { n /= 10; count++; }
cout << count << endl;   // 1, thanks to the guard
```

<!-- @annotations -->
- 4: The iteration count is log10(n) — unknown until n is known, which is why this is a while.
- 14: Multiply the accumulator by 10 to shift it left, then add the digit just removed.
- 22: The read itself is part of the condition, so the loop ends on either a failed read or the sentinel.
- 29: Without this guard, the number 0 would be reported as having zero digits.

<!-- @code java -->
```java
// Counting the digits of a number
int n = 4729;
int count = 0;
while (n > 0) {
    n /= 10;
    count++;
}
System.out.println(count);   // 4

// Reversing a number
n = 4729;
int rev = 0;
while (n > 0) {
    rev = rev * 10 + n % 10;
    n /= 10;
}
System.out.println(rev);   // 9274

// Reading until a sentinel
Scanner sc = new Scanner(System.in);
int sum = 0;
int value = sc.nextInt();
while (value != 0) {
    sum += value;
    value = sc.nextInt();
}
System.out.println(sum);

// The zero edge case
n = 0;
count = (n == 0) ? 1 : 0;
while (n > 0) { n /= 10; count++; }
System.out.println(count);   // 1
```

<!-- @annotations -->
- 21: The first read happens before the loop, and the next read is the update at the end of the body.

<!-- @code python -->
```python
# Counting the digits of a number
n = 4729
count = 0
while n > 0:
    n //= 10      # floor division to drop the last digit
    count += 1
print(count)      # 4

# Reversing a number
n = 4729
rev = 0
while n > 0:
    rev = rev * 10 + n % 10
    n //= 10
print(rev)        # 9274

# Reading until a sentinel
total = 0
while True:
    value = int(input())
    if value == 0:
        break
    total += value
print(total)

# The zero edge case
n = 0
count = 1 if n == 0 else 0
while n > 0:
    n //= 10
    count += 1
print(count)      # 1
```

<!-- @annotations -->
- 5: Use // rather than /, since / would produce a float and the loop would never reach exactly 0.
- 19: Reading before testing is naturally expressed with while True and a break in the middle.

<!-- @approach -->
### Infinite Loops: Deliberate and Accidental

<!-- @idea -->
Tell the two apart — one has a reachable exit inside the body, the other is missing an update.

<!-- @steps -->
1. Check that the condition depends on something the body actually changes.
2. Confirm that change moves the value toward failing the condition, not away from it.
3. Confirm the update runs on every path through the body, not only some of them.
4. If the loop is meant to run until an internal event, write the condition as always-true and place an explicit exit in the body.
5. Verify that exit is reachable for every input the loop can receive.

<!-- @code cpp -->
```cpp
// ACCIDENTAL — the update is missing, so i stays 0 forever
int i = 0;
while (i < 5) {
    cout << i << " ";
    // i++;  <- forgotten
}

// ACCIDENTAL — the condition moves the wrong way
int j = 0;
while (j < 5) {
    j--;   // moves away from the condition failing
}

// ACCIDENTAL — a stray semicolon makes the body empty
int k = 0;
while (k < 5);   // <- this semicolon IS the body
{
    k++;         // never reached; this block runs after the loop
}

// DELIBERATE — always-true condition with a reachable exit
while (true) {
    int value;
    cin >> value;
    if (value == 0) break;   // the exit
    cout << value * 2 << endl;
}
```

<!-- @annotations -->
- 5: No error and no warning. The program simply hangs, printing 0 endlessly.
- 16: The empty statement becomes the loop body, so the block below is never part of the loop.
- 22: Valid when the stopping condition can only be evaluated partway through an iteration.

<!-- @code java -->
```java
// ACCIDENTAL — missing update
int i = 0;
while (i < 5) {
    System.out.print(i + " ");
    // i++;  <- forgotten
}

// ACCIDENTAL — stray semicolon
int k = 0;
while (k < 5);   // <- this semicolon is the body
{
    k++;
}

// DELIBERATE — always-true with a reachable exit
Scanner sc = new Scanner(System.in);
while (true) {
    int value = sc.nextInt();
    if (value == 0) break;
    System.out.println(value * 2);
}
```

<!-- @annotations -->
- 17: The read must happen before the test, which is exactly what this shape expresses.

<!-- @code python -->
```python
# ACCIDENTAL — missing update
i = 0
while i < 5:
    print(i, end=" ")
    # i += 1  <- forgotten

# ACCIDENTAL — using / instead of //, so n never reaches exactly 0
# n = 4729
# while n > 0:
#     n = n / 10      # 0.0004729, 0.00004729, ... approaching 0 but never equal
# Use n //= 10 instead.

# Python cannot produce the stray-semicolon bug — a colon needs an indented block.

# DELIBERATE — always-true with a reachable exit
while True:
    value = int(input())
    if value == 0:
        break
    print(value * 2)

# while-else: the else runs only if no break occurred
n = 7
d = 2
while d * d <= n:
    if n % d == 0:
        print("not prime")
        break
    d += 1
else:
    print("prime")   # this runs, since no break happened
```

<!-- @annotations -->
- 8: A subtle Python-only variant: float division approaches zero without reaching it, so the loop never ends.
- 24: The else belongs to the while, not to the if. It runs only when the loop completes without breaking.

<!-- @example -->

<!-- @input -->
int i = 0; while (i < 3) { print(i); i++; }

<!-- @output -->
0 1 2, and i holds 3 afterwards

<!-- @why -->
Establishes that while behaves identically to the equivalent for loop, so the choice between them is about clarity rather than capability.

<!-- @walkthrough -->
1. Before the loop, i is initialised to 0.
2. The condition 0 < 3 is checked and passes, so the body runs, prints 0, and the update makes i equal to 1.
3. The condition 1 < 3 passes, the body prints 1, and the update makes i equal to 2.
4. The condition 2 < 3 passes, the body prints 2, and the update makes i equal to 3.
5. The condition 3 < 3 fails and the loop exits without running the body again.
6. i holds 3, and unlike a for loop's counter it is still in scope because it was declared before the loop.

<!-- @example -->

<!-- @input -->
int i = 0; while (i < 5) { print(i); }  — the update was left out

<!-- @output -->
0 printed endlessly; the program hangs

<!-- @why -->
The classic while bug in its simplest form, and it exists because the update lives in the body where nothing requires it.

<!-- @walkthrough -->
1. i is initialised to 0 and the condition 0 < 5 passes.
2. The body prints 0 and then finishes, having changed nothing.
3. The condition is checked again, and since i is still 0 it passes again.
4. The body prints 0 again, and this repeats with no state ever changing.
5. Nothing in the loop can ever make the condition false, so it never terminates.
6. No error is reported at any point — the compiler accepted the code and the program is doing exactly what it says.

<!-- @example -->

<!-- @input -->
n = 4729; while (n > 0) { n /= 10; count++; }

<!-- @output -->
count is 4

<!-- @why -->
The digit-extraction pattern, which recurs in counting digits, reversing numbers, digit sums and palindrome checks.

<!-- @walkthrough -->
1. n starts at 4729 and count at 0. The condition 4729 > 0 passes.
2. Integer division by 10 drops the last digit, leaving 472, and count becomes 1.
3. 472 > 0 passes; n becomes 47 and count becomes 2.
4. 47 > 0 passes; n becomes 4 and count becomes 3.
5. 4 > 0 passes; integer division gives 0 since the fraction is discarded, and count becomes 4.
6. 0 > 0 fails and the loop ends with count holding 4, matching the four digits of 4729.
7. The iteration count was never stated anywhere — it emerged from the size of the input.

<!-- @example -->

<!-- @input -->
n = 0; while (n > 0) { n /= 10; count++; }

<!-- @output -->
count is 0, but the number 0 has one digit

<!-- @why -->
Zero-iteration behaviour is usually a convenience, but here it silently produces a wrong answer — which is why the input that skips the loop entirely is always worth checking.

<!-- @walkthrough -->
1. n starts at 0 and count at 0.
2. The condition 0 > 0 is checked and is immediately false.
3. The body never runs and count is never incremented.
4. The loop reports 0 digits, which is wrong — zero is written with one digit.
5. The loop itself is correct; the specification simply has a case the condition does not cover.
6. Handling it takes an explicit guard before the loop rather than a change to the loop.

<!-- @visualization code-flow -->

<!-- @description -->
Two linked panels sharing one colour scheme: initialisation in blue, condition in green, update in orange. The SCATTER panel places an equivalent for loop and while loop side by side. In the for loop all three coloured chips sit together inside the header, boxed as one unit. In the while loop the blue chip floats above the loop, the green chip sits in the header, and the orange chip is buried among several ordinary uncoloured statements inside the body — deliberately drawn so the reader has to look for it. Then delete the orange chip from both. The for header visibly gains an empty slot between two semicolons, drawn as a gap that reads as wrong at a glance. The while body simply closes up and looks like an ordinary body with nothing missing. Run both: the for loop is now visibly incomplete, while the while loop's token cycles condition to body to condition indefinitely with the green chip staying lit and a frozen counter panel showing the value never changing. That frozen counter beside a permanently green condition is the whole diagnosis of an infinite loop. The DIGIT panel shows the unknown-count case concretely: draw the number 4729 as a row of digit tiles. Each iteration highlights the rightmost tile as the modulo reads it, then slides that tile off the right edge as the division removes it, while a counter increments. The row shrinks 4729, 472, 47, 4, then empty — at which point the condition fails. Replay it with the input 0, where the tile row is already empty, the condition fails on the first check, and the counter never moves — showing the zero-iteration case producing an answer of 0 for a number that has one digit.

<!-- @sampleInput -->
```json
{"equivalence":{"for":{"init":"i = 0","condition":"i < 5","update":"i++","allInHeader":true},"while":{"init":"i = 0","location":"above","condition":"i < 5","update":"i++","updateLocation":"in body","bodyStatements":3}},"infinite":{"cause":"update removed","counterFrozenAt":0,"conditionAlwaysTrue":true},"digits":{"input":4729,"steps":[{"n":4729,"digit":9,"count":1},{"n":472,"digit":2,"count":2},{"n":47,"digit":7,"count":3},{"n":4,"digit":4,"count":4},{"n":0,"terminates":true}],"zeroCase":{"input":0,"iterations":0,"reported":0,"correct":1}}}
```

<!-- @highlights -->
- The for loop shows all three coloured chips boxed together inside a single header.
- The while loop scatters the same three: blue above the loop, green in the header, orange buried among plain statements in the body.
- Deleting the orange chip from the for header leaves a visible empty slot between two semicolons.
- Deleting it from the while body closes the gap seamlessly — the body looks entirely normal.
- The while token now cycles condition to body to condition without end, and the green chip never turns red.
- The counter panel beside it stays frozen at its starting value, which together with the permanently green condition is the full diagnosis.
- The digit panel draws 4729 as four tiles in a row.
- Each iteration highlights the rightmost tile as modulo reads it, then slides that tile off the right edge as division removes it.
- The row shrinks through 472, 47 and 4 while the counter climbs to 4.
- The row empties, the condition fails, and the loop ends with a count that was never stated in advance.
- Replayed with input 0, the tile row starts empty, the condition fails on the very first check, and the counter never moves.
- The reported answer is 0 digits for a number written with one digit — the zero-iteration case producing a wrong result.

<!-- @edgeCases -->
- A condition that is false before the first check, where the body runs zero times.
- Input that makes a digit-extraction loop run zero times, such as 0, where the answer needs a separate guard.
- A stray semicolon after the condition in C++ or Java, which makes the body empty and the loop infinite.
- An update that runs on only some paths through the body, so certain inputs never advance the state.
- A condition testing floating-point equality, where accumulated error means the exact value is never reached.
- Using true division instead of integer division in a shrinking loop, so the value approaches zero without ever equalling it.
- A negative input to a loop whose condition assumes positive values, which may terminate immediately or never.
- A counter that overflows its type before the condition fails, wrapping and potentially restarting the loop.
- while (true) whose only exit sits inside a conditional that some inputs never satisfy.
- A loop reading input that reaches end-of-file, where the read fails rather than returning a sentinel value.

<!-- @pitfalls -->
- Forgetting the update inside the body, which leaves the condition permanently true with no error message.
- Updating in the wrong direction, so the value moves away from the condition failing rather than toward it.
- Writing a semicolon straight after the condition, which makes the loop body empty.
- Using / instead of integer division in a shrinking loop, so the value never reaches exactly zero.
- Assuming a digit-extraction loop handles 0 correctly, when it runs zero times and reports no digits.
- Placing the update after a statement that can skip the rest of the body, so some iterations never advance.
- Using while for a loop with a known count, where a for header would state the shape more clearly.
- Writing while (true) without confirming the exit is reachable for every possible input.
- Testing floating-point values for exact equality in the condition, which may never become false.
- Writing while true in Python with a lowercase t, which is a NameError rather than a working loop.

<!-- @doubt -->
### Why does my while loop never end?

<!-- @answer -->
Almost always because nothing in the body changes what the condition inspects. A while loop needs the same three parts a for loop does — initialisation, condition, update — but only the condition is in the header, so the update is yours to remember. Check three things in order: that the body modifies the variable the condition tests, that it moves that variable toward failing the condition rather than away, and that the update runs on every path through the body rather than only some.

<!-- @doubt -->
### When should I use while instead of for?

<!-- @answer -->
Use for when you know the iteration count before starting — a range, an array length, a fixed number of repetitions. Use while when the stopping point depends on the data and cannot be stated in advance: reading until a sentinel, shrinking a number until it reaches zero, halving a range until it collapses. Both can express either case, so pick the one that makes the intent obvious. A for loop with an empty header is usually a while loop in disguise.

<!-- @doubt -->
### Can a while loop run zero times?

<!-- @answer -->
Yes. The condition is checked before the first iteration, so if it is already false the body never runs. That is normally useful — processing an empty collection needs no special case. It is occasionally a bug, as in a digit-counting loop given the input 0, which runs zero times and reports zero digits for a number that has one. When the zero-iteration path produces a wrong answer, guard it before the loop. A loop that must always run at least once is a do-while, which is the next subtopic.

<!-- @doubt -->
### Is while (true) bad practice?

<!-- @answer -->
No, when it is deliberate and the exit is reachable. It is the right shape whenever the stopping condition can only be evaluated partway through an iteration — read a value, then decide whether to stop, then process it. Putting that test in the header would mean reading before the loop and again at the end of the body, duplicating the read. What makes it a bug rather than a technique is an exit that some inputs never reach, so check that the break is reachable for every case.

<!-- @doubt -->
### Where exactly should the update go in the body?

<!-- @answer -->
Usually at the end, after the work for the current state is done. The thing to watch for is any statement that can skip the rest of the body — a continue, or an early exit from a branch. If the update sits after one of those, some iterations will never advance and the loop can hang for particular inputs while working fine for others. When the update genuinely must be conditional, make sure every path still leads to progress.

<!-- @doubt -->
### What is the else clause on a Python while loop?

<!-- @answer -->
It runs when the loop finishes normally — meaning the condition became false — and is skipped entirely if a break ended the loop. That makes it useful for search loops, where the else expresses not found without needing a separate flag variable. C++ and Java have no equivalent, so the same logic there uses a boolean tracking whether the item was found. The interaction with break belongs with break itself, in subtopic 15.

<!-- @doubt -->
### How is a do-while different from a while?

<!-- @answer -->
A while checks the condition before the first iteration, so the body may run zero times. A do-while checks it after, so the body always runs at least once. That matters when the first iteration produces the value the condition needs to test — a menu that must display before the choice can be validated, for instance. That construct is the next subtopic.

<!-- @doubt -->
### How do I loop until the user types something specific?

<!-- @answer -->
Two shapes work. Read once before the loop and again at the end of the body, with the condition testing the value read. Or use while (true) with the read at the top and a break immediately after it when the sentinel appears. The second avoids duplicating the read, which is why it is common in practice. Also handle input ending unexpectedly — a failed read is a different situation from receiving the sentinel, and a loop that only checks for the sentinel will spin when input runs out.
