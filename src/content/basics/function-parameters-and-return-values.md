---
id: function-parameters-and-return-values
topic: Basics
title: Function Parameters and Return Values
difficulty: Medium
status: ready
prerequisites:
  - functions-declaration-and-calling
  - data-types
  - variables-and-constants
  - for-loop
relatedIds:
  - functions-declaration-and-calling
  - pass-by-value-vs-pass-by-reference
  - function-overloading
  - variable-scope-and-lifetime
---

<!-- @summary -->
The interface of a function — how values are matched into its parameters, what defaults and named arguments change, and how to hand back more than one result.

<!-- @theory -->
## Parameters and arguments

Two words that get used interchangeably and shouldn't be:

- A **parameter** is the name in the function's definition. It's a placeholder.
- An **argument** is the actual value passed at the call site.

```
int add(int a, int b) { ... }   // a and b are parameters
add(2, 3);                      // 2 and 3 are arguments
```

Parameters are local variables that happen to be initialised by the caller. They
exist only while the function runs.

## Matching happens by position

By default, arguments fill parameters **left to right**. The first argument goes to
the first parameter, and so on. The names at the call site are irrelevant — only the
order counts:

```
void divide(int numerator, int denominator) { ... }

int a = 3, b = 12;
divide(a, b);      // numerator = 3, denominator = 12
divide(b, a);      // numerator = 12, denominator = 3
```

Both compile. Both run. **One of them is wrong**, and nothing tells you which. This
is why parameter order matters and why long parameter lists of the same type are
dangerous — swapping two `int`s produces a silently wrong answer.

## The count must match

Supplying the wrong number of arguments is an error in all three languages, caught at
different times:

- **C++ and Java** — compile error. The program never builds.
- **Python** — `TypeError` at the moment of the call, since nothing is checked earlier.

Defaults and variadic parameters are the two ways to legitimately vary the count.

## Default arguments

A parameter with a default becomes optional. Omit it and the default is used.

```
void greet(string name, string greeting = "Hello") { ... }
greet("Ana");              // Hello, Ana
greet("Ana", "Welcome");   // Welcome, Ana
```

**Defaults must be rightmost.** Once one parameter has a default, every parameter to
its right must have one too — otherwise there'd be no way to tell which argument you
meant to skip.

Two language-specific rules worth knowing:

**C++**: the default goes in the **declaration**, not the definition. If a function is
declared in a header and defined elsewhere, repeating the default in the definition is
a compile error.

**Java has no default arguments at all.** None. The Java approach is to write several
overloaded versions of the method, each with a different parameter count, with the
shorter ones calling the longer one. That's the Function Overloading subtopic.

## Python's mutable default trap

This one deserves its own section, because the mechanism is genuinely surprising and
the failure is silent.

```
def add_item(item, lst=[]):
    lst.append(item)
    return lst

add_item(1)    # [1]
add_item(2)    # [1, 2]      <- not [2]
add_item(3)    # [1, 2, 3]   <- not [3]
```

**Why:** default values are evaluated **once, when the function is defined** — not on
each call. That empty list is created a single time and the same object is reused by
every call that omits the argument. Appending to it mutates the shared default
permanently.

For immutable defaults — numbers, strings, `None`, tuples — this never matters,
because nothing can mutate them. It only bites with lists, dicts, and sets.

**The fix** is standard and worth memorising:

```
def add_item(item, lst=None):
    if lst is None:
        lst = []          # a fresh list per call
    lst.append(item)
    return lst
```

**Rule: never use a mutable value as a default. Use `None` and create it inside.**

## Keyword arguments

Python lets you pass arguments **by name** rather than by position:

```
divide(denominator=12, numerator=3)   # order no longer matters
```

This directly solves the swapped-argument problem above — the name at the call site
documents what each value is. It's especially valuable when a function takes several
booleans or several numbers of the same type.

Positional arguments must come before keyword ones. C++ and Java have no equivalent;
there the convention is to keep parameter lists short, or bundle related values into a
struct or object.

