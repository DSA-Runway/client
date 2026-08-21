---
id: functions-declaration-and-calling
topic: Basics
title: Functions - Declaration and Calling
difficulty: Easy
status: ready
prerequisites:
  - introduction-to-programming
  - data-types
  - variables-and-constants
  - if-else-statements
  - for-loop
relatedIds:
  - function-parameters-and-return-values
  - pass-by-value-vs-pass-by-reference
  - variable-scope-and-lifetime
  - function-overloading
  - break-and-continue
---

<!-- @summary -->
Giving a block of code a name so it can be run from anywhere — how control jumps into a function, what return sends back, and why the three languages disagree about where a function may be written.

<!-- @theory -->
## Naming a block of code

Everything so far has been one continuous program. That works until the same logic is
needed twice, at which point you have two choices: copy it, or name it.

Copying is how bugs multiply. Fix the copy in one place, forget the other, and the
program is now inconsistent with itself. **A function is a named block you can run
from anywhere**, written once.

Reuse is the obvious benefit. The bigger one is **decomposition**: a program built
from `readInput`, `findLargest` and `printResult` can be understood a piece at a time.
The same logic inlined into one 200-line block has to be understood all at once.

## Anatomy

```
int add(int a, int b) {
 ^    ^   ^^^^^^^^^^
 |    |   parameters — the values it accepts
 |    name
 return type — what it hands back
    return a + b;    <- the body
}
```

- **Return type** — the kind of value the function produces. `void` if it produces none.
- **Name** — how you refer to it. Same naming rules as a variable; a verb usually reads best.
- **Parameters** — the inputs it accepts. Covered properly in subtopic 17.
- **Body** — the statements that run when it is called.

Python declares no return type and no parameter types, matching its variables. Java
puts every function inside a class and calls it a **method** — the same thing with a
different name.

## Calling is a control transfer

This is the mechanism worth having exactly right.

When you call a function, execution **leaves** the current point, runs the function's
body, and then **comes back to precisely where it left off**. Not the next line — the
exact position in the exact expression:

```
int total = add(2, 3) * 10;
```

Control jumps into `add`, runs it, returns `5`, and resumes right where the call sat.
That `5` is then multiplied by 10. The caller is paused, not restarted.

For that to work, the machine has to **remember where to come back to**. It stores that
return address, along with the function's local variables, in a **stack frame** —
pushed when the function is called, popped when it returns. That's why the mechanism
is called the call stack, and it's covered properly in the Hard subtopic on stack
memory.

## return does two things

```
return value;
```

It **sends a value back** to the caller, and it **ends the function immediately**.
Both, always. Statements after a `return` in the same block never run:

```
int f() {
    return 1;
    cout << "never printed";   // unreachable
}
```

That immediacy is useful. A function can return early once it knows the answer, the
same way `break` leaves a loop once the answer is known.

## Functions that return nothing

Some functions compute a value. Others do something — print, update, draw. Those
return nothing:

| | Syntax | Bare return allowed? |
|---|---|---|
| C++ | `void greet()` | yes, to exit early |
| Java | `void greet()` | yes, to exit early |
| Python | `def greet():` | yes — and the function returns `None` |

Python has no `void`. Every Python function returns something, and a function with no
`return` returns `None` implicitly. So this is legal and prints `None`:

```
def greet():
    print("hi")

x = greet()     # prints hi
print(x)        # None
```

That catches people who forget a `return` — instead of an error, they get `None`
flowing quietly into the rest of the program.

**Forgetting to return a value behaves differently in all three:**

- **C++** — undefined behaviour. It may compile, run, and produce garbage.
- **Java** — a compile error. The compiler proves every path returns.
- **Python** — returns `None`, silently.

Java is strictest and C++ is most dangerous, which is the same ranking as most things
in this curriculum.

## Where a function may be written

Here the three languages genuinely differ, and the Python rule is usually stated
imprecisely.

**C++ requires declaration before use.** The compiler reads top to bottom, so calling
a function it hasn't seen yet is an error. Two fixes: define the function above
`main`, or write a **prototype** — the signature alone, ending in a semicolon —
near the top and put the definition anywhere:

```
int add(int a, int b);      // prototype: promise it exists

int main() { add(2, 3); }   // now legal

int add(int a, int b) { return a + b; }   // definition, later
```

