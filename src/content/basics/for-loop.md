---
id: for-loop
topic: Basics
title: For Loop
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-programming
  - data-types
  - variables-and-constants
  - arithmetic-operators
  - relational-and-logical-operators
relatedIds:
  - while-loop
  - do-while-loop
  - for-each-loop
  - break-and-continue
  - nested-loops
---

<!-- @summary -->
Repeating a block a known number of times, with where you start, when you stop, and how you move all declared in one header — and why Python's version is a different construct wearing the same keyword.

<!-- @theory -->
## Repetition without repetition

Printing five numbers by writing five print statements works. Printing a million
does not. And the moment the count comes from input, writing the statements out is
impossible — you don't know how many to write.

A **loop** runs the same block repeatedly. The `for` loop is the one to reach for
when you know the number of repetitions **up front**: a fixed range, the length of an
array, a counted operation.

## The three-part header

```
for (initialisation; condition; update) {
    body
}
```

- **Initialisation** runs **once**, before anything else. Usually it declares the counter.
- **Condition** is checked **before every iteration**. True means run the body; false means stop.
- **Update** runs **after every iteration**, just before the condition is re-checked.

The value of putting all three on one line is that the loop's entire shape — where it
starts, when it stops, how it moves — is readable without hunting through the body.

## The execution order, precisely

This is worth getting exact, because two common confusions come straight out of it:

```
initialise -> check -> body -> update -> check -> body -> update -> ... -> check fails -> exit
```

Notice what that ordering implies.

**The condition is checked before the first iteration.** So a loop whose condition is
false at the start runs its body **zero times**. That's not an error — it's the
correct behaviour, and it's why looping over an empty array is safe without a special
case.

**The update runs after the body.** So the counter inside the body is always the
value that *passed* the check, never the incremented one. And when the loop exits,
the counter holds the first value that **failed** — one past the last one used.

```
for (int i = 0; i < 3; i++) { print(i); }   // prints 0 1 2, and i ends at 3
```

The body never saw 3. To exit, the check had to fail, which meant `i` had to reach 3
first.

## Why i < n and not i <= n

Array indices run from `0` to `n - 1`. An array of 5 elements has valid indices
0, 1, 2, 3, 4 — there is no index 5.

`i < n` gives you exactly those `n` values. `i <= n` gives you one more, and that
extra one is out of bounds. In C++ that reads whatever memory happens to sit there
and may not crash; in Java it throws `ArrayIndexOutOfBoundsException`; in Python it
raises `IndexError`.

**Start at 0, stop before n.** That single habit removes most off-by-one bugs before
they happen.

## Scope of the counter

A variable declared in the initialisation exists **only inside the loop**. After the
loop ends, the name is gone. That's usually what you want — the counter was
scaffolding, not data.

When you need the final value afterwards, declare the variable before the loop
instead. If you find yourself doing that often, it's usually a sign a `while` loop
expresses the intent better.

## Python's for is a different construct

Here the three languages genuinely diverge, and it is not a syntax difference.

**Python has no three-part for loop.** There is no initialisation, no condition, and
no update expression. Python's `for` iterates **over a sequence of values**, taking
them one at a time:

```
for i in range(5):     # walks the values 0, 1, 2, 3, 4
```

`range(5)` produces those five values, and the loop hands you each in turn. It is a
for-each loop that happens to be given a range of numbers.

Three consequences follow, and they surprise people arriving from C++ or Java:

**Reassigning the counter inside the body does nothing.** The next iteration takes
the next value from the sequence regardless — your assignment only relabelled the
current one. In C++ and Java, modifying `i` genuinely changes the iteration.

**`range` can only add, never multiply.** `range(start, stop, step)` takes a fixed
step. A doubling loop has no `range` form and needs a `while`.

**The stop value is exclusive.** `range(5)` stops at 4, which lines up neatly with
`i < n` — the same off-by-one convention, arrived at from a different direction.

Because Python's `for` is already iterating a sequence, iterating a list directly —
`for item in arr` — is the natural form, and that is subtopic 14.

## Ranges in all three arguments

| Call | Produces |
|---|---|
| `range(5)` | 0, 1, 2, 3, 4 |
| `range(2, 6)` | 2, 3, 4, 5 |
| `range(0, 10, 2)` | 0, 2, 4, 6, 8 |
| `range(4, -1, -1)` | 4, 3, 2, 1, 0 |