## Variable numbers of arguments

When the count genuinely isn't fixed:

| | Syntax |
|---|---|
| C++ | `initializer_list<int>`, or variadic templates |
| Java | `int... values` — arrives as an array |
| Python | `*args` for positional, `**kwargs` for keyword |

A variadic parameter must be last, since it absorbs everything remaining.

## Returning results

A function returns **one value**. When you need several, each language has a way to
package them:

**Python** returns a tuple, and it looks like multiple returns:

```
def min_max(arr):
    return min(arr), max(arr)

low, high = min_max([3, 7, 1])
```

That's one tuple being unpacked, which is why it reads so cleanly.

**C++** uses `pair`, `tuple`, or a small struct. Structured bindings since C++17 make
unpacking read almost like Python's.

**Java** returns an array for same-typed values, or a small class or record for mixed
ones. A record is usually the clearer choice, since the fields get names.

**Prefer a named type when values are mixed.** A `pair<int, string>` tells you nothing
about what the two halves mean; a struct with named fields does.

## Return early

From the previous subtopic: `return` ends the function immediately. Guard clauses at
the top handle the trivial cases first and leave the main logic unindented:

```
int process(vector<int> arr) {
    if (arr.empty()) return 0;      // handle the boring case, get out
    // main logic, at one indentation level
}
```

## What this subtopic doesn't cover

Whether a function can **modify** what it was given — whether it receives a copy or
the original — is a separate question with genuinely different answers per language.
That's the next subtopic, **Pass by Value vs Pass by Reference**.

<!-- @intuition -->
A parameter list is a row of empty slots. Arguments drop into them left to right, defaults pre-fill any left empty, and keyword arguments let you aim at a slot by name instead of by position. The one thing to remember is that Python fills its default slots once, at definition time, and hands the same object to every caller.

<!-- @approach -->
### Passing Arguments to Parameters

<!-- @idea -->
Supply values at the call site that fill the function's parameters in order.

<!-- @steps -->
1. Read the function's parameter list to see how many values it expects and in what order.
2. Supply that many arguments at the call site.
3. Each argument binds to the parameter in the matching position, left to right.
4. The parameters exist as local variables for the duration of the call.
5. Confirm the order is right, since a swap of same-typed arguments compiles and runs silently.

<!-- @code cpp -->
```cpp
#include <iostream>
using namespace std;

double divide(int numerator, int denominator) {
    if (denominator == 0) return 0;        // guard clause
    return (double) numerator / denominator;
}

int main() {
    int a = 3, b = 12;

    cout << divide(a, b) << endl;   // 0.25  — numerator 3, denominator 12
    cout << divide(b, a) << endl;   // 4     — the arguments swapped

    // Both compile and run. Nothing flags the second as wrong.

    // Wrong argument count is a compile error
    // divide(5);          // error: too few arguments
    // divide(1, 2, 3);    // error: too many arguments

    return 0;
}
```

<!-- @annotations -->
- 5: An early return handling the degenerate case, leaving the main logic unindented below.
- 13: The danger of same-typed parameters: the compiler cannot tell these apart.

<!-- @code java -->
```java
public class Params {

    static double divide(int numerator, int denominator) {
        if (denominator == 0) return 0;
        return (double) numerator / denominator;
    }

    public static void main(String[] args) {
        int a = 3, b = 12;

        System.out.println(divide(a, b));   // 0.25
        System.out.println(divide(b, a));   // 4.0 — swapped

        // divide(5);   // error: method divide cannot be applied to given types
    }
}
```

<!-- @annotations -->
- 12: Java has no keyword arguments, so there is no way to make the intent explicit at the call site.

<!-- @code python -->
```python
def divide(numerator, denominator):
    if denominator == 0:
        return 0
    return numerator / denominator

a, b = 3, 12

print(divide(a, b))   # 0.25
print(divide(b, a))   # 4.0 — swapped

# Wrong count raises at call time, not before
# divide(5)
# TypeError: divide() missing 1 required positional argument: 'denominator'

# Keyword arguments remove the ordering risk entirely
print(divide(numerator=3, denominator=12))   # 0.25
print(divide(denominator=12, numerator=3))   # 0.25 — same result
```