**Java has no ordering requirement.** The compiler reads the whole class before
resolving anything, so methods can appear in any order and call each other freely.
Java's constraint is different: every method lives **inside a class**, and a method
called from `main` without an object must be declared `static`.

**Python's rule is about execution order, not file order.** A `def` is a *statement*
that runs when reached, creating the function. The name only exists after that line
has executed. So this fails:

```
greet()              # NameError — the def has not run yet
def greet(): ...
```

But this works, even though `helper` is defined below `main`:

```
def main():
    helper()         # not executed yet — just referenced

def helper():
    print("hi")

main()               # by now, both defs have run
```

The call inside `main` is only *looked up* when `main` actually runs, by which point
`helper` exists. That's why "define before calling" is the right advice but the wrong
explanation — mutually recursive functions work in Python regardless of order.

## Naming

The name is the documentation most readers will get. `calculateAverage` says what it
produces; `process` says nothing. Use a **verb** — functions do things.

If you cannot name it, it usually does too many things and should be two functions.

## Where this goes next

Passing values in and getting results back is **Function Parameters and Return Values**.
Whether a function can modify what it was given is **Pass by Value vs Pass by
Reference**. Which variables a function can see is **Variable Scope and Lifetime**.
Several functions sharing a name is **Function Overloading**. All four are Medium
subtopics in this module.

<!-- @intuition -->
A function call is a bookmark. You mark where you are, go somewhere else to get an answer, and come back to the exact word you stopped at. Everything about how functions behave follows from the machine needing to remember that bookmark.

<!-- @approach -->
### Defining and Calling a Function

<!-- @idea -->
Give a block a name, then run it by that name from anywhere.

<!-- @steps -->
1. Choose a name describing what the block does, preferably a verb.
2. Write the function with its return type, name, parameter list and body.
3. Place it where the language allows it to be seen by the caller.
4. Call it by name with parentheses, supplying any required arguments.
5. Execution leaves the caller, runs the body, and resumes at the exact point of the call.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

// Defined above main, so it is already visible when called
int add(int a, int b) {
    return a + b;
}

void greet() {
    cout << "Hello!" << endl;
}

int main() {
    greet();                       // Hello!

    int sum = add(2, 3);
    cout << sum << endl;           // 5

    // The call is an expression — it resumes mid-statement
    int total = add(2, 3) * 10;
    cout << total << endl;         // 50

    // Called once, reusable everywhere
    cout << add(10, 20) << endl;   // 30
    cout << add(-1, 1) << endl;    // 0

    return 0;
}
```

<!-- @annotations -->
- 5: int is the return type, add is the name, and the two ints in parentheses are the parameters.
- 9: void means this function produces no value — it does something rather than computing something.
- 20: Control returns to exactly here, and the returned 5 is then multiplied by 10.

<!-- @code java -->
```java
public class Functions {

    // In Java a function inside a class is called a method.
    // static means it can be called without creating an object.
    static int add(int a, int b) {
        return a + b;
    }

    static void greet() {
        System.out.println("Hello!");
    }

    public static void main(String[] args) {
        greet();                              // Hello!

        int sum = add(2, 3);
        System.out.println(sum);              // 5

        int total = add(2, 3) * 10;
        System.out.println(total);            // 50

        System.out.println(add(10, 20));      // 30
    }
}
```

<!-- @annotations -->
- 5: Without static, calling this from main would require an object first — a very common beginner error.
- 13: main is itself a static method, which is why everything it calls directly must be static too.

<!-- @code python -->
```python
def add(a, b):
    return a + b

def greet():
    print("Hello!")

greet()              # Hello!

total_sum = add(2, 3)
print(total_sum)     # 5

# The call is an expression here too
total = add(2, 3) * 10
print(total)         # 50

print(add(10, 20))   # 30