When you need the index *and* the value, `enumerate` gives you both, which is
cleaner than indexing manually.

## Other forms

**Multiple variables.** C++ and Java allow several initialisations and updates,
separated by commas: `for (int i = 0, j = n - 1; i < j; i++, j--)`. This is the
standard two-pointer setup you'll use constantly in array problems.

**Omitted parts.** Any of the three can be left out. `for (;;)` is an infinite loop —
an empty condition is treated as always true. Valid, but `while (true)` says it more
plainly.

## Where this goes next

Loops inside loops are **nested loops** (subtopic 17). Iterating a collection's items
directly is the **for-each loop** (subtopic 14). Exiting early or skipping an
iteration is **break and continue** (subtopic 15). When the repetition count isn't
known in advance, that's the **while loop** (subtopic 12).

<!-- @intuition -->
The three-part header is a contract you sign before the loop starts: this is where I begin, this is what keeps me going, this is how I move. Python signs a different contract — it hands you a prepared list of values and asks nothing about how you got them.

<!-- @approach -->
### Counting Up

<!-- @idea -->
The default form — start low, increment, stop when the condition fails.

<!-- @steps -->
1. Run the initialisation once, creating the counter with its starting value.
2. Check the condition; if it is false the loop ends immediately without running the body.
3. Run the body once.
4. Run the update, changing the counter.
5. Return to the condition check and repeat until it fails.
6. Continue after the loop, with the counter holding the first value that failed the check.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

int main() {
    for (int i = 0; i < 5; i++) {
        cout << i << " ";
    }
    cout << endl;   // prints: 0 1 2 3 4

    // The counter does not exist out here — it went out of scope
    // cout << i;   // compile error

    // A loop whose condition starts false runs zero times
    for (int j = 5; j < 3; j++) {
        cout << "never printed" << endl;
    }

    // Declare before the loop when you need the final value
    int k;
    for (k = 0; k < 5; k++) { }
    cout << k << endl;   // 5 — one past the last value used

    return 0;
}
```

<!-- @annotations -->
- 5: i < 5, not i <= 5. This runs exactly 5 times, for i = 0 through 4.
- 14: The check happens before the first iteration, so the body never runs.
- 20: The loop exited because i reached 5 and failed the check. The body only ever saw 0 through 4.

<!-- @code java -->
```java
public class CountUp {
    public static void main(String[] args) {
        for (int i = 0; i < 5; i++) {
            System.out.print(i + " ");
        }
        System.out.println();   // prints: 0 1 2 3 4

        // A loop whose condition starts false runs zero times
        for (int j = 5; j < 3; j++) {
            System.out.println("never printed");
        }

        // Declare before the loop to keep the final value
        int k;
        for (k = 0; k < 5; k++) { }
        System.out.println(k);   // 5
    }
}
```

<!-- @annotations -->
- 3: Identical three-part header to C++, with the same scoping rule for the counter.

<!-- @code python -->
```python
for i in range(5):
    print(i, end=" ")
print()   # prints: 0 1 2 3 4

# There is no condition and no update expression here.
# range(5) produces the values 0,1,2,3,4 and the loop takes them one at a time.

# An empty range runs zero times — the same outcome, a different mechanism
for j in range(5, 3):
    print("never printed")

# The counter DOES survive after a Python loop, unlike C++ and Java
for k in range(5):
    pass
print(k)   # 4 — the last value taken, not 5

# Reassigning the counter inside the body does not affect iteration
for i in range(5):
    i = 100        # only relabels this iteration's value
    print(i, end=" ")
print()   # prints: 100 100 100 100 100 — still exactly 5 iterations
```

<!-- @annotations -->
- 9: range(5, 3) is empty because the start is already past the stop.
- 15: A key difference: Python's loop variable leaks into the enclosing scope and holds the last value taken.
- 18: In C++ or Java this would change the iteration. Here the sequence was already decided.

<!-- @approach -->
### Counting Down and Custom Steps

<!-- @idea -->
Change the start and the update to walk backwards, or to move by more than one.

<!-- @steps -->
1. Set the initialisation to the value the loop should start from.
2. Write the condition so it stays true across the intended range and fails just past it.
3. Write the update to move the counter in the required direction and size.
4. For a backwards walk over an array, start at n - 1 and continue while the counter is at least 0.
5. For a multiplicative step, note that Python's range cannot express it and a while loop is required.

<!-- @code cpp -->
```cpp
// Counting down
for (int i = 4; i >= 0; i--) {
    cout << i << " ";
}
cout << endl;   // 4 3 2 1 0