<!-- @annotations -->
- 12: Python checks nothing until the call actually executes, so this surfaces at runtime.
- 16: The names document what each value means, which is exactly what the swap bug needs.

<!-- @approach -->
### Default and Keyword Arguments

<!-- @idea -->
Make parameters optional, and name them at the call site where the language allows it.

<!-- @steps -->
1. Identify parameters that have a sensible common value.
2. Give those parameters a default, placing them to the right of all required parameters.
3. In C++, put the default in the declaration only, never repeated in the definition.
4. In Python, never use a mutable value as a default — use None and create the object inside the function.
5. At the call site, omit defaulted arguments, or in Python name any argument to pass it out of order.

<!-- @code cpp -->
```cpp
#include <string>
using namespace std;

// Defaults must be rightmost
void greet(string name, string greeting = "Hello", char punct = '!') {
    cout << greeting << ", " << name << punct << endl;
}

greet("Ana");                       // Hello, Ana!
greet("Ana", "Welcome");            // Welcome, Ana!
greet("Ana", "Welcome", '.');       // Welcome, Ana.

// INVALID — a non-default cannot follow a default
// void bad(int x = 10, int y);

// Declaration and definition split: the default goes in the DECLARATION only
int power(int base, int exp = 2);            // declaration — default here

int power(int base, int exp) {               // definition — no default repeated
    int result = 1;
    for (int i = 0; i < exp; i++) result *= base;
    return result;
}

// int power(int base, int exp = 2) { ... }  // error: redefinition of default

// C++ has no keyword arguments — you cannot skip a middle parameter
// greet("Ana", punct='.');   // not valid C++
```

<!-- @annotations -->
- 5: Once greeting has a default, punct must have one too.
- 20: Repeating the default here is a compile error, not a harmless duplicate.
- 28: To vary only the third argument you must supply the second as well.

<!-- @code java -->
```java
public class Defaults {

    // Java has NO default arguments. Overloading is the substitute.
    static void greet(String name) {
        greet(name, "Hello", '!');          // delegate to the full version
    }

    static void greet(String name, String greeting) {
        greet(name, greeting, '!');
    }

    static void greet(String name, String greeting, char punct) {
        System.out.println(greeting + ", " + name + punct);
    }

    // Varargs handle a genuinely variable count
    static int sum(int... values) {         // arrives as an int[]
        int total = 0;
        for (int v : values) total += v;
        return total;
    }

    public static void main(String[] args) {
        greet("Ana");                        // Hello, Ana!
        greet("Ana", "Welcome");             // Welcome, Ana!
        greet("Ana", "Welcome", '.');        // Welcome, Ana.

        System.out.println(sum());           // 0
        System.out.println(sum(1, 2, 3));    // 6
    }
}
```

<!-- @annotations -->
- 4: Three methods where C++ and Python need one. This is the Function Overloading subtopic.
- 17: A varargs parameter must be last, since it absorbs every remaining argument.

<!-- @code python -->
```python
def greet(name, greeting="Hello", punct="!"):
    print(f"{greeting}, {name}{punct}")

greet("Ana")                          # Hello, Ana!
greet("Ana", "Welcome")               # Welcome, Ana!
greet("Ana", punct=".")               # Hello, Ana.  <- skip the middle one

# INVALID — a non-default cannot follow a default
# def bad(x=10, y): ...

# THE MUTABLE DEFAULT TRAP
def add_item_broken(item, lst=[]):
    lst.append(item)
    return lst

print(add_item_broken(1))   # [1]
print(add_item_broken(2))   # [1, 2]     <- shared across calls
print(add_item_broken(3))   # [1, 2, 3]

# Why: the default [] is created ONCE, when the def executes —
# not on each call. Every call that omits lst gets that same list.

# THE FIX — None as the default, create inside
def add_item(item, lst=None):
    if lst is None:
        lst = []            # a fresh list every call
    lst.append(item)
    return lst

print(add_item(1))   # [1]
print(add_item(2))   # [2]
print(add_item(3))   # [3]

# *args and **kwargs for a variable count
def summarise(*args, **kwargs):
    print(args)     # a tuple of positional arguments
    print(kwargs)   # a dict of keyword arguments

summarise(1, 2, 3, mode="fast", debug=True)
# (1, 2, 3)
# {'mode': 'fast', 'debug': True}
```