# No return type and no parameter types — same as Python's variables
# A function with no return gives back None
result = greet()     # prints Hello!
print(result)        # None
```

<!-- @annotations -->
- 1: def creates the function. No return type is written, matching how variables work in Python.
- 19: Python has no void. Every function returns something, and with no return that something is None.

<!-- @approach -->
### Returning a Value, or Returning Nothing

<!-- @idea -->
Send a result back to the caller — and know that return also ends the function on the spot.

<!-- @steps -->
1. Decide whether the function produces a value or performs an action.
2. If it produces a value, declare the matching return type and return that value.
3. If it performs an action, declare it as returning nothing.
4. Use return with no value to exit such a function early.
5. Ensure every path through a value-returning function reaches a return statement.

<!-- @code cpp -->
```cpp
// return ends the function immediately
int firstNegative(vector<int> arr) {
    for (int x : arr) {
        if (x < 0) return x;      // leaves the loop AND the function
    }
    return 0;                     // only reached if none were negative
}

// Unreachable code after return
int f() {
    return 1;
    cout << "never printed";      // compiles, never runs
}

// Bare return exits a void function early
void printPositive(int x) {
    if (x <= 0) return;           // nothing more to do
    cout << x << endl;
}

// DANGER: a path with no return is undefined behaviour in C++
int bad(int x) {
    if (x > 0) return 1;
    // no return here — the caller receives garbage
}
```

<!-- @annotations -->
- 4: One statement leaves both the loop and the function. break would only leave the loop.
- 17: A bare return is the void equivalent of an early exit.
- 23: C++ may compile this with only a warning. Java would reject it outright.

<!-- @code java -->
```java
// return ends the method immediately
static int firstNegative(int[] arr) {
    for (int x : arr) {
        if (x < 0) return x;
    }
    return 0;
}

// Bare return exits a void method early
static void printPositive(int x) {
    if (x <= 0) return;
    System.out.println(x);
}

// Java REFUSES to compile a path that does not return
static int bad(int x) {
    if (x > 0) return 1;
    // error: missing return statement
}
```

<!-- @annotations -->
- 16: The compiler proves every path returns a value. This is the strictest of the three languages.

<!-- @code python -->
```python
# return ends the function immediately
def first_negative(arr):
    for x in arr:
        if x < 0:
            return x        # leaves the loop AND the function
    return 0

# Bare return exits early, giving back None
def print_positive(x):
    if x <= 0:
        return
    print(x)

# A missing return is not an error — it silently gives None
def bad(x):
    if x > 0:
        return 1
    # falls off the end and returns None

print(bad(5))    # 1
print(bad(-5))   # None  <- no error, just None flowing onward

# Python can return several values at once, as a tuple
def min_max(arr):
    return min(arr), max(arr)

low, high = min_max([3, 7, 1])
print(low, high)   # 1 7
```

<!-- @annotations -->
- 18: The quiet failure mode. C++ gives garbage, Java refuses to compile, Python hands you None.
- 24: Not a special feature — it packs the values into a tuple, which the caller unpacks.

<!-- @approach -->
### Declaration Order and Where Functions Can Live

<!-- @idea -->
Satisfy each language's rule about when a function must be visible to its caller.

<!-- @steps -->
1. Determine whether the language resolves names by file position or by whole-unit analysis.
2. In C++, define the function above its first call, or declare a prototype near the top.
3. In Java, place the method anywhere inside the class, and mark it static if main calls it directly.
4. In Python, ensure the def statement has executed before the call actually runs, not merely before it is written.
5. Verify by checking that mutually calling functions still resolve correctly.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

// OPTION 1 — prototype at the top, definition later
int add(int a, int b);          // declaration: signature only, semicolon

int main() {
    cout << add(2, 3) << endl;  // legal: the compiler has seen the promise
    return 0;
}

int add(int a, int b) {         // definition, anywhere below
    return a + b;
}

// OPTION 2 — define above main and skip the prototype entirely

// THE ERROR — calling something the compiler has not seen
// int main() {
//     cout << subtract(5, 2);   // error: 'subtract' was not declared
// }
// int subtract(int a, int b) { return a - b; }

// Mutually recursive functions REQUIRE a prototype —
// whichever is written first cannot see the other without one.
bool isOdd(int n);
bool isEven(int n) { return n == 0 ? true  : isOdd(n - 1); }
bool isOdd(int n)  { return n == 0 ? false : isEven(n - 1); }
```

<!-- @annotations -->
- 5: A prototype promises the function exists. The linker checks that promise is kept.
- 26: Without this line, isEven could not reference isOdd, since the compiler has not met it yet.