// Walking an array backwards
int arr[] = {10, 20, 30};
int n = 3;
for (int i = n - 1; i >= 0; i--) {
    cout << arr[i] << " ";
}
cout << endl;   // 30 20 10

// Additive custom step
for (int i = 0; i < 10; i += 2) cout << i << " ";
cout << endl;   // 0 2 4 6 8

// Multiplicative step — changes the complexity to O(log n)
for (int i = 1; i <= 64; i *= 2) cout << i << " ";
cout << endl;   // 1 2 4 8 16 32 64

// Two counters moving toward each other — the two-pointer setup
for (int i = 0, j = n - 1; i < j; i++, j--) {
    swap(arr[i], arr[j]);
}
```

<!-- @annotations -->
- 2: With an unsigned counter, i >= 0 is always true and this loops forever.
- 10: Start at n - 1 because that is the last valid index, and stop at 0 inclusive.
- 20: A multiplying update runs about log n times rather than n — the basis of binary search's cost.
- 24: Comma-separated initialisation and update. This exact header appears in dozens of array problems.

<!-- @code java -->
```java
// Counting down
for (int i = 4; i >= 0; i--) {
    System.out.print(i + " ");
}
System.out.println();   // 4 3 2 1 0

// Walking an array backwards
int[] arr = {10, 20, 30};
int n = arr.length;
for (int i = n - 1; i >= 0; i--) {
    System.out.print(arr[i] + " ");
}
System.out.println();   // 30 20 10

// Additive custom step
for (int i = 0; i < 10; i += 2) System.out.print(i + " ");
System.out.println();   // 0 2 4 6 8

// Multiplicative step
for (int i = 1; i <= 64; i *= 2) System.out.print(i + " ");
System.out.println();   // 1 2 4 8 16 32 64

// Two pointers
for (int i = 0, j = n - 1; i < j; i++, j--) {
    int tmp = arr[i]; arr[i] = arr[j]; arr[j] = tmp;
}
```

<!-- @annotations -->
- 2: Java has no unsigned int, so the C++ infinite-loop trap does not apply here.

<!-- @code python -->
```python
# Counting down — the third argument is the step
for i in range(4, -1, -1):
    print(i, end=" ")
print()   # 4 3 2 1 0

# Walking a list backwards
arr = [10, 20, 30]
n = len(arr)
for i in range(n - 1, -1, -1):
    print(arr[i], end=" ")
print()   # 30 20 10

# Or more idiomatically
for value in reversed(arr):
    print(value, end=" ")
print()   # 30 20 10

# Additive custom step
for i in range(0, 10, 2):
    print(i, end=" ")
print()   # 0 2 4 6 8

# Multiplicative step has NO range form — a while loop is required
i = 1
while i <= 64:
    print(i, end=" ")
    i *= 2
print()   # 1 2 4 8 16 32 64

# Two pointers
i, j = 0, n - 1
while i < j:
    arr[i], arr[j] = arr[j], arr[i]
    i += 1
    j -= 1
```

<!-- @annotations -->
- 2: The stop of -1 is exclusive, which is how 0 still gets included.
- 24: range only adds a fixed step. Any non-linear progression needs a while loop.
- 31: Python's for cannot advance two independent counters, so two-pointer code uses while.

<!-- @approach -->
### Iterating a Collection by Index

<!-- @idea -->
The workhorse of array algorithms — visit every element using its position.

<!-- @steps -->
1. Determine the number of elements in the collection.
2. Start the counter at 0, which is the first valid index.
3. Continue while the counter is strictly less than the length.
4. Use the counter to read or write the element at that position inside the body.
5. Increment by one so every position is visited exactly once.

<!-- @code cpp -->
```cpp
#include <vector>
using namespace std;

vector<int> arr = {3, 7, 1, 9};
int n = arr.size();

// Read every element
int sum = 0;
for (int i = 0; i < n; i++) {
    sum += arr[i];
}
cout << sum << endl;   // 20

// Write to every element
for (int i = 0; i < n; i++) {
    arr[i] *= 2;
}
// arr is now {6, 14, 2, 18}

// THE BUG: i <= n reads one past the end
// for (int i = 0; i <= n; i++) cout << arr[i];
// Valid indices are 0..3. Index 4 does not exist.