<!-- @annotations -->
- 6: Keyword arguments let you skip a middle parameter, which C++ cannot do.
- 13: Immutable defaults such as numbers, strings and None are always safe. Only mutables are affected.
- 25: None is immutable, so it is never shared in a harmful way — this is the standard idiom.

<!-- @approach -->
### Returning One Value or Several

<!-- @idea -->
Hand results back to the caller, packaging them when there is more than one.

<!-- @steps -->
1. Decide what the function produces and declare the matching return type.
2. Return that value, remembering the function ends immediately at that point.
3. When several values are needed, package them into a tuple, pair, struct, or record.
4. Prefer a named type over an anonymous pair when the values mean different things.
5. Unpack the result at the call site into separate variables.

<!-- @code cpp -->
```cpp
#include <vector>
#include <tuple>
#include <algorithm>
using namespace std;

// One value
int sumOf(const vector<int>& arr) {
    int total = 0;
    for (int x : arr) total += x;
    return total;
}

// Two values via pair
pair<int, int> minMax(const vector<int>& arr) {
    return { *min_element(arr.begin(), arr.end()),
             *max_element(arr.begin(), arr.end()) };
}

// Structured bindings unpack it (C++17)
vector<int> arr = {3, 7, 1};
auto [low, high] = minMax(arr);
cout << low << " " << high << endl;   // 1 7

// Mixed types deserve a named struct, not a bare tuple
struct Stats {
    int count;
    double average;
    bool empty;
};

Stats analyse(const vector<int>& arr) {
    if (arr.empty()) return {0, 0.0, true};
    int total = sumOf(arr);
    return {(int) arr.size(), (double) total / arr.size(), false};
}

Stats s = analyse(arr);
cout << s.count << " " << s.average << endl;   // 3 3.66667
```

<!-- @annotations -->
- 21: Reads almost like Python's tuple unpacking, and it is the reason pair returns became pleasant in C++.
- 24: s.average says what it is. A tuple's second element does not.

<!-- @code java -->
```java
import java.util.*;

// One value
static int sumOf(int[] arr) {
    int total = 0;
    for (int x : arr) total += x;
    return total;
}

// Same-typed values can go in an array, though the meaning is lost
static int[] minMax(int[] arr) {
    int lo = arr[0], hi = arr[0];
    for (int x : arr) { lo = Math.min(lo, x); hi = Math.max(hi, x); }
    return new int[]{lo, hi};
}

// A record is far clearer — the fields have names
record Stats(int count, double average, boolean empty) {}

static Stats analyse(int[] arr) {
    if (arr.length == 0) return new Stats(0, 0.0, true);
    return new Stats(arr.length, (double) sumOf(arr) / arr.length, false);
}

public static void main(String[] args) {
    int[] arr = {3, 7, 1};

    int[] mm = minMax(arr);
    System.out.println(mm[0] + " " + mm[1]);   // 1 7

    Stats s = analyse(arr);
    System.out.println(s.count() + " " + s.average());   // 3 3.6666666666666665
}
```

<!-- @annotations -->
- 11: The caller has to remember that index 0 is the minimum. That is a comment, not a guarantee.
- 18: A record is Java's concise way to define a small value type with named fields.