<!-- @code java -->
```java
public class Ordering {

    // Java has NO ordering requirement — main calls a method defined below it
    public static void main(String[] args) {
        System.out.println(add(2, 3));   // legal
        greet();
    }

    static int add(int a, int b) {
        return a + b;
    }

    static void greet() {
        System.out.println("Hello!");
    }

    // Mutual calls need nothing special either
    static boolean isEven(int n) { return n == 0 || isOdd(n - 1); }
    static boolean isOdd(int n)  { return n != 0 && isEven(n - 1); }
}

// THE COMMON ERROR is not ordering but static:
// class Broken {
//     int add(int a, int b) { return a + b; }        // not static
//     public static void main(String[] args) {
//         System.out.println(add(2, 3));
//         // error: non-static method add cannot be referenced
//         //        from a static context
//     }
// }
```

<!-- @annotations -->
- 5: The compiler reads the entire class before resolving names, so position is irrelevant.
- 23: This is the ordering-equivalent stumbling block in Java, and it confuses beginners far more.

<!-- @code python -->
```python
# THE ERROR — the def has not executed yet
# greet()              # NameError: name 'greet' is not defined
# def greet():
#     print("Hello!")

# CORRECT — the def runs first, creating the name
def greet():
    print("Hello!")

greet()   # Hello!

# But the rule is about EXECUTION order, not file order.
# helper is called from inside main, which does not run until later:
def main():
    helper()          # only looked up when main actually runs

def helper():
    print("from helper")

main()                # both defs have executed by now, so this works

# Which is why mutual recursion needs no forward declaration
def is_even(n):
    return True if n == 0 else is_odd(n - 1)

def is_odd(n):
    return False if n == 0 else is_even(n - 1)

print(is_even(4))   # True
```

<!-- @annotations -->
- 7: def is a statement that runs. Before that line executes, the name simply does not exist.
- 15: The body is not evaluated at definition time — helper is resolved when the call is reached.
- 23: No prototype exists in Python and none is needed, because lookup happens at call time.

<!-- @example -->

<!-- @input -->
int total = add(2, 3) * 10;  where add returns a + b

<!-- @output -->
50

<!-- @why -->
Shows a call is an expression that resumes mid-statement, which is the detail that makes the return-address mechanism necessary.

<!-- @walkthrough -->
1. Execution reaches the call and pauses, recording exactly where to resume.
2. The values 2 and 3 are handed to the function's parameters.
3. Control transfers into the function body, where a + b evaluates to 5.
4. return sends 5 back and ends the function immediately.
5. Control resumes at the precise position of the call, not at the next line.
6. The returned 5 takes the call's place in the expression, so 5 times 10 is computed.
7. total is assigned 50.

<!-- @example -->

<!-- @input -->
A function that returns the first negative value, given [3, 7, -2, -8]

<!-- @output -->
-2, with the last element never examined

<!-- @why -->
Distinguishes return from break — return exits every enclosing loop at once, which is why it is the cleanest escape from nesting.

<!-- @walkthrough -->
1. The loop compares 3, which is not negative, so the body ends normally.
2. It compares 7, which is also not negative.
3. It compares -2, which is negative, so return executes.
4. return ends the loop and the entire function in one step, sending -2 back.
5. The final element -8 is never examined, because the function is no longer running.
6. A break would have left only the loop, and the code after it would still have run.

<!-- @example -->

<!-- @input -->
A value-returning function with a path that reaches no return statement

<!-- @output -->
C++: undefined behaviour. Java: compile error. Python: None.

<!-- @why -->
The same mistake produces a runtime unknown, a build failure, and a silent None — so the habit that protects you differs by language.

<!-- @walkthrough -->
1. In C++ the function ends without a return, so the caller reads whatever happens to be in the return location.
2. The program compiles, often with only a warning, and produces an unpredictable value.
3. In Java the compiler analyses every path and proves at least one reaches no return.
4. It refuses to compile, reporting a missing return statement before the program can ever run.
5. In Python execution simply falls off the end of the function body.
6. The function returns None, which flows into the caller with no error and may fail much later somewhere unrelated.

<!-- @example -->

<!-- @input -->
Calling a function that is written below the call site