// When the index is not needed, prefer a range-based for (subtopic 14)
for (int value : arr) {
    cout << value << " ";
}
```

<!-- @annotations -->
- 9: i < n visits indices 0, 1, 2, 3 — exactly the four that exist.
- 21: In C++ this may not even crash. It reads whatever memory sits past the array, which is worse.

<!-- @code java -->
```java
int[] arr = {3, 7, 1, 9};
int n = arr.length;

// Read every element
int sum = 0;
for (int i = 0; i < n; i++) {
    sum += arr[i];
}
System.out.println(sum);   // 20

// Write to every element
for (int i = 0; i < n; i++) {
    arr[i] *= 2;
}
// arr is now {6, 14, 2, 18}

// THE BUG: i <= n
// for (int i = 0; i <= n; i++) System.out.print(arr[i]);
// throws ArrayIndexOutOfBoundsException: Index 4 out of bounds for length 4

// When the index is not needed
for (int value : arr) {
    System.out.print(value + " ");
}
```

<!-- @annotations -->
- 18: Java throws immediately and names the index, which makes this far easier to diagnose than in C++.

<!-- @code python -->
```python
arr = [3, 7, 1, 9]
n = len(arr)

# Read every element by index
total = 0
for i in range(n):
    total += arr[i]
print(total)   # 20

# Write to every element — this one does need the index
for i in range(n):
    arr[i] *= 2
# arr is now [6, 14, 2, 18]

# THE BUG: range(n + 1) goes one too far
# for i in range(n + 1):
#     print(arr[i])   ->  IndexError: list index out of range

# When only the values are needed, iterate directly
for value in arr:
    print(value, end=" ")
print()

# When both index and value are needed, use enumerate
for i, value in enumerate(arr):
    print(i, value)