<!-- @code python -->
```python
# One value
def sum_of(arr):
    return sum(arr)

# Several values — this returns one tuple, which reads as several
def min_max(arr):
    return min(arr), max(arr)

arr = [3, 7, 1]
low, high = min_max(arr)     # tuple unpacking
print(low, high)             # 1 7

# The tuple is a real object if you want it whole
result = min_max(arr)
print(result)                # (1, 7)
print(type(result))          # <class 'tuple'>

# Mixed values deserve names — a dataclass or NamedTuple
from collections import namedtuple
Stats = namedtuple("Stats", ["count", "average", "empty"])

def analyse(arr):
    if not arr:
        return Stats(0, 0.0, True)
    return Stats(len(arr), sum(arr) / len(arr), False)

s = analyse(arr)
print(s.count, s.average)    # 3 3.6666666666666665

# Guard clause pattern — handle the trivial case and get out
def average(arr):
    if not arr:
        return 0
    return sum(arr) / len(arr)
```

<!-- @annotations -->
- 7: Not a special feature. The comma builds a tuple, and the caller unpacks it.
- 22: s.average is self-documenting where result[1] is not.

<!-- @example -->

<!-- @input -->
divide(numerator, denominator) called as divide(12, 3) and divide(3, 12)

<!-- @output -->
4 and 0.25 — both valid, one almost certainly wrong

<!-- @why -->
Positional matching is invisible when the types agree, which makes argument order a genuine correctness concern rather than a style question.

<!-- @walkthrough -->
1. In the first call, 12 binds to numerator and 3 binds to denominator by position.
2. The division computes 12 divided by 3, giving 4.
3. In the second call, 3 binds to numerator and 12 to denominator, since only order matters.
4. The division computes 3 divided by 12, giving 0.25.
5. Both calls compile and run without any warning, because both arguments have the same type.
6. Python's keyword form removes the risk by naming each value at the call site.

<!-- @example -->

<!-- @input -->
def add_item(item, lst=[]): lst.append(item); return lst  — called three times

<!-- @output -->
[1], then [1, 2], then [1, 2, 3] — the list is shared

<!-- @why -->
One of the most-reported Python bugs, and the mechanism is genuinely surprising: the trap is in when the default is evaluated, not in what it contains.

<!-- @walkthrough -->
1. The def statement executes once, and while it does, the empty list default is created — a single list object.
2. The first call omits lst, so the parameter binds to that object, appends 1, and returns [1].
3. The second call omits lst again and binds to the very same object, which still contains 1.
4. Appending 2 mutates that shared list, so it returns [1, 2] rather than [2].
5. The third call does the same again, giving [1, 2, 3].
6. Nothing is reset between calls because nothing creates a new list — the default was evaluated at definition time, not call time.

<!-- @example -->

<!-- @input -->
The same function written with lst=None and the list created inside

<!-- @output -->
[1], then [2], then [3] — correct

<!-- @why -->
The standard fix, and pairing it with the broken version shows it is not superstition — it changes when the object is created.

<!-- @walkthrough -->
1. The default None is evaluated once at definition time, exactly as before.
2. None is immutable, so there is nothing about it that can accumulate state.
3. Each call that omits the argument binds lst to None and then reaches the guard.
4. The guard creates a brand new empty list, which exists only for this call.
5. Appending affects that fresh list, so each call returns exactly one item.
6. The pattern works because the mutable object is created at call time rather than definition time.

<!-- @example -->

<!-- @input -->
A function returning both the minimum and maximum of [3, 7, 1]

<!-- @output -->
1 and 7, packaged differently in each language

<!-- @why -->
Multiple return values look like a language feature in Python and are really just packaging, which is what makes the C++ and Java equivalents easy to recognise.

<!-- @walkthrough -->
1. A function returns exactly one value, so two results must be packaged into one object.
2. Python builds a tuple from the comma-separated values and the caller unpacks it into two names.
3. C++ returns a pair, which structured bindings unpack into two names in a single statement.
4. Java returns an array when both values share a type, though the caller must remember which index is which.
5. For values of different types or meanings, a struct in C++ or a record in Java gives the fields names.
6. Naming matters because s.average documents itself where result[1] relies on the caller remembering.

<!-- @visualization code-flow -->