<!-- @output -->
C++: compile error without a prototype. Java: fine. Python: depends on when the call runs.

<!-- @why -->
The precise rule differs from the usual summary: Python constrains execution order rather than file order, which is why mutual recursion works there without any forward declaration.

<!-- @walkthrough -->
1. C++ compiles top to bottom, so at the call site the name has not been seen and the compiler reports it as undeclared.
2. Adding a prototype above the call resolves it, since the compiler now knows the signature.
3. Java reads the entire class before resolving any name, so a method defined below main is found without difficulty.
4. In Python a def is a statement that creates the name when it executes.
5. A call written at the top level before that def has run raises NameError, because the name does not exist yet.
6. A call written inside another function is only looked up when that function actually runs, by which point the def has executed and it succeeds.

<!-- @visualization code-flow -->

<!-- @description -->
Draw the caller's code as a vertical strip on the left with an execution token moving down it, and a stack region on the right that grows upward. When the token reaches a call, freeze it exactly where it sits and drop a visible bookmark pin at that character position — not at the start of the line, since the whole point is that control returns mid-expression. Push a frame onto the stack showing the function's name, its parameters filled with the argument values, and its local variables, then move the token into a second code strip representing the function body. Run the body, and when return executes, animate the returned value travelling back down to the bookmark pin while the frame pops off the stack and its locals visibly disappear. The token then resumes at the pin, and the returned value is drawn slotting into the expression in place of the call so the surrounding arithmetic can complete — for add(2, 3) * 10, show the 5 landing where the call was and the multiplication then producing 50. Add a VOID variant where the frame pops with no value travelling back, and a PYTHON variant where a None token travels back instead of nothing, so the difference is visible rather than described. Finish with an ORDERING panel showing three source files side by side with a call written above its definition: the C++ file marks the call site red at compile time with a prototype line able to be dragged in above to clear it; the Java file resolves cleanly with an arrow reaching down the whole class; and the Python file shows a timeline instead of a file, where the def statement lights up as it executes and the name only becomes available on the timeline after that moment.

<!-- @sampleInput -->
```json
{"call":{"expression":"add(2, 3) * 10","function":"add","params":{"a":2,"b":3},"returns":5,"resumesAt":"the call position inside the expression","finalValue":50},"frames":[{"name":"main","locals":["total"]},{"name":"add","params":["a=2","b=3"],"pushed":true,"poppedOnReturn":true}],"variants":[{"kind":"void","returnsValue":false},{"kind":"python-implicit","returnsValue":true,"value":"None"}],"ordering":{"cpp":{"callBeforeDefinition":"error","fix":"prototype"},"java":{"callBeforeDefinition":"fine","reason":"whole class read first"},"python":{"callBeforeDefinition":"depends","reason":"def must have executed"}}}
```

<!-- @highlights -->
- The token moves down the caller strip and stops at the call, mid-expression rather than at the line start.
- A bookmark pin drops at that exact character position, marking where control must return.
- A frame is pushed onto the stack showing the function name with its parameters already filled with 2 and 3.
- The token moves into the function body strip and runs it, producing the value 5.
- return fires: the value travels back toward the bookmark while the frame pops and its locals disappear.
- The token resumes at the pin, and the 5 slots into the expression exactly where the call had been.
- The multiplication now completes, producing 50 — which only works because the return position was remembered precisely.
- In the void variant the frame pops with nothing travelling back, and the call cannot appear inside an expression.
- In the Python variant a None token travels back instead of nothing, making the implicit return visible.
- The ordering panel marks the C++ call site red, and dragging a prototype line above it clears the error.
- The Java panel resolves with an arrow reaching down through the whole class, since position is irrelevant there.
- The Python panel replaces the file with a timeline, where the name only becomes available after its def statement lights up.

<!-- @edgeCases -->
- A value-returning function with a path that reaches no return, which is undefined in C++, rejected by Java, and None in Python.
- Statements written after a return in the same block, which can never execute.
- A Python function whose result is used despite it having no return statement, silently propagating None.
- Calling a function before its definition has executed in Python, which raises NameError rather than a compile error.
- Calling a C++ function before any declaration of it, which fails at compile time rather than link time.
- A C++ prototype whose signature does not match the definition, which compiles but fails at link time.
- Calling a non-static Java method from main without an object, which is a compile error unrelated to ordering.
- Mutually recursive functions in C++, which cannot compile without a forward declaration of one of them.
- A recursive function with no base case, which pushes frames until the call stack is exhausted.
- A function whose name matches a variable in scope, which shadows or conflicts depending on the language.