```

<!-- @annotations -->
- 11: Assigning to an element requires the index. Iterating values directly would only rebind a local name.
- 20: This is the idiomatic Python form, and it is subtopic 14 in full.
- 25: enumerate is cleaner than range(len(arr)) whenever you need both.

<!-- @example -->

<!-- @input -->
for (int i = 0; i < 3; i++) { print(i); }

<!-- @output -->
0 1 2, and i holds 3 after the loop

<!-- @why -->
The clearest demonstration that the update runs after the body, which is the source of the most common confusion about the final counter value.

<!-- @walkthrough -->
1. Initialisation runs once, setting i to 0.
2. The condition 0 < 3 is checked and passes, so the body runs and prints 0. The update then makes i equal to 1.
3. The condition 1 < 3 passes, the body prints 1, and the update makes i equal to 2.
4. The condition 2 < 3 passes, the body prints 2, and the update makes i equal to 3.
5. The condition 3 < 3 fails, so the loop exits without running the body again.
6. The body ran three times and never saw the value 3, yet i holds 3 — because reaching 3 is what ended the loop.

<!-- @example -->

<!-- @input -->
for (int i = 5; i < 3; i++) { print(i); }

<!-- @output -->
nothing at all

<!-- @why -->
Proves the condition is checked before the first iteration, which is what makes zero-iteration loops safe rather than surprising.

<!-- @walkthrough -->
1. Initialisation runs once, setting i to 5.
2. The condition 5 < 3 is checked and is immediately false.
3. The loop exits without ever entering the body.
4. No output is produced and the update never runs.
5. This is correct behaviour, not an error — and it is why looping over an empty collection needs no special case.

<!-- @example -->

<!-- @input -->
An array of 4 elements iterated with i <= n instead of i < n

<!-- @output -->
Reads index 4, which does not exist

<!-- @why -->
The single most common loop bug in array code, and the reason the i < n habit is worth forming deliberately rather than by trial and error.

<!-- @walkthrough -->
1. The array has 4 elements, so its valid indices are 0, 1, 2 and 3.
2. The loop runs correctly for i equal to 0, 1, 2 and 3, reading each real element.
3. The condition 4 <= 4 still passes, so the body runs once more with i equal to 4.
4. Index 4 is one past the last element and was never allocated as part of the array.
5. Java throws ArrayIndexOutOfBoundsException and Python raises IndexError, both naming the bad index.
6. C++ performs the read anyway, returning whatever memory happens to sit there — often without crashing, which makes it the hardest of the three to notice.

<!-- @example -->

<!-- @input -->
for i in range(5): i = 100; print(i)

<!-- @output -->
100 printed five times — the loop still runs exactly five iterations

<!-- @why -->
The clearest proof that Python's for is not a counter loop, and it is the divergence most likely to mislead someone porting code between the languages.

<!-- @walkthrough -->
1. range(5) produces the sequence 0, 1, 2, 3, 4 before the loop begins.
2. Each iteration takes the next value from that sequence and binds it to the name i.
3. Assigning 100 to i replaces what the name refers to for the rest of this iteration only.
4. The sequence itself is untouched, so the next iteration binds i to the next value as if nothing happened.
5. Five values were produced, so the body runs exactly five times regardless of what the body does to i.
6. The equivalent C++ or Java code would set the counter to 100, fail the condition, and exit after one iteration.

<!-- @visualization code-flow -->

<!-- @description -->
Two contrasting models driven by the same intent. The C-STYLE panel draws the three header parts as separate labelled chips above the body — init, condition, update — and sends an execution token along the real path: init fires once and then permanently greys out, after which the token cycles condition, body, update, condition. A live counter panel beside it shows the current value, and crucially it updates exactly when the update chip fires, so the gap between the body running and the counter changing is visible rather than assumed. Colour the condition chip green on each pass and red on the final failing check, then route the token out past the loop with the counter left holding the failing value. Beneath, draw the array as a strip of indexed cells with a pointer that follows the counter, so each iteration lights the cell being visited; running the i <= n variant walks the pointer one cell past the end into a cell drawn outside the strip in red, with the three languages' reactions labelled — a thrown exception in Java and Python, and a silent read in C++. The PYTHON panel replaces the chips entirely: draw range(5) as a ribbon of value tiles generated up front, with a feeder taking one tile at a time and dropping it into the loop variable box. There is no condition chip and no update chip to draw, because neither exists. Demonstrate the reassignment case by having the body overwrite the value box with 100 while the ribbon above stays completely untouched, and the feeder delivers the next tile on schedule — showing structurally why the loop still runs five times.

<!-- @sampleInput -->
```json
{"cStyle":{"init":"i = 0","condition":"i < 3","update":"i++","body":"print(i)","trace":[{"i":0,"check":true,"printed":0},{"i":1,"check":true,"printed":1},{"i":2,"check":true,"printed":2},{"i":3,"check":false}],"finalCounter":3},"boundsDemo":{"array":[3,7,1,9],"n":4,"correct":"i < n","buggy":"i <= n","badIndex":4,"reactions":{"cpp":"silent read","java":"ArrayIndexOutOfBoundsException","python":"IndexError"}},"python":{"ribbon":[0,1,2,3,4],"bodyOverwrites":100,"iterations":5}}
```

<!-- @highlights -->
- The init chip fires once, sets the counter to 0, and then greys out permanently — it never lights again.
- The condition chip turns green as 0 < 3 passes, and the token enters the body.
- The body prints 0 while the counter panel still reads 0 — the update has not run yet.
- The update chip fires and the counter panel ticks to 1, making the lag between body and increment visible.
- The cycle repeats for 1 and 2, with the array pointer lighting each cell in turn.
- The final check 3 < 3 turns the condition chip red, and the token exits with the counter left holding 3.
- Switching to the i <= n variant walks the array pointer one cell past the end of the strip.
- That cell is drawn outside the array in red, labelled as thrown in Java and Python and silently read in C++.
- The Python panel has no condition or update chip to draw, because the construct contains neither.
- range(5) is drawn as a ribbon of five value tiles, generated in full before the loop starts.
- A feeder lifts one tile at a time and drops it into the loop variable box.
- The body overwrites that box with 100, while the ribbon above remains completely untouched.
- The feeder delivers the next tile on schedule, so the loop still runs exactly five times.

<!-- @edgeCases -->
- A condition that is false before the first iteration, where the body runs zero times.
- A loop over an empty collection, which is the same zero-iteration case and needs no special handling.
- A stray semicolon directly after the header, which makes the body an empty statement and runs the intended block once after the loop.
- An omitted update, which leaves the condition permanently true and hangs the program.
- An unsigned counter compared with >= 0 in C++, which can never be false and loops forever.
- Modifying the counter inside the body, which changes the iteration in C++ and Java but not in Python.
- A counter that overflows its type before the condition fails, wrapping to a negative value.
- Python's loop variable persisting after the loop with the last value taken, unlike C++ and Java where it goes out of scope.
- A Python loop over an empty range, where the loop variable is never assigned at all and using it afterwards raises NameError.
- Modifying a collection while looping over it by index, where the length changes underneath the condition.

<!-- @pitfalls -->
- Using i <= n when the valid indices are 0 through n - 1, which reads one element past the end.
- Writing a semicolon straight after the header, so the intended body runs once after the loop rather than inside it.
- Forgetting the update, which produces an infinite loop with no error message.
- Assuming reassigning the loop variable in Python changes the iteration — the sequence was already decided.
- Expecting Python's range to multiply. It only adds a fixed step, so doubling loops need a while.
- Forgetting that range's stop value is exclusive, so range(1, 5) produces four values rather than five.
- Counting down with i > 0 when index 0 should also be visited, which silently skips the first element.
- Declaring the counter outside the loop when it is only needed inside, leaking it into the surrounding scope.
- Using range(len(arr)) purely to index into arr, when iterating the values directly or using enumerate is clearer.
- Changing a collection's size while iterating it by index, so the condition is checked against a length that keeps moving.

<!-- @doubt -->
### Why does i end up as 3 when the loop only printed up to 2?

<!-- @answer -->
Because the update runs after the body and the condition is checked after that. For the loop to exit, the check must fail, which means i had to reach 3 first. The body never saw 3 — it only ever ran with values that passed the check. In Python it is different: the loop variable holds the last value actually taken, so it ends at 4 rather than 5.

<!-- @doubt -->
### Why is it i < n and not i <= n?

<!-- @answer -->
Because array indices start at 0. An array of n elements has valid indices 0 through n - 1, so there is no index n. Using i < n visits exactly those n positions; using i <= n visits one extra that was never allocated. Java and Python raise an exception naming the bad index, and C++ often reads the memory without crashing, which makes it the hardest case to spot.

<!-- @doubt -->
### Can a for loop run zero times?

<!-- @answer -->
Yes, and it is a normal outcome rather than an error. The condition is checked before the first iteration, so if it is already false the body never runs at all. This is precisely why looping over an empty array needs no special case — the loop simply does nothing and execution continues.

<!-- @doubt -->
### Why doesn't changing i inside a Python for loop affect the iteration?

<!-- @answer -->
Because Python's for is not a counter loop. range(5) produces the values 0 through 4, and each iteration binds the next one to the name i. Assigning to i replaces what that name refers to for the rest of the current iteration only — the sequence itself is untouched, so the next iteration proceeds as scheduled. In C++ and Java the counter genuinely drives the loop, so modifying it does change the iteration.

<!-- @doubt -->
### When should I use a for loop instead of a while loop?

<!-- @answer -->
Use for when the number of iterations is known before you start — a range, an array's length, a fixed count. Use while when you are looping until something happens and cannot say in advance how many rounds that takes, such as reading input until it ends. Either can express the other, so the choice is about making the intent obvious to whoever reads the code next.

<!-- @doubt -->
### How do I loop by 2, or by doubling?

<!-- @answer -->
Change the update. In C++ and Java, i += 2 steps by two and i *= 2 doubles, and both fit in the header. In Python, range(0, 10, 2) handles the additive step through its third argument, but range can only add — there is no way to express doubling, so a multiplicative loop needs a while. Worth noting the cost changes too: a doubling loop runs about log n times rather than n.

<!-- @doubt -->
### What is enumerate for?

<!-- @answer -->
It gives you the index and the value together while iterating. Writing for i in range(len(arr)) and then reading arr[i] works, but it says you want positions when what you actually want is both. for i, value in enumerate(arr) states that directly and avoids indexing by hand. Use it whenever you need both; when you only need the values, iterate the collection directly.

<!-- @doubt -->
### Does the loop variable still exist after the loop ends?

<!-- @answer -->
It depends on the language. In C++ and Java, a counter declared in the initialisation goes out of scope when the loop ends and the name is gone. In Python the loop variable leaks into the enclosing scope and holds the last value taken — and if the loop ran zero times it was never assigned at all, so using it raises NameError. When you need the final value in C++ or Java, declare the variable before the loop.

<!-- @doubt -->
### Is i++ different from ++i in the loop header?

<!-- @answer -->
Not for the loop's behaviour. The update's result is discarded, so both increment i identically and the loop runs the same. The difference only matters when the expression's value is used, such as in int a = i++. Use whichever reads more naturally in the header.