<!-- @description -->
Draw the function's parameter list as a row of labelled empty slots beneath its signature, and the call site above with its arguments as loose value tiles. Animate a plain call by dropping the tiles into the slots strictly left to right, with connector lines showing each tile's destination — then repeat with the same two tiles swapped, so both fill legally and the connector lines simply cross, with a note that nothing distinguishes the wrong one when the types match. Add a KEYWORD panel where a tile carries a name label and flies to the slot bearing that name regardless of position, including over an untouched middle slot that its default then fills. The DEFAULT panel is the important one. Draw the definition-time moment explicitly as a separate event before any call: when the def executes, each default value is constructed once and parked in a holding area beside the function, and the mutable list default is drawn there as a real container object. Then run three calls that omit the argument: each time, the slot is filled by a connector to that same parked container rather than to a fresh one, and each append visibly adds an item to it, so the container grows across calls while the calls themselves look identical. Replay with None as the default, where the parked value is an inert marker, the guard inside the body constructs a brand new container per call, and the containers are drawn appearing and disappearing with each call so nothing accumulates. Finish with a RETURN panel showing one value travelling back versus several values being packed into a single container that the caller then unpacks into separate names — with a labelled variant whose compartments carry field names, next to an unlabelled one whose compartments are numbered only.

<!-- @sampleInput -->
```json
{"signature":{"name":"divide","params":["numerator","denominator"]},"calls":[{"args":[12,3],"binds":{"numerator":12,"denominator":3},"result":4},{"args":[3,12],"binds":{"numerator":3,"denominator":12},"result":0.25}],"keyword":{"call":"greet('Ana', punct='.')","filled":["name","punct"],"defaulted":["greeting"]},"mutableDefault":{"definitionTimeObjects":[{"param":"lst","value":[],"mutable":true}],"calls":[{"append":1,"returns":[1]},{"append":2,"returns":[1,2]},{"append":3,"returns":[1,2,3]}],"fixed":{"default":"None","perCallObject":true,"returns":[[1],[2],[3]]}},"returns":{"single":20,"packed":{"min":1,"max":7},"named":{"count":3,"average":3.67,"empty":false}}}
```

<!-- @highlights -->
- The parameter list is drawn as empty labelled slots, with the call's arguments waiting above as loose tiles.
- Tiles drop into the slots strictly left to right, with connector lines showing where each one lands.
- Swapping the two tiles fills the slots just as legally — the connectors merely cross, and nothing marks it wrong.
- In the keyword panel a tile carries a name label and flies past an untouched middle slot to reach its named target.
- That skipped middle slot is then filled by its default, which is the case C++ cannot express.
- The default panel opens with a definition-time event before any call: each default is constructed once and parked beside the function.
- The mutable list default is drawn there as a real container object, sitting in the holding area.
- The first call connects its empty slot to that parked container and appends an item to it.
- The second and third calls connect to the very same container, which visibly grows while the calls look identical.
- Replayed with None, the parked value is an inert marker and the guard constructs a fresh container inside the body.
- Those containers appear and disappear with each call, so nothing carries over.
- The return panel sends one value back, then several packed into a single container that the caller unpacks.
- A labelled container with named compartments sits beside a numbered one, showing what naming the fields buys.

<!-- @edgeCases -->
- A call with too few or too many arguments, which fails at compile time in C++ and Java and at call time in Python.
- Two parameters of the same type passed in the wrong order, which compiles, runs, and silently produces a wrong answer.
- A mutable default argument in Python, which is created once and shared by every call that omits it.
- A default argument repeated in both the declaration and definition in C++, which is a compile error.
- A non-default parameter placed after a defaulted one, which is invalid in both C++ and Python.
- A varargs or *args parameter that receives no arguments at all, arriving as an empty array or tuple.
- Passing a keyword argument for a parameter that was already filled positionally, which raises a TypeError.
- A function returning a reference or pointer to a local variable, which is destroyed when the function returns.
- Unpacking a returned tuple into the wrong number of names, which raises a ValueError in Python.
- A Java method returning an array of results, where the caller relies on remembering which index means what.