<!-- @pitfalls -->
- Forgetting to return a value on some path, which gives garbage in C++, a build failure in Java, and a silent None in Python.
- Writing code after a return and expecting it to run.
- Calling a C++ function before it has been declared, instead of adding a prototype or moving the definition up.
- Forgetting static on a Java method called from main, which is the ordering-equivalent stumbling block in Java.
- Assuming Python requires functions to appear above their callers in the file, when the real constraint is on execution order.
- Using break where return was meant, which leaves only the loop and lets the rest of the function run.
- Naming a function with a noun such as data or process, which tells the reader nothing about what it does.
- Writing one function that does several unrelated things, usually signalled by not being able to name it.
- Declaring a C++ prototype whose signature drifts from the definition, which surfaces only as a link error.
- Ignoring a returned value entirely, when the function was called precisely to produce it.

<!-- @doubt -->
### What is the difference between declaring and defining a function?

<!-- @answer -->
A declaration states the signature — return type, name and parameter types — and ends with a semicolon. It promises the function exists somewhere. A definition includes the body, the actual code that runs. C++ separates them so you can promise near the top and deliver later, which is what a prototype is. Java and Python have no separate declaration form: writing the function is both at once.

<!-- @doubt -->
### Why does C++ complain about a function I clearly defined further down?

<!-- @answer -->
Because C++ resolves names in file order, and at the point of your call the compiler has not read that definition yet. Two fixes: move the definition above the call, or add a prototype near the top — the signature followed by a semicolon. The prototype is the usual answer once you have several functions, and it is mandatory for mutually recursive ones, since whichever is written first cannot otherwise see the other.

<!-- @doubt -->
### What does return actually do?

<!-- @answer -->
Two things at once: it sends a value back to the caller, and it ends the function immediately. The second half is easy to overlook. Any statements after it in the same block are unreachable, and a return inside nested loops exits every one of them along with the function. That makes it the cleanest way out of deeply nested code, which is why the break-and-continue lesson recommends extracting nested loops into a function.

<!-- @doubt -->
### What happens if I forget to return a value?

<!-- @answer -->
It depends on the language, and the three outcomes are very different. C++ has undefined behaviour — the caller reads whatever happens to be in the return location, and the program may compile with only a warning. Java refuses to compile, since it proves every path returns. Python returns None silently, which then flows onward and often fails much later somewhere that looks unrelated. Java's strictness is a genuine advantage here.

<!-- @doubt -->
### Does Python have void functions?

<!-- @answer -->
No. Every Python function returns something, and one with no return statement returns None implicitly. So a print-only function can still be assigned to a variable, which will hold None. That is worth remembering, because forgetting a return does not produce an error — it produces None quietly entering your data, and the failure surfaces somewhere else entirely.

<!-- @doubt -->
### Why does Java say my method cannot be referenced from a static context?

<!-- @answer -->
Because main is static, meaning it runs without an object, and a non-static method belongs to an object that does not exist yet. Mark the method static so it belongs to the class rather than to an instance, and it can be called directly. This is the error Java beginners hit where C++ beginners hit ordering problems — it has nothing to do with where the method is written.

<!-- @doubt -->
### Do Python functions have to be written above the code that calls them?

<!-- @answer -->
Not in the file — in execution order. A def is a statement that creates the function when it runs, so the name exists only after that line executes. A call at the top level before the def raises NameError. But a call written inside another function is only looked up when that function actually runs, by which point every def in the file has executed. That is why mutually recursive functions work in Python with no forward declaration at all.

<!-- @doubt -->
### How do I know when to split code into a function?

<!-- @answer -->
Two reliable signals. If you are about to copy a block, make it a function instead — duplicated logic means duplicated bugs and only one of the copies tends to get fixed. And if a block needs a comment to explain what it does, that comment is usually the function's name waiting to be written. The reverse test is just as useful: if you cannot name a function, it is probably doing several things and should be two.