<!-- @pitfalls -->
- Using a mutable value such as a list or dict as a Python default, which accumulates state across calls.
- Assuming Java has default arguments. It has none, and uses overloading instead.
- Repeating a C++ default argument in the definition as well as the declaration.
- Placing a required parameter to the right of a defaulted one.
- Passing same-typed arguments in the wrong order, which no compiler can detect for you.
- Writing long parameter lists of identical types instead of bundling them into a struct or object.
- Returning a bare pair or array for values that mean different things, forcing the caller to remember the order.
- Returning a reference to a local variable, which no longer exists once the function has returned.
- Forgetting that a variadic parameter must come last in the parameter list.
- Ignoring the returned value when the function was called specifically to produce it.

<!-- @doubt -->
### What is the difference between a parameter and an argument?

<!-- @answer -->
A parameter is the name written in the function's definition — a placeholder that becomes a local variable when the function runs. An argument is the actual value supplied at the call site. In add(int a, int b), a and b are parameters; in add(2, 3), the 2 and 3 are arguments. The terms get used interchangeably in conversation, but keeping them apart makes error messages much easier to read.

<!-- @doubt -->
### Why does my Python function remember values from previous calls?

<!-- @answer -->
Because you used a mutable default such as an empty list or dict. Default values are evaluated once, when the def statement executes — not on each call. That single object is then shared by every call that omits the argument, so appending to it mutates the shared default permanently. Use None as the default and create the real object inside the function body. Immutable defaults like numbers, strings and None are never affected, since nothing can mutate them.

<!-- @doubt -->
### Does Java have default arguments?

<!-- @answer -->
No, and there is no workaround at the syntax level. Java's approach is method overloading: write several versions with different parameter counts, and have the shorter ones call the fullest one with the values you would have defaulted. It is more code for the same effect, and it is why Java APIs often have three or four versions of the same method name. Overloading is covered in its own subtopic.

<!-- @doubt -->
### Why must default arguments be the rightmost parameters?

<!-- @answer -->
Because arguments bind by position. If a defaulted parameter sat in the middle, a call supplying fewer arguments would be ambiguous — the language could not tell whether you meant to skip the defaulted one or the one after it. Requiring defaults on the right makes every partial call unambiguous. Python's keyword arguments sidestep the issue by letting you name the parameter you want to fill.

<!-- @doubt -->
### Can a function return more than one value?

<!-- @answer -->
Strictly, no — a function returns exactly one thing. What varies is how conveniently each language lets you package several values into that one thing. Python builds a tuple, and comma-separated returns with unpacking make it look like multiple returns. C++ uses pair, tuple, or a struct, with structured bindings unpacking them cleanly since C++17. Java uses an array for same-typed values, or a record for mixed ones.

<!-- @doubt -->
### Should I return a pair or define a struct?

<!-- @answer -->
Define a struct or record whenever the values mean different things. A pair<int, string> tells the reader nothing about what the int and the string are, so every call site depends on remembering. A type with named fields documents itself, survives someone adding a third value later, and makes the code readable without consulting the function. Reach for a bare pair only when the two values are genuinely interchangeable in meaning, such as a minimum and a maximum.

<!-- @doubt -->
### How do I avoid mixing up arguments of the same type?

<!-- @answer -->
In Python, pass them as keyword arguments — divide(numerator=3, denominator=12) is unambiguous and self-documenting. C++ and Java have no keyword arguments, so the options are to keep parameter lists short, order them so a swap would be obviously wrong, or bundle related values into a struct or object whose fields have names. A function taking four ints in a row is a bug waiting to happen in any language.

<!-- @doubt -->
### What happens if I pass the wrong number of arguments?

<!-- @answer -->
C++ and Java reject it at compile time, so the program never builds. Python raises a TypeError at the moment of the call, since nothing is checked in advance — which means a rarely-taken branch containing a bad call can sit undetected until it runs. That is a genuine argument for testing every path in Python, where the compiler is not doing that checking for you.
